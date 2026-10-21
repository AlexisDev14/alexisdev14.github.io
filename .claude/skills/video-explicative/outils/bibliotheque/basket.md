# persos.md — « Le basket, inventé avec des paniers à pêches » : mode d'emploi de `persos.js`

Espace de noms : `M.bkt` (dans `scene.js` : `const BKT = M.bkt;`). Dans `S.init` : `BKT.init()` (pré-rendus `BKT.K` : `sprDehors`, `sprMur`, `sprMilieu`, `ksDehors`, `ksMur`, `ksMilieu`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle, mesurées sur la planche.
Pieds : `FEET = ST.slotF - 34` (1416, fente avant), `FEETB = ST.slotB - 30` (1380). Les marionnettes passent d'elles-mêmes `slot: ST.slotF` ; au rang du fond, passer `slot: ST.slotB`.

## Marionnettes (avec tige)
Toujours par l'enveloppe `BKT.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle renvoie `r` : `r.w('pièce', x, y)` = point écran ; `r.q` = pose finale ; `r.main` / `r.mainB` = poing avant / arrière ; `r.tete` = haut du crâne.
Pièces : `torso head armF_up armF_lo armB_up armB_lo legF_up legF_lo legB_up legB_lo` (jambes à GENOU : `_up` cuisse, `_lo` tibia ; `legF_up` négatif = cuisse vers l'avant, `legF_lo` positif = genou qui plie). Pose de base des bras déjà appliquée : passer `ang` seulement pour un geste maison.

Options communes (toutes les marionnettes) :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'panier'`, `'ballon'`, `'ballonModerne'`, `'marteau'`, `'balai'`, `'montre'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul, + `echelle`).
- `droit` / `droitB` : objet gardé droit à l'écran (défaut `true` ; le marteau suit l'avant-bras). `ang.objet` le tourne.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (ballon, balai). Mis d'office par `souleve`, `tire`, `perce`, `attrape` avec ballon.
- `marche` 0..1 (avec `t`), `assis` 0..1 (assise à 108 × s au-dessus de `y` : poser `BKT.banc(x, y, s)` au même x, même s), `atteint` 0..1 + `cible` [X,Y] (+ `bras:'B'`) : la main va sur la cible.
- `handF` / `handB` `'fist'|'open'` ; `face` `{ brow, mouth, eyes }` ; `t` (respiration, gestes cycliques).
- Point nommé de l'objet tenu : `BKT.pt(r, nom, arriere)` → [X,Y] : panier `ouverture centre fond anseG anseD` ; ballon `centre haut bas` ; marteau `face tete` ; balai `pointe centre brosse` ; montre `centre anneau`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `BKT.naismith` (`C.bktNaismith`) | 0,9 ≈ 487 px | `cheveux`, `sifflet` (poitrine), `siffletM` (à la bouche) | `siffle` (sifflet à la bouche, poing devant, joues « o ») ; `souleve` (ballon tenu à deux mains au-dessus de la tête, met `tenu:'ballon'`) ; `presente` (+ `cible`, bras tendu main ouverte, défaut devant à hauteur d'épaule) ; `non` (deux mains ouvertes levées, tête qui hoche, recule un peu) ; `cloue` + `cible` (point du clou) + `coup` 0..1 (phase ; sinon cyclique avec `t`, 1,6 coup/s) : marteau dans la main avant, main arrière tient le panier sous le clou, `r.q.cloueHit` 0..1 = instant de frappe ; `tire` 0..1 = progression du tir (0–0,45 ballon ramené à la poitrine, 0,45–1 bras tendus vers l'avant-haut ; `tenu:'rien'` après le lâcher : mains ouvertes) ; `soupir` (épaules basses, tête baissée, yeux clos) ; `assis` (mains sur les genoux) ; `idee` (main ouverte levée, sourcils levés, bouche « o ») |
| `BKT.concierge` (`C.bktConcierge`) | 0,85 ≈ 445 px | `couronne` (cheveux blancs), `lunettes`, `cles` (trousseau qui se balance) | `porte` (un panier dans chaque main par l'anse : avant anse gauche, panier devant ; arrière anse droite, panier derrière ; `tenuO:{peches:3}`) ; `epaules` (haussement, mains vides ouvertes) ; `grimpe` + `phase` (tours ; défaut `t`·0,7) : jambes qui montent tour à tour, mains vers les barreaux (`cible` / `cibleB` pour les poser sur des barreaux précis) ; `attrape` (avec `tenu:'ballon'` : ballon à deux mains devant ; sans : mains ouvertes tendues) ; `perce` 0..1 (défini = balai à deux mains, manche vers le haut ; 1 = poussé au maximum, tête levée) ; `ouf` (main sur le front qui essuie, yeux clos) |
| `BKT.directeur` (`C.bktDirecteur`) | 0,9 ≈ 505 px (le plus grand) | `cheveux`, `lunettes` (cercle d'or) | `montre` (montre de gousset dans la main avant devant le ventre, chaîne d'or tirée jusqu'au gilet, main arrière ouverte qui tapote ; `tapote` 0..1 règle le tapotement) ; `designe` (+ `cible`, main ouverte paume en haut) ; `applaudit` (mains qui claquent avec `t`, ≈ 2,7 claques/s) |
| `BKT.eleve` (défs `C.bktEleveA` … `H`, `AC`/`FC` pour les brutes) | 0,82 ≈ 425 px ; brutes `a` `f` ×1,1 d'office ≈ 475 px | `cheveux` (sauf `f`) | `pose.tenue` `'a'`…`'f'` (Springfield) `'g'` `'h'` (Kansas) ; `carrure` (défaut vrai pour a et f : épaules +16 %, taille ×1,1 ; `false` pour l'enlever) ; `saute` (bras levés tout droit, genoux un peu pliés : le saut lui-même = `dy` négatif du plan) ; `chahute` (bras qui moulinent avec `t`, petits bonds) ; `plaque` (buste penché, épaule avant devant, fente avant ; pas de contact) ; `joie` (bras en V, menton levé, yeux plissés, petits bonds) ; `porte` (deux mains ouvertes au-dessus de la tête pour soulever un camarade, genoux pliés ; `cible`/`cibleB` pour placer les mains) ; `regardeHaut` (tête renversée, yeux ronds, bouche « o ») |

Tenues des élèves (couleur entière, tête) : `a` bordeaux #7a2e2e, noir frisé, nez busqué · `b` vert mousse, roux en brosse, taches de rousseur · `c` ocre, blond raie au milieu · `d` bleu ardoise, châtain court, petite moustache · `e` gris perle à rayures brunes, châtain ébouriffé · `f` brun tabac, crâne rasé · `g` maillot cramoisi / pantalon bleu, auburn ondulé, favoris · `h` maillot gris clair / pantalon noir, blond platine, taches de rousseur. `BKT.TENUES` = la table.

`bendSign` de `M.ik` (vérifié : planche sans aucune ligne ATTENTION, gestes dans les deux directions) :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Naismith, concierge, directeur, élèves (toutes tenues) | 1 | 1 | 1 | 1 |

Pour `M.ik` sur un élève : `BKT.eleveDef(pose)` donne la bonne définition, et l'échelle réelle d'une brute est `s × 1,1`.
Pièges : la pose de base est déjà « prête » (bras un peu pliés) : `ang` s'ajoute après les gestes ; passer `tenu:'rien'` pour un geste à mains nues quand l'enveloppe mettrait un objet d'office (`souleve`, `tire`, `cloue`, `perce`). `porte` du concierge et `porte` de l'élève sont deux gestes différents. Le marteau de `cloue` se lit mal tout près du visage : poser la `cible` à ≥ 60 px devant l'épaule. Une marionnette sur l'échelle garde sa tige jusqu'à la fente (`slot` par défaut) : c'est voulu.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Point d'un accessoire posé : `BKT.accPt(nom, x, y, s, o, point)`.

| Fonction | `(x,y)` = | Taille | Options |
|---|---|---|---|
| `BKT.panier(x,y,s,o)` | fond posé ; **centre de l'ouverture** si `cloue` ou `accroche` | s 1 : 156 de large (anses), ouverture 124, 94 de haut ; s 0,9 (cloué) 140 px | `fond` 1 fermé → 0 percé (le fond pend sur sa charnière, à gauche) ; `peches` n (pêches qui dépassent) ; `cloue` (deux clous au bord) ; `ballon` `'cuir'` \| `'moderne'` (coincé dedans, dépasse de ≈ 50) ; `anse` `'g'`\|`'d'` (prise quand il est tenu). Gag final ×1,2 : `s` 1,08 |
| `BKT.ballon` / `BKT.ballonModerne` | point de contact au sol ; centre si `o.centre` | 70 à s 1 (63 px à 0,9) | `tourne` (rad : coutures qui tournent) |
| `BKT.panierModerne` | centre du cercle ; sol si `pied` | cercle 152, panneau 600 × 350, filet 125 (×s) | `filet` 0..1 (ondule avec `t`) ; `pied` (longueur du poteau sous le panneau, local) |
| `BKT.echelle(x,y,s,o)` | milieu du pied | 860 de haut à s 1 (3,2 m), 112 de large | `incline` (rad, > 0 = le haut penche vers +x) ; `couchee` 0..1 (couchée au sol) |
| `BKT.echellePt(nom, x,y,s,o)` | — | — | `'haut'`, `'pied'`, ou un nombre k = barreau k (1..9, fractions permises) : y = pied − 85,7·k (incline 0,08) |
| `BKT.echelleSous(cote, o)` | — | — | échelle posée sous le panier `'g'` (côté gauche) / `'d'` (côté droit) → `{x, y, s:1, incline, haut}` ; g : pied (139, 1404), haut (208, 547) ; d : pied (941, 1404), haut (872, 547) |
| `BKT.banc` | sol, milieu | 300 × 108 (assise) à s 1 | — |
| `BKT.marteau`, `BKT.balai`, `BKT.montre` | bas du manche / bas de la paille / bas du boîtier | marteau 134, balai 558 (pointe 296 au-dessus de la prise), montre ø 34 | — |
| `BKT.seau`, `BKT.medecine` | sol | 70 / ø 84 | — |

## Décors (pré-rendus par `BKT.init()` ; à dessiner AVANT `M.drawFloor()`, animations en temps global)
| Appel | Pose | Repères utiles (`BKT.SALLE`, à `up` = 0) |
|---|---|---|
| `BKT.salle(t, up, o)` | toile entière (0..1395), `up` = décalage vertical (décor qui monte) | Springfield : briques, 2 fenêtres cintrées x 205–395 et 685–875 (y 690–1190) avec neige, toits, clocher et fumées ; galerie à balustres (rambarde y 352–548, poutre 548–598) ; horloge `M.pendule` x 540 y 732 ; appliques x 446 et 634 (y 868) ; cordes x 404 et 676, anneaux x 516/564 ; espalier x 58–178 ; cheval d'arçons x 540 ; massues sous la fenêtre droite, haltères sous la gauche ; poêle x 935 (porte en 935, 1290), tuyau jusqu'à la poutre ; lambris y 1236–1395 |
| `o` | | `epoque` `'springfield'` (défaut) \| `'kansas'` ; `paniers` 0 \| 1 \| `'g'` \| `'d'` (Springfield défaut 0 ; Kansas défaut 1 = paniers de fer sur panneau de bois) ; `fond` 1 \| 0 \| `{g, d}` ; `ballon` `'g'`\|`'d'` (+ `ballonType` `'cuir'`\|`'moderne'`) ; `neige` 0..1 (défaut 1) ; `lumiere` 0..1 (défaut 1) ; `spectateurs` 0\|1 (silhouettes muettes au balcon, têtes y ≈ 318) ; événements : `horlogeDt` (s ajoutées à l'horloge : aiguilles rapides p6), `porte` 0..1 (porte du poêle qui rougeoie, p3), `moineau` 0..1 (se pose sur la rambarde x 610 puis repart, p4), `paquetNeige` 0..1 (neige qui glisse d'un toit, fenêtre gauche, p2), `cordeTourne` 0..1 (corde gauche qui tourne, p5), `fanionTombe` 0..1 (Kansas, 6e fanion qui se décroche, p7) |
| `BKT.panierPt(cote, {up})` | — | centre de l'ouverture du panier cloué (ou du cercle de fer au Kansas) : g **[300, 594]**, d **[780, 594]** = 822 px au-dessus de `FEET` (3,05 m) ; fond du panier y ≈ 677 |
| `BKT.salleSol(t, o)` | APRÈS `M.drawFloor()`, avant les marionnettes | parquet ciré et reflets ; ballon médicinal x 168, seau x 900 (`medecine:false`, `seau:false`, `medecineX`, `seauX`) ; `banc` (x, défaut 820 si `true`) ; `epoque` |
Kansas : murs de pierre beige, fenêtres droites sur prairie d'automne, dôme et oiseaux ; galerie à grille de fer avec spectateurs ; fanions rouge/bleu sous la poutre SEULEMENT hors des paniers (x < 190, 410–670, > 890 ; dessinés derrière eux) ; paniers de fer : panneau de bois 224 × 194 px (y 434–628), cercle de fer sombre à reflet rouille 128 px de large, centre = `BKT.panierPt(cote)` (mêmes points g [300, 594] / d [780, 594] qu'à Springfield, l'option `epoque` est acceptée et sans effet), filet blanc ouvert qui pend jusqu'à y ≈ 698 (bas ouvert 76 px) : un ballon qui passe dans le filet se dessine APRÈS `BKT.salle` ; gradins à gauche avec trois spectateurs ; pas d'espalier, de cordes ni de cheval.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'BKT\.' casting/scene.js`, pages p16, p17, p18, p20).
```js
BKT.salle(t, 0, { paniers: 1, fond: { d: 0 }, spectateurs: 1 }); M.drawFloor(); BKT.salleSol(t, {});
const E = BKT.echelleSous('g'); BKT.echelle(E.x, E.y, 1, { incline: E.incline, cast });
const pn = BKT.echellePt(6, E.x, E.y, 1, { incline: E.incline }), P = BKT.panierPt('g');
BKT.naismith({ t, cloue: 1, cible: [P[0] - 36, P[1] + 6] }, pn[0], pn[1], 0.9, { dir: 1, cast });   // Naismith cloue, debout sur le 6e barreau
const r = BKT.concierge({ t, perce: 1 }, BKT.panierPt('d')[0] - 40, FEET, 0.85, { dir: 1, cast });   // BKT.pt(r,'pointe') ≈ fond du panier d
BKT.eleve({ t, tenue: 'g', joie: 1 }, 420, FEET, 0.8, { dir: 1, cast });
```
