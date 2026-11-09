# persos.md — « La gomme, quand on effaçait avec du pain » : mode d'emploi de `persos.js`

Espace de noms : `M.gom` (dans scene.js : `const GOM = M.gom;`). Dans `S.init` : **`GOM.init()`** (pré-rendus `GOM.K` : 3 vues de rue `vue.jour/soleil/neige`, givre, mur de l'atelier avec instruments, table du déjeuner, comptoir, coulisse verte, caisses, panier de rouleaux, tabouret).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle indiquée. `FEET = ST.slotF - 34` (1416), `FEETB = ST.slotB - 30` (1380).
Planche : `casting/scene.js` (page = instant) : 0 planche · 1 comparaisons · 2 / 3 gestes dir 1 / −1 · 4 bras 0→2,4 + `M.ik` + marche · 5 prises (s 1,6) · 6 objets · 7 souris · 8 atelier jour joué · 9 atelier comptoir + soleil · 9,97 vignettes téléphone. Rendu final : 0 ligne « ATTENTION ».

## Marionnette : Edward Nairne (avec tige ; `slot: ST.slotF` par défaut)
Toujours par l'enveloppe `GOM.nairne(pose, x, y, s, o)` (`s` défaut 0,9 ; `o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). **Toujours passer `t`** (crayon qui griffonne, frottement, boulette qui roule, marche, souffle du soupir).
Pose seule (pour `M.ik` ou `M.partMatrices`) : `const q = GOM.nairnePose(pose, x, y, s, dir)` puis `M.puppet(M.chars.gomNairne, q, x, y, s, o)`.

À 0,9 : **≈ 460 px** debout (loupe comprise), ≈ 85 px de large. Signes : loupe d'horloger en laiton relevée sur le front (pièce `loupe`, fixe), cheveux gris poudrés à rouleaux et catogan (`cheveux`, `queue`, `ruban` noir), chemise ivoire manches retroussées (avant-bras nus), gilet vert éteint à boutons laiton, tablier de cuir tabac noué (`tablier`, `cordon`, `noeud` au dos), culotte bleu nuit, bas ivoire, souliers à boucle. Jamais de chapeau.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'crayon'` `'boulette'` `'caoutchouc'` `'miche'` (| `'rien'`) ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'accessoire seul, ex. `{ etat: 'moisie' }`, `{ etat: 'colle' }`).
- `droit` / `droitB` : `true` d'office quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent (rad).
- Prise : boulette et cube sont tenus **par le bas** (le poing dessous, les doigts couleur chair par-dessus le bord bas) ; le crayon par le milieu.
- `handF` / `handB` : `'fist'` | `'open'` (poing d'office quand la main tient) ; `face` : `{ brow, mouth, eyes }` (un geste ne remplit que les champs laissés vides) ; `ang`, `tilt`, `dx`, `dy` comme le kit.
- `cible` / `cibleB` : point **écran** `[X,Y]` ; l'enveloppe le convertit avec les mêmes `x, y, s, dir`.
- Point écran de l'objet tenu : `GOM.pt(r, 'nom')` (main arrière : `GOM.pt(r, 'nom', true)`) ; poing : `GOM.main(r)` / `GOM.main(r, true)`. Points : crayon `pointe` `haut` ; boulette `centre` `contact` ; caoutchouc `centre` `contact` `bas` ; miche `haut` `centre`.
- Gestes = réglages 0..1 (lissés par `ease`) : les faire varier avec `smooth(t0, t1, t)`. Ne pas cumuler deux gestes de la main avant (le dernier dans l'ordre soupir, dessine, cherche, gratte, prend, frotte, rouler, montre l'emporte).

| Geste | Effet |
|---|---|
| `dessine` + `cible` | crayon mis d'office, penché pointe en avant ; la **pointe** va sur la cible et griffonne selon `t` ; tête baissée, bouche serrée. `cibleB` : main arrière ouverte posée (ex. bord de la feuille) ; sinon main arrière devant le ventre. Cible type : `GOM.planchePt('trait', …)` décalée de 60–70 px vers lui |
| `cherche` | les deux mains ouvertes tapotent les poches hautes du gilet selon `t`, tête baissée, sourcils inquiets |
| `gratte` | main avant ouverte sur le haut du crâne, petits grattements selon `t`, sourcils inquiets (perplexe). La main passe devant le front : ne rien poser à cette hauteur |
| `prend` + `cible` | main avant tendue vers la cible (ouverte ; `prise` > 0,5 ou `tenu` = poing), buste penché, tête baissée. Pour « saisir » : faire monter `prend` puis donner `tenu` |
| `frotte` + `cible` | `tenu` 'boulette' d'office (ou 'caoutchouc') ; le **centre** de l'objet fait des allers-retours de ± `amp` (défaut 12) autour de la cible, selon `t` ; `cibleB` comme `dessine` |
| `rouler` | boulette tenue devant la poitrine, les deux mains dessous, la mie tourne (`bouleO` : options de la boulette, défaut `{ taille: 78, etat: 'fraiche' }` = 70 px à 0,9) ; sourire concentré. **Ne pas passer `tenu`** (la boulette est une pièce à part) |
| `montre` | objet levé à hauteur d'épaule, bras tendu devant lui (`tenu` défaut 'boulette' ; `cible` écran possible), sourire, sourcils levés |
| `soupir` | épaules et tête qui tombent, yeux fermés, bouche « o », petit souffle blanc devant la bouche (selon `t`) |
| `marche` | pas selon `t` (jambes, bras, catogan, sautillement) ; glisser `x` soi-même |

### `bendSign` de `M.ik` (page 4 : bras avant haut / devant / bas, bras arrière devant ; aucune ligne « ATTENTION »)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Nairne (`M.chars.gomNairne`) | 1 | 1 | 1 | 1 |
`handLen` = 100. Les gestes internes n'ont pas besoin de `M.ik` (IK propre, coude toujours vers l'avant). La main arrière est dessinée derrière le torse : pour qu'elle se voie, la cible doit être devant la poitrine.

