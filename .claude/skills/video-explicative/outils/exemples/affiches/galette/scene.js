// Affiche « La fève de la galette, le roi qui payait la tournée » : une seule image (t = 1,4 s). Rideau ouvert.
// Cadrage serré (×1,6) : Gontran (tête B, barbu : joues pleines, regard en coin coupable), roi de travers, main sur le ventre :
// il vient d'avaler la fève... Sous la table, le Petit fait un clin
// d'œil au public et montre la vraie fève : la figurine en porcelaine.
const SCENE = (() => {
  const S = {}, ST = M.ST, GAL = M.gal;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  const ZX = 540, ZY = 923, ZK = 1.6;   // agrandissement d'ensemble (repère local → écran : Z + ZK·(p − Z))
  const GX = 578, GS = 1.0;             // Gontran : écran x ≈ 600, sommet de la couronne ≈ 790
  const PX = 365, PS = 1.0;             // le Petit, sous la table, à gauche, tourné vers la droite
  let BASE = null;                      // r.w rend des points écran (agrandissement compris) : on les trace sans lui
  S.init = () => { GAL.init(); };
  const tr = (r, p) => r.w('head', p[0], p[1]);
  function trait(r, pts, col, lw) {
    const c = ctx(); c.save(); c.setTransform(BASE); c.beginPath();
    pts.forEach((p, i) => { const w = tr(r, p); (i ? c.lineTo : c.moveTo).call(c, w[0], w[1]); });
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = lw * ZK; c.strokeStyle = col; c.stroke(); c.restore();
  }
  function forme(r, pts, col) {
    const c = ctx(); c.save(); c.setTransform(BASE); c.beginPath();
    pts.forEach((p, i) => { const w = tr(r, p); (i ? c.lineTo : c.moveTo).call(c, w[0], w[1]); });
    c.closePath(); c.fillStyle = col; c.fill(); c.restore();
  }
  function point(r, x, y, rad, col) { const c = ctx(), w = tr(r, [x, y]); c.save(); c.setTransform(BASE); c.fillStyle = col; c.beginPath(); c.arc(w[0], w[1], rad * ZK, 0, M.TAU); c.fill(); c.restore(); }
  function arc(cx, cy, R, a0, a1, n) { const P = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; P.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } return P; }
  S.draw = (t) => {
    const c = ctx(); BASE = c.getTransform();
    // la cible d'atteinte est lue en points écran : sous l'agrandissement on la donne déjà agrandie (Zp)
    const Zp = (p) => [ZX + ZK * (p[0] - ZX), ZY + ZK * (p[1] - ZY)];
    const CIB = [PX + 100 * PS, FEET - 150 * PS];
    const pP = (zoom) => ({ t, tenu: 'figurine', tenuO: { echelle: 1.1, brille: 1 }, clin: 1, atteint: 1, face: { brow: 'up' },
      cible: zoom ? Zp(CIB) : CIB });
    // essai à blanc du Petit sans agrandissement : la pose de son bras arrière (main sur la cuisse) est calculée en points écran
    c.save(); c.beginPath(); c.rect(0, 0, 0, 0); c.clip();
    const rP0 = GAL.petit(pP(false), PX, FEET, PS, { dir: 1, cast }); c.restore();

    c.save(); c.translate(ZX, ZY); c.scale(ZK, ZK); c.translate(-ZX, -ZY);
    GAL.salle(t, 0, { epoque: 'moyenage' });
    M.drawFloor();
    c.fillStyle = 'rgba(18,10,6,0.30)'; c.fillRect(-200, -200, 1500, 2400);       // salle assombrie : les personnages se détachent
    const rG = GAL.gontran({ t, couronne: 1, couronneRot: 0.44, joues: 1, ventreTape: 1, bourse: true, regardCoin: true, face: { brow: 'worry' } }, GX, FEETB, GS, { dir: -1, slot: ST.slotB, cast });
    const T = GAL.table(540, 1388, 1, { nappe: true, cast: { a: 0.3, dx: 16, dy: 6 } });
    GAL.galette(375, T.plateauY - 4, 0.55, { etat: 'entamee', miettes: 1 });
    const pp = pP(true); pp.ang = { armB_up: rP0.q.ang.armB_up, armB_lo: rP0.q.ang.armB_lo };
    const rP = GAL.petit(pp, PX, FEET, PS, { dir: 1, cast });
    c.restore();

    // le Petit, malicieux et content : joue rose, œil fermé en arc net, sourcil arqué levé, sourire en coin marqué
    point(rP, 17, -27, 7.5, 'rgba(235,120,110,0.45)');
    forme(rP, [[6, -47], [22, -49], [22, -43], [6, -42]], '#efcfae');                                  // efface l'œil du kit
    trait(rP, [[7, -47], [11, -43], [15, -41.5], [19, -43], [23, -47]], 'rgba(30,18,14,0.95)', 2.6);  // œil fermé, arc vers le bas
    trait(rP, [[7, -47], [5, -49]], 'rgba(30,18,14,0.95)', 1.8);                                     // cil
    trait(rP, [[8, -51.5], [12, -55.5], [18, -57], [24, -55]], 'rgba(85,38,16,1)', 2.8);          // sourcil arqué levé
    trait(rP, [[27, -19], [21, -16], [15, -17], [11, -21], [9, -26]], 'rgba(130,50,45,0.95)', 2.4); // sourire en coin
    trait(rP, [[9, -26], [7, -25]], 'rgba(130,50,45,0.8)', 1.6);                                    // fossette
    M.stageLight(t, { spot: { x: 580, y: 1150, r: 540, a: 0.42 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
