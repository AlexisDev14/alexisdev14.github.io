// Minutage partagé entre l'animation (scene.js) et le son (mixage.py) — extrait m3 « Le chantier ».
// Voix off (BRIEFS, Plan 3/6) : « Problème : (0–0,8) un chantier pareil, ça prend des années. (1,0–3,4)
//  Or, en mille huit cent dix, (3,7–5,2) l'Empereur se marie. (5,3–6,4) Et le cortège doit passer sous l'arc. (6,7–8,4)
//  Immédiatement. (8,6–9,3) »
(function (g) {
  const TL = {};
  TL.EVENTS = {
    hit1: 0.85, hit2: 1.75, hit3: 2.75,   // l'ouvrier frappe la pierre au maillet (lentement)
    autumn: 1.05,    // les années passent : l'arbre d'été remonte aux cintres, l'arbre roux descend
    leaves0: 1.20,   // feuilles de papier qui tombent
    winter: 1.70,    // arbre nu enneigé ; la neige de papier tombe des cintres
    snow0: 1.70, snow1: 2.65,
    snowRow0: 1.78, snowRow1: 2.55,       // la ferme enneigée monte de la trappe, puis redescend
    spring: 2.50,    // bourgeons et fleurs
    swapDur: 0.32,
    block0: 0.20, blockLand: 3.05,        // le bloc de la chèvre descend… toute la durée des « années » (une seule assise)
    close0: 3.32, close1: 3.60,           // le rideau se ferme vite…
    open0: 3.72, open1: 4.08,             // … et se rouvre sur le printemps doré de 1810
    walk0: 3.78, walk1: 5.20,             // « Or, en 1810 » : le couple entre à gauche, bras dessus bras dessous
    heart0: 5.38, heart1: 5.72,           // « l'Empereur se marie » : un cœur de carton descend sur son fil
    smile: 5.30,
    heartUp0: 6.38, heartUp1: 6.72,       // le cœur remonte aux cintres
    offer0: 6.78, offer1: 7.12,           // « Et le cortège » : main ouverte tendue vers le chantier
    look0: 7.05, look1: 7.40,             // tout le monde regarde les fondations
    offerEnd: 8.40,
    cross0: 8.60, cross1: 8.84,           // « Immédiatement » : bras croisés
    stamp1: 9.22, stamp2: 9.40,           // deux tapes de pied (juste après le mot)
    sweat0: 8.72,                         // l'architecte sue
    drop: 9.26, dropLand: 9.52,           // l'ouvrier lâche son maillet
    still: 9.62,
  };
  // Mots-clés de la voix (aucun bruitage marqué dessus) : [début, fin]. « Problème », « marie », « Immédiatement » (les tapes de pied suivent le mot). Fenêtres estimées.
  TL.MOTS = [[0.0, 0.8], [5.9, 6.4], [8.6, 9.15]];
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
