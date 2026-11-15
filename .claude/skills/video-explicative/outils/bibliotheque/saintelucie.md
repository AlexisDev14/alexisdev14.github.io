# persos.md — « La Sainte-Luce, le dicton qui a perdu dix jours » : mode d'emploi de `persos.js`

Espace de noms : `M.luc` (alias : `const LUC = M.luc;`). Dans `S.init` : `LUC.init()` (pré-rendus `LUC.K` : roue, médaillon, rue (fond, maison de Lucette, maison voisine, premier plan, jardinière), village (ciel, fond, chaumières/puits/meule/charrette, premier plan, arbre)). Pour Anselme au lit : la bibliothèque `changementheure.js` est chargée d'office (rien à appeler).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses ; tailles en px **à l'écran** à cette échelle (planche `casting/`). Aucun texte, chiffre ni croix : pictogrammes seulement.
Planche `casting/scene.js` (page = instant) : 0 comparaisons · 1 Lucette dir 1 (haut) / −1 (bas) · 2 pape · 3 Anselme + lits · 4 bras 0 → −2,4 rad · 5 prises s 1,6 + poses de la puce · 6 objets · 7 rue · 8 village + roue · 9,97 vignettes 270 × 480.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `LUC.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`, `o.rod`) : elle prépare la pose (gestes, objet tenu, seconde main) et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale ; `r.main` / `r.mainB` = poing avant / arrière). Pose seule : `LUC.lucettePose(pose, x, y, s, dir)` (idem `papePose`, `anselmePose`) ; défs : `M.chars.lucLucette`, `lucPape`, `lucAnselme`, `lucPuce`.
Options communes (toujours passer **`t`**) :
- `tenu` / `tenuB` : `'almanach'` | `'bougeoir'` | `'liasse'` | `'feuillet'` | `'rien'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul) + `echelle` (défaut 1 ; 0,9 almanach lu, 0,72 almanach récité, 0,8 bougeoir d'Anselme).
- `droit` / `droitB` : `true` d'office quand un objet est tenu (il reste droit à l'écran) ; `ang.objet` le tourne. Doigts couleur peau dessinés par-dessus l'objet (la main entoure le bord).
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (almanach lu, liasse) ; `deuxK` 0..1 la fait venir progressivement.
- `lit` 0..1 : almanach **ouvert** tenu à deux mains, bas devant la poitrine (haut du livre sous le menton), tête un peu baissée. `tenuO.ouvert` (défaut 1) le referme.
- `marche` 0..1 + `pas` (cycles ; défaut `t·1,6`) : jambes en opposition, petits rebonds, pieds pointe en avant (pape : marche glissée, souliers qui avancent sous la soutane). `parle` 0..1 : bouche qui bouge.
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'closed'|'wide'|'half' }`.
- Point de l'objet tenu : `LUC.pt(r, 'centre'|'haut'|'meche'|'plateau', arriere)` → `[x, y]`.
- Gestes = réglages 0..1 lissés par `ease` : les faire varier avec `smooth(t0, t1, t)`.

