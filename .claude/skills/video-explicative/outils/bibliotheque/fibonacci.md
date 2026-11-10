# persos.md — « La suite de Fibonacci, née d'un problème de lapins » : mode d'emploi de `persos.js`

Espace de noms : `M.FIB` (= `M.fib` ; dans `scene.js` : `const FIB = M.FIB;`). Dans `S.init` : `FIB.init()` (pré-rendus du cabinet : ciel jour/soir, ville, mur, meubles, sol, enclos ; renvoie `FIB.K`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle conseillée (mesurées sur la géométrie, vues sur la planche).
Planche : `casting/scene.js`, une page par demi-seconde : 0 planche · 0,5 cabinet jour + Leonardo écrit · 1 cabinet soir + enclos + 16 lapins · 1,5 enclos qui monte, pigeon, volet · 2 / 2,5 gestes Leonardo dir 1 / −1 · 3 / 3,5 gestes marchand · 4 `M.ik` · 4,5 bras 0→2,4 + marche · 5 / 5,5 comparaisons · 6 tenues · 6,5 lapins · 7 poses · 7,5 livre · 8 accessoires · 8,5–8,97 prises en gros plan · 9 téléphone · 9,5 bras levés en grand.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` au rang du fond)
Toujours par l'enveloppe `FIB.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`, `o.rod`). Elle prépare la pose (gestes, objet tenu, seconde main) et renvoie `r` : `r.w('pièce', x, y)` = point écran, `r.q` = pose finale, `r.main` / `r.mainB` = poing avant / arrière (écran). Pose seule : `FIB.leonardoPose(pose, x, y, s, dir)` / `FIB.marchandPose(...)` ; défs : `M.chars.fibLeonardo`, `FIB.marchandDef(tenue)`.

Options communes (les deux marionnettes partagent le même jeu de gestes ; chaque geste = réglage 0..1 lissé par `ease`, à piloter par `smooth(t0, t1, t)`) :
- **Toujours passer `t`** (marche, tapotements, plume qui griffonne, cornette, souffle du soupir).
- `tenu` / `tenuB` : `'rien'` | `'plume'` | `'livre'` | `'registre'` | `'bourse'` | `'sceau'` | `'balance'` | `'pieces'` ; `tenuO` / `tenuBO` = options de l'objet (les mêmes que l'accessoire seul) + `echelle` (livre 0,72 et registre 0,9 par défaut dans la main) + `prise` (livre, registre : `'tranche'` = main sur le bord libre, défaut ; `'bas'` = main sous le bas).
- `droit` / `droitB` : `true` d'office avec un objet (il reste droit à l'écran) ; `ang.objet` le tourne. `deuxMains` (true ou 0..1) : la main arrière va sous le bas du livre / registre (mis d'office par `presente` et `lit`).
- Livre et registre tenus sont dessinés devant le torse mais **derrière les bras** ; les doigts passent par-dessus le bord (main avant) et sous le bas (main arrière).
- `cible` / `cibleB` : point **écran** `[X, Y]` (converti avec les mêmes `x, y, s, dir`). `atteint` + `cible` : la main avant (ou `bras:'B'`) va sur la cible ; `ptCible: 'pointe'` (etc.) y amène un point de l'objet tenu ; `pick` `'bas'` (défaut, coude en bas) | `'avant'`.
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'half'|'closed'|'wide' }` (un geste ne remplit que les champs vides) ; `ang`, `tilt`, `dx`, `dy` comme le kit.
- Point écran de l'objet tenu : `FIB.pt(r, 'nom')` (main arrière : `FIB.pt(r, 'nom', true)`). Points : plume `pointe` `bout` ; livre `centre` `haut` `base` `dos` `tranche` ; registre `centre` `rabat` `base` ; bourse `centre` `bouche` ; sceau `empreinte` ; balance `gauche` `droite` (plateaux) `pivot` ; pieces `haut`.

| Geste | Effet |
|---|---|
| `marche` | jambes (Leonardo) ou robe qui sautille (marchand), bras balancés ; glisser `x` soi-même |
| `ecrit` + `cible` | plume d'office ; la **pointe** va sur la cible et griffonne ; tête vers la cible ; main arrière ouverte devant la taille (ou sur `cibleB`) |
| `presente` | livre d'office, tenu à deux mains devant la poitrine (main avant sur la tranche, l'autre dessous) ; avec `tenuO.ouvert:1` il descend un peu pour garder le visage libre |
| `brandir` | livre levé au-dessus de la tête, tenu par le bas, bras en V, menton levé, sourire |
| `joie` | bras en V mains ouvertes, menton levé, sourire, petits sauts (`saut:false` les arrête) |
| `soupir` | tête basse, épaules tombées, yeux fermés, bouche « o », petit souffle blanc devant la bouche |
| `regarde` + `cible` | la tête se tourne vers la cible (±0,55 rad) |
| `compte` + `cible` | main avant ouverte qui touche les jetons (tapote ; chez le marchand elle **pousse** d'avant en arrière), main arrière posée devant (`cibleB`) ; défaut : devant, à la ceinture |
| `lit` | registre ouvert d'office, à deux mains devant le ventre, tête penchée, yeux mi-clos |
| `surprise` | recul, deux mains ouvertes levées devant, yeux ronds, sourcils levés, bouche « o » |
| `baille` | menton levé, main avant ouverte devant la bouche grande ouverte (l'œil reste libre), yeux fermés |
| `claque` + `cible` | main ouverte qui descend de 120 unités sur la cible (bord d'un registre posé), sourcils froncés |
| `mefiance` | buste en recul, deux mains ouvertes devant la poitrine, sourcils froncés, yeux mi-clos, bouche serrée |
| `tient` | avance la main qui tient l'objet (balance levée à hauteur de poitrine, plateaux pendants ; bourse, sceau devant le ventre ; registre / livre fermé devant soi) |

| Fonction | Échelle, taille | Pièces en plus | Particularités |
|---|---|---|---|
| `FIB.leonardo` (`C.fibLeonardo`) | 0,9 (défaut) ≈ 461 px (haut de la coupe au bol), ≈ 80 px de large | `cheveux` (coupe au bol châtain foncé), `bonnet` (`pose.bonnet:true` : petit bonnet de feutre vert éteint), `bourseC`, `ecritoire` (pendus à la ceinture), `souffle` | jeune, glabre, cotte bleu ardoise #3f5566 aux genoux, col rond ivoire, chausses ocre, souliers pointus ; `handLen` 96 |
| `FIB.marchand` (`FIB.marchandDef(tenue)`) | 0,9 (défaut) ≈ 459–479 px selon la coiffe ; ≈ 100–125 px de large en bas de la robe (`florentin2` ≈ 85) | `souliers`, `cornette` (pisan), `barbe` (pere ; moustache pisan2), `lien` (pere), `coiffe` | **robe longue : pas de jambes** ; `tenue` ci-dessous ; `carrure` (0,7–1,3 ; défaut de la tenue) ; `voute` 0..1 (défaut 1 pour `florentin2` : buste penché, tête avancée) |

Tenues du marchand (couleur entière) : `'pere'` Guglielmo, robe brun tabac, coiffe blanche nouée sous le menton, barbe grise courte, sceau à la ceinture (463 px) · `'pisan'` chaperon rouge sang à longue cornette, robe vert éteint, bourse, rond (`carrure` 1,12 ; 472 px) · `'pisan2'` bonnet plat ocre, robe bleu nuit, moustache (465 px) · `'florentin'` changeur : bonnet noir rond, robe bordeaux bordée de fourrure, chaîne d'or, besicles, le plus rond (1,18 ; 479 px) · `'florentin2'` calotte brune, robe gris ardoise, tablier vert, maigre et voûté (0,78 ; 459 px).

**bendSign de `M.ik`** (page 4 : cibles haute / devant / basse, croix rouges ; aucune ligne « ATTENTION » au rendu) — aussi dans `FIB.BEND` :
| Personnage | bras avant `dir 1` | bras avant `dir −1` | bras arrière `dir 1` | bras arrière `dir −1` |
|---|---|---|---|---|
| `leonardo` | 1 | 1 | 1 | 1 |
| `marchand` (toutes tenues) | 1 | 1 | 1 | 1 |
Usage : `const q = FIB.leonardoPose({ t }, x, FEET, 0.9, dir); const sol = M.ik(C.fibLeonardo, q, x, FEET, 0.9, dir, 'armF', [X, Y], 1); q.ang.armF_up = sol.up; q.ang.armF_lo = sol.lo; M.puppet(C.fibLeonardo, q, x, FEET, 0.9, { dir, slot: ST.slotF, cast });` — mais les options `cible` / `atteint` le font déjà.
Portée de la main : ≈ 175 px depuis l'épaule à 0,9 (épaule à `y − 345`). Cible éprouvée : Leonardo écrit au pupitre à **x 420, dir −1, `FEET`, 0,9**, `cible: FIB.CAB.pupitre.ecrit`.

Pièges :
- Le livre ouvert tenu (`presente` + `ouvert:1`) couvre tout le buste : visage libre, mais ne pas le mettre devant un autre personnage. Ouvert (échelle 0,72) tenu par Leonardo à 0,9, il fait ≈ 255 × 165 px à l'écran.
- `claque` / `atteint` sur le rabat d'un registre : la main ne suit que si le registre est à portée (≤ 170 px de l'épaule) ; ouvert à fond, son bord libre est à gauche du dos du livre.
- Le marchand n'a pas de jambes (`def.libre` sur les jambes : robe) ; il « marche » en sautillant sur sa tige.
- `pisan2` (bleu nuit) et Leonardo (bleu ardoise) sont les deux bleus : la coiffe (bonnet plat ocre + moustache) et la robe longue les séparent ; éviter de les coller en ombre.

## Les lapins — `FIB.lapin(x, y, s, o)` (sans tige ; `def.libre` : animal) ; `(x,y)` = sol sous le corps
À `s` 1 : assis ≈ 160 px de haut (oreilles comprises) × 135 px de long ; dressé ≈ 185 px ; couché ≈ 95 px. Oreilles articulées.
Options : `couleur` `'a'` brun · `'b'` gris · `'c'` blanc · `'d'` roux · `'e'` noir · `'f'` fauve · `'g'` pie noir et blanc · `'h'` gris bleuté ; `pose` `'assis'` (défaut) | `'bond'` + `phase` 0..1 (0 = appel, nez levé ; 0,5 = en l'air, 66 unités plus haut ; 1 = réception) | `'grignote'` (tête basse, brin de trèfle, mâchoire qui bouge) | `'dresse'` (debout sur les pattes arrière) | `'couche'` (aplati, oreilles rabattues) ; `oreilles` 0 (rabattues) … 1 (dressées) ; `vieux:true` (barbe blanche, sourcil blanc, oreilles tombantes, canne ; pose `dresse` par défaut) ; `t` (nez, oreilles, mâchoire) ; `seed` (désynchronise les lapins) ; `dir` ±1 ; `ombre` (ombre au sol, défaut vrai) ; `cast` ; `alpha` ; `rot`.
Gambade : `phase = FIB.bondPhase(t, 0.45)` puis avancer `x` pendant le vol (`phase` 0,1–0,9) d'environ une longueur de corps par bond (non mesuré : à régler dans le plan).

## Accessoires (sans tige : ils volent) — même dessin que tenus en main
`FIB.objet(x, y, s, o)` renvoie `r` ; `r.pt('nom')` = point écran (mêmes noms que `FIB.pt`). `o.dir`, `o.rot`, `o.alpha`, `o.cast`, `o.ombre`.
| Fonction | `(x,y)` = | Taille à `s` 1 | Options |
|---|---|---|---|
| `FIB.livre` | bas, milieu de l'étendue (glisse de 95 px à l'ouverture) | fermé 210 × 255 (pavé : tranche crème) ; ouvert 392 × 252 | `ouvert` 0..1 (la couverture tourne sur le dos) ; `motif` `'colonnes'` (lignes ondulées + enluminure dorée) \| `'monnaies'` (pièces + balance à l'encre) \| `'lapins'` (lapins dans un enclos + **arbre de points** 1-1-2-3-5-8, `rangs` 0..6, fractionnaire = la dernière branche pousse) ; `echelle` |
| `FIB.registre` | idem | fermé 140 × 172 (vélin, lacets) ; ouvert 270 × 175 | `ouvert` 0..1 ; point `rabat` = bord libre qui tourne (la main le suit) |
| `FIB.abaque` | milieu du bas | 308 × 154 (cadre bois, tapis vert à 5 lignes) | `n` jetons (14) ; `seed` ; `chute` 0..1 (les jetons glissent et tombent jusqu'à `sol`, défaut 90 sous la base) ; `pousse` 0..1 (le jeton `jeton`, défaut 0, glisse de 44) ; point `jeton` |
| `FIB.balance` | pied au sol (`pied` vrai seul ; tenue : pendue à l'anneau) | 200 × 220 | `incline` −1..1 ; `gauche`, `droite` = pièces dans chaque plateau |
| `FIB.pieces` | bas de la pile | 34 × (5,2·n + 6) | `n` ; `metal` `'or'` \| `'argent'` \| `'cuivre'` ; `seed` |
| `FIB.bourse` / `FIB.sceau` / `FIB.plume` | bas / empreinte / prise | 72 × 70 / 36 × 68 / 160 de long | bourse : `t` (balance) |
Pièces et jetons sont des disques **pleins** (losange frappé pour les pièces) : jamais un rond vide qui lirait « 0 ».

## Décor : cabinet de Leonardo à Pise (fonctions pures du temps ; ambiances en temps global)
Ordre : `FIB.cabinet(t, up, o)` → `M.drawFloor()` → `FIB.cabinetSol(t, o)` → marionnettes (et lapins de l'enclos, du fond vers l'avant) → `FIB.enclosAvant(t, o)` → `M.stageLight` → `M.rideau` → `M.drawFrame`. `up` = décalage vers le haut (px) ; `cabinetSol` le prend dans `o.up`.
Options (`o`, les mêmes pour les trois fonctions) : `enclos` 0..1 (l'enclos monte de la trappe, `easeOut`) + `enclosT` (instant local où il arrive : petit rebond) ; `soir` 0..1 (ciel orangé, lumière chaude, chandelle plus forte) ; `pigeon` (instant local où il se pose sur l'appui ; il arrive en vol de la gauche 1,4 s avant, puis picore) ; `volet` (instant local où le volet bat) ; `abaque` (`false` = pas d'abaque sur la table, ou options passées à `FIB.abaque`, ex. `{ pousse: k }`) ; `rayon` 0..1 (rayon de soleil, défaut 1).
Toujours en mouvement : nuages, barques sur l'Arno, reflets de l'eau, voilages, flamme de la chandelle, sable du sablier, astrolabe qui oscille, poussière dans le rayon, balance qui oscille, basilic. Aucune tour penchée, aucun chiffre.
Repères `FIB.CAB` :
- Fenêtre géminée x 150–490, arcs à y 432, **appui y 930** (pigeon en (430, 928)) ; volet x 494–624, y 440–924 ; astrolabe (622, 560) ; étagère x 690–964, rayons y 560 / 700 / 840 (rouleaux, registres, coffret).
- **Pupitre** x 196–384, plateau incliné de (204, 1040) à (378, 1098), point d'écriture `CAB.pupitre.ecrit` = (300, 1066) ; encrier + plumes (205, 1000).
- **Table** x 556–904, **dessus y 1170** : chandelle (590 ; flamme y 1086), abaque `CAB.abaque` = (700, 1170, s 0,6 : x 608–792), piles (790 / 818 / 892), balance (852, s 0,6). Coffre ferré x 905–1015 dessus y 1285, sablier dessus (960).
- Sol (`cabinetSol`) : tapis x 280–730 y 1402–1446, tabouret (178, assise 1352), sacs de pièces x 860–960, pot de basilic (990).
- **Trappe / enclos** `FIB.ENCLOS` : x 520–900, sol y 1395 ; planches du fond 140 px, devant 84 px (deux traverses : on voit les lapins entre). Places des 16 lapins (enclos levé, du fond vers l'avant) : `FIB.ENCLOS.places` = `{x, y, s, dir}` (rangs à y 1262, 1302, 1346, 1392 ; s 0,66–0,78) ; **à l'instant t** (suivent la montée) : `FIB.enclosPlaces(t, o)`. Pour remplir peu à peu : `FIB.ENCLOS.ordre` (indices, rang de devant d'abord) ; dessiner les indices retenus **triés** (`.sort((a, b) => a - b)` = du fond vers l'avant). L'enclos couvre le bas de la table (le dessus reste visible).

## Exemples d'appels qui marchent (voir `grep -n 'FIB\.' casting/scene.js`)
```js
FIB.cabinet(t, 0, { enclos: smooth(2, 3.2, t), enclosT: 3.2, pigeon: 5.0 }); M.drawFloor(); FIB.cabinetSol(t, {});
FIB.leonardo({ t, ecrit: 1, cible: FIB.CAB.pupitre.ecrit }, 420, FEET, 0.9, { dir: -1, cast });
FIB.leonardo({ t, presente: 1, tenuO: { ouvert: smooth(4, 4.6, t), motif: 'lapins', rangs: lerp(0, 6, smooth(5, 8, t)) } }, 330, FEET, 0.9, { dir: 1, cast });
FIB.marchand({ t, tenue: 'pisan', mefiance: smooth(1, 1.4, t) }, 760, FEET, 0.9, { dir: -1, cast });
const P = FIB.enclosPlaces(t, o); FIB.ENCLOS.ordre.slice(0, n).sort((a, b) => a - b).forEach((i) => FIB.lapin(P[i].x, P[i].y, P[i].s, { couleur: 'abcdefgh'[i % 8], dir: P[i].dir, t, seed: i })); FIB.enclosAvant(t, o);
```
