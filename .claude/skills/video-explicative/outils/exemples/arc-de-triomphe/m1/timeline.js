// Minutage partagé entre l'animation (scene.js) et le son (mixage.py) — extrait m1 « Pas debout ».
// Voix off (BRIEFS, Plan 1/6) : « Napoléon a fait construire l'Arc de triomphe (0–2,4) pour y défiler en vainqueur. (2,5–4,6)
//  Il n'est passé sous le vrai (4,9–6,5) qu'une seule fois. (6,5–7,6) Et pas debout. (7,9–8,8) »
(function (g) {
  const TL = {};
  TL.EVENTS = {
    curtain0: 0.10, curtain1: 1.15,  // « Napoléon a fait » : le rideau s'ouvre en drapé
    arc0: 0.55, arc1: 1.65,          // « construire l'Arc de triomphe » : le vrai arc descend des cintres et se pose
    enter0: 1.35, enter1: 2.45,      // Napoléon glisse depuis la coulisse gauche, main dans le gilet
    walk0: 2.55, walk1: 4.40,        // « pour y défiler en vainqueur » : 4 pas cadencés vers le centre
    step1: 3.01, step2: 3.475, step3: 3.94, step4: 4.40, // talon au sol (fin de chaque petit saut)
    crowd0: 2.65, crowd1: 3.3,       // la foule (rêvée) monte de la fente arrière, drapeaux, chapeaux
    proud: 4.40,                     // « vainqueur » : arrêt, pose fière
    crowdSink0: 4.62, crowdSink1: 5.25, // la foule redescend sous la scène (le rêve s'efface)
    look0: 4.95, look1: 5.45,        // « Il n'est passé sous le vrai » : il lève les yeux vers l'arc, satisfait
    attn0: 6.55, attn1: 6.75,        // « qu'une seule fois » : garde-à-vous (petit écrasement), clac de talons à 6,72
    fall0: 8.00, fallLand: 8.45,     // « Et pas debout » : bascule raide en arrière (pivot aux talons) et s'écroule à plat sur le plancher, petit rebond + poussière de papier
    rodGone: 8.32,                   // l'opérateur lâche la tige : elle glisse sous la scène par la fente (aucun contact avec le corps)
    hatOff: 8.12,                    // le bicorne glisse de la tête…
    still: 9.0,                      // tout est stable (respiration, flammes)
  };
  // Mots-clés de la voix (aucun bruitage marqué dessus) : [début, fin] en secondes. « vrai » ≈ 5,9–6,5 (estimé).
  // « debout » (≈ 8,3–8,8) n'est PAS listé : la chute à plat (8,45) l'illustre exactement, et reste discrète (−28).
  TL.MOTS = [[5.9, 6.5]];
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
