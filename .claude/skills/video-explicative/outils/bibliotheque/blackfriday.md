# persos.md — « Le Black Friday, un surnom inventé par des policiers excédés » : mode d'emploi de `persos.js`

Espace de noms : `M.bf` (alias `const BF = M.bf;`). Dans `S.init` : `BF.init()` (pré-rendus `BF.K` : bannière, toiles de fond ancien/auj × jour/soir/nuit, façades 1955/1961/auj jour + nuit, lampadaire, borne, banc, bouche d'incendie, vélos, trottinette, poubelle, marchand de marrons, trottoirs).
Repris de la bibliothèque, à ne pas recréer : `GRV.lea`, `GRV.hugo` (voir `greve.md`). Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle conseillée (mesurées sur la planche).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `BF.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). `BF.nom.pose(p, x, y, s, dir)` = pose finale sans dessiner ; `BF.nom.def(p)` = la définition (pour `M.ik`, `M.partMatrices`). Passer `t` dans la pose (marche, gestes animés). Pour `BF.agent` et `BF.client`, la `variante` se met dans la pose.
Pièces communes : `objetPlat armB_up armB_lo objetB legB legB_lo footB legF legF_lo footF chargeDos head … torso charge armF_up armF_lo chargeAv objet doigts doigtsB` (genoux et chevilles articulés : `ang.legF_lo` > 0 plie le genou).

Options communes :
- `tenu` (main avant) / `tenuB` (main arrière) : `'feuille' 'etiquette' 'registre'` (objets PLATS : dessinés DERRIÈRE la marionnette, main posée sur leur bord gauche, doigts par-dessus) ; `'mouchoir' 'stylo' 'paquet'` ; `tenuO` / `tenuBO` = options de l'objet (mêmes que l'objet seul : `froisse`, `plie`, `arrache`, `vol`…). `droit` (true par défaut avec un objet : il reste droit à l'écran) ; `ang.objet` le tourne.
- `handF` / `handB` : `'fist' 'open' 'cup'` (cup = paume vers le haut) ; `face` : `{ brow, mouth, eyes }`.
- `cible` : point **ÉCRAN** `[X, Y]` pour les gestes qui visent (`arrache`, `tient`, `deroule`, `epingle`, `colle`, `ouvre`, `montre`, `devoile`, `trace`) ; ramené à portée du bras (≈ 172 px à s 0,9 depuis l'épaule). Toujours DEVANT le personnage (sinon coude à l'envers).
- Point nommé de l'objet tenu : `BF.pt(r, 'nom', arriere)` → `[x,y]` écran (feuille `centre` `haut` `bas` ; etiquette `centre` `oeillet` ; stylo `pointe` ; registre `centre`).
- Gestes de la bibliothèque greve aussi disponibles : `marche` (+ `cadence` 6), `attendre`, `leve`, `tendre`, `epaules`, `hanche`, `menton`, `essuie`, `soupir`, `surpris`, `penche`, `assis` (+ `siege`, `pieds`, mains sur les genoux).

| Fonction | Échelle, taille | Pièces en plus | Gestes et options propres (0..1 sauf mention) |
|---|---|---|---|
| `BF.agent` (Kowalski, variante `'a'` défaut) | 0,9 ≈ 481 px (casquette), ≈ 85 px de large | `casquette visiere moustache sifflet siffletP` | `siffle` (sifflet argent à la bouche tenu au poing, joues gonflées) ; `stop` (bras à hauteur d'épaule, avant-bras dressé, paume ouverte vers l'avant, sourcils froncés) ; `circule` (bras avant qui balaie sous l'horizontale, main ouverte, anime avec `t`) ; `essuie` (mouchoir blanc au front, anime avec `t`) ; `epuise` (tête basse, bras ballants, yeux mi-clos) ; `assis` (sur le banc du décor : `siege` 150 par défaut) ; `arrache` (+ `cible` : la main saisit à hauteur de poitrine) ; `tient` (+ `tenu:'feuille'`, `cible` facultative) ; `etiquette` 0..1 (étiquette noire collée sur la calotte, petit rebond à l'arrivée) |
| `BF.agent({variante:'b'})` | **0,96** ≈ 509 px | même uniforme ; rasé, favoris gris, nez long, casquette penchée en arrière | mêmes gestes ; `etiquette` aussi |
| `BF.marchand` (M. Fairbanks) | 0,9 ≈ 457 px, ≈ 120 px de large (ventre) | `cheveux` (noirs gominés, raie) ; lunettes rondes dorées peintes, œillet rouge | `frotte` (mains qui se frottent devant le ventre, `t`) ; `fier` (bras levés en V, poings, menton levé) ; `fige` (sourire qui tombe, sourcils levés, yeux ronds) ; `desespoir` (mains ouvertes au-dessus et derrière la tête, sans la toucher, bouche ronde) ; `deroule` + `tire` 0 (main au-dessus de la tête) → 1 (au-dessus de l'épaule) : tire un cordon ; `epingle` (main ouverte qui plaque, avec `tenu:'feuille'` + `cible`) ; `colle` (main tendue vers le haut et l'avant, `tenu:'etiquette'` + `cible` = casquette de l'agent) ; `applaudit` (`t`) ; `ouvre` (penché, main à plat qui pousse, `cible`) |
| `BF.marchande` (Mme Fairbanks) | 0,9 ≈ 482 px (chapeau), jupe au genou | `cheveux` (roux en rouleaux), `chapeau` (tambourin bordeaux + voilette) ; gants ivoire, perles, escarpins | `outree` (main à plat sur la poitrine, tête en arrière) ; `montre` (bras tendu paume ouverte, `cible`) ; `devoile` + `tire` 0 (bras tendu) → 1 (main ramenée) : tire un drap, poing (`cible` = point de départ) ; `trace` (stylo d'office, sa pointe suit `cible`) ; `applaudit` ; `tient` (`tenu:'registre'` ou `'feuille'`) |
| `BF.client({variante:'a'})` | 0,9 ≈ 473 px | `feutre` brun, `cacheCol` ; pardessus moutarde foncé `#a8741f` | `marche` + `sautille` (petits bonds) ; `porte` (pile de paquets à deux mains, mains aux coins du bas, haut de la pile sous le menton ; `paquets` 1..3, défaut 3) ; `fuit` (pas pressés `cadence` 9,5, penché, yeux ronds ; le demi-tour = changer `dir` dans le plan) ; `queue` (attente debout, mains jointes) ; `tenu:'paquet'` (une boîte pendue à sa ficelle) |
| `BF.client({variante:'b'})` | **0,88** ≈ 468 px (toque) | `toque` et `col` de fourrure ; manteau prune, gants noirs | mêmes gestes |
| `BF.client({variante:'c'})` | **0,86** ≈ 442 px | `casquette` plate, `echarpe` à rayures ; blouson rouge sang | mêmes gestes |

Couleurs des paquets (entières, une par boîte, `BF.PAQ_COL`) : a rouge / bleu / or ; b vert / crème / prune ; c orange / bleu / olive.

`bendSign` de `M.ik` (vérifié page 7 de la planche, cibles poitrine / au-dessus de la tête / taille, aucune ligne ATTENTION) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| agent a, agent b, marchand, marchande, clients a b c | 1 | 1 | 1 | 1 |

Usage : `const p = { t, variante: 'b' }, q = BF.agent.pose(p, x, FEET, 0.96, d), sol = M.ik(BF.agent.def(p), q, x, FEET, 0.96, d, 'armF', [tx, ty], 1); BF.agent(Object.assign({}, p, { ang: { armF_up: sol.up, armF_lo: sol.lo } }), x, FEET, 0.96, { dir: d, slot: ST.slotF, cast });`. Les gestes de l'enveloppe font déjà leur IK interne (coude toujours vers l'avant) : préférer `cible`.

