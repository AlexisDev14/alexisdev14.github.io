# persos.md — « Le Teddy bear, l'ours que Roosevelt épargna » : mode d'emploi de `persos.js`

Espace de noms : `M.ted` (dans `scene.js` : `const TED = M.ted;`). Dans `S.init` : `TED.init()` (rien de lourd : aucun pré-rendu).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Planche de référence : `casting/scene.js` (page = instant) : 0 repos + marche dir −1 · 1 et 1,5 comparaisons · 2 / 2,5 gestes Roosevelt dir 1 / −1 · 3 / 3,5 Collier · 4 / 4,5 Morris · 5 / 5,5 Rose · 6 ours · 6,5 chiens · 7 journal 0/0,5/1 + peluche couture 0/0,5/1 · 8 vignettes chambre · 9 / 9,1 prises agrandies · 9,5 bras pliés à fond, brandir, `M.ik` · 9,97 composition sur le bayou. Rendu final : 0 ligne « ATTENTION ».

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `TED.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes) et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale, à passer à `M.ik`).
Options communes (Roosevelt, Collier, Morris, Rose) :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'fusil'` `'corde'` `'cor'` `'aiguille'` `'peluche'` `'journal'` `'rien'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'accessoire seul : `{version}`, `{couture, assis, penche}`, `{tire}`…). Peluche dans la main arrière : `tenuBO.prise:'g'` (sous le bras gauche) ; elle est dessinée DEVANT le corps (`devantB`, défaut vrai pour la peluche).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `ang.objet` / `ang.objetB` = angle écran voulu (rad, + = sens horaire).
- `deuxMains` : `true` ou 0..1 : la main arrière va d'elle-même sur la seconde prise (fusil : poignée de crosse ; corde ; journal : bord gauche ; peluche : sous le bras gauche).
- `handF` / `handB` : `'fist'` `'open'` `'paume'` (paume vers le haut, bras tendu) `'bas'` (paume vers le sol) `'visiere'` (main plate pliée au poignet) ; `face` : `{ brow:'n'|'up'|'frown'|'worry', mouth, eyes:'open'|'half'|'closed'|'wide' }` ; `t` (animations) ; `marche` (0..1 ou true, avec `t`) ; `cible` [x,y] écran (gestes qui l'acceptent).
- Point nommé de l'objet tenu : `TED.pt(r, 'nom')` (main avant) / `TED.pt(r, 'nom', true)` (main arrière) → `[x, y]` écran. Fusil : `bouche` `crosse` `levier` ; corde : `bout` (d'où part la corde vers l'ours) ; cor : `embouchure` `pavillon` ; aiguille : `chas` `pointe` ; peluche : `tete` `couture` `pieds` ; journal : `centre` `dessin`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `TED.roosevelt` (`C.tedRoosevelt`) | 0,9 ≈ 490 px au sommet du chapeau, ≈ 100 px de large (trapu) | `chapeau`, `fusilDos` | sans chapeau (`hide:{chapeau:1}`) : cheveux brun foncé courts, raie de côté ; `bandouliere` (true : fusil dans le dos, courroie sur la poitrine) ; `tenu:'fusil'` = à la main canon vers le bas ; `tenuB:'fusil'` = idem main arrière (libère la main avant) ; `epaule` (crosse à l'épaule, deux mains, canon horizontal ; met `tenu:'fusil'`) ; `baisse` (deux mains, canon vers le sol ; seul ou après `epaule`) ; `jumelles` (main ARRIÈRE en visière sous le bord du chapeau, yeux plissés : le visage reste dégagé) ; `refus` (bras avant tendu en avant-bas, main plate paume vers le sol, tête qui fait non avec `t`) ; `mainsVides` (deux mains ouvertes devant, paumes en haut, épaules levées) ; `pinceNez` (poing au pince-nez) ; `fier` (torse bombé, menton levé, poings à la ceinture, sourire à dents) ; `salut` (main au bord du chapeau) ; `bouderie` (bras le long, moue, sourcils froncés) ; `marche` (pas lourd) ; bouche `face.mouth:'dents'` (large sourire) \| `'moue'` ; sourcil levé = `face.brow:'up'` |
| `TED.collier` (`C.tedCollier`) | 0,9 ≈ 488 px (chapeau), chapeau ≈ 160 px de large | `chapeau`, `corHanche` (cor pendu à la hanche), `cordeEpaule` (rouleau à l'épaule ; `hide.cordeEpaule`) | `piste` (penché en avant, tête basse, main avant plate vers le sol, main arrière sur la cuisse) ; `piste` + `visiere:true` (main ARRIÈRE en visière, regard au loin) ; `corde` (corde tenue à deux mains devant lui ; `TED.pt(r,'bout')`) + `tire` (recule, jambe avant arc-boutée) ; `noue` (+ `cible` écran : les deux mains au nœud, qui bougent avec `t`) ; `presente` (bras avant tendu paume vers le haut, légère révérence, main arrière sur le ventre) ; `cor` (cor à la bouche, pavillon vers le haut-avant, menton levé ; le cor de la hanche disparaît) ; `degu` (épaules tombées, tête basse) ; `marche` |
| `TED.morris` (`C.tedMorris`) | 0,9 ≈ 484 px (casquette), 65 px de large | `casquette` ; `headJ`/`capJ` (tête redessinée par-dessus le journal) | `lit` (journal à deux mains par les bords, page FACE au public, ≈ 210 × 313 px ; la tête passe devant le haut de la page ; `tenuO.version`) ; `attendri` (main sur le cœur, tête penchée, yeux mi-clos) ; `idee` (main avant levée à hauteur d'épaule, paume ouverte, sourcils levés, bouche « o ») ; `pose` (+ `cible` écran, défaut devant à hauteur de ventre : avec `tenu:'peluche'`, les deux mains déposent l'objet, buste penché) ; `presente` (bras ouvert vers l'avant-haut, paume en haut) ; `salut` (main au bord de la casquette) ; `tenu:'peluche'` seul = peluche à deux mains devant la poitrine ; `marche` |
| `TED.rose` (`C.tedRose`) | 0,88 ≈ 480 px (chignon), 115 de large en bas de jupe | `cheveux`, `tabouret` (si `assise`) | `assise` (true : sur son tabouret, jupe sur les genoux, bottines devant) ; `coud` (aiguille dans la main avant qui tire le fil selon `t` ; main arrière qui tient l'ouvrage = la peluche d'office, `tenuBO.couture` ; fil rouge en arc du chas à la couture, tête penchée) ; `fiere` (peluche face au public, deux mains sous les bras, menton levé, sourire) ; `tend` (tend la peluche à bout de bras) ; `rit` (yeux plissés, bouche ouverte, épaules qui sautent avec `t`) ; `reverence` (buste incliné, tête baissée, mains à la jupe) ; `marche` |

`bendSign` de `M.ik` (vérifié page 9,5 et tous les gestes, 0 ligne ATTENTION) :
| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Roosevelt, Collier, Morris, Rose | 1 | 1 | 1 | 1 |
Exemple : `const r0 = TED.morris(pose…)` puis `M.ik(C.tedMorris, r0.q, x, FEET, 0.9, dir, 'armF', [X, Y], 1)`. Cible toujours DEVANT le personnage. Les enveloppes plient déjà le coude vers l'avant (une cible derrière l'épaule est ramenée juste devant).

Pièges :
- Un geste remplace les `ang.armX_*` donnés ; ordre d'application : Roosevelt `marche fier jumelles salut refus mainsVides pinceNez bouderie epaule/baisse` ; Collier `piste corde noue presente cor degu` ; Morris `lit pose attendri idee presente salut` ; Rose `coud fiere tend rit reverence`.
- `refus` occupe la main avant : pour garder le fusil, `tenuB:'fusil'` (canon vers le sol, derrière la jambe). `epaule`/`baisse` imposent `tenu:'fusil'` et la seconde main ; ne pas les combiner avec `bandouliere`.
- `jumelles` (Roosevelt) et `piste`+`visiere` (Collier) utilisent la main ARRIÈRE (le bras passe derrière la tête) : `tenuB` y est ignoré.
- `lit` 0 → 1 : les deux bras montent ensemble ; la main arrière ne touche le bord qu'au-delà de 0,85. Le journal tenu est mis à l'échelle `k` 0,94 (page ≈ 313 px de haut à s 0,9).
- `assise` (Rose) masque les jambes et descend le corps de 100 unités : garder les mêmes `x, y` (pieds au sol).
- Les doigts couleur chair sont dessinés PAR-DESSUS l'objet tenu ; la peluche tenue par la main arrière passe devant le corps.

## Animaux (def.libre : dessin hors convention bras/jambes, dispense justifiée)
| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `TED.ours(pose,x,y,s,o)` (`C.tedOurs`) | sol sous le corps (tige au milieu du dos) | s 1 : à quatre pattes ≈ 410 × 255 px ; assis ≈ 280 px de haut, 215 de large | `tete` (seules la tête et une patte dépassent d'une touffe de cannes dessinée d'office, `feuilles:false` pour la retirer ; pas de tige) ; `marche` = phase en tours (ex. `t*0.8`) ; `recule` 0..1 (dos rond, tête basse, oreilles en arrière ; avec `marche` négative) ; `assis` ; `attache` (corde de chanvre en ceinture, nœud au dos) ; `bouderie` (museau baissé, sourcils froncés) ; `ouf` (épaules qui tombent, œil mi-clos, petites bouffées de soupir avec `t`) ; `clin` (clin d'œil) ; `humeur` −1 soulagé / 0 / 1 grognon ; `tourne` (rad, tête, assis) ; `t` |
| `TED.chien(pose,x,y,s,o)` (`C.tedChien`) | sol sous le corps | s 0,8 ≈ 150 px de haut (tête levée), ≈ 215 de long | `robe:'a'` (tricolore : blanc, feu, selle noire) \| `'b'` (fauve roux uni) ; `court` = phase en tours (galop ; ex. `t*2`) ; `aboie` 0..1 (gueule ouverte, tête levée, petits arcs de son) ; `assis` ; `queue` (remue avec `t`) ; `t` |
Points : `TED.ourspt(r, 'corde'|'tete'|'nez'|'oeil')` (écran ; `corde` = nœud d'où part la corde vers l'arbre) ; `TED.chienpt(r, 'nez'|'tete')`.
Pièges : la corde ours → arbre se trace par `TED.corde(TED.ourspt(r,'corde'), M.dec.arbrePt…, { mou })` APRÈS l'ours. Ours `assis` + `dir` : le nœud est du côté du dos (vers l'arbre si l'ours lui tourne le dos). Les chiens ne touchent jamais l'ours : garder ≥ 120 px. La taille des chiens a été réduite (×1,05 au lieu de ×1,3) après la dernière planche : la page 6,5 les montre ≈ 25 % trop grands.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol). Même dessin que tenu en main.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `TED.peluche(x,y,s,o)` | sol entre les pieds | s 1 : debout ≈ 192 × 125 px, assis ≈ 172 px (≥ 160 ; ×1,3 quand elle porte le gag) | `couture` 0..1 (0 : deux pièces d'étoffe à plat + tête à moitié bourrée ; 0,5 : assemblé, mou, bourre qui dépasse, un œil ; 1 : fini, deux yeux boutons, nœud rouge ; plan 6 : `smooth(2.55, 3.4, t)`) ; `assis` ; `penche` −1..1 (tête inclinée) ; `bras` 0..1 (pattes avant ouvertes) |
| `TED.journal(x,y,s,o)` | milieu du bord inférieur | s 1 : 250 × 370 px (s 1,2 ≈ 300 × 444) | `version` 0..1 (dessin à la plume : Roosevelt chapeau-moustache, main en refus, fusil baissé ; ours 0 grand, noir, hirsute, attaché à un piquet → 0,5 moyen, rond → 1 petit ourson rond aux grands yeux) ; `punaise` (punaise rouge en haut, pour le mur) ; `k` (échelle interne) ; `TED.accPt(r,'journal','centre')` |
| `TED.fusil(x,y,s,o)` | sous son milieu | s 0,9 : 270 px de long | `bretelle` |
| `TED.cor(x,y,s,o)` | sous son milieu | s 0,9 ≈ 115 px | `bretelle` |
| `TED.aiguille(x,y,s,o)` | pointe | minuscule (36 px à 0,9) | — |
| `TED.corde(a, b, o)` | deux points écran | — | `mou` (px, défaut 30), `w` (épaisseur px, défaut 4) ; corde de chanvre torsadée |

## Vignette : la chambre d'enfant (plans 1 et 6)
`TED.chambre(t, cx, cy, rx, ry, o)` dessine tout l'intérieur (à appeler dans `draw` de `M.vignette`) : papier peint bleu nuit à étoiles, fenêtre avec lune et voilages qui ondulent, étagère (cubes sans lettres, toupie, petit train), mobile d'étoiles qui tourne, table de nuit et veilleuse qui luit, lit de bois clair, enfant aux cheveux paille endormi de profil, couverture en patchwork (ocre, vert, bleu, rose fané). Tout est mis à l'échelle de `rx/210`, `ry/260`.
Options : `bosse` 0..1 (forme ronde nettement soulevée sous la couverture contre la poitrine, ≈ 70 × 60 px en vignette rx 210, avec petite ombre ; le bras de l'enfant, en pyjama, l'enlace PAR-DESSUS la couverture, main posée sur la bosse ; rien ne dépasse ; la bosse suit l'enfant avec `bouge` ; la peluche de `revele` apparaît à la même place) ; `revele` 0..1 (la couverture glisse : pyjama rayé bleu ciel, bras qui serre l'ours en peluche, tête de l'ours bien visible près du visage) ; `bouge` 0..1 (se retourne en dormant, avec `t`) ; `sourire` (bool).
Piège : `t` doit être le temps GLOBAL (`M.tg(t)`) pour que voilage, mobile et veilleuse ne sautent pas entre les plans 1 et 6.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'TED\.' casting/scene.js`). Les plus utiles :
```js
// plan 4 : Roosevelt refuse (fusil baissé dans la main arrière), Collier présente l'ours attaché
const ro = TED.ours({ t, assis: true, attache: true, ouf: true }, 560, FEET, 0.95, { cast });
TED.corde(TED.ourspt(ro, 'corde'), [430, 1180], { mou: 16 });
TED.collier({ t, presente: 1 }, 300, FEET, 0.9, { cast });
TED.roosevelt({ t, refus: 1, tenuB: 'fusil' }, 820, FEET, 0.9, { dir: -1, cast });
// plan 5 : Morris lit le journal (page face au public), Rose coud la peluche sur son tabouret
TED.morris({ t, lit: smooth(1.0, 1.6, t), tenuO: { version: 0 } }, 420, FEET, 0.9, { dir: 1, cast });
TED.rose({ t, coud: 1, assise: true, tenuBO: { couture: 0.3 } }, 760, FEETB, 0.88, { dir: -1, slot: ST.slotB, cast });
// vignette de la chambre
M.vignette(t, { x: 690, y: 520, t0: 7.6, draw: (cx, cy, rx, ry) => TED.chambre(M.tg(t), cx, cy, rx, ry, { bosse: 1 }) });
```

