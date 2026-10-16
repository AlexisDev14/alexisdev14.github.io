# persos.md — « La boussole, un aimant qui pointe vers un pôle sud » : mode d'emploi de `persos.js`

Espace de noms : `M.bou`. Dans `scene.js`, écrire `const BOU = M.bou;` dans l'IIFE de `SCENE`. Dans `S.init` : `BOU.init()` (aucun pré-rendu : forme commune seulement).
Repères : `(x,y)` = pieds pour la marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.
Code couleur des pôles, sans lettre : « nord » = ROUGE brique `#a8362e`, « sud » = BLEU ardoise `#3f5f86` (`BOU.COUL.rouge / .bleu`).

## Marionnette (avec tige ; `slot: ST.slotF` par défaut)
Toujours par l'enveloppe `BOU.capitaine(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes par `M.ik`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce ; `r.tenu`, `r.tenuO`).
`o` = options de `M.puppet` (`dir`, `slot`, `cast`, `alpha`, `nom`…). Défaut `s` = 0,92.

| Fonction | Échelle, taille | Pièces | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `BOU.capitaine` (`C.bouCapitaine`) | 0,92 ≈ 490 px casquette comprise (0,9 ≈ 478) | `torso head moustache casquette armB_up armB_lo armF_up armF_lo legB legF objet doigts objetB doigtsB` | `boussole` (boussole tenue à deux mains devant la poitrine ; met `tenu:'boussole'` d'office) ; `boussoleH` (px locaux : monte la boussole tenue, ex. 40 pour la lever vers les yeux) ; `salut` (main ouverte au bord de la visière) ; `tendre` (main ouverte tendue ; `cible: [X,Y]` écran = direction visée, sinon devant à hauteur d'épaule) ; `hanche` (poing avant sur la hanche, coude en arrière) ; `hancheB` (poing arrière) ; `hoche` (hochements de tête au rythme de `t`) ; `marche` (marche sur place : jambes, rebond, bras libres qui balancent ; rythme `t`) |

