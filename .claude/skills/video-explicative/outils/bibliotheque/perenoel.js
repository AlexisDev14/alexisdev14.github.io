// persos.js — « Le Père Noël, rouge bien avant Coca-Cola » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.pnl (alias PNL). Appeler PNL.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash / M.rng, jamais Math.random) : fonction pure de t.
// INDEX : 1) géométrie, palette  2) objets (pinceau, pinceauFin, pot, palette, plume, feuille, brune, claire, manteau) + tableau peint
//         3) objets tenus, IK, enveloppes  4) Père Noël  5) publicitaire  6) Nast  7) Sundblom
//         8) accessoires seuls, éphéméride, chevalet  9) atelier de Nast (PNL.atelierNast / atelierNastSol)  10) studio de réclame (PNL.studio / studioSol)  11) PNL.init
(function () {
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const PNL = (M.pnl = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = M.ST.back, W = M.W;

  // =====================================================================
  // 1) GÉOMÉTRIE, PALETTE
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
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
  const bar = (a, b, w) => ribbon([a, b], w, w).map((q) => [q[0], q[1], 1]);   // barre à angles vifs
  // contour « bouclé » (barbe, fourrure) : rééchantillonne un polygone fermé et pousse un point sur deux vers l'extérieur
  function bumpy(poly, amp, step) {
    const P = poly.map((p) => [p[0], p[1]]), o = [];
    let cxm = 0, cym = 0; for (const p of P) { cxm += p[0]; cym += p[1]; } cxm /= P.length; cym /= P.length;
    let k = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l / step));
      for (let j = 0; j < n; j++, k++) {
        const u = j / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), dx = x - cxm, dy = y - cym, d = Math.hypot(dx, dy) || 1;
        const e = k % 2 ? amp : -amp * 0.35;
        o.push([x + dx / d * e, y + dy / d * e]);
      }
    }
    return o;
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function mixA(a, b, k, al) { const A = hx(a), B = hx(b); k = clamp(k); const v = A.map((x, i) => Math.round(lerp(x, B[i], k))); return al == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${al})`; }
  // passage en gravure : couleur → gris chaud de papier (k 0..1)
  function grisOf(h, k) {
    const A = hx(h), l = (0.3 * A[0] + 0.59 * A[1] + 0.11 * A[2]) / 255, P0 = [30, 28, 30], P1 = [240, 234, 222];
    const G = P0.map((v, i) => lerp(v, P1[i], clamp(l * 1.08))); return `rgb(${A.map((v, i) => Math.round(lerp(v, G[i], k))).join(',')})`;
  }
  const gc = (h, p) => { const g = (p && p.gris) || 0; return g > 0.001 ? grisOf(h, clamp(g)) : h; };
  const flipped = () => { const m = cx_().getTransform(); return m.a * m.d - m.b * m.c < 0; };
  const big = [[-200, -400, 1], [220, -400, 1], [220, 400, 1], [-200, 400, 1]];
  const C = {                                   // palette de la vidéo (sourde)
    rouge: '#b3262b', rougeD: '#8a1c21', rougeP: '#9a2227', four: '#f0e9d8', fourD: '#cfc4ac', noir: '#1e1a19', noirL: '#3c3634',
    or: '#c4a04a', orD: '#8e6c26', orL: '#e2c472', beige: '#a89f8b', beigeD: '#8b8371', fourB: '#5f4d3b', fourBL: '#7d6750', pantG: '#6b6458', botteG: '#3b2c20',
    lutin: '#6e4c30', lutinD: '#553a25', lutinL: '#93704c', peau: '#ebc4a4', peauD: '#cda385', barbe: '#f5f1e9', barbeD: '#cfc8bc',
    perle: '#bdbcb5', perleD: '#9c9b94', rayure: 'rgba(70,70,74,0.42)', bordeaux: '#6e1e2a', gomina: '#141113', guetre: '#dcd7cb',
    gilet: '#6a4a2e', giletD: '#553a22', chemise: '#ece6d8', chemiseD: '#cfc8b8', pantN: '#4a4642', pantND: '#3a3633', brun: '#5a3a24',
    ardoise: '#5b6f86', ardoiseD: '#48596c', vertL: '#4f7a4a', roux: '#c38d52', rouxD: '#9c6a36', pantS: '#4c3c30',
    bois: '#7a5232', boisD: '#5a3a22', boisL: '#a07650', metal: '#7f8285', metalD: '#55585c', metalL: '#b2b5b8', verreB: '#5c3418', verreC: '#a9c6a2',
  };
  PNL.C = C;
  // texture de fourrure : petits traits courbes, dans le clip courant (pièce)
  function furTex(x0, y0, x1, y1, colD, colL, seed, step) {
    step = step || 9;
    for (let y = y0, r = 0; y < y1; y += step, r++) for (let x = x0 + (r % 2 ? step / 2 : 0); x < x1; x += step) {
      const h = hash(seed + x * 7.1 + y * 13.3), a = 0.6 + h * 1.4, l = 5 + h * 4;
      strokePts([[x, y], [x + Math.cos(a) * l * 0.5 + 1.5, y + Math.sin(a) * l * 0.5], [x + Math.cos(a) * l, y + Math.sin(a) * l]], h > 0.5 ? colD : colL, 1.1);
    }
  }
  // bande de fourrure le long d'une ligne (bords bouclés, boucles dessinées)
  function furBand(line, w, col, colD) {
    fillPts(ribbon(line, w, w), col, 3, 0.3);
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l / 7));
      const nx = -(b[1] - a[1]) / (l || 1), ny = (b[0] - a[0]) / (l || 1);
      for (let j = 0; j < n; j++) {
        const u = j / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), h = hash(x * 3.7 + y * 1.3);
        dot(x + nx * w * 0.5, y + ny * w * 0.5, w * 0.17, col); dot(x - nx * w * 0.5, y - ny * w * 0.5, w * 0.17, col);
        const o = (h - 0.5) * w * 0.6;
        strokePts(ep(x + nx * o, y + ny * o, 3, 2.6, 5, PI * (0.1 + h), PI * (1.2 + h)), colD, 1);
      }
    }
  }

  // =====================================================================
  // 2) OBJETS (dessinés à l'échelle 1, ouverture vers le haut)
  // =====================================================================
  // ---- gros pinceau plat (manche de bois, virole, poils chargés de rouge) ; prise au milieu du manche
  function drawPinceau(o) {
    const ch = o.charge == null ? 1 : clamp(o.charge);
    pc([[-6, 0], [6, 0], [5, 80], [6, 92], [3, 98], [-3, 98], [-6, 92], [-5, 80]], C.boisL, () => { strokePts([[-2, 4], [-1, 90]], 'rgba(255,230,190,0.35)', 1.4); hatch(null, 1.5, 4, 0.18); }, 9101);
    pc([[-12, -22], [12, -22], [8, 2, 1], [-8, 2, 1]], C.metalL, () => { for (const y of [-16, -8]) strokePts([[-12, y], [12, y]], 'rgba(40,40,44,0.45)', 1.1); shade(-12, 0, 12, 0, 0.3, [-14, -24, 14, 4]); }, 9102);
    pc([[-14, -22], [14, -22], [15, -44], [13, -58], [6, -63], [-6, -63], [-13, -58], [-15, -44]], '#d6c49c', () => {
      for (let x = -12; x <= 12; x += 4) strokePts([[x, -22], [x * 0.9, -60]], 'rgba(120,96,60,0.45)', 1);
      if (ch > 0) fillPts([[-16, -64], [16, -64], [16, lerp(-58, -34, ch)], [6, lerp(-56, -30, ch)], [-6, lerp(-58, -36, ch)], [-16, lerp(-56, -32, ch)]], C.rouge, 0, 0.6);
      if (ch > 0) strokePts([[-8, -58], [-6, -44]], 'rgba(255,190,180,0.5)', 1.2);
    }, 9103);
  }
  // ---- pinceau fin du peintre ; o.couleur = couleur de la pointe
  function drawPinceauFin(o) {
    pc([[-3, 0], [3, 0], [2.4, 110], [0, 116], [-2.4, 110]], '#3a2a20', () => strokePts([[-1, 4], [-0.5, 108]], 'rgba(255,230,190,0.3)', 1), 9111);
    pc([[-4, -14], [4, -14], [3, 1, 1], [-3, 1, 1]], C.metalL, null, 9112);
    pc([[-4, -14], [4, -14], [3, -26], [0, -36], [-3, -26]], o.couleur || C.rouge, null, 9113, { drop: false });
  }
  // ---- pot de peinture rouge (métal, anse en fil de fer, peinture qui déborde) ; prise = haut de l'anse
  function drawPot(o) {
    const db = o.debord == null ? 1 : clamp(o.debord);
    fillPts(ribbon(qbez([-41, -30], [0, -132], [41, -30], 14), 4.5, 4.5), '#3a3a3e');                                   // anse
    strokePts(qbez([-39, -32], [0, -128], [39, -32], 14), 'rgba(220,220,225,0.35)', 1);
    pc([[-42, -38], [42, -38], [41, 40], [37, 50, 1], [-37, 50, 1], [-41, 40]], C.metal, () => {
      for (const y of [-26, 36]) { fillPts(rect(-44, y - 3, 44, y + 3), C.metalD); strokePts([[-44, y - 3], [44, y - 3]], 'rgba(255,255,255,0.3)', 1); }
      strokePts([[-26, -30], [-26, 44]], 'rgba(255,255,255,0.35)', 3);
      shade(40, 0, -40, 0, 0.35, [-44, -40, 44, 52]);
      if (db > 0) for (const [x, l, w] of [[-30, 34, 9], [-6, 18, 7], [18, 46, 10], [33, 22, 6]]) {          // coulures rouges
        const L = l * db; fillPts([[x - w / 2, -40], [x + w / 2, -40], [x + w / 2, -40 + L - w / 2], [x, -40 + L + w * 0.3], [x - w / 2, -40 + L - w / 2]], C.rouge, x, 0.4);
        dot(x - w * 0.15, -40 + L - w * 0.4, w * 0.18, 'rgba(255,190,180,0.6)');
      }
    }, 9121);
    pc(ell(0, -38, 42, 9, 22), '#4a4a4e', () => { fillPts(ell(0, -37, 37, 6.5, 20), C.rouge); strokePts(ep(0, -38, 30, 4, 10, PI * 1.1, PI * 1.5), 'rgba(255,190,180,0.6)', 1.6); }, 9122, { drop: false });
    for (const x of [-41, 41]) dot(x, -30, 3.2, '#2a2a2e');
  }
  // ---- palette de peintre (vue de face, trou du pouce à gauche, couleurs) ; prise = bord au trou du pouce
  const PALETTE = (() => { const o = []; for (let i = 0; i < 30; i++) { const a = i / 30 * TAU, r = 1 + 0.08 * Math.sin(a * 2 + 0.6); o.push([Math.cos(a) * 70 * r, Math.sin(a) * 46 * r]); }
    return o.filter((p) => !(p[0] < -50 && p[1] > 8 && p[1] < 34)).concat([]); })();
  function drawPalette() {
    pc(PALETTE, '#b98c55', () => {
      for (let i = 0; i < 6; i++) strokePts(qbez([-70, -30 + i * 12], [0, -36 + i * 12 + 6], [70, -24 + i * 12], 10), 'rgba(110,70,30,0.3)', 1.1);
      fillPts(ell(-46, 14, 9, 8, 12), '#2e2620');                                                                      // trou du pouce
      const dabs = [[30, -28, C.rouge, 13], [52, -10, C.four, 10], [50, 14, '#c99a3a', 9], [30, 30, '#2e3a5a', 9], [6, 36, '#4f7a4a', 8], [-14, -32, '#1e1a19', 7], [6, -36, C.rouge, 8]];
      for (const [x, y, col, r] of dabs) { fillPts(bumpy(ell(x, y, r, r * 0.8, 10), 1.6, 4), col, x, 0.4); dot(x - r * 0.3, y - r * 0.3, r * 0.22, 'rgba(255,255,255,0.4)'); }
      strokePts(qbez([-10, 0], [10, -6], [22, 8], 6), 'rgba(179,38,43,0.7)', 3);                                       // mélange
      shade(0, -46, 0, 46, 0.25, [-72, -50, 72, 50]);
    }, 9131);
  }
  // ---- plume d'oie à bec d'acier (Nast) ; prise juste au-dessus du bec
  function drawPlume() {
    pc([[1, 0], [7, -18], [8, -42], [4, -64], [-4, -84], [-9, -70], [-10, -46], [-9, -24], [-4, -6]], '#ebe5d4', () => {
      for (let y = -6; y > -80; y -= 7) { strokePts([[-1, y], [-10, y - 8]], 'rgba(110,104,92,0.45)', 1); strokePts([[0, y], [7, y - 7]], 'rgba(110,104,92,0.4)', 1); }
      strokePts(qbez([0, 4], [2, -40], [-4, -82], 10), 'rgba(160,150,130,0.9)', 1.6);
    }, 9141);
    pc([[-2.5, -2], [2.5, -2], [2.5, 32], [-2.5, 32]], '#d8cfb8', null, 9142, { drop: false });
    pc([[-3, 32], [3, 32], [1.6, 50], [0, 55], [-1.6, 50]], '#2a2622', () => strokePts([[0, 36], [0, 52]], 'rgba(200,200,210,0.6)', 0.8), 9143);
  }
  // ---- feuille de Nast (vue de FACE, jamais en miroir) : o.dessin 0..1 (dessin qui apparaît), o.couleur 0..1 (gravure → couleurs)
  const FW = 75, FH = 95;
  function drawFeuille(o) {
    const c = cx_(); c.save(); if (flipped()) c.scale(-1, 1);
    pc([[-FW, -FH, 1], [FW, -FH + 2, 1], [FW - 1, FH, 1], [-FW + 2, FH - 1, 1]], '#efe8d6', () => {
      c.save(); c.scale(0.44, 0.44); tableauNoel({ etat: o.dessin == null ? 1 : o.dessin, couleur: o.couleur || 0, papier: true }); c.restore();
      strokePts(rect(-FW + 8, -FH + 8, FW - 8, FH - 8), 'rgba(60,50,40,0.5)', 1.2, true);
    }, 9151);
    c.restore();
  }
  // ---- bouteilles de soda (aucune lettre) : 'brune' cintrée ambre à capsule dorée ; 'claire' vert pâle, étiquette blanche au petit rocher gris
  const BR_R = [[21, 70], [24, 60], [25, 44], [22, 28], [17, 14], [19, 0], [24, -14], [23, -28], [18, -40], [11, -52], [8.5, -64], [8.5, -73], [10.5, -76]];
  const CL_R = [[22, 70], [23, 50], [23, -10], [22, -26], [16, -40], [10, -52], [8.5, -66], [8.5, -73], [10.5, -76]];
  const sym = (R) => R.concat(R.slice().reverse().map((p) => [-p[0], p[1]]));
  function drawBouteille(o) {
    const cl = o.modele === 'claire', R = cl ? CL_R : BR_R;
    pc(sym(R), cl ? C.verreC : C.verreB, () => {
      if (!cl) { fillPts([[-30, -44], [30, -44], [30, 80], [-30, 80]], '#2e190c'); fillPts(rect(-30, -46, 30, -42), 'rgba(160,100,50,0.6)'); }
      else { fillPts([[-30, -30], [30, -30], [30, 80], [-30, 80]], '#c4d9bb'); fillPts(rect(-30, -32, 30, -29), 'rgba(255,255,255,0.5)'); }
      strokePts(cl ? [[-14, 60], [-15, -20], [-6, -48], [-5, -70]] : [[-14, 60], [-16, 40], [-10, 18], [-15, -12], [-8, -44], [-5, -70]], 'rgba(255,255,255,0.55)', 3);
      strokePts([[15, 56], [16, 30]], 'rgba(255,255,255,0.25)', 2);
      if (cl) {
        pc(rect(-23, -14, 23, 30), '#f4f0e6', () => {
          fillPts([[-11, 18], [-9, 7], [-3, 0], [4, 2], [9, 9], [12, 18]], '#8d8c88'); strokePts([[-5, 4], [-1, 10], [5, 6]], 'rgba(40,40,40,0.45)', 1);
          strokePts([[-16, 21], [-10, 19], [-4, 21], [2, 19], [8, 21], [14, 19]], 'rgba(90,110,130,0.7)', 1.3);
        }, 9162, { drop: false });
      }
      shade(24, 0, -24, 0, 0.28, [-26, -80, 26, 72]);
    }, cl ? 9161 : 9163);
    pc([[-11.5, -86], [11.5, -86], [12, -76, 1], [-12, -76, 1]], cl ? '#b6b6ae' : C.or, () => { for (let x = -10; x <= 10; x += 4) strokePts([[x, -86], [x, -77]], 'rgba(60,40,10,0.45)', 1); strokePts([[-11, -84], [11, -84]], 'rgba(255,250,220,0.6)', 1); }, 9164);
  }
  // ---- manteau rouge tenu par le col (pendant l'enfilage seulement)
  function drawManteau() {
    pc([[-28, -4], [28, -4], [44, 26], [58, 196, 1], [-58, 196, 1], [-44, 26]], C.rouge, () => {
      furBand([[-62, 186], [62, 186]], 20, C.four, C.fourD); furBand([[0, 0], [0, 196]], 16, C.four, C.fourD);
      for (const x of [-30, 30]) strokePts(qbez([x * 0.6, 20], [x, 100], [x * 1.4, 190], 8), 'rgba(60,10,10,0.3)', 1.4);
      shade(-50, 0, 50, 0, 0.3, [-60, -6, 60, 200]);
    }, 9171);
    furBand([[-30, -2], [0, 6], [30, -2]], 16, C.four, C.fourD);
  }

  // ---- tableau peint de face : Père Noël en buste, souriant (300 × 380, origine au centre). Sert à la toile, à l'affiche et à la feuille de Nast.
  //      o.etat 0..1 (esquisse → fini), o.couleur 0..1 (gravure → couleurs), o.bouteille null|'brune'|'claire', o.papier (fond clair de feuille)
  function tableauNoel(o) {
    const e = o.etat == null ? 1 : clamp(o.etat), cl = o.couleur == null ? 1 : clamp(o.couleur), Bt = o.bouteille, c = cx_();
    const cc = (h) => (cl >= 0.999 ? h : grisOf(h, 1 - cl));
    const lay = (k, fn) => { if (k <= 0.002) return; c.save(); c.globalAlpha *= Math.min(1, k); fn(); c.restore(); };
    const BODY = [[-132, 190], [-126, 100], [-104, 62], [-54, 46], [54, 46], [104, 62], [126, 100], [132, 190]];
    const FACE = ell(0, -36, 46, 52, 22), HAT = [[-58, -76], [-44, -118], [-10, -148], [36, -164], [82, -162], [108, -142], [94, -130], [60, -134], [34, -116], [58, -76]];
    const BEARD = bumpy([[-52, -36], [-58, -6], [-52, 30], [-38, 70], [-16, 104], [0, 116], [16, 104], [38, 70], [52, 30], [58, -6], [52, -36], [34, -18], [14, -12], [0, -14], [-14, -12], [-34, -18]], 4, 9);
    const SLEEVE = ribbon([[-116, 150], [-122, 70], [-94, 14]], 50, 42);
    const fondC = o.papier ? mixA('#efe8d6', '#41604f', cl * 0.9) : mixA('#e6dfcf', '#41604f', cl);
    // fond
    lay(o.papier ? 1 : sm(0.12, 0.38, e), () => {
      fillPts(rect(-150, -190, 150, 190), fondC, 0, 0);
      if (cl > 0.05) { fillPts(ell(-10, -40, 130, 150, 24), mixA('#e6dfcf', '#6a7f5a', cl, 0.5), 0, 0); for (let i = 0; i < 7; i++) dot(-120 + i * 40, -170 + (i % 2) * 24, 4, mixA('#e6dfcf', '#d8c27a', cl, 0.7)); }
      if (cl < 0.95) hatch(rect(-150, -190, 150, 190), 0.8, 6, 0.3 * (1 - cl));
    });
    // esquisse au fusain
    lay(sm(0, 0.12, e) * (1 - 0.7 * sm(0.5, 0.8, e)), () => {
      for (const P of [BODY, FACE, HAT, BEARD, SLEEVE]) strokePts(P, 'rgba(40,34,30,0.75)', 1.6, true);
      if (Bt) strokePts(sym(BR_R).map((p) => [p[0] * 0.62 - 88, p[1] * 0.62 - 30]), 'rgba(40,34,30,0.75)', 1.4, true);
    });
    // manteau et bonnet rouges
    lay(sm(0.28, 0.52, e), () => {
      fillPts(BODY, cc(C.rouge), 1, 0.5); fillPts(HAT, cc(C.rouge), 2, 0.5);
      strokePts(qbez([-60, 80], [-70, 140], [-80, 190], 8), cc('#7a1a1e'), 2); strokePts(qbez([60, 80], [74, 140], [84, 190], 8), cc('#7a1a1e'), 2);
      fillPts(rect(-132, 150, 132, 172), cc(C.noir), 3, 0.4); fillPts(rect(-20, 146, 20, 176), cc(C.or), 4, 0.3); fillPts(rect(-11, 153, 11, 169), cc(C.noir), 5, 0.2);
      if (cl < 0.95) { hatch(BODY, 0.8, 4, 0.35 * (1 - cl)); hatch(HAT, 0.8, 4, 0.35 * (1 - cl)); }
    });
    // visage, barbe, fourrures
    lay(sm(0.48, 0.72, e), () => {
      fillPts(FACE, cc('#ebc4a4'), 6, 0.4);
      fillPts(rect(-18, 48, 18, 190), cc(C.four), 7, 0.5); fillPts(rect(-18, 150, 18, 172), cc(C.noir), 3, 0.2); fillPts(rect(-14, 148, 14, 174), cc(C.or), 4, 0.2);
      furBand([[-62, -82], [0, -90], [62, -82]], 28, cc(C.four), cc(C.fourD));
      fillPts(bumpy(ell(110, -134, 16, 16, 12), 2.5, 5), cc(C.four), 8, 0.3);
      fillPts(BEARD, cc(C.barbe), 9, 0.4);
      for (let y = -10; y < 100; y += 14) for (let x = -44 + (y % 28 ? 7 : 0); x < 46; x += 15) if (Math.abs(x) < 52 - Math.max(0, y - 40) * 0.5) strokePts(ep(x, y, 4, 3.5, 5, PI * 0.2, PI * 1.1), cc('#b8b0a2'), 1.2);
      fillPts([[0, -26], [-14, -32], [-32, -26], [-42, -14], [-28, -12], [-12, -16], [0, -19], [12, -16], [28, -12], [42, -14], [32, -26], [14, -32]], cc(C.barbe), 10, 0.3);
      fillPts([[-12, -8], [12, -8], [8, -1], [0, 1], [-8, -1]], cc('#6a2a26'), 11, 0.2);
    });
    // main, bouteille, détails du visage
    lay(sm(0.66, 0.88, e), () => {
      if (Bt) { c.save(); c.translate(-90, -38); c.scale(0.66, 0.66); drawBouteilleFlat(Bt, cc); c.restore(); }
      fillPts(SLEEVE, cc(C.rouge), 12, 0.4); furBand([[-112, 26], [-80, 30]], 18, cc(C.four), cc(C.fourD));
      fillPts(ell(-92, Bt ? 2 : 6, 18, 15, 14), cc('#ebc4a4'), 13, 0.3);
      for (const y of [-4, 3, 10]) strokePts([[-104, y], [-82, y - 2]], cc('#a87a60'), 1);
      fillPts(ell(0, -36, 11, 9, 14), cc('#e3a08e'), 14, 0.2);
      for (const s of [-1, 1]) { dot(28 * s, -30, 12, cl > 0.3 ? 'rgba(220,110,100,0.45)' : 'rgba(120,110,100,0.25)'); dot(18 * s, -56, 3.6, cc('#2a1f1d'));
        strokePts([[10 * s, -61], [18 * s, -64], [27 * s, -60]], cc('#f5f1e9'), 4.5); strokePts([[11 * s, -51], [18 * s, -48], [25 * s, -51]], cc('#b07a64'), 1.2); }
      if (cl < 0.95) hatch(FACE, -0.7, 5, 0.3 * (1 - cl));
    });
    // touches de lumière
    lay(sm(0.86, 1, e), () => {
      strokePts([[-118, 120], [-112, 80], [-98, 60]], 'rgba(255,200,190,0.35)', 3); dot(-6, -40, 3, 'rgba(255,255,255,0.7)');
      strokePts([[-40, -150], [0, -158]], 'rgba(255,220,200,0.25)', 3);
    });
  }
  function drawBouteilleFlat(kind, cc) {          // bouteille simplifiée pour un tableau (pas de pièce découpée)
    const cl = kind === 'claire', R = cl ? CL_R : BR_R;
    fillPts(sym(R), cc(cl ? C.verreC : C.verreB), 21, 0.3);
    if (!cl) fillPts(sym(R).filter((p) => p[1] > -44).concat([]), cc('#2e190c'), 22, 0.2);
    else fillPts(rect(-23, -14, 23, 30), cc('#f4f0e6'), 23, 0.2);
    if (cl) fillPts([[-11, 18], [-9, 7], [-3, 0], [4, 2], [9, 9], [12, 18]], cc('#8d8c88'), 24, 0.2);
    fillPts(rect(-12, -86, 12, -76), cc(cl ? '#b6b6ae' : C.or), 25, 0.2);
    strokePts([[-14, 60], [-16, 40], [-10, 18], [-15, -12], [-8, -44]], 'rgba(255,255,255,0.5)', 3);
  }
  PNL.tableauNoel = tableauNoel;

  const OBJ = {
    pinceau: { draw: drawPinceau, grip: [0, 44], pts: { poils: [0, -63], virole: [0, -10], bout: [0, 98] }, base: [0, 98] },
    pinceauFin: { draw: drawPinceauFin, grip: [0, 38], pts: { pointe: [0, -36], bout: [0, 116] }, base: [0, 116] },
    pot: { draw: drawPot, grip: [0, -80], pts: { bord: [0, -38], peinture: [0, -37], anse: [0, -81], fond: [0, 50] }, base: [0, 50] },   // prise = sommet de l'anse (y −81)
    palette: { draw: drawPalette, grip: [-58, 18], pts: { centre: [0, 0], rouge: [30, -28], blanc: [52, -10] }, base: [0, 46] },
    plume: { draw: drawPlume, grip: [0, 20], pts: { bec: [0, 55], barbe: [-4, -84] }, base: [0, 55] },
    feuille: { devant: true, draw: drawFeuille, grip: [FW - 10, -FH + 6], p2: () => [-FW + 34, -FH + 6], pts: { centre: [0, 0], haut: [0, -FH], bas: [0, FH] }, base: [0, FH] },
    brune: { draw: (o) => drawBouteille(Object.assign({}, o, { modele: 'brune' })), grip: (o) => (o.prise === 'goulot' ? [0, -60] : [0, 30]), pts: { goulot: [0, -86], centre: [0, 0], fond: [0, 70] }, base: [0, 70] },
    claire: { draw: (o) => drawBouteille(Object.assign({}, o, { modele: 'claire' })), grip: (o) => (o.prise === 'goulot' ? [0, -60] : [0, 36]), pts: { goulot: [0, -86], centre: [0, 0], fond: [0, 70] }, base: [0, 70] },
    manteau: { draw: drawManteau, grip: [0, 2], pts: { ourlet: [0, 196] }, base: [0, 196] },
  };
  PNL.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);

  // =====================================================================
  // 3) OBJETS TENUS, IK, ENVELOPPES (principe heldParts de bibliotheque/ronald.js)
  //    G = géométrie du bras : LA (bras), PG (poing dans l'avant-bras), SHF/SHB (épaules), HEAD (cou), k (taille de la main)
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
    const sk = (s) => (typeof s === 'function' ? s : () => s);
    return {
      objet: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !(OBJ[p.tenu] && OBJ[p.tenu].devant)) heldDraw(p.tenu, p.tenuO, p); } },
      objetDevant: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => { if (has(p.tenu) && OBJ[p.tenu] && OBJ[p.tenu].devant) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: P, noRivet: true, base: '#000', seed: seed + 2, pts: (p) => (has(p.tenu) ? fingers(p.tenu, G.k) : OFFP), paint: (p) => { fillPts(big, sk(skin)(p)); doigtsPaint(); } },
      objetB: { parent: 'armB_lo', at: P, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: P, noRivet: true, base: '#000', seed: seed + 4, pts: (p) => (has(p.tenuB) ? fingers(p.tenuB, G.k) : OFFP), paint: (p) => { fillPts(big, sk(skinB)(p)); doigtsPaint(); } },
      doigtsB2: { parent: 'armB_lo', at: P, noRivet: true, base: '#000', seed: seed + 5, pts: (p) => (p._deux ? scl(DOIGTS, G.k) : OFFP), paint: (p) => { fillPts(big, sk(skinB)(p)); doigtsPaint(); } },
    };
  }
  // point écran d'un point nommé de l'objet tenu : PNL.pt(r, 'poils') ; main arrière : PNL.pt(r, 'anse', true) ; 'prise' = point tenu
  PNL.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1;
    const q = nom === 'prise' ? g : ob.pts[nom] ? ptOf(ob.pts[nom], oo) : null; if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  function ikT(G, S, T, bend) {       // même convention que M.ik (bend 1 = coude plié vers l'avant)
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
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  // vecteur prise → point nommé de l'objet tenu, dans le repère du torse, pour un objet tourné de `a` (rad) à l'écran
  function tipVec(name, o, nom, a) { const ob = OBJ[name]; if (!ob) return [0, 0]; const oo = o || {}, g = gripOf(ob, oo), q = ptOf(ob.pts[nom], oo), e = oo.echelle || 1; return rot([(q[0] - g[0]) * e, (q[1] - g[1]) * e], a); }
  function marche(q, k) {                                     // pas sur place selon t : jambes en opposition, petits bras, léger rebond
    if (!(k > 0)) return;
    const t = q.t || 0, w = Math.sin(t * TAU * (q.cadence || 1.1)), A = q.ang;
    A.legF = (A.legF || 0) - 0.34 * w * k; A.legB = (A.legB || 0) + 0.34 * w * k;
    if (!has(q.tenu)) A.armF_up = (A.armF_up || 0) + 0.12 * w * k;
    if (!has(q.tenuB)) A.armB_up = (A.armB_up || 0) - 0.12 * w * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(t * TAU * (q.cadence || 1.1))) * 5 * k;
  }
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
  // enveloppe : pose → défauts → gestes (poseFn) → marche → finish → M.puppet. fn.pose(p, x, y, s, dir) = pose finale sans dessiner (pour M.ik)
  function wrap(key, poseFn, sDefFn) {
    const sOf = (pose, s) => (s != null ? s : typeof sDefFn === 'function' ? sDefFn(pose || {}) : sDefFn);
    const build = (pose, x, y, s, dir) => {
      const q = prep(pose), def = CH[key]; q._G = def.G;
      const loc = (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; };
      poseFn(q, loc, { x, y, s, dir }); marche(q, q.marche === true ? 1 : q.marche); return finish(q);
    };
    const fn = (pose, x, y, s, o) => {
      s = sOf(pose, s); o = Object.assign({ slot: M.ST.slotF, nom: CH[key].nom }, o || {});
      const dir = o.dir || 1, q = build(pose, x, y, s, dir);
      return run(CH[key], q, x, y, s, o);
    };
    fn.pose = (pose, x, y, s, dir) => build(pose, x || 0, y || 0, sOf(pose, s), dir || 1);
    return fn;
  }

  // ---------------- pièces de corps communes (bras à articulations rondes, rivet au pivot)
  const R_COUDE = 11.5;
  function armR(len, wt, rc) { wt = wt || 15; rc = rc || R_COUDE; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.42], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, len * 0.42]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const val = (v, p) => (typeof v === 'function' ? v(p) : v);
  // bras : o = { manche(p), deco(p, back), wt }
  const upDef = (at, seed, back, o) => ({ parent: 'torso', at, pts: armR(96, o.wt || 16), base: '#000', seed, paint: (p) => {
    fillPts(big, val(o.manche, p)); if (o.deco) o.deco(p, back);
    hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, back ? 0.32 : 0.24);
    if (p.gris > 0.05) hatch(null, -0.7, 5, 0.3 * p.gris, 1, M.P.encre, [-30, -30, 30, 120]);
    if (back) fillPts(big, 'rgba(20,14,10,0.13)');
  } });
  // avant-bras : o = { manche(p), peau(p), cuff(p, back), deco(p, back), nu (avant-bras nu : manche retroussée) }
  function foreDef(parent, back, seed, o) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, 96], pts: (p) => foreR(hk(p)), base: '#000', seed, paint: (p) => {
      fillPts(big, val(o.manche, p)); if (o.deco) o.deco(p, back);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], val(o.peau, p)); X.handPaint(null, hk(p));
      if (o.cuff) o.cuff(p, back);
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, back ? 0.3 : 0.2);
      if (p.gris > 0.05) hatch(null, -0.7, 5, 0.3 * p.gris, 1, M.P.encre, [-30, -20, 30, 130]);
      if (back) fillPts(big, 'rgba(20,14,10,0.13)');
    } };
  }
  // jambe d'adulte en une pièce (X.legPts) ; o = { pant(p), shoe(p), by (haut de la chaussure / botte), deco(p, back, by), th, sy, assis }
  const SEAT_LEG = [[-18, -14], [96, -17], [110, -12], [120, 0], [121, 40], [119, 96], [121, 104], [146, 110], [152, 120, 1], [150, 123, 1], [96, 123, 1], [96, 106], [98, 60], [97, 22], [86, 15], [-20, 14]];
  function legDef(at, seed, back, o) {
    const sy = o.sy || 1, std = scl(X.legPts(o.th || 0.95), 1, sy);
    return { parent: 'torso', at, pts: (p) => (o.assis && p.assis ? SEAT_LEG : std), base: '#000', seed, noRivet: !!back, paint: (p) => {
      fillPts(big, val(o.pant, p));
      if (o.assis && p.assis) {
        if (o.deco) o.deco(p, back, null);
        fillPts([[90, 104, 1], [160, 104, 1], [160, 130, 1], [90, 130, 1]], val(o.shoe, p)); fillPts(rect(90, 119, 160, 130), 'rgba(10,6,4,0.4)');
        hatch([[-20, -20], [100, -20], [100, -4], [-20, -4]], 0.2, 4, 0.22);
      } else {
        const by = (val(o.by, p) || 214) * sy;
        if (o.deco) o.deco(p, back, by);
        fillPts([[-40, by, 1], [60, by, 1], [60, 300, 1], [-40, 300, 1]], val(o.shoe, p));
        fillPts(rect(-40, 231 * sy, 60, 300), 'rgba(10,6,4,0.35)');
        if (!back) { strokePts([[18, by + 10], [42, 228 * sy]], 'rgba(255,255,255,0.22)', 1.3); hatch([[-26, -20], [-6, -20], [-6, by], [-26, by]], 0.8, 4, 0.22); }
      }
      if (p.gris > 0.05) hatch(null, -0.7, 5, 0.3 * p.gris, 1, M.P.encre, [-50, -30, 170, 300]);
      if (back) { hatch(null, 0.8, 3.6, 0.28, 1, M.P.encre, [-50, -30, 170, 300]); fillPts(big, 'rgba(20,14,10,0.14)'); }
    } };
  }
  const EXPR = {
    neutre: {}, jovial: { mouth: 'smile' }, ravi: { mouth: 'smile', eyes: 'half' }, surpris: { brow: 'up', eyes: 'wide', mouth: 'o' }, triste: { brow: 'worry', mouth: 'tight', eyes: 'half' },
    fache: { brow: 'frown', mouth: 'tight' }, fier: { brow: 'up', mouth: 'smile' }, gene: { brow: 'worry', eyes: 'half', mouth: 'tight' }, juge: { brow: 'frown', eyes: 'half', mouth: 'n' },
  };
  function expr(q, nom) { const e = EXPR[nom]; if (!e) return; for (const k in e) if (q.face[k] == null) q.face[k] = e[k]; }
  function defOf(nom, parts, G, skin, skinB, seed, order, hipY, extra) {
    Object.assign(parts, heldParts(G, skin, skinB, seed));
    return Object.assign({ nom, G, hipY: hipY || -238, parts, handLen: Math.round(Math.hypot(G.PG[0], G.PG[1])), rod: { part: 'torso', at: [-26, 18] }, order }, extra || {});
  }
  const TAIL = ['objetB', 'doigtsB', 'objet', 'armF_up', 'armF_lo', 'objetDevant', 'doigts', 'doigtsB2'];
  function plier(q, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), pieds à plat
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  const kk = (q, n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));

  // =====================================================================
  // 4) LE PÈRE NOËL — grand vieil homme jovial, barbe blanche longue et bouclée, gros ventre (ventre 0..1,2).
  //    costume 'rouge' (défaut) | 'gravure' (1863, manteau long beige-gris, col de fourrure, bonnet de fourrure ; gris 0..1) | 'lutin' (1823, fourrure brune, capuche, petit)
  //    enfile 0..1 : passe le manteau rouge par étapes (de p.costume vers 'rouge')
  // =====================================================================
  const pnCost = (p) => (p.costume === 'lutin' || p.costume === 'gravure' ? p.costume : 'rouge');
  const ENF = { armB: 0.3, armF: 0.55, jambes: 0.9, bonnet: 0.92, torse: 0.9 };
  const pcost = (p, part) => { const k = p.enfile; if (k == null || !(k > 0)) return pnCost(p); return k >= (ENF[part] || 1) ? 'rouge' : pnCost(p); };
  const pnV = (p) => clamp(p.ventre == null ? (pnCost(p) === 'lutin' ? 1 : 0.8) : p.ventre, 0, 1.2);
  const HEM = { rouge: 104, gravure: 150, lutin: 60 };
  function pnFront(v) { const bx = 42 + 42 * v; return [[26, -176], [38, -160], [46, -142], [Math.max(46, bx - 18), -114], [Math.max(44, bx - 6), -88], [bx, -60], [bx - 2, -34], [bx - 10, -10], [Math.max(30, bx - 20), 12]]; }
  function frontOf(F, y) { for (let i = 0; i < F.length - 1; i++) { const a = F[i], b = F[i + 1]; if (y >= a[1] && y <= b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1] || 1)); } return F[F.length - 1][0]; }
  const pnFrontAt = (v, y) => frontOf(pnFront(v), y);
  function pnTorso(v, k) {
    const F = pnFront(v), fx = F[F.length - 1][0], hem = HEM[k], fl = k === 'gravure' ? 12 : 4;
    return [[-22, -180], [8, -186]].concat(F, [[fx - 2, 40], [fx + fl, hem, 1], [-58 - fl * 0.5, hem, 1], [-56, 40], [-55, 0], [-58, -50], [-58, -110], [-52, -152], [-38, -172]]);
  }
  function pnTorsoPaint(p, k, v) {
    const F = pnFront(v), fx = F[F.length - 1][0], hem = HEM[k], g = (h) => gc(h, p), c = cx_();
    if (k === 'rouge') {
      fillPts(rect(-200, -400, 220, hem), g(C.rouge));
      for (let i = 0; i < 4; i++) strokePts(qbez([-40 + i * 18, -150], [-30 + i * 20, -40], [-44 + i * 22, hem], 8), 'rgba(70,10,12,0.25)', 1.3);
      hatch([[-66, -172], [-24, -172], [-24, hem], [-66, hem]], 0.75, 4.2, 0.26);
      furBand(F.map((q) => [q[0] - 9, q[1]]).concat([[fx - 11, 40], [fx - 4, hem]]), 18, g(C.four), g(C.fourD));
      fillPts(rect(-80, -32, 160, -10), g(C.noir)); strokePts([[-80, -31], [160, -31]], 'rgba(255,255,255,0.16)', 1);
      const bx = pnFrontAt(v, -21); fillPts(rect(bx - 28, -37, bx - 5, -5), g(C.or)); fillPts(rect(bx - 22, -30, bx - 11, -12), g(C.noir)); strokePts([[bx - 27, -35], [bx - 6, -35]], 'rgba(255,250,210,0.6)', 1);
      furBand([[-70, hem - 10], [fx + 12, hem - 10]], 22, g(C.four), g(C.fourD));
      furBand([[-38, -166], [-10, -180], [20, -182], [36, -170]], 18, g(C.four), g(C.fourD));
    } else if (k === 'gravure') {
      fillPts(big, g(C.beige));
      for (let i = 0; i < 5; i++) strokePts(qbez([-46 + i * 18, -120], [-36 + i * 20, 0], [-52 + i * 24, hem], 8), 'rgba(50,40,30,0.25)', 1.3);
      hatch([[-70, -172], [-24, -172], [-24, hem], [-70, hem]], 0.75, 4.2, 0.28);
      strokePts(F.slice(3).map((q) => [q[0] - 14, q[1]]).concat([[fx - 15, 40], [fx - 6, hem]]), 'rgba(50,40,30,0.55)', 1.5);
      for (const y of [-112, -84, -56]) { const x = frontOf(F, y) - 22; fillPts(rect(x - 4, y - 3, x + 12, y + 3), g('#3b2c20')); }
      fillPts(rect(-80, -30, 160, -12), g('#4a3424')); const bx = pnFrontAt(v, -21); strokePts(rect(bx - 26, -34, bx - 8, -8), g('#9a9890'), 2.4, true);
      fillPts(rect(-90, hem - 8, 170, hem + 6), g(C.beigeD));
      furBand([[-42, -164], [-14, -178], [20, -180], [40, -162], [47, -134], [44, -110]], 28, g(C.fourB), g(C.fourBL));
    } else {
      fillPts(big, g(C.lutin));
      furTex(-66, -190, 96, hem + 4, g(C.lutinD), g(C.lutinL), 31, 9);
      furBand([[-70, hem - 8], [fx + 10, hem - 8]], 18, g(C.lutinL), g(C.lutinD));
      furBand([[-40, -166], [-10, -180], [20, -182], [38, -168]], 16, g(C.lutinL), g(C.lutinD));
    }
    shade(fx, -60, -56, -40, 0.3, [-70, -190, 160, hem + 10]);
    if (p.gris > 0.05) { hatch(null, -0.7, 5, 0.3 * p.gris, 1, M.P.encre, [-80, -200, 170, hem + 10]); hatch(null, 0.75, 8, 0.2 * p.gris, 1, M.P.encre, [-80, -200, 170, hem + 10]); }
    return c;
  }
  const PN_HEAD = [[-18, 16], [12, 16], [16, 4], [20, -6], [26, -12], [30, -18], [30, -24], [32, -28], [38, -30], [45, -33], [47, -39], [44, -46], [37, -49], [33, -54], [32, -62], [30, -72], [26, -84], [14, -96], [-6, -101], [-26, -94], [-36, -74], [-37, -50], [-32, -28], [-24, -8]];
  const PN_BEARD = bumpy([[-8, -60], [0, -48], [6, -38], [14, -34], [22, -32], [28, -24], [38, -22], [42, -14], [40, -2], [42, 12], [40, 28], [42, 44], [36, 60], [34, 76], [24, 90], [12, 100], [0, 94], [-8, 80], [-16, 62], [-20, 44], [-22, 24], [-22, 4], [-20, -16], [-18, -36], [-14, -52]], 3.2, 9);
  const PN_BEARD_L = PN_BEARD.map((q) => [q[0], q[1] > -30 ? -30 + (q[1] + 30) * 0.5 : q[1]]);
  const PN_MOUST = [[16, -30], [26, -35], [36, -34], [42, -30], [49, -21], [44, -19], [38, -22], [32, -21], [26, -19], [18, -20], [10, -25]];
  const PN_HAIR = bumpy([[-18, -82], [-32, -84], [-42, -70], [-46, -52], [-44, -32], [-36, -16], [-26, -10], [-24, -28], [-28, -50], [-24, -70]], 2.4, 6);
  const PN_CAP = [[32, -74], [28, -92], [14, -108], [-6, -118], [-30, -116], [-50, -106], [-64, -90], [-74, -70], [-80, -52], [-72, -48], [-62, -62], [-48, -76], [-36, -72]];
  const PN_BAND = bumpy(ribbon([[-46, -66], [-28, -77], [0, -83], [22, -83], [37, -74]], 22, 22), 1.8, 6);
  const PN_POMP = bumpy(ell(-82, -46, 14, 14, 14), 2.2, 5);
  const PN_FUR = [[30, -78], [26, -98], [12, -114], [-8, -124], [-30, -126], [-50, -118], [-62, -100], [-66, -80], [-58, -70], [-44, -78], [-30, -76]];
  const PN_FURB = bumpy(ribbon([[-48, -64], [-28, -76], [0, -82], [22, -82], [37, -73]], 26, 26), 2.4, 6);
  const PN_HOOD = bumpy([[38, -74], [32, -100], [16, -118], [-8, -126], [-30, -130], [-46, -138], [-52, -120], [-60, -96], [-62, -66], [-58, -36], [-50, -10], [-40, 8], [-26, 18], [-14, 12], [-24, -12], [-30, -40], [-28, -64], [-10, -80], [18, -84]], 2.6, 7);
  const browPts = (b, x, y) => (b === 'up' ? [[x - 10, y - 2], [x, y - 7], [x + 10, y - 4]] : b === 'frown' ? [[x - 10, y - 2], [x, y - 1], [x + 10, y + 3]] : b === 'worry' ? [[x - 10, y + 2], [x, y - 3], [x + 10, y - 5]] : [[x - 10, y], [x, y - 4], [x + 10, y - 1]]);
  function mkPereNoel() {
    const sleeve = (part) => (p) => { const k = pcost(p, part); return gc(k === 'rouge' ? C.rouge : k === 'gravure' ? C.beige : C.lutin, p); };
    const lutDeco = (part) => (p, back) => { if (pcost(p, part) === 'lutin') furTex(-22, -14, 24, 76, gc(C.lutinD, p), gc(C.lutinL, p), back ? 51 : 52, 8); };
    const cuff = (part) => (p) => { const k = pcost(p, part); if (k === 'rouge') furBand([[-19, 66], [19, 66]], 20, gc(C.four, p), gc(C.fourD, p)); else if (k === 'gravure') furBand([[-18, 68], [18, 68]], 14, gc(C.fourB, p), gc(C.fourBL, p)); else furBand([[-18, 68], [18, 68]], 14, gc(C.lutinL, p), gc(C.lutinD, p)); };
    const peau = (p) => gc(C.peau, p), peauB = (p) => gc(C.peauD, p);
    const legO = { th: 1.12, pant: (p) => { const k = pcost(p, 'jambes'); return gc(k === 'rouge' ? C.rougeP : k === 'gravure' ? C.pantG : C.lutin, p); },
      shoe: (p) => { const k = pcost(p, 'jambes'); return gc(k === 'rouge' ? C.noir : k === 'gravure' ? C.botteG : C.lutinD, p); },
      by: (p) => (pcost(p, 'jambes') === 'lutin' ? 196 : 150),
      deco: (p, back, by) => { const k = pcost(p, 'jambes'); if (k === 'lutin') furTex(-30, -20, 60, by, gc(C.lutinD, p), gc(C.lutinL, p), back ? 61 : 62, 8);
        else { fillPts(rect(-40, by, 60, by + 10), gc(k === 'rouge' ? C.noirL : '#5a4636', p)); strokePts([[-22, by + 3], [18, by + 1]], 'rgba(255,255,255,0.2)', 1.4); } } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => pnTorso(pnV(p), pcost(p, 'torse')), base: '#000', seed: 8101, paint: (p) => {
        const v = pnV(p), k = pcost(p, 'torse'); pnTorsoPaint(p, k, v);
        if (p.enfile > 0 && k !== 'rouge') {                    // le manteau rouge se referme de l'arrière vers l'avant
          const w = clamp((p.enfile - 0.28) / 0.5), F = pnFront(v);
          if (w > 0) { const c = cx_(), xc = lerp(-64, F[F.length - 1][0] + 14, w); c.save(); c.beginPath(); c.rect(-300, -400, xc + 300, 800); c.clip(); pnTorsoPaint(p, 'rouge', v); c.restore(); }
        }
      } },
      legB: legDef([-8, -2], 8102, true, legO), legF: legDef([8, -2], 8103, false, legO),
      armB_up: upDef([-10, -146], 8104, true, { wt: 18, manche: sleeve('armB'), deco: lutDeco('armB') }),
      armB_lo: foreDef('armB_up', true, 8105, { manche: sleeve('armB'), peau: peauB, cuff: cuff('armB'), deco: lutDeco('armB') }),
      armF_up: upDef([-2, -146], 8106, false, { wt: 18, manche: sleeve('armF'), deco: lutDeco('armF') }),
      armF_lo: foreDef('armF_up', false, 8107, { manche: sleeve('armF'), peau, cuff: cuff('armF'), deco: lutDeco('armF') }),
      head: { parent: 'torso', at: [6, -170], pts: PN_HEAD, base: '#000', seed: 8108, noRivet: true, paint: (p) => {
        const f = p.face || {}, g = (h) => gc(h, p);
        fillPts(big, g(C.peau)); X.earPaint(-12, -46);
        hatch([[-36, -60], [-14, -60], [-14, 16], [-36, 16]], 0.6, 3.6, 0.25);
        dot(26, -42, 11, p.gris > 0.5 ? 'rgba(120,110,100,0.25)' : 'rgba(216,108,96,0.42)');
        X.eye(f, 20, -58, 1.05);
        if ((f.eyes || 'open') !== 'wide') { strokePts(qbez([12, -51], [20, -47], [28, -51], 5), 'rgba(150,90,70,0.5)', 1.1); strokePts([[8, -58], [3, -55]], 'rgba(150,90,70,0.45)', 1); strokePts([[8, -54], [4, -50]], 'rgba(150,90,70,0.4)', 1); }
        const bp = browPts(f.brow, 20, -67); strokePts(bp, g(C.barbe), 4.6); strokePts(bp.map((q) => [q[0], q[1] + 1.6]), g(C.barbeD), 1.1);
        fillPts(ell(41, -40, 7.5, 7, 12), g('#e09c88')); dot(39, -43, 2, 'rgba(255,255,255,0.5)');
        if (p.gris > 0.05) hatch(null, -0.7, 5, 0.3 * p.gris, 1, M.P.encre, [-40, -110, 50, 20]);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 8109, pts: (p) => (pnCost(p) === 'lutin' && !(p.enfile >= ENF.bonnet) ? OFFP : PN_HAIR), paint: (p) => {
        fillPts(big, gc(C.barbe, p)); for (let y = -76; y < -12; y += 10) strokePts(ep(-36, y, 5, 4, 5, PI * 0.3, PI * 1.3), 'rgba(150,140,125,0.6)', 1.1); } },
      barbe: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 8110, pts: (p) => (pnCost(p) === 'lutin' ? PN_BEARD_L : PN_BEARD), paint: (p) => {
        const f = p.face || {}, L = pnCost(p) === 'lutin', g = (h) => gc(h, p);
        fillPts(big, g(C.barbe));
        for (let y = -26, r = 0; y < (L ? 20 : 96); y += 11, r++) for (let x = -18 + (r % 2 ? 6 : 0); x < 40; x += 12) strokePts(ep(x, y, 4.2, 3.6, 5, PI * (0.15 + 0.1 * (r % 3)), PI * 1.15), 'rgba(150,140,125,0.55)', 1.15);
        shade(-22, 0, 40, 0, 0.22, [-30, -70, 50, 110]);
        const m = f.mouth || 'smile';
        if (m === 'smile') { fillPts([[38, -18], [33, -11], [25, -9], [19, -13], [26, -12], [33, -14]], '#5a2622', 0, 0); strokePts([[33, -10], [25, -7]], g('#d08a80'), 1.6); }
        else if (m === 'o') fillPts(ell(30, -12, 5, 6, 10), '#4a1e1a', 0, 0);
        else if (m === 'tight') strokePts([[36, -14], [24, -13]], '#5a2622', 2);
        else strokePts([[36, -15], [30, -13], [24, -14]], '#5a2622', 1.8);
        if (p.gris > 0.05) hatch(null, -0.7, 6, 0.22 * p.gris, 1, M.P.encre, [-30, -70, 50, 110]);
      } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 8111, pts: PN_MOUST, paint: (p) => {
        fillPts(big, gc(C.barbe, p)); for (const x of [20, 28, 36, 43]) strokePts([[x - 6, -31], [x, -24]], 'rgba(150,140,125,0.55)', 1); } },
      bonnet: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 8112, pts: (p) => { const k = pcost(p, 'bonnet'); return k === 'rouge' ? PN_CAP : k === 'gravure' ? PN_FUR : PN_HOOD; }, paint: (p) => {
        const k = pcost(p, 'bonnet'), g = (h) => gc(h, p);
        if (k === 'rouge') { fillPts(big, g(C.rouge)); strokePts(qbez([20, -96], [-20, -112], [-62, -80], 8), 'rgba(255,190,180,0.3)', 2); hatch([[-90, -90], [-30, -120], [-20, -60], [-90, -40]], 0.8, 4, 0.3); }
        else if (k === 'gravure') { fillPts(big, g('#7a7262')); for (let i = 0; i < 4; i++) strokePts(qbez([24 - i * 6, -90], [-10 - i * 4, -120 + i * 4], [-56 + i * 3, -88 + i * 2], 8), 'rgba(30,24,18,0.35)', 1.2); hatch([[-80, -130], [0, -130], [0, -60], [-80, -60]], 0.8, 4, 0.3); }
        else { fillPts(big, g(C.lutin)); furTex(-66, -140, 40, 20, g(C.lutinD), g(C.lutinL), 72, 8); strokePts(PN_HOOD.slice(-5), g(C.lutinL), 3); }
        if (p.gris > 0.05) hatch(null, -0.7, 5, 0.3 * p.gris, 1, M.P.encre, [-90, -140, 50, 20]);
      } },
      bonnetBord: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 8113, pts: (p) => { const k = pcost(p, 'bonnet'); return k === 'rouge' ? PN_BAND : k === 'gravure' ? PN_FURB : OFFP; }, paint: (p) => {
        if (pcost(p, 'bonnet') === 'gravure') { fillPts(big, gc(C.fourB, p)); furTex(-52, -96, 42, -54, gc('#3e3226', p), gc(C.fourBL, p), 73, 6); if (p.gris > 0.05) hatch(null, -0.7, 5, 0.3 * p.gris, 1, M.P.encre, [-60, -100, 50, -50]); return; }
        fillPts(big, gc(C.four, p)); for (let x = -40; x < 34; x += 8) strokePts(ep(x, -76 - x * 0.12, 3, 2.6, 5, 0.3, PI * 1.2), gc(C.fourD, p), 1); } },
      pompon: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 8114, pts: (p) => (pcost(p, 'bonnet') === 'rouge' ? PN_POMP : OFFP), paint: (p) => {
        fillPts(big, gc(C.four, p)); for (let i = 0; i < 6; i++) strokePts(ep(-82 + Math.cos(i) * 6, -46 + Math.sin(i * 2) * 6, 3, 2.5, 5, i, i + 3), gc(C.fourD, p), 1); } },
    };
    return defOf('pereNoel', parts, G_ADULTE, peau, peauB, 8140,
      ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'cheveux', 'torso', 'barbe', 'moustache', 'bonnet', 'bonnetBord', 'pompon'].concat(TAIL));
  }
  CH.pnlPereNoel = mkPereNoel();
  PNL.pereNoel = wrap('pnlPereNoel', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t), V = pnV(q);
    expr(q, q.expr || 'jovial');
    const sa = kk(q, 'salut'), tp = kk(q, 'tapote'), ba = kk(q, 'barbe'), rm = kk(q, 'regardeManche'), ti = kk(q, 'tient'), po = kk(q, 'pose'), fi = kk(q, 'fier');
    if (fi > 0) { q.tilt = (q.tilt || 0) - 0.05 * fi; A.head = (A.head || 0) - 0.16 * fi; q.dy = (q.dy || 0) - 3 * fi;
      armTo(q, 'armF', [pnFrontAt(V, -20) - 8, -20], fi); armTo(q, 'armB', [pnFrontAt(V, -20) - 30, -18], fi); if (!f.eyes) f.eyes = 'half'; }
    if (ti > 0 || (po > 0 && has(q.tenu))) {
      if (q.tenu == null) q.tenu = 'brune';
      const k = Math.max(ti, po), T0 = q.cible ? loc(q.cible) : po > ti ? [100, -206] : [94, -150];
      const gp = q.cible && OBJ[q.tenu] ? tipVec(q.tenu, q.tenuO, 'centre', 0) : [0, 0];
      armTo(q, 'armF', [T0[0] - gp[0], T0[1] - gp[1]], k);
    }
    if (po > 0) { q.tilt = (q.tilt || 0) - 0.03 * po; A.head = (A.head || 0) - 0.1 * po; q.dy = (q.dy || 0) - 2 * po;
      const Hb = [pnFrontAt(V, -16) - 34, -16]; if (has(q.tenu)) armTo(q, 'armB', Hb, po); else { armTo(q, 'armF', [12, -16], po); armTo(q, 'armB', Hb, po); } }
    if (sa > 0) { armTo(q, 'armF', [56, -300], sa); A.armF_lo = (A.armF_lo || 0) + 0.28 * Math.sin(g * 7) * sa; q.handF = 'open'; A.head = (A.head || 0) - 0.06 * sa; }
    if (tp > 0) { armTo(q, 'armF', [pnFrontAt(V, -46) + 6, -46 + 7 * Math.sin(g * 8)], tp); q.handF = 'open'; if (!f.eyes) f.eyes = 'half'; }
    if (ba > 0) { const u = 0.5 + 0.5 * Math.sin(g * 2.6), Hb = headPt(q, 46, lerp(18, pnCost(q) === 'lutin' ? 14 : 80, u)); armTo(q, 'armF', [Hb[0] + 4, Hb[1]], ba); q.handF = 'open'; if (!f.eyes) f.eyes = 'half'; }
    if (rm > 0) { armTo(q, 'armF', [150, -168], rm); A.head = (A.head || 0) + 0.1 * rm; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o'; }
    if (q.enfile != null) {
      const en = clamp(q.enfile);
      const a1 = sm(0, 0.12, en) * (1 - sm(0.22, 0.3, en));
      if (en < 0.27 && q.tenu == null) { q.tenu = 'manteau'; armTo(q, 'armF', [96, -200], a1); }
      armTo(q, 'armB', [40, -40], sm(0.28, 0.36, en) * (1 - sm(0.42, 0.5, en)));
      armTo(q, 'armF', [64, -34], sm(0.5, 0.56, en) * (1 - sm(0.62, 0.68, en)));
      const a4 = sm(0.66, 0.74, en) * (1 - sm(0.86, 0.94, en));
      armTo(q, 'armF', [pnFrontAt(V, -112) - 6, -112], a4); armTo(q, 'armB', [pnFrontAt(V, -100) - 24, -96], a4); if (a4 > 0.3) { q.handF = 'fist'; q.handB = 'fist'; }
      A.head = (A.head || 0) - 0.1 * sm(0.9, 1, en); q.dy = (q.dy || 0) - 7 * Math.sin(PI * sm(0.86, 0.98, en));
    }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.4 * Math.sin(g * 1.6);
  }, (p) => (p.costume === 'lutin' ? 0.52 : 0.9));
  PNL.ventrePt = (r, dy) => { const v = pnV(r.q || {}), y = -50 + (dy || 0); return r.w('torso', pnFrontAt(v, y) + 2, y); };
  PNL.manchePt = (r) => r.w('armF_lo', 0, 60);

  // =====================================================================
  // 5) LE PUBLICITAIRE — 1930, mince et pressé : cheveux noirs gominés raie au milieu, fine moustache, trois-pièces gris perle à fines rayures,
  //    nœud papillon bordeaux, guêtres. Tient d'office le gros pinceau (main avant) et le pot rouge (main arrière).
  // =====================================================================
  const PU_SY = 1.06, PU_HIP = -Math.round(238 * PU_SY);
  const PU_TORSO = [[-14, -178], [8, -182], [17, -170], [25, -150], [29, -116], [30, -70], [29, -30], [30, 0], [31, 28, 1], [-33, 30, 1], [-34, 0], [-35, -60], [-35, -112], [-31, -150], [-24, -168]];
  const PU_HEAD = [[-12, 16], [9, 16], [10, 4], [14, -4], [20, -10], [24, -16], [23, -22], [25, -26], [24, -30], [27, -34], [38, -42, 1], [30, -48], [28, -56], [29, -66], [26, -80], [15, -94], [-6, -100], [-24, -92], [-32, -72], [-31, -48], [-24, -28], [-16, -6]];
  const PU_HAIR = [[30, -76], [31, -88], [22, -100], [4, -107], [-16, -105], [-30, -94], [-36, -74], [-35, -52], [-29, -46], [-26, -62], [-22, -77], [-6, -86], [14, -86], [26, -80]];
  const stripes = (x0, x1, y0, y1) => { for (let x = x0; x < x1; x += 7) strokePts([[x, y0], [x + 1, y1]], C.rayure, 0.8); };
  function mkPub() {
    const legO = { th: 0.86, sy: PU_SY, pant: () => C.perle, shoe: () => C.noir, by: () => 222,
      deco: (p, back, by) => { stripes(-30, 30, -20, 230); if (by) { fillPts([[-21, by - 24], [16, by - 26], [22, by - 8], [44, by - 1], [46, by + 2], [-21, by + 2]], back ? '#bdb8ac' : C.guetre); for (const y of [-18, -10]) dot(10, by + y, 1.8, '#6a665e'); } } };
    const deco = () => stripes(-24, 24, -20, 100);
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PU_TORSO, base: C.perle, seed: 8201, paint: () => {
        stripes(-40, 40, -190, 40);
        fillPts([[8, -182], [18, -172], [23, -150], [14, -140], [6, -160]], C.chemise);
        fillPts([[22, -100], [29, -70], [30, -32], [21, -32], [19, -70]], C.perleD); for (const y of [-84, -66, -48]) dot(24, y, 1.8, '#4a4842');
        fillPts([[14, -176], [26, -152], [30, -116], [22, -98], [17, -126], [10, -150]], C.perleD); strokePts([[26, -152], [30, -116], [22, -98]], 'rgba(255,255,255,0.4)', 1.1);
        fillPts([[-6, -126], [2, -136], [8, -126]], C.chemise); strokePts([[-10, -124], [10, -124]], 'rgba(40,40,40,0.5)', 1.1);
        strokePts([[-12, -30], [12, -32]], 'rgba(40,40,40,0.45)', 1.2); dot(27, -24, 2.4, '#4a4842');
        fillPts(rect(-40, 22, 40, 34), 'rgba(40,40,44,0.25)');
        hatch([[-40, -170], [-14, -170], [-14, 30], [-40, 30]], 0.75, 4.2, 0.26); shade(30, -60, -34, -40, 0.25, [-40, -190, 40, 34]);
      } },
      noeud: { parent: 'torso', at: [0, 0], noRivet: true, base: C.bordeaux, seed: 8202, pts: [[22, -164], [34, -173], [37, -158], [30, -160], [37, -146], [34, -140, 1], [22, -154]], paint: () => { dot(25, -159, 3.5, '#4a1218'); } },
      legB: legDef([-6, -2], 8203, true, legO), legF: legDef([6, -2], 8204, false, legO),
      armB_up: upDef([-10, -146], 8205, true, { wt: 15, manche: C.perleD, deco }),
      armB_lo: foreDef('armB_up', true, 8206, { manche: C.perleD, peau: '#c99c7e', deco, cuff: () => fillPts(rect(-16, 62, 16, 77), C.chemiseD) }),
      armF_up: upDef([-2, -146], 8207, false, { wt: 15, manche: C.perle, deco }),
      armF_lo: foreDef('armF_up', false, 8208, { manche: C.perle, peau: '#e6bf9e', deco, cuff: () => fillPts(rect(-16, 62, 16, 77), C.chemise) }),
      head: { parent: 'torso', at: [6, -170], pts: PU_HEAD, base: '#e6bf9e', seed: 8209, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-10, -44); hatch([[-30, -40], [-4, -28], [6, -6], [-10, 16], [-34, 4]], 0.6, 3.6, 0.28);
        X.eye(f, 18, -54); X.brow(f, 18, -62, 'rgba(20,16,16,0.95)', 2.2); X.mouth(f, 23, -22);
        fillPts([[18, -28], [26, -31], [31, -30], [27, -27], [20, -26]], C.gomina, 0, 0.2);
        strokePts([[22, -12], [16, -6]], 'rgba(150,100,80,0.4)', 1);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: C.gomina, seed: 8210, pts: PU_HAIR, paint: () => {
        strokePts(qbez([24, -92], [0, -103], [-26, -92], 10), 'rgba(205,215,235,0.5)', 2.6);
        strokePts(qbez([28, -84], [4, -92], [-30, -80], 10), 'rgba(205,215,235,0.28)', 1.6);
        strokePts(qbez([25, -101], [4, -108], [-14, -106], 8), '#e6bf9e', 1.4);
        for (let i = 0; i < 4; i++) strokePts(qbez([26 - i * 2, -80 - i * 5], [0, -88 - i * 4], [-30 + i * 2, -70 - i * 6], 8), 'rgba(0,0,0,0.5)', 1);
      } },
    };
    return defOf('publicitaire', parts, G_ADULTE, '#e6bf9e', '#c99c7e', 8240, ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'cheveux', 'torso', 'noeud'].concat(TAIL), PU_HIP);
  }
  CH.pnlPub = mkPub();
  PNL.publicitaire = wrap('pnlPub', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    const pe = kk(q, 'peint'), fi = kk(q, 'fier'), sl = kk(q, 'salue'), ge = kk(q, 'gene'), po = kk(q, 'pousse');
    if (q.tenu === undefined) q.tenu = ge > 0.5 ? 'rien' : 'pinceau';
    if (q.tenuB === undefined) q.tenuB = ge > 0.5 ? 'rien' : 'pot';
    expr(q, q.expr || (ge > 0.3 ? 'gene' : fi > 0.3 ? 'fier' : 'neutre'));
    if (q.tenu === 'pinceau' && !(pe > 0)) A.objet = (A.objet || 0) + 1.9;          // au repos les poils pointent vers l'avant-bas (sinon cachés derrière l'avant-bras)
    if (pe > 0) {
      q.tilt = (q.tilt || 0) + 0.04 * pe;
      const a = PI / 2 - 0.1, T0 = q.cible ? loc(q.cible) : [176, -150], st = 22 * Math.sin(g * 5);
      if (q.tenu === 'pinceau') A.objet = (A.objet || 0) + a * pe;
      const v = q.tenu === 'pinceau' ? tipVec('pinceau', q.tenuO, 'poils', a) : [0, 0];
      armTo(q, 'armF', [T0[0] - v[0], T0[1] - v[1] + st], pe); armTo(q, 'armB', [34, -60], pe * 0.8);
      if (!f.mouth) f.mouth = 'tight';
    }
    if (fi > 0) { q.tilt = (q.tilt || 0) - 0.05 * fi; q.dy = (q.dy || 0) - 3 * fi; A.head = (A.head || 0) - 0.14 * fi;
      armTo(q, 'armF', [128, -210], fi); armTo(q, 'armB', [70, -96], fi); if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
    if (sl > 0) { plier(q, 0.48 * sl); A.head = (A.head || 0) + 0.3 * sl; armTo(q, 'armF', [34, -70], sl); armTo(q, 'armB', [60, -20], sl); if (!f.eyes) f.eyes = 'closed'; }
    if (ge > 0) { q.dy = (q.dy || 0) + 4 * ge; A.head = (A.head || 0) + 0.16 * ge; armTo(q, 'armF', [44, -60], ge); armTo(q, 'armB', [36, -56], ge); }
    if (po > 0) { const w = Math.sin(g * 4.5); A.legF = (A.legF || 0) - (0.42 + 0.12 * w) * po; A.legB = (A.legB || 0) + 0.06 * po; q.tilt = (q.tilt || 0) - 0.05 * po;
      A.head = (A.head || 0) - 0.14 * po; armTo(q, 'armF', [34, -80], po); armTo(q, 'armB', [22, -70], po); if (!f.mouth) f.mouth = 'o'; if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'up'; }
    if (q.marche) { q.cadence = q.cadence || 1.6; q.tilt = (q.tilt || 0) + 0.04 * (q.marche === true ? 1 : q.marche); }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.2 * Math.sin(g * 1.9 + 1);
  }, 0.9);
  PNL.piedPt = (r) => r.w('legF', 50, 228 * PU_SY);   // bout du pied avant du publicitaire (geste pousse)

  // =====================================================================
  // 6) THOMAS NAST — dessinateur de presse 1863 : cheveux bruns courts à raie de côté, moustache et impériale, gilet brun,
  //    chemise blanche manches retroussées avec fixe-manches, plume. Tient d'office la plume (main avant).
  // =====================================================================
  const NA_SY = 1.04, NA_HIP = -Math.round(238 * NA_SY);
  const NA_TORSO = [[-15, -178], [8, -182], [18, -170], [27, -150], [32, -116], [33, -70], [32, -30], [32, 0], [32, 22, 1], [-35, 24, 1], [-36, 0], [-38, -60], [-38, -112], [-34, -150], [-26, -168]];
  const NA_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [23, -10], [27, -16], [27, -22], [29, -26], [28, -30], [31, -35], [36, -41, 1], [32, -47], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const NA_HAIR = [[29, -72], [35, -86], [26, -100], [6, -108], [-16, -105], [-32, -92], [-38, -70], [-37, -46], [-30, -40], [-26, -56], [-16, -66], [-12, -40], [-4, -34], [-6, -60], [-2, -76], [14, -80], [22, -74]];
  const NA_MOUST = [[20, -30], [29, -34], [36, -31], [39, -24], [35, -19], [29, -24], [22, -24], [16, -21], [14, -26]];
  const NA_IMP = [[21, -17], [28, -18], [29, -9], [27, 2], [23, 13], [20, 3], [19, -7]];
  function mkNast() {
    const legO = { th: 0.92, sy: NA_SY, assis: true, pant: () => C.pantN, shoe: () => C.noir, by: () => 216,
      deco: (p, back) => { for (let x = -40; x < 160; x += 12) strokePts([[x, -20], [x, 230]], 'rgba(120,110,96,0.22)', 0.9); for (let y = -20; y < 230; y += 12) strokePts([[-40, y], [160, y]], 'rgba(120,110,96,0.16)', 0.9); } };
    const fixe = () => { fillPts(rect(-22, 40, 22, 49), '#1e1a19'); strokePts([[-18, 42], [18, 42]], 'rgba(210,210,220,0.55)', 1); dot(6, 44.5, 2, '#9a9890'); };
    const roule = () => { fillPts(rect(-24, -20, 24, 16), C.chemise); for (const y of [-4, 6, 14]) strokePts([[-18, y], [16, y - 2]], 'rgba(120,110,96,0.5)', 1.1); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: NA_TORSO, base: C.chemise, seed: 8301, paint: () => {
        fillPts(rect(-60, 4, 60, 40), C.pantN);
        fillPts([[-42, -160], [-10, -172], [12, -160], [22, -126], [28, -100], [34, -60], [34, 8], [-42, 8]], C.gilet, 0, 0.3);
        strokePts([[12, -160], [22, -126], [28, -100], [34, -60]], 'rgba(255,230,190,0.3)', 1.2);
        for (const y of [-92, -70, -48, -26, -6]) { dot(28, y, 2.4, '#2e2016'); dot(27.4, y - 0.7, 0.9, 'rgba(255,230,190,0.6)'); }
        strokePts(qbez([12, -52], [22, -40], [31, -48], 6), C.or, 1.4); dot(12, -52, 2.4, C.orD);
        fillPts([[14, -172], [26, -168], [29, -158], [20, -160]], '#1e1a19');
        fillPts([[4, -182], [16, -176], [14, -168], [6, -172]], '#f6f2e8');
        hatch([[-42, -166], [-14, -166], [-14, 24], [-42, 24]], 0.75, 4.2, 0.3); shade(33, -60, -38, -40, 0.25, [-42, -190, 40, 26]);
      } },
      legB: legDef([-6, -2], 8302, true, legO), legF: legDef([6, -2], 8303, false, legO),
      armB_up: upDef([-10, -146], 8304, true, { wt: 16, manche: C.chemiseD, deco: fixe }),
      armB_lo: foreDef('armB_up', true, 8305, { manche: '#c4997a', peau: '#c4997a', deco: roule }),
      armF_up: upDef([-2, -146], 8306, false, { wt: 16, manche: C.chemise, deco: fixe }),
      armF_lo: foreDef('armF_up', false, 8307, { manche: '#e2b896', peau: '#e2b896', deco: roule }),
      head: { parent: 'torso', at: [6, -170], pts: NA_HEAD, base: '#e2b896', seed: 8308, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44); hatch([[-30, -40], [-2, -28], [8, -6], [-10, 16], [-34, 4]], 0.6, 3.6, 0.28);
        X.eye(f, 17, -53); X.brow(f, 17, -61, 'rgba(70,44,26,0.95)', 2.6); X.mouth(f, 26, -21);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: '#33231a', seed: 8309, pts: NA_HAIR, paint: () => {
        strokePts(qbez([20, -86], [2, -91], [-22, -86], 8), 'rgba(235,205,175,0.75)', 1.3);
        for (let i = 0; i < 4; i++) strokePts(qbez([30 - i * 3, -84 + i * 3], [6, -100 + i * 4], [-30 + i * 2, -86 + i * 5], 8), 'rgba(30,18,10,0.45)', 1.1);
        strokePts(qbez([32, -84], [24, -98], [6, -103], 6), 'rgba(170,120,80,0.5)', 1.6); strokePts([[-9, -62], [-8, -40]], 'rgba(120,90,60,0.6)', 1.1);
      } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: '#4a2e1a', seed: 8310, pts: NA_MOUST, paint: () => { for (const x of [20, 27, 34]) strokePts([[x - 3, -31], [x + 1, -23]], 'rgba(150,110,80,0.5)', 1); } },
      imperiale: { parent: 'head', at: [0, 0], noRivet: true, base: '#4a2e1a', seed: 8311, pts: NA_IMP, paint: () => { for (const x of [22, 25]) strokePts([[x, -14], [x - 1, 8]], 'rgba(150,110,80,0.5)', 1); } },
    };
    return defOf('nast', parts, G_ADULTE, '#e2b896', '#c4997a', 8340, ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'cheveux', 'moustache', 'imperiale', 'torso'].concat(TAIL), NA_HIP);
  }
  CH.pnlNast = mkNast();
  PNL.nast = wrap('pnlNast', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    const de = kk(q, 'dessine'), mo = kk(q, 'montre'), su = kk(q, 'surpris');
    if (q.tenu === undefined) q.tenu = mo > 0 ? 'feuille' : 'plume';
    if (q.tenu === 'plume' && !(de > 0)) A.objet = (A.objet || 0) + 0.7;           // au repos la plume pointe vers l'avant (sinon cachée derrière l'avant-bras)
    if (q.assis) { q.dy = (q.dy || 0) + 118 * NA_SY; if (!(de > 0) && !(mo > 0)) { armTo(q, 'armF', [78, -10], 1); armTo(q, 'armB', [64, -8], 1); if (!has(q.tenu)) q.handF = 'open'; q.handB = 'open'; } }
    if (de > 0) {
      const a = -0.2, T0 = q.cible ? loc(q.cible) : [120, -44], v = q.tenu === 'plume' ? tipVec('plume', q.tenuO, 'bec', a) : [0, 0];
      if (q.tenu === 'plume') A.objet = (A.objet || 0) + a * de;
      armTo(q, 'armF', [T0[0] - v[0] + 5 * Math.sin(g * 7), T0[1] - v[1] + 3 * Math.sin(g * 11)], de);
      armTo(q, 'armB', [T0[0] - 46, T0[1] + 4], de); q.handB = 'open';
      A.head = (A.head || 0) + 0.32 * de; if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'frown';
    }
    if (mo > 0) {
      if (q.tenu === 'feuille' && q.deuxMains == null) q.deuxMains = true;
      armTo(q, 'armF', [178, -176], mo); A.head = (A.head || 0) - 0.04 * mo; if (!f.mouth) f.mouth = 'smile';
    }
    if (su > 0) { if (!q.assis) q.tilt = (q.tilt || 0) - 0.08 * su; A.head = (A.head || 0) - 0.12 * su; armTo(q, 'armF', [104, -196], su); if (!(q.deuxMains && mo > 0)) armTo(q, 'armB', [74, -206], su);
      if (!has(q.tenu)) q.handF = 'open'; q.handB = 'open'; if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o'; }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.2 * Math.sin(g * 1.7 + 2);
  }, 0.9);

  // =====================================================================
  // 7) HADDON SUNDBLOM — peintre 1931, costaud et souriant : visage rond rasé, cheveux blond-roux plaqués, blouse bleu ardoise tachée,
  //    lavallière verte. Tient d'office le pinceau fin (main avant) et la palette (main arrière).
  // =====================================================================
  const SU_SY = 1.03, SU_HIP = -Math.round(238 * SU_SY);
  const SU_TORSO = [[-18, -180], [8, -186], [22, -174], [34, -154], [44, -124], [50, -86], [52, -50], [52, -14], [54, 30], [58, 80, 1], [-54, 82, 1], [-52, 30], [-50, -10], [-52, -60], [-52, -112], [-46, -152], [-34, -172]];
  const SU_HEAD = [[-18, 16], [12, 16], [18, 6], [24, -2], [30, -10], [33, -18], [32, -24], [34, -28], [33, -32], [36, -36], [41, -42, 1], [37, -48], [34, -56], [34, -68], [30, -82], [18, -96], [-4, -102], [-26, -95], [-38, -76], [-40, -50], [-34, -24], [-26, -4]];
  const SU_HAIR = [[32, -80], [30, -93], [20, -103], [2, -109], [-18, -107], [-34, -95], [-42, -75], [-42, -52], [-36, -46], [-34, -62], [-26, -78], [-6, -87], [16, -89], [28, -84]];
  const SU_LAV = [[20, -172], [40, -184], [47, -168], [37, -160], [48, -150], [42, -136], [46, -108], [37, -106], [31, -138], [27, -114], [18, -112], [22, -148]];
  const TACHES = [[30, -100, C.rouge, 5], [12, -60, '#c99a3a', 4], [40, -20, C.four, 3.5], [-20, -120, '#4f7a4a', 3], [20, 30, C.rouge, 6], [-30, 10, '#c99a3a', 3.5], [44, 50, '#2e3a5a', 3], [0, -140, C.four, 2.6], [-8, 56, C.rouge, 3]];
  function mkSundblom() {
    const legO = { th: 1.02, sy: SU_SY, pant: () => C.pantS, shoe: () => '#3a2618', by: () => 216 };
    const tache = (p, back) => { if (!back) { dot(6, 30, 3, C.rouge); dot(-8, 70, 2.4, '#c99a3a'); } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: SU_TORSO, base: C.ardoise, seed: 8401, paint: () => {
        strokePts([[-52, -142], [40, -142]], 'rgba(20,26,36,0.4)', 1.2);
        for (let x = -40; x < 46; x += 11) strokePts(qbez([x, -140], [x + 3, -40], [x + 6, 80], 6), 'rgba(20,26,36,0.22)', 1.2);
        for (const [x, y, col, r] of TACHES) fillPts(bumpy(ell(x, y, r, r * 0.8, 8), 1, 3), col, x + y, 0.4);
        fillPts([[2, -186], [16, -180], [14, -170], [4, -174]], C.four);
        hatch([[-58, -170], [-20, -170], [-20, 82], [-58, 82]], 0.75, 4.2, 0.26); shade(52, -60, -52, -40, 0.3, [-60, -190, 60, 84]);
      } },
      lavalliere: { parent: 'torso', at: [0, 0], noRivet: true, base: C.vertL, seed: 8402, pts: SU_LAV, paint: () => { strokePts([[24, -166], [40, -178]], 'rgba(200,240,190,0.35)', 1.4); dot(30, -160, 4, '#36552f'); strokePts([[33, -140], [40, -110]], 'rgba(20,40,20,0.4)', 1.2); } },
      legB: legDef([-8, -2], 8403, true, legO), legF: legDef([8, -2], 8404, false, legO),
      armB_up: upDef([-10, -146], 8405, true, { wt: 18, manche: C.ardoiseD }),
      armB_lo: foreDef('armB_up', true, 8406, { manche: C.ardoiseD, peau: '#cf9f80', cuff: () => fillPts(rect(-18, 62, 18, 78), '#3e4d5e') }),
      armF_up: upDef([-2, -146], 8407, false, { wt: 18, manche: C.ardoise, deco: tache }),
      armF_lo: foreDef('armF_up', false, 8408, { manche: C.ardoise, peau: '#ecbf9c', deco: tache, cuff: () => fillPts(rect(-18, 62, 18, 78), C.ardoiseD) }),
      head: { parent: 'torso', at: [6, -170], pts: SU_HEAD, base: '#ecbf9c', seed: 8409, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-12, -44); hatch([[-36, -40], [-6, -28], [4, -6], [-12, 16], [-40, 4]], 0.6, 3.6, 0.24);
        dot(24, -32, 11, 'rgba(214,112,100,0.4)'); strokePts(qbez([14, 8], [26, -2], [32, -10], 5), 'rgba(160,100,80,0.5)', 1.3);
        X.eye(f, 21, -56, 1.05); X.brow(f, 21, -64, 'rgba(150,90,50,0.95)', 2.8);
        if ((f.eyes || 'open') !== 'wide') strokePts(qbez([14, -49], [22, -45], [29, -49], 5), 'rgba(150,90,70,0.5)', 1.1);
        const m = f.mouth || 'smile';
        if (m === 'smile') { fillPts([[34, -24], [30, -17], [22, -15], [17, -19], [24, -18], [30, -20]], '#5a2622', 0, 0); strokePts([[30, -17], [22, -14]], '#e8d8c8', 1.2); }
        else X.mouth(f, 30, -20);
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: C.roux, seed: 8410, pts: SU_HAIR, paint: () => {
        for (let i = 0; i < 6; i++) strokePts(qbez([30 - i * 2, -86 - i * 3], [0, -96 - i * 2], [-38 + i, -70 - i * 4], 8), i % 2 ? 'rgba(90,50,20,0.45)' : 'rgba(250,210,150,0.4)', 1.2);
      } },
    };
    return defOf('sundblom', parts, G_ADULTE, '#ecbf9c', '#cf9f80', 8440, ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'cheveux', 'torso', 'lavalliere'].concat(TAIL), SU_HIP);
  }
  CH.pnlSundblom = mkSundblom();
  PNL.sundblom = wrap('pnlSundblom', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0, g = M.tg(t);
    const pe = kk(q, 'peint'), re = kk(q, 'recule'), pr = kk(q, 'presente');
    if (q.tenu === undefined) q.tenu = 'pinceauFin';
    if (q.tenuB === undefined) q.tenuB = 'palette';
    expr(q, q.expr || 'jovial');
    if (q.tenu === 'pinceauFin' && !(pe > 0)) A.objet = (A.objet || 0) + 0.6;
    if (re > 0) { q.dx = (q.dx || 0) - 16 * re; q.tilt = (q.tilt || 0) - 0.05 * re; A.legB = (A.legB || 0) + 0.24 * re; A.legF = (A.legF || 0) - 0.12 * re; A.head = (A.head || 0) + 0.14 * re;
      const Ch = headPt(q, 30, 6); armTo(q, 'armF', [Ch[0] + 26, Ch[1] + 62], re); armTo(q, 'armB', [36, -70], re); if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'n'; }
    if (pe > 0) {
      const a = PI / 2 - 0.25, T0 = q.cible ? loc(q.cible) : [178, -150], st = 5 * Math.sin(g * 6);
      if (q.tenu === 'pinceauFin') A.objet = (A.objet || 0) + a * pe;
      const v = q.tenu === 'pinceauFin' ? tipVec('pinceauFin', q.tenuO, 'pointe', a) : [0, 0];
      armTo(q, 'armF', [T0[0] - v[0] - Math.abs(st), T0[1] - v[1]], pe); armTo(q, 'armB', [30, -90], pe); q.tilt = (q.tilt || 0) + 0.03 * pe;
    }
    if (pr > 0) { armTo(q, 'armF', [150, -120], pr); if (!has(q.tenu)) q.handF = 'open'; A.head = (A.head || 0) - 0.06 * pr; if (!f.mouth) f.mouth = 'smile'; }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.4 * Math.sin(g * 1.5 + 0.5);
  }, 0.9);

  // =====================================================================
  // 8) ACCESSOIRES SEULS (sans tige) : même dessin que tenus. (x,y) = point `base` de l'objet ; o.dir, o.rot, o.alpha, o.cast, o.ombre, o.t
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name]; o = o || {};
    if (o.ang != null && o.rot == null) o = Object.assign({}, o, { rot: o.ang });
    return M.puppet(accDef('o_' + name, (oo) => { const b = ptOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(Object.assign({ t: oo.t || 0 }, oo)); c.restore(); }),
      { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function locPt(px, py, x, y, s, o) { o = o || {}; const d = o.dir || 1, r = o.rot != null ? o.rot : o.ang || 0, X0 = px * s * d, Y0 = py * s; return [x + X0 * Math.cos(r) - Y0 * Math.sin(r) * d, y + X0 * Math.sin(r) * d + Y0 * Math.cos(r)]; }
  PNL.accPt = function (name, x, y, s, o, nom) { const ob = OBJ[name], oo = o || {}, b = ptOf(ob.base, oo), q = ob.pts[nom] ? ptOf(ob.pts[nom], oo) : nom === 'prise' ? gripOf(ob, oo) : [0, 0]; return locPt(q[0] - b[0], q[1] - b[1], x, y, s == null ? 1 : s, oo); };
  for (const n of ['pinceau', 'pinceauFin', 'pot', 'palette', 'plume', 'feuille', 'brune', 'claire']) PNL[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // ---- éphéméride murale : carton vert sapin à houx, bloc de feuillets crème ; chaque feuillet porte une petite gravure (soleil, flocon, feuille, cloche), AUCUN chiffre.
  //      (x,y) = centre du bloc. o.page (motif du dessus, entier), o.effeuille = { t0, sens (1 : vers le bas en avant | -1 : vers le haut, à l'envers), vitesse (feuillets/s), n }, o.tremble 0..1, o.t
  const EB = { x0: -66, x1: 66, y0: -52, y1: 90 };
  function motif(i, cx, cy, k) {
    i = ((i % 4) + 4) % 4;
    if (i === 0) { for (let a = 0; a < 12; a++) { const u = a / 12 * TAU; strokePts([[cx + Math.cos(u) * 20 * k, cy + Math.sin(u) * 20 * k], [cx + Math.cos(u) * 30 * k, cy + Math.sin(u) * 30 * k]], '#a8842e', 2.2); }
      fillPts(ell(cx, cy, 16 * k, 16 * k, 16), '#d2a944', 0, 0); dot(cx - 5 * k, cy - 5 * k, 4 * k, 'rgba(255,240,200,0.6)'); }
    else if (i === 1) { for (let a = 0; a < 6; a++) { const u = a * PI / 3, ex = cx + Math.cos(u) * 28 * k, ey = cy + Math.sin(u) * 28 * k; strokePts([[cx, cy], [ex, ey]], '#4f6f92', 2.4);
      for (const s of [-1, 1]) { const mx = cx + Math.cos(u) * 17 * k, my = cy + Math.sin(u) * 17 * k; strokePts([[mx, my], [mx + Math.cos(u + s * 0.8) * 9 * k, my + Math.sin(u + s * 0.8) * 9 * k]], '#4f6f92', 1.8); } } dot(cx, cy, 3.5 * k, '#4f6f92'); }
    else if (i === 2) { fillPts([[cx, cy + 30 * k], [cx - 6 * k, cy + 10 * k], [cx - 24 * k, cy - 4 * k], [cx - 14 * k, cy - 10 * k], [cx - 20 * k, cy - 26 * k], [cx - 4 * k, cy - 18 * k], [cx, cy - 32 * k], [cx + 4 * k, cy - 18 * k], [cx + 20 * k, cy - 26 * k], [cx + 14 * k, cy - 10 * k], [cx + 24 * k, cy - 4 * k], [cx + 6 * k, cy + 10 * k]], '#a2602c', 0, 0.3);
      strokePts([[cx, cy + 32 * k], [cx, cy - 24 * k]], 'rgba(70,30,10,0.7)', 1.4); }
    else { fillPts([[cx - 4 * k, cy - 26 * k], [cx + 4 * k, cy - 26 * k], [cx + 14 * k, cy - 14 * k], [cx + 18 * k, cy + 10 * k], [cx + 26 * k, cy + 20 * k], [cx - 26 * k, cy + 20 * k], [cx - 18 * k, cy + 10 * k], [cx - 14 * k, cy - 14 * k]], '#c4a04a', 0, 0.3);
      dot(cx, cy + 25 * k, 5 * k, '#8e6c26'); strokePts([[cx - 10 * k, cy - 10 * k], [cx - 14 * k, cy + 14 * k]], 'rgba(255,240,200,0.6)', 1.6);
      for (const s of [-1, 1]) fillPts([[cx, cy - 30 * k], [cx + s * 14 * k, cy - 38 * k], [cx + s * 8 * k, cy - 28 * k]], '#2f5a36', 0, 0.2); dot(cx, cy - 30 * k, 3.5 * k, '#9b2226'); }
  }
  function feuillet(i, alpha) {
    const c = cx_(); if (alpha != null) { c.save(); c.globalAlpha *= alpha; }
    pc([[EB.x0, EB.y0, 1], [EB.x1, EB.y0, 1], [EB.x1, EB.y1, 1], [EB.x0, EB.y1, 1]], '#efe6cf', () => {
      strokePts(rect(EB.x0 + 9, EB.y0 + 12, EB.x1 - 9, EB.y1 - 9), 'rgba(110,80,50,0.55)', 1.2, true);
      strokePts(rect(EB.x0 + 13, EB.y0 + 16, EB.x1 - 13, EB.y1 - 13), 'rgba(110,80,50,0.3)', 0.8, true);
      motif(i, 0, 22, 1.25); hatch(null, 0.9, 7, 0.06);
    }, 9301 + (((i % 4) + 4) % 4), { drop: false });
    if (alpha != null) c.restore();
  }
  const HOUX = (cx, cy, a) => { const o = []; for (let i = 0; i <= 8; i++) { const u = i / 8, w = Math.sin(u * PI) * 11 * (i % 2 ? 1.3 : 0.85); o.push([u * 40, -w]); } for (let i = 8; i >= 0; i--) { const u = i / 8, w = Math.sin(u * PI) * 11 * (i % 2 ? 1.3 : 0.85); o.push([u * 40, w]); }
    return o.map((p) => [cx + p[0] * Math.cos(a) - p[1] * Math.sin(a), cy + p[0] * Math.sin(a) + p[1] * Math.cos(a)]); };
  function drawEphemeride(o) {
    const t = o.t || 0, g = M.tg(t), tb = clamp(o.tremble || 0), c = cx_(), E = o.effeuille, p0 = o.page || 0;
    let m = 0, sens = 1;
    const vols = [];
    if (E) { const v = E.vitesse || 2, n = E.n == null ? 99 : E.n, t0 = E.t0 || 0; sens = E.sens === -1 ? -1 : 1; const u = (t - t0) * v;
      m = u < 0 ? 0 : Math.min(n, Math.floor(u) + 1);
      for (let j = 0; j < m; j++) { const tj = t0 + j / v, du = t - tj; if (du >= 0 && du < 1.7) vols.push({ j, du }); } }
    c.save(); c.rotate(0.035 * tb * Math.sin(g * 38) + 0.012 * tb * Math.sin(g * 23));
    strokePts([[-60, -150], [0, -186], [60, -150]], 'rgba(40,30,20,0.85)', 1.4); dot(0, -186, 3.4, '#8a7a5a');
    pc([[-96, -150, 1], [96, -150, 1], [98, 112, 1], [-98, 112, 1]], '#2e4a36', () => {
      strokePts(rect(-88, -142, 88, 104), 'rgba(200,180,120,0.5)', 1.6, true); hatch(null, 0.8, 5, 0.18, 1, M.P.encre, [-100, -160, 100, 120]);
      fillPts(rect(-78, 96, 78, 104), 'rgba(10,20,14,0.35)');
    }, 9311);
    for (const [x, y, a] of [[-34, -112, -2.6], [-30, -108, -0.4], [8, -118, -1.9], [12, -110, 0.2], [-6, -102, 1.6]]) pc(HOUX(x, y, a), '#2a5a32', () => strokePts([[x, y], [x + Math.cos(a) * 36, y + Math.sin(a) * 36]], 'rgba(200,230,180,0.5)', 1), 9320 + x, { drop: false });
    for (const [x, y] of [[-14, -112], [-6, -118], [-4, -106], [-20, -104]]) { dot(x, y, 6, '#9b2226'); dot(x - 2, y - 2, 1.8, 'rgba(255,220,210,0.7)'); }
    const ep_ = Math.max(1, 6 - m * 0.15);
    for (let k = Math.ceil(ep_); k >= 1; k--) fillPts(rect(EB.x0 + 2, EB.y1 + k * 2 - 2, EB.x1 - 2, EB.y1 + k * 2), k % 2 ? '#d8cdb0' : '#c4b896', 0, 0);
    const top = p0 + sens * m;
    c.save(); if (tb > 0) { const fl = 0.04 * tb * Math.sin(g * 31); c.transform(1, 0, fl, 1, -fl * EB.y0, 0); } feuillet(top); c.restore();
    pc(rect(EB.x0 - 4, EB.y0 - 10, EB.x1 + 4, EB.y0 + 2), '#4a3a2a', () => { for (let x = EB.x0; x < EB.x1; x += 12) dot(x + 4, EB.y0 - 4, 2, '#8e8670'); }, 9312);
    for (const V of vols) {                                  // feuillets qui s'envolent
      const u = V.du, side = hash(V.j * 3.1) > 0.5 ? 1 : -1, pel = sm(0, 0.18, u), fly = Math.max(0, u - 0.12);
      const x = side * (30 * fly + 40 * fly * fly) + 14 * Math.sin(fly * 7 + V.j), y = sens > 0 ? 240 * fly * fly + 90 * fly : -(260 * fly * fly + 120 * fly);
      const r = side * (1.6 * fly + 0.25 * pel) * (sens > 0 ? 1 : -1), sc = sens > 0 ? 1 + 0.35 * fly : 1 - 0.2 * fly, fl = Math.cos(fly * 9 + V.j);
      c.save(); c.translate(x, EB.y0 + y); c.rotate(r); c.scale(sc * (0.35 + 0.65 * Math.abs(fl)), sc * (1 - 0.25 * pel * (sens > 0 ? 0 : 1))); c.translate(0, -EB.y0);
      feuillet(p0 + sens * V.j, 1 - sm(1.1, 1.7, u)); c.restore();
    }
    c.restore();
  }
  OBJ.ephemeride = { draw: drawEphemeride, grip: [0, 0], pts: { centre: [0, 0], haut: [0, -150], bloc: [0, 20] }, base: [0, 0] };
  PNL.ephemeride = (x, y, s, o) => acc('ephemeride', x, y, s == null ? 1 : s, o);

  // ---- chevalet de bois + grande toile vue DE FACE (jamais en miroir). (x,y) = pied au sol (milieu).
  //      o.etat 0..1 (toile vierge → Père Noël rouge souriant tenant une bouteille brune), o.vide (sans toile), o.bouteille ('brune' défaut | 'claire' | null)
  const CHV = { tab: -196, w: 300, h: 380 }; CHV.cy = CHV.tab - CHV.h / 2;
  function drawChevalet(o) {
    const c = cx_(); c.save(); if (flipped()) c.scale(-1, 1);
    pc(bar([0, -470], [0, 0], 12), C.boisD, () => hatch(null, 1.5, 4, 0.3, 1, M.P.encre, [-20, -480, 20, 10]), 9401);
    for (const s of [-1, 1]) pc(bar([s * 22, -640], [s * 122, 0], 15), C.bois, () => { strokePts([[s * 18, -630], [s * 116, -6]], 'rgba(255,220,170,0.3)', 1.4); hatch(null, 1.4, 4, 0.2, 1, M.P.encre, [-140, -650, 140, 10]); }, 9402 + s);
    pc(bar([-108, -120], [108, -120], 10), C.bois, null, 9404);
    pc(bar([0, -668], [0, CHV.tab + 6], 15), C.boisL, () => { for (let y = -640; y < -220; y += 40) dot(4, y, 1.8, 'rgba(60,40,20,0.6)'); }, 9405);
    pc(rect(-172, CHV.tab - 4, 172, CHV.tab + 14), C.bois, () => strokePts([[-170, CHV.tab - 2], [170, CHV.tab - 2]], 'rgba(255,220,170,0.4)', 1.4), 9406);
    if (!o.vide) {
      pc(rect(-CHV.w / 2, CHV.tab - CHV.h, CHV.w / 2, CHV.tab), '#ece5d4', () => {
        c.save(); c.translate(0, CHV.cy); c.scale(CHV.w / 300, CHV.h / 380); tableauNoel({ etat: o.etat == null ? 0 : o.etat, couleur: 1, bouteille: o.bouteille === undefined ? 'brune' : o.bouteille }); c.restore();
        hatch(null, 0.9, 6, 0.05, 1, M.P.encre, [-160, -600, 160, -180]);
      }, 9407);
      strokePts(rect(-CHV.w / 2 + 3, CHV.tab - CHV.h + 3, CHV.w / 2 - 3, CHV.tab - 3), 'rgba(90,70,50,0.35)', 1.2, true);
      pc(rect(-34, CHV.tab - CHV.h - 14, 34, CHV.tab - CHV.h + 6), C.boisL, null, 9408);
    }
    c.restore();
  }
  OBJ.chevalet = { draw: drawChevalet, grip: [0, -300], pts: { centre: [0, CHV.cy], visage: [0, CHV.cy - 36], manteau: [0, CHV.cy + 110], bouteille: [-90, CHV.cy - 38], haut: [0, CHV.tab - CHV.h], bas: [0, CHV.tab] }, base: [0, 0] };
  PNL.chevalet = (x, y, s, o) => acc('chevalet', x, y, s == null ? 1 : s, o);
  PNL.chevaletPt = (x, y, s, o, nom) => { const q = OBJ.chevalet.pts[nom || 'centre'] || [0, CHV.cy]; s = s == null ? 1 : s; return [x + q[0] * s, y + q[1] * s]; };

  // =====================================================================
  // 9) DÉCOR « ATELIER DE NAST » (1863-1870) : PNL.atelierNast(t, o) AVANT M.drawFloor(), PNL.atelierNastSol(t, o) juste APRÈS.
  //    o.couleur 0..1 (0 = camaïeu de gris de gravure, 1 = couleurs chaudes) ; o.poleNord 0..1 (toile « pôle Nord » qui descend des cintres derrière la table) ;
  //    o.page 0..1 (une page de la corde se décroche à moitié et pendouille) ; o.chat 0..1 (le chat gris traverse l'étagère de gauche à droite)
  // =====================================================================
  const AT = { fenL: [110, 390], fenR: [690, 970], fenY: [250, 680], table: { x0: 640, x1: 862, yb: 1172, yh: 1092 }, feuille: [700, 1150], lampe: [902, 1044],
    tabouret: { x: 560, siege: 1308 }, etagere: { x0: 690, x1: 935, y: 880 }, corde: { x0: 40, x1: 1040, y: 515, fl: 64 }, poele: { x: 990, porte: [990, 1290] },
    presse: { x0: 40, x1: 260 }, pierre: { x0: 50, x1: 236, y: 1252 }, poleNord: { cx: 600, w: 440, h: 500, bas: 1100 } };
  PNL.ATELIER = AT;
  function briques(x0, y0, x1, y1, seed, c1, c2) {
    const R = M.rng(seed);
    for (let y = y0, r = 0; y < y1; y += 26, r++) for (let x = x0 - (r % 2 ? 30 : 0); x < x1; x += 60) fillPts(rect(x + 2, y + 2, x + 58, y + 24), mixA(c1, c2, R()), 0, 0.5);
  }
  function fenetre(x0, x1, y0, y1, seed, ciel, ville) {
    const c = cx_(), g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, ciel[0]); g.addColorStop(1, ciel[1]); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    const R = M.rng(seed);
    for (let x = x0 - 10; x < x1; ) { const w = 30 + R() * 50, h = 60 + R() * 120; fillPts(rect(x, y1 - h, x + w, y1), ville[0], x, 0.4);
      if (R() > 0.5) fillPts(rect(x + w * 0.3, y1 - h - 22, x + w * 0.3 + 10, y1 - h), ville[0]);
      for (let k = 0; k < 3; k++) if (R() > 0.55) fillPts(rect(x + 6 + k * 12, y1 - h + 14, x + 12 + k * 12, y1 - h + 24), ville[2]);
      x += w + 2; }
    const sx = lerp(x0, x1, 0.62); fillPts([[sx - 14, y1 - 150], [sx, y1 - 250], [sx + 14, y1 - 150], [sx + 14, y1], [sx - 14, y1]], ville[1]);
    for (let x = x0; x <= x1; x += (x1 - x0) / 4) pc(bar([x, y0], [x, y1], x === x0 || Math.abs(x - x1) < 1 ? 12 : 6), '#2a2a2e', null, 9500 + x, { drop: false });
    for (let y = y0; y <= y1 + 1; y += (y1 - y0) / 6) pc(bar([x0, y], [x1, y], y === y0 || Math.abs(y - y1) < 1 ? 12 : 6), '#2a2a2e', null, 9600 + y, { drop: false });
    pc(rect(x0 - 20, y1 + 4, x1 + 20, y1 + 22), '#8a8478', () => strokePts([[x0 - 18, y1 + 6], [x1 + 18, y1 + 6]], 'rgba(255,255,255,0.35)', 1.4), 9700 + x0);
  }
  function makeAtFond() {
    return M.pre(W, BACK + 40, (c) => {
      c.fillStyle = '#7d6c5c'; c.fillRect(0, 0, W, BACK + 40);
      briques(-30, 150, W + 30, BACK + 20, 31, '#7e4a38', '#5c3529');
      const sh = c.createLinearGradient(0, 150, 0, BACK); sh.addColorStop(0, 'rgba(20,12,8,0.55)'); sh.addColorStop(0.25, 'rgba(20,12,8,0.08)'); sh.addColorStop(1, 'rgba(20,12,8,0.35)'); c.fillStyle = sh; c.fillRect(0, 150, W, BACK - 150);
      for (const [x0, x1] of [AT.fenL, AT.fenR]) fenetre(x0, x1, AT.fenY[0], AT.fenY[1], x0, ['#b8c4cc', '#dfe2de'], ['#5d6670', '#4e5660', '#e8d49a']);
      pc(rect(-10, 150, W + 10, 206), '#4a3626', () => { for (let x = 0; x < W; x += 90) strokePts([[x, 152], [x + 40, 204]], 'rgba(0,0,0,0.25)', 1.2); strokePts([[0, 202], [W, 202]], 'rgba(255,230,190,0.25)', 2); }, 9801);
      // presse à bras (fonte noire) au fond à gauche
      const P = AT.presse;
      pc(rect(P.x0 - 10, 1262, P.x1 + 50, 1282), '#2c2d30', null, 9802);
      for (const x of [P.x0 + 30, P.x1 - 30]) pc(bar([x, 1000], [x, BACK], 22), '#2c2d30', () => strokePts([[x - 6, 1004], [x - 6, BACK]], 'rgba(200,200,210,0.25)', 1.4), 9803 + x);
      pc([[P.x0 + 8, 996, 1], [P.x1 - 8, 996, 1], [P.x1 - 8, 1030, 1], [P.x0 + 8, 1030, 1]], '#26272a', () => { strokePts([[P.x0 + 10, 999], [P.x1 - 10, 999]], 'rgba(200,200,210,0.35)', 1.2); for (const x of [P.x0 + 40, P.x1 - 40]) dot(x, 1013, 4, '#5a5a5e'); }, 9805);
      pc([[(P.x0 + P.x1) / 2 - 18, 996], [(P.x0 + P.x1) / 2 - 10, 972], [(P.x0 + P.x1) / 2, 962], [(P.x0 + P.x1) / 2 + 10, 972], [(P.x0 + P.x1) / 2 + 18, 996]], '#3a3b3e', null, 9811);
      pc(rect(P.x0 + 48, 1150, P.x1 - 48, 1186), '#3a3b3e', () => strokePts([[P.x0 + 50, 1152], [P.x1 - 50, 1152]], 'rgba(220,220,230,0.35)', 1.2), 9806);
      pc(bar([(P.x0 + P.x1) / 2, 1030], [(P.x0 + P.x1) / 2, 1150], 14), '#3a3b3e', null, 9807);
      pc(bar([P.x1 - 40, 1120], [P.x1 + 70, 1060], 10), '#2c2d30', null, 9808); pc(ell(P.x1 + 74, 1058, 10, 10, 12), '#4a3626', null, 9809);
      // tuyau du poêle (monte au plafond)
      pc(bar([AT.poele.x, 210], [AT.poele.x, 1150], 30), '#2a2a2c', () => { for (let y = 260; y < 1150; y += 120) fillPts(rect(AT.poele.x - 17, y, AT.poele.x + 17, y + 6), '#3c3c40'); strokePts([[AT.poele.x - 8, 214], [AT.poele.x - 8, 1148]], 'rgba(200,200,210,0.2)', 2); }, 9810);
      for (const x of [AT.corde.x0, AT.corde.x1]) { dot(x, AT.corde.y, 6, '#3a3028'); dot(x, AT.corde.y, 2.5, '#8a7a5a'); }
    });
  }
  function makeAtMilieu() {
    return M.pre(W, BACK + 40, (c) => {
      // pierre lithographique sur son bâti
      const S = AT.pierre;
      for (const x of [S.x0 + 12, S.x1 - 12]) pc(bar([x, S.y + 40], [x, BACK], 14), C.boisD, null, 9901 + x);
      pc(rect(S.x0 - 6, S.y + 40, S.x1 + 6, S.y + 56), C.bois, null, 9903);
      pc([[S.x0, S.y + 40, 1], [S.x0 + 4, S.y, 1], [S.x1 - 4, S.y, 1], [S.x1, S.y + 40, 1]], '#c9bf9a', () => {
        fillPts([[S.x0 + 10, S.y + 6], [S.x1 - 10, S.y + 6], [S.x1 - 12, S.y + 14], [S.x0 + 12, S.y + 14]], '#a8a088');
        hatch([[S.x0, S.y + 14], [S.x1, S.y + 14], [S.x1, S.y + 40], [S.x0, S.y + 40]], 0.3, 5, 0.2);
      }, 9904);
      // étagère et flacons d'encre (+ pot de plumes)
      const E = AT.etagere;
      pc(rect(E.x0, E.y, E.x1, E.y + 12), C.bois, () => strokePts([[E.x0, E.y + 2], [E.x1, E.y + 2]], 'rgba(255,220,170,0.4)', 1.2), 9905);
      for (const x of [E.x0 + 20, E.x1 - 20]) pc([[x - 4, E.y + 12], [x + 4, E.y + 12], [x + 4, E.y + 48], [x - 30, E.y + 14]], C.boisD, null, 9906 + x);
      const fl = [[E.x0 + 30, '#1e1a22', 22, 30], [E.x0 + 62, '#2e3a6a', 16, 40], [E.x0 + 92, '#8a2030', 20, 26], [E.x0 + 124, '#6a4a2a', 14, 44], [E.x0 + 196, '#2f5a36', 18, 30], [E.x0 + 224, '#1e1a22', 12, 22]];
      for (const [x, col, w, h] of fl) pc([[x - w / 2, E.y], [x - w / 2, E.y - h + 8], [x - 4, E.y - h + 4], [x - 4, E.y - h - 4], [x + 4, E.y - h - 4], [x + 4, E.y - h + 4], [x + w / 2, E.y - h + 8], [x + w / 2, E.y]], col, () => strokePts([[x - w / 2 + 3, E.y - 4], [x - w / 2 + 3, E.y - h + 10]], 'rgba(255,255,255,0.4)', 1.6), 9910 + x);
      pc(rect(E.x0 + 150, E.y - 34, E.x0 + 176, E.y), '#8a6a4a', null, 9920);
      for (const a of [-0.3, 0, 0.25]) pc([[E.x0 + 163, E.y - 30], [E.x0 + 163 + Math.sin(a) * 80, E.y - 30 - Math.cos(a) * 80], [E.x0 + 157 + Math.sin(a) * 60, E.y - 30 - Math.cos(a) * 64]], '#e6e0d0', null, 9921 + a * 10, { drop: false });
      // table à dessin inclinée (tréteaux en X) + feuille + petit plateau à encrier ; guéridon de la lampe
      const T = AT.table;
      pc(bar([T.x0 + 22, T.yb], [T.x1 - 26, BACK], 12), C.boisD, null, 9930); pc(bar([T.x1 - 26, T.yh + 6], [T.x0 + 22, BACK], 12), C.bois, null, 9931);
      pc(bar([T.x0 + 60, 1330], [T.x1 - 60, 1330], 8), C.boisD, null, 9932);
      pc([[T.x0 - 4, T.yb - 6], [T.x1 + 2, T.yh - 8], [T.x1 + 4, T.yh + 6], [T.x0, T.yb + 10]], C.boisL, () => strokePts([[T.x0, T.yb - 4], [T.x1, T.yh - 6]], 'rgba(255,230,190,0.5)', 1.4), 9933);
      pc([[T.x0 + 30, T.yb - 16], [T.x1 - 30, T.yh - 12], [T.x1 - 26, T.yh - 4], [T.x0 + 34, T.yb - 6]], '#efe8d6', () => { strokePts(qbez([T.x0 + 70, T.yb - 20], [T.x0 + 110, T.yb - 50], [T.x0 + 140, T.yb - 36], 8), 'rgba(40,34,30,0.6)', 1.2); }, 9934, { drop: false });
      pc([[T.x0 - 46, T.yb + 2], [T.x0 + 4, T.yb + 2], [T.x0 + 4, T.yb + 12], [T.x0 - 46, T.yb + 12]], C.bois, null, 9935);
      pc([[T.x0 - 36, T.yb + 2], [T.x0 - 34, T.yb - 16], [T.x0 - 14, T.yb - 16], [T.x0 - 12, T.yb + 2]], '#1e1a22', () => strokePts([[T.x0 - 32, T.yb - 12], [T.x0 - 30, T.yb - 2]], 'rgba(255,255,255,0.5)', 1.4), 9936);
      pc([[T.x0 - 22, T.yb - 14], [T.x0 - 46, T.yb - 96], [T.x0 - 30, T.yb - 92], [T.x0 - 20, T.yb - 16]], '#e6e0d0', null, 9937, { drop: false });
      const L = AT.lampe;
      pc(bar([L[0], 1100], [L[0], BACK], 10), C.boisD, null, 9938); pc(ell(L[0], 1100, 40, 8, 16), C.bois, null, 9939); pc(rect(L[0] - 26, BACK - 10, L[0] + 26, BACK), C.boisD, null, 9940);
      pc([[L[0] - 22, 1094], [L[0] - 16, 1066], [L[0] + 16, 1066], [L[0] + 22, 1094]], '#7a5a2a', () => strokePts([[L[0] - 12, 1070], [L[0] - 14, 1090]], 'rgba(255,230,170,0.5)', 1.4), 9941);
      pc([[L[0] - 8, 1066], [L[0] - 12, 1040], [L[0] - 7, 1010], [L[0] + 7, 1010], [L[0] + 12, 1040], [L[0] + 8, 1066]], 'rgba(220,235,240,0.5)', null, 9942, { texA: 0.15 });
      // tabouret
      const B = AT.tabouret;
      for (const [a, b] of [[B.x - 30, B.x - 40], [B.x + 30, B.x + 40], [B.x, B.x + 4]]) pc(bar([a, B.siege + 8], [b, BACK], 9), C.boisD, null, 9950 + a);
      pc(bar([B.x - 34, 1360], [B.x + 34, 1360], 6), C.boisD, null, 9953);
      pc(rect(B.x - 40, B.siege, B.x + 40, B.siege + 12), C.bois, () => strokePts([[B.x - 38, B.siege + 2], [B.x + 38, B.siege + 2]], 'rgba(255,220,170,0.45)', 1.2), 9954);
      // poêle à bois en fonte
      const Px = AT.poele.x;
      pc([[Px - 48, 1180], [Px + 48, 1180], [Px + 56, 1250], [Px + 50, 1340], [Px - 50, 1340], [Px - 56, 1250]], '#2a2a2c', () => {
        fillPts(rect(Px - 26, 1268, Px + 26, 1312), '#141012'); strokePts(rect(Px - 26, 1268, Px + 26, 1312), '#5a5a5e', 2, true);
        strokePts([[Px - 40, 1190], [Px - 48, 1330]], 'rgba(200,200,210,0.25)', 2);
      }, 9960);
      pc(rect(Px - 58, 1166, Px + 58, 1182), '#3a3a3e', null, 9961);
      for (const x of [Px - 40, Px + 40]) pc([[x - 6, 1340], [x + 6, 1340], [x + 8, BACK], [x - 8, BACK]], '#2a2a2c', null, 9962 + x);
    });
  }
  function makePoleNord() {
    const P = AT.poleNord;
    return M.withShadow(M.cutFlat(P.w + 40, P.h + 40, (P.w + 40) / 2, P.h + 20, () => {
      pc(rect(-P.w / 2, -P.h, P.w / 2, 0), '#1e2a44', () => {
        const c = cx_(), g = c.createLinearGradient(0, -P.h, 0, 0); g.addColorStop(0, '#14203a'); g.addColorStop(0.6, '#2e4262'); g.addColorStop(1, '#5a6e86'); c.fillStyle = g; c.fillRect(-P.w / 2, -P.h, P.w, P.h);
        for (let i = 0; i < 3; i++) fillPts(ribbon(qbez([-P.w / 2, -P.h + 90 + i * 34], [0, -P.h + 30 + i * 40], [P.w / 2, -P.h + 120 + i * 26], 14), 26 - i * 6, 10), `rgba(150,230,190,${0.32 - i * 0.07})`, i, 0.2);
        const R = M.rng(77); for (let i = 0; i < 40; i++) dot(-P.w / 2 + R() * P.w, -P.h + R() * 260, 1 + R() * 1.6, 'rgba(255,255,240,0.85)');
        fillPts([[-P.w / 2, -110], [-120, -150], [-30, -128], [60, -160], [150, -130], [P.w / 2, -140], [P.w / 2, 0], [-P.w / 2, 0]], '#dfe8ee', 1, 0.6);
        fillPts([[-P.w / 2, -60], [-80, -78], [40, -64], [P.w / 2, -84], [P.w / 2, 0], [-P.w / 2, 0]], '#c4d4e0', 2, 0.6);
        for (const [x, w] of [[-150, 60], [120, 80]]) fillPts([[x - w / 2, -40], [x - w / 4, -66], [x + w / 3, -60], [x + w / 2, -40]], '#eef3f6', 3, 0.4);
        const hx_ = 30, hy = -150;
        fillPts(rect(hx_ - 70, hy - 70, hx_ + 70, hy), '#6a4a2e'); for (let y = hy - 66; y < hy; y += 12) strokePts([[hx_ - 70, y], [hx_ + 70, y]], 'rgba(30,18,10,0.6)', 1.6);
        fillPts([[hx_ - 92, hy - 64], [hx_, hy - 128], [hx_ + 92, hy - 64]], '#f2f4f2'); strokePts([[hx_ - 92, hy - 64], [hx_ + 92, hy - 64]], 'rgba(120,140,160,0.6)', 2);
        fillPts(rect(hx_ + 30, hy - 120, hx_ + 46, hy - 86), '#5a3a2a'); fillPts(rect(hx_ + 27, hy - 126, hx_ + 49, hy - 118), '#f2f4f2');
        fillPts(rect(hx_ - 50, hy - 50, hx_ - 22, hy - 24), '#e8c070'); fillPts(rect(hx_ + 10, hy - 52, hx_ + 32, hy), '#3a2616');
        strokePts([[hx_ - 36, hy - 50], [hx_ - 36, hy - 24]], '#4a3020', 1.4); strokePts([[hx_ - 50, hy - 37], [hx_ - 22, hy - 37]], '#4a3020', 1.4);
        for (let i = 0; i < 4; i++) fillPts(ell(hx_ + 38 + i * 8, hy - 140 - i * 22, 8 + i * 4, 6 + i * 3, 10), `rgba(230,236,240,${0.5 - i * 0.1})`, i, 0.3);
      }, 9990);
      pc(rect(-P.w / 2 - 14, -P.h - 16, P.w / 2 + 14, -P.h), C.boisD, null, 9991); pc(rect(-P.w / 2 - 10, -2, P.w / 2 + 10, 12), C.boisD, null, 9992);
    }), 8);
  }
  function makeAtSol() {
    return M.pre(W, M.H, () => {
      const y0 = BACK + 46;
      pc(rect(14, y0 - 66, 190, y0), '#6a4a2e', () => { for (let x = 20; x < 190; x += 26) strokePts([[x, y0 - 64], [x, y0]], 'rgba(20,10,4,0.4)', 1.4); strokePts([[14, y0 - 33], [190, y0 - 33]], 'rgba(20,10,4,0.4)', 2); }, 9971);
      for (let i = 0; i < 5; i++) pc(rect(24 + (i % 3), y0 - 74 - i * 9, 176 - (i % 2) * 3, y0 - 66 - i * 9), i % 2 ? '#ede6d4' : '#e2dac6', null, 9972 + i, { drop: i === 4 });
      pc(rect(20, y0 - 116, 180, y0 - 110), '#8a7a5a', null, 9981);
      const Sx = 900;
      pc([[Sx - 42, y0 - 96], [Sx + 42, y0 - 96], [Sx + 34, y0], [Sx - 34, y0]], '#6e6a62', () => { for (const y of [y0 - 80, y0 - 20]) fillPts(rect(Sx - 50, y - 3, Sx + 50, y + 3), '#4e4a44'); strokePts([[Sx - 30, y0 - 90], [Sx - 24, y0 - 6]], 'rgba(255,255,255,0.3)', 2); }, 9982);
      fillPts(ribbon(qbez([Sx - 40, y0 - 92], [Sx, y0 - 150], [Sx + 40, y0 - 92], 10), 3, 3), '#2e2e30');
      pc(ell(Sx, y0 - 96, 42, 8, 18), '#3a3632', () => fillPts(ell(Sx, y0 - 95, 36, 5.5, 16), '#4a5a62'), 9983, { drop: false });
      pc([[Sx + 14, y0 - 96], [Sx + 46, y0 - 196], [Sx + 52, y0 - 192], [Sx + 22, y0 - 94]], C.boisL, null, 9984);
    });
  }
  function hachures() { return M.pre(W, BACK + 40, (c) => { c.strokeStyle = 'rgba(30,26,24,1)'; c.lineWidth = 1; c.beginPath(); for (let x = -BACK; x < W; x += 6) { c.moveTo(x, 0); c.lineTo(x + BACK + 40, BACK + 40); } c.stroke(); }); }
  function pageCorde(i, x, y, a, g) {
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(a);
    pc(rect(-34, 0, 34, 92), i % 3 === 1 ? '#e2dccb' : '#ece6d6', () => {
      fillPts(rect(-28, 8, 28, 44), '#9a958c'); fillPts(rect(-26, 10, -2, 42), '#7a766e'); fillPts(ell(12, 26, 10, 12, 10), '#6a665e');
      for (const yy of [52, 66, 80]) fillPts(rect(-28, yy, i % 2 ? 4 : 28, yy + 8), '#b4b0a6');
      if (i % 2) fillPts(rect(8, 52, 28, 88), '#8a867e');
    }, 9700 + i, { drop: true });
    for (const s of [-1, 1]) fillPts(rect(s * 22 - 3, -6, s * 22 + 3, 8), '#b8955a');
    c.restore();
  }
  PNL.atelierNast = function (t, o) {
    o = o || {}; const K = PNL.K, c = cx_(), g = M.tg(t), col = clamp(o.couleur == null ? 1 : o.couleur), pn = clamp(o.poleNord || 0);
    c.drawImage(K.atFond, 0, 0);
    // neige légère derrière les vitres + rayon de lumière de la fenêtre de droite
    if (!SIL()) {
      c.save(); c.beginPath(); for (const [x0, x1] of [AT.fenL, AT.fenR]) c.rect(x0, AT.fenY[0], x1 - x0, AT.fenY[1] - AT.fenY[0]); c.clip();
      for (let i = 0; i < 46; i++) { const h = hash(i * 7.3), u = (g * (0.05 + 0.04 * h) + h) % 1, x = (i % 2 ? AT.fenL[0] : AT.fenR[0]) + ((h * 997) % 280) + 12 * Math.sin(g * 0.8 + i), y = AT.fenY[0] + u * (AT.fenY[1] - AT.fenY[0]); dot(x, y, 1.6 + h * 1.4, 'rgba(255,255,255,0.85)'); }
      c.restore();
      const k = 0.13 + 0.03 * Math.sin(g * 0.7), gr = c.createLinearGradient(820, 420, 520, 1380); gr.addColorStop(0, `rgba(255,248,225,${k})`); gr.addColorStop(1, 'rgba(255,248,225,0)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.moveTo(700, 300); c.lineTo(960, 300); c.lineTo(780, 1390); c.lineTo(380, 1390); c.closePath(); c.fill(); c.restore();
    }
    M.poussiere(t, { x: 560, y: 760, w: 300, h: 520, n: 26, a: 0.6, seed: 31 });
    // toile « pôle Nord » qui descend des cintres derrière la table
    if (pn > 0) {
      const P = AT.poleNord, y = lerp(P.bas - P.h - 1100, P.bas, ease(pn)), sw = pn < 1 ? 0.004 * Math.sin(g * 1.3) : 0.002 * Math.sin(g * 0.9);
      for (const s of [-1, 1]) strokePts([[P.cx + s * (P.w / 2 - 20), y - P.h - 16], [P.cx + s * (P.w / 2 - 20), 0]], 'rgba(30,24,20,0.85)', 1.6);
      M.flat(K.poleNord, P.cx, y, { rot: sw, cast: { a: 0.35, dx: 14, dy: 6 } });
    }
    c.drawImage(K.atMilieu, 0, 0);
    // flammes, fumée, corde à pages, chat
    M.flamme(t, { x: AT.lampe[0], y: AT.lampe[1], s: 0.55, r: 120, seed: 3 });
    M.flamme(t, { x: AT.poele.porte[0], y: AT.poele.porte[1] + 16, s: 0.75, r: 70, seed: 5 });
    M.fumee(t, { x: AT.poele.x - 30, y: 1164, s: 0.5, n: 4, haut: 140, vent: 20, a: 0.35, seed: 4 });
    const Cr = AT.corde, cy = (x) => Cr.y + Cr.fl * (1 - Math.pow((x - (Cr.x0 + Cr.x1) / 2) / ((Cr.x1 - Cr.x0) / 2), 2));
    const line = []; for (let x = Cr.x0; x <= Cr.x1; x += 20) line.push([x, cy(x) + 2 * Math.sin(g * 0.9 + x * 0.004)]);
    strokePts(line, 'rgba(120,100,70,0.95)', 1.8);
    const pg = ease(clamp(o.page || 0));
    [110, 250, 380, 690, 820, 950].forEach((x, i) => {
      const y = cy(x) + 2 * Math.sin(g * 0.9 + x * 0.004), a = 0.05 * Math.sin(g * 1.1 + i * 1.7) + 0.02 * Math.sin(g * 2.3 + i);
      if (i === 4 && pg > 0) {                          // la page se décroche d'une pince et pendouille
        const c2 = cx_(); c2.save(); c2.translate(x - 22, y); c2.rotate(-1.15 * pg + 0.12 * Math.sin(g * 2.2) * pg); c2.translate(22, 0); pageCorde(i, 0, 0, 0, g); c2.restore();
      } else pageCorde(i, x, y, a, g);
    });
    const ch = o.chat;
    if (ch != null && ch > 0 && ch < 1) chatGris(lerp(AT.etagere.x0 - 30, AT.etagere.x1 + 10, ch), AT.etagere.y, g);
    // camaïeu de gravure (couleur 0) : désature tout ce qui est déjà dessiné, teinte papier + hachures
    if (col < 0.999 && !SIL()) {
      c.save(); c.globalCompositeOperation = 'saturation'; c.globalAlpha = 1 - col; c.fillStyle = '#808080'; c.fillRect(0, 0, W, BACK + 40);
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = (1 - col) * 0.5; c.fillStyle = '#ece4d2'; c.fillRect(0, 0, W, BACK + 40);
      c.globalAlpha = (1 - col) * 0.12; c.drawImage(K.hach, 0, 0); c.restore();
    }
  };
  function chatGris(x, y, g) {                           // chat gris de l'atelier qui marche sur l'étagère (vers +x)
    const c = cx_(), w = Math.sin(g * 9);
    c.save(); c.translate(x, y);
    for (const [lx, ph] of [[-22, 0], [18, PI]]) for (const s of [0, 1]) { const a = 0.35 * Math.sin(g * 9 + ph + s * PI); pc(bar([lx + s * 6, -16], [lx + s * 6 + Math.sin(a) * 16, -1], 6), s ? '#6e6c6a' : '#5a5856', null, 9890 + lx + s, { drop: false }); }
    pc([[-30, -34], [-6, -40], [20, -36], [30, -26], [28, -14], [-28, -12], [-36, -22]], '#7c7a76', () => { for (let i = 0; i < 4; i++) strokePts([[-20 + i * 10, -38], [-24 + i * 10, -16]], 'rgba(40,40,40,0.4)', 1.4); }, 9895);
    pc(qbez([-32, -28], [-60, -40 + 8 * w], [-54, -70 + 6 * w], 8).concat(qbez([-50, -70 + 6 * w], [-54, -44 + 8 * w], [-30, -20], 8)), '#6e6c6a', null, 9896, { drop: false });
    pc([[24, -32], [26, -50], [32, -42], [40, -50], [44, -34], [46, -24], [36, -16], [24, -20]], '#7c7a76', () => { dot(38, -32, 2, '#d8c860'); dot(38.5, -32, 0.9, '#1a1a1a'); dot(46, -26, 1.6, '#c89a9a'); }, 9897);
    c.restore();
  }
  PNL.atelierNastSol = function (t, o) {
    o = o || {}; const K = PNL.K, c = cx_(), col = clamp(o.couleur == null ? 1 : o.couleur);
    if (col < 0.999 && !SIL()) { c.save(); c.globalCompositeOperation = 'saturation'; c.globalAlpha = 1 - col; c.fillStyle = '#808080'; c.fillRect(0, BACK - 10, W, M.H - BACK + 10);
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = (1 - col) * 0.4; c.fillStyle = '#ece4d2'; c.fillRect(0, BACK - 10, W, M.H - BACK + 10); c.restore(); }
    if (col > 0.001) { c.save(); c.globalAlpha = col; c.drawImage(K.atSol, 0, 0); c.restore(); }
    if (col < 0.999) { c.save(); c.globalAlpha = 1 - col; c.drawImage(K.atSolG, 0, 0); c.restore(); }
  };

  // =====================================================================
  // 10) DÉCOR « STUDIO DE RÉCLAME » (1915-1931 → années 60) : PNL.studio(t, o) AVANT M.drawFloor(), PNL.studioSol(t, o) juste APRÈS.
  //     o.affiche 0..1 (1 défaut : affiche du Père Noël à la bouteille claire accrochée ; 0 : remontée aux cintres) ; o.projecteur 0..1 (0 éteint,
  //     entre 0 et 1 il grésille, 1 allumé : faisceau vers l'estrade) ; o.toile = options du chevalet ({ etat, vide, bouteille }) ou false (pas de chevalet) ;
  //     o.ephemeride = options de PNL.ephemeride (t, page, effeuille, tremble) ou false ; studioSol : o.goutte 0..1 (une goutte tombe du pinceau dans son pot)
  // =====================================================================
  const STU = { verriere: { x0: 60, x1: 740, y0: 236, y1: 556 }, affiche: { cx: 520, y0: 596, w: 260, h: 340 }, ephemeride: [840, 480], estrade: { x0: 150, x1: 460, top: BACK - 79 },
    fauteuil: 214, caisse: 424, chevalet: 650, projo: { x: 948, y: 806 }, poele: { x: 96 }, toiles: [856, 1052], table: { x0: 20, x1: 236, y: BACK - 145 }, sapin: 992, guirlande: 588,
    goutte: { x: 196, y0: BACK - 222, y1: BACK - 176 } };
  PNL.STUDIO = STU;
  function makeStFond() {
    return M.pre(W, BACK + 40, (c) => {
      c.fillStyle = '#b5a68a'; c.fillRect(0, 0, W, BACK + 40);
      const R = M.rng(51); for (let i = 0; i < 260; i++) dot(R() * W, 150 + R() * (BACK - 150), 2 + R() * 6, `rgba(${R() > 0.5 ? '255,250,235' : '90,70,50'},0.06)`);
      const V = STU.verriere;
      fenetre(V.x0, V.x1, V.y0, V.y1, 52, ['#c9d3da', '#eef0ec'], ['#9aa4ac', '#8a949c', '#f2e6c0']);
      c.save(); c.beginPath(); c.rect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0); c.clip(); for (let x = V.x0; x < V.x1; x += 40) fillPts(rect(x, V.y1 - 120 - hash(x) * 60, x + 38, V.y1 - 110 - hash(x) * 60), 'rgba(250,250,250,0.85)'); c.restore();
      pc(rect(-10, BACK - 250, W + 10, BACK + 20), '#6e5236', () => { for (let x = 30; x < W; x += 120) strokePts(rect(x, BACK - 230, x + 96, BACK - 30), 'rgba(30,18,8,0.45)', 1.6, true); strokePts([[0, BACK - 246], [W, BACK - 246]], 'rgba(255,230,190,0.35)', 2); }, 8501);
      const sh = c.createLinearGradient(0, 150, 0, BACK); sh.addColorStop(0, 'rgba(30,24,16,0.45)'); sh.addColorStop(0.3, 'rgba(30,24,16,0.02)'); sh.addColorStop(1, 'rgba(30,24,16,0.3)'); c.fillStyle = sh; c.fillRect(0, 150, W, BACK - 150);
      // toiles retournées contre le mur (châssis vus de dos)
      [[856, 300, -0.05], [904, 340, -0.03], [960, 270, 0.02], [1010, 320, 0.05]].forEach(([x, h, a], i) => {
        c.save(); c.translate(x, BACK + 4); c.rotate(a);
        pc(rect(-50, -h, 50, 0), '#cdbf9e', () => { for (const b of [[[-44, -h + 6], [44, -h + 6]], [[-44, -6], [44, -6]], [[-44, -h + 6], [-44, -6]], [[44, -h + 6], [44, -6]], [[0, -h + 6], [0, -6]]]) fillPts(bar(b[0], b[1], 9), C.bois); hatch(null, 0.9, 5, 0.12, 1, M.P.encre, [-60, -h - 10, 60, 10]); }, 8510 + i);
        c.restore();
      });
      // tuyau du poêle
      const Px = STU.poele.x;
      pc(bar([Px, 160], [Px, 1130], 28), '#2a2a2c', () => { for (let y = 220; y < 1130; y += 130) fillPts(rect(Px - 16, y, Px + 16, y + 6), '#3c3c40'); }, 8520);
    });
  }
  function makeStMilieu() {
    return M.pre(W, BACK + 40, () => {
      // poêle en fonte ouvragé
      const Px = STU.poele.x;
      pc([[Px - 40, 1130], [Px + 40, 1130], [Px + 52, 1200], [Px + 46, 1330], [Px - 46, 1330], [Px - 52, 1200]], '#262628', () => {
        fillPts(rect(Px - 22, 1240, Px + 22, 1290), '#140f10'); strokePts(rect(Px - 22, 1240, Px + 22, 1290), '#6a6a6e', 2, true);
        for (const y of [1160, 1316]) strokePts([[Px - 46, y], [Px + 46, y]], 'rgba(200,200,210,0.3)', 2);
      }, 8601);
      pc(ell(Px, 1128, 46, 9, 18), '#3a3a3e', null, 8602);
      for (const x of [Px - 34, Px + 34]) pc([[x - 6, 1330], [x + 6, 1330], [x + 9, BACK], [x - 9, BACK]], '#262628', null, 8603 + x);
      // estrade de pose (tapis), fauteuil de velours vert, caisse de bouteilles brunes
      const E = STU.estrade;
      pc(rect(E.x0, E.top, E.x1, BACK + 2), '#5e4428', () => { strokePts([[E.x0, E.top + 3], [E.x1, E.top + 3]], 'rgba(255,230,190,0.45)', 2); for (let x = E.x0 + 30; x < E.x1; x += 70) strokePts(rect(x, E.top + 18, x + 50, BACK - 10), 'rgba(20,10,4,0.35)', 1.4, true); }, 8610);
      pc(rect(E.x0 + 14, E.top - 6, E.x1 - 14, E.top + 4), '#6e4a3a', () => { for (let x = E.x0 + 18; x < E.x1 - 14; x += 8) strokePts([[x, E.top + 4], [x, E.top + 12]], '#c4a46a', 1.2); }, 8611, { drop: false });
      const F = STU.fauteuil, ft = E.top - 6;
      pc([[F - 56, ft - 250], [F - 34, ft - 268], [F + 30, ft - 268], [F + 52, ft - 250], [F + 50, ft - 120], [F - 54, ft - 120]], '#3f6a46', () => { for (let x = F - 40; x < F + 44; x += 20) for (let y = ft - 240; y < ft - 130; y += 26) { dot(x, y, 2.4, '#2a4a30'); } hatch(null, 0.8, 4, 0.2, 1, M.P.encre, [F - 70, ft - 280, F + 70, ft - 100]); }, 8612);
      pc([[F - 70, ft - 120], [F + 66, ft - 120], [F + 70, ft - 60], [F - 72, ft - 60]], '#46744e', () => strokePts([[F - 66, ft - 116], [F + 62, ft - 116]], 'rgba(220,255,220,0.3)', 2), 8613);
      for (const s of [-1, 1]) { pc(rect(F + s * 64 - 12, ft - 170, F + s * 64 + 12, ft - 70), '#3a6040', null, 8614 + s); pc(rect(F + s * 60 - 6, ft - 60, F + s * 60 + 6, ft), C.boisD, null, 8616 + s); }
      const Cx = STU.caisse;
      for (let i = 0; i < 4; i++) { const bx = Cx - 24 + i * 16; pc([[bx - 5, ft - 60], [bx - 4, ft - 82], [bx + 4, ft - 82], [bx + 5, ft - 60]], C.verreB, null, 8620 + i, { drop: false }); pc(rect(bx - 5, ft - 88, bx + 5, ft - 82), C.or, null, 8630 + i, { drop: false }); }
      pc(rect(Cx - 36, ft - 62, Cx + 36, ft), '#9a7a4e', () => { for (const y of [ft - 50, ft - 22]) strokePts([[Cx - 34, y], [Cx + 34, y]], 'rgba(40,24,10,0.5)', 1.6); strokePts([[Cx - 36, ft - 62], [Cx + 36, ft]], 'rgba(40,24,10,0.25)', 1.2); }, 8640);
      // projecteur de photographe sur trépied (tête orientée vers l'estrade)
      const Pj = STU.projo;
      for (const [a, b] of [[Pj.x, Pj.x - 50], [Pj.x, Pj.x + 46], [Pj.x, Pj.x + 6]]) pc(bar([a, Pj.y + 40], [b, BACK], 7), '#2c2c30', null, 8650 + b);
      pc(bar([Pj.x, Pj.y], [Pj.x, Pj.y + 120], 9), '#3a3a3e', null, 8653);
      pc([[Pj.x + 26, Pj.y - 40], [Pj.x + 34, Pj.y - 30], [Pj.x + 34, Pj.y + 30], [Pj.x + 26, Pj.y + 40], [Pj.x - 30, Pj.y + 54], [Pj.x - 30, Pj.y - 54]], '#3e4044', () => strokePts([[Pj.x + 20, Pj.y - 36], [Pj.x - 26, Pj.y - 48]], 'rgba(220,220,230,0.35)', 2), 8654);
      pc(ell(Pj.x - 30, Pj.y, 12, 56, 18), '#26282c', null, 8655);
    });
  }
  function makeStSol() {
    return M.pre(W, M.H, () => {
      const T = STU.table, y0 = BACK + 46;
      for (const x of [T.x0 + 16, T.x1 - 16]) pc(bar([x, T.y + 10], [x, y0], 12), C.boisD, null, 8701 + x);
      pc(bar([T.x0 + 16, y0 - 50], [T.x1 - 16, y0 - 50], 7), C.boisD, null, 8703);
      pc(rect(T.x0, T.y, T.x1, T.y + 14), C.bois, () => strokePts([[T.x0, T.y + 2], [T.x1, T.y + 2]], 'rgba(255,220,170,0.45)', 1.4), 8704);
      pc([[T.x0 + 10, T.y], [T.x0 + 30, T.y - 26], [T.x0 + 66, T.y - 18], [T.x0 + 80, T.y]], '#c4a46a', () => strokePts([[T.x0 + 26, T.y - 14], [T.x0 + 60, T.y - 8]], 'rgba(90,110,140,0.6)', 3), 8705);
      [[T.x0 + 96, '#b3262b'], [T.x0 + 112, '#d2a944'], [T.x0 + 126, '#f0e9d8']].forEach(([x, col], i) => pc([[x - 5, T.y], [x - 6, T.y - 8], [x + 8, T.y - 10], [x + 9, T.y - 2]], col, null, 8710 + i, { drop: false }));
      for (const [x, h, col] of [[T.x0 + 150, 46, '#8a7a6a'], [STU.goutte.x, 40, '#6e5a48']]) {
        pc([[x - 16, T.y], [x - 15, T.y - h], [x + 15, T.y - h], [x + 16, T.y]], col, () => strokePts([[x - 10, T.y - 4], [x - 10, T.y - h + 6]], 'rgba(255,255,255,0.3)', 1.6), 8720 + x);
        if (x !== STU.goutte.x) for (const a of [-0.25, 0, 0.2]) pc(bar([x + a * 20, T.y - h + 4], [x + Math.sin(a) * 70, T.y - h - 70], 4), '#3a2a20', null, 8730 + a * 10, { drop: false });
      }
      fillPts(ell(STU.goutte.x, T.y - 40, 13, 3, 12), C.rouge);
      pc(bar([STU.goutte.x - 70, T.y - 64], [STU.goutte.x + 4, T.y - 44], 4), '#3a2a20', null, 8740, { drop: false });
      pc([[STU.goutte.x + 2, T.y - 47], [STU.goutte.x + 10, T.y - 44], [STU.goutte.x + 4, T.y - 40]], C.rouge, null, 8741, { drop: false });
      // sapin en pot (sans boule rouge et blanche : rubans de papier ocre et vert)
      const Sx = STU.sapin;
      pc([[Sx - 34, y0 - 70], [Sx + 34, y0 - 70], [Sx + 26, y0], [Sx - 26, y0]], '#a0603a', () => strokePts([[Sx - 34, y0 - 60], [Sx + 34, y0 - 60]], 'rgba(40,20,10,0.4)', 2), 8750);
      pc(bar([Sx, y0 - 70], [Sx, y0 - 110], 10), C.boisD, null, 8751);
      [[y0 - 110, 74], [y0 - 180, 60], [y0 - 240, 46], [y0 - 290, 32]].forEach(([y, w], i) => pc([[Sx - w, y], [Sx, y - 110], [Sx + w, y]], i % 2 ? '#2a4a32' : '#2f5438', () => { for (let k = -2; k <= 2; k++) strokePts([[Sx, y - 100], [Sx + k * w * 0.4, y]], 'rgba(10,30,14,0.4)', 1); }, 8752 + i));
      for (const [x, y, col] of [[Sx - 30, y0 - 140, '#d2a944'], [Sx + 22, y0 - 200, '#4f6f92'], [Sx - 12, y0 - 260, '#d2a944'], [Sx + 36, y0 - 128, '#4f7a4a']]) { dot(x, y, 6, col); dot(x - 2, y - 2, 1.8, 'rgba(255,255,255,0.6)'); }
      pc([[Sx, y0 - 412], [Sx + 7, y0 - 398], [Sx + 20, y0 - 396], [Sx + 9, y0 - 388], [Sx + 13, y0 - 374], [Sx, y0 - 382], [Sx - 13, y0 - 374], [Sx - 9, y0 - 388], [Sx - 20, y0 - 396], [Sx - 7, y0 - 398]], '#d2a944', null, 8760);
    });
  }
  PNL.studio = function (t, o) {
    o = o || {}; const K = PNL.K, c = cx_(), g = M.tg(t), V = STU.verriere;
    c.drawImage(K.stFond, 0, 0);
    if (!SIL()) {                                           // neige derrière la verrière
      c.save(); c.beginPath(); c.rect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0); c.clip();
      for (let i = 0; i < 70; i++) { const h = hash(i * 3.7 + 1), u = (g * (0.06 + 0.05 * h) + h) % 1, x = V.x0 + ((h * 1931) % (V.x1 - V.x0)) + 14 * Math.sin(g * 0.7 + i), y = V.y0 + u * (V.y1 - V.y0); dot(x, y, 1.6 + h * 1.6, 'rgba(255,255,255,0.9)'); }
      c.restore();
      const gr = c.createLinearGradient(0, V.y1, 0, 1390); gr.addColorStop(0, `rgba(235,242,250,${0.16 + 0.02 * Math.sin(g * 0.5)})`); gr.addColorStop(1, 'rgba(235,242,250,0)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.moveTo(V.x0 + 40, V.y1); c.lineTo(V.x1 - 40, V.y1); c.lineTo(V.x1 + 120, 1390); c.lineTo(V.x0 + 140, 1390); c.closePath(); c.fill(); c.restore();
    }
    M.poussiere(t, { x: 420, y: 820, w: 420, h: 520, n: 30, a: 0.6, seed: 52 });
    // guirlande de papier qui ondule (anneaux ocre / vert / ivoire / bleu)
    const GY = STU.guirlande;
    for (let i = 0; i <= 48; i++) {
      const u = i / 48, x = lerp(70, 1010, u), y = GY - 60 + 90 * Math.sin(u * PI) + 6 * Math.sin(g * 1.4 + u * 9), cols = ['#c99a3a', '#4f7a4a', '#ece4cf', '#4f6f92'];
      if (!SIL()) { const cc_ = cx_(); cc_.save(); cc_.translate(x, y); cc_.rotate(0.3 * Math.sin(g * 1.2 + i)); fillPts(ell(0, 0, 11, 7, 10), cols[i % 4], i, 0.2); fillPts(ell(0, 0, 6, 3, 8), 'rgba(60,40,20,0.35)', i, 0); cc_.restore(); }
    }
    // affiche murale (Père Noël à la bouteille claire) : monte aux cintres quand affiche → 0
    const af = clamp(o.affiche == null ? 1 : o.affiche);
    if (af > 0.001) {
      const A = STU.affiche, lift = (1 - ease(af)) * 1000, y = A.y0 + A.h + 20 - lift;
      for (const s of [-1, 1]) strokePts([[A.cx + s * (A.w / 2 - 24), y - A.h - 26], [A.cx + s * (A.w / 2 - 24), 0]], 'rgba(30,24,20,0.85)', 1.5);
      M.flat(K.affiche, A.cx, y, { rot: 0.004 * Math.sin(g * 0.8), cast: { a: 0.3, dx: 12, dy: 6 } });
    }
    if (o.ephemeride !== false) PNL.ephemeride(STU.ephemeride[0], STU.ephemeride[1], 0.92, Object.assign({ t, cast: { a: 0.3, dx: 8, dy: 4 } }, o.ephemeride || {}));
    c.drawImage(K.stMilieu, 0, 0);
    M.flamme(t, { x: STU.poele.x, y: 1290, s: 0.7, r: 80, seed: 9 });
    M.fumee(t, { x: STU.poele.x + 30, y: 1124, s: 0.45, n: 4, haut: 130, vent: 16, a: 0.3, seed: 8 });
    // projecteur : grésille entre 0 et 1, allumé à 1 (faisceau vers l'estrade)
    const pj = clamp(o.projecteur == null ? 1 : o.projecteur), Pj = STU.projo;
    const on = pj >= 0.999 ? 1 : pj <= 0.001 ? 0 : (Math.sin(g * 47) > 0.3 - pj || Math.sin(g * 19 + 1) > 0.8 - pj ? 0.4 + 0.6 * pj : 0.05);
    fillPts(ell(Pj.x - 34, Pj.y, 9, 48, 18), mixA('#4a4a46', '#fff6d8', on), 0, 0);
    if (on > 0.02 && !SIL()) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(Pj.x - 40, Pj.y, 4, Pj.x - 40, Pj.y, 90); gl.addColorStop(0, `rgba(255,246,210,${0.6 * on})`); gl.addColorStop(1, 'rgba(255,246,210,0)'); c.fillStyle = gl; c.fillRect(Pj.x - 140, Pj.y - 100, 200, 200);
      const bm = c.createLinearGradient(Pj.x - 40, Pj.y, 300, 1250); bm.addColorStop(0, `rgba(255,246,215,${0.22 * on})`); bm.addColorStop(1, 'rgba(255,246,215,0)'); c.fillStyle = bm;
      c.beginPath(); c.moveTo(Pj.x - 40, Pj.y - 46); c.lineTo(160, 1000); c.lineTo(300, 1400); c.lineTo(Pj.x - 40, Pj.y + 46); c.closePath(); c.fill(); c.restore();
    }
    if (o.toile !== false) PNL.chevalet(STU.chevalet, BACK + 2, 0.94, Object.assign({ cast: { a: 0.32, dx: 14, dy: 6 } }, o.toile || {}));
  };
  PNL.studioSol = function (t, o) {
    o = o || {}; const c = cx_(); c.drawImage(PNL.K.stSol, 0, 0);
    const gt = o.goutte;
    if (gt != null && gt > 0 && gt < 1 && !SIL()) { const Gd = STU.goutte, T = STU.table, y0 = T.y - 40, u = gt, y = u < 0.35 ? y0 + 6 * sm(0, 0.35, u) : y0 + 6 + (T.y - 40 + 34 - y0 - 6) * Math.pow((u - 0.35) / 0.65, 2);
      const r = u < 0.35 ? 2 + 3 * sm(0, 0.35, u) : 5;
      if (u < 0.95) fillPts([[Gd.x + 8, y - r * 2], [Gd.x + 8 + r, y], [Gd.x + 8, y + r], [Gd.x + 8 - r, y]], C.rouge, 0, 0); }
  };

  // =====================================================================
  // 11) INIT (pré-rendus)
  // =====================================================================
  PNL.init = function () {
    const K = (PNL.K = {});
    K.atFond = makeAtFond(); K.atMilieu = makeAtMilieu(); K.poleNord = makePoleNord(); K.poleNord.padB = 20; K.hach = hachures();
    K.atSol = makeAtSol(); K.atSolG = M.pre(W, M.H, (c) => { c.filter = 'grayscale(1) sepia(0.12)'; c.drawImage(K.atSol, 0, 0); c.filter = 'none'; });
    K.stFond = makeStFond(); K.stMilieu = makeStMilieu(); K.stSol = makeStSol();
    const A = STU.affiche;
    K.affiche = M.withShadow(M.cutFlat(A.w + 40, A.h + 60, (A.w + 40) / 2, A.h + 30, () => {
      pc(rect(-A.w / 2, -A.h, A.w / 2, 0), '#ece5d4', () => { const c = cx_(); c.save(); c.translate(0, -A.h / 2); c.scale(A.w / 300, A.h / 380); tableauNoel({ etat: 1, couleur: 1, bouteille: 'claire' }); c.restore(); }, 8801);
      pc(rect(-A.w / 2 - 12, -A.h - 14, A.w / 2 + 12, -A.h + 2), C.boisD, null, 8802); pc(rect(-A.w / 2 - 12, -4, A.w / 2 + 12, 10), C.boisD, null, 8803);
    }), 8); K.affiche.padB = 30;
    return K;
  };
})();
