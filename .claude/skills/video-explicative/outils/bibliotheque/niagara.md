# persos.md — « Le tonneau du Niagara, la chute qui ne rapporta rien » : mode d'emploi de `persos.js`

Espace de noms : `M.nia` (alias : `const NIA = M.nia;`). Dans `S.init` : `NIA.init()` (pré-rendus : salon ×4 couches, rive (ciel, 4 bandes de rapides, 2 rochers, 2 arbres de coulisse, premier plan, barque), chutes (ciel+falaises, stries, plan intermédiaire, rochers, 3 bandes d'écume, premier plan, barque, panier)).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.

## Marionnettes (avec tige ; `slot` vaut `y + 34` par défaut = `ST.slotF` aux pieds `FEET` ; passer `slot: ST.slotB` au rang du fond)
Toujours par l'enveloppe `NIA.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes, cibles). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; poing avant `r.w('armF_lo', 4, 96)`, poing arrière `r.w('armB_lo', 4, 96)`).

Options communes (Annie et le manager) :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'bourse'` | `'photo'` | `'coussin'` | `'gaffe'` | tout autre nom avec `tenuO: { draw(o), grip:[x,y], p2:[x,y] (seconde prise, facultatif), plat:true (dessiné derrière l'avant-bras) }` (ex. le gâteau du plan 1 : `tenu:'gateau', tenuO:{ draw: monGateau, grip:[40,0], p2:[-40,0] }, deuxMains:true`). `tenuO.k` = échelle de l'objet en main (défaut 1) ; les autres clés de `tenuO` sont les options de l'objet seul.
- `droit` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` le tourne.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (coussin, gaffe, objet avec `p2`).
- `cible: [X,Y]` (écran) : le poing avant va sur ce point (`M.ik`, bendSign 1) ; `cibleK` 0..1 le mélange ; `cibleB` / `cibleBK` pour la main arrière. S'applique après les gestes.
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `t` (animations internes : cigare, `non`) ; `ang`, `hide`, `tilt`, `dx`, `dy` comme le kit.
- Une main sans geste ni objet pend le long du corps, coude un peu plié. Marche : `marche` = phase en pas (pieds joints aux entiers → instants des `pas`).
- Point nommé de l'objet tenu : `NIA.pt(r, 'nom')` → `[x, y]` écran (`NIA.pt(r, nom, true)` pour la main arrière). Bourse : `bouche`, `fond` ; photo : `centre`, `haut` ; coussin : `centre`, `avant` ; gaffe : `croc`, `talon`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `NIA.annie` (`C.niaAnnie`) | 0,9 : 452 px au crâne, 490 au sommet du chapeau, ≈ 515 avec la plume ; chapeau 178 px de large, ourlet 104 | `chignon`, `chapeau`, `fleurs`, `plume`, `giron` (assise) ; jambes `legF/legB` sous la robe (bottines visibles en marchant) | `souffle` (penchée, joues gonflées, bouche `o`, mains jointes) ; `toque` (poing en avant à hauteur de poitrine ; donner `cible` = point du tonneau ; le plan fait le va-et-vient 0,85↔1) ; `tendre` (bras tendu, ex. la photo) ; `retourne` (avec `tenu:'bourse'` : la bourse pivote autour du fermoir, bras levé ; `tenuO.ouverte` 0..1) ; `non` (main ouverte levée devant la poitrine, paume vers l'avant, qui fait non avec `t`, tête qui dodeline) ; `fiere` (menton levé, main posée sur la poitrine) ; `pousse` (avec `tenu:'coussin'`, deux mains : du torse vers l'avant-bas, buste penché ; viser l'ouverture avec `cible`) ; `montre` (objet tenu devant la poitrine, d'office quand un objet est tenu sans autre geste) ; états : `jeune` (cheveux châtains, sans rides ni lunettes), `pansement` (bandes ivoire, **masque le chapeau** sauf `chapeau:true` ou `chapeauEcrase`), `chapeauEcrase` (calotte aplatie, bord qui pend, plume cassée), `chapeau:false`, `assise` (voir pièges), `vieille` (un peu voûtée, cheveux plus blancs) |
| `NIA.manager` (`C.niaManager`) | 0,9 : 511 px (pas de chapeau), 70 px de large | `noeud`, `moustache`, `cigare` (fume avec `t`), `charge` (tonneau porté) | `porte` (tonneau dans les bras devant lui, buste en arrière ; `charge` d'office ; `chargeO` = options du tonneau ; `chargeS` = échelle du tonneau / échelle du manager, défaut 1/0,9) → `r.charge` = bas-centre du tonneau porté (écran) ; `pompe` (buste plié `pliage` rad, défaut 0,6 ; donner `cible`/`cibleB` = poignée, voir exemple) ; `tire` (deux poings en avant à hauteur de poitrine, buste en arrière, jambes arc-boutées ; la corde est dessinée par le plan depuis `r.w('armB_lo',4,96)`) ; `gaffe` (gaffe de batelier horizontale à deux mains, ≈ 550 px de long à 0,9, croc devant ; `tenuO.k` pour la raccourcir) ; `court` = phase en foulées (bras qui battent ; avec `porte:1` = il fuit avec le tonneau) ; `bonimente` (bras avant ouvert, main ouverte, bouche ouverte, poing arrière au revers) ; `marche` |
| `NIA.chat(pose, x, y, s, o)` (`def.libre` : animal) | 1 : 144 px aux oreilles, ≈ 250 px du nez au bout de la queue | `queue`, `tete`, 4 pattes `pAvP pArP` (près) `pAvL pArL` (loin) | `marche` (phase), `assis`, `herisse` (dos rond, queue en goupillon, bouche ouverte), `saute` (étiré, pattes en avant / en arrière ; le plan donne la trajectoire avec `dy` ou `y`), `mouille` (poils en pointes, gouttes avec `t`), `bosse` (bosse ronde + pansement croisé ivoire) ; `o.rod:false` pour un chat lointain |

Pièges :
- Annie `assise` : jambes masquées, hanche à 150 unités du sol (135 px à 0,9), genoux et bottines vers x +125…+178 (×s) devant elle : le plan dessine la chaise **derrière** elle, siège à `FEET − 135`.
- `pansement` cache le chapeau (on ne voit pas un bandage sous un grand chapeau) ; `chapeauEcrase` le remet, cabossé, par-dessus.
- `pompe` : le manager est très grand ; à 0,9, poser la pompe à l'échelle **1,15** (poignée à ≈ 210 px du sol) et le manager ≈ 130 px derrière elle, sinon la poignée est hors de portée (bras tendu à fond) ; `pliage` jusqu'à 0,8 pour descendre plus bas.
- Les gestes sont des angles calculés dans le repère du torse : ils marchent tels quels dans les deux directions. Deux gestes de bras avant en même temps : le dernier de la liste (ordre ci-dessus) l'emporte.
- `face.mouth` : le manager sourit par défaut (`'smile'`) ; le cigare reste à la bouche.

### `bendSign` de `M.ik` (vérifié au casting : toque, pousse, pompe à cible ; gestes et flexions 0 → 2,4 rad ; aucune ligne ATTENTION)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Annie (tous gestes) | 1 | 1 | 1 | 1 |
| Manager (tous gestes) | 1 | 1 | 1 | 1 |
Les enveloppes appliquent d'elles-mêmes le coude vers l'avant ; pour un `M.ik` à la main : `M.ik(C.niaAnnie, pose, x, y, s, dir, 'armF', [X, Y], 1)` (même `x, y, s, dir`, pose déjà préparée par `NIA.anniePose(pose)` ou `NIA.managerPose(pose)`).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.alpha`, `o.cast` (ombre portée), `o.ombre` (ombre au sol), `o.t`. (`o.rot` n'existe pas : tourner le tonneau avec `roule`.)

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `NIA.tonneau(x,y,s,o)` | sol sous le centre | 1 : 330 × 220 px debout (×1,2 quand il porte le gag) | `couvercle` 0 fermé … 0,4 soulevé … 1 posé debout contre le flanc (`couvercleCote` 1 devant / −1 derrière ; `couvercleVu:false` le cache à 1) ; `interieur` `'vide'`\|`'matelas'`\|`'coussins'`\|`'chat'`\|`'annie'` (visible dès que `couvercle` > 0 : Annie à 0,9 × l'échelle du tonneau, tête, chapeau, épaules, avant-bras posés sur le bord ; `interieurO` = ses options : `face`, `pansement`, `chapeauEcrase`, `jeune`… ; `chatBosse`) ; `corde` (cordage en harnais + boucle) ; `mouille` (bois foncé, reflets, gouttes qui glissent avec `t`) ; `sens` `'debout'`\|`'couche'` (couché, fond à droite)\|`'bout'` (vu en bout, rond : pour rouler en travers de la scène) ; `roule` (rad, autour du centre : `roule = distance / 108 / s` pour un roulement sans glisser) |
| `NIA.tonneauPt(x,y,s,o,nom)` | — | point écran | `'haut'` (centre de l'ouverture), `'centre'`, `'bas'`, `'bonde'`, `'flancAvant'` ; mêmes `o` que le dessin (`sens`, `roule`, `dir`) |
| `NIA.bourse(x,y,s,o)` | bas de la bourse | 1,4 : 132 × 123 px | `ouverte` 0..1 (la barre arrière du fermoir bascule, intérieur noir) ; `retournee` 0..1 (pivote autour du fermoir) ; en main : tenue **par le fermoir**, elle pend sous le poing |
| `NIA.mite(t,x,y,s,t0,o)` | point de départ (ex. `NIA.pt(r,'bouche')`) | 1 : 36 px d'envergure | rien avant `t0` ; zigzag vers le haut, ailes qui battent ; `o.dir` ±1, `o.dur` (5 s puis disparaît), `o.haut` (260 px de montée sur `dur`) |
| `NIA.photo(x,y,s,o)` | bord inférieur | 1 : 104 × 76 px (en main : 94 × 68 à 0,9) | carte de face : petit dessin d'Annie à côté du tonneau, sans lettre ; en main : tenue par le bord inférieur, derrière l'avant-bras |
| `NIA.coussin(x,y,s,o)` | dessous | 1 : 100 × 52 px | ocre rayé, glands rouges ; en main : prise au bout avant + seconde main au bout arrière |
| `NIA.pompe(x,y,s,o)` | bas-centre (socle) | 1 : 160 px (`piston` 0) … 222 px (`piston` 1), poignée 96 px | `piston` 0..1 ; `tuyau: [X,Y]` (écran) = bout du tuyau noir (sinon petite boucle au sol) ; `dir` = côté du tuyau |
| `NIA.pompePt(x,y,s,o,nom)` | — | point écran | `'poignee'` (centre de la poignée, selon `o.piston`), `'embout'` |

## Décors (pré-rendus par `NIA.init()` ; à dessiner EN PREMIER, avant `M.drawFloor()`)
Chaque fonction dessine tout le lieu (toile de fond, plan intermédiaire, premier plan) et ses animations d'ambiance en **temps global** ; les événements prennent un instant **local** du plan. `up` (px) remonte tout le décor (cintres) ; zone x 250–800 / y 900–1430 laissée aux personnages (sauf la table du salon).

| Appel | Contenu | Options (`o`) et repères |
|---|---|---|
| `NIA.salon(t, up, o)` puis, après `M.drawFloor()`, `NIA.salonSol(t, {panier})` | papier peint vert à fleurs ocre, cimaise, lambris ; fenêtre à petits carreaux (érable roux, nuage, feuilles qui tombent, voilages animés, géranium), portrait ovale du mari au crêpe noir, pendule (balancier), lampe à pétrole suspendue (flamme), étagère (globe, factures à lignes ondulées, boîte à couture), poêle en fonte (braises, fumée de la bouilloire), parapluie, commode, tableau noir sur chevalet (maison, pomme, soleil), rayon de fenêtre + poussière ; table ronde à nappe + chaise ; sol : tapis élimé, panier à ouvrage | `table:false` (retire table et chaise) ; `feuilleT0` (p1 : une feuille d'érable se détache derrière la fenêtre, 3,2 s) ; `ventT0` (p2 : coup de vent dans les voilages, retombe en ≈ 2 s). `NIA.SALON` : `table {x:420, y:1168 (dessus), rx:106}`, `fenetre`, `poele`, `lampe {x:560, y:650}`, `tableau` |
| `NIA.rive(t, up, o)` | ciel d'automne, nuages, mouettes, gorge et rive canadienne rousse et or, brume des chutes (fumée blanche lente) et arc-en-ciel pâle à droite ; 4 bandes de rapides qui défilent vers la droite, 2 rochers à écume ; arbres d'automne en coulisses (feuilles qui tombent) ; ponton sur pilotis à gauche (caisse, rames, cordage, poteau à lanterne allumée, bouée de liège), barque amarrée, rive droite (seau et maillet de tonnelier, douelles) ; 3 mouettes posées sur le rocher de droite | `poissonT0` (un poisson saute vers `NIA.RIVE.poisson = {x:720, y:1010}`) ; `mouettesT0` (les mouettes posées s'envolent) ; `NIA.RIVE.ponton = {x0:40, x1:430, y:1262}` (dessus du ponton) ; le décor couvre tout le cadre : au plan 4, dessiner `NIA.chutes(t, 0, …)` puis `NIA.rive(t, up, …)` avec `up` qui monte |
| `NIA.chutes(t, up, o)` | fer à cheval vu d'en bas (stries qui descendent), falaises de calcaire ocre, brume qui monte, arc-en-ciel qui scintille, mouettes ; escalier de bois des visiteurs (gauche), belvédère à rambarde (droite, passants en ombre chinoise) ; 3 bandes d'écume qui ondulent, rochers noirs mouillés ; rive de galets, bornes et cordages, gaffe posée, poteau à lanterne allumée, barque des secours | `descente` 0..1 (stries plus rapides, brume plus haute, gerbe d'écume au point d'impact `NIA.CHUTES.impact = [540, 905]`) ; `passants` (défaut vrai ; `false` au plan 4) ; `chatT0` (le chat cabossé traverse le belvédère en 7 s) ; `tangueT0` (la barque tangue) ; `panier` (panier de pique-nique, x 270) ; `fanions` (guirlande sans lettre en haut de scène) + `fanionT0` (un fanion se décroche et flotte jusqu'au sol). `NIA.CHUTES` : `crete:422`, `bas:905`, `x0:170`, `x1:910`, `belvedere {x0:790, x1:990, y:716}` |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'NIA\.' casting/scene.js`). Les plus utiles :
```js
// Annie frappe du poing sur le tonneau (main sur son flanc, deux directions)
const bx = 400; NIA.tonneau(bx, FEET, 1, { t, cast });
NIA.annie({ t, toque: 1, cible: [bx - dir * 100, FEET - 250] }, bx - dir * 210, FEET, 0.9, { dir, cast });
// Annie retourne sa bourse ouverte : une mite s'envole de la bouche
const r = NIA.annie({ t, tenu: 'bourse', retourne: k, tenuO: { ouverte: 1 } }, 500, FEET, 0.9, { dir: 1, cast });
const b = NIA.pt(r, 'bouche'); NIA.mite(t, b[0], b[1], 1, 4.2, { dir: 1 });
// le manager pompe : deux poings sur la poignée
const pp = NIA.pompePt(640, FEET, 1.15, { piston: pis }, 'poignee'); NIA.pompe(640, FEET, 1.15, { piston: pis, tuyau: NIA.tonneauPt(820, FEET, 1, {}, 'bonde') });
NIA.manager({ t, pompe: 1, cible: [pp[0] + 14, pp[1]], cibleB: [pp[0] - 16, pp[1] + 2] }, 510, FEET, 0.9, { dir: 1, cast });
// Annie dans le tonneau ouvert, pansement et chapeau écrasé
NIA.tonneau(540, FEET, 1.2, { t, couvercle: 1, interieur: 'annie', interieurO: { pansement: 1, chapeauEcrase: 1 }, mouille: 1 });
```
