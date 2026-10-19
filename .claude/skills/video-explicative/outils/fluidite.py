#!/usr/bin/env python3
# Fluidité d'une vidéo : rideau naturel et coupes sans saut (souhait de l'utilisateur, 19/10 : « que tout soit naturel et fluide »).
# Usage : python3 -I fluidite.py <dossier_video>              conduite du rideau (rideau.json) + toutes les coupes p1→p2 … p5→p6
#         python3 -I fluidite.py <dossier_video> --rideau     conduite seulement (juste après l'écriture de la fiche, avant tout rendu)
#         python3 -I fluidite.py <dossier_video> --coupe N    la coupe p(N-1) → pN seulement (appelé par raccord.sh)
# Sortie : une ligne OK / ÉCHEC par contrôle ; code 2 s'il y a un ÉCHEC (à corriger avant la livraison).
#
# 1. Conduite du rideau (rideau.json, durées des plans dans durees.json) — un rideau de théâtre se manœuvre à la main, sans à-coup :
#    - ouverture du plan 1 : 0,9 à 1,6 s ;
#    - « change » : fermeture et réouverture ≥ 0,5 s chacune (conseillé 0,6 à 0,8 s), fermé 0,2 à 0,7 s (la coupe tombe dans cet intervalle
#      si le change est à cheval) ;
#    - « demi » : chaque mouvement ≥ 0,45 s ;
#    - fermeture finale (plan 6) : ≥ 0,8 s, finie au moins 0,25 s avant la fin du plan 6 (dernière image rideau fermé, puis la conclusion) ;
#    - deux mouvements séparés d'au moins 0,3 s.
#    Leçon de la tulipomanie : fermetures en 0,27 s, le rideau « claque » au lieu de se fermer.
# 2. Coupes : la dernière image de p(N-1) et la première de pN doivent se suivre comme deux images d'un même plan. On compare l'écart
#    à la coupe avec le mouvement normal des 4 images de part et d'autre : écart > 0,5 ET > 4 × ce mouvement = saut (pose, décor ou
#    objet qui change d'un coup ; tulipomanie p5 → p6 : marchand et fenêtre déplacés, écart 2,5 pour un mouvement de 0,1). SSIM
#    (raccord.sh) ne le voit pas : il reste au-dessus de 0,92 pour un personnage qui change de pose.
import json, os, subprocess, sys
try:
    import numpy as np
except ImportError:  # python3 sans numpy (routines) : relance avec le python3 système, qui l'a
    if os.environ.get('CLARK_PY_RELANCE') or not os.path.exists('/usr/bin/python3'): raise
    os.environ['CLARK_PY_RELANCE'] = '1'
    os.execv('/usr/bin/python3', ['/usr/bin/python3'] + list(getattr(sys, 'orig_argv', [sys.executable] + sys.argv))[1:])

V = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else sys.exit(__doc__ or 'usage : fluidite.py <dossier_video> [--rideau | --coupe N]')
MODE = sys.argv[2] if len(sys.argv) > 2 else ''
echecs = 0
def ligne(ok, texte):
    global echecs
    echecs += not ok
    print(('OK    ' if ok else 'ÉCHEC ') + texte)

def durees():
    f = os.path.join(V, 'durees.json')
    if not os.path.exists(f): return None
    d = json.load(open(f))
    d = d.get('durees', d) if isinstance(d, dict) else d
    if isinstance(d, dict): d = [d[k] for k in sorted(d, key=lambda k: int(''.join(c for c in k if c.isdigit()) or 0))]
    return [float(x) for x in d]

