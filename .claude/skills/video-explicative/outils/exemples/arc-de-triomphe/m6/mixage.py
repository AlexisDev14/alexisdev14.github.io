# Bruitages du plan m6 « Même mort » — lancé par produire.sh : python3 -I mixage.py <outils> sfx.wav
# Uniquement des bruitages d'ACTION. Rien sur « Même mort » (TL.MOTS) : le « pop » du bicorne tombe juste après « mort ».
import numpy as np
import sys; sys.path.insert(0, sys.argv[1]); from sfx_lib import Mix, events, SR
import re
E = events('timeline.js')
MOTS = [tuple(map(float, p)) for p in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', open('timeline.js').read().split('TL.MOTS =')[1].split(';')[0])]
m = Mix(mots=MOTS, seed=6)
# 1) vent froid, visible (neige de papier), très bas, sur le début seulement
m.ambiance('vent', 0.0, 5.0, db=-42, af='highpass=f=120,lowpass=f=4200')
# 2) le cortège entre par la droite : sabots lents dans la neige, de droite vers le centre
for a, b, pan, s0 in [(E['enter0'] + 0.1, 2.5, 0.6, 3.0), (2.5, 3.3, 0.3, 3.95), (3.3, E['stop'] + 0.05, 0.05, 4.75)]:
    m.place('sabots_neige', a, -28, pan, start=s0, end=s0 + (b - a) + 0.15, af='lowpass=f=2600', fin=0.12, fout=0.18, label='sabots dans la neige')
# 3) grincement des roues et de la caisse, puis le char s'arrête sur sa tige
m.place('bois_grince', 2.4, -32, 0.3, end=0.6, af='highpass=f=200,lowpass=f=4000', fin=0.05, fout=0.2, label='roues')
m.place('bois_grince', E['stop'] - 0.05, -35, 0.0, start=1.0, end=1.5, af='highpass=f=250,lowpass=f=3500', fin=0.04, fout=0.2, label='caisse')
m.place('bois_butee', E['stop'] - 0.012, -33, 0.0, fin=0.003, fout=0.12, label='le char s\'arrête sur sa tige')
# 4) « pop » feutré : le bicorne retombe, juste après « mort »
d = np.arange(int(0.18 * SR)) / SR
pop = np.sin(2 * np.pi * np.cumsum(140 + 220 * np.exp(-d * 34)) / SR) * np.exp(-d * 26) * np.minimum(1, d / 0.004)
m.add(pop, E['hopLand'], -30, 0.1, 'pop du bicorne')
m.clac(E['hopLand'] + 0.004, -38, pan=0.1, f=620)
m.write(sys.argv[2])
