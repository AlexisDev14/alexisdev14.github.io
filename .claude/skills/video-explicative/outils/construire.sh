#!/bin/bash
# Le python3 système (/usr/bin) a numpy ; un autre python3 placé avant dans le PATH (routines) ne l'a pas.
export PATH="/usr/bin:$PATH"
# Prépare le dossier d'un plan pour le rendu.  Usage : construire.sh <dossier_video>/pN ["titre"]
#  - crée scene.js / timeline.js / mixage.py à partir des gabarits s'ils n'existent pas ;
#  - copie le kit (outils/kit/marionnettes.js), la bibliothèque commune (outils/bibliotheque/*.js),
#    la conduite du rideau (<dossier_video>/rideau.json → rideau.js), les raccords (<dossier_video>/raccords/*.js → raccords.js) et les personnages de la vidéo (<dossier_video>/persos.js) ;
#  - réunit les décors partagés de la vidéo (<dossier_video>/decors/pN.js) et écrit <dossier_video>/pN/CONSIGNE.md (FICHE.md sans le script ni les autres plans) ;
#  - durée du plan = durée de sa voix (<dossier_video>/durees.json, écrit par voix.py ; 10 s sans voix) : duree.py écrit duree.json et duree.js (DUREE, DEBUT, IMAGES) ;
#  - écrit index.html et vérifie la syntaxe de chaque fichier.
set -e
OUT="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; V="$(dirname "$P")"; N="$(basename "$P")"
if [ ! -f "$OUT/kit/marionnettes.js" ] || [ -n "$(find "$OUT/kit/src" -newer "$OUT/kit/marionnettes.js" -name "*.js")" ]; then "$OUT/kit/assemble.sh" >/dev/null; fi
for f in scene.js timeline.js mixage.py; do [ -f "$P/$f" ] || sed "s/__PLAN__/$N/g" "$OUT/gabarits/$f" > "$P/$f"; done
cp "$OUT/kit/marionnettes.js" "$P/marionnettes.js"
cat "$OUT"/bibliotheque/*.js > "$P/bibliotheque.js"            # personnages validés des vidéos précédentes (M.reb, …)
# durée du plan = durée de sa voix (duree.py : duree.json, duree.js) ; conduite du rideau de toute la vidéo
# (<dossier_video>/rideau.json, temps globaux ou locaux avec "plan": N) → rideau.json du plan en temps globaux réels → rideau.js
NUM=$(echo "$N" | grep -o '[0-9]\+' | head -1); NUM=${NUM:-1}
IMAGES=$(python3 -I "$OUT/duree.py" "$V" "$P" "$N")
if [ -f "$P/rideau.json" ]; then R=$(cat "$P/rideau.json"); else R='null'; fi
printf 'M.PLAN = %s; M.DEBUT = DEBUT; M.DUREE = DUREE;\nM.RIDEAU = (function (j) { return j ? M.conduite(j.cues, j) : null; })(%s);\n' "$NUM" "$R" > "$P/rideau.js"
# raccords entre plans : chaque plan écrit son état final dans <dossier_video>/raccords/pN.js ; tous sont réunis ici (M.RACC.pN)
{ echo "M.RACC = M.RACC || {};"; cat "$V"/raccords/*.js 2>/dev/null || true; } > "$P/raccords.js"
if [ -f "$V/persos.js" ]; then cp "$V/persos.js" "$P/persos.js"; else echo "// (pas de bibliothèque propre à la vidéo)" > "$P/persos.js"; fi
# décors partagés : un fichier par plan (<dossier_video>/decors/pN.js, jamais deux agents dans le même fichier), réunis ici ;
# chaque fichier enregistre son pré-rendu sous M.dec.init_pN, et M.dec.init() les appelle tous (+ l'ancien <dossier_video>/decors.js s'il existe)
{ echo "M.dec = M.dec || {};"; [ -f "$V/decors.js" ] && cat "$V/decors.js"
  echo "(function () { var d = M.dec, base = d.init; d.init = function () { if (base) base(); for (var k in d) if (/^init_/.test(k)) d[k](); }; })();"
  cat "$V"/decors/*.js 2>/dev/null || true; } > "$P/decors.js"
sed -e "s/__TITRE__/${2:-$N}/" -e "s/__IMAGES__/$IMAGES/" "$OUT/modele.html" > "$P/index.html"
for f in duree.js marionnettes.js bibliotheque.js rideau.js raccords.js persos.js decors.js timeline.js scene.js; do node -e "new Function(require('fs').readFileSync('$P/$f','utf8'))" || { echo "ERREUR de syntaxe : $P/$f"; exit 1; }; done
# consigne allégée : la fiche sans le script ni les consignes des autres plans (le script reste dans FICHE.md)
LIG=""
if [ -f "$V/FICHE.md" ]; then
LIG=$(python3 -I - "$V/FICHE.md" "$P/CONSIGNE.md" "$N" <<'PY'
import re, sys
src, dst, nom = sys.argv[1:4]
m = re.fullmatch(r'p(\d+)', nom); num = m.group(1) if m else None
sortie, saute, trouve = [], None, False   # saute : None, 'script' (jusqu'au prochain ##) ou 'plan' (jusqu'au prochain # ou ##)
for l in open(src, encoding='utf-8').read().split('\n'):
    if re.match(r'## ', l): saute = 'script' if l.startswith('## Script') else None
    elif re.match(r'### ', l):
        p = re.match(r'### Plan (\d+)/', l)
        if p:
            saute = 'plan' if p.group(1) != num else None
            trouve = trouve or p.group(1) == num
        elif saute == 'plan': saute = None
    if saute is None: sortie.append(l)
open(dst, 'w', encoding='utf-8').write('\n'.join(sortie))
if num and not trouve:
    print(f"ATTENTION CONSIGNE.md : aucun titre « ### Plan {num}/6 » dans FICHE.md : CONSIGNE.md ne contient la consigne d'aucun plan (titres imposés : voir SKILL.md, étape 2)", file=sys.stderr)
print(len(sortie))
PY
)
fi
DS=$(awk -v i="$IMAGES" 'BEGIN{printf "%.2f", i/30}' | tr . ,)
if [ -n "$LIG" ]; then echo "$N prêt : $DS s, $IMAGES images (CONSIGNE.md : $LIG lignes)"; else echo "$N prêt : $DS s, $IMAGES images"; fi
