#!/usr/bin/env python3
# Contrôle visuel automatique d'un plan : sauts brusques et fond nu de la scène.
# Usage : python3 -I sauts.py <video.mp4>      (sortie 0 dans tous les cas : les ATTENTION ne bloquent pas)
#
#  - saut : une cellule de la grille dont la différence à l'image précédente dépasse nettement et son seuil absolu et
#    les différences voisines (k-1→k et k+1→k+2) : un accessoire qui surgit ou disparaît, pas un mouvement continu.
#  - fond nu : zone d'un seul tenant, noir pur (le canevas n'est jamais repeint : sans décor, la scène reste noire,
#    éclairée seulement par les projecteurs), d'au moins 3 % de la zone de scène, visible 2 images ou plus.
# Limite : une scène de nuit entièrement noire déclenche le contrôle de fond nu (à vérifier à l'œil).
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np

FPS = 30
W, H, S = 270, 480, 4                 # image réduite ; S = facteur vers 1080×1920
B = 6                                 # bloc de base 6×6 px réduits (= 24 px réels) ; les cellules font 2×2 blocs
ZX0, ZX1, ZY0, ZY1 = 46, 1034, 150, 1395          # zone de scène (px réels)
SAUT_ABS = 14.0                       # écart moyen (0-255) minimal d'une cellule à l'image k
SAUT_RAYON = 3                        # voisinage (cellules de 48 px) où les écarts voisins comptent
SAUT_RATIO = 3.0                      # … et au moins 3 × ses écarts aux images voisines
NU_NOIR = 6                           # gris ≤ 6 : fond nu (noir)
NU_SURFACE = 0.03                     # fraction minimale de la zone de scène
NU_IMAGES = 2
MAX_LIGNES = 6


def decoder(video):
    cmd = ['ffmpeg', '-v', 'error', '-i', video, '-an', '-vf', f'scale={W}:{H}:flags=area,format=gray',
           '-f', 'rawvideo', '-pix_fmt', 'gray', '-']
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0 or not r.stdout:
        print('ATTENTION sauts.py : décodage impossible de ' + video + ' ' + r.stderr.decode(errors='replace')[:200])
        return None
    n = len(r.stdout) // (W * H)
    return np.frombuffer(r.stdout, np.uint8, n * W * H).reshape(n, H, W)


def t_fr(f):
    return f'{f / FPS:.2f}'.replace('.', ',')


def duree(f0, f1):
    return f'{t_fr(f0)} s' if f0 == f1 else f'{t_fr(f0)}–{t_fr(f1)} s'


def regrouper(alertes):
    """alertes : {image: (x0, y0, x1, y1)} → liste de (image0, image1, bbox) pour les images consécutives."""
    out = []
    for f in sorted(alertes):
        bb = alertes[f]
        if out and out[-1][1] == f - 1:
            o = out[-1]
            out[-1] = (o[0], f, (min(o[2][0], bb[0]), min(o[2][1], bb[1]), max(o[2][2], bb[2]), max(o[2][3], bb[3])))
        else:
            out.append((f, f, bb))
    return out


def afficher(lignes, ok):
    if not lignes:
        print(ok)
        return
    for l in lignes[:MAX_LIGNES]:
        print(l)
    if len(lignes) > MAX_LIGNES:
        print(f'ATTENTION … et {len(lignes) - MAX_LIGNES} autre(s) du même type')


def dilater(m, r):
    """maximum local sur un voisinage carré de rayon r cellules (un mouvement continu déplace ses bords d'une cellule par image :
    ses écarts voisins sont forts juste à côté ; un saut, lui, est seul)."""
    h, w = m.shape
    p = np.pad(m, r, mode='edge')
    out = np.zeros_like(m)
    for dy in range(2 * r + 1):
        for dx in range(2 * r + 1):
            out = np.maximum(out, p[dy:dy + h, dx:dx + w])
    return out


