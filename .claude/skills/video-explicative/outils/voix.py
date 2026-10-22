#!/usr/bin/env python3
# Voix off ElevenLabs de toute la vidéo en UN SEUL appel, puis découpe hors ligne en 6 plans, avec l'instant exact de chaque mot.
#
#   python3 -I voix.py <travail> [--voix ID] [--modele eleven_v4] [--forcer]
#   python3 -I voix.py <travail> --refaire N     (seule exception à l'appel unique : voir plus bas)
#   python3 -I voix.py <travail> --refaire N --demande   (l'utilisateur a demandé de reformuler CE plan après coup)
#
# Lit <travail>/voix.txt : la version ElevenLabs du script, UN paragraphe par plan (6 paragraphes séparés par une ligne vide,
# balises d'intention entre crochets permises : [deadpan], [sighs]…).
# 1. Contrôle d'abord les longueurs et les tics (« Évidemment. » seul en phrase, phrases d'un ou deux mots : une au plus, pas de « Morale : » annoncé), sans rien envoyer : ≤ 195 caractères (≤ 180 avec un « … »), au plus un « … » et une durée estimée ≤ 10,6 s par paragraphe (≤ 9,8 s pour le plan 6, dont la chute
#    doit finir avant la fermeture du rideau) (sinon refus :
#    corriger voix.txt et relancer, rien n'est facturé) ; 24 à 31 mots et 165 à 195 caractères conseillés (simple note :
#    un paragraphe trop court laisse un trou dans le plan, le rallonger d'une précision utile).
# 2. Envoie les 6 paragraphes en UN appel (séparés par une ligne vide). Écrit dans <travail>/voix/ :
#      requete.json   le texte envoyé, écrit AVANT l'envoi
#      brut.json      la réponse brute d'ElevenLabs, écrite avant tout traitement
#      complet.mp3    la voix entière telle que rendue
# 3. Découpe : chaque plan est coupé dans le silence qui le sépare du suivant (au plus 0,15 s avant son premier son,
#    0,6 s après son dernier mot), puis écrit :
#      pN.mp3, pN.json  { texte, voix, modele, duree, mots: [[mot, debut, fin], …] } (instants recalés sur le début du plan,
#                       balises exclues ; duree = fin du dernier mot)
#      MOTS.md          par plan, la durée et chaque mot avec ses instants (à recopier dans la fiche : fenêtres de voix,
#                       mots-clés, TL.MOTS)
#    et <travail>/durees.json : la DURÉE DE CHAQUE PLAN = celle de son pN.mp3 (voix + ≤ 0,6 s de souffle), arrondie à l'image ;
#    plan 6 : voix + 1,3 s (fermeture du rideau après la chute). Le plan dure donc exactement sa voix, plus ou moins de 10 s :
#    construire.sh en tire la durée du rendu, la conduite du rideau et les bruitages ; posé à 0 s, pN.mp3 tombe pile sur pN.
#    Pas de voix complète : chaque pN.mp3 est mixé dans son plan, et assembler.sh met les plans bout à bout (seuls p1…p6.mp3 vont sur le Drive).
#
# UN SEUL APPEL PAR VIDÉO, JAMAIS D'ITÉRATION :
#   - si brut.json existe, voix.py ne rappelle jamais ElevenLabs : il redécoupe seulement (gratuit) ;
#   - si requete.json existe sans brut.json (appel parti, réponse perdue), il refuse : la voix est peut-être déjà facturée ;
#   - aucun nouvel essai une fois la requête partie, sauf un refus 429 ou 503 (rien n'a été rendu) ;
#   - une voix > 10,5 s est signalée NOTE (le plan s'allonge d'autant ; l'utilisateur accepte jusqu'à 11 s de voix) ;
#   - une voix > 11 s (plafond de l'utilisateur) est la SEULE exception : raccourcis ce paragraphe dans voix.txt, puis
#     `voix.py <travail> --refaire N` refait CE SEUL plan en un appel (plus court que l'original, estimé ≤ 10,2 s ;
#     une seule fois par plan ; fichiers voix/refait_pN_*). Une voix refaite qui dépasse encore 11 s se garde et se signale.
#   - ne jamais accélérer la voix.
#   --refaire N --demande : l'utilisateur a demandé EXPLICITEMENT une nouvelle formulation de ce seul plan (ex. 22/10/2026,
#     Frankenstein p3) : un appel pour ce paragraphe de voix.txt, sans condition de durée ni de longueur (estimé ≤ EST_MAX),
#     une seule fois par plan. Jamais de sa propre initiative ni en routine.
#   --forcer : nouvel appel facturé malgré une voix existante. Seulement si l'utilisateur le demande, jamais en routine.
#
# Identifiants : secret réseau de l'environnement sur api.elevenlabs.io (en-tête xi-api-key, ajouté par le proxy) :
# ne jamais chercher à lire ni afficher la clé. Coût ≈ 1 crédit par caractère (≈ 950 par vidéo).
import base64, difflib, json, os, re, shutil, socket, subprocess, sys, time, urllib.error, urllib.request

