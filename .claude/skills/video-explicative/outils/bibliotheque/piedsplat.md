# persos.md — « Mettre les pieds dans le plat, une histoire de mare » : mode d'emploi de `persos.js`

Espace de noms : `M.plat` (dans `scene.js` : `const PLT = M.plat;`). Dans `S.init` : `PLT.init();` (pré-rendus `PLT.K.table`, `PLT.K.chaise`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (mesurées sur la planche).
Aucun texte ni chiffre nulle part (le livre de Guiraud n'a pas de titre). Rôti SANS visage. Planche : `casting/scene.js` (une page par seconde, voir son en-tête).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `PLT.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce).
Pièces : `armB_up armB_lo objetB doigtsB legB footB legF footF (sac) head (chapeau) torso armF_up armF_lo objet doigts doigtsD`.
Rivets ronds à l'épaule, au coude, à la hanche et à la **cheville** : le pied est une pièce à part (`ang.footF` / `ang.footB`, + = pointe vers le bas). Pliage 0 → 2,4 rad vérifié.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'livre'` | `'baguette'` | `'canne'` ; `tenuO` / `tenuBO` : options de cet objet (`{long}` pour la canne).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tourne.
- Canne tenue droite : sa longueur est **calculée pour que le bout touche le sol** (imposer `tenuO:{long}` / `tenuBO:{long}` sinon).
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (livre : coin haut avant).
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `t` (secoue, gouttes de vase).
- `boue` 0..1 : vase sur les chaussures (motte sous la semelle + taches) ; `coule` 0..1 : gouttes de vase qui tombent du pied **avant** (verticales à l'écran, rythme `t`).
- Point nommé de l'objet tenu : `PLT.pt(r, 'nom', arriere)` → `[x, y]` écran (`livre` : `'haut'`, `'dos'` ; `baguette` : `'pointe'` ; `canne` : `'bout'`). `PLT.semelle(r)` = dessous du pied avant.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `PLT.convive` (`C.pltConvive`) | 0,9 ≈ 460 px | serviette, moustache (peintes) | `pied` (jambe avant levée, semelle à plat, buste un peu en arrière, bras avant levé main ouverte, bras arrière en balancier) ; `piedAng` (angle de `legF` visé, −1,85 défaut ; −1,6 = plus bas) ; `serviette` (main avant ouverte posée sur la serviette) ; `hausse` (haussement : coudes au corps, paumes ouvertes en avant, sourcils `up`, bouche `tight` si `face` ne les donne pas). `boue` vaut 1 par défaut, `coule` = `pied` par défaut |
| `PLT.guiraud` (`C.pltGuiraud`) | 0,9 ≈ 460 px | lunettes, nœud papillon (peints) | `secoue` (non de la tête + main ouverte qui s'agite ; **exige `t`**) ; `explique` (bras avant tendu ; prend la baguette si `tenu` n'est pas donné) ; `livre` (montre le gros livre devant la poitrine ; prend `tenu:'livre'` si la main avant est libre, sinon bras arrière si `tenuB:'livre'`) ; `ajuste` (main avant ouverte aux lunettes, menton un peu levé) |
| `PLT.promeneur` (`C.pltPromeneur`) | 0,9 ≈ 485 px avec le chapeau | `sac` (sac à dos), `chapeau` (feutre olive) | canne **dans la main arrière par défaut** (`tenuB:'canne'`, bras arrière à −0,32 si `ang.armB_up` n'est pas donné) ; `canne` (appui marqué : canne plantée plus en avant, léger penché) ; `leve_pied` (jambe avant levée à −1, botte de vase vers l'avant, il la regarde, sourcils inquiets, `coule` = `leve_pied`) ; `salue_gene` (main avant ouverte au bord du chapeau, tête basse, léger salut, sourcils `worry`, bouche `tight`). `boue` vaut 1 par défaut |

### `bendSign` de `M.ik` (vérifié page 4 de la planche : main sur la cible, aucune ligne « ATTENTION coude »)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| convive (cible : serviette, `r.w('torso', 52, -106)`) | 1 | 1 | 1 | 1 |
| Guiraud (cible : lunettes, `r.w('head', 30, -38)`) | 1 | 1 | 1 | 1 |
| promeneur (cible : bord du chapeau, `r.w('head', 52, -70)`) | 1 | 1 | 1 | 1 |
Bras arrière testé vers un point devant l'épaule (`torso (70,-150)`). Pour le promeneur, passer `tenuB:'rien'` avant un geste du bras arrière (sinon la canne par défaut impose ses angles si `ang.armB_*` manquent).

Pièges :
- `M.ik` : lui passer `C.pltX` et la pose **avant** l'enveloppe, puis donner les angles trouvés dans `ang` de l'enveloppe, avec les options de geste du même bras à 0.
- `pied` lève le bras avant : près de la cloche du rôti on croit qu'il la soulève (bien, si c'est voulu) ; sinon donner `ang.armF_up/armF_lo` + `serviette` ou `hausse`.
- Marche : pas d'aide ; balancer `ang.legF = a, ang.legB = −a` (pieds rigides, `ang.footF` pour les cambrer) et glisser selon la recette de l'API §8.
- Le convive est bordeaux (#7a2e2e) comme impose la fiche : ne pas le mettre à côté du seigneur de `reblochon.js` (rouge proche, mais silhouette chauve, serviette, jambes : pas de confusion sur la planche).
- `secoue`, `coule`, `explique` (petit battement de la baguette) dépendent de `t` : toujours passer `t`.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol, sauf rôti), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `PLT.roti(x,y,s,o)` (0,9) | dessous du plat (poser sur la nappe : `PLT.surTable(xt)`) | plat ≈ 223 px de large ; rôti ≈ 140 × 55 px ; cloche fermée ≈ 115 px de haut | `t` **obligatoire** ; `cloche` 0..1 (0 = couvert ; 1 = soulevée ≈ 180 px plus haut, inclinée vers l'arrière) ; `fil` (`true` : fil de manœuvre noir du bouton jusqu'au haut du cadre dès que la cloche quitte le plat ; `false` si une main la tient : `r.bouton`) ; `sueur` 0..1 (gouttelettes qui perlent et glissent : sur la cloche si `cloche < 0,35`, sinon sur le rôti) ; `tremble` 0..1 (plat qui frémit, rôti qui tressaille, cloche fermée qui cliquette) ; `soupir` 0..1 = **progression** d'un soupir (le rôti gonfle jusqu'à 0,6 ; dès 0,3 un petit nuage de carton s'échappe, de sous la cloche si elle est fermée, monte et s'efface à 1 : animer 0 → 1 en ≈ 1,5 s). Renvoie `r` + `r.bouton` (bouton de la cloche), `r.dessus` (haut du rôti), `r.bord` (bord droit du plat), écran |
| `PLT.livre(x,y,s,o)` (0,9) | bas du livre | ≈ 95 × 135 px | gros in-folio de cuir brun, coins de laiton, signet rouge, couverture nue |
| `PLT.baguette(x,y,s,o)` (0,9) | prise (manche) | ≈ 300 px, monte vers l'avant à 12° | — ; pointe : `PLT.OBJ.baguette.pts.pointe` (local) |
| `PLT.canne(x,y,s,o)` (0,9) | bout ferré (au sol) | `o.long` (local, 200 défaut) + pommeau | canne rustique de noisetier |

## Décors (pré-rendus par `PLT.init()`, échelle 1, origine bas-centre)
| Clé | Pose | Repères utiles |
|---|---|---|
| `PLT.K.table` | `M.flat(PLT.K.table, xt, ST.back, {cast})` | table ronde sur pied à griffes, nappe blanche festonnée jusqu'à ≈ 45 px du sol, ≈ 390 px de large ; dessus à `ST.back − 160` (`PLT.TABLE.dessus`) ; un seul couvert à gauche (verre, assiette, fourchette, couteau) ; plat du rôti : `const [px, py] = PLT.surTable(xt)` → `(xt + 40, ST.back − 158)` |
| `PLT.K.chaise` | `M.flat(PLT.K.chaise, x, ST.back, {cast})` | chaise de bois sombre, assise et dossier de velours bleu ; tournée vers +x (dossier à gauche) ; assise à 150 px (`PLT.CHAISE.siege`), haut du dossier ≈ 345 px |

Mise en place éprouvée (page 9 de la planche) : table à `xt = 650`, chaise à 175, rôti `PLT.roti(px, py, 0.9, {t, cloche:1})`, convive `pied:1` à `x = 505` (dir 1, `FEET`) : sa semelle passe juste au-dessus du rôti. Pour d'autres places : convive à ≈ `px − 185`. Avec `piedAng` plus bas que −1,7, le soulier entre dans le rôti.

## Exemples d'appels qui marchent
Voir `<video>/casting/scene.js` (`grep -n 'PLT\.' casting/scene.js`). Les trois appels les plus utiles :
```js
// convive qui lève le pied au-dessus du plat (salle à manger)
M.flat(PLT.K.table, 650, ST.back, { cast }); const [px, py] = PLT.surTable(650);
PLT.roti(px, py, 0.9, { t, cloche: smooth(1.0, 1.8, t), sueur: 0.6 });
PLT.convive({ t, pied: smooth(t0, t0 + 0.6, t), face: { brow: 'up', mouth: 'o' } }, 505, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// Guiraud qui explique, baguette tendue ; bout de la baguette
const r = PLT.guiraud({ t, explique: 1 }, 420, FEET, 0.9, { dir: 1, slot: ST.slotF, cast }); const bout = PLT.pt(r, 'pointe');
// promeneur gêné, botte de vase levée (canne dans la main arrière par défaut)
PLT.promeneur({ t, leve_pied: smooth(t1, t1 + 0.5, t) }, 640, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
```
