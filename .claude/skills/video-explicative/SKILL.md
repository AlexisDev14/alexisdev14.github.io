---
name: video-explicative
description: Produit une vidéo explicative TikTok de 60 s (6 plans de 10 s, 9:16) en style « théâtre de marionnettes à tiges » (rideau de velours, décors de carton qui montent et descendent, marionnettes de papier articulées). Propose d'abord 3 sujets tirés de la base de questions Clark (Firestore), puis écrit le script satirique, sa version ElevenLabs et la fiche des 6 plans, et réalise les 6 plans animés avec leurs bruitages. À utiliser quand l'utilisateur demande une nouvelle vidéo explicative, une idée de vidéo, ou tape /video-explicative.
---

# Vidéo explicative Clark — théâtre de marionnettes

Vidéo de culture générale pour TikTok : 60 s = 6 plans de 10 s, 1080 × 1920, 30 im/s. L'utilisateur ajoute au montage la voix off (ElevenLabs), les sous-titres, le carton de fin et le logo. Le ton est la marque de fabrique : **accessible, précis, une pointe d'humour satirique à chaque plan**.

Le style est **unique** : un petit théâtre de marionnettes à tiges, plus mature qu'un dessin animé. Tout est décrit dans `outils/CHARTE.md` et réalisé avec le kit de `outils/` (référence de qualité : `outils/exemples/arc-de-triomphe/`, et les personnages validés de `outils/bibliotheque/`).

**Déroulé : 3 étapes, 2 arrêts pour validation (1. le sujet ; 2. le script + la fiche des plans), puis les 6 plans sans arrêt.** Ne saute jamais un arrêt.

---

## 0. Organisation, modèles et ressources (à respecter)

La machine est petite (4 processeurs). Un rendu complet prend ≈ 1 min ; **les rendus passent un par un** (verrou intégré à `render.cjs` : un rendu lancé pendant un autre attend tout seul). Ce qui coûte du temps, ce n'est pas le rendu, ce sont les allers-retours : on les évite en réutilisant ce qui est validé (bibliothèque), en écrivant des fiches précises, et en contrôlant chaque plan **avant** de l'envoyer.

| Qui | Modèle | Effort | Rôle |
|---|---|---|---|
| Toi (session principale) | Opus | (session) | Jugement : choix des sujets, script, fiche, conduite du rideau, consignes, contrôle visuel de chaque plan, contrôle final, échanges avec l'utilisateur. |
| Agent « présélection » | `model: "haiku"` | `effort: "low"` | Étape 1 : lit des centaines de questions Firestore et renvoie une liste courte filtrée (tri en volume : le rôle type de Haiku). |
| Agent « faits » | `model: "sonnet"` | `effort: "medium"` | Étape 2 : vérifie dates, chiffres et attributions sur le web, avec sources. |
| Agent « casting » | `model: "opus"` | `effort: "high"` | Étape 3a : crée `persos.js` + planche de casting. Opus car c'est le travail le plus visuel et le plus durable (les personnages rejoignent la bibliothèque) : la plupart des retours de l'utilisateur portaient sur l'apparence des personnages. |
| Agent « plan N » | `model: "sonnet"` | `effort: "high"` | Étape 3b : code, rend et sonorise UN plan, puis s'arrête. |

