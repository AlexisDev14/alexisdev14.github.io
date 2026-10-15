#!/usr/bin/env python3
# Voix off ElevenLabs de toute la vidéo en UN SEUL appel, puis découpe hors ligne en 6 plans, avec l'instant exact de chaque mot.
#
#   python3 -I voix.py <travail> [--voix ID] [--modele eleven_v4] [--forcer]
#
# Lit <travail>/voix.txt : la version ElevenLabs du script, UN paragraphe par plan (6 paragraphes séparés par une ligne vide,
# balises d'intention entre crochets permises : [deadpan], [sighs]…).
# 1. Contrôle d'abord les longueurs, sans rien envoyer : ≤ 175 caractères et au plus un « … » par paragraphe (sinon refus :
#    corriger voix.txt et relancer, rien n'est facturé) ; 20 à 24 mots conseillés (simple note).
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
#      voix_complete.mp3  plan N posé à 10 × (N − 1) s, 60 s bout à bout (se pose telle quelle sous les 6 plans au montage).
#                       Si un plan déborde, le suivant est posé 0,1 s après la fin de sa voix et le décalage est signalé.
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
CARS = 175                             # caractères par paragraphe, balises comprises
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


def controler(ps):
    refus = []
    for n, p in enumerate(ps, 1):
        if len(p) > CARS:
            refus.append(f'p{n} : {len(p)} caractères (> {CARS})')
        if p.count('…') + p.count('...') > 1:
            refus.append(f'p{n} : plus d’un « … »')
        nb = len(re.findall(r"[\wÀ-ÿ'’-]+", re.sub(r'\[[^\]]*\]', ' ', p)))
        if not 20 <= nb <= 24:
            print(f'NOTE p{n} : {nb} mots écrits (20 à 24 conseillés ; un nombre en chiffres se dit en plusieurs mots)')
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
              ('' if ok else f' : déborde (> {MAX} s). Pas de nouvelle voix : signale-le ; voix_complete décale la suite.'))
    lignes = ['# Voix off : instants réels des mots (secondes du plan)', '']
    for pl in plans:
        j = json.load(open(os.path.join(d, f'p{pl["n"]}.json'), encoding='utf-8'))
        lignes += [f'## Plan {pl["n"]} : {j["duree"]:.2f} s', ' '.join(f'{w}({a:.2f}–{b:.2f})' for w, a, b in j['mots']), '']
    open(os.path.join(d, 'MOTS.md'), 'w', encoding='utf-8').write('\n'.join(lignes))
    # voix complète calée sur la vidéo : plan N à 10 × (N − 1) s, sauf débordement du précédent
    pose = [0.0]
    for i in range(1, 6):
        pose.append(max(10.0 * i, pose[-1] + plans[i - 1]['duree'] + 0.1))
    durees = [pose[i + 1] - pose[i] for i in range(5)] + [max(60.0 - pose[5], plans[5]['long'])]
    filt = ''.join(f'[{i}:a]apad=whole_dur={durees[i]:.3f},atrim=0:{durees[i]:.3f}[a{i}];' for i in range(6)) + \
        ''.join(f'[a{i}]' for i in range(6)) + 'concat=n=6:v=0:a=1[o]'
    mp3 = [os.path.join(d, f'p{n}.mp3') for n in range(1, 7)]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *sum((['-i', f] for f in mp3), []), '-filter_complex', filt, '-map', '[o]',
                    '-b:a', '192k', os.path.join(d, 'voix_complete.mp3')], check=True)
    decal = [f'p{i + 1} +{pose[i] - 10.0 * i:.2f} s' for i in range(6) if pose[i] - 10.0 * i > 0.05]
    print('→ ' + os.path.join(d, 'voix_complete.mp3') + f' ({sum(durees):.1f} s)' +
          (' ; DÉCALÉE par débordement : ' + ', '.join(decal) + ' (à recaler au montage)' if decal else ' (6 × 10,0 s)'))
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
