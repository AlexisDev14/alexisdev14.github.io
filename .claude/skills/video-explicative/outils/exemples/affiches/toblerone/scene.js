// Affiche « Le Toblerone, des danseuses plutôt que le Cervin » : une seule image. Rideau ouvert.
// Les Folies Bergère : la pyramide de six danseuses, la reine du sommet porte la barre et fait un clin d'œil ;
// Tobler, à gauche, ébahi, la main à la moustache ; le Cervin, à droite, suspendu à ses fils, boude.
const SCENE = (() => {
  const S = {}, ST = M.ST, TOB = M.tob;
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  const GX = 610, GY = ST.back + 4, GS = 0.9, DS = 0.53 * GS;   // pyramide un peu à droite, un peu plus petite
  let topR = null;
  S.init = () => { TOB.init(); M.dec.init(); };
  function etincelle(x, y, r, a) {
    const c = M.ctx(); c.save(); c.translate(x, y); c.globalAlpha = a; c.fillStyle = '#fff3c4'; c.strokeStyle = '#b39250'; c.lineWidth = 1.6;
    c.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; c.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    c.closePath(); c.fill(); c.stroke(); c.restore();
  }
  S.draw = (t) => {
    M.dec.cabaret(t, 0, { p: 1, lampes: 1 });
    // le Cervin, vexé, suspendu à ses fils, à droite (dessiné avant la pyramide : il ne couvre personne)
    TOB.cervin(t, 812, 1020, 0.54, { descente: 1, fils: true, humeur: 1, affaisse: 1, regard: -0.6, cast: { a: 0.3, dx: 14, dy: 6 } });
    M.drawFloor();
    // la pyramide
    TOB.gradins(GX, GY, GS, { cast: { a: 0.35, dx: 16, dy: 6 } });
    const dirs = [-1, 1, 1, -1, 1, -1];      // la reine du sommet se tourne vers Tobler
    for (const k of [5, 3, 4, 0, 1, 2]) {
      const [px, py] = TOB.place(k, GX, GY, GS), sol = py >= GY - 1;
      const y = sol ? FEET : py;
      const pose = k === 5 ? { t, porte: 1, clin: 1 } : { t, bras: 1 };
      const r = TOB.danseuse(k + 1, pose, px + (k === 5 ? 50 * GS : 0), y, DS, { dir: dirs[k], slot: sol ? ST.slotF : py + 8, cast });
      if (k === 5) topR = r;
    }
    // Tobler, ébahi, la main à la moustache
    const TX = 245, TS = 1.0, base = { t, handF: 'fist', ang: { head: -0.08 }, face: { brow: 'up', mouth: 'o', eyes: 'wide' } };
    const c = M.ctx(); c.save(); c.beginPath(); c.rect(0, 0, 0, 0); c.clip();
    const r0 = TOB.tobler(JSON.parse(JSON.stringify(base)), TX, FEET, TS, { dir: 1, slot: ST.slotF, cast });
    c.restore();
    const q = TOB.toblerPose(JSON.parse(JSON.stringify(base)));
    const ik = M.ik(M.chars.tobTobler, q, TX, FEET, TS, 1, 'armF', r0.w('head', 58, -26), 1);   // poing au bout de la moustache, devant la bouche dégagée
    TOB.tobler(Object.assign({}, base, { ang: { head: -0.08, armF_up: ik.up, armF_lo: ik.lo } }), TX, FEET, TS, { dir: 1, slot: ST.slotF, cast });
    if (topR) { const pc = TOB.pt(topR, 'centre'); if (pc) etincelle(pc[0] + 20, pc[1] - 95, 18, 0.9); }
    M.stageLight(t, { spot: { x: 540, y: 1150, r: 620, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
