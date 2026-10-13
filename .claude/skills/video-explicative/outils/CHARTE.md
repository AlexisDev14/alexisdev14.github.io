# Charte « Théâtre de marionnettes à tiges »

À lire **en entier** par tout agent qui dessine, anime ou sonorise un plan. Référence de qualité : `exemples/arc-de-triomphe/` (6 plans validés par l'utilisateur).

## 1. Format
- 1080 × 1920, 30 im/s, 10,0 s par plan (300 images), H.264 yuv420p + AAC stéréo 192 kb/s.
- Voix off, sous-titres, carton de fin et logo : ajoutés au montage par l'utilisateur. **Aucun texte, lettre, chiffre ou logo dans l'image.** Seule exception : un texte explicitement demandé par l'utilisateur (ex. le titre d'un journal à l'image, « LE PETIT RÂLEUR »), orthographe exacte, police serif grasse d'époque.

## 2. Le théâtre (fourni par le kit, ne pas redessiner)
- Petit théâtre de papier vu de face, caméra fixe : cadre de scène en bois sombre et moulures dorées, lambrequin de velours à franges, rampe de lampes à huile (flammes qui vacillent), coquille du souffleur, plancher en lattes avec **deux fentes** (arrière `ST.slotB`, avant `ST.slotF`) d'où sortent les tiges.
- Rideau de velours rouge (`M.curtain`) : s'ouvre en drapé vers les côtés, le bas des pans balance avec retard.
- Lumière : faisceaux de projecteurs avec poussière, poursuite (`M.stageLight`), vignettage chaud et grain papier (`M.finish`, automatique).

## 3. Décors
- Tout est **carton peint découpé** : toiles de fond cousues en lés, nuages pendus à des fils, coulisses latérales (arbres, colonnes), fermes basses (rangée de toits, collines, vagues en bandes), praticables.
- Les décors **bougent toujours un peu** (balancement sur leurs fils, ondulation des bandes) et ont une ombre portée sur ce qui est derrière.
- Changer de lieu = **mécanique de théâtre visible** : décor qui monte de la trappe, descend des cintres sur ses câbles (avec rebond à l'arrivée), bascule et tombe, ou rideau qui se ferme puis se rouvre (≈ 1 s).
- Profondeur : fond plus pâle et désaturé, premier plan contrasté. Ne jamais boucher la scène : 2 ou 3 couches suffisent.
- **Extérieur = vivant** : toute scène en plein air a 1 à 3 touches de faune ou de flore au loin (API §4c) : un vol d'oiseaux dans le ciel, un chamois ou un troupeau qui passe sur une crête, une marmotte, des papillons, des poissons qui sautent, une bande de fleurs qui ondulent. Adaptées au lieu et à l'époque (mouettes à la mer, chamois en montagne, pas de perroquet en Savoie). Petites, pâlies par la brume, posées sur un relief, **muettes** ; jamais devant un visage, jamais pendant le geste clé au même endroit, rien dans le coin du logo. Elles décorent, elles ne racontent pas (sauf si la fiche en fait un gag).
- Monuments et objets réels : **proportions vraies** (l'Arc de triomphe ≈ 45 m de large pour 50 m de haut). Pour dire « plus grand », c'est le support (feuille, décor) qui grandit, jamais l'objet qui se déforme.

## 4. Marionnettes
- Papier découpé **de profil**, proportions adultes (~1/6 de tête), traits fins, hachures de gravure, palette sourde (bleu nuit, vert éteint, ocre, ivoire, rouge sang, or vieilli), liseré blanc de découpe, ombre portée sur le décor.
- Membres articulés par **rivets en laiton visibles** ; une **tige en bois** part du corps et descend dans une fente du plancher ; un fil secondaire peut tenir une main qui travaille.
- Jeu de marionnette : petits sautillements en marchant (glissement le long de la fente), balancement, légère inclinaison dans le mouvement, rotation des membres autour des rivets, respiration (oscillation 1–2 px). **Jamais figé**, même dans la dernière seconde (flammes, respiration).
- Gestes **lisibles de profil** : main dans le gilet, poing sur la hanche, bras tendu main ouverte, tape du pied, salut, mains devant les yeux. À éviter : bras croisés (illisible de profil, se lit « bras sur le ventre »), doigt tendu seul (interdit).
- Taille : personnage principal ≥ 450 px debout ; visage jamais caché par un objet ou un autre personnage au moment où il réagit.
- **Accessoires** (couteau, fourchette, seau, gobelet, outils…) : pas obligés d'avoir une tige ; ils peuvent « voler » sur scène pour un mouvement fluide (« on peut tricher »). Les marionnettes, elles, gardent leurs tiges.
- Un objet emblématique (chapeau, outil, accessoire) est dessiné **par la même fonction** dans tous les plans, et agrandi (×1,2 à ×1,4) quand il porte le gag.

## 5. Mise en scène
- **Le rideau a une conduite pour toute la vidéo** (`<video>/rideau.json`, API §4b), décidée dans la fiche, plan par plan :
  - **début** : le plan 1 s'ouvre sur le rideau (0,1 → ≈ 1,2 s) ;
  - **changement de lieu ou d'époque** entre deux plans : `change` à cheval sur la coupe (fermeture ≈ 9,4 → 9,95 s du plan N, fermé pendant la coupe, réouverture ≈ 0,15 → 0,85 s du plan N+1) ; la voix continue rideau fermé. Ou bien machinerie (décor qui monte/descend) si le lieu reste le même théâtre ;
  - **changement à l'intérieur d'un plan** : `change` (≈ 1,1–1,4 s en tout, fermé ≤ 0,3 s) ou machinerie ;
  - **ellipse de temps sans changer de lieu** (« plus tard », « des siècles plus tard ») : `demi` (les pans se resserrent à moitié et se rouvrent, ≈ 1,2 s) ;
  - **même lieu, action continue** : rien, le rideau reste ouvert à travers la coupe ;
  - **fin de la vidéo** : le rideau **se ferme après la chute** du dernier plan (≈ 9,0 → 9,85 s), une fois le gag vu ; dernière image rideau fermé.
- Le rideau n'est **jamais** en mouvement sur un mot-clé dont l'image compte, ni devant le geste clé ou le gag ; au plus 2 mouvements de rideau par plan ; pas deux `change` dans deux coupes consécutives (varier avec la machinerie ou `demi`).
- Le geste clé tombe sur le mot clé de la voix (écart < 0,2 s) ; le gag arrive avec la chute, jamais avant.
- Anticipation → action → rebond (ressorts amortis), durées minimales : geste 0,3 s, expression 0,6 s, gag 1,5–2 s. Une action principale à la fois.
- Toute action finie à 9 s (au plus tard 9,6 s si un bruitage doit suivre le dernier mot) ; puis image stable, ou fermeture du rideau si la conduite la prévoit.
- Caméra fixe (le théâtre ne bouge pas). Seul mouvement permis : un recul lent unique (zoom 1,1 → 1,0) pour révéler un décor.

## 6. Cadrage TikTok
- Action importante (visages, gags, objets clés) entièrement dans **x 60–930, y 150–1430**.
- y > 1430 : plancher, rampe, souffleur seulement (sous-titres). x > 930 : décor seulement (boutons). Coin haut gauche (x < 220, y < 220) calme (logo).

## 7. Bruitages (voir `sfx_lib.py`)
- **Seulement des bruitages d'action**, liés à ce qu'on voit. Pas de fond sonore continu, pas de musique, pas de voix.
- Toujours sonoriser : **le rideau** (automatique : `m.rideau_conduite()`, y compris un mouvement à cheval sur la coupe), **décors qui changent** (`decor_monte`, `decor_descend`, `decor_tombe`), **marionnettes qui apparaissent ou partent** (`apparition`, `disparition`, `glisse` avec les sautillements), plus les **détails** visibles : pas, objet posé, chute, papier, maillet… La faune lointaine est muette ; un animal au premier plan qui fait une vraie action visible (meuglement, coq) peut avoir un son très bas. Une ambiance de lieu (`ambiance('vent' | 'ressac' | 'vent_herbe' | 'sabots_neige', …)`) seulement si elle se voit (neige, mer) et très basse.
- **Pas fort, juste ce qu'il faut** : préréglages déjà calibrés (principal ≈ −28 dBFS, détails −33 à −40), plafond global −24 dBFS. Ne pas monter les niveaux.
- Aucun bruitage marqué sur un mot-clé de la voix (`TL.MOTS`, contrôlé par `Mix.verifier()`), sauf s'il illustre exactement ce mot et reste ≤ −32.
- 3 à 8 bruitages par plan. Sons organiques = échantillons CC0 de `sons/` (licences dans `sons/LICENCES.md`) ; synthèse pour velours, anneaux, poulies, clacs.

## 8. Erreurs déjà commises (à vérifier à chaque plan)
- Marionnette à l'horizontale **au bout de sa tige** (on dirait que la tige « rentre dans les fesses ») → une chute finit **à plat sur le plancher**, la tige est lâchée et redescend par la fente avant l'impact.
- Monument étiré / mal proportionné (l'arc dessiné en bande verticale) → proportions vraies, c'est la feuille qui grandit.
- L'objet du gag absent au moment clé (place d'honneur vide sans le bicorne) → le spectateur doit comprendre **qui** manque : montrer son objet emblématique.
- Foule qui masque les piliers ou le décor clé → deux groupes latéraux, plus bas ou plus pâles.
- Ornements dorés qui ressemblent à des lettres ; croisillons qui font des « fenêtres » sur un monument.
- Objet qui tombe sur une tête, qui passe devant un visage qui réagit.
- Personnage allongé ou en sortie coupé par le rideau ou le cadre.
- Bras croisés de profil (illisibles) ; doigt seul tendu.
- Personnage trop petit ou trop loin ; action cachée par la zone des sous-titres.
- Image qui contredit la phrase entendue ; anachronisme (tour Eiffel avant 1889, objets d'une autre époque).
- Objet trop gros qui écrase la scène (fromage géant) ; part découpée en bloc informe → une part se lit comme un **coin triangulaire** pointe vers le centre, faces coupées couleur pâte ; ustensile mal dessiné (couteau qui ressemble à une spatule) → lame effilée + manche distinct, sans tige.
- Objet mal tenu (gobelet tenu par le bord, couché, ouverture vers l'extérieur) → la main **entoure le corps** de l'objet, ouverture vers le haut ou vers la bouche quand il boit ; objet posé qui flotte ou cache les jambes.
- Changement de posture trop abrupt (se rasseoir « d'un bond », reprise du travail sèche) → enchaîner par étapes lisibles (se tourner, se pencher, s'asseoir, reprendre les mains au travail) sur 0,8–1,2 s, avec anticipation et ralenti en fin de geste.
- Coude ou épaule cassés (avant-bras qui ne raccorde pas au bras, manche qui se détache quand le bras est plié ou levé) → bras et avant-bras se recouvrent sur une **articulation ronde**, rivet au centre du pivot ; tester les flexions de 0 à 2,4 rad dans les deux sens au casting.
- Objets d'une même série qui se confondent (conteneurs du tri distingués par un simple liseré) → chaque objet **entièrement** de sa couleur, nettement différente (ex. vert éteint / ocre / bleu ardoise).
- Éléments clés trop petits en vignette (tas d'ordures en bande au ras du sol, rats minuscules, boîtes cachées par un meuble) → dimensionner pour le téléphone : l'objet du mot-clé se lit en 1 s, dégagé, à ≥ 120 px.
- Caricature ou dessin dans l'image qui n'associe pas clairement le personnage à son objet → montrer le personnage reconnaissable (barbe, chapeau) DANS ou AVEC l'objet.
- Bruitage qui tombe sur un mot-clé ; bruitage trop fort ; son sans action visible.
- Animal lointain qui flotte dans le ciel ou sur la toile (pas de relief sous ses pieds) ; faune qui attire l'œil pendant le geste clé.
- Rideau qui bouge pendant un gag ou sur un mot-clé ; raccord de rideau faux à la coupe (plan qui ne commence pas dans l'état où le précédent finit) → toujours `M.rideau(t)` + `rideau.json`, jamais un rideau codé à la main.

## 9. Contrôle avant livraison d'un plan
1. `planche.png` (16 images sur 10 s) regardée en entier ; gros plans (`planche.sh --de A --a B --crop …`) sur le geste clé, la chute, les mains, les tiges, les bords.
2. Chaque point de la section 8 vérifié.
3. `verifier.sh` tout « OK » (format, durée, son, crête ≤ −22).
4. Raccord de rideau : première image du plan = dernière image du plan précédent pour le rideau (ouvert, fermé ou en mouvement).
