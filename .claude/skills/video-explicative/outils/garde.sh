# Garde commune de construire.sh, essai.sh et produire.sh (sourcée, pas lancée).
# Lancés sans argument, sur un chemin mal tapé ou sur le dossier de la vidéo, ces scripts ont écrasé persos.js et rideau.json
# et semé des fichiers dans outils/ et dans le dossier du skill (galette 17/10, Frankenstein 22/10, deux fois). Ils refusent donc :
#  - un argument vide ou qui n'est pas un dossier ;
#  - un dossier dans le skill (outils/, exemples/…) : le travail se fait toujours dans le scratchpad ;
#  - le dossier de la vidéo lui-même (celui qui contient FICHE.md ou voix.txt) : il faut <video>/pN, <video>/casting ou <video>/affiche.
garde_dossier() {
  local arg="$1" outils="$2" p skill
  if [ -z "$arg" ] || [ ! -d "$arg" ]; then
    echo "ERREUR : dossier du plan absent ou introuvable (« $arg ») : donne le chemin ABSOLU <video>/pN (ou /casting, /affiche). Rien n'a été fait."; exit 2
  fi
  p="$(cd "$arg" && pwd)"; skill="$(dirname "$outils")"
  case "$p/" in "$skill"/*)
    echo "ERREUR : $p est dans le skill ; le travail se fait dans le dossier de la vidéo (scratchpad), jamais dans outils/. Rien n'a été fait."; exit 2;;
  esac
  if [ -f "$p/FICHE.md" ] || [ -f "$p/voix.txt" ]; then
    echo "ERREUR : $p est le dossier de la VIDÉO ; donne celui d'un plan : $p/pN (ou $p/casting, $p/affiche). Rien n'a été fait."; exit 2
  fi
}
