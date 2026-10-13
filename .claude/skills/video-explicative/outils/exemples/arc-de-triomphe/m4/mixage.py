# Bruitages du plan m4 « Le faux » — lancé par produire.sh : python3 -I mixage.py <outils> sfx.wav
# Uniquement des bruitages d'ACTION. Rien sur « appuyer » (TL.MOTS) : la toile ploie et la charpente craque APRÈS le mot (8,62).
import sys; sys.path.insert(0, sys.argv[1]); from sfx_lib import Mix, events
import re
E = events('timeline.js')
MOTS = [tuple(map(float, p)) for p in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', open('timeline.js').read().split('TL.MOTS =')[1].split(';')[0])]
m = Mix(mots=MOTS, seed=4)
m.rideau_ouvre(E['curtain0'], E['curtain1'])                                  # 1) le rideau s'ouvre en drapé
m.decor_monte(E['flat0'], E['flat1'], pan=0.1, poids='lourd')                 # 2) le faux arc monte de la trappe : poulies, charpente, butée à 2,85
# 3) les mariés glissent depuis la droite : un clac de bois à chaque sautillement, puis arrêt
sauts, t = [], E['walk0'] + 0.22
while t < E['walk1'] - 0.1: sauts.append(t); t += 1 / 2.3
m.glisse(E['walk0'], E['walk1'], 0.3, -0.2, sauts=sauts + [E['walk1'] + 0.02])
# 4) « appuyer » : la toile ploie puis la charpente craque, après le mot
m.place('velours', 8.62, -28, -0.25, start=0.3, end=1.4, rate=0.62, af='lowpass=f=2600', fin=0.01, fout=0.3, label='la toile ploie')
m.place('bois_grince', 8.66, -31, -0.2, end=0.9, af='highpass=f=150,lowpass=f=3000', fin=0.02, fout=0.3, label='la charpente craque')
m.write(sys.argv[2])
