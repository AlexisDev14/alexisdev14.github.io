# persos.md — « L'autruche qui avalait la clé de son enclos » : mode d'emploi de `persos.js`

Espace de noms : `M.aut` (dans `scene.js` : `const AUT = M.aut;`). Dans `S.init` : `AUT.init()` (pré-rendus `AUT.K` : `ciel`, `arbre`, `cloture`, `porte`, `sol`, `labo`, `table`, `lampe`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (calculées sur la géométrie, vérifiées sur la planche `casting`).
Planche de référence : `casting/scene.js` (une page par seconde : 0 enclos, 1 labo, 2 autruche, 3 gardien, 4 chercheur, 5 gestes M.ik, 6 balayage des bras, 7 objets + gros plans de têtes, 8 comparaisons, 9 téléphone).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `AUT.nom(pose, x, y, s, o)` : elle prépare la pose. Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce ; `r.pose` = pose finale).

### `AUT.autruche(pose, x, y, s, o)` — `C.autAutruche` (0,94 ≈ 650 px de haut cou compris, ≈ 365 px de large ; défaut s = 1 ≈ 690 px)
Sans bras. Pièces : `queue legB legB_lo piedB aileB torso legF legF_lo piedF aile cou1 cou2 cou3 bec head`.
| Option | Valeurs | Effet |
|---|---|---|
| `expr` | `'innocente'` (défaut) \| `'genee'` \| `'fiere'` \| `'siffle'` | œil (paupière, regard), joue rose (`genee`), tête/cou (`genee` rentre le cou, `fiere` l'étire, menton levé), bec entrouvert (`siffle`) |
| `avale` | 0..1 | bosse qui descend le cou : 0,05 = sous la tête, 0,5 = mi-cou, 0,93 = base ; invisible à 0 et 1 |
| `ventre` | 0..1 | fenêtre translucide sur le ventre, l'aile se soulève ; `ventreObj` `'cle'` (défaut) \| `'objets'` \| `'tout'` ; `ventreLueur` 0..1 (halo de la clé) |
| `bec` | 0..1 | ouvre le bec (mandibule `bec`) |
| `picore` | 0..1 | cou plongé, bec au sol devant les pattes (corps penché 0,25 rad) |
| `rentre` / `etire` | 0..1 | cou en S rentré / cou tendu (remplacent la valeur de `expr`) |
| `pas` | nombre (tours) | marche : un tour = deux pas ; `foulee` (1) ; le `x` se fait dans la scène (vitesse non mesurée : la régler à l'œil pour que le pied d'appui ne glisse pas) |
| `ailes` | 0..1 | ailes soulevées ; `bat` (nombre, tours) = battement |
| `regard` | `[rx, ry]` −1..1 | pupille (prioritaire sur `expr`) ; `cligne` 0..1 |
| `sol` | `false` | désactive le recalage automatique (la patte la plus basse touche toujours le sol) |
| `ang` | `cou1 cou2 cou3 head bec aile aileB queue legF legF_lo legB legB_lo` | ajoutés aux réglages ; `legX` > 0 = patte vers l'arrière ; `aile` > 0 = soulève |
Points utiles : bout du bec `r.w('head', 86, -16)`, œil `r.w('head', 8, -29)`, centre du ventre `r.w('torso', 20, -18)`, base du cou `r.w('cou1', 0, 0)`.

### Humains — options communes (`AUT.gardien`, `AUT.chercheur`)
- `tenu` / `tenuB` : objet dans la main avant / arrière (`'rien'` \| `'toise'` \| `'journal'` \| `'pince'` \| `'cle'` \| un nom de `AUT.OBJETS`) ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent (> 0 = sens horaire, pointe vers le bas).
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (seul `journal` en a une).
- `atteint` 0..1 + `cible` `[X, Y]` **écran** (+ `bras: 'B'` pour la main arrière) : la main va sur la cible par `M.ik` (bendSign ci-dessous). Ex. tâter la clé puis retirer la main : `atteint` 1 → 0.
- `pas` (tours) + `foulee` : marche sur place (jambes, bras, rebond) ; `handF` / `handB` `'fist'`\|`'open'` ; `face` `{ brow, mouth, eyes }` ; `t`.
- Point nommé de l'objet tenu : `AUT.pt(r, 'nom')` (ou `AUT.pt(r, 'nom', true)` main arrière) → `[x, y]` écran : toise `haut`/`bas`, journal `centre`/`haut`, pince `bout`/`charniere`, clé `bout`/`panneton`/`anneau`/`milieu`, objets `centre`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1) |
|---|---|---|---|
| `AUT.gardien` (`C.autGardien`) | 0,9 ≈ 455 px (≈ 505 avec le pompon) | `nez`, `bonnet`, `pompon`, `trousseau` (3 petites clés à la hanche, se balance avec `pas`) | `presente` (toise tenue devant lui, pied au sol : **1 par défaut avec `tenu:'toise'`**, passer `0` pour régler le bras soi-même) ; `leve` (bras levé, toise soulevée, menton levé) ; `lire` (journal devant le visage ; met `deuxMains` d'office au-delà de 0,5) |
| `AUT.chercheur` (`C.autChercheur`) | 0,9 ≈ 460 px | (pince-nez, nœud papillon, tablier, gants peints) | **`tenu:'pince'` par défaut** ; `plonge` (main avant à hauteur d'épaule, pince pointée vers l'avant-bas, buste penché ; « ressortir » = `plonge` qui redescend à 0) ; `brandir` (bras levé : armF_up −2,05, armF_lo −0,8) |

**bendSign de `M.ik`** (vérifié page 5 de la planche : main sur la croix, coude en bas, aucune ligne « ATTENTION ») — aussi dans `AUT.BEND` :
| Personnage | bras avant `armF`, dir 1 | `armF`, dir −1 | bras arrière `armB`, dir 1 | `armB`, dir −1 |
|---|---|---|---|---|
| gardien | 1 | 1 | 1 | 1 |
| chercheur | 1 | 1 | 1 | 1 |
Cibles testées (unités du perso, x vers l'avant, y vers le haut depuis les pieds) : toise levée (60, 560), journal devant le visage (96, 350), main tendue (150, 300) ; pince vers l'avant-bas (150, 170), ressort (120, 300), brandir (40, 570), tâter la clé (130, 260) ; bras arrière (110–120, 260–330).

Pièges :
- Gardien avec la toise sans `presente` : la perche (720 de long) passe devant son visage. `leve` envoie le haut de la toise hors cadre : réduire `tenuO.long` ou ne lever qu'à 0,5.
- `plonge` est réglé pour la composition de la planche (page 1) : chercheur en `FEETB` à x, cuve à x + 200 (s 0,8) sur `AUT.TABLE` ; la table, posée **après** le chercheur, cache le bout de la pince. Ailleurs, viser avec `atteint`/`cible` et `ang.objet`.
- `AUT.autruche` n'a pas de `tenu` (pas de mains) ; ne pas utiliser `M.ik` dessus. Les tests de coude ne la concernent pas (`handLen` 0).
- La bosse d'avalement traverse les rivets du cou : petite couture visible au passage d'un segment à l'autre (normal, papier découpé).
- `pas` de l'autruche : grandes enjambées ; à `foulee` 1 le pied levé monte haut. Pour trottiner : `foulee` 0,6 et `pas` ≈ 2,5·t.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Échelle conseillée 0,9 (même taille que tenu en main).

| Fonction | `(x,y)` = | Taille à 0,9 | Options |
|---|---|---|---|
| `AUT.cle(x,y,s,o)` | milieu de la clé | 184 px (verticale, anneau en trèfle en bas, panneton en haut) | `lueur` 0..1 (halo doré + éclat), `chaud` 0..1 (rougit + vapeur, `o.t`) ; couchée : `rot: ±1.57` |
| `AUT.obj(nom,x,y,s,o)` | centre | clou 103, boulon 90, cuillère 112, pièce Ø 76, boucle 83 × 65, rondelle Ø 76 | `nom` ∈ `AUT.OBJETS` = `clou boulon cuillere piece boucle rondelle` (fer brun, acier bleu, argent, cuivre, laiton, zinc vert) |
| `AUT.tas(x,y,s,o)` | milieu de la base | ≈ 240 × 135 px | `objets` : nombre 0..6 (dans l'ordre de `AUT.OBJETS`) ou liste de noms |
| `AUT.plateau(x,y,s,o)` | bas du plateau | 328 px de large | `objets` (idem, empilés sur l'étain) ; `AUT.plateauPt(k, x, y, s, dir)` → `[X, Y, rot]` écran de la place k (0..5) : y faire voler l'objet k puis passer `objets: k+1` (`surSol: true` = place du tas) |
| `AUT.cuve(x,y,s,o)` | bas du pied | 297 × 155 px (0,8 : 264 × 138) | `vapeur` 0..1 (`o.t`) ; bord à y local `AUT.CUVE.bord` = −160 (× s) ; l'intérieur est sombre, le contenu reste caché |
| `AUT.pince(x,y,s,o)` | milieu | 225 px | `ouvre` 0..1 ; `tient` = nom d'objet dans les mors ; `tientRot` |
| `AUT.toise(x,y,s,o)` | pied | 648 px (`long` 720 local) | `curseur` 0..1 (hauteur du curseur, 0,88) ; `long` ; tenue : `prise` (hauteur de la main, 190) |
| `AUT.journal(x,y,s,o)` | bas-centre | 137 × 189 px | (dos du journal : blocs gris et vignette hachurée, aucune lettre) |

## Décors (pré-rendus par `AUT.init()`)
| Clé / appel | Pose | Repères utiles |
|---|---|---|
| `AUT.enclos(t, o)` | tout l'enclos, **avant** `M.drawFloor()` : toile du ciel, 2 oiseaux lointains, arbre maigre, clôture, porte, sol ocre à herbe sèche | `o.porte:false` (dessiner la porte soi-même), `o.oiseaux:false`, `o.cast` |
| `AUT.K.ciel` | `ctx.drawImage(AUT.K.ciel, 0, 0)` | collines du zoo vers y 1100–1190 |
| `AUT.K.porte` | `M.flat(AUT.K.porte, AUT.PORTE.x, ST.back, {cast})` (x 250) | 332 × 476 px à 1 ; boîtier de serrure 92 × 132 px centré en `(x + 74, ST.back − 228)`, trou de serrure ≈ `(x + 74, ST.back − 222)` (`AUT.PORTE.serrure`, `.trou`, relatifs au bas-centre, ×scale) ; loquet à gauche de la serrure. Vignette : `M.flat(AUT.K.porte, cx, cy + 0.6·ry, {scale: 0.5})` |
| `AUT.K.cloture`, `AUT.K.arbre`, `AUT.K.sol` | `M.flat(…, 540, ST.back)` ; arbre à `AUT.ARBRE.x` = 880 ; sol à `ST.back + 12` | piquets 330–355 px, 3 fils ; sol : dessus vers `ST.back − 45` |
| `AUT.labo(t, o)` | carrelage vert pâle + frise, étagère de bocaux sans étiquette (x 150–470, y 600/780), lampe suspendue (`AUT.LAMPE` x 560, bas de l'abat-jour y 470), table | `o.table:false` puis, après le chercheur : `M.flat(AUT.K.table, AUT.TABLE.cx, ST.back, {cast})` |
| `AUT.K.table` | table d'examen inox, x 260–820 | dessus `AUT.TABLE.top` = `ST.back − 200` (y 1195) : y poser cuve et plateau |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'AUT\.' casting/scene.js`). Les trois appels les plus utiles :
```js
// enclos : autruche innocente au centre, gardien à la toise (présentée devant lui), dans le fond
AUT.enclos(t); M.drawFloor();
AUT.gardien({ t, tenu: 'toise', tenuO: { curseur: 0.9 } }, 830, FEETB, 0.9, { dir: -1, slot: ST.slotB, cast });
AUT.autruche({ t, expr: 'innocente', avale: u }, 470, FEET, 0.94, { dir: 1, slot: ST.slotF, cast });
// labo : le chercheur plonge la pince dans la cuve, puis la table par-dessus
AUT.labo(t, { table: false }); M.drawFloor();
AUT.chercheur({ t, plonge: 1, tenuO: { ouvre: 0.4 } }, 300, FEETB, 0.9, { dir: 1, slot: ST.slotB, cast });
M.flat(AUT.K.table, AUT.TABLE.cx, ST.back, { cast }); AUT.cuve(500, AUT.TABLE.top, 0.8, { t, cast }); AUT.plateau(720, AUT.TABLE.top, 0.9, { objets: n, cast });
// brandir la clé (lueur), ou tâter la clé posée puis retirer la main
const r = AUT.chercheur({ t, tenu: 'cle', brandir: k, tenuO: { lueur: 1, t } }, 400, FEETB, 0.9, { dir: 1, slot: ST.slotB, cast });
AUT.chercheur({ t, tenu: 'rien', handF: 'open', atteint: k, cible: [cleX, cleY] }, 400, FEETB, 0.9, { dir: 1, slot: ST.slotB, cast });
```
