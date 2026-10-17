# persos.md — « La fève de la galette, le roi qui payait la tournée » : mode d'emploi de `persos.js`

Espace de noms : `M.gal` (alias `GAL` : `const GAL = M.gal;`). Dans `S.init` : `GAL.init()` (pré-rendus : salle × 3 époques, lustres × 3, tapisserie, table avec ou sans nappe).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (mesurées sur les polygones).
Planche de référence : `casting/scene.js` (une planche par seconde : 0 repos, 1 gestes Gontran, 2 gestes Berthe, 3 couronner + Petit, 4 balayages + quatre pattes, 5 groupe Moyen Âge, 6 expressions, 7 objets, 8–9 comparaisons + époques, 9,97 groupe moderne).

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `GAL.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`) : elle prépare la pose (gestes par `M.ik`, objet tenu, seconde main). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'galette'` | `'part'` | `'feve'` (vraie par défaut) | `'figurine'` (porcelaine par défaut) | `'couronne'` | `'bourse'` | `'piece'` | `'pieces'` | `'couteau'` | `'assiette'` | `'addition'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul) + `echelle` (défaut 1 ; fève et figurine 1,4 ; galette 0,75 ; chez le Petit : part 0,7, galette 0,5, couronne 0,7).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent (rad).
- `deuxMains` : la main arrière vient d'elle-même sous la seconde prise (seule la galette en a une ; mis d'office par Berthe avec `tenu:'galette'`).
- Geste libre : `atteint` 0..1 + `cible` `[X,Y]` écran → le poing (ou le point `ptCible` de l'objet tenu, défaut `'centre'`) va sur la cible ; `bras:'B'` = main arrière.
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `t` : **toujours le passer** (larmes, tapote, couper, marche, ramper, bourse qui se balance).
- Tous les gestes sont des réglages 0..1 (lissés par `ease`) : les faire varier avec `smooth(t0, t1, t)` pour entrer et sortir.
- Point nommé de l'objet tenu : `GAL.pt(r, 'nom')` (ou `GAL.pt(r, 'nom', true)` main arrière) → `[x, y]` écran. Points : galette `centre` `bouche` `base` ; part `pointe` `bouche` `centre` `base` ; feve `centre` `bouche` `base` ; figurine `centre` `bouche` `haut` `base` ; couronne `centre` `bas` ; bourse `centre` `bouche` `base` ; piece `centre` ; couteau `pointe` `centre` `base` ; assiette `centre` `dessus` ; addition `bas`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `GAL.gontran` (`C.galGontran`) | 0,9 ≈ 469 px (486 avec la couronne), 119 de large | `moustache`, `bosse` (gorge), `couronneT` (couronne sur la tête), `bourseT` (bourse à la ceinture) | `couronne` 0/1 + `couronneRot` (rad, de travers ≈ 0,3–0,4) + `couronnePlie` ; `joues` (joues gonflées) ; `avale` (bosse qui descend dans la gorge, invisible à 0 et 1) ; `anguleux` (joue déformée en pointes) ; `larmes` ; `expr` `'beat'` (sourire béat) \| `'ronds'` (yeux ronds, bouche o) \| `'soupir'` \| `'malin'` \| `'inquiet'` ; gestes main avant, **suffixe `B` pour la main arrière** (`boucheB`…) : `bouche` (main ou objet à la bouche : la `pointe` de la part, le `centre` de la fève), `poser` (+ `cible`/`cibleB` écran, défaut devant à hauteur de ceinture ; main ouverte si vide, `base` de l'objet sinon), `ventreTape` (main sur le ventre ; `tapote:true` = tapote avec `t`), `brandir` (objet levé devant soi) ; `bourse:false` cache la bourse de ceinture (cachée d'office si `tenu:'bourse'`) |
| `GAL.berthe` (`C.galBerthe`) | 0,9 ≈ 520 px avec la coiffe (468 sans), 124 de large | `coiffe`, `soulier` ; **pas de jambes** (robe longue) | `sourcils` `'severe'` (défaut) \| `'surpris'` \| `'satisfait'` ; `presente` (objet tenu devant la taille ; 1 d'office avec la galette, `deuxMains` d'office) ; `brandir` ; `couronner` + `cible` (le `bas` de la couronne tenue va sur la cible ; buste un peu penché) ; `poingHanche` / `poingHancheB` (coude en arrière) ; `couper` + `cible` (avec `tenu:'couteau'` : la `pointe` sur la cible, lame inclinée 0,9 rad, va-et-vient avec `t`) |
| `GAL.petit` (`C.galPetit`) | 0,9 : à genoux 257 px, debout 374, à quatre pattes 227 × 239 ; **0,85 sous la table** (243 px) | `cheveux` (épi), `pocheBord`, jambes en 3 pièces `legX_up/_lo`, `piedX` | `posture` `'aGenoux'` (**défaut**, assis sur les talons, mains sur les cuisses) \| `'quatrePattes'` (mains au plancher, tête relevée) \| `'debout'` ; transition : `posture2` + `mixK` 0..1 ; `marche` (debout, jambes, `t`) ; `ramper` (quatre pattes, `t`) ; `designe` (+ `cible`) : bras avant tendu, **main ouverte** ; `poche` (main avant à la poche de la blouse ; l'objet passe derrière le bord ; ≥ 0,98 il a disparu) ; `clin` (clin d'œil de profil, sourire) ; `menton` (menton levé, air important). Tige dessinée par l'enveloppe (`o.rod:false` pour l'ôter) |

