#!/usr/bin/env python3
# Sous-titres animés, calés mot à mot sur la voix, incrustés dans la vidéo complète.
#   python3 -I soustitres.py <travail> <video_complete.mp4> <sortie.mp4> [--theme ART] [--y 1500] [--x 500]
#
# Lit :
#   <travail>/voix/p1.json … p6.json   instants réels des mots dits (écrits par voix.py : [mot, début, fin], secondes du plan)
#   <travail>/script.txt               le texte À AFFICHER, un paragraphe par plan (chiffres en chiffres : « 1977 », « 681 ») ;
#                                      sans lui, voix.txt sans ses balises (les nombres restent alors en lettres)
#   <travail>/out/pN/pN_final.mp4      pour le début réel de chaque plan dans la vidéo complète (somme des durées)
# Le texte affiché est recalé sur la voix lettre à lettre (nombres en chiffres développés en mots pour la comparaison) :
# chaque mot apparaît quand il est prononcé, quelle que soit l'écriture du script.
# Rendu (style TikTok, tempo de la voix) :
#   - 1 à 3 mots à la fois (≤ 16 lettres), coupure à chaque ponctuation et à chaque pause ; un petit mot (« de », « la »)
#     reste avec le mot qui le suit ;
#   - chaque groupe entre avec un « pop » discret (94 % → 103 % → 100 % en 0,24 s) ;
#   - le mot en train d'être dit passe à la couleur du thème, les nombres y restent ;
#   - le dernier groupe de chaque plan (la chute) est plus gros ;
#   - Inter Display Black (polices/), 70 px, casse du script (pas tout en capitales), lettres resserrées (92 %), blanc crème,
#     contour brun, ombre ; centré sur x = 500 (un peu à gauche du milieu, souhait de l'utilisateur), y = 1500 par défaut
#     (plancher de la scène, sous les pieds des marionnettes, au-dessus de la zone des boutons TikTok).
# Écrit aussi <sortie>.ass (le fichier de sous-titres) ; l'image est réencodée (crf 18), le son recopié tel quel ;
# puis verifier.sh sur la sortie (même durée que l'entrée, voix incluse) : son code de sortie est celui du script.
import difflib, json, os, re, subprocess, sys, unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
THEMES = {'HIST': '#C2410C', 'GEO': '#22C55E', 'SCI': '#06B6D4', 'ART': '#E879F9', 'MUS': '#A78BFA', 'POP': '#FCAF3C',
          'SPORT': '#F97316', 'VIE': '#F472B6', 'ECO': '#94A3B8', 'LANG': '#84CC16', 'ACTU': '#EF4444'}   # versions claires, lisibles sur la scène
CREME, BRUN = '#FFF6E0', '#2A1A0C'
TAILLE, TAILLE_CHUTE = 70, 78
LARGEUR = 92                   # % : lettres un peu resserrées (le texte ne doit pas s'étaler)
MAX_MOTS, MAX_LETTRES, PAUSE = 3, 14, 0.35
PETITS = {'le', 'la', 'les', 'l', 'un', 'une', 'de', 'du', 'des', 'd', 'à', 'au', 'aux', 'en', 'et', 'ce', 'ces', 'ses', 'sa', 'son',
          'qu', 'que', 'dun', 'dune', 'lon', 'quon', 'cest', 'on', 'il', 'ne', 'n', 'pour', 'par', 'sur', 'pas', 'plus', 'va', 'a', 'est', 'c', 'leur', 'tout', 'se', 's'}

