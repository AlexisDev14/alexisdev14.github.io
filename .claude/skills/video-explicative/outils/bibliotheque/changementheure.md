# persos.md — « Le changement d'heure, une blague de Franklin » : mode d'emploi de `persos.js`

Espace de noms : `M.hdh` (dans `scene.js` : `const HDH = M.hdh;`). Dans `S.init` : `HDH.init()` (pré-rendus `HDH.K` : chambre (toile, vue de Passy, meubles), chaise, mules, pot ; place (toile, mairie, kiosque, colonne, banc, arbre en caisse, réverbères gaz/électrique, seau de charbon, caisse)). Les lits se pré-rendent seuls au premier appel.
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle indiquée (planche `casting/`).
Planche `casting/scene.js` (page = instant) : 0 repos/objets · 1 comparaisons · 2 gestes de Franklin dir 1 (haut) / −1 (bas) · 3 gros plans visière/dépit + marche · 4 bras de 0 à 2,4 rad · 5 lits · 6 fenêtre, canon, réveil · 7 prises · 8 chambre nuit · 9 chambre jour + écriture · 9,5 place 1916 · 9,97 vignettes 264 × 470.

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `HDH.franklin(pose, x, y, s, o)` / `HDH.parisien(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale).

Options communes :
- `tenu` / `tenuB` : `'plume'` | `'lettre'` | `'bougie'` | `'piece'` | `'reveil'` (| `'rien'`) ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'accessoire seul) + `echelle` (défaut 1).
- `droit` / `droitB` : `true` d'office quand un objet est tenu (il reste droit à l'écran) ; `ang.objet` / `ang.objetB` le tournent. La **lettre** se dessine derrière l'avant-bras, la main sur son bord bas (doigts par-dessus) ; `deuxMains` : la main arrière vient sur son autre bord.
- Geste libre : `atteint` 0..1 + `cible` `[X,Y]` → le poing (ou le point `ptCible` de l'objet, défaut `'centre'`) va sur la cible ; `bras:'B'` = main arrière.
- `handF` / `handB` : `'fist'` | `'open'` | `'pince'` | `'visiere'` ; `face` : `{ brow, mouth, eyes }` ; **toujours passer `t`** (respiration, marche, écriture, bonnet).
- Point nommé de l'objet tenu : `HDH.pt(r, 'nom')` (main arrière : `HDH.pt(r, 'nom', true)`). Points : plume `pointe` (bec) `haut` `centre` ; lettre `centre` `haut` `bas` ; bougie `meche` `centre` `base` ; piece `centre` ; reveil `centre` `cloche` `base`.
- Tous les gestes sont des réglages 0..1 lissés par `ease` : les faire varier avec `smooth(t0, t1, t)`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `HDH.franklin` (`C.hdhFranklin`) | 0,9 ≈ 480 px debout (crâne compris), ventre ≈ 115 px de large ; robe à mi-mollet, bas blancs, mules | `pans` (bas de la robe), `cheveux`, `lunettes` | `lunettes` 0 sur le front / 1 sur le nez (défaut 1) ; `ecrire` + `cible` (le **bec** de la plume va sur la cible et griffonne selon `t` ; plume mise d'office, penchée vers l'avant ; tête baissée) ; `brandir` (plume levée devant lui au-dessus de la tête, sourire) ; `pincer` + `cible` (main avant en pince : le bout des doigts va sur la cible, ex. `HDH.accPt('bougie', …, 'meche')`) ; `bras` (bras en V, mains ouvertes, menton levé, sourire) ; `depit` (épaules basses, tête baissée, yeux fermés, main avant posée sur le front, coude devant) ; `plisse` (yeux plissés, sourcils froncés, **main ARRIÈRE en visière** : le bras passe derrière la tête, la main plate dépasse au-dessus des yeux, le visage reste dégagé) ; `marche` (jambes et bras selon `t`) ; `couche` / `assis` : seulement par `HDH.franklinLit` |
| `HDH.parisien` (`C.hdhParisien`) | 0,9 ≈ 470 px (bonnet retombant), ≈ 570 px bonnet dressé ; chemise de nuit aux chevilles, pieds nus | `bonnet` (calotte rayée), `pointe` (pointe du bonnet), `gland`, `moustache`, `pans` | `dresse` 0..1 (pointe du bonnet raide vers le haut ; mis d'office par `sursaut`) ; `dort` (yeux fermés, sourire béat, respire) ; `bras` + `cible` (main avant ouverte vers la cible) ; au lit seulement (par `HDH.dormeurLit`) : `sursaut` (s'assoit **en trois paliers**, yeux ronds, bouche « o », bonnet dressé), `tire` (les deux avant-bras ramènent la couverture au menton), `tourne` (se retourne face au matelas, dos au public ; passe par un écrasement ≥ 0,25), `couche`, `assis` |

Pièges : `couche`, `assis`, `sursaut`, `tire`, `tourne` plient les jambes et masquent les jambes : ne pas les passer à `HDH.franklin`/`HDH.parisien` debout (passer par les montages). `plisse` occupe la main arrière (`tenuB` ignoré pour la visière). `ecrire` sans `cible` vise devant la ceinture. Le Parisien a la bouche « o » d'office en `sursaut` : `face.mouth` pour la changer.

### `bendSign` de `M.ik` (pages 2 à 6, dir 1 et −1 : aucune ligne « ATTENTION coude / main derrière le dos / pied »)
| Personnage, geste | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Franklin `ecrire`, `brandir`, `pincer`, `depit`, `atteint` | 1 | 1 | — | — |
| Franklin `bras` (V) | 1 | 1 | 1 | 1 |
| Franklin `plisse` (visière, main arrière) | — | — | 1 | 1 |
| Parisien `bras` vers le réveil (couché), `tire`, accoudé à la fenêtre | 1 | 1 | 1 | 1 |
Réglables dans `HDH.BEND.franklin` / `HDH.BEND.parisien` ; pour un `M.ik` à la main : `M.ik(C.hdhFranklin, r.q, x, y, s, dir, 'armF', [X, Y], 1)`. Balayage épaule/coude 0 → −2,4 rad (page 4) : articulations rondes, rivet au centre.

## Montages au lit et à la fenêtre
| Fonction | `(x,y)`, échelle | Options |
|---|---|---|
| `HDH.franklinLit(t, x, y, s, o)` | sol au milieu du lit ; s 0,8 (défaut) : Franklin couché ≈ 425 px de long | `o.pose` (pose de Franklin : `couche` défaut 1, `assis` 0..1 (buste relevé, jambes sous l'édredon), `plisse`, `depit`, `bras`, `lunettes`, `face`…), `o.style` (`'baldaquin'`), `o.dir` (1 = tête du lit à gauche, il regarde vers +x assis), `o.couv` 0..1 (hauteur de l'édredon sur le buste ; défaut 0,82 couché → 0,08 assis), `o.fond:false` / `o.devant:false` (sauter une couche du lit), `o.cast`, `o.castPerso`. Couché : yeux fermés d'office. Renvoie `r` (`r.q`, `r.dessus` = contour de la couverture). Le bras avant passe par-dessus l'édredon dès qu'il est assis ou qu'un geste de bras est donné. |
| `HDH.dormeurLit(t, x, y, s, o)` | idem, s 0,8 (défaut), style `'mansarde'` | `o.pose` : `dort`, `sursaut`, `tire`, `tourne`, `bras` + `cible` (le bras sort de sous la couette ; ex. `cible: HDH.accPt('reveil', rx, ry, rs, {}, 'cloche')`), `couche` (défaut 1), `assis` ; `o.couv` (`tire` la monte d'office à 1) |
| `HDH.dormeurFenetre(t, x, y, s, o)` | `(x,y)` = milieu de l'appui ; s 0,6 (défaut) : baie 106 × 142 px dans un pan de façade 190 × 255 px | `o.pose` (pose du Parisien : `dort`, `dresse`, `bras` + `cible`, `face`…), `o.volets` 0 ouverts (rabattus contre le mur) → 1 fermés (deux battants verts), `o.accoude` 1 (avant-bras posés sur l'appui ; 0 = bras libres), `o.dir`. Géranium rouge sur l'appui. Le bonnet dressé est coupé par le haut de la baie. |

## Lits (sans tige)
`HDH.lit(t, x, y, s, o)` = `HDH.litFond` + `HDH.litDevant` sans occupant (édredon plat). `o.style` `'baldaquin'` | `'mansarde'`, `o.dir`, `o.cast`, `o.dessus` (contour de couverture, sinon plat). Point : `HDH.litPt(x, y, s, o, 'hanche' | 'oreiller' | 'pied' | 'matelas')`.
| Style | À s 0,8 | Repères locaux (`HDH.LIT`) |
|---|---|---|
| `baldaquin` (Franklin) : ciel de lit et rideaux vert sombre à franges ocre, édredon ivoire à fleurs fanées | ≈ 530 × 655 px (poteaux à ±318, ciel à −820) | dessus du matelas −190 ; hanche de l'occupant (−14, −236) ; oreiller vers x −220 |
| `mansarde` (Parisien) : lit de fer à boules de laiton, couette bleu ardoise, oreiller blanc | ≈ 450 × 330 px (tête −410, pied −330) | dessus du matelas −172 ; hanche (−4, −218) |

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad), `o.alpha`, `o.cast`, `o.ombre`, `o.t` (**obligatoire** pour la flamme et la fumée : temps du plan). Point écran d'un accessoire posé : `HDH.accPt(nom, x, y, s, o, 'point')` (mêmes `x, y, s, o`).
| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `HDH.plume(x,y,s,o)` | prise (milieu du tuyau) | 190 px de long (bec en bas devant, barbes en haut derrière) | points `pointe`, `haut` |
| `HDH.lettre(x,y,s,o)` | centre | 144 × 188 px ouverte (croquis : soleil, bougie barrée de deux vagues rouges, lignes ondulées) ; 100 × 64 pliée | `plie` 0 ouverte → 0,5 pliée en deux (dos) → 1 paquet cacheté de rouge. Pour l'envoi : `M.envoi(…, draw: (x, y, a) => HDH.lettre(x, y, 0.8, { plie: 1, rot: a }))` |
| `HDH.bougie(x,y,s,o)` | dessous du plateau | plateau 116 px ; chandelle 20 → 124 px ; total ≈ 210 px avec la flamme | `haut` 0..1 (longueur de la chandelle, défaut 1), `flamme` 0..1 (taille ; 0 = éteinte), `fumee` 0..1 (filet après extinction), `lueur` (true) ; point `meche` |
| `HDH.piece(x,y,s,o)` | centre | Ø 68 px, soleil en relief | `tranche` 0..1 (1 = vue de profil, pour la faire tourner) ; tenue par la tranche |
| `HDH.canon(x,y,s,o)` | sol sous la roue | ≈ 270 × 190 px, tube à 39° vers le ciel (vers +x ; `dir:-1` le retourne) | `tire` 0..1 : recul de 14 px (0 → 0,12) puis **une seule bouffée de fumée** qui sort de la bouche et monte (aucun projectile, aucune flamme) ; point `bouche` |
| `HDH.reveil(x,y,s,o)` | sous les pieds | ≈ 215 px de haut, boîtier rouge Ø 152, **cadran Ø 128 px** à traits | `heure` (nombre, défaut 7), `sonne` 0..1 (tremble, marteau qui bat selon `t`) ; points `centre`, `cloche` |
| `HDH.horloge(t,x,y,s,o)` | centre du cadran | **cadran Ø 340 px**, cadre doré Ø 376 ; 12 traits (plus forts à 12/3/6/9), aiguilles noires ouvragées (grande 146, petite 100) | `heure` (2.0 = deux heures ; la grande aiguille fait un tour par heure), `secoue` 0..1 (tremblement), `cadre` (true). Déjà dessinée par `HDH.place` |
| `HDH.horlogePt(nom, o)` | — | — | `nom` `'aiguille'` (bout de la grande), `'petite'`, `'centre'` ; `o` : `{ heure, x, y, s, up }` (défaut : horloge de la place, x 540, y 560, s 1). Passer la même `heure` que `HDH.place` |
| `HDH.pigeon(x,y,s,o)` | pattes | ≈ 60 px | `vol` (1 = ailes qui battent), `dir`, `t` |

## Décors (pré-rendus par `HDH.init()` ; `up` = décalage vers le haut en px, 0 = en place)
| Appel | Options | Repères utiles (`HDH.CHAMBRE`, `HDH.PLACE`) |
|---|---|---|
| `HDH.chambre(t, up, o)` — Passy 1784 : boiseries vert-de-gris à moulures dorées, papier peint à feuillages, bibliothèque, fenêtre à petits carreaux, lit à baldaquin (avec Franklin si `o.franklin`), chevet + bougie, secrétaire (encrier, plumes, papier, globe), bibliothèque basse + harmonica de verre, portrait ovale, pendule, échiquier sur guéridon, chaise cannée, pot de chambre, mules. Animé : pendule, flamme, 2 voilages, nuages et fumée derrière la vitre, poussière dans le rayon de soleil. | `lumiere` 0 nuit bleu lune → 1 plein soleil ; `soleil` 0..1 (le soleil monte derrière la colline ; défaut = `lumiere`) ; `volets` 0 ouverts → 1 fermés ; `franklin` = pose au lit (ex. `{ couche: 1 }`, `{ assis: 1, plisse: 1 }` ; `null` = lit vide) ; `couv` ; `bougie` (haut, défaut 0,7) ; `flamme` (défaut : baisse de 1 à 0,3 avec la lumière) ; `mules` (true ; `false` quand Franklin est debout) ; `lit:false` ; événements `chat` 0..1 (le chat s'étire sur l'appui, `null` = pas de chat) et `pigeon` 0..1 (0–0,35 arrive, posé, > 0,75 repart, derrière la vitre). Renvoie `r` de Franklin au lit. **La nuit teinte tout ce que dessine `HDH.chambre`, pas les marionnettes dessinées après.** | fenêtre `x 708–892, y 362–888`, appui `(800, 896)` ; lit `{x:424, y:1395, s:0.8, dir:1}` (de x ≈ 160 à 690, ciel à y 739, matelas à y 1243), hanche de Franklin couché ≈ (413, 1206), visage ≈ (220, 1185) ; chevet dessus `(124, 1252)`, mèche de la bougie ≈ (132, 1162) ; secrétaire `x 704–896`, plateau y 1150, **papier `(762, 1144)`** (cible d'`ecrire`, Franklin à x 660 dir 1, s 0,9), encrier `(866, 1140)` ; pendule (haut du boîtier) `(516, 250)` ; portrait `(372, 600)` ; guéridon `(940, 1244)` ; chaise x 806 ; zone libre debout x 560–700 |
| `HDH.chambreSol(t, o)` | `lumiere` | tapis rouge à franges y 1400–1441, x 230–790 : **après `M.drawFloor()`**, avant les marionnettes |
| `HDH.place(t, up, o)` — place à l'horloge : ciel gris-bleu, ville lointaine (clochers, cheminées d'usine qui fument), pavés ; mairie de pierre ocre (horloge au fronton, oculus du balancier, balcon à balustres, porte cintrée, ailes à fenêtres hautes et toits d'ardoise) ; kiosque vert à affiches, colonne d'affiches, banc de fonte, réverbère, deux orangers en caisse, caisse de bois. Animé : fumées, vol d'oiseaux, pigeons qui hochent la tête sur le fronton, balancier, passants au fond, orangers qui se balancent, drapeaux. | `epoque` 1916 (réverbère à gaz) \| 1976 \| 2019 (électrique ; couleurs des affiches) ; `heure` (défaut 2) ; `secoue` ; `drapeaux` 0..1 (deux drapeaux européens montent sur leurs hampes au balcon et ondulent) ; `charbon` 0..1 (seau de charbonnier qui apparaît avec un rebond) ; événements `feuille` 0..1 (feuille morte qui tombe sur le banc) et `pigeon` 0..1 (se pose sur le bout de la grande aiguille entre 0,35 et 0,75 puis s'envole) | cadran centre `(540, 560)`, rayon 170 (bout de la grande aiguille : `HDH.horlogePt('aiguille', { heure })`, à 146 px du centre) ; oculus du balancier `(540, 808)` ; balcon y 930 (balustrade 860–912), x 296–784 ; porte x 478–602, haut y 1164 ; **banc** x 176–424, assise y 1257 (chapeau de Willett ≈ `(330, 1257)`) ; kiosque x 140 ; colonne x 968 ; réverbère x 846 (lanterne y ≈ 790) ; orangers x 458 et 622 ; seau de charbon `(724, 1395)`, caisse `(784, 1395)` ; hampes des drapeaux x 292 et 788 (haut y 644) ; zone libre x 250–800, y 940–1395 |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'HDH\.' casting/scene.js`).
```js
// plan 1 : chambre la nuit, Franklin endormi ; à l'aube il s'assoit et plisse les yeux au soleil
HDH.chambre(t, 0, { lumiere: L, volets: 0, franklin: { couche: 1, assis: smooth(4, 5, t), plisse: smooth(5, 5.6, t) }, chat: smooth(1.5, 3.5, t) });
M.drawFloor(); HDH.chambreSol(t, { lumiere: L });
// plan 2 : Franklin écrit au secrétaire
const CHB = HDH.CHAMBRE;
HDH.chambre(t, 0, { lumiere: 1, mules: false });  M.drawFloor(); HDH.chambreSol(t, { lumiere: 1 });
const r = HDH.franklin({ t, ecrire: 1, cible: [CHB.secretaire.papier.x, CHB.secretaire.papier.y] }, 660, FEET, 0.9, { dir: 1, cast });
// plan 6 : le Parisien tend le bras vers le réveil posé sur la table de chevet
HDH.reveil(250, 1250, 0.9, { heure: 7, t });
HDH.dormeurLit(t, 560, 1395, 0.85, { dir: 1, pose: { bras: smooth(3, 3.6, t), cible: HDH.accPt('reveil', 250, 1250, 0.9, {}, 'cloche') } });
// plans 4–5 : la place, pigeon sur l'aiguille
HDH.place(t, 0, { epoque: 2019, heure: h, drapeaux: smooth(6, 7, t), pigeon: u });  const P = HDH.horlogePt('aiguille', { heure: h });
```
