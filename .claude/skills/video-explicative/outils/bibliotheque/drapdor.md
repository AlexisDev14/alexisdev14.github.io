# persos.md — « Le camp du Drap d'Or, le sommet perdu à la lutte » : mode d'emploi de `persos.js`

Espace de noms : `M.dor` (alias `DOR` : `const DOR = M.dor;` dans scene.js). Dans `S.init` : `DOR.init()` (pré-rendus `DOR.K` : ciel, plaine et ruines, rang de tentes du fond, 5 tentes, palais + son envers, fontaine, palissade, tribune, tonneaux, panier ; salle : vue de pluie, mur, vitrail, table, banc, seau).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle par défaut (mesurées sur la planche). Plancher : `FEET = ST.slotF - 34` (1416).
Planche : `casting/scene.js` (0 planche, 1 comparaisons, 2 François, 3-4 Henri dir 1 / −1, 5 Charles + bras 0→2,4 rad, 6-7 courtisans dir 1 / −1, 8 prises, 8,5 lutte, 9 camp tentes 0, 9,2 tentes 1, 9,4 palais + fontaine + claque, 9,6 lice, 9,8 salle + vignette, 9,97 vignettes de téléphone).

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `DOR.nom(pose, x, y, s, o)` (`s` = `null` → échelle par défaut ; `o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`, `o.rod`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). **Toujours passer `t`**.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'coupe'` `'chaine'` `'pichet'` `'gobelet'` `'parchemin'` `'plume'` `'toqueF'` `'toqueH'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'accessoire seul).
- `droit` / `droitB` : `true` d'office quand un objet est tenu (il reste droit à l'écran, même couché) ; `ang.objet` / `ang.objetB` le tournent.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (chaîne : l'autre bout ; pichet : sous le fond ; parchemin : rouleau du bas).
- `handF` / `handB` `'fist'` | `'open'` ; `face` `{ brow, mouth, eyes }` (un geste ne remplit que les champs vides) ; `ang`, `tilt`, `dx`, `dy` comme le kit ; `toque: false` ôte la toque (et la plume) ; `assis` ; `marche: 1`.
- `cible` / `cibleB` : point **écran** `[X,Y]` (gestes qui le disent) ; l'enveloppe le convertit avec les mêmes `x, y, s, dir`.
- Point écran : `DOR.pt(r, 'nom')` (main arrière : `DOR.pt(r, 'nom', true)`) ; poing : `DOR.main(r)` / `DOR.main(r, true)`. Points : coupe `bord` `haut` `pied` ; chaine `bas` ; pichet `bec` `fond` ; gobelet `bord` `fond` ; parchemin `haut` `sceau` `bas` ; plume `bec` `haut` ; toqueF `centre` `plume` ; toqueH `centre`.
- Tous les gestes sont des réglages 0..1 lissés par `ease` (les faire varier avec `smooth(t0, t1, t)`).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `DOR.francois` (`C.dorFrancois`) | **0,93** ≈ 479 px sans la plume, 541 px avec ; 148 px de large (plume) | `toque` (de biais), `plume` (enfant de la toque, grande, blanche, retombe derrière), `cheveux`, `barbe` (pointue), `moustache`, `chaineCou` ; jambes `legF`+`legF_lo`, `legB`+`legB_lo` ; souliers « pied d'ours » | `balaie` (revers de main qui balaie l'air ; `balayage` 0..1 = position du revers, sinon va-et-vient selon `t` ; sourire en coin) ; `fier` (bras ouverts en V vers l'avant, mains ouvertes, menton haut) ; `saluer` (révérence : buste plié aux hanches, jambe arrière en retrait, main sur la poitrine, autre main ouverte vers le sol) ; `attrape` (deux mains en avant à hauteur de taille ; `cible`/`cibleB` écran) ; `projette` (bras qui basculent vers l'avant et le bas, buste plié ; `cible`/`cibleB`) ; `chaine` 0..1 (chaîne d'or mise d'office : 0→0,3 levée devant, 0,3→0,5 au-dessus de la tête, 0,5→0,8 descendue sur les épaules, ≥ 0,8 portée et mains qui retombent) ; `porteChaine: true` (chaîne portée, posée sur l'épaule par-dessus la manche) ; `couche` 0..1 (s'allonge sur le dos de lui-même, tige retirée) |
| `DOR.henri` (`C.dorHenri`) | **0,91** ≈ 470 px ; **151 px de large** (manteau en trapèze, fourrure, manches bouffantes) | `toque` (plate, basse, liseré de petites plumes blanches, broche), `cheveux`, `barbe`, `moustache` (roux-or) ; jambes en deux pièces | `defie` (avant-bras levés devant, mains ouvertes qui appellent « viens », selon `t`) ; `coupe` 0..1 (coupe d'or mise d'office : 0 devant la poitrine → 1 levée au-dessus de la tête) ; `bombe` (torse bombé, poings aux hanches, menton haut) ; `auSol` 0..1 (à plat sur le dos, tige lâchée, yeux fermés) ; `seRelever` 0..1 (0 au sol → 1/3 sur le flanc, genoux pliés → 2/3 un genou à terre → 1 debout ; tige revenue dès qu'il est presque droit) ; `epousseter` (main ouverte qui brosse le pourpoint, selon `t`, tête baissée) ; `vexe` (menton haut, yeux fermés, bouche pincée ; pour « se détourner », le plan inverse `dir`) ; `assis` ; `signe` (plume mise d'office ; `cible` = point où va le **bec**, tête baissée ; avec `assis`) ; `serreMain` (bras tendu, main ouverte à hauteur de taille ; `cible`) |
| `DOR.charles` (`C.dorCharles`) | **0,9** ≈ 459 px ; 95 px de large (maigre) | `cape` (courte), `cheveux` (carré à frange), `barbe` (clairsemée), `toque` (noire, sans plume) ; menton prognathe, bouche entrouverte | `verse` (pichet mis d'office, à deux mains, incliné ; `cible` = point où va le **bec** ; `tenuO: { filet: 1, filetY }`) ; `assis` ; `deroule` 0..1 (parchemin tenu à deux mains : rouleau du haut dans la main avant, rouleau du bas dans l'autre, ouverture) ; `serreMain` (`cible`) ; `saluer` (petite inclinaison raide) |
| `DOR.courtisanA` (`C.dorCourtA`) | 0,86 ≈ 451 px | `cheveux` blonds au carré, `toque` rouge ; pourpoint vert | communes aux trois, **pose propre à chacun** : `applaudit` (A au-dessus de la tête, B à la poitrine, C à la taille, lentement) ; `mainsBouche` (mains devant la bouche, yeux visibles ; B : une main à la bouche, l'autre sur la poitrine ; C : l'autre main levée) ; `brasLeves` (A deux mains hautes, B mains à l'épaule et buste en arrière, C une haute une en avant) ; `tire` (corde verticale tirée main sur main ; `tirage` 0..1 sinon selon `t` ; `cible` écran = un point de la corde, donne son x) ; `tientToque` (toque de François mise d'office, à deux mains, plume vers l'avant : A à la taille, B présentée haut, C basse) |
| `DOR.dameB` (`C.dorDameB`) | 0,84 ≈ 428 px | `coiffe` à la française noire bordée d'or + `voile`, `mancheF`/`mancheB` larges ; robe ocre jusqu'au sol (**pas de jambes**) | idem ; `marche` fait onduler l'ourlet |
| `DOR.courtisanC` (`C.dorCourtC`) | 0,86 ≈ 453 px | `toque` (bonnet carré), `barbe` grise, robe longue noire à col de fourrure (souliers visibles) | idem |

Pièges :
- Couché (`couche`, `auSol`, `seRelever` < 2/3) : **`x` = les talons** ; le corps s'allonge vers l'arrière (dir 1 : tête à gauche, à ≈ 460 px des talons pour Henri, ≈ 540 px plume comprise pour François). Le point le plus bas est posé sur `y` ; la tige disparaît (rivet visible). `seRelever` part du même `x` : enchaîner `auSol: 1` puis `seRelever: 0 → 1` sans saut.
- `seRelever` entre 1/3 et ≈ 0,97 pose `libre.legB` : genou arrière à terre, pointe du pied vers le sol (posture vraie ; dispense voulue, aucune ligne ATTENTION).
- `assis` descend le corps de 118 et pose les mains sur les cuisses si aucun geste ne les prend. Dessiner d'abord `DOR.tabouret(x, y, s, { dir })` avec **les mêmes** `x, y, s, dir`.
- Henri fait 151 px de large : centres espacés d'au moins 170 px. La plume de François dépasse de ≈ 60 px au-dessus et derrière la toque.
- Dans un dessin réduit (vignette) : passer `rod: false` (la tige se calcule en coordonnées écran et sortirait du médaillon).
- `chaine` et `coupe` : la main entoure le bout de la chaîne / le pied de la coupe ; ne pas les remettre avec `tenu` en plus.

### La prise de lutte — `DOR.lutte(t, u, o)` → `{ rF, rH, piedsH }`
`u` 0..3 : 0→1 François attrape Henri à la taille (Henri soulevé de 20, buste en arrière, bras qui battent, yeux ronds) ; 1→2 Henri basculé **par-dessus la hanche** (à l'horizontale derrière la hanche de François, jambes en l'air) ; 2→3 posé **à plat sur le dos** devant François (tête du côté opposé), François lâche et se redresse. Aucun coup, la tête d'Henri ne touche rien (corps à plat quand il se pose). Henri dessiné d'abord, François devant.
`o` : `xF` (pieds de François, 400), `xH` (pieds d'Henri au départ, `xF + 210·sH·dir`), `y` (FEET), `sF`, `sH` (0,93 / 0,91), `dir` (1 = François à gauche, regarde à droite), `slot`, `cast`, `poseF` / `poseH` (champs ajoutés aux poses, ex. `face`), `toqueH: false`. À `u = 3` : taille d'Henri à `xF + 300·sF·dir`, tête vers ≈ `xF + 540·dir` (px, échelles par défaut) ; `piedsH` = point écran de ses pieds, à reprendre comme `x` de `DOR.henri({ auSol: 1 })` puis `seRelever`.

### `bendSign` de `M.ik` (vérifié par le calcul de `M.ik` : `lo = −bendSign·(π − a2)`, donc 1 = avant-bras plié vers l'avant dans les deux sens, comme les poses testées pages 2 à 8)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| François, Henri, Charles, courtisans A, B, C (même squelette : épaules `[-2,-146]` / `[-10,-146]`, bras 96, `handLen` 100) | 1 | 1 | 1 | 1 |
Pour un `M.ik` à la main : préparer la pose par `DOR.francoisPose(pose, x, y, s, dir)` (resp. `henriPose`, `charlesPose`, `courtisanAPose`, `dameBPose`, `courtisanCPose`), appliquer `sol.up/sol.lo`, puis `M.puppet(C.dorFrancois, q, x, y, s, o)`. Les gestes internes n'en ont pas besoin (IK propre, coude toujours vers l'avant).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Échelle par défaut 0,9.

| Fonction | `(x,y)` = | Taille (échelle 0,9) | Options |
|---|---|---|---|
| `DOR.coupe(x,y,s,o)` | pied | 150 local → **135 px** (84 de large) | `couvercle` (true) ; `brille` (true : éclat qui scintille selon `t`) |
| `DOR.chaine(x,y,s,o)` | médaillon (bas) | boucle 126 + médaillon → ≈ 125 px | `ecart` (24 : écart des deux bouts) ; `chute` (112) ; médaillon d'or uni |
| `DOR.pichet(x,y,s,o)` | fond | 126 local → 113 px | `filet` 0..1 (filet de vin depuis le bec) ; `filetY` (y écran d'arrivée) ; `liquide` (couleur) |
| `DOR.gobelet(x,y,s,o)` | fond | 66 local → 59 px | `niveau` 0..1 (vin visible au bord) |
| `DOR.parchemin(x,y,s,o)` | bas du rouleau du bas (ouvert) | 116 × 170 local → 104 × 153 px | `ouvert` 0..1 (défaut 1) ; lignes ondulées sans lettre, sceau rouge rond sans motif à rubans |
| `DOR.plume(x,y,s,o)` | bec | 141 local → 127 px | — |
| `DOR.toqueF(x,y,s,o)` | bord bas | 100 × 110 local | `plume` (true) ; `sens: -1` (plume vers l'autre côté) |
| `DOR.toqueH(x,y,s,o)` | bord bas | 100 × 31 local | plumes courtes et broche toujours là ; pour rouler : `o.rot` |
| `DOR.tabouret(x,y,s,o)` | pieds du personnage assis | dessus à 110 local (99 px) | `dir` |

## Décors (fonctions pures du temps, ambiances en temps global)
Ordre : `DOR.camp(t, o)` → `M.drawFloor()` → `DOR.campSol(t, o)` → marionnettes → `DOR.campAvant(t, o)` → `M.stageLight` → `M.rideau(t)` → `M.drawFrame(t)`. Idem salle : `DOR.salle` → `M.drawFloor()` → `DOR.salleMeubles` → marionnettes → `DOR.salleAvant`.

| Appel | Options | Repères utiles |
|---|---|---|
| `DOR.camp(t, o)` — ciel d'été, nuages qui défilent, hirondelles, plaine et collines, **deux châteaux en ruine** (x 168 et 902), cheval qui broute (x 612), feu de cuisine qui fume (x 655), rang de petites tentes au fond, **5 tentes d'or** rondes et pointues (≥ 230 px, bandes différentes, oriflammes à liseré d'or qui flottent), **2 mâts à banderoles**, **guirlandes de fanions** sous les cintres | `tentes` 0..1 (défaut 1 : les 5 tentes et les mâts montent de la trappe, l'une après l'autre) ; `rang` 0..1 (défaut 1 : tentes du fond) ; `reflets` 0..1 (défaut 1 : éclats d'or, vitres qui brillent) ; `palais` 0..1 (palais de toile, briques peintes, grandes fenêtres, descend des cintres sur ses câbles) ; `claque` 0..1 (le coin haut gauche de la façade se soulève et bat au vent : envers de toile et charpente de bois) ; `fontaine` 0..1 (monte de la trappe ; le vin coule à partir de 0,85) ; `affaisse` 0..1 (tentes et mâts s'affaissent, ternissent, fanions qui pendent) ; `lice` (palissade basse au centre + tribune peuplée à gauche) ; `pierre` (instant s : une pierre tombe de la ruine gauche) ; `decroche` 0..1 (l'oriflamme de la tente x 300 se décroche et pend) ; `cheval` (true) ; `guirlande` (true) ; `cast` | `DOR.CAMP` : tentes x 118 / 300 / 528 / 752 / 945 ; mâts x 418, 668 (haut y ≈ 640–700) ; palais x 585–1045 (centre 815), toits y ≈ 675, coin qui claque ≈ (665, 791) ; fontaine x 540, haut y ≈ 995 ; tribune x 0–350 ; palissade x 220–900, haut y ≈ 1290 ; sable de la lice centre (560, 1440) ; zone des personnages x 250–900 dégagée |
| `DOR.campSol(t, o)` | `lice` : sable ovale ratissé sur le plancher | — |
| `DOR.campAvant(t, o)` | — | tonneaux (x 112), panier de pain (x 238), piquets et corde (x 840–1000), bannière (x 960), herbes qui ondulent (x < 300 et > 800) |
| `DOR.salle(t, o)` — murs chaulés tachés d'humidité, poutres et solives, petite fenêtre au vitrail losangé (pluie qui tombe et ruisselle), volet de bois, cheminée modeste (feu, lueur, fumée), étagère à deux écuelles et un pot, patère (cape, besace), herbes sèches pendues, coffre, table de bois nu (chandelle qui brûle, pichet, deux gobelets, sablier qui coule) | `volet` 0..1 (se ferme sur la fenêtre) ; `feu` 0..1 (1) ; `pichet` / `chandelle` / `sablier` (true) ; `gobelets` 0, 1, 2 (2) ; `vin` 0..1 (gobelets pleins) ; `cast` | `DOR.SAL` : table x 400–680, **dessus y 1185** ; tabourets x 330 (dir 1) et 750 (dir −1) ; pichet (520, 1185), gobelets (600 et 636, 1185), chandelle x 432 (flamme y ≈ 1105), sablier x 664 ; fenêtre x 770–910, y 430–650 ; âtre x 112–268 ; étagère y 690 (x 430–612) |
| `DOR.salleMeubles(t, o)` | `tabourets` : `false` ou liste `{x, dir, s}` (défaut les deux de `SAL`) | sur `FEET` |
| `DOR.salleAvant(t, o)` | `souris` (instant s : traverse sous le banc en 1,8 s) ; `goutte` (instant s : la goutte se forme 0,6 s avant, tombe du plafond, touche le seau ≈ 0,95 s après, ronds dans l'eau) | banc (190, 1612), seau (930, 1606), balai x 1000 |

Un lieu dans la vignette (plan 6) : `M.vignette(t, { x, y, rx, ry, t0, draw: (cx, cy, rx, ry) => DOR.dansVignette(cx, cy, ry, 0.5, () => { DOR.camp(t, { affaisse: 1 }); M.drawFloor(); DOR.francois({ t, couche: 1 }, 700, FEET, null, { dir: 1 }); }) })` : `dansVignette(cx, cy, ry, k, fn)` dessine `fn` en coordonnées de scène (plancher `FEET` à `cy + 0,62·ry`, x 540 au centre), réduit de `k`.

## Exemples d'appels qui marchent (voir `grep -n 'DOR\.' casting/scene.js`)
```js
// P3 : le palais claque, Henri lève la coupe, François balaie l'air
DOR.camp(t, { palais: 1, claque: smooth(2.5, 3.2, t), fontaine: 1 }); M.drawFloor(); DOR.campSol(t, {});
DOR.francois({ t, balaie: 1 }, 300, FEET, null, { dir: 1, cast }); DOR.henri({ t, coupe: 1 }, 700, FEET, null, { dir: -1, cast }); DOR.campAvant(t, {});
// P4 : la prise (u de 0 à 3), puis Henri au sol
const L = DOR.lutte(t, 3 * smooth(3.0, 5.4, t), { xF: 330, dir: 1, cast });
// P5 : à la table, Henri signe, Charles verse (tabourets d'abord)
DOR.salle(t, { gobelets: 1 }); M.drawFloor(); DOR.salleMeubles(t, {});
DOR.henri({ t, assis: 1, signe: 1, cible: [470, 1180] }, 330, FEET, null, { dir: 1, cast });
DOR.charles({ t, assis: 1, verse: 1, cible: [612, 1110], tenuO: { filet: 1, filetY: 1150 } }, 750, FEET, null, { dir: -1, cast }); DOR.salleAvant(t, { goutte: 6.0 });
```
