#!/bin/bash
# Le python3 système (/usr/bin) a numpy ; un autre python3 placé avant dans le PATH (routines) ne l'a pas.
export PATH="/usr/bin:$PATH"
# Contrôle du raccord entre deux plans : dernière image de p(N-1) contre première image de pN (le rideau est dans le même
# état des deux côtés, l'écart attendu se limite au mouvement d'une seule image).
# Usage : raccord.sh <dossier_video> N        (N ≥ 2)   Sortie 0 dans tous les cas : l'ATTENTION ne bloque pas.
# Écrit <dossier_video>/out/pN/raccord.png : fin de N-1 | début de N | différence amplifiée.
SEUIL=0.92
V="$1"; N="$2"
if ! [[ "$N" =~ ^[0-9]+$ ]] || [ "$N" -lt 2 ] || [ -z "$V" ]; then echo "usage : raccord.sh <dossier_video> N  (N ≥ 2)"; exit 0; fi
P=$((N - 1))
A="$V/out/p$P/p${P}_final.mp4"; B="$V/out/p$N/p${N}_final.mp4"
if [ ! -f "$A" ] || [ ! -f "$B" ]; then echo "INFO raccord p$P → p$N non contrôlé : $( [ -f "$A" ] || echo "p$P" ) $( [ -f "$B" ] || echo "p$N" ) introuvable"; exit 0; fi
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ffmpeg -v error -sseof -0.1 -i "$A" -an -update 1 -y "$TMP/a.png"
ffmpeg -v error -i "$B" -an -frames:v 1 -y "$TMP/b.png"
S=$(ffmpeg -hide_banner -i "$TMP/a.png" -i "$TMP/b.png" -lavfi ssim -f null - 2>&1 | sed -n 's/.*SSIM.*All:\([0-9.]*\).*/\1/p' | tail -1)
if [ -z "$S" ]; then echo "INFO raccord p$P → p$N non mesuré (ffmpeg n'a pas rendu de SSIM)"; exit 0; fi
mkdir -p "$V/out/p$N"
ffmpeg -v error -y -i "$TMP/a.png" -i "$TMP/b.png" -filter_complex \
  "[0:v]format=rgb24,split=2[a1][a2];[1:v]format=rgb24,split=2[b1][b2];[a2][b2]blend=all_mode=difference,lutrgb=r='clip(val*5,0,255)':g='clip(val*5,0,255)':b='clip(val*5,0,255)'[d];[a1]scale=333:-1[x];[b1]scale=333:-1[y];[d]scale=333:-1[z];[x][y][z]hstack=3" \
  -frames:v 1 "$V/out/p$N/raccord.png"
SV=$(echo "$S" | sed 's/\./,/'); SS=$(printf '%.2f' "$S" | sed 's/\./,/')
if awk -v s="$S" -v t="$SEUIL" 'BEGIN{exit !(s >= t)}'; then
  echo "OK   raccord p$P → p$N (SSIM $SS)"
else
  echo "ATTENTION raccord p$P → p$N (SSIM $SS) : voir $V/out/p$N/raccord.png"
fi
# Saut d'image à la coupe (pose, objet, décor ou lumière qui change d'un coup) : SSIM ne le voit pas, fluidite.py le mesure.
python3 -I "$(cd "$(dirname "$0")" && pwd)/fluidite.py" "$V" --coupe "$N" || true