UNITES = 'zéro un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize'.split()
DIZAINES = {2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante'}


def en_lettres(n):
    """Nombre entier (0 à 999 999) en toutes lettres, à la française (pour la comparaison avec la voix seulement)."""
    if n < 17: return UNITES[n]
    if n < 20: return 'dix-' + UNITES[n - 10]
    if n < 100:
        d, u = divmod(n, 10)
        if d in (7, 9): return ('soixante et onze' if n == 71 else ('soixante' if d == 7 else 'quatre-vingt') + '-' + en_lettres(10 + u))
        if d == 8: return 'quatre-vingt' + ('-' + UNITES[u] if u else 's')
        return DIZAINES[d] + ('' if not u else ' et un' if u == 1 else '-' + UNITES[u])
    if n < 1000:
        c, r = divmod(n, 100)
        return ('cent' if c == 1 else UNITES[c] + ' cent' + ('' if r else 's')) + (' ' + en_lettres(r) if r else '')
    m, r = divmod(n, 1000)
    return ('mille' if m == 1 else en_lettres(m) + ' mille') + (' ' + en_lettres(r) if r else '')


def lettres(s):
    """Suite de lettres comparables : minuscules sans accents, nombres développés, sans ponctuation."""
    s = re.sub(r'\d+', lambda m: ' ' + en_lettres(int(m.group())) + ' ', s.replace(' ', '').replace(' ', ''))
    s = unicodedata.normalize('NFD', s.lower().replace('œ', 'oe').replace('æ', 'ae'))
    return ''.join(c for c in s if c.isalpha())


def paragraphes(chemin):
    t = open(chemin, encoding='utf-8').read().strip()
    plans = []
    for p in re.split(r'\n\s*\n', t):
        mots = []
        for w in re.sub(r'\[[^\]]*\]', '', p).split():
            if mots and not any(c.isalnum() for c in w): mots[-1] += '\u00a0' + w   # « : », « — », « … » restent avec le mot d'avant
            else: mots.append(w)
        plans.append(mots)
    return plans


def caler(affiche, mots_dits):
    """Instants [début, fin] de chaque mot affiché, d'après les mots dits (recalage lettre à lettre)."""
    dit, t_deb, t_fin = '', [], []
    for w, a, b in mots_dits:
        l = lettres(w)
        for i in range(len(l)):   # instant de chaque lettre, réparti dans la durée du mot
            t_deb.append(a + (b - a) * i / max(len(l), 1)); t_fin.append(a + (b - a) * (i + 1) / max(len(l), 1))
        dit += l
    aff, propri = '', []
    for k, w in enumerate(affiche):
        l = lettres(w); aff += l; propri += [k] * len(l)
    pos = [None] * len(aff)
    for x, y, n in difflib.SequenceMatcher(None, aff, dit, autojunk=False).get_matching_blocks():
        for j in range(n): pos[x + j] = y + j
    temps = []
    for k in range(len(affiche)):
        idx = [pos[i] for i in range(len(aff)) if propri[i] == k and pos[i] is not None]
        temps.append([t_deb[min(idx)], t_fin[max(idx)]] if idx else None)
    for k in range(len(temps)):   # mot sans correspondance : entre ses voisins
        if temps[k] is None:
            av = next((temps[j][1] for j in range(k - 1, -1, -1) if temps[j]), 0.0)
            ap = next((temps[j][0] for j in range(k + 1, len(temps)) if temps[j]), av + 0.3)
            temps[k] = [av, max(ap, av + 0.05)]
    return temps


def petit(w):
    return re.sub(r'\W', '', w.lower()) in PETITS and not re.search(r'[.,:;!?…]$', w)


def grouper(mots):
    """mots : [(texte, début, fin)] → groupes de 1 à 3 mots."""
    groupes, cur = [], []
    for i, m in enumerate(mots):
        cur.append(m)
        suiv = mots[i + 1] if i + 1 < len(mots) else None
        nu = re.sub(r'\W', '', m[0].lower())
        coupe = (suiv is None or re.search(r'[.,:;!?…]$', m[0]) or suiv[1] - m[2] > PAUSE or len(cur) >= MAX_MOTS
                 or sum(len(x[0]) for x in cur) + len(suiv[0]) > MAX_LETTRES)
        if coupe and suiv is not None and nu in PETITS and not re.search(r'[.,:;!?…]$', m[0]) and suiv[1] - m[2] <= PAUSE:
            j = len(cur) - 1                                     # les petits mots de la fin passent au groupe suivant
            while j > 0 and petit(cur[j - 1][0]): j -= 1
            if j > 0: groupes.append(cur[:j]); cur = cur[j:]
            continue
        if coupe: groupes.append(cur); cur = []
    return [g for g in groupes if g]


def ass_couleur(h):
    h = h.lstrip('#'); return f'&H00{h[4:6]}{h[2:4]}{h[0:2]}&'.upper()


def ts(t):
    t = max(t, 0); cs = round(t * 100); return f'{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}'


def nettoyer(w):
    return w.strip('«»"“”')


def main():
    a = sys.argv[1:]
    opt = {k: a[a.index(k) + 1] for k in ('--theme', '--y', '--x') if k in a}
    travail, entree, sortie = [x for i, x in enumerate(a) if not x.startswith('--') and (i == 0 or a[i - 1] not in opt)][:3]
    accent = THEMES.get(opt.get('--theme', 'ART'), THEMES['ART']); y = int(opt.get('--y', 1500)); x = int(opt.get('--x', 500))
    src = os.path.join(travail, 'script.txt')
    if not os.path.exists(src):
        src = os.path.join(travail, 'voix.txt'); print('NOTE : pas de script.txt, texte de voix.txt (nombres en lettres)')
    plans = paragraphes(src)
    if len(plans) != 6: sys.exit(f'{src} : {len(plans)} paragraphes au lieu de 6')
    debut, lignes = 0.0, []
    for n in range(1, 7):
        dits = json.load(open(os.path.join(travail, 'voix', f'p{n}.json'), encoding='utf-8'))['mots']
        temps = caler(plans[n - 1], dits)
        mots = [(w, debut + t0, debut + t1) for w, (t0, t1) in zip(plans[n - 1], temps)]
        duree = float(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=duration',
                                      '-of', 'csv=p=0', os.path.join(travail, 'out', f'p{n}', f'p{n}_final.mp4')],
                                     capture_output=True, text=True, check=True).stdout)
        groupes = grouper(mots)
        for gi, g in enumerate(groupes):
            fin_g = groupes[gi + 1][0][1] if gi + 1 < len(groupes) else min(g[-1][2] + 0.6, debut + duree)
            if fin_g - g[-1][2] > 0.6: fin_g = g[-1][2] + 0.3          # longue pause : le texte s'efface
            taille = TAILLE_CHUTE if gi == len(groupes) - 1 else TAILLE
            for wi, (w, t0, t1) in enumerate(g):                      # un événement par mot : le mot dit en couleur
                e0 = g[0][1] if wi == 0 else t0
                e1 = g[wi + 1][1] if wi + 1 < len(g) else fin_g
                txt = []
                for wj, (w2, _, _) in enumerate(g):
                    c = accent if wj == wi or re.search(r'\d', w2) else CREME
                    txt.append(f'{{\\c{ass_couleur(c)}}}{nettoyer(w2)}')
                pop = (f'\\fscx{LARGEUR - 6}\\fscy94\\t(0,140,\\fscx{LARGEUR + 3}\\fscy103)\\t(140,240,\\fscx{LARGEUR}\\fscy100)'
                       if wi == 0 else f'\\fscx{LARGEUR}')
                lignes.append(f'Dialogue: 0,{ts(e0)},{ts(e1)},Mot,,0,0,0,,{{\\an5\\pos({x},{y})\\fs{taille}{pop}}}' + ' '.join(txt))
        debut += duree
    tete = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Mot,Inter Display Black,{TAILLE},{ass_couleur(CREME)},{ass_couleur(CREME)},{ass_couleur(BRUN)},&H96000000&,0,0,0,0,100,100,2,0,1,7,4,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass = sortie + '.ass'
    open(ass, 'w', encoding='utf-8').write(tete + '\n'.join(lignes) + '\n')
    echap = lambda p: p.replace('\\', '\\\\').replace(':', '\\:').replace("'", "\\'")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', entree, '-vf',
                    f"ass=filename='{echap(ass)}':fontsdir='{echap(os.path.join(ICI, 'polices'))}'",
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'copy',
                    '-movflags', '+faststart', sortie], check=True)
    print(f'→ {sortie} ({len(lignes)} événements, sous-titres {ass})')
    attendu = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=duration', '-of', 'csv=p=0', entree],
                             capture_output=True, text=True).stdout.strip()
    sys.exit(subprocess.run([os.path.join(ICI, 'verifier.sh'), sortie, attendu], env=dict(os.environ, AVEC_VOIX='1')).returncode)


if __name__ == '__main__':
    main()
