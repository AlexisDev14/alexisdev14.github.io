# Mémo du casting — à lire EN ENTIER par l'agent casting

Ce mémo remplace la lecture complète de `CHARTE.md` et `API.md`. Ton cahier des charges est `<video>/casting/CONSIGNE.md` (écrit par `construire.sh` : distribution, conduite du rideau, plan de scène s'il existe). **Lis le reste seulement par section** : `grep -n '^## ' OUTILS/API.md`, puis `sed -n 'a,bp'`. Jamais un fichier de plus de 150 lignes affiché en entier.

## 1. Ce que tu livres
- `<video>/persos.js` : **seulement** les marionnettes, accessoires et décors marqués « à créer » dans la distribution (ce qui sert dans au moins deux plans). N'ajoute aucune pièce de plus : un accessoire d'un seul gag est dessiné par l'agent de son plan.
- `<video>/persos.md` : le **mode d'emploi** de `persos.js`, d'après `OUTILS/gabarits/persos.md`. C'est le seul document que liront les agents des plans : ils n'ouvriront pas `persos.js`. Tout ce qu'ils doivent savoir pour appeler une pièce y est (fonction, options et valeurs permises, points de prise et points nommés, taille en px à l'échelle conseillée, pièces articulées, pièges). 150 lignes au plus.
- `<video>/casting/scene.js` : la planche de casting et les 4 tests obligatoires (§5).
- Tu ne crées pas de fichier dans `decors/` : il est réservé aux décors que les plans se partagent. Un décor récurrent de la distribution va dans `persos.js` (pré-rendu dans `init`).

## 2. Style (CHARTE §4, résumé)
- Papier découpé **de profil**, proportions adultes (≈ 1/6 de tête), traits fins, hachures de gravure, palette sourde (bleu nuit, vert éteint, ocre, ivoire, rouge sang, or vieilli), liseré blanc de découpe, ombre portée.
- Membres articulés par **rivets en laiton** ; articulations **rondes** (un cercle centré sur le rivet en haut de chaque segment : jamais de cassure, même plié à fond) ; une **tige en bois** part du torse vers la fente du plancher.
- Accessoires **sans tige** (ils volent) ; la main les tient **par leur corps** (poignée, flanc), ouverture vers le haut.
- Un nouveau personnage ne ressemble à aucun personnage du kit ni de la bibliothèque (chapeau, silhouette, couleurs). Les objets d'une même série ont chacun une couleur **entière** nettement différente.
- Interdits : texte, lettres, chiffres, logos ; doigt seul tendu ; bras croisés de profil ; `Math.random` (utiliser `M.rng(seed)` ou un hash) : tout doit rester une fonction pure de `t`.
- Tailles : personnage principal ≥ 450 px debout (échelle 0,9 ≈ 480 px) ; objet porteur d'un mot-clé ≥ 120 px.

