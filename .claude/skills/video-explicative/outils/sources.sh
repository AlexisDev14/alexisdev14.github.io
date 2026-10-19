#!/bin/bash
# Archive des SOURCES d'une vidéo (pas des rendus), pour pouvoir corriger un plan plus tard sans tout reconstruire.
# Usage : sources.sh <dossier_video> <sortie.zip>      (ex. "<travail>/out/<Sujet> — sources.zip", déposée par drive_envoi.py dans « Sources »)
# Contenu : FICHE.md, rideau.json, durees.json, script.txt, voix.txt, TEXTES.md, SCRIPT.md, HORODATAGE.txt, persos.js, persos.md,
#   decors/, raccords/, voix/pN.json + MOTS.md (instants des mots ; ni mp3 ni brut.json), et pour chaque dossier de plan
#   (p1…p6, casting, affiche) : scene.js, timeline.js, mixage.py. Quelques centaines de Ko.
# Reprise : télécharger l'archive, la décompresser dans un nouveau dossier de travail, y remettre voix/pN.mp3 (sous-dossier
#   « Audio ») et out/pN/pN_final.mp4 (« Plans ») depuis le Drive, puis construire.sh / produire.sh sur le plan à corriger.
set -eo pipefail
V="$(cd "$1" && pwd)"; Z="$2"
case "$Z" in /*) ;; *) Z="$PWD/$Z" ;; esac
cd "$V"
L=()
for f in FICHE.md rideau.json durees.json script.txt voix.txt TEXTES.md SCRIPT.md HORODATAGE.txt persos.js persos.md voix/MOTS.md; do [ -f "$f" ] && L+=("$f"); done
for f in voix/p[1-6].json; do [ -f "$f" ] && L+=("$f"); done
for d in decors raccords; do [ -d "$d" ] && L+=("$d"); done
for p in p1 p2 p3 p4 p5 p6 casting affiche; do for f in scene.js timeline.js mixage.py; do [ -f "$p/$f" ] && L+=("$p/$f"); done; done
rm -f "$Z"
python3 -I - "$Z" "${L[@]}" <<'PY'
import os, sys, zipfile
z = zipfile.ZipFile(sys.argv[1], 'w', zipfile.ZIP_DEFLATED)
for a in sys.argv[2:]:
    if os.path.isdir(a):
        for r, _, fs in os.walk(a):
            for f in fs: z.write(os.path.join(r, f))
    else: z.write(a)
z.close()
print(f'→ {sys.argv[1]} ({len(z.namelist())} fichiers, {os.path.getsize(sys.argv[1]) // 1024} Ko)')
PY
