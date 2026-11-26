# persos.md — « Chewbacca, la voix faite de quatre ours et d'un morse » : mode d'emploi de `persos.js`

Espace de noms : `M.chw` (dans `scene.js` : `const CHW = M.chw;`). Dans `S.init` : `CHW.init()` (pré-rend `CHW.K` : plFond, plMilieu, plConsole, planete, lune, camera, projo, feFond, feMilieu, feAvant, stFond, stMilieu, stAvant).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses ; tailles en px **à l'écran** à cette échelle.
Planche de référence : `casting/scene.js` (page = instant ; liste en tête du fichier). Rendu final : aucune ligne « ATTENTION ».

## Marionnettes humaines (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` au rang du fond)
Toujours par l'enveloppe `CHW.nom(pose, x, y, s, o)` : elle prépare la pose (gestes → angles, objet tenu, seconde main). Elle renvoie `r` : `r.w('pièce', x, y)` = point écran, `r.q` = pose finale (à passer à `M.ik`). `CHW.geantPose/pilotePose/burttPose(p)` = pose finale sans dessiner. Toutes les options de geste valent 0..1 (`true` = 1) et se mélangent pour entrer/sortir du geste.

Options communes :
- `tenu` (main avant) / `tenuB` (main arrière) : `'pain'` | `'masque'` | `'micro'` | `'ciseaux'` | `'bande'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul, ex. `tenuO:{croque:1}`).
- `droit` / `droitB` : `true` par défaut (objet droit à l'écran) ; `false` = suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent.
- `deuxMains` : la main arrière va d'elle-même sur la seconde prise (pain : bord opposé ; masque : nuque). Mis d'office pour le masque.
- `handF` / `handB` : `'fist'` | `'open'` | `'paume'` | `'bas'` (main plate paume vers le bas) ; `face` : `{ brow, mouth, eyes }` (valeurs du kit) ; `t` (respiration, marche, bobines) ; `marche` 0..1 (+ `t`) ; `cible` = point écran (selon le geste, voir plus bas).
- Point nommé de l'objet tenu : `CHW.pt(r, 'nom')` (main avant) / `CHW.pt(r, 'nom', true)` (main arrière) → `[x,y]` écran. Pain : `haut`, `bord` (côté des bouchées), `centre` ; masque : `nuque`, `menton`, `oeil`, `cou` ; micro : `tete`, `haut`, `bas` (sortie du câble) ; ciseaux : `pointe`, `pivot`, `coupe` ; bande : `haut`, `bas`.
- Squelette : jambes en deux pièces `legF_up/legF_lo`, `legB_up/legB_lo` (cuisse, tibia + pied), bras `armF_up/armF_lo`, `armB_up/armB_lo`, `head`, pièces `objet`, `doigts`, `objetB`, `doigtsB`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste |
|---|---|---|---|
| `CHW.geant` (`C.chwGeant`) | **1** ≈ 600 px (haut de la tête-masque), ≈ 140 px de large ; 1,28 × le pilote | `jaw` (mâchoire), `mayhew` + `boucles` (tête nue), `col` (col de fourrure), `bandou` (bandoulière ocre à 4 boîtes, dessinée par-dessus le haut du bras avant) ; fourrure en longues mèches qui tombent | `tete` `'portee'` (défaut) \| `'otee'` (tête de Mayhew, cheveux bouclés châtain-gris, barbe courte) ; `bouche` 0..1 (gueule ouverte, dents ivoire ; Mayhew : bouche en o) ; `sourcils` `'n'` \| `'colere'` \| `'doux'` ; `rugit` (deux poings au-dessus de la tête, gueule ouverte, menton levé ; sourcils colère sauf si donnés) ; `geste` (bras avant tendu horizontal, main ouverte) ; `mange` (prend `tenu:'pain'`, l'amène à la bouche côté bouchées, deux mains ; `tenuO.croque` 1/2) ; `tendre` (tend ce qu'il tient : masque à deux mains devant lui, pain ; sans objet main en paume) ; **`ote`** 0..1 : 0 tête portée → 0,25 mains au menton (avant) et à la nuque (arrière) → 0,55 la tête-masque est levée au-dessus de la tête de Mayhew → 1 masque tenu contre la poitrine (à faire de 1 à 0 pour le remettre) ; `tenu:'masque'` seul = tête ôtée, masque contre la poitrine |
| `CHW.pilote` (`C.chwPilote`) | **0,9** ≈ 470 px, ≈ 75 px de large | `cheveux` (en bataille) | `assis` (cuisses horizontales, pieds à plat ≈ 100 px devant `x` ; hanches à 113 px au-dessus de `y`) + `cible` = point écran des deux mains (levier : `[304, 1150]` avec `x` 250 sur le siège du plateau) ; `surpris` (buste qui recule, sourcils levés, yeux ronds, mains ouvertes à hauteur de poitrine) ; `oreilles` (mains sur les oreilles, coudes vers l'avant, yeux fermés) ; `tend` (bras tendus devant ; avec `tenu:'masque'` il le tient à deux mains par le menton et la nuque) |
| `CHW.burtt` (`C.chwBurtt`) | **0,9** ≈ 470 px, ≈ 80 px de large (magnétophone compris) | `casqueT`, `coqueT` (casque sur la tête), `casqueC`, `coqueC` (au cou), `magneto` | `casque` `'cou'` (défaut) \| `'oreilles'` ; `bobines` (rad/s, défaut 2,5) ; `micro` 0/1 : micro dans la main AVANT si elle est libre (et sans `ecoute`/`colle`/`appuie`), sinon dans la main arrière ; câble spiralé dessiné d'office du magnétophone au micro (`cable:false` pour l'ôter) ; `tend_micro` (bras avant horizontal, micro pointé devant ; `visee` rad, + = vers le bas) ; `ecoute` (main avant sur la coquille, tête penchée, sourire ; met `casque:'oreilles'`) ; `brandit_pain` (prend le pain, le lève au-dessus et devant lui, tenu par-dessous ; `cible` écran pour une autre hauteur) ; `coupe` 0..1 (0 → 0,5 : ciseaux main avant + ruban tendu depuis la main arrière ; 0,5 → 1 : les lames se ferment ; à 1 le ruban est coupé en deux) ; `colle` (main plate qui presse un bout de bande ; `cible` écran, ex. table `[470, 1168]`) ; `appuie` (main plate sur une touche ; `cible` écran) ; `tenu:'masque'` (à deux mains devant le ventre) |

`r.jack` (Burtt) = prise du magnétophone (écran). `CHW.cable(a, b, {mou, r, w, boucles})` trace un câble spiralé entre deux points écran (ex. micro fixé au pied : `CHW.cable(r.jack, CHW.accPt(rp, 'micro'))`). `CHW.ruban(a, b, {mou, w, couleur})` : ruban de bande entre deux points écran.

### bendSign de `M.ik` (vérifié page 6,5 : cibles devant, haut pour la main avant, bas pour l'arrière ; aucune alerte)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| géant (`C.chwGeant`, s 0,5–1) | 1 | 1 | 1 | 1 |
| pilote (`C.chwPilote`) | 1 | 1 | 1 | 1 |
| Burtt (`C.chwBurtt`) | 1 | 1 | 1 | 1 |
Usage : `const r0 = CHW.burtt(pose…)` ou `q = CHW.burttPose(pose)`, puis `M.ik(C.chwBurtt, q, x, FEET, 0.9, dir, 'armF', [X, Y], 1)`. Cible toujours DEVANT le personnage. Les enveloppes plient déjà le coude vers l'avant.

Pièges : le géant n'a pas de `cible` (positions de gestes fixes) ; pour une main vers un point, `M.ik` sur `CHW.geantPose(p)`. Une main vers sa propre oreille (pilote `oreilles`, Burtt `ecoute`) fait passer l'avant-bras sur la joue : c'est voulu (coude vers l'avant), le regard reste lisible. Le masque passe d'une main à l'autre par `tenu:'masque'` : sa prise avant est le MENTON, la seconde la NUQUE ; à l'échelle 0,9 d'un humain il est dessiné à `k:1` (≈ 10 % plus petit que sur le géant : invisible).

## Animaux (def.libre : dessin hors convention bras/jambes du kit — corps et pattes de bête, ni bras ni pieds humains)
`(x,y)` = sol sous le corps, regard vers +x (`o.dir`). Points : `CHW.animPt(r, 'tete'|'nez'|'bouche'|'patte'|'ventre'|'nageoire'|'defenses')` (selon l'animal). Toutes les poses 0..1 ; `t` obligatoire (respiration) ; `tete` (rad, + = baisse).
| Fonction | Échelle, taille | Poses |
|---|---|---|
| `CHW.ourson` | 1 : assis ≈ 230 px de haut ; debout ≈ 285 px | posture `debout` (défaut) \| `assis` ; `reclame` (patte avant tendue en avant-haut, tête levée) ; `gemit` (bouche en o, sourcils inquiets, tête levée) ; `boude` (tête basse détournée vers l'arrière, yeux mi-clos) ; `indigne` (gueule ouverte, oreilles en arrière, pattes ballantes) ; `ventre` (patte sur le ventre : « affamé ») ; `marche` = phase en tours (debout) |
| `CHW.ours({robe})` | 1 : debout ≈ 340 px, assis ≈ 270 ; fond (fente arrière) 0,75–0,8 | `robe` `'noir'` (museau fauve) \| `'brun'` \| `'grizzly'` (gris argenté, bosse d'épaule) ; `assis` \| `debout` ; `cri` (gueule ouverte, griffes en avant) ; `vexe` (nez levé, sourcils froncés, yeux mi-clos) ; `salut` (révérence : buste penché, tête basse, patte au ventre, yeux fermés) |
| `CHW.lion` | 1 : ≈ 330 × 215 px (queue comprise), crinière en mèches qui retombent sur le poitrail | `cri` (gueule ouverte, crinière gonflée) ; `vexe` (nez levé, sourcils froncés, queue qui fouette) ; `baille` (gueule béante, yeux fermés, tête rejetée) ; `salut` (avant abaissé, pattes avant allongées, tête inclinée) ; `marche` (phase) |
| `CHW.phoque` | 1 : ≈ 250 × 130 px (couché) | `cri` (tête levée, gueule ouverte) ; `vexe` (nez en l'air, yeux mi-clos) ; `salut` (nageoire avant levée qui s'agite, yeux fermés) |
| `CHW.blaireau` | 1 : ≈ 180 × 100 px (×1,3 sur son mot) | `cri` (gueule ouverte, crocs) ; `vexe` ; `salut` (tête inclinée, patte avant levée) ; `sort` 0..1 (0 = caché sous la ligne `y`, 1 = sorti ; découpé à `y` : poser `y` sur le trou du terrier) |
| `CHW.morse` | 1 : ≈ 330 × 150 px (+ défenses) ; s 0,8 au fond | `cri` (tête levée, gueule ouverte sous la moustache) ; `vexe` (moustache qui retombe, yeux mi-clos) ; `salut` (tête plongée, défenses vers le sol, nageoire levée) |
Pièges : l'ours `noir` partage la couleur de l'ours noir de `teddybear.js` (imposée par la fiche) : on les distingue par la posture debout et l'œil noir brillant ; ne pas les mettre côte à côte. `salut` du grizzly : la patte passe devant le museau quand le buste penche fort (garder ≤ 0,8). Un animal qui monte de derrière un décor : `clipAbove` (API §8) ou la couche `'avant'` du décor.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol). Point : `CHW.accPt(r, 'nom')`.
| Fonction | `(x,y)` = | Taille (échelle conseillée) | Options |
|---|---|---|---|
| `CHW.pain(x,y,s,o)` | milieu du dessous | miche ovale bombée 144 × 92 px (s 1 ; ×1,3 sur le gag), 3 entailles, farine | `croque` 0/1/2 (bouchées côté +x, mie ivoire) ; `sens` −1 (bouchées côté −x) ; points `haut`, `bord`, `centre` |
| `CHW.masque(x,y,s,o)` | bas du cou (ouverture sombre) | 133 × 150 px (s 1) | `bouche` 0..1 ; `k` (échelle interne) ; points `nuque`, `menton`, `oeil`, `cou` |
| `CHW.piedMicro(x,y,s,o)` | sol, centre du trépied | 330 px de haut avec le micro (s 1) | `micro` 0/1 ; `angle` (rad, défaut 0,9 : micro penché vers +x) ; `haut` (px, défaut 312 = pince) ; points `pince`, `micro` (tête du micro) |
| `CHW.micro(x,y,s,o)` | sortie du câble | 106 px (s 0,9) | points `tete`, `bas` |
| `CHW.ciseaux(x,y,s,o)` | sous le pivot | 135 px (s 0,9) | `ouvre` 0..1 ; points `pointe`, `pivot` |
| `CHW.bande(x,y,s,o)` | bout bas | `long` px (96) | `vent` (px), `couleur` ; ondule avec `t` |

## Décors récurrents (riches, 3 couches, animés en temps global ; avant `M.drawFloor()`)
`o.couche` : `'fond'` (toile + milieu) | `'avant'` (premier plan seul) | absent = tout. Pour un personnage DERRIÈRE le premier plan : décor `'fond'` → personnage → décor `'avant'` → `M.drawFloor()`. `up` (px) monte tout le décor.
| Appel | Options | Repères (`CHW.PLATEAU` / `CHW.FERME` / `CHW.STUDIO`) |
|---|---|---|
| `CHW.plateau(t, up, o)` | `coulisses` 0..1 (caméra sur chariot qui entre par la gauche, projecteur qui descend des cintres, perche de son en haut à droite) ; `projecteur` 0..1 (lumière + poussière ; défaut : s'allume quand `coulisses` → 1) ; `planete` 0..1 (0 dans les cintres → 1 posée, balance) ; `clignote` (vitesse des lampes, défaut 1 ; 3 au rugissement) ; `levier` 0..1 (les deux leviers basculent) | toile nuit en lés, étoiles qui scintillent, nébuleuse ; planète (250, 500), lune (900, 360) ; hublot centre (640, 640) r 196 (étoiles qui défilent) ; console x 300–1034, dessus y ≈ 1108–1150, lampes y 1130–1175 (couche `'avant'`) ; leviers `PL.leviers` [[330,1196],[372,1190]] (poignée ≈ (303, 1147)) ; siège du pilote x 238 (assise y 1300), second siège x 900 ; caisse x 900–1034, palmier x 96 ; câbles qui pendent ; projecteur (540, 300) ; caméra x 160 |
| `CHW.ferme(t, up, o)` | `bassin` 0..1 (monte de la trappe, x 690–1010, 110 px, eau qui ondule ; couche `'avant'`) ; `terrier` 0..1 (butte qui pousse, trou noir `FE.terrier.trou` ≈ x 400) ; `vent` (vitesse de l'éolienne, défaut 1 ; 3 pour la rafale) | ciel, montagnes, collines dorées, chênes ; cheval qui broute sur la crête y 756 (x 600–900), oiseaux, nuages, poussière dorée ; grange x 70–400 (toit y 770) ; éolienne roue (880, 610) r 104 ; meules, abreuvoir x 470 ; **barrière de l'enclos** x 560–1034, lisses y 1250 / 1300 / 1350 (couche `'avant'` : l'ourson monte derrière, `FEETB`) ; clôture basse x 60–300, seau x 173, fourche x 380, panneau x 940–1030 ; herbes qui ondulent |
| `CHW.studio(t, up, o)` | `ecran` 0..1 (faisceau, poussière, toile éclairée) + `drawEcran(cx, cy, w, h, k)` (image, clippée dans l'écran) ; `bobines` (rad/s, défaut 1,6) ; `lampe` 0..1 ; `grezille` (true : la lampe clignote) ; `niveau` (agitation des vu-mètres, défaut 1) | mur capitonné en damier, étagères de bobines x 440–700 (y 430 / 560), horloge `M.pendule` (540, 300), affiches planète / étoile x 760–1034 ; **écran** x 110–420, y 330–560 ; magnétophone de studio x 590–760, grandes bobines (632, 830) et (720, 830) r 48, têtes (676, 930) ; table de montage x 150–560, **dessus y 1176**, plateaux (250 / 440, 1168) ; tasse fumante (520, 1176) ; lampe (190, 1176) ; chariot à bandes barre y 590, x 760–1000 (rubans qui balancent) ; **console** (couche `'avant'`) x 770–1034, dessus y 1170, vu-mètres (820 / 940, 1060) ; tabouret x 110, corbeille x 990 |
Vignettes de téléphone (270 × 480) : page 9,97 de la planche (les trois décors habités).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'CHW\.' casting/scene.js`).
```js
// P1 : pilote aux commandes, mains sur le levier ; géant derrière la console (fente arrière)
CHW.plateau(t, 0, { couche: 'fond' }); CHW.geant({ t, rugit: k }, 760, FEETB, 0.92, { dir: -1, slot: ST.slotB, cast });
CHW.plateau(t, 0, { couche: 'avant', levier: 0.4 }); M.drawFloor();
CHW.pilote({ t, assis: 1, cible: [304, 1150], oreilles: ko }, 250, FEET, 0.9, { dir: 1, cast });
// P2 : Mayhew ôte la tête-masque, la garde contre la poitrine
CHW.geant({ t, ote: smooth(1.2, 2.2, t) }, 640, FEET, 1, { dir: -1, cast });
// P3 : Burtt brandit le pain, micro fixé au pied devant l'ourson
const rp = CHW.piedMicro(600, FEET, 1, { micro: 1 });
const rb = CHW.burtt({ t, brandit_pain: 1, casque: 'oreilles' }, 330, FEET, 0.9, { dir: 1, cast }); CHW.cable(rb.jack, CHW.accPt(rp, 'micro'), { mou: 40 });
```