## 3. Format d'une marionnette (API §7)
- La définition (`def`) ne dessine rien ; elle s'enregistre par `M.chars.<nom> = mkX();` au chargement.
- Exemple complet et commenté : **`OUTILS/exemples/persos_chimiste.js`** (80 lignes, à lire en entier) : torse racine, jambes `X.legPts`, bras `X.armPts` / `X.forePts`, tête `X.NAP_HEAD` + `X.eye/brow/mouth`, accessoire enfant de l'avant-bras, dessin brut gardé par `M._sil()`.
- Repères éprouvés : `hipY: -238`, `handLen: 104`, `rod: { part:'torso', at:[-26,18] }` ; tête `[6,-170]` ; épaules `[-2,-146]` (avant) et `[-10,-146]` (arrière) ; hanches `[±6,-2]` ; coude à `[0,94]` de l'épaule ; poing à `[4,96]` de l'avant-bras ; `order` du fond vers l'avant : `armB_up armB_lo legB legF head … torso armF_up armF_lo objet`.
- Angles (`pose.ang`) : `armF_up` 0 = pendant, −1,57 = horizontal vers l'avant, −2,5 = au-dessus de la tête ; `armF_lo` négatif = coude plié ; `head` négatif = menton levé ; `legF/legB` négatif = jambe vers l'avant.
- Outils : `M.X` (§5 de l'API), `M.fillPts/strokePts/dot/hatch/shade/piece`, `M.P`, `M.TAU`, `M._sil()`, `M.ctx()`.

## 4. Squelette de `persos.js`
```js
// persos.js — « Titre » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.xxx (alias XXX). Appeler XXX.init() dans S.init.
(function () {                                    // tout dans une IIFE : un const global ferait planter scene.js
  const X = M.X, CH = M.chars, { fillPts, strokePts, dot, hatch, shade } = M;
  const XXX = (M.xxx = {});                       // espace propre à la vidéo (jamais M.reb, M.pou, M.tef…)

  // 1) objets : un registre unique, dessinés à l'échelle 1, origine = point de prise
  const OBJ = {
    //  draw(o)   : dessine l'objet (dessin brut gardé par M._sil()) ; o = options + o.t
    //  grip      : point de prise (où la main l'entoure), [x,y] ou (o) => [x,y]
    //  p2()      : seconde prise pour deuxMains (facultatif) ; pts : points nommés (bec, pointe…) ; base : point posé au sol
    outil: { draw: drawOutil, grip: [0, -40], p2: () => [0, 10], pts: { pointe: [0, -120] }, base: [0, 0] },
  };

  // 2) pièces « objet tenu » ajoutées à chaque marionnette : l'objet suit le poing, des doigts couleur chair passent PAR-DESSUS
  //    (copier heldParts / finish / run / acc de bibliotheque/teflon.js : grep -n 'function heldParts\|function finish\|function run\|function acc' )

  // 3) marionnettes : def + enveloppe qui prépare la pose (options de geste → angles), puis M.puppet
  function mkHeros() { const parts = { /* torse, jambes, bras, tête, pièces en plus */ };
    return { hipY: -238, handLen: 104, rod: { part: 'torso', at: [-26, 18] }, parts, order: [ /* fond → avant */ ] }; }
  CH.xxxHeros = mkHeros();
  XXX.herosPose = (p) => { const q = Object.assign({}, p, { ang: Object.assign({}, p.ang) });
    if (q.brandir) { q.ang.armF_up = M.lerp(q.ang.armF_up || 0, -2.0, q.brandir); }   // une option de geste = un réglage 0..1
    return q; };
  XXX.heros = (pose, x, y, s, o) => M.puppet(CH.xxxHeros, XXX.herosPose(pose), x, y, s == null ? 0.9 : s, Object.assign({ slot: M.ST.slotF }, o));

  // 4) accessoires seuls (sans tige) : même dessin que tenu en main
  XXX.outil = (x, y, s, o) => { /* acc('outil', x, y, s, o) */ };

  // 5) décors : pré-rendus une fois, posés ensuite par M.flat / drawImage
  XXX.init = () => { XXX.K = { fond: M.withShadow(M.cutFlat(900, 600, 450, 590, () => { /* M.piece(…) */ }), 8) }; };
})();
```
Ce qui a coûté le plus de retours au Téflon, à régler dès le casting : main qui tient l'objet **par son corps** (doigts dessinés par-dessus), objet tenu **droit à l'écran par défaut** (`droit: true`), seconde main posée d'elle-même sur la seconde prise (`deuxMains`), points nommés (`XXX.pt(r, 'bec')`) pour qu'un plan place un filet, une goutte ou un fil sans calcul.

## 5. Planche de casting et tests obligatoires
`<video>/casting/scene.js` montre chaque élément créé sur scène (au repos, en marche, gestes clés, de profil dans les deux sens, objets tenus), plus :
1. **Bras pliés à fond, puis chaque geste de bras prévu par la fiche** (tendre, main à la poche, au chapeau, à la barbe, haussement d'épaules…), avec `M.ik`, coude bien visible, dans les deux directions (`dir` 1 et −1) ; le rendu ne doit afficher aucune ligne « ATTENTION coude à l'envers », « main derrière le dos » ni « pied à l'envers ». Montre aussi la marche et chaque pose de jambes prévue dans les deux directions : pointe des pieds vers l'avant, à plat. Une marionnette qui ne suit pas la convention du kit (bras le long de +y, avant-bras plié vers +x, pied pointé vers +x) reçoit `def.libre` pour ce membre, avec la raison dans `persos.md`. Puis épaule et coude de 0 à 2,4 rad, dans les deux sens, et bras levé qui brandit : articulation ronde, rivet au centre, aucune cassure.
2. **Série côte à côte** à l'échelle de la vidéo : couleurs nettement distinctes.
3. **Comparaison** : chaque nouveau personnage à la même échelle, côte à côte avec les personnages existants **nommés dans ta consigne** (et sinon tous ceux du kit et de la bibliothèque qui portent la même coiffe ou la même silhouette) : aucune ressemblance. Un doute (même chapeau, même carrure, mêmes couleurs) = change la coiffe, la silhouette ou la couleur dominante avant de continuer, et dis-le dans ton rapport. **Coiffure, favoris, barbe et tenue d'époque** : compare chaque personnage historique à son portrait connu (Frankenstein : Byron et Percy Shelley d'abord en cheveux courts modernes, repris avec mèches romantiques et favoris). Une créature ou un fantôme d'une vidéo qui doit faire peur n'a rien de mignon (ni grands yeux ronds, ni joues, ni sourire).
4. **Téléphone** : la planche réduite : chaque objet clé se lit.
5. **Prises** : chaque objet tenu, dans chaque main et chaque direction, agrandi (s ≈ 1,6, recadré sur la main) : la main entoure le bord, le corps ou le manche (doigts par-dessus), jamais un coin au bout des doigts ; un objet à partie mobile (clap, enveloppe à rabat, boîte) montré ouvert, à mi-course et fermé, la partie mobile suivie par une main ; un objet plat qu'on soupèse repose à plat sur la paume. Leçon Downey : clap et enveloppe mal tenus, relevés par l'utilisateur.
6. **Gestes expressifs** prévus (joie, surprise, refus) : chacun se lit seul, sans contexte (« que croit-on qu'il fait ? ») ; la joie = bras levés en V, menton levé.
7. **Décors récurrents** (FICHE B4) : chaque décor créé, plein cadre à l'échelle de la vidéo, avec ses trois couches, ses accessoires d'époque et ses animations d'ambiance qui tournent ; puis réduit en vignette de téléphone : il doit paraître habité et riche, jamais nu.

Commandes : `bash OUTILS/essai.sh <video>/casting 1,5` (prépare le dossier et rend la planche en une ligne ; la planche s'affiche à petite taille d'abord, puis gros plans des tests). 4 itérations au plus.

## 6. `persos.md`
Écris dans `persos.md`, pour chaque personnage, **le `bendSign` de `M.ik` pour chaque bras et chaque direction** (tableau : bras avant / arrière × `dir` 1 / −1), vérifié sur les tests de gestes. Remplis le gabarit `OUTILS/gabarits/persos.md` **après** la dernière itération, d'après le code réel (pas d'après ton intention) : chaque option citée existe, chaque taille est mesurée sur la planche. Une option que tu ajoutes ensuite à `persos.js` s'ajoute aussi à `persos.md`.

## 7. Rapport
Court : liste des fonctions créées (nom, options principales), chemin de la planche, ce qui reste fragile.
