# persos.md — « Le Toblerone, des danseuses plutôt que le Cervin » : mode d'emploi de `persos.js`

Espace de noms : `M.tob` (dans `scene.js` : `const TOB = M.tob;`). Dans `S.init` : `TOB.init()` (pré-rendus `TOB.K.fabrique`, `table`, `cabaret`, `eiffel`).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran**, mesurées sur la planche de casting.
Aucun texte, chiffre ni logo nulle part (la barre n'a pas d'emballage ; fanion = croix blanche seule).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe : elle prépare la pose (objet tenu, seconde main, gestes). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce ; `r.pose` = pose finale).
Pièces : `armB_up armB_lo objetB legB legF head … torso … objetD armF_up armF_lo objet doigts doigtsB` (Tobler : + `toque` enfant de `head`, `tablier` ; danseuses : + `plume`, `cheveux`).

Options communes :
- `tenu` / `tenuB` : `'rien'` | `'barre'` | `'document'` ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul, voir plus bas).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` le tourne.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise de la barre (`p2`).
- `handF` / `handB` : `'fist'` | `'open'` (mis à `'fist'` d'office quand la main tient un objet) ; `face` : `{ brow, mouth, eyes }` ; `t`.
- `marche` : phase en radians (ex. `t * 5`) → jambes, bras et petit sautillement d'un pas ; le plan fait glisser `x` lui-même.
- La barre tenue est dessinée **devant** la main (doigts couleur chair par-dessus) ; le document est dessiné **derrière** la main (pièce `objetD`).
- Point nommé de l'objet tenu : `TOB.pt(r, 'nom')` (main arrière : `TOB.pt(r, 'nom', true)`) → `[x, y]` écran.
  barre : `'centre'`, `'sommet'` (pointe du milieu), `'gauche'`, `'droite'` (bouts), `'cassure'` (pointe n° 5, celle de `coupe`) ; document : `'centre'`, `'sceau'`.

| Fonction | Échelle, taille | Options de geste (0..1 sauf mention) |
|---|---|---|
| `TOB.tobler(pose,x,y,s,o)` (`C.tobTobler`) | 0,9 : **554 px avec la toque**, 454 px sans ; barre tenue 301 px de long | `brandir` (barre tenue devant soi, bras tendu à hauteur de poitrine, jamais au-dessus de la tête) ; `perplexe` (poing à la moustache, sourcils inquiets) ; `fier` (poing AVANT sur la hanche, coude en arrière, buste bombé, menton levé) ; `fierB` (même chose avec le poing ARRIÈRE : la main avant reste libre pour la barre) ; `tendre` (bras avant tendu, pour donner le document) ; `hausser` (avant-bras ouverts à la taille, tête penchée, sourcils levés, bouche serrée) ; `designer` (bras bas, main ouverte vers l'avant, paume vers le haut) ; `salut` (0→0,5 : le poing va prendre la toque ; 0,5→1 : il la soulève de 26 et l'incline vers l'avant ; la tête s'incline et sourit) |
| `TOB.danseuse(i,pose,x,y,s,o)` (`C.tobDanseuse1…6`), i = 1..6 | 0,53 : **262 px** sans plume, 339 px avec ; barre portée 279 px | `bras` (bras en V : avant levé devant, arrière levé derrière, poings fermés vers le ciel) ; `jambe` (lève la jambe avant, genou tendu, buste un peu en arrière) ; `clin` (> 0,5 : œil fermé, sourire, joue rosie) ; `porte` (tient la barre devant elle à deux mains, à la taille : met d'office `tenu:'barre'`, `tenuO {k:1,7, prise:'centre'}`, `deuxMains`). Bouche souriante par défaut ; la plume ondule avec `t`. |

Série des danseuses (couleur entière de robe / plume / cheveux) : 1 rouge sang / blanche / brun ; 2 vert éteint / ocre / roux ; 3 bleu nuit / rose / blond ;
4 ocre / bleu ciel / noir ; 5 violet prune / ivoire / châtain ; 6 rose ancien / vert d'eau / blond foncé. Couleurs dans `TOB.DANSEUSES[i-1]`.

### `bendSign` de `M.ik` (vérifié sur la planche, aucune ligne « ATTENTION coude »)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Tobler (`C.tobTobler`) | 1 | 1 | 1 | 1 |
| Danseuses (`C.tobDanseuseN`) | 1 | 1 | 1 | 1 |
`M.ik` calcule dans le repère du personnage : le miroir `dir −1` ne change pas le signe. `bendSign −1` plierait le coude à l'envers : ne jamais l'utiliser.
Cible du bras **arrière** : devant ou sous l'épaule (taille, hanche, objet devant). Une cible derrière l'épaule à sa hauteur déclenche « ATTENTION coude » (essayé).
Les gestes des enveloppes (`perplexe`, `fier`, `salut`, `deuxMains`) ont leur propre IK interne, coude toujours plié vers l'avant : préférer l'option à un `M.ik` maison.

Pièges :
- `fier` et `perplexe` prennent le bras AVANT : si Tobler tient la barre, utiliser `fierB`, ou passer la barre en `tenuB` pour `perplexe`.
- `salut` : ne rien tenir dans la main avant (`tenu:'rien'`). La toque suit le poing, puis se repose seule quand `salut` revient à 0 (aucun saut si l'on revient en continu).
- `brandir` (s 0,9) : la main est à ≈ 170 px devant l'épaule et le bout de la barre à ≈ 380 px devant Tobler : garder x ≤ 620 en `dir 1` (x ≥ 460 en `dir −1`), sinon la barre sort du cadre.
- La danseuse qui `porte` a la barre décalée vers l'avant : au sommet de la pyramide, la placer à `x − 50·(s/0,53)` (dir 1) pour centrer la barre sur l'axe.
- Danseuses en hauteur (gradins) : `slot: y + 8` (la tige entre dans la marche) ; au plancher : `slot: ST.slotF`.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Renvoient `r` (`r.w('o', x, y)` = point écran d'un point local × s).

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `TOB.barre(x,y,s,o)` | milieu du dessous | s 1,4 : 434 px entre les bouts (462 avec les biseaux) × 76 px de haut ; 7 pointes | `coupe` 0..1 (la pointe n° 5 se détache, s'envole et s'efface vers 1 ; nougat ivoire, éclats d'amande, filet de miel qui s'allonge après 0,3) ; `eclat` 0..1 (lueur qui balaie de gauche à droite ; rien à 0 et à 1) ; `k` (facteur de taille, 1 seule ; 1,08 en main de Tobler, 1,7 pour la danseuse) ; `prise` `'bout'` (défaut) / `'centre'` (en main) |
| `TOB.document(x,y,s,o)` | bas du document | s 0,9 : 63 × 90 px | `sceau` (true : cachet rouge sans signe) |

## Le Cervin en carton — `TOB.cervin(t, x, yBase, s, o)`
`(x, yBase)` = milieu de la base posée (bord de carton droit). s 1 : **563 px de haut, 556 de large** (x −276…280) ; s 0,85 : 478 px. Fanion : + 92 px de hampe.
Dessin (19/10, d'après photo) : corne asymétrique, sommet en crochet qui penche à gauche (pointe en surplomb), ressaut à gauche vers y −444, arête du Hörnli du sommet au bas (x 72), face gauche éclairée gris-bleu, face droite à l'ombre, vires et névés en diagonale, couloirs de neige, épaulement rocheux plus bas derrière à droite (pic x 204, y −234), glacier blanc bas à gauche, socle de rochers sombres. Visage discret posé de part et d'autre de l'arête (qui fait le nez).
Options : `descente` 0..1 (0 = caché dans les cintres, base à y 130 ; 1 = posé ; 0→0,65 chute freinée, 0,65→1 rebond amorti : sur 1 s → rebond ≈ 0,35 s ; remonter = faire décroître `descente`) ;
`humeur` −1 ravi (yeux plissés de joie, petite bouche ouverte, joues roses) … 0 neutre … 1 vexé (paupières de roche mi-closes, sourcils de rocher froncés, moue) ; `regard` −1 gauche … 1 droite ;
`gonfle` 0..1 (agrandi 1,06, le crochet du sommet se redresse) ; `drapeau` 0..1 (fanion suisse planté au sommet, la hampe pousse) ; `affaisse` 0..1 (pic incliné de 0,08 rad vers la droite, crochet plus penché, fanion qui pend) ;
`fils` (true : deux fils verticaux jusqu'en haut de l'écran) ; `balance` (1 : léger balancement avec `t`) ; `cast`. Clignement bref automatique toutes les ≈ 3,2 s.
Constantes locales (× s, origine = milieu de la base) : `TOB.CERVIN = { sommet: [-116,-563], yeux: [[-38,-300],[30,-300]], bouche: [2,-236], fils: [[-100,-300],[100,-300]] }` (yeux petits : blanc 28 × 24 à s 1) ; `TOB.cervinDescente(u)` = position 0..1.
Le dessiner avant `M.drawFrame` (le lambrequin cache le haut des fils et le Cervin remonté).

## La pyramide en gradins — `TOB.gradins(x, y, s, o)`
`(x,y)` = milieu du bas. s 1 : 640 px de large, 462 px de haut (+16 de dessus). Deux blocs rouge sang à moulure dorée et frise de losanges.
`TOB.GRADINS = { y: [0, -232, -462], x: [-200, 0, 200, -105, 105, 0], places, largeur: 640, hauteur: 462 }` (× s) : places 0-2 au plancher, 3-4 sur la 1re marche, 5 au sommet.
`TOB.place(k, x, y, s)` → `[x, y]` écran des pieds de la danseuse k. Recette éprouvée (planche, page 8) : gradins `(540, ST.back + 4, 1)` ; danseuses 0,53 ; places 0-2 aux pieds `FEET` (`slot: ST.slotF`) ; 3-5 aux y donnés (`slot: y + 8`) ; ordre de dessin 5, 3, 4 puis 0, 1, 2 ; danseuse 5 `porte:1`, les autres `bras:1`.

## Décors (pré-rendus par `TOB.init()`)
| Clé | Pose | Repères utiles |
|---|---|---|
| `TOB.K.fabrique` | `M.ctx().drawImage(TOB.K.fabrique, 0, 0)` (toile W × ST.back+5) | `TOB.FAB.fenetre {x0:330,x1:710,y0:330,y1:800}` (toits de Berne, tour à horloge sans chiffres) ; étagères y 600 et 760 (x 70–290) ; lambris dès y 1000 ; bassine de cuivre `TOB.FAB.bassine {x:830, y:1080}` ; vapeur : `TOB.vapeur(t)` juste après le décor |
| `TOB.K.table` | `M.flat(TOB.K.table, TOB.TABLE.cx, ST.back, {cast})` | `TOB.TABLE = {cx:540, top:1150, x0:280, x1:800}` ; barre posée : `TOB.barre(540, TOB.TABLE.top, 1.4)` |
| `TOB.K.cabaret` | `M.ctx().drawImage(TOB.K.cabaret, 0, 0)` | velours bordeaux sombre, arc de 23 lampes allumées (`TOB.CAB.arc {cx:540, cy:980, r:400}`), colonnes dorées x 150 et 930, tentures à glands |
| `TOB.K.eiffel` | `M.flat(TOB.K.eiffel, TOB.CAB.eiffel.x, TOB.CAB.eiffel.y, {alpha, cast})` | tour Eiffel en carton bronze, 440 px de haut (antenne comprise ; 3e étage à −370, 2e à −150…−164, 1er à −64…−90), 216 de large aux pieds (224 avec les socles de pierre) ; treillis en croisillons, rivets, grand arc, campanile ; canvas 300 × 452 ; `TOB.CAB.eiffel = {x:800, y:1060}` ; se dévoile à part (`alpha` ou `clipY`) |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'TOB\.' casting/scene.js`). Les plus utiles :
```js
const r = TOB.tobler({ t, brandir: 1, tenu: 'barre', tenuO: { eclat: k } }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
TOB.tobler({ t, salut: u }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });          // u 0→1 : prend la toque puis la soulève
TOB.tobler({ t, tendre: 1, tenu: 'document' }, 300, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
TOB.cervin(t, 330, ST.back - 10, 0.85, { descente: clamp((t - t0) / 1.0), humeur: -1, regard: 1, drapeau: 1, cast });
TOB.danseuse(6, { t, porte: 1 }, px - 50, py, 0.53, { dir: 1, slot: py + 8, cast });
```
