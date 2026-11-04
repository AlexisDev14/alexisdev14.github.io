# persos.md — « Ronald McDonald, le clown jugé trop gros » : mode d'emploi de `persos.js`

Espace de noms : `M.ron` (dans `scene.js` : `const RON = M.ron;`). Dans `S.init` : `RON.init()` (pré-rendus `RON.K` : stRegie, stFond, door, stCirque, stMilieu, stBancs, stSol, comptoir). Téléviseur : `M.hou.init()` en plus (bibliothèque `drhouse.js`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (géométrie du code, vérifiée sur la planche `casting/`). Aucune lettre, aucun chiffre nulle part.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `RON.nom(pose, x, y, s, o)` : elle prépare la pose (gestes → angles, objet tenu, seconde main). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). `RON.nom.pose(pose, x, y, s, dir)` = pose finale sans dessiner (pour `M.ik`, `M.partMatrices`).

Options communes :
- `t` (obligatoire : souffle, marche, oscillations) ; `marche` 0..1 ou `true` (+ `cadence`, 1,1 pas/s) ; `respire:false` coupe le souffle ; `expr` : `'neutre' 'ravi' 'surpris' 'triste' 'fache' 'fier' 'gene' 'moue'`.
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'hamburger' 'sac' 'frites' 'gobelet' 'pieces' 'metre' 'plateau' 'panneau' 'carte'` ; `tenuO` / `tenuBO` : options de l'objet (`echelle`, `croque`, `deplie`…).
- `droit` / `droitB` : `true` par défaut (l'objet reste droit à l'écran) ; `ang.objet` l'incline. `deuxMains` : la main arrière va d'elle-même sur la seconde prise (plateau, panneau, carte).
- `handF` / `handB` : `'fist' | 'open'` ; `face : { brow, mouth, eyes }`. Tout angle `ang.*` s'ajoute après les gestes. `cible` = point ÉCRAN (gestes qui visent).
- Point écran d'un point nommé de l'objet tenu : `RON.pt(r, 'nom')` (main arrière : `RON.pt(r, 'nom', true)` ; `'prise'` = point tenu).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `RON.scott` (`C.ronScott`) | 0,9 ≈ 468 px (cheveux), ≈ 534 px avec le plateau ; 128 px de large (ventre 1), 110 (ventre 0,55) | `cheveux`, `calotte`, `touffe`, `touffeB` (perruque de Bozo), `nez` (gobelet), `plateauT`, `col` (collerette), `noeud`, `shoeF/B` | `costume` `'bozo'` (défaut) \| `'ronald'` \| `'costume'` ; `perruque` 0/1 (bozo, défaut 1 ; à 0 ses cheveux bruns, visage blanc gardé) ; `nez` 0/1 et `plateau` 0/1 (ronald, défaut 1) ; `ventre` 0,3..1,2 (1 normal) ; `bouton` = INSTANT en s (même horloge que `t`) : le bouton du ventre saute, retombe au sol et y reste ; gestes `salut` (main ouverte qui s'agite au-dessus de l'épaule), `joie` (bras en V, menton levé, sautille), `idee` (0→0,45 main au menton, 0,55→1 main ouverte en l'air), `porteNez` (avec `nez:0` : gobelet en main porté sur le nez ; avec `nez:1` la main vient seulement le presser), `poseChapeau` (avec `plateau:0` : plateau à deux mains devant la poitrine → au-dessus de la tête (0,6) → posé (1) ; avec `plateau:1` les deux mains se posent sur le plateau du crâne), `tient` (plateau à deux mains devant la poitrine ; autre objet par `tenu`), `rentreVentre` (ventre 0,55, buste levé, yeux ronds), `triste` (tête basse, épaules tombées), `croque` (le côté mordu du hamburger vient à la bouche ; `tenuO.croque` 0..1 = morsure), `clin` (clin d'œil + sourire) |
| `RON.resto` (`C.ronResto`) | 0,88 ≈ 459 px (calot), 70 px de large | `calot`, `noeud` | `accroche` (panneau levé à deux mains au-dessus de la tête, tenu par son bord bas, regard en l'air ; panneau tenu ≈ 252 × 174 px), `plaide` (mains jointes tendues, buste penché), `desole` (mains ouvertes basses, épaules tombées), `sert` (tend le sac — ou `tenu:'hamburger'` — à bout de bras), `encaisse` (main ouverte tendue, paume en l'air ; `tenu:'pieces'` pour les pièces dedans), `applaudit` |
| `RON.dirigeant` (`C.ronDirigeant`) | 0,9 ≈ 480 px (grand, jambes ×1,08), 66 px de large | `brosse` (cheveux argent) | `montreCarte` (carte face public, bord haut à hauteur d'épaule, tenue à deux mains, DEVANT les bras ; se déplie seule de 0,3 à 1, `tenuO.deplie` pour forcer ; carte ≈ 217 × 142 px), `non` (tête qui secoue, main basse à plat qui balaie), `mesure` + `cible` (les deux mains au ventre de Scott : `cible: RON.ventrePt(rScott)` ; puis `RON.ruban(rScott, rDir)`), `accueille` (bras avant ouvert vers l'avant-haut), `moue` |
| `RON.clown` (`C.ronClown`) | 0,9 ≈ 480 px (boucles), 62 px de large | `boucles`, `shoeF/B`, `balles` | `salut` (grand salut de scène, jambe en avant), `pirouette` = TOURS (0 → 1 = un tour ; écrasement horizontal jamais sous 0,25, le sens s'inverse à mi-tour, petit saut), `jongle` (trois balles rouge/bleu/or au-dessus des mains), `reverence` (buste plié), `perplexe` (main derrière la tête), `avale` (main sur le ventre, gorge qui avale), `tient` (hamburger devant la poitrine) |
| `RON.enfant` (`C.ronEnfant`) | 0,82 ≈ 295 px ; assis ≈ 235 px | `coiffe`, `natte` ; jambes en deux pièces `legF`/`legF_lo`, `legB`/`legB_lo` | `tenue` `'a'` (fille, nattes blondes, robe vichy rouge) `'b'` (garçon roux en brosse, salopette bleue) `'c'` (casquette, pull vert éteint, culotte grise) `'d'` (fille, frange brune, gilet ocre, jupe bleu nuit) ; `assis` (siège à 66 px au-dessus des pieds à 0,82 : le banc du studio à `FEETB`), `joie` (bras en V + saut ; assis : sans saut), `tire` + `cible` (tire la manche d'un adulte, recule), `montre` (bras tendu main OUVERTE), `marche` |
| `RON.parent` (`C.ronParent`) | 0,86 ≈ 458 px (père, feutre) / 454 (mère) | `chapeau` | `tenue` `'pere'` \| `'mere'` ; `paie` (+ `cible` écran, défaut devant à hauteur d'épaule : pièces sur la paume ouverte, buste penché) ; `porte` (sac de papier par le haut, bras pendant ; avec `paie` il passe dans la main arrière) ; `marche` |
| `RON.cameraman` (`C.ronCameraman`) | 0,86 ≈ 440 px ; caméra 372 × 263 px | `casque` | dessine LUI-MÊME sa caméra à `x + 205·s·dir` (`camera:false` pour l'ôter) ; `lampe` 0..1 (lampe rouge « en direct ») ; `filme` (défaut 1 avec la caméra : mains sur les deux poignées) ; `signe` (main avant ouverte levée vers l'animateur, l'autre reste sur la poignée). Pousser la caméra = `marche:1` en déplaçant `x` |

**`bendSign` de `M.ik`** (vérifié sur la planche : chaque geste, `M.ik` direct sur Scott, balayage épaule 0 → 2,4 / coude 2,4 → 0 ; zéro ligne ATTENTION) :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Scott, restaurateur, dirigeant, clown, parents, caméraman | 1 | 1 | 1 | 1 |
| enfants (bras courts : `C.ronEnfant.handLen` 65) | 1 | 1 | 1 | 1 |
Cibles toujours DEVANT le personnage (côté du regard), à moins de ≈ 185 px × s de l'épaule (enfant : 125 × s). Exemple `M.ik` : `const q = RON.scott.pose(p, x, FEET, 0.9, dir); const a = M.ik(C.ronScott, q, x, FEET, 0.9, dir, 'armF', T, 1);` puis `RON.scott(Object.assign({}, p, { ang: { armF_up: a.up, armF_lo: a.lo } }), …)`.

Pièges :
- Scott sourit par défaut (`face.mouth` `'smile'`) ; `'o'` = bouche ronde ; `'tight'` = moue. Le maquillage de clown (bouche rouge, sourcils peints) suit `costume`.
- Raccord nez : `porteNez` 0 → 1 avec `nez:0` (gobelet en main), puis à l'image suivante `nez:1` et `porteNez` 1 → 0 (main vide qui redescend). Même principe pour `poseChapeau` / `plateau`.
- `poseChapeau` : le bras avant passe devant le visage vers 0,6–1 (voulu, bref) ; ne pas tenir la pose plus de 0,5 s.
- `bouton` est un instant absolu (s) : `bouton: 9.35` ; sans `t` il ne part pas. Il tombe devant Scott vers +x (sens du regard).
- `mesure` : dessiner Scott, puis le dirigeant à ≈ 230 px devant lui à s 0,9 (écart testé : 140 px à s 0,55) (face à face, Scott `dir` opposé), puis `RON.ruban(rScott, rDirigeant)` (ruban jaune gradué autour de la taille + deux bouts jusqu'aux mains). Sans `rD` : ceinture seule.
- La carte n'est jamais en miroir (contre-retournée en `dir −1`) ; pliée (`deplie` 0) elle montre son dos uni, tenue par le pli.
- Enfants assis : `x` = pieds ; le bassin recule de 33 px (s 0,82). Bancs du studio : enfants à `FEETB`, x 690 / 805 / 920, `dir:-1`, `slot: ST.slotB`.
- Clown et Scott-Ronald ne doivent pas porter le même objet au même moment dans le même cadre (lecture : mince/jaune/boucles contre rond/rayé/plateau).
- Scott en `'costume'` (moutarde imposée) reste de la famille du patron de presse (`guerremondes.js`) et de Gontran (`galette.js`) : cheveux bruns, larges revers chocolat et nœud bordeaux le distinguent ; ne jamais les réunir.

## Accessoires (sans tige : ils volent)
Appel : `RON.nom(x, y, s, o)`. Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Point écran : `RON.accPt('nom', x, y, s, o, 'point')`.

| Fonction | `(x,y)` = | Taille à s 1 | Options, points nommés |
|---|---|---|---|
| `RON.hamburger` | dessous | 72 × 50 (mot-clé : s ≥ 1,7 → 122 px) | `croque` 0..1 (morsure dentelée côté −x) ; points `centre`, `haut`, `morsure` |
| `RON.sac` | dessous | 70 × 96 | sac kraft roulé, tache de gras ; prise = haut roulé ; `centre`, `haut`, `bas` |
| `RON.frites` | dessous | 44 × 74 | cornet rouge sang à bande ivoire ; `haut`, `centre` |
| `RON.gobelet` | dessous | 34 × 50 | ivoire rayé rouge (le même que le nez) ; `haut` (ouverture), `bas`, `centre` |
| `RON.pieces` | dessous de la pile | 24 × 26 (×1,5 tenues) | posées sur la paume (main ouverte) ; `haut` |
| `RON.metre` | dessous du rouleau | 124 × 48 | enroulé seul ; tenu (`tenu:'metre'`) il pend en deux bouts ; `bout` |
| `RON.plateau` | milieu du dessous | 230 × 92 | chapeau-plateau en carton avec hamburger, frites, gobelet ; `fil` (deux fils vers les cintres) ; `dessus`, `centre`, `hamburger`, `gobelet` |
| `RON.panneau` | **bas** de l'ovale | 260 × 180 (+ anneaux) | ovale doré, hamburger peint, aucune lettre ; `fils` (accroché aux cintres) ; `centre`, `haut`, `bas`, `anneauG`, `anneauD` |
| `RON.carte` | bas | 230 × 150 | États-Unis vus de face (silhouette ocre, 23 points rouges), aucune lettre ; `deplie` 0..1 ; `centre`, `haut`, `bas` |
| `RON.cameraTV` | sol sous la colonne | 306 × 432 (s 0,86 : 263 × 372) | caméra 1960 : tourelle de 4 objectifs, viseur, pied à roulettes ; `lampe` 0..1 ; `RON.cameraPt(x,y,s,o,'lampe'|'objectif'|'viseur'|'poignee'|'poignee2')` |
| `RON.ventrePt(rScott, dy)` | — | — | point écran le plus en avant du ventre (suit `ventre`) |
| `HOU.tele(x,y,s,o)` (drhouse.js) | bas du meuble | 520 × 546 | voir `drhouse.md` ; écran : `draw(cx,cy,w,h)` → Scott à s ≈ h/700, pieds à `cy + h*0,42` (à s 0,25 dans un écran de 126 px la tête est coupée : réduire). **Le meuble contient un magnétoscope (anachronique en 1960)** : le masquer par une planche de bois dessinée sur `r.fente` ou cadrer au-dessus |

## Décors (pré-rendus par `RON.init()`)
Ordre : `RON.studio(t, up, o)` → `M.drawFloor()` → `RON.studioSol(t, up)` → marionnettes de la fente arrière → `RON.comptoir(t, monte, o)` → fente avant. `up` (px) monte tout le décor. Animations en temps global (sans saut à la coupe) : projecteurs qui oscillent + faisceaux poussiéreux, trotteuse par secondes, lampes de régie, moniteur qui scintille, fanions, ventilateur, cadrans du pupitre.

| Appel | Options | Repères utiles (`RON.STUDIO`, à `up` 0) |
|---|---|---|
| `RON.studio(t, up, o)` + `RON.studioSol(t, up)` | `cirque` 0..1 (défaut 1 ; de 1 à 0 le chapiteau monte aux cintres sur deux câbles, à 0 il est hors champ) ; `bancs` (false) ; `antenne` 0..1 (défaut 1) ; `regie` 0..1 (le technicien debout se penche à la vitre, main levée) ; `projecteur` 0..1 (le projecteur 2 clignote, éteint à 1) ; `porte` 0..1 (le battant s'ouvre, lumière du couloir) ; `lumiere` 0..1 ; `moniteur` (false = éteint) | mur capitonné vert-de-gris en bandes ; passerelle y 268, projecteurs x 196 / 420 / 664 / 884 (y 318) ; régie x 640–930, y 380–590 ; horloge (452, 452) r 56 ; lampe à l'antenne (236, 812) ; porte x 146–326 dès y 862 ; haut-parleur (606, 696) ; câble au crochet x 405 ; extincteur x 670 ; **chapiteau** x 302–802 (pic y 560, axe x 552), **podium** rond étoilé x 427–677 (dessus ≈ y 1321), fanions du pic vers x 222 et 882 ; **banc** x 600–944, siège y 1314 ; moniteur sur pied x 888 (écran y 970–1056) ; perche : trépied x 104, micro (468, 742) ; rideau gris x 930–1080 ; premier plan : **pupitre de régie** x 52–236 (haut y 1211), rouleau de câble x 790, caisses x 850–970, seau x 1045, ventilateur (984, 1070). **Caméra** : caméraman x 140–200 (`dir` 1) → caméra x 316–376 |
| `RON.comptoir(t, monte, o)` | `monte` 0..1 (FRACTION, pas des px : 0 caché sous la trappe, 1 sorti ; l'élan/rebond est au plan) ; `o.x` (défaut 720 = **trappe**), `o.s`, `o.cast` | comptoir ivoire à bande rouge, 360 px de large (x 540–900), dessus y 1139 ; caisse x 610 (touches rondes, fanions blancs), plateau de 3 hamburgers x 780 (vapeur), gobelets x 860. `RON.comptoirPt('dessus'|'caisse'|'plateau'|'devant'|'derriere', monte, o)`. Restaurateur derrière : `FEETB`, x ≈ 790, `dir:-1` ; client devant : `FEET`, x ≈ 520, `dir:1`, `paie` avec `cible` ≈ `[640, dessus − 30]` |
Vignette de téléphone (270 × 480) : studio habité dans les deux états (page 9,97 de la planche).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'RON\.' casting/scene.js`). Les trois appels les plus utiles :
```js
// P2 : émission de Bozo, enfants sur le banc, caméraman, panneau accroché
RON.studio(t, 0, { cirque: 1, bancs: true, antenne: 1 }); M.drawFloor(); RON.studioSol(t, 0);
RON.panneau(RON.STUDIO.cirque.cx, 520, 0.9, { fils: true });
RON.enfant({ t, tenue: 'a', assis: 1 }, 690, FEETB, 0.82, { dir: -1, slot: ST.slotB, cast });
RON.cameraman({ t, lampe: 1 }, 140, FEET, 0.86, { dir: 1, cast });
RON.scott({ t, costume: 'bozo', salut: 1 }, 560, FEET, 0.9, { dir: -1, cast });
// P4 : comptoir sorti de la trappe, la mère paie par-dessus
RON.resto({ t, encaisse: 1 }, 790, FEETB, 0.88, { dir: -1, slot: ST.slotB, cast });
RON.comptoir(t, M.easeOut((t - 1) / 1.2), { cast: { a: 0.3, dx: 14, dy: 6 } });
RON.parent({ t, tenue: 'mere', paie: 1, cible: [650, RON.comptoirPt('dessus')[1] - 30] }, 500, FEET, 0.86, { dir: 1, cast });
// P5 : le dirigeant mesure le ventre de Scott-Ronald
const rS = RON.scott({ t, costume: 'ronald' }, 620, FEET, 0.9, { dir: -1, cast });
const rD = RON.dirigeant({ t, mesure: 1, cible: RON.ventrePt(rS) }, 390, FEET, 0.9, { dir: 1, cast }); RON.ruban(rS, rD);
```
