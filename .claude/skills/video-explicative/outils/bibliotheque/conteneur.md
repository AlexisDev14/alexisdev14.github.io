# persos.md — « Le conteneur, né d'une journée d'attente » : mode d'emploi de `persos.js`

Espace de noms : `M.cont` (alias `CON` : `const CON = M.cont;`). Dans `S.init` : `CON.init()` (pré-rendus : `CON.K.quai37.{ciel,fond}`, `CON.K.port56.{ciel,fond}`, `CON.K.grue.{orange,gris,jaune,bleu}`, `CON.K.navire`). **`CON.grue` et `CON.navire` exigent `CON.init()`.**
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle (calculées sur la géométrie et vérifiées sur la planche `casting/`).
Aucun texte, lettre ni chiffre. Tout est fonction pure de `t` (passer `t` dans la pose / les options).

## Marionnettes (avec tige ; `slot: ST.slotF` mis par défaut)
Toujours par l'enveloppe `CON.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce ; `r.tenu`, `r.tenuO`).
`o` = options de `M.puppet` : `dir` ±1, `slot`, `cast` (`{dx:22,dy:10,a:0.3}`), `alpha`, `nom` (nom affiché dans les alertes « coude à l'envers »).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'rien'` | `'caisse'` | `'balle'` | `'crochet'` | `'corde'` ; `tenuO` / `tenuBO` : options de cet objet (les mêmes que l'objet seul : `{teinte}`, `{sangles}`, corde `{haut, bas}` en local).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (caisse, balle : flanc arrière ; ses doigts passent par-dessus l'objet).
- `handF` / `handB` : `'fist'` | `'open'` (poing d'office quand la main tient un objet) ; `face` : `{ brow: 'n'|'up'|'frown'|'worry', mouth: 'n'|'o'|'smile'|'tight', eyes: 'open'|'closed'|'wide'|'half' }` ; `t`.
- Angles `ang` (rad, ajoutés) : `armF_up` 0 pendant, −1,57 horizontal devant, −2,5 au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé ; `legF`/`legB` en opposition pour un pas.
- Point nommé de l'objet tenu : `CON.pt(r, 'nom')` → `[x, y]` écran (`CON.pt(r, 'nom', true)` pour la main arrière). Caisse et balle : `haut`, `centre`, `base` ; crochet : `pointe`, `poignee` ; corde : `haut`, `bas`.
- Pièces (pour `hide`) : `armB_up armB_lo objetB doigtsB legB legF head <coiffe> torso armF_up armF_lo objet doigts doigtsD` ; coiffe = `casquette` (McLean, docker B) / `bonnet` (docker A) ; dockers : `crochetC` (crochet à la ceinture, hanche arrière).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `CON.mclean` | 0,9 ≈ 483 px (casquette comprise) | `casquette`, `casquetteM` (la même dans la main) | `ballants` (épaules tombantes, tête basse, bras pendants) ; `menton` (poing sous le menton, tête un peu baissée) ; `hanches` (poings sur les hanches, coudes en arrière, buste bombé, sourire) ; `casquette` (0→0,5 : main OUVERTE qui monte sur la calotte ; 0,5→1 : casquette soulevée au-dessus de la tête, cheveux plaqués visibles) ; `trepigne` (avec `t` : le pied avant tape 2,5 fois/s, talon au sol à t = 0,4·k + 0,2 ; poings serrés, sourcils froncés, bouche pincée) |
| `CON.dockerA` (bonnet bleu pétrole, tricot rayé crème/brun, pantalon gris, barbe de trois jours) | 0,9 ≈ 484 px | `bonnet`, `crochetC` | communes aux dockers (ci-dessous) |
| `CON.dockerB` (gavroche brune à bouton, salopette vert éteint, chemise rouille, moustache noire en guidon, bedaine) | 0,9 ≈ 480 px | `casquette`, `crochetC` | communes aux dockers |

Gestes des dockers : `porte` (caisse portée contre le ventre, deux mains ; `tenu:'caisse'` et `deuxMains` d'office ; `tenu:'balle'` possible) ; `tend` (caisse tendue bras presque tendus à hauteur de poitrine, poing ≈ 130 px devant les pieds à 0,9) ; `hisse` + `tire` 0..1 (deux mains sur une corde verticale à `CON.DOCK.cordeX` = 64 px locaux devant lui, buste en arrière ; `tire` 0 = mains hautes, 1 = mains basses ; la corde dessinée va de 440 locaux au-dessus de la main avant à 150 sous la main arrière : prolonger depuis `CON.pt(r,'haut')`) ; `regardeCrochet` (crochet en main devant le ventre, tête baissée ; le crochet de ceinture disparaît) ; `ballants`.

`bendSign` de `M.ik` (la main = point `[0, 100]` de l'avant-bras, `handLen` 100) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| McLean (vérifié : menton, hanches, casquette, tendre, se baisser) | 1 | 1 | 1 | 1 |
| Docker A / B (même bras que McLean ; vérifié : docker B tend la caisse, dir −1) | 1 | 1 | 1 | 1 |

Pièges :
- `casquette ≥ 0,5` masque la casquette de la tête et la met dans la main ; ne pas la combiner avec `menton`. Pour la rendre plus tard, redescendre `casquette` à 0 (pas de casquette libre).
- `hanches` : coudes vers l'arrière (lecture « poings sur les hanches » de profil) ; le bras arrière est presque caché.
- `M.ik` sur une enveloppe : construire la pose, appeler `M.ik(M.chars.conMclean, pose, x, y, s, dir, 'armF', cible, 1)`, puis passer la pose à `CON.mclean` (clés des défs : `conMclean`, `conDockerA`, `conDockerB`).
- `trepigne` et `tire` ne bougent que si `t` change ; `tire` est piloté par le plan (ex. `0.5 - 0.5*Math.cos(t*4)`).
- Un objet tenu par la main ARRIÈRE passe derrière le torse (normal de profil) : pour un objet bien visible, le donner à la main avant.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre ovale au sol), `o.t`. Retour `r` : `r.pt([lx,ly])` = point écran d'un point local. (`grue` et `navire` : ni `dir` ni `rot`.)

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| `CON.sablier(x,y,s,o)` | milieu du socle (avec `chaise` : sol sous le milieu de la chaise) | 1,3 : 166 × 122 px ; avec chaise ≈ 330 × 260 px | `coule` 0..1 (sable dans le bulbe du HAUT, 1 par défaut ; filet + grains qui tombent si 0 < coule < 1 et `retourne` = 0) ; `retourne` 0..1 (demi-tour autour du col) ; `filet` (`false` = pas de filet) ; `chapeau` (canotier de paille, caché pendant un retournement) ; `chaise` (chaise longue rayée rouge/ivoire) ; `couche` 0..1 (du sol, à 190 locaux devant la chaise, jusqu'à couché sur la toile) |
| `CON.goeland(x,y,s,o)` | pattes au sol (endormi : sous le ventre) | 1,1 : debout 110 px de haut, 133 de long ; endormi ≈ 70 × 120 px | `etat` `'debout'` \| `'dort'` (boule de plumes, tête retournée, bec sous l'aile, respire avec `t`) \| `'eveil'` (tête haute, œil rond, plumes hérissées, ailes un peu levées) ; `vieux` (sourcils de plumes blancs, lorgnon, bec pâli, canne ; marche aussi avec `'dort'`) ; `ailes` 0..1 (ailes levées pour se poser / s'envoler) + `bat` (rad : battement `Math.sin(bat)`) |
| `CON.camion(x,y,s,o)` | sol sous le milieu ; cabine à droite si `dir:1` | 1 : 428 × 198 px | `charge` 0..5 (5 balles de coton sanglées) ; `phares` 0..1 (le phare pique du nez, paupière de tôle) ; `klaxon` 0..1 (soubresaut de la caisse + ondes de papier devant la calandre : impulsion de ≈ 0,3 s) ; `roule` (px locaux parcourus : roues qui tournent). Retour : `r.dessus` (sommet de la plus haute balle, pour le goéland), `r.phare`, `r.klaxon` |
| `CON.caisse(x,y,s,o)` | milieu du bas | 0,9 : 126 × 97 px | `teinte` 0..3 (sapin, chêne, clair, acajou) ; `r.haut` |
| `CON.balle(x,y,s,o)` | milieu du bas | 0,9 : 117 × 77 px | `sangles` (3) ; `r.haut` |
| `CON.crochet(x,y,s,o)` | milieu de la poignée | 0,9 : 45 × 61 px | — |
| `CON.conteneur(x,y,s,o)` | milieu du bas | 1 : 280 × 120 px | `couleur` `'rouge'` (#9a3b2e) \| `'bleu'` (#3f5a78) \| `'ocre'` (#b58a2c) \| `'vert'` (#566b4a) \| `'#hex'` (`CON.COULEURS` = les 4) ; `ruban` 0..1 (ruban rose vertical, puis horizontal, puis nœud sur le toit) ; `scelle` (rosette de cire rose sur le montant droit) ; `r.haut` |
| `CON.grue(x,y,s,o)` | sol sous le milieu du portique (poser sur `ST.back`) | 0,5 : 545 × 505 px (flèche de x−225 à x+320) | `couleur` `'orange'` \| `'gris'` \| `'jaune'` \| `'bleu'` ; `chariot` (x local −380..560, 0) ; `palonnier` (y local du dessus du palonnier, −700..−30, −420) **ou** `bas` (y local du dessous du conteneur porté : palonnier = bas − 136) ; `charge` (options d'un conteneur, ex. `{couleur:'bleu', ruban:1}`, ou `true`) ; `balance` (rad, autour du chariot). Retour : `r.palonnier`, `r.conteneur` (milieu du bas du conteneur porté), `r.chariot` |
| `CON.navire(x,y,s,o)` | ligne de flottaison, milieu ; proue à droite | 0,45 : 702 × 286 px (coque noire, bande rouge autour de la flottaison) | `nombre` 0..6 conteneurs sur le pont (3 en bas puis 3 au-dessus) ; `couleurs` (liste, défaut rouge, bleu, ocre, vert, bleu, rouge) ; `conteneurO` (options communes, ex. `{ruban:1}`) ; `charpente` (`false` = sans pont à conteneurs, navire de 1937) ; `fumee` 0..1 (0,6) avec `t`. Retour : `r.slot(i)` = milieu du bas de l'emplacement i (0..5) |
| `CON.bateauPompe(x,y,s,o)` | flottaison, milieu | 0,4 : 78 × 40 px (+ jets) | `jets` 0..1 (deux gerbes d'eau, avec `t`) ; à faire glisser de gauche à droite sur l'eau du fond |

Repères : `CON.CAMION` (`balles`, `phare`, `klaxon`), `CON.GRUE` (`fleche` −760, `chariotMin/Max`, `palMin/Max`, `haut` −1010), `CON.NAVIRE` (`slots` locaux, `pont` −232, `cheminee`, `proue` 780, `poupe` −760).
Pièges :
- Sablier retourné : à la fin du demi-tour, remettre `retourne` à 0 ET `coule` à `1 − coule` (image identique, le filet repart). Pendant le demi-tour le sable reste figé.
- Grue → navire : même échelle `s` pour les deux. Conteneur porté : bas écran = `y + (palonnier + 136)·s` ; pour le poser sur l'emplacement i, amener `r.conteneur` sur `rNavire.slot(i)` (régler `chariot` et `bas`), puis le dessiner par le navire (`nombre` + 1) et `charge: null`.
- Le navire est pré-rendu : `alpha` et `cast` seulement. Sa coque descend de 44 px locaux sous la flottaison : la cacher par l'eau / la margelle du décor (dessiner le navire AVANT `K.port56.fond`).
- `CON.camion` avec `dir:-1` : cabine à gauche (tout suit le miroir, `r.dessus` compris).

## Décors (pré-rendus par `CON.init()`)
Ordre : ciel → oiseaux (`M.oiseaux`, mouettes `col:'#e9e4d8'`) / bateau-pompe → navire → fond → grue → `M.drawFloor()` → marionnettes.

| Clé | Pose | Repères utiles |
|---|---|---|
| `CON.K.quai37.ciel` | `M.ctx().drawImage(CON.K.quai37.ciel, 0, 0)` | ciel jaunâtre, rive lointaine pâle (entrepôts, deux flèches vers x 720), eau sale verdâtre à reflets huileux de y 1170 à `ST.back` |
| `CON.K.quai37.fond` | `M.flat(CON.K.quai37.fond, 540, ST.back, {cast})` | entrepôt de briques à gauche (écran x −60…390, haut y ≈ 625–700 ; grande porte cintrée centrée x 140, 345 de haut), pile de 3 caisses x 290–380, margelle de pierre (26 px), bollards x 660 et 940, tonneaux x 790–840, pieux à droite (x > 1000), amarre |
| `CON.K.port56.ciel` | `drawImage(…, 0, 0)` | ciel clair, nuages de papier, rive plate, portique gris pâle en fond (x 820), cargo pâle à l'horizon (x 190), mer bleu-vert de y 1150 à `ST.back` |
| `CON.K.port56.fond` | `M.flat(CON.K.port56.fond, 540, ST.back, {cast})` | margelle de béton (30 px), bollards x 280, 700, 960 |
| `CON.K.grue.*`, `CON.K.navire` | (utilisés par `CON.grue` / `CON.navire`) | — |

Le rideau `change` (id `port56`) : `if (M.rideauApres(t, 'port56'))` → passer de `quai37` à `port56`.

## Exemples d'appels qui marchent
Voir `<video>/casting/scene.js` (`grep -n 'CON\.' casting/scene.js`). Les plus utiles :
```js
// quai 1937 : McLean, sablier qui coule, camion chargé, goéland endormi sur les balles
ctx.drawImage(CON.K.quai37.ciel, 0, 0); M.flat(CON.K.quai37.fond, 540, ST.back, { cast }); M.drawFloor();
const rc = CON.camion(720, FEET, 1, { t, cast, phares: 0.4 });
CON.goeland(rc.dessus[0], rc.dessus[1], 1, { t, etat: 'dort' });
CON.mclean({ t, casquette: k }, 250, FEET, 0.9, { dir: 1, cast });
CON.sablier(390, FEET, 1.3, { t, coule: 1 - u, cast });
// dockers : A tend une caisse, B hisse à la corde (prolonger la corde depuis CON.pt(r,'haut'))
CON.dockerA({ t, tend: 1, tenuO: { teinte: 2 } }, 300, FEET, 0.9, { dir: 1, cast });
const rb = CON.dockerB({ t, hisse: 1, tire: 0.5 - 0.5 * Math.cos(t * 4) }, 760, FEET, 0.9, { dir: -1, cast });
// port 1956 : navire chargé, grue qui porte un conteneur vert
CON.navire(800, 1345, 0.45, { t, nombre: 5 }); M.flat(CON.K.port56.fond, 540, ST.back, { cast });
const rg = CON.grue(330, ST.back, 0.5, { chariot: 200, palonnier: -500, charge: { couleur: 'vert' }, cast });
CON.sablier(400, FEET, 1.3, { t, chaise: true, couche: k, chapeau: true, cast });
```