VOIX = 'gP52hjM48hyNoVCbizxO'          # « Alexandre – Calm, Warm & Authentic » (choix de l'utilisateur)
MODELE = 'eleven_v4'                   # choix de l'utilisateur
MAX = 10.5                             # secondes : au-delà, simple note (le plan s'allonge à la durée de la voix)
TRAINE_P6 = 1.3                        # secondes après le dernier mot du plan 6 : fermeture du rideau après la chute
PLAFOND = 11.0                         # secondes : limite de l'utilisateur ; au-delà, ce plan seul se refait (--refaire N)
CARS = 195                             # caractères par paragraphe, balises comprises (165 à 195 conseillés)
CARS_MIN = 165
CARS_SUSP = 180                        # caractères au plus pour un paragraphe qui contient un « … » (le « … » coûte ≈ 0,5 s)
EST_MAX = 10.6                         # durée estimée au-delà de laquelle le texte est refusé avant l'envoi
EST_MAX_P6 = 9.8                       # plan 6 : la chute finit avant la fermeture du rideau (≈ 9,0 → 9,85 s)
EST_REFAIT = 10.2                      # durée estimée au plus d'un paragraphe refait
URL = 'https://api.elevenlabs.io/v1/text-to-speech/{voix}/with-timestamps?output_format=mp3_44100_128'
MOT = re.compile(r"[\wÀ-ÿ'’-]")


NP = 6                                 # nombre de plans de la vidéo = nombre de paragraphes de voix.txt (6 d'ordinaire)


def paragraphes(chemin):
    txt = open(chemin, encoding='utf-8').read().strip()
    ps = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', txt) if p.strip()]
    if not 4 <= len(ps) <= 10:
        sys.exit(f'voix.txt doit contenir de 4 à 10 paragraphes (un par plan, 6 d’ordinaire) séparés par une ligne vide (trouvé {len(ps)}).')
    global NP
    NP = len(ps)
    return ps


def hors_balises(p):
    # masque : True pour chaque caractère hors [balise]
    res, dans = [], False
    for c in p:
        if c == '[': dans = True
        res.append(not dans)
        if c == ']': dans = False
    return res


def estimer(p):
    """Durée estimée (s) d'un paragraphe, sans appel : texte dit (balises ôtées, chiffres comptés comme des mots
    écrits en lettres) à ≈ 17,5 caractères/s, plus 0,5 s par « … ». Estimation grossière (± 1 s sur les mesures Téflon et Barbe Noire) : elle écarte les paragraphes nettement trop longs."""
    dit = re.sub(r'\s+', ' ', re.sub(r'\[[^\]]*\]', ' ', p)).strip()
    dit = re.sub(r'\d+', lambda m: 'x' * (9 * len(m.group())), dit)   # « 1718 » se dit « mille sept cent dix-huit »
    return len(dit) / 17.5 + 0.5 * (p.count('…') + p.count('...'))


# Tics de fin de phrase (« Évidemment. », « Modestement. ») : jugés agaçants par l'utilisateur.
TICS = {'évidemment', 'modestement', 'logique', 'naturellement', 'forcément', 'bien sûr', 'toujours', 'discrètement',
        'sobrement', 'humblement', 'pratique', 'normal', 'classique', 'rassurant', 'charmant', 'simple', 'tout simplement'}


