// persos.js — « Wonder Woman, l'héroïne née d'un détecteur de mensonges » (Harvard 1915 → tribunal 1922 → New York 1940-41) : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.ww (alias WW). Appeler WW.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun tirage aléatoire) : fonction pure de t.
// INDEX : 1) géométrie  2) objets (poire, sac, corde, détecteur, couvertures, brassard)  3) moteur de pose (objets tenus, IK, jambes à genou)
//         4) Marston  5) Wonder Woman  6) le méchant  7) héros à cape bleue / noire  8) lasso  9) accessoires seuls  10) décor rue de New York
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const WW = (M.ww = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = M.ST.back;
  const W = M.W;

  // =====================================================================
  // 1) GÉOMÉTRIE
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function rrect(x0, y0, x1, y1, r) { return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5)); }
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const fr = (x) => x - Math.floor(x);
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
  function star(cx, cy, r1, r2, n, rot) { n = n || 5; rot = rot == null ? -PI / 2 : rot; const o = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + i * PI / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a), 1]); } return o; }
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function mixA(a, b, k, al) { const A = hx(a), B = hx(b); k = clamp(k); const v = A.map((x, i) => Math.round(lerp(x, B[i], k))); return al == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${al})`; }
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);
  // ligne rééchantillonnée tous les `pas` px (pour la tresse de la corde)
  function resample(pts, pas) {
    const o = [pts[0]]; let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = pas - acc;
      while (d <= l) { o.push([lerp(a[0], b[0], d / l), lerp(a[1], b[1], d / l)]); d += pas; }
      acc = (acc + l) % pas;
    }
    return o;
  }
  const GOLD = '#C9A23A', GOLDL = '#f0d98a', GOLDD = '#6d5418';
  // corde dorée tressée : trait sombre, or, reflet, petits traits obliques ; w = largeur (px écran à l'intérieur d'une marionnette)
  function corde(pts, w, sansTresse) {
    strokePts(pts, GOLDD, w + 2.4); strokePts(pts, GOLD, w);
    if (SIL()) return;
    strokePts(pts.map((p) => [p[0] - w * 0.18, p[1] - w * 0.22]), 'rgba(250,232,160,0.75)', Math.max(1, w * 0.28));
    if (sansTresse) return;
    const r = resample(pts, Math.max(5, w * 1.3));
    for (let i = 1; i < r.length; i++) { const a = r[i - 1], b = r[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      strokePts([[b[0] + nx * w * 0.45 - dx * 0.25, b[1] + ny * w * 0.45 - dy * 0.25], [b[0] - nx * w * 0.45 + dx * 0.25, b[1] - ny * w * 0.45 + dy * 0.25]], 'rgba(90,64,16,0.6)', Math.max(0.8, w * 0.16)); }
  }
  function tube(pts, w) { strokePts(pts, '#0c0b0b', w + 1.6); strokePts(pts, '#232122', w); if (!SIL()) strokePts(pts.map((p) => [p[0] - w * 0.2, p[1] - w * 0.25]), 'rgba(180,180,190,0.35)', Math.max(0.8, w * 0.22)); }

  // =====================================================================
  // 2) OBJETS (dessinés à l'échelle 1 ; repère propre à chaque objet)
  // =====================================================================
  // ---- poire de caoutchouc du détecteur (Marston la presse) : repère = centre de la poire ; embout vers le haut (tube)
  function drawPoire(o) {
    const p = clamp(o.presse || 0), sx = 1 + 0.16 * p, sy = 1 - 0.2 * p;
    pc(rect(-5, -32, 5, -16), '#232122', () => strokePts([[-3, -30], [-3, -18]], 'rgba(200,200,210,0.4)', 1), 9301, { drop: false });
    pc(ell(0, 3, 17 * sx, 22 * sy, 18), '#6e2620', () => {
      strokePts(ep(-6, -2, 7, 11, 8, PI * 1.05, PI * 1.6), 'rgba(255,200,190,0.5)', 2.2);
      hatch(null, 0.8, 3.4, 0.2); shade(16, 0, -16, 0, 0.32, [-30, -30, 30, 40]);
    }, 9302);
  }
  // ---- sac de butin (toile, cou ficelé, sans inscription) : repère = centre ; prise au cou
  function drawSac(o) {
    const body = [[-15, -34], [15, -34], [24, -18], [40, 2], [48, 30], [44, 58], [24, 74, 1], [-24, 74, 1], [-44, 58], [-48, 30], [-40, 2], [-24, -18]];
    pc(body, '#8a7d62', () => {
      hatch(null, 0.7, 3.4, 0.26); hatch(null, -0.7, 5, 0.12);
      strokePts([[-28, 8], [-14, 62]], 'rgba(60,50,35,0.4)', 1.3); strokePts([[12, -4], [26, 58]], 'rgba(60,50,35,0.35)', 1.3);
      fillPts(rect(8, 26, 30, 46), '#a29473');                                                                 // pièce rapiécée
      for (let k = 0; k < 6; k++) strokePts([[8 + k * 4, 25], [9 + k * 4, 28]], 'rgba(50,40,30,0.6)', 1);
      shade(40, 20, -40, 20, 0.32, [-60, -40, 60, 80]);
    }, 9310);
    pc([[-15, -34], [15, -34], [22, -48], [10, -56], [-10, -56], [-22, -48]], '#9a8c6e', () => { for (let x = -14; x <= 14; x += 5) strokePts([[x, -36], [x * 1.2, -54]], 'rgba(60,50,35,0.45)', 1); }, 9311);
    strokePts([[-17, -37], [17, -37]], '#5a4026', 3.4); strokePts([[14, -37], [22, -26], [18, -20]], '#5a4026', 2.4);
  }
  // ---- corde du lasso tenue au poing (petit écheveau qui pend sous la main) : repère = poing ; 'bout' = sortie de la corde vers l'avant
  function drawCorde(o) {
    for (let k = 0; k < 3; k++) corde(ep(-6 - k * 3, 22 + k * 3, 13 + k * 2, 22 + k * 3, 14, -PI * 0.35, PI * 1.35), 4.2, true);
    corde([[2, -2], [14, -6]], 4.6, true);
  }
  // ---- brassard (manchette de tension gris anthracite, boucle de laiton) : repère = centre ; o.ang oriente le long du bras
  function drawManchette(ang) {
    const c = cx_(); c.save(); c.rotate(ang || 0);
    pc(rrect(-24, -15, 24, 15, 6), '#35373b', () => {
      for (const y of [-11, 11]) strokePts([[-21, y], [21, y]], 'rgba(200,200,205,0.35)', 1, false);
      hatch(null, 0.8, 3.2, 0.22); shade(0, -15, 0, 15, 0.3, [-26, -16, 26, 16]);
    }, 9320);
    pc(rrect(10, -9, 22, 9, 2), '#b08a3a', () => strokePts([[12, -6], [20, -6]], 'rgba(255,240,190,0.6)', 1), 9321, { drop: false });
    c.restore();
  }

  // ---- LE DÉTECTEUR : boîte d'acajou sur pieds de laiton, grand cadran ivoire (Ø 160) secteur vert / rouge sans chiffre, aiguille noire,
  //      tambour enregistreur avec stylet, poire et brassard reliés par des tubes noirs souples. Repère = sol (milieu des pieds ou des roues).
  const DT = { w: 112, top: -228, bot: -28, cad: -128, R: 80, A0: -PI * 0.83, A1: -PI * 0.17 };
  const dtH0 = (o) => (o.chariot ? -116 : 0);
  function drawChariot(o) {
    const rr = 42, a = (o.roule || 0) / rr;
    pc([[-136, -116], [134, -116], [134, -100], [-136, -100]], '#8a5a34', () => { strokePts([[-132, -112], [130, -112]], 'rgba(255,220,170,0.35)', 1.4); hatch(null, 0.1, 4, 0.18); }, 9330);
    pc([[-120, -100], [118, -100], [110, -88], [-112, -88]], '#6e4626', null, 9331, { drop: false });
    pc(bar([-136, -108], [-226, -246], 10), '#7a4e2c', () => hatch(null, 0.8, 3, 0.2), 9332);                      // brancard
    pc(ell(-230, -250, 10, 10, 12), '#5a3a20', () => strokePts([[-235, -254], [-229, -257]], 'rgba(255,220,170,0.4)', 1.2), 9333);   // poignée
    for (const wx of [-78, 78]) {
      pc(ell(wx, -rr, rr, rr, 24), '#5a3a20', () => {
        fillPts(ell(wx, -rr, rr - 7, rr - 7, 22), '#2a1c12');
        for (let k = 0; k < 6; k++) { const b = a + k * PI / 3; fillPts(bar([wx, -rr], [wx + Math.cos(b) * (rr - 6), -rr + Math.sin(b) * (rr - 6)], 5), '#8a5a34'); }
        dot(wx, -rr, 7, '#b08a3a'); strokePts(ep(wx, -rr, rr - 2, rr - 2, 12, PI * 1.1, PI * 1.6), 'rgba(255,220,170,0.35)', 1.4);
      }, 9334 + wx);
    }
  }
  function drawDetecteur(o) {
    const c = cx_(), t = o.t || 0, g = M.tg(t), H0 = dtH0(o);
    const sa = clamp(o.saute || 0), af = clamp(o.affaisse || 0), tre = clamp(o.tremble || 0), ai = clamp(o.aiguille || 0);
    const hop = sa * Math.abs(Math.sin(g * 7.5)) * 34;
    if (o.chariot) drawChariot(o);
    c.save(); c.translate(0, H0 - hop); c.translate(-DT.w, 0); c.rotate(-0.09 * af + 0.05 * sa * Math.sin(g * 7.5)); c.translate(DT.w, 0);
    if (sa > 0) { const sq = 1 - 0.06 * sa * Math.pow(1 - Math.abs(Math.sin(g * 7.5)), 4); c.scale(1 / Math.sqrt(sq), sq); }
    const T = c.getTransform(), Ti = T.inverse(), loc = (P) => { const q = new DOMPoint(P[0], P[1]).matrixTransform(Ti); return [q.x, q.y]; };
    // tubes vers la poire et le brassard (sous la boîte)
    const sag = (A, B, k) => qbez(A, [(A[0] + B[0]) / 2, Math.max(A[1], B[1]) + k + 0.12 * Math.abs(B[0] - A[0])], B, 16);
    const Sp = [-DT.w + 6, -78], Sb = [DT.w - 6, -96];
    if (o.poire) tube(sag(Sp, loc(o.poire), 40), 5);
    else { const Pp = [-148, -26]; tube(sag(Sp, [Pp[0], Pp[1] - 30], 20), 5); c.save(); c.translate(Pp[0], Pp[1]); drawPoire({}); c.restore(); }
    if (o.brassard) { const B = loc(o.brassard), side = B[0] < 0 ? -1 : 1, S = [side * (DT.w - 6), -96]; tube(sag(S, B, 50), 5);
      if (o.manchette !== false) { c.save(); c.translate(B[0], B[1]); drawManchette((o.brassardAng || 0) - Math.atan2(T.b, T.a)); c.restore(); } }
    else { const B = [150, -14]; tube(sag(Sb, B, 10), 5); c.save(); c.translate(B[0], B[1]); drawManchette(0.15); c.restore(); }
    if (T.a * T.d - T.b * T.c < 0) c.scale(-1, 1);                    // le cadran se lit toujours vert à gauche, rouge à droite (jamais en miroir)
    // pieds de laiton
    for (const fx of [-90, 90]) { pc(rect(fx - 6, -30, fx + 6, -8), '#b08a3a', () => strokePts([[fx - 3, -28], [fx - 3, -10]], 'rgba(255,240,190,0.55)', 1.2), 9340 + fx); pc(ell(fx, -7, 11, 7, 12), '#9a7630', () => strokePts([[fx - 6, -9], [fx, -12]], 'rgba(255,240,190,0.6)', 1.2), 9342 + fx); }
    // tambour enregistreur sur le dessus
    for (const bx of [-76, 76]) pc(rect(bx - 5, -262, bx + 5, -226), '#b08a3a', () => strokePts([[bx - 2, -260], [bx - 2, -228]], 'rgba(255,240,190,0.55)', 1), 9350 + bx);
    const tr_ = clamp(o.trace == null ? 0.6 : o.trace), trPts = [];
    for (let i = 0; i <= 40 * tr_; i++) { const u = i / 40, k = tr_ > 0 ? u / tr_ : 0; trPts.push([-60 + 120 * u, -258 - 22 * ai * k * k + 3.5 * (0.4 + ai) * Math.sin(u * 46 + 1.3) * (0.5 + 0.5 * k)]); }
    pc(rect(-68, -290, 68, -238), '#ede4cc', () => {
      for (let y = -286; y < -240; y += 8) strokePts([[-66, y], [66, y]], 'rgba(120,150,170,0.28)', 0.8);
      shade(0, -290, 0, -238, 0.35, [-70, -292, 70, -236]); shade(0, -238, 0, -290, 0.2, [-70, -292, 70, -236]);
      if (trPts.length > 1) strokePts(trPts, '#1a1616', 2);
    }, 9360);
    for (const ex of [-68, 68]) pc(ell(ex, -264, 6, 26, 12), '#b08a3a', () => strokePts([[ex - 2, -284], [ex - 2, -246]], 'rgba(255,240,190,0.5)', 1), 9362 + ex);
    const sp = trPts.length ? trPts[trPts.length - 1] : [-60, -258];
    strokePts([[80, -246], [96, -270], [sp[0] + 6, sp[1] - 6]], '#8a6a26', 2.2); dot(sp[0] + 3, sp[1] - 3, 2.6, '#1a1616');
    // boîte d'acajou
    pc(rrect(-DT.w, DT.top, DT.w, DT.bot, 12), '#6A3A24', () => {
      for (let k = 0; k < 9; k++) { const y = DT.top + 14 + k * 22; strokePts(qbez([-DT.w, y], [0, y + 6 * Math.sin(k * 1.7)], [DT.w, y + 2], 10), 'rgba(40,18,8,0.32)', 1.1); }
      strokePts([[-DT.w + 8, DT.top + 6], [DT.w - 30, DT.top + 6]], 'rgba(255,210,170,0.4)', 2);
      shade(0, DT.top, 0, DT.bot, 0.3, [-DT.w, DT.top, DT.w, DT.bot]); shade(DT.w, 0, -DT.w, 0, 0.18, [-DT.w, DT.top, DT.w, DT.bot]);
    }, 9370);
    pc(rrect(-DT.w + 12, DT.top + 12, DT.w - 12, DT.bot - 12, 7), '#7a4630', () => { strokePts([[-DT.w + 14, DT.bot - 14], [DT.w - 14, DT.bot - 14], [DT.w - 14, DT.top + 14]], 'rgba(255,210,170,0.3)', 1.4); hatch(null, 0.2, 6, 0.1); }, 9371, { drop: false });
    for (const [vx, vy] of [[-DT.w + 7, DT.top + 7], [DT.w - 7, DT.top + 7], [-DT.w + 7, DT.bot - 7], [DT.w - 7, DT.bot - 7]]) { dot(vx, vy, 3.2, '#b08a3a'); dot(vx - 1, vy - 1, 1.2, '#f3e2a8'); }
    // voyants vert / rouge (sans signe)
    const vert = clamp(1 - ai * 2.2) * (1 - af * 0.6), rouge = clamp((ai - 0.62) * 3.5);
    for (const [lx, on, cOff, cOn] of [[-84, vert, '#2e3a2c', '#7fc276'], [84, rouge, '#3e1c18', '#ff5a40']]) {
      if (on > 0.05 && !SIL()) { const gr = c.createRadialGradient(lx, DT.top + 26, 2, lx, DT.top + 26, 30); gr.addColorStop(0, mixA(cOn, cOn, 0, 0.5 * on)); gr.addColorStop(1, mixA(cOn, cOn, 0, 0)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(lx - 30, DT.top - 4, 60, 60); c.restore(); }
      dot(lx, DT.top + 26, 8.5, '#b08a3a'); dot(lx, DT.top + 26, 6.5, mixA(cOff, cOn, on)); dot(lx - 2, DT.top + 24, 1.8, 'rgba(255,255,255,0.7)');
    }
    // cadran
    const C0 = [0, DT.cad], R = DT.R;
    pc(ell(C0[0], C0[1], R + 8, R + 8, 36), '#b08a3a', () => { strokePts(ep(C0[0], C0[1], R + 5, R + 5, 18, PI * 1.05, PI * 1.6), 'rgba(255,240,190,0.65)', 2); shade(0, C0[1] + R, 0, C0[1] - R, 0.3, [-R - 10, C0[1] - R - 10, R + 10, C0[1] + R + 10]); }, 9380);
    pc(ell(C0[0], C0[1], R, R, 36), '#efe6cc', () => {
      const sect = (a0, a1, col) => fillPts(ep(C0[0], C0[1], R * 0.93, R * 0.93, 12, a0, a1).concat(ep(C0[0], C0[1], R * 0.56, R * 0.56, 12, a1, a0)), col, 0, 0);
      sect(DT.A0 - 0.06, lerp(DT.A0, DT.A1, 0.36), '#4E6B4A'); sect(lerp(DT.A0, DT.A1, 0.64), DT.A1 + 0.06, '#a8322d');
      sect(lerp(DT.A0, DT.A1, 0.36), lerp(DT.A0, DT.A1, 0.64), 'rgba(200,170,90,0.35)');
      for (let k = 0; k <= 12; k++) { const a = lerp(DT.A0, DT.A1, k / 12), r0 = k % 3 ? 0.95 : 0.88; strokePts([[C0[0] + Math.cos(a) * R * r0, C0[1] + Math.sin(a) * R * r0], [C0[0] + Math.cos(a) * R * 1.0, C0[1] + Math.sin(a) * R * 1.0]], '#2a2420', k % 3 ? 1.2 : 2.2); }
      strokePts(ep(C0[0], C0[1], R * 0.56, R * 0.56, 16, DT.A0 - 0.06, DT.A1 + 0.06), 'rgba(40,30,20,0.5)', 1.2);
      fillPts(ep(C0[0], C0[1] + 8, R * 0.3, R * 0.16, 10, 0, PI).concat([[C0[0] - R * 0.3, C0[1] + 8]]), 'rgba(60,40,30,0.12)', 0, 0);
      shade(0, C0[1] - R, 0, C0[1] + R, 0.18, [-R, C0[1] - R, R, C0[1] + R]);
    }, 9381, { drop: false });
    // aiguille (noire, large, liseré clair pour la lecture sur téléphone)
    const jit = tre * (0.07 * Math.sin(g * 43) + 0.05 * Math.sin(g * 71 + 1)) + sa * 0.08 * Math.sin(g * 15);
    const an = lerp(DT.A0, DT.A1, ai) - 0.62 * af + jit, L = R * 0.86, ca = Math.cos(an), sn = Math.sin(an), nx = -sn, ny = ca;
    const needle = [[C0[0] - ca * 16 + nx * 6, C0[1] - sn * 16 + ny * 6], [C0[0] + nx * 4.5, C0[1] + ny * 4.5], [C0[0] + ca * L + nx * 1.2, C0[1] + sn * L + ny * 1.2], [C0[0] + ca * (L + 6), C0[1] + sn * (L + 6), 1], [C0[0] + ca * L - nx * 1.2, C0[1] + sn * L - ny * 1.2], [C0[0] - nx * 4.5, C0[1] - ny * 4.5], [C0[0] - ca * 16 - nx * 6, C0[1] - sn * 16 - ny * 6]];
    if (!SIL()) { c.save(); c.translate(2, 3); fillPts(needle, 'rgba(40,25,15,0.25)', 0, 0); c.restore(); }
    pc(needle, '#141210', null, 9390, { drop: false, edge: 'rgba(255,250,235,0.9)' });
    dot(C0[0], C0[1], 10, '#9a7630'); dot(C0[0], C0[1], 7, '#c9a24a'); dot(C0[0] - 2, C0[1] - 2, 2.4, '#fff2c0');
    if (!SIL()) { c.save(); c.globalAlpha = 0.5; strokePts(ep(C0[0], C0[1], R * 0.82, R * 0.82, 10, PI * 1.12, PI * 1.42), '#ffffff', 3); c.restore(); }
    c.restore();
  }

  // ---- COUVERTURES DE BANDES DESSINÉES 1940-41 (sans aucune lettre) : 110 × 150 ; repère = milieu du bord haut (là où va la pince)
  const CV = { w: 110, h: 150 };
  const COUV = {
    a: { fond: '#58a8d0', bande: '#c83a2a' }, b: { fond: '#3d2a5e', bande: '#e8c23a' }, c: { fond: '#e8c23a', bande: '#2f4f9a' },
    d: { fond: '#4f9158', bande: '#ece4cf' }, e: { fond: '#e07a34', bande: '#6a3a24' },
  };
  const peauC = '#eec7a2';
  function couvA() {                                     // héros bleu en vol au-dessus de la ville
    for (let i = 0; i < 5; i++) fillPts(rect(-55 + i * 24, 120 - (i % 2 ? 20 : 34) - i * 2, -36 + i * 24, 150), i % 2 ? '#2c4d78' : '#1f3a60', i);
    for (let i = 0; i < 4; i++) strokePts([[-50 + i * 8, 80 + i * 6], [-24 + i * 8, 76 + i * 6]], 'rgba(255,255,255,0.7)', 1.4);
    fillPts([[-38, 96], [-12, 70], [-2, 92], [-30, 112]], '#c0302a');                                                           // cape
    fillPts([[-26, 92], [14, 60], [22, 68], [-18, 100]], '#2f4f9a');                                                           // corps
    fillPts([[-30, 98], [-20, 92], [-14, 100], [-24, 106]], '#c0302a');                                                        // bottes
    fillPts([[12, 62], [34, 46], [37, 50], [16, 68]], '#2f4f9a'); fillPts(ell(38, 47, 4, 4, 8), peauC);                       // bras tendu, poing
    fillPts(ell(22, 56, 7, 7, 10), peauC); fillPts([[16, 52], [24, 47], [29, 52], [22, 55]], '#141218');                        // tête
    fillPts([[-8, 79], [2, 72], [4, 78], [-6, 84]], '#c0302a');                                                                 // slip
  }
  function couvB() {                                     // héros noir debout sur un toit, cape déployée en ailes festonnées devant une lune jaune
    fillPts(ell(4, 70, 34, 34, 26), '#f0d670'); fillPts(ell(16, 60, 7, 6, 10), 'rgba(200,170,80,0.5)'); fillPts(ell(-12, 84, 5, 4, 10), 'rgba(200,170,80,0.4)');
    for (const [x, y] of [[-44, 44], [-30, 100], [44, 96], [40, 40], [-46, 76]]) dot(x, y, 1.3, '#fff3c0');
    fillPts([[-55, 124], [55, 118], [55, 150], [-55, 150]], '#1d1528'); fillPts(rect(32, 98, 48, 120), '#2a2030'); fillPts([[30, 98], [40, 88], [50, 98]], '#2a2030');
    fillPts([[2, 66], [-14, 70], [-30, 64, 1], [-44, 74], [-40, 90, 1], [-32, 86], [-26, 100, 1], [-16, 94], [-8, 108, 1], [2, 100], [12, 108, 1], [20, 94], [30, 100, 1], [36, 86], [44, 90, 1], [48, 74], [34, 64, 1], [18, 70]], '#121016');   // cape en ailes
    fillPts([[-6, 72], [10, 72], [12, 104], [8, 120], [-4, 120], [-8, 104]], '#5e636b'); fillPts(rect(-8, 96, 12, 101), '#b08a3a');                                      // corps
    fillPts([[-4, 58], [-5, 46, 1], [-1, 54], [5, 54], [9, 46, 1], [8, 58], [6, 70], [-2, 70]], '#2f3135'); fillPts(rect(-1, 59, 5, 62), '#eef0f2');                     // tête à oreilles
  }
  function couvC() {                                     // Wonder Woman au lasso (diadème, rouge-bleu-or, bracelets d'argent)
    for (let k = 0; k < 12; k++) { const a = k * PI / 6; fillPts([[4, 88], [4 + Math.cos(a) * 100, 88 + Math.sin(a) * 100], [4 + Math.cos(a + 0.24) * 100, 88 + Math.sin(a + 0.24) * 100]], 'rgba(230,120,40,0.45)', 0, 0); }
    strokePts(ep(26, 56, 24, 16, 22, 0, TAU), GOLDD, 4.2); strokePts(ep(26, 56, 24, 16, 22, 0, TAU), '#f0c84a', 2.4);          // boucle du lasso
    strokePts(qbez([12, 70], [16, 62], [8, 58], 6), '#f0c84a', 2.4);
    fillPts([[-12, 46], [-20, 60], [-22, 86], [-14, 92], [-6, 70], [-2, 50]], '#141218');                                      // cheveux longs
    fillPts([[-6, 110], [-16, 134], [-12, 138], [0, 112]], peauC); fillPts([[6, 110], [16, 134], [20, 132], [12, 108]], peauC);   // cuisses
    fillPts([[-16, 128], [-22, 146], [-12, 148], [-10, 130]], '#c0302a'); fillPts([[14, 128], [16, 148], [26, 146], [20, 126]], '#c0302a');   // bottes
    fillPts([[-12, 92], [16, 92], [18, 112], [-14, 112]], '#22345c');                                                          // jupe-culotte
    for (const [x, y] of [[-6, 98], [6, 102], [-8, 107], [12, 106]]) fillPts(star(x, y, 2.4, 1, 5), '#ffffff', 0, 0);
    fillPts([[-10, 62], [10, 62], [14, 92], [-12, 92]], '#c0302a'); strokePts([[-10, 63], [10, 63]], '#f0c84a', 2);               // haut rouge
    fillPts(rect(-12, 88, 15, 93), '#f0c84a');                                                                                   // ceinture d'or
    fillPts([[-8, 50], [2, 46], [6, 54], [2, 62], [-6, 62]], peauC);                                                            // visage
    fillPts([[-9, 48], [3, 43], [6, 47], [-8, 52]], '#f0c84a'); fillPts(star(1, 45, 2.6, 1.1, 5), '#c0302a', 0, 0);            // diadème + étoile
    fillPts([[-8, 44], [4, 40], [6, 44], [0, 46]], '#141218');
    fillPts([[8, 66], [20, 58], [22, 62], [10, 72]], peauC); fillPts([[13, 61], [18, 58], [20, 62], [15, 65]], '#d8dde4');       // bras levé + bracelet
    fillPts([[-10, 66], [-24, 74], [-22, 78], [-8, 72]], peauC); fillPts([[-18, 71], [-23, 74], [-21, 78], [-16, 75]], '#d8dde4');   // autre bras + bracelet
    strokePts([[13, 61], [18, 58]], '#ffffff', 1);
  }
  function couvD() {                                     // policier qui poursuit un voleur sous un réverbère
    fillPts([[-55, 128], [55, 124], [55, 150], [-55, 150]], '#2e5a36');
    fillPts(rect(-44, 50, -40, 128), '#1e2a22'); fillPts(ell(-42, 48, 9, 6, 10), '#f4e2a0');
    fillPts([[14, 128], [18, 96], [30, 96], [34, 128]], '#1f2c5a'); fillPts([[12, 98], [16, 68], [34, 68], [36, 98]], '#26346a');   // policier
    fillPts(ell(26, 58, 8, 9, 10), peauC); fillPts([[14, 52], [36, 50], [38, 54], [16, 56]], '#141a36'); fillPts([[18, 52], [22, 42], [34, 44], [34, 52]], '#26346a');
    fillPts(star(30, 76, 3.4, 1.5, 5), '#e8c23a', 0, 0); fillPts([[14, 72], [-2, 80], [0, 84], [16, 78]], '#26346a');
    fillPts([[-30, 126], [-18, 104], [-8, 110], [-14, 128]], '#4a3550'); fillPts([[-22, 106], [-12, 84], [-2, 88], [-8, 108]], '#4a3550');   // voleur qui fuit
    fillPts(ell(-6, 80, 6, 6, 8), peauC); fillPts([[-14, 76], [2, 72], [2, 76], [-14, 79]], '#3a3b3f');
  }
  function couvE() {                                     // cow-boy sur son cheval cabré, soleil couchant
    fillPts(ep(0, 120, 36, 36, 16, PI, TAU), '#f6c24a');
    fillPts([[-55, 118], [-40, 96], [-18, 96], [-10, 118], [20, 118], [30, 104], [55, 104], [55, 150], [-55, 150]], '#8a3a20');
    fillPts([[-26, 120], [-18, 96], [-8, 80], [6, 72], [22, 60], [30, 64], [26, 74], [16, 82], [20, 100], [10, 122], [2, 122], [6, 102], [-8, 104], [-14, 122]], '#5a3216');   // cheval
    fillPts([[22, 60], [30, 52], [34, 58], [30, 64]], '#5a3216'); strokePts([[-26, 104], [-38, 112]], '#3a1e0c', 2.4);
    fillPts([[-2, 80], [0, 60], [12, 60], [10, 82]], '#c0302a'); fillPts(ell(6, 52, 6, 7, 10), peauC);                            // cavalier
    fillPts([[-8, 48], [20, 46], [18, 50], [-6, 52]], '#e0c890'); fillPts([[0, 46], [2, 38], [12, 38], [14, 46]], '#e0c890');     // chapeau
    fillPts([[10, 64], [22, 54], [24, 58], [12, 68]], '#c0302a');
  }
  const COUVD = { a: couvA, b: couvB, c: couvC, d: couvD, e: couvE };
  function drawCouv(o) {
    const n = COUV[o.n] ? o.n : 'a', C = COUV[n], w2 = CV.w / 2, cc0 = cx_(), m0 = cc0.getTransform();
    cc0.save(); if (m0.a * m0.d - m0.b * m0.c < 0) cc0.scale(-1, 1);                // jamais en miroir
    pc(rect(-w2, 0, w2, CV.h), '#efe2c0', () => {
      fillPts(rect(-w2 + 4, 4, w2 - 4, CV.h - 4), C.fond);
      const cc = cx_(); cc.save(); cc.beginPath(); cc.rect(-w2 + 4, 4, CV.w - 8, CV.h - 8); cc.clip();
      if (!SIL()) COUVD[n]();
      cc.restore();
      fillPts(rect(-w2 + 4, 4, w2 - 4, 30), C.bande);                                                                                 // bandeau de titre (sans lettre)
      for (let k = 0; k < 4; k++) fillPts(rect(-w2 + 10 + k * 20, 10, -w2 + 24 + k * 20, 24), mixA(C.bande, '#ffffff', 0.45), k);   // pavés décoratifs
      fillPts(ell(w2 - 14, 17, 9, 9, 12), '#efe2c0'); fillPts(star(w2 - 14, 17, 6, 2.6, 5), C.bande, 0, 0);                            // médaillon-étoile du coin
      fillPts(rect(-w2, 0, w2, CV.h), 'rgba(190,150,80,0.16)');                                                                        // papier jauni
      hatch(null, 0.8, 6, 0.06, 1, undefined, [-w2, 0, w2, CV.h]);
      strokePts([[w2 - 2, 2], [w2 - 2, CV.h - 2], [-w2 + 2, CV.h - 2]], 'rgba(90,60,30,0.35)', 1.4);
    }, 9400 + n.charCodeAt(0), { texA: 0.5 });
    if (o.pince) { pc(rrect(-4, -10, 4, 12, 2), '#c9a272', () => { strokePts([[0, -8], [0, 10]], 'rgba(80,50,20,0.5)', 1); dot(0, 2, 1.6, '#8a8a8a'); }, 9410, { drop: false }); }
    cc0.restore();
  }

  // registre : grip = prise (repère de l'objet) ; p2 = seconde prise ; pts = points nommés ; base = point posé (objet seul)
  const OBJ = {
    poire: { draw: drawPoire, grip: [0, 3], pts: { tube: [0, -32], centre: [0, 3] }, base: [0, 25] },
    sac: { draw: drawSac, grip: [0, -44], p2: [-30, 30], pts: { centre: [0, 24], cou: [0, -44], bas: [0, 74] }, base: [0, 74] },
    corde: { draw: drawCorde, grip: [0, 0], p2: [-14, 40], pts: { bout: [14, -6] }, base: [0, 50], doigts: 'large' },
    detecteur: { draw: drawDetecteur, grip: [0, -128], base: [0, 0],
      pts: { cadran: (o) => [0, dtH0(o) + DT.cad], haut: (o) => [0, dtH0(o) - 290], poignee: [-230, -250], tubeBrassard: (o) => [DT.w - 6, dtH0(o) - 96], tubePoire: (o) => [-DT.w + 6, dtH0(o) - 78], dessus: (o) => [0, dtH0(o) + DT.top] } },
    couverture: { draw: drawCouv, grip: [0, 75], base: [0, 0], pts: { centre: [0, 75], haut: [0, 0], bas: [0, 150] } },
    manchette: { draw: (o) => drawManchette(o.ang2 || 0), grip: [0, 0], base: [0, 0], pts: { centre: [0, 0] } },
  };
  WW.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);

  // =====================================================================
  // 3) MOTEUR DE POSE (principe heldParts de bibliotheque/guerremondes.js ; jambes à genou : cuisse + jambe)
  // =====================================================================
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), e = oo.echelle || 1;
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const LARGE = [[-15, -10], [11, -12], [15, -4], [15, 7], [8, 12], [-8, 12], [-15, 5]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  const fingers = (name) => { const ob = OBJ[name]; return !ob ? OFFP : ob.doigts === 'large' ? LARGE : DOIGTS; };
  function heldParts(skin, skinB, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fingers(p.tenu) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 4, pts: (p) => (has(p.tenuB) ? fingers(p.tenuB) : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point écran d'un point nommé de l'objet tenu : WW.pt(r, 'bout') ; main arrière : WW.pt(r, 'nom', true) ; 'prise' = point tenu
  WW.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1;
    const q = nom === 'prise' ? g : ob.pts[nom] ? ptOf(ob.pts[nom], oo) : null; if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };

  const LA = 96, PG = [4, 96];
  function ikT(S, T, bend) {          // même convention que M.ik (bend 1 = coude sous la ligne épaule–main, plié vers l'avant)
    const L1 = LA, L2 = Math.hypot(PG[0], PG[1]), phi = Math.atan2(-PG[0], PG[1]);
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), base = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), a2 = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    return { a: normA(base + bend * a1), b: normA(-bend * (PI - a2) - phi) };
  }
  function armTo(q, arm, T, k, bend) {
    if (!(k > 0)) return;
    const sol = ikT(q._def.sh[arm], T, bend == null ? 1 : bend), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const add = (q, n, v) => { q.ang[n] = (q.ang[n] || 0) + v; };
  function headPt(q, hx_, hy) { const H = q._def.headAt; return mp(new DOMMatrix().translate(H[0], H[1]).rotate((q.ang.head || 0) * D), [hx_, hy]); }
  function plier(q, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), pieds à plat
    if (!th) return; const h = -q._def.hipY;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - h * Math.sin(th); q.dy = (q.dy || 0) + h * (1 - Math.cos(th));
    add(q, 'legF_up', -th); add(q, 'legB_up', -th);
  }
  function marche(q, k) {                                     // pas sur place selon t : cuisses en opposition, genou arrière plié, petits bras, rebond
    if (!(k > 0)) return;
    const t = q.t || 0, w = Math.sin(t * TAU * (q.cadence || 1.1));
    add(q, 'legF_up', -0.32 * w * k); add(q, 'legB_up', 0.32 * w * k);
    add(q, 'legF_lo', 0.42 * Math.max(0, -w) * k); add(q, 'legB_lo', 0.42 * Math.max(0, w) * k);
    if (!q._brasPris) { if (!has(q.tenu)) add(q, 'armF_up', 0.12 * w * k); if (!has(q.tenuB)) add(q, 'armB_up', -0.1 * w * k); }
    q.dy = (q.dy || 0) - Math.abs(Math.cos(t * TAU * (q.cadence || 1.1))) * 5 * k;
  }
  function vers(S, C, r) { const v = [C[0] - S[0], C[1] - S[1]], l = Math.hypot(v[0], v[1]) || 1, k = Math.min(l, r) / l; return [S[0] + v[0] * k, S[1] + v[1] * k]; }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: Object.assign({}, p.tenuO), tenuBO: Object.assign({}, p.tenuBO) }); }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0, SH = q._def.sh;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
      const Hf = new DOMMatrix().translate(SH.armF[0], SH.armF[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(PG[0], PG[1]).rotate((A.objet || 0) * D).scale(e, e).translate(-g[0], -g[1]);
      const T = mp(Hf, ptOf(ob.p2, oo)), sol = ikT(SH.armB, T, 1);
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = q.handBDeux || 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q; r.pose = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', PG[0], PG[1]); r.mainB = r.w('armB_lo', PG[0], PG[1]);
    r.tete = r.w('head', 0, -100); r.torse = r.w('torso', 0, def.torseY || -90);
    return r;
  }
  function wrap(key, poseFn, sDef) {
    const fn = (pose, x, y, s, o) => {
      s = s == null ? sDef : s; o = Object.assign({ slot: M.ST.slotF, nom: CH[key].nom }, o || {});
      const dir = o.dir || 1, q = prep(pose), def = CH[key]; q._def = def;
      const loc = (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; };
      poseFn(q, loc); marche(q, q.marche === true ? 1 : q.marche); finish(q);
      return run(def, q, x, y, s, o);
    };
    fn.pose = (pose) => { const q = prep(pose); q._def = CH[key]; poseFn(q, (Pt) => Pt); marche(q, q.marche === true ? 1 : q.marche); return finish(q); };
    fn.def = () => CH[key];
    return fn;
  }

  // ---------------- pièces de corps communes (articulations rondes, rivet au pivot)
  const R_COUDE = 11.5;
  function armR(len, wt, bulge) { wt = wt || 15; const b = bulge || 0; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1 + b * 0.3, 30], [wt + b, 48], [R_COUDE + 1 + b * 0.4, len - 10]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind, sx) { const f = X.forePts(kind); return scl(ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)), sx || 1, 1); }
  const upDef = (at, base, seed, paint, wt, bulgeFn) => ({ parent: 'torso', at, pts: (p) => armR(LA, wt || 16, bulgeFn ? bulgeFn(p) : 0), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  // jambe à genou : cuisse (hanche → genou, LT) + jambe (genou → semelle, LS, pied vers +x)
  function thighPts(LT, rH, rK) { return ep(0, 0, rH, rH, 10, PI, TAU).concat([[rH, 26], [rK + 1.5, LT - 8]], ep(0, LT, rK + 0.5, rK + 0.5, 10, 0, PI), [[-rK - 1.5, LT - 8], [-rH, 30]]); }
  function shinPts(LS, rK, wA, toe) { toe = toe || 48; return ep(0, 0, rK, rK, 10, PI, TAU).concat([[rK, 26], [wA, LS - 38], [wA + 2, LS - 22], [toe * 0.62, LS - 16], [toe * 0.88, LS - 10], [toe, LS - 4], [toe - 1, LS, 1], [-16, LS, 1], [-17, LS - 12], [-wA - 2, LS - 34], [-rK, 30]]); }
  function legParts(side, at, L, base, baseLo, seed, back, paintUp, paintLo) {
    const dk = back ? () => fillPts([[-60, -30], [60, -30], [60, 400], [-60, 400]], 'rgba(20,14,10,0.14)') : () => {};
    return {
      ['leg' + side + '_up']: { parent: 'torso', at, pts: thighPts(L.LT, L.rH, L.rK), base, seed, noRivet: !!back, paint: () => { if (paintUp) paintUp(); if (!back) hatch([[-L.rH, -10], [-L.rH * 0.3, -10], [-L.rK * 0.3, L.LT], [-L.rK, L.LT]], 0.8, 4, 0.22); else hatch(null, 0.8, 3.6, 0.3); dk(); } },
      ['leg' + side + '_lo']: { parent: 'leg' + side + '_up', at: [0, L.LT], pts: shinPts(L.LS, L.rK, L.wA || 10, L.toe), base: baseLo || base, seed: seed + 1, paint: () => { if (paintLo) paintLo(L.LS); if (!back) { strokePts([[18, L.LS - 8], [40, L.LS - 4]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-L.rK, 0], [-3, 0], [-3, L.LS - 20], [-L.rK, L.LS - 20]], 0.8, 4, 0.2); } else hatch(null, 0.8, 3.6, 0.3); dk(); } },
    };
  }
  const shoe = (col, h) => (LS) => fillPts([[-40, LS - (h || 24), 1], [70, LS - (h || 24), 1], [70, LS + 10, 1], [-40, LS + 10, 1]], col);
  function ORDER(pre0, pre, post, afterArmF) { return pre0.concat(['armB_up', 'armB_lo', 'legB_up', 'legB_lo', 'legF_up', 'legF_lo', 'head'], pre, ['torso'], post, ['objetB', 'doigtsB', 'objet', 'armF_up'], afterArmF, ['armF_lo', 'doigts', 'doigtsB2']); }
  function defOf(nom, parts, o) {
    Object.assign(parts, heldParts(o.skin, o.skinB, o.seed));
    return { nom, hipY: o.hipY, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, sh: o.sh, headAt: o.headAt, torseY: o.torseY,
      order: ORDER(o.pre0 || [], o.pre || [], o.post || [], o.afterArmF || []) };
  }
  const EXPR = {
    neutre: {}, ravi: { mouth: 'smile', eyes: 'half' }, surpris: { brow: 'up', eyes: 'wide', mouth: 'o' }, fier: { brow: 'up', mouth: 'smile' },
    triste: { brow: 'worry', eyes: 'half', mouth: 'tight' }, fache: { brow: 'frown', mouth: 'tight' }, peur: { brow: 'worry', eyes: 'wide', mouth: 'o' }, malin: { brow: 'up', eyes: 'half', mouth: 'smile' },
  };
  function expr(q, nom) { const e = EXPR[nom]; if (!e) return; for (const k in e) if (q.face[k] == null) q.face[k] = e[k]; }
  function avantBras(parent, back, base, skin, seed, extraPaint, sx) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p), sx), base, seed, paint: (p) => {
      fillPts([[-30, 74, 1], [30, 74, 1], [30, 140, 1], [-30, 140, 1]], skin); X.handPaint(null, hk(p));
      if (extraPaint) extraPaint(p); hatch([[-14, -10], [-3, -10], [-3, 70], [-14, 70]], 0.9, 3.8, back ? 0.3 : 0.2);
    } };
  }

  // =====================================================================
  // 4) WILLIAM MOULTON MARSTON — trapu, visage rond rasé, lunettes rondes d'écaille, cheveux bruns plaqués à raie,
  //    trois-pièces de tweed brun tabac, chemise ivoire, nœud papillon vert éteint, chaussures brunes
  // =====================================================================
  const MA = { peau: '#e9c39f', peauD: '#cba381', veste: '#6B4A2E', vesteD: '#57391f', vesteL: '#86643f', gilet: '#5b3e24', chem: '#ece4d0', noeud: '#4E6B4A', noeudD: '#36503a', pant: '#634529', pantD: '#4e3520', soulier: '#3e2616', chev: '#4a3020', chevL: '#7a5638', ec: '#5e3518', ecL: '#b07a3a' };
  const MA_TORSO = [[-18, -186], [10, -190], [24, -180], [40, -164], [50, -136], [58, -102], [62, -66], [60, -30], [55, 6], [53, 38, 1], [-50, 40, 1], [-54, 2], [-58, -48], [-60, -108], [-55, -156], [-37, -178]];
  const MA_HEAD = [[-18, 16], [12, 16], [16, 4], [26, -3], [33, -9], [35, -17], [32, -23], [34, -27], [33, -31], [36, -35], [41, -40, 1], [36, -47], [32, -56], [32, -66], [29, -80], [17, -95], [-5, -101], [-27, -93], [-38, -74], [-39, -50], [-33, -26], [-25, -6]];
  const MA_HAIR = [[28, -76], [31, -87], [26, -99], [10, -107], [-10, -109], [-28, -103], [-40, -89], [-44, -70], [-42, -52], [-36, -44], [-30, -50], [-24, -60], [-14, -63], [-6, -61], [-3, -52], [2, -50], [4, -63], [10, -73], [20, -79]];
  const MA_LEG = { LT: 118, LS: 127, rH: 24, rK: 16, wA: 13, toe: 50 };
  function tweed(x0, y0, x1, y1, seed) {
    if (SIL()) return;
    hatch(null, 0.75, 3.2, 0.12, 0.8, undefined, [x0, y0, x1, y1]); hatch(null, -0.75, 3.2, 0.1, 0.8, undefined, [x0, y0, x1, y1]);
    for (let i = 0; i < 70; i++) { const a = hash(seed + i * 3.1), b = hash(seed + i * 7.7); const x = lerp(x0, x1, a), y = lerp(y0, y1, b); strokePts([[x, y], [x + 2.5, y + 1]], i % 2 ? 'rgba(160,120,80,0.45)' : 'rgba(40,24,12,0.4)', 1); }
  }
  function mkMarston() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: MA_TORSO, base: MA.veste, seed: 8001, paint: () => {
        tweed(-62, -192, 64, 42, 11);
        fillPts([[12, -180], [26, -172], [42, -148], [52, -116], [58, -82], [60, -52], [52, -50], [47, -86], [39, -122], [25, -156], [14, -170]], MA.gilet);   // gilet dans l'ouverture
        for (const [x, y] of [[50, -110], [55, -88], [57, -66]]) { dot(x, y, 2.4, '#2e1e10'); dot(x - 0.6, y - 0.6, 0.9, '#a88a60'); }
        fillPts([[8, -184], [20, -178], [34, -152], [45, -120], [40, -112], [30, -138], [15, -166]], MA.vesteD);                                          // revers
        strokePts([[20, -178], [34, -152], [45, -120], [52, -84], [57, -44], [55, 6], [53, 36]], 'rgba(36,22,10,0.6)', 1.4);
        fillPts([[4, -192], [22, -184], [27, -174], [15, -176], [5, -182]], MA.chem);                                                                  // col de chemise
        fillPts([[26, -168], [14, -180], [12, -158]], MA.noeud); fillPts([[26, -168], [42, -182], [44, -156]], MA.noeud);                                 // nœud papillon
        fillPts(ell(27, -168, 5, 5.5, 8), MA.noeudD); strokePts([[30, -174], [40, -179]], 'rgba(220,240,210,0.45)', 1.2);
        strokePts([[-2, -20], [26, -22]], 'rgba(30,18,8,0.65)', 1.6); strokePts([[-8, -122], [12, -124]], 'rgba(30,18,8,0.55)', 1.3);                  // poches
        fillPts([[0, -128], [8, -133], [12, -124]], '#d8cfb6');                                                                                         // pochette
        hatch([[-64, -178], [-18, -178], [-18, 40], [-64, 40]], 0.75, 4.2, 0.26); shade(60, -40, -58, -40, 0.3, [-64, -194, 66, 42]);
      } },
      ...legParts('B', [-8, -2], MA_LEG, MA.pantD, MA.pantD, 8002, true, null, shoe('#2e1c10')),
      ...legParts('F', [8, -2], MA_LEG, MA.pant, MA.pant, 8004, false, () => tweed(-22, -10, 22, 120, 5), shoe(MA.soulier)),
      armB_up: upDef([-10, -150], MA.vesteD, 8006, () => { tweed(-16, -14, 16, 100, 21); hatch(null, 0.9, 3.8, 0.3); }, 17),
      armB_lo: avantBras('armB_up', true, MA.vesteD, MA.peauD, 8007, () => fillPts([[-15, 60, 1], [15, 60, 1], [16, 76, 1], [-15, 76, 1]], '#cfc6b0')),
      head: { parent: 'torso', at: [6, -176], pts: MA_HEAD, base: MA.peau, seed: 8008, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-9, -44);
        hatch([[-26, -42], [0, -28], [12, -6], [-8, 18], [-36, 4]], 0.6, 3.6, 0.24);
        dot(18, -27, 11, 'rgba(215,135,115,0.26)');
        strokePts([[12, -4], [22, 0], [30, -6]], 'rgba(150,100,80,0.35)', 1.2);                                                              // menton rond
        X.eye(f, 20, -52, 1.05); X.brow(f, 20, -64, 'rgba(60,38,24,0.95)', 2.6); X.mouth(f, 30, -23);
        // lunettes rondes d'écaille
        if (!SIL()) { fillPts(ell(20, -52, 12, 12, 16), 'rgba(205,228,238,0.25)', 0, 0); }
        strokePts(ep(20, -52, 12, 12, 18, 0, TAU), MA.ec, 3.2); strokePts(ep(20, -52, 12, 12, 8, PI * 1.1, PI * 1.5), MA.ecL, 1.2);
        for (const a of [0.4, 1.6, 2.9, 4.2, 5.4]) dot(20 + Math.cos(a) * 12, -52 + Math.sin(a) * 12, 1.2, MA.ecL);
        strokePts([[32, -54], [38, -51]], MA.ec, 2.4); strokePts(ep(41, -52, 3, 9, 6, PI * 0.6, PI * 1.4), MA.ec, 2.4);                       // pont + bord du 2e verre
        strokePts([[8, -54], [-8, -50]], MA.ec, 2.2);
        strokePts([[15, -58], [21, -60]], 'rgba(255,255,255,0.7)', 1.3);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: MA_HAIR, base: MA.chev, seed: 8009, noRivet: true, paint: () => {
        for (let i = 0; i < 6; i++) strokePts(qbez([26 - i * 3, -84 - i * 3.4], [2 - i * 3, -98 + i * 0.6], [-40 + i * 2, -60 + i * 3], 10), i % 2 ? 'rgba(20,10,6,0.45)' : 'rgba(150,110,76,0.55)', 1.2);
        strokePts([[25, -92], [6, -101], [-20, -102]], 'rgba(232,196,166,0.95)', 1.7);                                                         // raie sur le côté
        strokePts(qbez([24, -98], [4, -108], [-22, -100], 8), 'rgba(255,235,210,0.35)', 2);                                                     // brillant de gomina
      } },
      armF_up: upDef([-2, -150], MA.veste, 8010, () => { tweed(-16, -14, 16, 100, 31); hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.24); }, 17),
      brassardP: { parent: 'armF_up', at: [0, 44], noRivet: true, base: '#35373b', seed: 8011, pts: (p) => (p.brassard ? rrect(-20, -16, 20, 16, 5) : OFFP), paint: () => { strokePts([[-18, -11], [18, -11]], 'rgba(200,200,205,0.35)', 1); strokePts([[-18, 11], [18, 11]], 'rgba(200,200,205,0.35)', 1); fillPts(rect(6, -6, 16, 6), '#b08a3a'); hatch(null, 0.8, 3.2, 0.2); } },
      armF_lo: avantBras('armF_up', false, MA.veste, MA.peau, 8012, () => fillPts([[-15, 60, 1], [15, 60, 1], [16, 76, 1], [-15, 76, 1]], MA.chem)),
    };
    return defOf('Marston', parts, { skin: MA.peau, skinB: MA.peauD, seed: 8020, hipY: -246, sh: { armF: [-2, -150], armB: [-10, -150] }, headAt: [6, -176], torseY: -96, pre: ['cheveux'], afterArmF: ['brassardP'] });
  }
  CH.wwMarston = mkMarston();
  WW.marston = wrap('wwMarston', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0;
    expr(q, q.expr);
    const k = (n) => ease(clamp(q[n] || 0));
    const po = k('pompe'), aj = k('ajuste'), id = k('idee'), pu = k('pousse'), ch = k('cherche'), pg = k('poignee'), fi = k('fier'), ab = k('abattu'), as = k('assis');
    if (!(po || aj || id || pu || ch || pg || fi || ab || as)) { blend(q, 'armF_lo', -0.14, 1); blend(q, 'armB_lo', -0.1, 1); }
    if (as > 0) {                                                       // assis : (x, y) = sol sous le bassin ; les pieds partent vers l'avant
      blend(q, 'legF_up', -1.5, as); blend(q, 'legF_lo', 1.5, as); blend(q, 'legB_up', -1.4, as); blend(q, 'legB_lo', 1.42, as);
      q.dy = (q.dy || 0) + 112 * as; q._brasPris = true;
      armTo(q, 'armB', [70, -58], as); q.handB = q.handB || 'open';                // avant-bras arrière posé sur l'accoudoir
      if (!(po || aj || id)) { armTo(q, 'armF', q.cible ? loc(q.cible) : [176, -88], as); q.handF = q.handF || 'open'; }   // bras avant tendu (brassard)
    }
    if (po > 0) {                                                       // presse la poire : la main avant la tient devant lui
      if (q.tenu == null) q.tenu = 'poire';
      q.tenuO.presse = q.presse != null ? q.presse : Math.pow(0.5 + 0.5 * Math.sin(t * TAU * 1.6), 3);
      armTo(q, 'armF', q.cible ? vers(q._def.sh.armF, loc(q.cible), 186) : [86, -66], po); A.head = (A.head || 0) + 0.08 * po; if (!f.brow) f.brow = 'up';
    }
    if (aj > 0) {                                                       // ajuste ses lunettes (poing au pont des lunettes)
      const H = headPt(q, 44, -50); armTo(q, 'armF', [H[0] + 6, H[1] + 4], aj); A.head = (A.head || 0) - 0.04 * aj; if (!f.brow) f.brow = 'up';
    }
    if (id > 0) {                                                       // idée : main ouverte levée à côté de la tête, paume vers le haut
      armTo(q, 'armF', [152, -188], id); q.handF = 'open'; A.head = (A.head || 0) - 0.12 * id;
      if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o'; if (!f.eyes) f.eyes = 'wide';
    }
    if (pu > 0) {                                                       // pousse le chariot : deux mains devant lui (cible = poignée)
      plier(q, 0.14 * pu); const T = q.cible ? vers(q._def.sh.armF, loc(q.cible), 186) : [130, -96];
      armTo(q, 'armF', T, pu); armTo(q, 'armB', vers(q._def.sh.armB, [T[0] - 4, T[1] + 6], 186), pu); q._brasPris = true;
    }
    if (ch > 0) {                                                       // cherche : main en visière, tête qui tourne lentement
      A.head = (A.head || 0) + (-0.1 + 0.12 * Math.sin(t * 1.7)) * ch;
      const H = headPt(q, 30, -70); armTo(q, 'armF', [H[0] + 30, H[1] - 2], ch); q.handF = 'open'; if (!f.brow) f.brow = 'frown';
    }
    if (pg > 0) {                                                       // poignée de main : main ouverte tendue, qui secoue
      armTo(q, 'armF', [138, -96 + 7 * Math.sin(t * TAU * 2.2) * pg], pg); q.handF = 'open'; if (!f.mouth) f.mouth = 'smile';
    }
    if (fi > 0) {                                                       // fier : torse bombé, menton levé, main qui tient le revers
      q.tilt = (q.tilt || 0) - 0.05 * fi; A.head = (A.head || 0) - 0.16 * fi; armTo(q, 'armF', [40, -134], fi); blend(q, 'armB_lo', -0.1, fi);   // main au revers de la veste
      if (!f.mouth) f.mouth = 'smile'; if (!f.eyes) f.eyes = 'half'; q._brasPris = true;
    }
    if (ab > 0) {                                                       // abattu : tête basse, épaules tombées
      plier(q, 0.07 * ab); A.head = (A.head || 0) + 0.36 * ab; q.dy = (q.dy || 0) + 5 * ab;
      blend(q, 'armF_up', 0.04, ab); blend(q, 'armF_lo', -0.06, ab); blend(q, 'armB_up', 0.02, ab); blend(q, 'armB_lo', -0.05, ab);
      if (!f.brow) f.brow = 'worry'; if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'tight';
    }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.2 * Math.sin(M.tg(t) * 1.8);
  }, 0.9);
  // siège : point écran de l'assise (dessous des cuisses) quand Marston est `assis: 1` en (x, y) ; dessiner le fauteuil AVANT Marston
  WW.marston.siege = (x, y, s, dir) => { s = s == null ? 0.9 : s; dir = dir || 1; return [x - 6 * s * dir, y - 115 * s]; };
  WW.brassardPt = (r) => r.w('brassardP', 0, 4);

  // =====================================================================
  // 5) WONDER WOMAN (1941) — athlétique, longs cheveux noirs ondulés, diadème d'or à étoile rouge, haut rouge à bordure dorée,
  //    jupe-culotte bleu nuit étoilée, bracelets d'argent larges (éclat), bottes rouges montantes, lasso doré à la hanche
  // =====================================================================
  const WC = { peau: '#e8c09c', peauD: '#c9a07c', rouge: '#A8322D', rougeD: '#86261f', or: '#C9A23A', orL: '#efd57e', orD: '#8a6a1e', bleu: '#22345C', bleuL: '#33507e',
    argent: '#cdd1d8', argentD: '#868c96', chev: '#17141b', chevL: '#3c3a52', botte: '#a8322d', botteD: '#7e241f' };
  const WW_TORSO = [[-14, -172], [8, -176], [18, -164], [24, -150], [36, -132], [40, -116], [32, -100], [27, -76], [30, -48], [38, -16], [44, 16], [47, 46, 1], [-49, 48, 1], [-47, 14], [-40, -30], [-35, -70], [-37, -110], [-35, -148], [-25, -166]];
  const WW_HEAD = [[-15, 16], [10, 16], [12, 4], [20, -4], [26, -10], [28, -17], [26, -22], [28, -26], [27, -30], [30, -34], [34, -40, 1], [30, -46], [28, -55], [28, -64], [25, -78], [13, -92], [-6, -97], [-24, -88], [-32, -68], [-31, -46], [-24, -28], [-17, -8]];
  const WW_HAIRB = [[18, -86], [4, -102], [-16, -106], [-36, -96], [-46, -76], [-49, -50], [-53, -22], [-58, 8], [-54, 36], [-62, 66, 1], [-44, 58], [-34, 76, 1], [-26, 52], [-18, 30], [-22, 8], [-22, -12], [-26, -32], [-30, -52], [-26, -68], [-10, -82], [6, -88]];
  const WW_HAIRF = [[26, -66], [30, -80], [24, -94], [8, -104], [-12, -107], [-32, -100], [-42, -84], [-44, -64], [-36, -56], [-31, -70], [-20, -80], [-4, -84], [12, -82], [20, -74]];
  const WW_TIARA = [[-22, -90], [-2, -98], [14, -100], [23, -108, 1], [28, -96], [30, -84], [25, -82], [20, -90], [2, -92], [-20, -84]];
  const WW_LEG = { LT: 122, LS: 129, rH: 19, rK: 13, wA: 9, toe: 44 };
  const bracelet = (p, back) => {
    fillPts([[-14, 46, 1], [14, 46, 1], [13, 74, 1], [-13, 74, 1]], back ? WC.argentD : WC.argent);
    strokePts([[-13, 49], [13, 49]], 'rgba(255,255,255,0.8)', 1.4); strokePts([[-12, 71], [12, 71]], 'rgba(40,44,52,0.6)', 1.4);
    strokePts([[5, 50], [5, 70]], 'rgba(255,255,255,0.55)', 2.2);
  };
  function eclat(p, x, y, back) {                     // reflet qui brille sur le bracelet (étoile de lumière), dessin brut gardé
    const e = clamp(p.eclat || 0) * (back ? 0.7 : 1); if (e <= 0.02 || SIL()) return;
    const c = cx_(), g = M.tg(p.t || 0), k = e * (0.75 + 0.25 * Math.sin(g * 9)), r = 26 * k;
    c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(x, y, 1, x, y, r * 1.4); gr.addColorStop(0, `rgba(255,255,250,${0.75 * k})`); gr.addColorStop(1, 'rgba(255,255,250,0)'); c.fillStyle = gr; c.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
    c.restore(); fillPts(star(x, y, r, r * 0.16, 4, g * 0.6), `rgba(255,255,255,${0.95 * k})`, 0, 0);
  }
  function mkWonder() {
    const parts = {
      cheveuxB: { parent: 'head', at: [0, 0], pts: WW_HAIRB, base: WC.chev, seed: 8101, noRivet: true, paint: () => {
        for (let i = 0; i < 4; i++) strokePts(qbez([-26 - i * 6, -80], [-40 - i * 4, -10], [-34 - i * 6, 60], 10), 'rgba(90,90,130,0.45)', 1.3);
        hatch(null, 1.2, 3.4, 0.2);
      } },
      torso: { parent: null, at: [0, 0], pts: WW_TORSO, base: WC.peau, seed: 8102, paint: () => {
        hatch([[-40, -172], [-20, -172], [-20, -130], [-40, -130]], 0.7, 4, 0.18);
        fillPts([[-40, -134], [-8, -140], [18, -148], [34, -138], [40, -116], [32, -100], [27, -76], [30, -46], [-42, -42], [-40, -90]], WC.rouge);     // haut rouge
        strokePts([[16, -142], [30, -118], [26, -100]], 'rgba(60,10,8,0.35)', 1.4);
        strokePts([[-40, -134], [-8, -140], [18, -148], [34, -138], [40, -118]], WC.or, 4.6); strokePts([[-38, -136], [-8, -142], [18, -150], [33, -140]], WC.orL, 1.3);   // bordure dorée
        fillPts([[-43, -50], [29, -52], [31, -38], [-44, -36]], WC.or); strokePts([[-42, -48], [29, -50]], WC.orL, 1.2);                            // ceinture d'or
        fillPts([[-44, -38], [31, -40], [38, -14], [44, 16], [47, 48], [-49, 48], [-47, 14], [-41, -26]], WC.bleu);                                    // jupe-culotte bleu nuit
        for (const [x, y] of [[-30, -22], [-6, -26], [18, -22], [-20, 2], [6, -2], [32, 6], [-38, 28], [-12, 24], [14, 30], [38, 34]]) fillPts(star(x, y, 4.6, 1.9, 5), '#f4f2ea', 0, 0);
        strokePts([[-6, -36], [-2, 46]], 'rgba(10,16,40,0.45)', 1.4);                                                                                  // fente de la jupe-culotte
        hatch([[-52, -140], [-14, -140], [-14, 50], [-52, 50]], 0.75, 4.2, 0.26); shade(44, -60, -50, -60, 0.28, [-54, -180, 50, 50]);
      } },
      ...legParts('B', [-8, -2], WW_LEG, WC.peauD, WC.botteD, 8103, true, null, (LS) => { fillPts([[-30, 22], [30, 22], [30, LS + 10], [-30, LS + 10]], WC.botteD); }),
      ...legParts('F', [8, -2], WW_LEG, WC.peau, WC.botte, 8105, false, () => shade(18, 0, -18, 0, 0.22, [-22, -20, 22, 130]), (LS) => {
        fillPts([[-30, 22], [30, 22], [30, LS + 10], [-30, LS + 10]], WC.botte);
        fillPts([[-16, 14], [16, 14], [16, 26], [-16, 26]], WC.botteD); strokePts([[-14, 16], [14, 16]], 'rgba(255,220,200,0.45)', 1.2);       // revers de botte
        strokePts([[9, 30], [10, LS - 30]], '#efe6d6', 2.6);                                                                                         // liseré blanc
      }),
      armB_up: upDef([-10, -144], WC.peauD, 8107, () => hatch(null, 0.9, 3.8, 0.3), 14),
      armB_lo: avantBras('armB_up', true, WC.peauD, WC.peauD, 8108, (p) => bracelet(p, true)),
      head: { parent: 'torso', at: [6, -170], pts: WW_HEAD, base: WC.peau, seed: 8109, noRivet: true, paint: (p) => {
        const f = p.face || {};
        hatch([[-24, -42], [0, -30], [10, -8], [-6, 18], [-34, 4]], 0.6, 3.6, 0.18);
        dot(14, -28, 9, 'rgba(225,120,110,0.28)');
        X.eye(f, 17, -51, 1.08); if ((f.eyes || 'open') !== 'closed') strokePts([[22, -55], [26, -57], [27, -60]], 'rgba(20,12,12,0.95)', 1.3);   // cils
        X.brow(f, 17, -61, 'rgba(26,18,20,0.95)', 2.2);
        const m = f.mouth || 'smile';
        if (m === 'smile') { fillPts([[28, -25], [22, -22], [17, -24], [19, -26.5], [24, -26]], '#b3423a', 0, 0); strokePts([[16, -27], [14, -29]], 'rgba(140,60,50,0.5)', 1); }
        else X.mouth(Object.assign({}, f, { mouth: m }), 26, -24, '#a8322d');
        strokePts([[18, -11], [26, -9]], 'rgba(150,100,80,0.25)', 1.1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: WW_HAIRF, base: WC.chev, seed: 8110, noRivet: true, paint: () => {
        for (let i = 0; i < 4; i++) strokePts(qbez([22 - i * 5, -80 - i * 6], [-2 - i * 4, -100 + i * 2], [-38 + i * 2, -64 + i * 4], 10), 'rgba(110,110,160,0.5)', 1.3);
        strokePts(qbez([20, -94], [4, -106], [-18, -102], 8), 'rgba(200,200,240,0.3)', 2);
      } },
      diademe: { parent: 'head', at: [0, 0], pts: WW_TIARA, base: WC.or, seed: 8111, noRivet: true, paint: () => {
        strokePts([[-20, -88], [2, -95], [14, -97]], WC.orL, 1.3); strokePts([[-18, -85], [2, -90], [20, -88]], WC.orD, 1.1);
        fillPts(star(23, -96, 6.6, 2.8, 5), '#c0221c', 0, 0); dot(22, -97, 1.3, '#ffb0a0');
      } },
      lassoH: { parent: 'torso', at: [24, -8], noRivet: true, base: '#000', seed: 8112, pts: OFFP, extra: (p) => {
        if (p.enroule === false) return;
        for (let k = 0; k < 3; k++) corde(ep(0, 6 + k * 2, 17 + k * 1.5, 27 + k * 2, 16, 0, TAU), 4.6, k < 2);
      } },
      armF_up: upDef([-2, -144], WC.peau, 8113, () => { shade(16, 0, -16, 0, 0.2, [-18, -20, 18, 100]); hatch([[-16, -20], [-4, -20], [-4, 100], [-16, 100]], 0.9, 3.8, 0.2); }, 14),
      eclatB: { parent: 'armB_lo', at: [0, 0], noRivet: true, base: '#000', seed: 8114, pts: OFFP, extra: (p) => eclat(p, 6, 58, true) },
      armF_lo: avantBras('armF_up', false, WC.peau, WC.peau, 8115, (p) => bracelet(p, false)),
      eclatF: { parent: 'armF_lo', at: [0, 0], noRivet: true, base: '#000', seed: 8116, pts: OFFP, extra: (p) => eclat(p, 6, 58, false) },
    };
    const d = defOf('Wonder Woman', parts, { skin: WC.peau, skinB: WC.peauD, seed: 8120, hipY: -252, sh: { armF: [-2, -144], armB: [-10, -144] }, headAt: [6, -170], torseY: -92,
      pre0: ['cheveuxB'], pre: ['cheveux', 'diademe'], post: ['lassoH'] });
    d.order.splice(d.order.indexOf('armB_lo') + 1, 0, 'eclatB'); d.order.push('eclatF');
    return d;
  }
  CH.wwWonder = mkWonder();
  WW.wonder = wrap('wwWonder', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0;
    expr(q, q.expr);
    const k = (n) => ease(clamp(q[n] || 0));
    const br = k('bracelets'), la = k('lance'), ti = k('tient'), ou = k('ouvre'), fi = k('fiere');
    if (!(br || la || ti || ou || fi)) { blend(q, 'armF_lo', -0.16, 1); blend(q, 'armB_lo', -0.12, 1); }
    if (br > 0) {                                                       // deux avant-bras levés devant elle, bracelets vers le public
      armTo(q, 'armF', [98, -262], br); armTo(q, 'armB', [62, -212], br); q._brasPris = true;
      A.head = (A.head || 0) - 0.05 * br; if (q.eclat == null) q.eclat = br; if (!f.brow) f.brow = 'frown';
      add(q, 'legF_up', -0.16 * br); add(q, 'legB_up', 0.14 * br); add(q, 'legB_lo', 0.08 * br);
    }
    if (la > 0) {                                                       // lance le lasso : bras levé, corde au poing (boucle : WW.lasso)
      if (q.tenu == null) q.tenu = 'corde'; if (q.enroule == null) q.enroule = false;
      armTo(q, 'armF', [64, -318], la); armTo(q, 'armB', [96, -112], la); q.handB = q.handB || 'open'; q._brasPris = true;
      A.head = (A.head || 0) - 0.16 * la; q.tilt = (q.tilt || 0) - 0.03 * la;
      add(q, 'legF_up', -0.26 * la); add(q, 'legB_up', 0.22 * la); add(q, 'legB_lo', 0.1 * la);
    }
    if (ti > 0) {                                                       // tient le lasso tendu à deux mains, penchée en arrière
      if (q.tenu == null) q.tenu = 'corde'; if (q.enroule == null) q.enroule = false; if (q.deuxMains == null) q.deuxMains = true; q._brasPris = true;
      armTo(q, 'armF', [146, -112], ti); q.tilt = (q.tilt || 0) - 0.07 * ti; A.head = (A.head || 0) + 0.04 * ti;
      add(q, 'legF_up', -0.34 * ti); add(q, 'legB_up', 0.2 * ti); add(q, 'legB_lo', 0.12 * ti); if (!f.brow) f.brow = 'frown';
    }
    if (ou > 0) {                                                       // bras ouverts en V vers le haut, sourire (« par l'amour »)
      armTo(q, 'armF', [128, -322], ou); armTo(q, 'armB', [44, -346], ou); q.handF = 'open'; q.handB = 'open'; q._brasPris = true;
      A.head = (A.head || 0) - 0.18 * ou; if (!f.brow) f.brow = 'up'; if (!f.eyes) f.eyes = 'half';
    }
    if (fi > 0) {                                                       // fière : poing sur la poitrine, menton levé
      armTo(q, 'armF', [34, -126], fi); A.head = (A.head || 0) - 0.12 * fi; q._brasPris = true;
      add(q, 'legF_up', -0.12 * fi); add(q, 'legB_up', 0.1 * fi);
    }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.2 * Math.sin(M.tg(t) * 1.9);
  }, 0.9);
  // point écran du bout de la corde (main avant) quand elle tient le lasso : WW.wonderMain(r) ; sinon centre du poing
  WW.wonderMain = (r) => (r.tenu === 'corde' ? WW.pt(r, 'bout') : r.main);

  // =====================================================================
  // 6) LE MÉCHANT (gangster de bande dessinée) — petit, maigre, chapeau mou anthracite à bord court, loup noir, menton bleuté,
  //    costume rayé violet sombre, chemise noire, cravate moutarde, sac de butin
  // =====================================================================
  const ME = { peau: '#dcb796', peauD: '#bf9a7a', costume: '#4A3550', costumeD: '#3a2840', raie: 'rgba(205,185,225,0.32)', chem: '#25212b', cravate: '#C79A2E', cravateD: '#9a7420',
    chapeau: '#3a3b3f', chapeauD: '#28292d', ruban: '#141416', loup: '#0f0e12', soulier: '#16120f' };
  const ME_TORSO = [[-12, -160], [10, -164], [20, -154], [30, -136], [33, -104], [32, -62], [30, -24], [30, 8], [28, 32, 1], [-34, 34, 1], [-36, 0], [-38, -50], [-41, -104], [-38, -140], [-25, -156]];
  const ME_HEAD = [[-13, 16], [9, 16], [11, 2], [18, -6], [23, -10], [25, -17], [23, -22], [26, -26], [25, -30], [29, -34], [38, -40, 1], [30, -46], [27, -55], [27, -64], [24, -77], [12, -90], [-6, -95], [-22, -86], [-30, -66], [-29, -44], [-22, -26], [-15, -8]];
  const ME_HAT = [[-40, -80, 1], [-22, -82], [-24, -110], [-14, -124], [2, -120], [12, -127], [24, -116], [24, -90], [42, -86, 1], [40, -80], [0, -76]];
  const ME_LEG = { LT: 112, LS: 119, rH: 15, rK: 11, wA: 8, toe: 44 };
  const raies = (x0, x1, y0, y1) => { if (SIL()) return; for (let x = x0; x <= x1; x += 7) strokePts([[x, y0], [x + 1, y1]], ME.raie, 1); };
  function mkMechant() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: ME_TORSO, base: ME.costume, seed: 8201, paint: () => {
        raies(-44, 36, -170, 40);
        fillPts([[6, -162], [20, -154], [28, -134], [26, -96], [18, -96], [12, -130], [4, -150]], ME.chem);                                         // chemise noire
        fillPts([[16, -156], [22, -150], [20, -144], [14, -148]], ME.cravate); fillPts([[14, -146], [21, -146], [27, -104], [22, -94], [16, -102]], ME.cravate);   // cravate moutarde
        strokePts([[17, -140], [23, -104]], ME.cravateD, 1.2);
        fillPts([[2, -164], [14, -158], [20, -144], [10, -146]], ME.costumeD);                                                                    // revers
        strokePts([[20, -150], [28, -120], [30, -60], [28, 30]], 'rgba(20,10,24,0.6)', 1.4);
        fillPts([[22, -126], [30, -130], [28, -122]], '#d8d0c0');                                                                                    // pochette blanche
        hatch([[-46, -160], [-12, -160], [-12, 36], [-46, 36]], 0.75, 4, 0.3); shade(34, -40, -40, -40, 0.3, [-44, -166, 36, 36]);
      } },
      ...legParts('B', [-6, -2], ME_LEG, ME.costumeD, ME.costumeD, 8202, true, () => raies(-16, 16, -10, 120), shoe('#0f0c0a', 20)),
      ...legParts('F', [6, -2], ME_LEG, ME.costume, ME.costume, 8204, false, () => raies(-16, 16, -10, 120), (LS) => { raies(-12, 12, 0, LS - 22); shoe(ME.soulier, 20)(LS); }),
      armB_up: upDef([-10, -136], ME.costumeD, 8206, () => { raies(-14, 14, -12, 96); hatch(null, 0.9, 3.8, 0.3); }, 13),
      armB_lo: avantBras('armB_up', true, ME.costumeD, ME.peauD, 8207, () => { raies(-10, 10, -8, 60); fillPts([[-14, 62, 1], [14, 62, 1], [15, 76, 1], [-14, 76, 1]], '#cfc6b0'); }),
      head: { parent: 'torso', at: [10, -156], pts: ME_HEAD, base: ME.peau, seed: 8208, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        fillPts([[-16, -26], [-8, -16], [6, -10], [20, -4], [26, -12], [26, -20], [14, -26], [0, -24], [-12, -32]], 'rgba(70,90,135,0.4)');          // menton mal rasé bleuté
        if (!SIL()) for (let i = 0; i < 26; i++) dot(lerp(-10, 24, hash(i * 3.3)), lerp(-24, -6, hash(i * 5.1)), 0.8, 'rgba(40,50,80,0.55)');
        hatch([[-22, -42], [0, -30], [10, -8], [-6, 18], [-30, 4]], 0.6, 3.6, 0.26);
        fillPts([[-6, -62], [8, -64], [24, -60], [33, -54], [31, -44], [22, -42], [12, -46], [0, -44], [-6, -50]], ME.loup);                         // loup noir
        strokePts([[-6, -56], [-22, -54]], ME.loup, 2.4);
        const fe = Object.assign({}, f); X.eye(fe, 18, -52, 0.95); X.brow(f, 18, -64, 'rgba(20,16,18,0.95)', 2.6);
        if ((f.mouth || 'n') === 'o') fillPts(ell(26, -22, 4, 5, 10), '#2a1210', 0, 0); else X.mouth(f, 26, -22);
      } },
      chapeau: { parent: 'head', at: [0, 0], pts: ME_HAT, base: ME.chapeau, seed: 8209, noRivet: true, paint: () => {
        fillPts([[-24, -88], [24, -94], [24, -102], [-24, -97]], ME.ruban);                                                                         // ruban
        strokePts([[-14, -122], [2, -116], [12, -124]], ME.chapeauD, 1.6);                                                                         // creux du chapeau mou
        strokePts([[-38, -81], [0, -78], [40, -82]], 'rgba(200,200,210,0.3)', 1.2);
        hatch(null, 0.7, 3.4, 0.24); shade(24, -100, -24, -100, 0.25, [-42, -130, 44, -74]);
      } },
      armF_up: upDef([-2, -136], ME.costume, 8210, () => { raies(-14, 14, -12, 96); hatch([[-14, -20], [-3, -20], [-3, 100], [-14, 100]], 0.9, 3.8, 0.24); }, 13),
      armF_lo: avantBras('armF_up', false, ME.costume, ME.peau, 8211, () => { raies(-10, 10, -8, 60); fillPts([[-14, 62, 1], [14, 62, 1], [15, 76, 1], [-14, 76, 1]], '#e6dfcc'); }),
    };
    return defOf('mechant', parts, { skin: ME.peau, skinB: ME.peauD, seed: 8220, hipY: -232, sh: { armF: [-2, -136], armB: [-10, -136] }, headAt: [10, -156], torseY: -84, pre: ['chapeau'] });
  }
  CH.wwMechant = mkMechant();
  WW.mechant = wrap('wwMechant', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0;
    expr(q, q.expr);
    const k = (n) => ease(clamp(q[n] || 0));
    const ra = k('rase'), li = k('ligote'), av = k('avoue');
    if (q.sac !== false && q.tenu == null && !(av > 0.5)) q.tenu = 'sac';
    A.head = (A.head || 0) + 0.06;                                      // un peu voûté
    if (!(ra || li || av)) { blend(q, 'armF_lo', -0.2, 1); blend(q, 'armB_lo', -0.12, 1); }
    if (ra > 0) {                                                       // rase les murs : courbé, sur la pointe des pieds, pas furtifs
      plier(q, 0.2 * ra); const w = Math.sin(t * TAU * 1.3);
      add(q, 'legF_up', (-0.26 * w - 0.12) * ra); add(q, 'legB_up', (0.26 * w + 0.06) * ra);
      add(q, 'legF_lo', (0.3 + 0.2 * Math.max(0, w)) * ra); add(q, 'legB_lo', (0.3 + 0.2 * Math.max(0, -w)) * ra);
      q.dy = (q.dy || 0) - (6 + 4 * Math.abs(w)) * ra; A.head = (A.head || 0) - 0.22 * ra;
      armTo(q, 'armF', [70, -74], ra); armTo(q, 'armB', [64, -120], ra); q.handB = q.handB || 'open';
      if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'tight';
    }
    if (li > 0) {                                                       // ligoté : bras collés au corps, sautille
      blend(q, 'armF_up', 0.02, li); blend(q, 'armF_lo', -0.06, li); blend(q, 'armB_up', 0.0, li); blend(q, 'armB_lo', -0.04, li);
      q.dy = (q.dy || 0) - Math.abs(Math.sin(t * TAU * 1.4)) * 18 * li; if (q.tenu === 'sac' && q.sac == null) q.tenu = 'rien';
      if (!f.brow) f.brow = 'worry'; if (!f.eyes) f.eyes = 'wide';
    }
    if (av > 0) {                                                       // avoue : tremble, bouche ronde, a lâché le sac (mains ouvertes)
      q.dx = (q.dx || 0) + 2.2 * Math.sin(t * 37) * av; A.head = (A.head || 0) + 0.03 * Math.sin(t * 29) * av;
      if (!li) { armTo(q, 'armF', [66, -118], av); armTo(q, 'armB', [50, -110], av); q.handF = 'open'; q.handB = 'open'; }
      if (!f.mouth) f.mouth = 'o'; if (!f.brow) f.brow = 'worry'; if (!f.eyes) f.eyes = 'wide';
    }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1 * Math.sin(M.tg(t) * 2.2);
  }, 0.85);

  // =====================================================================
  // 7) LES DEUX HÉROS À CAPE (génériques, AUCUN emblème) — bleu : colosse à mâchoire carrée, accroche-cœur, collant bleu roi, cape rouge, slip et bottes rouges ;
  //    noir : cagoule anthracite à oreilles pointues, collant gris ardoise, cape noire festonnée, ceinture ocre
  // =====================================================================
  const HB = { peau: '#e6bf9a', peauD: '#c79f7c', bleu: '#2F4F9A', bleuD: '#233f7c', bleuL: '#4a6cb8', rouge: '#A8322D', rougeD: '#7e231e', chev: '#121016' };
  const HN = { peau: '#d9b290', peauD: '#bb9474', gris: '#5E636B', grisD: '#4a4e55', grisL: '#7a808a', cag: '#2e3034', cagL: '#4a4d54', noir: '#141416', noirL: '#2c2c32', ocre: '#b08a3a', ocreD: '#86672a' };
  const HE_TORSO = [[-20, -188], [12, -192], [30, -180], [54, -164], [66, -140], [68, -112], [58, -84], [44, -60], [38, -32], [40, 0], [42, 26, 1], [-44, 28, 1], [-46, 0], [-44, -40], [-52, -80], [-62, -120], [-64, -156], [-46, -180]];
  const HE_HEAD = [[-18, 16], [14, 16], [18, 2], [30, -1], [37, -7], [38, -18], [33, -24], [35, -28], [34, -32], [37, -36], [42, -41, 1], [37, -48], [33, -57], [33, -67], [30, -80], [18, -94], [-4, -100], [-26, -92], [-37, -72], [-37, -46], [-31, -24], [-24, -4]];
  const HB_HAIR = [[30, -72], [37, -87], [33, -101], [18, -111], [-2, -115], [-22, -109], [-36, -97], [-42, -78], [-42, -56], [-36, -48], [-30, -58], [-22, -66], [-10, -70], [0, -68], [4, -60], [8, -72], [18, -79], [26, -77]];
  const HE_LEG = { LT: 128, LS: 133, rH: 23, rK: 15, wA: 12, toe: 50 };
  function capePts(p, noire) {
    const g = M.tg(p.t || 0), v = 0.5 + 0.9 * clamp(p.vent || 0), s1 = Math.sin(g * 2.4), s2 = Math.sin(g * 2.4 + 0.9), s3 = Math.sin(g * 2.4 + 1.8);
    if (!noire) return [[-2, -10], [34, -4], [26, 70], [14, 190], [6, 310], [-8, 352, 1], [-46 - 10 * v * s3, 346], [-84 - 22 * v * s3, 330, 1], [-74 - 16 * v * s2, 220], [-56 - 10 * v * s1, 110], [-34, 24]];
    const b = 6 * v * s2;
    return [[-2, -10], [34, -4], [26, 70], [14, 190], [8, 300], [6, 338, 1], [-14, 318], [-30 + b * 0.3, 344, 1], [-48 + b * 0.5, 318], [-68 + b * 0.7, 346, 1], [-86 + b, 316], [-108 + b * 1.2, 340, 1], [-104 + b, 220], [-80 + b * 0.6, 110], [-40, 24]];
  }
  function mkHeros(noire) {
    const C = noire ? HN : HB, body = noire ? HN.gris : HB.bleu, bodyD = noire ? HN.grisD : HB.bleuD, bodyL = noire ? HN.grisL : HB.bleuL, gant = noire ? HN.noirL : null, sd = noire ? 8400 : 8300;
    const bulge = (p) => 9 * clamp(p.muscles || 0);
    const parts = {
      cape: { parent: 'torso', at: [-24, -176], noRivet: true, pts: (p) => capePts(p, noire), base: noire ? HN.noir : HB.rouge, seed: sd + 1, paint: () => {
        for (let i = 0; i < 4; i++) strokePts([[-10 - i * 14, 20], [-20 - i * 18, 320]], noire ? 'rgba(90,90,110,0.35)' : 'rgba(60,10,8,0.35)', 1.6);
        strokePts([[30, 0], [22, 80], [10, 200]], noire ? 'rgba(120,120,140,0.3)' : 'rgba(255,190,170,0.3)', 1.6);
        hatch(null, 0.8, 4, 0.22); shade(30, 0, -90, 0, 0.3, [-120, -20, 40, 360]);
      } },
      torso: { parent: null, at: [0, 0], pts: HE_TORSO, base: body, seed: sd + 2, paint: () => {
        strokePts(qbez([14, -150], [44, -150], [62, -120], 10), 'rgba(10,20,50,0.35)', 1.6);                                                           // pectoral (uni, sans emblème)
        strokePts(qbez([40, -100], [46, -86], [42, -70], 6), 'rgba(10,20,50,0.25)', 1.3); strokePts(qbez([36, -66], [40, -54], [36, -42], 6), 'rgba(10,20,50,0.22)', 1.2);
        strokePts(qbez([4, -184], [40, -176], [62, -146], 10), noire ? 'rgba(200,205,215,0.25)' : 'rgba(160,190,255,0.35)', 1.6);
        if (noire) { fillPts([[-46, -10], [40, -12], [42, 28], [-46, 30]], HN.noir); fillPts([[-46, -30], [39, -32], [40, -12], [-46, -10]], HN.ocre);   // slip noir + ceinture ocre
          for (const x of [-30, -8, 16, 32]) { fillPts(rect(x - 6, -30, x + 4, -14), HN.ocreD); strokePts([[x - 5, -28], [x + 3, -28]], 'rgba(255,230,170,0.4)', 1); } }
        else { fillPts([[-46, -16], [40, -18], [42, 28], [-46, 30]], HB.rouge); strokePts([[-46, -14], [40, -16]], HB.rougeD, 2.2); }                 // slip rouge
        hatch([[-70, -170], [-24, -170], [-24, 30], [-70, 30]], 0.75, 4.2, 0.28); shade(68, -80, -60, -80, 0.3, [-70, -196, 70, 30]);
      } },
      ...legParts('B', [-10, -2], HE_LEG, bodyD, bodyD, sd + 3, true, null, (LS) => fillPts([[-30, LS - 62], [40, LS - 62], [70, LS + 10], [-30, LS + 10]], noire ? HN.noir : HB.rougeD)),
      ...legParts('F', [10, -2], HE_LEG, body, body, sd + 5, false, () => shade(22, 0, -22, 0, 0.25, [-26, -20, 26, 140]), (LS) => {
        fillPts([[-30, LS - 62], [40, LS - 62], [70, LS + 10], [-30, LS + 10]], noire ? HN.noirL : HB.rouge);                                            // bottes
        fillPts([[-18, LS - 66], [16, LS - 66], [20, LS - 56], [-18, LS - 56]], noire ? HN.noir : HB.rougeD);
      }),
      armB_up: upDef([-12, -160], bodyD, sd + 7, () => hatch(null, 0.9, 3.8, 0.3), 19, bulge),
      armB_lo: avantBras('armB_up', true, bodyD, noire ? HN.noir : HB.peauD, sd + 8, noire ? () => fillPts([[-16, 46, 1], [16, 46, 1], [15, 78, 1], [-15, 78, 1]], HN.noir) : null, 1.22),
      head: { parent: 'torso', at: [8, -184], pts: HE_HEAD, base: C.peau, seed: sd + 9, noRivet: true, paint: (p) => {
        const f = p.face || {};
        if (noire) {
          fillPts([[44, -42], [37, -50], [33, -58], [33, -68], [30, -82], [18, -96], [-4, -102], [-28, -94], [-40, -72], [-40, -40], [-34, -10], [-26, 18], [-8, 18], [-10, -4], [2, -28], [20, -36], [34, -34]], HN.cag);   // cagoule
          strokePts([[34, -36], [20, -38], [2, -30], [-8, -6]], HN.cagL, 1.6);
          fillPts([[12, -56], [26, -58], [30, -52], [24, -47], [12, -49]], '#eef0f2', 0, 0); dot(22, -52, 2, '#1a1a1e');                                  // fente de l'œil
          strokePts([[8, -62], [20, -66], [32, -60]], HN.cagL, 2.2);                                                                                         // arcade dure
          X.mouth(Object.assign({ mouth: 'tight' }, f), 31, -21); strokePts([[20, -10], [32, -8]], 'rgba(120,80,60,0.35)', 1.2);
          hatch([[-40, -100], [0, -100], [0, 18], [-40, 18]], 0.7, 3.4, 0.3);
        } else {
          X.earPaint(-9, -44); hatch([[-26, -42], [0, -28], [12, -6], [-8, 18], [-36, 4]], 0.6, 3.6, 0.24);
          strokePts([[18, -2], [30, -2], [37, -8]], 'rgba(130,85,60,0.45)', 1.6); strokePts([[20, -14], [28, -16]], 'rgba(130,85,60,0.3)', 1.1);             // mâchoire carrée
          X.eye(f, 20, -52, 1.05); X.brow(f, 20, -63, 'rgba(16,12,14,0.97)', 3.6);
          if ((f.mouth || 'smile') === 'smile') strokePts([[33, -22], [27, -20], [21, -22]], 'rgba(110,40,38,0.95)', 1.8); else X.mouth(f, 32, -21);
        }
      } },
      haut: noire ? { parent: 'head', at: [0, 0], noRivet: true, base: HN.cag, seed: sd + 10, pts: [[-26, -92], [-20, -132, 1], [-12, -98], [0, -100], [8, -136, 1], [18, -94], [0, -90]], paint: () => { strokePts([[-20, -126], [-16, -100]], HN.cagL, 1.2); strokePts([[8, -130], [12, -100]], HN.cagL, 1.2); } }
        : { parent: 'head', at: [0, 0], noRivet: true, base: HB.chev, seed: sd + 10, pts: HB_HAIR, paint: () => {
          for (let i = 0; i < 4; i++) strokePts(qbez([24 - i * 5, -88 - i * 4], [0 - i * 4, -104 + i * 2], [-36 + i * 2, -62 + i * 4], 10), 'rgba(90,100,160,0.5)', 1.3);
          strokePts(qbez([20, -98], [4, -108], [-16, -104], 8), 'rgba(170,190,255,0.35)', 2);
        } },
      boucle: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: sd + 11, pts: OFFP, extra: () => { if (!noire) { strokePts([[26, -80], [35, -74], [37, -64], [31, -59], [26, -64], [31, -68]], HB.chev, 3.8); } } },   // accroche-cœur
      armF_up: upDef([0, -160], body, sd + 12, () => { shade(18, 0, -18, 0, 0.22, [-20, -20, 28, 100]); hatch([[-18, -20], [-4, -20], [-4, 100], [-18, 100]], 0.9, 3.8, 0.22); }, 19, bulge),
      armF_lo: avantBras('armF_up', false, body, noire ? HN.noirL : HB.peau, sd + 13, noire ? () => { fillPts([[-16, 46, 1], [16, 46, 1], [15, 78, 1], [-15, 78, 1]], HN.noirL); for (const y of [52, 60, 68]) fillPts([[-14, y], [-22, y - 4], [-14, y + 4]], HN.noirL); } : null, 1.22),
    };
    return defOf(noire ? 'heros noir' : 'heros bleu', parts, { skin: noire ? HN.noirL : HB.peau, skinB: noire ? HN.noir : HB.peauD, seed: sd + 20, hipY: -262, sh: { armF: [0, -160], armB: [-12, -160] }, headAt: [8, -184], torseY: -100,
      pre0: ['cape'], pre: ['haut', 'boucle'] });
  }
  CH.wwHerosBleu = mkHeros(false); CH.wwHerosNoir = mkHeros(true);
  function herosPose(noire) {
    return function (q, loc) {
      const A = q.ang, f = q.face, t = q.t || 0;
      expr(q, q.expr);
      const k = (n) => ease(clamp(q[n] || 0));
      const mu = k('muscles'), po = k('poings'), pe = k('perplexe');
      if (!(mu || po || pe)) { blend(q, 'armF_lo', -0.18, 1); blend(q, 'armB_lo', -0.14, 1); add(q, 'legF_up', -0.06); add(q, 'legB_up', 0.06); }
      if (mu > 0) {
        q._brasPris = true; q.tilt = (q.tilt || 0) - 0.03 * mu; A.head = (A.head || 0) - 0.1 * mu;
        if (!noire) { blend(q, 'armF_up', -1.5, mu); blend(q, 'armF_lo', -1.62, mu); blend(q, 'armB_up', -1.78, mu); blend(q, 'armB_lo', -1.3, mu); }   // double biceps en V
        else { blend(q, 'armF_up', -1.15, mu); blend(q, 'armF_lo', -1.95, mu); armTo(q, 'armB', [74, -62], mu); }                                     // un biceps, l'autre poing bas
        add(q, 'legF_up', -0.18 * mu); add(q, 'legB_up', 0.16 * mu); if (!f.brow) f.brow = noire ? 'frown' : 'up';
      }
      if (po > 0) {
        q._brasPris = true;
        if (!noire) { armTo(q, 'armF', [74, -306], po); armTo(q, 'armB', [36, -316], po); A.head = (A.head || 0) - 0.16 * po; }                         // poings levés au-dessus des épaules
        else { armTo(q, 'armF', [128, -204], po); armTo(q, 'armB', [100, -176], po); plier(q, 0.06 * po); A.head = (A.head || 0) + 0.06 * po; }      // garde de boxeur
        add(q, 'legF_up', -0.22 * po); add(q, 'legB_up', 0.2 * po); add(q, 'legB_lo', 0.1 * po); if (!f.brow) f.brow = 'frown';
      }
      if (pe > 0) {
        q._brasPris = true;
        if (!noire) { const H = headPt(q, 38, -6); armTo(q, 'armF', [H[0] + 12, H[1] + 12], pe); A.head = (A.head || 0) + 0.1 * pe; }                 // poing sous le menton
        else { const H = headPt(q, 4, -104); armTo(q, 'armF', [H[0] + 14, H[1] - 4], pe); q.handF = 'open'; A.head = (A.head || 0) + 0.12 * pe; q.tilt = (q.tilt || 0) + 0.02 * pe; }   // se gratte la cagoule
        if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
      }
      if (q.respire !== false) q.dy = (q.dy || 0) + 1.4 * Math.sin(M.tg(t) * 1.6 + (noire ? 1.3 : 0));
    };
  }
  WW.herosBleu = wrap('wwHerosBleu', herosPose(false), 0.9);
  WW.herosNoir = wrap('wwHerosNoir', herosPose(true), 0.9);
  WW.BEND = { marston: { armF: [1, 1], armB: [1, 1] }, wonder: { armF: [1, 1], armB: [1, 1] }, mechant: { armF: [1, 1], armB: [1, 1] }, herosBleu: { armF: [1, 1], armB: [1, 1] }, herosNoir: { armF: [1, 1], armB: [1, 1] } };

  // =====================================================================
  // 8) LE LASSO DORÉ (coordonnées écran) — WW.lasso(t, { de, a, boucle, lueur, rx, ry, mou, moitie, s })
  //    de = [x,y] main (WW.wonderMain(r)) ; a = [x,y] centre de la boucle (r.torse de la cible) ; sans `a` : la boucle tournoie au-dessus de la main.
  //    boucle 0 = grande boucle ouverte qui vole → 1 = deux tours serrés autour du torse ; lueur 0..1 (halo doré qui pulse : « il dit vrai »)
  //    moitie 'arriere' (à dessiner AVANT la cible) / 'avant' (APRÈS la cible, avec la corde) ; sans moitie : tout d'un coup.
  // =====================================================================
  WW.lasso = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), s = o.s || 1, de = o.de || [540, 1000], b = ease(clamp(o.boucle == null ? 1 : o.boucle)), lu = clamp(o.lueur || 0);
    const w = 7 * s; let C, rx, ry, sep, tilt = 0, ang0 = 0;
    if (o.a) { C = o.a; rx = lerp(120, o.rx || 70, b) * s; ry = lerp(44, o.ry || 22, b) * s; sep = lerp(0, 12, b) * s; tilt = (1 - b) * 0.25 * Math.sin(g * 5); }
    else { const a = g * 8; C = [de[0] + 34 * s * Math.cos(a), de[1] - 64 * s + 6 * s * Math.sin(a)]; rx = 96 * s; ry = 24 * s; sep = 0; tilt = 0.12 * Math.sin(a); ang0 = a; }
    const tours = sep > 1 ? [-sep, sep] : [0];
    const ptE = (th, dy) => { const x = rx * Math.cos(th), y = ry * Math.sin(th); return [C[0] + x * Math.cos(tilt) - y * Math.sin(tilt), C[1] + dy + x * Math.sin(tilt) + y * Math.cos(tilt)]; };
    const arc = (a0, a1, dy) => { const o2 = []; for (let i = 0; i <= 24; i++) o2.push(ptE(lerp(a0, a1, i / 24), dy)); return o2; };
    // point d'entrée de la corde : côté de la boucle tourné vers la main
    const vx = (de[0] - C[0]) / rx, vy = (de[1] - C[1]) / ry, thc = Math.atan2(vy, vx), P = ptE(thc, tours[tours.length - 1]);
    const halo = (pts) => { if (lu <= 0.02 || SIL()) return; const k = lu * (0.65 + 0.35 * Math.sin(g * 6)); c.save(); c.globalCompositeOperation = 'lighter';
      strokePts(pts, `rgba(255,214,110,${0.18 * k})`, w * 5); strokePts(pts, `rgba(255,232,160,${0.3 * k})`, w * 2.4); c.restore(); };
    const back = o.moitie !== 'avant', front = o.moitie !== 'arriere';
    if (back) for (const dy of tours) { const pts = arc(PI, TAU, dy); halo(pts); corde(pts, w); }
    if (front) {
      for (const dy of tours) { const pts = arc(0, PI, dy); halo(pts); corde(pts, w); }
      const dist = Math.hypot(P[0] - de[0], P[1] - de[1]), mou = o.mou != null ? o.mou : o.a ? lerp(0.45, 0.06, b) : 0.18;
      const rope = qbez(de, [(de[0] + P[0]) / 2, (de[1] + P[1]) / 2 + mou * dist * 0.5], P, 22);
      halo(rope); corde(rope, w);
      fillPts(ell(P[0], P[1], 7 * s, 9 * s, 10), GOLDD); fillPts(ell(P[0], P[1], 5 * s, 7 * s, 10), GOLD);           // nœud coulant
      if (lu > 0.02 && !SIL()) for (let i = 0; i < 6; i++) { const u = fr(i / 6 + g * 0.35), q = rope[Math.floor(u * (rope.length - 1))], k = lu * Math.sin(PI * u); fillPts(star(q[0], q[1] - 8 * s, 6 * s * k, 1.2 * s, 4, g), `rgba(255,248,210,${0.9 * k})`, 0, 0); }
    }
    return { centre: C, noeud: P, rx, ry };
  };

  // =====================================================================
  // 9) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { nom: name, hipY: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name]; o = o || {};
    return M.puppet(accDef('o_' + name, (oo) => { const b = ptOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(Object.assign({ t: oo.t || 0 }, oo)); c.restore(); }),
      { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function locPt(px, py, x, y, s, o) { o = o || {}; const d = o.dir || 1, r = o.rot || 0, X0 = px * s * d, Y0 = py * s; return [x + X0 * Math.cos(r) - Y0 * Math.sin(r) * d, y + X0 * Math.sin(r) * d + Y0 * Math.cos(r)]; }
  WW.accPt = function (name, x, y, s, o, nom) { const ob = OBJ[name], oo = o || {}, b = ptOf(ob.base, oo), q = ob.pts[nom] ? ptOf(ob.pts[nom], oo) : nom === 'prise' ? gripOf(ob, oo) : [0, 0]; return locPt(q[0] - b[0], q[1] - b[1], x, y, s == null ? 1 : s, oo); };
  WW.detecteur = (x, y, s, o) => acc('detecteur', x, y, s, o);
  WW.detecteurPt = (x, y, s, o, nom) => WW.accPt('detecteur', x, y, s, o, nom || 'cadran');
  WW.couverture = (x, y, s, o) => acc('couverture', x, y, s == null ? 1 : s, o);
  WW.poire = (x, y, s, o) => acc('poire', x, y, s, o);
  WW.sac = (x, y, s, o) => acc('sac', x, y, s, o);
  WW.brassard = (x, y, s, o) => acc('manchette', x, y, s, Object.assign({}, o, { ang2: (o && o.ang) || 0 }));

  // =====================================================================
  // 10) DÉCOR RÉCURRENT — RUE DE NEW YORK 1940-41 ET SON KIOSQUE. Pré-rendus jour (fin d'après-midi dorée) et nuit dans WW.init(), fondus selon o.nuit.
  //     WW.rue(t, up, o) AVANT M.drawFloor() ; WW.rueSol(t, up, o) juste APRÈS (premier plan). Animations en temps global.
  // =====================================================================
  const RUE = {
    kiosque: { x0: 752, x1: 1028 }, comptoir: { x0: 744, x1: 1036, y: 1118 }, trappe: { x0: 850, x1: 950, y: 1118, x: 900 }, auvent: { y0: 700, y1: 770 },
    ficelles: [{ x0: 768, x1: 1012, y: 800 }, { x0: 768, x1: 1012, y: 948 }],
    couv: { a: [808, 803], c: [890, 806], b: [972, 803], d: [846, 951], e: [944, 951] }, couvS: 0.8,
    becGaz: { x: 120, y: 730 }, egout: { x: 215, y: 1488 }, ampoule: { x: 890, y: 790 },
    facade: { x1: 244, corniche: 150, paliers: [352, 532, 712], cafe: { x0: 16, x1: 200, y0: 1010, y1: 1290 } },
    enseigneCafe: { x: 272, y: 848 }, enseigneChapeau: { x: 968, y: 556 }, toits: [[330, 760], [680, 800]], zone: { x0: 250, x1: 750 },
  };
  WW.RUE = RUE;
  const FEN = [];                                       // fenêtres qui peuvent s'allumer la nuit : [x, y, w, h]
  const teinte = (c, n, h) => { c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = n ? 'rgba(12,18,48,0.6)' : 'rgba(255,170,90,0.10)'; c.fillRect(0, 0, W, h); c.restore(); };
  function makeCiel(n) {
    return M.pre(W, BACK + 40, (c) => {
      const gr = c.createLinearGradient(0, 0, 0, BACK);
      if (n) { gr.addColorStop(0, '#0a1024'); gr.addColorStop(0.5, '#16203e'); gr.addColorStop(0.82, '#2c3358'); gr.addColorStop(1, '#4b4668'); }
      else { gr.addColorStop(0, '#d48450'); gr.addColorStop(0.42, '#eaa86a'); gr.addColorStop(0.75, '#f5cf94'); gr.addColorStop(1, '#f7dfb0'); }
      c.fillStyle = gr; c.fillRect(0, 0, W, BACK + 40);
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.3; c.fillStyle = M.tex.canvasPat; c.fillRect(0, 0, W, BACK + 40); c.restore();
      for (let i = 0; i < 16; i++) { const y = 120 + i * 52 + 14 * hash(i * 3.7); strokePts(qbez([-20, y], [540, y + 18 * (hash(i) - 0.5)], [1100, y + 6], 12), n ? 'rgba(120,140,210,0.07)' : 'rgba(255,240,210,0.16)', 9 + 8 * hash(i * 1.3)); }
    });
  }
  function tour(cx, base, tiers, col, seed, fen) {
    tiers.forEach(([hw, yt], i) => {
      pc(rect(cx - hw, yt, cx + hw, base), col, () => {
        for (let x = cx - hw + 6; x < cx + hw - 3; x += 9) strokePts([[x, yt + 8], [x, base]], 'rgba(70,58,80,0.26)', 2.4);
        shade(cx + hw, 0, cx - hw, 0, 0.22, [cx - hw, yt, cx + hw, base]);
      }, seed + i, { drop: false });
      if (fen) for (let y = yt + 14; y < Math.min(base, 860); y += 22) for (let x = cx - hw + 5; x < cx + hw - 5; x += 9) if (hash(x * 1.7 + y * 3.1 + seed) > 0.84) FEN.push([x - 2.5, y, 5, 9]);
    });
  }
  function chateauDEau(x, roof, k) {
    for (const lx of [-20, -6, 8, 22]) strokePts([[x + lx * k, roof], [x + lx * 0.9 * k, roof - 40 * k]], '#3e2c1e', 2.4);
    strokePts([[x - 22 * k, roof - 20 * k], [x + 22 * k, roof - 14 * k]], '#3e2c1e', 1.6);
    pc(rect(x - 28 * k, roof - 104 * k, x + 28 * k, roof - 40 * k), '#7a5a3e', () => {
      for (let xx = x - 26 * k; xx < x + 28 * k; xx += 6 * k) strokePts([[xx, roof - 104 * k], [xx, roof - 40 * k]], 'rgba(40,24,12,0.35)', 1);
      for (const yy of [-92, -72, -52]) strokePts([[x - 28 * k, roof + yy * k], [x + 28 * k, roof + yy * k]], '#2a2a2e', 2);
      shade(x + 28 * k, 0, x - 28 * k, 0, 0.3, [x - 30 * k, roof - 106 * k, x + 30 * k, roof - 38 * k]);
    }, 9500 + x, { drop: false });
    pc([[x - 32 * k, roof - 102 * k], [x + 32 * k, roof - 102 * k], [x, roof - 134 * k, 1]], '#5a4030', null, 9501 + x, { drop: false });
    dot(x, roof - 136 * k, 3 * k, '#3a2a1e');
  }
  function immeuble(x0, x1, roof, col, seed, fen) {
    pc(rect(x0, roof, x1, BACK + 10), col, () => {
      for (let y = roof + 30; y < BACK - 110; y += 58) for (let x = x0 + 16; x < x1 - 24; x += 38) {
        fillPts(rect(x, y, x + 18, y + 26), 'rgba(52,40,48,0.55)'); strokePts([[x - 2, y + 28], [x + 20, y + 28]], 'rgba(255,240,220,0.25)', 1.6);
        if (fen && y < 1120 && hash(x * 2.3 + y * 1.1 + seed) > (y > 900 ? 0.82 : 0.6)) FEN.push([x, y, 18, 26]);
      }
      fillPts(rect(x0, roof, x1, roof + 12), 'rgba(40,24,20,0.35)');
      fillPts(rect(x0, BACK - 100, x1, BACK + 10), 'rgba(30,20,22,0.45)');                                        // devantures au loin
      for (let x = x0 + 10; x < x1 - 30; x += 52) { fillPts(rect(x, BACK - 86, x + 40, BACK - 20), 'rgba(250,220,160,0.25)'); for (let k = 0; k < 4; k++) fillPts(rect(x + k * 10, BACK - 100, x + k * 10 + 5, BACK - 88), k % 2 ? 'rgba(150,40,30,0.5)' : 'rgba(230,220,200,0.5)'); }
      shade(x1, 0, x0, 0, 0.25, [x0, roof, x1, BACK + 10]); hatch(null, 0.8, 5, 0.12, 1, undefined, [x0, roof, x1, BACK + 10]);
    }, seed, { drop: false });
  }
  function makeFond(n) {
    const first = !FEN.length;
    const cv = M.pre(W, BACK + 40, (c) => {
      const far = '#b4abb2', farD = '#a49ca6', acier = '#d3ced2', f = first;
      tour(200, BACK, [[52, 690]], farD, 9601, f); tour(370, BACK, [[48, 610], [34, 560], [20, 520]], far, 9603, f);
      // tour à couronne d'arcs et flèche (art déco)
      tour(520, BACK, [[40, 650]], far, 9610, f);
      for (let k = 0; k < 4; k++) { const hw = 36 - k * 8, y0 = 650 - k * 40; pc(ep(520, y0, hw, 40, 12, PI, TAU).concat([[520 + hw, y0 + 2], [520 - hw, y0 + 2]]), acier, () => { for (let j = -2; j <= 2; j++) fillPts([[520 + j * hw * 0.32, y0 - 6], [520 + j * hw * 0.32 - 3, y0 - 22 + Math.abs(j) * 4], [520 + j * hw * 0.32 + 3, y0 - 22 + Math.abs(j) * 4]], 'rgba(60,60,80,0.45)', 0, 0); shade(520 + hw, 0, 520 - hw, 0, 0.3, [480, y0 - 44, 560, y0 + 4]); }, 9620 + k, { drop: false }); }
      pc([[514, 492], [526, 492], [520, 318, 1]], acier, () => shade(526, 0, 514, 0, 0.3, [510, 310, 530, 494]), 9630, { drop: false });
      // tour à gradins et mât
      tour(690, BACK, [[54, 720], [42, 646], [30, 570], [17, 510]], far, 9640, f);
      pc(rect(684, 420, 696, 512), acier, null, 9650, { drop: false }); pc([[687, 422], [693, 422], [690, 372, 1]], acier, null, 9651, { drop: false });
      tour(830, BACK, [[46, 660], [30, 620]], farD, 9660, f); tour(950, BACK, [[62, 720], [44, 690]], far, 9670, f); tour(600, BACK, [[30, 770]], farD, 9680, f);
      // pont suspendu au loin (au-dessus de l'immeuble bas du centre)
      const deck = 934, T1 = 440, T2 = 590;
      for (const tx of [T1, T2]) pc(rect(tx - 10, 840, tx + 10, 1000), '#9c94a2', () => { fillPts(ep(tx, 880, 5, 14, 6, PI, TAU).concat([[tx + 5, 900], [tx - 5, 900]]), 'rgba(60,54,70,0.5)', 0, 0); }, 9690 + tx, { drop: false });
      strokePts(qbez([T1, 844], [(T1 + T2) / 2, 930], [T2, 844], 16), '#8a8292', 1.6); strokePts(qbez([360, deck], [400, 900], [T1, 844], 10), '#8a8292', 1.6); strokePts(qbez([T2, 844], [640, 900], [700, deck], 10), '#8a8292', 1.6);
      for (let x = T1 + 12; x < T2; x += 12) { const u = (x - T1) / (T2 - T1); strokePts([[x, 844 + 172 * u * (1 - u) * 0.5 * 2 * 0.5], [x, deck]], 'rgba(130,122,140,0.6)', 0.8); }
      pc(rect(340, deck, 720, deck + 10), '#958d9c', null, 9695, { drop: false });
      // immeubles plus proches (brique, ocre) et châteaux d'eau en bois
      immeuble(236, 404, 760, '#9b6a52', 9700, f); immeuble(404, 606, 986, '#b6926a', 9701, f); immeuble(606, 770, 800, '#8e5e4c', 9702, f);
      chateauDEau(330, 760, 1); chateauDEau(680, 800, 0.9);
      // brume du soir vers le bas (baisse le contraste derrière les personnages)
      const hz = c.createLinearGradient(0, 860, 0, BACK); hz.addColorStop(0, 'rgba(240,210,170,0)'); hz.addColorStop(1, 'rgba(240,210,170,0.28)');
      c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = hz; c.fillRect(0, 860, W, BACK - 860); c.restore();
      teinte(c, n, BACK + 40);
    });
    return cv;
  }
  function escalierSecours(x0, x1, paliers) {
    const fer = '#1c1a1c';
    paliers.forEach((y, i) => {
      pc(rect(x0, y, x1, y + 7), fer, null, 9800 + i, { drop: false });
      strokePts([[x0, y - 48], [x1, y - 48]], fer, 3); for (let x = x0; x <= x1; x += 11) strokePts([[x, y - 48], [x, y]], fer, 1.4);
      strokePts([[x0 + 4, y + 7], [x0 + 30, y + 40]], fer, 2.2); strokePts([[x1 - 4, y + 7], [x1 - 30, y + 40]], fer, 2.2);                    // consoles
      if (i < paliers.length - 1) { const yn = paliers[i + 1], a = i % 2 ? [x1 - 40, y] : [x0 + 40, y], b = i % 2 ? [x0 + 60, yn] : [x1 - 60, yn];
        strokePts([a, b], fer, 3); strokePts([[a[0] + 14 * (i % 2 ? -1 : 1), a[1]], [b[0] + 14 * (i % 2 ? -1 : 1), b[1]]], fer, 3);
        for (let k = 1; k < 9; k++) { const u = k / 9; strokePts([[lerp(a[0], b[0], u), lerp(a[1], b[1], u)], [lerp(a[0], b[0], u) + 14 * (i % 2 ? -1 : 1), lerp(a[1], b[1], u)]], fer, 1.6); } }
    });
    const yl = paliers[paliers.length - 1]; strokePts([[x0 + 60, yl + 7], [x0 + 60, yl + 150]], fer, 2.4); strokePts([[x0 + 76, yl + 7], [x0 + 76, yl + 150]], fer, 2.4);   // échelle repliée
    for (let y = yl + 20; y < yl + 150; y += 14) strokePts([[x0 + 60, y], [x0 + 76, y]], fer, 1.6);
  }
  function makeMilieu(n) {
    return M.pre(W, BACK + 40, (c) => {
      const F = RUE.facade;
      // façade de brique à gauche
      pc(rect(-10, F.corniche + 30, F.x1, BACK + 12), '#8e4632', () => {
        for (let y = F.corniche + 40; y < BACK; y += 12) { strokePts([[0, y], [F.x1, y]], 'rgba(50,20,12,0.33)', 1); for (let x = (Math.round(y / 12) % 2 ? 0 : 14); x < F.x1; x += 28) strokePts([[x, y], [x, y + 12]], 'rgba(50,20,12,0.28)', 1); }
        for (let i = 0; i < 60; i++) fillPts(rect(hash(i * 3.1) * 230, 200 + hash(i * 7.3) * 640, hash(i * 3.1) * 230 + 26, 200 + hash(i * 7.3) * 640 + 10), i % 2 ? 'rgba(160,80,60,0.35)' : 'rgba(70,30,20,0.25)', i);
        shade(F.x1, 0, 0, 0, 0.3, [-10, 150, F.x1, BACK]); hatch(null, 0.8, 4.6, 0.14, 1, undefined, [-10, 150, F.x1, BACK]);
      }, 9810);
      pc(rect(-10, F.corniche, F.x1 + 14, F.corniche + 36), '#b8a88a', () => { for (let x = 0; x < F.x1 + 10; x += 14) fillPts(rect(x, F.corniche + 24, x + 8, F.corniche + 34), 'rgba(80,60,40,0.4)'); strokePts([[-10, F.corniche + 4], [F.x1 + 14, F.corniche + 4]], 'rgba(255,250,230,0.5)', 1.5); }, 9811);
      for (const y0 of [222, 402, 582, 762]) for (const x0 of [34, 140]) {
        pc(rect(x0 - 6, y0 - 12, x0 + 76, y0), '#c2b296', null, 9820 + x0 + y0, { drop: false });
        pc(rect(x0, y0, x0 + 70, y0 + 108), '#2a2630', () => { fillPts(rect(x0, y0, x0 + 70, y0 + 30 + 10 * hash(x0 + y0)), '#d8cdb4'); strokePts([[x0 + 35, y0], [x0 + 35, y0 + 108]], '#5a4a3a', 3); strokePts([[x0, y0 + 54], [x0 + 70, y0 + 54]], '#5a4a3a', 3); strokePts([[x0 + 6, y0 + 60], [x0 + 26, y0 + 100]], 'rgba(255,255,255,0.12)', 4); }, 9830 + x0 + y0);
        pc(rect(x0 - 8, y0 + 108, x0 + 78, y0 + 118), '#c2b296', null, 9840 + x0 + y0, { drop: false });
        if (y0 < 700 && !FEN.done) FEN.push([x0 + 2, y0 + 32, 66, 74, 1]);
      }
      escalierSecours(14, 236, F.paliers);
      // café au rez-de-chaussée : devanture, vitrine chaude, porte, store rayé
      pc(rect(-10, 880, F.x1, BACK + 12), '#4a2620', () => { strokePts([[0, 990], [F.x1, 990]], 'rgba(255,220,180,0.25)', 2); hatch(null, 0.8, 4, 0.2); }, 9850);
      const CF = F.cafe;
      pc(rect(CF.x0, CF.y0, CF.x1, CF.y1), '#d6a45c', () => {
        fillPts(rect(CF.x0, CF.y1 - 70, CF.x1, CF.y1), '#6a3a24'); fillPts(rect(CF.x0, CF.y0 + 70, CF.x1, CF.y0 + 76), '#5a3a24');
        for (const x of [40, 80, 120, 160]) { fillPts(rect(x, CF.y0 + 46, x + 18, CF.y0 + 70), x % 80 ? '#7a4a2a' : '#3a5a4a'); }
        pc(rect(54, CF.y1 - 150, 92, CF.y1 - 70), '#b08a3a', () => { strokePts([[60, CF.y1 - 146], [60, CF.y1 - 74]], 'rgba(255,240,200,0.5)', 2); dot(73, CF.y1 - 110, 5, '#6a4a1a'); }, 9851, { drop: false });   // percolateur
        for (const x of [120, 150]) { fillPts(ell(x, CF.y1 - 78, 10, 4, 10), '#efe6d2'); fillPts(rect(x - 8, CF.y1 - 90, x + 8, CF.y1 - 78), '#efe6d2'); }
        strokePts([[CF.x0 + 10, CF.y0 + 10], [CF.x0 + 60, CF.y1 - 20]], 'rgba(255,255,255,0.18)', 10);
      }, 9852);
      strokePts([[(CF.x0 + CF.x1) / 2, CF.y0], [(CF.x0 + CF.x1) / 2, CF.y1]], '#3a2018', 4);
      pc(rect(206, 1040, 240, BACK), '#3a2018', () => { fillPts(rect(212, 1060, 234, 1180), '#c89a58'); dot(212, 1240, 3, '#d8b86a'); }, 9853);
      const aw = [[-10, 900], [F.x1 + 4, 900], [F.x1 + 30, 984], [-10, 984]];
      pc(aw, '#e8dcc0', () => { for (let k = 0; k < 14; k++) fillPts([[-10 + k * 38, 900], [8 + k * 38, 900], [10 + k * 40, 984], [-8 + k * 40, 984]], '#9a3a2e', k); shade(0, 900, 0, 984, 0.25, [-10, 900, 300, 990]); }, 9854);
      for (let k = 0; k < 7; k++) pc(ep(-10 + k * 40 + 20, 984, 20, 12, 8, 0, PI), k % 2 ? '#9a3a2e' : '#e8dcc0', null, 9855 + k, { drop: false });
      // enseigne-tasse de café (sans lettre) suspendue à une potence
      strokePts([[F.x1, 812], [F.x1 + 62, 812]], '#1c1a1c', 3); strokePts([[F.x1, 836], [F.x1 + 30, 812]], '#1c1a1c', 2);
      const E = RUE.enseigneCafe; strokePts([[E.x - 18, 812], [E.x - 18, 826]], '#1c1a1c', 1.6); strokePts([[E.x + 18, 812], [E.x + 18, 826]], '#1c1a1c', 1.6);
      pc(ell(E.x, E.y, 32, 24, 18), '#2f4a3a', () => { fillPts([[E.x - 14, E.y - 6], [E.x + 12, E.y - 6], [E.x + 8, E.y + 12], [E.x - 10, E.y + 12]], '#efe6d2'); strokePts(ep(E.x + 14, E.y + 2, 6, 6, 8, -PI / 2, PI / 2), '#efe6d2', 2.4); fillPts(ell(E.x, E.y + 14, 18, 3, 8), '#efe6d2'); for (const dx of [-6, 2]) strokePts([[E.x + dx, E.y - 10], [E.x + dx + 3, E.y - 15], [E.x + dx, E.y - 20]], '#efe6d2', 1.4); strokePts(ep(E.x, E.y, 29, 21, 18, 0, TAU), '#c9a23a', 1.6); }, 9860);
      // bec de gaz (le halo et la flamme vivent dans WW.rue)
      const B = RUE.becGaz;
      pc([[B.x - 16, BACK], [B.x + 16, BACK], [B.x + 10, BACK - 40], [B.x + 5, BACK - 60], [B.x + 4, B.y + 50], [B.x - 4, B.y + 50], [B.x - 5, BACK - 60], [B.x - 10, BACK - 40]], '#24302a', () => { strokePts([[B.x - 2, B.y + 54], [B.x - 2, BACK - 50]], 'rgba(200,220,200,0.25)', 1.4); }, 9870);
      pc(rect(B.x - 12, B.y + 40, B.x + 12, B.y + 52), '#24302a', null, 9871, { drop: false }); strokePts([[B.x - 22, B.y + 46], [B.x + 22, B.y + 46]], '#24302a', 3);
      pc([[B.x - 18, B.y - 14], [B.x + 18, B.y - 14], [B.x + 12, B.y + 40], [B.x - 12, B.y + 40]], 'rgba(240,230,190,0.55)', () => { strokePts([[B.x, B.y - 14], [B.x, B.y + 40]], '#24302a', 1.6); }, 9872);
      pc([[B.x - 24, B.y - 12], [B.x + 24, B.y - 12], [B.x, B.y - 40, 1]], '#24302a', null, 9873); dot(B.x, B.y - 42, 4, '#24302a');
      // façade de pierre à droite (derrière le kiosque), enseigne-chapeau
      pc(rect(860, 250, 1090, BACK + 12), '#8d8a84', () => {
        for (let y = 280; y < BACK; y += 40) strokePts([[860, y], [1090, y]], 'rgba(50,46,42,0.3)', 1.2);
        for (const y0 of [300, 470]) for (const x0 of [890, 980]) { fillPts(rect(x0, y0, x0 + 60, y0 + 100), '#2e2a30'); fillPts(rect(x0, y0, x0 + 60, y0 + 24), '#cfc4ae'); if (!FEN.done) FEN.push([x0 + 2, y0 + 26, 56, 72, 1]); }
        shade(1090, 0, 860, 0, 0.25, [860, 250, 1090, BACK]);
      }, 9880);
      pc(rect(852, 236, 1090, 262), '#a8a39a', () => strokePts([[852, 240], [1090, 240]], 'rgba(255,255,240,0.45)', 1.4), 9881);
      strokePts([[1040, 520], [930, 520]], '#1c1a1c', 3); strokePts([[1040, 546], [1010, 520]], '#1c1a1c', 2);
      const H = RUE.enseigneChapeau; strokePts([[H.x - 20, 520], [H.x - 20, H.y - 18]], '#1c1a1c', 1.6); strokePts([[H.x + 20, 520], [H.x + 20, H.y - 18]], '#1c1a1c', 1.6);
      pc([[H.x - 42, H.y + 18], [H.x - 30, H.y + 10], [H.x - 26, H.y - 10], [H.x - 14, H.y - 22], [H.x + 14, H.y - 22], [H.x + 26, H.y - 10], [H.x + 30, H.y + 10], [H.x + 42, H.y + 18], [H.x + 30, H.y + 24, 1], [H.x - 30, H.y + 24, 1]], '#2a2a2e', () => { fillPts(rect(H.x - 28, H.y + 2, H.x + 28, H.y + 10), '#9a3a2e'); strokePts([[H.x - 18, H.y - 16], [H.x + 10, H.y - 20]], 'rgba(255,255,255,0.3)', 2); }, 9882);
      // kiosque à journaux : fond, étagères, montants, toit, auvent rayé, comptoir à trappe, piles ficelées
      const K = RUE.kiosque, CP = RUE.comptoir;
      pc(rect(K.x0 + 12, 760, K.x1 - 12, CP.y), '#22382e', () => {
        for (const y of [860, 990, 1080]) { fillPts(rect(K.x0 + 12, y, K.x1 - 12, y + 8), '#5a3a24'); for (let x = K.x0 + 18; x < K.x1 - 24; x += 14) fillPts(rect(x, y - 28 - 8 * hash(x + y), x + 11, y), ['#b8402e', '#d8b040', '#3a6a9a', '#e8e0cc', '#4a7a4a', '#8a4a8a'][Math.floor(hash(x * 1.3 + y) * 6)], x); }
        shade(0, 760, 0, CP.y, 0.35, [K.x0, 760, K.x1, CP.y]);
      }, 9890);
      for (const px of [K.x0, K.x1 - 16]) pc(rect(px, 700, px + 16, BACK + 6), '#2f4a3a', () => { strokePts([[px + 3, 704], [px + 3, BACK]], 'rgba(200,230,200,0.3)', 1.4); hatch(null, 0.8, 3.6, 0.2); }, 9891 + px);
      pc(rect(K.x0 - 12, 672, K.x1 + 12, 702), '#263a30', () => { strokePts([[K.x0 - 10, 676], [K.x1 + 10, 676]], 'rgba(200,230,200,0.35)', 1.6); for (let x = K.x0; x < K.x1; x += 24) dot(x + 12, 690, 2.6, '#c9a23a'); }, 9893);
      pc([[K.x0 + 40, 672], [(K.x0 + K.x1) / 2, 640], [K.x1 - 40, 672]], '#263a30', () => fillPts(ell((K.x0 + K.x1) / 2, 662, 9, 9, 10), '#c9a23a'), 9894);
      pc([[K.x0 - 12, 702], [K.x1 + 12, 702], [K.x1 + 24, 770], [K.x0 - 24, 770]], '#e8dcc0', () => { for (let k = 0; k < 13; k++) { const x = K.x0 - 12 + k * 24; fillPts([[x, 702], [x + 12, 702], [x + 12 + 1.2 * (x - 890) * 0.04 + 1, 770], [x + 1.2 * (x - 890) * 0.04, 770]], '#c49a3a', k); } shade(0, 702, 0, 770, 0.3, [K.x0 - 30, 700, K.x1 + 30, 772]); }, 9895);
      for (let k = 0; k < 13; k++) pc(ep(K.x0 - 24 + 12 + k * 24.6, 770, 12.3, 9, 8, 0, PI), k % 2 ? '#e8dcc0' : '#c49a3a', null, 9896 + k, { drop: false });
      pc(rect(CP.x0, CP.y, CP.x1, CP.y + 14), '#9a6a40', () => { strokePts([[CP.x0 + 2, CP.y + 3], [CP.x1 - 2, CP.y + 3]], 'rgba(255,230,190,0.5)', 1.6); strokePts([[RUE.trappe.x0, CP.y], [RUE.trappe.x0, CP.y + 14]], 'rgba(40,20,10,0.6)', 1.2); strokePts([[RUE.trappe.x1, CP.y], [RUE.trappe.x1, CP.y + 14]], 'rgba(40,20,10,0.6)', 1.2); }, 9910);
      pc(rect(K.x0, CP.y + 14, K.x1, BACK + 8), '#2f4a3a', () => {
        for (const [a, b] of [[K.x0 + 14, 836], [846, 932], [940, K.x1 - 14]]) { fillPts(rect(a, CP.y + 34, b, BACK - 40), '#294236'); strokePts([[a, BACK - 40], [b, BACK - 40], [b, CP.y + 34]], 'rgba(200,230,200,0.3)', 1.6); strokePts([[a, BACK - 40], [a, CP.y + 34], [b, CP.y + 34]], 'rgba(0,0,0,0.35)', 1.6); }
        fillPts(rect(K.x0, BACK - 22, K.x1, BACK + 8), '#22362c'); hatch(null, 0.8, 4, 0.16);
      }, 9911);
      const pile = (x0, x1, h, seed) => {
        pc(rect(x0, CP.y - h, x1, CP.y), '#e6ddc6', () => { for (let y = CP.y - h + 5; y < CP.y; y += 5) strokePts([[x0, y], [x1, y]], 'rgba(90,80,60,0.45)', 1); shade(x1, 0, x0, 0, 0.25, [x0, CP.y - h, x1, CP.y]); }, seed);
        strokePts([[(x0 + x1) / 2, CP.y - h], [(x0 + x1) / 2, CP.y]], '#8a6a3c', 2); strokePts([[x0, CP.y - h / 2], [x1, CP.y - h / 2]], '#8a6a3c', 2);
        strokePts([[(x0 + x1) / 2, CP.y - h], [(x0 + x1) / 2 - 6, CP.y - h - 8], [(x0 + x1) / 2 + 6, CP.y - h - 8], [(x0 + x1) / 2, CP.y - h]], '#8a6a3c', 1.6);
      };
      pile(764, 830, 36, 9912); pile(962, 1022, 46, 9913); pile(972, 1014, 24, 9914);
      teinte(c, n, BACK + 40);
      FEN.done = true;
    });
  }
  function makeSol(n) {
    return M.pre(W, M.H, (c) => {
      const E = RUE.egout;                                                                            // bouche d'égout (à plat sur le plancher)
      pc(ell(E.x, E.y, 62, 15, 24), '#2a2826', () => { for (let k = -4; k <= 4; k++) strokePts([[E.x + k * 12, E.y - 13 + Math.abs(k) * 1.2], [E.x + k * 12, E.y + 13 - Math.abs(k) * 1.2]], '#121110', 2); strokePts(ep(E.x, E.y, 56, 12, 16, PI, TAU), 'rgba(200,200,190,0.25)', 1.4); }, 9950);
      // bouche d'incendie rouge
      const hx_ = 84, hb = 1590;
      pc([[hx_ - 30, hb], [hx_ + 30, hb], [hx_ + 26, hb - 12], [hx_ - 26, hb - 12]], '#7e241f', null, 9951);
      pc([[hx_ - 20, hb - 12], [hx_ + 20, hb - 12], [hx_ + 18, hb - 84], [hx_ - 18, hb - 84]], '#a8322d', () => { strokePts([[hx_ - 10, hb - 80], [hx_ - 10, hb - 16]], 'rgba(255,200,190,0.4)', 2.4); shade(hx_ + 20, 0, hx_ - 20, 0, 0.3, [hx_ - 22, hb - 90, hx_ + 22, hb]); }, 9952);
      pc([[hx_ - 24, hb - 84], [hx_ + 24, hb - 84], [hx_ + 14, hb - 104], [hx_, hb - 112], [hx_ - 14, hb - 104]], '#a8322d', () => strokePts([[hx_ - 12, hb - 100], [hx_ + 4, hb - 108]], 'rgba(255,200,190,0.45)', 2), 9953);
      for (const sx of [-1, 1]) pc(rect(hx_ + sx * 18 - (sx > 0 ? 0 : 16), hb - 66, hx_ + sx * 18 + (sx > 0 ? 16 : 0), hb - 48), '#8e2a24', () => dot(hx_ + sx * 26, hb - 57, 4, '#5a1a16'), 9954 + sx);
      strokePts([[hx_ + 30, hb - 56], [hx_ + 26, hb - 36], [hx_ + 14, hb - 30]], '#4a4a4e', 1.6);
      // caisse de journaux ficelés
      pc(rect(136, 1544, 226, 1600), '#8a5a34', () => { for (const y of [1558, 1572, 1586]) strokePts([[136, y], [226, y]], 'rgba(40,20,10,0.4)', 1.2); strokePts([[136, 1544], [226, 1600]], 'rgba(40,20,10,0.35)', 2); hatch(null, 0.2, 5, 0.15); }, 9957);
      pc(rect(144, 1516, 218, 1544), '#e6ddc6', () => { for (let y = 1520; y < 1544; y += 5) strokePts([[144, y], [218, y]], 'rgba(90,80,60,0.45)', 1); }, 9958);
      strokePts([[181, 1516], [181, 1544]], '#8a6a3c', 2);
      // poubelle en tôle, couvercle de travers
      const px = 996, pb = 1596;
      pc([[px - 40, pb], [px + 40, pb], [px + 44, pb - 118], [px - 44, pb - 118]], '#8e9298', () => { for (const y of [-30, -64, -98]) strokePts([[px - 44, pb + y], [px + 44, pb + y]], 'rgba(40,44,50,0.5)', 2.2); for (let x = px - 36; x < px + 40; x += 10) strokePts([[x, pb - 116], [x - 1, pb - 2]], 'rgba(255,255,255,0.12)', 1.4); fillPts(ell(px + 10, pb - 50, 12, 8, 10), 'rgba(40,44,50,0.25)'); shade(px + 44, 0, px - 44, 0, 0.35, [px - 46, pb - 120, px + 46, pb]); }, 9960);
      c.save(); c.translate(px, pb - 120); c.rotate(-0.16);
      pc([[-52, 4], [52, 4], [46, -8], [-46, -8]], '#9a9ea4', () => strokePts([[-44, -4], [44, -4]], 'rgba(255,255,255,0.35)', 1.4), 9961); pc(rect(-10, -18, 10, -8), '#6e7278', null, 9962);
      c.restore();
      pc([[px - 56, pb - 10], [px - 40, pb - 22], [px - 26, pb - 8], [px - 44, pb]], '#e6ddc6', () => strokePts([[px - 50, pb - 8], [px - 32, pb - 16]], 'rgba(90,80,60,0.45)', 1), 9963);   // papier froissé
      teinte(c, n, M.H);
    });
  }
  function pigeon(x, y, k, g, ph, vol) {             // pigeon perché (tête qui picore) ; vol = ailes ouvertes
    const c = cx_(); c.save(); c.translate(x, y); c.scale(k, k);
    const pk = Math.max(0, Math.sin(g * 2.3 + ph)) > 0.92 ? 5 : 0;
    pc([[-14, -2], [-8, -12], [6, -14], [12, -8], [10, 0], [0, 4], [-12, 4], [-22, 0, 1]], '#7c7f88', () => { fillPts([[-6, -10], [4, -12], [8, -4], [-2, -2]], '#9aa0aa'); strokePts([[-14, 0], [-4, 2]], 'rgba(30,30,40,0.5)', 1); }, 9970, { drop: false });
    pc(ell(12, -14 + pk, 6, 5.5, 10), '#6a6e78', () => { dot(14, -15 + pk, 1.4, '#e8a040'); fillPts([[15, -16 + pk], [17, -11 + pk], [14, -11 + pk]], 'rgba(120,180,140,0.6)'); }, 9971, { drop: false });
    fillPts([[17, -15 + pk], [22, -13 + pk], [17, -12 + pk]], '#3a3a3e', 0, 0);
    strokePts([[0, 4], [0, 8]], '#c0605a', 1.4); strokePts([[4, 4], [5, 8]], '#c0605a', 1.4);
    c.restore();
  }
  function chat(x, y, k, ph) {                       // chat noir qui marche (pattes qui alternent)
    const c = cx_(); c.save(); c.translate(x, y); c.scale(k, k);
    const l = Math.sin(ph) * 6;
    for (const [lx, s] of [[-18, 1], [-10, -1], [12, 1], [18, -1]]) strokePts([[lx, -14], [lx + l * s, 0]], '#141214', 3.4);
    pc([[-26, -14], [-18, -26], [10, -26], [20, -18], [22, -12], [-24, -10]], '#141214', null, 9980, { drop: false });
    pc([[18, -20], [22, -32], [26, -26], [30, -34], [33, -22], [30, -14], [20, -14]], '#141214', () => dot(28, -23, 1.6, '#e8d040'), 9981, { drop: false });
    strokePts(qbez([-26, -16], [-40, -20 + 4 * Math.sin(ph * 0.7)], [-38, -40], 8), '#141214', 3.4);
    c.restore();
  }
  // WW.rue(t, up, o) : rue de New York 1940-41, à dessiner EN PREMIER (avant M.drawFloor) ; up = décalage vertical (px).
  //   o.nuit 0..1 (1 = nuit de bande dessinée : lune, projecteurs, fenêtres ; 0,35 = fin d'après-midi dorée) ; o.kiosque = lettres des couvertures pendues ('abcde' par défaut ; '' = aucune) ;
  //   o.trappe 0..1 (la planche du comptoir se relève) ; événements : o.chat 0..1 (chat noir sur l'escalier de secours), o.feuille 0..1 (feuille de journal qui s'envole du kiosque),
  //   o.fenetre 0..1 (une fenêtre de la façade s'éclaire) ; o.projecteurs (true la nuit) ; o.pigeons (true)
  WW.rue = function (t, up, o) {
    o = o || {}; up = up || 0; const K = WW.K, c = cx_(), g = M.tg(t), n = clamp(o.nuit == null ? 1 : o.nuit), jour = 1 - n;
    const lit = M.smooth(0.25, 0.85, n);
    c.save(); c.translate(0, -up);
    c.drawImage(K.cielJ, 0, 0); if (n > 0) { c.save(); c.globalAlpha = n; c.drawImage(K.cielN, 0, 0); c.restore(); }
    if (!SIL()) {
      if (jour > 0.05) { const sx = 300, sy = 600, gr = c.createRadialGradient(sx, sy, 10, sx, sy, 240); gr.addColorStop(0, `rgba(255,236,170,${0.7 * jour})`); gr.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = gr; c.fillRect(sx - 240, sy - 240, 480, 480); fillPts(ell(sx, sy, 46, 46, 24), `rgba(255,224,150,${0.95 * jour})`, 0, 0); }
      const nm = M.smooth(0.5, 0.92, n);
      if (nm > 0.02) {
        for (let i = 0; i < 46; i++) { const x = hash(i * 1.37) * W, y = 60 + hash(i * 2.71) * 560, a = nm * (0.4 + 0.6 * Math.abs(Math.sin(g * (0.7 + hash(i) * 1.6) + i))); dot(x, y, 1.2 + hash(i * 5.3), `rgba(255,250,225,${a})`); }
        const mx = 830, my = 300, gr = c.createRadialGradient(mx, my, 20, mx, my, 210); gr.addColorStop(0, `rgba(240,235,200,${0.35 * nm})`); gr.addColorStop(1, 'rgba(240,235,200,0)'); c.fillStyle = gr; c.fillRect(mx - 210, my - 210, 420, 420);
        fillPts(ell(mx, my, 50, 50, 28), `rgba(246,238,206,${nm})`, 0, 0); for (const [dx, dy, r] of [[-14, -10, 9], [12, 8, 7], [-4, 20, 5], [18, -16, 4]]) fillPts(ell(mx + dx, my + dy, r, r, 10), `rgba(205,196,170,${0.6 * nm})`, 0, 0);
        if (o.projecteurs !== false) for (const [bx, ph, sp] of [[330, 0, 0.21], [740, 2.2, 0.17], [560, 4.1, 0.13]]) {
          const a = -PI / 2 + 0.42 * Math.sin(g * sp + ph), L = 1300, wv = 0.055, x1 = bx + Math.cos(a - wv) * L, y1 = 1000 + Math.sin(a - wv) * L, x2 = bx + Math.cos(a + wv) * L, y2 = 1000 + Math.sin(a + wv) * L;
          const gr2 = c.createLinearGradient(bx, 1000, bx + Math.cos(a) * L, 1000 + Math.sin(a) * L); gr2.addColorStop(0, `rgba(230,235,255,${0.22 * nm})`); gr2.addColorStop(1, 'rgba(230,235,255,0)');
          c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr2; c.beginPath(); c.moveTo(bx, 1000); c.lineTo(x1, y1); c.lineTo(x2, y2); c.closePath(); c.fill(); c.restore();
        }
      }
    }
    M.nuages(t, { y0: 200, y1: 470, n: 4, vit: 9, s: 0.62, seed: 41, col: mixA('#f6d6a6', '#3e4870', n) });
    if (o.pigeons !== false) M.oiseaux(g, { x0: -120, x1: 1200, y: 360, dur: 16, boucle: true, n: 4, s: 0.55, seed: 7, col: n > 0.5 ? '#1a1e2e' : '#3a3438', brume: 0.2 });
    c.drawImage(K.fondJ, 0, 0); if (n > 0) { c.save(); c.globalAlpha = n; c.drawImage(K.fondN, 0, 0); c.restore(); }
    if (!SIL()) {                                                                                      // fenêtres qui s'allument une à une
      const nf = FEN.length;
      for (let i = 0; i < nf; i++) { const f = FEN[i]; if (f[4]) continue; const u = fr(g / 46 + hash(i * 7.31)), on = M.smooth(0.0, 0.04, u) * (1 - M.smooth(0.8, 0.84, u)), a = lit * on * (0.7 + 0.3 * hash(i * 3.3));
        if (a > 0.02) fillPts(rect(f[0], f[1], f[0] + f[2], f[1] + f[3]), `rgba(250,214,120,${a})`, 0, 0); }
    }
    c.drawImage(K.milJ, 0, 0); if (n > 0) { c.save(); c.globalAlpha = n; c.drawImage(K.milN, 0, 0); c.restore(); }
    if (!SIL()) {
      const fe = clamp(o.fenetre || 0); let j = 0;
      for (const f of FEN) { if (!f[4]) continue; j++; const a = Math.max(j === 4 ? fe : 0, lit * (hash(j * 4.7) > 0.45 ? 0.85 : 0) * (j === 4 ? fe : 1));
        if (a > 0.02) { fillPts(rect(f[0], f[1], f[0] + f[2], f[1] + f[3]), `rgba(250,206,110,${0.75 * a})`, 0, 0); fillPts(rect(f[0] + 6, f[1] + f[3] - 30, f[0] + 20, f[1] + f[3] - 6), `rgba(120,60,30,${0.5 * a})`, 0, 0); } }
      const CF = RUE.facade.cafe, gr = c.createLinearGradient(0, CF.y0, 0, CF.y1);                       // lueur de la vitrine du café
      gr.addColorStop(0, `rgba(255,200,110,${0.12 + 0.3 * lit})`); gr.addColorStop(1, 'rgba(255,200,110,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(CF.x0, CF.y0, CF.x1 - CF.x0, CF.y1 - CF.y0); c.restore();
    }
    // bec de gaz : flamme et halo qui vacillent
    const B = RUE.becGaz; M.flamme(t, { x: B.x, y: B.y + 30, s: 0.9, r: 60 + 160 * lit, seed: 17 });
    if (!SIL() && lit > 0.05) { const fl = 0.85 + 0.1 * Math.sin(g * 13) + 0.05 * Math.sin(g * 31); const gr = c.createRadialGradient(B.x, B.y + 14, 10, B.x, B.y + 14, 300); gr.addColorStop(0, `rgba(255,214,140,${0.3 * lit * fl})`); gr.addColorStop(1, 'rgba(255,200,120,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(B.x - 300, B.y - 290, 600, 600); c.restore(); }
    // pigeons sur la corniche et sur le toit du kiosque
    if (o.pigeons !== false) { for (const [px, ph] of [[60, 0], [104, 2.1], [196, 4.2]]) pigeon(px, RUE.facade.corniche - 2, 1.1, g, ph); for (const [px, ph] of [[790, 1.3], [1000, 3.4]]) pigeon(px, 640 + (px > 900 ? 30 : 30), 1.05, g, ph); }
    // chat noir sur l'escalier de secours (événement)
    const ch = clamp(o.chat || 0); if (ch > 0 && ch < 1) chat(lerp(-30, 280, ch), RUE.facade.paliers[1] - 1, 1.15, ch * 40);
    // ampoule du kiosque qui oscille
    const A = RUE.ampoule, aa = 0.08 * Math.sin(g * 1.3), axb = 890 + Math.sin(aa) * 80, ayb = 700 + Math.cos(aa) * 80;
    strokePts([[890, 702], [axb, ayb]], '#141214', 1.4);
    if (!SIL()) { const gr = c.createRadialGradient(axb, ayb + 10, 4, axb, ayb + 10, 150); gr.addColorStop(0, `rgba(255,230,160,${0.25 + 0.4 * lit})`); gr.addColorStop(1, 'rgba(255,220,150,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(axb - 150, ayb - 140, 300, 300); c.restore(); }
    fillPts(rect(axb - 4, ayb, axb + 4, ayb + 6), '#5a5040'); fillPts(ell(axb, ayb + 13, 7, 8, 10), lit > 0.3 ? '#fff2c0' : '#e8e0c0');
    // ficelles et couvertures pendues à des pinces (elles se balancent)
    const lst = o.kiosque == null ? 'abcde' : o.kiosque;
    for (const fi of RUE.ficelles) strokePts(qbez([fi.x0, fi.y], [(fi.x0 + fi.x1) / 2, fi.y + 12], [fi.x1, fi.y], 12), '#d8cdb0', 1.4);
    for (const l of 'abcde') { if (lst.indexOf(l) < 0) continue; const P = RUE.couv[l], ph = l.charCodeAt(0) * 1.7;
      WW.couverture(P[0], P[1], RUE.couvS, { n: l, pince: true, rot: 0.06 * Math.sin(g * 1.4 + ph) + 0.02 * Math.sin(g * 3.1 + ph) }); }
    if (n > 0.02 && !SIL()) { c.save(); c.globalAlpha = 0.45 * n; c.globalCompositeOperation = 'multiply'; c.fillStyle = '#4a5488'; c.fillRect(RUE.kiosque.x0, 790, RUE.kiosque.x1 - RUE.kiosque.x0, 300); c.restore(); }
    // trappe du comptoir
    const tp = clamp(o.trappe || 0), TP = RUE.trappe;
    if (tp > 0) { const sn = Math.sin(tp * PI / 2); fillPts(rect(TP.x0, TP.y, TP.x1, TP.y + 14), '#0c0a08');
      pc([[TP.x0, TP.y], [TP.x1, TP.y], [TP.x1 + 6 * sn, TP.y - 96 * sn], [TP.x0 - 6 * sn, TP.y - 96 * sn]], '#a87448', () => { strokePts([[TP.x0 + 4, TP.y - 4], [TP.x1 - 4, TP.y - 4]], 'rgba(255,230,190,0.4)', 1.4); shade(0, TP.y - 96 * sn, 0, TP.y, 0.3, [TP.x0 - 8, TP.y - 100, TP.x1 + 8, TP.y]); }, 9990, { drop: false }); }
    // feuille de journal qui s'envole (événement)
    const fe = clamp(o.feuille || 0);
    if (fe > 0 && fe < 1) { const fx = lerp(800, 430, fe) + 40 * Math.sin(fe * 8), fy = 1100 - 520 * Math.sin(PI * fe * 0.7) + 120 * fe * fe;
      c.save(); c.translate(fx, fy); c.rotate(Math.sin(fe * 11) * 0.9); c.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(fe * 9)));
      pc(rect(-34, -42, 34, 42), '#ece4d0', () => { fillPts(rect(-28, -36, 28, -24), 'rgba(36,32,29,0.7)'); for (let y = -18; y < 38; y += 6) strokePts([[-28, y], [26 - (Math.abs(y) % 7) * 2, y]], 'rgba(60,56,50,0.45)', 0.9); fillPts(rect(-26, -14, 0, 10), 'rgba(80,80,90,0.4)'); }, 9995, { drop: false });
      c.restore(); }
    c.restore();
  };
  // WW.rueSol(t, up, o) : premier plan (bouche d'incendie, caisse de journaux, poubelle en tôle, bouche d'égout qui fume) — juste APRÈS M.drawFloor()
  WW.rueSol = function (t, up, o) {
    o = o || {}; up = up || 0; const K = WW.K, c = cx_(), n = clamp(o.nuit == null ? 1 : o.nuit);
    c.save(); c.translate(0, -up);
    c.drawImage(K.solJ, 0, 0); if (n > 0) { c.save(); c.globalAlpha = n; c.drawImage(K.solN, 0, 0); c.restore(); }
    const E = RUE.egout; M.fumee(t, { x: E.x, y: E.y - 6, s: 0.9, n: 7, haut: 300, vent: 26, col: n > 0.5 ? '#c8ccd8' : '#efe6d6', a: 0.5, per: 3.6, seed: 23 });
    c.restore();
  };

  WW.init = function () {
    if (WW.K) return WW.K;
    const K = (WW.K = {});
    K.cielJ = makeCiel(0); K.cielN = makeCiel(1);
    K.fondJ = makeFond(0); K.fondN = makeFond(1);
    K.milJ = makeMilieu(0); K.milN = makeMilieu(1);
    K.solJ = makeSol(0); K.solN = makeSol(1);
    return K;
  };
})();
