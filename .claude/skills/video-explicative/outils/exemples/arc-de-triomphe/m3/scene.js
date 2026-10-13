// Extrait m3 — « Le chantier » (théâtre de marionnettes à tiges)
const SCENE = (() => {
  const S = {}, E = TL.EVENTS, C = M.chars, ST = M.ST, X = M.X, P = M.P;
  const { clamp, lerp, ease, easeOut, easeIn, smooth, spring, wob, noise, TAU, rng } = M;
  const ctx = () => M.ctx();
  let K;
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  const CX = 650;                    // axe du futur arc
  // les massifs sont une ferme posée ENTRE les deux fentes : les ouvriers (fente arrière) sont « dans la fouille »
  const PIERY = 1430, PIER_OUT = 305, PIER_IN = 100, COURSE = 46, TOPY = PIERY - 2 * COURSE; // hauteur de genou
  const W1X = 815, W1DY = 46, W2X = 662, W2DY = 30, WS = 0.85;   // ouvriers (fente arrière)
  const ARX = 893, ARS = 0.96;             // architecte (fente avant, à droite)
  const NAPX = 300, MLDX = 118;            // couple : Napoléon devant, Marie-Louise dans la fente arrière
  const PUL = [900, 985];                  // poulie de la chèvre
  const BLOCKX = 895;

  // ================================================================ OUVRIER (marionnette propre au plan)
  const OU_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [32, -112], [34, -60], [31, -10], [27, 16], [-30, 18], [-34, -40], [-35, -110], [-33, -150], [-26, -168]];
  const OU_CAP = [[-34, 10], [30, 10], [32, -10], [18, -32], [-6, -40], [-30, -32], [-50, -14], [-62, 2], [-58, 14]];
  function mkOuvrier(capCol, seed, moustache) {
    const skin = '#dcb48c', shirt = '#ddd2b8', gilet = '#6b4a30';
    const parts = {
      torso: { parent: null, at: [0, 0], pts: OU_TORSO, base: shirt, seed: seed, paint: () => {
        M.fillPts([[-40, -150], [-6, -154], [2, -120], [14, -112], [30, -100], [34, -60], [30, -10], [27, 18], [-40, 20]], gilet);
        for (const y of [-90, -64, -38]) M.dot(24, y, 2.1, '#c9b28a');
        M.strokePts([[12, -170], [22, -150], [16, -136]], 'rgba(90,70,40,0.6)', 1.3);
        M.fillPts([[-36, 4], [30, 4], [30, 18], [-36, 18]], '#4b3a28');
        M.hatch([[-50, -170], [-10, -170], [-10, 30], [-50, 30]], 0.75, 4.2, 0.36);
        M.shade(34, 0, -36, 0, 0.3);
      } },
      legB: { parent: 'torso', at: [-6, 4], pts: X.legPts(0.95), base: '#4e4a3f', seed: seed + 1, noRivet: true, paint: () => { M.fillPts([[-40, 104], [60, 104], [60, 214], [-40, 214]], '#a99f88'); M.fillPts([[-40, 214], [60, 214], [60, 260], [-40, 260]], '#3d2a1a'); M.hatch(null, 0.8, 3.5, 0.32); } },
      legF: { parent: 'torso', at: [6, 4], pts: X.legPts(0.95), base: '#5c5749', seed: seed + 2, paint: () => {
        M.fillPts([[-40, 104], [60, 104], [60, 214], [-40, 214]], '#c4bba3');
        M.fillPts([[-40, 214], [60, 214], [60, 260], [-40, 260]], '#5a3a22');
        M.strokePts([[-20, 100], [24, 100]], 'rgba(40,30,20,0.6)', 2);
        M.hatch([[-26, -20], [-6, -20], [-6, 230], [-26, 230]], 0.8, 4, 0.28);
      } },
      armB_up: { parent: 'torso', at: [-10, -146], pts: X.armPts(94), base: '#bdb19a', seed: seed + 3, paint: () => M.hatch(null, 0.8, 3.6, 0.3) },
      armB_lo: { parent: 'armB_up', at: [0, 94], pts: () => X.forePts('fist'), base: '#bdb19a', seed: seed + 4, paint: () => { M.fillPts([[-20, 70], [20, 70], [24, 130], [-20, 130]], '#b9946e'); M.hatch(null, 0.8, 3.6, 0.25); } },
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: skin, seed: seed + 5, noRivet: true, paint: (pose) => {
        const f = pose.face || {};
        M.fillPts([[30, -112], [28, -76], [12, -72], [-12, -64], [-20, -34], [-42, -28], [-42, -112]], '#4a3b2e');
        X.earPaint(-8, -44);
        M.hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        M.dot(14, -30, 8, 'rgba(200,110,90,0.22)');
        if (moustache) M.fillPts([[30, -32], [22, -26], [12, -27], [15, -33], [24, -35]], '#3a2a1e');
        else M.strokePts([[4, -12], [10, -6], [20, -8]], 'rgba(60,40,30,0.35)', 1.2);
        X.eye(f, 17, -52); X.brow(f, 17, -59); X.mouth(f, 27, -24);
      } },
      cap: { parent: 'head', at: [-2, -80], pts: OU_CAP, base: capCol, seed: seed + 6, noRivet: true, paint: () => {
        M.fillPts([[-36, -2], [32, -2], [32, 12], [-36, 12]], 'rgba(0,0,0,0.18)');
        for (let k = -30; k < 30; k += 6) M.strokePts([[k, 10], [k + 1, -2]], 'rgba(0,0,0,0.25)', 1);
        M.hatch(null, 0.6, 3.6, 0.3); M.shade(0, -40, 0, 12, 0.25, [-70, -50, 40, 20]);
      } },
      armF_up: { parent: 'torso', at: [-2, -146], pts: X.armPts(94), base: shirt, seed: seed + 7, paint: () => { M.hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.32); M.strokePts([[-12, 40], [10, 46]], 'rgba(120,100,70,0.45)', 1.1); } },
      armF_lo: { parent: 'armF_up', at: [0, 94], pts: () => X.forePts('fist'), base: skin, seed: seed + 8, paint: () => {
        M.fillPts([[-16, -12], [16, -12], [16, 22], [-16, 22]], shirt);
        M.strokePts([[-12, 20], [12, 20]], 'rgba(120,100,70,0.6)', 1.3);
        M.strokePts([[0, 92], [12, 92]], 'rgba(60,30,20,0.5)', 1); M.strokePts([[-2, 99], [10, 99]], 'rgba(60,30,20,0.5)', 1);
        M.hatch([[-14, 20], [-4, 20], [-4, 110], [-14, 110]], 0.9, 3.6, 0.25);
      } },
    };
    return { hipY: -238, parts, handLen: 102, rod: { part: 'torso', at: [-22, 14] },
      order: ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'cap', 'torso', 'armF_up', 'armF_lo'] };
  }
  const OUV1 = mkOuvrier('#3f5277', 140, true);    // bonnet bleu (sourd)
  const OUV2 = mkOuvrier('#8a3d4c', 150, false);   // bonnet framboise (sourd)

  // maillet (repère de l'avant-bras : poing en (0,~92))
  function mallet() {
    M.piece([[-4.5, 84], [4.5, 84], [4.5, 150], [-4.5, 150]], '#8a6038', () => M.hatch(null, 0, 3, 0.25), { seed: 501 });
    M.piece([[-30, 142], [30, 142], [31, 176], [-31, 176]], '#6b4a2c', () => {
      M.hatch(null, 1.4, 3.4, 0.3);
      M.fillPts([[-24, 142], [-18, 142], [-18, 176], [-24, 176]], 'rgba(40,30,25,0.55)'); M.fillPts([[18, 142], [24, 142], [24, 176], [18, 176]], 'rgba(40,30,25,0.55)');
    }, { seed: 502 });
  }

  // ================================================================ décors
  function makeTree(kind) {
    const cv = M.cutFlat(460, 1060, 230, 1050, (x) => {
      const R = rng(kind.length * 31 + 7);
      const trunk = [[-30, 0], [-22, -260], [-26, -470], [-14, -640], [14, -640], [22, -470], [20, -260], [32, 0]];
      const bark = kind === 'winter' ? '#4a3d30' : '#4a3a2a';
      // branches
      const br = [[-10, -470, -150, -700], [8, -520, 140, -760], [-6, -600, -90, -840], [6, -610, 70, -880], [-120, -660, -190, -760], [110, -700, 180, -820]];
      for (const [x0, y0, x1, y1] of br) {
        const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny), w0 = 11, w1 = 4;
        M.piece([[x0 + nx / l * w0, y0 + ny / l * w0], [x1 + nx / l * w1, y1 + ny / l * w1], [x1 - nx / l * w1, y1 - ny / l * w1], [x0 - nx / l * w0, y0 - ny / l * w0]], bark, () => M.hatch(null, 0.3, 3.4, 0.3), { seed: x0 + 900, drop: false });
      }
      M.piece(trunk, bark, () => { M.hatch(null, 0.15, 3.5, 0.35); M.strokePts([[-6, -80], [-10, -240], [-4, -400]], 'rgba(20,10,5,0.4)', 1.3); }, { seed: 77 });
      if (kind === 'winter') {
        // neige de papier sur les branches
        for (const [x0, y0, x1, y1] of br) M.piece([[lerp(x0, x1, 0.25), lerp(y0, y1, 0.25) - 12], [x1, y1 - 10], [x1 + 4, y1 - 2], [lerp(x0, x1, 0.25) + 4, lerp(y0, y1, 0.25) - 4]], '#eee8da', null, { seed: x1, drop: false });
        M.piece([[-16, -640], [16, -640], [10, -656], [-10, -656]], '#eee8da', null, { seed: 9 });
        return;
      }
      const pal = { summer: ['#3d4a35', '#46553c', '#52613f'], autumn: ['#8f5427', '#a8692e', '#7a4520'], spring: ['#6d7e4c', '#7c8c55', '#647448'] }[kind];
      const blobs = [[-120, -700, 95], [110, -720, 100], [0, -820, 115], [-80, -880, 80], [80, -900, 85], [0, -640, 90], [-170, -780, 60], [170, -800, 62]];
      blobs.forEach(([cx, cy, r], k) => {
        const tp = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr = r * (0.82 + 0.18 * ((i % 2) ? 1 : 0.7)); tp.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]); }
        M.piece(tp, pal[k % 3], () => { M.hatch([[cx - r, cy], [cx + r, cy], [cx + r, cy + r], [cx - r, cy + r]], 0.8, 3.6, 0.38); }, { seed: k + kind.length });
      });
      if (kind === 'spring') {
        for (let i = 0; i < 46; i++) { const a = R() * TAU, b = blobs[i % blobs.length], rr = b[2] * 0.8 * Math.sqrt(R()); const px = b[0] + Math.cos(a) * rr, py = b[1] + Math.sin(a) * rr * 0.8; M.dot(px + 1, py + 1.5, 6.4, 'rgba(30,15,10,0.35)'); M.dot(px, py, 5.6, i % 3 ? '#e9dfcf' : '#c98b8f'); M.dot(px, py, 1.8, '#b08d45'); }
      }
      if (kind === 'autumn') {
        for (let i = 0; i < 30; i++) { const b = blobs[i % blobs.length]; const px = b[0] + (R() - 0.5) * b[2], py = b[1] + (R() - 0.5) * b[2] * 0.6; M.dot(px, py, 4, i % 2 ? '#c2843a' : '#6e3a1a'); }
      }
    });
    return M.withShadow(cv, 8);
  }
  function makeChantierBack() {
    return M.withShadow(M.cutFlat(1400, 520, 700, 510, (x) => {
      const wood = '#6a4428', woodL = '#86592f';
      // échafaudage bas derrière le massif gauche
      for (const px of [-250, -140]) M.piece([[px - 7, 0], [px + 7, 0], [px + 6, -300], [px - 6, -300]], wood, () => M.hatch(null, 0.1, 3.4, 0.3), { seed: px });
      for (const py of [-170, -270]) M.piece([[-292, py], [-98, py - 2], [-98, py + 12], [-292, py + 14]], woodL, () => { M.hatch(null, 0.05, 3.4, 0.25); }, { seed: py });
      x.strokeStyle = '#5a3a1f'; x.lineWidth = 6; x.beginPath(); x.moveTo(-250, -40); x.lineTo(-140, -165); x.moveTo(-250, -175); x.lineTo(-140, -265); x.stroke();
      M.piece([[-220, -270], [-190, -270], [-194, -300], [-216, -300]], '#7d6a52', () => M.hatch(null, 0.2, 3, 0.3), { seed: 61 });
      // pierres de taille en attente, sur l'échafaudage
      M.piece([[-200, -170], [-120, -170], [-122, -204], [-198, -204]], P.pierre, () => M.hatch(null, 0.8, 4, 0.3), { seed: 62 });
    }), 8);
  }
  function makeChantier() {
    return M.withShadow(M.cutFlat(1400, 520, 700, 510, (x) => {
      const wood = '#6a4428', woodL = '#86592f';

      // les deux massifs des piliers (deux assises, hauteur de genou) + socle saillant
      for (const d of [-1, 1]) {
        const xo = d * PIER_OUT, xi = d * PIER_IN, a = Math.min(xo, xi), b = Math.max(xo, xi);
        const pts = [[a - 10, 0, 1], [b + 10, 0, 1], [b + 10, -16, 1], [b, -16, 1], [b, -2 * COURSE, 1], [a, -2 * COURSE, 1], [a, -16, 1], [a - 10, -16, 1]];
        M.piece(pts, P.pierre, () => {
          const g = x.createLinearGradient(a, 0, b, 0); g.addColorStop(0, 'rgba(255,250,235,0.18)'); g.addColorStop(1, 'rgba(60,45,30,0.18)'); x.fillStyle = g; x.fillRect(a - 12, -100, b - a + 24, 100);
          x.strokeStyle = 'rgba(95,78,55,0.6)'; x.lineWidth = 1.6; x.beginPath();
          x.moveTo(a, -16); x.lineTo(b, -16); x.moveTo(a, -16 - 38); x.lineTo(b, -16 - 38);
          const R = rng(80 + d);
          for (const [y0, y1] of [[-16, -54], [-54, -92]]) { let xx = a + 30 + R() * 50; while (xx < b - 20) { x.moveTo(xx, y0); x.lineTo(xx, y1); xx += 62 + R() * 30; } }
          x.stroke();
          x.fillStyle = 'rgba(60,45,30,0.25)'; x.fillRect(a - 10, -16, b - a + 20, 4);
          const R2 = rng(90 + d); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${R2() < 0.5 ? '70,55,40' : '255,250,235'},${R2() * 0.2})`; x.fillRect(a + R2() * (b - a), -92 + R2() * 92, 1 + R2() * 2, 1 + R2() * 2); }
          M.hatch([[b - 40, -100], [b + 12, -100], [b + 12, 0], [b - 40, 0]], 0.8, 4, 0.3);
        }, { seed: 85 + d });
      }
      // une pierre de la 3e assise, posée seule sur le massif gauche
      M.piece([[-PIER_OUT + 14, -2 * COURSE, 1], [-PIER_OUT + 104, -2 * COURSE, 1], [-PIER_OUT + 102, -2 * COURSE - 40, 1], [-PIER_OUT + 16, -2 * COURSE - 40, 1]], P.pierreL, () => M.hatch([[-PIER_OUT + 70, -140], [-PIER_OUT + 110, -140], [-PIER_OUT + 110, -80], [-PIER_OUT + 70, -80]], 0.8, 4, 0.3), { seed: 73 });
    }), 8);
  }
  function makeChevre() {
    return M.withShadow(M.cutFlat(420, 520, 210, 500, (x) => {
      const ax = PUL[0] - BLOCKX, ay = PUL[1] - PIERY;  // repère : bas-centre au pied de la chèvre (x = BLOCKX)
      const legs = [[-112, 0], [108, 0]];
      for (const [lx, ly] of legs) {
        const nx = -(ay - ly), ny = ax - lx, l = Math.hypot(nx, ny);
        M.piece([[lx + nx / l * 9, ly + ny / l * 9], [ax + nx / l * 6, ay + ny / l * 6], [ax - nx / l * 6, ay - ny / l * 6], [lx - nx / l * 9, ly - ny / l * 9]], '#7a4f2c', () => M.hatch(null, 0.3, 3.5, 0.3), { seed: lx + 2000 });
      }
      // traverse
      M.piece([[-84, -150], [82, -150], [80, -138], [-82, -138]], '#6a4428', null, { seed: 2100 });
      // poulie
      M.piece([[ax - 20, ay - 30], [ax + 20, ay - 30], [ax + 14, ay + 6], [ax - 14, ay + 6]], '#5a3a1f', null, { seed: 2101 });
      const wh = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; wh.push([ax + Math.cos(a) * 16, ay + 2 + Math.sin(a) * 16]); }
      M.piece(wh, '#8b7356', () => { M.dot(ax, ay + 2, 4, '#3a2a1a'); }, { seed: 2102 });
    }), 7);
  }
  function makeSnowRow() {
    return M.withShadow(M.cutFlat(M.W + 120, 140, (M.W + 120) / 2, 130, (x) => {
      const pts = [[-600, 0, 1]];
      for (let k = 0; k <= 24; k++) pts.push([-600 + k * 50, -40 - 18 * Math.sin(k * 1.3) - 10 * Math.sin(k * 0.5)]);
      pts.push([600, 0, 1]);
      M.piece(pts, '#e9e4d8', () => { M.hatch(null, 0.2, 5, 0.12, 1, P.encre, [-600, -80, 600, 0]); M.shade(0, -80, 0, 0, 0.25, [-600, -80, 600, 0], '90,100,130'); }, { seed: 3001 });
    }), 6);
  }
  S.init = () => {
    K = {
      sky: M.makeSky('paris'), row: M.makeParisRow(), wingL: M.makeTreeWing(5, false),
      cloud1: M.makeCloud(1, 0.9), cloud2: M.makeCloud(2, 0.75),
      trees: { summer: makeTree('summer'), autumn: makeTree('autumn'), winter: makeTree('winter'), spring: makeTree('spring') },
      chantierBack: makeChantierBack(), chantier: makeChantier(), chevre: makeChevre(), snowRow: makeSnowRow(),
    };
  };

  // ================================================================ saisons
  const SEASONS = [['summer', -1], ['autumn', E.autumn], ['winter', E.winter], ['spring', E.spring]];
  function treeY(i, t) {
    // descend des cintres à son tour, remonte quand le suivant arrive
    const tin = SEASONS[i][1], tout = i < 3 ? SEASONS[i + 1][1] : 1e9, d = E.swapDur;
    const down = tin < 0 ? 1 : easeOut((t - tin) / d);
    const up = easeIn((t - tout) / d);
    return -1250 * (1 - down) - 1250 * up + (tin > 0 ? wob(t, tin + d, -14, 2.6, 6) : 0);
  }
  function seasonTint(t) {
    const cols = [[255, 243, 220], [242, 206, 160], [196, 206, 222], [255, 232, 186]];
    const w = [1, smooth(E.autumn, E.autumn + 0.3, t), smooth(E.winter, E.winter + 0.3, t), smooth(E.spring, E.spring + 0.3, t)];
    let col = cols[0];
    for (let i = 1; i < 4; i++) col = col.map((v, k) => lerp(v, cols[i][k], w[i]));
    return col;
  }
  // feuilles mortes de papier
  const LEAVES = []; { const R = rng(17); for (let i = 0; i < 26; i++) LEAVES.push({ x: 780 + R() * 220, y: 620 + R() * 260, t0: E.leaves0 + R() * 0.45, v: 380 + R() * 200, ph: R() * TAU, c: R() < 0.5 ? '#a8692e' : '#8f5427', land: ST.back + 10 + R() * 60 }); }
  function leaves(t) {
    if (t > E.close1) return;
    const c = ctx();
    for (const l of LEAVES) {
      const u = t - l.t0; if (u < 0) continue;
      let y = l.y + u * l.v, x = l.x + Math.sin(u * 4 + l.ph) * 28 - u * 40, rot = u * 3 + l.ph, fl = Math.cos(u * 6 + l.ph);
      if (y > l.land) { const u1 = (l.land - l.y) / l.v; y = l.land; x = l.x + Math.sin(u1 * 4 + l.ph) * 28 - u1 * 40; rot = 1.5 + l.ph; fl = 0.35; }
      const a = 1 - smooth(E.winter + 0.2, E.winter + 0.6, t);  // recouvertes par la neige
      if (a <= 0) continue;
      c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot); c.scale(fl, 1);
      c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(0, -8, 11, 0); c.quadraticCurveTo(0, 8, -11, 0);
      c.fillStyle = 'rgba(20,10,5,0.3)'; c.translate(1, 1.5); c.fill(); c.translate(-1, -1.5);
      c.fillStyle = l.c; c.fill(); c.strokeStyle = 'rgba(50,25,10,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, 0); c.lineTo(10, 0); c.stroke();
      c.restore();
    }
  }
  // neige de papier qui tombe des cintres
  const SNOW = []; { const R = rng(29); for (let i = 0; i < 120; i++) SNOW.push({ x: 70 + R() * 940, t0: E.snow0 + R() * (E.snow1 - E.snow0 - 0.4), v: 520 + R() * 260, ph: R() * TAU, s: 3 + R() * 4 }); }
  function snow(t) {
    if (t > E.close1) return;
    const c = ctx();
    for (const f of SNOW) {
      const u = t - f.t0; if (u < 0) continue;
      const y = 160 + u * f.v; if (y > ST.slotF) continue;
      const x = f.x + Math.sin(u * 3 + f.ph) * 14;
      const fl = Math.abs(Math.cos(u * 5 + f.ph)) * 0.7 + 0.3;
      c.beginPath(); c.ellipse(x + 1, y + 1.5, f.s, f.s * fl, 0, 0, TAU); c.fillStyle = 'rgba(20,20,30,0.25)'; c.fill();
      c.beginPath(); c.ellipse(x, y, f.s, f.s * fl, 0, 0, TAU); c.fillStyle = '#f2eee4'; c.fill();
    }
  }
  const winterK = (t) => smooth(E.winter + 0.2, E.winter + 0.6, t) * (1 - smooth(E.spring, E.spring + 0.35, t));
  function snowCaps(t, k) {
    if (k <= 0.01) return;
    const c = ctx();
    c.save(); c.globalAlpha = k;
    for (const d of [-1, 1]) {
      const a = CX + Math.min(d * PIER_OUT, d * PIER_IN), b = CX + Math.max(d * PIER_OUT, d * PIER_IN);
      const pts = [[a - 4, TOPY + 2]]; for (let i = 0; i <= 10; i++) pts.push([lerp(a, b, i / 10), TOPY - 8 - 5 * Math.sin(i * 1.9 + d)]); pts.push([b + 4, TOPY + 2], [b, TOPY + 8], [a, TOPY + 8]);
      M.piece(pts, '#eee9dd', null, { seed: 3100 + d });
    }
    c.restore();
  }

  // ================================================================ le bloc de la chèvre
  function blockY(t) {
    const u = clamp((t - E.block0) / (E.blockLand - E.block0));
    return lerp(TOPY - 120, TOPY, u * u * (3 - 2 * u)) + (t > E.blockLand ? wob(t, E.blockLand, -3, 3, 9) : 0);
  }

  // ================================================================ poses
  function strikeK(t) {
    // 0 = maillet levé, 1 = frappe ; frappes à hit1, hit2, hit3
    let k = 0.35;
    for (const h of [E.hit1, E.hit2, E.hit3]) {
      const up = smooth(h - 0.6, h - 0.2, t), dn = easeIn(clamp((t - (h - 0.2)) / 0.2)), back = smooth(h + 0.05, h + 0.45, t);
      if (t > h - 0.65 && t < h + 0.5) k = t < h - 0.2 ? lerp(0.35, 0, up) : t < h ? dn : lerp(1, 0.35, back) + wob(t, h, -0.08, 3, 9);
    }
    return k;
  }
  function w2Pose(t) {
    const p = { dy: Math.sin(t * 2.2 + 1) * 1.2 + W2DY / WS, ang: { armB_up: 0.2, armB_lo: -0.5, head: 0.12 }, face: { brow: 'n' } };
    const wk = winterK(t);
    p.dx = Math.sin(t * 40) * 1.2 * wk;                 // il grelotte un peu
    const work = 1 - smooth(E.look0 - 0.4, E.look0, t);
    const k = strikeK(t);
    // haut (maillet levé au-dessus de l'épaule) ↔ frappe (vers la pierre)
    const base = { dy: W2DY / WS, ang: { armB_up: 0.2, armB_lo: -0.5, head: 0.12 } };
    const sol = M.ik(OUV2, base, W2X, FEETB, WS, -1, 'armF', [596, 1236], 1);
    const upA = [-2.6, -0.7], hitA = [sol.up, sol.lo], idleA = [0.1, -0.35];
    const wa = [lerp(upA[0], hitA[0], k), lerp(upA[1], hitA[1], k)];
    p.ang.armF_up = lerp(idleA[0], wa[0], work); p.ang.armF_lo = lerp(idleA[1], wa[1], work);
    p.tilt = 0.13 * k * work;
    if (t > E.look0) { const kl = smooth(E.look0, E.look1, t); p.ang.head = lerp(0.12, 0.28, kl); p.face = { brow: 'up', mouth: 'n' }; }
    if (t > E.cross0) { const kc = smooth(E.cross0, E.cross0 + 0.2, t); p.ang.head = lerp(0.28, -0.08, kc); p.face = { brow: 'up', eyes: 'wide', mouth: 'o' }; p.ang.armF_lo = lerp(p.ang.armF_lo, -0.15, smooth(E.drop - 0.05, E.drop + 0.1, t)); p.tilt = -0.04 * kc; }
    return p;
  }
  function w1State(t) {
    // ouvrier à la corde : il file la corde main sur main pendant que le bloc descend, puis se retourne vers le couple
    const flip = smooth(E.look0, E.look0 + 0.3, t);
    return { dir: Math.cos(Math.PI * flip) || 0.001, flip };
  }
  function napPose(t, walking) {
    const p = { tuck: true, handF: 'open', dy: Math.sin(t * 2.0) * 1.2 + walking.dy, tilt: walking.tilt, ang: { armF_up: 0.18, armF_lo: -1.85, armB_up: 0.2, armB_lo: -1.15, legF: walking.leg, legB: -walking.leg, head: -0.08 }, face: { brow: 'frown', mouth: 'n' } };
    const A = p.ang;
    if (t > E.smile && t < E.offer0) { p.face = { brow: 'n', mouth: 'smile' }; A.head = -0.14; }
    // main ouverte tendue vers le chantier
    const ko = smooth(E.offer0, E.offer1, t) * (1 - smooth(E.cross0 - 0.08, E.cross0 + 0.08, t));
    if (ko > 0.01) {
      p.tuck = ko < 0.3 && t < E.offer1; p.handF = 'open';
      const kb = Math.min(1.06, spring(t - E.offer0, 0.55, 12)) * (1 - smooth(E.cross0 - 0.08, E.cross0 + 0.08, t));
      A.armF_up = lerp(0.18, -0.95, kb); A.armF_lo = lerp(-1.85, -0.4, kb);
      p.face = { brow: 'up', mouth: 'n' }; A.head = -0.12;
    }
    if (t > E.look0 && t < E.cross0) { const kl = smooth(E.look0, E.look1, t); A.head = lerp(-0.12, 0.2, kl); p.face = { brow: kl > 0.5 ? 'frown' : 'up', mouth: kl > 0.5 ? 'tight' : 'n', eyes: 'open' }; }
    // « Immédiatement » : bras croisés, deux tapes de pied
    if (t > E.cross0 - 0.08) {
      const kc = Math.min(1.05, spring(t - E.cross0, 0.6, 16));
      p.tuck = false; p.handF = 'fist';
      A.armF_up = lerp(-1.0, 0.55, kc); A.armF_lo = lerp(0.0, -2.05, kc);
      A.armB_up = lerp(0.2, 0.45, kc); A.armB_lo = lerp(-1.15, -1.75, kc);
      A.head = lerp(0.2, -0.04, smooth(E.cross0, E.cross1, t));
      p.face = { brow: 'frown', mouth: 'tight', eyes: 'open' };
      for (const s of [E.stamp1, E.stamp2]) {
        const lift = smooth(s - 0.13, s - 0.04, t) * (1 - smooth(s - 0.04, s, t));
        A.legF += -0.32 * lift; p.dy += -6 * lift + wob(t, s, 3, 4, 14);
      }
    }
    return p;
  }
  function walkState(t, ph) {
    const env = smooth(E.walk0, E.walk0 + 0.2, t) * (1 - smooth(E.walk1 - 0.25, E.walk1 + 0.05, t));
    const p = (t - E.walk0) * 2.3 + ph;
    return { dy: -Math.abs(Math.sin(Math.PI * p)) * 11 * env, leg: Math.sin(TAU * p * 0.5) * 0.24 * env, tilt: 0.045 * env };
  }
  function coupleX(t) {
    const u = clamp((t - E.walk0) / (E.walk1 - E.walk0));
    const v = u < 0.15 ? u * u / 0.3 : u > 0.85 ? 1 - (1 - u) * (1 - u) / 0.3 : (u - 0.075) / 0.85;
    return lerp(-240, NAPX, v);
  }

  // ================================================================ cœur de carton sur son fil
  function heart(t) {
    if (t < E.heart0 || t > E.heartUp1 + 0.05) return;
    const c = ctx();
    const d = easeOut((t - E.heart0) / (E.heart1 - E.heart0)), u = easeIn((t - E.heartUp0) / (E.heartUp1 - E.heartUp0));
    const y = lerp(120, 770, d) - 700 * u + wob(t, E.heart1, -10, 2.4, 6);
    const x = 242, rot = wob(t, E.heart1, 0.12, 1.6, 4) + 0.03 * Math.sin(t * 3);
    c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y - 40); c.lineTo(x + Math.sin(rot) * -600, 0); c.stroke();
    c.save(); c.translate(x, y); c.rotate(rot);
    const pts = [];
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; pts.push([16 * Math.pow(Math.sin(a), 3) * 2.9, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 2.9, i === 0 || i === 14 ? 1 : 0]); }
    M.piece(pts, P.sangL, () => { M.hatch([[0, -60], [50, -60], [50, 50], [0, 50]], 0.8, 3.6, 0.3); M.shade(-30, -30, 30, 40, 0.35, [-50, -50, 50, 50]); }, { seed: 4001 });
    M.rivet(0, -28, 3);
    c.restore();
  }

  // gabarit : perches et cordeaux qui tracent dans le vide la silhouette de l'arc promis (50 m)
  function gabarit(t) {
    const c = ctx();
    const xo = CX - PIER_OUT + 4, xO = CX + PIER_OUT - 4, xi = CX - PIER_IN, xI = CX + PIER_IN;
    const H = (xO - xo) * 50 / 45, top = TOPY - H, corn = TOPY - H * 0.67, spr = TOPY - H * 0.58 + PIER_IN;
    const pole = (x, y1) => { M.piece([[x - 4, TOPY + 2], [x + 4, TOPY + 2], [x + 3, y1], [x - 3, y1]], '#7a5232', () => M.hatch(null, 0.1, 3.2, 0.25), { seed: x }); M.dot(x, y1, 4.5, '#cf3b2f'); };
    const sway = (k) => 0.6 * Math.sin(t * 1.3 + k);
    c.save(); c.lineCap = 'round';
    for (const [lw, col] of [[4.2, 'rgba(20,12,6,0.3)'], [2.6, '#d2ad6c']]) {
      c.strokeStyle = col; c.lineWidth = lw; const o = lw > 2 ? 2 : 0;
      c.beginPath();
      c.moveTo(xo + o, TOPY + o); c.lineTo(xo + o, top + o); c.quadraticCurveTo(CX + o, top + 7 + sway(1) + o, xO + o, top + o); c.lineTo(xO + o, TOPY + o);
      c.moveTo(xo + o, corn + o); c.quadraticCurveTo(CX + o, corn + 6 + sway(2) + o, xO + o, corn + o);
      c.moveTo(xi + o, TOPY + o); c.lineTo(xi + o, spr + o); c.arc(CX + o, spr + o, PIER_IN, Math.PI, 2 * Math.PI); c.lineTo(xI + o, TOPY + o);
      c.stroke();
    }
    c.restore();
    pole(xo, top - 8); pole(xO, top - 8); pole(xi, spr - 6); pole(xI, spr - 6);
  }
  // ================================================================ dessin
  function curtainState(t) {
    let f = 1, swing = 0;
    if (t > E.close0 && t < E.open1 + 0.01) {
      if (t < E.open0) f = 1 - ease((t - E.close0) / (E.close1 - E.close0));
      else f = ease((t - E.open0) / (E.open1 - E.open0));
      swing = t < E.close1 ? 18 * Math.sin(Math.PI * clamp((t - E.close0) / (E.close1 - E.close0))) : -14 * Math.sin(Math.PI * clamp((t - E.open0) / (E.open1 - E.open0)));
    }
    swing += wob(t, E.open1, 22, 0.9, 2.8);
    return { f, swing };
  }
  function sweat(c, w, t0, t, list) {
    for (const [dt, lx, ly, dir] of list) {
      const t1 = t0 + dt; if (t < t1) continue;
      const u = clamp((t - t1) / 0.4), p0 = w(lx, ly), pop = Math.min(1, spring(t - t1, 0.5, 18));
      const x = p0[0] + dir * 6 * easeOut(u), y = p0[1] + 30 * easeIn(u);
      c.save(); c.translate(x, y); c.scale(pop, pop);
      c.beginPath(); c.moveTo(0, -11); c.quadraticCurveTo(7, 1, 0, 6); c.quadraticCurveTo(-7, 1, 0, -11); c.closePath();
      c.fillStyle = 'rgba(20,15,25,0.35)'; c.translate(1, 1.5); c.fill(); c.translate(-1, -1.5);
      c.fillStyle = '#a9bfdc'; c.fill(); c.strokeStyle = 'rgba(40,50,80,0.75)'; c.lineWidth = 1.3; c.stroke();
      c.beginPath(); c.arc(-1.8, -1, 1.6, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill();
      c.restore();
    }
  }

  S.draw = (t) => {
    const c = ctx();
    const after = t > E.close1 + 0.02;     // après le rideau : printemps doré de 1810
    const wk = after ? 0 : winterK(t);
    // ---- toile de fond + teinte de la saison
    c.drawImage(K.sky, 0, 0);
    const tint = after ? [255, 226, 170] : seasonTint(t);
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${tint.map(Math.round).join(',')})`; c.fillRect(0, 0, M.W, ST.back + 5); c.restore();
    M.hung(K.cloud1, 300, 430, t, { amp: 0.02, cast });
    M.hung(K.cloud2, 640, 330, t, { ph: 2, amp: 0.025, cast });
    M.flat(K.row, 540, ST.back + 2 * Math.sin(t * 1.3));
    M.flat(K.wingL, 120, ST.back, { rot: 0.006 * Math.sin(t * 0.9), cast });
    // ---- l'arbre des saisons (changements par les cintres)
    const TX = 905;
    if (after) M.flat(K.trees.spring, TX, ST.back, { cast, rot: 0.004 * Math.sin(t * 0.8) });
    else SEASONS.forEach(([k], i) => { const dy = treeY(i, t); if (dy > -1240) { if (dy < -5) { c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3; c.beginPath(); for (const ox of [-120, 120]) { c.moveTo(TX + ox, ST.back + dy - 900); c.lineTo(TX + ox, 0); } c.stroke(); } M.flat(K.trees[k], TX, ST.back + dy, { cast, clipY: ST.back + 1 }); } });
    // ---- ferme enneigée qui monte de la trappe
    if (!after) {
      const sr = easeOut((t - E.snowRow0) / 0.3) * (1 - easeIn((t - E.snowRow1) / 0.3));
      if (sr > 0.001) M.flat(K.snowRow, 540, ST.back + (1 - sr) * 120, { clipY: ST.back + 1 });
    }
    leaves(t);
    M.drawFloor();

    // ---- ouvrier 1 (corde, derrière le massif droit : « dans la fouille »)
    const s1 = w1State(t);
    const w1p = { dy: Math.sin(t * 2 + 2) * 1.2 + W1DY / WS, ang: { head: -0.25 }, face: { brow: 'n' }, tilt: -0.05 };
    if (t < E.look0) {
      // il file la corde main sur main (le bloc descend), regard vers la poulie
      const hp = (u) => [lerp(838, 868, u), lerp(1095, 1010, u)];
      const ph = (t * 1.1) % 1, ph2 = (t * 1.1 + 0.5) % 1;
      const sF = M.ik(OUV1, w1p, W1X, FEETB, WS, 1, 'armF', hp(ph), 1), sB = M.ik(OUV1, w1p, W1X, FEETB, WS, 1, 'armB', hp(ph2), 1);
      w1p.ang.armF_up = sF.up; w1p.ang.armF_lo = sF.lo; w1p.ang.armB_up = sB.up; w1p.ang.armB_lo = sB.lo;
      w1p.ang.head = -0.35;
    } else {
      w1p.ang.armF_up = -0.2; w1p.ang.armF_lo = -0.6; w1p.ang.armB_up = 0.1; w1p.ang.armB_lo = -0.5;
      w1p.ang.head = 0.05; w1p.tilt = 0; w1p.face = t > E.cross0 ? { brow: 'up', eyes: 'wide', mouth: 'o' } : { brow: 'up', mouth: 'n' };
    }
    w1p.dx = Math.sin(t * 40 + 1) * 1.2 * wk;
    const r1 = M.puppet(OUV1, w1p, W1X, FEETB, WS, { dir: s1.dir, slot: ST.slotB, cast, floorShadow: false });
    // corde : poulie → mains → derrière le massif
    c.strokeStyle = '#a88a5c'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(PUL[0] - 14, PUL[1] + 4);
    if (t < E.look0) { const h1 = r1.w('armF_lo', 0, 92), h2 = r1.w('armB_lo', 0, 92); const lo = h1[1] > h2[1] ? h1 : h2; c.lineTo(lo[0], lo[1]); c.lineTo(lo[0] - 30, TOPY + 20); }
    else c.quadraticCurveTo(820, 1200, 780, TOPY + 20);
    c.stroke();

    // ---- ouvrier 2 (maillet, dans l'ouverture entre les massifs)
    const p2 = w2Pose(t);
    const r2 = M.puppet(OUV2, p2, W2X, FEETB, WS, { dir: -1, slot: ST.slotB, cast });
    if (t < E.drop) { c.save(); c.setTransform(r2.mats.armF_lo); mallet(); c.restore(); }
    // neige sur les bonnets
    if (wk > 0.01) for (const r of [r1, r2]) { const q = r.w('cap', -6, -36); c.save(); c.globalAlpha = wk; c.beginPath(); c.ellipse(q[0], q[1] + 2, 24, 8, 0, 0, TAU); c.fillStyle = '#eee9dd'; c.fill(); c.strokeStyle = 'rgba(60,60,70,0.4)'; c.lineWidth = 1; c.stroke(); c.restore(); }

    // ---- les massifs (ferme entre les fentes), le bloc, la chèvre
    M.flat(K.chantier, CX, PIERY, { cast: { dx: 14, dy: 5, a: 0.35 } });
    gabarit(t);
    const by = blockY(t);
    c.strokeStyle = '#a88a5c'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(PUL[0], PUL[1] + 2); c.lineTo(BLOCKX, by - 64); c.stroke();
    c.save(); c.translate(BLOCKX, by);
    M.piece([[-52, 0, 1], [52, 0, 1], [52, -44, 1], [-52, -44, 1]], P.pierreL, () => { M.hatch([[20, -50], [60, -50], [60, 4], [20, 4]], 0.8, 4, 0.3); const R = rng(5); for (let i = 0; i < 60; i++) M.dot(-50 + R() * 100, -42 + R() * 40, 0.8 + R(), `rgba(70,55,40,${R() * 0.3})`); }, { seed: 4100 });
    c.strokeStyle = '#a88a5c'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-46, -44); c.lineTo(0, -64); c.lineTo(46, -44); c.stroke();
    M.dot(0, -64, 4, '#5a4026');
    c.restore();
    snowCaps(t, wk);
    if (wk > 0.01) { c.save(); c.globalAlpha = wk; M.piece([[BLOCKX - 54, by - 42], [BLOCKX + 54, by - 42], [BLOCKX + 46, by - 52], [BLOCKX - 46, by - 52]], '#eee9dd', null, { seed: 4200 }); c.restore(); }
    M.flat(K.chevre, BLOCKX, PIERY, { cast: { dx: 16, dy: 6, a: 0.3 } });
    // le maillet lâché tombe au sol dans l'ouverture
    if (t >= E.drop) {
      const m0 = M.partMatrices(OUV2, w2Pose(E.drop), W2X, FEETB, WS, -1).mats.armF_lo;
      const u = clamp((t - E.drop) / (E.dropLand - E.drop)), land = t > E.dropLand;
      const p0 = M.wpt(m0, 0, 150);
      const yy = lerp(p0[1], ST.slotB - 8, u * u) + (land ? -Math.abs(Math.sin((t - E.dropLand) * 12)) * 12 * Math.exp(-9 * (t - E.dropLand)) : 0);
      const xx = p0[0] - 26 * u;
      const rot = lerp(0, 1.5, easeIn(u)) + (land ? wob(t, E.dropLand, 0.08, 3, 10) : 0);
      c.save(); c.translate(xx, yy); c.rotate(rot); c.scale(-WS, WS); c.translate(0, -160); mallet(); c.restore();
    }

    // ---- l'architecte (fente avant, à droite) : il tient son plan roulé
    const arPose = { ang: { armB_up: 0.25, armB_lo: -0.7, armF_up: 0.05, armF_lo: -0.15, head: 0.08 }, face: { brow: 'worry', mouth: 'n' }, dy: Math.sin(t * 1.9) * 1.2 };
    arPose.dx = Math.sin(t * 38) * 1.0 * wk;
    if (t > E.walk0 && t < E.look0) arPose.face = { brow: 'up', mouth: 'smile' };
    if (t > E.look0) { const kl = smooth(E.look0, E.look1, t); arPose.ang.head = lerp(0.08, 0.2, kl); arPose.face = { brow: 'worry', mouth: 'tight' }; }
    if (t > E.sweat0) { const ks = smooth(E.sweat0, E.sweat0 + 0.25, t); arPose.face = { brow: 'worry', mouth: 'tight', eyes: 'wide' }; arPose.dy += 6 * ks; arPose.ang.head = lerp(0.2, -0.04, ks); arPose.tilt = -0.03 * ks; }
    const ra = M.puppet(C.architecte, arPose, ARX, FEET, ARS, { dir: -1, slot: ST.slotF, cast });
    if (t > E.sweat0) sweat(c, ra.w, E.sweat0, t, [[0.05, -2, -74, 1], [0.2, -16, -66, 1], [0.34, 10, -80, 1]]);

    // ---- le couple : Marie-Louise (fente arrière) au bras de Napoléon (fente avant)
    if (t > E.walk0) {
      const nx = coupleX(t), mx = nx - MLDX;
      const wn = walkState(t, 0), wm = walkState(t, 0.35);
      const np = napPose(t, wn);
      const nr = M.partMatrices(C.napoleon, np, nx, FEET, 1, 1).mats;
      const mlPose = { dy: wm.dy + Math.sin(t * 2.1 + 1) * 1.2, tilt: wm.tilt, ang: { armB_up: 0.15, armB_lo: -0.2, mantle: Math.sin(t * 4.6) * 0.03, head: 0.02 }, face: { mouth: 'smile' } };
      const tgt = M.wpt(nr.armB_lo, 0, 30);
      const sol = M.ik(C.marieLouise, mlPose, mx, FEETB, 1, 1, 'armF', tgt, -1);
      mlPose.ang.armF_up = sol.up; mlPose.ang.armF_lo = sol.lo;
      if (t > E.smile && t < E.look0) { const k = smooth(E.smile, E.smile + 0.3, t); mlPose.ang.head = lerp(0.02, 0.16, k); mlPose.face = { mouth: 'smile', eyes: k > 0.5 ? 'half' : 'open' }; }
      if (t > E.look0) { const k = smooth(E.look0, E.look1, t); mlPose.ang.head = lerp(0.16, 0.22, k); mlPose.face = { mouth: t > E.cross0 ? 'tight' : 'n', eyes: 'open', brow: 'up' }; }
      M.puppet(C.marieLouise, mlPose, mx, FEETB, 1, { dir: 1, slot: ST.slotB, cast });
      M.puppet(C.napoleon, np, nx, FEET, 1, { dir: 1, slot: ST.slotF, cast, handRod: np.ang.armF_up < -0.5 ? ['armF_lo', 0, 70] : null, handRodAng: -0.05 });
    }
    snow(t);
    heart(t);

    // ---- lumière : grise l'hiver, dorée en 1810
    M.stageLight(t, { spot: { x: after ? 560 : 640, y: 1080, r: after ? 540 : 560, a: after ? 0.34 : 0.3 + 0.12 * wk } });
    if (after) { c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(255,200,110,0.22)'; c.fillRect(ST.L, ST.top, ST.R - ST.L, ST.front - ST.top); c.restore(); }
    const cs = curtainState(t);
    M.curtain(t, cs.f, { swing: cs.swing });
    M.drawFrame(t);
  };
  return S;
})();