def sauts(a):
    n = len(a)
    gh, gw = H // B, W // B
    # écart moyen par bloc entre l'image k et k-1, k = 1..n-1  → d[k-1]
    d = np.empty((n - 1, gh, gw), np.float32)
    for k in range(1, n):
        diff = np.abs(a[k].astype(np.int16) - a[k - 1].astype(np.int16)).astype(np.float32)
        d[k - 1] = diff.reshape(gh, B, gw, B).mean(axis=(1, 3))
    c = (d[:, :-1, :-1] + d[:, 1:, :-1] + d[:, :-1, 1:] + d[:, 1:, 1:]) / 4     # cellules 2×2 blocs, recouvrement 50 %
    alertes = {}
    # k = image de l'apparition : écart c[k-1] ; voisins c[k-2] (k-1→k-2) et c[k] (k+1→k) ; l'image 0 est ignorée (k ≥ 2)
    for k in range(2, n - 1):
        cur, av, ap = c[k - 1], c[k - 2], c[k]
        hit = (cur > SAUT_ABS) & (cur > SAUT_RATIO * dilater(np.maximum(av, ap), SAUT_RAYON))
        if hit.any():
            ys, xs = np.nonzero(hit)
            alertes[k] = (int(xs.min()) * B * S, int(ys.min()) * B * S, (int(xs.max()) + 2) * B * S, (int(ys.max()) + 2) * B * S)
    lignes = [f'ATTENTION saut à {duree(f0, f1)} (zone x {bb[0]}–{bb[2]}, y {bb[1]}–{bb[3]})' for f0, f1, bb in regrouper(alertes)]
    afficher(lignes, 'OK   aucun saut brusque')


def composantes(m):
    """plus grande composante 4-connexe d'un masque booléen 2D → (taille, (x0, y0, x1, y1))."""
    seen = np.zeros_like(m)
    best = (0, None)
    h, w = m.shape
    for y0, x0 in zip(*np.nonzero(m)):
        if seen[y0, x0]:
            continue
        pile = [(y0, x0)]; seen[y0, x0] = True
        cnt = 0; bx0 = bx1 = x0; by0 = by1 = y0
        while pile:
            y, x = pile.pop(); cnt += 1
            bx0 = min(bx0, x); bx1 = max(bx1, x); by0 = min(by0, y); by1 = max(by1, y)
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < h and 0 <= xx < w and m[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True; pile.append((yy, xx))
        if cnt > best[0]:
            best = (cnt, (bx0, by0, bx1, by1))
    return best


def fond_nu(a):
    x0, x1, y0, y1 = ZX0 // S, ZX1 // S, ZY0 // S, ZY1 // S
    # blocs de 8×8 px réduits entièrement noirs
    bx0, bx1, by0, by1 = x0 // B, x1 // B, y0 // B, y1 // B
    z = a[:, by0 * B:by1 * B, bx0 * B:bx1 * B]
    noir = (z <= NU_NOIR).reshape(len(a), by1 - by0, B, bx1 - bx0, B).mean(axis=(2, 4)) > 0.9
    seuil = NU_SURFACE * noir.shape[1] * noir.shape[2]
    alertes = {}
    for k in range(len(a)):
        if noir[k].sum() < seuil:
            continue
        cnt, bb = composantes(noir[k])
        if cnt >= seuil:
            alertes[k] = ((bx0 + bb[0]) * B * S, (by0 + bb[1]) * B * S, (bx0 + bb[2] + 1) * B * S, (by0 + bb[3] + 1) * B * S)
    lignes = []
    for f0, f1, bb in regrouper(alertes):
        if f1 - f0 + 1 >= NU_IMAGES:
            lignes.append(f'ATTENTION fond nu visible {duree(f0, f1)} (zone x {bb[0]}–{bb[2]}, y {bb[1]}–{bb[3]})')
    afficher(lignes, 'OK   pas de fond nu visible')


def main():
    if len(sys.argv) != 2:
        print('usage : python3 -I sauts.py <video.mp4>')
        return
    a = decoder(sys.argv[1])
    if a is None or len(a) < 4:
        return
    sauts(a)
    fond_nu(a)


if __name__ == '__main__':
    main()
