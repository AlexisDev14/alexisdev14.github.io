# persos.md — « Big Ben, la cloche fêlée » : mode d'emploi de `persos.js`

Espace de noms : `M.ben` (alias `BEN` : `const BEN = M.ben;`). Dans `S.init` : `BEN.init()` (pré-rendus : `BEN.K.ciel`, `ville`, `tour`, `cour`, `fonderie`, `beffroi`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (mesurées sur la planche `casting/`).
Aucun texte, lettre ni chiffre dans les pièces. Tout est fonction pure de `t` (passer `t` dans la pose / les options).

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, `ST.slotB` pour `touristeMini`)
Toujours par l'enveloppe `BEN.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce ; `r.tenu`, `r.tenuO`).
`o` = options de `M.puppet` : `dir` ±1, `slot`, `cast` (`{dx:22,dy:10,a:0.3}`), `alpha`.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'marteau'` | `'appareil'` | `'canne'` ; `tenuO` / `tenuBO` : options de cet objet (les mêmes que l'objet seul, ex. `{ poids: 'leger' }`, `{ flash: 1 }`).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras (le marteau est alors retourné : sa tête prolonge l'avant-bras) ; `ang.objet` / `ang.objetB` le tournent (rad).
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (marteau : bout du manche ; appareil : arrière du boîtier). Ses doigts passent par-dessus l'objet.
- `handF` / `handB` : `'fist'` | `'open'` (mis à `'fist'` d'office quand la main tient un objet) ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'closed'|'wide'|'half' }` ; `t`.
- Angles `ang` (rad, ajoutés) : `armF_up` 0 pendant, −1,57 horizontal devant, −2,5 au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé ; `legF`/`legB` en opposition pour un pas.
- Point nommé de l'objet tenu : `BEN.pt(r, 'nom')` → `[x, y]` écran (`BEN.pt(r, 'nom', true)` pour la main arrière).
  marteau : `tete` (centre de la tête), `face` (face qui frappe : côté avant quand il est droit, face basse pendant `frappe`), `dos`, `bout` (bout du manche) ;
  appareil : `objectif`, `flash` ; canne : `pommeau`, `bout`.
