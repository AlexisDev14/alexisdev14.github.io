// Affiche « Monsieur Poubelle » : une seule image. Rideau ouvert.
// Le préfet salue au bicorne, la boîte (coiffée d'un petit bicorne) lui rend son salut ; le propriétaire fulmine ; un rat profite.
const SCENE = (() => {
  const S = {}, ST = M.ST, POU = M.pou, C = M.chars;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34;
  S.init = () => { POU.init(); };
  S.draw = (t) => {
    ctx().fillStyle = '#2a2430'; ctx().fillRect(0, 0, 1080, 1920);
    M.flat(POU.K.rue, 540, ST.back, { cast });
    M.drawFloor();
    POU.prefet({ t, salut: 1, face: { mouth: 'smile' } }, 270, FEET, 0.93, { dir: 1, slot: ST.slotF, cast });
    POU.boite(530, FEET + 6, 1.55, { salut: 1, bicorne: true, contenu: 'tout', t, cast });
    POU.rat(t, 660, FEET + 8, 1.4, { trot: 0, tient: 'croute', cast });
    M.puppet(C.proprio, { t, rouge: 1, fumee: 1, leve: 0.4, face: { brow: 'frown', mouth: 'tight' } }, 820, FEET, 0.92, { dir: -1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 520, y: 1200, r: 620, a: 0.26 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
