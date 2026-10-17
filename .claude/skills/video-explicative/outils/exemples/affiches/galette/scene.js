// Affiche « La fève de la galette, le roi qui payait la tournée » : une seule image (t = 1,4 s). Rideau ouvert.
// Gontran, couronné de travers, joues gonflées, l'air innocent : il vient d'avaler... ; sous la table, le Petit
// fait un clin d'œil au public et montre la vraie fève : la figurine en porcelaine.
const SCENE = (() => {
  const S = {}, ST = M.ST, GAL = M.gal;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  const GX = 650, GS = 1.0;            // Gontran, centre-droite, regarde vers la gauche
  const PX = 400, PS = 0.95;           // le Petit, sous la table, à genoux, regarde vers la droite
  const ZX = 540, ZY = 1015, ZK = 1.3; // agrandissement d'ensemble de la scène (pieds de table 1388 → ≈ 1500)
  let BASE = null;                     // r.w rend des points écran (transformation d'ensemble comprise) : on les trace sans elle
  S.init = () => { GAL.init(); };
  // trait (liste de points dans le repère de la tête) dessiné à l'écran via r.w
  function trait(r, pts, col, lw) {
    const c = ctx(); c.save(); c.setTransform(BASE); c.beginPath();
    pts.forEach((p, i) => { const w = r.w('head', p[0], p[1]); (i ? c.lineTo : c.moveTo).call(c, w[0], w[1]); });
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = lw * ZK; c.strokeStyle = col; c.stroke(); c.restore();
  }
  function point(r, x, y, rad, col) { const c = ctx(), w = r.w('head', x, y); c.save(); c.setTransform(BASE); c.fillStyle = col; c.beginPath(); c.arc(w[0], w[1], rad * ZK, 0, M.TAU); c.fill(); c.restore(); }
  function arc(cx, cy, R, a0, a1, n) { const P = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; P.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } return P; }
  S.draw = (t) => {
    const c = ctx(); BASE = c.getTransform();
    // essai à blanc du Petit sans l'agrandissement : on garde la pose du bras arrière (main sur la cuisse),
    // que le placement automatique calcule en points écran et fausse sous l'agrandissement
    const pP = () => ({ t, tenu: 'figurine', tenuO: { echelle: 1.7, brille: 1 }, clin: 1, atteint: 1, face: { brow: 'up' },
      cible: [PX + 105, FEET - PS * 190] });
    c.save(); c.beginPath(); c.rect(0, 0, 0, 0); c.clip();
    const rP0 = GAL.petit(pP(), PX, FEET, PS, { dir: 1, cast }); c.restore();
    c.save(); c.translate(ZX, ZY); c.scale(ZK, ZK); c.translate(-ZX, -ZY);
    GAL.salle(t, 0, { epoque: 'moyenage' });
    M.drawFloor();
    const rG = GAL.gontran({ t, couronne: 1, couronneRot: 0.38, joues: 1, ventreTape: 1, bourse: true,
      face: { eyes: 'half', brow: 'up', mouth: 'tight' } }, GX, FEETB, GS, { dir: -1, slot: ST.slotB, cast });
    // joue gonflée : pli arrondi sous l'œil, ombre du rebond et reflet luisant
    trait(rG, arc(29, -27, 19, 2.2, 4.05, 10), 'rgba(140,60,50,0.7)', 2.2);
    trait(rG, arc(29, -27, 15, 2.5, 3.6, 6), 'rgba(255,245,235,0.55)', 2);
    point(rG, 27, -36, 4.2, 'rgba(255,250,240,0.75)');
    point(rG, 22, -30, 2.2, 'rgba(255,250,240,0.6)');
    const T = GAL.table(540, 1388, 1, { nappe: true, cast: { a: 0.3, dx: 16, dy: 6 } });
    GAL.galette(390, T.plateauY - 4, 0.72, { etat: 'entamee', miettes: 1 });
    // la figurine tenue devant la poitrine, bras avant plié vers l'avant ; clin d'œil, sourcil levé
    const pp = pP(); pp.ang = { armB_up: rP0.q.ang.armB_up, armB_lo: rP0.q.ang.armB_lo };
    const rP = GAL.petit(pp, PX, FEET, PS, { dir: 1, cast });
    // plis du clin d'œil au coin de l'œil fermé, fossette au coin du sourire malin
    trait(rP, [[5, -49], [0, -52]], 'rgba(60,30,20,0.85)', 1.8);
    trait(rP, [[5, -43], [0, -41]], 'rgba(60,30,20,0.85)', 1.8);
    trait(rP, [[13, -19], [10, -22], [10, -26]], 'rgba(130,50,45,0.95)', 2);            // coin du sourire relevé (en coin)
    trait(rP, [[11, -52], [18, -56], [25, -54]], 'rgba(120,55,25,0.95)', 2.4);         // sourcil levé au-dessus de l'œil fermé
    c.restore();
    M.stageLight(t, { spot: { x: 540, y: 1150, r: 700, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
