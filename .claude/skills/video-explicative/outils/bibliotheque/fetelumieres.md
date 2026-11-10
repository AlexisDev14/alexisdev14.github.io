# persos.md — « La Fête des Lumières, née d'une cérémonie ratée » : mode d'emploi de `persos.js`

Espace de noms : `M.lyo` (alias `const LYO = M.lyo;`). Dans `S.init` : `LYO.init()` (pré-rendus : nuage clair/sombre, place 1852, Lyon aujourd'hui, quai 1852 → `LYO.K`).
Repris de la bibliothèque, sans copie : Léa `GRV.lea`, habitants `GRV.ouvrierA` / `GRV.ouvrierB` (`greve.md`, bendSign 1 partout, `handF:'cup'` permis).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Tailles en px **à l'écran** à l'échelle conseillée (calculées sur le code, vérifiées sur la planche).

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `LYO.nom(pose, x, y, s, o)` (`o.dir` ±1, `o.cast`, `o.slot`, `o.alpha`). Renvoie `r` (`r.w('pièce', x, y)` = point écran ; `r.q` = pose finale).
`LYO.nom.pose(p)` = pose finale sans dessiner ; `LYO.nom.def()` = la définition (pour `M.ik`, `M.partMatrices`). Passer `t` dans la pose (respiration, marche, flammes, gouttes).
Pièces : `armB_up armB_lo objetB legB legB_lo footB legF legF_lo footF head … torso armF_up armF_lo objet doigts doigtsB` (genoux articulés : `ang.legF_lo` > 0 plie le genou).
Angles : `armF_up` −1,57 = bras horizontal devant, −2,5 = au-dessus de la tête ; `armF_lo` négatif = coude plié vers l'avant ; `head` négatif = menton levé.

Options communes : `tenuO` (options de l'objet tenu, mêmes noms que l'objet seul, + `echelle`) ; `droit` (true d'office : l'objet reste droit à l'écran) ; `ang.objet` le tourne ;
`handF` / `handB` `'fist' 'open' 'cup'` ; `face` `{ brow, mouth, eyes }` ; `marche` 0..1 (+ `cadence`, 6) : pas sur place, le plan déplace `x`.
Point nommé de l'objet tenu : `LYO.pt(r, 'nom')` → `[x,y]` écran : perche `meche` `bout` ; parapluie `pointe` `crosse` ; chapeau `fond` ; lumignon `flamme` `base` `bord` ; bougie `flamme`.

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| `LYO.organisateur` (`C.lyoOrga`) | 0,9 : ≈ 535 px avec le haut-de-forme, 455 px au sommet du crâne ; ≈ 105 px de large | `cheveux favoris moustache chapeau gouttes` | `perche` (`true`/`'flamme'` \| `'eteinte'` \| `'fumee'` : perche d'allumeur dans la main avant) + `leve` (0 tenue à la taille, penchée devant → 1 levée, la mèche monte à ≈ 300 px au-dessus de la main) ; `parapluie` 0 fermé → 1 ouvert au-dessus du chapeau → 2 retourné par le vent (ou `'ferme' 'ouvert' 'retourne'` ; au-delà de 1,3 : bras arrière qui s'agite, bouche ronde) ; `tordre` (essore le chapeau à deux mains devant le ventre, le chapeau quitte la tête, filets d'eau ; anime avec `t`) ; `trempe` (habits assombris, cheveux plaqués au-delà de 0,45, gouttes qui tombent de l'habit) ; `peds` (genou levé, pied hors de l'eau, bras en balancier, chapeau qui penche) ; `montre` (bras en diagonale vers le haut, paume ouverte) ; `repousse` (main levée paume vers l'avant : « plus tard ») ; `fier` (menton levé, buste en arrière, sourire) ; `depit` (tête basse, yeux mi-clos) ; `chapeau:false` ; `fenetre` (ci-dessous) |
| `LYO.lyonnaise` (`C.lyoLyon`) | 0,85 : ≈ 435 px (bonnet) ; ≈ 95 px de large | `jupe tablier bonnet dentelle ruban coupeB` | `tient:'lumignon'` + `tientO` `{ couleur, allume, echelle (1,9), vent }` : verre posé dans la paume avant, main arrière en coupe dessinée PAR-DESSUS le verre ; `presente` (lève le lumignon à deux mains devant elle, menton levé, sourire ; grossir avec `tientO.echelle`) ; `chante` (bouche ronde, menton levé ; sans lumignon : main avant sur le cœur + main arrière levée ; avec : main arrière levée) ; `marche` (la jupe se balance) ; `fenetre` (ci-dessous) |

**À une fenêtre** (`fenetre` : un id de `LYO.FEN` (`'lyon'`, `'orga'`) ou un objet `{x, rebord, w, h, dir, corps, lum}`) : appeler `LYO.lyonnaise({ t, fenetre:'lyon', tient:'lumignon', tientO:{couleur:'rouge'}, pose }, null, null, 0.85)` APRÈS le décor et le sol.
Le buste est découpé dans l'ouverture, les avant-bras accoudés reposent exactement sur le rebord (y −40 du torse = `rebord`), sans tige. `x,y` `null` = position de la fenêtre (`corps`, `dir`).
- Lyonnaise : `pose` 0 lumignon tenu par le flanc au-dessus du rebord → 1 posé sur le rebord en `lum` (dessous du verre sur le dessus du rebord, main en coupe devant la flamme) ; `lache` 0..1 : les mains reviennent sur le rebord, le lumignon reste. `r.lumignon` = point du verre posé. Le lumignon posé est dessiné par l'enveloppe : si la Lyonnaise disparaît, le redessiner par `LYO.lumignon(t, r.lumignon[0], r.lumignon[1], 0.85 * 1.9, {couleur})`.
- Organisateur : sans chapeau, cheveux plaqués, `trempe` 0,55 d'office, petite bougie sur bougeoir posée sur le rebord en `lum`, main avant à l'anse ; `allume` 0..1 l'allume.

`bendSign` de `M.ik` (page 5 de la planche : cibles poitrine, au-dessus de la tête, taille ; bras pliés à fond et balayage 0 → 2,4 rad ; aucune ligne ATTENTION) :

| Personnage | bras avant, dir 1 | bras avant, dir −1 | bras arrière, dir 1 | bras arrière, dir −1 |
|---|---|---|---|---|
| organisateur, Lyonnaise | 1 | 1 | 1 | 1 |

Usage : `const q = LYO.lyonnaise.pose({ t }), a = M.ik(LYO.lyonnaise.def(), q, x, y, s, dir, 'armF', [tx, ty], 1); q.ang.armF_up = a.up; q.ang.armF_lo = a.lo; M.puppet(LYO.lyonnaise.def(), q, x, y, s, { dir, slot, cast });` (mêmes `x,y,s,dir`). Les gestes de l'enveloppe font déjà leur IK interne (coude toujours vers l'avant).

Pièges :
- Les gestes de bras avant ne se cumulent pas : le dernier dans l'ordre `montre, repousse, perche, parapluie, tordre` l'emporte ; `peds` ne bouge les bras que s'ils sont libres.
- Les bustes aux fenêtres ne sont pas assombris par `soir` : de nuit, les éclairer par la poursuite (`M.stageLight` spot) ou les placer dans une fenêtre allumée.
- Haut-de-forme haut (96 local) : garder 60 px sous le lambrequin ; `parapluie` ouvert dépasse le chapeau de ≈ 260 px (canopée vers y écran 700 à `FEET`).
- Pas de vue de dos : « part de dos vers le porche » = marche de profil vers `LYO.PLACE.porche` (dir 1), puis disparition dans l'arc (`alpha`).

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille | Options |
|---|---|---|---|
| `LYO.lumignon(t,x,y,s,o)` | dessous du verre | 64 local × 54 : s 1,9 ≈ 122 px (mot-clé), s 0,6–0,8 en série (40–50 px) | `couleur` `'ambre' 'rouge' 'bleu' 'vert'` (`'clair'` ou `#hex` permis) ; `allume` 0..1 (1) : flamme `M.flamme` dans le verre + lueur de sa couleur ; `vent` 0..1 (la flamme se couche) |
| `LYO.dansLaMain(r,t,o)` | — (main d'une marionnette de bibliothèque : `r` = retour de `GRV.lea`…) | `echelle` 1,9 (× échelle de la marionnette) | `couleur`, `allume`, `vent`, `dir` (celui de la marionnette), `peau`, `arriere` (main arrière), `coupe:true` (main arrière en coupe dessinée par-dessus le verre). Renvoie `{ base, flamme, coupe }` : `coupe` = cible `M.ik` de la main arrière (bendSign 1) ; poser `handF:'cup'` |
| `LYO.statue(x,y,s,o)` | bas de la statue (ou du socle) | 312 local × 124 : 1,0 ≈ 312 px (atelier) ; 0,4 ≈ 125 px (clocher) | `eclat` 0..1 (reflet qui balaie + éclats ronds, jamais en croix) ; `drap` 0..1 (bâche ; en baissant, elle glisse vers +x et s'efface) ; `socle` (hauteur locale d'un socle de pierre, ex. 110) ; `t` |
| `LYO.nuage(t,x,y,s,o)` | centre du nuage | 420 × 220 à s 1 | `pluie` 0..1 (pluie de papier jusqu'à `sol`, y écran, défaut `ST.back+34`, éclaboussures) ; `gonfle` 0..1 (respire, 0,5) ; `gris` 0..1 (carton ardoise → orage) ; `fils:false` ; `dessinePluie:false` (dessiner la pluie plus tard) ; `vent`. Renvoie `{ bas, x0, x1 }`. Sans visage |
| `LYO.pluie(t,o)` | — | — | `{ x0, x1, y0, y1, k, seed, vent }` : pluie de papier seule (devant les marionnettes, par exemple) |
| `LYO.lampions(t,x0,x1,y,o)` | points d'attache de la ficelle | lampions 42 × 52 px à `s` 1 | `y1` (attache droite), `fleche` (creux), `n`, `s` ; `allume` 0..1 (les lampions s'allument de gauche à droite) ; `trempe` 0..1 (éteints, ramollis, allongés, gouttent) ; `ombre` 0..1 (nuit) |
| `LYO.perche / parapluie / chapeau / bougie(x,y,s,o)` | point de prise (chapeau : milieu du bord ; bougie : dessous) | perche 480 local (prise à 110 du bas), parapluie 340, chapeau 96 × 90 (×0,9 à l’écran) | mêmes options que tenus : perche `etat` ; parapluie `ouvre`, `retourne` ; chapeau `tord`, `trempe` ; bougie `allume` |

## Décors (fonctions pures de `t` LOCAL ; ambiance en temps global à l'intérieur ; avant `M.drawFloor()`)
| Appel | Couches, accessoires, animations | Repères utiles |
|---|---|---|
| `LYO.place1852(t, o)` puis, après `M.drawFloor()`, `LYO.place1852Sol(t, {pluie, mouille, neige, fenetres, soir})` | ciel jour gris / pluie / nuit (étoiles), colline, vieille chapelle au clocher carré **avec la statue dorée** (`LYO.statue` à 0,4, éclat) ; façades de 1852 (14 fenêtres à volets, soierie à enseigne-navette, porte, grand porche, géraniums, corde à linge vide) ; maison basse (lucarne, cheminées qui fument, fontaine qui coule) ; réverbère à huile (flamme), borne, charrette à bras ; nuages, oiseaux ; pluie, gouttières, flaques qui frémissent, neige | `o` : `pluie`, `soir`, `fenetres` (cascade gauche → droite, l'organisateur en dernier), `neige`, `chapelle` (chapelle et statue éclairées), `lampions` + `lampionsO` (objet ou tableau par guirlande : `{allume, trempe}`), `volets` (ouverture de tous), `ouvre:{lyon, orga, <id>}` (volets d'une fenêtre ; pour `lyon`/`orga` règle aussi leur lumière), `plus` (3 fenêtres en plus : 2ᵉ hiver), `tous` (lumignons aussi aux fenêtres `lyon`/`orga`), `gouttes`, `claque` (p3 : volet de `L3b` qui claque), `chat` (p4 : entre par la lucarne), `pigeon` (p5 : s'envole du rebord de `R2a`) |
| `LYO.aujourdhui(t, o)` puis `LYO.aujourdhuiSol(t, {mouille, pluie})` | ciel de nuit étoilé, Fourvière : basilique à 4 tours éclairée + chapelle et statue, petites ; 5 façades du Vieux-Lyon (ocre, rose, jaune) à volets, bouchon (rideaux à carreaux, enseigne au cochon sans lettre), traboule, balcon en fer forgé, guirlande lumineuse, réverbère, jardinière, vélo, plaque d'égout ; fumée de cheminée, lumignons qui vacillent, passants en ombre | `o` : `projection` 0..1 (taches et vagues colorées qui balaient les façades), `fenetres` 0..1 (de proche en proche depuis la fenêtre de Léa ; 1 défaut), `foule` 0..1 (3 → 10 passants), `chat` (p1), `volet` (p6 : volet en haut qui s'ouvre, bougie rouge qui s'allume), `nuit` (1) |
| `LYO.quai1852(t, o)` puis, APRÈS les marionnettes, `LYO.quai1852Avant(t, {crue})` | ciel gris, colline verte et brune, chapelle au clocher **vide** (petit dôme), maisons étagées, rive en face, Saône qui scintille, barque amarrée (monte avec l'eau, tire sur sa corde) ; quai de pierre (bitte, escalier) ; hangar du fondeur (charpente, four de briques à gueulard, cheminée, creuset sur trépied, moule de terre, enclume, pinces, seaux, sacs de sable, tonneaux, poulie et chaîne qui se balance) ; nuages, oiseaux, feu, fumée | `o` : `crue` 0..1 (3 bandes de vagues montent de la trappe), `four` 0..1 (feu ; 1 défaut), `vapeur` 0..1 (grande vapeur blanche du four éteint), `chapelle` 0..1 (lueur sur le clocher vide), `sombre` 0..1 (jour qui s'assombrit) |

Repères exportés :
- `LYO.FEN` (y = dessus du rebord, x = milieu, ouverture `w × h`) : `lyon` x 282, rebord 1050, 180 × 244, `corps` 250, `lum` 334, dir 1 · `orga` x 806, rebord 1050, 180 × 244, `corps` 836, `lum` 760, dir −1 · autres : `L1a` (108, 1050), `L2a` (108, 760), `L2b` (282, 760), `L3a` (108, 512), `L3b` (282, 512), `M1` (470, 1100), `M2` (612, 1100), `R2a` (806, 760), `R3a` (806, 512), `R1b` (984, 1050), `R2b` (984, 760), `R3b` (984, 512). `LYO.FEN.lyon`, `LYO.FEN.orga` = raccourcis.
- `LYO.PLACE` : `guirlandes` `[x0, y0, x1, y1, fleche]` = `[400,806,680,816,58]` (la basse, atteinte par la perche levée à x ≈ 470) et `[400,676,680,684,44]` ; `lanterne` (150, 940) ; `porche` x 836, arc de x 752 à 920, haut 1150 ; `porte` (de la Lyonnaise) x 312 ; `clocher` pied (548, 628), statue posée en (548, 472) ; `lucarne` (540, 852) ; `fontaine` x 640.
- `LYO.AUJ` : fenêtre de Léa `lea` = x 680, rebord 1080, 160 × 200 ; `rebord` = `{x0:600, x1:760, y:1080}` (les lumignons de Léa s'y posent : `LYO.lumignon(t, x, 1081, s)` ; le décor n'en met pas) ; `basilique` (506, 652) ; `volet` (fenêtre de p6) x 760, rebord 600.
  Écart à la fiche : rebord à y 1080 (et non 1000) pour être à hauteur de poitrine de Léa à `FEET`.
- `LYO.QUAI` : `statue` x 650 sur `ST.back` (avec `socle:110` la statue reste au-dessus de l'eau) ; `four.bouche` [800,1230,890,1340] ; `cheminee` (845, 420) ; `chapelle` (300, 560), sommet du clocher y ≈ 435 ; `bitte` (330, 1212) ; `poulie` (660, 632) ; barque x 190.
  Hauteur de l'eau : `LYO.QUAI.eau(crue)` → `{ riviere: 1150 → 1100, bandes: [1415 → 1170, 1429 → 1238, 1443 → 1300], avant: 1470 → 1388 }` ; la bande avant (`quai1852Avant`) n'apparaît qu'au-delà de crue 0,45 et couvre les pieds à crue 1 (`peds` les sort).

Ordre de dessin : décor (`place1852` / `aujourdhui` / `quai1852`) → `LYO.nuage` (décor suspendu ; ou après les marionnettes si la pluie doit tomber devant elles) → `M.drawFloor()` → `…Sol` → bustes aux fenêtres → marionnettes (fente arrière puis avant) → `quai1852Avant` → `LYO.pluie` devant → `M.stageLight` → `M.rideau` → `M.drawFrame`.

## Exemples d'appels qui marchent
Voir `casting/scene.js` (`grep -n 'L\.' casting/scene.js`, `L = M.lyo`).
```js
LYO.place1852(t, { soir: 1, fenetres: 1, chapelle: 1, ouvre: { lyon: 1, orga: 1 }, lampions: 1, lampionsO: [{ allume: 1 }, { allume: 0.45 }] }); M.drawFloor(); LYO.place1852Sol(t, { soir: 1, fenetres: 1 });
LYO.lyonnaise({ t, fenetre: 'lyon', tient: 'lumignon', tientO: { couleur: 'rouge' }, pose: 1, lache: 1 }, null, null, 0.85, {});
LYO.organisateur({ t, fenetre: 'orga', allume: 1 }, null, null, 0.9, {});
LYO.organisateur({ t, parapluie: 2, trempe: 1 }, 520, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
LYO.quai1852(t, { crue: 1, four: 0, vapeur: 1 }); LYO.statue(LYO.QUAI.statue.x, ST.back, 1, { socle: 110, eclat: 1, t }); M.drawFloor();
LYO.organisateur({ t, peds: 1, trempe: 0.6 }, 330, FEET, 0.9, { dir: 1, slot: ST.slotF, cast }); LYO.quai1852Avant(t, { crue: 1 });
// Léa (bibliothèque) tient un lumignon : M.ik de la main avant vers le rebord, puis
const r = M.puppet(GRV.lea.def(), q, 520, FEET, 0.9, { dir: 1, slot: ST.slotF, cast }); LYO.dansLaMain(r, t, { peau: '#e6c4a2', couleur: 'ambre', dir: 1, coupe: true });
```

## Comparaisons faites (casting)
Organisateur / `C.proprio` (poubelle) : distincts (haut-de-forme gris perle à ruban prune et non noir, redingote prune, rouflaquettes et guidon roux, lavallière vert bouteille, œillet rouge, ventre modéré) ; / Franklin (robe verte, crâne chauve, lunettes), Pilâtre (tricorne, habit rouge, glabre), `GRV.patron` (tricorne, perruque, prune 1750) : distincts. Lyonnaise / Mary Shelley (`FRK.mary`, robe bleu nuit, chignon) et Léa : seule en bonnet de dentelle, châle carmin, robe verte et tablier.
