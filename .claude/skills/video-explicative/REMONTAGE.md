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
   moins de 2 h : une autre exécution y travaille ; au-delà, exécution interrompue, à reprendre).
2. Firestore `video_slots` (LECTURE SEULE, `list_documents`, masque : subject, driveFolderUrl, queued, queuedAt, validation.at,
   publications.tiktok.state) : candidates = encore à publier (`queued` true, aucune publication à l'état « publie »), non écartées.
3. Ordre = ordre de publication du BO (file `queuedAt` croissant, 2 par jour) : d'abord les vidéos validées (`validation.at` présent),
   par `queuedAt` croissant ; puis les non validées, même ordre. Prendre la première.
4. `python3 -I OUTILS/remontages.py debut <id> "<Sujet>"` AVANT tout travail ; à la fin `fait <id> "<note>"` ou `impossible <id> "<cause>"`.

## Étapes (`OUTILS` = `.claude/skills/video-explicative/outils`, `T` = `<scratchpad>/<slug>`)
1. **Canva** : `search-designs` (query = sujet, ou ses premiers mots) → le design 1080×1920 du sujet (pas une « Copie de … » si
   l'original existe ; en cas de doute, le plus récemment modifié). Introuvable → « impossible ».
   - `read-design` (design_content) = texte des sous-titres Canva = **le texte final dit** → `T/script.txt` : un paragraphe par phrase
     ou groupe de phrases (lignes vides entre paragraphes), chiffres en chiffres, sans le texte du carton de fin.
   - `export-design` (type mp4, quality `vertical_1080p`), télécharger l'URL rendue (curl) → `T/canva.mp4`.
   - **Version sans sous-titres préparée par l'utilisateur** : si `search-designs` trouve aussi « <Sujet> — sans sous-titres » (copie
     où il a supprimé les sous-titres), l'exporter de même → `T/propre.mp4` : c'est déjà l'image ET le son officiels. Le texte vient
     toujours du design d'origine. Sauter alors les étapes 2 et 3 : `ffmpeg -i T/propre.mp4 -af "volume=<−14 − sonie>dB,alimiter=limit=0.891:level=false"`
     (sonie mesurée par `sfx_lib.sonie`, vidéo copiée) → « T/<Sujet> — vidéo complète.mp4 », et `mots_whisper.py` sur T/propre.mp4.
2. **Plans propres** : `python3 -I OUTILS/drive_recup.py <id du dossier Drive (driveFolderUrl)> T/drive` ; garder tous les mp4 du
   dossier qui ne sont PAS un montage (pN_final.mp4, mN.mp4… dans « Plans » ou à la racine ; exclure « <Sujet>.mp4 » et les « — vidéo
   complète… »). Aucun plan → « impossible » (les sous-titres Canva resteraient).
3. **Image sans sous-titres** : `python3 -I OUTILS/reconstruire.py T/canva.mp4 "T/<Sujet> — vidéo complète.mp4" <les plans>`.
   Il dit quelles tranches sont « gardées du montage » : seul le carton de fin Clark (les ~5 dernières secondes) et des fondus d'une
   fraction de seconde sont normaux. Plus de 1 s gardée AVANT le carton (plan retouché dans Canva, absent du Drive) : regarder ces
   instants (planche.sh --de A --a B) ; s'il y reste des sous-titres Canva → « impossible » avec les instants.
4. **Instants des mots** (venv une fois : `python3 -m venv <scratchpad>/venv-fw && <scratchpad>/venv-fw/bin/pip install -q faster-whisper`) :
   `<scratchpad>/venv-fw/bin/python OUTILS/mots_whisper.py T/canva.mp4` → `T/canva.json`.
5. **Sous-titres** : `python3 -I OUTILS/soustitres.py T "T/<Sujet> — vidéo complète.mp4" "T/<Sujet> — vidéo complète sous-titrée.mp4" --global T/canva.json`
   (style validé, ne rien changer). verifier.sh tout « OK » ; niveau du carton :
   `ffmpeg -nostats -sseof -5 -i "<sous-titrée>" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1` entre −16 et −12 LUFS.
6. **Contrôle visuel** : `bash OUTILS/planche.sh "<sous-titrée>" T/planche.png` : aucun sous-titre ni logo Canva, nouveaux sous-titres
   justes et lisibles, pas d'image qui saute, carton de fin présent. Liste des sous-titres : lignes `Dialogue` du `.ass`.
7. **Livraison** : `bash OUTILS/sources.sh T "T/<Sujet> — sources.zip"` (script.txt, canva.json) puis
   `python3 -I OUTILS/drive_envoi.py id:<id> - "<complète>" "<sous-titrée>" "<sources.zip>"` (les mêmes noms sont remplacés, rien
   d'autre). `remontages.py fait <id> "<durée, tranches gardées du montage>"`. Le remplacement dans le BO est fait par l'utilisateur.

Ancienne méthode (plans et mp3 du Drive, utilisée pour Big Ben à la demande de l'utilisateur) : `voix_montage.py`, `raccourcir.py`,
puis assembler.sh et soustitres.py sans `--global`.
