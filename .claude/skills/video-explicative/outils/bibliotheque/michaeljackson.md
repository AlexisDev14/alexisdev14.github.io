# persos.md — « Michael Jackson, le roi qui s'est couronné lui-même » : mode d'emploi de `persos.js`

Espace de noms : `M.mj` (dans `scene.js` : `const MJ = M.mj;`). Dans `S.init` : `MJ.init()` (pré-rendus `MJ.K` : palFond, palMilieu, palSol, stuFond, stuMilieu, stuSol).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle conseillée (géométrie du code, vérifiée sur `casting/`). Aucune lettre, aucun chiffre, aucun logo nulle part.
Planche : `casting/scene.js` (0 repos · 0,5 objets · 1 / 1,5 comparaisons · 2 / 2,5 gestes de Michael · 3 marche glissée · 3,5 balayages · 4 couronne · 4,5 Taylor · 5 pose/hisse/lance · 5,5 présentateurs · 6 prises s 1,6 · 6,5 enfant · 7–8,5 décors · 9 frères · 9,5 balayages · 9,97 téléphone). 0 ligne ATTENTION.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut)
Toujours par l'enveloppe `MJ.nom(pose, x, y, s, o)` : elle prépare la pose (gestes → angles, objet tenu, seconde main). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale ; `r.main` / `r.mainB` = poing avant / arrière, écran). `MJ.nom.pose(pose, x, y, s, dir)` = pose finale sans dessiner (pour `M.ik`, `M.partMatrices`) ; `MJ.nom.def(pose)` = la `def` (`M.chars`) utilisée.

