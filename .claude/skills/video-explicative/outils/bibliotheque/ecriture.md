# persos.md — « La première écriture, une liste de bières » : mode d'emploi de `persos.js`

Espace de noms : `M.ecr` (dans `scene.js` : `const ECR = M.ecr;`). Dans `S.init` : `ECR.init()` (pré-rendus `ECR.K` : `ciel`, `cielSoir`, `mur`, `tabouret`, `comptoir`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses ; tailles en px **à l'écran** à cette échelle.
Aucune lettre, aucun chiffre, aucun signe cunéiforme nulle part : les tablettes portent des dessins gravés et des encoches.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `ECR.nom(pose, x, y, s, o)` (`o` : `dir`, `slot`, `cast`, `alpha`…). Elle prépare la pose (objets tenus, gestes par IK interne) et renvoie `r` : `r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale ; `r.bouche` (lèvres, écran) ; `r.tete` (sommet du crâne).

Options communes (toutes les marionnettes) :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'tablette'` `'calame'` `'miche'` `'lyre'` `'rien'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul, + `echelle`).
- Couches : la tablette et la miche se dessinent **derrière l'avant-bras qui les tient** (avant-bras entier), doigts par-dessus le bord ; calame devant le poing, doigts par-dessus ; lyre en main arrière **devant le corps**. Tablette en main arrière : derrière le corps (défaut) ou `planB: 'devant'` (devant le corps, mis d'office par `ecrire`).
- `droit` / `droitB` : `true` par défaut (objet droit à l'écran) ; `ang.objet` / `ang.objetB` l'inclinent (rad).
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'closed'|'half'|'wide' }` (grands yeux en amande) ; `t` (marche, gestes animés, mousse).
- `marche` 0..1 (pas sur place, la scène déplace x) ; `assis` 0..1 + `siege` (y écran du dessus du siège ; défaut : tabouret `ECR.tabouret` pour le scribe, sac `ECR.sac` pour le poète et les ouvriers, posés au même x, y, s) ; mains posées sur les genoux s'il n'y a pas d'autre geste.
- `cible` [x,y] écran : point visé par `tendre` (le poing), `ecrire` (la pointe du roseau), `boire`/`sirote` (bout bas de la paille = `ECR.jarrePt(jx, y, s, 'col')`).
- Jupe, robe et bas de tunique suivent les cuisses (marche, assis) et pendent à la verticale quand le buste se penche (`tilt`, `reverence`, `penche`).
- Tous les gestes se combinent avec un réglage 0..1 (entrée/sortie : `k = smooth(t0, t1, t)`).
- Point nommé de l'objet tenu : `ECR.pt(r, 'nom')` (main arrière : `ECR.pt(r, 'nom', true)`) → `[x, y]` écran. Tablette `centre` `haut` `bas` `stylet` (pointe du tracé en cours) ; calame `pointe` `bout` ; miche `centre` `haut` ; lyre `cordes` `tete` `base`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1) |
|---|---|---|---|
| `ECR.scribe` (`C.ecrScribe`) | 0,9 ≈ **478 px** (crâne), torse 68 px de large ; assis sur le tabouret ≈ 340 px | `calameOreille` (roseau derrière l'oreille, caché dès qu'il tient le calame ; `calame:false` le retire), `oreille`, `jupe` (kaunakès ivoire, ceinture rouge) | `ecrire` (met `assis:1`, `tenu:'calame'`, `tenuB:'tablette'` prise par le côté, posée debout sur le genou, de face ; la pointe suit le tracé : animer `tenuBO.trace` 0→1 ; sans `trace`, elle gratte avec `t` ; `cible` la force ailleurs ; `assis:0` = écrit debout) ; `presente` (tablette de face devant la poitrine, prise par le bord du bas) ; `brandir` (tablette levée devant lui au-dessus de la tête, jamais devant le visage) ; `tendre` (+`cible` = poing ; tablette prise par le côté, qui avance vers l'autre ; accepte `tenu:'miche'`) ; `teteMain` (main ouverte derrière le crâne, qui gratte avec `t`, sourcils inquiets) ; `reverence` (buste incliné, main sur le cœur, bras arrière tendu en arrière, sourire) ; `pain` (met `tenu:'miche'`, miche contre la poitrine) ; `assis`, `marche` |
| `ECR.poete` (`C.ecrPoete`) | 0,9 ≈ **482 px** ; assis sur le sac ≈ 373 px | `chignon`, `barbeHaut`, `barbe` (pend toujours à la verticale), bandeau d'or et moustache peints ; robe drapée vert éteint, épaule avant nue, frange ocre | `barbe` 0..1 (0 = à la poitrine, 78 local ; 1 = presque au plancher, 384 local ; **défaut 0,5**) ; `gris` 0..1 (cheveux et barbe noirs → gris argent) ; `lyre` (met `tenuB:'lyre'` contre la hanche, la main avant pince les cordes avec `t`, yeux mi-clos) ; `coeur` (main ouverte sur le cœur, menton levé, bras arrière levé paume ouverte si la main arrière est libre) ; `prie` (bras levés en V étroit vers le ciel, visage levé, yeux fermés, immobile) ; `joie` (V large, coudes pliés, mains qui s'agitent, petits sauts avec `t`, sourire) ; `depit` (met `tenu:'lyre'` pendante au bout du bras, épaules tombées, tête basse) ; `tient` (une tablette dans chaque main, de face : `tenu` devant la poitrine, `tenuB` levée au-dessus de la tête ; motifs par `tenuO`/`tenuBO`) ; `sirote` + `cible` (paille aux lèvres, main sur la paille ; avec `assis:1` sur le sac) ; `reverence` (s'incline devant un objet, deux mains ouvertes tendues vers le bas devant lui) ; `assis`, `marche` |
| `ECR.ouvrier` (`C.ecrOuvrierA` / `C.ecrOuvrierB`) | 0,85 : **'a' 459 px**, **'b' 464 px** | `pose.tenue` **'a'** (cheveux noirs bouclés, bandeau rouge sang noué, tunique ocre, carrure large : pièces `cheveux` `bandeau` `noeud`) \| **'b'** (bonnet de laine brun, petite barbe, tunique bleu ardoise : `bonnet` `barbeCourte`) | `boire` + `cible` (paille aux lèvres, buste un peu penché, main sur la paille) ; `essuie` (revers de la main sur la bouche, qui frotte avec `t`) ; `tendre` (les deux mains ouvertes en avant pour recevoir ; `cible` = main avant ; avec un `tenu`, il le tend comme le scribe) ; `pain` (miche contre la poitrine) ; `penche` (se penche, mains sur les genoux, yeux ronds) ; `gene` (épaules rentrées, mains jointes devant le ventre, sourire gêné, léger balancement) ; `marche` |

**`bendSign` de `M.ik`** (vérifié au casting : chaque geste ci-dessus, bras avant et arrière, `dir` 1 et −1, aucune alerte « coude à l'envers » ; mêmes bras pour tous : épaules `[-2,-156]` / `[-10,-156]`, coude à 100, `handLen` 100) :

| Personnage, geste | armF, dir 1 | armF, dir −1 | armB, dir 1 | armB, dir −1 |
|---|---|---|---|---|
| Scribe : ecrire, presente, brandir, tendre, teteMain, reverence, pain, marche | 1 | 1 | 1 | 1 |
| Poète : lyre, coeur, prie, joie, depit, tient, sirote, reverence, assis | 1 | 1 | 1 | 1 |
| Ouvriers a/b : boire, essuie, tendre, pain, penche, gene, marche | 1 | 1 | 1 | 1 |
| `M.ik` direct vers une cible (poitrine, devant) | 1 | 1 | 1 | 1 |

Les gestes calent déjà les coudes (IK interne qui garde toujours l'avant-bras plié vers l'avant). Angles bruts à éviter : bras rejeté en arrière (`armB_up` > 0,8) avec avant-bras plié (`armB_lo` < −0,3) → alerte ; garder `armB_lo` ≈ −0,1 dans ce cas.

Pièges :
- `ecrire` assis : tablette (fraîche conseillée : `tenuBO: { motif, trace, fraiche: true }`) posée sur le genou, entre ≈ 70 et 190 px devant l'axe à 0,9 ; la main avant monte à hauteur du menton quand on trace le haut du dessin (elle ne cache pas le visage).
- `sirote`/`boire` : poser la jarre **à ≈ 260·s devant le poète assis** (≈ 165·s devant un ouvrier debout) ; ordre : `ECR.jarre(...)` → marionnette (paille) → `ECR.jarre(..., { couche: 'col' })` (la lèvre recouvre le bout de la paille). La paille n'apparaît qu'au-delà de `boire`/`sirote` 0,3.
- `tient` : la tablette arrière est levée devant lui, bord bas à hauteur du sommet du crâne, haut ≈ 150 px au-dessus : rien de clé au-dessus de lui.
- Grande tablette (`taille` 1,4) en `presente`/`tient` : elle est portée ≈ 25 px plus en avant et 35 px plus bas pour dégager le visage ; laisser ≈ 280 px libres devant le personnage.
- `prie` et `joie` sont deux V : ne pas les enchaîner sur deux mots voisins sans changer aussi le visage (yeux fermés / sourire).
- Barbe à `barbe:1` : elle descend devant la robe jusqu'à ≈ 55 px du plancher ; la lyre et les tablettes passent devant elle.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `ECR.tablette(x,y,s,o)` | dessous (bas du coussin) | 0,9 : **112 × 144 px** (tenue : la même) ; `taille:1.4` → 157 × 202 | `motif` `'vierge'` (argile lissée) \| `'jarre'` (jarre à fond pointu) \| `'orge'` (épi) \| `'mouton'` (tête de mouton à corne spiralée) \| `'heros'` (petit héros barbu couronné, hache levée, à côté d'un grand cèdre) \| `'addition'` (trois jarres + 12 encoches en trait) ; `encoches` 0..12 (rondes, une ou deux rangées sous le dessin ; défaut 0, 12 pour l'addition) ; `forme` `'ronde'`\|`'trait'` ; `trace` 0..1 (le dessin apparaît trait par trait ; absent = complet) ; `fraiche` (argile plus sombre et luisante) ; `taille` (1 ; Gilgamesh et addition 1,4) ; `prise` `'bas'`\|`'cote'` (pour la tenue) |
| `ECR.calame(x,y,s,o)` | dessous, au point de prise | 124 local : **112 px** à 0,9 | couché, pointe biseautée vers +x |
| `ECR.miche(x,y,s,o)` | dessous au centre | **79 × 49 px** à 0,9 | — |
| `ECR.lyre(x,y,s,o)` | dessous de la caisse | **160 px** de haut, 150 de large à 0,9 | taureau doré vers +x, barbe de lapis, caisse à mosaïque |
| `ECR.jarre(x,y,s,o)` | sol sous l'anneau | 0,9 : **300 px** (corps), 190 px de large ; pailles jusqu'à 510 px | `mousse` 0..1 (≤ 0,5 monte au-dessus du col, > 0,5 déborde en coulées) ; `pailles` 0..3 (défaut 2) ; `couche` `'tout'`\|`'col'` (lèvre seule, à repasser par-dessus une paille) ; `t` (bulles) |
| `ECR.jarrePt(x,y,s,nom)` | — | — | `'col'` (milieu de la lèvre : bout de paille), `'haut'` (dessus de la mousse), `'ventre'`, `'bas'` |
| `ECR.sac(x,y,s,o)` | sol au milieu | 0,9 : **112 × 106 px** (dessus = siège, `ECR.SAC_H` 118 local) ; `debout:true` 97 × 151 px (col noué) | `v` 0..2 (trois écrus), `ouvert` (grains d'orge sur le dessus) |
| `ECR.tabouret(x,y,s,o)` | sol au milieu | 0,9 : 101 × **77 px** (`ECR.TAB_H` 86 local) | `cast` ; à poser 8·s derrière les hanches du scribe assis |
| `ECR.comptoir(x,y,s,o)` | sol au milieu | 1 : **468 × 230 px** (plateau de bois à `y − 230`) | `cast` ; à dessiner après `M.drawFloor()`, entre les marionnettes de la fente arrière et celles de la fente avant |
| `ECR.pile(x,y,s,o)` | sol au milieu | 0,9 (12 tablettes) : 198 × 394 px ; tablettes de 62 × 80 px | `n` 1..12 (rangs 3-2-3-2-2 en quinconce, remplis du bas), `motifs` (tableau facultatif ; défaut : jarre, orge, mouton, addition, héros…) |
| `ECR.etagere(t,x,y,s,o)` | dessus de la planche, au milieu | 0,9 : planche 396 px, tablettes 67 × 86 px ; deux cordes jusqu'en haut du cadre | `n` 0..6 tablettes debout (défaut 4), `motifs`, `ph` (phase du balancement), `rot`, `sansCordes` ; pour la faire descendre des cintres : animer `y` |

Dessins bruts réutilisables (repère courant, échelle 1) : `ECR.paille(a, b)`, `ECR.drawJarre(o)`, `ECR.drawPile(o)` ; `ECR.MOTIFS` (liste des 6 motifs) ; `ECR.OBJ` (registre).

## Décor (pré-rendu par `ECR.init()`)
| Appel | Pose | Repères utiles (écran) |
|---|---|---|
| `ECR.entrepot(t, up, o)` | en premier (toile de fond + mur), avant `M.drawFloor()` ; passer le `t` LOCAL (flammes et oiseaux en temps global à l'intérieur) | **baie** x 330–750, y 470–930 (linteau de bois y 436–470, appui y 926–952) ; par la baie : **ziggourat** x 358–722, base y 902, sommet du temple y 792 ; palmiers x 366 et 718 ; soleil x 452 ; vol d'oiseaux y ≈ 590. **Corniches** y 730 (dessus), x 92–300 et 780–988 ; lampes à huile x 196 et 884, flammes ≈ (230, 716) et (850, 716). **Jarres de stockage** à fond pointu x 118, 204, 290 / 790, 876, 962 (haut ≈ y 1183, pointe ≈ y 1365) dans deux supports de bois (traverses y 1225 et 1305). Sol de terre battue y 1345–1395. Options : `soir` 0..1 (ciel crépusculaire, mur assombri, lampes plus vives), `toile` 0..1 (toiles d'araignée : coins de la baie, coins hauts du mur, sous la corniche gauche), `oiseaux` (true), `lampes` (true). `up` (px) fait monter le mur (le ciel reste) |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'ECR\.' casting/scene.js`, page 9.5 = scène type). Les plus utiles :
```js
ECR.entrepot(t, 0, { soir: 0.3 }); M.drawFloor();
const cj = ECR.jarrePt(560, FEET, 0.9, 'col'); ECR.jarre(560, FEET, 0.9, { t, mousse: 0.8, pailles: 2, cast }); ECR.sac(812, FEET, 0.9, { cast });
ECR.poete({ t, assis: 1, sirote: 1, cible: cj, barbe: 0.6 }, 818, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
ECR.ouvrier({ t, tenue: 'a', boire: 1, cible: cj }, 400, FEET, 0.85, { dir: 1, slot: ST.slotF, cast });
ECR.jarre(560, FEET, 0.9, { couche: 'col' });                                     // lèvre par-dessus les pailles
ECR.tabouret(292, FEET, 0.9, { cast });
ECR.scribe({ t, ecrire: 1, tenuBO: { motif: 'jarre', trace: smooth(2, 5, t), fraiche: true } }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
ECR.scribe({ t, presente: 1, tenuO: { motif: 'addition', taille: 1.4 } }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
```
