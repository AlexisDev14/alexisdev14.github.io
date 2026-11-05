# persos.md — « La Cocotte-Minute, la marmite de Denis Papin » : mode d'emploi de `persos.js`

Espace de noms : `M.pap` (alias `PAP`, à déclarer dans scene.js : `const PAP = M.pap;`). Dans `S.init` : `PAP.init()` (pré-rendus `PAP.K` : cuisine, cadre, portraits `ombre`/`papin`, comptoir, basilic, tabouret ; atelier jour et misère, fourneau, table, coffre, seau, panier, tabouret).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle. Pieds sur la fente avant : `FEET = ST.slotF - 34` (1416).
Planche : `casting/scene.js` (une page par instant : 0 planche, 1 comparaisons, 2-3 Papin, 4 cuisinier, 5 savants, 6 bras 0→2,4 rad, 7 `M.ik`, 8 prises, 8,5 objets, 9 cuisine (toile 1), 9,2 toile à 0,15/0,4/0,65/1, 9,5 atelier, 9,97 vignettes).

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` pour la fente arrière)
Toujours par l'enveloppe `PAP.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`) : elle prépare la pose (gestes, objet tenu, seconde main). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale). **Toujours passer `t`** (marche, vissage, frottement, chaleur, écriture).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : `'os'` `'broc'` `'soupape'` `'fourchette'` `'pigeon'` `'verre'` `'cuillere'` `'bourse'` `'plume'` (| `'rien'`) ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'accessoire seul, ex. `{ mou: 1 }`, `{ filet: 1, filetY: 1180 }`).
- `droit` / `droitB` : `true` d'office dès qu'un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` / `ang.objetB` le tournent (rad).
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (os : bout arrière ; broc : sous le fond ; soupape : levier côté pivot). Mis d'office par `tenir` (os, broc, soupape) et `verser` (broc).
- `handF` / `handB` : `'fist'` | `'open'` (poing d'office quand la main tient) ; `face` : `{ brow, mouth, eyes }` (un geste ne remplit que les champs laissés vides) ; `ang`, `tilt`, `dx`, `dy` comme le kit.
- `cible` / `cibleB` : point **écran** `[X,Y]` (les gestes qui l'acceptent l'indiquent) ; l'enveloppe le convertit avec les mêmes `x, y, s, dir`.
- Point écran : `PAP.pt(r, 'nom')` (main arrière : `PAP.pt(r, 'nom', true)`) ; poing : `PAP.main(r)` / `PAP.main(r, true)`. Points : os `centre` `bout` `boutB` ; broc `bec` `fond` ; soupape `pivot` `clapet` `poids` ; fourchette `pointe` `bouchee` ; pigeon `centre` ; verre `bord` ; cuillere `bout` `haut` ; bourse `bouche` ; plume `bec`.
- Tous les gestes sont des réglages 0..1 lissés par `ease` : les faire varier avec `smooth(t0, t1, t)`. `marche: 1` = pas selon `t` (jambes, bras, sautillement).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `PAP.papin` (`C.papPapin`) | 0,9 ≈ 475 px (perruque comprise) | `perruque` (enfant de `head`), `parF`/`parB` (parements ocre), `objet` `doigts` `objetB` `doigtsB0` `doigtsB` | `tenir` (objet devant lui, bas, à deux mains) ; `verser` (bras tendu, objet incliné de +1 rad vers l'avant : broc → `tenuO.filet`) ; `visser` + `cible` (poing sur la vis, petit cercle selon `t`) + `cibleB` (main arrière ouverte, sur l'étrier) ; `recul` (sursaut : buste en arrière, mains ouvertes levées devant la tête, visage dégagé, yeux ronds, bouche « o ») ; `saut` (perruque soulevée de 16 et inclinée, reste accrochée : on voit le crâne rasé gris) ; `chaud` (main avant ouverte retirée près de l'épaule, tremble, yeux fermés, bouche « o ») ; `frotte` (se frotte les mains, sourire) ; `ecrire` + `cible` (le **bec** de la plume sur la cible, plume mise d'office, penchée vers l'avant, tête baissée ; avec `assis`) ; `bourse` (bourse vide **retournée**, tenue par le fond, ouverture en bas, l'autre main ouverte dessous, sourcils inquiets) ; `reclame` + `paume` (0 = main sur la poitrine → 1 = main ouverte vers l'avant, paume en l'air) ; `assis` ; `marche` |
| `PAP.papinDos` (`C.papPapinDos`) | 0,9 ≈ 475 px | `perruque` (masse de boucles vue de dos) | `marche` (selon `t`). Vu de DOS (sortie vers le fond : réduire `s` et monter `y` soi-même, `slot: ST.slotB`). `def.libre` pour les 4 membres : dessin de face, la convention de profil du contrôle ne s'applique pas |
| `PAP.cuisinier` (`C.papCuisinier`) | 0,9 ≈ 480 px | `tablier` (rayé ardoise/ivoire), mêmes pièces d'objet | `remue` + `cible` (cuillère en bois mise d'office ; le **bout** de la cuillère tourne sur la cible) ; `sursaut` (petit saut en arrière, buste penché en arrière, mains ouvertes levées devant la poitrine, yeux ronds) ; `epaules` (mains ouvertes basses devant, tête penchée, sourcils levés, bouche serrée) ; `presente` (bras avant tendu vers l'avant, paume en l'air, sourire, menton levé) ; `regarde` (tête levée vers le mur) ; `marche` |
| `PAP.savantA` (`C.papSavantA`) | **0,98** ≈ 515 px, mince | perruque grise longue à deux pointes, habit bordeaux | communes aux trois : `assis` ; `fourchette` + `pique` (0 = au-dessus, 1 = enfoncée) + `cible` (dents en bas, la **pointe** va sur la cible) ; `goute` (fourchette avec bouchée portée à la bouche, yeux fermés, sourire) ; `verre` (verre levé devant, au-dessus de la tête, sourire) ; `surpris` (sourcils levés, yeux ronds, bouche « o », mains ouvertes en avant ; debout il recule le buste) ; `marche` |
| `PAP.savantB` (`C.papSavantB`) | **0,8** ≈ 420 px, ventru | perruque blanche poudrée courte à rouleaux, habit vert éteint, joues roses | idem |
| `PAP.savantC` (`C.papSavantC`) | **0,88** ≈ 465 px | perruque noire bouclée, habit ocre, lunettes rondes | idem |

