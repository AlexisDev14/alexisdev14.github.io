
// =====================================================================
// PERSONNAGES — marionnettes de profil (regard vers +x), pieds en (0,0)
// proportions ≈ 1/6 tête ; pièces articulées par rivets.
// =====================================================================
// ---- main (au bout de l'avant-bras, poignet en y≈80) ----
const HAND_OPEN = [[-8, 78], [8, 78], [12, 86], [18, 95], [15, 99], [10, 94], [10, 104], [8, 114], [2, 119], [-5, 117], [-9, 105], [-9, 90]];
const HAND_FIST = [[-9, 78], [9, 78], [13, 88], [13, 100], [6, 106], [-4, 106], [-10, 98], [-10, 86]];
function handPaint(skin, kind) {
  if (kind === 'fist') { strokePts([[0, 92], [12, 92]], 'rgba(60,30,20,0.5)', 1); strokePts([[-2, 99], [10, 99]], 'rgba(60,30,20,0.5)', 1); return; }
  strokePts([[1, 100], [3, 113]], 'rgba(70,35,20,0.45)', 1); strokePts([[-3, 100], [-3, 112]], 'rgba(70,35,20,0.45)', 1);
  hatch([[-12, 76], [-2, 76], [-2, 122], [-12, 122]], 0.9, 3.4, 0.25);
}

// ---- tête : outils communs ----
function eye(f, x, y, sz = 1) {
  const e = f.eyes || 'open';
  if (e === 'closed') { strokePts([[x - 6 * sz, y], [x, y + 2.2 * sz], [x + 6 * sz, y - 0.5 * sz]], 'rgba(30,18,16,0.9)', 1.7); return; }
  const k = e === 'wide' ? 1.45 : e === 'half' ? 0.55 : 1;
  fillPts([[x - 6 * sz, y], [x - 1 * sz, y - 3.3 * sz * k], [x + 5.5 * sz, y - 1.2 * sz * k], [x + 2.5 * sz, y + 1.8 * sz * k], [x - 4 * sz, y + 1 * sz]], '#efe8da', 0, 0);
  dot(x + 2.3 * sz, y - 0.6 * sz * k, 2.0 * sz * Math.min(1.15, k), '#2a1f1d');
  strokePts([[x - 6.5 * sz, y + 0.3], [x - 1 * sz, y - 3.6 * sz * k], [x + 6 * sz, y - 1.4 * sz * k]], 'rgba(28,16,14,0.95)', 1.8);
}
function brow(f, x, y, col = 'rgba(45,28,20,0.9)', lw = 2.2) {
  const b = f.brow || 'n';
  const pts = b === 'up' ? [[x - 8, y - 2], [x, y - 5.5], [x + 8, y - 3]] : b === 'frown' ? [[x - 8, y - 2], [x, y - 1.2], [x + 8, y + 2]] : b === 'worry' ? [[x - 8, y + 1], [x, y - 3.5], [x + 8, y - 4]] : [[x - 8, y - 1], [x, y - 3], [x + 8, y - 1.5]];
  strokePts(pts, col, lw);
}
function mouth(f, x, y, col = 'rgba(110,40,38,0.95)') {
  const m = f.mouth || 'n';
  if (m === 'o') { fillPts([[x - 3, y - 2.5], [x + 1, y - 3], [x + 1.5, y + 2.5], [x - 3, y + 3]], '#3a1714', 0, 0); return; }
  if (m === 'smile') { strokePts([[x + 1, y - 0.5], [x - 4, y + 0.5], [x - 8, y - 2]], col, 1.7); return; }
  if (m === 'tight') { strokePts([[x + 1, y], [x - 8, y + 1.2]], col, 2); return; }
  strokePts([[x + 1, y], [x - 4, y + 0.8], [x - 8, y + 0.2]], col, 1.6);
}
function earPaint(x, y) {
  fillPts([[x - 6, y - 9], [x + 3, y - 10], [x + 6, y - 2], [x + 4, y + 8], [x - 2, y + 11], [x - 7, y + 4]], P.peauD);
  strokePts([[x + 2, y - 6], [x - 3, y - 4], [x - 4, y + 3], [x + 1, y + 6]], 'rgba(80,40,30,0.6)', 1.1);
}

// ---- jambes génériques ----
function legPts(th = 1) {
  return [[-18 * th, -12], [16 * th, -14], [22 * th, 20], [20 * th, 70], [16, 108], [19, 118], [15, 170], [13, 205], [15, 219], [40, 223], [48, 233, 1], [46, 236, 1], [-17, 237, 1], [-20, 222], [-19, 180], [-21, 140], [-21, 118], [-17, 108], [-20 * th, 60], [-22 * th, 10]];
}

