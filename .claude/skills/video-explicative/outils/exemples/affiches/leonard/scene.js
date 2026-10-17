// Affiche « Léonard de Vinci, l'écriture en miroir » : une seule image (t = 1,4 s). Rideau ouvert.
const SCENE = (() => {
  const S = {}, ST = M.ST, LEO = M.leo;
  const ctx = () => M.ctx();
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  const LX = 580, LS = 1.0;            // Léonard, au centre, regarde à gauche (gaucher : plume dans la main AVANT)
  const AX = 860, AS = 0.86;           // savant A, en retrait à droite
  S.init = () => { LEO.init(); };
  S.draw = (t) => {
    // atelier ; carnet sur le lutrin, écrit de droite à gauche
    const rc = LEO.atelier(t, 0, { carnet: { lignes: 0.55, croquis: 'machine', croquisK: 1, sens: 'rg' }, cast });
    // le miroir à main suspendu au-dessus du carnet : la page remise à l'endroit
    LEO.miroirSuspendu(t, 0, true, { x: 360, y: 800, phi: 0.01, cast });
    M.drawFloor();
    // savant A, intrigué, se penche, loupe braquée vers le carnet
    LEO.savantA({ t, tenu: 'loupe', atteint: 1, cible: [708, 1040], tilt: 0.17, ang: { head: 0.1, objet: 0.3 },
      face: { brow: 'up', mouth: 'o', eyes: 'wide' } }, AX, FEETB, AS, { dir: -1, slot: ST.slotB, cast });
    // Léonard écrit : pointe de la plume sur la page droite (cible éprouvée « écrire »), sourire en coin, regard sur la page
    LEO.leonard({ t, tenu: 'plume', ecrire: 1, cible: [LX - 130, FEET - LS * 290], tache: 0, face: { eyes: 'open', brow: 'up', mouth: 'smile' }, ang: { head: 0.14 } }, LX, FEET, LS, { dir: -1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 540, y: 1150, r: 620, a: 0.25 } });
    M.curtain(t, 1, {});
    M.drawFrame(t);
  };
  return S;
})();
