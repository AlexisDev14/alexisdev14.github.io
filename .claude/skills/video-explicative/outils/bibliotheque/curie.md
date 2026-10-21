# persos.md — « Marie Curie, les carnets qui brillent encore » : mode d'emploi de `persos.js`

Espace de noms : `M.cur` (dans `scene.js` : `const CUR = M.cur;`). Dans `S.init` : `CUR.init()` (pré-rendus du hangar : vue jour / nuit, fond, plan intermédiaire, premier plan).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Planche de casting : `casting/scene.js` (page = seconde : 0 planche · 1 comparaisons · 2/3 Marie dir 1/−1 · 4/5 Pierre dir 1/−1 · 6 bras pliés, balayages, `M.ik` · 7 prises s 1,6 + boîte · 8 hangar jour · 9 hangar nuit · 9,97 téléphone). Rendu : 0 ligne « ATTENTION ».

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `CUR.marie(pose, x, y, s, o)` / `CUR.pierre(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle prépare la pose (objet tenu, seconde main, gestes) et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). Passer `t` dans la pose (marche, griffonnage, remuer, bandage, lueurs).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'fiole'` `'cahier'` `'bloc'` `'sac'` `'barre'` `'plume'` `'rouleau'` (ou `'rien'`) ; `tenuO` / `tenuBO` : options de cet objet (les mêmes que l'objet seul : `lueur`, `taille`, `ouvert`, `rayons`, `plat`…).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tourne.
- `deuxMains` (0..1) : la main arrière vient d'elle-même sur la seconde prise (cahier : bord opposé ; bloc : dessous arrière ; sac : fond ; barre : 58 local au-dessus). Mis d'office par `remuer`, `serre`, `parapluie`, `porter`, `verser`.
- `cible` : point **écran** visé par le geste (`ecrire` = bec de la plume ; `tenir` / `porter` / `verser` = point de prise). Calculée sous la transformation courante du contexte.
- `handF` / `handB` : `'fist'` | `'open'` | `'paume'` | `'bas'` ; `face` : `{ brow, mouth, eyes }` (`eyes:'rire'` = yeux plissés) ; `humeur` : `'serieuse'` `'ravie'` `'sceptique'` `'surprise'` (visage par défaut, `face` l'emporte).
- `marche` 0..1 (jambes et petit balancement de bras selon `t`) ; `ang` pour un geste maison (les angles de base sont déjà posés).
- Point nommé de l'objet tenu : `CUR.pt(r, 'nom')` (main avant) / `CUR.pt(r, 'nom', true)` (main arrière) → `[x, y]` écran. fiole `bouchon centre fond` · cahier `dos page haut bas` · bloc `haut centre` · sac `col fond centre` · barre `bout haut` · plume `bec barbe` · rouleau `centre`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `CUR.marie` (`C.curMarie`) | 0,9 ≈ 480 px (chignon), bas de robe ≈ 86 px de large | `cheveux` (bouffants frisés), `chignon`, `tabouret` (si `assise`) ; jambes `legF/legB` sous la robe (bottines visibles) | `ecrire` (+ `cible` : le bec de la plume griffonne selon `t`, plume d'office, main arrière ouverte posée ≈ 41 px en arrière de la cible, tête baissée ; défaut devant la ceinture) ; `tenir` (fiole d'office ; `haut` 0 poitrine → 1 près du visage, devant le nez sans le cacher ; ou `cible`) ; `remuer` (barre de fer d'office, deux mains, petit cercle selon `t` ; `barreTh` angle de la barre, défaut −0,55 = bout vers l'avant-bas ; bout ≈ 207 px sous/devant la main avant) ; `admirer` (mains jointes sous le menton, se penche, yeux plissés, sourire) ; `eclaire` (visage éclairé bleu-vert, à joindre à `admirer` / `tenir`) ; `refus` (main ouverte levée devant la poitrine, tête et buste qui reculent, mine sceptique) ; `salut` (petite révérence : buste incliné, tête baissée, mains à la jupe) ; `serre` (cahier fermé serré contre la poitrine à deux mains) ; `parapluie` (cahier vu par la tranche, à plat au-dessus de la tête, deux mains, regard levé) ; `assise` (true : sur son tabouret, jupe sur les genoux, bottines devant ; le corps descend de 90 px à 0,9 ; compatible avec `ecrire` + `cible`) |
| `CUR.pierre` (`C.curPierre`) | 0,9 ≈ 496 px, ≈ 90 px de large | `cheveux` (couronne brun foncé, front haut dégarni), `barbe` (courte en pointe, moustache) | `tenir` (+ `tenu` obligatoire, ex. `'fiole'` ; objet droit devant lui, ou `cible`) ; `porter` (bloc d'office, à deux mains **par en dessous** devant la ceinture ; `haut` 0..1 : bras avant tendu vers l'avant-haut, une main sous le bloc, la seconde se retire entre 0,35 et 0,8) ; `verser` (sac d'office : main avant au col, main arrière au fond, il bascule col vers l'avant-bas ; `CUR.pt(r,'col')` = bouche du sac) ; `bandage` (avant-bras avant à l'horizontale devant lui, la main arrière tient le rouleau et tourne autour selon `t`, fil de bande dessiné) + `bande` 0..1 (longueur enroulée, du coude vers le poignet) + `tube` (true/0..1 : petit tube lumineux sur l'avant-bras) ; `montrerBras` (avant-bras levé devant lui, paume vers lui : il regarde sa brûlure) ; `tendre` (bras tendu devant, paume en l'air, menton levé, sourire : vers le public ou la vignette) ; `brulure` 0..1 (tache ovale rouge sang `#9e2b25` sur l'avant-bras avant, 46 × 18 local ≈ 41 × 17 px à 0,9) ; `manche` (true : manche retroussée ; d'office avec `brulure`, `bande`, `tube`, `bandage`, `montrerBras`, `tendre`) ; `fier` (menton levé, main avant sur le revers, main arrière à la ceinture, sourire) ; `epaules` (haussement d'épaules, paumes en l'air, sourcils levés) |

**`bendSign` de `M.ik`** (vérifié page 6 : bras avant et arrière vers deux cibles devant, aucune ligne « ATTENTION ») :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Marie (`C.curMarie`) | 1 | 1 | 1 | 1 |
| Pierre (`C.curPierre`) | 1 | 1 | 1 | 1 |

Pour un `M.ik` à la main : préparer la pose par `CUR.mariePose(pose)` / `CUR.pierrePose(pose)`, puis `M.ik(C.curMarie, q, x, y, s, dir, 'armF', [X, Y], 1)` (mêmes `x, y, s, dir`), et passer `ang` modifié à l'enveloppe (sans geste qui réécrit le même bras). `handLen` 100 ; épaules Marie `[-2,-146]`/`[-10,-146]` (bras 96 + 100), Pierre `[-2,-156]`/`[-10,-156]` (bras 100 + 100). Portée de l'épaule à la prise ≈ 173 px (Marie) / 176 px (Pierre) à 0,9.

Pièges :
- Marie n'a **pas** de `def.libre` : la robe longue cache des jambes ordinaires, seules les bottines dépassent ; la marche est lente (1,1 pas/s), garder `marche` ≤ 1.
- Un geste réécrit les angles de son bras : ne pas combiner deux gestes du même bras (ex. `refus` + `tenir`). `admirer`, `salut`, `serre`, `parapluie`, `remuer` occupent les deux mains.
- `tenir` sans `tenu` donne la fiole chez Marie, rien chez Pierre. `tenuO.lueur` allume la fiole tenue (halo 60–90 px qui pulse en temps global).
- La fiole tenue est entourée par les doigts sur le bas du corps : la poudre du fond est cachée, c'est le halo qui se voit.
- Pierre `porter` + `haut` 1 : le bloc monte au-dessus de l'épaule devant le visage ; rester à `haut` ≤ 0,8 si le visage doit rester dégagé.
- `parapluie` : le cahier est dessiné par la tranche (`plat`) ; pour la goutte qui tombe dessus, viser `CUR.pt(r, 'haut')`.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1 (miroir), `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t` (lueurs, rayons). Point nommé d'un accessoire seul : `CUR.accPt(r, 'objet', 'nom')` (`r` = valeur renvoyée).

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `CUR.fiole(x,y,s,o)` | fond (posée) | 0,9 : 68 px de haut × 27 ; `taille` 1,8 : 123 px | `lueur` 0..1 (poudre bleu-vert `#9fe8d0` + halo 60–90 px qui pulse en `M.tg(t)`) ; `taille` (1 tenue, 1,8 pour le gag) ; `ph` (phase de pulsation) |
| `CUR.cahier(x,y,s,o)` | bas du dos (reliure) | 1 : fermé 82 × 110 px **à droite** du dos ; ouvert 164 × 110 centré sur le dos | `ouvert` 0..1 (la couverture tourne autour du dos ; pages ivoire de face, colonnes ondulées et petites courbes, sans lettre) ; `rayons` 0..1 (7 rayons vert pâle en éventail, 40–90 px au-dessus des pages, ondulent) ; `plat` (true : vu par la tranche, 112 × 16) |
| `CUR.boite(x,y,s,o)` | milieu du bord inférieur | 1 : 220 × 150 (252 avec les poignées) ; 0,6 ≈ 132 × 90 | `ouvert` 0..1 (couvercle à charnière **gauche**, ≈ 100° ; doublure rouge sombre visible ; `dir:-1` = charnière à droite) ; `cables` (true : deux câbles des poignées jusqu'à `cablesY`, défaut 0 = haut du cadre) ; points `couvercle` (bord libre, suit le couvercle : y poser la main par `M.ik`), `dessus`, `interieur`, `poigneeG`, `poigneeD`, `fond` |
| `CUR.bloc(x,y,s,o)` | dessous, milieu | 0,9 : 83 × 58 px | pechblende noire à facettes, éclats brun-vert |
| `CUR.sac(x,y,s,o)` | fond, milieu | 0,9 : 80 × 117 px | `tint` 0..1 (jute plus ou moins foncé) |
| `CUR.tas(x,y,s,o)` | sol, milieu | 1, `n` 10 : ≈ 330 × 380 px (pyramide 4-3-2-1) | `n` 3–12 (« des tonnes ») ; monter de la trappe : `clipY` à la main (`ctx.clip` au-dessus de `ST.back`) |
| `CUR.barre(x,y,s,o)` | bout bas | 0,9 : ≈ 280 px de long | — |
| `CUR.plume(x,y,s,o)` / `CUR.rouleau(x,y,s,o)` | bec / dessous | 0,9 : 92 px / 20 px | — |

## Décor : le hangar de la rue Lhomond (pré-rendu par `CUR.init()`)
Ordre : `CUR.hangar(t, up, o)` → `M.drawFloor()` → `CUR.hangarSol(t, up, o)` → marionnettes. `up` = décalage vertical (décor qui monte : tout est translaté de `−up`).
Trois couches : planches verticales brun gris, verrière inclinée 10 × 6 carreaux sur les toits de zinc, cheminées et dôme du Panthéon (jour) / ciel bleu nuit, lucarnes allumées, étoiles, lune (nuit), tableau noir à courbes de craie (sans chiffre), bec de gaz mural à globe ; poêle de fonte à long tuyau (porte rougeoyante), sacs de jute entassés à gauche, chaudron sur trépied et braises, paillasse (cornue sur support, balance de précision sous cloche, lampe à pétrole, ballon, carnets), étagère de 5 fioles + flacons ; au sol bassine, seau en zinc, tabouret, caisse, pelle, pots de grès, éclats de minerai.
Animations continues (temps global) : nuages et fumées de cheminées dans la verrière, vapeur du chaudron, bulles, braises et flammes, fumée au raccord du poêle, porte du poêle qui rougeoie, fioles qui pulsent, poussière dans le rayon (jour), pluie qui glisse sur la verrière.

| Option de `CUR.hangar` | Effet |
|---|---|
| `nuit` 0..1 | ciel nuit dans la verrière + voile bleu nuit sur le décor (les marionnettes ne sont pas assombries : `M.stageLight`) ; éteint le rayon de jour |
| `pluie` 0..1 | gouttes qui glissent sur la verrière, ciel qui fonce, tache d'humidité au point de la goutte |
| `fiolesLueur` 0..1 | les 5 fioles de l'étagère luisent bleu-vert (halo ≈ 70 px chacune, ≥ 300 px au total) ; `fioles:false` = étagère vide |
| `goutte` 0..1 (+ `goutteX` 690, `goutteY0` 556, `goutteY` 1146) | 0–0,3 la goutte (≥ 20 px, bleu clair cerné) se forme sous la sablière, puis tombe (chute en u²) jusqu'à `goutteY` ; `CUR.gouttePt(u, o)` = sa position |
| `lampe` 0..1 (défaut : s'allume avec `nuit` 0,3 → 0,7) · `bec` 0..1 (défaut 0) | flamme + halo de la lampe à pétrole / du bec de gaz (baisser `lampe` = la flamme baisse) |
| `vapeur` 0..1 (défaut 0,6) · `bouffee` 0..1 · `dore` 0..1 · `rayon` 0..1 | vapeur du chaudron ; bouffée de fumée au raccord du poêle (progression) ; lumière basse dorée (1934) ; intensité du rayon de jour |
`CUR.hangarSol(t, up, { seau, tabouret })` : `false` retire le seau en zinc (x 203, bord y 1388) ou le tabouret (x 795, assise y 1376) pour en dessiner un mobile dans le plan.

Repères `CUR.H` (à `up` = 0) :
- paillasse `H.paillasse` : x 640–1010, **dessus y 1150** ; zone libre pour cahier / fiole / électromètre x 646–740 ; cornue x 748–846, balance x 862 (cloche jusqu'à y 1032), lampe x 920 (flamme `H.lampe.flamme` = [920, 1062]).
- étagère `H.etagere` : planche y 968, x 748–972 ; fioles (fond) `H.etagere.fioles` = [778, 968] [818, 968] [858, 968] [898, 968] [938, 968], ≈ 60 px de haut ; planche haute y 818 (flacons).
- chaudron `H.chaudron` : x 336, bord y 1238 (Ø 140), foyer y 1380 ; à remuer depuis x ≈ 470 `dir:-1` (estimé : bout de barre ≈ [280, 1320], non rendu au casting).
- poêle `H.poele` : x 204, porte [204, 1302], raccord (fumée, bouffée) [204, 880], tuyau jusqu'à y 604 ; sacs x 40–150 (sous le pan gauche du rideau).
- verrière `H.verriere` : haut y 176 (x 222–858), bas y 548 (x 110–970) ; lune [770, 340] ; tableau `H.tableau` x 384–640, y 574–700 ; bec de gaz `H.bec` [712, 650].
- centre dégagé `H.libre` : x 300–760, y 700–1400 (seul le bord du chaudron entre à x 300–406).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'CUR\.' casting/scene.js`).
```js
// Marie écrit sur la paillasse, cahier ouvert posé dessus
CUR.hangar(t, 0, { pluie: 0.6, goutte: u }); M.drawFloor(); CUR.hangarSol(t, 0, {});
CUR.cahier(708, CUR.H.paillasse.y, 0.9, { t, ouvert: 1 });
const r = CUR.marie({ t, ecrire: 1, cible: [722, CUR.H.paillasse.y - 50] }, 560, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// Pierre porte le bloc à deux mains, puis le lève vers la lumière (haut 0 → 1)
CUR.pierre({ t, porter: 1, haut: k }, 350, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// nuit : Marie admire les fioles, visage éclairé
CUR.hangar(t, 0, { nuit: 1, fiolesLueur: 1 }); M.drawFloor(); CUR.hangarSol(t, 0, {});
CUR.marie({ t, admirer: 1, eclaire: 1 }, 650, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// boîte qui descend des cintres sur ses câbles et se pose
CUR.boite(540, yBoite, 0.8, { t, cables: true, ouvert: 0 });
```
