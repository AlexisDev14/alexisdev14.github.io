# persos.md — « Du pain et des jeux, la moquerie qui a nommé Panem » : mode d'emploi de `persos.js`

Espace de noms : `M.pej` (alias `const PEJ = M.pej;`). Dans `S.init` : `PEJ.init()` (pré-rendus des trois décors → `PEJ.K`).
Léa vient de la bibliothèque (`GRV.lea`, greve.js). Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle conseillée (mesurées sur la planche `casting/`).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `PEJ.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran). `PEJ.nom.pose(p, x, y, s, dir)` = pose finale sans dessiner, `PEJ.nom.def()` = définition (pour `M.ik`). Toujours passer `t` dans la pose (marche, gestes animés, ricanement…).
Corps de greve.js : genoux et chevilles articulés (`legF legF_lo footF`, idem `B`), bras ronds. Pièces : `objetFond armB_up armB_lo objetB legB… head … torso … armF_up armF_lo objet doigts doigtsB`.

Options communes (0..1 sauf mention) :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'tablette' 'stylet' 'pain' 'sac' 'rouleau' 'jeton' 'pop' 'rien'` ; `tenuO` / `tenuBO` = options de l'objet (les mêmes que l'objet seul). `droit` (vrai par défaut : l'objet reste droit) ; `ang.objet` le tourne. La main entoure l'objet (doigts dessinés par-dessus).
- **La tablette tenue en main avant est dessinée DERRIÈRE la marionnette** (objet plat) : la main tient son bord gauche, elle s'étend devant. Garder la main devant la poitrine (x local > 40), sinon le torse la cache.
- `handF` / `handB` : `'fist' 'open' 'cup'` ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'closed'|'wide'|'half' }`.
- `marche` (+ `t`, `cadence` 6 ; le plan déplace `x`) ; `assis` + `siege` (hauteur locale du siège) + `pieds` (avance des chevilles, 84) ; `cible` = point écran pour `vote` et `toise`.
- Gestes communs hérités de greve.js, disponibles pour tous : `attendre` `pointes` `leve` `tendre` `epaules` `hanche` `menton` `essuie` `soupir` `surpris` `penche` (−1..1).
- `ang` : angles ajoutés (−1,57 = bras horizontal devant ; `head` négatif = menton levé). Un `ang.armF_up/lo` passé est respecté si aucun geste n'occupe ce bras.
- Point nommé de l'objet tenu : `PEJ.pt(r, 'nom', arriere)` → `[x, y]` écran (voir la table des accessoires).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `PEJ.juvenal` (C.pejJuvenal) | **0,95 ≈ 484 px** | `toge` (ivoire, pan oblique ; tunique bleu nuit visible à la poitrine et au bas devant), `stylo` (stylet derrière l'oreille pendant `surprise`) | tient d'office `tenu:'tablette'` (main avant) et `tenuB:'stylet'` (`'rien'` pour vider). `ecrit` (tablette basse devant la poitrine, inclinée, le stylet gratte selon `t`, tête baissée ; `tenuO.dessin` fait apparaître le dessin) ; `ricane` (tête qui penche, épaules qui sautillent, yeux mi-clos, sourire en coin) ; `montre` (bras levé devant, la tablette grandit, s'ouvre et se montre **de face**, tenue par le bord ; 1 → ouverte 188 × 122 px) ; `surprise` (main arrière ouverte devant la bouche, recul, yeux ronds ; le stylet passe derrière l'oreille) ; `assis` (tablette sur les genoux) ; `marche` |
| `PEJ.badaud` (C.pejBadaud) | **0,86 ≈ 448 px**, rond | `cheveux` (bouclés) ; cordelette nouée peinte | mains vides par défaut. `vote` (main arrière en avant-bas, jeton de bronze d'office, il descend ; `cible` = fente de l'urne, écran) ; `ventre` (main avant ouverte qui tapote le ventre, tête levée, sourire) ; `mange` (pain d'office, porté à la bouche, mâche selon `t` ; `tenuO.croque`) ; `porte` `'bras'` (true) \| `'epaule'` (sac de blé d'office ; épaule : sac couché derrière la tête, main avant au menton) ; `grimpe` (pointe des pieds, cou tendu ; à poser sur un sac couché, voir `PEJ.SAC`) ; `joie` (bras en V, menton levé, bouche ouverte, petits sauts selon `t`) ; `lance` = **phase** 0 (main basse) → 1 (bras tendu en haut devant, buste en avant), tablette d'office (la lâcher après 1 : dessiner `PEJ.tablette` qui vole) ; `vexe` (poings levés devant la poitrine qui tremblent, sourcils froncés, buste en avant ; le surgissement = `dy` du plan) ; `assis` ; `trinque` (pain levé à hauteur d'épaule, sourire) |
| `PEJ.empereur` (C.pejEmpereur) | **0,94 ≈ 482 px** (laurier) ; **0,8 ≈ 410 px dans la loge / au balcon** | `laurier` (vert-or, `ang.laurier` : 0,4 = de travers), `toge` pourpre à bord doré, `fibule` | port altier d'office (menton levé ; `altier:false` pour l'ôter). `decide` (rouleau scellé d'office brandi à hauteur d'épaule ; `PEJ.pt(r,'sceau')`) ; `lancePain` = **phase** 0 (poitrine) → 1 (main en avant-bas), petit pain d'office (`taille` 0,55) ; `sursaute` (recul, petit saut, laurier qui glisse, yeux ronds, mains ouvertes devant la poitrine) ; `toise` (menton levé, yeux mi-clos, main avant posée devant lui à hauteur de hanche = rampe de balustrade à s 0,8 ; ou `cible` écran) ; `marche` |
| `PEJ.figurant` (`tenue` 'a'…'d') | **0,8 ≈ 415 px** (0,75–0,85) | a : `bonnet` de feutre brun, tunique vert éteint ; b : crâne chauve, `barbe` grise courte, bleu ardoise ; c : `foulard` ivoire, rouge sang ; d : femme, stola safran, `palla` ivoire, **sans jambes** (`pieds` : bouts de chaussures) | `porte` (`'bras'`/`'epaule'`, sac d'office) ; `applaudit` (mains qui se rejoignent selon `t`) ; `joie` / `saute` (bras en V ; `saute` = sauts plus hauts) ; `assis` (la stola de d se plie aux genoux) ; `attrape` (mains en coupe vers le haut devant la poitrine) ; `marche` (d : glisser `x`, la robe ondule) |
| `GRV.lea` (bibliothèque) | 0,9 ≈ 464 px | — | pot de pop-corn : `tenu:'pejPop'`, `tenuO:{ grain }` ; bras qui le tient sur les genoux : `ang: PEJ.bras([46, -40], 'armF')` |

`bendSign` de `M.ik` (vérifié page 5 de la planche, cibles devant la poitrine et la taille, aucune ligne ATTENTION) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| juvenal, badaud, empereur, figurant (a b c d) | 1 | 1 | 1 | 1 |

Usage : `const q = PEJ.juvenal.pose(p, x, y, s, dir), sol = M.ik(PEJ.juvenal.def(), q, x, y, s, dir, 'armF', [tx, ty], 1); PEJ.juvenal(Object.assign({}, p, { ang: Object.assign({}, p.ang, { armF_up: sol.up, armF_lo: sol.lo }) }), x, y, s, { dir, slot });` (mêmes `x,y,s,dir`). Les gestes de l'enveloppe font déjà leur IK (coude toujours vers l'avant). Aide hors IK : `PEJ.bras([x, y], 'armF'|'armB')` → angles pour amener la main sur un point **du repère du torse** (hanche = 0, épaule ≈ (−2, −146), devant = +x).

Pièges :
- Juvénal garde sa tablette en `marche` (elle se balance au bout du bras ; au repos, main pliée devant la hanche) ; pour la donner au badaud : Juvénal `tenu:'rien'`, le badaud `lance` (tablette d'office).
- `montre` à mi-course (0,3–0,7) : la tablette s'ouvre en grandissant ; garder 1 pour la lecture (dessin `tenuO.dessin` 1).
- `porte:'epaule'` : la main avant passe devant le menton (préférer `'bras'` quand le visage joue).
- `mange` : le pain couvre le bas du visage (normal) ; un pain clé ≥ 120 px se montre seul (`PEJ.pain` s ≥ 1,1) ou `tenuO:{ taille: 1.4 }`.
- `sursaute` puis retour : `ang.laurier` reste à fixer par le plan si le laurier doit rester de travers (`ang:{ laurier: 0.42 }`).
- La femme `d` n'a pas de jambes : pas de `pointes`, pas de `grimpe`.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Échelle par défaut 0,9 (même taille que tenu en main).

| Fonction | `(x,y)` = | Taille (local, s = 1) | Options ; points nommés (`PEJ.pt`) |
|---|---|---|---|
| `PEJ.tablette(x,y,s,o)` | milieu du bas | fermée 72 × 96 (face 0) ; **ouverte de face 198 × 128** (face 1) | `face` 0..1 ; `ouverte` 0..1 (défaut = face) ; `dessin` 0..1 (0–0,5 pain rond 3/4 à 8 quartiers + ficelle, 0,5–1 roue de char à 8 rayons ; traits ivoire gravés, aucune lettre ; fermée : les deux dessins l'un sous l'autre) ; points `bord` (prise), `centre`, `pain`, `roue`, `haut` |
| `PEJ.stylet` | pointe | 90 (bronze) | point `pointe` |
| `PEJ.pain` | dessous | 112 × 76 (s 1,2 ≈ 134 px) | `croque` 0..1 (deux morsures, mie claire) ; `taille` (1) ; point `centre` |
| `PEJ.sac` | milieu du fond | 120 × 156 (≈ 225 de haut avec les épis ; ≈ 200 px à 0,9) | `couche` (couché, dessus plat à y − 80·s : y monter) ; `epis` (true) ; `t` (épis qui bougent) ; points `col`, `dessus`. `PEJ.SAC = { haut: 156, hautCouche: 80, long: 180 }` |
| `PEJ.pop` | fond | 100 × 190 (≈ 170 px à 0,9) | `grain` 0..1 (un grain saute en arc) ou `true` (en boucle selon `t`) ; point `bouche` |
| `PEJ.rouleau` | bas | 26 × 132 | sceau rouge sans signe ; points `sceau`, `haut` |
| `PEJ.jeton` | bas | Ø 30 | disque de bronze nu |
| `PEJ.quadrige(x,y,s,o)` | sol sous la roue (rail) | ≈ 390 × 300 (**0,95 ≈ 370 px de long** ; `petit` : s 0,36 ≈ 140 px) | `couleur` `'rouge'` `#8A2F2A` \| `'bleu'` `#3F5A7A` ; `t` (galop, roue qui tourne) ou `phase` ; `petit` ; `poussiere` 0..1 (volutes derrière la roue, défaut 1) ; regarde vers +x (`dir:-1` pour l'autre sens). `PEJ.QUADRIGE = { long: 390, haut: 300, avant: 342, arriere: -48 }` (local) |
| `PEJ.fauteuil(x,y,s,o)` | sol sous l'assise | assise à y − 120·s (**108 px à 0,9**), dossier 338 | `dir` = sens où regarde la personne assise (dossier derrière elle) ; poser au même `x` que la personne, AVANT elle, après `M.drawFloor()` |
| `PEJ.pictos(cx,cy,R,k,lw)` | centre | pain à gauche, roue à droite, R = rayon | dessin brut (écran, affiche) ; `k` 0..1 |

