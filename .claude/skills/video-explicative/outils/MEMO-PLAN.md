# Mémo d'un plan — à lire EN ENTIER par chaque agent « plan N »

Ce mémo remplace la lecture complète de `CHARTE.md`, `API.md` et des exemples. Il résume ce qui sert à chaque plan. Ton cahier des charges est `<video>/pN/CONSIGNE.md` (écrit par `construire.sh` : la fiche sans le script ni les consignes des autres plans) : ne lis pas `FICHE.md`. **Lis le reste seulement au besoin, par section** (`grep -n "^##" API.md` donne l'index) : une recette (API §8), un personnage du kit (API §6), la faune (API §4c), un piège (API §10). Un exemple `exemples/arc-de-triomphe/mN/scene.js` ne se lit que pour copier une recette précise, jamais en entier.

## 1. Fichiers et commandes
- Un plan = `<video>/pN/` : `timeline.js` (`TL.EVENTS` nombres littéraux ; `TL.MOTS = [[a,b],…];` une seule instruction), `scene.js` (`const SCENE = (() => { S.init = …; S.draw = (t) => …; return S; })();` seul global), `mixage.py`. Partagés : `persos.js` (+ son mode d'emploi `persos.md`), `decors.js`, `rideau.json`, `raccords/pN.js`.
- `bash OUTILS/construire.sh <video>/pN` (une fois, au début) → itérations avec **`bash OUTILS/essai.sh <video>/pN 4.5,8.3`** (reconstruit le dossier et rend la planche `planche_cles.png` des secondes 0, 1, …, 9, 9,97 plus les instants donnés, en une seule commande et une seule ligne de sortie) → `bash OUTILS/produire.sh <video>/pN` (rendu complet ≈ 1 min, son, `planche.png`, contrôles automatiques). Les rendus attendent leur tour (verrou) : normal.
- **Lecture des fichiers** : jamais un fichier de plus de 150 lignes affiché en entier (ni `cat`, ni `Read` sans bornes). `grep -n` d'abord, puis `sed -n 'a,bp'` sur l'extrait utile. Vaut pour `API.md`, `CHARTE.md`, `persos.js`, `decors.js`, la bibliothèque, les exemples et le `scene.js` du plan précédent.
- `S.draw(t)` = fonction **pure de t** (3 workers en parallèle) : jamais `Math.random`/`Date.now`/état accumulé ; `M.rng(seed)`. Tout pré-rendu (`M.pre`, `M.cutFlat`, `M.withShadow`, `POU.init()`…) dans `S.init`, jamais dans `S.draw`. Aucun `const` global hors `SCENE`.

## 2. Scène, ordre de dessin, cadrage
- `M.ST = { L:46, R:1034, top:150, back:1395, slotB:1410, slotF:1450, front:1640 }`. Pieds : `FEET = ST.slotF - 34` (fente avant, échelle ≈ 0,9–1), `FEETB = ST.slotB - 30` (fente arrière, 0,72–0,9). Décors posés sur `ST.back`.
- **Ordre** : ciel → oiseaux → décors suspendus/coulisses → animaux lointains → fermes basses → fleurs → décors qui montent/descendent → `M.drawFloor()` → marionnettes (arrière puis avant) → accessoires/effets → `M.stageLight(t, {spot:{x,y,r,a}})` → **`M.rideau(t)`** → `M.drawFrame(t)`.
- **Zones** : tout ce qui compte dans x 130–930, y 150–1430 ; y > 1430 plancher seulement (sous-titres) ; x > 930 décor seulement ; coin x < 220, y < 220 calme (logo).
- **Lisibilité téléphone** : l'objet de chaque mot-clé ≥ 120 px, contrasté, dégagé (rien devant : meuble, personnage, chapeau) ; personnage principal ≥ 450 px ; positions du **plan de scène** de la fiche.

## 3. Marionnettes (`M.puppet(def, pose, x, y, s, {dir, slot: ST.slotF, cast:{dx:22,dy:10,a:0.3}})`)
- Profil, `dir` 1 → regarde à droite. `pose = { tilt, dx, dy, ang:{ head, armF_up, armF_lo, legF, legB, … }, hide:{…}, face:{ brow:'n'|'up'|'frown'|'worry', mouth:'n'|'o'|'smile'|'tight', eyes:'open'|'closed'|'wide'|'half' }, t }`. `dx/dy` en unités du personnage ; `tilt` pivote autour des pieds ; `ang` s'ajoute au repos.
- Angles : `armF_up` 0 = pendant, **négatif = lève vers l'avant** (−1,57 horizontal, −2,0 brandir sans passer devant la tête) ; `armF_lo` négatif = plie le coude ; `head` négatif = menton levé.
- Atteindre un point : `M.ik(def, pose, x, y, s, dir, 'armF', [X,Y], ±1)` → `{up, lo}` (mélanger avec `lerp`). Point d'une pièce : `r.w('armF_lo', 0, 96)`.
- Marche : `x = lerp(x0, x1, smooth(t0,t1,t))`, `dy = -Math.abs(Math.sin(t*9))*4`, `legF = ±0.3`, `legB = -legF`. Montée de trappe/fente : clip au-dessus de `ST.slotX` + `pose.dy = (1-u)*430/s`.
- Personnages de la vidéo et de la bibliothèque : **les appeler, ne jamais les redessiner**. Le mode d'emploi des personnages de la vidéo est `<video>/persos.md` (fonctions, options, valeurs permises, points de prise, tailles en px) : **ne lis pas `persos.js`** ; si une option manque à `persos.md`, `grep -n 'nomDeLOption' persos.js` puis l'extrait. Bibliothèque commune : l'en-tête de `bibliotheque/*.js` (`sed -n '1,40p'`).

## 4. Rideau, décors, faune, raccords
- Rideau : **`M.rideau(t)` seulement** (conduite `rideau.json`, temps globaux, déjà chargée). Changement de décor : `if (M.rideauApres(t, 'id')) decorB(); else decorA();`. Plan qui commence fermé : dessiner directement le nouveau décor.
- Décor qui descend des cintres : `y = ST.back - (1-p)*1250 + M.wob(t, t1, -12, 2.2, 5.5)` + câbles jusqu'à y 0. Qui monte de la trappe : `y = ST.back + (1-p)*H + M.wob(…)`, `clipY: ST.back+1`. Ressort : `M.spring(t-t0)`, rebond : `M.wob(t, t0, amp)`.
- Extérieur : 1 à 3 touches de faune lointaine muette (`M.oiseaux`, `M.passage`, `M.animal`…, API §4c), petites, pâlies, **posées sur un relief**, jamais pendant le geste clé au même endroit.
- **Décors partagés** (`<video>/decors.js`, chargé après `persos.js`, avant `scene.js`) : un décor qui sert à plus d'un plan (rivière, cuisine, labo…) s'écrit là, une fonction par élément, toutes avec le décalage vertical `up` (ex. `M.dec.riviere(t, up)`), espace de noms `M.dec` (`M.dec = M.dec || {};` en tête, aucun `const` global), pré-rendus dans `M.dec.init()` appelé dans `S.init`. Écris dans `<video>/decors.js`, jamais dans `pN/decors.js` (copie écrasée à chaque `construire.sh`/`essai.sh`). Le premier plan qui l'utilise l'ajoute à la fin du fichier ; les suivants **l'appellent** sans le recopier ni le modifier (une variante = une option ou une nouvelle fonction ajoutée en fin de fichier). Toute écriture dans `decors.js` se dit dans le rapport. Un décor d'un seul plan reste dans son `scene.js`.
- **Raccords** : image 0 placée d'après `M.RACC['p' + (M.PLAN-1)]` ; à la fin, écrire `M.RACC.pN = {…}` (positions, échelles, `dir`, poses finales, état des objets, décor) dans `<video>/raccords/pN.js`, puis relancer `construire.sh`.

## 5. Mise en scène (règles qui reviennent le plus)
- Geste clé sur le mot clé (± 0,2 s) ; gag avec la chute, jamais avant ; une action principale à la fois ; anticipation → action → rebond ; durées mini : geste 0,3 s, expression 0,6 s, gag 1,5–2 s ; changement de posture par étapes sur 0,8–1,2 s.
- Toute action finie à 9 s (9,6 s au plus) ; puis image stable (respiration, flammes) ou rideau si la conduite le prévoit. Jamais figé.
- Objets tenus : la main **entoure le corps** de l'objet, ouverture vers le haut ; accessoires sans tige (ils volent) ; marionnettes toujours sur leur tige ; chute = à plat sur le plancher, tige retirée (`rod:false`).
- Interdits : texte, lettres, chiffres, logos (sauf texte demandé par l'utilisateur et écrit dans la fiche) ; doigt seul tendu (main ouverte) ; bras croisés de profil ; objet qui tombe sur une tête ou passe devant un visage qui réagit ; anachronisme ; objet géant qui écrase la scène.

## 6. Bruitages (`mixage.py`)
- Garder `m.rideau_conduite()` (son du rideau automatique). Seulement des actions **visibles**, 3 à 8 par plan, préréglages calibrés (ne pas monter les niveaux). **`python3 -I OUTILS/sfx_lib.py --aide`** donne en 17 lignes tous les préréglages, leurs paramètres et la structure de `mixage.py` : ne lis pas `sfx_lib.py`.
- Aucun début de son dans un mot-clé (`ATTENTION` de `Mix.verifier()`) : décaler juste après. Faune muette.

## 7. Contrôle avant `produire.sh` (cocher chaque ligne sur les images)
1. `planche_cles.png` (sortie d'`essai.sh`) **à petite taille** : chaque mot-clé se lit en 1 s ; rien de clé caché ni hors zone.
2. Coudes et épaules sans cassure ; mains autour des objets ; postures par étapes.
3. Rideau conforme à la conduite à 0 s et à 10 s ; image 0 = état final du plan précédent (`M.RACC`).
4. Chaque ligne de `CHARTE.md` §8 (`sed -n '/^## 8/,/^## 9/p' OUTILS/CHARTE.md` : c'est la seule section de la charte à relire à chaque plan).
5. Après `produire.sh` : `verifier.sh` tout « OK » ; chaque ligne « ATTENTION » traitée :
   - `sauts.py` « saut à t » : un objet surgit, disparaît ou change de place en une image (porte qui claque, accessoire posé ou repris sans geste). Regarde `planche.sh <pN_final.mp4> zoom.png --de t-0.3 --a t+0.3` dans la zone donnée ; corrige (fondu, geste qui pose ou reprend, mouvement sur plusieurs images) ou justifie dans le rapport (coupe voulue, éclair).
   - `sauts.py` « fond nu visible » : du noir pur sur scène (décor absent ou trop court) : ajoute ou élargis le décor. Seule exception : une scène de nuit voulue.
   - `raccord.sh` « raccord pN-1 → pN » : ouvre `out/pN/raccord.png` (fin du plan précédent | ton image 0 | différence ×5) et aligne ton image 0 sur `M.RACC`.
