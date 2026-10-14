#!/usr/bin/env python3
# Voix off ElevenLabs, plan par plan, avec l'instant exact de chaque mot.
#
#   python3 -I voix.py <travail> [--plans 1,3] [--voix ID] [--modele eleven_v4]
#
# Lit <travail>/voix.txt : la version ElevenLabs du script, UN paragraphe par plan (6 paragraphes séparés par une ligne vide,
# balises d'intention entre crochets permises : [deadpan], [sighs]…). Pour chaque plan (en vagues : un appel après l'autre) :
#   <travail>/voix/pN.mp3   la voix du plan
#   <travail>/voix/pN.json  { duree, mots: [[mot, debut, fin], …] } (balises exclues)
# puis <travail>/voix/MOTS.md et, quand les 6 plans existent, <travail>/voix/voix_complete.mp3 (chaque plan complété à 10,0 s,
# 60 s bout à bout : se pose telle quelle sous les 6 plans au montage). MOTS.md : par plan, la durée et chaque mot avec ses instants (à recopier dans la fiche : fenêtres de voix,
# mots-clés, TL.MOTS). Une voix > 9,6 s est signalée ATTENTION : raccourcir le paragraphe et relancer --plans N (ne jamais
# accélérer la voix). Seuls les plans demandés sont regénérés (un plan déjà fait n'est pas repayé).
#
# Identifiants : secret réseau de l'environnement sur api.elevenlabs.io (en-tête xi-api-key, ajouté par le proxy) :
# ne jamais chercher à lire ni afficher la clé. Coût ≈ 1 crédit par caractère (≈ 1 200 par vidéo).
import base64, json, os, re, sys, time, urllib.error, urllib.request

VOIX = 'gP52hjM48hyNoVCbizxO'          # « Alexandre – Calm, Warm & Authentic » (choix de l'utilisateur)
MODELE = 'eleven_v4'                   # choix de l'utilisateur
MAX = 9.6                              # secondes : au-delà, la voix déborde du plan de 10 s
URL = 'https://api.elevenlabs.io/v1/text-to-speech/{voix}/with-timestamps?output_format=mp3_44100_128'


def paragraphes(chemin):
    txt = open(chemin, encoding='utf-8').read().strip()
    ps = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', txt) if p.strip()]
    if len(ps) != 6:
        sys.exit(f'voix.txt doit contenir 6 paragraphes séparés par une ligne vide (trouvé {len(ps)}).')
    return ps


def generer(texte, voix, modele):
    req = urllib.request.Request(URL.format(voix=voix), data=json.dumps({'text': texte, 'model_id': modele}).encode(),
                                 headers={'Content-Type': 'application/json'}, method='POST')
    for essai in range(4):
        try:
            return json.load(urllib.request.urlopen(req, timeout=180))
        except urllib.error.HTTPError as e:
            corps = e.read()[:300].decode(errors='replace')
            if e.code in (429, 500, 502, 503) and essai < 3:
                time.sleep(4 * 2 ** essai); continue
            sys.exit(f'ElevenLabs HTTP {e.code} : {corps}')
        except urllib.error.URLError as e:
            if essai < 3:
                time.sleep(4 * 2 ** essai); continue
            sys.exit(f'ElevenLabs injoignable : {e}')


def mots(al):
    # regroupe les caractères alignés en mots, en sautant les balises [entre crochets]
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    res, cur, t0, t1, dans_balise = [], '', None, None, False
    for c, a, b in zip(ch, st, en):
        if c == '[': dans_balise = True
        if dans_balise:
            if c == ']': dans_balise = False
            continue
        if re.match(r"[\wÀ-ÿ'’-]", c):
            if not cur: t0 = a
            cur += c; t1 = b
        elif cur:
            res.append([cur, round(t0, 2), round(t1, 2)]); cur = ''
    if cur:
        res.append([cur, round(t0, 2), round(t1, 2)])
    return res


def main():
    a = sys.argv[1:]
    if not a:
        print(open(__file__, encoding='utf-8').read().split('import')[0]); return
    travail = os.path.abspath(a[0])
    opt = dict(zip(a[1::2], a[2::2]))
    voix, modele = opt.get('--voix', VOIX), opt.get('--modele', MODELE)
    ps = paragraphes(os.path.join(travail, 'voix.txt'))
    plans = [int(x) for x in opt['--plans'].split(',')] if '--plans' in opt else range(1, 7)
    d = os.path.join(travail, 'voix'); os.makedirs(d, exist_ok=True)
    for n in plans:
        r = generer(ps[n - 1], voix, modele)
        open(os.path.join(d, f'p{n}.mp3'), 'wb').write(base64.b64decode(r['audio_base64']))
        al = r.get('alignment') or r.get('normalized_alignment')
        m = mots(al)
        duree = round(al['character_end_times_seconds'][-1], 2)
        json.dump({'texte': ps[n - 1], 'voix': voix, 'modele': modele, 'duree': duree, 'mots': m},
                  open(os.path.join(d, f'p{n}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        etat = 'OK  ' if duree <= MAX else 'ATTENTION'
        print(f'{etat} p{n} : {duree:.2f} s, {len(m)} mots, {len(ps[n - 1])} caractères' +
              ('' if duree <= MAX else f' : trop long (> {MAX} s), raccourcir le paragraphe puis --plans {n}'))
    # récapitulatif de tous les plans déjà générés
    lignes = ['# Voix off : instants réels des mots (secondes du plan)', '']
    for n in range(1, 7):
        f = os.path.join(d, f'p{n}.json')
        if os.path.exists(f):
            j = json.load(open(f, encoding='utf-8'))
            lignes += [f'## Plan {n} : {j["duree"]:.2f} s', ' '.join(f'{w}({a:.2f}–{b:.2f})' for w, a, b in j['mots']), '']
    open(os.path.join(d, 'MOTS.md'), 'w', encoding='utf-8').write('\n'.join(lignes))
    # voix complète calée sur la vidéo : chaque plan complété à 10,0 s, bout à bout (60 s), à poser sous les 6 plans au montage
    mp3 = [os.path.join(d, f'p{n}.mp3') for n in range(1, 7)]
    if all(os.path.exists(f) for f in mp3):
        import subprocess
        filt = ''.join(f'[{i}:a]apad=whole_dur=10,atrim=0:10[a{i}];' for i in range(6)) + ''.join(f'[a{i}]' for i in range(6)) + 'concat=n=6:v=0:a=1[o]'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *sum((['-i', f] for f in mp3), []), '-filter_complex', filt, '-map', '[o]',
                        '-b:a', '192k', os.path.join(d, 'voix_complete.mp3')], check=False)
        print('→ ' + os.path.join(d, 'voix_complete.mp3') + ' (6 × 10,0 s)')
    print('→ ' + os.path.join(d, 'MOTS.md'))


if __name__ == '__main__':
    main()
