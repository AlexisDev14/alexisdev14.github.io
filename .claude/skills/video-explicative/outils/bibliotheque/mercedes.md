# persos.md — « L'étoile Mercedes, une carte postale » : mode d'emploi de `persos.js`

Espace de noms : `M.mer` (dans `scene.js` : `const MER = M.mer;`). Dans `S.init` : `MER.init();` (pré-rendus `MER.K.salon`, `salonVieux`, `avenue`, `toile`). Pupitre de Daimler : `M.pou.pupitre` (bibliothèque, inchangé ; `POU.init()` inutile pour lui).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle indiquée. `FEET = ST.slotF - 34`, `FEETB = ST.slotB - 30`.
Aucun texte, chiffre ni logo nulle part. L'étoile a toujours trois branches (haut, bas-gauche, bas-droite) : ne jamais la tourner (`rot`) sauf vrille brève qui finit sur un multiple de 2π/3.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `MER.nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce). Pièces : `armB_up armB_lo objetB legB legF head … torso armF_up armF_lo objet doigts doigtsB` (rivets ronds à l'épaule et au coude, pliage jusqu'à 2,4 rad vérifié).
Angles : `armF_up` 0 pendant, −1,57 horizontal devant, −2,5 au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé ; `legF/legB` négatif = jambe vers l'avant.

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : n'importe quel nom d'accessoire ci-dessous (`'plume'`, `'carte'`, `'tampon'`, `'document'`, `'croquis'`, `'facture'`, `'mallette'`, `'sac'`, `'etoile'`, `'hautDeForme'`…) ou `'rien'` ; `tenuO` / `tenuBO` : options de cet objet (les mêmes que l'objet seul). L'objet est à l'échelle de la marionnette (carte ×1 = 135 px à 0,9).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (`carte` : coin opposé ; `facture` : autre bout de la barre). Les autres objets n'en ont pas.
- `handF` / `handB` : `'fist'` | `'open'` (mis à `'fist'` d'office quand la main tient un objet) ; `face` : `{ brow, mouth, eyes }` ; `t` (animations internes : tape du pied, écriture, fumées…).
- Gestes communs (0..1) : `montrer` (bras tendu devant, **main ouverte** si rien n'est tenu ; `presenter` = alias) ; `tendre` (bras tendu à l'horizontale, objet droit) ; `brandir` (bras levé : armF_up −2,0, armF_lo −0,85) ; `devant` (main avant devant la poitrine, à combiner avec `deuxMains` pour tenir carte ou facture à deux mains).
- Point nommé de l'objet tenu : `MER.pt(r, 'nom')` → `[x, y]` écran (`MER.pt(r, 'nom', true)` pour la main arrière). Points : plume `pointe` ; carte `centre`, `etoile` ; tampon `pied` ; document `etoile` ; facture `bas` ; croquis `centre` ; étoile `centre haut bg bd` ; sac `bouche` ; hautDeForme `dessus`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `MER.daimler` (`C.merDaimler`) | 0,9 ≈ 480 px (+ 90 avec chapeau) | `barbe`, `chapeau` | `tenu` = `'plume'` **par défaut** (passer `'rien'` pour mains nues) ; `ecrire` (main au pupitre, la plume gratte avec `t`) + `cible` [x,y] locale (défaut [86,−146]) ; `reflechir` (main à la barbe, menton levé) ; `chapeau: true` (haut-de-forme sur la tête) |
| `MER.emma` (`C.merEmma`) | 0,88 ≈ 470 px | `piedF piedB` (souliers), `cheveux chignon ruban`, `sacF` / `sacmain` | `joindre` (mains jointes devant la taille) ; `tapePied` (pointe du pied avant qui tape, rythme 2,2/s, **exige `t`**) ; `hocher` (tête inclinée ; le plan fait l'aller-retour) ; `sacMain` `'avant'` (défaut : au poignet avant si la main est libre) / `'arriere'` / `false` ; carte à deux mains : `{ tenu:'carte', deuxMains:true, devant:1 }` |
| `MER.paul` (`C.merPaul`) | 0,9 ≈ 480 px | `canotier` | `fier` (buste bombé, menton levé) ; gestes communs |
| `MER.adolf` (`C.merAdolf`) | 0,9 ≈ 480 px | `melon` (lunettes rondes peintes) | `tamponner` 0 = tampon levé (≈ 70 px plus haut), 1 = appuyé ; met `tenu:'tampon'` si `tenu` absent ; `cible` [x,y] locale du poing (défaut [96,−190]) |
| `MER.pub` (`C.merPub`) | 0,92 ≈ 490 px | `cheveux` | sourcil haut + sourire en coin **par défaut** (`face.brow:'n'`, `face.mouth:'n'` pour neutraliser) ; `presenter` (main ouverte vers un objet) ; `brandir` + `tenu:'croquis'` ; facture : `{ tenu:'facture', deuxMains:true, devant:1, tenuO:{deroule} }` ; mallette : `tenuB:'mallette'` |

Réglages vérifiés sur la planche : Daimler `ecrire:1` à x, pupitre `M.pou.pupitre(x + dir·140, FEETB, 1, { plume:false })` → la pointe touche la feuille. Adolf `tamponner:1` à x 830 dir −1, pupitre à 690 (FEETB), document couché à (700, 1092) : le tampon tombe sur le document.
Pièges :
- `reflechir` avec la plume en main : la plume passe devant le visage → passer `tenu:'rien'` pendant ce geste.
- Daimler **avec** `chapeau` ressemble au propriétaire de `poubelle.js` (haut-de-forme, redingote brune) : garder le chapeau sur le pupitre sauf besoin réel.
- Emma n'a pas de jambes visibles (robe à traîne jusqu'au sol) : pour marcher, balancer `legF/legB` ±0,3, seuls les souliers bougent ; garder `tapePied` à 0 pendant la marche.
- Le sac d'Emma disparaît de la main avant dès qu'elle tient un objet (`sacMain:'arriere'` pour le garder).

## Accessoires (sans tige : ils volent)
Appel `MER.nom(x, y, s, o)` → `r` (`r.pt('nom')` = point écran). Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`. Échelle 1 par défaut ; tailles ci-dessous à s = 1.

| Fonction | `(x,y)` = | Taille à s = 1 | Options |
|---|---|---|---|
| `MER.etoile` | centre | 173 × 150 (P5 : s 2,1 ≈ 360 px) | `branche` 0..3 (allume les branches l'une après l'autre, ordre défaut terre = bas-gauche, eau = bas-droite, airs = haut ; `ordre:['h','bg','bd']` pour changer) ; `halo` / `eclat` 0..1 (lueur + rayons qui tournent avec `t`) ; `plume:true` (version griffonnée) ; `encre` 0..1 (version tampon) ; `R` (longueur de branche, 100) ; points `centre haut bg bd` (bouts des branches, pour poser les icônes) |
| `MER.carte` | centre | 150 × 100 ; s 2,4 = 360 px | `etoile` 0..1 (étoile dorée qui « pop » au-dessus du toit) ; `face` `'image'`/`'adresse'` (lignes grises, timbre rose nu) ; `retourne` 0..1 (pivote, change de face à 0,5) ; `taille` (agrandit dans la main) ; point `etoile` |
| `MER.voiture` | sol, entre les roues | moderne 570 × 255 ; ancienne 540 × 370 | `couleur` `'vert'` `'ocre'` `'bleu'` `'bordeaux'` (ou #hex) ; `emblem` `'rien'` / `'etoile'` / `'lauriers'` ; `etoile` 0..1 (étoile du capot ×2 + halo, pour les mots-clés) ; `ancienne` true (1900 : capote, roues à rayons bois, radiateur laiton) ; `roule` = distance parcourue en px locaux (passer `x − x0` divisé par s) ; `dir` −1 = radiateur à gauche ; points `etoile` (moderne (262,−170), ancienne (266,−245) locaux), `avant`, `arriere` |
| `MER.maison` | sol | 134 × 132 (158 avec étoile) | `etoile` 0..1 (étoile au-dessus du toit), `halo` (0,6) |
| `MER.hautDeForme` | milieu du bas du bord | 104 × 106 | — ; point `dessus` |
| `MER.portrait` | centre du cadre | 200 × 250 (+ fil 25 au-dessus) | `ruban` 0..1 (crêpe noir qui se pose en travers du coin haut-gauche, cocarde à 1) ; points `coin`, `clou` |
| `MER.tampon` | dessous (pied) | 76 × 96 | — ; point `pied` |
| `MER.document` | centre | 130 × 170 | `etoile` 0..1 (étoile bleu nuit et or imprimée, petit rebond) ; `couche` 0..1 (feuille posée à plat : hauteur × 0,28) ; point `etoile` (0,48) |
| `MER.bulle` | centre du nuage | 360 × 260 | `gonfle` 0..1 (pop avec dépassement), `degonfle` 0..1 ; `queue` [dx,dy] locaux vers la tête du penseur (défaut [−120,200]) ; `contenu` `'usine'` `'terre'` `'eau'` `'airs'` `'moteur'` `'maison'` `'etoile'` `'carte'` `'voiture'` ; `contenuO` (options du contenu) ; `contenuS` (échelle, 0,95 défaut) ; respire avec `t` |
| `MER.usine` | sol | 200 × 210 | `fumee` 0..1 (1), `etoile` 0..1 (1, au faîte) ; `t` anime les fumées |
| `MER.icone` | centre | Ø 130 | `type` `'terre'` (butte verte + petite voiture ocre) / `'eau'` (barque + vagues en bandes bleues) / `'airs'` (zeppelin ivoire + nuages) ; `t` (vagues, roulis, dérive) |
| `MER.moteur` | sol | 270 × 190 | `marche` 0..1 (1) ; `tour` (rad, prioritaire sur `t`) ; pistons, volant et fumée animés par `t` |
| `MER.couronne` | centre | Ø 230 (+ nœud bordeaux en bas) | `taille` (×) |
| `MER.croquis` | centre | 200 × 165 | `dessin` `'etoile'` (défaut) / `'voiture'` / `'griffons'` ; `trace` 0..1 (le croquis se dessine) |
| `MER.chevalet` | sol | 240 × 470 | mêmes options que `croquis` (planche ×1,1 à 290 au-dessus du sol) |
| `MER.facture` | milieu de la barre du haut | 160 × (20 + 560·`deroule`) | `deroule` 0..1 (1) ; ondule avec `t` ; point `bas` |
| `MER.sac` | sol | 130 × 125 | `gonfle` 0..1 (1 ; largeur ×0,8 → ×1,12) ; `vide` 0..1 (s'affaisse, 6 pièces sautent par le col) ; point `bouche` |
| `MER.piedestal` | sol | 168 × 232 | — ; point `dessus` (0,−232). Carte posée dessus : `MER.carte(x, y − 232·sP − 50·sC, sC)` |
| `MER.plume` | prise | 60 × 190 | — ; point `pointe` (10,38) |
| `MER.mallette` | sol | 128 × 102 | — |

## Décors (pré-rendus par `MER.init()`)
| Clé | Pose | Repères utiles |
|---|---|---|
| `MER.K.salon` | `ctx.drawImage(MER.K.salon, 0, 0)` (plein écran) puis `MER.salonFumee(t)` | `MER.SALON` : fenêtre `{x0:712,x1:888,y0:452,y1:940}` (vue sur l'usine, cheminées `cheminees`) ; mur libre pour le portrait `portrait {x:480,y:520}` ; applique à gaz `{x:236,y:640}` ; lambris y > 990 |
| `MER.K.salonVieux` | idem (1900 : papier peint pâli, rectangle délavé derrière le portrait) | mêmes repères ; portrait à `MER.portrait(480, 520, 0.9, { ruban })` |
| `MER.K.avenue` | `ctx.drawImage(MER.K.avenue, 0, 0)` | `MER.AVENUE.vitrine {x0:250,x1:830,y0:650,y1:1300}` (vitrine vide), trottoir y 1312 ; arbre en bac x 962 |
| `MER.K.toile` | **`MER.toile(k, t, { ripple })`** (k 0 hors champ → 1 posée ; câbles jusqu'aux cintres) | toile crème → bleu pâle 1000 × 1300, centrée sur x 540 ; `ripple` = amplitude px de l'ondulation à l'arrivée |
Plancher : `M.drawFloor()` du kit, après le décor.

## Exemples d'appels qui marchent
Voir `<video>/casting/scene.js` (`grep -n 'MER\.' casting/scene.js`). Les plus utiles :
```js
// P2 : Daimler écrit au pupitre (dir −1), la plume touche la feuille
M.pou.pupitre(560, FEETB, 1, { plume: false, cast });
const r = MER.daimler({ t, ecrire: 1, face: { brow: 'up' } }, 700, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
// Emma tient la carte à deux mains, étoile révélée
MER.emma({ t, tenu: 'carte', tenuO: { etoile: 1 }, deuxMains: true, devant: 1 }, 190, FEET, 0.88, { dir: 1, slot: ST.slotF, cast });
// P1 : voiture verte moderne, étoile au bout du capot ≈ (338, 1210) ; r.pt('etoile') pour y poser la carte
const v = MER.voiture(600, FEETB, 1, { couleur: 'vert', emblem: 'etoile', etoile: k, dir: -1, t, cast });
// P4 : Adolf tamponne le document couché sur le pupitre
MER.document(700, 1092, 0.75, { couche: 1, etoile: smooth(t0, t0 + 0.15, t) });
MER.adolf({ t, tamponner: k }, 830, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
// P5 : étoile centrale qui s'allume branche par branche, icônes aux bouts des branches
const e = MER.etoile(540, 760, 2.1, { branche: 3 * u, halo: h, t, cast });
MER.icone(...e.pt('bg'), 1, { type: 'terre', t });
```
