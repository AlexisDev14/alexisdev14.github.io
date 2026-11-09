# nintendo.md — « Nintendo, le géant du jeu vidéo né de cartes en papier » : mode d'emploi de `persos.js`

Espace de noms : `M.nin` (dans `scene.js` : `const NIN = M.nin;`). Dans `S.init` : **`NIN.init()`** (pré-rend les trois décors → `NIN.K`) ; pour le garçon, la bibliothèque `petitbateau.js` est déjà chargée.
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle conseillée (mesurées sur la planche).
Planche : `casting/scene.js` (page = instant) : 0 repos + marche · 0.5 objets · 1 / 1.5 comparaisons · 2 / 2.5 Yamauchi dir 1 / −1 · 3 / 3.5 policier · 4 / 4.5 joueurs · 5 mère · 5.5 garçon · 6 bras + `M.ik` · 6.5 prises (s 1,5) · 7 tripot joué · 7.5 salon joué · 8 tripot · 8.5 salon · 9.1 / 9.3 / 9.6 atelier 1889 / 1960 / 1977 · 9.97 vignettes téléphone. Rendu final : 0 ligne « ATTENTION ».
Sources : `persos.js` est assemblé depuis `casting/src/*.js` par `bash casting/src/build.sh` (corriger les sources, pas `persos.js`).