Pièges :
- `assis` descend le corps de 118 (unités) et pose d'office les mains ouvertes sur les cuisses (sauf si `ang.armB_up` / `ang.armF_up` est donné). Dessiner d'abord la chaise : `PAP.chaise(x, y, s, { dir })` avec **les mêmes** `x, y, s, dir`. Les jambes assises gardent la pointe des pieds vers l'avant.
- `cible` est en coordonnées écran : ne pas la convertir soi-même. Visser le digesteur : `cible: PAP.digPt('vis', dx, dy, ds, dig)`, `cibleB: PAP.digPt('etrier', dx, dy, ds, Object.assign({ dir: -1 }, dig))` (côté gauche de l'étrier, Papin à gauche regardant à droite ; `dir: 1` pour le côté droit). Vérifié page 9,5.
- La main levée près du visage le cache : `chaud`, `recul`, `goute`, `verre` sont réglés pour le laisser libre ; un `ang` ajouté à la main peut le recouvrir.
- `bourse` retourne la bourse d'office (`tenuO.retourne` 1) ; `tenu:'bourse'` seul = bourse pleine pendue au poing (`tenuO: { vide: false }`).
- Les trois savants ont chacun leur échelle par défaut (taille relative voulue) : ne pas forcer `s` identique.
- Le cuisinier n'a ni chapeau ni perruque ; Papin n'a jamais de chapeau.

### `bendSign` de `M.ik` (page 7 : deux bras, cibles haute et basse, aucune ligne « ATTENTION »)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Papin (`C.papPapin`) | 1 | 1 | 1 | 1 |
| Cuisinier (`C.papCuisinier`) | 1 | 1 | 1 | 1 |
| Savants A, B, C (même squelette ; testé sur C) | 1 | 1 | 1 | 1 |
Pour `M.ik`, préparer la pose par `PAP.papinPose(pose, x, y, s, dir)` (resp. `cuisinierPose`, `savantAPose`…), appliquer `sol.up/sol.lo`, puis `M.puppet(C.papPapin, q, x, y, s, o)`. Les gestes internes n'en ont pas besoin (IK propre, coude toujours vers l'avant). `handLen` = 100.

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), **`o.t`** (vapeur, tremblement). Renvoient `r` (`M.puppet`). Échelle par défaut 0,9 (même taille qu'en main) sauf digesteur et cocotte (1).

| Fonction | `(x,y)` = | Taille (échelle) | Options |
|---|---|---|---|
| `PAP.digesteur(x,y,s,o)` | bas des pieds (sur le fourneau : `PAP.AT.fourneau`) | 204 de haut × 160 (lugs), 187 avec le levier (1) | `vis` 0..1 (défaut 1 ; 0 = vis haute desserrée) ; `tourne` (rad, fait tourner le volant pendant `visser`) ; `ouvert` (couvercle ôté debout contre la marmite, étrier et vis retirés) ; `os` (os qui dépassent, seulement avec `ouvert`) + `mou` `fromage` (appliqués à ces os) ; `soupape` 0/1 (levier à pivot, clapet, poids rond en laiton — **pas avant le mot « soupape »**) ; `poids` 0..1 (0 = près du pivot, 1 = bout du levier ; défaut 0,7) ; `jet` 0..1 (volutes depuis la soupape, levier qui se soulève ; sans soupape et `ouvert` : vapeur de la marmite) ; `tremble` 0..1 ; `gonfle` 0..1 (panse bombée, couvercle soulevé de 8, fuites de vapeur au bord, lueurs de tension) ; `rouge` 0..1 (lueur de chaleur au bas) |
| `PAP.digPt(nom,x,y,s,o)` | — | — | point écran, mêmes `x,y,s,o` que le digesteur : `vis` (haut du volant, suit `vis`), `etrier` (côté +x ; `dir:-1` côté −x), `soupape` (sortie du jet), `poids` (suit `poids`), `couvercle`, `bouche` (ouverture), `anse` (oreille de l'étrier), `base` |
| `PAP.cocotte(x,y,s,o)` | fond (sur la plaque : `PAP.CUI.plaque`) | 186 × 216 avec poignées (1) | `siffle` 0..1 (la soupape noire tourne, jet de volutes, le corps tremble) ; `brille` 0..1 (halo et éclats en étoile) ; `vapeur` 0..1 (filet léger continu, ambiance) ; inox sans logo |
| `PAP.cocPt(nom,x,y,s,o)` | — | — | `soupape` (sommet de la soupape), `poignee` (+x), `poigneeB` (−x), `couvercle`, `base` |
| `PAP.os(x,y,s,o)` | centre | 150 × 30 local (135 px à 0,9) | `mou` 0..1 (l'os plie en arc, bouts qui tombent) ; `fromage` 0..1 (jaunit, petits trous) |
| `PAP.broc(x,y,s,o)` | fond | 122 × 110 local | `filet` 0..1 (filet vertical depuis le bec) ; `filetY` (y écran où il s'arrête) ; `liquide` (couleur) |
| `PAP.soupape(x,y,s,o)` | milieu du levier | 154 local | `poids` 0..1 ; `sens` ±1 (pivot à gauche par défaut). La même pièce que sur le digesteur (×0,72) |
| `PAP.fourchette` / `PAP.cuillere` | bout du manche / jonction manche-cuilleron | 132 / 144 local | fourchette `bouchee` (morceau de viande sur les dents) |
| `PAP.verre` / `PAP.pigeon` (rôti) / `PAP.plume` | pied / centre / prise | 82 / 104 / 137 local | verre `niveau` 0..1 (vin rouge) |
| `PAP.bourse(x,y,s,o)` | col noué | 72 local | `vide` (défaut true, plate et froissée) ; `retourne` 0..1 |
| `PAP.chaise(x,y,s,o)` | pieds du personnage assis | 322 local (290 px à 0,9) | `modele` `'haut'` (dossier de velours, défaut) / `'tabouret'` |
| `PAP.vapeur(t,o)` | dessin brut | — | volutes en boules (bords en arcs) pour plats fumants, tasse… : `{ x, y, k 0..1, haut, r, n, per, vent, seed }` |

## Décors (fonctions pures du temps ; `up` = décalage vers le haut, ≥ 1300 = disparu dans les cintres)
Ordre : `PAP.cuisine(t, up, o)` → `M.drawFloor()` → objets posés (cocotte) → marionnettes → `PAP.cuisineAvant(t, up, o)` → `M.stageLight` → `M.rideau(t)` → `M.drawFrame(t)`. Idem atelier (`PAP.atelier` … `PAP.atelierAvant`, puis `PAP.nuit` au plan 5).

| Appel | Options | Repères utiles (`PAP.CUI` / `PAP.AT`) |
|---|---|---|
| `PAP.cuisine(t, up, o)` — fond carrelé, fenêtre du soir (nuages, oiseaux, fenêtres qui s'allument), 2 voilages, lumière du soir qui scintille, horloge ronde sans chiffres (trotteuse), étagère de bocaux + livre sans titre, barre d'ustensiles, hotte inox, lampe suspendue qui se balance, cadre ovale doré, comptoir (meubles bleu ardoise, four, plaque noire, planche et carottes, moulin à poivre, corbeille de fruits, torchon à carreaux, pot d'ustensiles, huile) | `portrait` `'ombre'` (silhouette noire à longue perruque, défaut) / `'papin'` (Papin en couleurs — **pas avant P6 6,55 s**) ; `eclaire` 0..1 (lueur dorée) ; `toile` 0..1 (0→0,3 : un fil descend du coin haut gauche avec l'araignée ; 0,25→0,85 : toile rayonnante 9 rayons + spirale, fils ≈ 2,7 px gris clair à liseré sombre, couvre les deux tiers du cadre ; 0,55→1 : voile de poussière qui ternit l'or et le portrait ; revenir à 0 la replie vers le coin et l'efface ; test page 9,2) ; `lampe` 0..1 (s'allume : ampoule + cône) ; `chat` (instant de départ, s : le chat roux traverse le rebord de droite à gauche en 3,2 s) ; `cast` | plaque `{x:520, y:1176}` (fond de la cocotte) ; comptoir dessus y 1180 (x 40–1040) ; cadre `{x:300, y:520, rx:92, ry:114}` (intérieur 72 × 94) ; fenêtre x 750–910, y 300–760, rebord y 762 ; lampe `{x:690, y:572}` (bas de l'abat-jour) ; horloge `{x:150, y:470, r:46}` ; hotte bas y 740 (x 416–624) |
| `PAP.cuisineAvant(t, up, o)` | `tabouret` (true) | basilic en pot (x 120, sol 1590, frémit), tabouret (x 965, sol 1600) |
| `PAP.atelier(t, up, o)` — plâtre et poutres, fenêtre à losanges sur toits de Londres (fumées des cheminées), rayon de lumière et poussière, hotte de briques, étagères (cornue, ballon, fiole, alambic, globe céleste, livres, sablier), herbes pendues, coffre, fourneau de briques et foyer (flammes + lueur), soufflet, table de chêne (pompe à air sous cloche, mortier et pilon, livres, encrier et plume, chandelier qui brûle) | `misere` 0..1 (nuit, lune et étoiles, étagères vides et toiles, fourneau éteint avec cendre, une seule chandelle) ; `feu` 0..1 (défaut 1 − misere) ; `pigeon` (instant, s : un pigeon gris vole 1,3 s et se pose derrière les vitraux, en bas de la fenêtre, puis hoche la tête) ; `tinte` 0..1 (la fiole bleue de l'étagère basse oscille, plan 3) ; `cast` | fourneau dessus `{x:520, y:1228}` (pieds du digesteur, plateau x 382–658) ; foyer `{x:520, y:1380}` ; table dessus `{x:860, y:1180}` (x 735–985) ; chandelle (flamme) `{x:930, y:1092}` ; fenêtre x 236–374, y 334–596, rebord y 602 ; étagères y 520 et 720 (x 690–970) ; fiole qui tinte `{x:770, y:720}` ; bas de la hotte y 760 |
| `PAP.atelierAvant(t, up, o)` | — | seau d'eau (x 140, reflet animé), tabouret (x 270), panier d'os (x 920), sol ≈ 1590–1610 |
| `PAP.nuit(t, k, o)` | après les marionnettes (P5) : voile bleu nuit sur toute l'image, sauf un halo vacillant autour de la chandelle ; `o.x`, `o.y` (centre du halo, défaut la chandelle), `o.up` | — |

Plan 5 : le digesteur froid se pose au sol, ex. `PAP.digesteur(880, ST.back + 8, 0.8, { t, vis: 1 })` (sous la table). Zone des personnages (x 250–780, y 900–1430) : rien de chargé dans les deux fonds ; le fourneau et la cocotte y sont les objets clés.

## Exemples d'appels qui marchent (voir `grep -n 'PAP\.' casting/scene.js`)
```js
// P2/P3 : Papin visse le digesteur sur le fourneau
const dig = { t, vis: 0.6, soupape: 1, poids: 0.6, jet: 0.7, rouge: 0.4 }, F = PAP.AT.fourneau;
PAP.atelier(t, 0, { pigeon: 2.5 }); M.drawFloor(); PAP.digesteur(F.x, F.y, 1, dig);
PAP.papin({ t, visser: 1, cible: PAP.digPt('vis', F.x, F.y, 1, dig), cibleB: PAP.digPt('etrier', F.x, F.y, 1, Object.assign({ dir: -1 }, dig)) }, 330, FEET, 0.9, { dir: 1, cast });
PAP.atelierAvant(t, 0);
// P1/P6 : le cuisinier présente la cocotte, portrait éclairé
PAP.cuisine(t, 0, { portrait: 'papin', eclaire: 1, lampe: 1 }); M.drawFloor();
PAP.cocotte(PAP.CUI.plaque.x, PAP.CUI.plaque.y, 1, { t, vapeur: 1, brille: 1, cast });
PAP.cuisinier({ t, presente: 1 }, 300, FEET, 0.9, { dir: 1, cast }); PAP.cuisineAvant(t, 0);
// P4 : savant assis qui goûte (chaise d'abord, mêmes x, y, s, dir)
PAP.chaise(420, FEET, 0.8, { dir: 1 }); PAP.savantB({ t, assis: 1, goute: 1 }, 420, FEET, null, { dir: 1, cast });
```
