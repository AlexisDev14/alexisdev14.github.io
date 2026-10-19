#!/usr/bin/env python3
# Télécharge (LECTURE SEULE) le contenu d'un dossier du Drive Clark, sous-dossiers compris (« Plans », « Audio », « Sources »).
# Usage : python3 -I drive_recup.py <id du dossier (lien du registre)> <destination>
# Même accès que drive_envoi.py (secret réseau GOOGLE_DRIVE injecté par le proxy : ne jamais chercher à le lire). Les documents Google
# (non téléchargeables tels quels) sont ignorés.
import json, os, sys, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from drive_envoi import jeton, appel, API

tok = jeton()
def lister(pid):
    _, b = appel(tok, API + '?' + urllib.parse.urlencode({'q': f"'{pid}' in parents and trashed = false", 'fields': 'files(id,name,mimeType,size)',
                                                          'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}))
    return json.loads(b)['files']
def tirer(pid, dest):
    os.makedirs(dest, exist_ok=True)
    for f in lister(pid):
        if f['mimeType'] == 'application/vnd.google-apps.folder':
            tirer(f['id'], os.path.join(dest, f['name'])); continue
        if f['mimeType'].startswith('application/vnd.google-apps'):
            continue
        _, b = appel(tok, f"{API}/{f['id']}?alt=media&supportsAllDrives=true")
        open(os.path.join(dest, f['name']), 'wb').write(b)
        print(os.path.relpath(os.path.join(dest, f['name']), sys.argv[2]), len(b))
tirer(sys.argv[1], sys.argv[2])
