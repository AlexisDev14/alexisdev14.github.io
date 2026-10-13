#!/bin/bash
# Planche de contrôle : 16 images réparties sur la vidéo (8 × 2), ou --de A --a B pour un gros plan temporel.
# Usage : planche.sh <video.mp4> <sortie.png> [--de 7.5 --a 9.5] [--crop L:H:X:Y]
V="$1"; S="$2"; shift 2; DE=0; A=10; CROP=""
while [ $# -gt 0 ]; do case "$1" in --de) DE=$2; shift 2;; --a) A=$2; shift 2;; --crop) CROP="crop=$2,"; shift 2;; *) shift;; esac; done
FPS=$(python3 -c "print(16/($A-$DE))")
ffmpeg -y -loglevel error -ss "$DE" -to "$A" -i "$V" -vf "${CROP}fps=$FPS,scale=270:-2,tile=8x2" -frames:v 1 "$S" && echo "planche → $S"
