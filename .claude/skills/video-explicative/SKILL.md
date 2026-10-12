---
name: video-explicative
description: Produit une vidéo explicative TikTok de 60 s (6 plans de 10 s, 9:16) dans le style Clark. Propose d'abord 3 sujets tirés de la base de questions Clark (Firestore), puis, sur le sujet choisi, écrit le script de voix off satirique, sa version ElevenLabs, la fiche de continuité, puis réalise les 6 plans animés avec leurs bruitages. À utiliser quand l'utilisateur demande une nouvelle vidéo explicative, une idée de vidéo, ou tape /video-explicative.
---

# Vidéo explicative Clark — de l'idée aux 6 plans

Tu produis une vidéo explicative de culture générale pour TikTok : 60 s, 6 plans de 10 s, 1080 × 1920, 30 im/s, voix off ElevenLabs et sous-titres ajoutés au montage par l'utilisateur. Le ton est la marque de fabrique : **accessible, précis, avec une pointe d'humour satirique à chaque plan**, jamais purement documentaire.

La notice de référence complète (à lire si le connecteur Claude Docs est disponible, avec ses outils de lecture) :
https://claude.ai/code/artifact/620478f0-fbb2-4191-b779-ff610b9ff78d
Les règles essentielles sont reprises ci-dessous ; en cas d'écart, la notice fait foi.

Le travail se fait en **4 étapes avec 3 arrêts pour validation**. Ne saute jamais un arrêt.

---

## Étape 1 — Proposer 3 sujets (ARRÊT 1)

### Source : la base de questions Clark (Firestore)

- Projet `clark-app-9b938`, base `(default)`, collection `questions`.
- Outil : `list_documents` du connecteur Firestore Clark (chercher « Firestore_Clark » avec ToolSearch). Parent : `projects/clark-app-9b938/databases/(default)/documents`, `collectionId: "questions"`, `pageSize` 100 à 300, et un `mask` pour ne lire que : `text`, `choices`, `correct_answer_index`, `theme_code`, `type`, `status`, `qc`, `explanation`, `sources`, `stats`.
- Varier l'échantillon : `orderBy: "random_id"` et une page différente à chaque fois (utiliser `pageToken`), ou plusieurs pages.
- **Lecture seule.** N'écris, ne modifie et ne supprime rien dans Firestore sans demande explicite de l'utilisateur.

