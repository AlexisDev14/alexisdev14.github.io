# Bruitages du plan m3 « Le chantier » — lancé par produire.sh : python3 -I mixage.py <outils> sfx.wav
# Uniquement des bruitages d'ACTION. Rien sur « Problème », « marie », « Immédiatement » (TL.MOTS) : les tapes de pied suivent le mot.
import sys; sys.path.insert(0, sys.argv[1]); from sfx_lib import Mix, events
import re
E = events('timeline.js')
MOTS = [tuple(map(float, p)) for p in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', open('timeline.js').read().split('TL.MOTS =')[1].split(';')[0])]
m = Mix(mots=MOTS, seed=3)
# 1) l'ouvrier frappe la pierre au maillet, lentement (0,85 / 1,75 / 2,75)
for at, db in [(E['hit1'], -29), (E['hit2'], -30), (E['hit3'], -31)]:
    m.place('maillet', at - 0.04, db, 0.15, af='lowpass=f=3200', fin=0.003, fout=0.15, label='maillet')
# 2) les arbres des saisons arrivent des cintres (autumn / winter / spring) ; feuilles de papier qui tombent
for key in ('autumn', 'winter', 'spring'): m.decor_descend(E[key], E[key] + E['swapDur'], pan=0.6, poids='leger', db=-33)
m.swish(E['leaves0'], E['leaves0'] + 0.7, -38, 0.55, lo=1500, hi=6000, label='feuilles de papier')
# 3) l'hiver : bouffée de vent froid, visible (neige de papier)
m.ambiance('vent', E['winter'] + 0.05, E['winter'] + 1.05, db=-40, pan=-0.2, af='lowpass=f=1400,highpass=f=150')
# 4) le bloc de la chèvre se pose sur le massif
m.objet_pose(E['blockLand'], pan=0.5)
# 5) changement de scène par le rideau : fermeture puis réouverture rapides
m.rideau_change(E['close0'], E['close1'], E['open0'], E['open1'])
# 6) le couple glisse depuis la gauche, clacs aux sautillements puis arrêt
m.glisse(E['walk0'], E['walk1'], -0.6, -0.3, sauts=(E['walk0'] + 0.25, E['walk0'] + 0.25 + 1 / 2.3, E['walk0'] + 0.25 + 2 / 2.3, E['walk1'] + 0.02))
# 7) le cœur de carton descend puis remonte sur son fil (poulie douce)
m.creak(E['heart0'], E['heart1'], -40, f0=820, pan=-0.4, rate=26)
m.creak(E['heartUp0'], E['heartUp1'], -40, f0=860, pan=-0.4, rate=26)
# 8) « Immédiatement » : deux tapes de pied juste APRÈS le mot, puis l'ouvrier lâche son maillet
m.place('tape_pied', E['stamp1'] - 0.005, -28, -0.35, fin=0.003, fout=0.08, label='tape de pied')
m.place('tape_pied', E['stamp2'] - 0.005, -29, -0.35, fin=0.003, fout=0.08, label='tape de pied')
m.place('bois_tombe', E['dropLand'] - 0.01, -29, 0.1, fout=0.2, label='maillet lâché')
m.write(sys.argv[2])
