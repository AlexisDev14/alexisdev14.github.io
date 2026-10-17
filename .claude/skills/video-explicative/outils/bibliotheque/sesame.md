# persos.md — « Sésame, ouvre-toi, le mot de passe oublié » : mode d'emploi de `persos.js`

Espace de noms : `M.ses` (dans `scene.js` : `const SES = M.ses;` dans l'IIFE de `SCENE`). Dans `S.init` : `SES.init()` (pré-rendus `SES.K` : `ciel`, `collines`, `troncA`, `troncB`, `feuilles[3]`, `falaise`, `dalle`, `dalleIn`, `paroi`, `caverne`, `tasOr`, `tasArg`, `coffre`, `jarre`, `jarreC`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (mesurées sur la planche ou calculées sur les polygones).
Planche de référence : `casting/scene.js` (0 série + décor ; 1 Ali / paysan / Léonard ; 2 Cassim / Gontran / Barbe Noire ; 3 bras pliés à fond ; 4–5 gestes d'Ali ; 6–7 gestes de Cassim ; 8 voleurs ; 9 portes, bulles, accessoires ; 9,97 caverne + façade à mi-hauteur). Chaque page a une rangée de contrôle dans l'autre direction.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `SES.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.slot`, `o.cast`) : elle prépare la pose (gestes par `M.ik`, objet tenu, seconde main, pieds à plat). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale).

