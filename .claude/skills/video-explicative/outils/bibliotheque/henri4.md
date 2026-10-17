# persos.md — « Paris vaut bien une messe, la phrase jamais dite » : mode d'emploi de `persos.js`

Espace de noms : `M.hq` (alias conseillé `const HQ = M.hq;`). Dans `S.init` : `HQ.init()` (pré-rendus `HQ.K.remparts`, `HQ.K.tente`, `HQ.K.abbatiale`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Aucun texte, lettre ni chiffre dans ces pièces. Tout dépend de `t` (passer `t` dans la pose ou `o.t`).

## Marionnettes (avec tige ; fente avant par défaut si y ≈ FEET, arrière si y ≈ FEETB ; `slot` reste réglable)
Toujours par l'enveloppe `HQ.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, gestes) et renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.pose` = pose finale).

Options communes (Henri, Sully) :
- `tenu` : objet dans la main avant (Henri : `'rien'|'couronne'|'chapelet'|'chapeau'` ; Sully : `'rien'|'bible'`) ; `tenuO` : options de l'objet.
- `droit` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` le tourne.
- `handF` / `handB` : `'fist'` (défaut) | `'open'` ; `face` : `{ brow 'n'|'up'|'frown'|'worry', mouth 'n'|'o'|'smile', eyes 'open'|'closed'|'wide'|'half' }`.
- Points nommés de l'objet tenu : `HQ.pt(r, nom)` → `[x, y]` écran — couronne `'sommet'|'centre'`, chapelet `'main'` (= le poing : le plan 4 y accroche son chapelet), chapeau `'panache'|'centre'`, bible `'centre'`. Poing : `r.w('armF_lo', 4, 96)`.
- Pas de marche : `ang.legF` / `ang.legB` (jambe entière, négatif = vers l'avant, en opposition) comme dans le kit.

| Fonction | Échelle, taille | Pièces | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `HQ.henri` (`C.hqHenri`) | 0,9 : sommet du crâne 454 px, panache 518 px ; 108 px de large (149 avec le panache) ; à genoux 421 px de haut, de x −115 (orteils arrière) à x +153 (pied avant) | `torso cape armB_up armB_lo legB_up legB_lo footB legF_up legF_lo footF head fraise barbe hat armF_up armF_lo objet doigts` | `oteChapeau` : 0→0,35 la main monte au bord avant du chapeau (menton un peu levé) ; à 0,35 le chapeau passe dans la main ; 0,35→1 trajet par étapes : au-dessus de la tête, en avant, puis bas devant le ventre (tenu par le bord, jamais devant le visage). Le faire redescendre de 1 à 0 = remettre le chapeau. `tenu:'chapeau'` = chapeau déjà en main (comme `oteChapeau:1`). `brandir` : avec le chapeau en main, bras tendu en avant-haut, chapeau dressé au-dessus du poing (calotte en avant), il ondule avec `t` ; sans chapeau en main, poing levé. `frapper` (engagement) + `coup` 0..1 (0 = poing ramené à l'épaule, 1 = bras tendu à hauteur de poitrine, poing 160 px devant `x`, y ≈ `y − 340`) ; sans `coup`, frappe automatique ≈ 2,2 coups/s selon `t`. `genou` : s'agenouille sans saut (jambe avant genou levé, pied à plat ; genou arrière posé sur le plancher, orteils au sol) ; les pieds s'écartent pendant la descente. `reverence` : buste plié (0,55 rad), tête baissée, bras arrière tendu derrière ; avec le chapeau en main il est tenu bas devant, sinon main avant sur la poitrine. `epaules` : haussement (avant-bras en avant, mains ouvertes basses, épaules qui montent, sourcil levé). `sourcil` : un sourcil levé haut + regard en coin (`regard` vaut alors −0,8 si absent). `regard` −1 (coin arrière) … 1 (devant) ; `regardY` −1 (en haut) … 1 (en bas). `rabat` : panache rabattu (claquement de la porte). `ang.hat` incline le chapeau sur la tête ; `ang.cape` (balancement déjà animé par `t`). |
| `HQ.sully` (`C.hqSully`) | 0,92 : 483 px (crâne) ; 86 px de large ; Bible tenue ≈ 125 px de haut | `bibleB armB_up armB_lo legB legF head torso col barbe armF_up armF_lo objet doigts` | `tenuB:'bible'` : Bible noire sous le bras arrière (bras arrière réglé d'office). `chuchote` : penché en avant (0,2 rad), main avant ouverte près de la bouche, côté du regard. `tendre` : bras avant tendu (avec `tenu:'bible'` : Bible présentée droite). `surpris` : main ouverte sur la poitrine, bouche « o », sourcils levés, yeux ronds. `serreBible` : Bible serrée contre la poitrine, menton levé (met `tenu:'bible'` si `tenu` absent ; la prise glisse du dos au bord du livre). `hoche` : amplitude du hochement ferme, animé par `t` (≈ 1,8 par s). |

Pièges :
- `genou` > 0 recalcule les jambes (IK) : il remplace `ang.legF/legB` ; finir la marche avant de s'agenouiller. Les deux pieds bougent (avant +105 px, arrière −85 px à 0,9) : placer Henri en conséquence.
- `oteChapeau` entre 0 et 0,35 : l'avant-bras monte devant le front (normal pour saisir le bord) ; ne pas s'y arrêter longtemps.
- Chapeau en main (`oteChapeau` ≥ 0,35) : `tenu` est forcé à `'chapeau'` ; ne pas demander en même temps `tenu:'couronne'`.
- `M.ik` sur Henri/Sully : calculer sur la pose déjà préparée (`HQ.henriPose(pose)` / `HQ.sullyPose(pose)`) si la pose contient `reverence`, `chuchote` ou `genou` (ils changent `tilt/dx/dy`), puis passer les angles dans `ang`.
- Sully : ne pas cumuler `tenuB:'bible'` et `tenu:'bible'` (deux Bibles). Passage du bras à la main : basculer `tenuB` → `tenu` quand la main avant passe devant la hanche.
- Henri et Sully ne se ressemblent pas : chapeau à panache blanc, barbe pointue grise, fraise, ivoire / crâne chauve, barbe carrée brune, col plat blanc, noir.

### Ligueurs (bustes derrière les créneaux, sans tige)
`HQ.ligueur(k, pose, x, y, s, o)` — `k` `'a'` (moine : robe brun tabac, capuche rabattue, tonsure, visage rond) | `'b'` (bourgeois : toque noire plate, petite fraise, manteau rouge sang) | `'c'` (femme : coiffe blanche en pointe, corsage vert éteint). `(x, y)` = point du **rebord du créneau** à l'écran : le buste est découpé sous cette ligne. Échelle 0,8 : 152 px visibles au-dessus du rebord (a), 160 px (b, c) ; 75 px de large. Pièces : `torso head armF_up armF_lo` + `capuche` (a) | `fraise toque` (b) | `coiffe` (c).
Options : `non` 0..1 (secoue la tête selon `t`, phase propre à chacun ; `phase: 0` pour les trois = en chœur parfaitement synchronisé) ; `outre` 0..1 ou `true` (sourcils froncés, bouche « o », yeux ronds) ; `baisse` 0..1 (1 = entièrement caché derrière le créneau) ; `bras` 0..1 (un seul bras visible : avant-bras posé sur le rebord, main ouverte) ; `face`, `ang.head`, `dir`, `cast`.
Placement sur les remparts : `HQ.ligueur('a', {t, outre:1}, HQ.REMP.creneaux[1], HQ.REMP.creneauY, 0.8, {dir:1, cast})` ; créneaux utiles x 180, 500, 660 (écart ≥ 160 px) ; x 20 et 980 sont hors zone d'action.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `HQ.girouette(x,y,s,o)` | pied de la tige (sur le faîte) | 1 : 210 px de haut, flèche 200 px (coq ≈ 100 × 85) ; 0,9 : 189 px | `sens` −1..1 (le coq et la flèche s'écrasent autour de la tige ; 1 = bec à droite, 0 = de chant, −1 = bec à gauche) ; `tremble` 0..1 (hésitation, exige `t`) ; `bloque` 0..1 = avancement de l'effet (secousse qui s'amortit + nuage de poussière ; rien à 0 et à 1 : animer 0→1 en ≈ 0,6 s) ; croisillon à quatre boules sans lettre. Renvoie `r` avec `r.bec` (point écran du bec). |
| `HQ.couronne(x,y,s,o)` | milieu du bas du cercle | 1 : 132 × 138 px | fermée, or vieilli, fleurs de lys, pierres rouges. Même dessin que `tenu:'couronne'` (main sous le cercle). |
| `HQ.porte(x,y,s,o)` | milieu du seuil | 1 : 280 × 560 px (plein cintre) | `ouvre` 0..1 (vantaux tournés vers l'intérieur, 1 ≈ 80°, assombris) ; `judas` 0..1 (volet du judas du vantail droit, à ≈ 400 px du seuil ; visible seulement vantaux presque fermés, `ouvre` < 0,2) ; `yeux` (deux yeux dans le judas ouvert) ; `t`. Claquement : animer `ouvre` → 0 puis `M.wob` sur `ouvre` (petit rebond). |
| `HQ.portail(x,y,s,o)` | milieu du seuil | 1 : 180 × 410 px (arc brisé) | `ouvre` 0..1 (vantaux vers l'intérieur + lueur dorée dans l'ouverture et sur le parvis). |

## Décors (pré-rendus par `HQ.init()`) — à poser à l'échelle 1 ; constantes en coordonnées écran
| Clé | Pose | Repères utiles |
|---|---|---|
| `HQ.K.remparts` | `M.flat(HQ.K.remparts, 540, ST.back)` (x −40..1120, haut à y 395) puis `HQ.porte(HQ.REMP.porte.x, HQ.REMP.porte.y, 1, {ouvre})` et `HQ.girouette(HQ.REMP.girouette.x, HQ.REMP.girouette.y, 1, {sens, t})` | `HQ.REMP.creneauY` 760 (rebord des créneaux, où se posent les ligueurs) ; `merlonY` 690 (haut des merlons) ; `creneaux` [20, 180, 500, 660, 980] (centres des embrasures, 92 px de large) ; `porte` {x 580, y 1395, s 1, w 280, h 560} (ouverture x 440–720, haut à y 835 : Henri à 0,9 passe dessous) ; `tours` x [330, 830] (rayon 88, toits en poivrière de y 640 à 500) ; `girouette` {x 830, y 500} (faîte de la tour droite : coq entre y ≈ 286 et 370, juste sous le lambrequin) ; `notreDame` {x 580, y 482} (deux tours pâles x 470–690 derrière la porte). Les toits de Paris (`M.makeParisRow` pâli) et Notre-Dame sont **déjà dans** le pré-rendu : ne pas reposer `M.makeParisRow`. Passage sombre dessiné derrière les vantaux. |
| `HQ.K.tente` | `M.flat(HQ.K.tente, x, ST.back, {cast:{dx:16,dy:6,a:0.35}})` ; montée de trappe : `y = ST.back + (1-p)*500 + wob…`, `clipY: ST.back+1` | corps 360 px (x ±180), haubans jusqu'à ±204, toit jusqu'à 422 px, fanion bleu à 494 px au-dessus du sol ; entrée relevée x ±64 jusqu'à 206 px. Garder x ≤ 210 pour rester à x < 330 (hors d'Henri). |
| `HQ.K.abbatiale` | `M.flat(HQ.K.abbatiale, 540, ST.back)` puis `HQ.portail(HQ.ABB.portail.x, HQ.ABB.portail.y, 1, {ouvre})` et `HQ.girouette(HQ.ABB.girouette.x, HQ.ABB.girouette.y, 0.9, {sens, t})` | façade gothique `HQ.ABB.facade` x 160–920 (760 px), parvis dallé y 1330–1395 (`parvisY`) ; `portail` {x 540, y 1330, w 180, h 410} (ouverture x 450–630, haut à y 920 ; intérieur sombre doré) ; portails latéraux fermés x 280 et 800 ; `rosace` {x 540, y 800, r 72} (verres colorés, réseau rayonnant) ; tour gauche x 175–385 jusqu'à y 600, flèche jusqu'à y 476 ; `girouette` {x 280, y 476} (à 0,9 : coq entre y ≈ 283 et 360, juste sous le lambrequin). Le moine (`reblochon.js`, 0,85) se pose à `FEETB` dans le portail (sa tête ≈ y 935). |

## `bendSign` de `M.ik` (vérifié sur la planche, aucune ligne « ATTENTION coude à l'envers »)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Henri (`C.hqHenri`) | 1 | 1 | 1 | 1 |
| Sully (`C.hqSully`) | 1 | 1 | 1 | 1 |
| Ligueurs a/b/c (`C.hqLigueurA/B/C`, buste : `y` de `M.ik` = rebord + `HQ.LIG_SILL·s`) | 1 | 1 | — (pas de bras arrière) | — |
Les gestes internes (chapeau, frapper, chuchote, surpris, serreBible, révérence) placent déjà le coude vers l'avant / le bas ; balayages épaule et coude de 0 à −2,4 rad testés dans les deux directions. `handLen` = 100 pour tous.

## Exemples d'appels qui marchent
Voir `<video>/casting/scene.js` (`grep -n 'HQ\.' casting/scene.js`). Les trois appels les plus utiles :
```js
// Henri ôte son chapeau (plan 1, 5,07 s) puis le remet (7,6 s) ; Henri à genoux devant le portail (plan 5)
HQ.henri({ t, oteChapeau: M.smooth(5.0, 5.9, t) - M.smooth(7.6, 8.4, t), sourcil: M.smooth(8.4, 8.8, t), regardY: -0.8 }, 330, FEET, 0.9, { dir: 1, cast });
HQ.henri({ t, genou: M.smooth(3.6, 4.6, t), oteChapeau: M.smooth(3.4, 3.9, t), ang: { head: 0.25 } }, 380, FEET, 0.9, { dir: 1, cast });
// Sully chuchote, Bible sous le bras ; ligueurs qui secouent la tête en chœur
HQ.sully({ t, tenuB: 'bible', chuchote: M.smooth(1.1, 1.4, t) }, 780, FEET, 0.92, { dir: -1, cast });
HQ.ligueur('b', { t, outre: 1, non: 1, phase: 0 }, HQ.REMP.creneaux[2], HQ.REMP.creneauY, 0.8, { dir: -1, cast });
```
