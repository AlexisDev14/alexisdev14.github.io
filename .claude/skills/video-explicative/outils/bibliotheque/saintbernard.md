# persos.md — « Le saint-bernard, le tonneau qui n'a jamais existé » : mode d'emploi de `persos.js`

Espace de noms : `M.sb` (alias `const SB = M.sb;`). Dans `S.init` : `SB.init()` (pré-rendus : ciels normal/nuit/carte postale, montagnes, plateau, nuages, hospice, annexe, rochers, sapins, sol enneigé, toiles et cadres du tableau).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (mesurées sur la planche `casting/`).
Aucune croix, lettre ni symbole nulle part (porte, clocheton, chanoine) : n'en ajoutez pas.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `slot: ST.slotB` au rang du fond)
Toujours par l'enveloppe `SB.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes, cibles écran). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). `o` : `dir` ±1, `cast`, `slot`, `alpha`, `rod`.

Options communes (chanoine et voyageur) :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'tonnelet'` `'bol'` `'lanterne'` `'perche'` `'baton'` `'chapeau'` ; `tenuO` / `tenuBO` : options de cet objet (celles de l'objet seul, ex. `{ k: 1.3 }`).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tourne en plus.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (bol : bord arrière par-dessous ; perche : 118 plus bas). Mis d'office par `tend`, `sonde`, `boit` (bol).
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` (valeurs du kit) ; `t` (temps local : ambiance en temps global).
- Points de l'objet tenu : `SB.pt(r, 'nom')` (main arrière : `SB.pt(r, 'nom', true)`) → tonnelet `bouchon anse centre fond` · bol `bord vapeur fond` · lanterne `flamme anneau fond` · perche `bout haut` · bâton `bout haut` · chapeau `centre`.
- Points du corps : `SB.corps(r, 'bouche'|'oeil'|'tete'|'nuque'|'main'|'mainB'|'mains')` → `[x, y]` écran (`'mains'` = milieu des deux poings, pour le harnais).
- Marche : `marche` = phase en tours (ex. `t * 1.6`) ; jambes en opposition, petit rebond ; avancer `x` à part (≈ 75·s px par demi-tour).
- Les mains entourent l'objet par son corps ou son anse : lanterne par l'anneau, bol par-dessous à deux mains, tonnelet par-dessous (poing sous le ventre du tonnelet), perche et bâton par le manche.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `SB.chanoine` (`C.sbChanoine`) | 0,9 ≈ **485 px** (haut du bonnet), ≈ 105 px de large | `pelerine`, `barbe`, `bonnet` (`hide.bonnet`), moufles grises (main = moufle) | `accueille` (bras avant ouvert vers l'avant, main ouverte, bras arrière entrouvert, sourire) ; `porte` (lanterne levée, `tenu:'lanterne'` d'office, elle se balance) ; `sonde` (perche plantée tenue à deux mains, `tenu:'perche'` d'office ; `enfonce` 0..1 = mains qui descendent de 58 px à 0,9 ; la pointe est coupée au niveau des pieds) ; `tend` (bol tendu à deux mains par-dessous, `tenu:'bol'` d'office) ; `releve` + `cible` (les deux mains à la cible écran, buste en arrière : passer `SB.corps(rv,'main')` du voyageur) ; `frissonne` (mains devant la bouche, il souffle dedans, tremble) ; `caresse` + `cible` (main ouverte posée sur la cible, va-et-vient : `SB.chienPt(rc,'tete')`) ; `ouvre` + `cible` (main ouverte sur la poignée : `SB.portePt(t, oCol)`) ; `marche` |
| `SB.voyageur` (`C.sbVoyageur`) | 0,9 ≈ **481 px** (haut du chapeau), chapeau 133 px de large | `chapeau`, `cheveux`, `echarpe` (devant), `echarpeB` (bout qui flotte), `sac`, `basque` (assis) ; jambes à genou `legF/legF_lo`, `legB/legB_lo` | `chapeau` `'tete'` (défaut) \| `'main'` (tenu à la main avant par le bord ; à la main arrière si la main avant tient déjà quelque chose) \| `'aucun'` ; `vent` 0 (cache-nez qui pend) … 1 (flotte à l'horizontale), défaut 0,5 ; `teint` 0 → 1 (joues et nez rouges, sourire béat) ; `gel` 0..1 (peau et manteau bleuis, givre aux sourcils, sur le chapeau et les épaules, stalactites au bord du chapeau) ; `frisson` 0..1 (tremblement fort, temps global) ; `assis` (dans la neige, genoux remontés, bras autour des genoux, manteau replié ; cumulable avec `palpe`/`boit`) ; `couche` 0..1 (bascule sur le dos ; à 1 : à plat, **la tête est ≈ 470·s px derrière `x`** (vers −dir), tige retirée) ; `enseveli` 0..1 (1 : seuls le chapeau et une main levée dépassent d'un tas de neige dessiné par l'enveloppe ; 0,5 : il émerge jusqu'à la taille ; `tas:false` sans tas, `tasH` hauteur du tas) ; `boit` (avec `tenu:'tonnelet'` : le tonnelet porté à la bouche, bouchon contre les lèvres, tête renversée, yeux clos ; avec `tenu:'bol'` : bol penché à deux mains ; avec `cible` : la main va à la cible, tête penchée vers elle, ex. `SB.chienPt(rc,'tonneau')`) ; `palpe` + `cible` (main ouverte qui tâte, ex. `SB.chienPt(rc,'cou')`) ; `suspendu` (bras levés, jambes pendantes qui se balancent, tige retirée ; harnais en `SB.corps(r,'mains')`) ; `marche` |

