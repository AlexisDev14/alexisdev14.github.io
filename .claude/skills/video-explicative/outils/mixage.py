# Mixage des bruitages d'un plan : échantillons CC0 (Freesound) + sons synthétiques simples.
# Usage : python3 -I mixage.py <dossier_echantillons> <sortie.wav>
# Remplir la liste PLACEMENTS ci-dessous. Niveaux pensés pour passer SOUS une voix off.
import numpy as np, wave, sys, os, subprocess
SR, DUR = 48000, 10
DL, OUT = sys.argv[1], sys.argv[2]
buf = np.zeros((SR * DUR, 2))

def load(n, af=None):
    p = os.path.join(DL, f'{n}.wav')
    if not os.path.exists(p):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(DL, f'{n}.mp3'), '-ar', str(SR), '-ac', '2', p], check=True)
    if af:
        q = p.replace('.wav', '_f.wav'); subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-af', af, q], check=True); p = q
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).astype(float) / 32768
    return a if a.shape[1] == 2 else np.repeat(a, 2, 1)

def place(src, at, start, end, db, pan=0.0, fin=0.01, fout=0.1):
    """Pose src[start:end] (s) à l'instant at (s), crête à db dBFS, panoramique pan (-1..1)."""
    seg = src[int(start * SR):int(end * SR)].copy()
    seg *= (10 ** (db / 20)) / (np.abs(seg).max() + 1e-9)
    n = len(seg); env = np.ones(n); fi, fo = int(fin * SR), int(fout * SR)
    if fi: env[:fi] = np.linspace(0, 1, fi)
    if fo: env[-fo:] *= np.linspace(1, 0, fo)
    seg *= env[:, None] * [np.cos((pan + 1) * np.pi / 4) * 1.41, np.sin((pan + 1) * np.pi / 4) * 1.41]
    i0 = int(at * SR); i1 = min(len(buf), i0 + n)
    buf[i0:i1] += seg[:i1 - i0]

def chime(at, freqs=(1046.5, 1318.5), gap=0.18, db=-20):
    """Carillon doux (glockenspiel) : une note par fréquence."""
    for k, f0 in enumerate(freqs):
        d = np.arange(int(1.6 * SR)) / SR
        s = sum(a * np.sin(2 * np.pi * f0 * r * d) * np.exp(-d * kk) for r, a, kk in [(1, 1, 2.6), (2, .25, 4.5), (2.76, .3, 7)])
        s *= np.minimum(1, d / 0.003); s = s / np.abs(s).max() * 10 ** (db / 20)
        i0 = int((at + k * gap) * SR); i1 = min(len(buf), i0 + len(s)); buf[i0:i1] += s[:i1 - i0, None]

# ---- PLACEMENTS (exemple) ----
# place(load(449645), 0.85, 0.0, 1.3, -24)     # whoosh scintillant CC0 sous le « pop » à 1 s
# chime(8.6)

# Sécurité : jamais au-dessus de -6 dBFS (la voix off passe au-dessus au montage)
pk = np.abs(buf).max()
if pk > 10 ** (-6 / 20): buf *= 10 ** (-6 / 20) / pk
o = wave.open(OUT, 'wb'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR)
o.writeframes((np.clip(buf, -1, 1) * 32767).astype(np.int16).tobytes()); o.close()
print('crête', round(20 * np.log10(np.abs(buf).max() + 1e-9), 1), 'dBFS')
