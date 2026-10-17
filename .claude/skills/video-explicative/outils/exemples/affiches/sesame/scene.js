// Affiche « Sésame, ouvre-toi, le mot de passe oublié » : une seule image (t = 1,4 s). Rideau ouvert.
// Cassim dans la caverne, porte close, serre son sac d'or à deux mains ; la formule s'envole de sa tête.
const SCENE = (() => {
  const S = {}, ST = M.ST, SES = M.ses;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  const CX = 440, CS = 1.1, SF = { dir: 1, slot: ST.slotF, cast };
  // sac d'or serré devant le ventre : (x, y) = fond du sac, en coordonnées du ventre
  const SAC = { dx: 30, dy: 95, s: 1.0, taille: 1.25 };
  S.init = () => { SES.init(); };
  S.draw = (t) => {
    const c = ctx();
    SES.caverne(t, { porte: { ouvre: 0, tremble: 0 }, cast });
    M.drawFloor();
    const base = { t, face: { brow: 'worry', mouth: 'o', eyes: 'wide' }, handF: 'open', handB: 'open', ang: { head: 0.02 } };
    // 1) position du corps (marionnette sous un clip vide)
    c.save(); c.beginPath(); c.rect(0, 0, 0, 0); c.clip();
    const r0 = SES.cassim(JSON.parse(JSON.stringify(base)), CX, FEET, CS, SF);
    c.restore();
    const ventre = r0.w('torso', 69, -30), tete = r0.w('head', 0, 0);
    const sx = ventre[0] + SAC.dx * CS, sy = ventre[1] + SAC.dy * CS;
    // 2) le sac (derrière les bras, devant le ventre : le ventre en couvre le dos)
    SES.sac(sx, sy, SAC.s * CS, { taille: SAC.taille, or: true, cast, t });
    // 3) Cassim, les deux mains sur le sac (IK, coudes vers l'avant)
    const cF = [sx + 38 * CS, sy - 60 * CS], cB = [sx + 22 * CS, sy - 128 * CS];
    SES.cassim(Object.assign({}, base, { atteint: 1, cible: cF, atteintB: 1, cibleB: cB }), CX, FEET, CS, SF);
    // l'or déborde du col : quelques pièces entassées, penchées
    [[-14, -182, -0.5], [10, -186, 0.4], [-2, -198, 0.1], [20, -200, 0.7], [-22, -200, -0.8]].forEach(([dx, dy, rot], i) =>
      SES.piece(sx + dx * CS, sy + dy * CS, 0.5 * CS, { tourne: 0.3 * i, rot, t }));
    // 4) la bulle de pensée au-dessus du turban : les graines (la formule) s'envolent
    SES.bulle(670, 785, 0.85, { t, gonfle: 1, envol: 0.42, queue: [-150, 140] });
    // lumière chaude des lampes et de l'or sur Cassim
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(520, 1120, 40, 520, 1120, 560);
    g.addColorStop(0, 'rgba(255,186,96,0.22)'); g.addColorStop(1, 'rgba(255,186,96,0)');
    c.fillStyle = g; c.fillRect(0, 500, 1080, 1200); c.restore();
    M.stageLight(t, { spot: { x: 540, y: 1150, r: 620, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
