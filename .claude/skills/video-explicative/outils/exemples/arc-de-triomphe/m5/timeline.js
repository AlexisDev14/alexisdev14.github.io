// Minutage partagé entre l'animation (scene.js) et le son (mixage.py) — extrait m5 « Sans lui ».
// Voix off (BRIEFS, Plan 5/6, instants retenus) : « Puis l'Empire s'effondre. (0–1,5) Napoléon part en exil (1,7–2,9)
//  et meurt à Sainte-Hélène. (3,0–4,5) L'arc, lui, est inauguré en mille huit cent trente-six. (4,8–7,6)
//  Sans lui. (7,9–8,4) Évidemment. (8,6–9,3) »
(function (g) {
  const TL = {};
  TL.EVENTS = {
    shiver: 0.35,      // « Puis l'Empire » : les colonnes frémissent, craquement
    collapse: 0.78,    // « s'effondre » : la corde de la tenture lâche, la couronne tombe…
    colFall0: 0.86, colFall1: 1.28, // … les colonnes basculent vers l'extérieur
    crownLand: 1.12,   // la couronne touche le plancher
    sinkGuard: 0.9,    // les grenadiers sont descendus sous la scène
    close0: 1.45, close1: 1.82,     // le rideau se ferme (vite)
    swap: 1.9,         // changement de décor derrière le rideau
    open0: 2.0, open1: 2.42,        // et se rouvre sur la mer
    rock0: 2.05, rock1: 2.75,       // le rocher monte de la trappe avec Napoléon (« part en exil »)
    hat0: 3.05, hat1: 3.35, hat2: 3.85, hat3: 4.05, // « et meurt » : il ôte le bicorne et le pose sur le rocher
    sink0: 4.0, sink1: 4.6,         // la marionnette se couche et descend derrière le rocher (sobre)
    sun0: 2.1, sun1: 4.6,           // le soleil (sur son fil) se couche derrière les vagues
    fly0: 4.6, fly1: 5.35,          // changement par les cintres : toile du couchant qui monte, mer et rocher qui descendent
    arc0: 4.85, arc1: 5.85,         // « L'arc, lui » : le vrai arc descend des cintres (pose à 5,85)
    crowd0: 5.9, crowd1: 6.55,      // « inauguré » : la foule de marionnettes monte, drapeaux
    rod0: 7.12, rod1: 7.45,         // une tige vide monte au centre, à la place d'honneur
    bic0: 7.2, bicLand: 7.8,        // le bicorne descend des cintres sur son fil et se pose sur la tige vide (juste avant « Sans lui »)
    hook0: 8.02, hook1: 8.45,       // le crochet du fil se décroche et remonte dans les cintres
    spot0: 7.75, spot1: 8.25,       // « Sans lui » : la poursuite se resserre sur le bicorne posé sur la tige
    crown0: 8.6, crown1: 9.15,      // « Évidemment » : une couronne de laurier descend au-dessus du bicorne… sans tête dessous
    still: 9.3,
  };
  // Mots-clés de la voix (aucun bruitage marqué dessus) : [début, fin]. « Sans lui », « Évidemment ».
  TL.MOTS = [[7.9, 8.4], [8.6, 9.3]];
  if (typeof module !== 'undefined') module.exports = TL; else g.TL = TL;
})(this);
