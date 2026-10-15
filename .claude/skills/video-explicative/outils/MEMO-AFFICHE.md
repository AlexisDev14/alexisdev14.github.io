# MEMO-AFFICHE — l'affiche (couverture) d'une vidéo

L'affiche est la miniature TikTok de la vidéo : **une image 1080 × 1920 rendue avec le kit et les marionnettes de la vidéo**, plus une enseigne de titre posée par `affiche.py`. Aucun générateur d'images externe.
Exemples validés par l'utilisateur (à lire avant d'écrire) : `OUTILS/exemples/affiches/barbe-noire`, `mercedes`, `reblochon` (`scene.js` + `timeline.js` d'une ligne).

## 1. La scène (`<travail>/affiche/scene.js`)
- Une **seule image** (rendue à t = 1,4 s, `--stills 42`) : même scène de théâtre que la vidéo, **rideau ouvert** (`M.curtain(t, 1, {})`) et cadre (`M.drawFrame(t)`), tirée de `persos.js` et des décors de la vidéo. Le dossier se prépare avec `construire.sh` comme un plan.
- **Le résumé du récit en une image** : le personnage central, l'objet emblématique (ou le gag récurrent) et, s'il y en a un, celui qui subit ou découvre la ruse. Deux ou trois éléments, pas plus. Le personnage central au centre, grand (échelle ≈ 1), le visage bien lisible.
- **Le tiers haut (y 270–640) reste libre** : l'enseigne du titre y descend. Rien d'important au-dessus de y 680 (fumées, chapeaux et cornes exceptés).
- Rien de clé hors de x 130–930 : les pans du rideau et le cadre coupent les bords.
- Lumière : `M.stageLight(t, { spot: { x: 540, y: 1150, r: 620, a: 0.25 } })`, une toile de fond au couchant ou à l'aube plutôt que de jour.

## 2. Ce que l'utilisateur a corrigé (à respecter)
- **Bras jamais masqués** par un objet tenu : un objet plat (carte, lettre, feuille) se dessine **derrière** la marionnette, la main posée sur son bord ou son coin (dessiner la marionnette une fois sous un `clip` vide pour connaître la position de la main, puis l'objet, puis la marionnette ; voir `mercedes/scene.js`).
- **Un objet brandi se tient devant le personnage**, bras tendu devant (ex. le drapeau blanc du matelot, `armF_up` ≈ −1,15, `armF_lo` ≈ −0,55) : un bras levé de profil qui cache la tête « fait bizarre » en 2D.
- **Visages visibles** : ni bras, ni objet, ni carte devant un visage (le visage d'Emma caché par la carte, refusé).
- **Expressions qui racontent** : le complice fait un clin d'œil au public, la victime a peur (`brow: 'worry'`, `mouth: 'o'`), le témoin s'étonne (mains aux joues par `M.ik`, bouche en « o »).
- **Jamais de main levée paume ouverte** (rappelle un salut), ni de geste ou de symbole ambigu.
- Les gestes demandés par l'utilisateur passent par `M.ik` vers un point de la tête ou du corps (`r.w('head', x, y)`) ; aucune ligne « ATTENTION coude à l'envers » au rendu.
- Un objet qui vole (carte ailée, lettre) : petites ailes de papier ivoire bordées de blanc, l'objet penché vers son destinataire, un pointillé depuis l'expéditeur (voir `mercedes/scene.js`, `aile` et `carteAilee`).
- Les personnages de l'affiche sont ceux du **cœur de l'histoire** (l'inventeur et celui qui en tire l'idée, le héros et sa victime) ; un personnage secondaire de la vidéo n'y figure pas (Téflon : Colette retirée, Plunkett et Marc Grégoire gardés).
- Coffres, couvercles, objets orientés : vérifier qu'ils s'ouvrent vers le centre et ne sortent pas du cadre (`dir`).

## 3. Le titre (`affiche.py`)
`python3 -I OUTILS/affiche.py <travail>/out/affiche/still_0042.png "<travail>/out/<Sujet> — affiche.png" <THEME> "LIGNE 1" "petite ligne" "LIGNE 3"`
- Trois lignes : **deux grandes en capitales**, une **petite en minuscules** au milieu (liaison, entre deux filets). Chaque ligne est ajustée à la largeur de l'enseigne : le titre ne déborde jamais.
- La couleur de l'enseigne suit `<THEME>` (`theme_code` de la question : HIST, GEO, SCI, ART, MUS, POP, SPORT, VIE, ECO, LANG, ACTU), assourdie pour la palette du théâtre.
- **Le titre intrigue, il ne répète pas l'évidence** : « Barbe Noire, le pirate qui fumait » a été refusé (« qui fumait, on s'en doute ») ; refusé aussi : « LE PRÉFET — qui finit à — LA POUBELLE » ; validés : « BARBE NOIRE — qui jouait — LA TERREUR », « LE FROMAGE — de la — FRAUDE », « L'ÉTOILE — née sur une — CARTE POSTALE ». Il fait sentir le retournement sans le dévoiler.
- 4 à 7 mots en tout, orthographe et accents vérifiés.

## 4. Contrôle (toi, avant le Drive)
- Regarde l'image entière, puis 2 gros plans (`planche.sh` ne sert pas ici : recadre avec `/usr/bin/python3 -c "from PIL import Image; Image.open(A).crop((x0,y0,x1,y1)).save(B)"`) : les mains et objets tenus, les visages.
- Vérifie la liste du §2 point par point ; corrige (3 tours au plus) puis passe à `affiche.py`.
- Regarde l'affiche réduite (≈ 270 × 480) : le titre et le personnage central doivent se lire en miniature.
