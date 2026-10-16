#!/usr/bin/env python3
# Voix off ElevenLabs de toute la vidéo en UN SEUL appel, puis découpe hors ligne en 6 plans, avec l'instant exact de chaque mot.
#
#   python3 -I voix.py <travail> [--voix ID] [--modele eleven_v4] [--forcer]
#
# Lit <travail>/voix.txt : la version ElevenLabs du script, UN paragraphe par plan (6 paragraphes séparés par une ligne vide,
# balises d'intention entre crochets permises : [deadpan], [sighs]…).
# 1. Contrôle d'abord les longueurs et les tics (« Évidemment. » seul en phrase, phrases d'un ou deux mots : une au plus), sans rien envoyer : ≤ 180 caractères (≤ 165 avec un « … »), au plus un « … » et une durée estimée ≤ 9,8 s par paragraphe (sinon refus :
#    corriger voix.txt et relancer, rien n'est facturé) ; 25 à 28 mots et 160 à 180 caractères conseillés (simple note :
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
#    Pas de voix complète : l'utilisateur pose lui-même p1…p6 au montage (seuls p1…p6.mp3 vont sur le Drive).
#
# UN SEUL APPEL PAR VIDÉO, JAMAIS D'ITÉRATION :
#   - si brut.json existe, voix.py ne rappelle jamais ElevenLabs : il redécoupe seulement (gratuit) ;
#   - si requete.json existe sans brut.json (appel parti, réponse perdue), il refuse : la voix est peut-être déjà facturée ;
#   - aucun nouvel essai une fois la requête partie, sauf un refus 429 ou 503 (rien n'a été rendu) ;
#   - une voix > 9,6 s est signalée ATTENTION, jamais regénérée (ne jamais accélérer la voix non plus).
#   --forcer : nouvel appel facturé malgré une voix existante. Seulement si l'utilisateur le demande, jamais en routine.
#
# Identifiants : secret réseau de l'environnement sur api.elevenlabs.io (en-tête xi-api-key, ajouté par le proxy) :
# ne jamais chercher à lire ni afficher la clé. Coût ≈ 1 crédit par caractère (≈ 950 par vidéo).
import base64, difflib, json, os, re, shutil, socket, subprocess, sys, time, urllib.error, urllib.request

VOIX = 'gP52hjM48hyNoVCbizxO'          # « Alexandre – Calm, Warm & Authentic » (choix de l'utilisateur)
MODELE = 'eleven_v4'                   # choix de l'utilisateur
MAX = 9.6                              # secondes : au-delà, la voix déborde du plan de 10 s
CARS = 180                             # caractères par paragraphe, balises comprises (160 à 180 conseillés)
CARS_MIN = 160
CARS_SUSP = 165                        # caractères au plus pour un paragraphe qui contient un « … » (le « … » coûte ≈ 0,5 s)
EST_MAX = 9.8                          # durée estimée au-delà de laquelle le texte est refusé avant l'envoi
URL = 'https://api.elevenlabs.io/v1/text-to-speech/{voix}/with-timestamps?output_format=mp3_44100_128'
MOT = re.compile(r"[\wÀ-ÿ'’-]")


def paragraphes(chemin):
    txt = open(chemin, encoding='utf-8').read().strip()
    ps = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', txt) if p.strip()]
    if len(ps) != 6:
        sys.exit(f'voix.txt doit contenir 6 paragraphes séparés par une ligne vide (trouvé {len(ps)}).')
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
        est = estimer(p)
        if est > EST_MAX:
            refus.append(f'p{n} : durée estimée {est:.1f} s (> {EST_MAX} s)')
        elif est > 9.4 or est < 8.5:
            print(f'NOTE p{n} : durée estimée {est:.1f} s (viser 8,8 à 9,4 s)')
        nb = len(re.findall(r"[\wÀ-ÿ'’-]+", re.sub(r'\[[^\]]*\]', ' ', p)))
        if not 25 <= nb <= 28:
            print(f'NOTE p{n} : {nb} mots écrits (25 à 28 conseillés ; un nombre en chiffres se dit en plusieurs mots)')
        if len(p) < CARS_MIN:
            print(f'NOTE p{n} : {len(p)} caractères (< {CARS_MIN}) : la voix laissera un trou, rallonge d’une précision utile')
    refus += tics(ps)
    if refus:
        sys.exit('Texte refusé AVANT tout appel (rien n’est facturé) :\n  ' + '\n  '.join(refus) +
                 '\nRaccourcis ces paragraphes dans voix.txt puis relance voix.py.')


def appeler(texte, voix, modele, d):
    req_f = os.path.join(d, 'requete.json')
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
        milieu_ap = (pl['fin'] + plans[i + 1]['debut_son']) / 2 if i < 5 else total + 0.6
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
        ok = duree <= MAX
        print(f'{"OK  " if ok else "ATTENTION"} p{n} : {duree:.2f} s, {len(mots)} mots, {len(pl["texte"])} caractères' +
              ('' if ok else f' : déborde (> {MAX} s). Pas de nouvelle voix : signale-le dans le résumé (recalage au montage).'))
    lignes = ['# Voix off : instants réels des mots (secondes du plan)', '']
    for pl in plans:
        j = json.load(open(os.path.join(d, f'p{pl["n"]}.json'), encoding='utf-8'))
        lignes += [f'## Plan {pl["n"]} : {j["duree"]:.2f} s', ' '.join(f'{w}({a:.2f}–{b:.2f})' for w, a, b in j['mots']), '']
    open(os.path.join(d, 'MOTS.md'), 'w', encoding='utf-8').write('\n'.join(lignes))
    print('→ ' + os.path.join(d, 'MOTS.md'))


def main():
    a = sys.argv[1:]
    if not a:
        print(open(__file__, encoding='utf-8').read().split('import')[0]); return
    if '--plans' in a:
        sys.exit('--plans n’existe plus : la voix se fait en un seul appel par vidéo, jamais plan par plan.')
    travail = os.path.abspath(a[0])
    forcer = '--forcer' in a
    reste = [x for x in a[1:] if x != '--forcer']
    opt = dict(zip(reste[0::2], reste[1::2]))
    voix, modele = opt.get('--voix', VOIX), opt.get('--modele', MODELE)
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
        print('Voix déjà rendue (voix/brut.json) : découpe seule, aucun appel ElevenLabs.')
        decouper(d, ps, r, voix, modele); return
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


if __name__ == '__main__':
    main()