Champs utiles d'une question :
- `text` : la question ; `choices` + `correct_answer_index` : la réponse.
- `explanation.short / context / detailed / anecdote` : la matière du récit (l'anecdote fait souvent la chute).
- `sources.url_*` : les sources à vérifier.
- `status` = `ACTIVE`, `qc.status` = `pass`, `type` = `EVERGREEN` : seules questions à retenir.
- `stats.times_played`, `stats.success_rate` : une question souvent ratée = bon sujet (« vous vous êtes trompés »).

### Critères de choix d'un bon sujet

1. Un **récit** en 6 temps possible : situation → problème → décision/événement → conséquence → réaction → héritage ou retournement.
2. Un **personnage** ou un objet incarnable à l'image (on doit pouvoir le dessiner simplement).
3. Un **potentiel satirique** : une ironie, un paradoxe, une réaction excessive, un retournement (« on voulait l'humilier, on l'a rendu immortel »).
4. Un **lien avec le quotidien** du spectateur (un mot, un objet, un geste qu'il connaît).
5. **Faits vérifiables** et intemporels ; écarter les faits périssables (sportifs en activité, records récents, chiffres qui bougent).
6. Diversité : les 3 propositions viennent de 3 thèmes (`theme_code`) différents.

Si Firestore est inaccessible, propose 3 sujets de culture générale de ta connaissance en respectant les mêmes critères, et dis-le.

### Format de la proposition

Pour chacun des 3 sujets : un titre court, la question Clark d'origine, l'accroche envisagée (une phrase), le retournement ou la chute pressentie, et l'idée visuelle du gag principal. Puis demande à l'utilisateur de choisir (outil AskUserQuestion si disponible). **Arrête-toi.**

---

## Étape 2 — Le script (ARRÊT 2)

### Vérification des faits
- Ouvre les sources de la question et au moins une source indépendante. Chaque date, chiffre ou attribution du script doit être confirmé.
- En cas de doute : formuler plus largement (« la presse » plutôt qu'un journal précis) ou retirer. Signaler à l'utilisateur ce qui reste incertain.

### Écriture
- **6 paragraphes, un par plan, de 22 à 26 mots prononcés** (≈ 10 s à 2,5 mots/s). Compter les mots tels qu'ils sont dits : « 1883 » = 6 mots. Total ≈ 145–150 mots.
- **Plan 1 — accroche** : mystère léger, sans image choc ni formule trop appuyée (une version « vous jetez vos ordures dans un homme » a été jugée trop lourde ; « Ce mot, vous le dites tous les jours. Mais derrière… il y a un vrai monsieur. » a été retenue).
- Le nom ou le fait clé arrive quand on le découvre à l'image.
- **Une chute par plan**, courte, sur sa propre phrase, dite à plat (« Évidemment. », « Terriblement. »).
- **Une blague récurrente** posée tôt et résolue au dernier plan (ex. le pot de yaourt : plan 4 → plan 6).
- **Morale finale ironique** + une réplique de fin adressée au personnage (« Chapeau, monsieur le préfet. »).
- Cibles satiriques sûres : les gens de l'époque qui râlent, les puissants, la presse, le spectateur lui-même. Le personnage central reste sympathique.
- Vouvoiement du spectateur, sauf consigne contraire.

### Livrables de l'étape 2
1. Le script en texte brut, plan par plan, avec le nombre de mots prononcés et la durée estimée.
2. La **version ElevenLabs** (modèle Eleven v3) : mêmes phrases, années en toutes lettres, une ou deux balises d'intention entre crochets par phrase au maximum ([intrigued], [deadpan], [sarcastic], [chuckles], [sighs], [mischievously], [amused]…), pauses par « … » et ponctuation (pas de balise break en v3). Conseils : générer un paragraphe par plan, stabilité « Natural » ou « Creative », chutes à plat.
3. 2 variantes pour l'accroche et pour la chute finale.
4. La liste des faits incertains.

Demande validation. **Arrête-toi.** Si l'utilisateur modifie le texte, recompte les mots.

---

## Étape 3 — Fiche de continuité et consignes des 6 plans (ARRÊT 3)

### Fiche de continuité
Tableau : élément récurrent → description fixe (formes, couleurs hex exactes, tenue) → plans où il apparaît. Personnages, objets récurrents (dont l'objet de la blague récurrente), lieux. Elle est copiée telle quelle dans chaque consigne de plan.

### Consigne de chaque plan (gabarit)
```
### Plan N/6 — [titre court] (10 s, 9:16, TikTok)
Idée en une phrase : …
Voix off : « … »
Chute : … / Gag visuel : … (muet, lisible en 1 s, répond à la chute)
Lieu et époque : … / Personnages : … / Objets récurrents : …
Calage voix / image :
| Instant | Voix off | Image |
| 0–X s | « … » | … |
| X–Y s | « … » | geste clé sur le mot clé : … |
| Y–9 s | « chute » | gag visuel |
| 9–10 s | — | image immobile |
Caméra : un mouvement principal (départ → arrivée)
Son (sous la voix off, 2 à 4 bruitages) : instant, bruitage, niveau
Interdits : aucun texte/lettre/chiffre/logo dans l'image ; anachronismes à éviter : … ; pas de transition de fin
Points de vigilance : silhouettes à rendre reconnaissables, superpositions à risque, raccords
```

Montre la fiche et les 6 consignes, demande validation. **Arrête-toi.**

---

## Étape 4 — Réalisation des 6 plans

### Charte visuelle
- Illustration vectorielle 2D éditoriale, formes arrondies, contours encre bleu marine #1B2340 de 4 à 7 px à l'écran, grain papier en multiplication (~30 %).
- Palette A : parchemin #F3DAB4, encre #1B2340, bleu #326DEC, framboise #EC4899, crèmes #FBEBD3 / #F8E3C6 / #FFF4E2. Toute autre couleur a une raison (code réel d'un objet, matière, peau) et est fixée dans la fiche de continuité.
- Ombres portées : ellipses bleu marine à 15–20 %.
- **Aucun texte, lettre, chiffre ou logo dans l'image**, sauf texte explicitement demandé (alors intégré dans la vidéo, police d'affiche libre de droits chargée avant `READY`).

### Cadrage TikTok
- Action importante (visages, gags, objets clés) en entier dans **x 60–930 px, y 150–1430 px**.
- Bas de l'image (y > 1430) : décor calme seulement (sous-titres + légende). Bande droite (x > 930) : décor seulement (boutons).
- Personnages lisibles : un personnage principal fait au moins ~350–450 px de haut ; un sourire au moins 20 px de large. Sinon, rapprocher la caméra.

### Animation
- Le geste clé tombe sur le mot clé de la voix (écart < 0,2 s) ; le gag arrive avec la chute, jamais avant.
- Anticipation → action → rebond (squash and stretch 10–15 %), courbes douces, ressorts amortis.
- Durées minimales : geste 0,3 s, expression 0,6 s, gag 1,5–2 s, détail rapide visible ≥ 0,4 s.
- Toute action finie à 9 s ; **dernière seconde immobile ; pas de transition de fin**.
- À éviter : traits de vitesse, tremblements, effets ambigus, plusieurs actions simultanées.

### Erreurs déjà commises (à vérifier systématiquement)
- Image qui contredit la phrase entendue (« le tri disparaît » pendant que des bacs de tri apparaissent).
- Personnages minuscules sous une façade géante ; action cachée par les sous-titres.
- Forme qui évoque un monument d'une autre époque (rosace prise pour une grande roue) ; anachronismes.
- Matière mal rendue (hotte d'osier qui ressemble à une cheminée en briques ; couvercles ouverts lus comme des vitres ; huîtres lues comme des vinyles).
- Personnage ou élément coupé en deux par le bord du cadre.
- Morceau de décor manquant (ne pas mettre en cache de très grandes images : une tuile peut se perdre ; redessiner le décor à chaque image).
- Géométrie fausse (arcs non concentriques, éléments qui se touchent par accident, objet posé sur une tête).
- Ordre de superposition faux (bras derrière la tête).
- Points parasites : jamais de cercle de rayon quasi nul avec contour ; inspecter les aplats en gros plan.
- Objet tombé dans un contenant encore visible dessous ; couvercle qui rebondit en laissant une fente.
- Transformation illisible au premier instant (un oiseau de papier doit avoir tête et ailes dès l'envol).
- Objet animé qui passe devant les visages au moment où ils réagissent.

### Production technique
Les outils sont dans `outils/` à côté de ce fichier :
- `modele-plan.html` : page Canvas 2D de départ (palette, aides de dessin, ressort, grain, `setFrame`, `renderFrame`, `READY`). Une page par plan.
- `timeline.js` : minutage partagé entre l'image et le son ; y noter chaque instant calé sur la voix.
- `render.cjs` : rendu image par image avec Playwright + ffmpeg. Il cherche le dossier du plan **à côté de lui** : copie-le dans le dossier de travail.
  - Images clés : `NODE_PATH=/opt/node22/lib/node_modules node render.cjs <dossier> --name <nom> --stills 0,30,60,…`
  - Vidéo complète : même commande sans `--stills` (≈ 7–10 min par plan), sortie `out/<nom>/<nom>.mp4`.
- `mixage.py` : pose des échantillons CC0 et un carillon synthétique, crête limitée à −6 dBFS. `python3 -I mixage.py <dossier_echantillons> <sortie.wav>`.
- `freesound_cc0.py` : recherche de sons CC0 sur Freesound (`python3 freesound_cc0.py "glass bottle"`). Télécharger l'aperçu `-hq.mp3` et **vérifier la licence CC0 sur la page du son** avant usage.
- Assemblage : `ffmpeg -y -i plan.mp4 -i sfx.wav -c:v copy -c:a aac -b:a 192k -shortest final.mp4`.

Travaille dans le dossier scratchpad de la session, jamais dans le dépôt. Les 6 plans peuvent être confiés en parallèle à des sous-agents : donne à chacun la charte, la fiche de continuité complète, sa consigne, les zones TikTok, la liste d'erreurs ci-dessus et l'exigence de contrôle ci-dessous ; les objets partagés entre plans (personnage, objet récurrent) sont décrits à l'identique dans chaque brief, et la fonction de dessin du premier plan terminé est recopiée dans les suivants.

### Son
- Sous la voix off : 2 à 4 bruitages par plan, chacun lié à une action visible, aucun sur un mot clé de la voix.
- Niveaux : bruitage principal −18 à −22 dBFS, secondaire −25 à −32, ambiance −35 à −45 ou rien. Même référence pour les 6 plans (pas d'écart de volume d'un plan à l'autre).
- Sons organiques (voix de foule, rires, papier, verre, pas) : enregistrements CC0 réels, foules filtrées vers 4 kHz. Synthèse seulement pour les sons abstraits (pop, carillon, petit souffle). Pas de musique, pas de voix de personnage.
- Tu ne peux pas écouter : vérifier le calage avec un spectrogramme (`ffmpeg -lavfi showspectrumpic`) et une courbe de volume, et le dire à l'utilisateur.

### Contrôle avant chaque envoi
- Planche de ≥ 12 images réparties sur les 10 s, regardée en entier, plus des gros plans des zones à risque ; bords et coins inspectés.
- Chaque point de la liste « Erreurs déjà commises » vérifié.
- Fichier : MP4 1080 × 1920, 30 im/s, 10,0 s, AAC stéréo.

### Livraison
- Envoie chaque plan dans la conversation (SendUserFile) dès qu'il est validé, avec un résumé : déroulé seconde par seconde calé sur la voix, sons utilisés, limites connues.
- **Ne pousse jamais les rendus dans un dépôt Git.**
- À la fin, rappelle les réglages de montage : sous-titres sur 2 lignes max vers 65–72 % de la hauteur, mot de la chute en framboise, vidéo complète à −14 LUFS (crête −1 dBFS), carton de fin et logo de l'application.
- Propose d'ajouter à la notice tout nouveau défaut rencontré.
