# Bruitages du plan m1 « Pas debout » — lancé par produire.sh : python3 -I mixage.py <outils> sfx.wav
# Uniquement des bruitages d'ACTION liés à ce qu'on voit (pas de fond continu, pas de musique).
import sys; sys.path.insert(0, sys.argv[1]); from sfx_lib import Mix, events
import re
E = events('timeline.js')
MOTS = [tuple(map(float, p)) for p in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', open('timeline.js').read().split('TL.MOTS =')[1].split(';')[0])]
m = Mix(mots=MOTS, seed=1)
HAT_LAND = 8.70                                   # SCENE.hatLandT() (trajectoire calculée dans scene.js)
m.rideau_ouvre(E['curtain0'], E['curtain1'])      # 1) le rideau s'ouvre
m.decor_descend(E['arc0'], E['arc1'], pan=-0.1, poids='lourd')   # 2) le vrai arc descend des cintres et se pose
# 3) Napoléon glisse depuis la coulisse gauche (sautillements : sin(9t) = 0), puis 4 pas cadencés
m.glisse(E['enter0'], E['enter1'], -0.8, -0.35, sauts=(1.40, 1.75, 2.09, 2.44))
for k in range(4): m.pas([E['step%d' % (k + 1)]], pan=-0.2 + 0.1 * k)
# 4) la foule rêvée monte de la fente arrière puis redescend (elle agite chapeaux et drapeaux, n'applaudit pas : ni murmure ni applaudissements)
m.apparition(E['crowd0'] + 0.2, pan=0.0)
m.disparition(E['crowdSink0'], pan=0.0)
# 5) garde-à-vous : clac de talons (après « fois », juste avant « Et pas debout »)
m.place('clac_talons', E['attn1'] - 0.04, -30, 0.0, fin=0.003, fout=0.12, label='clac de talons')
# 6) « Et pas debout » : la chute à plat illustre exactement le mot, discrète ; la tige lâchée glisse sous la scène ; le bicorne roule
m.chute(E['fallLand'], db=-28)
m.disparition(E['rodGone'] - 0.3, pan=0.15)
m.objet_pose(HAT_LAND, pan=0.4)
m.write(sys.argv[2])
