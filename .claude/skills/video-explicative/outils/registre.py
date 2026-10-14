#!/usr/bin/env python3
# Registre partagé des vidéos (videos-realisees.md) : ce que les autres sessions et routines ont déjà fait ou réservé.
#
#   python3 -I registre.py etat
#       Met le dépôt à jour (git pull), puis affiche les dernières vidéos (thème, type de récit, statut), le nombre de
#       vidéos par thème Clark et les THÈMES CONSEILLÉS pour la prochaine (absents des 3 dernières, les moins servis d'abord).
#
#   python3 -I registre.py reserver "<Sujet>" <id_question|-> <THEME> "<type de récit>" "<mots-clés à écarter>"
#       Réserve le sujet AVANT tout travail : relit le registre à jour, refuse si l'id ou le sujet y est déjà, ajoute la
#       ligne « en cours », committe et pousse ce seul fichier (sur la branche courante et sur master), en réessayant si
#       une autre session a poussé entre-temps. Code de sortie 2 = déjà pris : choisir un autre sujet.
#
#   python3 -I registre.py livrer "<Sujet>" "<lien du dossier Drive>" [<id du contenu au BO>]
#       Passe la ligne du sujet à « livrée » avec le lien Drive (et l'id du contenu dans le planificateur du BO, ex.
#       v_20261015_0400), committe et pousse.
import datetime, os, re, subprocess, sys, time

ICI = os.path.dirname(os.path.abspath(__file__))
REG = os.path.normpath(os.path.join(ICI, '..', 'videos-realisees.md'))
DEPOT = subprocess.run(['git', '-C', ICI, 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
THEMES = ['HIST', 'GEO', 'SCI', 'ART', 'MUS', 'POP', 'SPORT', 'VIE', 'ECO', 'LANG']   # ACTU exclu : vidéos intemporelles
FIN = '\n\nCo-Authored-By: Claude <noreply@anthropic.com>'


def git(*a, ok=False):
    r = subprocess.run(['git', '-C', DEPOT, *a], capture_output=True, text=True)
    if r.returncode and not ok:
        raise RuntimeError(f"git {' '.join(a)} : {r.stderr.strip()[:300]}")
    return r


def branche():
    return git('rev-parse', '--abbrev-ref', 'HEAD').stdout.strip()


def tirer():
    git('fetch', '-q', 'origin', 'master', ok=True)
    git('merge', '-q', '--no-edit', 'origin/master', ok=True)


def lignes():
    rows = []
    for l in open(REG, encoding='utf-8'):
        if l.startswith('| ') and not l.startswith('| Date') and not l.startswith('|---'):
            c = [x.strip() for x in l.strip().strip('|').split('|')]
            if len(c) >= 7:
                rows.append({'date': c[0], 'sujet': c[1], 'id': c[2], 'theme': c[3], 'type': c[4], 'statut': c[6], 'brut': l})
    return rows


def code(theme):
    m = re.match(r'([A-Z]+)', theme)
    return m.group(1) if m and m.group(1) in THEMES + ['ACTU'] else '?'


def etat():
    tirer()
    rows = [r for r in lignes() if 'prévue' not in r['statut']]
    print('Dernières vidéos (plus récente en bas) :')
    for r in rows[-6:]:
        print(f"  {r['date']:8} {code(r['theme']):5} {r['type'][:32]:32} {r['statut'][:28]:28} {r['sujet']}")
    compte = {t: sum(code(r['theme']) == t for r in rows) for t in THEMES}
    print('Vidéos par thème : ' + ', '.join(f'{t} {n}' for t, n in compte.items()))
    recents = [code(r['theme']) for r in rows[-3:]]
    types = [r['type'] for r in rows[-2:]]
    conseil = sorted([t for t in THEMES if t not in recents], key=lambda t: (compte[t], THEMES.index(t)))
    print('Thèmes CONSEILLÉS (absents des 3 dernières, les moins servis d\'abord) : ' + ', '.join(conseil))
    print('Types de récit à éviter (2 dernières) : ' + ' ; '.join(types))
    en_cours = [r['sujet'] for r in rows if 'en cours' in r['statut']]
    if en_cours:
        print('En cours dans une autre session (ne pas reprendre) : ' + ' ; '.join(en_cours))


def pousser(msg):
    git('add', REG)
    git('commit', '-q', '-m', msg + FIN)
    b = branche()
    for essai in range(5):
        r1 = git('push', '-q', 'origin', f'HEAD:{b}', ok=True) if b != 'master' else None
        r2 = git('push', '-q', 'origin', 'HEAD:master', ok=True)
        if r2.returncode == 0 and (r1 is None or r1.returncode == 0):
            return True
        time.sleep(2 ** (essai + 1))
        tirer()
    return False


def reserver(sujet, qid, theme, typ, mots):
    tirer()
    rows = lignes()
    norm = lambda s: re.sub(r'\W+', ' ', s.lower()).strip()
    for r in rows:
        if (qid != '-' and qid in r['id']) or norm(sujet) == norm(r['sujet']):
            print(f"DÉJÀ PRIS : « {r['sujet']} » ({r['statut']}) : choisis un autre sujet.")
            sys.exit(2)
    ligne = f"| {datetime.date.today():%Y-%m-%d} | {sujet} | {qid if qid != '-' else '(id non trouvé)'} | {theme} | {typ} | {mots} | en cours | — |\n"
    txt = open(REG, encoding='utf-8').read()
    i = txt.rfind('\n| ')
    j = txt.index('\n', i + 1) + 1
    open(REG, 'w', encoding='utf-8').write(txt[:j] + ligne + txt[j:])
    if not pousser(f'video-explicative : registre, « {sujet} » en cours'):
        print('ATTENTION : réservation committée mais pas poussée (réseau ou conflit) : relancer `git push`.')
        sys.exit(1)
    print(f'RÉSERVÉ : « {sujet} » ({theme}) est en cours dans le registre partagé.')


def livrer(sujet, lien, bo=''):
    tirer()
    txt = open(REG, encoding='utf-8').read()
    for r in lignes():
        if r['sujet'] == sujet:
            c = [x.strip() for x in r['brut'].strip().strip('|').split('|')]
            c[6] = 'livrée' + (f' (BO {bo})' if bo else '')
            if len(c) >= 8:
                c[7] = f'[{sujet}]({lien})' if lien else c[7]
            txt = txt.replace(r['brut'], '| ' + ' | '.join(c) + ' |\n', 1)
            open(REG, 'w', encoding='utf-8').write(txt)
            print('LIVRÉE' if pousser(f'video-explicative : registre, « {sujet} » livrée') else 'ATTENTION : non poussé')
            return
    print(f'Sujet introuvable dans le registre : {sujet}')
    sys.exit(1)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['etat']:
        etat()
    elif a[:1] == ['reserver'] and len(a) == 6:
        reserver(*a[1:])
    elif a[:1] == ['livrer'] and len(a) in (3, 4):
        livrer(*a[1:])
    else:
        print(__doc__ if __doc__ else open(__file__, encoding='utf-8').read().split('import')[0])
