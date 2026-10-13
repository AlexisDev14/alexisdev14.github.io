---
name: video-explicative
description: Produit une vidéo explicative TikTok de 60 s (6 plans de 10 s, 9:16) en style « théâtre de marionnettes à tiges » (rideau de velours, décors de carton qui montent et descendent, marionnettes de papier articulées). Propose d'abord 3 sujets tirés de la base de questions Clark (Firestore), puis écrit le script satirique et sa version ElevenLabs, la fiche des 6 plans, et réalise les 6 plans animés avec leurs bruitages, un plan après l'autre. À utiliser quand l'utilisateur demande une nouvelle vidéo explicative, une idée de vidéo, ou tape /video-explicative.
---

# Vidéo explicative Clark — théâtre de marionnettes

Vidéo de culture générale pour TikTok : 60 s = 6 plans de 10 s, 1080 × 1920, 30 im/s. L'utilisateur ajoute au montage la voix off (ElevenLabs), les sous-titres, le carton de fin et le logo. Le ton est la marque de fabrique : **accessible, précis, une pointe d'humour satirique à chaque plan**.

Le style est **unique** : un petit théâtre de marionnettes à tiges, plus mature qu'un dessin animé. Tout est décrit dans `outils/CHARTE.md` et réalisé avec le kit de `outils/` (référence de qualité : `outils/exemples/arc-de-triomphe/`).

**Déroulé : 4 étapes, 3 arrêts pour validation (sujet, script, fiche des plans), puis les 6 plans d'un trait sans arrêt.** Ne saute jamais un arrêt.

---

## 0. Organisation, modèles et ressources (à respecter)

La machine est petite (4 processeurs) : **un seul travail lourd à la fois**. Le rendu d'un plan prend ≈ 1 min avec `produire.sh` ; il n'y a donc aucun intérêt à paralléliser les plans, seulement des coûts et des conflits.

| Qui | Modèle | Rôle |
|---|---|---|
| Toi (session principale) | Opus | Jugement : choix des sujets, script, fiche des plans, consignes, contrôle ciblé de chaque plan, contrôle final, échanges avec l'utilisateur. |
| Agent « présélection » | `model: "haiku"` | Étape 1 : lit des centaines de questions Firestore et renvoie une liste courte filtrée. |
| Agent « faits » | `model: "sonnet"` | Étape 2 : vérifie dates, chiffres et attributions sur le web, avec sources. |
| Agent « casting » | `model: "sonnet"` | Étape 4a : crée `persos.js` (personnages, accessoires et décors propres à la vidéo) + planche de casting. |
| Agent « plan N » | `model: "sonnet"` | Étape 4b : code, rend et sonorise UN plan, puis s'arrête. |

Règles :
- **Jamais Fable.** Toujours préciser `model` à l'appel de l'outil Agent.
- **Un seul agent de production actif à la fois** ; les plans s'enchaînent 1 → 6. Pour corriger un plan, relancer le même agent avec SendMessage (il garde son contexte) plutôt qu'en créer un nouveau.
- Les consignes d'agent **renvoient vers les fichiers** (`CHARTE.md`, `API.md`, fiche de la vidéo) au lieu de les recopier.
- Tu ne lis jamais le journal complet d'un agent : seulement son rapport, ses planches et les gros plans utiles.
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
2. Un personnage ou un objet incarnable en marionnette.
3. Un potentiel satirique (ironie, paradoxe, réaction excessive).
4. Un lien avec le quotidien.
5. Des faits vérifiables et intemporels.
6. Trois thèmes différents.
7. La nouveauté par rapport au registre.

Une question souvent ratée (`stats.success_rate` bas) est un bon signe.
Pour chacun des 3 sujets : titre, type de récit, question d'origine, accroche (une phrase), chute pressentie, idée du gag principal **en théâtre de marionnettes** (quel décor monte, quel effet de rideau). Demande le choix (AskUserQuestion). **Arrête-toi.**
Si Firestore est inaccessible, propose 3 sujets de ta connaissance selon les mêmes critères et dis-le.

