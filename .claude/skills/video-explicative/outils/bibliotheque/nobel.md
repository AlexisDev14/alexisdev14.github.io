# persos.md — « Alfred Nobel, le marchand de mort qui inventa la paix » : mode d'emploi de `persos.js`

Espace de noms : `M.nob` (dans `scene.js` : `const NOB = M.nob;`). Dans `S.init` : `NOB.init()` (pré-rendus `NOB.K` : `portrait`, `salleFond`, `salleMilieu`, `cabVueClub/Not`, `cabFondClub/Not`, `cabMilieuClub/Not`).
Bibliothèque (non recréés) : sac d'or `M.mer.sac`, plume `M.mer.plume` (voir `mercedes.md`). Fiole (P2), portrait de Ludvig (P3), ombres des inconnus (P5) : dans le `scene.js` du plan.
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses ; tailles en px **à l'écran** à cette échelle.
Aucune lettre, aucun chiffre : journal, testament, médaille et médaillons portent des dessins et des lignes ondulées.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `NOB.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle prépare la pose (gestes, objet tenu, seconde main) et renvoie `r` : `r.w('pièce', x, y)` = point écran, `r.q` = pose finale. Passer `t` dans la pose (marche, battements, flammes).
`NOB.nom.pose(pose, x, y, s, dir)` renvoie la pose finale sans dessiner (pour `M.ik`).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'dynamite'`, `'journal'`, `'testament'`, `'ecrin'`, `'medaille'`, `'diplome'`, `'eventail'`, `'plume'`, `'sac'`, `'rien'`, **ou une fonction** `(o) => { … }` qui dessine l'objet du plan (fiole de P2) avec l'origine au poing, objet droit. `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul, + `k` = taille).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `ang.objet` le tourne.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (d'office pour `journal`, `testament` ; pour `ecrin`/`diplome` avec `recoit`).
- `vers: [X,Y]` (écran) : la main avant va à ce point (IK, coude toujours devant) ; `versB` pour la main arrière ; `versK` / `versBK` 0..1 (mélange). `cible: [x,y]` = même chose en repère du torse.
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `ang`, `tilt`, `dx`, `dy` comme le kit ; `marche` 0..1 (+ `t`, `cadence` 1,1 pas/s) pour les hommes.
- Point nommé de l'objet tenu : `NOB.pt(r, 'nom')` (`NOB.pt(r, 'nom', true)` : main arrière) → `[x, y]` écran. Plume `pointe` ; dynamite `meche` (bout de la mèche), `centre` ; journal `prise`/`priseB` (mains), `mainG`/`mainD` (milieu des bords), `centre`, `haut` ; testament idem + `sceau` ; écrin `medaille` ; médaille `centre` ; éventail `bout` ; sac `bouche`.
- Jambes en deux pièces (`legF` cuisse + `legF_lo` tibia, idem `legB`) : pied toujours à plat, pointe devant (marche et assis compris).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `NOB.alfred` (`C.nobAlfred`) | 0,9 ≈ 455 px (crâne nu) | `meches`, `barbe`, `moustache` (enfants de `head`), `deuxDoigts` | `gris` (tempes, barbe, moustache poivre et sel, P4) ; `herisse` (mèches des côtés dressées) ; `tenir` + `tenu` (objet droit devant la poitrine, ou `cible`) ; `ecrire` (plume d'office ; `cible` = point où **la pointe** touche, repère du torse, défaut [104,−52] ; ou `vers` écran = pointe, `versPt:'pointe'` d'office ; griffonne avec `t`, tête penchée) ; `presente` (paume ouverte, bras tendu ; `cible`/`vers` pour viser l'objet) ; `sursaut` (bond, bras en l'air mains ouvertes, yeux ronds, bouche « o », mèches dressées) ; `pouls` (avant-bras arrière levé devant lui, deux doigts de la main avant sur le poignet, tête penchée, sourcils inquiets) ; `regardeDerriere` (la tête pivote par écrasement et regarde derrière à partir de 0,5) ; `assis` (cuisses horizontales, siège à **108 unités** au-dessus des pieds = 97 px à 0,9 ; le bas de la redingote se relève) ; `marche` |
| `NOB.laureate` (`C.nobLaureate`) | 0,9 ≈ 463 px | `jupe` (robe longue, ondule seule), `cheveux` (carré argent), `boucle` | `recoit` (deux mains tendues paumes en l'air, à hauteur de taille ; avec `tenu:'ecrin'`/`'diplome'`/`'medaille'` l'objet repose à plat sur les deux paumes) ; `salut` (révérence légère : buste incliné, tête baissée, main sur la poitrine) ; `sursaut` ; `sourire` (bouche souriante, joues roses) |
| `NOB.mc` (`C.nobMC`) | 0,88 ≈ 444 px | `barbe`, `moustache` (blanches, courtes) | `tend` (bras avant tendu devant lui ; `tenu` = `'ecrin'` d'office ; `cible`/`vers`) ; `applaudit` (mains qui se joignent devant la poitrine, 2,6 claps/s, **exige `t`**) ; `sursaut` ; `marche` |
| `NOB.notaire` (`C.nobNotaire`) | 0,85 ≈ 429 px | `couronne` (cheveux blancs), `favoris` ; pince-nez et cordon peints | `deroule` (testament d'office, tenu de face à deux mains ; `tenuO.roule` / `icones` / `dechire`) ; `lit` (tête penchée sur la feuille, yeux mi-clos) ; `marche` |
| `NOB.neveu` (`C.nobNeveu`) | 0,88 ≈ 452 px | `cheveux` (roux, raie au milieu), `moustache` (guidon) | `colere` (deux poings serrés levés au-dessus de la tête et des épaules, qui tremblent avec `t`, sourcils froncés, joues rouges, petits sauts) ; `tire` (penché en arrière, poings ; `vers`/`versB` = bord du testament) ; `boucheBee` (bouche grande ouverte, yeux ronds) ; `marche` |
| `NOB.niece` (`C.nobNiece`) | 0,85 ≈ 456 px (chignon) | `jupe`, `cheveux`, `chignon` ; manches gigot | éventail tenu d'office (fermé) ; `evente` (main sous le menton, éventail ouvert qui bat 4,2 fois/s, **exige `t`**) ; `effondre` par étapes : 0→0,3 main sur le front, 0,3→0,62 recule (yeux mi-clos), 0,62→1 renversée en arrière, yeux fermés, bouche « o » ; `tire` (comme le neveu) |

Pièges :
- La nièce lâche l'éventail (`tenu:'rien'` d'office) dès `effondre` > 0,05 ou `tire` > 0 : il disparaît d'un coup, le cacher derrière un geste ou faire tomber un `NOB.eventail` seul.
- Journal et testament tenus : la main avant tient le bord lointain en haut, la main arrière le bord proche en bas (sinon le bras avant la cache). Taille tenue maximale `tenuO.k` 0,35 (journal, 113 × 145 px à 0,9) / 0,42 (testament, 113 × 151 px) : au-delà la main n'atteint plus le bord. Pour lire le journal, montrer aussi `NOB.journal` seul en grand.
- Les objets plats tenus (`journal`, `testament`, `diplome`) se dessinent **derrière** la marionnette ; en `dir −1` leur dessin est contre-retourné (jamais en miroir).
- Écrin tenu `k` 0,8 : disque Ø 79 px à 0,9 (Ø 141 px à 1,6). Pour le plan serré de la médaille, `NOB.medaille` seul (Ø 110 px à 1, ≥ 120 px à 1,1).
- `ecrire` assis à un bureau : passer `vers` = point du papier (écran) ; la pointe de la plume s'y pose.
- Robes (lauréate, nièce) : pas de jambes, donc aucun contrôle de pied ; aucune dispense `libre` n'a été nécessaire.

### `bendSign` de `M.ik` (vérifié page 5 de la planche, 0 ligne ATTENTION)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Alfred, lauréate, maître de cérémonie, notaire, neveu, nièce (tous gestes) | 1 | 1 | 1 | 1 |
`handLen` 100 ; épaules `[-2,-146]` / `[-10,-146]` ; bras 96 + 96 : portée ≈ 192 unités (173 px à 0,9). Préparer `const q = NOB.alfred.pose(p, x, y, s, dir)` puis `M.ik(C.nobAlfred, q, x, y, s, dir, 'armF', [X,Y], 1)` et passer `ang` modifié (sans geste qui réécrit le même bras) — ou plus simple : `vers`.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Renvoient `r` (`r.w('o', x, y)`) + points nommés en écran.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `NOB.colombe(x,y,s,o)` | pattes (posée) ; corps à 44 au-dessus | s 0,85 : 145 × 77 px repliée, ≈ 170 px ailes ouvertes | `pose` `'perche'` (posée, ailes repliées, hochement de tête toutes les 1,3 s, `ph` déphase) \| `'vol'` (battement 3,2/s selon `t`) \| `'effraie'` (plumes ébouriffées, battement 5,2/s, plumes qui s'envolent) ; `rameau` 0/1 (rameau d'olivier au bec) ; renvoie `r.bec`, `r.rameau`, `r.centre` |
| `NOB.portrait(x,y,s,o)` | milieu du **bord haut** du cadre | s 1 : 340 × 420 px (+ laurier ≈ 55 px au-dessus) | `laurier` 0..1 (couronne dorée qui pousse sur le haut du cadre) ; `ombre` 0..1 (voile sombre) ; `cables` (true : deux câbles jusqu'en haut de l'écran) ; `rot` ; `cast` ; renvoie `{accrocheG, accrocheD, centre, bas}` |
| `NOB.medaille(x,y,s,o)` | centre du disque ; avec `ecrin:1` : bas de l'écrin | s 1 : Ø 110 px ; écrin 160 × 150 | `ecrin` 0/1 (écrin bleu nuit ouvert, doublure crème) ; `eclat` 0..1 (reflet qui balaie + scintillement, **exige `t`**) ; `k` ; renvoie `r.medaille` (centre du disque) |
| `NOB.diplome(x,y,s,o)` | centre | s 1 : 156 × 116 px | chemise de cuir rouge ouverte : paysage enluminé à gauche, lignes ondulées à droite |
| `NOB.dynamite(x,y,s,o)` | centre de la botte | s 1 : bâton 166 × 36 ; botte 166 × 96 + mèche ≈ 50 | `n` 1 \| 3 ; `meche` 0..1 (étincelle qui grésille, gerbe d'étincelles orange, lueur, **exige `t`**) ; `longueur` 0..1 (mèche qui raccourcit) ; `debout` (bâtons verticaux, mèche en haut) ; renvoie `r.meche` |
| `NOB.journal(x,y,s,o)` | centre (`ancre` `'haut'`, `'hautG'`, `'hautD'` = milieu / coins du bord haut, `'bas'`) | s 1 : 360 × 460 px | `face` `'mort'` (une, portrait gravé d'Alfred dans un épais cadre noir de deuil) \| `'caricature'` (page intérieure : Alfred marchand derrière un étal de dynamite, tend un bâton en souriant) ; `plie` 0..1 (la moitié haute se rabat) ; `k` ; renvoie `r.mainG`, `r.mainD` (milieu des bords), `r.centre`, `r.haut` |
| `NOB.testament(x,y,s,o)` | centre | s 1 : 300 × 400 px | `icones` 0..5 (vignettes des prix qui apparaissent une à une en marge : aimant, fiole, mortier, livre + plume, colombe) ; `roule` 0..1 (**1 = roulé**, 0 = à plat ; ou `deroule` = 1 − `roule`) ; `dechire` 0..1 (0→0,4 se froisse, 0,4→1 se déchire du haut vers le bas) ; `k` ; renvoie `r.mainG`, `r.mainD` (bords, pour `vers` du neveu et de la nièce), `r.sceau` |
| `NOB.eventail(x,y,s,o)` | pivot | s 0,85 : Ø 92 px | `ouvert` 0..1 |
| `NOB.medaillon(i,x,y,k,o)` | centre du disque (fil jusqu'en haut de l'écran) | k 1 : Ø 120 px | `i` 0 physique (aimant, émail bleu nuit), 1 chimie (fiole, vert), 2 médecine (mortier, rouge), 3 littérature (livre + plume, ocre), 4 paix (colombe au rameau, bleu clair) ; `descente` 0..1 (descend des cintres avec petit rebond) ; `balance` (1) ; `t` ; renvoie `[x, y]` réel |
| `NOB.pouf(t,x,y,k,o)` | centre | k 1 ≈ 260 px | `t0` (début), `dur` (1,5 s) ; `variante` `'boum'` (éclair jaune 3 images, volutes rondes gris-brun, étincelles) \| `'confettis'` (volutes claires + 44 confettis dorés) \| `'colere'` (petit nuage gris foncé + 4 étoiles de carton) ; `couleur` ; `seed`. Rien avant `t0` ni après `t0 + dur` |

## Décors (pré-rendus par `NOB.init()` ; à dessiner AVANT `M.drawFloor()` ; animations en temps global)
| Appel | Pose | Repères utiles |
|---|---|---|
| `NOB.salle(t, up, o)` puis, après `M.drawFloor()`, `NOB.salleSol(t, o)` | plein écran (`up` = décalage vertical px, 0) | `NOB.SALLE` : portrait `{x:540, y:520}` (bord haut du cadre : `NOB.portrait(540, y, 1, …)`, descente depuis y ≈ −440) ; pupitre-lutrin `{x:790, y:1108}` (dessus) ; buste `{x:905, y:1060}` ; torchères `[[238,792],[846,792]]` (flammes) ; estrade y 1318 ; gerbes `[[140,1395],[905,1395]]` ; lustres `[[330,150,370],[750,150,370]]` |
| options `salle` | | `lumiere` 0..1 (1) ; `petaleT0` (P1 : un pétale tombe de la gerbe gauche, 4 s) ; `scintilleT0` (P6 : les lustres scintillent plus fort 1,4 s) |
| options `salleSol` | | fleurs et bougies au bord de l'estrade (côtés, y 1440–1510) ; `public` 0..1 (têtes sombres de l'auditoire, bas d'écran aux bords) |
| `NOB.cabinet(t, up, o)` puis, après `M.drawFloor()`, `NOB.cabinetSol(t, o)` | plein écran | `variante` `'club'` (défaut : ciel gris, toits de zinc, cheminée qui fume, reliures colorées, globe) \| `'notaire'` (neige sur Stockholm, clochers vert-de-gris, dossiers ficelés, coffre-fort noir, cheminée grise) ; `fenetre` 0..1 (club : battant droit qui s'ouvre) ; `drap` 0..1 (notaire : drap blanc éclairé de derrière qui descend) ; `bucheT0` (P4 : bûche qui s'affaisse + étincelles) ; `rafaleT0` (P5 : rafale de neige contre la vitre) |
| `NOB.CABINET` | | fenêtre `{x0:380, x1:660, y0:330, y1:880}` (entrée de la colombe : battant droit x 520–660) ; bureau `{x0:560, x1:860, plateau:1170}` ; feu `[175,1330]` ; lampe `{x:800, y:1054}` ; drap `{x0:120, x1:640, y0:560, y1:920}` (ombres du P5 entre ces bornes) ; coffre `{x0:880, x1:1000}` ; globe `{x:935, y:1395}` ; pendule murale `{x:175, y:760}` |
| options `cabinetSol` | | tapis d'Orient (centre 540, y 1432) ; `fauteuil` (true : fauteuil club en cuir x 50–220, y 1290–1484) |
Animations : salle = lustres qui oscillent et scintillent, neige derrière les deux fenêtres, flammes des torchères et des bougies, pétales, poussière dans le faisceau ; cabinet = feu, pendule, lampe, fumée (club) ou neige (notaire), rideaux qui ondulent, poussière dans le rayon de la fenêtre.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'NOB\.' casting/scene.js`). Pages : 0 planche · 1 comparaisons · 2 Alfred · 3 lauréate + MC · 4 notaire, neveu, nièce · 5 bras / `M.ik` · 6–7 prises s 1,6 (dir 1 / −1) · 8 salle · 9 cabinet club · 9,97 vignettes + notaire.
```js
// P1 : le MC tend l'écrin, la lauréate le reçoit sur ses paumes ; portrait qui descend
NOB.portrait(540, lerp(-440, 520, k), 1, { t, cast });
NOB.mc({ t, tend: 1, tenu: 'ecrin', tenuO: { eclat: 1, t } }, 650, FEET, 0.88, { dir: -1, slot: ST.slotF, cast });
NOB.laureate({ t, recoit: 1, tenu: 'ecrin', tenuO: { eclat: 1, t }, sourire: 1 }, 420, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// P3 : Alfred lit sa nécrologie
NOB.alfred({ t, tenir: 1, tenu: 'journal', tenuO: { face: 'mort' } }, 420, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// P5 : neveu et nièce tirent chacun un bord du testament
const r = NOB.testament(540, 1080, 0.8, { icones: 5, dechire: d });
NOB.neveu({ t, tire: 1, vers: r.mainG, versB: [r.mainG[0], r.mainG[1] + 20] }, r.mainG[0] - 160, FEET, 0.88, { dir: 1, slot: ST.slotF, cast });
NOB.niece({ t, tire: 1, vers: r.mainD, versB: [r.mainD[0], r.mainD[1] + 20] }, r.mainD[0] + 160, FEET, 0.85, { dir: -1, slot: ST.slotF, cast });
// P6 : la colombe apporte le journal par son coin
const c = NOB.colombe(x, y, 0.85, { t, pose: 'vol', dir: -1 });
NOB.journal(c.bec[0], c.bec[1], 0.5, { face: 'caricature', ancre: 'hautD' }); NOB.colombe(x, y, 0.85, { t, pose: 'vol', dir: -1 });
```