// ===================== NAPOLÉON =====================
const NAP_TORSO_HABIT = [[-14, -176], [8, -180], [16, -168], [28, -150], [38, -118], [44, -80], [45, -42], [39, -8], [30, 12], [6, 16], [-14, 14], [-20, 40], [-26, 110], [-37, 113, 1], [-41, 40], [-39, -40], [-41, -110], [-37, -146], [-27, -166]];
const NAP_TORSO_RED = [[-14, -176], [8, -180], [16, -168], [30, -150], [40, -118], [47, -80], [48, -40], [44, 0], [44, 60], [40, 112, 1], [-40, 116, 1], [-44, 40], [-41, -40], [-43, -110], [-38, -146], [-27, -166]];
const NAP_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [29, -26], [28, -30], [31, -34], [37, -39, 1], [33, -46], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
const BICORNE = [[-76, 8, 1], [-40, 11], [0, 13], [40, 11], [78, 5, 1], [60, -20], [26, -44], [-8, -48], [-44, -32]];
function bicornePaint() {
  shade(0, -50, 0, 14, 0.3, [-90, -60, 90, 20]);
  hatch([[-80, -10], [80, -10], [80, 20], [-80, 20]], -0.3, 3.6, 0.35);
  strokePts([[-74, 6], [-44, -30], [-8, -45], [26, -41], [58, -18], [76, 4]], P.or, 3.4);
  strokePts([[-74, 6], [-44, -30], [-8, -45], [26, -41], [58, -18], [76, 4]], 'rgba(255,240,200,0.35)', 1);
  strokePts([[20, -16], [24, -40]], P.orL, 2.6);
  dot(18, -14, 9.5, '#8a2420'); dot(18, -14, 6.4, '#e9e2d0'); dot(18, -14, 3.4, '#24365e');
}
const NAP_LAPEL = [[18, -132], [34, -124], [41, -98], [38, -72], [26, -60, 1], [21, -92]];

