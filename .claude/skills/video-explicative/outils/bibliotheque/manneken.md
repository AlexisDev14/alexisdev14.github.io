# persos.md — « Manneken-Pis, mille costumes » : mode d'emploi de `persos.js`

Espace de noms : `M.man` (alias à poser dans scene.js : `const MAN = M.man;`). Dans `S.init` : `MAN.init()` (pré-rendus : `MAN.K.rue`, `MAN.K.musee`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Exemples testés : `casting/scene.js` (`grep -n 'MAN\.\|hab(' casting/scene.js`).

## Marionnette (avec tige ; slot `ST.slotF` par défaut, passer `slot: ST.slotB` au fond)
`MAN.habilleur(pose, x, y, s, o)` : passe toujours par l'enveloppe (gestes, objet tenu, parapluie au bras). Renvoie `r` (`r.w('pièce', x, y)` = point écran).
Def : `M.chars.manHabilleur` (`handLen` 100). Pièces : `armB_up armB_lo objetB legB_up legB_lo legF_up legF_lo pluie head cheveux torso armF_up armF_lo ruban objet doigts doigtsB`.
**Jambes à genou** : pas de `legF`/`legB` ; utiliser `legF_up`/`legB_up` (cuisse, négatif = vers l'avant) et `legF_lo`/`legB_lo` (mollet, POSITIF = plie le genou). Ou l'option `marche`.

| Fonction | Échelle, taille | Look | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `MAN.habilleur` | 0,9 ≈ 470 px (cheveux compris) | veste prune à boutons laiton, nœud papillon jaune, cheveux gris en brosse, grosses lunettes rondes écaille, mètre ruban au cou, brassard de laine vert | `marche` (phase en **cycles**, ex. `t*1.3` : jambes + sautillement + bras) ; `genou` (s'agenouille : genou arrière au sol, pied avant devant ; corps abaissé de 114 local) ; `tendre` (bras avant tendu à l'horizontale, objet droit) ; `mesure` (mètre ruban tendu entre les deux poings devant la poitrine) ; `boutonne` (deux poings sur la poitrine, tête baissée) ; `hausse` (haussement : avant-bras levés, mains ouvertes, sourcils levés, bouche `tight`) ; `leve` (poing avant devant le menton : avec `tenu:'parapluie'`, la toile ouverte couvre sa tête) ; `pluie` : `'bras'` (**défaut**) \| `'non'` |

Options communes :
- `tenu` / `tenuB` : `'habit'` \| `'parapluie'` \| `'cadeau'` \| `'rien'` ; `tenuO` / `tenuBO` = options de l'objet seul (`{habit:'noel'}`, `{ouvert:0..1}`, `{couleur:1}`).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = suit l'avant-bras ; `ang.objet` le tourne.
- `handF` / `handB` : `'fist'` \| `'open'` ; `face` : `{ brow, mouth, eyes }` ; `t`.
- Point nommé de l'objet tenu : `MAN.pt(r, 'nom')` (ajouter `true` en 3e argument pour la main arrière) → `[x,y]` écran. habit : `crochet`, `bas` ; parapluie : `pointe`, `bordG`, `bordD`, `poignee` ; cadeau : `noeud`.

**Parapluie accroché au bras** (`pluie:'bras'`, défaut tant qu'il n'est pas tenu) : fermé, pendu par sa crosse à l'avant-bras ARRIÈRE, toujours vertical. Si l'on ne donne ni `ang.armB_*` ni geste à deux mains, l'avant-bras arrière se met à l'horizontale (`armB_up −0,2`, `armB_lo −1,3`) pour le porter. À genou, il s'appuie au sol en biais. Dès que `tenu:'parapluie'` (ou `tenuB`), celui du bras disparaît : **c'est le même parapluie**, enchaîner sur la même image.
Ouvrir : `tenu:'parapluie', tenuO:{ouvert: smooth(t0, t0+0.6, t)}, leve: 1` (la main garde la poignée ; toile ouverte ≈ 306 px de large à 0,9, bord ≈ 85 px au-dessus du crâne).

### `bendSign` de `M.ik` (vérifié : cibles qui tournent devant la poitrine, 11 images, aucune ligne « ATTENTION coude »)
| `M.ik(C.manHabilleur, …)` | `dir` 1 | `dir` −1 |
|---|---|---|
| bras avant `armF` | 1 | 1 |
| bras arrière `armB` | 1 | 1 |
Passer `pluie:'non'` (ou des `ang.armB_*`) si l'on pilote le bras arrière soi-même. Les gestes ci-dessus calculent déjà leurs angles (inutile d'appeler `M.ik` pour eux). Main arrière derrière le torse : elle est cachée par la veste sauf pendant `mesure`/`boutonne` (doigts redessinés devant).
Gestes ↔ réglages : s'agenouille `genou:1` ; tend un habit `tendre:1, tenu:'habit', tenuO:{habit}` (se combine avec `genou`) ; mesure `mesure:1` ; boutonne `boutonne:1` ; ouvre/tient le parapluie levé `tenu:'parapluie', tenuO:{ouvert}, leve:1`.

Pièges : les poses de `hausse` et `tendre` s'ajoutent aux `ang` donnés (mélange `lerp`) ; `genou` abaisse le corps (`dy` +114) : garder le même `y` de pieds. `tilt` pivote autour des pieds.

## Statue (sans tige) : `MAN.manneken(x, y, s, o)`
`(x,y)` = **bas de la vasque** (au sol) ; échelle conseillée **1** : statue + socle + vasque ≈ **330 px** de haut, vasque 284 px de large ; la statue seule ≈ 152 px. Devant la niche de la rue : `MAN.manneken(MAN.RUE.fontaine.x, MAN.RUE.fontaine.y, 1, {…})`.
Figure de bronze lisse vert-de-gris/ocre, profil, poing avant sur la hanche (coude en arrière), tête levée. Socle de pierre grise + vasque basse ; **le jet part d'un petit bec de bronze sur le devant du socle** et retombe en arc dans la vasque.
Options : `habit` `'bronze'` (défaut) \| `'dracula'` (cape noire doublée de rouge, col haut, petites dents blanches) \| `'noel'` (bonnet à pompon, barbe blanche, manteau rouge bordé de blanc, ceinture noire) \| `'sax'` (béret + saxophone doré tenu devant lui) \| `'smoking'` (queue-de-pie, plastron, nœud papillon, haut-de-forme) ; `jet` 0..1 (défaut 1 ; 0 = aucune eau ; petit = filet qui tombe presque droit) ; `humeur` `'malin'` (défaut : œil plissé rieur, sourire) \| `'calme'` (œil point, bouche neutre) \| `'accepte'` (yeux mi-clos, sourire doux) \| `'dort'` (yeux fermés) ; `tete` (rad ajouté, négatif = lève plus) ; `t` **obligatoire** (gouttes, éclaboussures, ronds dans l'eau) ; `dir` ±1 ; `rot` ; `alpha` ; `cast` ; `ombre`.
Points : `r.pt('bec' | 'chute' | 'tete' | 'sommet' | 'pieds' | 'centre')` → écran (`centre` = milieu du corps de la statue, pour le « poof » ; `sommet` = haut du crâne ; `chute` = point où le jet touche l'eau ; `pieds` = dessus du socle).
Changement d'habit : la valeur change d'un coup ; masquer l'instant sous la fumée du plan (`r.pt('centre')`, rayon ≈ 110 px).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `MAN.cadeau(x,y,s,o)` (s 1) | milieu du bas | 132 × 150 px (nœud compris) | `couleur` 0 bleu ardoise \| 1 ocre \| 2 vert éteint (ruban crème) |
| `MAN.parapluie(x,y,s,o)` (s 0,9) | bas de la poignée | fermé ≈ 295 px de haut ; ouvert 306 px de large | `ouvert` 0..1 (s'ouvre en continu) |
| `MAN.habit(x,y,s,o)` (s 0,9) | haut du crochet du cintre | ≈ 120 × 180 px | `habit` : l'un de `MAN.HABITS` ; `swing` (rad, balancement) |
| `MAN.portant(x,y,s,o)` (s 1) | sol, milieu | rail à 390 px ; largeur ≈ `MAN.portantLargeur(o)` + 80 (≥ 500 px ; 12 cintres ≈ 720 px) | `n` cintres 0..40 (fractionnaire : le dernier pousse en pop ; le rail s'allonge : 90 + 46·n, min 420) ; `long` (largeur fixe du rail, local) ; `habits` (liste de clés, défaut `MAN.HABITS`) ; `balance` 0..1 (cintres qui oscillent, avec `t`) |

`MAN.HABITS` (ordre du portant) : `dracula` (noir/rouge), `noel` (rouge), `sax` (or), `smoking` (noir/plastron blanc), `cowboy` (ocre, franges), `marin` (bleu rayé blanc), `chasseur` (vert), `brique` (orange), `rose`, `turquoise`, `violet`, `ivoire`. Couleurs : `MAN.HABIT_COL[clé].c`.
Pièges : le portant à 0,9 n'a plus que 370 px de haut (fiche : ≥ 380) → garder s 1. Les cintres se recentrent quand `n` grandit (pas d'ancrage fixe) : pour un remplissage sans glissement, fixer `long`.

## Décors (pré-rendus par `MAN.init()`)
| Clé | Pose | Repères utiles |
|---|---|---|
| `MAN.K.rue` | `ctx.drawImage(MAN.K.rue, 0, 0)` (toile de fond plein écran, jusqu'à `ST.back`) | maisons de brique et d'enduit à pignons à gradins, enseignes sans lettre (chope, botte), lanterne (x 940, y 916), pavés y 1290–1395 ; niche de pierre de la fontaine : `MAN.RUE.niche = {x:730, y:1395}` (arc jusqu'à y ≈ 950) ; statue : `MAN.RUE.fontaine = {x:730, y:ST.slotB−6}` |
| `MAN.K.musee` | `M.flat(MAN.K.musee, 540, ST.back, {cast:{dx:16,dy:6,a:0.35}})` ; machinerie : `y = ST.back − (1−p)·1250` (descente des cintres) | 760 × 1180 local, pignon à gradins en haut ; devanture vert éteint ; vitrine `MAN.MUSEE.vitrine` (x −320..320, y −480..−60 autour de l'origine) : 6 étagères de 12 mini-costumes de couleurs variées ; enseigne-médaillon (petit habit rouge) à droite, x +410, y −460 |

## Exemples d'appels qui marchent
```js
// rue : statue qui fait jaillir son jet, habilleur qui arrive, parapluie au bras
ctx.drawImage(MAN.K.rue, 0, 0); M.drawFloor();
const st = MAN.manneken(MAN.RUE.fontaine.x, MAN.RUE.fontaine.y, 1, { t, habit: 'noel', jet: 1, humeur: 'accepte', cast });
MAN.habilleur({ t, marche: t * 1.2 }, 470, FEET, 0.9, { dir: 1, cast });
// à genou, il tend l'habit de Dracula vers la statue
const r = MAN.habilleur({ t, genou: 1, tendre: 1, tenu: 'habit', tenuO: { habit: 'dracula' } }, 500, FEET, 0.9, { dir: 1, cast });
// il ouvre le parapluie et le tient au-dessus de sa tête ; portant qui se remplit
MAN.habilleur({ t, tenu: 'parapluie', tenuO: { ouvert: smooth(4, 4.6, t) }, leve: 1 }, 260, FEET, 0.9, { dir: 1, cast });
MAN.portant(560, ST.slotB - 6, 1, { n: lerp(4, 12, smooth(2, 3, t)), t, balance: 1, cast });
```