---

## Étape 2 — Le script (ARRÊT 2)

1. **Faits** : agent `model: "sonnet"` : « Vérifie sur le web (sources de la question + au moins une source indépendante) chaque date, chiffre, nom et attribution de ce récit : […]. Renvoie un tableau fait → confirmé / nuancé / faux, avec URL. » En cas de doute : formuler plus largement ou retirer, et le signaler.
2. **Écriture (toi)** :
   - **6 paragraphes, un par plan, de 22 à 26 mots prononcés** (≈ 10 s à 2,5 mots/s). Compter comme c'est dit : « 1836 » = « mille huit cent trente-six » = 5 mots. Total ≈ 145–150 mots.
   - **Plan 1 — accroche** : mystère léger, sans formule trop appuyée.
   - Le fait clé arrive quand on le découvre à l'image.
   - **Une chute par plan**, courte, sur sa propre phrase, dite à plat (« Évidemment. », « Modestement. »).
   - **Une blague récurrente** posée tôt et résolue au dernier plan. En marionnettes, c'est idéalement un objet emblématique (le bicorne de l'Arc de triomphe).
   - **Morale finale ironique** et réplique de fin.
   - Cibles satiriques sûres : les gens de l'époque, les puissants, la presse, le spectateur. Le personnage central reste sympathique.
   - Vouvoiement.
3. **Livrables** :
   - Le script plan par plan, avec le nombre de mots et la durée.
   - La **version ElevenLabs** (Eleven v3) : années en toutes lettres, une ou deux balises d'intention par phrase au plus ([deadpan], [sarcastic], [amused], [sighs]…), pauses par « … ». Conseils : un paragraphe par plan, stabilité « Natural », chutes à plat.
   - Deux variantes pour l'accroche et pour la chute finale.
   - Les faits incertains.

Demande validation. **Arrête-toi.** Si le texte change, recompte les mots.

---

## Étape 3 — Fiche de la vidéo et consignes des 6 plans (ARRÊT 3)

Écris `<travail>/FICHE.md` puis montre-la :

**A. Distribution** : pour chaque marionnette, accessoire et décor récurrent, une description fixe : silhouette de profil, tenue, couleurs hex dans la palette sourde, pièces articulées utiles, objet emblématique. Précise ce qui existe déjà dans le kit (`outils/API.md` : Napoléon, Marie-Louise, architecte, grenadier, figurants, arcs, colonnes, mer, rocher, ciels…) et ce que le casting doit créer.

**B. Une consigne par plan** (gabarit) :
```
### Plan N/6 — [titre] (10 s)
Voix off : « … » — fenêtres : (0–1,4) … (1,6–3,0) …   Mots-clés : « … » (a–b s)
Chute : … / Gag : … (muet, lisible en 1 s, répond à la chute)
Décor et machinerie : rideau (ouvre à … / change à …), décors qui montent/descendent (quoi, quand)
Marionnettes : qui, fente avant/arrière, entrées/sorties
| Instant | Voix | Image (geste clé sur le mot clé) |
| … | … | … |
| 9–10 s | — | stable (pas de fermeture de rideau) |
Bruitages (actions visibles seulement) : instant → préréglage sfx_lib
Vigilance : risques de lecture, proportions, superpositions, raccord avec le plan précédent
```
Rappels : le plan 1 s'ouvre sur le rideau ; le dernier finit rideau ouvert ; un changement de lieu se fait par la machinerie ou le rideau ; une seule action principale à la fois.

Demande validation. **Arrête-toi.**

---

## Étape 4 — Production (sans arrêt)

