#!/bin/bash
# Rendu complet d'un plan + bruitages + planche de contrôle.  Usage : produire.sh <dossier_video>/pN [workers=3]
# Sorties : <dossier_video>/out/pN/pN.mp4 (muet), pN_final.mp4 (avec bruitages), planche.png (16 images), sfx.wav
set -e
OUT="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; V="$(dirname "$P")"; N="$(basename "$P")"
"$OUT/construire.sh" "$P" >/dev/null
NODE_PATH=${NODE_PATH:-/opt/node22/lib/node_modules} node "$OUT/render.cjs" "$P" --name "$N" --out "$V/out" --workers "${2:-3}"
( cd "$P" && python3 -I mixage.py "$OUT" sfx.wav )
python3 -I -c "import sys; sys.path.insert(0, '$OUT'); from sfx_lib import mux; mux('$V/out/$N/$N.mp4', '$P/sfx.wav', '$V/out/$N/${N}_final.mp4')"
"$OUT/planche.sh" "$V/out/$N/${N}_final.mp4" "$V/out/$N/planche.png"
"$OUT/verifier.sh" "$V/out/$N/${N}_final.mp4"
