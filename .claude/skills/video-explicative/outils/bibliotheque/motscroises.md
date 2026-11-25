# persos.md — « Les mots croisés, le jeu que le New York Times méprisait » : mode d'emploi de `persos.js`

Espace de noms : `M.mc` (dans `scene.js` : `const MC = M.mc;`). Dans `S.init` : `MC.init()` (pré-rendus `MC.K` : `vue`, `fond`, `bureau24`, `bureau41`, `store`, `sol`, `fauteuil`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** (mesurées sur la planche).
Aucune lettre, aucun chiffre : grilles = cases vides (noires ou grisées au crayon), journaux = colonnes grises, frise du Times = arabesques noires.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `MC.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle prépare la pose (gestes, objet tenu, seconde main) et renvoie `r` : `r.w('pièce', x, y)` = point écran, `r.q` = pose finale. `MC.nom.pose(p, x, y, s, dir)` = pose finale sans dessiner, `MC.nom.def()` = la définition (pour `M.ik`, `M.partMatrices`).

Options communes :
- `t` **toujours** (respiration, marche, crayon pendu qui se balance, gribouillage). `marche` 0..1 ou `true` (+ `cadence`, 1,1 pas/s) ; `respire:false`.
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'grilleLosange' 'grilleCarree' 'journalGrille' 'journalTimes' 'recueil' 'crayon' 'pincettes' 'note' 'mouchoir' 'rien'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul, + `echelle`).
- `droit` / `droitB` : `true` d'office quand un objet est tenu (il reste droit à l'écran) ; `ang.objet` / `ang.objetB` l'inclinent.
- `deuxMains` : la main arrière va d'elle-même sur la seconde prise (d'office pour `montre`, `lit`, `cache`, `lit` des joueurs).
- Objets plats (grilles, journaux, recueil, note) : dessinés **devant l'avant-bras, sous les doigts** (la main entoure le bord haut), **jamais en miroir** (contre-retournés en `dir −1`).
- `handF` / `handB` : `'fist' | 'open'` ; `face : { brow, mouth, eyes }` ; `expr` : `'neutre' 'ravi' 'surpris' 'triste' 'fache' 'fier' 'degout' 'juge'`. Tout `ang.*` s'ajoute après les gestes.
- `assis` + `siege` = hauteur **locale** du siège au-dessus des pieds (défaut 118) : siège écran à `y − siege·s`. Fauteuil du bureau : `siege: MC.BUREAU.fauteuil.siege` (112). Banc de l'abri de bus (`GRV.abri`, assise à `yAbri − 120·sAbri`) : `siege = (FEET − yAssise) / s` (≈ 157 si l'abri est posé au sol des pieds à s 1). Pieds à plat ≈ 150·s devant `x`.
- Point écran d'un point nommé de l'objet tenu : `MC.pt(r, 'nom')` (main arrière : `MC.pt(r, 'nom', true)` ; `'prise'` = point tenu). Crayon `mine` `gomme` ; journaux `centre` `haut` `grille` ; grilleLosange `centre` `haut` `bas` ; recueil `attache` (bas du dos, départ du cordon) `page` ; pincettes `mors` `anneau` `feuille` (centre de la feuille pincée) ; note `tampon`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `MC.wynne` (`C.mcWynne`) | 0,9 ≈ 463 px | `cheveux` (raie au milieu), `moustache` (guidon rousse), `visiere` (verte) | `dessine` (crayon d'office ; `cible` = point écran de la **mine**, défaut devant la poitrine ; tête baissée, main arrière à plat 52 u derrière ; se combine avec `assis`) ; `montre` (grilleLosange d'office, `echelle` 0,8 = 173 × 216 px, tenue de face par le bord haut à deux mains, sourire) ; `croise` (un crayon ×1,3 dans chaque main, croisés en X devant la poitrine) ; `poche` 0 → 0,5 la main va à la poche, 0,5 → 1 poche retournée (doublure blanche), la pièce de laiton tombe de 0,62 à ≈ 0,92 jusqu'au sol `y` (dessinée par l'enveloppe) ; `decu` (tête basse, épaules tombées) ; `fier` (pouces aux emmanchures du gilet, menton levé) |
| `MC.redac` (`C.mcRedac`) | 0,9 ≈ 494 px (le plus grand) ; bras 104 | `cheveux` (argent, en arrière), `pinceNez` (+ cordon), `pan` (bas de redingote assis), `genoux` | `outre` (menton levé, buste en arrière, main ouverte devant la poitrine) ; `bout` (journalGrille d'office tenu par le milieu du bord haut, bras tendu, nez pincé) ; `jette` 0 → 0,45 lève, → 0,8 en avant, ≥ 0,8 lâche : `r.lache = true`, `r.lachePt` = point de départ (la scène dessine ensuite `MC.journalGrille` qui tombe ; `lache:false` pour garder) ; `essuie` (mouchoir dans la main avant qui frotte la main arrière, exige `t`) ; `lit` (journalTimes ouvert de face à deux mains, bord haut ; `tenuO: { grille: true, rempli }` → grille 131 px) ; `soupir` ; `pincettes` (pincettes d'office dans la main AVANT, bras levé devant, journalGrille pincé au bout ; `tenuO.tient` `'journalGrille'`(défaut) \| `'grilleCarree'` \| `'note'` \| `null`, `tenuO.tientO`, `tenuO.serre` ; tête renversée, yeux fermés) ; `epie` (penché, main au pince-nez, sourcil levé) ; `gourmand` (met `assis` ; journal plié sur les genoux, grille 138 px ; crayon d'office : `ecrit` 0 = gomme aux lèvres, sourire → 1 = la mine griffonne une case ; `rempli` = cases grisées du journal des genoux) ; `cache` 0 → 0,4 les mains montent au bord, 0,35 → 1 le Times se rabat de haut en bas sur la grille (yeux ronds par-dessus) ; `sourcil` −1..1 (sourcils mobiles) ; `nez:true` (nez plissé) |
| `MC.joueurA` | 0,9 ≈ 476 px | `canotier` (paille, ruban marine) | veste ocre, pantalon gris clair. Gestes des joueurs ci-dessous |
| `MC.joueuseB` | 0,88 ≈ 451 px | `cheveux` (garçonne noire) | robe vert éteint à taille basse, sautoir de perles, bas clairs |
| `MC.joueurC` | 0,9 ≈ 457 px | `moustache` (blanche) | chauve (couronne grise), lunettes rondes noires, costume tabac en tweed, gilet bleu ardoise |
| `MC.biblio` (bibliothécaire) | 0,88 ≈ 449 px | `cheveux`, `chignon`, `chaine` (lunettes à chaîne) | robe longue prune à col blanc, **pas de jambes** (`marche` = glisse) ; `desespoir` (deux mains ouvertes levées à hauteur du sommet de la tête, tête basse, bouche « o ») ; `chut` (main ouverte devant la bouche, l'autre paume en avant, sourcils froncés) |

**Joueurs A, B, C** : recueil fermé tenu d'office dans la main avant (par le dos, crayon pendu au cordon). `lit` (recueil ouvert à deux mains, tête penchée) ; `ecrit` (recueil ouvert dans la main arrière, crayon dans la main avant qui griffonne sur la page ; cordon rouge tendu du crayon au recueil, dessiné par l'enveloppe) ; `mordille` (gomme du crayon aux lèvres, recueil ouvert bas dans la main arrière ; `ecrit` > 0 passe de l'un à l'autre) ; `assis` (+ `siege`) ; `porte` (pile de 5 dictionnaires de couleurs différentes sur l'avant-bras, bras autour, sommet ≈ 10 px au-dessus du canotier, buste en arrière ; pas d'objet tenu). `tenu:'rien'` = mains vides.

### `bendSign` de `M.ik` (vérifié pages 2 et 3 de la planche : M.ik direct, deux bras, deux sens ; balayage page 4 ; zéro ligne ATTENTION)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| wynne, redac, joueurA, joueuseB, joueurC, biblio | 1 | 1 | 1 | 1 |
Usage : `const q = MC.redac.pose(p, x, FEET, 0.9, d), sol = M.ik(MC.redac.def(), q, x, FEET, 0.9, d, 'armF', [tx, ty], 1);` puis `MC.redac(Object.assign({}, p, { ang: { armF_up: sol.up, armF_lo: sol.lo } }), x, FEET, 0.9, { dir: d })`. Cibles DEVANT le personnage, à moins de ≈ 175 px (s 0,9) de l'épaule (rédacteur ≈ 180 px). Les gestes de l'enveloppe font déjà leur IK (`MC.BEND` donne le même tableau).

Pièges :
- `t` oublié : le crayon pendu du recueil ne se balance plus, la marche et `essuie` sont figés.
- `jette` ≥ 0,8 : l'objet disparaît de la main ; enchaîner tout de suite le vol de `MC.journalGrille` depuis `r.lachePt`.
- `gourmand` / `cache` mettent `assis` d'office (passer `siege`). En `cache`, le crayon disparaît (le Times passe dans les mains) : enchaîner `ecrit` → 0 puis `cache` rapidement. Le journal des genoux couvre le buste jusqu'au menton (c'est voulu : grille ≥ 130 px).
- Objets contre-retournés en `dir −1` : `MC.pt(r, 'grille')` du Times donne alors le coin opposé (la grille est dessinée en bas à DROITE de l'écran, quel que soit le sens).
- `montre` : la feuille cache le gilet ; garder le visage au-dessus (ne pas monter `ang.armF_up` à la main).
- `poche` : bruitage `objet_pose` (petit) vers `poche` ≈ 0,92 ; la pièce reste au sol tant que `poche` = 1.
- Le rédacteur est volontairement plus grand que Léa (≈ 30 px à s 0,9) : côte à côte sur le banc, mêmes `siege` et échelle 0,9.

## Accessoires (sans tige : ils volent)
`MC.nom(x, y, s, o)` ; options communes : `o.dir` ±1, `o.rot` (rad autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre`, `o.t`. `MC.accPt(nom, x, y, s, o, 'point')` = point écran d'un point nommé.

| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `MC.grilleLosange` | milieu du bas | feuille 240 × 300, losange 208 | `trace` 0..1 (les cases se dessinent une à une, trait à trait ; lignes grises d'indications à la fin) |
| `MC.grilleCarree` | milieu du bas | 168 × 168 (grille 153) | `rempli` 0..1 (cases blanches grisées une à une, traits de crayon, jamais de lettre) |
| `MC.journalGrille` | milieu du bas | 184 × 250 (`court` : 184 × 176) ; grille 153 (138 px à 0,9) | `face` (true) \| false = dos (colonnes) ; `court` ; `rempli` ; `prise:'haut'` (tenu par le milieu du bord haut) |
| `MC.journalTimes` | milieu du bas | 300 × 220 ; grille 146 (131 px à 0,9) | `grille` (false) ; `rempli` ; `rabat` 0..1 (se déplie de haut en bas) |
| `MC.recueil` | milieu du bas | 74 × 100 fermé, 148 × 100 ouvert ; crayon pendu ≈ 135 sous le bas | `ouvert` 0..1 (couverture qui tourne) ; `crayon:false` ; `seed` (phase du balancement) ; `prise:'gauche'` (tenu ouvert par le bord gauche) |
| `MC.crayon` | milieu | 90 de long | points `mine`, `gomme` |
| `MC.pincettes` | mors | 194 (anneau → mors) + feuille pincée | `tient`, `tientO`, `serre` 0..1 (1 défaut) |
| `MC.note` | milieu du bas | 110 × 140 | ligne grises, tampon rond rouge sans signe (`tampon`) |

## Décor récurrent : bureau du rédacteur du New York Times (pré-rendu par `MC.init()`)
`MC.bureauTimes(t, up, o)` EN PREMIER, puis `M.drawFloor()`, puis `MC.bureauTimesSol(t, up, o)` avant les marionnettes ; `up` (px) monte tout le décor ; mêmes `annee` / `blackout` pour les deux appels. Animations en temps global : nuages qui défilent (1924), fumées des cheminées, balancier et aiguilles de l'horloge de parquet, lueur de la lampe, étoiles et projecteurs de DCA (1941).
- `bureauTimes` : `annee` 1924 (défaut, jour) \| 1941 (nuit : téléphone noir de bakélite, radio de table, éphéméride rouge) ; `blackout` 0..1 (le store noir descend, fente en bas où passent les faisceaux, abat-jour baissé, pièce assombrie, rai de lumière en diagonale vers le sol) ; `capsule` 0..1 (0,25–0,45 le tube tremble, 0,42–0,52 la trappe s'ouvre, 0,5–0,72 la capsule tombe dans le panier, rebondit, puis y reste couchée ; remettre 0 quand le personnage l'a prise) ; `effeuille` 0..1 (9 feuilles de l'éphéméride s'envolent en rafale vers la gauche) ; `lumiere` 0..1.
- `bureauTimesSol` : tapis d'Orient, fauteuil club (`fauteuil:false` pour l'ôter), corbeille d'osier fixe.
- L'assombrissement ne touche que le décor : pour les personnages, `M.stageLight(t, { spot: {…, a: 0.35–0.45} })`.

| Point (`MC.BUREAU`) | Valeur | Usage |
|---|---|---|
| `zone` | `{ x0: 420, x1: 700 }` | zone dégagée devant le bureau (rédacteur debout, FEET) |
| `fauteuil` | `{ x: 290, siege: 112, y: 1315 }` | `MC.redac({ t, gourmand: 1, siege: 112 }, 290, FEET, 0.9, { dir: 1 })` (dossier à gauche) |
| `corbeille` | `{ x: 770, y: 1428, bord: 1300 }` | ouverture x 708–832 ; jet : de `r.lachePt` vers `(770, 1300)` |
| `tube` | `{ x: 904, bouche: [904, 1004], panier: [904, 1074] }` | tube pneumatique en laiton, panier de fil de fer (la note sort de la capsule : `MC.note`) |
| `ephemeride` | `{ x: 716, y: 560 }` | éphéméride murale sans chiffre (bloc 92 × 100) |
| `bureau` | `{ x0: 380, x1: 712, y: 1182 }` | plateau d'acajou (sous-main x 450–590, encrier 600, lampe 668, téléphone 418, radio 1941 520) |
| `fenetre` | `{ x0: 380, x1: 640, y0: 262, y1: 900 }` | haute fenêtre à petits bois sur les gratte-ciel ; store 1941 |
| `horloge`, `portrait`, `portrait2`, `biblio` | x 820 (haut 700) ; (850, 270) ; (220, 260) ; x 110–330 | horloge de parquet, portraits sans visage, bibliothèque vitrée |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'MC\.' casting/scene.js`).
```js
MC.bureauTimes(t, 0, { annee: 1924 }); M.drawFloor(); MC.bureauTimesSol(t, 0, {});
const r = MC.redac({ t, pincettes: 1 }, 560, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });      // MC.pt(r, 'mors')
MC.bureauTimes(t, 0, { annee: 1941, blackout: 1, capsule: 0.62, effeuille: 0.5 }); M.drawFloor(); MC.bureauTimesSol(t, 0, { annee: 1941, blackout: 1 });
MC.redac({ t, gourmand: 1, ecrit: 0.7, rempli: 0.5, siege: 112 }, 290, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
MC.wynne({ t, montre: 1, tenuO: { trace: 1 } }, 480, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
MC.joueuseB({ t, ecrit: 1 }, 400, FEET, 0.88, { dir: -1, slot: ST.slotF, cast });
```

## Comparaisons faites (planche page 8)
Wynne / `GDM.welles`, `WW.marston`, `PNL.nast` : distinct (visière verte, moustache en guidon rousse, gilet bordeaux ; Nast a aussi chemise blanche et fixe-manches : ne pas les mettre ensemble). Rédacteur / `GDM.patron`, `BTL.rowe`, `NOB.alfred`, `POU.prefet` : distinct ; proche de `NOB.notaire` (redingote noire, favoris, pince-nez) mais plus grand, cheveux pleins coiffés en arrière, col cassé et lavallière perle. Joueur C / `WW.marston` : chauve, moustache blanche, lunettes noires, gilet ardoise (Marston : cheveux bruns, lunettes ambrées).