Pièges :
- Jamais de bras tendu à 45° main ouverte (se lirait comme un salut interdit) : `fier` est en poings, `colle` serre l'étiquette (poing) ; `circule` reste sous l'horizontale.
- Un objet plat tenu passe DERRIÈRE le corps : le tenir devant (geste `tient`, `cible` à ≈ 100·s devant la poitrine), sinon il disparaît derrière le torse.
- `porte` : la pile se dessine PAR-DESSUS les bras (seules les mains aux coins du bas se voient) ; avec `porte`, ne pas passer `tenu`.
- `etiquette` sur la casquette : petite (≈ 50 px) ; pour qu'elle porte le gag, la faire arriver depuis la main du marchand (`BF.pt(r,'centre')`) puis passer à `etiquette:1` au contact.
- Agent assis : banc du décor à `BF.MAG.banc.x` ; poser l'agent en `x ≈ BF.MAG.banc.x − 10`, pieds à `FEET`, `assis:1` (siège 150 par défaut, `BF.BANC_SIEGE`).
- La marchande (vert bouteille) et `MC.joueuseB` (vert éteint) ont une teinte proche : ne pas les montrer ensemble.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `BF.feuilleNoire(x,y,s,o)` | centre | 0,9 : 121 × 149 px | `froisse` 0..1 ; `plie` 0..1 (pliée en deux vers le haut) ; `arrache` 0..1 (haut déchiré, trous arrachés) ; `vol` (balancement, avec `t`) |
| `BF.etiquette(x,y,s,o)` | centre | 0,9 : 121 × 70 px ; grande version × 2,5 = s 2,25 (dans le décor auj : s 1,6) | `ficelle` (longueur locale de la ficelle vers le haut, 0 = sans) ; `balance` (rad, oscillation avec `t`) ; œillet à `[-44,0]` local |
| `BF.paquets(x,y,s,o)` | milieu du bas de la pile | 0,9 : 126 × 126 px (3 boîtes) | `n` 1..3 ; `cols` (ex. `BF.PAQ_COL.b`) |
| `BF.registre` / `BF.mouchoir` | bas / bas | 0,9 : 135 × 104 / 45 × 50 | — |
| `BF.voiture(x,y,s,o)` | sol sous le milieu | 1 : 346 × 150 px | `col` `'vert'` (#8fb3a6) `'creme'` (#e6d8b0) `'rouge'` (#8e2f2a) ou hex ; `klaxon` 0..1 (bouffées en volutes devant le capot + sursaut) ; `fumee` (true ou 0..1, pot d'échappement) ; `phares` 0..1 (halo + faisceau) ; `roule` (px parcourus : les roues tournent) ; `cahot` (1) ; `t` ; avant vers +x (`dir`) |
| `BF.banniere(x,y,s,o)` | milieu de la tringle (haut) | 1 : 448 × 330 (toile 420 × 310) ; chevalet p5 : s 0,5 | `deroule` 0..1 (se déroule de haut en bas, rouleau au bas) ; `eclipse` 0..1 (disque noir liseré blanc qui descend et se pose sur le soleil, rayon 74·s, centre `(x, y + 150·s)` = `BF.BAN.soleil`) ; `t` |

## Décor : le grand magasin de Philadelphie (`BF.magasin(t, o)` avant `M.drawFloor()`, `BF.magasinSol(t, o)` juste après)
Couches : toile de fond (ciel d'hiver jour → soir violet → nuit étoilée, immeubles de brique, réservoir d'eau, hôtel de ville à tour en silhouette, tours de verre aujourd'hui, rue transversale en perspective x 960–1080) → façade de pierre (corniche à denticules, 8 fenêtres d'étage, baie centrale, horloge, bandeaux d'enseigne, vitrines, porte, marquise) → premier plan (bouche d'incendie x 178, banc x 700, borne de police x 822 avec l'éphéméride, lampadaire x 884 ; aujourd'hui : vélos x 150, poubelle x 820 à la place de la borne, trottinette x 958). Sol : trottoir, bordure, caniveau à grilles (y 1393–1450), neige tassée en 1955.
Animations (temps global) : nuages, oiseaux, fumées des cheminées, passants au loin, pigeons sur la corniche, aiguilles de l'horloge, poteau de barbier qui tourne, store qui ondule, guirlandes qui scintillent, flocons (1955), téléviseur (1961), néon qui grésille (1961), écran noir animé et étiquettes qui se balancent (auj), halo du lampadaire et de la borne le soir.
Accessoires : 1955 couronnes de houx, guirlandes de houx, sapin décoré, mannequin en manteau, cadeaux empilés, gerbe de blé, dinde de carton, store rayé vert, marchand de marrons au loin (x 1018), poteau de barbier (x 978). 1961 néon (anneaux à rayons, vagues, cercle autour de l'horloge ; aucune lettre), téléviseur, 3 robes trapèze, porte-chapeaux, sacs, radio, store neuf bleu-vert. Aujourd'hui affiches noires (éclat blanc, bande dorée), 2 grandes étiquettes noires suspendues (x 150, 860), guirlandes LED, écran noir, vélos, trottinette.

Options : `epoque` `'1955'` (défaut) `'1961'` `'auj'` ; `nuit` 0..1 (0 jour, 0,5 soir violet, 1 nuit ; fenêtres qui s'allument une à une, vitrines allumées, lampadaire) ; `ephem` 0..1 (page blanche qui se soulève et disparaît → page noire) ; `horloge` (vitesse des aiguilles, 1) ; `porte` 0..1 (battants qui s'ouvrent, intérieur doré) ; `banniere` (`true` ou `{deroule, eclipse}`) ; `etiquettes:false` (auj) ; `neige:false` (1955) ; `borne:false` ; `premierPlan:false`. Événements : `pigeon` 0..1 (pigeon qui vient se poser sur la marquise, posé dès 0,75, en x 540 y 902) ; `marrons` 0..1 (bouffée du marchand de marrons) ; `clignote` 0..1 (le néon s'éteint deux fois puis revient) ; `vague` 0..1 (LED : vague de gauche à droite). `BF.magasinSol(t, { epoque, nuit })` : même `epoque` et `nuit`.

Repères `BF.MAG` (y écran) :
| Clé | Valeur |
|---|---|
| `corniche` | dessus y 452 (pigeons), x 0–960 |
| `banniere` | tringle `{x:480, y:476}` : `BF.banniere(480, 476, 1, …)` descend jusqu'à y ≈ 786 |
| `horloge` | `{x:480, y:846, r:32}` |
| `marquise` | x 372–588, dessus y 904, bas y 952 |
| `porte` | x 402–558, haut y 962, bas 1395 (`x` 480) |
| `vitrines` | `[{x0:60,x1:330,y0:992,y1:1318}, {x0:640,x1:930,…}]` |
| `enseigne` | bandeaux y 898–940 (x 40–352 et 608–920) |
| `banc` | x 700 (636–766), assise y 1286, dossier y 1240 |
| `borne` | x 822, haut y 948, boîte [778, 960, 866, 1072] |
| `ephem` | x 822, y 1080–1250, largeur 130 ; `haut` [822, 1096] (où la main saisit), `centre` [822, 1170] |
| `lampadaire` | x 884, globe `lampe` [884, 668] |
| `zone` | personnages x 250–780, y 900–1430 : rien n'y est posé devant |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'BF\.' casting/scene.js`).
```js
BF.init();                                                                       // dans S.init
BF.magasin(t, { epoque: '1955', nuit: 0.8, ephem: 1 }); M.drawFloor(); BF.magasinSol(t, { epoque: '1955', nuit: 0.8 });
BF.agent({ t, arrache: 1, cible: BF.MAG.ephem.haut }, 710, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
BF.agent({ t, assis: 1, epuise: 0.6 }, BF.MAG.banc.x - 10, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
BF.client({ t, variante: 'a', marche: 1, sautille: 1, porte: 1 }, x, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
BF.marchand({ t, colle: 1, tenu: 'etiquette', cible: capPt }, 620, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
BF.magasin(t, { epoque: '1961', banniere: { deroule: k, eclipse: e } });
BF.voiture(330, FEET + 4, 0.9, { col: 'rouge', phares: 1, klaxon: kk, roule: x, t, cast });
```
