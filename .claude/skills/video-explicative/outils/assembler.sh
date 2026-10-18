#!/bin/bash
# Le python3 système (/usr/bin) a numpy ; un autre python3 placé avant dans le PATH (routines) ne l'a pas.
export PATH="/usr/bin:$PATH"
# Vidéo complète : les 6 plans bout à bout, voix off et bruitages compris, en UN fichier.  Usage : assembler.sh <dossier_video> [sortie.mp4]
# Lit <dossier_video>/out/p1/p1_final.mp4 … p6_final.mp4 (dans l'ordre ; tous doivent exister) et écrit par défaut
# <dossier_video>/out/video_complete.mp4 : image des plans recopiée telle quelle (sans réencodage), son AAC 192k stéréo ramené à −14 LUFS
# (VOIX_LUFS de sfx_lib), crête −1 dBFS. Les plans se raccordent tels quels : le rideau et ses bruitages enjambent déjà les coupes.
# Contrôle à la fin : verifier.sh (durée attendue = somme des 6 plans, son avec voix).
set -eo pipefail
OUT="$(cd "$(dirname "$0")" && pwd)"; V="$(cd "$1" && pwd)"; S="${2:-$V/out/video_complete.mp4}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ENTREES=(); FILTRE=""; ATTENDU=0
for N in 1 2 3 4 5 6; do
  F="$V/out/p$N/p${N}_final.mp4"
  [ -f "$F" ] || { echo "ÉCHEC : $F manquant (lancer produire.sh sur p$N)"; exit 1; }
  D=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$F")
  ln -s "$F" "$TMP/p$N.mp4"; echo "file '$TMP/p$N.mp4'" >> "$TMP/liste.txt"   # lien : un chemin avec apostrophe casserait la liste
  ENTREES+=(-i "$F"); FILTRE+="[$N:a]atrim=end=$D,apad=whole_dur=$D,asetpts=PTS-STARTPTS[a$N];"
  ATTENDU=$(python3 -c "print(round($ATTENDU + $D, 4))")
done
# Image : les 6 flux mis bout à bout sans réencodage (même réglage de rendu pour tous les plans : nombre d'images exact) ;
# son : chaque plan coupé ou complété à la durée exacte de son image, pour que voix et image restent calées sur toute la vidéo.
ffmpeg -y -loglevel error -f concat -safe 0 -i "$TMP/liste.txt" "${ENTREES[@]}" \
  -filter_complex "${FILTRE}[a1][a2][a3][a4][a5][a6]concat=n=6:v=0:a=1[a]" -map 0:v -map '[a]' \
  -c:v copy -c:a pcm_s16le -ar 48000 -ac 2 "$TMP/brut.mkv"
python3 -I -c "
import subprocess, sys; out, brut, sortie = sys.argv[1:4]; sys.path.insert(0, out); from sfx_lib import sonie, VOIX_LUFS
g = VOIX_LUFS - sonie(brut)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', brut, '-af', f'volume={g:.2f}dB,alimiter=limit=0.891:level=false',
                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-movflags', '+faststart', sortie], check=True)
print(f'→ {sortie} (6 plans bout à bout, voix off incluse, gain {g:+.2f} dB)')" "$OUT" "$TMP/brut.mkv" "$S"
AVEC_VOIX=1 "$OUT/verifier.sh" "$S" "$ATTENDU"