Options communes :
- `t` (obligatoire : souffle, sequins, paillettes, marche) ; `marche` 0..1 (+ `cadence`) : pas sur place, la scène déplace `x` ; `respire:false` ; `expr` : `'neutre' 'ravi' 'surpris' 'triste' 'fache' 'fier' 'gene' 'malin'`.
- `face : { brow, mouth, eyes }` ; en plus du kit : `eyes:'haut'` (regard levé) ; Taylor `mouth:'rire'`. Michael et le présentateur sourient par défaut (`mouth:'n'` pour neutraliser).
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'couronne' 'coussin' 'note' 'micro'` (`'rien'` = main vide) ; `tenuO` / `tenuBO` = options de l'objet (les mêmes que l'objet seul, + `echelle`).
- `droit` (défaut `true` avec un objet : il reste droit à l'écran) ; `ang.objet` l'incline. `deuxMains` : la main arrière va d'elle-même sur la seconde prise (couronne, coussin, note).
- `handF` / `handB` : `'fist' | 'open'`. Tout angle `ang.*` s'ajoute après les gestes. `cible` = point ÉCRAN.
- Point écran d'un point nommé de l'objet tenu : `MJ.pt(r, 'nom')` (main arrière : `MJ.pt(r, 'nom', true)` ; `'prise'` = point tenu) : couronne `base sommet centre` ; coussin `dessus base` ; note `centre haut bas` ; micro `tete bas`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `MJ.michael` (`C.mjMichael`) | 0,9 ≈ 489 px (haut du fedora), 463 sans chapeau, ≈ 570 avec une couronne ; torse 50 px, bord du chapeau 104 px | `hat` (fedora), `boucles` `bouclesB` `meche`, `couronnes`, jambes `legX_up/_lo` + `piedX` | `couronnes` : liste de métaux empilés sur le fedora (`['or']`, `['or','argent','cuivre']`, `'papier'`) + `couronneS` (0,8) + `eclat` ; `glisse` (marche arrière glissée façon moonwalk : un genou plié talon à peine levé, l'autre jambe tendue, pieds à plat pointe vers l'avant ; déplacer `x` de **−dir·`MJ.GLISSE`(92)·s px/s**, `cadence` 0,85) ; `pointe` (sur la pointe des pieds, bras levés en V, mains ouvertes) ; `salut` (0→0,45 la main prend le bord avant du fedora, 0,45→1 elle le lève de 46 et l'incline) ; `regardeHaut` ; `perplexe` (poing sous le menton, tête penchée) ; `couronne` (se pose la couronne à deux mains : 0 devant la poitrine → 0,5 haut devant → 0,8 au-dessus du chapeau → 1 posée sur le sommet ; `tenu:'couronne'` d'office, `tenuO.metal`) ; `assis` + `siege` (y écran du dessus du siège, ex. `MJ.trone(...).siege`) ; `clin` (0,35→1 : œil fermé + petite étincelle) ; `incline` (courbette pour recevoir une couronne : buste plié, tête baissée) |
| `MJ.michael({age:'enfant'})` (`C.mjEnfant`) | défaut 0,85 ≈ 324 px (afro) | `afro` ; jambes `legX` + `legX_lo` (pattes d'éléphant) | `chante` (micro chromé à hauteur de bouche, incliné vers elle ; bouche qui s'ouvre au rythme de `t`) ; `danse` (genoux levés en alternance, bras qui balancent, petit saut ; cumulable avec `chante`) ; `marche` |
| `MJ.frere(n, pose, x, y, s, o)` (`C.mjFrere1..4`) | taille propre à chacun si `s` omis (Michael enfant 0,85 ≈ 324 px) ; `MJ.frere.pose(n, …)`, `MJ.frere.def(n)` | `afro` ; jambes `legX` + `legX_lo` | mêmes gestes que Michael enfant (`chante`, `danse`, `marche`) + `claque` (mains ouvertes qui se rejoignent devant la poitrine), `balance` (balancement d'épaules et de buste), `penche` (buste penché en avant) |
| ↳ frère 1 | 0,92 ≈ 340 px | peau #7A4B30 | afro moyen ; gilet vert éteint sur chemise ivoire à grand col ; pantalon gris droit ; chaussures noires |
| ↳ frère 2 | 0,88 ≈ 338 px (plus grosse afro) | peau #8A5A3C | grosse afro ; chemise bleu ardoise boutonnée, col blanc ; pattes d'éléphant bleu nuit |
| ↳ frère 3 | 0,93 ≈ 337 px | peau #6B4128 | afro courte ; col roulé ocre côtelé ; pantalon droit olive |
| ↳ frère 4 | 0,80 ≈ 300 px (le plus petit) | peau #94643F | afro moyenne ; gilet bordeaux sur chemise crème à grand col ; pattes d'éléphant crème |
| `MJ.taylor` (`C.mjTaylor`) | 0,9 ≈ 491 px (cheveux), robe ≈ 110 px au sol ; bras 192 unités (173 px) | `cheveux` (+ boucle d'oreille), `souliers` ; **pas de jambes** (robe au sol) | `presente` (bras avant en diagonale, paume ouverte, vers l'avant) ; `porteCoussin` (coussin à deux mains devant elle ; `tenuO.couronnes`) ; `pose` + `cible` (pose la couronne, bras devant ; `cible` = point où va la BASE : `MJ.sommet(rM, n)`) ; `hisse` + `cible` (sur la pointe des pieds, couronne au-dessus de sa tête puis posée) ; `lance` + `vers` (lance en cloche, par dessous ; quitte la main à `MJ.LACHE` = 0,55 ; de 0,55 à 1 la couronne vole seule jusqu'à `vers` ; métal : `tenuO.metal`) ; `applaudit` ; `rit` (tête en arrière, main sur le collier, yeux fermés) ; `marche` (glisse, robe) |
| `MJ.presentateur` (`C.mjPresentateur`, `tenue:'mtv'` défaut) | 0,9 ≈ 467 px (casquette), veste 70 px | `casquette` (retournée), `cheveux` | tient d'office son micro noir (`micro:false` ou `tenu:'rien'` pour l'ôter) ; `parle` (tête du micro devant la bouche, autre main ouverte qui accompagne) ; `lit` (note à deux mains par les bords, dos au public, tête baissée ; le micro passe dans la poche) ; `montre` (0→1 : la feuille se retourne face au public et avance ; `lit` puis `montre` s'enchaînent) ; `salue` (petite courbette, main sur le ventre) ; `haussement` (avant-bras levés paumes ouvertes, tête penchée) |
| `MJ.presentateur({tenue:'chaine'})` (`C.mjPresentatrice`) | 0,9 ≈ 473 px (brushing) | `cheveux` (+ créoles) | mêmes gestes ; micro BLANC d'office |

**`bendSign` de `M.ik`** (vérifié : gestes, `M.ik` direct, bras pliés à fond, balayages épaule 0→2,4 / coude 0→2,4, dans les deux sens ; zéro ligne ATTENTION) :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Michael adulte, Michael enfant, les 4 frères, Taylor, présentateur, présentatrice | 1 | 1 | 1 | 1 |
Cibles toujours DEVANT le personnage, à moins de ≈ 190 × s px de l'épaule (enfant : 125 × s). Exemple : `const q = MJ.taylor.pose(p, x, FEET, 0.9, -1); const a = M.ik(MJ.taylor.def(p), q, x, FEET, 0.9, -1, 'armF', T, 1);` puis `MJ.taylor(Object.assign({}, p, { ang: { armF_up: a.up, armF_lo: a.lo } }), …)`.

**Sommet du fedora et pile de couronnes** : `MJ.sommet(rM, n)` = point écran où poser la BASE de la couronne n° n (0 = sur le fedora, 1 = sur la 1re couronne…). Pas d'empilement `MJ.STEP·couronneS·s` = 75 × 0,8 × 0,9 ≈ **54 px** ; une couronne posée fait 107 × 81 px à s 0,9. Repère local : `MJ.SOMMET = [2,-120]` dans la tête. La pile reste presque droite quand la tête bouge. Empiler 3 couronnes : dessiner `MJ.michael({ t, couronnes: ['or','argent','cuivre'] }, …)` ; pour qu'une couronne arrive, la faire tenir/voler jusqu'à `MJ.sommet(rM, nDéjàPosées)` puis, à l'image suivante, l'ajouter à `couronnes` (et la retirer de la main).

Pièges :
- **Portée de Taylor** : elle ne peut pas atteindre le fedora de Michael debout. Recette testée (s 0,9) : Michael `incline:1`, Taylor `dir` opposé à **242 px** devant lui (`xT = xM + 242·dirM`), `pose` + `cible: MJ.sommet(rM, 0)` ; 2e couronne : même placement, `hisse` + `cible: MJ.sommet(rM, 1)` ; 3e : `lance` + `vers: MJ.sommet(rM, 2)` (Michael peut être droit, `regardeHaut`). À `lance` = 1, cesser de passer `vers` et ajouter la couronne à `couronnes`.
- `couronne` (Michael) : de 0,2 à 0,45 la couronne passe devant le visage (bref) ; `salut` : le bras passe devant le visage. Ne pas tenir ces instants pendant une réaction.
- `assis` : `x` = trône (la hanche est au-dessus de `x`, les pieds ≈ 110 px devant) ; `siege` obligatoire hors trône par défaut ; avec `MJ.trone(x, ST.back, 0.9)` et Michael à `FEET`, les pieds touchent presque (≈ 4 px).
- Le gant blanc pailleté est à la main AVANT (dans les deux sens) ; la main arrière est nue.
- Frères (plan 2) : utiliser **`MJ.frere(n, …)`** ci-dessous (et non `RON.enfant` de `ronald.js` : ses tenues `'a'`/`'d'` sont des filles, peau claire, pas d'afro).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre`, `o.t` (reflets). `MJ.accPt(nom, x, y, s, o, 'point')` = point écran d'un point nommé.

| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `MJ.couronne(x,y,s,o)` | milieu du bas (hermine) | 148 × 113 (à 0,72 : 107 × 81 px) | `metal` `'or'` (#C9A444) \| `'argent'` \| `'cuivre'` (chacune entière de son métal) \| `'papier'` (ou `papier:true`) ; `eclat` (`true` = reflet qui passe toutes les 2,8 s ; nombre 0..1 = position) ; `fil` (fil vers les cintres) |
| `MJ.coussin(x,y,s,o)` | milieu du dessous | 222 × 51 (+ glands 24) ; tenu à 0,8 | `couronnes` (liste empilée, ex. `['or','argent','cuivre']`) ; `couronneS` (1 = même taille que sur la tête quand le coussin est à 0,8) ; `fil` (deux fils depuis les glands : descente des cintres) ; `eclat`. Dessus : `y − 44·s` |
| `MJ.note(x,y,s,o)` | milieu du bas | 150 × 200 ; tenue (0,95) à s 0,9 : 128 × 171 px | `retourne` (1 défaut = face : fedora noir de face surmonté d'une couronne d'or, deux petites couronnes en bas ; 0 = dos, presque de chant) |
| `MJ.micro(x,y,s,o)` | bas du manche | 30 × 104 | `couleur` `'noir'` \| `'blanc'` \| `'chrome'` |
| `MJ.tele(x,y,s,o)` | milieu du dessous | 230 × 196 (300 avec l'antenne) ; vitre 142 × 146 | `couleur` `'gris' 'ocre' 'turquoise' 'bordeaux' 'anthracite'` \| hex ; `ecran` `'couronne'` (couronne d'or sur fond bleu à rayons) \| `'presentatrice'` (buste qui parle ; `pose`, `ecranDir`) \| `'neige'` \| `'formes'` \| `'couleur'` \| `'eteint'` ; `antenne` (true) ; `fil` ; `ph` (déphasage). Centre de l'écran : `MJ.accPt('tele',x,y,s,o,'ecran')` |
| `MJ.trone(x,y,s,o)` | milieu au sol | 230 × 432 ; s 0,9 : 207 × 389 px | renvoie `r.siege` (y écran du siège, 104·s au-dessus de `y`) et `r.x` |
| `MJ.piedestal(x,y,s,o)` | sol | 100 × 196 ; s 0,9 : 90 × 176 | renvoie `r.dessus` [x,y] (y poser le coussin) |
| `MJ.podium(x,y,s,o)` | sol | 168 × 252 ; s 0,9 : 151 × 227 | pupitre violet à étoile d'or ; `r.dessus` |
| `MJ.buste(x,y,s,o)` | bas du buste (mi-poitrine) | ≈ 290·s de haut | présentatrice (`tenue` 'chaine' défaut, ou 'mtv') découpée pour un écran ; `pose` (gestes du présentateur), `dir`, `t` |
| `MJ.cloche(u, P0, P1, haut, tours)` | — | — | vol en cloche → `{x, y, rot}` (u 0..1) : pour faire voler une couronne ou un coussin |

## Décors (pré-rendus par `MJ.init()`)
| Appel | Pose | Repères utiles |
|---|---|---|
| `MJ.palais(t, o)` AVANT `M.drawFloor()`, puis `MJ.palaisSol(t, o)` juste après (avant les marionnettes) | plein cadre | `o.trone` (x : trône à `ST.back`, s 0,9) ; `o.piedestal` (x) ; `o.podium` 0..1 (pupitre qui monte de la trappe, `o.podiumX` 720) ; événements (instants LOCAUX) `o.retard` (la marche du haut s'allume en retard), `o.projo` (le projecteur de droite se rallume en grésillant), `o.boule` (la boule accélère) ; `palaisSol` : `o.petale` (un pétale tombe du bouquet) ; `o.lumiere` 0..1. Renvoie `{ siege, trone, piedestal:[x,y], podium:[x,y] }`. `MJ.PALAIS` : colonnes x 292 / 788 (chapiteaux y 540), arche d'ampoules sommet y 330, boule (540, 470), lustres (402, 418) et (678, 418), escalier 4 marches centré x 540 (haut y 1283), enceintes x 128–252 et 828–952 (dès y 1056), étagère de trophées x 128–262 (y 522 et 712), disques d'or (892, 640) et (892, 810), projecteurs (150, 318) et (930, 318), bouquet x 176, micro sur pied x 912 (premier plan). Animations : étoiles du rideau, reflets de la boule qui balaient, boule qui tourne, lustres qui balancent, chenillard d'ampoules, marches qui s'allument, projecteurs fuchsia / turquoise qui balaient, membranes des enceintes, paillettes et poussière. |
| `MJ.studio91(t, o)` AVANT `M.drawFloor()`, puis `MJ.studio91Sol(t)` juste après | plein cadre | `o.ecrans` (liste de 9 modes pour le mur, ex. 9 × `'couronne'`) ; `o.neige` (instant LOCAL : un écran passe à la neige 0,6 s) ; `o.regie` 0..1 (lampe de la régie) ; `o.tele = [{ x, y (bas du poste, 1000), s (1), couleur, ecran, p (0..1 descente des cintres), pose }]` ; `o.lumiere`. `MJ.STUDIO` : mur de 9 postes x 318–762, y 410–870 (`STUDIO.teles` : centres x 392/540/688, bas y 550/692/834) ; néon zigzag y 352 (x 300–780) ; néon triangle (222, 540) ; régie x 800–956, y 470–690 ; horloge (216, 760) ; canapé x 196–446 ; plante x 150 ; caméra 1991 x 866 (voyant (920, 1055)) ; premier plan : projecteur sur pied x 150, ventilateur (262, 1360), tabouret x 934. Animations : écrans, néons qui pulsent, voyant qui clignote, horloge, écrans de régie, ventilateur, faisceaux et poussière. |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'MJ\.' casting/scene.js`). Les plus utiles :
```js
// P1 : la couronne descend seule sur son coussin, Michael lève les yeux
MJ.palais(t, { retard: 4 }); M.drawFloor(); MJ.palaisSol(t);
MJ.coussin(540, lerp(-200, 900, ease(u)), 0.8, { couronnes: ['or'], fil: true, eclat: true, t });
MJ.michael({ t, regardeHaut: 1 }, 400, FEET, 0.9, { dir: 1, cast });
// P3 : Taylor pose la 1re couronne sur Michael incliné
const rM = MJ.michael({ t, incline: 1 }, 400, FEET, 0.9, { dir: 1, cast });
MJ.taylor({ t, pose: k, cible: MJ.sommet(rM, 0), tenuO: { metal: 'or' } }, 642, FEET, 0.9, { dir: -1, cast });
// P4 : le présentateur lit puis montre la note
MJ.studio91(t, { regie: 1 }); M.drawFloor(); MJ.studio91Sol(t);
MJ.presentateur({ t, lit: 1, montre: smooth(5, 6, t) }, 520, FEET, 0.9, { dir: 1, cast });
// P6 : Michael sur son trône se pose la couronne
const R = MJ.palais(t, { trone: 380 }); M.drawFloor(); MJ.palaisSol(t);
MJ.michael({ t, assis: 1, siege: R.siege, couronne: k }, R.trone, FEET, 0.9, { dir: 1, cast });
```