Règles :
- **Jamais Fable.** Toujours préciser `model` **et `effort`** (valeurs ci-dessus) à l'appel de l'outil Agent : sans `model`, un agent hérite d'Opus et coûte bien plus cher pour rien.
- **Escalade** : si l'utilisateur renvoie **deux fois le même défaut** sur un plan, ou si l'agent Sonnet échoue deux fois à le corriger, relance ce plan avec un agent `model: "opus"` (même consigne + `scene.js` existant + le défaut précis) au lieu d'insister.
- **Enchaînement en tuilage** : dès que l'agent du plan N rend son rapport, lance l'agent du plan N+1 (en arrière-plan), **puis** fais ton contrôle du plan N. Au plus 2 agents de production actifs (N+1 qui avance, N en correction) ; leurs rendus se suivent grâce au verrou. Pour corriger un plan, relance le même agent avec SendMessage (il garde son contexte).
- **Langue** : tout reste en français (charte, fiches, consignes, rapports) : Claude y garde ≈ 97–98 % de son niveau en anglais, et l'utilisateur doit pouvoir lire et corriger les règles. Les noms de code (fonctions, options) restent tels quels.
- **Forme des consignes** : un agent ne voit rien de cette conversation. Structure chaque consigne avec des balises : `<contexte>` (vidéo, plan, fichiers à lire), `<tache>` (étapes numérotées), `<regles>` (interdits, rappels propres à ce plan, défauts déjà relevés par l'utilisateur), `<rapport>` (format court attendu). Le rapport doit rester court : il revient dans ton contexte.
- Les consignes d'agent **renvoient vers les fichiers** (`CHARTE.md`, `API.md`, `bibliotheque/LISEZMOI.md`, fiche de la vidéo) au lieu de les recopier.
- Tu ne lis jamais le journal complet d'un agent : seulement son rapport, ses planches et les gros plans utiles.
- Ces choix (modèle, effort, langue, forme des consignes) viennent de la documentation Anthropic et de retours d'utilisateurs : détail et sources dans `outils/MODELES.md`. À revoir à chaque nouvelle génération de modèles.
- Dossier de travail : `<scratchpad>/<slug-du-sujet>/` (jamais dans le dépôt). `OUTILS` = chemin absolu du dossier `outils/` à côté de ce fichier.

---

## Étape 1 — Proposer 3 sujets (ARRÊT 1)

### Anti-doublon
- Lire `videos-realisees.md`. Écarter toute question dont l'id y figure et tout sujet qui partage un personnage, un objet, un événement ou un mot-clé de la colonne « Mots-clés à écarter ».
- Varier le **type de récit** : aucun des 3 sujets ne reprend le type des 2 dernières vidéos (sauf demande), et les 3 ont 3 types différents.
- Dès que l'utilisateur choisit : ajouter sa ligne au registre (statut « en cours »), la passer à « livrée » à la fin ; committer et pousser **ce seul fichier** (jamais les rendus).

### Présélection (agent Haiku)
Lance un agent `model: "haiku"` avec cette consigne (à compléter) :
> Lis la collection Firestore `questions` du projet `clark-app-9b938` (connecteur Firestore Clark, outil `list_documents`, chercher « Firestore_Clark » avec ToolSearch ; parent `projects/clark-app-9b938/databases/(default)/documents` ; `orderBy: "random_id"`, `pageSize` 300, 2 pages différentes ; `mask` : text, choices, correct_answer_index, theme_code, type, status, qc, explanation, stats). **Lecture seule.** Si une réponse est enregistrée dans un fichier, analyse-la avec `python3 -I`. Garde seulement `status` ACTIVE, `qc.status` pass, `type` EVERGREEN, et écarte les ids et mots-clés suivants : [liste du registre]. Renvoie les 15 meilleures pour une vidéo-récit (anecdote avec ironie ou retournement, personnage ou objet dessinable, lien avec le quotidien, faits intemporels), sur au moins 5 thèmes : pour chacune id, theme_code, question, réponse, anecdote en 2 lignes, taux de réussite.

### Choix (toi)
Critères :
1. Un récit en 6 temps (situation → problème → décision → conséquence → réaction → retournement).
2. Un personnage ou un objet incarnable en marionnette (bonus : déjà dans la bibliothèque).
3. Un potentiel satirique (ironie, paradoxe, réaction excessive).
4. Un lien avec le quotidien.
5. Des faits vérifiables et intemporels.
6. Trois thèmes différents.
7. La nouveauté par rapport au registre.

Une question souvent ratée (`stats.success_rate` bas) est un bon signe.
Pour chacun des 3 sujets : titre, type de récit, question d'origine, accroche (une phrase), chute pressentie, idée du gag principal **en théâtre de marionnettes** (quel décor monte, quel effet de rideau). Demande le choix (AskUserQuestion). **Arrête-toi.**
Si Firestore est inaccessible, propose 3 sujets de ta connaissance selon les mêmes critères et dis-le.

---

## Étape 2 — Script + fiche des plans (ARRÊT 2, un seul arrêt pour les deux)

Dès le choix : lance l'agent « faits » **en arrière-plan** et commence la fiche (distribution, décors) pendant qu'il cherche ; le script s'écrit quand ses résultats arrivent.

1. **Faits** : agent `model: "sonnet"` : « Vérifie sur le web (sources de la question + au moins une source indépendante) chaque date, chiffre, nom et attribution de ce récit : […]. Renvoie un tableau fait → confirmé / nuancé / faux, avec URL. » En cas de doute : formuler plus largement ou retirer, et le signaler.
2. **Script (toi)** :
   - **6 paragraphes, un par plan, de 22 à 26 mots prononcés** (≈ 10 s à 2,5 mots/s). Compter comme c'est dit : « 1836 » = « mille huit cent trente-six » = 5 mots. Total ≈ 145–150 mots.
   - **Plan 1 — accroche** : mystère léger, sans formule trop appuyée.
   - Le fait clé arrive quand on le découvre à l'image.
   - **Une chute par plan**, courte, sur sa propre phrase, dite à plat (« Évidemment. », « Modestement. »).
   - **Une blague récurrente** posée tôt et résolue au dernier plan. En marionnettes, c'est idéalement un objet ou un personnage emblématique (le bicorne de l'Arc de triomphe, la vache complice du reblochon).
   - **Morale finale ironique** et réplique de fin.
   - Cibles satiriques sûres : les gens de l'époque, les puissants, la presse, le spectateur. Le personnage central reste sympathique.
   - Vouvoiement.
