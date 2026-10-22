#!/bin/bash
# Le python3 système (/usr/bin) a numpy ; un autre python3 placé avant dans le PATH (routines) ne l'a pas.
export PATH="/usr/bin:$PATH"
# Essai rapide d'un plan : prépare le dossier (construire.sh) puis rend des images clés et leur planche.
# Usage : essai.sh <dossier_video>/pN [instants en secondes séparés par des virgules, ex. 4.5,8.3]
# Images rendues : 0,30,60,… jusqu'à la dernière image du plan (durée de sa voix, duree.json) plus les instants donnés (t×30 arrondi). Sortie : <dossier_video>/out/…/planche_cles.png
# N'affiche que les erreurs ([page], syntaxe) et une ligne finale « planche → … » ; code de sortie non nul en cas d'erreur.
OUT="$(cd "$(dirname "$0")" && pwd)"; . "$OUT/garde.sh"; garde_dossier "$1" "$OUT"; P="$(cd "$1" && pwd)"; V="$(dirname "$P")"; N="$(basename "$P")"
LOG=$(mktemp); trap 'rm -f "$LOG"' EXIT
if ! "$OUT/construire.sh" "$P" >"$LOG" 2>&1; then cat "$LOG"; exit 1; fi
IMG=$(python3 -I - "${2:-}" "$P/duree.json" <<'PY'
import json, sys
der = json.load(open(sys.argv[2]))['images'] - 1
f = {max(0, min(der, int(float(x) * 30 + 0.5))) for x in sys.argv[1].split(',') if x.strip()}
im = sorted(set(range(0, der - 29, 30)) | {der} | f)
print(','.join(map(str, im)))
print(', '.join(f'{i / 30:.2f}'.rstrip('0').rstrip('.') for i in im))
PY
)
IM=$(echo "$IMG" | sed -n 1p); LST=$(echo "$IMG" | sed -n 2p)
RC=0
NODE_PATH=${NODE_PATH:-/opt/node22/lib/node_modules} node "$OUT/render.cjs" "$P" --name "$N" --out "$V/out" --stills "$IM" >"$LOG" 2>&1 || RC=$?
grep -E '^\[page\]|rreur|rror|^ATTENTION' "$LOG" | head -20
[ "$RC" -eq 0 ] || exit "$RC"
PL="$V/out/$N/planche_cles.png"   # la planche de CE plan (jamais celle d'un autre agent en tuilage)
[ "$PL" -nt "$P/index.html" ] || PL=
[ -n "$PL" ] || { echo "ERREUR : planche_cles.png introuvable"; tail -5 "$LOG"; exit 1; }
echo "planche → $PL (images : $LST)"
