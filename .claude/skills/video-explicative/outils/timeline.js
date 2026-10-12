// Minutage partagé entre l'animation (index.html) et le son (mixage.py lit timeline.json).
// Chaque instant clé est calé sur un mot de la voix off.
(function (g) {
  const TL = {};
  TL.EVENTS = { pop: 1.0 };   // exemple : { portrait: 5.0, gag: 7.6, ... }
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
