# Recherche de sons CC0 sur Freesound (tri par téléchargements). Usage : python3 freesound_cc0.py "mots clés"
# Colonnes : aperçu mp3 (remplacer -lq par -hq), identifiant, durée, téléchargements, auteur, titre.
import re,sys,html,urllib.parse,subprocess
q=sys.argv[1]
url="https://freesound.org/search/?q="+urllib.parse.quote_plus(q)+"&f=license%3A%22Creative+Commons+0%22&s=Downloads+(most+first)"
s=subprocess.run(['curl','-sS','-m','25','-A','Mozilla/5.0',url],capture_output=True,text=True).stdout
for blk in s.split('class="bw-player"')[1:]:
    g=lambda k: (re.search(k+r'="([^"]*)"',blk) or [None,''])[1]
    print(f"{g('data-mp3')}\t{g('data-sound-id')}\t{float(g('data-duration') or 0):6.1f}s\t{g('data-num-downloads'):>6}\t{g('data-username')}\t{html.unescape(g('data-title'))}")