### `bendSign` de `M.ik` (vérifié : aucune ligne « ATTENTION coude à l'envers » sur toute la planche)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Gontran (`bouche`, `poser`, `ventreTape`, `brandir`) | 1 | 1 | 1 | 1 |
| Berthe (galette, `brandir`, `couronner`, `poingHanche`, `couper`) | 1 | 1 | 1 | 1 |
| le Petit (`designe`, `poche`, quatre pattes, mains sur les cuisses) | 1 | 1 | 1 | 1 |
Aussi dans `GAL.BEND.{gontran,berthe,petit}.{armF,armB}`. Les enveloppes l'appliquent d'elles-mêmes ; pour un `M.ik` à la main : `M.ik(C.galGontran, pose, x, y, s, dir, 'armF', [X, Y], 1)` (même `x, y, s, dir` que l'appel).
Angles : `armF_up` −1,57 = bras horizontal devant, −2,5 = au-dessus de la tête ; `armF_lo` négatif = coude plié vers l'avant ; `head` négatif = menton levé. Bras et coude ronds testés de 0 à 2,4 rad. Évité (signalé par le kit) : bras levé à fond (`armF_up` ≤ −2) **et** coude plié à fond (−2,4) en même temps.

Pièges :
- Un `ang.armF_up` / `armB_up` donné à la main désactive chez le Petit le placement automatique des mains (cuisses, plancher) pour ce bras ; un geste (`designe`, `poche`, `atteint`) l'emporte sur l'angle donné.
- Main arrière (`…B`) : elle passe **derrière** le corps et la tête ; pour porter un objet à la bouche ou le montrer, prendre la main avant.
- `couronner` : viser le haut de la tête de Gontran `rG.w('head', -4, -90)` (dessiner Gontran d'abord). Au moment où elle lâche : `tenu:'rien'` chez Berthe et `couronne:1` chez Gontran (même dessin).
- La coiffe de Berthe monte à ≈ 52 px au-dessus du crâne et part vers l'arrière (≈ 70 px derrière la nuque) : garder de la place derrière elle et sous le lambrequin.
- Fève ou figurine qui porte un mot-clé : `tenuO: { echelle: 2 }` (≈ 130 px de haut à s 0,9). `brille: 1` ajoute l'étoile de carton.
- Gontran et le propriétaire de `poubelle.js` ont tous deux un ventre ocre : ne pas les mettre côte à côte ; Gontran se reconnaît au crâne chauve, au nez rouge et à la moustache tombante.

## Accessoires (sans tige : ils volent) — `GAL.x(x, y, s, o)` ; `(x,y)` = point posé (base) ; s 1 par défaut
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `GAL.galette` | point le plus bas du bord avant (dessus à 73 px au-dessus) | 260 × 124 px (sur la table : s 0,6 ≈ 156 px) | `etat` `'entiere'` \| `'coupee'` (8 parts) \| `'entamee'` (7) \| `'vide'` ; `parts` 0..8 (parts restantes ; les parts de devant partent d'abord, tranches frangipane visibles) ; `ouvreK` 0..1 (parts écartées) ; `miettes` 0..1 |
| `GAL.part` | base (pointe à gauche, croûte à droite) | 128 × 56 px | `croque` 0..1 (morsure dentelée sur la pointe) ; `feve` `'rien'`\|`'vraie'`\|`'porcelaine'`\|`'plastique'` (+ `couleur`) : dépasse de la tranche ; `brille` |
| `GAL.feve` / `GAL.figurine` | base | vraie : 72 × 44 ; figurine : 44 × 76 ; **gag s 1,8** : 130 × 79 / 79 × 137 | `sorte` `'vraie'` (graine brun-vert à hile) \| `'porcelaine'` (petit roi blanc et cobalt) \| `'plastique'` ; `couleur` `'rouge'`\|`'jaune'`\|`'vert'`\|`'bleu'`\|hex ; `brille` 0..1 |
| `GAL.couronne` | milieu du bord inférieur | 150 × 80 px (sur la tête de Gontran : × 0,5) | `plie` 0..1 (pli et pointe tordue) ; `o.rot` |
| `GAL.bourse` | fond | 68 × 76 px | `ouverte` (pièces visibles au col) |
| `GAL.pieces` / `GAL.piece` | sol sous la pile / la rangée ; pièce seule : bas | disque 34 px ; pièce seule 36 px | `n` (5), `pile` (true = empilées) ; cuivre et or, **aucun signe** |
| `GAL.addition` | milieu du bâton (le papier pend dessous) | bâton 150 px, papier 92 px de large ; long 40 + 860 × `deroule` | `deroule` 0..1 (0,3) ; `t` (ondule) ; lignes ondulées grises, tache de vin ; `GAL.pt` `bas` si tenue |
| `GAL.assiette` | fond | 124 × 42 px | `etain` (true = étain gris ; défaut faïence à filet bleu) |
| `GAL.couteau` | milieu du manche (pointe vers +x) | 178 px | — (lame effilée + manche de bois à deux rivets) |

## Décors (pré-rendus par `GAL.init()`)
| Appel | Pose | Repères utiles |
|---|---|---|
| `GAL.salle(t, up, {epoque, feu})` | en premier (toile de fond 1080 × 1400 + feu animé) ; `up` = décalage vers le haut (px) | `epoque` `'moyenage'` (étains au manteau) \| `'xix'` (miroir ovale, pendule au cadran nu, vases, rideaux rouges) \| `'moderne'` (cadre paysage, plante, radiateur) ; `feu:false` l'éteint. `GAL.SALLE` : cheminée x 260, foyer x 160–360 / y 1040–1395, feu en (260, 1372), tablette du manteau y 936 ; fenêtre x 730–910 / y 540–900 |
| `GAL.lustre(t, x, y, {epoque, allume, cast, amp})` | (x,y) = bas de la pièce ; chaîne jusqu'aux cintres ; descendre/monter en faisant varier `y` | moyenage : couronne à 6 chandelles (flammes animées), conseillé (540, 470) ; xix : lampe à pétrole, abat-jour et globe d'opaline (540, 540) ; moderne : suspension émaillée crème (540, 540) ; `allume:false` = éteint |
| `GAL.tapisserie(t, x, y, {s, cast, amp})` | (x,y) = bas des franges | 240 × 580 px à s 1 (bannière bleu nuit bordée de rouge, étoile et fleurs, sans lettre) ; conseillé (588, 900, s 0,85) ; Moyen Âge seulement |
| `GAL.table(x, y, s, {nappe, cast, alpha})` | (x,y) = bas des pieds avant ; renvoie `{plateauY, places, pieds, nappeBasY, dessousY, gauche, droite}` | conseillé `(540, 1388, 1)` : `GAL.TABLE.plateauY` 1130, `places` x 330 / 465 / 615 / 750 (à y 1130), pieds avant x 255 et 825, bas de la nappe y 1206, dessous assombri ; `nappe:false` = bois nu. `GAL.tableAt(x, y, s)` = mêmes repères sans dessiner |
| `GAL.feu(t, x, y, k)` | feu seul (dessin direct) | — |

## Scène de groupe (testée, planches 5 et 9,97)
Ordre : `GAL.salle` → `GAL.tapisserie` (Moyen Âge) → `GAL.lustre` → `M.drawFloor()` → Berthe et Gontran (fente arrière) → `GAL.table` → objets sur le plateau → le Petit (fente avant) → `M.stageLight` → `M.rideau` → `M.drawFrame`.
- Table `(540, 1388, 1)`, plateau y 1130. Berthe x 330, Gontran x 760 (310 px d'écart), `FEETB`, s 0,9, `slot: ST.slotB`, dir 1 / −1 : visibles de la ceinture à la tête au-dessus du plateau, jambes et robe sous la table.
- Le Petit x 540, `FEET`, s 0,85, `aGenoux`, dir 1 : entre les pieds avant (255–825), haut de l'épi y ≈ 1173, juste sous la frange de la nappe (y 1206).
- Sur le plateau (y = `plateauY − 4`) : galette entière x 370 s 0,6, galette coupée x 720 s 0,6, assiette x 505 s 0,9.

## Exemples d'appels qui marchent
```js
GAL.init();                                                            // dans S.init
const T = GAL.table(540, 1388, 1, { nappe: true, cast: { a: 0.3, dx: 16, dy: 6 } });
GAL.galette(720, T.plateauY - 4, 0.6, { etat: 'coupee', parts: 6 });
// Gontran mord une part, couronne de travers ; Berthe le couronne (Gontran à 160 px)
const rG = GAL.gontran({ t, tenu: 'part', bouche: smooth(2, 2.6, t), couronne: 1, couronneRot: 0.35, expr: 'beat' }, 760, FEETB, 0.9, { dir: -1, slot: ST.slotB, cast });
GAL.berthe({ t, tenu: 'couronne', couronner: 1, cible: rG.w('head', -4, -90), sourcils: 'satisfait' }, 600, FEETB, 0.9, { dir: 1, slot: ST.slotB, cast });
// le Petit sous la table empoche la figurine avec un clin d'œil
GAL.petit({ t, tenu: 'figurine', poche: smooth(5, 6, t), clin: smooth(6.2, 6.4, t) }, 540, FEET, 0.85, { dir: 1, cast });
// fève brandie à l'échelle du gag
GAL.gontran({ t, tenu: 'feve', tenuO: { echelle: 2, brille: 1 }, brandir: 1, expr: 'ronds' }, 520, FEET, 0.9, { dir: 1, cast });
```