function napTorsoPaint(pose) {
  const red = pose.costume === 'gris';
  if (red) {
    fillPts([[-60, -200], [60, -200], [60, 140], [-60, 140]], P.gris);
    // habit vert sous la redingote grise ouverte
    fillPts([[14, -170], [30, -150], [36, -120], [36, -60], [30, 0], [22, 10], [14, -60]], P.vert);
    fillPts([[22, -120], [36, -118], [40, -80], [38, -40], [30, -6], [24, 4], [20, -60]], P.ivoire);
    fillPts([[-14, -176], [8, -180], [16, -168], [10, -156], [-12, -158]], P.vert);
    strokePts([[14, -170], [12, -100], [16, -20], [20, 112]], 'rgba(30,25,20,0.6)', 1.6);
    hatch([[-50, -170], [-12, -170], [-6, 120], [-50, 120]], 0.75, 4.2, 0.36);
    hatch([[-50, -60], [-20, -60], [-16, 120], [-50, 120]], -0.6, 5, 0.22);
    strokePts([[-6, -20], [-10, 60], [-8, 110]], 'rgba(40,35,30,0.45)', 1.2);
    strokePts([[6, 0], [6, 70], [10, 110]], 'rgba(40,35,30,0.35)', 1.2);
    for (const y of [-130, -100, -70]) dot(10, y, 2.4, P.grisD);
    shade(46, 0, -44, 0, 0.35);
    return;
  }
  // gilet blanc
  fillPts([[24, -122], [38, -118], [46, -80], [46, -40], [40, -6], [31, 13], [10, 18], [16, -40], [20, -92]], P.ivoire);
  hatch([[12, -60], [30, -60], [30, 20], [12, 20]], 0.9, 4, 0.18);
  // col rouge, passepoil
  fillPts([[-14, -177], [8, -181], [17, -168], [10, -156], [-12, -159]], P.sangL);
  strokePts([[16, -168], [24, -124], [20, -92], [16, -40], [10, 16]], P.sangL, 2.6);
  // pans : retroussis rouges
  fillPts([[-22, 60], [-26, 110], [-37, 113], [-38, 60]], P.sangL);
  hatch([[-50, -170], [-12, -170], [-10, 120], [-50, 120]], 0.75, 4.2, 0.38);
  hatch([[-50, -40], [-24, -40], [-22, 120], [-50, 120]], -0.6, 5, 0.24);
  strokePts([[-8, -150], [-12, -60], [-16, 20]], 'rgba(15,25,18,0.5)', 1.2);
  for (const y of [-150, -136]) dot(24, y, 2.3, P.orL);
  shade(46, 0, -44, 0, 0.3);
}
function napHeadPaint(pose) {
  const f = pose.face || {};
  // cheveux bruns, mèche
  fillPts([[30, -112], [30, -80], [24, -76], [25, -68, 1], [16, -74], [7, -69], [-3, -76], [-12, -64], [-18, -50], [-19, -34], [-42, -28], [-42, -112]], P.cheveux, 4);
  strokePts([[-20, -56], [-26, -40], [-27, -30]], 'rgba(10,6,4,0.5)', 1); strokePts([[-10, -70], [-18, -56]], 'rgba(10,6,4,0.5)', 1);
  strokePts([[22, -74], [15, -71], [17, -66]], 'rgba(10,6,4,0.6)', 1.2);
  earPaint(-8, -44);
  dot(14, -32, 9, 'rgba(205,130,110,0.22)');
  hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
  hatch([[-20, 0], [14, 0], [14, 18], [-20, 18]], 0.2, 3.2, 0.3);
  strokePts([[27, -30], [21, -24]], 'rgba(100,60,45,0.4)', 1);
  strokePts([[31, -36], [33, -35]], 'rgba(70,35,25,0.7)', 1.3);
  eye(f, 17, -52); brow(f, 17, -59); mouth(f, 27, -27);
  strokePts([[22, -9], [26, -14]], 'rgba(90,50,40,0.35)', 1);
}
function armPts(len = 98) { return [[-15, -14], [0, -19], [15, -12], [14, 40], [11, len - 2], [-11, len], [-13, 40]]; }
function foreTuck() { return [[-11, -8], [11, -8], [10, 30], [10, 58], [-9, 60], [-10, 30]]; }
function forePts(kind) {
  const h = kind === 'fist' ? HAND_FIST : HAND_OPEN;
  return [[-11, -8], [11, -8], [10, 40], [9, 76], ...h.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [-9, 86], [-10, 76], [-11, 40]];
}
function epaulette(col = P.or) {
  fillPts([[-17, -18], [0, -23], [17, -16], [18, -4], [-18, -4]], col);
  if (!M._sil()) for (let x = -16; x <= 16; x += 3.2) strokePts([[x, -4], [x * 1.08, 12]], col === P.or ? P.orL : col, 1.6);
  strokePts([[-17, -12], [17, -11]], 'rgba(60,40,10,0.5)', 1);
}
function sleevePaint(col, cuff, kind, skin) {
  return (pose) => {
    const tuck = pose.tuck;
    if (!tuck) { fillPts([[-20, 76], [20, 76], [24, 130], [-20, 130]], skin || P.peau); handPaint(skin, kind); }
    if (cuff) fillPts(tuck ? [[-14, 46], [14, 46], [14, 64], [-14, 64]] : [[-14, 64], [14, 64], [14, 79], [-14, 79]], cuff);
    hatch([[-14, -10], [-2, -10], [-2, 66], [-14, 66]], 0.9, 3.8, 0.32);
  };
}
function mkNapoleon() {
  const parts = {
    torso: { parent: null, at: [0, 0], pts: (p) => (p.costume === 'gris' ? NAP_TORSO_RED : NAP_TORSO_HABIT), base: P.vert, paint: napTorsoPaint, seed: 1 },
    legB: { parent: 'torso', at: [-6, -2], pts: legPts(1), base: P.ivoireD, seed: 2, paint: () => { fillPts([[-40, 112], [60, 112], [60, 260], [-40, 260]], '#141215'); hatch(null, 0.8, 3.5, 0.3); }, noRivet: true },
    legF: { parent: 'torso', at: [6, -2], pts: legPts(1), base: P.ivoire, seed: 3, paint: () => {
      fillPts([[-40, 112], [60, 112], [60, 260], [-40, 260]], P.noir);
      fillPts([[-24, 110], [24, 110], [24, 124], [-24, 124]], '#2d2826');
      strokePts([[8, 130], [6, 200], [10, 216]], 'rgba(220,210,190,0.35)', 2);
      hatch([[-26, -20], [-6, -20], [-6, 110], [-26, 110]], 0.8, 4, 0.25);
      strokePts([[-6, 20], [-2, 90]], 'rgba(120,100,80,0.35)', 1);
    } },
    armB_up: { parent: 'torso', at: [-10, -146], pts: armPts(), base: P.vertD, seed: 4, paint: (p) => { if (p.costume === 'gris') fillPts([[-30, -30], [30, -30], [30, 110], [-30, 110]], P.grisD); hatch(null, 0.8, 3.6, 0.3); } },
    armB_lo: { parent: 'armB_up', at: [0, 98], pts: () => forePts('fist'), base: P.vertD, seed: 5, paint: (p) => { if (p.costume === 'gris') fillPts([[-30, -30], [30, -30], [30, 77], [-30, 77]], P.grisD); fillPts([[-20, 77], [20, 77], [24, 130], [-20, 130]], P.peauD); hatch(null, 0.8, 3.6, 0.3); } },
    head: { parent: 'torso', at: [6, -170], pts: NAP_HEAD, base: P.peau, paint: napHeadPaint, seed: 6, noRivet: true },
    hat: { parent: 'head', at: [-2, -82], pts: BICORNE, base: '#1d1c22', paint: bicornePaint, seed: 7, noRivet: true, rest: -0.04 },
    armF_up: { parent: 'torso', at: [-2, -146], pts: armPts(), base: P.vert, seed: 8, paint: (p) => { if (p.costume === 'gris') fillPts([[-30, -30], [30, -30], [30, 110], [-30, 110]], P.gris); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.32); }, extra: (p) => { if (p.costume !== 'gris') epaulette(); } },
    armF_lo: { parent: 'armF_up', at: [0, 98], pts: (p) => (p.tuck ? foreTuck() : forePts(p.handF || 'open')), base: P.vert, seed: 9, paint: (p) => {
      if (p.costume === 'gris') fillPts([[-30, -30], [30, -30], [30, 77], [-30, 77]], P.gris);
      sleevePaint(null, p.costume === 'gris' ? null : P.sangL, p.handF || 'open')(p);
    } },
    lapel: { parent: 'torso', at: [0, 0], pts: NAP_LAPEL, base: P.vert, seed: 10, noRivet: true, paint: (p) => { if (p.costume === 'gris') fillPts([[0, -140], [50, -140], [50, -50], [0, -50]], P.gris); else strokePts([[18, -132], [21, -92], [26, -60]], P.sangL, 2.4); hatch(null, 0.9, 4, 0.2); } },
  };
  return { hipY: -235, parts, handLen: 104, rod: { part: 'torso', at: [-26, 18] },
    order: ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'hat', 'torso', 'armF_up', 'armF_lo', 'lapel'] };
}

