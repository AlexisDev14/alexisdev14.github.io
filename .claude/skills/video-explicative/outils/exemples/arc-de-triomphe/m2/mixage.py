# Bruitages du plan m2 « Austerlitz » — lancé par produire.sh : python3 -I mixage.py <outils> sfx.wav
# Uniquement des bruitages d'ACTION. Rien sur « triompher », « géant », « Modestement » (TL.MOTS) ; le carillon suit « Modestement ».
import numpy as np
import sys; sys.path.insert(0, sys.argv[1]); from sfx_lib import Mix, events, SR
import re
E = events('timeline.js')
MOTS = [tuple(map(float, p)) for p in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', open('timeline.js').read().split('TL.MOTS =')[1].split(';')[0])]
m = Mix(mots=MOTS, seed=2)
m.rideau_ouvre(E['curtain0'], E['curtain1'])                       # 1) le rideau s'ouvre
m.decor_monte(E['rows0'], E['rows0'] + 1.1, pan=0.0, poids='leger', db=-34)   # 2) les trois bandes de colline montent de la trappe (0,15 → 1,25)
m.creak(E['sun0'] + 0.1, E['sun1'] - 0.2, -40, f0=430, pan=-0.45, rate=22)    # 3) poulie du soleil qui monte sur son fil
# 4) fumées de coton : petits « pouf » feutrés et lointains, jamais sur « triompher » (2,45–2,95)
def pouf(at, db, pan):
    n = int(0.35 * SR); tt = np.arange(n) / SR
    m.add(m.bandpass(m.rng.standard_normal(n), 90, 500) * np.minimum(1, tt / 0.004) * np.exp(-tt / 0.07), at, db, pan, 'pouf de coton')
pouf(E['smoke0'] + 0.04, -36, 0.1)
pouf(E['smoke0'] + 1.2 + 0.04, -39, 0.4)
# 5) l'architecte glisse depuis la coulisse droite, petits clacs aux sautillements, arrêt
m.glisse(E['ar0'], E['ar1'], 0.6, 0.3, sauts=(E['ar0'] + 0.18, E['ar0'] + 0.18 + 1 / 2.6, E['ar1'] + 0.02))
# 6) le plan se déroule (juste avant « géant »), puis monte aux cintres en trois à-coups, le rouleau du haut se cale
m.papier(E['unroll0'] - 0.07, pan=0.25, db=-33)
for k, key in enumerate(('up1', 'up2', 'up3')): m.papier(E[key], pan=0.25, db=-30 + 1.5 * k)
m.objet_pose(E['up3'] + 0.22, pan=0.25)
# 7) petit carillon de satisfaction, APRÈS « Modestement » (9,45)
m.carillon(9.45, db=-31, pan=-0.3, notes=(1568.0, 2093.0))
m.write(sys.argv[2])
