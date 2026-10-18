# persos.md — « Robert Downey Jr, l'acteur que personne n'assurait » : mode d'emploi de `persos.js`

Espace de noms : `M.dow` (dans `scene.js` : `const DOW = M.dow;`). Dans `S.init` : `DOW.init()` (pré-rendus `DOW.K` : `hollywood`, `studio`, `fauteuil`, `billet`, `billetV` ; appelle aussi `HOU.init()` s'il n'a pas été fait : palmiers et faisceaux de `drhouse.js`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran**, mesurées sur la planche (`casting/scene.js`, page 0), tige non comprise.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `DOW.robert / DOW.assureur / DOW.feige / DOW.dirigeant (pose, x, y, s, o)` : elle prépare la pose (objet tenu, gestes, IK interne). Elle renvoie `r` : `r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale ; `r.main` / `r.mainB` = centre de la main avant / arrière (écran) ; `r.tete` = haut du crâne.
`M.chars` : `dowRobert`, `dowAssureur`, `dowFeige`, `dowDirigeantA`, `dowDirigeantB` (pour `M.ik` / `M.partMatrices`).
Pièces : `torso head armF_up armF_lo armB_up armB_lo legF_up legF_lo piedF legB_up legB_lo piedB objet doigts objetB doigtsB doigtsB2` + `cheveux` (Robert, Feige, dirigeants), `casqueT` (Robert), `visiere` (assureur).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'parapluie'` `'clap'` `'sac'` `'bobine'` `'casque'` `'billet'` (ou `'rien'`), **ou une fonction de dessin** `(o, ctx) => {…}` appelée dans le repère du poing (origine = centre du poing, y vers le bas, droit à l'écran ; ex. le tampon du plan 2, l'enveloppe du plan 4). `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul) + `taille` (facteur) + `pts: { nom: [x,y] }` pour une fonction.
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent en plus.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (parapluie : manche 46 au-dessus de la crosse ; clap : bout de la barre). Mis d'office par `bouclier` (> 0,5) et `claque` (> 0,3).
- `handF` / `handB` : `'fist'` | `'open'` (poing d'office si la main tient un objet ; doigts couleur chair PAR-DESSUS l'objet).
- `expr` : expression nommée (tableau) ; `face` : `{ eyes: 'closed'|'half'|'wide', mouth: 'n'|'o'|'smile'|'tight'|'sourire'|'rire'|'coin'|'moue'|'serre'|'bee' }` (prioritaire sur `expr`) ; `t` (anime soupèse, nuage, tampon, applaudissements, tremblement, marche).
- `marche` 0..1 (pas sur place cadencé par `t` ; la scène déplace `x`) ; `ang.legF` / `ang.legB` acceptés (ajoutés à la cuisse).
- Point nommé de l'objet tenu : `DOW.pt(r, 'nom')` (main avant) / `DOW.pt(r, 'nom', true)` (main arrière) → `[x, y]` écran :
  parapluie `haut` (sommet de la toile) `bout` (embout) `crosse` `prise` · clap `claque` (entre les deux barres, côté libre) `centre` `haut` · sac `col` `piece` `base` · bobine `centre` · casque `centre` · billet `centre`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `DOW.robert` | 0,9 ≈ 472 px (pointe des cheveux), torse 68 px | `cheveux`, `casqueT` | `expr` `'neutre'` `'sourire'` `'malicieux'` (sourire en coin, sourcil levé) `'ravi'` `'degu'` (moue) ; `reverence` (buste plié, main avant sur le ventre, bras arrière tendu derrière) ; `tendre` (main avant ouverte tendue à hauteur de poitrine ; `cible` [x,y] écran = direction) ; `casque` 0..1 ou `true` (trajet : 0 casque tenu à deux mains devant la poitrine, 0,45 levé au-dessus de la tête, 0,75 posé, ≥ 0,95 mains redescendues ; cheveux masqués dès 0,74) + `visiere` (1 défaut = relevée, visage visible ; 0 = fermée) ; `porte` (deux bras au-dessus de la tête, mains ouvertes, coudes devant, menton levé ; `r.charge` = [x,y] écran où poser la charge, ex. `DOW.pile`) ; `bras` (bras ouverts : avant devant, arrière derrière, mains ouvertes à hauteur d'épaule) ; `soupese` (main avant ouverte à hauteur de ventre qui soupèse, rythme `t` ; poser l'objet en `r.main` ou le passer en `tenu`) ; `nuage` (petit nuage noir pendu à un fil au-dessus de la tête, pluie fine, `t`) |
| `DOW.assureur` | 0,9 ≈ 486 px ; ≈ 655 px avec le parapluie ouvert au-dessus de la tête ; torse 62 px | `visiere` | `expr` `'neutre'` `'mefiant'` (œil plissé) `'effraye'` `'satisfait'` `'boucheBee'` `'degu'` ; `parapluie: 'ferme'` (pointe au sol, main sur la crosse) ; `ouvert` (parapluie levé au-dessus de la tête, bras plié coude devant ; avec `parapluie:'ferme'` : 0→0,35 il se retourne pointe en l'air, 0,35→1 les baleines s'ouvrent ; sans : déjà levé, il s'ouvre) ; `bouclier` (parapluie ouvert tenu à l'horizontale devant lui, deux mains, buste un peu plié, il regarde par-dessus) ; `tamponne` + `cible` [x,y] écran (point du plan de frappe) + `frappe` (0 = objet posé sur la cible, 1 = levé ; sans `frappe` : 1,4 coup/s avec `t`) + `sous` (40 unités de personnage : distance poing → bas de l'objet tenu) ; `effraye` (recul, mains ouvertes levées ; met `expr:'effraye'`) ; `assis` + `siege` (y écran de l'assise) ; `r.haut` = sommet du parapluie, `r.obstacle` = `{x, y, r}` pour `DOW.pluie` (parapluie debout et `ouvert` > 0,4, sinon `null`) |
| `DOW.feige` | 0,9 ≈ 461 px, torse 58 px | `cheveux` | `expr` `'neutre'` `'resolu'` `'sourire'` `'ravi'` ; `clap: 'tenu'` (clap dans la main avant, bras un peu devant) ; `claque` (deux mains, clap devant la poitrine : barre ouverte de 0 à 0,3, refermée de 0,78 à 0,92 = l'instant du clac ; `tenuO.barre` (rad, 0..0,9) force l'ouverture) ; `presente` + `cible` (bras tendu main ouverte vers la cible) ; `tendre` + `objet` (nom ou fonction, mis en `tenu`) + `cible` ; `insiste` (poing qui monte à 0,5 et retombe à 1) ; `applaudit` (`t`) |
| `DOW.dirigeant` | 0,85 ≈ 427 px ; torse A 82 px (ventre), B 70 px | `cheveux` | `tenue` `'a'` (défaut : cheveux blancs en couronne, costume beige sable, cravate verte, ventre rond) \| `'b'` (dégarni brun, lunettes rondes dorées, costume marine rayé, cravate brique) ; `expr` `'neutre'` `'inquiet'` `'soulage'` `'ravi'` ; `tremble` (`t` obligatoire : tout le corps vibre, genoux qui s'entrechoquent ; met `expr:'inquiet'`) ; `mainsJointes` (mains serrées devant la poitrine) ; `applaudit` (`t`) ; `compte` + `cible` (main avant ouverte qui tapote, `t` ; la main se pose 100·s px AU-DESSUS de `cible` : pour un sac posé de hauteur h px, `cible = [x du sac, sol − 0,4·h]`) |

`bendSign` de `M.ik` (vérifié sur la planche, pages 1–6 : aucune ligne « ATTENTION coude à l'envers », coude plié vers l'avant) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| `dowRobert` | 1 | 1 | 1 | 1 |
| `dowAssureur` | 1 | 1 | 1 | 1 |
| `dowFeige` | 1 | 1 | 1 | 1 |
| `dowDirigeantA` / `dowDirigeantB` | 1 | 1 | 1 | 1 |

`M.ik` amène le point `[0, 100]` de l'avant-bras (la main) sur la cible ; avec `bendSign 1`, `lo` est négatif (flexion vers l'avant). Les gestes à `cible` des enveloppes font leur IK eux-mêmes.

Pièges :
- Un geste pilote les angles de son bras et remplace les `ang.armX_*` passés. Ordre d'application (le dernier l'emporte) : Robert `tendre soupese bras porte reverence casque` ; assureur `parapluie effraye tamponne` ; Feige `claque presente tendre insiste applaudit` ; dirigeants `mainsJointes applaudit compte`.
- Bras arrière **le long du dos avec le coude plié** (`armB_up` > 0 et `armB_lo` < −0,3) : signalé « coude à l'envers ». Garder `armB_up` ≤ 0 quand le coude plie (`bras` et `reverence` l'étendent presque droit).
- Assureur `parapluie:'ferme'` : la main se pose seule sur la crosse si aucun `ang.armF_*` n'est imposé ; un angle imposé libère le bras mais le parapluie pendant traverse alors le plancher.
- Parapluie ouvert : la toile fait 300 × 70 à s 1 (270 px de large à 0,9) ; le poing reste devant le front : ne rien poser devant son visage. `r.obstacle` n'existe que debout (`bouclier` < 0,3).
- `casque` de Robert < 0,95 tient ses deux bras (il ignore les autres gestes). Pendant 0,45–0,8, l'avant-bras passe devant le haut du visage : passer vite (≈ 0,6 s). Casque porté : `casque: 1` (ou `true`).
- `claque` : prévoir le bruitage à l'instant où `claque` passe 0,85–0,92 ; `DOW.pt(r, 'claque')` donne l'endroit d'un petit éclat.
- `tremble`, `soupese`, `nuage`, `applaudit`, `compte`, `tamponne` (sans `frappe`) demandent `t` dans la pose.
- `assis` n'existe que pour l'assureur.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Même dessin que tenu en main.

| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `DOW.parapluie(x,y,s,o)` | la prise (manche juste au-dessus de la crosse) | 272 de long (prise → embout 242, crosse 30 dessous) ; ouvert 300 de large | `ouvert` 0..1 ; dessiné embout **en haut** : `rot: Math.PI` pour le poser pointe au sol |
| `DOW.clap(x,y,s,o)` | milieu du bas de l'ardoise | 124 × 102 | `barre` (rad, 0..0,9 : ouverture de la barre, charnière à gauche) ; ardoise noire unie, bandes diagonales, aucune inscription |
| `DOW.sac(x,y,s,o)` | milieu du fond | 116 × 144 | `taille` (facteur) ; pièce d'or au col, corde |
| `DOW.bobine(x,y,s,o)` | centre | Ø 130 (+ bout de pellicule à droite) | `couleur` : indice 0..9 ou nom (`DOW.BOBINES` = `brique vert ardoise ocre prune gris petrole cuivre olive nuit`) ou hex ; `rot` |
| `DOW.pile(t, o)` | `o.x, o.y` = sol sous la pile | 130 de large ; 32 par bobine (+ 8) : 8 bobines ≈ 264 px | `n` (8 ; fractionnaire : la bobine suivante tombe de 160 px et rebondit, 0,8 → posée) ; `s` ; `premiere` (indice de couleur de la bobine du bas ; couleurs toutes différentes jusqu'à 10) ; `oscille` 0..1 (balancement, `t`) ; `cast`, `dir`. Renvoie `{ dessus: [x,y], hauteur }`. Pour Robert `porte` : `DOW.pile(t, { x: r.charge[0], y: r.charge[1], n, s: 0.42, oscille: 1 })` |
| `DOW.casque(x,y,s,o)` | milieu du bas | profil ≈ 100 × 141 ; face 106 × 138 | `vue` `'profil'` (défaut, regarde vers +x) \| `'face'` ; `visiere` (1 défaut = relevée : visage ou intérieur sombre visibles ; 0 = masque d'or à fente des yeux) |
| `DOW.armure(x,y,s,o)` | sol sous le pied du portant | 244 × 528 (casque compris) | `casque` (true ; false = col vide, haut du portant visible) ; `visiere` (0) ; `lueur` 0..1 (halo du disque de poitrine) ; `up` (px : remontée vers les cintres, câbles dessinés ; descente = `up` qui décroît) ; renvoie `r.poitrine`, `r.casque` (écran). `DOW.ARMURE` |
| `DOW.billet(x,y,s,o)` | centre | 70 × 34 (98 × 48 à 1,4) | `rot` ; `flip` (rad : il tournoie, largeur × cos, verso plus sombre) ; `couche` (posé à plat au sol, hauteur × 0,36) ; pas d'ombre |
| `DOW.pluie(t, o)` | — | billets à `s` 1,4 | `t0` (début) ; `x0` `x1` (160–920) ; `densite` (12 billets/s) ; `duree` (3 s d'émission) ; `vitesse` (320 px/s) ; `sol` (y d'arrêt, 1424) ; `s` (1,4) ; `seed` ; `obstacle` `{x,y,r}` (= `r.obstacle` de l'assureur) : les billets rebondissent sur la toile, glissent vers le bord le plus proche et retombent. À dessiner APRÈS l'assureur ; fonction pure de `t` (temps du plan) |

## Décors (pré-rendus par `DOW.init()`)
| Appel | Pose | Repères utiles (scène, à `up` 0) |
|---|---|---|
| `DOW.hollywood(t, up, o)` | toile plein cadre en `(0, −up)` (câbles si `up` > 0), puis les palmiers `HOU.palmiers` | ciel du couchant, collines brun-violet, 9 panneaux blancs vierges sur la crête (`DOW.HOLLY.panneaux` : `{x, y, rot}` du bas de chaque panneau, x 318–750, y ≈ 830–900), soleil `DOW.HOLLY.soleil` `{x:760, y:820, r:66}`, façades basses et marquise à ampoules (x 420–670, y 1150–1186), trottoir y 1300–1395. `o.palmiers` (true) ; `o.palmXs` ([190, 890]) ; `o.palmScale` (0,9) ; `o.palmUp` (descente des palmiers seuls). `M.drawFloor()` ensuite |
| `DOW.studio(t, up, o)` | toile plein cadre en `(0, −up)` + fauteuil de réalisateur vide | `DOW.STUDIO` : fond vert `ecran` x 300–790, y 430–1330 (cadre tubulaire autour) ; passerelle y 236 ; projecteurs pendus `lampes` x [190, 410, 680, 900] ; `fauteuil` x 175 (assise y ≈ 1240, dossier jusqu'à y ≈ 1095) ; câbles au pied du cadre. `o.fauteuil` (true) ; `o.lampes` 0..1 (lentilles allumées, cônes de lumière qui frémissent avec `t`) ; `o.faisceaux` 0..1 (+ `o.faisceauxO`) = `HOU.projecteurs` |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'DOW\.' casting/scene.js`). Les plus utiles :
```js
// plan 1 : l'armure descend des cintres, Robert malicieux sous son nuage, l'assureur passe parapluie fermé
DOW.armure(760, FEET - 4, 1, { casque: true, lueur: 0.6, up: 600 * (1 - ease(smooth(2, 4, t))), cast });
DOW.robert({ t, expr: 'malicieux', nuage: smooth(5, 5.4, t) }, 300, FEET, 0.9, { dir: 1, cast });
DOW.assureur({ t, parapluie: 'ferme', marche: 1, expr: 'mefiant' }, 1100 - 120 * t, FEET, 0.9, { dir: -1, cast });
// plan 3/4 : Robert met le casque ; Feige claque le clap ; un dirigeant tapote un sac
DOW.robert({ t, casque: smooth(1.0, 2.2, t), expr: 'ravi' }, 420, FEET, 0.9, { dir: 1, cast });
const rf = DOW.feige({ t, claque: smooth(3, 3.6, t), expr: 'resolu' }, 760, FEET, 0.9, { dir: -1, cast });
DOW.sac(880, FEET, 1, { cast }); DOW.dirigeant({ t, tenue: 'b', compte: 1, cible: [880, FEET - 57] }, 960, FEET, 0.85, { dir: -1, cast });
// plan 6 : pluie de billets qui glisse sur le parapluie ouvert de l'assureur
const ra = DOW.assureur({ t, ouvert: smooth(1, 1.8, t), expr: 'boucheBee' }, 700, FEET, 0.9, { dir: -1, cast });
DOW.pluie(t, { t0: 2, x0: 200, x1: 900, obstacle: ra.obstacle, sol: FEET + 6 });
```
