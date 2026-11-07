# persos.md — « Le papillon, la nage née d'un règlement flou » : mode d'emploi de `persos.js`

Espace de noms : `M.pap2` (dans `scene.js` : `const PAP2 = M.pap2;`). Dans `S.init` : `PAP2.init()` (pré-rendus `PAP2.K` : `pmCiel pmFond pmMilieu b30Dehors b30Fond b30Milieu sbFond sbMilieu`).
Repères : marionnette debout `(x,y)` = pieds ; **nageur `(x,y)` = sa TAILLE posée sur la surface de son couloir** ; objet : point indiqué. Tailles en px **à l'écran**, à l'échelle conseillée (calculées d'après le code et vues sur la planche).

## L'eau et les couloirs (lire d'abord)
`PAP2.EAU = { loin: 1112, fond: 1150, milieu: 1248, devant: 1345, bas: 1492 }` (y écran des surfaces) ; échelles conseillées `PAP2.ECH = { fond: 0.8, milieu: 0.9, devant: 1.0 }`.
Lignes de nage par défaut y 1128, 1211, 1308, 1405 (bouchons de liège rouge/ivoire en `'1930'`, `'1936'`, `'1952'` ; flotteurs bleu/jaune en `'moderne'`).
**Ordre de dessin obligatoire** (chaque bande d'eau cache le bas du corps des nageurs dessinés AVANT elle) :
```js
PAP2.piscineModerne(t, 0, o);   // ou bassin1930 / stadeBerlin : toile + plan intermédiaire + animations
M.drawFloor();
PAP2.eau(t, { couche: 'arriere', epoque: 'moderne', x1: 740 });              // fond du bassin + plage au-delà de x1
const a = PAP2.nageurModerne({ t, qui: 'crawl', nage: 'crawl' }, 300, 'fond');
PAP2.eau(t, { couche: 'fond', epoque: 'moderne', x1: 740, sillages: [a] }); // bande du couloir du fond (+ écume/gerbes de a)
const b = PAP2.nageurModerne({ t, qui: 'papillon', nage: 'papillon' }, 480, 'milieu');
PAP2.eau(t, { couche: 'milieu', epoque: 'moderne', x1: 740, sillages: [b] });
const c = PAP2.nageurModerne({ t, qui: 'brasse', nage: 'brasse' }, 620, 'devant');
PAP2.eau(t, { couche: 'devant', epoque: 'moderne', x1: 740, sillages: [c] });  // + margelle avant (y 1486–1502)
// personnages de la plage (x > x1, pieds FEET = 1416) : officiels, grenouille ; puis PAP2.<décor>(t, 0, { avant: true }) ; effets ; stageLight ; rideau ; cadre
```
`PAP2.eau(t, o)` : `couche` `'arriere'|'fond'|'milieu'|'devant'` ; `epoque` ; `x0` (défaut 30), `x1` (défaut 1050) : bords du bassin, **plage carrelée/dallée au-delà** (bord vertical dessiné) ; `couloirs` [y…] (lignes de nage ; chaque bande ne dessine que celles de sa tranche) ; `lignes:false` ; `sillages` [r…] ; `up`.
Placer un nageur : `PAP2.nageurModerne(pose, x, 'milieu')` (le 3e argument = nom de couloir ou un y quelconque ; l'échelle par défaut suit `ECH`). Un couloir ne lit bien qu'un ou deux nageurs : écarts ≥ 250 px en x dans un même couloir, x conseillés 150–900. Les jambes sont coupées sous `EAU.bas` (`o.clipBas` pour un autre fond) ; la tige plonge dans l'eau (`slot` = `EAU.bas`).
`PAP2.eclabousse(t, x, y, t0, o)` : gerbe de gouttes de papier lancée à `t0` depuis `(x, y)` (0,95 s) ; `o.s`, `n` (12), `haut` (1), `dir` (−1..1 biais), `seed`, `dur`. À dessiner après la bande du couloir.
`PAP2.sillage(r, t)` : écume à la taille + gerbes aux mains qui traversent la surface (même chose que `sillages:`).

## Nageurs (avec tige ; dans l'eau jusqu'à la taille)
`PAP2.nageurModerne / brasseur / volant (pose, x, couloir|y, s, o)` → `r` (`r.w('pièce', x, y)`, `r.main`, `r.mainB`, `r.tete`, `r.surf`, `r.q`). `o.dir` ±1, `o.cast`, `o.clipBas`, `o.slot`.
Pièces : `torso head coiffe lunettes armF_up armF_lo armB_up armB_lo legF_up legF_lo legB_up legB_lo trace`. `ang` = décalages AJOUTÉS après les gestes.
**Chaque geste est un poids 0..1** (1 = pose complète ; on passe de l'un à l'autre en croisant les poids) ; `nage:'papillon'` = raccourci de `papillon:1`.
- Nages (avec `phase` 0..1, sinon cycle sur le temps global ; `phaseDecal` pour désynchroniser) :
  `papillon` (alias `vole`) : **les deux bras ensemble** ; 0 entrée des mains devant (corps bas, visage vers l'eau) · 0,2 traction sous l'eau · 0,38 sortie des mains aux hanches · **0,5 ailes déployées** (bras en V au-dessus, corps au plus haut, bouche « o ») · 0,75 bras qui passent par-dessus vers l'avant · 1 = 0. Arcs de vitesse ivoire derrière les mains (`trace:false` les retire), `ecart` (0,85 : écart des deux bras en l'air, 0 = superposés).
  `crawl` : un bras à la fois (moulinet alterné), corps à plat, tête qui se tourne pour respirer (bouche « o » vers 0,6–0,8).
  `dos` : couché sur le dos (penché en arrière), visage vers le haut, bras alternés qui repassent au-dessus de la tête.
  `brasse` : penché en avant, **bras sous la surface** (invisibles derrière la bande), menton haut, visage digne (`digne:false` pour l'enlever).
- Gestes debout dans l'eau : `attente` (avant-bras posés sur l'eau devant, lunettes sur le front), `joie` (bras en V, menton levé, yeux plissés, petits bonds), `salut` (bras levé main ouverte qui s'agite), `stupeur` (recule, mains ouvertes devant la poitrine, yeux ronds, bouche « o »), `sourire`, `regardeVoisin` (tête un peu baissée, regard en coin vers l'arrière, `regard:'avant'` pour l'autre côté), `seGratteTete` (main ARRIÈRE sur le haut du crâne, passe derrière la tête : le visage reste libre), `debout` (poings à la taille, à la surface), `brasseJambes` (repos : bras qui godillent, léger bob).
- `face` `{ brow, mouth, eyes }`, `regard` `'avant'|'arriere'|'haut'|'bas'`, `lunettes` `'yeux'|'front'` (modernes), `handF/handB`, `atteint` + `cible` [X,Y] (+ `bras:'B'`, `bendSign`).

| Fonction | Échelle, taille | Identités (couleur entière) | Gestes prévus |
|---|---|---|---|
| `PAP2.nageurModerne` (`pose.qui`) | `ECH` du couloir ; buste ≈ 286 px à 1,0 (257 à 0,9, 229 à 0,8), ≈ 390 px bras levés | `qui` `'crawl'` bonnet bleu #3d5a80 · `'dos'` vert #5f7a4a · `'brasse'` ocre #c49a3c · `'papillon'` rouge sang #8e2c2c (slip de la couleur du bonnet, lunettes, 4 nez et 4 teints) | `nage` = son `qui` par défaut ; `attente`, `joie`… |
| `PAP2.brasseur` (`pose.tenue`) | idem | `'a'` maillot une-pièce rayé ivoire/bleu nuit, cheveux noirs plaqués raie au milieu · `'b'` rayé ivoire/rouge sang, cheveux châtains, nez busqué · `'c'` uni vert éteint + bonnet blanc à jugulaire, moustache rousse ; tous moustache en guidon | `brasse`, `debout`, `stupeur`, `regardeVoisin`, `seGratteTete` |
| `PAP2.volant` (`pose.qui`) | idem | `'myers'` maillot bleu nuit uni, cheveux bruns plaqués raie de côté, rasé · `'higgins'` bonnet blanc lisse, maillot ivoire liseré bleu nuit · `'p1952'` bonnet et maillot rouge sang | **`vole:1` par défaut** si aucun geste n'est donné ; `brasseJambes`, `sourire`, `salut` |

`def.libre` (jambes) : jambes toujours sous l'eau, battements de brasse/dauphin hors convention du pied. Pendant `papillon/crawl/dos/brasse` l'enveloppe met d'elle-même `pose.libre = {armF, armB}` : en nage, le bras tourne en moulinet complet et passe derrière l'épaule (c'est le geste). Hors nages, bras contrôlés normalement.
Pièges : l'enveloppe bascule le corps autour de la TAILLE (`tilt`) : ne pas ajouter de `tilt` sur une nage. Un `dy` négatif fait sortir le nageur de l'eau (p1952 qui jaillit : `dy` −150…). Higgins (blanc) se lit mal devant les gradins clairs de Berlin : le mettre au couloir `devant`, ou devant un mât. Le buste (≈ 286 px à 1,0) est plus petit que les 360 px de la fiche : pour un gros plan, `s` 1,15–1,25 au couloir `devant`.

## Officiels (debout, avec tige ; `slot: ST.slotF` par défaut)
`PAP2.officiel(pose, x, y, s, o)` (`pose.qui` `'chef'|'b'|'c'`) → `r` (`r.main`, `r.mainB`, `r.tete`, `PAP2.pt(r, nom, arriere)`). Pièces : `torso head armF_up armF_lo armB_up armB_lo legF_up legF_lo legB_up legB_lo` (+ `canotier` chef, `casquette` c ; objets `objet objetB objetBF`).
- `tenu` / `tenuB` : `'reglement'`, `'chrono'`, `'tampon'` ; `tenuO` / `tenuBO` = options de l'objet (+ `echelle`) ; objet droit à l'écran par défaut (`droit:false` pour qu'il suive l'avant-bras) ; `deuxMains` (règlement : la main arrière se pose d'elle-même sur le bord bas gauche).
- Gestes (0..1) : `chrono` (lève le chronomètre devant, sous le menton ; cordon depuis le cou ; le chef le porte au cou sinon, `chronoCou:false` pour l'enlever) · `lit` (règlement ouvert tenu à deux mains par le bord bas, devant la poitrine, haut du livre sous le menton, tête penchée vers lui) · `feuillette` (livre dans la main arrière, dessiné devant le torse ; la main avant suit le coin de la page qui tourne ; `page` 0..1 sinon cycle) · `haussement` (avant-bras en avant, mains ouvertes, sourcils levés) · `hesite` (poing au menton, regard en l'air) · `dort` (tête tombée, yeux clos, souffle lent) · `tampon` (livre à plat sur la paume arrière, tampon frappé dessus ; `coup` 0..1 = phase, sinon 1,1 coup/s ; `r.q._frappe` = 1 à l'impact ; marque rouge : `tenuBO:{ marque: 1 }`) · `assis` (sur sa chaise de jury dessinée d'office, `chaise:false` pour l'enlever ; `toile` 0..1 = toile d'araignée sur la chaise) · `atteint` + `cible`.
- `face`, `regard`, `handF/handB`, `t`.

| Fonction | Échelle, taille | Tête et tenue |
|---|---|---|
| `qui:'chef'` | 0,9 ≈ 485 px (canotier) | trapu, ventre rond ; canotier de paille à ruban bleu nuit, moustache grise en brosse tombante, lunettes rondes d'acier ; blazer bleu nuit à liseré ivoire et boutons d'or, flanelle blanche, guêtres ivoire, chaussures brunes ; chronomètre au cou |
| `qui:'b'` | 0,9 ≈ 500 px (le plus grand, mince) | crâne chauve qui brille, couronne et grands favoris blancs rejoints à la moustache ; blazer bordeaux à rayures ivoire, nœud papillon noir, flanelle grise |
| `qui:'c'` | 0,9 ≈ 475 px | casquette plate de tweed, petite barbiche grise, nez retroussé ; blazer vert éteint, cravate ocre, pochette ocre, pantalon ivoire |

Comparés sur la planche au directeur, au concierge et à Naismith de `basket.js` : silhouettes et coiffes différentes ; seul le bleu nuit du chef rappelle la redingote du directeur (lui : redingote longue, tête nue ; le chef : blazer court, canotier, pantalon blanc).

## Grenouille (avec tige ; `def.libre` : animal, membres hors convention)
`PAP2.grenouille(pose, x, y, s, o)` : `(x,y)` = sous le séant ; 0,85 ≈ 144 px de haut (yeux), ≈ 130 px de long. `r.tete` = haut de la tête (y poser le papillon du kit). Pièces : `corps tete oeilF oeilB armF_up armF_lo armB_up armB_lo legF_up legF_lo legF_pied legB_up legB_lo legB_pied bulle`.
Gestes (0..1) : `fiere` (torse bombé, menton haut, pattes avant repliées, sourire satisfait, paupières mi-closes) · `brasse` (+ `phase` : bras et pattes symétriques, détente des pattes et petit saut) · `stupeur` (yeux exorbités, bouche ronde, mains levées) · `dort` (yeux clos, bulle de souffle qui gonfle et dégonfle, sans texte) · `boude` (tête basse, bouche tombante, paupières mi-closes) · `regardeHaut` (tête renversée, pupilles en haut). `regard`, `face.mouth` `'n'|'o'|'smile'|'down'`.
`bouee:'1930'|'moderne'` : assise sur une bouée couchée qui flotte (`y` = surface d'un couloir, ex. `EAU.devant`) ; sur la plage : `y = FEET`, x au-delà de `x1`.

## Accessoires (sans tige)
| Fonction | `(x,y)` = | Taille | Options |
|---|---|---|---|
| `PAP2.reglement(x,y,s,o)` | bas du livre (`centre:true` → centre) | ouvert 216 × 148 (+ ruban 30) à s 1 ; fermé 108 × 148 ; tenu (s 0,9) ≈ 194 px | `ouvert` 0..1 (plat avant qui tourne) ; `page` 0..1 (une page tourne, droite → gauche) ; `nouvellePage` 0..1 (le blanc de la page droite se remplit, de haut en bas, du dessin d'un nageur bras au-dessus de l'eau) ; `marque` 0..1 (cachet rouge ovale) ; `aPlat` 0..1 (vu à plat) ; `rot`, `dir`. Page gauche : lignes ondulées + petit nageur de brasse ; page droite : lignes en haut, **moitié basse blanche**. Points : `PAP2.reglementPt(nom, x,y,s,o)` / `PAP2.pt(r, nom)` : `centre haut bas pageG pageD blanc dessus` |
| `PAP2.chrono` | centre du boîtier | ø 48 (anneau à −38) | `marche:false` (aiguille arrêtée) ; points `centre anneau` |
| `PAP2.tampon` | dessous du caoutchouc | 48 × 82 | points `base pommeau` |
| `PAP2.bouee` | centre | debout ø 80 ; `couche:true` 124 × 30 | `epoque` `'moderne'` (orange/gris) \| `'1930'` (liège rouge/ivoire) ; `moitie` `'avant'|'arriere'` |
| `PAP2.chaise` | sol, milieu | 88 × 250 (assise à 110) | `toile` 0..1 |
Options communes : `dir`, `rot`, `alpha`, `cast`, `ombre`, `t`.

## Décors (pré-rendus par `PAP2.init()`, animations en temps global)
`PAP2.<décor>(t, up, o)` dessine toile + plan intermédiaire + animations (AVANT `M.drawFloor()`) ; `PAP2.<décor>(t, up, { avant: true, … })` dessine le premier plan, APRÈS les marionnettes. `up` = décalage vertical (décor qui monte).

| Décor | Repères (à `up` = 0) | Options (événements 0..1) |
|---|---|---|
| `piscineModerne` (P1, P6) | verrière en arc x 85–995, y 290–760 (nuages derrière les vitres) ; mur de carreaux bleu clair ; gradins à spectateurs colorés y 860–1100, x 200–900 ; horloge-chronomètre `PAP2.PISCINE.horloge` (850, 600) r 64 ; plongeoir x 60–300 (plate-forme y 706, tremplin y 890) ; guirlandes de fanions y 660–690 ; projecteurs x 300/540/780 (y 300) ; plots de départ x 930–1000. Avant : échelle chromée x 150–232, banc + serviettes x 860–1010 (y 1460–1560), bouée (1012, 1470), planche (110, 1500) | `leve` (un spectateur se lève, bras en l'air ; `leveIdx` en choisit un autre), `serviette` (avec `avant` : la serviette du haut glisse et tombe), `horlogeDt`, `papillonLoin` (papillons du kit sous la verrière) |
| `bassin1930` (P2, P3) | briques, galerie à balustres y 150–500 ; fenêtres cintrées x 140–320 et 520–700 (y 540–1000) avec rayons et poussière ; pendule (420, 560) ; lampes globes x 330/740 (pendues à y 500, globe y ≈ 710) ; cabines x 748–880 et 890–1022 (y 800–1112, rideaux rayés rouge/ivoire) ; radiateur (612, 1040) qui fume ; bouée de liège (818, 640) ; perche x ≈ 380 ; banc x 150–330. Avant : échelle de bois x 150–210, seau (930, 1530), patère x 1000 | `rideau` (le rideau de la 1re cabine s'ouvre), `lampe` (la lampe de droite se balance), `horlogeDt` |
| `stadeBerlin` (P4, P5) | ciel, nuages, oiseaux ; gradins de pierre en arc y 640–1100 (spectateurs y 742–992, canotiers et chapeaux) ; tour d'horloge x 815–945 (cadran (880, 470) r 44) ; mâts x 170/360/560/740 à fanions unis ocre/vert/ivoire/bleu (y 438–484, vers +x) ; plongeoir de béton x 56–250 (plates-formes y 628 et 820) ; plots x 935–1010. Avant : bacs de lauriers x 108 et 975 ; `jury` (x, défaut 790) : table drapée bleu nuit, dessus y 1300, ± 150 | `canotier` (un canotier s'envole des gradins vers la droite), `leve`, `horlogeDt` ; **`epoque:'1952'` + `temps` 0..1** : gradins qui se vident (vides vers 0,85), saisons (`temps`·2,5 cycles : été soleil → automne feuilles → hiver neige → printemps ; ou `saison` imposée), mâts nus de 0,12 à 0,88 puis fanions neufs, aiguilles qui filent, toile d'araignée sur la table du jury (avec `avant`) |

## bendSign de `M.ik` (vérifié : dernière planche sans aucune ligne ATTENTION, gestes dans les deux directions)
| Personnage | bras avant dir 1 | bras avant dir −1 | bras arrière dir 1 | bras arrière dir −1 |
|---|---|---|---|---|
| Officiels (chef, b, c) | 1 | 1 | 1 (−1 si la main est sous l'épaule et derrière : l'enveloppe choisit seule pour le règlement) | idem |
| Nageurs (hors nages) | 1 | 1 | 1 | 1 |
| Grenouille | `def.libre` (pas d'IK utile) | | | |
L'option `atteint` + `cible` passe `pose.bendSign` (défaut 1).

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'PAP2\.' casting/scene.js`).
```js
PAP2.officiel({ t, qui: 'chef', lit: 1, tenuO: { nouvellePage: k } }, 820, FEET, 0.9, { dir: -1, cast });     // lit le règlement, la page se remplit
PAP2.volant({ t, qui: 'myers', phase: 0.5 }, 420, 'milieu');                                                    // ailes déployées
PAP2.stadeBerlin(t, 0, { epoque: '1952', temps: u }); /* … */ PAP2.stadeBerlin(t, 0, { avant: true, epoque: '1952', temps: u, jury: 790 });
```
