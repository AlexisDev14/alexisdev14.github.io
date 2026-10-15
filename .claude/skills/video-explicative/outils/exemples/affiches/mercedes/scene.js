// Affiche « L'étoile Mercedes, carte postale » : une seule image. Rideau ouvert.
const SCENE = (() => {
  const S = {}, ST = M.ST, MER = M.mer;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  S.init = () => { MER.init(); };
  const BEND = [1, 1];
  // petite aile de papier (bord blanc, plumes en festons), ancrée en (0,0), déployée vers le haut ; a = battement
  function aile(a, side) {
    const c = ctx(); c.save(); c.scale(side, 1); c.rotate(0.35 - 0.55 * a);
    const P = [[0, 0], [10, -30], [30, -58], [58, -74], [70, -66], [62, -52], [74, -44], [60, -32], [68, -22], [48, -14], [52, -4], [26, 2]];
    c.beginPath(); P.forEach((p, i) => (i ? c.lineTo : c.moveTo).call(c, p[0], p[1])); c.closePath();
    c.fillStyle = '#f3ead6'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#fffaf0'; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#5a4630'; c.stroke();
    c.strokeStyle = 'rgba(120,95,60,0.6)'; c.lineWidth = 1.5;
    for (const [x, y] of [[50, -60], [52, -40], [40, -20]]) { c.beginPath(); c.moveTo(8, -4); c.quadraticCurveTo(x * 0.5, y * 0.8, x, y); c.stroke(); }
    c.fillStyle = '#c9a24e'; c.beginPath(); c.arc(4, -2, 5, 0, M.TAU); c.fill(); c.strokeStyle = '#4a3412'; c.lineWidth = 1.2; c.stroke();
    c.restore();
  }
  function carteAilee(x, y, s, t) {
    const c = ctx(), a = 0.5 + 0.5 * Math.sin(t * 9);
    // traînée pointillée depuis Daimler
    c.save(); c.setLineDash([10, 14]); c.lineWidth = 3; c.strokeStyle = 'rgba(243,234,214,0.55)';
    c.beginPath(); c.moveTo(600, 1090); c.quadraticCurveTo(580, 960, x + 80, y + 10); c.stroke(); c.restore();
    c.save(); c.translate(x, y); c.rotate(0.14);
    c.save(); c.translate(-10 * s, -44 * s); c.scale(s * 1.15, s * 1.15); aile(a, -1); c.restore();   // aile de derrière
    MER.carte(0, 0, s, { etoile: 1, cast });
    c.save(); c.translate(14 * s, -46 * s); c.scale(s * 1.3, s * 1.3); aile(a, 1); c.restore();                  // aile de devant
    c.restore();
  }
  S.draw = (t) => {
    ctx().drawImage(MER.K.salon, 0, 0); MER.salonFumee(t);
    M.drawFloor();
    // l'étoile de la carte, en grand, qui brille au-dessus d'eux
    MER.etoile(540, 800, 1.1, { branche: 3, halo: 0.8, eclat: 0.6, t, cast });
    MER.daimler({ t, tenu: 'rien', montrer: 1, face: { brow: 'up', mouth: 'smile' } }, 770, FEET, 0.9, { dir: -1, slot: ST.slotF, cast });
    // la carte postale vole vers Emma avec deux petites ailes de papier
    carteAilee(470, 1000, 0.95, t);
    // Emma se tient les joues : IK des deux bras vers ses joues
    const ES = 0.88, EX = 250, base = { t, tenu: 'rien', sacMain: false, handF: 'open', handB: 'open', face: { mouth: 'o', brow: 'up' } };
    const c = ctx(); c.save(); c.beginPath(); c.rect(0, 0, 0, 0); c.clip();
    const r0 = MER.emma(base, EX, FEET, ES, { dir: 1, slot: ST.slotF, cast });
    c.restore();
    const q = MER.emmaPose(JSON.parse(JSON.stringify(base)));
    const jF = r0.w('head', 8, -6), jB = r0.w('head', -6, -6);
    const sF = M.ik(M.chars.merEmma, q, EX, FEET, ES, 1, 'armF', jF, BEND[0]);
    const sB = M.ik(M.chars.merEmma, q, EX, FEET, ES, 1, 'armB', jB, BEND[1]);
    MER.emma(Object.assign({}, base, { ang: { armF_up: sF.up, armF_lo: sF.lo, armB_up: sB.up, armB_lo: sB.lo } }), EX, FEET, ES, { dir: 1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 540, y: 1100, r: 620, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
