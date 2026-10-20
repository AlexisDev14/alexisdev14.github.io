# persos.md — « Le premier message d'Internet, LO » : mode d'emploi de `persos.js`

Espace de noms : `M.lo` (dans `scene.js` : `const LO = M.lo;`). Dans `S.init` : `LO.init()` (pré-rendus `LO.K` : `fond`, `collines`, `sigma`, `imp`, `classeur`, `teletype`, `bureau`, `chaise`, `corbeille`, `imprimante`, `sri`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran**, mesurées sur la planche (`casting/scene.js`, page 0), tige non comprise. Aucune lettre ni chiffre nulle part (cubes nus, cadran à trous, tableau = schéma, listing zébré).

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` ou `slot` pour une autre fente)
Toujours par l'enveloppe `LO.kline / LO.duvall / LO.kleinrock (pose, x, y, s, o)` : elle prépare la pose (gestes, objet tenu, IK interne) et renvoie `r` : `r.w('pièce', x, y)` = point écran ; `r.pose` ; `r.main` / `r.mainB` = centre de la main avant / arrière ; `r.tete` = haut du crâne ; `r.fil` = bout du fil du casque (si `casque`) ; `r.charge` (Kleinrock `porte`).
`M.chars` : `loKline`, `loDuvall`, `loKleinrock` (pour `M.ik` / `M.partMatrices`).
Pièces : `torso head cheveux armF_up armF_lo armB_up armB_lo legF_up legF_lo piedF legB_up legB_lo piedB objet doigts objetB doigtsB doigtsB2 mainB2 paume` + `casque casqueFil armFh_lo mainH` (Kline, Duvall).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'crayon'` `'tournevis'` `'telephone'` `'cube'` (ou `'rien'`), **ou une fonction de dessin** `(o, ctx) => {…}` dans le repère du poing (origine = centre du poing, y vers le bas, droit à l'écran ; ex. le sac du p2, le cahier du p5). `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul) + `taille` (facteur ; téléphone 0,6 et cube 0,7 d'office) ; pour une fonction : `pts: { nom: [x,y] }` et `p2: [x,y]` (seconde prise).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent en plus.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (téléphone : flanc gauche ; cube : face gauche ; fonction : `tenuO.p2`). Mis d'office par `serre`.
- `handF` / `handB` : `'fist'` | `'open'` | `'paume'` (main avant paume vers le haut, gardée à l'horizontale ; mise d'office par `voila`). Poing d'office si la main tient un objet ; doigts couleur chair PAR-DESSUS l'objet.
- `expr` : `'neutre'` `'concentre'` `'surpris'` `'sourire'` `'ravi'` (yeux plissés, rire) `'panique'` `'soulage'` `'serein'` (yeux clos, sourire) `'inquiet'` ; `face` : `{ eyes: 'closed'|'half'|'wide', mouth: 'n'|'o'|'smile'|'tight'|'sourire'|'rire'|'bee'|'moue' }` (prioritaire). Chaque geste met son `expr` si on n'en passe pas.
- `t` (frappe des doigts, écriture, rire, marche, panique) ; `marche` 0..1 (pas sur place, la scène déplace `x`) ; `ang.legF` / `ang.legB` acceptés (ajoutés à la cuisse).
- `casque` (Kline, Duvall) : `1` = casque téléphonique 1969 (arceau noir, écouteur à l'oreille, micro en tige devant la bouche) + fil spiralé jusqu'à `r.fil` ; le plan relie ensuite `LO.cordon(r.fil, prise, { mou })` (après la marionnette).
- Point nommé de l'objet tenu : `LO.pt(r, 'nom')` (main avant) / `LO.pt(r, 'nom', true)` (main arrière) → `[x, y]` écran : crayon `pointe` · tournevis `pointe` · téléphone `prise` `combine` `centre` · cube `centre` `dessus`.

| Fonction | Échelle, taille | Options de geste (0..1 sauf mention) |
|---|---|---|
| `LO.kline` | 0,9 ≈ 477 px (cheveux ; +4 avec l'arceau) | `tape` + `clavier` [x,y] écran (dessus des touches ; défaut : devant lui à hauteur de hanche) : deux mains sur le clavier, doigts qui frappent (`t`), tête penchée ; `ecoute` (main avant posée sur l'écouteur, coude devant, l'avant-bras passe derrière le visage) ; `surprise` (recul, mains ouvertes à hauteur d'épaules, yeux ronds, bouche « o ») ; `ecrit` + `cible` [x,y] écran (= pointe du crayon ; tient `'crayon'` d'office ; la main arrière se pose à plat à côté, sauf si `tenuB` est donné) ; `serre` (téléphone d'office, à deux mains contre la poitrine, yeux clos, sourire) ; `assis` (hanche sur un tabouret de labo dessiné d'office ; `tabouret: false` pour le retirer ; `siege` = y écran de l'assise) |
| `LO.duvall` | 0,55 ≈ 285 px (vignette) ; 0,9 ≈ 467 px | `ecoute` ; `tape` + `clavier` ; `bras` (panique : bras levés en V, mains ouvertes, recul, tremblement avec `t`) ; `tournevis` + `cible` [x,y] écran (= pointe du tournevis ; tenu par le manche, pointe vers la machine, petit va-et-vient avec `t`) ; `ouf` (épaules qui tombent, yeux mi-clos, sourire) |
| `LO.kleinrock` | 0,9 ≈ 482 px | `porte` (deux mains autour d'une charge contre le ventre : passer le sac en `tenu` (fonction) + `tenuO.p2` + `deuxMains: true` ; `r.charge` = point entre les mains) ; `voila` (bras avant ouvert vers l'avant-haut, main paume vers le haut, main arrière sur le cœur, menton levé, sourire) ; `rire` (tête en arrière, épaules qui sautent avec `t`, main sur le ventre) |

Ordre d'application (le dernier l'emporte ; un geste remplace les `ang.armX_*` passés) : Kline `marche assis tape ecoute surprise ecrit serre` ; Duvall `marche tape ecoute bras tournevis ouf` ; Kleinrock `marche porte voila rire`.

`bendSign` de `M.ik` (vérifié page 4 : M.ik sur les deux bras, deux sens, trois personnages, plus tous les gestes pages 1–3 : aucune ligne « ATTENTION ») :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| `loKline` | 1 | 1 | 1 | 1 |
| `loDuvall` | 1 | 1 | 1 | 1 |
| `loKleinrock` | 1 | 1 | 1 | 1 |

`M.ik` amène le point `[0, 100]` de l'avant-bras (la main) sur la cible ; avec `bendSign 1`, `lo` est négatif (coude plié vers l'avant). Les gestes à `cible` / `clavier` font leur IK eux-mêmes. Portée : la main atteint ≈ 170 px autour de l'épaule à 0,9 (≈ 105 px à 0,55) ; au-delà le bras reste tendu sans atteindre.

