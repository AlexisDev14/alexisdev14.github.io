#!/bin/bash
# Prépare le dossier d'un plan pour le rendu.  Usage : construire.sh <dossier_video>/pN ["titre"]
#  - crée scene.js / timeline.js / mixage.py à partir des gabarits s'ils n'existent pas ;
#  - copie le kit (outils/kit/marionnettes.js), la bibliothèque commune (outils/bibliotheque/*.js),
#    la conduite du rideau (<dossier_video>/rideau.json → rideau.js) et les personnages de la vidéo (<dossier_video>/persos.js) ;
#  - écrit index.html et vérifie la syntaxe de chaque fichier.
set -e
OUT="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; V="$(dirname "$P")"; N="$(basename "$P")"
if [ ! -f "$OUT/kit/marionnettes.js" ] || [ -n "$(find "$OUT/kit/src" -newer "$OUT/kit/marionnettes.js" -name "*.js")" ]; then "$OUT/kit/assemble.sh" >/dev/null; fi
for f in scene.js timeline.js mixage.py; do [ -f "$P/$f" ] || sed "s/__PLAN__/$N/g" "$OUT/gabarits/$f" > "$P/$f"; done
cp "$OUT/kit/marionnettes.js" "$P/marionnettes.js"
cat "$OUT"/bibliotheque/*.js > "$P/bibliotheque.js"            # personnages validés des vidéos précédentes (M.reb, …)
# conduite du rideau sur toute la vidéo (<dossier_video>/rideau.json, temps globaux) → rideau.js, avec le numéro du plan
NUM=$(echo "$N" | grep -o '[0-9]\+' | head -1); NUM=${NUM:-1}
if [ -f "$V/rideau.json" ]; then cp "$V/rideau.json" "$P/rideau.json"; R=$(cat "$V/rideau.json"); else R='null'; rm -f "$P/rideau.json"; fi
printf 'M.PLAN = %s;\nM.RIDEAU = (function (j) { return j ? M.conduite(j.cues, j) : null; })(%s);\n' "$NUM" "$R" > "$P/rideau.js"
if [ -f "$V/persos.js" ]; then cp "$V/persos.js" "$P/persos.js"; else echo "// (pas de bibliothèque propre à la vidéo)" > "$P/persos.js"; fi
sed "s/__TITRE__/${2:-$N}/" "$OUT/modele.html" > "$P/index.html"
for f in marionnettes.js bibliotheque.js rideau.js persos.js timeline.js scene.js; do node -e "new Function(require('fs').readFileSync('$P/$f','utf8'))" || { echo "ERREUR de syntaxe : $P/$f"; exit 1; }; done
echo "$N prêt"
