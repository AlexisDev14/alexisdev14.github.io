// Affiche « Barbe Noire, le pirate qui fumait » : une seule image. Rideau ouvert.
const SCENE = (() => {
  const S = {}, ST = M.ST, BN = M.bn;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  let K;
  S.init = () => { BN.init(); K = { sky: M.makeSky('couchant'), waves: [0, 1, 2, 3].map(M.makeWave) }; };
  S.draw = (t) => {
    ctx().drawImage(K.sky, 0, 0);
    M.sun(790, 960, 70, t);
    [0, 1, 2, 3].forEach((i) => M.flat(K.waves[i], 540 + (i % 2 ? -30 : 30), 1270 + i * 55));
    M.oiseaux(t, { x0: 150, x1: 950, y: 520, t0: -2, dur: 9, n: 4, s: 0.8, col: '#e9e4d8', seed: 3 });
    M.drawFloor();
    BN.marin({ t, modele: 'b', leve: 0, drapeau: 1, tremble: 0.8, ang: { armF_up: -1.15, armF_lo: -0.55 }, face: { brow: 'worry', mouth: 'o', eyes: 'open' } }, 230, FEETB, 0.8, { dir: 1, slot: ST.slotB, cast });
    BN.coffreOr(770, FEETB + 6, 0.95, { ouvre: 0.8, or: 1, t, cast, dir: -1 });
    BN.barbeNoire({ t, meches: 1, fume: 0.85, hanches: 1, face: { brow: 'frown', mouth: 'smile' } }, 560, FEET, 1.08, { dir: -1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 540, y: 1150, r: 620, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
