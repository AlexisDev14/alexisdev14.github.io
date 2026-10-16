# persos.md — « Le Swoosh de Nike, payé 35 dollars » : mode d'emploi de `persos.js`

Espace de noms : `M.nik` (dans `scene.js` : `const NIK = M.nik;`). Dans `S.init` : `NIK.init();` (pré-rendus `NIK.K.bureau`, `NIK.K.studio`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran**, mesurées sur la planche (`casting/`). `FEET = ST.slotF - 34`.
Aucun texte, chiffre ni lettre nulle part (facture, certificat, pendule, billets : traits seulement). Le seul logo est le Swoosh, qui n'apparaît qu'au mot qui le nomme.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `NIK.phil(pose, x, y, s, o)` / `NIK.carolyn(pose, x, y, s, o)` : elle prépare la pose (gestes, objet tenu, seconde main). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce ; `r.pose` = pose préparée). `o.nom` sert aux messages « coude à l'envers ».
Pièces communes : `plat platB armB_up armB_lo objetB doigtsB legB legF head … torso … armF_up armF_lo objet doigts doigtsB2`. Épaule et coude ronds, rivet au pivot (pli 0 → 2,4 rad vérifié dans les deux sens).
Angles : `armF_up` 0 pendant, −1,57 horizontal devant, −2,5 au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` positif = tête baissée, négatif = menton levé ; `legF/legB` négatif = jambe vers l'avant.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière, ou `'rien'`.
  - **objets plats**, dessinés DERRIÈRE toute la marionnette, la main posée sur leur bord : `'calque'`, `'facture'`, `'billets'`, `'actions'`, `'swoosh'` ;
  - **objets en volume**, devant la main, doigts couleur chair par-dessus : `'chaussure'` (tenue par le talon), `'basket'` (par le talon), `'ecrin'` (par-dessous), `'crayon'`.
- `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'accessoire seul) + pour un objet plat `prise` : `'bord'` (défaut : bord proche, la feuille part vers l'avant), `'bas'` (la main sous le bord bas, feuille au-dessus), `'haut'` (feuille pendue sous la main), `'coin'`, ou `[x,y]` locaux. Chaussure et basket tenues : `sens` vaut −1 par défaut (pointe vers l'avant du personnage).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent.
- `deuxMains` : la main arrière se pose d'elle-même sous l'écrin (seul objet à seconde prise).
- `handF` / `handB` : `'fist'` | `'open'` (poing d'office quand la main tient un objet, sauf si on passe `'open'`) ; `face` `{ brow, mouth, eyes }` ; `t` (gribouillis, éclat du diamant).
- Point nommé de l'objet tenu : `NIK.pt(r, 'nom')` → `[x, y]` écran (`NIK.pt(r, 'nom', true)` pour la main arrière). Points : swoosh `centre pointe crochet` ; calque `centre haut` ; facture `centre cachet` ; billets `centre` ; actions `centre sceau` ; chaussure `pointe talon flanc dessus` ; basket `pointe flanc talon` ; ecrin `diamant bague centre` ; crayon `pointe`.

Gestes communs aux deux (0..1 sauf mention ; ils se combinent, le dernier de cette liste l'emporte sur le bras avant) :
| Option | Effet |
|---|---|
| `pas` (rad) | marche : jambes et bras balancés, petits sauts ; passer `pas: t*7` (deux pas par 2π) |
| `penche` −1..1 | **gag récurrent** : tête inclinée de ±0,35 rad (1 = vers l'avant-bas, −1 = vers l'arrière), corps 0,03, sourcils froncés d'office au-delà de 0,25 (`face.brow` pour changer). Aller-retour à faire dans le plan |
| `fier` | deux poings sur les hanches (coudes en arrière), buste bombé, menton levé |
| `devant` (+ `cibleDevant` [x,y] torse, défaut [140,−44]) | main avant devant le ventre ; avec `tenu:'ecrin', deuxMains:true` = tenir l'écrin à deux mains |
| `tient` | bras avant presque tendu à hauteur d'épaule (feuille ou chaussure montrée à bout de bras ; feuille au-dessus de la main : `tenuO:{prise:'bas'}`) |
| `presente` | comme `tient` ; chez Carolyn sans `tenu` : 3 calques en éventail (`tenu:'calque', tenuO:{n:3}`) |
| `tend` | bras tendu à l'horizontale, **main ouverte** si l'objet est plat ou absent (billets, facture) |
| `menton` | poing sous le menton (suit la tête, se combine avec `penche`) |
| `dessine` (+ `cible` [x,y] torse = point touché par la mine, défaut [166,−73] ; `gribouille` 0..1, 1 ; **exige `t`**) | crayon d'office dans la main avant, tête baissée |
| `epingle` (+ `cibleMur` [x,y] torse, défaut [62,−300]) | bras levé, main ouverte contre le mur ; avec `tenu:'calque'`/`'facture'` et `tenuO:{prise:'haut'}` = épingler la feuille |
| `recoit` | deux mains ouvertes tendues devant (recevoir une feuille) |

| Fonction | Échelle, taille | Pièces en plus | Particularités |
|---|---|---|---|
| `NIK.phil` (`C.nikPhil`) | 0,92 (défaut) ≈ 480 px | `cheveux` (enfant de head), `cravate` (enfant du torse) | chemise bleu ciel manches retroussées, cravate brique, pantalon tabac, souliers de cuir ; ni chapeau ni lunettes |
| `NIK.carolyn` (`C.nikCarolyn`) | 0,92 (défaut) ≈ 464 px | `col`, `cheveux` (longs, dessinés sur le dos), `carton`, `cartonDoigts` | `carton` 0..1 ou `true` : carton à dessin noir sous le bras avant (la main tient le bas) ; mettre `carton:0` avant tout geste du bras avant |

`bendSign` de `M.ik` vérifié (planche, pages 3 et 4, dir 1 et −1 : bras avant pour tendre, tenir à bout de bras, menton, hanche, écrin, dessiner, épingler ; bras arrière pour la hanche ; aucune ligne « ATTENTION ») :
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Phil | 1 | 1 | 1 | 1 |
| Carolyn | 1 | 1 | 1 | 1 |
Cibles de `M.ik` en coordonnées écran ; pour viser un point du torse : `M.wpt(M.partMatrices(C.nikPhil, {ang:{}}, x, y, s, dir).mats.torso, lx, ly)`. Les gestes de l'enveloppe ci-dessus n'ont pas besoin de `M.ik`.

Pièges :
- Un objet plat est dessiné derrière SA marionnette, mais devant un personnage dessiné AVANT elle : quand Carolyn tend la facture à Phil, dessiner Carolyn d'abord ou écarter les deux (≥ 520 px entre eux à 0,92).
- Chaussure tenue (`sens` −1) : le Swoosh du flanc a la pointe vers le talon, donc vers l'arrière à l'écran pour dir 1 (vrai sur une chaussure). Pour un Swoosh « à l'endroit » dans la main de Phil en dir 1 : `tenuO:{sens:1}` (la pointe de la chaussure part alors vers son corps).
- Le Swoosh (seul ou tenu) et les croquis des calques ne sont **jamais** retournés par `dir:-1` (sauf `miroir:true`) ; `NIK.pt(r,'pointe')` d'un Swoosh tenu en dir −1 est alors faux : prendre `'centre'`.
- `fier` met les deux poings : le bras arrière se voit à peine (coude derrière le dos). Bras levé en arrière avec avant-bras replié (`armF_up` > 1,2 et `armF_lo` < −1,2) = coude à l'envers : à éviter.
- L'écrin tenu (0,92) ne fait que ≈ 145 px de large : pour le gag de la bague, poser `NIK.ecrin` seul à s ≥ 1,1.

## Accessoires (sans tige : ils volent)
Appel `NIK.nom(x, y, s, o)` → `r` (`r.pt('nom')` = point écran, mêmes noms que ci-dessus). Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Échelle 1 par défaut ; tailles mesurées à s = 1.

| Fonction | `(x,y)` = | Taille à s = 1 | Options |
|---|---|---|---|
| `NIK.swoosh` | centre | 195 × 74 (s 0,4 ≈ 80 px, 0,75 ≈ 150, 1,5 ≈ 290, 2,5 ≈ 490) | carton noir à liseré blanc ; `brille` 0..1 (reflet qui passe, avec `t`) ; `couleur` ; `croquis:true` (tracé au crayon sur une feuille 236 × 164) + `trace` 0..1 ; `panneau:true` (panneau bordeaux 300 × 182 à ampoules, deux fils qui montent hors cadre) + `allume` 0..1 (1) ; `miroir` |
| `NIK.chaussure` | milieu du dessous de la semelle | 209 × 93 | course 1971 : toile ivoire, semelle gaufrée en gomme ocre, talon brique, lacets ; `swoosh` 0..1 (le Swoosh noir se pose sur le flanc, grandit de 70 à 100 %) ; `sens` 1 (défaut : pointe à gauche, Swoosh à l'endroit) / −1 ; `couleur` (toile) |
| `NIK.basket` | milieu du dessous | 250 × 184 | montante, semelle à bulle d'air, ardoise et blanc, Swoosh noir au flanc ; `sens` |
| `NIK.calque` | milieu du bord bas | 150 × 190 (s 0,85 ≈ 135 × 167) | feuille translucide bleutée ; `variante` 0..4 (0 = le Swoosh retenu, 1 aile à plumes, 2 double trait, 3 coche anguleuse, 4 boucle : les 5 se ressemblent) ; `chaussure:true` (croquis de chaussure, marque au flanc) ; `trace` 0..1 (le croquis se dessine, hachures après 0,7) ; `n` 1..3 (feuilles en éventail, variantes suivantes derrière) |
| `NIK.facture` | milieu du bord bas | 146 × 186 | lignes illisibles, colonne de montants en traits, double trait du total ; `cachet` 0..1 (1 ; cachet rouge rond sans lettre qui « tombe » : grossi puis posé) |
| `NIK.billets` | milieu du bord bas | 150 × 66 (+ éventail) | liasse verte sans chiffre ni portrait ; `n` 1..4 (3) |
| `NIK.actions` | milieu du bord bas | 179 × 227 | certificat : parchemin à liseré doré, bandeau guilloché, soleil levant gravé, lignes illisibles ; `cachet` 0..1 (sceau de cire rouge à rubans) |
| `NIK.ecrin` | milieu du dessous de l'écrin | 157 × 164 (ouvert) | écrin de cuir rouge, satin ivoire, bague d'or à plateau d'onyx et Swoosh d'or, diamant à facettes ; `ouvert` 0..1 (1) ; `brille` 0..1 (1, étoiles qui pulsent avec `t`) ; `ecrin:false` = bague seule (≈ 80 × 110) |
| `NIK.bague` | idem | idem | alias de `NIK.ecrin` (passer `ecrin:false` pour l'anneau seul) |
| `NIK.crayon` | prise | 96 × 9, incliné de 1 rad (mine en bas à droite) | — ; point `pointe` |

## Décors (pré-rendus par `NIK.init()`)
| Clé | Pose | Repères utiles (`NIK.BUREAU` / `NIK.STUDIO`) |
|---|---|---|
| `NIK.K.bureau` | `ctx.drawImage(NIK.K.bureau, 0, 0)` (toile plein écran 1080 × 1400) puis `M.drawFloor()` | mur de brique ocre ; zone libre `libre` x 250–780 (rien au sol) ; grande fenêtre `fenetre` x 330–700, y 330–820 ; pendule sans chiffre `pendule` (190, 420) r 54 ; étagères de formes `etageres` y 560 et 730 (x 770–1010) ; établi `etabli` x 50–240 (dessus y 1126) ; bureau `bureau` x 790–1050, dessus du plateau y 1172 (téléphone, boîtes orange sans marque, papier : place libre x 800–900 seulement) |
| `NIK.K.studio` | `ctx.drawImage(NIK.K.studio, 0, 0)` puis `M.drawFloor()` | papier peint 1970 ; fenêtre à rideaux `fenetre` x 150–410, y 360–780 (rideaux jusqu'à x 104 et 456) ; liège `liege` x 470–700, y 420–650 (3 croquis épinglés) ; table à dessin `table` : planche de (690, 1150) à (935, 1045), lampe d'architecte au bord haut ; tabouret `tabouret` x 990, assise y 1215. **Carolyn qui dessine : `NIK.carolyn({t, dessine:1}, NIK.STUDIO.carolyn.x /* 570 */, FEET, 0.92, {dir:1, …})` : la mine tombe sur la feuille de la planche** |
Pour le bureau de 1983 (P6) ou un changement à vue, poser des pièces par-dessus la toile (le bureau n'existe qu'en version 1971).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'NIK\.' casting/scene.js`). Les plus utiles :
```js
// Carolyn dessine à la table du studio (pointe du crayon : NIK.pt(r, 'pointe'))
const r = NIK.carolyn({ t, dessine: 1 }, NIK.STUDIO.carolyn.x, FEET, 0.92, { dir: 1, slot: ST.slotF, cast });
// Phil montre la chaussure à bout de bras, tête penchée (gag)
NIK.phil({ t, tenu: 'chaussure', tenuO: { swoosh: 1 }, tient: 1, penche: 0.6 }, 250, FEET, 0.92, { dir: 1, slot: ST.slotF, cast });
// Carolyn tend la facture (main ouverte sur le bord), Phil reçoit ; Phil tend des billets
NIK.carolyn({ t, tenu: 'facture', tend: 1 }, 760, FEET, 0.92, { dir: -1, slot: ST.slotF, cast });
NIK.phil({ t, tenu: 'billets', tenuO: { n: 2 }, tend: 1 }, 300, FEET, 0.92, { dir: 1, slot: ST.slotF, cast });
// Phil tient l'écrin ouvert à deux mains ; Carolyn présente trois calques ; carton sous le bras
NIK.phil({ t, tenu: 'ecrin', tenuO: { ouvert: 1 }, devant: 1, deuxMains: true }, 400, FEET, 0.92, { dir: 1, slot: ST.slotF, cast });
NIK.carolyn({ t, presente: 1 }, 600, FEET, 0.92, { dir: -1, slot: ST.slotF, cast });
NIK.carolyn({ t, carton: 1, pas: t * 7 }, x, FEET, 0.92, { dir: -1, slot: ST.slotF, cast });
// panneau lumineux suspendu au-dessus de la scène (fils hors cadre)
NIK.swoosh(540, 470, 0.9, { panneau: true, allume: 1, t });
```