// ===================== MARIE-LOUISE =====================
const ML_TORSO = [[-16, -192], [-4, -198], [10, -196], [18, -182], [26, -166], [24, -150], [18, -140], [22, -100], [28, -20], [36, 80], [46, 180], [54, 248, 1], [20, 254], [-20, 254], [-46, 250, 1], [-38, 160], [-30, 60], [-24, -40], [-20, -110], [-16, -140], [-22, -160], [-22, -180]];
const ML_MANTLE = [[8, -4], [-6, -10], [-24, -2], [-36, 60], [-52, 180], [-80, 300], [-118, 410], [-152, 440, 1], [-60, 450], [-6, 448], [-2, 300], [0, 150], [6, 40]];
const ML_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [20, -10], [23, -15], [22, -19], [24, -22], [23, -25], [25, -29], [30, -34, 1], [27, -41], [24, -51], [25, -60], [21, -72], [10, -82], [-6, -86], [-20, -94], [-34, -93], [-43, -82], [-41, -66], [-31, -60], [-30, -44], [-24, -28], [-16, -10]];
function mlHeadPaint(pose) {
  const f = pose.face || {};
  fillPts([[30, -110], [28, -72], [22, -69], [16, -74], [8, -70], [0, -74], [-10, -64], [-18, -50], [-20, -30], [-52, -30], [-52, -110]], P.chatain, 2);
  for (const [x, y] of [[-30, -78], [-38, -84], [-26, -88], [-34, -70]]) strokePts([[x - 5, y], [x, y - 5], [x + 5, y], [x, y + 4]], 'rgba(60,35,18,0.55)', 1.2, true);
  for (const [x, y] of [[19, -68], [13, -66]]) { dot(x, y, 3.4, P.chatain); strokePts([[x - 2, y - 2], [x + 2, y + 1]], 'rgba(60,35,18,0.6)', 1); }
  // anglaises
  fillPts([[-14, -44], [-9, -44], [-8, -26], [-12, -20], [-16, -28]], P.chatain);
  strokePts([[-12, -40], [-10, -34], [-13, -28]], 'rgba(60,35,18,0.6)', 1);
  earPaint(-6, -44);
  // diadème
  strokePts([[-12, -84], [4, -87], [20, -78]], P.orL, 3.2);
  for (const [x, y] of [[-6, -86], [4, -88], [13, -84]]) fillPts([[x - 3, y], [x, y - 8, 1], [x + 3, y]], P.orL, 0, 0);
  dot(4, -94, 2.2, '#efe6d6');
  dot(13, -30, 8, 'rgba(210,120,110,0.25)');
  hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.22);
  eye(f, 15, -45, 0.95); brow(f, 15, -52, 'rgba(90,60,35,0.8)', 1.6);
  fillPts([[24, -22], [20, -21], [18, -19], [22, -18]], '#a24848', 0, 0);
  mouth(f, 23, -20, 'rgba(120,40,40,0.8)');
}
function mkMarieLouise() {
  const parts = {
    torso: { parent: null, at: [0, 0], pts: ML_TORSO, base: P.ivoireL, seed: 11, paint: () => {
      fillPts([[-30, -148], [40, -148], [40, -138], [-30, -138]], P.or);
      fillPts([[-60, 224], [70, 224], [70, 236], [-60, 236]], P.ivoireD);
      strokePts([[-50, 230], [60, 230]], P.or, 1.6);
      for (const [x0, x1] of [[0, -14], [6, 4], [12, 22], [-8, -30], [16, 40]]) strokePts([[x0, -130], [x1 * 0.6, 60], [x1, 230]], 'rgba(120,100,70,0.35)', 1.2);
      hatch([[-60, -100], [-14, -100], [-30, 260], [-60, 260]], 0.85, 4.4, 0.22);
      shade(50, 0, -50, 0, 0.3);
    } },
    mantle: { parent: 'torso', at: [-6, -186], pts: ML_MANTLE, base: P.sang, seed: 12, noRivet: true, paint: () => {
      path(ML_MANTLE, 12); M.ctx().strokeStyle = P.or; M.ctx().lineWidth = 9 * M._lw(); if (!M._sil()) M.ctx().stroke();
      for (const k of [0.3, 0.55, 0.8]) strokePts([[-10 * k, 20], [-50 * k - 10, 200], [-120 * k - 10, 430]], 'rgba(30,5,5,0.45)', 2.2);
      hatch([[-160, 200], [0, 200], [0, 460], [-160, 460]], 0.7, 4.2, 0.32);
      shade(0, 0, -100, 300, 0.35, [-170, -20, 20, 470]);
    } },
    armB_up: { parent: 'torso', at: [-6, -180], pts: armPts(90), base: P.ivoireD, seed: 13 },
    armB_lo: { parent: 'armB_up', at: [0, 90], pts: () => forePts('open'), base: P.ivoireD, seed: 14 },
    head: { parent: 'torso', at: [4, -194], pts: ML_HEAD, base: '#ead0b4', paint: mlHeadPaint, seed: 15, noRivet: true },
    armF_up: { parent: 'torso', at: [2, -178], pts: armPts(90), base: '#ead0b4', seed: 16, paint: () => { fillPts([[-20, -30], [20, -30], [22, 26], [-20, 30]], P.ivoireL); strokePts([[-14, 24], [0, 30], [14, 24]], 'rgba(120,100,70,0.5)', 1.2); hatch([[-16, 0], [-4, 0], [-4, 100], [-16, 100]], 0.9, 3.6, 0.25); } },
    armF_lo: { parent: 'armF_up', at: [0, 90], pts: () => forePts('fist'), base: P.ivoireL, seed: 17, paint: () => { strokePts([[-10, 70], [10, 70]], 'rgba(120,100,70,0.5)', 1); hatch([[-14, -10], [-4, -10], [-4, 110], [-14, 110]], 0.9, 3.6, 0.22); } },
    bouquet: { parent: 'armF_lo', at: [4, 98], pts: [[-6, -2], [6, -2], [4, 46], [-2, 46]], base: '#4c5e3a', seed: 18, noRivet: true, extra: () => {
      for (const [x, y, col] of [[-10, -12, '#efe8d8'], [6, -16, P.sangL], [0, -26, '#efe8d8'], [14, -6, '#efe8d8'], [-14, 2, P.sangL], [8, 2, '#d9c9a8']]) {
        if (M._sil()) continue; dot(x, y, 7.5, 'rgba(30,20,10,0.5)'); dot(x, y, 6.6, col); dot(x - 1, y - 1, 2, 'rgba(120,80,30,0.6)');
      }
      fillPts([[-20, -6], [-30, 4], [-18, 2]], '#4c5e3a'); fillPts([[18, -2], [26, 10], [14, 6]], '#4c5e3a');
    } },
  };
  return { hipY: -252, parts, handLen: 108, rod: { part: 'torso', at: [-14, 40] },
    order: ['mantle', 'armB_up', 'armB_lo', 'head', 'torso', 'armF_up', 'armF_lo', 'bouquet'] };
}

