#!/bin/bash
# Le python3 système (/usr/bin) a numpy ; un autre python3 placé avant dans le PATH (routines) ne l'a pas.
export PATH="/usr/bin:$PATH"
# Contrôle technique d'un plan livré : format, durée, son, crête audio.  Usage : verifier.sh <video.mp4> [durée attendue en s]
# Son : avec <video>/voix/pN.mp3, la voix off est incluse (crête ≤ −1 dBFS, sonie −16 à −12 LUFS) ; sans elle, bruitages seuls (crête ≤ −22).
# Vidéo complète (assembler.sh) : AVEC_VOIX=1 force le contrôle « voix off incluse ».
# Durée attendue : l'argument, sinon <video>/pN/duree.json pour <video>/out/pN/…mp4 (durée de la voix du plan), sinon 10 s.
V="$1"
python3 - "$V" "${2:-}" <<'PY'
import json, os, subprocess, sys
v = sys.argv[1]
attendu = float(sys.argv[2]) if sys.argv[2] else 10.0
if not sys.argv[2]:
    dj = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(v)))), os.path.basename(os.path.dirname(os.path.abspath(v))), 'duree.json')
    if os.path.exists(dj): attendu = json.load(open(dj))['duree']
vv = os.path.abspath(v); nom = os.path.basename(os.path.dirname(vv))
avec_voix = os.environ.get('AVEC_VOIX') == '1' or os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(vv))), 'voix', nom + '.mp3'))
j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', v], capture_output=True, text=True).stdout)
vs = [s for s in j['streams'] if s['codec_type'] == 'video'][0]; au = [s for s in j['streams'] if s['codec_type'] == 'audio']
ok = []
ok.append(('1080×1920', vs['width'] == 1080 and vs['height'] == 1920))
ok.append(('30 im/s', vs['r_frame_rate'] in ('30/1',)))
du = float(vs.get('duration') or j['format']['duration'])
ok.append((f'durée {du:.2f} s (attendu {attendu:.2f} s, celle de la voix)'.replace('.', ','), abs(du - attendu) < 0.05))
ok.append(('yuv420p', vs.get('pix_fmt') == 'yuv420p'))
ok.append(('son AAC stéréo', bool(au) and au[0]['codec_name'] == 'aac' and au[0]['channels'] == 2))
vol = subprocess.run(['ffmpeg', '-i', v, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
pk = float(vol.split('max_volume:')[1].split('dB')[0]) if 'max_volume' in vol else 0
if avec_voix:   # voix off incluse : crête ≤ −1 dBFS, sonie proche de −14 LUFS
    lu = float(subprocess.run(['ffmpeg', '-nostats', '-i', v, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr.split('I:')[-1].split('LUFS')[0])
    ok.append((f'voix off incluse : crête {pk} dBFS ≤ −1', pk <= -0.9))
    ok.append((f'voix off incluse : sonie {lu} LUFS (−16 à −12)', -16 <= lu <= -12))
else:
    ok.append((f'crête son {pk} dBFS ≤ −22 (bruitages seuls, pas de voix)', pk <= -22))
for k, b in ok: print(('OK   ' if b else 'ÉCHEC') + ' ' + k)
sys.exit(0 if all(b for _, b in ok) else 1)
PY
