// persos.js — « Le paris-brest, le gâteau en forme de roue » : Giffard, Durand, le coureur Terront (debout, assis, à vélo), le vélo, le paris-brest, le journal illustré, la devanture de la pâtisserie Durand. Espace M.pbr (alias PBR). Appeler PBR.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo. Déterministe (aucun Math.random).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const PBR = (M.pbr = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
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
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const k01 = (v) => ease(clamp(v || 0));
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const has = (v) => v && v !== 'rien';
  // trait épais en unités locales (suit l'échelle), silhouette comprise
  function tube(a, b, w, col, seed) { pc(ribbon([a, b], w, w), col, null, seed || 0, { drop: false }); }
  PBR.geo = { ep, ell, ribbon, qbez, box };

  // ------------------------------------------------------------ bras et jambes à articulations rondes
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  const TH = 116, SHN = 108, HIP = 238;                                        // cuisse, tibia ; hanche à 238 au-dessus des pieds
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const legC = (len, wt, rk) => ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.5], [rk + 0.5, len - 4]], ep(0, len, rk, rk, 10, 0, PI), [[-rk - 0.5, len - 4], [-wt + 1, len * 0.5]]);
  // tibia à mollet galbé (le mollet est derrière, côté −x)
  const shinCalf = (len, kt, ak, g) => ep(0, 0, kt, kt, 10, PI, TAU).concat([[kt - 1, len * 0.3], [ak + 2.5, len * 0.74], [ak + 0.5, len - 4]], ep(0, len, ak, ak, 10, 0, PI),
    [[-ak - 1, len - 6], [-ak - 3, len * 0.8], [-kt - g * 0.55, len * 0.6], [-kt - g, len * 0.4], [-kt - g * 0.75, len * 0.22], [-kt + 1, 5]]);
  const FOOT = (ak, len) => ep(0, 0, ak, ak, 8, PI, TAU).concat([[ak + 2, 2], [len * 0.62, 4], [len * 0.92, 8], [len, 14, 1], [-15, 16, 1], [-15, 6]]);
  // IK deux segments (bras) dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant', 'arriere'
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const sc = pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1];
      if (!best || sc > best.sc) best = { a: normA(a), b: normA(cAbs - a), sc };
    }
    return best;
  }
  // IK jambe : genou toujours devant
  function ikL(H, T, L1, L2) {
    const vx = T[0] - H[0], vy = T[1] - H[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, K = [H[0] - L1 * Math.sin(a), H[1] + L1 * Math.cos(a)];
      const bAbs = Math.atan2(-(T[0] - K[0]), T[1] - K[1]);
      if (!best || K[0] > best.sc) best = { a: normA(a), b: normA(bAbs - a), sc: K[0] };
    }
    return best;
  }

  // =====================================================================
  // LE PARIS-BREST — anneau de pâte à choux, crème pralinée en festons, amandes effilées, sucre glace
  // repère : centre de l'anneau (0,0) ; R extérieur 122 (= roue du vélo), trou 50
  // =====================================================================
  const PB = { R: 122, r: 50, dore: '#c58a3c', doreL: '#e2b062', doreD: '#93602a', creme: '#d9b07a', cremeL: '#ecd2a4', cremeD: '#b48650', amande: '#f3ead2', sucre: 'rgba(255,253,246,0.85)' };
  PBR.GATEAU = PB;
  // o.etat 'choux'|'creme'|'amandes' ; o.incl 0 = debout (face, anneau rond) … 1 = plat (vu de trois quarts) ; o.croque 0..1 ; o.croqueA (rad, défaut haut) ; o.moitie 'avant'|'arriere' (collier)
  function drawGateau(o) {
    o = o || {};
    const c = cx_(), etat = o.etat || 'amandes', inc = clamp(o.incl != null ? o.incl : (o.vue === 'plat' ? 1 : 0));
    const R = PB.R, r = PB.r, sq = o.sq != null ? o.sq : lerp(1, 0.36, inc), H = o.H != null ? o.H : lerp(0, 46, inc);          // aplatissement, épaisseur visible
    const crq = clamp(o.croque || 0), cA = o.croqueA != null ? o.croqueA : -PI / 2;
    const cream = etat !== 'choux', alm = etat === 'amandes';
    const bump = (a, k, n) => 1 - k * (0.5 + 0.25 * Math.sin(a * n + 0.7) + 0.15 * Math.sin(a * (n + 4) + 1.9) + 0.1 * Math.sin(a * (2 * n + 1) + 0.4));
    const ring = (rad, k, n, dy, m) => { const o2 = []; m = m || 64; for (let i = 0; i < m; i++) { const a = i / m * TAU, rr = rad * bump(a, k, n); o2.push([Math.cos(a) * rr, Math.sin(a) * rr * sq + dy]); } return o2; };
    c.save();
    if (crq > 0) {                                                                       // bouchée : disque retiré au bord, en arc
      const bx = Math.cos(cA) * R * 0.98, by = Math.sin(cA) * R * 0.98 * sq - (inc > 0.5 ? H * 0.5 : 0), br = lerp(10, 46, crq);
      c.beginPath(); c.rect(-400, -400, 800, 800);
      for (let i = 0; i <= 18; i++) { const a = i / 18 * TAU, rr = br * (1 + 0.1 * Math.sin(a * 7)); if (i === 0) c.moveTo(bx + rr, by); else c.lineTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr); }
      c.closePath(); c.clip('evenodd');
    }
    if (o.moitie) { c.beginPath(); if (o.moitie === 'avant') c.rect(-400, -2, 800, 400); else c.rect(-400, -400, 800, 402); c.clip(); }
    // 1) moitié du bas (bande dorée) visible quand on incline
    if (H > 2) {
      const outer = ring(R, 0.05, 9, H * 0.5), top = ring(R, 0.05, 9, -H * 0.5);
      const band = top.slice(0, 33).concat(outer.slice(0, 33).reverse());
      pc(outer, PB.doreD, () => { shade(0, -R * sq, 0, R * sq + H, 0.3, [-R - 10, -R - 10, R + 10, R + H + 10]); }, 7102);
      pc(band, PB.dore, () => { hatch(null, 1.1, 4.2, 0.22, 1, P.encre, [-R, -R, R, R + H]); }, 7103, { drop: false });
    }
    // 2) crème en festons (dépasse de la moitié du haut, et bande au milieu quand on incline)
    if (cream) {
      const fest = [];
      for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; fest.push([Math.cos(a) * (R - 14), Math.sin(a) * (R - 14) * sq - H * 0.3, a]); }
      const fe = (x, y, rr, col) => { const ky = lerp(1, 0.78, inc); pc(ell(x, y, rr, rr * ky, 12), col, () => { strokePts(ep(x + rr * 0.1, y, rr * 0.55, rr * 0.55 * ky, 9, -0.5, 4.2), 'rgba(120,75,35,0.55)', 1.2); dot(x - rr * 0.3, y - rr * 0.35 * ky, rr * 0.22, 'rgba(255,240,215,0.75)'); }, 7110 + Math.round(x * 3 + y), { drop: false, texA: 0.4 }); };
      for (const f of fest) if (Math.sin(f[2]) < 0.15 || inc < 0.3) fe(f[0], f[1], 14, PB.creme);
      if (H > 2) { for (let i = 0; i < 22; i++) { const a = PI * (i + 0.5) / 22; fe(Math.cos(a) * (R - 12), Math.sin(a) * (R - 12) * sq + H * 0.04, 12, PB.creme); } }
      if (inc < 0.6) for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; fe(Math.cos(a) * (r + 2), Math.sin(a) * (r + 2) * sq - H * 0.5, 9, PB.creme); }
    }
    // 3) moitié du haut : anneau doré bosselé (trou au centre)
    const Rt = cream ? R * 0.86 : R, out = ring(Rt, 0.09, 9, -H * 0.5, 72), inn = ring(r * (cream ? 1.12 : 1), -0.06, 7, -H * 0.5, 40);
    if (SIL()) { c.beginPath(); for (const pp of [out, inn]) { pp.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); } c.fillStyle = '#000'; c.fill('evenodd'); }
    else {
      const trace = () => { c.beginPath(); for (const pp of [out, inn]) { pp.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); } };
      c.save(); c.translate(2.6 * M._lw(), 3.6 * M._lw()); trace(); c.fillStyle = 'rgba(16,9,5,0.3)'; c.fill('evenodd'); c.restore();
      trace(); c.lineJoin = 'round'; c.lineWidth = 6.6 * M._lw(); c.strokeStyle = 'rgba(34,22,14,0.8)'; c.stroke(); c.lineWidth = 4.4 * M._lw(); c.strokeStyle = P.edge; c.stroke();
      c.fillStyle = PB.dore; c.fill('evenodd');
      c.save(); trace(); c.clip('evenodd');
      const gr = c.createRadialGradient(-R * 0.3, -R * 0.4 * sq - H * 0.5, 10, 0, -H * 0.5, R * 1.1);
      gr.addColorStop(0, 'rgba(250,215,140,0.55)'); gr.addColorStop(1, 'rgba(120,70,20,0.25)'); c.fillStyle = gr; c.fillRect(-R - 10, -R - H - 10, 2 * R + 20, 2 * R + 2 * H + 20);
      for (let i = 0; i < 18; i++) {                                                     // bosses : reflets dorés et creux
        const a = i / 18 * TAU + 0.2, rr = lerp(r, Rt, 0.55 + 0.2 * Math.sin(i * 2.3));
        const bx = Math.cos(a) * rr, by = Math.sin(a) * rr * sq - H * 0.5;
        dot(bx - 4, by - 4 * sq, 13, 'rgba(255,224,150,0.35)'); strokePts(ep(bx, by, 16, 13 * sq, 6, 0.2, 2.6), 'rgba(110,60,20,0.35)', 1.2);
      }
      hatch(null, 0.9, 4.5, 0.16, 1, P.encre, [-R, -R - H, R, R]);
      if (alm) {                                                                         // amandes effilées + sucre glace
        for (let i = 0; i < 46; i++) {
          const a = hash(i * 3.7 + 1) * TAU, rr = lerp(r + 8, Rt - 8, hash(i * 5.3 + 2)), bx = Math.cos(a) * rr, by = Math.sin(a) * rr * sq - H * 0.5;
          const ang = hash(i * 9.1) * PI, L = 9, W = 3.4;
          const p = [[bx + Math.cos(ang) * L, by + Math.sin(ang) * L * sq], [bx + Math.cos(ang + 1.57) * W, by + Math.sin(ang + 1.57) * W * sq], [bx - Math.cos(ang) * L, by - Math.sin(ang) * L * sq], [bx - Math.cos(ang + 1.57) * W, by - Math.sin(ang + 1.57) * W * sq]];
          fillPts(p, PB.amande, 0, 0); strokePts([p[0], p[2]], 'rgba(170,130,80,0.55)', 0.8);
        }
        for (let i = 0; i < 60; i++) { const a = hash(i * 1.3 + 7) * TAU, rr = lerp(r + 2, Rt - 2, hash(i * 2.9 + 3)); dot(Math.cos(a) * rr, Math.sin(a) * rr * sq - H * 0.5, 1.6, PB.sucre); }
      }
      c.restore();
      if (H > 2) {                                                                       // paroi intérieure du trou vue au loin
        c.save(); M.path(inn, 7121, 0); c.clip(); fillPts(box(-R, -R - H, R, R + H), '#6e4520');
        const wall = ep(0, -H * 0.5, r * 1.1, r * 1.1 * sq, 16, PI, TAU).concat(ep(0, H * 0.5, r * 1.1, r * 1.1 * sq, 16, TAU, PI));
        fillPts(wall, PB.doreD); c.restore();
      }
    }
    if (crq > 0 && !SIL()) {                                                             // bord de la bouchée : crème et mie
      const bx = Math.cos(cA) * R * 0.98, by = Math.sin(cA) * R * 0.98 * sq - (inc > 0.5 ? H * 0.5 : 0), br = lerp(10, 46, crq);
      c.save(); c.beginPath(); c.ellipse(0, -H * 0.5, R - 2, (R - 2) * sq + H * 0.5, 0, 0, TAU); c.clip();
      c.beginPath(); c.arc(bx, by, br + 4, 0, TAU); c.lineWidth = 7; c.strokeStyle = PB.cremeL; c.stroke();
      c.beginPath(); c.arc(bx, by, br + 1, 0, TAU); c.lineWidth = 2; c.strokeStyle = 'rgba(120,80,40,0.7)'; c.stroke(); c.restore();
    }
    c.restore();
  }
  PBR.drawGateau = drawGateau;

  // =====================================================================
  // JOURNAL ILLUSTRÉ (1891) — ivoire, gravure en couleurs en une (cycliste, ciel ocre), colonnes en traits gris, AUCUNE lettre
  // =====================================================================
  const JO = { papier: '#ece3cc', papierD: '#d6cbb0', trait: 'rgba(60,55,50,0.55)', ciel: '#d9a85a', cielL: '#ecc985', sol: '#a9a07a', encre: '#1d1714' };
  // gravure : un cycliste sur sa bicyclette, dans le rectangle (x0,y0,w,h)
  function gravure(x0, y0, w, h) {
    if (SIL()) return;
    const c = cx_(); c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
    const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, JO.cielL); g.addColorStop(0.7, JO.ciel); g.addColorStop(1, '#c08a45');
    c.fillStyle = g; c.fillRect(x0, y0, w, h);
    const k = Math.min(w / 200, h / 140), cx = x0 + w * 0.5, gy = y0 + h * 0.86;
    fillPts([[x0, gy], [x0 + w, gy - 4 * k], [x0 + w, y0 + h], [x0, y0 + h]], JO.sol, 0, 0);
    for (let i = 0; i < 7; i++) strokePts([[x0 + w * (0.05 + i * 0.14), gy + 6 * k], [x0 + w * (0.1 + i * 0.14), gy + 6 * k]], 'rgba(40,30,20,0.5)', 1);
    // collines et arbres au loin
    fillPts([[x0, gy - 14 * k], [x0 + w * 0.25, gy - 30 * k], [x0 + w * 0.5, gy - 18 * k], [x0 + w * 0.8, gy - 34 * k], [x0 + w, gy - 20 * k], [x0 + w, gy], [x0, gy]], 'rgba(120,110,70,0.55)', 0, 0);
    dot(x0 + w * 0.82, y0 + h * 0.22, 13 * k, 'rgba(250,230,170,0.9)');
    const L = (pts, lw) => strokePts(pts.map((p) => [cx + p[0] * k, gy + p[1] * k]), JO.encre, (lw || 1.6) * k);
    const C = (x, y, r, lw) => { const pts = ell(cx + x * k, gy + y * k, r * k, r * k, 22); strokePts(pts.concat([pts[0]]), JO.encre, (lw || 1.6) * k); };
    C(-46, -26, 26, 2.6); C(46, -26, 26, 2.6); C(-46, -26, 4); C(46, -26, 4);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI; L([[-46 + Math.cos(a) * 25, -26 + Math.sin(a) * 25], [-46 - Math.cos(a) * 25, -26 - Math.sin(a) * 25]], 0.7); L([[46 + Math.cos(a) * 25, -26 + Math.sin(a) * 25], [46 - Math.cos(a) * 25, -26 - Math.sin(a) * 25]], 0.7); }
    L([[-46, -26], [-4, -24], [-14, -62], [-46, -26]], 2); L([[-4, -24], [34, -62], [-14, -62]], 2); L([[34, -62], [46, -26]], 2); L([[34, -62], [30, -72], [22, -70]], 2);
    C(-4, -24, 6, 1.6);
    // coureur penché : dos, tête à casquette, bras au guidon, jambes aux pédales
    fillPts([[cx - 18 * k, gy - 72 * k], [cx + 18 * k, gy - 98 * k], [cx + 26 * k, gy - 90 * k], [cx - 10 * k, gy - 62 * k]], JO.encre, 0, 0);
    dot(cx + 28 * k, gy - 104 * k, 8 * k, JO.encre); fillPts([[cx + 20 * k, gy - 110 * k], [cx + 38 * k, gy - 110 * k], [cx + 42 * k, gy - 106 * k], [cx + 22 * k, gy - 106 * k]], JO.encre, 0, 0);
    L([[16, -94], [24, -72]], 3); L([[-12, -66], [6, -46], [-4, -24]], 3.4); L([[-12, -66], [-2, -38], [-10, -18]], 3.4);
    hatch([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h * 0.5], [x0, y0 + h * 0.5]], 0.15, 5 * k, 0.18);
    c.restore();
    strokePts([[x0, y0, 1], [x0 + w, y0, 1], [x0 + w, y0 + h, 1], [x0, y0 + h, 1], [x0, y0, 1]], JO.encre, 1.6);
  }
  PBR.gravure = gravure;
  const colonnes = (x0, y0, x1, y1, n, seed) => { for (let y = y0, i = 0; y <= y1; y += 9, i++) { const e = 0.55 + 0.45 * hash(i + seed); strokePts([[x0, y], [lerp(x0, x1, e), y]], JO.trait, 2.2); } };
  // o.etat 'plie' (défaut, 190 × 130 : moitié haute de la une) | 'deplie' (250 × 340)
  function drawJournal(o) {
    const dep = o.etat === 'deplie';
    if (dep) {
      pc(box(-125, -170, 125, 170), JO.papier, () => {
        fillPts(box(-112, -158, 112, -150), 'rgba(40,30,25,0.8)'); fillPts(box(-112, -128, 112, -125), 'rgba(40,30,25,0.8)');
        for (let i = 0; i < 9; i++) dot(-88 + i * 22, -139, 3.4, 'rgba(60,45,30,0.55)');         // bandeau orné sans lettre
        gravure(-112, -116, 224, 150);
        colonnes(-112, 46, -42, 158, 13, 1); colonnes(-34, 46, 36, 158, 13, 2); colonnes(44, 46, 112, 158, 13, 3);
        strokePts([[-38, 44], [-38, 160]], 'rgba(60,50,40,0.4)', 1); strokePts([[40, 44], [40, 160]], 'rgba(60,50,40,0.4)', 1);
        hatch(null, 0.5, 6, 0.08, 1, P.encre, [-130, -175, 130, 175]); shade(-125, 0, 125, 0, 0.18, [-130, -175, 130, 175]);
      }, 7201);
    } else {
      pc(box(-95, -65, 95, 65), JO.papier, () => {
        fillPts(box(-86, -58, 86, -53), 'rgba(40,30,25,0.8)');
        gravure(-86, -46, 106, 84);
        colonnes(28, -44, 86, 38, 9, 4); colonnes(-86, 46, 86, 60, 2, 5);
        hatch(null, 0.5, 6, 0.08, 1, P.encre, [-100, -70, 100, 70]);
      }, 7202);
      strokePts([[-95, 64], [95, 64]], 'rgba(90,80,60,0.6)', 1.6);                            // pli
    }
  }

  // ---------------------------------------------------------------- crayon (gros crayon de journaliste), pointe vers +x
  function drawCrayon() {
    pc([[-46, -7, 1], [86, -7, 1], [116, -1.5], [116, 1.5], [86, 7, 1], [-46, 7, 1]], '#a8392d', () => {
      fillPts([[86, -8, 1], [117, -1.5], [117, 1.5], [86, 8, 1]], '#e2c08f'); fillPts([[108, -3], [124, 0], [108, 3]], '#2a2622');
      strokePts([[-44, -2], [86, -2]], 'rgba(255,220,200,0.35)', 1.4); strokePts([[-44, 3], [86, 3]], 'rgba(60,10,10,0.35)', 1.2);
      fillPts(box(-46, -8, -36, 8), '#b8a48a'); fillPts(box(-52, -7, -46, 7), '#c9897a');
    }, 7211);
  }
  // ---------------------------------------------------------------- montre de gousset, ouverte, cadran tourné vers le visage (côté −x)
  function drawMontre(o) {
    pc(ell(14, -2, 9, 22, 16), '#b78f3a', () => hatch(null, 0.3, 3, 0.25), 7221);                 // couvercle ouvert (vu par la tranche)
    pc(ell(0, 0, 14, 25, 18), '#c9a14b', () => { strokePts(ep(0, 0, 11, 22, 10, -1.2, 1.2), 'rgba(255,240,190,0.7)', 1.6); }, 7222);
    pc(ell(-4, 0, 9, 19, 16), '#f3ecda', () => {
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; dot(-4 + Math.cos(a) * 6.5, Math.sin(a) * 15, i % 3 ? 0.8 : 1.4, '#3a3026'); }
      const t = (o && o.t) || 0;
      strokePts([[-4, 0], [-4 + 3 * Math.sin(t * 0.4), -10 * Math.cos(t * 0.4)]], '#2a221c', 1.6); strokePts([[-4, 0], [-4 + 4 * Math.sin(t * 2.5), -14 * Math.cos(t * 2.5)]], '#2a221c', 1);
    }, 7223, { texA: 0.3 });
    pc(ell(0, -29, 4, 4, 8), '#b78f3a', null, 7224); strokePts(ep(0, -36, 6, 6, 10, PI, TAU).concat([[6, -34]]), '#c9a14b', 2);   // remontoir + anneau
  }
  // ---------------------------------------------------------------- plateau rond doré, vu de trois quarts ; o.gateau 'amandes'|'creme'|'choux' (gâteau posé) ; (0,0) = centre du dessus
  const PLAT = { rx: 140, ry: 46 };
  function drawPlateau(o) {
    pc(ep(0, 8, PLAT.rx, PLAT.ry, 24, 0, PI).concat(ep(0, 0, PLAT.rx, PLAT.ry, 24, PI, 0)), '#a77c2c', () => hatch(null, 0.2, 3.5, 0.25), 7231);
    pc(ell(0, 0, PLAT.rx, PLAT.ry, 36), '#d1a849', () => {
      fillPts(ell(0, 0, PLAT.rx - 14, PLAT.ry - 6, 30), '#c39538');
      strokePts(ep(0, 0, PLAT.rx - 7, PLAT.ry - 3, 20, PI * 1.05, PI * 1.6), 'rgba(255,240,190,0.8)', 2);
      shade(-PLAT.rx, 0, PLAT.rx, 0, 0.25, [-PLAT.rx, -PLAT.ry, PLAT.rx, PLAT.ry]);
    }, 7232);
    if (has(o.gateau)) { const c = cx_(); c.save(); c.translate(0, -23); drawGateau({ etat: o.gateau === true ? 'amandes' : o.gateau, incl: 1, croque: o.croque }); c.restore(); }
  }
  // ---------------------------------------------------------------- poche à douille : pointe EN BAS ; o.sort 0..1 (crème qui sort) ; o.filet (longueur du boudin, local) ; (0,0) = pointe
  function drawPoche(o) {
    const sortK = clamp(o.sort || 0), Lf = o.filet != null ? o.filet : 70 * sortK;
    if (Lf > 1) {                                                                        // boudin de crème torsadé
      const pts = []; for (let i = 0; i <= 10; i++) { const y = 2 + Lf * i / 10; pts.push([Math.sin(i * 1.4 + (o.t || 0) * 6) * 2.5, y]); }
      pc(ribbon(pts, 15, 11), PB.creme, () => { for (let i = 0; i < 10; i++) strokePts([[-6, 6 + i * Lf / 10], [6, 10 + i * Lf / 10]], 'rgba(150,100,50,0.45)', 1.2); }, 7240, { drop: false });
    }
    pc([[-6, -22, 1], [6, -22, 1], [9, -6], [3, 4, 1], [-3, 4, 1], [-9, -6]], '#a9adb0', () => { for (const y of [-14, -6]) strokePts([[-9, y], [9, y]], 'rgba(60,60,60,0.5)', 1); }, 7241);
    pc([[-8, -20], [8, -20], [26, -70], [38, -116], [30, -128, 1], [-30, -128, 1], [-38, -116], [-26, -70]], '#d8cdb3', () => {
      fillPts([[-20, -118], [20, -118], [26, -88], [12, -40], [-12, -40], [-26, -88]], 'rgba(205,160,100,0.35)');   // crème vue à travers la toile
      for (const x of [-18, 0, 18]) strokePts([[x * 0.3, -24], [x, -122]], 'rgba(120,100,70,0.4)', 1.1);
      hatch(null, 0.9, 4, 0.2); shade(30, -70, -30, -70, 0.25, [-40, -130, 40, -18]);
    }, 7242);
    pc([[-30, -128, 1], [30, -128, 1], [16, -140], [8, -156], [-8, -156], [-16, -140]], '#c9bd9f', () => { for (const x of [-10, 0, 10]) strokePts([[x, -128], [x * 0.5, -154]], 'rgba(100,80,60,0.5)', 1.2); }, 7243);
  }
  // ---------------------------------------------------------------- pincée d'amandes (dans le poing)
  function drawPincee() {
    for (let i = 0; i < 6; i++) { const a = -0.8 + i * 0.3; pc([[Math.cos(a) * 10, -6 + Math.sin(a) * 8], [Math.cos(a) * 18 + 3, -10 + Math.sin(a) * 10], [Math.cos(a) * 16 - 2, -2 + Math.sin(a) * 10]], PB.amande, null, 7250 + i, { drop: false }); }
  }
  // ---------------------------------------------------------------- gâteau tenu : o.vue 'debout' (défaut) | 'plat' ; o.incl ; o.etat ; o.croque ; prises 20° sous l'horizontale de chaque côté
  const GRIP_A = 0.35;
  const gSq = (o) => lerp(1, 0.36, clamp(o.incl != null ? o.incl : (o.vue === 'plat' ? 1 : 0)));
  function gGrip(o) { const sq = gSq(o); if (o.prise === 'bord') return [-PB.R * 0.9, PB.R * 0.3 * sq]; return [PB.R * 0.94 * Math.cos(GRIP_A), PB.R * 0.94 * Math.sin(GRIP_A) * sq]; }
  function gP2(o) { const sq = gSq(o); if (o.prise === 'bord') return [-PB.R * 0.94, -PB.R * 0.28 * sq]; const g = gGrip(o); return [-g[0], g[1]]; }

  const OBJ = {
    //  draw(o) dessine l'objet à l'échelle 1, origine = (0,0) de son repère ; grip = point de prise ; p2 = seconde prise (deuxMains) ; pts = points nommés ; base = point posé
    journal: { draw: drawJournal, grip: (o) => (o.etat === 'deplie' ? [-118, 110] : [-86, 18]), p2: (o) => (o.etat === 'deplie' ? [-118, -60] : [-86, -30]), pts: { centre: [0, 0], haut: [0, -170] }, base: (o) => (o.etat === 'deplie' ? [0, 170] : [0, 65]) },
    crayon: { draw: drawCrayon, grip: [58, 0], pts: { pointe: [124, 0], bout: [-52, 0] }, base: [0, 7] },
    montre: { draw: drawMontre, grip: [8, 16], pts: { anneau: [0, -38], cadran: [-4, 0] }, base: [0, 25] },
    plateau: { draw: drawPlateau, grip: [62, 50], p2: () => [-74, 48], pts: { centre: [0, 0], gateau: [0, -23] }, base: [0, 54], paume: true },
    poche: { draw: drawPoche, grip: [0, -72], p2: () => [0, -146], pts: { pointe: [0, 4] }, base: [0, 4] },
    pincee: { draw: drawPincee, grip: [0, 0], pts: {}, base: [0, 0] },
    gateau: { draw: drawGateau, grip: gGrip, p2: gP2, pts: { centre: [0, 0], haut: [0, -PB.R], bas: [0, PB.R] }, base: (o) => [0, (o.vue === 'plat' || o.incl > 0.5) ? 67 : PB.R] },
  };
  PBR.OBJ = OBJ;
  const vOf = (v, o) => (typeof v === 'function' ? v(o || {}) : v);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = vOf(ob.grip, oo), c = cx_(), k = oo.echelle || 1;
    c.save(); c.scale(k, k); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    const doig = (n, deux) => (has(n) && !(OBJ[n] && OBJ[n].paume)) || deux;
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !p._objetApres) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (doig(p.tenu) && p.tenu !== 'pincee' ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (doig(p.tenuB) ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p._deux && !p._deuxPaume && !has(p.tenuB) ? DOIGTS : OFFP), paint: doigtsPaint },   // seconde main posée sur l'objet avant : par-dessus
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran : r renvoyé par une marionnette
  PBR.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = vOf(ob.grip, oo), q = ob.pts[nom], k = oo.echelle || 1;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };

  // =====================================================================
  // POSES — préparation commune (objets tenus, seconde main, marche, assis)
  // =====================================================================
  const BANC_H = 112;                                                         // hauteur du siège du banc (local, × s à l'écran)
  function prep(p) {
    p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) });
    const A = q.ang;
    if (A.legF != null) { A.legF_up = (A.legF_up || 0) + A.legF; delete A.legF; }
    if (A.legB != null) { A.legB_up = (A.legB_up || 0) + A.legB; delete A.legB; }
    return q;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick || 'bas'), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  // point écran → repère du torse (même x, y, s, dir que l'appel)
  function toTorso(env, q, P0) { const { mats } = M.partMatrices(env.def, q, env.x, env.y, env.s, env.dir); const p = new DOMPoint(P0[0], P0[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; }
  function plier(q, th) {                                                      // plie le buste aux hanches (th > 0 = vers l'avant)
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - HIP * Math.sin(th); q.dy = (q.dy || 0) + HIP * (1 - Math.cos(th));
    q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
  }
  function marche(q, k, t, amp) {                                              // pas sur place (la scène déplace x) ; k 0..1
    if (k <= 0) return; const ph = t * TAU * 1.5, s = Math.sin(ph), A = q.ang; amp = amp || 0.34;
    A.legF_up = (A.legF_up || 0) + amp * s * k; A.legB_up = (A.legB_up || 0) - amp * s * k;
    A.legF_lo = (A.legF_lo || 0) + 0.42 * Math.max(0, Math.sin(ph - 1.3)) * k; A.legB_lo = (A.legB_lo || 0) + 0.42 * Math.max(0, Math.sin(ph + PI - 1.3)) * k;
    A.piedF = (A.piedF || 0) - 0.5 * (A.legF_up + A.legF_lo) * k; A.piedB = (A.piedB || 0) - 0.5 * (A.legB_up + A.legB_lo) * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    A.armF_up = (A.armF_up || 0) - 0.2 * s * k; A.armB_up = (A.armB_up || 0) + 0.2 * s * k;
  }
  // assis : bassin posé sur le siège (pose.siege = y écran du dessus du siège ; défaut : banc PBR.banc au même y et s), pieds à plat au sol
  function assis(q, env, k) {
    if (k <= 0) return; const A = q.ang;
    const siege = q.siege != null ? q.siege : env.y - BANC_H * env.s;
    q.dy = (q.dy || 0) + (HIP - (env.y - siege) / env.s - 16) * k;
    q.tilt = (q.tilt || 0) - 0.02 * k;
    const yg = HIP - (q.dy || 0);
    for (const [L, hx, fx] of [['F', 6, 104], ['B', -6, 86]]) {
      const s = ikL([hx, -2], [fx, yg - 16], TH, SHN);
      A['leg' + L + '_up'] = lerp(A['leg' + L + '_up'] || 0, s.a, k); A['leg' + L + '_lo'] = lerp(A['leg' + L + '_lo'] || 0, s.b, k);
    }
    q._piedsPlats = true;
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    const paume = (n) => OBJ[n] && OBJ[n].paume;
    if (has(q.tenu) && !q.handF) q.handF = paume(q.tenu) ? 'open' : 'fist';
    if (has(q.tenuB) && !q.handB) q.handB = paume(q.tenuB) ? 'open' : 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    if (q._piedsPlats) { A.piedF = -((A.legF_up || 0) + (A.legF_lo || 0) + tl) + (A.piedF || 0); A.piedB = -((A.legB_up || 0) + (A.legB_lo || 0) + tl) + (A.piedB || 0); }
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = vOf(ob.grip, oo), k = oo.echelle || 1, p2 = ob.p2(oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).scale(k, k).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, p2), 'bas'), kd = q.deuxK == null ? 1 : clamp(q.deuxK);
      A.armB_up = lerp(A.armB_up || 0, sol.a, kd); A.armB_lo = lerp(A.armB_lo || 0, sol.b, kd);
      q.handB = ob.paume ? 'open' : 'fist'; q._deux = kd > 0.5; q._deuxPaume = !!ob.paume;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ nom: def.nom }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }

  // ---------------- pièces de corps communes
  function upDef(at, base, seed, paint) { return { parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) }; }
  function foreDef(parent, base, skin, back, seed, o) {
    o = o || {}; const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      if (o.paint) o.paint(back);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (o.cuff) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.cuff);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.3 : 0.2);
    } };
  }
  // jambes en 3 pièces : cuisse (legX_up), tibia (legX_lo), pied (piedX) ; ang.legF / ang.legB acceptés (= cuisse)
  function legParts(L, seed) {
    const thigh = (back) => ({ parent: 'torso', at: [back ? -6 : 6, -2], pts: legC(TH, L.wt, L.kt), base: back ? L.colD : L.col, seed: seed + (back ? 1 : 2), noRivet: !!back,
      paint: (p) => { if (L.thighPaint) L.thighPaint(back, p); hatch(back ? null : [[-L.wt, -10], [-4, -10], [-4, TH], [-L.wt, TH]], 0.8, 3.8, back ? 0.3 : 0.22); } });
    const shin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, TH], pts: L.shinPts || legC(SHN, L.kt, L.ak), base: back ? (L.shinD || L.colD) : (L.shin || L.col), seed: seed + (back ? 3 : 4), noRivet: !!back,
      paint: (p) => { if (L.shinPaint) L.shinPaint(back, p); hatch(back ? null : [[-L.kt, -6], [-3, -6], [-3, SHN], [-L.kt, SHN]], 0.8, 3.8, back ? 0.3 : 0.2); } });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, SHN], pts: FOOT(L.ak + 1, L.fl), base: back ? L.shoeD : L.shoe, seed: seed + (back ? 5 : 6), noRivet: true,
      paint: () => { strokePts([[4, 4], [L.fl * 0.7, 7]], 'rgba(255,255,255,0.25)', 1.2); fillPts(box(-16, 13, L.fl + 2, 17), 'rgba(0,0,0,0.35)'); } });
    return { legB_up: thigh(true), legB_lo: shin(true), piedB: foot(true), legF_up: thigh(false), legF_lo: shin(false), piedF: foot(false) };
  }
  const LEGS = ['legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF'];

  // =====================================================================
  // PIERRE GIFFARD (1891) — tête nue, cheveux noirs plaqués raie au milieu, moustache en guidon, veston à carreaux ocre et brun,
  // gilet crème, lavallière rouge sang, pantalon gris rayé, crayon derrière l'oreille
  // =====================================================================
  const GI = { peau: '#e3c09d', peauD: '#c69c79', cheveux: '#16110e', veston: '#c39a55', vestonD: '#a37b40', car: 'rgba(86,50,22,0.7)', car2: 'rgba(110,60,25,0.32)', gilet: '#eee2bf', lav: '#94211d', pant: '#8e8e91', pantD: '#737376', raie: 'rgba(50,50,56,0.45)', chaus: '#1e1916', chausD: '#141010' };
  const GI_TORSO = [[-14, -176], [8, -180], [18, -168], [28, -150], [36, -110], [38, -60], [37, -10], [40, 40], [42, 66, 1], [-40, 68, 1], [-40, 20], [-38, -40], [-38, -110], [-33, -150], [-26, -168]];
  function carreaux(x0, y0, x1, y1, sp, col, col2) {
    for (let x = x0; x <= x1; x += sp) strokePts([[x, y0], [x + 2, y1]], col, 2.4);
    for (let y = y0; y <= y1; y += sp) strokePts([[x0, y], [x1, y + 1]], col, 2.4);
    for (let x = x0 + sp / 2; x <= x1; x += sp) strokePts([[x, y0], [x + 2, y1]], col2, 1.1);
    for (let y = y0 + sp / 2; y <= y1; y += sp) strokePts([[x0, y], [x1, y + 1]], col2, 1.1);
  }
  const GI_MOUST = [[5, -46, 1], [10, -38], [18, -37], [28, -38], [36, -36], [44, -38], [49, -46, 1], [54, -42], [52, -33], [45, -28], [36, -27], [26, -28], [16, -28], [8, -30], [2, -36], [1, -42]];
  function mkGiffard() {
    const L = { wt: 17, kt: 13, ak: 10, fl: 46, col: GI.pant, colD: GI.pantD, shoe: GI.chaus, shoeD: GI.chausD,
      thighPaint: (back) => { for (const x of [-10, -2, 6, 13]) strokePts([[x, -14], [x * 0.85, TH + 8]], GI.raie, 1.3); },
      shinPaint: (back) => { for (const x of [-9, -2, 5, 11]) strokePts([[x, -10], [x * 0.9, SHN + 6]], GI.raie, 1.3); } };
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: GI_TORSO, base: GI.veston, seed: 8001, paint: () => {
        carreaux(-60, -200, 60, 80, 15, GI.car, GI.car2);
        fillPts([[12, -170], [26, -152], [34, -110], [36, -60], [24, -48], [14, -100]], GI.gilet);                 // gilet crème
        for (const y of [-128, -104, -80, -58]) dot(27 + (y + 128) * 0.05, y, 2.4, '#8d7d5c');
        strokePts([[29, -92], [20, -84], [10, -82], [2, -86]], '#d8b24a', 2);                                      // chaîne de montre
        fillPts([[10, -172], [24, -154], [20, -118], [12, -138]], GI.vestonD); strokePts([[24, -154], [20, -118], [26, -54]], 'rgba(60,35,15,0.6)', 1.3);
        fillPts(box(2, -8, 32, -2), 'rgba(70,40,18,0.45)');                                                       // rabat de poche
        dot(30, -40, 2.6, '#5a3a20'); dot(32, -14, 2.6, '#5a3a20');
        hatch([[-50, -170], [-12, -170], [-10, 70], [-50, 70]], 0.75, 4.2, 0.26); shade(40, 0, -40, 0, 0.26);
      } },
      lavalliere: { parent: 'torso', at: [0, 0], noRivet: true, base: GI.lav, seed: 8002,
        pts: [[14, -174], [28, -182], [42, -176], [38, -166], [30, -165], [42, -156], [46, -138], [36, -140], [29, -154], [23, -148], [18, -136], [13, -150], [19, -162]],
        paint: () => { strokePts([[28, -166], [32, -158]], 'rgba(40,0,0,0.5)', 1.4); hatch(null, 0.6, 3.2, 0.25); } },
      armB_up: upDef([-10, -146], GI.vestonD, 8004, () => { carreaux(-30, -30, 30, 110, 15, GI.car, GI.car2); hatch(null, 0.9, 3.8, 0.3); }),
      armB_lo: foreDef('armB_up', GI.vestonD, GI.peauD, true, 8005, { cuff: '#e8e4da', paint: () => carreaux(-30, -20, 30, 70, 15, GI.car, GI.car2) }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: GI.peau, seed: 8006, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[38, -98], [32, -86], [20, -84], [6, -82], [-4, -76], [-8, -64], [-16, -58], [-20, -46], [-22, -32], [-30, -20], [-52, -20], [-52, -112], [10, -116]], GI.cheveux, 3);
        strokePts([[30, -98], [4, -101], [-22, -96], [-38, -86]], 'rgba(235,225,215,0.75)', 1.4);                    // raie au milieu (sommet du crâne)
        for (const [a, b] of [[[24, -92], [0, -90]], [[10, -92], [-18, -84]], [[-6, -94], [-30, -80]], [[-18, -88], [-36, -64]]]) strokePts([a, b], 'rgba(255,255,255,0.22)', 1.3);
        X.earPaint(-8, -44);
        dot(14, -30, 8, 'rgba(205,130,110,0.16)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(18,12,10,0.95)', 3); X.mouth(f, 27, -23);
      } },
      crayonOreille: { parent: 'head', at: [0, 0], noRivet: true, base: '#a8392d', seed: 8007, pts: (p) => (p.tenu === 'crayon' ? OFFP : [[-27.6, -51.9, 1], [-4.6, -70.9, 1], [2.4, -73.5], [-1.4, -67.1, 1], [-24.4, -48.1, 1]]),
        paint: () => { fillPts([[-4.6, -70.9], [2.4, -73.5], [-1.4, -67.1]], '#e2c08f'); dot(1.4, -72.8, 1.3, '#222'); } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: GI.cheveux, seed: 8008, pts: GI_MOUST, paint: () => { strokePts([[12, -34], [28, -33], [44, -33]], 'rgba(255,255,255,0.25)', 1.2); } },
      armF_up: upDef([-2, -146], GI.veston, 8009, () => { carreaux(-30, -30, 30, 110, 15, GI.car, GI.car2); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.25); }),
      armF_lo: foreDef('armF_up', GI.veston, GI.peau, false, 8010, { cuff: '#f1ede4', paint: () => carreaux(-30, -20, 30, 70, 15, GI.car, GI.car2) }),
    }, legParts(L, 8020), heldParts(GI.peau, 8030));
    return { hipY: -HIP, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'giffard',
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB'].concat(LEGS, ['head', 'crayonOreille', 'moustache', 'torso', 'lavalliere', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']) };
  }
  CH.pbrGiffard = mkGiffard();
  // gestes : brandir, tracer (+cible), salut, ecrire (+cible, assis), montre, cercle (0..1 = tour), marche, assis
  PBR.giffardPose = function (p, env) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    marche(q, k01(q.marche), t);
    assis(q, env, k01(q.assis));
    const br = k01(q.brandir), tr = k01(q.tracer), sa = k01(q.salut), ec = k01(q.ecrire), mo = k01(q.montre);
    if (br > 0) {
      if (q.tenu == null) { q.tenu = 'journal'; q.tenuO = Object.assign({ etat: 'deplie' }, q.tenuO); }
      blend(q, 'armF_up', -2.45 + 0.08 * Math.sin(t * 7), br); blend(q, 'armF_lo', -0.5, br); A.head = (A.head || 0) - 0.12 * br;
      blend(q, 'armB_up', 0.15, br); blend(q, 'armB_lo', -0.35, br);
    }
    if (tr > 0 || ec > 0) {                                                    // crayon : la pointe va sur la cible
      if (q.tenu == null) q.tenu = 'crayon';
      const k = Math.max(tr, ec), aC = ec > tr ? 1.1 : 0.55;                   // inclinaison de la pointe (rad, vers le bas)
      let C = q.cible ? toTorso(env, q, q.cible) : (ec > tr ? [128, -14] : [205, -150]);
      if (ec > tr) C = [C[0] + 4 * Math.sin(t * 13), C[1] + 3 * Math.sin(t * 9 + 1)];
      const tip = rot([124 - 58, 0], aC);
      armTo(q, 'armF', [C[0] - tip[0], C[1] - tip[1]], 'bas', k);
      q.droit = true; A.objet = (A.objet || 0) + aC * k; A.head = (A.head || 0) + 0.12 * ec;
    }
    if (sa > 0) { blend(q, 'armF_up', -2.05, sa); blend(q, 'armF_lo', -0.75, sa); if (!has(q.tenu)) q.handF = 'open'; A.head = (A.head || 0) - 0.06 * sa; if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (mo > 0) {                                                              // regarde sa montre, cadran tourné vers lui
      if (q.tenu == null) q.tenu = 'montre';
      armTo(q, 'armF', [100, -132], 'bas', mo); A.head = (A.head || 0) + 0.28 * mo; if (!q.face.eyes) q.face.eyes = 'half';
    }
    if (q.cercle != null) {                                                    // grand geste circulaire : cercle 0..1 = un tour
      const u = clamp(q.cercle), k = clamp(Math.min(u, 1 - u) * 8) * (q.cercleK == null ? 1 : q.cercleK), a = -PI / 2 - u * TAU;
      armTo(q, 'armF', [140 + 55 * Math.cos(a), -225 + 55 * Math.sin(a)], 'bas', k); if (!has(q.tenu)) q.handF = 'open';
    }
    return finish(q);
  };
  PBR.giffard = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s; o = o || {}; const env = { def: CH.pbrGiffard, x, y, s, dir: o.dir || 1 };
    const q = PBR.giffardPose(Object.assign({}, pose), env), r = run(CH.pbrGiffard, q, x, y, s, o);
    if (q.tenu === 'montre' && !SIL()) {                                        // chaîne dorée de la montre à la poche du gilet
      const a = PBR.pt(r, 'anneau'), b = r.w('torso', 2, -86), c = cx_();
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 30 * s, b[0], b[1]);
      c.strokeStyle = '#d8b24a'; c.lineWidth = 2.2; c.setLineDash([3, 2]); c.stroke(); c.restore();
    }
    return r;
  };

  // =====================================================================
  // LOUIS DURAND (pâtissier) — haute toque blanche plissée, veste croisée blanche, tablier ivoire noué, pantalon pied-de-poule,
  // joues roses, moustache blond roux, petit ventre
  // =====================================================================
  const DU = { peau: '#efc8a6', peauD: '#d3a785', blanc: '#f4f1e8', blancD: '#d8d3c4', tablier: '#e6dcc0', tablierD: '#c9bc98', moust: '#c9823e', moustL: '#e3a865', pdp: '#1c1b1e', pdpL: '#ecebe4', toque: '#fbfaf5', chaus: '#231d1a' };
  const DU_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [42, -116], [56, -80], [64, -42], [58, 0], [46, 36, 1], [-38, 38, 1], [-40, 10], [-38, -50], [-38, -110], [-33, -150], [-26, -168]];
  function piedDePoule(x0, y0, x1, y1) {                                      // motif pied-de-poule (dents noires sur fond clair)
    if (SIL()) return;
    for (let y = y0, j = 0; y < y1; y += 8, j++) for (let x = x0 + (j % 2) * 4, i = 0; x < x1; x += 8, i++) {
      fillPts([[x, y], [x + 4, y], [x + 6, y - 2], [x + 6, y + 3], [x + 4, y + 4], [x + 2, y + 6], [x, y + 4]], DU.pdp, 0, 0);
    }
  }
  const DU_TOQUE = [[-38, 6, 1], [34, 6, 1], [38, -16], [46, -56], [52, -98], [44, -122], [22, -134], [-4, -136], [-30, -128], [-50, -110], [-54, -70], [-44, -20]];
  const DU_MOUST = [[16, -33], [26, -35], [33, -33], [37, -27], [40, -19], [34, -19], [28, -23], [21, -21], [15, -23], [13, -28]];
  function mkDurand() {
    const L = { wt: 18, kt: 13, ak: 10, fl: 46, col: DU.pdpL, colD: '#c9c7bf', shoe: DU.chaus, shoeD: '#171310',
      thighPaint: (back) => piedDePoule(-24, -20, 24, TH + 12), shinPaint: (back) => piedDePoule(-20, -14, 20, SHN + 8) };
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: DU_TORSO, base: DU.blanc, seed: 8101, paint: () => {
        fillPts([[-20, -182], [16, -182], [20, -164], [-18, -160]], DU.blancD);                                   // col officier
        strokePts([[18, -166], [36, -130], [48, -80], [52, -30]], 'rgba(120,110,90,0.6)', 1.5);                     // bord croisé
        for (const y of [-138, -108, -78, -48]) { dot(14 + (y + 138) * 0.12, y, 3, '#bdb5a2'); dot(34 + (y + 138) * 0.16, y + 2, 3, '#bdb5a2'); }
        hatch([[-50, -170], [-12, -170], [-10, 40], [-50, 40]], 0.75, 4.2, 0.22); shade(54, -40, -40, -40, 0.24);
      } },
      tablier: { parent: 'torso', at: [0, 0], noRivet: true, base: DU.tablier, seed: 8102,
        pts: [[-28, -64], [54, -68, 1], [64, -40], [64, 40], [64, 150, 1], [-12, 152, 1], [-18, 60], [-26, -20]],
        paint: () => {
          fillPts(box(-40, -70, 60, -58), DU.tablierD);                                                             // cordon
          for (const x of [8, 26, 44]) strokePts([[x, -56], [x + 4, 40], [x + 6, 150]], 'rgba(120,105,70,0.35)', 1.3);
          hatch([[-30, -60], [6, -60], [6, 152], [-30, 152]], 0.75, 4.2, 0.22); shade(60, 0, -20, 0, 0.2);
        } },
      noeud: { parent: 'torso', at: [-40, -64], noRivet: true, base: DU.tablierD, seed: 8103,
        pts: [[0, -4], [-14, -14], [-20, -6], [-12, 2], [-18, 22], [-10, 24], [-4, 6], [2, 26], [8, 22], [4, 4]], paint: () => hatch(null, 0.6, 3.2, 0.25) },
      armB_up: upDef([-10, -146], DU.blancD, 8104),
      armB_lo: foreDef('armB_up', DU.blancD, DU.peauD, true, 8105, { cuff: '#c9c3b2' }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: DU.peau, seed: 8106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-14, -84], [-28, -78], [-34, -60], [-32, -40], [-24, -30], [-18, -44], [-14, -64]], DU.moust);   // cheveux blond roux sous la toque
        X.earPaint(-8, -44);
        dot(16, -30, 11, 'rgba(232,110,110,0.42)'); dot(30, -42, 4, 'rgba(232,110,110,0.3)');                    // joues roses, bout du nez
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(170,100,45,0.95)', 2.6); X.mouth(f, 28, -14);
      } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: DU.moust, seed: 8107, pts: DU_MOUST,
        paint: () => { for (let i = 0; i < 6; i++) strokePts([[16 + i * 4.2, -32], [14 + i * 4.6, -22]], DU.moustL, 1.1); } },
      toque: { parent: 'head', at: [-2, -86], noRivet: true, base: DU.toque, seed: 8108, pts: DU_TOQUE, paint: () => {
        fillPts([[-40, 6], [36, 6], [38, -14], [-42, -14]], '#ebe8de');                                            // bandeau
        for (const x of [-36, -22, -8, 6, 20, 32]) strokePts([[x, -16], [x * 1.15, -70], [x * 1.05, -120]], 'rgba(150,145,130,0.55)', 1.4);   // plis
        strokePts([[-30, -110], [0, -128], [30, -118]], 'rgba(150,145,130,0.45)', 1.2);
        hatch([[-56, -130], [-20, -130], [-20, 8], [-56, 8]], 0.8, 4.5, 0.12); shade(40, -60, -50, -60, 0.18);
      } },
      armF_up: upDef([-2, -146], DU.blanc, 8109),
      armF_lo: foreDef('armF_up', DU.blanc, DU.peau, false, 8110, { cuff: DU.blancD }),
    }, legParts(L, 8120), heldParts(DU.peau, 8130));
    return { hipY: -HIP, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'durand',
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB'].concat(LEGS, ['head', 'moustache', 'toque', 'torso', 'tablier', 'noeud', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']) };
  }
  CH.pbrDurand = mkDurand();
  // gestes : presente, presse (+cible, sort), saupoudre (+cible, ouvre), non, accepte, debout, couronne (+cible), marche
  PBR.durandPose = function (p, env) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    marche(q, k01(q.marche), t);
    const pr = k01(q.presente), ps = k01(q.presse), sp = k01(q.saupoudre), no = k01(q.non), ac = k01(q.accepte), de = k01(q.debout), co = q.couronne != null ? clamp(q.couronne) : -1;
    if (pr > 0) {                                                              // plateau devant lui à deux mains, paumes dessous
      if (q.tenu == null) { q.tenu = 'plateau'; q.tenuO = Object.assign({ gateau: 'amandes' }, q.tenuO); }
      armTo(q, 'armF', [140, -20], 'bas', pr); q.deuxMains = q.deuxMains !== false; q.deuxK = pr;
    }
    if (ps > 0) {                                                              // poche à douille, pointe au-dessus de la cible
      if (q.tenu == null) q.tenu = 'poche';
      q.tenuO = Object.assign({ sort: q.sort || 0 }, q.tenuO);
      const C = q.cible ? toTorso(env, q, q.cible) : [150, 10];
      armTo(q, 'armF', [C[0], C[1] - 76 - 10], 'bas', ps); q.deuxMains = q.deuxMains !== false; q.deuxK = ps;
      A.head = (A.head || 0) + 0.18 * ps;
    }
    if (sp > 0) {                                                              // pincée d'amandes au-dessus de la cible, la main s'ouvre
      const C = q.cible ? toTorso(env, q, q.cible) : [150, 10], ouv = clamp(q.ouvre || 0);
      armTo(q, 'armF', [C[0] - 6, C[1] - 120], 'bas', sp); A.head = (A.head || 0) + 0.15 * sp;
      if (ouv > 0.5) q.handF = 'open'; else if (q.tenu == null) q.tenu = 'pincee';
      q._pluie = ouv; q._cibleE = q.cible;
    }
    if (no > 0) {                                                              // non : la tête hoche, la main ouverte balaie
      A.head = (A.head || 0) + 0.1 * Math.sin(t * 11) * no;
      blend(q, 'armF_up', -1.25 + 0.3 * Math.sin(t * 7), no); blend(q, 'armF_lo', -0.55, no); if (!has(q.tenu)) q.handF = 'open';
      if (!q.face.brow) q.face.brow = 'frown'; if (!q.face.mouth) q.face.mouth = 'tight';
    }
    if (ac > 0) {                                                              // accepte : main sur le cœur + petite révérence
      plier(q, 0.22 * ac); A.head = (A.head || 0) + 0.18 * ac;
      armTo(q, 'armF', [26, -112], 'bas', ac); if (!has(q.tenu)) q.handF = 'open';
      blend(q, 'armB_up', 0.35, ac); blend(q, 'armB_lo', -0.2, ac); if (!q.face.mouth) q.face.mouth = 'smile';
    }
    if (de > 0) {                                                              // le gâteau debout à deux mains, comme une roue
      if (q.tenu == null) { q.tenu = 'gateau'; q.tenuO = Object.assign({ vue: 'debout' }, q.tenuO); }
      const g = gGrip(heldOpts('gateau', q.tenuO, q)), Cc = [18, -40];
      armTo(q, 'armF', [Cc[0] + g[0], Cc[1] + g[1]], 'bas', de); q.deuxMains = q.deuxMains !== false; q.deuxK = de;
      A.head = (A.head || 0) - 0.08 * de;
    }
    if (co >= 0) {                                                             // couronne : soulève l'anneau à plat et le passe par-dessus la tête de la cible
      if (q.tenu == null) q.tenu = 'gateau';
      q.tenuO = Object.assign({ vue: 'plat' }, q.tenuO, { incl: 1, prise: 'bord' });
      const Cb = q.cible ? toTorso(env, q, q.cible) : [230, -300];             // cible = sommet de la tête de l'autre (écran)
      const u1 = ease(clamp(co / 0.5)), u2 = ease(clamp((co - 0.5) / 0.5));
      const cy = lerp(lerp(-90, Cb[1] - 70, u1), Cb[1] + 80, u2), cxx = lerp(150, Cb[0], u1);
      const g = gGrip(q.tenuO);                                                // prise : bord proche de l'anneau (côté du pâtissier)
      armTo(q, 'armF', [cxx + g[0], cy + g[1]], 'bas', 1); q.deuxMains = q.deuxMains !== false; q.deuxK = 1;
      A.head = (A.head || 0) - 0.2 * u1; q._couronne = { cx: cxx, cy };
    }
    return finish(q);
  };
  PBR.durand = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s; o = o || {}; const env = { def: CH.pbrDurand, x, y, s, dir: o.dir || 1 };
    const q = PBR.durandPose(Object.assign({}, pose), env), r = run(CH.pbrDurand, q, x, y, s, o);
    if (q._pluie > 0.5 && !SIL()) {                                             // pluie d'amandes de la main jusqu'à la cible
      const h = r.w('armF_lo', 4, 110), yEnd = q._cibleE ? q._cibleE[1] : h[1] + 110 * s, t = q.t || 0, c = cx_();
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 14; i++) {
        const u = ((t * 1.6 + i / 14) % 1), yy = lerp(h[1], yEnd, u), xx = h[0] + Math.sin(i * 2.1 + t * 5) * 9 * s + (hash(i) - 0.5) * 22 * s;
        c.save(); c.translate(xx, yy); c.rotate(t * 6 + i); c.scale(s, s); c.globalAlpha = 1 - u * 0.4;
        c.beginPath(); c.ellipse(0, 0, 8, 3, 0, 0, TAU); c.fillStyle = PB.amande; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(150,110,60,0.7)'; c.stroke(); c.restore();
      }
      c.restore();
    }
    return r;
  };
  // couronne : redessine la moitié AVANT de l'anneau par-dessus la marionnette coiffée (appeler après l'avoir dessinée)
  PBR.gateauAvant = function (r) {
    if (!r || r.tenu !== 'gateau') return; const c = cx_(), m = r.mats.objet, oo = r.tenuO, g = vOf(OBJ.gateau.grip, oo);
    c.save(); c.setTransform(m); c.translate(-g[0], -g[1]); drawGateau(Object.assign({}, oo, { moitie: 'avant' })); c.restore();
  };

  // =====================================================================
  // LA BICYCLETTE DE 1891 — deux roues égales à rayons, pneus noirs, cadre en losange noir, chaîne et un seul pignon, guidon recourbé, selle de cuir
  // repère : sol sous le pédalier (x vers l'avant) ; roues R 122 (= paris-brest), moyeux à x −165 et +200
  // =====================================================================
  const VE = { R: 122, BB: [0, -95], RA: [-165, -122], FA: [200, -122], SC: [-58, -232], HT: [160, -236], HB: [172, -192], man: 44,
    gripF: [100, -252], gripB: [106, -250], selle: [-70, -258], cadre: '#1c1b1e', cuir: '#7a4a26' };
  PBR.VELO = VE;
  function anneau(cx, cy, r, w, col) {
    const c = cx_(); c.beginPath(); c.arc(cx, cy, r, 0, TAU);
    if (SIL()) { c.lineWidth = w; c.strokeStyle = '#000'; c.stroke(); return; }
    c.lineWidth = w + 4.4 * M._lw(); c.strokeStyle = P.edge; c.stroke();
    c.lineWidth = w + 2 * M._lw(); c.strokeStyle = 'rgba(30,20,12,0.85)'; c.stroke();
    c.lineWidth = w; c.strokeStyle = col; c.stroke();
  }
  function roue(C, ang) {
    const c = cx_(), R = VE.R;
    anneau(C[0], C[1], R - 6, 11, '#1f1c1a');
    if (!SIL()) {
      c.beginPath(); c.arc(C[0], C[1], R - 3, -2.4, -1.2); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.22)'; c.stroke();
      c.beginPath(); for (let i = 0; i < 20; i++) { const a = ang + i / 20 * TAU, a2 = a + (i % 2 ? 0.18 : -0.18); c.moveTo(C[0] + Math.cos(a) * 5, C[1] + Math.sin(a) * 5); c.lineTo(C[0] + Math.cos(a2) * (R - 13), C[1] + Math.sin(a2) * (R - 13)); }
      c.lineWidth = 1.1; c.strokeStyle = 'rgba(70,70,74,0.85)'; c.stroke();
    }
    anneau(C[0], C[1], R - 13, 3, '#8f8e8a');
    pc(ell(C[0], C[1], 8, 8, 10), '#9a9894', () => dot(C[0], C[1], 2.5, '#333'), 7301);
  }
  function manivelle(th, pres) {
    const P0 = VE.BB, Pd = [P0[0] + Math.cos(th) * VE.man, P0[1] + Math.sin(th) * VE.man];
    tube(P0, Pd, 8, pres ? '#5d5c5a' : '#3a3937', 7311);
    pc(box(Pd[0] - 13, Pd[1] - 4, Pd[0] + 13, Pd[1] + 4), pres ? '#4a4846' : '#2e2d2b', () => { strokePts([[Pd[0] - 10, Pd[1]], [Pd[0] + 10, Pd[1]]], 'rgba(255,255,255,0.3)', 1); }, 7312);
    return Pd;
  }
  function drawVelo(v, layer) {
    const th = v.th || 0, ra = v.roue || 0;
    if (layer === 'fond' || layer === 'tout') manivelle(th + PI, false);
    if (layer === 'cadre' || layer === 'tout') {
      roue(VE.RA, ra); roue(VE.FA, ra);
      const c = cx_();
      if (!SIL()) {                                                             // chaîne
        c.beginPath(); c.moveTo(0, VE.BB[1] - 26); c.lineTo(VE.RA[0], VE.RA[1] - 10); c.moveTo(0, VE.BB[1] + 26); c.lineTo(VE.RA[0], VE.RA[1] + 10);
        c.lineWidth = 3; c.setLineDash([4, 2]); c.lineDashOffset = -th * 20; c.strokeStyle = '#3c3a38'; c.stroke(); c.setLineDash([]);
      }
      pc(ell(VE.RA[0], VE.RA[1], 12, 12, 12), '#55534f', null, 7321);                                                       // pignon unique
      tube(VE.BB, VE.RA, 7, VE.cadre, 7322); tube(VE.SC, VE.RA, 7, VE.cadre, 7323);                                       // bases et haubans
      tube(VE.SC, VE.BB, 10, VE.cadre, 7324); tube(VE.HB, VE.BB, 10, VE.cadre, 7325); tube(VE.SC, VE.HT, 9, VE.cadre, 7326);
      pc(ribbon(qbez(VE.HB, [190, -158], VE.FA, 6), 9, 7), VE.cadre, null, 7327, { drop: false });                       // fourche
      tube([VE.HT[0], VE.HT[1] - 6], VE.HB, 13, '#2a292c', 7328);                                                          // douille
      tube(VE.HT, [158, -260], 7, '#6e6d6a', 7329);                                                                        // potence
      pc(ribbon(qbez([158, -260], [122, -276], [100, -250], 8), 7, 7), '#6e6d6a', null, 7330, { drop: false });          // guidon recourbé
      pc(ribbon([[104, -256], [97, -242]], 11, 11), '#6b4426', null, 7331);                                                // poignée de bois
      // pédalier : plateau denté
      const dents = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU + th, rr = i % 2 ? 27 : 24; dents.push([VE.BB[0] + Math.cos(a) * rr, VE.BB[1] + Math.sin(a) * rr]); }
      pc(dents, '#6a6864', () => { for (let i = 0; i < 5; i++) { const a = th + i / 5 * TAU; dot(VE.BB[0] + Math.cos(a) * 14, VE.BB[1] + Math.sin(a) * 14, 4, '#2b2a28'); } }, 7332);
      tube([-64, -244], VE.SC, 7, '#6e6d6a', 7333);                                                                        // tige de selle
      pc([[-100, -258], [-74, -266], [-46, -262], [-40, -256], [-52, -250], [-92, -248]], VE.cuir, () => { strokePts([[-94, -256], [-48, -258]], 'rgba(255,220,180,0.3)', 1.2); for (let x = -90; x < -50; x += 7) dot(x, -252, 1.2, '#3a2312'); }, 7334);
      if (!SIL()) { c.beginPath(); for (let i = 0; i < 3; i++) c.ellipse(-82 + i * 3, -242 + i * 0, 4, 4, 0, 0, TAU); c.lineWidth = 1.6; c.strokeStyle = '#555'; c.stroke(); }   // ressorts
    }
    if (layer === 'avant' || layer === 'tout') manivelle(th, true);
  }
  PBR.drawVelo = drawVelo;

  // =====================================================================
  // LE COUREUR CHARLES TERRONT — casquette plate à petite visière, maillot de laine vert éteint à col boutonné, culotte courte noire,
  // longs bas gris, chaussures noires, moustache brune, mollets galbés ; barbe grise postiche (barbe 0..1)
  // =====================================================================
  const TE = { peau: '#d7ab84', peauD: '#b98d68', maillot: '#5d7a48', maillotD: '#4b663a', culotte: '#1e1c1e', culotteD: '#141214', bas: '#929089', basD: '#787670', chaus: '#151111', casq: '#2e2a27', casqD: '#1d1a18', bande: '#a8843c', moust: '#4a2c1a', cheveux: '#3a271a', barbe: '#aaa9a3', barbeD: '#8a8984' };
  const TE_TORSO = [[-14, -176], [8, -180], [16, -170], [26, -152], [33, -116], [33, -70], [29, -30], [32, 10], [36, 40, 1], [-34, 42, 1], [-36, 10], [-34, -40], [-36, -110], [-32, -150], [-24, -168]];
  const TE_MOUST = [[18, -37], [28, -38], [36, -36], [39, -31], [34, -29], [26, -30], [18, -30], [14, -33]];
  const TE_CASQ = [[-42, 12, 1], [-44, 0], [-36, -12], [-10, -19], [16, -18], [30, -8], [35, 2], [52, 3], [57, 9, 1], [36, 12, 1]];
  const barbePts = (b) => { const L = lerp(24, 236, b); return [[-14, -40], [-2, -27], [12, -21], [26, -22], [34, -20], [37, -10], [38, L * 0.3], [35, L * 0.62], [28, L * 0.88], [20, L, 1], [12, L * 0.86], [4, L * 0.6], [-6, L * 0.32], [-14, 0], [-20, -22]]; };
  // collier : l'anneau autour du cou, posé sur les épaules (moitié arrière derrière le cou, moitié avant devant)
  function collierDraw(moitie) {
    const c = cx_(); c.save(); c.translate(14, -132); c.rotate(0.3); drawGateau({ etat: 'amandes', incl: 1, sq: 0.27, H: 30, moitie }); c.restore();
  }
  function mkTerront(velo) {
    const L = { wt: 18, kt: 13, ak: 9, fl: 46, col: TE.culotte, colD: TE.culotteD, shin: TE.bas, shinD: TE.basD, shoe: TE.chaus, shoeD: '#0e0b0b',
      shinPts: shinCalf(SHN, 13, 8.5, 15),
      thighPaint: (back) => { fillPts(box(-26, TH - 24, 26, TH + 20), back ? TE.peauD : TE.peau); strokePts([[-20, TH - 24], [20, TH - 24]], 'rgba(255,255,255,0.2)', 1.2); },
      shinPaint: (back) => {
        fillPts(box(-30, -6, 30, 10), back ? '#6c6a64' : '#83817a'); for (let x = -12; x <= 12; x += 4) strokePts([[x, -4], [x, 9]], 'rgba(40,40,40,0.35)', 1);   // revers des bas
        if (!back) { strokePts([[-15, 18], [-24, 42], [-20, 66], [-12, 86]], 'rgba(255,255,255,0.32)', 2); strokePts([[-8, 30], [-12, 60]], 'rgba(40,40,40,0.25)', 1.2); }
        hatch([[-34, 20], [-6, 20], [-6, 90], [-34, 90]], 0.9, 3.4, back ? 0.2 : 0.28);
      } };
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: TE_TORSO, base: TE.maillot, seed: 8201, paint: () => {
        fillPts(box(-50, 6, 50, 50), TE.culotte); strokePts([[-40, 6], [40, 6]], 'rgba(255,255,255,0.18)', 1.2);
        fillPts([[-18, -184], [14, -184], [20, -164], [-16, -160]], TE.maillotD);                                   // col
        fillPts([[13, -170], [21, -170], [24, -134], [16, -134]], TE.maillotD); for (const y of [-162, -150, -140]) dot(19 + (y + 162) * 0.08, y, 2.4, '#e2d9c1');
        for (let x = -30; x <= 30; x += 6) strokePts([[x, -150], [x * 1.05, 4]], 'rgba(40,50,30,0.22)', 1);           // côtes de laine
        hatch([[-50, -170], [-12, -170], [-10, 6], [-50, 6]], 0.75, 4.2, 0.24); shade(36, -60, -40, -60, 0.3);
      } },
      collierB: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: 8202, pts: OFFP, extra: (p) => { if (p.collier) collierDraw('arriere'); } },
      armB_up: upDef([-10, -146], TE.maillotD, 8204),
      armB_lo: foreDef('armB_up', TE.maillotD, TE.peauD, true, 8205, { cuff: '#3c5530' }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: TE.peau, seed: 8206, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-12, -84], [-26, -80], [-34, -62], [-32, -44], [-24, -34], [-18, -50], [-12, -68]], TE.cheveux);
        X.earPaint(-8, -44); dot(14, -30, 8, 'rgba(200,110,90,0.18)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(50,30,18,0.95)', 2.6); X.mouth(f, 28, -24);
      }, extra: (p) => {
        const sw = clamp(p.sueur || 0); if (sw <= 0 || SIL()) return; const t = p.t || 0;
        for (let i = 0; i < 3; i++) {
          const u = (t * 0.55 + i * 0.33) % 1, x = [-4, 12, 26][i], y = [-70, -76, -66][i] + u * 34;
          fillPts([[x, y - 7], [x + 3.4, y + 1], [x, y + 4.5], [x - 3.4, y + 1]], `rgba(190,225,240,${0.9 * sw * (1 - u * 0.6)})`, 0, 0);
          strokePts([[x - 1, y - 2], [x - 1.5, y + 1]], `rgba(255,255,255,${0.8 * sw})`, 1);
        }
      } },
      casquette: { parent: 'head', at: [0, -84], noRivet: true, base: TE.casq, seed: 8207, pts: TE_CASQ, paint: () => {
        fillPts(box(-46, 1, 38, 9), TE.bande); fillPts([[35, 2], [52, 3], [57, 9], [36, 12]], TE.casqD);
        dot(-6, -18, 3, TE.casqD); hatch([[-46, -20], [-14, -20], [-14, 12], [-46, 12]], 0.8, 4, 0.2);
      } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: TE.moust, seed: 8208, pts: TE_MOUST, paint: () => strokePts([[18, -34], [34, -33]], 'rgba(255,255,255,0.18)', 1) },
      barbe: { parent: 'head', at: [0, 0], noRivet: true, base: TE.barbe, seed: 8209, pts: (p) => ((p.barbe || 0) > 0.02 ? barbePts(clamp(p.barbe)) : OFFP), paint: (p) => {
        const L = lerp(24, 236, clamp(p.barbe || 0));
        for (let i = 0; i < 9; i++) { const x = -8 + i * 5; strokePts([[x, -20], [x + 4 * Math.sin(i), L * 0.4], [x + 2 + i * 0.4, L * (0.7 + 0.25 * Math.sin(i * 1.7))]], i % 2 ? 'rgba(255,255,255,0.4)' : 'rgba(80,80,80,0.35)', 1.3); }
        hatch(null, 1.3, 4, 0.15, 1, P.encre, [-30, -50, 50, L + 10]);
      } },
      collierF: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: 8210, pts: OFFP, extra: (p) => { if (p.collier) collierDraw('avant'); } },
      armF_up: upDef([-2, -146], TE.maillot, 8211),
      armF_lo: foreDef('armF_up', TE.maillot, TE.peau, false, 8212, { cuff: TE.maillotD }),
    }, legParts(L, 8220), heldParts(TE.peau, 8230));
    let order = ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'collierB'].concat(LEGS, ['head', 'casquette', 'moustache', 'torso', 'barbe', 'collierF', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']);
    if (velo) {
      const vpart = (layer, seed) => ({ parent: null, at: [0, 0], noRivet: true, base: '#000', seed, pts: OFFP, extra: (p) => {
        if (!p._velo) return; const c = cx_(); c.save(); c.translate(-(p.dx || 0), HIP - (p.dy || 0)); c.rotate(-(p.tilt || 0)); drawVelo(p._velo, layer); c.restore(); } });
      parts.veloFond = vpart('fond', 8240); parts.velo = vpart('cadre', 8241); parts.veloAvant = vpart('avant', 8242);
      order = ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'veloFond', 'legB_up', 'legB_lo', 'piedB', 'velo', 'veloAvant', 'legF_up', 'legF_lo', 'piedF', 'head', 'casquette', 'moustache', 'torso', 'barbe', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2'];
    }
    return { hipY: -HIP, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: velo ? 'coureurVelo' : 'terront', order };
  }
  CH.pbrTerront = mkTerront(false);
  CH.pbrCoureurVelo = mkTerront(true);
  // gestes : marche, assis (+siege), fatigue, dort, victoire, essuie, ventre, croque (0..1 = bouchée ; porte 0..1), collier, barbe, sueur
  function terrontGestes(q, env) {
    const A = q.ang, t = q.t || 0;
    const fa = k01(q.fatigue), dor = k01(q.dort), vi = k01(q.victoire), es = k01(q.essuie), ve = k01(q.ventre);
    if (fa > 0) { plier(q, 0.12 * fa); A.head = (A.head || 0) + 0.12 * fa; blend(q, 'armF_up', -0.2, fa); blend(q, 'armB_up', -0.1, fa); if (!q.face.eyes) q.face.eyes = 'half'; if (!q.face.mouth) q.face.mouth = 'o'; }
    if (dor > 0) { A.head = (A.head || 0) + 0.5 * dor + 0.02 * Math.sin(t * 1.6) * dor; q.dy = (q.dy || 0) + 1.5 * Math.sin(t * 1.6) * dor; if (!q.face.eyes) q.face.eyes = 'closed'; }
    if (vi > 0) { blend(q, 'armF_up', -2.75, vi); blend(q, 'armF_lo', -0.3, vi); A.head = (A.head || 0) - 0.22 * vi; if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (es > 0) { armTo(q, 'armF', headPt(q, -16, -92), 'avant', es); if (!has(q.tenu)) q.handF = 'open'; A.head = (A.head || 0) + 0.06 * es; if (!q.face.eyes) q.face.eyes = 'half'; }
    if (ve > 0) { armTo(q, 'armF', [44, -36 + 5 * Math.max(0, Math.sin(t * 12))], 'bas', ve); if (!has(q.tenu)) q.handF = 'open'; if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (q.croque != null) {                                                    // le gâteau debout à deux mains, la bouche contre le bord du haut
      const k = q.porte == null ? 1 : k01(q.porte);
      A.head = (A.head || 0) + 0.24 * k;
      if (q.tenu == null) q.tenu = 'gateau';
      q.tenuO = Object.assign({ vue: 'debout' }, q.tenuO, { croque: clamp(q.croque), croqueA: -PI / 2 });
      const m = headPt(q, 31, -26), Cc = [lerp(110, m[0], k), lerp(-10, m[1] + PB.R - 2, k)], g = gGrip(q.tenuO);
      armTo(q, 'armF', [Cc[0] + g[0], Cc[1] + g[1]], 'bas', 1); q.deuxMains = q.deuxMains !== false;
      if (!q.face.mouth) q.face.mouth = 'o';
    }
  }
  PBR.terrontPose = function (p, env) {
    const q = prep(p);
    marche(q, k01(q.marche), q.t || 0);
    assis(q, env, k01(q.assis));
    terrontGestes(q, env);
    return finish(q);
  };
  PBR.terront = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s; o = o || {}; const env = { def: CH.pbrTerront, x, y, s, dir: o.dir || 1 };
    return run(CH.pbrTerront, PBR.terrontPose(Object.assign({}, pose), env), x, y, s, o);
  };
  // coureur à vélo : (x,y) = sol sous le pédalier ; pose.phase (tours de pédalier), pose.roue (rad, défaut d'après la phase), victoire, sueur, fatigue, barbe
  PBR.coureurVeloPose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0, ph = q.phase || 0, th = TAU * ph - PI / 2;
    const fa = k01(q.fatigue), tl = 0.45 + 0.06 * fa, Hb = [-70, -275 + 1.5 * Math.sin(th * 2)];
    q.tilt = tl;
    const H0 = rot(Hb, -tl); q.dx = H0[0]; q.dy = H0[1] + HIP;
    const toT = (P0) => rot([P0[0] - Hb[0], P0[1] - Hb[1]], -tl);
    for (const [Lg, hx, a] of [['F', 6, th], ['B', -6, th + PI]]) {
      const Pd = [VE.BB[0] + Math.cos(a) * VE.man, VE.BB[1] + Math.sin(a) * VE.man], ank = toT([Pd[0] - 22, Pd[1] - 14]);
      const s = ikL([hx, -2], ank, TH, SHN); A['leg' + Lg + '_up'] = s.a; A['leg' + Lg + '_lo'] = s.b;
      A['pied' + Lg] = -(s.a + s.b + tl) + 0.12 * Math.sin(a);
    }
    armTo(q, 'armB', toT(VE.gripB), 'bas', 1);
    armTo(q, 'armF', toT(VE.gripF), 'bas', 1);
    const vi = k01(q.victoire);
    if (vi > 0) { blend(q, 'armF_up', -2.7, vi); blend(q, 'armF_lo', -0.3, vi); if (!q.face.mouth) q.face.mouth = 'smile'; }
    A.head = (A.head || 0) - 0.42 - 0.2 * vi + 0.12 * fa;
    if (fa > 0) { if (!q.face.eyes) q.face.eyes = 'half'; if (!q.face.mouth) q.face.mouth = 'o'; }
    q._velo = { th, roue: q.roue != null ? q.roue : ph * TAU * 2.4 };
    return finish(q);
  };
  PBR.coureurVelo = (pose, x, y, s, o) => run(CH.pbrCoureurVelo, PBR.coureurVeloPose(Object.assign({}, pose)), x, y, s == null ? 0.9 : s, o);
  // vélo seul (sans tige) : (x,y) = sol sous le pédalier ; o.phase, o.roue, o.penche (rad, autour de (x,y)), o.dir, o.cast
  const veloDef = { hipY: 0, handLen: 10, rod: null, nom: 'velo', parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => drawVelo(p._velo, 'tout') } }, order: ['o'] };
  PBR.velo = (x, y, s, o) => {
    o = o || {}; s = s == null ? 0.9 : s; const ph = o.phase || 0;
    return M.puppet(veloDef, { _velo: { th: TAU * ph - PI / 2, roue: o.roue != null ? o.roue : ph * TAU * 2.4 }, tilt: o.penche || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: o.ombre !== false, cast: o.cast, alpha: o.alpha });
  };

  // =====================================================================
  // ACCESSOIRES SEULS (sans tige) — même dessin que tenu en main ; (x,y) = point posé (base) de l'objet
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, nom: name, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = Object.assign({}, o || {}); s = s == null ? 0.9 : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const b = vOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of ['journal', 'crayon', 'montre', 'plateau', 'poche', 'gateau']) PBR[n] = (x, y, s, o) => acc(n, x, y, s, o);
  // journal qui vole : feuille dépliée qui ondule ; (x,y) = centre ; o.rot, o.t (obligatoire), o.ondule (0..1, défaut 1), o.dir
  PBR.journalVole = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s; const cv = PBR.K && PBR.K.journal; if (!cv) return;
    const c = cx_(), amp = 16 * (o.ondule == null ? 1 : o.ondule), w = cv.width, h = cv.height, n = 14;
    c.save(); c.translate(x, y); c.rotate((o.rot || 0) + 0.12 * Math.sin(t * 2.3)); c.scale(s * (o.dir || 1), s);
    if (o.cast !== false) { c.save(); c.globalAlpha = 0.22; c.filter = 'blur(6px)'; c.drawImage(cv.shadow, -w / 2 + 6, -h / 2 + 10, w, h); c.restore(); }
    for (let i = 0; i < n; i++) {
      const u = i / n, sx = (i * w) / n, sw = w / n + 1, dy = amp * Math.sin(u * 5 - t * 7), sl = Math.cos(u * 5 - t * 7);
      c.drawImage(cv, sx, 0, sw, h, -w / 2 + sx, -h / 2 + dy, sw, h);
      c.fillStyle = `rgba(40,30,20,${Math.max(0, -sl) * 0.18})`; c.fillRect(-w / 2 + sx, -h / 2 + dy + 12, sw, h - 24);
    }
    c.restore();
  };

  // =====================================================================
  // DEVANTURE DE LA PÂTISSERIE DURAND (Maisons-Laffitte) — façade vert d'eau et crème, corniche, store rayé, grande vitrine à gauche
  // (étagères, présentoir au centre), porte vitrée à droite, enseigne dorée SANS inscription (couronne), réverbère ; banc à part.
  // Repères en px écran à l'échelle 1, relatifs au centre bas de la façade (posée sur ST.back)
  // =====================================================================
  const DV = { w: 900, h: 830, vit: [-420, -60], vitY: [-640, -150], pres: { x: -240, y: -438 }, porte: [80, 260], porteY: -600, reverbere: 400, banc: -250 };
  PBR.DEV = DV;
  const FA = { vert: '#a9c4b5', vertD: '#86a596', vertDD: '#5f7f70', creme: '#ece2c6', cremeD: '#d3c6a2', or: '#c9a14b', orD: '#9a7a33', bois: '#6b4a2e', vitreN: '#2b2f33', store1: '#a3352b', store2: '#efe6d0' };
  function drawFacade(x) {
    const W2 = DV.w / 2;
    // corps de la façade
    pc(box(-W2, -DV.h, W2, 0), FA.vert, () => {
      for (let y = -DV.h + 30; y < 0; y += 28) strokePts([[-W2, y], [W2, y]], 'rgba(60,90,80,0.12)', 1);
      hatch(null, 0.8, 7, 0.06, 1, P.encre, [-W2, -DV.h, W2, 0]);
    }, 7401);
    pc(box(-W2, -150, W2, 0), FA.vertDD, () => { for (const xx of [-300, -120, 300]) strokePts([[xx, -140], [xx, -10]], 'rgba(255,255,255,0.15)', 1.5); hatch(null, 0.3, 6, 0.15); }, 7402);   // soubassement
    for (const [x0, x1] of [[-W2, -430], [-50, 70], [270, W2]]) pc(box(x0, -DV.h + 40, x1, -150), FA.creme, () => { strokePts([[x0 + 8, -DV.h + 50], [x0 + 8, -160]], 'rgba(120,100,60,0.35)', 1.5); shade(x0, 0, x1, 0, 0.18, [x0, -900, x1, 0]); }, 7403 + x0);   // pilastres
    // corniche moulurée + entablement
    pc([[-W2 - 20, -DV.h - 6, 1], [W2 + 20, -DV.h - 6, 1], [W2 + 10, -DV.h + 20, 1], [-W2 - 10, -DV.h + 20, 1]], FA.creme, () => { strokePts([[-W2, -DV.h + 6], [W2, -DV.h + 6]], 'rgba(120,100,60,0.5)', 2); }, 7410);
    pc(box(-W2 - 8, -DV.h + 20, W2 + 8, -DV.h + 40), FA.cremeD, () => { for (let xx = -W2; xx < W2; xx += 22) dot(xx + 11, -DV.h + 30, 4, 'rgba(120,100,60,0.45)'); }, 7411);
    // enseigne de bois doré sans inscription : couronne au centre, rinceaux
    pc(box(-380, -775, 380, -690), FA.or, () => {
      fillPts(box(-366, -763, 366, -702), '#b38c3c'); strokePts([[-366, -763], [366, -763], [366, -702], [-366, -702], [-366, -763]], FA.orD, 2);
      fillPts([[-34, -712], [34, -712], [40, -748], [24, -730], [12, -756], [0, -734], [-12, -756], [-24, -730], [-40, -748]], '#e6c56b');   // couronne royale
      for (const xx of [-40, -12, 12, 40]) dot(xx * 1.0, xx === -40 || xx === 40 ? -750 : -758, 4, '#f3dc94');
      fillPts(box(-34, -718, 34, -710), '#a8822f');
      strokePts([[-340, -732], [-70, -732]], '#e6c56b', 2.4); strokePts([[70, -732], [340, -732]], '#e6c56b', 2.4);
      for (const sg of [-1, 1]) for (let i = 0; i < 7; i++) { const cx0 = sg * (88 + i * 38); for (const v of [-1, 1]) fillPts([[cx0, -732], [cx0 + sg * 8, -732 + v * 11], [cx0 + sg * 20, -732 + v * 12], [cx0 + sg * 12, -732 + v * 3]], '#e6c56b', 0, 0); }   // rameaux de feuilles
      for (const sg of [-1, 1]) fillPts([[sg * 352, -744], [sg * 362, -732], [sg * 352, -720], [sg * 342, -732]], '#e6c56b', 0, 0);
      shade(0, -775, 0, -690, 0.25, [-380, -780, 380, -690]);
    }, 7412);
    // grande vitrine (cadre de bois vert foncé), intérieur sombre et chaud, étagères
    pc(box(DV.vit[0] - 14, DV.vitY[0] - 14, DV.vit[1] + 14, DV.vitY[1] + 14), FA.vertDD, null, 7420);
    pc(box(DV.vit[0], DV.vitY[0], DV.vit[1], DV.vitY[1]), '#3b3328', () => {
      const c = cx_(), g = c.createLinearGradient(0, DV.vitY[0], 0, DV.vitY[1]); g.addColorStop(0, '#4a3b2a'); g.addColorStop(1, '#2c241c');
      c.fillStyle = g; c.fillRect(DV.vit[0], DV.vitY[0], DV.vit[1] - DV.vit[0], DV.vitY[1] - DV.vitY[0]);
      for (let xx = DV.vit[0] + 20; xx < DV.vit[1]; xx += 26) strokePts([[xx, DV.vitY[0]], [xx, DV.vitY[1]]], 'rgba(255,220,160,0.05)', 6);
    }, 7421);
    const sh = (y) => pc(box(DV.vit[0] + 6, y, DV.vit[1] - 6, y + 10), '#b89a6a', () => strokePts([[DV.vit[0] + 6, y + 2], [DV.vit[1] - 6, y + 2]], 'rgba(255,240,200,0.5)', 1.5), 7430 + y);
    sh(-540); sh(-300); sh(-168);
    // pâtisseries aux couleurs franches : éclairs (haut), tartes et choux (milieu, de part et d'autre du présentoir)
    const ecl = ['#5a3420', '#d77a9a', '#7a4a2a', '#e0c04a', '#5a3420', '#d77a9a'];
    ecl.forEach((col, i) => { const x0 = DV.vit[0] + 22 + i * 56; pc([[x0, -560], [x0 + 44, -560], [x0 + 48, -548], [x0 + 44, -541], [x0, -541], [x0 - 4, -550]], '#d9a65a', () => fillPts([[x0, -560], [x0 + 44, -560], [x0 + 46, -553], [x0 - 2, -553]], col), 7440 + i); });
    for (const [tx, col] of [[-385, '#b52a3a'], [-325, '#e3a12e']]) { pc(ep(tx, -312, 26, 9, 10, 0, PI).concat(ep(tx, -322, 26, 9, 10, PI, 0)), '#cf9a52', () => { fillPts(ell(tx, -322, 22, 7, 12), col); for (let i = 0; i < 6; i++) dot(tx - 15 + i * 6, -323 + (i % 2) * 2, 2.4, 'rgba(255,255,255,0.4)'); }, 7450 + tx); }
    [['#e58bb0', -160], ['#9cc06a', -122], ['#f0d24f', -86], ['#6b3d24', -141]].forEach(([col, cx0], i) => { const cy0 = i === 3 ? -340 : -318; pc(ell(cx0, cy0, 16, 14, 12), '#d9a65a', () => fillPts(ep(cx0, cy0 - 2, 16, 10, 8, PI, TAU).concat([[cx0 + 16, cy0 - 1]]), col), 7460 + i); });
    // présentoir sur pied (doré)
    const pr = DV.pres;
    pc([[pr.x - 40, -300, 1], [pr.x + 40, -300, 1], [pr.x + 22, -316], [pr.x + 8, -322], [pr.x + 6, pr.y + 10], [pr.x + 14, pr.y + 4], [pr.x - 14, pr.y + 4], [pr.x - 6, pr.y + 10], [pr.x - 8, -322], [pr.x - 22, -316]], FA.or, () => { strokePts([[pr.x - 3, pr.y + 12], [pr.x - 3, -320]], 'rgba(255,240,190,0.6)', 2); }, 7470);
    pc(ep(pr.x, pr.y, 96, 16, 16, 0, PI).concat(ep(pr.x, pr.y - 6, 96, 16, 16, PI, 0)), FA.or, () => { fillPts(ell(pr.x, pr.y - 6, 84, 12, 16), '#e0bf68'); }, 7471);
    // porte : encadrement, ouverture sombre (le battant est dessiné à part)
    pc(box(DV.porte[0] - 14, DV.porteY - 14, DV.porte[1] + 14, 0), FA.vertDD, null, 7480);
    pc(box(DV.porte[0], DV.porteY, DV.porte[1], 0), '#2a211a', () => {
      const c = cx_(), g = c.createRadialGradient(170, -250, 20, 170, -250, 260); g.addColorStop(0, 'rgba(255,200,120,0.55)'); g.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = g; c.fillRect(DV.porte[0], DV.porteY, DV.porte[1] - DV.porte[0], -DV.porteY);
      pc(box(110, -260, 230, -230), '#6b4a2e', null, 7482);                                                         // comptoir au fond
    }, 7481);
    pc(box(DV.porte[0] - 14, DV.porteY - 90, DV.porte[1] + 14, DV.porteY - 14), FA.vertDD, () => { fillPts(box(DV.porte[0] + 6, DV.porteY - 80, DV.porte[1] - 6, DV.porteY - 22), 'rgba(200,225,230,0.45)'); for (let i = 1; i < 5; i++) strokePts([[DV.porte[0] + i * 36, DV.porteY - 80], [DV.porte[0] + i * 36, DV.porteY - 22]], FA.vertDD, 3); }, 7483);   // imposte
    // fenêtre de l'étage à droite de la porte, volets crème
    pc(box(300, -600, 420, -380), '#3e4a4f', () => { fillPts(box(306, -594, 414, -386), 'rgba(170,200,210,0.35)'); strokePts([[360, -594], [360, -386]], FA.vertDD, 4); strokePts([[306, -490], [414, -490]], FA.vertDD, 4); }, 7490);
  }
  function drawStore() {                                                       // store rayé rouge et ivoire, au-dessus de la vitrine, festonné
    const x0 = DV.vit[0] - 24, x1 = DV.vit[1] + 24, y0 = -686, y1 = -616, n = 12, wst = (x1 - x0) / n;
    const pts = [[x0 + 10, y0, 1], [x1 - 10, y0, 1], [x1 + 8, y1, 1]];
    for (let i = n; i >= 0; i--) { pts.push([x0 - 8 + i * (wst + 16 / n) + wst / 2, y1 + 18]); pts.push([x0 - 8 + i * (wst + 16 / n), y1, 1]); }
    pc(pts, FA.store2, () => {
      for (let i = 0; i < n; i += 2) fillPts([[x0 + 10 + i * (x1 - x0 - 20) / n, y0, 1], [x0 + 10 + (i + 1) * (x1 - x0 - 20) / n, y0, 1], [x0 - 8 + (i + 1) * (wst + 16 / n), y1 + 30, 1], [x0 - 8 + i * (wst + 16 / n), y1 + 30, 1]], FA.store1);
      shade(0, y0, 0, y1 + 20, 0.3, [x0 - 20, y0, x1 + 20, y1 + 30]);
    }, 7500);
    for (const xx of [x0 + 4, x1 - 4]) tube([xx, y0 + 6], [xx + (xx < 0 ? -10 : 10), y1 - 4], 4, '#2b2b2b', 7501);
  }
  function drawReflets() {                                                     // reflets de la vitre (par-dessus le présentoir)
    if (SIL()) return; const c = cx_();
    c.save(); c.beginPath(); c.rect(DV.vit[0], DV.vitY[0], DV.vit[1] - DV.vit[0], DV.vitY[1] - DV.vitY[0]); c.clip();
    c.fillStyle = 'rgba(220,240,245,0.08)'; c.fillRect(DV.vit[0], DV.vitY[0], 400, 600);
    for (const [xa, wa] of [[-380, 40], [-320, 14], [-150, 60], [-100, 18]]) { c.beginPath(); c.moveTo(xa, DV.vitY[0]); c.lineTo(xa + wa, DV.vitY[0]); c.lineTo(xa + wa - 160, DV.vitY[1]); c.lineTo(xa - 160, DV.vitY[1]); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.10)'; c.fill(); }
    c.restore();
  }
  function drawBattant() {                                                     // battant de la porte (repère : charnière à droite, x 0)
    const w = DV.porte[1] - DV.porte[0];
    pc(box(-w, DV.porteY, 0, 0), FA.vertD, () => {
      fillPts(box(-w + 16, DV.porteY + 16, -16, -250), 'rgba(190,215,220,0.55)'); strokePts([[-w + 30, DV.porteY + 40], [-w + 70, DV.porteY + 20]], 'rgba(255,255,255,0.45)', 3);
      fillPts(box(-w + 16, -230, -16, -20), FA.vertDD); strokePts([[-w + 26, -220], [-26, -220], [-26, -30], [-w + 26, -30], [-w + 26, -220]], 'rgba(255,255,255,0.15)', 2);
      dot(-w + 22, -300, 6, FA.or);
    }, 7520);
  }
  function drawBanc() {                                                        // banc de bois (échelle 0,9 = celle des marionnettes) ; (0,0) = sol au centre
    const L = 150, Hs = BANC_H;
    for (const xx of [-L + 20, L - 20]) { pc([[xx - 8, 0, 1], [xx + 8, 0, 1], [xx + 6, -Hs, 1], [xx - 6, -Hs, 1]], '#3a2b1e', null, 7600 + xx); pc([[xx - 6, -Hs, 1], [xx + 6, -Hs, 1], [xx + 2, -Hs - 100, 1], [xx - 10, -Hs - 100, 1]], '#3a2b1e', null, 7610 + xx); }
    pc(box(-L, -Hs - 8, L, -Hs + 6), FA.bois, () => { strokePts([[-L, -Hs - 4], [L, -Hs - 4]], 'rgba(255,220,180,0.3)', 1.5); hatch(null, 0.05, 4, 0.2); }, 7620);
    for (const y of [-Hs - 46, -Hs - 84]) pc(box(-L + 4, y, L - 4, y + 22), '#7a5636', () => { hatch(null, 0.05, 4, 0.2); strokePts([[-L + 4, y + 3], [L - 4, y + 3]], 'rgba(255,220,180,0.25)', 1.2); }, 7630 + y);
  }
  function drawReverbere() {                                                   // réverbère de fonte ; (0,0) = pied
    pc([[-26, 0, 1], [26, 0, 1], [20, -30], [12, -60], [-12, -60], [-20, -30]], '#2a2e2c', null, 7700);
    pc([[-9, -60, 1], [9, -60, 1], [7, -560, 1], [-7, -560, 1]], '#2f3432', () => { for (const x of [-3, 3]) strokePts([[x, -70], [x, -550]], 'rgba(255,255,255,0.12)', 1.2); }, 7701);
    pc(box(-36, -572, 36, -560), '#2a2e2c', null, 7702);
    pc([[-24, -572, 1], [24, -572, 1], [30, -640, 1], [-30, -640, 1]], '#d9c88a', () => { strokePts([[0, -572], [0, -640]], '#2a2e2c', 3); strokePts([[-27, -606], [27, -606]], '#2a2e2c', 2); }, 7703);
    pc([[-40, -640, 1], [40, -640, 1], [20, -664], [0, -672], [-20, -664]], '#2a2e2c', () => dot(0, -676, 5, '#2a2e2c'), 7704);
  }
  // toile de fond : ciel d'ouest pâle, toits et arbres de Maisons-Laffitte
  function drawToile(c, nuit) {
    const W = M.W, Hh = M.ST.back + 5, g = c.createLinearGradient(0, 0, 0, Hh);
    if (nuit) { g.addColorStop(0, '#1d2340'); g.addColorStop(0.6, '#2f3658'); g.addColorStop(1, '#45476a'); }
    else { g.addColorStop(0, '#b9c9cf'); g.addColorStop(0.45, '#e2d9be'); g.addColorStop(1, '#efd6a8'); }
    c.fillStyle = g; c.fillRect(0, 0, W, Hh);
    if (nuit) { const R = M.rng(91); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,250,220,${0.4 + R() * 0.5})`; c.beginPath(); c.arc(R() * W, R() * 560, 1 + R() * 1.6, 0, TAU); c.fill(); } }
    const k = nuit ? 0.45 : 1, col = (a, b) => (nuit ? b : a);
    // arbres ronds et peupliers au loin
    for (let i = 0; i < 16; i++) { const x = 30 + i * 70 + (hash(i) - 0.5) * 30, y = 560 + hash(i + 3) * 40, r = 40 + hash(i + 7) * 30; M.piece(ell(x, y, r, r * 1.1, 14), col('#8a9a72', '#3a4258'), null, { seed: 7800 + i, texA: 0.5 }); }
    for (const x of [90, 470, 1000]) M.piece([[x - 16, 640], [x - 12, 470], [x, 400], [x + 12, 470], [x + 16, 640]], col('#6f8160', '#323a50'), null, { seed: 7820 + x });
    // villas : murs crème, toits d'ardoise et de tuile, cheminées
    const villas = [[40, 560, 170, 0], [240, 590, 140, 1], [430, 570, 160, 0], [640, 585, 150, 1], [850, 565, 190, 0]];
    for (const [x, y, w, tk] of villas) {
      M.piece(box(x, y, x + w, 900), col('#e3d6b6', '#4b4d68'), () => { for (let j = 0; j < Math.floor(w / 50); j++) fillPts(box(x + 18 + j * 50, y + 40, x + 38 + j * 50, y + 76), col('#5a6a72', nuit ? '#e8c46a' : '#5a6a72')); }, { seed: 7830 + x });
      M.piece([[x - 12, y + 4, 1], [x + w + 12, y + 4, 1], [x + w - 20, y - 50, 1], [x + 20, y - 50, 1]], col(tk ? '#a8573a' : '#5d6670', '#2c3044'), () => hatch(null, 0.0, 6, 0.2), { seed: 7840 + x });
      M.piece(box(x + w * 0.7, y - 76, x + w * 0.7 + 16, y - 40), col('#9a5a40', '#2c3044'), null, { seed: 7850 + x });
    }
    if (!nuit) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(230,215,190,0.35)'; c.fillRect(0, 420, W, 500); c.restore(); }
  }
  function drawSoleil(c) { M.piece(ell(0, -60, 58, 58, 24), '#e9a640', () => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[Math.cos(a) * 30, -60 + Math.sin(a) * 30], [Math.cos(a) * 52, -60 + Math.sin(a) * 52]], 'rgba(200,110,30,0.6)', 2.5); } dot(0, -60, 26, '#f2c060'); }, { seed: 7900 }); }
  function drawLune(c) { M.piece([[-10, -116], [26, -100], [44, -60], [26, -20], [-10, -4], [8, -26], [16, -60], [8, -94]], '#ece6c8', () => { dot(18, -70, 5, 'rgba(150,140,110,0.4)'); dot(28, -44, 3.4, 'rgba(150,140,110,0.4)'); }, { seed: 7901 }); }

  PBR.init = function () {
    const K = (PBR.K = {});
    K.toile = M.pre(M.W, M.ST.back + 5, (c) => drawToile(c, false));
    K.toileNuit = M.pre(M.W, M.ST.back + 5, (c) => drawToile(c, true));
    K.facade = M.cutFlat(DV.w + 60, DV.h + 40, (DV.w + 60) / 2, DV.h + 30, () => drawFacade()); K.facade.padB = 10;
    K.facadeNuit = M.pre(K.facade.width, K.facade.height, (c) => { c.drawImage(K.facade, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(25,30,70,0.5)'; c.fillRect(0, 0, c.canvas.width, c.canvas.height); }); K.facadeNuit.padB = 10;
    K.store = M.cutFlat(DV.w + 60, DV.h + 40, (DV.w + 60) / 2, DV.h + 30, () => drawStore()); K.store.padB = 10;
    K.reflets = M.cutFlat(DV.w + 60, DV.h + 40, (DV.w + 60) / 2, DV.h + 30, () => drawReflets()); K.reflets.padB = 10;
    K.battant = M.cutFlat(DV.porte[1] - DV.porte[0] + 20, -DV.porteY + 20, DV.porte[1] - DV.porte[0] + 10, -DV.porteY + 10, () => drawBattant()); K.battant.padB = 10;
    K.banc = M.withShadow(M.cutFlat(340, 240, 170, 230, () => drawBanc()), 8); K.banc.padB = 10;
    K.reverbere = M.withShadow(M.cutFlat(120, 700, 60, 690, () => drawReverbere()), 8); K.reverbere.padB = 10;
    K.soleil = M.withShadow(M.cutFlat(140, 140, 70, 135, () => drawSoleil()), 6); K.soleil.padB = 5;
    K.lune = M.withShadow(M.cutFlat(110, 140, 45, 135, () => drawLune()), 6); K.lune.padB = 5;
    K.journal = M.withShadow(M.cutFlat(270, 360, 135, 180, () => drawJournal({ etat: 'deplie' })), 6);
    return K;
  };
  const nuitDe = (a) => M.smooth(0.3, 0.7, clamp(a || 0));
  // toile de fond + soleil et lune de carton sur fils ; o.astre 0 = jour (soleil haut) … 1 = nuit (lune haute)
  PBR.toile = function (t, o) {
    o = o || {}; const K = PBR.K, c = cx_(), a = clamp(o.astre || 0), n = nuitDe(a);
    c.drawImage(K.toile, 0, 0);
    if (n > 0) { c.save(); c.globalAlpha = n; c.drawImage(K.toileNuit, 0, 0); c.restore(); }
    const sy = lerp(470, 820, ease(clamp(a / 0.6))), ly = lerp(-60, 460, ease(clamp((a - 0.4) / 0.6)));
    M.hung(K.soleil, o.soleilX || 790, sy, t, { f: 0.9, amp: 0.03 });
    if (a > 0.38) M.hung(K.lune, o.luneX || 270, ly, t, { f: 0.8, ph: 1, amp: 0.03 });
  };
  // façade (sans le banc) : o.porte 0..1, o.gateau (false | true | 'amandes'|'creme'|'choux'), o.astre (nuit), o.reverbere (true)
  PBR.devanture = function (t, x, y, o) {
    o = o || {}; const K = PBR.K, c = cx_(), n = nuitDe(o.astre);
    M.flat(K.facade, x, y);
    if (n > 0) M.flat(K.facadeNuit, x, y, { alpha: n });
    if (o.gateau) { c.save(); c.translate(x + DV.pres.x, y + DV.pres.y - 6); c.scale(0.62, 0.62); c.translate(0, -23); drawGateau({ etat: o.gateau === true ? 'amandes' : o.gateau, incl: 1 }); c.restore(); }
    M.flat(K.reflets, x, y);
    const ou = clamp(o.porte || 0), sc = Math.max(0.25, Math.cos(ou * 1.25));          // battant (charnière à droite), jamais plus fin que 0,25
    c.save(); c.translate(x + DV.porte[1], y); c.scale(sc, 1); M.flat(K.battant, -(DV.porte[1] - DV.porte[0]) / 2, 0, { alpha: 1 }); if (ou > 0) { c.fillStyle = `rgba(20,15,10,${0.35 * ou})`; c.fillRect(-(DV.porte[1] - DV.porte[0]), DV.porteY, DV.porte[1] - DV.porte[0], -DV.porteY); } c.restore();
    M.flat(K.store, x, y);
    if (n > 0.05) { c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(x + DV.vit[0] / 2 + DV.vit[1] / 2, y - 400, 20, x - 240, y - 400, 260); g.addColorStop(0, `rgba(255,190,110,${0.35 * n})`); g.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = g; c.fillRect(x - 520, y - 700, 600, 600); c.restore(); }
    if (o.reverbere !== false) {
      M.flat(K.reverbere, x + DV.reverbere, y, { cast: { a: 0.3, dx: 14, dy: 6 } });
      if (n > 0.05) { c.save(); c.globalCompositeOperation = 'screen'; const lx = x + DV.reverbere, ly = y - 606, g = c.createRadialGradient(lx, ly, 6, lx, ly, 180); g.addColorStop(0, `rgba(255,220,140,${0.8 * n})`); g.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = g; c.fillRect(lx - 180, ly - 180, 360, 360); c.restore(); }
    }
  };
  // point écran d'un repère de la façade posée en (x,y) : 'presentoir' (dessus), 'porte' (seuil, milieu), 'vitrine' (centre), 'enseigne', 'reverbere'
  PBR.devPt = function (x, y, nom) {
    const m = { presentoir: [DV.pres.x, DV.pres.y - 6], porte: [(DV.porte[0] + DV.porte[1]) / 2, 0], vitrine: [(DV.vit[0] + DV.vit[1]) / 2, (DV.vitY[0] + DV.vitY[1]) / 2], enseigne: [0, -732], reverbere: [DV.reverbere, -606] }[nom];
    return m ? [x + m[0], y + m[1]] : null;
  };
  // banc (à dessiner APRÈS M.drawFloor, avant les marionnettes) : (x,y) = sol (mêmes y et s que le coureur assis : FEET, 0,9)
  PBR.banc = function (x, y, s, o) { o = o || {}; s = s == null ? 0.9 : s; M.flat(PBR.K.banc, x, y, { scale: s, cast: o.cast }); };
  PBR.BANC = { h: BANC_H, demiLong: 150 };
})();
