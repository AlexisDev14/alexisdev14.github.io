// changementheure.js (bibliothèque) — « Le changement d'heure, une blague de Franklin » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.hdh (alias HDH). Appeler HDH.init() dans S.init.
// Mode d'emploi : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre, chiffre ni logo. Déterministe (hash, jamais Math.random).
// MARIONNETTES : HDH.franklin / HDH.parisien (pose, x, y, s, o) ; montages HDH.franklinLit / HDH.dormeurLit / HDH.dormeurFenetre (t, x, y, s, o).
// LITS : HDH.lit / HDH.litFond / HDH.litDevant (t, x, y, s, o). ACCESSOIRES : HDH.plume / lettre / bougie / piece / canon / reveil (x, y, s, o).
// HORLOGE : HDH.horloge(t, x, y, s, o), HDH.horlogePt(nom, o). DÉCORS : HDH.chambre(t, up, o), HDH.chambreSol(t, o), HDH.place(t, up, o) ; repères HDH.CHAMBRE, HDH.PLACE.
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI, P = M.P;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const HDH = (M.hdh = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = 1395;

  // =====================================================================
  // 0) OUTILS GÉOMÉTRIQUES
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 18, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const lerpPts = (A, B, k) => A.map((a, i) => { const b = B[i], o = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; if (a[2] || b[2]) o.push(1); return o; });
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function ribbonLR(mid, fw) {
    const L = [], R = [];
    for (let i = 0; i < mid.length; i++) {
      const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = fw(i / (mid.length - 1)) / 2;
      L.push([mid[i][0] - dy * w, mid[i][1] + dx * w]); R.push([mid[i][0] + dy * w, mid[i][1] - dx * w]);
    }
    return { L, R };
  }
  function ribbonW(mid, fw) { const { L, R } = ribbonLR(mid, fw); return L.concat(R.reverse()); }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const has = (v) => !!v && v !== 'rien';
  function gradR(x0, y0, r0, x1, y1, r1, stops, bb) { if (SIL()) return; const c = cx_(), g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); }
  function gradL(x0, y0, x1, y1, stops, bb) { if (SIL()) return; const c = cx_(), g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); }
  const tg = (t) => M.tg(t || 0);
  const hexMix = (a, b, t) => { const h = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16)), A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))).toString(16).padStart(2, '0')).join(''); };
  HDH.geo = { ep, ell, qbez, ribbonW, rect };

  const OR = '#c9a24a', ORL = '#ecc97a', ORD = '#8d6a26';
  const VDG = '#7f9286', VDGL = '#9aab9e', VDGD = '#5f7166';              // vert-de-gris des boiseries
  const IVO = '#efe7d3', IVOD = '#d4c8ad';
  const NUIT = '16,24,56';

  // =====================================================================
  // 1) ACCESSOIRES : registre unique (dessinés à l'échelle 1 ; origine du dessin = repère propre à chaque objet)
  // =====================================================================
  // ---- plume d'oie : bec (pointe) en bas devant, barbes en haut derrière ; origine = prise (entre les doigts)
  const PL_N = [12, 54], PL_T = [-44, -132];
  function drawPlume(o) {
    const ax = PL_T[0] - PL_N[0], ay = PL_T[1] - PL_N[1], L = Math.hypot(ax, ay), ux = ax / L, uy = ay / L, nx = -uy, ny = ux;   // n = côté arrière
    const at = (u, w) => [PL_N[0] + ax * u + nx * w, PL_N[1] + ay * u + ny * w];
    const big = [], small = [];
    for (let i = 0; i <= 14; i++) { const u = 0.3 + 0.7 * i / 14, k = Math.sin(PI * Math.min(1, (u - 0.3) / 0.72)); big.push(at(u, 4 + 24 * Math.pow(k, 0.7) + 2 * Math.sin(u * 30))); small.push(at(u, -3 - 8 * Math.pow(k, 0.8))); }
    const vane = [at(0.28, 0)].concat(big, [at(1.0, 0)], small.reverse());
    pc(vane, '#f1ece0', () => {
      for (let i = 0; i < 16; i++) { const u = 0.34 + 0.62 * i / 16; strokePts([at(u, 0), at(u + 0.05, 20)], 'rgba(120,110,95,0.45)', 0.9); strokePts([at(u, 0), at(u + 0.03, -8)], 'rgba(120,110,95,0.4)', 0.8); }
      shade(at(0.6, 22)[0], at(0.6, 22)[1], at(0.6, -6)[0], at(0.6, -6)[1], 0.2, [-90, -150, 60, 60]);
    }, 7101, { texA: 0.35 });
    pc(ribbonW([PL_N, at(0.35, 0), at(1.02, 0)], (u) => lerp(5, 2, u)), '#e6dcc4', () => strokePts([at(0.02, 0.6), at(0.3, 0.6)], 'rgba(255,255,255,0.7)', 1), 7102, { drop: false });
    fillPts([PL_N, at(0.07, 2.6), at(0.07, -2.6)], '#1d1b22');
  }
  // ---- lettre pliée : plie 0 = ouverte (croquis de face), 1 = pliée en paquet cacheté ; origine = centre de la feuille
  const LT = { w: 144, h: 188 };
  const lettreH = (o) => { const k = clamp(o.plie || 0); return k < 0.5 ? lerp(LT.h, LT.h / 2, smooth(0, 0.5, k)) : lerp(LT.h / 2, 64, smooth(0.5, 1, k)); };
  const lettreW = (o) => lerp(LT.w, 100, smooth(0.5, 1, clamp(o.plie || 0)));
  function vagues(x0, x1, y, amp, col, lw, seed) { const pts = []; for (let x = x0; x <= x1; x += 4) pts.push([x, y + amp * Math.sin((x + seed * 7) * 0.22)]); strokePts(pts, col, lw); }
  function drawLettre(o) {
    const k = clamp(o.plie || 0), w = lettreW(o), h = lettreH(o);
    if (k < 0.5) {
      const f = smooth(0, 0.5, k), sy = h / LT.h;
      pc(rect(-w / 2, -h / 2, w / 2, h / 2), '#f2ebd8', () => {
        const c = cx_(); c.save(); c.scale(1, sy);
        // croquis : soleil (en haut à gauche) et bougie barrée de vagues (en haut à droite), lignes ondulées sans lettres
        dot(-36, -52, 17, '#d9a441'); dot(-36, -52, 11, '#ecc263');
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; strokePts([[-36 + 21 * Math.cos(a), -52 + 21 * Math.sin(a)], [-36 + 30 * Math.cos(a), -52 + 30 * Math.sin(a)]], '#b9862e', 2); }
        fillPts(rect(26, -62, 42, -22), '#f6efd8'); strokePts([[26, -62], [26, -22], [42, -22], [42, -62], [26, -62]], 'rgba(60,40,30,0.85)', 1.4);
        fillPts([[34, -64], [29, -74], [34, -88], [39, -74]], '#e7922f'); fillPts([[34, -66], [32, -72], [34, -79], [36, -72]], '#f6d36a'); strokePts([[34, -62], [34, -66]], '#222', 1.2);
        fillPts([[16, -22], [52, -22], [55, -16], [13, -16]], '#9a7a3a');
        vagues(8, 60, -50, 4, '#9b2b26', 2.6, 1); vagues(8, 60, -36, 4, '#9b2b26', 2.6, 2);
        for (let i = 0; i < 6; i++) vagues(-54, i === 5 ? 6 : 54, -4 + i * 15, 1.8, 'rgba(50,40,60,0.75)', 1.4, i + 4);
        strokePts([[18, 84], [30, 78], [42, 86], [54, 79]], 'rgba(50,40,60,0.75)', 1.5);
        c.restore();
        if (f > 0) { fillPts(rect(-w / 2, -h / 2, w / 2, -h / 2 + h * 0.5 * f), `rgba(150,130,100,${0.35 * f})`); strokePts([[-w / 2, 0], [w / 2, 0]], `rgba(120,100,70,${0.5 * f})`, 1); }
        hatch(null, 0.3, 7, 0.06, 1, undefined, [-80, -100, 80, 100]);
      }, 7201, { texA: 0.35 });
    } else {
      const f = smooth(0.5, 1, k);
      pc(rect(-w / 2, -h / 2, w / 2, h / 2), '#ece3cc', () => {
        strokePts([[-w / 2, -h / 2], [0, h * 0.1], [w / 2, -h / 2]], 'rgba(120,100,70,0.6)', 1.2);
        strokePts([[-w / 2, h / 2], [-w * 0.1, 0]], 'rgba(120,100,70,0.35)', 1); strokePts([[w / 2, h / 2], [w * 0.1, 0]], 'rgba(120,100,70,0.35)', 1);
        shade(0, -h / 2, 0, h / 2, 0.18, [-80, -60, 80, 60]);
      }, 7202, { texA: 0.35 });
      if (f > 0.05) { fillPts(ell(0, h * 0.08, 13 * f, 12 * f, 12), '#8f2422'); dot(-3, h * 0.05, 4 * f, 'rgba(255,200,180,0.35)'); }
    }
  }
  // ---- bougie sur bougeoir à main : haut 0..1 (longueur de la chandelle), flamme 0..1 (1 allumée, 0 éteinte), fumee 0..1 ; origine = dessous du plateau
  const BG_H = (o) => lerp(20, 124, clamp(o.haut == null ? 1 : o.haut));
  const bgMeche = (o) => [0, -46 - BG_H(o) - 7];
  function drawBougie(o) {
    const H = BG_H(o), top = -46 - H;
    if (!SIL()) { const c = cx_(); c.save(); c.strokeStyle = '#6e5420'; c.lineWidth = 7; c.beginPath(); c.arc(60, -12, 11, 0, TAU); c.stroke(); c.strokeStyle = '#c9a24a'; c.lineWidth = 4; c.stroke(); c.restore(); }
    pc([[-54, -2], [54, -2], [58, -7, 1], [48, -13], [-48, -13], [-58, -7, 1]], '#b89140', () => { strokePts([[-46, -11], [44, -11]], 'rgba(255,235,170,0.7)', 1.6); }, 7301);
    pc([[-13, -12], [13, -12], [10, -38], [16, -40, 1], [16, -46, 1], [-16, -46, 1], [-16, -40, 1], [-10, -38]], '#a8822f', () => { strokePts([[-8, -16], [-6, -36]], 'rgba(255,235,170,0.6)', 1.6); shade(14, -30, -14, -30, 0.25, [-20, -50, 20, 0]); }, 7302);
    pc([[-9, -44], [9, -44], [9, top + 4], [5, top], [-6, top + 1], [-9, top + 5]], '#efe7d2', () => {
      strokePts([[5, top + 2], [6, top + 16], [5, top + 22]], 'rgba(200,190,160,0.8)', 2); shade(9, 0, -9, 0, 0.2, [-12, top, 12, -40]);
    }, 7303, { texA: 0.3 });
    strokePts([[0, top + 1], [1, top - 8]], '#1d1b22', 1.6);
    const fl = clamp(o.flamme == null ? 1 : o.flamme);
    if (fl > 0.02) M.flamme(o.t || 0, { x: 0.5, y: top - 6, s: 0.85 * fl, r: 70 * (0.5 + 0.5 * fl), seed: o.seed || 3, lueur: o.lueur !== false });
    if ((o.fumee || 0) > 0.02 && !SIL()) M.fumee(o.t || 0, { x: 1, y: top - 10, s: 0.28, n: 4, haut: 160, vent: 14, a: 0.55 * clamp(o.fumee), per: 2.4, seed: 31 });
  }
  // ---- pièce d'or (soleil en relief) : tranche 0..1 (1 = vue de profil) ; origine = centre
  function drawPiece(o) {
    const sx = Math.max(0.12, Math.abs(Math.cos(clamp(o.tranche || 0) * PI / 2)));
    const c = cx_(); c.save(); c.scale(sx, 1);
    pc(ell(0, 0, 34, 34, 28), '#c99a34', () => {
      strokePts(ep(0, 0, 28, 28, 28, 0, TAU), '#8a6420', 1.8);
      dot(0, 0, 11, '#e2b956'); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[14 * Math.cos(a), 14 * Math.sin(a)], [22 * Math.cos(a), 22 * Math.sin(a)]], '#9c7428', 2); }
      strokePts([[-20, -16], [-8, -24]], 'rgba(255,245,200,0.8)', 2.2); shade(20, 20, -20, -20, 0.3, [-40, -40, 40, 40]);
    }, 7401);
    c.restore();
  }
  // ---- petit canon de bronze sur affût, pointé vers le ciel : tire 0..1 (recul + bouffée de fumée vers le haut, AUCUN projectile) ; origine = sol sous la roue
  const CN = { ang: -0.68, piv: [6, -84], L: 168 };
  const canonRecul = (o) => { const k = clamp(o.tire || 0); return 14 * (smooth(0, 0.06, k) - smooth(0.12, 0.6, k)); };
  const canonBouche = (o) => { const r = canonRecul(o), a = CN.ang - 0.06 * r / 14; return [CN.piv[0] - r + Math.cos(a) * (CN.L - 28), CN.piv[1] + Math.sin(a) * (CN.L - 28)]; };
  function drawCanon(o) {
    const r = canonRecul(o), c = cx_(), a = CN.ang - 0.06 * r / 14;
    c.save(); c.translate(-r, 0);
    pc([[-150, -4], [-140, -16], [20, -96], [40, -90], [44, -74], [-120, 2, 1]], '#6b4527', () => { hatch(null, 0.3, 4, 0.25); strokePts([[-130, -10], [24, -88]], 'rgba(255,220,170,0.3)', 1.4); for (const [x, y] of [[-80, -36], [-20, -64]]) dot(x, y, 3.5, '#2a2a2a'); }, 7501);
    // tube : culasse en -46, bouche en +L-28 (le long de l'axe a), autour du pivot
    c.save(); c.translate(CN.piv[0], CN.piv[1]); c.rotate(a);
    pc([[-50, -14], [-42, -22], [-30, -24], [60, -19], [118, -15], [136, -17, 1], [140, -12], [140, 12], [136, 17, 1], [118, 15], [60, 19], [-30, 24], [-42, 22], [-50, 14]], '#9c7a3a', () => {
      for (const x of [-30, 58, 116]) fillPts(rect(x - 4, -26, x + 4, 26), '#b8954c');
      strokePts([[-36, -14], [130, -10]], 'rgba(255,240,190,0.55)', 2.2); shade(0, -20, 0, 20, 0.35, [-60, -30, 150, 30]);
    }, 7502);
    fillPts(ell(-56, 0, 9, 9, 12), '#8a6a2e');
    fillPts(ell(140, 0, 3, 9, 10), '#1d1915');
    c.restore();
    // roue (vue de côté) devant l'affût
    pc(ell(0, -52, 52, 52, 30), '#5a3a20', () => {
      for (let i = 0; i < 10; i++) { const b = i / 10 * TAU; strokePts([[0, -52], [44 * Math.cos(b), -52 + 44 * Math.sin(b)]], '#3a2414', 4); }
      strokePts(ep(0, -52, 46, 46, 30, 0, TAU), '#2c2c2e', 5); dot(0, -52, 9, '#3a3a3a'); dot(-2, -54, 3, '#8a8a8a');
    }, 7503);
    c.restore();
    // fumée : une seule bouffée qui sort de la bouche et monte vers le ciel
    const k = clamp(o.tire || 0);
    if (k > 0.01 && !SIL()) {
      const B = canonBouche(o), dx = Math.cos(a), dy = Math.sin(a);
      for (let i = 0; i < 10; i++) {
        const u = clamp((k - i * 0.03) / 0.8); if (u <= 0) continue;
        const d = 6 + 110 * Math.pow(u, 0.6) + i * 9, rr = 16 + 40 * Math.pow(u, 0.7) + i * 2.5;
        const px = B[0] + dx * d + Math.sin(i * 2.1) * 10 * u, py = B[1] + dy * d - 70 * Math.pow(u, 1.4) - i * 3;
        c.save(); c.globalAlpha = 0.85 * (1 - Math.pow(u, 1.6)); c.beginPath();
        for (let j = 0; j < 9; j++) { const aa = j / 9 * TAU, q = rr * (0.84 + 0.16 * Math.sin(j * 2.3 + i)); c.lineTo(px + Math.cos(aa) * q, py + Math.sin(aa) * q * 0.85); }
        c.closePath(); c.fillStyle = i % 2 ? '#e2dccd' : '#d2cabb'; c.fill(); c.strokeStyle = 'rgba(120,110,95,0.55)'; c.lineWidth = 1.2; c.stroke(); c.restore();
      }
    }
  }
  // ---- réveil de chevet à deux cloches : heure (nombre), sonne 0..1 ; origine = sous les pieds ; cadran 128 px à s 1
  function aiguilles(cx, cy, R, heure, col, w) {
    const am = ((heure % 1) + 1) % 1 * TAU, ah = ((heure % 12) + 12) % 12 / 12 * TAU;
    const hand = (a, L, wd) => { const s = Math.sin(a), c = -Math.cos(a), nx = -c, ny = s; fillPts([[cx - s * 8 + nx * wd, cy - c * 8 + ny * wd], [cx + s * L, cy + c * L], [cx - s * 8 - nx * wd, cy - c * 8 - ny * wd]], col, 0, 0); };
    hand(ah, R * 0.55, w * 1.3); hand(am, R * 0.85, w);
  }
  function drawReveil(o) {
    const k = clamp(o.sonne || 0), t = o.t || 0, c = cx_();
    c.save(); c.rotate(0.05 * k * Math.sin(t * 46));
    for (const sx of [-1, 1]) pc([[sx * 34, -26], [sx * 52, 2, 1], [sx * 40, 2, 1], [sx * 24, -20]], '#8d6a26', null, 7600 + sx);
    for (const sx of [-1, 1]) {
      c.save(); c.translate(sx * 48, -176); c.rotate(sx * 0.5);
      pc([[-28, 8, 1], [-24, -6], [-12, -18], [0, -22], [12, -18], [24, -6], [28, 8, 1]], '#c9a24a', () => { strokePts([[-14, -12], [-4, -18]], 'rgba(255,245,200,0.8)', 2); shade(20, 0, -20, 0, 0.3, [-30, -24, 30, 10]); }, 7605 + sx);
      c.restore();
    }
    strokePts(ep(0, -104, 92, 92, 16, -PI * 0.78, -PI * 0.22), '#8d6a26', 4);
    const hx = 6 * k * Math.sin(t * 60);
    strokePts([[0, -172], [hx, -196]], '#3a3a3a', 3); dot(hx, -198, 5, '#3a3a3a');
    pc(ell(0, -100, 76, 76, 32), '#7f2420', () => { strokePts(ep(0, -100, 70, 70, 30, PI * 1.1, PI * 1.6), 'rgba(255,200,180,0.45)', 3); shade(40, -60, -40, -140, 0.3, [-80, -180, 80, -20]); }, 7610);
    pc(ell(0, -100, 64, 64, 30), '#f1ead7', () => {
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = i % 3 ? 52 : 46; strokePts([[Math.sin(a) * r0, -100 - Math.cos(a) * r0], [Math.sin(a) * 58, -100 - Math.cos(a) * 58]], '#2a2420', i % 3 ? 1.6 : 3); }
      aiguilles(0, -100, 62, o.heure == null ? 7 : o.heure, '#1d1b1f', 3.2); dot(0, -100, 4, '#b08d45');
    }, 7611, { texA: 0.3 });
    if (!SIL()) { c.save(); c.globalAlpha = 0.18; fillPts([[-40, -150], [-10, -160], [-46, -110]], '#ffffff'); c.restore(); }
    c.restore();
  }

  const OBJ = {
    plume: { draw: drawPlume, grip: [0, 0], pts: { pointe: PL_N, haut: PL_T, centre: [-8, -30] }, base: [0, 0] },
    lettre: { draw: drawLettre, derriere: true, grip: (o) => [-lettreW(o) * 0.22, lettreH(o) / 2 - 6], p2: (o) => [lettreW(o) * 0.3, lettreH(o) / 2 - 6], pts: { centre: [0, 0], haut: (o) => [0, -lettreH(o) / 2], bas: (o) => [0, lettreH(o) / 2] }, base: [0, 0] },
    bougie: { draw: drawBougie, grip: [60, -12], pts: { meche: bgMeche, centre: [0, -60], base: [0, 0] }, base: [0, 0] },
    piece: { draw: drawPiece, grip: [0, 30], pts: { centre: [0, 0] }, base: [0, 0] },
    canon: { draw: drawCanon, grip: [-120, -10], pts: { bouche: canonBouche, centre: [0, -60], base: [0, 0] }, base: [0, 0] },
    reveil: { draw: drawReveil, grip: [0, -20], pts: { centre: [0, -100], cloche: [0, -190], base: [0, 0] }, base: [0, 0] },
  };
  HDH.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, n, o) => { const v = ob.pts[n]; return v == null ? null : typeof v === 'function' ? v(o) : v; };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: (p && p.t) || 0, echelle: 1 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.scale(oo.echelle, oo.echelle); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }

  // =====================================================================
  // 2) PIÈCES COMMUNES : bras à articulations rondes, mains, objets tenus (doigts par-dessus)
  // =====================================================================
  const R_COUDE = 11.5, DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  // main en visière : la paume repart vers -x local (= vers l'avant quand l'avant-bras remonte vers le front)
  const HAND_VIS = [[9, 76], [12, 84], [11, 92], [3, 97], [-12, 95], [-30, 88], [-46, 80], [-57, 73], [-55, 67], [-42, 70], [-28, 73], [-16, 74], [-10, 70]];
  // main qui pince (pouce et index joints, sans doigt seul tendu) : pointe de pince en (9, 116)
  const HAND_PINCE = [[9, 78], [13, 88], [13, 98], [11, 104], [13, 111], [10, 118], [5, 116], [3, 109], [-4, 106], [-10, 98], [-10, 86], [-9, 78]];
  function armR(len, wt, rc) { rc = rc || R_COUDE; const m = len * 0.42; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, m], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, m]]); }
  function foreR(kind) {
    const cap = ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU);
    if (kind === 'visiere') return cap.concat([[10, 40]], HAND_VIS, [[-11, 40]]);
    if (kind === 'pince') return cap.concat([[10, 40]], HAND_PINCE, [[-10, 76], [-11, 40]]);
    return cap.concat(X.forePts(kind === 'open' ? 'open' : 'fist').slice(2));
  }
  function upDef(at, base, seed, wt, deco) { return { parent: 'torso', at, pts: armR(94, wt), base, seed, paint: (p) => { if (deco) deco(p); hatch([[-18, -20], [-4, -20], [-4, 100], [-18, 100]], 0.9, 3.8, 0.26); } }; }
  function foreDef(parent, base, skin, back, seed, cuff) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, 94], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (k === 'visiere') {
        fillPts([[-66, 60, 1], [-12, 62, 1], [-11, 74, 1], [22, 74, 1], [22, 120, 1], [-66, 120, 1]], skin);
        for (const x of [-24, -36, -48]) strokePts([[x, 76 + (x + 24) * -0.25], [x - 3, 86 + (x + 24) * -0.3]], 'rgba(70,35,20,0.45)', 1);
        strokePts([[6, 84], [-8, 96]], 'rgba(70,35,20,0.4)', 1);
      } else if (k === 'pince') {
        fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin);
        strokePts([[0, 92], [12, 92]], 'rgba(60,30,20,0.5)', 1); strokePts([[4, 108], [11, 104]], 'rgba(60,30,20,0.55)', 1);
      } else { fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k === 'open' ? 'open' : 'fist'); }
      if (cuff) cuff(p);
      hatch([[-14, -10], [-3, -10], [-3, 54], [-14, 54]], 0.9, 3.8, 0.22);
    } };
  }
  function heldParts(skin, seed) {
    const dP = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
    const F = [4, 96], dev = (p) => has(p.tenu) && OBJ[p.tenu] && !OBJ[p.tenu].derriere, der = (p) => has(p.tenu) && OBJ[p.tenu] && OBJ[p.tenu].derriere;
    return {
      objetD: { parent: 'armF_lo', at: F, noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (der(p)) heldDraw(p.tenu, p.tenuO, p); } },
      objet: { parent: 'armF_lo', at: F, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (dev(p)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: F, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: dP },
      objetB: { parent: 'armB_lo', at: F, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: F, noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: dP },
    };
  }

  // ---- préparation commune des poses
  function prep(p) { p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); q._o0 = q.ang.objet || 0; q._oB0 = q.ang.objetB || 0; q.dx = q.dx || 0; q.dy = q.dy || 0; q.tilt = q.tilt || 0; return q; }
  function defA(A, d) { for (const k in d) if (A[k] == null) A[k] = d[k]; }
  const faceSet = (q, d) => { for (const k in d) if (q.face[k] == null) q.face[k] = d[k]; };
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function applyDroit(def, q) {
    const A = q.ang, tl = q.tilt || 0;
    A.objet = q.droit ? q._o0 - ((A.armF_up || 0) + (A.armF_lo || 0) + tl) : q._o0; A.objetD = A.objet;
    A.objetB = q.droitB ? q._oB0 - ((A.armB_up || 0) + (A.armB_lo || 0) + tl) : q._oB0;
  }
  function autoTenu(q) {
    if (has(q.tenu)) { if (!q.handF || q.handF === 'open') q.handF = 'fist'; if (q.droit == null) q.droit = true; }
    if (has(q.tenuB)) { if (!q.handB || q.handB === 'open') q.handB = 'fist'; if (q.droitB == null) q.droitB = true; }
  }
  function locPt(def, q, x, y, s, dir, part, p) { const { mats } = M.partMatrices(def, q, x, y, s, dir); return M.wpt(mats[part], p[0], p[1]); }
  function objPt(def, q, x, y, s, dir, arm, p, raw) {
    const F = arm === 'armF', name = F ? q.tenu : q.tenuB, { mats } = M.partMatrices(def, q, x, y, s, dir), fm = mats[arm + '_lo'].translate(4, 96);
    if (Array.isArray(p) && !raw && !has(name)) return M.wpt(mats[arm + '_lo'], p[0], p[1]);        // point brut de l'avant-bras (pince)
    if (!has(name) || !OBJ[name]) return M.wpt(fm, 0, 0);
    const ob = OBJ[name], oo = heldOpts(name, F ? q.tenuO : q.tenuBO, q), g = gripOf(ob, oo), e = oo.echelle;
    const pp = raw ? p : (typeof p === 'string' ? ptOf(ob, p, oo) : null); if (!pp) return M.wpt(fm, 0, 0);
    return M.wpt(fm.rotate(((F ? q.ang.objet : q.ang.objetB) || 0) * D), (pp[0] - g[0]) * e, (pp[1] - g[1]) * e);
  }
  // amène le poing (ou le point nommé de l'objet tenu, ou un point brut [x,y] de l'avant-bras) sur la cible écran par M.ik
  function reach(def, q, x, y, s, dir, arm, cible, k, ptName, bend) {
    if (!(k > 0) || !cible) return;
    bend = bend || (def.bend && def.bend[arm]) || 1;
    const A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    const tmp = Object.assign({}, q, { ang: Object.assign({}, A) });
    let T = [cible[0], cible[1]], sol = null;
    for (let it = 0; it < 5; it++) {
      sol = M.ik(def, tmp, x, y, s, dir, arm, T, bend);
      tmp.ang[arm + '_up'] = sol.up; tmp.ang[arm + '_lo'] = sol.lo; applyDroit(def, tmp);
      const E = objPt(def, tmp, x, y, s, dir, arm, ptName || null);
      T = [T[0] + cible[0] - E[0], T[1] + cible[1] - E[1]];
    }
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  function finishQ(def, q, x, y, s, dir) {
    if (q.atteint > 0 && q.cible) { const arm = q.bras === 'B' ? 'armB' : 'armF'; reach(def, q, x, y, s, dir, arm, q.cible, ease(clamp(q.atteint)), q.ptCible || (has(arm === 'armF' ? q.tenu : q.tenuB) ? 'centre' : null)); }
    applyDroit(def, q); q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const oo = heldOpts(q.tenu, q.tenuO, q), P2 = objPt(def, q, x, y, s, dir, 'armF', OBJ[q.tenu].p2(oo), true);
      reach(def, q, x, y, s, dir, 'armB', P2, 1, null, def.bend.armB); q.handB = 'fist'; q._deux = true;
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
  HDH.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, q = ptOf(ob, nom, oo); if (!q) return null; const g = gripOf(ob, oo), e = oo.echelle;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  function marcheQ(q) {
    const m = clamp(q.marche || 0); if (m <= 0) return; const t = q.t || 0, w = Math.sin(t * 6.5);
    q.ang.legF = (q.ang.legF || 0) + 0.34 * m * w; q.ang.legB = (q.ang.legB || 0) - 0.34 * m * w;
    q.dy -= Math.abs(Math.cos(t * 6.5)) * 7 * m;
    if (!has(q.tenuB)) q.ang.armB_up = (q.ang.armB_up || 0) - 0.14 * m * w;
    if (!has(q.tenu) && !(q.ecrire > 0 || q.pincer > 0 || q.brandir > 0)) q.ang.armF_up = (q.ang.armF_up || 0) + 0.12 * m * w;
  }
  // au lit : couche 0..1 = allongé sur le dos (pivot à la hanche) ; assis 0..1 = buste relevé, jambes à l'horizontale ; les jambes sont sous la couverture (masquées)
  function litQ(q) {
    const c = clamp(q.couche || 0), a = clamp(q.assis || 0);
    if (!(c > 0 || a > 0)) return;
    const th = -PI / 2 * c * (1 - a), lg = -PI / 2 * a;
    q.tilt += th; q.dx += -238 * Math.sin(th); q.dy += 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) + lg; q.ang.legB = (q.ang.legB || 0) + lg; q.ang.pans = (q.ang.pans || 0) + lg;
    q.hide.legF = 1; q.hide.legB = 1; q._auLit = true;
  }
  const paliers = (u, n) => { const v = clamp(u) * n, k = Math.floor(v), f = v - k; return Math.min(1, (Math.min(k, n) + M.easeOut(clamp(f * 2.4))) / n); };

  // =====================================================================
  // 3) BENJAMIN FRANKLIN — 78 ans, rondouillard, crâne chauve, longs cheveux gris raides jusqu'aux épaules, petites lunettes rondes,
  //    imberbe, double menton ; robe de chambre (banyan) vert éteint à revers ocre, chemise ivoire, culotte brune, bas blancs, mules.
  // =====================================================================
  const FR = { peau: '#e8c6a6', peauD: '#cba386', robe: '#4E5E45', robeD: '#3b4834', robeL: '#65775b', rev: '#B08A3E', revD: '#8a6a2c', revL: '#cfa95c',
    chem: '#efe8d6', chemD: '#cfc5ad', cul: '#5e4230', culD: '#46301f', bas: '#efebe2', basD: '#cfcabd', mule: '#7a3a26', muleD: '#55271a', chev: '#bdb8ae', chevD: '#8f8a80', fer: '#353437' };
  const FR_TORSO = [[-12, -194], [10, -194], [20, -182], [31, -164], [44, -140], [58, -110], [70, -76], [75, -42], [71, -12], [62, 10], [54, 26, 1], [-48, 26, 1], [-52, -10], [-53, -70], [-50, -124], [-44, -162], [-30, -184]];
  const FR_PANS = [[56, -16], [62, 40], [65, 100], [68, 156, 1], [-56, 158, 1], [-56, 100], [-55, 40], [-52, -16]];
  const FR_HEAD0 = [[-16, 16], [10, 16], [17, 8], [23, 0], [27, -8], [29, -15], [27, -21], [29, -25], [28, -30], [32, -35], [38, -42, 1], [33, -49], [29, -57], [29, -66], [26, -80], [14, -94], [-6, -99], [-24, -92], [-35, -72], [-37, -46], [-31, -22], [-24, -4]];
  const FR_HAIR = [[2, -70], [-8, -76], [-22, -74], [-33, -60], [-38, -38], [-40, -10], [-41, 18], [-40, 38, 1], [-34, 32], [-29, 42, 1], [-23, 33], [-17, 40, 1], [-12, 30], [-7, 35, 1], [-6, 16], [-4, -6], [-2, -28], [0, -50]];
  const FR_HEAD = FR_HEAD0.map((p) => (p[2] ? [p[0] * 1.06, p[1] * 1.06, 1] : [p[0] * 1.06, p[1] * 1.06]));
  function mkFranklin() {
    const legP = (back) => () => {
      fillPts(rect(-50, -30, 60, 122), back ? FR.culD : FR.cul);
      fillPts([[-26, 112], [26, 110], [26, 122], [-26, 124]], back ? '#3a281a' : FR.culD); if (!back) dot(21, 116, 3.2, OR);
      fillPts(rect(-46, 214, 60, 262), back ? FR.muleD : FR.mule);
      if (!back) { strokePts([[14, 217], [44, 226]], 'rgba(255,225,190,0.35)', 1.4); fillPts([[22, 214], [34, 214], [30, 222]], FR.rev); }
      hatch([[-26, 124], [-6, 124], [-6, 214], [-26, 214]], 0.8, 4, back ? 0.35 : 0.2);
    };
    const cuff = (back) => () => { fillPts([[-18, 50, 1], [18, 50, 1], [20, 72, 1], [-18, 72, 1]], back ? FR.revD : FR.rev); strokePts([[-17, 58], [18, 58]], 'rgba(90,60,20,0.5)', 1); fillPts([[-13, 72, 1], [13, 72, 1], [14, 80], [8, 77], [2, 81], [-4, 77], [-10, 81], [-14, 77]], back ? FR.chemD : FR.chem); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: FR_TORSO, base: FR.robe, seed: 9301, paint: () => {
        fillPts([[4, -196], [22, -184], [34, -156], [28, -124], [14, -148], [6, -174]], FR.chem);                             // chemise
        for (let y = -176; y < -126; y += 9) strokePts([[16 + (y + 176) * 0.18, y], [22 + (y + 176) * 0.2, y + 4], [16 + (y + 176) * 0.2, y + 8]], 'rgba(140,130,110,0.6)', 1);
        fillPts([[-20, -192], [0, -198], [14, -194], [28, -172], [41, -146], [54, -114], [65, -78], [70, -42], [66, -12], [58, 12], [46, 14], [54, -14], [57, -44], [53, -78], [41, -110], [29, -138], [18, -164], [5, -182], [-16, -182]], FR.rev);   // revers (col châle)
        strokePts([[6, -184], [18, -162], [30, -136], [42, -108], [52, -78], [56, -44], [54, -14]], 'rgba(90,60,20,0.55)', 1.2);
        fillPts([[-56, -30], [76, -36], [76, -22], [-56, -16]], FR.robeD);                                                         // ceinture de robe
        fillPts([[66, -34], [74, -26], [70, 4], [64, 6]], FR.rev); fillPts([[60, -30], [66, -28], [60, 12], [54, 10]], FR.revD);       // nœud et pans de la ceinture
        for (const [x0, x1] of [[-36, -40], [-20, -26], [-4, -8]]) strokePts([[x0, -150], [x1, -40]], 'rgba(20,30,15,0.35)', 1.2);
        hatch([[-54, -176], [-16, -176], [-20, 30], [-54, 30]], 0.75, 4.4, 0.3); shade(62, -80, -40, -80, 0.24);
        strokePts([[48, -112], [60, -70]], 'rgba(220,240,210,0.25)', 3);
      } },
      pans: { parent: 'torso', at: [0, 10], pts: FR_PANS, base: FR.robe, seed: 9302, paint: () => {
        fillPts([[46, -16], [57, -16], [68, 156], [56, 156]], FR.rev);
        fillPts([[-54, 140], [64, 140], [64, 160], [-54, 160]], FR.robeD);
        for (const x of [-30, -12, 8, 26]) strokePts([[x, -6], [x - 3, 70], [x + 2, 150]], 'rgba(20,30,15,0.4)', 1.3);
        hatch([[-56, -16], [-20, -16], [-24, 160], [-56, 160]], 0.75, 4.4, 0.3); shade(60, 40, -40, 40, 0.2, [-60, -20, 70, 170]);
      } },
      legB: { parent: 'torso', at: [-8, -2], pts: X.legPts(1.2), base: FR.basD, seed: 9303, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [8, -2], pts: X.legPts(1.2), base: FR.bas, seed: 9304, paint: legP(false) },
      armB_up: upDef([-14, -152], FR.robeD, 9305, 18),
      armB_lo: foreDef('armB_up', FR.robeD, FR.peauD, true, 9306, cuff(true)),
      head: { parent: 'torso', at: [8, -190], pts: FR_HEAD, base: FR.peau, seed: 9307, noRivet: true, paint: (p) => {
        const f = p.face || {};
        strokePts([[-16, -92], [2, -97], [16, -90]], 'rgba(255,248,235,0.8)', 3.2); dot(-4, -88, 3.4, 'rgba(255,255,240,0.55)');     // crâne luisant
        for (const y of [-74, -80]) strokePts([[8, y], [22, y - 2]], 'rgba(120,80,60,0.45)', 1.1);
        hatch([[-24, -40], [0, -28], [10, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
        dot(17, -30, 10, 'rgba(214,120,100,0.3)');
        strokePts([[25, -8], [18, -2], [8, 4]], 'rgba(120,80,60,0.55)', 1.3); strokePts([[22, 6], [12, 10]], 'rgba(120,80,60,0.4)', 1.1);   // double menton
        strokePts([[28, -34], [24, -28]], 'rgba(120,80,60,0.4)', 1);
        X.eye(f, 18, -54); X.brow(f, 18, -63, 'rgba(150,145,138,1)', 3);
        X.mouth(f, 27, -20, 'rgba(120,55,48,0.95)');
        const k = clamp(p.lunettes == null ? 1 : p.lunettes), ly = lerp(-80, -53, k);
        strokePts([[10, ly - 1], [-12, ly - 4]], FR.fer, 1.5);                                                                        // branche
      } },
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: FR.chev, seed: 9308, pts: FR_HAIR, paint: () => {
        for (const x of [-34, -27, -20, -13, -6]) strokePts([[x + 4, -70], [x + 1, -20], [x - 1, 34]], 'rgba(110,105,96,0.6)', 1.1);
        strokePts([[0, -68], [-14, -74], [-28, -66]], 'rgba(255,255,250,0.5)', 1.6); hatch(null, 1.4, 3, 0.18, 1, undefined, [-50, -80, 20, 60]);
      } },
      lunettes: { parent: 'head', at: [0, 0], noRivet: true, base: 'rgba(205,228,236,0.4)', seed: 9309, texA: 0.1,
        pts: (p) => { const k = clamp(p.lunettes == null ? 1 : p.lunettes); return ell(20, lerp(-80, -53, k), 8.5, 8, 14); },
        paint: (p) => { const k = clamp(p.lunettes == null ? 1 : p.lunettes), y = lerp(-80, -53, k); strokePts(ep(20, y, 7.6, 7.2, 16, 0, TAU), FR.fer, 2); strokePts([[16, y - 4], [20, y - 6]], 'rgba(255,255,255,0.8)', 1.3); } },
      armF_up: upDef([-4, -152], FR.robe, 9310, 18),
      armF_lo: foreDef('armF_up', FR.robe, FR.peau, false, 9311, cuff(false)),
    };
    Object.assign(parts, heldParts(FR.peau, 9330));
    return { hipY: -238, parts, handLen: 100, bend: { armF: 1, armB: 1 }, nom: 'franklin', rod: { part: 'torso', at: [-28, 10] },
      corps: { front: [[0, 62], [-40, 74], [-80, 70], [-120, 52], [-160, 30], [-190, 12]], back: -52, pans: [66, -56] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'pans', 'torso', 'head', 'cheveux', 'lunettes', 'objetD', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.hdhFranklin = mkFranklin();
  HDH.BEND = { franklin: { ecrire: 1, brandir: 1, pincer: 1, brasF: 1, brasB: 1, depit: 1, plisse: 1 }, parisien: { bras: 1, tire: 1 } };
  HDH.franklinPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.hdhFranklin, B = HDH.BEND.franklin; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, { armF_up: -0.14, armF_lo: -0.32, armB_up: 0.04, armB_lo: -0.24, head: 0 });
    const t = q.t || 0;
    const ec = ease(clamp(q.ecrire || 0)), br = ease(clamp(q.brandir || 0)), pi = ease(clamp(q.pincer || 0)), bv = ease(clamp(q.bras || 0)), dp = ease(clamp(q.depit || 0)), pl = ease(clamp(q.plisse || 0));
    if ((ec > 0 || br > 0) && q.tenu == null) q.tenu = 'plume';
    litQ(q);
    if (q._auLit && clamp(q.couche || 0) > 0.5 && clamp(q.assis || 0) < 0.3) faceSet(q, { eyes: 'closed' });
    if (!q._auLit) q.dy += Math.sin(tg(t) * 1.7) * 1.2;                                                  // respiration
    marcheQ(q);
    autoTenu(q);
    const held = has(q.tenu);
    if (dp > 0) {
      q.dy += 7 * dp; A.head += 0.3 * dp; faceSet(q, { brow: 'worry', mouth: 'tight', eyes: 'closed' });
      blend(q, 'armB_up', 0.03, dp); blend(q, 'armB_lo', -0.08, dp);
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'head', [22, -76]), dp, null, B.depit);
      if (!held) q.handF = 'open';
    }
    if (pl > 0) {
      A.head -= 0.1 * pl; faceSet(q, { eyes: 'half', brow: 'frown', mouth: 'tight' });
      reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'head', [4, -72]), pl, null, B.plisse);
      if (!has(q.tenuB)) q.handB = 'visiere';
    }
    if (ec > 0) {
      A.head += 0.26 * ec; q.lunettes = q.lunettes == null ? 1 : q.lunettes;
      if (q.tenu === 'plume' && !(p.ang && p.ang.objet != null)) q._o0 += 0.5 * ec;                 // plume penchée vers l'avant : les barbes s'écartent du visage
      const C = q.cible || locPt(def, q, x, y, s, dir, 'torso', [150, -60]);
      const cib = [C[0] + Math.sin(tg(t) * 13) * 5 * s * dir, C[1] + Math.cos(tg(t) * 9) * 2 * s];
      reach(def, q, x, y, s, dir, 'armF', cib, ec, held ? 'pointe' : null, B.ecrire);
      blend(q, 'armB_up', -0.35, ec); blend(q, 'armB_lo', -0.5, ec);
    }
    if (br > 0) {
      A.head -= 0.12 * br; faceSet(q, { mouth: 'smile', brow: 'up' });
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [140, -236]), br, null, B.brandir);
    }
    if (pi > 0 && q.cible) {
      A.head += 0.12 * pi; faceSet(q, { brow: 'frown', mouth: 'tight' });
      if (!held) q.handF = 'pince';
      reach(def, q, x, y, s, dir, 'armF', q.cible, pi, held ? 'centre' : [9, 116], B.pincer);
    }
    if (bv > 0) {
      A.head -= 0.26 * bv; faceSet(q, { mouth: 'smile', brow: 'up' });
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [104, -366]), bv, null, B.brasF);
      if (!has(q.tenuB)) reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'torso', [-34, -368]), bv, null, B.brasB);
      if (!held) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open';
    }
    return finishQ(def, q, x, y, s, dir);
  };
  HDH.franklin = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.hdhFranklin, HDH.franklinPose(pose, x, y, s, dir), x, y, s, o, 'franklin'); };

  // =====================================================================
  // 4) LE PARISIEN PARESSEUX — la cinquantaine, moustache brune tombante, joues rondes rouges, bonnet de nuit à rayures bleu ardoise
  //    et ivoire, long, à pointe qui retombe avec un petit gland ocre ; chemise de nuit ivoire.
  // =====================================================================
  const PA = { peau: '#ecc4a3', peauD: '#cda083', joue: 'rgba(214,78,66,0.55)', chem: '#ece6d6', chemD: '#cbc3ae', moust: '#5b3a22', moustD: '#3e2716', bleu: '#4A6178', bleuD: '#36485b', ivo: '#ece4d0', gland: '#B08A3E', glandD: '#86672a' };
  const PA_TORSO = [[-12, -186], [10, -186], [19, -174], [29, -158], [37, -132], [43, -100], [47, -64], [49, -28], [50, 10, 1], [-47, 10, 1], [-47, -30], [-47, -80], [-46, -130], [-41, -160], [-28, -178]];
  const PA_PANS = [[46, -14], [52, 50], [56, 120], [58, 176, 1], [-50, 178, 1], [-50, 120], [-49, 50], [-48, -14]];
  const PA_HEAD = [[-15, 16], [10, 16], [13, 4], [20, -4], [27, -9], [31, -15], [29, -21], [31, -25], [30, -29], [34, -34], [39, -40, 1], [34, -48], [30, -56], [30, -64], [27, -78], [15, -92], [-5, -97], [-23, -90], [-34, -70], [-35, -46], [-28, -26], [-20, -6]];
  const PA_CAP = [[31, -66], [27, -82], [15, -95], [-5, -101], [-24, -95], [-36, -78], [-40, -58], [-36, -50], [-24, -56], [-6, -62], [14, -64], [26, -60]];
  function bonnetMid(p) {
    const k = ease(clamp(p.dresse || 0)), w = Math.sin(tg(p.t || 0) * 1.6) * 5 * (1 - k);
    return qbez([-18, -92], [lerp(-58, -12, k), lerp(-128, -150, k)], [lerp(-92 + w, -2, k), lerp(-40, -214, k)], 16);
  }
  function mkParisien() {
    const legP = (back) => () => { fillPts(rect(-50, 110, 60, 262), back ? PA.peauD : PA.peau); strokePts([[18, 226], [44, 230]], 'rgba(120,70,50,0.4)', 1); hatch([[-26, 120], [-6, 120], [-6, 236], [-26, 236]], 0.8, 4, back ? 0.35 : 0.18); };
    const cuff = (back) => () => { fillPts([[-16, 58, 1], [16, 58, 1], [17, 76, 1], [-16, 76, 1]], back ? PA.chemD : '#e2dbc8'); strokePts([[-15, 64], [16, 64]], 'rgba(120,110,90,0.5)', 1); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PA_TORSO, base: PA.chem, seed: 9401, paint: () => {
        fillPts([[2, -188], [20, -178], [16, -168], [4, -172]], PA.chemD); strokePts([[14, -170], [26, -100]], 'rgba(120,110,90,0.65)', 1.3);
        for (const y of [-160, -138, -116]) dot(18 + (y + 170) * 0.13, y, 2.4, '#b8ae98');
        for (const x of [-34, -18, 0, 20]) strokePts([[x, -150], [x - 2, -40], [x + 2, 10]], 'rgba(130,120,100,0.35)', 1.2);
        hatch([[-52, -176], [-16, -176], [-20, 14], [-52, 14]], 0.75, 4.4, 0.28); shade(46, -80, -40, -80, 0.2);
      } },
      pans: { parent: 'torso', at: [0, 8], pts: PA_PANS, base: PA.chem, seed: 9402, paint: () => {
        for (const x of [-30, -10, 12, 32]) strokePts([[x, -6], [x - 3, 90], [x + 2, 170]], 'rgba(130,120,100,0.35)', 1.2);
        fillPts([[-52, 164], [60, 164], [60, 180], [-52, 180]], PA.chemD); hatch([[-54, -16], [-20, -16], [-24, 180], [-54, 180]], 0.75, 4.4, 0.26);
      } },
      legB: { parent: 'torso', at: [-8, -2], pts: X.legPts(1.05), base: PA.chemD, seed: 9403, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [8, -2], pts: X.legPts(1.05), base: PA.chem, seed: 9404, paint: legP(false) },
      armB_up: upDef([-14, -150], PA.chemD, 9405, 17),
      armB_lo: foreDef('armB_up', PA.chemD, PA.peauD, true, 9406, cuff(true)),
      head: { parent: 'torso', at: [8, -182], pts: PA_HEAD, base: PA.peau, seed: 9407, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-20, -54], [-34, -50], [-36, -30], [-28, -18], [-22, -34]], PA.moust);                                         // cheveux de la nuque
        X.earPaint(-8, -42);
        hatch([[-22, -40], [2, -28], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
        dot(17, -30, 13, PA.joue); dot(14, -33, 4, 'rgba(255,220,200,0.45)');
        X.eye(f, 19, -54); X.brow(f, 19, -62, 'rgba(80,50,30,0.95)', 3);
        X.mouth(f, 26, -15, 'rgba(120,50,45,0.95)');
        strokePts([[30, -42], [37, -40]], 'rgba(150,70,60,0.5)', 1.6);
      } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: PA.moust, seed: 9408, pts: [[37, -33], [31, -35], [22, -34], [13, -31], [8, -22], [6, -8], [9, -2, 1], [13, -12], [17, -21], [26, -24], [34, -25], [39, -29]], paint: () => { for (const x of [12, 18, 24, 30]) strokePts([[x + 3, -32], [x - 2, -22]], 'rgba(30,18,10,0.5)', 1); hatch(null, 1.2, 2.6, 0.2); } },
      bonnet: { parent: 'head', at: [0, 0], noRivet: true, base: PA.ivo, seed: 9409, pts: PA_CAP, paint: () => {
        for (const x of [-44, -26, -8, 10, 28]) fillPts([[x, -104], [x + 9, -104], [x + 2, -48], [x - 7, -48]], PA.bleu);
        fillPts([[30, -68], [28, -60], [-6, -58], [-24, -52], [-38, -48], [-40, -56], [-24, -62], [-6, -66]], PA.bleuD);
        hatch(null, 0.9, 4, 0.18, 1, undefined, [-45, -105, 35, -45]);
      } },
      pointe: { parent: 'head', at: [0, 0], noRivet: true, base: PA.ivo, seed: 9410, pts: (p) => ribbonW(bonnetMid(p), (u) => lerp(38, 7, u)), paint: (p) => {
        const { L, R } = ribbonLR(bonnetMid(p), (u) => lerp(40, 8, u));
        for (let i = 0; i < L.length - 1; i += 2) fillPts([L[i], L[i + 1], R[i + 1], R[i]], PA.bleu, 0, 0);
        hatch(null, 1, 4, 0.15, 1, undefined, [-120, -230, 40, 0]);
      } },
      gland: { parent: 'head', at: [0, 0], noRivet: true, base: PA.gland, seed: 9411, pts: (p) => { const m = bonnetMid(p), e = m[m.length - 1]; return ell(e[0], e[1], 8, 8, 12); }, paint: (p) => {
        const m = bonnetMid(p), e = m[m.length - 1]; for (let i = -2; i <= 2; i++) strokePts([[e[0] + i * 2.5, e[1]], [e[0] + i * 3.2, e[1] + 9]], PA.glandD, 1.3);
      } },
      armF_up: upDef([-4, -150], PA.chem, 9412, 17),
      armF_lo: foreDef('armF_up', PA.chem, PA.peau, false, 9413, cuff(false)),
    };
    Object.assign(parts, heldParts(PA.peau, 9430));
    return { hipY: -238, parts, handLen: 100, bend: { armF: 1, armB: 1 }, nom: 'parisien', rod: { part: 'torso', at: [-28, 6] },
      corps: { front: [[0, 50], [-40, 50], [-80, 47], [-120, 40], [-160, 26], [-184, 10]], back: -47, pans: [56, -50] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'pans', 'torso', 'head', 'moustache', 'pointe', 'gland', 'bonnet', 'objetD', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.hdhParisien = mkParisien();
  HDH.parisienPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.hdhParisien, B = HDH.BEND.parisien; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, { armF_up: -0.1, armF_lo: -0.3, armB_up: 0.04, armB_lo: -0.24, head: 0 });
    const t = q.t || 0, g = tg(t);
    const dort = clamp(q.dort || 0), su = clamp(q.sursaut || 0), ti = ease(clamp(q.tire || 0)), to = clamp(q.tourne || 0), bra = ease(clamp(q.bras || 0));
    if (su > 0) { q.assis = Math.max(q.assis || 0, paliers(su, 3)); q.dresse = Math.max(q.dresse || 0, smooth(0, 0.3, su)); faceSet(q, { eyes: 'wide', brow: 'up', mouth: 'o' }); }
    if (dort > 0.5) faceSet(q, { eyes: 'closed', mouth: 'smile', brow: 'n' });
    litQ(q);
    if (q._auLit) q.dx += Math.sin(g * 1.5) * 1.6 * Math.max(dort, 0.3) * (1 - clamp(q.assis || 0));     // respiration couchée
    else q.dy += Math.sin(g * 1.7) * 1.2;
    q._dessus = [];
    if (ti > 0) {
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'head', [30, 24]), ti, null, B.tire);
      reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'head', [18, 30]), ti, null, B.tire);
      q.handF = 'fist'; q.handB = 'fist'; q._couv = Math.max(q._couv || 0, lerp(0.8, 1, ti)); q._dessus.push('armF_lo', 'armB_lo');
    }
    if (bra > 0 && q.cible) { reach(def, q, x, y, s, dir, 'armF', q.cible, bra, null, B.bras); if (!has(q.tenu)) q.handF = 'open'; q._dessus.push('armF_up', 'armF_lo', 'objet', 'doigts'); }
    if (clamp(q.assis || 0) > 0.3) q._dessus.push('armF_up', 'armF_lo', 'objet', 'doigts');
    q._tourne = to;
    if (to > 0.5) faceSet(q, { eyes: 'closed', mouth: 'n' });
    autoTenu(q);
    return finishQ(def, q, x, y, s, dir);
  };
  HDH.parisien = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.hdhParisien, HDH.parisienPose(pose, x, y, s, dir), x, y, s, o, 'parisien'); };

  // =====================================================================
  // 5) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(), b = typeof ob.base === 'function' ? ob.base(oo) : ob.base; c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of Object.keys(OBJ)) HDH[n] = (x, y, s, o) => acc(n, x, y, s, o);
  // point nommé d'un accessoire posé seul (même x, y, s, o que l'appel) → [X, Y] écran
  HDH.accPt = function (name, x, y, s, o, nom) {
    o = o || {}; s = s == null ? 1 : s; const ob = OBJ[name], q = ptOf(ob, nom, o); if (!q) return null;
    const b = typeof ob.base === 'function' ? ob.base(o) : ob.base, d = o.dir || 1, a = o.rot || 0;
    const lx = (q[0] - b[0]) * s * d, ly = (q[1] - b[1]) * s;
    return [x + lx * Math.cos(a * d) - ly * Math.sin(a * d), y + lx * Math.sin(a * d) + ly * Math.cos(a * d)];
  };

  // =====================================================================
  // 6) LA GRANDE HORLOGE DE LA PLACE — cadran ivoire 340 px (r 170 à s 1), 12 traits, aiguilles noires ouvragées
  // =====================================================================
  const H_MIN = [[-4, 22], [4, 22], [3, -16], [10, -34], [4, -52], [2.6, -122], [9, -128], [0, -146], [-9, -128], [-2.6, -122], [-4, -52], [-10, -34], [-3, -16]];
  const H_HR = [[-5, 18], [5, 18], [4, -30], [16, -52], [10, -70], [4, -76], [6, -86], [0, -100], [-6, -86], [-4, -76], [-10, -70], [-16, -52], [-4, -30]];
  function horlogeSecoue(t, k) { const g = tg(t); return k > 0 ? { dx: Math.sin(g * 53) * 5 * k, dy: Math.sin(g * 41 + 1) * 2 * k, r: Math.sin(g * 47) * 0.025 * k } : { dx: 0, dy: 0, r: 0 }; }
  HDH.horloge = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const c = cx_(), h = o.heure == null ? 2 : o.heure, S = horlogeSecoue(t, clamp(o.secoue || 0));
    c.save(); c.translate(x + S.dx, y + S.dy); c.rotate(S.r); c.scale(s, s);
    if (o.cadre !== false) pc(ell(0, 0, 188, 188, 48), '#b08d45', () => { strokePts(ep(0, 0, 182, 182, 48, 0, TAU), '#d9bd72', 2.4); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; dot(181 * Math.cos(a), 181 * Math.sin(a), 2.4, '#76592a'); } shade(-120, -120, 120, 120, 0.3, [-200, -200, 200, 200]); }, 8001);
    pc(ell(0, 0, 170, 170, 48), '#f1ead6', () => {
      strokePts(ep(0, 0, 150, 150, 60, 0, TAU), 'rgba(40,30,25,0.8)', 1.4); strokePts(ep(0, 0, 160, 160, 60, 0, TAU), 'rgba(40,30,25,0.8)', 1.4);
      for (let i = 0; i < 60; i++) { if (i % 5 === 0) continue; const a = i / 60 * TAU; strokePts([[150 * Math.sin(a), -150 * Math.cos(a)], [160 * Math.sin(a), -160 * Math.cos(a)]], 'rgba(40,30,25,0.7)', 1); }
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, big = i % 3 === 0, r0 = big ? 112 : 124; const s0 = Math.sin(a), c0 = -Math.cos(a), nx = -c0 * (big ? 6 : 3.5), ny = s0 * (big ? 6 : 3.5);
        fillPts([[s0 * r0 + nx, c0 * r0 + ny], [s0 * 158 + nx, c0 * 158 + ny], [s0 * 158 - nx, c0 * 158 - ny], [s0 * r0 - nx, c0 * r0 - ny]], '#1f1a18', 0, 0); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4; fillPts(ell(70 * Math.sin(a), -70 * Math.cos(a), 6, 6, 8), 'rgba(176,141,69,0.6)'); }
      gradR(-40, -50, 10, 0, 0, 180, [[0, 'rgba(255,255,245,0.25)'], [1, 'rgba(120,100,70,0.15)']], [-180, -180, 180, 180]);
    }, 8002, { texA: 0.35 });
    const am = ((h % 1) + 1) % 1 * TAU, ah = ((h % 12) + 12) % 12 / 12 * TAU;
    for (const [pts, a, seed] of [[H_HR, ah, 8003], [H_MIN, am, 8004]]) { c.save(); c.rotate(a); pc(pts, '#1b1716', () => strokePts([[0, 14], [0, -40]], 'rgba(255,255,255,0.18)', 1), seed, { texA: 0.2 }); c.restore(); }
    pc(ell(0, 0, 13, 13, 14), '#b08d45', () => dot(-3, -3, 4, '#ecc97a'), 8005);
    c.restore();
  };
  // point de l'horloge : nom 'aiguille' (bout de la grande aiguille), 'petite' (bout de la petite), 'centre' ; o : { heure, x, y, s, up } (défaut : horloge de la place)
  HDH.horlogePt = function (nom, o) {
    o = o || {}; const x = o.x == null ? PLACE.horloge.x : o.x, y = (o.y == null ? PLACE.horloge.y : o.y) - (o.up || 0), s = o.s == null ? 1 : o.s, h = o.heure == null ? 2 : o.heure;
    if (nom === 'centre') return [x, y];
    const a = nom === 'petite' ? ((h % 12) + 12) % 12 / 12 * TAU : ((h % 1) + 1) % 1 * TAU, L = nom === 'petite' ? 100 : 146;
    return [x + Math.sin(a) * L * s, y - Math.cos(a) * L * s];
  };

  // =====================================================================
  // 7) LITS — deux couches : HDH.litFond (sous l'occupant) et HDH.litDevant (couverture et pied du lit par-dessus)
  //    (x, y) = sol, au milieu du lit ; o.dir 1 = tête du lit à gauche (l'occupant regarde vers +x quand il est assis) ; o.style 'baldaquin' | 'mansarde'
  // =====================================================================
  const LIT = {
    baldaquin: { L: 620, mat: [-190, -132], hanche: [-14, -236], pied: 300, tete: -300, H: 810, w: 720 },
    mansarde: { L: 560, mat: [-172, -124], hanche: [-4, -218], pied: 272, tete: -272, H: 440, w: 640 },
  };
  HDH.LIT = LIT;
  const BD = { vert: '#2f4436', vertL: '#44604c', vertD: '#1f2e25', bois: '#5a3a22', boisL: '#7a5232', boisD: '#3e2716' };
  function poteau(x, y0, y1, w, col, seed) {
    pc([[x - w, y0, 1], [x + w, y0, 1], [x + w * 0.8, y0 - 30], [x + w * 1.3, y0 - 44], [x + w * 0.7, y0 - 60], [x + w * 0.7, y1 + 60], [x + w * 1.2, y1 + 40], [x + w * 0.9, y1 + 10], [x + w * 1.3, y1], [x - w * 1.3, y1], [x - w * 0.9, y1 + 10], [x - w * 1.2, y1 + 40], [x - w * 0.7, y1 + 60], [x - w * 0.7, y0 - 60], [x - w * 1.3, y0 - 44], [x - w * 0.8, y0 - 30]], col, () => {
      strokePts([[x - w * 0.2, y0 - 70], [x - w * 0.2, y1 + 70]], 'rgba(255,220,170,0.3)', 1.6); hatch(null, 1.3, 4, 0.2, 1, undefined, [x - 30, y1, x + 30, y0]);
    }, seed);
  }
  function rideauPli(x0, x1, yTop, yBot, tieY, tieX, col, colL, seed) {
    const pts = [[x0, yTop, 1], [x1, yTop, 1], [lerp(x1, tieX, 0.7), tieY - 60], [tieX + 10, tieY], [lerp(tieX, x1, 0.4), tieY + 80], [x1 + 6, yBot - 40], [x1 + 4, yBot, 1], [x0 - 4, yBot, 1], [x0 - 6, yBot - 40], [lerp(tieX, x0, 0.6), tieY + 80], [tieX - 10, tieY], [lerp(x0, tieX, 0.5), tieY - 60]];
    pc(pts, col, () => {
      for (let i = 0; i < 5; i++) { const u = (i + 0.5) / 5; strokePts([[lerp(x0, x1, u), yTop], [lerp(tieX - 8, tieX + 8, u), tieY], [lerp(x0, x1, u) + (u - 0.5) * 30, yBot]], 'rgba(10,20,12,0.5)', 1.6); strokePts([[lerp(x0, x1, u) + 5, yTop], [lerp(tieX - 6, tieX + 10, u), tieY]], colL, 1.2); }
      fillPts([[x0 - 10, yBot - 14], [x1 + 10, yBot - 14], [x1 + 10, yBot + 4], [x0 - 10, yBot + 4]], OR);
      hatch(null, 1.1, 4.5, 0.24, 1, undefined, [x0 - 20, yTop, x1 + 20, yBot]);
    }, seed);
    pc([[tieX - 16, tieY - 6], [tieX + 16, tieY - 6], [tieX + 16, tieY + 6], [tieX - 16, tieY + 6]], OR, () => strokePts([[tieX - 12, tieY], [tieX + 12, tieY]], ORD, 1), seed + 1);
    pc([[tieX + 8, tieY + 2], [tieX + 14, tieY + 40], [tieX + 4, tieY + 40]], OR, null, seed + 2);
  }
  function fleurs(x0, y0, x1, y1, seed, cols) {
    for (let gx = x0; gx < x1; gx += 34) for (let gy = y0; gy < y1; gy += 30) {
      const h = hash(gx * 0.37 + gy * 1.13 + seed), px = gx + 17 * h + (Math.floor((gy - y0) / 30) % 2) * 17, py = gy + 10 * hash(gx + gy + seed);
      fillPts(ell(px, py, 5.5, 4.5, 8), cols[0]); dot(px, py, 2, cols[1]);
      fillPts([[px + 4, py + 2], [px + 13, py + 5], [px + 5, py + 7]], cols[2]); fillPts([[px - 4, py + 1], [px - 12, py - 2], [px - 6, py + 5]], cols[2]);
    }
  }
  function drawLitFondBaldaquin() {
    // ciel de lit (corniche + lambrequin à festons), rideau de tête, tête de lit, poteau de tête, traverse, matelas, oreillers
    pc([[-350, -820, 1], [350, -820, 1], [350, -786, 1], [-350, -786, 1]], BD.bois, () => { fillPts(rect(-350, -808, 350, -800), OR); strokePts([[-346, -790], [346, -790]], ORD, 1.5); hatch(null, 0.2, 4, 0.2); }, 8101);
    const fest = [[-344, -788, 1], [344, -788, 1]]; for (let i = 0; i <= 12; i++) { const x = 344 - i * 688 / 12; fest.push([x, -716 + (i % 2 ? 22 : 0)]); }
    pc(fest, BD.vert, () => { for (let i = 0; i < 12; i++) { const x = 344 - (i + 0.5) * 688 / 12; strokePts([[x, -786], [x, -712]], 'rgba(10,20,12,0.4)', 1.3); } for (let i = 0; i <= 12; i += 2) { const x = 344 - i * 688 / 12; fillPts([[x - 5, -718], [x + 5, -718], [x + 3, -696], [x - 3, -696]], OR); } fillPts(rect(-344, -786, 344, -774), OR); hatch(null, 1.1, 4.5, 0.22); }, 8102);
    rideauPli(-346, -246, -774, -36, -400, -310, BD.vert, 'rgba(120,150,120,0.35)', 8103);
    poteau(-318, 0, -790, 13, BD.bois, 8106);
    pc([[-312, -40, 1], [-286, -40, 1], [-286, -420], [-294, -446], [-306, -470, 1], [-318, -446], [-312, -420]], BD.boisD, () => { strokePts([[-300, -60], [-300, -410]], 'rgba(255,220,170,0.25)', 2); fillPts(ell(-298, -448, 7, 7, 10), OR); }, 8107);
    pc([[-302, -52, 1], [302, -52, 1], [302, -134, 1], [-302, -134, 1]], BD.bois, () => {
      fillPts(rect(-302, -134, 302, -122), BD.boisL); strokePts([[-290, -114], [290, -114], [290, -64], [-290, -64], [-290, -114]], ORD, 1.4);
      for (const x of [-200, 0, 200]) { fillPts(ell(x, -89, 18, 10, 12), OR); dot(x, -89, 5, ORD); }
      hatch(null, 0.2, 4, 0.25); shade(0, -134, 0, -52, 0.25, [-310, -140, 310, -40]);
    }, 8108);
    for (const x of [-296, 296]) pc([[x - 12, -52], [x + 12, -52], [x + 9, -30], [x + 13, -16], [x + 8, 0, 1], [x - 8, 0, 1], [x - 13, -16], [x - 9, -30]], BD.boisD, null, 8109 + x);
    pc([[-296, -132, 1], [294, -132, 1], [298, -150], [296, -186, 1], [-296, -190, 1]], '#e8dfc8', () => { for (let x = -290; x < 290; x += 14) strokePts([[x, -186], [x, -134]], 'rgba(120,130,150,0.3)', 1.6); fillPts(rect(-296, -192, 296, -178), '#f3eee2'); hatch(null, 0.2, 4, 0.12); }, 8110, { texA: 0.35 });
    pc([[-292, -186], [-280, -238], [-250, -258], [-190, -258], [-158, -240], [-150, -200], [-160, -186]], '#f3eee3', () => { strokePts([[-282, -232], [-252, -252], [-190, -252], [-160, -236]], 'rgba(160,150,130,0.6)', 1.3); for (let x = -285; x < -150; x += 9) dot(x, -190, 2.2, 'rgba(200,190,170,0.9)'); shade(-220, -258, -220, -186, 0.25, [-300, -260, -140, -180]); }, 8111, { texA: 0.3 });
  }
  function drawLitDevantBaldaquin() {
    rideauPli(270, 336, -774, -24, -430, 318, BD.vert, 'rgba(120,150,120,0.35)', 8121);
    pc([[286, -40, 1], [312, -40, 1], [312, -258], [306, -286, 1], [292, -286, 1], [286, -258]], BD.boisD, () => { strokePts([[298, -60], [298, -250]], 'rgba(255,220,170,0.25)', 2); fillPts(ell(299, -150, 7, 22, 10), OR); }, 8124);
    poteau(320, 0, -790, 13, BD.bois, 8125);
  }
  function drawLitFondMansarde() {
    const fer = '#2f3236', ferL = '#5a5f66';
    const tube = (pts, w) => { strokePts(pts, fer, w + 2.5); strokePts(pts, ferL, w * 0.45); };
    tube([[-272, 0], [-272, -400]], 6); tube([[-236, -150], [-236, -360]], 5);
    tube([[-272, -390], [-262, -404], [-246, -398], [-236, -380], [-236, -360]], 4);
    for (const y of [-180, -260, -330]) tube([[-272, y], [-236, y + 8]], 3);
    tube([[-264, -230], [-244, -230]], 2.5);
    dot(-272, -406, 9, '#b08d45'); dot(-274, -409, 3, '#f1dc9a');
    pc([[-276, -112, 1], [276, -112, 1], [276, -124, 1], [-276, -124, 1]], fer, () => strokePts([[-270, -121], [270, -121]], ferL, 1.2), 8131);
    for (const x of [-272, 266]) { tube([[x, -112], [x, -8]], 5); dot(x, -4, 6, '#222'); }
    pc([[-268, -122, 1], [262, -122, 1], [266, -146], [262, -172, 1], [-268, -172, 1]], '#e2ddd2', () => { strokePts([[-262, -150], [258, -150]], 'rgba(120,120,130,0.35)', 1.2); for (let x = -250; x < 250; x += 40) dot(x, -150, 2, 'rgba(120,120,130,0.4)'); }, 8132, { texA: 0.35 });
    pc([[-262, -170], [-252, -214], [-224, -230], [-168, -230], [-142, -214], [-136, -178], [-146, -168]], '#f6f3ec', () => { strokePts([[-250, -208], [-224, -224], [-168, -224], [-146, -210]], 'rgba(150,150,160,0.5)', 1.2); shade(-200, -230, -200, -170, 0.2, [-270, -232, -130, -166]); }, 8133, { texA: 0.25 });
  }
  function drawLitDevantMansarde() {
    const fer = '#2f3236', ferL = '#5a5f66';
    const tube = (pts, w) => { strokePts(pts, fer, w + 2.5); strokePts(pts, ferL, w * 0.45); };
    tube([[266, 0], [266, -320]], 6); tube([[236, -150], [236, -290]], 5);
    tube([[266, -312], [256, -324], [242, -318], [236, -300], [236, -290]], 4);
    for (const y of [-190, -250]) tube([[266, y], [236, y + 6]], 3);
    dot(266, -326, 9, '#b08d45'); dot(264, -329, 3, '#f1dc9a');
  }
  const litCache = {};
  function litLayer(style, layer, dir) {
    const key = style + layer + dir; if (litCache[key]) return litCache[key];
    const G = LIT[style], w = G.w, h = G.H + 60;
    const fn = style === 'baldaquin' ? (layer === 'fond' ? drawLitFondBaldaquin : drawLitDevantBaldaquin) : (layer === 'fond' ? drawLitFondMansarde : drawLitDevantMansarde);
    const cv = M.cutFlat(w, h, w / 2, h - 10, (c) => { c.scale(dir, 1); fn(); }); cv.padB = 10; M.withShadow(cv, 8);
    return (litCache[key] = cv);
  }
  // couverture (dessin à l'écran) : top = points du dessus (du pied vers la tête), bord = dernier point ; édredon ivoire à fleurs fanées / couette bleu ardoise
  function couverture(style, x, y, s, dir, top) {
    const G = LIT[style], matTop = y + G.mat[0] * s, matBot = y + G.mat[1] * s, hem = matBot + 30 * s, footX = x + dir * (G.pied + 6) * s;
    const E = top[top.length - 1];
    const pts = [[footX + dir * 10 * s, matTop + 6 * s], [footX, matTop - 8 * s]].concat(top, [[E[0] - dir * 3 * s, matTop + 2 * s], [E[0] - dir * 6 * s, hem, 1]]);
    for (let i = 1; i <= 6; i++) { const xx = lerp(E[0] - dir * 6 * s, footX + dir * 14 * s, i / 6); pts.push([xx, hem + (i % 2 ? 7 : 0) * s]); }
    pts.push([footX + dir * 14 * s, hem, 1]);
    const bal = style === 'baldaquin', base = bal ? '#ece3cc' : '#56708a';
    pc(pts, base, () => {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), bb = [Math.min(...xs) - 10, Math.min(...ys) - 10, Math.max(...xs) + 10, Math.max(...ys) + 10];
      if (bal) fleurs(bb[0], bb[1], bb[2], bb[3], 3, ['rgba(190,120,110,0.55)', 'rgba(200,160,80,0.7)', 'rgba(110,130,90,0.55)']);
      else { for (let xx = bb[0]; xx < bb[2]; xx += 46 * s) strokePts([[xx, bb[1]], [xx + 8 * s, bb[3]]], 'rgba(30,40,60,0.35)', 1.2); for (let yy = matBot - 10 * s; yy < bb[3]; yy += 24 * s) strokePts([[bb[0], yy], [bb[2], yy]], 'rgba(200,215,230,0.18)', 1); }
      fillPts([[E[0] - dir * 8 * s, E[1] - 4 * s], [E[0] + dir * 18 * s, E[1] + 2 * s], [E[0] + dir * 18 * s, hem], [E[0] - dir * 8 * s, hem]], bal ? '#f6f2e8' : '#e9e6df');
      strokePts([[E[0] + dir * 18 * s, E[1] + 2 * s], [E[0] + dir * 18 * s, hem]], 'rgba(120,110,90,0.4)', 1);
      strokePts([[footX, matTop - 4 * s], [E[0] + dir * 30 * s, matTop - 4 * s]], 'rgba(90,80,60,0.25)', 1.2);
      hatch(null, 0.8, 5, bal ? 0.12 : 0.2, 1, undefined, bb); shade(x, matTop - 80 * s, x, hem, 0.28, bb);
    }, bal ? 8141 : 8142, { texA: 0.45 });
  }
  // dessus de la couverture d'après le corps de l'occupant (repères du personnage, choisis du côté le plus haut à l'écran)
  function dessusCorps(def, q, x, y, s, dir, couv, margin) {
    const { mats } = M.partMatrices(def, q, x, y, s, dir), C = def.corps, out = [];
    const hi = (m, a, b) => { const A = M.wpt(m, a[0], a[1]), B = M.wpt(m, b[0], b[1]); const P2 = A[1] < B[1] ? A : B; return [P2[0], P2[1] - margin]; };
    const LEG = mats.pans ? [[234, 50], [200, 16], [172, 16]] : [[234, 50], [200, 16], [150, 16], [110, 17], [60, 20], [10, 22]];
    for (const [ly, fx] of LEG) out.push(hi(mats.legF, [fx, ly], [-20, ly]));
    if (mats.pans) for (const ly of [150, 100, 50, 0]) out.push(hi(mats.pans, [C.pans[0], ly], [C.pans[1], ly]));
    const n = C.front.length - 1, cv = clamp(couv) * n;
    for (let i = 0; i <= n; i++) {
      if (i > cv + 1e-6) { const a = C.front[i - 1], b = C.front[i], f = cv - (i - 1); out.push(hi(mats.torso, [lerp(a[1], b[1], f), lerp(a[0], b[0], f)], [C.back, lerp(a[0], b[0], f)])); break; }
      out.push(hi(mats.torso, [C.front[i][1], C.front[i][0]], [C.back, C.front[i][0]]));
    }
    return out;
  }
  function dessusVide(style, x, y, s, dir) {
    const G = LIT[style], m = y + G.mat[0] * s, out = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8, lx = lerp(G.pied - 30, G.tete + 170, u); out.push([x + dir * lx * s, m - (26 + 18 * Math.sin(PI * u)) * s]); }
    return out;
  }
  HDH.litFond = (t, x, y, s, o) => { o = o || {}; const st = o.style || 'baldaquin', dir = o.dir || 1; M.flat(litLayer(st, 'fond', dir), x, y, { scale: s, cast: o.cast === undefined ? { dx: 14, dy: 6, a: 0.3 } : o.cast }); };
  HDH.litDevant = (t, x, y, s, o) => {
    o = o || {}; const st = o.style || 'baldaquin', dir = o.dir || 1;
    couverture(st, x, y, s, dir, o.dessus || dessusVide(st, x, y, s, dir));
    M.flat(litLayer(st, 'devant', dir), x, y, { scale: s, cast: o.cast === undefined ? { dx: 14, dy: 6, a: 0.3 } : o.cast });
  };
  HDH.lit = (t, x, y, s, o) => { HDH.litFond(t, x, y, s, o); HDH.litDevant(t, x, y, s, o); };
  // point du lit (écran) : 'hanche' (où se pose la hanche de l'occupant), 'oreiller', 'pied', 'matelas' (dessus, au milieu)
  HDH.litPt = function (x, y, s, o, nom) {
    o = o || {}; const G = LIT[o.style || 'baldaquin'], d = o.dir || 1;
    const P0 = { hanche: G.hanche, oreiller: [G.tete + 80, G.mat[0] - 30], pied: [G.pied, G.mat[0]], matelas: [0, G.mat[0]] }[nom] || [0, 0];
    return [x + d * P0[0] * s, y + P0[1] * s];
  };
  // montage commun : lit + occupant + couverture + parties qui passent par-dessus (bras)
  function auLit(t, x, y, s, o, kind) {
    o = o || {}; const dir = o.dir || 1, st = o.style || (kind === 'franklin' ? 'baldaquin' : 'mansarde'), G = LIT[st], c = cx_();
    const pose = Object.assign({ t }, o.pose || {});
    if (pose.couche == null) pose.couche = 1;
    const hx = x + dir * s * G.hanche[0], hy = y + s * G.hanche[1], fy = hy + 238 * s;
    const def = kind === 'franklin' ? CH.hdhFranklin : CH.hdhParisien;
    const q = (kind === 'franklin' ? HDH.franklinPose : HDH.parisienPose)(pose, hx, fy, s, dir);
    if (o.fond !== false) HDH.litFond(t, x, y, s, { style: st, dir, cast: o.cast });
    const a = clamp(q.assis || 0), couv = Math.max(o.couv == null ? lerp(0.82, 0.08, smooth(0, 0.7, a)) : o.couv, q._couv || 0);
    const tq = ease(clamp(q._tourne || 0)), f0 = lerp(1, -1, tq), f = Math.abs(f0) < 0.25 ? (f0 >= 0 ? 0.25 : -0.25) : f0, lift = (1 - f0) / 2 * 22 * s;
    const squeeze = () => { if (f !== 1) { c.translate(0, hy - lift); c.scale(1, f); c.translate(0, -hy); } };
    c.save(); squeeze();
    const r = M.puppet(def, q, hx, fy, s, { dir, rod: false, floorShadow: false, cast: o.castPerso, nom: kind });
    const top = dessusCorps(def, q, hx, fy, s, dir, couv, 9 * s);
    c.restore();
    const G0 = y + G.mat[0] * s; for (const p2 of top) p2[1] = Math.min(p2[1], G0 - 6 * s);
    couverture(st, x, y, s, dir, top);
    if (o.devant !== false) M.flat(litLayer(st, 'devant', dir), x, y, { scale: s, cast: o.cast === undefined ? { dx: 14, dy: 6, a: 0.3 } : o.cast });
    const des = q._dessus || (a > 0.3 || q.plisse > 0 || q.depit > 0 || q.bras > 0 || q.brandir > 0 || q.pincer > 0 ? ['armF_up', 'armF_lo', 'objet', 'doigts', 'objetD'] : []);
    if (kind === 'franklin' && (a > 0.3 || q.plisse > 0 || q.depit > 0 || q.bras > 0 || q.brandir > 0 || q.pincer > 0)) des.push('armF_up', 'armF_lo', 'objet', 'doigts', 'objetD');
    if (des.length) {
      const hide = {}; for (const n in def.parts) if (des.indexOf(n) < 0) hide[n] = 1;
      c.save(); squeeze(); M.puppet(def, Object.assign({}, q, { hide }), hx, fy, s, { dir, rod: false, floorShadow: false, nom: kind }); c.restore();
    }
    r.q = q; r.dessus = top; return r;
  }
  HDH.franklinLit = (t, x, y, s, o) => auLit(t, x, y, s == null ? 0.8 : s, o, 'franklin');
  HDH.dormeurLit = (t, x, y, s, o) => auLit(t, x, y, s == null ? 0.8 : s, o, 'parisien');

  // ---- le Parisien à sa fenêtre : (x, y) = milieu de l'appui ; o.volets 0 ouverts .. 1 fermés ; o.pose (dort, sursaut, bras + cible…) ; o.accoude (1)
  const FEN = { w: 176, h: 236 };
  HDH.FENETRE = FEN;
  function volet(hx, y0, y1, w, phi, side, col, colD, seed) {
    const cs = Math.cos(phi), sn = Math.sin(phi), ex = hx + side * w * cs, dz = 10 * sn;
    const pts = [[hx, y0, 1], [ex, y0 - dz, 1], [ex, y1 + dz, 1], [hx, y1, 1]];
    pc(pts, cs >= 0 ? col : colD, () => {
      const k = Math.abs(cs); if (k < 0.15) return;
      for (const u of [0.18, 0.52]) { const yA = lerp(y0, y1, u) + 8, yB = lerp(y0, y1, u + 0.3) - 8; strokePts([[hx + side * w * cs * 0.15, yA], [hx + side * w * cs * 0.85, yA], [hx + side * w * cs * 0.85, yB], [hx + side * w * cs * 0.15, yB], [hx + side * w * cs * 0.15, yA]], 'rgba(20,30,20,0.5)', 1.3); }
      for (let i = 1; i < 5; i++) strokePts([[hx + side * w * cs * i / 5, y0 + 4], [hx + side * w * cs * i / 5, y1 - 4]], 'rgba(20,30,20,0.25)', 1);
      hatch(null, 0.2, 4.5, 0.2, 1, undefined, [Math.min(hx, ex) - 4, y0 - 20, Math.max(hx, ex) + 4, y1 + 20]);
    }, seed);
  }
  HDH.dormeurFenetre = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 0.6 : s; const c = cx_(), dir = o.dir || 1, W = FEN.w * s, H = FEN.h * s;
    const x0 = x - W / 2, x1 = x + W / 2, y0 = y - H, y1 = y;
    // façade : enduit ocre clair, chaînage de pierre, linteau
    pc([[x0 - 70 * s, y0 - 80 * s, 1], [x1 + 70 * s, y0 - 80 * s, 1], [x1 + 70 * s, y1 + 110 * s, 1], [x0 - 70 * s, y1 + 110 * s, 1]], '#cdb48a', () => {
      for (let yy = y0 - 80 * s; yy < y1 + 110 * s; yy += 26 * s) { const odd = Math.round((yy - y0) / (26 * s)) % 2; fillPts(rect(x0 - 70 * s, yy, x0 - (odd ? 30 : 46) * s, yy + 24 * s), '#d9c49e'); fillPts(rect(x1 + (odd ? 30 : 46) * s, yy, x1 + 70 * s, yy + 24 * s), '#d9c49e'); }
      fillPts(rect(x0 - 16 * s, y0 - 30 * s, x1 + 16 * s, y0 - 4 * s), '#b89d72'); hatch(null, 0.8, 5, 0.18, 1, undefined, [x0 - 80 * s, y0 - 90 * s, x1 + 80 * s, y1 + 120 * s]);
    }, 8201, { drop: false });
    c.save(); c.beginPath(); c.rect(x0, y0, W, H); c.fillStyle = '#2a2420'; c.fill(); c.clip();
    gradL(x, y0, x, y1, [[0, 'rgba(60,50,40,0.6)'], [1, 'rgba(10,8,6,0.9)']], [x0, y0, x1, y1]);
    const pose = Object.assign({ t }, o.pose || {});
    const ac = o.accoude == null ? 1 : o.accoude;
    const px = x - dir * 6 * s, pfy = y + (238 + 96) * s;                       // hanche cachée sous l'appui : le buste dépasse
    const q = HDH.parisienPose(pose, px, pfy, s, dir);
    if (ac > 0 && !(pose.bras > 0)) {
      reach(CH.hdhParisien, q, px, pfy, s, dir, 'armF', [x + dir * 44 * s, y - 6 * s], ac, null, 1);
      reach(CH.hdhParisien, q, px, pfy, s, dir, 'armB', [x + dir * 26 * s, y - 8 * s], ac, null, 1);
      q.handF = q.handF === 'fist' || !q.handF ? 'open' : q.handF; q.handB = 'open';
    }
    const r = M.puppet(CH.hdhParisien, q, px, pfy, s, { dir, rod: false, floorShadow: false, nom: 'parisien' });
    c.restore();
    // embrasure et appui, géranium
    strokePts([[x0, y1], [x0, y0], [x1, y0], [x1, y1]], '#6b5a44', 4 * s + 1);
    pc([[x0 - 18 * s, y1 - 4 * s, 1], [x1 + 18 * s, y1 - 4 * s, 1], [x1 + 22 * s, y1 + 14 * s, 1], [x0 - 22 * s, y1 + 14 * s, 1]], '#c2a57a', () => strokePts([[x0 - 18 * s, y1 - 2 * s], [x1 + 18 * s, y1 - 2 * s]], 'rgba(255,240,210,0.6)', 1.4), 8202);
    const gx = x - dir * 58 * s;
    pc([[gx - 16 * s, y1 - 4 * s], [gx + 16 * s, y1 - 4 * s], [gx + 12 * s, y1 - 30 * s], [gx - 12 * s, y1 - 30 * s]], '#a4552e', null, 8203);
    for (let i = 0; i < 5; i++) { const a = -PI / 2 + (i - 2) * 0.45; fillPts(ell(gx + Math.cos(a) * 18 * s, y1 - 36 * s + Math.sin(a) * 14 * s, 9 * s, 7 * s, 8), '#4f6b3c'); }
    for (const [dx, dy] of [[-6, -54], [8, -50], [0, -60]]) fillPts(ell(gx + dx * s, y1 + dy * s, 6 * s, 6 * s, 8), '#b23a2e');
    // avant-bras accoudés par-dessus l'appui
    if (ac > 0 || pose.bras > 0) {
      const hide = {}; for (const n in CH.hdhParisien.parts) if (['armF_up', 'armF_lo', 'armB_lo', 'objet', 'doigts'].indexOf(n) < 0) hide[n] = 1;
      c.save(); c.beginPath(); c.rect(x0 - 200 * s, y0 - 300 * s, W + 400 * s, H + 300 * s - 2); c.clip();
      M.puppet(CH.hdhParisien, Object.assign({}, q, { hide }), px, pfy, s, { dir, rod: false, floorShadow: false, nom: 'parisien' }); c.restore();
    }
    // volets à deux battants (gonds sur les côtés) : 0 ouverts (rabattus contre le mur), 1 fermés
    const v = ease(clamp(o.volets || 0)), phi = lerp(PI * 0.97, 0, v);
    volet(x0, y0, y1, W / 2, phi, 1, '#5d7a5a', '#4a6348', 8204);
    volet(x1, y0, y1, W / 2, phi, -1, '#5d7a5a', '#4a6348', 8205);
    return r;
  };

  // =====================================================================
  // 8) DÉCOR : CHAMBRE DE FRANKLIN, PASSY 1784 — HDH.chambre(t, up, o) ; o.lumiere 0 nuit → 1 plein soleil ; o.volets ; o.soleil ; o.franklin (pose au lit)
  // =====================================================================
  const CHAMBRE = {
    fenetre: { x0: 708, x1: 892, y0: 362, y1: 888, cx: 800, appui: { x: 800, y: 896 } },
    lit: { x: 424, y: BACK, s: 0.8, dir: 1, style: 'baldaquin' },
    chevet: { x: 124, y: 1252 }, bougie: { x: 132, y: 1252, s: 0.62 },
    secretaire: { x: 800, plateau: 1150, x0: 704, x1: 896, encrier: { x: 866, y: 1140 }, papier: { x: 762, y: 1144 } },
    pendule: { x: 516, y: 250 }, portrait: { x: 372, y: 600 }, bibliotheque: { x: 652, y: 1130 }, gueridon: { x: 940, y: 1244 },
    libre: { x0: 600, x1: 900 },
  };
  HDH.CHAMBRE = CHAMBRE;
  function papierPeint(x0, y0, x1, y1) {
    const c = cx_(); c.fillStyle = '#b9bea3'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let gy = y0, row = 0; gy < y1; gy += 64, row++) for (let gx = x0 + (row % 2) * 40; gx < x1; gx += 80) {
      const h = hash(gx * 0.13 + gy * 0.71);
      strokePts([[gx, gy + 26], [gx + 2, gy + 8], [gx - 3, gy - 12]], 'rgba(95,110,85,0.55)', 1.4);
      for (const [dx, dy, a] of [[-8, 10, -0.6], [8, 4, 0.6], [-7, -6, -0.8], [6, -14, 0.7]]) { const ex = gx + dx, ey = gy + dy; fillPts([[gx, ey + 4], [ex + Math.cos(a) * 4, ey - 4], [ex + dx * 0.6, ey + 2]], 'rgba(105,125,95,0.5)'); }
      if (h > 0.6) dot(gx + 2, gy - 16, 3.2, 'rgba(176,141,69,0.45)');
    }
    for (let x = x0; x < x1; x += 7) { c.fillStyle = 'rgba(255,255,240,0.025)'; c.fillRect(x, y0, 3, y1 - y0); }
  }
  function makeChambreFond() {
    const W = 1080, H = BACK + 5, F = CHAMBRE.fenetre;
    return M.pre(W, H, (c) => {
      papierPeint(0, 0, W, 1000);
      // corniche dorée
      pc(rect(0, 150, W, 196), '#6f7f72', () => { fillPts(rect(0, 182, W, 190), OR); for (let x = 6; x < W; x += 22) fillPts(rect(x, 160, x + 12, 176), '#5a6a5e'); }, 8301, { drop: false });
      // lambris vert-de-gris à moulures dorées
      pc(rect(0, 992, W, H), VDG, () => {
        for (let x = 20; x < W; x += 170) { strokePts([[x, 1030], [x + 140, 1030], [x + 140, 1330], [x, 1330], [x, 1030]], OR, 2.2); strokePts([[x + 8, 1038], [x + 132, 1038], [x + 132, 1322], [x + 8, 1322], [x + 8, 1038]], 'rgba(40,55,45,0.5)', 1.2); }
        fillPts(rect(0, 992, W, 1006), VDGL); fillPts(rect(0, 1006, W, 1012), OR); fillPts(rect(0, 1352, W, H), VDGD);
        hatch(null, 0.2, 5, 0.12); shade(0, 1000, 0, H, 0.25, [0, 990, W, H]);
      }, 8302, { drop: false });
      // pilastres
      for (const x of [40, 600, 960]) pc(rect(x - 16, 196, x + 16, 992), VDGL, () => { strokePts([[x - 8, 210], [x - 8, 980]], OR, 1.4); strokePts([[x + 8, 210], [x + 8, 980]], OR, 1.4); hatch(null, 0.2, 4, 0.12); }, 8303 + x, { drop: false });
      // bibliothèque encastrée peinte (entre lit et fenêtre, en hauteur) : reliures sans lettres
      pc(rect(566, 560, 690, 990), '#4b3424', () => {
        for (const [y, hh] of [[600, 92], [700, 92], [800, 92], [900, 86]]) {
          fillPts(rect(574, y + hh, 682, y + hh + 8), '#6a4a30');
          let x = 576; let i = 0; while (x < 676) { const w = 9 + 7 * hash(x + y), hb = hh - 4 - 16 * hash(x * 3 + y); const col = ['#7f2420', '#3e5a48', '#8a6a2c', '#2e3a52', '#6b4527', '#5c2a3a'][i++ % 6]; fillPts(rect(x, y + hh - hb, x + w, y + hh), col); strokePts([[x + 1, y + hh - hb + 8], [x + w - 1, y + hh - hb + 8]], 'rgba(220,190,120,0.7)', 1); x += w + 1; }
        }
        hatch(null, 0.3, 4, 0.15);
      }, 8310, { drop: false });
      // fenêtre : chambranle, embrasure, appui
      pc(rect(F.x0 - 30, F.y0 - 34, F.x1 + 30, F.y1 + 24), '#8fa093', () => { strokePts([[F.x0 - 22, F.y1 + 10], [F.x0 - 22, F.y0 - 26], [F.x1 + 22, F.y0 - 26], [F.x1 + 22, F.y1 + 10]], OR, 2); hatch(null, 0.2, 5, 0.12); }, 8320, { drop: false });
      pc([[F.x0 - 34, F.y0 - 34], [F.x1 + 34, F.y0 - 34], [F.x1 + 20, F.y0 - 62], [F.cx, F.y0 - 92], [F.x0 - 20, F.y0 - 62]], '#7b8c80', () => { fillPts(ell(F.cx, F.y0 - 56, 14, 10, 12), OR); }, 8321, { drop: false });
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.restore();
      // petits bois (petits carreaux) : 3 × 6
      for (let i = 0; i <= 3; i++) { const x = lerp(F.x0, F.x1, i / 3); fillPts(rect(x - (i % 3 ? 3 : 7), F.y0, x + (i % 3 ? 3 : 7), F.y1), '#d8d2c0'); }
      for (let j = 0; j <= 6; j++) { const y = lerp(F.y0, F.y1, j / 6); fillPts(rect(F.x0, y - (j % 6 ? 3 : 7), F.x1, y + (j % 6 ? 3 : 7)), '#d8d2c0'); }
      fillPts(rect(F.cx - 5, F.y0, F.cx + 5, F.y1), '#cfc8b4'); for (const y of [520, 720]) { dot(F.cx, y, 4, OR); }
      pc(rect(F.x0 - 40, F.y1 + 6, F.x1 + 40, F.y1 + 24), '#9aab9e', () => strokePts([[F.x0 - 36, F.y1 + 8], [F.x1 + 36, F.y1 + 8]], 'rgba(255,255,240,0.6)', 1.4), 8322);
    });
  }
  function makePassy() {
    const F = CHAMBRE.fenetre;
    return M.pre(1080, BACK + 5, (c) => {
      const hill = (yb, amp, ph, col, seed) => { const pts = [[F.x0 - 10, F.y1 + 20]]; for (let x = -10; x <= F.x1 - F.x0 + 10; x += 12) pts.push([F.x0 + x, yb - amp * (0.5 + 0.5 * Math.sin(x * 0.02 + ph)) - 8 * M.noise(x * 0.05, seed)]); pts.push([F.x1 + 10, F.y1 + 20]); fillPts(pts, col, seed, 0.4); };
      hill(700, 70, 0.4, '#8c9890', 1); hill(760, 50, 2.0, '#7b8a74', 2);
      // toits et maisons de Passy, clocher
      for (const [x, w, h, col] of [[F.x0 + 10, 50, 70, '#a39a88'], [F.x0 + 64, 44, 56, '#b0a692'], [F.x0 + 112, 60, 80, '#9c927f'], [F.x0 + 150, 46, 62, '#ada38f']]) {
        fillPts(rect(x, 820 - h, x + w, 900), col); fillPts([[x - 6, 822 - h], [x + w / 2, 790 - h], [x + w + 6, 822 - h]], '#6e5a4e');
        for (let i = 0; i < 2; i++) fillPts(rect(x + 8 + i * 20, 840 - h, x + 16 + i * 20, 852 - h), 'rgba(60,50,40,0.6)');
      }
      fillPts(rect(F.x0 + 94, 640, F.x0 + 108, 720), '#8d8473'); fillPts([[F.x0 + 90, 642], [F.x0 + 101, 600], [F.x0 + 112, 642]], '#5e4c44');
      fillPts(rect(F.x0 + 132, 712, F.x0 + 140, 738), '#7a6a5a');
      hill(860, 24, 1.0, '#6c7a5c', 4);
      for (const [x, y, h] of [[F.x0 + 20, 800, 40], [F.x0 + 170, 790, 50], [F.x0 + 60, 810, 30]]) fillPts([[x - 8, y], [x, y - h], [x + 8, y]], '#3f4d38');
    });
  }
  function meubleChevet(x, y) {          // y = dessus
    pc([[x - 40, y, 1], [x + 40, y, 1], [x + 36, y + 14], [x + 34, BACK, 1], [x + 26, BACK, 1], [x + 26, y + 120], [x - 26, y + 120], [x - 26, BACK, 1], [x - 34, BACK, 1], [x - 36, y + 14]], '#6b4527', () => {
      fillPts(rect(x - 30, y + 22, x + 30, y + 70), '#7a5232'); dot(x, y + 46, 3.5, OR); strokePts([[x - 38, y + 4], [x + 38, y + 4]], 'rgba(255,220,170,0.4)', 1.4); hatch(null, 0.3, 4, 0.2);
    }, 8401);
  }
  function meubleSecretaire() {
    const S = CHAMBRE.secretaire, x0 = S.x0, x1 = S.x1, yP = S.plateau, cx = S.x;
    pc([[x0, BACK, 1], [x0, yP + 12, 1], [x1, yP + 12, 1], [x1, BACK, 1]], '#5a3a22', () => {
      for (const y of [yP + 30, yP + 100, yP + 170]) { fillPts(rect(x0 + 10, y, x1 - 10, y + 60), '#6b4527'); strokePts([[x0 + 10, y], [x1 - 10, y], [x1 - 10, y + 60], [x0 + 10, y + 60], [x0 + 10, y]], ORD, 1.2); for (const dx of [-50, 50]) dot(cx + dx, y + 30, 4, OR); }
      hatch(null, 0.25, 4, 0.2); shade(x1, 0, x0, 0, 0.2, [x0, yP, x1, BACK]);
    }, 8410);
    pc([[x0 + 10, yP - 2, 1], [x1 - 10, yP - 2, 1], [x1 - 10, yP - 170, 1], [x1 - 22, yP - 186, 1], [x0 + 22, yP - 186, 1], [x0 + 10, yP - 170, 1]], '#5a3a22', () => {
      fillPts(rect(x0 + 20, yP - 160, x1 - 20, yP - 4), '#2e2016');
      for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const a = x0 + 24 + i * (x1 - x0 - 48) / 5, b = yP - 154 + j * 72; fillPts(rect(a + 2, b + 2, a + (x1 - x0 - 48) / 5 - 2, b + 66), '#3d2a1c'); if ((i + j) % 2) fillPts(rect(a + 6, b + 30, a + 26, b + 66), j ? '#e8dfc8' : '#d9cba8'); }
      fillPts(rect(x0 + 6, yP - 190, x1 - 6, yP - 178), BD.boisL); hatch(null, 0.25, 4, 0.18);
    }, 8411);
    pc([[x0 - 8, yP - 4, 1], [x1 + 8, yP - 4, 1], [x1 + 8, yP + 14, 1], [x0 - 8, yP + 14, 1]], '#7a5232', () => { fillPts(rect(x0 + 30, yP - 4, x1 - 30, yP + 2), '#3e5a48'); strokePts([[x0 - 6, yP - 2], [x1 + 6, yP - 2]], 'rgba(255,220,170,0.5)', 1.4); }, 8412);
    // encrier, plumes, papiers, globe sur le dessus
    pc([[S.encrier.x - 14, yP - 4], [S.encrier.x + 14, yP - 4], [S.encrier.x + 11, yP - 22], [S.encrier.x - 11, yP - 22]], '#20202a', () => strokePts([[S.encrier.x - 8, yP - 20], [S.encrier.x - 6, yP - 8]], 'rgba(255,255,255,0.4)', 1.2), 8413);
    for (const [dx, a] of [[-2, -0.35], [4, -0.15]]) { const c = cx_(); c.save(); c.translate(S.encrier.x + dx, yP - 30); c.rotate(a); c.scale(0.45, 0.45); drawPlume({}); c.restore(); }
    pc([[cx - 76, yP - 4], [cx - 2, yP - 6], [cx, yP - 12], [cx - 74, yP - 10]], '#f0e8d4', null, 8414);
    const gx = x1 - 40, gy = yP - 234;
    pc([[gx - 22, yP - 186, 1], [gx + 22, yP - 186, 1], [gx + 6, yP - 200], [gx + 4, gy + 30], [gx - 4, gy + 30], [gx - 6, yP - 200]], '#6b4527', null, 8415);
    pc(ell(gx, gy, 30, 30, 22), '#b9b089', () => { fillPts([[gx - 18, gy - 14], [gx - 2, gy - 22], [gx + 6, gy - 6], [gx - 6, gy + 8], [gx - 20, gy + 2]], '#7a8a5c'); fillPts([[gx + 10, gy + 4], [gx + 22, gy + 2], [gx + 18, gy + 18], [gx + 8, gy + 16]], '#7a8a5c'); shade(gx + 20, gy, gx - 20, gy, 0.3, [gx - 32, gy - 32, gx + 32, gy + 32]); }, 8416);
    strokePts(ep(gx, gy, 36, 36, 20, -PI * 0.9, PI * 0.4), OR, 3);
  }
  function meubleBiblio() {
    const B = CHAMBRE.bibliotheque, x0 = B.x - 46, x1 = B.x + 46;
    pc([[x0, BACK, 1], [x0, B.y, 1], [x1, B.y, 1], [x1, BACK, 1]], '#5a3a22', () => {
      for (const y of [B.y + 20, B.y + 100, B.y + 180]) { fillPts(rect(x0 + 6, y, x1 - 6, y + 74), '#2e2016'); let x = x0 + 8, i = 0; while (x < x1 - 10) { const w = 8 + 6 * hash(x + y), hb = 58 - 14 * hash(x * 2 + y); fillPts(rect(x, y + 74 - hb, x + w, y + 74), ['#7f2420', '#3e5a48', '#8a6a2c', '#2e3a52', '#6b4527'][i++ % 5]); strokePts([[x + 1, y + 74 - hb + 6], [x + w - 1, y + 74 - hb + 6]], 'rgba(220,190,120,0.7)', 1); x += w + 1; } }
      hatch(null, 0.25, 4, 0.2);
    }, 8420);
    // harmonica de verre (armonica de Franklin) : coffre et rangée de bols de verre emboîtés sur leur axe
    const hy = B.y - 4;
    pc([[x0 - 6, hy, 1], [x1 + 6, hy, 1], [x1 + 2, hy - 36, 1], [x0 - 2, hy - 36, 1]], '#6b4527', () => { fillPts(rect(x0 + 4, hy - 34, x1 - 4, hy - 8), '#2e2016'); strokePts([[x0, hy - 2], [x1, hy - 2]], OR, 1.4); }, 8421);
    for (let i = 0; i < 9; i++) { const bx = x0 + 10 + i * 9.5, r = 15 - i * 1.1; fillPts(ell(bx, hy - 22, 4, r, 12), 'rgba(205,228,236,0.55)'); strokePts(ep(bx, hy - 22, 4, r, 12, 0, TAU), i % 2 ? 'rgba(176,141,69,0.9)' : 'rgba(140,150,160,0.9)', 1.3); }
    strokePts([[x0 + 2, hy - 22], [x1 - 2, hy - 22]], '#6a6a6a', 1.6);
  }
  function meubleGueridon() {
    const G = CHAMBRE.gueridon, x = G.x, y = G.y;
    pc([[x - 8, y + 10], [x + 8, y + 10], [x + 6, BACK - 24], [x + 40, BACK, 1], [x + 28, BACK, 1], [x, BACK - 14], [x - 28, BACK, 1], [x - 40, BACK, 1], [x - 6, BACK - 24]], '#5a3a22', null, 8430);
    pc([[x - 56, y, 1], [x + 56, y, 1], [x + 52, y + 12, 1], [x - 52, y + 12, 1]], '#6b4527', null, 8431);
    pc([[x - 44, y - 2, 1], [x + 44, y - 2, 1], [x + 38, y - 14, 1], [x - 38, y - 14, 1]], '#efe7d3', () => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) fillPts([[x - 44 + i * 11 + j * 1.5, y - 2 - j * 6], [x - 33 + i * 11 + j * 1.5, y - 2 - j * 6], [x - 33 + i * 11 + (j + 1) * 1.5, y - 8 - j * 6], [x - 44 + i * 11 + (j + 1) * 1.5, y - 8 - j * 6]], '#2a2420'); }, 8432);
    for (const [dx, h, col] of [[-26, 22, '#efe7d3'], [-10, 16, '#2a2420'], [12, 26, '#2a2420'], [28, 18, '#efe7d3']]) {
      pc([[x + dx - 6, y - 12], [x + dx + 6, y - 12], [x + dx + 3, y - 18], [x + dx + 3, y - 12 - h + 6], [x + dx + 5, y - 12 - h + 2], [x + dx, y - 12 - h - 4], [x + dx - 5, y - 12 - h + 2], [x + dx - 3, y - 12 - h + 6], [x + dx - 3, y - 18]], col, null, 8440 + dx);
    }
  }
  function cadrePortrait() {
    const Pp = CHAMBRE.portrait, x = Pp.x, y = Pp.y;
    pc(ell(x, y, 74, 92, 36), '#b08d45', () => { strokePts(ep(x, y, 68, 86, 36, 0, TAU), '#ecc97a', 2); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; dot(x + 71 * Math.cos(a), y + 89 * Math.sin(a), 2.4, '#76592a'); } }, 8450);
    pc(ell(x, y, 60, 78, 32), '#a9b6b0', () => {
      gradL(x, y - 78, x, y + 78, [[0, '#c7d0c2'], [0.6, '#e2d6b0'], [1, '#8d9a72']], [x - 62, y - 80, x + 62, y + 80]);
      fillPts([[x - 62, y + 20], [x - 30, y - 6], [x, y + 10], [x + 30, y - 12], [x + 62, y + 14], [x + 62, y + 80], [x - 62, y + 80]], '#7a8a5c');
      fillPts([[x - 62, y + 44], [x - 10, y + 30], [x + 62, y + 46], [x + 62, y + 80], [x - 62, y + 80]], '#5f6e46');
      fillPts(rect(x + 14, y - 6, x + 22, y + 34), '#4a3a2a'); fillPts(ell(x + 18, y - 16, 20, 18, 12), '#4f6b3c');
      dot(x - 24, y - 40, 10, 'rgba(240,210,140,0.8)');
    }, 8451, { drop: false });
    pc([[x - 10, y - 108], [x + 10, y - 108], [x, y - 92]], OR, null, 8452);
    strokePts([[x, y - 108], [x, y - 140]], 'rgba(40,30,20,0.6)', 1.2);
  }
  function makeChambreMeubles() {
    const W = 1080, H = BACK + 5;
    const A = M.pre(W, H, () => { cadrePortrait(); meubleBiblio(); meubleSecretaire(); meubleChevet(CHAMBRE.chevet.x, CHAMBRE.chevet.y); meubleGueridon(); });
    return M.pre(W, H, (c) => { c.save(); c.globalAlpha = 0.32; c.filter = 'brightness(0) blur(8px)'; c.drawImage(A, 14, 7); c.restore(); c.drawImage(A, 0, 0); });
  }
  function chaiseCannee() {
    return M.cutFlat(170, 300, 85, 290, () => {
      pc([[-52, 0, 1], [-44, 0, 1], [-40, -120], [40, -120], [44, 0, 1], [52, 0, 1], [48, -128], [56, -134, 1], [-56, -134, 1], [-48, -128]], '#6b4527', () => fillPts(rect(-46, -134, 46, -124), '#e0cc94'), 8460);
      pc([[-56, -134, 1], [-44, -134, 1], [-42, -250], [-30, -268], [30, -268], [42, -250], [44, -134, 1], [56, -134, 1], [54, -256], [36, -282], [-36, -282], [-54, -256]], '#6b4527', null, 8461);
      pc([[-36, -150], [36, -150], [36, -254], [24, -264], [-24, -264], [-36, -254]], '#e0cc94', () => { for (let x = -40; x < 40; x += 6) { strokePts([[x, -150], [x + 20, -264]], 'rgba(140,110,50,0.6)', 1); strokePts([[x, -150], [x - 20, -264]], 'rgba(140,110,50,0.6)', 1); } }, 8462);
    });
  }
  function mules() {
    return M.cutFlat(120, 40, 60, 34, () => {
      for (const dx of [-28, 18]) pc([[dx - 24, 0, 1], [dx + 26, 0, 1], [dx + 30, -6], [dx + 20, -14], [dx - 2, -18], [dx - 8, -10], [dx - 24, -8]], '#7a3a26', () => { fillPts([[dx + 2, -18], [dx + 18, -14], [dx + 14, -8], [dx + 2, -10]], '#B08A3E'); }, 8470 + dx);
    });
  }
  function potChambre() {
    return M.cutFlat(80, 50, 40, 44, () => pc([[-26, 0, 1], [26, 0, 1], [30, -20], [36, -26], [32, -32, 1], [-32, -32, 1], [-36, -26], [-30, -20]], '#eef0ea', () => { strokePts([[-28, -24], [28, -24]], '#4A6178', 2); strokePts(ep(40, -16, 7, 8, 10, -PI / 2, PI / 2), '#cfd2cc', 3); }, 8480));
  }
  function chat(x, y, k, g) {            // chat gris assis sur l'appui ; k 0..1 : il s'étire (avant-train allongé, dos creusé) puis se rassoit
    const e = Math.sin(PI * clamp(k)), c = cx_(), tail = Math.sin(g * 1.3) * 0.25;
    const body = [[-30, 0], [-34, -16], [-28, -34 + 10 * e], [-14, -44 + 14 * e], [6, -36 + 18 * e], [20 + 18 * e, -26 + 18 * e], [30 + 26 * e, -32 + 20 * e], [40 + 30 * e, -30 + 20 * e], [44 + 30 * e, -10 + 8 * e], [36 + 30 * e, 0, 1], [-28, 0, 1]];
    pc(body.map((p) => [x + p[0], y + p[1], p[2]]), '#6d6a66', () => hatch(null, 0.8, 3.5, 0.2, 1, undefined, [x - 40, y - 60, x + 90, y + 4]), 8490);
    const hx = x + 36 + 30 * e, hy = y - 46 + 22 * e;
    pc([[hx - 12, hy + 12], [hx - 14, hy - 6], [hx - 10, hy - 18, 1], [hx - 4, hy - 9], [hx + 4, hy - 9], [hx + 10, hy - 18, 1], [hx + 14, hy - 4], [hx + 12, hy + 12]], '#6d6a66', () => { dot(hx - 4, hy, 1.8, '#d9c34a'); dot(hx + 6, hy, 1.8, '#d9c34a'); }, 8491);
    c.save(); c.translate(x - 30, y - 4); c.rotate(-0.4 + tail); strokePts([[0, 0], [-20, -10], [-30, -34]], '#5a5753', 6); c.restore();
  }
  function pigeon(x, y, s, vol, g, dir) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * (dir || 1), s);
    const fl = vol > 0 ? Math.sin(g * 18) : 0;
    pc([[-18, -2], [-10, -14], [6, -16], [14, -22], [22, -20], [26, -16], [20, -12], [16, -4], [6, 4], [-8, 4], [-24, 0]], '#8a8f98', () => { fillPts([[12, -16], [18, -10], [10, -8]], '#6b7a6e'); dot(18, -18, 1.4, '#222'); }, 8495, { drop: false });
    fillPts([[26, -17], [32, -16], [26, -14]], '#b08d45');
    if (vol > 0) fillPts([[-6, -10], [4, -12], [-2, -36 * fl - 6], [-14, -30 * fl - 4]], '#a2a6ae'); else fillPts([[-14, -6], [4, -12], [8, -4], [-10, 0]], '#7b8088');
    if (vol <= 0) strokePts([[2, 4], [2, 10]], '#b06a4a', 1.4);
    c.restore();
  }
  HDH.pigeon = (x, y, s, o) => { o = o || {}; pigeon(x, y, s == null ? 1 : s, o.vol || 0, tg(o.t || 0), o.dir || 1); };
  HDH.chambre = function (t, up, o) {
    o = o || {}; up = up || 0; const K = HDH.K, c = cx_(), g = tg(t), F = CHAMBRE.fenetre;
    const lum = clamp(o.lumiere || 0), sol = clamp(o.soleil == null ? lum : o.soleil);
    c.save(); c.translate(0, -up);
    // vue par la fenêtre : ciel, lune / soleil levant, nuages, toits de Passy
    c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    const top = M.mixc(lum < 0.5 ? '#16203a' : '#6f8fb0', lum < 0.5 ? '#6f7fa0' : '#a9c3d8', lum < 0.5 ? lum * 2 : (lum - 0.5) * 2);
    const bot = M.mixc(lum < 0.5 ? '#2c3858' : '#e7a774', lum < 0.5 ? '#e7a774' : '#f0dfb8', lum < 0.5 ? lum * 2 : (lum - 0.5) * 2);
    gradL(0, F.y0, 0, F.y1, [[0, top], [1, bot]], [F.x0, F.y0, F.x1, F.y1]);
    if (lum < 0.6) { const a = 1 - lum / 0.6; for (let i = 0; i < 14; i++) dot(F.x0 + 184 * hash(i * 3.1), F.y0 + 260 * hash(i * 7.7), 1.4, `rgba(255,250,220,${0.7 * a * (0.6 + 0.4 * Math.sin(g * 2 + i))})`); c.save(); c.globalAlpha = a; dot(F.x0 + 54, F.y0 + 96, 24, '#efe8c8'); dot(F.x0 + 62, F.y0 + 90, 20, top); c.restore(); }
    if (sol > 0) { const sy = lerp(900, 560, ease(sol)); gradR(F.x0 + 140, sy, 4, F.x0 + 140, sy, 150, [[0, 'rgba(255,220,140,0.7)'], [1, 'rgba(255,200,120,0)']], [F.x0, F.y0, F.x1, F.y1]); dot(F.x0 + 140, sy, 34, '#f4b65a'); dot(F.x0 + 136, sy - 4, 26, '#f8cd78'); }
    M.nuages(t, { y0: F.y0 + 60, y1: F.y0 + 260, n: 3, vit: 12, s: 0.42, seed: 23, col: hexMix('#4a5674', '#efe2cc', lum), brume: 0.1 });
    c.drawImage(K.passy, 0, 0);
    M.fumee(t, { x: F.x0 + 136, y: 712, s: 0.25, n: 5, haut: 160, vent: 30, col: '#c9c4b8', a: 0.5, seed: 9 });
    if (o.pigeon > 0) { const u = clamp(o.pigeon), px = u < 0.35 ? lerp(F.x1 + 40, F.x0 + 130, M.easeOut(u / 0.35)) : u > 0.75 ? lerp(F.x0 + 130, F.x0 - 60, M.easeIn((u - 0.75) / 0.25)) : F.x0 + 130, py = u < 0.35 ? lerp(F.y0 + 260, F.y1 - 10, M.easeOut(u / 0.35)) : u > 0.75 ? lerp(F.y1 - 10, F.y0 + 100, (u - 0.75) / 0.25) : F.y1 - 10;
      pigeon(px, py, 0.9, u < 0.35 || u > 0.75 ? 1 : 0, g, u > 0.75 ? -1 : -1); }
    c.fillStyle = `rgba(${NUIT},${0.62 * (1 - lum)})`; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    c.restore();
    c.drawImage(K.chambreFond, 0, 0);
    // volets intérieurs à deux battants
    const v = ease(clamp(o.volets || 0)), phi = lerp(PI * 0.6, 0, v);
    volet(F.x0, F.y0, F.y1, (F.x1 - F.x0) / 2, phi, 1, '#8fa093', '#73867a', 8501);
    volet(F.x1, F.y0, F.y1, (F.x1 - F.x0) / 2, phi, -1, '#8fa093', '#73867a', 8502);
    const vcol = 'rgba(240,232,214,0.4)';
    M.voilage(t, { x: F.x0 + 2, y: F.y0 + 4, w: 48, h: F.y1 - F.y0 - 30, cote: 1, amp: 7, col: vcol });
    M.voilage(t, { x: F.x1 - 50, y: F.y0 + 4, w: 48, h: F.y1 - F.y0 - 30, cote: -1, amp: 7, col: vcol });
    M.pendule(t, { x: CHAMBRE.pendule.x, y: CHAMBRE.pendule.y, s: 0.92, per: 2 });
    c.drawImage(K.chambreMeubles, 0, 0);
    // bougie du chevet (flamme dessinée après la nuit)
    const B = CHAMBRE.bougie, haut = o.bougie == null ? 0.7 : o.bougie;
    HDH.bougie(B.x, B.y, B.s, { t, haut, flamme: 0 });
    // le lit et son occupant
    const L = CHAMBRE.lit; let r = null;
    if (o.lit !== false) {
      if (o.franklin) r = HDH.franklinLit(t, L.x, L.y, L.s, { style: 'baldaquin', dir: L.dir, pose: o.franklin, couv: o.couv });
      else HDH.lit(t, L.x, L.y, L.s, { style: 'baldaquin', dir: L.dir });
      M.flat(K.pot, L.x - 40, BACK, {});
      if (o.mules !== false) M.flat(K.mules, L.x + 150, BACK + 2, {});
    }
    M.flat(K.chaise, 806, BACK + 6, { cast: { dx: 12, dy: 5, a: 0.3 } });
    if (o.chat != null) chat(F.x0 + 40, F.y1 + 6, o.chat, g);
    // nuit bleu lune sur toute la pièce
    if (lum < 1) { c.fillStyle = `rgba(${NUIT},${0.58 * (1 - lum)})`; c.fillRect(0, 0, 1080, BACK + 2); }
    const fl = o.flamme == null ? lerp(1, 0.3, smooth(0.3, 1, lum)) : o.flamme;
    const mp = HDH.accPt('bougie', B.x, B.y, B.s, { haut }, 'meche');
    if (fl > 0.02) { M.flamme(t, { x: mp[0] + 0.5, y: mp[1] + 1, s: 0.55 * fl, r: 120 * (0.4 + 0.6 * fl), seed: 3 }); if (lum < 0.8) gradR(mp[0], mp[1], 10, mp[0] + 40, mp[1] + 20, 230, [[0, `rgba(255,190,110,${0.16 * fl * (1 - lum)})`], [1, 'rgba(255,190,110,0)']], [mp[0] - 240, mp[1] - 240, mp[0] + 280, mp[1] + 240]); }
    // rayon de soleil et poussière
    const ray = smooth(0.4, 1, lum) * (0.4 + 0.6 * sol) * (1 - v);
    if (ray > 0.01) {
      const poly = [[F.x0 + 6, F.y0 + 20], [F.x1 - 6, F.y0 + 20], [640, BACK], [300, BACK]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p2, i) => (i ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1]))); c.closePath();
      const gr = c.createLinearGradient(F.x1, F.y0, 400, BACK); gr.addColorStop(0, `rgba(255,214,150,${0.2 * ray})`); gr.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: 380, y: 420, w: 480, h: 900, n: 40, a: 0.8 * ray, seed: 17 });
      c.restore();
    }
    c.restore();
    return r;
  };
  // tapis à franges, à dessiner APRÈS M.drawFloor (devant le lit, sous les pieds)
  HDH.chambreSol = function (t, o) {
    o = o || {}; const lum = clamp(o.lumiere || 0), y0 = 1400, y1 = 1434;
    pc([[250, y0, 1], [770, y0, 1], [790, y1, 1], [230, y1, 1]], '#7f2a24', () => {
      fillPts([[262, y0 + 4], [758, y0 + 4], [772, y1 - 4], [248, y1 - 4]], '#a8763a'); fillPts([[278, y0 + 8], [742, y0 + 8], [752, y1 - 8], [268, y1 - 8]], '#7f2a24');
      for (let x = 300; x < 730; x += 46) fillPts([[x, y0 + 17], [x + 10, y0 + 11], [x + 20, y0 + 17], [x + 10, y0 + 23]], '#d0a75e');
      hatch(null, 0.2, 4, 0.2);
    }, 8510, { drop: false });
    for (let x = 236; x < 786; x += 7) strokePts([[x, y1], [x - 1, y1 + 7]], '#d8c8a0', 1.2);
    if (lum < 1) { const c = cx_(); c.fillStyle = `rgba(${NUIT},${0.45 * (1 - lum)})`; c.fillRect(220, y0 - 2, 580, 46); }
  };

  // =====================================================================
  // 9) DÉCOR : PLACE À L'HORLOGE (1916 → 1976 → 2019) — HDH.place(t, up, o) ; o.epoque, o.heure, o.secoue, o.drapeaux, o.charbon, o.feuille, o.pigeon
  // =====================================================================
  const PLACE = {
    horloge: { x: 540, y: 560, r: 170 },
    banc: { x: 300, y: 1257, x0: 176, x1: 424 }, kiosque: { x: 140 }, colonne: { x: 968 }, reverbere: { x: 846, y: 790 },
    balcon: { y: 930, x0: 300, x1: 780 }, porte: { x: 540, y0: 1060 }, oculus: { x: 540, y: 808 }, charbon: { x: 724, y: BACK }, caisse: { x: 784, y: BACK },
    arbres: [458, 622], drapeaux: [292, 788], libre: { x0: 250, x1: 800 },
  };
  HDH.PLACE = PLACE;
  const PIERRE = '#c9a86e', PIERREL = '#dcc08a', PIERRED = '#a8895a';
  function makePlaceFond() {
    const W = 1080, H = BACK + 5;
    return M.pre(W, H, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 1150); g.addColorStop(0, '#7f93a6'); g.addColorStop(0.6, '#b2bdc0'); g.addColorStop(1, '#d6d2c2'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(255,255,255,0.05)'; c.beginPath(); c.ellipse(100 + i * 140, 300 + 60 * hash(i), 160, 26, 0, 0, TAU); c.fill(); }
      // ville lointaine : toits, clochers, cheminées d'usine
      const pale = (col, a) => M.mixc(col, '#b8bec0', a);
      fillPts([[0, 1000], [40, 960], [90, 970], [130, 930], [190, 950], [250, 920], [330, 940], [400, 910], [480, 930], [560, 905], [640, 930], [720, 915], [800, 940], [880, 920], [960, 945], [1080, 925], [1080, 1150], [0, 1150]], pale('#5f6872', 0.55), 1, 0.4);
      fillPts([[150, 930], [150, 760], [170, 700], [190, 760], [190, 930]], pale('#4e5862', 0.5)); fillPts([[160, 760], [170, 650], [180, 760]], pale('#3e4852', 0.5));
      fillPts([[880, 930], [880, 800], [900, 770], [940, 770], [960, 800], [960, 930]], pale('#4e5862', 0.5)); fillPts(ell(920, 770, 34, 30, 16).filter((p) => p[1] <= 770), pale('#4e5862', 0.5));
      for (const [x, y] of [[100, 880], [985, 862]]) fillPts(rect(x - 9, y, x + 9, 990), pale('#6b4a3a', 0.45));
      fillPts([[0, 1080], [60, 1040], [120, 1052], [180, 1020], [260, 1040], [340, 1010], [420, 1036], [500, 1015], [580, 1040], [660, 1020], [740, 1046], [820, 1018], [900, 1040], [980, 1020], [1080, 1036], [1080, 1250], [0, 1250]], pale('#6d6c70', 0.3), 2, 0.4);
      for (let i = 0; i < 40; i++) { const x = 20 + i * 27, y = 1060 + 40 * hash(i * 1.7); fillPts(rect(x, y, x + 6, y + 9), 'rgba(60,55,50,0.45)'); }
      // pavés de la place
      c.fillStyle = '#9c968a'; c.fillRect(0, 1240, W, H - 1240);
      for (let r = 0; r < 8; r++) { const y = 1244 + r * 19, h = 16; for (let x = -20 + (r % 2) * 22; x < W; x += 44) { c.fillStyle = M.mixc('#a8a194', '#8a8478', hash(x * 0.3 + r)); c.beginPath(); c.ellipse(x, y + h / 2, 20, h / 2 - 1, 0, 0, TAU); c.fill(); } }
      c.fillStyle = 'rgba(40,30,20,0.12)'; c.fillRect(0, 1240, W, 8);
    });
  }
  function makeMairie() {
    const w = 760, h = BACK - 90;
    const cv = M.cutFlat(w, h, w / 2, h - 10, () => {
      const X0 = -340, X1 = 340, CX0 = -200, CX1 = 200, top = -(BACK - 250), yb = 0;   // repère : bas au sol, x relatif à 540
      const Y = (yy) => yy - BACK;                                                             // y écran → local
      // ailes
      for (const [a, b] of [[X0, CX0], [CX1, X1]]) {
        pc([[a, 0, 1], [a, Y(600), 1], [b, Y(600), 1], [b, 0, 1]], PIERRE, () => {
          for (let yy = Y(600); yy < 0; yy += 26) strokePts([[a, yy], [b, yy]], 'rgba(120,90,50,0.3)', 1);
          for (const wx of [a + 26, a + 82]) { fillPts(rect(wx, Y(660), wx + 40, Y(880)), '#3a4250'); strokePts([[wx + 20, Y(660)], [wx + 20, Y(880)]], '#c9c2b0', 2); for (const yy of [Y(720), Y(790)]) strokePts([[wx, yy], [wx + 40, yy]], '#c9c2b0', 2); fillPts(rect(wx - 6, Y(650), wx + 46, Y(660)), PIERRED); fillPts(rect(wx - 6, Y(880), wx + 46, Y(892)), PIERREL);
            fillPts(rect(wx, Y(1090), wx + 40, Y(1300)), '#3a4250'); strokePts([[wx + 20, Y(1090)], [wx + 20, Y(1300)]], '#c9c2b0', 2); fillPts(rect(wx - 6, Y(1078), wx + 46, Y(1090)), PIERRED); }
          fillPts(rect(a, Y(600), b, Y(616)), PIERRED); fillPts(rect(a, Y(1000), b, Y(1012)), PIERRED);
          hatch(null, 0.3, 5, 0.12); shade(0, Y(600), 0, 0, 0.18, [a, Y(620), b, 0]);
        }, 8601 + a);
        pc([[a - 6, Y(600), 1], [b + 6, Y(600), 1], [b - 20, Y(530), 1], [a + 20, Y(530), 1]], '#4e5560', () => { for (let x = a + 30; x < b - 20; x += 14) strokePts([[x, Y(596)], [x + 4, Y(534)]], 'rgba(200,200,210,0.25)', 1); fillPts([[(a + b) / 2 - 18, Y(600)], [(a + b) / 2 + 18, Y(600)], [(a + b) / 2 + 14, Y(560)], [(a + b) / 2, Y(546)], [(a + b) / 2 - 14, Y(560)]], PIERREL); }, 8605 + a);
      }
      // pavillon central
      pc([[CX0, 0, 1], [CX0, Y(330), 1], [CX1, Y(330), 1], [CX1, 0, 1]], PIERREL, () => {
        for (let yy = Y(330); yy < 0; yy += 30) strokePts([[CX0, yy], [CX1, yy]], 'rgba(120,90,50,0.28)', 1);
        for (const x of [CX0 + 14, CX1 - 14]) { fillPts(rect(x - 12, Y(340), x + 12, 0), PIERRE); strokePts([[x - 6, Y(340)], [x - 6, 0]], 'rgba(255,240,200,0.4)', 1.2); }
        fillPts(ell(0, Y(560), 196, 196, 40), PIERRED); fillPts(ell(0, Y(560), 190, 190, 40), '#5a4a3a');
        // oculus du balancier
        fillPts(ell(0, Y(808), 46, 52, 24), PIERRED); fillPts(ell(0, Y(808), 38, 44, 24), '#2a2622');
        // balcon
        fillPts(rect(-240, Y(930), 240, Y(912)), PIERRED);
        // porte cintrée
        fillPts([[-62, 0], [-62, Y(1110)], [-40, Y(1150)], [0, Y(1164)], [40, Y(1150)], [62, Y(1110)], [62, 0]], '#4a3324');
        strokePts([[0, Y(1164)], [0, 0]], '#2e2016', 2); for (const yy of [Y(1240), Y(1320)]) strokePts([[-56, yy], [56, yy]], '#2e2016', 1.4);
        fillPts([[-80, 0], [-80, Y(1110)], [-62, Y(1110)], [-62, 0]], PIERRE); fillPts([[62, 0], [62, Y(1110)], [80, Y(1110)], [80, 0]], PIERRE);
        fillPts([[-14, Y(1176)], [14, Y(1176)], [10, Y(1150)], [-10, Y(1150)]], PIERRED);
        for (const wx of [-150, 110]) { fillPts(rect(wx, Y(1080), wx + 40, Y(1300)), '#3a4250'); strokePts([[wx + 20, Y(1080)], [wx + 20, Y(1300)]], '#c9c2b0', 2); }
        hatch(null, 0.3, 5, 0.1);
      }, 8610);
      // fronton cintré au-dessus du cadran, avec campanile
      pc([[CX0 - 16, Y(330), 1], [CX1 + 16, Y(330), 1], [CX1 + 16, Y(312), 1], [140, Y(270)], [0, Y(246)], [-140, Y(270)], [CX0 - 16, Y(312), 1]], PIERREL, () => { strokePts([[-170, Y(300)], [0, Y(262)], [170, Y(300)]], PIERRED, 3); fillPts(ell(0, Y(296), 22, 16, 14), PIERRED); }, 8615);
      pc([[-36, Y(250), 1], [36, Y(250), 1], [36, Y(196), 1], [26, Y(186)], [0, Y(170)], [-26, Y(186)], [-36, Y(196), 1]], '#4e5560', () => { fillPts(rect(-20, Y(240), 20, Y(204)), '#2a2622'); strokePts([[0, Y(170)], [0, Y(140)]], '#2a2622', 3); dot(0, Y(140), 4, OR); }, 8616);
      // corniche
      pc(rect(CX0 - 20, Y(352), CX1 + 20, Y(330)), PIERRED, () => { for (let x = CX0 - 16; x < CX1 + 16; x += 14) fillPts(rect(x, Y(344), x + 7, Y(334)), PIERRE); }, 8617);
      // balustrade du balcon
      pc(rect(-244, Y(912), 244, Y(904)), PIERREL, null, 8618);
      pc(rect(-244, Y(868), 244, Y(860)), PIERREL, null, 8619);
      for (let x = -236; x <= 236; x += 16) pc([[x - 4, Y(904)], [x + 4, Y(904)], [x + 6, Y(892)], [x + 3, Y(880)], [x + 4, Y(868)], [x - 4, Y(868)], [x - 3, Y(880)], [x - 6, Y(892)]], PIERRE, null, 8620 + x);
      for (const x of [-200, -100, 100, 200]) pc([[x - 10, Y(930)], [x + 10, Y(930)], [x + 6, Y(966)], [x - 6, Y(966)]], PIERRED, null, 8700 + x);
    });
    cv.padB = 10; return M.withShadow(cv, 10);
  }
  function makeKiosque() {
    return M.cutFlat(220, 560, 110, 550, () => {
      pc([[-80, 0, 1], [80, 0, 1], [80, -320, 1], [-80, -320, 1]], '#3f5a46', () => {
        for (const x of [-80, -26, 28]) fillPts(rect(x + 4, -300, x + 50, -40), '#2e4434');
        fillPts(rect(-80, -330, 80, -310), '#2e4434'); hatch(null, 0.2, 4, 0.18);
      }, 8801);
      pc([[-96, -320, 1], [96, -320, 1], [80, -350], [56, -390], [20, -420], [0, -424], [-20, -420], [-56, -390], [-80, -350]], '#4b6a52', () => { for (let x = -80; x <= 80; x += 20) strokePts([[x, -324], [x * 0.2, -420]], 'rgba(20,30,20,0.4)', 1.2); fillPts(rect(-96, -332, 96, -320), '#2e4434'); }, 8802);
      pc([[-6, -420], [6, -420], [4, -470], [10, -478], [0, -500], [-10, -478], [-4, -470]], '#2e4434', () => dot(0, -484, 4, OR), 8803);
    });
  }
  function makeColonne() {
    return M.cutFlat(160, 600, 80, 590, () => {
      pc([[-56, 0, 1], [56, 0, 1], [52, -20], [44, -30, 1], [44, -400, 1], [-44, -400, 1], [-44, -30, 1], [-52, -20]], '#3f5a46', () => { fillPts(rect(-44, -386, 44, -40), '#d9cfb5'); shade(44, 0, -44, 0, 0.3, [-56, -420, 56, 0]); }, 8811);
      pc([[-58, -400, 1], [58, -400, 1], [52, -420], [34, -452], [0, -470], [-34, -452], [-52, -420]], '#4b6a52', () => { for (let x = -50; x <= 50; x += 14) strokePts([[x, -404], [x * 0.3, -466]], 'rgba(20,30,20,0.4)', 1.2); }, 8812);
      pc([[-5, -470], [5, -470], [3, -500], [0, -514], [-3, -500]], '#2e4434', null, 8813);
    });
  }
  function makeBanc() {
    return M.cutFlat(280, 200, 140, 190, () => {
      for (const x of [-96, 96]) pc([[x - 18, 0, 1], [x - 10, 0, 1], [x - 4, -60], [x + 10, -100], [x + 10, -168], [x + 2, -168], [x - 4, -120], [x - 14, -126], [x - 10, -100], [x - 2, -60]], '#2e3a32', () => strokePts([[x - 6, -70], [x + 6, -110]], 'rgba(200,210,200,0.3)', 1), 8820 + x);
      pc([[-124, -126, 1], [124, -126, 1], [124, -138, 1], [-124, -138, 1]], '#5c7a52', null, 8823);
      for (const y of [-150, -166]) pc(rect(-120, y - 8, 120, y), '#5c7a52', () => strokePts([[-118, y - 6], [118, y - 6]], 'rgba(255,255,230,0.3)', 1), 8824 + y);
      pc(rect(-124, -120, 124, -110), '#4e6a46', null, 8827);
    });
  }
  function makeArbre() {
    return M.cutFlat(200, 420, 100, 410, () => {
      pc([[-40, 0, 1], [40, 0, 1], [40, -72, 1], [-40, -72, 1]], '#3f5a46', () => { strokePts([[-36, -36], [36, -36]], 'rgba(255,255,230,0.25)', 1.2); for (const x of [-40, 40]) fillPts(rect(x - 4, -80, x + 4, 0), '#2e4434'); dot(-40, -84, 6, '#2e4434'); dot(40, -84, 6, '#2e4434'); }, 8830);
      pc([[-6, -72], [6, -72], [5, -230], [-5, -230]], '#5a3a22', null, 8831);
      pc(ell(0, -300, 82, 78, 26).map((p, i) => [p[0] * (1 + 0.06 * Math.sin(i * 2.7)), p[1] + 6 * Math.sin(i * 1.9)]), '#4f6b3c', () => { for (let i = 0; i < 26; i++) dot(-70 + 140 * hash(i * 1.3), -370 + 140 * hash(i * 2.9), 5, i % 3 ? 'rgba(120,150,90,0.6)' : 'rgba(214,140,50,0.85)'); hatch(null, 0.8, 4, 0.2); }, 8832);
    });
  }
  function makeReverbere(electrique) {
    return M.cutFlat(180, 680, 90, 670, () => {
      pc([[-22, 0, 1], [22, 0, 1], [18, -30], [10, -44], [8, -560], [12, -576], [-12, -576], [-8, -560], [-10, -44], [-18, -30]], '#2e3236', () => strokePts([[-2, -40], [-2, -560]], 'rgba(200,200,210,0.3)', 1.4), 8840);
      if (!electrique) {
        pc([[-26, -580, 1], [26, -580, 1], [34, -640], [22, -650], [-22, -650], [-34, -640]], '#2e3236', () => { fillPts([[-20, -586], [20, -586], [26, -636], [-26, -636]], 'rgba(240,226,180,0.85)'); strokePts([[0, -586], [0, -636]], '#2e3236', 1.5); }, 8841);
        pc([[-30, -650], [30, -650], [0, -672]], '#2e3236', null, 8842);
      } else {
        strokePts([[0, -576], [0, -620], [20, -650], [60, -656]], '#3a3e44', 7);
        pc([[44, -664], [84, -664], [80, -646], [48, -646]], '#4a4e54', () => fillPts([[50, -648], [78, -648], [74, -640], [54, -640]], 'rgba(250,240,200,0.9)'), 8843);
      }
    });
  }
  function makeSeau() {
    return M.cutFlat(170, 150, 85, 140, () => {
      pc(ell(0, -58, 66, 30, 22).filter((p) => p[1] < -48).concat([[66, -58], [52, 0, 1], [-52, 0, 1], [-66, -58]]), '#1d1b1f', () => { for (let i = 0; i < 18; i++) fillPts(ell(-50 + 100 * hash(i * 1.7), -70 - 20 * hash(i * 3.3), 9, 7, 6), i % 2 ? '#3a3a40' : '#2a2a30'); }, 8850);
      pc([[-62, -56], [62, -56], [52, 0, 1], [-52, 0, 1]], '#5a5f66', () => { for (const y of [-44, -16]) strokePts([[-60, y], [60, y]], '#3a3e44', 2); shade(60, 0, -60, 0, 0.35, [-70, -60, 70, 0]); }, 8851);
      strokePts(ep(0, -56, 70, 60, 18, PI * 1.05, PI * 1.95), '#3a3e44', 3);
    });
  }
  function makeCaisse() {
    return M.cutFlat(130, 110, 65, 100, () => pc(rect(-54, -84, 54, 0), '#8a6a3e', () => { for (const y of [-56, -28]) strokePts([[-54, y], [54, y]], 'rgba(60,40,20,0.6)', 1.4); strokePts([[-54, 0], [54, -84]], 'rgba(60,40,20,0.6)', 2); hatch(null, 0.1, 4, 0.2); }, 8860));
  }
  function drapeauUE(x, y, h, k, g, ph, sens) {
    // hampe partant du balcon, drapeau bleu à cercle d'étoiles d'or (sans texte) qui ondule vers l'extérieur ; k = montée 0..1
    const L = 160 * (sens || 1), Hh = 104, top = y - h, fy = lerp(y - 40, top + 4, ease(k));
    strokePts([[x, y], [x, top]], '#3a3a3a', 4); dot(x, top - 4, 5, OR);
    if (k <= 0.01) return;
    const col = 24, pts = [], pts2 = [];
    for (let i = 0; i <= col; i++) { const u = i / col, wv = Math.sin(g * 3.2 + u * 5 + ph) * 8 * u; pts.push([x + u * L, fy + wv]); pts2.push([x + u * L, fy + Hh + wv]); }
    pc(pts.concat(pts2.reverse()), '#2e4a8a', () => {
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, u = 0.5 + 0.26 * Math.cos(a) * (Hh / L) * 1.3, sx = x + u * L, sy = fy + Hh / 2 + 32 * Math.sin(a) + Math.sin(g * 3.2 + u * 5 + ph) * 8 * u;
        const st = []; for (let j = 0; j < 10; j++) { const r = j % 2 ? 2.4 : 6, b = -PI / 2 + j * PI / 5; st.push([sx + r * Math.cos(b), sy + r * Math.sin(b)]); } fillPts(st, '#e8c34a', 0, 0); }
      for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6; strokePts([[x + u * L, fy], [x + u * L, fy + Hh]], `rgba(${Math.sin(g * 3.2 + u * 5 + ph) > 0 ? '255,255,255,0.12' : '0,0,30,0.18'})`, 10); }
    }, 8870 + Math.round(ph * 10));
  }
  const AFF = { 1916: ['#a8452e', '#d1b062', '#5d7a8a', '#e0d6b8'], 1976: ['#c9783a', '#4f7a6a', '#b8463e', '#d9c27a'], 2019: ['#3e6aa0', '#d6a63a', '#9a3e5a', '#5aa08a'] };
  function affiches(x, y0, n, w, h, ep0, seed) {
    const cols = AFF[ep0] || AFF[1916];
    for (let i = 0; i < n; i++) { const px = x + i * (w + 6), col = cols[(i + seed) % cols.length]; pc(rect(px, y0, px + w, y0 + h), col, () => { fillPts(rect(px + 6, y0 + 8, px + w - 6, y0 + h * 0.45), M.mixc(col, '#f1ead6', 0.5)); dot(px + w / 2, y0 + h * 0.7, w * 0.18, M.mixc(col, '#1d1b1f', 0.4)); for (let j = 0; j < 3; j++) strokePts([[px + 6, y0 + h * 0.55 + j * 6], [px + w - 8, y0 + h * 0.55 + j * 6]], 'rgba(30,25,20,0.35)', 1.2); }, seed * 31 + i, { drop: false }); }
  }
  HDH.place = function (t, up, o) {
    o = o || {}; up = up || 0; const K = HDH.K, c = cx_(), g = tg(t), ep0 = o.epoque || 1916, H0 = PLACE.horloge;
    c.save(); c.translate(0, -up);
    c.drawImage(K.placeFond, 0, 0);
    M.fumee(t, { x: 100, y: 876, s: 0.6, n: 6, haut: 260, vent: 50, col: '#b9b7b0', a: 0.55, seed: 41 });
    M.fumee(t, { x: 985, y: 858, s: 0.6, n: 6, haut: 260, vent: 40, col: '#b9b7b0', a: 0.5, seed: 43, per: 3.6 });
    M.oiseaux(g, { x0: -80, x1: 1160, y: 250, dur: 18, n: 4, s: 0.55, boucle: true, brume: 0.45, seed: 7 });
    M.flat(K.mairie, 540, BACK, { cast: { dx: 16, dy: 6, a: 0.3 } });
    // balancier dans l'oculus
    c.save(); c.beginPath(); c.ellipse(PLACE.oculus.x, PLACE.oculus.y, 38, 44, 0, 0, TAU); c.clip();
    c.translate(PLACE.oculus.x, PLACE.oculus.y - 52); c.rotate(0.22 * Math.sin(g * PI));
    fillPts(rect(-2, 0, 2, 72), '#b08d45'); fillPts(ell(0, 76, 13, 13, 16), '#c9a24a'); dot(-3, 73, 4, '#f1dc9a');
    c.restore();
    HDH.horloge(t, H0.x, H0.y, 1, { heure: o.heure == null ? 2 : o.heure, secoue: o.secoue || 0 });
    // pigeons perchés sur le fronton (hochent la tête)
    for (const [px, py, ph, d] of [[420, 293, 0, 1], [452, 286, 1.7, 1], [640, 290, 3.1, -1]]) { const b = Math.max(0, Math.sin(g * 2.2 + ph)) * 3; c.save(); c.translate(0, -b * 0.3); pigeon(px, py - 6, 0.85, 0, g, d); c.restore(); }
    if (o.drapeaux > 0) { drapeauUE(PLACE.drapeaux[0], PLACE.balcon.y - 6, 280, o.drapeaux, g, 0, -1); drapeauUE(PLACE.drapeaux[1], PLACE.balcon.y - 6, 280, o.drapeaux, g, 1.3, 1); }
    M.passants(t, { y: BACK - 4, s: 0.3, n: 3, per: 16, x0: 230, x1: 850, brume: 0.5, seed: 13 });
    M.flat(K.kiosque, PLACE.kiosque.x, BACK, { cast: { dx: 14, dy: 6, a: 0.3 } });
    affiches(PLACE.kiosque.x - 74, BACK - 296, 3, 44, 70, ep0, 1); affiches(PLACE.kiosque.x - 74, BACK - 210, 3, 44, 60, ep0, 2);
    M.flat(K.colonne, PLACE.colonne.x, BACK, { cast: { dx: 14, dy: 6, a: 0.3 } });
    affiches(PLACE.colonne.x - 40, BACK - 370, 2, 36, 120, ep0, 3); affiches(PLACE.colonne.x - 40, BACK - 230, 2, 36, 100, ep0, 4);
    M.flat(ep0 >= 1976 ? K.reverbereE : K.reverbereG, PLACE.reverbere.x, BACK, { cast: { dx: 14, dy: 6, a: 0.3 } });
    for (const [i, x] of PLACE.arbres.entries()) M.flat(K.arbre, x, BACK, { rot: 0.012 * Math.sin(g * 0.9 + i * 1.7), cast: { dx: 12, dy: 5, a: 0.28 } });
    M.flat(K.banc, PLACE.banc.x, BACK, { cast: { dx: 14, dy: 6, a: 0.32 } });
    M.flat(K.caisse, PLACE.caisse.x, BACK, { cast: { dx: 12, dy: 5, a: 0.3 } });
    const ch = o.charbon == null ? 0 : clamp(o.charbon);
    if (ch > 0) M.flat(K.seau, PLACE.charbon.x, BACK, { scale: M.spring(ch * 0.8, 0.5, 14) * 1, cast: { dx: 12, dy: 5, a: 0.3 } });
    // événements : feuille morte qui tombe sur le banc ; pigeon qui se pose sur la grande aiguille
    if (o.feuille > 0) { const u = clamp(o.feuille), fx = lerp(PLACE.banc.x - 80, PLACE.banc.x + 50, u) + Math.sin(u * 14) * 26 * (1 - u), fy = lerp(700, PLACE.banc.y - 4, Math.min(1, u * 1.05)); c.save(); c.translate(fx, fy); c.rotate(u < 0.95 ? Math.sin(u * 16) * 0.8 : 0.2); c.scale(1, u < 0.95 ? Math.cos(u * 11) : 0.5); fillPts([[-12, 0], [-4, -8], [8, -6], [14, 0], [8, 6], [-4, 7]], '#b5642e'); strokePts([[-12, 0], [14, 0]], '#7a3e1a', 1); c.restore(); }
    if (o.pigeon > 0) { const u = clamp(o.pigeon), A2 = HDH.horlogePt('aiguille', { heure: o.heure == null ? 2 : o.heure }), px = u < 0.35 ? lerp(1000, A2[0], M.easeOut(u / 0.35)) : u > 0.75 ? lerp(A2[0], -40, M.easeIn((u - 0.75) / 0.25)) : A2[0], py = u < 0.35 ? lerp(300, A2[1] - 4, M.easeOut(u / 0.35)) : u > 0.75 ? lerp(A2[1] - 4, 200, (u - 0.75) / 0.25) : A2[1] - 4;
      pigeon(px, py, 0.95, u < 0.35 || u > 0.75 ? 1 : 0, g, u < 0.35 ? -1 : u > 0.75 ? -1 : 1); }
    c.restore();
  };

  // =====================================================================
  // 10) PRÉ-RENDUS
  // =====================================================================
  HDH.init = function () {
    HDH.K = { chambreFond: makeChambreFond(), passy: makePassy(), chambreMeubles: makeChambreMeubles(), chaise: M.withShadow(chaiseCannee(), 6), mules: mules(), pot: potChambre(),
      placeFond: makePlaceFond(), mairie: makeMairie(), kiosque: M.withShadow(makeKiosque(), 8), colonne: M.withShadow(makeColonne(), 8), banc: M.withShadow(makeBanc(), 6),
      arbre: M.withShadow(makeArbre(), 8), reverbereG: M.withShadow(makeReverbere(false), 6), reverbereE: M.withShadow(makeReverbere(true), 6), seau: M.withShadow(makeSeau(), 6), caisse: M.withShadow(makeCaisse(), 6) };
    for (const k of ['chaise', 'mules', 'pot', 'kiosque', 'colonne', 'banc', 'arbre', 'reverbereG', 'reverbereE', 'seau', 'caisse']) HDH.K[k].padB = 10;
    for (const k of ['mules', 'pot']) HDH.K[k].padB = 6;
    return HDH.K;
  };
})();
