# persos.md — « Le tandem, un mot d'esprit attelé » : mode d'emploi de `persos.js`

Espace de noms : `M.tan` (dans `scene.js` : `const TAN = M.tan;`). Dans `S.init` : `TAN.init()` (pré-rendu : `TAN.K.route`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour le reste. Tailles en px **à l'écran**, mesurées sur la planche (`casting/scene.js`). `FEET = ST.slotF - 34`, `FEETB = ST.slotB - 30`.
Aucun texte, chiffre ni logo. Tout est fonction pure de `pose.t` : **toujours passer `t`** (allures, queue, souffle, ruban, sonnette).
Angles (`pose.ang`) : `armF_up` 0 pendant, −1,57 horizontal devant, −2,5 au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé.

## Marionnettes (passer `slot`, `dir`, `cast`)
Toujours par l'enveloppe `TAN.nom(pose, x, y, s, o)` : elle prépare la pose (gestes, IK, objets) et renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce) + des points nommés.

| Fonction | Échelle, taille | Repère `(x,y)`, tige | Options (0..1 sauf mention) |
|---|---|---|---|
| `TAN.cheval(pose,x,y,s,{qui})` | 0,72 : **333 px** de long (queue → museau), 311 px aux oreilles | sabots, milieu du corps ; tige → `ST.slotB` par défaut | `o.qui` `'A'` (bai, crinière noire, défaut) / `'B'` (gris pommelé, crinière claire) ; `allure` `'pas'` (défaut) / `'trot'` / `'arret'` ; `ph` (phase en tours, prioritaire sur `t`) ; `cadence` (Hz : pas 0,9, trot 1,45) ; `hoche` (×, défaut 1 : dodelinement) ; `tete` / `cou` (rad ajoutés, négatif = relève) ; `queue` (remue, défaut 0,3) ; `queueLeve` ; `renifle` (cou baissé, museau tendu, naseau qui palpite + souffle) |
| `TAN.cabriolet(pose,x,y,s,o)` | 0,72 : **410 px** (dossier → bout des brancards), roues Ø 180 px | sol **sous l'essieu**, brancards vers +x·dir ; tige → `ST.slotB` | `roule` = distance parcourue en px **locaux** (`(x − x0)/s`) : roues qui tournent ; sinon `vitesse` (px locaux/s × `t`) ; `o.pass` `'tout'` (défaut) / `'loin'` / `'pres'` (pour glisser le cocher entre les deux) ; fouet posé dans son étui (fixe) |
| `TAN.cocher(pose,x,y,s,o)` | 0,72 × 0,68 = **0,49** dans l'attelage (sommet de la casquette à 355 px au-dessus du sol des roues) ; défaut seul 0,44 | **hanche sur le siège** (`r.siege` du cabriolet) ; **sans tige** (fixé à la voiture) | rênes en main par défaut (deux poings devant, `M.ik`) ; `tire` (mains ramenées à la poitrine) ; `leve` (mains levées : on secoue les rênes) ; `renes:false` (bras libres, `ang` à la main) ; `tete` (rad) ; `face` |
| `TAN.attelage(pose,x,y,s,o)` | 0,72 : **787 px** (roue arrière → museau de A) | sol sous l'essieu ; B à `x + dir·318·s`, A à `x + dir·712·s` | `t`, `allure`, `ph`, `cadence`, `roule`/`vitesse` (roues) ; options par pièce : `A:{…}`, `B:{…}` (celles de `cheval`), `cab:{…}`, `cocher:{…}` ; B a toujours le museau contre la queue de A |
| `TAN.tandem(pose,x,y,s,o)` | 0,75 : **533 px** de long, 406 px au sommet du chapeau | sol au milieu des roues ; une tige (cadre) → `ST.slotF` par défaut ; cyclistes sans tige | `roule` (px locaux, prioritaire) ou `vitesse` × `t` : roues, pédalier, chaîne, jambes ; `freine` (levier, patin, buste en avant) ; `sonnette` (ondes, exige `t`) ; `penche` / `pencheB` (−1..1, **+ = vers la droite de l'écran**, quel que soit `dir`) ; `regard` / `regardB` (−1..1, négatif = lève la tête) ; `etireB` (l'arrière se hisse, menton levé) ; `brasTendu` / `brasTenduB` (bras avant tendu, main ouverte) ; `chapeauB` (0→0,45 main au bord, 0,4→1 chapeau soulevé de 62 et incliné) ; `face` / `faceB` ; `avant:{…}` / `arriere:{…}` (pose brute de chaque cycliste, ex. `ang.head`) |
| `TAN.etudiant(pose,x,y,s,o)` | 0,9 : **463 px** (pieds → toque) | pieds ; tige → `ST.slotF` | `livre` `'avant'` (défaut, tenu par le dos, droit à l'écran) / `'arriere'` / `'rien'` ; `lever` (livre brandi au-dessus de la tête) ; `salut` (buste incliné, tête baissée, main au cœur) ; `montrer` (bras tendu ; main ouverte si la main avant est libre) ; `souffle` (yeux fermés, joues, bouche en o, souffle d'air) ; `fier` (buste bombé, menton levé) ; `malice` (défaut 1 : sourcil levé, œil mi-clos, sourire en coin ; 0 = neutre ; `face.mouth` la remplace) ; `droit:false` (le livre suit l'avant-bras) |

Points renvoyés :
- `cheval` : `r.mors` (anneau du mors), `r.museau`, `r.queue` (bas de la queue), `r.terret` (anneau sur la sellette), `r.anneau` (anneau du collier, départ des traits).
- `cabriolet` : `r.siege` (hanche du cocher), `r.brancard` (bout du brancard). `cocher` : `r.mainF`, `r.mainB` (poings).
- `attelage` : `{ A, B, cab, cocher, avant (museau de A), arriere }`. `tandem` : `{ avant, arriere, velo, guidon, sonnette, roueAV, roueAR, nez, queue }` (`nez`/`queue` = bouts avant/arrière du vélo, au sol).
- `etudiant` : `r.main` (poing avant : y poser le sablier avec `livre:'arriere'`), `r.mainB`, `r.livre` (centre du livre).

Pièces (pour `ang` / `hide`) — cheval : `corps cou crin collier tete queue legFN_up legFN_lo legFF_* legRN_* legRF_*` (N = devant l'écran, F = fond ; FN/FF = antérieurs, RN/RF = postérieurs). Cocher : `torso head casquette pan armF/B_up/_lo legF/B_up/_lo piedF/B`. Étudiant : `torso head toque gland legF legB armF/B_up/_lo mancheF/B livre livreB doigts doigtsB`. Cyclistes (`C.tanCycAv`, `C.tanCycAr`) : `torso head armF/B_* legF/B_* piedF/B` + `casquette` (avant) ou `chapeau jupe` (arrière).

### `bendSign` de `M.ik` (vérifié sur la planche : aucune ligne « ATTENTION coude à l'envers »)
Les enveloppes appellent déjà `M.ik` avec ces valeurs ; à reprendre tel quel si un plan pilote un bras lui-même.

| Personnage | bras avant, `dir` 1 | bras avant, `dir` −1 | bras arrière, `dir` 1 | bras arrière, `dir` −1 | gestes testés |
|---|---|---|---|---|---|
| étudiant | 1 | 1 | 1 (non testé : aucun geste) | 1 (non testé) | lever, salut, montrer |
| cocher | 1 | 1 | 1 | 1 | rênes base, tire, lève |
| cycliste avant | 1 | 1 | 1 | 1 | guidon, bras tendu |
| cycliste arrière | 1 | 1 | 1 | 1 | guidon, chapeau soulevé (`brasTenduB` non testé) |

Flexions épaule et coude de 0 à 2,4 rad dans les deux sens (planche, pages 7 et 9) : articulations rondes, rivet au centre, aucune cassure.

Pièges :
- Les chevaux sont petits devant les personnages (330 px exigés par la fiche) : ne pas mettre l'étudiant **à côté** d'eux à la même profondeur ; chevaux sur `ST.slotB`, étudiant sur `ST.slotF`.
- L'attelage fait 787 px : `dir:1` → `x` (essieu) entre 150 et 330 pour tout voir ; `dir:-1` → `x` entre 760 et 930 (l'attelage occupe `[x − 94, x + 697]` en `dir:1`, le miroir en `dir:-1`). Entrée « par la droite » = `dir:-1`, `x` qui décroît depuis ≈ 1900.
- Ne pas dessiner `cabriolet` et `cocher` séparément sans respecter l'ordre `pass:'loin'` → cocher → `pass:'pres'` (sinon le cocher passe derrière le dossier ou devant la caisse). `TAN.attelage` le fait.
- Les cyclistes et le cocher n'ont pas de tige : ne jamais les dessiner hors de leur véhicule (sauf planche).
- `penche`/`pencheB` sont en sens **écran** ; `regard` négatif = tête relevée. Gag du plan 6 : `pencheB` −1 puis +1 avec `etireB` 1 ; `chapeauB` de 0 à 1 sur ≥ 0,8 s.
- La jupe de la cycliste arrière couvre la cuisse et le genou : seules les bottines pédalent sous l'ourlet (voulu).
- `renifle`, `queue`, `sonnette`, `souffle` n'animent rien sans `t`.
- Étudiant qui monte de la fente : `clipAbove(ST.slotF, …)` et `pose.dy` (unités du personnage), comme pour toute marionnette.

## Accessoires
Aucun accessoire séparé : le livre est tenu par l'étudiant (`livre`), le fouet est posé sur le cabriolet. Sablier, mur à fente, étiquette-ruban : à dessiner dans les plans.

## Décors (pré-rendus par `TAN.init()`)
| Clé | Pose | Repères utiles |
|---|---|---|
| `TAN.K.route` | `M.ctx().drawImage(TAN.K.route, 0, 0)` (toile plein cadre 1080 × `ST.back+5`), puis `M.drawFloor()` | ciel pâle et nuages de papier (y 260–820) ; collines lointaines `TAN.ROUTE.lointY(x)` (≈ 920–1000) ; colline intermédiaire `TAN.ROUTE.collineY(x)` (≈ 1020–1100 : crête pour `M.passage`, arbres ronds) et petite route ocre en ruban 44 px plus bas ; colline proche y ≈ 1178 ; haie d'aubépine dessus y ≈ `TAN.ROUTE.haie` 1250 ; chemin ocre du devant dès `TAN.ROUTE.chemin` 1328 |
La toile est immobile : faire vivre l'extérieur avec `M.oiseaux` (ciel), `M.passage('mouton'|'vache', …)` sur `collineY`, `M.fleurs` au pied de la haie, ou les coulisses-arbres du kit.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'TAN\.' casting/scene.js`). Les plus utiles :
```js
// attelage qui entre par la droite au pas (plan 1), roues qui tournent avec la distance parcourue
const xa = M.lerp(1900, 900, M.ease((t - 7.28) / 2.2));
TAN.attelage({ t, allure: 'pas', roule: (1900 - xa) / 0.72, A: { queue: 0.3 } }, xa, FEETB, 0.72, { dir: -1, cast });
// plan 2 : sur place, B renifle et A remue la queue à « queue »
TAN.attelage({ t, allure: 'pas', vitesse: 120, B: { renifle: k }, A: { queue: k } }, 180, FEETB, 0.72, { dir: 1, cast });
// tandem qui roule, l'arrière se penche puis soulève son chapeau
TAN.tandem({ t, roule: (x - 140) / 0.75, pencheB: p, etireB: e, chapeauB: c, face: { mouth: 'smile' } }, x, FEET, 0.75, { dir: 1, cast });
// étudiant fier, livre fermé ; puis livre levé ; salut
TAN.etudiant({ t, fier: 1 }, 860, FEET, 0.9, { dir: -1, cast });
TAN.etudiant({ t, lever: k }, 860, FEET, 0.9, { dir: -1, cast });
```