Options communes (Ali, Cassim, voleurs) :
- `t` : **toujours le passer** (respiration, frotte, tâte, gratte, joie, yeux d'or, marche).
- `pas` : phase de marche en cycles (ex. `t * 1.7`) ; `pasAmp` (1). Jambes à genou, bras qui balancent, petit sautillement. Le personnage ne se déplace pas : faire varier `x` soi-même.
- `formule` 0..1 : bras avant tendu, **main ouverte**, vers `vers: [X,Y]` écran (défaut : devant, un peu au-dessus de l'épaule ; le bras s'arrête à 93 % de sa longueur, jamais raide).
- `sac` 0..1 : petit sac d'or sur l'épaule (met `tenu:'sac'`) : le poing tient le col devant l'épaule, le sac passe **derrière** l'épaule, dans le dos (au-delà de 0,5). `tenuO: { taille: 1.15 }` pour un plus gros sac (voleurs).
- `atteint` 0..1 + `cible: [X,Y]` écran : la main avant va sur la cible (main ouverte si rien n'est tenu) ; `atteintB` + `cibleB` pour la main arrière ; `bend` / `bendB` (défaut 1).
- `tenu` : `'rien'` | `'hache'` | `'sac'` | `'piece'` (main avant ; `tenuB` main arrière) ; `tenuO` : options de l'objet. `droit` (vrai par défaut : l'objet reste droit) ; `ang.objet` le tourne (rad, à l'écran). `deuxMains` : la main arrière va sur la seconde prise (hache).
- `handF` / `handB` : `'open'` (défaut) | `'fist'` ; `face` : `{ brow, mouth, eyes }`.
- Point nommé de l'objet tenu : `SES.pt(r, nom)` → `[x,y]` écran : hache `'tranchant'` `'fer'` `'manche'` ; sac `'col'` `'fond'` ; piece `'centre'`.
- Pivoter sur place : `o.dir = SES.tourne(u)` (u 0 → 1 : regarde à droite → à gauche).
- Angles libres : `armF_up` −1,57 = bras horizontal devant ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé ; cuisses `legF_up`/`legB_up` négatif = vers l'avant ; mollets `legF_lo`/`legB_lo` **positif** = genou plié. Les babouches (`footF`/`footB`) restent toujours à plat.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `SES.ali` (`C.sesAli`) | 0,9 : **471 px** (turban compris), corps ≈ 70 px de large ; accroupi ≈ 360 px | `turban` (ivoire sale, bas), `pan` (bout de turban sur la nuque), `barbe` (courte, brune) ; pièce ocre cousue sur l'épaule et le bras, ceinture de corde | `hache` (0 repos, hache tenue en travers → 0,5 levée à deux mains au-dessus de la tête → 1 frappe : le tranchant tombe **pile** sur le haut de la bûche placée par `SES.bucheAli`) ; `cache` (accroupi, buste penché, regard devant) ; `chuchoter` (main ouverte en cornet devant la bouche, tournée vers `dir`) ; `formule` ; `reverence` (buste incliné, main sur le cœur, bras arrière en arrière) ; `sac` ; `piece` (pièce d'or Ø 47 px pincée entre pouce et index, à hauteur de poitrine, tête penchée vers elle) |
| `SES.cassim` (`C.sesCassim`) | 0,9 : turban **490 px**, aigrette **542 px** ; ventre ≈ 105 px de large | `turban` (rouge garance, broche or à pierre verte), `aigrette` (plume ivoire), `moustache` (noire, en crocs) ; caftan indigo à doublure garance et rosaces or, large ceinture or | `frotte` (se frotte les mains devant la poitrine, rythme de `t` ; sourire, yeux mi-clos) ; `yeuxOr` (pupilles dorées + éclat qui scintille ; met `eyes:'wide'`) ; `joie` (deux bras levés devant, coudes pliés vers l'avant, petits sauts) ; `formule` ; `pousse` + `cible` (deux mains ouvertes contre la paroi, buste penché, jambe arrière tendue, léger tremblement ; défaut : 150 px devant à hauteur de poitrine) ; `tate` + `cible` (main ouverte qui glisse de ±31 px de haut en bas autour de la cible) ; `gratte` (main sur le côté du turban, qui gratte ; sourcils inquiets) ; `assis` (assis, hanche à **113 px** au-dessus des pieds, coudes vers les genoux, tête dans les mains, yeux mi-clos) |
| `SES.voleur` (`C.sesChef`, `C.sesBarbu`, `C.sesGrand`) | 0,88 : chef **463 px**, barbu **461 px**, grand : crâne 461 px, bonnet **538 px** (jambes plus longues, hanche à 257) | chef : `turban` noir, `pan`, `voile` gris-brun (bas du visage), `fourreau` (cimeterre **rangé**, poignée dorée à la ceinture) ; barbu : `turban` ocre à nœud, `barbe` noire touffue, gilet brun ; grand : `bonnet` pointu indigo, `cape` vert foncé (dos), `capeF` (empiècement, agrafe), `bouc` | `qui: 'chef' | 'barbu' | 'grand'` (défaut `'chef'`) ; `pas`, `sac`, `formule` (+ `vers`). Aucune arme ne se dégaine. |

`bendSign` de `M.ik` (vérifié sur tous les gestes, planche 3–8, aucune ligne « ATTENTION coude ») :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Ali, Cassim, chef, barbu, grand | 1 | 1 | 1 | 1 |

Repères utiles :
- Bûche d'Ali : `const b = SES.bucheAli(x, y, s, dir)` → `[bx, by]` (= `x + 172·s·dir`) ; `SES.buche(b[0], y, s)` avec le **même `s`** qu'Ali ; à `hache: 1` le tranchant touche le haut de la bûche (100 local, 90 px à 0,9).
- Se cacher : `SES.foret(t, { tronc: false })`, Ali `cache: 1` à **x ≈ 350** (dir 1, s 0,9), puis `SES.tronc(t)` **après** la marionnette : seule la tête dépasse à droite du gros tronc (x 305). Tête accroupie ≈ 62 px devant les pieds.
- Assis sur l'or : poser `SES.tas(xc, FEET + 4, s, { taille: 0.7 })` (ou le tas de la caverne) puis Cassim `assis: 1` au même x ; la hanche tombe à x + 7·s·dir.
- Ombre de Cassim (plan 1) : dessiner `SES.cassim({ t, gratte: 1 }, …, { rod: false, floorShadow: false })` sous `ctx.filter = 'brightness(0) blur(4px)'` et `globalAlpha` ≈ 0,45 (**non testé** sur la planche).

Pièges :
- Les gestes pilotent eux-mêmes `armF_*` / `armB_*` (et le corps pour `hache`, `cache`, `reverence`, `chuchoter`, `pousse`, `tate`, `assis`, qui réécrivent `tilt`, `dx`, `dy`) : ne pas passer ces angles en même temps. Deux gestes de bras à la fois : le dernier dans l'ordre l'emporte (formule, puis sac, puis atteint).
- `tenu: 'sac'` **sans** `sac` = sac tenu à la main, devant (pendant) ; c'est `sac` qui le passe dans le dos.
- `formule` vise avec `vers` ; `pousse`, `tate`, `atteint` visent avec `cible`.
- La marche (`pas`) n'agit plus sur le sautillement pendant un geste qui réécrit `dy`.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t` (éclats).

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `SES.hache(x,y,s,o)` (0,9) | bas du manche | 197 px de long, fer 55 × 47 | `rot` pour la poser (± π/2) |
| `SES.buche(x,y,s,o)` (0,9) | bas | 83 × 90 px | `fendue` 0..1 (les deux moitiés s'ouvrent et tombent de côté) |
| `SES.fagot(x,y,s,o)` (0,9) | bas-centre | 207 × 60 px (couché) | — |
| `SES.sac(x,y,s,o)` (0,9) | fond du sac | **153 × 95 px** | `taille` (1) ; `or` (true : trois pièces d'or au col) |
| `SES.piece(x,y,s,o)` (1) | centre | Ø 52 px | `tourne` (rad : la pièce pivote, revers sans rosace) ; `metal: 'argent'` |
| `SES.tas(x,y,s,o)` (1) | bas-centre | `taille` 1 = **300 × 150 px** (+12 de pièces debout) ; 0,5 = 150 × 83 | `metal: 'or'` (coupe, perles, rubis, émeraude) \| `'argent'` (gris bleuté, 3 lingots, plat) ; `t` (scintille) ; `seed` |
| `SES.coffre(x,y,s,o)` (1) | milieu du fond | caisse 200 × 100, avec couvercle ouvert et or 205 de haut ; pièces au sol jusqu'à x ± 130 | `t` |
| `SES.jarre(x,y,s,o)` (1) | bas | 80 × 150 px | `couleur: 'terre' | 'cuivre'` |
| `SES.lampe(x,y,s,t,o)` (1) | crochet (chaîne jusqu'aux cintres) | 120 × 96 px ; flamme à `(x + 58·s, y + 30·s)` | `flamme` 0..1 (1 ; 0 = éteinte) ; halo chaud |
| `SES.bulle(x,y,s,o)` (1) | centre de la bulle | **300 × 222 px** ; graines 150 × 90 (≥ 120 px dès s 0,8) | `gonfle` 0..1 (apparition à ressort, défaut 1) ; `vide` (sans graines) ; `envol` 0..1 (les 30 graines prennent des ailes et s'envolent, la bulle s'efface entre 0,25 et 0,85) ; `queue: [dx,dy]` (vers la tête, défaut `[-150,150]`) ; `fil` (true) ; `alpha` ; `t` (battement d'ailes) |

## Décors (pré-rendus par `SES.init()` ; fonctions qui dessinent directement)
| Appel | Pose | Repères utiles |
|---|---|---|
| `SES.foret(t, o)` | toile de fond entière (en premier) | ciel de crépuscule (soleil bas à x 440), collines, troncs `SES.FORET.troncs` x **165** (80 px) et **305** (150 px, pied évasé 210), feuillages pendus aux fils en (150,600), (310,500), (440,650). `o.tronc:false` (sans le gros tronc), `o.up` (monte aux cintres), `o.oiseaux` (true ou options de `M.oiseaux`), `o.cast` |
| `SES.tronc(t, o)` | **après** les marionnettes | le gros tronc seul (+ son feuillage, `feuillage:false` pour l'ôter) ; `o.x`, `o.up` |
| `SES.falaise(t, o)` | après la forêt, avant `M.drawFloor()` | grès ocre et Sienne, x **≈ 515 (bas) / 595 (haut) → 1080**, toute la hauteur. **Porte `SES.PORTE` : centre x 700, 230 × 340, bas y 1395, haut y 1055**, dalle claire arrondie sans serrure. `ouvre` 0..1 (glisse vers le haut dans la roche), `lueur` 0..1 (défaut = `ouvre` : lueur dorée + éclats dans le trou), `tremble` 0..1 (secousse + poussière qui tombe du linteau), `up` (px : toute la façade monte, câbles visibles), `fond:false` (trou transparent), `interieur:true` (paroi rocheuse de la caverne x 494–914, y ≥ 647, même porte au même x ; ouverte, elle montre le crépuscule dehors), `cast` |
| `SES.caverne(t, o)` | toile de fond entière | voûte et stalactites, tapis roulés à gauche, paroi + porte (x 700) déjà dessinées : **ne pas rappeler `falaise({interieur})`** ; `o.porte` = options de la porte (`ouvre`, `tremble`…). Lampes `SES.CAVE.lampes` (250,470) (520,420) (880,470). **Tas d'or x 290** (140–440, haut y 1245), **tas d'argent x 505** (415–595, ≈ 100 px + lingots, 125 px), coffre ouvert x 905 (s 0,8 : 825–985), jarres x 170 et 990. `o.tresor:false`, `o.lampes:false`, `o.cast` |

Façade qui monte (plan 3) : `SES.caverne(t)` d'abord, puis `SES.falaise(t, { up })` (et la forêt avec le même `up` si elle doit partir aussi) : `up` 650 = moitié de la façade levée, caverne visible dessous ; ≥ 1400 = disparue.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'SES\.' casting/scene.js`). Les plus utiles :
```js
// Ali coupe du bois (plan 2) : hache levée puis frappe, bûche au bon endroit
const b = SES.bucheAli(300, FEET, 0.9, 1); SES.buche(b[0], FEET, 0.9, { cast, fendue: smooth(2.1, 2.3, t) });
SES.ali({ t, hache: 0.75 + 0.25 * Math.sin(t * 5) }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// le chef dit la formule vers la porte, la dalle monte en grondant
SES.falaise(t, { ouvre: smooth(4, 5.2, t), tremble: smooth(3.9, 4.1, t) * (1 - smooth(5.1, 5.4, t)), cast });
SES.voleur({ t, qui: 'chef', formule: smooth(3, 3.4, t), vers: [700, 1180] }, 880, FEET, 0.88, { dir: -1, slot: ST.slotF, cast });
// voleur qui marche, sac sur l'épaule
SES.voleur({ t, qui: 'barbu', pas: t * 1.7, sac: 1, tenuO: { taille: 1.15 } }, lerp(1100, 760, smooth(0, 3, t)), FEET, 0.88, { dir: -1, slot: ST.slotF, cast });
// Cassim pousse la porte fermée vue de l'intérieur ; puis assis sur l'or avec la bulle qui s'envole
SES.caverne(t, { porte: { tremble: 0 } });
SES.cassim({ t, pousse: 1, cible: [600, 1150] }, 470, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
SES.cassim({ t, assis: 1 }, 290, FEETB, 0.9, { dir: 1, slot: ST.slotB, cast });
SES.bulle(470, 850, 0.9, { t, gonfle: smooth(5, 5.4, t), envol: smooth(7, 8.5, t), queue: [-150, 160] });
```