// ===================== L'ARCHITECTE =====================
const AR_TORSO = [[-14, -178], [6, -182], [14, -170], [22, -150], [26, -112], [24, -60], [20, -14], [16, 8], [-4, 12], [-12, 24], [-16, 118], [-29, 120, 1], [-31, 30], [-28, -50], [-31, -120], [-29, -160]];
const AR_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [19, -10], [22, -15], [20, -19], [23, -22], [22, -26], [26, -30], [39, -38, 1], [31, -46], [27, -56], [28, -66], [24, -79], [12, -90], [-8, -94], [-26, -86], [-34, -68], [-32, -50], [-29, -36], [-31, -28], [-33, -6], [-30, 8, 1], [-24, 6], [-22, -14], [-16, -4]];
function arLegPts() { return [[-14, -10], [12, -12], [15, 20], [13, 70], [11, 108], [12, 150], [10, 200], [11, 224], [34, 230], [41, 239, 1], [-14, 241, 1], [-16, 224], [-14, 190], [-16, 150], [-15, 110], [-16, 60], [-17, 10]]; }
function arLegPaint(dark) {
  return () => {
    fillPts([[-30, 110], [40, 110], [40, 222], [-30, 222]], dark ? '#bdb5a2' : '#ddd6c6');
    fillPts([[-30, 222], [50, 222], [50, 250], [-30, 250]], P.noir);
    if (!M._sil()) { M.ctx().fillStyle = P.orL; M.ctx().fillRect(8, 225, 10, 6); }
    hatch([[-20, -20], [-4, -20], [-4, 230], [-20, 230]], 0.8, 3.6, 0.3);
  };
}
function arHeadPaint(pose) {
  const f = pose.face || {};
  fillPts([[42, -124], [28, -74], [22, -82], [10, -86], [-2, -80], [-10, -64], [-14, -50], [-18, -32], [-60, -22], [-60, -124]], P.perruque, 3);
  // rouleau de perruque au-dessus de l'oreille
  fillPts([[-22, -58], [2, -58], [5, -50], [2, -43], [-22, -43], [-25, -50]], '#e2e1db');
  strokePts([[-20, -50], [2, -50]], 'rgba(90,90,90,0.5)', 1.1);
  for (let x = -30; x < 30; x += 6) strokePts([[x, -86], [x - 6, -60]], 'rgba(120,120,115,0.35)', 1);
  // nœud du catogan
  fillPts([[-30, -28], [-40, -36], [-40, -20]], '#141316'); fillPts([[-30, -28], [-22, -36], [-22, -20]], '#141316');
  earPaint(-6, -36);
  hatch([[-22, -42], [2, -30], [10, -8], [-6, 18], [-30, 4]], 0.6, 3.4, 0.34);
  strokePts([[24, -30], [16, -18], [16, -12]], 'rgba(90,50,40,0.5)', 1.1);
  strokePts([[6, -40], [10, -26]], 'rgba(90,50,40,0.45)', 1.1);
  strokePts([[22, -48], [26, -46]], 'rgba(90,50,40,0.45)', 1);
  strokePts([[10, -46], [16, -45], [21, -47]], 'rgba(90,50,40,0.45)', 1);
  eye(f, 15, -53, 0.95); brow(f, 15, -61, 'rgba(110,110,105,0.95)', 2.4); mouth(f, 21, -20, 'rgba(110,50,45,0.9)');
  strokePts([[30, -32], [33, -31]], 'rgba(70,35,25,0.7)', 1.2);
}
function mkArchitecte() {
  const parts = {
    torso: { parent: null, at: [0, 0], pts: AR_TORSO, base: '#252329', seed: 21, paint: () => {
      fillPts([[8, -112], [24, -110], [22, -60], [18, -14], [10, 6], [6, -60]], '#45414a');
      for (const y of [-98, -78, -58, -38]) dot(16, y, 1.9, '#8d8676');
      fillPts([[6, -178], [14, -168], [24, -150], [29, -136], [22, -129], [27, -120], [18, -112], [10, -138]], P.ivoireL);
      strokePts([[14, -160], [24, -146], [20, -138], [26, -128]], 'rgba(120,110,90,0.6)', 1);
      hatch([[-40, -170], [-6, -170], [-6, 130], [-40, 130]], 0.75, 3.8, 0.4, 1.05, '200,190,170');
      shade(26, 0, -30, 0, 0.3);
    } },
    legB: { parent: 'torso', at: [-6, -2], pts: arLegPts(), base: '#1d1b20', seed: 22, paint: arLegPaint(true), noRivet: true },
    legF: { parent: 'torso', at: [6, -2], pts: arLegPts(), base: '#28252b', seed: 23, paint: arLegPaint(false) },
    armB_up: { parent: 'torso', at: [-10, -150], pts: armPts(96), base: '#1c1a1f', seed: 24 },
    armB_lo: { parent: 'armB_up', at: [0, 96], pts: () => forePts('fist'), base: '#1c1a1f', seed: 25, paint: () => { fillPts([[-20, 77], [20, 77], [24, 130], [-20, 130]], P.peauD); fillPts([[-14, 66], [14, 66], [16, 80], [-14, 80]], P.ivoireD); } },
    plan: { parent: 'armB_lo', at: [2, 94], pts: [[-10, -66, 1], [10, -66, 1], [10, 66, 1], [-10, 66, 1]], base: '#e7dcc2', seed: 26, noRivet: true, rest: 1.2, paint: () => {
      fillPts([[-12, -68], [12, -68], [12, -58], [-12, -58]], '#cdbf9f', 0, 0); fillPts([[-12, 58], [12, 58], [12, 68], [-12, 68]], '#cdbf9f', 0, 0);
      strokePts([[-4, -56], [-4, 56]], 'rgba(90,70,40,0.35)', 1); hatch([[-12, -70], [-2, -70], [-2, 70], [-12, 70]], 0, 3.2, 0.3);
      fillPts([[-6, -2], [6, -2], [6, 6], [-6, 6]], P.sangL, 0, 0);
    } },
    head: { parent: 'torso', at: [4, -172], pts: AR_HEAD, base: '#e3c6a7', paint: arHeadPaint, seed: 27, noRivet: true },
    armF_up: { parent: 'torso', at: [-2, -150], pts: armPts(96), base: '#2b282f', seed: 28, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.4, 1, '200,190,170') },
    armF_lo: { parent: 'armF_up', at: [0, 96], pts: (p) => forePts(p.handF || 'open'), base: '#2b282f', seed: 29, paint: (p) => {
      fillPts([[-20, 77], [20, 77], [24, 130], [-20, 130]], '#e3c6a7'); handPaint(null, p.handF || 'open');
      fillPts([[-15, 64], [15, 64], [17, 80], [-15, 80]], P.ivoireL);
      strokePts([[-14, 79], [-8, 83], [-2, 79], [4, 83], [10, 79], [15, 82]], 'rgba(120,110,90,0.7)', 1);
    } },
  };
  return { hipY: -242, parts, handLen: 106, rod: { part: 'torso', at: [-24, 18] },
    order: ['armB_up', 'legB', 'legF', 'head', 'torso', 'plan', 'armB_lo', 'armF_up', 'armF_lo'] };
}