3. **Fiche (toi)** : `<travail>/FICHE.md`, puis `<travail>/rideau.json` :

   **A. Distribution** : pour chaque marionnette, accessoire et décor récurrent, une description fixe : silhouette de profil, tenue, couleurs hex dans la palette sourde, pièces articulées utiles, objet emblématique, **taille à l'écran** (personnage principal ≥ 450 px ; plus petit si la scène est nombreuse, tant qu'elle reste claire). Pour chaque élément, dire d'où il vient : **kit** (`API.md` §4–6), **bibliothèque** (`bibliotheque/LISEZMOI.md` : vache, paysan, moine, chalet, montagnes…) ou **à créer**. Réutiliser d'abord.

   **B. Conduite du rideau** (CHARTE §5, API §4b) : un tableau sur 60 s (temps globaux) : ouverture au plan 1, `change` à cheval sur chaque coupe qui change de lieu ou d'époque, `demi` pour une ellipse de temps, rien quand l'action continue, **fermeture après la chute du plan 6**. Le même contenu en `rideau.json`.

   **C. Une consigne par plan** (gabarit) :
```
### Plan N/6 — [titre] (10 s)
Voix off : « … » — fenêtres : (0–1,4) … (1,6–3,0) …   Mots-clés : « … » (a–b s)
Chute : … / Gag : … (muet, lisible en 1 s, répond à la chute)
Rideau (d'après la conduite) : état à 0 s → mouvements dans le plan (a–b s) → état à 10 s
Décor et machinerie : décors qui montent/descendent (quoi, quand) ; extérieur → faune/flore lointaine (quoi, où, quand)
Marionnettes : qui (kit / bibliothèque / persos), taille, fente avant/arrière, entrées/sorties
| Instant | Voix | Image (geste clé sur le mot clé) |
| … | … | … |
| 9–10 s | — | stable, ou fermeture du rideau si la conduite la prévoit |
Bruitages (actions visibles seulement ; le rideau est automatique) : instant → préréglage sfx_lib
Vigilance : objets tenus (la main entoure le corps de l'objet), transitions de posture par étapes, proportions, superpositions, raccord avec le plan précédent
```
   Rappels : une seule action principale à la fois ; le gag tombe avec la chute ; tout passage de posture se fait par étapes (0,8–1,2 s).
4. **Livrables de l'arrêt** (un seul message) :
   - le script plan par plan, avec le nombre de mots et la durée ;
   - la **version ElevenLabs** (Eleven v3) : années en toutes lettres, une ou deux balises d'intention par phrase au plus ([deadpan], [sarcastic], [amused], [sighs]…), pauses par « … ». Conseils : un paragraphe par plan, stabilité « Natural », chutes à plat ;
   - deux variantes pour l'accroche et pour la chute finale ;
   - les faits incertains ;
   - la fiche résumée : distribution (kit / bibliothèque / à créer), conduite du rideau, et pour chaque plan le décor, le gag et la faune.
5. **Casting anticipé** : s'il y a des éléments « à créer », lance l'agent casting (3a) **en arrière-plan juste avant de t'arrêter** : il travaille pendant que l'utilisateur lit. Si l'utilisateur change la distribution, corrige-le par SendMessage.