def tics(ps):
    """Refuse les tics : une phrase d'un ou deux mots (hors balises) au plus pour toute la vidéo, et jamais un mot de TICS
    seul en phrase. La chute d'un plan est une vraie phrase qui dit quelque chose."""
    courtes, refus = [], []
    for n, p in enumerate(ps, 1):
        dit = re.sub(r'\[[^\]]*\]', ' ', p)
        for ph in re.split(r'(?<=[.!?…])\s+', dit.strip()):
            mots = re.findall(r"[\wÀ-ÿ'’-]+", ph)
            if not mots or len(mots) > 2: continue
            nu = ' '.join(mots).lower()
            if nu in TICS: refus.append(f'p{n} : tic de fin de phrase « {ph.strip()} » (interdit : écris une vraie chute)')
            else: courtes.append(f'p{n} « {ph.strip()} »')
    if len(courtes) > 1:
        refus.append('phrases d’un ou deux mots : ' + ', '.join(courtes) + ' (une seule par vidéo au plus)')
    for n, p in enumerate(ps, 1):
        if re.search(r'(^|[.!?…»]\s*|\]\s*)(la\s+)?morale\s*(:|,|de l)', p, re.I):
            refus.append(f'p{n} : « Morale : » annoncé (devenu un tic : la morale se dit sans être annoncée)')
        if re.search(r'\[[^\]]*(whisper|chuchot|murmur)[^\]]*\]', p, re.I):
            refus.append(f'p{n} : balise de chuchotement (l’utilisateur n’en veut aucune, 22/10 : mysterious, ominous ou dramatic à la place)')
        if re.search(r'(^|[.!?…]\s+|\]\s*)Et\s', p):
            refus.append(f'p{n} : phrase qui commence par « Et » (l’utilisateur n’en veut pas, 22/10 : relier autrement)')
    return refus


def controler(ps):
    refus = []
    for n, p in enumerate(ps, 1):
        susp = p.count('…') + p.count('...')
        if len(p) > CARS:
            refus.append(f'p{n} : {len(p)} caractères (> {CARS})')
        if susp > 1:
            refus.append(f'p{n} : plus d’un « … »')
        if susp == 1 and len(p) > CARS_SUSP:
            refus.append(f'p{n} : {len(p)} caractères avec un « … » (> {CARS_SUSP})')
        est, lim = estimer(p), (EST_MAX_P6 if n == NP else EST_MAX)
        if est > lim:
            refus.append(f'p{n} : durée estimée {est:.1f} s (> {lim} s)')
        elif n == NP and (est > 9.4 or est < 8.5):
            print(f'NOTE p{n} : durée estimée {est:.1f} s (viser 8,8 à 9,4 s : la chute finit avant la fermeture du rideau)')
        elif n < NP and (est > 10.4 or est < 9.0):
            print(f'NOTE p{n} : durée estimée {est:.1f} s (viser 9,3 à 10,4 s ; jamais plus de 11 s en vrai)')
        nb = len(re.findall(r"[\wÀ-ÿ'’-]+", re.sub(r'\[[^\]]*\]', ' ', p)))
        if not 24 <= nb <= 31:
            print(f'NOTE p{n} : {nb} mots écrits (24 à 31 conseillés ; un nombre en chiffres se dit en plusieurs mots)')
        if len(p) < CARS_MIN:
            print(f'NOTE p{n} : {len(p)} caractères (< {CARS_MIN}) : la voix laissera un trou, rallonge d’une précision utile')
    refus += tics(ps)
    if refus:
        sys.exit('Texte refusé AVANT tout appel (rien n’est facturé) :\n  ' + '\n  '.join(refus) +
                 '\nRaccourcis ces paragraphes dans voix.txt puis relance voix.py.')