def conduite():
    f = os.path.join(V, 'rideau.json')
    if not os.path.exists(f): print('INFO  pas de rideau.json : conduite non contrôlée'); return
    D = durees()
    debut = [0.0] + list(np.cumsum(D)) if D else None
    def glob(q, k):
        if q.get(k) is None: return None
        if q.get('plan') and debut: return debut[int(q['plan']) - 1] + float(q[k])
        return float(q[k])
    cues = json.load(open(f)).get('cues', [])
    mouvements = []                                            # (début, fin, nom)
    for q in cues:
        a, b, c, d = (glob(q, k) for k in 'abcd')
        nom = f"{q.get('type')} plan {q.get('plan', '?')} ({q.get('a')}–{q.get('d', q.get('b'))} s)"
        t = q.get('type')
        if t == 'ouvre':
            ligne(0.9 <= b - a <= 1.6, f'{nom} : ouverture en {b - a:.2f} s (0,9 à 1,6 s)')
            mouvements.append((a, b, nom))
        elif t == 'ferme':
            ok = b - a >= 0.8
            fin = f' ; finie {debut[-1] - b:.2f} s avant la fin du plan 6 (≥ 0,25 s)' if debut else ''
            if debut: ok = ok and debut[-1] - b >= 0.25
            ligne(ok, f'{nom} : fermeture en {b - a:.2f} s (≥ 0,8 s){fin}')
            mouvements.append((a, b, nom))
        elif t == 'change':
            ok = b - a >= 0.5 and 0.2 <= c - b <= 0.7 and d - c >= 0.5
            coupe = ''
            if debut:
                dedans = [x for x in debut[1:-1] if a - 0.01 < x < d + 0.01]
                if dedans:
                    ok = ok and all(b - 0.01 <= x <= c + 0.01 for x in dedans)
                    coupe = f' ; coupe à {dedans[0]:.2f} s ' + ('rideau fermé' if all(b - 0.01 <= x <= c + 0.01 for x in dedans) else 'PENDANT un mouvement')
            ligne(ok, f'{nom} : ferme en {b - a:.2f} s (≥ 0,5), fermé {c - b:.2f} s (0,2 à 0,7), rouvre en {d - c:.2f} s (≥ 0,5){coupe}')
            mouvements += [(a, b, nom), (c, d, nom)]
        elif t == 'demi':
            ligne(b - a >= 0.45 and d - c >= 0.45, f'{nom} : se resserre en {b - a:.2f} s, se rouvre en {d - c:.2f} s (≥ 0,45 s chacun)')
            mouvements += [(a, b, nom), (c, d, nom)]
    mouvements.sort()
    for (a1, b1, n1), (a2, b2, n2) in zip(mouvements, mouvements[1:]):
        if n1 != n2 and a2 - b1 < 0.3: ligne(False, f'{n1} puis {n2} : {a2 - b1:.2f} s entre deux mouvements (≥ 0,3 s)')
    if debut and not any(q.get('type') == 'ferme' for q in cues): ligne(False, 'pas de fermeture du rideau à la fin du plan 6')
    if debut and not any(q.get('type') == 'ouvre' for q in cues): ligne(False, "pas d'ouverture du rideau au début du plan 1")

def vignettes(f, fin=False):
    cmd = ['ffmpeg', '-v', 'error'] + (['-sseof', '-0.4'] if fin else []) + ['-i', f, '-vf', 'scale=108:192,format=gray']
    cmd += ([] if fin else ['-frames:v', '12']) + ['-f', 'rawvideo', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 192, 108).astype(np.float32)

def coupe(n):
    a = os.path.join(V, 'out', f'p{n - 1}', f'p{n - 1}_final.mp4'); b = os.path.join(V, 'out', f'p{n}', f'p{n}_final.mp4')
    if not (os.path.exists(a) and os.path.exists(b)): print(f'INFO  coupe p{n - 1} → p{n} non contrôlée (plan manquant)'); return
    va, vb = vignettes(a, True)[-5:], vignettes(b)[:5]
    ecart = lambda x, y: float(np.abs(x - y).mean())
    autour = [ecart(va[i], va[i + 1]) for i in range(len(va) - 1)] + [ecart(vb[i], vb[i + 1]) for i in range(len(vb) - 1)]
    normal, saut = float(np.median(autour)), ecart(va[-1], vb[0])
    ok = not (saut > 0.5 and saut > 4 * max(normal, 0.05))
    quoi = ''
    if not ok:
        diff = np.abs(va[-1] - vb[0])
        lumiere = abs(float(va[-1].mean() - vb[0].mean()))
        ys, xs = np.where(diff > 25)
        zone = f'zone x {xs.min() * 10}–{xs.max() * 10 + 10}, y {ys.min() * 10}–{ys.max() * 10 + 10}' if len(xs) else 'diffuse'
        quoi = (f' → saut d\'image ({zone}' + (f' ; lumière de la scène qui change d\'un coup : {lumiere:.1f}' if lumiere > 0.5 else '')
                + f') : la dernière image de p{n - 1} et la première de p{n} doivent être identiques (poses, objets, décor, lumière) ; '
                f'reprendre la fin de p{n - 1} ou le début de p{n} sur raccords/p{n - 1}.js, puis relancer produire.sh et ce contrôle')
    ligne(ok, f'coupe p{n - 1} → p{n} : écart {saut:.2f} à la coupe, mouvement normal {normal:.2f}' + quoi)

if MODE == '--coupe':
    coupe(int(sys.argv[3]))
else:
    conduite()
    if MODE != '--rideau':
        for n in range(2, 7): coupe(n)
sys.exit(2 if echecs else 0)
