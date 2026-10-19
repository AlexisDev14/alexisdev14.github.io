// persos.js — « La tulipomanie, la fleur plus chère qu'une maison » : marionnettes et accessoires PROPRES À CETTE VIDÉO. Espace M.tul (alias TUL). Appeler TUL.init() dans S.init.
// Mode d'emploi : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre, chiffre ni logo. Déterministe (hash, jamais Math.random).
// MARIONNETTES (toujours par l'enveloppe) : TUL.marchand / TUL.ecluse / TUL.acheteur / TUL.acheteuse (pose, x, y, s, o) ; (x,y) = pieds ; o.dir ±1 ; slot ST.slotF par défaut.
// ACCESSOIRES (sans tige) : TUL.tulipe, TUL.bulbe, TUL.oignon, TUL.coffret, TUL.contrat, TUL.bourse, TUL.pile (x, y, s, o) ; (x,y) = base (voir persos.md).
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const TUL = (M.tul = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 18, 0, TAU); o.pop(); return o; }
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const lerpPts = (A, B, k) => A.map((a, i) => { const b = B[i], o = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; if (a[2] || b[2]) o.push(1); return o; });
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  // ruban autour d'une ligne médiane ; fw(u) = largeur en u (0..1)
  function ribbonW(mid, fw) {
    const L = [], R = [];
    for (let i = 0; i < mid.length; i++) {
      const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = fw(i / (mid.length - 1)) / 2;
      L.push([mid[i][0] - dy * w, mid[i][1] + dx * w]); R.push([mid[i][0] + dy * w, mid[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  const ribbon = (mid, w0, w1) => ribbonW(mid, (u) => lerp(w0, w1, u));
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const has = (v) => !!v && v !== 'rien';
  function gradR(x0, y0, r0, x1, y1, r1, stops, bb) { if (SIL()) return; const c = cx_(), g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); }
  function gradL(x0, y0, x1, y1, stops, bb) { if (SIL()) return; const c = cx_(), g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); }
  TUL.geo = { ep, ell, qbez, scl, tr, ribbon };

  const OR = '#c9a24a', ORL = '#ecc97a', ORD = '#8d6a26';

  // =====================================================================
  // 1) OBJETS — dessinés à l'échelle 1 dans leur repère (y vers le bas) ; même dessin seul ou tenu
  // =====================================================================
  // fil des cintres : (0,0) = point d'attache en haut ; l'objet pend à `fil` px sous ce point ; `balance` (rad) le fait pivoter autour de l'attache
  function suspendu(o, topY, fn) {
    const L = o.fil || 0;
    if (!(L > 0)) { fn(); return; }
    const c = cx_(); c.save(); c.rotate(o.balance || 0);
    strokePts([[0.8, 0], [0.8, L]], 'rgba(20,14,10,0.55)', 2.4); strokePts([[0, 0], [0, L]], 'rgba(236,230,214,0.9)', 1.3);
    c.translate(0, L - topY); fn(); c.restore();
  }
  function racines(n, col, len, seed) {
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1) - 0.5, x0 = u * 30, h = hash(seed + i * 1.7);
      const x1 = x0 + u * 20 + (h - 0.5) * 8, y1 = len * (0.6 + 0.5 * hash(seed + i * 3.1));
      strokePts([[x0, -2], [lerp(x0, x1, 0.5) + (h - 0.5) * 6, y1 * 0.5], [x1, y1]], col, 2);
    }
  }
  // ---- bulbe de tulipe : tunique brun doré lustrée, pointe, racines claires ; origine = plateau (bas)
  const BULBE = [[0, -104, 1], [7, -94], [15, -82], [27, -64], [35, -46], [37, -28], [31, -12], [18, -3], [0, 0], [-18, -3], [-31, -12], [-37, -28], [-35, -46], [-27, -64], [-15, -82], [-7, -94]];
  function bulbeSeul(seed) {
    seed = seed || 7100;
    racines(9, 'rgba(238,228,204,0.95)', 16, seed);
    pc(ell(0, -1, 16, 4, 12), '#cdb98e', null, seed + 1, { drop: false });
    pc(BULBE, '#a8763a', () => {
      gradR(-12, -54, 4, 0, -40, 56, [[0, '#e8c07c'], [0.5, '#b07a3a'], [1, '#6a431e']], [-40, -106, 40, 4]);
      for (const k of [-0.8, -0.5, -0.2, 0.15, 0.45, 0.75]) strokePts(qbez([k * 6, -100], [k * 54, -46], [k * 30, -1], 10), 'rgba(70,40,14,0.5)', 1.1);
      strokePts(qbez([-21, -72], [-29, -46], [-22, -20], 8), 'rgba(255,242,208,0.85)', 3.4);
      dot(-17, -60, 3.4, 'rgba(255,252,236,0.9)');
      strokePts([[-30, -15], [-18, -22], [-6, -17]], 'rgba(60,34,12,0.5)', 1.3);
      hatch(null, 0.6, 4, 0.14, 1, undefined, [-40, -106, 40, 4]);
    }, seed + 2);
  }
  // ---- oignon : plus rond, peau cuivrée-violacée sèche et mate, queue sèche torsadée, barbe de racines grises ; origine = bas
  const OIGNON = [[0, -86], [9, -82], [23, -74], [36, -60], [43, -42], [41, -22], [31, -8], [16, -1], [0, 0], [-16, -1], [-31, -8], [-41, -22], [-43, -42], [-36, -60], [-23, -74], [-9, -82]];
  function oignonSeul(seed) {
    seed = seed || 7200;
    racines(13, 'rgba(176,160,130,0.95)', 12, seed);
    pc(ribbon(qbez([0, -80], [6, -100], [-8, -120], 8), 11, 3), '#a0804e', () => {
      strokePts(qbez([-2, -84], [3, -100], [-7, -117], 6), 'rgba(60,40,20,0.6)', 1);
      strokePts([[-3, -92], [3, -96]], 'rgba(60,40,20,0.5)', 1); strokePts([[-4, -104], [1, -108]], 'rgba(60,40,20,0.5)', 1);
    }, seed + 3);
    pc(OIGNON, '#8e4f4a', () => {
      gradR(-14, -50, 4, 0, -40, 54, [[0, '#cf9468'], [0.42, '#a45a40'], [0.78, '#7a3a52'], [1, '#55263c']], [-44, -88, 44, 4]);
      for (const k of [-0.85, -0.6, -0.35, -0.1, 0.15, 0.4, 0.65, 0.88]) strokePts(qbez([k * 6, -84], [k * 62, -44], [k * 26, -1], 10), 'rgba(80,30,45,0.5)', 1);
      fillPts([[14, -72], [31, -60], [36, -40], [27, -46], [18, -60]], 'rgba(232,196,150,0.6)');           // peau sèche qui pèle
      strokePts([[14, -72], [31, -60], [36, -40]], 'rgba(90,50,30,0.65)', 1.1);
      fillPts([[-36, -32], [-27, -14], [-31, -9], [-40, -22]], 'rgba(222,184,136,0.5)');
      strokePts(qbez([-22, -66], [-32, -48], [-28, -30], 8), 'rgba(255,225,200,0.35)', 2.2);
      hatch(null, 0.5, 3.4, 0.22, 1, undefined, [-44, -88, 44, 4]);
    }, seed + 4);
  }
  // ---- filet suspendu de bulbes ou d'oignons ; origine = bas du filet, nœud en (0,-196)
  const FILET_POS = [[-30, 0], [30, 0], [0, -4], [-20, -58], [22, -56], [0, -104]];
  const FILET = [[-64, -26], [-56, 4], [0, 14], [56, 4], [64, -26], [54, -106], [22, -166], [6, -192], [-6, -192], [-22, -166], [-54, -106]];
  function drawFilet(n, one) {
    n = clamp(Math.round(n), 1, 6);
    const c = cx_();
    for (let i = 0; i < n; i++) { const [px, py] = FILET_POS[i]; c.save(); c.translate(px, py); c.scale(0.6, 0.6); one(7300 + i * 17); c.restore(); }
    if (!SIL()) {
      c.save(); M.path(FILET, 3, 0.4); c.clip();
      for (let k = -12; k <= 12; k++) { strokePts([[k * 16 - 120, 20], [k * 16 + 120, -220]], 'rgba(214,190,140,0.85)', 1.4); strokePts([[k * 16 + 120, 20], [k * 16 - 120, -220]], 'rgba(214,190,140,0.85)', 1.4); }
      c.restore();
      strokePts(FILET.concat([FILET[0]]), 'rgba(170,140,90,0.9)', 1.8);
    }
    pc([[-8, -188], [8, -188], [6, -200], [-6, -200]], '#b89a62', null, 7390);
  }
  function drawBulbe(o) {
    if (o.filet) { suspendu(o, -200, () => drawFilet(o.filet === true ? 5 : o.filet, bulbeSeul)); return; }
    if (o.terre) { drawTerre(o); return; }
    suspendu(o, -104, () => bulbeSeul(7100));
  }
  function drawOignon(o) {
    if (o.filet) { suspendu(o, -200, () => drawFilet(o.filet === true ? 5 : o.filet, oignonSeul)); return; }
    suspendu(o, -120, () => oignonSeul(7200));
  }
  // ---- bulbe sous terre (vue en coupe) ; origine = surface du sol au centre ; o.neige 0..1 (couche de neige)
  function drawTerre(o) {
    const W = 150, H = 200, nz = clamp(o.neige == null ? 0 : o.neige);
    pc([[-W, 0, 1], [-W * 0.5, -5], [0, -8], [W * 0.5, -5], [W, 0, 1], [W, H, 1], [-W, H, 1]], '#5a3e2a', () => {
      for (let i = 0; i < 5; i++) { const y = 28 + i * 36; fillPts([[-W, y], [-W * 0.3, y + 6 * Math.sin(i * 1.3)], [W * 0.4, y - 4], [W, y + 3], [W, y + 14], [-W, y + 16]], i % 2 ? 'rgba(40,26,16,0.35)' : 'rgba(130,96,62,0.28)'); }
      for (let i = 0; i < 30; i++) dot(-W + 2 * W * hash(i * 2.3 + 1), 10 + (H - 14) * hash(i * 4.1 + 2), 1.5 + 2.5 * hash(i * 7.7), i % 3 ? 'rgba(160,128,96,0.6)' : 'rgba(30,20,12,0.6)');
      fillPts(ell(0, 108, 52, 66, 20), 'rgba(28,18,10,0.45)');                                        // loge du bulbe
      hatch(null, 0.5, 4.6, 0.22, 1, undefined, [-W, -10, W, H]);
    }, 7801);
    const c = cx_(); c.save(); c.translate(0, 160); bulbeSeul(7810); c.restore();
    pc(ribbon([[0, 58], [1, 40], [0, 24]], 6, 2), '#c9c48a', null, 7820);                            // germe pâle
    if (nz > 0) pc([[-W - 4, 4, 1], [-W * 0.5, -6 - 16 * nz], [0, -10 - 22 * nz], [W * 0.5, -6 - 16 * nz], [W + 4, 4, 1]], '#eef0f2', () => {
      strokePts([[-W, -2], [-W * 0.5, -4 - 12 * nz], [0, -6 - 18 * nz], [W * 0.5, -4 - 12 * nz], [W, -2]], 'rgba(150,170,195,0.6)', 1.4);
      hatch(null, 0.2, 5, 0.12, 1, '90,110,140', [-W, -40, W, 6]);
    }, 7803);
  }

  // ---- tulipe : tige, deux feuilles, fleur en coupe ; origine = pied de la tige ; 162 local de haut (pousse 1)
  const TCOL = { rouge: ['#b5342c', '#7e1e1a'], jaune: ['#e2b93c', '#a8821e'], rose: ['#dc8aa0', '#ad5c78'], violet: ['#6e3f7e', '#46264f'], blanc: ['#f0ebdf', '#c9c0aa'], orange: ['#e27a2c', '#a9531a'], flammee: ['#f1e7cc', '#d2c4a0'] };
  TUL.COULEURS = Object.keys(TCOL);
  const VERT = '#5f7b3e', VERTD = '#435a2a';
  function petale(w, h) { return [[0, 2], [w * 0.5, -h * 0.22], [w * 0.6, -h * 0.58], [w * 0.44, -h * 0.88], [w * 0.1, -h, 1], [-w * 0.16, -h * 0.95], [-w * 0.46, -h * 0.84], [-w * 0.6, -h * 0.56], [-w * 0.5, -h * 0.22]]; }
  function flammes(w, h, seed) {
    for (let i = 0; i < 5; i++) {
      const x0 = (i - 2) * w * 0.19, hh = h * (0.5 + 0.45 * hash(seed + i)), sw = (hash(seed + i * 3) - 0.5) * 9;
      fillPts([[x0 - 4.5, 0], [x0 - 5 + sw * 0.3, -hh * 0.4], [x0 - 2 + sw, -hh * 0.75], [x0 + sw * 1.3, -hh, 1], [x0 + 3 + sw, -hh * 0.7], [x0 + 5, -hh * 0.35], [x0 + 4.5, 0]], 'rgba(160,26,24,0.95)');
    }
    for (let i = 0; i < 9; i++) { const u = i / 8, x = lerp(-w * 0.55, w * 0.55, u), y = -h * (0.3 + 0.6 * Math.sin(PI * u)); strokePts([[x, y], [x * 0.85, y + 7]], 'rgba(150,20,20,0.85)', 1.6); }
  }
  function drawTulipe(o) {
    const pz = o.pousse == null ? 1 : clamp(o.pousse), op = o.ouverte == null ? 0.35 : clamp(o.ouverte), bal = o.balance || 0;
    const key = TCOL[o.couleur] ? o.couleur : 'flammee', col = TCOL[key], fl = key === 'flammee';
    if (pz <= 0.001) return;
    if (pz < 0.14) { const h = 16 * pz / 0.14; pc([[-5, 1, 1], [-2, -h * 0.6], [0, -h, 1], [3, -h * 0.5], [5, 1, 1]], VERT, null, 7401); return; }
    const L = 112 * smooth(0.08, 0.85, pz), kf = smooth(0.4, 1, pz), kl = smooth(0.05, 0.7, pz);
    const leaf = (len, ang, bend, seed) => {
      const tip = [Math.sin(ang) * len, -Math.cos(ang) * len], ctl = [Math.sin(ang) * len * 0.3 + bend, -len * 0.62];
      const mid = qbez([0, 0], ctl, tip, 12);
      pc(ribbonW(mid, (u) => 3 + 20 * Math.pow(Math.sin(PI * Math.min(1, u * 0.95 + 0.04)), 0.9) * (1 - u * 0.35)), VERT, () => {
        strokePts(mid, 'rgba(40,60,25,0.6)', 1.1); hatch(null, 1.1, 4, 0.18, 1, undefined, [-80, -110, 80, 4]);
        strokePts(tr(mid, -3, 0).slice(2, 8), 'rgba(220,235,190,0.35)', 1.6);
      }, seed);
    };
    if (kl > 0) { leaf(84 * kl, -0.42, -14, 7402); }
    const top = [Math.sin(bal) * L, -Math.cos(bal) * L];
    pc(ribbon(qbez([0, 0], [Math.sin(bal) * L * 0.25, -L * 0.55], top, 10), 7, 5), VERTD, () => strokePts([[1, 0], [top[0] + 1, top[1]]], 'rgba(200,220,170,0.35)', 1.2), 7403);
    if (kl > 0) { leaf(98 * kl, 0.36, 12, 7404); }
    const c = cx_(); c.save(); c.translate(top[0], top[1]); c.rotate(bal); c.scale(kf, kf);
    const w = 34, h = 50, sp = 0.12 + 0.55 * op;
    pc(petale(w * 0.95, h * 1.04), col[1], () => { if (fl) flammes(w, h, 7410); shade(0, -h, 0, 0, 0.25, [-30, -60, 30, 4]); }, 7411);           // pétale du fond
    for (const sd of [-1, 1]) {
      c.save(); c.translate(sd * 4, 0); c.rotate(sd * sp);
      pc(petale(w * 0.9, h), col[0], () => { if (fl) flammes(w * 0.9, h, 7420 + sd); shade(sd * 20, -h * 0.5, 0, -h * 0.5, 0.2, [-30, -60, 30, 4]); }, 7421 + sd);
      c.restore();
    }
    pc(petale(w * (0.88 - 0.1 * op), h * (0.97 - 0.22 * op)), col[0], () => {                                                                 // pétale de devant
      if (fl) flammes(w * 0.88, h * 0.95, 7430);
      strokePts([[-6, -6], [-9, -h * 0.6]], 'rgba(255,255,245,0.5)', 2.2);
      hatch(null, 1.3, 4.4, 0.14, 1, undefined, [-30, -60, 30, 4]);
    }, 7431);
    c.restore();
  }

  // ---- coffret de velours : bois sombre, ferrures dorées, intérieur bleu nuit ; origine = bas du devant (milieu)
  const CF = { w: 60, h: 44, D: 60, k: 22, sx: 8, ep: 12 };
  const cofPt = (x, z, yUp) => [x + CF.sx * (1 - z / CF.D), -CF.h - CF.k + CF.k * z / CF.D - yUp, 1];
  const lidTh = (o) => clamp(o.ouvert || 0) * 1.95;                                                   // 1 ≈ 112°
  function lidCorners(o) {
    const th = lidTh(o), cs = Math.cos(th), sn = Math.sin(th), Dd = CF.D, h = CF.ep;
    return { bb: [0, 0], bf: [Dd * cs, Dd * sn], tf: [Dd * cs - h * sn, Dd * sn + h * cs], tb: [-h * sn, h * cs], th, cs, sn };
  }
  function lidFront(o) { const L = lidCorners(o); return cofPt(0, L.tf[0], L.tf[1]); }
  const quad = (a, b) => [cofPt(-CF.w, a[0], a[1]), cofPt(CF.w, a[0], a[1]), cofPt(CF.w, b[0], b[1]), cofPt(-CF.w, b[0], b[1])];
  const BOIS = '#3e2619', BOISL = '#5e3c26', VELOURS = '#1f2a4c', VELOURSL = '#3a4a78';
  function drawCouvercle(o) {
    const L = lidCorners(o), W = CF.w;
    pc([cofPt(W, L.bb[0], L.bb[1]), cofPt(W, L.bf[0], L.bf[1]), cofPt(W, L.tf[0], L.tf[1]), cofPt(W, L.tb[0], L.tb[1])], '#2c1a10', () => hatch(null, 0.4, 3.4, 0.25), 7511);
    const topVis = -L.sn + 0.367 * L.cs > 0;
    if (topVis) pc(quad(L.tb, L.tf), BOISL, () => { strokePts([cofPt(-W + 6, L.tb[0], L.tb[1]), cofPt(-W + 6, L.tf[0], L.tf[1])], OR, 2.4); strokePts([cofPt(W - 6, L.tb[0], L.tb[1]), cofPt(W - 6, L.tf[0], L.tf[1])], OR, 2.4); hatch(null, 0.15, 3.8, 0.25); }, 7512);
    else pc(quad(L.bb, L.bf), VELOURS, () => { const m = cofPt(0, L.bf[0] * 0.5, L.bf[1] * 0.5); gradR(m[0] - 10, m[1], 2, m[0], m[1], 50, [[0, VELOURSL], [1, VELOURS]], [-80, -200, 80, 0]); strokePts(quad(L.bb, L.bf).concat([cofPt(-W, L.bb[0], L.bb[1])]), OR, 2); }, 7513);
    if (L.cs + 0.367 * L.sn > 0) pc(quad(L.bf, L.tf), BOIS, () => {
      const a = cofPt(-W, L.bf[0], L.bf[1]), b = cofPt(W, L.tf[0], L.tf[1]);
      strokePts([[a[0], (a[1] + b[1]) / 2], [b[0], (a[1] + b[1]) / 2]], OR, 2.6);
      const m = cofPt(0, (L.bf[0] + L.tf[0]) / 2, (L.bf[1] + L.tf[1]) / 2); fillPts([[m[0] - 7, m[1] - 5], [m[0] + 7, m[1] - 5], [m[0] + 6, m[1] + 9], [m[0] - 6, m[1] + 9]], OR);
    }, 7514);
  }
  function drawCoffret(o) {
    const W = CF.w, th = lidTh(o), bul = o.bulbe !== false;
    const avant = th > 1.05;                                                                           // couvercle derrière le bulbe quand il est bien ouvert
    if (avant) drawCouvercle(o);
    pc([cofPt(-W, CF.D, 0), cofPt(W, CF.D, 0), cofPt(W, 0, 0), cofPt(-W, 0, 0)], VELOURS, () => {     // ouverture : velours bleu nuit
      gradR(4, -56, 3, 4, -56, 60, [[0, VELOURSL], [1, '#141a30']], [-80, -80, 80, -30]);
      strokePts([cofPt(-W + 8, CF.D * 0.5, 0), cofPt(W - 8, CF.D * 0.5, 0)], 'rgba(120,140,200,0.25)', 3);
    }, 7501);
    if (bul && th > 0.05) { const c = cx_(); c.save(); c.translate(4, -40); c.scale(0.58, 0.58); bulbeSeul(7520); c.restore(); }
    pc([[W, 0, 1], [W, -CF.h, 1], [W + CF.sx, -CF.h - CF.k, 1], [W + CF.sx, -CF.k, 1]], '#2a180e', () => hatch(null, 0.4, 3.4, 0.3), 7502);   // flanc
    pc([[-W, 0, 1], [W, 0, 1], [W, -CF.h, 1], [-W, -CF.h, 1]], BOIS, () => {                                                                 // devant
      gradL(0, -CF.h, 0, 0, [[0, BOISL], [1, '#2c1a10']], [-W, -CF.h, W, 0]);
      for (const y of [-34, -22, -10]) strokePts([[-W + 4, y], [-10, y + 1.5], [W - 4, y - 1]], 'rgba(120,80,50,0.35)', 1);
      strokePts([[-W + 4, -CF.h + 4], [W - 4, -CF.h + 4]], OR, 2.4); strokePts([[-W + 4, -4], [W - 4, -4]], OR, 2.4);
      for (const sx of [-1, 1]) fillPts([[sx * W, 0], [sx * (W - 16), 0], [sx * W, -16]], OR);                                             // coins dorés
      fillPts([[-9, -30], [9, -30], [9, -12], [-9, -12]], OR); fillPts(ell(0, -23, 2.6, 2.6, 8), '#1a1008'); fillPts([[-1.3, -22], [1.3, -22], [2, -16], [-2, -16]], '#1a1008');
      hatch(null, 0.2, 4, 0.2);
    }, 7503);
    if (!avant) drawCouvercle(o);
  }

  // ---- contrat : feuille ivoire, lignes ondulées sans lettres, cachet de cire rouge ; origine = centre de la feuille (150 × 196 local)
  const CT = { w: 75, h: 98, t: 33 };
  const IVOIRE = '#efe6cf', IVOIRED = '#d8ccb0';
  function lignes(x0, x1, y0, y1, seed, ky) {
    ky = ky == null ? 1 : ky;
    for (let y = y0, i = 0; y <= y1; y += 13, i++) {
      const xe = x1 - (i % 4 === 3 ? 34 + 28 * hash(seed + i) : 8 * hash(seed + i)), pts = [];
      for (let x = x0; x <= xe; x += 5) pts.push([x, (y + 1.7 * Math.sin(x * 0.5 + i * 1.7)) * ky]);
      if (pts.length > 1) strokePts(pts, 'rgba(70,50,35,0.75)', 1.15);
    }
  }
  function cachet(x, y, r, seed) {
    pc([[x - 6, y + 4], [x - 14, y + 30, 1], [x - 6, y + 25], [x - 1, y + 31, 1], [x + 1, y + 4]], '#8a2420', null, seed);
    pc([[x + 2, y + 4], [x + 6, y + 30, 1], [x + 11, y + 25], [x + 16, y + 29, 1], [x + 9, y + 2]], '#7a1e1a', null, seed + 1);
    const ring = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr = r * (1 + 0.1 * Math.sin(i * 2.7)); ring.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]); }
    pc(ring, '#a82a24', () => { strokePts(ell(x, y, r * 0.62, r * 0.62, 14).concat([[x + r * 0.62, y]]), 'rgba(70,10,8,0.6)', 1.4); dot(x - r * 0.3, y - r * 0.35, r * 0.18, 'rgba(255,200,190,0.6)'); }, seed + 2);
  }
  function drawContrat(o) {
    const k = clamp(o.plie || 0), u1 = clamp(k / 0.5), u2 = clamp((k - 0.5) / 0.5), W = CT.w, H = CT.h, T = CT.t;
    const yA = u2 > 0 ? -T : -H, yB = u1 > 0 ? T : H;
    pc([[-W, yA, 1], [W, yA, 1], [W, yB, 1], [-W, yB, 1]], IVOIRE, () => {
      lignes(-58, 58, Math.max(yA + 14, -84), Math.min(yB - 10, 44), 7601);
      if (yB > 60) { strokePts([[-56, 74], [-46, 64], [-40, 76], [-30, 66], [-24, 78], [-12, 70]], 'rgba(60,40,30,0.8)', 1.4); }   // paraphe (boucles, pas de lettre)
      shade(W, 0, -W, 0, 0.12, [-W, -H, W, H]); hatch(null, 0.3, 6, 0.08);
    }, 7602, { edge: '#f6f0e0' });
    if (yB > 60) cachet(46, 70, 13, 7610);
    const flap = (y0, s, u, seed) => {                                                                   // s = +1 : volet du bas ; −1 : volet du haut
      const e = y0 + s * (H - T) * Math.cos(PI * u), front = (e - y0) * s > 0;
      const a = Math.min(y0, e), b = Math.max(y0, e); if (b - a < 0.6) return;
      pc([[-W, a, 1], [W, a, 1], [W, b, 1], [-W, b, 1]], front ? IVOIRE : IVOIRED, () => {
        if (front) { const c = cx_(); c.save(); c.translate(0, y0); c.scale(1, (e - y0) / (s * (H - T)) * s); lignes(-58, 58, s > 0 ? 10 : -50, s > 0 ? 50 : -12, seed); c.restore(); }
        else { shade(0, a, 0, b, 0.18, [-W, a, W, b]); strokePts([[-W, y0], [W, y0]], 'rgba(120,100,70,0.5)', 1.2); }
      }, seed, { edge: '#f6f0e0' });
      return { e, front };
    };
    if (u1 > 0) flap(T, 1, u1, 7620);
    if (u2 > 0) { flap(-T, -1, u2, 7630); if (u2 > 0.6) cachet(0, 26, 12, 7640); }
  }

  // ---- bourse de cuir à cordon ; origine = fond ; o.pleine 0..1 (défaut 1)
  const BOURSE = [[-10, -62], [10, -62], [18, -54], [32, -40], [40, -20], [36, -4], [20, 2], [-20, 2], [-36, -4], [-40, -20], [-32, -40], [-18, -54]];
  function bourseSeule(o) {
    const pl = o.pleine == null ? 1 : clamp(o.pleine), body = BOURSE.map(([x, y]) => [x * lerp(0.72, 1, pl), y * lerp(0.9, 1, pl)]);
    pc(body, '#6a4426', () => {
      gradR(-12, -34, 4, 0, -26, 44, [[0, '#9a6a42'], [1, '#4e3018']], [-42, -66, 42, 4]);
      for (const x of [-20, -8, 6, 18]) strokePts([[x * 0.4, -58], [x, -32], [x * 0.8, 0]], 'rgba(40,24,12,0.45)', 1.1);
      if (pl > 0.5) for (const [x, y] of [[-14, -18], [10, -22], [-2, -34]]) strokePts(ep(x, y, 10, 4, 8, PI * 0.1, PI * 0.9), 'rgba(255,225,180,0.25)', 1.4);
      strokePts([[-24, -38], [-18, -50]], 'rgba(255,230,190,0.4)', 2.2);
      hatch(null, 0.7, 4, 0.2);
    }, 7701);
    pc([[-12, -60], [-17, -74, 1], [-9, -67, 1], [-3, -78, 1], [3, -67, 1], [9, -78, 1], [14, -67, 1], [18, -74, 1], [12, -60]], '#7c5432', () => hatch(null, 1.4, 3, 0.25), 7702);
    strokePts([[-13, -61], [0, -58], [13, -61]], '#d8b46a', 3.2);
    strokePts([[12, -61], [30, -58], [44, -48]], '#d8b46a', 2.2); strokePts([[12, -60], [26, -52], [34, -40]], '#d8b46a', 2.2);
    pc([[44, -50], [47, -46], [48, -36, 1], [41, -36, 1], [42, -46]], OR, () => strokePts([[44, -44], [44, -37]], 'rgba(90,60,20,0.6)', 1), 7703, { drop: false });
    pc([[34, -42], [37, -38], [38, -28, 1], [31, -28, 1], [32, -38]], OR, () => strokePts([[34, -36], [34, -29]], 'rgba(90,60,20,0.6)', 1), 7704, { drop: false });
  }
  function drawBourse(o) { suspendu(o, -78, () => bourseSeule(o)); }

  // ---- pile de florins d'argent ; origine = dessus de la table sous la pile ; o.n pièces ; o.ecroule 0..1
  function florin(x, y, ry, seed) {
    pc(ep(x, y, 17, ry, 12, 0, PI).concat(ep(x, y - 4.2, 17, ry, 12, PI, 0)), '#7f837e', () => { for (let k = -14; k <= 14; k += 3) strokePts([[x + k, y - 4], [x + k, y + ry]], 'rgba(230,235,230,0.3)', 0.8); }, seed);
    pc(ell(x, y - 4.2, 17, ry, 18), '#c9ccc6', () => {
      strokePts(ell(x, y - 4.2, 12.5, ry * 0.72, 16).concat([[x + 12.5, y - 4.2]]), 'rgba(70,74,70,0.5)', 1.1);
      strokePts([[x - 9, y - 4.2 - ry * 0.4], [x - 2, y - 4.2 - ry * 0.72]], 'rgba(255,255,255,0.8)', 1.6);
    }, seed + 1, { drop: false });
  }
  const pileN = (o) => Math.max(1, Math.round(o.n == null ? 10 : o.n));
  function drawPile(o) {
    const n = pileN(o), e = clamp(o.ecroule || 0), L = [];
    for (let i = 0; i < n; i++) {
      const x0 = (hash(i * 3.3 + 0.5) - 0.5) * 3.4, y0 = -i * 4.4;
      const side = hash(i * 5.1 + 0.2) > 0.5 ? 1 : -1, x1 = side * (22 + 150 * hash(i * 2.7 + 0.3)), y1 = -3 + 15 * (hash(i * 8.3 + 0.7) - 0.3);
      const d = ((n - 1 - i) / Math.max(1, n - 1)) * 0.45, u = clamp((e - d) / 0.55), ue = 1 - (1 - u) * (1 - u);
      const x = lerp(x0, x1, ue), y = lerp(y0, y1, u) - 14 * Math.sin(PI * u) * (1 - 0.5 * u), ry = lerp(6.5, 15, Math.sin(PI * u));
      L.push({ i, x, y, ry, u });
    }
    const pile = L.filter((a) => a.u <= 0), vol = L.filter((a) => a.u > 0).sort((a, b) => (a.u >= 1 ? a.y : a.y - 40) - (b.u >= 1 ? b.y : b.y - 40));
    for (const a of pile) florin(a.x, a.y, a.ry, 7900 + a.i * 2);
    for (const a of vol) florin(a.x, a.y, a.ry, 7900 + a.i * 2);
  }

  // ---- transplantoir (outil de L'Écluse, tenu seulement) ; origine = prise, lame vers le bas
  function drawTransplantoir() {
    pc([[-6, -36, 1], [6, -36, 1], [7, 14, 1], [-7, 14, 1]], '#8a5a32', () => { strokePts([[-2, -32], [-2, 10]], 'rgba(255,220,170,0.35)', 1.6); hatch(null, 0.2, 3, 0.2); }, 7951);
    pc([[-7, 13, 1], [7, 13, 1], [6, 24, 1], [-6, 24, 1]], '#9a9a96', null, 7952);
    pc([[-4, 22], [4, 22], [14, 36], [15, 54], [8, 70], [0, 86, 1], [-8, 70], [-15, 54], [-14, 36]], '#a7aaa6', () => { strokePts([[0, 26], [0, 78]], 'rgba(60,60,60,0.55)', 1.4); strokePts([[-9, 40], [-8, 62]], 'rgba(255,255,255,0.6)', 1.6); }, 7953);
  }

  // registre : draw(o), grip (prise du poing), p2 (seconde main), pts (points nommés), base (point posé), held (options par défaut en main)
  const OBJ = {
    bulbe: { draw: drawBulbe, grip: [0, -14], pts: { centre: [0, -46], pointe: [0, -104], base: [0, 0] }, base: [0, 0] },
    oignon: { draw: drawOignon, grip: [0, -14], pts: { centre: [0, -42], pointe: [-8, -120], base: [0, 0] }, base: [0, 0] },
    tulipe: { draw: drawTulipe, grip: [0, -46], pts: { fleur: [0, -136], centre: [0, -80], base: [0, 0] }, base: [0, 0], held: { ouverte: 0.4 } },
    coffret: { draw: drawCoffret, grip: [0, -6], p2: (o) => lidFront(o), pts: { centre: [0, -40], bulbe: [4, -76], couvercle: (o) => lidFront(o), base: [0, 0] }, base: [0, 0] },
    contrat: { draw: drawContrat, grip: (o) => [68, lerp(40, 14, clamp(o.plie || 0))], p2: (o) => [-68, lerp(40, 14, clamp(o.plie || 0))], pts: { centre: [0, 0], cachet: [46, 70], haut: (o) => [0, lerp(-98, -33, smooth(0.5, 1, clamp(o.plie || 0)))], base: (o) => [0, lerp(98, 33, smooth(0, 0.5, clamp(o.plie || 0)))] }, base: (o) => [0, lerp(98, 33, smooth(0, 0.5, clamp(o.plie || 0)))], held: { echelle: 0.85 } },
    bourse: { draw: drawBourse, grip: [0, -62], pts: { centre: [0, -28], bouche: [0, -70], base: [0, 0] }, base: [0, 0] },
    pile: { draw: drawPile, grip: [0, 0], pts: { base: [0, 0], haut: (o) => [0, -pileN(o) * 4.4 - 4] }, base: [0, 0] },
    transplantoir: { draw: drawTransplantoir, grip: [0, -10], pts: { pointe: [0, 86], centre: [0, 30] }, base: [0, 86] },
  };
  TUL.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, n, o) => { const v = ob.pts[n]; return v == null ? null : typeof v === 'function' ? v(o) : v; };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: (p && p.t) || 0, echelle: 1 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.scale(oo.echelle, oo.echelle); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }

  // =====================================================================
  // 2) PIÈCES COMMUNES : bras à articulations rondes (cercle centré sur le rivet), objets tenus, doigts par-dessus
  // =====================================================================
  const R_COUDE = 11.5, DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  // main ouverte relevée au poignet (paume vers l'avant, doigts vers +x local = vers le haut quand le bras est tendu devant)
  const PAUME = [[11, 40], [10, 72], [16, 70], [24, 65], [30, 67], [28, 74], [36, 76], [46, 78], [48, 83], [38, 85], [48, 88], [48, 93], [38, 94], [46, 97], [44, 102], [32, 104], [18, 105], [4, 105], [-8, 101], [-11, 88], [-11, 40]];
  function armR(len, wt, rc) { rc = rc || R_COUDE; const m = len * 0.42; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, m], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, m]]); }
  function foreR(kind) { const cap = ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU); return kind === 'paume' ? cap.concat(PAUME) : cap.concat(X.forePts(kind).slice(2)); }
  function upDef(at, base, seed, wt, deco) { return { parent: 'torso', at, pts: armR(94, wt), base, seed, paint: (p) => { if (deco) deco(p); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26); } }; }
  function foreDef(parent, base, skin, back, seed, cuff, deco) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, 94], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (deco) deco(p);
      if (k === 'paume') {
        fillPts([[-14, 76, 1], [10, 76, 1], [10, 60, 1], [56, 58, 1], [56, 112, 1], [-14, 112, 1]], skin);
        for (const y of [84, 90, 96]) strokePts([[30, y], [44, y]], 'rgba(70,35,20,0.45)', 1);
        strokePts([[-4, 96], [16, 92]], 'rgba(70,35,20,0.35)', 1);
      } else { fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k); }
      if (cuff) cuff(p);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  const dentelle = (col, colD) => () => { fillPts([[-14, 60, 1], [14, 60, 1], [16, 74], [10, 79], [4, 74], [-2, 79], [-8, 74], [-14, 79], [-16, 74]], col); strokePts([[-13, 66], [13, 66]], colD, 1); };
  function heldParts(skin, seed) {
    const dP = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
    const F = [4, 96];
    return {
      objet: { parent: 'armF_lo', at: F, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: F, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: dP },
      objetB: { parent: 'armB_lo', at: F, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: F, noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: dP },
    };
  }

  // ---- préparation commune des poses
  function prep(p) { p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); q._o0 = q.ang.objet || 0; q._oB0 = q.ang.objetB || 0; return q; }
  function defA(A, d) { for (const k in d) if (A[k] == null) A[k] = d[k]; }
  const faceSet = (q, d) => { for (const k in d) if (q.face[k] == null) q.face[k] = d[k]; };
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  // angle cumulé du torse à l'écran (tilt + rotations des ancêtres du torse) pour garder un objet droit
  function torsoRot(def, q) { let a = q.tilt || 0, n = def.parts.torso.parent; a += (def.parts.torso.rest || 0) + (q.ang.torso || 0); while (n) { a += (def.parts[n].rest || 0) + (q.ang[n] || 0); n = def.parts[n].parent; } return a; }
  function applyDroit(def, q) {
    const A = q.ang, tl = torsoRot(def, q);
    A.objet = q.droit ? q._o0 - ((A.armF_up || 0) + (A.armF_lo || 0) + tl) : q._o0;
    A.objetB = q.droitB ? q._oB0 - ((A.armB_up || 0) + (A.armB_lo || 0) + tl) : q._oB0;
  }
  function autoTenu(q) {
    if (has(q.tenu)) { if (!q.handF || q.handF === 'open') q.handF = 'fist'; if (q.droit == null) q.droit = true; }
    if (has(q.tenuB)) { if (!q.handB || q.handB === 'open') q.handB = 'fist'; if (q.droitB == null) q.droitB = true; }
  }
  function locPt(def, q, x, y, s, dir, part, p) { const { mats } = M.partMatrices(def, q, x, y, s, dir); return M.wpt(mats[part], p[0], p[1]); }
  function objPt(def, q, x, y, s, dir, arm, p, raw) {
    const F = arm === 'armF', name = F ? q.tenu : q.tenuB, { mats } = M.partMatrices(def, q, x, y, s, dir), fm = mats[arm + '_lo'].translate(4, 96);
    if (!has(name) || !OBJ[name]) return M.wpt(fm, 0, 0);
    const ob = OBJ[name], oo = heldOpts(name, F ? q.tenuO : q.tenuBO, q), g = gripOf(ob, oo), e = oo.echelle;
    const pp = raw ? p : (p ? ptOf(ob, p, oo) : null); if (!pp) return M.wpt(fm, 0, 0);
    return M.wpt(fm.rotate(((F ? q.ang.objet : q.ang.objetB) || 0) * D), (pp[0] - g[0]) * e, (pp[1] - g[1]) * e);
  }
  // amène le poing (ou le point nommé de l'objet tenu) sur la cible écran, par M.ik ; bend = bendSign (défaut : def.bend[arm]) ; mélange k
  function reach(def, q, x, y, s, dir, arm, cible, k, ptName, bend) {
    if (!(k > 0) || !cible) return;
    bend = bend || (def.bend && def.bend[arm]) || 1;
    const A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    const tmp = Object.assign({}, q, { ang: Object.assign({}, A) });
    let T = [cible[0], cible[1]], sol = null;
    for (let it = 0; it < 4; it++) {
      sol = M.ik(def, tmp, x, y, s, dir, arm, T, bend);
      tmp.ang[arm + '_up'] = sol.up; tmp.ang[arm + '_lo'] = sol.lo; applyDroit(def, tmp);
      if (!ptName) break;
      const E = objPt(def, tmp, x, y, s, dir, arm, ptName);
      T = [T[0] + cible[0] - E[0], T[1] + cible[1] - E[1]];
    }
    if (!ptName) { const E = objPt(def, tmp, x, y, s, dir, arm, null); const sol2 = M.ik(def, tmp, x, y, s, dir, arm, [2 * cible[0] - E[0], 2 * cible[1] - E[1]], bend); sol = sol2; }
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  function finishQ(def, q, x, y, s, dir) {
    if (q.atteint > 0 && q.cible) { const arm = q.bras === 'B' ? 'armB' : 'armF'; reach(def, q, x, y, s, dir, arm, q.cible, ease(clamp(q.atteint)), q.ptCible || (has(arm === 'armF' ? q.tenu : q.tenuB) ? 'centre' : null)); }
    applyDroit(def, q); q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const oo = heldOpts(q.tenu, q.tenuO, q), P2 = objPt(def, q, x, y, s, dir, 'armF', OBJ[q.tenu].p2(oo), true);
      reach(def, q, x, y, s, dir, 'armB', P2, 1, null, def.bend.deux || def.bend.armB); q.handB = 'fist'; q._deux = true;
    }
    applyDroit(def, q);
    return q;
  }
  function run(def, q, x, y, s, o, nom) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF, nom }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  TUL.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, q = ptOf(ob, nom, oo); if (!q) return null; const g = gripOf(ob, oo), e = oo.echelle;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  function marcheQ(q) {
    const m = clamp(q.marche || 0); if (m <= 0) return; const t = q.t || 0, w = Math.sin(t * 6.5);
    q.ang.legF = (q.ang.legF || 0) + 0.36 * m * w; q.ang.legB = (q.ang.legB || 0) - 0.36 * m * w;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(t * 6.5)) * 7 * m;
    if (!has(q.tenuB)) q.ang.armB_up = (q.ang.armB_up || 0) + 0.2 * m * w;
  }

  // =====================================================================
  // 3) LE MARCHAND — bourgeois à la Frans Hals : grand feutre noir à large bord et calotte haute arrondie, grande fraise blanche en meule,
  //    pourpoint bordeaux à boutons dorés, manches ocre à crevés, culotte noire, bas gris, souliers à rosette ; barbiche pointue et
  //    moustache relevée blond-roux, joues rosées, ventre un peu rond. ≈ 467 px sans chapeau à s 0,9 (≈ 517 avec).
  // =====================================================================
  const MA = { peau: '#e8c3a0', peauD: '#cba07e', poil: '#b0693a', poilD: '#82461f', pp: '#6e2a2a', ppD: '#541e1e', ppL: '#8c3c36', manche: '#b08a3e', mancheD: '#8e6c2c',
    creve: '#efe4c8', culotte: '#1f1b1d', bas: '#8a8a88', basD: '#6c6c6a', soulier: '#1c1614', feutre: '#1b1819', feutreL: '#3c3637', fraise: '#f3eee2', fraiseD: '#cfc6b0' };
  const MA_TORSO = [[-12, -188], [8, -188], [16, -176], [26, -164], [37, -148], [47, -126], [56, -100], [62, -70], [63, -42], [58, -16], [50, 4], [46, 30, 1], [-40, 32, 1], [-44, 4], [-44, -60], [-42, -110], [-38, -150], [-28, -174]];
  function maHead(p) {
    const j = clamp(p.machoire || 0) * 10;
    return [[-14, 16], [10, 16], [11, 2 + j * 0.6], [16, -6 + j], [24, -10 + j], [29, -16 + j * 0.8], [28, -22], [30, -26], [29, -30], [33, -34], [39, -40, 1], [34, -47], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-33, -46], [-26, -28], [-18, -8]];
  }
  const MA_HAT = [[-88, -58, 1], [-62, -63], [-22, -67], [20, -68], [58, -67], [86, -63], [98, -60, 1], [93, -69], [68, -75], [38, -79], [38, -98], [35, -120], [27, -141], [9, -153], [-13, -153], [-30, -141], [-38, -118], [-39, -96], [-40, -79], [-66, -73], [-89, -66]];
  const MA_FRAISE = (() => { const o = []; for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, b = 1 + 0.07 * Math.abs(Math.sin(a * 11)); o.push([6 + 57 * Math.cos(a) * (1 + 0.02 * Math.sin(a * 11)), 20 * Math.sin(a) * b]); } return o; })();
  function mkMarchand() {
    const legP = (back) => () => {
      fillPts([[-46, -30, 1], [60, -30, 1], [60, 114, 1], [-46, 114, 1]], back ? '#141113' : MA.culotte);
      for (const x of [-12, 0, 12]) strokePts([[x, -10], [x * 1.2, 60], [x * 0.6, 108]], 'rgba(90,80,90,0.5)', 1.1);
      fillPts([[-24, 106], [22, 104], [22, 116], [-24, 118]], MA.pp);
      if (!back) { fillPts(ell(22, 112, 6, 8, 10), MA.ppL); fillPts([[22, 112], [30, 128], [24, 128]], MA.pp); }
      fillPts([[-46, 214, 1], [60, 214, 1], [60, 262, 1], [-46, 262, 1]], MA.soulier);
      if (!back) { dot(26, 219, 6.5, MA.ppL); dot(26, 219, 2.6, OR); strokePts([[36, 226], [46, 231]], 'rgba(255,255,255,0.25)', 1.3); }
      hatch([[-26, 120], [-6, 120], [-6, 214], [-26, 214]], 0.8, 4, back ? 0.35 : 0.22);
    };
    const creves = (dark) => () => { fillPts([[-16, -16], [16, -14], [16, 4], [-16, 4]], dark ? MA.ppD : MA.pp); for (const x of [-7, 2, 10]) { fillPts([[x - 2.2, 12], [x + 2.2, 12], [x + 2.6, 76], [x - 2.6, 76]], MA.creve); strokePts([[x - 2.6, 12], [x - 2.6, 76]], 'rgba(80,40,30,0.6)', 1); } };
    const crevesL = (dark) => () => { for (const x of [-5, 4]) { fillPts([[x - 2, 6], [x + 2, 6], [x + 2.4, 54], [x - 2.4, 54]], MA.creve); strokePts([[x - 2.4, 6], [x - 2.4, 54]], 'rgba(80,40,30,0.6)', 1); } if (dark) hatch(null, 0.8, 3.6, 0.2); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: MA_TORSO, base: MA.pp, seed: 9101, paint: () => {
        strokePts([[18, -176], [30, -158], [44, -134], [54, -108], [60, -78], [61, -48], [56, -20], [50, 2]], 'rgba(40,10,10,0.55)', 1.4);
        for (const [x, y] of [[29, -160], [40, -142], [50, -120], [57, -96], [61, -72], [61, -48], [57, -24]]) { dot(x, y, 3, ORD); dot(x - 0.7, y - 0.7, 1.3, ORL); }
        fillPts([[-48, -4, 1], [54, -6, 1], [52, 6, 1], [-48, 8, 1]], MA.ppD);
        for (const x of [-30, -12, 6, 24, 40]) strokePts([[x, 6], [x - 2, 30]], 'rgba(20,5,5,0.6)', 1.3);                     // basques
        hatch([[-50, -176], [-12, -176], [-18, 34], [-50, 34]], 0.75, 4.4, 0.28);
        shade(62, -80, -30, -80, 0.22); strokePts([[40, -128], [54, -100]], 'rgba(255,200,190,0.28)', 2.6);
      } },
      legB: { parent: 'torso', at: [-8, -2], pts: X.legPts(1.3), base: MA.basD, seed: 9102, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [8, -2], pts: X.legPts(1.3), base: MA.bas, seed: 9103, paint: legP(false) },
      armB_up: upDef([-12, -150], MA.mancheD, 9104, 17, creves(true)),
      armB_lo: foreDef('armB_up', MA.mancheD, MA.peauD, true, 9105, dentelle(MA.fraiseD, 'rgba(120,110,90,0.6)'), crevesL(true)),
      head: { parent: 'torso', at: [8, -184], pts: maHead, base: MA.peau, seed: 9106, noRivet: true, paint: (p) => {
        const f = p.face || {}, j = clamp(p.machoire || 0);
        fillPts([[28, -72], [22, -86], [6, -96], [-12, -97], [-26, -88], [-37, -66], [-41, -40], [-39, -12], [-31, 10], [-20, 18], [-16, -6], [-14, -30], [-8, -52], [6, -66], [18, -70]], MA.poil, 3);
        for (const x of [16, 4, -8]) strokePts([[x + 8, -88], [x, -70]], 'rgba(90,40,15,0.5)', 1.1);
        for (const [a, b] of [[[-30, -60], [-34, -10]], [[-22, -62], [-24, 6]], [[-14, -50], [-18, 10]]]) strokePts([a, b], 'rgba(90,40,15,0.55)', 1.2);
        X.earPaint(-8, -42);
        hatch([[-22, -40], [2, -28], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.25);
        dot(19, -30, 10, 'rgba(224,108,96,0.42)');                                                                       // joue rosée
        X.eye(f, 18, -54); X.brow(f, 18, -63, 'rgba(120,60,25,0.95)', 2.8);
        if (j > 0.05) { fillPts([[19, -22], [29, -23], [30, -20 + 12 * j], [20, -18 + 11 * j]], '#3a1714'); strokePts([[21, -21], [28, -21]], 'rgba(255,240,230,0.7)', 1.2); }
        else X.mouth(f, 28, -20, 'rgba(120,45,40,0.95)');
      } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: MA.poil, seed: 9107, pts: [[35, -31], [27, -34], [17, -33], [9, -37], [6, -48, 1], [13, -39], [19, -29], [28, -25], [36, -27]], paint: () => hatch(null, 1.2, 2.6, 0.25) },
      fraise: { parent: 'torso', at: [8, -180], noRivet: true, base: MA.fraise, seed: 9108, pts: MA_FRAISE, texA: 0.4, paint: () => {
        for (let x = -46; x <= 58; x += 6.5) strokePts(qbez([x, -18], [x + 3.4, 0], [x, 18], 6), 'rgba(140,130,110,0.6)', 1.1);
        shade(-50, 0, 0, 0, 0.25, [-60, -24, 0, 24]);
        strokePts([[-40, -14], [20, -18], [56, -10]], 'rgba(255,255,255,0.8)', 1.6);
      } },
      barbiche: { parent: 'head', at: [0, 0], noRivet: true, base: MA.poil, seed: 9109, pts: (p) => tr([[13, -14], [21, -17], [29, -15], [29, -6], [25, 6], [21, 28, 1], [15, 8], [11, -4]], 0, clamp(p.machoire || 0) * 10), paint: () => { strokePts([[18, -12], [21, 22]], 'rgba(90,40,15,0.6)', 1.1); hatch(null, 1.3, 2.6, 0.22); } },
      chapeau: { parent: 'head', at: [0, 0], noRivet: true, base: MA.feutre, seed: 9110, pts: (p) => { const k = ease(clamp(p.chapeau || 0)); return tr(MA_HAT, -3 * k, -46 * k); }, paint: (p) => {
        const k = ease(clamp(p.chapeau || 0)), c = cx_(); c.save(); c.translate(-3 * k, -46 * k);
        fillPts([[-41, -78], [39, -79], [39, -93], [-40, -92]], '#3d1c1e');
        fillPts([[30, -92], [40, -92], [40, -79], [30, -79]], ORD);
        strokePts([[-86, -61], [-20, -66], [60, -66], [96, -61]], 'rgba(120,110,110,0.6)', 1.3);
        strokePts([[-20, -138], [-32, -112], [-34, -96]], 'rgba(150,140,140,0.45)', 2.6);
        hatch(null, 0.9, 4.2, 0.22, 1, '200,190,190', [-90, -160, 100, -55]);
        c.restore();
      } },
      armF_up: upDef([-4, -150], MA.manche, 9111, 17, creves(false)),
      armF_lo: foreDef('armF_up', MA.manche, MA.peau, false, 9112, dentelle(MA.fraise, 'rgba(120,110,90,0.6)'), crevesL(false)),
    };
    Object.assign(parts, heldParts(MA.peau, 9130));
    return { hipY: -238, parts, handLen: 100, fist: [4, 96], bend: { armF: 1, armB: 1, deux: 1 }, nom: 'marchand', rod: { part: 'torso', at: [-30, 10] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'torso', 'head', 'moustache', 'fraise', 'barbiche', 'chapeau', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.tulMarchand = mkMarchand();
  TUL.marchandPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.tulMarchand; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, { armF_up: -0.12, armF_lo: -0.22, armB_up: 0.06, armB_lo: -0.18 });
    marcheQ(q);
    const jo = ease(clamp(q.joie || 0)), dp = ease(clamp(q.depit || 0)), br = ease(clamp(q.brandir || 0));
    if (q.tenu === 'contrat' && q.deuxMains == null && !(jo > 0)) q.deuxMains = true;
    if (q.tenu === 'contrat' && q.presente == null && !(br > 0) && !(jo > 0)) q.presente = 1;
    const pr = ease(clamp(q.presente || 0));
    autoTenu(q);
    const ch = ease(clamp(q.chapeau || 0)); A.chapeau = (A.chapeau || 0) - 0.08 * ch;
    if (clamp(q.machoire || 0) > 0.3) faceSet(q, { eyes: 'wide', brow: 'up' });
    const held = has(q.tenu), heldB = has(q.tenuB);
    if (dp > 0) {
      A.head = (A.head || 0) + 0.3 * dp; q.dy = (q.dy || 0) + 4 * dp; q.tilt = (q.tilt || 0) + 0.03 * dp; faceSet(q, { brow: 'worry', mouth: 'tight', eyes: 'half' });
      blend(q, 'armF_up', -0.5, dp); blend(q, 'armF_lo', -0.2, dp); blend(q, 'armB_up', 0.42, dp); blend(q, 'armB_lo', -0.16, dp);
      if (!held) q.handF = 'open'; if (!heldB) q.handB = 'open';
    }
    if (pr > 0) reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [116, -114]), pr, held ? 'centre' : null);
    if (br > 0) reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [150, -170]), br, held ? 'centre' : null);
    if (jo > 0) {
      A.head = (A.head || 0) - 0.26 * jo; faceSet(q, { mouth: 'smile', brow: 'up' });
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [178, -292]), jo, null, TUL.BEND.marchand.joie.armF);
      if (!heldB) reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'torso', [-118, -300]), jo, null, TUL.BEND.marchand.joie.armB);
      if (!held) q.handF = 'open'; if (!heldB) q.handB = 'open';
    }
    return finishQ(def, q, x, y, s, dir);
  };
  TUL.marchand = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.tulMarchand, TUL.marchandPose(pose, x, y, s, dir), x, y, s, o, 'marchand'); };

  // =====================================================================
  // 4) CHARLES DE L'ÉCLUSE — vieux savant : crâne chauve, couronne de cheveux blancs, barbe blanche courte et carrée, petite fraise,
  //    longue robe brun tabac à col de fourrure sombre, ceinture. Pas de couvre-chef. Racine = 'jupe' (robe sous la taille) ; le torse s'y articule.
  // =====================================================================
  const EC = { peau: '#e2c2a4', peauD: '#c49f80', robe: '#6b4a2e', robeD: '#523822', robeL: '#82603e', four: '#3a2e24', fourL: '#5c4c3e', blanc: '#ece8e0', blancD: '#bdb6aa', ceint: '#2b1d12', soulier: '#2a1e16' };
  const EC_TORSO = [[-12, -186], [8, -186], [18, -174], [28, -158], [34, -130], [36, -96], [36, -60], [38, -22], [40, 12, 1], [-42, 12, 1], [-44, -22], [-46, -70], [-47, -118], [-43, -156], [-30, -176]];
  const EC_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [29, -26], [28, -30], [32, -34], [40, -41, 1], [34, -49], [29, -57], [29, -65], [26, -81], [14, -96], [-6, -101], [-24, -93], [-33, -71], [-32, -46], [-24, -28], [-17, -8]];
  const EC_JUPE_D = [[36, -30], [40, 40], [46, 110], [52, 170], [58, 228, 1], [20, 231], [-20, 231], [-56, 228, 1], [-52, 170], [-48, 110], [-46, 40], [-44, -30]];
  const EC_JUPE_G = [[36, -30], [62, 16], [98, 50], [120, 78], [122, 94, 1], [60, 96], [-20, 96], [-76, 95, 1], [-82, 68], [-68, 36], [-52, 8], [-44, -30]];
  const EC_SHOE_D = [[16, 224], [40, 225], [54, 231], [57, 239, 1], [14, 239, 1], [12, 231]];
  const EC_SHOE_G = [[-86, 70], [-74, 68], [-66, 74], [-64, 95, 1], [-86, 95, 1], [-89, 84]];
  const EC_FRAISE = (() => { const o = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU, b = 1 + 0.08 * Math.abs(Math.sin(a * 8)); o.push([4 + 34 * Math.cos(a), 11 * Math.sin(a) * b]); } return o; })();
  function mkEcluse() {
    const fourrure = () => { for (let i = 0; i < 40; i++) { const x = -40 + 76 * hash(i * 3.7), y = -184 + 110 * hash(i * 1.3); strokePts([[x, y], [x + 2, y + 6]], 'rgba(120,100,80,0.55)', 1.3); } };
    const parts = {
      jupe: { parent: null, at: [0, 0], pts: (p) => lerpPts(EC_JUPE_D, EC_JUPE_G, p._g || 0), base: EC.robe, seed: 9201, paint: (p) => {
        const J = lerpPts(EC_JUPE_D, EC_JUPE_G, p._g || 0);
        for (const k of [0.2, 0.4, 0.6, 0.8]) { const a = [lerp(J[11][0], J[0][0], k), -20], b = [lerp(J[7][0], J[4][0], k), lerp(J[7][1], J[4][1], k) - 4]; strokePts([a, [(a[0] + b[0]) / 2 + 4, (a[1] + b[1]) / 2], b], 'rgba(30,18,10,0.45)', 1.3); }
        strokePts(J.slice(4, 8), 'rgba(30,18,10,0.6)', 3);
        hatch(null, 0.75, 4.4, 0.24, 1, undefined, [-90, -40, 130, 240]); shade(40, 0, -50, 0, 0.24, [-90, -40, 130, 240]);
      } },
      souliers: { parent: 'jupe', at: [0, 0], noRivet: true, base: EC.soulier, seed: 9202, pts: (p) => lerpPts(EC_SHOE_D, EC_SHOE_G, p._g || 0) },
      torso: { parent: 'jupe', at: [0, 0], pts: EC_TORSO, base: EC.robe, seed: 9203, paint: () => {
        for (const [x0, x1] of [[-30, -34], [-14, -20], [4, 0], [20, 22]]) strokePts([[x0, -150], [x1, 6]], 'rgba(30,18,10,0.4)', 1.2);
        fillPts([[-48, -8, 1], [42, -8, 1], [42, 6, 1], [-48, 6, 1]], EC.ceint);
        fillPts([[24, -10], [34, -10], [34, 8], [24, 8]], ORD); fillPts([[27, -6], [31, -6], [31, 4], [27, 4]], EC.ceint);
        strokePts([[10, -8], [8, 30], [12, 46]], EC.ceint, 2.4);
        hatch([[-52, -170], [-14, -170], [-18, 12], [-52, 12]], 0.75, 4.4, 0.3); shade(38, -80, -40, -80, 0.22);
      } },
      col: { parent: 'torso', at: [0, 0], noRivet: true, base: EC.four, seed: 9204, pts: [[-34, -170], [-6, -188], [16, -182], [30, -164], [34, -136], [30, -92], [22, -60, 1], [14, -94], [10, -140], [-4, -160], [-22, -152], [-44, -134], [-46, -156]], paint: fourrure },
      armB_up: upDef([-12, -150], EC.robeD, 9205, 17),
      armB_lo: foreDef('armB_up', EC.robeD, EC.peauD, true, 9206, () => fillPts([[-16, 56, 1], [16, 56, 1], [17, 76, 1], [-16, 76, 1]], EC.four)),
      head: { parent: 'torso', at: [6, -182], pts: EC_HEAD, base: EC.peau, seed: 9207, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[4, -68], [-10, -74], [-28, -72], [-38, -56], [-38, -34], [-30, -12], [-22, -4], [-24, -26], [-28, -44], [-24, -58], [-10, -64], [2, -62]], EC.blanc, 2);
        for (const [a, b] of [[[-30, -60], [-34, -30]], [[-22, -66], [-28, -40]], [[-12, -66], [-16, -56]]]) strokePts([a, b], 'rgba(150,140,130,0.6)', 1.1);
        X.earPaint(-8, -42);
        strokePts([[-16, -96], [2, -100], [16, -92]], 'rgba(255,248,235,0.8)', 3); dot(-4, -90, 3, 'rgba(255,255,240,0.55)');                    // crâne luisant
        for (const y of [-74, -80]) strokePts([[6, y], [20, y - 2]], 'rgba(120,80,60,0.45)', 1.1);                                               // rides du front
        strokePts([[26, -50], [30, -46]], 'rgba(120,80,60,0.45)', 1); hatch([[-22, -40], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.25);
        dot(16, -34, 7, 'rgba(205,130,110,0.22)');
        X.eye(f, 18, -55, 0.95); X.brow(f, 18, -63, 'rgba(235,232,225,1)', 4);
      } },
      fraise: { parent: 'torso', at: [8, -180], noRivet: true, base: EC.blanc, seed: 9208, pts: EC_FRAISE, texA: 0.4, paint: () => { for (let x = -26; x <= 36; x += 5.5) strokePts(qbez([x, -10], [x + 2.4, 0], [x, 10], 4), 'rgba(140,130,110,0.6)', 1); } },
      barbe: { parent: 'head', at: [0, 0], noRivet: true, base: EC.blanc, seed: 9209, pts: [[31, -24], [35, -12], [36, 4], [33, 14, 1], [0, 17, 1], [-9, 6], [-12, -10], [-10, -22], [-2, -30], [8, -28], [16, -24], [24, -28]], paint: (p) => {
        for (const x of [-4, 4, 12, 20, 28]) strokePts([[x, -20], [x + 1, 12]], 'rgba(150,145,135,0.6)', 1.1);
        X.mouth(p.face || {}, 28, -17, 'rgba(110,60,55,0.95)');
      } },
      armF_up: upDef([-4, -150], EC.robe, 9210, 17),
      armF_lo: foreDef('armF_up', EC.robe, EC.peau, false, 9211, () => fillPts([[-16, 56, 1], [16, 56, 1], [17, 76, 1], [-16, 76, 1]], EC.four)),
    };
    Object.assign(parts, heldParts(EC.peau, 9230));
    return { hipY: -238, parts, handLen: 100, fist: [4, 96], bend: { armF: 1, armB: 1, deux: 1 }, nom: 'ecluse', rod: { part: 'torso', at: [-26, 0] },
      order: ['armB_up', 'armB_lo', 'objetB', 'souliers', 'jupe', 'torso', 'head', 'fraise', 'barbe', 'col', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.tulEcluse = mkEcluse();
  TUL.eclusePose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.tulEcluse; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, { armF_up: -0.1, armF_lo: -0.25, armB_up: 0.05, armB_lo: -0.2 });
    const g = ease(clamp(q.genou || 0)), pl = ease(clamp(q.planter || 0)), rp = ease(clamp(q.repousse || 0)), jo = ease(clamp(q.joues || 0)), rg = ease(clamp(q.regarde || 0));
    if (pl > 0 && q.tenu == null) q.tenu = 'transplantoir';
    q._g = g; q.dy = (q.dy || 0) + 143 * g;
    A.torso = (A.torso || 0) + 0.88 * g - 0.1 * rp;
    A.head = (A.head || 0) - 0.3 * g + 0.4 * rg - 0.06 * rp;
    autoTenu(q);
    if (rg > 0) faceSet(q, { eyes: 'half', brow: 'worry' });
    if (g > 0 && !(pl > 0)) {                                                                       // à genoux sans planter : mains sur les cuisses
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'jupe', [88, 34]), g, null);
      reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'jupe', [70, 30]), g, null);
    }
    if (pl > 0) {
      const dig = Math.max(0, Math.sin((q.t || 0) * 5)) * 8;
      const tgt = [x + dir * s * 186, y + (6 - dig) * s];
      reach(def, q, x, y, s, dir, 'armF', has(q.tenu) ? tgt : [tgt[0], y - 14 * s], pl, has(q.tenu) ? 'pointe' : null);
      if (!has(q.tenu)) q.handF = 'open';
      reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'jupe', [74, 32]), Math.min(pl, g), null); if (!has(q.tenuB)) q.handB = 'open';
    }
    if (rp > 0) { reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [168, -152]), rp, null); if (!has(q.tenu)) q.handF = 'paume'; faceSet(q, { brow: 'frown', mouth: 'tight' }); }
    if (jo > 0) {
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'head', [12, -30]), jo, null);
      reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'head', [2, -30]), jo, null);
      if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; faceSet(q, { brow: 'worry', mouth: 'o', eyes: 'wide' });
    }
    return finishQ(def, q, x, y, s, dir);
  };
  TUL.ecluse = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.tulEcluse, TUL.eclusePose(pose, x, y, s, dir), x, y, s, o, 'ecluse'); };

  // =====================================================================
  // 5) L'ACHETEUR — jeune homme maigre, chapeau brun à bord relevé derrière avec plume blanche, col plat de dentelle, pourpoint bleu ardoise,
  //    culotte brune, bottes à revers. Rasé, cheveux châtains au col.
  // =====================================================================
  const AC = { peau: '#e6c6a8', peauD: '#c9a586', pp: '#3e5c6b', ppD: '#2f4854', ppL: '#56788a', col: '#f1ece0', colD: '#cfc7b4', culotte: '#6a4a32', culotteD: '#523826', botte: '#33241a', revers: '#5e4430', cheveux: '#4a3424', feutre: '#5a3c26', feutreL: '#7a5638', plume: '#f2efe6' };
  const AC_TORSO = [[-10, -188], [8, -188], [16, -176], [24, -160], [30, -130], [32, -92], [30, -52], [28, -16], [32, 14, 1], [-34, 14, 1], [-34, -20], [-35, -80], [-35, -130], [-31, -160], [-22, -178]];
  const AC_HEAD = [[-12, 16], [9, 16], [10, 2], [15, -6], [22, -11], [26, -17], [25, -22], [27, -26], [26, -30], [29, -34], [35, -40, 1], [31, -46], [28, -56], [28, -64], [25, -78], [13, -91], [-6, -96], [-23, -88], [-31, -68], [-30, -46], [-23, -28], [-16, -8]];
  const AC_HAT = [[84, -64, 1], [52, -66], [10, -68], [-26, -67], [-44, -65, 1], [-56, -84], [-62, -110], [-56, -119, 1], [-46, -104], [-36, -92], [-32, -108], [-22, -126], [0, -132], [20, -126], [30, -108], [32, -82], [56, -76], [82, -71]];
  const AC_PLUME = (() => { const mid = qbez([22, -122], [-24, -176], [-88, -100], 14); return ribbonW(mid, (u) => 4 + 20 * Math.sin(PI * Math.min(1, u * 1.1))); })();
  function mkAcheteur() {
    const legP = (back) => () => {
      fillPts([[-40, -30, 1], [50, -30, 1], [50, 112, 1], [-40, 112, 1]], back ? AC.culotteD : AC.culotte);
      fillPts([[-40, 112, 1], [60, 112, 1], [60, 262, 1], [-40, 262, 1]], AC.botte);
      strokePts([[30, 226], [44, 231]], 'rgba(255,255,255,0.22)', 1.3); hatch(null, 0.8, 3.8, back ? 0.32 : 0.2);
    };
    const rev = (back) => ({ parent: back ? 'legB' : 'legF', at: [0, 0], noRivet: true, base: back ? '#4a3626' : AC.revers, seed: back ? 9311 : 9312, pts: [[-27, 102], [0, 97], [27, 99], [22, 132, 1], [-22, 134, 1]], paint: () => { strokePts([[-20, 112], [22, 109]], 'rgba(20,12,6,0.45)', 1.1); hatch(null, 0.6, 3.6, 0.22); } });
    const parts = {
      torso: { parent: null, at: [0, 0], pts: AC_TORSO, base: AC.pp, seed: 9301, paint: () => {
        strokePts([[16, -172], [26, -140], [30, -90], [28, -40], [28, 0]], 'rgba(15,25,30,0.6)', 1.3);
        for (const y of [-150, -128, -106, -84, -62, -40, -18]) { dot(27, y, 2.4, '#9aa3a6'); }
        fillPts([[-38, -10, 1], [34, -10, 1], [34, 0, 1], [-38, 0, 1]], AC.culotteD);
        for (const x of [-22, -6, 10, 24]) strokePts([[x, 0], [x - 2, 14]], 'rgba(10,20,25,0.6)', 1.2);
        hatch([[-40, -176], [-10, -176], [-14, 16], [-40, 16]], 0.75, 4.2, 0.28); shade(30, -80, -30, -80, 0.2);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(0.92), base: AC.botte, seed: 9302, noRivet: true, paint: legP(true) },
      revB: rev(true),
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(0.92), base: AC.botte, seed: 9303, paint: legP(false) },
      revF: rev(false),
      armB_up: upDef([-10, -150], AC.ppD, 9304, 14),
      armB_lo: foreDef('armB_up', AC.ppD, AC.peauD, true, 9305, dentelle(AC.colD, 'rgba(120,110,90,0.6)')),
      head: { parent: 'torso', at: [6, -184], pts: AC_HEAD, base: AC.peau, seed: 9306, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[0, -84], [-22, -86], [-34, -66], [-36, -40], [-32, -10], [-24, 12], [-14, 12], [-14, -12], [-12, -36], [-6, -56], [4, -66]], AC.cheveux, 3);
        for (const [a, b] of [[[-28, -60], [-30, -12]], [[-20, -60], [-22, 4]]]) strokePts([a, b], 'rgba(20,12,6,0.5)', 1.2);
        X.earPaint(-6, -42); hatch([[-20, -40], [2, -28], [10, -10], [-6, 18], [-30, 4]], 0.6, 3.6, 0.22);
        dot(16, -30, 6, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -54); X.brow(f, 17, -62, 'rgba(60,40,25,0.95)', 2.4); X.mouth(f, 25, -21, 'rgba(120,55,50,0.95)');
      } },
      col: { parent: 'torso', at: [0, 0], noRivet: true, base: AC.col, seed: 9307, pts: [[-36, -170], [-10, -186], [14, -182], [28, -166], [34, -148], [26, -140], [12, -146], [-4, -152], [-24, -150], [-40, -148]], texA: 0.4, paint: () => {
        for (let i = 0; i < 8; i++) { const x = lerp(-38, 32, i / 7); dot(x, -148 + 4 * Math.sin(i), 2.6, 'rgba(180,170,150,0.5)'); }
        strokePts([[-36, -160], [0, -166], [28, -156]], 'rgba(160,150,130,0.6)', 1);
      } },
      chapeau: { parent: 'head', at: [0, 0], noRivet: true, base: AC.feutre, seed: 9308, pts: AC_HAT, paint: () => {
        fillPts([[-34, -82], [32, -82], [31, -92], [-33, -94]], '#3a2616');
        strokePts([[-56, -110], [-46, -84]], 'rgba(255,220,180,0.3)', 2); hatch(null, 0.9, 4, 0.22, 1, undefined, [-70, -140, 90, -60]);
      }, extra: () => {
        pc(AC_PLUME, AC.plume, () => { for (let i = 1; i < 12; i++) { const u = i / 12, pp = qbez([22, -122], [-24, -176], [-88, -100], 12)[i]; strokePts([pp, [pp[0] - 4, pp[1] + 10 * Math.sin(PI * u)]], 'rgba(150,140,120,0.6)', 1); } }, 9309);
      } },
      armF_up: upDef([-2, -150], AC.pp, 9310, 14),
      armF_lo: foreDef('armF_up', AC.pp, AC.peau, false, 9313, dentelle(AC.col, 'rgba(120,110,90,0.6)')),
    };
    Object.assign(parts, heldParts(AC.peau, 9330));
    return { hipY: -238, parts, handLen: 100, fist: [4, 96], bend: { armF: 1, armB: 1, deux: 1 }, nom: 'acheteur', rod: { part: 'torso', at: [-24, 8] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'revB', 'legF', 'revF', 'head', 'chapeau', 'torso', 'col', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.tulAcheteur = mkAcheteur();
  // gestes communs aux deux acheteurs : tend (bourse tendue devant, à hauteur de poitrine), encherit (main levée au-dessus de l'épaule, poing ou bourse)
  function gestesAchat(def, q, x, y, s, dir) {
    const td = ease(clamp(q.tend || 0)), en = ease(clamp(q.encherit || 0)), held = has(q.tenu);
    if (td > 0) reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [178, -132]), td, null);
    if (en > 0) {
      const pump = Math.abs(Math.sin((q.t || 0) * 7)) * 10 * (q.secoue == null ? 1 : q.secoue);
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [96, -296 - pump]), en, null);
      if (!held) q.handF = 'fist'; faceSet(q, { mouth: 'o', brow: 'up' });
    }
  }
  TUL.acheteurPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.tulAcheteur; x = x || 0; y = y || 0; s = s == null ? 0.85 : s; dir = dir || 1;
    defA(A, { armF_up: -0.1, armF_lo: -0.2, armB_up: 0.05, armB_lo: -0.16 });
    marcheQ(q); autoTenu(q); gestesAchat(def, q, x, y, s, dir);
    return finishQ(def, q, x, y, s, dir);
  };
  TUL.acheteur = (pose, x, y, s, o) => { s = s == null ? 0.85 : s; const dir = (o && o.dir) || 1; return run(CH.tulAcheteur, TUL.acheteurPose(pose, x, y, s, dir), x, y, s, o, 'acheteur'); };

  // =====================================================================
  // 6) L'ACHETEUSE — bourgeoise ronde : coiffe blanche serrée à petites ailes de dentelle, grand col blanc plat, corselet noir,
  //    robe ocre longue (pas de jambes), tablier bleu-gris.
  // =====================================================================
  const AE = { peau: '#e9c8aa', peauD: '#cca688', robe: '#a87e3a', robeD: '#866228', robeL: '#c49a52', corselet: '#1f1b1c', tablier: '#6c7c8a', tablierD: '#56646f', coiffe: '#f4f0e6', coiffeD: '#d4ccba', soulier: '#2a2018' };
  const AE_TORSO = [[-12, -184], [10, -184], [20, -172], [32, -150], [42, -122], [45, -94], [38, -66], [46, -30], [58, 40], [68, 120], [74, 200], [76, 236, 1], [-68, 236, 1], [-64, 180], [-56, 100], [-48, 20], [-44, -40], [-48, -100], [-44, -150], [-30, -174]];
  const AE_HEAD = [[-14, 16], [12, 16], [14, 4], [21, -3], [28, -8], [31, -15], [29, -22], [31, -26], [30, -30], [32, -34], [36, -39, 1], [32, -46], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const AE_COIFFE = [[25, -72], [32, -82], [36, -94, 1], [26, -92], [20, -88], [8, -99], [-12, -103], [-30, -95], [-41, -74], [-41, -46], [-36, -22], [-42, -14, 1], [-34, -6], [-24, -8], [-21, -22], [-23, -44], [-19, -62], [-4, -75], [12, -76]];
  function mkAcheteuse() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: AE_TORSO, base: AE.robe, seed: 9401, paint: () => {
        fillPts([[-46, -150], [-12, -176], [12, -176], [32, -150], [42, -122], [44, -94], [38, -66], [-44, -60], [-48, -100]], AE.corselet);           // corselet
        for (const y of [-140, -120, -100, -80]) strokePts([[30, y], [36, y + 8]], 'rgba(230,220,200,0.6)', 1.2);                               // laçage
        fillPts([[4, -64], [40, -66], [48, -30], [60, 40], [70, 120], [74, 214], [16, 220], [10, 130], [2, 40], [-4, -30]], AE.tablier);        // tablier
        strokePts([[40, -66], [48, -30], [60, 40], [70, 120], [74, 214]], 'rgba(30,40,50,0.5)', 1.2);
        for (const xx of [14, 26, 40]) strokePts([[xx * 0.5, -50], [xx, 80], [xx + 12, 216]], 'rgba(40,50,60,0.35)', 1);
        fillPts([[-46, -66, 1], [42, -68, 1], [42, -58, 1], [-46, -56, 1]], AE.tablierD);
        for (const [x0, x1] of [[-20, -40], [-34, -56], [-8, -20]]) strokePts([[x0, -50], [(x0 + x1) / 2, 90], [x1, 228]], 'rgba(60,40,10,0.4)', 1.2);
        hatch([[-70, -150], [-24, -150], [-30, 236], [-70, 236]], 0.75, 4.4, 0.26); shade(50, 0, -60, 0, 0.24);
      } },
      soulier: { parent: 'torso', at: [52, 230], noRivet: true, base: AE.soulier, seed: 9402, pts: [[-14, -8], [14, -10], [28, -2], [30, 7, 1], [-14, 8, 1]] },
      armB_up: upDef([-12, -148], AE.robeD, 9403, 16),
      armB_lo: foreDef('armB_up', AE.robeD, AE.peauD, true, 9404, dentelle(AE.coiffeD, 'rgba(120,110,90,0.6)')),
      head: { parent: 'torso', at: [6, -180], pts: AE_HEAD, base: AE.peau, seed: 9405, noRivet: true, paint: (p) => {
        const f = p.face || {};
        hatch([[-22, -40], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
        dot(20, -26, 10, 'rgba(225,120,105,0.32)'); strokePts([[12, 6], [22, 2]], 'rgba(150,100,80,0.45)', 1.2);      // joue ronde, double menton
        fillPts([[18, -76], [8, -72], [2, -66], [14, -68]], '#7a5a3a');                                              // mèche sous la coiffe
        X.eye(f, 18, -54); X.brow(f, 18, -62, 'rgba(90,60,40,0.9)', 2.4); X.mouth(f, 26, -18, 'rgba(150,60,60,0.95)');
      } },
      coiffe: { parent: 'head', at: [0, 0], noRivet: true, base: AE.coiffe, seed: 9406, pts: AE_COIFFE, texA: 0.4, paint: () => {
        strokePts([[22, -78], [8, -94], [-14, -98], [-32, -86], [-38, -60], [-34, -28]], 'rgba(150,140,120,0.5)', 1.2);
        for (let i = 0; i < 7; i++) { const u = i / 6; dot(lerp(24, 34, u), lerp(-76, -92, u), 1.8, 'rgba(160,150,130,0.6)'); }
        for (let i = 0; i < 5; i++) dot(-36 + i * 3, -14 + (i % 2) * 3, 1.6, 'rgba(160,150,130,0.6)');
      } },
      col: { parent: 'torso', at: [0, 0], noRivet: true, base: AE.coiffe, seed: 9407, pts: [[-44, -164], [-12, -182], [14, -180], [30, -164], [38, -146], [26, -138], [6, -144], [-14, -146], [-34, -140], [-48, -146]], texA: 0.4, paint: () => strokePts([[-40, -150], [0, -156], [34, -148]], 'rgba(160,150,130,0.6)', 1) },
      armF_up: upDef([-2, -148], AE.robe, 9408, 16),
      armF_lo: foreDef('armF_up', AE.robe, AE.peau, false, 9409, dentelle(AE.coiffe, 'rgba(120,110,90,0.6)')),
    };
    Object.assign(parts, heldParts(AE.peau, 9430));
    return { hipY: -238, parts, handLen: 100, fist: [4, 96], bend: { armF: 1, armB: 1, deux: 1 }, nom: 'acheteuse', rod: { part: 'torso', at: [-20, 30] },
      order: ['armB_up', 'armB_lo', 'objetB', 'soulier', 'head', 'coiffe', 'torso', 'col', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.tulAcheteuse = mkAcheteuse();
  TUL.acheteusePose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.tulAcheteuse; x = x || 0; y = y || 0; s = s == null ? 0.85 : s; dir = dir || 1;
    defA(A, { armF_up: -0.12, armF_lo: -0.3, armB_up: 0.05, armB_lo: -0.2 });
    const pe = ease(clamp(q.penche || 0));
    if (pe > 0) { q.tilt = (q.tilt || 0) + 0.18 * pe; A.head = (A.head || 0) + 0.14 * pe; faceSet(q, { eyes: 'wide', brow: 'up' }); }
    autoTenu(q); gestesAchat(def, q, x, y, s, dir);
    return finishQ(def, q, x, y, s, dir);
  };
  TUL.acheteuse = (pose, x, y, s, o) => { s = s == null ? 0.85 : s; const dir = (o && o.dir) || 1; return run(CH.tulAcheteuse, TUL.acheteusePose(pose, x, y, s, dir), x, y, s, o, 'acheteuse'); };

  // bendSign de M.ik utilisés par les enveloppes (vérifiés au casting) ; pour un M.ik à la main : 1 partout sauf bras arrière levé en V (joie) : −1
  TUL.BEND = { marchand: { armF: 1, armB: 1, joie: { armF: 1, armB: -1 } }, ecluse: { armF: 1, armB: 1 }, acheteur: { armF: 1, armB: 1 }, acheteuse: { armF: 1, armB: 1 } };

  // =====================================================================
  // 7) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; (x,y) = base de l'objet ; o.rot, o.dir, o.cast, o.alpha, o.ombre
  // =====================================================================
  const accDefs = {};
  function accDef(name) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => { const ob = OBJ[name], c = cx_(), b = typeof ob.base === 'function' ? ob.base(p.o) : ob.base; c.save(); c.translate(-b[0], -b[1]); ob.draw(p.o); c.restore(); } } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = Object.assign({}, o || {}); s = s == null ? 1 : s;
    return M.puppet(accDef(name), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of ['tulipe', 'bulbe', 'oignon', 'coffret', 'contrat', 'bourse', 'pile']) TUL[n] = (x, y, s, o) => acc(n, x, y, s, o);

  TUL.init = () => { TUL.K = {}; return TUL.K; };   // aucun pré-rendu (les décors sont dans decors/pN.js des plans)
})();
