---
name: video-explicative
description: Produit une vidéo explicative TikTok de 60 s (6 plans de 10 s, 9:16) en style « théâtre de marionnettes à tiges » (rideau de velours, décors de carton qui montent et descendent, marionnettes de papier articulées). Propose d'abord 3 sujets tirés de la base de questions Clark (Firestore), puis écrit le script satirique, sa version ElevenLabs et la fiche des 6 plans, et réalise les 6 plans animés avec leurs bruitages. À utiliser quand l'utilisateur demande une nouvelle vidéo explicative, une idée de vidéo, ou tape /video-explicative.
---

# Vidéo explicative Clark — théâtre de marionnettes

Vidéo de culture générale pour TikTok : 60 s = 6 plans de 10 s, 1080 × 1920, 30 im/s. L'utilisateur ajoute au montage la voix off (ElevenLabs), les sous-titres, le carton de fin et le logo. Le ton est la marque de fabrique : **accessible, précis, une pointe d'humour satirique à chaque plan**.

Le style est **unique** : un petit théâtre de marionnettes à tiges, plus mature qu'un dessin animé. Tout est décrit dans `outils/CHARTE.md` et réalisé avec le kit de `outils/` (référence de qualité : `outils/exemples/arc-de-triomphe/`, et les personnages validés de `outils/bibliotheque/`).

**Déroulé : 3 étapes, 2 arrêts pour validation (1. le sujet ; 2. le script + la fiche des plans), puis les 6 plans sans arrêt.** Ne saute jamais un arrêt, sauf en **mode autonome** (ci-dessous).

