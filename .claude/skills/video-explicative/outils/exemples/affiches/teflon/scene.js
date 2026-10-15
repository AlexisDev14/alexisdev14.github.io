// Affiche « Le Téflon, un frigo raté » : une seule image. Rideau ouvert.
// Plunkett perplexe devant son frigo raté qui transpire ; Marc Grégoire, le pêcheur, lui présente fièrement la poêle où l'œuf glisse.
const SCENE = (() => {
  const S = {}, ST = M.ST, TEF = M.tef;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  S.init = () => { TEF.init(); };
  S.draw = (t) => {
    ctx().drawImage(TEF.K.labo, 0, 0);
    M.drawFloor();
    TEF.frigo(870, ST.back, 1, { sueur: 1, gouttes: [0.2, 0.9], tremble: 0.4, t, cast });
    TEF.plunkett({ t, teteMain: 1, goggles: 0, face: { brow: 'worry', mouth: 'o' } }, 190, FEET, 0.95, { dir: 1, slot: ST.slotF, cast });
    TEF.marc({ t, tenu: 'poele', tenuO: { modele: 'teflon', oeuf: 'glisse', oeufDx: 10 }, fier: 0.5, ang: { armF_up: -1.15, armF_lo: -0.45 }, face: { mouth: 'smile' } }, 660, FEET, 0.95, { dir: -1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 520, y: 1200, r: 620, a: 0.26 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
