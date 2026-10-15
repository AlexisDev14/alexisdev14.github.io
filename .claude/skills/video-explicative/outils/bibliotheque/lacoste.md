# persos.md — « Le crocodile Lacoste, né d'un alligator » : mode d'emploi de `persos.js`

Espace de noms : `M.lac` (alias conseillé `const LAC = M.lac;`). Dans `S.init` : `LAC.init()` (pré-rend `LAC.K` = `vitrine`, `vitre`, `reverbere`, `court`, `gradins`, `filet`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Planche de référence : `casting/scene.js` (une planche par seconde, voir son en-tête).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`, défaut `ST.slotF`)
Toujours par l'enveloppe `LAC.nom(pose, x, y, s, o)` (`o` = options de `M.puppet` : `dir`, `slot`, `cast`, `alpha`…). Elle prépare la pose (gestes, objet tenu, seconde main) et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale).
Pièces : `armB_up armB_lo objetB doigtsBk legB legF head` + chapeau + `torso armF_up armF_lo poche objet doigts doigtsB`. Articulations rondes, rivet au centre.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'|'raquette'|'balle'|'valise'|'calepin'|'crayon'|'appareil'|'polo'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran, raquette tête en haut) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent (raquette tête en bas le long de la jambe : `ang.objet: Math.PI`).
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (`valise` : flanc gauche ; `appareil` : sous le soufflet).
- `handF` / `handB` : `'fist'` | `'open'` | `'poche'` (main cachée, avant-bras coupé au poignet) ; `face` : `{ brow, mouth, eyes }` ; `t` (gratte, tape, écrit).
- Point nommé de l'objet tenu : `LAC.pt(r, 'nom')` (main arrière : `LAC.pt(r, 'nom', true)`) → `[x, y]` écran. Points : raquette `tete` `bout` `manche` ; balle `centre` ; valise `poignee` `centre` `fond` ; calepin `page` ; crayon `pointe` ; appareil `objectif` `eclair` `viseur` ; polo `croc` `bas`.
- **Gestes communs aux trois (0..1, mélangeables)** : `tendre` (bras horizontal, main ouverte : promet) ; `montre` (bras levé à 45°, main ouverte, ou objet tenu montré) ; `pointe` (bras tendu, l'objet tenu dans le prolongement : raquette tendue) ; `poing` (poing serré levé devant le menton) ; `dos` (deux mains dans le dos, avant-bras en travers de la taille) ; `poche` (main avant dans la poche) ; `epaules` (haussement : épaules levées, avant-bras en avant mains ouvertes, sourcils levés) ; `affaisse` (buste tassé, tête basse, sourcils inquiets) ; `gratte` (main ARRIÈRE qui gratte l'arrière du crâne : le visage reste visible ; animé par `t`) ; `tape` (bout du pied avant qui tape, animé par `t`).

| Fonction | Échelle, taille | Pièces en plus | Options propres |
|---|---|---|---|
| `LAC.lacoste` | 0,9 ≈ 456 px | — | `tenue` `'longues'` (défaut : chemise blanche manches retroussées, pull sans manches crème à liseré bleu nuit) \| `'polo'` (polo blanc manches courtes, petit crocodile vert brodé sur la poitrine) ; même visage et pantalon blanc |
| `LAC.capitaine` | 0,9 ≈ 473 px (canotier) | `canotier` | blazer bleu nuit à liseré ivoire, pochette, cravate rouge, pantalon crème, moustache grise |
| `LAC.journaliste` | 0,9 ≈ 470 px | J1 `feutre` / J2 `casquette` | `qui` `1` (défaut : veste moutarde, feutre gris à carte de presse muette) \| `2` (gilet jacquard vert éteint, casquette bordeaux, lunettes rondes) ; `ecrit` 0..1 (calepin dans la main arrière + crayon qui griffonne, tête penchée ; `tenuBO.lignes` 0..1) ; `vise` 0..1 (appareil aux yeux, deux mains) ; `eclair` 0..1 (éclair du flash, même sans `vise` si `tenu:'appareil'`) |

`M.chars` : `lacLacoste`, `lacLacostePolo`, `lacCapitaine`, `lacJ1`, `lacJ2` (pour `M.ik` : `LAC.lacosteDef(pose)` et `LAC.journalisteDef(pose)` choisissent la bonne).

### `bendSign` de `M.ik` (vérifié sur le contrôle « coude à l'envers » du kit, cibles dans le repère du torse)
Identique pour les cinq marionnettes et pour `dir` 1 et −1 (le calcul se fait dans le repère du personnage).

| Geste (cible de la main) | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| main tendue, poing, raquette tendue, crayon, appareil, haussement, calepin (main devant le corps) | **1** | **1** | **1** | **1** |
| main dans le dos (cible derrière la taille) | **−1** | **−1** | **−1** | **−1** |
| main dans la poche, gratte la tête (bras presque vertical : pas de contrôle) | 1 (coude en arrière) | 1 | 1 (coude levé devant) | 1 |
Avec le mauvais signe, le rendu affiche « ATTENTION coude à l'envers ». Les enveloppes (`tendre`, `dos`…) règlent déjà les bras : `M.ik` ne sert que pour atteindre un point précis (valise sur le plateau, polo du portant).

Pièges :
- `tenu` met la main en poing d'office ; une main tenant un objet avec `droit` (défaut) garde l'objet droit même bras levé : pour une raquette qui suit le bras, `droit:false` ou `pointe`.
- Bras arrière : son objet (`tenuB`) passe DERRIÈRE le torse ; amener la main devant la poitrine (comme `ecrit`) pour qu'il se voie.
- `gratte` utilise le bras ARRIÈRE (le bras avant reste libre pour tenir).
- Le petit crocodile du polo porté est minuscule (≈ 30 px à 0,9) : pour le gag, montrer `LAC.polo` à 1,2–1,4 ou dessiner `LAC.crocMini(x, y, k)` en gros plan.
- Lacoste en blanc sur le court pâle : garder `cast` (ombre portée) pour qu'il se détache.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Tous : `LAC.nom(x, y, s, o)`, même dessin que tenu en main.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée (0,9) | Options |
|---|---|---|---|
| `LAC.raquette` | milieu du manche | 226 local → 203 px de long | — (bois, cordage ivoire en croisillons) |
| `LAC.balle` | centre | Ø 22 local → 20 px | — |
| `LAC.valise` | milieu du fond | 200 × 154 local → 180 × 139 px | `brille` 0..1 (reflet sur le cuir) ; peau d'alligator, coins sombres, deux fermoirs laiton |
| `LAC.calepin` | bas tenu | 50 × 82 local → 45 × 74 px | `lignes` 0..1 (gribouillis, aucune lettre) |
| `LAC.crayon` | prise | 75 local → 68 px | — |
| `LAC.appareil` | sous le boîtier | 92 × 104 local → 83 × 94 px | `eclair` 0..1 (coupelle de flash qui éclate) |
| `LAC.polo` | crochet du cintre | 180 × 230 local → 162 × 207 px | `manches` `'courtes'` (défaut, polo à crocodile) \| `'longues'` (chemise boutonnée, sans crocodile) ; `croc` (forcer/ôter le crocodile) ; `couleur` ; `vide` (cintre seul) |
| `LAC.portant` | milieu du sol | 470 × 346 local → 423 × 311 px (0,75 conseillé) | `chemises` = liste d'options de polo (défaut longues, longues, courtes ; `{vide:true}` = cintre vide) ; `balance` 0..1 + `t` (les chemises oscillent) |
| `LAC.reptile` | sous les pattes | profil 378 × 75 local → 340 px de long ; dessus 338 × 120 local | `type` `'croco'` (vert olive, museau étroit en V, dents en scie haut ET bas) \| `'alligator'` (vert sombre, museau large en U, une rangée de dents) ; `vue` `'profil'` \| `'dessus'` (le V / U se lit le mieux) ; `gueule` 0..1 ; `queue` (rad) ; `marche` 0..1 + `t` ; `tige` (true : tige de bois jusqu'à `o.slot`, défaut `y + 18·s`) ; `rot` |
| `LAC.crocMini(x,y,k)` | centre | 35 × 13 × k | petit crocodile brodé (dessin brut, dans le repère courant) |

## Décors (pré-rendus par `LAC.init()`)
| Clé | Pose | Repères utiles |
|---|---|---|
| `LAC.K.vitrine` | `M.flat(LAC.K.vitrine, 540, ST.back, {cast})` (plein cadre) | façade de briques, enseigne nue, vitre intérieure `LAC.VITRINE.vitre = [318, 523, 902, 1133]` ; étagères y `LAC.VITRINE.etageres = [691, 875]` (coupe dorée en haut, raquettes et balles dessous) ; plateau tournant : poser la valise en `LAC.VITRINE.plateau = {x:640, y:1097}` (s 0,9) ; porte à droite (x > 950) |
| `LAC.K.vitre` | même appel que la vitrine, APRÈS la valise | reflets obliques de la vitre (la valise paraît derrière le verre) |
| `LAC.K.reverbere` | `M.flat(LAC.K.reverbere, 150, ST.back, {cast, scale:0.95})` | réverbère à gaz allumé, 890 px de haut à 1 |
| `LAC.K.court` | `ctx.drawImage(LAC.K.court, 0, 0)` (toile de fond) | ciel pâle cousu en lés ; terre battue dès `LAC.COURT.sol = 1150`, ligne blanche y ≈ `LAC.COURT.ligne = 1300` + ligne de côté à gauche |
| `LAC.K.gradins` | `M.flat(LAC.K.gradins, 540, LAC.COURT.gradinsY, {cast})` (gradinsY = 1168) | gradins pâles à 4 rangs, public pâle sans visage, fanions, barrière blanche ; haut ≈ y 820 |
| `LAC.K.filet` | `M.flat(LAC.K.filet, LAC.COURT.filetX, ST.back, {cast})` (filetX = 700) | poteaux en x ±250 autour du centre (450 et 950), bande blanche haut y ≈ 1113 (poteaux) à 1137 (milieu) |
Ordre conseillé au court : `court` → `M.oiseaux` (y 380–500, brume 0,4) → `gradins` → `filet` → `M.drawFloor()`.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'LAC\.' casting/scene.js`). Les plus utiles :
```js
LAC.init();                                                                                   // dans S.init
LAC.lacoste({ t, dos: 1, ang: { head: -0.08 }, face: { eyes: 'wide', brow: 'up' } }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });   // devant la vitrine
LAC.capitaine({ t, tendre: 1, face: { mouth: 'smile' } }, 760, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });                            // il promet
LAC.lacoste({ t, tenue: 'polo', tenu: 'raquette', pointe: 1 }, 190, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });                       // raquette tendue
LAC.journaliste({ t, qui: 2, vise: 1, eclair: 0.8 }, 640, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });                                 // J2 photographie
LAC.journaliste({ t, qui: 1, ecrit: 1 }, 850, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });                                             // J1 prend des notes
LAC.valise(LAC.VITRINE.plateau.x, LAC.VITRINE.plateau.y, 0.9, { brille: 0.6 }); M.flat(LAC.K.vitre, 540, ST.back);
LAC.reptile(520, 1130, 1.0, { type: 'croco', gueule: 0.7, t, slot: ST.slotF, cast });                                                    // jumeaux sur tiges
LAC.reptile(790, 1130, 1.0, { type: 'alligator', gueule: 0.7, t, slot: ST.slotF, cast, dir: -1 });
// main sur un point précis : const sol = M.ik(LAC.lacosteDef(p), p, x, FEET, 0.9, dir, 'armF', [tx, ty], 1); p.ang = { armF_up: sol.up, armF_lo: sol.lo };
```