// ===================== GRENADIER de la Garde =====================
const GR_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [34, -112], [36, -60], [32, -10], [26, 12], [-12, 14], [-18, 40], [-24, 108], [-36, 110, 1], [-38, 40], [-36, -40], [-38, -110], [-34, -150], [-26, -168]];
const GR_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [23, -10], [26, -16], [25, -21], [27, -25], [26, -29], [29, -33], [35, -38, 1], [31, -46], [28, -56], [28, -66], [24, -78], [12, -90], [-8, -94], [-24, -86], [-32, -68], [-31, -46], [-24, -28], [-17, -8]];
const BEARSKIN = [[-30, 8], [32, 8], [36, -20], [38, -60], [32, -100], [20, -122], [4, -130], [-14, -126], [-28, -110], [-36, -80], [-38, -40], [-36, -10]];
function mkGrenadier() {
  const parts = {
    torso: { parent: null, at: [0, 0], pts: GR_TORSO, base: P.nuit, seed: 31, paint: () => {
      fillPts([[12, -168], [26, -150], [34, -112], [34, -70], [24, -66], [18, -110]], P.ivoireL);
      fillPts([[-14, -177], [8, -181], [16, -168], [10, -158], [-12, -160]], P.sangL);
      fillPts([[-18, 50], [-24, 108], [-36, 110], [-36, 50]], P.sangL);
      fillPts([[0, -60], [36, -60], [34, -10], [26, 12], [2, 12]], P.ivoireL);
      // baudrier blanc
      fillPts([[-36, -150], [-24, -158], [30, -20], [22, -10]], '#ddd5c2');
      hatch([[-50, -170], [-12, -170], [-10, 120], [-50, 120]], 0.75, 4, 0.4, 1.05, '200,200,220');
      shade(36, 0, -40, 0, 0.3);
    } },
    legB: { parent: 'torso', at: [-6, -2], pts: legPts(0.95), base: P.ivoireD, seed: 32, noRivet: true, paint: () => { fillPts([[-40, 100], [60, 100], [60, 260], [-40, 260]], '#151417'); } },
    legF: { parent: 'torso', at: [6, -2], pts: legPts(0.95), base: P.ivoire, seed: 33, paint: () => {
      fillPts([[-40, 100], [60, 100], [60, 260], [-40, 260]], '#1f1d21');
      for (let y = 112; y < 210; y += 16) dot(15, y, 1.8, '#5a5650');
      hatch([[-26, -20], [-6, -20], [-6, 100], [-26, 100]], 0.8, 4, 0.25);
    } },
    armB_up: { parent: 'torso', at: [-10, -146], pts: armPts(), base: P.nuitD, seed: 34 },
    armB_lo: { parent: 'armB_up', at: [0, 98], pts: () => forePts('fist'), base: P.nuitD, seed: 35, paint: () => fillPts([[-20, 77], [20, 77], [24, 130], [-20, 130]], P.peauD) },
    head: { parent: 'torso', at: [6, -170], pts: GR_HEAD, base: P.peau, seed: 36, noRivet: true, paint: (pose) => {
      const f = pose.face || {};
      fillPts([[-40, -110], [30, -110], [28, -70], [-20, -60], [-20, -30], [-40, -30]], P.cheveux);
      earPaint(-8, -44);
      fillPts([[30, -30], [22, -24], [10, -26], [14, -32], [24, -34]], '#2a1d16');
      hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
      eye(f, 17, -52); brow(f, 17, -59);
    } },
    bonnet: { parent: 'head', at: [-2, -70], pts: BEARSKIN, base: '#141216', seed: 37, noRivet: true, paint: () => {
      if (!M._sil()) for (let i = 0; i < 70; i++) { const x = -36 + (i * 37 % 72), y = -125 + (i * 53 % 130); strokePts([[x, y], [x + 2, y + 9]], 'rgba(120,110,110,0.35)', 1); }
      fillPts([[-6, -90], [4, -96], [8, -40], [0, -36]], '#d8d0bc');
      strokePts([[-30, -20], [-10, -40], [20, -30], [34, -50]], '#d8d0bc', 1.6);
    }, extra: () => { fillPts([[-30, -96], [-22, -150], [-14, -152], [-16, -96]], P.sangL); if (!M._sil()) hatch([[-30, -150], [-14, -150], [-14, -96], [-30, -96]], 0.4, 3, 0.3); } },
    armF_up: { parent: 'torso', at: [-2, -146], pts: armPts(), base: P.nuit, seed: 38, extra: () => epaulette(P.sangL), paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.4, 1, '200,200,220') },
    armF_lo: { parent: 'armF_up', at: [0, 98], pts: () => forePts('fist'), base: P.nuit, seed: 39, paint: () => { fillPts([[-20, 77], [20, 77], [24, 130], [-20, 130]], P.peau); fillPts([[-14, 62], [14, 62], [14, 78], [-14, 78]], P.sangL); } },
    musket: { parent: 'armF_lo', at: [4, 96], pts: [[-5, -330], [3, -330], [5, -180], [7, -40], [12, 60], [14, 140, 1], [-8, 142, 1], [-6, 60], [-5, -40], [-6, -180]], base: '#5a3a22', seed: 40, noRivet: true, paint: () => {
      fillPts([[-8, -340], [8, -340], [6, -40], [-6, -40]], '#7c8088');
      fillPts([[-1, -420], [2, -420], [3, -336], [-2, -336]], '#a3a7ae');
      strokePts([[-1, -300], [-1, -60]], 'rgba(255,255,255,0.35)', 1);
      for (const y of [-260, -150]) fillPts([[-8, y], [8, y], [8, y + 8], [-8, y + 8]], '#b6b9be');
    }, extra: () => { fillPts([[-1, -420], [2, -420], [3, -336], [-2, -336]], '#a3a7ae'); } },
  };
  return { hipY: -238, parts, handLen: 104, rod: { part: 'torso', at: [-26, 18] },
    order: ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'bonnet', 'torso', 'musket', 'armF_up', 'armF_lo'] };
}

