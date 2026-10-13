# Bruitages du plan __PLAN__ — lancé par produire.sh : python3 -I mixage.py <outils> sfx.wav
# Uniquement des bruitages d'ACTION liés à ce qu'on voit (pas de fond continu, pas de musique).
# Le rideau est sonorisé automatiquement (m.rideau_conduite). Puis les préréglages de sfx_lib (decor_monte, decor_descend,
# decor_tombe, apparition, disparition, glisse, pas, objet_pose, chute, papier, ambiance) ; 3 à 8 bruitages.
import sys; sys.path.insert(0, sys.argv[1]); from sfx_lib import Mix, events
import re
E = events('timeline.js')
MOTS = [tuple(map(float, p)) for p in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', open('timeline.js').read().split('TL.MOTS =')[1].split(';')[0])]
m = Mix(mots=MOTS)
m.rideau_conduite()                  # rideau : d'après <video>/rideau.json (toute la vidéo), rien d'autre à écrire
# m.decor_monte(E['decor0'], E['decor1'], pan=0.0, poids='lourd')
# m.apparition(E['entree'], pan=-0.4)
m.write(sys.argv[2])