## La souris de l'atelier — `GOM.souris(x, y, s, o)`
`(x,y)` = sous les pattes ; `s` défaut 0,95 → **≈ 143 px** du museau au croupion (≈ 255 px avec la queue), ≈ 75 px de haut (assise ≈ 125 px). Grise #8A8580, oreilles roses, œil noir brillant, moustaches qui frémissent. Pièce unique dessinée (pas de membres articulés : aucun contrôle de coude/pied).
- `pose` : `'trottine'` (pattes et sautillement selon `t`) | `'assise'` (sur l'arrière-train, pattes jointes devant la poitrine) | `'grignote'` (tête baissée sur les pattes, mâchoire et pattes selon `t`, miettes qui tombent) | `'renifle'` (corps allongé, museau tendu qui frémit) | `'vexee'` (assise, menton levé, yeux fermés, oreilles rabattues, queue plate au sol ; « dos tourné » = la tourner (`dir`) à l'opposé de celui qui la trahit).
- `tient` : `'miette'` | `'boulette'` | `'rien'` (assise et grignote) ; `tientO` : options de la boulette (défaut `{ taille: 30 }`, ex. `{ etat: 'moisie' }`).
- `dir` ±1 (tête vers +x pour 1), `t`, `cast`, `rot` (rad), `yeux: 'fermes'`.
- `tige` : défaut `true` si `y > 1360` (tige fine vers la fente) ; **`tige: false` sur une table ou une étagère** ; `slot` (défaut slotF si y ≥ 1400, sinon slotB).
- Sortie du trou : partir de `GOM.AT.trou.x` (240) à `y = FEET`, `dir: 1`, avec un clip à x ≥ 214 au début si l'on veut qu'elle « sorte » du mur.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre`, `o.t`. Même dessin qu'en main.

| Fonction | `(x,y)` = | Taille (échelle) | Options |
|---|---|---|---|
| `GOM.miche(x,y,s,o)` | bas-centre | 170 × 112 (1) | `entamee` (bool ou 0..1 : morceau arraché en haut à droite, mie ivoire) ; `grignotee` (bool ou 0..1 : le tiers gauche mangé, bord festonné, miettes au sol) ; `couverte` (bool ou 0..1 : serviette blanche à liseré bleu ; 1 → 0 = elle glisse vers le haut et la droite et disparaît) |
| `GOM.boulette(x,y,s,o)` | point posé (bas) | Ø `taille` (défaut 56 ; 50 px à 0,9) | `etat` `'fraiche'` (ivoire #EFE3C4) / `'grise'` (traînées de graphite) / `'moisie'` (6 taches vert franc #6E8B3D et bleu-vert, bien visibles) ; `taille` ; `roule` (rad, la mie tourne). Mot-clé : `s` ≥ 1,3 |
| `GOM.caoutchouc(x,y,s,o)` | point posé (bas) | côté `taille` (défaut 64) ; **120 px ⇒ s ≈ 1,9** | `etat` `'brut'` (morceau irrégulier) / `'cube'` (bloc ambré translucide, reflets miel) / `'colle'` (bas étiré en cou + fil qui descend ; `fil` = longueur, défaut 60) / `'casse'` (deux morceaux, fissure, éclats) |
| `GOM.fil(a, b, o)` | deux points écran | — | fil de caoutchouc élastique entre le cube et la feuille ; `e` (épaisseur, 7), `k` 0..1 (tension) |
| `GOM.crayon(x,y,s,o)` | milieu | 122 de long | bois ocre, mine noire |
| `GOM.planche(x,y,s,o)` | sol sous le tréteau | (1) planche 372 de large, haut à −442 ; **feuille ≈ 316 × 230** (y −420 → −190) ; chandelle (flamme) à −530 | `etat` `'faute'` (grand trait de travers épais, ≈ 320 px) / `'tache'` (gris étalé + coin haut droit déchiré) / `'propre'` ; `trait` 0..1, `tache` 0..1, `dechire`, `miettes` 0..1 (remplacent l'état : effacer = `trait` 1 → 0) ; `chandelle` (true) ; `t` ; `courant` (instant : la flamme se couche et vacille 2 s) |
| `GOM.planchePt(nom,x,y,s)` | — | — | point écran : `centre`, `trait` (milieu de la faute), `traitA` / `traitB` (bouts), `coin` (déchirure), `oculaire`, `objectif` (du télescope dessiné), `rebord`, `chandelle`, `sol` |

## Décor : boutique-atelier de Nairne (fonctions pures du temps ; `up` = décalage vers le haut en px)
Ordre : `GOM.atelier(t, up, o)` → `M.drawFloor()` → marionnettes de la fente arrière → (`GOM.comptoir(t, up)` si quelqu'un est derrière) → fente avant → `GOM.atelierAvant(t, up, o)` → `GOM.lumiere(t, o)` (mêmes options de vitrine) → `M.stageLight` → `M.rideau(t)` → `M.drawFrame(t)`.

| Appel | Options |
|---|---|
| `GOM.atelier(t, up, o)` — toile : lambris brun, vitrine à 24 petits carreaux sur la rue (façades de briques à pignons, tour à lanternon, nuages et passants qui défilent), horloge à balancier, étagères (grande lunette sur berceaux, globe terrestre, bocaux, lunette sur trépied, microscope, coffret), sextant, compas, équerre, baromètre à colonne, machine électrostatique à plateau de verre ; rayon de la vitrine et poussière ; table du déjeuner (théière qui fume, tasse, serviette, couteau) + miche ; planche à dessin + chandelle ; coulisse de drap vert (gauche), caisses d'emballage (droite) | `vitrine` `'jour'` (défaut) / `'soleil'` (ciel orangé, soleil de carton qui descend sur son fil, lumière chaude) / `'neige'` (toits et rue blancs, flocons, givre sur les carreaux) ; `vitrine2` + `fondu` 0..1 (bascule p5) ; `soleil` 0..1 (descente du soleil, défaut 1 en 'soleil') ; `neige` 0..1 (flocons + givre) ; `planche` : `false` ou options de `GOM.planche` (ex. `{ etat: 'tache', trait: 0.4 }`) ; `miche` : `false` ou options de `GOM.miche` ; `couverte` (raccourci) ; `comptoir` (dessine le comptoir dans le décor) ; événements (instants locaux) : `passant` (ombre au tricorne et à la canne qui traverse la vitrine en 3,6 s), `courant` (flamme de la chandelle), `pigeon` (vole 1,3 s puis se pose sur le rebord extérieur, en bas à droite de la vitrine), `rayon` (rayon de soleil qui glisse 4 s) ; `cast` |
| `GOM.comptoir(t, up, o)` | comptoir de bois à 3 panneaux + balance en laiton sans graduation |
| `GOM.atelierAvant(t, up, o)` | panier de rouleaux de papier (x 150, sol 1600), tabouret (x 950, sol 1614 ; `tabouret: false`) |
| `GOM.lumiere(t, o)` | teinte chaude (soleil) ou bleutée (neige) sur toute l'image, après les marionnettes |

Repères `GOM.AT` (écran, `up` = 0) : vitrine x 500–860, y 300–760, rebord intérieur y 760–788 ; horloge haut du boîtier (400, 300), boîtier jusqu'à y 537 ; étagères y 520 (x 96–330) et y 700 (x 96–420) ; baromètre x 950, y 320–680 ; machine électrostatique console y 1000, disque centre (925, 895) r 62 ; **planche** `{x: 310, y: 1395}` → feuille x ≈ 152–468, y ≈ 975–1205, `planchePt('trait')` = (310, 1099), chandelle (160, 865) ; **table** dessus y 1190, x 715–955 ; **miche** `{x: 780, y: 1190}` (x 695–865, haut y 1078) ; bec de la théière (867, 1142) ; **comptoir** dessus y 1165, x 410–770 (centre 590) ; **trou de souris** `{x: 240, y: 1395, w: 54, h: 42}` (plinthe y 1344–1395).
Zone centrale x 250–780, y 900–1430 : seules la planche (à gauche, objet d'action) et la table (bord gauche x 715) y entrent. Rien de clé au-delà de x 930 (baromètre, machine, caisses : décor).

Pièges :
- Nairne qui dessine se place à droite de la planche, `dir: −1`, x ≈ 540–580 (FEET) ; plus loin, le bras ne l'atteint pas.
- Avec `comptoir`, Nairne passe **derrière** : fente arrière (`FEETB`, s ≈ 0,86), puis `GOM.comptoir`. Le comptoir chevauche la planche : passer `planche: false` si un client se tient à gauche.
- La souris sur la table : `GOM.souris(x, GOM.AT.table.y, 0,9, { tige: false })` (x 860–900 à droite de la miche).
- Le caoutchouc (ambré) et la croûte de la miche sont deux bruns : ne jamais poser le cube contre la miche ; la mie, elle, est ivoire.

## Exemples d'appels qui marchent (voir `grep -n 'GOM\.' casting/scene.js`)
```js
const GOM = M.gom, pl = GOM.planchePt('trait', GOM.AT.planche.x, GOM.AT.planche.y, 1);
GOM.atelier(t, 0, { vitrine: 'jour', couverte: 1, passant: 2.0 }); M.drawFloor();
GOM.nairne({ t, dessine: 1, cible: [pl[0] + 70, pl[1] - 10] }, 560, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
GOM.nairne({ t, frotte: 1, tenu: 'boulette', tenuO: { etat: 'grise' }, cible: pl }, 560, FEET, 0.9, { dir: -1, cast });   // plan 2-3
GOM.souris(GOM.AT.trou.x + 90, FEET, 0.95, { t, pose: 'renifle', dir: 1, cast });
GOM.atelierAvant(t, 0, {}); GOM.lumiere(t, { vitrine: 'jour' });
```