`PEJ.siege(sFauteuil, sPerso)` = valeur de `siege` pour s'asseoir dans `PEJ.fauteuil` (Léa 0,9 → 120 ; badaud 0,86 → 125,6).

## Décors (pré-rendus par `PEJ.init()` ; animations en temps global, sans saut à la coupe)
Ordre : `PEJ.<décor>(t, o)` (fond + plan intermédiaire) → `M.drawFloor()` → praticables (`PEJ.fauteuil`, `PEJ.cirqueGradins`) → marionnettes → couches de devant (`…Balcon`, `…Loge`, `…Avant`) → `M.stageLight` → `M.rideau` → `M.drawFrame`.

| Clé | Pose | Repères utiles |
|---|---|---|
| `PEJ.cinema(t,o)` | toile + rangs de fauteuils (salle prune capitonnée, plafond mouluré, écran blanc cassé, rideaux bordeaux qui ondulent, 4 appliques en coupe qui palpitent, cabine de projection en haut à droite + faisceau et sa poussière, porte capitonnée à hublot à droite, allée en pente à tapis et lumières de marche) | `o.teinte` 0 (bleu-blanc changeant) → 1 (ambre) ; `o.ecran` 0..1 (intensité, 1) ; `o.dessin` 0..1 (l'écran s'assombrit couleur cire puis le pain + la roue s'y tracent en grand, R 104) ; `o.porte` = instant local (la porte s'entrouvre 0,8 s, lueur, se referme vers +3 s) ; `o.faisceau` (true). Écran `PEJ.CINE.ecran = {x0:272, y0:300, x1:808, y1:604}` ; places conseillées `PEJ.CINE.sieges = [440, 640]` (fauteuils à `FEET`, s 0,9) |
| `PEJ.cinemaLueur(t,o)` / `PEJ.cinemaAvant(t)` | après les marionnettes | lueur de l'écran sur les personnages (mêmes `teinte`/`ecran`) ; dossiers du premier rang (y > 1450), gobelet à paille (x 370), grains au sol. Le grain qui saute (p6) = `tenuO:{ grain }` du pot de Léa |
| `PEJ.forum(t,o)` | toile (ciel ocre, nuages de papier pendus, Capitole et temple, Circus Maximus peint au loin à droite, aqueduc, grand temple), portique, statue, taberna (amphores) à auvent rayé qui ondule, enseigne de cruche, brasero (flammes + fumée en volutes), balcon impérial, passants, pigeons | `o.monte` 0..1 (balcon qui sort de la trappe, défaut 1) ; `o.quadrige` 0..1 (petit quadrige ≈ 140 px sur la piste du cirque peint, `PEJ.FORUM.cirque.piste = {x0:640, x1:960, y:506}`, `o.quadrigeCouleur`) ; `o.sacs` 0..1 (chariot à bras de 3 sacs qui entre par la gauche jusqu'à x 200) ; `o.pigeon` (instant : se pose sur le sac du haut, exige `sacs` 1) ; `o.chat` (instant : traverse devant le portique, x 140 → 420, en 4 s). Taberna x 566, brasero (404, 1240) |
| `PEJ.forumBalcon(t,o)` | APRÈS l'empereur | parapet à balustres + drapé pourpre ; plancher du balcon `PEJ.forumBalconY(monte)` (**y 1163** à 1), rampe 192 px au-dessus (y ≈ 971) ; empereur s 0,8 à `x ≈ 790`, `y = PEJ.forumBalconY(monte)`, `slot: y + 14` ; clipper au-dessus de `ST.back` pendant la montée |
| `PEJ.forumAvant(t)` | après les marionnettes | fontaine qui coule (bas gauche), cage à poules (poules qui picorent) et amphores (bas droite) |
| `PEJ.cirque(t,o)` | toile (Palatin et palais, gradins d'en face à foule peinte qui ondule, arène de sable, spina avec obélisque et bornes), loge (fond pourpre, colonnes), velum qui ondule, oiseaux | `o.marchand` (instant : un marchand de pains en silhouette passe au fond en 7 s) ; arène lointaine y 860–1000 |
| `PEJ.cirqueGradins(t)` | après `M.drawFloor()` | deux gradins praticables x 110–700 : **rang 0 : dessus y 1296** (pieds sur `FEET`, assis `siege: PEJ.gradinSiege(0, s)` = 120/s) ; **rang 1 : dessus y 1176** (pieds sur y 1296, même `siege`) ; coussins, amphore ; podium de la loge |
| `PEJ.cirqueLoge(t)` | APRÈS l'empereur | balustrade + drapé ; loge x 704–952, **plancher y 1176**, rampe y 982–998 ; empereur s 0,8 à `x ≈ 858`, `dir:-1`, `toise:1` (la main tombe sur la rampe) |
| `PEJ.cirqueAvant(t,o)` | après tout | balustrades basses aux coins (y 1500–1616), panier de pains (x 170), fanions rouge (x 80) et bleu (x 1000) qui flottent ; `o.fanion` (instant : le bleu se décroche et retombe en 1,8 s) |
Rail des quadriges : `PEJ.CIRQUE.rail = { y: 1380, x0: -420, x1: 1500 }` (`PEJ.quadrige(x, 1380, 0.95, {t, couleur})`). Dessinés après les spectateurs, ils masquent les jambes du rang 0 (y 1180–1380) : faire passer les chars quand personne de clé n'est assis devant, ou les dessiner avant le rang 0.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'PEJ\.' casting/scene.js`). Les trois plus utiles :
```js
// Léa assise au cinéma, pot tenu (main qui entoure le pot), grain qui saute ; le badaud assis à côté
PEJ.fauteuil(440, FEET, 0.9, { dir: 1 }); PEJ.fauteuil(640, FEET, 0.9, { dir: 1 });
GRV.lea({ assis: 1, siege: PEJ.siege(0.9, 0.9), tenu: 'pejPop', tenuO: { grain: true }, ang: PEJ.bras([46, -40], 'armF'), t }, 440, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
PEJ.badaud({ assis: 1, siege: PEJ.siege(0.9, 0.86), t }, 640, FEET, 0.86, { dir: 1, slot: ST.slotF, cast });
// Juvénal montre sa tablette de face, dessin complet ; point du bord pour un effet
const r = PEJ.juvenal({ montre: 1, t, tenuO: { dessin: 1 } }, 330, FEET, 0.95, { dir: 1, slot: ST.slotF, cast }); const bord = PEJ.pt(r, 'bord');
// L'empereur dans la loge, main sur la balustrade
PEJ.empereur({ toise: 1, t }, PEJ.CIRQUE.loge.cx + 30, PEJ.CIRQUE.loge.sol, 0.8, { dir: -1, slot: PEJ.CIRQUE.loge.sol + 14, cast }); PEJ.cirqueLoge(t);
```
