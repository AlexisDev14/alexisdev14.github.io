# Remontage d'une vidéo déjà livrée (plans de 10 s d'avant le calage sur la voix)

But : donner à une ancienne vidéo le montage actuel — vidéo complète (plans + voix + bruitages), sous-titres calés au mot, conclusion Clark —
**sans refaire les plans ni régénérer la voix**. La voix de référence est celle que l'utilisateur a montée dans **Canva** : il a parfois
refait une voix dans son montage sans remplacer le pN.mp3 du Drive. Validé sur Big Ben et La boussole (19/10/2026).

Interdits : modifier un design Canva (lecture et export seulement) ; appeler ElevenLabs ; remplacer ou supprimer un fichier existant du Drive
(on AJOUTE les fichiers « — vidéo complète… » et « — sources.zip ») ; toucher Firestore ; pousser des rendus dans git ; Fable.

## Choix de la vidéo (routine « Remontage vidéos », une vidéo par exécution)
1. `python3 -I OUTILS/remontages.py etat` : ids déjà « fait » ou « impossible » (à écarter), et « en cours » (à écarter si posé il y a
   moins de 2 h : une autre exécution y travaille ; au-delà, exécution interrompue, à reprendre).
2. Firestore `video_slots` (LECTURE SEULE, `list_documents`, masque : subject, driveFolderUrl, queued, queuedAt, validation.at,
   publications.tiktok.state) : candidates = encore à publier (`queued` true, aucune publication à l'état « publie »), non écartées.
3. Ordre = ordre de publication du BO (file `queuedAt` croissant, 2 par jour depuis video_planner/config) : d'abord les vidéos validées
   (`validation.at` présent), par `queuedAt` croissant ; puis les non validées, même ordre. Prendre la première.
4. `python3 -I OUTILS/remontages.py debut <id> "<Sujet>"` AVANT tout travail. À la fin : `fait <id> "<voix reprises, durée>"`, ou
   `impossible <id> "<cause>"` (plans ou voix absents du Drive, design Canva introuvable, plans contenant déjà une voix retouchée…).
   Une vidéo dont le dossier Drive a déjà « <Sujet> — vidéo complète sous-titrée.mp4 » est marquée « fait » (« déjà faite »), sans travail.

## Étapes (une vidéo ; `OUTILS` = `.claude/skills/video-explicative/outils`, `T` = `<scratchpad>/<slug>/travail`)
1. **Registre** : la ligne de la vidéo dans `videos-realisees.md` donne le sujet et le lien du dossier Drive (id après `folders/`).
   Si ce dossier contient déjà « <Sujet> — vidéo complète sous-titrée.mp4 », la vidéo est faite : passer.
2. **Drive** : `python3 -I OUTILS/drive_recup.py <id> <scratchpad>/<slug>/drive` → plans (`Plans/pN_final.mp4` ou à la racine),
   voix (`Audio/pN.mp3` ou à la racine), éventuellement le montage de l'utilisateur (`<Sujet>.mp4`). Copier les pN.mp3 dans `T/voix/`.
   Plans ou voix manquants (anciennes vidéos importées) : « impossible ».
   Si les pN_final.mp4 contiennent déjà la voix (sonie > −30 LUFS), la vidéo est récente : copier les plans dans `T/out/pN/`, faire
   les étapes 3 à 5 en diagnostic seulement (sans --appliquer) ; si une voix a été retouchée dans Canva, « impossible » (la voix est
   dans l'image du plan) ; sinon `mots_whisper.py` sur les pN.mp3, puis directement l'étape 7.
3. **Canva** (connecteur Canva) : `search-designs` avec le titre du sujet → le design (1 page, 1080×1920).
   - `read-design` (design_content) = le texte des sous-titres de l'utilisateur = **le texte final dit**. En faire `T/script.txt` :
     6 paragraphes séparés par une ligne vide, un par plan (découper d'après les pN.mp3), chiffres en chiffres, sans le carton de fin.
   - Montage de référence : `get-export-formats` puis `export-design` en mp4 (qualité verticale 1080p), télécharger l'URL rendue
     dans `<scratchpad>/<slug>/canva.mp4`. Si l'export est impossible, prendre le `<Sujet>.mp4` du Drive et le dire dans le compte rendu.
4. **Instants des mots** (whisper, une fois par session : `python3 -m venv <scratchpad>/venv-fw && <scratchpad>/venv-fw/bin/pip install -q faster-whisper`) :
   `<scratchpad>/venv-fw/bin/python OUTILS/mots_whisper.py T/voix/p?.mp3 <canva.mp4>`.
5. **Voix retouchées** : `python3 -I OUTILS/voix_montage.py T <canva.mp4>` (diagnostic), puis avec `--appliquer` : chaque plan dont la voix
   du montage diffère de pN.mp3 reçoit le passage du montage (origine gardée en pN_origine.mp3). Relancer `mots_whisper.py` sur les voix
   remplacées. Écouter n'est pas possible : vérifier que chaque passage commence et finit sur les bons mots (le script affiche les bornes).
6. **Plans raccourcis à la voix** : `python3 -I OUTILS/raccourcir.py T <dossier des pN_final.mp4>` (fins de plan mortes retirées, rideau
   final gardé, gel de la dernière image si la voix dépasse 10 s).
7. **Montage** : `bash OUTILS/assembler.sh T "T/out/<Sujet> — vidéo complète.mp4"` puis
   `python3 -I OUTILS/soustitres.py T "T/out/<Sujet> — vidéo complète.mp4" "T/out/<Sujet> — vidéo complète sous-titrée.mp4"`
   (style validé, ne pas le changer). Les deux contrôles verifier.sh doivent être tout « OK ».
8. **Contrôle visuel** : `bash OUTILS/planche.sh "<sous-titrée>.mp4" T/planche.png` ; regarder : sous-titres lisibles et justes,
   pas de saut d'image aux coupes, conclusion à la fin. Liste des sous-titres : lignes `Dialogue` du fichier `.ass` à côté de la vidéo.
9. **Livraison** : `bash OUTILS/sources.sh T "T/out/<Sujet> — sources.zip"` puis
   `python3 -I OUTILS/drive_envoi.py id:<id> - "<complète>.mp4" "<sous-titrée>.mp4" "<sources>.zip"` ; envoyer la sous-titrée dans la
   conversation. Compte rendu : plans dont la voix a été reprise du montage, durée finale, résultats de verifier.sh, lien du dossier.
