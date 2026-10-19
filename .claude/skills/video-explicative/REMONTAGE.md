# Remontage d'une vidéo déjà livrée : le montage Canva officiel, avec les nouveaux sous-titres

But (souhait de l'utilisateur, 19/10/2026) : la version OFFICIELLE d'une vidéo est son montage **Canva** (validé, parfois retouché :
voix refaites, plans recoupés, vitesse) ; les plans et les mp3 du Drive ne sont pas fiables. On garde donc le son et le minutage du
montage Canva, on en retire les sous-titres et le logo, et on pose les nouveaux sous-titres (soustitres.py, style validé).
Les sous-titres Canva sont incrustés dans l'export et la page vidéo n'est pas modifiable par l'API Canva : `reconstruire.py` refait
chaque image du montage à partir de l'image identique des plans propres (Drive), et garde le son du montage. Validé sur La boussole.

Interdits : modifier, copier, déplacer ou supprimer un design Canva (lecture et export seulement) ; appeler ElevenLabs ; toucher
Firestore autrement qu'en lecture ; sur le Drive, ne déposer QUE « <Sujet> — vidéo complète.mp4 », « <Sujet> — vidéo complète
sous-titrée.mp4 » et « <Sujet> — sources.zip » (rien d'autre remplacé ni supprimé) ; pousser des rendus dans git ; Fable.

## Choix de la vidéo (routine « Remontage vidéos Clark », une vidéo par exécution)
1. `python3 -I OUTILS/remontages.py etat` : ids déjà « fait » ou « impossible » (à écarter), et « en cours » (à écarter si posé il y a
   moins de 2 h : une autre exécution y travaille ; au-delà, exécution interrompue, à reprendre). Les ids « à refaire » (livrées avec
   un défaut d'outil corrigé depuis) sont candidates comme une vidéo jamais faite : on les refait entièrement (étapes 1 à 7).
2. Firestore `video_slots` (LECTURE SEULE, `list_documents`, masque : subject, driveFolderUrl, queued, queuedAt, validation.at,
   publications.tiktok.state) : candidates = encore à publier (`queued` true, aucune publication à l'état « publie »), non écartées.
3. Ordre = ordre de publication du BO (file `queuedAt` croissant, 2 par jour) : d'abord les vidéos validées (`validation.at` présent),
   par `queuedAt` croissant ; puis les non validées, même ordre. Prendre la première.
4. `python3 -I OUTILS/remontages.py debut <id> "<Sujet>"` AVANT tout travail ; à la fin `fait <id> "<note>"` ou `impossible <id> "<cause>"`.

## Designs Canva (relevés le 19/10/2026 ; les titres Canva ne reprennent pas toujours le sujet)
Utiliser ces ids directement (read-design / export-design) ; pour une vidéo absente du tableau, `search-designs` avec un mot-clé du sujet.
| Id BO | Sujet | Design d'origine (texte) | Copie « — sans sous-titres » (image + son) |
|---|---|---|---|
| v_20261015_0938 | L'étoile Mercedes | DAHYEWS8V3U « Mercedes » | — |
| v_20261015_1206 | Barbe Noire | DAHYExpFebA | — |
| v_20261015_1749 | Manneken-Pis | DAHYL00YXoY | — |
| v_20261015_2048 | Le Beau Danube bleu | DAHYMFsajN8 | — |
| v_20261015_2349 | Le conteneur | DAHYMP4D1Dw | — |
| v_20261016_0249 | Mettre les pieds dans le plat | DAHYMkHurKI | — |
| v_20261016_0549 | Le tandem | DAHYM1Q4EJA | — |
| v_20261016_0849 | L'autruche | DAHYLSJY9rU « Autruche » | — |
| v_20261016_1447_xl4np | Arc de triomphe | DAHX4c1_1ZU | DAHYcdyrUQo |
| v_20261016_1447_cbcsd | Monsieur Poubelle | DAHXzylOdIU « Poubelle » | DAHYcZWZS3o |
| v_20261016_1447_5uq5t | Le reblochon | DAHX5uk_LpA « Reblochon » | DAHYcaeVnlc |
| v_20261016_1447_5qhs5 | Le Téflon | DAHX-McB3oY | DAHYcbu2lHI |
| v_20261016_1449 | Le Swoosh de Nike | DAHYQXsJ9mI | — |
| v_20261016_1749 | L'Oscar en plâtre | DAHYQtnAsts | — |
| v_20261017_0049 | Léonard de Vinci | DAHYQoWyewY | — |
| v_20261017_0548 | Fleming | DAHYQqNZQ7M | — |
| v_20261017_1048 | Le Toblerone | DAHYRLCoPWQ | — |
| v_20261018_1348 | Robert Downey Jr | DAHYYY1ay-8 | — |

Sans montage Canva (19/10, l'utilisateur ne les a pas retravaillées) : Paris vaut bien une messe (v_20261017_1548), La fève de la
galette (v_20261017_1948), Sésame ouvre-toi (v_20261017_2349), Dr House (v_20261018_0348). Elles se font depuis le Drive : section
« Vidéo sans montage Canva ». Une autre vidéo sans design Canva : passer à la suivante, sans la marquer.

## Texte des sous-titres
Le texte du design d'origine est la référence (mots dits), mais ses coquilles se corrigent dans script.txt sans changer un mot dit :
orthographe et accords (« sireuse » → « cireuse », « il trait » → « ils traient »), espace manquante (« !Belle »), ponctuation
(« Qui paye Les propriétaires » → « Qui paye ? Les propriétaires »), mot manquant évident (« canne pêche » → « canne à pêche »).
Dans le doute, garder le texte tel quel. Lister les corrections dans le résumé.
Pas de guillemets (« », “ ”) dans script.txt : soustitres.py les détache du mot (« » » seul à l'écran, doubles espaces) ; écrire
`on la nomme tandem` plutôt que `on la nomme « tandem »`. Vérifier la liste des sous-titres (lignes `Dialogue` du `.ass`) : ni
guillemet ni ponctuation seule, ni double espace. Si Whisper entend un autre mot que le design (« le mot » / « le nom »), garder le
design et le signaler dans le résumé.

## Étapes (`OUTILS` = `.claude/skills/video-explicative/outils`, `T` = `<scratchpad>/<slug>`)
1. **Canva** : `search-designs` (query = sujet, ou ses premiers mots) → le design 1080×1920 du sujet (pas une « Copie de … » si
   l'original existe ; en cas de doute, le plus récemment modifié). Introuvable → passer à la vidéo suivante, sans marquer.
   - `read-design` (design_content) = texte des sous-titres Canva = **le texte final dit** → `T/script.txt` : un paragraphe par phrase
     ou groupe de phrases (lignes vides entre paragraphes), chiffres en chiffres, sans le texte du carton de fin.
   - `export-design` (type mp4, quality `vertical_1080p`), télécharger l'URL rendue (curl) → `T/canva.mp4`.
   - **Version sans sous-titres préparée par l'utilisateur** : si `search-designs` trouve aussi « <Sujet> — sans sous-titres » (copie
     où il a supprimé les sous-titres), l'exporter de même → `T/propre.mp4` : c'est déjà l'image ET le son officiels. Le texte vient
     toujours du design d'origine. Sauter alors les étapes 2 et 3 : `ffmpeg -i T/propre.mp4 -af "volume=<−14 − sonie>dB,alimiter=limit=0.891:level=false"`
     (sonie mesurée par `sfx_lib.sonie`, vidéo copiée) → « T/<Sujet> — vidéo complète.mp4 », et `mots_whisper.py` sur T/propre.mp4.
2. **Plans propres** : `python3 -I OUTILS/drive_recup.py <id du dossier Drive (driveFolderUrl)> T/drive` ; ne garder QUE les plans
   nommés `pN_final.mp4` (dans « Plans » ou à la racine ; deux versions d'un même plan → `pN_final_2.mp4`, les passer toutes les deux). ⛔ Jamais un montage (« Mercedes.mp4 », « Le tandem.mp4 », « <Sujet>.mp4 »,
   « — vidéo complète… ») : il porte des sous-titres et serait recopié avec eux. Aucun pN_final.mp4 (vidéos importées : Arc de triomphe,
   Monsieur Poubelle, Reblochon, Téflon) et pas de copie Canva « — sans sous-titres » → « impossible » (« copie Canva sans sous-titres
   à préparer par l'utilisateur »).
3. **Image sans sous-titres** : `python3 -I OUTILS/reconstruire.py T/canva.mp4 "T/<Sujet> — vidéo complète.mp4" <les plans>`.
   Il suit les plans dans l'ordre (chemin Viterbi : avancer d'une image est gratuit, tenir ou sauter une image coûte peu, une coupe
   coûte cher), ce qui suit aussi les changements de vitesse de Canva. ⛔ Ne jamais revenir au choix « image la plus proche, une à
   une » : les plans bougent lentement, l'image retenue va et vient et la vidéo SACCADE (défaut des livraisons avant le 19/10, 13 h).
   Il finit par la ligne « fluidité » et sort en erreur (code 2) si « ÉCHEC » : plus d'images figées que le montage, retour en
   arrière ou bonds dans un plan. ÉCHEC → ne rien livrer ; regarder les instants donnés (planche.sh --de A --a B) ; si un plan du
   Drive diffère du montage → « impossible » (« copie Canva sans sous-titres à préparer par l'utilisateur »). Il dit aussi quelles tranches sont « gardées du montage » : seul le carton de fin Clark (les ~5 dernières secondes) est normal
   (les fondus enchaînés de Canva entre deux plans, qui montrent déjà le sous-titre suivant, sont refaits en fondu sans texte). Plus de 1 s gardée AVANT le carton (plan retouché dans Canva, absent du Drive) : regarder ces
   instants (planche.sh --de A --a B) ; s'il y reste des sous-titres Canva → « impossible » avec les instants.
4. **Instants des mots** (venv une fois : `python3 -m venv <scratchpad>/venv-fw && <scratchpad>/venv-fw/bin/pip install -q faster-whisper`) :
   `<scratchpad>/venv-fw/bin/python OUTILS/mots_whisper.py T/canva.mp4` → `T/canva.json`.
5. **Sous-titres** : `python3 -I OUTILS/soustitres.py T "T/<Sujet> — vidéo complète.mp4" "T/<Sujet> — vidéo complète sous-titrée.mp4" --global T/canva.json`
   (style validé, ne rien changer). verifier.sh tout « OK » ; niveau du carton :
   `ffmpeg -nostats -sseof -5 -i "<sous-titrée>" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1` entre −16 et −12 LUFS.
6. **Contrôle visuel** : `bash OUTILS/planche.sh "<sous-titrée>" T/planche.png` : aucun sous-titre ni logo Canva, nouveaux sous-titres
   justes et lisibles, pas d'image qui saute, carton de fin présent. Liste des sous-titres : lignes `Dialogue` du `.ass`.
   La planche est faite d'images fixes : elle ne montre PAS une saccade. Mouvement : `python3 -I OUTILS/sauts.py "<complète>"` et
   `python3 -I OUTILS/sauts.py T/canva.mp4` ; chaque saut de la vidéo complète doit être une coupe entre plans ou exister aussi
   dans canva.mp4 (à ± 0,3 s) ; une série de sauts rapprochés (plusieurs par seconde) = saccade → ne rien livrer.
7. **Livraison** : `bash OUTILS/sources.sh T "T/<Sujet> — sources.zip"` (script.txt, canva.json) puis
   `python3 -I OUTILS/drive_envoi.py id:<id> - "<complète>" "<sous-titrée>" "<sources.zip>"` (les mêmes noms sont remplacés, rien
   d'autre). `remontages.py fait <id> "<durée, tranches gardées du montage>"`. Le remplacement dans le BO est fait par l'utilisateur.

## Vidéo sans montage Canva (depuis le Drive ; méthode validée sur Big Ben)
1. `drive_recup.py <id> T/drive` ; copier `Audio/pN.mp3` dans `T/voix/`. Texte : champ `script` de `video_slots/<id>` (Firestore,
   lecture seule) → `T/script.txt`, 6 paragraphes (un par plan), années et grands nombres remis en chiffres, coquilles corrigées.
2. `mots_whisper.py T/voix/p?.mp3` → `T/voix/pN.json`.
3. Plans SANS voix (10 s, sonie < −30 LUFS : Paris vaut bien une messe, La fève, Sésame) : `python3 -I OUTILS/raccourcir.py T T/drive/Plans`
   (fins mortes retirées, voix posée à 0 s). Plans AVEC voix (calés sur la voix, ≈ −14 LUFS : Dr House) : copier chaque
   `Plans/pN_final.mp4` dans `T/out/pN/` tel quel.
4. `bash OUTILS/assembler.sh T "T/out/<Sujet> — vidéo complète.mp4"` (ajoute la conclusion Clark au niveau de la vidéo), puis
   `python3 -I OUTILS/soustitres.py T "T/out/<Sujet> — vidéo complète.mp4" "T/out/<Sujet> — vidéo complète sous-titrée.mp4"` (sans --global).
5. Contrôles, sources.sh, drive_envoi.py comme aux étapes 5 à 7 ci-dessus ; `remontages.py fait <id> "Drive (sans Canva), <durée>"`.
