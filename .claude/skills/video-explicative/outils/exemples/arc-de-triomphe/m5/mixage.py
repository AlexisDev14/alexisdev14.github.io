# Bruitages du plan m5 « Sans lui » — lancé par produire.sh : python3 -I mixage.py <outils> sfx.wav
# Uniquement des bruitages d'ACTION. Rien sur « Sans lui » ni « Évidemment » (TL.MOTS) ; la foule agite chapeaux et drapeaux sans applaudir : pas de murmure.
import sys; sys.path.insert(0, sys.argv[1]); from sfx_lib import Mix, events
import re
E = events('timeline.js')
MOTS = [tuple(map(float, p)) for p in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', open('timeline.js').read().split('TL.MOTS =')[1].split(';')[0])]
m = Mix(mots=MOTS, seed=5)
# 1) l'Empire s'effondre : craquement, tenture qui lâche, couronne qui touche le sol, colonnes qui tombent de chaque côté
m.place('bois_grince', E['shiver'], -32, 0.0, end=0.45, af='highpass=f=200,lowpass=f=4000', fin=0.03, fout=0.15, label='craquement')
m.place('velours', E['collapse'], -29, 0.4, end=0.8, rate=0.7, af='lowpass=f=3000', fin=0.01, fout=0.25, label='la tenture lâche')
m.objet_pose(E['crownLand'], pan=0.25, db=-31)
m.decor_tombe(E['colFall1'], pan=-0.5, db=-28)
m.decor_tombe(E['colFall1'] + 0.04, pan=0.5, db=-29)
# 2) changement de scène par le rideau (rapide)
m.rideau_change(E['close0'], E['close1'], E['open0'], E['open1'])
# 3) Sainte-Hélène : le rocher monte de la trappe ; ressac doux, visible (les vagues)
m.decor_monte(E['rock0'], E['rock1'], pan=-0.2, poids='lourd')
m.ambiance('ressac', 2.15, 4.75, db=-40, pan=0.15)
# 4) changement par les cintres : le vrai arc descend et se pose (5,85)
m.decor_descend(E['arc0'], E['arc1'], pan=0.1, poids='lourd')
# 5) inauguration : la foule de marionnettes monte de la fente
m.apparition(E['crowd0'] + 0.1, pan=-0.5)
m.apparition(E['crowd0'] + 0.25, pan=0.5)
# 6) la tige vide se cale dans sa fente, puis le bicorne se pose dessus (juste avant « Sans lui ») avec un petit rebond
m.apparition(E['rod1'], pan=0.0, db=-33)
m.objet_pose(E['bicLand'], pan=0.0, db=-30)
m.clac(E['bicLand'] + 0.285, -38, pan=0.0, f=560)
m.write(sys.argv[2])