### Les outils (`outils/`)
- `CHARTE.md` : règles visuelles, mise en scène, cadrage, bruitages, erreurs déjà commises, contrôle.
- `API.md` : référence du kit (`kit/marionnettes.js`, assemblé depuis `kit/src/` par `kit/assemble.sh`).
- `exemples/arc-de-triomphe/m1…m6` : scènes réussies à imiter.
- `gabarits/` : départ de `scene.js`, `timeline.js` (`TL.EVENTS` et `TL.MOTS`), `mixage.py`.
- `construire.sh <travail>/pN` : prépare le dossier du plan (gabarits, kit, `persos.js` de la vidéo, `index.html`) et vérifie la syntaxe.
- `render.cjs <dossier> --stills 0,60,…` : images clés en PNG.
  - Le rendu est fait par le processeur, en `--workers 3`, environ 13 fois plus vite qu'avant ; ne pas passer `--gpu`.
- `produire.sh <travail>/pN` : rendu complet, puis bruitages, puis `pN_final.mp4`, `planche.png` et `verifier.sh`.
  - Durée : environ 30 à 70 s.
- `planche.sh <mp4> <png> [--de A --a B] [--crop L:H:X:Y]` : planche de 16 images ou gros plan.
- `sfx_lib.py` + `sons/` : bruitages tout faits et clips CC0.
  - Préréglages : `rideau_ouvre`, `rideau_ferme`, `rideau_change`, `decor_monte`, `decor_descend`, `decor_tombe`, `apparition`, `disparition`, `glisse`, `pas`, `objet_pose`, `chute`, `papier`, `ambiance`.
  - `freesound_cc0.py` sert à chercher un nouveau son ; vérifier sa licence CC0 avant de l'utiliser.

### 4a. Casting (un agent Sonnet)
Lancer cette étape seulement si la fiche demande des éléments absents du kit. Consigne :
> Lis `OUTILS/CHARTE.md`, `OUTILS/API.md` et `<travail>/FICHE.md` (section Distribution). Crée `<travail>/persos.js` (chargé après le kit) avec les marionnettes, accessoires et décors listés comme « à créer », dans le style exact du kit (papier découpé de profil, rivets, tiges, hachures, palette sourde). Pour vérifier, crée `<travail>/casting/scene.js` qui les montre tous sur scène (au repos, en marche, gestes clés, de profil dans les deux sens). Lance `bash OUTILS/construire.sh <travail>/casting`, puis `node OUTILS/render.cjs <travail>/casting --out <travail>/out --stills 30,150`, et regarde les images. Itère jusqu'à un résultat propre, au plus 4 fois. Règles : `CHARTE.md` sections 4 et 8. Rapport court : liste des fonctions créées (nom, options, pièces articulées).

Toi : regarde la planche de casting. Si un défaut est visible, renvoie-le à l'agent une seule fois. Une fois la distribution figée, ne la change plus.

### 4b. Les 6 plans, l'un après l'autre (un agent Sonnet par plan)
Pour N = 1 à 6, attendre la fin de N avant de lancer N + 1 :
> Tu réalises le plan N/6 de la vidéo « … ». Lis dans l'ordre : `OUTILS/CHARTE.md`, `OUTILS/API.md`, `<travail>/FICHE.md` (distribution + consigne du plan N), l'exemple le plus proche `OUTILS/exemples/arc-de-triomphe/m?` [à choisir], et le `scene.js` du plan N−1 s'il existe (raccord, réutilise ses fonctions). Méthode :
> 1. Lance `bash OUTILS/construire.sh <travail>/pN`.
> 2. Écris `timeline.js` (instants calés sur les fenêtres de la voix, `TL.MOTS`), puis `scene.js`, puis `mixage.py` (préréglages de `sfx_lib` uniquement pour les actions visibles).
> 3. Rends les images clés : `node OUTILS/render.cjs <travail>/pN --out <travail>/out --stills 0,30,60,…,299` plus les instants clés. Regarde-les et corrige ; 3 tours au plus, puis gros plans sur les zones à risque.
> 4. Lance `bash OUTILS/produire.sh <travail>/pN`. Regarde `planche.png`. `verifier.sh` doit être tout « OK », et `mixage.py` ne doit afficher aucune ligne « ATTENTION ».
>
> Interdits : texte, lettres, chiffres, logos ; doigt seul tendu ; fermeture de rideau en fin de plan ; lancer un second rendu en parallèle ; git. Ne modifie ni `OUTILS/` ni `persos.js`. Ce qui est propre au plan va dans `scene.js` ; si un correctif de `persos.js` est indispensable, décris-le dans ton rapport.
>
> Rapport court : chemin de `pN_final.mp4` ; déroulé seconde par seconde calé sur la voix ; bruitages (instant → préréglage) ; limites connues.

