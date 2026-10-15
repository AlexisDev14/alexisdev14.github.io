// Affiche « Le fromage de la fraude » : une seule image (t = 1,4 s). Rideau ouvert.
const SCENE = (() => {
  const S = {}, C = M.chars, ST = M.ST, R = M.reb;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  const SF = { slot: ST.slotF, cast };
  let K;
  S.init = () => { K = R.init(); };
  S.draw = (t) => {
    ctx().drawImage(K.aravis.couchant, 0, 0);
    M.flat(K.prairie, 540, ST.back);
    M.flat(K.sapinL, 120, ST.back, { cast });
    M.flat(K.sapinR, 960, ST.back, { cast });
    M.flat(K.chalet, 250, ST.back, { scale: 0.78, cast: { dx: 16, dy: 6, a: 0.3 } });
    M.drawFloor();
    // la vache, tête de face, clin d'œil au public
    R.vacheF(R.pose(R.vacheIdle(0.3, { noChew: true }), { lid: 1, face: { mouth: 'smile' }, humeur: 1 }), 430, FEET - 30, 0.8, Object.assign({ dir: 1 }, SF, { slot: ST.slotB }));
    // le paysan, l'air innocent, seau à moitié plein
    M.puppet(C.paysan, R.pose({ ang: { armF_up: 0.25, armF_lo: -0.25, armB_up: -0.1, armB_lo: -0.2, head: -0.08 } }, { handF: 'open', face: { brow: 'up', mouth: 'smile' } }), 200, FEET, 0.95, Object.assign({ dir: 1 }, SF));
    R.prop('seau', { niveau: 0.5, anseK: 0.4 }, 330, FEET + 4, 0.6, { cast: { dx: 8, dy: 4, a: 0.3 } });
    // le contrôleur, soupçonneux, jauge à la main
    M.puppet(C.controleur, R.pose({ ang: { head: 0.12, armF_up: 0.2, armF_lo: -0.6, armB_up: -0.05, armB_lo: -0.4 } }, { tenu: 'jauge', face: { brow: 'frown', mouth: 'tight' } }), 850, FEET, 0.95, Object.assign({ dir: -1 }, SF));
    // le reblochon, vedette, au premier plan
    R.prop('reblochon', { etat: 'entier', part: 0 }, 560, FEET + 90, 1.05, { cast: { dx: 8, dy: 4, a: 0.3 } });
    M.stageLight(t, { spot: { x: 560, y: 1150, r: 620, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
