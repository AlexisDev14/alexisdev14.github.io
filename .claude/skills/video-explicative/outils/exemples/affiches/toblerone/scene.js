// Affiche « Le Toblerone, des danseuses plutôt que le Cervin » (vidéo refaite) : une seule image, rideau ouvert.
// Le cabaret enrichi (M.dec.cabaret / cabaretAvant) ; la pyramide des six danseuses, la reine du sommet porte la barre et fait un clin d'œil ;
// Tobler, à gauche, ébahi, poing à la moustache ; à droite la tour Eiffel (devant le velours) et, au-dessus, le Cervin vexé, suspendu à ses fils.
const SCENE = (() => {
  const S = {}, ST = M.ST, TOB = M.tob;
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  const GX = 545, GY = ST.back + 4, GS = 0.88, DS = 0.53 * GS;   // pyramide
  const EF = { x: 850, y: 1312, s: 0.8 };                          // tour Eiffel
  const CV = { x: 815, y: 952, s: 0.52 };                          // Cervin suspendu
  const TX = 205, TS = 0.95, MOU = [70, -32];                       // Tobler ; poing au bout de la moustache (repère de la tête)
  S.init = () => { TOB.init(); M.dec.init(); };
  function etincelle(x, y, r, a) {
    const c = M.ctx(); c.save(); c.translate(x, y); c.globalAlpha = a; c.fillStyle = '#fff3c4'; c.strokeStyle = '#b39250'; c.lineWidth = 1.6;
    c.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; c.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    c.closePath(); c.fill(); c.stroke(); c.restore();
  }
  // bras en V (angles des plans 4 et 6 : aucun bras derrière le dos), jambe levée en option (plan 4)
  const dp = (t, k, j, ex) => Object.assign({ t, tilt: -0.2 * j, handF: 'fist', handB: 'fist',
    ang: { armF_up: -2.35, armF_lo: -0.22, armB_up: -3.1, armB_lo: 0, head: -0.08 - 0.1 * j, legF: -0.78 * j } }, ex);

  S.draw = (t) => {
    const c0 = M.ctx();
    M.dec.cabaret(t, { nuit: 0, eiffel: 0 });
    M.flat(TOB.K.eiffel, EF.x, EF.y, { scale: EF.s, cast: { dx: 18, dy: 8, a: 0.3 } });
    // le Cervin, vexé, suspendu à ses fils (avant la pyramide : il ne couvre personne)
    c0.save(); c0.strokeStyle = 'rgba(232,214,176,0.6)'; c0.lineWidth = 1.8;       // deux fils clairs jusqu'aux cintres
    for (const [fx, fy] of TOB.CERVIN.fils) { c0.beginPath(); c0.moveTo(CV.x + fx * CV.s, 0); c0.lineTo(CV.x + fx * CV.s, CV.y + fy * CV.s); c0.stroke(); }
    c0.restore();
    TOB.cervin(t, CV.x, CV.y, CV.s, { descente: 1, fils: false, humeur: 1, affaisse: 0.35, regard: -0.7, balance: 0, cast: { a: 0.3, dx: 14, dy: 6 } });
    M.drawFloor();
    M.dec.cabaretAvant(t, { nuit: 0 });
    // la pyramide
    TOB.gradins(GX, GY, GS, { cast: { a: 0.35, dx: 16, dy: 6 } });
    const dirs = [-1, 1, 1, -1, 1, -1];      // la reine du sommet se tourne vers Tobler
    let topR = null;
    for (const k of [5, 3, 4, 0, 1, 2]) {
      const [px, py] = TOB.place(k, GX, GY, GS), sol = k < 3;
      const y = sol ? FEET : py;
      const pose = k === 5 ? { t, porte: 1, clin: 1 } : dp(t, k, sol ? 1 : 0);
      const r = TOB.danseuse(k + 1, pose, px + (k === 5 ? 50 * GS * -dirs[k] : 0), y, DS, { dir: dirs[k], slot: sol ? ST.slotF : py + 8, cast });
      if (k === 5) topR = r;
    }
    // Tobler, ébahi, poing à la moustache (geste « perplexe » : coude plié vers l'avant)
    // (dessin à blanc sous un clip vide pour lire la tête, puis IK du bras avant vers le bout de la moustache : la bouche reste dégagée)
    const base = () => ({ t, handF: 'fist', ang: { head: -0.06 }, face: { brow: 'up', mouth: 'o', eyes: 'wide' } });
    const c = M.ctx(); c.save(); c.beginPath(); c.rect(0, 0, 0, 0); c.clip();
    const r0 = TOB.tobler(base(), TX, FEET, TS, { dir: 1, slot: ST.slotF });
    c.restore();
    const ik = M.ik(M.chars.tobTobler, TOB.toblerPose(base()), TX, FEET, TS, 1, 'armF', r0.w('head', MOU[0], MOU[1]), 1);
    const pT = base(); pT.ang.armF_up = ik.up; pT.ang.armF_lo = ik.lo;
    TOB.tobler(pT, TX, FEET, TS, { dir: 1, slot: ST.slotF, cast });
    if (topR) { const pc = TOB.pt(topR, 'sommet'); if (pc) etincelle(pc[0] + 8, pc[1] - 40, 18, 0.9); }
    M.stageLight(t, { spot: { x: 540, y: 1150, r: 620, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
