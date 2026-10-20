#!/usr/bin/env python3
# Nettoyage des dossiers des vidéos DÉJÀ PUBLIÉES dans « Vidéos » sur le Drive Clark.
#   python3 -I nettoyer.py <video_slots.json>          simulation : affiche ce qui partirait à la corbeille
#   python3 -I nettoyer.py <video_slots.json> --go     exécute
# <video_slots.json> : réponse de list_documents sur `video_slots` (masque subject, driveFolderUrl,
# publications.tiktok.state), enregistrée telle quelle (ou le fichier où l'outil l'a écrite).
# Vidéo publiée = publications.tiktok.state « publie ». Son dossier (lien driveFolderUrl, sinon le dossier de « Vidéos »
# dont le nom sans la date est le subject) ne garde que « <Titre> — vidéo complète sous-titrée.mp4 » et
# « <Titre> — affiche.png » ; tout le reste (vidéo sans sous-titres, ancien export, Plans, Audio, Sources…) va à la
# CORBEILLE (récupérable 30 jours), jamais supprimé définitivement. Garde-fou : si le dossier n'a pas exactement une
# vidéo sous-titrée et une affiche, il n'est pas touché (signalé « À VOIR »).
# Identifiants Drive : secret réseau GOOGLE_DRIVE injecté par le proxy (voir video-explicative/outils/drive_envoi.py).
import json, os, re, sys, urllib.parse

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ICI, '..', 'video-explicative', 'outils'))
from drive_envoi import jeton, appel, API, VIDEOS

F = 'application/vnd.google-apps.folder'
GARDER = ('— vidéo complète sous-titrée.mp4', '— affiche.png')


def val(v):
    if not isinstance(v, dict): return v
    if 'stringValue' in v: return v['stringValue']
    if 'mapValue' in v: return {k: val(x) for k, x in v['mapValue'].get('fields', {}).items()}
    return None


def charger(f):
    j = json.load(open(f, encoding='utf-8'))
    if isinstance(j, list) and j and isinstance(j[0], dict) and 'text' in j[0]:   # résultat d'outil enregistré
        j = json.loads(j[0]['text'])
    return j.get('documents', [])


def lister(tok, pid):
    out, page = [], None
    while True:
        p = {'q': f"'{pid}' in parents and trashed = false", 'pageSize': 1000, 'fields': 'nextPageToken, files(id,name,mimeType,size)',
             'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}
        if page: p['pageToken'] = page
        _, b = appel(tok, API + '?' + urllib.parse.urlencode(p)); j = json.loads(b)
        out += j['files']; page = j.get('nextPageToken')
        if not page: return out


def norm(s):
    return re.sub(r'\W+', ' ', s.lower()).strip()


a = sys.argv[1:]
GO = '--go' in a
publies = []
for d in charger(a[0]):
    f = {k: val(v) for k, v in d.get('fields', {}).items()}
    if ((f.get('publications') or {}).get('tiktok') or {}).get('state') == 'publie':
        m = re.search(r'folders/([\w-]+)', f.get('driveFolderUrl') or '')
        publies.append((f.get('subject', '?'), m.group(1) if m else None))

tok = jeton()
dossiers = [x for x in lister(tok, VIDEOS) if x['mimeType'] == F]
print(f"{'EXÉCUTION' if GO else 'SIMULATION'} : {len(publies)} vidéos publiées au BO")
total, a_voir = 0, []
for sujet, fid in publies:
    d = next((x for x in dossiers if x['id'] == fid), None) or \
        next((x for x in dossiers if norm(x['name'].split(' — ', 1)[-1]) == norm(sujet)), None)
    if not d:
        a_voir.append(f'{sujet} : dossier introuvable dans « Vidéos »'); continue
    contenu = lister(tok, d['id'])
    gardes = [x for x in contenu if x['mimeType'] != F and x['name'].endswith(GARDER)]
    if sorted(x['name'].endswith(GARDER[0]) for x in gardes) != [False, True]:
        a_voir.append(f"{d['name']} : il faut exactement 1 vidéo sous-titrée et 1 affiche ({', '.join(x['name'] for x in gardes) or 'aucune'}) : rien touché")
        continue
    jeter = [x for x in contenu if x not in gardes]
    if not jeter:
        print(f"  ✓ {d['name']} : déjà propre"); continue
    print(f"  {d['name']} :")
    for x in jeter:
        taille = int(x.get('size', 0))
        if x['mimeType'] == F:
            taille = sum(int(y.get('size', 0)) for y in lister(tok, x['id']))
        total += taille
        print(f"    🗑 {x['name']}{'/' if x['mimeType'] == F else ''}  ({taille / 1e6:.1f} Mo)")
        if GO:
            appel(tok, f"{API}/{x['id']}?supportsAllDrives=true", json.dumps({'trashed': True}).encode(), 'PATCH',
                  {'Content-Type': 'application/json'})
for l in a_voir: print('  À VOIR :', l)
print(f"{'Mis' if GO else 'À mettre'} à la corbeille : {total / 1e6:.0f} Mo" + ('' if GO else ' (relancer avec --go pour exécuter)'))
