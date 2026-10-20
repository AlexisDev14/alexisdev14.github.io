# Envoi d'une vidéo terminée sur le Drive Clark : dossier « <Sujet> » dans « Vidéos », ses plans MP4 (4 à 10), voix, affiche, vidéo sous-titrée, sources.
# Usage : python3 -I drive_envoi.py "<Sujet>" <fichier_texte.txt | -> <p1_final.mp4> … <pN_final.mp4>   (« - » : pas de fichier texte)
#   "<Sujet>" peut être « id:<id du dossier> » pour déposer dans un dossier existant précis (lien du registre).
#   Le type MIME suit toujours l'extension (.png → image/png, .txt → text/plain…), y compris pour le 2e argument.
# Rangement dans le dossier du sujet : sous-dossier « Plans » (plans pN_final.mp4), sous-dossier « Audio » (.mp3, .wav), sous-dossier « Sources » (.zip de sources.sh) ; le reste
# (vidéos complètes d'assembler.sh et soustitres.py, fichier texte, .json, .md, .png) à la racine du dossier. Les sous-dossiers sont créés au besoin, ou retrouvés.
# ⛔ La vidéo complète SANS sous-titres (« … — vidéo complète.mp4 ») n'est jamais déposée (souhait de l'utilisateur, 20/10) :
# le script l'ignore ; seule la version sous-titrée va sur le Drive. Elle reste en local pour refaire les sous-titres.
# Renvoi sans doublon : un fichier de même nom déjà présent dans le dossier est REMPLACÉ (nouvelle version du même
# fichier, même lien), jamais dupliqué ni mis à la corbeille. Relancer le script après une correction est donc sans risque.
# Identifiants : secret réseau « GOOGLE_DRIVE » (type Body parameter, site oauth2.googleapis.com, chemin /token,
# paramètres client_id, client_secret, refresh_token) injecté par le proxy dans la demande de jeton :
# ce script n'a jamais connaissance de ces valeurs, seulement du jeton d'accès (valable 1 h) renvoyé par Google.
import json, os, re, sys, urllib.parse, urllib.request

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


def existant(tok, nom, parent):
    q = f"name = '{nom.replace(chr(39), chr(92) + chr(39))}' and '{parent}' in parents and trashed = false"
    _, b = appel(tok, API + '?' + urllib.parse.urlencode({'q': q, 'fields': 'files(id)', 'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}))
    f = json.loads(b)['files']
    return f[0]['id'] if f else None


def envoyer(tok, chemin, parent, mime):
    nom, taille = os.path.basename(chemin), str(os.path.getsize(chemin))
    fid = existant(tok, nom, parent)
    up = {'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': taille}
    if fid:   # remplace le contenu du fichier existant (même id, même lien) : pas de doublon
        h, _ = appel(tok, f'{UP}/{fid}?uploadType=resumable&supportsAllDrives=true', json.dumps({'mimeType': mime}).encode(), 'PATCH', up)
    else:
        h, _ = appel(tok, UP + '?uploadType=resumable&supportsAllDrives=true',
                     json.dumps({'name': nom, 'parents': [parent]}).encode(), 'POST', up)
    with open(chemin, 'rb') as f:
        _, b = appel(tok, h['Location'], f.read(), 'PUT', {'Content-Type': mime})
    print('→', nom, json.loads(b)['id'], '(remplacé)' if fid else '')


MIME = {'.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.json': 'application/json', '.md': 'text/markdown', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.txt': 'text/plain', '.mp4': 'video/mp4', '.zip': 'application/zip'}
RANGEMENT = {'.mp4': 'Plans', '.mp3': 'Audio', '.wav': 'Audio', '.zip': 'Sources'}


if __name__ == '__main__':
    sujet, texte, fichiers = sys.argv[1], sys.argv[2], sys.argv[3:]
    tok = jeton()
    d = sujet[3:] if sujet.startswith('id:') else dossier(tok, sujet, VIDEOS)
    sous = {}
    if texte != '-': fichiers = [texte] + fichiers     # le type suit l'extension (une image passée là reste une image)
    for f in fichiers:
        if os.path.basename(f).endswith('— vidéo complète.mp4'):
            print('ignoré (pas de vidéo sans sous-titres sur le Drive) :', os.path.basename(f)); continue
        ext = os.path.splitext(f)[1].lower()
        nom = RANGEMENT.get(ext)
        if ext == '.mp4' and not re.fullmatch(r'p\d+(_final)?\.mp4', os.path.basename(f)): nom = None   # vidéo complète : à la racine
        if nom and nom not in sous: sous[nom] = dossier(tok, nom, d)
        envoyer(tok, f, sous[nom] if nom else d, MIME.get(ext, 'video/mp4'))
    print(f'dossier : https://drive.google.com/drive/folders/{d}')