## Marionnettes (avec tige ; slot `ST.slotF` par défaut, passer `slot: ST.slotB` au rang du fond)
Toujours par l'enveloppe `NIN.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`, `o.rod`) : elle prépare la pose et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale ; `r.main` / `r.mainB` = poing avant / arrière). Passer `t` dans la pose.
Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'carte'` `'carteOcc'` `'eventail'` `'tas'` `'boite'` `'planche'` `'feuille'` `'manette'` `'libre'` ; `tenuO` / `tenuBO` = options de l'objet (les mêmes que l'objet seul) + `k` (échelle dans la main ; défaut 1, éventail 0,7, feuille 0,85). `'libre'` = objet d'un seul plan (panier de linge…) : `tenuO: { draw: (o) => {…}, grip: [x,y], p2: [x,y] }` (dessin dans le repère de l'objet).
- `droit` (défaut vrai avec un objet : il reste droit à l'écran) ; `ang.objet` = angle écran voulu (rad). `deuxMains` (true ou 0..1) : la main arrière va sur la seconde prise (boîte : bas du flanc gauche ; planche : poignée ; feuille : coin haut gauche ; manette : poignée gauche).
- `handF` / `handB` : `'fist'` `'open'` `'paume'` (paume en l'air) `'bas'` (main plate vers le sol) ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'half'|'closed'|'wide' }`.
- `cible: [X, Y]` (écran) : point où va la main avant pour le geste qui l'accepte ; sans geste, la main avant y va seule (paume ouverte, ou l'objet tenu).
- `marche` (0..1 ou true, avec `t`). Point nommé de l'objet tenu : `NIN.pt(r, 'nom')` (main avant) / `NIN.pt(r, 'nom', true)` (arrière).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `NIN.yamauchi` (`C.ninYamauchi`) | 0,9 ≈ 465 px (bandeau), 70 px de large | `cheveux` (courts, raie de côté), `moustache`, `bandeau` + `noeud` (hachimaki), `mancheF/B` (manches de kimono) | `bandeau:false` (tête nue) ; `presse` (+ `cible` = poignée de la planche, défaut devant à la taille ; met `tenu:'planche'` vue côté, deux mains, buste penché) + `appui` 0..1 (appuie, ≈ 8 unités plus bas) ; `feuille` (feuille à deux mains par les coins du haut, face au public, devant la poitrine ; `tenuO.encre`) ; `noren` (deux bras levés, poings, menton levé ; `cible` = main avant ; par défaut, à s 0,9 sur `FEET`, les poings montent à y ≈ 916, juste sous la tringle du noren y 900) ; `tend` (tend la boîte à deux mains ; `tenuO.ouvert`) ; `salut` (révérence : buste plié, mains sur les cuisses, yeux mi-clos) ; `marche` |
| `NIN.policier` (`C.ninPolicier`) | 0,9 ≈ 482 px (képi), 75 px | `kepi`, `moustache`, `sabre` (fourreau, jamais tiré) + `poignee`, `sac` + `rabat` | `sac` 0 vide → 1 plein (bosses de cartes) ; `ouvert` 0..1 (rabat levé, bouche noire) ; `rafle` 0..1 (+ `cible` = point de la table d'où part le balayage) : 0 = main plate sur la table, buste penché → 1 = poing dans le sac ; `menton` (penché, poing au menton, yeux plissés) ; `carte` (carte tenue à hauteur d'yeux, devant le visage ; `tenuO.motif`, `k` 0,75) ; `renifle` (carte sous le nez, menton levé, yeux fermés, sourire) ; `fenetre` (buste penché ≈ 17°, deux mains posées devant sur un appui, `cible`) ; `marche` (pas raide, bras presque immobiles) |
| `NIN.gros` (`C.ninGros`, joueur A) | 0,85 ≈ 430 px debout ; assis en tailleur ≈ 250 px | `pipe` (kiseru dans la bouche, qui fume), `coussin` (zabuton), `plie` (jambes repliées) | `pipe:true` ; `assis` (true = tailleur sur coussin ; `'seiza'` ; `'genou'`) ; `leve` 0..1 (se lever par étapes : 0–0,34 assis, penché, mains aux genoux ; 0,34–0,67 à genoux dressé ; 0,67–1 debout avec un bond de 34 unités) ; `cache` (éventail refermé, dos des cartes contre la poitrine, deux mains) ; `contemple` (éventail ouvert devant lui, sourire ; `tenuO: { n, motifs, occ, face }`) ; `attrape` (+ `cible` ; deux mains ouvertes en avant ; avec `tenu:'boite'` il la tient à deux mains) ; `mince` |
| `NIN.maigre` (`C.ninMaigre`, joueur B) | 0,85 ≈ 464 px debout ; à genoux ≈ 300 px | `cheveux`, `queue` (petite queue basse), `bandeau` + `noeud`, `coussin`, `plie` | mêmes options que A ; `assis:true` = **seiza** (à genoux) ; `abat` 0..1 (+ `cible` table) : 0 = carte levée haut → 1 = carte abattue sur la table (met `tenu:'carteOcc'` roi ; `tenuO.enseigne`) ; `montre` (éventail levé face au public) ; `mince` (se fait tout mince : bras collés, menton rentré, yeux ronds — caché derrière A) |
| `NIN.mere` (`C.ninMere`) | 0,9 ≈ 462 px, 62 px | `cheveux` (carré châtain), `col` (col roulé) | `marche` (pas décidé) ; `tend` (+ `cible` : main tendue paume ouverte « donne », sourcils froncés) ; `leve` (tient l'objet très haut, bras tendu ; met `tenu:'manette'`) ; `panier` (objet à deux mains devant les hanches, prises écartées ≤ 110 unités ; `tenu:'libre'`) ; `regarde` (tête baissée vers la carte) ; `hoche` (signe de tête avec `t`) |
| `NIN.garcon` (`C.ninGarcon`) | 0,65 ≈ 323 px | garçon de `petitbateau.js` recoloré : sweat à capuche vert éteint, jean bleu ardoise, baskets | toutes les options de `PB.garcon` (`marche`, `joie`, `effroi`…) + `canape` 0..1 (assis, cuisses à l'horizontale : **siège à y − 95·s**, soit 1318 pour `FEETB` à 0,65) ; `tenu: 'manette'` (deux mains devant la poitrine) + `joue` (pouces et boutons qui bougent) ; `tenu: 'boite'` (deux mains) ; `tenu: 'carte'` + `montre` (carte levée face au public) ; `tenuO` = options de l'objet |

`bendSign` de `M.ik` (vérifié page 6 : cible devant, bras avant et arrière, dir 1 et −1, toutes les marionnettes ; 0 ligne ATTENTION) :
| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Yamauchi, policier, A, B, mère, garçon | 1 | 1 | 1 | 1 |
Exemple : `const q = NIN.merePose({ t })` puis `M.ik(C.ninMere, q, x, FEET, 0.9, dir, 'armF', [X, Y], 1)` → `ang.armF_up/lo`. Enveloppes sans dessin : `NIN.yamauchiPose`, `policierPose`, `grosPose`, `maigrePose`, `merePose`, `garconPose`. Cible toujours DEVANT le personnage.

Pièges :
- Un geste remplace les `ang.armX_*` donnés. Assis (`assis`, `leve` < 0,67) : les jambes sont cachées et remplacées par la pièce `plie` ; garder les mêmes `x, y` (pieds au sol), la tige raccourcit seule.
- Bras arrière : une prise trop proche de l'épaule (objet très large tenu contre soi) replie le coude vers l'arrière → l'avertissement revient. Garder la main avant à ≥ 110 unités devant le torse pour la boîte et la feuille.
- `renifle` et `carte` mettent la carte devant le bas du visage : le visage reste lisible, mais pas en s < 0,6. `contemple` cache un peu le menton de A.
- Policier DEHORS (atelier, plan 5) : `x` ≤ 200 (s 0,78, dir 1), sinon sa tête passe derrière le noren ; `rod:false, floorShadow:false, cast:null` (il est derrière la façade).

## Accessoires (sans tige : ils volent) — même dessin que tenus en main
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre`, `o.t`. Point nommé d'un accessoire seul : `NIN.accPt(r, 'nom')`.

| Fonction | `(x,y)` = | Taille à s 1 | Options ; points nommés |
|---|---|---|---|
| `NIN.carte(x,y,s,o)` hanafuda | milieu du bas | 80 × 128 (s 0,5 sur table = 40 × 64 ; **carte montrée s ≥ 1,5 = 120 × 192**) | `motif` `'cerisier'` `'grue'` `'lune'` `'pin'` `'erable'` `'iris'` `'champignon'` (cerisier + petit champignon rouge à pois) — liste `NIN.MOTIFS` ; `face` 1 face / 0 dos (entre les deux : la carte se retourne) ; `couche` 0..1 (posée à plat) ; points `centre` `haut` `bas` ; prise = bas |
| `NIN.eventail(x,y,s,o)` | pivot (prise) | ≈ 190 × 150 (5 cartes) | `n` (1..8), `motifs` [..], `occ` (cartes occidentales), `face`, `ouvert` 0..1 ; points `centre` `haut` |
| `NIN.tas(x,y,s,o)` paquet | milieu du bas (sur la table) | 80 × (14 + 2,3·n) à s 1 (défaut s 0,6) | `n` (12), `couche` (1 = à plat), `dessus` (motif de la carte du dessus, sinon dos) ; point `dessus` |
| `NIN.boite(x,y,s,o)` boîte à fleurs | milieu du bas | 162 × 92 (+ 76 par étage) | `ouvert` 0..1 (couvercle à charnière qui se relève derrière ; cartes ivoire dedans), `pile` (nombre de boîtes empilées), `cartes:false` ; points `centre` `dessus` `dedans` ; prises : flanc droit / bas du flanc gauche |
| `NIN.carteOcc(x,y,s,o)` | milieu du bas | 50 × 74 | `enseigne` `'coeur'` `'pique'` `'roi'` (aucune lettre ni chiffre) ; `face` ; `couche` |
| `NIN.cartesOcc(x,y,s,o)` | centre, y = dessus de la table | n cartes sur `largeur` px | `n` (8), `largeur` (160), `seed`, `couche` (0,55), `cast` |
| `NIN.planche(x,y,s,o)` | dessous | `vue:'cote'` 160 × 46 (poignée) ; `'dessus'` 160 × 230 | `vue`, `encre` 0..1 (relief encré de rouge) ; points `dessous` `centre` |
| `NIN.feuille(x,y,s,o)` | milieu du bas | 150 × 220 | `encre` 0..1 (les 4 cartes imprimées apparaissent une à une), `motifs` (4), `couche` 0..1 (à plat sur l'établi) ; points `centre` `bas` |
| `NIN.manette(x,y,s,o)` | bas des poignées | 124 × 58 | `joue` (boutons qui s'enfoncent, `t`) |
| `NIN.console(x,y,s,o)` | milieu du bas | 100 × 26 | voyant bleu qui palpite (`t`) |
| `NIN.tele(x,y,s,o)` écran plat | bas du pied | 216 × 164 (écran 206 × 118) | `allume` 0..1, `jeu` 0..1 (défilement des formes ; défaut = temps), `t` ; point `ecran` ; `NIN.ecranJeu(o,x0,y0,x1,y1)` remplit un autre écran |

## Décors (pré-rendus par `NIN.init()` ; `t` = temps local, ambiances en temps global ; `up` = décalage vertical en px)
Ordre : `NIN.lieu(t, up, o)` → `M.drawFloor()` → `NIN.lieuSol(t, { up })` → marionnettes → `M.stageLight` → `M.rideau` → `M.drawFrame`.

**Salon d'aujourd'hui, soir — `NIN.salon(t, up, o)` / `NIN.salonSol(t, o)`** (repères `NIN.SALON`)
Options : `tele: { allume (1), jeu }` ; `lampe` 0..1 (1) ; `chat` `null` / 0..1 (chat gris qui traverse le haut du dossier de droite à gauche, x 660 → 250, y 1150 ; p7 : `smooth(a, b, t)`).
- Télé (238, 1255) (pied), écran x 135–341, y 1091–1214 ; meuble télé x 126–350, dessus y 1255 ; console (238, 1318).
- **Canapé** x 300–620, **assise y 1318** (garçon `canape:1`, s 0,65, pieds `FEETB` 1380, `slot: ST.slotB`), dossier y 1150, milieu x 460 ; coussins rouille et crème, plaid vert sur l'accoudoir droit.
- Fenêtre x 700–900, y 380–1000 (ville du soir, fenêtres qui s'allument une à une, croissant de lune, voilages) ; lampe sur pied abat (676, 968), rayon + poussière ; horloge sans chiffres (600, 330) ; étagère x 380–640 y 600 ; cadres (470, 440) et x 150–330 y 560–700.
- Sol : tapis ocre (520, 1430), coussin tombé (725, 1426), table basse x 812–928 dessus y 1352 (verre de jus), monstera x 930–1010 (feuilles qui balancent).
- Toujours en mouvement : lueur de la télé qui palpite, écran de jeu, voilages, fenêtres lointaines, aiguilles, poussière de la lampe, monstera, voyant de console.

**Tripot de Kyoto, soir — `NIN.tripot(t, up, o)` / `NIN.tripotSol(t, o)`** (repères `NIN.TRIPOT`)
Options : `porte` 0..1 (porte coulissante x 790–965, y 500–1395, glisse vers la droite : ruelle de nuit derrière — entrée du policier) ; `chat` `null` / 0..1 (chat noir en ombre chinoise ≈ 190 px derrière le shoji, gauche → droite) ; `renverse` 0..1 (la coupelle de saké (606, 1270) bascule et se répand).
- **Chabudai** x 400–680, milieu 540, **dessus y 1270** ; A en tailleur x ≈ 330 dir 1, B en seiza x ≈ 770 dir −1, tous deux `FEETB`, s 0,85, `slot: ST.slotB` ; cartes : `NIN.cartesOcc(540, 1270, 0,9)` ; saké (644, 1270) ; plateau de jetons (444, 1270).
- Shoji éclairé x 345–595, y 490–1300 ; tokonoma + rouleau (paysage) x 650–734, y 500–880 ; fenêtre ronde (240, 640) r 86 sur la ruelle (lanternes rouges qui balancent) ; lanterne de papier suspendue (540, 330–420) ; paravent à vagues x 120–262 dès y 930 ; zabutons empilés x 748–852.
- Sol : hibachi + bouilloire qui fume (190, 1440), andon (905, 1440) flamme (905, 1318) + papillon de nuit, sandales x 300–400 y 1450.

**Atelier-boutique de Yamauchi — `NIN.atelier(t, up, o)` / `NIN.atelierSol(t, o)`** (repères `NIN.ATELIER`)
Options : `epoque` 1889 (défaut) | 1960 | 1977 (poteaux électriques dans la rue, ampoule, plus de boîtes) ; `noren` 0 roulé → 1 déroulé (défaut 1) ; `volets` 0..1 (1 = façade fermée par les amado) ; `lanterne` 0..1 (défaut 1 en 1889, 0 après) ; `ampoule` 0..1 (descend des cintres jusqu'à (650, 650) ; défaut 1 dès 1960) + `ampouleT` (instant d'arrivée : rebond) ; `piles` 0..1 (piles de boîtes au sol x 870 et 940 ; défaut 0,15 / 0,6 / 1) ; `moineau` `null` / 0..1 (arrive 0–0,5, se pose sur le fil haut en (690, ≈ 299), sautille) ; `furin` (instant local d'un coup de vent : la clochette (404, 900) et le noren balancent) ; `dehors: (t) => {…}` (dessin d'un personnage DANS la rue, découpé à l'ouverture, derrière la façade et le comptoir).
- **Ouverture de façade** x 132–418, y 420–1395 (rue au sol y 1395) ; linteau y 890 ; **noren** x 264–416, y 900–1080 (Yamauchi `noren:1` à x ≈ 280 dir 1, s 0,9, `FEET` : poings à y ≈ 916 ; `cible: [340, 905]` pour les poser sur la tringle) ; vitrine sans noren x 140–258 (policier dehors x ≈ 180, s 0,78).
- **Comptoir** x 132–300, **dessus y 1220** (soroban, petite balance).
- **Établi** x 520–820, **dessus y 1180**, zone libre x 600–730 (feuille `couche:1` + planche ; Yamauchi x ≈ 560 dir 1 `presse`, `cible: [672, 1172]`) ; pots d'encre x 748–796, pinceaux x 730.
- **Fils des feuilles** : y 300 et 432, x 450–905 ; 10 feuilles imprimées (`NIN.ATELIER.feuilles[i] = {x, y}`) qui se balancent.
- Lanterne de façade (470, 600) ; étagère de boîtes x 850–1004 (y 780, 920, 1060) ; étagère de planches x 600–820 y 900 ; épreuves épinglées (640–760, 700) ; bouilloire qui fume (478, 1395) ; rayon de soleil poussiéreux depuis la façade.
- Sol : bottes d'écorce de mûrier x 130–250, seau d'eau (289, 1382) qui frémit, pile de feuilles x 870–970.

## Exemples d'appels qui marchent (voir `casting/scene.js`, pages 7, 7.5 et 9.1)
```js
NIN.tripot(t, 0, { porte: 0.7 }); M.drawFloor(); NIN.tripotSol(t, {});
NIN.gros({ t, assis: true, contemple: 1, tenuO: { occ: true }, pipe: true }, 330, FEETB, 0.85, { dir: 1, slot: ST.slotB, cast });
NIN.maigre({ t, assis: true, abat: k, cible: [580, 1266] }, 770, FEETB, 0.85, { dir: -1, slot: ST.slotB, cast });
NIN.policier({ t, rafle: u, sac: u, cible: [600, 1264] }, 700, FEET, 0.9, { dir: -1, cast });
NIN.garcon({ t, canape: 1, tenu: 'manette', joue: 1 }, 470, FEETB, 0.65, { dir: -1, slot: ST.slotB, cast });
NIN.atelier(t, 0, { epoque: 1889, noren: 1, dehors: (tt) => NIN.policier({ t: tt, fenetre: 1 }, 180, ST.back, 0.78, { dir: 1, slot: ST.back + 14, cast: null, rod: false, floorShadow: false }) });
```
