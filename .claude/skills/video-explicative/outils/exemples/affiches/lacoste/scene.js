// Affiche « Le crocodile Lacoste, né d'un alligator » : une seule image. Rideau ouvert.
// La valise en alligator trône dans la vitrine de Boston ; Lacoste la dévore des yeux ; le capitaine lui promet.
const SCENE = (() => {
  const S = {}, ST = M.ST, LAC = M.lac;
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  S.init = () => { LAC.init(); };
  S.draw = (t) => {
    M.flat(LAC.K.vitrine, 540, ST.back, { cast });
    LAC.valise(LAC.VITRINE.plateau.x - 60, LAC.VITRINE.plateau.y, 1.1, { brille: 0.8 });
    M.flat(LAC.K.vitre, 540, ST.back);
    M.drawFloor();
    LAC.capitaine({ t, tendre: 0.85, face: { mouth: 'smile' } }, 840, FEET, 0.92, { dir: -1, slot: ST.slotB, cast });
    // Lacoste : avant-bras vers l'avant (coude plié vers l'avant, jamais vers le dos), main tendue vers la valise
    const pl = { t, ang: { head: -0.12 }, face: { eyes: 'wide', brow: 'up', mouth: 'o' } };
    const ik = M.ik(LAC.lacosteDef(pl), pl, 330, FEET, 1.0, 1, 'armF', [445, 1085], 1);
    pl.ang.armF_up = ik.up; pl.ang.armF_lo = ik.lo; pl.handF = 'open';
    LAC.lacoste(pl, 330, FEET, 1.0, { dir: 1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 600, y: 1050, r: 600, a: 0.28 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