`bendSign` de `M.ik` (seulement pour un `M.ik` écrit à la main ; `def.handLen` = 92 pour les deux humains) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| chanoine | 1 | 1 | 1 | 1 |
| voyageur | 1 | 1 | 1 | 1 |

Les enveloppes n'utilisent pas `M.ik` : leur IK interne impose le coude vers l'avant dans les deux sens (tous les gestes ci-dessus testés dir 1 et −1, aucune ligne « ATTENTION »).

Pièges :
- Les cibles (`releve`, `caresse`, `ouvre`, `palpe`, `boit`) sont en px **écran** : appeler l'enveloppe avec les mêmes `x, y, s, dir` que le dessin. Hors de portée (≈ 170 px à 0,9 depuis l'épaule), le bras s'arrête tendu.
- `couche` et `enseveli` posent eux-mêmes une transformation / un clip : ne pas les combiner avec `assis`. `enseveli` coupe tout sous `y` (pieds) : le voyageur enseveli doit être sur la ligne du sol où le tas est dessiné.
- `vent` 1 et dir 1 : le cache-nez s'étend ≈ 150 px derrière lui (vers la gauche) ; le garder hors des visages voisins. Il bouge seul (temps global).
- Chanoine : soutane jusqu'aux chevilles ; en `marche`, seuls les souliers dépassent. Pas d'option `assis`.

