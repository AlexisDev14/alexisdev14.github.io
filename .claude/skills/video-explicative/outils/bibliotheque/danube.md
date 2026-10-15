# persos.md — « Le Beau Danube bleu, la valse que Brahms enviait » : mode d'emploi de `persos.js`

Espace de noms : `M.dan` (dans `scene.js` : `const DAN = M.dan;` à l'intérieur de l'IIFE de `SCENE`). Dans `S.init` : `DAN.init()` (pré-rendus `DAN.K.salle`, `DAN.K.salon`, `DAN.K.lustre`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle. `FEET = ST.slotF - 34`, `FEETB = ST.slotB - 30`.
Aucun texte, lettre ni chiffre nulle part (portées et notes seulement). Planche de référence : `casting/scene.js` (une page par seconde ; 9,97 s = objets).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `DAN.nom(pose, x, y, s, o)` : elle calcule les gestes avec `M.ik` (il faut donc l'appeler sous la même transformation de contexte que le dessin, comme `M.puppet`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran). Sans `o.slot`, la tige entre à `y + 34`.
Pièces : `armB_up armB_lo objetB doigtsB … head … torso armF_up armF_lo objet doigts` (épaule et coude ronds, rivet au centre, pliage 0 → 2,4 rad vérifié). Main = point `[0,96]` de l'avant-bras (`handLen` 96).
Angles : `armF_up` 0 pendant, −1,57 horizontal devant, −2,4 au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé ; `legF/legB` négatif = jambe en avant.

Options communes :
- `t` : **toujours le passer** (applaudir, diriger, éventer, hocher, griffonner en dépendent).
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'baguette'` | `'plume'` | `'eventail'` | `'partition'` | `'tasse'` | `'bouteille'` | `'gibus'` `'hautDeForme'` `'melon'` `'casquette'` `'beret'` (chapeaux tenus) ; `tenuO` / `tenuBO` : options de l'objet (`eventail` : celles de `DAN.eventail`, `taille` **0,8 par défaut** en main ; `plume` : `taille` 0,65 par défaut).
- `droit` / `droitB` : `true` par défaut (l'objet reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent (rad, positif = haut vers l'avant).
- `handF` / `handB` : `'fist'` | `'open'` (poing forcé quand la main tient un objet) ; `face` : `{ brow, mouth, eyes }`.
- `bend` / `bendB` : bendSign de `M.ik` pour le bras avant / arrière dans les gestes (1 par défaut, voir tableau).
- Point nommé de l'objet tenu : `DAN.pt(r, 'nom')` → `[x, y]` écran (`DAN.pt(r, 'nom', true)` main arrière). Points : baguette `pointe` ; plume `pointe` ; éventail `ecrit` `centre` `pivot` ; partition `centre` ; tasse `dessus` ; bouteille `goulot` ; chapeaux `dessus`.

| Fonction | Échelle, taille | Pièces en plus | Options (0..1 sauf mention) |
|---|---|---|---|
| `DAN.strauss` (`C.danStrauss`) | 0,9 ≈ 465 px (couronne 495, chapeau 525) | `cheveux` (boucles), `coiffe` (gibus), `couronne` | `tenu` = **`'baguette'` par défaut** ; `leve` (baguette brandie : armF_up −2,35) ; `diriger` (bras et baguette battent la valse, ≈ 1,45 mesure/s, exige `t`) ; `salue` (révérence du buste, main au ventre, bras arrière en arrière) ; `couronne: true` (couronne de carton dorée penchée) ; `chapeau: true` (haut-de-forme bleu-vert sombre à ruban bordeaux) ; `chapeauHaut` (0 → 0,35 la main va au bord, 0,35 → 1 elle lève le chapeau au-dessus de la tête ; met `chapeau` d'office ; la baguette passe dans la main arrière) |
| `DAN.brahms` (`C.danBrahms`) | 0,9 ≈ 460 px, ventre rond (≈ 115 px de large) | `cheveux`, `barbe`, `plumePoche` (plume d'oie dans la poche du gilet, cachée dès qu'il tient `'plume'`) | `ecrire` + `cible` [x,y] **écran** : la pointe de la plume va sur la cible et griffonne (met `tenu:'plume'`) ; `applaudir` (+ `fort: true`) ; `soupir` (épaules et tête tombent, sourcils inquiets, yeux mi-clos) ; `coeur` (main ouverte sur le cœur, léger salut) ; `solennel` (menton levé) |
| `DAN.viennois` (`C.danViennois`) | 0,85 ≈ 430 px (melon 455, haut-de-forme 495) | `coiffe` | `habit` (hex, **obligatoire et différent à chaque appel**) ; `coiffe` `'melon'` (défaut) `'hautDeForme'` (feutre fauve évasé) `'casquette'` `'beret'` `'chauve'` `'cheveux'` ; `poil` `'moustache'` (défaut) `'favoris'` `'barbiche'` `'rien'` ; `tenu` `'rien'` `'partition'` `'tasse'` `'bouteille'` ; `ventre` 0..1 (bedaine) ; couleurs facultatives `cheveux` `gilet` `pantalon` `cravate` `peau` (sinon tirées de `habit`) ; gestes `applaudir` (poli, bas et lent ; `fort: true` = haut et vif), `chanter` (bouche grande ouverte, menton levé ; avec `tenu:'partition'` il la tient devant lui, sinon main ouverte tendue), `baille` (main ouverte devant la bouche ouverte, yeux fermés), `chapeauHaut` (comme Strauss ; seulement melon / hautDeForme / casquette / beret) |
| `DAN.viennoise` (`C.danViennoise`) | 0,88 ≈ 440 px (chapeau à plume 470) | `cheveux`, `chignon`, `coiffe` ; robe à tournure, trois volants, berthe de dentelle, **pas de jambes** | `robe` (hex) ; `coiffe` `'chignon'` (défaut : chignon bas + anglaises + fleur) `'chapeau'` (petit chapeau à plume) `'bonnet'` (capote nouée sous le menton) `'voilette'` ; `cheveux`, `chapeauCol`, `plumeCol`, `rubanCol` (hex) ; `tenu` `'rien'` `'eventail'` `'tasse'` ; gestes `tendre` (bras horizontal, éventail droit), `eventer` (éventail devant la gorge qui bat), `baille` (derrière l'éventail, yeux fermés), `applaudir` (+ `fort`), `hoche` (hochements avec `t`). `tendre`, `eventer`, `baille` mettent `tenu:'eventail'` si `tenu` est absent |

Réglages conseillés : belle-fille de Strauss `{ robe:'#7a6a8c', coiffe:'chignon' }` ; dame du public `{ robe:'#b4867a', coiffe:'chapeau', tenu:'eventail' }`. Série de viennois vérifiée sans clone : `#5a3a3a` hautDeForme favoris ; `#3d4f6a` melon barbiche ; `#5a6a3a` casquette moustache ; `#6e5a3e` beret rien ; `#4a4a5e` chauve favoris ; `#7a4a30` cheveux moustache. Viennoises : `#b4867a` chapeau, `#7a6a8c` chignon, `#4f6a6e` bonnet, `#8a3a3e` voilette.

**bendSign de `M.ik`** (vérifié sur les pages de gestes, aucune ligne « ATTENTION coude » dans les deux sens) — valable pour les quatre marionnettes :

| Bras | `dir` 1 | `dir` −1 |
|---|---|---|
| avant (`armF`) | 1 | 1 |
| arrière (`armB`) | 1 | 1 |

(L'IK travaille dans le repère du personnage : le miroir ne change pas le signe. Seule exception connue : imposer à la main `armF_up −2,4` **et** `armF_lo −2,4` replie l'avant-bras derrière la tête et déclenche l'alerte : ne pas l'utiliser.)

Pièges :
- **Brahms qui écrit** : la plume n'atteint la cible que si `cible.x − x ≈ dir·145·s` et `cible.y ≈ y − 295·s` (vérifié). Au-delà, le bras se tend à fond et la pointe s'arrête avant la cible : faire glisser Brahms avec le point d'écriture (`x = cible.x − dir·145·s`) pendant que `signe` avance.
- Brahms a le ventre large : à 0,9, laisser ≥ 110 px devant lui (guéridon, autre marionnette).
- `chapeauHaut` : le chapeau passe de la tête à la main à 0,35 (dessiné au même endroit) ; vérifié à 0,3 et 1, pas image par image autour de 0,35.
- Viennoise `eventer` et `baille` : l'éventail cache le bas (ou presque tout) du visage, c'est voulu ; pour un gros plan sur le visage, préférer `tendre`.
- Viennoise sans jambes : pour marcher, glisser le long de la fente (petits sauts `dy`), rien à balancer.
- Viennois `hautDeForme` : même famille de silhouette que le `bourgeois` du kit (haut-de-forme noir) et le `sir` de bigben (gris) ; le nôtre est fauve et évasé : ne pas le mettre à côté d'eux.

## Accessoires (sans tige : ils volent)
Appel `DAN.nom(x, y, s, o)` → `r` (`r.pt('nom')` = point écran). Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Tailles à s = 1.

| Fonction | `(x,y)` = | Taille à s = 1 | Options |
|---|---|---|---|
| `DAN.eventail` | pivot (rivet), feuille vers le haut | 210 × 130 (s 1,5 ≈ 315 px : mot-clé) | `ouvre` 0..1 (1 ; fermé = baguettes serrées) ; `signe` 0..1 (portée de cinq lignes tracée de gauche à droite, puis neuf notes qui montent en arpège) ; `ligne2` 0..1 (griffonnage ondulé sous la portée) ; `battre` 0..1 (bat avec `t`) ; `taille` (×) ; points `ecrit` (bout du tracé en cours : cible de la plume de Brahms), `centre`, `pivot` |
| `DAN.gueridon` | sol | 176 × 200 | — ; point `dessus` (0, −200). Éventail posé : `DAN.eventail(x, y − 200·sG − 4, sE, …)` |
| `DAN.note` | centre de la tête de note | croche 60 × 110 ; `double` 100 × 120 | `type` `'croche'` (défaut) `'noire'` `'double'` ; flotte et tangue avec `t` (`ph` déphase) ; carton doré ; point `haut` |
| `DAN.portee` | bout gauche (ligne du milieu) | `len` (420) × 90 | `len` ; `trace` 0..1 (se déroule) ; `notes` (4) ; ondule avec `t` (`ph`) ; point `bout` |
| `DAN.portraitStrauss` | centre du cadre | 200 × 250 | — ; point `clou` (0, −150) ; à poser en `DAN.SALON.portrait` (le clou du décor y est déjà) |

## Décors (pré-rendus par `DAN.init()`)
| Clé | Pose | Repères utiles |
|---|---|---|
| `DAN.K.salle` | `ctx.drawImage(DAN.K.salle, 0, 0)` (plein écran) puis **`DAN.lustre(t)`** | `DAN.SALLE` : fenêtres `fenetres` [[150,330],[450,630],[750,930]] (y 560 → 1060), flèche de Saint-Étienne `fleche {x:540,y:520}` dans celle du milieu ; estrade `estrade {x0:600, x1:1080, y:1300}` (dessus) avec pupitres `pupitres` [690, 850] et chaises cintrées `chaises` [760, 930] ; lambris y > 1100 |
| `DAN.lustre(t, o)` | lustre à flammes vacillantes, suspendu (même balancement que `M.hung`) | `o.x` (540), `o.y` = bas du lustre (600), `o.f` 0,7, `o.ph`, `o.amp` 0,012, `o.cast` ; 420 × 330 ; à dessiner avant `M.drawFloor()` |
| `DAN.K.salon` | `ctx.drawImage(DAN.K.salon, 0, 0)` puis `DAN.portraitStrauss(260, 660, 1, {cast})` | `DAN.SALON` : `portrait {x:260,y:660}` ; fenêtre à rideaux `fenetre {x0:690,x1:880,y0:470,y1:960}` ; petite bibliothèque `bibli {x0:110,x1:400,y:1180}` (dessus 1168) avec métronome `metronome.x` 340 ; lambris ivoire y > 1040 |
Plancher : `M.drawFloor()` du kit, après le décor.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'DAN\.' casting/scene.js`). Les plus utiles :
```js
// P5-P6 : Brahms écrit sur l'éventail posé sur le guéridon (dir 1), portée qui se trace
DAN.gueridon(gx, FEET, 0.9, { cast });                      // même ligne de sol que Brahms (comme sur la planche)
const ev = DAN.eventail(gx, FEET - 200 * 0.9 - 4, 1.3, { signe: k, ligne2: k2, cast });
const P = ev.pt('ecrit');
DAN.brahms({ t, ecrire: 1, cible: P }, P[0] - 145 * 0.9, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// P2 : Strauss dirige, couronne de carton ; P4 : salue
DAN.strauss({ t, diriger: 1, couronne: true }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// P1 : la dame tend l'éventail (mot-clé : éventail plus grand en main)
DAN.viennoise({ t, robe: '#b4867a', coiffe: 'chapeau', tendre: 1, tenuO: { taille: 1.3 } }, 260, FEET, 0.88, { dir: 1, slot: ST.slotF, cast });
// P6 : la belle-fille s'évente avec l'éventail signé
DAN.viennoise({ t, robe: '#7a6a8c', coiffe: 'chignon', eventer: 1, tenuO: { signe: 1, ligne2: 1 } }, 240, FEET, 0.88, { dir: 1, slot: ST.slotF, cast });
// spectateurs polis (vignette P6 : échelle 0,5)
DAN.viennois({ t, habit: '#3d4f6a', coiffe: 'melon', poil: 'barbiche', applaudir: 1 }, 640, FEETB, 0.75, { dir: -1, slot: ST.slotB, cast });
```
