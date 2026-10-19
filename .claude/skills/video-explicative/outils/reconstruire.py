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
# Chemin le plus probable (Viterbi) plutôt que la meilleure image isolée : sur un décor immobile, des images de plans différents
# se ressemblent à 0,1 près (ex. fin du plan 4 et début du plan 5 sur le même décor), et le choix image par image saute d'un plan
# à l'autre ou fige l'image. Dans un plan, on avance d'une image par image du montage (tenir ou sauter une image : petit coût) ;
# changer de plan ou de position (coupe de Canva) coûte SAUT ; l'état « sans équivalent » (carton, fondu) coûte SEUIL.
SAUT, PAS = 30.0, 0.3
debuts = np.cumsum([0] + [len(p) for p in vp])
toutes = np.concatenate(vp)                   # états 0..N-1 : images des plans ; état N : sans équivalent
N, T = len(toutes), len(vm)
debut_plan = np.zeros(N, bool); debut_plan[debuts[:-1]] = True
dist = np.empty((T, N + 1), np.float32)
for t in range(T):
    dist[t, :N] = np.abs(toutes - vm[t]).mean(axis=(1, 2)); dist[t, N] = SEUIL
cout = dist[0].copy(); retour = np.zeros((T, N + 1), np.int32)
for t in range(1, T):
    j = int(cout.argmin()); cands = [(np.full(N + 1, cout[j] + SAUT, np.float32), np.full(N + 1, j))]                 # coupe : depuis le meilleur état
    tenir = cout + PAS; tenir[N] = cout[N]; cands.append((tenir, np.arange(N + 1)))     # tenir l'image (ou rester sans équivalent)
    for s, c in ((1, 0.0), (2, PAS)):                                                  # avancer d'une ou deux images dans le plan
        a = np.full(N + 1, np.inf, np.float32); a[s:N] = cout[:N - s] + c
        for q in range(s): a[:N][np.roll(debut_plan, q)] = np.inf                       # pas de passage d'un plan à l'autre
        src = np.arange(N + 1) - s; cands.append((a, src))
    vals = np.stack([c for c, _ in cands]); k = vals.argmin(axis=0)
    retour[t] = np.stack([s for _, s in cands])[k, np.arange(N + 1)]
    cout = vals[k, np.arange(N + 1)] + dist[t]
chemin = [int(cout.argmin())]
for t in range(T - 1, 0, -1): chemin.append(int(retour[t, chemin[-1]]))
chemin.reverse()
choix = []                                    # par image du montage : (plan, image) ou None
for t, e in enumerate(chemin):
    if e == N or dist[t, e] >= SEUIL: choix.append(None); continue
    i = int(np.searchsorted(debuts, e, side='right') - 1); choix.append((i, int(e - debuts[i])))
# Bords des fondus Canva : en début et en fin de fondu, l'image du montage s'éloigne déjà du plan (écart qui monte) mais reste sous
# SEUIL ; le chemin y tient alors la même image plusieurs fois (petit arrêt avant le fondu refait). Ces images rejoignent le fondu.
ecarts = np.array([dist[t, debuts[c[0]] + c[1]] for t, c in enumerate(choix) if c])
BORD = max(3.0, 1.6 * float(np.median(ecarts))) if len(ecarts) else SEUIL
def ecart(t): return dist[t, debuts[choix[t][0]] + choix[t][1]]
for t in [t for t in range(1, len(choix)) if choix[t] is None and choix[t - 1]]:
    u = t - 1
    while u > 0 and choix[u] and ecart(u) > BORD: choix[u] = None; u -= 1
for t in [t for t in range(len(choix) - 1) if choix[t] is None and choix[t + 1]]:
    u = t + 1
    while u < len(choix) - 1 and choix[u] and ecart(u) > BORD: choix[u] = None; u += 1

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

# Fluidité (la planche, image fixe, ne voit pas une saccade) : sur les images refaites, la vidéo doit bouger comme le montage.
#  - image figée alors que le montage bouge (écart de vignette nul dans la sortie, > 0,5 dans le montage) : au plus 6 en tout.
#    (On ne compare pas le NOMBRE d'images figées : la compression de Canva fait bouger d'un rien ses images immobiles, alors que
#    les images identiques des plans restent identiques ; ce compte-là donne de fausses alertes.)
#  - retours en arrière dans un plan : aucun ; bonds de plus de 3 images dans un plan (hors coupe) : au plus 3.
refaites = [t for t in range(1, len(choix)) if choix[t] and choix[t - 1]]
def vig(c): return vp[c[0]][c[1]]
figees = [t for t in refaites if np.abs(vig(choix[t]) - vig(choix[t - 1])).mean() < 0.02 and np.abs(vm[t] - vm[t - 1]).mean() > 0.5]
meme = [t for t in refaites if choix[t][0] == choix[t - 1][0]]
retours = [t for t in meme if choix[t][1] < choix[t - 1][1]]
bonds = [t for t in meme if choix[t][1] - choix[t - 1][1] > 3]
ok = len(figees) <= 6 and not retours and len(bonds) <= 3
print(f'{"OK   " if ok else "ÉCHEC"} fluidité : {len(figees)} images figées quand le montage bouge, {len(retours)} retours en arrière, {len(bonds)} bonds'
      + ''.join(f'\n   à {t / 30:.2f} s : {"retour" if t in retours else "bond" if t in bonds else "figée"}' for t in sorted(retours + bonds + figees)[:12]))
if not ok: sys.exit(2)
