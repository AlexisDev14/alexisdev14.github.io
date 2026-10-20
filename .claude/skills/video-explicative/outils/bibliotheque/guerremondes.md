# persos.md — « La Guerre des mondes, la panique qui n'a pas eu lieu » : mode d'emploi de `persos.js`

Espace de noms : `M.gdm` (dans `scene.js` : `const GDM = M.gdm;`). Dans `S.init` : `GDM.init()` (pré-rendus `GDM.K` : stRegie, stFond, stMilieu, stSol, rdVue, rdMur, rdMilieu, rdSol).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Planche de référence : `casting/scene.js` (pages 0 à 8 + 9,97 ; variantes à 9,6 s). Aucune lettre, aucun chiffre nulle part.

## Marionnettes humaines (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `GDM.welles(pose, x, y, s, o)` / `GDM.patron(...)` : elle prépare la pose (gestes → angles, objet tenu, seconde main). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran). `GDM.welles.pose(p)` / `GDM.patron.pose(p)` = pose finale sans dessiner (pour `M.ik`, `M.partMatrices`).

Options communes :
- `t` (obligatoire : fumée, marche, rire, tremblements) ; `marche` 0..1 ou `true` (+ `cadence`, 1,1 pas/s) ; `respire:false` coupe le petit souffle.
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'feuillets' | 'journal' | 'cigare' | 'valise' | 'sac'` ; `tenuO` / `tenuBO` : options de l'objet (`echelle`, `face`, `plie`, `prise`, `fumee`).
- `droit` / `droitB` : `true` par défaut (l'objet reste droit à l'écran) ; `ang.objet` / `ang.objetB` l'inclinent. `deuxMains` : la main arrière va d'elle-même sur la seconde prise.
- `handF` / `handB` : `'fist' | 'open'` ; `face : { brow, mouth, eyes }` ; `expr` (préréglage de visage, ci-dessous). Tout angle `ang.*` s'ajoute après les gestes.
- Point écran d'un point nommé de l'objet tenu : `GDM.pt(r, 'nom')` (main arrière : `GDM.pt(r, 'nom', true)` ; `'prise'` = point tenu).

| Fonction | Échelle, taille | Pièces | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `GDM.welles` (`C.gdmWelles`) | 0,92 ≈ 502 px (haut des cheveux), ≈ 100 px de large | `head`, `cheveux`, `torso`, `armF/B_up/_lo`, `legF/B`, `objet(B)`, `doigts(B)` | `micro` (penché, main avant sur le pied du micro ; `cible` = point écran, en général `GDM.microPt(mx, FEET, 1, {}, 'tube')`) ; `feuillets` (liasse tenue devant la poitrine par le bord ; passe dans la main ARRIÈRE si `micro`, `valise` ou un autre `tenu`) ; `leveMain` (main ouverte levée, couper l'orchestre) ; `brasOuvert` (bras avant ouvert vers l'avant-haut + bras arrière, bouche ouverte) ; `excuse` (main avant sur le cœur, tête baissée, yeux mi-clos) ; `valise` (valise par la poignée, bras pendant ; avec `marche`) ; `sourire` (coin de la bouche malin, sourcil levé) ; `expr` `'neutre' 'malin' 'theatre' 'gene' 'surpris'` |
| `GDM.patron` (`C.gdmPatron`) | 0,92 ≈ 468 px, ≈ 125 px de large (ventre) | `head` (couronne grise peinte), `moustache`, `cigareB` (cigare aux dents), mêmes bras/jambes | `brandir` (journal une de face à deux mains, coins hauts, au-dessus du ventre, visage dégagé ; journal ≈ 203 × 264 px) ; `tape` (main ouverte qui tape la une ; sans `cible` il tient lui-même le journal dans la main arrière ; avec `cible` écran il tape ce point, ex. un journal posé) ; `fache` (poing serré qui tremble devant lui, sourcils froncés, `rouge` auto) ; `rire` (épaules secouées, yeux plissés, bouche ouverte muette, main sur le ventre) ; `recoit` (deux mains ouvertes tendues devant ; avec `tenu:'sac'` le sac repose sur les paumes) ; `cigare` (cigare porté à la bouche, incliné, main sous le menton) ; `bouche:true` (cigare aux dents, fumée) ; `rouge` 0..1 ; `expr` `'neutre' 'fier' 'fache' 'ravi' 'surpris' 'inquiet'` |

**`bendSign` de `M.ik`** (vérifié sur la planche : gestes, balayage 0 → 2,4 rad et rang `M.ik` direct, zéro ligne ATTENTION) :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Welles (tous gestes) | 1 | 1 | 1 | 1 |
| patron (tous gestes) | 1 | 1 | 1 | 1 |
(`GDM.BEND` donne le même tableau.) Cibles toujours DEVANT le personnage (côté du regard), jamais plus de ≈ 185 px × s de l'épaule.

Pièges :
- `brandir` : le bras avant passe sur la frise de titre (le haut de la une) : voulu, la manchette noire et la gravure restent visibles. Ne pas monter `armF_up` au-delà : le journal cacherait le menton.
- `cigare` incline le cigare (`ang.objet` + 0,75) ; `tenu:'cigare'` seul le tient horizontal à hauteur de taille. `bouche:true` est ignoré si le cigare est en main.
- `tape` sans `cible` met le journal dans la main arrière (prise `gauche2`, sur le bord haut) : il couvre le ventre et les cuisses ; prévoir le personnage à x ≥ 300 (dir 1).
- Patron et Gontran (`galette.js`) partagent crâne chauve + moutarde : ne jamais les mettre ensemble ; le patron se lit par la couronne et la moustache grises, les manches ivoire rayées, le nœud papillon rouge, le gilet à fins carreaux, le cigare.
- Welles au micro : micro à ≈ 130 px devant lui (`x + 130·dir`, micro s 1) : la capsule (398 px du sol) tombe face à sa bouche.

## Le tripode martien (marionnette à tige, `def.libre`)
`GDM.tripode(pose, x, y, s, o)` (`C.gdmTripode`) — s 1 ≈ 550 px de haut (pointe du dôme), ≈ 280 px de large (pieds) ; s 0,62 ≈ 340 px ; **s 0,4 ≈ 220 px** (lisible en vignette). Tige sous le moyeu.
Options de `pose` : `t` (obligatoire) ; `phase` (tours ; marche en trépied, une jambe levée à la fois : `phase = vitesse·t`) ; `tentacules` `'repos'` (pendants, bouts enroulés) | `'menace'` (levés, comiques) | `'tient'` (tiennent le journal) ; `lueur` 0..1 (œil rouge qui luit, défaut 0,4) ; `peur` 0..1 (jambes qui tremblent et fléchissent, dôme rentré dans le collier, œil grand ouvert) ; `reverence` 0..1 (le dôme s'incline vers l'avant) ; `journal` : `true` ou `{ face, plie, echelle }` (met `tentacules:'tient'` : journal une de face devant, ≈ 187 × 243 px à s 1, l'œil reste visible au-dessus).
Pièces : `hub` (moyeu), `dome`, `fin` (pointe), `collier`, jambes `jA1 jA2 pA` (avant), `jB1 jB2 pB` (arrière), `jC1 jC2 pC` (milieu, plus sombre), `tentacules`. Points : œil = `r.w('dome', 58, -74 + 46·peur)` ; centre du journal = `r.w('hub', 190, 98)`.
`def.libre = { armF, armB, legF, legB }` : machine sans bras ni jambes humains (trois jambes d'insecte articulées vers l'extérieur, deux tentacules en ruban) ; le contrôle du kit coude/main/pied ne s'y applique pas. `GDM.tripodePose(p)` = pose finale.
Dessin gravé du tripode (encre, pour une une, une affiche) : `GDM.dessins.gravTripode(cx, solY, hauteur)` ; famille qui fuit : `GDM.dessins.coureur(x, solY, h, {chapeau, robe, chignon, valise})`.

## Accessoires (sans tige : ils volent)
Appel : `GDM.nom(x, y, s, o)`. Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)` ; `o.ang` pour le journal), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Point écran : `GDM.accPt('nom', x, y, s, o, 'point')` (raccourcis `GDM.microPt`, `GDM.radioPt`, `GDM.journalPt`).

