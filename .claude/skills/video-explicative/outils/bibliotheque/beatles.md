# persos.md — « Les Beatles, recalés par Decca » : mode d'emploi de `persos.js`

Espace de noms : `M.btl` (dans `scene.js` : `const BTL = M.btl;`). Dans `S.init` : `BTL.init()` (pré-rendus `BTL.K` : `buVue`, `buMur`, `buPorte`, `buSol`). Pour le studio, le micro et la radio : `GDM.init()` (bibliothèque `guerremondes`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle indiquée (hauteur pieds → haut des cheveux). Aucune lettre, aucun chiffre, aucun logo nulle part.
Planche de référence : `casting/scene.js` (une page par demi-seconde, `P = round(2t)` ; page 20 à 9,97 s).

## Marionnettes (avec tige ; défaut `slot: ST.slotF`, passer `ST.slotB` au rang du fond)
Toujours par l'enveloppe : elle prépare la pose (gestes → angles, objet tenu, seconde main). Elle renvoie `r` : `r.w('pièce', x, y)` = point écran, `r.main` / `r.mainB` = poing avant / arrière (écran), `r.q` = pose finale.
`BTL.musicien.pose(qui, pose, x, y, s, o)`, `BTL.rowe.pose(…)`, `BTL.epstein.pose(…)` = pose finale sans dessiner (pour `M.ik`, `M.partMatrices`).

Options communes :
- `t` (obligatoire : respiration, marche, grattage, fumée) ; `respire:false` coupe le petit souffle ; `marche` 0..1 ou `true` (pas sur place, la scène déplace `x` ; `cadence` en pas/s, 1,5).
- `assis` 0..1 + `siege` = **y écran du dessus de l'assise** (hanche posée dessus, jambes pliées, pieds au sol si l'assise est à ≈ 100 px du sol à s 0,9). Sans autre geste, les mains se posent sur les cuisses.
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'guitare' 'basse' 'contrat' 'stylo' 'disque' 'baguette' 'pipe' 'mallette'` ; `tenuO` / `tenuBO` = options de l'objet (celles de l'objet seul, + `echelle`, `prise`).
- `droit` / `droitB` : `true` par défaut (l'objet reste droit à l'écran) ; `ang.objet` / `ang.objetB` l'inclinent. `deuxMains` : la main arrière va d'elle-même sur la seconde prise (contrat, disque, guitare par la caisse).
- `handF` / `handB` : `'fist' | 'open'` ; `face : { brow, mouth, eyes }` ; `expr` : `'neutre' 'sourire' 'ravi' 'surpris' 'inquiet' 'degout' 'fache' 'triste' 'fier'`. Tout `ang.*` s'ajoute après les gestes. `cible` = point **écran** visé par certains gestes.
- `BTL.pt(r, nom)` = point écran : de l'objet tenu en main avant (`BTL.pt(r, nom, true)` : main arrière ; `'prise'` = point tenu), ou, sans objet en main, de l'instrument porté contre le corps (`joue`, `serre`). Points de la guitare : `manche`, `haut`, `tete`, `caisse`, `cordes`, `bas`, `centre`.

| Fonction | Échelle, taille | Gestes (0..1 sauf mention) |
|---|---|---|
| `BTL.musicien(qui, pose, x, y, s, o)` (`C.btl_<qui>`) | défaut 0,86. Beatles ≈ 446 px à 0,86, ≈ 466 px à 0,9 (Harrison +8) ; torse ≈ 78 px de large ; groupe de 4 espacé de 180 px avec instruments | `joue` (instrument contre le ventre, manche vers l'avant-haut : main avant qui gratte sur la caisse, main arrière qui entoure le manche ; `instrument` `'guitare'|'basse'|'rien'`, `couleur` pour forcer) ; `porte` (instrument tenu par le manche le long du corps, incliné vers l'avant ; avec `etui:true` (+ `ouvert` 0..1) : l'étui noir par sa poignée, à l'horizontale) ; `attend` (menton dans la main, buste penché ; avec `assis`) ; `joie` (bras en V, menton levé, petits sauts) ; `chuchote` (main ouverte près de la bouche, tournée vers l'autre) ; `baguettes` (deux baguettes, bat la mesure sur `cible`, ex. `BTL.accPt('batterie', …, 'caisseClaire')` ; `tempo`, 2 coups/s) ; `front` (main sur le front) ; `tend` (main ouverte devant : poignée de main) ; `signe` (stylo, la pointe va sur `cible` et griffonne ; `griffonne:0` = immobile) |
| `BTL.rowe(pose, x, y, s, o)` (`C.btlRowe`) | 0,9 ≈ 461 px ; ≈ 95 px de large (ventre) | `assis` (+ `siege`) ; `pince` (guitare tenue par le haut du manche, bras tendu, nez plissé, tête en arrière ; `objet` `'guitare'|'basse'`) ; `jette` 0 → 0,45 lève, → 0,8 lance vers l'avant, ≥ 0,8 lâche : `r.lache = true`, `r.lachePt` = point de départ du vol (la scène dessine ensuite `BTL.guitare` qui vole ; `lache:false` pour garder) ; `signe` (+ `cible`) ; `serre` (guitare contre la poitrine à deux mains, yeux fermés, sourire) ; `raide` (figé, lunettes de travers, tremble ; `lunettesRot`, `lunettesDy` à la main) ; `ecoute` (penché, main sur `cible`, ex. `GDM.radioPt(x, y, 0.85, {}, 'boutonG')`) ; `tend` ; `pipe` `'bouche'` (défaut, fume) \| `'main'` (pipe dans la main arrière) \| `'rien'` |
| `BTL.epstein(pose, x, y, s, o)` (`C.btlEpstein`) | 0,9 ≈ 470 px ; ≈ 82 px | `plaide` (deux mains ouvertes en avant, buste penché) ; `abattu` (épaules basses, tête baissée) ; `tend` (tend le disque d'essai dans sa pochette bordeaux, ≈ 133 px) ; `mallette:true` (mallette dans la main arrière, avec `marche`) |

`qui` (chacun sa tenue, sa coiffure, son visage) : `lennon` (cuir bleu nuit court, chemise ivoire, bottines, visage long ; guitare sunburst), `mccartney` (veste ocre, cravate fine noire, visage rond, grands yeux ; basse violon), `harrison` (vert éteint, col roulé ivoire, le plus mince, sourcils épais, frange volumineuse ; guitare acajou), `best` (bordeaux, chemise gris clair, mâchoire carrée, banane ; baguettes) ; `trem1` (bleu ciel passé, chanteur, sans instrument), `trem2` (beige), `trem3` (gris perle **rayé**), `trem4` (rouille) : cheveux courts gominés, sourire, guitare blonde ; `stone1` (anthracite pied-de-poule, chemise bordeaux, cheveux noirs en bataille), `stone2` (le grand : tweed brun-gris, lèvres pleines, mèche), `stone3` (aubergine, casque blond à frange) : guitare noire ; `smith` (producteur en retard : bleu ardoise froissé, cravate de travers, épis, cernes, barbe naissante, paupières lourdes d'office, marche traînante ; ≈ 456 px à 0,86) ; `martin` (George Martin : grand, bleu marine, cravate sombre, cheveux châtain clair courts ; ≈ 459 px à 0,86, ≈ 267 px à 0,5).
Tremeloes et Stones à s 0,76 ≈ 390–410 px, à s 0,5 ≈ 260 px (vignette).

**`bendSign` de `M.ik`** (vérifié : tous les gestes dans les deux sens, balayage épaule et coude 0 → 2,4 rad, `M.ik` direct page 11 ; zéro ligne ATTENTION) :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| tous les `musicien` (13), Rowe, Epstein | 1 | 1 | 1 | 1 |
(`BTL.BEND` donne le même tableau.) Cibles devant le personnage (côté du regard), à moins de ≈ 185 px × s de l'épaule.

Pièges :
- `joue` et `serre` portent l'instrument **contre le torse** (pas dans la main) : `tenu` reste libre ; `BTL.pt(r, 'tete')` marche quand même. Ne pas combiner `joue` et `porte`.
- `porte` incline la guitare de 0,38 rad vers l'avant pour que le haut du manche dépasse du poing ; `ang.objet` la redresse.
- Les Tremeloes sourient d'office : `face:{ mouth:'n' }` pour neutraliser. Smith a les paupières lourdes d'office : `face:{ eyes:'open' }`.
- Rowe fume d'office (fumée dessinée après lui, en coordonnées écran) : `pipe:'rien'` s'il ne doit pas fumer (ex. `serre`, bouche contre la guitare).
- En `jette`, à 0,4 le bras levé tient la guitare au niveau du visage, en avant : ne pas s'y arrêter longtemps.
- `assis` sans `siege` = hauteur de chaise par défaut : passer `siege` (fauteuil du bureau : `BTL.BUREAU.siege.y`, ampli à s k : `y − 130·k`).

## Accessoires (sans tige : ils volent)
Appel `BTL.nom(x, y, s, o)`. Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Point écran : `BTL.accPt('nom', x, y, s, o, 'point')`.

| Fonction | `(x,y)` = | Taille à s 1 | Options, points nommés |
|---|---|---|---|
| `BTL.guitare` | bas de la caisse (bas de l'étui) | 92 × 247 px (≈ 212 px tenue à 0,86) ; étui 116 × 276 | `couleur` `'sunburst'` (Lennon) `'acajou'` (Harrison) `'blonde'` (Tremeloes) `'noire'` (Stones) `'cerise'` ; `etui` (étui noir) + `ouvert` 0..1 (couvercle à charnière gauche, doublure rouge) ; `prise` (tenue) `'manche'` (défaut) `'haut'` `'tete'` `'caisse'` ; points `manche haut tete caisse cordes bas centre` |
| `BTL.basse` | bas de la caisse | 84 × 248 px | basse violon acajou-sunburst, 4 cordes ; mêmes options et points |
| `BTL.batterie` | sol, sous la grosse caisse | 344 × 262 px | `frappe` 0..1 (cymbale qui tremble + arcs, avec `t`) ; peau ivoire sans logo ; points `siege` (tabouret, x −150), `caisseClaire`, `cymbale`, `tom`, `grosseCaisse` |
| `BTL.ampli` | milieu du dessous | 150 × 140 px | `lueur` 0..1 (voyant rouge) ; points `assise` (y −130 : s'y asseoir), `haut`, `centre` |
| `BTL.contrat` | **centre** | 150 × 200 px | lignes ondulées, frise, sceau de cire ; `signe` 0..1 (paraphe d'encre en boucle + trait, sans lettre) ; `prise` `'gauche'` (défaut) `'droite'` `'haut'` ; points `signature` (début du paraphe), `fin`, `sceau`, `centre`, `haut`, `bas` |
| `BTL.stylo` | prise | 8 × 70 px | stylo plume noir et or ; point `pointe` (36 px sous la prise) |
| `BTL.disque` | **centre** | Ø 140 px ; pochette 148 px | `tourne` (rad, ou `true` = tourne avec `t`, reflet + repère) ; `pochette` (couleur, ou `true`) : pochette unie à trou, rond rouge visible ; `sort` 0..1 (le disque sort vers +x) ; couleurs : `BTL.COULEURS_POCHETTE` |
| `BTL.pileDisques` | milieu du dessous | 150 × (8·n + 16) px | `n` (8) ; `seed` (couleurs) ; point `haut` |
| `BTL.baguette`, `BTL.pipe`, `BTL.mallette` | prise / prise / dessous | 86 px ; 50 px ; 124 × 98 px | pipe : points `foyer`, `bec` |

## Décor récurrent : bureau de Dick Rowe (pré-rendu par `BTL.init()`)
`BTL.bureau(t, up, o)` EN PREMIER (avant `M.drawFloor()`), puis `BTL.bureauSol(t, up, o)` juste APRÈS `M.drawFloor()` et avant les marionnettes. `up` (px) monte tout le décor. Animations en temps global : nuages du ciel gris, fumées des cheminées, voilages, pendule à balancier, disque qui tourne sur la platine, lampe verte qui vibre, pipe qui fume dans le cendrier, feuilles de la plante.
- `bureau` : `pigeon` 0..1 (P3 : arrive et se pose sur le rebord extérieur à 0,6) ; `porte` 0..1 (le battant s'ouvre, couloir éclairé) ; `lumiere` 0..1 (défaut 1).
- `bureauSol` : `corbeille` 0..1 (la guitare tombe dans la corbeille de 0 à 0,6, puis s'y pose, manche qui dépasse vers le haut-gauche ; `corbeilleCouleur`) ; `sonne` 0..1 (P4 : le téléphone tremble, arcs muets) ; `feuille` 0..1 (P5 : une feuille tombe de la plante) ; `cendrier` `'pipe'` (défaut) \| `'vide'`.
- **La radio n'est pas dans le décor** : `GDM.radio(BTL.BUREAU.radio.x, BTL.BUREAU.radio.y, 0.85, { t, lueur, ondes, … })` juste après `bureauSol`.

| Point (`BTL.BUREAU`) | Valeur | Usage |
|---|---|---|
| `siege` | `{ x: 345, y: 1318 }` | Rowe assis : `BTL.rowe({ t, assis: 1, siege: U.siege.y }, U.siege.x, FEET, 0.9, { dir: 1 })` (dossier du fauteuil à gauche) |
| `plateau` | `{ x0: 420, x1: 760, y: 1240 }` | dessus du bureau ; sous-main x 460–590 ; caisson à tiroirs x 590–755 |
| `radio`, `telephone`, `cendrier`, `lampe` | x 612, 468, 530, 730 (y 1240) | objets posés sur le plateau |
| `corbeille` | `{ x: 862, y: 1420, bord: 1270 }` | corbeille d'osier, ouverture x 796–928 ; jet de Rowe : de `r.lachePt` vers `(862, 1270)` |
| `porte` | `{ x0: 770, x1: 940, y0: 735 }` | porte vitrée dépolie (entrée des Tremeloes, P4) |
| `fenetre`, `rebord` | x 360–660, y 290–790 ; rebord 790 | Big Ben lointain x 516, cheminées, pigeon |
| `etagere`, `platine`, `pendule`, `cadres`, `plante`, `portemanteau` | x 128–322 ; (225, 1000) ; (862, 330) ; 3 disques d'or ; x 190 ; x 714 | décor (ne pas couvrir les disques d'or) |
Les personnages debout devant le bureau le recouvrent (il est dessiné avant eux) : visiteurs à x 640–900. Vignette de téléphone (270 × 480) : le bureau reste habité et lisible (page 19).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'BTL\.' casting/scene.js`). Les trois appels les plus utiles :
```js
// Les Beatles jouent (studio Decca) ; Best assis à la batterie
GDM.studio(t, 0, {}); M.drawFloor(); GDM.studioSol(t, 0);
const Ss = BTL.accPt('batterie', 850, FEET, 1, {}, 'siege'), Cc = BTL.accPt('batterie', 850, FEET, 1, {}, 'caisseClaire');
BTL.batterie(850, FEET, 1, { t, frappe: 0.7, cast });
BTL.musicien('lennon', { t, joue: 1 }, 170, FEET, 0.86, { dir: 1, cast });
BTL.musicien('best', { t, assis: 1, siege: Ss[1], baguettes: 1, cible: Cc }, Ss[0] - 4, FEET, 0.86, { dir: 1, cast });
// Rowe au bureau signe le contrat posé sur le plateau
const U = BTL.BUREAU; BTL.bureau(t, 0, {}); M.drawFloor(); BTL.bureauSol(t, 0, {});
BTL.contrat(560, U.plateau.y - 60, 0.6, { signe: smooth(2, 4, t) });
BTL.rowe({ t, assis: 1, siege: U.siege.y, signe: 1, cible: BTL.accPt('contrat', 560, U.plateau.y - 60, 0.6, {}, 'signature') }, U.siege.x, FEET, 0.9, { dir: 1, cast });
// Rowe pince la guitare puis la jette dans la corbeille
const r = BTL.rowe({ t, pince: 1, jette: smooth(3, 4.2, t) }, 560, FEET, 0.9, { dir: 1, cast });   // r.lache, r.lachePt
```
