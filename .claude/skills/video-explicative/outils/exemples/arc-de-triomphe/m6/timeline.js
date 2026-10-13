// Minutage partagé entre l'animation (scene.js) et le son (mixage.py) — extrait m6 « Même mort ».
// Voix off (BRIEFS, Plan 6/6) : « Mille huit cent quarante. (0–1,6) Le cortège funèbre passe sous l'Arc. (1,8–3,8)
//  Napoléon a eu son défilé. (4,0–5,8) Moralité : (6,1–6,8) un chantier parisien finit toujours par vous accueillir. (6,9–9,0)
//  Même mort. (9,1–9,7) »
(function (g) {
  const TL = {};
  TL.EVENTS = {
    enter0: 1.45,     // le char funèbre entre par la coulisse droite (têtes des chevaux visibles vers 1,6 s)
    stop: 4.0,        // « … sous l'Arc » fini : le char s'arrête devant l'arche, petit balancement
    salute0: 4.85,    // « son défilé » : la foule porte la main au chapeau…
    salute1: 5.08,    // … le soulève…
    salute2: 5.45,    // … et le lève (salut)
    zoom0: 5.8,       // recul lent de la caméra + la lumière s'ouvre sur l'arc entier
    zoom1: 9.0,
    snowEnd: 9.3,     // le sac à neige des cintres est vide : derniers flocons posés
    hop0: 9.14,       // « Même » : le bicorne se tasse (anticipation)…
    hopUp: 9.32,      // … décolle sur sa tige…
    hopLand: 9.6,     // … et retombe un peu de travers (« pop » juste après « mort »)
    still: 9.7,
  };
  // Mots-clés de la voix (aucun bruitage marqué dessus) : [début, fin]. « Même mort » ≈ 9,1–9,55 (le « pop » du bicorne suit le mot).
  TL.MOTS = [[9.1, 9.55]];
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