## Le saint-bernard (avec tige ; `def.libre` : animal)
`SB.chien(pose, x, y, s, o)` (`C.sbChien`) : `(x,y)` = sol sous le corps, regarde vers +x (`o.dir`). Défaut **s 0,85** : garrot ≈ **266 px**, haut de la tête ≈ 345 px, ≈ **425 px** de la croupe à la truffe (+ 40 px de queue). À s 1 : garrot 313 px, ≈ 500 px de long.
| Option | Valeurs | Effet |
|---|---|---|
| `robe` | `'a'` (défaut) \| `'b'` | a = **Barry** : blanc à grandes plaques brun-roux, tête brune à masque autour de l'œil et liste blanche ; b : blanc, une seule tache fauve clair sur le dos, oreilles fauves, tête blanche |
| `tonneau`, `tonneauK` | bool, échelle (1) | tonnelet pendu à l'anneau du collier, sous la gorge, qui se balance ; à s 0,85 : 82 px de long (`tonneauK` 1), 106 px (1,3), **≥ 120 px avec `tonneauK` 1,5** |
| `marche` / `trot` | phase en tours | pas diagonal, pieds posés au sol (IK) ; un tour ≈ 104·s px (marche), 150·s px (trot) : avancer `x` d'autant |
| `flaire` | 0..1 | tête et cou descendent, truffe au sol |
| `creuse` | phase en tours | pattes avant qui grattent, avant-train baissé, mottes de neige qui volent derrière |
| `assis` / `couche` | 0..1 | assis (arrière-train au sol, queue au sol derrière) ; couché en sphinx |
| `remue` | 0..1 | queue qui balance (temps global) |
| `tete` | 0..1 | tête inclinée, perplexe |
| `secoue` | 0..1 | s'ébroue : corps et tête qui tremblent, oreilles qui battent, gouttes de neige |
| `regard` | 0..1 | tête levée vers le haut |
| `aboie` | 0..1 | gueule ouverte (muette : aucun trait de son) |
| `t` | s | ambiance (oreilles, balancement du tonnelet) |
Points : `SB.chienPt(r, 'nez'|'tete'|'oeil'|'gueule'|'cou'|'tonneau'|'dos'|'garrot')` → écran (`cou` = anneau du collier, `tete` = haut du crâne : main qui caresse).
Pièges : pattes recalculées en IK à chaque image : ne pas tourner le chien avec `tilt` au-delà de 0,1. `assis` + `flaire` se combinent mal. Assis, la queue s’étend ≈ 110 px derrière l’arrière-train (s 0,85).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée (0,9) | Options |
|---|---|---|---|
| `SB.tonnelet(x,y,s,o)` | dessous (posé au sol) | 120 × 84 local : **108 px** de long ; `k` 1,3 → 140 px | `k` (échelle du dessin : 1 ; 1,3 quand il porte le gag) ; `roule` (rad : il tourne sur lui-même, l'axe reste à 42·k au-dessus du sol ; avancer `x` d’≈ 50·k·s px par radian) |
| `SB.bol(x,y,s,o)` | fond | 120 × 52 : **108 px** | `vapeur` (true : vapeur blanche fine) ; `t` |
| `SB.lanterne(x,y,s,o)` | base | 132 de haut avec l'anneau : **119 px** | `flamme` (true, avec lueur) ; `t` |
| `SB.perche`, `SB.baton` | bout inférieur | perche 566 local (509 px), bâton 280 (252 px) | `solY` (y écran sous lequel la pointe disparaît) |
| `SB.chapeau(x,y,s,o)` | dessous du bord | 148 × 50 : 133 px | `gel` 0..1 (givre, stalactites) |
| `SB.monticule(t,x,y,s,o)` | pied du tas | 350·s × 140·s·h | `h` (1) ; à dessiner APRÈS une marionnette pour la cacher |
| `SB.tableau(x,y,s,o)` | **centre**, vu de face | grand s 1 : **520 × 400** ; copies s 0,385 : 200 × 154 ; `vide` s 1 : 860 × 1100 | `peint` 0..1 (1 ; la toile se remplit au pinceau : ciel et montagnes 0–0,45, neige 0,35–0,7, figures 0,62–1) ; `tonneau` 0..1 (0 ; le tonnelet apparaît au cou du chien de droite, peint de gauche à droite) ; `copie` `'or'` (défaut) \| `'acajou'` \| `'noir'` (couleur du cadre) ; `vide` (cadre doré seul, centre transparent : la « carte postale » de p1) ; `fils` (deux fils vers les cintres) ; `rot`, `alpha`, `cast` |
Toile : deux saint-bernards robe b penchés sur un voyageur allongé dans la neige (cache-nez rouge, chapeau tombé), montagnes enneigées ; aucune lettre ni signature.

## Décor du col (pré-rendu par `SB.init()`) — plein cadre
Ordre : `SB.col(t, o)` → `M.drawFloor()` → `SB.colSol(t, o)` → marionnettes → `SB.colNeige(t, o)` → `M.stageLight` → `M.rideau` → `M.drawFrame`. `t` = temps LOCAL (les ambiances passent seules en temps global). Passer le même `o` aux trois.
| Option | Valeurs | Effet |
|---|---|---|
| `hospice` | 0..1 (1) | l'hospice (à GAUCHE) et l'annexe (à droite : abreuvoir gelé, luge) descendent des cintres sur leurs câbles (0 = hors champ en haut) ; `hospiceT1` (instant local de la butée) = petit rebond et balancement |
| `porte` | 0..1 | la porte cloutée s'ouvre vers l'intérieur (gond à gauche) : intérieur chaud, lumière sur la neige |
| `neige` | 0..1 (0,5) | flocons au fond (`col`) et devant (`colNeige`) |
| `rafale` | 0..1 | flocons à l'horizontale, fumée couchée, voilages qui battent aux fenêtres, nuages plus rapides, poudrerie au ras du sol, volet qui bat |
| `nuit` | 0..1 | ciel de crépuscule bleu, lune, étoiles, fenêtres allumées avec voilage, lueur de la lanterne murale, teinte bleue |
| `cartePostale` | 0..1 | image d'Épinal (p1) : ciel bleu vif, soleil doux à rayons, montagnes saturées, sapins enneigés en coulisses ; **pas d'hospice** ni d'annexe |
| `monticule` | `{ x, h, y }` | tas de neige posé au sol par `colSol` (derrière les marionnettes ; `y` défaut `ST.slotB−30`) ; `monticuleFond:true` = dans `col`, au pied du décor |
| `sapinNeige` | 0..1 ou absent | p1 : un paquet de neige glisse d'une branche du sapin de droite (0–0,3), tombe (→0,92), poudre ; la branche rebondit |
| `volet` | 0..1 ou absent | p2 : le volet de la fenêtre (334, 990) s'ouvre en grand et claque contre le mur (rebonds dès 0,4) |
| `choucas` | 0..1 ou absent | p3 : un choucas arrive (0–0,45) et se pose sur le clocheton, picore |
| `cloche` | 0..1 | p4 : amplitude de l'oscillation de la cloche (temps global ; aucun son fort) |
| `panNeige` | 0..1 ou absent | p5 : un pan de neige glisse du toit (0–0,35), tombe de l'avant-toit (→0,6), s'écrase en poudre au pied du mur (x ≈ 186) |
| `souffle` | 0..1 | p6 : la fumée de la cheminée est rabattue par le rotor |
Toujours en mouvement : nuages de carton sur fils, choucas lointains (toutes les 22 s), chamois sur la crête (18 s sur 40), fumée de la cheminée, flamme de la lanterne murale, cloche qui frémit, reflet sur le lac gelé, flocons.
Repères `SB.COL.HOS` (écran, `hospice` 1) : façade x 56–396, avant-toit y 790, faîte 664 ; **porte** x 296–372, y 1226–1395 (`SB.portePt(t, o)` = poignée, suit `porte` et `hospice`) ; lanterne murale (272, 1226) ; cheminée (146, 606) ; clocheton (304, 664), cloche (304, 606) ; fenêtres 3 rangées y 858/990/1112 (haut), colonnes x 104/174/244/334 ; raquettes (118–156, 1226) ; bûcher x 60–240, y 1280–1395 ; banc x 240–294. `SB.COL.crete` = {x0 490, x1 750, y 868} (crête du chamois) ; `SB.COL.lac` (770, 1200) ; abreuvoir x 806–930, y 1336–1395 ; luge x 870–960 ; rochers de coulisse droite x ≥ 868.
**Zone dégagée** : x 250–800 entre y 900 et 1430 (plateau enneigé, sentier pâle, lac au fond) ; la porte (x 296–372) est au bord gauche de cette zone : le chanoine qui `ouvre` se place à x ≈ 400–430, `dir:-1`.
`SB.colSol` : neige sur tout le plancher (fentes visibles), traces de pas, jalon incliné (x 150, y 1440–1560), congères devant la rampe (x 40–300, 760–1040, y > 1610).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'SB\.' casting/scene.js`). Page = instant : 0 planche · 1 comparaisons · 2 chiens et objets · 3 gestes du chien · 4 chanoine · 5 voyageur · 6 bras · 6,5 interactions · 7 prises · 7,5 tableaux · 8 / 8,5 / 9 / 9,5 col normal / nuit / rafale / carte postale · 9,97 téléphone.
```js
// le chanoine relève le voyageur assis (cible = main du voyageur)
const rv = SB.voyageur({ t, assis: 1, ang: { armF_up: -1.2, armF_lo: -0.4 }, palpe: 0.0001 }, 470, FEET, 0.9, { dir: -1, cast });
SB.chanoine({ t, releve: 1, cible: SB.corps(rv, 'main') }, 300, FEET, 0.9, { dir: 1, cast });
// le voyageur palpe le cou du chien au tonnelet
const rc = SB.chien({ t, robe: 'a', tonneau: 1, tonneauK: 1.5, remue: 1 }, 600, FEET, 0.85, { dir: 1, cast });
SB.voyageur({ t, palpe: 1, cible: SB.chienPt(rc, 'cou'), gel: 0.6 }, 840, FEET, 0.9, { dir: -1, cast });
// nuit, porte ouverte, le chanoine à la porte
SB.col(t, { nuit: 1, porte: 0.7 }); M.drawFloor(); SB.colSol(t, { nuit: 1 });
SB.chanoine({ t, ouvre: 1, cible: SB.portePt(t, { porte: 0.7 }) }, 420, FEET, 0.9, { dir: -1, cast });
```
