#!/usr/bin/env python3
# Richesse du décor d'un plan (souhait de l'utilisateur, 19/10 : « des décors plus détaillés, riches et animés »).
#   python3 -I decor.py <pN.mp4>          (lancé par produire.sh sur le rendu muet)
# Mesure dans la zone du décor (x 140–940, y 170–880, au-dessus des têtes) :
#   détail = part des pixels sur un contour (moyenne d'une image sur 15) ; vie = part des images où quelque chose bouge.
# Repères relevés le 19/10 : autruche (enclos nu) 9 %, Fleming 15–19 %, paris-brest p1 (boutique) 27 % ; plan de Vinci figé
# 7 s (vie 0 %). Seuils : détail ≥ 14 % et vie ≥ 60 % des images, sinon ligne ATTENTION (sans blocage, à corriger : plus
# de couches et d'accessoires d'époque, et des animations d'ambiance continues du kit : M.flamme, M.fumee, M.pendule,
# M.voilage, M.nuages, M.passants, M.poussiere, M.oiseaux…).
import subprocess, sys, numpy as np
W, H = 270, 480
Y0, Y1, X0, X1 = 170 // 4, 880 // 4, 140 // 4, 940 // 4
SEUIL_DETAIL, SEUIL_VIE = 14.0, 60.0
f = sys.argv[1]
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
prev, det, mv, i = None, [], [], 0
while True:
    b = p.stdout.read(W * H)
    if len(b) < W * H: break
    g = np.frombuffer(b, np.uint8).reshape(H, W)[Y0:Y1, X0:X1].astype(np.float32)
    if i % 15 == 0:
        gx, gy = np.abs(np.diff(g, axis=1)), np.abs(np.diff(g, axis=0))
        det.append(((gx[:-1] > 12) | (gy[:, :-1] > 12)).mean())
    if prev is not None: mv.append((np.abs(g - prev) > 6).mean())
    prev, i = g, i + 1
if not det:
    print('ATTENTION décor : vidéo illisible'); sys.exit(0)
d, v = 100 * float(np.mean(det)), 100 * float(np.mean(np.array(mv) > 0.002)) if mv else 0.0
ok = d >= SEUIL_DETAIL and v >= SEUIL_VIE
print(f"{'OK  ' if ok else 'ATTENTION'} décor : détail {d:.0f} % (≥ {SEUIL_DETAIL:.0f}), vie {v:.0f} % des images (≥ {SEUIL_VIE:.0f})"
      + ('' if ok else ' → ' + ' ; '.join(x for x in [
          'décor pauvre : plus de couches (toile peinte, plan intermédiaire, coulisses) et d\'accessoires d\'époque' if d < SEUIL_DETAIL else '',
          'décor figé : au moins 3 animations d\'ambiance continues en temps global (M.flamme, M.fumee, M.pendule, M.voilage, M.nuages, M.passants, M.poussiere, M.oiseaux…)' if v < SEUIL_VIE else ''] if x)))
