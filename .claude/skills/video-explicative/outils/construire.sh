#!/bin/bash
# Prépare le dossier d'un plan pour le rendu.  Usage : construire.sh <dossier_video>/pN ["titre"]
#  - crée scene.js / timeline.js / mixage.py à partir des gabarits s'ils n'existent pas ;
#  - copie le kit (outils/kit/marionnettes.js) et la bibliothèque de la vidéo (<dossier_video>/persos.js) ;
#  - écrit index.html et vérifie la syntaxe de chaque fichier.
set -e
OUT="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; V="$(dirname "$P")"; N="$(basename "$P")"
[ -f "$OUT/kit/marionnettes.js" ] || "$OUT/kit/assemble.sh" >/dev/null
for f in scene.js timeline.js mixage.py; do [ -f "$P/$f" ] || sed "s/__PLAN__/$N/g" "$OUT/gabarits/$f" > "$P/$f"; done
cp "$OUT/kit/marionnettes.js" "$P/marionnettes.js"
if [ -f "$V/persos.js" ]; then cp "$V/persos.js" "$P/persos.js"; else echo "// (pas de bibliothèque propre à la vidéo)" > "$P/persos.js"; fi
sed "s/__TITRE__/${2:-$N}/" "$OUT/modele.html" > "$P/index.html"
for f in marionnettes.js persos.js timeline.js scene.js; do node -e "new Function(require('fs').readFileSync('$P/$f','utf8'))" || { echo "ERREUR de syntaxe : $P/$f"; exit 1; }; done
echo "$N prêt"
