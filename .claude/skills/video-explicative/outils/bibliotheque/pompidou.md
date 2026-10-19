# persos.md — « Le Centre Pompidou, Notre-Dame de la tuyauterie » : mode d'emploi de `persos.js`

Espace de noms : `M.bou` (dans `scene.js` : `const BOU = M.bou;`). Dans `S.init` : `BOU.init()` **une fois** (pré-rendus `BOU.K` : `ciel` (= `M.makeSky('paris')`), `toits`, `plateau`, `centre` (15 calques de la façade)).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle conseillée (mesurées sur la planche `casting/`). Aucun texte, lettre ni chiffre nulle part.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `BOU.pompidou / piano / rogers / madame / critique (pose, x, y, s, o)` : elle prépare la pose (objet tenu, gestes, IK interne) et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale). `M.chars` : `bouPompidou`, `bouPiano`, `bouRogers`, `bouMadame`, `bouCritique`, `bouCaniche`.

Options communes :
- `tenu` / `tenuB` : objet de la main avant / arrière : `'plan'` `'journal'` `'lorgnette'` `'rien'`, **ou une fonction** `(o) => {…}` qui dessine l'objet du plan (pinceau, clé…) avec la prise à l'origine (`M.fillPts`… ; garder tout dessin brut par `if (M._sil()) return;`). `tenuO` / `tenuBO` : options de l'objet (ex. `{ deroule: 0.5 }`).
- `droit` / `droitB` : `true` par défaut (objet droit à l'écran) ; `false` = il suit l'avant-bras (repère de l'objet : +y = le long de l'avant-bras, vers les doigts) ; `ang.objet` le tourne en plus.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (le plan : posé d'office par `deroule`).
- `handF` / `handB` : `'fist'` | `'open'` (poing d'office si un objet est tenu ; doigts dessinés PAR-DESSUS l'objet). `face` : `{ eyes:'closed'|'wide'|'half', brow:'up'|'frown'|'worry', mouth:'n'|'o'|'smile'|'tight' }` (prioritaire sur `expr`) ; `expr` : voir tableau ; `t` (marche, brossage, applaudissements…).
- `ang` : angles ajoutés (`armF_up armF_lo armB_up armB_lo head`, `legF`/`legB` ou `legF_up legF_lo piedF`…). Jambes en 3 pièces.
- **Gestes communs (0..1)** : `marche` (pas sur place, la scène déplace x) · `recul` (recul étonné, jambe avant) · `incline` (petit salut de tête) · `salut` (révérence : buste plié, main avant au ventre, bras arrière derrière) · `brandir` (+ `haut` 0 = devant soi à hauteur d'épaule, 1 = au-dessus de la tête ; le plan pointe vers l'avant-haut) · `deroule` (bras devant la poitrine puis le plan se déroule de 0,2 à 1, `deuxMains` d'office ; `bas` 0..1 = bras tendus vers le sol) · `ecarte` (bras écartés « tout ça ? », mains ouvertes) · `tire` + `cible` (deux mains sur la cible, corps penché en arrière, jambe avant arc-boutée) · `ajuste` + `cible` (deux mains sur la cible, sans pencher : « ajuster un col ») · `touche` + `cible` (main avant amenée sur la cible ; avec un pinceau : `tenu: fn, droit: false`) · `tape` + `cible` (poing qui frappe, rythme de `t`) · `brosse` + `cible` (revers de la main ouverte qui monte et descend sur la cible, `t`) · `hanche` (poing avant sur la hanche) · `menton` (poing au menton, regard levé) · `applaudit` (`t`) · `nez` (se pince le nez) · `collier` (main ouverte sur la poitrine).
- `cible` = point **écran** [x,y] (l'enveloppe fait l'IK, pas besoin de `M.ik`). Hors de portée, le bras se tend vers elle.
- Point nommé de l'objet tenu : `BOU.pt(r, nom)` / `BOU.pt(r, nom, true)` (main arrière) → `[x,y]` écran : plan `bout` (bout du rouleau), `bas` (rouleau du bas), `centre` (milieu de la feuille) · journal `haut` `centre` · lorgnette `verre`.

| Fonction | Échelle, taille | Pièces en plus | Options propres (0..1 sauf mention) |
|---|---|---|---|
| `BOU.pompidou` | 0,9 ≈ 485 px (cheveux) ; torse 108 px de large | `cheveux`, `planBras` | `sousBras: true` (plan roulé coincé sous le bras, mains libres ; ne pas le combiner avec `tenu:'plan'`) ; `sourcils` (les gros sourcils sautent de 9 px) ; `expr` `'neutre'` `'reveur'` (paupières mi-closes, sourire en coin) `'etonne'` (yeux ronds, bouche « o », sourcils levés) `'content'` `'perplexe'` ; `deroule`/`brandir` mettent `tenu:'plan'` d'office |
| `BOU.piano` | 0,88 ≈ 460 px, 62 px de large | `barbe`, `cheveux`, `medaille` | `medaille` (> 0,5 : ruban bleu nuit au cou, médaille d'or Ø ≈ 48 px sur la poitrine) ; `expr` `'neutre'` `'sourire'` `'ravi'` (yeux plissés, rire) `'concentre'` `'fier'` `'etonne'` |
| `BOU.rogers` | 0,88 ≈ 487 px (le plus grand), 54 px de large | `cheveux`, `medaille` | mêmes options que Piano (même enveloppe `BOU.archiPose`) ; son geste du plan 3 : `brosse` + `cible` ; `hanche` |
| `BOU.madame` | 0,85 ≈ 447 px (chignon bouffant), 82 px (manteau) | `col` (fourrure + perles), `cheveux`, `sac` (au pli du coude avant) | tient la **lorgnette** d'office (`tenu:'rien'` pour libérer la main) ; `lorgnette` (verres devant l'œil) ; `outree` (tête rejetée, bouche « o », main au collier, lorgnette qui pend) ; `collier` ; `enlace` + `cible` (axe du tuyau, écran) + `largeur` (px écran du tuyau, 84 par défaut = bleu à s 1) : deux bras tendus devant elle, mains ouvertes de part et d'autre de l'axe, joue penchée, `expr:'ravie'` d'office ; `laisse: [x,y]` (laisse de la main arrière vers ce point, en général `chien.collier` ; `laisseMou` px, 40 défaut) ; `sac: false` ; `expr` `'neutre'` `'mefiante'` (sourcil levé, œil plissé ; d'office avec `lorgnette`) `'outree'` `'ravie'` (yeux plissés, joues roses) `'coupable'` (sourcils inquiets, regard de côté) `'attendrie'` |
| `BOU.critique` | 0,85 ≈ 452 px (béret), 68 px | `beret`, `echarpe`, `pan`, `jBras` | `journal` `'main'` (défaut : dans la main avant) \| `'bras'` (sous le bras, d'office avec `applaudit`) \| `'rien'` ; `brandir` (journal levé haut, secoué avec `t` ; `expr:'outre'` d'office) ; `nez` (le journal passe d'office dans la main arrière ; `expr:'degoute'`) ; `applaudit` (`expr:'attendri'`) ; `expr` `'neutre'` `'outre'` `'degoute'` `'attendri'` `'sceptique'` |

`bendSign` de `M.ik` (vérifié pages 6 et 6,5 de la planche : cibles devant la poitrine, cibles basses, plis à fond près de l'épaule ; aucun « ATTENTION coude à l'envers », coude plié vers l'avant) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| `bouPompidou` | 1 | 1 | 1 | 1 |
| `bouPiano` | 1 | 1 | 1 | 1 |
| `bouRogers` | 1 | 1 | 1 | 1 |
| `bouMadame` | 1 | 1 | 1 | 1 |
| `bouCritique` | 1 | 1 | 1 | 1 |

`M.ik(C.bouX, pose, x, y, s, dir, 'armF', [X,Y], 1)` amène la main (`[0,100]` de l'avant-bras) sur la cible ; passer ensuite `ang.armF_up/lo` à l'enveloppe. Épaule et coude testés de 0 à ±2,4 rad (page 6,75) : articulations rondes, pas de cassure.

**Caniche** : `BOU.caniche(t, x, y, s, o)` (s 0,85 ≈ 121 px de haut, 120 de long ; `(x,y)` = pattes ; tige fine sous le ventre, `tige:false` pour la retirer). `o` : `humeur` `'calme'` (queue lente) \| `'renifle'` (tête baissée qui renifle) \| `'peur'` (tapi, queue basse, tremble, poils hérissés) \| `'joie'` (queue qui remue vite, petits bonds, langue) ; `herisse` 0..1 (contour en pointes) ; `eternue` (instant en s : tête qui se cabre puis éternuement + petit nuage au nez) ; `marche` 0..1 ; `dir`, `slot` (ST.slotF), `cast`, `alpha`. Renvoie `r.collier` et `r.nez` (écran). Dessiner le caniche AVANT Madame, puis `BOU.madame({ …, laisse: chien.collier }, …)`.

Pièges :
- Un geste pilote les angles de son bras (mélange par sa valeur) ; deux gestes du même bras : le dernier de la liste « gestes communs » l'emporte. Les gestes Madame (`lorgnette`, `enlace`) passent après.
- `deroule` : la feuille (200 × 240 à s 1, ≈ 176 × 211 à 0,88) pend sous les mains et s'étend vers l'avant : on en voit **le dos** (papier ivoire, traits flous illisibles). Face à face, mettre le porteur en `dir:-1` pour que la feuille aille vers l'autre.
- Le plan roulé tenu (`tenu:'plan'` sans geste) part horizontalement vers l'avant (≈ 180 px à 0,9).
- `medaille` : le disque est en partie caché par le bras avant quand il pend ou pendant `salut` ; pour le montrer, avancer le bras (`ang: { armF_up: -0.35 }`) ou utiliser `ecarte`/`brandir`.
- `enlace` : poser Madame à `x = axe du tuyau − dir·(largeur/2 + 50)` ; `cible` à hauteur de poitrine (≈ y 1110 pour des pieds à FEET). Les deux bras passent devant le tuyau (décor) : le geste se lit par les mains ouvertes posées dessus et la joue penchée.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Même dessin que tenu en main.

| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `BOU.plan(x,y,s,o)` | milieu du rouleau du haut | roulé 200 × 26 ; déroulé 200 × 240 | `deroule` 0..1 (feuille vue de dos) |
| `BOU.rouleau(x,y,s,o)` | centre | 150 × 26 (+ nœud 30) | `teinte` 0..3 ou `'ivoire'` `'bleu'` `'ocre'` `'rose'` ou `'#hex'` ; `ang` (= `rot`) ; `ruban` (couleur, sinon une des 4 : rouge sang, bleu nuit, vert, violet) |
| `BOU.pile(x,y,s,o)` | sol sous le milieu | n 1 : 520 × 420 (170 rouleaux) | `n` 0..1 : le tas grandit du sol (petit monticule → montagne) ; à s 0,62 ≈ 320 × 260 |
| `BOU.medaille(x,y,s,o)` | centre du disque | Ø 60 ; boucle de ruban jusqu'à y −104 | `fil: true` (fil vertical du haut de la boucle aux cintres) ; `boucle: false` (deux brins courts) |
| `BOU.journal(x,y,s,o)` | milieu du bas | 80 × 120 | — (colonnes de traits ondulés, cadre gris, aucune lettre) |
| `BOU.lorgnette(x,y,s,o)` | bas du manche | 30 × 85 | — |
| `BOU.laisse(p0, p1, o)` | deux points écran | — | `mou` (px, 40), `col` |

## Décors (pré-rendus par `BOU.init()`)
| Appel | Pose | Repères utiles (écran) |
|---|---|---|
| `ctx.drawImage(BOU.K.ciel,0,0)` | toile de fond | ciel parisien |
| `BOU.toits(t, o)` | juste après le ciel | toits de zinc, cheminées en terre cuite, horizon pâle et dôme ; **Notre-Dame lointaine x 760**, flèche y ≈ 671, sommet des tours y ≈ 743, base cachée ≈ 933 (≈ 260 px). `o.tremble` (px, ondulation de la toile), `o.chute` 0..1 (la cheminée du gag, `BOU.TOITS.gag = [902, 891]` = pied de la souche, bascule et tombe derrière le toit ; tombée à 1). Ne pas cacher x ≈ 880–930, y 850–890 pendant le gag. |
| `BOU.plateau(t, o)` | après les toits, avant le plancher | terre battue de y 1253 à 1395 ; flaques `BOU.PLATEAU.flaques` = (330, 1373) et (700, 1379) ; bornes x 210 et 920 ; pavés x 70–190. `o.descend` 0..1 (descend par la trappe). |
| `BOU.notreDame(x,y,s,o)` | `(x,y)` = milieu de la base | s 1 : 164 × 375 (flèche), tours 272 (≈ 380 avec les tuyaux à s 1). `tuyaux` 0..1 (les deux tours deviennent, de bas en haut, des faisceaux de tuyaux bleu/vert/jaune/rouge et une charpente blanche) ; `couleurs` 0..1 (1 défaut ; 0 = tuyaux gris) ; `brume` 0..1 (pâlie) ; `alpha`. |
| `BOU.centre(t,x,y,s,o)` | **x 540, y ST.back, s 1** (avant `M.drawFloor`) | voir ci-dessous |

**Le Centre Pompidou** — façade est, 2000 × 536 à s 1 (proportions vraies ≈ 4 pour 1) : posé à `(540, ST.back, 1)` il déborde des deux côtés ; **toit y 859** (bouches des conduits bleus et cages jusqu'à ≈ 829) ; ciel et Notre-Dame visibles au-dessus. Six niveaux de 87 px (planchers y 1308, 1222, 1135, 1048, 962). À s 0,46 on voit toute la façade (920 × 247).
Options (`o`) — défauts entre parenthèses : `structure` (1) exosquelette blanc · `escaliers` (1) cages d'ascenseur à cadre + escalier mécanique (à gauche, hors champ à x 540) · `tuyaux` (1) bleus, verts, jaunes : chaque famille **sort de la façade** (grossit un peu, ombre qui s'éloigne) quand sa valeur passe de 0 à 1 · `boite` (0) boîte nue gris béton par-dessus les vitrages (1 = rien d'autre visible que ce qui est sorti) · `vide` (0) plateaux vides éclairés derrière les vitres · **`couleurs` (0)** raccourci pour les quatre couleurs ; `bleu` `vert` `jaune` `rouge` 0..1 : la couleur coule de bas en haut (gris clair à 0) · `visiteurs` (0) cabines rouges éclairées qui montent avec silhouettes + silhouettes sur l'escalier et (avec `vide`) dans les plateaux · `portes` (0) portes vitrées qui s'ouvrent sur un hall éclairé · `bouffee`, `goutte`, `etincelle` : instant(s) en s (nombre ou tableau) · `monte` (1) : 0 = sous la trappe, 1 = en place (découpé au-dessus de `y`) · `frisson` (px) : les tuyaux et cages ondulent (animé par `t`, 4–8 px) · `clipY`.
**Ne jamais oublier `couleurs: 1`** (ou les quatre) aux plans 5 et 6 ; plan 3 : laisser `couleurs` à 0.

Tuyaux à hauteur de main (y 1150), posé à (540, ST.back, 1) — `BOU.centrePt(o, nom, x, y, s)` donne le point exact (tient compte de `monte`) :

| `nom` | x écran | largeur | rôle |
|---|---|---|---|
| `'rouge'` | 180 | 86 | cage d'ascenseur vitrée à cadre rouge (cabine dedans) |
| `'vert'` | 308 | 46 | eau : brides, piquages vers la droite à chaque niveau, volant de vanne à gauche (y ≈ 1174) |
| `'bleu'` | 436 | 84 | air : gros conduit vertical, bouche ouverte en haut (y ≈ 917) — **celui que Madame enlace** |
| `'porte'` | 564 | 76 × 62 | portes vitrées (y 1333–1395) ; point = milieu |
| `'jaune'` | 692 | 42 | électricité : gaine plate + boîtes de jonction (y ≈ 1111–1155 et 937–981, 1283–1327) |
| `'vert2'` | 776 | 42 | eau |
| `'bleu2'` | 870 | 96 | conduit coudé : vertical jusqu'à y 1095, puis décalé à x 960 jusqu'au toit |
| `'rouge2'` / `'jaune2'` | 1076 / 1160 | 86 / 40 | hors champ à s 1 |
| `'bouffee'` `'goutte'` `'etincelle'` `'toit'` | 436 / 361 / 722 / 540 | — | y 899 / 1183 / 1133 / 859 : points des effets |
Autres tuyaux hors champ à s 1 (visibles à s < 1) : jaune x 52, bleu −76, vert −204, jaune −332, vert 1240, bleu 1370, jaune 1464, vert 1520.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'BOU\.' casting/scene.js`). Les plus utiles :
```js
// plan 6 : Madame enlace le bleu, le caniche remue la queue, centre complet
BOU.centre(t, 540, ST.back, 1, { couleurs: 1, visiteurs: 1, portes: 1 });  M.drawFloor();
const pB = BOU.centrePt({}, 'bleu', 540, ST.back, 1);
const chien = BOU.caniche(t, pB[0] + 60, FEET, 0.85, { humeur: 'joie', cast });
BOU.madame({ t, enlace: 1, cible: [pB[0], pB[1] - 40], largeur: 84 }, pB[0] - 92, FEET, 0.85, { cast });
// plan 4 : Piano touche le jaune du pinceau (pinceau dessiné dans scene.js, le long de l'avant-bras)
const pJ = BOU.centrePt({}, 'jaune', 540, ST.back, 1);
BOU.piano({ t, touche: 1, cible: [pJ[0] - 20, pJ[1] + 20], tenu: pinceau, droit: false }, pJ[0] - 130, FEET, 0.88, { cast });
// plan 2 : plans déroulés face à face (vus de dos), sourcils qui sautent
BOU.pompidou({ t, deroule: 1, sourcils: 1, expr: 'etonne' }, 220, FEET, 0.9, { cast });
BOU.piano({ t, deroule: 1 }, 660, FEET, 0.88, { dir: -1, cast });
// plan 3 : la boîte nue monte de la trappe, puis l'exosquelette sort
BOU.centre(t, 540, ST.back, 1, { monte: m, boite: 1, structure: st, escaliers: es, tuyaux: tu });
```

## Dessin sur le plan (reprise) — `persos.js`, chargé après la bibliothèque
Option **`dessin: 'quartier' | 'centre'`** de la feuille du plan : la feuille déroulée est alors vue **DE FACE**, papier ivoire clair, dessin net ; sans `dessin`, tout est inchangé (dos de la feuille). Aucun texte. Elle marche partout où passe la feuille ; avec un `deroule` partiel, le dessin reste fixé au rouleau du haut et se révèle en se déroulant :
- `dessin: 'quartier'` (plan 1) : plan de Paris bleu nuit sur ivoire, îlots hachurés, jardins verts, rues en traits doubles, la Seine bleu pâle en bas avec île et ponts ; au centre un grand rectangle VIDE cerné de rouge à main levée (≈ 67 × 62 px à s 0,88). Lisible dès 176 × 211 px.
- `dessin: 'centre'` (plan 2) : façade en élévation, exosquelette blanc sur lavis bleu-gris, tuyaux bleus (×2), vert (×2), jaune, tube rouge de l'escalier en diagonale par-dessus. Couleurs vives ; lisible dès 176 × 211 px.
- Appels : `BOU.plan(x, y, s, { deroule: 1, dessin: 'quartier' })` (x,y = milieu du rouleau du haut ; 200 × 240 à s 1) · `BOU.pompidou({ t, deroule: d, tenuO: { dessin: 'quartier' } }, x, FEET, 0.9, { cast })` · `BOU.piano({ t, brandir: 1, haut: 0.5, tenuO: { dessin: 'centre', deroule: 1 } }, …)` (`brandir` ne déroule pas seul : mettre `deroule: 1` dans `tenuO`). Piège : le dessin ne change pas de côté avec `dir: -1` (la feuille est retournée comme le personnage : l'image est en miroir, sans conséquence, sans texte) ; la feuille déroulée s'étend devant le porteur (≈ 90 à 270 px devant lui à s 0,9) et recouvre ce qui s'y trouve : dégager la place.

**`BOU.grandPlan(x1, x2, yHaut, s, o)`** : grand plan tenu à deux, face au public. Une barre-rouleau de x1 à x2 (écran) à la hauteur `yHaut`, la feuille pend dessous ; largeur = x2 − x1 (≤ 260 conseillé, s'étend telle quelle sinon), hauteur pleine = 0,9 × largeur (260 → 234 px). `s` : épaisseur des rouleaux et finesse du trait (0,88). `o` : `dessin` (`'centre'` par défaut), `deroule` 0..1 (1 : se déroule vers le bas), `cast`, `alpha`, `ombre`, `t`. Dessiner la feuille **avant** les deux personnages (leurs poings passent par-dessus les bouts de la barre). Renvoie (et `BOU.grandPlanPts(x1, x2, yHaut, s, o)` renvoie sans dessiner) `{ g1, g2, centre, bas, w, h }` : **points de prise** `g1 = [x1, yHaut]` (bout gauche) et `g2 = [x2, yHaut]` (bout droit), `centre` = milieu de la feuille, `bas` = rouleau du bas (écran).
```js
const x1 = 560, x2 = 820, g = BOU.grandPlanPts(x1, x2, 1080, 0.88, {});
BOU.grandPlan(x1, x2, 1080, 0.88, { dessin: 'centre', deroule: d, cast });                 // d = ease(…) 0..1
BOU.piano({ t, touche: 1, cible: g.g1, expr: 'ravi' }, x1 - 100, FEET, 0.88, { cast });      // dir 1 : main avant au bout gauche
BOU.rogers({ t, touche: 1, cible: g.g2 }, x2 + 100, FEET, 0.88, { dir: -1, cast });          // dir -1 : main avant au bout droit
```
Placer chaque porteur à ≈ 100 px (à s 0,88) du bout qu'il tient (la main avant l'atteint, bras plié) ; `yHaut ≈ 1080` = hauteur de poitrine pour des pieds à FEET (1416). Hors de portée le bras se tend vers la cible. Vérifié : `casting/scene.js` (Piano dir 1 + Rogers dir −1 ; Pompidou `deroule` ; `brandir` ; `deroule` de Piano en dir −1).
