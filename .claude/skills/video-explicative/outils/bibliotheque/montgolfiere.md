# persos.md — « La montgolfière, des moutons avant les hommes » : mode d'emploi de `persos.js`

Espace de noms : `M.mgf` (dans scene.js : `const MGF = M.mgf;`). Dans `S.init` : `MGF.init()` (pré-rendus `MGF.K` : ciel (toile, 4 bandes de toits), Annonay (toile, moulin, séchoir, accessoires), Versailles (toile, bois, château, accessoires), 2 nuages de carton).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Exemples testés : `casting/scene.js` (`grep -n 'MGF\.' casting/scene.js`), une page par demi-seconde (en-tête du fichier).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `MGF.joseph / etienne / louis / pilatre (pose, x, y, s, o)` (s défaut 0,9) : elle prépare la pose (objet tenu, seconde main, gestes, IK interne coude toujours vers l'avant). Renvoie `r` (`r.w('pièce', x, y)` point écran ; `r.q` pose finale). Pose préparée seule : `MGF.josephPose(pose, x, y, s, dir)` (idem `etiennePose`, `louisPose`, `pilatrePose`), puis `M.puppet(C.mgfJoseph, q, …)`.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'aiguille'` `'lorgnette'` `'perche'` (perche-fourche à éponge) `'cage'`, ou un objet du plan `{ draw(o), grip:[x,y], p2:()=>[x,y], pts:{nom:[x,y]} }` (repère objet, y vers le bas, la main entoure `grip`) ; `tenuO` / `tenuBO` : options de l'objet (+ `echelle`).
- `droit` / `droitB` : `true` d'office avec un objet (il reste droit à l'écran) ; `ang.objet` le tourne (rad, + = sens horaire).
- `deuxMains` : la main arrière va d'elle-même sur la seconde prise (`p2`) — d'office pour `perche` (éponge/tenir) et `cage` (porte).
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `t` (oscillations des gestes) ; `marche: true` (jambes et bras selon `t`) ; `galerie: true` (jambes masquées, tige et ombre au sol retirées : passager du ballon).
- Point nommé de l'objet tenu : `MGF.pt(r, nom)` (main arrière : `MGF.pt(r, nom, true)`) : aiguille `pointe` `chas` ; lorgnette `oeil` `bout` ; perche `eponge` `bas` ; cage `fond` `haut` `bord`. Poing : `MGF.main(r)` / `MGF.main(r, true)`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `MGF.joseph` (`C.mgfJoseph`) | 0,9 : 499 px avec le chapeau, 449 px tête nue ; trapu, ventru | `chapeau` (rond noir à large bord, 118 px), `chapeauM` (le même dans la main) | `coudre` (aiguille mise d'office, deux mains devant le ventre, la main avant tire le fil selon `t` ; `cible` écran = point cousu) ; `jeter` (**phase** 0 = bras levé haut devant, 1 = bras tendu vers le bas-avant, buste penché ; animer 0→1 ; `jeter: 0` compte comme actif) ; `nez` (se pince le nez, yeux fermés) ; `regardeHaut` (tête levée, main en visière devant le front ; `visiere: false` = tête seule) ; `salut` (0→0,45 la main va au bord du chapeau, 0,45→1 le chapeau monte dans la main) ; `presente` (+`cible`) ; `agite` (main ouverte qui s'agite devant le visage) ; `surpris` ; `tenir` (+`cible`, `cibleB`) ; `deconfit` ; `honneur` |
| `MGF.etienne` (`C.mgfEtienne`) | 0,9 : 473 px ; grand et mince, catogan châtain | `queue` (catogan + nœud noir) | `coudre` ; `tenir` (+`cible`/`cibleB` ; avec `tenu:'perche'` deux mains d'office) ; `presente` (bras tendu, paume ouverte ; `cible` écran, ex. le ballon) ; `nez` ; `agite` (main devant le visage, plan 3) ; `regardeHaut` (+`visiere:false` = bras ballants) ; `deconfit` (tête basse, mains jointes basses devant, yeux mi-clos) ; `lance` (**phase** 0 main basse → 1 bras levé devant : lancer par-dessous) ; `honneur` (main sur la poitrine, menton levé) ; `surpris` ; `marche` |
| `MGF.louis` (`C.mgfLouis`) | 0,9 : 471 px ; grand, corpulent, double menton, grand nez, perruque blanche à deux rouleaux + catogan, cordon bleu ciel | `queue` | `observe` (lorgnette mise d'office, oculaire sur l'œil ; `visee` rad, négatif = vise vers le haut, la tête suit) ; `pense` (main au menton, tête levée, l'autre main sous le coude) ; `applaudit` (deux mains ouvertes qui se rejoignent devant la poitrine selon `t`, sourire) ; `assis` (cuisses horizontales, mains sur les genoux ; assise du fauteuil ≈ `y − 100·s` ; se combine avec `observe`, `pense`) ; `regardeHaut`, `honneur`, `presente`, `surpris`, `marche` |
| `MGF.pilatre` (`C.mgfPilatre`) | 0,9 : 482 px avec le tricorne ; jeune, glabre, habit rouge, bottes | `chapeau` (tricorne noir sans galon), `chapeauM`, `queue` | `porte` (cage mise d'office à `echelle` 0,72 : main avant sur l'anse, main arrière sur le montant ; animaux par `tenuO: { echelle: 0.72, mouton: {…}, canard: true, coq: {…} }`) ; `honneur` (main sur le cœur, menton levé) ; `reclame` (bras avant en diagonale vers le haut, paume ouverte ; avec `honneur:1` la main ARRIÈRE passe sur le cœur) ; `eponge` (perche mise d'office, deux mains à la poitrine, la perche s'incline pour que l'éponge aille sur `cible` (écran), tamponne selon `t` ; `tamponne: 0` l'arrête ; sans cible `incline` rad, défaut 0,6) ; `salut` (tricorne soulevé) ; `galerie: true` (mi-corps, voir ballon) ; `marche` |

`bendSign` de `M.ik` (vérifié page 10 du casting, aucune ligne ATTENTION) — les quatre personnages :

| bras | `dir` 1 | `dir` −1 |
|---|---|---|
| avant `armF` | 1 | 1 |
| arrière `armB` | 1 | 1 |

Pièges : `jeter` et `lance` sont des **phases** (pas des intensités) ; `salut` n'existe que pour Joseph et Pilâtre (Étienne / Louis : `honneur`). La main arrière est dessinée derrière le torse : pour qu'elle se voie, la cible doit être devant la poitrine (x local > ≈ 50). `coudre` vise d'office devant le ventre : passer `cible` sur l'enveloppe. Ne pas cumuler deux gestes de la main avant (le dernier dans l'ordre surprise, deconfit, regardeHaut, nez, agite, presente, reclame, honneur, coudre, jeter, lance, tenir, porte, eponge, observe, pense, applaudit, salut l'emporte).

## Animaux (marionnettes à une pièce, tige facultative ; `def.libre` inutile : ils n'ont pas de membres nommés `arm`/`leg`)
`MGF.mouton / canard / coq (pose, x, y, s, o)` — `(x,y)` = pattes au sol, regard vers +x (`o.dir` −1 = vers la gauche). `o` : `slot` (défaut `ST.slotF`), `rod:false` (sans tige : posé, porté, dans la vignette), `cast`, `alpha`. `pose` : `t` (obligatoire pour les animations), `tilt`, `dx`, `dy` (montée de la trappe), + options ci-dessous. Dessin seul (sans marionnette) : `MGF.moutonDraw(o)` etc. sous `ctx.translate/scale`.

| Fonction | Taille à s 1 | Options |
|---|---|---|
| `MGF.mouton` | 230 × 150 px | `mache` (mâchoire qui rumine, true ou 0..1) ; `fier` (menton levé, yeux mi-clos) ; `regardeHaut` (true ou 0..1) ; `tete` 0..1 (la tête tourne vers le public : 0,5 = de chant, 1 = de face) ; `pas` (petits pas selon `t`) ; `bele` (bouche ouverte) ; `inquiet` (yeux ronds) |
| `MGF.canard` | 150 × 105 px (cou allongé 130) | `ailes` 0..1 (battent selon `t`) ; `cou` 0..1 ; `blase` (yeux mi-clos) ; `coin` (bec ouvert) ; `inquiet` |
| `MGF.coq` | 150 × 155 px | `chante` (cou tendu, tête levée, bec ouvert, yeux fermés) ; `ebouriffe` (plumes hérissées) ; `inquiet` |

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `MGF.cage(x,y,s,o)` | milieu du fond | 324 × 305 px (anse comprise ; vannerie 70, barreaux jusqu'à 205, couvercle 248) | `mouton`, `canard`, `coq` : `true` ou options de l'animal (+ `agrippe` 0..1 pour mouton et coq : pattes sur le bord) ; `couvercle` 0..1 (charnière arrière ; ouvert il monte de ≈ 200 au-dessus) ; `drap` 0..1 (drap ivoire : 1 = couvre tout sauf le bas de la vannerie, l'anse et les montants restent visibles) ; `remue` 0..1 ; `coin` 0..1 (coin droit du drap soulevé) ; `pendue` (longueur des 4 cordes, local) + `attache` (demi-écart des points d'attache, 46) |
| `MGF.cagePt(nom,x,y,s,o)` | — | — | `'fond'` `'bord'` (haut de la vannerie) `'anneau'` `'haut'` (sommet de l'anse) `'prise'` `'attache'` |
| `MGF.ballon(x,y,s,o)` | centre du col inférieur | enveloppe à `gonfle` 1 : `annonay` 700 × 500, `versailles` 760 × 540, `muette` 820 × 584 (galerie 428 de large, réchaud jusqu'à +96 sous le col) ; `gonfle` 0 : tas plissé ≈ 0,24 H de haut, 1,25 fois plus large | `type` ; `gonfle` 0..1 ; `fumee` 0..1 + `noire` 0..1 (volutes au col) ; `feu` 0..1 (lueur du col ; muette : flammes du réchaud, défaut 1) ; `brule` 0..1 (trou roussi qui fume) ; `balance` (true ou 0..1, tangage en temps global) ; `incline` (rad) ; `t` **obligatoire** ; `cordes` `[[x,y],…]` (cordes du flanc vers des points écran, ex. `MGF.VER.mats`) ; `cage` (true ou options de `MGF.cage`, pendue sous le col) + `cageS` (échelle de la cage relative au ballon ; 1,4 pour des têtes ≥ 120 px à s 0,85) + `cageCorde` (170) ; `passagers(P)` (muette) |
| `MGF.ballonPt(nom,x,y,s,o)` | — | — | `'col'` `'haut'` `'centre'` `'trou'` (cible de l'éponge) `'flancG'` `'flancD'` `'galerieAvant'` `'galerieArriere'` `'rechaud'` (mêmes `o` que le ballon, tangage compris) |
| `MGF.foyer(t,x,y,s,o)` | milieu du pied des pierres | 230 × 45 px de pierres ; flammes ≈ 90 ; fumée jusqu'à `haut` (420) | `feu`, `fumee`, `noire` 0..1 ; `paille` 0..1 ; `vent` |
| `MGF.volutes(t,o)` | départ | — | fumée en volutes : `x, y, k, haut, vent, r, n, per, larg, noire, seed` |

`MGF.ballon` renvoie `{ col, haut, trou, centre, flancG, flancD, cage, places }`. **Galerie (muette)** : `passagers(P)` est appelé entre l'enveloppe et le devant de la galerie ; `P.avant` (gauche du col) / `P.arriere` = `{ x, y (pieds), s, rot }` : `MGF.pilatre({ t, galerie: true, eponge: 1, cible: MGF.ballonPt('trou', …mêmes args), tilt: P.avant.rot }, P.avant.x, P.avant.y, P.avant.s, { dir: 1 })` ; le marquis : `M.puppet(C.architecte, { ang: {}, hide: { plan: 1, legF: 1, legB: 1 }, tilt: P.arriere.rot }, P.arriere.x, P.arriere.y, P.arriere.s, { dir: 1, rod: false, floorShadow: false })`. Passagers à 0,62·s (Pilâtre ≈ 165 px visibles au-dessus de la galerie avec un ballon à 0,9).

## Décors (dessinés en direct, fonctions pures de `t` ; à appeler avant `M.drawFloor()`)
| Appel | Contenu | Options | Repères |
|---|---|---|---|
| `MGF.ciel(t, o)` | ciel froid de novembre, nuages de carton pendus + nuages qui défilent, corneilles ; bandes qui défilent : Notre-Dame, dômes et clochers pâlis, Seine et pont de pierre, bateau-lavoir ; toits à mansardes et lucarnes, cheminées qui fument ; rampe de toits proches : souches à mitres, lucarnes à volets, pigeonnier, girouette en flèche (tourne), corde à linge vide, réverbère à huile suspendu (oscille, flamme) | `defile` (px de défilement des toits proches, ex. `40*t` ; le fond suit à 0,12 / 0,3 / 0,55) ; `volet` 0..1 (événement) ; `pigeon` (instant où il s'envole du pigeonnier) ; `derriere(c)` (dessiné entre les toits du milieu et la rampe proche : ballon qui monte de derrière les toits) ; `nuages:false`, `corneilles:false` | toits proches de y ≈ 1200 à 1395 ; toits du milieu y ≈ 1050–1200 ; Seine y ≈ 960–1050 |
| `MGF.annonay(t, o)` + `MGF.annonayAvant(t)` (après les marionnettes : brouette au coin gauche) | collines du Vivarais, bois, village et clocher sans croix ; séchoir à claire-voie (gauche) et cordes à feuilles qui ondulent ; moulin de pierre (droite), cheminée qui fume, bief, roue à aubes qui tourne, rivière qui miroite ; presse à vis, rames de papier, fagots, cuve de pâte, tonneaux ; foyer au centre | `foyer` (true), `feu`, `fumee`, `noire` (foyer) ; `chat` (instant : chat qui traverse le muret du fond en 4 s) ; `feuille` (instant : une feuille s'envole) ; `cast` | `MGF.ANN` : foyer `{x:540, y:1395}`, roue `{x:745, y:1170, r:128}`, ballon conseillé `{x:540, y:1250–1290, s:0.95}` |
| `MGF.versailles(t, o)` + `MGF.versaillesAvant(t)` (balustrades et vases aux deux coins, y ≈ 1530–1610) | château brique et pierre, toits d'ardoise à lucarnes et plombs dorés, grille dorée, pavés ; bois sombres sur une colline à droite ; oriflammes unies (bleu, ivoire, rouge) qui ondulent ; fontaine à jet ; tribune drapée rouge et or ; estrade octogonale drapée ; deux mâts à poulies ; orangers en caisse ; lanternes allumées | `paon` (instant : traverse au fond de droite à gauche en 5 s, y 1340) ; `ballonLoin` 0..1 (petit ballon bleu qui descend derrière les bois) ; `mats:false`, `estrade:false`, `oriflammes:false` (plan 5 : mâts vides = garder les mâts) | `MGF.VER` : `mats` `[[262,330],[818,330]]` (points de corde), ballon conseillé `{x:540, y:930, s:0.85}` avec `cageS:1.4`, fontaine `[960,1240]` |

## Exemples d'appels qui marchent
```js
MGF.annonay(t, { feu: 1, fumee: 0.8, noire: 0.6 });
MGF.ballon(540, 1250, 0.95, { type: 'annonay', gonfle: 0.85, t, balance: 0.6, fumee: 0.6, cordes: [[300, 1395], [790, 1395]] });
M.drawFloor();
MGF.joseph({ t, nez: 1 }, 300, FEET, 0.9, { dir: 1, cast }); MGF.etienne({ t, presente: 1, cible: [540, 900] }, 780, FEET, 0.9, { dir: -1, cast });
// Versailles : ballon tenu entre les mâts, cage pendue ouverte, animaux révélés
MGF.ballon(540, 930, 0.85, { type: 'versailles', t, balance: 1, cordes: MGF.VER.mats, cage: { mouton: { agrippe: 1 }, canard: { ailes: 1, cou: 1, blase: 1 }, coq: true, couvercle: 1 }, cageS: 1.4 });
// Pilâtre entre avec la cage
MGF.pilatre({ t, porte: 1, marche: 1, tenuO: { echelle: 0.72, mouton: { mache: 1 }, canard: true, coq: { chante: 1 } } }, 330, FEET, 0.9, { dir: 1, cast });
```
