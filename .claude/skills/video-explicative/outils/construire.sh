#!/bin/bash
# Prépare le dossier d'un plan pour le rendu.  Usage : construire.sh <dossier_video>/pN ["titre"]
#  - crée scene.js / timeline.js / mixage.py à partir des gabarits s'ils n'existent pas ;
#  - copie le kit (outils/kit/marionnettes.js), la bibliothèque commune (outils/bibliotheque/*.js),
#    la conduite du rideau (<dossier_video>/rideau.json → rideau.js), les raccords (<dossier_video>/raccords/*.js → raccords.js) et les personnages de la vidéo (<dossier_video>/persos.js) ;
#  - copie les décors partagés de la vidéo (<dossier_video>/decors.js) et écrit <dossier_video>/pN/CONSIGNE.md (FICHE.md sans le script ni les autres plans) ;
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
# raccords entre plans : chaque plan écrit son état final dans <dossier_video>/raccords/pN.js ; tous sont réunis ici (M.RACC.pN)
{ echo "M.RACC = M.RACC || {};"; cat "$V"/raccords/*.js 2>/dev/null || true; } > "$P/raccords.js"
if [ -f "$V/persos.js" ]; then cp "$V/persos.js" "$P/persos.js"; else echo "// (pas de bibliothèque propre à la vidéo)" > "$P/persos.js"; fi
if [ -f "$V/decors.js" ]; then cp "$V/decors.js" "$P/decors.js"; else echo "// (pas de décor partagé)" > "$P/decors.js"; fi
sed "s/__TITRE__/${2:-$N}/" "$OUT/modele.html" > "$P/index.html"
for f in marionnettes.js bibliotheque.js rideau.js raccords.js persos.js decors.js timeline.js scene.js; do node -e "new Function(require('fs').readFileSync('$P/$f','utf8'))" || { echo "ERREUR de syntaxe : $P/$f"; exit 1; }; done
# consigne allégée : la fiche sans le script ni les consignes des autres plans (le script reste dans FICHE.md)
LIG=""
if [ -f "$V/FICHE.md" ]; then
LIG=$(python3 -I - "$V/FICHE.md" "$P/CONSIGNE.md" "$N" <<'PY'
import re, sys
src, dst, nom = sys.argv[1:4]
m = re.fullmatch(r'p(\d+)', nom); num = m.group(1) if m else None
sortie, saute = [], None   # saute : None, 'script' (jusqu'au prochain ##) ou 'plan' (jusqu'au prochain # ou ##)
for l in open(src, encoding='utf-8').read().split('\n'):
    if re.match(r'## ', l): saute = 'script' if l.startswith('## Script') else None
    elif re.match(r'### ', l):
        p = re.match(r'### Plan (\d+)/', l)
        if p: saute = 'plan' if p.group(1) != num else None
        elif saute == 'plan': saute = None
    if saute is None: sortie.append(l)
open(dst, 'w', encoding='utf-8').write('\n'.join(sortie))
print(len(sortie))
PY
)
fi
if [ -n "$LIG" ]; then echo "$N prêt (CONSIGNE.md : $LIG lignes)"; else echo "$N prêt"; fi
