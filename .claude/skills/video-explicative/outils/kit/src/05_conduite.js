
// ---------------------------------------------------------------- conduite du rideau (toute la vidéo)
// Le rideau est piloté sur toute la vidéo par UNE conduite (<travail>/rideau.json, copiée dans chaque plan
// par construire.sh sous forme de rideau.js) : chaque plan lit sa tranche [DEBUT, DEBUT + DUREE] (durée du plan = durée
// de sa voix, <travail>/durees.json ; une cue peut aussi porter "plan": N, ses temps sont alors ceux du plan N). Un mouvement peut
// donc chevaucher la coupe entre deux plans : mis bout à bout, le rideau (et son bruitage) ne fait qu'un geste.
// Repères : temps GLOBAUX en secondes (plan N à t s = début du plan N + t), ou locaux avec "plan": N. Repères possibles :
//   { type:'ouvre',  a, b }                 0 → 1
//   { type:'ferme',  a, b }                 → 0 (fin de vidéo : se ferme après la chute)
//   { type:'change', a, b, c, d, id }       ferme a→b, reste fermé b→c (on change le décor), rouvre c→d
//   { type:'demi',   a, b, c, d, k:0.45, id } les pans se resserrent jusqu'à k puis se rouvrent (ellipse, « plus tard »)
// M.rideauAt(t) → { f, swing, T, ferme } ; M.rideau(t) dessine le rideau (remplace M.curtain dans scene.js) ;
// M.rideauApres(t, id) → vrai une fois passé le milieu de l'intervalle fermé du repère id (instant du changement de décor).
M.conduite = function (cues, o = {}) {
  const segs = [], marks = {};
  let cur = o.depart == null ? 0 : o.depart;
  const seg = (a, b, to) => { segs.push({ a, b, from: cur, to }); cur = to; };
  for (const q of [...cues].sort((p, r) => p.a - r.a)) {
    if (q.type === 'ouvre') seg(q.a, q.b, 1);
    else if (q.type === 'ferme') seg(q.a, q.b, 0);
    else if (q.type === 'change') { seg(q.a, q.b, 0); seg(q.c, q.d, 1); }
    else if (q.type === 'demi') { seg(q.a, q.b, q.k == null ? 0.45 : q.k); seg(q.c, q.d, 1); }
    if (q.id) marks[q.id] = q.c != null ? (q.b + q.c) / 2 : q.b;
  }
  const f0 = o.depart == null ? 0 : o.depart;
  const fAt = (T) => {
    let f = f0;
    for (const s of segs) { if (T < s.a) break; f = T >= s.b ? s.to : M.lerp(s.from, s.to, M.ease((T - s.a) / (s.b - s.a))); }
    // arrivée « à la main » : les pans dépassent à peine leur point d'arrivée puis se posent (rebond amorti, ≈ 0,5 s).
    // Fermé, les deux pans se pressent l'un contre l'autre (f < 0) puis se détendent sans jamais rouvrir de fente (≥ 2 px de recouvrement).
    let last = null; for (const s of segs) { if (T >= s.b) last = s; else break; }
    if (last && T - last.b < 0.8) f += M.wob(T, last.b, 0.025 * (last.to - last.from), 1.6, 6);
    return f;
  };
  const etat = (T) => {
    const f = fAt(T), h = 0.02, vel = (fAt(T + h) - fAt(T - h)) / (2 * h);
    let swing = -vel * 11;                                             // le bas des pans traîne derrière le mouvement
    for (const s of segs) if (T > s.b) swing += M.wob(T, s.b, 24 * (s.to - s.from), 0.9, 2.8);   // puis balance et se pose
    return { f, swing, T, ferme: f < 0.03 };
  };
  return { segs, marks, etat, fAt };
};
M.PLAN = M.PLAN || 1;
M.RIDEAU = M.RIDEAU || null;
M.debut = function () { return M.DEBUT != null ? M.DEBUT : (M.PLAN - 1) * 10; };
M.rideauAt = function (t) {
  const T = M.debut() + t;
  return M.RIDEAU ? M.RIDEAU.etat(T) : { f: 1, swing: 0, T, ferme: false };
};
M.rideau = function (t, o = {}) { const r = M.rideauAt(t); M.curtain(t, r.f, Object.assign({ swing: r.swing }, o)); return r; };
M.rideauApres = function (t, id) {
  const T = M.debut() + t, m = M.RIDEAU && M.RIDEAU.marks[id];
  if (m == null) throw new Error('repère de rideau inconnu : ' + id);
  return T >= m;
};
