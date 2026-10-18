#!/bin/bash
# Le python3 système (/usr/bin) a numpy ; un autre python3 placé avant dans le PATH (routines) ne l'a pas.
export PATH="/usr/bin:$PATH"
# Rendu complet d'un plan + bruitages + planche de contrôle + contrôles automatiques.  Usage : produire.sh <dossier_video>/pN [workers=3]
# Sorties : <dossier_video>/out/pN/pN.mp4 (muet), pN_final.mp4 (bruitages + voix off ElevenLabs <dossier_video>/voix/pN.mp3 si elle existe,
#          à −14 LUFS, crête −1 dBFS), planche.png (16 images), sfx.wav
# Contrôles, dans l'ordre :
#   verifier.sh : format, durée, son (un ÉCHEC fait échouer produire.sh, après les deux autres contrôles) ;
#   sauts.py    : sauts brusques (accessoire qui surgit ou disparaît) et fond nu visible dans la scène (ATTENTION, sans blocage) ;
#   raccord.sh  : fin du plan précédent contre début de celui-ci, si N ≥ 2 et si out/p(N-1)/p(N-1)_final.mp4 existe
#                 (ATTENTION sans blocage ; image de comparaison out/pN/raccord.png).
# La sortie du rendu est allégée : les lignes de progression « image k/N » de render.cjs sont filtrées (les erreurs restent).
set -eo pipefail
OUT="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; V="$(dirname "$P")"; N="$(basename "$P")"
"$OUT/construire.sh" "$P" >/dev/null
NODE_PATH=${NODE_PATH:-/opt/node22/lib/node_modules} node "$OUT/render.cjs" "$P" --name "$N" --out "$V/out" --workers "${2:-3}" 2>&1 | { grep -v '^image [0-9]*/[0-9]* ' || true; }
( cd "$P" && python3 -I mixage.py "$OUT" sfx.wav )
python3 -I -c "import sys; sys.path.insert(0, '$OUT'); from sfx_lib import mux; mux('$V/out/$N/$N.mp4', '$P/sfx.wav', '$V/out/$N/${N}_final.mp4', '$V/voix/$N.mp3')"
"$OUT/planche.sh" "$V/out/$N/${N}_final.mp4" "$V/out/$N/planche.png"
RC=0
"$OUT/verifier.sh" "$V/out/$N/${N}_final.mp4" || RC=$?
python3 -I "$OUT/sauts.py" "$V/out/$N/${N}_final.mp4" || true
NUM="${N#p}"
if [[ "$NUM" =~ ^[0-9]+$ ]] && [ "$NUM" -ge 2 ] && [ -f "$V/out/p$((NUM - 1))/p$((NUM - 1))_final.mp4" ]; then
  "$OUT/raccord.sh" "$V" "$NUM" || true
fi
exit $RC
