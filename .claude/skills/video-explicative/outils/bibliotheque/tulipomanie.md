# persos.md — « La tulipomanie, la fleur plus chère qu'une maison » : mode d'emploi de `persos.js`

Espace de noms : `M.tul` (dans `scene.js` : `const TUL = M.tul;` dans l'IIFE de `SCENE`). Dans `S.init` : `TUL.init()` (aucun pré-rendu ; les décors sont dans `decors/pN.js` ou `scene.js` des plans).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (mesurées sur la planche `casting/`).
Planche : `casting/scene.js` (page = seconde : 0 repos/marche, 1–2 gestes du marchand dir 1/−1, 3 L'Écluse, 4 acheteurs, 5 bras, 6 comparaisons, 7 bulbe/oignon/tulipes, 8 florins/contrat/coffret/bourse, 9 prises en gros plan, 9,97 groupe).

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `TUL.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`) : elle prépare la pose (gestes par `M.ik`, objet tenu, seconde main) et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'bulbe'` | `'oignon'` | `'tulipe'` | `'coffret'` | `'contrat'` | `'bourse'` | `'pile'` | `'transplantoir'` (outil de L'Écluse, tenu seulement). `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'accessoire seul) + `echelle` (taille dans la main, défaut 1 ; contrat 0,85).
- `droit` / `droitB` : `true` d'office quand un objet est tenu (il reste droit à l'écran, même penché ou à genoux) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent (rad).
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise : **contrat** (bord gauche ; mis d'office avec `tenu:'contrat'`) et **coffret** (bord avant du couvercle : la main suit le couvercle quand il s'ouvre).
- Geste libre : `atteint` 0..1 + `cible` `[X,Y]` écran → le poing (ou le point `ptCible` de l'objet tenu, défaut `'centre'`) va sur la cible ; `bras:'B'` = main arrière.
- `handF` / `handB` : `'fist'` | `'open'` | `'paume'` (main relevée au poignet, paume vers l'avant) ; `face` : `{ brow, mouth, eyes }` ; `t` : **toujours le passer** (marche, enchère, planter).
- `marche` 0..1 (marchand, acheteur : jambes et bras arrière balancés selon `t`). Tous les gestes sont des réglages 0..1 lissés par `ease` : les faire varier avec `smooth(t0, t1, t)`.
- Point nommé de l'objet tenu : `TUL.pt(r, 'nom')` (main arrière : `TUL.pt(r, 'nom', true)`) → `[x, y]` écran. Points : bulbe `centre` `pointe` `base` ; oignon `centre` `pointe` `base` ; tulipe `fleur` `centre` `base` ; coffret `centre` `bulbe` `couvercle` `base` ; contrat `centre` `cachet` `haut` `base` ; bourse `centre` `bouche` `base` ; pile `haut` `base` ; transplantoir `pointe` `centre`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `TUL.marchand` (`C.tulMarchand`) | 0,9 ≈ 519 px avec le chapeau (467 sans), 150 de large au bord du chapeau, corps ≈ 100 | `chapeau` (feutre noir), `fraise`, `moustache`, `barbiche` | `brandir` (objet tenu devant lui à hauteur de poitrine, coude plié vers le bas) ; `presente` (objet devant la poitrine ; 1 d'office avec le contrat, tenu à deux mains) ; `joie` (bras levés en V, mains ouvertes, menton levé, sourire) ; `depit` (bras écartés vers le bas, mains ouvertes, tête basse) ; `chapeau` (le chapeau se soulève de ≈ 41 px à 0,9) ; `machoire` (mâchoire tombante : bouche ouverte, barbiche qui descend, yeux ronds) ; `marche` |
| `TUL.ecluse` (`C.tulEcluse`) | 0,9 ≈ 468 px debout, ≈ 90 de large ; **à genoux** ≈ 270 px de haut, 255 de long avec le transplantoir | `jupe` (racine : robe sous la taille), `souliers`, `col` (fourrure), `fraise`, `barbe` ; pas de jambes, pas de couvre-chef | `genou` (à genoux, buste penché vers la plate-bande ; seul = mains sur les cuisses) ; `planter` (avec `genou` : main avant au sol, `tenu:'transplantoir'` d'office, lame qui creuse selon `t` ; main arrière sur la cuisse) ; `repousse` (bras tendu à hauteur de poitrine, coude un peu plié, main `'paume'`, sourcils froncés) ; `joues` (mains sur les joues, bouche 'o', yeux ronds) ; `regarde` (tête baissée vers le sol, paupières mi-closes) |
| `TUL.acheteur` (`C.tulAcheteur`) | 0,85 ≈ 493 px avec la plume (≈ 440 sans chapeau), 130 de large au chapeau | `chapeau` (bord relevé derrière + plume blanche), `col`, `revB`/`revF` (revers des bottes) | `tend` (bras tendu devant, à hauteur de poitrine : avec `tenu:'bourse'`, il tend sa bourse) ; `encherit` (main levée au-dessus de l'épaule, poing ou bourse, bouche 'o' ; la main monte et descend selon `t`, `secoue: 0` pour l'arrêter) ; `marche` |
| `TUL.acheteuse` (`C.tulAcheteuse`) | 0,85 ≈ 443 px avec la coiffe, 115 de large en bas de la robe | `coiffe`, `col`, `soulier` ; robe longue, pas de jambes | `tend`, `encherit` (comme l'acheteur) ; `penche` (buste penché en avant ≈ 10°, tête avancée, yeux ronds : curiosité) |

### `bendSign` de `M.ik` (vérifié sur les pages 1 à 5 et 9, dir 1 et −1 : aucune ligne « ATTENTION coude »)
| Personnage, geste | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| marchand `brandir`, `presente`, contrat/coffret à deux mains, `atteint` | 1 | 1 | 1 | 1 |
| marchand `joie` (V) | 1 | 1 | **−1** | **−1** |
| marchand `depit`, `chapeau`, `machoire` (angles directs, pas d'IK) | — | — | — | — |
| L'Écluse `genou`, `planter`, `repousse`, `joues`, `atteint` | 1 | 1 | 1 | 1 |
| acheteur / acheteuse `tend`, `encherit`, `atteint` | 1 | 1 | 1 | 1 |
Aussi dans `TUL.BEND` (`TUL.BEND.marchand.joie.armB === -1`). Les enveloppes l'appliquent d'elles-mêmes. Pour un `M.ik` à la main : `M.ik(C.tulMarchand, pose, x, y, s, dir, 'armF', [X, Y], 1)` avec la pose **préparée** (`TUL.marchandPose(pose, x, y, s, dir)`) et les mêmes `x, y, s, dir` que l'appel. Pour L'Écluse, le torse est enfant de la `jupe` : passer par `TUL.eclusePose`.
Angles : `armF_up` −1,57 = bras horizontal devant, −2,5 = au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé ; `torso` (L'Écluse seulement) positif = buste penché en avant. Bras et coudes ronds testés de 0 à −2,4 rad (page 5).

Pièges :
- Main arrière (`…B`) : elle passe **derrière** le corps ; avec `deuxMains` sur le coffret, seuls les doigts arrière se voient sur le bord du couvercle (le bras est caché par le torse) : c'est voulu.
- Bulbe qui porte un mot-clé : `tenu:'bulbe', tenuO:{ echelle: 1.3 }` (≈ 122 px de haut à s 0,9) ; plus gros, il dépasse la tête.
- `chapeau` lève le feutre : le marchand a des cheveux blond-roux dessous (pas chauve). Le chapeau monte jusqu'à ≈ 560 px au-dessus des pieds à 0,9 : garder de la place sous le lambrequin.
- L'Écluse à genoux : `(x,y)` reste le point au sol ; il s'étend de −80 px (talons) à +170 px (transplantoir) autour de `x` (dir 1). Ses mains se posent sur ses cuisses dès `genou` > 0 tant que `planter` est à 0 (un `ang.armF_*` donné est alors remplacé).
- `repousse` met `handF:'paume'` (passer `handF` après coup n'y change rien) ; tenu un objet, la main reste en poing.
- `encherit` sans `tenu` : poing fermé (jamais de doigt tendu). Avec `tenu:'bourse'`, la bourse pend sous le poing, au-dessus du chapeau.
- Le contrat tenu (`presente` 1) couvre le pourpoint du cou à la taille : pour dégager le marchand, le plier (`tenuO:{ plie: 1 }`, non vérifié en main) ou poser l'accessoire seul `TUL.contrat` sur la table.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol). Échelle conseillée 1 sauf mention. Tailles locales = px à l'échelle 1.

| Fonction | `(x,y)` = | Taille | Options |
|---|---|---|---|
| `TUL.tulipe(x,y,s,o)` | pied de la tige (sol) | 162 de haut, 80 de large (feuilles) ; fleur ≈ 50 × 40 | `couleur` `'flammee'` (défaut : ivoire striée de flammes rouge sang) \| `'rouge'` \| `'jaune'` \| `'rose'` \| `'violet'` \| `'blanc'` \| `'orange'` (liste : `TUL.COULEURS`) ; `pousse` 0..1 (0 rien, 0,1 pointe verte, 0,3 feuilles, 0,5 bouton, 1 fleur entière) ; `ouverte` 0..1 (défaut 0,35 : coupe ; 1 = pétales écartés) ; `balance` (rad, inclinaison de la tige et de la fleur ; ex. `0.08*Math.sin(t*2)`) |
| `TUL.bulbe(x,y,s,o)` | bas du bulbe (plateau, racines dessous) | 104 + 16 de racines, 74 de large ; **mot-clé : s 1,2 (≈ 145 px)** | `terre` (vue en coupe : bloc de terre 300 × 200 sous le sol, bulbe dedans avec un germe ; `(x,y)` = **surface du sol** au milieu) + `neige` 0..1 (couche de neige dessus) ; `fil` (px locaux) : suspendu, **`(x,y)` = point d'attache en haut**, + `balance` (rad, pendule autour de l'attache) ; `filet` (true = 5, ou 1..6 bulbes dans un filet ; haut du nœud 200 au-dessus du bas, avec `fil` : `(x,y)` = attache) |
| `TUL.oignon(x,y,s,o)` | bas de l'oignon | 86 + queue sèche = 120 de haut, 86 de large : même silhouette que le bulbe mais **plus rond**, cuivré-violacé mat, queue sèche torsadée, barbe de racines grises | `fil` + `balance` (comme le bulbe : `(x,y)` = attache) ; `filet` (1..6 oignons) |
| `TUL.coffret(x,y,s,o)` | bas du devant, au milieu | 128 × 80 fermé (≈ 165 × 104 à s 1,3) ; ouvert, le couvercle monte à ≈ 130 au-dessus du bas | `ouvert` 0..1 (le couvercle pivote sur la charnière arrière, 1 ≈ 112° : on voit son velours bleu nuit ; au-delà de 0,54 il passe derrière le bulbe) ; `bulbe` (true par défaut ; visible dès que le couvercle s'entrouvre) |
| `TUL.contrat(x,y,s,o)` | bas de la feuille, au milieu (suit le pliage) | 150 × 196 ; plié 150 × 66 | `plie` 0..1 (0,5 = tiers du bas replié ; 1 = lettre pliée en trois, cachet de cire dessus) ; lignes ondulées sans lettre, paraphe en boucles, cachet rouge à rubans |
| `TUL.bourse(x,y,s,o)` | fond de la bourse | 80 de haut, 90 de large avec les glands | `pleine` 0..1 (défaut 1 ; 0 = plate) ; `fil` + `balance` (suspendue aux cintres : `(x,y)` = attache, ex. plan 2 « vendre ») |
| `TUL.pile(x,y,s,o)` | dessus de la table sous la pile | `n` × 4,4 + 11 de haut (n 30 ≈ 143), 34 de large ; écroulée : pièces étalées sur ±170 | `n` (défaut 10) ; `ecroule` 0..1 (les pièces du haut tombent d'abord, roulent debout puis se couchent à plat sur la table ; 1 = toutes à plat) |
Les objets ont les mêmes options quand ils sont tenus (`tenuO`). Tenus, ils se prennent : bulbe et oignon par le bas du corps (le bulbe repose sur le poing, pointe en haut), coffret par le bas du devant (le coffret repose sur le poing), contrat par le bord droit (seconde main au bord gauche, doigts devant la feuille), bourse par la fronce du col, tulipe par la tige, transplantoir par le manche (lame vers le bas).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'TUL\.' casting/scene.js`). Les plus utiles :
```js
// le marchand brandit le coffret ouvert, bulbe dedans (plans 1, 6)
TUL.marchand({ t, tenu: 'coffret', tenuO: { ouvert: smooth(2.0, 2.6, t) }, brandir: 1 }, 420, FEET, 0.9, { dir: 1, cast });
// il ouvre le couvercle de la main arrière (la main suit le couvercle)
TUL.marchand({ t, tenu: 'coffret', tenuO: { ouvert: k }, presente: 1, deuxMains: true }, 420, FEET, 0.9, { dir: 1, cast });
// le contrat tenu à deux mains (plans 4, 5) ; joie puis dépit
TUL.marchand({ t, tenu: 'contrat' }, 400, FEET, 0.9, { dir: 1, cast });
TUL.marchand({ t, joie: smooth(3, 3.4, t), machoire: 0 }, 400, FEET, 0.9, { dir: 1, cast });
// L'Écluse à genoux qui plante, puis qui repousse la bourse (plans 2, 3)
TUL.ecluse({ t, genou: 1, planter: 1 }, 260, FEET, 0.9, { dir: 1, cast });
TUL.ecluse({ t, repousse: smooth(5, 5.4, t) }, 300, FEET, 0.9, { dir: 1, cast });
// l'acheteur enchérit, l'acheteuse tend sa bourse en se penchant
TUL.acheteur({ t, tenu: 'bourse', encherit: 1 }, 700, FEET, 0.85, { dir: -1, cast });
TUL.acheteuse({ t, tenu: 'bourse', tend: 1, penche: 0.5 }, 880, FEET, 0.85, { dir: -1, cast });
// bourse au bout d'un fil des cintres ; oignon qui descend ; bulbe sous la neige (vignette)
TUL.bourse(540, 0, 1.2, { fil: 700 + 40 * Math.sin(t * 2), balance: 0.25 * Math.sin(t * 2.2) });
TUL.oignon(560, 0, 1.4, { fil: lerp(0, 520, ease(u)), balance: 0.06 * Math.sin(t * 1.5) });
TUL.bulbe(540, 1200, 1, { terre: 1, neige: 1 });
```
