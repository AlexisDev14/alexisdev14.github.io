#!/usr/bin/env python3
# Planning de publication du BO, reconstitué en LECTURE SEULE (le BO ne stocke la date d'une vidéo qu'une fois publiée).
#   python3 -I planning.py <video_slots.json> <video_planner.json> [--jours 14]
#     <video_slots.json>   réponse de list_documents sur `video_slots` (masque : subject, queued, queuedAt, scheduledAt,
#                          publications.tiktok.state), enregistrée telle quelle (ou le fichier où l'outil l'a écrite)
#     <video_planner.json> réponse de get_document sur `video_planner/config` (rhythm, startDayKey, pausedDays)
# Règle du BO (relevée le 19/10/2026, vérifiée par l'utilisateur) : 2 créneaux par jour, 6 h et 17 h (Paris), à partir de
# startDayKey, jours de pausedDays sautés ; les vidéos en file (queued, non publiées) prennent les créneaux libres dans
# l'ordre de queuedAt croissant. Une vidéo déposée maintenant prend le créneau qui suit la dernière.
# Affiche : le planning des --jours prochains jours (qui passe à 6 h et à 17 h), puis le créneau d'une nouvelle vidéo.
import datetime as dt, json, sys
from zoneinfo import ZoneInfo

PARIS = ZoneInfo('Europe/Paris')
HEURES = (6, 17)


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
if cfg.get('rhythm', '2_par_jour') != '2_par_jour':
    print(f"ATTENTION : rythme « {cfg.get('rhythm')} » inconnu de cet outil (prévu pour 2_par_jour) : planning indicatif.")
pauses = set(cfg.get('pausedDays') or [])
debut = dt.date.fromisoformat(cfg.get('startDayKey') or dt.date.today().isoformat())

pris, file = set(), []
for d in docs:
    f = {k: val(v) for k, v in d.get('fields', {}).items()}
    etat = ((f.get('publications') or {}).get('tiktok') or {}).get('state')
    if f.get('scheduledAt'):
        pris.add(dt.datetime.fromtimestamp(f['scheduledAt'] / 1000, PARIS).replace(minute=0, second=0, microsecond=0))
    if f.get('queued') and etat != 'publie':
        file.append((f.get('queuedAt') or 0, f.get('subject', '?'), d['name'].rsplit('/', 1)[1]))
file.sort()

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
suivant = next(gen)
fin = maintenant.date() + dt.timedelta(jours)
JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
print(f"Planning du BO (2 par jour, {HEURES[0]} h et {HEURES[1]} h ; {len(file)} vidéos en file) :")
for c, s, i in plan:
    if c.date() <= fin:
        print(f"  {JOURS[c.weekday()]} {c:%d/%m} {c.hour:2d} h  {s}  ({i})")
print(f"Une vidéo déposée maintenant passerait le {JOURS[suivant.weekday()]} {suivant:%d/%m} à {suivant.hour} h.")
