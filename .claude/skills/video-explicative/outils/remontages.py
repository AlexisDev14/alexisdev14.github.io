#!/usr/bin/env python3
# Suivi des REMONTAGES (REMONTAGE.md) : quelles vidéos déjà livrées ont reçu le montage actuel. Fichier : ../remontages.md (committé).
# Usage :
#   python3 -I remontages.py etat                         met le dépôt à jour, affiche les ids déjà traités (faits, impossibles, en cours)
#   python3 -I remontages.py debut <id BO> "<Sujet>"      réserve la vidéo (statut « en cours »), committe et pousse
#   python3 -I remontages.py fait <id BO> "<note>"        statut « fait » (note : voix reprises du montage, durée), committe et pousse
#   python3 -I remontages.py impossible <id BO> "<cause>" statut « impossible » (ne sera plus retentée), committe et pousse
# Une ligne « en cours » depuis plus de 2 h est une exécution interrompue : elle peut être reprise (debut la remet à l'heure).
import datetime, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from registre import git, tirer, pousser

F = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'remontages.md'))
ENTETE = ("# Remontages — vidéos déjà livrées passées au montage actuel (REMONTAGE.md)\n\n"
          "Tenu par `outils/remontages.py` (routine « Remontage vidéos »). Une vidéo « fait » ou « impossible » n'est plus reprise.\n\n"
          "| Id BO | Sujet | Statut | Date (UTC) | Note |\n|---|---|---|---|---|\n")

def lire():
    if not os.path.exists(F): return []
    return [[c.strip() for c in l.strip().strip('|').split('|')] for l in open(F) if re.match(r'\|\s*v_', l)]
def ecrire(L):
    open(F, 'w').write(ENTETE + ''.join('| ' + ' | '.join(x) + ' |\n' for x in L))
def maintenant():
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M')
def poser(ident, sujet, statut, note):
    L = [x for x in lire() if x[0] != ident]
    ancien = next((x for x in lire() if x[0] == ident), None)
    L.append([ident, sujet or (ancien[1] if ancien else ''), statut, maintenant(), note.replace('|', '/')])
    ecrire(L)
    ok = pousser(f'Remontage : {ident} {statut}', F)
    print(f'{ident} → {statut}' + ('' if ok else ' (committé mais PAS poussé : relancer git push)'))

cmd = sys.argv[1] if len(sys.argv) > 1 else 'etat'
tirer()
if cmd == 'etat':
    L = lire()
    for st in ('fait', 'impossible', 'en cours'):
        ids = [f'{x[0]} ({x[1]}, {x[3]})' if st == 'en cours' else x[0] for x in L if x[2] == st]
        print(f'{st} : ' + (', '.join(ids) if ids else '—'))
elif cmd == 'debut':
    poser(sys.argv[2], sys.argv[3], 'en cours', '')
elif cmd in ('fait', 'impossible'):
    poser(sys.argv[2], '', cmd, sys.argv[3] if len(sys.argv) > 3 else '')
else:
    sys.exit(__doc__ or 'commande inconnue')
