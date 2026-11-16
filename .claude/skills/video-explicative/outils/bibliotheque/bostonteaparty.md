# persos.md — « La Boston Tea Party, la révolte contre un thé moins cher » : mode d'emploi de `persos.js`

Espace de noms : `M.btp` (dans `scene.js` : `const BTP = M.btp;` à l'intérieur de l'IIFE de `SCENE`). Dans `S.init` : `BTP.init()` (pré-rendus `BTP.K` : ciels jour/nuit/aube, ville, 3 bandes d'eau, navire, taverne, enseigne, ballots, grue, lanterne, table, 3 fonds de Londres).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Planche : `casting/scene.js` (page = seconde ; 9,97 = dernière) : 0 planche + comparaisons · 1 gestes de Nathan · 2 contrebandier et lord · 3 marches · 4 bras 0 → 2,4 rad · 5 objets + port réduit · 6 prises agrandies · 7 port de jour · 8 port de nuit · 9,97 aube + 3 vignettes de Londres.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `BTP.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`, `o.rod:false`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). `BTP.nom.pose(p)` = pose finale sans dessiner, `BTP.nom.def(p)` = la définition (pour `M.ik`, `M.partMatrices`). Passer `t` dans la pose (marche, tremblement, filet).
Corps communs : bras à articulations rondes (rivet au centre), jambes en trois pièces `legF / legF_lo / footF` (et `legB…`), pied à plat pointe en avant. `handLen` 100.

Options communes à toutes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'tasse'` `'soucoupe'` `'canne'` `'cadenas'` `'sac'` `'rien'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'accessoire seul).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent.
- La main fait le poing autour de l'objet, des doigts couleur chair passent PAR-DESSUS ; la soucoupe repose à plat sur la paume ouverte (pas de doigts).
- `handF` / `handB` : `'fist'` | `'open'` | `'cup'` ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'closed'|'wide'|'half' }` ; `ang` (angles ajoutés), `tilt`, `dx`, `dy`, `hide`.
- Gestes communs (0..1) : `marche` (pas sur place, le plan déplace x ; `t` obligatoire, `cadence` 6) ; `assis` (+ `siege` hauteur locale, défaut 100 ; `pieds`) ; `leve` (poing levé, hourra) ; `surpris`.
- **Caisse portée** (toutes les marionnettes sauf le lord et le contrebandier qui ont leur charge) : `porter: 1` = caisse tenue à deux mains DEVANT le ventre (options de la caisse dans `porterO`) ; `lancer` 0..1 : 0 devant le ventre → 0,45 au-dessus de la tête (bras levés, buste en arrière) → **0,7 lâchée** vers l'avant ; au-delà, mains ouvertes qui accompagnent, la caisse n'est plus dessinée. `r.caisse = { x, y, rot, dir, s }` : pose écran exacte de la caisse ; pour la suite du vol : `BTP.caisse(r.caisse.x, r.caisse.y, r.caisse.s, { dir: r.caisse.dir, rot: r.caisse.rot })` puis trajectoire du plan. Points : `BTP.pt(r, 'dessus' | 'face')`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `BTP.nathan` (`C.btpNathan`) | 0,9 ≈ 456 px (cheveux) | `catogan ruban` (catogan châtain-roux, ruban noir) ; `capuche foulard drape` (déguisement) | `deguise` (0/1 : couverture brun-rouge sur la tête et les épaules, foulard sombre sur le bas du visage, yeux visibles ; catogan masqué) ; `porter`, `lancer` (ci-dessus) ; `boire` (met `tenu:'tasse'` si rien n'est tenu : tasse à la bouche, main autour, menton levé) ; `repousse` (bras avant tendu bas, main ouverte, buste en retrait, sourcils froncés) ; `perplexe` (main ouverte posée sur l'arrière du crâne, tête penchée, sourcils inquiets) ; `fier` (buste bombé, menton levé, poing avant sur la hanche, sourire) ; `cadenas` (accroupi, deux mains vers `cible` = `[x, y]` dans le repère des pieds, défaut `[116, −70]` ; à 0,9 : mains ≈ 105 px devant et 63 px au-dessus des pieds) |
| `BTP.contrebandier` (`C.btpContre`) | 0,9 ≈ 480 px (chapeau) ; voûté d'office | `chapeau` (feutre mou gris-brun à très large bord), `foulardCou` (ocre) ; charge `sac` | `sac` 1 plein → 0 flasque (sac de toile jeté sur l'épaule, col tenu par la main arrière) ; `sansSac: true` ; `verse` (le sac passe devant lui, col en bas vers l'avant, main avant au col, main arrière sous le sac ; filet de feuilles de thé dès 0,85, ou `filet` 0..1 imposé ; `filetY` = y écran où le filet s'arrête, défaut col + 150 px) ; `rabat` (main avant qui rabat le bord du chapeau, yeux mi-clos) ; `seul` (bras ballants, la main lâche le sac qui reste sur l'épaule et s'affaisse, tête basse). Point : `BTP.pt(r, 'bouche')` = col du sac (pour placer la théière d'un autre dessous) |
| `BTP.lord` (`C.btpLord`) | 0,8 (défaut) ≈ 422 px (perruque) ; vignette : voir Décors | `perruque` (poudrée, trois rouleaux, toupet haut), `bourse noeud` (bourse de soie noire), `jabot` | Tient TOUJOURS `tenu:'tasse'` (main avant) sur `tenuB:'soucoupe'` (paume arrière) ; `tenu:'rien', tenuB:'rien'` pour les ôter. Satisfait par défaut (sourire, yeux mi-clos). `siroter` (tasse à la bouche, yeux fermés) ; `furieux` (sourcils froncés, visage rouge, tasse levée qui tremble et éclabousse : `t` obligatoire) ; `ecrase` 0..1 (affaissé, la tasse brandie à bout de bras ; six caisses tombent l'une après l'autre sur lui : à 1 seules la tête et la tasse dépassent) ; `assis` + `siege` |
| `BTP.colon` (`C.btpColonA…D`) | `modele` `'a'` 0,82 ≈ 428 px · `'b'` 0,82 ≈ 428 · `'c'` 0,8 ≈ 413 · `'d'` 0,84 ≈ 425 | a `bonnet` ; b `tricorne` ; c `bonnet` ; d `catogan ruban` ; tous `capuche foulard drape` | a femme (robe bleu ardoise, tablier ivoire, fichu, bonnet blanc) ; b homme (veste moutarde, tricorne brun) ; c vieil homme (manteau gris, bonnet de laine rouge sombre, voûté, **canne tenue d'office** sauf `porter`/`lancer`/`leve`/`tenu` donné) ; d jeune homme (gilet bordeaux, manches de chemise retroussées, cheveux noirs en catogan). `deguise` (0/1) : couverture a gris, b ocre, c vert, d bleu + foulard sombre ; coiffes masquées. Gestes communs (`porter`, `lancer`, `marche`, `leve`…) |

**`bendSign` de `M.ik`** (vérifié page 1 et 2 : bras recalculés par `M.ik` sur les mains de chaque geste, zéro ligne ATTENTION) :

| Personnage | avant `dir 1` | avant `dir −1` | arrière `dir 1` | arrière `dir −1` |
|---|---|---|---|---|
| nathan, contrebandier, lord, colon a/b/c/d (tous gestes) | 1 | 1 | 1 | 1 |

Usage : `const q = BTP.nathan.pose(p), def = BTP.nathan.def(p), sol = M.ik(def, q, x, y, s, dir, 'armF', [X, Y], 1); q.ang.armF_up = sol.up; q.ang.armF_lo = sol.lo; M.puppet(def, q, x, y, s, { dir, slot, cast });`. Les gestes de l'enveloppe font déjà leur IK interne (coude toujours plié vers l'avant).

Pièges :
- **Couleurs changées au casting** : Nathan porte une redingote **bleu canard `#2f5552`** (et non vert éteint : identique à la robe de Franklin `#4E5E45` et proche de la veste de Jacques) ; le lord porte du **velours cramoisi `#6b2232`** (et non prune : le patron de `greve.js` et le conseiller de `barbenoire.js` sont en prune, perruque et jabot compris). Le texte de la voix ne doit pas nommer ces couleurs.
- `lancer` > 0,7 : la caisse n'est plus dessinée par la marionnette ; lire `r.caisse` à 0,7 et dessiner la caisse en vol soi-même (pas de saut).
- `porter`/`lancer` occupent les deux mains : ne pas leur ajouter `tenu`. Le contrebandier a sa propre charge (le sac) : pas de `porter` sur lui (sinon `sansSac:true`).
- Le filet de thé du sac se dessine en coordonnées écran : il ignore une transformation posée avant la marionnette (chute, rotation).
- La nuit, les marionnettes ne sont PAS assombries par le décor : régler `M.stageLight` (poursuite plus forte) dans le plan.
- La tasse est petite (≈ 37 × 26 px au poing du lord à 0,8) : pour un gros plan, agrandir le lord, pas la tasse.
- `tenu:'cadenas'` et `tenu:'sac'` (dans une main) existent mais n'ont pas été vérifiés en image : regarder la prise agrandie avant de les employer.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol).

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `BTP.caisse(x,y,s,o)` (0,9) | milieu du dessous | corps + couvercle 149 × 106 px ; pièce de cuivre 67 px de large, 20 px d'épaisseur ; pile de 6 ≈ 126 px de haut | `couvercle` 0..1 (charnière à l'arrière, thé en vrac visible ; la pile n'est plus dessinée si ouvert) ; `pieces` 0..6 (pile sur le couvercle ; fraction = la pièce du dessus tombe et se pose) ; `couronne` 0/1 (pièce d'or plus large, couronne en relief, EN BAS de la pile) ; `cadenas` `'ferme'`\|`'casse'`\|`'neuf'` (moraillon + cadenas ≈ 35 px) ; `flotte` 0/1 : `(x,y)` = surface de l'eau, caisse penchée (`penche` rad, défaut 0,3) à moitié immergée, rides, tangue avec `t` (passer `M.tg(t)`) et `ph` (déphasage) |
| `BTP.cadenas(x,y,s,o)` (1,4) | milieu du dessous du corps | 87 × 132 px | `etat` `'ferme'` (fer noirci) \| `'casse'` (anse ouverte tordue, fêlure) \| `'neuf'` (fer gris clair brillant) ; point `anse` (haut) |
| `BTP.tasse(x,y,s,o)` (0,8) | fond de la tasse | ≈ 48 × 26 px | `eclabousse` 0..1 + `t` (gouttes de thé) ; points `bord`, `fond` (tenue : `BTP.pt(r, 'bord')`) |
| `BTP.soucoupe(x,y,s,o)` (0,8) | milieu du dessous | ≈ 67 × 8 px | point `dessus` (tenue : `BTP.pt(r, 'dessus', true)`) |
| `BTP.sac(x,y,s,o)` (0,9) | nœud du col (le sac pend vers le bas) | plein 100 × 150 px, flasque 44 × 140 | `plein` 0..1 ; `filet` 0..1 + `filetY` + `t` ; points `bouche`, `fond` |

