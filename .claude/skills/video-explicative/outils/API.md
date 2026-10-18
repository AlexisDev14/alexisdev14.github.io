# API du kit « Théâtre de marionnettes à tiges »

Référence EXACTE du kit (`kit/src/*.js`, assemblé en `kit/marionnettes.js`). À lire avec `CHARTE.md` (règles de mise en scène) et un exemple de `exemples/arc-de-triomphe/mN/`. Tout ce qui suit est vérifié sur le code ; en cas de doute, lire `kit/src/`.

## 0. Principe et fichiers d'un plan

Un plan = 4 fichiers dans `<video>/pN/` (+ `<video>/persos.js` et son mode d'emploi `persos.md`, et les décors partagés `<video>/decors/pN.js`, réunis pour tous les plans de la vidéo) :

| Fichier | Rôle |
|---|---|
| `timeline.js` | `TL.EVENTS` (instants nommés, nombres littéraux), `TL.MOTS` (fenêtres des mots-clés de la voix), `TL.SAUTS` (instants des sauts voulus, ignorés par `sauts.py`). Lu par `scene.js` ET `mixage.py`. |
| `scene.js` | `const SCENE = (() => { … S.init = …; S.draw = (t) => …; return S; })();` — seul identifiant global déclaré. |
| `persos.js` | personnages / accessoires propres à la vidéo (§7). Chargé après le kit, avant `decors.js` et `scene.js`. Les plans lisent `persos.md`, pas ce fichier. |
| `decors.js` | décors partagés entre plans (§4d), espace `M.dec`, réuni par `construire.sh` depuis `<video>/decors/*.js`. Chargé après `persos.js`, avant `scene.js`. |
| `CONSIGNE.md` | écrit par `construire.sh` : `FICHE.md` sans le script ni les consignes des autres plans. C'est la fiche que lit l'agent du plan. |
| `mixage.py` | bruitages (§9). |

Commandes : `bash construire.sh <video>/pN` (prépare, lit la durée du plan = sa voix (`duree.js` : `DUREE`, `DEBUT`, `IMAGES`), copie le kit, `bibliotheque/*.js`, la conduite `rideau.json`, `persos.js` et `decors.js`, écrit `CONSIGNE.md`, vérifie la syntaxe) ; `bash essai.sh <video>/pN 4.5,8.3` (`construire.sh` + images clés des secondes 0 à 9, 9,97 et des instants donnés + `planche_cles.png`, une ligne de sortie : la commande d'itération) ; `NODE_PATH=/opt/node22/lib/node_modules node render.cjs <video>/pN --name pN --out <video>/out --stills 60,200` (images fixes PNG + **`planche_cles.png`** : toutes les images clés sur une seule image, dans l'ordre demandé — la regarder d'abord, n'ouvrir en grand que les PNG utiles) ; `bash produire.sh <video>/pN` (rendu complet ≈ 1 min + son + `planche.png` + `verifier.sh`).

Les rendus passent **l'un après l'autre** grâce à un verrou dans `render.cjs` : si un autre rendu tourne, le suivant attend (« un autre rendu est en cours : attente… »). Ne jamais le contourner.

**Bibliothèque commune** (`outils/bibliotheque/`, index dans `bibliotheque/LISEZMOI.md`) : personnages, accessoires et décors **déjà validés** dans des vidéos précédentes, chargés dans chaque plan. Les réutiliser tels quels plutôt que de recréer (vache, paysan, moine, seigneur, chalet, montagnes, ustensiles…).

**Mécanique du rendu** (`modele.html`) : `M.init()` (textures, personnages, cadre, plancher), puis `SCENE.init()` une fois ; pour chaque image `SCENE.draw(t)` (t en secondes, 0 → 10, 300 images à 30 im/s) puis `M.finish(t)` automatiquement (vignettage chaud + grain : ne pas l'appeler). Le rendu est réparti sur 3 pages Chromium qui rendent chacune un bloc d'images consécutives : **`S.draw(t)` doit être une fonction pure de t** (aucun état accumulé d'une image à l'autre ; un cache calculé paresseusement depuis t est permis, voir `freeHat` dans m1). Tout est déterministe : **jamais `Math.random`**, utiliser `M.rng(seed)`.

**Pré-rendus** : tout décor/accessoire fixe se dessine UNE fois dans `S.init` (`M.pre`, `M.cutFlat`, `M.makeX`, `M.withShadow`) puis se pose par `M.flat` / `ctx.drawImage`. Ne jamais pré-rendre dans `S.draw`.

**Contexte** : `M.ctx()` donne le contexte 2D ; `M.use(ctx)` le fixe (fait par `modele.html`). Repère écran 1080 × 1920, origine en haut à gauche, y vers le bas.

### Ordre de dessin OBLIGATOIRE dans `S.draw`
toile de fond (`drawImage(K.sky,0,0)`) → oiseaux lointains (`M.oiseaux`) → décors suspendus (`M.hung`) / coulisses (`M.flat`) → animaux lointains sur leur crête (`M.passage`) → fermes basses → fleurs, papillons, marmotte → décors qui montent/descendent → **`M.drawFloor()`** → marionnettes (fente arrière, puis fente avant) → accessoires, effets (pétales, neige, poussière) → **`M.stageLight(t, …)`** → **`M.rideau(t)`** → **`M.drawFrame(t)`**. (Le plancher est dessiné après les décors : il masque leur pied ; les marionnettes passent devant le plancher.)

### Constantes `M.ST` (scène)
```
M.ST = { L:46, R:1034, top:150, back:1395, slotB:1410, slotF:1450, front:1640 }
```
- `L`/`R` : bords intérieurs de l'ouverture de scène (x). Les pans du rideau ouvert restent visibles sur ≈ x < 120 et x > 960 : tenir l'action dans x 130–950.
- `top` : haut de l'ouverture (le lambrequin de velours descend jusqu'à y ≈ 190–290).
- `back` : **bord arrière du plancher** = ligne de pose des décors (`M.flat(cv, x, ST.back)`) ; la « trappe » d'où montent les décors est juste sous cette ligne.
- `slotB` / `slotF` : **fentes arrière / avant** du plancher, par où descendent les tiges des marionnettes (y de l'entrée de la tige). Fente arrière = rang du fond, personnages plus petits (échelle 0.72–0.9) ; fente avant = rang principal (échelle ≈ 1).
- `front` : bord avant du plancher ; au-dessous : rampe de lampes (y ≈ 1674), coquille du souffleur (centre x 540), avant-scène en bois.
- Convention des pieds : `FEET = ST.slotF - 34` (1416) pour la fente avant, `FEETB = ST.slotB - 30` (1380) pour la fente arrière. Toujours passer `slot: ST.slotF` (ou `slotB`) à `M.puppet`.

**Zones TikTok** : l'action importante (visages, gags, objets clés) entièrement dans **x 60–930, y 150–1430** ; y > 1430 = plancher/rampe seulement (sous-titres) ; x > 930 = décor seulement (boutons) ; coin haut gauche (x < 220, y < 220) calme (logo). Aucun texte ni lettre dans l'image.

## 1. Maths et utilitaires (`M.*`)
`M.W`=1080, `M.H`=1920, `M.TAU`. `clamp(x,a=0,b=1)`, `lerp(a,b,t)`, `ease(t)` (cubique in-out, borne t à 0–1), `easeOut(t)`, `easeIn(t)` (bornés), `smooth(a,b,x)` (smoothstep de x entre a et b), `spring(t, zeta=0.45, omega=12)` (réponse de ressort : 0 pour t ≤ 0, dépasse 1 puis se stabilise ; t = temps écoulé depuis le début), `wob(t, t0, amp, f=2, k=4)` (sinus amorti : 0 avant t0, puis `amp·sin(2πf(t−t0))·e^{−k(t−t0)}` — le rebond standard), `hash(n)`, `noise(t, seed=0)` (bruit lisse −1..1), `rng(seed)` (générateur déterministe → fonction qui renvoie 0..1). `mixc('#rrggbb','#rrggbb',t)` → `'rgb(…)'`. `mkCanvas(w,h)`.

Palette `M.P` (sourde, « gravure ») : `nuit nuitL nuitD, vert vertL vertD, ocre ocreL, ivoire ivoireD ivoireL, sang sangL sangD, or orL orD, peau peauD joue, noir noirL, gris grisL grisD, bois boisL boisM, pierre pierreD pierreL, toile toileD, encre ('20,16,24' : sans #, pour rgba), edge (liseré de découpe), velours veloursL veloursD, cheveux chatain perruque`. Textures `M.tex.{paper, paperPat, canvas, canvasPat, grain, velvet, velvetPat}` (créées dans `M.init`, donc utilisables dans les `paint`/`S.init`, pas au chargement de `persos.js`).

## 2. Tracés « carton découpé » (dessinent sur le contexte courant)
- `M.path(pts, seed=0, jit=0.8, closed=true)` : construit le chemin (sans remplir). `pts = [[x,y],[x,y,1],…]` ; un 3e élément truthy = **angle vif** (sinon courbe lissée par quadratiques). Léger tremblé fixe selon `seed`/`jit`.
- `M.piece(pts, base, paint, {seed, edge, texA, drop})` : pièce de carton complète = ombre de découpe (`drop:false` pour la retirer), liseré sombre + blanc (`edge`), aplat `base`, `paint()` appelé **clippé dans la pièce**, texture de papier multiply (`texA` 0.7 par défaut).
- `M.fillPts(pts, col, seed=0, jit=0.5)`, `M.strokePts(pts, col, lw=1.2, closed=false, seed=0)` (lw en pixels écran), `M.dot(x,y,r,col)`, `M.rivet(x,y,r=3.4)` (attache parisienne en laiton).
- `M.hatch(reg, ang=0.8, sp=5, a=0.32, lw=1.05, col=M.P.encre, bbx)` : hachures de gravure dans le polygone `reg` (ou dans le clip courant si `reg` = null ; alors `bbx=[x0,y0,x1,y1]` donne l'étendue, défaut ±300).
- `M.shade(x0,y0,x1,y1, a=0.35, bb=[-400,-600,400,400], col='60,40,40')` : dégradé de volume multiply entre deux points, dans le rectangle `bb`.
- `M.bbox(pts)`. `M._sil()` (vrai pendant la passe « silhouette » de l'ombre portée), `M._lw()` (1/échelle courante).
- **Passe silhouette** : pour l'ombre `cast` d'une marionnette, `piece/fillPts/strokePts/dot/rivet/hatch/shade` deviennent des silhouettes noires ou ne font rien. **Tout dessin brut sur `M.ctx()` dans un `paint` ou un `extra` doit être gardé par `if (M._sil()) return;`.**
- Épaisseurs : à l'intérieur de `M.puppet` les traits restent constants à l'écran quelle que soit l'échelle. Pour un accessoire dessiné hors marionnette avec `ctx.scale(...)`, les liserés grossiraient : le pré-rendre à l'échelle 1 avec `M.cutFlat` puis le poser avec `M.flat(..., {scale})`.

## 3. Marionnettes

### `M.puppet(def, pose, x, y, s, o = {})` → `{ mats, root, w(part, px=0, py=0) }`
Dessine la marionnette de **profil** (elle regarde vers +x quand `dir:1`). `(x,y)` = point au sol sous les pieds, `s` = échelle (Napoléon à 1 ≈ 540 px avec le bicorne). `def` = `M.chars.<nom>`. Renvoie les matrices de chaque pièce et `w('armF_lo', 0, 96)` = position écran d'un point local (ex. le poing).

Options `o` :
- `dir` : 1 (regarde à droite) ou −1 (miroir, regarde à gauche). Les angles/`dx`/`tilt` suivent le miroir.
- `slot` : y d'entrée de la tige dans le plancher (défaut `y + 18·s`). **Passer `ST.slotF` / `ST.slotB`.**
- `cast: {a=0.28, blur=7, dx=20, dy=8}` : ombre portée floue sur le décor derrière (lumière de face haute). Valeur courante : `{dx:22, dy:10, a:0.3}`.
- `rod:false` : ne pas dessiner la tige principale (quand on la dessine soi-même, §8 chute). `rodLean` (0.07) : inclinaison de la tige.
- `handRod: ['armF_lo', px, py]` : second fil (tige fine noire) tenant la main au point local donné de la pièce ; `handRodAng` (0.04·dir) son inclinaison.
- `alpha` (0–1), `floorShadow:false` (supprime l'ombre ovale au sol sous la tige).
- Le contexte courant (`ctx.getTransform()`) est composé avec la marionnette : on peut donc faire `ctx.setTransform(R)` avant l'appel pour pivoter / déplacer tout le personnage (recette chute). Appeler sous `save/restore`.

### Structure d'une `pose` (tout est optionnel)
```js
{ tilt: 0,            // rad, penche tout le corps autour des PIEDS (>0 = vers l'avant, côté regard)
  dx: 0, dy: 0,       // décalage du corps en unités du personnage (multipliées par s) : dy>0 descend. Sautillement : dy = -|sin|·10
  ang: { head:-0.1, armF_up:0, … },  // rad AJOUTÉS à l'angle de repos de chaque pièce articulée (nom exact par personnage, §6)
  hide: { hat:1 },    // pièces masquées
  face: { brow:'n', mouth:'n', eyes:'open' },
  tuck: false,        // Napoléon : main dans le gilet (avant-bras replié, sans main)
  handF: 'open',      // main de l'avant-bras avant : 'open' | 'fist' (Napoléon, architecte)
  costume: 'gris',    // Napoléon : redingote grise (Sainte-Hélène) au lieu de l'habit vert
  … }                 // tout champ ajouté (ex. pose.t) est transmis aux pts/paint/extra des pièces : sert aux personnages propres (§7)
```
**Sens des angles** (rotation horaire à l'écran, dans le repère local du personnage tourné vers +x) : `armF_up` 0 = bras pendant ; **négatif = lève vers l'avant** (−1.57 = horizontal vers l'avant, −2.5 ≈ au-dessus de la tête) ; positif = vers l'arrière. `armF_lo` (avant-bras, relatif au bras) négatif = plie le coude vers l'avant/haut (Napoléon « main dans le gilet » : `armF_up:0.18, armF_lo:-1.85, tuck:true`). `head` négatif = menton levé (regard vers le haut), positif = tête baissée. `legF`/`legB` : balancer en opposition (`legF = s, legB = -s`) pour un pas. Pour la marche on glisse le long de la fente avec petits sauts (§8).

**Valeurs de `face`** : `brow` : `'n'` (défaut) `'up'` `'frown'` `'worry'` ; `mouth` : `'n'` `'o'` `'smile'` `'tight'` ; `eyes` : `'open'` (défaut) `'closed'` `'wide'` `'half'`.

### `M.ik(def, pose, x, y, s, dir, arm, target, bendSign=1)` → `{ up, lo }`
IK à deux segments : angles `ang[arm+'_up']`, `ang[arm+'_lo']` pour amener le point `[0, def.handLen]` de l'avant-bras (la main) sur la cible écran `target=[X,Y]`. `arm` = `'armF'` ou `'armB'`. Passer la `pose` courante (tilt/dx/dy comptent) et les mêmes `x,y,s,dir` que l'appel à `puppet`. `bendSign` ±1 choisit le côté du coude (essayer 1, sinon −1). La cible est ramenée à la portée du bras. Usage : `const sol = M.ik(C.napoleon, pose, nx, FEET, 1, -1, 'armF', [jx, jy], 1); pose.ang.armF_up = lerp(a0, sol.up, k); pose.ang.armF_lo = lerp(b0, sol.lo, k);` (mélanger avec `lerp` pour entrer/sortir du geste). Ne pas mettre `tuck:true` pendant l'atteinte.

### `M.partMatrices(def, pose, x, y, s, dir)` → `{ T0, root, mats }` et `M.wpt(m, px, py)` → `[X, Y]`
`mats[part]` = DOMMatrix local→écran (incluant la transformation courante du contexte). `M.wpt(mats.head, 14, -56)` = position écran du point local. Sert à accrocher un objet (sueur, bicorne libre, cible d'IK) sans dessiner. Appeler sous la même transformation de contexte que `puppet`.

## 4. Décors et machinerie

### `M.flat(cv, x, y, o = {})` — pose un pré-rendu (origine = **bas-centre** du canvas, `cv.padB` px au-dessus du bas si défini)
`o` : `rot` (rad, autour de l'origine), `scale`, `skew` (cisaillement horizontal : `x' = x + skew·y`), `alpha`, `clipY` (ne dessine que ce qui est au-dessus de cette ligne y : `ST.back+1` pour un décor qui sort de la trappe, `null` = pas de clip), `cast: {a=0.35, dx=16, dy=6}` (ombre portée ; **exige** `M.withShadow(cv)` à la création), `ripple: {amp, t, k=0.018, w=9, cy=-500}` (ondulation de toile : tranches de 12 px décalées de `amp·sin(ly·k − t·w)·e^{−|ly−cy|/700}`, `ly` = y local par rapport à l'origine (négatif vers le haut), `cx` est ignoré ; actif si `amp > 0.05` ; `k` fréquence spatiale, `w` vitesse).
Pour un pré-rendu maison : `const cv = M.cutFlat(w, h, w/2, h-10, (x) => { …dessin avec origine au pied… }); cv.padB = 10; M.withShadow(cv, 8);`.

### `M.hung(cv, x, y, t, {f=0.8, ph=0, amp=0.02, cast})` — décor suspendu à deux fils
Même placement que `flat` + balancement `amp·sin(t·f + ph)` et deux fils qui montent hors cadre. Pour nuages, soleil de carton, cœur, couronne.

### Fabriques de décors (appeler dans `S.init`)
| Appel | Résultat |
|---|---|
| `M.makeSky(kind)` | toile de fond peinte W × (ST.back+5), `kind` : `'aube'` `'couchant'` `'paris'` `'empire'` ; `ctx.drawImage(K.sky,0,0)` |
| `M.makeParisRow()` | ferme basse (toits de Paris, colline, arbres) ; `M.flat(K.row, 540, ST.back)` |
| `M.makeTreeWing(seed, flip)` | coulisse-arbre 300×1300 ; `M.flat(K.wingL, 120, ST.back, {rot, cast})` / `(…, 960, …)` avec `flip=true` |
| `M.makeCloud(seed, s=1)` | nuage de carton ; à poser avec `M.hung` |
| `M.makeArc(fake)` | Arc de triomphe en pierre (`false`) ou en toile peinte sur charpente de bois (`true`) ; `M.ARC = {halfW:430, h:952, open:143, apex:-551, spring:-408}` (proportions vraies 45 × 50 m) ; pose avec `scale ≈ 0.9` |
| `M.makeColumn()`, `M.makeCanopy()`, `M.makeWreath()` | colonne dorée (Empire), tenture verte à franges (se pose avec `M.hung`/`flat`), couronne de laurier |
| `M.makeWave(i)` (i 0..3), `M.makeRock()` | bandes de mer (sombres vers l'avant), rocher |
| `M.sun(x, y, r, t)` | soleil de carton orange sur son fil (dessine directement) ; `sunGold` (m2) est une variante dorée à rayons |
| `M.drapeau(x, y, s, t, ph=0, len=200)` | drapeau tricolore sur hampe qui ondule ; `(x,y)` = pied de la hampe |
| `M.bicorne(x, y, s, rot=0, dir=1)` | bicorne seul (posé, tenu, qui vole) ; `(x,y)` = milieu du bord inférieur |
| `M.pre(w, h, fn(c, cv))`, `M.cutFlat(w, h, ox, oy, fn(c))`, `M.withShadow(cv, blur=8)` | outils de pré-rendu (`cutFlat` translate l'origine en `(ox, oy)`) |

### Théâtre
- `M.drawFloor()` : plancher en lattes (fentes arrière/avant gravées).
- `M.curtain(t, f, {swing=0, openW=74})` : `f` 0 = fermé (deux pans de 520 px, plein cadre) → 1 = ouvert (pans de `openW` sur les bords). `swing` (px) fait balancer le bas des pans (traînée).
- `M.stageLight(t, {spot:{x,y,r,a}, beams, beamA})` : faisceaux de projecteurs + poussière + lueur de rampe + **poursuite** : assombrit hors du cercle de rayon `r` (a 0.3–0.5). Défaut `spot:{x:520,y:1060,r:470,a:0.42}` ; `spot:null` la supprime. `beams = [[sx,sy,ex,ey,ew],…]` (défaut deux faisceaux depuis les cintres), `beamA` multiplie leur intensité.
- `M.drawFrame(t)` : rampe (flammes), souffleur, cadre de scène doré, lambrequin. En tout dernier. `M.footlights(t)` en fait partie.

## 4b. Conduite du rideau (toute la vidéo) — `<video>/rideau.json`
Le rideau ne se règle plus plan par plan : **une conduite** pour toute la vidéo, écrite dans la fiche puis dans `<video>/rideau.json` (chaque cue porte de préférence **`"plan": N`** : ses temps sont alors comptés depuis le début du plan N, et une valeur au-delà de la durée du plan déborde sur le suivant ; sans `plan`, temps globaux = début réel du plan N + t, débuts dans `durees.json`. Chaque plan dure sa voix : `DUREE`, `DEBUT` dans `duree.js`)·10 + t). `construire.sh` la copie dans chaque plan avec le numéro du plan ; chaque plan en dessine sa tranche. Un mouvement peut **chevaucher la coupe** : fermeture à la fin du plan 3, réouverture au début du plan 4 → mis bout à bout, un seul geste continu (même ouverture, même balancement, même son de part et d'autre de la coupe).
```json
{ "cues": [
  { "plan": 1, "type": "ouvre",  "a": 0.1,  "b": 1.2 },
  { "plan": 3, "type": "demi",   "a": 3.6,  "b": 4.1,  "c": 4.4,  "d": 5.0, "k": 0.45, "id": "plustard" },
  { "plan": 3, "type": "change", "a": 10.0, "b": 10.55, "c": 10.75, "d": 11.45, "id": "chalet" },
  { "plan": 6, "type": "ferme",  "a": 9.4,  "b": 10.25 }
] }
```
- `ouvre` (0 → 1), `ferme` (→ 0), `change` (ferme a→b, **fermé** b→c : on change le décor, rouvre c→d), `demi` (les pans se resserrent jusqu'à `k` puis se rouvrent : ellipse de temps, « plus tard », sans changer de lieu).
- Dans `scene.js` : **`M.rideau(t)`** à la place de `M.curtain` (dessine l'état de la conduite). `M.rideauAt(t)` → `{ f, swing, T, ferme }`. Changement de décor : `if (M.rideauApres(t, 'chalet')) decorB(t); else decorA(t);` (vrai à partir du milieu de l'intervalle fermé du repère). Dans le plan qui **commence** fermé, dessiner directement le nouveau décor.
- Dans `mixage.py` : **`m.rideau_conduite()`** place tout le son du rideau (y compris la partie d'un mouvement commencé dans le plan précédent ou fini dans le suivant). Ne pas ajouter `rideau_ouvre/ferme` à la main.
- Sans `rideau.json`, `M.rideau(t)` laisse le rideau ouvert.

## 4c. Faune et flore lointaines (scènes en extérieur)
Petites silhouettes de carton, fonctions pures de t, à dessiner **avant `M.drawFloor()`**. `brume` (0..1) les pâlit vers la couleur de l'air : plus c'est loin, plus c'est pâle (0,3–0,5 au fond).
| Appel | Effet |
|---|---|
| `M.oiseaux(t, {x0, x1, y, t0, dur=7, n=5, s=1, seed, col, brume=0.35, boucle, fil})` | vol en formation lâche qui traverse de x0 à x1, battements d'ailes ; `col:'#e9e4d8'` = mouettes ; `fil:true` = fils de théâtre visibles |
| `M.passage(kind, t, {x0, x1, y, t0, dur=8, s=0.35, n=1, ecart=70, broute, seed, brume, boucle})` | animal (ou petit troupeau `n`) qui marche le long d'une crête ou d'une prairie ; `broute` (0..1) : s'arrête brouter au milieu |
| `M.animal(kind, x, y, s, {dir, ph, brume, tete, immobile, col, col2})` | un animal posé (pieds en x,y), `ph` = phase de pas (tours) |
| `M.marmotte(t, x, y, s=0.5, {t0, t1})` | sort de son terrier, se dresse, regarde, rentre |
| `M.papillons(t, {x, y, rx, ry, n=3, s})` | papillons qui volettent dans une zone |
| `M.poissons(t, {x0, x1, y, n=3, periode=3.2, s})` | poissons qui sautent (mer, lac) avec éclaboussures ; `y` = surface |
| `M.fleurs(t, {x0, x1, y, n=30, h=40, seed, cols, brume, herbe})` | bande de fleurs et d'herbes qui ondulent (pied de coulisse, prairie) |

`kind` (`M.BETES`) : `chamois bouquetin cerf biche vache cheval mouton chevre renard loup lapin`. Échelles : au fond (crête) `s` 0,25–0,4 ; prairie intermédiaire 0,4–0,6. Poser les pieds **sur** un relief dessiné (crête de colline, bord de prairie, rive), jamais en l'air sur la toile du ciel.

## 4d. Raccords entre plans — `<video>/raccords/pN.js`
Chaque plan **écrit son état final** (ce que le plan suivant doit reprendre à 0 s) dans `<video>/raccords/pN.js`, et seulement ce fichier : `M.RACC.p3 = { prefet:{x:190, s:0.93, dir:1}, boites:[{x:575, s:1.1, bande:'vert'}, …], ciel:'paris', … };`
`construire.sh` réunit tous ces fichiers dans le `raccords.js` de chaque plan (chargé avant `persos.js`). Le plan N+1 **lit** `M.RACC['p' + (M.PLAN - 1)]` pour placer son image 0 au lieu de recopier des valeurs à la main ; si le plan N est corrigé, il suffit de relancer `construire.sh` et `produire.sh` du plan N+1.
Contenu utile : positions, échelles, sens (`dir`), poses finales (angles importants), état des objets (couvercles, contenus), décor et ciel, personnages encore en scène.

**Décors partagés — `<video>/decors/pN.js`** (un fichier par plan : deux agents en tuilage n'écrivent jamais dans le même fichier) : un décor qui sert à plusieurs plans (rivière, cuisine, labo…) s'écrit une seule fois, dans le fichier du plan qui le crée, au lieu d'être recopié de `scene.js` en `scene.js`. `construire.sh` réunit tous les `decors/*.js` (et l'ancien `<video>/decors.js` s'il existe) dans le `decors.js` de chaque plan, chargé après `persos.js` et avant `scene.js`. Forme : `M.dec.riviere = function (t, up) { … };` (`M.dec` existe déjà ; pas de `const` global) ; chaque fonction prend le décalage vertical `up` ; pré-rendus dans `M.dec.init_pN = function () { … };` — `M.dec.init()`, appelé dans `S.init`, lance tous les `init_*`. Les plans suivants appellent ces fonctions sans les modifier (variante = nouvelle fonction dans leur propre fichier). Fonction pure de `t`, comme `S.draw`.

## 4e. Vignette (second lieu) et envoi — action à distance
Une action à distance (envoyer, écrire à, appeler, penser à quelqu'un) se joue sur **deux lieux** : jamais le destinataire dans la pièce de l'expéditeur.
- **`M.vignette(t, { x, y, rx=210, ry=260, t0, t1=99, dur=0.6, fond, draw })`** → ouverture `p` (0 = fermée) : médaillon ovale doré suspendu à deux fils, qui descend un peu et s'ouvre **en iris** de `t0` à `t0+dur`, se referme à partir de `t1`. `draw(cx, cy, rx, ry, p)` dessine l'intérieur (fond du second lieu, personnage à petite échelle ≈ 0,45–0,6, pieds vers `cy + ry*0.6`), déjà découpé dans l'ovale. Placement : dans la zone utile (x ± (rx+22) entre 130 et 930, haut de scène de préférence), sans couvrir le geste de la scène principale ; `rx, ry` ≥ 180 × 220 pour la lecture sur téléphone.
- **`M.envoi(t, { de:[x,y], a:[x,y], t0, t1, haut=220, draw })`** → position ou `null` : un objet (lettre, carte, pigeon, colis) vole en arc de `de` à `a` « comme un oiseau » (léger battement), de `t0` à `t1`. `draw(x, y, ang, k)` dessine l'objet. Après `t1`, la scène (ou la vignette) dessine l'objet à son arrivée : pas de saut.
- Ordre de dessin : la vignette et l'envoi après les marionnettes, avant `M.stageLight`. Son : `objet_pose` à l'arrivée, `glisse` léger pendant le vol.
- Exemple : `M.vignette(t, { x: 690, y: 560, t0: 1.0, t1: 8.6, draw: (cx, cy, rx, ry) => { M.puppet(C.emma, pose, cx, cy + ry*0.6, 0.5, { dir: -1 }); } });` puis `M.envoi(t, { de: [380, 1050], a: [690, 640], t0: 3, t1: 5, draw: carte });`

## 5. Matériel interne exposé pour personnages propres : `M.X`
`M.X = { legPts(th=1), armPts(len=98), forePts(kind), foreTuck(), NAP_HEAD, AR_HEAD, GR_HEAD, earPaint(x,y), eye(f,x,y,sz=1), brow(f,x,y,col,lw), mouth(f,x,y,col), handPaint(skin,kind), HAND_OPEN, HAND_FIST }`
- `legPts(th)` : jambe de profil, hanche en (0,−12), pied en y ≈ 237, bout du pied vers +x ; peindre bottes/chaussettes par un rectangle `y ≥ 214` dans le `paint`.
- `armPts(len)` : bras dont le coude est en `(0, len)` ; `forePts('fist'|'open')` : avant-bras + main, poignet en y ≈ 76–80 (le `paint` colore en peau tout ce qui est sous y = 76 : `fillPts([[-20,76],[20,76],[24,130],[-20,130]], skin)` puis `handPaint(null, kind)`) ; `foreTuck()` : avant-bras sans main (replié).
- `NAP_HEAD`, `AR_HEAD`, `GR_HEAD` : silhouettes de tête de profil (cou en y = 16, nez vers +x, crâne jusqu'à y ≈ −97). Yeux en `(17,−52)`, sourcil `(17,−59)`, bouche `(27,−27)`, oreille `earPaint(−8,−44)`.
- `eye/brow/mouth(face, …)` appliquent `face.eyes/brow/mouth`.

## 6. Personnages fournis : `M.chars` et noms des pièces articulées
Toutes les marionnettes : repère local = pieds en (0,0) à `hipY`, corps de profil. Noms valides dans `pose.ang` / `pose.hide` :

| Clé `M.chars` | Pièces (ordre de dessin → fond vers avant) | Particularités |
|---|---|---|
| `napoleon` | `armB_up armB_lo legB legF head hat torso armF_up armF_lo lapel` | `tuck`, `handF`, `costume:'gris'` ; `hat` = bicorne (`hide:{hat:1}` quand il tombe) ; face complète. Tige en `torso (-26,18)` ; `handLen` 104 |
| `marieLouise` | `mantle armB_up armB_lo head torso armF_up armF_lo bouquet` | robe longue : **pas de jambes** ; `mantle` (manteau rouge) oscille `ang.mantle ≈ ±0.03` ; `bouquet` au poing avant ; face complète ; `handLen` 108 |
| `architecte` | `armB_up legB legF head torso plan armB_lo armF_up armF_lo` | `plan` = rouleau tenu dans la main arrière (`hide:{plan:1}` si on dessine sa propre feuille) ; `handF` ; perruque grise ; face complète |
| `grenadier` | `armB_up armB_lo legB legF head bonnet torso musket armF_up armF_lo` | `bonnet` à poil, `musket` fusil (`ang.musket` ≈ 0.2 pour le tenir incliné) ; **`face` : seulement `eyes` et `brow`** (pas de bouche) |
| `bourgeois` `dame` `ouvrier` `garde` | `torso head hat armF_up armF_lo` | figurants de foule, corps d'un seul bloc (pas de jambes articulées ; `dame` en robe) ; **`face` : seulement `eyes`** ; bras levé avec `armF_up ≈ −2.5` (chapeau) ou `−1.2, armF_lo −1.1` (drapeau) |

Les `legB/legF` se balancent en opposition ; `hat`, `bonnet`, `head`, `bouquet`, `musket`, `plan`, `mantle` ont chacun leur angle (`rest` + `ang`). Foule du fond : `M.puppet(C.garde, pose, cx, FEETB, 0.72, {dir, slot: ST.slotB, cast})` ; pour un figurant qui monte de la fente, `pose.dy = ((1-u)·430 + bob)/s` (dy est en unités du personnage).

## 7. Créer un personnage ou un accessoire propre à la vidéo (`persos.js`)
Fichier `<video>/persos.js`, copié dans chaque plan par `construire.sh`, chargé **après** le kit et **avant** `scene.js`. Règles :
1. **Tout dans une IIFE** `(function(){ … })();` : un `const`/`let` global ferait planter `scene.js` (redéclaration : tous les scripts classiques partagent la portée globale).
2. Outils : `M.X` (§5), `M.fillPts/strokePts/dot/hatch/shade/piece` (§2), `M.P`, `M.TAU`, `M._sil()`, `M.ctx()`.
3. Enregistrer par `M.chars.<nom> = mkX();` au chargement (`M.init → makeChars` n'efface pas `M.chars`). La définition ne dessine rien : les `pts/paint` ne sont appelés qu'au dessin.
4. Structure de `def` (identique à `mkNapoleon`) :
```js
{ hipY: -238,                       // hauteur de la hanche au-dessus des pieds (négatif). Jambes de legPts : −238
  handLen: 104,                     // distance coude → main, pour M.ik
  rod: { part: 'torso', at: [-26,18] },     // point d'attache de la tige de bois (dans le repère de la pièce)
  parts: { nom: { parent: null | 'autrePièce', at: [x,y],   // rivet : position DANS le repère du parent
                  pts: [[x,y,1?],…] | (pose)=>pts,           // silhouette (repère de la pièce, origine = rivet)
                  base: '#couleur', paint: (pose)=>{…}, extra: (pose)=>{…},  // paint clippé ; extra non clippé (guarder _sil)
                  seed, texA, rest: radians, noRivet: true } },
  order: ['armB_up', …] }           // ordre de dessin, fond → avant
```
Le torse est la racine (`parent:null, at:[0,0]`) ; `head` en `[6,-170]` (cou) ; épaules `[-2,-146]` (avant) et `[-10,-146]` (arrière) ; hanches `[±6,-2]`. Un accessoire = une pièce enfant (`parent:'armF_lo', at:[4,96]` = au poing ; `parent:'head'` pour un chapeau/une mèche) : il suit le geste et on le masque par `pose.hide`. `pose.ang.<pièce>` l'oriente (ex. `A.flask = -(A.armF_up + A.armF_lo)` garde un objet vertical).

Exemple complet testé (petit chimiste en blouse : fiole qui clapote et bulle ; sans bras arrière) — la version avec bras arrière, lunettes et mèches en pointe est dans `exemples/persos_chimiste.js` :
```js
(function () {
  const X = M.X, { fillPts, strokePts, dot, hatch, shade } = M;
  const BLOUSE = '#e9e4d6', SKIN = '#e0bf9b';
  const CH_TORSO = [[-14,-176],[8,-180],[16,-168],[26,-150],[34,-112],[36,-60],[38,0],[42,70],[44,128,1],
                    [-42,130,1],[-40,60],[-38,0],[-38,-60],[-37,-110],[-33,-150],[-26,-168]];
  const FLASK = [[-6,-66],[6,-66],[6,-40],[28,6],[30,18,1],[-30,18,1],[-28,6],[-6,-40]];       // goulot en haut
  const SHOES = (c) => () => fillPts([[-40,214],[60,214],[60,260],[-40,260]], c);
  function mkChimiste() {
    const parts = {
      torso: { parent: null, at: [0,0], pts: CH_TORSO, base: BLOUSE, seed: 301, paint: () => {
        for (const y of [-100,-50,0,50,100]) dot(24, y, 2.3, '#8d8676');
        hatch([[-50,-170],[-12,-170],[-10,130],[-50,130]], 0.75, 4.2, 0.30); shade(40, 0, -40, 0, 0.28); } },
      legB: { parent: 'torso', at: [-6,-2], pts: X.legPts(0.95), base: '#6b6a70', seed: 302, noRivet: true, paint: SHOES('#2a2020') },
      legF: { parent: 'torso', at: [6,-2],  pts: X.legPts(0.95), base: '#85848a', seed: 303, paint: SHOES('#3a2c28') },
      armF_up: { parent: 'torso', at: [-2,-146], pts: X.armPts(94), base: BLOUSE, seed: 308 },
      armF_lo: { parent: 'armF_up', at: [0,94], pts: (p) => X.forePts(p.handF || 'fist'), base: BLOUSE, seed: 309,
                 paint: (p) => { fillPts([[-20,76],[20,76],[24,130],[-20,130]], SKIN); X.handPaint(null, p.handF || 'fist'); } },
      head: { parent: 'torso', at: [6,-170], pts: X.NAP_HEAD, base: SKIN, seed: 306, noRivet: true, paint: (pose) => {
        const f = pose.face || {};
        fillPts([[30,-112],[26,-80],[10,-76],[-12,-66],[-20,-36],[-44,-28],[-44,-112]], '#b9b6ae', 3);   // cheveux gris
        X.earPaint(-8, -44); X.eye(f, 17, -52); X.brow(f, 17, -60); X.mouth(f, 27, -27); } },
      flask: { parent: 'armF_lo', at: [4,96], pts: FLASK, base: 'rgba(200,230,240,0.55)', seed: 310, noRivet: true,
        paint: (p) => fillPts([[-34,-2+3*Math.sin((p.t||0)*6)],[34,2-3*Math.sin((p.t||0)*6)],[34,22],[-34,22]], '#4fae7a'),   // liquide qui clapote
        extra: (p) => { if (M._sil()) return; const c = M.ctx();                                           // dessin brut : toujours garder
          for (let i = 0; i < 4; i++) { const u = ((p.t||0)*0.9 + i*0.27) % 1;                              // bulles
            c.beginPath(); c.arc((i-1.5)*2, -66-u*46, 3.5*(1-u*0.5), 0, M.TAU); c.fillStyle = `rgba(150,230,190,${0.8*(1-u)})`; c.fill(); } } },
    };
    return { hipY: -238, parts, handLen: 104, rod: { part: 'torso', at: [-26,18] },
      order: ['legB','legF','head','torso','armF_up','armF_lo','flask'] };       // fond → avant ; pas d'armB : le bras arrière n'existe pas
  }
  M.chars.chimiste = mkChimiste();
})();
```
Dans `scene.js` :
```js
const A = { armF_up: lerp(0.05,-1.2,k), armF_lo: lerp(-0.1,-0.5,k), head: -0.08 };
A.flask = -(A.armF_up + A.armF_lo);                       // la fiole reste verticale
M.puppet(C.chimiste, { dy: Math.sin(t*1.9)*1.2, t, ang: A, face: { brow:'up', eyes:'wide', mouth:'o' } },
         760, FEET, 1, { dir: -1, slot: ST.slotF, cast });
```
Même méthode pour un décor propre : `K.fiole = M.withShadow(M.cutFlat(w,h,w/2,h-10,(x)=>{ M.piece([...], base, ()=>{…}, {seed:1}); }), 8)` dans `S.init`. Un objet emblématique se dessine **par la même fonction** dans tous les plans.

## 8. Recettes (extraits des exemples)

**Rideau** : voir §4b (conduite de la vidéo, `M.rideau(t)`). Les exemples `arc-de-triomphe` le pilotent encore à la main (`M.curtain(t, f, {swing})`) : ne pas les imiter sur ce point.

**Décor qui monte de la trappe** avec rebond (m4, faux arc) : `const p = easeOut((t-flat0)/(flat1-flat0)); const y = ST.back + (1-p)*H + wob(t, flat1, -16, 2.6, 5.5); M.flat(K.faux, X, y, {clipY: ST.back+1, scale: 0.9, cast:{dx:18,dy:8,a:0.42}});` (H = hauteur du décor ; cordes : `ctx.quadraticCurveTo` du haut du décor jusqu'à y = 150). **Décor qui descend des cintres** (m1, vrai arc) : `y = ST.back - (1-p)*1250 + wob(t, arc1, -12, 2.2, 5.5)`, `rot = wob(t, arc1, 0.008, 1.6, 4)`, câbles `moveTo(cx, y-H*s+6); lineTo(cx, 0)`.

**Marionnette qui entre en glissant, avec sautillements** (m1, m4) : `x = lerp(-260, 250, smooth(enter0, enter1, t))` ; `dy += -Math.abs(Math.sin(t*9))*4` (les pieds touchent quand sin(9t)=0 : instants pour `m.glisse(..., sauts=…)`) ; `tilt = 0.03·sin(π·u)`. Marche cadencée : `p = clamp((t-walk0)/(walk1-walk0))*4; k = floor(p); f = p-k; x = lerp(x0, x1, (k+ease(f))/4); dy = -Math.sin(π f)*16; legF = sin(π f)*0.3·(k%2?-1:1); legB = -legF` (talon au sol quand f → 1 : instants `step`). Couple : un hop en continu `p=(t-walk0)*2.3`, `dy = -|sin(π p)|·11·env`, `env = smooth(walk0,walk0+0.2,t)·(1-smooth(walk1-0.2,walk1+0.05,t))`.

**Rang qui monte / descend de la fente** (foule, m1) : `clipAbove(ST.slotB, () => M.puppet(...))` avec `function clipAbove(y, fn){ const x = M.ctx(); x.save(); x.beginPath(); x.rect(0,0,M.W,y); x.clip(); fn(); x.restore(); }` ; sinon le personnage « sous le plancher » serait dessiné devant. `pose.dy = (1-u)*430/s` (u = easeOut à la montée, `×(1-easeIn(…))` à la descente).

**Chute à plat sur le plancher, tige qui se retire** (m1) — à éviter : marionnette à l'horizontale au bout de sa tige. On pivote autour du talon arrière avec une matrice posée avant `puppet`, on coupe la tige propre (`rod:false`), et on la fait glisser sous la scène :
```js
const u = clamp((t - E.fall0) / (E.fallLand - E.fall0)), rot = -Math.PI/2 * Math.pow(u, 2.3);       // bascule raide en arrière
const hx = x - 18*NS, hy = FEET, lift = -BACK*NS*Math.sin(-rot);                                       // BACK : épaisseur du dos, il se pose à plat
const R = new DOMMatrix().translate(0, lift).translate(hx, hy).rotate(rot*180/Math.PI).translate(-hx, -hy);
ctx.save(); ctx.setTransform(R);
const r = M.puppet(C.napoleon, pose, x, FEET, NS, { dir: 1, slot: ST.slotF, rod: false, floorShadow: t < E.fall0, cast: … });
ctx.setTransform(r.mats.torso); M.rivet(-26, 10, 3); ctx.restore();                                   // rivet de la tige resté visible
// tige : verticale (drawRodV de m1) clippée au-dessus de la fente, elle descend de easeIn((t-fall0)/(rodGone-fall0))*300 puis disparaît
```
Après l'impact : `rot = -π/2 + wob(t, fallLand, 0.05, 2.6, 7)`, petit rebond `jolt = -|sin((t-fallLand)*12)|*9*e^{-8(t-fallLand)}`, `hide:{hat:1}` et chapeau libre (ci-dessous), nuage de poussière de papier (cercles `rgba(214,200,170,.32·(1-u))` qui grossissent), ombre au sol (gradient radial aplati `scale(1,0.06)`).

**Objet qui tombe, rebondit** : trajectoire balistique `x = x0 + vx·u ; y = y0 + vy·u + ½·g·u²` (g ≈ 4200–6000 px/s²), rotation `lerp(r0, r1, u/uL)`, instant d'atterrissage `uL` résolu analytiquement (m1 `freeHat`), puis rebonds `y = sol - |sin(v·14)|·12·e^{-9v}` et roulis `r = r1·cos(2π·1.8·v)·e^{-6.5v}` ; `M.bicorne(x, y, NS, r, 1)`. Couronne (m5) : `cy = 640 + 0.5·6000·fall²` (min `ST.back+6`), rebond `-|sin((t-land)*9)|·40·e^{-6(t-land)}`. Un objet ne tombe jamais sur une tête ni devant un visage qui réagit. Instant d'atterrissage → bruitage (`SCENE.hatLandT()` ou valeur codée dans `mixage.py`).

**Neige / pétales / feuilles de papier** (m3, m4) : tableau déterministe `const PET=[]; { const R=M.rng(44); for(let i=0;i<80;i++) PET.push({x:300+R()*640, t0:E.petals0+R()*1.6, v:560+R()*180, ph:R()*TAU, s:0.7+R()*0.6}); }` puis pour chaque grain : `u=t-p.t0; y=150+u*p.v; x=p.x+Math.sin(u*3+p.ph)*26-u*20; fl=Math.cos(u*7+p.ph); ctx.translate(x,y); ctx.rotate(u*2+p.ph); ctx.scale(fl*p.s,p.s);` ellipse + ombre décalée 1 px ; arrêt à `y > ST.slotF`. Dessiner avant `stageLight`.

**Poursuite qui se resserre** (m1, m2) : `M.stageLight(t, { spot: { x: lerp(560,470,k), y: lerp(1040,1060,k), r: lerp(500,400,k), a: lerp(0.38,0.5,k) } })` avec `k = smooth(t0,t1,t)` ; suivre l'acteur (`x = marionnette.x - 20`).

**Ondulation de toile + vacillement** (m4, appui sur le faux arc) : `M.flat(K.faux, X, y, { rot: wob(t,touch,-0.03,1.35,4.4) + …, skew: wob(t,touch,0.035,1.35,4.6), ripple: { amp: 15*Math.exp(-4.8*(t-touch)), t, cy: (jambageY-ST.back)/0.9, k: 0.02, w: 11 }, scale: 0.9, clipY: ST.back+1 })` + creux sombre local (gradient radial `rgba(40,25,10,.5·push)` sous la main) ; la main de l'acteur vient par `M.ik` + `handRod: ['armF_lo',0,70]`.

**Recul de caméra unique** (m6, 1,1 → 1,0 sur ≈ 3 s) : après `M.drawFrame(t)`, copier le canvas dans un tampon créé en `S.init` (`S.buf = M.mkCanvas(M.W, M.H)`) puis `x.setTransform(1,0,0,1,0,0); x.drawImage(S.buf, AX-AX*zz, AY-AY*zz, M.W*zz, M.H*zz)` avec `zz = lerp(1.1,1.0,ease(u))`. Seul mouvement de caméra permis.

**Gestes utiles** : atteindre un point = `M.ik` ; saluer = `tilt` + `head` ; gouttes de sueur / larme = goutte `quadraticCurveTo` posée en `r.w('head', lx, ly)` qui coule en `y + 30·easeIn(u)` avec pop `spring` ; support qui grandit (feuille d'architecte, m2) plutôt que l'objet déformé : `spring(t - t0, 0.42, 15)` sur la taille.

## 9. Bruitages (`sfx_lib.py`, détail dans son en-tête)
Résumé en 17 lignes (préréglages, signatures, structure de `mixage.py`) : `python3 -I OUTILS/sfx_lib.py --aide`. Le détail ci-dessous ne sert qu'aux cas particuliers.
`gabarits/mixage.py` : `E = events('timeline.js')` (lit **`TL.EVENTS`** : clés `\w+`, valeurs **numériques littérales** ; ne pas écrire `mot: 3` dans un commentaire de ce bloc ni `};` avant sa fin) ; `MOTS` = paires `[a, b]` de `TL.MOTS = [[a,b],…];` (**une seule instruction, aucun `;` dans ses commentaires**) ; `m = Mix(mots=MOTS, seed=N)` ; `m.write(sys.argv[2])` (limite à −24 dBFS : un son trop fort fait baisser tout le mixage). Lancement : `cd <plan> && python3 -I mixage.py <outils> /tmp/x.wav`.
Rideau : **`m.rideau_conduite()`** (d'après `rideau.json`, automatique). Préréglages (db = crête dBFS, pan −1 gauche … +1 droite, aucun bruitage > −26) : `rideau_ouvre(t0,t1)`, `rideau_ferme(t0,t1)`, `rideau_change(f0,f1,o0,o1)`, `rideau_demi(a,b,c,d)` (réservés à la conduite), `decor_monte(t0,t1,pan,poids='leger'|'lourd')` (butée à t1), `decor_descend(t0,t1,pan,poids)`, `decor_tombe(t,pan)`, `apparition(t,pan)` (t = arrêt), `disparition(t,pan)` (t = début), `glisse(t0,t1,pan0,pan1,db,sauts=(instants de clac))`, `pas(instants,pan)`, `objet_pose(t,pan)`, `chute(t,pan)`, `papier(t,pan,long=False)`, `ambiance(nom, t0=0, t1=10, db=-42, pan, af)` (**au moins une par plan**, très basse : clips `vent`, `ressac`, `vent_herbe`, `sabots_neige` ou synthèse `interieur`, `machine`, `horloge`, `feu`, `eau`). Bas niveau : `place(nom,at,db,pan,start,end,af,rate,fin,fout,label)` sur `sons/<nom>.mp3` (si `start` dépasse la durée du clip, rien n'est joué : durées dans `sons/`), `add(sig,at,db,pan)`, `swish`, `rings`, `creak`, `clac`, `carillon`, `applaudissements` (seulement si une foule **visible** applaudit). `murmure` est **interdit** (lève une erreur) : aucun son de voix humaine sous la voix off. `Mix.verifier()` signale (ligne `ATTENTION`) tout bruitage dont le DÉBUT tombe dans `[a−0.05, b]` d'un mot-clé et dépasse −36 dBFS : décaler le son après le mot.

## 10. Pièges connus
- `const` global dans `persos.js`/`scene.js` (autre que `SCENE`) → « redeclaration » ; ne pas redéfinir `FPS`, `FRAMES`, `ctx`, `setFrame`, `params` (déjà dans `modele.html`).
- `Math.random`, `Date.now`, état accumulé dans `S.draw` → images différentes d'un worker à l'autre ; tout doit dépendre de `t`.
- Pré-rendre dans `S.draw` = rendu extrêmement lent ; l'ombre `cast` de `M.flat` exige `M.withShadow` ; `cv.padB` pour un pied exact.
- `pose.dy`/`dx` sont en unités du personnage (× `s`) ; `tilt` pivote autour des PIEDS ; `ang` s'ajoute au `rest`.
- Personnage « sous le plancher » (descente, foule) : `clipAbove(ST.slotX, …)` obligatoire.
- `python3` sans numpy (routines) : les scripts `.sh` du kit placent déjà `/usr/bin` en tête du PATH ; pour un `python3` lancé à la main, utiliser `/usr/bin/python3`.
- Tige : `rod:false` dès qu'on pivote ou couche la marionnette ; sinon la tige suit l'inclinaison du corps (absurde à l'horizontale).
- `handRod` visible = fil noir fin ; ne pas l'utiliser pour une main qui doit paraître libre.
- Dessin brut dans `paint`/`extra` sans `if (M._sil()) return;` → tache noire/colorée dans l'ombre portée.
- Après `ctx.setTransform(R)` autour de `puppet`, toujours `ctx.save()/restore()` ; `M.partMatrices` utilise la transformation courante (appeler `M.ik`/`partMatrices` sous la MÊME transformation que `puppet`).
- `grenadier` n'a pas de bouche, les figurants ni bouche ni sourcil : `face.mouth` y est ignoré.
- Ne pas boucher la scène : 2 ou 3 couches de décor ; décors réels en proportions vraies ; aucun ornement doré qui ressemble à une lettre ; rien dans la zone y > 1430 ni x < 130 / x > 950 que le spectateur doit voir.
- `timeline.js` : `events()` ne comprend que des nombres littéraux ; un commentaire `clé: 2.5` dans `TL.EVENTS` serait lu comme un événement.
- Bruitage sur un mot-clé, trop fort, ou sans action visible ; plan sans ambiance du lieu ; son qui ressemble à une voix (interdit) ; plus de 8 bruitages « principaux ».
