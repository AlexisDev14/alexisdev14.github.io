#!/bin/bash
# Le python3 système (/usr/bin) a numpy ; un autre python3 placé avant dans le PATH (routines) ne l'a pas.
export PATH="/usr/bin:$PATH"
# Contrôle technique d'un plan livré : format, durée, son, crête audio.  Usage : verifier.sh <video.mp4>
V="$1"
python3 - "$V" <<'PY'
import json, subprocess, sys
v = sys.argv[1]
j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', v], capture_output=True, text=True).stdout)
vs = [s for s in j['streams'] if s['codec_type'] == 'video'][0]; au = [s for s in j['streams'] if s['codec_type'] == 'audio']
ok = []
ok.append(('1080×1920', vs['width'] == 1080 and vs['height'] == 1920))
ok.append(('30 im/s', vs['r_frame_rate'] in ('30/1',)))
ok.append(('10,0 s', abs(float(j['format']['duration']) - 10) < 0.05))
ok.append(('yuv420p', vs.get('pix_fmt') == 'yuv420p'))
ok.append(('son AAC stéréo', bool(au) and au[0]['codec_name'] == 'aac' and au[0]['channels'] == 2))
vol = subprocess.run(['ffmpeg', '-i', v, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
pk = float(vol.split('max_volume:')[1].split('dB')[0]) if 'max_volume' in vol else 0
ok.append((f'crête son {pk} dBFS ≤ −22', pk <= -22))
for k, b in ok: print(('OK   ' if b else 'ÉCHEC') + ' ' + k)
sys.exit(0 if all(b for _, b in ok) else 1)
PY
