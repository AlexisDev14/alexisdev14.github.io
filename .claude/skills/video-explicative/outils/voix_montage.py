#!/usr/bin/env python3
# Voix off retouchée par l'utilisateur dans son montage (Canva) sans mise à jour de voix/pN.mp3 : retrouve, plan par plan, la voix
# réellement montée et la reprend du montage quand elle diffère.
# Usage : python3 -I voix_montage.py <travail> <montage.mp4> [--appliquer]
#   Lit <travail>/script.txt (6 paragraphes = texte final, celui du montage), <travail>/voix/pN.mp3, et les .json de mots_whisper.py
#   de chaque pN.mp3 (voix/pN.json) et du montage (<montage sans extension>.json).
#   Pour chaque plan : situe son paragraphe dans le montage (alignement des mots), puis compare les instants des mots de pN.mp3 à ceux
#   de ce passage (même enregistrement = ≥ 80 % des mots appariés et décalage constant à 0,04 s près ; une prise régénérée, même au texte identique, a des
#   instants différents). Affiche le verdict. Avec --appliquer, chaque voix différente est remplacée par le passage
#   du montage (pN.mp3 d'origine gardé en voix/pN_origine.mp3) ; refaire ensuite mots_whisper.py sur les voix remplacées.
import difflib, json, os, re, shutil, subprocess, sys, unicodedata
import numpy as np

T, M = sys.argv[1], sys.argv[2]
appliquer = '--appliquer' in sys.argv
def norm(w): return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', w.lower()).encode('ascii', 'ignore').decode())
def ressemblance(mp3_json, i0, i1):
    """Même enregistrement ⇔ mêmes écarts entre les mots : on apparie les mots de pN.json (mots_whisper.py sur pN.mp3) à ceux du passage
    du montage, et on mesure la dispersion du décalage (médiane des écarts à la médiane, en s). Renvoie (part de mots appariés, dispersion)."""
    a = json.load(open(mp3_json))['mots']
    b = mots[i0:i1 + 1]
    sm = difflib.SequenceMatcher(None, [norm(w) for w, *_ in a], [norm(w) for w, *_ in b], autojunk=False)
    d = [b[j + k][1] - a[i + k][1] for i, j, n in sm.get_matching_blocks() for k in range(n)]
    if len(d) < 3: return 0.0, 9.9
    d = np.array(d)
    return len(d) / max(len(a), len(b)), float(np.median(np.abs(d - np.median(d))))

paras = [p.strip() for p in open(os.path.join(T, 'script.txt')).read().split('\n\n') if p.strip()]
assert len(paras) == 6, f'script.txt : {len(paras)} paragraphes au lieu de 6'
mots = json.load(open(os.path.splitext(M)[0] + '.json'))['mots']
mm = [norm(w) for w, *_ in mots]
pos = 0
for n, p in enumerate(paras, 1):
    pw = [x for x in (norm(w) for w in re.split(r"[\s'’-]+", p)) if x]   # même découpage que whisper (« d' », « -même »)
    sm = difflib.SequenceMatcher(None, mm[pos:], pw, autojunk=False)
    blocs = [b for b in sm.get_matching_blocks() if b.size]
    if not blocs: print(f'p{n} : paragraphe introuvable dans le montage'); continue
    i0, i1 = pos + blocs[0].a, pos + blocs[-1].a + blocs[-1].size - 1
    debut = max(mots[i0][1] - 0.08, mots[i0 - 1][2] if i0 > 0 else 0)
    fin = min(mots[i1][2] + 0.30, mots[i1 + 1][1] - 0.05 if i1 + 1 < len(mots) else mots[i1][2] + 0.30)
    pos = i1 + 1
    v = os.path.join(T, 'voix', f'p{n}.mp3')
    part, disp = ressemblance(os.path.join(T, 'voix', f'p{n}.json'), i0, i1)
    meme = part >= 0.8 and disp <= 0.04
    print(f'p{n} : montage {debut:.2f}–{fin:.2f} s ; p{n}.mp3 : {part:.0%} des mots appariés, dispersion {disp:.3f} s → ' + ('même voix' if meme else 'VOIX RETOUCHÉE'))
    if appliquer and not meme:
        o = os.path.join(T, 'voix', f'p{n}_origine.mp3')
        if not os.path.exists(o): shutil.copy(v, o)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{debut:.3f}', '-to', f'{fin:.3f}', '-i', M, '-vn',
                        '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.05,areverse', '-c:a', 'libmp3lame', '-b:a', '192k', v], check=True)
        print(f'     → voix/p{n}.mp3 remplacée par le passage du montage (origine : p{n}_origine.mp3)')
