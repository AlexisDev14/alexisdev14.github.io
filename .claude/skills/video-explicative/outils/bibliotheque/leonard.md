# persos.md — « Léonard de Vinci, l'écriture en miroir » : mode d'emploi de `persos.js`

Espace de noms : `M.leo` (dans `scene.js` : `const LEO = M.leo;` dans l'IIFE de `SCENE`). Dans `S.init` : `LEO.init()` (pré-rendus `LEO.K` : `atelier` (toile de fond), `lutrin`, `table`, `machine`, `cabinet`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (calculées sur la géométrie, vues sur la planche).
Planche : `casting/scene.js`, une page par seconde : 0 atelier + Léonard écrit, 1 cabinet + savants, 2 gestes M.ik de Léonard, 3 gestes M.ik des savants, 4 balayage des bras, 5–6 comparaisons, 7 accessoires, 8 grande page + main géante, 9 série, 9,97 le cabinet remonte.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut)
Toujours par l'enveloppe `LEO.nom(pose, x, y, s, o)` : elle prépare la pose. Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'plume'` | `'loupe'` | `'miroir'` | `'carnet'` | `'encrier'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul ; carnet tenu : `echelle` 0,55 par défaut).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (seul le carnet en a une : coin bas, côté du corps).
- `atteint` 0..1 + `cible` `[X, Y]` **écran** : par `M.ik` (bendSign de `LEO.BEND`), amène sur la cible la **pointe de la plume** (si `tenu:'plume'`), le **centre** de la loupe / du miroir / du carnet, sinon le poing. `bras: 'B'` = main arrière ; `ptCible` force le point (`'pointe'`, `'bout'`, `'centre'`, `'bouche'`).
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `expr` : `'n'` | `'smile'` | `'satisfait'` (yeux mi-clos + sourire) | `'clin'` ; `clin` 0..1 (paupière qui se ferme, sourire) ; `t` (barbe, robe, ondulations) : **toujours passer `t`**.
- Point nommé de l'objet tenu : `LEO.pt(r, nom)` (ou `LEO.pt(r, nom, true)` main arrière) → `[x, y]` écran : plume `'pointe'` / `'bout'`, loupe / miroir / carnet `'centre'`, encrier `'bouche'`.
- Angles : `armF_up` −1,57 = bras horizontal devant, −2,5 = au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1) |
|---|---|---|---|
| `LEO.leonard` (`C.leoLeonard`) | 0,95 (défaut) ≈ 510 px béret compris ; robe 125 px de large en bas | `cheveux`, `barbe` (pend toujours à la verticale), `beret`, aumônière et ceinture peintes | `ecrire` (= `atteint` : avec `tenu:'plume'` et `cible`, la **pointe** va sur la cible) ; `leve` (main avant levée devant le visage, à hauteur d'œil, plume droite au-dessus) ; `repousse` (bras tendu, main ouverte, buste en arrière) ; `montre` (avant-bras levé devant la barbe, poignet bien visible) ; `tache` (tache d'encre noire sur le poignet ivoire du bras AVANT) |
| `LEO.savantA` (`C.leoSavantA`) | 0,98 (défaut) ≈ 495 px | `lavalliere` ; pince-nez et cordon peints | **`tenu:'loupe'` par défaut** (`tenu:'rien'` pour les mains vides) ; `regarde` (loupe tenue devant l'œil, lentille juste devant le nez, visage dégagé) ; `presente` (main avant devant le ventre ; avec `tenu:'carnet'` met `deuxMains`) ; loupe au-dessus d'un point : `atteint:1, cible:[X,Y]` |
| `LEO.savantB` (`C.leoSavantB`) | 0,85 (défaut) ≈ 435 px | `moust` (moustache de morse rousse), `calotte` ; col de velours bleu nuit, gilet ocre à carreaux | `presente` (avec `tenu:'carnet'` : carnet tenu à deux mains devant le ventre, visage dégagé) ; `doigts` (main avant ouverte levée devant le visage, il regarde ses doigts) ; `encre` (doigts et poignet de la main AVANT noircis ; aussi sur les doigts quand elle tient un objet) |

**Léonard est GAUCHER** : quand il écrit il regarde à gauche (`dir: -1`) et c'est son bras AVANT (gauche, côté public) qui tient la plume. Poignets de manche ivoire (`#e8dcc4`) à volant ; bras arrière plus sombre.

**bendSign de `M.ik`** (vérifié pages 2 et 3 de la planche, cibles marquées d'une croix ; aucune ligne « ATTENTION » au rendu) — aussi dans `LEO.BEND` :
| Personnage | bras avant `dir 1` | bras avant `dir −1` | bras arrière `dir 1` | bras arrière `dir −1` |
|---|---|---|---|---|
| `leonard` (écrire, lever, repousser, montrer ; main arrière posée devant à la ceinture) | 1 | 1 | 1 | 1 |
| `savantA` (loupe devant l'œil, loupe au-dessus du carnet) | 1 | 1 | 1 | 1 |
| `savantB` (doigts devant les yeux ; carnet tenu devant lui par la main arrière) | 1 | 1 | 1 | 1 |
Cibles éprouvées (repère écran, `s` = échelle, `d` = dir) : écrire `[x + d·140, y − s·348]` ; lever `[x + d·85, y − s·478]` ; repousser `[x + d·160, y − s·388]` ; montrer `[x + d·70, y − s·410]` ; main arrière devant `[x + d·70, y − s·248]`.

Pièges :
- `leonard` sans `tenu` = mains vides (`'rien'`) ; `savantA` sans `tenu` = loupe. Bras arrière **le long du dos, avant-bras vers l'avant** (`armB_up` > 0 avec `armB_lo` < 0) : signalé « coude à l'envers » par le kit ; garder `armB_up` ≤ 0 quand le coude plie.
- Le carnet tenu se dessine devant le torse, derrière le bras avant ; le tenir **sous le menton** (main vers `y − s·250` ou plus bas) sinon il cache le visage.
- `savantB` ressemble par ses couleurs imposées (veste brune, gilet ocre, ventre rond) au propriétaire de `poubelle.js` : ne jamais les montrer ensemble ; sa calotte bleue, sa moustache rousse et sa petite taille le distinguent.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Les pages (carnet, grande page, reflets, portrait) ne sont **jamais** retournées par `dir` : seul `miroir:true` retourne l'écriture. L'écriture est **abstraite** partout : traits ondulés continus de hauteur irrégulière, petites boucles serrées par endroits, blancs entre les traits (aucune lettre).

| Fonction | `(x,y)` = | Taille (s = 1, défaut) | Options |
|---|---|---|---|
| `LEO.carnet(x,y,s,o)` | centre | 368 × 264 px (pages 2 × 165 px) ; ≥ 300 px jusqu'à s = 0,82 | `lignes` 0..1 (13 lignes : 9 sur la page droite puis 4 sur la gauche ; la dernière commencée se trace) ; `sens` `'rg'` (défaut : droite → gauche, écriture en miroir) \| `'gd'` ; `croquis` `'aucun'` \| `'machine'` (machine volante à ailes de chauve-souris) \| `'corps'` (homme bras écartés dans un cercle), en haut de la page GAUCHE ; `croquisK` 0..1 (tracé progressif) ; `miroir` (tout le contenu retourné : lignes alignées à gauche, penchées à droite = écriture « normale ») ; renvoie `r.tete` = point écran de la tête de la ligne en cours (pour y poser la plume) |
| `LEO.plume` | pointe | 132 px (126 px en main à 0,95) | — (blanche, barbe visible, bec noirci) |
| `LEO.encrier` | fond | 76 × 64 px | `plume` (plume plantée) ; point `'bouche'` en (0,−62) |
| `LEO.loupe` | centre de la lentille | lentille Ø 100 px, 190 px de haut avec le manche | — (verre transparent) |
| `LEO.miroir` | centre de l'ovale | ovale 164 × 208 px cadre compris, 300 px avec le manche | `reflet` (true \| 0..1 : page aux lignes remises à l'endroit dans le miroir) ; `t` (reflet qui glisse) |
| `LEO.miroirMural` | centre | 268 × 344 px + crête dorée en éventail (370 px de haut) | `reflet`, `t` (déjà dessiné par `LEO.cabinet`) |
| `LEO.portrait` | centre | 220 × 280 px | `clin` 0..1 (l'œil se ferme, sourire dès 0,3) (déjà dessiné par `LEO.cabinet`) |
| `LEO.grandePage` | **milieu du BAS** de la feuille | 560 × 430 px + baguette ; fils jusqu'en haut | `lignes` 0..1 (lignes sèches déjà écrites sur 8) ; `ligne` (n° 0..7 de la ligne fraîche ; défaut : la suivante) ; `fraiche` 0..1 (avancement de la ligne fraîche, noire et brillante) ; `sens` `'gd'` (défaut) \| `'rg'` (écriture en miroir) ; `bavure` 0..1 (traînée grise derrière la tête de ligne, la ligne fraîche frottée) ; `fil` (décalage x du haut des fils) ; renvoie `r.tete` |
| `LEO.pageTete(x,y,s,o)` | — | — | même `o` que `grandePage` : point écran de la tête de la ligne fraîche **sans dessiner** |
| `LEO.mainGauche(x,y,s,o)` | **pointe de la plume** | s 1,5 (défaut) : main (poignet → doigts) ≈ 200 px ; avant-bras ≈ 430 px sous la pointe, un peu à gauche | `tache` 0..1 (tranche côté auriculaire, à GAUCHE, auriculaire et poignet noircis) ; `tigeY` (y écran du bas de la tige de bois, défaut `ST.slotF`) ; `rot`. Ombre légère sur la page intégrée (pas de `cast`) |

Main gauche : vue de dessus, l'avant-bras (manche rose, poignet ivoire) **monte du bas** presque vertical, tige de bois dessous ; dos de la main, 3 doigts repliés + index, **pouce à droite** qui pince la plume avec l'index ; pointe en haut à droite, plume qui descend à droite de la main. La tranche (auriculaire, à gauche) touche la ligne juste à gauche de la pointe : `bavure` se lit derrière elle. Poser la pointe sur `r.tete` : `LEO.mainGauche(rp.tete[0], rp.tete[1], null, { tache, tigeY })`. La manche descend ≈ 430 px sous la pointe (≈ 170 px à gauche) : pointe à y ≤ ST.slotF − 450 ou tige courte (`tigeY`).

## Décors (pré-rendus par `LEO.init()`)
| Appel | Pose | Repères utiles |
|---|---|---|
| `LEO.atelier(t, up, o)` | plein cadre (toile + table + lutrin + maquette) ; `up` = décalage vers le haut (px) | `o.lutrin`, `o.table`, `o.machine` (true) ; `o.carnet` = options du carnet posé sur le lutrin (renvoie son `r`, avec `r.tete`) ; `o.cast`. `LEO.AT` : `lutrin.x` 360 (plateau 444 × 272, haut ≈ 410 px) ; `carnet {x:360, y:1121, s:1}` ; `table {x:868, y:1159}` (dessus) ; `machine {x:800, y:600}` (se balance, ±0,035 rad) ; `fenetre {x:560, y0:392, y1:880}` ; `chandelle` (flamme animée) |
| `LEO.cabinet(t, up, o)` | plein cadre (papier peint vert, bibliothèque, bureau, lampe à huile, miroir mural, portrait) ; `up` 0 = en place, ≥ 1300 = remonté aux cintres (câbles et baguette basse visibles pendant la montée) | `o.portrait` (true), `o.clin` 0..1, `o.reflet` (miroir mural). `LEO.CAB` : `miroir {x:560, y:760}`, `portrait {x:846, y:640}`, `bureau {x:846, y:1159}` (dessus), `lampe {x:942, y:1009}` |
Machinerie P4 : dessiner `LEO.atelier(t, 0, …)` puis `LEO.cabinet(t, up, …)` par-dessus avec `up` de 0 à 1300 (l'atelier est déjà en place derrière).
Placement éprouvé : Léonard qui écrit à x 600, `dir:-1`, s 0,95, sur le carnet du lutrin (page 0) ; savants à x ≈ 400 et 660 dans le cabinet (page 1).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'LEO\.' casting/scene.js`).
```js
// Léonard écrit (gaucher) : la pointe suit la tête de la ligne en cours, tracée de droite à gauche
const rc = LEO.atelier(t, 0, { carnet: { lignes: 0.45, croquis: 'machine', croquisK: 1 } });
M.drawFloor();
LEO.leonard({ t, tenu: 'plume', ecrire: 1, cible: rc.tete, tache: 0 }, 600, FEET, 0.95, { dir: -1, cast });
// savant B présente le carnet, savant A le regarde à la loupe
const rB = LEO.savantB({ t, tenu: 'carnet', tenuO: { croquis: 'corps' }, presente: 1, encre: 0.6 }, 660, FEET, 0.85, { dir: -1, cast });
const cc = LEO.pt(rB, 'centre');
LEO.savantA({ t, atteint: 1, cible: [cc[0] - 10, cc[1] - 40] }, 400, FEET, 0.98, { dir: 1, cast });
// démonstration : grande page, ligne fraîche barbouillée par la tranche de la main géante
const rp = LEO.grandePage(500, 1060, 1, { lignes: 0.25, fraiche: 0.62, bavure: 0.85, sens: 'gd' });
LEO.mainGauche(rp.tete[0], rp.tete[1], null, { tache: 0.85 });
```