**Contrôle ciblé (toi), avant d'envoyer le plan** :
- Lis `planche.png`, puis fais 1 ou 2 gros plans avec `planche.sh` : geste clé et chute, mains et tiges, objet du gag, bords du cadre.
- Vérifie le raccord avec le plan précédent (mêmes personnages, même objet emblématique) et la liste « Erreurs déjà commises » (`CHARTE.md` §8).
- En cas de défaut, renvoie à l'agent du plan (SendMessage) une demande précise et une seule.
- Sinon, **envoie le plan tout de suite** (SendUserFile, le fichier `pN_final.mp4`) avec un résumé en 3 à 6 lignes, puis lance le plan suivant.

### 4c. Contrôle final ciblé (toi, une fois les 6 plans faits)
Pas de nouveau rendu complet. Vérifie seulement :
- les raccords entre les plans : fin de N contre début de N+1, objets, tenues, lumière ;
- l'homogénéité du son : `verifier.sh` sur les 6 fichiers, des crêtes proches d'un plan à l'autre ;
- que la blague récurrente est bien résolue au dernier plan, et que le rideau y reste ouvert.

**Ne fais pas de montage assemblant les 6 plans** (l'utilisateur n'en veut pas). Ne pousse jamais les rendus dans Git.

### Livraison
- Chaque plan est envoyé dans la conversation dès qu'il a passé ton contrôle.
- À la fin, rappelle à l'utilisateur les réglages de montage :
  - sous-titres sur 2 lignes au maximum, vers 65–72 % de la hauteur, avec le mot de la chute en couleur ;
  - vidéo complète à −14 LUFS, crête à −1 dBFS ;
  - carton de fin et logo en haut à gauche.
- **Dépôt sur le Drive Clark** (connecteur Google Drive, chercher « Google_Drive » avec ToolSearch) :
  1. Dossier parent : « Vidéos » à la racine du Drive Clark (id `1GoKRhXejq2FgNvA0trdSRBmC9uBrZmE_` ; s'il a disparu, le retrouver avec `search_files` : `parentId = 'root' and title = 'Vidéos'`).
  2. Y créer un dossier au nom du sujet (ex. « Arc de triomphe »), avec `create_file` et `contentMimeType` = `application/vnd.google-apps.folder`.
  3. Y créer le fichier texte `<Sujet> — script et publication.txt` (`contentMimeType: text/plain`, `disableConversionToGoogleType: true`). Il contient :
     - un **titre** accrocheur (≤ 80 caractères) ;
     - une **description piquante** (2 à 3 phrases dans le ton satirique de la vidéo, avec la chute en clin d'œil, un emoji au plus) ;
     - **5 hashtags** (le thème, le personnage, le sujet, puis #culturegenerale et un tag large) ;
     - le **script** plan par plan ;
     - la liste des fichiers vidéo et le rappel des réglages de montage.

     Modèle : le fichier « Arc de triomphe — script et publication.txt ».
  4. **Les 6 vidéos** : le connecteur Drive n'accepte un fichier que recopié en entier dans l'appel (base64). C'est impossible pour des MP4 de plusieurs Mo, donc ne pas essayer. Les vidéos restent livrées dans la conversation, et tu dis à l'utilisateur de les glisser dans le dossier (donne son lien). Si un outil permettant d'envoyer un fichier local sur Drive devient disponible, l'utiliser pour y déposer `p1_final.mp4` … `p6_final.mp4`.
- Passe le sujet à « livrée » dans `videos-realisees.md`, committe ce fichier et pousse-le.
- Ajoute à `outils/CHARTE.md` §8 tout nouveau défaut relevé par l'utilisateur (et committe-le), pour qu'il ne revienne pas.
