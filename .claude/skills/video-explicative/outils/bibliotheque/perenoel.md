# persos.md — « Le Père Noël, rouge bien avant Coca-Cola » : mode d'emploi de `persos.js`

Espace de noms : `M.pnl` (dans `scene.js` : `const PNL = M.pnl;`). Dans `S.init` : `PNL.init()` (pré-rendus `PNL.K` : atFond, atMilieu, poleNord, hach, atSol, atSolG, stFond, stMilieu, stSol, affiche).
Repères : `(x,y)` = pieds pour une marionnette, point `base` pour un objet. Tailles en px **à l'écran**, mesurées sur la planche `casting/` (images 0 à 9,97). Aucune lettre ni chiffre nulle part.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `PNL.nom(pose, x, y, s, o)` (gestes → angles, objet tenu, seconde main). Renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). `PNL.nom.pose(pose, x, y, s, dir)` = pose finale sans dessiner (pour `M.ik`).

Options communes :
- `t` (obligatoire : souffle, marche, va-et-vient des gestes) ; `marche` 0..1 ou `true` (+ `cadence`, pas/s) ; `respire:false` ; `expr` : `'neutre' 'jovial' 'ravi' 'surpris' 'triste' 'fache' 'fier' 'gene' 'juge'` ; `face : { brow, mouth, eyes }` l'emporte.
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'pinceau' 'pinceauFin' 'pot' 'palette' 'plume' 'feuille' 'brune' 'claire'` ou `'rien'` ; `tenuO` / `tenuBO` : options de l'objet (`echelle`, `prise`, `charge`, `couleur`, `dessin`…).
- `droit` / `droitB` : `true` d'office avec un objet (il reste droit à l'écran) ; `ang.objet` / `ang.objetB` le tournent (rad, sens horaire). `deuxMains` : main arrière sur la seconde prise (feuille).
- `cible` = point ÉCRAN visé par les gestes qui visent (`tient`, `peint`, `dessine`). Tout `ang.*` passé s'ajoute après les gestes.
- `PNL.pt(r, 'nom')` = point écran d'un point nommé de l'objet tenu (main arrière : `PNL.pt(r, 'nom', true)` ; `'prise'` = point tenu). Points : pinceau `poils` `virole` `bout` ; pinceauFin `pointe` `bout` ; pot `bord` `peinture` `anse` `fond` ; palette `centre` `rouge` `blanc` ; plume `bec` `barbe` ; feuille `centre` `haut` `bas` ; brune/claire `goulot` `centre` `fond`.

| Fonction | Échelle, taille | Pièces | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `PNL.pereNoel` (`C.pnlPereNoel`) | 0,9 : 'rouge' ≈ 476 px (pompon), 'gravure' ≈ 483 px ; 'lutin' : **s d'office 0,52** ≈ 287 px (ne pas passer 0,9) | `head` `cheveux` `barbe` `moustache` `bonnet` `bonnetBord` `pompon` (+ `hide.bonnet`) | `costume` `'rouge'` (défaut) \| `'gravure'` (manteau long beige-gris, col de fourrure brune, calotte d'étoffe bordée de fourrure, bottes brunes) \| `'lutin'` (fourrure brune de la tête aux pieds, capuche, barbe courte) ; `gris` 0..1 (gravure noir et blanc hachurée, vaut pour tout costume) ; `ventre` 0..1,2 (**taille** du ventre, défaut 0,8 ; lutin 1) ; `enfile` 0..1 (voir ci-dessous) ; gestes `salut` (main ouverte levée, avant-bras qui s'agite), `tapote` (**= le geste « ventre » de la fiche** : main ouverte qui tapote le ventre), `barbe` (main ouverte qui descend le long de la barbe), `regardeManche` (bras tendu devant, tête vers la manche, bouche ronde), `tient` (+ `cible` : bouteille brune d'office, tenue par le corps ; `tenu:'claire'`, `tenuO.prise:'goulot'`), `pose` (pose de modèle : avec un objet tenu il le brandit haut, l'autre main cachée sur la hanche ; sans objet, poing avant sur la hanche, coude en avant), `fier` (pouces à la ceinture, buste en arrière, menton levé), `marche` |
| `PNL.publicitaire` (`C.pnlPub`) | 0,9 ≈ 477 px ; jambes ×1,06 | `cheveux` (gominés, raie au milieu), `noeud` | **tient d'office** le gros pinceau (main avant, poils vers l'avant-bas au repos) et le pot rouge (main arrière, par l'anse) ; `peint` (+ `cible` = point écran où vont les POILS ; coup de pinceau vertical ±22 px avec `t`) ; `fier` (buste bombé, pinceau tendu vers l'avant-haut, pot à la taille) ; `salue` (révérence : buste plié, yeux fermés) ; `gene` (épaules rentrées, mains jointes ; **retire les objets** si `tenu` n'est pas donné) ; `pousse` (pied avant tendu qui pousse, regard en l'air, bouche ronde ; `PNL.piedPt(r)` = bout du pied) ; `marche` (pressé : cadence 1,6, penché) |
| `PNL.nast` (`C.pnlNast`) | 0,9 ≈ 474 px ; jambes ×1,04 | `cheveux` (bruns foncés, raie de côté, favoris), `moustache`, `imperiale` | **tient d'office** la plume (au repos penchée vers l'avant) ; `dessine` (+ `cible` = point écran du BEC ; petits traits, tête baissée, main arrière posée à plat à 46 px derrière) ; `montre` (feuille levée DE FACE devant la poitrine, tenue à deux mains par le bord haut ; `tenu` vaut alors `'feuille'` d'office ; `tenuO.dessin` 0..1, `tenuO.couleur` 0..1) ; `surpris` (recul, mains levées) ; `assis` (jambes pliées, siège à 113 px au-dessus des pieds à s 0,9 : le tabouret de l'atelier) — `assis` se combine avec `dessine` |
| `PNL.sundblom` (`C.pnlSundblom`) | 0,9 ≈ 466 px | `cheveux` (blond-roux plaqués), `lavalliere` | **tient d'office** le pinceau fin (main avant) et la palette (main arrière, par le trou du pouce) ; `peint` (+ `cible` = point écran de la POINTE ; bras tendu, petites touches) ; `recule` (un pas en arrière, tête penchée, pinceau à hauteur de poitrine, juge) ; `presente` (bras tendu vers l'avant, sourire) ; `marche` |

**Enfilage** (`PNL.pereNoel({ costume:'gravure', enfile })`, de `costume` vers 'rouge') : 0→0,25 la main avant présente le manteau rouge (objet interne `manteau`) ; 0,3 manche arrière rouge ; 0,28→0,78 le manteau se referme de l'arrière vers l'avant (le long manteau gris dépasse dessous) ; 0,55 manche avant rouge ; 0,66→0,94 les deux mains croisent le manteau sur la poitrine ; 0,9 jambes, bottes et silhouette 'rouge' ; 0,92 bonnet rouge à pompon (petit saut d'épaules). À `enfile` 1, l'image est celle de `costume:'rouge'` : passer ensuite à `costume:'rouge'` sans `enfile`. Planche : page 2, rangée du haut (0,15 / 0,45 / 0,75 / 1).

**`bendSign` de `M.ik`** (vérifié : `M.ik` direct sur le Père Noël bras avant et arrière, dir 1 et −1 ; sur le publicitaire bras avant dir 1 et −1 ; tous les gestes internes en 1 ; balayages épaule 0 → −2,4 / coude 0 → −2,4, bras arrière, brandit : zéro ligne ATTENTION) :

| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Père Noël (les trois costumes), publicitaire, Nast, Sundblom | 1 | 1 | 1 | 1 |
Cibles toujours DEVANT le personnage, à moins de ≈ 190 unités (171 px à s 0,9) de l'épaule. Exemple : `const q = PNL.nast.pose(p, x, FEET, 0.9, dir); const a = M.ik(C.pnlNast, q, x, FEET, 0.9, dir, 'armF', T, 1);` puis `PNL.nast(Object.assign({}, p, { ang: { armF_up: a.up, armF_lo: a.lo } }), …)`.

Pièges :
- `ventre` est la TAILLE du ventre ; le geste « tapote son ventre » s'appelle `tapote` (le nom `ventre` était pris). `PNL.ventrePt(r, dy)` = point écran devant le ventre ; `PNL.manchePt(r)` = milieu de l'avant-bras avant.
- Le lutin : ne pas passer `s` (0,52 d'office) ; si on le passe, c'est l'échelle réelle. La capuche cache les cheveux ; barbe courte.
- `gris` grise TOUT le Père Noël (peau comprise) et ajoute des hachures ; pour le passage gris → couleurs, animer `gris` 1 → 0 puis `enfile`.
- Un objet tenu se dessine DERRIÈRE l'avant-bras avant (doigts par-dessus) : un objet tenu droit à bout de bras pendant se cache derrière la manche ; c'est pourquoi pinceau, plume et pinceau fin sont penchés vers l'avant au repos (`ang.objet` pour corriger). L'objet de la main arrière est dessiné devant le torse.
- La feuille de Nast et la toile du chevalet ne sont jamais en miroir (contre-retournées en `dir −1`).
- Ne jamais réunir le Père Noël 'gravure' et le chanoine de `saintbernard.js` sans le dire : coiffe d'étoffe bordée de fourrure (≠ bonnet tout fourrure), barbe blanche longue, manteau beige. Nast reste de la famille d'Étienne Valton (`petitbateau.js`) : gilet brun, impériale, plume ; ne pas les mettre côte à côte.

## Accessoires (sans tige : ils volent)
Appel `PNL.nom(x, y, s, o)` ; options communes `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre`, `o.t`. Point écran : `PNL.accPt('nom', x, y, s, o, 'point')`.

| Fonction | `(x,y)` = | Taille à s 1 (unités = px) | Options |
|---|---|---|---|
| `PNL.pot` | fond | 88 × 133 (anse comprise) ; tenu à s 0,9 ≈ 120 px | `debord` 0..1 (coulures rouges, défaut 1) ; prise = sommet de l'anse |
| `PNL.pinceau` | bout du manche | 30 × 161 (tenu à 0,9 ≈ 145 px) | `charge` 0..1 (rouge sur les poils, défaut 1) ; prise = milieu du manche |
| `PNL.pinceauFin` | bout du manche | 8 × 152 | `couleur` (pointe, défaut rouge) |
| `PNL.palette` | bas | 140 × 92, vue de face | taches rouge, ivoire, ocre, bleu, vert, noir ; prise = bord au trou du pouce |
| `PNL.plume` | bec | 22 × 139 | plume d'oie blanche, bec d'acier noir |
| `PNL.feuille` | bas | 150 × 190, de face | `dessin` 0..1, `couleur` 0..1 (Père Noël en buste, gravure grise → couleurs) |
| `PNL.brune` / `PNL.claire` | fond | 50 × 156 (+ capsule : 166) ; tenue à 0,9 ≈ 149 px | `prise` `'corps'` (défaut) \| `'goulot'` ; brune : verre ambre cintré, capsule dorée, AUCUNE étiquette ; claire : verre vert pâle, étiquette blanche unie au petit rocher gris, capsule argent |
| `PNL.ephemeride` | centre du bloc | carton 192 × 262 (+ ficelle 36) ; bloc 132 × 142 | `t` ; `page` (motif du dessus, entier : 0 soleil, 1 flocon, 2 feuille, 3 cloche, puis recommence) ; `effeuille: { t0, sens, vitesse, n }` (à partir de `t0`, un feuillet part toutes les 1/`vitesse` s ; `sens` 1 = il tombe vers le bas en avant en tournoyant, `sens` −1 = il s'envole vers le haut, « à l'envers » ; `n` feuillets au plus ; vol 1,7 s) ; `tremble` 0..1 |
| `PNL.chevalet` | pied au sol (milieu) | 340 × 668 ; toile 300 × 380 (à 0,94 : 282 × 357 px) | `etat` 0..1 (0 toile vierge ; 0,1 esquisse ; 0,3–0,5 fond et manteau rouge ; 0,5–0,7 visage, barbe, fourrures ; 0,7–0,9 main et bouteille brune ; 1 fini) ; `vide` (sans toile) ; `bouteille` `'brune'` (défaut) \| `'claire'` \| `null`. `PNL.chevaletPt(x, y, s, o, 'centre'|'visage'|'manteau'|'bouteille'|'haut'|'bas')` = point écran (pour `cible`) |
| `PNL.tableauNoel(o)` | — | 300 × 380, origine au centre | dessin brut du tableau (`etat`, `couleur`, `bouteille`, `papier`) pour un plan qui fabrique ses propres cartes ou affiches |

## Décors (pré-rendus par `PNL.init()`)
Animations en temps global `M.tg` (sans saut à la coupe). Ordre : décor → `M.drawFloor()` → `…Sol` → marionnettes.

| Appel | Options | Repères utiles (`PNL.ATELIER` / `PNL.STUDIO`) |
|---|---|---|
| `PNL.atelierNast(t, o)` puis `M.drawFloor()` puis `PNL.atelierNastSol(t, o)` | `couleur` 0..1 (0 = camaïeu de gris, papier et hachures ; 1 = briques rouges, couleurs chaudes ; **même valeur pour les deux appels**) ; `poleNord` 0..1 (toile « pôle Nord » qui descend des cintres derrière la table, 1 = posée ; ajouter soi-même un `wob` d'arrivée si voulu) ; `page` 0..1 (p3 : la 5ᵉ page de la corde se décroche d'une pince et pendouille) ; `chat` 0..1 (p4 : le chat gris traverse l'étagère ; rien à 0 ou 1) | mur de briques, fenêtres x 110–390 et 690–970 (y 250–680, neige, rayon de lumière + poussière) ; corde à pages y 515 (+64 au milieu), 6 pages x 110…950 ; presse à bras x 40–260 ; pierre litho x 50–236 (dessus y 1252) ; **toile pôle Nord** centre x 600, 440 × 500, bas y 1100 ; étagère d'encres x 690–935, y 880 ; **table inclinée** x 640–862 (plateau de y 1172 à 1092), encrier et plumes à gauche ; **`ATELIER.feuille` = [700, 1150]** (cible de `dessine` pour Nast à x ≈ 560, `dir` 1, FEET : rendu page 8) ; lampe à pétrole (flamme 902, 1044) ; **tabouret x 560, siège y 1308** (Nast `assis` à x 560, FEET, s 0,9 : calcul, non rendu dans le décor) ; poêle x 990 (flamme, fumée) ; Sol : rame de papier x 14–190, seau x 900 |
| `PNL.studio(t, o)` puis `M.drawFloor()` puis `PNL.studioSol(t, o)` | `affiche` 0..1 (1 défaut : affiche du Père Noël à la bouteille claire accrochée ; vers 0 elle remonte aux cintres) ; `projecteur` 0..1 (défaut 1 allumé, faisceau vers l'estrade ; entre 0 et 1 il grésille ; 0 éteint) ; `toile` = options du chevalet (`{ etat, vide, bouteille }`) ou `false` pour ne pas le dessiner ; `ephemeride` = options de `PNL.ephemeride` (`t` fourni) ou `false` ; Sol : `goutte` 0..1 (une goutte rouge tombe d'un pinceau dans son pot, table de gauche) | verrière x 60–740, y 236–556 (neige, lumière d'hiver, poussière) ; guirlande de papier y ≈ 528–618 ; **affiche** centre x 520, y 596–936 ; **éphéméride** (840, 480) à s 0,92 ; poêle en fonte x 96 (flamme, fumée) ; **estrade** x 150–460, **dessus y 1316** (`STUDIO.estrade.top` : Père Noël debout dessus à x ≈ 330, `slot: ST.slotB`) ; fauteuil de velours vert x 214 ; caisse de bouteilles brunes x 424 ; **chevalet** x 650 (pied `ST.back + 2`, s 0,94 : `PNL.chevaletPt(650, ST.back + 2, 0.94, {}, 'manteau')`) ; projecteur sur trépied x 948 (tête y 806) ; toiles retournées x 856–1052 ; Sol : table de peintre x 20–236 (dessus y 1250), sapin en pot x 992 |
Vignettes de téléphone (255 × 453) : planche page 1 (atelier gris + pôle Nord, atelier en couleurs + chat, studio avec affiche, studio sans affiche) : habitées et lisibles.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'PNL\.\|FN\.' casting/scene.js`) :
```js
// atelier gris : Nast dessine à la table, le Père Noël « gravure » en gravure, la toile pôle Nord descendue
PNL.atelierNast(t, { couleur: 0, poleNord: 1, page: 0.7 }); M.drawFloor(); PNL.atelierNastSol(t, { couleur: 0 });
PNL.pereNoel({ t, costume: 'gravure', gris: 1 }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
PNL.nast({ t, dessine: 1, cible: PNL.ATELIER.feuille }, 560, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
// studio : le modèle sur l'estrade, Sundblom peint le manteau sur la toile
PNL.studio(t, { toile: { etat: 0.7 }, projecteur: 1, affiche: 1, ephemeride: { page: 2 } }); M.drawFloor(); PNL.studioSol(t, { goutte: 0.6 });
PNL.pereNoel({ t, pose: 1, tenu: 'brune' }, 330, PNL.STUDIO.estrade.top, 0.9, { dir: 1, slot: ST.slotB, cast });
PNL.sundblom({ t, peint: 1, cible: PNL.chevaletPt(PNL.STUDIO.chevalet, ST.back + 2, 0.94, {}, 'manteau') }, 850, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
// le publicitaire peint le manteau du Père Noël (même appel que « peint+cible » de la planche ; cible prise sur le Père Noël : non rendu tel quel)
const rP = PNL.pereNoel({ t, costume: 'rouge' }, 640, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
PNL.publicitaire({ t, peint: 1, cible: rP.w('torso', 40, -80) }, 400, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
```