Pièges :
- Kline devant le téléscripteur : `x` 470, `dir: 1`, `FEET`, `tape: 1, clavier: LO.P.clavier` (vérifié page 8). Fil du casque vers le téléphone du bureau : `LO.cordon(r.fil, LO.P.telPrise, { mou: 60 })`.
- `ecoute` : l'avant-bras avant est une copie (`armFh_lo`) dessinée derrière la tête et la main (`mainH`) devant : ne pas masquer `armF_lo` à la main.
- `serre` + `casque` : relier `LO.cordon(r.fil, LO.pt(r, 'prise'), { mou: 20 })`.
- Duvall dans la vignette : échelle `LO.sriEchelle(rx, ry)`, pieds `LO.sriPt(cx, cy, rx, ry, 'pieds')` (`dir: 1`, il regarde la machine) ; pour `tournevis` le placer en `'piedsRepare'` avec `cible: LO.sriPt(…, 'machine')`, sinon le bras n'atteint pas. `slot: pieds[1] + 10` (sa tige ne descend pas dans le plancher de la scène).
- `ecrit` : la cible doit être devant lui entre la hanche et la poitrine (≈ 100 à 300 unités au-dessus des pieds), sinon le crayon pend.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille | Options |
|---|---|---|---|
| `LO.cube(x,y,s,o)` | **centre** du cube (posé sur une surface : `y = dessus − 41·s`) | 88 × 82 local : ≈ 123 px à s 1,4 (mot-clé), 44 px à 0,5 (vignette) | `n` 0..4 dans l'ordre du mot : 0 ocre, 1 bleu ardoise, 2 rouge sang, 3 vert éteint, 4 prune (`LO.CUBES` = couleurs) ; `lueur` 0..1 (halo doré + rayons qui tournent avec `t`) ; `casse` 0..1 (le cube se fend en zigzag, deux moitiés qui s'écartent et penchent, petite bouffée grise, plus visible vers 0,3–0,7) ; `coul` (force une couleur) |
| `LO.telephone(x,y,s,o)` | milieu du socle | 164 × 112 local (≈ 140 px de large à 0,85, posé sur le bureau) | `coul` `'beige'` (UCLA) \| `'celadon'` (SRI) ; `sonne` 0..1 (tremble, combiné qui sautille, arcs de sonnerie ; `t` obligatoire) ; `lumiere` 0..1 (voyant ambre). Renvoie `r.prise` (d'où part le fil du casque, flanc gauche bas) et `r.combine` |
| `LO.telPrise(x,y,s,dir)` | — | — | point `prise` d'un téléphone posé, sans le dessiner |
| `LO.cordon(a, b, o)` | deux points écran | — | fil spiralé noir qui pend entre `a` et `b` ; `mou` (px, 50), `lw` (2,4), `boucle` (rayon des spires, 4) |

## Décors
| Appel | Pose | Repères utiles |
|---|---|---|
| `LO.labUCLA(t, o)` | **en premier** dans `S.draw` (il peint tout le fond, ciel compris), puis `M.drawFloor()`, puis les marionnettes. `t` = temps LOCAL (il passe lui-même en temps global : ambiances sans saut à la coupe) | mur vert d'eau, plafond à dalles, 2 rampes de néons (y 346), tableau noir à schéma (x 110–390, y 440–670), pendule (482, 470), calendrier, étagère (y 822) avec cartes et bobines, fenêtre de nuit (x 650–940, y 380–820 : lune, palmiers, ville), Sigma 7 (x 120–420), classeur, IMP (x 782–942), téléscripteur (x 615), bureau (x 105–385), téléphone beige, tasse fumante, lampe à bras, chaise, corbeille, imprimante + listing (x 885–1034), extincteur |
| `LO.labSRI(t, o)` | dans `draw(cx, cy, rx, ry)` de `M.vignette` : `LO.labSRI(t, { cx, cy, rx, ry, plante, repare, rallume })` ; conçu pour `rx 220, ry 280` (s'adapte : k = min(rx/220, ry/280)) | boiseries miel, fenêtre (chêne, lune), ventilateur qui tourne, plante, cafetière qui fume, tableau de liège à dessins, SDS 940 crème à bandeau brique (bobines, voyants), console, téléphone céladon (dans le décor) |

Options de `LO.labUCLA` (une par petit événement de la fiche) : `neon` 0..1 (le néon de gauche grésille ; p1) · `listing` 0..1 (une feuille du listing s'enroule et glisse au sol ; p2) · `lampe` (rad, oscillation de la lampe autour de son socle ; p3 : `M.wob(t, t0, 0.12, 1.6, 3)`) · `cartes` 0..1 (la petite pile au bout de l'étagère glisse et tombe en éventail ; p4) · `heures` (heures ajoutées à la pendule : 0 → 1 = une heure passe ; p5 ; 22 h 30 sinon) · `vapeur` 0..1 (vapeur de la tasse, 1 ; p5) · `aube` 0..1 (le ciel pâlit, étoiles et ville s'éteignent ; p6) · `filante` 0..1 (trajet de l'étoile filante, rien hors ]0,1[ ; p6) · `machines` 0..1 (1 = bobines par saccades et voyants qui clignotent) · `tel` (`false` = pas de téléphone sur le bureau, quand Kline le tient) · `telO` (options du téléphone posé : `sonne`, `lumiere`) · `cast`.
Ambiances permanentes : bobines du Sigma 7, voyants du Sigma et de l'IMP, vapeur, trotteuse, étoiles et lumières de la ville, poussière dans le faisceau de la lampe, néon qui grésille un peu toutes les 23 s.

Points nommés du labo d'UCLA (`LO.P`, écran) : `clavier` [531, 1179] (dessus des touches) · `sortie` [629, 1061] (fente du rouleau, d'où partent les cubes) · `imp` [780, 1011] (prise du câble, flanc gauche de l'IMP) · `bureau` [245, 1160] (dessus du bureau ; `bureauX` [105, 385]) · `tel` [207, 1160] (pieds du téléphone, échelle `telS` 0,85) · `telPrise` [151, 1152] · `tasse` [357, 1127] · `lampe` [135, 1155] (socle) · `fenetre` [795, 565]. Zone x 300–760, y 700–1400 dégagée pour Kline, le téléscripteur et les cubes.

Labo de SRI, options : `plante` 0..1 (voyants qui s'éteignent dès 0,25, bobines arrêtées, machine assombrie, fumée grise du capot ; **une étincelle autour de 0,32**) · `repare` 0..1 (la porte du panneau inférieur s'ouvre : cartes vertes, fils de couleur ; la fumée diminue) · `rallume` 0..1 (voyants et bobines repartent, bouffée de lumière dorée au milieu de la course).
Points nommés : `LO.sriPt(cx, cy, rx, ry, nom)` → `[x, y]` écran, `nom` = `'arrivee'` (dessus de la console, où se posent les cubes ; `LO.sriArrivee(cx, cy, rx, ry)`) · `'pieds'` (Duvall, x −48) · `'piedsRepare'` (Duvall devant le panneau, x +40) · `'machine'` (panneau ouvert) · `'tel'` (prise du téléphone céladon, pour `LO.cordon`) · `'fumee'` (haut de l'armoire). À rx 220 / ry 280 : arrivée = (cx + 72, cy + 22), pieds = (cx − 48, cy + 168), Duvall à `LO.sriEchelle(rx, ry)` = 0,55. Cubes posés : `LO.cube(A[0] ± 20, A[1] − 22, 0.5, { n })`.

## Exemples d'appels qui marchent
Voir `<video>/casting/scene.js` (`grep -n 'LO\.' casting/scene.js` ; page 8 = labo d'UCLA, page 9 = vignettes SRI). Les trois appels les plus utiles :
```js
LO.labUCLA(t, { neon: smooth(3.4, 3.5, t) * (1 - smooth(3.9, 4.0, t)) }); M.drawFloor();
const r = LO.kline({ t, tape: 1, clavier: LO.P.clavier, casque: 1 }, 470, FEET, 0.9, { dir: 1, cast });
LO.cordon(r.fil, LO.P.telPrise, { mou: 60 });
M.vignette(t, { x: 690, y: 560, rx: 220, ry: 280, t0: 1, draw: (cx, cy, rx, ry) => {
  LO.labSRI(t, { cx, cy, rx, ry, plante: 0 });
  const P = LO.sriPt(cx, cy, rx, ry, 'pieds'), d = LO.duvall({ t, ecoute: 1, casque: 1 }, P[0], P[1], LO.sriEchelle(rx, ry), { dir: 1, slot: P[1] + 10, cast });
  LO.cordon(d.fil, LO.sriPt(cx, cy, rx, ry, 'tel'), { mou: 20, lw: 1.6, boucle: 2.4 });
  const A = LO.sriArrivee(cx, cy, rx, ry); LO.cube(A[0] - 14, A[1] - 22, 0.5, { n: 0, lueur: 0.6, t });
} });
LO.kleinrock({ t, voila: 1 }, 700, FEET, 0.9, { dir: -1, cast });
```
