# Envoi d'une vidéo terminée sur le Drive Clark : dossier « <Sujet> » dans « Vidéos », 6 plans MP4 + fichier texte.
# Usage : python3 -I drive_envoi.py "<Sujet>" <fichier_texte.txt> <p1_final.mp4> … <p6_final.mp4>
# Identifiants : secret réseau « GOOGLE_DRIVE » (type Body parameter, site oauth2.googleapis.com, chemin /token,
# paramètres client_id, client_secret, refresh_token) injecté par le proxy dans la demande de jeton :
# ce script n'a jamais connaissance de ces valeurs, seulement du jeton d'accès (valable 1 h) renvoyé par Google.
import json, os, sys, urllib.parse, urllib.request

VIDEOS = '1GoKRhXejq2FgNvA0trdSRBmC9uBrZmE_'   # dossier « Vidéos » à la racine du Drive Clark
API = 'https://www.googleapis.com/drive/v3/files'
UP = 'https://www.googleapis.com/upload/drive/v3/files'


def jeton():
    req = urllib.request.Request('https://oauth2.googleapis.com/token',
                                 data=urllib.parse.urlencode({'grant_type': 'refresh_token'}).encode(), method='POST')
    with urllib.request.urlopen(req) as r:
        return json.load(r)['access_token']


def appel(tok, url, data=None, method='GET', headers=None):
    h = {'Authorization': f'Bearer {tok}'}; h.update(headers or {})
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    with urllib.request.urlopen(req) as r:
        return r.headers, r.read()


def dossier(tok, nom, parent):
    q = f"name = '{nom.replace(chr(39), chr(92) + chr(39))}' and '{parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    _, b = appel(tok, API + '?' + urllib.parse.urlencode({'q': q, 'fields': 'files(id)', 'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}))
    f = json.loads(b)['files']
    if f: return f[0]['id']
    _, b = appel(tok, API + '?supportsAllDrives=true', json.dumps({'name': nom, 'mimeType': 'application/vnd.google-apps.folder', 'parents': [parent]}).encode(),
                 'POST', {'Content-Type': 'application/json'})
    return json.loads(b)['id']


def envoyer(tok, chemin, parent, mime):
    meta = json.dumps({'name': os.path.basename(chemin), 'parents': [parent]}).encode()
    h, _ = appel(tok, UP + '?uploadType=resumable&supportsAllDrives=true', meta, 'POST',
                 {'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': str(os.path.getsize(chemin))})
    with open(chemin, 'rb') as f:
        _, b = appel(tok, h['Location'], f.read(), 'PUT', {'Content-Type': mime})
    print('→', os.path.basename(chemin), json.loads(b)['id'])


if __name__ == '__main__':
    sujet, texte, videos = sys.argv[1], sys.argv[2], sys.argv[3:]
    tok = jeton()
    d = dossier(tok, sujet, VIDEOS)
    envoyer(tok, texte, d, 'text/plain')
    for v in videos: envoyer(tok, v, d, 'video/mp4')
    print(f'dossier : https://drive.google.com/drive/folders/{d}')
