# persos.md — « Frankenstein, le monstre né d'un volcan » : mode d'emploi de `persos.js`

Espace de noms : `M.frk` (dans `scene.js` : `const FRK = M.frk;`). Dans `S.init` : `FRK.init()` (pré-rendus : vue du lac nuit/jour, mur du salon, clavecin, tapis, voiles nuit/jour).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (mesurées sur la planche).
Planche : `casting/scene.js` (t 0 planche · 1 comparaisons · 1,5 gros plan des têtes d'hommes · 2 Mary · 3 Byron · 4 Percy/Polidori · 5 Victor · 6 créature · 7 bras et `M.ik` · 7,5 prises s 1,6 · 8 écran d'ombres · 8,5 salon jour · 9 salon nuit + poursuite · 9,5 salon nuit vide + éclair · 9,97 téléphone). Rendu : 0 ligne « ATTENTION ».

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` au rang du fond)
Toujours par l'enveloppe `FRK.nom(pose, x, y, s, o)` : elle prépare la pose (gestes, objet tenu, seconde main, siège) et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). `FRK.nom.pose(p)` = pose finale sans dessiner. Passer `t` dans la pose (marche, griffonnage, flammes, drap).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'livre'` `'page'` `'plume'` `'encrier'` `'chandelier'` `'lanterne'` `'manuscrit'` `'verre'` (ou `'rien'`) ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul).
- `droit` / `droitB` : `true` par défaut (objet droit à l'écran) ; `ang.objet` le tourne. `deuxMains` (0..1) : la main arrière vient sur la seconde prise (livre : le dos ; page, manuscrit : bord opposé).
- `cible` : point **écran** visé (`ecrire` = bec de la plume ; `tenir`, `penche`, `depit` = point de la main).
- `handF` / `handB` : `'fist'` | `'open'` | `'paume'` (paume en l'air) ; `face` : `{ brow, mouth ('n' 'o' 'smile' 'tight' 'triste'), eyes ('open' 'closed' 'wide' 'half' ou 0..1), regard (-1 en coin vers l'arrière … 1 vers l'avant) }`.
- `humeur` : Mary `'songeuse'` `'effrayee'` `'illuminee'` ; hommes `'neutre'` `'inquiet'` `'effraye'` `'sombre'` `'ironique'` (`face` l'emporte).
- `marche` 0..1 (pas selon `t`) ; `ang` pour un geste maison (après les gestes).
- **Assis** (`assis: true` hommes, `assise: true` Mary) : `(x,y)` = sol **sous la hanche** ; le siège est dessiné par la marionnette, fixe au sol : `siege` `'bergere'` | `'fauteuil'` | `'chaise'` | `false` ; `siegeSombre` 0..1 (le foncer la nuit). Les pieds sont ≈ 103 px devant `x` (hommes à 0,92) ; la jupe de Mary va jusqu'à ≈ 112 px devant.
- `o.lune` 0..1 (+ `luneDir` [dx,dy], défaut [-3,-2.5] ; `luneCol`) : **liseré de lune** bleuté sous la silhouette (nuit). Redessine la marionnette une fois de plus : ≤ 3 marionnettes par image.
- Point nommé de l'objet tenu : `FRK.pt(r, 'nom')` (main avant) / `FRK.pt(r, 'nom', true)` (main arrière) → `[x, y]` écran. Noms : livre `dos centre medaillon haut bas` · page `bout centre haut` · plume `bec barbe` · encrier `goulot` · chandelier `flamme pied` · lanterne `flamme fond anneau` · manuscrit `centre haut` · verre `bord fond`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `FRK.mary` (`C.frkMary`) | 0,9 ≈ 455 px (chignon), ≈ 95 px de large | `cheveux` `chignon` `boucles` (tempes), `pieds` (assise), `siege` `siegeAv` ; jambes simples sous la robe | `ecrire` (+`cible` ; plume d'office, le bec griffonne selon `t`, main arrière ouverte 41 px derrière la cible, tête baissée) ; `plume` (plume levée devant la poitrine, hésitante, regard en l'air) ; `menton` (poing sous le menton, songeuse) ; `tenir` (livre d'office, à deux mains devant la poitrine, ou `cible`) ; `assise` (true, fauteuil d'office) ; `dort` (tête tombée, buste affaissé, yeux clos, mains sur les genoux) ; `sursaut` (à mettre AVEC `dort` : buste qui se redresse, yeux grands ouverts, bouche ronde, main à la poitrine) ; `marche` |
| `FRK.byron` (`C.frkByron`) | 0,92 ≈ 480 px (boucles), ≈ 105 px | `cheveux` (boucles serrées dessus et derrière, tempe et oreille dégagées, favori court et fin qui en part devant l'oreille) `col` (col Byron) `foulard` ; jambes à genou (`legF/legF_lo`, `legB/legB_lo`) | `defi` (bras avant ouvert vers l'avant, coude plié, paume en l'air, menton levé, sourire en coin) ; `ennui` (assis d'office dans la **bergère**, affalé, la joue dans la main, jambe allongée) ; `leve` 0..1 (se lève du siège : à 1 il est debout **112·s px devant** `x`, au-dessus de ses pieds ; le siège reste) ; `ecrire`(+`cible`) ; `assis` (chaise d'office) ; `depit` (+`cible` : main ouverte posée à plat, tête qui tombe ; la plume n'est plus tenue : la dessiner posée par `FRK.plume`) ; `marche` |
| `FRK.percy` (`C.frkPercy`) | 0,9 ≈ 473 px, ≈ 95 px (plus grand et mince) | `cheveux` (mèches ébouriffées châtain clair) `col` `colAv` (col ouvert, cou nu) | `ecoute` (penché d'un rien, tête inclinée, regard attentif) ; `assis` (fauteuil d'office) / `leve` ; `verre` (verre tenu à la poitrine) ; `trinque` (verre levé, sourire) ; `bras` (mains jointes devant la ceinture : les bras croisés sont interdits de profil) ; `marche` |
| `FRK.polidori` (`C.frkPolidori`) | 0,9 ≈ 460 px, ≈ 100 px | `cheveux` (lissés vers l'arrière, front dégagé, oreille visible, favori fin qui en part et s'amincit jusqu'à l'angle de la mâchoire) `col` (cravate blanche) | `ecoute` (mains jointes basses, sourcils froncés) ; `ecrire`(+`cible`) ; `tenir` (manuscrit d'office, deux mains) ; `regard` (regard en coin vers l'arrière, tête basse, bouche serrée : inquiétant) ; `assis` (chaise) / `leve` ; `marche` |
| `FRK.victor` (`C.frkVictor`) | 0,9 ≈ 480 px (cheveux), ≈ 100 px | `cheveux` (mèches souples arrondies, sans pointes) `meche` (sur le front) `col` `sangle` `tablier` (bavette) `tablierBas` (pend toujours à la verticale) | `penche` (+`cible` : penché sur la table, les deux mains ouvertes au-dessus ; défaut ≈ 80 px devant, à hauteur de taille) ; `tenir` (lanterne d'office, `haut` 0 basse … 1 levée, défaut 0,6) ; `recul` (buste en arrière, mains ouvertes levées devant lui) ; `fuite` (course selon `t` : buste en avant, grandes enjambées, bras qui battent coudes pliés devant) ; `horreur` (mains aux joues, yeux dégagés, bouche ronde) ; `marche` |
| `FRK.creature` (`C.frkCreature`) | **1,18 ≈ 585 px** (une tête et demie de plus que Victor), ≈ 130 px | `cheveux` (longs, raides), grandes mains (×1,25), `drapA` `drapB` | `yeux` 0 fermés … 1 ouverts ; `couchee` (true : couché sur le dos, **`(x,y)` = plateau de la table sous la hanche**, tête vers l'arrière, tige retirée d'office) + `drap` 0..1 (1 = jusqu'au cou, défaut ; glisse vers les pieds) ; `redresse` (true) + `assise` 0..1 (buste de 0° à 90°, jambes à plat sur la table sous le drap ; défaut `drap` 0,5) ; `marche` (lourde et lente, 0,75 pas/s, roulis) ; `seule` (dos voûté, tête basse, bouche triste) |

**`bendSign` de `M.ik`** (page 7 : bras avant vers une cible haute, bras arrière vers une cible basse, aucune ligne « ATTENTION ») :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Mary, Percy, Victor | 1 | 1 | 1 | 1 (non testé par `M.ik`, seulement par les gestes) |
| Byron, Polidori, créature | 1 | 1 | 1 (non testé par `M.ik`, seulement par les gestes) | 1 |

Pour un `M.ik` à la main : `const q = FRK.byron.pose({ t, … }); const a = M.ik(C.frkByron, q, x, y, s, dir, 'armF', [X, Y], 1);` puis repasser `ang: { armF_up: a.up, armF_lo: a.lo }` à l'enveloppe (sans geste qui réécrit ce bras). `handLen` 100 (créature 112). Épaules `[-2,-150]`/`[-10,-150]` (Mary `-148`, créature `-146`), bras 96 + 100 (Mary 94, créature 104 + 112).

Pièges :
- Un geste réécrit les angles de son bras : ne pas combiner deux gestes du même bras (`tenir` + `menton`). `dort` + `sursaut` se combinent (sursaut l'emporte).
- Un personnage assis porte son siège : retirer le meuble du salon au même endroit (`FRK.salonSol(t, { bergere: false })`). Byron `ennui` = bergère ; à l'écritoire, poser `FRK.ecritoire` **avant** la marionnette, à ≈ 140·s px devant `x`, et viser `cible: FRK.accPt(e, 'ecritoire', 'ecrire')`.
- `leve` déplace le corps : enchaîner ensuite sur une pose debout à `x + 112·s·dir`.
- Créature couchée / redressée : `pose.libre` est mis d'office sur les jambes (jambes à plat sur la table, pointes en l'air : dispense justifiée). Le drap pend de 55·s px sous le plateau : la table du plan doit être au moins aussi longue que 470·s px.
- Les cheveux des quatre hommes sont peints sans le gros liseré blanc de découpe (trait sombre fin) : ne pas les remplacer par des `pts` de pièce, sinon l'effet « calotte » revient.
- Le livre tenu par `dir:-1` est vu en miroir (médaillon retourné, sans lettre : sans conséquence).
- La nuit, le salon s'assombrit mais pas les marionnettes : `M.stageLight` (a 0,45–0,55) + `o.lune: 1` sur les personnages éclairés.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad), `o.alpha`, `o.cast`, `o.ombre`, `o.t`. Point nommé d'un accessoire seul : `FRK.accPt(r, 'objet', 'nom')`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `FRK.livre(x,y,s,o)` | bas du dos (reliure) | 1 : fermé 78 × 102 px **à droite** du dos ; ouvert 156 × 102 centré sur le dos ; s 3 ≈ 234 × 306 (p6) | `ouvert` 0..1 (le plat tourne autour du dos) ; `ecrit` 0..1 (lignes de la page de droite, défaut 1). Couverture cuir brun-rouge, coins dorés, médaillon (la créature, tête et épaules), aucune lettre |
| `FRK.page(x,y,s,o)` | bas, milieu | 1 : 76 × 100 px ; 1,6 ≈ 122 × 160 | `ecrit` 0..1 (11 lignes ondulées qui se remplissent ; `FRK.accPt(r,'page','bout')` = bout de la ligne en cours, pour la plume) |
| `FRK.plume(x,y,s,o)` | bec | 0,9 : ≈ 43 × 120 px | plume d'oie blanche |
| `FRK.encrier(x,y,s,o)` | dessous | 0,9 : 43 × 33 px | `plume` (true : plume plantée) |
| `FRK.chandelier(t,x,y,s,o)` | pied | 0,8 : ≈ 83 × 180 px (+ flammes) | `hauteur` 1..0,3 (bougies qui raccourcissent) ; `eteint` (true ou [b,b,b] : fumée fine) ; `fumee` 0..1 ; `souffle` 0..1 ou [..] (flamme qui se couche) ; `lueur` (true) |
| `FRK.lanterne(t,x,y,s,o)` | dessous (anneau à 114·s au-dessus) | 0,9 : 45 × 113 px | `allumee` (true) ; `lueur` (true, halo 135 px) |
| `FRK.manuscrit(x,y,s,o)` | bas, milieu | 0,9 : 59 × 83 px | liasse nouée d'un ruban rouge sombre |
| `FRK.verre(x,y,s,o)` | pied | 0,9 : 25 × 59 px | `niveau` 0..1 (vin, défaut 0,6) |
| `FRK.bergere` / `FRK.fauteuil` / `FRK.chaise(x,y,s,o)` | sol sous la hanche du futur assis | 0,92 : bergère 132 × 294 ; 0,9 : fauteuil 133 × 245, chaise 129 × 243 | `dir` (dossier du côté opposé) ; `sombre` 0..1 |
| `FRK.ecritoire(x,y,s,o)` | sol, milieu | 0,9 : 126 × 196 px (pupitre incliné vers −x) | `ecrit` 0..1 (page sur le pupitre, défaut 0,6) ; `plume` / `page` (true) ; `sombre` ; points `ecrire` `dessus` `encrier` |
| `FRK.gueridon(t,x,y,s,o)` | sol, milieu | 0,9 : 115 × 330 px (avec chandelier) | `chandelier` (false ou options du chandelier) ; `livre` (true) ; `sombre` ; points `dessus` `flamme` |

## Ombres chinoises (silhouettes `#0d0d10`, à dessiner DANS l'écran : `o.ombres` de `FRK.ecran` ou `FRK.ecranClip`)
Coordonnées **écran** ; `o.dir` ±1 ; `o.t` (frémissements, temps global). Tailles à s 1 (à l'écran ×s).
- `FRK.ombreCreature(x, y, s, {assemble, vie, couche, t})` : debout ≈ 418·s px de haut (`(x,y)` = pieds) ; `couche` 1 = sur le dos, tête vers −x, `(x,y)` = plateau sous la hanche (≈ 420·s de long). `assemble` 0..1 : jambes, torse, bras, tête arrivent l'une après l'autre en flottant (0,13 d'écart, 0,34 chacune) ; `vie` 0..1 : la tête se relève, le bras avant se soulève, les doigts frémissent.
- `FRK.ombreSavant(x, y, s, {geste, penche, t})` : ≈ 400·s, cheveux en bataille, penché (`penche` 1 défaut) ; `geste` 1 = main tendue au-dessus du corps (défaut), 0 = bras le long du corps.
- `FRK.ombreVampire(x, y, s, {cape, t})` : ≈ 386·s, haut col pointu ; `cape` 0 cape fermée → 1 ailes de chauve-souris festonnées (≈ 470·s d'envergure).
- `FRK.ombreTable(x, y, s)` : tréteaux en X, plateau 408·s × 16·s à `FRK.OMBRE_TABLE.haut` (150)·s au-dessus de `y`.
- `FRK.eclair(x, y, s, t, {ecart 130, force 0..1, electrodes true, cuivre false})` : arc blanc-bleu qui change 14 fois/s entre deux électrodes (boules sur tiges) ; `cuivre: true` pour des électrodes en cuivre hors de l'écran (laboratoire).
Réglages éprouvés (écran à s 0,85, bas à y 900) : table `ombreTable(600, 880, 0.75)`, créature couchée `ombreCreature(520, 880 − 150·0.75, 0.5, {couche:1})`, savant `ombreSavant(750, 880, 0.55, {dir:-1})`.

## Décors (pré-rendus par `FRK.init()`)
| Appel | Pose | Repères utiles (`FRK.SAL`) |
|---|---|---|
| `FRK.salon(t, o)` | plein cadre, AVANT `M.drawFloor()` | `o` : `nuit` 0..1, `jour` 0..1 (aucun = soir), `pluie` (1), `eclair` 0..1 (flash + éclair dans le ciel ; `eclairX` 760, `eclairSeed`), `feu` (1), `flambeaux` (1), `corbeau` 0..1 (la tête tourne), `portraitYeux` −1..1 (yeux du portrait de droite), `voilages` (true), `up` |
| `FRK.salonSol(t, o)` | APRÈS `M.drawFloor()`, avant les marionnettes | mêmes `nuit` `eclair` `feu` ; `tapis` (true) ; `lumieres` (taches de lune / d'éclair au sol) ; `ecritoire` `fauteuil` `bergere` `gueridon` : true \| false \| `{x, dir, s}` ; `chandelier` (options du chandelier du guéridon : `hauteur`, `eteint`, `souffle`) |
| `FRK.ecran(t, x, y, s, o)` | suspendu à deux fils jusqu'aux cintres ; descendre en faisant varier `y` | `(x,y)` = milieu du bord bas du cadre ; drap 560 × 420·s (cadre 604 × 464·s) ; `lumiere` 0..1 (ivoire terne → ambré rétroéclairé) ; `balance` (1) ; `ombres: (R) => {…}` ; renvoie `R = {x0, y0, w, h, cx, cy}` (`FRK.ecranRect(x,y,s)` sans dessiner). `FRK.ecranClip(x, y, s, fn, {t})` : même découpe et même balancement |

Repères du salon : portes-fenêtres x 232–404 et 676–848 (vitres y 312–1250, lambrequins jusqu'à y 330) ; cheminée x 424–656, tablette y 1160, foyer x 474–606 (feu à y 1372) ; miroir x 452–628, y 742–1156 ; pendule (540, 1062) ; flambeaux de la tablette (446, 1160) et (634, 1160) ; bibliothèque x 46–220, haut y 420 ; corbeau (tête) (186, 354) ; portraits (946, 640) et (540, 520) ; lune (772, 470) ; clavecin x 62–342 (dans l'ombre) ; meubles par défaut : écritoire x 214, fauteuil x 380, bergère x 724 (dir −1), guéridon x 878 (sur `ST.slotF − 34`). Trois couches : mur lambrissé vert-de-gris + fenêtres + bibliothèque + cheminée/miroir + portraits ; clavecin ; tapis et meubles. Animations : pluie oblique, nuages devant la lune, ronds sur le lac, gouttes sur les vitres, voilages, feu + escarbilles, flambeaux, pendule, éclair.
Écran dans le salon (p5, p7) : `x` 540–560, bas du cadre y ≈ 900, `s` 0,85 (il cache le miroir, pas le feu).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'FRK\.' casting/scene.js`).
```js
// p5 : salon de nuit, cauchemar sur l'écran, Mary endormie qui se réveille, poursuite resserrée
FRK.salon(t, { nuit: 1, pluie: 1, eclair: fl, portraitYeux: 0.5 });
FRK.ecran(t, 560, 900, 0.85, { lumiere: 1, ombres: () => { FRK.ombreTable(600, 880, 0.75); FRK.ombreCreature(520, 768, 0.5, { couche: 1, vie: k, t }); FRK.ombreSavant(750, 880, 0.55, { geste: 1, t, dir: -1 }); } });
M.drawFloor(); FRK.salonSol(t, { nuit: 1, eclair: fl, fauteuil: false, chandelier: { hauteur: 0.5 } });
FRK.mary({ t, assise: true, dort: 1, sursaut: u }, 330, FEET, 0.9, { dir: 1, cast, lune: 1 });
M.stageLight(t, { spot: { x: 400, y: 1180, r: 360, a: 0.5 } });
// p4 : Byron s'ennuie dans sa bergère, Polidori regarde en coin (jour de pluie)
FRK.salon(t, { jour: 1 }); M.drawFloor(); FRK.salonSol(t, { jour: 1, bergere: false });
FRK.byron({ t, ennui: 1 }, 640, FEET, 0.92, { dir: -1, cast });
FRK.polidori({ t, regard: 1 }, 470, FEET - 30, 0.86, { dir: 1, cast, slot: ST.slotB });
// p6 : la créature se redresse sur la table, les yeux s'ouvrent
FRK.creature({ t, redresse: true, assise: k, yeux: e, drap: 0.6 }, 520, plateauY, 1.0, { dir: 1, cast });
```
