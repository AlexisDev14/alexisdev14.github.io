// persos.js — « Ronald McDonald, le clown jugé trop gros » (Washington, années 60) : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.ron (alias RON). Appeler RON.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, jamais Math.random) : fonction pure de t.
// INDEX : 1) géométrie  2) objets (hamburger, sac, frites, gobelet, pièces, mètre, plateau, panneau, carte)  3) objets tenus, IK, enveloppes
//         4) Scott  5) restaurateur, dirigeant, clown  6) enfants, parents, caméraman  7) accessoires seuls, caméra TV, comptoir  8) studio WRC (RON.init)
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const RON = (M.ron = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = M.ST.back;

  // =====================================================================
  // 1) GÉOMÉTRIE
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function ribbon(line, w0, w1) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1, i / (line.length - 1)) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  const bar = (a, b, w) => ribbon([a, b], w, w);
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function mixA(a, b, k, al) { const A = hx(a), B = hx(b); k = clamp(k); const v = A.map((x, i) => Math.round(lerp(x, B[i], k))); return al == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${al})`; }
  const flipped = () => { const m = cx_().getTransform(); return m.a * m.d - m.b * m.c < 0; };
  const fr = (x) => x - Math.floor(x);
  const C = {                                   // palette de la vidéo (sourde)
    rouge: '#9b2d2a', rougeD: '#7a2220', ivoire: '#efe6d2', ivoireD: '#d6cbb2', or: '#b8913a', orD: '#8e6c26', orL: '#d8b866',
    pain: '#cf9448', painL: '#e2b26a', painD: '#a8702e', steak: '#5a3420', salade: '#6f8a3a', carton: '#b89a6a', cartonD: '#977a4e',
    kraft: '#b48a58', kraftD: '#94703f', frite: '#e2c060', ardoise: '#4f6a8a', ardoiseD: '#3d5572', moutarde: '#d1a63a', moutardeD: '#a9832a',
    nuit: '#24304a', nuitD: '#1a2336', bordeaux: '#6e1e28', mur: '#5d6b5f', murD: '#4a564c', murL: '#6f7d70', metal: '#3a3c40', metalL: '#6a6e74',
  };

  // =====================================================================
  // 2) OBJETS (dessinés à l'échelle 1 ; repère propre à chaque objet)
  // =====================================================================
  // ---- hamburger 1960 (72 × 50), repère = centre ; o.croque 0..1 : morsure côté −x (côté de la bouche quand il est tenu devant soi)
  function biteClip(k, cx, cy) {                     // découpe une morsure dentelée (un seul polygone, evenodd)
    const c = cx_(), R = 17 * k, pts = [];
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, r = R * (1 + 0.13 * Math.cos(a * 5)); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.15]); }
    c.beginPath(); c.rect(-200, -200, 400, 400); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip('evenodd');
  }
  function drawHamburger(o) {
    const k = clamp(o.croque || 0), c = cx_();
    c.save(); if (k > 0.02) biteClip(k, -36, -4 + 0 * k);
    pc([[-31, 8], [31, 8], [33, 13], [28, 20, 1], [-28, 20, 1], [-33, 13]], C.painD, () => { strokePts([[-26, 12], [26, 12]], 'rgba(255,230,180,0.3)', 1.2); hatch(null, 0.8, 3.2, 0.25, 1, undefined, [-36, 6, 36, 22]); }, 9101);
    pc([[-35, -1], [35, -1], [37, 4], [34, 10], [-34, 10], [-37, 4]], C.steak, () => { for (let x = -30; x < 34; x += 7) strokePts([[x, 1], [x + 3, 8]], 'rgba(20,10,4,0.5)', 1); }, 9102);
    const sal = []; for (let i = 0; i <= 16; i++) { const x = -39 + i * 78 / 16; sal.push([x, -5 + (i % 2 ? 4 : 0)]); } sal.push([37, 1], [-37, 1]);
    fillPts(sal, C.salade, 0, 0.3); strokePts(sal.slice(0, 17), 'rgba(200,230,140,0.45)', 1);
    fillPts([[-34, -3], [30, -3], [28, 0], [-32, 0]], '#a8402e', 0, 0);
    pc(ep(0, -2, 34, 28, 18, PI, TAU).concat([[34, -2, 1], [-34, -2, 1]]), C.pain, () => {
      strokePts(ep(-4, -6, 24, 18, 10, PI * 1.15, PI * 1.55), 'rgba(255,240,200,0.55)', 2);
      for (const [x, y, a] of [[-18, -18, 0.4], [-6, -24, -0.2], [8, -22, 0.6], [20, -14, -0.4], [-24, -8, 0.1], [2, -12, 0.3], [14, -6, -0.6]]) {
        const s = [[x - 3 * Math.cos(a), y - 3 * Math.sin(a)], [x, y - 1.6], [x + 3 * Math.cos(a), y + 3 * Math.sin(a)], [x, y + 1.6]];
        fillPts(s, '#f3ead0', 0, 0);
      }
      shade(20, -20, -20, 0, 0.25, [-36, -32, 36, 0]);
    }, 9103);
    c.restore();
  }
  // ---- sac de papier kraft (66 × 96), repère = centre ; prise = haut roulé
  function drawSac() {
    pc([[-33, -28], [33, -28], [35, 50, 1], [-35, 50, 1]], C.kraft, () => {
      strokePts([[-12, -26], [-14, 48]], 'rgba(90,60,30,0.35)', 1.2); strokePts([[20, -26], [22, 48]], 'rgba(90,60,30,0.3)', 1.2);
      strokePts([[-35, 38], [35, 38]], 'rgba(90,60,30,0.35)', 1.1);
      fillPts(ell(4, 12, 15, 11, 12), 'rgba(140,90,40,0.25)', 0, 0);                         // tache de gras
      hatch(null, 0.8, 4, 0.2, 1, undefined, [-40, -30, 40, 52]); shade(30, 0, -30, 0, 0.25, [-40, -30, 40, 52]);
    }, 9201);
    pc([[-34, -27], [34, -27], [31, -40], [26, -46], [-26, -46], [-31, -40]], C.kraftD, () => { strokePts([[-30, -36], [30, -36]], 'rgba(255,230,190,0.35)', 1.3); }, 9202);
  }
  // ---- cornet de frites (44 × 74), repère = centre de la boîte ; boîte rouge sang à bande ivoire (sans inscription)
  function drawFrites() {
    for (let i = 0; i < 9; i++) { const x = -16 + i * 4, h = 26 + 10 * fr(Math.sin(i * 12.9898) * 43758.5); pc(rect(x - 2.5, -10 - h, x + 2.5, 0), i % 2 ? C.frite : '#d4ae4e', () => strokePts([[x - 1, -8 - h], [x - 1, -2]], 'rgba(255,250,210,0.5)', 1), 9300 + i, { drop: false }); }
    pc([[-21, -12], [21, -12], [15, 34, 1], [-15, 34, 1]], C.rouge, () => {
      fillPts([[-20, 2], [20, 2], [19, 11], [-19, 11]], C.ivoire, 0, 0);
      strokePts([[-20, -10], [0, -2], [20, -10]], 'rgba(40,10,8,0.4)', 1.2);
      shade(18, 0, -18, 0, 0.3, [-24, -14, 24, 36]);
    }, 9310);
  }
  // ---- gobelet en papier rayé (32 × 50), repère = centre ; haut ouvert en y −25 ; c'est aussi le nez de Ronald
  function drawGobelet() {
    pc([[-16, -24], [16, -24], [11, 24, 1], [-11, 24, 1]], C.ivoire, () => {
      for (const x of [-10, -2, 6, 14]) fillPts([[x - 2.5, -24], [x + 2.5, -24], [x * 0.7 + 1.8, 24], [x * 0.7 - 1.8, 24]], C.rouge, 0, 0);
      shade(14, 0, -14, 0, 0.28, [-18, -26, 18, 26]);
    }, 9401);
    pc(ell(0, -24, 17, 4, 14), C.ivoireD, () => fillPts(ell(0, -23.5, 13, 2.6, 12), '#8a7e66'), 9402, { drop: false });
  }
  // ---- pièces de monnaie (pile de 3 + une debout), repère = dessous de la pile (posée sur la paume)
  function drawPieces() {
    for (let i = 0; i < 3; i++) { pc(ell(i * 1.5 - 2, -3 - i * 4, 10, 3.4, 12), C.or, () => strokePts(ep(i * 1.5 - 2, -3 - i * 4, 7, 2, 10, PI, TAU), 'rgba(255,240,190,0.6)', 1), 9501 + i, { drop: false }); fillPts(rect(i * 1.5 - 12, -3 - i * 4, i * 1.5 + 8, -1 - i * 4), C.orD, 0, 0); }
    pc(ell(10, -16, 4, 10, 12), C.orL, () => strokePts([[10, -24], [10, -8]], 'rgba(120,90,30,0.6)', 1), 9504, { drop: false });
  }
  // ---- mètre ruban de couturier jaune (pendant, ≈ 30 × 110), repère = prise (milieu du ruban sur la main)
  function rubanLine(line, w) {
    fillPts(ribbon(line, w, w), '#d9b43a', 0, 0.2);
    for (let i = 1; i < line.length - 1; i++) { const a = line[i - 1], b = line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, n = [-dy / l, dx / l], L = i % 3 ? 0.3 : 0.5; strokePts([[line[i][0] + n[0] * w * 0.5, line[i][1] + n[1] * w * 0.5], [line[i][0] + n[0] * w * (0.5 - L), line[i][1] + n[1] * w * (0.5 - L)]], 'rgba(30,22,10,0.85)', 0.9); }
  }
  function drawMetre(o) {
    if (!o.pendant) {                                   // seul : enroulé, le bout déroulé posé à plat
      pc(ell(0, 0, 24, 24, 22), '#d9b43a', () => { for (let r = 20; r > 4; r -= 4) strokePts(ep(0, 0, r, r, 18, 0, TAU), 'rgba(90,70,20,0.55)', 1); dot(0, 0, 4, '#8a6a20'); }, 9551);
      const L = [[18, 16], [40, 22], [70, 23], [96, 22]]; rubanLine(L, 8); fillPts(rect(94, 17, 100, 27), '#9a9ea4', 0, 0); return;
    }
    const t = o.t || 0, sw = 3 * Math.sin(M.tg(t) * 2.1);
    const A = qbez([0, 0], [-10 + sw, 40], [-6 + sw * 1.6, 96], 18), B = qbez([0, 0], [12 + sw, 34], [14 + sw * 1.4, 70], 14);
    rubanLine(A, 8); rubanLine(B, 8);
    for (const L of [A, B]) { const e = L[L.length - 1]; fillPts(rect(e[0] - 4.5, e[1] - 1, e[0] + 4.5, e[1] + 4), '#9a9ea4', 0, 0); }
  }
  // ---- chapeau-plateau en carton (230 × 92 avec ses trois objets), repère = milieu du DESSOUS du plateau
  function drawPlateau(o) {
    const c = cx_();
    c.save(); c.translate(-50, -10 - 20 * 0.92); c.scale(0.92, 0.92); drawHamburger({}); c.restore();
    c.save(); c.translate(14, -10 - 34 * 0.9); c.scale(0.9, 0.9); drawFrites(); c.restore();
    c.save(); c.translate(70, -10 - 24 * 1.05); c.scale(1.05, 1.05); drawGobelet(); c.restore();
    pc([[-115, -12, 1], [-108, -12], [-104, -8], [104, -8], [108, -12], [115, -12, 1], [113, 0, 1], [-113, 0, 1]], C.carton, () => {
      strokePts([[-110, -4], [110, -4]], 'rgba(90,60,30,0.45)', 1.1);
      for (let x = -108; x < 110; x += 5) strokePts([[x, -3], [x + 2, 0]], 'rgba(90,60,30,0.3)', 0.8);
      strokePts([[-104, -8], [104, -8]], 'rgba(255,240,210,0.5)', 1.2);
    }, 9601);
    if (o.fil && !SIL()) { const cc = cx_(); cc.save(); cc.strokeStyle = 'rgba(25,20,16,0.75)'; cc.lineWidth = 1.4 * M._lw(); cc.beginPath(); cc.moveTo(-100, -12); cc.lineTo(-60, -2400); cc.moveTo(100, -12); cc.lineTo(60, -2400); cc.stroke(); cc.restore(); }
  }
  // ---- panneau de parrainage en carton : ovale doré, gros hamburger peint (260 × 180), repère = centre ; o.fils : deux fils vers les cintres
  function drawPanneau(o) {
    if (o.fils && !SIL()) { const c = cx_(); c.save(); c.strokeStyle = 'rgba(25,20,16,0.75)'; c.lineWidth = 1.4 * M._lw(); c.beginPath(); c.moveTo(-72, -78); c.lineTo(-90, -2400); c.moveTo(72, -78); c.lineTo(90, -2400); c.stroke(); c.restore(); }
    for (const x of [-72, 72]) pc(ell(x, -80, 8, 8, 10), C.orD, () => fillPts(ell(x, -80, 4, 4, 8), '#2a2018'), 9701 + x, { drop: false });
    pc(ell(0, 0, 130, 90, 40), C.or, () => {
      for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; dot(Math.cos(a) * 120, Math.sin(a) * 82, 3, i % 2 ? C.orL : C.orD); }
      strokePts(ep(0, 0, 112, 75, 40, 0, TAU), C.orD, 2.4);
    }, 9703);
    pc(ell(0, 0, 108, 72, 36), C.rouge, () => {
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; fillPts([[0, 0], [Math.cos(a - 0.12) * 120, Math.sin(a - 0.12) * 80], [Math.cos(a + 0.12) * 120, Math.sin(a + 0.12) * 80]], 'rgba(230,120,90,0.18)', 0, 0); }
      const c = cx_(); c.save(); c.translate(0, 8); c.scale(2.05, 2.05); drawHamburger({}); c.restore();
      shade(60, -50, -60, 50, 0.25, [-110, -75, 110, 75]);
    }, 9704);
  }
  // ---- carte des États-Unis vue de face (230 × 150), repère = centre ; silhouette ocre sur ivoire, points rouges, AUCUNE lettre.
  //      o.deplie 0..1 (0 = pliée en deux : moitié droite rabattue sur la gauche). Jamais en miroir (contre-retournée si dir −1).
  const US_LL = [[-124.7, 48.4], [-124.1, 46.3], [-124.5, 42.8], [-123.8, 39.8], [-122.5, 37.8], [-120.6, 34.6], [-118.4, 34], [-117.1, 32.5], [-114.7, 32.7], [-111, 31.3], [-108.2, 31.3],
    [-106.5, 31.8], [-104.5, 29.6], [-103, 29], [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-97.2, 27.8], [-95, 29.3], [-93.8, 29.7], [-91, 29.3], [-89.4, 28.9], [-89.4, 30.2],
    [-88, 30.4], [-86, 30.4], [-84.3, 30], [-83, 29], [-82.7, 27.5], [-81.8, 26.1], [-81, 25.2], [-80.4, 25.4], [-80.1, 26.8], [-80.6, 28.5], [-81.3, 30.4], [-81.1, 32], [-79.2, 33.2],
    [-77.9, 34], [-75.5, 35.2], [-76, 36.9], [-75.1, 38.4], [-74.9, 39], [-74, 40.5], [-72, 41], [-70, 41.6], [-70.6, 42.6], [-70.2, 43.7], [-69, 44.2], [-67, 44.8], [-67.8, 47.1],
    [-69.2, 47.4], [-71.5, 45], [-74.7, 45], [-76.5, 44.2], [-79.2, 43.4], [-78.9, 42.9], [-82.5, 41.7], [-83.4, 42.2], [-82.5, 43.3], [-82.4, 45.2], [-84.2, 46.5], [-86.5, 44.3],
    [-87.8, 41.8], [-87.9, 44.2], [-87, 45.8], [-88.5, 46.9], [-90.4, 46.6], [-92, 46.7], [-89.6, 48], [-95.2, 49.4], [-95.2, 49], [-123.2, 49], [-122.8, 48.4]];
  const US_VILLES = [[-122.3, 47.4], [-122.7, 45.5], [-122.1, 37.8], [-118.2, 34.1], [-112, 33.4], [-105, 39.7], [-96.8, 32.8], [-95.4, 30], [-87.8, 41.6], [-83.1, 42.1], [-93.3, 44.9],
    [-90.2, 38.6], [-84.4, 33.7], [-80.4, 26.2], [-77, 38.9], [-74.2, 40.7], [-71.3, 42.3], [-75.2, 40], [-94.6, 39.1], [-111.9, 40.8], [-90.1, 30.1], [-81.7, 41.3], [-86.2, 39.8]];
  const usP = ([lo, la]) => [(lo + 96) * 4.3 * 0.777, -(la - 37.4) * 4.3];
  const US = US_LL.map(usP), US_PTS = US_VILLES.map(usP);
  const CW = 115, CHt = 75;
  function carteFace() {
    fillPts(rect(-CW, -CHt, CW, CHt), '#ebe3cd', 0, 0.4);
    strokePts(rect(-CW + 7, -CHt + 7, CW - 7, CHt - 7), 'rgba(120,90,50,0.55)', 1.4, true);
    for (let x = -CW + 30; x < CW; x += 30) strokePts([[x, -CHt + 8], [x, CHt - 8]], 'rgba(120,140,150,0.18)', 1);
    for (let y = -CHt + 25; y < CHt; y += 25) strokePts([[-CW + 8, y], [CW - 8, y]], 'rgba(120,140,150,0.18)', 1);
    fillPts(US, '#c49a52', 5, 0.4); strokePts(US, '#7a5a2a', 1.6, true);
    hatch(US, 0.8, 4.4, 0.16, 1, undefined, [-110, -70, 110, 70]);
    for (const p of US_PTS) { dot(p[0], p[1], 3.6, C.rouge); dot(p[0] - 1, p[1] - 1, 1.2, '#e8a090'); }
    for (const [x, y] of [[-CW + 14, -CHt + 14], [CW - 14, -CHt + 14], [CW - 14, CHt - 14], [-CW + 14, CHt - 14]]) dot(x, y, 2.2, '#8a8e92');
  }
  function drawCarte(o) {
    const d = clamp(o.deplie == null ? 1 : o.deplie), c = cx_(), fl = flipped();
    const face = (seed) => pc(rect(-CW, -CHt, CW, CHt), '#ebe3cd', () => { if (fl) { c.save(); c.scale(-1, 1); carteFace(); c.restore(); } else carteFace(); }, seed);
    c.save(); c.beginPath(); c.rect(-CW - 6, -CHt - 6, CW + 6, 2 * CHt + 12); c.clip(); face(9801); c.restore();     // moitié arrière (fixe)
    const k = Math.cos(PI * (1 - d));                     // moitié avant : 1 = dépliée, −1 = rabattue sur l'arrière
    c.save(); c.scale(Math.abs(k) < 0.03 ? 0.03 : k, 1);
    if (k > 0) { c.save(); c.beginPath(); c.rect(0, -CHt - 6, CW + 6, 2 * CHt + 12); c.clip(); face(9802); c.restore(); }
    else pc(rect(0, -CHt, CW, CHt), '#d9cfb4', () => { hatch(null, 0.8, 5, 0.15, 1, undefined, [0, -80, 120, 80]); strokePts(rect(6, -CHt + 6, CW - 6, CHt - 6), 'rgba(120,90,50,0.4)', 1.2, true); }, 9803);
    c.restore();
    if (d > 0.05 && d < 0.97) strokePts([[0, -CHt], [0, CHt]], 'rgba(60,40,20,0.5)', 1.4);
  }


  // registre : grip = prise (repère de l'objet) ; p2 = seconde prise ; pts = points nommés ; base = point posé (objet seul) ; doigts 'aucun' = posé sur la paume
  const carteK = (o) => Math.cos(PI * (1 - clamp(o.deplie == null ? 1 : o.deplie)));
  const OBJ = {
    hamburger: { draw: drawHamburger, grip: [-2, 15], pts: { centre: [0, 0], haut: [0, -30], morsure: [-34, -4] }, base: [0, 20] },
    sac: { draw: drawSac, grip: [0, -38], pts: { centre: [0, 10], haut: [0, -46], bas: [0, 50] }, base: [0, 50] },
    frites: { draw: drawFrites, grip: [0, 14], pts: { haut: [0, -40], centre: [0, 10] }, base: [0, 34] },
    gobelet: { draw: drawGobelet, grip: [0, 5], pts: { haut: [0, -24], bas: [0, 24], centre: [0, 0] }, base: [0, 24] },
    pieces: { draw: drawPieces, held: { echelle: 1.5 }, grip: [0, 2], pts: { haut: [0, -14] }, base: [0, 0], doigts: 'aucun', main: 'open' },
    metre: { draw: drawMetre, held: { pendant: true }, grip: [0, 0], pts: { bout: [-6, 96] }, base: (o) => (o.pendant ? [0, 96] : [0, 24]) },
    plateau: { draw: drawPlateau, grip: [12, 4], p2: () => [-16, 4], pts: { dessus: [0, -10], centre: [0, -36], hamburger: [-50, -32], gobelet: [70, -36] }, base: [0, 0] },
    panneau: { draw: drawPanneau, grip: [60, 80], p2: () => [-34, 86], pts: { centre: [0, 0], haut: [0, -90], bas: [0, 90], anneauG: [-72, -80], anneauD: [72, -80] }, base: [0, 90] },
    carte: { devant: true, draw: drawCarte, grip: (o) => [Math.max(0, 70 * carteK(o)), -CHt + 5], p2: () => [-70, -CHt + 5], pts: { centre: [0, 0], haut: [0, -CHt], bas: [0, CHt] }, base: [0, CHt] },
  };
  RON.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);

  // =====================================================================
  // 3) OBJETS TENUS, IK, ENVELOPPES (principe heldParts de bibliotheque/teflon.js et guerremondes.js)
  //    G = géométrie du bras de la marionnette : LA (bras), PG (poing dans l'avant-bras), SHF/SHB (épaules), HEAD (cou), k (taille de la main)
  // =====================================================================
  const G_ADULTE = { LA: 96, PG: [4, 96], SHF: [-2, -146], SHB: [-10, -146], HEAD: [6, -170], k: 1 };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), e = oo.echelle || 1;
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  const fingers = (name, k) => { const ob = OBJ[name]; return !ob || ob.doigts === 'aucun' ? OFFP : scl(DOIGTS, k || 1); };
  function heldParts(G, skin, skinB, seed) {
    const P = [G.PG[0], G.PG[1]];
    return {
      objet: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !(OBJ[p.tenu] && OBJ[p.tenu].devant)) heldDraw(p.tenu, p.tenuO, p); } },
      objetDevant: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => { if (has(p.tenu) && OBJ[p.tenu] && OBJ[p.tenu].devant) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: P, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fingers(p.tenu, G.k) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: P, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: P, noRivet: true, base: skinB, seed: seed + 4, pts: (p) => (has(p.tenuB) ? fingers(p.tenuB, G.k) : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: P, noRivet: true, base: skinB, seed: seed + 5, pts: (p) => (p._deux ? scl(DOIGTS, G.k) : OFFP), paint: doigtsPaint },
    };
  }
  // point écran d'un point nommé de l'objet tenu : RON.pt(r, 'haut') ; main arrière : RON.pt(r, 'nom', true) ; 'prise' = point tenu
  RON.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1;
    const q = nom === 'prise' ? g : ob.pts[nom] ? ptOf(ob.pts[nom], oo) : null; if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  function ikT(G, S, T, bend) {       // même convention que M.ik (bend 1 = coude sous la ligne épaule–main, plié vers l'avant)
    const L1 = G.LA, L2 = Math.hypot(G.PG[0], G.PG[1]), phi = Math.atan2(-G.PG[0], G.PG[1]);
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), base = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), a2 = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    return { a: normA(base + bend * a1), b: normA(-bend * (PI - a2) - phi) };
  }
  function armTo(q, arm, T, k, bend) {
    if (!(k > 0)) return;
    const G = q._G, sol = ikT(G, arm === 'armF' ? G.SHF : G.SHB, T, bend == null ? 1 : bend), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function headPt(q, hx_, hy) { const H = q._G.HEAD; return mp(new DOMMatrix().translate(H[0], H[1]).rotate((q.ang.head || 0) * D), [hx_, hy]); }
  function marche(q, k) {                                     // pas sur place selon t : jambes en opposition, petits bras, léger rebond
    if (!(k > 0)) return;
    const t = q.t || 0, w = Math.sin(t * TAU * (q.cadence || 1.1)), A = q.ang, enf = !!q._G.enfant;
    A.legF = (A.legF || 0) - 0.34 * w * k; A.legB = (A.legB || 0) + 0.34 * w * k;
    if (enf) { A.legF_lo = (A.legF_lo || 0) + 0.3 * Math.max(0, -w) * k; A.legB_lo = (A.legB_lo || 0) + 0.3 * Math.max(0, w) * k; }
    if (!has(q.tenu) || q.tenu === 'sac') A.armF_up = (A.armF_up || 0) + 0.12 * w * k;
    if (!has(q.tenuB)) A.armB_up = (A.armB_up || 0) - 0.12 * w * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(t * TAU * (q.cadence || 1.1))) * 5 * k;
  }
  function vers(S, Cc, r) { const v = [Cc[0] - S[0], Cc[1] - S[1]], l = Math.hypot(v[0], v[1]) || 1, k = Math.min(l, r) / l; return [S[0] + v[0] * k, S[1] + v[1] * k]; }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: Object.assign({}, p.tenuO), tenuBO: Object.assign({}, p.tenuBO) }); }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0, G = q._G;
    if (has(q.tenu)) { const m = OBJ[q.tenu] && OBJ[q.tenu].main; if (m) q.handF = m; else if (!(q.handF && q.handF !== 'fist')) q.handF = 'fist'; }
    if (has(q.tenuB)) { const m = OBJ[q.tenuB] && OBJ[q.tenuB].main; if (m) q.handB = m; else if (!(q.handB && q.handB !== 'fist')) q.handB = 'fist'; }
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    A.objetDevant = A.objet || 0;
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
      const Hf = new DOMMatrix().translate(G.SHF[0], G.SHF[1]).rotate((A.armF_up || 0) * D).translate(0, G.LA).rotate((A.armF_lo || 0) * D).translate(G.PG[0], G.PG[1]).rotate((A.objet || 0) * D).scale(e, e).translate(-g[0], -g[1]);
      const T = mp(Hf, ob.p2(oo)), sol = ikT(G, G.SHB, T, 1);
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = q.handBDeux || 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // enveloppe : pose → gestes (poseFn) → marche → finish → M.puppet. fn.pose(p) = pose finale sans dessiner (pour M.ik / M.partMatrices)
  function wrap(key, poseFn, sDef) {
    const fn = (pose, x, y, s, o) => {
      s = s == null ? sDef : s; o = Object.assign({ slot: M.ST.slotF, nom: CH[key].nom }, o || {});
      const dir = o.dir || 1, q = prep(pose), def = CH[key]; q._G = def.G;
      const loc = (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; };
      poseFn(q, loc, { x, y, s, dir }); marche(q, q.marche === true ? 1 : q.marche); finish(q);
      return run(def, q, x, y, s, o);
    };
    fn.pose = (pose, x, y, s, dir) => {            // mêmes x, y, s, dir que l'appel réel si la pose a une cible écran
      x = x || 0; y = y || 0; s = s == null ? sDef : s; dir = dir || 1; const q = prep(pose), def = CH[key]; q._G = def.G;
      const loc = (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; };
      poseFn(q, loc, { x, y, s, dir }); marche(q, q.marche === true ? 1 : q.marche); return finish(q);
    };
    return fn;
  }

  // ---------------- pièces de corps communes (bras à articulations rondes, rivet au pivot)
  const R_COUDE = 11.5;
  function armR(len, wt, rc) { wt = wt || 15; rc = rc || R_COUDE; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.42], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, len * 0.42]]); }
  function foreR(kind, k) { k = k || 1; const f = X.forePts(kind); return scl(ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)), k); }
  // avant-bras : o = { base, skin, cuff (couleur du poignet), deco (motif de manche), gant, k (échelle) }
  function foreDef(parent, back, seed, o) {
    const k = o.k || 1, hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, o.LA || 96], pts: (p) => foreR(hk(p), k), base: o.base, seed, paint: (p) => {
      const c = cx_();
      if (o.deco) o.deco(back);
      c.save(); c.scale(k, k);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], o.gant || o.skin); X.handPaint(null, hk(p));
      if (o.cuff) fillPts([[-15, 62, 1], [15, 62, 1], [16, 79, 1], [-15, 79, 1]], o.cuff);
      c.restore();
      hatch([[-14 * k, -10], [-3 * k, -10], [-3 * k, 58 * k], [-14 * k, 58 * k]], 0.9, 3.8, back ? 0.3 : 0.2);
      if (back) fillPts([[-30, -20], [30, -20], [30, 140], [-30, 140]], 'rgba(20,14,10,0.12)');
    } };
  }
  const upDef = (at, base, seed, deco, wt, LA, back) => ({ parent: 'torso', at, pts: armR(LA || 96, wt || 16), base, seed, paint: () => {
    if (deco) deco(back); hatch([[-16, -20], [-3, -20], [-3, (LA || 96) + 4], [-16, (LA || 96) + 4]], 0.9, 3.8, back ? 0.32 : 0.24);
    if (back) fillPts([[-30, -30], [30, -30], [30, 140], [-30, 140]], 'rgba(20,14,10,0.12)');
  } });
  // jambe d'adulte en une pièce (X.legPts) ; shoe = couleur ; deco(back) = motif (rayures, chaussettes)
  function legDef(at, base, shoe, seed, back, th, sy, deco) {
    return { parent: 'torso', at, pts: scl(X.legPts(th || 0.95), 1, sy || 1), base, seed, noRivet: !!back, paint: () => {
      const by = 214 * (sy || 1);
      if (deco) deco(back, by);
      fillPts([[-40, by, 1], [60, by, 1], [60, 300, 1], [-40, 300, 1]], shoe);
      if (!back) { strokePts([[20, by + 10], [42, by + 15]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, by], [-26, by]], 0.8, 4, 0.22); }
      else { hatch(null, 0.8, 3.6, 0.3); fillPts([[-40, -20], [60, -20], [60, 300], [-40, 300]], 'rgba(20,14,10,0.14)'); }
    } };
  }
  // grosse chaussure de clown (pièce enfant de la jambe) ; sy = étirement de la jambe
  const SHOE_CLOWN = [[-22, 214], [16, 212], [36, 210], [62, 212], [80, 220], [84, 230], [78, 238, 1], [-22, 238, 1], [-26, 226]];
  function shoeDef(parent, col, seed, back, sy) {
    return { parent, at: [0, 0], pts: scl(SHOE_CLOWN, 1, sy || 1), base: col, seed, noRivet: true, paint: () => {
      const by = 214 * (sy || 1);
      strokePts([[0, by + 2], [40, by], [70, by + 6]], 'rgba(255,255,255,0.3)', 1.6); fillPts(rect(-24, by + 20, 84, by + 30), 'rgba(20,10,8,0.45)');
      if (back) fillPts(rect(-30, by - 10, 90, by + 30), 'rgba(20,14,10,0.18)');
    } };
  }
  const EXPR = {
    neutre: {}, ravi: { mouth: 'smile', eyes: 'half' }, surpris: { brow: 'up', eyes: 'wide', mouth: 'o' }, triste: { brow: 'worry', mouth: 'tight', eyes: 'half' },
    fache: { brow: 'frown', mouth: 'tight' }, fier: { brow: 'up', mouth: 'smile' }, gene: { brow: 'worry', eyes: 'half', mouth: 'tight' }, moue: { brow: 'frown', eyes: 'half', mouth: 'tight' },
  };
  function expr(q, nom) { const e = EXPR[nom]; if (!e) return; for (const k in e) if (q.face[k] == null) q.face[k] = e[k]; }
  function defOf(nom, parts, G, skin, skinB, seed, order, hipY, extra) {
    Object.assign(parts, heldParts(G, skin, skinB, seed));
    return Object.assign({ nom, G, hipY: hipY || -238, parts, handLen: Math.round(Math.hypot(G.PG[0], G.PG[1])), rod: { part: 'torso', at: [-26, 18] }, order }, extra || {});
  }
  const TAIL = ['objetB', 'doigtsB', 'objet', 'armF_up', 'armF_lo', 'objetDevant', 'doigts', 'doigtsB2'];   // objetDevant : objet plat tenu face public (carte), devant les bras

  // =====================================================================
  // 4) WILLARD SCOTT — ~30 ans, nettement rond et jovial (ventre, joues pleines, double menton léger), cheveux bruns ondulés coiffés en arrière.
  //    costume 'bozo' (combinaison bleu ardoise, gros boutons ocre, collerette ivoire, visage blanc, touffes rouges, nez boule rouge)
  //            'ronald' (même combinaison rayée ivoire/rouge, nez-gobelet, plateau sur la tête) ; 'costume' (veston moutarde, nœud bordeaux)
  // =====================================================================
  const SC = { peau: '#e8bf9a', peauD: '#c99c78', blanc: '#f2eadb', blancD: '#d8ccb4', chev: '#5a3a24', chevL: '#7d5638', rouge: C.rouge, bleuSourcil: '#3d5a8a',
    veste: '#b8913a', vesteD: '#977529', vesteL: '#cfa957', chemise: '#ece4d0', noeud: C.bordeaux, pant: '#5a4030', pantD: '#46321f', soulier: '#2e2219', grosSoulier: '#3a2418' };
  const scV = (p) => clamp(p.ventre == null ? 1 : p.ventre, 0.3, 1.2);
  function scFront(v) { const bx = 44 + 40 * v; return [[26, -176], [38, -160], [46, -140], [bx - 20, -112], [bx - 6, -86], [bx, -60], [bx - 3, -34], [bx - 14, -10], [bx - 30, 8], [28, 24, 1]]; }
  const scTorso = (v) => [[-22, -180], [8, -186]].concat(scFront(v), [[-46, 24, 1], [-54, 2], [-58, -50], [-58, -110], [-52, -152], [-38, -172]]);
  function frontAt(v, y) { const F = scFront(v); for (let i = 0; i < F.length - 1; i++) { const a = F[i], b = F[i + 1]; if (y >= a[1] && y <= b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1] || 1)); } return 40; }
  const SC_HEAD = [[-20, 16], [14, 16], [22, 8], [30, -2], [36, -12], [37, -20], [34, -25], [36, -30], [35, -34], [38, -38], [44, -44, 1], [38, -52], [34, -58], [34, -70], [30, -84], [18, -97], [-4, -103], [-26, -96], [-40, -78], [-42, -50], [-36, -24], [-28, -4]];
  const SC_HAIR = [[32, -80], [30, -92], [20, -104], [4, -112], [-14, -112], [-30, -104], [-42, -90], [-49, -72], [-48, -52], [-42, -38], [-36, -46], [-33, -62], [-24, -76], [-8, -82], [12, -84], [24, -78]];
  function touffe(cx, cy, rx, ry, n, seed) { const o = []; for (let i = 0; i < n * 3; i++) { const a = i / (n * 3) * TAU, bump = i % 3 === 1 ? 1.18 : 0.94 + 0.06 * Math.sin(seed + i); o.push([cx + Math.cos(a) * rx * bump, cy + Math.sin(a) * ry * bump]); } return o; }
  const SC_TOUFFE = touffe(-46, -62, 44, 36, 9, 1), SC_TOUFFE_B = touffe(-30, -92, 36, 24, 7, 3);
  const RUFF = (() => { const o = []; for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, r = i % 2 ? 1 : 0.8; o.push([6 + Math.cos(a) * 46 * r, -152 + Math.sin(a) * 13 * r]); } return o; })();
  const scCost = (p) => p.costume || 'bozo';
  const clownCost = (p) => scCost(p) !== 'costume';
  function scBody(p, back) { const k = scCost(p); return k === 'costume' ? (back ? SC.vesteD : SC.veste) : k === 'ronald' ? (back ? C.ivoireD : C.ivoire) : (back ? C.ardoiseD : C.ardoise); }
  function scStripes(p, back, y0, y1) {                 // rayures verticales rouges de la combinaison de Ronald
    if (scCost(p) !== 'ronald') return;
    for (let x = -80; x < 110; x += 18) fillPts([[x, y0], [x + 8, y0], [x + 8, y1], [x, y1]], back ? C.rougeD : C.rouge, x, 0.3);
  }
  function scForeDeco(p, back) {
    scStripes(p, back, -20, 64);
    const k = scCost(p);
    fillPts([[-16, 56, 1], [16, 56, 1], [17, 78, 1], [-16, 78, 1]], k === 'costume' ? SC.chemise : C.ivoire);
    if (k !== 'costume') for (let x = -14; x <= 14; x += 6) strokePts([[x, 58], [x + 2, 76]], 'rgba(120,100,70,0.45)', 1);
  }
  function mkScott() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => scTorso(scV(p)), base: C.ardoise, seed: 7201, paint: (p) => {
        const v = scV(p), k = scCost(p), F = scFront(v);
        fillPts(scTorso(v), scBody(p, false));
        if (k === 'costume') {
          fillPts([[8, -186], [26, -176], [36, -160], [30, -128], [20, -110], [8, -140]], SC.chemise);                         // plastron
          fillPts([[22, -180], [42, -156], [48, -128], [26, -96], [34, -132], [20, -162]], '#6e4a26'); strokePts([[42, -156], [48, -128], [26, -96]], 'rgba(255,230,180,0.35)', 1.2);   // larges revers brun chocolat (années 70)
          for (const y of [-64, -30]) { dot(frontAt(v, y) - 9, y, 3.2, '#5a4420'); dot(frontAt(v, y) - 9.5, y - 0.8, 1.1, '#e0c080'); }
          strokePts([[-6, -40], [22, -42]], 'rgba(60,40,10,0.5)', 1.4); strokePts([[-2, -120], [16, -122]], 'rgba(60,40,10,0.45)', 1.2);   // poches
          fillPts([[-4, -122], [6, -134], [12, -122]], '#ece4d0');                                                           // pochette
          fillPts(rect(-48, 18, 40, 24), SC.pantD);
        } else {
          scStripes(p, false, -200, 30);
          for (let i = 0; i < 5; i++) strokePts(qbez([-30 + i * 14, -170], [-20 + i * 16, -80], [-34 + i * 15, 20], 8), 'rgba(20,24,40,0.22)', 1.2);  // plis
          const pop = p.bouton != null && (p.t || 0) >= p.bouton;
          for (const y of [-128, -96, -62, -28]) {
            const x = frontAt(v, y) - 13;
            if (pop && y === -62) { fillPts(ell(x + 6, y, 9, 6, 10), '#efe6d2', 0, 0); strokePts([[x + 1, y - 7], [x + 12, y - 4]], 'rgba(30,20,20,0.6)', 1.2); continue; }
            fillPts(ell(x, y, 7, 7, 12), C.or, 0, 0); strokePts(ep(x, y, 7, 7, 12, 0, TAU), '#6e521c', 1.2); dot(x - 2, y - 2, 1.6, '#f0d890'); dot(x + 1, y + 1, 1, '#6e521c');
          }
        }
        hatch([[-62, -170], [-20, -170], [-20, 24], [-62, 24]], 0.75, 4.2, 0.26); shade(F[5][0], -60, -56, -40, 0.3, [-64, -190, 130, 30]);
      }, extra: (p) => {                                      // bouton qui saute : p.bouton = instant (s, même horloge que p.t)
        if (p.bouton == null || clownCost(p) === false || SIL()) return;
        const u = (p.t || 0) - p.bouton; if (u < 0) return;
        const v = scV(p), x0 = frontAt(v, -62) - 13, y0 = -62, g = 1500, tl = (Math.sqrt(380 * 380 + 2 * g * (238 + 62 - 0)) + 380) / g;
        const uu = Math.min(u, tl), x = x0 + 210 * uu, y = Math.min(238, y0 - 380 * uu + 0.5 * g * uu * uu), r = uu * 14;
        const c = cx_(); c.save(); c.translate(x, y - 7); c.rotate(r); c.scale(1, u >= tl ? 0.45 : Math.abs(Math.cos(r * 0.7)) * 0.7 + 0.3);
        fillPts(ell(0, 0, 7, 7, 12), C.or, 0, 0); strokePts(ep(0, 0, 7, 7, 12, 0, TAU), '#6e521c', 1.2); dot(-2, -2, 1.6, '#f0d890');
        c.restore();
      } },
      legB: legDef([-8, -2], C.ardoiseD, SC.soulier, 7202, true, 1.18),
      legF: legDef([8, -2], C.ardoise, SC.soulier, 7203, false, 1.18),
      shoeB: shoeDef('legB', SC.grosSoulier, 7204, true), shoeF: shoeDef('legF', SC.grosSoulier, 7205, false),
      armB_up: upDef([-10, -146], C.ardoiseD, 7206, null, 17, 96, true),
      armB_lo: foreDef('armB_up', true, 7207, { base: C.ardoiseD, skin: SC.peauD }),
      head: { parent: 'torso', at: [6, -170], pts: SC_HEAD, base: SC.peau, seed: 7208, noRivet: true, paint: (p) => {
        const f = p.face || {}, k = scCost(p), cl = k !== 'costume';
        if (cl) { fillPts(SC_HEAD, SC.blanc); fillPts([[-20, 16], [14, 16], [16, 6], [-24, 2]], SC.peau); }
        X.earPaint(-12, -44);
        hatch([[-30, -40], [-2, -26], [8, -6], [-10, 18], [-36, 4]], 0.6, 3.6, cl ? 0.16 : 0.26);
        strokePts([[16, 6], [28, -4], [33, -12]], cl ? 'rgba(150,130,110,0.5)' : 'rgba(150,90,70,0.55)', 1.3);                 // double menton
        dot(24, -28, 11, cl ? 'rgba(220,110,100,0.38)' : 'rgba(215,120,100,0.3)');                                        // joue pleine
        const wink = (p.clin || 0) > 0.5;
        X.eye(Object.assign({}, f, wink ? { eyes: 'closed' } : {}), 20, -54, 1.08);
        if (wink) strokePts([[12, -47], [20, -44], [27, -47]], 'rgba(120,70,60,0.5)', 1.2);
        if (k === 'bozo') strokePts(qbez([8, -66], [20, -80], [32, -68], 8), SC.bleuSourcil, 3.2);
        else if (k === 'ronald') strokePts(qbez([10, -64], [20, -74], [30, -64], 8), '#2a2220', 2.4);
        else X.brow(f, 20, -63, 'rgba(70,44,28,0.95)', 3);
        const m = f.mouth || 'smile';
        if (cl) fillPts(m === 'o' ? ell(30, -20, 9, 9, 12) : m === 'tight' ? [[36, -22], [26, -16], [16, -20], [18, -24], [26, -21], [34, -26]] : [[38, -28], [34, -16], [22, -12], [12, -20], [14, -24], [24, -18], [32, -22]], 'rgba(170,40,38,0.85)', 0, 0.3);
        if (m === 'smile') { fillPts([[35, -24], [30, -18], [22, -17], [17, -21], [24, -20], [31, -22]], '#3a1714', 0, 0); strokePts([[33, -22], [22, -19]], '#efe8da', 1.6); strokePts([[37, -27], [35, -23]], 'rgba(90,30,26,0.8)', 1.4); }
        else if (m === 'o') fillPts(ell(30, -20, 5, 5.5, 10), '#3a1714', 0, 0);
        else X.mouth(f, 31, -21);
        if (k === 'bozo') { pc(ell(45, -42, 9, 9, 14), '#b8302a', () => dot(42, -46, 3, 'rgba(255,200,190,0.7)'), 7209, { drop: false }); }
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: SC.chev, seed: 7210, pts: (p) => (scCost(p) === 'bozo' && (p.perruque == null || p.perruque > 0.5) ? OFFP : SC_HAIR), paint: () => {
        for (let i = 0; i < 4; i++) strokePts(qbez([28 - i * 3, -86 - i * 6], [0, -100 - i * 3 + (i % 2 ? 8 : -2)], [-40 + i * 2, -76 - i * 7], 10), 'rgba(30,18,10,0.55)', 1.4);
        strokePts(qbez([24, -92], [0, -108], [-26, -100], 10), 'rgba(170,130,90,0.5)', 1.8);
        hatch(null, 0.7, 3.4, 0.25);
      } },
      touffe: { parent: 'head', at: [0, 0], noRivet: true, base: SC.rouge, seed: 7211, pts: (p) => (scCost(p) === 'bozo' && (p.perruque == null || p.perruque > 0.5) ? SC_TOUFFE : OFFP), paint: () => {
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; strokePts(qbez([-46, -62], [-46 + Math.cos(a) * 22, -62 + Math.sin(a) * 18], [-46 + Math.cos(a + 0.4) * 38, -62 + Math.sin(a + 0.4) * 30], 6), 'rgba(60,10,8,0.5)', 1.3); }
        strokePts(ep(-44, -64, 20, 14, 8, PI * 1.1, PI * 1.6), 'rgba(240,150,130,0.45)', 2);
      } },
      touffeB: { parent: 'head', at: [0, 0], noRivet: true, base: C.rougeD, seed: 7212, pts: (p) => (scCost(p) === 'bozo' && (p.perruque == null || p.perruque > 0.5) ? SC_TOUFFE_B : OFFP), paint: () => hatch(null, 0.9, 3, 0.35) },
      calotte: { parent: 'head', at: [0, 0], noRivet: true, base: SC.blanc, seed: 7213, pts: (p) => (scCost(p) === 'bozo' && (p.perruque == null || p.perruque > 0.5) ? [[30, -82], [26, -94], [14, -104], [-4, -108], [-24, -101], [-38, -86], [-30, -80], [-10, -86], [12, -86]] : OFFP),
        paint: () => { strokePts(qbez([22, -96], [2, -108], [-22, -98], 8), 'rgba(255,255,255,0.8)', 2.4); strokePts([[30, -82], [12, -86], [-10, -86], [-30, -80]], 'rgba(150,130,110,0.45)', 1.1); } },
      nez: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 7214, pts: OFFP, extra: (p) => {
        if (scCost(p) !== 'ronald' || p.nez === 0 || p.nez === false) return;
        const c = cx_(); c.save(); c.translate(36 + 24 * 0.9, -43); c.rotate(-PI / 2); c.scale(0.9, 0.9); drawGobelet(); c.restore();
      } },
      plateauT: { parent: 'head', at: [-4, -108], noRivet: true, base: '#000', seed: 7215, pts: OFFP, extra: (p) => {
        if (scCost(p) !== 'ronald' || !(p.plateau == null ? 1 : p.plateau)) return;
        const c = cx_(); c.save(); c.rotate(0.03 * Math.sin(M.tg(p.t || 0) * 1.7)); drawPlateau({}); c.restore();
      } },
      col: { parent: 'torso', at: [0, 0], noRivet: true, base: C.ivoire, seed: 7216, pts: (p) => (clownCost(p) ? RUFF : OFFP), paint: () => {
        for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; strokePts([[6 + Math.cos(a) * 14, -152 + Math.sin(a) * 4], [6 + Math.cos(a) * 44, -152 + Math.sin(a) * 12]], 'rgba(120,100,70,0.5)', 1.1); }
        shade(0, -166, 0, -140, 0.25, [-44, -168, 56, -136]);
      } },
      noeud: { parent: 'torso', at: [0, 0], noRivet: true, base: SC.noeud, seed: 7217, pts: (p) => (scCost(p) === 'costume' ? [[30, -152], [46, -164], [48, -146], [38, -150], [48, -136], [46, -128, 1], [30, -146]] : OFFP),
        paint: () => { fillPts(ell(34, -149, 4.5, 4.5, 8), '#4a1218'); strokePts([[36, -158], [44, -160]], 'rgba(255,200,190,0.35)', 1); } },
      armF_up: upDef([-2, -146], C.ardoise, 7218, null, 17, 96, false),
      armF_lo: foreDef('armF_up', false, 7219, { base: C.ardoise, skin: SC.peau }),
    };
    // couleurs par costume (base des pièces) : on les applique au dessin par une peinture de fond
    const recolor = (name, back, kind) => { const pt = parts[name], old = pt.paint; pt.paint = (p) => {
      const k = scCost(p), col = kind === 'jambe' ? (k === 'costume' ? (back ? SC.pantD : SC.pant) : scBody(p, back)) : scBody(p, back);
      fillPts([[-90, -260], [120, -260], [120, 320], [-90, 320]], col);
      if (kind === 'jambe' && k === 'ronald') scStripes(p, back, -30, 214);
      if (kind === 'manche') scStripes(p, back, -30, 110);
      if (kind === 'avantbras') scForeDeco(p, back);
      if (old) old(p);
    }; };
    recolor('legB', true, 'jambe'); recolor('legF', false, 'jambe'); recolor('armB_up', true, 'manche'); recolor('armF_up', false, 'manche');
    recolor('armB_lo', true, 'avantbras'); recolor('armF_lo', false, 'avantbras');
    for (const s of ['shoeB', 'shoeF']) { const pt = parts[s], pts = pt.pts; pt.pts = (p) => (clownCost(p) ? pts : OFFP); }
    return defOf('scott', parts, G_ADULTE, SC.peau, SC.peauD, 7240,
      ['armB_up', 'armB_lo', 'legB', 'shoeB', 'legF', 'shoeF', 'touffeB', 'head', 'cheveux', 'calotte', 'touffe', 'plateauT', 'nez', 'torso', 'col', 'noeud'].concat(TAIL));
  }
  CH.ronScott = mkScott();
  const NEZ_C = [36 + 24 * 0.9, -43], PLAT_H = [-4, -108];
  RON.scott = wrap('ronScott', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    expr(q, q.expr);
    const sa = ease(clamp(q.salut || 0)), jo = ease(clamp(q.joie || 0)), id = clamp(q.idee || 0), pn = ease(clamp(q.porteNez || 0)), pc_ = clamp(q.poseChapeau || 0),
      ti = ease(clamp(q.tient || 0)), rv = ease(clamp(q.rentreVentre || 0)), tr_ = ease(clamp(q.triste || 0)), cr = ease(clamp(q.croque || 0)), cl = clamp(q.clin || 0);
    if (rv > 0) { if (q.ventre == null) q.ventre = lerp(1, 0.55, rv); A.head = (A.head || 0) - 0.1 * rv; q.dy = (q.dy || 0) - 4 * rv; blend(q, 'armF_up', 0.08, rv); blend(q, 'armB_up', 0.1, rv);
      if (!f.eyes) f.eyes = 'wide'; if (!f.mouth) f.mouth = 'tight'; if (!f.brow) f.brow = 'up'; }
    if (tr_ > 0) { A.head = (A.head || 0) + 0.4 * tr_; q.tilt = (q.tilt || 0) + 0.05 * tr_; q.dy = (q.dy || 0) + 5 * tr_; blend(q, 'armF_up', -0.12, tr_); blend(q, 'armF_lo', -0.25, tr_); blend(q, 'armB_up', -0.06, tr_);
      if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight'; if (!f.eyes) f.eyes = 'half'; }
    if (sa > 0) { armTo(q, 'armF', [74, -306], sa); A.armF_lo = (A.armF_lo || 0) + 0.32 * Math.sin(t * 9) * sa; q.handF = 'open'; A.head = (A.head || 0) - 0.05 * sa; }
    if (jo > 0) { blend(q, 'armF_up', -2.3, jo); blend(q, 'armF_lo', -0.25, jo); blend(q, 'armB_up', -2.8, jo); blend(q, 'armB_lo', -0.2, jo);
      q.handF = 'open'; q.handB = 'open'; A.head = (A.head || 0) - 0.16 * jo; q.dy = (q.dy || 0) - Math.abs(Math.sin(g * 6)) * 9 * jo; if (!f.mouth) f.mouth = 'o'; if (!f.brow) f.brow = 'up'; }
    if (id > 0) {
      const k1 = ease(clamp(id / 0.45)), k2 = ease(clamp((id - 0.55) / 0.45)), Cn = headPt(q, 30, 8);
      armTo(q, 'armF', [Cn[0] + 6, Cn[1] + 20], k1 * (1 - k2)); armTo(q, 'armF', [96, -300], k2);
      q.handF = k2 > 0.3 ? 'open' : 'fist'; A.head = (A.head || 0) + 0.06 * k1 * (1 - k2) - 0.1 * k2;
      if (!f.eyes) f.eyes = k2 > 0.3 ? 'wide' : 'half'; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = k2 > 0.3 ? 'o' : 'tight';
    }
    if (pn > 0) {                                      // porte le gobelet sur le nez (avec nez:0) ; avec nez:1 la main vient juste le presser
      if (!q.nez && q.tenu == null) { q.tenu = 'gobelet'; if (q.tenuO.echelle == null) q.tenuO.echelle = 0.9; }
      A.objet = (A.objet || 0) - PI / 2 * pn;
      const N = headPt(q, NEZ_C[0] + 5 * 0.9, NEZ_C[1]), S0 = [92, -96];
      armTo(q, 'armF', [lerp(S0[0], N[0], pn), lerp(S0[1], N[1], pn) - 30 * Math.sin(pn * PI)], 1);
      A.head = (A.head || 0) - 0.04 * pn; if (!f.eyes) f.eyes = 'half';
    }
    if (pc_ > 0 || ti > 0) {                           // plateau à deux mains : devant la poitrine (tient), puis posé sur la tête (poseChapeau)
      if (!(q.plateau && pc_ > 0) && q.tenu == null) q.tenu = 'plateau';
      if (q.tenu === 'plateau' && q.deuxMains == null) q.deuxMains = true;
      const Gp = OBJ.plateau.grip, H = headPt(q, PLAT_H[0], PLAT_H[1]), S0 = [128, -96];
      const P0 = [S0[0] + Gp[0], S0[1] + Gp[1]], P1 = [H[0] + Gp[0] + 8, H[1] + Gp[1] - 64], P2 = [H[0] + Gp[0], H[1] + Gp[1]];
      let T = P0;
      if (pc_ > 0) { const a = ease(clamp(pc_ / 0.6)), b = ease(clamp((pc_ - 0.6) / 0.4)); T = [lerp(lerp(P0[0], P1[0], a), P2[0], b), lerp(lerp(P0[1], P1[1], a), P2[1], b)]; }
      armTo(q, 'armF', T, Math.max(ti, pc_ > 0 ? 1 : 0));
      if (q.plateau && pc_ > 0 && q.tenu !== 'plateau') { armTo(q, 'armB', [P2[0] - 28, P2[1]], 1); q.handF = 'open'; q.handB = 'open'; }
      if (pc_ > 0.3) A.head = (A.head || 0) - 0.05;
    }
    if (cr > 0) {                                      // croque : le côté mordu du hamburger vient à la bouche
      if (q.tenu == null) q.tenu = 'hamburger';
      const e = q.tenuO.echelle || 1, Mo = headPt(q, 34, -22), Gh = OBJ.hamburger.grip, Bt = OBJ.hamburger.pts.morsure;
      const T1 = [Mo[0] + (Gh[0] - Bt[0]) * e + 4, Mo[1] + (Gh[1] - Bt[1]) * e], T0 = [96, -86];
      armTo(q, 'armF', [lerp(T0[0], T1[0], cr), lerp(T0[1], T1[1], cr)], 1);
      if (!f.mouth) f.mouth = cr > 0.75 ? 'o' : 'smile'; if (!f.eyes) f.eyes = cr > 0.8 ? 'closed' : 'open';
    }
    if (cl > 0) { if (!f.mouth) f.mouth = 'smile'; A.head = (A.head || 0) + 0.06 * Math.sin(cl * PI); }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.4 * Math.sin(g * 1.7);
  }, 0.9);

  function plier(q, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), pieds à plat
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function applaudit(q, k, P0) {                            // deux mains ouvertes qui se rejoignent devant la poitrine
    if (!(k > 0)) return;
    const s = Math.abs(Math.sin(M.tg(q.t || 0) * 7.5));
    armTo(q, 'armF', [P0[0] + 4 + 16 * s, P0[1] - 4 * s], k); armTo(q, 'armB', [P0[0] - 4 - 6 * s, P0[1] + 3], k); q.handF = 'open'; q.handB = 'open';
  }

  // =====================================================================
  // 5a) LE RESTAURATEUR — mince, moustache fine noire, cheveux noirs gominés, calot de papier blanc, veste courte ivoire à liseré rouge,
  //     nœud papillon noir, pantalon gris
  // =====================================================================
  const RE = { peau: '#dcb08c', peauD: '#bd9070', veste: '#ece5d4', vesteD: '#cfc6b2', liser: C.rouge, pant: '#6c6e72', pantD: '#55575b', soulier: '#1c1714', chev: '#1e1a1a', calot: '#f4f0e6' };
  const RE_TORSO = [[-16, -178], [8, -182], [18, -170], [28, -150], [34, -116], [36, -70], [35, -30], [33, 0], [31, 22, 1], [-36, 24, 1], [-38, 0], [-40, -60], [-40, -112], [-36, -150], [-28, -168]];
  const RE_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [29, -26], [28, -30], [31, -34], [38, -40, 1], [33, -46], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const RE_CALOT = [[30, -78], [26, -92], [12, -104], [-8, -114], [-30, -110], [-42, -96], [-40, -84], [-20, -86], [8, -84]];
  function mkResto() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: RE_TORSO, base: RE.veste, seed: 7301, paint: () => {
        strokePts([[18, -170], [28, -150], [34, -116], [36, -70], [35, -30], [33, 0], [31, 20]], RE.liser, 3.2);
        strokePts([[31, 19], [-36, 21]], RE.liser, 3.2);
        fillPts([[8, -182], [18, -170], [14, -162], [4, -172]], '#f6f1e6');                                    // col officier
        for (const y of [-128, -92, -56, -20]) { dot(24, y, 2.6, '#c9c0aa'); dot(23.4, y - 0.6, 1, '#fff'); }
        strokePts([[-4, -56], [16, -58]], 'rgba(90,70,50,0.45)', 1.2); fillPts([[-2, -64], [4, -76], [8, -64]], C.rouge);   // poche + crayon
        hatch([[-46, -170], [-14, -170], [-14, 24], [-46, 24]], 0.75, 4.2, 0.24); shade(36, -40, -40, -40, 0.22, [-44, -190, 44, 30]);
      } },
      legB: legDef([-6, -2], RE.pantD, RE.soulier, 7302, true, 0.9),
      legF: legDef([6, -2], RE.pant, RE.soulier, 7303, false, 0.9, 1, (b, by) => strokePts([[10, -10], [8, by]], 'rgba(40,40,44,0.35)', 1.2)),
      armB_up: upDef([-10, -146], RE.vesteD, 7304, null, 14, 96, true),
      armB_lo: foreDef('armB_up', true, 7305, { base: RE.vesteD, skin: RE.peauD, cuff: '#b9b09a' }),
      head: { parent: 'torso', at: [6, -170], pts: RE_HEAD, base: RE.peau, seed: 7306, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[28, -76], [18, -84], [-6, -88], [-26, -82], [-36, -62], [-34, -40], [-26, -36], [-24, -56], [-14, -70], [6, -76]], RE.chev, 2, 0.3);   // cheveux gominés
        strokePts([[20, -80], [-2, -84], [-24, -76]], 'rgba(200,210,230,0.45)', 1.6);
        X.earPaint(-9, -44);
        hatch([[-26, -40], [0, -24], [10, -6], [-8, 16], [-34, 2]], 0.6, 3.6, 0.26);
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(30,22,20,0.95)', 2.4);
        strokePts([[34, -33], [27, -31], [21, -32]], '#1e1a1a', 2.4); strokePts([[34, -33], [37, -30]], '#1e1a1a', 1.4);   // moustache fine
        X.mouth(f, 28, -25);
      } },
      calot: { parent: 'head', at: [0, 0], pts: RE_CALOT, base: RE.calot, seed: 7307, noRivet: true, paint: () => {
        strokePts([[28, -84], [6, -90], [-20, -92], [-40, -88]], 'rgba(120,110,90,0.55)', 1.3);
        strokePts([[22, -94], [0, -108], [-26, -108]], 'rgba(255,255,255,0.8)', 1.6); hatch(null, 0.7, 4, 0.12);
      } },
      noeud: { parent: 'torso', at: [0, 0], pts: [[18, -172], [30, -180], [31, -166], [24, -169], [30, -156], [29, -150, 1], [18, -163]], base: '#141214', seed: 7308, noRivet: true, paint: () => fillPts(ell(21, -167, 3.4, 3.4, 8), '#2c282a') },
      armF_up: upDef([-2, -146], RE.veste, 7309, () => strokePts([[-14, 90], [14, 90]], RE.liser, 2.4), 14, 96, false),
      armF_lo: foreDef('armF_up', false, 7310, { base: RE.veste, skin: RE.peau, cuff: '#d8cfb8', deco: () => strokePts([[-12, 60], [12, 60]], RE.liser, 2.4) }),
    };
    return defOf('resto', parts, G_ADULTE, RE.peau, RE.peauD, 7330, ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'calot', 'torso', 'noeud'].concat(TAIL));
  }
  CH.ronResto = mkResto();
  OBJ.panneau.held = { echelle: 1.1 };
  RON.resto = wrap('ronResto', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    expr(q, q.expr);
    const ac = ease(clamp(q.accroche || 0)), pl = ease(clamp(q.plaide || 0)), de = ease(clamp(q.desole || 0)), se = ease(clamp(q.sert || 0)),
      en = ease(clamp(q.encaisse || 0)), ap = ease(clamp(q.applaudit || 0));
    if (ac > 0) {                                      // panneau levé à deux mains au-dessus de la tête (bord bas), regard vers le haut
      if (q.tenu == null) q.tenu = 'panneau'; if (q.deuxMains == null) q.deuxMains = true;
      const e = q.tenuO.echelle || 1.1, Gp = OBJ.panneau.grip, Cc = [lerp(80, 34, ac), lerp(-120, -372, ac)];
      armTo(q, 'armF', [Cc[0] + Gp[0] * e, Cc[1] + Gp[1] * e], 1); A.head = (A.head || 0) - 0.32 * ac; if (!f.brow) f.brow = 'up';
    }
    if (pl > 0) { armTo(q, 'armF', [124, -122], pl); armTo(q, 'armB', [116, -116], pl); q.handF = 'open'; q.handB = 'open'; plier(q, 0.05 * pl); A.head = (A.head || 0) - 0.08 * pl;
      if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'o'; }
    if (de > 0) { armTo(q, 'armF', [58, -8], de); armTo(q, 'armB', [40, -4], de); q.handF = 'open'; q.handB = 'open'; q.dy = (q.dy || 0) + 4 * de; A.head = (A.head || 0) + 0.18 * de;
      if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight'; if (!f.eyes) f.eyes = 'half'; }
    if (se > 0) { if (q.tenu == null) q.tenu = 'sac'; armTo(q, 'armF', [156, -118], se); plier(q, 0.04 * se); if (!f.mouth) f.mouth = 'smile'; }
    if (en > 0) { armTo(q, 'armF', [146, -86], en); q.handF = 'open'; if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'up'; }
    applaudit(q, ap, [96, -120]); if (ap > 0 && !f.mouth) f.mouth = 'smile';
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.2 * Math.sin(g * 1.9 + 1);
  }, 0.88);

  // =====================================================================
  // 5b) LE DIRIGEANT DE LA FIRME — grand et sec, cheveux gris argent en brosse, grosses lunettes noires à monture épaisse,
  //     costume trois-pièces bleu nuit, cravate fine bordeaux. Jambes plus longues (sy 1.08).
  // =====================================================================
  const DI = { peau: '#e2bc9c', peauD: '#c49c7c', veste: C.nuit, vesteD: C.nuitD, vesteL: '#33415e', gilet: '#2c3a56', chem: '#ece6d8', cravate: C.bordeaux, gris: '#c2c4c6', grisD: '#8e9296', soulier: '#141012' };
  const DI_SY = 1.08, DI_HIP = -Math.round(238 * DI_SY);
  const DI_TORSO = [[-14, -180], [8, -184], [18, -172], [28, -152], [33, -118], [34, -70], [33, -30], [34, 4], [36, 40, 1], [-36, 42, 1], [-36, 0], [-38, -60], [-38, -112], [-34, -150], [-26, -170]];
  const DI_HEAD = [[-14, 16], [10, 16], [12, 4], [18, -4], [24, -10], [27, -16], [26, -22], [28, -26], [27, -30], [30, -34], [36, -40, 1], [32, -46], [29, -56], [30, -66], [27, -80], [16, -94], [-6, -99], [-24, -90], [-32, -70], [-31, -46], [-24, -26], [-17, -6]];
  const DI_BROSSE = [[28, -80], [24, -96], [14, -104], [-8, -106], [-26, -100], [-34, -84], [-34, -64], [-28, -60], [-24, -76], [-10, -86], [10, -86], [22, -80]];
  function mkDirigeant() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: DI_TORSO, base: DI.veste, seed: 7401, paint: () => {
        for (let x = -34; x < 36; x += 9) strokePts([[x, -180], [x + 1, 42]], 'rgba(150,160,190,0.14)', 1);           // fines rayures tennis
        fillPts([[8, -184], [18, -172], [26, -150], [24, -100], [12, -70], [6, -120]], DI.gilet);                     // gilet
        for (const y of [-142, -122, -102, -84]) dot(lerp(20, 13, (y + 142) / 58), y, 2, '#5a6480');
        fillPts([[8, -184], [18, -172], [22, -160], [14, -160], [6, -172]], DI.chem);
        fillPts([[16, -170], [20, -168], [18, -116], [15, -110], [13, -116]], DI.cravate);                           // cravate fine
        fillPts([[18, -172], [30, -150], [34, -118], [22, -96], [14, -66], [28, -110], [26, -150]], DI.vesteL);        // revers
        strokePts([[14, -66], [30, -30], [34, 4]], 'rgba(10,12,20,0.6)', 1.4);
        dot(28, -54, 3, '#141a28'); strokePts([[-10, -12], [16, -14]], 'rgba(10,12,20,0.6)', 1.3);
        fillPts([[-6, -128], [2, -138], [6, -128]], '#d8d2c4');
        hatch([[-44, -172], [-14, -172], [-14, 42], [-44, 42]], 0.75, 4.2, 0.26); shade(34, -40, -40, -40, 0.25, [-44, -190, 44, 46]);
      } },
      legB: legDef([-6, -2], DI.vesteD, DI.soulier, 7402, true, 0.86, DI_SY),
      legF: legDef([6, -2], DI.veste, DI.soulier, 7403, false, 0.86, DI_SY, (b, by) => strokePts([[6, 30], [4, by]], 'rgba(150,160,190,0.25)', 1.2)),
      armB_up: upDef([-10, -146], DI.vesteD, 7404, null, 14, 96, true),
      armB_lo: foreDef('armB_up', true, 7405, { base: DI.vesteD, skin: DI.peauD, cuff: '#c8c2b4' }),
      head: { parent: 'torso', at: [6, -170], pts: DI_HEAD, base: DI.peau, seed: 7406, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-9, -44);
        hatch([[-26, -40], [0, -24], [10, -6], [-8, 16], [-34, 2]], 0.6, 3.6, 0.28);
        strokePts([[22, -14], [16, -2]], 'rgba(120,80,60,0.4)', 1.2);                                                // menton sec
        strokePts([[8, -40], [14, -30]], 'rgba(120,80,60,0.35)', 1.1);                                               // pli de la joue
        X.eye(f, 17, -52); X.brow(f, 17, -62, 'rgba(110,112,116,0.98)', 3.2);
        X.mouth(f, 27, -24);
        // grosses lunettes noires à monture épaisse
        strokePts(rect(9, -60, 29, -45), '#121012', 3, true); fillPts(rect(10.5, -58.5, 27.5, -46.5), 'rgba(190,220,235,0.16)', 0, 0);
        strokePts([[9, -55], [-8, -50]], '#121012', 2.4); strokePts([[13, -57], [18, -59]], 'rgba(255,255,255,0.55)', 1.2);
      } },
      brosse: { parent: 'head', at: [0, 0], pts: DI_BROSSE, base: DI.gris, seed: 7407, noRivet: true, paint: () => {
        for (let x = -32; x < 28; x += 3.2) strokePts([[x, -106], [x + 0.6, -84 + Math.abs(x + 4) * 0.2]], 'rgba(90,94,98,0.55)', 1);
        strokePts([[24, -97], [-26, -101]], 'rgba(255,255,255,0.5)', 1.6);
      } },
      armF_up: upDef([-2, -146], DI.veste, 7408, null, 14, 96, false),
      armF_lo: foreDef('armF_up', false, 7409, { base: DI.veste, skin: DI.peau, cuff: DI.chem }),
    };
    return defOf('dirigeant', parts, G_ADULTE, DI.peau, DI.peauD, 7430, ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'brosse', 'torso'].concat(TAIL), DI_HIP);
  }
  CH.ronDirigeant = mkDirigeant();
  OBJ.carte.held = { echelle: 1.05 };
  RON.dirigeant = wrap('ronDirigeant', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    expr(q, q.expr);
    const mc = ease(clamp(q.montreCarte || 0)), no = ease(clamp(q.non || 0)), me = ease(clamp(q.mesure || 0)), ac = ease(clamp(q.accueille || 0)), mo = ease(clamp(q.moue || 0));
    if (mc > 0) {                                      // carte face public à hauteur d'épaule, tenue par le bord haut à deux mains ; elle se déplie de 0,3 à 1
      if (q.tenu == null) q.tenu = 'carte'; if (q.deuxMains == null) q.deuxMains = true;
      if (q.tenuO.deplie == null) q.tenuO.deplie = clamp((mc - 0.3) / 0.7);
      const e = q.tenuO.echelle || 1.05, Gc = OBJ.carte.grip(q.tenuO), Cc = [lerp(56, 94, mc), lerp(-30, -70, mc)];
      armTo(q, 'armF', [Cc[0] + Gc[0] * e, Cc[1] + Gc[1] * e], 1);
      if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'tight';
    }
    if (no > 0) { A.head = (A.head || 0) + 0.1 * Math.sin(g * 11) * no + 0.04 * no; armTo(q, 'armF', [96 + 22 * Math.sin(g * 5.5), -52], no); q.handF = 'open';
      if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight'; }
    if (me > 0) {                                      // mètre autour du ventre de Scott : cible = RON.ventrePt(rScott) (écran) ; RON.ruban(rScott, rDirigeant) dessine le ruban
      plier(q, 0.06 * me); const T = q.cible ? loc(q.cible) : [150, -70];
      armTo(q, 'armF', vers(q._G.SHF, [T[0], T[1] - 14], 186), me); armTo(q, 'armB', vers(q._G.SHB, [T[0] - 8, T[1] + 14], 186), me);
      q.handF = 'fist'; q.handB = 'fist'; A.head = (A.head || 0) + 0.16 * me; if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight';
    }
    if (ac > 0) { armTo(q, 'armF', [156, -178], ac); armTo(q, 'armB', [70, -96], ac * 0.8); q.handF = 'open'; q.handB = 'open'; A.head = (A.head || 0) - 0.05 * ac; if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'up'; }
    if (mo > 0) { if (!f.mouth) f.mouth = 'tight'; if (!f.brow) f.brow = 'frown'; if (!f.eyes) f.eyes = 'half'; A.head = (A.head || 0) - 0.07 * mo; }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.0 * Math.sin(g * 1.5 + 2);
  }, 0.9);

  // =====================================================================
  // 5c) LE CLOWN DE CIRQUE — mince et souple, visage blanc, grand sourire rouge, cheveux rouges bouclés en touffe, combinaison jaune
  //     moutarde, manches et chaussettes rayées rouge/ivoire, grandes chaussures rouges, gants blancs
  // =====================================================================
  const CL = { blanc: '#f3ecde', peau: '#e2b896', jaune: C.moutarde, jauneD: C.moutardeD, jauneL: '#e0bd5c', rouge: C.rouge, gant: '#f4f0e6', gantD: '#d8d0c0', chev: '#b0302a', chevD: '#86221e' };
  const CL_TORSO = [[-14, -178], [8, -182], [17, -170], [26, -150], [31, -116], [32, -70], [31, -30], [31, 0], [30, 22, 1], [-34, 24, 1], [-35, 0], [-37, -60], [-37, -112], [-33, -150], [-26, -168]];
  const CL_BOUCLES = (() => { const o = []; const pts = [[30, -86], [22, -104], [4, -116], [-18, -118], [-38, -108], [-52, -90], [-56, -66], [-50, -44], [-40, -36]];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); o.push(a, [m[0] + dy / l * 9, m[1] - dx / l * 9]); }
    o.push(pts[pts.length - 1], [-30, -50], [-26, -70], [-12, -84], [10, -86]); return o; })();
  const clStripes = (back, y0, y1) => { for (let y = y0; y < y1; y += 14) fillPts([[-40, y], [40, y], [40, y + 7], [-40, y + 7]], back ? C.rougeD : CL.rouge, y, 0.3); };
  function mkClown() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CL_TORSO, base: CL.jaune, seed: 7501, paint: () => {
        for (let i = 0; i < 4; i++) strokePts(qbez([-26 + i * 14, -170], [-18 + i * 15, -80], [-28 + i * 15, 20], 8), 'rgba(90,60,10,0.22)', 1.2);
        strokePts([[22, -164], [28, -110], [29, -40], [28, 18]], 'rgba(90,60,10,0.45)', 1.4);                      // fermeture
        fillPts([[4, -182], [17, -170], [22, -160], [8, -168]], CL.jauneL);
        hatch([[-44, -170], [-14, -170], [-14, 24], [-44, 24]], 0.75, 4.2, 0.22); shade(32, -40, -38, -40, 0.22, [-44, -190, 40, 30]);
      } },
      legB: legDef([-6, -2], CL.jauneD, '#7a2220', 7502, true, 0.88, 1, (b) => clStripes(b, 172, 214)),
      legF: legDef([6, -2], CL.jaune, CL.rouge, 7503, false, 0.88, 1, (b) => clStripes(b, 172, 214)),
      shoeB: shoeDef('legB', '#7a2220', 7504, true), shoeF: shoeDef('legF', '#a3302b', 7505, false),
      armB_up: upDef([-10, -146], C.ivoireD, 7506, (b) => clStripes(b, -20, 110), 13, 96, true),
      armB_lo: foreDef('armB_up', true, 7507, { base: C.ivoireD, gant: CL.gantD, cuff: CL.gantD, deco: (b) => clStripes(b, -20, 62) }),
      head: { parent: 'torso', at: [6, -170], pts: RE_HEAD, base: CL.blanc, seed: 7508, noRivet: true, paint: (p) => {
        const f = p.face || {}, av = clamp(p.avale || 0);
        fillPts([[-14, 16], [10, 16], [11, 4], [-20, 0]], CL.peau);
        X.earPaint(-9, -44);
        X.eye(f, 17, -53, 1.05);
        strokePts(qbez([8, -70], [17, -80], [26, -70], 8), '#2a2220', 2.2);                                          // sourcil peint haut
        const m = f.mouth || 'smile';
        if (m === 'o') fillPts(ell(28, -22, 8, 9, 12), CL.rouge, 0, 0);
        else fillPts([[36, -34], [33, -20], [24, -14], [10, -18], [6, -28], [12, -24], [22, -20], [30, -26]], CL.rouge, 0, 0.3);   // grand sourire rouge
        if (m === 'o') fillPts(ell(28, -22, 4.5, 5, 10), '#3a1714', 0, 0); else strokePts([[32, -26], [22, -20], [12, -24]], '#3a1714', 1.6);
        pc(ell(38, -40, 6.5, 6.5, 12), CL.rouge, () => dot(36, -43, 2, 'rgba(255,200,190,0.7)'), 7509, { drop: false });   // petit nez rouge
        if (av > 0.05) { const u = fr((p.t || 0) * 1.3); fillPts(ell(13 - u * 3, -2 + u * 18, 5, 4, 8), 'rgba(170,130,110,0.4)', 0, 0); }
      } },
      boucles: { parent: 'head', at: [0, 0], pts: CL_BOUCLES, base: CL.chev, seed: 7510, noRivet: true, paint: () => {
        for (let i = 0; i < 16; i++) { const a = hash(i * 3.1) * TAU, x = -10 - 34 * hash(i * 7.7), y = -60 - 46 * hash(i * 5.3); strokePts(ep(x, y, 6, 6, 8, a, a + 4.5), 'rgba(60,10,8,0.6)', 1.3); }
        strokePts(qbez([16, -104], [-10, -122], [-40, -106], 8), 'rgba(240,140,120,0.45)', 1.8);
      } },
      armF_up: upDef([-2, -146], C.ivoire, 7511, (b) => clStripes(b, -20, 110), 13, 96, false),
      armF_lo: foreDef('armF_up', false, 7512, { base: C.ivoire, gant: CL.gant, cuff: CL.gant, deco: (b) => clStripes(b, -20, 62) }),
      balles: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: 7513, pts: OFFP, extra: (p) => {
        const k = clamp(p.jongle || 0); if (k < 0.05) return;
        const g = M.tg(p.t || 0) * 1.6, cols = ['#a3302b', '#3d5a8a', '#c49a3e'];
        for (let i = 0; i < 3; i++) { const u = fr(g + i / 3), x = lerp(56, 116, u < 0.5 ? u * 2 : 2 - u * 2), y = -124 - 230 * k * 4 * u * (1 - u);
          pc(ell(x, y, 11, 11, 12), cols[i], () => dot(x - 3, y - 3, 2.6, 'rgba(255,255,255,0.5)'), 7514 + i, { drop: false }); }
      } },
    };
    return defOf('clown', parts, G_ADULTE, CL.gant, CL.gantD, 7530, ['armB_up', 'armB_lo', 'legB', 'shoeB', 'legF', 'shoeF', 'head', 'boucles', 'torso'].concat(TAIL, ['balles']));
  }
  CH.ronClown = mkClown();
  const clownW = wrap('ronClown', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    expr(q, q.expr);
    const sa = ease(clamp(q.salut || 0)), jo = clamp(q.jongle || 0), re = ease(clamp(q.reverence || 0)), pe = ease(clamp(q.perplexe || 0)), av = ease(clamp(q.avale || 0)), ti = ease(clamp(q.tient || 0)),
      pi = q.pirouette ? 1 : 0;
    if (sa > 0) { armTo(q, 'armF', [128, -296], sa); armTo(q, 'armB', [70, -60], sa * 0.7); q.handF = 'open'; q.handB = 'open'; q.tilt = (q.tilt || 0) - 0.04 * sa; A.head = (A.head || 0) - 0.1 * sa;
      A.legF = (A.legF || 0) - 0.22 * sa; }
    if (jo > 0.05) { const w = Math.sin(g * 1.6 * TAU * 1.5); armTo(q, 'armF', [104, -112 - 14 * w], jo); armTo(q, 'armB', [66, -112 + 14 * w], jo); A.head = (A.head || 0) - 0.18 * jo; if (!f.eyes) f.eyes = 'wide'; }
    if (re > 0) { plier(q, 0.55 * re); armTo(q, 'armF', [34, -86], re); armTo(q, 'armB', [24, -30], re); q.handF = 'open'; A.head = (A.head || 0) + 0.2 * re; A.legF = (A.legF || 0) - 0.12 * re; }
    if (pe > 0) { const H = headPt(q, -26, -90); armTo(q, 'armF', [H[0], H[1]], pe); q.handF = 'open'; A.head = (A.head || 0) + 0.12 * pe; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight'; }
    if (av > 0) { armTo(q, 'armF', [42, -64], av); q.handF = 'open'; if (!f.eyes) f.eyes = 'wide'; if (!f.mouth) f.mouth = 'tight'; if (q.avale == null) q.avale = av; }
    if (ti > 0) { if (q.tenu == null) q.tenu = 'hamburger'; armTo(q, 'armF', [104, -106], ti); }
    if (pi) { armTo(q, 'armF', [96, -250], 1); armTo(q, 'armB', [60, -240], 1); q.handF = 'open'; q.handB = 'open'; A.head = (A.head || 0) - 0.1; }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.4 * Math.sin(g * 2.1 + 0.5) - (jo > 0.05 ? 2 * Math.abs(Math.sin(g * 4.7)) : 0);
  }, 0.9);
  // pirouette : pose.pirouette = tours (0 → 1 = un tour) ; écrasement horizontal jamais sous 0,25, le sens s'inverse à mi-tour
  RON.clown = function (pose, x, y, s, o) {
    const p = pose || {}; o = o || {};
    if (!p.pirouette) return clownW(p, x, y, s, o);
    const cc = Math.cos(TAU * p.pirouette), k = Math.max(0.25, Math.abs(cc)), d = (o.dir || 1) * (cc < 0 ? -1 : 1), c = cx_();
    c.save(); c.translate(x, 0); c.scale(k, 1); c.translate(-x, 0);
    const r = clownW(p, x, y - 14 * Math.sin(PI * fr(p.pirouette)), s, Object.assign({}, o, { dir: d }));
    c.restore(); return r;
  };
  RON.clown.pose = clownW.pose;

  // =====================================================================
  // 6a) ENFANTS 1960 — tenue 'a' (fille, nattes blondes, robe vichy rouge) 'b' (garçon roux en brosse, salopette bleue)
  //     'c' (garçon à casquette, pull vert éteint, culotte grise) 'd' (fille, frange brune, gilet ocre, jupe bleu nuit)
  //     Proportions d'enfant : grosse tête, jambes en deux pièces (cuisse legX + mollet legX_lo) pour s'asseoir sur un banc.
  // =====================================================================
  const G_ENF = { LA: 64, PG: [3, 65], SHF: [-2, -98], SHB: [-8, -98], HEAD: [4, -114], k: 0.68, enfant: true };
  const EN_HIP = -150, EN_ASSIS = 80;                     // hauteur de hanche debout ; hauteur du siège (unités) quand il est assis
  const EN = { peau: '#e9c3a0', peauD: '#cba280',
    a: { haut: '#b5453c', hautD: '#8e3530', bas: null, chev: '#d9b860', chevD: '#b8963e', jambe: 'peau', chaus: '#2a1e1a', socq: '#efe8da' },
    b: { haut: '#e6dcc4', hautD: '#c8bea6', bas: '#3f5f86', basD: '#304a6a', chev: '#b5532c', chevD: '#8e3f20', jambe: 'bas', chaus: '#5a3a22' },
    c: { haut: '#5e7556', hautD: '#4a5e44', bas: '#7a7c80', basD: '#5e6064', chev: '#6a4a30', chevD: '#4a3420', jambe: 'peau', chaus: '#2e2420', socq: '#8a8c90', casq: '#7a6446' },
    d: { haut: '#c49a3e', hautD: '#9e7a2e', bas: C.nuit, basD: C.nuitD, chev: '#4e3424', chevD: '#38241a', jambe: 'peau', chaus: '#6e1e28', socq: '#efe8da' } };
  const enT = (p) => EN[p.tenue] ? p.tenue : 'a';
  const fille = (p) => enT(p) === 'a' || enT(p) === 'd';
  const EN_TORSO = [[-10, -120], [6, -122], [14, -112], [22, -96], [26, -70], [26, -40], [25, -10], [24, 12, 1], [-28, 14, 1], [-29, -10], [-30, -50], [-30, -80], [-27, -102], [-20, -116]];
  const EN_ROBE = [[-10, -120], [6, -122], [14, -112], [22, -96], [26, -70], [26, -40], [30, -10], [38, 30], [42, 52, 1], [-44, 54, 1], [-40, 30], [-32, -10], [-30, -50], [-30, -80], [-27, -102], [-20, -116]];
  const EN_HEAD = [[-12, 14], [8, 14], [10, 2], [16, -6], [22, -12], [24, -18], [23, -24], [26, -30], [30, -34, 1], [26, -40], [24, -50], [24, -62], [18, -78], [4, -88], [-14, -90], [-28, -80], [-34, -60], [-32, -38], [-24, -20], [-16, -4]];
  const legUpPts = () => ep(0, 0, 13, 13, 10, PI, TAU).concat([[12, 34], [10.5, 66]], ep(0, 70, 10, 10, 10, 0, PI), [[-10.5, 66], [-13, 34]]);
  const legLoPts = () => ep(0, 0, 10, 10, 10, PI, TAU).concat([[10, 40], [9, 62], [24, 66], [32, 72], [31, 80, 1], [-12, 80, 1], [-12, 64], [-10, 40]]);
  function enLeg(side, back) {
    const up = { parent: 'torso', at: [side * 5, -2], pts: legUpPts(), base: '#000', seed: 7600 + (back ? 1 : 2), noRivet: !!back, paint: (p) => {
      const T = EN[enT(p)], col = T.jambe === 'bas' ? (back ? T.basD : T.bas) : (back ? EN.peauD : EN.peau);
      fillPts(rect(-20, -20, 20, 90), col); if (enT(p) === 'c') fillPts(rect(-20, -20, 20, 30), back ? T.basD : T.bas);
      hatch(null, 0.8, 3.6, back ? 0.3 : 0.18); if (back) fillPts(rect(-20, -20, 20, 90), 'rgba(20,14,10,0.14)');
    } };
    const lo = { parent: back ? 'legB' : 'legF', at: [0, 70], pts: legLoPts(), base: '#000', seed: 7603 + (back ? 1 : 2), paint: (p) => {
      const T = EN[enT(p)], col = T.jambe === 'bas' ? (back ? T.basD : T.bas) : (back ? EN.peauD : EN.peau);
      fillPts(rect(-20, -20, 40, 66), col);
      if (T.socq) fillPts(rect(-20, enT(p) === 'c' ? 20 : 48, 40, 66), back ? mixA(T.socq, '#000000', 0.15) : T.socq);
      fillPts(rect(-20, 64, 40, 90), T.chaus); strokePts([[4, 68], [24, 69]], 'rgba(255,255,255,0.3)', 1.2);
      if (back) fillPts(rect(-20, -20, 40, 90), 'rgba(20,14,10,0.14)');
    } };
    return [up, lo];
  }
  function mkEnfant() {
    const [legB, legB_lo] = enLeg(-1, true), [legF, legF_lo] = enLeg(1, false);
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => (fille(p) ? EN_ROBE : EN_TORSO), base: '#000', seed: 7610, paint: (p) => {
        const k = enT(p), T = EN[k];
        fillPts(rect(-60, -140, 60, 60), T.haut);
        if (k === 'a') { for (let x = -50; x < 50; x += 8) fillPts(rect(x, -140, x + 4, 60), 'rgba(240,230,215,0.38)'); for (let y = -126; y < 60; y += 8) fillPts(rect(-60, y, 60, y + 4), 'rgba(240,230,215,0.38)');
          fillPts([[4, -122], [14, -112], [8, -104], [-2, -114]], '#f3ede0'); strokePts([[-30, -10], [26, -12]], '#efe8da', 2.4); }
        if (k === 'b') { fillPts([[4, -84], [24, -84], [27, -40], [25, -10], [24, 12], [-28, 14], [-29, -10], [-30, -50], [-10, -84]], T.bas);
          strokePts([[-14, -116], [-6, -84]], T.basD, 4); dot(16, -78, 2.4, '#c9a24a'); strokePts([[-2, -60], [16, -60]], 'rgba(20,30,50,0.5)', 1.2); }
        if (k === 'c') { for (let y = -110; y < 10; y += 9) strokePts([[-32, y], [28, y]], 'rgba(30,40,26,0.35)', 1.1); fillPts(rect(-32, 2, 28, 14), T.bas); fillPts([[4, -122], [14, -112], [6, -110]], '#e6dcc4'); }
        if (k === 'd') { fillPts([[-60, -14], [60, -14], [60, 60], [-60, 60]], T.bas); strokePts([[14, -112], [20, -60], [22, -16]], T.hautD, 1.6);
          for (const y of [-92, -66, -40]) dot(19, y, 2, '#6a5020'); fillPts([[4, -122], [14, -112], [8, -108], [0, -116]], '#efe8da'); }
        hatch([[-36, -116], [-10, -116], [-10, 56], [-36, 56]], 0.75, 4, 0.22); shade(26, -30, -30, -30, 0.2, [-46, -130, 46, 60]);
      } },
      legB, legB_lo, legF, legF_lo,
      armB_up: { parent: 'torso', at: [-8, -98], pts: armR(64, 11, 8.5), base: '#000', seed: 7611, paint: (p) => { const T = EN[enT(p)]; fillPts(rect(-20, -20, 20, 80), enT(p) === 'b' ? T.hautD : T.hautD); hatch(null, 0.9, 3.6, 0.3); fillPts(rect(-20, -20, 20, 80), 'rgba(20,14,10,0.12)'); } },
      armB_lo: foreDef('armB_up', true, 7612, { base: '#000', skin: EN.peauD, k: 0.68, LA: 64 }),
      head: { parent: 'torso', at: [4, -114], pts: EN_HEAD, base: EN.peau, seed: 7613, noRivet: true, paint: (p) => {
        const f = p.face || {}, k = enT(p), T = EN[k];
        X.earPaint(-10, -40);
        if (k === 'a') fillPts([[24, -64], [16, -80], [-4, -88], [-24, -82], [-34, -60], [-34, -36], [-24, -40], [-22, -60], [-8, -72], [12, -72]], T.chev, 1, 0.3);
        if (k === 'b') fillPts([[24, -66], [10, -82], [-14, -86], [-30, -74], [-34, -52], [-26, -48], [-20, -64], [0, -72]], T.chev, 1, 0.3);
        if (k === 'c') fillPts([[-6, -70], [-26, -66], [-34, -46], [-26, -38], [-18, -54]], T.chev, 1, 0.3);
        if (k === 'd') fillPts([[26, -52], [26, -66], [16, -82], [-6, -90], [-28, -80], [-36, -56], [-36, -24], [-24, -22], [-24, -48], [-8, -60], [10, -58]], T.chev, 1, 0.3);
        dot(18, -26, 7, 'rgba(220,120,110,0.32)');
        X.eye(f, 14, -46, 1.12); X.brow(f, 14, -54, k === 'a' ? 'rgba(170,130,60,0.9)' : 'rgba(70,44,28,0.9)', 2);
        if (f.mouth === 'o') fillPts(ell(22, -20, 3.4, 4, 8), '#3a1714', 0, 0); else X.mouth(Object.assign({ mouth: 'smile' }, f), 23, -20);
      } },
      coiffe: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 7614, pts: (p) => {
        const k = enT(p);
        if (k === 'b') return [[26, -64], [22, -78], [12, -90], [-4, -96], [-20, -92], [-32, -80], [-36, -62], [-28, -64], [-20, -76], [0, -80], [16, -74]];
        if (k === 'c') return [[46, -66], [44, -60, 1], [20, -64], [-6, -66], [-28, -64], [-34, -72], [-28, -86], [-10, -96], [10, -94], [22, -84], [26, -72]];
        if (k === 'd') return [[28, -58], [26, -72], [16, -86], [-6, -94], [-26, -88], [-36, -72], [-24, -70], [-8, -76], [10, -72], [20, -60]];
        return [[24, -66], [18, -82], [0, -92], [-20, -90], [-34, -74], [-36, -60], [-26, -66], [-10, -80], [8, -80]];
      }, paint: (p) => {
        const k = enT(p), T = EN[k];
        fillPts(rect(-60, -110, 60, -40), k === 'c' ? T.casq : T.chev);
        if (k === 'b') for (let x = -32; x < 24; x += 3.4) strokePts([[x, -96], [x + 1, -76]], 'rgba(80,30,10,0.55)', 1);
        if (k === 'c') { strokePts([[22, -64], [44, -62]], 'rgba(30,20,10,0.6)', 1.4); dot(-6, -96, 3, '#5a4630'); strokePts([[-26, -80], [16, -86]], 'rgba(255,240,210,0.3)', 1.4); }
        if (k === 'a' || k === 'd') strokePts(qbez([20, -78], [0, -94], [-24, -86], 8), 'rgba(255,240,200,0.4)', 1.6);
      } },
      natte: { parent: 'head', at: [-28, -48], noRivet: true, base: EN.a.chev, seed: 7615, pts: (p) => (enT(p) === 'a' ? [[-6, -6], [6, -4], [6, 14], [3, 28], [5, 42], [2, 54], [-6, 54], [-7, 42], [-8, 28], [-6, 14]] : OFFP), paint: () => {
        for (let y = 2; y < 50; y += 8) strokePts([[-6, y], [5, y + 4]], 'rgba(120,90,30,0.6)', 1.2); fillPts(rect(-9, 40, 8, 46), C.rouge);
      } },
      armF_up: { parent: 'torso', at: [-2, -98], pts: armR(64, 11, 8.5), base: '#000', seed: 7616, paint: (p) => { const T = EN[enT(p)]; fillPts(rect(-20, -20, 20, 80), T.haut);
        if (enT(p) === 'a') { for (let x = -16; x < 16; x += 8) fillPts(rect(x, -20, x + 4, 80), 'rgba(240,230,215,0.38)'); for (let y = -16; y < 80; y += 8) fillPts(rect(-20, y, 20, y + 4), 'rgba(240,230,215,0.38)'); }
        hatch([[-12, -14], [-2, -14], [-2, 66], [-12, 66]], 0.9, 3.6, 0.22); } },
      armF_lo: foreDef('armF_up', false, 7617, { base: '#000', skin: EN.peau, k: 0.68, LA: 64 }),
    };
    for (const [nm, back] of [['armF_lo', false], ['armB_lo', true]]) { const pt = parts[nm], old = pt.paint; pt.paint = (p) => { const T = EN[enT(p)], short = enT(p) === 'a' || enT(p) === 'b';
      fillPts(rect(-20, -20, 20, 60), short ? (back ? EN.peauD : EN.peau) : (back ? T.hautD : T.haut)); if (enT(p) === 'b') fillPts(rect(-20, -20, 20, 10), back ? T.hautD : T.haut); old(p); }; }
    return defOf('enfant', parts, G_ENF, EN.peau, EN.peauD, 7640,
      ['armB_up', 'armB_lo', 'legB', 'legB_lo', 'legF', 'legF_lo', 'natte', 'head', 'coiffe', 'torso'].concat(TAIL), EN_HIP);
  }
  CH.ronEnfant = mkEnfant();
  RON.enfant = wrap('ronEnfant', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t) + (q.tenue ? q.tenue.charCodeAt(0) * 0.7 : 0);
    expr(q, q.expr);
    const as = ease(clamp(q.assis || 0)), jo = ease(clamp(q.joie || 0)), ti = ease(clamp(q.tire || 0)), mo = ease(clamp(q.montre || 0));
    if (as > 0) {                                      // assis sur un banc dont le siège est à EN_ASSIS unités au-dessus des pieds (RON.STUDIO.banc.siege)
      blend(q, 'legF', -1.5, as); blend(q, 'legB', -1.42, as); blend(q, 'legF_lo', 1.5, as); blend(q, 'legB_lo', 1.42, as);
      q.dy = (q.dy || 0) + (-EN_HIP - EN_ASSIS) * as; q.dx = (q.dx || 0) - 40 * as;
      if (!(jo > 0) && !(mo > 0)) { armTo(q, 'armF', [46, -10], as); armTo(q, 'armB', [36, -8], as); q.handF = 'open'; q.handB = 'open'; }
    }
    if (jo > 0) { blend(q, 'armF_up', -2.35, jo); blend(q, 'armF_lo', -0.2, jo); blend(q, 'armB_up', -2.8, jo); blend(q, 'armB_lo', -0.15, jo); q.handF = 'open'; q.handB = 'open';
      A.head = (A.head || 0) - 0.18 * jo; if (!f.mouth) f.mouth = 'o'; if (!f.eyes) f.eyes = 'wide';
      if (!(as > 0.5)) { const h = Math.abs(Math.sin(g * 5.5)); q.dy = (q.dy || 0) - 26 * h * jo; blend(q, 'legF_lo', 0.5 * h, jo); blend(q, 'legB_lo', 0.4 * h, jo); blend(q, 'legF', -0.3 * h, jo); } }
    if (ti > 0) { const T = q.cible ? loc(q.cible) : [70, -120], tug = 6 * Math.abs(Math.sin(g * 8)); armTo(q, 'armF', vers(q._G.SHF, [T[0] - tug, T[1]], 124), ti); q.handF = 'fist';
      q.tilt = (q.tilt || 0) - 0.07 * ti; A.head = (A.head || 0) - 0.2 * ti; if (!f.brow) f.brow = 'up'; }
    if (mo > 0) { armTo(q, 'armF', [112, -112], mo); q.handF = 'open'; A.head = (A.head || 0) - 0.08 * mo; if (!f.mouth) f.mouth = 'o'; if (!f.brow) f.brow = 'up'; }
    if (q.respire !== false && !(jo > 0)) q.dy = (q.dy || 0) + 1.2 * Math.sin(g * 2.3);
  }, 0.82);

  // =====================================================================
  // 6b) PARENTS 1960 — 'pere' (feutre gris, imperméable mastic) / 'mere' (manteau prune, petit chapeau rond ivoire, cheveux bruns bouffants)
  // =====================================================================
  const PR = { peau: '#e2b896', peauD: '#c49a78',
    pere: { manteau: '#b4a684', manteauD: '#958866', manteauL: '#c8bc9c', pant: '#5e5a54', pantD: '#4a4642', soulier: '#2a1e18', chev: '#4a3424', chap: '#77797c', chapD: '#5e6064', ruban: '#2a2a2e' },
    mere: { manteau: '#6e3a5a', manteauD: '#552c46', manteauL: '#86506e', pant: PR_PEAU(), pantD: '#c49a78', soulier: '#3a1a22', chev: '#4a3020', chap: '#e8dfca', chapD: '#cfc4ac', ruban: '#6e3a5a' } };
  function PR_PEAU() { return '#e2b896'; }
  const prT = (p) => (p.tenue === 'mere' ? 'mere' : 'pere');
  const PR_COAT = [[-16, -178], [8, -182], [18, -170], [30, -150], [36, -116], [38, -60], [40, 0], [44, 60], [47, 112, 1], [-44, 114, 1], [-42, 60], [-40, 0], [-40, -60], [-40, -112], [-36, -150], [-28, -168]];
  function mkParent() {
    const recol = (back, key) => (p) => { const T = PR[prT(p)]; return back ? T[key + 'D'] : T[key]; };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PR_COAT, base: '#000', seed: 7701, paint: (p) => {
        const k = prT(p), T = PR[k];
        fillPts(rect(-60, -200, 60, 130), T.manteau);
        if (k === 'pere') { fillPts([[8, -182], [22, -168], [36, -132], [22, -120], [14, -150]], T.manteauL); strokePts([[-40, -40], [38, -44]], T.manteauD, 5);           // revers + ceinture
          fillPts(rect(20, -48, 30, -36), '#8a7a52'); for (const y of [-110, -80, 10, 50]) { dot(30, y, 2.6, '#4a3e2a'); dot(16, y, 2.6, '#4a3e2a'); }
          fillPts([[8, -182], [16, -174], [10, -166]], '#ece6d8'); fillPts([[14, -174], [18, -172], [17, -146], [13, -146]], '#3a3a44'); }
        else { fillPts([[6, -182], [20, -168], [26, -150], [14, -156], [4, -170]], T.manteauL); for (const y of [-120, -86, -52, -18]) { dot(30, y, 3.4, '#2a1420'); dot(29.4, y - 0.8, 1.2, '#b88aa0'); }
          strokePts([[40, 0], [44, 60], [47, 110]], T.manteauD, 1.4); for (let i = 0; i < 3; i++) strokePts([[-20 + i * 18, 10], [-24 + i * 20, 112]], 'rgba(30,10,20,0.3)', 1.2); }
        hatch([[-46, -170], [-14, -170], [-14, 116], [-46, 116]], 0.75, 4.2, 0.24); shade(40, 0, -40, 0, 0.24, [-50, -190, 50, 120]);
      } },
      legB: Object.assign(legDef([-6, -2], '#000', '#000', 7702, true, 0.9), {}),
      legF: Object.assign(legDef([6, -2], '#000', '#000', 7703, false, 0.9), {}),
      armB_up: upDef([-10, -146], '#000', 7704, null, 14, 96, true),
      armB_lo: foreDef('armB_up', true, 7705, { base: '#000', skin: PR.peauD }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: PR.peau, seed: 7706, noRivet: true, paint: (p) => {
        const f = p.face || {}, k = prT(p), T = PR[k];
        if (k === 'mere') fillPts([[30, -62], [28, -80], [14, -94], [-8, -98], [-28, -90], [-40, -70], [-42, -40], [-34, -22], [-22, -26], [-20, -50], [-8, -66], [14, -70]], T.chev, 2, 0.3);
        else fillPts([[-6, -72], [-26, -70], [-33, -50], [-26, -36], [-20, -52]], T.chev, 1, 0.3);
        X.earPaint(-9, -44);
        hatch([[-26, -40], [0, -24], [10, -6], [-8, 16], [-34, 2]], 0.6, 3.6, 0.24);
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(60,40,28,0.9)', k === 'mere' ? 1.8 : 2.6);
        if (k === 'mere') { strokePts([[12, -56], [8, -60]], 'rgba(30,18,14,0.8)', 1.2); X.mouth(f, 27, -26, 'rgba(160,40,50,0.98)'); dot(16, -30, 6, 'rgba(220,120,120,0.3)'); }
        else X.mouth(f, 27, -26);
      } },
      chapeau: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 7707, pts: (p) => (prT(p) === 'pere'
        ? [[48, -78], [44, -72, 1], [20, -76], [-10, -78], [-38, -74], [-46, -80, 1], [-34, -86], [-30, -110], [-18, -122], [0, -118], [18, -124], [26, -106], [28, -86]]
        : [[18, -96], [16, -112], [4, -120], [-14, -120], [-26, -112], [-28, -96]]), paint: (p) => {
        const T = PR[prT(p)];
        fillPts(rect(-60, -140, 60, -60), T.chap);
        if (prT(p) === 'pere') { fillPts([[-32, -86], [28, -86], [28, -94], [-32, -94]], T.ruban); strokePts([[-6, -118], [-2, -100]], T.chapD, 1.6); strokePts([[46, -76], [-40, -78]], 'rgba(255,255,255,0.25)', 1.2); }
        else { fillPts(rect(-28, -100, 18, -96), T.ruban); strokePts([[14, -114], [-20, -116]], 'rgba(255,255,255,0.5)', 1.4); }
        hatch(null, 0.7, 3.4, 0.2);
      } },
      armF_up: upDef([-2, -146], '#000', 7708, null, 14, 96, false),
      armF_lo: foreDef('armF_up', false, 7709, { base: '#000', skin: PR.peau }),
    };
    for (const [nm, back] of [['armF_up', false], ['armB_up', true], ['armF_lo', false], ['armB_lo', true]]) { const pt = parts[nm], old = pt.paint; pt.paint = (p) => { fillPts(rect(-40, -40, 40, 140), recol(back, 'manteau')(p)); old(p); }; }
    for (const [nm, back] of [['legF', false], ['legB', true]]) { const pt = parts[nm], old = pt.paint; pt.paint = (p) => { const T = PR[prT(p)];
      fillPts(rect(-60, -40, 60, 300), back ? T.pantD : T.pant); old(p); fillPts(rect(-40, 214, 60, 300), T.soulier);
      if (prT(p) === 'mere') { fillPts([[-17, 237], [-6, 237], [-8, 250], [-14, 250]], T.soulier); } }; }
    return defOf('parent', parts, G_ADULTE, PR.peau, PR.peauD, 7730, ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'chapeau', 'torso'].concat(TAIL));
  }
  CH.ronParent = mkParent();
  RON.parent = wrap('ronParent', function (q, loc) {
    const A = q.ang, f = q.face, g = M.tg(q.t || 0);
    expr(q, q.expr);
    const pa = ease(clamp(q.paie || 0)), po = ease(clamp(q.porte || 0));
    if (pa > 0) { if (q.tenu == null) q.tenu = 'pieces'; plier(q, 0.04 * pa); const T = q.cible ? loc(q.cible) : [156, -128]; armTo(q, 'armF', vers(q._G.SHF, T, 188), pa); if (!f.mouth) f.mouth = 'smile'; }
    if (po > 0) { const k = q.tenu == null && pa === 0 ? 'tenu' : 'tenuB'; if (k === 'tenu') { q.tenu = 'sac'; armTo(q, 'armF', [34, -6], po); } else { if (q.tenuB == null) q.tenuB = 'sac'; armTo(q, 'armB', [22, -4], po); } }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.1 * Math.sin(g * 1.8 + (q.tenue === 'mere' ? 2 : 0));
  }, 0.86);

  // =====================================================================
  // 6c) LE CAMÉRAMAN — casque d'écoute, chemise à carreaux brun, pantalon anthracite ; derrière sa caméra de télévision 1960
  //     (pose.camera !== false : la caméra est dessinée d'elle-même à RON.CAMERA.ecart·s devant lui, mains sur les poignées avec filme)
  // =====================================================================
  const CA = { peau: '#dfb48e', peauD: '#c09474', chem: '#8a5a36', chemD: '#6e4628', carreau: 'rgba(230,200,150,0.35)', carreauF: 'rgba(40,20,10,0.35)', pant: '#3c3e44', pantD: '#2e3034', soulier: '#1e1814', chev: '#a88a5a', casque: '#2a2a2e' };
  const CA_TORSO = [[-16, -178], [8, -182], [18, -170], [30, -150], [38, -116], [42, -70], [40, -30], [36, 0], [32, 22, 1], [-38, 24, 1], [-40, 0], [-42, -60], [-42, -112], [-38, -150], [-28, -168]];
  const carreaux = (back) => { for (let x = -60; x < 60; x += 14) fillPts(rect(x, -200, x + 6, 160), back ? 'rgba(200,170,120,0.25)' : CA.carreau); for (let y = -200; y < 160; y += 14) fillPts(rect(-60, y, 60, y + 5), CA.carreauF); };
  function mkCameraman() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CA_TORSO, base: CA.chem, seed: 7801, paint: () => {
        carreaux(false); strokePts([[18, -170], [30, -120], [36, -60], [34, 0]], 'rgba(30,14,6,0.5)', 1.4);
        for (const y of [-140, -104, -68, -32]) dot(30, y, 2.2, '#e6d8b8'); fillPts([[8, -182], [20, -168], [10, -162]], '#6e4628');
        fillPts(rect(-44, 10, 40, 24), CA.pant); fillPts(rect(16, 12, 26, 22), '#8a8e92');
        hatch([[-48, -170], [-16, -170], [-16, 24], [-48, 24]], 0.75, 4.2, 0.26); shade(40, -40, -42, -40, 0.24, [-48, -190, 46, 30]);
      } },
      legB: legDef([-6, -2], CA.pantD, CA.soulier, 7802, true, 0.98),
      legF: legDef([6, -2], CA.pant, CA.soulier, 7803, false, 0.98),
      armB_up: upDef([-10, -146], CA.chemD, 7804, (b) => carreaux(b), 15, 96, true),
      armB_lo: foreDef('armB_up', true, 7805, { base: CA.chemD, skin: CA.peauD, deco: (b) => carreaux(b) }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: CA.peau, seed: 7806, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[28, -70], [24, -84], [10, -94], [-10, -98], [-28, -88], [-34, -66], [-32, -44], [-24, -42], [-22, -60], [-6, -72], [14, -74]], CA.chev, 2, 0.3);
        hatch([[-26, -40], [0, -24], [10, -6], [-8, 16], [-34, 2]], 0.6, 3.6, 0.26);
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(120,90,50,0.95)', 2.4); X.mouth(f, 27, -26);
        strokePts([[20, -12], [10, -4]], 'rgba(140,90,60,0.35)', 1.2);
      } },
      casque: { parent: 'head', at: [0, 0], noRivet: true, base: CA.casque, seed: 7807, pts: ell(-9, -44, 15, 18, 16), paint: () => {
        fillPts(ell(-9, -44, 9, 11, 12), '#4a4a50'); strokePts(ep(-9, -44, 13, 16, 12, PI * 1.1, PI * 1.5), 'rgba(255,255,255,0.3)', 1.4);
      }, extra: () => { strokePts(ep(-6, -60, 30, 42, 14, PI * 1.05, PI * 1.92), CA.casque, 5); strokePts(qbez([-14, -30], [-4, 4], [26, -6], 8), '#2a2a2e', 1.6); } },
      armF_up: upDef([-2, -146], CA.chem, 7808, (b) => carreaux(b), 15, 96, false),
      armF_lo: foreDef('armF_up', false, 7809, { base: CA.chem, skin: CA.peau, deco: (b) => carreaux(b) }),
    };
    return defOf('cameraman', parts, G_ADULTE, CA.peau, CA.peauD, 7830, ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'casque', 'torso'].concat(TAIL));
  }
  CH.ronCameraman = mkCameraman();
  const CAMERA = { ecart: 205, poignee: [-158, -262], poignee2: [-150, -284], viseur: [-56, -410], lampe: [40, -406], objectif: [140, -352] };
  RON.CAMERA = CAMERA;
  const camW = wrap('ronCameraman', function (q, loc, W) {
    const A = q.ang, f = q.face, g = M.tg(q.t || 0);
    expr(q, q.expr);
    const fi = ease(clamp(q.filme == null ? (q.camera === false ? 0 : 1) : q.filme)), si = ease(clamp(q.signe || 0));
    if (fi > 0) {                                      // mains sur les deux poignées de la caméra (repères RON.CAMERA, caméra à ecart·s devant lui)
      plier(q, 0.07 * fi);
      const sc = (P) => loc([W.x + (CAMERA.ecart + P[0]) * W.s * W.dir, W.y + P[1] * W.s]);
      armTo(q, 'armF', sc(CAMERA.poignee), fi); if (!(si > 0)) armTo(q, 'armB', sc(CAMERA.poignee2), fi); else armTo(q, 'armB', sc(CAMERA.poignee), fi);
      A.head = (A.head || 0) + 0.06 * fi;
    }
    if (si > 0) { armTo(q, 'armF', [96, -296], si); q.handF = 'open'; A.head = (A.head || 0) - 0.06 * si; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'smile'; }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.1 * Math.sin(g * 1.6 + 3);
  }, 0.86);
  RON.cameraman = function (pose, x, y, s, o) {
    pose = pose || {}; o = o || {}; s = s == null ? 0.86 : s; const d = o.dir || 1;
    if (pose.camera !== false) RON.cameraTV(x + CAMERA.ecart * s * d, y, s, { dir: d, lampe: pose.lampe, t: pose.t, cast: o.cast, ombre: true });
    return camW(pose, x, y, s, o);
  };
  RON.cameraman.pose = camW.pose;

  // =====================================================================
  // 7) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  // ---- caméra de télévision 1960 sur pied à roulettes (≈ 306 × 432), repère = sol sous la colonne ; objectifs vers +x ; o.lampe 0..1 (« en direct »)
  function lens(y, len, r, col, seed) {
    pc(rect(84, y - r, 84 + len, y + r), col, () => { for (let x = 90; x < 84 + len; x += 7) strokePts([[x, y - r], [x, y + r]], 'rgba(255,255,255,0.12)', 1); strokePts([[86, y - r + 3], [82 + len, y - r + 3]], 'rgba(255,255,255,0.25)', 1.2); }, seed);
    pc(ell(84 + len, y, 3.5, r + 1, 12), '#1a1c20', () => strokePts(ep(84 + len, y, 2, r - 3, 10, PI * 1.2, PI * 1.7), 'rgba(170,200,230,0.6)', 1.6), seed + 1, { drop: false });
  }
  function drawCamera(o) {
    const on = clamp(o.lampe || 0), c = cx_();
    strokePts(qbez([-40, -272], [-70, -120], [-170, -4], 12), '#151517', 4.2);                              // câble
    pc(rect(-82, -32, 82, -20), C.metal, () => strokePts([[-80, -29], [80, -29]], 'rgba(255,255,255,0.25)', 1.2), 9901);
    for (const x of [-72, 0, 72]) { fillPts(bar([x, -22], [x, -14], 6), '#2a2c30'); pc(ell(x, -11, 11, 11, 14), '#1c1c1e', () => dot(x, -11, 4, '#6a6e74'), 9902 + x, { drop: false }); }
    pc(rect(-10, -252, 10, -30), C.metalL, () => { strokePts([[-4, -248], [-4, -34]], 'rgba(255,255,255,0.35)', 1.4); fillPts(rect(-14, -150, 14, -138), C.metal); }, 9905);
    pc([[-32, -268], [32, -268], [24, -250], [-24, -250]], C.metal, null, 9906);
    // poignées de panoramique (deux barres qui reviennent vers le caméraman)
    fillPts(bar([-80, -320], [-150, -284], 7), '#55585e'); pc(bar([-142, -288], [-158, -280], 12), '#1c1c1e', null, 9907, { drop: false });
    fillPts(bar([-80, -300], [-158, -262], 8), '#6a6e74'); pc(bar([-148, -267], [-168, -257], 13), '#1c1c1e', null, 9908, { drop: false });
    // corps
    pc([[-86, -390], [-80, -396], [66, -396], [72, -390], [72, -276], [66, -270], [-80, -270], [-86, -276]], '#3c3e44', () => {
      strokePts(rect(-74, -384, 60, -282), 'rgba(255,255,255,0.12)', 1.2, true);
      for (let y = -372; y < -330; y += 8) strokePts([[-62, y], [-10, y]], 'rgba(10,10,12,0.6)', 1.6);                   // ouïes
      fillPts(rect(10, -364, 50, -340), '#2a2c30'); strokePts(rect(10, -364, 50, -340), 'rgba(255,255,255,0.2)', 1, true);
      dot(22, -300, 5, '#2a2c30'); dot(22, -300, 2, '#8a8e92'); dot(42, -300, 5, '#2a2c30'); dot(42, -300, 2, '#8a8e92');
      shade(0, -396, 0, -270, 0.3, [-90, -400, 80, -266]);
    }, 9909);
    pc([[-96, -428], [-24, -428], [-20, -396], [-86, -396], [-96, -404]], '#2c2e34', () => { fillPts(rect(-96, -424, -88, -404), '#141416'); strokePts([[-90, -424], [-26, -424]], 'rgba(255,255,255,0.2)', 1.2); }, 9910);
    pc(rect(72, -384, 86, -282), '#26282c', () => dot(79, -333, 4, '#8a8e92'), 9911);                    // tourelle
    lens(-358, 30, 10, '#2a2c30', 9912); lens(-308, 22, 12, '#2a2c30', 9914);
    lens(-352, 58, 14, '#45484e', 9916); lens(-306, 38, 16, '#45484e', 9918);
    pc(rect(30, -402, 50, -396), C.metal, null, 9920, { drop: false });
    fillPts(ell(40, -410, 10, 10, 14), mixA('#4a1a18', '#e8352a', on), 0, 0); dot(37, -413, 3, `rgba(255,220,210,${0.3 + 0.5 * on})`);
    if (on > 0 && !SIL()) { const gl = c.createRadialGradient(40, -410, 4, 40, -410, 70); gl.addColorStop(0, `rgba(255,70,50,${0.5 * on})`); gl.addColorStop(1, 'rgba(255,60,40,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(-30, -480, 140, 140); c.restore(); }
  }
  OBJ.camera = { draw: drawCamera, grip: [0, -262], pts: { poignee: CAMERA.poignee, poignee2: CAMERA.poignee2, viseur: CAMERA.viseur, lampe: CAMERA.lampe, objectif: CAMERA.objectif }, base: [0, 0] };
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name]; o = o || {};
    if (o.ang != null && o.rot == null) o = Object.assign({}, o, { rot: o.ang });
    return M.puppet(accDef('o_' + name, (oo) => { const b = ptOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(Object.assign({ t: oo.t || 0 }, oo)); c.restore(); }),
      { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of ['hamburger', 'sac', 'frites', 'gobelet', 'pieces', 'metre', 'plateau', 'panneau', 'carte']) RON[n] = (x, y, s, o) => acc(n, x, y, s, o);
  RON.cameraTV = (x, y, s, o) => acc('camera', x, y, s == null ? 0.86 : s, o);
  function locPt(px, py, x, y, s, o) { o = o || {}; const d = o.dir || 1, r = o.rot != null ? o.rot : o.ang || 0, X0 = px * s * d, Y0 = py * s; return [x + X0 * Math.cos(r) - Y0 * Math.sin(r) * d, y + X0 * Math.sin(r) * d + Y0 * Math.cos(r)]; }
  RON.accPt = function (name, x, y, s, o, nom) { const ob = OBJ[name], oo = o || {}, b = ptOf(ob.base, oo), q = ob.pts[nom] ? ptOf(ob.pts[nom], oo) : nom === 'prise' ? gripOf(ob, oo) : [0, 0]; return locPt(q[0] - b[0], q[1] - b[1], x, y, s == null ? 1 : s, oo); };
  RON.cameraPt = (x, y, s, o, nom) => RON.accPt('camera', x, y, s == null ? 0.86 : s, o, nom || 'lampe');

  // ---- ventre de Scott et mètre ruban autour : RON.ventrePt(rScott) = point écran le plus en avant du ventre ; RON.ruban(rScott, rDirigeant, o)
  RON.ventrePt = function (r, dy) { const v = scV(r.q || {}), y = -60 + (dy || 0); return r.w('torso', frontAt(v, y) + 2, y); };
  RON.ruban = function (rS, rD, o) {
    o = o || {}; const v = scV(rS.q || {}), y = -60 + (o.dy || 0), c = cx_(), bx = frontAt(v, y);
    const sw = Math.hypot(rS.mats.torso.a, rS.mats.torso.b), w = 9 * sw;
    const band = []; for (let i = 0; i <= 14; i++) { const x = lerp(-60, bx + 1, i / 14); band.push(rS.w('torso', x, y + 4 * Math.sin(PI * i / 14))); }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); rubanLine(band, w);
    if (rD) { const F = rS.w('torso', bx + 1, y - 4), Bk = rS.w('torso', bx + 1, y + 4), hF = rD.w('armF_lo', 4, 96), hB = rD.w('armB_lo', 4, 96);
      rubanLine(qbez(F, [(F[0] + hF[0]) / 2, Math.min(F[1], hF[1]) - 6], hF, 8), w); rubanLine(qbez(Bk, [(Bk[0] + hB[0]) / 2, Math.max(Bk[1], hB[1]) + 10], hB, 8), w);
      const end = qbez(hB, [hB[0] + 6, hB[1] + 30], [hB[0] - 4, hB[1] + 62], 8); rubanLine(end, w); }
    c.restore();
  };

  // ---- comptoir de restaurant 1960 (ivoire et rouge, plateau d'hamburgers, caisse enregistreuse sans chiffre), monte de la trappe
  const COMPTOIR = { x: 720, w: 360, h: 360, dessus: 256, caisse: -110, plateau: 60, gobelets: 140 };
  RON.COMPTOIR = COMPTOIR;
  function makeComptoir() {
    const cv = M.cutFlat(420, 400, 210, 390, () => {
      // corps
      pc([[-170, -240, 1], [170, -240, 1], [170, 0, 1], [-170, 0, 1]], C.ivoire, () => {
        fillPts(rect(-170, -170, 170, -132), C.rouge); fillPts(rect(-170, -128, 170, -122), C.rougeD);
        for (let x = -150; x < 170; x += 40) strokePts([[x, -232], [x, -178]], 'rgba(120,100,70,0.35)', 1.4);
        for (let x = -150; x < 170; x += 40) strokePts([[x, -114], [x, -26]], 'rgba(120,100,70,0.35)', 1.4);
        fillPts(rect(-170, -22, 170, 0), '#9a9ea4'); for (let x = -166; x < 170; x += 10) strokePts([[x, -20], [x, -2]], 'rgba(255,255,255,0.3)', 1);
        for (let x = -130; x <= 130; x += 65) { fillPts(ell(x, -151, 9, 9, 12), C.ivoire); dot(x, -151, 4, C.or); }
        hatch(null, 0.8, 5, 0.12, 1, undefined, [-175, -245, 175, 5]); shade(170, 0, -170, 0, 0.2, [-175, -245, 175, 5]);
      }, 9951);
      pc(rect(-182, -258, 182, -238), C.rouge, () => { strokePts([[-180, -256], [180, -256]], 'rgba(255,220,200,0.45)', 1.4); fillPts(rect(-182, -244, 182, -238), '#b8bcc0'); }, 9952);
      // caisse enregistreuse (touches rondes vierges, fenêtre à fanions blancs, tiroir)
      const K = COMPTOIR.caisse;
      pc([[K - 50, -258], [K + 50, -258], [K + 44, -318], [K + 30, -330], [K - 30, -330], [K - 44, -318]], '#8c8268', () => {
        for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const x = K - 34 + i * 13.5, y = -306 + r * 13; fillPts(ell(x, y, 5, 4.4, 10), '#2a2622'); dot(x - 1, y - 1.4, 1.6, '#efe6d2'); }
        fillPts(rect(K - 50, -272, K + 50, -258), '#6e6650'); dot(K, -265, 3, C.or);
        strokePts([[K - 40, -322], [K + 40, -322]], 'rgba(255,240,200,0.4)', 1.4); shade(K + 40, 0, K - 40, 0, 0.25, [K - 55, -335, K + 55, -255]);
      }, 9953);
      pc(rect(K - 26, -362, K + 26, -330), '#6e6650', () => { fillPts(rect(K - 20, -356, K + 20, -336), '#1e1c1a'); for (const x of [-12, 0, 12]) fillPts(rect(K + x - 4, -354, K + x + 4, -344), '#f1ece0'); }, 9954);
      pc(bar([K + 50, -300], [K + 70, -318], 5), '#6e6650', null, 9955); pc(ell(K + 72, -320, 6, 6, 10), '#2a2622', null, 9956, { drop: false });
      // bouteilles de ketchup et de moutarde, distributeur de serviettes
      pc([[-30, -258], [-18, -258], [-18, -300], [-22, -314], [-26, -314], [-30, -300]], C.rouge, () => strokePts([[-27, -300], [-27, -264]], 'rgba(255,200,190,0.4)', 1.4), 9957);
      pc([[-10, -258], [2, -258], [2, -296], [-2, -310], [-6, -310], [-10, -296]], '#c9a23a', () => strokePts([[-7, -296], [-7, -264]], 'rgba(255,250,210,0.5)', 1.4), 9958);
      pc(rect(14, -296, 34, -258), '#b8bcc0', () => { fillPts(rect(17, -294, 31, -278), '#f4f0e6'); }, 9959);
      // plateau d'hamburgers
      const Px = COMPTOIR.plateau, c = cx_();
      for (const [dx, dy] of [[-30, 0], [26, 0], [-2, -30]]) { c.save(); c.translate(Px + dx, -266 + dy - 20 * 0.72); c.scale(0.72, 0.72); drawHamburger({}); c.restore(); }
      pc(rect(Px - 64, -268, Px + 64, -258), '#8a5a34', () => strokePts([[Px - 62, -266], [Px + 62, -266]], 'rgba(255,220,180,0.4)', 1.2), 9960);
      // pile de gobelets rayés
      const Gx = COMPTOIR.gobelets;
      for (let i = 0; i < 4; i++) { c.save(); c.translate(Gx, -258 - 24 - i * 9); drawGobelet(); c.restore(); }
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  // RON.comptoir(t, monte, o) : monte 0 (caché sous la trappe) → 1 (sorti) ; o.x (défaut RON.COMPTOIR.x), o.cast. À dessiner APRÈS le plancher et
  //   après le restaurateur de la fente arrière (il passe derrière), avant les marionnettes de la fente avant.
  RON.comptoir = function (t, monte, o) {
    o = o || {}; const k = clamp(monte == null ? 1 : monte), x = o.x == null ? COMPTOIR.x : o.x, sc = o.s || 1, y = BACK + (1 - k) * (COMPTOIR.h + 12) * sc;
    if (k <= 0) return;
    M.flat(RON.K.comptoir, x, y, { clipY: BACK + 1, cast: o.cast, scale: sc });
    if (k > 0.98) M.fumee(t, { x: x + COMPTOIR.plateau * sc, y: y - 300 * sc, s: 0.25 * sc, n: 4, haut: 120 * sc, vent: 10, col: '#efe8dc', a: 0.4, seed: 61 });
  };
  // RON.comptoirPt(nom, monte, o) : 'dessus' (milieu du dessus), 'caisse', 'plateau', 'devant' (bord côté x−), 'derriere' (bord côté x+) ; mêmes o.x, o.s
  RON.comptoirPt = (nom, monte, o) => { o = o || {}; const x = o.x == null ? COMPTOIR.x : o.x, sc = o.s || 1, y = BACK + (1 - clamp(monte == null ? 1 : monte)) * (COMPTOIR.h + 12) * sc;
    const L = { dessus: [0, -COMPTOIR.dessus], caisse: [COMPTOIR.caisse, -COMPTOIR.dessus - 40], plateau: [COMPTOIR.plateau, -COMPTOIR.dessus - 20], devant: [-170, -COMPTOIR.dessus], derriere: [170, -COMPTOIR.dessus] }[nom] || [0, -COMPTOIR.dessus];
    return [x + L[0] * sc, y + L[1] * sc]; };

  // =====================================================================
  // 8) DÉCOR — studio de télévision WRC, Washington, années 60. RON.studio(t, up, o) AVANT M.drawFloor(), RON.studioSol(t, up, o) juste APRÈS.
  // =====================================================================
  const W = M.W;
  const STU = { passerelle: 268, projos: [{ x: 196, a: 0.32 }, { x: 420, a: 0.12 }, { x: 664, a: -0.1 }, { x: 884, a: -0.3 }], projoY: 318,
    regie: { x0: 640, x1: 930, y0: 380, y1: 590 }, horloge: { x: 452, y: 452, r: 56 }, antenne: { x: 236, y: 812 }, porte: { x0: 146, x1: 326, y0: 862 },
    cirque: { x0: 302, x1: 802, cx: 552, pic: 560, bas: BACK }, podium: { x: 552, w: 250, h: 74 }, banc: { x0: 600, x1: 944, siege: BACK - 81 },
    moniteur: { x: 888, y: 960 }, perche: { x: 104, micro: [468, 742] }, trappe: 720, camera: 200, pupitre: { x0: 52, x1: 236 }, ventilo: { x: 984, y: 1070 },
    caisses: 880, cable: 790 };
  RON.STUDIO = STU;
  function makeStRegie() {
    return M.pre(W, BACK + 40, (c) => {
      const R = STU.regie;
      const g = c.createLinearGradient(0, R.y0, 0, R.y1); g.addColorStop(0, '#1e2622'); g.addColorStop(1, '#141a17'); c.fillStyle = g; c.fillRect(R.x0 - 30, R.y0 - 30, R.x1 - R.x0 + 60, R.y1 - R.y0 + 60);
      for (const [x, w] of [[660, 80], [756, 64], [836, 80]]) { fillPts(rect(x, 410, x + w, 470), '#26302c', x, 0.3); fillPts(rect(x + 8, 418, x + w - 8, 462), '#3a4a44', x + 1, 0.2); }   // moniteurs de régie
      fillPts([[R.x0, 540], [R.x1, 532], [R.x1, R.y1 + 10], [R.x0, R.y1 + 10]], '#2c2a24', 3, 0.5);                                         // pupitre de régie
      for (let i = 0; i < 12; i++) dot(656 + i * 23, 552, 3.4, '#4a463a');
    });
  }
  function panneaux(x0, y0, x1, y1, PW, PH) {     // bandes verticales capitonnées (boutons en quinconce, plis en losange)
    for (let x = x0, k = 0; x < x1; x += PW, k++) {
      pc(rect(x + 2, y0, x + PW - 2, y1), k % 2 ? C.mur : '#56645a', () => {
        for (let y = y0 + (k % 2 ? PH / 2 : 0), j = 0; y < y1 + PH; y += PH, j++) {
          const cx = x + PW / 2; dot(cx, y, 3.2, '#2e3830'); dot(cx - 0.8, y - 0.8, 1.2, 'rgba(220,235,220,0.35)');
          strokePts([[cx, y], [x + 4, y + PH / 2], [cx, y + PH]], 'rgba(20,26,22,0.3)', 1.2); strokePts([[cx, y], [x + PW - 4, y + PH / 2], [cx, y + PH]], 'rgba(20,26,22,0.3)', 1.2);
          fillPts([[cx, y + 6], [x + PW - 8, y + PH / 2], [cx, y + PH - 6], [x + 8, y + PH / 2]], 'rgba(220,235,220,0.06)', 0, 0);
        }
        shade(x + PW, 0, x, 0, 0.35, [x, y0, x + PW, y1]); strokePts([[x + 5, y0], [x + 5, y1]], 'rgba(220,235,220,0.14)', 1.6);
      }, 1000 + x * 7, { drop: false });
    }
  }
  function makeStFond() {
    return M.pre(W, BACK + 40, (c) => {
      const B = BACK, R = STU.regie, Pt = STU.porte, H = STU.horloge, L = STU.antenne;
      c.fillStyle = '#3c463e'; c.fillRect(0, 0, W, B + 40);
      panneaux(0, 300, W, 1230, 68, 104);
      pc(rect(-10, 1230, W + 10, B + 30), '#3a4038', () => { for (let x = 0; x < W; x += 60) strokePts([[x, 1240], [x, B]], 'rgba(10,14,10,0.35)', 1.4); strokePts([[0, 1236], [W, 1236]], 'rgba(200,220,200,0.3)', 2); }, 8001, { drop: false });   // plinthe
      const sh = c.createLinearGradient(0, 150, 0, B); sh.addColorStop(0, 'rgba(10,14,12,0.6)'); sh.addColorStop(0.3, 'rgba(10,14,12,0.05)'); sh.addColorStop(1, 'rgba(10,14,12,0.3)'); c.fillStyle = sh; c.fillRect(0, 150, W, B - 150);
      // passerelle d'éclairage (treillis)
      pc(rect(-10, STU.passerelle - 26, W + 10, STU.passerelle - 18), '#2a2c30', null, 8002); pc(rect(-10, STU.passerelle + 6, W + 10, STU.passerelle + 14), '#2a2c30', null, 8003);
      for (let x = 0; x < W; x += 36) { fillPts(bar([x, STU.passerelle - 20], [x + 36, STU.passerelle + 8], 3), '#3a3c42'); fillPts(bar([x + 36, STU.passerelle - 20], [x, STU.passerelle + 8], 3), '#34363c'); }
      for (let x = 30; x < W; x += 170) strokePts([[x, 150], [x, STU.passerelle - 24]], 'rgba(20,20,22,0.8)', 2);
      // chemin de câbles et caisson de ventilation au mur
      pc(rect(-10, 336, W + 10, 352), '#4a4e52', () => { for (let x = 0; x < W; x += 24) strokePts([[x, 338], [x + 12, 350]], 'rgba(0,0,0,0.3)', 1); }, 8004);
      pc(rect(500, 860, 620, 950), '#4e5650', () => { for (let y = 870; y < 944; y += 9) strokePts([[508, y], [612, y]], 'rgba(20,24,20,0.6)', 2.4); }, 8005);
      // baie de la régie (trou) + cadre
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0); c.restore();
      for (const [x0, y0, x1, y1] of [[R.x0 - 22, R.y0 - 22, R.x1 + 22, R.y0], [R.x0 - 22, R.y1, R.x1 + 22, R.y1 + 30], [R.x0 - 22, R.y0, R.x0, R.y1], [R.x1, R.y0, R.x1 + 22, R.y1]]) pc(rect(x0, y0, x1, y1), '#2e3430', () => strokePts([[x0 + 3, y0 + 3], [x1 - 3, y0 + 3]], 'rgba(220,235,220,0.25)', 1.2), 8006 + x0, { drop: y1 >= R.y1 });
      pc(rect((R.x0 + R.x1) / 2 - 4, R.y0, (R.x0 + R.x1) / 2 + 4, R.y1), '#2e3430', null, 8010, { drop: false });
      // porte du studio (encadrement ; le battant est dessiné en direct) + boîtier de la lampe « à l'antenne »
      pc(rect(Pt.x0 - 16, Pt.y0 - 16, Pt.x1 + 16, B + 6), '#2e3430', () => strokePts([[Pt.x0 - 12, Pt.y0 - 12], [Pt.x1 + 12, Pt.y0 - 12]], 'rgba(220,235,220,0.25)', 1.4), 8011);
      c.fillStyle = '#121614'; c.fillRect(Pt.x0, Pt.y0, Pt.x1 - Pt.x0, B - Pt.y0);
      pc(rect(L.x - 46, L.y - 34, L.x + 46, L.y + 34), '#24282a', () => { strokePts(rect(L.x - 40, L.y - 28, L.x + 40, L.y + 28), 'rgba(200,210,200,0.3)', 1.2, true); for (const x of [-36, 36]) dot(L.x + x, L.y, 2.6, '#8a8e92'); }, 8012);
      pc(ell(L.x, L.y, 27, 27, 20), '#8a8e92', null, 8013);
      // horloge de studio (cadran à traits, aucun chiffre)
      pc(ell(H.x, H.y, H.r + 10, H.r + 10, 28), '#2a2c30', () => strokePts(ep(H.x, H.y, H.r + 6, H.r + 6, 20, PI * 1.1, PI * 1.6), 'rgba(255,255,255,0.3)', 1.6), 8014);
      pc(ell(H.x, H.y, H.r, H.r, 28), '#efeadc', () => { for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, l = i % 5 ? 4 : 10; strokePts([[H.x + Math.cos(a) * (H.r - 4), H.y + Math.sin(a) * (H.r - 4)], [H.x + Math.cos(a) * (H.r - 4 - l), H.y + Math.sin(a) * (H.r - 4 - l)]], '#2a2622', i % 5 ? 1 : 2.4); } }, 8015, { drop: false });
      // lampe verte ronde au-dessus de la régie (sans lettre) + sac de lest au bout d'une corde
      pc(ell(R.x0 - 44, R.y0 + 20, 14, 14, 14), '#2a2c30', null, 8016);
      pc(rect(560, 640, 652, 752), '#6b4a2e', () => { fillPts(ell(606, 690, 32, 32, 18), '#3a2c20'); for (let r = 26; r > 6; r -= 7) strokePts(ep(606, 690, r, r, 16, 0, TAU), 'rgba(200,170,120,0.35)', 1.2); fillPts(rect(572, 730, 640, 742), '#4a3420'); }, 8018);   // haut-parleur
      strokePts([[606, 640], [606, 352]], 'rgba(20,20,22,0.7)', 1.4);
      pc(rect(400, 960, 410, 990), '#8a8e92', null, 8019); for (let i = 0; i < 4; i++) strokePts(ep(405, 1030, 30 - i * 4, 40 - i * 3, 18, 0, TAU), i % 2 ? '#1a1a1c' : '#2c2c30', 4);   // câble enroulé au crochet
      pc([[656, 1130], [684, 1130], [686, 1226], [654, 1226]], '#9b2d2a', () => { fillPts(rect(654, 1150, 686, 1162), '#c9c0aa'); strokePts([[662, 1134], [662, 1222]], 'rgba(255,200,190,0.4)', 1.6); }, 8021);   // extincteur
      pc(rect(662, 1112, 678, 1130), '#2a2c30', null, 8022); strokePts(qbez([678, 1118], [702, 1130], [690, 1190], 8), '#1a1a1c', 3);
      strokePts([[312, STU.passerelle + 10], [312, 690]], '#7a6a4a', 2); pc([[300, 690], [324, 690], [330, 730], [320, 742], [304, 742], [294, 730]], '#7a6a4a', () => hatch(null, 0.8, 3, 0.3), 8017);
    });
  }
  function makeDoor() {
    const Pt = STU.porte, w = Pt.x1 - Pt.x0, h = BACK - Pt.y0;
    return M.cutFlat(w + 20, h + 20, 10, h + 10, () => {
      pc(rect(0, -h, w, 0), '#4c5a52', () => {
        strokePts(rect(18, -h + 20, w - 18, -h / 2 - 10), 'rgba(20,26,22,0.5)', 1.6, true); strokePts(rect(18, -h / 2 + 10, w - 18, -20), 'rgba(20,26,22,0.5)', 1.6, true);
        fillPts(ell(w / 2, -h + 110, 30, 30, 18), '#26302c'); strokePts(ep(w / 2, -h + 110, 30, 30, 18, 0, TAU), '#9a9ea4', 3); strokePts([[w / 2 - 16, -h + 96], [w / 2 - 4, -h + 90]], 'rgba(255,255,255,0.35)', 2);
        fillPts(rect(w - 30, -h / 2 - 8, w - 14, -h / 2 + 8), '#9a9ea4'); fillPts(rect(10, -46, w - 10, -10), '#6e7a72');
        shade(w, 0, 0, 0, 0.3, [0, -h, w, 0]);
      }, 8020);
    });
  }
  function makeStCirque() {                     // décor de l'émission de Bozo : chapiteau rayé (toit, lambrequin, rideaux ouverts sur fond rouge) + podium rond étoilé
    const Q = STU.cirque, hw = (Q.x1 - Q.x0) / 2, H = Q.bas - Q.pic, P = STU.podium;
    const cv = M.cutFlat(hw * 2 + 80, H + 110, hw + 40, H + 80, () => {
      const top = -H, sh = top + 160;
      pc(rect(-hw + 8, sh, hw - 8, 0), '#5a1c22', () => {                                              // fond rouge sombre étoilé
        for (let i = 0; i < 16; i++) { const x = -hw + 30 + hash(i * 3.7) * (2 * hw - 60), y = sh + 40 + hash(i * 9.1) * (H - 240); const st = []; for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, r = k % 2 ? 3 : 7; st.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } fillPts(st, 'rgba(216,184,102,0.7)', 0, 0); }
        shade(0, sh, 0, 0, 0.3, [-hw, sh, hw, 0]);
      }, 8100);
      for (const sd of [-1, 1]) {                                                                        // rideaux rayés relevés par une embrasse
        const pts = [[sd * hw, sh], [sd * hw * 0.12, sh], [sd * hw * 0.34, sh + (0 - sh) * 0.45], [sd * hw * 0.56, sh + (0 - sh) * 0.62], [sd * hw * 0.5, 0, 1], [sd * hw, 0, 1]];
        pc(pts, C.ivoire, () => { for (let x = -hw; x < hw; x += 30) fillPts([[x, sh], [x + 15, sh], [x + 15 + sd * 6, 0], [x + sd * 6, 0]], C.rouge, x, 0.3); shade(sd * hw * 0.2, 0, sd * hw, 0, 0.3, [-hw, sh, hw, 0]); }, 8105 + sd);
        const E = [sd * hw * 0.56, sh + (0 - sh) * 0.62]; strokePts([[sd * hw, E[1] - 10], E], C.or, 4); pc(ell(E[0], E[1], 9, 9, 10), C.orD, null, 8107 + sd, { drop: false });
      }
      pc([[0, top], [hw + 14, sh], [-hw - 14, sh]], C.ivoire, () => {                                   // toit à quartiers rayés
        for (let i = -9; i <= 9; i += 2) fillPts([[0, top], [i * (hw + 14) / 9, sh], [(i + 1) * (hw + 14) / 9, sh]], C.rouge, i, 0.2);
        shade(0, top, 0, sh, 0.25, [-hw - 20, top, hw + 20, sh]);
      }, 8101);
      for (let i = 0; i < 14; i++) { const x = -hw - 14 + i * (2 * hw + 28) / 14, w = (2 * hw + 28) / 14; pc(ep(x + w / 2, sh, w / 2, 20, 8, 0, PI).concat([[x, sh]]), i % 2 ? C.or : C.rouge, null, 8110 + i, { drop: false }); }   // lambrequin festonné
      for (const sd of [-1, 1]) { pc(rect(sd * (hw + 8) - 5, sh - 20, sd * (hw + 8) + 5, 0), C.orD, null, 8125 + sd); pc(ell(sd * (hw + 8), sh - 26, 9, 9, 10), C.or, null, 8127 + sd, { drop: false }); }
      pc(ell(0, top - 8, 12, 12, 12), C.or, null, 8102); strokePts([[0, top - 20], [0, top - 70]], '#4a3a2a', 3);
      fillPts([[0, top - 70], [34, top - 60], [0, top - 50]], C.rouge, 3, 0.3);
      // podium rond étoilé
      const pw = P.w / 2, ph = P.h;
      pc(ep(0, -ph, pw, 18, 16, 0, PI).concat(ep(0, 0, pw, 18, 16, 0, PI).reverse()).concat([[-pw, -ph]]), C.rouge, () => {
        for (let i = 0; i < 5; i++) { const x = -pw + 30 + i * (P.w - 60) / 4, y = -ph / 2 + 8; const st = []; for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, r = k % 2 ? 6 : 14; st.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } fillPts(st, C.or, 0, 0.2); }
        fillPts(rect(-pw, -ph, pw, -ph + 10), C.orD); shade(pw, 0, -pw, 0, 0.35, [-pw, -ph - 20, pw, 20]);
      }, 8103);
      pc(ell(0, -ph, pw, 18, 24), '#c94a3c', () => { strokePts(ep(0, -ph, pw - 10, 12, 20, PI, TAU), 'rgba(255,220,190,0.4)', 1.6); }, 8104);
    });
    cv.padB = 30; return M.withShadow(cv, 8);
  }
  function makeStMilieu() {
    return M.pre(W, BACK + 40, (c) => {
      const B = BACK, Mo = STU.moniteur, Pe = STU.perche;
      // rideau de coulisse gris (droite)
      pc([[938, STU.passerelle + 14], [W + 10, STU.passerelle + 14], [W + 10, B], [930, B], [944, 900], [934, 600]], '#6a6e70', () => {
        for (let x = 944; x < W; x += 20) strokePts([[x, STU.passerelle + 14], [x + 4 * Math.sin(x), 800], [x - 4, B]], 'rgba(20,22,24,0.45)', 3);
        for (let x = 952; x < W; x += 20) strokePts([[x, STU.passerelle + 14], [x + 3, 900], [x - 2, B]], 'rgba(230,235,235,0.16)', 2);
      }, 8201);
      // moniteur sur pied (l'écran est dessiné en direct)
      for (const dx of [-46, 0, 40]) fillPts(bar([Mo.x, B - 120], [Mo.x + dx, B], 6), '#2a2c30');
      pc(rect(Mo.x - 6, Mo.y + 110, Mo.x + 6, B - 110), '#4a4e54', null, 8202);
      pc([[Mo.x - 74, Mo.y], [Mo.x + 74, Mo.y], [Mo.x + 70, Mo.y + 112], [Mo.x - 70, Mo.y + 112]], '#34363c', () => { strokePts([[Mo.x - 70, Mo.y + 4], [Mo.x + 70, Mo.y + 4]], 'rgba(255,255,255,0.2)', 1.2); for (const x of [40, 54]) dot(Mo.x + x, Mo.y + 100, 3, '#8a8e92'); }, 8203);
      // perche à micro : trépied, mât, bras et micro suspendu
      const b0 = [Pe.x, B - 150], m = Pe.micro;
      for (const dx of [-40, 0, 36]) fillPts(bar([Pe.x, B - 140], [Pe.x + dx, B], 5), '#2a2c30');
      fillPts(bar([Pe.x, B - 10], b0, 9), '#4a4e54'); fillPts(bar(b0, [Pe.x, 900], 6), '#5a5e64');
      fillPts(bar([Pe.x - 40, 910], [m[0] + 10, 700], 5), '#5a5e64'); pc(ell(Pe.x - 46, 912, 14, 14, 12), '#2a2c30', null, 8204);
      strokePts([[m[0], 702], [m[0], m[1] - 20]], '#1a1a1c', 2);
      pc([[m[0] - 14, m[1] - 22], [m[0] + 14, m[1] - 22], [m[0] + 12, m[1] + 14], [m[0] - 12, m[1] + 14]], '#2c2e32', () => { for (let y = m[1] - 16; y < m[1] + 12; y += 5) strokePts([[m[0] - 11, y], [m[0] + 11, y]], 'rgba(200,200,200,0.3)', 1); }, 8205);
    });
  }
  function makeStBancs() {
    return M.pre(W, BACK + 40, () => {
      const Bn = STU.banc, B = BACK, s = Bn.siege;
      for (const x of [Bn.x0 + 26, (Bn.x0 + Bn.x1) / 2, Bn.x1 - 26]) pc(rect(x - 9, s + 10, x + 9, B), '#6b4a2e', null, 8301 + x);
      pc(rect(Bn.x0, s - 6, Bn.x1, s + 12), '#8a5a34', () => { strokePts([[Bn.x0 + 4, s - 3], [Bn.x1 - 4, s - 3]], 'rgba(255,220,170,0.4)', 1.4); hatch(null, 0.05, 5, 0.18, 1, undefined, [Bn.x0, s - 6, Bn.x1, s + 12]); }, 8304);
      for (let x = Bn.x0 + 20; x < Bn.x1; x += 52) fillPts(rect(x, s - 6, x + 26, s + 12), 'rgba(155,45,42,0.35)', 0, 0);
    });
  }
  function makeStSol() {
    return M.pre(W, BACK + 120, () => {
      const y0 = BACK + 30, Pu = STU.pupitre, V = STU.ventilo;
      // pupitre de régie à cadrans (les lampes sont dessinées en direct)
      pc([[Pu.x0, y0], [Pu.x0, y0 - 150], [Pu.x0 + 20, y0 - 196], [Pu.x1, y0 - 214], [Pu.x1, y0]], '#4a4e46', () => {
        fillPts([[Pu.x0 + 6, y0 - 152], [Pu.x0 + 24, y0 - 192], [Pu.x1 - 6, y0 - 208], [Pu.x1 - 6, y0 - 150]], '#3a3e38');
        for (let i = 0; i < 3; i++) { const x = Pu.x0 + 46 + i * 52; fillPts(ell(x, y0 - 176 + i * 2, 15, 15, 14), '#e8e0c8'); strokePts(ep(x, y0 - 176 + i * 2, 15, 15, 14, 0, TAU), '#1e201c', 2); }
        for (let i = 0; i < 6; i++) { dot(Pu.x0 + 30 + i * 28, y0 - 110, 6, '#1e201c'); dot(Pu.x0 + 30 + i * 28, y0 - 110, 2, '#9a9ea4'); }
        strokePts([[Pu.x0, y0 - 150], [Pu.x1, y0 - 150]], 'rgba(220,235,220,0.3)', 1.4); shade(Pu.x1, 0, Pu.x0, 0, 0.3, [Pu.x0, y0 - 220, Pu.x1, y0]);
      }, 8401);
      // caisses de matériel empilées (coins métalliques) + rouleau de câble + seau de colle
      const Cx = STU.caisses;
      for (const [x, y, w, h, col] of [[Cx - 30, y0 - 96, 120, 96, '#3e4248'], [Cx - 10, y0 - 166, 84, 70, '#5a4a36']]) pc(rect(x, y, x + w, y + h), col, () => {
        for (const [a, b] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) fillPts(rect(a - 9, b - 9, a + 9, b + 9), '#9a9ea4');
        fillPts(rect(x + w / 2 - 12, y + h / 2 - 4, x + w / 2 + 12, y + h / 2 + 4), '#9a9ea4'); strokePts([[x + 4, y + 4], [x + w - 4, y + 4]], 'rgba(255,255,255,0.2)', 1.2);
      }, 8402 + x);
      const Rc = STU.cable;
      pc(ell(Rc, y0 - 46, 44, 46, 20), '#2a2c30', () => { for (let r = 38; r > 10; r -= 6) strokePts(ep(Rc, y0 - 46, r, r, 18, 0, TAU), r % 12 ? '#1a1a1c' : '#3a3a3e', 3); dot(Rc, y0 - 46, 8, '#8a6a3c'); }, 8406);
      strokePts(qbez([Rc - 30, y0 - 6], [Rc - 200, y0 + 18], [Rc - 420, y0 + 4], 14), '#1a1a1c', 4);
      pc([[1028, y0 - 60], [1062, y0 - 60], [1058, y0], [1032, y0]], '#8a8e92', () => { fillPts(rect(1028, y0 - 60, 1062, y0 - 54), '#d8d0b0'); strokePts(ep(1045, y0 - 60, 18, 16, 10, PI, TAU), '#5a5e64', 1.6); }, 8407);
      // ventilateur sur pied (la tête tourne en direct)
      fillPts(bar([V.x, y0 - 4], [V.x, V.y + 30], 7), '#4a4e54'); pc(ell(V.x, y0 - 6, 40, 9, 16), '#2a2c30', null, 8408);
    });
  }
  function regieVie(t, o) {                  // régie : lampes vertes qui clignotent, écrans gris, deux techniciens ; o.regie 0..1 : l'un se penche à la vitre
    const c = cx_(), g = M.tg(t), R = STU.regie; if (SIL()) return;
    c.save(); c.beginPath(); c.rect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0); c.clip();
    for (const [x, w] of [[660, 80], [756, 64], [836, 80]]) { const k = 0.55 + 0.2 * Math.sin(g * 3.1 + x); fillPts(rect(x + 8, 418, x + w - 8, 462), mixA('#3a4a44', '#9ab0a8', k), 0, 0); }
    for (let i = 0; i < 12; i++) { const k = clamp(0.3 + 0.7 * Math.sin(g * (1.1 + 0.29 * i) + i * 2.3)); dot(656 + i * 23, 552, 3, mixA('#1e3a24', '#7ee08a', k)); }
    const sil = '#0b0e0c', rg = ease(clamp(o.regie || 0)), lean = Math.sin(clamp(o.regie || 0) * PI);
    const ax = 720 + 1.5 * Math.sin(g * 0.8), ay = 500;                                           // technicien assis au casque
    fillPts([[ax - 50, R.y1 + 4], [ax - 40, 540], [ax - 14, 524], [ax + 18, 526], [ax + 44, 544], [ax + 52, R.y1 + 4]], sil, 0, 0); fillPts(ell(ax, ay, 22, 26, 14), sil, 0, 0);
    strokePts(ep(ax, ay - 4, 26, 30, 12, PI * 1.05, PI * 1.95), sil, 5);
    const bx = 850 - 30 * rg, by = 470 + 20 * lean, sc = 1 + 0.25 * rg;                           // technicien debout (se penche vers la vitre)
    fillPts([[bx - 46 * sc, R.y1 + 4], [bx - 36 * sc, by + 60 * sc], [bx - 12 * sc, by + 40 * sc], [bx + 14 * sc, by + 42 * sc], [bx + 38 * sc, by + 62 * sc], [bx + 46 * sc, R.y1 + 4]], sil, 0, 0);
    fillPts(ell(bx, by, 22 * sc, 26 * sc, 14), sil, 0, 0);
    if (rg > 0.05) { const hx_ = bx - 40 * sc, hy = by + 30 * sc - 30 * lean; fillPts(ribbon([[bx - 30 * sc, by + 60 * sc], [bx - 50 * sc, by + 50 * sc], [hx_, hy]], 14 * sc, 11 * sc), sil, 0, 0); fillPts(ell(hx_, hy, 9 * sc, 11 * sc, 10), sil, 0, 0); }
    c.restore();
    c.save(); c.globalAlpha = 0.6; fillPts([[R.x0 + 30, R.y0], [R.x0 + 80, R.y0], [R.x0 + 10, R.y1], [R.x0, R.y1]], 'rgba(230,245,235,0.12)', 0, 0); fillPts([[R.x0 + 170, R.y0], [R.x0 + 190, R.y0], [R.x0 + 120, R.y1], [R.x0 + 100, R.y1]], 'rgba(230,245,235,0.1)', 0, 0); c.restore();
  }
  function projo(x, y, a, on) {             // projecteur suspendu : lyre, corps cylindrique, volets coupe-flux ; on 0..1 = lentille allumée
    strokePts([[x, STU.passerelle + 12], [x, y - 30]], '#1e1e22', 3);
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(a);
    strokePts(ep(0, 0, 34, 34, 10, PI * 0.95, PI * 2.05), '#2a2c30', 4);
    pc([[-26, -30], [26, -30], [30, -22], [30, 34], [-30, 34], [-30, -22]], '#2c2e32', () => { strokePts([[-22, -24], [-22, 28]], 'rgba(255,255,255,0.22)', 1.4); for (let y2 = -20; y2 < 30; y2 += 9) strokePts([[18, y2], [28, y2]], 'rgba(0,0,0,0.5)', 1.2); }, 8501 + x);
    pc([[-30, 34], [-46, 52], [-40, 56], [-24, 38]], '#1e1e22', null, 8502 + x); pc([[30, 34], [46, 52], [40, 56], [24, 38]], '#1e1e22', null, 8503 + x);
    fillPts(ell(0, 35, 27, 6, 14), mixA('#5a5040', '#fff0c0', on), 0, 0);
    c.restore();
  }
  function faisceau(t, x, y, a, on, i) {
    if (on <= 0.01 || SIL()) return;
    const c = cx_(), L = BACK - y, s0 = [x - Math.sin(a) * 36, y + Math.cos(a) * 36], dx = -Math.sin(a) * L, E = [s0[0] + dx, BACK];
    const poly = [[s0[0] - 24, s0[1]], [s0[0] + 24, s0[1]], [E[0] + 150, E[1]], [E[0] - 150, E[1]]];
    c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    const gr = c.createLinearGradient(s0[0], s0[1], E[0], E[1]); gr.addColorStop(0, `rgba(255,236,190,${0.2 * on})`); gr.addColorStop(1, `rgba(255,236,190,${0.02 * on})`); c.fillStyle = gr; c.fill(); c.clip();
    M.poussiere(t, { x: Math.min(s0[0], E[0]) - 150, y: s0[1], w: Math.abs(E[0] - s0[0]) + 300, h: L, n: 16, a: 0.7 * on, seed: 31 + i * 7 });
    c.restore();
  }
  function fanions(g, k0, dy) {               // guirlande de fanions sans lettre, du sommet du chapiteau vers les côtés (ondulent)
    const Q = STU.cirque, top = [Q.cx, Q.pic - 70 - dy], cols = [C.rouge, C.or, C.ivoire, C.ardoise];
    for (const side of [-1, 1]) {
      const end = [Q.cx + side * 330, 380 - dy], mid = [(top[0] + end[0]) / 2, Math.max(top[1], end[1]) + 70];
      const line = qbez(top, mid, end, 12); strokePts(line, '#2a2420', 1.4);
      for (let i = 1; i < 12; i++) { const p = line[i], w = 0.18 * Math.sin(g * 2.3 + i * 0.9 + side), c = cx_();
        c.save(); c.translate(p[0], p[1]); c.rotate(w); pc([[-9, 0], [9, 0], [0, 26]], cols[(i + (side > 0 ? 1 : 0)) % 4], null, 8600 + i * 3 + side, { drop: false }); c.restore(); }
    }
  }
  // RON.studio(t, up, o) — à dessiner en premier (avant M.drawFloor) ; up = décalage vertical (px).
  //   o.cirque 0..1 (décor de l'émission de Bozo : 1 en place, 0 monté aux cintres ; défaut 1) ; o.bancs (false) ; o.antenne 0..1 (défaut 1) ;
  //   o.regie 0..1 (un technicien se penche à la vitre) ; o.projecteur 0..1 (le projecteur 2 clignote puis s'éteint à 1) ; o.porte 0..1 (la porte s'entrouvre) ;
  //   o.lumiere 0..1 (défaut 1, assombrit le décor) ; o.moniteur (true : écran gris allumé)
  RON.studio = function (t, up, o) {
    o = o || {}; up = up || 0; const K = RON.K, c = cx_(), g = M.tg(t), B = BACK, lum = clamp(o.lumiere == null ? 1 : o.lumiere), an = clamp(o.antenne == null ? 1 : o.antenne);
    const ci = clamp(o.cirque == null ? 1 : o.cirque), lift = (1 - ease(ci)) * 1400;
    c.save(); c.translate(0, -up);
    c.drawImage(K.stRegie, 0, 0); regieVie(t, o); c.drawImage(K.stFond, 0, 0);
    // porte qui s'entrouvre (le battant pivote sur sa gauche, lumière du couloir)
    const Pt = STU.porte, pk = ease(clamp(o.porte || 0));
    if (pk > 0 && !SIL()) { const gr = c.createLinearGradient(Pt.x0, 0, Pt.x1, 0); gr.addColorStop(0, `rgba(250,230,180,${0.75 * pk})`); gr.addColorStop(1, `rgba(250,230,180,${0.25 * pk})`); c.fillStyle = gr; c.fillRect(Pt.x0, Pt.y0, Pt.x1 - Pt.x0, B - Pt.y0); }
    c.save(); c.translate(Pt.x0, 0); c.scale(lerp(1, 0.32, pk), 1); c.translate(-Pt.x0, 0); M.flat(K.door, Pt.x0 + (Pt.x1 - Pt.x0) / 2, B); c.restore();
    // horloge : aiguilles (la trotteuse avance par secondes, temps global)
    const H = STU.horloge, sec = Math.floor(g) + ease(clamp((g % 1) / 0.12)), am = (g / 60) * TAU / 60 + 1.4, ah = am / 12 + 4.2;
    for (const [a, l, w, col] of [[ah, H.r * 0.5, 4.5, '#1e1c1a'], [am, H.r * 0.78, 3, '#1e1c1a'], [sec / 60 * TAU, H.r * 0.86, 1.6, C.rouge]]) strokePts([[H.x - Math.sin(a) * -8, H.y + Math.cos(a) * 8], [H.x + Math.sin(a) * l, H.y - Math.cos(a) * l]], col, w);
    dot(H.x, H.y, 4, C.rouge);
    // lampe « à l'antenne » (verre rouge rond, sans lettre) et lampe verte de régie
    const L = STU.antenne;
    fillPts(ell(L.x, L.y, 20, 20, 18), mixA('#4a1a18', '#e8352a', an), 0, 0); dot(L.x - 7, L.y - 7, 4.5, `rgba(255,220,210,${0.3 + 0.4 * an})`);
    if (an > 0 && !SIL()) { const k = an * (0.9 + 0.1 * Math.sin(g * 3)), gl = c.createRadialGradient(L.x, L.y, 6, L.x, L.y, 130); gl.addColorStop(0, `rgba(255,70,50,${0.5 * k})`); gl.addColorStop(1, 'rgba(255,60,40,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(L.x - 130, L.y - 130, 260, 260); c.restore(); }
    dot(STU.regie.x0 - 44, STU.regie.y0 + 20, 9, mixA('#1e3a24', '#7ee08a', 0.6 + 0.4 * Math.sin(g * 1.3)));
    // projecteurs (oscillent un peu) ; le 2 clignote avec o.projecteur
    const pj = clamp(o.projecteur || 0), flick = pj > 0 ? (pj > 0.95 ? 0 : (Math.sin(g * 41) > 0.2 || Math.sin(g * 17) > 0.6 ? 1 : 0.15)) : 1;
    const PA = STU.projos.map((P, i) => P.a + 0.035 * Math.sin(g * 0.7 + i * 1.9));
    STU.projos.forEach((P, i) => projo(P.x, STU.projoY, PA[i], i === 1 ? flick * lum : lum));
    // décor de l'émission (monte aux cintres quand cirque passe de 1 à 0)
    if (lift < 1500) {
      const Q = STU.cirque;
      if (lift > 1) { strokePts([[Q.cx - 180, B - (Q.bas - Q.pic) + 120 - lift], [Q.cx - 180, 0]], 'rgba(20,18,16,0.8)', 1.6); strokePts([[Q.cx + 180, B - (Q.bas - Q.pic) + 120 - lift], [Q.cx + 180, 0]], 'rgba(20,18,16,0.8)', 1.6); }
      M.flat(K.stCirque, Q.cx, B - lift, { cast: { a: 0.3, dx: 14, dy: 6 }, rot: lift > 1 ? 0.006 * Math.sin(g * 1.4) : 0 });
      fanions(g, 1, lift);
    }
    c.drawImage(K.stMilieu, 0, 0);
    if (o.bancs) c.drawImage(K.stBancs, 0, 0);
    // écran du moniteur (gris bleuté qui scintille) + micro de la perche qui se balance
    const Mo = STU.moniteur;
    if (!SIL()) { const k = o.moniteur === false ? 0 : 0.7 + 0.08 * Math.sin(g * 23) + 0.05 * Math.sin(g * 7); fillPts(rect(Mo.x - 62, Mo.y + 10, Mo.x + 60, Mo.y + 96), mixA('#26302e', '#9fb4b8', k), 0, 0);
      for (let y = Mo.y + 12 + ((g * 30) % 4); y < Mo.y + 96; y += 4) fillPts(rect(Mo.x - 62, y, Mo.x + 60, y + 1.2), 'rgba(10,20,24,0.18)', 0, 0); }
    // faisceaux et poussière
    STU.projos.forEach((P, i) => faisceau(t, P.x, STU.projoY, PA[i], 0.75 * lum * (i === 1 ? flick : 1), i));
    if (lum < 1 && !SIL()) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(40,48,44,${0.75 * (1 - lum)})`; c.fillRect(0, 0, W, B + 40); c.restore(); }
    c.restore();
  };
  // RON.studioSol(t, up, o) — premier plan (pupitre de régie à cadrans, caisses, rouleau de câble, seau de colle, ventilateur) : juste APRÈS M.drawFloor()
  RON.studioSol = function (t, up, o) {
    up = up || 0; const c = cx_(), g = M.tg(t), Pu = STU.pupitre, V = STU.ventilo, y0 = BACK + 30;
    c.save(); c.translate(0, -up); c.drawImage(RON.K.stSol, 0, 0);
    for (let i = 0; i < 3; i++) { const x = Pu.x0 + 46 + i * 52, y = y0 - 176 + i * 2, a = -2.2 + 1.6 * (0.5 + 0.5 * M.noise(g * 1.4, i * 3)); strokePts([[x, y + 4], [x + Math.cos(a) * 12, y + Math.sin(a) * 12]], '#2a1a10', 1.6); }
    for (let i = 0; i < 6; i++) { const k = clamp(0.2 + 0.8 * Math.sin(g * (1.7 + 0.41 * i) + i * 1.3)); dot(Pu.x0 + 30 + i * 28, y0 - 134, 4.4, mixA(i % 2 ? '#3a1a10' : '#1e3a24', i % 2 ? '#ff7a40' : '#7ee08a', k)); }
    // ventilateur : cage et pales qui tournent
    const va = g * 14;
    pc(ell(V.x, V.y, 46, 46, 22), 'rgba(60,64,70,0.55)', () => { for (let k = 0; k < 3; k++) { const a = va + k * TAU / 3; fillPts([[V.x, V.y], [V.x + Math.cos(a - 0.3) * 40, V.y + Math.sin(a - 0.3) * 40], [V.x + Math.cos(a + 0.25) * 42, V.y + Math.sin(a + 0.25) * 42]], 'rgba(150,156,160,0.55)', 0, 0); } }, 8701, { texA: 0.2 });
    for (let k = 0; k < 6; k++) strokePts([[V.x, V.y], [V.x + Math.cos(k * PI / 3) * 46, V.y + Math.sin(k * PI / 3) * 46]], 'rgba(30,32,36,0.8)', 1.1);
    strokePts(ep(V.x, V.y, 46, 46, 22, 0, TAU), '#2a2c30', 2.6); dot(V.x, V.y, 7, '#2a2c30');
    c.restore();
  };

  RON.init = function () {
    const K = (RON.K = {});
    K.stRegie = makeStRegie(); K.stFond = makeStFond(); K.door = makeDoor(); K.door.padB = 10;
    K.stCirque = makeStCirque(); K.stMilieu = makeStMilieu(); K.stBancs = makeStBancs(); K.stSol = makeStSol();
    K.comptoir = makeComptoir();
    return K;
  };
})();
