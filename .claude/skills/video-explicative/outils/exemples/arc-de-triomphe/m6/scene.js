// Extrait m6 — « Même mort » (théâtre de marionnettes à tiges) — dernier plan, le rideau reste ouvert.
const SCENE = (() => {
  const S = {}, E = TL.EVENTS, C = M.chars, ST = M.ST, W = M.W, H = M.H;
  const { clamp, lerp, ease, easeOut, smooth, wob, TAU } = M;
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  const ARCX = 500, AS = 0.9;
  const ctx = () => M.ctx();
  let K;

  // ---------------------------------------------------------------- utilitaires de décor
  function goldV(x, y0, y1) {
    const g2 = x.createLinearGradient(0, y0, 0, y1);
    g2.addColorStop(0, '#5f4519'); g2.addColorStop(0.3, '#d6b46a'); g2.addColorStop(0.5, '#f0d793'); g2.addColorStop(0.7, '#a7823b'); g2.addColorStop(1, '#4a3412');
    return g2;
  }
  // neige posée sur les arêtes hautes d'un décor découpé (bande blanche bombée)
  function snowCap(cv, th = 8) {
    const cap = M.pre(cv.width, cv.height, (x) => {
      x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'destination-out'; x.drawImage(cv, 0, th);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = '#f1ede3'; x.fillRect(0, 0, cv.width, cv.height);
    });
    const dark = M.pre(cv.width, cv.height, (x) => { x.drawImage(cap, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgba(60,70,90,1)'; x.fillRect(0, 0, cv.width, cv.height); });
    const x = cv.getContext('2d');
    x.save(); x.globalAlpha = 0.35; x.drawImage(dark, 0, 1); x.restore();
    x.drawImage(cap, 0, -3); x.drawImage(cap, 1, -4);
    x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.18; x.drawImage(dark, 0, -1); x.restore();
    return cv;
  }
  function darken(cv, f) { const d = M.pre(cv.width, cv.height, (x) => { x.filter = `brightness(${f}) saturate(0.85)`; x.drawImage(cv, 0, 0); }); d.padB = cv.padB; return d; }
  function flatCv(w, h, padB, fn) { const cv = M.cutFlat(w, h, w / 2, h - padB, fn); cv.padB = padB; return cv; }

  // toile de fond : ciel d'hiver gris-bleu (même facture que les toiles du kit)
  function snowSky() {
    return M.pre(W, ST.back + 5, (x) => {
      const g0 = x.createLinearGradient(0, 0, 0, ST.back);
      for (const [o, col] of [[0, '#55627a'], [0.45, '#8f99a8'], [0.8, '#c6c8c4'], [1, '#d6d1c4']]) g0.addColorStop(o, col);
      x.fillStyle = g0; x.fillRect(0, 0, W, ST.back + 5);
      const R = M.rng(61);
      for (let i = 0; i < 260; i++) {
        const cx = R() * W, cy = R() * ST.back, l = 40 + R() * 160;
        x.strokeStyle = `rgba(${R() < 0.5 ? '245,245,240' : '30,35,50'},${0.03 + R() * 0.04})`; x.lineWidth = 6 + R() * 18; x.lineCap = 'round';
        x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + l / 2, cy + (R() - 0.5) * 20, cx + l, cy + (R() - 0.5) * 12); x.stroke();
      }
      for (const [cx, cy, s] of [[250, 470, 1.1], [790, 360, 1.3], [560, 640, 0.9]]) {
        for (let k = 0; k < 14; k++) { x.beginPath(); x.ellipse(cx + (R() - 0.5) * 220 * s, cy + (R() - 0.5) * 40 * s, (40 + R() * 70) * s, (16 + R() * 22) * s, 0, 0, TAU); x.fillStyle = 'rgba(235,236,240,0.10)'; x.fill(); }
      }
      // flocons peints sur la toile (immobiles)
      for (let i = 0; i < 160; i++) { x.beginPath(); x.arc(R() * W, R() * ST.back, 1.5 + R() * 2.5, 0, TAU); x.fillStyle = `rgba(250,250,245,${0.18 + R() * 0.25})`; x.fill(); }
      for (let sx = 210; sx < W; sx += 330) { x.fillStyle = 'rgba(40,30,20,0.12)'; x.fillRect(sx, 0, 2, ST.back); }
      x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, W, ST.back + 5);
    });
  }
  // tapis de neige en papier posé sur le plancher (fentes dégagées)
  function snowFloor() {
    const h = ST.front + 10 - ST.back;
    return M.pre(W, h, (x) => {
      const R = M.rng(71);
      x.beginPath(); x.moveTo(0, 7); for (let xx = 0; xx <= W + 40; xx += 36) x.lineTo(xx, 5 + R() * 7); x.lineTo(W, h); x.lineTo(0, h); x.closePath();
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a9aaa8'); g.addColorStop(0.25, '#d3cfc4'); g.addColorStop(1, '#ece4d2');
      x.fillStyle = g; x.fill();
      x.save(); x.clip();
      for (let i = 0; i < 70; i++) { const px = R() * W, py = 12 + R() * (h - 20), rw = 40 + R() * 130; x.beginPath(); x.ellipse(px, py, rw, 4 + R() * 7, 0, 0, TAU); x.fillStyle = `rgba(${R() < 0.5 ? '80,90,115' : '255,255,250'},${0.05 + R() * 0.08})`; x.fill(); }
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.6; x.fillStyle = M.tex.paperPat; x.fillRect(0, 0, W, h);
      x.restore();
      for (const sy of [ST.slotB - ST.back, ST.slotF - ST.back]) { x.fillStyle = 'rgba(18,14,12,0.85)'; x.fillRect(0, sy - 2.5, W, 5); x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(0, sy + 2.5, W, 1.5); }
    });
  }

  // ---------------------------------------------------------------- chevaux caparaçonnés (profil, vers la gauche)
  const HOUSSE = [[-112, -238], [-96, -246], [-80, -226], [-62, -196], [-30, -184], [20, -182], [70, -186], [104, -176], [122, -150], [128, -110], [126, -60], [128, -22, 1], [100, -15], [72, -24], [44, -15], [16, -24], [-12, -15], [-40, -24], [-68, -15], [-96, -24], [-120, -21, 1], [-122, -70], [-127, -130], [-129, -180], [-126, -220]];
  const HEM = [[128, -22], [100, -15], [72, -24], [44, -15], [16, -24], [-12, -15], [-40, -24], [-68, -15], [-96, -24], [-120, -21]];
  function makeHorseBody() {
    const cv = flatCv(300, 290, 12, (x) => {
      M.piece(HOUSSE, '#5b2d6b', () => {
        // plis de la housse
        for (const px of [-90, -50, -10, 30, 70, 105]) M.strokePts([[px, -180], [px - 4, -110], [px + 2, -30]], 'rgba(25,8,30,0.45)', 2.2);
        for (const px of [-86, -46, -6, 34, 74]) M.strokePts([[px + 4, -176], [px + 1, -110], [px + 6, -34]], 'rgba(170,120,190,0.18)', 1.6);
        // galon d'or le long de l'ourlet, semis de points dorés, médaillon (couronne abstraite)
        M.strokePts(HEM.map(([a, b]) => [a, b - 12]), '#b08d45', 4.5);
        M.strokePts(HEM.map(([a, b]) => [a, b - 12]), 'rgba(255,235,170,0.4)', 1.2);
        for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) { const px = -100 + i * 34 + (j % 2) * 17, py = -165 + j * 34; if (Math.hypot(px - 20, py + 105) > 40) M.dot(px, py, 2.4, 'rgba(214,180,106,0.8)'); }
        const x2 = M.ctx();
        x2.beginPath(); x2.arc(20, -105, 30, 0, TAU); x2.strokeStyle = '#b08d45'; x2.lineWidth = 6; x2.stroke();
        x2.beginPath(); x2.arc(20, -105, 30, 0, TAU); x2.strokeStyle = 'rgba(255,235,170,0.45)'; x2.lineWidth = 1.5; x2.stroke();
        for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; x2.save(); x2.translate(20 + Math.cos(a) * 30, -105 + Math.sin(a) * 30); x2.rotate(a + 0.6); x2.beginPath(); x2.ellipse(0, 0, 3, 7, 0, 0, TAU); x2.fillStyle = '#c9a556'; x2.fill(); x2.restore(); }
        M.hatch([[40, -200], [140, -200], [140, 0], [40, 0]], 0.8, 4.2, 0.32);
        M.hatch([[-130, -60], [140, -60], [140, 0], [-130, 0]], -0.5, 5, 0.18);
        M.shade(0, -240, 0, 0, 0.35, [-140, -260, 140, 10]);
      }, { seed: 501 });
      // frange dorée sous l'ourlet
      x.lineWidth = 2; x.lineCap = 'round';
      for (let i = 0; i < HEM.length - 1; i++) {
        const [a0, b0] = HEM[i], [a1, b1] = HEM[i + 1];
        for (let u = 0; u < 1; u += 0.14) { const px = lerp(a0, a1, u), py = lerp(b0, b1, u); x.strokeStyle = (i + u * 7 | 0) % 2 ? '#c9a556' : '#8d6a2c'; x.beginPath(); x.moveTo(px, py + 1); x.lineTo(px - 1, py + 11); x.stroke(); }
      }
    });
    return M.withShadow(cv, 8);
  }
  const HEAD = [[14, -6], [4, -26], [-14, -30], [-34, -22], [-58, 0], [-80, 26], [-94, 46], [-94, 58, 1], [-74, 64], [-56, 54], [-34, 40], [-12, 28], [8, 14]];
  function makeHorseHead() {
    const cv = M.cutFlat(240, 200, 130, 110, (x) => {
      // panache blanc
      for (let k = 0; k < 5; k++) {
        const a = Math.PI / 2 - 0.42 + k * 0.21;
        x.save(); x.translate(-2, -30); x.rotate(a);
        M.piece([[0, -6], [-26, -12], [-58, -9], [-74, 0, 1], [-58, 9], [-26, 12], [0, 6]], k % 2 ? '#ebe2cd' : '#f6f0e2', () => { M.strokePts([[-4, 0], [-66, 0]], 'rgba(120,110,95,0.5)', 1); M.hatch(null, 0.5, 3.4, 0.18, 1, '20,16,24', [-80, 0, 0, 14]); }, { seed: 520 + k });
        x.restore();
      }
      M.piece([[-6, -26], [-3, -48], [6, -28]], '#2a2628', null, { seed: 530 });
      M.piece(HEAD, '#2f2a2d', () => {
        M.hatch([[-20, -40], [20, -40], [20, 30], [-20, 30]], 0.7, 3.6, 0.35, 1.05, '200,190,190');
        M.strokePts([[-70, 34], [-62, 42]], 'rgba(200,190,180,0.5)', 1.4); // naseau
        M.strokePts([[-84, 50], [-72, 52]], 'rgba(160,150,150,0.4)', 1.2);
        // bride dorée : frontal, montant, muserolle
        M.strokePts([[-2, -20], [-26, -16], [-44, -8]], '#b08d45', 3);
        M.strokePts([[-12, -18], [-30, 4], [-60, 36]], '#b08d45', 2.6);
        M.strokePts([[-62, 26], [-72, 48], [-80, 62]], '#b08d45', 2.6);
        M.dot(-30, 4, 3.4, '#d9bd72');
        // œillère (plaque sombre cerclée d'or)
        M.fillPts([[-46, -12], [-24, -16], [-20, 4], [-42, 8]], '#151316');
        M.strokePts([[-46, -12], [-24, -16], [-20, 4], [-42, 8], [-46, -12]], '#b08d45', 2.2);
      }, { seed: 531 });
      // capuchon de la housse qui couvre l'encolure
      M.piece([[22, -10], [10, -26], [0, -20], [-6, 4], [-2, 26], [12, 40], [26, 30]], '#5b2d6b', () => { M.strokePts([[0, -18], [-4, 6], [2, 26]], '#b08d45', 3); M.hatch(null, 0.8, 4, 0.3, 1, '20,16,24', [-10, -30, 30, 40]); }, { seed: 532 });
    });
    cv.padB = 90;
    return M.withShadow(cv, 6);
  }
  function makeHoof() { return flatCv(40, 40, 8, () => M.piece([[-10, 0, 1], [11, 0, 1], [9, -24], [-8, -24]], '#1d1b1f', () => M.hatch(null, 0.8, 3, 0.3, 1, '200,190,180', [-12, -26, 12, 2]), { seed: 540 })); }

  // ---------------------------------------------------------------- char funèbre doré
  const DRAPE = [[-150, -200], [-140, -228], [-100, -238], [0, -242], [100, -238], [140, -228], [152, -200], [158, -150], [161, -118], [140, -108], [110, -117], [80, -108], [50, -117], [20, -108], [-10, -117], [-40, -108], [-70, -117], [-100, -108], [-130, -117], [-161, -112], [-158, -150]];
  const DHEM = DRAPE.slice(8, 20);
  function makeHearse() {
    const cv = flatCv(420, 300, 10, (x) => {
      // traverse sous caisse
      M.piece([[-150, -104, 1], [150, -104, 1], [150, -84, 1], [-150, -84, 1]], '#53351f', () => M.hatch(null, 0.2, 3.5, 0.3), { seed: 601 });
      // plateau doré
      M.piece([[-174, -152, 1], [174, -152, 1], [182, -140], [176, -98, 1], [-176, -98, 1], [-182, -140]], '#b08d45', () => {
        const x2 = M.ctx(); x2.fillStyle = goldV(x2, -152, -98); x2.fillRect(-190, -156, 380, 62);
        for (const px of [-120, 0, 120]) { x2.fillStyle = 'rgba(70,45,10,0.35)'; x2.fillRect(px - 44, -138, 88, 28); x2.strokeStyle = 'rgba(255,235,170,0.55)'; x2.lineWidth = 1.5; x2.strokeRect(px - 44, -138, 88, 28); }
        for (const px of [-120, 0, 120]) { x2.beginPath(); x2.ellipse(px, -124, 12, 8, 0, 0, TAU); x2.fillStyle = 'rgba(240,215,147,0.8)'; x2.fill(); x2.strokeStyle = 'rgba(70,45,10,0.6)'; x2.lineWidth = 1; x2.stroke(); }
        M.hatch([[60, -160], [190, -160], [190, -90], [60, -90]], 0.8, 4, 0.2);
      }, { seed: 602 });
      // le cercueil entièrement couvert du drap violet frangé d'or
      M.piece(DRAPE, '#5b2d6b', () => {
        const x2 = M.ctx();
        const hl = x2.createLinearGradient(0, -244, 0, -200); hl.addColorStop(0, 'rgba(160,110,180,0.45)'); hl.addColorStop(1, 'rgba(160,110,180,0)');
        x2.fillStyle = hl; x2.fillRect(-170, -250, 340, 50);
        M.strokePts([[-148, -204], [-100, -214], [0, -217], [100, -214], [150, -204]], 'rgba(30,10,35,0.5)', 2);
        for (const px of [-150, 150]) M.strokePts([[px * 0.98, -204], [px * 1.02, -160], [px * 1.04, -120]], 'rgba(25,8,30,0.5)', 2.4);
        for (const px of [-110, -55, 0, 55, 110]) M.strokePts([[px, -210], [px + 3, -160], [px - 2, -118]], 'rgba(25,8,30,0.35)', 1.8);
        M.strokePts(DHEM.map(([a, b]) => [a, b - 12]), '#b08d45', 5);
        M.strokePts(DHEM.map(([a, b]) => [a, b - 12]), 'rgba(255,235,170,0.4)', 1.2);
        M.strokePts([[-150, -206], [-100, -216], [0, -219], [100, -216], [150, -206]], '#b08d45', 3);
        for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) { const px = -128 + i * 32 + j * 16, py = -186 + j * 30; M.dot(px, py, 2.6, 'rgba(214,180,106,0.85)'); }
        M.hatch([[60, -250], [170, -250], [170, -100], [60, -100]], 0.8, 4.2, 0.3);
        M.shade(0, -240, 0, -105, 0.3, [-170, -250, 170, -100]);
      }, { seed: 603 });
      x.lineWidth = 2.2; x.lineCap = 'round';
      for (let i = 0; i < DHEM.length - 1; i++) {
        const [a0, b0] = DHEM[i], [a1, b1] = DHEM[i + 1];
        for (let u = 0; u < 1; u += 0.13) { const px = lerp(a0, a1, u), py = lerp(b0, b1, u); x.strokeStyle = (i + u * 8 | 0) % 2 ? '#c9a556' : '#8d6a2c'; x.beginPath(); x.moveTo(px, py + 1); x.lineTo(px - 1, py + 12); x.stroke(); }
      }
      // pommeaux dorés aux angles du plateau
      for (const px of [-168, 168]) {
        x.save(); x.translate(px, -150);
        M.piece([[-9, 0, 1], [9, 0, 1], [11, -12], [6, -22], [11, -32], [0, -46], [-11, -32], [-6, -22], [-11, -12]], '#b08d45', () => { const x2 = M.ctx(); x2.fillStyle = goldV(x2, -46, 0); x2.fillRect(-14, -50, 28, 52); }, { seed: 610 + px });
        x.restore();
      }
    });
    return M.withShadow(cv, 8);
  }
  function makeWheel(r = 50) {
    const cv = M.cutFlat(2 * r + 24, 2 * r + 24, r + 12, r + 12, (x) => {
      const ring = [], inner = [];
      for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; ring.push([Math.cos(a) * r, Math.sin(a) * r]); }
      M.piece(ring, '#b08d45', () => {
        const x2 = M.ctx();
        const gr = x2.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); gr.addColorStop(0, '#f0d793'); gr.addColorStop(0.6, '#b08d45'); gr.addColorStop(1, '#5f4519'); x2.fillStyle = gr; x2.fillRect(-r, -r, 2 * r, 2 * r);
        // ajours entre les rayons
        x2.beginPath(); x2.arc(0, 0, r - 9, 0, TAU); x2.fillStyle = 'rgba(40,28,14,0.85)'; x2.fill();
        for (let k = 0; k < 12; k++) { x2.save(); x2.rotate(k / 12 * TAU); x2.fillStyle = goldV(x2, -4, 4); x2.fillRect(0, -3.2, r - 8, 6.4); x2.strokeStyle = 'rgba(40,25,5,0.6)'; x2.lineWidth = 1; x2.strokeRect(0, -3.2, r - 8, 6.4); x2.restore(); }
        x2.beginPath(); x2.arc(0, 0, r - 9, 0, TAU); x2.strokeStyle = 'rgba(255,235,170,0.5)'; x2.lineWidth = 1.5; x2.stroke();
        x2.beginPath(); x2.arc(0, 0, 13, 0, TAU); x2.fillStyle = goldV(x2, -13, 13); x2.fill(); x2.strokeStyle = 'rgba(40,25,5,0.7)'; x2.lineWidth = 1.5; x2.stroke();
        x2.beginPath(); x2.arc(0, 0, 5, 0, TAU); x2.fillStyle = '#5f4519'; x2.fill();
      }, { seed: 620 });
    });
    cv.padB = r + 12;
    return M.withShadow(cv, 5);
  }

  // ---------------------------------------------------------------- neige de papier qui tombe des cintres
  const FLK = [];
  {
    const R = M.rng(88);
    for (let i = 0; i < 230; i++) {
      const t0 = -6 + 10 * Math.pow(R(), 1.25), v = 235 + R() * 80, ly = ST.back + 6 + Math.pow(R(), 1.6) * 210;
      const tl = t0 + (ly - 130) / v;
      if (tl > E.snowEnd || tl < 0.05) continue;
      FLK.push({ t0, v, ly, tl, x: 70 + R() * 940, r: 4.5 + R() * 4 + (ly - ST.back) * 0.012, ph: R() * TAU, sw: 14 + R() * 22, f: 0.8 + R() * 0.9 });
    }
  }
  function flakeX(p, u) { return p.x + Math.sin(u * p.f * 2 + p.ph) * p.sw; }
  function flakes(t, front) {
    const x = ctx();
    for (const p of FLK) {
      if ((p.ly > FEET + 4) !== front) continue;
      const u = t - p.t0; if (u < 0) continue;
      if (t >= p.tl) {
        const fx = flakeX(p, p.tl - p.t0);
        x.beginPath(); x.ellipse(fx + 1, p.ly + 1.5, p.r, p.r * 0.38, 0, 0, TAU); x.fillStyle = 'rgba(40,40,55,0.25)'; x.fill();
        x.beginPath(); x.ellipse(fx, p.ly, p.r, p.r * 0.38, 0, 0, TAU); x.fillStyle = '#f3efe6'; x.fill();
        continue;
      }
      const y = 130 + u * p.v, fx = flakeX(p, u), fl = Math.cos(u * 6 * p.f + p.ph);
      x.save(); x.translate(fx, y); x.scale(Math.max(0.25, Math.abs(fl)), 1);
      x.beginPath(); x.arc(1.2, 1.6, p.r, 0, TAU); x.fillStyle = 'rgba(30,30,45,0.28)'; x.fill();
      x.beginPath(); x.arc(0, 0, p.r, 0, TAU); x.fillStyle = fl > 0 ? '#f6f2ea' : '#d6d6d8'; x.fill();
      x.restore();
    }
  }

  // ---------------------------------------------------------------- la foule de 1840 (fente arrière)
  const CROWD = [
    ['garde', 112, 1, 0.0, 'hat'], ['bourgeois', 182, 1, 0.7, 'hat'], ['dame', 250, 1, 1.4, 'bow'], ['grenadier', 318, 1, 2.1, null],
    ['grenadier', 702, -1, 0.4, null], ['dame', 768, -1, 1.1, 'bow'], ['bourgeois', 834, -1, 1.8, 'hat'], ['garde', 900, -1, 2.5, 'hat'],
  ];
  const hatDefs = {};
  function hatDef(kind) {
    if (!hatDefs[kind]) hatDefs[kind] = { hipY: 0, parts: { hat: Object.assign({}, C[kind].parts.hat, { parent: null, at: [0, 0] }) }, order: ['hat'] };
    return hatDefs[kind];
  }
  function clipAbove(y, fn) { const x = ctx(); x.save(); x.beginPath(); x.rect(0, 0, W, y); x.clip(); fn(); x.restore(); }
  function crowd(t) {
    for (const [kind, cx, d, ph, prop] of CROWD) {
      const def = C[kind], sc = kind === 'grenadier' ? 0.66 : 0.72;
      const still = 1 - smooth(8.6, 9.0, t);
      const pose = { dy: (Math.sin(t * 1.6 + ph) * 1.2 * still) / sc, ang: { head: 0.03 * Math.sin(t * 1.1 + ph) * still }, face: {} };
      if (kind === 'grenadier') pose.ang.musket = 0.2;
      let hatHand = null;
      if (prop === 'bow') { const k = smooth(E.salute0 + ph * 0.05, E.salute2 + ph * 0.05, t); pose.ang.head += 0.22 * k; pose.face.eyes = k > 0.5 ? 'half' : 'open'; }
      if (prop === 'hat') {
        const s0 = E.salute0 + (ph % 1) * 0.12, s1 = E.salute1 + (ph % 1) * 0.12, s2 = E.salute2 + (ph % 1) * 0.12;
        const kReach = smooth(s0, s1, t), kLift = smooth(s1, s2, t);
        if (kReach > 0) {
          const m = M.partMatrices(def, pose, cx, FEETB, sc, d).mats;
          const top = M.wpt(m.head, 4, -92);
          const sol = M.ik(def, pose, cx, FEETB, sc, d, 'armF', top, 1);
          const upA = -2.35 + 0.04 * Math.sin(t * 2 + ph) * still, loA = -0.25;
          pose.ang.armF_up = lerp(lerp(0, sol.up, kReach), upA, kLift);
          pose.ang.armF_lo = lerp(lerp(0, sol.lo, kReach), loA, kLift);
          if (t > s1) { pose.hide = { hat: 1 }; hatHand = lerp(0, 1, kLift); }
        }
      }
      clipAbove(ST.slotB, () => {
        const r = M.puppet(def, pose, cx, FEETB, sc, { dir: d, slot: ST.slotB, cast: { dx: 16, dy: 8, a: 0.22 } });
        if (hatHand != null) {
          const hp = r.w('armF_lo', 2, 104);
          M.puppet(hatDef(kind), { tilt: -0.25 * hatHand }, hp[0], hp[1] + 6 * sc, sc, { dir: d, rod: false, floorShadow: false });
        }
      });
    }
  }

  // ---------------------------------------------------------------- le cortège
  const D = 940, CX = 440, HS = 0.8, HX = -160, HRX = 135; // HX : cheval de tête ; HRX : centre du char
  function travel(t) { const u = clamp((t - E.enter0) / (E.stop - E.enter0)); return D * (1 - Math.pow(1 - u, 1.7)); }
  function moving(t) { return smooth(E.enter0, E.enter0 + 0.1, t) * (1 - smooth(E.stop - 0.35, E.stop, t)); }
  function rod(x, x0, y0, x1, y1, w) {
    const g2 = x.createLinearGradient(x0 - w, 0, x0 + w, 0); g2.addColorStop(0, '#5b3d22'); g2.addColorStop(0.45, '#c8a06a'); g2.addColorStop(1, '#6e4a2a');
    x.strokeStyle = g2; x.lineWidth = w; x.lineCap = 'butt'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    x.beginPath(); x.ellipse(x1, y1, w * 1.6, 2.6, 0, 0, TAU); x.fillStyle = 'rgba(8,4,2,0.6)'; x.fill();
  }
  function hatState(t) {
    let dy = 0, dx = 0, rot = 0, sx = 1, sy = 1;
    if (t > E.hop0 && t < E.hopUp) { const q = Math.sin(0.5 * Math.PI * (t - E.hop0) / (E.hopUp - E.hop0)); sy = 1 - 0.12 * q; sx = 1 + 0.07 * q; }
    else if (t >= E.hopUp && t < E.hopLand) {
      const u = (t - E.hopUp) / (E.hopLand - E.hopUp);
      dy = -4 * 46 * u * (1 - u); dx = 9 * u; rot = 0.15 * u + 0.12 * Math.sin(Math.PI * u);
      sy = 1 + 0.07 * Math.sin(Math.PI * u); sx = 1 - 0.04 * Math.sin(Math.PI * u);
    } else if (t >= E.hopLand) {
      const v = t - E.hopLand;
      dx = 9; rot = 0.15 + wob(t, E.hopLand, 0.035, 3, 16);
      sy = 1 - 0.1 * Math.exp(-22 * v); sx = 1 + 0.06 * Math.exp(-22 * v);
    }
    // petit tressautement pendant le trajet (le drap bouge)
    const mv = moving(t);
    dy += -Math.abs(Math.sin(travel(t) / 55 * Math.PI)) * 1.5 * mv;
    return { dx, dy, rot, sx, sy };
  }
  function cortege(t) {
    const x = ctx();
    const dist = travel(t), mv = moving(t), cx = CX + D - dist;
    if (cx - 340 > ST.R + 40) return;
    const step = dist / 55;
    x.save(); x.translate(cx, FEET);
    const rockH = wob(t, E.stop, 0.016, 1.3, 3.2);
    const hb = [HRX, 0];
    // --- tiges (derrière) : chevaux, char, fil du bicorne
    const slotL = ST.slotF - FEET;
    rod(x, HX + 6, -70 * HS, HX + 12, slotL, 7.5);
    rod(x, HX + 30, -80 * HS, HX + 36, slotL - 2, 6);
    rod(x, HRX - 60, -100, HRX - 54, slotL, 8);
    rod(x, HRX + 60, -100, HRX + 66, slotL, 8);
    const hs = hatState(t), BX = HRX + 18 + hs.dx, BY = -241 + hs.dy;
    x.strokeStyle = '#77736b'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(BX - 4, BY); x.lineTo(BX - 2, slotL); x.stroke();
    // --- chevaux : celui du fond (plus sombre), puis celui de devant
    for (const [ox, oy, back] of [[26, -9, true], [0, 0, false]]) {
      x.save(); x.translate(HX + ox, oy); x.scale(HS, HS);
      const pp = step * Math.PI + (back ? 0.9 : 0);
      const bob = -Math.abs(Math.sin(pp)) * 3 * mv;
      [-92, -64, 72, 100].forEach((hx, i) => {
        const lift = mv * Math.max(0, Math.sin(pp + [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5][i])) * 10;
        M.flat(back ? K.hoofD : K.hoof, hx, -lift);
      });
      M.flat(back ? K.bodyD : K.body, 0, bob, back ? {} : { cast });
      const nod = mv * 0.05 * Math.sin(pp) + wob(t, E.stop - 0.05, 0.07, 1.1, 3) + 0.012 * Math.sin(t * 1.3 + ox) * (1 - smooth(8.6, 9.0, t));
      M.flat(back ? K.headD : K.head, -118, -232 + bob, { scale: 1.25, rot: nod, cast: back ? null : cast });
      x.restore();
    }
    // traits (sangles) du char aux chevaux
    for (const [ox, oy, a] of [[26, -9, 0.75], [0, 0, 1]]) {
      x.strokeStyle = `rgba(35,22,14,${a})`; x.lineWidth = 7; x.lineCap = 'round';
      x.beginPath(); x.moveTo(HX + ox - 85 * HS, oy - 128 * HS); x.quadraticCurveTo(HX + ox + 40, oy - 95, HRX - 168, -118); x.stroke();
      x.strokeStyle = `rgba(214,180,106,${0.8 * a})`; x.lineWidth = 2; x.stroke();
    }
    // --- le char (roues du fond, caisse, roues de devant)
    x.save(); x.translate(hb[0], hb[1]); x.rotate(rockH);
    const wa = -dist / 50;
    for (const wx of [-110, 110]) M.flat(K.wheelD, wx + 14, -50 - 6, { rot: wa });
    M.flat(K.hearse, 0, 0, { cast });
    for (const wx of [-110, 110]) M.flat(K.wheel, wx, -50, { rot: wa, cast: { dx: 10, dy: 6, a: 0.3 } });
    // couronne de laurier debout sur le cercueil
    M.flat(K.wreath, -92, -224, { scale: 0.44, rot: -0.06, cast: { dx: 8, dy: 4, a: 0.25 } });
    // LE bicorne, sur sa tige
    x.save(); x.translate(BX - HRX, BY); x.scale(hs.sx, hs.sy); x.translate(-(BX - HRX), -BY);
    x.save(); x.globalAlpha = 0.3 * (1 - clamp(-hs.dy / 50)); x.beginPath(); x.ellipse(BX - HRX + 4, -238, 64, 5, 0, 0, TAU); x.fillStyle = '#140818'; x.fill(); x.restore();
    M.bicorne(BX - HRX, BY, 0.95, hs.rot, 1);
    x.restore();
    x.restore();
    x.restore();
  }

  S.init = () => {
    K = {
      sky: snowSky(), floorSnow: snowFloor(),
      vrai: snowCap(M.makeArc(false), 9), row: snowCap(M.makeParisRow(), 6),
      wingL: snowCap(M.makeTreeWing(5, false), 8), wingR: snowCap(M.makeTreeWing(9, true), 8),
      body: makeHorseBody(), head: makeHorseHead(), hoof: makeHoof(),
      hearse: makeHearse(), wheel: makeWheel(), wreath: M.makeWreath(),
    };
    K.bodyD = darken(K.body, 0.62); K.headD = darken(K.head, 0.62); K.hoofD = darken(K.hoof, 0.7); K.wheelD = darken(K.wheel, 0.55);
    S.buf = M.mkCanvas(W, H);
  };

  // temps « gelé » en douceur après 8,6 s (poussière, drapeaux) : dernière seconde immobile
  function tf(t) { const s = t - 8.6; if (s <= 0) return t; return 8.6 + (s < 0.8 ? s - s * s / 1.6 : 0.4); }
  S.draw = (t) => {
    const x = ctx();
    const still = 1 - smooth(8.6, 9.0, t);
    // ---- toile d'hiver, coulisses, ferme de Paris enneigées
    x.drawImage(K.sky, 0, 0);
    M.flat(K.wingL, 120, ST.back, { rot: 0.004 * Math.sin(t * 0.9) * still, cast });
    M.flat(K.wingR, 960, ST.back, { rot: 0.004 * Math.sin(t * 0.8 + 1) * still, cast });
    M.flat(K.row, 540, ST.back);
    // ---- le vrai arc (le même qu'au plan 5), suspendu à ses câbles, drapeaux sur l'attique
    const ay = ST.back;
    x.strokeStyle = 'rgba(60,50,40,0.85)'; x.lineWidth = 2.2;
    for (const dd of [-1, 1]) { const cx = ARCX + dd * 360; x.beginPath(); x.moveTo(cx, ay - M.ARC.h * AS + 6); x.lineTo(cx + dd * 4, 0); x.stroke(); }
    M.flat(K.vrai, ARCX, ay, { scale: AS, clipY: ST.back + 1, cast: { dx: 18, dy: 8, a: 0.4 } });
    for (const [fx, ph] of [[ARCX - 300, 0], [ARCX - 40, 1.3], [ARCX + 220, 2.4]]) M.drapeau(fx, ay - M.ARC.h * AS + 2, 0.9, tf(t), ph, 170);
    // ---- plancher couvert de neige de papier
    M.drawFloor();
    x.save(); x.globalAlpha = 0.94; x.drawImage(K.floorSnow, 0, ST.back); x.restore();
    flakes(t, false);
    // ---- foule, cortège
    crowd(t);
    clipAbove(ST.slotF, () => cortege(t));
    flakes(t, true);
    // ---- lumière : poursuite sur le char, puis elle s'ouvre sur l'arc entier
    const z = ease((t - E.zoom0) / (E.zoom1 - E.zoom0));
    const follow = smooth(1.6, 3.9, t);
    const carX = CX + D - travel(t);
    const sx = lerp(lerp(ARCX, Math.min(carX, 900), follow), ARCX, z);
    // voile froid d'hiver sur la scène
    x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(214,222,238,1)'; x.globalAlpha = lerp(0.55, 0.3, z); x.fillRect(ST.L, ST.top, ST.R - ST.L, ST.front - ST.top); x.restore();
    M.stageLight(tf(t), { spot: { x: sx, y: lerp(lerp(1000, 1230, follow), 980, z), r: lerp(lerp(470, 430, follow), 980, z), a: lerp(0.46, 0.2, z) }, beamA: lerp(0.75, 1, z) });
    M.curtain(t, 1, { swing: 0 });
    M.drawFrame(t);
    // ---- caméra : un seul mouvement, recul lent (5,8 → 9,0 s)
    const zz = lerp(1.1, 1.0, z);
    if (zz > 1.0002) {
      const b = S.buf.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); b.drawImage(x.canvas, 0, 0);
      const AX = 490, AY = 1330;
      x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(S.buf, AX - AX * zz, AY - AY * zz, W * zz, H * zz); x.restore();
    }
  };
  return S;
})();
