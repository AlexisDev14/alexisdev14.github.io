# persos.md — « La statue de la Liberté, le cadeau sans socle » : mode d'emploi de `persos.js`

Espace de noms : `M.lib` (dans `scene.js` : `const LIB = M.lib;`). Dans `S.init` : `LIB.init()` (pré-rendus `LIB.K` : atelier (vue, fond, milieu, devant), port (ciel + Manhattan, îles fond/centre, socles fond/centre, Isère, quai, flèche de grue)).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle indiquée (mesurées sur `casting/`).
Planche `casting/scene.js` (page = instant) : 0 repos (haut) / marche dir −1 (bas) + objets seuls · 1 comparaisons · 2 Bartholdi · 3 Eiffel · 4 Pulitzer + `M.ik` des trois autres (bas) · 5–6 Oncle Sam · 7 bras pliés à fond, balayage 0 → 2,4 · 8 statue 0/0,5/1, tête, bras, sous · 8,5 morceaux et caisses · 9,07 prises dir 1 · 9,3 prises dir −1 · 9,5 atelier · 9,7 port fond · 9,87 port centre · 9,97 vignettes de téléphone. Rendu : 0 ligne « ATTENTION ».

## Marionnettes (avec tige ; `slot: ST.slotF` par défaut, passer `ST.slotB` au fond)
Toujours par l'enveloppe `LIB.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`, `o.rod`). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale, à passer à `M.ik`). `LIB.nom.pose(pose)` = pose finale sans dessiner (les `cible` n'y sont pas converties).
Options communes :
- `tenu` / `tenuB` : `'maillet'` | `'sou'` | `'monnaie'` | `'bourse'` | `'journal'` | `'plan'` | `'pinceau'` | `'seau'` | `'chapeau'` (| `'rien'`) ; `tenuO` / `tenuBO` : options de l'objet (les mêmes que l'objet seul) + `echelle` (défaut 1 ; 1,4 pour le sou du gag).
- `droit` / `droitB` : `true` d'office dès qu'un objet est tenu (il reste droit à l'écran) ; `ang.objet` / `ang.objetB` le tournent (rad).
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise (pinceau, plan, journal). Mis d'office par `pinceau` et `plan`.
- `brasBDevant` : le bras arrière est dessiné devant le corps (mis d'office par `compte`).
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` (un geste ne remplace jamais une valeur donnée) ; **toujours passer `t`** (marche, tapotement, hochement, papillon).
- `marche` 0..1 (ou `true`) : jambes en opposition ± 0,34 rad, bras ± 0,13, petit rebond, selon `t` ; `cadence` (pas/s, défaut 1,1). Le déplacement en x est à faire dans le plan.
- `cible` `[X, Y]` **écran** : utilisée par `frappe`, `presente`, `sou`, `montre`.
- Tous les gestes sont des réglages 0..1 lissés par `ease` : les faire varier avec `smooth(t0, t1, t)`.
- Point nommé de l'objet tenu : `LIB.pt(r, 'nom')` (main arrière : `LIB.pt(r, 'nom', true)`) ; `'prise'` existe pour tous. Points : maillet `face` (dessous de la tête, qui frappe) `tete` `bout` ; sou `centre` `haut` ; bourse `bouche` `centre` `papillon` ; journal `centre` `gravure` `haut` ; plan `centre` `bas` ; pinceau `bout` (pointe des poils) `poils` `manche` ; seau `bord` `fond` ; chapeau `centre` ; monnaie `centre`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `LIB.bartholdi` (`C.libBartholdi`) | 0,9 ≈ 479 px avec le béret, ≈ 95 px de large | `barbe` (brune en pointe), `beret` | `frappe` + `cible` (point d'impact de la **face du maillet**, tenu d'office ; manche horizontal à `leve` 0) + `leve` 0..1 (maillet relevé de ≈ 60°, poignet +30) — l'agiter avec `abs(sin)` pour les coups ; la main arrière se pose près de la cible ; `presente` (révérence : buste plié 0,15, tête baissée, main avant ouverte vers `cible`, main arrière sur le ventre, sourire) ; `sou` (sou tenu d'office ; centre du sou sur `cible`, sinon à hauteur des yeux devant lui) ; `regardeBas` (buste plié 0,34, tête baissée) ; `perplexe` (main ouverte à la barbe qui gratte selon `t`, sourcils `worry`, bouche `tight`) ; `marche` |
| `LIB.eiffel` (`C.libEiffel`) | 0,88 ≈ 444 px (tête nue) | `barbe` (grise carrée) | `plan` (plan tenu d'office à deux mains, bras levés, coin haut avant dans la main avant, tête penchée sur le plan) + `deroule` 0 rouleau → 1 feuille bleue 132 × 202 px (squelette en treillis dans la silhouette pointillée de la statue, contre-retourné en dir −1) ; `sousBras` (rouleau horizontal porté à la hanche) ; `montre` + `cible` (main ouverte) ; `marche` |
| `LIB.oncleSam` (`C.libSam`) | 0,9 ≈ 517 px avec le chapeau (455 sans) | `chapeau` (blanc, bande bleue étoilée), `cheveux`, `barbiche` | `salut` (0 → 0,4 la main va au bord ; au-delà le chapeau passe dans la main, levé au-dessus de la tête ; `tenu:'chapeau'` et `hide.chapeau` d'office) ; `accepte` (main ouverte sur le cœur, hoche la tête selon `t`) ; `pocheTapote` (tape la poche du gilet selon `t`) ; `bourse` (sort de la poche → devant la poitrine ; `tenuO.etat`) ; `retourne` (bourse `vide` levée à hauteur du visage, bouche en bas) + `papillon` 0..1 (le papillon sort de la bouche) ; `compte` (pièces `monnaie` dans la paume arrière, main avant qui pioche un petit sou) ; `siffle` (menton levé, bouche « o », yeux mi-clos, mains aux poches, léger recul du buste) ; `surpris` (bond selon `t`, yeux ronds, mains levées ; le chapeau saute sur la tête ; avec `salut` seul le bras arrière se lève) ; `pinceau` (pinceau tenu devant à deux mains, manche horizontal vers l'avant) + `degu` (pinceau baissé, tête basse) ; `marche` |
| `LIB.pulitzer` (`C.libPulitzer`) | 0,94 (défaut) ≈ 484 px, le plus grand | `toupet` (cheveux bruns), `barbe` (pleine brun-roux) ; pince-nez peint | `brandir` (journal tenu d'office, levé de face au-dessus de l'épaule avant, 197 × 259 px, main arrière au revers, bouche « o ») ; `montre` + `cible` (main ouverte, ex. vers le chapeau des dons) ; `sousBras` (journal plié `plie:1` à la hanche) ; `marche` |

Pièges : `frappe`/`sou` mettent le maillet/le sou d'office si `tenu` est absent (passer `tenu:'rien'` pour les mains nues). `presente`, `montre` : la main ne va pas plus loin que 178 unités de l'épaule (vers la cible). `regardeBas` et `presente` inclinent le corps (`tilt`) : pour `M.ik` à la main, passer `r.q`. Un personnage `dir −1` montre le journal et le plan dans le bon sens (dessin contre-retourné). Pulitzer et Daimler (`mercedes.js`) ont tous deux une barbe brune et un gilet ocre : les distinguer par la redingote verte, les cheveux et le pince-nez (ne pas les mettre côte à côte en brun).

### `bendSign` de `M.ik` (pages 2 à 7, dir 1 et −1 : aucune ligne « ATTENTION coude / main derrière le dos / pied »)
| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| Bartholdi, Eiffel, Oncle Sam, Pulitzer (tous gestes) | 1 | 1 | 1 | 1 |
Tables `LIB.BEND.bartholdi|eiffel|oncleSam|pulitzer = { armF: [dir 1, dir −1], armB: […] }`. Exemple : `const r0 = LIB.oncleSam(pose…)` puis `M.ik(C.libSam, r0.q, x, FEET, 0.9, dir, 'armF', [X, Y], 1)`. Cible toujours **devant** le personnage (sinon « main derrière le dos »). Aucune dispense `libre`.

## Statue, tête, bras, morceaux (sans tige ; vue de face) — `o.couleur` 0 cuivre neuf (#C47A3E, reflets #F0B070) → 1 vert-de-gris (#6FA593, ombres #3E6B5E), interpolé avec traînées de patine entre 0,1 et 0,8 ; `o.eclat` 0..1 (étoile de reflet) ; `o.cast`, `o.alpha`, `o.dir`
| Fonction | `(x,y)` = | Taille à l'échelle | Points (`LIB.xxxPt(nom, x, y, s, o)`) |
|---|---|---|---|
| `LIB.statue(x,y,s,o)` | bas de son petit socle (ou du piédestal si `o.socle:true`) | 1000 de haut à s 1 (46 m talon → flamme) ; s 0,37 (défaut) ≈ 370 × 137 px ; `o.socle:true` ajoute le piédestal (850 × 464 à s 1) | `LIB.statuePt` : `base` `pieds` `torche` `flamme` `main` `tablette` `tete` `visage` `couronne` `epaule` ; `o.eclatPt:'torche'` met l'éclat sur la flamme (sinon couronne). Tablette **vierge** dans le bras gauche, couronne à 7 rayons, flamme dorée (ne verdit pas) |
| `LIB.tete(x,y,s,o)` | base du cou posée au sol | s 1 (défaut) ≈ 520 × 480 px (rayons compris), visage 210 × 270 | `LIB.tetePt` : `base` `joue` (bord gauche, cible du maillet pour un Bartholdi à gauche) `joueD` `nez` `oeil` `menton` `front` `couronne` `sommet` |
| `LIB.bras(x,y,s,o)` | bas de la petite base | s 1 (défaut) = 1000 px de haut, base 248 px, balcon 300 px de large | `LIB.brasPt` : `base` `coude` `main` `torche` `coupe` `balcon` (plancher du balcon côté gauche : pieds d'un petit visiteur à s ≈ 0,35) `balconD` `balconC` `rambarde` `flamme`. Le garde-corps avant est dessiné par-dessus la flamme |
| `LIB.morceau(type,x,y,s,o)` | milieu de la base | s 0,9 (défaut) : `orteil` 158 × 88, `nez` 97 × 137, `main` 145 × 150, `rayon` 61 × 180, `oeil` 171 × 94 px (`LIB.MORCEAU_H` = hauteurs locales) | `type` ∈ `LIB.MORCEAUX` = `'orteil' 'nez' 'main' 'rayon' 'oeil'` ; bords de coupe sombres rivetés |
| `LIB.caisse(x,y,s,o)` | milieu du bas de la face avant | s 1 (défaut) ≈ 176 × 146 px (0,9 : 158 × 131) | `o.ouvre` 0..1 (couvercle à charnière arrière, ≈ 110°), `o.contenu` (type de morceau, dessiné à 0,8), `o.sortie` 0..1 (défaut = `ouvre` : le morceau monte de l'intérieur), `o.couleur`/`o.eclat` du morceau, `o.bande` `'rouge'|'bleu'|'vert'|'noir'|'ocre'|'aucune'|#hex` (pochoir nu), `o.suspendue` (élingues vers l'anneau). `LIB.caissePt` : `base` `dessus` (dessus du couvercle, pour empiler : poser la suivante à `y − 146·s`) `anneau` (sous le crochet) `contenu` `devant` `couvercle` (bord avant, où la main tape) |

## Accessoires seuls (sans tige ; même dessin que tenu en main) — options communes `o.dir`, `o.rot`, `o.alpha`, `o.cast`, `o.ombre`, `o.t` ; `LIB.accPt(nom, x, y, s, o, 'point')`
| Fonction | `(x,y)` = | Taille à s 1 | Options |
|---|---|---|---|
| `LIB.sou` | centre | Ø 44 (40 px tenu à 0,9 ; 55 px avec `echelle` 1,4) | `couleur` 0..1, `eclat` 0..1, `tranche` 0..1 (pièce vue de tranche pour la faire tourner). Profil gravé sans lettre. Tenu par son bord bas, pouce et index par-dessus |
| `LIB.monnaie` | dessous du tas | 4 pièces, 46 px | `n`, `couleur` |
| `LIB.maillet` | prise (bout du manche) | 139 de long (125 px à 0,9), tête de buis 50 × 62 | — |
| `LIB.bourse` | fond (`'vide'` : prise) | 74 × 106 | `etat` `'fermee'|'ouverte'` (pièces au col) `|'vide'` (retournée, bouche ouverte en bas) ; `papillon` 0..1 (avec `'vide'`) |
| `LIB.papillon(t,x,y,s,o)` | corps | envergure 52 | papillon de nuit gris-brun, ailes qui battent selon `t` ; `o.dir`, `o.rot`, `o.a` (opacité) |
| `LIB.journal` | milieu du bas | 210 × 276 ouvert ; 105 × 138 plié | `plie` 0 → 1 (pliage animé). Bandeau noir nu, gravure de la statue sur son socle, 3 colonnes de lignes grises : **aucune lettre** |
| `LIB.plan` | milieu du rouleau | 150 × (230 · `deroule`) | `deroule` 0..1 |
| `LIB.pinceau` | prise avant | 372 de long (335 px à 0,9) | `peinture` (#C47A3E), `charge` 0..1 |
| `LIB.seau` | fond | 80 × 112 + anse | `peinture` |
| `LIB.chapeauSam(x,y,s,o)` | dessous du bord | s 0,9 : 95 × 80 px | chapeau de l'Oncle Sam seul (qui tombe, posé) |

## Décors (pré-rendus par `LIB.init()` ; à dessiner AVANT `M.drawFloor()` ; animations en temps global)
| Appel | Options | Repères utiles |
|---|---|---|
| `LIB.atelier(t, o)` — atelier Gaget-Gauthier : verrière 7 × 6 carreaux sur les toits de Paris (nuages, fumées de cheminées), briques ocre ; à gauche échafaudage (poutre haute, plancher, échelle) avec forge à charbon (braises, flammes, fumée) et soufflet, moulage de main en plâtre ; à droite établi (étau, bol de cuivre, maquette en plâtre de la statue, feuilles de cuivre), râtelier de maillets et marteaux, gabarits de bois, oreille en plâtre, pendule ; lanterne à huile et poulie à chaîne qui balancent ; enclume, tréteau, seau ; rayon de la verrière avec poussière | `chat` 0..1 (traverse la poutre haute de gauche à droite ; rien à 0 ou 1), `pigeon` 0..1 (vol 0 → 0,4, puis posé derrière la vitre), `rayonX` (x au sol du rayon, défaut 690), `rayon` 0..1 (intensité) | `LIB.AT` : `win` (verrière x 236–844, y 176–636), `poutre` (y 520, x 90–470), `forge` (193, 1206), `etabli` (x 772–1050, dessus y 1170), `pendule`, `lanterne`, `poulie`. Zone x 250–780 y 640–1395 = mur de briques calme. Après `M.drawFloor()` : `LIB.atelierSol()` (copeaux sur les côtés) |
| `LIB.port(t, o)` — rade de New York 1885-86 : ciel, nuages, mouettes, Manhattan bas (clochers, mâts, fumées), pont de Brooklyn ; bateaux qui croisent ; île de Bedloe (fort en étoile, arbres) avec socle de granit à pilastres et loggia ; vaguelettes ; frégate *Isère* (coque noire, liseré blanc, sabords, 3 mâts, voiles ferlées, cheminée qui fume, tricolore et flamme qui flottent) ; quai pavé : grue de bois (flèche, treuil, bouées), bittes, cordages, tonneaux, ballots, chariot à bras, lanterne, grand pavillon étoilé | `ile` `'fond'` (défaut, x 800, socle complet 280 px) \| `'centre'` (x 540, statue + socle ≈ 684 px) ; `socle` 0..1 (alias `hauteur` ; **20 blocs** : chaque bloc descend se poser, 0,45 = 9 blocs exacts ; échafaudage + petite grue à mât qui s'effacent de 0,9 à 1) ; `statue` `true | { couleur, eclat, eclatPt }` (posée seulement si `socle` = 1) ; `isere` (défaut : présente en `fond`, absente en `centre`) ; `pieces` 0..1 (tas de pièces au pied du socle) ; `fleche` 0..1 (inclinaison du bras de grue, défaut 0,5) ; `crochetY` (y écran du crochet ; défaut bout + 300) ; `crochetFixe` (pas de balancement) ; `remorqueur` 0..1 (traversée droite → gauche au loin, avec fumée) ; `mouette` 0..1 (vol puis posée sur la bitte) ; `salve` (instant des 3 bouffées de canon, fumée seule, sur le fort) ; `fete` (guirlandes de fanions rouge-blanc-bleu en haut) ; `gNuages` (temps donné aux nuages, pour les accélérer : passer une fonction pure de t) | `LIB.portPt(nom, o)` (mêmes `o`, + `t`) : `crochet` (point où accrocher l'`anneau` d'une caisse : `LIB.caisse(x − 8·s, y + 290·s, s, { suspendue: true })`), `bout` (de la flèche), `socle` (haut actuel du socle selon `socle`), `statue` (pied de la statue = haut du socle complet), `ile` (dessus du fort), `bitte`, `pavillon`, `cheminee`. `LIB.PO` : `horizon` 1088, `quai` 1332, `isere` (x 40–545, flottaison 1300), `grue`, `ile.fond/centre` |

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'LIB\.' casting/scene.js`).
```js
// P1 : Bartholdi frappe la joue de la tête (trois coups), maillet horizontal au contact
LIB.atelier(t, { chat: smooth(3.4, 5.2, t) }); M.drawFloor(); LIB.atelierSol();
LIB.tete(660, ST.back + 4, 1, { couleur: 0, eclat: e, cast });
LIB.bartholdi({ t, frappe: 1, leve: Math.abs(Math.sin(t * 7)), cible: LIB.tetePt('joue', 660, ST.back + 4, 1) }, 330, FEET, 0.9, { dir: 1, cast });
// P4 : la grue descend une caisse, l'Oncle Sam retourne sa bourse vide
LIB.port(t, { ile: 'fond', socle: 0.45, fleche: 0.55, crochetY: y, remorqueur: smooth(2.5, 9, t) });  M.drawFloor();
const hk = LIB.portPt('crochet', { t, fleche: 0.55, crochetY: y });  LIB.caisse(hk[0] - 8 * 0.9, hk[1] + 290 * 0.9, 0.9, { suspendue: true, bande: 'rouge' });
LIB.oncleSam({ t, retourne: 1, papillon: smooth(8.4, 9.2, t) }, 470, FEET, 0.9, { dir: 1, cast });
// P6 : statue au centre qui verdit, l'Oncle Sam au pinceau
LIB.port(t, { ile: 'centre', socle: 1, statue: { couleur: smooth(2.5, 4, t) }, fete: true, salve: 1.2, fleche: 0 });
```
