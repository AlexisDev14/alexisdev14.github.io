# Bruitages du plan __PLAN__ — lancé par produire.sh : python3 -I mixage.py <outils> sfx.wav
# Au moins une AMBIANCE du lieu très basse (m.ambiance) + des bruitages d'ACTION liés à ce qu'on voit. Pas de musique,
# AUCUN son qui ressemble à une voix humaine (murmure, brouhaha, rire, son ralenti) : seule la voix off parle.
# Le rideau est sonorisé automatiquement (m.rideau_conduite). Puis les préréglages de sfx_lib (decor_monte, decor_descend,
# decor_tombe, apparition, disparition, glisse, pas, objet_pose, chute, papier, ambiance) ; 3 à 8 bruitages.
import sys; sys.path.insert(0, sys.argv[1]); from sfx_lib import Mix, events
import re
E = events('timeline.js')
MOTS = [tuple(map(float, p)) for p in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', open('timeline.js').read().split('TL.MOTS =')[1].split(';')[0])]
m = Mix(mots=MOTS)
m.rideau_conduite()                  # rideau : d'après <video>/rideau.json (toute la vidéo), rien d'autre à écrire
m.ambiance('interieur', 0.0, 10.0)   # ambiance du lieu (à adapter : 'machine', 'horloge', 'feu', 'eau', 'vent', 'ressac'…)
# m.decor_monte(E['decor0'], E['decor1'], pan=0.0, poids='lourd')
# m.apparition(E['entree'], pan=-0.4)
m.write(sys.argv[2])
