# persos.md — « Le paris-brest, le gâteau en forme de roue » : mode d'emploi de `persos.js`

Espace de noms : `M.pbr` (dans `scene.js` : `const PBR = M.pbr;`). Dans `S.init` : `PBR.init()` (pré-rendus `PBR.K` : toile, toileNuit, facade, facadeNuit, store, reflets, battant, banc, reverbere, soleil, lune, journal).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée 0,9 partout (vélo, gâteau, banc compris). Tailles en px **à l'écran** à 0,9.
Aucune lettre nulle part (enseigne : couronne et rameaux ; journal : gravure + traits gris).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `PBR.nom(pose, x, y, s, o)` (`o` : `dir`, `slot`, `cast`, `nom`, `alpha`…). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.pose`).

Options communes (les trois personnages) :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'journal'` `'crayon'` `'montre'` `'plateau'` `'poche'` `'pincee'` `'gateau'` `'rien'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul, + `echelle`, ex. `{ echelle: 1.3 }` pour grossir la montre).
- `droit` / `droitB` : `true` par défaut (objet droit à l'écran) ; `ang.objet` le tourne. `deuxMains` : la main arrière se pose d'elle-même sur la seconde prise (doigts par-dessus) ; `deuxK` 0..1 l'y amène progressivement.
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `t` (animations internes : marche, non, sueur, pluie d'amandes, montre).
- **Repos** (angles non donnés) : bras pendants le long du corps, mains un peu devant la cuisse, coudes légèrement pliés vers l'avant (`armF_up −0,06, armF_lo −0,12, armB_up −0,2, armB_lo −0,18` : le bras arrière pend un peu en avant, y compris quand la main avant tient un objet). Tous les gestes gardent les deux mains DEVANT le personnage : aucun avant-bras vers le dos.
- `marche` 0..1 (pas sur place : la scène déplace x) ; `assis` 0..1 + `siege` (y écran du dessus du siège ; défaut `y − 112·s` = le banc `PBR.banc` posé au même x, y, s) : bassin posé, pieds à plat au sol devant.
- `ang.legF` / `ang.legB` acceptés (= cuisse) ; pièces des jambes : `legF_up legF_lo piedF`, `legB_up legB_lo piedB` (genou articulé).
- Point nommé de l'objet tenu : `PBR.pt(r, 'nom')` (main arrière : `PBR.pt(r, 'nom', true)`) → `[x, y]` écran. Noms : journal `centre` `haut` ; crayon `pointe` `bout` ; montre `anneau` `cadran` ; plateau `centre` `gateau` ; poche `pointe` ; gateau `centre` `haut` `bas`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `PBR.giffard` (`C.pbrGiffard`) | 0,9 ≈ 455 px (tête nue), 75 px de large | `moustache` (guidon), `lavalliere`, `crayonOreille` (caché quand il tient le crayon) | `brandir` (met `tenu:'journal'` déplié, bras levé ; bouche `face.mouth:'o'` à ajouter pour « crier ») ; `tracer` + `cible` [x,y] écran (la **pointe** du crayon va sur la cible ; défaut devant à hauteur de poitrine) ; `salut` (main ouverte levée, sourire) ; `ecrire` + `cible` (défaut : sur les genoux), à combiner avec `assis:1` (+ `siege` pour une chaise) — la pointe gratte avec `t` ; `montre` (montre ouverte tenue devant la poitrine, cadran tourné vers lui, tête baissée, chaîne dorée tirée jusqu'au gilet) ; `cercle` 0..1 = position sur un tour complet (la main décrit un grand cercle devant lui ; enveloppe d'entrée/sortie incluse ; `cercleK` l'atténue) ; `marche` |
| `PBR.durand` (`C.pbrDurand`) | 0,9 ≈ 567 px avec la toque (tête ≈ 455), 95 px de large | `toque`, `tablier`, `noeud`, `moustache` | `presente` (met `tenu:'plateau'` avec gâteau `tenuO.gateau` 'amandes' par défaut ; plateau devant le ventre, deux mains **paumes dessous**) ; `presse` + `cible` écran (point où tombe la crème) + `sort` 0..1 (crème qui sort) : poche à douille pointe en bas 10 px au-dessus de la cible, main arrière sur le haut de la poche ; `saupoudre` + `cible` + `ouvre` 0..1 (≤ 0,5 : pincée d'amandes dans le poing ; > 0,5 : main ouverte, pluie d'amandes jusqu'au y de la cible, animée par `t`) ; `non` (tête qui hoche + main ouverte qui balaie, avec `t`) ; `accepte` (main avant sur le cœur, coude devant, bras arrière pendant + petite révérence) ; `fier` (**remplace le « poing sur la hanche », illisible et à l'envers de profil** : les DEUX mains jointes devant le tablier — main arrière posée sur la main avant, doigts par-dessus —, buste bombé, menton levé, sourire ; le nœud du tablier est plaqué dans le dos et ne dépasse plus) ; `debout` (met `tenu:'gateau'` vue debout : l'anneau dressé devant lui comme une roue, main avant posée sur le haut de l'anneau, main arrière sur le bord proche vers 8 h ; centre de l'anneau ≈ 108 px devant son axe, haut à hauteur d'épaule, visage dégagé) ; `couronne` 0..1 + `cible` = sommet de la tête de l'autre (écran) : 0 → 0,5 lève l'anneau à plat au-dessus de la cible, 0,5 → 1 le descend autour du cou ; `marche` |
| `PBR.terront` (`C.pbrTerront`) | 0,9 ≈ 460 px (casquette), 65 px de large | `casquette` (noire, bande dorée), `moustache`, `barbe`, `collierB`/`collierF` | `barbe` 0..1 (longue barbe grise : 0 rien, 1 jusqu'à la ceinture) ; `sueur` 0..1 (gouttes qui glissent sur le front, avec `t`) ; `fatigue` (dos voûté, yeux mi-clos, bouche ouverte) ; `dort` (yeux fermés, tête tombée, respiration avec `t` ; avec `assis:1` sur le banc) ; `victoire` (bras avant levé, poing, menton levé) ; `essuie` (avant-bras sur le front) ; `ventre` (main qui tapote le ventre, avec `t`) ; `croque` 0..1 **défini = geste actif** : le gâteau debout tenu à deux mains, la bouche contre le bord du haut, la valeur = taille de la bouchée manquante (0 = juste avant la bouchée) ; `porte` 0..1 (1 par défaut) amène le gâteau de devant le ventre jusqu'à la bouche ; `collier` (le paris-brest autour du cou, posé sur les épaules, moitié arrière derrière le cou) ; `tientGuidon` 0..1 (à l'arrêt ou en marchant à côté de son vélo, main avant sur la poignée du guidon devant lui, bras arrière pendant ; l'enveloppe dessine elle-même le vélo DERRIÈRE lui, même `dir`, pédalier à `x + veloDx·s·dir` (`veloDx` local, défaut 10 → +9 px) : la roue avant est donc devant lui (centre à `x + 189·dir` px), la roue arrière derrière (`x − 140·dir`) ; `phase`/`roue` font tourner pédalier et roues ; `o.velo:false` pour ne pas dessiner le vélo) ; `assis`, `marche` |
| `PBR.coureurVelo` (`C.pbrCoureurVelo`) | 0,9 : ≈ 475 px de haut, 550 px de long | vélo complet (pièces `veloFond`, `velo`, `veloAvant`) | `(x,y)` = sol sous le pédalier ; `phase` (tours de pédalier : jambes calées sur les pédales, roues qui tournent) ; `roue` (rad, défaut `phase·2π·2,4`) ; `victoire` (bras avant levé, l'autre main au guidon) ; `sueur`, `fatigue`, `barbe` ; `dir` ±1 dans `o`. Moyeux à `x ∓ 148` / `x ± 180` px (arrière / avant selon `dir`), `y − 110` |

**`bendSign` de `M.ik`** (vérifié au casting, bras avant et arrière, `dir` 1 et −1, sans alerte « coude à l'envers ») : les trois personnages ont les mêmes bras (épaules `[-2,-146]` / `[-10,-146]`, coude à 96, `handLen` 100).

| Personnage | armF, dir 1 | armF, dir −1 | armB, dir 1 | armB, dir −1 |
|---|---|---|---|---|
| Giffard, Durand, Terront (et coureur à vélo) | 1 | 1 | 1 | 1 |

Tous les gestes (et `coureurVelo` : coude plié vers le bas et l'arrière, avant-bras vers l'avant jusqu'au guidon) passent par une IK qui plie toujours le coude dans le sens anatomique (`armX_lo` ≤ 0). Casting rejoué avec le contrôle durci : aucune alerte « au-dessus », « vers l'arrière » ni « main derrière » sur le repos et les gestes, dans les deux sens. En angles bruts : jamais `armX_lo` > 0 (alerte « vers l'arrière »), jamais un bras rejeté en arrière avec l'avant-bras plié (`armF_up` > 0,5 et `armF_lo` < −1 : alerte « au-dessus ») ; une main ne va jamais derrière le dos (retenir la selle derrière soi : utiliser `tientGuidon`).

Pièges :
- `croque` : prise `'bouche'` (main avant vers 4 h, main arrière vers 7 h, sous l'anneau). `croque: 0` met déjà le gâteau à la bouche ; laisser `croque` absent (`undefined`) quand il ne mange pas. L'anneau couvre son buste, le visage reste visible au-dessus du bord.
- `debout` (Durand) : l'anneau occupe ≈ 220 px DEVANT lui (de son ventre jusqu'à ≈ 220 px en avant, bas vers les genoux) : garder cette place libre. Prises du gâteau tenu (`tenuO.prise`) : défaut `'roue'` (haut + 8 h), `'bouche'`, `'bord'` (couronne).
- `couronne` : placer Durand à ≈ 180–200 px de la cible (au-delà, ses bras ne l'atteignent pas : le gâteau reste devant lui). Dessiner Durand, PUIS la marionnette coiffée, PUIS `PBR.gateauAvant(rDurand)` (redessine la moitié avant de l'anneau par-dessus sa tête). À `couronne` 1, passer au coureur `collier:1` et Durand `tenu:'rien'` (non testé en mouvement : à vérifier en gros plan).
- `presente` : le plateau (252 px) déborde devant le ventre ; garder 260 px libres devant Durand.
- La pluie d'amandes et la chaîne de montre sont dessinées après la marionnette (pas d'ombre portée).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à 0,9 | Options |
|---|---|---|---|
| `PBR.gateau(x,y,s,o)` | bas de l'objet (bord de l'anneau debout ; dessous à plat) | **diamètre 220 px** (= roue du vélo) ; à plat 220 × 120 | `vue` 'debout' (défaut, se lit comme une roue) \| 'plat' ; `incl` 0..1 (bascule continue debout → plat) ; `etat` 'choux' (couronne nue) \| 'creme' \| 'amandes' (complet, défaut) ; `croque` 0..1 + `croqueA` (rad, position de la bouchée ; défaut −π/2 = en haut) |
| `PBR.plateau(x,y,s,o)` | dessous du plateau | 252 × 90 px (gâteau posé : +80 px au-dessus) | `gateau` 'amandes' \| 'creme' \| 'choux' \| absent ; `croque` |
| `PBR.journal(x,y,s,o)` | bas, milieu | plié 171 × 117 ; déplié 225 × 306 | `etat` 'plie' (défaut : moitié haute de la une, gravure du cycliste) \| 'deplie' |
| `PBR.journalVole(t,x,y,s,o)` | centre de la feuille dépliée | 225 × 306 | feuille qui ondule ; `rot`, `ondule` 0..1, `dir`, `cast:false` |
| `PBR.crayon(x,y,s,o)` | dessous | 158 × 13 px | (tenu : prise près de la pointe) |
| `PBR.montre(x,y,s,o)` | bas du boîtier | 60 px de haut (conseillé s 1,4–1,6 seule, `echelle` 1,3 tenue) | `t` (aiguilles) |
| `PBR.poche(x,y,s,o)` | pointe de la douille | 144 px de haut | `sort` 0..1 ; `filet` (longueur du boudin de crème, local) ; `t` |
| `PBR.velo(x,y,s,o)` | sol sous le pédalier | roues 220 px, 550 × 250 px | `phase`, `roue`, `penche` (rad, autour de `(x,y)`), `dir`, `ombre`, `cast` |
| `PBR.banc(x,y,s,o)` | sol au milieu du banc | 270 × 190 px ; assise à `y − 101` px | à dessiner **après `M.drawFloor()`**, avant les marionnettes, avec les mêmes `y` et `s` que le coureur assis |

Dessins bruts réutilisables : `PBR.drawGateau(o)` (repère : centre de l'anneau, R 122 local), `PBR.gravure(x0,y0,w,h)` (gravure du cycliste, pour une vignette ou un autre support), `PBR.drawVelo({th, roue}, 'tout')`. Constantes : `PBR.GATEAU.R` 122, `PBR.VELO` (moyeux `RA [-165,-122]`, `FA [200,-122]`, pédalier `BB [0,-95]`), `PBR.BANC.h` 112.

## Décors (pré-rendus par `PBR.init()`)
| Appel | Pose | Repères utiles (façade posée à x 540 sur `ST.back`) |
|---|---|---|
| `PBR.toile(t, {astre})` | toile de fond : `ctx` plein écran, à appeler en premier | ciel d'ouest pâle, villas et arbres de Maisons-Laffitte (visibles au-dessus de y 560). `astre` 0 = jour (soleil de carton sur fils, x 790, y 470) … 1 = nuit (soleil descendu derrière la façade, lune x 270, y 460, étoiles, ciel bleu nuit) ; `soleilX`, `luneX`. Pour le gag des 71 heures : faire osciller `astre` 0 ↔ 1 |
| `PBR.devanture(t, x, y, o)` | après la toile, avant `M.drawFloor()` ; `y = ST.back` | façade 900 px (x 90–990, haut y 559) ; **vitrine** x 120–480 (vitre), y 755–1245 ; **présentoir** x 300, dessus y 951 (`PBR.devPt(540, ST.back, 'presentoir')`) ; **porte** x 620–800, haut y 795 (seuil `devPt(…,'porte')` = [710, 1395]) ; enseigne dorée y 620–705 (couronne x 540) ; store y 709–799 ; **réverbère** x 940 (lanterne y 789). Options : `porte` 0..1 (le battant s'ouvre vers l'intérieur, charnière à droite) ; `gateau` false (présentoir vide) \| true \| 'amandes' \| 'creme' \| 'choux' (paris-brest à plat, 151 px de large) ; `astre` (assombrit la façade, vitrine et réverbère allumés la nuit) ; `reverbere:false` |
| `PBR.banc(290, FEET, 0.9, {cast})` | après `M.drawFloor()` | **banc** devant la vitrine : x 155–425, siège y 1315 ; coureur assis : `PBR.terront({ assis:1 }, 270, FEET, 0.9, …)` |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'PBR\.' casting/scene.js`). Les plus utiles :
```js
PBR.toile(t, { astre: 0 }); PBR.devanture(t, 540, ST.back, { gateau: true, porte: 0.7 }); M.drawFloor(); PBR.banc(290, FEET, 0.9, { cast });
PBR.terront({ t, assis: 1, dort: 1, barbe: 0.6 }, 270, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
const rD = PBR.durand({ t, debout: 1 }, 290, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });          // le gâteau-roue
PBR.coureurVelo({ t, phase: t * 1.2, sueur: 1 }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });  // pédale vers la droite
PBR.giffard({ t, tracer: 1, cible: [700, 900] }, 420, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });  // pointe du crayon sur la carte
```
