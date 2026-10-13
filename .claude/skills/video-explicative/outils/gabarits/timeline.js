// Minutage partagé entre l'animation (scene.js) et les bruitages (mixage.py) — plan __PLAN__.
// Voix off (consigne du plan) : « … (0–1,4) … (1,6–3,0) … »  → recopier ici les fenêtres de chaque phrase.
(function (g) {
  const TL = {};
  TL.EVENTS = {
    rideau0: 0.10,   // le rideau commence à s'ouvrir (plan 1, et tout plan qui change de scène)
    rideau1: 1.20,   // rideau ouvert
    // geste0: 2.45, // « mot clé » : le geste clé tombe sur le mot (écart < 0,2 s)
    fixe: 9.0,       // toute action finie ; dernière seconde immobile (flammes et respiration seulement)
  };
  // Mots-clés de la voix (aucun bruitage marqué dessus) : [début, fin] en secondes
  TL.MOTS = [];
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