Options communes de pose :
- `t` (obligatoire dès qu'il y a marche, hochement, tremblement de l'aiguille) ; `face: { brow, eyes, mouth }` (la bouche est sous la moustache) ; `handF` / `handB` `'fist'|'open'`.
- `tenu` / `tenuB` : `'rien'` | `'boussole'` | `'aimant'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul : `ang`, `tremble`, `arcs`, `etincelles`… ; `echelle` = taille dans la main, défaut 0,72 pour la boussole ≈ 158 px à s 0,92, 0,8 pour l'aimant, tenu à l'horizontale `ang: π/2`).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `ang.objet` le tourne.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (boussole seulement ; `boussole: 1` le fait déjà).
- Point nommé de l'objet tenu : `BOU.pt(r, nom)` → `[x, y]` écran. Boussole : `'pivot'`, `'nord'` (pointe rouge de l'aiguille), `'sud'` (pointe bleue), `'anneau'`. Aimant : `'bleu'`, `'rouge'`, `'milieu'`. `BOU.pt(r, nom, true)` pour la main arrière.
- Demi-tour : `o.dir = BOU.tourne(u)`, u de 0 (regarde à droite) à 1 (regarde à gauche) : la marionnette s'amincit puis se retourne (les gestes restent justes pendant le tour).
- Les angles `ang.*` donnés à la main s'ajoutent avant les gestes ; un geste à 1 remplace l'angle du bras qu'il utilise. Mélanger avec `M.smooth` pour entrer/sortir (le geste est déjà adouci par `ease`).

### `bendSign` de `M.ik` (vérifiés sur la planche : boussole, salut, tendre, hanche, hancheB, aucune ligne « ATTENTION coude »)
| Bras | `dir` 1 | `dir` −1 |
|---|---|---|
| avant (`armF`) | 1 | 1 |
| arrière (`armB`) | 1 | 1 |
Table dans `BOU.BEND`. Pour un geste maison : `const sol = M.ik(C.bouCapitaine, pose, x, FEET, 0.92, dir, 'armF', [X, Y], 1);` (la `pose` doit être celle déjà passée par `BOU.capitainePose(pose, x, y, s, dir)` si elle contient des gestes).

Pièges :
- Avec `boussole ≥ 0,5`, l'enveloppe passe à `C.bouCapitaine2` (avant-bras arrière dessiné DEVANT le torse pour rester entier) : petit changement de plan de l'avant-bras arrière à mi-geste ; faire monter `boussole` en ≈ 0,4 s.
- Ne pas cumuler `salut`/`tendre`/`hanche` (même bras avant) avec `boussole` : le dernier appliqué gagne (ordre : hanche, tendre, salut, boussole).
- Ne pas cumuler `hancheB` avec `boussole` (même bras arrière).
- Bras pliés à fond à la main (`armF_up −2,4` + `armF_lo −2,4`, main derrière la tête) : signalé « ATTENTION coude » ; passer par les gestes.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol ; vraie par défaut pour le globe seulement), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `BOU.boussole(x,y,s,o)` | centre du cadran | local : boîtier R 100, anneau jusqu'à −138 → 238 de haut. **Petite 0,7 ≈ 167 px** ; **grande 1,6 ≈ 381 px** | `ang` (rad, aiguille : 0 = pointe rouge en haut, + = horaire) ; `tremble` 0..1 (aiguille qui frémit, selon `t`) ; `arcs` 0..1 (lignes de champ en tirets animés autour, alignées sur l'aiguille) ; `etincelles` 0..1 (éclats dorés qui clignotent autour du boîtier) ; `t`. Cadran ivoire à 32 graduations sans chiffre, rose des vents en étoile sans lettre. |
| `BOU.aimant(x,y,s,o)` | milieu du barreau | 220 × 46 local : **0,7 ≈ 154 × 32 px** | `ang` (rad ; 0 = vertical BLEU en haut, ROUGE en bas ; π/2 = bleu à droite ; π = inversé) ; `halo` (lueur bleue/rouge à chaque bout, suit `ang`) ; `t` |
| `BOU.globe(x,y,s,o)` | dessous du pied (poser sur `ST.back + 10` ou `FEET`) | **1 ≈ 510 px** du pied à la pointe du barreau (sphère 400 px de diamètre, 470 avec le berceau) ; calotte levée : +120 | `ouvert` 0..1 (volet du ventre, charnière à gauche, 1 ≈ 112° : montre la cavité et le barreau rouge en bas / bleu en haut) ; `calotte` 0..1 (la calotte de glace se soulève comme un chapeau, +120 px et penchée : dévoile le trou du pôle et le bout du barreau) ; `aimant` (rad, rotation du barreau autour du centre : `Math.PI` = inversion, rouge en haut ; visible dans le volet et au pôle) ; `halo` `'blanc'`\|`'bleu'`\|`null` (lueur qui pulse derrière) ; `t` |

Points nommés (écran, sans `rot`) : `BOU.boussolePt(x,y,s,nom,o)` (`'pivot'|'nord'|'sud'|'anneau'`), `BOU.aimantPt(x,y,s,nom,o)` (`'bleu'|'rouge'|'milieu'`),
`BOU.globePt(x,y,s,nom,o)` (`'centre'|'pole'|'bleu'|'rouge'` (bouts du barreau selon `o.aimant`)`|'volet'|'calotte'|'pied'`). Constantes : `BOU.GLOBE = { R: 200, cy: −290, haut: −490, pointe: −510 }` (local), `BOU.BS` (boussole).

Pièges :
- Le globe fermé (`ouvert: 0`, `calotte: 0`) ne montre rien du barreau : la consigne B3 le veut ainsi jusqu'au mot « barreau ».
- `calotte` > 0 ouvre le trou du pôle même volet fermé : on voit seulement le bout du barreau (bleu ; rouge si `aimant ≈ π`).
- Pendant l'inversion (`aimant` entre 0 et π), le bout disparaît du pôle (il « rentre ») et le barreau tourne dans le volet.
- Globe à 1 : 450 px de large environ (berceau compris) ; le capitaine à côté va à x ≤ 330 si le globe est à x ≈ 720.

## Décors
Aucun dans `persos.js` (le pont du navire est dans `decors/pN.js`).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'BOU\.\|cap(' casting/scene.js`). Les trois appels les plus utiles :
```js
// capitaine qui consulte la boussole à deux mains, aiguille qui frémit
const r = BOU.capitaine({ t, boussole: 1, tenuO: { ang: 0.4, tremble: 0.3, t } }, 290, FEET, 0.92, { dir: 1, cast });
const nord = BOU.pt(r, 'nord');                                    // pointe rouge de l'aiguille, à l'écran
// salut puis main tendue vers le globe
BOU.capitaine({ t, salut: M.smooth(1, 1.4, t) * (1 - M.smooth(3, 3.4, t)), tendre: M.smooth(3.2, 3.6, t), cible: BOU.globePt(720, ST.back + 10, 1, 'centre') }, 300, FEET, 0.92, { dir: 1, cast });
// globe : volet qui s'ouvre, calotte qui se soulève, puis inversion du barreau
BOU.globe(720, ST.back + 10, 1, { t, ouvert: M.smooth(4.6, 5.2, t), calotte: M.smooth(6, 6.6, t), aimant: Math.PI * M.ease((t - 8) / 1), halo: t > 8 ? 'bleu' : null, cast });
```
