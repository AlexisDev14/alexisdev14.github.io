# persos.md — « Wonder Woman, l'héroïne née d'un détecteur de mensonges » : mode d'emploi de `persos.js`

Espace de noms : `M.ww` (dans `scene.js` : `const WW = M.ww;`). Dans `S.init` : `WW.init()` (pré-rendus `WW.K` : cielJ/N, fondJ/N, milJ/N, solJ/N de la rue).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Planche de référence : `casting/scene.js` (page = seconde : 0 rue + les cinq, 1 comparaisons, 2-3 gestes Marston dir ±1, 4-5 autres gestes dir ±1, 6 balayages + `M.ik` + prises, 7 détecteur + couvertures, 8 rue de nuit + lasso, 9,97 téléphone). Rendu : 0 ligne « ATTENTION ». Aucune lettre, aucun chiffre nulle part.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut)
Toujours par l'enveloppe `WW.nom(pose, x, y, s, o)` : elle prépare la pose (gestes → angles, objet tenu, seconde main). Elle renvoie `r` : `r.w('pièce', x, y)` = point écran ; `r.main` / `r.mainB` = poing avant / arrière ; `r.torse` = milieu du torse (cible du lasso) ; `r.tete` = haut du crâne ; `r.q` = pose finale.
`WW.nom.pose(p)` = pose finale sans dessiner (pour `M.ik`, `M.partMatrices`) ; `WW.nom.def()` = la définition (`C.wwMarston`, `C.wwWonder`, `C.wwMechant`, `C.wwHerosBleu`, `C.wwHerosNoir`).

