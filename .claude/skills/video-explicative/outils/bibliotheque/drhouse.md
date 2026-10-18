# persos.md — « Dr House, le faux Américain de la salle de bains » : mode d'emploi de `persos.js`

Espace de noms : `M.hou` (dans `scene.js` : `const HOU = M.hou;`). Dans `S.init` : `HOU.init()` (pré-rendus `HOU.K` : `hopital`, `couloir`, `negatoOn`, `litFond`, `litBarriere`, `litDrap`, `bureau`, `table`, `palmier`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (mesurées sur la planche de casting).

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `HOU.laurie / HOU.producteur / HOU.patient (pose, x, y, s, o)` : elle prépare la pose (objet tenu, gestes, IK interne). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale).
`M.chars` : `houLaurie`, `houProducteur`, `houPatient` (pour `M.ik` / `M.partMatrices`).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'canne'` `'parapluie'` `'camescope'` `'tasse'` `'soucoupe'` `'globe'` `'cassette'` `'drapeau'` `'loupe'` `'pavillon'` (ou `'rien'`) ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul) + `taille` (facteur, 1 par défaut).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent en plus.
- `handF` / `handB` : `'fist'` | `'open'` (poing d'office si la main tient un objet) ; doigts couleur chair dessinés PAR-DESSUS l'objet.
- `face` : `{ eyes: 'closed'|'wide', mouth: 'n'|'o'|'smile'|'tight' }` (prioritaire sur `expr`) ; `expr` : expression nommée (voir tableau) ; `t` (anime boitement, applaudissements, coucou, drapeau, vapeur).
- `marche` 0..1 (pas sur place cadencé par `t` ; la scène déplace `x`) ; `ang.legF` / `ang.legB` acceptés (ajoutés à la cuisse).
- Jambes en 3 pièces : `legF_up legF_lo piedF` / `legB_up legB_lo piedB` (cuisse, tibia, pied) ; bras `armF_up armF_lo armB_up armB_lo` ; `head` ; objets `objet objetB`.
- `assis` 0..1 + `siege` (y écran de l'assise : la hanche s'y pose ; sans `siege`, pieds au sol) + `jambes` `'pliees'` (défaut) | `'allongees'` (dans le lit) : producteur et patient seulement.
- Point nommé de l'objet tenu : `HOU.pt(r, 'nom')` (main avant) / `HOU.pt(r, 'nom', true)` (main arrière) → `[x, y]` écran :
  canne/parapluie `bout` `crosse` · camescope `objectif` `dessous` · tasse `bord` `levre` `vapeur` · soucoupe `dessus` · globe `globe` `haut` · cassette `centre` · drapeau `haut` `flamme` · loupe `verre` · pavillon `pavillon` `tube`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `HOU.laurie` | 0,9 ≈ 464 px (cheveux), ≈ 85 px de large | `meches` (cheveux) | `expr` `'neutre'` `'sceptique'` (sourcil levé, œil plissé) `'grimace'` (odieuse : yeux au ciel, lèvre tordue) `'clin'` `'fier'` `'ebahi'` `'sourire'` ; `clin` 0..1 (clin d'œil de profil) ; `boite` (boitement animé par `t`, appui sur la canne de la main avant ; met `tenu:'canne'` si rien n'est tenu) ; `appui` (main avant posée sur la crosse, canne au sol : 1 par défaut dès que la canne/le parapluie est tenu sans angle de bras imposé) ; `appuiB` (idem main arrière avec `tenuB:'canne'`) ; `pointe` + `cible` [x,y] écran (bras et canne tendus dans la direction de la cible, coude à peine plié vers l'avant) ; `menton` (main ouverte qui frotte la barbe, `t`) ; `chut` (main ouverte devant la bouche) ; `jeu` (bras ARRIÈRE levé haut, main ouverte, menton levé) ; `sirote` (tasse aux lèvres, inclinée, petit doigt levé ; met `tenu:'tasse'`) ; `brandir` + `haut` (1 défaut = objet levé au-dessus de l'épaule, 0 = devant soi à hauteur de poitrine) ; `reverence` (buste plié, main avant sur le ventre, bras arrière tendu derrière) |
| `HOU.producteur` | 0,9 ≈ 413 px (casquette), ventre ≈ 100 px de large | `casquette`, `lunettes` | `expr` `'neutre'` (sourire) `'ravi'` (yeux plissés de bonheur) `'extase'` `'boucheBee'` (mâchoire qui tombe : `jaw` 12) `'sceptique'` ; `jaw` 0..14 (ouverture de la mâchoire, réglable à part) ; `lunettes` `'front'` (défaut, sur la casquette) \| `'nez'` \| 0..1 (glissement du front au nez ; ≥ 0,85 les yeux sont cachés) ; `loupe` (loupe à l'œil ; met `tenu:'loupe'`) ; `applaudit` (deux mains ouvertes qui se rejoignent devant la poitrine, rythme de `t`) ; `coeur` (main avant ouverte sur le cœur) ; `drapeau` (main arrière levée qui agite le drapeau ; met `tenuB:'drapeau'`, ondule avec `t`) ; `assis` + `siege` |
| `HOU.patient` | 0,9 ≈ 468 px, ≈ 70 px de large | `cheveux` | `expr` `'neutre'` `'perplexe'` (sourcils froncés, moue) `'concentre'` `'content'` `'conquis'` (yeux plissés, rire) `'etonne'` ; `assis` + `siege` + `jambes` (`'allongees'` : pieds cachés sous le drap, `pieds: true` pour les montrer) ; `salut` (coucou main ouverte à hauteur d'épaule, `t`) ; `stetho` + `cible` [x,y] écran (embouts aux oreilles, tuyau, pavillon tenu dans la main avant amené sur la cible ; met `tenu:'pavillon'`) ; `perplexe` (main qui gratte le haut de la tête, `t` ; met `expr:'perplexe'`) ; `hausse` (haussement d'épaules : avant-bras ouverts devant, mains ouvertes, tête inclinée) ; `applaudit` (`t`) |

`bendSign` de `M.ik` (vérifié page 8 de la planche : aucun « ATTENTION coude à l'envers », coude plié vers l'avant) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| `houLaurie` | 1 | 1 | 1 | 1 |
| `houProducteur` | 1 | 1 | 1 | 1 |
| `houPatient` | 1 | 1 | 1 | 1 |

`M.ik` amène le point `[0, 100]` de l'avant-bras (la main) sur la cible ; `lo` y est toujours négatif avec `bendSign 1` (flexion vers l'avant). Les gestes à `cible` des enveloppes font leur IK eux-mêmes (pas besoin de `M.ik`).

Pièges :
- Un geste pilote les angles de son bras : il part des `ang.armX_*` passés et les remplace (mélange par la valeur du geste). Deux gestes du même bras à la fois : le dernier de la liste du tableau l'emporte.
- Canne ou parapluie tenus **sans** angle de bras imposé : la main avant se pose seule sur la crosse, bout de la canne au sol (`appui`). Passer un `ang.armF_*` (ou `appui: 0`) libère le bras, mais alors la canne pendante traverse le plancher : la lever (`brandir`, `pointe`) ou la passer en main arrière (`tenuB:'canne'`, elle reste au sol d'elle-même sauf pendant `jeu`).
- `pointe` donne une direction : le bout de la canne est à ≈ 400 px de l'épaule à 0,9 ; lire `HOU.pt(r, 'bout')` pour placer un effet (lueur, toc).
- `menton`, `chut`, `sirote` utilisent la main avant : ne pas y laisser la canne (`tenu:'rien'` ou `tenuB:'canne'`).
- Le tuyau du stéthoscope est dessiné APRÈS la marionnette, en coordonnées écran (pas d'ombre portée) ; garder le pavillon à distance du visage de House (gorge : ≈ 40 px sous le menton).
- Le petit doigt levé de la tasse est un petit détail (≈ 12 px à 0,9) : pour un gros plan, agrandir la marionnette plutôt que la tasse.
- Assis sur le lit : la hanche se pose ≈ 14·s px au-dessus de `siege` ; les pieds du producteur pendent (≈ 80 px au-dessus du sol avec le lit à 1). Assis, le producteur fait ≈ 330 px à 0,9 : prendre `s` ≈ 1,1 si le plan exige ≥ 400 px.
- `expr` du producteur : avec `lunettes:'nez'` les yeux ne se voient plus (`ravi`/`extase` passent par la bouche et les sourcils).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Même dessin que tenu en main. Échelle conseillée 1 (0,9 dans la main).

| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `HOU.canne(x,y,s,o)` | la prise (haut de la crosse) | 274 px de haut (canne de 250 sous la main ; ≈ 234 px tenue à 0,9) | — (bois foncé, embout caoutchouc) |
| `HOU.parapluie(x,y,s,o)` | la prise | 284 px de haut | — (noir, fermé, crosse, embout métal) |
| `HOU.camescope(x,y,s,o)` | milieu du dessous (pour le poser) | 152 × 62 px (137 px tenu à 0,9) | objectif vers +x (`dir` −1 pour le tourner) ; voyant rouge sans texte |
| `HOU.tasse(x,y,s,o)` | dessous de la soucoupe | 80 × 55 px (tasse seule 66 × 44) ; 1,6 ≈ 128 px | `soucoupe` (true seule, false tenue) ; `vapeur` 0..1 (0,6 tenue) ; `t` |
| `HOU.soucoupe(x,y,s,o)` | dessous | 80 × 11 px | — (tenue en `tenuB:'soucoupe'` pendant que l'autre main boit) |
| `HOU.globe(x,y,s,o)` | dessous du socle | 150 × 92 px (≈ 135 tenu à 0,9) | — (globe doré à méridiens, anneau de pellicule perforée, socle or + marbre, aucune inscription) |
| `HOU.cassette(x,y,s,o)` | milieu du bord inférieur | 140 × 80 px | `angle` (= `rot`) ; étiquette blanche vierge, fenêtre et deux bobines |
| `HOU.drapeau(x,y,s,o)` | pied de la hampe | 155 × 95 px (≈ 140 tenu à 0,9) | `t` (ondule) ; `ondule` 0..1 ; 13 bandes, canton bleu à points |
| `HOU.loupe(x,y,s,o)` | bout du manche | 50 × 104 px | — |
| `HOU.tele(x,y,s,o)` | bas du meuble au sol | 520 × 546 px ; écran 400 × 300 (380 × 285 à 0,95) | `allume` 0..1 (lueur bleutée, balayage) ; `draw(cx, cy, w, h)` : image de l'écran en coordonnées de scène, déjà découpée, teintée et voilée ensuite (alpha = `allume`) ; `cassette` 0..1 (enfoncement dans la fente du magnétoscope ; `null`/absent = pas de cassette, 1 = avalée) ; `t` ; `dir`. Renvoie `r` + `r.ecran {cx,cy,w,h}`, `r.fente` (fente du magnétoscope), `r.dessus` (dessus du téléviseur : point d'atterrissage de la cassette) en écran. Constantes `HOU.TELE` |

## Décors (pré-rendus par `HOU.init()`)
| Appel | Pose | Repères utiles (scène, à `up` 0) |
|---|---|---|
| `HOU.hopital(t, up, o)` | toile plein cadre dessinée en `(0, −up)` ; `up` > 0 = remontée vers les cintres (câbles dessinés) | `o.negato` 0..1 (radiographie allumée + halo) ; `o.couloir` (true : couloir derrière les vitres ; `false` = vitres transparentes) ; `o.derriere(t)` dessiné juste avant (Hollywood derrière la vitre) ; `o.lit` (false ; true = lit à x 760) ; `o.x/o.y/o.scale` (réduction). `HOU.HOP` : négatoscope x 140–360, y 560–840 ; store x 430–690, y 410–800 ; cloison vitrée x 800–1080, y 300–1046 ; potence x 1010 |
| `HOU.lit(x, y, s, o)` | `(x,y)` = sol sous le milieu du lit (y = `FEET + 2`) ; tête à droite (`o.dir` −1 : à gauche) | 504 × 292 px à s 1, matelas à 160 px du sol ; `o.partie` `'tout'` \| `'fond'` (avant la marionnette) \| `'devant'` (barrière, et drap si `o.drap`, APRÈS la marionnette) ; renvoie `{ assise, place, bord }` : y du matelas, x de la hanche dans le lit (dos à l'oreiller, regarder vers −x), x de la hanche assis au pied du lit. `HOU.LIT` (unités locales) |
| `HOU.bureau(t, up, o)` | toile plein cadre en `(0, −up)` | `o.table` (true) ; `o.x/o.y/o.scale` (vignette : `(x,y)` = milieu du bas, ex. `{x: cx, y: cy + ry*0.6, scale: 0.45}`). `HOU.BUREAU` : baie x 470–960, y 380–1000 ; table x 640–960, dessus y 1170 (photos de candidats dessus) ; fauteuil x 742–900 ; plante x 175 |
| `HOU.bureauTable(up, o)` | la table seule (à redessiner APRÈS le producteur s'il doit paraître derrière) | `o.x` (800), `o.scale` |
| `HOU.palmiers(t, up, o)` | deux palmiers de carton suspendus, pied en `BACK − up` (descente des cintres, câbles) | `o.xs` ([190, 890]), `o.scale` (0,9 ≈ 900 px de haut) ; balancement léger avec `t` |
| `HOU.projecteurs(t, k, o)` | faisceaux croisés qui balaient (mode `lighter`) + projecteurs de carton au pied | `k` 0..1 intensité ; `o.xs` ([300, 780]), `o.y` (BACK) |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'HOU\.' casting/scene.js`). Les plus utiles :
```js
// House qui boite (plan 1), puis canne tendue vers le négatoscope
HOU.laurie({ t, boite: 1, expr: 'sceptique' }, 330, FEET, 0.9, { dir: 1, cast });
const r = HOU.laurie({ t, pointe: smooth(3.0, 3.3, t), cible: [250, 700], expr: 'grimace' }, 400, FEET, 0.9, { dir: -1, cast });
// patient dans le lit (tête du lit à droite), stéthoscope vers la gorge de House
const L = HOU.lit(760, FEET + 2, 1, { partie: 'fond', cast });
HOU.patient({ t, assis: 1, jambes: 'allongees', siege: L.assise, stetho: k, cible: [gx, gy], expr: 'concentre' }, L.place, FEET, 0.85, { dir: -1, cast });
HOU.lit(760, FEET + 2, 1, { partie: 'devant', drap: true });
// producteur bouche bée (lunettes qui glissent), puis drapeau ; télé allumée avec Laurie à l'écran
HOU.tele(300, FEET - 6, 0.95, { t, allume: on, cassette: kc, cast, draw: (cx, cy, w, h) => { /* fond + */ HOU.laurie({ t, jeu: 1, tenu: 'parapluie' }, cx, cy + h * 0.46, 0.5, { rod: false, floorShadow: false }); } });
HOU.producteur({ t, expr: 'boucheBee', lunettes: smooth(2.6, 3.0, t), drapeau: smooth(8.5, 8.8, t) }, 760, FEET, 0.9, { dir: -1, cast });
// assis au bord du lit en applaudissant
HOU.producteur({ t, assis: 1, siege: L.assise, applaudit: 1, expr: 'ravi' }, L.bord, FEET, 1.05, { dir: -1, cast });
```
