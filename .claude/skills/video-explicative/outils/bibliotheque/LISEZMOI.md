# Bibliothèque commune — personnages, accessoires et décors validés

Chaque fichier `*.js` de ce dossier est chargé dans **chaque plan** de chaque vidéo (après le kit, avant `persos.js`) par `construire.sh`. Tout ce qui est ici a été **validé par l'utilisateur** : le réutiliser tel quel plutôt que de le recréer, c'est du temps gagné et zéro risque de retour. Une nouvelle vidéo qui a besoin d'une variante la crée dans son propre `persos.js` (noms de `M.chars` nouveaux et espace de noms propre : jamais `M.reb`).

Après chaque vidéo livrée : copier son `persos.js` ici sous `<sujet>.js` (première ligne = description, espace de noms propre) et son `persos.md` sous `<sujet>.md` (mode d'emploi : un agent lit le `.md`, jamais le `.js` en entier), ajouter sa section ci-dessous et committer. Pour un fichier sans `.md` (vidéos d'avant le 14/10/2026), lire seulement son en-tête-index : `sed -n '1,/^(function/p' <sujet>.js`.

## `reblochon.js` — « Le reblochon » (Savoie, Moyen Âge → cuisine moderne), espace `M.reb`
Validé : vache complice (œil rond et joyeux, `humeur`, clin d'œil, clarine), paysan savoyard, contrôleur, seigneur, moine, ustensiles bien tenus, reblochon en coin triangulaire.
Dans `S.init` : `const K = M.reb.init();` (pré-rend tous les décors ci-dessous, une fois).

```
MARIONNETTES (M.chars.*, à dessiner avec M.puppet(def, pose, x, y, s, {dir, slot, cast})) — (x,y) = pieds (ou bas du buste / de la robe)
  vache, vacheTete   : REB.vache(pose,x,y,s,o) / REB.vacheTete(pose,x,y,s,o) (ajoutent pose.slot pour la 2e tige) ; pièces head jaw earN earF hornN hornF queue clarine
                       legFN/FF/RN/RF _up/_lo pis ; pose.lid lidB lidF tq clarineK face.mouth
  paysan             : torso head capuchon corde armB/F_up/_lo legB/F_up/_lo ; REB.assis(pose) ; pose.tenu 'rien'|'louche'|'seau' (+vert, niveau, creme) ; handF/handB
  controleur, controleurMini : torso head chaperon cornette armB/F_* legB/F_* ; pose.tenu 'jauge'|'couteau'|'rien', tenuB 'taille'|'rien', encoches, encoche, mouille
  seigneur (buste)   : torso head toque armB/F_* + gobelet (gob_corps, gob_pied) ; pose.lait 0..1 = moustache de lait ; pose.tenu 'gobelet'|'rien' ; niveau
  moine              : capuche torso cordon head armB/F_up/_lo + fromage (pose.fromage, fromageK) ; face.eyes 'up'|'side'|…
ACCESSOIRES (M.chars.* + REB.prop(name,pose,x,y,s,o)) : reblochon (etat 'entier'|'entame'|'petit'|'mini', coule, part/partDx/partDy, sq), seau, gobelet, pot, moule, tabouret,
  plat, panier, couteau*, fourchette*, louche, taille, jauge, clarine, main* (* sur tige : rod:true), portrait (REB.portrait)
EFFETS : REB.jet, REB.coulee, REB.vapeur, REB.bulle.   AIDES : REB.pose, wink, tourne, respire, marche, vacheMarche, vacheIdle, trayon, assis, cheminPt.
DÉCORS : REB.init() (dans S.init) remplit REB.K = { aravis{aube,couchant}, prairie, sapinL, sapinR, colline, collineCrete, cuisine{fond,montagnes,montagnesChaud,rebord}, table, tableBois, chalet, chateau, chateauBalcon }
  + constantes REB.FEN, TABLE, TABLEBOIS, CHALET, CHATEAU, CHEMIN, SEAU, GOB, POT, MOULE, PLAT, PANIER, TABOURET, CLA.
```
**Vache tête de face (préférée par l'utilisateur, à utiliser par défaut)** : `REB.vacheF(pose,x,y,s,o)` / `REB.vacheTeteF(...)` (`CH.vacheF`, `CH.vacheTeteF`) : corps de profil, tête parfaitement de face (`REB.VUE_FACE = 'A'`) ; même API de pose (humeur, lid/lidF/lidB, REB.wink, face.mouth dont 'o', ang.jaw/earN/earF, clarine/clarineK ; `ang.head` = petite inclinaison, `pose.tq` ignoré). Tête ≈ 60 px plus haute (cornes) à l'échelle 0,74 : prévoir la place sous les fenêtres, tables et lambrequin.
Réglages éprouvés : vache de profil `s` 0,75–0,9 (fente avant), `pose.humeur` −1 (très contente, yeux plissés) … 1 (fâchée, sourcil en V) ; éviter `tq` entre 0,3 et 0,6 ; `clarineK` 1,3 quand la clarine porte le gag. Couteau et fourchette : `rod:false` (ils volent). Avant d'utiliser une pièce, lire son en-tête dans `reblochon.js` (options exactes).

## `poubelle.js` — « Monsieur Poubelle » (Paris, 1883 → aujourd'hui), espace `M.pou`
Validé : préfet Poubelle (barbe collier blanche, habit bleu nuit brodé argent, bicorne à plumes blanches ; salut au bicorne, soupir, plume), propriétaire (haut-de-forme, rouge + fumée des oreilles), chiffonnier (hotte en osier, crochet ou pelle), rats, boîte à ordures 1883 (couvercle articulé qui avale, claque, salue comme un chapeau), journal « LE PETIT RÂLEUR » avec caricature, rue haussmannienne et café 1880.
Dans `S.init` : `POU.init();` (pré-rend `POU.K` = rue, cafe, gueridon, chaise, morris). Lire l'en-tête-index de `poubelle.js` avant usage (options exactes).

```
MARIONNETTES : POU.prefet(pose,x,y,s,o) (passer par elle ou POU.prefetPose pour salut/soupir) ; pose.tenu 'rien'|'plume'|'rouleau', pose.salut 0..1, pose.soupir 0..1
               C.proprio (pose.rouge, pose.fumee, pose.leve) ; C.chiffonnier (pose.tenu 'crochet'|'pelle', pose.deuxMains + POU.manche)
ACCESSOIRES  : POU.boite(x,y,s,{ouvre, contenu 'putrescible'|'papiers'|'verre'|'tout'|'vide', salut, bicorne, bande 'vert'|'ocre'|'bleu'|hex, huitre, mouche, t})
               POU.bac({couleur 'jaune'|'vert'}), POU.mainModerne + POU.yaourt, POU.pupitre / POU.arrete / POU.rouleau(deroule), POU.journal(face 'caricature'|'dos'),
               POU.tas(taille), POU.rat(t,x,y,s,{trot, tient 'croute'|'arete'}), POU.bicorne
DÉCORS       : POU.K.rue (poser à 540 ; POU.RUE.portes [210,540,870], POU.RUE.cinq, POU.RUE.corniches), POU.K.cafe, gueridon, chaise, morris
```
Réglages éprouvés : marionnettes à `s` 0,9–0,95 (≈ 480–500 px) ; boîtes du tri à 1,1 (3 de front) ou 0,88 (5 de front) avec `bande` (la boîte est entièrement teintée) ; tas d'ordures à 1,35 avec étirement vertical 1,35 ; rats à 1,4–1,5 ; main moderne à 1,5 ; journal à 1,29. Bras levé « brandir » : armF_up ≈ −2,0, armF_lo ≈ −0,85. Un inconnu « dans l'ombre » : préfet sans bicorne assombri à 70 %, découpé au bord de la boîte (voir le plan 1 de la vidéo).

## `teflon.js` — « Le Téflon, un frigo raté » (DuPont 1938 → Tefal 1954), espace `M.tef`
Livré le 13/10/2026, contrôlé plan par plan (aucun retour d'Alexis à ce jour) : Roy Plunkett (blouse, lunettes de protection front/yeux, main sur le crâne perplexe, révérence de théâtre), officier (casquette à insigne rond, salut main ouverte), Marc Grégoire (bob de pêcheur, moustache, `brandir`, `fier`), Colette (boucles, poing sur la hanche, `tendre`), frigo « Monitor Top » 1938 SANS visage qui joue avec sa porte, sa sueur, ses gouttes, son tremblement et sa penche, bouteille de gaz (robinet à volant, coupée pleine de poudre), balance de Roberval sans graduation, poêles `alu`/`teflon` avec œuf `colle`/`glisse` (retournement), labo 1938 et paillasse à étau.
Dans `S.init` : `TEF.init();` (pré-rend `TEF.K` = labo, paillasse, mors, poele{alu,teflon}). Lire l'en-tête-index de `teflon.js` avant usage (options exactes).

```
MARIONNETTES : TEF.plunkett / officier / marc / colette (pose,x,y,s,o) — toujours par l'enveloppe ; pose.tenu/tenuB 'rien'|'bouteille'|'scie'|'spatule'|
               'flacon'|'bocal'|'poele'|'canne'|'pinceau', tenuO/tenuBO, deuxMains ; plunkett : goggles, teteMain, reverence ; officier : salut ;
               marc : brandir, fier ; colette : hanche, hancheB, tendre. TEF.pt(r,'bec'|'pointe'|'scion'|'robinet'|…) = point écran de l'objet tenu.
ACCESSOIRES  : TEF.frigo(x,y,s,{porte,sueur,gouttes,tremble,penche,givre,t}) (o.t obligatoire) ; TEF.bouteille({etat,robinet,poudre}) ; TEF.balance({pente}) ;
               TEF.scie, TEF.tas({taille}), TEF.spatule({charge,glisse}), TEF.bocal({poudre,acide,vapeur}), TEF.flacon({niveau,filet,filetY}),
               TEF.poele({modele,oeuf,oeufDx,oeufDy,oeufFlip,retourne,sens}), TEF.canne, TEF.pinceau
DÉCORS       : TEF.K.labo (plein écran), TEF.K.paillasse (M.flat à TEF.PAILLASSE.cx sur ST.back ; étau en TEF.PAILLASSE.etau), TEF.K.mors (après la bouteille serrée),
               TEF.K.poele.teflon / alu (pour M.hung)
```
Réglages éprouvés : marionnettes à `s` 0,9 (Colette 0,88), frigo à 1 posé sur `ST.back` à x ≈ 770 ; balance à 0,6 sur la paillasse (x 400) ; garder un personnage à x ≥ 240 quand le rideau est à demi fermé (cue `demi`), sinon son geste est coupé. Passage d'un objet de main en main : `objetB` ≈ −0,4 pour écarter la canne du champ.

## `barbenoire.js` — « Barbe Noire, le pirate qui fumait » (1718), espace `M.bn` — mode d'emploi : `barbenoire.md`
Livré le 15/10/2026 (aucun retour à ce jour) : Barbe Noire (tricorne noir, barbe de jais, mèches fumantes, gestes caresse/révérence/coup/chute/perruque), marins a/b/c, otages conseiller/planteur/marchand (option tonneau), coffre d'or, tête seule, `BN.fumee`. Fragile : `perruque` sur le tricorne (la redessiner agrandie), `tonneau` à mi-course. Décors du pont pirate/marchand, Charleston, Ocracoke : dans les `decors/pN.js` de la vidéo, non repris.

## `mercedes.js` — « L'étoile Mercedes, une carte postale » (Deutz 1870s → 1926 → aujourd'hui), espace `M.mer` (MER)
Livré le 15/10/2026 (aucun retour à ce jour). Mode d'emploi complet : `mercedes.md` (à lire à la place du `.js`). Dans `S.init` : `MER.init();`.
Contenu : Daimler (barbe, redingote brune, plume), Emma (robe verte à tournure, tape du pied), Paul (canotier) et Adolf (melon, tampon), publicitaire moderne ; étoile à trois branches (`branche`, `halo`), voiture (moderne/ancienne, `emblem`), carte postale à maison, bulle de pensée + usine, tampon/document, icônes terre/eau/airs, moteur, couronne de lauriers, facture, sac de pièces, chevalet, piédestal ; décors `salon`, `salonVieux`, `avenue`, `toile`.
Fragilités : Daimler avec chapeau ressemble au propriétaire de `poubelle.js` (laisser le chapeau sur le pupitre) ; `reflechir` avec `tenu:'rien'` ; cibles de `ecrire`/`tamponner` calées sur `POU.pupitre`.

## `bigben.js` — « Big Ben, la cloche fêlée » (Londres, 1856 → aujourd'hui), espace `M.ben`
Livré le 15/10/2026 (routine, aucun retour d'Alexis à ce jour). Mode d'emploi : `bigben.md`. Dans `S.init` : `BEN.init();` (pré-rend `BEN.K` = ciel, ville, tour, cour, fonderie, beffroi).
Contenu : cloche (`BEN.cloche` : fele, tourne, balance, salut, grande, ondes `BEN.ondes`), marteau lourd/léger, ouvrier-fondeur, sir (haut-de-forme), touriste (+ mini), chariot, appareil photo, décors Westminster. Le beffroi partagé (`M.dec.beffroi`, `cloche_beffroi`, `ciel_beffroi`, écrit pour la vidéo en `decors/p3.js`) est gardé en `bigben-beffroi.txt` (non chargé : à copier dans `decors/pN.js` si besoin).
À vérifier : fêlure en zigzag très régulier ; le sir partage le bleu nuit du préfet Poubelle ; `deuxMains` du marteau fait un petit saut de main.

## `autruche.js` — « L'autruche qui avalait la clé de son enclos » (zoo → laboratoire), espace `M.aut` (AUT)
Livré le 16/10/2026 (routine, aucun retour à ce jour). Mode d'emploi : `autruche.md` (à lire à la place du `.js`). Dans `S.init` : `AUT.init();`.
Contenu : autruche (cou à bosse d'avalement `avale`, ventre translucide `ventre`/`ventreObj`, expressions, marche, ailes), gardien de zoo (bonnet rouge à pompon, toise, journal, trousseau), chercheur Dekeyser (pince, `plonge`, `brandir`), clé, objets métalliques, cuve, plateau, pince, toise, journal ; décors `AUT.enclos` (porte à serrure) et `AUT.labo` + table.
Fragilités : `leve` du gardien passe la toise devant son visage (utiliser `atteint`/`cible`) ; cou `rentre` un peu anguleux ; clé dans le ventre petite (~120–150 px) ; `affiche.py` demande `/usr/bin/python3` (PIL).

## `lacoste.js` — « Le crocodile Lacoste, né d'un alligator » (Boston 1925 → 1933), espace `M.lac`
Livré le 15/10/2026 (aucun retour d'Alexis à ce jour). Mode d'emploi : `lacoste.md` (à lire à la place du `.js`). Contenu : Lacoste (tenues `longues` / `polo`), capitaine à canotier, journalistes J1/J2, valise en peau d'alligator, `LAC.reptile` croco/alligator (jumeaux), polo et portant, raquette, balle, calepin, appareil photo, vitrine bostonienne, court de tennis avec filet et gradins. Dans `S.init` : `LAC.init();`. Réglages éprouvés : marionnettes à `s` 0,9, `bendSign` 1 pour tous les gestes sauf main dans le dos (−1).
Affiche : `exemples/affiches/lacoste` (Lacoste ébahi devant la valise en alligator que le capitaine lui présente).

## `leonard.js` — « Léonard de Vinci, l'écriture en miroir » (atelier vers 1500 → cabinet XIXe), espace `M.leo` (LEO)
Livré le 17/10/2026 (aucun retour d'Alexis à ce jour). Mode d'emploi : `leonard.md` (à lire à la place du `.js`). Contenu : Léonard (gaucher : écrit `dir −1`, plume dans la main avant ; béret, longue barbe blanche, robe rose ancien, poignets ivoire avec `tache`), savant A (chauve, pince-nez, redingote verte, loupe) et savant B (petit, calotte, moustache rousse, gilet à carreaux, `encre`), carnet ouvert de face (lignes ondulées sans lettres, `sens` 'rg'/'gd', croquis machine volante / homme dans le cercle, `miroir`), plume, encrier, loupe, miroir à main et mural (`reflet`), portrait de Léonard (`clin`), miroir suspendu à son fil `LEO.miroirSuspendu(t, up, reflet, {x, y, phi})`, grande page de démonstration (`bavure`) et main gauche géante sur tige (`tache`). Décors `LEO.atelier(t, up, o)` (fenêtre toscane, maquette volante, lutrin, table) et `LEO.cabinet(t, up, o)` (bibliothèque, miroir mural, portrait ; remonte aux cintres avec `up`). Dans `S.init` : `LEO.init();`. Réglages éprouvés : Léonard s 0,95, savants 0,98 / 0,85, `bendSign` 1 partout ; un objet tenu près du visage (plume, main noircie) se garde devant la poitrine, jamais devant la figure.
Affiche : `exemples/affiches/leonard` (Léonard qui écrit sous le miroir, le savant à la loupe derrière lui).

## `henri4.js` — « Paris vaut bien une messe, la phrase jamais dite » (Paris 1589 → Saint-Denis 1593), espace `M.hq` (HQ)
Livré le 17/10/2026 (routine, aucun retour d'Alexis à ce jour). Mode d'emploi : `henri4.md` (à lire à la place du `.js`). Dans `S.init` : `HQ.init();`.
Contenu : Henri IV (pourpoint ivoire, fraise, chapeau noir à panache blanc ; `oteChapeau`, `brandir`, `frapper`, `genou`, `reverence`, `epaules`, `sourcil`, `tenu` couronne/chapelet/chapeau), Sully (tout en noir, col plat blanc, chauve à barbe carrée ; `chuchote`, `tendre`, `surpris` = main sur le cœur, `hoche`, Bible noire `tenuB`), ligueurs a/b/c (bustes derrière les créneaux, `non`, `outre`, `baisse`), girouette en coq (`sens` retournement, `tremble`, `bloque`), couronne royale, porte de Paris (`ouvre`, `judas`), portail gothique ; décors `remparts` (avec toits de Paris et Notre-Dame), `tente`, `abbatiale` de Saint-Denis.
Fragilités : `oteChapeau` entre 0 et 0,35 fait passer l'avant-bras devant le visage (incliner la tête et accélérer ce passage, voir p1) ; passage `tenuB` → `tenu` de la Bible impossible sans saut ; meurtrière de la tour gauche des remparts visible au-dessus d'Henri tête nue à x 330 ; coq peu lisible à `sens` ≈ 0 (de tranche).
Affiche : Henri chapeau à la main, Sully main sur le cœur, girouette sur un mât entre eux (scène dans le dossier de travail, non reprise en exemple).