Demande validation. **Arrête-toi.** Si le texte change, recompte les mots et mets à jour la fiche et `rideau.json` (sans nouvel arrêt, sauf changement de fond).

---

## Étape 3 — Production (sans arrêt)

### Les outils (`outils/`)
- `CHARTE.md` : règles visuelles, mise en scène, rideau, faune, cadrage, bruitages, erreurs déjà commises, contrôle.
- `API.md` : référence du kit (`kit/marionnettes.js`, assemblé depuis `kit/src/` par `kit/assemble.sh`), de la conduite du rideau (§4b) et de la faune (§4c).
- `bibliotheque/` : personnages, accessoires et décors validés des vidéos précédentes (index : `LISEZMOI.md`), chargés automatiquement dans chaque plan.
- `exemples/arc-de-triomphe/m1…m6` : scènes réussies à imiter (sauf leur rideau codé à la main).
- `gabarits/` : départ de `scene.js` (avec `M.rideau(t)`), `timeline.js` (`TL.EVENTS` et `TL.MOTS`), `mixage.py` (avec `m.rideau_conduite()`).
- `construire.sh <travail>/pN` : prépare le dossier du plan (gabarits, kit, bibliothèque, conduite du rideau, `persos.js`, `index.html`) et vérifie la syntaxe.
- `render.cjs <dossier> --stills 0,60,…` : images clés en PNG **et `planche_cles.png`** (toutes sur une image : la regarder d'abord). Rendu processeur, `--workers 3` pour le complet ; ne pas passer `--gpu`. Verrou : les rendus se suivent.
- `produire.sh <travail>/pN` : rendu complet, puis bruitages, puis `pN_final.mp4`, `planche.png` et `verifier.sh` (≈ 30 à 70 s).
- `planche.sh <mp4> <png> [--de A --a B] [--crop L:H:X:Y]` : planche de 16 images ou gros plan.
- `sfx_lib.py` + `sons/` : bruitages tout faits et clips CC0.
  - Préréglages : `rideau_conduite` (automatique), `decor_monte`, `decor_descend`, `decor_tombe`, `apparition`, `disparition`, `glisse`, `pas`, `objet_pose`, `chute`, `papier`, `ambiance`.
  - `freesound_cc0.py` sert à chercher un nouveau son ; vérifier sa licence CC0 avant de l'utiliser.

### 3a. Casting (un agent Opus, seulement pour ce qui est « à créer »)
Consigne :
> Lis `OUTILS/CHARTE.md`, `OUTILS/API.md`, `OUTILS/bibliotheque/LISEZMOI.md` et `<travail>/FICHE.md` (section Distribution). Crée `<travail>/persos.js` (chargé après le kit et la bibliothèque) avec **seulement** les marionnettes, accessoires et décors marqués « à créer », dans le style exact du kit (papier découpé de profil, rivets, tiges, hachures, palette sourde) ; espace de noms propre à la vidéo (jamais `M.reb`). Les accessoires n'ont pas de tige (ils volent) ; les mains peuvent les tenir par leur corps. Pour vérifier, crée `<travail>/casting/scene.js` qui les montre tous sur scène (au repos, en marche, gestes clés, de profil dans les deux sens, objets tenus). Lance `bash OUTILS/construire.sh <travail>/casting`, puis `node OUTILS/render.cjs <travail>/casting --out <travail>/out --stills 30,150` et regarde `planche_cles.png`. Itère jusqu'à un résultat propre, au plus 4 fois. Règles : `CHARTE.md` sections 4 et 8. Rapport court : liste des fonctions créées (nom, options, pièces articulées).

Toi : regarde la planche de casting. Si un défaut est visible, renvoie-le à l'agent une seule fois. Une fois la distribution figée, ne la change plus.

### 3b. Les 6 plans (un agent Sonnet par plan, en tuilage)
Pour N = 1 à 6 (l'agent N+1 démarre dès le rapport de N, voir §0) :
> Tu réalises le plan N/6 de la vidéo « … ». Lis dans l'ordre : `OUTILS/CHARTE.md`, `OUTILS/API.md`, `OUTILS/bibliotheque/LISEZMOI.md`, `<travail>/FICHE.md` (distribution, conduite du rideau, consigne du plan N), l'exemple le plus proche `OUTILS/exemples/arc-de-triomphe/m?` [à choisir], et le `scene.js` du plan N−1 s'il existe (raccord, réutilise ses fonctions). Méthode :
> 1. Lance `bash OUTILS/construire.sh <travail>/pN`.
> 2. Écris `timeline.js` (instants calés sur les fenêtres de la voix, `TL.MOTS`), puis `scene.js`, puis `mixage.py` (garde `m.rideau_conduite()` ; préréglages de `sfx_lib` uniquement pour les actions visibles).
>    - Rideau : **`M.rideau(t)`** seulement (jamais codé à la main) ; changement de décor avec `M.rideauApres(t, 'id')`.
>    - Extérieur : la faune et la flore de la fiche (API §4c), petites, pâlies, posées sur un relief.
>    - Personnages et objets de la bibliothèque ou de `persos.js` : ne pas les redessiner.
> 3. Rends les images clés : `node OUTILS/render.cjs <travail>/pN --out <travail>/out --stills 0,30,60,…,299` plus les instants clés. Regarde `planche_cles.png`, puis en grand les images utiles, et corrige ; 3 tours au plus, puis gros plans sur les zones à risque.
> 4. **Auto-contrôle avant le rendu complet**, point par point sur les images : chaque ligne de `CHARTE.md` §8 ; mains qui tiennent les objets par leur corps ; passages de posture par étapes ; rideau conforme à la conduite à 0 s et à 10 s ; rien d'important dans les zones interdites.
> 5. Lance `bash OUTILS/produire.sh <travail>/pN`. Regarde `planche.png`. `verifier.sh` doit être tout « OK », et `mixage.py` ne doit afficher aucune ligne « ATTENTION ».
>
> Interdits : texte, lettres, chiffres, logos ; doigt seul tendu ; rideau codé à la main ; git. Ne modifie ni `OUTILS/`, ni `persos.js`, ni `rideau.json`. Ce qui est propre au plan va dans `scene.js` ; si un correctif de `persos.js` ou de la conduite est indispensable, décris-le dans ton rapport.
>
> Rapport court : chemin de `pN_final.mp4` ; déroulé seconde par seconde calé sur la voix ; bruitages (instant → préréglage) ; limites connues.

**Contrôle ciblé (toi), avant d'envoyer le plan** :
- Lis `planche.png`, puis fais 1 ou 2 gros plans avec `planche.sh` : geste clé et chute, mains et objets tenus, transitions de posture, bords du cadre.
- Vérifie le raccord avec le plan précédent (mêmes personnages, même objet emblématique, **même état du rideau à la coupe**) et la liste « Erreurs déjà commises » (`CHARTE.md` §8).
- En cas de défaut, renvoie à l'agent du plan (SendMessage) une demande précise et une seule.
- Sinon, **envoie le plan tout de suite** (SendUserFile, le fichier `pN_final.mp4`) avec un résumé en 3 à 6 lignes.
- Un retour de l'utilisateur sur un plan déjà envoyé : le transmettre à l'agent de ce plan (SendMessage) ; si c'est un défaut général, l'ajouter aussi à `CHARTE.md` §8 et le signaler à l'agent du plan en cours.

### 3c. Contrôle final ciblé (toi, une fois les 6 plans faits)
Pas de nouveau rendu complet. Vérifie seulement :
- les raccords entre les plans : fin de N contre début de N+1 (rideau, objets, tenues, lumière) ;
- l'homogénéité du son : `verifier.sh` sur les 6 fichiers, des crêtes proches d'un plan à l'autre ;
- que la blague récurrente est bien résolue au dernier plan, et que le rideau s'y ferme après la chute.

**Ne fais pas de montage assemblant les 6 plans** (l'utilisateur n'en veut pas). Ne pousse jamais les rendus dans Git.

### Livraison
- Chaque plan est envoyé dans la conversation dès qu'il a passé ton contrôle.
- À la fin, rappelle à l'utilisateur :
  - les réglages de montage :
    - sous-titres sur 2 lignes au maximum, vers 65–72 % de la hauteur, avec le mot de la chute en couleur ;
    - vidéo complète à −14 LUFS, crête à −1 dBFS ;
    - carton de fin et logo en haut à gauche ;
  - de garder les plans **dans l'ordre et bout à bout** : le rideau et son bruitage chevauchent certaines coupes.
- **Dépôt sur le Drive Clark** :
  1. Écris `<travail>/<Sujet> — script et publication.txt`. Il contient :
     - un **titre** accrocheur (≤ 80 caractères) ;
     - une **description piquante** (2 à 3 phrases dans le ton satirique de la vidéo, avec la chute en clin d'œil, un emoji au plus) ;
     - **5 hashtags** (le thème, le personnage, le sujet, puis #culturegenerale et un tag large) ;
     - le **script** plan par plan ;
     - la liste des fichiers vidéo et le rappel des réglages de montage.
     - le **prompt de couverture** (voir ci-dessous).

     Modèle : le fichier « Arc de triomphe — script et publication.txt » du Drive.
  2. Envoie tout d'un coup : `python3 -I OUTILS/drive_envoi.py "<Sujet>" "<travail>/<Sujet> — script et publication.txt" <travail>/out/p1/p1_final.mp4 … <travail>/out/p6/p6_final.mp4`.
     - Le script crée (ou retrouve) le dossier « <Sujet> » dans « Vidéos » (id `1GoKRhXejq2FgNvA0trdSRBmC9uBrZmE_`) et y dépose les fichiers, en envoi « resumable ». Il affiche le lien du dossier.
     - Il passe par le secret réseau `GOOGLE_DRIVE` de l'environnement : type Body parameter sur `oauth2.googleapis.com/token`, avec `client_id`, `client_secret` et `refresh_token`. Le proxy injecte ces valeurs : ne jamais chercher à les lire ni à les afficher.
     - Ne pas passer par le connecteur Drive pour les vidéos (base64 impossible au-delà de quelques Ko).
     - Si le jeton est refusé (`invalid_grant`), le refresh token a été révoqué. Livre alors les vidéos dans la conversation et dis à l'utilisateur de régénérer le jeton dans OAuth Playground, en mode « Offline », puis de mettre à jour le secret.
- **Prompt de couverture** (miniature TikTok, générée par l'utilisateur dans un générateur d'images) : à donner aussi dans la conversation, prêt à copier. Validé par l'utilisateur : **rideau rouge fermé en fond, l'objet emblématique du sujet seul devant (pas de personnage), un titre accrocheur dans le tiers haut**. C'est la seule image où du texte est permis. Prompt **en anglais**, titre en français entre guillemets, **court** (4 à 7 mots : les générateurs écrivent mal les titres longs), sur ce modèle :
  ```
  Elegant minimalist vertical cover illustration, 9:16. Background: only a closed deep red velvet theatre curtain
  filling the whole frame, soft vertical folds, warm light pooling in the centre, darker at the edges; the curtain
  falls onto a red velvet floor. No proscenium, no stage frame, no landscape, no audience, no characters, no animals.
  In front of the curtain, in the lower half: [L'OBJET EMBLÉMATIQUE SEUL, décrit précisément : forme, matière,
  couleurs, détail du gag], lit by a single soft spotlight, as a paper-cut theatre prop with thin white die-cut edge,
  fine engraving hatching and paper texture, soft shadow on the velvet.
  In the upper third, a title in French, exactly: "[TITRE]" — elegant classic serif lettering in aged gold leaf,
  centered on two or three lines, slightly embossed, perfectly spelled with French accents.
  Muted vintage palette: ivory, ochre, aged gold against the red velvet. Centered, uncluttered, gentle vignette,
  fine grain, refined and sober. No other text, no logo, no watermark.
  ```
  Négatif : `extra text, misspelled words, logo, watermark, cow, animal, person, puppet, landscape, stage frame, proscenium, audience seats, 3D render, plastic, glossy, anime, clutter`. Format 9:16 (Midjourney : `--ar 9:16 --style raw`). Proposer 3 titres au choix ; si le générateur écorche le titre, l'utilisateur peut l'ajouter au montage (prompt sans la ligne du titre).
- Passe le sujet à « livrée » dans `videos-realisees.md`.
- **Enrichis la bibliothèque** : copie `<travail>/persos.js` (s'il existe) dans `outils/bibliotheque/<slug>.js` (première ligne = description, espace de noms propre), ajoute sa section à `bibliotheque/LISEZMOI.md` (contenu, options éprouvées, ce que l'utilisateur a validé).
- Ajoute à `outils/CHARTE.md` §8 tout nouveau défaut relevé par l'utilisateur, pour qu'il ne revienne pas.
- Committe et pousse ces fichiers (registre, bibliothèque, charte), jamais les rendus.