| Fonction | Échelle, taille | Pièces en plus | Gestes (0..1 sauf mention) |
|---|---|---|---|
| `LUC.lucette` | 0,9 ≈ 455 px ; ≈ 85 px de large | `chignon`, `echarpe`, `echarpeBout` | `lit` ; `recite` (almanach ouvert dans la main ARRIÈRE, bas devant la taille, main avant ouverte au-dessus de l'épaule, menton levé, parle d'office) ; `arrache` + `cible` [x,y] (le poing va pincer la cible) + `tire` 0..1 (tire vers le bas et vers elle, −46·dir, +64 px) ; `regardeCiel` (menton levé, main avant en visière au front) ; `surprise` (mains ouvertes levées, yeux ronds, bouche « o ») ; `frisson` (les deux mains à l'écharpe, tremble) ; `clin` (> 0,5 : œil fermé + sourire) ; sourire par défaut (`face.mouth:'n'` pour l'ôter) |
| `LUC.pape` | 0,92 ≈ 470 px (calotte comprise) ; calotte (zucchetto) BLANCHE, barbe gris-blanc courte et taillée, mozzette rouge, soutane ivoire, étole or | `barbe`, `camauro` (= la calotte blanche), `hermine` (vide, gardée pour l'API), `souF`, `souB` (souliers) | `lit` ; `designe` + `cible` (bras avant tendu vers la cible, main OUVERTE) ; `arrache` + `cible` : 0 → 0,5 les deux poings vont sur la cible, 0,5 → 1 ils ramènent devant la poitrine (passer `tenu:'liasse'` dès qu'elle est saisie : la main arrière suit la liasse) ; `lance` (bras levés vers l'avant ; > 0,62 la liasse n'est plus tenue, mains ouvertes : faire voler les feuillets) ; `satisfait` (main avant sur l'étole, menton levé, sourire) ; `baille` (bras en V, bouche « o », yeux fermés) ; `marche` (glissée) |
| `LUC.anselme` | 0,9 ≈ 470 px (pompon compris), ventre ≈ 110 px | `beguin`, `ruche`, `pompon`, `fraise`, `barbe`, `moustache`, `lien`, `gland` | `souffle` (bougeoir mis d'office : la flamme vient devant la bouche et se couche, joues gonflées ; `tenuO.flamme` 0..1 pour l'éteindre, `tenuO.fumee` 0..1 pour le filet) ; `tenu:'bougeoir'` seul = tenu devant la poitrine ; `baille` (bras en V, grande bouche ronde `'O'`, yeux fermés) ; `lit` ; `salut` (s'incline : buste plié, main sur le ventre) ; `marche` ; `face.joues` (joues gonflées) |
| `LUC.paysan(pose, x, y, s, o)` | `C.paysan` de reblochon.js, inchangé (0,9) | — | pose de `C.paysan` (fusionner `REB.marche(ph)`) + `lit` 0..1 (almanach ouvert à deux mains, doigts par-dessus), `ouvert` (défaut 1), `echelle` (0,9) |

Pièges : un angle `ang.armF_*` passé à la main est le point de départ des gestes (ils s'y mélangent). `lance` vide la main : dessiner la liasse/les feuillets soi-même ensuite. L'almanach lu cache le ventre, jamais le visage ; ne pas l'agrandir au-delà d'`echelle` 0,95 (la main avant n'atteint plus le coin). La liasse du pape : `echelle` ≤ 0,9 à s 0,92 (au-delà la main arrière n'atteint plus le bord).

### `bendSign` de `M.ik` (pages 1 à 4, dir 1 et −1 : aucune ligne « ATTENTION coude / main derrière le dos / pied »)
| Personnage, geste | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Lucette `lit`, `arrache`, `regardeCiel`, `frisson`, seconde main | 1 | 1 | 1 | 1 |
| Pape `designe`, `arrache`, `satisfait`, liasse à deux mains | 1 | 1 | 1 | 1 |
| Anselme `souffle`, `lit` ; paysan `lit` | 1 | 1 | 1 | 1 |
Les enveloppes l'appliquent d'elles-mêmes ; pour un `M.ik` à la main : `M.ik(M.chars.lucLucette, r.q, x, y, s, dir, 'armF', [X, Y], 1)` (même `x, y, s, dir`). Balayage épaule/coude 0 → −2,4 rad (page 4) : articulations rondes, rivet au centre. Bras en V sans « main derrière le dos » : `armF_up −2,35, armF_lo −0,25, armB_up −3,05`.

### Puce sur l'épaule de Lucette
`const r = LUC.lucette(…); const e = LUC.epaulePuce(r, sp); LUC.puce(t, e[0], e[1], sp, { dir: r.dir, pose: 'fiere' });` (dessiner la puce APRÈS Lucette). Le visage reste dégagé ; le corps de la puce passe derrière la tête (chignon couvert). `r.epaule` = dessus de l'écharpe.

## Anselme au lit (lit à baldaquin de `changementheure.js`)
`LUC.anselmeLit(t, x, y, s, o)` : `(x,y)` = sol au milieu du lit ; s 0,9 (défaut, comme debout ; le lit fait alors ≈ 600 × 740 px). `o.pose` : `couche` (défaut 1 ; yeux fermés d'office), `assis` 0..1 (buste relevé, il glisse vers la tête du lit), `baille`, `face`… ; `o.dir` (1 = tête du lit à gauche) ; `o.couv` 0..1 (édredon sur le buste ; défaut 0,82 couché → 0,1 assis) ; `o.fond:false` / `o.devant:false` ; `o.cast`, `o.castPerso`. Renvoie `r` (`r.q`, `r.dessus`). Rien n'est dessiné sous le matelas (bas de la robe coupé). Points du lit : `M.hdh.litPt(x, y, s, {style:'baldaquin', dir}, 'hanche'|'oreiller'|'pied'|'matelas')` (bois de lit pour la puce : `'pied'`).

## La puce (marionnette à fil, sans tige ; pattes `def.libre`)
`LUC.puce(t, x, y, s, o)` : `(x,y)` = sous les pattes ; s 1 ≈ 150 px de long × 95 de haut (≥ 120 px : s ≥ 0,85). `o.pose` `'assise'` | `'prete'` (accroupie) | `'saut'` + `o.u` 0..1 | `'fiere'` (dressée, poitrail en avant, sourire) | `'accrochee'` (**`(x,y)` = le bord saisi** par les pattes avant, corps pendu dessous) | `'dort'` (paupière fermée, tête qui dodeline) | `'etourdie'` (pupille qui tourne, bouche « o ») ; `o.dir` ; `o.lid` 0..1 ; `o.regard` [dx,dy] (±5) ; `o.bouche` `'n'|'o'|'smile'` ; `o.oeil:{sourcil:'fier'|'colere'|'surpris'}` ; `o.tilt` ; `o.ang` (pièces `corps tete antF antB pAv pMi cuisse jambe` + `…B`) ; `o.fil` (true : fil noir jusqu'aux cintres) ; `o.filX` ; `o.cast` ; `o.ombre`. Renvoie `r` (`r.dos` attache du fil, `r.oeil`, `r.pinces` bout des pattes avant, `r.pied`).
`LUC.sautPt(t, t0, dur, de, a, haut)` → `{x, y, u, vol, pose}` : arc de `de` [x,y] à `a` [x,y], hauteur `haut` px ; passer `Object.assign({}, S.pose, {…})` à `LUC.puce` (`'prete'` 0,3 s avant t0, `'assise'` après l'arrivée, `dir` = sens du saut).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre`, `o.t`.
| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `LUC.ephemeride(x,y,s,o)` `taille:'murale'` | centre du carton | 150 × 200 ; feuillet 124 × 140 (picto ≈ 100) | `top` (picto du dessus), `dessous` (picto révélé), `pile` (feuillets restants, défaut 20 : épaisseur de la tranche), `arrache` 0..1 (0 → 0,6 le coin se décolle, 0,6 → 1 le feuillet part en tournant ; à 1 il n'est plus dessiné : prendre le relais avec `LUC.feuillet` ou `tenu:'feuillet'`), `coin` `'gauche'|'droite'` |
| `LUC.ephemeride` `taille:'chevalet'` | sol | carton 315 × 420 sur chevalet sculpté, hauteur ≈ 850 | mêmes options |
| `LUC.ephPt(x,y,s,o,nom)` | — | — | mêmes `x,y,s,o` ; `nom` `'coin'` (coin saisi, suit `arrache` : cible de Lucette), `'centre'`, `'haut'` (barrette), `'clou'`, `'bas'` (bas de la pile), `'sommet'` (fronton du chevalet : perchoir de la puce) |
| `LUC.feuillet(x,y,s,ang,picto,k,o)` | centre | 124 × 140 | `k` −1..1 retournement (1 face, 0 de chant, < 0 verso) |
| `LUC.feuilletChute(t,t0,x0,y0,o)` | — | — | → `{x,y,ang,k,pose}` (null avant t0) ; `o.vx` dérive, `o.haut` montée initiale, `o.vitesse` (230), `o.sol` (1416), `o.seed` |
| `LUC.almanach(x,y,s,o)` | milieu du dos (reliure) | fermé 106 × 156 ; ouvert ≈ 210 de large | `ouvert` 0..1 (la couverture tourne) ; couverture bleu nuit, soleil et croissant dorés ; pages à vignettes (soleil, lune, épi, étoile) |
| `LUC.bougeoir(x,y,s,o)` | sous le plateau | plateau 104, ≈ 135 de haut, anneau côté arrière | `haut` 0..1, `flamme` 0..1, `vent` (rad, flamme couchée), `fumee` 0..1 ; point `meche` |
| `LUC.liasse(x,y,s,o)` | centre | 124 × 140 + épaisseur | `n` (épaisseur, 10), `top` (picto) |
| `LUC.picto(nom,x,y,k)` | centre | boîte ≈ 100 | dessin brut ; `LUC.PICTOS` : `bougie houx feuille gland champignon pomme lune etoile nuage flocon chataigne oiseau poisson sapin soleil poire` (tous différents, aucun chiffre) |

## La roue des mois et le Soleil d'hiver
`LUC.roue(t, x, y, s, o)` : `(x,y)` = moyeu (décor : `LUC.VIL.roue` = (540, 640)) ; Ø 560 (588 avec les crans) à s 1. `o.rot` (rad, sens horaire), `o.chaines` (true : deux chaînes vers les cintres), `o.eclat` 0..1 (éclat d'or qui balaie César), `o.cast`, `o.alpha`. 12 secteurs (janvier en haut, sens horaire) : feu, flocon, vigne, fleurs, oiseau, moutons, faux, gerbe, raisin, semailles, glands, sapin (décembre, bleu nuit). Moyeu FIXE (ne tourne pas) : médaillon d'or au profil de César lauré. 150 crans de 2,4°.
Repères du secteur de décembre (≈ 56 × 124 px chacun, haut vers la jante) : **bougie** (Sainte-Luce) puis **houx** 10 crans plus loin dans le sens horaire. `LUC.repere(nom, rot, {x,y,s})` : `nom` `'bougie'` | `'houx'` | nombre de crans depuis la bougie (0 → 10, fractions permises) → `{a, centre, tete, pied, jante (sur les crans : perchoir de la puce), soleil (centre du Soleil sur sa tige, à R + 104)}`. À `rot` 0 la bougie est en haut à gauche (27° de la verticale) ; `rot` 1,52 la met en haut à droite (−30°), Soleil en (873, 448). Garder le Soleil sous y ≈ 300 (lambrequin).
`LUC.soleilJante(t, pos, rot, o)` : le Soleil d'hiver (Ø ≈ 126) sur sa tige de laiton, coulisseau sur la jante au cran `pos` (`'bougie'`, `'houx'` ou nombre ; glisser = faire varier `pos` de 10 à 0) ; `o.roue {x,y,s}`, `o.humeur` −1 ravi … 1 dépité, `o.penche` (rad), `o.agite` 0..1, `o.visage` (true), `o.taille`. Renvoie le repère. `LUC.soleilHiver(t, x, y, s, o)` : le Soleil seul (`o.tige` [x0,y0]).

## Décors récurrents (fonctions pures de `t` LOCAL, ambiance en temps global ; à dessiner avant `M.drawFloor()`)
| Appel | Couches et animations | Repères (`LUC.RUE`, `LUC.VIL`) |
|---|---|---|
| `LUC.rueAujourdhui(t, o)` | ciel peint (étoiles, croissant de lune la nuit), soleil de carton sur son fil ; fond : collines, toits enneigés, clocher à toit d'ardoise et girouette-oiseau ; maison de Lucette (crépi ocre, volets verts, porte bleue, fenêtre à six carreaux + voilage, lucarne, cheminée qui fume) et maison voisine (voilage, boîte aux lettres jaune) ; premier plan : réverbère, banc enneigé, muret, vélo, sapin en pot à guirlande qui clignote, paillasson, jardinière de géraniums gelés ; flocons, oiseaux, chat. Tout le décor est teinté selon `ciel` (pas les marionnettes). | `o.ciel` 0 après-midi doré → 1 crépuscule → 2 nuit → 3 petit matin sombre (continu, défaut 1) ; `o.soleil` [x,y] \| false (défaut : (790, 420) à ciel 0 → (790, 680) à 1 → caché derrière le toit voisin vers 1,4 ; plus dessiné au-delà de 1,7) ; `o.soleilMatin` [x,y] \| false (défaut au-delà de 2,4 : (215, 655), il pointe juste au-dessus du faîte gauche y 640) ; `o.reverbere` 0..1 (défaut : s'allume entre ciel 0,9 et 1,4) ; `o.fenetre` 0..1 (Lucette, défaut selon ciel) ; `o.voisine` 0..1 ; `o.chat` 0..1 (passe sur le muret de x 1080 à 800, s'assoit à 0,85 ; absent si non donné) ; `o.neige` (0,5) ; `o.jardiniere:false` puis `LUC.rueJardiniere(t, {ciel})` APRÈS la puce pour la cacher derrière. Porte x 350–480 (haut 870) ; fenêtre x 125–285, y 905–1055 ; **appui y 1056, x 110–300** ; jardinière x 118–298 ; **éphéméride murale (566, 990)** à s 1 ; lampe du réverbère (612, 792) ; muret y 1300 ; fenêtre voisine x 760–890, y 960–1100 ; faîtes y 640 (Lucette) et 740 (voisine) ; banc x 130–300 y 1310 |
| `LUC.villageHiver(t, o)` | ciel gris rose, nuages, corbeaux ; fond : collines enneigées, bois de sapins, clocher roman à baies géminées (sans croix) ; deux chaumières à colombages (une écharpe par travée) au chaume enneigé, cheminées qui fument, puits rond à petit toit, meule de foin, charrette à bras ; premier plan : plessis tressé (brindilles qui tremblent), fagots, tonneau, souche et hache, trois poules qui picorent ; arbre nu en coulisse à gauche ; flocons | `o.corbeau` 0..1 (vient se poser sur le toit du puits, posé dès 0,7) ; `o.poule` 0..1 (une poule traverse de droite à gauche) ; `o.neige` (0,6) ; `o.fumee` (true). Place libre au centre-haut : roue en `VIL.roue` (540, 640) ; toit du puits (560, 1122), margelle y 1300 ; plessis x 120–470 (haut y 1272) ; poules x 612, 668, 742 ; souche (800, 1350) ; meule x 455 ; charrette x 700 |
`LUC.flocons(t, {n, a, seed})` : les mêmes flocons, à part.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'LUC\.' casting/scene.js`).
```js
// plan 1 : Lucette arrache le feuillet du dessus (coin gauche), la bougie apparaît dessous
const EO = { top: 'feuille', dessous: 'bougie', arrache: smooth(1.3, 1.9, t), pile: 22 };
LUC.ephemeride(LUC.RUE.eph.x, LUC.RUE.eph.y, 1, EO);
LUC.lucette({ t, arrache: smooth(0.9, 1.3, t), cible: LUC.ephPt(LUC.RUE.eph.x, LUC.RUE.eph.y, 1, EO, 'coin') }, 420, FEETB, 0.9, { dir: 1, slot: ST.slotB, cast });
// plan 2 : la roue et le Soleil qui glisse du houx (10) à la bougie (0), la puce sur la bougie
LUC.roue(t, 540, 640, 1, { rot: 1.52, eclat: smooth(2.8, 3.5, t) });
const R = LUC.soleilJante(t, lerp(10, 0, smooth(5.55, 7.8, t)), 1.52, {});
LUC.puce(t, LUC.repere('bougie', 1.52).jante[0], LUC.repere('bougie', 1.52).jante[1], 1, { pose: 'fiere', dir: -1 });
// plan 3 : le pape arrache la liasse du chevalet à deux mains
const ch = { taille: 'chevalet', top: 'pomme', pile: 30 };                        // chevalet à x 380, s 0,75 : le pape à moins de ≈ 170 px du carton
LUC.ephemeride(380, FEETB, 0.75, ch);
LUC.pape({ t, arrache: smooth(4.4, 5.4, t), cible: LUC.ephPt(380, FEETB, 0.75, ch, 'centre'), tenu: t > 4.9 ? 'liasse' : 'rien', tenuO: { n: 10, top: 'etoile', echelle: 0.8 } }, 540, FEETB, 0.92, { dir: -1, slot: ST.slotB, cast });
```
