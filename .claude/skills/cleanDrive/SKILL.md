---
name: cleanDrive
description: Nettoie sur le Drive Clark les dossiers des vidéos déjà publiées (état « publie » au BO) — ne garde que la vidéo sous-titrée et l'affiche, met tout le reste à la corbeille. À utiliser quand l'utilisateur tape /cleanDrive ou demande de nettoyer les dossiers des vidéos publiées.
---

# cleanDrive — ménage des vidéos publiées

Règle de l'utilisateur (20/10/2026) : le dossier d'une vidéo **publiée** ne garde que
`<Titre> — vidéo complète sous-titrée.mp4` et `<Titre> — affiche.png`. Tout le reste part à la corbeille.
Cela concerne la vidéo sans sous-titres, l'ancien export, Plans/, Audio/ et Sources/.
Les vidéos non publiées ne sont pas touchées.

## Étapes

1. **Lire les publications au BO, en lecture seule.**
   - Connecteur Firestore Clark : chercher « Firestore_Clark » avec ToolSearch, puis utiliser `list_documents`.
   - `parent` : `projects/clark-app-9b938/databases/(default)/documents`.
   - `collectionId` : `video_slots`, `pageSize` : 300.
   - `mask` : `subject`, `driveFolderUrl`, `publications.tiktok.state`.
   - Enregistre la réponse JSON telle quelle dans `<scratchpad>/cleandrive/slots.json`.
2. **Simuler** : `python3 -I .claude/skills/cleanDrive/nettoyer.py <scratchpad>/cleandrive/slots.json`.
   - La sortie liste, dossier par dossier, ce qui partirait à la corbeille et la place libérée.
   - Elle signale aussi les dossiers « À VOIR ».
3. **Exécuter** : relance la même commande avec `--go`.
   - Si l'utilisateur a seulement tapé `/cleanDrive`, exécute directement après la simulation : c'est sa règle.
   - S'il a demandé de voir avant, montre la simulation et attends son accord.
4. **Rendre compte en quelques lignes** :
   - dossiers nettoyés et place libérée ;
   - dossiers déjà propres ;
   - « À VOIR » avec leur raison.

## Garde-fous (impératifs)

- Firestore en **lecture seule** : jamais `add_document`, `update_document` ni `delete_document`.
- **Corbeille seulement**, jamais de suppression définitive : tout reste récupérable 30 jours.
- Un dossier qui n'a pas exactement une vidéo sous-titrée et une affiche n'est **pas touché** : le script le signale « À VOIR ».
  - Si la vidéo n'est pas sous-titrée ou n'est pas encore remontée, propose à l'utilisateur de renommer ou de remonter, sans rien décider seul.
- Ne jamais lire ni afficher le secret `GOOGLE_DRIVE` : il est injecté par le proxy, comme pour `drive_envoi.py`.
- Ne touche à rien d'autre sur le Drive que les dossiers des vidéos publiées, dans « Vidéos ».