def appeler(texte, voix, modele, d, req_nom='requete.json'):
    req_f = os.path.join(d, req_nom)
    json.dump({'texte': texte, 'voix': voix, 'modele': modele, 'caracteres': len(texte),
               'envoi': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())},
              open(req_f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    req = urllib.request.Request(URL.format(voix=voix), data=json.dumps({'text': texte, 'model_id': modele}).encode(),
                                 headers={'Content-Type': 'application/json'}, method='POST')
    stop = '\n⛔ Ne relance pas voix.py : livre la vidéo sans voix et donne cette ligne dans le résumé.'
    for essai in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            corps = e.read()[:300].decode(errors='replace')
            if e.code in (429, 503) and essai < 3:      # refus avant rendu : rien n'est facturé
                time.sleep(15 * 2 ** essai); continue
            if 400 <= e.code < 500:                     # demande refusée, aucune voix rendue
                os.remove(req_f)
                sys.exit(f'ElevenLabs a refusé la demande (HTTP {e.code}) : {corps}\nAucune voix rendue. Corrige la cause avant toute relance.')
            sys.exit(f'ÉCHEC ElevenLabs HTTP {e.code} : {corps}' + stop)
        except urllib.error.URLError as e:
            if isinstance(e.reason, (socket.gaierror, ConnectionRefusedError)):
                os.remove(req_f)
                sys.exit(f'ElevenLabs injoignable, demande NON envoyée ({e.reason}) : une seule relance permise.')
            sys.exit(f'ÉCHEC réseau pendant l’appel ({e.reason}) : la voix est peut-être facturée.' + stop)
        except OSError as e:                            # délai dépassé, connexion coupée en lecture
            sys.exit(f'ÉCHEC réseau pendant l’appel ({e!r}) : la voix est peut-être facturée.' + stop)
    os.remove(req_f)
    sys.exit('ElevenLabs refuse encore la demande après 3 attentes (429/503) : aucune voix rendue. Réessaie plus tard, une fois.')


def aplatir(al):
    # un caractère par entrée, au cas où l'alignement en regrouperait plusieurs
    ch, st, en = [], [], []
    for c, a, b in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        for x in c:
            ch.append(x); st.append(a); en.append(b)
    return ''.join(ch), st, en


def decouper(d, ps, r, voix, modele):
    texte = '\n\n'.join(ps)
    al = r.get('alignment') or r.get('normalized_alignment')
    if not al or not r.get('audio_base64'):
        sys.exit('Réponse ElevenLabs sans audio ni alignement : voir voix/brut.json.' +
                 '\n⛔ Ne relance pas voix.py : livre la vidéo sans voix et dis-le dans le résumé.')
    aligne, st, en = aplatir(al)
    if aligne == texte:
        idx = list(range(len(texte)))
    else:   # texte normalisé par ElevenLabs : on fait correspondre les caractères identiques
        idx = [None] * len(texte)
        for a, b, k in difflib.SequenceMatcher(None, texte, aligne, autojunk=False).get_matching_blocks():
            for j in range(k):
                idx[a + j] = b + j
        print(f'NOTE alignement : texte rendu ≠ texte envoyé, correspondance par caractères ({sum(i is not None for i in idx)}/{len(texte)})')
    complet = os.path.join(d, 'complet.mp3')
    if not os.path.exists(complet):
        open(complet, 'wb').write(base64.b64decode(r['audio_base64']))
    total = max(en) if en else 0
    plans, pos = [], 0
    for n, p in enumerate(ps, 1):
        masque = hors_balises(p)
        sons = [idx[pos + i] for i, c in enumerate(p) if not c.isspace() and idx[pos + i] is not None]
        parle = [idx[pos + i] for i, c in enumerate(p) if masque[i] and MOT.match(c) and idx[pos + i] is not None]
        if not parle:
            sys.exit(f'p{n} : aucun mot retrouvé dans l’alignement (voir voix/brut.json).')
        mots, cur = [], []
        for i, c in enumerate(p + ' '):
            if i < len(p) and masque[i] and MOT.match(c):
                cur.append(idx[pos + i]); continue
            cur_ok = [k for k in cur if k is not None]
            if cur_ok:
                mots.append([p[i - len(cur):i], st[min(cur_ok)], en[max(cur_ok)]])
            cur = []
        plans.append({'n': n, 'texte': p, 'debut_son': min(st[k] for k in sons), 'debut': st[min(parle)],
                      'fin': en[max(parle)], 'mots': mots})
        pos += len(p) + 2
    # bornes de coupe : dans le silence entre deux plans
    for i, pl in enumerate(plans):
        if i and pl['debut_son'] < plans[i - 1]['fin']:
            print(f'NOTE p{pl["n"]} : la voix enchaîne sans silence avec le plan précédent')
        milieu_av = (plans[i - 1]['fin'] + pl['debut_son']) / 2 if i else 0.0
        milieu_ap = (pl['fin'] + plans[i + 1]['debut_son']) / 2 if i < NP - 1 else total + 0.6
        pl['a'] = max(milieu_av, min(pl['debut_son'], pl['debut']) - 0.15, 0.0)
        pl['b'] = min(milieu_ap, pl['fin'] + 0.6)
    for pl in plans:
        n, a = pl['n'], pl['a']
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', complet, '-ss', f'{a:.3f}', '-to', f'{pl["b"]:.3f}',
                        '-b:a', '192k', os.path.join(d, f'p{n}.mp3')], check=True)
        duree = round(pl['fin'] - a, 2)
        mots = [[w, round(t0 - a, 2), round(t1 - a, 2)] for w, t0, t1 in pl['mots']]
        json.dump({'texte': pl['texte'], 'voix': voix, 'modele': modele, 'duree': duree, 'mots': mots},
                  open(os.path.join(d, f'p{n}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        pl['duree'], pl['long'] = duree, pl['b'] - a
        print(f'{"OK  " if duree <= MAX else "NOTE"} p{n} : {duree:.2f} s, {len(mots)} mots, {len(pl["texte"])} caractères' +
              ('' if duree <= MAX else f' : plus de {MAX} s (accepté jusqu’à {PLAFOND} s ; le plan s’allonge d’autant)'))
    for n in range(1, NP + 1):
        if os.path.exists(os.path.join(d, f'refait_p{n}_brut.json')):
            appliquer_refait(d, n, voix, modele)
    ecrire_mots(d)


def bilan(d):
    # plans dont la voix dépasse le plafond de l'utilisateur
    trop = []
    for n in range(1, NP + 1):
        j = json.load(open(os.path.join(d, f'p{n}.json'), encoding='utf-8'))
        if j['duree'] > PLAFOND:
            deja = os.path.exists(os.path.join(d, f'refait_p{n}_requete.json'))
            trop.append(n)
            print(f'DÉPASSEMENT p{n} : {j["duree"]:.2f} s (> {PLAFOND} s, plafond de l’utilisateur). ' +
                  ('Déjà refait une fois : garde-le et signale-le dans le résumé.' if deja else
                   f'Raccourcis le paragraphe {n} dans voix.txt (estimé ≤ {EST_REFAIT} s), puis `voix.py <travail> --refaire {n}`.'))
    return trop


def appliquer_refait(d, n, voix, modele):
    # remplace pN.mp3 / pN.json par la voix refaite de ce seul plan
    r = json.load(open(os.path.join(d, f'refait_p{n}_brut.json'), encoding='utf-8'))
    p = json.load(open(os.path.join(d, f'refait_p{n}_requete.json'), encoding='utf-8'))['texte']
    al = r.get('alignment') or r.get('normalized_alignment')
    if not al or not r.get('audio_base64'):
        print(f'NOTE p{n} : voix refaite sans audio ni alignement (voix/refait_p{n}_brut.json) : la première voix est gardée.'); return
    aligne, st, en = aplatir(al)
    sm = difflib.SequenceMatcher(None, p, aligne, autojunk=False)
    idx = [None] * len(p)
    for a, b, k in sm.get_matching_blocks():
        for j in range(k): idx[a + j] = b + j
    masque = hors_balises(p)
    mots, cur = [], []
    for i, c in enumerate(p + ' '):
        if i < len(p) and masque[i] and MOT.match(c):
            cur.append(idx[i]); continue
        ok = [k for k in cur if k is not None]
        if ok: mots.append([p[i - len(cur):i], st[min(ok)], en[max(ok)]])
        cur = []
    if not mots:
        print(f'NOTE p{n} : aucun mot retrouvé dans la voix refaite : la première voix est gardée.'); return
    src = os.path.join(d, f'refait_p{n}.mp3')
    if not os.path.exists(src): open(src, 'wb').write(base64.b64decode(r['audio_base64']))
    a = max(0.0, mots[0][1] - 0.15); b = mots[-1][2] + 0.6
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-b:a', '192k',
                    os.path.join(d, f'p{n}.mp3')], check=True)
    duree = round(mots[-1][2] - a, 2)
    json.dump({'texte': p, 'voix': voix, 'modele': modele, 'duree': duree, 'refait': True,
               'mots': [[w, round(t0 - a, 2), round(t1 - a, 2)] for w, t0, t1 in mots]},
              open(os.path.join(d, f'p{n}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{"OK  " if duree <= PLAFOND else "DÉPASSEMENT"} p{n} (refait) : {duree:.2f} s')


def refaire(travail, n, voix, modele, demande=False):
    d = os.path.join(travail, 'voix')
    if not os.path.exists(os.path.join(d, 'brut.json')):
        sys.exit('--refaire : aucune voix rendue pour la vidéo (voix/brut.json) ; lance d’abord voix.py sans option.')
    if os.path.exists(os.path.join(d, f'refait_p{n}_requete.json')):
        sys.exit(f'p{n} a déjà été refait une fois : aucun autre appel. Garde-le et signale le dépassement dans le résumé.')
    j = json.load(open(os.path.join(d, f'p{n}.json'), encoding='utf-8'))
    if j['duree'] <= PLAFOND and not demande:
        sys.exit(f'p{n} dure {j["duree"]:.2f} s (≤ {PLAFOND} s) : rien à refaire, aucun appel.')
    tous = paragraphes(os.path.join(travail, 'voix.txt'))
    p = tous[n - 1]
    if p == j['texte']:
        sys.exit(f'p{n} : voix.txt n’a pas changé pour ce plan : rien à refaire, aucun appel.')
    if demande and estimer(p) > EST_MAX:
        sys.exit(f'p{n} : trop long (estimé {estimer(p):.1f} s > {EST_MAX} s). Rien n’est facturé.')
    if not demande and (len(p) >= len(j['texte']) or estimer(p) > EST_REFAIT):
        sys.exit(f'p{n} : raccourcis d’abord ce paragraphe dans voix.txt (plus court que l’original, estimé ≤ {EST_REFAIT} s ;'
                 f' actuellement {len(p)} caractères, {estimer(p):.1f} s). Rien n’est facturé.')
    refus = tics(tous)
    if refus: sys.exit('Texte refusé AVANT tout appel :\n  ' + '\n  '.join(refus))
    print(f'Appel ElevenLabs pour le SEUL plan {n} ({"reformulation demandée par l’utilisateur" if demande else f"exception : voix > {PLAFOND} s"}) : {len(p)} caractères')
    brut = appeler(p, voix, modele, d, f'refait_p{n}_requete.json')
    open(os.path.join(d, f'refait_p{n}_brut.json'), 'wb').write(brut)
    try:
        json.loads(brut)
    except ValueError:
        sys.exit(f'Réponse illisible (voix/refait_p{n}_brut.json) : la première voix est gardée ; signale-le dans le résumé.')
    appliquer_refait(d, n, voix, modele)
    ecrire_mots(d)
    bilan(d)


def ecrire_mots(d):
    lignes = ['# Voix off : instants réels des mots (secondes du plan)', '']
    for n in range(1, NP + 1):
        j = json.load(open(os.path.join(d, f'p{n}.json'), encoding='utf-8'))
        lignes += [f'## Plan {n} : {j["duree"]:.2f} s' + (' (refait)' if j.get('refait') else ''), ' '.join(f'{w}({a:.2f}–{b:.2f})' for w, a, b in j['mots']), '']
    open(os.path.join(d, 'MOTS.md'), 'w', encoding='utf-8').write('\n'.join(lignes))
    print('→ ' + os.path.join(d, 'MOTS.md'))
    ecrire_durees(d)


def ecrire_durees(d):
    # durée de chaque plan = durée de son pN.mp3 (plan 6 : voix + TRAINE_P6), arrondie à l'image supérieure
    import math
    durees = []
    for n in range(1, NP + 1):
        mp3 = os.path.join(d, f'p{n}.mp3')
        long = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3],
                                    capture_output=True, text=True, check=True).stdout)
        if n == NP:
            long = max(long, json.load(open(os.path.join(d, f'p{NP}.json'), encoding='utf-8'))['duree'] + TRAINE_P6)
        durees.append(math.ceil(long * 30 - 1e-6) / 30)
    debuts = [round(sum(durees[:i]), 3) for i in range(NP)]
    json.dump({'durees': [round(x, 4) for x in durees], 'images': [round(x * 30) for x in durees], 'debuts': debuts,
               'total': round(sum(durees), 3)},
              open(os.path.join(os.path.dirname(d), 'durees.json'), 'w'), indent=1)
    print('DURÉES DES PLANS (= voix ; à reporter dans la fiche) : ' +
          ' · '.join(f'p{n} {x:.2f} s (début {debuts[n - 1]:.2f})' for n, x in enumerate(durees, 1)).replace('.', ',') +
          f' — total {sum(durees):.1f} s'.replace('.', ','))