Options communes :
- `t` (obligatoire : respiration, marche, tremblements) ; `marche` 0..1 ou `true` (+ `cadence`, 1,1 pas/s) ; `respire:false` coupe le souffle.
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'poire' | 'sac' | 'corde'` ; `tenuO` / `tenuBO` : options de l'objet (`presse` pour la poire).
- `droit` / `droitB` : `true` par défaut (l'objet reste droit à l'écran) ; `deuxMains` : la main arrière va sur la seconde prise (sac, corde).
- `handF` / `handB` : `'fist' | 'open'` ; `face : { brow, mouth, eyes }` ; `expr` `'neutre' 'ravi' 'surpris' 'fier' 'triste' 'fache' 'peur' 'malin'`. Tout `ang.*` s'ajoute après les gestes. Gestes 0..1 (mélange progressif) et cumulables.
- Point nommé de l'objet tenu : `WW.pt(r, 'nom')` (`'prise'` = point tenu ; main arrière : `WW.pt(r, 'nom', true)`).
- Jambes à genou : pièces `legF_up legF_lo legB_up legB_lo` (pas `legF`). Pièces de bras : `armF_up armF_lo armB_up armB_lo`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `WW.marston` | 0,9 ≈ 478 px (cheveux), ≈ 110 px de large | `cheveux`, `brassardP` | `pompe` (tient la poire d'office et la presse en rythme ; `presse` 0..1 pour fixer ; `cible` écran = où mettre la main, défaut devant la ceinture ; tube : `WW.pt(r,'tube')`) ; `ajuste` (poing au pont des lunettes) ; `idee` (main ouverte levée devant le visage, sourcils levés, bouche « o ») ; `pousse` (penché, deux mains sur `cible` écran = `WW.detecteurPt(..., 'poignee')`) ; `cherche` (main en visière, tête qui balaie) ; `poignee` (main ouverte tendue qui secoue) ; `fier` (torse bombé, menton levé, main au revers) ; `abattu` (tête basse, buste penché, épaules tombées) ; `assis` (voir ci-dessous) ; `brassard: 1` (manchette grise sur le bras avant ; point du tube `WW.brassardPt(r)`) |
| `WW.wonder` | 0,9 ≈ 477 px (diadème), ≈ 100 px de large | `cheveuxB` (cheveux longs), `cheveux`, `diademe`, `lassoH` (lasso enroulé à la hanche), `eclatF/B` | `bracelets` (deux avant-bras levés devant elle, bracelets vers le public ; met `eclat` = geste) ; `lance` (bras avant levé, `tenu:'corde'` d'office, lasso de la hanche retiré : boucle par `WW.lasso` sans `a`) ; `tient` (corde à deux mains, penchée en arrière, jambes en appui) ; `ouvre` (bras en V vers le haut, sourire) ; `fiere` (poing sur la poitrine, menton levé) ; `eclat` 0..1 (étoile de lumière qui pulse sur les bracelets) ; `enroule:false` retire le lasso de la hanche ; sourire par défaut (`face.mouth:'n'` pour l'enlever) |
| `WW.mechant` | 0,85 ≈ 438 px (chapeau), ≈ 70 px de large | `chapeau` | sac de butin à la main d'office (`sac:false` pour l'enlever) ; `rase` (courbé, sur la pointe des pieds, pas furtifs, sac contre lui) ; `ligote` (bras collés au corps, sautille ; lâche le sac) ; `avoue` (tremble, bouche ronde, yeux ronds, mains ouvertes : le sac est lâché, le plan le fait tomber avec `WW.sac`) |
| `WW.herosBleu` | 0,9 ≈ 505 px, ≈ 130 px de large avec la cape | `cape` (rouge, ondule), `haut` (cheveux), `boucle` (accroche-cœur) | `muscles` (double biceps en V, biceps gonflés) ; `poings` (deux poings au-dessus des épaules) ; `perplexe` (poing sous le menton, tête penchée) ; `vent` 0..1 (cape qui claque) |
| `WW.herosNoir` | 0,9 ≈ 524 px (oreilles), ≈ 150 px de large avec la cape | `cape` (noire festonnée), `haut` (oreilles de la cagoule) | mêmes noms, postures DIFFÉRENTES : `muscles` (un biceps levé, l'autre poing bas) ; `poings` (garde de boxeur devant le visage) ; `perplexe` (main qui gratte le haut de la cagoule) ; `vent` |

**Marston assis** (`assis: 1`) : `(x, y)` = sol **sous le bassin** ; les pieds partent ≈ 118·s vers l'avant. Assise (dessous des cuisses) : `WW.marston.siege(x, y, s, dir)` → `[x − 6·s·dir, y − 115·s]` : dessiner le fauteuil AVANT Marston ; l'avant-bras arrière se pose à plat vers l'avant, main à ≈ `[x + 70·s·dir, y − 192·s]` : accoudoir à ≈ y − 180·s. Le bras avant est tendu devant (`cible` écran pour le placer) : avec `brassard: 1`, `WW.detecteur(..., { brassard: WW.brassardPt(r), manchette: false })` relie le tube.

**`bendSign` de `M.ik`** (vérifié page 6 : cible haute pour le bras avant, basse pour le bras arrière, dans les deux sens ; balayages 0 → 2,4 rad ; zéro ligne ATTENTION) :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Marston, Wonder Woman, méchant, héros bleu, héros noir | 1 | 1 | 1 | 1 |
(`WW.BEND` donne le même tableau.) `M.ik(C.wwMarston, WW.marston.pose({t}), x, FEET, 0.9, dir, 'armF', [X, Y], 1)`. Cibles toujours DEVANT le personnage, à moins de ≈ 190·s px de l'épaule.

Pièges :
- Les gestes `pompe`, `pousse`, `idee`, `cherche`, `ajuste` pilotent le bras avant : n'en combiner qu'un à la fois ; `assis` se combine avec `pompe` ou `idee`.
- `ligote` + `avoue` se combinent (tremble ligoté) ; sans `ligote`, `avoue` lève les mains ouvertes.
- Héros : jamais le même geste au même instant pour les deux (les postures diffèrent déjà, mais ne pas les synchroniser).
- Wonder Woman qui monte par la trappe : la dessiner APRÈS `WW.rue`, découpée au-dessus de `WW.RUE.trappe.y` (clip `rect(0, 0, W, 1118)`), centrée sur `WW.RUE.trappe.x` (900).

## Le lasso doré (coordonnées écran)
`WW.lasso(t, { de, a, boucle, lueur, rx, ry, mou, moitie, s })` → `{ centre, noeud, rx, ry }`.
- `de` = point de la main : `WW.wonderMain(r)` (bout de la corde qui sort du poing ; avec `tient`/`lance`). La corde part TOUJOURS de ce point.
- `a` = centre de la boucle : `r.torse` du méchant (calculé d'avance : `M.partMatrices(C.wwMechant, WW.mechant.pose(p), x, FEET, 0.85, dir)` puis `M.wpt(mats.torso, 0, -84)`). Sans `a` : la boucle tournoie au-dessus de la main (geste `lance`).
- `boucle` 0 = grande boucle ouverte qui vole (240 × 88 px) → 1 = deux tours serrés (140 × 44 px, `rx` 70 / `ry` 22 par défaut). Pour le jet : déplacer `a` de la main vers la cible avec `boucle` 0, puis `boucle` → 1 à l'arrivée.
- `lueur` 0..1 : halo doré qui pulse + étincelles le long de la corde (« il dit vrai »). `mou` : flèche de la corde (défaut 0,45 → 0,06 quand la boucle se serre). Trait 7 px (+ liseré) à `s` 1.
- Autour d'un torse : `moitie:'arriere'` AVANT de dessiner le méchant, `moitie:'avant'` APRÈS (voir page 8 de la planche).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre`, `o.t`. Point écran : `WW.accPt('nom', x, y, s, o, 'point')`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `WW.detecteur(x,y,s,o)` | sol (milieu des pieds ; des roues si `chariot`) | s 1 : boîte 224 × 200, cadran Ø 160 (176 avec la bague), 290 px de haut avec le tambour ; `chariot` : 406 px de haut, poignée 230 px en arrière | `aiguille` 0..1 (0 repos à gauche dans le vert, 0,5 verticale, 1 à droite dans le rouge ; voyant vert < 0,45, voyant rouge > 0,65) ; `tremble` 0..1 ; `trace` 0..1 (longueur de la courbe sur le tambour, elle monte avec l'aiguille) ; `affaisse` 0..1 (aiguille qui pend sous le repos, boîte qui s'incline) ; `saute` 0..1 (sautille de joie, temps global) ; `chariot` (true) + `roule` (px parcourus : roues qui tournent) ; `brassard: [x,y]` écran (le tube va jusque-là ; manchette dessinée là, orientée par `brassardAng` rad ; `manchette:false` = tube seul) ; `poire: [x,y]` écran (tube jusqu'à la poire tenue par Marston : `WW.pt(r,'tube')` ; sans elle la poire pend au flanc gauche) ; points `WW.detecteurPt(x,y,s,o,nom)` : `cadran`, `haut`, `dessus`, `poignee` (chariot), `tubeBrassard`, `tubePoire`. Le cadran ne s'affiche jamais en miroir (vert toujours à gauche). |
| `WW.couverture(x,y,s,o)` | milieu du bord HAUT | s 1 : 110 × 150 ; s 0,8 = 88 × 120 (kiosque) ; ≥ 1,07 pour 160 px | `n` `'a'` héros bleu en vol (fond ciel) \| `'b'` héros noir aux ailes festonnées, lune (violet) \| `'c'` Wonder Woman au lasso, diadème, bracelets (jaune soleil) \| `'d'` policier et voleur (vert) \| `'e'` cow-boy cabré (orange) ; `pince` (pince à linge en haut) ; jamais en miroir |
| `WW.sac(x,y,s,o)` | dessous | s 0,85 : 82 × 112 | sac de butin ficelé, pièce rapiécée, sans inscription ; points `centre`, `cou`, `bas` |
| `WW.poire(x,y,s,o)` | dessous | s 1 : 34 × 58 | `presse` 0..1 (s'écrase) ; point `tube` |
| `WW.brassard(x,y,s,o)` | centre | s 1 : 48 × 30 | `ang` (rad) : manchette seule, à poser par-dessus un bras (volontaire du plan 2) |
Tenus (via `tenu`) : poire (≈ 31 × 52 px à 0,9), sac (≈ 82 × 112 à 0,85), corde (écheveau doré sous le poing).

## Décor récurrent : la rue de New York 1940-41 et son kiosque (pré-rendu par `WW.init()`)
`WW.rue(t, up, o)` EN PREMIER (avant `M.drawFloor()`), `WW.rueSol(t, up, o)` juste APRÈS (premier plan). `up` (px) monte tout le décor. Passer le même `nuit` aux deux. Animations en temps global (sans saut à la coupe) : nuages qui défilent, vol de pigeons, pigeons perchés qui picorent (corniche, toit du kiosque), fenêtres qui s'allument une à une (nuit), flamme et halo du bec de gaz, ampoule du kiosque qui oscille, couvertures qui se balancent, vapeur de la bouche d'égout, étoiles et faisceaux de projecteurs (nuit).

| Option | Effet |
|---|---|
| `nuit` 0..1 | 1 (p1) = nuit : lune, étoiles, 3 projecteurs qui balaient, fenêtres allumées ; 0,35 (p4, p5) = fin d'après-midi dorée, soleil bas (la lune et les projecteurs n'apparaissent qu'au-delà de 0,5) |
| `kiosque` | lettres des couvertures pendues, défaut `'abcde'` ; p4 : `'abde'` (pas encore de Wonder Woman), p5 : `'abcde'` (le c apparaît dans SA case) ; `''` = aucune |
| `trappe` 0..1 | la planche du comptoir (x 850–950) se relève à la verticale, trou noir dessous |
| `chat` 0..1 | événement p1 : chat noir qui traverse le 2e palier de l'escalier de secours (gauche → droite) |
| `feuille` 0..1 | événement p4 : une feuille de journal s'envole du comptoir vers le haut à gauche |
| `fenetre` 0..1 | événement p5 : la 4e fenêtre de la façade de brique (2e étage, à droite) s'éclaire |
| `projecteurs:false`, `pigeons:false` | coupent ces animations |

Repères `WW.RUE` : zone des personnages dégagée x 250–750 (le kiosque commence à 752) ; `kiosque {x0:752, x1:1028}` ; `comptoir {x0:744, x1:1036, y:1118}` (dessus du comptoir, piles ficelées aux deux bouts) ; `trappe {x0:850, x1:950, y:1118, x:900}` ; `auvent {y0:700, y1:770}` (rayé ocre et ivoire) ; `ficelles` y 800 et 948 (x 768–1012) ; `couv` = pinces des couvertures `a [808,803]`, `c [890,806]`, `b [972,803]`, `d [846,951]`, `e [944,951]` à `couvS` 0,8 ; `becGaz {x:120, y:730}` (lanterne) ; `egout {x:215, y:1488}` (sur le plancher) ; `ampoule {x:890, y:790}` ; `facade` (brique x 0–244, corniche y 150, paliers de l'escalier de secours y 352/532/712, vitrine du café x 16–200 y 1010–1290, store rayé y 900–984) ; `enseigneCafe {x:272, y:848}` (tasse), `enseigneChapeau {x:968, y:556}` ; `toits` (châteaux d'eau) [330,760], [680,800].
Fond : tours art déco (couronne d'arcs et flèche x 520, tour à gradins et mât x 690), pont suspendu x 340–720 (tablier y 934), immeubles de brique et d'ocre, châteaux d'eau. Premier plan (`rueSol`) : bouche d'incendie rouge x 84, caisse de journaux x 180, poubelle en tôle x 996 (bas y 1590–1600), bouche d'égout fumante.
Vignette de téléphone (270 × 480, page 9,97) : la rue reste habitée et lisible de jour comme de nuit.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'WW\.' casting/scene.js`). Les trois appels les plus utiles :
```js
// p1 : Wonder Woman tient le méchant au lasso, dans la rue de nuit
WW.rue(t, 0, { nuit: 1, chat: smooth(2, 6, t) }); M.drawFloor(); WW.rueSol(t, 0, { nuit: 1 });
const qm = WW.mechant.pose({ t, ligote: 1, avoue: 1 }), { mats } = M.partMatrices(C.wwMechant, qm, 650, FEET, 0.85, -1), torse = M.wpt(mats.torso, 0, -84);
const rW = WW.wonder({ t, tient: 1, eclat: 0.8 }, 330, FEET, 0.9, { dir: 1, cast });
WW.lasso(t, { de: WW.wonderMain(rW), a: torse, boucle: 1, lueur: 1, moitie: 'arriere' });
WW.mechant({ t, ligote: 1, avoue: 1 }, 650, FEET, 0.85, { dir: -1, cast });
WW.lasso(t, { de: WW.wonderMain(rW), a: torse, boucle: 1, lueur: 1, moitie: 'avant' });
// p3 : Marston pousse le détecteur sur son chariot (le détecteur d'abord, Marston ensuite)
const dx = 560, oD = { t, chariot: true, roule: 60 * t, aiguille: 0.3 }; WW.detecteur(dx, FEET, 0.9, Object.assign({ cast }, oD));
WW.marston({ t, pousse: 1, marche: 1, cible: WW.detecteurPt(dx, FEET, 0.9, oD, 'poignee') }, dx - 330, FEET, 0.9, { dir: 1, cast });
// p6 : Marston assis, brassard au bras, l'aiguille grimpe
fauteuil(WW.marston.siege(420, FEET, 0.9, 1));   // fauteuil dessiné par le plan
const r = WW.marston({ t, assis: 1, brassard: 1 }, 420, FEET, 0.9, { dir: 1, cast });
WW.detecteur(700, FEET, 0.9, { t, aiguille: smooth(4, 6, t), trace: smooth(3, 7, t), tremble: 0.6, brassard: WW.brassardPt(r), manchette: false, cast });
```
