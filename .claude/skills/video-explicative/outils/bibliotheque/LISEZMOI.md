# Bibliothèque commune — personnages, accessoires et décors validés

Chaque fichier `*.js` de ce dossier est chargé dans **chaque plan** de chaque vidéo (après le kit, avant `persos.js`) par `construire.sh`. Tout ce qui est ici a été **validé par l'utilisateur** : le réutiliser tel quel plutôt que de le recréer, c'est du temps gagné et zéro risque de retour. Une nouvelle vidéo qui a besoin d'une variante la crée dans son propre `persos.js` (noms de `M.chars` nouveaux et espace de noms propre : jamais `M.reb`).

Après chaque vidéo livrée : copier son `persos.js` ici sous `<sujet>.js` (première ligne = description, espace de noms propre), ajouter sa section ci-dessous et committer.

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
Réglages éprouvés : vache de profil `s` 0,75–0,9 (fente avant), `pose.humeur` −1 (très contente, yeux plissés) … 1 (fâchée, sourcil en V) ; éviter `tq` entre 0,3 et 0,6 ; `clarineK` 1,3 quand la clarine porte le gag. Couteau et fourchette : `rod:false` (ils volent). Avant d'utiliser une pièce, lire son en-tête dans `reblochon.js` (options exactes).
