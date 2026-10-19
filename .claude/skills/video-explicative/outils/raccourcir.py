#!/usr/bin/env python3
# Remontage d'une vidéo ANCIENNE (plans de 10 s rendus avant le calage des plans sur la voix) : chaque plan est raccourci à sa voix.
# Usage : python3 -I raccourcir.py <travail> <dossier des plans d'origine>
#   Lit <plans>/pN_final.mp4 (image + bruitages, SANS voix) et <travail>/voix/pN.mp3 ; écrit <travail>/out/pN/pN.mp4 (muet),
#   sfx.wav et pN_final.mp4 (voix posée à 0 s, sfx_lib.mux : −14 LUFS, crête −1 dBFS), prêts pour assembler.sh puis soustitres.py.
# Règle de coupe (validée sur Big Ben) :
#   - on garde le plan jusqu'à la fin de la voix + 0,4 s, prolongé tant qu'un mouvement en cours n'est pas fini ;
#   - le temps mort qui suit (image immobile) est retiré ; une action qui reprend ensuite (fermeture de rideau, gag final) est gardée
#     entière, de son début à la fin du plan, avec ses bruitages : la coupe tombe sur une image immobile, elle ne se voit pas ;
#   - une voix plus longue que le plan prolonge sa dernière image (gel) jusqu'à la fin de la voix + 0,4 s.
# Bruitages coupés aux mêmes instants que l'image (fondus de 10 ms aux raccords).
import json, math, os, subprocess, sys
import numpy as np

T, P = sys.argv[1:3]
OUTILS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, OUTILS)
from sfx_lib import VOIX_LUFS, sonie

def duree(f):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                                capture_output=True, text=True, check=True).stdout)
def mouvement(f):   # écart moyen entre images successives (vignettes en gris), indice k = passage de l'image k à k+1
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', 'scale=108:192,format=gray', '-f', 'rawvideo', '-'],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, 192, 108).astype(np.float32)
    return np.abs(np.diff(a, axis=0)).mean(axis=(1, 2)), len(a)

bilan = []
for n in range(1, 7):
    src, voix = os.path.join(P, f'p{n}_final.mp4'), os.path.join(T, 'voix', f'p{n}.mp3')
    d, nb = mouvement(src)
    bouge = d > 0.3
    fin = math.ceil((duree(voix) + 0.4) * 30)            # image de fin de la partie A (exclue)
    segs, gel = [], 0.0
    if fin >= nb:
        segs, gel = [(0, nb)], (fin - nb) / 30
    else:
        while fin < nb - 1 and bouge[fin - 1:fin + 5].any():  # mouvement en cours : on attend 6 images immobiles
            fin += 1
        reprise = next((k for k in range(fin, nb - 1) if bouge[k]), None)
        if reprise is None:
            segs = [(0, fin)]
        else:
            debut_b = max(fin, reprise - 3)
            segs = [(0, nb)] if debut_b - fin < 9 else [(0, fin), (debut_b, nb)]   # moins de 0,3 s à retirer : on garde tout
    os.makedirs(os.path.join(T, 'out', f'p{n}'), exist_ok=True)
    fv = ''.join(f'[0:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{k}];' for k, (a, b) in enumerate(segs))
    fa = ''.join(f'[0:a]atrim={a / 30}:{b / 30},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={(b - a) / 30 - 0.01}:d=0.01[a{k}];'
                 for k, (a, b) in enumerate(segs))
    k = len(segs)
    gv = f',tpad=stop_mode=clone:stop_duration={gel:.3f}' if gel else ''
    garde = sum(b - a for a, b in segs) / 30 + gel
    ga = f',apad=whole_dur={garde:.4f},atrim=end={garde:.4f}'   # bruitages à la durée exacte de l'image (sinon -shortest de mux coupe l'image)
    out = os.path.join(T, 'out', f'p{n}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex',
                    fv + ''.join(f'[v{i}]' for i in range(k)) + f'concat=n={k}:v=1:a=0{gv}[v]', '-map', '[v]',
                    '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30', f'{out}/p{n}.mp4'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex',
                    fa + ''.join(f'[a{i}]' for i in range(k)) + f'concat=n={k}:v=0:a=1{ga}[a]', '-map', '[a]',
                    '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', f'{out}/sfx.wav'], check=True)
    # = sfx_lib.mux (voix à 0 s, −14 LUFS, limiteur −1 dBFS), mais coupé à la durée exacte de l'image : -shortest y rognait des images
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{out}/p{n}.mp4', '-i', f'{out}/sfx.wav', '-i', voix, '-filter_complex',
                    f'[2:a]volume={VOIX_LUFS - sonie(voix):.2f}dB,aresample=48000,aformat=channel_layouts=stereo,apad[v];'
                    '[1:a][v]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.891:level=false[a]', '-map', '0:v', '-map', '[a]',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-t', f'{garde:.4f}', f'{out}/p{n}_final.mp4'], check=True)
    bilan.append(f'p{n} : voix {duree(voix):.2f} s, gardé ' + ' + '.join(f'{a / 30:.2f}–{b / 30:.2f}' for a, b in segs)
                 + (f' + gel {gel:.2f}' if gel else '') + f' = {garde:.2f} s')
print('\n'.join(bilan))
