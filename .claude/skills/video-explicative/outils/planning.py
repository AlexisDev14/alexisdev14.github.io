#!/usr/bin/env python3
# Planning de publication du BO, reconstitué en LECTURE SEULE (le BO ne stocke la date d'une vidéo qu'une fois publiée).
#   python3 -I planning.py <video_slots.json> <video_planner.json> [--jours 14]
#     <video_slots.json>   réponse de list_documents sur `video_slots` (masque : subject, queued, queuedAt, scheduledAt, pin,
#                          targetDate, publications.tiktok.state), enregistrée telle quelle (ou le fichier où l'outil l'a écrite)
#     <video_planner.json> réponse de get_document sur `video_planner/config` (rhythm, startDayKey, pausedDays)
# Règle du BO (relevée le 19/10/2026, vérifiée par l'utilisateur) : 2 créneaux par jour, 6 h et 17 h (Paris), à partir de
# startDayKey, jours de pausedDays sautés ; les vidéos en file (queued, non publiées) prennent les créneaux libres dans
# l'ordre de queuedAt croissant. Une vidéo déposée maintenant prend le créneau qui suit la dernière.
# Épinglage (relevé le 20/10) : `pin` = instant (ms) du créneau où l'utilisateur a épinglé la vidéo dans le BO ; une vidéo
# épinglée occupe ce créneau, les autres coulent autour dans l'ordre de queuedAt.
# Affiche : le planning des --jours prochains jours, puis le CRÉNEAU NATUREL d'une nouvelle vidéo (celui qu'elle prendra
# toute seule, sans que personne la déplace) : c'est le jour que vise une vidéo calendrier (ROUTINE.md, 1 bis).
# Rythme : heures connues pour « 2_par_jour » ; pour un autre rythme, les heures sont déduites des vidéos déjà programmées
# (scheduledAt) ; à défaut, 6 h et 17 h avec une ATTENTION.
#   --cible AAAA-MM-JJ : dit en plus si une vidéo déposée maintenant tombe bien ce jour-là (contrôle avant le dépôt au BO).
import datetime as dt, json, sys
from zoneinfo import ZoneInfo

PARIS = ZoneInfo('Europe/Paris')
RYTHMES = {'2_par_jour': (6, 17)}


def val(v):
    if not isinstance(v, dict): return v
    for k in ('stringValue', 'booleanValue', 'nullValue'):
        if k in v: return v[k]
    if 'integerValue' in v: return int(v['integerValue'])
    if 'arrayValue' in v: return [val(x) for x in v['arrayValue'].get('values', [])]
    if 'mapValue' in v: return {k: val(x) for k, x in v['mapValue'].get('fields', {}).items()}
    return None


def charger(f):
    j = json.load(open(f, encoding='utf-8'))
    if isinstance(j, list) and j and isinstance(j[0], dict) and 'text' in j[0]:   # résultat d'outil enregistré
        j = json.loads(j[0]['text'])
    return j


a = sys.argv[1:]
jours = int(a[a.index('--jours') + 1]) if '--jours' in a else 14
docs = charger(a[0]).get('documents', [])
cfg = charger(a[1]); cfg = {k: val(v) for k, v in cfg.get('fields', cfg).items()}
pauses = set(cfg.get('pausedDays') or [])
debut = dt.date.fromisoformat(cfg.get('startDayKey') or dt.date.today().isoformat())

pris, file, epingles = set(), [], []
for d in docs:
    f = {k: val(v) for k, v in d.get('fields', {}).items()}
    etat = ((f.get('publications') or {}).get('tiktok') or {}).get('state')
    if f.get('scheduledAt'):
        pris.add(dt.datetime.fromtimestamp(f['scheduledAt'] / 1000, PARIS).replace(minute=0, second=0, microsecond=0))
    if f.get('queued') and etat != 'publie':
        ident = d['name'].rsplit('/', 1)[1]
        if f.get('pin') and not f.get('scheduledAt'):
            c = dt.datetime.fromtimestamp(f['pin'] / 1000, PARIS)
            pris.add(c); epingles.append((c, f.get('subject', '?') + '  📌', ident))
        else:
            file.append((f.get('queuedAt') or 0, f.get('subject', '?'), ident))
file.sort()

HEURES = RYTHMES.get(cfg.get('rhythm', '2_par_jour'))
if not HEURES:   # rythme inconnu : heures des vidéos déjà programmées
    vues = sorted({c.hour for c in pris})
    HEURES = tuple(vues) or (6, 17)
    print(f"ATTENTION : rythme « {cfg.get('rhythm')} » inconnu de cet outil : heures {HEURES} "
          f"{'déduites des vidéos programmées' if vues else 'par défaut'} ; vérifie le planning dans le BO.")

maintenant = dt.datetime.now(PARIS)
def creneaux():
    j = max(debut, maintenant.date())
    while True:
        if j.isoformat() not in pauses:
            for h in HEURES:
                c = dt.datetime(j.year, j.month, j.day, h, tzinfo=PARIS)
                if c > maintenant and c not in pris: yield c
        j += dt.timedelta(1)

plan, gen = [], creneaux()
for q in file: plan.append((next(gen), q[1], q[2]))
plan = sorted(plan + [e for e in epingles if e[0] > maintenant])
suivant = next(gen)
fin = maintenant.date() + dt.timedelta(jours)
JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
print(f"Planning du BO ({len(HEURES)} par jour, {' et '.join(f'{h} h' for h in HEURES)} ; {len(file) + len(epingles)} vidéos en file "
      f"dont {len(epingles)} épinglées 📌) :")
for c, s, i in plan:
    if c.date() <= fin:
        print(f"  {JOURS[c.weekday()]} {c:%d/%m} {c.hour:2d} h  {s}  ({i})")
avance = (suivant.date() - maintenant.date()).days
print(f"Une vidéo déposée maintenant passerait le {JOURS[suivant.weekday()]} {suivant:%d/%m} à {suivant.hour} h.")
print(f"CRÉNEAU NATUREL : {suivant:%Y-%m-%d %H:00} ({JOURS[suivant.weekday()]} {suivant:%d/%m} à {suivant.hour} h) ; "
      f"file : {len(file) + len(epingles)} vidéos, {avance} jours d'avance")
if '--cible' in a:
    cible = a[a.index('--cible') + 1]
    if suivant.date().isoformat() == cible:
        print(f"CIBLE OK : la vidéo tombera d'elle-même le {cible} à {suivant.hour} h, aucun déplacement.")
    else:
        print(f"CIBLE DÉCALÉE : visée {cible}, elle tomberait le {suivant:%Y-%m-%d} à {suivant.hour} h (la file a bougé) : "
              f"à placer à la main, à signaler en tête du compte rendu.")
