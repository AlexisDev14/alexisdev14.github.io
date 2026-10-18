// persos.js — « Dr House, le faux Américain de la salle de bains » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.hou (alias HOU). Appeler HOU.init() dans S.init.
// Mode d'emploi complet : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo. Déterministe (hash, jamais Math.random).
// MARIONNETTES : HOU.laurie / HOU.producteur / HOU.patient (pose, x, y, s, o) — (x,y) = pieds ; jambes en 3 pièces legX_up/_lo + piedX (ang.legF/legB acceptés).
// OBJETS TENUS (tenu / tenuB) : 'canne' 'parapluie' 'camescope' 'tasse' 'soucoupe' 'globe' 'cassette' 'drapeau' 'loupe' 'pavillon' ; HOU.pt(r, nom[, arriere]).
// ACCESSOIRES SEULS : HOU.canne parapluie camescope tasse globe cassette drapeau loupe (x,y,s,o) ; HOU.tele(x,y,s,{allume,draw,cassette}).
// DÉCORS : HOU.hopital(t,up,o) + HOU.lit(x,y,s,o) ; HOU.bureau(t,up,o) + HOU.bureauTable(up,o) ; HOU.palmiers(t,up,o) ; HOU.projecteurs(t,k,o).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const HOU = (M.hou = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rot = (pts, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map((p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]); };
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
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const k01 = (v) => ease(clamp(v || 0));
  HOU.geo = { ep, ell, ribbon, qbez, rrect, box };

  // ------------------------------------------------------------ bras et jambes à articulations rondes
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96);
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const legC = (len, wt, rk) => ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.5], [rk + 0.5, len - 4]], ep(0, len, rk, rk, 10, 0, PI), [[-rk - 0.5, len - 4], [-wt + 1, len * 0.5]]);
  const FOOT = (ak, len) => ep(0, 0, ak, ak, 8, PI, TAU).concat([[ak + 2, 2], [len * 0.62, 4], [len * 0.92, 8], [len, 14, 1], [-15, 16, 1], [-15, 6]]);
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant' (coude devant), 'arriere'
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      const sc = (pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1]) + (b <= 0.05 ? 1000 : 0);   // coude plié vers l'avant d'abord
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }

  // =====================================================================
  // OBJETS — dessinés à l'échelle 1 dans leur repère ; grip = point tenu (centre du poing) ; pts = points nommés ; base = origine de l'objet seul
  // =====================================================================
  const BOIS = '#4a2e1c', BOISL = '#6e4a30', OR = '#c9a24a', ORL = '#ead08a', ORD = '#8a6a2a';
  // ---------------- canne (crosse en haut, fût vers le bas) et parapluie fermé
  const CANNE_L = 250;
  const CROSSE = [[0, 16], [0, 2], [3, -8], [12, -14], [22, -12], [29, -4], [30, 8], [28, 17]];
  function drawCrosse(col, seed) {
    pc(ribbon(CROSSE, 11, 10), col, () => { strokePts(CROSSE.map((p) => [p[0] - 2, p[1] - 2]), 'rgba(255,225,190,0.35)', 1.3); hatch(null, 0.6, 3.2, 0.18); }, seed);
  }
  function drawCanne(o) {
    pc([[-5, 8], [5, 8], [4.5, CANNE_L - 8, 1], [-4.5, CANNE_L - 8, 1]], BOIS, () => {
      strokePts([[-2, 12], [-1.6, CANNE_L - 12]], 'rgba(255,225,190,0.3)', 1.3); hatch(null, 1.3, 4.2, 0.22);
      for (const y of [60, 140]) strokePts([[-5, y], [5, y + 1]], 'rgba(20,10,5,0.35)', 1);
    }, 7102);
    pc(box(-6, CANNE_L - 12, 6, CANNE_L), '#1d1a1a', () => strokePts([[-4, CANNE_L - 9], [4, CANNE_L - 9]], 'rgba(255,255,255,0.2)', 1), 7103);
    drawCrosse(BOIS, 7101);
  }
  function drawParapluie(o) {
    pc([[-4, 8], [4, 8], [3.5, 40, 1], [-3.5, 40, 1]], '#2a211c', null, 7202);
    const can = [[-3, 36], [3, 36], [11, 60], [14, 96], [12, 150], [8, 200], [4, CANNE_L - 18, 1], [-4, CANNE_L - 18, 1], [-9, 200], [-12, 150], [-14, 96], [-11, 60]];
    pc(can, '#26262b', () => {
      for (const [x0, x1] of [[-6, -2], [2, 4], [8, 3]]) strokePts([[x0, 46], [x0 * 1.3, 110], [x1, CANNE_L - 24]], 'rgba(150,150,165,0.45)', 1.1);
      fillPts(box(-14, 104, 14, 114), '#1b1b1f'); dot(9, 109, 2.4, '#8f9296');
      strokePts([[-8, 50], [-11, 120]], 'rgba(255,255,255,0.18)', 2);
      hatch(null, 1.1, 3.6, 0.25);
    }, 7203);
    pc([[-2.5, CANNE_L - 20], [2.5, CANNE_L - 20], [1.5, CANNE_L + 4, 1], [-1.5, CANNE_L + 4, 1]], '#9a9ea2', null, 7204);
    drawCrosse('#2f241d', 7201);
  }
  // ---------------- caméscope années 2000 (profil, objectif vers +x, poignée sur le dessus)
  function drawCamescope(o) {
    pc([[-34, -40], [-30, -48], [30, -48], [34, -40], [30, -36], [26, -36], [24, -42], [-26, -42], [-28, -36], [-32, -36]], '#55585e', () => strokePts([[-26, -46], [26, -46]], 'rgba(255,255,255,0.3)', 1.2), 7301);
    pc(rrect(-50, -38, 60, 14, 9), '#8b8f96', () => {
      fillPts(rrect(-24, -30, 22, 6, 4), '#5d6168'); strokePts(rrect(-24, -30, 22, 6, 4).concat([[-20, -30]]), 'rgba(30,30,34,0.7)', 1.2);
      for (const y of [-22, -14, -6]) strokePts([[-18, y], [16, y]], 'rgba(255,255,255,0.12)', 1);
      strokePts([[-46, -34], [56, -34]], 'rgba(255,255,255,0.35)', 1.3);
      dot(48, -28, 3, '#a8322c'); dot(48, -28, 1.2, '#f2b0a0');
      dot(36, 4, 2.2, '#4a4d52'); dot(44, 4, 2.2, '#4a4d52');
      hatch([[-50, 0], [60, 0], [60, 14], [-50, 14]], 0.5, 3.2, 0.25); shade(0, -38, 0, 14, 0.25, [-52, -40, 62, 16]);
    }, 7302);
    pc(rrect(-66, -44, -48, -24, 4), '#26272b', null, 7303);
    pc(rrect(-62, -22, -48, 12, 3), '#3a3c41', () => strokePts([[-60, -16], [-50, -16]], 'rgba(255,255,255,0.15)', 1), 7304);
    pc([[58, -32, 1], [80, -34, 1], [86, -38, 1], [86, 10, 1], [80, 6, 1], [58, 4, 1]], '#3d3f45', () => { for (const x of [64, 70]) strokePts([[x, -32], [x, 4]], 'rgba(255,255,255,0.15)', 1.2); }, 7305);
    pc(ell(86, -14, 5, 22, 14), '#1b2a36', () => { strokePts([[85, -30], [87, -22]], 'rgba(220,240,255,0.7)', 1.6); dot(86, -14, 6, 'rgba(90,140,180,0.6)'); }, 7306);
  }
  // ---------------- tasse de thé (fond de la tasse en (0,0), anse côté −x) ; soucoupe ; vapeur
  const TASSE = [[-25, -44], [25, -44], [23, -20], [17, -6], [10, 0, 1], [-10, 0, 1], [-17, -6], [-23, -20]];
  function drawSoucoupe() {
    pc([[-40, 0], [-30, -3], [30, -3], [40, 0], [34, 6], [20, 8, 1], [-20, 8, 1], [-34, 6]], '#f1ede2', () => { strokePts([[-38, 0], [38, 0]], '#4d6f96', 1.8); hatch([[-40, 3], [40, 3], [40, 9], [-40, 9]], 0.3, 3, 0.18); }, 7404);
  }
  function drawTasse(o) {
    if (o.soucoupe) drawSoucoupe();
    const anse = ep(-25, -26, 13, 11, 12, PI * 0.45, PI * 1.55);
    pc(ribbon(anse, 6, 6), '#ece8dd', () => strokePts(anse, '#4d6f96', 1.2), 7401);
    pc(TASSE, '#f3efe6', () => {
      fillPts([[-25, -44], [25, -44], [24.5, -38], [-24.5, -38]], '#4d6f96');
      strokePts([[-23, -33], [23, -33]], '#4d6f96', 1.2);
      fillPts([[-11, -1], [11, -1], [12, 1], [-12, 1]], '#cfc8b8');
      strokePts([[-17, -36], [-14, -12]], 'rgba(255,255,255,0.85)', 2);
      hatch([[6, -44], [26, -44], [20, 0], [6, 0]], 0.9, 3, 0.18); shade(24, 0, -20, 0, 0.18, [-26, -46, 26, 2]);
    }, 7402);
    fillPts([[-23, -44], [23, -44], [21, -41], [-21, -41]], '#8a5a2e');
    const v = clamp(o.vapeur == null ? 0 : o.vapeur);
    if (v > 0.01 && !SIL()) {
      const c = cx_(), t = o.t || 0;
      c.save(); c.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const ph = t * 1.6 + i * 2.1, x0 = -10 + i * 10;
        c.beginPath();
        for (let k = 0; k <= 12; k++) { const u = k / 12, yy = -48 - u * 58, xx = x0 + Math.sin(ph + u * 5) * (3 + u * 7); if (k) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
        c.strokeStyle = `rgba(250,248,240,${0.55 * v * (0.6 + 0.4 * Math.sin(ph))})`; c.lineWidth = 3.2 * M._lw(); c.stroke();
      }
      c.restore();
    }
  }
  // ---------------- statuette dorée (globe à méridiens + bande de pellicule, socle or et marbre) ; (0,0) = dessous du socle
  function drawGlobe(o) {
    pc(box(-34, -30, 34, 0), '#5f6b62', () => {
      for (const [a, b] of [[[-34, -22], [10, -6]], [[-10, -30], [30, -12]], [[-30, -6], [-4, -16]]]) strokePts([a, [(a[0] + b[0]) / 2 + 4, (a[1] + b[1]) / 2 - 3], b], 'rgba(220,225,215,0.35)', 1.2);
      strokePts([[-32, -27], [32, -27]], 'rgba(255,255,255,0.25)', 1.2); hatch(null, 0.6, 3.6, 0.2);
    }, 7501);
    pc([[-28, -30, 1], [28, -30, 1], [24, -40], [-24, -40]], OR, () => { strokePts([[-26, -37], [26, -37]], ORL, 1.4); shade(26, 0, -26, 0, 0.3, [-30, -42, 30, -28]); }, 7502);
    pc([[-8, -40], [8, -40], [5, -60], [7, -84], [-7, -84], [-5, -60]], OR, () => { strokePts([[-3, -42], [-2, -82]], ORL, 1.4); shade(8, 0, -8, 0, 0.3, [-9, -86, 9, -38]); }, 7503);
    const gy = -116, R = 31;
    const ring = (a0, a1) => rot(ep(0, 0, 45, 13, 12, a0, a1), -0.38).map((p) => [p[0], p[1] + gy]);
    const film = (pts, seed, col) => pc(ribbon(pts, 9, 9), col, () => { for (let i = 1; i < pts.length - 1; i++) dot(pts[i][0], pts[i][1], 1.3, '#6e5420'); }, seed);
    film(ring(PI, TAU), 7506, '#9a7a32');
    pc(ell(0, gy, R, R, 24), OR, () => {
      for (const kx of [0.35, 0.75]) { strokePts(ep(0, gy, R * kx, R, 16, -PI / 2, PI / 2), 'rgba(110,80,25,0.65)', 1.3); strokePts(ep(0, gy, R * kx, R, 16, PI / 2, PI * 1.5), 'rgba(110,80,25,0.4)', 1.1); }
      strokePts([[0, gy - R], [0, gy + R]], 'rgba(110,80,25,0.65)', 1.3);
      for (const ky of [-0.5, 0, 0.5]) { const w = R * Math.sqrt(1 - ky * ky); strokePts([[-w, gy + ky * R], [w, gy + ky * R]], 'rgba(110,80,25,0.55)', 1.2); }
      dot(-10, gy - 12, 7, 'rgba(255,245,200,0.45)'); shade(R, gy, -R, gy, 0.35, [-R - 2, gy - R - 2, R + 2, gy + R + 2]);
    }, 7504);
    film(ring(0, PI), 7505, '#c19a42');
  }
  // ---------------- cassette VHS (face, 140 × 80), (0,0) = centre
  function drawCassette(o) {
    pc(rrect(-70, -40, 70, 40, 4), '#1d1c1e', () => {
      fillPts(box(-56, -34, 56, -10), '#efece2'); strokePts([[-52, -24], [52, -24]], 'rgba(150,140,120,0.25)', 1);
      fillPts(rrect(-46, -2, 46, 26, 4), '#3a3c40');
      for (const sx of [-1, 1]) { fillPts(ell(sx * 26, 12, 16, 11, 16), '#5a3a26'); dot(sx * 26, 12, 6, '#d9d4c6'); dot(sx * 26, 12, 2.4, '#1d1c1e'); }
      strokePts([[-36, 20], [36, 20]], 'rgba(255,255,255,0.15)', 1);
      strokePts([[-44, 0], [-30, 24]], 'rgba(255,255,255,0.18)', 2);
      for (const x of [-62, 62]) dot(x, 32, 2.4, '#3a3a3e');
      hatch([[-70, 28], [70, 28], [70, 40], [-70, 40]], 0.4, 3.2, 0.25);
    }, 7601);
  }
  // ---------------- drapeau américain sur hampe (13 bandes, canton bleu à points blancs, aucune lettre) ; (0,0) = pied de la hampe
  function drawDrapeau(o) {
    const t = o.t || 0, W = 92, H = 56, x0 = 3, y0 = -148, wav = o.ondule == null ? 1 : o.ondule;
    pc(box(-2.5, -150, 2.5, 0), BOISL, () => strokePts([[-1, -146], [-1, -4]], 'rgba(255,230,190,0.4)', 1), 7701);
    pc(ell(0, -153, 5, 5, 10), OR, null, 7702);
    if (SIL()) { fillPts(box(x0, y0, x0 + W, y0 + H), '#000'); return; }
    const c = cx_(), N = 16;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const off = (u) => wav * Math.sin(u * 7 - t * 8) * 5 * u, sh = (u) => wav * Math.cos(u * 7 - t * 8) * 0.18 * Math.min(1, u * 3);
      const xa = x0 + u0 * W, xb = x0 + u1 * W + 0.6, ya = y0 + off(u0), yb = y0 + off(u1);
      c.save(); c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.lineTo(xb, yb + H); c.lineTo(xa, ya + H); c.closePath(); c.clip();
      for (let s = 0; s < 13; s++) { c.fillStyle = s % 2 ? '#ece6d6' : '#9a3530'; c.fillRect(xa - 1, ya + s * H / 13 - 2, xb - xa + 2, H / 13 + 2.5); c.fillRect(xa - 1, yb + s * H / 13 - 2, xb - xa + 2, H / 13 + 2.5); }
      if (u0 < 0.42) {
        c.fillStyle = '#2d3c5e'; c.fillRect(xa - 1, Math.min(ya, yb) - 2, xb - xa + 2, H * 7 / 13 + 2 + Math.abs(yb - ya));
        c.fillStyle = '#efe9da';
        for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) { const px = x0 + 4 + k * 7.4 + (r % 2) * 3.4, pu = (px - x0) / W; if (px >= xa - 0.5 && px < xb) { c.beginPath(); c.arc(px, y0 + off(pu) + 4.5 + r * 6.6, 1.5, 0, TAU); c.fill(); } }
      }
      const g = sh(u0); c.fillStyle = g > 0 ? `rgba(255,255,255,${g * 0.5})` : `rgba(20,10,10,${-g * 0.9})`; c.fillRect(xa - 1, Math.min(ya, yb) - 3, xb - xa + 2, H + 8);
      c.restore();
    }
    c.save(); c.beginPath(); c.moveTo(x0, y0); for (let i = 1; i <= N; i++) { const u = i / N; c.lineTo(x0 + u * W, y0 + wav * Math.sin(u * 7 - t * 8) * 5 * u); } for (let i = N; i >= 0; i--) { const u = i / N; c.lineTo(x0 + u * W, y0 + H + wav * Math.sin(u * 7 - t * 8) * 5 * u); } c.closePath();
    c.strokeStyle = 'rgba(34,22,14,0.75)'; c.lineWidth = 2.2 * M._lw(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 0.9 * M._lw(); c.stroke(); c.restore();
  }
  // ---------------- loupe (manche en bas, verre en haut) ; pavillon de stéthoscope
  function drawLoupe(o) {
    pc([[-4, -26], [4, -26], [5, 28, 1], [-5, 28, 1]], BOIS, () => strokePts([[-1.5, -22], [-1.5, 24]], 'rgba(255,225,190,0.35)', 1.2), 7801);
    pc(ell(0, -50, 25, 25, 22), OR, () => fillPts(ell(0, -50, 19, 19, 20), 'rgba(205,230,240,0.85)'), 7802);
    if (!SIL()) { strokePts([[-10, -60], [-4, -66]], 'rgba(255,255,255,0.9)', 2); strokePts(ell(0, -50, 19, 19, 20).concat([[19, -50]]), 'rgba(110,80,25,0.6)', 1.2); }
  }
  function drawPavillon(o) {
    pc([[-2, -3], [8, -3], [8, 3], [-2, 3]], '#8c9196', null, 7901);
    pc(ell(17, 0, 7, 13, 14), '#c3c8cc', () => { strokePts([[18, -9], [19, 6]], 'rgba(255,255,255,0.8)', 1.4); fillPts(ell(21, 0, 3, 10, 10), '#2c2f33'); }, 7902);
  }
  // registre : grip = point tenu ; p2 = seconde prise ; pts = points nommés ; base = origine de l'objet seul
  const OBJ = {
    canne: { draw: drawCanne, grip: [14, -10], pts: { bout: [0, CANNE_L], crosse: [28, 17] }, base: [14, -10] },
    parapluie: { draw: drawParapluie, grip: [14, -10], pts: { bout: [0, CANNE_L + 4], crosse: [28, 17] }, base: [14, -10] },
    camescope: { draw: drawCamescope, grip: [-2, -42], pts: { objectif: [88, -14], dessous: [5, 14] }, base: [5, 14] },
    tasse: { draw: drawTasse, grip: [-36, -26], held: { soucoupe: false, vapeur: 0.6 }, pts: { bord: [0, -44], levre: [-20, -44], vapeur: [0, -50] }, base: (o) => [0, o.soucoupe ? 8 : 0] },
    soucoupe: { draw: drawSoucoupe, grip: [-34, 3], pts: { dessus: [0, -3] }, base: [0, 8] },
    globe: { draw: drawGlobe, grip: [0, -30], pts: { globe: [0, -116], haut: [0, -150] }, base: [0, 0] },
    cassette: { draw: drawCassette, grip: [-58, 0], pts: { centre: [0, 0] }, base: [0, 40] },
    drapeau: { draw: drawDrapeau, grip: [0, -34], pts: { haut: [0, -150], flamme: [50, -120] }, base: [0, 0] },
    loupe: { draw: drawLoupe, grip: [0, 6], pts: { verre: [0, -50] }, base: [0, 28] },
    pavillon: { draw: drawPavillon, grip: [0, 0], pts: { pavillon: [22, 0], tube: [-2, 0] }, base: [0, 0] },
  };
  HOU.OBJ = OBJ;
  const vOf = (v, o) => (typeof v === 'function' ? v(o) : v);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = vOf(ob.grip, oo), c = cx_(), k = oo.taille || 1;
    c.save(); c.scale(k, k); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const AURICULAIRE = [[-6, 2], [-13, -2], [-20, -13], [-24, -12], [-19, 4], [-9, 10]];          // repère « droit à l'écran » : vers l'arrière, relevé
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      auriculaire: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p.tenu === 'tasse' && p.auriculaire !== false ? rot(AURICULAIRE, p.ang.objet || 0) : OFFP), paint: () => {} },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 6, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  HOU.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = vOf(ob.grip, oo), q = ob.pts[nom], k = oo.taille || 1;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };

  // =====================================================================
  // POSES — préparation commune, IK interne (repère du torse), objets tenus, seconde main
  // =====================================================================
  function prep(p) {
    p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) });
    const A = q.ang;
    if (A.legF != null) { A.legF_up = (A.legF_up || 0) + A.legF; delete A.legF; }
    if (A.legB != null) { A.legB_up = (A.legB_up || 0) + A.legB; delete A.legB; }
    return q;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function armTo(q, def, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(def.parts[arm + '_up'].at, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  function headPt(q, def, hx, hy) { const h = def.parts.head; return mp(new DOMMatrix().translate(h.at[0], h.at[1]).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function toTorso(env, q, P0) { const { mats } = M.partMatrices(env.def, q, env.x, env.y, env.s, env.dir); const p = new DOMPoint(P0[0], P0[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; }
  function plier(q, def, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return; const h = -def.hipY;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - h * Math.sin(th); q.dy = (q.dy || 0) + h * (1 - Math.cos(th));
    q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
  }
  function marche(q, k, t, amp) {                                 // pas sur place (la scène déplace x) ; k 0..1
    if (k <= 0) return; const ph = t * TAU * 1.5, s = Math.sin(ph), A = q.ang; amp = amp || 0.34;
    A.legF_up = (A.legF_up || 0) + amp * s * k; A.legB_up = (A.legB_up || 0) - amp * s * k;
    A.legF_lo = (A.legF_lo || 0) + 0.42 * Math.max(0, Math.sin(ph - 1.3)) * k; A.legB_lo = (A.legB_lo || 0) + 0.42 * Math.max(0, Math.sin(ph + PI - 1.3)) * k;
    A.piedF = (A.piedF || 0) - 0.5 * (A.legF_up + A.legF_lo) * k; A.piedB = (A.piedB || 0) - 0.5 * (A.legB_up + A.legB_lo) * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    A.armF_up = (A.armF_up || 0) - 0.18 * s * k; A.armB_up = (A.armB_up || 0) + 0.18 * s * k;
  }
  // assis : hanche posée à la hauteur `siege` (y écran) ou pieds au sol ; jambes 'pliees' (défaut) ou 'allongees' (dans le lit)
  function assis(q, env, k) {
    if (k <= 0) return; const def = env.def, A = q.ang, L = def._legs, hip = -def.hipY;
    const allong = q.jambes === 'allongees';
    let seat = env.siege != null ? hip - (env.y - env.siege) / env.s - 14 : hip - (L.sh + 16) + 2;
    if (allong && env.siege == null) seat = hip - 14;
    q.dy = (q.dy || 0) + seat * k;
    A.legF_up = (A.legF_up || 0) - 1.5 * k; A.legB_up = (A.legB_up || 0) - 1.42 * k;
    if (allong && q.pieds !== true && k > 0.5) { q.hide.piedF = 1; q.hide.piedB = 1; }
    if (allong) { A.legF_lo = (A.legF_lo || 0) + 0.04 * k; A.legB_lo = (A.legB_lo || 0) + 0.02 * k; A.piedF = (A.piedF || 0) + 0.15 * k; A.piedB = (A.piedB || 0) + 0.15 * k; }
    else { A.legF_lo = (A.legF_lo || 0) + 1.5 * k; A.legB_lo = (A.legB_lo || 0) + 1.36 * k; A.piedF = (A.piedF || 0) + 0.05 * k; A.piedB = (A.piedB || 0) + 0.1 * k; }
    q.tilt = (q.tilt || 0) - 0.03 * k;
  }
  function finish(q, def) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = vOf(ob.grip, oo), SF = def.parts.armF_up.at;
      const Hf = new DOMMatrix().translate(SF[0], SF[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(def.parts.armB_up.at, mp(Hf, ob.p2(oo)), 'bas');
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // enveloppe commune : pose → geste(q, env) → finish → puppet
  function wrap(def, poseFn, sDef) {
    return (pose, x, y, s, o) => {
      o = o || {}; s = s == null ? sDef : s;
      const q = prep(pose), env = { def, x, y, s, dir: o.dir || 1, siege: q.siege };
      poseFn(q, env);
      finish(q, def);
      const r = run(def, q, x, y, s, o);
      if (def._after) def._after(r, q, env);
      return r;
    };
  }

  // ---------------- pièces de corps communes
  function upDef(at, base, seed, wt, paint) { return { parent: 'torso', at, pts: armR(LA, wt), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) }; }
  function foreDef(parent, base, skin, back, seed, o) {
    o = o || {}; const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      if (o.bare) fillPts([[-24, -14, 1], [24, -14, 1], [24, 300, 1], [-24, 300, 1]], skin);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (o.cuff) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.cuff);
      if (o.bracelet) { fillPts([[-13, 64, 1], [13, 63, 1], [13, 72, 1], [-13, 73, 1]], o.bracelet); strokePts([[-12, 68], [12, 67]], 'rgba(120,140,160,0.6)', 1); }
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.3 : 0.2);
    } };
  }
  // jambes en 3 pièces : cuisse (legX_up), tibia (legX_lo), pied (piedX)
  function legParts(L, seed) {
    const thigh = (back) => ({ parent: 'torso', at: [back ? -L.hx : L.hx, -2], pts: legC(L.th, L.wt, L.kt), base: back ? L.colD : L.col, seed: seed + (back ? 1 : 2), noRivet: !!back,
      paint: (p) => { if (L.thighPaint) L.thighPaint(back, p); hatch(back ? null : [[-L.wt, -10], [-4, -10], [-4, L.th], [-L.wt, L.th]], 0.8, 3.8, back ? 0.3 : 0.22); } });
    const shin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, L.th], pts: legC(L.sh, L.kt, L.ak), base: back ? (L.shinD || L.colD) : (L.shin || L.col), seed: seed + (back ? 3 : 4), noRivet: !!back,
      paint: (p) => { if (L.shinPaint) L.shinPaint(back, p); hatch(back ? null : [[-L.kt, -6], [-3, -6], [-3, L.sh], [-L.kt, L.sh]], 0.8, 3.8, back ? 0.3 : 0.2); } });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, L.sh], pts: FOOT(L.ak + 1, L.fl), base: back ? L.shoeD : L.shoe, seed: seed + (back ? 5 : 6), noRivet: true,
      paint: () => { if (L.shoePaint) L.shoePaint(back); else strokePts([[4, 4], [L.fl * 0.7, 7]], 'rgba(255,255,255,0.25)', 1.2); } });
    return { legB_up: thigh(true), legB_lo: shin(true), piedB: foot(true), legF_up: thigh(false), legF_lo: shin(false), piedF: foot(false) };
  }
  const ORDER = (heads, extraBack) => ['armB_up', 'armB_lo', 'objetB', 'doigtsB'].concat(extraBack || [], ['legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF', 'head'], heads, ['torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'auriculaire', 'doigtsB2']);

  // ---------------- visage : œil (iris coloré, paupière), sourcil, bouche
  function oeil(x, y, o) {
    o = o || {}; const lid = clamp(o.lid || 0), w = o.wide ? 1.35 : 1, sz = o.sz || 1;
    if (o.heureux) { strokePts([[x - 7 * sz, y + 1], [x - 1, y - 3.5 * sz], [x + 6 * sz, y]], 'rgba(30,18,16,0.95)', 2); strokePts([[x - 9, y + 3], [x - 12, y + 5]], 'rgba(90,50,40,0.5)', 1); return; }
    if (lid > 0.85) {
      strokePts([[x - 7 * sz, y - 0.5], [x, y + 2.4 * sz], [x + 6.5 * sz, y - 0.5]], 'rgba(30,18,16,0.95)', 2);
      if (o.clin) for (const [a, b] of [[[x - 9, y - 2], [x - 14, y - 5]], [[x - 9, y + 1], [x - 15, y + 1]], [[x - 8, y + 4], [x - 13, y + 7]]]) strokePts([a, b], 'rgba(90,50,40,0.6)', 1.1);
      return;
    }
    const h = (1 - lid) * w;
    fillPts([[x - 6.5 * sz, y], [x - 1 * sz, y - 3.6 * sz * h], [x + 6 * sz, y - 1.2 * sz * h], [x + 2.8 * sz, y + 2 * sz * w], [x - 4 * sz, y + 1.2 * sz]], '#efe8da', 0, 0);
    const lx = (o.look ? o.look[0] : 0), ly = (o.look ? o.look[1] : 0);
    if (o.iris) dot(x + 2 * sz + lx, y - 0.4 * sz * h + ly, 2.5 * sz * Math.min(1.1, w), o.iris);
    dot(x + 2.2 * sz + lx, y - 0.5 * sz * h + ly, (o.iris ? 1.2 : 2.0) * sz, '#1f1716');
    strokePts([[x - 7 * sz, y + 0.2], [x - 1 * sz, y - 3.9 * sz * h], [x + 6.5 * sz, y - 1.4 * sz * h]], 'rgba(28,16,14,0.95)', 1.9);
    if (lid > 0.2) fillPts([[x - 7 * sz, y - 4.5 * sz], [x + 7 * sz, y - 4.5 * sz], [x + 6.5 * sz, y - 1.4 * sz * h], [x - 1 * sz, y - 3.9 * sz * h], [x - 7 * sz, y + 0.2]], o.peau || P.peau, 0, 0);
  }
  function sourcil(x, y, o) {
    o = o || {}; const r = o.leve || 0, f = o.fronce || 0, lw = o.lw || 2.6;
    strokePts([[x - 9, y - 1 - 2 * r + 1.5 * f], [x - 1, y - 3.5 - 4.5 * r + 0.5 * f], [x + 8, y - 1.5 - 2.5 * r + 3 * f]], o.col || 'rgba(45,28,20,0.95)', lw);
  }
  function bouche(x, y, kind, o) {
    o = o || {}; const col = o.col || 'rgba(110,40,38,0.95)';
    if (kind === 'o') { fillPts([[x - 3.5, y - 3], [x + 1.5, y - 3.5], [x + 2, y + 3], [x - 3.5, y + 3.5]], '#3a1714', 0, 0); return; }
    if (kind === 'bee') { const j = o.jaw || 10; fillPts([[x - 6, y - 2], [x + 3, y - 3], [x + 4, y + j], [x - 2, y + j + 1], [x - 7, y + j * 0.6]], '#3a1714', 0, 0); fillPts([[x - 1, y + j - 3], [x + 3, y + j - 2], [x + 3, y + j], [x - 1, y + j]], '#b05a55', 0, 0); return; }
    if (kind === 'sourire') { strokePts([[x + 2, y - 1.5], [x - 4, y + 1], [x - 10, y - 3]], col, 1.9); return; }
    if (kind === 'rire') { fillPts([[x + 2, y - 2], [x - 10, y - 3], [x - 4, y + 5]], '#3a1714', 0, 0); strokePts([[x + 1, y - 2], [x - 9, y - 3]], '#f1ece0', 1.4); return; }
    if (kind === 'serre') { strokePts([[x + 1, y], [x - 9, y + 1.4]], col, 2.1); return; }
    if (kind === 'coin') { strokePts([[x + 1, y + 1], [x - 4, y + 0.5], [x - 9, y - 2.5]], col, 1.9); return; }               // sourire en coin
    if (kind === 'moue') { strokePts([[x + 1, y + 0.5], [x - 4, y + 1], [x - 9, y + 3]], col, 1.9); return; }               // coin tombant
    if (kind === 'grimace') { strokePts([[x + 2, y + 2], [x - 2, y - 2], [x - 6, y + 1], [x - 10, y - 1]], col, 2.1); fillPts([[x - 1, y - 1.5], [x + 2, y + 1.5], [x - 3, y + 0.5]], '#f1ece0', 0, 0); return; }
    strokePts([[x + 1, y], [x - 4, y + 0.8], [x - 9, y + 0.2]], col, 1.7);
  }
  const stubble = (reg, n, seed, col) => { const bb = M.bbox(reg); for (let i = 0; i < n; i++) { const px = lerp(bb[0], bb[2], hash(seed + i * 1.37)), py = lerp(bb[1], bb[3], hash(seed + i * 2.71 + 9)); dot(px, py, 0.45 + 0.35 * hash(i + seed * 3), col); } };

  // =====================================================================
  // HUGH LAURIE / HOUSE — blazer anthracite ouvert, t-shirt bordeaux, jean délavé, baskets ivoire ; barbe de trois jours, yeux bleu clair
  // =====================================================================
  const LH = { peau: '#e2c19f', peauD: '#c69f7d', blazer: '#4a4d55', blazerD: '#3b3e45', blazerL: '#5b5f68', tee: '#7a2e34', teeD: '#5f2328', jean: '#56647a', jeanD: '#465265',
    basket: '#e6e0d0', basketD: '#c9c3b3', basketG: '#8d8f92', cheveux: '#3a2a20', barbe: 'rgba(92,78,70,0.7)', iris: '#8cb6d6' };
  const LH_TORSO = [[-14, -178], [8, -182], [18, -170], [28, -152], [34, -114], [35, -62], [33, -14], [35, 30], [37, 44, 1], [-37, 46, 1], [-39, 10], [-37, -40], [-39, -110], [-35, -150], [-26, -170]];
  const LH_HEAD = [[-14, 16], [10, 16], [12, 4], [18, -3], [27, -7], [30, -14], [28, -21], [30, -25], [29, -29], [32, -33], [40, -40, 1], [34, -47], [30, -55], [31, -63], [28, -78], [16, -92], [-6, -98], [-25, -90], [-34, -70], [-33, -46], [-25, -28], [-17, -8]];
  const LH_HAIR = [[30, -71], [34, -80], [31, -86, 1], [35, -93, 1], [25, -96], [21, -104, 1], [11, -101], [3, -107, 1], [-6, -103], [-17, -104, 1], [-24, -98], [-33, -94], [-38, -84], [-41, -74], [-38, -62], [-37, -50], [-31, -45], [-25, -54], [-16, -68], [0, -77], [14, -80], [24, -77]];
  const LH_EXPR = {
    neutre: {}, sceptique: { leve: 1.1, lid: 0.35, bouche: 'moue' }, grimace: { leve: 0.5, fronce: 0.4, lid: 0.25, look: [0.8, -2.2], bouche: 'grimace' },
    clin: { clin: 1, bouche: 'coin', fronce: 0.3 }, fier: { lid: 0.3, bouche: 'coin', leve: 0.2 }, ebahi: { wide: true, leve: 1.2, bouche: 'o' }, sourire: { bouche: 'sourire' },
  };
  function mkLaurie() {
    const L = { th: 116, sh: 108, hx: 6, wt: 17, kt: 12, ak: 9, fl: 44, col: LH.jean, colD: LH.jeanD, shoe: LH.basket, shoeD: LH.basketD,
      thighPaint: (back) => { if (!back) { strokePts([[8, 4], [10, 100]], 'rgba(255,255,255,0.18)', 1.2); strokePts([[-10, 20], [6, 22]], 'rgba(30,40,55,0.35)', 1); } },
      shinPaint: (back) => { fillPts(box(-16, L.sh - 10, 16, L.sh + 10), back ? '#3d495b' : '#4c5a6e'); strokePts([[-14, L.sh - 10], [14, L.sh - 10]], 'rgba(255,255,255,0.2)', 1.2); },
      shoePaint: (back) => { fillPts(box(-16, 11, 46, 17), back ? '#8d8f92' : '#a2a4a6'); strokePts([[6, 1], [20, 3]], LH.basketG, 2); strokePts([[14, 3], [26, 6]], LH.basketG, 1.4); } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: LH_TORSO, base: LH.blazer, seed: 9001, paint: () => {
        fillPts([[1, -181], [14, -177], [24, -160], [32, -130], [35, -62], [33, -14], [34, 30], [22, 30], [17, -30], [13, -100], [7, -150], [0, -170]], LH.tee);
        strokePts([[2, -178], [8, -172], [16, -176]], LH.teeD, 2);
        hatch([[14, -150], [34, -150], [34, 30], [20, 30]], 0.9, 4, 0.18);
        fillPts([[0, -172], [7, -150], [13, -100], [19, -114], [15, -152], [9, -174]], LH.blazerD);              // revers
        strokePts([[13, -100], [17, -30], [21, 30], [23, 44]], 'rgba(20,20,26,0.75)', 1.6);
        strokePts([[19, -114], [15, -152], [9, -174]], 'rgba(255,255,255,0.18)', 1.1);
        fillPts(box(-26, 6, 6, 13), LH.blazerD); strokePts([[-26, 6], [6, 6]], 'rgba(255,255,255,0.15)', 1);
        strokePts([[-14, -112], [6, -112]], 'rgba(20,20,26,0.5)', 1.2);
        hatch([[-52, -170], [-12, -170], [-10, 48], [-52, 48]], 0.75, 4.2, 0.3);
        shade(40, 0, -40, 0, 0.26);
      } },
      armB_up: upDef([-10, -146], LH.blazerD, 9004),
      armB_lo: foreDef('armB_up', LH.blazerD, LH.peauD, true, 9005, { cuff: '#33363c' }),
      head: { parent: 'torso', at: [6, -170], pts: LH_HEAD, base: LH.peau, seed: 9006, noRivet: true, paint: (p) => {
        const f = p.face || {}, e = Object.assign({}, LH_EXPR[p.expr || 'neutre'] || {}, f.lh || {});
        if (p.clin != null) { e.clin = p.clin; if (p.clin > 0.5) e.bouche = e.bouche || 'coin'; }
        X.earPaint(-8, -44);
        fillPts([[-12, -36], [4, -28], [18, -21], [27, -17], [30, -12], [27, -6], [16, 0], [4, 4], [-12, 0], [-20, -22]], 'rgba(98,88,86,0.4)');
        stubble([[-12, -34], [28, -34], [30, 4], [-14, 4]], 300, 11, 'rgba(70,60,56,0.42)');
        fillPts([[24, -37], [32, -34], [31, -29], [24, -29]], 'rgba(98,88,86,0.38)'); stubble([[23, -36], [32, -36], [32, -29], [23, -29]], 30, 77, 'rgba(70,60,56,0.42)');
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.22);
        strokePts([[24, -42], [20, -32], [22, -24]], 'rgba(120,70,55,0.4)', 1.1);                      // sillon
        strokePts([[14, -74], [26, -73]], 'rgba(120,70,55,0.3)', 1); strokePts([[12, -69], [25, -68]], 'rgba(120,70,55,0.22)', 1);
        const cl = clamp(e.clin || 0);
        oeil(19, -52, { iris: LH.iris, lid: cl > 0.5 ? 1 : (f.eyes === 'closed' ? 1 : e.lid || 0), clin: cl > 0.5, wide: e.wide || f.eyes === 'wide', look: e.look, peau: LH.peau });
        sourcil(19, -62, { leve: e.leve || 0, fronce: (e.fronce || 0) + (cl > 0.5 ? 0.6 : 0), lw: 3.4, col: 'rgba(48,34,26,0.98)' });
        bouche(29, -24, f.mouth ? ({ n: 'n', o: 'o', smile: 'sourire', tight: 'serre' }[f.mouth] || f.mouth) : (e.bouche || 'n'));
      } },
      meches: { parent: 'head', at: [0, 0], pts: LH_HAIR, base: LH.cheveux, seed: 9007, noRivet: true, paint: (p) => {
        for (const [a, b] of [[[24, -84], [4, -94]], [[10, -88], [-16, -96]], [[-8, -84], [-30, -84]], [[-20, -72], [-36, -62]]]) strokePts([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 3], b], 'rgba(150,120,95,0.45)', 1.3);
        strokePts([[-30, -52], [-34, -60]], 'rgba(150,140,130,0.5)', 1.2);
        hatch(null, 0.5, 3.4, 0.22);
      } },
      armF_up: upDef([-2, -146], LH.blazer, 9009),
      armF_lo: foreDef('armF_up', LH.blazer, LH.peau, false, 9010, { cuff: '#3b3e45' }),
    };
    Object.assign(parts, legParts(L, 9020), heldParts(LH.peau, 9030));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['meches']), nom: 'laurie', _legs: L };
  }
  CH.houLaurie = mkLaurie();
  HOU.lauriePose = function (q, env) {
    const def = CH.houLaurie, A = q.ang, t = q.t || 0;
    const bo = k01(q.boite), po = k01(q.pointe), me = k01(q.menton), ch = k01(q.chut), je = k01(q.jeu), si = k01(q.sirote), br = k01(q.brandir), rv = k01(q.reverence), ma = k01(q.marche);
    if ((bo > 0 || po > 0) && q.tenu == null) q.tenu = 'canne';
    if (si > 0 && q.tenu == null) q.tenu = 'tasse';
    const libreF = A.armF_up == null && A.armF_lo == null, libreB = A.armB_up == null && A.armB_lo == null;
    marche(q, ma, t);
    const canneF = q.tenu === 'canne' || q.tenu === 'parapluie', canneB = q.tenuB === 'canne' || q.tenuB === 'parapluie';
    if (canneF || canneB) {                                                        // canne au sol, main sur la crosse (repos)
      const ph = t * TAU * 0.85, sw = Math.sin(ph);
      if (bo > 0) {
        q.tilt = (q.tilt || 0) + (0.025 + 0.025 * sw) * bo; q.dy = (q.dy || 0) + 5 * Math.max(0, sw) * bo;
        A.legF_up = (A.legF_up || 0) + 0.2 * sw * bo; A.legB_up = (A.legB_up || 0) - 0.2 * sw * bo;
        A.legB_lo = (A.legB_lo || 0) + 0.3 * Math.max(0, -sw) * bo; A.piedB = (A.piedB || 0) - 0.2 * Math.max(0, -sw) * bo;
      }
      const lift = bo * 10 * Math.max(0, Math.cos(ph));
      const hy = 238 - (q.dy || 0) - (CANNE_L + 10) - lift, hx = 62 + 12 * sw * bo;
      const k = q.appui == null ? (po > 0 ? 1 - po : 1) : k01(q.appui);
      if (canneF && k > 0 && libreF) armTo(q, def, 'armF', [hx, hy], 'bas', k);
      if (canneB && libreB && je <= 0) armTo(q, def, 'armB', [hx - 26, hy], 'bas', q.appuiB == null ? 1 : k01(q.appuiB));
    }
    if (po > 0) {                                                                  // canne tendue vers la cible (bout de la canne)
      const S = def.parts.armF_up.at, T = q.cible ? toTorso(env, q, q.cible) : [S[0] + 200, S[1] - 40];
      const a = Math.atan2(-(T[0] - S[0]), T[1] - S[1]);
      blend(q, 'armF_up', a + 0.16, po); blend(q, 'armF_lo', -0.16, po);
      A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + (q.tilt || 0)) * (1 - po); q.droit = false;
    }
    if (me > 0) { const T = headPt(q, def, 30, 12 + 3 * Math.sin(t * 13)); armTo(q, def, 'armF', T, 'bas', me); if (me > 0.5) q.handF = 'open'; }
    if (ch > 0) { armTo(q, def, 'armF', headPt(q, def, 50, -16), 'bas', ch); if (ch > 0.5) q.handF = 'open'; }
    if (je > 0) { blend(q, 'armB_up', -2.35, je); blend(q, 'armB_lo', -0.55, je); A.head = (A.head || 0) - 0.14 * je; q.tilt = (q.tilt || 0) - 0.05 * je; if (je > 0.4) q.handB = 'open'; }
    if (si > 0) { armTo(q, def, 'armF', headPt(q, def, 36, -6), 'bas', si); A.head = (A.head || 0) - 0.06 * si; A.objet = (A.objet || 0) - 0.42 * si; }
    if (br > 0) { const h = q.haut == null ? 1 : clamp(q.haut); blend(q, 'armF_up', lerp(-1.35, -2.0, h), br); blend(q, 'armF_lo', lerp(-0.55, -0.8, h), br); }
    if (rv > 0) {
      plier(q, def, 0.55 * rv); A.head = (A.head || 0) + 0.3 * rv;
      blend(q, 'armF_up', -0.3, rv); blend(q, 'armF_lo', -1.7, rv); blend(q, 'armB_up', 1.0, rv); blend(q, 'armB_lo', -0.2, rv);
      if (!has(q.tenuB)) q.handB = 'open';
    }
  };
  HOU.laurie = wrap(CH.houLaurie, HOU.lauriePose, 0.9);

  // =====================================================================
  // LE PRODUCTEUR — petit et rond, casquette de baseball rouge sombre, lunettes de soleil, chemise moutarde à palmiers, pantalon beige
  // =====================================================================
  const PR = { peau: '#eec3a3', peauD: '#d3a284', joue: 'rgba(222,112,104,0.42)', chemise: '#c79a3a', chemiseD: '#a8812f', palm: '#5f6e45', pant: '#cdbb96', pantD: '#b2a07c',
    moc: '#5a3a24', mocD: '#46301e', cap: '#8e2f2a', capD: '#6e231f', lun: '#141416', cheveux: '#6d5b4c' };
  const PR_TORSO = [[-14, -166], [8, -170], [20, -160], [36, -142], [52, -112], [64, -74], [67, -38], [61, -6], [47, 16], [30, 25, 1], [-36, 25, 1], [-45, 0], [-45, -60], [-42, -112], [-34, -146], [-26, -160]];
  const prHead = (j) => [[-16, 18], [12, 18], [16, 8 + j * 0.4], [25, 3 + j], [32, -4 + j], [34, -12 + j], [31, -19 + j * 0.8], [34, -24], [33, -29], [36, -33], [43, -38, 1], [38, -46], [33, -54], [33, -64], [29, -78], [15, -93], [-6, -98], [-26, -91], [-37, -70], [-37, -46], [-30, -24], [-26, -6]];
  const PR_CAP = [[-42, -54], [-44, -72], [-34, -92], [-14, -105], [12, -105], [28, -96], [35, -82], [37, -73], [60, -71], [73, -66, 1], [69, -61], [44, -62], [32, -61], [-4, -58], [-40, -50]];
  const PR_EXPR = { neutre: { bouche: 'sourire' }, ravi: { heureux: true, bouche: 'rire', leve: 0.4 }, extase: { heureux: true, bouche: 'rire', leve: 1.1 }, boucheBee: { wide: true, leve: 1.3, bouche: 'bee', jaw: 12 }, sceptique: { lid: 0.4, bouche: 'serre' } };
  function lunM(k) { return new DOMMatrix().translate(lerp(16, 27, k), lerp(-86, -53, k)).rotate(lerp(-0.34, 0, k) * D); }
  const LUN = [[-12, -7], [11, -8], [13, -2, 1], [9, 6], [-2, 8], [-11, 4]];
  function mkProducteur() {
    const L = { th: 94, sh: 86, hx: 7, wt: 20, kt: 14, ak: 10, fl: 44, col: PR.pant, colD: PR.pantD, shoe: PR.moc, shoeD: PR.mocD,
      thighPaint: (back) => { if (!back) strokePts([[10, 6], [10, 96]], 'rgba(120,100,70,0.35)', 1.2); },
      shoePaint: (back) => { strokePts([[8, 2], [26, 5]], 'rgba(255,230,190,0.3)', 1.4); fillPts(box(-16, 13, 45, 17), '#2e2016'); } };
    const shirtSleeve = (back) => () => { fillPts(box(-24, 56, 24, 140), back ? PR.peauD : PR.peau); fillPts(box(-20, 50, 20, 58), back ? '#94722a' : PR.chemiseD); if (!back) { palms([[-6, 16], [6, 40]], 1.2); for (let k = 0; k < 5; k++) dot(-4 + Math.cos(k * 1.26) * 3.4, Math.sin(k * 1.26) * 3.4, 2.4, '#efe4c8'); } hatch([[-18, -20], [-3, -20], [-3, 56], [-18, 56]], 0.9, 3.8, back ? 0.32 : 0.24); };
    const palms = (list, sc) => { for (const [px, py] of list) { strokePts([[px, py + 6 * sc], [px + 1, py - 4 * sc]], PR.palm, 1.6); for (const a of [-2.6, -1.9, -1.2, -0.5]) strokePts([[px + 1, py - 4 * sc], [px + 1 + Math.cos(a) * 7 * sc, py - 4 * sc + Math.sin(a) * 5 * sc + 3]], PR.palm, 1.6); } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PR_TORSO, base: PR.chemise, seed: 9101, paint: () => {
        palms([[-26, -132], [12, -138], [-6, -94], [34, -100], [-28, -56], [16, -52], [50, -64], [-14, -14], [28, -14], [58, -32]], 1.5);
        for (const [fx, fy] of [[-10, -120], [24, -124], [-30, -84], [10, -76], [40, -84], [-6, -40], [36, -40], [-30, -10], [12, 4]]) { for (let k = 0; k < 5; k++) dot(fx + Math.cos(k * 1.26) * 3.4, fy + Math.sin(k * 1.26) * 3.4, 2.4, '#efe4c8'); dot(fx, fy, 1.6, '#b5332c'); }
        fillPts([[2, -170], [18, -160], [12, -132], [4, -150]], PR.peau); fillPts([[18, -160], [28, -150], [16, -128], [12, -132]], PR.chemiseD);
        strokePts([[12, -132], [26, -100], [40, -50], [44, 0], [40, 20]], 'rgba(80,55,15,0.6)', 1.4);
        for (const y of [-104, -66, -28]) dot(34 + y * -0.05, y + 8, 2, '#e8dcc0');
        fillPts([[-46, 13], [44, 13], [36, 25], [-46, 25]], '#5a3a24'); fillPts(box(22, 13, 30, 24), OR);
        strokePts([[60, -60], [62, -30], [54, -4]], 'rgba(255,240,200,0.25)', 2);
        hatch([[-54, -160], [-14, -160], [-12, 26], [-54, 26]], 0.75, 4.2, 0.28);
        shade(56, -40, -40, -40, 0.32, [-60, -170, 62, 30]);
      } },
      armB_up: upDef([-10, -136], '#a8812f', 9104, 18, shirtSleeve(true)),
      armB_lo: foreDef('armB_up', PR.peauD, PR.peauD, true, 9105, { bare: true }),
      head: { parent: 'torso', at: [6, -160], pts: (p) => prHead(p._jaw || 0), base: PR.peau, seed: 9106, noRivet: true, paint: (p) => {
        const f = p.face || {}, e = Object.assign({}, PR_EXPR[p.expr || 'neutre'] || {}, f.pr || {}), j = p._jaw || 0;
        fillPts([[-37, -60], [-24, -58], [-20, -44], [-26, -36], [-36, -40]], PR.cheveux);
        X.earPaint(-8, -46);
        dot(17, -30, 11, PR.joue);
        strokePts([[18, 6 + j * 0.4], [26, 2 + j]], 'rgba(150,90,70,0.4)', 1.2);
        hatch([[-24, -40], [4, -30], [12, -6], [-6, 16], [-32, 6]], 0.6, 3.6, 0.2);
        strokePts([[34, -40], [30, -34], [33, -30]], 'rgba(150,80,60,0.45)', 1.1);
        if (clamp(p._lun) < 0.85) { oeil(21, -52, { lid: f.eyes === 'closed' ? 1 : e.lid || 0, wide: e.wide || f.eyes === 'wide', heureux: e.heureux, look: e.look, iris: '#5a4632', peau: PR.peau }); }
        sourcil(21, -62 - (e.leve || 0) * 1.5, { leve: e.leve || 0, fronce: e.fronce || 0, lw: 2.8, col: 'rgba(90,70,55,0.95)' });
        bouche(30, -22, f.mouth ? ({ n: 'n', o: 'o', smile: 'sourire', tight: 'serre' }[f.mouth] || f.mouth) : (e.bouche || 'n'), { jaw: j });
      } },
      casquette: { parent: 'head', at: [0, 0], pts: PR_CAP, base: PR.cap, seed: 9107, noRivet: true, paint: () => {
        fillPts([[37, -73], [60, -71], [73, -66], [69, -61], [44, -62], [34, -62]], PR.capD);
        strokePts([[38, -68], [68, -65]], 'rgba(255,200,180,0.25)', 1.2);
        for (const pts of [[[-12, -104], [-6, -80], [-2, -59]], [[12, -104], [18, -80], [22, -60]]]) strokePts(pts, 'rgba(40,10,8,0.45)', 1.2);
        dot(0, -104, 3.4, PR.capD); fillPts(box(-42, -60, -24, -54), '#d8cfbd');
        hatch(null, 0.5, 3.6, 0.25); shade(0, -105, 0, -55, 0.25, [-46, -108, 76, -50]);
      } },
      lunettes: { parent: 'head', at: [0, 0], noRivet: true, base: PR.lun, seed: 9108, pts: (p) => { const m = lunM(clamp(p._lun || 0)); return LUN.map((v) => mp(m, v)); },
        paint: (p) => { const m = lunM(clamp(p._lun || 0)), a = mp(m, [-6, -5]), b = mp(m, [6, -6]); strokePts([a, b], 'rgba(150,170,190,0.6)', 1.6); },
        extra: (p) => { const m = lunM(clamp(p._lun || 0)), a = mp(m, [-12, -4]), b = [-8, lerp(-80, -50, clamp(p._lun || 0))]; strokePts([a, b], PR.lun, 2.4); } },
      armF_up: upDef([-2, -136], PR.chemise, 9109, 18, shirtSleeve(false)),
      armF_lo: foreDef('armF_up', PR.peau, PR.peau, false, 9110, { bare: true }),
    };
    Object.assign(parts, legParts(L, 9120), heldParts(PR.peau, 9130));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 12] }, order: ORDER(['casquette', 'lunettes']), nom: 'producteur', _legs: L };
  }
  CH.houProducteur = mkProducteur();
  HOU.producteurPose = function (q, env) {
    const def = CH.houProducteur, A = q.ang, t = q.t || 0;
    const lo = k01(q.loupe), ap = k01(q.applaudit), co = k01(q.coeur), dr = k01(q.drapeau), as = k01(q.assis), ma = k01(q.marche);
    const lun = q.lunettes === 'nez' ? 1 : q.lunettes === 'front' || q.lunettes == null ? 0 : clamp(q.lunettes);
    q._lun = lun;
    const ex = q.expr === 'boucheBee' ? 1 : 0; q._jaw = (q.jaw != null ? q.jaw : ex * 12);
    if (lo > 0 && q.tenu == null) q.tenu = 'loupe';
    if (dr > 0 && q.tenuB == null) q.tenuB = 'drapeau';
    marche(q, ma, t, 0.3);
    assis(q, env, as);
    if (lo > 0) { armTo(q, def, 'armF', headPt(q, def, 50, 6), 'bas', lo); }
    if (ap > 0) {
      const sep = 16 * (0.5 + 0.5 * Math.cos(t * TAU * 2.6)), y0 = -96;
      armTo(q, def, 'armF', [84 + sep, y0], 'bas', ap); armTo(q, def, 'armB', [80 - sep, y0 - 16], 'bas', ap);
      if (ap > 0.4) { q.handF = q.tenu ? q.handF : 'open'; q.handB = q.tenuB ? q.handB : 'open'; }
    }
    if (co > 0) { armTo(q, def, 'armF', [50, -108], 'bas', co); if (co > 0.4 && !has(q.tenu)) q.handF = 'open'; }
    if (dr > 0) { const w = Math.sin(t * 8); blend(q, 'armB_up', -2.15 + 0.12 * w, dr); blend(q, 'armB_lo', -0.55 + 0.18 * Math.sin(t * 8 + 0.7), dr); q.tenuBO = Object.assign({ ondule: 1 }, q.tenuBO); }
  };
  HOU.producteur = wrap(CH.houProducteur, HOU.producteurPose, 0.9);

  // =====================================================================
  // LE PATIENT — jeune, maigre, joues creuses, cheveux roux longs en bataille, blouse d'hôpital bleu pâle à pois, bracelet, jambes nues, chaussons
  // =====================================================================
  const PA = { peau: '#ecd5c0', peauD: '#d2b79f', blouse: '#a9c2cf', blouseD: '#8ea9b8', pois: '#6f8ea3', cheveux: '#b5562a', cheveuxD: '#8e4220', chausson: '#a6acb2', chaussonD: '#878e95', bracelet: '#f2efe6' };
  const PA_TORSO = [[-12, -176], [8, -180], [16, -168], [24, -150], [28, -110], [28, -60], [30, -10], [32, 20], [-32, 22], [-30, -10], [-30, -60], [-31, -110], [-30, -150], [-24, -168]];
  const PA_HEAD = [[-12, 16], [7, 16], [8, 4], [14, -4], [22, -8], [26, -15], [25, -21], [27, -25], [26, -29], [29, -33], [35, -38, 1], [31, -45], [27, -55], [28, -64], [25, -78], [13, -92], [-6, -97], [-24, -88], [-32, -68], [-31, -46], [-24, -28], [-16, -8]];
  const PA_HAIR = [[28, -60, 1], [31, -71], [26, -78], [35, -86, 1], [22, -92], [25, -104, 1], [10, -100], [3, -112, 1], [-8, -103], [-21, -110, 1], [-26, -99], [-41, -97, 1], [-40, -86], [-51, -77, 1], [-46, -65], [-53, -51, 1], [-46, -43], [-50, -27, 1], [-42, -30], [-42, -13, 1], [-34, -24], [-28, -36], [-22, -48], [-18, -58], [-10, -67], [2, -72], [10, -70], [14, -57, 1], [18, -68], [22, -66]];
  const PA_EXPR = { neutre: {}, perplexe: { fronce: 0.9, bouche: 'moue', lid: 0.2 }, concentre: { fronce: 0.7, lid: 0.45, bouche: 'serre' }, content: { bouche: 'sourire', leve: 0.3 }, conquis: { heureux: true, bouche: 'rire', leve: 0.8 }, etonne: { wide: true, leve: 1.1, bouche: 'o' } };
  const POIS = (reg, seed, col) => { const bb = M.bbox(reg); for (let x = bb[0]; x < bb[2]; x += 13) for (let y = bb[1]; y < bb[3]; y += 13) dot(x + ((y / 13) % 2) * 6.5 + hash(x + y + seed) * 2, y, 2.2, col); };
  function mkPatient() {
    const L = { th: 116, sh: 108, hx: 5, wt: 14, kt: 10, ak: 8, fl: 40, col: PA.peau, colD: PA.peauD, shoe: PA.chausson, shoeD: PA.chaussonD,
      thighPaint: (back) => { fillPts([[-24, -20, 1], [24, -20, 1], [24, 78, 1], [12, 86], [0, 80], [-12, 86], [-24, 80, 1]], back ? PA.blouseD : PA.blouse); POIS([[-20, -16], [20, -16], [20, 74], [-20, 74]], back ? 3 : 4, back ? '#6a8798' : PA.pois); strokePts([[-16, 84], [0, 80], [16, 84]], 'rgba(40,60,75,0.5)', 1.2); },
      shoePaint: (back) => { fillPts(box(-16, 0, 6, 10), back ? '#7a8288' : '#959ca2'); strokePts([[0, 3], [30, 8]], 'rgba(255,255,255,0.3)', 1.6); } };
    const sleeve = (back) => () => { fillPts(box(-20, 44, 20, 140), back ? PA.peauD : PA.peau); fillPts(box(-17, 36, 17, 46), back ? '#7e98a6' : PA.blouseD); POIS([[-12, -10], [12, -10], [12, 34], [-12, 34]], back ? 5 : 6, back ? '#6a8798' : PA.pois); hatch([[-14, -20], [-3, -20], [-3, 44], [-14, 44]], 0.9, 3.8, back ? 0.32 : 0.22); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PA_TORSO, base: PA.blouse, seed: 9201, paint: () => {
        POIS([[-28, -172], [28, -172], [30, 20], [-30, 20]], 1, PA.pois);
        fillPts([[0, -178], [12, -172], [6, -160]], PA.blouseD);
        strokePts([[-30, -150], [-26, -60], [-28, 20]], 'rgba(40,60,75,0.55)', 1.4);
        for (const y of [-150, -96]) { strokePts([[-30, y], [-38, y + 6]], '#e9e4d6', 1.6); strokePts([[-30, y], [-37, y - 4]], '#e9e4d6', 1.6); }
        hatch([[-44, -170], [-10, -170], [-10, 24], [-44, 24]], 0.75, 4.2, 0.26);
        shade(30, 0, -30, 0, 0.24);
      } },
      armB_up: upDef([-10, -146], PA.blouseD, 9204, 12, sleeve(true)),
      armB_lo: foreDef('armB_up', PA.peauD, PA.peauD, true, 9205, { bare: true }),
      head: { parent: 'torso', at: [6, -170], pts: PA_HEAD, base: PA.peau, seed: 9206, noRivet: true, paint: (p) => {
        const f = p.face || {}, e = Object.assign({}, PA_EXPR[p.expr || 'neutre'] || {}, f.pa || {});
        X.earPaint(-8, -44);
        fillPts([[2, -40], [16, -36], [18, -22], [8, -14], [-2, -24]], 'rgba(150,110,95,0.22)');                 // joue creuse
        strokePts([[4, -38], [12, -18], [8, -8]], 'rgba(130,90,75,0.35)', 1.2);
        strokePts([[14, -40], [24, -42]], 'rgba(150,100,90,0.3)', 1); hatch([[-22, -42], [2, -30], [10, -10], [-6, 14], [-30, 4]], 0.6, 3.6, 0.22);
        oeil(18, -52, { iris: '#6c8a5c', lid: f.eyes === 'closed' ? 1 : e.lid || 0, wide: e.wide || f.eyes === 'wide', heureux: e.heureux, look: e.look, peau: PA.peau });
        dot(16, -46, 6, 'rgba(120,90,110,0.12)');
        sourcil(18, -61, { leve: e.leve || 0, fronce: e.fronce || 0, lw: 2.2, col: 'rgba(150,70,35,0.95)' });
        bouche(26, -24, f.mouth ? ({ n: 'n', o: 'o', smile: 'sourire', tight: 'serre' }[f.mouth] || f.mouth) : (e.bouche || 'n'));
        if (k01(p.stetho) > 0) { pc(ribbon([[-6, -44], [-2, -30], [0, -12], [-2, 6]], 4, 4), '#55595e', null, 9211); pc(ell(-6, -45, 3.5, 3.5, 8), '#2b2d31', null, 9212); }
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: PA_HAIR, base: PA.cheveux, seed: 9207, noRivet: true, paint: () => {
        for (const [a, b] of [[[24, -84], [12, -62]], [[8, -96], [-12, -70]], [[-14, -98], [-30, -60]], [[-32, -84], [-40, -30]], [[-40, -66], [-44, -6]], [[-24, -60], [-33, -10]]]) strokePts([a, [(a[0] + b[0]) / 2 + 3, (a[1] + b[1]) / 2], b], 'rgba(235,150,90,0.5)', 1.3);
        hatch(null, 0.5, 3.4, 0.2);
      } },
      armF_up: upDef([-2, -146], PA.blouse, 9209, 12, sleeve(false)),
      armF_lo: foreDef('armF_up', PA.peau, PA.peau, false, 9210, { bare: true, bracelet: PA.bracelet }),
    };
    Object.assign(parts, legParts(L, 9220), heldParts(PA.peau, 9230));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-22, 12] }, order: ORDER(['cheveux']), nom: 'patient', _legs: L,
      _after: (r, q) => {                                                          // tuyau du stéthoscope : oreille → poitrine → pavillon
        const k = k01(q.stetho); if (k <= 0 || q.tenu !== 'pavillon' || SIL()) return;
        const a = r.w('head', -2, 6), m = r.w('torso', 24, -120), b = HOU.pt(r, 'tube'), c = cx_();
        const sc = Math.hypot(r.mats.torso.a, r.mats.torso.b);
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round';
        c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1] + 30 * sc, b[0], b[1]);
        c.strokeStyle = 'rgba(20,14,10,0.7)'; c.lineWidth = 6.5 * sc; c.stroke(); c.strokeStyle = '#4d5156'; c.lineWidth = 4.2 * sc; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1.2 * sc; c.stroke(); c.restore();
      } };
  }
  CH.houPatient = mkPatient();
  HOU.patientPose = function (q, env) {
    const def = CH.houPatient, A = q.ang, t = q.t || 0;
    const as = k01(q.assis), sa = k01(q.salut), st = k01(q.stetho), pe = k01(q.perplexe), ha = k01(q.hausse), ap = k01(q.applaudit), ma = k01(q.marche);
    if (st > 0 && q.tenu == null) q.tenu = 'pavillon';
    marche(q, ma, t, 0.36);
    assis(q, env, as);
    if (sa > 0) { blend(q, 'armF_up', -0.55, sa); blend(q, 'armF_lo', -1.95 + 0.25 * Math.sin(t * 11), sa); if (sa > 0.4) q.handF = 'open'; }
    if (st > 0) { const T = q.cible ? toTorso(env, q, q.cible) : [150, -110]; armTo(q, def, 'armF', T, 'bas', st); }
    if (pe > 0) { armTo(q, def, 'armF', headPt(q, def, -4 + 4 * Math.sin(t * 14), -104), 'avant', pe); if (pe > 0.5) q.handF = 'open'; if (!q.expr) q.expr = 'perplexe'; }
    if (ha > 0) {
      blend(q, 'armF_up', -0.3, ha); blend(q, 'armF_lo', -1.25, ha); blend(q, 'armB_up', -0.12, ha); blend(q, 'armB_lo', -1.05, ha);
      A.head = (A.head || 0) + 0.1 * ha; q.dy = (q.dy || 0) - 3 * ha; if (ha > 0.4) { q.handF = has(q.tenu) ? q.handF : 'open'; q.handB = 'open'; }
      if (!q.expr) q.expr = 'perplexe';
    }
    if (ap > 0) {
      const sep = 14 * (0.5 + 0.5 * Math.cos(t * TAU * 2.6));
      armTo(q, def, 'armF', [66 + sep, -100], 'bas', ap); armTo(q, def, 'armB', [62 - sep, -98], 'bas', ap);
      if (ap > 0.4) { q.handF = 'open'; q.handB = 'open'; }
    }
  };
  HOU.patient = wrap(CH.houPatient, HOU.patientPose, 0.9);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const ob = OBJ[name] || EXTRA[name];
    const def = accDef(name, (oo) => { const c = cx_(), b = vOf(ob.base, oo); c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o: Object.assign({ t: o.t || 0 }, ob.held && name !== 'tasse' ? ob.held : {}, o), tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  const EXTRA = {};
  HOU.canne = (x, y, s, o) => acc('canne', x, y, s, o);
  HOU.parapluie = (x, y, s, o) => acc('parapluie', x, y, s, o);
  HOU.camescope = (x, y, s, o) => acc('camescope', x, y, s, o);
  HOU.tasse = (x, y, s, o) => acc('tasse', x, y, s, Object.assign({ soucoupe: true }, o));
  HOU.soucoupe = (x, y, s, o) => acc('soucoupe', x, y, s, o);
  HOU.globe = (x, y, s, o) => acc('globe', x, y, s, o);
  HOU.cassette = (x, y, s, o) => { o = Object.assign({}, o); if (o.angle != null && o.rot == null) o.rot = o.angle; return acc('cassette', x, y, s, o); };
  HOU.drapeau = (x, y, s, o) => acc('drapeau', x, y, s, o);
  HOU.loupe = (x, y, s, o) => acc('loupe', x, y, s, o);

  // ---------------- téléviseur cathodique sur meuble bas + magnétoscope ; (0,0) = bas du meuble au sol
  const TELE = { ecran: { cx: 0, cy: -352, w: 400, h: 300 }, fente: [-50, -97], dessus: [0, -546], haut: 546, large: 520 };
  HOU.TELE = TELE;
  function drawTele(o) {
    pc([[-226, -12, 1], [-212, -12, 1], [-212, 0, 1], [-226, 0, 1]], '#3a2818', null, 8001); pc(box(212, -12, 226, 0), '#3a2818', null, 8002);
    pc(rrect(-258, -166, 258, -10, 6), '#5d402b', () => {
      fillPts(box(-236, -146, 236, -40), '#2a1d14');
      for (const y of [-160, -30, -20]) strokePts([[-250, y], [250, y + 1]], 'rgba(160,110,70,0.35)', 1.2);
      hatch(null, 0.15, 5, 0.2); strokePts([[-254, -164], [254, -164]], 'rgba(255,220,180,0.3)', 1.5);
    }, 8003);
    pc(rrect(-176, -118, 136, -74, 4), '#8e9197', () => {
      fillPts(box(-112, -103, 12, -91), '#18191b'); strokePts([[-110, -101], [10, -101]], 'rgba(255,255,255,0.12)', 1);
      fillPts(box(46, -110, 112, -96), '#1d2621'); fillPts(box(50, -107, 108, -99), 'rgba(120,200,150,0.22)');
      for (const x of [56, 70, 84, 98]) dot(x, -84, 2.6, '#5e6168');
      dot(-150, -84, 3.2, '#5e6168'); strokePts([[-172, -114], [132, -114]], 'rgba(255,255,255,0.35)', 1.3);
      hatch([[-176, -86], [136, -86], [136, -74], [-176, -74]], 0.4, 3, 0.2);
    }, 8004);
    const k = o.cassette;
    if (k != null && k < 0.999) {                                                  // cassette qui entre dans la fente (vue un peu plongeante)
      const d = (1 - clamp(k)) * 74;
      pc([[-112, -100, 1], [12, -100, 1], [12 + d * 0.3, -100 + d * 0.62, 1], [-112 + d * 0.3, -100 + d * 0.62, 1]], '#1d1c1e', () => { fillPts([[-96 + d * 0.15, -100 + d * 0.3], [-20 + d * 0.15, -100 + d * 0.3], [-20 + d * 0.25, -100 + d * 0.52], [-96 + d * 0.25, -100 + d * 0.52]], '#efece2'); }, 8005);
      if (d > 4) pc(box(-112 + d * 0.3, -100 + d * 0.62, 12 + d * 0.3, -88 + d * 0.62), '#2c2b2e', null, 8006);
    }
    pc([[226, -536, 1], [258, -514, 1], [258, -186, 1], [226, -170, 1]], '#2a2c31', () => { for (let y = -480; y < -200; y += 18) strokePts([[236, y], [258, y + 10]], 'rgba(255,255,255,0.08)', 1.2); }, 8007);
    pc(rrect(-232, -546, 232, -166, 24), '#3b3d43', () => {
      fillPts(rrect(-214, -526, 214, -184, 36), '#25272b');
      for (let x = -150; x <= 150; x += 10) strokePts([[x, -178], [x, -172]], 'rgba(0,0,0,0.45)', 1.6);
      dot(196, -176, 4.5, '#5a5d63'); dot(176, -176, 2.2, o.allume > 0.05 ? '#7fd08a' : '#a8322c');
      strokePts([[-226, -540], [226, -540]], 'rgba(255,255,255,0.2)', 1.4); hatch([[150, -546], [232, -546], [232, -166], [150, -166]], 0.9, 4, 0.2);
    }, 8008);
    fillPts(ecranPts(0), '#33403d');
  }
  function ecranPts(bulge) {
    const E = TELE.ecran, x0 = E.cx - E.w / 2, x1 = E.cx + E.w / 2, y0 = E.cy - E.h / 2, y1 = E.cy + E.h / 2, b = 7 + (bulge || 0);
    return qbez([x0 + 30, y0], [E.cx, y0 - b], [x1 - 30, y0], 8).concat(qbez([x1 - 30, y0], [x1 + 2, y0 - 2], [x1, y0 + 30], 4), qbez([x1, y0 + 30], [x1 + b, E.cy], [x1, y1 - 30], 8),
      qbez([x1, y1 - 30], [x1 + 2, y1 + 2], [x1 - 30, y1], 4), qbez([x1 - 30, y1], [E.cx, y1 + b], [x0 + 30, y1], 8), qbez([x0 + 30, y1], [x0 - 2, y1 + 2], [x0, y1 - 30], 4),
      qbez([x0, y1 - 30], [x0 - b, E.cy], [x0, y0 + 30], 8), qbez([x0, y0 + 30], [x0 - 2, y0 - 2], [x0 + 30, y0], 4));
  }
  EXTRA.tele = { draw: drawTele, base: [0, 0] };
  HOU.tele = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const dir = o.dir || 1, al = clamp(o.allume || 0), c = cx_(), t = o.t || 0;
    const r = acc('tele', x, y, s, o);
    const E = TELE.ecran, S = (p) => [x + p[0] * s * dir, y + p[1] * s], pts = ecranPts(0).map(S);
    const path = () => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
    const cx = x + E.cx * s * dir, cy = y + E.cy * s, w = E.w * s, h = E.h * s;
    if (al > 0.01) {                                                                // lueur bleutée autour de l'écran
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(cx, cy, w * 0.3, cx, cy, w * 0.85);
      g.addColorStop(0, `rgba(90,130,170,${0.22 * al})`); g.addColorStop(1, 'rgba(90,130,170,0)'); c.fillStyle = g; c.fillRect(cx - w, cy - w, 2 * w, 2 * w); c.restore();
    }
    c.save(); path(); c.clip();
    c.fillStyle = al > 0.01 ? M.mixc('#33403d', '#9db7c9', al) : '#33403d'; c.fillRect(cx - w, cy - h, 2 * w, 2 * h);
    if (al > 0.01 && o.draw) { c.save(); c.globalAlpha = al; o.draw(cx, cy, w, h); c.restore(); }
    if (al > 0.01) {
      c.fillStyle = `rgba(110,160,210,${0.16 * al})`; c.fillRect(cx - w, cy - h, 2 * w, 2 * h);
      c.fillStyle = `rgba(10,20,30,${0.13 * al})`; for (let yy = cy - h / 2 + ((t * 40) % 4) * s; yy < cy + h / 2; yy += 4 * s) c.fillRect(cx - w / 2 - 10, yy, w + 20, 1.6 * s);
      const fl = 0.04 * (0.5 + 0.5 * Math.sin(t * 37)) * al; c.fillStyle = `rgba(255,255,255,${fl})`; c.fillRect(cx - w, cy - h, 2 * w, 2 * h);
    }
    const v = c.createRadialGradient(cx, cy, h * 0.35, cx, cy, w * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); c.fillStyle = v; c.fillRect(cx - w, cy - h, 2 * w, 2 * h);
    c.globalCompositeOperation = 'screen'; const rg = c.createLinearGradient(cx - w / 2, cy - h / 2, cx, cy);
    rg.addColorStop(0, 'rgba(255,255,255,0.22)'); rg.addColorStop(0.5, 'rgba(255,255,255,0.05)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(cx - w, cy - h, 2 * w, 2 * h);
    c.restore();
    c.save(); path(); c.strokeStyle = 'rgba(10,10,12,0.8)'; c.lineWidth = 3 * s; c.stroke(); c.restore();
    r.ecran = { cx, cy, w, h }; r.fente = S(TELE.fente); r.dessus = S(TELE.dessus);
    return r;
  };

  // =====================================================================
  // DÉCORS
  // =====================================================================
  const W = 1080, BACK = 1395;
  function cables(xs, ytop) { const c = cx_(); c.save(); c.strokeStyle = 'rgba(20,15,10,0.6)'; c.lineWidth = 2; c.beginPath(); for (const x of xs) { c.moveTo(x, ytop); c.lineTo(x, -200); } c.stroke(); c.restore(); }
  // ---------------- hôpital : mur vert d'eau / ivoire, négatoscope (gauche), store vénitien, cloison vitrée (droite), potence
  const HOP = { negato: { x0: 140, y0: 560, x1: 360, y1: 840 }, vitre: { x0: 800, x1: 1080, y0: 300, y1: 1046 }, potence: { x: 1010 }, fenetre: { x0: 430, y0: 410, x1: 690, y1: 800 } };
  HOU.HOP = HOP;
  function ribs(c, x0, y0, x1, y1, on) {
    const cx = (x0 + x1) / 2, a = on ? 0.85 : 0.22;
    c.save(); c.lineCap = 'round'; c.strokeStyle = `rgba(235,245,250,${a})`;
    c.lineWidth = 6; c.beginPath(); c.moveTo(cx, y0 + 18); c.lineTo(cx, y1 - 12); c.stroke();
    c.lineWidth = 3.2;
    for (let i = 0; i < 8; i++) { const y = y0 + 40 + i * 22, w = 44 + Math.sin((i + 1) / 9 * PI) * 22; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(cx + sx * 4, y); c.quadraticCurveTo(cx + sx * w, y - 8, cx + sx * (w - 6), y + 18); c.stroke(); } }
    c.lineWidth = 4; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(cx + sx * 6, y0 + 30); c.quadraticCurveTo(cx + sx * 40, y0 + 18, cx + sx * 66, y0 + 30); c.stroke(); }
    if (on) { c.fillStyle = 'rgba(235,245,250,0.18)'; c.beginPath(); c.ellipse(cx + 14, y0 + 150, 26, 34, 0.3, 0, TAU); c.fill(); }
    c.restore();
  }
  function drawHopital(c) {
    pc(box(0, 100, W, 1400), '#bcd1c5', () => {
      for (let x = 20; x < W; x += 46) strokePts([[x, 100], [x, 1046]], 'rgba(255,255,255,0.10)', 2);
      fillPts(box(0, 1060, W, 1400), '#e3dbc7'); fillPts(box(0, 1042, W, 1064), '#8eac9d'); strokePts([[0, 1044], [W, 1044]], 'rgba(255,255,255,0.35)', 1.5);
      for (let x = 0; x < W; x += 120) strokePts([[x, 1066], [x, 1400]], 'rgba(120,110,90,0.18)', 1.2);
      fillPts(box(0, BACK - 30, W, BACK + 5), '#9fb4a8');
      hatch(box(0, 100, W, 1400), 0.8, 7, 0.07);
    }, 8101, { drop: false });
    const F = HOP.fenetre;                                                        // store vénitien
    pc(box(F.x0 - 14, F.y0 - 14, F.x1 + 14, F.y1 + 14), '#e9e6de', () => {
      fillPts(box(F.x0, F.y0, F.x1, F.y1), '#d7e3e6');
      for (let y = F.y0 + 4; y < F.y1; y += 17) { fillPts(box(F.x0, y, F.x1, y + 12), '#e6dfcd'); strokePts([[F.x0, y + 12], [F.x1, y + 12]], 'rgba(110,100,80,0.35)', 1.2); strokePts([[F.x0, y + 1], [F.x1, y + 1]], 'rgba(255,255,255,0.6)', 1); }
      for (const x of [F.x0 + 70, F.x1 - 70]) strokePts([[x, F.y0], [x, F.y1]], 'rgba(120,110,90,0.5)', 1.2);
      strokePts([[F.x1 - 30, F.y0], [F.x1 - 30, F.y1 + 60]], 'rgba(120,110,90,0.7)', 1.4); dot(F.x1 - 30, F.y1 + 64, 4, '#cfc6b0');
    }, 8102);
    const N = HOP.negato;                                                         // négatoscope (éteint)
    pc(box(N.x0, N.y0, N.x1, N.y1), '#d4d8d4', () => {
      fillPts(box(N.x0 + 14, N.y0 + 14, N.x1 - 14, N.y1 - 26), '#7b878b');
      fillPts(box(N.x0 + 34, N.y0 + 22, N.x1 - 34, N.y1 - 34), '#2a3237');
      ribs(c, N.x0 + 34, N.y0 + 22, N.x1 - 34, N.y1 - 34, false);
      fillPts(box(N.x0 + 34, N.y0 + 22, N.x1 - 34, N.y0 + 30), '#9aa5a9');
      dot(N.x1 - 30, N.y1 - 13, 4, '#6c7275'); strokePts([[N.x0 + 6, N.y0 + 4], [N.x1 - 6, N.y0 + 4]], 'rgba(255,255,255,0.5)', 1.4);
      hatch(box(N.x0, N.y1 - 26, N.x1, N.y1), 0.3, 3, 0.2);
    }, 8103);
    // cloison vitrée : montants métalliques, vitres découpées (transparentes : le couloir ou Hollywood passe derrière)
    const V = HOP.vitre;
    c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
    for (const [a, b] of [[V.x0 + 14, V.x0 + 96], [V.x0 + 110, V.x0 + 196], [V.x0 + 210, V.x1]]) c.fillRect(a, V.y0 + 16, b - a, V.y1 - V.y0 - 16);
    c.restore();
    c.fillStyle = 'rgba(205,228,232,0.16)'; c.fillRect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0);
    for (const x of [V.x0, V.x0 + 96, V.x0 + 196]) pc(box(x, V.y0, x + 14, BACK - 30), '#98a2a5', () => strokePts([[x + 3, V.y0], [x + 3, BACK - 30]], 'rgba(255,255,255,0.45)', 1.3), 8104 + x);
    pc(box(V.x0, V.y0, V.x1, V.y0 + 16), '#98a2a5', null, 8110); pc(box(V.x0, V.y1, V.x1, V.y1 + 18), '#98a2a5', null, 8111);
    c.save(); c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 6; for (const [x, y] of [[V.x0 + 30, 520], [V.x0 + 130, 700], [V.x0 + 230, 460]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 50, y - 90); c.stroke(); } c.restore();
    // potence à perfusion
    const px = HOP.potence.x;
    pc(box(px - 3, 690, px + 3, BACK - 18), '#a9b0b3', () => strokePts([[px - 1, 692], [px - 1, BACK - 20]], 'rgba(255,255,255,0.6)', 1), 8120);
    pc([[px - 40, BACK - 22], [px + 40, BACK - 22], [px + 44, BACK - 12, 1], [px - 44, BACK - 12, 1]], '#8b9295', null, 8121);
    for (const dx of [-38, 38]) pc(ell(px + dx, BACK - 8, 7, 7, 10), '#2c2e31', null, 8122 + dx);
    pc([[px - 30, 696], [px + 30, 696], [px + 30, 702], [px - 30, 702]], '#a9b0b3', null, 8124);
    pc([[px - 26, 706], [px - 6, 706], [px - 4, 760], [px - 16, 778], [px - 28, 760]], 'rgba(225,235,238,0.85)', () => fillPts([[px - 26, 736], [px - 6, 736], [px - 4, 760], [px - 16, 778], [px - 28, 760]], 'rgba(230,220,170,0.5)'), 8125);
    strokePts([[px - 16, 778], [px - 30, 900], [px - 60, 1080]], 'rgba(200,210,215,0.8)', 2);
  }
  function drawNegatoOn(c) {
    const N = HOP.negato, x0 = N.x0 + 14, y0 = N.y0 + 14;
    c.save(); c.translate(-x0 + 10, -y0 + 10);
    c.fillStyle = '#eaf3f5'; c.fillRect(x0, y0, N.x1 - N.x0 - 28, N.y1 - N.y0 - 40);
    c.fillStyle = '#34495a'; c.fillRect(N.x0 + 34, N.y0 + 22, N.x1 - N.x0 - 68, N.y1 - N.y0 - 56);
    ribs(c, N.x0 + 34, N.y0 + 22, N.x1 - 34, N.y1 - 34, true);
    c.restore();
  }
  function drawCouloir(c) {
    const V = HOP.vitre;
    c.fillStyle = '#d6dfd8'; c.fillRect(V.x0, V.y0, V.x1 - V.x0, BACK - V.y0);
    c.fillStyle = '#c3cec7'; c.fillRect(V.x0, 960, V.x1 - V.x0, BACK - 960);
    c.fillStyle = '#e9eee6'; c.fillRect(V.x0, V.y0, V.x1 - V.x0, 40);
    c.fillStyle = '#b4c2bb'; c.fillRect(V.x0 + 120, 560, 110, 400); c.fillStyle = '#9fb0a8'; c.fillRect(V.x0 + 130, 570, 90, 390); c.fillStyle = '#d9d2b8'; c.fillRect(V.x0 + 206, 760, 8, 16);
    c.fillStyle = 'rgba(255,255,240,0.5)'; c.fillRect(V.x0 + 20, V.y0 + 50, 200, 10);
  }
  // ---------------- lit d'hôpital (profil, tête à droite) ; (0,0) = sol sous le milieu du lit
  const LIT = { long: 500, matelas: -160, tete: 236, pied: -236, place: 120, bord: -150, hauteur: 290 };
  HOU.LIT = LIT;
  function drawLitFond() {
    for (const x of [-222, 222]) { pc(box(x - 5, -112, x + 5, -18), '#9aa2a6', null, 8201 + x); pc(ell(x, -12, 12, 12, 12), '#2b2d30', () => dot(x, -12, 4, '#8b9195'), 8203 + x); }
    pc(box(-150, -70, 150, -62), '#9aa2a6', null, 8205);
    pc(box(236, -292, 252, -104), '#a7aeb2', () => { fillPts(box(240, -280, 248, -116), '#cfd6d8'); strokePts([[238, -290], [238, -106]], 'rgba(255,255,255,0.6)', 1.3); }, 8206);
    pc(box(-252, -196, -236, -104), '#a7aeb2', () => { fillPts(box(-248, -186, -240, -112), '#cfd6d8'); strokePts([[-250, -194], [-250, -106]], 'rgba(255,255,255,0.6)', 1.3); }, 8207);
    pc(box(-246, -124, 246, -104), '#9aa2a6', () => strokePts([[-244, -121], [244, -121]], 'rgba(255,255,255,0.5)', 1.3), 8208);
    pc(rrect(-240, -164, 238, -122, 10), '#efeee8', () => { fillPts(box(-240, -132, 238, -122), '#cfd8dc'); for (const x of [-160, -40, 80]) strokePts([[x, -160], [x + 10, -126]], 'rgba(120,140,150,0.25)', 1.2); hatch(null, 0.2, 5, 0.1); }, 8209);
    pc([[150, -196], [226, -194], [234, -180], [230, -162], [150, -162], [142, -178]], '#f4f2ec', () => strokePts([[160, -188], [222, -186]], 'rgba(140,150,160,0.35)', 1.2), 8210);
  }
  function drawLitBarriere() {
    for (const y of [-212, -188]) pc(box(30, y, 222, y + 8), '#b6bdc0', () => strokePts([[32, y + 2], [220, y + 2]], 'rgba(255,255,255,0.6)', 1.1), 8301 + y);
    for (const x of [40, 212]) pc(box(x - 4, -212, x + 4, -122), '#a7aeb2', null, 8305 + x);
  }
  function drawLitDrap() {
    pc([[-240, -150], [-236, -176], [-212, -186], [-196, -178], [-150, -170], [-60, -174], [20, -176], [96, -172], [100, -150], [100, -118], [-240, -118]], '#dfe7ea', () => {
      for (const [a, b] of [[[-200, -170], [-150, -130]], [[-100, -168], [-60, -128]], [[0, -170], [30, -130]]]) strokePts([a, [(a[0] + b[0]) / 2 + 10, (a[1] + b[1]) / 2], b], 'rgba(110,130,145,0.35)', 1.3);
      fillPts(box(-240, -134, 100, -118), '#a9bfcb'); hatch(null, 0.3, 4.4, 0.14);
    }, 8310);
  }
  // ---------------- bureau du producteur : mur crème, baie vitrée (palmiers, collines dorées), fauteuil de cuir, plante ; bureau (table) à part
  const BUR = { baie: { x0: 470, y0: 380, x1: 960, y1: 1000 }, table: { x: 800, dessus: 1170, x0: 640, x1: 960 }, plante: { x: 175 } };
  HOU.BUREAU = BUR;
  function palmSil(c, x, y, h, col) {
    c.save(); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + h * 0.08, y - h * 0.5, x + h * 0.04, y - h); c.stroke();
    for (let i = 0; i < 7; i++) { const a = -PI + i * PI / 6 + 0.1; c.beginPath(); c.moveTo(x + h * 0.04, y - h); c.quadraticCurveTo(x + h * 0.04 + Math.cos(a) * h * 0.25, y - h - 30, x + h * 0.04 + Math.cos(a) * h * 0.38, y - h + Math.abs(Math.cos(a)) * 40 + 20); c.lineWidth = 9; c.stroke(); }
    c.restore();
  }
  function drawBureau(c) {
    pc(box(0, 100, W, 1400), '#e6d9bb', () => {
      for (let x = 30; x < W; x += 60) strokePts([[x, 100], [x, BACK - 40]], 'rgba(170,140,90,0.12)', 3);
      fillPts(box(0, BACK - 40, W, BACK + 5), '#7b5638'); strokePts([[0, BACK - 40], [W, BACK - 40]], 'rgba(255,230,190,0.35)', 1.4);
      hatch(box(0, 100, W, 1400), 0.8, 7, 0.06);
    }, 8401, { drop: false });
    const B = BUR.baie;
    pc(box(B.x0 - 18, B.y0 - 18, B.x1 + 18, B.y1 + 26), '#efe9da', null, 8402);
    c.save(); c.beginPath(); c.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); c.clip();
    const g = c.createLinearGradient(0, B.y0, 0, B.y1); g.addColorStop(0, '#9fb8c8'); g.addColorStop(0.55, '#e6cf98'); g.addColorStop(1, '#e3b56a'); c.fillStyle = g; c.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    c.fillStyle = 'rgba(255,240,200,0.8)'; c.beginPath(); c.arc(B.x0 + 330, B.y0 + 330, 36, 0, TAU); c.fill();
    for (const [yy, col, amp] of [[760, '#c9a052', 60], [840, '#b38a3c', 45], [920, '#9a7434', 30]]) { c.fillStyle = col; c.beginPath(); c.moveTo(B.x0, B.y1); for (let x = B.x0; x <= B.x1; x += 20) c.lineTo(x, yy - amp * (0.5 + 0.5 * Math.sin(x * 0.012 + yy))); c.lineTo(B.x1, B.y1); c.closePath(); c.fill(); }
    for (const [x, h] of [[B.x0 + 60, 380], [B.x0 + 150, 300], [B.x0 + 410, 420]]) palmSil(c, x, B.y1, h, '#4b5636');
    c.restore();
    for (const x of [B.x0 + 160, B.x0 + 330]) pc(box(x - 6, B.y0, x + 6, B.y1), '#efe9da', null, 8403 + x);
    pc(box(B.x0 - 30, B.y1 + 10, B.x1 + 30, B.y1 + 30), '#d9cfb8', null, 8406);
    // fauteuil de cuir (dossier derrière la table)
    pc(box(816, 1176, 826, 1352), '#2b2d31', null, 8408); pc([[752, 1352], [890, 1352], [896, 1366, 1], [746, 1366, 1]], '#2b2d31', null, 8409);
    for (const x of [756, 821, 886]) pc(ell(x, 1374, 8, 8, 10), '#1c1d20', null, 8411 + x);
    pc(rrect(742, 1140, 900, 1184, 12), '#4d2c1e', () => strokePts([[748, 1146], [894, 1146]], 'rgba(255,200,160,0.3)', 2), 8412);
    pc([[766, 1150], [762, 952], [774, 912], [800, 898], [846, 898], [870, 912], [880, 952], [876, 1150]], '#5b3524', () => { for (const x of [794, 822, 850]) for (const y of [950, 1000, 1050, 1100]) dot(x, y, 3, '#3f2418'); for (const x of [794, 822, 850]) strokePts([[x, 930], [x, 1130]], 'rgba(40,20,10,0.25)', 1.2); strokePts([[776, 914], [868, 914]], 'rgba(255,200,160,0.3)', 2); hatch(null, 0.6, 4, 0.25); }, 8407);
    // plante en pot
    const px = BUR.plante.x;
    for (let i = 0; i < 11; i++) { const sd = (i - 5) / 5, L = 170 + 70 * hash(i + 3), x1 = px + sd * 120, y1 = 1260 - L * (1 - 0.55 * Math.abs(sd)); const sp = qbez([px + sd * 6, 1256], [px + sd * 40, 1260 - L * 1.05], [x1, y1], 8); pc(ribbon(sp, 12, 3), i % 2 ? '#5f6e45' : '#4e5c39', () => strokePts(sp, 'rgba(220,230,180,0.3)', 1.2), 8430 + i); }
    pc([[px - 46, 1250, 1], [px + 46, 1250, 1], [px + 36, BACK - 2, 1], [px - 36, BACK - 2, 1]], '#a65f3c', () => { fillPts(box(px - 48, 1250, px + 48, 1268), '#8d4d30'); hatch(null, 0.4, 4, 0.2); }, 8420);
  }
  function drawTable(c) {                                                      // origine = sol sous le milieu de la table
    pc(box(-160, -226, 160, -206), '#8a5d3a', () => { strokePts([[-158, -224], [158, -224]], 'rgba(255,220,180,0.4)', 1.4); hatch(null, 0.1, 4, 0.2); }, 8501);
    pc(box(-150, -206, 150, -6), '#6e4a2e', () => {
      for (const y of [-180, -120, -60]) { strokePts([[-140, y], [140, y]], 'rgba(30,15,8,0.5)', 1.3); dot(0, y - 14, 4, OR); }
      hatch(null, 0.15, 5, 0.22); shade(150, 0, -150, 0, 0.25, [-152, -208, 152, -4]);
    }, 8502);
    for (let i = 0; i < 3; i++) {                                                  // piles de photos de candidats (visages simples, aucune écriture)
      const x0 = -120 + i * 86, n = 4 + i;
      for (let k = 0; k < n; k++) pc(box(x0 - 2 + (k % 2) * 3, -232 - k * 5, x0 + 58 + (k % 2) * 3, -226 - k * 5), '#f1ece0', null, 8510 + i * 10 + k, { drop: k === 0 });
      const yt = -232 - n * 5;
      pc(box(x0 + 2, yt - 54, x0 + 54, yt), '#f3eee2', () => { fillPts(box(x0 + 6, yt - 50, x0 + 50, yt - 4), ['#9fb0bd', '#c4b08a', '#a9b89a'][i]); dot(x0 + 28, yt - 32, 9, '#e0c2a2'); fillPts([[x0 + 12, yt - 4], [x0 + 18, yt - 18], [x0 + 38, yt - 18], [x0 + 44, yt - 4]], ['#4a4d55', '#7a2e34', '#5f6e45'][i]); fillPts(ell(x0 + 28, yt - 40, 10, 5, 10), ['#3a2a20', '#b5562a', '#d9cfb8'][i]); }, 8540 + i);
    }
  }
  // ---------------- palmier de carton (Hollywood) ; (0,0) = pied
  function drawPalmier(c) {
    const tr = qbez([0, 0], [30, -420], [10, -800], 14);
    pc(ribbon(tr, 46, 26), '#8a6a44', () => { for (let i = 1; i < 14; i++) { const p = tr[i]; strokePts([[p[0] - 22, p[1] + 6], [p[0], p[1] - 4], [p[0] + 22, p[1] + 6]], 'rgba(60,40,20,0.5)', 1.6); } hatch(null, 0.9, 4.2, 0.22); }, 8601);
    const top = [10, -800];
    for (let i = 0; i < 8; i++) {
      const a = -PI + 0.15 + i * (PI - 0.3) / 7, L = 240 + 40 * hash(i * 7), tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * 0.3 + 170 * Math.abs(Math.cos(a))];
      const mid = [top[0] + Math.cos(a) * L * 0.5, top[1] + Math.sin(a) * L * 0.5 - 50];
      const spine = qbez(top, mid, tip, 10), up = [], dn = [];
      for (let k = 0; k <= 10; k++) { const p = spine[k], u = k / 10, w = 20 * Math.sin(u * PI) + 3; const q2 = spine[Math.min(10, k + 1)], q1 = spine[Math.max(0, k - 1)], dx = q2[0] - q1[0], dy = q2[1] - q1[1], l = Math.hypot(dx, dy) || 1; up.push([p[0] + dy / l * w * 0.4, p[1] - dx / l * w * 0.4]); dn.push([p[0] - dy / l * w + (k % 2 ? 6 : 0), p[1] + dx / l * w, k % 2]); }
      pc(up.concat(dn.reverse()), i % 2 ? '#5f6e45' : '#4f5d3a', () => strokePts(spine, 'rgba(220,230,170,0.35)', 1.6), 8610 + i);
    }
    for (const [dx, dy] of [[-10, -786], [12, -780], [2, -770]]) pc(ell(dx, dy, 12, 12, 10), '#5a3e22', null, 8630 + dx);
  }
  HOU.init = function () {
    const K = (HOU.K = {});
    K.hopital = M.pre(W, 1400, (c) => drawHopital(c));
    K.couloir = M.pre(W, 1400, (c) => drawCouloir(c));
    const N = HOP.negato; K.negatoOn = M.pre(N.x1 - N.x0, N.y1 - N.y0, (c) => drawNegatoOn(c));
    K.litFond = M.withShadow(M.cutFlat(560, 330, 280, 320, () => drawLitFond()), 8); K.litFond.padB = 10;
    K.litBarriere = M.cutFlat(560, 330, 280, 320, () => drawLitBarriere()); K.litBarriere.padB = 10;
    K.litDrap = M.cutFlat(560, 330, 280, 320, () => drawLitDrap()); K.litDrap.padB = 10;
    K.bureau = M.pre(W, 1400, (c) => drawBureau(c));
    K.table = M.withShadow(M.cutFlat(360, 330, 180, 320, (c) => drawTable(c)), 8); K.table.padB = 10;
    K.palmier = M.withShadow(M.cutFlat(620, 1000, 300, 990, (c) => drawPalmier(c)), 8); K.palmier.padB = 10;
    return K;
  };
  // hôpital : up = remontée vers les cintres (0 = en place) ; o.negato 0..1 ; o.couloir (true) ; o.derriere(t) dessiné derrière les vitres ; o.lit (false) : pose HOU.lit à x 760
  HOU.hopital = function (t, up, o) {
    o = o || {}; up = up || 0; const K = HOU.K, c = cx_();
    if (o.derriere) o.derriere(t);
    const sc = o.scale || 1, x = o.x != null ? o.x : 540, y = o.y != null ? o.y : BACK;
    c.save(); c.translate(x, y - up); c.scale(sc, sc); c.translate(-540, -BACK);
    if (up > 0) cables([140, 940], 150);
    if (o.couloir !== false) c.drawImage(K.couloir, 0, 0);
    c.drawImage(K.hopital, 0, 0);
    const n = clamp(o.negato || 0), N = HOP.negato;
    if (n > 0.01) {
      c.save(); c.globalAlpha = n; c.drawImage(K.negatoOn, N.x0 + 4, N.y0 + 4); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient((N.x0 + N.x1) / 2, (N.y0 + N.y1) / 2, 40, (N.x0 + N.x1) / 2, (N.y0 + N.y1) / 2, 260); g.addColorStop(0, 'rgba(160,200,220,0.30)'); g.addColorStop(1, 'rgba(160,200,220,0)');
      c.fillStyle = g; c.fillRect(N.x0 - 200, N.y0 - 200, N.x1 - N.x0 + 400, N.y1 - N.y0 + 400); c.restore();
    }
    if (o.lit) HOU.lit(LIT.x || 760, BACK + 10, 1, { cast: o.cast });
    c.restore();
  };
  // lit : (x,y) = sol sous le milieu ; o.partie 'tout' (défaut) | 'fond' | 'devant' (barrière + drap, à dessiner APRÈS la marionnette) ; o.drap (false) ; o.dir
  HOU.lit = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const pa = o.partie || 'tout', c = cx_(), d = o.dir || 1;
    c.save(); c.translate(x, y); c.scale(d, 1); c.translate(-x, -y);
    if (pa !== 'devant') M.flat(HOU.K.litFond, x, y, { scale: s, cast: o.cast || { dx: 16, dy: 6, a: 0.3 } });
    if (pa !== 'fond') { if (o.drap) M.flat(HOU.K.litDrap, x, y, { scale: s }); M.flat(HOU.K.litBarriere, x, y, { scale: s }); }
    c.restore();
    return { assise: y + LIT.matelas * s, place: x + LIT.place * s * d, bord: x + LIT.bord * s * d };
  };
  // bureau : up = remontée ; o.table (true) ; o.x/o.y/o.scale pour une vignette (réduction autour de (x, y) = milieu du bas)
  HOU.bureau = function (t, up, o) {
    o = o || {}; up = up || 0; const K = HOU.K, c = cx_(), sc = o.scale || 1, x = o.x != null ? o.x : 540, y = o.y != null ? o.y : BACK;
    c.save(); c.translate(x, y - up); c.scale(sc, sc); c.translate(-540, -BACK);
    if (up > 0) cables([140, 940], 150);
    c.drawImage(K.bureau, 0, 0);
    if (o.table !== false) M.flat(K.table, BUR.table.x, BACK, { cast: { dx: 16, dy: 6, a: 0.3 } });
    c.restore();
  };
  HOU.bureauTable = function (up, o) { o = o || {}; M.flat(HOU.K.table, o.x != null ? o.x : BUR.table.x, BACK - (up || 0), { scale: o.scale, cast: { dx: 16, dy: 6, a: 0.3 } }); };
  // palmiers de carton : up = hauteur au-dessus de leur place (descente des cintres) ; o.xs ([190, 890]) ; o.scale (0.9)
  HOU.palmiers = function (t, up, o) {
    o = o || {}; up = up || 0; const xs = o.xs || [190, 890], sc = o.scale || 0.9, c = cx_();
    xs.forEach((x, i) => {
      const yb = BACK - up, r = 0.012 * Math.sin(t * 0.8 + i * 1.7);
      if (up > 0) cables([x + 10 * sc], yb - 980 * sc);
      c.save(); if (i % 2) { c.translate(x, 0); c.scale(-1, 1); c.translate(-x, 0); }
      M.flat(HOU.K.palmier, x, yb, { scale: sc, rot: r, cast: { dx: 18, dy: 8, a: 0.3 }, clipY: up > 0 ? null : BACK + 1 });
      c.restore();
    });
  };
  // projecteurs d'avant-première : k 0..1 (intensité) ; faisceaux croisés qui balaient ; o.xs ([300, 780]) ; o.y (BACK)
  HOU.projecteurs = function (t, k, o) {
    o = o || {}; k = clamp(k == null ? 1 : k); if (k <= 0.01) return; const xs = o.xs || [300, 780], yb = o.y || BACK, c = cx_();
    c.save(); c.globalCompositeOperation = 'lighter';
    xs.forEach((x, i) => {
      const a = (i % 2 ? 0.35 : -0.35) + 0.28 * Math.sin(t * 0.9 + i * 2.2), L = 1500, w0 = 18, w1 = 150;
      const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
      const g = c.createLinearGradient(x, yb, x + dx * L, yb + dy * L); g.addColorStop(0, `rgba(255,240,200,${0.16 * k})`); g.addColorStop(0.25, `rgba(255,240,200,${0.3 * k})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(x + nx * w0, yb + ny * w0); c.lineTo(x + dx * L + nx * w1, yb + dy * L + ny * w1); c.lineTo(x + dx * L - nx * w1, yb + dy * L - ny * w1); c.lineTo(x - nx * w0, yb - ny * w0); c.closePath(); c.fill();
    });
    c.restore();
    xs.forEach((x, i) => {                                                          // projecteurs de carton au pied des faisceaux
      const a = (i % 2 ? 0.35 : -0.35) + 0.28 * Math.sin(t * 0.9 + i * 2.2);
      c.save(); c.translate(x, yb - 20); c.rotate(a);
      pc([[-22, 16], [22, 16], [26, -40, 1], [-26, -40, 1]], '#3b3d43', () => { fillPts(ell(0, -40, 26, 8, 12), '#f2e6c0'); hatch(null, 0.9, 3.6, 0.25); }, 8701 + i);
      c.restore();
      pc([[x - 30, yb - 6], [x + 30, yb - 6], [x + 36, yb + 4, 1], [x - 36, yb + 4, 1]], '#2a2c31', null, 8710 + i);
    });
  };
})();