- Pièces (pour `hide`) : `armB_up armB_lo objetB doigtsB legB legF head … torso armF_up armF_lo objet doigts doigtsD`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `BEN.ouvrier` (fondeur) | 0,9 ≈ 465 px (casquette comprise) | `casquette`, `tablier`, `sangle` | `poids` `'lourd'`(défaut)\|`'leger'` (raccourci de `tenuO.poids`) ; `appui` (masse **lourde** debout sur sa tête devant lui, main sur le bout du manche) ; `epaule` (masse sur l'épaule, tête derrière la nuque) ; `leve` (masse armée au-dessus de la tête, deux mains) ; `frappe` (de armé 0 à impact 1, vers l'avant et le bas ; `frappe > 0` vaut `leve: 1`) ; `teteMains` (deux mains sur la casquette, consterné) ; `siffle` (lèvres en cul-de-poule + filets d'air animés par `t`, yeux mi-clos) |
| `BEN.sir` (gentleman) | 0,9 ≈ 536 px avec le chapeau, 452 sans | `chapeau` (haut-de-forme sur la tête), `chapeauM` (le même dans la main) | canne dans la main arrière **par défaut** (`tenuB:'canne'`, bras arrière un peu en arrière pour qu'elle se voie ; donner `ang.armB_*` ou `tenuB` pour reprendre la main) ; `chapeau` (0,5 = main au bord du chapeau, 1 = chapeau soulevé au-dessus de la tête : crâne chauve à couronne blanche) ; `visage` (deux mains ouvertes sur les joues, yeux ronds, bouche `o`, sourcils inquiets ; lâche la canne sauf si `tenuB` est donné) ; `hoche` (hochements de tête, rythme `t`) |
| `BEN.touriste` | 0,9 ≈ 472 px | `casquette`, `sac` | appareil en main **par défaut** (`tenu:'appareil'`, `tenu:'rien'` pour mains libres) ; `photo` (appareil à l'œil, seconde main dessus au-delà de 0,6 ; il suit l'inclinaison de la tête) ; `flash` (éclair blanc au flash de l'appareil, pic à 1 : faire une impulsion de ≈ 0,15 s) ; `regardHaut` (tête levée, buste un peu en arrière) ; sourire par défaut |
| `BEN.touristeMini` | 0,72 ≈ 377 px | idem | mêmes options ; couleurs pâlies (fond, fente arrière) |

Pièges :
- `tenu:'marteau'` sans geste : la main tient la masse **par le cou** (sous la tête), manche vers le plancher. `tenuO.prise` (distance du bout du manche, local : 0..250) déplace la prise ; `leve`/`frappe` la mettent au milieu (118), `epaule` au bout (26), `appui` au bout (12).
- `frappe` met `droit:false` et `deuxMains:true` d'office. Pour viser la cloche, placer l'ouvrier puis lire `BEN.pt(r,'face')` (à 0,9, `frappe:1`, l'ouvrier en x 180 : face en ≈ (412, 1285), cloche à 0,8 en x 600 dans le beffroi).
- `appui` n'a de sens qu'avec le marteau lourd (le petit maillet ne touche pas le sol).
- `sir` + `chapeau ≥ 0,5` : le chapeau de la tête est masqué et passe dans la main ; ne pas cumuler avec `visage`.
- L'éclair `flash` est dessiné sans découpe (lumière) : pas d'ombre portée.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre ovale au sol), `o.t`. Échelle 0,9 = même taille que dans la main.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `BEN.cloche(x,y,s,o)` | milieu du bord inférieur (posée) | s 1 : 440 × 400 (anse comprise) ; 0,75 ≈ 330 × 300 | `fele` 0..1 (fêlure en zigzag sombre à arêtes vives, du bord vers le haut, côté face ; 1 = jusqu'aux 2/3) ; `tourne` 0..1 (quart de tour : la fêlure et les rivets glissent vers le côté, fêlure invisible à 1) ; `balance` (rad, autour de l'anse) ; `suspendue` (chaîne de l'anse jusqu'à `o.hautY` écran, défaut 0) ; `grande` (true : ×1,28 en largeur, ×1,22 en hauteur, version 1856) ; `lueur` 0..1 (bronze brûlant + halo, fonderie) ; `salut` 0..1 (se penche ≈ 11° sur son bord avant) ; `vibre` 0..1 (tremble, avec `t`). Pas de visage. |
| `BEN.ondes(x,y,s,o)` | centre de la cloche (`r.pt('centre')`) | arcs de 230 à 490 local de chaque côté | `t` (s depuis le coup, les anneaux s'éloignent), `k` 0..1 (intensité), `fele` 0..1 (anneaux cassés en zigzag = son fêlé), `n` (3). Dessin direct, à appeler après la cloche. |
| `BEN.marteau(x,y,s,o)` | bout du manche (tête en haut) ; `pose:'tete'` : sous la tête (debout sur sa tête) | lourd 0,9 : 261 px de long, tête 173 × 72 ; léger 0,9 : 133 px, tête 58 × 36 | `poids` `'lourd'` (tête de fer noir, manche de chêne) \| `'leger'` (petit maillet de bois clair) ; `pose` `'manche'`\|`'tete'` |
| `BEN.appareil(x,y,s,o)` | dessous du boîtier | 0,9 ≈ 71 × 63 (1,4 pour un gros plan) | `flash` 0..1 |
| `BEN.canne(x,y,s,o)` | bout de la canne | 0,9 ≈ 189 px | — |
| `BEN.chariot(x,y,s,o)` | sol sous le milieu du plateau | 0,8 ≈ 632 × 171 (timon vers l'avant compris) | `roule` (px écran parcourus vers l'avant : les roues tournent sans glisser) ou `vitesse` (rad/s, avec `t`) ; `cloche` (options de `BEN.cloche` : la pose sur le plateau) ; `clocheS` (échelle de la cloche relative au chariot, 1) |

Cloche, points écran : `r = BEN.cloche(...)` puis `r.pt('anse'|'centre'|'levre'|'avant'|'arriere'|'sommet'|'fele')` (suivent `balance`, `salut`, `grande`, `vibre`). Chariot : `r.dessus` (point écran du milieu du plateau), `r.cloche` (le `r` de la cloche posée). `BEN.CL`, `BEN.CHAR` = repères locaux (anse y −440, dessus −214, roues x ±165 r 90).
Pièges : `fele` est du côté +x du regard (`dir:-1` la met à gauche). Suspendue, l'anse est à `y − 440·s` (×1,22 si `grande`).

## Effets et aides
- `BEN.aiguilles(cx, cy, r, h, o)` : aiguilles du cadran (dessin direct) ; `(cx,cy)` centre écran, `r` rayon écran, `h` heure décimale (3,25 = trois heures et quart) ; `o.alpha`.
- `BEN.feu(t, x, y, s, k)` : lueur vacillante + langues de flamme du four ; `(x,y)` = bas de la bouche, `k` intensité (1).
- `BEN.geo` (ep, ell, ribbon, rrect, rect), `BEN.OBJ` (géométrie des objets tenus).

## Décors (pré-rendus par `BEN.init()`)
| Clé | Pose | Repères utiles (locaux ×`scale`, origine = bas-centre sur `ST.back`) |
|---|---|---|
| `BEN.K.ciel` | `M.ctx().drawImage(BEN.K.ciel, 0, 0)` | ciel de Londres gris-bleu, nuages de papier, brume chaude à l'horizon (1080 × ST.back+5) |
| `BEN.K.ville` | `M.flat(BEN.K.ville, 540, ST.back, {alpha: 0.85})` (ferme basse) | silhouette pâle du palais de Westminster dans la brume, 1260 × 560 : Victoria Tower à gauche (x −530…−390), flèche centrale x 0 (haut −390), Tamise y −26…0. Sans Elizabeth Tower (c'est `K.tour`). |
| `BEN.K.tour` | `M.flat(BEN.K.tour, x, ST.back, {scale, cast})` | Elizabeth Tower en carton, 256 × 1240 ; cadran `BEN.TOUR.cadran = {dx:0, dy:-810, r:92}` (repères sans chiffres, **sans aiguilles** : `BEN.aiguilles(x, ST.back − 810·scale, 92·scale, h)`) ; beffroi à abat-sons `dy −970` ; haut −1240. À 0,95 la flèche passe sous le lambrequin ; 0,85 pour la voir entière (sommet y ≈ 340). |
| `BEN.K.cour` | `M.flat(BEN.K.cour, 540, ST.back, {cast})` | cour pavée, muret de brique, grille à pointes de lance (haut −396), piliers à boule x −470, −120, 230 ; lampadaire à gaz `BEN.COUR.lampe = {dx:400, dy:-620}` (lanterne allumée) ; 1140 × 706 |
| `BEN.K.fonderie` | `M.flat(BEN.K.fonderie, 540, ST.back, {scale: 0.85…1})` (plein fond) | mur de brique noirci, four rougeoyant (bouche `BEN.FONDERIE.bouche = {dx:-280, dy:-70}` → `BEN.feu(t, 540 − 280·sc, ST.back − 70·sc, sc)`), cheminée x −280, moule de cloche cerclé de fer `moule.dx 330` (haut −470), chaîne de palan x 70 ; 1160 × 1330 |
| `BEN.K.beffroi` | `M.flat(BEN.K.beffroi, x, ST.back, {scale: sc, cast})` | charpente de chêne : poteaux x ±340, poutre y −650…−712, cordes des cintres qui montent hors cadre ; crochet `BEN.BEFFROI.crochet = {dx:0, dy:-624}` : cloche pendue = `BEN.cloche(x, ST.back − 624·sc + 440·s, s, {balance})` |

## Exemples d'appels qui marchent
Voir `<video>/casting/scene.js` (`grep -n 'BEN\.' casting/scene.js`). Les plus utiles :
```js
// beffroi : cloche pendue qui balance, ouvrier qui frappe à deux mains, ondes fêlées au point d'impact
M.flat(BEN.K.beffroi, 540, ST.back, { scale: 0.9, cast });
const rc = BEN.cloche(600, ST.back + BEN.BEFFROI.crochet.dy * 0.9 + 440 * 0.8, 0.8, { balance: 0.06 * Math.sin(t * 2.5), fele: 0.6, t });
const r = BEN.ouvrier({ t, tenu: 'marteau', frappe: k }, 180, FEET, 0.9, { dir: 1, cast });     // BEN.pt(r, 'face') = point d'impact
BEN.ondes(rc.pt('centre')[0], rc.pt('centre')[1], 0.8, { t: t - tCoup, fele: 1 });
// la cloche fêlée sur son chariot qui roule
BEN.chariot(x, FEET, 0.8, { roule: x - x0, cast, cloche: { fele: 1 } });
// le touriste photographie la tour ; le gentleman salue
BEN.touriste({ t, photo: 1, regardHaut: 1, flash: clamp(1 - Math.abs(t - tFlash) / 0.08) }, 260, FEET, 0.9, { dir: 1, cast });
BEN.sir({ t, chapeau: smooth(t0, t0 + 0.8, t) }, 820, FEET, 0.9, { dir: -1, cast });
BEN.ouvrier({ t, tenu: 'marteau', epaule: 1, siffle: 1 }, 260, FEET, 0.9, { dir: 1, cast });     // il siffle, la masse sur l'épaule
```
