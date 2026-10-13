// Minutage partagé entre l'animation (scene.js) et le son (mixage.py) — extrait m4 « Le faux ».
// Voix off (BRIEFS, Plan 4/6) : « Alors on fabrique un faux. (0–1,4) En bois et en toile peinte, (1,6–3,0)
//  grandeur nature. (3,1–4,1) Les jeunes mariés défilent fièrement dessous. (4,4–6,8)
//  Surtout, ne pas s'appuyer. (7,1–8,6) »   (« appuyer » ≈ 8,05–8,6)
(function (g) {
  const TL = {};
  TL.EVENTS = {
    curtain0: 0.12,  // « Alors » : le rideau s'ouvre en drapé
    curtain1: 1.30,  // rideau ouvert (le bas des pans balance encore)
    present0: 1.55,  // l'architecte présente la trappe d'un geste
    flat0: 1.60,     // « En bois et en toile peinte » : le faux arc MONTE de la trappe (poulies)
    flat1: 2.85,     // il arrive en haut…
    settle: 3.10,    // « grandeur nature » : petit rebond, cordes tendues ; l'architecte acquiesce
    walk0: 4.40,     // « Les jeunes mariés » : le couple glisse depuis la coulisse droite
    walk1: 6.85,     // … ils glissent sous l'arche et s'arrêtent, Napoléon contre le jambage gauche
    petals0: 4.55, petals1: 7.2,
    reach0: 7.80,    // « ne pas s' » : Napoléon tend le bras vers le pilier
    touch: 8.15,     // « appuyer » : main à plat sur le jambage, la toile s'enfonce, tout le faux arc vacille
    release: 8.45,   // il retire la main
    facepalm: 8.50,  // l'architecte se cache les yeux
    still: 9.0,      // tout est stable (respiration et flammes seulement)
  };
  // Mots-clés de la voix (aucun bruitage marqué dessus) : [début, fin]. « appuyer » ≈ 8,05–8,6 (le craquement de la toile suit le mot).
  TL.MOTS = [[8.05, 8.6]];
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
