# persos.md — « Faire grève, quand c'était chercher du travail » : mode d'emploi de `persos.js`

Espace de noms : `M.grv` (alias `const GRV = M.grv;`). Dans `S.init` : `GRV.init()` (pré-rendus : façades, port, quai, abri, mobilier, toiles de fond, tapis de sol, coupe → `GRV.K`).
Rien n'est repris de la bibliothèque : aucune pièce existante ne convenait (comparaisons faites, voir la fin). Repères : `(x,y)` = pieds d'une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle conseillée.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `GRV.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). `GRV.nom.pose(p)` = pose finale sans dessiner, `GRV.nom.def(p)` = la définition (pour `M.ik`, `M.partMatrices`). Passer `t` dans la pose (marche, gestes animés).
Pièces communes : `armB_up armB_lo objetB legB legB_lo footB legF legF_lo footF head torso armF_up armF_lo objet doigts doigtsB charge chargeDos` (genoux et chevilles articulés : `ang.legF_lo` > 0 plie le genou, `ang.footF` > 0 lève le talon).

Options communes (0..1 sauf mention) :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'pelle' 'maillet' 'scie' 'marteau' 'varlope' 'truelle' 'canne' 'carnet' 'crayon' 'dossier' 'ble' 'charbon' 'foin' 'tonneau' 'parchemin' 'livre'` ; `tenuO` / `tenuBO` = options de l'objet. `droit` (true par défaut si un objet est tenu : il reste droit à l'écran) ; `ang.objet` le tourne. `deuxMains` : seconde main sur la seconde prise (pelle, sacs).
- `handF` / `handB` : `'fist' 'open' 'cup'` (`cup` = paume ouverte vers le haut) ; `face` : `{ brow, mouth, eyes }`.
- Gestes : `marche` (+ `t`, `cadence` 6) ; `attendre` (poids sur une jambe, mains jointes devant le ventre) ; `pointes` (sur la pointe des pieds, talons levés, menton levé) ; `leve` (bras levé presque vertical, main ouverte : « moi ! ». Jamais le bras tendu à 45° : se lirait comme un salut interdit) ; `tendre` (main tendue paume ouverte, demande) ; `epaules` (haussement : avant-bras ouverts, paumes en l'air, sourcils levés) ; `hanche` (poing avant sur la hanche, coude en arrière) ; `menton` (main au menton) ; `essuie` (s'essuyer le front, anime avec `t`) ; `soupir` ; `surpris` ; `penche` −1..1 (tête qui penche) ; `croise` (avant-bras repliés devant la poitrine : **se lit mal de profil, préférer `attendre` ou `hanche`**).
- `assis` 0..1 + `siege` (hauteur locale du siège : 100 défaut = le caillou à `s` 1,1, le bas de l'habit le recouvre ; 56 = assis par terre sur le gravier) + `pieds` (avance des chevilles, défaut 84, 150 si siège bas) ; mains sur les genoux sauf `mainsGenoux:false` ou objet tenu.
- Outils : `epaule` (avec `tenu` pelle / maillet / marteau : outil posé sur l'épaule, main devant la poitrine) ; `poserOutil` 0..1 (avec `tenu` outil : 0 tenu couché devant la ceinture → 0,6 penché, outil couché au sol → 1 relevé, mains libres ; outil au sol en `x + dir·solX·s` (solX 130 défaut) : après 1, ne plus passer `tenu` et dessiner `GRV.outil(nom, …)` couché, angle et hauteur par `GRV.solOutil(nom)` → `{ang, dy}`).
- Point nommé de l'objet tenu : `GRV.pt(r, 'nom', arriere)` → `[x,y]` écran (pelle `lame` `bout` ; maillet / marteau `tete` ; scie `avant` `lame` ; varlope `avant` ; truelle `pointe` ; canne `pommeau` `embout` ; carnet `page` ; crayon `mine` ; sacs `col`).

| Fonction | Échelle, taille | Pièces en plus | Options propres |
|---|---|---|---|
| `GRV.lea` (Léa, aujourd'hui) | 0,9 ≈ 464 px (chignon) | `cheveux chignon echarpe sac` ; montre peinte au poignet avant | `montre` (poignet avant devant la poitrine, tête baissée vers lui) ; manteau camel, écharpe rouille, jean, baskets |
| `GRV.hugo` (candidat) | 0,9 ≈ 461 px | `cheveux` | dossier ocre **sous le bras avant par défaut** (`sousBras:false` pour l'ôter ; avec un `tenu` il disparaît aussi) |
| `GRV.batelier` | 0,9 ≈ 470 px (bonnet) | `bonnet` (rond à revers, PAS phrygien) | `porter` `'ble'|'charbon'|'foin'` (sac sur le dos, tenu par-dessus l'épaule) + `poser` 0..1 : 0 dos → 0,35 devant la poitrine → 0,72 penché, sac au sol → 1 relevé. Sac posé en `x + dir·GRV.SAC_SOL·s` (104) : ensuite `GRV.marchandise(nom, x + dir*104*s, y, s)` ; `porterO` = options du sac ; `essuie` |
| `GRV.jacques` (`epoque:1750` défaut \| `1840`) | 0,9 ≈ 479 px (chapeau) | `chapeau` (rond à bord mou), 1750 : `besace` | même visage et même chapeau ; 1750 veste verte rapiécée + culotte ; 1840 blouse bleue `#3F5A7A`. Outil 1750 : `tenu:'pelle', epaule:1` ; 1840 : `tenu:'truelle'` |
| `GRV.martin` (costaud) | 0,82 ≈ 436 px | `casquette` (toile beige-gris), `tablier` (cuir fauve, de la taille aux genoux) ; barbe noire | `tenu:'maillet'` (+ `epaule`) |
| `GRV.paulin` (jeune) | 0,78 ≈ 417 px | `cheveux` (un épi), `foulard` bleu ; sabots | `tenu:'scie'` (égoïne) |
| `GRV.patron` (embaucheur) | 0,9 ≈ 473 px (tricorne) | `perruque catogan tricorne` (galon doré) ; ventre, jabot | tient la **canne d'office** (main avant, embout au sol devant lui) ; `designe` 0..1 (la main glisse vers l'embout, le pommeau pointe devant lui à hauteur de poitrine ; `GRV.pt(r,'pommeau')`) ; `menton` (la canne passe dans la main arrière, plantée) ; `tenu:'rien'` = mains nues |
| `GRV.ouvrierA` (1840) | 0,8 ≈ 408 px | `moustache` grise, `casquette` plate sombre ; blouse `#556E8C`, ceinture | `tenu:'marteau'` (+ `epaule`, `poserOutil`) |
| `GRV.ouvrierB` (1840) | 0,8 ≈ 421 px | `casquette` brune haute ; collier de barbe châtain ; blouse `#2F4560` | `tenu:'varlope'` (+ `poserOutil`) |
| `GRV.gendarme` | 0,9 ≈ 508 px (shako) | `moustache shako pompon` ; habit `#23324F`, parements rouges, baudrier blanc, bottes | sourcil froncé par défaut ; `note` 0..1 (sort le carnet de la ceinture vers la poitrine, main arrière ; crayon dans la main avant qui griffonne avec `t`, tête baissée). Ranger = ramener `note` à 0 |

`bendSign` de `M.ik` (vérifié page 10 de la planche, cibles devant la poitrine et la taille, aucune ligne ATTENTION) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| tous (lea, hugo, batelier, jacques 1750/1840, martin, paulin, patron, ouvrierA/B, gendarme) | 1 | 1 | 1 | 1 |

Usage : `const q = GRV.jacques.pose(p), def = GRV.jacques.def(p), sol = M.ik(def, q, x, y, s, dir, 'armF', [tx,ty], 1); q.ang.armF_up = sol.up; q.ang.armF_lo = sol.lo; M.puppet(def, q, x, y, s, {dir, slot, cast});` (garder les mêmes `x,y,s,dir`). Les gestes de l'enveloppe font déjà leur IK interne (coude toujours plié vers l'avant).

Pièges :
- Le batelier en `poser` 0–0,3 : le sac passe au-dessus de la tête (bascule devant à 0,15 environ) ; ne pas s'arrêter entre 0,1 et 0,3.
- `poserOutil` commence outil **couché** dans la main (tête vers l'avant) : passer de `tenu` simple à `poserOutil:0` fait tourner l'outil d'un coup ; enchaîner directement depuis `poserOutil:0`.
- Jacques assis sur le caillou : caillou à `s` 1,1 en `x + dir·2`, dessiné AVANT Jacques (son habit le couvre en partie ; le caillou reste lisible par ses yeux si on le décale de `dir·(−20)`).
- `leve` + `pointes` = « se faire voir » ; ne pas abaisser `leve` vers l'horizontale (salut).
- Hugo garde son dossier même avec `tendre` (il tend la main libre).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille (échelle conseillée) | Options |
|---|---|---|---|
| `GRV.caillou(x,y,s,o)` | milieu du dessous | 130 × 95 à 1 ; **1,1 sur scène** (143 × 105 px) | `lid` 0..1 (paupières) ; `humeur` −1 content (sourcils arqués, petit sourire) … 1 vexé (sourcils en V) ; `regard` `[dx,dy]` −1..1 (pupilles) ; `sursaut` 0..1 (bond, sommet à 0,5) ; `dort` (paupières closes, respiration, bulle de souffle sans lettre qui gonfle et éclate, période 2,6 s : passer `t` GLOBAL `M.tg(t)`) ; `noirci` 0..1 (après le charbon). Points : yeux `GRV.CAILLOU.yeux` [20,−57] local |
| `GRV.toue(x,y,s,o)` | ligne de flottaison, milieu | 520 × 300 (mât) à 1 | `cargo` : liste de 4 places, de la poupe (x −190) à la proue (x 190), ordre x −190, −95, 95, 190 ; parmi `'foin' 'ble' 'tonneau' 'charbon'` (ou `null`) ; `mat` (true) ; `t` (tangage) |
| `GRV.marchandise(nom,x,y,s,o)` | milieu du bas | 0,9 : foin 115 × 77, sac 100 × 155, tonneau 86 × 112 | `nom` `'foin' 'ble' 'charbon' 'tonneau'` ; tonneau `couche:true` + `roule` (rad) = vu par le fond, qui roule |
| `GRV.outil(nom,x,y,s,o)` | bas de l'outil (pelle : bout de la lame) | 0,9 : pelle 355, maillet 165, scie (égoïne) 245, marteau 168, varlope 210, truelle 175 px | couché au sol : `o.rot = GRV.solOutil(nom).ang`, `y + GRV.solOutil(nom).dy·s` |
| `GRV.parchemin(x,y,s,o)` | centre | 1 : roulé 208 × 46, déroulé 208 × 266 | `deroule` 0..1 ; ruban + gros sceau de cire rouge, lignes ondulées grises (aucune lettre) |
| `GRV.livre(x,y,s,o)` | centre | 1 : 204 × 262 | bleu nuit, médaillon doré : Marianne de profil (chignon, laurier, sans bonnet), liseré tricolore, aucune lettre |
| `GRV.carnet` / `GRV.dossier` / `GRV.canne` | centre / centre / pommeau | 1 : 88 × 60 / 104 × 72 / 256 | — |
| `GRV.abri(x,y,s,o)` | sol | 1 : 428 × 556 (+ poteau à x+240, disque à y−580) | `o.cast` ; abri vitré, banc (assise y−120·s, de x−160 à x+40), plan de quartier sans texte |
| `GRV.coupe(t,x,y,s,o)` | milieu du DESSUS des pavés | 1 : 700 × 268 (pavés 60, gravier 200) | `caillou` (défaut `{dort:true}` en x+120·s, dans le gravier ; `false` pour l'ôter ; `{x, s, lid, dort, noirci}`) |

## Décors (fonctions pures de `t` LOCAL, ambiance en temps global ; à dessiner avant `M.drawFloor()`)
| Appel | Couches et animations | Repères utiles |
|---|---|---|
| `GRV.aujourdhui(t, {abri, bus, pigeonAbri})` puis, après `M.drawFloor()`, `GRV.aujourdhuiSol(t, {pigeons})` | Hôtel de Ville néo-Renaissance (horloge à traits dont les aiguilles tournent, 3 drapeaux qui ondulent), parvis, passants lointains, nuages, oiseaux, platanes jaunissants (x 150, 960), feuilles qui tombent, manège (chevaux qui montent et descendent, x 820), lampadaires (x 470, 680), abri de bus (x 230), poubelle (x 560), vélo (x 690), colonne Morris (x 905) ; sol : pavés + 3 pigeons qui picorent | `bus` 0..1 = passage du bus « hors service » au loin (droite → gauche, y ≈ 1196, sans texte, phares éteints) ; `pigeonAbri` 0..1 = pigeon qui se pose sur le toit de l'abri (posé dès 0,7, en x 300, y ≈ 840) ; `abri:false` le retire |
| `GRV.greve1750(t, {facade, facadeDy, port, mouette, tonneau, poule})` → (`GRV.toue(…)`) → `GRV.eauAvant(t)` → `M.drawFloor()` → `GRV.sol(t,'greve')` | ciel du matin + soleil sur son fil, rive d'en face (maisons à pans de bois et fumées, église, pont couvert de maisons), Seine qui scintille, barques qui glissent, mouettes ; eau proche à gauche (x 0–560), berge de sable à droite (galets, flaques, herbes) | **Rive nue** = `facade:0, port:0`. `facade` 0 (cintres) → 1 (en place ; >1 permis pour le rebond) : façade en `GRV.FACADE` (x 760, pied y 1262, 640 × 590, campanile en haut vers y 672), câbles visibles. `port` 0 (sous la trappe) → 1 : port en `GRV.PORT` (x écran = 540 + x, y = 1395 + y) : ponton x 40–440, plancher y 1271 ; pieux en x 90, 270, 400 (sommet y 1209) ; grue à roue x 100–370 (flèche jusqu'à y ≈ 675) ; lanterne x 470 ; sacs x 740–800, tonneaux x 830–950, foin x 1010, brouette x 640–735. `mouette` (sur le pieu x 270), `tonneau` (roule de x 772 à 702 puis s'arrête), `poule` (traverse le haut de la berge, x 1060 → 420, y 1262) |
| `GRV.greve1840(t, {fenetre, chat})` → `M.drawFloor()` → `GRV.sol(t,'quai')` | même Hôtel de Ville, rive d'en face en pierre, cheminée d'usine qui fume (x 192), linge qui sèche à une fenêtre (`M.voilage`), barque, quai empierré à gauche (parapet), escalier, berge et pavés neufs à droite, colonne d'affichage (x 160), réverbères allumés (`M.flamme` : lanterne x 510 y ≈ 823 sur le quai, x 1020 y ≈ 983), charrette à bras (x 840), deux tonneaux (x 700, 748), pigeon sur le parapet, oiseaux | parapet : dessus `GRV.QUAI.parapet` = y 1225 de x 0 à 586 ; `fenetre` 0..1 (un volet s'ouvre en face, x 600 y 930, une tête apparaît) ; `chat` 0..1 (traverse le parapet x 60 → 600) |

Tapis de sol : `GRV.sol(t, 'greve'|'quai'|'pave')` couvre le plancher de y 1393 à ≈ 1440 (les pieds, à `FEET` 1416, posent dessus ; la fente avant reste visible). Le caillou de la vidéo : `GRV.caillou(760, FEET + 6, 1.1, {…})` (devant la berge).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'GRV\.' casting/scene.js`). Les plus utiles :
```js
GRV.init();                                                                     // dans S.init
GRV.greve1750(t, { facade: 1, port: 1, mouette: 1 }); GRV.toue(300, ST.back - 30, 1, { cargo: ['foin', 'ble', 'tonneau', 'charbon'], t: M.tg(t) }); GRV.eauAvant(t);
M.drawFloor(); GRV.sol(t, 'greve');
GRV.caillou(760, FEET + 6, 1.1, { lid: 0.4, regard: [-0.6, -0.3], cast });
GRV.batelier({ t, porter: 'ble', poser: k }, 560, FEETB, 0.84, { dir: 1, slot: ST.slotB, cast });
GRV.patron({ t, designe: 1 }, 620, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });   // GRV.pt(r, 'pommeau')
GRV.jacques({ t, epoque: 1840, tenu: 'truelle', poserOutil: k }, 330, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
GRV.gendarme({ t, note: 1 }, 880, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
GRV.coupe(t, 540, 1420, 0.6, {});                                               // plan 7 : pavés, gravier, caillou qui dort
```

## Comparaisons faites (casting)
Jacques et ouvriers 1840 / `BEN.ouvrier` : Martin avait casquette grise + tablier de cuir à bavette comme le fondeur → casquette beige-gris plus haute, tablier fauve à la taille seulement ; ouvrier B avait des favoris roux comme lui → collier de barbe châtain. Patron / `GDM.patron` : distincts (tricorne, perruque, prune). Gendarme / préfet `POU` et Napoléon : shako noir à pompon rouge au lieu du bicorne, moustache noire, baudrier blanc, bottes. Léa / Marie Curie, Emma, Colette, Madame, Annie : seule en pantalon et manteau court camel.