- **Mode autonome** : si l'utilisateur dit d'enchaîner sans lui (« je pars, fais les six plans »), saute les arrêts restants ; écris la fiche, lance le casting et la production, et donne la fiche résumée (distribution, conduite du rideau, gag de chaque plan) dans le premier message de production. Les choix de fond déjà validés (sujet, script) ne changent pas.
- **Refaire une vidéo déjà livrée** (autre style, nouvelle version) : pas d'étape 1. Retrouve d'abord, dans l'ordre : la ligne du registre (id de la question, thème, lien du dossier Drive, id du contenu au BO) ; le contenu du planificateur du BO (connecteur Firestore Clark, `get_document` sur `video_slots/<id du contenu>`, lecture seule : script, version ElevenLabs, prompt de couverture, titre, description) ; pour une vidéo livrée avant le 15/10, le fichier texte de son dossier Drive ; à défaut l'historique des sessions. Puis **liste les gags et idées de mise en scène de l'ancienne version** (rapports, fiche, fichiers `scene.js` s'ils existent, sinon demande à l'utilisateur ce qu'il avait aimé) : la fiche les reprend par défaut, adaptés au nouveau style. (Leçon de « Monsieur Poubelle » : l'inconnu qui sort de la poubelle, oublié puis redemandé.)
- **Retour ambigu** : après la livraison, si un retour vise un élément présent à la fois dans les vidéos et sur la couverture (ou dans plusieurs plans), pose une question courte avant de lancer quoi que ce soit. (« Le chapeau fait trop Napoléon » visait le prompt de couverture, pas les vidéos.)

---

## 0. Organisation, modèles et ressources (à respecter)

La machine est petite (4 processeurs). Un rendu complet prend ≈ 1 min ; **les rendus passent un par un** (verrou intégré à `render.cjs` : un rendu lancé pendant un autre attend tout seul). Ce qui coûte du temps, ce n'est pas le rendu, ce sont les allers-retours : on les évite en réutilisant ce qui est validé (bibliothèque), en écrivant des fiches précises, et en contrôlant chaque plan **avant** de l'envoyer.

| Qui | Modèle | Effort | Rôle |
|---|---|---|---|
| Toi (session principale) | Opus | (session) | Jugement : choix des sujets, script, fiche, conduite du rideau, consignes, contrôle visuel de chaque plan, contrôle final, échanges avec l'utilisateur. |
| Agent « présélection » | `model: "haiku"` | `effort: "low"` | Étape 1 : lit des centaines de questions Firestore et renvoie une liste courte filtrée (tri en volume : le rôle type de Haiku). |
| Agent « faits » | `model: "sonnet"` | `effort: "medium"` | Étape 2 : vérifie dates, chiffres et attributions sur le web, avec sources. |
| Agent « casting » | `subagent_type: "video-atelier"` + `model: "opus"` | `high` (fixé par l'agent) | Étape 3a : crée `persos.js`, son mode d'emploi `persos.md` et la planche de casting. Opus car c'est le travail le plus visuel et le plus durable (les personnages rejoignent la bibliothèque) : la plupart des retours de l'utilisateur portaient sur l'apparence des personnages. |
| Agent « plan N » | `subagent_type: "video-atelier"` (Sonnet) | `high` (fixé par l'agent) | Étape 3b : code, rend et sonorise UN plan, puis s'arrête. |

**Agent dédié `video-atelier`** (`.claude/agents/video-atelier.md` à la racine du dépôt) : Sonnet, effort `high`, outils limités à Bash, Read, Write et Edit, sans le `CLAUDE.md` du projet de la session (`omitClaudeMd`). Chaque appel démarre donc avec un contexte bien plus léger qu'un agent généraliste, et ses règles de lecture (mémos, `persos.md`, jamais un gros fichier en entier) sont dans sa définition. Le casting l'appelle avec `model: "opus"`. S'il n'apparaît pas dans la liste des types d'agents (session lancée hors de ce dépôt, ou ouverte avant son ajout : en local, un lien `~/.claude/agents/video-atelier.md` vers ce fichier le rend disponible partout), prends `general-purpose` avec `model: "sonnet"` (ou `"opus"` pour le casting) et `effort: "high"`, et ajoute en tête du `<contexte>` : « Tes règles de travail sont dans `<dépôt>/.claude/agents/video-atelier.md` (sous l'en-tête) : lis-les d'abord. »

Règles :
- **Jamais Fable.** Toujours préciser `model` **et `effort`** (valeurs ci-dessus) à l'appel de l'outil Agent, sauf pour `video-atelier` qui les fixe lui-même (seul le casting passe `model: "opus"`) : sans `model`, un agent généraliste hérite d'Opus et coûte bien plus cher pour rien.
- **Escalade** : si l'utilisateur renvoie **deux fois le même défaut** sur un plan, ou si l'agent Sonnet échoue deux fois à le corriger, relance ce plan avec un agent `video-atelier` et `model: "opus"` (même consigne + `scene.js` existant + le défaut précis) au lieu d'insister.
- **Enchaînement en tuilage** : dès que l'agent du plan N rend son rapport, lance l'agent du plan N+1 (en arrière-plan), **puis** fais ton contrôle du plan N. Au plus 2 agents de production actifs (N+1 qui avance, N en correction) ; leurs rendus se suivent grâce au verrou. Pour corriger un plan, relance le même agent avec SendMessage (il garde son contexte).
- **Langue** : tout reste en français (charte, fiches, consignes, rapports) : Claude y garde ≈ 97–98 % de son niveau en anglais, et l'utilisateur doit pouvoir lire et corriger les règles. Les noms de code (fonctions, options) restent tels quels.
- **Forme des consignes** : un agent ne voit rien de cette conversation. Structure chaque consigne avec des balises : `<contexte>` (vidéo, plan, fichiers à lire), `<tache>` (étapes numérotées), `<regles>` (interdits, rappels propres à ce plan, défauts déjà relevés par l'utilisateur), `<rapport>` (format court attendu). Le rapport doit rester court : il revient dans ton contexte.
- Les consignes d'agent **renvoient vers les fichiers** (mémos, `CONSIGNE.md`, `persos.md`) au lieu de les recopier.
- Tu ne lis jamais le journal complet d'un agent : seulement son rapport, ses planches et les gros plans utiles.
- **Ton propre contexte** (il est relu à chaque appel, c'est ton premier poste de dépense) : lis `CHARTE.md` en entier une fois, mais `API.md` seulement par section (`grep -n '^## '`, puis `sed -n`) ; jamais un fichier de plus de 150 lignes affiché en entier ; regroupe les commandes. Un agent lancé en arrière-plan te prévient quand il a fini : **attends sa notification**, ne sonde ni son fichier de sortie ni ses dossiers en attendant (pas de `sleep`, pas de `ls` répétés).
- Ces choix (modèle, effort, langue, forme des consignes) viennent de la documentation Anthropic et de retours d'utilisateurs : détail et sources dans `outils/MODELES.md`. À revoir à chaque nouvelle génération de modèles.
- Dossier de travail : `<scratchpad>/<slug-du-sujet>/` (jamais dans le dépôt). `OUTILS` = chemin absolu du dossier `outils/` à côté de ce fichier.

---

## Étape 1 — Proposer 3 sujets (ARRÊT 1)

### Anti-doublon et variété (registre partagé entre sessions et routines)
`videos-realisees.md` est le **registre commun** de toutes les sessions et routines : chacune y voit ce que les autres ont livré ou ont en cours. Il vit dans git : on le lit toujours **à jour** et on y réserve son sujet **avant** de travailler.
- **D'abord** : `python3 -I OUTILS/registre.py etat` (met le dépôt à jour, affiche les dernières vidéos, les sujets en cours ailleurs, le nombre de vidéos par thème et les **thèmes conseillés**).
- Écarter toute question dont l'id figure au registre, tout sujet « en cours » dans une autre session, et tout sujet qui partage un personnage, un objet, un événement ou un mot-clé de la colonne « Mots-clés à écarter ».
- **Varier le thème** : les sujets proposés viennent des thèmes conseillés (absents des 3 dernières vidéos, les moins servis d'abord ; ACTU exclu). On garde un thème déjà vu récemment seulement si l'histoire est nettement meilleure, et on le dit. La présélection Haiku reçoit ces thèmes.
- Varier le **type de récit** : aucun des 3 sujets ne reprend le type des 2 dernières vidéos (sauf demande), et les 3 ont 3 types différents.
- **Dès que le sujet est choisi** (par l'utilisateur, ou par toi en routine) : `python3 -I OUTILS/registre.py reserver "<Sujet>" <id> <THEME> "<type>" "<mots-clés>"` réserve la ligne « en cours », committe et pousse ce seul fichier. Code de sortie 2 = une autre session vient de le prendre : prendre le suivant. La colonne Thème commence toujours par le code Clark (HIST, GEO, SCI…).
- À la livraison : `python3 -I OUTILS/registre.py livrer "<Sujet>" "<lien du dossier Drive>" <id du contenu au BO>`. Jamais les rendus dans git.

### Horodatage de la vidéo (à prendre une fois, au départ)
Chaque vidéo porte la date et l'heure de sa production, pour la retrouver ensuite (BO, Drive, registre). Prends-les **une seule fois** : en routine, avant toute autre commande ; en session, dès que le sujet est réservé. Écris-les dans un fichier, car ton contexte peut être résumé en cours de route :
`python3 -I -c "import datetime as d;from zoneinfo import ZoneInfo;n=d.datetime.now(ZoneInfo('Europe/Paris'));print(f'ID=v_{n:%Y%m%d_%H%M}\nMS={int(n.timestamp()*1000)}\nLIBELLE={n:%Y-%m-%d %Hh%M}')" > <scratchpad>/HORODATAGE.txt`
- `ID` : l'id du contenu dans le planificateur du BO (ex. `v_20261015_0400`) ;
- `MS` : l'instant de génération (`generatedAt`) ;
- `LIBELLE` : le début du nom du dossier Drive (« 2026-10-15 04h00 — <Sujet> »).
Recopie ce fichier dans `<travail>/` dès que le dossier existe ; relis-le à la livraison, ne le recalcule jamais.

### En routine (session planifiée, sans utilisateur)
Une routine ne peut pas demander : elle applique le **mode autonome** du début à la fin.
0. **Horodatage** (ci-dessus), avant toute autre commande.
1. `registre.py etat` ; présélection Haiku sur les **questions les plus récentes** (`created_at desc`), limitée aux thèmes conseillés.
2. Choisis toi-même le meilleur sujet selon les critères ci-dessous, réserve-le aussitôt (`registre.py reserver`) ; s'il est déjà pris, le suivant.
3. Faits, script, **voix** (`voix.py`, **un seul appel ElevenLabs pour toute la vidéo**, instants réels reportés dans la fiche), fiche, casting, 6 plans, contrôle final : sans arrêt. Les faits incertains sont retirés du script (jamais laissés en doute).
4. Livraison complète (voir « Livraison ») : Drive (médias seulement : 6 plans + `voix/p1…p6.mp3`, sans `voix_complete.mp3`, dans le dossier « <LIBELLE> — <Sujet> ») ; contenu du planificateur du BO (création seule, id `ID` de l'horodatage, avec titre, description, hashtags, script, version ElevenLabs, prompt de couverture et lien du dossier Drive) ; `registre.py livrer` ; bibliothèque ; charte. Le résumé final dit : sujet, thème, horodatage (`LIBELLE`), lien du dossier Drive, id du contenu au BO, crédits ElevenLabs utilisés (caractères envoyés, un seul appel), limites.
5. Deux routines peuvent tourner le même jour : espace-les de quelques heures (limite d'usage sur 5 h glissantes) et laisse chacune dans sa propre session.

### Présélection (agent Haiku)
Lance un agent `model: "haiku"` avec cette consigne (à compléter) :
> Lis la collection Firestore `questions` du projet `clark-app-9b938` (connecteur Firestore Clark, outil `list_documents`, chercher « Firestore_Clark » avec ToolSearch ; parent `projects/clark-app-9b938/databases/(default)/documents` ; `orderBy: "created_at desc"` (les **plus récentes** d'abord), `pageSize` 300, 2 pages (les 600 dernières questions) ; `mask` : text, choices, correct_answer_index, theme_code, type, status, qc, explanation, stats). **Lecture seule.** Si une réponse est enregistrée dans un fichier, analyse-la avec `python3 -I`. Garde seulement `status` ACTIVE, `qc.status` pass, `type` EVERGREEN, et écarte les ids et mots-clés suivants : [liste du registre]. Garde en priorité les thèmes suivants : [thèmes conseillés par `registre.py etat`]. Renvoie les 15 meilleures pour une vidéo-récit (anecdote avec ironie ou retournement, personnage ou objet dessinable, lien avec le quotidien, faits intemporels), au moins 10 dans les thèmes prioritaires, sur au moins 5 thèmes : pour chacune id, theme_code, question, réponse, anecdote en 2 lignes, taux de réussite.

### Choix (toi)
Critères :
1. Un récit en 6 temps (situation → problème → décision → conséquence → réaction → retournement).
2. Un personnage ou un objet incarnable en marionnette (bonus : déjà dans la bibliothèque).
3. Un potentiel satirique (ironie, paradoxe, réaction excessive).
4. Un lien avec le quotidien.
5. Des faits vérifiables et intemporels.
6. Trois thèmes différents.
7. La nouveauté par rapport au registre.

Une question souvent ratée (`stats.success_rate` bas) est un bon signe (en 10/2026, ce champ vaut encore 0 partout : ne pas en tenir compte tant qu'il n'est pas calculé).
Pour chacun des 3 sujets : titre, type de récit, question d'origine, accroche (une phrase), chute pressentie, idée du gag principal **en théâtre de marionnettes** (quel décor monte, quel effet de rideau). Demande le choix (AskUserQuestion). **Arrête-toi.**
Si Firestore est inaccessible, propose 3 sujets de ta connaissance selon les mêmes critères et dis-le.

---

## Étape 2 — Script + fiche des plans (ARRÊT 2, un seul arrêt pour les deux)

Dès le choix : lance l'agent « faits » **en arrière-plan** et commence la fiche (distribution, décors) pendant qu'il cherche ; le script s'écrit quand ses résultats arrivent.

1. **Faits** : agent `model: "sonnet"` : « Vérifie sur le web (sources de la question + au moins une source indépendante) chaque date, chiffre, nom et attribution de ce récit : […]. Renvoie un tableau fait → confirmé / nuancé / faux, avec URL. » En cas de doute : formuler plus largement ou retirer, et le signaler.
2. **Script (toi)** :
   - **6 paragraphes, un par plan, de 25 à 28 mots prononcés et 160 à 175 caractères balises comprises, au plus un « … » par paragraphe.** Cible : voix de **8,8 à 9,4 s** par plan. L'utilisateur veut **remplir les 10 s** : plus de mots = plus d'explication ; une voix de 7 s est trop courte (Big Ben : 20–24 mots, 139–153 caractères → 6,6–7,9 s seulement, soit ≈ 3,2 mots/s et ≈ 19 caractères/s en appel unique). Chaque « … » ajoute ≈ 0,5 s. Compter comme c'est dit : « 1836 » = « mille huit cent trente-six » = 5 mots. Total ≈ 160–165 mots. Avant `voix.py`, estime chaque paragraphe à 19 caractères/s : sous 8,5 s, rallonge d'une précision utile (un chiffre, un nom, une cause), jamais d'un remplissage.
   - **Plan 1 — accroche** : mystère léger, sans formule trop appuyée.
   - Le fait clé arrive quand on le découvre à l'image : ce que la voix « révèle » n'est pas à l'image avant d'être dit (Big Ben : la tour seule d'abord, la cloche ne descend qu'au moment où on la nomme).
   - **Une chute par plan**, courte, sur sa propre phrase, dite à plat (« Évidemment. », « Modestement. »).
   - **Une blague récurrente** posée tôt et résolue au dernier plan. En marionnettes, c'est idéalement un objet ou un personnage emblématique (le bicorne de l'Arc de triomphe, la vache complice du reblochon).
   - **Morale finale ironique** et réplique de fin.
   - Cibles satiriques sûres : les gens de l'époque, les puissants, la presse, le spectateur. Le personnage central reste sympathique.
   - Vouvoiement.
3. **Fiche (toi)** : `<travail>/FICHE.md`, puis `<travail>/rideau.json`. **Titres imposés** : `construire.sh` en tire `pN/CONSIGNE.md` (la fiche sans la section qui commence par `## Script` ni les consignes des autres plans), que lit l'agent du plan à la place de la fiche entière. Garde donc : `# Titre`, `## Script…` (script et version ElevenLabs, si tu les mets dans la fiche), `## A. Distribution`, `## B. Conduite du rideau`, `## B2. Plan de scène`, `## C. Consignes des plans`, puis un `### Plan N/6 — …` par plan. Ce qui vaut pour tous les plans se met dans A, B ou B2, jamais sous un `### Plan` :

   **A. Distribution** : pour chaque marionnette, accessoire et décor récurrent, une description fixe : silhouette de profil, tenue, couleurs hex dans la palette sourde, pièces articulées utiles, objet emblématique, **taille à l'écran** (personnage principal ≥ 450 px ; plus petit si la scène est nombreuse, tant qu'elle reste claire ; **tout objet porteur d'un mot-clé ≥ 120 px et dégagé**, lisible sur un téléphone : tas, animaux, boîtes, journal…). Les objets d'une même série (conteneurs, uniformes…) ont chacun une couleur **entière** nettement différente. Un nouveau personnage ne doit ressembler à aucun personnage du kit ou de la bibliothèque (chapeau, silhouette). Pour chaque élément, dire d'où il vient : **kit** (`API.md` §4–6), **bibliothèque** (`bibliotheque/LISEZMOI.md` : vache, paysan, moine, chalet, montagnes…) ou **à créer**. Réutiliser d'abord.

   **B. Conduite du rideau** (CHARTE §5, API §4b) : un tableau sur 60 s (temps globaux) : ouverture au plan 1, `change` à cheval sur chaque coupe qui change de lieu ou d'époque, `demi` pour une ellipse de temps, rien quand l'action continue, **fermeture après la chute du plan 6**. Le même contenu en `rideau.json`.

   **B2. Plan de scène** (à écrire une fois le casting rendu, avant de lancer le plan 1) : pour chaque plan, la position x (et l'échelle) de chaque personnage, meuble et objet clé, vérifiée sur la planche de casting et le décor réel : rien de clé derrière un meuble ou un personnage, rien au-delà de x 930, les objets d'un mot-clé bien dégagés. Les plans qui se suivent dans le même lieu partagent les mêmes positions. (Leçon : pupitre qui cachait les boîtes, portes trop petites pour les tas, journal masqué par un chapeau.)

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
Bruitages (actions visibles + au moins un d'ambiance du lieu, très bas : machine, lieu, foule en brouhaha indistinct ; personne ne parle à part la voix off ; le rideau est automatique) : instant → préréglage sfx_lib
Vigilance : objets tenus (la main entoure le corps de l'objet), transitions de posture par étapes, proportions, superpositions, raccord avec le plan précédent
```
   Rappels : une seule action principale à la fois ; le gag tombe avec la chute ; tout passage de posture se fait par étapes (0,8–1,2 s).
4. **Livrables de l'arrêt** (un seul message) :
   - le script plan par plan, avec le nombre de mots et la durée ;
   - la **version ElevenLabs** (modèle et voix : étape « Voix » ci-dessous) : années en toutes lettres, une ou deux balises d'intention par phrase au plus ([deadpan], [sarcastic], [amused], [sighs]…), pauses par « … ». Conseils : un paragraphe par plan, stabilité « Natural », chutes à plat ;
   - deux variantes pour l'accroche et pour la chute finale ;
   - les faits incertains ;
   - la fiche résumée : distribution (kit / bibliothèque / à créer), conduite du rideau, et pour chaque plan le décor, le gag et la faune.
5. **Voix (ElevenLabs, automatique, UN SEUL APPEL PAR VIDÉO)** : écris la version ElevenLabs dans `<travail>/voix.txt` (6 paragraphes, un par plan, séparés par une ligne vide), puis `python3 -I OUTILS/voix.py <travail>`.
   - `voix.py` contrôle d'abord les longueurs sans rien envoyer (≤ 175 caractères et au plus un « … » par paragraphe). S'il refuse, raccourcis `voix.txt` et relance : rien n'est facturé.
   - Puis il envoie **les 6 paragraphes en un seul appel** (voix de l'utilisateur « Alexandre », `gP52hjM48hyNoVCbizxO`, modèle `eleven_v4`), garde la réponse brute (`voix/brut.json`) et découpe hors ligne : `voix/pN.mp3`, `voix/pN.json` (instant de chaque mot), `voix/MOTS.md` et `voix/voix_complete.mp3` (6 × 10,0 s, pour contrôle local seulement : **il ne va pas sur le Drive**). ≈ 1 crédit par caractère, ≈ 1 050 par vidéo.
   - ⛔ **Jamais un second appel** : l'utilisateur ne veut qu'une génération par vidéo chez ElevenLabs. Relancer `voix.py` redécoupe seulement (gratuit) ; il n'y a plus de `--plans N` ; ne supprime jamais `voix/brut.json` ni `voix/requete.json` ; `--forcer` seulement si l'utilisateur le demande (jamais en routine). Si `voix.py` s'arrête sur « ÉCHEC… Ne relance pas », continue sans voix : les plans se calent alors sur les fenêtres estimées (2,3 mots/s), et le résumé le dit.
   - Une ligne ATTENTION (voix > 9,6 s) ne se corrige plus par une nouvelle voix : garde-la, cale le plan sur ses vrais instants, et signale le débordement dans le résumé (à recaler au montage).
   - Puis **reporte les vrais instants** de `voix/MOTS.md` dans la fiche (fenêtres de voix et mots-clés de chaque plan) : les agents des plans calent `TL.MOTS` et les gestes clés dessus, sans estimation. Hors routine, lance `voix.py` seulement après la validation du script : une réécriture ensuite coûterait une nouvelle voix.
6. **Casting anticipé** : s'il y a des éléments « à créer », lance l'agent casting (3a) **en arrière-plan juste avant de t'arrêter** : il travaille pendant que l'utilisateur lit. Si l'utilisateur change la distribution, corrige-le par SendMessage.

Demande validation. **Arrête-toi.** Si le texte change, recompte les mots et mets à jour la fiche et `rideau.json` (sans nouvel arrêt, sauf changement de fond).

---

## Étape 3 — Production (sans arrêt)

### Les outils (`outils/`) — carte : qui lit quoi

| Fichier | Rôle | Qui le lit, et comment |
|---|---|---|
| `MEMO-PLAN.md` | Mémo d'une page des agents « plan N » (fichiers, ordre de dessin, cadrage, marionnettes, rideau, décors partagés, raccords, règles qui reviennent, bruitages, contrôle). Évite ≈ 50 000 tokens de documentation par plan. **À tenir à jour** : toute règle de `CHARTE.md` §8 ou d'`API.md` qui concerne tous les plans y est résumée en une ligne. | agents des plans, en entier |
| `MEMO-CASTING.md` | Mémo de l'agent casting : livrables, style, format d'une marionnette, squelette de `persos.js`, objets tenus, tests obligatoires, `persos.md`. | casting, en entier |
| `CHARTE.md` | Règles visuelles, mise en scène, rideau, faune, cadrage, bruitages, erreurs déjà commises (§8), contrôle (§9). | toi en entier une fois ; agents : §8 seulement |
| `API.md` | Référence du kit (`kit/marionnettes.js`, assemblé depuis `kit/src/` par `kit/assemble.sh`), conduite du rideau (§4b), faune (§4c), raccords et décors partagés (§4d), création de personnages (§7), recettes (§8), pièges (§10). | tout le monde **par section** (`grep -n '^## '`) |
| `MODELES.md` | Choix des modèles, de l'effort et de la forme des consignes, avec sources. | toi, à chaque nouvelle génération de modèles |
| `bibliotheque/` | Personnages, accessoires et décors validés des vidéos précédentes (index : `LISEZMOI.md`), chargés automatiquement dans chaque plan. | toi pour la distribution ; agents : l'en-tête du fichier utilisé |
| `exemples/` | `arc-de-triomphe/m1…m6` (scènes réussies, sauf leur rideau codé à la main) ; `persos_chimiste.js` (marionnette complète commentée). | par extrait, pour une recette précise |
| `gabarits/` | Départ de `scene.js` (avec `M.rideau(t)`), `timeline.js` (`TL.EVENTS`, `TL.MOTS`), `mixage.py` (avec `m.rideau_conduite()`) et `persos.md` (mode d'emploi rempli par le casting). | copiés par `construire.sh` ; `persos.md` par le casting |
| `construire.sh <travail>/pN` | Prépare le dossier du plan (gabarits, kit, bibliothèque, conduite du rideau, raccords, `persos.js`, `decors.js`, `index.html`), écrit **`pN/CONSIGNE.md`** (la fiche sans le script ni les autres plans ; affiche une ligne ATTENTION si la fiche n'a pas de titre `### Plan N/6` pour ce plan) et vérifie la syntaxe. | |
| `essai.sh <travail>/pN [4.5,8.3]` | `construire.sh` + images clés (secondes 0 à 9, 9,97 et les instants donnés) + `planche_cles.png`, en une commande et une ligne de sortie. | |
| `render.cjs <dossier> --stills …` | Rendu (processeur, `--workers 3` pour le complet ; jamais `--gpu`). Verrou : les rendus se suivent. | |
| `produire.sh <travail>/pN` | Rendu complet, bruitages, `pN_final.mp4`, `planche.png`, puis contrôles automatiques : `verifier.sh` (format, durée, son), `sauts.py` (objet qui surgit ou disparaît d'une image à l'autre, fond nu de la scène) et `raccord.sh` (coupe avec le plan précédent). ≈ 30 à 70 s. | |
| `planche.sh <mp4> <png> [--de A --a B] [--crop L:H:X:Y]` | Planche de 16 images ou gros plan. | |
| `sfx_lib.py` + `sons/` | Bruitages tout faits et clips CC0. **`python3 -I OUTILS/sfx_lib.py --aide`** liste en 17 lignes les préréglages et leurs paramètres. `freesound_cc0.py` cherche un nouveau son (vérifier sa licence CC0). | agents : `--aide`, jamais le fichier |
| `drive_envoi.py` | Envoi sur le Drive à la livraison (vidéos et voix ; plus de fichier texte). | |
| `voix.py <travail>` | Voix ElevenLabs de toute la vidéo en **un seul appel** (voix « Alexandre », `eleven_v4`), découpe hors ligne en 6 plans, instants réels des mots (`voix/MOTS.md`), piste complète 6 × 10 s. Relancé, il redécoupe sans rappeler ElevenLabs. Clé : secret réseau `xi-api-key` sur `api.elevenlabs.io`, jamais lue. | toi |
| `registre.py etat / reserver / livrer` | Registre partagé entre sessions et routines : état et thèmes conseillés, réservation d'un sujet (commit + push, refus si déjà pris), passage à « livrée ». | toi |

Fichiers d'une vidéo (`<travail>/`) : `FICHE.md`, `rideau.json`, `persos.js` + `persos.md` (casting), `decors/pN.js` (décors partagés entre plans, un fichier par plan pour que deux agents en tuilage n'écrivent jamais au même endroit : règles dans `MEMO-PLAN.md` §4), `raccords/pN.js`, `pN/`, `casting/`, `out/`.

### 3a. Casting (agent `video-atelier` avec `model: "opus"`, seulement pour ce qui est « à créer »)
Consigne :
> Lis **`OUTILS/MEMO-CASTING.md` en entier** (il remplace la lecture complète de la charte et de l'API), puis lance `bash OUTILS/construire.sh <travail>/casting` et lis `<travail>/casting/CONSIGNE.md` (distribution). Pour comparer avec l'existant : `OUTILS/bibliotheque/LISEZMOI.md`. Crée `<travail>/persos.js` avec **seulement** les marionnettes, accessoires et décors marqués « à créer », dans le style exact du kit, espace de noms propre à la vidéo ; puis `<travail>/casting/scene.js` (planche et 4 tests obligatoires du mémo §5). Rends avec `bash OUTILS/essai.sh <travail>/casting 1,5` et itère, 4 fois au plus. Termine par `<travail>/persos.md` (gabarit `OUTILS/gabarits/persos.md`, d'après le code final). Tout groupe de figurants (touristes, passants, ouvriers) a une option de tenue (`o.tenue` 0, 1, 2…) : une tenue nettement différente par figurant, aucune ne reprend celle d'un personnage principal. [Ajouter ici les précisions propres à la vidéo : objets tenus, gestes clés, séries de couleurs.] Rapport court : fonctions créées (nom, options principales), chemin de la planche, ce qui reste fragile.

Toi : regarde la planche de casting **et un gros plan de chaque test obligatoire** (bras pliés, série côte à côte, comparaison), puis survole `persos.md` (`grep -n '^|\|^##' persos.md`) : chaque élément créé y figure avec ses options. Si un défaut est visible, renvoie-le à l'agent une seule fois. Une fois la distribution figée, ne la change plus.

### 3b. Les 6 plans (un agent `video-atelier` par plan, en tuilage)
Pour N = 1 à 6 (l'agent N+1 démarre dès le rapport de N, voir §0) :
> Tu réalises le plan N/6 de la vidéo « … ». `OUTILS` = …, `TRAVAIL` = …. Lis dans l'ordre : **`OUTILS/MEMO-PLAN.md` en entier** (il remplace la lecture complète de la charte, de l'API et des exemples) ; lance `bash OUTILS/construire.sh TRAVAIL/pN` puis lis **`TRAVAIL/pN/CONSIGNE.md`** (distribution, plan de scène, conduite du rideau, consigne de ton plan ; ne lis pas `FICHE.md`) ; **`TRAVAIL/persos.md`** (mode d'emploi des personnages de la vidéo ; n'ouvre pas `persos.js`) ; l'en-tête des fichiers de `OUTILS/bibliotheque/` utilisés par le plan ; `TRAVAIL/decors.js` s'il existe (décors partagés : les appeler, ne pas les recopier) ; du `scene.js` du plan N−1, seulement les extraits utiles (`grep -n`). [Indiquer ici la recette ou la section utile au plan, ex. « API §8 chute », « exemple m4 : décor qui monte ».] Méthode :
> 1. Écris `timeline.js` (instants calés sur les fenêtres de la voix, `TL.MOTS`), puis `scene.js`, puis `mixage.py` (garde `m.rideau_conduite()` ; préréglages de `python3 -I OUTILS/sfx_lib.py --aide`, uniquement pour les actions visibles).
>    - Rideau : **`M.rideau(t)`** seulement (jamais codé à la main) ; changement de décor avec `M.rideauApres(t, 'id')`.
>    - Positions : celles du plan de scène (B2). Raccords : image 0 d'après `M.RACC['p' + (M.PLAN - 1)]` ; à la fin, ton état final dans `TRAVAIL/raccords/pN.js`.
>    - Un décor qui servira aussi à un autre plan va dans `TRAVAIL/decors/pN.js`, ton fichier (règles : `MEMO-PLAN.md` §4).
>    - Un geste discret prévu (objet posé, couvercle qui claque, chapeau soulevé) se déclare dans `TL.SAUTS` pour que `sauts.py` ne le signale pas.
> 2. Itère avec `bash OUTILS/essai.sh TRAVAIL/pN <instants clés>` : regarde `planche_cles.png`, puis en grand les images utiles, et corrige ; 3 tours au plus, puis gros plans sur les zones à risque.
> 3. Auto-contrôle avant le rendu complet : `MEMO-PLAN.md` §7, point par point sur les images.
> 4. Lance `bash OUTILS/produire.sh TRAVAIL/pN`. Regarde `planche.png`. `verifier.sh` tout « OK » ; examine chaque ligne « ATTENTION » (`mixage.py`, `sauts.py`, `raccord.sh`) et corrige-la ou justifie-la dans ton rapport.
>
> Interdits : texte, lettres, chiffres, logos (sauf texte explicitement demandé par l'utilisateur et écrit dans la fiche) ; doigt seul tendu ; rideau codé à la main ; git. Ne modifie ni `OUTILS/`, ni `persos.js`, ni `rideau.json`, ni `FICHE.md`, ni les raccords des autres plans, ni le fichier `decors/` d'un autre plan. Ce qui est propre au plan va dans `scene.js` ; si un correctif de `persos.js` ou de la conduite est indispensable, décris-le dans ton rapport.
>
> Rapport court : chemin de `pN_final.mp4` ; déroulé seconde par seconde calé sur la voix ; bruitages (instant → préréglage) ; ajouts à `decors/pN.js` ; lignes « ATTENTION » restantes et pourquoi ; limites connues.

**Contrôle ciblé (toi), avant d'envoyer le plan** :
- Lis `planche.png` **à petite taille d'abord** (comme sur un téléphone : l'objet de chaque mot-clé se lit-il ?), puis fais 1 ou 2 gros plans avec `planche.sh` : geste clé et chute, mains et objets tenus, coudes et épaules, transitions de posture, bords du cadre.
- Lis les lignes « ATTENTION » du rapport (`sauts.py` : objet qui surgit ou disparaît, fond nu ; `raccord.sh` : coupe qui ne raccorde pas) : chacune se vérifie d'un gros plan sur l'instant cité.
- Vérifie le raccord avec le plan précédent (mêmes personnages, même objet emblématique, **même état du rideau à la coupe**) et la liste « Erreurs déjà commises » (`CHARTE.md` §8).
- En cas de défaut, renvoie à l'agent du plan (SendMessage) une demande précise et une seule.
- Sinon, **envoie le plan tout de suite** (SendUserFile, le fichier `pN_final.mp4` ; si l'outil n'existe pas, son chemin) avec un résumé en 3 à 6 lignes.
- Un retour de l'utilisateur sur un plan déjà envoyé : le transmettre à l'agent de ce plan (SendMessage) ; si c'est un défaut général, l'ajouter aussi à `CHARTE.md` §8 et le signaler à l'agent du plan en cours.
- Un défaut d'un personnage ou objet partagé (bras, couleurs, dessin) : le corriger **une fois** dans `persos.js` (agent casting, même API, et `persos.md` à jour), puis relancer `construire.sh` + `produire.sh` de tous les plans touchés en une seule commande en arrière-plan (≈ 1 min par plan) ; pas besoin de relancer les agents des plans.
- Un plan corrigé dont l'état final change : relance `construire.sh` + `produire.sh` du plan suivant (il relit `M.RACC`), puis vérifie la coupe.

### 3c. Contrôle final ciblé (toi, une fois les 6 plans faits)
Pas de nouveau rendu complet. Vérifie seulement :
- les raccords entre les plans : `bash OUTILS/raccord.sh TRAVAIL N` pour N de 2 à 6 (une ligne par coupe, SSIM ≥ 0,92 ; sinon ouvre `out/pN/raccord.png`), puis un coup d'œil sur les coupes les plus basses (rideau, objets, tenues, lumière) ;
- les lignes « ATTENTION » de `sauts.py` que les agents ont justifiées plutôt que corrigées : la justification tient-elle à l'œil ? ;
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
- **Textes de publication** (rédigés AVANT le dépôt, ils vont dans le BO, plus dans un fichier texte) :
  - un **titre** accrocheur (≤ 80 caractères) ;
  - une **description piquante** (2 à 3 phrases dans le ton satirique de la vidéo, avec la chute en clin d'œil, un emoji au plus, sans URL ni nom de domaine) ;
  - **5 hashtags** (le thème, le personnage, le sujet, puis culturegenerale et un tag large) ;
  - le **prompt de couverture**, rédigé selon le modèle ci-dessous : le prompt complet en anglais, la ligne `Négatif : …`, la ligne `Midjourney : --ar 9:16 --style raw`, le thème et sa couleur (ex. « rideau couleur du thème ECO, graphite #334155 »), et les 3 titres proposés.
- **Dépôt sur le Drive Clark** (médias seulement : ⛔ plus aucun fichier texte sur le Drive, tout le texte est dans le BO) :
  - Envoie tout d'un coup : `python3 -I OUTILS/drive_envoi.py "<LIBELLE> — <Sujet>" - <travail>/out/p1/p1_final.mp4 … <travail>/out/p6/p6_final.mp4 <travail>/voix/p1.mp3 … <travail>/voix/p6.mp3` (**jamais `voix_complete.mp3`** : l'utilisateur ne veut que les voix plan par plan ; `LIBELLE` de l'horodatage, ex. « 2026-10-15 04h00 — Le Téflon » ; « - » = pas de fichier texte ; le type de chaque fichier est reconnu à son extension).
     - Le script crée (ou retrouve) ce dossier dans « Vidéos » (id `1GoKRhXejq2FgNvA0trdSRBmC9uBrZmE_`) et y dépose les fichiers, en envoi « resumable ». Il affiche le lien du dossier (`dossier : https://drive.google.com/drive/folders/…`) : garde-le pour le BO et le registre.
     - Il passe par le secret réseau `GOOGLE_DRIVE` de l'environnement : type Body parameter sur `oauth2.googleapis.com/token`, avec `client_id`, `client_secret` et `refresh_token`. Le proxy injecte ces valeurs : ne jamais chercher à les lire ni à les afficher.
     - Ne pas passer par le connecteur Drive pour les vidéos (base64 impossible au-delà de quelques Ko).
     - Si le jeton est refusé (`invalid_grant`), le refresh token a été révoqué. Livre alors les vidéos dans la conversation et dis à l'utilisateur de régénérer le jeton dans OAuth Playground, en mode « Offline », puis de mettre à jour le secret.
- **Prompt de couverture** (miniature TikTok, générée par l'utilisateur dans un générateur d'images) : à donner aussi dans la conversation, prêt à copier. Validé par l'utilisateur : **rideau fermé en fond, l'objet emblématique du sujet seul devant (pas de personnage), un titre accrocheur dans le tiers haut**, **le rideau à la couleur du thème Clark de la question** (tableau ci-dessous), l'objet **posé** sur le plancher (pas de tige, pas en lévitation), le tout **dans la DA de la vidéo** (carton découpé plat, pas de rendu réaliste) et un titre en **lettres de papier doré découpées, style affiche de théâtre XIXᵉ** (pas de serif classique fin). C'est la seule image où du texte est permis. Prompt **en anglais**, titre en français entre guillemets, **court** (4 à 7 mots : les générateurs écrivent mal les titres longs), sur ce modèle :
  ```
  Flat cut-paper illustration in the style of a 19th-century paper toy theatre, vertical 9:16, elegant and minimalist.
  NOT photographic, NOT 3D: matte layered cardstock, flat colour areas, crisp die-cut edges with a thin white border,
  fine engraving-style hatching for shading, visible paper grain, small soft drop shadows between paper layers.
  Background: only a closed theatre curtain drawn as flat painted paper — [COULEUR DU THÈME : nom + hex primary]
  with darker folds [hex dark] — the curtain is NOT red, NOT crimson (sauf thème rouge) — stylised regular vertical folds in two or three tones, a thin aged-gold fringe at the
  bottom; no proscenium, no stage frame, no landscape, no audience, no characters.
  In front of the curtain, in the lower half: [L'OBJET EMBLÉMATIQUE SEUL, simplifié en carton découpé : formes nettes,
  aplats, couleurs sourdes, brass paper-fastener rivets if it has parts], resting firmly and flat on a simple strip of
  dark wooden floorboards, with a soft contact shadow under it — no rod, no stick, no stand, not floating —
  lit by a soft warm spotlight.
  In the upper third, the French title, exactly: "[TITRE]", made of letters hand-cut from gold paper, in the style of
  a 19th-century wood-type theatre playbill (bold condensed slab-serif capitals), each letter very slightly uneven and
  casting a tiny shadow on the curtain, centered on two or three lines, perfectly spelled with French accents.
  Palette strictly muted: the theme colour, ivory, ochre, aged gold. Centered, uncluttered, gentle vignette,
  fine paper grain. No other text, no logo, no watermark.
  ```
  Couleur du rideau = `theme_code` de la question choisie (Firestore `questions/<id>.theme_code`, noté dans le registre). Source : app Clark, `packages/shared/src/constants/themeVisuals.ts` (à relire si le dépôt `AlexisDev14/clark` est disponible, les couleurs peuvent changer) :

  | Code | Thème | primary | dark | Dans le prompt |
  |---|---|---|---|---|
  | HIST | Histoire & politique | #7C2D12 | #5B1A0E | deep terracotta brick red |
  | GEO | Géographie & monde | #15803D | #14532D | forest green |
  | SCI | Sciences & technologie | #06B6D4 | #0E7490 | laboratory cyan (muted) |
  | ART | Arts & littérature | #C026D3 | #86198F | ink magenta |
  | MUS | Musique, cinéma & TV | #7C3AED | #5B21B6 | velvet violet |
  | POP | Culture pop & médias | #FCAF3C | #92560B | golden amber |
  | SPORT | Sports & jeux | #F97316 | #C2410C | pitch orange |
  | VIE | Vie quotidienne | #EC4899 | #BE185D | vivid rose pink (muted) |
  | ECO | Affaires, économie & société | #334155 | #0F172A | slate graphite |
  | LANG | Langue, culture & religions | #4D7C0F | #365314 | sage olive green |
  | ACTU | Actualités | #DC2626 | #991B1B | bright red |

  Négatif : `rod, stick, pole, stand, floating, levitating, red curtain, crimson, burgundy (ces trois-là si le thème n'est pas rouge), photorealistic, realistic texture, photograph, 3D render, CGI, glossy, plastic, real velvet, depth of field, extra text, misspelled words, thin serif font, script font, logo, watermark, person, animal, landscape, stage frame, proscenium, audience seats, anime, clutter`. Format 9:16 (Midjourney : `--ar 9:16 --style raw`). Proposer 3 titres au choix ; si le générateur écorche le titre, l'utilisateur peut l'ajouter au montage (prompt sans la ligne du titre).
- **Dépôt dans le planificateur du backoffice Clark** (en routine comme en session, après le Drive) : le contenu entre dans la **file de programmation** (page « Publications » du BO). Le BO lui donne lui-même sa date de sortie, à la suite des vidéos déjà prévues, selon le rythme réglé par l'utilisateur (départ le 19/10, 6 h puis 17 h). Tu ne choisis jamais de date ni de créneau. L'utilisateur n'a plus qu'à joindre la vidéo montée et la miniature, puis valider.
  1. Crée le document avec le connecteur Firestore Clark, outil **`add_document`** (chercher « Firestore_Clark » avec ToolSearch) : `parent` `projects/clark-app-9b938/databases/(default)/documents`, `collectionId` `video_slots`, `documentId` = `ID` de l'horodatage (ex. `v_20261015_0400`).
     - Refus « already exists » : lis ce document (`get_document`, lecture seule). Même `subject` = déjà déposé par toi (rien à refaire). Sinon, réessaie avec le suffixe `_b`, puis `_c` (ex. `v_20261015_0400_b`).
     - ⛔ **Création seulement** : jamais `update_document`, `delete_document` ni aucune autre écriture Firestore, jamais une autre collection. Un document existant (saisi par l'utilisateur ou par une autre routine) ne se touche pas.
  2. Champs du document (format Firestore typé), **tous ceux-ci et aucun autre** :
     - `origin` : `stringValue` `routine` ;
     - `queued` : `booleanValue` `true` (le contenu entre dans la file) ;
     - `queuedAt`, `createdAt`, `updatedAt` : `integerValue`, l'instant du dépôt en millisecondes (`python3 -I -c "import time;print(int(time.time()*1000))"`, la même valeur pour les trois) ;
     - `generatedAt` : `integerValue`, `MS` de l'horodatage (date et heure de la production) ;
     - `subject` : `stringValue`, le sujet tel qu'au registre (≤ 120 caractères) ;
     - `texts` : `mapValue` avec `title` (le titre, ≤ 80 caractères), `description` (la description piquante) et `hashtags` (`arrayValue` des 5 hashtags, **sans** le `#`) ;
     - `script` : `stringValue`, le texte lu des 6 plans, un paragraphe par plan (≤ 5 000 caractères, jamais publié) ;
     - `voiceScript` : `stringValue`, la version ElevenLabs telle qu'envoyée (`voix/requete.json`, champ `texte`, ou `voix.txt`), balises comprises (≤ 5 000 caractères) ;
     - `coverPrompt` : `stringValue`, le prompt de couverture complet (prompt anglais, ligne `Négatif`, ligne `Midjourney`, thème et couleur, 3 titres ; ≤ 5 000 caractères) ;
     - `driveFolderUrl` : `stringValue`, le lien du dossier Drive affiché par `drive_envoi.py` (omis si l'envoi a échoué) ;
     - seulement si X déborde : `variants` : `mapValue` → `x` → `mapValue` → `description` (`stringValue`). X publie la description + une ligne vide + les hashtags, 280 caractères au plus (un emoji compte double) : au-delà de 270, une phrase courte sans emoji pour X.
     - ⛔ Jamais `scheduledAt`, `slotId`, `dayKey`, `time`, `pin`, `validation` ni `video` : la date et la validation appartiennent au BO.
  3. Note l'id du contenu dans le résumé final (ex. « BO : contenu v_20261015_0400, en file »). Un échec d'écriture ne bloque pas la livraison : donne la cause dans le résumé, avec le titre, la description, les hashtags et le prompt de couverture en clair pour que l'utilisateur les saisisse.
  4. Si le prompt de couverture est retouché après la livraison (retours de l'utilisateur sur l'image générée) : donne-le dans la conversation, l'utilisateur le remplace dans la fiche du BO (jamais d'écriture Firestore de ta part sur un document existant).
- Passe le sujet à « livrée » : `python3 -I OUTILS/registre.py livrer "<Sujet>" "<lien du dossier Drive>" <id du contenu au BO>` (la ligne garde l'id de la question et son `theme_code`, indispensables pour refaire la vidéo ou sa couverture).
- **Enrichis la bibliothèque** : copie `<travail>/persos.js` (s'il existe) dans `outils/bibliotheque/<slug>.js` (première ligne = description, espace de noms propre) et `<travail>/persos.md` dans `outils/bibliotheque/<slug>.md` (mode d'emploi, à lire à la place du `.js`), ajoute sa section à `bibliotheque/LISEZMOI.md` (contenu, options éprouvées, ce que l'utilisateur a validé). Un décor de `<travail>/decors/*.js` réutilisable rejoint aussi la bibliothèque (ajouté à `<slug>.js` : `M.dec.x` y devient `M.<espace de la vidéo>.x`, car `M.dec` est propre à chaque vidéo).
- Ajoute à `outils/CHARTE.md` §8 tout nouveau défaut relevé par l'utilisateur, pour qu'il ne revienne pas (et, s'il concerne tous les plans, une ligne dans `outils/MEMO-PLAN.md`).
- Committe et pousse ces fichiers (registre, bibliothèque, charte), jamais les rendus.
