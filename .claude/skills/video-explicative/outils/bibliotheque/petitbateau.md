# persos.md — « Petit Bateau, la culotte née d'une comptine » : mode d'emploi de `persos.js`

Espace de noms : `M.pb` (dans `scene.js` : `const PB = M.pb;`). Dans `S.init` : **`PB.init()`** (pré-rend le décor : mur, côtés, années 20, premier plan, 6 ciels → `PB.K`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran**, mesurées sur la planche.
Planche : `casting/scene.js` (page = instant) : 0 repos + marche dir −1 · 1 comparaisons + tenues des enfants · 2 / 3 gestes d'Étienne dir 1 / −1 · 4 Germaine · 5 enfants (deux sens) · 6 objets + chat · 7 prises agrandies · 8 `M.ik` + bras pliés + brandir · 9 décor plein cadre (soir, lampe) · 9,97 vignettes téléphone. Rendu final : 0 ligne « ATTENTION ».

## Marionnettes (avec tige ; slot `ST.slotF` par défaut, passer `slot: ST.slotB` au rang du fond)
Toujours par l'enveloppe `PB.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`) : elle prépare la pose et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale ; `r.main` / `r.mainB` = poing avant / arrière). Passer `t` dans la pose (marche, gestes animés).
Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'bateau'` `'culotte'` `'ciseaux'` `'tampon'` `'etiquette'` `'libre'` ; `tenuO` / `tenuBO` = options de l'objet (les mêmes que l'objet seul) + `k` (échelle de l'objet dans la main ; culotte 0,8 par défaut). `'libre'` = objet du plan : `tenuO: { draw: (o) => {…}, grip: [x,y], p2: [x,y] }` (dessin dans le repère de l'objet, la main se pose sur `grip`).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `ang.objet` = angle écran voulu (rad).
- `deuxMains` (true ou 0..1) : la main arrière va d'elle-même sur la seconde prise (bateau : poupe ; culotte : bord gauche de la ceinture ; libre : `p2`). Le bateau à deux mains : `tenuO: { deux: true }`.
- `handF` / `handB` : `'fist'` `'open'` `'paume'` (paume en l'air) `'bas'` (main plate vers le sol) ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'half'|'closed'|'wide' }`.
- `cible: [X, Y]` (écran) pour `presente`, `range`, `tendre` et le bateau tenu : la main avant y va.
- Point nommé de l'objet tenu : `PB.pt(r, 'nom')` (main avant) / `PB.pt(r, 'nom', true)` (main arrière) → `[x, y]` écran (liste plus bas).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `PB.etienne` (`C.pbEtienne`) | 0,9 ≈ 461 px (haut des cheveux), ≈ 70 px de large (torse) | `cheveux`, `moustache` | `marche` ; `ciseaux` (+ `coupe` 0 ouverts → 1 fermés ; met `tenu:'ciseaux'`, lames horizontales vers l'avant à hauteur de taille) ; `presente` (+ `cible`, défaut devant la poitrine ; avec `tenu` : objet droit face au public, sinon paume ouverte) ; `idee` (main ouverte levée devant le front, sourcils levés, menton levé, bouche « o ») ; `perplexe` (main AVANT par-dessus la tête, qui gratte l'arrière du crâne avec `t`) ; `etire` (deux mains tiennent la ceinture de la culotte aux deux bords ; **`etire: 0` = tenue à deux mains sans tirer**, 1 = ceinture étirée ×1,4 ; met `tenu:'culotte'`) ; `tampon` (tampon en main, main arrière à plat sur la table) + `frappe` 0 levé → 1 posé (≈ 94 unités plus bas) ; `souffle` (penché, mains sur la table, joues gonflées, bouffées d'air devant la bouche avec `t`) ; `reverence` (main sur le cœur, buste incliné, tête baissée) ; `range` (+ `cible` : buste penché, deux mains ouvertes devant, écart 70 unités ; le carton du plan 4 : `tenu:'libre'` + `deuxMains`) |
| `PB.germaine` (`C.pbGermaine`) | 0,85 ≈ 461 px (chignon), 110 px en bas de jupe | `cheveux`, `ruban` ; **pas de jambes** (la robe touche le sol) | `tenu:'bateau'` (tenu par la coque devant la poitrine, voile en haut ; `cible` possible) ; `berce` (bateau à deux mains, balancé comme sur des vagues avec `t`, tête penchée, yeux mi-clos, sourire ; met `tenu`) ; `tendre` (+ `cible`, défaut devant à hauteur de ventre d'enfant : main tendue paume en l'air ; garde l'objet tenu s'il y en a un) ; `nonTete` (la tête oscille avec `t`, sourire) ; `chante` (bouche qui s'ouvre et se ferme en rythme, tête qui se balance, yeux mi-clos : muet) ; `marche` (bas de robe qui ondule) |
| `PB.garcon` (`C.pbGarcon`) | 0,58 ≈ 288 px | `cheveux` ; genoux articulés `legF_lo` `legB_lo` | `tenue` : `'calecon'` (défaut, caleçon long gris chiné, trois boutons d'os) \| `'coupe'` (coupé au-dessus du genou, effiloché) \| `'culotte'` (coton blanc, ceinture froncée) \| `'aujourdhui'` (culotte + t-shirt marinière) ; `coiffure:'moderne'` (plan 6 : frange courte, sans épi) ; `gratte` (penché, la main gratte la cuisse avant avec `t`, grimace) ; `court` (avec `t` : course bondissante, genoux pliés, bras en balancier) ; `effroi` (deux mains ouvertes devant la bouche, yeux ronds, recul) ; `joie` (bras en V, menton levé, bouche ouverte, sautillement avec `t`) ; `regardeBas` ; `assis` (par terre, genoux levés : garder `y` = sol) ; `marche` ; `tenu:'bateau'` (devant le ventre, jamais devant le visage ; à `assis` : sur les genoux) |
| `PB.fille` (`C.pbFille`) | 0,52 ≈ 251 px (+ couettes) | `cheveux`, `couette` + `noeud`, `couetteB` + `noeudB` | mêmes `tenue` (`'calecon'`, `'culotte'`) ; `gratte` (sur un pied, genou avant levé, gratte sa CHEVILLE, sautille avec `t`) ; `court` ; `joie` ; `effroi` ; `marche` ; `regardeBas` ; `assis` |

`bendSign` de `M.ik` (vérifié page 8 : cible devant, main avant et main arrière, dir 1 et −1 ; 0 ligne ATTENTION) :
| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Étienne, Germaine, garçon, fille | 1 | 1 | 1 | 1 |
Exemple : `const r0 = PB.etienne(pose…)` (ou `PB.etiennePose(pose)` sans dessiner) puis `M.ik(C.pbEtienne, r0.q, x, FEET, 0.9, dir, 'armF', [X, Y], 1)`. Enveloppes sans dessin : `PB.etiennePose`, `PB.germainePose`, `PB.garconPose`, `PB.fillePose`. Les gestes plient déjà le coude vers l'avant.

Pièges :
- Un geste remplace les `ang.armX_*` donnés. Ordre d'application : Étienne `souffle reverence range ciseaux etire tampon presente idee perplexe` ; enfants `marche court assis (bateau) gratte effroi joie regardeBas`.
- `etire` : en profil, la main arrière proche de la poitrine met le coude ARRIÈRE un peu derrière le dos (seule solution « coude vers l'avant ») : vu de loin c'est lisible, ne pas agrandir ce geste au-delà de s 1,25. La culotte étirée fait ≈ 150 px de large (s 0,9).
- `idee` et `perplexe` passent l'avant-bras devant le front : ne pas les combiner avec une réplique où le visage doit se lire.
- Germaine : `ang.legF/legB` sans effet (pas de jambes) ; la tige est à la hanche.
- Enfants : l'objet tenu est à l'échelle 1 dans la main (bateau ≈ 87 px à 0,58) ; `tenuO.k` pour l'agrandir (alors le tenir plus bas : `cible`).
- `assis` (enfants) descend le corps de 192 unités : garder les mêmes `x, y` (pieds au sol), tige plus courte.

## Animal (def.libre : dessin hors convention bras/jambes, dispense justifiée : animal)
| Fonction | `(x,y)` = | Taille | Options |
|---|---|---|---|
| `PB.chat(pose,x,y,s,o)` (`C.pbChat`) | sol sous le corps (tige sous le ventre ; `o.rod:false` s'il est posé sur le tas) | s 1 : debout ≈ 150 × 110 px (queue comprise), assis ≈ 135 px de haut, couché ≈ 105 × 50 | (debout par défaut) ; `assis` ; `oreilles` 0..1 (assis, pattes avant sur les oreilles, yeux plissés) ; `dort` (en boule, respire avec `t`) ; `queue` (balancement de la queue en point d'interrogation avec `t`) ; `t` |
Points : `PB.chatPt(r, 'tete'|'nez')` → écran.

## Accessoires (sans tige : ils volent) — même dessin que tenus en main
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre`, `o.t`. Point nommé d'un accessoire seul : `PB.accPt(r, 'nom')` (r = valeur renvoyée).

| Fonction | `(x,y)` = | Taille à s 1 | Options ; points nommés (`PB.pt` tenu / `PB.accPt` seul) |
|---|---|---|---|
| `PB.bateau(x,y,s,o)` | bas de la quille | 166 × 152 px (coque rouge, liseré ivoire, mât, grand-voile + foc ivoire, fanion) | `tangue` (true ou 0..1 : roulis et pilonnement avec `t`) ; `jambes` 0..1 (deux petites jambes de bois à rivets sortent sous la coque et gigotent avec `t`) ; `couche` 0..1 (bascule vers l'étrave jusqu'à 1 rad, la coque reste posée) ; points `coque` (= prise, milieu de la coque) `mat` (sommet) `voile` `quille` `etrave` |
| `PB.culotte(x,y,s,o)` | bas des jambes | 172 × 120 px (×1,4 en largeur à `etire` 1) | `etiquette` 0..1 (l'étiquette au dessin de bateau rouge dépasse au-dessus de la ceinture, grossie jusqu'à ×1,4 à 1 ≈ 62 × 45 px) ; `etire` 0..1 ; `molle` 0..1 (retombe, plus étroite) ; `couleur` (hex) ; `rayures` (hex : marinière) ; points `ceinture` (= prise, haut-milieu) `etiquette` `centre` `fond` |
| `PB.etiquette(x,y,s,o)` | centre | 44 × 32 px (s 1,4 ≈ 62 × 45) | `rot` ; point `centre` ; aucune lettre (dessin de bateau rouge, petites vagues) |
| `PB.tasEtiquettes(x,y,s,o)` | milieu de la base, au sol | `niveau` 1 : 300 px de haut, base 425 px | `niveau` 0..1 (le cône monte et s'élargit, étiquettes de biais) ; `t` (trois étiquettes glissent sur la pente) ; point `sommet` (`PB.accPt(r,'sommet')` : le chat s'y pose, `rod:false`) |
| `PB.ciseaux(x,y,s,o)` | pivot | 216 × 60 px (anneaux à −62, pointe à +126) | `coupe` 0 ouverts → 1 fermés ; points `pointe` `pivot` `anneaux` (= prise) |
| `PB.tampon(x,y,s,o)` | semelle | 44 × 60 px | point `empreinte` (sous la semelle) ; prise = col |

**Étendoir** `PB.etendoir(t, o)` (dessiner après le décor, avant les marionnettes ; il descend des cintres) : fil tendu entre deux poulies pendues à des cordes, 3 culottes blanches à pinces de bois (≈ 107 px chacune) aux x 350, 540, 730 qui se balancent (temps global). `o` : `descente` 0..1 (défaut 1 = en place ; 0 = hors champ ; 0,75→1 rebond), `y` (fil, défaut 700), `x0` 260, `x1` 820, `modernes` (plan 6 : 5 culottes blanc, bleu ciel, rose poudré, vert d'eau, marinière), `s` (0,62). Renvoie `{ y, culottes: [[x, y], …] }` (points d'attache).

## Décor `PB.maison` — salle commune et atelier du bonnetier, Troyes, vers 1913
Ordre : `PB.maison(t, o)` → `M.drawFloor()` → `PB.maisonSol(t, o)` → (`PB.etendoir`) → marionnettes → lumière, rideau, cadre. `t` = temps LOCAL : les ambiances passent seules en temps global.
| option | valeurs | effet |
|---|---|---|
| `ciel` | `'apresmidi'` `'soir'` (défaut) `'nuit'` `'hiver'` `'printemps'` `'jour1920'` | rue derrière la vitre (façades à colombages en encorbellement, tour de la cathédrale) + teinte de toute la pièce ; nuit : lune, fenêtres allumées ; hiver : neige qui tombe et toits blancs ; printemps : branche de lilas, oiseau qui passe toutes les 9 s ; jours : rayon de soleil poussiéreux |
| `ciel2`, `fondu` | nom de ciel, 0..1 | fondu continu de `ciel` vers `ciel2` (ex. P1 `ciel:'apresmidi', ciel2:'soir', fondu: smooth(…)`) |
| `lampe` | 0..1 (0) | lampe à pétrole suspendue allumée (flamme + lueur chaude sur la pièce) ; P2 : `smooth(0.5, 0.8, t)` |
| `vacille` | 0..1 | la flamme vacille et baisse (P6 : `smooth(1.0, 1.6, t)`) |
| `annees20` | bool | second métier sur l'établi, seconde étagère de bobines (y 756), rangée de 6 cartons de culottes au pied du mur sous la fenêtre |
| `bateau`, `bateauO` | bool, options | le bateau-jouet flotte dans la bassine (s 0,6, `tangue`) |
| `bobine` | 0..1 ou `null` | une bobine rouge roule sur l'établi (0–0,45), tombe (→0,6), roule au sol vers la gauche (P1 : `smooth(5.4, 6.4, t)`) |
| `volets` | 0..1 | le voisin d'en face ferme ses volets (P3) |
| `moineau` | 0..1 ou `null` | un moineau arrive (0–0,4) et se pose sur l'appui, picore (P4, printemps) |
| `manivelle` | 0..1 | un tour de plus de la manivelle du métier (P5) ; sinon elle fait un tour lent toutes les 14 s |
| `ciseauxMur` | bool (true) | les grands ciseaux pendus au clou ; `false` quand Étienne les tient |
Toujours en mouvement : voilages, balancier de la pendule, fumée de la marmite, lueur du foyer, passants derrière la vitre, manivelle, (flamme), (neige / oiseau / poussière selon le ciel).
`PB.maisonSol(t, o)` (mêmes `ciel`, `ciel2`, `fondu`, `lampe`) : panier à linge d'osier (x 96–250, y 1366–1462), tabouret avec pelote (x 858–946), bobines tombées (262, 1458) (800, 1462), coulisses de cretonne fleurie (x 112–142 et 940–970).

Repères `PB.MAISON` (écran) : fenêtre `fen` x 440–640, y 330–640 (**centre (540, 485)**), appui y 640 (x 414–666, géranium à 606) ; lampe : pied de la flamme `lampe` (330, 398), chaîne x 330 depuis y 130 ; pendule `pendule` (690, 296) → bas y 476 ; calendrier (792, 470) ; clou des ciseaux `ciseaux` (700, 496) ; volets d'en face (594, 556) ; étagères y 600 (gauche x 120–356 : pots, cruches, casseroles de cuivre ; droite x 736–946 : bobines, pelotes) ; cuisinière x 124–252, dessus y 1172, marmite (190, 1110) ; **bassine** : surface de l'eau (324, 1256), bord x 252–396, tabouret jusqu'au plancher ; mannequin (798, 900–1180) ; **établi** x 722–934, dessus y 1180 ; métier circulaire (886, 1090), pivot de manivelle (856, 1106) ; cartons (années 20) x 430–650 sur y 1395.
**Zone dégagée** : x 400–720 entre y 700 et 1395 (seulement le plâtre et les colombages) ; la bassine (x 252–396) et l'établi (x ≥ 722) restent bas (sous y 1180–1240), derrière les personnages.

## Exemples d'appels qui marchent (voir `casting/scene.js`, pages 2–9)
```js
PB.maison(t, { ciel: 'soir', lampe: 1, bateau: true }); M.drawFloor(); PB.maisonSol(t, { ciel: 'soir', lampe: 1 }); PB.etendoir(t, { descente: smooth(2, 3, t) });
PB.germaine({ t, chante: 1, tenu: 'bateau' }, 300, FEET, 0.85, { dir: 1, cast });
const r = PB.etienne({ t, presente: 1, tenu: 'culotte', tenuO: { etiquette: 1 } }, 680, FEET, 0.9, { dir: -1, cast }); const e = PB.pt(r, 'etiquette');
PB.etienne({ t, ciseaux: 1, coupe: smooth(3, 3.4, t) }, 520, FEET, 0.9, { dir: 1, cast });          // avec PB.maison(…, { ciseauxMur: false })
PB.garcon({ t, assis: 1, tenu: 'bateau', tenue: 'culotte' }, 480, FEET, 0.58, { dir: -1, cast });
PB.chat({ t, assis: true, queue: 1 }, 820, ST.slotB - 30, 0.9, { dir: -1, slot: ST.slotB, cast });
```
Vignette / contexte mis à l'échelle (`ctx.scale`) : passer `cast: null` (l'ombre portée utilise des coordonnées écran).
