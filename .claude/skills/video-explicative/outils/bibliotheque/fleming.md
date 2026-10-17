# persos.md — « Fleming, le désordre qui inventa la pénicilline » : mode d'emploi de `persos.js`

Espace de noms : `M.fle` (dans `scene.js` : `const FLE = M.fle;`). Dans `S.init` : `FLE.init()` (pré-rendus `FLE.K` : `labo` (toile de fond plein écran), `porte` (battant), `paillasse`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (géométrie, vérifiée sur la planche).
Planche : `casting/scene.js`, une page par seconde : 0 labo + Fleming examine à la paillasse (porte fermée, chapeau sur la patère, valise, poubelle) ; 1 porte ouverte, Fleming part (valise + chapeau) ; 1,5 salut au chapeau, porte mi-ouverte ; 2 / 3 gestes M.ik dir 1 / dir −1 (ordre : tenir, tenir 2 mains, examine, brandir, valise, chapeau, soulève, menton, couvercle ; croix rouge = poing avant, bleue = poing arrière) ; 4 couvercle au-dessus des boîtes 0 et 3 de la paillasse ; 5 balayage épaule/coude 0 → 2,4 rad + brandir ; 6 comparaison ; 7 Fleming + Florey + Chain ; 8 états de la boîte, grande boîte, spore, pile ; 9 valise, patère, poubelle ouverte, Fleming endormi dans un transat (vignette) ; 9,97 labo vide + grande boîte + spore (test téléphone).

## Marionnette (avec tige ; `slot: ST.slotF` par défaut)
Toujours par l'enveloppe `FLE.fleming(pose, x, y, s, o)` (`C.fleFleming`, s 0,92 par défaut) : elle prépare la pose (gestes par `M.ik`, objets tenus, seconde main). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale ; `r.tenu`, `r.tenuO`).
Taille : 0,92 ≈ 465 px debout (pieds → crâne), ≈ 497 px coiffé ; torse ≈ 66 px de large. Une seule tenue : costume trois-pièces gris-bleu `#5f6b78`, gilet, chaîne de montre, col cassé, nœud papillon bordeaux à pois (≈ 44 × 25 px), souliers bruns ; cheveux gris-sable peints, raie sur le côté ; pas de lunettes, pas de blouse.

Options communes :
- `t` : **toujours le passer** (respiration 1,2 px ; `fige: true` la coupe). `face` : `{ brow, mouth, eyes }`. `handF` / `handB` : `'fist'` | `'open'` (mis à `'fist'` d'office quand la main tient un objet).
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'boite'` | `'couvercle'` | `'valise'` | `'chapeau'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul, + `echelle`).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent (rad).
- `deuxMains` : `true` ou 0..1 : la main arrière vient d'elle-même sous la boîte tenue (seconde prise : dessous, près du centre).
- `atteint` 0..1 + `cible` `[X, Y]` **écran** : par `M.ik`, amène sur la cible le **centre** de l'objet tenu, sinon le poing ; `bras: 'B'` = main arrière ; `ptCible` force le point (`'grip'` = le poing, ou un point nommé ci-dessous).
- `marche` (phase en rad, ex. `t * 9`) : pas en balançant les jambes, petit sautillement (`dy`), bras arrière qui balance.
- Point nommé de l'objet tenu : `FLE.pt(r, nom)` (ou `FLE.pt(r, nom, true)` main arrière) → `[x, y]` écran. Boîte : `'centre'` (surface de la gélose), `'haut'`, `'bord'` (bord avant), `'fond'`, `'grip'` ; couvercle : `'centre'` (bas de la jupe), `'haut'` ; valise : `'centre'`, `'bas'` ; chapeau : `'centre'`.
- Angles : `armF_up` −1,57 = bras horizontal devant, −2,5 = au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` positif = tête baissée ; `tilt` > 0 = penché vers le regard.

| Option de geste (0..1, mélange avec `ease`) | Effet (cible dans le repère du torse `FLE.CIBLES`, × s, x vers le regard) |
|---|---|
| `tenir` | boîte (d'office `tenu:'boite'`) devant la poitrine, sous le menton : centre de la gélose en torse `[140, −114]` ; avec `deuxMains: true` la main arrière la soutient dessous |
| `examine` | boîte levée à hauteur d'œil, à ≈ 15 cm devant le nez (bord proche ≈ 45 px devant le nez à 0,92), inclinée vers lui (`ang.objet` −0,22) : centre en `[206, −220]` ; visage dégagé |
| `brandir` | bras levé, coude devant à hauteur d'épaule, avant-bras vertical : poing en `[114, −282]` ; la boîte tenue s'étend devant, au-dessus du front (ne croise pas le visage) |
| `valise` | valise (d'office `tenuB:'valise'`) au bout du bras ARRIÈRE tendu le long du corps : poing en `[−8, 47]` ; la valise passe derrière les jambes |
| `coiffe: true` | feutre mou brun-tabac à ruban noir sur la tête (sinon tête nue ; défaut : tête nue) |
| `chapeau` | (avec `coiffe`) main avant au bord AVANT du feutre, coude devant ; l'avant-bras frôle le bout du nez |
| `souleve` | (avec `coiffe` + `chapeau: 1`) le feutre quitte la tête dans la main, vers l'avant et le haut (+62, −34 px × s) : salut. Remettre le chapeau = `souleve` de 1 à 0, puis `chapeau` à 0. Le feutre tenu garde l'angle de la tête : raccord exact à 0 |
| `menton` | poing avant sous le menton (perplexe : ajouter `face: { brow: 'worry' }`) ; l'avant-bras passe devant le nœud papillon |
| `penche` | buste plié aux hanches de 0,3 rad vers la paillasse, jambes droites, tête un peu baissée (se combine avec les autres gestes) |
| `couvercle` | couvercle (d'office `tenu:'couvercle'`) tenu au-dessus d'une boîte posée : `boite: [X, Y]` = point posé de la boîte (ex. `FLE.PAI.boites[i]`), `boiteS` = son échelle (1) ; `releve` 0..1 : 0 = juste au-dessus (≈ 7 px × boiteS), 1 = ≈ 110 px au-dessus de sa place. Sans `boite` : devant le ventre |
| `assis` | assis dans un transat, buste renversé (−0,5 rad), jambes allongées devant, mains sur les cuisses ; **(x,y) = point d'assise (sous les hanches)**. `dort: true` : yeux clos, tête qui dodeline (≈ 0,22 ± 0,08 rad). Dans une vignette : s 0,5, `rod: false`, `floorShadow: false`, transat dessiné par le plan |

**bendSign de `M.ik`** (vérifié pages 2, 3, 4 et 5 de la planche, cibles marquées d'une croix ; aucune ligne « ATTENTION coude à l'envers » sur 3 rendus) — aussi dans `FLE.BEND` :
| Geste | bras avant `dir 1` | bras avant `dir −1` | bras arrière `dir 1` | bras arrière `dir −1` |
|---|---|---|---|---|
| tenir, examine, brandir, chapeau, soulève, menton, couvercle, `atteint` | 1 | 1 | — | — |
| valise, `deuxMains` (main sous la boîte), `atteint` avec `bras:'B'` | — | — | 1 | 1 |
Avec bendSign 1 le coude plie toujours vers l'avant / le bas. −1 n'est jamais utilisé (il retourne le coude au-dessus de la ligne épaule–main).

Pièges :
- La boîte tenue est agrandie (`echelle` 1,55 : ≈ 143 px à 0,92) par rapport aux boîtes posées (100 px). Pour une boîte prise sur la paillasse sans saut de taille : `tenuO: { echelle: 1.09 }` (≈ 100 px), puis grandir avec le geste.
- `coiffe` n'est pas mis d'office : le passer à chaque image où il porte le chapeau. Chapeau tenu ailleurs que sur la tête : `tenu:'chapeau'` (tenu par le bord avant).
- `examine`, `tenir` et `brandir` se mélangent dans cet ordre (le dernier actif l'emporte) : passer de `tenir` à `examine` = monter `examine` de 0 à 1 en gardant `tenir: 1`.
- Bras arrière : ne jamais mettre `armB_up` > 0 avec `armB_lo` < 0 (avant-bras qui repart vers le dos).

## Personnages de la bibliothèque (plan 6)
Florey = `LEO.savantA({ t, tenu: 'rien' }, x, FEET, 0.9, { dir, cast })` (chauve, pince-nez, redingote verte ; sans `tenu` il tient une loupe) ; Chain = `LEO.savantB({ t }, x, FEET, 0.8, { dir, cast })` (moustache rousse, calotte). Mode d'emploi : `outils/bibliotheque/leonard.md`. Vus côte à côte page 7 : Fleming (gris-bleu, cheveux) se distingue net.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Échelle 1 par défaut (= taille sur la paillasse).

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `FLE.boite(x,y,s,o)` | centre du fond (point posé sur la table) | s 1 : 100 × 54 px ; gros plan s 1,55 : 155 px | `couvercle` 0..1 (1 = posé ; entre deux il descend en fondu) ; `bacteries` 0..1 (colonies jaune-crème qui apparaissent une à une) ; `moisissure` 0..1 (tache duveteuse vert-bleu `#5f8a7a` à bord blanc qui grossit, à gauche du centre) ; `halo` 0..1 (anneau clair à bord net autour de la moisissure : les colonies y disparaissent) |
| `FLE.couvercle(x,y,s,o)` | centre du bas de la jupe | s 1,09 : 116 × 58 px (couvre une boîte s 1) | — (verre très transparent) |
| `FLE.pile(x,y,s,o)` | milieu du bas de la pile | s 1 : ≈ 110 × 113 px (7 couvercles) | `n` (7) ; `moins` (entier : couvercles retirés du dessus) ; `penche` 0..1 (la pile oscille, le haut bouge le plus ; demande `o.t`) |
| `FLE.pileHaut(x,y,s,o)` | — | — | → `[X, Y]` écran du couvercle du dessus (même `o`) : cible pour `atteint` |
| `FLE.spore(x,y,s,o)` | centre de la boule | s 1 : 40 px (filaments compris) ; posée s 1,5 : 60 px | `t` (se dandine : ±0,35 rad, flotte de ±5 px) ; `fil` (true : fil de théâtre très fin jusqu'à `filY`, 0 = haut de l'écran) ; `fixe` (sans dandinement) |
| `FLE.grandeBoite(x,y,s,o)` | centre du disque | s 1 : 330 px de verre (346 avec le carton) | `bacteries`, `moisissure`, `halo` (même tirage que la petite boîte) ; `t` (balancement ±0,02 rad) ; `fils` (true : deux fils vers `filY`, 0) ; `fige` ; `cast`. Pour la descente des cintres : faire varier `y` |
| `FLE.valise(x,y,s,o)` | milieu du bas | s 1 : 140 × 100 px (124 avec la poignée) | — (cuir clair, sangles, coins laiton). Posée au sol : `y = ST.back + 6` (fond) ou `FEET` (devant) |
| `FLE.chapeau(x,y,s,o)` | milieu du bord (ou crochet) | s 0,92 : 107 × 57 px (= taille sur la tête) | `patere: true` : (x,y) = crochet de la patère, accroché penché (`rot` −0,16) → `FLE.chapeau(FLE.LABO.patere.x, FLE.LABO.patere.y, 0.92, { patere: true, cast })` |
| `FLE.poubelle(x,y,s,o)` | milieu du bas | s 1 : ≈ 96 × 125 px (pédale à l'avant, +x) | `ouvert` 0..1 (couvercle sur charnière arrière, 1 ≈ 69°, intérieur sombre) ; `dir` −1 = pédale à gauche. Place : `FLE.LABO.poubelle` = `{x: 762, y: ST.back + 4}` (à dessiner avant `M.drawFloor`) ; bouche ≈ 100 px au-dessus de y |

## Décors (pré-rendus par `FLE.init()`)
| Appel | Pose | Repères utiles |
|---|---|---|
| `FLE.labo(t, o)` | en premier (toile plein écran + battant de porte) | `o.ouverte` 0..1 (porte praticable, charnières à droite, 1 ≈ 75°) ; `o.porte: false` = ne pas dessiner le battant |
| `FLE.porte(t, ouverte)` | après un personnage qui sort, pour que le battant passe devant lui | porte : `FLE.LABO.porte` = ouverture x 792–948, haut y 795, gond x 948 (couloir sombre derrière) |
| `FLE.paillasse(t, o)` | après la toile, **avant `M.drawFloor()`** | plateau carrelé blanc x 180–720, dessus y 1084 (fond) → 1110 (bord avant), chant jusqu'à 1132 ; corps bois sombre à tiroirs. Pile en `FLE.PAI.pile` = `{x: 236, y: 1104}` |
| | options | `o.boites[i]` = options de la boîte i (`couvercle`, `bacteries`, `moisissure`, `halo`, `s`) ; `o.n` (4) ; `o.sauf` = indices non dessinés (boîte prise en main) ; `o.pile` = options de la pile (`false` = sans) ; `o.cast` |

Positions fixes des boîtes (point posé, s 1) : `FLE.PAI.boites` = `[[326, 1103], [418, 1094], [510, 1104], [602, 1095]]` (rangée avant / arrière alternée ; dessinées du fond vers l'avant). Sur le plateau, fixes : portoir à éprouvettes (x ≈ 690) et carnet fermé (x ≈ 676, devant).
Toile `labo` : plâtre gris-vert, carreaux crème sous y 872, fenêtre à guillotine FERMÉE x 300–600, y 360–820 (`FLE.LABO.fenetre` ; ciel gris, toits de briques), appui y 820 avec bec Bunsen (x 372) et microscope laiton (x 530) ; étagères de flacons x 130–280 (y 470, 620, 770) et au-dessus de la porte (y 660) ; patère `FLE.LABO.patere` = `{x: 733, y: 884}`. Étiquettes nues, aucun texte.
Fleming à la paillasse : debout en `FEET` à x ≈ 780–820 `dir: -1` (boîtes 2–3 à portée avec `penche`), ou à x ≈ 170–250 `dir: 1` (boîtes 0–1, il cache la pile).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'FLE\.' casting/scene.js`). Les plus utiles :
```js
FLE.labo(t, { ouverte: 0 }); FLE.paillasse(t, { cast, boites: [{ bacteries: 1 }, { bacteries: 1, moisissure: 1, halo: 1 }, {}, { bacteries: 1 }], pile: { penche: 0.6 } });
M.drawFloor();
// Fleming examine la boîte, penché, à droite de la paillasse
FLE.fleming({ t, examine: 1, penche: 0.3, tenuO: { bacteries: 0.8 } }, 800, FEET, 0.92, { dir: -1, cast });
// couvercle tenu au-dessus de la boîte 3, puis relevé (k de 0 à 1)
FLE.fleming({ t, couvercle: 1, releve: k, penche: 0.5, boite: FLE.PAI.boites[3] }, 820, FEET, 0.92, { dir: -1, cast });
// départ : valise au bras arrière, chapeau sur la tête, salut
FLE.fleming({ t, valise: 1, coiffe: true, chapeau: 1, souleve: 0.5 }, 640, FEET, 0.92, { dir: 1, cast });
FLE.fleming({ t, valise: 1, coiffe: true, marche: t * 9 }, x, FEET, 0.92, { dir: 1, cast });
// grande boîte qui pend des cintres, spore au fil
FLE.grandeBoite(540, 600, 1, { t, bacteries: 1, moisissure: 1, halo: 1, cast }); FLE.spore(480, 980, 1.5, { t });
```
