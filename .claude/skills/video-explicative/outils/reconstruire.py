#!/usr/bin/env python3
# Montage officiel SANS ses sous-titres : refait l'image du montage Canva de l'utilisateur à partir des plans propres (sans texte).
# Usage : python3 -I reconstruire.py <montage.mp4> <sortie.mp4> <plan.mp4> [<plan.mp4> ...]
#   Le montage Canva (export mp4) est la version validée : son SON est gardé tel quel (ramené à −14 LUFS, crête −1 dBFS) et son
#   minutage aussi (coupes, vitesse, ordre). Pour chaque image du montage, on retrouve l'image identique d'un plan (comparaison de
#   vignettes sur le haut de l'image, au-dessus des sous-titres, coin du logo exclu) et on la recopie en pleine résolution : les
#   sous-titres et le logo de Canva disparaissent. Une image sans équivalent dans les plans (carton de fin Clark, fondu, plan
#   retouché dans Canva) est gardée telle quelle depuis le montage ; le script en donne la liste par tranches. Exception : une
#   tranche courte (≤ 1,5 s) entre deux images retrouvées est un fondu enchaîné de Canva, refait en fondu sans texte.
# Les plans peuvent contenir ou non la voix : seule leur image sert.
import os, subprocess, sys
import numpy as np

M, SORTIE, PLANS = sys.argv[1], sys.argv[2], sys.argv[3:]
OUTILS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, OUTILS)
from sfx_lib import VOIX_LUFS, sonie

W, H, SEUIL = 1080, 1920, 6.0
def vignettes(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', 'fps=30,scale=54:96,format=gray', '-f', 'rawvideo', '-'],
                         capture_output=True, check=True).stdout
    v = np.frombuffer(raw, np.uint8).reshape(-1, 96, 54)[:, :64, :].astype(np.float32)   # y < 1280 : au-dessus des sous-titres
    v[:, :8, :10] = 0                                                                     # coin haut gauche : logo du montage
    return v
def lecteur(f):
    return subprocess.Popen(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'fps=30,scale={W}:{H},format=rgb24', '-f', 'rawvideo', '-'],
                            stdout=subprocess.PIPE)

vm = vignettes(M)
vp = [vignettes(p) for p in PLANS]
dist = [np.stack([np.abs(p - vm[t]).mean(axis=(1, 2)) for t in range(len(vm))]) for p in vp]   # par plan : (images montage, images plan)
libre = []                                    # par image du montage : meilleure image, prise seule : (plan, image) ou None
for t in range(len(vm)):
    best = (1e9, None, None)
    for i, d in enumerate(dist):
        k = int(d[t].argmin())
        if d[t, k] < best[0]: best = (float(d[t, k]), i, k)
    libre.append((best[1], best[2]) if best[0] < SEUIL else None)

# Les plans bougent lentement (beaucoup d'images voisines presque identiques) : l'image la plus proche, prise une à une, va et
# vient d'une image à l'autre et la vidéo saccade. On impose donc à chaque passage d'un plan une avance régulière,
# image = k0 + vitesse × t (Canva change parfois la vitesse d'un plan : 0,8 à 1,2), ajustée sur tout le passage.
def ajuste(i, a, b):                          # passage du plan i sur les images a..b-1 du montage → (coût, vitesse, k0)
    d, ts = dist[i][a:b], np.arange(b - a)
    kl = d.argmin(axis=1); best = (1e9, 1.0, 0.0)
    for s in np.arange(0.80, 1.2001, 0.005):
        m = np.median(kl - s * ts)
        for k0 in m + np.arange(-15, 15.5, 0.5):
            ks = np.rint(k0 + s * ts).astype(int); ok = (ks >= 0) & (ks < d.shape[1])
            c = np.where(ok, d[ts, np.clip(ks, 0, d.shape[1] - 1)], 50).mean()
            if c < best[0]: best = (float(c), float(s), float(k0))
    return best
def image_ajustee(i, a, s, k0, t):
    return int(np.clip(np.rint(k0 + s * (t - a)), 0, len(vp[i]) - 1))
passages = []                                 # [plan, début, fin] : suites d'images retrouvées dans un même plan
for t, c in enumerate(libre):
    if c is None: continue
    if passages and passages[-1][0] == c[0] and passages[-1][2] >= t - 3: passages[-1][2] = t + 1
    else: passages.append([c[0], t, t + 1])
COURT = 10                                    # un passage plus court est du bruit (rideau, ciel) : rendu au voisin
while any(b - a < COURT for _, a, b in passages) and len(passages) > 1:
    j = min(range(len(passages)), key=lambda j: passages[j][2] - passages[j][1])
    if passages[j][2] - passages[j][1] >= COURT: break
    a, b = passages[j][1], passages[j][2]
    if j > 0 and (j == len(passages) - 1 or passages[j - 1][2] >= passages[j + 1][1] - (b - a) - 3) and passages[j - 1][2] >= a - 3:
        passages[j - 1][2] = b
    elif j < len(passages) - 1 and passages[j + 1][1] <= b + 3: passages[j + 1][1] = a
    passages.pop(j)
    fus = []                                  # deux passages voisins du même plan redeviennent un seul
    for p in passages:
        if fus and fus[-1][0] == p[0] and fus[-1][2] >= p[1] - 3: fus[-1][2] = p[2]
        else: fus.append(p)
    passages = fus
