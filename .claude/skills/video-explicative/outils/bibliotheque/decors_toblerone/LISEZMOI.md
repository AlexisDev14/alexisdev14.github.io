# Décors de la reprise du Toblerone (19-20/10/2026)
Décors partagés écrits par les plans de la vidéo refaite (non chargés automatiquement : construire.sh ne lit que `bibliotheque/*.js`).
Pour les réutiliser, copier le fichier dans `<video>/decors/pN.js` : `construire.sh` le réunit dans `decors.js`, puis `S.init` appelle `TOB.init(); M.dec.init();`.
- `atelier.js` : `M.dec.atelier(t, o)` — atelier de Berne riche et animé (lampe à pétrole, pendule, poussière dans le rayon, passants et nuages derrière la vitre, chat sur le rebord, louche pendue) ; options `table`, `chat: [t0, t1]`, `lampe: t0`, `louche: t0`, `sonne: t0`, `up`.
- `cabaret.js` : `M.dec.cabaret(t, o)` + `M.dec.cabaretAvant(t, o)` — cabaret des Folies Bergère (arc de lampes qui scintillent, colonnes à plumes, tour Eiffel, rampe, guéridons de spectateurs en ombre) ; options `nuit`, `proj`, `spot`, `eiffel`, `lampe`, `up`.
L'affiche `exemples/affiches/toblerone/scene.js` utilise `cabaret.js` (copié en `decors/p4.js`).
