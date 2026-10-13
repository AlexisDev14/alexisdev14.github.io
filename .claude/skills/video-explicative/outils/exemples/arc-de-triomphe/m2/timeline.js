// Minutage partagé entre l'animation (scene.js) et le son (mixage.py) — extrait m2 « Austerlitz ».
// Voix off (BRIEFS, Plan 2/6) : « Mille huit cent six. (0–1,6) Napoléon vient de triompher à Austerlitz. (1,8–4,0)
//  Il commande un arc géant : (4,3–5,8) cinquante mètres de haut, (6,0–7,3) pour célébrer ses victoires. (7,4–8,6)
//  Modestement. (8,8–9,4) »   (« triompher » ≈ 2,45–2,95 ; « géant » ≈ 5,3–5,8)
(function (g) {
  const TL = {};
  TL.EVENTS = {
    curtain0: 0.10,  // « Mille huit cent six » : le rideau s'ouvre sur la colline en bandes de carton
    curtain1: 1.30,
    rows0: 0.15,     // les bandes de colline montent de la trappe, l'une après l'autre
    sun0: 0.35,      // le soleil d'Austerlitz monte sur son fil (derrière les collines)…
    sun1: 2.75,      // … et achève sa montée avec le poing (à gauche, loin de la tête)
    fist0: 2.25,     // petite anticipation
    fist: 2.50,      // « triompher » : poing levé
    fistDown: 3.80,  // le bras revient dans le gilet
    smoke0: 1.95,    // petites fumées de coton qui éclosent au loin (1,95 → 3,4)
    ar0: 4.30,       // « Il commande » : l'architecte glisse depuis la coulisse droite
    ar1: 4.95,
    bow: 5.00,       // il salue
    hold0: 5.20,     // il présente le rouleau devant lui
    unroll0: 5.28,   // premier déroulé : un petit croquis d'arc
    unroll1: 5.62,
    wide0: 5.30,     // « géant » : Napoléon ouvre grand les deux bras (« plus grand ! »)
    wide1: 5.55,
    lift0: 5.80,     // l'architecte lève le rouleau au-dessus de sa tête
    lift1: 6.02,
    up1: 6.05, up2: 6.40, up3: 6.75,   // « cinquante mètres de haut » : le papier monte par ressort, en trois à-coups, jusqu'aux cintres
    armsDown0: 6.45, armsDown1: 6.90,
    nod0: 7.45, nod1: 8.35, // « pour célébrer ses victoires » : il hoche la tête, ravi
    modest0: 8.80,   // « Modestement » : main dans le gilet, menton levé, yeux mi-clos
    modest1: 9.10,
    sweat0: 8.92,    // l'architecte transpire (goutte qui glisse, finie à 9,4)
    still: 9.40,
  };
  // Mots-clés de la voix (aucun bruitage marqué dessus) : [début, fin] en secondes. « triompher », « géant », « Modestement ».
  TL.MOTS = [[2.45, 2.95], [5.3, 5.8], [8.8, 9.4]];
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