def main():
    global NP
    a = sys.argv[1:]
    if not a:
        print(open(__file__, encoding='utf-8').read().split('import')[0]); return
    if '--plans' in a:
        sys.exit('--plans n’existe plus : la voix se fait en un seul appel par vidéo, jamais plan par plan.')
    travail = os.path.abspath(a[0])
    forcer = '--forcer' in a
    demande = '--demande' in a
    reste = [x for x in a[1:] if x not in ('--forcer', '--demande')]
    opt = dict(zip(reste[0::2], reste[1::2]))
    voix, modele = opt.get('--voix', VOIX), opt.get('--modele', MODELE)
    if '--refaire' in opt:
        n = int(opt['--refaire'])
        paragraphes(os.path.join(travail, 'voix.txt'))
        if not 1 <= n <= NP: sys.exit(f'--refaire N : N de 1 à {NP}.')
        refaire(travail, n, voix, modele, demande); return
    ps = paragraphes(os.path.join(travail, 'voix.txt'))
    texte = '\n\n'.join(ps)
    d = os.path.join(travail, 'voix'); os.makedirs(d, exist_ok=True)
    brut_f, req_f = os.path.join(d, 'brut.json'), os.path.join(d, 'requete.json')
    if forcer and (os.path.exists(brut_f) or os.path.exists(req_f)):
        arch = os.path.join(d, time.strftime('ancienne_%Y%m%d_%H%M%S'))
        os.makedirs(arch)
        for f in os.listdir(d):
            if not f.startswith('ancienne_'):
                shutil.move(os.path.join(d, f), arch)
        print(f'--forcer : ancienne voix rangée dans {arch} ; NOUVEL APPEL FACTURÉ')
    if os.path.exists(brut_f):
        r = json.load(open(brut_f, encoding='utf-8'))
        envoye = json.load(open(req_f, encoding='utf-8'))['texte'] if os.path.exists(req_f) else texte
        if envoye != texte:
            print('NOTE : voix.txt a changé depuis l’appel ; la découpe suit le texte réellement envoyé (requete.json), '
                  'aucune nouvelle voix n’est demandée.')
            ps = envoye.split('\n\n')
            NP = len(ps)
        print('Voix déjà rendue (voix/brut.json) : découpe seule, aucun appel ElevenLabs.')
        decouper(d, ps, r, voix, modele); bilan(d); return
    if os.path.exists(req_f):
        sys.exit('Un appel ElevenLabs est déjà parti (voix/requete.json) sans réponse enregistrée : la voix est peut-être facturée.'
                 '\n⛔ Ne relance pas : livre la vidéo sans voix et dis-le dans le résumé.')
    controler(ps)
    print(f'Un seul appel ElevenLabs : {len(texte)} caractères ({modele}, voix {voix})')
    brut = appeler(texte, voix, modele, d)
    open(brut_f, 'wb').write(brut)
    try:
        r = json.loads(brut)
    except ValueError:
        sys.exit('Réponse ElevenLabs illisible : voir voix/brut.json.\n⛔ Ne relance pas voix.py : livre la vidéo sans voix et dis-le.')
    decouper(d, ps, r, voix, modele)
    bilan(d)


if __name__ == '__main__':
    main()
