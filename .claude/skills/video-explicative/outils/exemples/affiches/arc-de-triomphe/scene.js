// Affiche « L'Arc de triomphe de l'Étoile » : une seule image. Rideau ouvert.
// L'arc de 1810 n'est qu'une toile peinte sur charpente ; Napoléon y passe, fier, avec Marie-Louise qui sourit.
const SCENE = (() => {
  const S = {}, C = M.chars, ST = M.ST;
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  let K;
  S.init = () => {
    K = { sky: M.makeSky('couchant'), row: M.makeParisRow(), wingL: M.makeTreeWing(5, false), wingR: M.makeTreeWing(9, true),
          faux: M.makeArc(true) };
  };
  S.draw = (t) => {
    const ctx = M.ctx();
    ctx.drawImage(K.sky, 0, 0);
    M.flat(K.row, 540, ST.back, { alpha: 0.9 });
    M.flat(K.faux, 540, ST.back, { scale: 0.69, cast: { dx: 18, dy: 8, a: 0.42 }, ripple: { amp: 6, t: 0.6, cy: -300, k: 0.02, w: 11 } });
    M.flat(K.wingL, 70, ST.back, { cast });
    M.flat(K.wingR, 1010, ST.back, { cast });
    M.drawFloor();
    M.puppet(C.marieLouise, { ang: { armF_up: -0.12, armF_lo: -0.95, armB_up: 0.15, armB_lo: -0.2, head: -0.06 }, face: { mouth: 'smile' } }, 650, FEET, 1, { dir: -1, slot: ST.slotF, cast });
    M.puppet(C.napoleon, { tuck: true, ang: { armF_up: 0.18, armF_lo: -1.85, armB_up: 0.35, armB_lo: -0.4, head: -0.18 }, face: { brow: 'n', mouth: 'smile' } }, 440, FEET, 1, { dir: -1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 540, y: 1150, r: 620, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