fits = [ajuste(*p) for p in passages]
for j in range(len(passages) - 1):            # coupe exacte entre deux passages contigus : là où les deux ajustements se valent
    (i1, a1, b1), (i2, a2, b2) = passages[j], passages[j + 1]
    if a2 - b1 > 3: continue
    _, s1, k1 = fits[j]; _, s2, k2 = fits[j + 1]
    lo, hi = max(a1 + 1, b1 - 15), min(b2 - 1, a2 + 15)
    cout = lambda c: (sum(dist[i1][t, image_ajustee(i1, a1, s1, k1, t)] for t in range(lo, c))
                      + sum(dist[i2][t, image_ajustee(i2, a2, s2, k2, t)] for t in range(c, hi)))
    c = min(range(lo, hi + 1), key=cout)
    k2 = k2 + s2 * (c - a2)                   # même droite, origine déplacée en c
    passages[j][2], passages[j + 1][1] = c, c; fits[j + 1] = (fits[j + 1][0], s2, k2)
choix = [None] * len(vm)                      # par image du montage : (plan, image) ou None
for (i, a, b), (_, s, k0) in zip(passages, fits):
    print(f'   plan {os.path.basename(PLANS[i])} : {a / 30:.2f}–{b / 30:.2f} s, vitesse ×{s:.3f}')
    for t in range(a, b):
        k = image_ajustee(i, a, s, k0, t)
        if dist[i][t, k] < SEUIL: choix[t] = (i, k)
        elif libre[t] and libre[t][0] == i: choix[t] = libre[t]   # passage que Canva a accéléré par endroits (rideau)

# Image : on parcourt le montage et chaque plan dans l'ordre, une image à la fois (mémoire faible).
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '30', '-i', '-',
                        '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', SORTIE + '.image.mp4'], stdin=subprocess.PIPE)
lm = lecteur(M)
etat = {}                                     # plan -> [processus, position, dernière image]
def image_plan(i, k):
    e = etat.get(i)
    if e is None or k < e[1] - 1:
        if e: e[0].kill()
        e = etat[i] = [lecteur(PLANS[i]), 0, None]
    while e[1] <= k:
        e[2] = e[0].stdout.read(W * H * 3); e[1] += 1
    return e[2]
# Tranche courte sans équivalent ENTRE deux images retrouvées = fondu enchaîné de Canva (il montre déjà le sous-titre suivant) :
# on la refait en fondu entre la dernière image retrouvée et la suivante, sans texte. Seules les tranches longues ou en bout
# de vidéo (carton de fin Clark) sont gardées telles quelles du montage.
FONDU_MAX = 45   # images (1,5 s)
fondu = {}
t = 0
while t < len(choix):
    if choix[t] is None:
        f = t
        while f < len(choix) and choix[f] is None: f += 1
        if t > 0 and f < len(choix) and f - t <= FONDU_MAX:
            for u in range(t, f): fondu[u] = (t, f)
        t = f
    else:
        t += 1
garde, fondus, precedente, cible = [], 0, None, None
for t, c in enumerate(choix):
    im_m = lm.stdout.read(W * H * 3)
    if t in fondu:
        a, b = fondu[t]
        if t == a: cible = np.frombuffer(image_plan(*choix[b]), np.uint8).astype(np.float32)
        x = (t - a + 1) / (b - a + 1)
        im = ((1 - x) * np.frombuffer(precedente, np.uint8).astype(np.float32) + x * cible).round().astype(np.uint8).tobytes()
        fondus += 1
    elif c is None:
        im = im_m; garde.append(t)
    else:
        im = image_plan(*c)
    enc.stdin.write(im); precedente = im
enc.stdin.close(); enc.wait(); lm.kill()
for e in etat.values(): e[0].kill()

# Son du montage, tel quel, ramené au niveau de livraison.
g = VOIX_LUFS - sonie(M)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SORTIE + '.image.mp4', '-i', M, '-map', '0:v', '-map', '1:a',
                '-af', f'volume={g:.2f}dB,alimiter=limit=0.891:level=false', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ac', '2',
                '-shortest', '-movflags', '+faststart', SORTIE], check=True)
os.remove(SORTIE + '.image.mp4')
tranches, debut = [], None
for t in range(len(choix) + 1):
    dedans = t < len(choix) and choix[t] is None and t not in fondu
    if dedans and debut is None: debut = t
    if not dedans and debut is not None: tranches.append((debut / 30, t / 30)); debut = None
print(f'→ {SORTIE} : {len(choix)} images, {len(choix) - len(garde) - fondus} refaites depuis les plans, {fondus} en fondu refait, {len(garde)} gardées du montage'
      + ''.join(f'\n   gardé du montage : {a:.2f}–{b:.2f} s' for a, b in tranches) + f'\n   son du montage, gain {g:+.2f} dB')
