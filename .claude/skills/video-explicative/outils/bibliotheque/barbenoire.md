# persos.md — « Barbe Noire, le pirate qui fumait » : mode d'emploi de `persos.js`

Espace de noms : `M.bn`. Dans `scene.js`, écrire `const BN = M.bn;` dans l'IIFE de `SCENE` (pas de global `BN`). Dans `S.init` : `BN.init()` (aucun pré-rendu : l'appel ne sert qu'à garder la même forme partout).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Planche de référence : `casting/scene.js` (une page par seconde, 0 à 9 s).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `BN.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, gestes). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'sabre'` | `'drapeau'` ; `tenuO` / `tenuBO` : options de l'objet (`drapeau` : `{t}` pour l'ondulation).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` le tourne (rad, à l'écran).
- `mains` 0..1 : mains liées devant le bas-ventre (IK des deux bras), corde nouée aux poignets à partir de 0,6 (les trois modèles et Barbe Noire).
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `t` (fumée, ondulations, tremblement) : **toujours passer `t`**.
- Point nommé de l'objet tenu : `BN.pt(r, 'nom')` → `[x, y]` écran (`sabre` : `'pointe'`, `'garde'` ; `drapeau` : `'haut'`) ; `BN.pt(r, nom, true)` pour la main arrière.
- Pivoter sur place (« il se tourne ») : `o.dir = BN.tourne(u)`, u de 0 (regarde à droite) à 1 (regarde à gauche) : la marionnette s'amincit puis se retourne.
- Angles : `armF_up` −1,57 = bras horizontal devant, −2,5 = au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé ; `legF/legB` négatif = jambe en avant.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `BN.barbeNoire` | 1 : crâne 505 px, tricorne 555, plume 570 | `chapeau` (tricorne noir, galon or), `plume`, `perruque`, `cheveux`, `meches`, `barbe`, `fourreau`, `fumeeM`, `fumeeB`, `liens` | `meches` (défaut **1** : six mèches sortent une à une sous le tricorne, 0 = aucune) ; `fume` (défaut 0 : bouts rougeoyants + fumée des mèches et de la barbe) ; `caresse` (main ouverte qui caresse la barbe, va-et-vient selon `t`) ; `hanches` (poings sur les hanches) ; `reverence` (buste plié, main sur le cœur, bras arrière tendu) ; `coup` (0 repos → 0,5 sabre levé au-dessus de la tête → 1 frappé, bras tendu devant ; met `tenu:'sabre'` d'office) ; `chute` (bascule raide en arrière autour du talon, 1 = à plat sur le plancher ; yeux fermés à ≥ 0,95) ; `perruque` (perruque poudrée qui descend sur le tricorne, 1 = posée) ; `mains` |
| `BN.marin` | 0,88 : crâne 444 px, coiffe ≈ 465 | `coiffe` | `modele` `'a'` (bonnet rouge, chemise blanche, gilet vert sapin) \| `'b'` (chapeau de paille rond, gilet ocre, favoris gris) \| `'c'` (casquette bleu ardoise, vareuse grise à col bleu, barbe de trois jours) ; `leve` (deux mains en l'air, ouvertes) ; `tremble` (sourcils inquiets par défaut) ; `drapeau` (met `tenu:'drapeau'` : chiffon blanc sur bâton, droit ; avec `leve` il est brandi) ; `mains` ; `hanches` (poings aux hanches, coudes en arrière) ; `tate` (se tâte le bras : coude en bas, main qui frotte le haut du bras opposé, va-et-vient selon `t`) |
| `BN.otage` | 0,88 : crâne 444 px, coiffe 455–477 ; grand chapeau du planteur 167 px de large | `coiffe` (perruque / chapeau / bicorne), `jabot`, `tonneau`, `bretelle`, `liens` | `modele` `'conseiller'` (perruque poudrée blanche à rouleaux, habit prune, jabot) \| `'planteur'` (grand chapeau de paille, habit moutarde, bottes) \| `'marchand'` (bicorne brun, habit vert mousse, catogan gris) ; `tonneau` (le tonneau descend d'en haut sur le corps ; au-delà de 0,92 : vêtements ôtés, bras et jambes nus, bretelles, souliers et coiffe gardés) ; `mains` ; `tremble` ; mêmes gestes que les marins : `leve`, `drapeau`, `hanches`, `tate` |

Barbe Noire, détails :
- Barbe : pièce `barbe` (rivet sous le menton), elle **pend toujours à la verticale** (compense `head`, `tilt`, la révérence) ; `ang.barbe` s'ajoute. Bouts des deux nattes : `r.w('barbe', 9, 184)` et `r.w('barbe', -15, 182)` ; milieu : `r.w('barbe', -4, 80)` ; menton : `r.w('barbe', 0, 0)`.
- Mèches : bouts en repère `head` à `[52,-50] [-46,-42] [68,-56] [-64,-52] [38,-62] [-28,-54]` (dans l'ordre d'apparition) : `r.w('head', 52, -50)` = bout de la 1re (pour une étincelle à l'allumage).
- Fumée : la fumée des mèches dérive vers l'avant (mèches de devant) ou vers la nuque (mèches de derrière), celle de la barbe monte derrière la tête : le visage reste libre. `fume` 0,3 = filets légers, 1 = fumée dense. Elle est dessinée à l'écran (pas d'ombre portée).
- Sabre : toujours au côté dans le `fourreau` ; avec `tenu:'sabre'`, la poignée quitte le fourreau et le sabre est au poing.
- Tricorne : `hide: { chapeau: 1, plume: 1, perruque: 1, meches: 1 }` pour l'ôter (les mèches sont sous le bord : les masquer aussi).
- Sourcils froncés par défaut (`face.brow:'frown'`) : passer `brow:'n'` ou `'up'` pour l'adoucir ; `mouth:'smile'` / `'o'` se voient sous la moustache.

Pièges :
- `meches` vaut 1 par défaut : au plan 1, passer `meches: 0` ; `fume` vaut 0 par défaut.
- `chute` : la tige n'est plus dessinée dès que `chute > 0` (à toi de la faire glisser sous le plancher si tu la montres) ; `floorShadow` coupé. Le corps tombe en arrière (côté opposé au regard) : prévoir ≈ 560 px de place derrière lui à s = 1. Pour un rebond, ajouter `M.wob` à `chute` près de 1.
- `coup` pilote seul `armF_up`, `armF_lo` et l'angle du sabre : ne pas les passer en même temps. Une volée de coups : `coup = 0.75 + 0.25 * Math.sin(...)` (entre 0,5 et 1 = alternance levé/frappé ; sous 0,5 le bras redescend au repos).
- `caresse`, `hanches`, `reverence` sont faits par IK sur le bras avant (et arrière pour `hanches`, `reverence`) : ils écrasent les `ang.armF_*` passés.
- Marins et otages : `tremble` et `mains` se combinent ; `leve` + `mains` n'a pas de sens (les mains liées gagnent).
- Marins et otages, **coudes** : l'enveloppe corrige d'office tout coude « à l'envers » (`armX_lo > 0`, p. ex. `M.ik(..., bendSign -1)`) par l'autre solution qui garde la main au même endroit : le coude reste sous la ligne épaule–main, vers l'arrière. Préférer les options de geste aux angles bruts. Angles bruts justes (épaule, coude) : poings aux hanches `armF_up 1.0, armF_lo -1.77` / `armB_up 1.02, armB_lo -1.77` ; se tâter le bras `armF_up 0.15, armF_lo -2.7` (±0,12 pour le va-et-vient) ; mains en l'air `armF_up -2.75, armF_lo -0.25` / `armB_up -2.5, armB_lo -0.4`. Avec `M.ik`, préférer `bendSign = 1` (le garde-fou corrige de toute façon).
- Otage en tonneau : la perruque reste sur la tête ; pour la donner à Barbe Noire, `hide: { coiffe: 1 }` sur le conseiller (crâne dégarni, cheveux gris derrière) et `perruque: 1` sur Barbe Noire.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `BN.coffreOr(x,y,s,o)` (1) | milieu du fond | caisse 200 × 112, couvercle bombé 66 : 200 × 178 fermé ; ouvert, le couvercle bascule en haut à gauche (charnière `BN.COFFRE.couvercle = [-100,-112]` local) ; pièces renversées jusqu'à x + 150 | `ouvre` 0..1 (1 ≈ 110°) ; `or` 0..1 (défaut 1 : tas de pièces, rubis, émeraude ; > 0,55 : collier de perles et pièces qui débordent et coulent devant, à droite) ; `t` (éclats qui scintillent). Bois brun cerclé de laiton : rien de commun avec la caisse à médicaments blanc cassé. `dir:-1` met la charnière à droite. |
| `BN.tete(x,y,s,o)` (0,9) | haut de la corde (point d'attache au beaupré) | tête + barbe ≈ 260 px ; avec la corde par défaut ≈ 320 px | `corde` (longueur locale, 70) ; `rot` (balancement, rad, autour de `(x,y)` ; la barbe pend toujours) ; `fume` (défaut 1) ; `meches` (défaut 1) ; `t` ; `dir`. Yeux fermés (traits), cheveux noirs noués, aucune coupe visible (la barbe cache le cou). |
| `BN.fumee(x,y,s,t,o)` (1) | source de la fumée | colonne ≈ 210 px, bouffées jusqu'à 31 px de rayon | **dessine dans le repère courant** (à l'écran en général) ; `k` intensité 0..1 ; `n` bouffées (7) ; `h` hauteur locale (190) ; `w` largeur (1) ; `vent` dérive horizontale en px locaux en haut de colonne (+ = droite) ; `seed` (décale le rythme : deux colonnes voisines ⇒ seeds différents) ; `fil:false` sans filet à la source. Pas d'ombre portée. |
| `BN.sabre(x,y,s,o)` (1) | bas du pommeau, lame vers le haut | 200 px | sabre de carton (lame acier pâle, garde laiton) ; `rot` pour le faire tomber / poser à plat (`rot: ±π/2`) |
| `BN.drapeau(x,y,s,o)` (0,88) | bas du bâton | 108 px | chiffon blanc qui ondule (`t`) |

## Décors
Aucun dans `persos.js` (pont, mer, navires, canon, caisse à médicaments, chaloupe : propres aux plans, ou `decors/pN.js`).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'BN\.' casting/scene.js`). Les plus utiles :
```js
// Barbe Noire caresse sa barbe qui fume (plan 1, 9,44 s) : pas de mèches
const fu = M.smooth(9.44, 9.8, t);
BN.barbeNoire({ t, meches: 0, fume: fu, caresse: M.smooth(9.3, 9.6, t) }, 520, FEET, 1, { dir: 1, slot: ST.slotF, cast });
// mèches qui sortent une à une, puis s'allument et fument (plan 2)
BN.barbeNoire({ t, meches: M.smooth(3.07, 3.6, t), fume: M.smooth(4.91, 5.3, t), hanches: 1 }, 600, FEET, 1, { dir: -1, slot: ST.slotF, cast });
// duel (plan 6) : coups en rythme, puis chute à plat
BN.barbeNoire({ t, coup: 0.75 + 0.25 * Math.sin(t * 14), tenu: 'sabre' }, 640, FEET, 1, { dir: -1, slot: ST.slotF, cast });
BN.barbeNoire({ t, chute: M.clamp((t - 5.3) / 0.45), tenu: 'sabre' }, 640, FEET, 1, { dir: -1, slot: ST.slotF, cast });
// marin qui tremble, mains en l'air, chiffon blanc
BN.marin({ t, modele: 'b', leve: 1, drapeau: 1, tremble: 0.6 }, 300, FEETB, 0.88, { dir: 1, slot: ST.slotB, cast });
// otages : conseiller mains liées ; planteur en tonneau
BN.otage({ t, modele: 'conseiller', mains: 1 }, 760, FEET, 0.88, { dir: -1, slot: ST.slotF, cast });
BN.otage({ t, modele: 'planteur', tonneau: M.smooth(7.18, 7.6, t) }, 860, FEET, 0.88, { dir: -1, slot: ST.slotF, cast });
// coffre qui s'ouvre et déborde ; tête pendue qui fume en se balançant
BN.coffreOr(540, ST.back + 10, 1, { ouvre: M.smooth(5.6, 6.0, t), or: 1, t, cast });
BN.tete(bx, by, 0.9, { t, fume: 1, corde: 90, rot: 0.12 * Math.sin(t * 1.8) });
```
