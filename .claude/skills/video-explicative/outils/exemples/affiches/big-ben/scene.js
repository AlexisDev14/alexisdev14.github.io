// Affiche « Big Ben, la cloche fêlée » : une seule image. Rideau ouvert.
// La tour au fond (que tout le monde photographie), la vraie Big Ben fêlée au premier plan, le fondeur qui siffle, l'air de rien.
const SCENE = (() => {
  const S = {}, ST = M.ST, BEN = M.ben;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  S.init = () => { BEN.init(); };
  S.draw = (t) => {
    ctx().drawImage(BEN.K.ciel, 0, 0);
    M.flat(BEN.K.ville, 540, ST.back, { alpha: 0.85 });
    const TS = 0.8, TX = 800;
    M.flat(BEN.K.tour, TX, ST.back, { scale: TS, cast });
    BEN.aiguilles(TX, ST.back - 810 * TS, 92 * TS, 3.25);
    M.drawFloor();
    // le touriste photographie la tour (et tourne le dos à la vraie Big Ben)
    BEN.touriste({ t, photo: 1, regardHaut: 1, flash: 1 }, 670, FEET, 0.85, { dir: 1, slot: ST.slotB, cast });
    // la cloche fêlée, vedette, au premier plan
    const rc = BEN.cloche(470, FEET + 40, 0.72, { fele: 1, t, cast, ombre: true });
    // le fondeur siffle, petit maillet à l'épaule, l'air innocent
    BEN.ouvrier({ t, tenu: 'marteau', poids: 'leger', epaule: 1, siffle: 1 }, 245, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 450, y: 1250, r: 600, a: 0.28 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
