#!/usr/bin/env python3
# Instants des mots d'un enregistrement déjà fait (voix off sans voix/pN.json, montage de l'utilisateur), par faster-whisper.
# Usage : <venv>/bin/python mots_whisper.py <audio ou vidéo> [...]   → écrit <fichier sans extension>.json : {"mots": [[mot, début, fin], ...]}
#   (même format que voix/pN.json de voix.py, lu par soustitres.py et voix_montage.py ; le texte est approximatif, seuls les instants comptent).
# Installation (une fois par session, dans le scratchpad, jamais dans le dépôt) :
#   python3 -m venv <scratchpad>/venv-fw && <scratchpad>/venv-fw/bin/pip install -q faster-whisper
# Le décodage passe par ffmpeg (PyAV de faster-whisper échoue sur certains mp3 d'ElevenLabs).
import json, os, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

m = WhisperModel('small', device='cpu', compute_type='int8')
for f in sys.argv[1:]:
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vn', '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(a, language='fr', word_timestamps=True, vad_filter=False)
    mots = [[w.word.strip(), round(w.start, 2), round(w.end, 2)] for s in segs for w in s.words]
    sortie = os.path.splitext(f)[0] + '.json'
    json.dump({'mots': mots}, open(sortie, 'w'), ensure_ascii=False)
    print(f'{os.path.basename(f)} → {os.path.basename(sortie)} : ' + ' '.join(w for w, *_ in mots))