## Décors (pré-rendus par `BTP.init()`, animés en temps global `M.tg`)
| Appel | Pose | Repères utiles |
|---|---|---|
| `BTP.port(t, o)` → `{ navire: info }` | AVANT `M.drawFloor()` (toile, ville, rade, navires, coulisses) | `o.nuit` 0..1, `o.aube` 0..1 (la nuit pâlit : nuit 1 + aube 0 → 1), `o.navire` (x du trois-mâts, défaut 720 ; `false` = absent : arrivée p3 en faisant glisser x), `o.navireO` (`trappe` 0..1…), `o.table` (true), `o.lointains` (true : deux navires pâles au fond, x 190 et 470), `o.voile` 0..1 (voile qui se déploie sur le navire lointain de droite, p3), `o.fenetreEteinte` 0..1 (une fenêtre de la ville vers x 600 s'éteint, p5) |
| `BTP.portSol(t, o)` | APRÈS `M.drawFloor()`, avant les marionnettes | bord de quai à `ST.back`, bittes x 190 et 890, cordages lovés x 126 et 960 ; `o.nuit`, `o.aube` (assombrit le plancher) ; `o.amarre: info.navire.pt('proue')` (aussière vers le navire) |
| `BTP.navire(t, x, y, s, o)` | ligne de flottaison au milieu ; défaut du décor (720, 1322, 1) | 760 px de la poupe au bout du beaupré, 640 px de coque, grand mât jusqu'à y ≈ 630 ; pont y ≈ 1190 ; `o.couche` `'tout'`\|`'fond'`\|`'devant'` (pavois seul : le redessiner APRÈS des colons posés sur le pont pour cacher leurs pieds) ; `o.nuit`, `o.trappe` 0..1, `o.loin` (pâle), `o.voile`, `o.ph`. `info.pt('pont'\|'pontAvant'\|'pontArriere'\|'ecoutille'\|'proue'\|'poupe')`, `info.local([x, y])` = point du repère du navire |
| `BTP.londres(t, kind, cx, cy, rx, ry)` | dans le `draw` de `M.vignette` | `kind` `'parlement'` (boiseries, banc de cuir vert, siège vide à droite, chandelier à 3 flammes) \| `'entrepot'` (caisses jusqu'au plafond, poutres, lanterne) \| `'bureau'` (cheminée qui flambe, portrait sans visage, bureau à plume, pendule) ; fenêtre sur la Tamise et un clocher dans les trois |
| `BTP.londresPied(kind, cx, cy, rx, ry)` | → `{ x, y, s, assis, siege }` | placement du lord (dir 1) : tête entière dans l'ovale pour rx 190 × ry 160 (lord ≈ 274 px debout, s ≈ 0,52) ; parlement : assis sur le banc |

Positions fixes (écran) : taverne x 0–300 (fenêtres éclairées la nuit), enseigne-théière qui se balance en (404, 887), table `BTP.TABLE = { x: 340, dessus: 1315, banc: 1357 }`, grue x 300 (charge qui se balance en x ≈ 486), lanterne de quai x 812 (flamme y ≈ 1027, allumée la nuit), ballots et tonneaux x 820–1060, lune (330, 300), bandes d'eau à y 1162 / 1232 / 1306 (caisses qui flottent : `y` 1290–1330). Mouettes et nuages le jour, étoiles, lune et son reflet la nuit, fumées de cheminées, poissons, eau, navires et fanions unis en mouvement permanent.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'BTP\.' casting/scene.js`). Les plus utiles :
```js
const info = BTP.port(t, { nuit: 1, navireO: { trappe: 1 } }); M.drawFloor(); BTP.portSol(t, { nuit: 1, amarre: info.navire.pt('proue') });
const pv = info.navire.pt('pont');                                   // colons déguisés sur le pont, puis le pavois devant eux
BTP.colon({ t, modele: 'b', deguise: 1, lancer: 0.45 }, pv[0] - 40, pv[1], 0.4, { dir: -1, rod: false, floorShadow: false });
BTP.navire(t, 720, 1322, 1, { nuit: 1, couche: 'devant' });
const r = BTP.nathan({ t, porter: 1, porterO: { pieces: 6, couronne: 1 } }, 380, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
BTP.contrebandier({ t, verse: 1, filetY: 1180 }, 700, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
M.vignette(t, { x: 690, y: 520, rx: 190, ry: 160, t0: 1, draw: (cx, cy, rx, ry) => { BTP.londres(t, 'bureau', cx, cy, rx, ry);
  const L = BTP.londresPied('bureau', cx, cy, rx, ry); BTP.lord({ t, furieux: 1 }, L.x, L.y, L.s, { dir: 1, slot: L.y + 12 }); } });
```
