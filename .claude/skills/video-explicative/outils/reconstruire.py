#!/usr/bin/env python3
# Montage officiel SANS ses sous-titres : refait l'image du montage Canva de l'utilisateur à partir des plans propres (sans texte).
# Usage : python3 -I reconstruire.py <montage.mp4> <sortie.mp4> <plan.mp4> [<plan.mp4> ...]
#   Le montage Canva (export mp4) est la version validée : son SON est gardé tel quel (ramené à −14 LUFS, crête −1 dBFS) et son
#   minutage aussi (coupes, vitesse, ordre). Pour chaque image du montage, on retrouve l'image identique d'un plan (comparaison de
#   vignettes sur le haut de l'image, au-dessus des sous-titres, coin du logo exclu) et on la recopie en pleine résolution : les
#   sous-titres et le logo de Canva disparaissent. Une image sans équivalent dans les plans (carton de fin Clark, fondu, plan
#   retouché dans Canva) est gardée telle quelle depuis le montage ; le script en donne la liste par tranches.
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
choix = []                                    # par image du montage : (plan, image) ou None
for t in range(len(vm)):
    best = (1e9, None, None)
    for i, p in enumerate(vp):
        d = np.abs(p - vm[t]).mean(axis=(1, 2)); k = int(d.argmin())
        if d[k] < best[0]: best = (float(d[k]), i, k)
    choix.append((best[1], best[2]) if best[0] < SEUIL else None)

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
garde = []
for t, c in enumerate(choix):
    im_m = lm.stdout.read(W * H * 3)
    if c is None:
        enc.stdin.write(im_m); garde.append(t)
    else:
        enc.stdin.write(image_plan(*c))
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
    dedans = t < len(choix) and choix[t] is None
    if dedans and debut is None: debut = t
    if not dedans and debut is not None: tranches.append((debut / 30, t / 30)); debut = None
print(f'→ {SORTIE} : {len(choix)} images, {len(choix) - len(garde)} refaites depuis les plans, {len(garde)} gardées du montage'
      + ''.join(f'\n   gardé du montage : {a:.2f}–{b:.2f} s' for a, b in tranches) + f'\n   son du montage, gain {g:+.2f} dB')
