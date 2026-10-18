#!/usr/bin/env python3
# Durée d'un plan = durée de sa voix. Lancé par construire.sh : python3 -I duree.py <dossier_video> <dossier_plan> <nom_du_plan>
# Lit <dossier_video>/durees.json (écrit par voix.py ; sans lui, 10 s par plan) et écrit dans le dossier du plan :
#   duree.json  { plan, duree, debut, images }   (lu par sfx_lib.py, verifier.sh, essai.sh, planche.sh)
#   duree.js    var DUREE, DEBUT, IMAGES          (chargé avant timeline.js ; DEBUT = instant global du début du plan)
#   rideau.json la conduite de la vidéo en temps globaux réels : une cue qui porte "plan": N a ses temps a, b, c, d comptés
#               depuis le début du plan N (une valeur au-delà de la durée du plan N déborde sur le plan suivant).
# Affiche le nombre d'images du plan.
import json, math, os, re, sys

v, p, nom = sys.argv[1:4]
m = re.fullmatch(r'p(\d+)', nom)
num = int(m.group(1)) if m else None
d = [10.0] * 6
if os.path.exists(os.path.join(v, 'durees.json')):
    j = json.load(open(os.path.join(v, 'durees.json')))
    d = [x / 30 for x in j['images']] if 'images' in j else [float(x) for x in j['durees']]
debuts = [sum(d[:i]) for i in range(len(d))]
duree, debut = (d[num - 1], debuts[num - 1]) if num and num <= len(d) else (10.0, 0.0)
images = math.ceil(duree * 30 - 1e-6)
duree = images / 30
json.dump({'plan': num or 1, 'duree': duree, 'debut': debut, 'images': images}, open(os.path.join(p, 'duree.json'), 'w'))
open(os.path.join(p, 'duree.js'), 'w').write(
    "// durée de ce plan (= durée de sa voix) et début global, d'après <video>/durees.json (construire.sh)\n"
    f'var DUREE = {duree:.4f}, DEBUT = {debut:.4f}, IMAGES = {images};\n')
r = os.path.join(v, 'rideau.json')
if os.path.exists(r):
    j = json.load(open(r))
    for q in j['cues']:
        k = q.pop('plan', None)
        if k is not None:
            for c in 'abcd':
                if c in q: q[c] = round(debuts[int(k) - 1] + q[c], 3)
    json.dump(j, open(os.path.join(p, 'rideau.json'), 'w'))
elif os.path.exists(os.path.join(p, 'rideau.json')):
    os.remove(os.path.join(p, 'rideau.json'))
print(images)