// ===================== FIGURANTS (foule de 1836) =====================
// silhouettes plus simples : corps + tête + bras levé (chapeau ou drapeau)
function mkFigurant(kind) {
  const body = kind === 'dame'
    ? [[-14, -178], [6, -182], [16, -168], [22, -140], [18, -110], [24, -40], [34, 100], [44, 234, 1], [-40, 236, 1], [-32, 100], [-24, -40], [-20, -110], [-26, -150]]
    : [[-14, -178], [8, -182], [16, -168], [24, -140], [28, -90], [26, -20], [22, 30], [18, 120], [20, 222], [38, 228], [42, 236, 1], [-16, 236, 1], [-14, 222], [-8, 120], [-6, 40], [-18, 50], [-24, 120], [-26, 222], [-6, 226], [-4, 236, 1], [-40, 236, 1], [-38, 120], [-34, 20], [-32, -90], [-30, -150]];
  const coat = { bourgeois: '#4a3a2c', ouvrier: '#5a6170', dame: '#5b3440', garde: P.nuit }[kind];
  const parts = {
    torso: { parent: null, at: [0, 0], pts: body, base: coat, seed: 50 + kind.length, paint: () => {
      if (kind === 'dame') { fillPts([[-30, -150], [26, -150], [26, -130], [-30, -126]], '#cdbfa3'); strokePts([[-20, -40], [-30, 220]], 'rgba(20,10,10,0.4)', 1.2); strokePts([[4, -40], [8, 220]], 'rgba(20,10,10,0.35)', 1.2); }
      else { fillPts([[-40, 40], [40, 40], [40, 240], [-40, 240]], kind === 'garde' ? P.ivoireD : '#6b6458'); fillPts([[8, -170], [20, -150], [22, -110], [12, -112]], P.ivoireL); if (kind === 'garde') fillPts([[-36, -150], [-24, -158], [26, -30], [18, -20]], '#ddd5c2'); fillPts([[-40, 214], [50, 214], [50, 240], [-40, 240]], P.noir); }
      hatch([[-50, -180], [-12, -180], [-12, 240], [-50, 240]], 0.75, 4.4, 0.4, 1.1, kind === 'dame' ? '20,10,10' : '20,16,24');
      shade(30, 0, -40, 0, 0.3);
    } },
    head: { parent: 'torso', at: [6, -170], pts: NAP_HEAD, base: '#d9b996', seed: 60 + kind.length, noRivet: true, paint: (pose) => {
      fillPts([[30, -112], [26, -76], [10, -72], [-12, -64], [-20, -34], [-42, -28], [-42, -112]], kind === 'dame' ? P.chatain : '#4a3b2e');
      earPaint(-8, -44); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
      eye(pose.face || {}, 17, -52); brow({}, 17, -59); mouth({}, 27, -27);
    } },
    hat: { parent: 'head', at: [-4, -86], seed: 70 + kind.length, noRivet: true,
      pts: kind === 'bourgeois' ? [[-38, 8, 1], [42, 8, 1], [42, 0], [24, 0], [26, -78, 1], [-22, -80, 1], [-20, 0], [-38, 0]]
        : kind === 'dame' ? [[-44, 30], [-36, -10], [-10, -36], [24, -32], [44, -6], [40, 8], [10, 4], [-20, 20]]
        : kind === 'garde' ? [[-26, 8, 1], [30, 8, 1], [34, -6], [28, -70, 1], [-24, -70, 1], [-28, -6]]
        : [[-36, 8], [36, 8], [30, -10], [10, -30], [-20, -26], [-34, -10]],
      base: kind === 'dame' ? '#d6c8a6' : kind === 'ouvrier' ? '#3b4256' : '#1b1a1e',
      paint: () => { hatch(null, 0.6, 3.6, 0.3); if (kind === 'garde') { fillPts([[-30, -74], [32, -74], [32, -62], [-30, -62]], P.sangL); dot(4, -40, 5, '#cfcfcf'); } if (kind === 'dame') strokePts([[-36, 10], [-20, 40], [-10, 60]], P.sangL, 3); } },
    armF_up: { parent: 'torso', at: [-2, -146], pts: armPts(92), base: coat, seed: 80 + kind.length },
    armF_lo: { parent: 'armF_up', at: [0, 92], pts: () => forePts('fist'), base: coat, seed: 90 + kind.length, paint: () => fillPts([[-20, 77], [20, 77], [24, 130], [-20, 130]], '#d9b996') },
  };
  return { hipY: -236, parts, handLen: 100, rod: { part: 'torso', at: [-10, 4] }, order: ['torso', 'head', 'hat', 'armF_up', 'armF_lo'] };
}

