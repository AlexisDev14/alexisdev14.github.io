// Minutage partagé entre l'animation (scene.js) et les bruitages (mixage.py) — plan __PLAN__.
// Voix off (consigne du plan) : « … (0–1,4) … (1,6–3,0) … »  → recopier ici les fenêtres de chaque phrase.
(function (g) {
  const TL = {};
  TL.EVENTS = {
    // le rideau ne se règle PAS ici : il suit la conduite de la vidéo (<video>/rideau.json, M.rideau(t))
    // geste0: 2.45, // « mot clé » : le geste clé tombe sur le mot (écart < 0,2 s)
    fixe: 9.0,       // toute action finie (avec le dernier mot) ; ensuite immobile jusqu'à DUREE (duree.js : le plan dure sa voix)
  };
  // Mots-clés de la voix (aucun bruitage marqué dessus) : [début, fin] en secondes
  TL.MOTS = [];
  // Sauts voulus : instants (s) d'un geste discret prévu (objet posé, chapeau soulevé, couvercle qui claque) : sauts.py ne les signale pas
  TL.SAUTS = [];
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
