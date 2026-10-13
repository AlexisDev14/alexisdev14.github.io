// Plan __PLAN__ — théâtre de marionnettes à tiges. Lire outils/API.md et un exemple (outils/exemples/…) avant d'écrire.
// Ordre de dessin OBLIGATOIRE : toile de fond → décors suspendus/coulisses → fermes → plancher → marionnettes
//   (fente arrière puis fente avant) → effets (pétales, neige) → lumière → rideau → cadre de scène.
const SCENE = (() => {
  const S = {}, E = TL.EVENTS, C = M.chars, ST = M.ST;
  const { clamp, lerp, ease, easeOut, smooth, wob, TAU } = M;
  const cast = { dx: 22, dy: 10, a: 0.3 };      // ombre portée commune (lumière de face haute)
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  let K;
  S.init = () => {                              // pré-rendus (une seule fois) : toiles, décors, accessoires
    K = { sky: M.makeSky('aube'), row: M.makeParisRow(), wingL: M.makeTreeWing(5, false), wingR: M.makeTreeWing(9, true) };
  };
  function rideau(t) {                          // ouverture (0 = fermé, 1 = ouvert) + balancement du bas des pans
    const u = (t - E.rideau0) / (E.rideau1 - E.rideau0), f = ease(u);
    const vel = (ease(u + 0.02) - ease(u - 0.02)) / (0.04 * (E.rideau1 - E.rideau0));
    return { f, swing: -vel * 9 + wob(t, E.rideau1, 26, 0.85, 2.6) };
  }
  S.draw = (t) => {
    const ctx = M.ctx();
    ctx.drawImage(K.sky, 0, 0);
    M.flat(K.wingL, 120, ST.back, { rot: 0.006 * Math.sin(t * 0.9), cast });
    M.flat(K.wingR, 960, ST.back, { rot: 0.006 * Math.sin(t * 0.8 + 1), cast });
    M.flat(K.row, 540, ST.back + 2 * Math.sin(t * 1.3));
    M.drawFloor();
    // marionnettes : M.puppet(C.napoleon, pose, x, FEET, échelle, { dir: 1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 540, y: 1080, r: 480, a: 0.35 } });
    const r = rideau(t); M.curtain(t, r.f, { swing: r.swing });
    M.drawFrame(t);
  };
  return S;
})();