M.chars = {};
M.makeChars = function () {
  M.chars.napoleon = mkNapoleon();
  M.chars.marieLouise = mkMarieLouise();
  M.chars.architecte = mkArchitecte();
  M.chars.grenadier = mkGrenadier();
  for (const k of ['bourgeois', 'dame', 'ouvrier', 'garde']) M.chars[k] = mkFigurant(k);
};
M._sil = () => SIL;
M._lw = () => LW;

// bicorne isolé (posé, tenu…) : (x,y) = milieu du bord inférieur
M.bicorne = function (x, y, s, rot = 0, dir = 1) {
  c.save(); c.translate(x, y); c.scale(s * dir, s); c.rotate(rot);
  const pl = LW; LW = 1 / (s * Math.hypot(c.getTransform().a, c.getTransform().b) / s);
  LW = 1 / Math.hypot(c.getTransform().a, c.getTransform().b);
  piece(BICORNE, '#1d1c22', bicornePaint, { seed: 7 });
  LW = pl; c.restore();
};
// petit drapeau tricolore sur hampe (ondule) — (x,y) = bas de la hampe
M.drapeau = function (x, y, s, t, ph = 0, len = 200) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const pl = LW; LW = 1 / Math.hypot(c.getTransform().a, c.getTransform().b);
  c.fillStyle = '#5b3d22'; c.fillRect(-2.5, -len, 5, len);
  dot(0, -len - 4, 5, P.orL);
  const fw = 110, fh = 74, cols = ['#2c3d6b', '#e6dcc6', P.sangL];
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    const x0 = 3 + k * fw / 3, x1 = 3 + (k + 1) * fw / 3, n = 6;
    const wv = (xx) => Math.sin(t * 5 + ph - xx * 0.05) * 6 * (xx / fw);
    c.moveTo(x0, -len + wv(x0));
    for (let i = 1; i <= n; i++) { const xx = lerp(x0, x1, i / n); c.lineTo(xx, -len + wv(xx)); }
    for (let i = n; i >= 0; i--) { const xx = lerp(x0, x1, i / n); c.lineTo(xx, -len + fh + wv(xx)); }
    c.closePath(); c.fillStyle = cols[k]; c.fill();
    c.fillStyle = `rgba(0,0,0,${0.1 + 0.1 * Math.sin(t * 5 + ph - k)})`; c.fill();
  }
  c.strokeStyle = 'rgba(30,20,10,0.5)'; c.lineWidth = 1.2 * LW; c.strokeRect(3, -len, fw, fh);
  LW = pl; c.restore();
};