## Décors (bibliothèque : M.dec → M.ted ; appeler TED.init_casting() dans S.init)
# Décors récurrents — « Le Teddy bear » (`decors/casting.js`, espace `M.dec`)

Ne pas lire `decors/casting.js` : tout est ici. Dans `S.init` : **`TED.init();`** (pré-rendus, lance `init_casting`).
`t` = temps LOCAL du plan : les ambiances passent seules en temps global (`M.tg`), sans saut à la coupe ; les événements (`poisson`, options 0..1) suivent ce que le plan leur donne.
`up` (px, défaut 0) remonte tout le décor. Points nommés donnés pour `up = 0`. Aucun texte ni chiffre. Échelle des personnages : 0,9 sur `ST.slotF − 34`.
**Raccord** : garder les mêmes options d'un plan à l'autre à la coupe (`soir`, `buisson`, `arbre`, `feu`, `lanterne`, `lucioles`, `chat`, `tabouret`), sinon l'image saute.

## Lieu 1 — camp de chasse au bord du bayou (plans 1 à 4)
Ordre : `TED.bayou(t, up, o)` → `M.drawFloor()` → `TED.bayouSol(t, o)` → marionnettes (arrière puis avant) → `TED.buissonAvant(t, x, o)` (si `buisson`) → lumière, rideau, cadre.
(`bayouSol` peut aussi passer après les marionnettes si aucun personnage n'est à x < 200 ou x > 800.)

`TED.bayou(t, up, o)` — toile de fond + plan intermédiaire. Options `o` :
| option | valeurs | effet |
|---|---|---|
| `soir` | 0..1 (0) | 0 ciel d'automne pâle ; 1 crépuscule doré-rose (soleil bas derrière la rive, eau dorée, teinte chaude sur tout le décor). Fondu possible (plan 2). |
| `brume` | 0..1 (0,35) | bancs de brume qui dérivent au ras de l'eau |
| `feu` | `true` (défaut) / `false` | feu de camp allumé (3 flammes, braises, fumée, vapeur de la cafetière) ; `false` = cendres qui fument |
| `arbre` | `true` (défaut, x 640) / `false` / nombre (x) | jeune chêne au tronc dégagé ; met à jour `TED.arbrePt` |
| `buisson` | `null` (défaut) / nombre (x) / `true` (= 820) | buisson de cannes (partie arrière) ; met à jour `TED.buissonPt` |
| `secoue` | 0..1 | le buisson tremble (à passer aussi à `buissonAvant`) |
| `ecureuil` | `null` (absent) / 0..2 | écureuil gris du grand chêne de gauche : 0→0,1 apparaît (104, 560), →0,8 descend tête en bas jusqu'à y 880, 0,8→0,9 se retourne et s'arrête (queue qui frémit) ; 1→2 remonte et disparaît. P1 : `smooth(4.9, 6.2, t)` ; au plan suivant, partir de 1 puis faire 1→2 pour qu'il s'en aille. |
| `lucioles` | 0..1 (défaut = `soir`) | 0,0–0,1 : une luciole s'allume ; 0,4–0,5 : la deuxième ; 0,75–1 : cinq de plus. Près des cannes (x 720–980, y 980–1280). |
| `lanterne` | 0..1 (défaut `smooth(0.3, 0.8, soir)`) | lanterne tempête du mât de la tente qui s'allume (verre qui luit + flamme + lueur) |
| `poisson` | instant LOCAL (s) ou `null` | un poisson saute (0,8 s) puis ronds dans l'eau (≈ 3 s) ; `poissonX` (540) ; surface y 1150 |
| `cafetiere` | 0..1 | 0 et 1 calmes ; entre les deux, la cafetière déborde : couvercle qui sautille, jet de vapeur, gouttes. P4 : `smooth(3.5, 4.0, t)` |

Contenu et positions (up = 0) :
- Fond : ciel (nuages qui défilent, deux vols d'aigrettes blanches en boucle), rive lointaine dans la brume (y 830–900), eau vert-brun y 880–1240 (reflets qui glissent, ronds), 4 cyprès chauves moussus + 3 lointains, nénuphars, héron immobile (556, 1150), tortue sur une souche (392, 1110), rive de la clairière y 1240–1395 (herbes, roseaux, feuilles).
- Intermédiaire : tente de toile x 60–330 (pignon x 222–330, porte ouverte x 238–314), lanterne pendue au mât (300, 992–1056) ; feu x 212 (flammes y 1340–1390) avec crémaillère x 140–290 (traverse y 1226) et cafetière émaillée bleue (212, 1250–1322) ; seau de toile (168, 1350–1397) ; à droite râtelier de branches + deux fusils au repos x 790–910 (y 1086–1395), malle cerclée x 830–960 (y 1290–1395) avec couverture écossaise roulée et gamelle + quart ; rangée de cannes x 670–1034 (hautes jusqu'à y ≈ 640, ondulent) ; jeune chêne : tronc x 606–676, fourche y 840, couronne x 520–790 / y 480–740 (mousse qui pend) ; grands chênes de coulisse x 46–190 et 890–1034, branches en arche le long du haut (y 190–480), mousse espagnole qui se balance, cor de chasse pendu à la branche basse gauche (240–300, 770–850) ; feuilles mortes qui tombent.
- **Zone dégagée** : x 330–600 et 680–780 entre y 900 et 1395 (seuls l'eau et la rive derrière) ; le tronc du jeune chêne est derrière les personnages à x 606–676.

Points : **`TED.arbrePt`** = `{x: 640, y: 1300}` (hauteur du ventre d'un ours assis sur la fente avant ; tronc ≈ 40 px de large à cette hauteur : la corde va de l'ours au bord du tronc, x ± 20). **`TED.buissonPt`** = `{x, y: BACK − 300}` (sommet des cannes du buisson). `TED.BAYOU` : `feu`, `pot`, `lant`, `heron`, `tortue`, `eau`.

`TED.buissonAvant(t, x, o)` — avant du buisson, **après l'ours** (même `x` que `o.buisson`). `o` : `soir`, `secoue`, `up`. Buisson (origine = pied, sur `ST.back`) : largeur x ± 180 ; partie arrière : masse feuillue jusqu'à BACK − 170, cannes jusqu'à BACK − 330 ; partie avant : masse jusqu'à ≈ BACK − 130, quelques cannes jusqu'à BACK − 200. La tête de l'ours qui dépasse se place entre y BACK − 140 et BACK − 300 : l'avant cache son cou et ses épaules.

`TED.bayouSol(t, o)` — premier plan : souche x 30–146 (dessus y 1344), fougères qui ondulent (x 52, 132, 808, 1010), bûche x 828–1034 avec selle de cuir et étrier (y 1288–1432), feuilles mortes rousses (x 40–260 et 800–1040, y 1400–1455). `o` : `soir`, `up`.

```js
TED.bayou(t, 0, { soir: 0, ecureuil: smooth(4.9, 6.2, t) }); M.drawFloor(); TED.bayouSol(t, {});      // P1
TED.bayou(t, 0, { soir: so, buisson: 820, lucioles: smooth(5.0, 6.5, t), lanterne: smooth(6.1, 6.4, t) });   // P2
M.drawFloor(); TED.bayouSol(t, { soir: so }); /* ours */ TED.buissonAvant(t, 820, { soir: so });   // so = smooth(…) du jour au soir
```

## Lieu 2 — boutique des Michtom, Brooklyn (plans 5 et 6)
Ordre : `TED.boutique(t, up, o)` → `M.drawFloor()` → `TED.boutiqueSol(t, o)` → marionnettes → lumière, rideau, cadre.

`TED.boutique(t, up, o)` — options : `soir` 0..1 (rue au crépuscule, fenêtres et réverbère allumés, lampe à gaz plus forte, plus de rayon de soleil) ; `porte` 0..1 (porte de l'arrière-boutique qui s'entrouvre, charnière à droite ; P6 : `smooth(1.0, 1.4, t) * (1 − smooth(1.6, 2.0, t))`) ; `chat` `null` (absent) / 0..1 : 0–0,04 caché derrière la caisse, 0,04–0,7 longe le comptoir vers la gauche, 0,72–0,9 s'assoit à x 770 près de la balance, 1 = assis (queue qui bat, clignements) — P5 : `smooth(2.3, 4.5, t)`, P6 : `chat: 1` ; `tabouret` (défaut x 486 ; `false` si Rose apporte le sien ; nombre = x ; assise y ≈ 1295).

Contenu et positions :
- Vitrine à petits carreaux x 70–318, y 300–1120 (voilages qui ondulent sur les deux bords, cage de canari qui se balance (196, 330–410)) ; derrière : rue de Brooklyn (immeubles de brique et de pierre, cheminée qui fume, deux cordes à linge qui battent y 400 et 600, enseigne dessin de bonbon (231, 795), auvent rayé, réverbère x 292, pigeons, passants, tramway hippomobile toutes les 16 s, y 980–1112).
- Pilier x 330–430 : deux cartes postales illustrées (374, 360) (370, 470), **lampe à gaz** (380, 618), flamme (380, 648).
- Étagères x 436–668 : bocaux de bonbons (y 314–390), rouleaux d'étoffe et coupons (y 438–530), bobines + cheval à roulettes + toupie (y 630–670), cartons à chapeaux (y 760–810), tiroirs y 950–1395.
- Mur libre x 680–835, y 300–545 : **clou `TED.murPt` = (752, 352)** ; un journal de ≈ 150 × 190 px (s ≈ 0,5) y tient sous le clou.
- Pendule (896, 286 → 536) ; porte de l'arrière-boutique x 846–1004 dès y 560 (cachée par le comptoir sous y 1150).
- Poêle en fonte x 336–428 (y 1150–1395), tuyau qui entre dans le mur (340, 960), bouilloire (382, 1118) qui fume.
- **Présentoir vide `TED.vitrinePt` = (262, 1100)** : plateau de velours vert x 198–326, devant la vitrine (l'ours en peluche s'y pose, pieds à y 1100).
- Table à ouvrage x 430–548 (dessus y 1232), panier de coupons, ciseaux de tailleur.
- Comptoir x 546–1034, **dessus y 1150** : bocaux x 572–645 ; **`TED.comptoirPt` = (700, 1150)** (place libre x 650–740) ; balance de Roberval x 810–914 (plateaux y 1102) ; caisse enregistreuse x 912–1040 (y 994–1144).
- Rayon de soleil poussiéreux de la vitrine vers le plancher (x 320 → 520–940) ; vapeur, pendule, flamme, linge, voilages, canari, passants : toujours en mouvement.
- **Zone dégagée** : x 440–840 entre y 900 et 1395 (seuls les tiroirs, la table à ouvrage basse et la façade du comptoir derrière) ; le poêle (x 336–428) et le présentoir (x 198–326) sont derrière les personnages.

`TED.boutiqueSol(t, o)` — premier plan : sacs de toile x 60–220 (y 1300–1435), caisse de bonbons x 880–1000 (y 1312–1437), balai x 1000–1050. `o` : `soir`, `up`.

```js
TED.boutique(t, 0, { chat: smooth(2.3, 4.5, t) }); M.drawFloor(); TED.boutiqueSol(t, {});            // P5
```

## Pièges
- Les points nommés sont fixes (up = 0) sauf `arbrePt` et `buissonPt`, recalculés à chaque appel de `bayou` avec son `up` et son `arbre`/`buisson`.
- La teinte `soir` ne touche que le décor : les marionnettes se règlent par `M.stageLight`.
- `decor.py` sur la planche de test (essai 10 s) : bayou jour détail 37 % / vie 100 %, bayou soir 31 % / 87 %, boutique 35 % / 87 %.