| Fonction | `(x,y)` = | Taille à s 1 | Options, points nommés |
|---|---|---|---|
| `GDM.micro` | sol (milieu du socle) | 462 px de haut, capsule centrée à 398 px du sol | `lueur` 0..1 (reflet qui glisse, défaut 0,5) ; `oscille` 0..1 (balancement de la capsule dans sa lyre, défaut 1, temps global) ; points `capsule`, `tube` (prise de la main, 300 px), `haut`, `socle` |
| `GDM.radio` | milieu de la base posée | 184 × 236 px (≥ 200 px : s ≥ 0,85) | `lueur` 0..1 (cadran ambre) ; `aiguille` 0..1 (une station → l'autre) ; `bouton` (rad) ; `ondes` 0..1 (arcs de papier qui montent) + `couleurOndes` (hex, défaut ivoire) ; `vibre` 0..1 ; `t` obligatoire ; points `cadran`, `haut`, `grille`, `boutonG`, `boutonD` |
| `GDM.journal` | **centre** | 240 × 312 px (lisible ≥ 260 × 340 : s ≥ 1,1) | `face` `'une'` (frise de titre, grosse bande noire, gravure du tripode au-dessus d'une famille qui fuit, colonnes grises) \| `'dos'` (colonnes + petite gravure d'immeuble) ; `plie` 0..1 (moitié basse repliée derrière) ; `ang` ; prises `gauche` (coin haut côté dos), `gauche2` (bord haut, 56 px du coin), `droite` (coin haut côté regard) ; points `centre`, `gravure`, `manchette`, `haut`, `bas`. Tenu par `dir −1` : le dessin est contre-retourné (jamais en miroir) |
| `GDM.pile` | milieu de la base | 236 × (13·n + 8) px | `n` (6) : journaux pliés ficelés en croix, nœud dessus ; point `haut` |
| `GDM.valise` | dessous | 156 × 129 px (avec la poignée) | prise = poignée ; points `centre`, `bas` |
| `GDM.sac` | dessous | 112 × 130 px | sac d'argent renflé ficelé, sans inscription ; `prise` `'cou'` (défaut) \| `'dessous'` (sur les paumes) ; points `centre`, `cou` |
| `GDM.feuillets` | bas de la liasse | 92 × 116 px | `n` (4) ; prise = bord gauche ; points `centre`, `haut`, `bord` |
| `GDM.cigare` | dessous | 60 × 10 px (+ fumée) | `fumee` (true) ; points `braise`, `bouche` (la fumée monte toujours vers le haut de l'écran) |
Tenus (via `tenu`) : feuillets ≈ 85 × 107 px, valise ≈ 144 × 119, sac ≈ 103 × 120, cigare ≈ 55 px de long à s 0,92.

## Décors récurrents (pré-rendus par `GDM.init()`)
Les deux décors se dessinent EN PREMIER (avant `M.drawFloor()`), leur premier plan juste APRÈS `M.drawFloor()` et avant les marionnettes. `up` (px) monte tout le décor (changement par la trappe). Animations en temps global (sans saut à la coupe).

| Appel | Options | Repères utiles (`GDM.STUDIO`, `GDM.REDACTION`) |
|---|---|---|
| `GDM.studio(t, up, o)` puis `GDM.studioSol(t, up)` | `antenne` 0..1 (lampe rouge ronde sans lettre au-dessus de la porte, défaut 1 ; P6 l'éteint vers 3,2 s) ; `lumiere` 0..1 (1 = lumière chaude, 0 = pénombre ; assombrit le décor seulement) ; `casque` 0..1 (de 0 à 1 l'ingénieur de la régie porte la main à son casque puis la redescend, P1 ≈ 1,6 s : `smooth(1.3, 2.3, t)`) ; `partition` 0..1 (la partition glisse du pupitre et tombe en planant, P2 ≈ 7,0 s) ; `projecteur` 0..1 | murs capitonnés en losanges ; baie de la régie x 640–900, y 330–600 (ingénieur en ombre chinoise, cadrans ambrés qui clignotent, vu-mètres) ; haut-parleur (300, 330) ; pendule (470, 300) ; porte capitonnée à hublot x 775–965 dès y 860 ; lampe à l'antenne (870, 800) ; rideaux bordeaux qui ondulent x 46–250 ; piano noir x 120–300 (dessus y 1055, tasse fumante x 272, métronome x 168) ; projecteur (250, 880) dont le faisceau poussiéreux tombe sur x 470–770 ; pupitre x 350 ; table de bruitages x 600–770 (dessus 1185 : porte miniature, noix de coco, casserole ; bassine dessous) ; feuille de tonnerre x 700, y 660–850 (oscille) ; premier plan : chaise pliante + veste x 190, cendrier sur pied qui fume x 915, câbles x 760 |
| `GDM.redaction(t, up, o)` puis `GDM.redactionSol(t, up)` | `rotative` vitesse 0..1 (défaut 1 ; **constante pendant un plan**, sinon les rouleaux sautent) ; `sonne` 0..1 (les deux téléphones sautillent avec des arcs de sonnerie ; `sonneA` / `sonneB` pour un seul) ; `pigeon` 0..1 (P4 ≈ 4,0 s : il arrive et se pose sur le rebord de la fenêtre de gauche à 0,4) ; `feuille` 0..1 (P5 ≈ 1,3 s : une feuille s'envole du bureau de gauche) ; `lampes` (true) | hautes fenêtres à petits bois x 130–300, 410–590, 740–910, y 250–800 (gratte-ciel, château d'eau en bois, cheminées qui fument, nuages qui défilent ; rebord extérieur y 784) ; rayon poussiéreux de la fenêtre de gauche ; ventilateur de plafond (540, 300) ; lampes vertes suspendues x 270, 540, 810 (abat-jour y 560–594, oscillent) ; pendule (665, 330) ; tubes pneumatiques en laiton x 352 (capsule qui passe) ; radiateurs ; casier à journaux x 108–250 ; bureau A x 112–346 (dessus 1195 : machine à écrire x 210, téléphone x 318) ; bureau B x 540–700 (dessus 1215 : papiers, téléphone x 668) ; rotative noire x 730–965 dès y 1010 (rouleaux, volant, bande de papier vers le plateau x 690) ; piles ficelées x 470, 520, 680 ; premier plan : corbeille débordante x 205, porte-manteau à chapeau x 945, crachoir x 870 |
Vignette de téléphone (270 × 480) : les deux décors restent habités (page 9,97 de la planche).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'GDM\.' casting/scene.js`). Les trois appels les plus utiles :
```js
// Welles au micro, script dans la main arrière, sourire malin (studio)
GDM.studio(t, 0, { antenne: 1 }); M.drawFloor(); GDM.studioSol(t, 0);
GDM.micro(560, FEET, 1, { t, cast });
GDM.welles({ t, micro: 1, feuillets: 1, sourire: 1, cible: GDM.microPt(560, FEET, 1, {}, 'tube') }, 430, FEET, 0.92, { dir: 1, slot: ST.slotF, cast });
// Le patron brandit la une, cigare aux dents (rédaction)
GDM.redaction(t, 0, { sonne: 1 }); M.drawFloor(); GDM.redactionSol(t, 0);
const r = GDM.patron({ t, brandir: 1, bouche: true }, 470, FEET, 0.92, { dir: 1, slot: ST.slotF, cast });   // GDM.pt(r, 'gravure') = centre de la gravure
// Le tripode de carton croit le journal et prend peur (P6)
GDM.tripode({ t, journal: true, peur: smooth(6.2, 7.0, t), lueur: 1 }, 560, FEET, 0.8, { dir: -1, slot: ST.slotF, cast });
```
