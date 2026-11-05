// persos.js — « Le camp du Drap d'Or, le sommet perdu à la lutte » (juin 1520) : François Ier, Henri VIII, Charles Quint, trois courtisans,
// objets tenus (coupe, chaîne, pichet, gobelet, parchemin, plume, toques), décors DOR.camp et DOR.salle. Espace M.dor (alias DOR).
// Appeler DOR.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni symbole.
// MARIONNETTES : DOR.francois, DOR.henri, DOR.charles, DOR.courtisanA, DOR.dameB, DOR.courtisanC (pose, x, y, s, o) → r ; DOR.lutte(t, u, o)
// ACCESSOIRES  : DOR.coupe, DOR.chaine, DOR.pichet, DOR.gobelet, DOR.parchemin, DOR.plume, DOR.toqueF, DOR.toqueH, DOR.tabouret (x, y, s, o)
// DÉCORS       : DOR.camp(t, o) → M.drawFloor() → DOR.campSol(t, o) → marionnettes → DOR.campAvant(t, o)
//                DOR.salle(t, o) → M.drawFloor() → DOR.salleMeubles(t, o) → marionnettes → DOR.salleAvant(t, o) ; repères DOR.CAMP, DOR.SAL
(function () {
  const X = M.X, CH = M.chars, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const DOR = (M.dor = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const FEET = M.ST.slotF - 34;

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function ribbonW(line, wf) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = (typeof wf === 'function' ? wf(i / (line.length - 1)) : wf) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function cbez(p0, p1, p2, p3, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }
  function rrect(x0, y0, x1, y1, r) { return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5)); }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const lp2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  // bord dentelé / plumeux : points alternés repoussés vers l'extérieur
  function frange(pts, amp, step) {
    let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
    const o = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
      for (let k = 0; k < n; k++) { const u = k / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, pu = (k % 2) ? amp : 0; o.push([x + dx / l * pu, y + dy / l * pu]); }
    }
    return o;
  }

  // ------------------------------------------------------------ palette
  const OR = '#b8923a', ORL = '#e0c06a', ORD = '#7e6224', ORT = '#c9a64a', IVO = '#e8dcc0', IVOD = '#cfc2a2';
  const NUIT = '#2a3550', NUITD = '#1f2840', CRAM = '#8a2a2a', CRAMD = '#5e1c1c', FOUR = '#5a3f2a', FOURL = '#7a5a3e';
  const NOIR = '#1e1e22', NOIRL = '#34343c', VERT = '#4f6a4a', OCRE = '#b07a35', BLEU = '#3a4a78';
  const PEAU = '#e2c3a0', PEAUD = '#c9a07c', ETAIN = '#9c9b94', ETAIND = '#6e6d68', TERRE = '#a0603a', TERRED = '#7a4428', VIN = '#7e1626';

  // ------------------------------------------------------------ bras à articulations rondes, IK « coude vers l'avant »
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  // manche (bras) : rond d'épaule de rayon wt, ventre wm (bouffant si wm > wt), coude rond R_COUDE
  function sleeve(len, wt, wm) { return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wm, len * 0.33], [wm * 0.86, len * 0.62], [R_COUDE + 1, len - 8]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 1, len - 8], [-wm * 0.86, len * 0.62], [-wm, len * 0.33]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  function ik2(S, T) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI, b = normA(cAbs - a);
      const sc = -b;
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }
  // jambes en deux pièces : cuisse (genou rond en (0,112)) et jambe + pied (genou rond en (0,0), semelle y 125)
  function thighPts(th) { return [[-18 * th, -12], [16 * th, -14], [22 * th, 20], [20 * th, 70], [18, 100]].concat(ep(0, 112, 18, 18, 10, 0, PI), [[-18, 100], [-20 * th, 60], [-22 * th, 10]]); }
  function shinPts(foot) {
    const F = foot === 'ours' ? [[16, 96], [30, 99], [46, 102], [57, 109], [60, 118, 1], [55, 125, 1], [-17, 125, 1]]
      : foot === 'pointe' ? [[15, 104], [38, 109], [52, 119, 1], [50, 124, 1], [-16, 125, 1]]
        : [[15, 107], [40, 111], [48, 121, 1], [46, 124, 1], [-17, 125, 1]];
    return ep(0, 0, 18, 18, 10, PI, TAU).concat([[19, 8], [15, 58], [13, 93]], F, [[-20, 110], [-19, 68], [-21, 28], [-19, 6]]);
  }

  // ================================================================== OBJETS (repère : y vers le bas, échelle 1)
  // coupe d'or couverte (pied en (0,0)), ≈ 146 de haut
  function drawCoupe(o) {
    const lid = o.couvercle !== false;
    pc([[-30, 0, 1], [30, 0, 1], [26, -8], [10, -14], [7, -30], [12, -38], [7, -46], [7, -52], [-7, -52], [-7, -46], [-12, -38], [-7, -30], [-10, -14], [-26, -8]], OR, () => { strokePts([[-24, -6], [24, -6]], ORL, 1.6); hatch(null, 0.8, 3.4, 0.25); shade(-20, 0, 20, 0, 0.3); }, 8101);
    pc([[-40, -112], [40, -112], [36, -82], [24, -60], [8, -52], [-8, -52], [-24, -60], [-36, -82]], OR, () => {
      fillPts(rect(-40, -112, 40, -104), ORL); for (let x = -30; x <= 30; x += 12) fillPts([[x - 4, -98], [x + 4, -98], [x + 2, -66], [x - 2, -66]], ORD);
      strokePts([[-30, -100], [-22, -64]], 'rgba(255,245,200,0.75)', 2.4); shade(-30, 0, 34, 0, 0.32);
    }, 8102);
    if (lid) {
      pc([[-42, -112, 1], [42, -112, 1], [36, -122], [18, -132], [-18, -132], [-36, -122]], OR, () => { strokePts([[-34, -118], [34, -118]], ORD, 1.6); shade(-30, 0, 30, 0, 0.28); }, 8103);
      pc([[-6, -130], [6, -130], [8, -138], [0, -150, 1], [-8, -138]], ORL, () => shade(-6, 0, 6, 0, 0.3), 8104);
    }
    if (!SIL() && o.brille !== false) {
      const t = o.t || 0, c = cx_(), k = Math.pow(Math.max(0, Math.sin(t * 2.6)), 8);
      if (k > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * k; fillPts([[-20, -96], [-17, -88], [-20, -80], [-23, -88]], '#fff6d8'); c.restore(); }
    }
  }
  // chaîne d'or : boucle entre deux mains (bouts (0,0) et (e,0)), médaillon uni en bas ; o.ecart, o.chute (longueur)
  function chainePts(o) { const e = o.ecart == null ? 24 : o.ecart, sg = o.chute || 112, P_ = []; for (let i = 0; i <= 26; i++) { const u = i / 26; P_.push([e / 2 - Math.cos(PI * u) * (e / 2 + 30 * Math.sin(PI * u)), sg * Math.pow(Math.sin(PI * u), 0.85)]); } return P_; }
  function drawChaine(o) {
    const P_ = chainePts(o), c = cx_();
    for (let i = 0; i < P_.length - 1; i++) {
      const a = P_[i], b = P_[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, an = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.62, w = i % 2 ? 2.4 : 4.4;
      const pts = []; for (let j = 0; j < 8; j++) { const q = j / 8 * TAU; pts.push([mx + Math.cos(an) * Math.cos(q) * L - Math.sin(an) * Math.sin(q) * w, my + Math.sin(an) * Math.cos(q) * L + Math.cos(an) * Math.sin(q) * w]); }
      fillPts(pts, i % 2 ? ORD : OR); strokePts(pts.concat([pts[0]]), 'rgba(70,50,10,0.8)', 1);
    }
    const m = P_[13];
    pc(ell(m[0], m[1] + 14, 13, 13, 14), OR, () => { strokePts(ep(m[0], m[1] + 14, 8, 8, 12, 0, TAU), ORD, 1.6); strokePts([[m[0] - 6, m[1] + 8], [m[0] - 2, m[1] + 4]], 'rgba(255,245,200,0.8)', 1.6); }, 8121);
    void c;
  }
  // chaîne portée au cou (dessinée sur le torse) : arc de l'épaule au plastron
  function chaineCou(x0, y0, x1, y1, sag, n) {
    const P_ = qbez([x0, y0], [lerp(x0, x1, 0.5), Math.max(y0, y1) + sag], [x1, y1], n || 16);
    for (let i = 0; i < P_.length; i++) { const p = P_[i]; fillPts(ell(p[0], p[1], i % 2 ? 3 : 4.6, i % 2 ? 2 : 3, 6), i % 2 ? ORD : OR); }
    return P_;
  }
  // pichet de terre (fond en (0,0)) ≈ 124 de haut ; o.filet 0..1, o.filetY (y écran d'arrivée), o.liquide
  function drawPichet(o) {
    strokePts([[-26, -98], [-46, -92], [-54, -70], [-46, -46], [-30, -38]], TERRED, 9);
    strokePts([[-26, -98], [-46, -92], [-54, -70], [-46, -46], [-30, -38]], TERRE, 5.5);
    pc([[-24, 0, 1], [24, 0, 1], [34, -20], [40, -50], [36, -80], [24, -98], [22, -112], [30, -118], [44, -124, 1], [26, -126], [-22, -126], [-26, -118], [-22, -110], [-26, -96], [-38, -78], [-42, -50], [-36, -20]], TERRE, () => {
      fillPts([[-26, -126], [26, -126], [30, -112], [24, -98], [-24, -98], [-28, -112]], '#5d7a52');              // vernis vert au col
      fillPts([[-24, -98], [24, -98], [30, -88], [-30, -88]], 'rgba(93,122,82,0.6)');
      for (const y of [-72, -60]) strokePts([[-38, y], [38, y]], 'rgba(70,35,15,0.5)', 1.4);
      strokePts([[-24, -80], [-30, -30]], 'rgba(255,220,180,0.4)', 3); hatch(null, 0.8, 4, 0.22); shade(-30, 0, 34, 0, 0.3);
    }, 8131);
    const f = clamp(o.filet || 0);
    if (f > 0 && !SIL()) {
      const c = cx_(), m = c.getTransform(), bec = mp(m, [44, -124]);
      const y1 = o.filetY == null ? bec[1] + 160 : o.filetY, yy = lerp(bec[1], y1, f), t = o.t || 0;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.strokeStyle = o.liquide || VIN; c.lineCap = 'round';
      c.lineWidth = 5; c.beginPath(); c.moveTo(bec[0], bec[1]); c.quadraticCurveTo(bec[0] + 8, bec[1] + 10, bec[0] + 8 + Math.sin(t * 17) * 1, yy); c.stroke();
      c.strokeStyle = 'rgba(255,200,200,0.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(bec[0] + 6, bec[1] + 12); c.lineTo(bec[0] + 7, yy - 6); c.stroke(); c.restore();
    }
  }
  // gobelet d'étain (fond en (0,0)) ≈ 66 de haut ; o.niveau 0..1 (vin)
  function drawGobelet(o) {
    pc([[-20, 0, 1], [20, 0, 1], [22, -6], [18, -14], [22, -60], [24, -66, 1], [-24, -66, 1], [-22, -60], [-18, -14], [-22, -6]], ETAIN, () => {
      fillPts(rect(-24, -66, 24, -60), '#b9b8b0'); strokePts([[-20, -12], [20, -12]], ETAIND, 1.4); strokePts([[-12, -56], [-10, -18]], 'rgba(255,255,255,0.55)', 3);
      hatch(null, 0.9, 3.6, 0.2); shade(-16, 0, 20, 0, 0.35);
    }, 8141);
    const nv = clamp(o.niveau || 0); if (nv > 0.02) fillPts(ell(0, -64 + 2, 21, 3.5, 12), VIN);
  }
  // parchemin : rouleau du haut en (0,0), feuille qui se déroule vers le bas ; o.ouvert 0..1 ; sceau rouge rond (sans motif)
  const PARCH_W = 116;
  function parchH(o) { return lerp(18, 156, ease(clamp(o.ouvert == null ? 1 : o.ouvert))); }
  function drawParchemin(o) {
    const h = parchH(o), w = PARCH_W / 2;
    pc([[-w, 0, 1], [w, 0, 1], [w - 2, h * 0.5], [w, h, 1], [-w, h, 1], [-w + 3, h * 0.5]], '#eadcb6', () => {
      for (let y = 22; y < h - 30; y += 13) { const pts = []; for (let x = -w + 14; x <= w - 16; x += 6) pts.push([x, y + Math.sin(x * 0.35 + y) * 1.6]); strokePts(pts, 'rgba(70,50,30,0.55)', 1.3); }
      hatch(null, 0.5, 5, 0.12); shade(0, 0, 0, h, 0.15);
    }, 8151);
    for (const yy of [0, h]) pc(rrect(-w - 6, yy - 7, w + 6, yy + 7, 6), '#d8c698', () => { strokePts([[-w - 4, yy - 3], [w + 4, yy - 3]], 'rgba(255,250,230,0.6)', 1.4); shade(0, yy - 7, 0, yy + 7, 0.3); }, 8152 + (yy ? 1 : 0));
    if (h > 60) {
      const sx = 22, sy = h - 26;
      strokePts([[sx - 6, sy], [sx - 12, sy + 34]], '#7a1a1a', 4); strokePts([[sx + 4, sy], [sx + 10, sy + 32]], '#7a1a1a', 4);
      pc(frange(ell(sx, sy, 15, 15, 14), 2.2, 4), '#a0222a', () => { strokePts(ep(sx, sy, 9, 9, 12, 0, TAU), 'rgba(60,0,0,0.6)', 1.6); strokePts([[sx - 7, sy - 6], [sx - 3, sy - 9]], 'rgba(255,190,180,0.7)', 1.6); }, 8155);
    }
  }
  // plume d'oie (prise au tiers bas ; bec en (0,23)) ≈ 140 de long
  function drawPlume(o) {
    pc([[0, 23, 1], [3, 8], [6, -20], [14, -60], [18, -96], [10, -118, 1], [2, -96], [-6, -60], [-6, -24], [-2, 8]], '#d9d6cc', () => {
      strokePts([[1, 20], [3, -20], [8, -70], [10, -114]], 'rgba(90,85,75,0.8)', 1.3);
      for (let y = -100; y < -10; y += 7) { strokePts([[4 + (y + 100) * 0.05, y], [14 - (y + 100) * 0.04, y - 6]], 'rgba(120,115,105,0.6)', 0.9); strokePts([[3, y], [-5, y - 5]], 'rgba(120,115,105,0.5)', 0.9); }
      fillPts([[-6, -24], [-6, -60], [-2, -76], [0, -40]], 'rgba(110,110,118,0.35)');
    }, 8161);
    fillPts([[-1, 23], [1.5, 12], [3, 14], [1, 25]], '#1e1a18');
  }
  // ---- toques (objets libres : chute, tenue en main ; mêmes dessins que sur la tête)
  // plume d'autruche de François (repère de la toque) : monte, s'enroule vers l'arrière et retombe
  const PLUME_LINE = cbez([14, -8], [8, -58], [-50, -78], [-78, -40], 18).concat(qbez([-78, -40], [-94, -14], [-88, 22], 8).slice(1));
  const PLUME_F = frange(ribbonW(PLUME_LINE, (u) => 8 + 26 * Math.sin(PI * Math.min(1, u * 1.15)) * (1 - 0.3 * u)), 3.2, 5);
  function plumePaint() {
    strokePts(PLUME_LINE, 'rgba(150,145,135,0.85)', 1.5);
    for (let i = 2; i < PLUME_LINE.length - 1; i++) { const a = PLUME_LINE[i], b = PLUME_LINE[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; for (const sg of [-1, 1]) strokePts([[a[0], a[1]], [a[0] - dy / l * 13 * sg + dx / l * 6, a[1] + dx / l * 13 * sg + dy / l * 6]], 'rgba(170,165,160,0.55)', 0.9); }
    shade(-40, -70, -60, 0, 0.18, [-110, -100, 40, 40], '70,80,110');
  }
  const TOQUE_F = [[-46, 6], [-44, -4], [-28, -12], [0, -16], [30, -12], [50, -2], [52, 4, 1], [40, 8], [0, 9], [-36, 9]];
  function toqueFPaint() { fillPts([[-40, 2], [44, 2], [40, 8], [0, 9], [-36, 9]], '#0d0d10'); strokePts([[-36, -2], [-4, -9], [30, -6]], 'rgba(120,120,140,0.5)', 1.3); dot(16, 0, 4, OR); dot(16, 0, 1.8, '#f0e0a0'); hatch(null, 0.9, 3.2, 0.2); }
  function drawToqueF(o) { if (o.sens === -1) { const c = cx_(); c.save(); c.scale(-1, 1); drawToqueF(Object.assign({}, o, { sens: 1 })); c.restore(); return; } pc(TOQUE_F, '#16161a', toqueFPaint, 8171); if (o.plume !== false) pc(PLUME_F, '#f4f1e8', plumePaint, 8172); }
  const TOQUE_H = [[-48, 8], [-47, -4], [-32, -15], [0, -20], [30, -16], [48, -4], [51, 5, 1], [44, 9], [0, 11], [-42, 11]];
  function toqueHPaint() { strokePts([[-44, 5], [46, 5]], 'rgba(90,90,100,0.6)', 1.4); strokePts([[-30, -10], [0, -15], [26, -12]], 'rgba(110,110,130,0.45)', 1.2); hatch(null, 0.9, 3.2, 0.2); }
  function toqueHExtra() {                                                                          // liseré de petites plumes blanches + broche d'or
    if (SIL()) return;
    for (let i = 0; i < 10; i++) { const x = -42 + i * 9.6, y = -5 + Math.abs(x) * 0.02; fillPts(ell(x, y, 5, 3.2, 8), '#f2efe6'); strokePts([[x - 4, y], [x + 4, y - 1]], 'rgba(150,150,150,0.7)', 0.8); }
    fillPts(ell(34, -8, 6, 5, 10), OR); dot(34, -8, 2.6, '#7a1a2a'); strokePts([[31, -11], [33, -12]], '#fff0c0', 1);
  }
  function drawToqueH(o) { pc(TOQUE_H, '#141418', toqueHPaint, 8181); toqueHExtra(); void o; }
  const OBJ = {
    coupe: { draw: drawCoupe, grip: [0, -34], pts: { bord: [0, -112], haut: [0, -150], pied: [0, 0] }, base: [0, 0] },
    chaine: { draw: drawChaine, grip: [0, 0], p2: (o) => [o.ecart == null ? 24 : o.ecart, 0], pts: { bas: [12, 126] }, base: [12, 126] },
    pichet: { draw: drawPichet, grip: [-50, -70], p2: () => [10, -8], pts: { bec: [44, -124], fond: [0, 0] }, base: [0, 0] },
    gobelet: { draw: drawGobelet, grip: [0, -32], pts: { bord: [0, -66], fond: [0, 0] }, base: [0, 0] },
    parchemin: { draw: drawParchemin, grip: [-PARCH_W / 2 + 6, 0], p2: (o) => [-PARCH_W / 2 + 6, parchH(o)], pts: { haut: [0, 0], sceau: [22, 130], bas: [0, 156] }, base: [0, 156] },
    plume: { draw: drawPlume, grip: [0, -6], pts: { bec: [0, 23], haut: [10, -118] }, base: [0, 23] },
    toqueF: { draw: drawToqueF, grip: [6, 4], pts: { centre: [0, 0], plume: [-60, -60] }, base: [0, 9] },
    toqueH: { draw: drawToqueH, grip: [6, 4], pts: { centre: [0, 0] }, base: [0, 10] },
  };
  DOR.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) { const ob = OBJ[name]; if (!ob) return; const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(); c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore(); }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB0: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  DOR.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo); let q = ob.pts[nom];
    if (name === 'parchemin') { const h = parchH(oo); if (nom === 'bas') q = [0, h]; if (nom === 'sceau') q = [22, h - 26]; }
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };
  DOR.main = (r, arriere) => r.w(arriere ? 'armB_lo' : 'armF_lo', 4, 96);

  // ================================================================== POSES — machinerie commune
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), libre: Object.assign({}, p.libre) }); }
  function toTorso(def, q, P_, x, y, s, dir) { const m = M.partMatrices(def, q, x, y, s, dir).mats.torso; const r = new DOMPoint(P_[0], P_[1]).matrixTransform(m.inverse()); return [r.x, r.y]; }
  function armTo(q, arm, T, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T), A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const faceDef = (q, k, f) => { if (k > 0.5) for (const n in f) if (q.face[n] == null) q.face[n] = f[n]; };
  const openH = (q, front, back) => { if (front && q.handF == null && !has(q.tenu)) q.handF = 'open'; if (back && q.handB == null && !has(q.tenuB)) q.handB = 'open'; };
  function cibleT(def, q, cible, x, y, s, dir, off, dflt) {
    if (!cible) return dflt;
    const T = toTorso(def, q, cible, x, y, s, dir); if (!off) return T;
    const tl = q.tilt || 0, ox = off[0], oy = off[1];
    return [T[0] - (ox * Math.cos(tl) + oy * Math.sin(tl)), T[1] - (-ox * Math.sin(tl) + oy * Math.cos(tl))];
  }
  function offsetObj(name, oo, nom, rot) { const ob = OBJ[name]; if (!ob || !ob.pts[nom]) return [0, 0]; const g = gripOf(ob, oo || {}), q = ob.pts[nom]; const vx = q[0] - g[0], vy = q[1] - g[1], cr = Math.cos(rot || 0), sr = Math.sin(rot || 0); return [vx * cr - vy * sr, vx * sr + vy * cr]; }
  const add = (A, n, v) => { A[n] = (A[n] || 0) + v; };
  function marche(q, k, t) {
    if (!(k > 0)) return; const ph = t * 7.2, A = q.ang, sn = Math.sin(ph);
    add(A, 'legF', sn * 0.3 * k); add(A, 'legB', -sn * 0.3 * k);
    add(A, 'legF_lo', Math.max(0, sn) * 0.42 * k); add(A, 'legB_lo', Math.max(0, -sn) * 0.42 * k);
    add(A, 'armF_up', -sn * 0.12 * k); add(A, 'armB_up', sn * 0.1 * k); add(A, 'armF_lo', -0.2 * k); add(A, 'armB_lo', -0.2 * k);
    q.dy = (q.dy || 0) - Math.abs(sn) * 7 * k;
  }
  // salut / inclinaison du buste aux hanches : jambes gardées verticales, pieds au même endroit
  function courbe(q, th) {
    if (!th) return; q.tilt = (q.tilt || 0) + th; add(q.ang, 'legF', -th); add(q.ang, 'legB', -th);
    q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
  }
  // assis : hanche abaissée de 118, cuisses à l'horizontale, tibias verticaux, pieds à plat
  function seat(q, k) {
    if (!(k > 0)) return; const A = q.ang; q.dy = (q.dy || 0) + 118 * k;
    add(A, 'legF', -1.57 * k); add(A, 'legF_lo', 1.57 * k); add(A, 'legB', -1.45 * k); add(A, 'legB_lo', 1.45 * k);
  }
  function finish(q) {
    const A = q.ang, tl = (q.tilt || 0) - (q._lieA || 0);
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)));
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  // corps couché / posé au sol : rotation écran autour des pieds puis remontée pour que le point le plus bas touche le plancher (y)
  function partPoly(def, q, mats, sauf) {
    const out = [];
    for (const n in def.parts) {
      const p = def.parts[n]; if (q.hide && q.hide[n]) continue; if (/^objet|^doigts/.test(n)) continue; if (sauf && sauf.includes(n)) continue;
      const pts = typeof p.pts === 'function' ? p.pts(q) : p.pts; if (!pts || pts === OFFP || pts.length < 3) continue;
      for (const v of pts) out.push(mp(mats[n], v));
    }
    return out;
  }
  function solMatrix(def, q, x, y, s, dir, a) {
    const c = cx_(), rs = -dir * a;
    const R0 = new DOMMatrix().translate(x, y).rotate(rs * D).translate(-x, -y);
    c.save(); c.setTransform(R0); const mats = M.partMatrices(def, q, x, y, s, dir).mats; c.restore();
    let my = -1e9; for (const v of partPoly(def, q, mats)) my = Math.max(my, v[1]);
    return new DOMMatrix().translate(0, y - my).multiply(R0);
  }
  function run(def, q, x, y, s, o) {
    o = Object.assign({ slot: M.ST.slotF }, o || {}); const dir = o.dir || 1, c = cx_();
    let r;
    if (q._sol) {
      const R = solMatrix(def, q, x, y, s, dir, q._lieA || 0), lie = (q._lieA || 0) > 0.35 || q._sansTige;
      c.save(); c.setTransform(c.getTransform().multiply(R));
      r = M.puppet(def, q, x, y, s, Object.assign({}, o, lie ? { rod: false, floorShadow: false } : {}));
      if (lie && !SIL()) { const m = r.mats.torso; c.setTransform(m); M.rivet(def.rod.at[0], def.rod.at[1] - 6, 3); }
      c.restore();
      r.R = R;
    } else r = M.puppet(def, q, x, y, s, o);
    r.q = q; r.def = def; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }

  // ================================================================== CORPS : constructeur commun (profil, regard vers +x)
  const scaleP = (pts, kx, ky) => pts.map((p) => (p[2] ? [p[0] * kx, p[1] * (ky == null ? kx : ky), 1] : [p[0] * kx, p[1] * (ky == null ? kx : ky)]));
  const lens = (x, y0, y1, w, col) => fillPts([[x, y0], [x + w, (y0 + y1) / 2], [x, y1], [x - w, (y0 + y1) / 2]], col);
  function upDef(at, cfg, back, seed) {
    const S = cfg.manche;
    return { parent: 'torso', at, pts: sleeve(LA, S.wt, S.wm), base: back ? S.colB : S.col, seed, paint: (p) => { if (S.paint) S.paint(back, p); hatch([[-30, -20], [-4, -20], [-4, 100], [-30, 100]], 0.9, 3.8, back ? 0.36 : 0.26); if (back) shade(0, 0, 0, 90, 0.18); } };
  }
  function foreDef(cfg, back, seed) {
    const F = cfg.avantBras, hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(hk(p)), base: back ? F.colB : F.col, seed, paint: (p) => {
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], back ? cfg.peauD : cfg.peau); X.handPaint(null, hk(p));
      if (F.paint) F.paint(back, p);
      if (F.poignet) { fillPts([[-13, 64], [-6, 61], [0, 65], [6, 61], [13, 64], [14, 79], [8, 75], [3, 80], [-3, 76], [-8, 80], [-13, 77]], back ? M.mixc(F.poignet, '#000000', 0.18) : F.poignet); strokePts([[-12, 66], [12, 66]], 'rgba(120,100,70,0.5)', 1); }
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.32 : 0.22);
    } };
  }
  function legDefs(cfg, back, seed) {
    const L = cfg.jambe, col = back ? (L.colB || M.mixc(L.col, '#000000', 0.2)) : L.col, sh = back ? M.mixc(L.soulier, '#000000', 0.25) : L.soulier;
    const nm = back ? 'legB' : 'legF';
    return {
      [nm]: { parent: 'torso', at: back ? [-6, -2] : [6, -2], pts: thighPts(L.th || 0.95), base: col, seed, noRivet: !!back, paint: () => {
        if (L.cuisse) L.cuisse(back); if (L.jarretiere) fillPts([[-20, 92], [20, 92], [19, 100], [-19, 100]], back ? M.mixc(L.jarretiere, '#000000', 0.25) : L.jarretiere);
        hatch(back ? null : [[-24, -20], [-6, -20], [-6, 130], [-24, 130]], 0.8, back ? 3.6 : 4, back ? 0.32 : 0.24);
      } },
      [nm + '_lo']: { parent: nm, at: [0, 112], pts: shinPts(L.pied), base: col, seed: seed + 1, paint: () => {
        fillPts([[-30, L.pied === 'ours' ? 95 : 102, 1], [70, L.pied === 'ours' ? 95 : 102, 1], [70, 130, 1], [-30, 130, 1]], sh);
        if (L.pied === 'ours') { for (const x of [22, 32, 42]) strokePts([[x, 101], [x + 4, 116]], back ? 'rgba(160,150,120,0.5)' : 'rgba(232,220,192,0.85)', 2); fillPts(rect(-20, 121, 60, 126), '#141010'); }
        else fillPts(rect(-20, 121, 50, 126), '#141010');
        if (L.mollet) L.mollet(back);
        hatch(back ? null : [[-24, -20], [-6, -20], [-6, 100], [-24, 100]], 0.8, back ? 3.6 : 4, back ? 0.32 : 0.24);
      } },
    };
  }
  function headPaint(cfg) {
    return (p) => {
      const f = p.face || {};
      if (cfg.tetePaint) cfg.tetePaint(f, p);
      hatch([[-24, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
      dot(cfg.joueX || 14, cfg.joueY || -34, cfg.joueR || 8, cfg.joue || 'rgba(205,130,110,0.22)');
      if (!cfg.sansOreille) X.earPaint(-8, -44);
      X.brow(f, 17, -61, cfg.sourcil || 'rgba(45,30,22,0.95)', cfg.sourcilLw || 2.6); X.eye(f, 17, -52, cfg.oeil || 1);
      if (cfg.bouche) cfg.bouche(f); else X.mouth(f, 27, -27);
    };
  }
  // cfg : seed, torso / torsoA (assis), torsoPaint(p), manche{wt,wm,col,colB,paint}, avantBras{col,colB,poignet,paint}, jambe{…} | sansJambes,
  //       tete{pts}, peau, peauD, pieces (après le torse) [{nom, parent, at, pts, base, paint, extra, rest, avant:true = devant le bras avant}], derriere (avant la tête)
  function mkPerso(cfg) {
    const parts = {
      torso: { parent: null, at: [0, 0], base: cfg.habit, seed: cfg.seed, pts: (p) => (p.assis && cfg.torsoA ? cfg.torsoA : (typeof cfg.torso === 'function' ? cfg.torso(p) : cfg.torso)), paint: (p) => { cfg.torsoPaint(p); } },
      armB_up: upDef(SH_B, cfg, true, cfg.seed + 4),
      armB_lo: foreDef(cfg, true, cfg.seed + 5),
      head: { parent: 'torso', at: cfg.cou || [6, -170], pts: cfg.tete, base: cfg.peau, seed: cfg.seed + 7, noRivet: true, paint: headPaint(cfg) },
      armF_up: upDef(SH_F, cfg, false, cfg.seed + 9),
      armF_lo: foreDef(cfg, false, cfg.seed + 10),
    };
    if (!cfg.sansJambes) { Object.assign(parts, legDefs(cfg, true, cfg.seed + 2), legDefs(cfg, false, cfg.seed + 12)); }
    const pre = [], post = [], front = [], armExtraF = [], armExtraB = [];
    for (const pz of cfg.pieces || []) {
      parts[pz.nom] = { parent: pz.parent, at: pz.at || [0, 0], pts: pz.pts, base: pz.base, paint: pz.paint, extra: pz.extra, rest: pz.rest || 0, seed: cfg.seed + 30 + pre.length + post.length + front.length, noRivet: true, texA: pz.texA };
      (pz.ou === 'derriere' ? pre : pz.ou === 'devant' ? front : pz.ou === 'brasF' ? armExtraF : pz.ou === 'brasB' ? armExtraB : post).push(pz.nom);
    }
    Object.assign(parts, heldParts(cfg.peau, cfg.seed + 20));
    const legs = cfg.sansJambes ? [] : ['legB', 'legB_lo', 'legF', 'legF_lo'];
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, libre: cfg.libre,
      order: ['armB_up', 'armB_lo', ...armExtraB, 'objetB', 'doigtsB0', ...legs, ...pre, 'head', 'torso', ...post, ...front, 'armF_up', 'armF_lo', ...armExtraF, 'objet', 'doigts', 'doigtsB'] };
  }

  // ================================================================== FRANÇOIS Ier : grand, mince, nez busqué, grande plume blanche, bleu nuit
  const FR_HEAD = [[-14, 16], [10, 16], [11, 2], [18, -4], [26, -8], [30, -15], [29, -21], [31, -25], [30, -29], [34, -31], [44, -33], [52, -37, 1], [50, -43], [44, -50], [36, -56], [31, -62], [28, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const FR_T = (low) => [[-12, -178], [8, -182], [18, -170], [26, -150], [30, -118], [32, -80], [30, -40], [26, -12], [32, 10], [38, low * 0.55], [42, low, 1], [-38, low + 2, 1], [-34, low * 0.55], [-30, 10], [-28, -20], [-30, -80], [-32, -120], [-30, -150], [-24, -168]];
  const FRANCOIS = {
    seed: 1100, habit: NUIT, peau: PEAU, peauD: PEAUD, cou: [6, -174], tete: FR_HEAD,
    torso: FR_T(74), torsoA: FR_T(34),
    torsoPaint: (p) => {
      fillPts([[6, -182], [18, -170], [25, -152], [12, -150], [3, -168]], IVO); strokePts([[8, -176], [14, -156]], 'rgba(150,135,100,0.6)', 1);
      for (const [x, y0, y1] of [[-14, -138, -98], [0, -140, -98], [14, -134, -96], [-14, -86, -46], [0, -86, -44], [14, -82, -44]]) { lens(x, y0, y1, 4.2, IVO); dot(x, y0, 1.8, ORL); dot(x, y1, 1.8, ORL); }
      strokePts([[22, -160], [28, -118], [30, -80], [28, -40], [24, -12]], OR, 3.4);
      fillPts([[-30, -16], [28, -16], [28, -6], [-30, -6]], OR); dot(20, -11, 3, ORD);
      for (const x of [-26, -12, 2, 16, 30]) strokePts([[x * 0.9, 0], [x, 68]], 'rgba(10,14,30,0.55)', 1.6);
      strokePts([[-38, 70], [42, 70]], OR, 4);
      hatch([[-60, -170], [-10, -170], [-10, 80], [-60, 80]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.26);
    },
    manche: { wt: 17, wm: 24, col: NUIT, colB: NUITD, paint: (b) => { for (const x of [-10, 2, 13]) lens(x, 6, 50, 4, b ? IVOD : IVO); strokePts([[-20, 60], [20, 58]], b ? ORD : OR, 3.4); } },
    avantBras: { col: NUIT, colB: NUITD, poignet: IVO },
    jambe: { th: 0.9, col: '#e4d8ba', colB: '#bfb294', soulier: '#2a2220', pied: 'ours', jarretiere: OR },
    sourcil: 'rgba(52,34,22,0.95)', sourcilLw: 2.8,
    tetePaint: () => { fillPts([[34, -54], [46, -40], [40, -38]], 'rgba(160,100,80,0.25)'); strokePts([[35, -33], [40, -35]], 'rgba(90,50,40,0.6)', 1.2); },
    bouche: (f) => X.mouth(f, 27, -23),
    pieces: [
      { nom: 'cheveux', parent: 'head', pts: [[-2, -97], [-22, -93], [-35, -76], [-38, -52], [-36, -28], [-28, -18], [-18, -20], [-17, -34], [-12, -54], [2, -76], [18, -88]], base: '#3a2a1e', paint: () => { for (let i = 0; i < 6; i++) strokePts([[-30 + i * 5, -84 + i * 2], [-34 + i * 4, -26]], 'rgba(20,12,8,0.5)', 1); hatch(null, 1.2, 3, 0.2); } },
      { nom: 'barbe', parent: 'head', pts: [[-14, -34], [-6, -27], [6, -19], [18, -14], [27, -15], [31, -10], [34, -2], [38, 11, 1], [28, 9], [14, 6], [0, 0], [-10, -10], [-17, -24]], base: '#3a2a1e', paint: () => { for (let x = -8; x < 34; x += 5) strokePts([[x, -16 + Math.abs(x - 14) * 0.15], [x + 3, 2]], 'rgba(15,8,4,0.45)', 1); } },
      { nom: 'moustache', parent: 'head', pts: [[27, -31], [36, -32], [40, -28], [34, -27], [29, -25], [22, -24]], base: '#3a2a1e' },
      { nom: 'toque', parent: 'head', at: [-2, -90], rest: 0.14, pts: TOQUE_F, base: '#16161a', paint: toqueFPaint },
      { nom: 'plume', parent: 'toque', pts: PLUME_F, base: '#f4f1e8', paint: plumePaint },
      { nom: 'chaineCou', parent: 'torso', ou: 'brasF', pts: OFFP, base: '#000', extra: (p) => {                    // chaîne d'or portée : sur l'épaule, par-dessus la manche
        if (!p.porteChaine || SIL()) return;
        const P_ = cbez([-16, -182], [-4, -150], [14, -118], [32, -108], 14);
        for (let i = 0; i < P_.length; i++) { const q = P_[i]; fillPts(ell(q[0], q[1], i % 2 ? 3.2 : 5, i % 2 ? 2.2 : 3.4, 6), i % 2 ? ORD : OR); strokePts(ell(q[0], q[1], i % 2 ? 3.2 : 5, i % 2 ? 2.2 : 3.4, 6).concat([[q[0] + (i % 2 ? 3.2 : 5), q[1]]]), 'rgba(70,50,10,0.7)', 0.8); }
        fillPts(ell(34, -94, 10, 10, 12), OR); strokePts(ep(34, -94, 6, 6, 12, 0, TAU), ORD, 1.4); strokePts([[29, -99], [32, -102]], 'rgba(255,245,200,0.8)', 1.4);
      } },
    ],
  };
  CH.dorFrancois = mkPerso(FRANCOIS);

  // ================================================================== HENRI VIII : large, carré, barbe rousse, cramoisi et fourrure, toque plate basse
  const HE_HEAD = scaleP([[-18, 18], [14, 18], [16, 4], [24, -2], [30, -8], [32, -16], [30, -22], [32, -26], [31, -30], [34, -34], [38, -40, 1], [34, -46], [31, -56], [31, -64], [28, -78], [16, -93], [-6, -98], [-26, -90], [-38, -70], [-39, -46], [-33, -24], [-23, -6]], 1.06);
  const HE_T = (low, b) => [[-16, -184], [12, -188], [30, -178], [52, -162], [68 + b * 0.3, -136], [78 + b, -98], [80 + b, -56], [76, -16], [78, 30], [82, low * 0.7], [84, low, 1], [-82, low + 3, 1], [-80, low * 0.6], [-76, 20], [-74, -40], [-78, -100], [-80, -140], [-70, -168], [-40, -184]];
  const HENRI = {
    seed: 1200, habit: CRAM, peau: '#e8bf9c', peauD: '#cf9f7c', tete: HE_HEAD,
    torso: (p) => HE_T(112, 8 * clamp(p.bombe || p._bombe || 0)), torsoA: HE_T(40, 0),
    torsoPaint: (p) => {
      const b = 8 * clamp(p.bombe || p._bombe || 0);
      fillPts([[20, -180], [44, -162], [58, -136], [62, -96], [62, -54], [58, -16], [30, -16], [26, -60], [22, -120], [14, -164]], '#a3362f');
      for (let row = 0; row < 6; row++) for (const x of [34, 48]) { const y = -150 + row * 22 + (x === 48 ? 10 : 0); lens(x, y, y + 14, 3.2, ORL); }
      const FUR_F = [[22, -184], [40, -176], [58, -160], [74, -134], [84 + b, -98], [86 + b, -56], [82, -16], [84, 30], [88, 80], [90, 118], [62, 118], [60, 80], [58, 30], [58, -16], [62, -56], [62, -96], [56, -128], [42, -152], [24, -170]];
      const FUR_B = [[-44, -188], [-16, -194], [6, -190], [-4, -174], [-30, -168], [-54, -152], [-70, -128], [-76, -96], [-80, -60], [-88, -58], [-90, -100], [-86, -142], [-74, -170]];
      fillPts(frange(FUR_F, 2.6, 5), FOUR); fillPts(frange(FUR_B, 2.6, 5), FOUR);
      for (let i = 0; i < 90; i++) { const u = hash(i * 7.3), v = hash(i * 3.1 + 2), x = lerp(-88, 88, u), y = lerp(-190, 116, v); if (x > -60 && x < 58) continue; if (x <= -60 && y > -60) continue; strokePts([[x, y], [x + 2, y + 6]], i % 2 ? FOURL : '#3e2a1a', 1.4); }
      chaineCou(-30, -178, 62, -110, 34, 24); chaineCou(-20, -172, 54, -134, 20, 18);
      pc(ell(54, -98, 11, 13, 12), OR, () => dot(54, -98, 4.4, '#7a1a2a'), 1290);
      fillPts([[-82, 100], [84, 100], [84, 116], [-82, 118]], FOUR);
      hatch([[-96, -190], [-14, -190], [-14, 120], [-96, 120]], 0.75, 4.2, 0.32); shade(70, 0, -70, 0, 0.26);
    },
    manche: { wt: 27, wm: 37, col: CRAM, colB: CRAMD, paint: (bk) => { for (const [x, y] of [[-16, 10], [-4, 4], [8, 10], [18, 18], [-14, 38], [0, 34], [14, 40], [-6, 58], [8, 62]]) lens(x, y, y + 16, 3.6, bk ? ORD : ORL); strokePts([[-24, 70], [22, 70]], bk ? ORD : OR, 3.2); } },
    avantBras: { col: CRAM, colB: CRAMD, poignet: '#f2ece0', paint: (bk) => { for (const y of [14, 36]) lens(0, y, y + 14, 3, bk ? ORD : ORL); } },
    jambe: { th: 1.04, col: '#7a2424', colB: '#561a1a', soulier: '#2a1a1a', jarretiere: OR },
    sourcil: 'rgba(150,80,30,0.95)', sourcilLw: 2.6, joue: 'rgba(214,110,90,0.35)', joueR: 11, joueX: 12, joueY: -36, oeil: 0.92,
    tetePaint: () => { fillPts([[2, -6], [24, -4], [16, 10], [0, 12]], 'rgba(200,140,110,0.3)'); },
    bouche: (f) => X.mouth(f, 28, -26, 'rgba(120,40,38,0.95)'),
    pieces: [
      { nom: 'cheveux', parent: 'head', pts: [[-4, -94], [-26, -90], [-40, -72], [-42, -48], [-38, -28], [-28, -24], [-24, -40], [-16, -64], [2, -80]], base: '#b5652a', paint: () => { for (let i = 0; i < 6; i++) strokePts([[-36 + i * 5, -80 + i * 3], [-38 + i * 4, -30]], 'rgba(110,50,15,0.5)', 1.1); } },
      { nom: 'barbe', parent: 'head', pts: frange([[-26, -42], [-14, -38], [-4, -32], [10, -25], [22, -21], [31, -22], [35, -15], [36, -4], [31, 8], [19, 17], [2, 19], [-14, 11], [-24, -6], [-30, -26]], 1.6, 4), base: '#b5652a', paint: () => { for (let x = -22; x < 34; x += 4) strokePts([[x, -20 + Math.abs(x - 6) * 0.1], [x + 2, 8]], 'rgba(110,45,12,0.45)', 1); shade(0, -30, 0, 18, 0.2); } },
      { nom: 'moustache', parent: 'head', pts: [[28, -35], [37, -35], [40, -30], [34, -29], [28, -27], [22, -28]], base: '#b5652a' },
      { nom: 'toque', parent: 'head', at: [-3, -92], rest: -0.03, pts: TOQUE_H, base: '#141418', paint: toqueHPaint, extra: () => toqueHExtra() },
    ],
  };
  CH.dorHenri = mkPerso(HENRI);

  // ================================================================== CHARLES QUINT : maigre, droit, menton très en avant, tout en noir
  const CQ_HEAD = [[-12, 16], [8, 16], [10, 6], [24, 4], [38, 2], [45, -5, 1], [43, -12], [37, -16], [32, -20], [32, -25], [30, -29], [32, -33], [36, -40, 1], [32, -47], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-32, -68], [-31, -46], [-24, -28], [-16, -8]];
  const CQ_T = (low) => [[-12, -178], [8, -182], [16, -170], [24, -150], [28, -118], [30, -80], [28, -40], [24, -8], [28, 20], [32, low, 1], [-32, low + 2, 1], [-28, 20], [-26, -20], [-28, -80], [-30, -120], [-28, -150], [-22, -168]];
  const CAPE = [[-22, -176], [-4, -180], [4, -164], [-2, -130], [-8, -80], [-12, -30], [-14, -6], [-52, -2, 1], [-50, -50], [-46, -110], [-40, -156]];
  const CHARLES = {
    seed: 1300, habit: NOIR, peau: '#e8d2b4', peauD: '#cdb393', tete: CQ_HEAD,
    torso: CQ_T(52), torsoA: CQ_T(30),
    torsoPaint: () => {
      fillPts([[4, -182], [16, -172], [14, -166], [4, -174]], '#f2ece0');
      for (let y = -150; y < 10; y += 18) dot(25, y, 1.8, '#4a4a54');
      strokePts([[24, -150], [28, -80], [24, -8]], 'rgba(90,90,110,0.6)', 1.4);
      fillPts([[-28, -14], [26, -14], [26, -8], [-28, -8]], '#2c2c34');
      chaineCou(-14, -176, 24, -160, 26, 14);
      hatch([[-60, -170], [-10, -170], [-10, 80], [-60, 80]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.22, undefined, '120,120,140');
    },
    manche: { wt: 15, wm: 18, col: '#26262c', colB: '#18181c', paint: (b) => strokePts([[-12, 30], [12, 30]], b ? '#202024' : '#3a3a44', 1.6) },
    avantBras: { col: '#26262c', colB: '#18181c', poignet: '#ece6da' },
    jambe: { th: 0.82, col: '#202026', colB: '#141418', soulier: '#141414' },
    sourcil: 'rgba(110,80,50,0.9)', sourcilLw: 2.2, joue: 'rgba(200,140,120,0.12)',
    bouche: (f) => { if ((f.mouth || 'n') === 'n') { fillPts([[26, -24], [32, -23], [35, -19], [27, -19]], '#4a1c18'); strokePts([[37, -16], [27, -17]], 'rgba(150,70,60,0.9)', 2); } else X.mouth(f, 30, -21); },
    tetePaint: () => { fillPts([[20, -2], [42, -3], [44, -10], [28, -12]], 'rgba(180,140,110,0.3)'); strokePts([[34, -15], [42, -10]], 'rgba(120,80,60,0.6)', 1.2); },
    pieces: [
      { nom: 'cape', parent: 'torso', pts: CAPE, base: '#2a2a32', paint: () => { for (const x of [-20, -32, -42]) strokePts([[x + 6, -150], [x, -6]], 'rgba(0,0,0,0.5)', 1.4); hatch(null, 0.8, 3.6, 0.25); } },
      { nom: 'cheveux', parent: 'head', pts: [[31, -64, 1], [28, -80], [14, -95], [-6, -101], [-26, -93], [-37, -72], [-39, -46], [-39, -26, 1], [-6, -26, 1], [-4, -44], [6, -56], [12, -64, 1]], base: '#9a7a52', paint: () => { for (let x = -36; x < 30; x += 5) strokePts([[x, -96 + Math.abs(x) * 0.3], [x - 1, x < -4 ? -28 : -64]], 'rgba(70,50,30,0.45)', 1); } },
      { nom: 'barbe', parent: 'head', pts: [[-6, -28], [6, -20], [22, -6], [34, -3], [44, -4], [44, 2], [36, 7], [14, 8], [0, -2], [-8, -14]], base: 'rgba(154,122,82,0.7)', texA: 0.3, paint: () => { for (let x = -4; x < 36; x += 3) dot(x, -4 + (x % 2) * 2, 0.9, 'rgba(90,65,40,0.7)'); } },
      { nom: 'toque', parent: 'head', at: [-3, -92], rest: 0.04, pts: [[-36, 7], [-33, -4], [-12, -12], [14, -12], [32, -4], [36, 5, 1], [0, 8]], base: '#121216', paint: () => { strokePts([[-32, 3], [34, 3]], 'rgba(90,90,100,0.6)', 1.2); hatch(null, 0.9, 3.2, 0.2); } },
    ],
  };
  CH.dorCharles = mkPerso(CHARLES);

  // ================================================================== TROIS COURTISANS
  const CA_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [27, -16], [26, -22], [28, -26], [27, -30], [30, -34], [34, -39, 1], [31, -46], [28, -56], [28, -64], [25, -78], [13, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const COURT_A = {
    seed: 1400, habit: VERT, peau: '#ecc9a4', peauD: '#d2ab86', tete: CA_HEAD,
    torso: FR_T(60).map((p) => [p[0] * 1.08, p[1], p[2]]), torsoA: FR_T(30),
    torsoPaint: () => {
      fillPts([[6, -182], [18, -170], [24, -154], [10, -156]], IVO);
      strokePts([[22, -160], [30, -100], [28, -16]], '#c9b48a', 2.4); fillPts([[-32, -16], [30, -16], [30, -8], [-32, -8]], '#3a2a1a');
      for (const x of [-20, -4, 12]) strokePts([[x, 0], [x * 1.1, 58]], 'rgba(20,35,20,0.5)', 1.5);
      hatch([[-60, -170], [-10, -170], [-10, 80], [-60, 80]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.24);
    },
    manche: { wt: 16, wm: 21, col: VERT, colB: '#3c5238', paint: (b) => { for (const x of [-6, 6]) lens(x, 10, 44, 3.4, b ? '#a89a7a' : '#d8c8a0'); } },
    avantBras: { col: VERT, colB: '#3c5238', poignet: IVO },
    jambe: { th: 0.92, col: '#a8803a', colB: '#7e6028', soulier: '#2a2018' },
    sourcil: 'rgba(150,120,60,0.9)', joue: 'rgba(220,130,110,0.3)',
    pieces: [
      { nom: 'cheveux', parent: 'head', pts: [[22, -84], [12, -95], [-6, -101], [-26, -94], [-38, -74], [-40, -46], [-38, -20, 1], [-20, -18, 1], [-18, -36], [-14, -58], [2, -76], [16, -80]], base: '#d4b26a', paint: () => { for (let x = -36; x < 16; x += 5) strokePts([[x + 6, -94], [x, -22]], 'rgba(150,110,40,0.45)', 1); } },
      { nom: 'toque', parent: 'head', at: [-6, -90], rest: -0.1, pts: [[-40, 4], [-46, -10], [-34, -24], [-4, -30], [26, -22], [40, -8], [38, 4, 1]], base: CRAM, paint: () => { strokePts([[-40, -2], [38, -2]], 'rgba(60,10,10,0.6)', 1.6); dot(30, -6, 3, OR); hatch(null, 0.9, 3.2, 0.22); } },
    ],
  };
  CH.dorCourtA = mkPerso(COURT_A);

  const DA_HEAD = [[-12, 16], [9, 16], [10, 2], [15, -6], [22, -10], [25, -15], [24, -21], [26, -25], [25, -29], [28, -33], [32, -38, 1], [29, -45], [27, -55], [27, -64], [24, -78], [12, -91], [-6, -96], [-23, -87], [-31, -68], [-30, -46], [-23, -28], [-16, -8]];
  const DA_T = [[-12, -176], [8, -180], [16, -168], [24, -150], [30, -122], [28, -86], [22, -46], [24, -10], [40, 60], [58, 150], [72, 234, 1], [-66, 236, 1], [-58, 150], [-44, 60], [-32, -10], [-26, -46], [-28, -96], [-30, -132], [-28, -152], [-22, -168]];
  const SLEEVE_W = [[-14, 30], [14, 30], [30, 70], [34, 84, 1], [-6, 82], [-22, 70]];
  const DAME_B = {
    seed: 1500, habit: OCRE, peau: '#efcfae', peauD: '#d4b090', tete: DA_HEAD, sansJambes: true,
    torso: (p) => { const w = p.marche ? 6 * Math.sin((p.t || 0) * 7.2) : 0; return DA_T.map((q, i) => (i >= 8 && i <= 13 ? [q[0] + w * (q[1] / 236), q[1], q[2]] : q)); },
    torsoPaint: () => {
      fillPts([[4, -180], [16, -168], [24, -150], [16, -146], [6, -160]], '#f2ece0');
      fillPts([[-28, -150], [24, -150], [24, -144], [-28, -144]], '#2a1e16'); strokePts([[-26, -147], [22, -147]], OR, 1.6);
      fillPts([[-30, -14], [24, -14], [26, -6], [-32, -6]], '#6e4a20');
      for (const x of [-50, -30, -10, 10, 30, 50]) strokePts([[x * 0.4, 0], [x, 228]], 'rgba(90,55,20,0.45)', 1.6);
      fillPts([[22, -10], [40, 60], [58, 150], [72, 232], [56, 232], [40, 150], [26, 60], [14, -8]], '#8c5a24');
      hatch([[-70, -170], [-10, -170], [-10, 240], [-70, 240]], 0.75, 4.2, 0.28); shade(40, 0, -40, 0, 0.22);
    },
    manche: { wt: 15, wm: 18, col: OCRE, colB: '#8c5f28' },
    avantBras: { col: OCRE, colB: '#8c5f28', poignet: '#f2ece0' },
    sourcil: 'rgba(90,50,30,0.85)', sourcilLw: 2, joue: 'rgba(225,120,110,0.32)',
    bouche: (f) => X.mouth(f, 25, -25, 'rgba(150,50,50,0.95)'),
    pieces: [
      { nom: 'voile', parent: 'head', ou: 'derriere', pts: [[-20, -90], [-44, -78], [-54, -40], [-56, 10], [-50, 52], [-36, 60, 1], [-26, 20], [-22, -30]], base: '#16161a', paint: () => { for (const x of [-46, -38]) strokePts([[x + 6, -70], [x, 54]], 'rgba(80,80,90,0.5)', 1.2); } },
      { nom: 'cheveux', parent: 'head', pts: [[26, -66], [22, -78], [8, -88], [-8, -88], [-8, -80], [6, -76], [18, -70]], base: '#7a4424' },
      { nom: 'coiffe', parent: 'head', pts: [[22, -76], [16, -92], [0, -104], [-20, -104], [-38, -90], [-46, -66], [-44, -40], [-30, -34], [-26, -56], [-16, -76], [0, -84], [12, -80]], base: '#16161a', paint: () => { strokePts([[22, -76], [16, -92], [0, -104], [-20, -104], [-38, -90]], OR, 3.4); for (let i = 0; i < 9; i++) { const a = -0.3 - i * 0.22; dot(-10 + Math.cos(a - 1.2) * 30, -78 + Math.sin(a - 1.2) * 26, 1.6, ORL); } strokePts([[18, -78], [6, -88], [-12, -92]], 'rgba(240,230,210,0.7)', 2); } },
      { nom: 'mancheF', parent: 'armF_lo', ou: 'brasF', pts: SLEEVE_W, base: OCRE, paint: () => { fillPts([[-6, 78], [30, 70], [34, 84], [-6, 84]], '#6e4a20'); strokePts([[-14, 34], [14, 34]], OR, 2); hatch(null, 0.9, 3.6, 0.22); } },
      { nom: 'mancheB', parent: 'armB_lo', ou: 'brasB', pts: SLEEVE_W, base: '#8c5f28', paint: () => { fillPts([[-6, 78], [30, 70], [34, 84], [-6, 84]], '#4e3416'); hatch(null, 0.9, 3.6, 0.3); } },
    ],
  };
  CH.dorDameB = mkPerso(DAME_B);

  const CC_T = [[-14, -178], [8, -182], [18, -170], [28, -150], [36, -116], [38, -70], [38, -20], [42, 60], [46, 140], [48, 214, 1], [-46, 216, 1], [-44, 140], [-42, 60], [-40, -20], [-40, -80], [-40, -130], [-36, -156], [-26, -170]];
  const COURT_C = {
    seed: 1600, habit: '#24242a', peau: '#e2c4a6', peauD: '#c6a686', tete: CA_HEAD,
    torso: CC_T, torsoA: CC_T,
    torsoPaint: () => {
      for (const x of [-30, -14, 4, 22]) strokePts([[x * 0.8, -60], [x, 210]], 'rgba(0,0,0,0.5)', 1.6);
      fillPts(frange([[-36, -176], [-8, -188], [18, -182], [32, -160], [38, -120], [36, -40], [36, 60], [40, 212], [24, 212], [20, 60], [18, -40], [20, -120], [10, -160], [-12, -166], [-34, -160], [-44, -150]], 2.4, 5), '#6a4a30');
      for (let i = 0; i < 40; i++) { const x = lerp(-40, 36, hash(i * 5.1)), y = lerp(-186, 210, hash(i * 2.7 + 1)); if (x < 16 && y > -150) continue; strokePts([[x, y], [x + 2, y + 5]], i % 2 ? '#8a6a48' : '#4a3220', 1.3); }
      hatch([[-60, -170], [-14, -170], [-14, 220], [-60, 220]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.22, undefined, '120,120,140');
    },
    manche: { wt: 18, wm: 24, col: '#24242a', colB: '#18181c', paint: () => strokePts([[-18, 40], [18, 40]], 'rgba(0,0,0,0.4)', 1.4) },
    avantBras: { col: '#24242a', colB: '#18181c', poignet: '#6a4a30' },
    jambe: { th: 0.85, col: '#24242a', colB: '#18181c', soulier: '#1c1612' },
    sourcil: 'rgba(170,170,165,0.95)', sourcilLw: 3,
    tetePaint: () => { strokePts([[6, -46], [12, -40]], 'rgba(90,60,50,0.45)', 1); strokePts([[16, -70], [26, -72]], 'rgba(90,60,50,0.4)', 1); strokePts([[-2, -62], [8, -66]], 'rgba(90,60,50,0.3)', 1); },
    pieces: [
      { nom: 'cheveux', parent: 'head', pts: [[-6, -96], [-26, -90], [-37, -70], [-38, -42], [-32, -22], [-20, -24], [-16, -44], [-8, -64], [8, -80]], base: '#b9b6ae' },
      { nom: 'barbe', parent: 'head', pts: [[-16, -40], [-6, -30], [8, -22], [22, -18], [30, -20], [34, -10], [36, 12], [32, 30, 1], [6, 30, 1], [-6, 14], [-14, -10], [-20, -28]], base: '#c9c6be', paint: () => { for (let x = -10; x < 34; x += 4) strokePts([[x, -14], [x + 1, 28]], 'rgba(120,118,110,0.55)', 1); } },
      { nom: 'moustache', parent: 'head', pts: [[24, -33], [33, -33], [36, -27], [30, -26], [22, -26]], base: '#d6d3cc' },
      { nom: 'toque', parent: 'head', at: [-4, -92], rest: 0, pts: [[-36, 8, 1], [-37, -10], [-34, -26, 1], [-12, -30], [12, -30], [34, -26, 1], [37, -10], [36, 8, 1]], base: '#121216', paint: () => { strokePts([[-36, 2], [36, 2]], 'rgba(90,90,100,0.6)', 1.2); strokePts([[0, -20], [0, 6]], 'rgba(70,70,80,0.6)', 1.2); hatch(null, 0.9, 3.2, 0.2); } },
    ],
  };
  CH.dorCourtC = mkPerso(COURT_C);

  // ================================================================== GESTES
  const ECH = { francois: 0.93, henri: 0.91, charles: 0.9, courtA: 0.86, dameB: 0.84, courtC: 0.86 };
  DOR.ECH = ECH;
  function base(q, def, t) {
    if (q.toque === false) { q.hide.toque = 1; q.hide.plume = 1; }
    seat(q, ease(clamp(q.assis || 0)));
    if (q.assis && ease(clamp(q.assis)) > 0.5) {                                     // mains posées sur les cuisses par défaut
      if (q.ang.armB_up == null && !q._mainB) { armTo(q, 'armB', [70, -12], 1); if (q.handB == null) q.handB = 'open'; }
      if (q.ang.armF_up == null && !q._mainF) { armTo(q, 'armF', [84, -16], 1); if (q.handF == null) q.handF = 'open'; }
    }
    marche(q, q.marche ? 1 : 0, t);
  }
  // pré-analyse : quelles mains les gestes vont prendre (pour ne pas poser les mains sur les cuisses)
  const usesF = (q, names) => names.some((n) => q[n] != null && q[n] !== false && q[n] !== 0);
  function couche(q, k, A) { if (!(k > 0)) return; q._sol = true; q._lieA = (q._lieA || 0) + PI / 2 * k; }

  // ---- François
  DOR.francoisPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, t = q.t || 0, def = CH.dorFrancois; x = x || 0; y = y || 0; s = s || ECH.francois; dir = dir || 1;
    const k = (n) => ease(clamp(q[n] || 0));
    q._mainF = q._mainB = usesF(q, ['balaie', 'fier', 'saluer', 'attrape', 'projette', 'chaine', 'couche']);
    base(q, def, t);
    const ba = k('balaie'); if (ba > 0) { const u = q.balayage == null ? 0.5 + 0.5 * Math.sin(t * 4.2) : clamp(q.balayage); armTo(q, 'armF', lp2([42, -168], [158, -110], u), ba); openH(q, 1); add(A, 'head', -0.1 * ba); faceDef(q, ba, { eyes: 'half', mouth: 'smile', brow: 'up' }); }
    const fi = k('fier'); if (fi > 0) { armTo(q, 'armF', [136, -196], fi); armTo(q, 'armB', [104, -96], fi); openH(q, 1, 1); add(A, 'head', -0.26 * fi); q.tilt = (q.tilt || 0) - 0.05 * fi; faceDef(q, fi, { mouth: 'smile', eyes: 'half' }); }
    const sa = k('saluer'); if (sa > 0) { courbe(q, 0.55 * sa); add(A, 'legB', 0.32 * sa); armTo(q, 'armF', [44, -118], sa); armTo(q, 'armB', [98, -22], sa); openH(q, 1, 1); add(A, 'head', 0.2 * sa); faceDef(q, sa, { eyes: 'closed', mouth: 'smile' }); }
    const at = k('attrape'); if (at > 0) { q.tilt = (q.tilt || 0) + 0.06 * at; add(A, 'legF', -0.16 * at); add(A, 'legF_lo', 0.16 * at); armTo(q, 'armF', cibleT(def, q, q.cible, x, y, s, dir, null, [134, -46]), at); armTo(q, 'armB', cibleT(def, q, q.cibleB, x, y, s, dir, null, [118, -34]), at); openH(q, 1, 1); faceDef(q, at, { brow: 'frown', mouth: 'smile' }); }
    const pr = k('projette'); if (pr > 0) { courbe(q, 0.32 * pr); add(A, 'legB', 0.2 * pr); armTo(q, 'armF', cibleT(def, q, q.cible, x, y, s, dir, null, [128, 14]), pr); armTo(q, 'armB', cibleT(def, q, q.cibleB, x, y, s, dir, null, [110, 24]), pr); openH(q, 1, 1); faceDef(q, pr, { brow: 'frown', mouth: 'tight' }); }
    const chn = q.chaine == null ? 0 : clamp(q.chaine);
    if (chn > 0) {
      if (chn < 0.8) { if (q.tenu == null) q.tenu = 'chaine'; q.deuxMains = true; } else q.porteChaine = true;
      const P1 = [98, -100], P2 = [112, -282], P3 = [40, -326], P4 = [64, -170];
      let T = P4, kk = 1;
      if (chn < 0.3) T = lp2(P1, P2, ease(chn / 0.3)); else if (chn < 0.5) T = lp2(P2, P3, ease((chn - 0.3) / 0.2)); else if (chn < 0.8) T = lp2(P3, P4, ease((chn - 0.5) / 0.3)); else kk = 1 - ease((chn - 0.8) / 0.2);
      armTo(q, 'armF', T, kk * Math.min(1, chn * 8));
      if (chn >= 0.8) { armTo(q, 'armB', [T[0] - 12, T[1] + 10], kk); openH(q, 1, 1); }
      add(A, 'head', -0.14 * Math.sin(PI * Math.min(1, chn / 0.8))); faceDef(q, 1, { mouth: 'smile' });
    }
    const co = k('couche'); if (co > 0) { couche(q, co, A); armTo(q, 'armF', [46, -60], co); armTo(q, 'armB', [36, -50], co); openH(q, 1, 1); faceDef(q, co, { eyes: 'half', mouth: 'tight' }); }
    return finish(q);
  };
  DOR.francois = (pose, x, y, s, o) => { s = s == null ? ECH.francois : s; const dir = (o && o.dir) || 1; return run(CH.dorFrancois, DOR.francoisPose(pose, x, y, s, dir), x, y, s, o); };

  // ---- Henri : clés de seRelever (0 au sol → 1/3 sur le flanc → 2/3 à genou → 1 debout)
  const HKEYS = [
    { lie: PI / 2, tilt: 0, ang: { armF_up: -0.35, armF_lo: -0.3, armB_up: -0.25, armB_lo: -0.3 } },
    { lie: 1.05, tilt: 0, ang: { legF: -1.0, legF_lo: 1.55, legB: -0.85, legB_lo: 1.6, armF_up: -1.1, armF_lo: -0.5, armB_up: -0.5, armB_lo: -0.9, head: 0.3 } },
    { lie: 0, tilt: 0.06, ang: { legF: -1.52, legF_lo: 1.52, legB: 0.05, legB_lo: 1.52, armF_up: -0.95, armF_lo: -0.55, armB_up: -0.6, armB_lo: -0.7, head: 0.05 } },
    { lie: 0, tilt: 0, ang: {} },
  ];
  DOR.henriPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, t = q.t || 0, def = CH.dorHenri; x = x || 0; y = y || 0; s = s || ECH.henri; dir = dir || 1;
    const k = (n) => ease(clamp(q[n] || 0));
    q._mainF = usesF(q, ['defie', 'coupe', 'bombe', 'auSol', 'seRelever', 'epousseter', 'vexe', 'signe', 'serreMain']);
    q._mainB = usesF(q, ['defie', 'bombe', 'auSol', 'seRelever', 'epousseter', 'signe']);
    base(q, def, t);
    const df = k('defie'); if (df > 0) { const w = Math.sin(t * 7) * 8; armTo(q, 'armF', [104, -128 + w], df); armTo(q, 'armB', [86, -116 - w], df); openH(q, 1, 1); add(A, 'head', -0.1 * df); faceDef(q, df, { brow: 'frown', mouth: 'smile' }); }
    if (q.coupe != null && q.coupe !== false) { const cp = ease(clamp(q.coupe)); if (q.tenu == null) q.tenu = 'coupe'; armTo(q, 'armF', lp2([88, -92], [98, -238], cp), 1); add(A, 'head', -0.12 * cp); faceDef(q, cp, { mouth: 'smile' }); }
    const bo = k('bombe'); if (bo > 0) { q._bombe = bo; q.tilt = (q.tilt || 0) - 0.07 * bo; add(A, 'head', -0.2 * bo); armTo(q, 'armF', [50, -30], bo); armTo(q, 'armB', [34, -22], bo); faceDef(q, bo, { eyes: 'half', mouth: 'tight' }); }
    const ep_ = k('epousseter'); if (ep_ > 0) { const w = Math.sin(t * 16); armTo(q, 'armF', [48 + 10 * w, -96 + 14 * w], ep_); armTo(q, 'armB', [30, -66], ep_ * 0.7); openH(q, 1); add(A, 'head', 0.3 * ep_); faceDef(q, ep_, { brow: 'frown', mouth: 'tight' }); }
    const vx = k('vexe'); if (vx > 0) { q.tilt = (q.tilt || 0) - 0.06 * vx; add(A, 'head', -0.3 * vx); armTo(q, 'armF', [42, -60], vx); faceDef(q, vx, { eyes: 'closed', brow: 'frown', mouth: 'tight' }); }
    const sg = k('signe'); if (sg > 0) {
      if (q.tenu == null) q.tenu = 'plume'; if (q.tenu === 'plume') add(A, 'objet', 0.5);
      const T = cibleT(def, q, q.cible, x, y, s, dir, offsetObj('plume', q.tenuO, 'bec', 0.5), [96, -62]);
      armTo(q, 'armF', [T[0] + 3 * Math.sin(t * 11), T[1] + 1.5 * Math.sin(t * 23)], sg); armTo(q, 'armB', [74, -58], sg); openH(q, 0, 1); add(A, 'head', 0.26 * sg);
    }
    const sm = k('serreMain'); if (sm > 0) { armTo(q, 'armF', cibleT(def, q, q.cible, x, y, s, dir, null, [150, -70]), sm); openH(q, 1); faceDef(q, sm, { mouth: 'smile' }); }
    const as = k('auSol'); if (as > 0 && q.seRelever == null) { couche(q, as, A); for (const [n, v] of Object.entries(HKEYS[0].ang)) add(A, n, v * as); faceDef(q, as, { eyes: 'closed', brow: 'worry', mouth: 'o' }); }
    if (q.seRelever != null) {
      const u = clamp(q.seRelever) * 3, i = Math.min(2, Math.floor(u)), f = ease(u - i), a = HKEYS[i], b = HKEYS[i + 1];
      q._sol = true; q._lieA = lerp(a.lie, b.lie, f); q.tilt = (q.tilt || 0) + lerp(a.tilt, b.tilt, f);
      for (const n of new Set(Object.keys(a.ang).concat(Object.keys(b.ang)))) add(A, n, lerp(a.ang[n] || 0, b.ang[n] || 0, f));
      if (u > 1.02 && u < 2.92) q.libre.legB = 1;                                   // genou arrière à terre : pointe du pied vers le sol (voulu)
      faceDef(q, 1, u < 1.5 ? { eyes: 'half', brow: 'worry', mouth: 'o' } : { brow: 'frown', mouth: 'tight' });
    }
    return finish(q);
  };
  DOR.henri = (pose, x, y, s, o) => { s = s == null ? ECH.henri : s; const dir = (o && o.dir) || 1; return run(CH.dorHenri, DOR.henriPose(pose, x, y, s, dir), x, y, s, o); };

  // ---- Charles
  DOR.charlesPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, t = q.t || 0, def = CH.dorCharles; x = x || 0; y = y || 0; s = s || ECH.charles; dir = dir || 1;
    const k = (n) => ease(clamp(q[n] || 0));
    q._mainF = usesF(q, ['verse', 'deroule', 'serreMain']); q._mainB = usesF(q, ['verse', 'deroule']);
    base(q, def, t);
    const vs = k('verse'); if (vs > 0) {
      if (q.tenu == null) q.tenu = 'pichet'; add(A, 'objet', 0.95 * vs); if (q.deuxMains == null) q.deuxMains = true;
      armTo(q, 'armF', cibleT(def, q, q.cible, x, y, s, dir, offsetObj('pichet', q.tenuO, 'bec', 0.95 * vs), [98, -112]), vs); add(A, 'head', 0.14 * vs);
    }
    if (q.deroule != null && q.deroule !== false) { if (q.tenu == null) q.tenu = 'parchemin'; q.tenuO = Object.assign({ ouvert: clamp(q.deroule) }, q.tenuO); q.deuxMains = true; armTo(q, 'armF', [96, -196], 1); add(A, 'head', 0.12); }
    const sm = k('serreMain'); if (sm > 0) { armTo(q, 'armF', cibleT(def, q, q.cible, x, y, s, dir, null, [148, -72]), sm); openH(q, 1); }
    const sa = k('saluer'); if (sa > 0) { courbe(q, 0.3 * sa); add(A, 'head', 0.2 * sa); faceDef(q, sa, { eyes: 'half' }); }
    return finish(q);
  };
  DOR.charles = (pose, x, y, s, o) => { s = s == null ? ECH.charles : s; const dir = (o && o.dir) || 1; return run(CH.dorCharles, DOR.charlesPose(pose, x, y, s, dir), x, y, s, o); };

  // ---- courtisans : mêmes gestes, pose propre à chacun (v = 0 A, 1 dame B, 2 C)
  const CV = {
    applaudit: [{ T: [96, -236], w: 12, f: 12 }, { T: [78, -124], w: 9, f: 15 }, { T: [70, -62], w: 7, f: 7 }],
    bouche: [[[48, -194], [40, -186], -0.08], [[46, -196], [36, -128], 0], [[46, -198], [100, -170], -0.03]],
    leves: [[[86, -300], [62, -292], -0.06], [[118, -170], [100, -158], -0.12], [[70, -302], [118, -136], -0.04]],
    tire: [{ x: 70, f: 3.2, tl: -0.04 }, { x: 64, f: 2.6, tl: -0.14 }, { x: 82, f: 2.0, tl: -0.08 }],
    toque: [[96, -96], [112, -132], [92, -56]],
  };
  function courtPose(def, v) {
    return function (p, x, y, s, dir) {
      const q = prep(p), A = q.ang, t = q.t || 0; x = x || 0; y = y || 0; s = s || 0.86; dir = dir || 1;
      const k = (n) => ease(clamp(q[n] || 0));
      q._mainF = q._mainB = usesF(q, ['applaudit', 'mainsBouche', 'brasLeves', 'tire', 'tientToque']);
      base(q, def, t);
      const ap = k('applaudit'); if (ap > 0) { const c = CV.applaudit[v], ph = Math.abs(Math.sin(t * c.f)); armTo(q, 'armF', [c.T[0] + c.w * ph, c.T[1]], ap); armTo(q, 'armB', [c.T[0] - 6 - c.w * ph, c.T[1] + 4], ap); openH(q, 1, 1); faceDef(q, ap, { mouth: 'smile', eyes: v === 2 ? 'half' : 'open' }); add(A, 'head', -0.08 * ap); }
      const mb = k('mainsBouche'); if (mb > 0) { const c = CV.bouche[v]; armTo(q, 'armF', c[0], mb); armTo(q, 'armB', c[1], mb); openH(q, 1, 1); q.tilt = (q.tilt || 0) + c[2] * mb; faceDef(q, mb, { eyes: 'wide', brow: 'up', mouth: 'o' }); }
      const bl = k('brasLeves'); if (bl > 0) { const c = CV.leves[v]; armTo(q, 'armF', c[0], bl); armTo(q, 'armB', c[1], bl); openH(q, 1, 1); q.tilt = (q.tilt || 0) + c[2] * bl; faceDef(q, bl, { eyes: 'wide', brow: v === 1 ? 'worry' : 'up', mouth: 'o' }); }
      const ti = k('tire'); if (ti > 0) {
        const c = CV.tire[v], X0 = q.cible ? cibleT(def, q, q.cible, x, y, s, dir, null, [c.x, 0])[0] : c.x, u = q.tirage == null ? 0.5 + 0.5 * Math.sin(t * c.f) : clamp(q.tirage);
        q.tilt = (q.tilt || 0) + c.tl * ti; armTo(q, 'armF', [X0, lerp(-290, -130, u)], ti); armTo(q, 'armB', [X0 - 4, lerp(-130, -290, u) + 20], ti); faceDef(q, ti, { brow: 'frown', mouth: 'tight' });
        if (v === 1) { add(A, 'head', -0.1 * ti); } else { add(A, 'legF', -0.2 * ti); add(A, 'legF_lo', 0.2 * ti); }
      }
      const tq = k('tientToque'); if (tq > 0) { if (q.tenu == null) q.tenu = 'toqueF'; if (q.tenu === 'toqueF') q.tenuO = Object.assign({ sens: -1 }, q.tenuO); armTo(q, 'armF', CV.toque[v], tq); armTo(q, 'armB', [CV.toque[v][0] - 26, CV.toque[v][1] + 14], tq); openH(q, 0, 1); faceDef(q, tq, v === 0 ? { mouth: 'smile' } : v === 1 ? { brow: 'up' } : { eyes: 'half' }); }
      return finish(q);
    };
  }
  DOR.courtisanAPose = courtPose(CH.dorCourtA, 0); DOR.dameBPose = courtPose(CH.dorDameB, 1); DOR.courtisanCPose = courtPose(CH.dorCourtC, 2);
  DOR.courtisanA = (pose, x, y, s, o) => { s = s == null ? ECH.courtA : s; const dir = (o && o.dir) || 1; return run(CH.dorCourtA, DOR.courtisanAPose(pose, x, y, s, dir), x, y, s, o); };
  DOR.dameB = (pose, x, y, s, o) => { s = s == null ? ECH.dameB : s; const dir = (o && o.dir) || 1; return run(CH.dorDameB, DOR.dameBPose(pose, x, y, s, dir), x, y, s, o); };
  DOR.courtisanC = (pose, x, y, s, o) => { s = s == null ? ECH.courtC : s; const dir = (o && o.dir) || 1; return run(CH.dorCourtC, DOR.courtisanCPose(pose, x, y, s, dir), x, y, s, o); };

  // ================================================================== LA PRISE DE LUTTE (u 0..3)
  // 0 → 1 : François attrape Henri à la taille ; 1 → 2 : Henri soulevé, basculé par-dessus la hanche ; 2 → 3 : posé à plat sur le dos.
  // o : { xF (pieds de François, 400), xH (pieds d'Henri au départ, xF + 150·dir), y (FEET), sF, sH, dir (1 = François à gauche, regarde à droite),
  //       cast, poseF, poseH (champs ajoutés aux poses), toqueH (false = Henri sans toque) } → { rF, rH }
  const HT_TAILLE = [30, -26], HT_DOS = [-44, -30];
  DOR.lutte = function (t, u, o) {
    o = o || {}; u = clamp(u, 0, 3);
    const dir = o.dir || 1, y = o.y == null ? FEET : o.y, sF = o.sF || ECH.francois, sH = o.sH || ECH.henri;
    const xF = o.xF == null ? 400 : o.xF, xH = o.xH == null ? xF + dir * 210 * sH : o.xH, dH = -dir, c = cx_(), slot = o.slot == null ? M.ST.slotF : o.slot;
    const e1 = ease(clamp(u)), e2 = ease(clamp(u - 1)), e3 = ease(clamp(u - 2));
    // ---- Henri : pose et matrice (rotation autour de sa taille)
    const qH = DOR.henriPose(Object.assign({ t }, o.poseH || {}, { toque: o.toqueH }), xH, y, sH, dH), A = qH.ang;
    const fl = Math.sin(t * 11) * 0.12 * e1 * (1 - e3);
    add(A, 'armF_up', -1.9 * e1 * (1 - e3) + fl); add(A, 'armF_lo', -0.2 * e1 * (1 - e3)); add(A, 'armB_up', -1.5 * e1 * (1 - e3) - fl); add(A, 'armB_lo', -0.22 * e1 * (1 - e3));
    add(A, 'armF_up', -0.4 * e3); add(A, 'armB_up', -0.3 * e3);
    add(A, 'legF', -0.55 * e2 * (1 - e3) + 0.1 * Math.sin(t * 9) * e2 * (1 - e3)); add(A, 'legB', -0.3 * e2 * (1 - e3)); add(A, 'legF_lo', 0.5 * e2 * (1 - e3));
    if (qH.handF == null) qH.handF = 'open'; if (qH.handB == null) qH.handB = 'open';
    if (u < 2.6) Object.assign(qH.face, { eyes: 'wide', brow: 'up', mouth: 'o' }, (o.poseH && o.poseH.face) || {});
    else Object.assign(qH.face, { eyes: 'closed', brow: 'worry', mouth: 'o' }, (o.poseH && o.poseH.face) || {});
    const hip0 = [xH, y - 238 * sH];
    const a1 = 0.22, a2 = PI / 2 - 0.12, a3 = PI / 2;
    const W1 = [xH - dir * 40 * sH, hip0[1] - 20 * sH], W2 = [xF + dir * 92 * sF, y - 236 * sF];
    // position finale : à plat, taille à 120·s devant François
    const rotAt = (a, W) => new DOMMatrix().translate(W[0], W[1]).rotate(dir * a * D).translate(-hip0[0], -hip0[1]);
    const W3x = xF + dir * (300 * sF);
    let R3 = rotAt(a3, [W3x, 0]);
    { c.save(); c.setTransform(R3); const mats = M.partMatrices(CH.dorHenri, qH, xH, y, sH, dH).mats; c.restore(); let my = -1e9; for (const v of partPoly(CH.dorHenri, qH, mats)) my = Math.max(my, v[1]); R3 = rotAt(a3, [W3x, y - my]); }
    const a = u < 1 ? a1 * e1 : u < 2 ? lerp(a1, a2, e2) : lerp(a2, a3, e3);
    let RH;
    if (u < 1) RH = rotAt(a, lp2(hip0, W1, e1));
    else if (u < 2) RH = rotAt(a, lp2(W1, W2, e2));
    else { const W3p = mp(R3, hip0); RH = rotAt(a, lp2(W2, W3p, e3)); }
    const base_ = c.getTransform();
    c.save(); c.setTransform(base_.multiply(RH));
    const rH = M.puppet(CH.dorHenri, qH, xH, y, sH, { dir: dH, slot, rod: u < 0.6, floorShadow: u < 0.6, cast: o.cast, nom: 'henri (lutte)' });
    c.restore();
    rH.q = qH; rH.def = CH.dorHenri;
    // ---- François : attrape, suit la taille d'Henri, projette puis lâche
    const pf = Object.assign({ t }, o.poseF || {});
    const tgtF = rH.w('torso', HT_TAILLE[0], HT_TAILLE[1]), tgtB = rH.w('torso', HT_DOS[0] + 20, HT_DOS[1] + 8);
    const lach = smooth(0.75, 1, e3);
    let qF;
    if (u < 1) qF = DOR.francoisPose(Object.assign(pf, { attrape: 1, cible: e1 > 0.01 ? lp2([xF + dir * 134 * sF, y - 270 * sF], tgtF, e1) : null, cibleB: e1 > 0.01 ? lp2([xF + dir * 118 * sF, y - 260 * sF], tgtB, e1) : null }), xF, y, sF, dir);
    else if (u < 2) { qF = DOR.francoisPose(Object.assign(pf, { attrape: 1 - e2, projette: e2 * 0.6, cible: tgtF, cibleB: tgtB }), xF, y, sF, dir); }
    else qF = DOR.francoisPose(Object.assign(pf, { projette: 0.6 + 0.4 * e3 - 0.6 * lach, cible: lach < 1 ? tgtF : null, cibleB: lach < 1 ? tgtB : null }), xF, y, sF, dir);
    if (u >= 2 && lach > 0) { Object.assign(qF.face, { mouth: 'smile', brow: 'up' }); }
    const rF = run(CH.dorFrancois, qF, xF, y, sF, { dir, cast: o.cast, slot, nom: 'francois (lutte)' });
    return { rF, rH, piedsH: rH.w('legF_lo', 0, 124) };
  };

  // ================================================================== ACCESSOIRES SEULS (M.puppet à une pièce invisible : ombre portée possible)
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accDraw(name, draw, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 0.9) : s;
    return M.puppet(accDef(name, draw), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of Object.keys(OBJ)) DOR[n] = (x, y, s, o) => accDraw(n, (oo) => { const ob = OBJ[n], c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({}, ob.held || {}, oo)); c.restore(); }, x, y, s, o);
  // tabouret rustique (même x, y, s, dir que la marionnette assise) : dessus à 100 au-dessus des pieds
  function drawTabouret() {
    for (const [lx, a] of [[-44, -0.12], [34, 0.1], [-4, 0.02]]) pc([[lx - 5, -96], [lx + 5, -96], [lx + 5 + a * 90, 0, 1], [lx - 5 + a * 90, 0, 1]], lx === -4 ? '#4a3220' : '#5e4028', () => hatch(null, 1.4, 4, 0.25), 8301 + lx);
    pc(rrect(-60, -110, 50, -96, 5), '#7a5634', () => { strokePts([[-56, -106], [46, -106]], 'rgba(255,230,190,0.35)', 1.4); hatch(null, 0.15, 4, 0.22); }, 8304);
  }
  DOR.tabouret = (x, y, s, o) => accDraw('tabouret', drawTabouret, x, y, s, o, 0.9);

  // ================================================================== DÉCORS
  const W = 1080, SB = M.ST.back, HB = SB + 5;
  const CAMP = {
    tentes: [{ x: 118, s: 1.0, cols: [ORT, IVO, BLEU] }, { x: 300, s: 0.88, cols: [ORT, CRAM] }, { x: 528, s: 0.8, cols: [IVO, ORT, '#4f6a4a'] }, { x: 752, s: 0.92, cols: [ORT, BLEU] }, { x: 945, s: 1.02, cols: [CRAM, ORT, IVO] }],
    palais: { x: 815, haut: 700, x0: 585, x1: 1045 }, fontaine: { x: 540, haut: 400 }, tribune: { x: 168 }, lice: { x: 560, y: 1440 },
    ruines: [{ x: 168 }, { x: 902 }], feu: { x: 655 }, plancher: FEET,
  };
  DOR.CAMP = CAMP;
  const crestY = (xs) => SB - 478 + 38 * Math.sin(xs * 0.006 + 1) + 24 * Math.sin(xs * 0.013 + 0.4);
  const plainY = (xs) => SB - 300 + 14 * Math.sin(xs * 0.009);
  CAMP.crestY = crestY;
  // ---- tente ronde et pointue (base (0,0)) ≈ 172 × 296
  function drawTent(cols, seed) {
    const n = 9, xs = []; for (let i = 0; i <= n; i++) xs.push(-86 * Math.cos(PI * i / n));
    for (const sg of [-1, 1]) { strokePts([[sg * 88, -116], [sg * 120, 0]], 'rgba(60,45,25,0.8)', 1.6); pc(rect(sg * 120 - 3, -10, sg * 120 + 3, 2), '#5b3d22', null, seed + 90 + sg); }
    pc([[-88, -120], [88, -120], [88, -4, 1], [0, 2], [-88, -4, 1]], cols[0], () => {
      for (let i = 0; i < n; i++) fillPts([[xs[i], -126], [xs[i + 1], -126], [xs[i + 1], 6], [xs[i], 6]], cols[i % cols.length]);
      fillPts([[-24, 4], [0, -96], [24, 4]], '#2a1c12'); fillPts([[-24, 4], [-4, -84], [-34, 4]], IVO); fillPts([[24, 4], [4, -84], [34, 4]], IVO);
      strokePts([[-36, -40], [-14, -52]], ORD, 2.4); strokePts([[36, -40], [14, -52]], ORD, 2.4);
      hatch([[-90, -130], [-60, -130], [-60, 10], [-90, 10]], 0.8, 3.6, 0.3); hatch([[60, -130], [90, -130], [90, 10], [60, 10]], -0.8, 3.6, 0.3); shade(-80, 0, 80, 0, 0.2);
    }, seed);
    pc([[-98, -124, 1], [98, -124, 1], [0, -262, 1]], cols[0], () => {
      for (let i = 0; i < n; i++) fillPts([[0, -262], [xs[i] * 1.12, -122], [xs[i + 1] * 1.12, -122]], cols[(i + 1) % cols.length]);
      hatch([[-100, -130], [-30, -250], [-60, -120]], 0.7, 3.6, 0.28); shade(-60, -200, 60, -150, 0.22);
    }, seed + 1);
    const sc = []; for (let i = 0; i <= 12; i++) { const x = -100 + i * 200 / 12; sc.push([x, -112, 0]); if (i < 12) sc.push([x + 100 / 12, -100]); }
    pc([[-100, -130, 1], [100, -130, 1]].concat(sc.reverse()), ORT, () => { strokePts([[-100, -124], [100, -124]], cols[1] === ORT ? CRAM : cols[1], 3); hatch(null, 0.3, 4, 0.2); }, seed + 2);
    strokePts([[0, -262], [0, -294]], '#3a2a1a', 3); pc(ell(0, -296, 6, 6, 10), OR, null, seed + 3);
  }
  const TENT_TOP = 296;
  function makeTent(cols, seed) { const cv = M.cutFlat(260, 330, 130, 320, () => drawTent(cols, seed)); cv.padB = 10; return M.withShadow(cv, 8); }
  function makeTentRow() {
    const cv = M.cutFlat(W + 40, 200, (W + 40) / 2, 190, (c) => {
      const pts = [[-560, 0, 1]]; for (let x = -560; x <= 560; x += 40) pts.push([x, -44 + 10 * Math.sin(x * 0.02) + 6 * Math.sin(x * 0.05)]); pts.push([560, 0, 1]);
      pc(pts, '#7e8a5a', () => { hatch(null, 0.2, 6, 0.15); }, 6001);
      const R = M.rng(61), C = [[ORT, IVO], [ORT, BLEU], [IVO, CRAM], [ORT, CRAM], [IVO, BLEU], [ORT, IVO, CRAM]];
      for (let i = 0; i < 9; i++) { const x = -470 + i * 118 + (R() - 0.5) * 30; c.save(); c.translate(x, -34 + R() * 8); c.scale(0.4, 0.4); drawTent(C[i % C.length], 6100 + i * 7); c.restore(); }
      c.fillStyle = 'rgba(222,226,214,0.32)'; c.fillRect(-560, -200, 1120, 200);
    }); cv.padB = 10; return cv;
  }
  function makeCampCiel() {
    return M.pre(W, HB, (c) => {
      const g = c.createLinearGradient(0, 0, 0, HB); g.addColorStop(0, '#5d7896'); g.addColorStop(0.45, '#9fb2bc'); g.addColorStop(0.75, '#d9d6c2'); g.addColorStop(1, '#e9dcb8');
      c.fillStyle = g; c.fillRect(0, 0, W, HB);
      const R = M.rng(71); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.02 + R() * 0.04})`; c.beginPath(); c.ellipse(R() * W, R() * HB * 0.8, 40 + R() * 120, 6 + R() * 16, (R() - 0.5) * 0.2, 0, TAU); c.fill(); }
      const sun = c.createRadialGradient(760, 620, 10, 760, 620, 380); sun.addColorStop(0, 'rgba(255,244,210,0.45)'); sun.addColorStop(1, 'rgba(255,244,210,0)'); c.fillStyle = sun; c.fillRect(0, 0, W, HB);
    });
  }
  function ruine(c, x, y, k, seed) {
    c.save(); c.translate(x, y); c.scale(k, k);
    pc([[-60, 0, 1], [-60, -70], [-48, -76], [-40, -64], [-30, -82], [-24, -70], [-24, 0, 1]], '#98948a', () => { fillPts(ep(-42, -24, 7, 12, 8, PI, TAU).concat([[-35, -6], [-49, -6]]), '#4a4842'); hatch(null, 0.8, 3.4, 0.25); }, seed);
    pc([[-24, 0, 1], [-24, -150], [-18, -164], [-8, -152], [2, -176], [10, -160], [18, -168], [24, -150], [24, 0, 1]], '#a29e92', () => { for (const yy of [-120, -70]) fillPts(rect(-5, yy, 5, yy + 20), '#3e3c38'); for (let yy = -140; yy < 0; yy += 14) strokePts([[-24, yy], [24, yy]], 'rgba(60,58,52,0.35)', 1); hatch(null, 0.8, 3.4, 0.25); shade(-24, 0, 24, 0, 0.25); }, seed + 1);
    pc([[24, 0, 1], [24, -60], [40, -44], [52, -54], [62, -30], [76, 0, 1]], '#8e8a80', () => { fillPts(ep(42, -10, 9, 16, 8, PI, TAU).concat([[51, 0], [33, 0]]), '#4a4842'); }, seed + 2);
    for (const [rx, ry, r] of [[-70, -4, 6], [80, -3, 7], [90, -2, 4]]) pc(ell(rx, ry, r, r * 0.6, 8), '#8a867c', null, seed + 3 + rx);
    c.restore();
  }
  function makeCampPlaine() {
    const cv = M.cutFlat(W, 680, W / 2, 670, (c) => {
      const L = (fn, x0, x1, st) => { const o = []; for (let x = x0; x <= x1; x += st) o.push([x - W / 2, fn(x) - SB]); return o; };
      pc([[-W / 2 - 4, 0, 1]].concat(L((x) => crestY(x) - 40 + 30 * Math.sin(x * 0.004 + 2), 0, W, 30), [[W / 2 + 4, 0, 1]]), '#a5ad92', () => hatch(null, 0.2, 7, 0.1), 6201);
      pc([[-W / 2 - 4, 0, 1]].concat(L(crestY, 0, W, 24), [[W / 2 + 4, 0, 1]]), '#8f9c72', () => { hatch(null, 0.25, 6, 0.12); for (let i = 0; i < 18; i++) { const x = 30 + i * 60, y = crestY(x) - SB + 30 + 20 * Math.sin(i); fillPts(ell(x - W / 2, y, 16, 9, 8), 'rgba(80,100,60,0.4)'); } }, 6202);
      ruine(c, CAMP.ruines[0].x - W / 2, crestY(CAMP.ruines[0].x) - SB + 6, 0.62, 6210);
      ruine(c, CAMP.ruines[1].x - W / 2, crestY(CAMP.ruines[1].x) - SB + 6, 0.55, 6220);
      c.fillStyle = 'rgba(214,222,214,0.3)'; c.fillRect(-W / 2, -680, W, 680);
      pc([[-W / 2 - 4, 0, 1]].concat(L(plainY, 0, W, 30), [[W / 2 + 4, 0, 1]]), '#76884e', () => {
        hatch(null, 0.15, 5, 0.12);
        for (let i = 0; i < 26; i++) { const x = 10 + i * 42 + 10 * Math.sin(i * 3), y = plainY(x) - SB + 10 + (i % 3) * 22; strokePts([[x - W / 2 - 14, y], [x - W / 2 + 14, y]], 'rgba(60,80,40,0.35)', 2); }
        for (const [x, w] of [[60, 70], [420, 60], [860, 90]]) for (let k = 0; k < 4; k++) fillPts(ell(x - W / 2 + k * w / 4, plainY(x) - SB + 4 - (k % 2) * 8, 18, 14, 9), '#5a6e3c');
      }, 6230);
      const fx = CAMP.feu.x - W / 2, fy = plainY(CAMP.feu.x) - SB + 46;
      for (const sg of [-1, 1]) strokePts([[fx + sg * 12, fy], [fx, fy - 30]], '#3a2a1a', 2);
      pc([[fx - 9, fy - 22], [fx + 9, fy - 22], [fx + 7, fy - 10], [fx - 7, fy - 10]], '#2a2420', null, 6240);
      for (const [x, cl] of [[fx - 40, '#d8c8a0'], [fx + 36, '#c9a64a']]) { pc([[x - 16, fy, 1], [x, fy - 34, 1], [x + 16, fy, 1]], cl, null, 6241 + x); }
    }); cv.padB = 10; return cv;
  }
  // ---- palais de toile anglais (base (0,0)) : façade de « briques » peintes, grandes fenêtres ; envers = charpente
  const PAL_WIN = []; for (const yy of [[-500, -386], [-320, -206]]) for (const xx of [[-112, -52], [-30, 30], [52, 112]]) PAL_WIN.push([xx[0], yy[0], xx[1], yy[1]]);
  const PAL_C = [-150, -604];
  function drawPalais() {
    const c = cx_();
    for (const sg of [-1, 1]) {
      const x0 = sg < 0 ? -232 : 150, x1 = sg < 0 ? -150 : 232;
      pc([[x0, 0, 1], [x0, -640, 1], [x1, -640, 1], [x1, 0, 1]], '#a65a40', () => { for (let y = -630; y < 0; y += 14) strokePts([[x0, y], [x1, y]], 'rgba(240,220,200,0.35)', 1.2); for (const xx of [x0 + 20, x1 - 20]) strokePts([[xx, -640], [xx, 0]], 'rgba(60,20,10,0.35)', 2); fillPts(rect((x0 + x1) / 2 - 8, -520, (x0 + x1) / 2 + 8, -460), '#38484e'); fillPts(rect((x0 + x1) / 2 - 8, -330, (x0 + x1) / 2 + 8, -270), '#38484e'); hatch(null, 0.8, 4, 0.2); shade(x0, 0, x1, 0, 0.3); }, 6301 + sg);
      pc([[x0 - 6, -638, 1], [x1 + 6, -638, 1], [x1, -664], [(x0 + x1) / 2 + 12, -690], [(x0 + x1) / 2, -716, 1], [(x0 + x1) / 2 - 12, -690], [x0, -664]], '#6f7a80', () => { strokePts([[(x0 + x1) / 2 - 20, -660], [(x0 + x1) / 2 - 6, -700]], 'rgba(255,255,255,0.35)', 2); }, 6303 + sg);
      pc(ell((x0 + x1) / 2, -722, 6, 6, 10), OR, null, 6305 + sg);
    }
    pc([[-150, -40, 1], [-150, -560, 1], [150, -560, 1], [150, -40, 1]], '#9a4a34', () => {
      const R = M.rng(63);
      for (let y = -556, row = 0; y < -40; y += 14, row++) { strokePts([[-150, y], [150, y + (R() - 0.5) * 2]], 'rgba(240,215,190,0.45)', 1.3); for (let x = -150 + (row % 2) * 15; x < 150; x += 30) strokePts([[x, y], [x, y + 14]], 'rgba(240,215,190,0.35)', 1); }
      for (let i = 0; i < 40; i++) fillPts(rect(-150 + R() * 280, -556 + R() * 500, -150 + R() * 280 + 26, -556 + R() * 500 + 10), `rgba(${R() < 0.5 ? '120,40,25' : '190,100,70'},0.25)`);
      for (const x of [-60, 60]) strokePts([[x, -560], [x, -40]], 'rgba(80,40,20,0.25)', 1.2);
      hatch(null, 0.8, 4.4, 0.16); shade(-150, 0, 150, 0, 0.2);
    }, 6310);
    for (let x = -150; x < 150; x += 30) pc(rect(x, -604, x + 18, -556), '#a85c42', () => strokePts([[x, -590], [x + 18, -590]], 'rgba(240,215,190,0.4)', 1), 6320 + x);
    pc(rect(-156, -566, 156, -552), '#d4c8a8', null, 6330);
    for (const [x0, y0, x1, y1] of PAL_WIN) {
      pc(rect(x0 - 8, y0 - 8, x1 + 8, y1 + 10), '#d8ccb0', () => hatch(null, 0.8, 3.4, 0.18), 6340 + x0 + y0);
      fillPts(rect(x0, y0, x1, y1), '#7f97a8');
      c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
      for (let d = -120; d < 200; d += 12) { strokePts([[x0 + d, y0], [x0 + d + 120, y1]], 'rgba(40,50,60,0.6)', 1); strokePts([[x1 - d, y0], [x1 - d - 120, y1]], 'rgba(40,50,60,0.6)', 1); }
      fillPts([[x0, y0], [x0 + 24, y0], [x0, y0 + 50]], 'rgba(255,255,255,0.25)');
      c.restore();
      for (const xm of [x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3]) fillPts(rect(xm - 2.5, y0, xm + 2.5, y1), '#d8ccb0');
    }
    pc([[-56, -40, 1], [-56, -150], [-30, -178], [0, -186], [30, -178], [56, -150], [56, -40, 1]], '#d8ccb0', null, 6360);
    pc([[-44, -40, 1], [-44, -144], [-22, -166], [0, -172], [22, -166], [44, -144], [44, -40, 1]], '#2a1e16', () => { fillPts([[-44, -40], [-44, -140], [-30, -150], [-30, -46]], '#6e4a2c'); fillPts([[44, -40], [44, -140], [30, -150], [30, -46]], '#6e4a2c'); }, 6361);
    pc(rect(-236, -40, 236, 0), '#bfb49a', () => { for (let x = -230; x < 236; x += 36) strokePts([[x, -40], [x, 0]], 'rgba(90,80,60,0.4)', 1.2); hatch(null, 0.8, 4, 0.2); }, 6370);
  }
  function makePalais() { const cv = M.cutFlat(500, 760, 250, 750, () => drawPalais()); cv.padB = 10; return M.withShadow(cv, 8); }
  function makePalaisDos() {
    const cv = M.cutFlat(500, 760, 250, 750, () => {
      const wood = (pts, s) => pc(pts, '#b08a58', () => { strokePts([[pts[0][0], pts[0][1]], [pts[2][0], pts[2][1]]], 'rgba(120,80,40,0.4)', 1); hatch(null, 1.5, 4, 0.2); }, s);
      for (let x = -150; x <= 150; x += 60) wood(rect(x - 5, -604, x + 5, -40), 6401 + x);
      for (const y of [-600, -480, -360, -240]) wood(rect(-152, y, 152, y + 10), 6410 + y);
      for (const [a, b] of [[[-150, -600], [-30, -480]], [[-90, -600], [30, -480]], [[-150, -480], [-30, -360]]]) { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * 4, ny = dx / l * 4; wood([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], 6420 + a[0] + a[1]); }
    }); cv.padB = 10; return cv;
  }
  // ---- fontaine de vin (base (0,0)) ≈ 240 × 400
  const FONT = { haut: [0, -330], mid: [0, -262], bas: [0, -84] };
  function drawFontaine() {
    pc([[-142, 0, 1], [-142, -64], [-150, -84, 1], [150, -84, 1], [142, -64], [142, 0, 1]], '#b8ab8c', () => { for (const x of [-96, -32, 32, 96]) strokePts([[x, -64], [x, 0]], 'rgba(80,70,50,0.45)', 1.6); for (const x of [-64, 0, 64]) fillPts(rect(x - 22, -54, x + 22, -12), 'rgba(110,95,70,0.3)'); fillPts(rect(-150, -86, 150, -74), OR); strokePts([[-148, -80], [148, -80]], ORL, 1.4); hatch(null, 0.8, 4, 0.2); shade(-140, 0, 140, 0, 0.3); }, 6501);
    fillPts(ell(0, -86, 140, 8, 20), VIN);
    pc([[-16, -84, 1], [16, -84, 1], [12, -240], [-12, -240]], '#c4b796', () => { for (const y of [-120, -200]) fillPts(rect(-16, y, 16, y + 8), OR); shade(-14, 0, 14, 0, 0.3); }, 6502);
    pc([[-72, -270], [72, -270], [60, -250], [30, -238], [-30, -238], [-60, -250]], '#c4b796', () => { fillPts(rect(-74, -272, 74, -264), OR); shade(-60, 0, 60, 0, 0.3); }, 6503);
    pc([[-10, -268, 1], [10, -268, 1], [8, -326], [-8, -326]], '#c4b796', () => fillPts(rect(-10, -300, 10, -294), OR), 6504);
    pc([[-36, -340], [36, -340], [28, -326], [-28, -326]], OR, () => shade(-30, 0, 30, 0, 0.3), 6505);
    pc([[-10, -340, 1], [10, -340, 1], [14, -356], [8, -376], [0, -392, 1], [-8, -376], [-14, -356]], ORL, () => { for (let y = -384; y < -342; y += 7) strokePts([[-12, y], [12, y + 4]], ORD, 1); shade(-10, 0, 10, 0, 0.3); }, 6506);
    for (const sg of [-1, 1]) { pc(rect(sg * 64 - 5, -258, sg * 64 + 5 + sg * 8, -250), ORD, null, 6510 + sg); pc(rect(sg * 30 - 4, -338, sg * 30 + 4 + sg * 6, -332), ORD, null, 6512 + sg); }
  }
  function makeFontaine() { const cv = M.cutFlat(340, 450, 170, 440, () => drawFontaine()); cv.padB = 10; return M.withShadow(cv, 8); }
  const JETS = [[[36, -335], [66, -320], [62, -268]], [[-36, -335], [-66, -320], [-62, -268]], [[74, -254], [120, -236], [126, -88]], [[-74, -254], [-120, -236], [-126, -88]], [[52, -254], [80, -230], [86, -88]], [[-52, -254], [-80, -230], [-86, -88]]];
  function jets(t, k) {
    if (SIL() || k <= 0.01) return; const c = cx_(), g = M.tg(t);
    c.save(); c.lineCap = 'round';
    for (const [i, J] of JETS.entries()) {
      const P_ = qbez(J[0], J[1], J[2], 14), n = Math.max(2, Math.round(14 * k));
      c.strokeStyle = VIN; c.lineWidth = i < 2 ? 6 : 7; c.beginPath(); P_.slice(0, n + 1).forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      c.strokeStyle = 'rgba(230,120,130,0.8)'; c.lineWidth = 2; c.setLineDash([6, 14]); c.lineDashOffset = -g * 90 - i * 7; c.stroke(); c.setLineDash([]);
      if (k > 0.95) for (let d = 0; d < 3; d++) { const u = ((g * 1.7 + d / 3 + i * 0.13) % 1), e = J[2]; dot(e[0] + (d - 1) * 6 * u, e[1] - 10 * Math.sin(PI * u), 2.4 * (1 - u), VIN); }
    }
    for (let i = 0; i < 6; i++) { const u = ((g * 0.6 + i / 6) % 1); c.strokeStyle = `rgba(230,140,140,${0.5 * (1 - u)})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse((i - 2.5) * 40, -86, 8 + 20 * u, 2 + 3 * u, 0, 0, TAU); c.stroke(); }
    c.restore();
  }
  // ---- lice : palissade basse (base au centre) et tribune à gauche
  function makeLice() {
    const cv = M.cutFlat(720, 150, 360, 140, () => {
      for (const y of [-80, -42]) pc(rect(-340, y, 340, y + 10), '#8a6a44', () => { strokePts([[-340, y + 2], [340, y + 2]], 'rgba(255,230,190,0.35)', 1.2); hatch(null, 0.1, 5, 0.2); }, 6601 + y);
      for (let x = -340; x <= 340; x += 48) pc([[x - 6, 0, 1], [x - 6, -96], [x, -106, 1], [x + 6, -96], [x + 6, 0, 1]], '#6e5232', () => hatch(null, 1.5, 4, 0.25), 6610 + x);
    }); cv.padB = 10; return M.withShadow(cv, 6);
  }
  function makeTribune() {
    const cv = M.cutFlat(380, 540, 190, 530, (c) => {
      for (const x of [-160, 160]) pc(rect(x - 7, -430, x + 7, 0), '#6e5232', () => hatch(null, 1.5, 4, 0.25), 6701 + x);
      const R = M.rng(67), HAT = ['#8a2a2a', '#2a3550', '#4f6a4a', '#1e1e22', OCRE, '#6a4a30'];
      for (let k = 0; k < 3; k++) {
        const yb = -100 - k * 90, xs = -150 + k * 6, xe = 150 - k * 6;
        for (let i = 0; i < 6; i++) {                                                     // spectateurs peints, de face (tête, chapeau, épaules)
          const x = lerp(xs + 20, xe - 20, (i + 0.5) / 6) + (R() - 0.5) * 10, col = HAT[Math.floor(R() * HAT.length)];
          pc(ep(x, yb - 2, 18, 26, 8, PI, TAU), ['#2a3550', '#8a2a2a', '#4f6a4a', OCRE, '#5a3f2a'][Math.floor(R() * 5)], null, 6720 + k * 10 + i);
          pc(ell(x, yb - 38, 9, 10, 10), '#e2c3a0', null, 6750 + k * 10 + i);
          pc([[x - 13, yb - 44], [x + 13, yb - 44], [x + 10, yb - 52], [x - 10, yb - 52]], col, null, 6780 + k * 10 + i);
        }
        pc(rect(xs, yb, xe, yb + 22), '#8a6a44', () => { strokePts([[xs, yb + 4], [xe, yb + 4]], 'rgba(255,230,190,0.35)', 1.2); hatch(null, 0.1, 5, 0.2); }, 6710 + k);
        pc(rect(xs + 6, yb + 22, xe - 6, yb + 90), '#5e4428', () => hatch(null, 1.2, 4, 0.3), 6715 + k);
      }
      pc([[-182, -430, 1], [182, -430, 1], [150, -500], [0, -520], [-150, -500]], ORT, () => { for (let x = -180; x < 180; x += 40) fillPts([[x, -430], [x + 20, -430], [x + 18, -510], [x + 2, -510]], BLEU); hatch(null, 0.8, 4, 0.2); }, 6790);
      const sc = []; for (let i = 0; i <= 10; i++) { const x = -182 + i * 36.4; sc.push([x, -416]); if (i < 10) sc.push([x + 18.2, -402]); }
      pc([[-182, -432, 1], [182, -432, 1]].concat(sc.reverse()), CRAM, () => strokePts([[-182, -426], [182, -426]], ORL, 2), 6795);
    }); cv.padB = 10; return M.withShadow(cv, 8);
  }
  // ---- premier plan du camp : tonneaux, panier de pain
  function makeTonneau() {
    const cv = M.cutFlat(240, 170, 120, 160, () => {
      for (const [x, s] of [[-52, 1], [52, 0.92]]) pc([[x - 44 * s, 0, 1], [x - 50 * s, -60 * s], [x - 44 * s, -120 * s, 1], [x + 44 * s, -120 * s, 1], [x + 50 * s, -60 * s], [x + 44 * s, 0, 1]], '#8a5e34', () => { for (const y of [-12, -50, -72, -108]) fillPts(rect(x - 52, y * s, x + 52, (y + 7) * s), '#3a3634'); for (let xx = x - 40; xx < x + 44; xx += 14) strokePts([[xx, 0], [xx, -120 * s]], 'rgba(60,35,15,0.5)', 1.2); shade(x - 40, 0, x + 40, 0, 0.3); }, 6801 + x);
    }); cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makePanierPain() {
    const cv = M.cutFlat(200, 140, 100, 130, () => {
      for (const [x, y, r] of [[-30, -58, 22], [6, -66, 24], [36, -56, 20]]) pc(ell(x, y, r, r * 0.7, 12), '#c48a44', () => { strokePts([[x - r * 0.6, y - 4], [x + r * 0.5, y - 8]], 'rgba(120,70,20,0.6)', 1.6); shade(x, y - r, x, y + r, 0.3); }, 6901 + x);
      pc([[-70, -50], [70, -50], [58, 0, 1], [-58, 0, 1]], '#a9824a', () => { for (let y = -46; y < 0; y += 8) strokePts([[-70, y], [70, y]], 'rgba(70,45,20,0.55)', 1.3); for (let x = -64; x < 70; x += 11) strokePts([[x, -50], [x * 0.86, 0]], 'rgba(70,45,20,0.4)', 1); }, 6910);
      pc(rrect(-74, -56, 74, -46, 4), '#8a6a3a', null, 6911);
    }); cv.padB = 10; return M.withShadow(cv, 8);
  }
  // oriflamme à bandes unies qui flotte ; (x, y) = haut de la hampe ; o : {len, h, cols, w (largeurs des bandes, somme 1), ph, amp (vent), pend 0..1 (décrochée)}
  // bandes inégales (liseré d'or étroit + corps de couleur) : jamais l'air d'un drapeau national
  function oriflamme(t, x, y, s, o) {
    if (SIL()) return; const c = cx_(), g = M.tg(t), len = (o.len || 70) * s, h = (o.h || 22) * s, n = 10, amp = (o.amp == null ? 1 : o.amp), pend = ease(clamp(o.pend || 0));
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) { const u = i / n, w = Math.sin(g * 4.6 - u * 5 + (o.ph || 0)) * 7 * s * u * amp, dr = (1 - amp) * u * len * 0.8; top.push([x + u * len * (1 - (1 - amp) * 0.6), y + w + dr]); bot.push([x + u * len * (1 - (1 - amp) * 0.6) - (o.queue ? u * u * 6 : 0), y + h * (1 - 0.35 * u) + w + dr]); }
    c.save();
    if (pend > 0) { c.translate(x, y + h); c.rotate((PI / 2 + 0.25 + 0.05 * Math.sin(g * 2)) * pend); c.translate(-x, -(y + h)); }
    const cols = o.cols || [ORT, CRAM], k = cols.length, wt = o.w || (k === 2 ? [0.28, 0.72] : cols.map(() => 1 / k)), cu = [0]; for (const v of wt) cu.push(cu[cu.length - 1] + v);
    for (let j = 0; j < k; j++) { const A_ = top.map((p, i) => lp2(p, bot[i], cu[j])), B_ = top.map((p, i) => lp2(p, bot[i], cu[j + 1])); fillPts(A_.concat(B_.reverse()), cols[j], 0, 0); }
    strokePts(top.concat(bot.slice().reverse(), [top[0]]), 'rgba(40,25,10,0.8)', 1.2);
    c.restore();
  }

  // ------------------------------------------------------------ LE CAMP
  // o : tentes 0..1 (défaut 1, montent de la trappe), reflets 0..1 (défaut 1), palais 0..1 (descend des cintres), claque 0..1 (coin de toile soulevé),
  //     fontaine 0..1 (monte de la trappe, puis le vin coule), affaisse 0..1, lice (bool : palissade + tribune ; le sable : DOR.campSol),
  //     pierre (instant s : une pierre tombe de la ruine gauche), decroche 0..1 (l'oriflamme de la tente 2 pend), cheval (défaut true), cast
  DOR.camp = function (t, o) {
    o = o || {}; const K = DOR.K, c = cx_(), g = M.tg(t), cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    const ten = o.tentes == null ? 1 : clamp(o.tentes), ref = (o.reflets == null ? 1 : clamp(o.reflets)), aff = ease(clamp(o.affaisse || 0));
    c.drawImage(K.ciel, 0, 0);
    M.nuages(t, { y0: 250, y1: 560, n: 5, vit: 12, s: 0.9, seed: 21, brume: 0.1 });
    M.oiseaux(((g % 16) + 16) % 16, { x0: 1120, x1: -120, y: 470, t0: 0, dur: 14, n: 5, s: 0.42, brume: 0.45, seed: 5 });
    M.flat(K.plaine, W / 2, SB);
    if (o.cheval !== false) M.animal('cheval', 612, crestY(612) + 4, 0.2, { dir: -1, immobile: true, tete: 0.6 + 0.6 * Math.max(0, Math.sin(g * 0.7)), brume: 0.42 });
    if (o.pierre != null) {                                                                // une pierre tombe de la ruine gauche
      const u = t - o.pierre, R0 = CAMP.ruines[0], top = crestY(R0.x) - 100, sol = crestY(R0.x + 30) + 8;
      if (u > 0) { const y = Math.min(sol, top + 0.5 * 900 * u * u), x = R0.x + 8 + 34 * Math.min(u, 0.6), land = y >= sol, v = land ? u - Math.sqrt(2 * (sol - top) / 900) : 0;
        pc(ell(x, y - (land ? Math.abs(Math.sin(v * 12)) * 6 * Math.exp(-6 * v) : 0), 4.5, 3.5, 7), '#8a867c', null, 6950);
        if (land && v < 0.8) { c.save(); c.globalAlpha = 0.4 * (1 - v / 0.8); for (let i = 0; i < 4; i++) dot(x + (i - 1.5) * 6 * (1 + v * 3), y - 3 - v * 10, 3 + v * 6, '#d8d2c0'); c.restore(); } }
    }
    M.fumee(t, { x: CAMP.feu.x, y: plainY(CAMP.feu.x) + 22, s: 0.32, n: 6, haut: 200, vent: 30, a: 0.55, per: 3.4, seed: 23, col: '#d9d2c4' });
    M.flamme(t, { x: CAMP.feu.x, y: plainY(CAMP.feu.x) + 44, s: 0.35, r: 30, seed: 9 });
    // tentes : rang du fond puis rang de devant (montent de la trappe), oriflammes, reflets
    const mk = clamp(ten * 1.3 - 0.3);                                                     // deux grands mâts à banderoles (montent avec les tentes)
    if (mk > 0) for (const [i, M_] of [[0, { x: 418, h: 760 }], [1, { x: 668, h: 700 }]]) {
      const yb = SB + (1 - easeOut(mk)) * 800, top = yb - M_.h * (1 - 0.35 * aff);
      c.save(); c.beginPath(); c.rect(0, 0, W, SB + 1); c.clip();
      pc([[M_.x - 4, yb, 1], [M_.x - 3, top + 8], [M_.x, top, 1], [M_.x + 3, top + 8], [M_.x + 4, yb, 1]], '#7a5a34', null, 6960 + i);
      pc(ell(M_.x, top - 4, 7, 7, 10), OR, null, 6962 + i);
      oriflamme(t, M_.x, top + 6, 1.6, { cols: i ? [ORT, BLEU] : [ORT, CRAM], w: [0.26, 0.74], len: 130, h: 26, ph: i * 2.1, amp: 1 - 0.85 * aff, queue: true });
      c.restore();
    }
    const up = (k, H) => SB + (1 - easeOut(k)) * H;
    const rowK = o.rang == null ? 1 : clamp(o.rang);
    if (rowK > 0) { c.save(); if (aff > 0) c.filter = `brightness(${1 - 0.2 * aff}) saturate(${1 - 0.4 * aff})`; M.flat(K.rang, W / 2, up(rowK, 180) - 118 + (aff * 26), { clipY: SB - 117 }); c.restore(); }
    for (const [i, T] of CAMP.tentes.entries()) {
      const k = clamp(ten * 1.3 - i * 0.075); if (k <= 0) continue;
      const yb = up(k, 340 * T.s) + wob(t, 0, 0, 1, 1), sq = 1 - 0.42 * aff, sk = (i % 2 ? 1 : -1) * 0.16 * aff;
      c.save(); c.beginPath(); c.rect(0, 0, W, SB + 1); c.clip();
      c.save(); c.globalAlpha = cast.a; c.translate(T.x + cast.dx, yb + cast.dy); c.transform(1, 0, sk, 1, 0, 0); c.scale(T.s, T.s * sq); c.drawImage(K.tentes[i].shadow, -K.tentes[i].width / 2 - 20, -K.tentes[i].height + 10 - 20); c.restore();
      if (aff > 0) c.filter = `brightness(${1 - 0.22 * aff}) saturate(${1 - 0.45 * aff})`;
      c.translate(T.x, yb); c.transform(1, 0, sk, 1, 0, 0); c.scale(T.s * (1 + 0.1 * aff), T.s * sq); c.drawImage(K.tentes[i], -K.tentes[i].width / 2, -K.tentes[i].height + 10);
      c.restore();
      const topY = yb - TENT_TOP * T.s * sq, topX = T.x + sk * (-TENT_TOP * T.s * sq);
      if (k > 0.6) oriflamme(t, topX, topY, T.s, { cols: [ORT, [CRAM, BLEU, '#4f6a4a', CRAM, BLEU][i]], w: [0.28, 0.72], ph: i * 1.3, amp: 1 - 0.85 * aff, pend: i === 1 ? o.decroche : 0, queue: true });
      if (ref * (1 - aff) * k > 0.05 && !SIL()) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const [j, [lx, ly]] of [[-52, -70], [34, -176], [62, -46], [-20, -150]].entries()) {
          const a = Math.pow(Math.max(0, Math.sin(g * 2.1 + i * 1.9 + j * 2.6)), 10) * ref * (1 - aff), px = T.x + lx * T.s, py = yb + ly * T.s * sq;
          if (a < 0.03) continue;
          const gr = c.createRadialGradient(px, py, 0, px, py, 16); gr.addColorStop(0, `rgba(255,236,170,${0.7 * a})`); gr.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = gr; c.fillRect(px - 16, py - 16, 32, 32);
          c.globalAlpha = a; fillPts([[px, py - 9], [px + 2.5, py], [px, py + 9], [px - 2.5, py]], '#fffbe8', 0, 0); fillPts([[px - 7, py], [px, py - 2], [px + 7, py], [px, py + 2]], '#fffbe8', 0, 0); c.globalAlpha = 1;
        }
        c.restore();
      }
    }
    // tribune et palissade de la lice
    if (o.lice) { M.flat(K.tribune, CAMP.tribune.x, SB, { cast }); for (const [i, x] of [-120, 0, 120].entries()) oriflamme(t, CAMP.tribune.x + x, SB - 520 + Math.abs(x) * 0.13, 0.7, { cols: [ORT, i % 2 ? BLEU : CRAM], w: [0.28, 0.72], ph: i, queue: true }); strokePts([[CAMP.tribune.x - 120, SB - 520 + 16], [CAMP.tribune.x - 120, SB - 450]], '#3a2a1a', 2); }
    // fontaine de vin (monte de la trappe)
    const fo = clamp(o.fontaine || 0);
    if (fo > 0) {
      const F = CAMP.fontaine, yb = SB + (1 - easeOut(fo)) * 460 + wob(t, 0, 0, 1, 1);
      M.flat(K.fontaine, F.x, yb, { clipY: SB + 1, cast });
      c.save(); c.beginPath(); c.rect(0, 0, W, SB + 1); c.clip(); c.translate(F.x, yb); jets(t, smooth(0.85, 1, fo)); c.restore();
    }
    // palais de toile (descend des cintres), coin qui se soulève (claque)
    const pa = clamp(o.palais || 0);
    if (pa > 0) {
      const P_ = CAMP.palais, yb = SB - (1 - easeOut(pa)) * 1300, cl = ease(clamp(o.claque || 0));
      c.save(); c.strokeStyle = 'rgba(30,22,14,0.75)'; c.lineWidth = 2; for (const dx of [-160, 160]) { c.beginPath(); c.moveTo(P_.x + dx, yb - 600); c.lineTo(P_.x + dx, 0); c.stroke(); } c.restore();
      if (cl > 0.01) {
        const L = (110 + 150 * cl) * (1 + 0.05 * Math.sin(g * 7)), Cx = P_.x + PAL_C[0], Cy = yb + PAL_C[1];
        M.flat(K.palaisDos, P_.x, yb);
        c.save(); c.beginPath(); c.rect(0, 0, W, SB + 2); c.moveTo(Cx - 2, Cy - 2); c.lineTo(Cx + L, Cy - 2); c.lineTo(Cx - 2, Cy + L); c.closePath(); c.clip('evenodd');
        M.flat(K.palais, P_.x, yb, { cast }); c.restore();
        const f = clamp(0.55 + 0.3 * cl + 0.12 * Math.sin(g * 5.3) + 0.06 * Math.sin(g * 11)), Cf = [Cx + f * L, Cy + f * L];
        if (!SIL()) { c.save(); c.globalAlpha = 0.3; fillPts([[Cx + L, Cy], [Cx, Cy + L], [Cf[0] + 10, Cf[1] + 12]], '#000', 0, 0); c.restore(); }
        pc([[Cx + L, Cy, 1], [Cx, Cy + L, 1], [Cf[0], Cf[1], 1]], '#d8ccae', () => { for (let i = 1; i < 4; i++) strokePts([lp2([Cx + L, Cy], Cf, i / 4), lp2([Cx, Cy + L], Cf, i / 4)], 'rgba(120,100,70,0.35)', 1); fillPts([lp2([Cx + L, Cy], Cf, 0.1), lp2([Cx, Cy + L], Cf, 0.1), [Cx, Cy + L], [Cx + L, Cy]], 'rgba(154,74,52,0.25)'); hatch(null, 0.6, 4, 0.2); }, 6990);
      } else M.flat(K.palais, P_.x, yb, { cast });
      for (const [i, dx] of [-191, 191].entries()) { oriflamme(t, P_.x + dx, yb - 722, 0.8, { cols: ['#e8e4d8', '#3f5a3a'], w: [0.3, 0.7], ph: 2 + i, queue: true }); strokePts([[P_.x + dx, yb - 722], [P_.x + dx, yb - 716]], '#3a2a1a', 2); }
      if (ref > 0.05 && !SIL()) { c.save(); c.globalCompositeOperation = 'lighter'; for (const [j, w] of PAL_WIN.entries()) { const a = (0.12 + 0.5 * Math.pow(Math.max(0, Math.sin(g * 1.3 + j * 1.1)), 6)) * ref; c.fillStyle = `rgba(255,240,200,${a})`; c.beginPath(); c.moveTo(P_.x + w[0], yb + w[1] + 30); c.lineTo(P_.x + w[0] + 30, yb + w[1]); c.lineTo(P_.x + w[0] + 44, yb + w[1]); c.lineTo(P_.x + w[0], yb + w[1] + 44); c.closePath(); c.fill(); } c.restore(); }
    }
    if (o.lice) M.flat(K.lice, CAMP.lice.x, SB, { cast: { dx: 10, dy: 4, a: 0.25 } });
    if (o.guirlande !== false) { guirlande(t, 40, 1040, 300, 92, 0, aff); guirlande(t, 40, 1040, 250, 60, 1.7, aff); }
  };
  // guirlande de fanions unis tendue sous les cintres (bouge au vent)
  function guirlande(t, x0, x1, y, sag, ph, aff) {
    if (SIL()) return; const g = M.tg(t), n = 22, C_ = [ORT, CRAM, IVO, BLEU, ORT, '#4f6a4a'], sw = 6 * Math.sin(g * 1.1 + ph) * (1 - 0.7 * aff);
    const P_ = []; for (let i = 0; i <= n; i++) { const u = i / n; P_.push([lerp(x0, x1, u) + sw * Math.sin(PI * u), y + (sag + 30 * aff) * Math.sin(PI * u)]); }
    strokePts(P_, 'rgba(50,35,20,0.85)', 1.6);
    for (let i = 0; i < n; i++) { const a = P_[i], b = P_[i + 1], m = lp2(a, b, 0.5), fl = Math.sin(g * 3.2 + i * 0.9 + ph) * 4 * (1 - 0.8 * aff); fillPts([[a[0] + 3, a[1]], [b[0] - 3, b[1]], [m[0] + fl, m[1] + 30 + 8 * aff]], C_[(i + (ph ? 2 : 0)) % C_.length], 0, 0); strokePts([[a[0] + 3, a[1]], [m[0] + fl, m[1] + 30 + 8 * aff], [b[0] - 3, b[1]]], 'rgba(40,25,10,0.6)', 1); }
    for (const x of [x0, x1]) strokePts([[x, y - 2], [x, 0]], 'rgba(30,22,14,0.7)', 1.6);
  }
  const easeOut = M.easeOut, wob = M.wob;
  // après M.drawFloor() : sable de la lice (o.lice)
  DOR.campSol = function (t, o) {
    o = o || {}; if (!o.lice || SIL()) return; const c = cx_(), L = CAMP.lice;
    c.save(); c.fillStyle = 'rgba(214,190,140,0.6)'; c.beginPath(); c.ellipse(L.x, L.y, 330, 34, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(150,120,80,0.35)'; c.lineWidth = 1.4; for (let i = -4; i <= 4; i++) { c.beginPath(); c.ellipse(L.x, L.y, 300 - Math.abs(i) * 10, 4, 0, PI * 0.1, PI * 0.9); c.translate(0, 6 * Math.sign(i) * 0); c.stroke(); }
    c.restore();
  };
  // après les marionnettes : tonneaux, panier de pain, piquets et cordes, bannière, herbes (sur les côtés seulement)
  DOR.campAvant = function (t, o) {
    o = o || {}; const K = DOR.K, c = cx_(), g = M.tg(t), sh = { dx: 10, dy: 4, a: 0.25 };
    M.flat(K.tonneau, 112, 1606, { cast: sh });
    M.flat(K.panier, 238, 1622, { cast: sh });
    for (const x of [840, 1000]) pc([[x - 5, 1632, 1], [x - 5, 1520], [x, 1508, 1], [x + 5, 1520], [x + 5, 1632, 1]], '#6e5232', () => hatch(null, 1.5, 4, 0.25), 7001 + x);
    const sag = 26 + 4 * Math.sin(g * 1.6);
    strokePts(qbez([840, 1528], [920, 1528 + sag], [1000, 1528], 10), '#6a5232', 3); strokePts(qbez([840, 1528], [920, 1528 + sag], [1000, 1528], 10), 'rgba(200,170,120,0.6)', 1);
    strokePts([[1000, 1530], [1040, 1640]], '#6a5232', 2.4);
    pc(rect(956, 1250, 964, 1640), '#5a3f2a', null, 7010);
    oriflamme(t, 960, 1262, 1.2, { cols: [ORT, NUIT, ORT], w: [0.14, 0.72, 0.14], len: 60, h: 120, ph: 0.4, amp: 0.4 });
    if (!SIL()) { M.fleurs(t, { x0: 40, x1: 300, y: 1652, n: 14, h: 34, seed: 31, herbe: true }); M.fleurs(t, { x0: 800, x1: 1050, y: 1652, n: 12, h: 30, seed: 37, herbe: true }); }
  };

  // ------------------------------------------------------------ LA SALLE DE GRAVELINES
  const SAL = {
    table: { x: 540, y: 1185, x0: 400, x1: 680 }, tabourets: [{ x: 330, dir: 1 }, { x: 750, dir: -1 }],
    fenetre: { x0: 770, x1: 910, y0: 430, y1: 650 }, foyer: { x: 190, y: 1385 }, chandelle: { x: 432, y: 1185 },
    pichet: { x: 520, y: 1185 }, gobelets: [{ x: 600, y: 1185 }, { x: 636, y: 1185 }], sablier: { x: 664, y: 1185 },
    seau: { x: 930, y: 1606 }, banc: { x: 190, y: 1612 }, plancher: FEET,
  };
  DOR.SAL = SAL;
  function makeSalleVue() {
    const F = SAL.fenetre;
    return M.pre(F.x1 - F.x0, F.y1 - F.y0, (c, cv) => {
      const w = cv.width, h = cv.height, gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6c7480'); gr.addColorStop(0.7, '#9aa0a4'); gr.addColorStop(1, '#a8aca8');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const R = M.rng(81); for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(70,76,88,${0.25 + R() * 0.2})`; c.beginPath(); c.ellipse(R() * w, R() * h * 0.5, 40 + R() * 40, 12 + R() * 10, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#7d8a8c'; c.fillRect(0, h * 0.72, w, 14); c.fillStyle = '#4f5a48'; c.beginPath(); c.moveTo(0, h * 0.8); for (let x = 0; x <= w; x += 10) c.lineTo(x, h * 0.78 + 6 * Math.sin(x * 0.08)); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    });
  }
  function makeSalleFond() {
    const F = SAL.fenetre;
    return M.pre(W, HB, (c) => {
      c.fillStyle = '#e2d9c6'; c.fillRect(0, 0, W, HB);
      const R = M.rng(83);
      for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(${R() < 0.5 ? '150,130,100' : '255,250,240'},${0.03 + R() * 0.05})`; c.beginPath(); c.ellipse(R() * W, 340 + R() * 1000, 20 + R() * 70, 10 + R() * 40, R() * 3, 0, TAU); c.fill(); }
      const low = c.createLinearGradient(0, 1180, 0, HB); low.addColorStop(0, 'rgba(110,90,60,0)'); low.addColorStop(1, 'rgba(110,90,60,0.28)'); c.fillStyle = low; c.fillRect(0, 1180, W, HB - 1180);
      for (let x = 30; x < W; x += 78) { pc(rect(x, 150, x + 30, 306), '#3e2c1c', () => hatch(null, 1.5, 4, 0.25), 7101 + x); }
      pc(rect(0, 296, W, 350), '#4a3422', () => { strokePts([[0, 302], [W, 302]], 'rgba(200,160,110,0.3)', 1.4); hatch(null, 0.1, 5, 0.3); for (let x = 40; x < W; x += 140) strokePts([[x, 310], [x + 60, 330]], 'rgba(20,10,5,0.4)', 1.2); }, 7120);
      for (const x of [26, 1014]) pc(rect(x, 350, x + 40, HB), '#4a3422', () => hatch(null, 1.5, 4, 0.3), 7130 + x);
      pc([[66, 470], [120, 350], [138, 350], [86, 470]], '#4a3422', null, 7140);
      pc([[1014, 470], [960, 350], [942, 350], [994, 470]], '#4a3422', null, 7141);
      // cheminée modeste à gauche : hotte plâtrée, manteau, jambages de pierre, âtre
      pc([[70, 990, 1], [112, 760, 1], [128, 350, 1], [252, 350, 1], [268, 760, 1], [310, 990, 1]], '#cbbfa6', () => { hatch(null, 0.8, 5, 0.16); shade(80, 0, 300, 0, 0.22); strokePts([[112, 760], [268, 760]], 'rgba(90,70,50,0.4)', 2); for (let i = 0; i < 5; i++) strokePts([[150 + i * 18, 900], [156 + i * 16, 700]], 'rgba(40,30,25,0.12)', 6); }, 7150);
      pc(rect(52, 978, 328, 1012), '#a89c84', () => { strokePts([[56, 984], [324, 984]], 'rgba(255,250,235,0.4)', 1.4); hatch(null, 0.1, 4, 0.2); }, 7151);
      for (const [x0, x1] of [[70, 112], [268, 310]]) pc(rect(x0, 1012, x1, HB), '#b2a68c', () => { for (let y = 1040; y < HB; y += 56) strokePts([[x0, y], [x1, y]], 'rgba(80,70,50,0.45)', 1.2); hatch(null, 0.8, 4, 0.2); }, 7152 + x0);
      pc(rect(112, 1012, 268, HB), '#2a1c14', () => { for (let y = 1030; y < HB; y += 16) for (let x = 112 + ((y / 16) % 2) * 12; x < 268; x += 24) fillPts(rect(x + 1, y + 1, x + 22, y + 14), 'rgba(90,40,25,0.35)'); shade(190, 1012, 190, HB, 0.4); }, 7155);
      for (const sg of [-1, 1]) pc(rect(190 + sg * 46 - 4, 1330, 190 + sg * 46 + 4, 1392), '#2a2826', null, 7160 + sg);
      pc([[124, 1366, 1], [254, 1356, 1], [256, 1374, 1], [126, 1384, 1]], '#3a2414', () => fillPts([[250, 1358], [256, 1360], [256, 1372], [250, 1372]], '#c46a2a'), 7162); pc([[134, 1382, 1], [248, 1372, 1], [246, 1390, 1], [136, 1394, 1]], '#2e1c10', null, 7163);
      // fenêtre : embrasure profonde, appui ; le trou est découpé
      pc(rect(F.x0 - 22, F.y0 - 22, F.x1 + 22, F.y1 + 26), '#cfc4ae', () => { fillPts([[F.x0 - 22, F.y0 - 22], [F.x0, F.y0], [F.x0, F.y1], [F.x0 - 22, F.y1 + 26]], 'rgba(90,70,50,0.18)'); hatch(null, 0.8, 4, 0.15); }, 7170);
      pc(rect(F.x0 - 32, F.y1 + 10, F.x1 + 32, F.y1 + 28), '#a89c84', null, 7171);
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.restore();
      // étagère : deux écuelles et un petit pot
      pc(rect(430, 690, 612, 704), '#5e4028', () => strokePts([[432, 692], [610, 692]], 'rgba(255,220,180,0.3)', 1.2), 7180);
      for (const x of [446, 590]) pc([[x, 704], [x + 10, 704], [x + 10, 740], [x, 712]], '#4a3220', null, 7181 + x);
      for (const [x, col] of [[476, '#8a6a44'], [532, '#9a6a3a']]) pc([[x - 26, 668], [x + 26, 668], [x + 18, 688], [x - 18, 688]], col, () => { strokePts([[x - 22, 672], [x + 22, 672]], 'rgba(40,20,10,0.5)', 1.2); shade(x - 20, 0, x + 20, 0, 0.3); }, 7183 + x);
      pc([[578, 690], [574, 664], [580, 654], [596, 654], [602, 664], [598, 690]], TERRE, () => shade(576, 0, 600, 0, 0.3), 7186);
      // tache d'humidité sous la fenêtre, fissure, patère avec une cape et une besace, bouquet d'herbes sèches pendu à la poutre
      for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(120,110,80,${0.06 + i * 0.012})`; c.beginPath(); c.ellipse(F.x0 + 40 + i * 6, F.y1 + 60 + i * 26, 30 - i * 3, 22, 0, 0, TAU); c.fill(); }
      strokePts([[640, 420], [652, 470], [646, 520], [660, 590]], 'rgba(90,75,55,0.45)', 1.4);
      pc(rect(612, 800, 760, 812), '#5e4028', null, 7191); for (const x of [636, 690, 738]) pc(ell(x, 806, 5, 5, 8), '#3a2a1a', null, 7192 + x);
      pc([[620, 810], [652, 810], [664, 880], [672, 1010, 1], [610, 1016, 1], [604, 900]], '#4e5258', () => { for (const x of [618, 634, 650]) strokePts([[x + 6, 820], [x, 1010]], 'rgba(20,20,25,0.45)', 1.4); hatch(null, 0.8, 4, 0.2); }, 7195);
      strokePts(qbez([680, 808], [700, 870], [726, 812], 8), '#6a4a2c', 2.4); pc(rrect(684, 856, 730, 906, 8), '#8a6a3a', () => { strokePts([[686, 868], [728, 868]], 'rgba(60,40,20,0.6)', 1.4); dot(708, 880, 3, '#3a2a1a'); }, 7196);
      for (let i = 0; i < 7; i++) { const x = 594 + i * 5, l = 70 + (i % 3) * 14; strokePts([[600, 350], [x, 350 + l]], i % 2 ? '#7a8a4a' : '#8a7a3a', 2.2); fillPts(ell(x, 350 + l, 4, 7, 6), i % 2 ? '#6a7a3a' : '#9a8a4a'); }
      strokePts([[590, 356], [612, 356]], '#8a2a2a', 3);
      // coffre de bois simple au fond à droite
      pc([[900, HB, 1], [900, 1290], [912, 1276], [1010, 1276], [1022, 1290], [1022, HB, 1]], '#6e4a2c', () => { for (const x of [930, 990]) fillPts(rect(x - 5, 1276, x + 5, HB), '#3a3634'); fillPts(rect(954, 1300, 968, 1318), '#3a3634'); hatch(null, 1.5, 4, 0.25); }, 7190);
    });
  }
  function makeVitre() {
    const F = SAL.fenetre;
    return M.pre(F.x1 - F.x0, F.y1 - F.y0, (c, cv) => {
      c.fillStyle = 'rgba(190,205,212,0.22)'; c.fillRect(0, 0, cv.width, cv.height);
      c.strokeStyle = 'rgba(40,40,44,0.85)'; c.lineWidth = 2;
      for (let d = -cv.height; d < cv.width + cv.height; d += 26) { c.beginPath(); c.moveTo(d, 0); c.lineTo(d + cv.height * 0.6, cv.height); c.stroke(); c.beginPath(); c.moveTo(d, 0); c.lineTo(d - cv.height * 0.6, cv.height); c.stroke(); }
      c.fillStyle = '#4a3422'; c.fillRect(cv.width / 2 - 4, 0, 8, cv.height); c.lineWidth = 6; c.strokeStyle = '#4a3422'; c.strokeRect(3, 3, cv.width - 6, cv.height - 6);
    });
  }
  function makeTable() {
    const cv = M.cutFlat(360, 250, 180, 240, () => {
      for (const sg of [-1, 1]) { pc([[sg * 112 - 8, -196], [sg * 112 + 8, -196], [sg * 124 + 8, 0, 1], [sg * 124 - 8, 0, 1]], '#5e4028', () => hatch(null, 1.5, 4, 0.25), 7201 + sg); pc([[sg * 98 - 6, -196], [sg * 98 + 6, -196], [sg * 86 + 6, 0, 1], [sg * 86 - 6, 0, 1]], '#4a3220', null, 7203 + sg); }
      pc(rect(-118, -70, 118, -58), '#4a3220', null, 7205);
      pc(rect(-150, -212, 150, -194), '#8a6440', () => { strokePts([[-148, -208], [148, -208]], 'rgba(255,230,190,0.4)', 1.4); for (const x of [-60, 40]) strokePts([[x, -212], [x, -194]], 'rgba(40,20,10,0.4)', 1); hatch(null, 0.05, 4, 0.2); }, 7206);
    }); cv.padB = 10; return M.withShadow(cv, 8);
  }
  function chandelle(t, x, y) {
    pc([[x - 20, y, 1], [x + 20, y, 1], [x + 8, y - 8], [x + 3, y - 30], [x - 3, y - 30], [x - 8, y - 8]], '#2e2c2a', () => strokePts([[x - 14, y - 2], [x + 14, y - 2]], 'rgba(150,150,150,0.4)', 1), 7301);
    strokePts(qbez([x + 8, y - 6], [x + 30, y - 16], [x + 22, y - 32], 8), '#2e2c2a', 3);
    pc(rect(x - 6, y - 76, x + 6, y - 30), '#efe6cc', () => { fillPts([[x - 6, y - 76], [x + 6, y - 76], [x + 6, y - 66], [x + 2, y - 60], [x - 6, y - 70]], '#fff8e4'); shade(x - 6, 0, x + 6, 0, 0.25); }, 7302);
    strokePts([[x, y - 76], [x, y - 82]], '#1a1a1a', 1.4);
    M.flamme(t, { x, y: y - 80, s: 0.8, r: 120, seed: 13 });
  }
  function sablier(t, x, y) {
    const g = M.tg(t), u = ((g / 30) % 1 + 1) % 1;
    for (const yy of [y, y - 54]) pc(rect(x - 16, yy - 6, x + 16, yy), '#5e4028', null, 7310 + yy);
    for (const sg of [-1, 1]) strokePts([[x + sg * 14, y - 6], [x + sg * 14, y - 48]], '#4a3220', 2.4);
    pc([[x - 11, y - 48], [x + 11, y - 48], [x + 2, y - 27], [x + 11, y - 6], [x - 11, y - 6], [x - 2, y - 27]], 'rgba(220,235,240,0.5)', () => {
      fillPts([[x - 9 * (1 - u), y - 30 - 16 * (1 - u)], [x + 9 * (1 - u), y - 30 - 16 * (1 - u)], [x, y - 29]], '#c9a868');
      fillPts([[x - 10, y - 6], [x + 10, y - 6], [x + 4 * (1 - u) + 2, y - 8 - 14 * u], [x - 4 * (1 - u) - 2, y - 8 - 14 * u]], '#c9a868');
      strokePts([[x, y - 28], [x, y - 8 - 14 * u]], '#c9a868', 1);
    }, 7315, { texA: 0.2 });
  }
  // salle : o.volet 0..1 (le volet se ferme), o.feu 0..1 (défaut 1), o.pichet / o.chandelle / o.sablier (défaut true), o.gobelets (0, 1 ou 2 ; défaut 2), o.cast
  DOR.salle = function (t, o) {
    o = o || {}; const K = DOR.K, c = cx_(), g = M.tg(t), F = SAL.fenetre, cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    c.drawImage(K.sVue, F.x0, F.y0);
    if (!SIL()) {                                                                       // pluie : traits obliques et gouttes qui ruissellent sur la vitre
      c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip(); c.strokeStyle = 'rgba(220,226,232,0.55)'; c.lineWidth = 1.2;
      const R = M.rng(91); for (let i = 0; i < 40; i++) { const x = F.x0 + R() * 180, sp = 700 + R() * 300, y = F.y0 - 40 + ((g * sp + R() * 400) % 300); c.beginPath(); c.moveTo(x - (y - F.y0) * 0.18, y); c.lineTo(x - (y - F.y0) * 0.18 - 5, y + 22); c.stroke(); }
      for (let i = 0; i < 7; i++) { const x = F.x0 + 10 + R() * 120, u = ((g * (0.12 + R() * 0.1) + R()) % 1), y = F.y0 + u * (F.y1 - F.y0); c.strokeStyle = 'rgba(235,240,245,0.5)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, F.y0 + u * (F.y1 - F.y0) * 0.6); c.lineTo(x + Math.sin(u * 9) * 2, y); c.stroke(); dot(x + Math.sin(u * 9) * 2, y, 2.4, 'rgba(240,244,248,0.7)'); }
      c.restore();
    }
    c.drawImage(K.vitre, F.x0, F.y0);
    c.drawImage(K.sFond, 0, 0);
    // volet de bois (charnière au bord droit de la fenêtre)
    const vo = ease(clamp(o.volet || 0)), Wv = F.x1 - F.x0, fx = F.x1 + Wv * Math.cos(PI * vo), inner = Math.cos(PI * vo) < 0;
    pc([[F.x1, F.y0 - 4, 1], [fx, F.y0 - 4 + 6 * Math.sin(PI * vo), 1], [fx, F.y1 + 4 - 6 * Math.sin(PI * vo), 1], [F.x1, F.y1 + 4, 1]], inner ? '#6e4a2c' : '#5a3c22', () => { const n = 4; for (let i = 1; i < n; i++) strokePts([[lerp(F.x1, fx, i / n), F.y0], [lerp(F.x1, fx, i / n), F.y1]], 'rgba(30,15,5,0.5)', 1.4); for (const yy of [F.y0 + 40, F.y1 - 40]) fillPts([[F.x1, yy - 5], [fx, yy - 5], [fx, yy + 5], [F.x1, yy + 5]], 'rgba(40,40,40,0.55)'); hatch(null, 1.5, 4, 0.25); }, 7400);
    // feu de l'âtre, lueur, fumée qui monte dans la hotte
    const feu = o.feu == null ? 1 : clamp(o.feu), Fo = SAL.foyer;
    if (feu > 0.02) {
      c.save(); c.beginPath(); c.rect(112, 1012, 156, HB - 1012); c.clip(); c.globalAlpha = feu;
      for (const [dx, s, sd] of [[-34, 1.5, 1], [0, 2.1, 2], [32, 1.4, 3], [-12, 1.2, 4], [16, 1.6, 5]]) M.flamme(t, { x: Fo.x + dx, y: Fo.y - 14, s, r: 110, seed: sd, lueur: sd === 2 });
      M.fumee(t, { x: Fo.x, y: Fo.y - 80, s: 0.5, n: 5, haut: 260, vent: 0, a: 0.4, per: 3.2, seed: 41, col: '#9a948a' });
      c.restore();
      if (!SIL()) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = feu * (0.1 + 0.03 * Math.sin(g * 9) + 0.02 * Math.sin(g * 23)); const gr = c.createRadialGradient(Fo.x, Fo.y - 60, 10, Fo.x, Fo.y - 60, 320); gr.addColorStop(0, '#ff9a40'); gr.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = gr; c.fillRect(Fo.x - 320, Fo.y - 380, 640, 400); c.restore(); }
    }
    M.flat(K.table, SAL.table.x, SB, { cast });
    if (o.chandelle !== false) chandelle(t, SAL.chandelle.x, SAL.chandelle.y);
    if (o.pichet !== false) DOR.pichet(SAL.pichet.x, SAL.pichet.y, 0.8, { t });
    const ng = o.gobelets == null ? 2 : o.gobelets; for (let i = 0; i < ng; i++) DOR.gobelet(SAL.gobelets[i].x, SAL.gobelets[i].y, 0.8, { t, niveau: o.vin == null ? 1 : o.vin });
    if (o.sablier !== false) sablier(t, SAL.sablier.x, SAL.sablier.y);
  };
  // après M.drawFloor(), avant les marionnettes : les deux tabourets (o.tabourets : tableau de {x, dir} ; false = aucun)
  DOR.salleMeubles = function (t, o) { o = o || {}; const L = o.tabourets === false ? [] : (o.tabourets || SAL.tabourets); for (const T of L) DOR.tabouret(T.x, T.y || FEET, T.s || 0.9, { dir: T.dir || 1 }); };
  // après les marionnettes : banc (souris dessous : o.souris = instant), seau (goutte du plafond : o.goutte = instant), balai
  DOR.salleAvant = function (t, o) {
    o = o || {}; const K = DOR.K, c = cx_(), g = M.tg(t), sh = { dx: 10, dy: 4, a: 0.25 }, S = SAL.seau, B = SAL.banc;
    if (o.souris != null) { const u = (t - o.souris) / 1.8; if (u > 0 && u < 1) souris(lerp(B.x + 170, B.x - 190, u), B.y - 2, t); }
    M.flat(K.banc, B.x, B.y, { cast: sh });
    pc([[1006, 1630, 1], [1050, 1260], [1056, 1262], [1014, 1632, 1]], '#7a5a34', null, 7501);
    pc([[990, 1640, 1], [1000, 1594], [1026, 1594], [1040, 1640, 1]], '#c9a868', () => { for (let x = 994; x < 1040; x += 5) strokePts([[x + 6, 1596], [x, 1640]], 'rgba(120,90,40,0.6)', 1); }, 7502);
    M.flat(K.seau, S.x, S.y, { cast: sh });
    if (!SIL()) { c.save(); c.globalAlpha = 0.5 + 0.3 * Math.sin(g * 2.2); strokePts([[S.x - 24, S.y - 89], [S.x + 10, S.y - 91]], 'rgba(255,255,255,0.8)', 1.4); c.restore(); }
    if (o.goutte != null && !SIL()) {
      const u = t - o.goutte, y0 = 350, y1 = S.y - 92, T_ = Math.sqrt(2 * (y1 - y0) / 2600);
      if (u > -0.6 && u < 0) { const k = clamp((u + 0.6) / 0.6); fillPts(ell(S.x, y0 + 4 * k, 3 + 2 * k, 4 + 3 * k, 10), 'rgba(170,200,220,0.85)'); }
      else if (u >= 0 && u < T_) { const y = y0 + 0.5 * 2600 * u * u; fillPts([[S.x, y - 12], [S.x + 5, y], [S.x, y + 5], [S.x - 5, y]], 'rgba(170,200,220,0.9)'); }
      else if (u >= T_ && u < T_ + 0.6) { const v = (u - T_) / 0.6; c.save(); c.strokeStyle = `rgba(220,235,245,${0.9 * (1 - v)})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(S.x, y1 + 2, 6 + 30 * v, 2 + 4 * v, 0, 0, TAU); c.stroke(); for (const sg of [-1, 1]) dot(S.x + sg * 10 * v, y1 - 18 * Math.sin(PI * v), 2.2 * (1 - v), 'rgba(200,220,235,0.9)'); c.restore(); }
    }
  };
  function souris(x, y, t) {
    const c = cx_(), ph = t * 22; c.save(); c.translate(x, y); c.scale(-1, 1);
    pc([[-14, -2], [-10, -10], [2, -12], [12, -8], [18, -4], [16, -1], [-12, 0]], '#7a726a', () => dot(13, -7, 1.3, '#111'), 7601);
    pc(ell(4, -12, 4, 4, 8), '#9a8e84', null, 7602);
    strokePts(qbez([-14, -3], [-26, -10 + 3 * Math.sin(ph)], [-34, -4], 6), '#8a7a70', 1.4);
    for (const [lx, o] of [[-8, 0], [8, PI]]) strokePts([[lx, -1], [lx + 3 * Math.sin(ph + o), 2]], '#5a524a', 1.4);
    c.restore();
  }
  function makeBanc() { const cv = M.cutFlat(320, 150, 160, 140, () => { for (const x of [-110, 104]) pc([[x - 7, -70], [x + 7, -70], [x + 10, 0, 1], [x - 4, 0, 1]], '#5e4028', () => hatch(null, 1.4, 4, 0.25), 7701 + x); pc(rect(-140, -84, 140, -68), '#7a5634', () => { strokePts([[-136, -80], [136, -80]], 'rgba(255,230,190,0.35)', 1.4); hatch(null, 0.1, 4, 0.2); }, 7703); }); cv.padB = 10; return M.withShadow(cv, 8); }
  function makeSeau() { const cv = M.cutFlat(160, 160, 80, 150, () => { pc([[-44, -92], [44, -92], [36, 0, 1], [-36, 0, 1]], '#7a5232', () => { for (let x = -40; x < 44; x += 13) strokePts([[x, -92], [x * 0.84, 0]], 'rgba(40,20,10,0.5)', 1.2); for (const y of [-78, -18]) fillPts(rect(-48, y, 48, y + 7), '#3a3634'); }, 7801); fillPts(ell(0, -92, 42, 6, 14), '#5a7a8a'); strokePts(qbez([-44, -86], [0, -160], [44, -86], 12), '#3a3634', 2.4); }); cv.padB = 10; return M.withShadow(cv, 8); }

  // boîte englobante écran d'une marionnette rendue (pièces du corps, sans objet tenu) : {x0, y0, x1, y1, h}
  DOR.mesure = function (r, sauf) { const P_ = partPoly(r.def, r.q, r.mats, sauf); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const v of P_) { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); } return { x0, y0, x1, y1, h: y1 - y0, w: x1 - x0 }; };
  // un lieu dans M.vignette : fn() dessine en coordonnées de scène (plancher FEET, centre x 540), réduit de k et recadré sur le médaillon
  DOR.dansVignette = function (cx, cy, ry, k, fn) { const c = cx_(); c.save(); c.translate(cx - 540 * k, cy + ry * 0.62 - FEET * k); c.scale(k, k); fn(); c.restore(); };
  // ------------------------------------------------------------ pré-rendus
  DOR.init = function () {
    DOR.K = {
      ciel: makeCampCiel(), plaine: makeCampPlaine(), rang: makeTentRow(), tentes: CAMP.tentes.map((T, i) => makeTent(T.cols, 6050 + i * 13)),
      palais: makePalais(), palaisDos: makePalaisDos(), fontaine: makeFontaine(), lice: makeLice(), tribune: makeTribune(), tonneau: makeTonneau(), panier: makePanierPain(),
      sVue: makeSalleVue(), sFond: makeSalleFond(), vitre: makeVitre(), table: makeTable(), banc: makeBanc(), seau: makeSeau(),
    };
    return DOR.K;
  };
})();
