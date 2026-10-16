# persos.md — « L'Oscar en plâtre » : mode d'emploi de `persos.js`

Espace de noms : `M.osc` (dans `scene.js` : `const OSC = M.osc;`). Dans `S.init` : `OSC.init();` (pré-rend `OSC.K.salle`, `salleNuit`, `salleCeremonie`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran**, mesurées sur la planche (`casting/scene.js`). `FEET = ST.slotF - 34` (1416), `FEETB = ST.slotB - 30` (1380).
Aucun texte, chiffre ni logo nulle part (bobine, enveloppe, tentures : rien d'écrit).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `OSC.nom(pose, x, y, s, o)` (`s` omis = échelle conseillée) : elle prépare la pose (objet tenu, seconde main, gestes par `M.ik`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce ; `r.q` = pose finale).
Pièces communes : `armB_up armB_lo objetB doigtsB … head … torso armF_up armF_lo objet doigts mainB` (rivets ronds à l'épaule et au coude, pliage 0 → 2,4 rad vérifié dans les deux sens).
Angles : `armF_up` 0 pendant, −1,57 horizontal devant, −2,5 au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'oscar'`, `'mouchoir'`, `'pinceau'`, `'pot'`, `'enveloppe'`, `'crayon'` ou `'rien'` ; `tenuO` / `tenuBO` : options de cet objet (les mêmes que l'objet seul, + `taille` ×). L'Oscar tenu fait 200 unités : **≈ 186–188 px** dans la main de la star ou de l'Académie (main autour du socle).
- `droit` / `droitB` : `true` par défaut (l'objet reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent.
- `deuxMains` (true ou 0..1) : la main arrière vient d'elle-même sur la seconde prise (Oscar : le torse du chevalier) et repasse DEVANT l'objet (`mainB`).
- `handF` / `handB` : `'fist'` | `'open'` | `'paume'` (main offerte, doigts qui remontent) ; mis à `'fist'` quand la main tient un objet. `face` : `{ brow, mouth, eyes }` ; `t` (larmes, coups de pinceau, crayon, tapotement, secousse).
- Points : `OSC.pt(r, 'nom')` → `[x, y]` écran de l'objet tenu (`OSC.pt(r, 'nom', true)` main arrière) ; `OSC.pt(r, 'main')` = poing avant. Oscar : `tete crochet epaule poitrine centre pointe socle pieds` ; pinceau et crayon : `pointe` ; pot : `bord fond` ; enveloppe : `cachet` ; mouchoir : `bas`.
- `cible: [X, Y]` est TOUJOURS en coordonnées **écran** (même transformation que l'appel).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `OSC.star` (`C.oscStar`) | 0,94 ≈ 481 px (461 à 0,9) | `etole`, `cheveux` ; **pas de jambes** (robe jusqu'au sol, tige sous la robe) | `tenu` défaut `'mouchoir'` si `pleure`, sinon `'rien'`. `pleure` (mouchoir au coin de l'œil, yeux fermés, larmes bleu pâle animées par `t`) ; `larmes` (larmes seules, sans geste) ; `serre` (Oscar contre la poitrine, deux mains, tête penchée ; met `deuxMains`) ; `brandir` (Oscar tenu DEVANT elle, main à hauteur d'épaule, bras tendu) ; `rattrape` (deux mains en avant, paumes vers le haut, à mi-corps ; bouche `o`) ; `salut` (révérence : buste incliné, tête baissée, yeux fermés) |
| `OSC.academie` (`C.oscAcademie`) | 0,93 ≈ 471 px (456 à 0,9) | `oeillet`, `noeud`, `legF legB` | `tendre` (bras tendu à hauteur de poitrine, objet droit) ; `appel` (main `'paume'` à hauteur de taille, jamais levée ; sourire) ; `peindre` + `cible` = point touché par la **pointe du pinceau** (défaut : poitrine, devant ; met `tenu:'pinceau'` ; petits coups avec `t`) ; `fier` (menton levé, buste en arrière) ; `cache` (deux mains ouvertes devant les yeux ; passer `tenu:'rien'`). `tenuB:'pot'` : le bras arrière part un peu en arrière (pot visible derrière le dos) sauf si `ang.armB_up` est donné |
| `OSC.gibbons` (`C.oscGibbons`) | 0,92 ≈ 498 px (487 à 0,9) | `cheveux` (gominés, raie au milieu, reflet), `crayonO` (crayon court ≈ 60 px, en biais derrière l'oreille : gomme rose derrière la tête, mine devant) + `oreille` (repassée devant le crayon) ; crayon et oreille cachés quand `tenu:'crayon'` ou `crayonOreille:false` | `tenu` défaut `'crayon'` si `dessiner`, sinon `'rien'`. `dessiner` + `cible` = **pointe du crayon** (griffonne avec `t`) ; `tapote` + `cible` = paume (main ouverte qui tape 2,5 fois/s avec `t`) ; `secoue` (main qui a mal, avant-bras qui oscille : **exige `t`**) ; `fier` ; `baille` (main ouverte devant la bouche, yeux fermés) ; `assis` (descend de 120 unités et cache les jambes : table devant, dessus entre `y − 250·s` et `y − 200·s`) |

### `bendSign` de `M.ik` (vérifiés : aucun « ATTENTION coude à l'envers » sur la planche, chaque geste rendu en `dir` 1 et −1)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| star | 1 | 1 | 1 | 1 |
| academie | 1 | 1 | 1 | 1 |
| gibbons | 1 | 1 | 1 | 1 |
Gestes vérifiés : pleure, serre (+ main arrière), brandir, rattrape (deux bras), tendre, appel, peindre, cache (deux bras), dessiner, tapote, baille. Table reprise dans `OSC.BEND` (les enveloppes s'en servent). Pour un geste maison : `M.ik(C.oscStar, pose, x, FEET, s, dir, 'armF', [X, Y], 1)`.

Pièges :
- `peindre` / `dessiner` / `tapote` : la cible doit être à portée (épaule → cible ≤ 175 px + longueur de l'outil, ≈ 260 px pour le pinceau) ; sinon le bras se tend et la pointe s'arrête avant. Planche : l'Académie à 455 peint l'Oscar posé sur un piédestal à 0,7 en x 640 (pointe sur `o.pt('poitrine')`).
- `pleure` avec l'Oscar en main avant amènerait l'Oscar au visage : pour pleurer en tenant la statuette, `serre` + `larmes` (les larmes tombent sur l'Oscar ; lui donner `trainee`).
- `brandir` : le haut de l'Oscar dépasse le haut de la tête d'≈ 80 px mais reste devant elle ; garder la star à y de tête ≥ 300.
- La star n'a pas de jambes : pour marcher, glisser + petit `dy` ; `salut` fait descendre l'ourlet de 11 px.

## L'Oscar-chevalier (accessoire sans tige par défaut)
`OSC.oscar(x, y, s, o)` : `(x,y)` = **milieu du dessous du socle**. Vu de face, symétrique. À s = 1 : **400 px** de haut (socle 0 → 88, haut du casque 400), socle 124 px de large ; héros conseillé **s 0,95–1,05 (380–420 px)** ; tenu : voir `tenu:'oscar'`.
Options : `matiere` `'or'` (défaut, métal à reflets, liseré clair) / `'platre'` (ivoire mat, bulles) ; `peint` 0..1 (sur le plâtre : or plus mat peint de bas en haut, 0 = socle, 1 = casque) ; `ecaille` 0..1 (éclat d'or tombé à l'épaule droite de l'écran, plâtre visible) ; `trainee` 0..1 (traînée blanche verticale sur la poitrine, longueur 135·s px à 1) ; `fier` (épaules élargies, tête haute) ; `gene` (épaules haussées, tête baissée inclinée, joues roses, mains remontées) ; `epee` 0..1 (l'épée pivote autour des mains : 0 pointe en bas devant les jambes, 1 pointe en haut à côté du casque, jamais au-dessus) ; `face` `{ eyes: 'open'|'closed'|'half'|'wide'|'up'|'down'|'side', brow: 'n'|'up'|'worry'|'frown' }` (pas de bouche) ; `socle` (true) ; `tige` (false ; `true` + `slot: ST.slotF` = petite tige vers la fente) ; `rot`, `dy`, `alpha`, `cast`, `ombre`.
Retour `r.pt('nom')` : `tete` (0,−400), `crochet` (0,−402), `epaule`, `poitrine` (haut de la traînée), `centre` (0,−250), `pointe` (bout de l'épée), `socle` (prise), `pieds` (0,−88).
`OSC.coque(x, y, s, o)` : la peau dorée du chevalier, **sans socle**, mêmes options de pose (`fier gene epee face`), mêmes points. Avec les mêmes `x, y, s` et options que l'Oscar, elle se superpose **exactement** (test pixel de la planche : 0 px de différence or/coque, 0 px de plâtre hors coque, pour repos, `epee:1`, `gene:1`, `fier+epee`). Scène du crochet : `OSC.oscar(x, y, s, { matiere:'platre', … })` puis `const c = OSC.coque(x, y - levee, s, { … })` ; `c.pt('crochet')` = point d'accroche.
Socle : bobine de film de face à 5 rayons (5 trous sombres + moyeu), lisible jusqu'à ≈ 180 px. `OSC.geomOscar(o)` donne la géométrie (mains, angle de l'épée).

## Accessoires (sans tige : ils volent)
Appel `OSC.nom(x, y, s, o)` → `r` (`r.pt('nom')` = point écran). Options communes : `o.dir` ±1, `o.rot`, `o.alpha`, `o.cast`, `o.ombre`, `o.t`. Tailles à s = 1.

| Fonction | `(x,y)` = | Taille à s = 1 | Options |
|---|---|---|---|
| `OSC.pot` | fond | 74 × 121 (anse comprise) | `charge` 0..1 (1 : peinture d'or au ras du bord) ; coulure d'or fixe ; prise = haut de l'anse ; points `bord`, `fond` |
| `OSC.pinceau` | prise (manche) | 18 × 124, poils en haut | `charge` 0..1 (or sur le bout des poils) ; point `pointe` (bout des poils) |
| `OSC.enveloppe` | centre | 92 × 60 | ivoire, cachet de cire rouge, sans texte ; point `cachet` |
| `OSC.mouchoir` | coin pincé | ≈ 40 × 66 | dentelle ivoire ; balance avec `t` ; point `bas` |
| `OSC.crayon` | prise | 8 × 98, pointe en bas | point `pointe` |
| `OSC.piedestal` | sol | 192 × 260 | `h` (hauteur, 260) ; point `dessus` (0, −h). Oscar posé dessus : `OSC.oscar(x, y − 260·sP, sO)` ; tenir `tige:false` |

## Décor (pré-rendu par `OSC.init()`)
| Appel | Pose | Repères utiles (`OSC.SALLE`) |
|---|---|---|
| `OSC.salle(t, o)` | en tout premier (plein cadre 1080 × 1400), puis `M.drawFloor()` | sol : bord du plancher `ST.back` 1395, pieds `FEET` 1416 ; lambris à partir de y 1000 ; tentures dorées x 214–400 et 680–866 (y 300–1000) ; colonnes x 128 et 952 (± 66) ; frise y 258–312 |
| `o.guerre` 0..1 | même salle, sombre et bleutée (fondu) | ciel de nuit étoilé par défaut dans la fenêtre |
| `o.ceremonie` 0..1 | rideau de fond étoilé à la place de la fenêtre + 2 projecteurs qui balaient avec `t` | rideau étoilé x 392–688, y 300–1000 |
| `o.ciel(ctx, F, t)` | fonction qui peint le ciel DANS la fenêtre (déjà clippé) : p4 y peint son ciel de guerre | fenêtre `F = { x0:420, x1:660, y0:430, y1:900, cx:540, cy:550, r:120 }` (arc de rayon 120 centré en (540,550), haut y 430), meneaux par-dessus |
Piédestal conseillé : `OSC.piedestal(x, 1400, 0.7–1)` → dessus y 1218 (0,7) à 1140 (1). Les personnages en fente avant (y 1416) passent devant.

## Exemples d'appels qui marchent
Voir `<video>/casting/scene.js` (`grep -n 'OSC\.' casting/scene.js`). Les plus utiles :
```js
// p5 : l'Académie peint l'Oscar en plâtre posé sur le piédestal (pointe du pinceau sur la poitrine), pot derrière lui
OSC.piedestal(640, 1400, 0.7, { cast });
const o = OSC.oscar(640, 1400 - 0.7 * 260, 0.95, { matiere: 'platre', peint: k, cast });
OSC.academie({ t, peindre: 1, cible: o.pt('poitrine'), tenuB: 'pot' }, 455, FEET, 0.93, { dir: 1, slot: ST.slotF, cast });
// p1 : la star serre l'Oscar peint et pleure ; les larmes lavent la peinture
OSC.star({ t, serre: 1, larmes: 1, tenu: 'oscar', tenuO: { matiere: 'platre', peint: 1, trainee: u, ecaille: e } }, 520, FEET, 0.94, { dir: 1, slot: ST.slotF, cast });
// remise : l'Académie tend l'Oscar d'or, la star le rattrape (dir −1)
OSC.academie({ t, tendre: 1, tenu: 'oscar', tenuO: { matiere: 'or' } }, 250, FEET, 0.93, { dir: 1, slot: ST.slotF, cast });
OSC.star({ t, rattrape: 1 }, 560, FEET, 0.94, { dir: -1, slot: ST.slotF, cast });
// p3 : Gibbons dessine sur une planche inclinée (pointe du crayon sur la cible écran)
OSC.gibbons({ t, dessiner: 1, cible: [300, 1086] }, 150, FEET, 0.92, { dir: 1, slot: ST.slotF, cast });
// p4 : la coque dorée soulevée par le crochet, le chevalier en plâtre reste dessous
OSC.oscar(540, 1140, 1, { matiere: 'platre', cast }); const c = OSC.coque(540, 1140 - lev, 1, { cast }); const [hx, hy] = c.pt('crochet');
```
