// persos.js — « Le Beau Danube bleu, la valse que Brahms enviait » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.dan (alias DAN). Appeler DAN.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo. Déterministe (aucun Math.random).
// MARIONNETTES : DAN.strauss / brahms / viennois / viennoise (pose,x,y,s,o) — toujours par l'enveloppe (elle calcule les gestes avec M.ik).
// ACCESSOIRES (x,y,s,o) : eventail, gueridon, note, portee, portraitStrauss. DÉCORS : DAN.init() → DAN.K = { salle, salon, lustre } ; DAN.lustre(t,o).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, ST = M.ST;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease } = M;
  const CH = M.chars;
  const DAN = (M.dan = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const has = (v) => v && v !== 'rien';

  // ------------------------------------------------------------ géométrie, couleurs
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const hx = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixh = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(clamp(v + (B[i] - v) * k, 0, 255)).toString(16).padStart(2, '0')).join(''); };
  const dk = (c, k) => mixh(c, '#000000', k), lt = (c, k) => mixh(c, '#ffffff', k);
  // contour bosselé (boucles de cheveux, barbe) : un point milieu poussé vers l'extérieur à chaque segment
  function bumpy(pts, amp, seed) {
    const o = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]; o.push(a);
      const nx = b[1] - a[1], ny = -(b[0] - a[0]), l = Math.hypot(nx, ny) || 1, k = amp * (0.7 + 0.6 * M.hash(seed + i * 7.3));
      o.push([(a[0] + b[0]) / 2 + nx / l * k, (a[1] + b[1]) / 2 + ny / l * k]);
    }
    o.push(pts[pts.length - 1]); return o;
  }
  const OR = { or: '#c8a24a', orL: '#e8cf86', orD: '#8a6a28' };
  const INK = 'rgba(52,32,18,0.92)';

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le rivet). Main = point [0,96] de l'avant-bras.
  const RC = 11.5, LA = 96, HL = 96;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [RC + 0.5, len - 6]], ep(0, len, RC, RC, 10, 0, PI), [[-RC - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, RC, RC, 10, PI, TAU).concat(f.slice(2)); }

  // =====================================================================
  // OBJETS — dessinés dans leur repère (échelle 1) : seuls (accessoires) ou tenus (pièce 'objet' de l'avant-bras)
  // =====================================================================
  // ---------------- éventail de dentelle crème à baguettes de bois ; origine = rivet (pivot) ; la feuille s'ouvre vers le haut
  const EV = { r0: 0.36, staff0: 0.56, staffD: 0.06, notes: [[0.16, -1], [0.25, -1], [0.34, 1], [0.43, 3], [0.52, 3], [0.64, 7], [0.72, 7], [0.81, 5], [0.89, 5]] };
  function evGeom(o) {
    const R = 105 * (o.taille || 1), ov = clamp(o.ouvre == null ? 1 : o.ouvre), span = lerp(0.16, PI, ease(ov));
    const rot = clamp(o.battre || 0) * 0.3 * Math.sin((o.t || 0) * 13);
    return { R, span, a0: -PI / 2 - span / 2, rot };
  }
  const evAng = (g, u) => g.a0 + u * g.span;
  const evPt = (g, u, rr) => { const a = evAng(g, u); return [Math.cos(a) * rr, Math.sin(a) * rr]; };
  function evScribble(g, k) {                                                                // griffonnage sous la portée (ondulé, sans lettre)
    const o = [], n = Math.max(2, Math.round(60 * k));
    for (let i = 0; i <= n; i++) { const u = 0.14 + 0.72 * k * i / n, j = i * 0.9; o.push(evPt(g, u, g.R * (0.455 + 0.028 * Math.sin(j * 1.9) * (0.6 + 0.4 * Math.sin(j * 0.31))))); }
    return o;
  }
  function drawEventail(o) {
    const g = evGeom(o), R = g.R, c = cx_(), sg = clamp(o.signe || 0), l2 = clamp(o.ligne2 || 0);
    c.save(); c.rotate(g.rot);
    const N = 15, r0 = EV.r0 * R;
    pc([[-5, 0], [5, 0], [4, 24, 1], [-4, 24, 1]], '#6b4a2c', null, 8101);                  // manche (baguettes réunies)
    for (let i = 0; i < N; i++) { const p = evPt(g, i / (N - 1), r0 * 1.04); fillPts([[-2.5, 0], [2.5, 0], [p[0] + 2.2, p[1]], [p[0] - 2.2, p[1]]], i % 2 ? '#7a5634' : '#5f4128', 0, 0); }
    const leaf = [], NS = 2 * N - 2;
    for (let i = 0; i <= NS; i++) leaf.push(evPt(g, i / NS, R * (i % 2 ? 0.965 : 1.0)));
    for (let i = NS; i >= 0; i--) leaf.push(evPt(g, i / NS, r0));
    pc(leaf, '#efe5cc', () => {
      for (let i = 0; i < N - 1; i++) {                                                       // plis alternés
        const a = evPt(g, i / (N - 1), r0), b = evPt(g, i / (N - 1), R * 1.02), cc = evPt(g, (i + 1) / (N - 1), R * 1.02), d = evPt(g, (i + 1) / (N - 1), r0);
        fillPts([a, b, cc, d], i % 2 ? 'rgba(120,96,60,0.16)' : 'rgba(255,255,245,0.25)', 0, 0);
      }
      for (let i = 0; i < 46; i++) { const u = (i + 0.5) / 46; dot(...evPt(g, u, R * 0.9), R * 0.016, 'rgba(150,128,92,0.55)'); dot(...evPt(g, u, R * 0.94), R * 0.009, 'rgba(150,128,92,0.45)'); }
      strokePts(ep(0, 0, R * 0.865, R * 0.865, 30, g.a0, g.a0 + g.span), 'rgba(150,128,92,0.6)', 1.1);
      strokePts(ep(0, 0, R * 0.4, R * 0.4, 24, g.a0, g.a0 + g.span), 'rgba(150,128,92,0.5)', 1);
      if (sg > 0) {                                                                           // portée de cinq lignes, tracée de gauche à droite
        for (let k = 0; k < 5; k++) { const rr = R * (EV.staff0 + k * EV.staffD); strokePts(ep(0, 0, rr, rr, 30, evAng(g, 0.1), evAng(g, 0.1 + 0.8 * sg)), INK, 1.25); }
        for (const ub of [0.585, 0.94]) if (sg > (ub - 0.1) / 0.8 + 0.02 && ub < 0.9) strokePts([evPt(g, ub, R * EV.staff0), evPt(g, ub, R * (EV.staff0 + 4 * EV.staffD))], INK, 1.4);
        for (const [u, k] of EV.notes) {
          if (sg < (u - 0.1) / 0.8 + 0.03) continue;
          const rr = R * (EV.staff0 + k * EV.staffD / 2), a = evAng(g, u), h = [Math.cos(a) * rr, Math.sin(a) * rr];
          const rx = R * 0.034, ry = R * 0.024, tg = a + PI / 2 - 0.35;
          fillPts(ell(0, 0, 1, 1, 10).map(([x, y]) => [h[0] + x * rx * Math.cos(tg) - y * ry * Math.sin(tg), h[1] + x * rx * Math.sin(tg) + y * ry * Math.cos(tg)]), INK, 0, 0);
          const tx = -Math.sin(a), ty = Math.cos(a), sx = h[0] + tx * rx * 0.85, sy = h[1] + ty * rx * 0.85;
          strokePts([[sx, sy], [sx + Math.cos(a) * R * 0.13, sy + Math.sin(a) * R * 0.13]], INK, 1.3);
        }
      }
      if (l2 > 0) strokePts(evScribble(g, l2), 'rgba(52,32,18,0.85)', 1.2);
      hatch(null, 1.2, 4.2, 0.1, 1, P.encre, [-R, -R, R, 4]);
    }, 8102, { texA: 0.35 });
    for (const u of [0, 1]) { const p = evPt(g, u, R * 1.01), q = evPt(g, u, 6), nx = -(p[1] - q[1]), ny = p[0] - q[0], l = Math.hypot(nx, ny) || 1, w = 3.4; pc([[q[0] + nx / l * w, q[1] + ny / l * w], [p[0] + nx / l * w * 0.7, p[1] + ny / l * w * 0.7], [p[0] - nx / l * w * 0.7, p[1] - ny / l * w * 0.7], [q[0] - nx / l * w, q[1] - ny / l * w]], '#6e4b2c', null, 8103 + u); }
    pc(ell(0, 0, 5.5, 5.5, 10), '#c8a24a', () => dot(-1.5, -1.5, 2, '#f0d890'), 8105);
    c.restore();
  }
  function evEcrit(o) {                                                                        // point où écrit la plume (suit signe, puis ligne2)
    const g = evGeom(o), sg = clamp(o.signe || 0), l2 = clamp(o.ligne2 || 0);
    let p;
    if (l2 > 0) { const s = evScribble(g, l2); p = s[s.length - 1]; } else p = evPt(g, 0.1 + 0.8 * sg, g.R * (EV.staff0 + 2 * EV.staffD));
    const cs = Math.cos(g.rot), sn = Math.sin(g.rot); return [p[0] * cs - p[1] * sn, p[0] * sn + p[1] * cs];
  }

  // ---------------- guéridon : petite table ronde d'acajou, pied tourné et trois pieds galbés ; origine = sol
  function drawGueridon() {
    pc([[-6, -2, 1], [-40, -4], [-62, 0, 1], [-60, -8], [-34, -18], [-14, -36], [14, -36], [34, -18], [60, -8], [62, 0, 1], [40, -4], [6, -2, 1]], '#4a2a1c', () => { hatch(null, 0.8, 3.6, 0.3); strokePts([[-56, -6], [-34, -15]], 'rgba(255,220,180,0.3)', 1.3); }, 8201);
    pc([[-11, -30], [11, -30], [16, -60], [10, -86], [8, -130], [16, -150], [14, -176], [-14, -176], [-16, -150], [-8, -130], [-10, -86], [-16, -60]], '#5a3322', () => {
      fillPts(rect(-30, -66, 30, -54), '#c8a24a'); fillPts(rect(-30, -160, 30, -152), '#c8a24a');
      hatch([[2, -180], [20, -180], [20, -20], [2, -20]], 0.9, 3.4, 0.35); strokePts([[-6, -170], [-4, -40]], 'rgba(255,220,180,0.28)', 1.4);
    }, 8202);
    pc([[-80, -176, 1], [80, -176, 1], [76, -186], [86, -192], [88, -200, 1], [-88, -200, 1], [-86, -192], [-76, -186]], '#5f3624', () => {
      strokePts([[-84, -196], [84, -196]], 'rgba(255,225,190,0.35)', 1.4); fillPts(rect(-80, -186, 80, -182), '#c8a24a'); hatch(null, 0.2, 4, 0.25);
    }, 8203);
  }

  // ---------------- note de musique en carton doré ; origine = centre de la tête de note
  function noteHead(x, y, seed) { pc(ell(x, y, 21, 14, 14).map(([px, py]) => { const a = -0.38, dx = px - x, dy = py - y; return [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)]; }), OR.or, () => { dot(x - 6, y - 4, 4, 'rgba(255,240,190,0.6)'); hatch(null, 0.9, 3.4, 0.2); }, seed); }
  function drawNote(o) {
    const t = o.t || 0, ph = o.ph || 0, ty = o.type || 'croche', c = cx_();
    c.save(); c.translate(0, 6 * Math.sin(t * 2.1 + ph)); c.rotate(0.1 * Math.sin(t * 1.5 + ph));
    const stem = (x, y1) => pc(rect(x - 3.5, y1, x + 3.5, -6), OR.orD, () => strokePts([[x - 1.5, y1 + 3], [x - 1.5, -8]], 'rgba(255,235,170,0.6)', 1.2), 8301 + x);
    if (ty === 'double') {
      stem(16, -86); stem(72, -100);
      pc([[13, -86], [76, -100], [76, -82], [13, -68]], OR.or, () => hatch(null, 0.9, 3.4, 0.2), 8305);
      noteHead(0, 0, 8306); noteHead(56, -14, 8307);
    } else {
      stem(16, -92);
      if (ty === 'croche') pc([[13, -92], [22, -92], [34, -74], [44, -56], [42, -36], [36, -24], [38, -40], [32, -58], [20, -66], [13, -70]], OR.or, () => hatch(null, 0.9, 3.4, 0.2), 8308);
      noteHead(0, 0, 8309);
    }
    c.restore();
  }
  // ---------------- portée volante : cinq lignes dorées qui ondulent ; origine = bout gauche (ligne du milieu)
  function porteeLine(o, k, n) {
    const len = (o.len || 420) * clamp(o.trace == null ? 1 : o.trace), t = o.t || 0, ph = o.ph || 0, out = [];
    for (let i = 0; i <= n; i++) { const x = len * i / n; out.push([x, (k - 2) * 10 + 22 * Math.sin(x * 0.016 - t * 2.6 + ph)]); }
    return out;
  }
  function drawPortee(o) {
    const len0 = o.len || 420, tr = clamp(o.trace == null ? 1 : o.trace), t = o.t || 0, ph = o.ph || 0;
    if (tr <= 0) return;
    for (let k = 0; k < 5; k++) { const L = porteeLine(o, k, 40); strokePts(L, OR.orD, 4.2); strokePts(L, OR.or, 2.6); }
    const nn = o.notes == null ? 4 : o.notes, c = cx_();
    for (let i = 0; i < nn; i++) {
      const x = len0 * (i + 0.6) / (nn + 0.4); if (x > len0 * tr) break;
      const y = 22 * Math.sin(x * 0.016 - t * 2.6 + ph) + [10, -10, 0, -20, 5][i % 5];
      c.save(); c.translate(x, y); c.scale(0.55, 0.55); drawNote({ type: i % 3 === 1 ? 'croche' : 'noire', t, ph: ph + i }); c.restore();
    }
  }

  // ---------------- portrait de Strauss (cadre doré) ; origine = centre du cadre
  function drawPortrait() {
    pc(rect(-100, -125, 100, 125), '#b8913f', () => {
      fillPts(rect(-86, -111, 86, 111), '#8a6a28'); strokePts(rect(-94, -119, 94, 119), 'rgba(255,240,190,0.55)', 2, true);
      for (const [x, y] of [[-93, -118], [93, -118], [-93, 118], [93, 118]]) dot(x, y, 7, '#e2c27a');
      for (let k = -80; k <= 80; k += 16) { dot(k, -116, 2.2, '#e8cf86'); dot(k, 116, 2.2, '#e8cf86'); }
    }, 8401);
    pc(rect(-80, -105, 80, 105), '#3d4a3a', () => {
      const c = cx_();
      if (!SIL()) { const g = c.createRadialGradient(-10, -30, 10, 0, 0, 130); g.addColorStop(0, 'rgba(150,140,100,0.55)'); g.addColorStop(1, 'rgba(20,25,20,0)'); c.fillStyle = g; c.fillRect(-80, -105, 160, 210); }
      fillPts([[-70, 105], [-62, 50], [-36, 28], [-6, 20], [24, 26], [52, 40], [66, 70], [70, 105]], '#2f4a52');            // frac
      fillPts([[-12, 22], [10, 22], [16, 60], [4, 105], [-8, 105], [-16, 60]], '#ece6d6');                              // plastron
      fillPts([[-12, 28], [-2, 34], [10, 26], [10, 40], [-2, 36], [-12, 42]], '#6e2233');                               // nœud
      fillPts([[-14, 24], [-30, 60], [-20, 105], [-10, 105], [-14, 50]], '#1c2e33'); fillPts([[12, 24], [30, 60], [22, 105], [14, 105], [16, 50]], '#1c2e33');
      fillPts([[-10, 24], [10, 24], [10, 6], [-10, 6]], '#d7b391');
      fillPts([[-26, -36], [-24, -62], [-8, -76], [14, -74], [28, -58], [30, -30], [26, 0], [10, 12], [-12, 10], [-24, -6]], '#e0bc98');   // visage (léger trois-quarts)
      fillPts(bumpy([[-20, 4], [-30, -20], [-34, -52], [-26, -78], [-6, -92], [18, -90], [34, -74], [38, -50], [34, -26], [30, -40], [24, -62], [6, -70], [-14, -64], [-22, -40], [-16, -20], [-14, 4]], 5, 31), '#3a2618');
      fillPts([[-22, -30], [-14, -32], [-10, -10], [-2, -6], [6, -16], [16, -16], [22, -8], [24, -32], [30, -30], [28, 2], [14, 14], [-4, 14], [-20, 4]], '#3a2618');   // favoris + moustache
      fillPts([[-8, -8], [10, -8], [14, 2], [6, 10], [-6, 10], [-10, 2]], '#e0bc98'); strokePts([[-3, -4], [5, -4]], 'rgba(110,40,38,0.8)', 1.4);                                                          // menton rasé
      for (const ex of [-10, 14]) { fillPts(ell(ex, -42, 4.5, 2.6, 8), '#efe8da'); dot(ex + 1, -42, 1.8, '#2a1f1d'); strokePts([[ex - 6, -49], [ex + 5, -50]], '#3a2618', 2); }
      strokePts([[2, -40], [-2, -24], [4, -22]], 'rgba(120,70,50,0.6)', 1.3);
      hatch(null, 0.8, 4, 0.12);
    }, 8402, { drop: false });
  }

  // ---------------- petits objets tenus (main = poing ; origine = point de prise)
  function drawBaguette() {
    pc([[-1.6, -6], [1.6, -6], [1, -150], [-1, -150]], '#ece6d6', null, 8501);
    pc([[-4, 10], [4, 10], [5, -2], [3, -8], [-3, -8], [-5, -2]], '#a07a4e', () => strokePts([[-3, 0], [3, 0]], 'rgba(60,30,10,0.5)', 1), 8502);
  }
  function drawPlume() {
    pc([[1, 44], [3, 30], [6, -10], [4, -60], [-6, -112], [-14, -128], [-22, -106], [-22, -70], [-14, -30], [-5, 2], [-1, 30]], '#e8e2d4', () => {
      strokePts([[1, 44], [0, 0], [-8, -60], [-14, -124]], 'rgba(120,110,90,0.8)', 1.4);
      for (let k = 0; k < 9; k++) strokePts([[-2 - k * 1.6, -10 - k * 12], [-16 - k * 0.6, -20 - k * 12]], 'rgba(150,140,120,0.55)', 0.9);
      fillPts([[-6, -112], [-14, -128], [-22, -106], [-18, -98]], '#8a7a62');
    }, 8503);
    fillPts([[0, 36], [2, 36], [1.2, 46]], '#2a1e14');
  }
  function drawPartition() {
    pc([[-38, -52, 1], [38, -50, 1], [36, 48, 1], [-36, 46, 1]], '#ebe3cc', () => {
      for (let g = 0; g < 4; g++) for (let k = 0; k < 5; k++) { const y = -42 + g * 22 + k * 3; strokePts([[-30, y], [30, y + 1]], 'rgba(60,40,24,0.7)', 0.8); }
      for (let g = 0; g < 4; g++) for (let n = 0; n < 5; n++) dot(-24 + n * 12, -38 + g * 22 + ((n * 3 + g) % 4) * 2, 1.8, 'rgba(40,24,14,0.9)');
      hatch(null, 0.5, 4, 0.12);
    }, 8504);
  }
  function drawTasse() {
    pc([[-24, -2], [24, -2], [20, 4, 1], [-20, 4, 1]], '#f0ead8', () => strokePts([[-22, 0], [22, 0]], '#4f7a8c', 1.2), 8505);
    pc([[-14, -30, 1], [14, -30, 1], [12, -12], [6, -4], [-6, -4], [-12, -12]], '#f0ead8', () => { strokePts([[-13, -26], [13, -26]], '#4f7a8c', 1.6); dot(0, -18, 2.4, '#4f7a8c'); hatch(null, 0.9, 3, 0.15); }, 8506);
    pc([[13, -26], [22, -24], [22, -14], [12, -12], [12, -16], [18, -17], [18, -22], [13, -22]], '#f0ead8', null, 8507);
  }
  function drawBouteille() {
    pc([[-15, 40, 1], [15, 40, 1], [16, -20], [12, -40], [6, -54], [6, -84], [-6, -84], [-6, -54], [-12, -40], [-16, -20]], '#2f4a34', () => {
      fillPts(rect(-12, -86, 12, -60), '#c8a24a'); strokePts([[-9, 30], [-10, -24]], 'rgba(220,255,220,0.35)', 2); hatch(null, 0.8, 3.6, 0.2);
    }, 8508);
  }
  // chapeaux qu'on soulève (aussi posés sur la tête par la pièce 'coiffe') ; origine = milieu du bas du bord
  const HATS = {
    gibus: { col: '#26363a', pts: [[-42, 8, 1], [-30, 3], [-25, 1], [-27, -80, 1], [27, -82, 1], [26, 1], [32, 3], [46, 7, 1], [38, 11], [-34, 11]], band: [-24, -16, 25, -4] },
    hautDeForme: { col: '#8a6e4e', pts: [[-42, 8, 1], [-30, 3], [-24, 1], [-27, -40], [-31, -84, 1], [33, -86, 1], [29, -40], [26, 1], [32, 3], [46, 7, 1], [38, 11], [-34, 11]], band: [-26, -16, 28, -4] },
    melon: { col: '#2b2622', pts: [[-44, 8, 1], [-30, 3], [-27, -24], [-14, -44], [6, -48], [22, -40], [30, -22], [31, 2], [46, 4], [48, 8, 1], [-30, 10]], band: [-28, -10, 31, -2] },
    casquette: { col: '#4c5566', pts: [[-34, 8], [-36, -12], [-26, -28], [0, -34], [24, -28], [34, -12], [36, 0], [62, 6, 1], [60, 11, 1], [-30, 11]], band: [-34, -6, 36, 2] },
    beret: { col: '#6a2e3a', pts: [[-46, 0], [-42, -16], [-20, -28], [-4, -40], [2, -40], [4, -30], [20, -28], [42, -16], [48, -4], [30, 8], [-30, 8]], band: null },
  };
  function drawHat(name) {
    const H = HATS[name];
    pc(H.pts, H.col, () => {
      if (H.band) fillPts(rect(H.band[0], H.band[1], H.band[2], H.band[3]), name === 'gibus' ? '#6e2233' : dk(H.col, 0.45));
      strokePts([[-40, 6], [44, 5]], 'rgba(255,255,255,0.18)', 1.2); hatch(null, 0.7, 3.6, 0.28); shade(30, 0, -30, 0, 0.25, [-60, -100, 70, 14]);
    }, 8600 + name.length);
  }

  // registre : grip = point tenu dans le poing ; pts = points nommés ; base = origine de l'accessoire seul (repère objet)
  const OBJ = {
    eventail: { draw: drawEventail, grip: (o) => [0, 12 * (o.taille || 1)], pts: { ecrit: evEcrit, centre: (o) => [0, -0.68 * 105 * (o.taille || 1)], pivot: [0, 0] }, base: [0, 0] },
    gueridon: { draw: drawGueridon, grip: [0, -100], pts: { dessus: [0, -200] }, base: [0, 0] },
    note: { draw: drawNote, grip: [16, -40], pts: { haut: [16, -92] }, base: [0, 0] },
    portee: { draw: drawPortee, grip: [0, 0], pts: { bout: (o) => [(o.len || 420) * clamp(o.trace == null ? 1 : o.trace), 0] }, base: [0, 0] },
    portraitStrauss: { draw: drawPortrait, grip: [0, 125], pts: { clou: [0, -150] }, base: [0, 0] },
    baguette: { draw: drawBaguette, grip: [0, 0], pts: { pointe: [0, -150] }, base: [0, 0] },
    plume: { draw: (o) => { const k = o.taille || 1, c = cx_(); c.save(); c.scale(k, k); drawPlume(); c.restore(); }, grip: (o) => [-4 * (o.taille || 1), 8 * (o.taille || 1)], pts: { pointe: (o) => [1 * (o.taille || 1), 46 * (o.taille || 1)] }, base: [0, 0] },
    partition: { draw: drawPartition, grip: [-30, 34], pts: { centre: [0, 0] }, base: [0, 0] },
    tasse: { draw: drawTasse, grip: [0, 2], pts: { dessus: [0, -30] }, base: [0, 0] },
    bouteille: { draw: drawBouteille, grip: [0, 0], pts: { goulot: [0, -86] }, base: [0, 40] },
  };
  for (const n of Object.keys(HATS)) OBJ[n] = { draw: () => drawHat(n), grip: [30, 2], pts: { dessus: [0, -60] }, base: [0, 0] };
  DAN.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, nom, o) => { const q = ob.pts && ob.pts[nom]; return q ? (typeof q === 'function' ? q(o) : q) : null; };
  function heldOpts(name, o, p) { const r = Object.assign({ t: p.t || 0 }, o || {}); if (name === 'eventail' && r.taille == null) r.taille = 0.8; if (name === 'plume' && r.taille == null) r.taille = 0.65; return r; }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-12, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-12, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    const sk = (p) => (typeof skin === 'function' ? skin(p) : skin);
    return {
      objet: { parent: 'armF_lo', at: [0, HL], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [0, HL], noRivet: true, base: '#d8b896', seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: (p) => { fillPts(rect(-20, -20, 20, 20), sk(p)); doigtsPaint(); } },
      objetB: { parent: 'armB_lo', at: [0, HL], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [0, HL], noRivet: true, base: '#c9a885', seed: seed + 4, pts: (p) => (has(p.tenuB) ? DOIGTS : OFFP), paint: (p) => { fillPts(rect(-20, -20, 20, 20), dk(sk(p), 0.1)); doigtsPaint(); } },
    };
  }
  DAN.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = (arriere ? r.tenuBO : r.tenuO) || {}, q = ptOf(ob, nom, oo); if (!q) return null;
    const g = gripOf(ob, oo);
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };

  // =====================================================================
  // POSES — préparation commune, gestes par M.ik (bendSign 1 par défaut : q.bend / q.bendB pour forcer)
  // =====================================================================
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function plier(q, th) {
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  // G = { def, x, y, s, dir } ; T dans le repère de la pièce 'frame' ('torso', 'head') ou 'ecran'
  function toScreen(G, q, T, frame) { return frame === 'ecran' ? T : M.wpt(M.partMatrices(G.def, q, G.x, G.y, G.s, G.dir).mats[frame || 'torso'], T[0], T[1]); }
  function reach(G, q, arm, T, k, frame) {
    if (!(k > 0)) return;
    const tg = toScreen(G, q, T, frame), bend = arm === 'armF' ? q.bend : q.bendB;
    const sol = M.ik(G.def, q, G.x, G.y, G.s, G.dir, arm, tg, bend == null ? 1 : bend);
    const A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  // applaudir : main arrière fixe devant la poitrine, la main avant frappe de haut en bas. f 0 = poli (bas, lent, petit), 1 = fort (haut, vif)
  function clap(G, q, k, f) {
    if (!(k > 0)) return;
    const t = q.t || 0, open = 0.5 + 0.5 * Math.cos(t * TAU * lerp(2.0, 3.6, f)), hy = lerp(-92, -150, f), gap = lerp(10, 40, f) * open;
    reach(G, q, 'armB', [62, hy + 6], k, 'torso');
    reach(G, q, 'armF', [70, hy - 4 - gap], k, 'torso');
    if (k > 0.4) { if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
  }
  // soulever le chapeau (pièce 'coiffe' de la tête) : la main va au bord (0..0,35), puis le lève au-dessus de la tête, incliné
  function hatLift(G, q, k) {
    const name = q._hat; if (!name || !(k > 0)) return;
    const k1 = ease(clamp(k / 0.35)), k2 = ease(clamp((k - 0.35) / 0.65)), A = q.ang;
    const mats = M.partMatrices(G.def, q, G.x, G.y, G.s, G.dir).mats;
    const g = OBJ[name].grip, onHead = M.wpt(mats.coiffe, g[0], g[1]);
    if (k2 <= 0) { reach(G, q, 'armF', onHead, k1, 'ecran'); return; }
    const up = M.wpt(mats.torso, 74, -330);
    reach(G, q, 'armF', [lerp(onHead[0], up[0], k2), lerp(onHead[1], up[1], k2)], 1, 'ecran');
    q.hide.coiffe = 1; q.tenu = name; q.tenuO = {}; q.droit = false; q.handF = 'fist';
    const headAbs = (q.tilt || 0) + (A.head || 0) + (G.def.parts.coiffe.rest || 0);
    A.objet = lerp(headAbs, -0.4, k2) - ((q.tilt || 0) + (A.armF_up || 0) + (A.armF_lo || 0));
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (has(q.tenu)) q.handF = 'fist';
    if (has(q.tenuB)) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    return q;
  }
  function run(def, q, x, y, s, o) {
    o = Object.assign({}, o || {}); if (o.slot == null) o.slot = y + 34;
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  const wrap = (def, poseFn, s0) => (pose, x, y, s, o) => { s = s == null ? s0 : s; const G = { def, x, y, s, dir: (o && o.dir) || 1 }; return run(def, poseFn(pose, G), x, y, s, o); };

  // ---------------- pièces de corps communes (couleur dynamique : dyn(p) → hex, peinte sur toute la pièce)
  const SKIN = '#e0bf9c', SKIND = '#c6a17e';
  function upDef(at, base, seed, dyn, extra) {
    return { parent: 'torso', at, pts: armR(LA), base, seed, paint: (p) => {
      const c = dyn && dyn(p); if (c) fillPts(rect(-40, -40, 40, 140), c);
      if (extra) extra(p);
      hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28);
    } };
  }
  function foreDef(parent, base, skin, back, seed, cuff, dyn) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const c = dyn && dyn(p); if (c) fillPts(rect(-40, -30, 40, 77), c);
      fillPts(rect(-24, 76, 26, 132), typeof skin === 'function' ? skin(p) : skin); X.handPaint(null, hk(p));
      if (cuff) fillPts(rect(-14, 62, 15, 78), typeof cuff === 'function' ? cuff(p) : cuff);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  function legDef(at, base, shoe, seed, back, th, dyn, extraPaint) {
    return { parent: 'torso', at, pts: X.legPts(th || 0.95), base, seed, noRivet: !!back, paint: (p) => {
      const c = dyn && dyn(p); if (c) fillPts(rect(-60, -40, 60, 216), back ? dk(c, 0.15) : c);
      if (extraPaint) extraPaint(p);
      fillPts(rect(-40, 214, 60, 262), shoe);
      if (!back) { strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.3)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  // coiffe (chapeau qu'on peut soulever) : pièce de la tête
  const coiffeDef = (at, seed) => ({ parent: 'head', at, rest: -0.04, seed, noRivet: true, base: '#222',
    pts: (p) => (p._hat && HATS[p._hat] ? HATS[p._hat].pts : OFFP),
    paint: (p) => { if (!p._hat) return; const H = HATS[p._hat]; fillPts(rect(-80, -120, 80, 20), H.col); if (H.band) fillPts(rect(H.band[0], H.band[1], H.band[2], H.band[3]), p._hat === 'gibus' ? '#6e2233' : dk(H.col, 0.45)); hatch(null, 0.7, 3.6, 0.28); shade(30, 0, -30, 0, 0.25, [-60, -100, 70, 14]); } });
  function bouche(f, x, y, k) {                                                               // bouche grande ouverte (chanter, bâiller)
    fillPts(ell(x, y + 2 * k, 3.5 + 1.5 * k, 3 + 6 * k, 10), '#3a1714', 0, 0);
    if (k > 0.5) fillPts(ell(x, y + 6 * k, 2.4, 2, 6), 'rgba(170,70,70,0.8)', 0, 0);
  }

  // =====================================================================
  // JOHANN STRAUSS FILS — fin, cheveux bruns bouclés, favoris + moustache (menton rasé), frac bleu-vert sombre, gilet ivoire, nœud bordeaux
  // =====================================================================
  const STR = { peau: '#e2c09e', frac: '#2f4a52', fracD: '#22383e', revers: '#18282d', gilet: '#ebe3cb', giletD: '#cbbf9f', chemise: '#f3eee2', noeud: '#6e2233', pant: '#25272d', chaus: '#121113', chev: '#3a2618', chevL: '#6a4a30' };
  const STR_TORSO = [[-12, -176], [6, -180], [16, -170], [26, -152], [31, -122], [31, -86], [28, -50], [24, -22], [21, -6], [6, -1], [-10, 6], [-18, 40], [-24, 92], [-28, 128, 1], [-42, 130, 1], [-41, 70], [-38, 10], [-36, -50], [-35, -104], [-31, -148], [-22, -168]];
  const STR_HAIR = bumpy([[27, -77], [24, -92], [12, -103], [-4, -108], [-20, -104], [-33, -94], [-42, -78], [-45, -60], [-45, -42], [-42, -26], [-37, -12], [-30, -4], [-24, -14], [-20, -30], [-16, -40], [-16, -54], [-8, -62], [6, -68], [18, -72]], 5.5, 11);
  function mkStrauss() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: STR_TORSO, base: STR.frac, seed: 9101, paint: () => {
        fillPts([[6, -170], [20, -160], [29, -124], [29, -88], [26, -52], [22, -22], [20, -6], [10, 4], [6, -12], [0, -60], [2, -120]], STR.gilet);
        strokePts([[22, -22], [12, -6], [20, -6]], 'rgba(120,105,80,0.6)', 1.1);
        for (const y of [-104, -82, -60, -38]) dot(18 + (y + 104) * 0.04, y, 2.2, '#a89870');
        fillPts([[4, -182], [16, -171], [20, -156], [10, -150], [4, -162]], STR.chemise);
        fillPts([[8, -168], [14, -176], [22, -172], [17, -166], [22, -158], [14, -160]], STR.noeud); dot(15, -166, 2.6, '#4e1824');
        fillPts([[0, -174], [10, -158], [14, -126], [8, -96], [2, -80], [-4, -120]], STR.revers);
        strokePts([[2, -170], [8, -150]], 'rgba(255,255,255,0.18)', 1.2);
        strokePts([[-10, 6], [-18, 40], [-24, 92], [-28, 126]], 'rgba(8,20,22,0.55)', 1.3); strokePts([[-34, 20], [-36, 124]], 'rgba(8,20,22,0.4)', 1.2);
        hatch([[-50, -170], [-12, -170], [-14, 132], [-50, 132]], 0.75, 4.2, 0.3);
        shade(34, 0, -40, 0, 0.3);
      } },
      legB: legDef([-6, -2], STR.pant, STR.chaus, 9102, true, 0.88),
      legF: legDef([6, -2], STR.pant, STR.chaus, 9103, false, 0.88, null, () => strokePts([[-4, -10], [-6, 212]], 'rgba(10,10,12,0.8)', 2.2)),
      armB_up: upDef([-10, -146], STR.fracD, 9104),
      armB_lo: foreDef('armB_up', STR.fracD, dk(STR.peau, 0.12), true, 9105, '#d8d2c2'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: STR.peau, seed: 9106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22); dot(16, -36, 7, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, STR.chev, 2.6);
        if (p._bouche) bouche(f, 27, -22, p._bouche); else if (f.mouth === 'o') fillPts(ell(27, -21, 3, 3.5, 8), '#3a1714', 0, 0);
        else if (f.mouth === 'smile') strokePts([[29, -22], [24, -19], [19, -21]], 'rgba(110,40,38,0.9)', 1.5); else strokePts([[29, -21], [23, -20]], 'rgba(110,40,38,0.9)', 1.5);
        fillPts([[-4, -62], [5, -60], [8, -46], [12, -36], [16, -31], [15, -22], [10, -12], [2, -8], [-8, -14], [-14, -28], [-15, -46], [-11, -58]], STR.chev);
        fillPts([[18, -35], [29, -38], [35, -34], [36, -29], [31, -27], [26, -29], [21, -26], [15, -25], [13, -31]], STR.chev);
        strokePts([[20, -33], [32, -33]], 'rgba(120,90,60,0.6)', 1);
        for (let k = 0; k < 4; k++) strokePts([[-10 + k * 4, -54], [-6 + k * 4, -26]], 'rgba(120,90,60,0.45)', 1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: STR_HAIR, base: STR.chev, seed: 9107, noRivet: true, paint: () => {
        for (const [x, y] of [[14, -92], [-2, -98], [-18, -94], [-30, -80], [-36, -62], [-36, -42], [-32, -24], [-2, -80], [-16, -76], [-24, -56]]) strokePts(ep(x, y, 5, 4.5, 8, 0.4, 5.2), 'rgba(140,100,64,0.6)', 1.3);
        hatch(null, 0.5, 3.4, 0.2);
      } },
      coiffe: coiffeDef([-4, -96], 9108),
      couronne: { parent: 'head', at: [-6, -102], rest: -0.16, seed: 9109, noRivet: true, base: '#d1a845',
        pts: (p) => (p.couronne ? [[-30, 4, 1], [32, 4, 1], [34, -26, 1], [24, -10], [14, -36, 1], [4, -12], [-6, -38, 1], [-14, -12], [-24, -34, 1], [-32, -8]] : OFFP),
        paint: () => { fillPts(rect(-34, -8, 36, 6), '#b38a32'); for (const x of [-18, 2, 22]) dot(x, -1, 3.2, '#8e2a2a'); for (const [x, y] of [[-24, -30], [-6, -34], [14, -32], [33, -22]]) dot(x, y, 2.6, '#f2dc8c'); strokePts([[-26, -6], [-20, -24]], 'rgba(255,240,190,0.6)', 1.2); hatch(null, 0.4, 3, 0.2); } },
      armF_up: upDef([-2, -146], STR.frac, 9110),
      armF_lo: foreDef('armF_up', STR.frac, STR.peau, false, 9111, STR.chemise),
    };
    Object.assign(parts, heldParts(STR.peau, 9120));
    return { nom: 'Strauss', hipY: -238, parts, handLen: HL, rod: { part: 'torso', at: [-22, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'cheveux', 'coiffe', 'couronne', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts'] };
  }
  CH.danStrauss = mkStrauss();
  DAN.straussPose = function (p, G) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    if (q.tenu == null) q.tenu = 'baguette';
    const le = ease(clamp(q.leve || 0)), di = clamp(q.diriger || 0), sa = ease(clamp(q.salue || 0)), ch = clamp(q.chapeauHaut || 0);
    if (ch > 0) q.chapeau = true;
    q._hat = q.chapeau ? 'gibus' : null;
    if (sa > 0) { plier(q, 0.3 * sa); A.head = (A.head || 0) + 0.24 * sa; }
    if (le > 0) { blend(q, 'armF_up', -2.35, le); blend(q, 'armF_lo', -0.3, le); A.head = (A.head || 0) - 0.1 * le; }
    if (di > 0) {
      const w = t * TAU * 1.45;
      blend(q, 'armF_up', -1.55 + 0.38 * Math.sin(w), di); blend(q, 'armF_lo', -0.65 + 0.32 * Math.sin(w + 1.3), di);
      blend(q, 'armB_up', -0.75 + 0.18 * Math.sin(w + PI), di); blend(q, 'armB_lo', -0.95, di);
      A.objet = (A.objet || 0) + di * (0.55 + 0.3 * Math.sin(w + 0.7)); A.head = (A.head || 0) - 0.06 * di + 0.05 * di * Math.sin(w * 0.5);
      q.dy = (q.dy || 0) - 3 * di * Math.abs(Math.sin(w * 0.5));
    }
    if (sa > 0) { reach(G, q, 'armF', [42, -66], sa, 'torso'); blend(q, 'armB_up', 0.5, sa); blend(q, 'armB_lo', -0.15, sa); }
    if (ch > 0) { if (q.tenu === 'baguette' && !has(q.tenuB)) q.tenuB = 'baguette'; if (q.tenu === 'baguette') q.tenu = 'rien'; hatLift(G, q, ch); }
    return finish(q);
  };
  DAN.strauss = wrap(CH.danStrauss, DAN.straussPose, 0.9);

  // =====================================================================
  // JOHANNES BRAHMS — rond, très grande barbe châtain-gris, cheveux fins rejetés en arrière, redingote vert mousse, gilet ocre sourd, plume d'oie à la poche
  // =====================================================================
  const BR = { peau: '#e4bc98', coat: '#4a5a38', coatD: '#3a4a2c', gilet: '#9c7c46', giletL: '#b49460', cravate: '#ece6d4', pant: '#6a6258', chaus: '#2a2018', barbe: '#978a78', barbeL: '#c4baa8', barbeD: '#6a5c4a', chev: '#a39a8c' };
  const BR_TORSO = [[-16, -176], [8, -180], [20, -168], [34, -150], [48, -124], [62, -94], [72, -62], [75, -30], [68, 0], [56, 22], [48, 60], [48, 120, 1], [-52, 124, 1], [-53, 70], [-51, 10], [-52, -60], [-48, -112], [-40, -150], [-28, -168]];
  const BR_BEARD = bumpy([[-14, -50], [0, -46], [10, -40], [17, -32], [26, -30], [34, -31], [41, -25], [48, -12], [54, 8], [54, 30], [48, 54], [36, 74], [20, 88], [0, 92], [-16, 82], [-28, 60], [-34, 32], [-32, 4], [-26, -18], [-20, -36]], 7, 47);
  const BR_HAIR = bumpy([[20, -80], [12, -94], [-6, -103], [-26, -98], [-40, -84], [-47, -62], [-50, -38], [-48, -14], [-42, 6], [-32, 0], [-26, -20], [-20, -38], [-18, -58], [-6, -72], [8, -80]], 3.5, 61);
  const PLUME_POCHE = [[0, 0], [4, -10], [6, -40], [2, -66], [-4, -80], [-10, -70], [-12, -44], [-6, -14], [-3, 0]];
  function mkBrahms() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: BR_TORSO, base: BR.coat, seed: 9201, paint: () => {
        fillPts([[12, -170], [30, -152], [46, -124], [60, -94], [70, -62], [73, -30], [66, 0], [54, 18], [34, 8], [28, -40], [20, -100], [12, -140]], BR.gilet);
        for (let y = -150; y < 10; y += 12) for (let x = 20; x < 72; x += 12) dot(x + (y % 24 ? 6 : 0), y, 1.4, BR.giletL);
        for (const y of [-112, -88, -64, -40, -16]) dot(38 + Math.sin((y + 130) / 150 * PI) * 22, y, 2.6, '#5e4420');
        fillPts([[4, -184], [20, -170], [18, -150], [6, -158]], BR.cravate);
        fillPts([[6, -176], [24, -150], [22, -110], [14, -80], [6, -120]], BR.coatD);
        fillPts([[24, -26], [50, -30], [52, -18], [26, -14]], BR.coatD); strokePts([[24, -26], [50, -30]], 'rgba(20,28,12,0.7)', 1.6);   // poche
        strokePts([[34, 8], [40, 60], [42, 118]], 'rgba(20,28,12,0.45)', 1.3);
        shade(70, -50, 20, -50, 0.22, [10, -160, 80, 30]);
        hatch([[-60, -170], [-16, -170], [-16, 128], [-60, 128]], 0.75, 4.2, 0.32);
        shade(50, -40, -50, 0, 0.3);
      } },
      plumePoche: { parent: 'torso', at: [38, -24], rest: 0.22, seed: 9202, noRivet: true, base: '#e8e2d4', pts: (p) => (p.tenu === 'plume' || p.tenuB === 'plume' ? OFFP : PLUME_POCHE),
        paint: () => { strokePts([[0, 0], [-2, -40], [-5, -76]], 'rgba(120,110,90,0.8)', 1.2); for (let k = 0; k < 6; k++) strokePts([[-1 - k * 0.6, -14 - k * 10], [-10, -20 - k * 10]], 'rgba(150,140,120,0.5)', 0.9); fillPts([[-4, -80], [-10, -70], [-11, -60], [-4, -64]], '#8a7a62'); } },
      legB: legDef([-8, -2], dk(BR.pant, 0.15), BR.chaus, 9203, true, 1.12),
      legF: legDef([8, -2], BR.pant, BR.chaus, 9204, false, 1.12, null, () => { for (let y = 10; y < 210; y += 18) strokePts([[-24, y], [24, y]], 'rgba(40,34,28,0.22)', 1); }),
      armB_up: upDef([-12, -146], BR.coatD, 9205),
      armB_lo: foreDef('armB_up', BR.coatD, dk(BR.peau, 0.12), true, 9206, '#d8d0bc'),
      head: { parent: 'torso', at: [8, -170], pts: X.GR_HEAD, base: BR.peau, seed: 9207, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -46); dot(16, -40, 8, 'rgba(210,120,100,0.3)'); fillPts(ell(33, -38, 6, 5.5, 10), '#dca488'); dot(34, -40, 2, 'rgba(255,240,230,0.5)');
        strokePts([[6, -90], [20, -84]], 'rgba(255,240,220,0.5)', 2);
        X.eye(f, 17, -52); X.brow(f, 17, -61, BR.barbeD, 3.4);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: BR_HAIR, base: BR.chev, seed: 9208, noRivet: true, paint: () => { for (let k = 0; k < 7; k++) strokePts([[14 - k * 6, -88 - k], [-24 - k * 3, -76 + k * 6], [-36 - k, -10 + k * 2]], k % 2 ? 'rgba(230,222,206,0.45)' : 'rgba(110,84,60,0.4)', 1.2); hatch(null, 0.5, 3.2, 0.2); } },
      barbe: { parent: 'head', at: [0, 0], pts: BR_BEARD, base: BR.barbe, seed: 9209, noRivet: true, paint: (p) => {
        const f = p.face || {};
        for (let i = 0; i < 15; i++) { const x = -26 + i * 5.4; strokePts([[x + 4, -38 + Math.abs(i - 7) * 2], [x + 2 * Math.sin(i), 10], [x + 3, 52 - Math.abs(i - 7) * 3], [x - 2, 84 - Math.abs(i - 7) * 4]], i % 3 ? 'rgba(225,218,204,0.6)' : 'rgba(80,62,44,0.45)', 1.3); }
        fillPts([[18, -31], [30, -33], [38, -30], [43, -22], [36, -19], [26, -21], [16, -25]], BR.barbeD);
        if (p._bouche) bouche(f, 31, -18, p._bouche); else if (f.mouth === 'o') fillPts(ell(32, -18, 3, 3.5, 8), '#3a1714', 0, 0);
        else strokePts([[36, -19], [28, -18]], 'rgba(110,40,38,0.7)', 1.4);
        hatch(null, 1.2, 3.2, 0.16);
      } },
      armF_up: upDef([-2, -146], BR.coat, 9210),
      armF_lo: foreDef('armF_up', BR.coat, BR.peau, false, 9211, '#ece6d4'),
    };
    Object.assign(parts, heldParts(BR.peau, 9220));
    return { nom: 'Brahms', hipY: -238, parts, handLen: HL, rod: { part: 'torso', at: [-28, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'cheveux', 'torso', 'plumePoche', 'barbe', 'armF_up', 'armF_lo', 'objet', 'doigts'] };
  }
  CH.danBrahms = mkBrahms();
  DAN.brahmsPose = function (p, G) {
    const q = prep(p), A = q.ang;
    const ec = ease(clamp(q.ecrire || 0)), ap = clamp(q.applaudir || 0), so = ease(clamp(q.soupir || 0)), co = ease(clamp(q.coeur || 0)), sl = ease(clamp(q.solennel || 0));
    if (ec > 0 && q.tenu == null) q.tenu = 'plume';
    if (so > 0) {
      q.dy = (q.dy || 0) + 8 * so; A.head = (A.head || 0) + 0.2 * so; q.tilt = (q.tilt || 0) + 0.03 * so;
      blend(q, 'armF_up', 0.14, so); blend(q, 'armB_up', 0.16, so); blend(q, 'armF_lo', -0.04, so);
      if (so > 0.3) { if (!q.face.brow) q.face.brow = 'worry'; if (!q.face.eyes) q.face.eyes = 'half'; }
    }
    if (sl > 0) { A.head = (A.head || 0) - 0.24 * sl; q.tilt = (q.tilt || 0) - 0.03 * sl; }
    if (co > 0) { plier(q, 0.1 * co); A.head = (A.head || 0) + 0.14 * co; reach(G, q, 'armF', [34, -114], co, 'torso'); if (co > 0.5 && !has(q.tenu)) q.handF = 'open'; }
    if (ap > 0) clap(G, q, ap, q.fort ? 1 : 0.35);
    if (ec > 0) {
      A.head = (A.head || 0) + 0.22 * ec; q.tilt = (q.tilt || 0) + 0.05 * ec;
      const ob = OBJ.plume, po = heldOpts('plume', q.tenuO, q), tip = ptOf(ob, 'pointe', po), g = gripOf(ob, po), t = q.t || 0, oa = -0.45 * ec;
      A.objet = (A.objet || 0) + oa;
      const vx = (tip[0] - g[0]) * Math.cos(oa) - (tip[1] - g[1]) * Math.sin(oa), vy = (tip[0] - g[0]) * Math.sin(oa) + (tip[1] - g[1]) * Math.cos(oa);
      let T;
      if (q.cible) T = [q.cible[0] - G.dir * G.s * vx + 2 * Math.sin(t * 23), q.cible[1] - G.s * vy + 1.5 * Math.sin(t * 31)];
      else T = toScreen(G, q, [104, -96], 'torso');
      reach(G, q, 'armF', T, ec, 'ecran');
    }
    return finish(q);
  };
  DAN.brahms = wrap(CH.danBrahms, DAN.brahmsPose, 0.9);

  // =====================================================================
  // VIENNOIS — un modèle paramétrable : habit (hex), coiffe, poil, tenu, ventre, cheveux, gilet, pantalon, cravate
  // =====================================================================
  const VI = { peau: ['#e2bf9b', '#dcb08a', '#e8c8a8', '#d4a882'], gilets: ['#c2b394', '#8a7a5a', '#6e5a48', '#b49a62', '#9a8e7e', '#5e4e40'], pants: ['#4a4a50', '#6a6258', '#3e3a36', '#7a7468', '#5a5248', '#57585e'],
    cheveux: ['#3a2a1e', '#6a4a30', '#8a8478', '#2a2420', '#7a5a38', '#b8b0a2'], cravates: ['#ece6d4', '#6e2233', '#1e1c1e', '#3d4f6a', '#5a6a3a'] };
  const vh = (p, k) => Math.floor(M.hash(parseInt((p.habit || '#556070').slice(1), 16) * 0.001 + k * 13.7) * 1000);
  const viCol = (p, key, list, k) => p[key] || list[vh(p, k) % list.length];
  const vPeau = (p) => p.peau || VI.peau[vh(p, 1) % VI.peau.length];
  const vHabit = (p) => p.habit || '#556070';
  function viTorso(p) {
    const v = clamp(p.ventre || 0) * 22;
    return [[-14, -176], [8, -180], [18, -168], [28, -150], [35, -118], [38 + v * 0.6, -84], [38 + v, -50], [34 + v * 0.8, -16], [31 + v * 0.3, 12], [32, 50], [34, 98], [36, 116, 1], [-42, 118, 1], [-42, 70], [-40, 10], [-40, -60], [-38, -112], [-34, -150], [-26, -168]];
  }
  function mkViennois() {
    const hairCol = (p) => viCol(p, 'cheveux', VI.cheveux, 4);
    const parts = {
      torso: { parent: null, at: [0, 0], pts: viTorso, base: '#556070', seed: 9301, paint: (p) => {
        const h = vHabit(p), v = clamp(p.ventre || 0) * 22, gi = viCol(p, 'gilet', VI.gilets, 2);
        fillPts(rect(-80, -200, 90, 140), h);
        fillPts([[12, -168], [26, -150], [33, -118], [36 + v * 0.6, -84], [36 + v, -50], [32 + v * 0.8, -16], [24, -10], [20, -60], [16, -120]], gi);
        for (const y of [-110, -86, -62, -38]) dot(28 + v * ((y + 110) / 72) * 0.8, y, 2.1, dk(gi, 0.45));
        fillPts([[4, -184], [18, -170], [16, -154], [4, -164]], '#efe9da');
        fillPts([[10, -172], [20, -166], [16, -152], [9, -160]], viCol(p, 'cravate', VI.cravates, 3));
        fillPts([[6, -176], [22, -156], [20, -126], [12, -96], [4, -130]], dk(h, 0.22));
        strokePts([[22, -8], [28, 110]], 'rgba(10,8,6,0.4)', 1.2); for (const y of [20, 56]) dot(25, y, 2, dk(h, 0.5));
        hatch([[-56, -170], [-14, -170], [-12, 124], [-56, 124]], 0.75, 4.2, 0.3);
        shade(40, 0, -44, 0, 0.3);
      } },
      legB: legDef([-6, -2], '#4a4a50', '#1e1a18', 9302, true, 0.95, (p) => viCol(p, 'pantalon', VI.pants, 5)),
      legF: legDef([6, -2], '#4a4a50', '#2a2220', 9303, false, 0.95, (p) => viCol(p, 'pantalon', VI.pants, 5), (p) => { if (vh(p, 6) % 3 === 0) for (let y = 0; y < 210; y += 14) strokePts([[-24, y], [24, y]], 'rgba(30,26,22,0.25)', 1); }),
      armB_up: upDef([-10, -146], '#556070', 9304, (p) => dk(vHabit(p), 0.18)),
      armB_lo: foreDef('armB_up', '#556070', (p) => dk(vPeau(p), 0.12), true, 9305, '#d8d2c2', (p) => dk(vHabit(p), 0.18)),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: '#e2bf9b', seed: 9306, noRivet: true, paint: (p) => {
        const f = p.face || {}, hc = hairCol(p), co = p.coiffe || 'melon', po = p.poil || 'moustache';
        fillPts(rect(-60, -120, 60, 30), vPeau(p));
        if (co === 'chauve') { fillPts([[-12, -66], [-20, -40], [-40, -26], [-38, -64], [-28, -70]], hc); strokePts([[-4, -94], [18, -86]], 'rgba(255,245,230,0.6)', 2.4); }
        else if (co === 'cheveux') fillPts(bumpy([[28, -76], [22, -94], [4, -104], [-18, -100], [-34, -84], [-40, -62], [-40, -36], [-30, -26], [-22, -40], [-14, -60], [0, -72], [18, -76]], 4, vh(p, 7)), hc);
        else fillPts([[-14, -70], [-20, -40], [-40, -26], [-38, -76], [-24, -82]], hc);
        X.earPaint(-8, -44); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22); dot(16, -36, 7, 'rgba(205,130,110,0.22)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, dk(hc, 0.2), 2.4);
        if (p._bouche) bouche(f, 27, -23, p._bouche); else X.mouth(f, 27, -26);
        if (po === 'favoris') { fillPts([[-8, -64], [2, -62], [4, -48], [8, -38], [14, -32], [22, -32], [29, -36], [35, -32], [31, -27], [22, -26], [14, -20], [8, -11], [0, -7], [-8, -11], [-14, -24], [-16, -42], [-14, -58]], hc); for (let k = 0; k < 5; k++) strokePts([[-12 + k * 4, -56 + k * 3], [-10 + k * 5, -14 + k * 2]], 'rgba(255,240,220,0.22)', 1); }
        if (po === 'moustache' || po === 'barbiche') fillPts([[20, -35], [31, -37], [36, -32], [34, -29], [28, -31], [22, -29], [16, -30]], hc);
        if (po === 'barbiche') fillPts([[20, -18], [26, -18], [26, -8], [22, 6], [18, -6]], hc);
      } },
      coiffe: coiffeDef([-4, -86], 9307),
      armF_up: upDef([-2, -146], '#556070', 9308, (p) => vHabit(p)),
      armF_lo: foreDef('armF_up', '#556070', vPeau, false, 9309, '#efe9da', (p) => vHabit(p)),
    };
    Object.assign(parts, heldParts(vPeau, 9320));
    return { nom: 'Viennois', hipY: -238, parts, handLen: HL, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'coiffe', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts'] };
  }
  CH.danViennois = mkViennois();
  DAN.viennoisPose = function (p, G) {
    const q = prep(p), A = q.ang;
    q.coiffe = q.coiffe || 'melon'; q.poil = q.poil || 'moustache'; q.habit = q.habit || '#556070';
    q._hat = HATS[q.coiffe] && q.coiffe !== 'gibus' ? q.coiffe : null;
    const ap = clamp(q.applaudir || 0), chn = ease(clamp(q.chanter || 0)), ba = ease(clamp(q.baille || 0)), chh = clamp(q.chapeauHaut || 0);
    if (chn > 0) {
      A.head = (A.head || 0) - 0.2 * chn; q._bouche = 0.7 * chn;
      if (q.tenu === 'partition') reach(G, q, 'armF', [84, -112], chn, 'torso');
      else if (!has(q.tenu)) { blend(q, 'armF_up', -1.15, chn); blend(q, 'armF_lo', -0.75, chn); if (chn > 0.4) q.handF = 'open'; }
    }
    if (ba > 0) {
      A.head = (A.head || 0) - 0.24 * ba; q._bouche = Math.max(q._bouche || 0, ba); if (ba > 0.4 && !q.face.eyes) q.face.eyes = 'closed';
      if (!has(q.tenu)) { reach(G, q, 'armF', [44, -6], ba, 'head'); if (ba > 0.3) q.handF = 'open'; }
    }
    if (ap > 0) clap(G, q, ap, q.fort ? 1 : 0);
    if (chh > 0 && q._hat) hatLift(G, q, chh);
    return finish(q);
  };
  DAN.viennois = wrap(CH.danViennois, DAN.viennoisPose, 0.85);

  // =====================================================================
  // VIENNOISE — robe longue à tournure et trois volants, décolleté à berthe de dentelle, longs gants ivoire ; robe (hex), coiffe, tenu
  // =====================================================================
  const VE = { peau: '#ecccac', gant: '#ece4d0', gantD: '#d4c8ae', dentelle: '#efe8d6' };
  const VE_TORSO = [[-12, -176], [6, -180], [14, -170], [22, -152], [26, -126], [22, -98], [16, -70], [24, -30], [32, 30], [40, 100], [46, 170], [52, 238, 1], [-104, 238, 1], [-98, 196], [-86, 150], [-80, 96], [-86, 48], [-100, 4], [-98, -30], [-80, -52], [-52, -64], [-30, -70], [-26, -96], [-30, -124], [-30, -150], [-22, -168]];
  const VE_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [20, -10], [22, -15], [21, -19], [23, -22], [22, -25], [24, -29], [29, -35, 1], [26, -42], [23, -51], [24, -60], [20, -72], [10, -82], [-6, -86], [-22, -82], [-30, -66], [-30, -44], [-24, -28], [-16, -10]];
  const vRobe = (p) => p.robe || '#8c6f7c';
  const vHair = (p) => p.cheveux || ['#3b2a1f', '#6a4628', '#2a201c', '#8a6a44'][Math.floor(M.hash(parseInt(vRobe(p).slice(1), 16) * 0.001) * 4)];
  function mkViennoise() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: VE_TORSO, base: '#8c6f7c', seed: 9401, paint: (p) => {
        const r = vRobe(p), rd = dk(r, 0.25), rl = lt(r, 0.15);
        fillPts(rect(-120, -200, 80, 250), r);
        fillPts([[-34, -66], [-56, -62], [-84, -48], [-100, -18], [-96, 20], [-74, 30], [-50, 6], [-30, -30]], rl);                    // tournure drapée
        for (const k of [0.3, 0.6]) strokePts([[lerp(-34, -30, k), lerp(-66, -30, k)], [lerp(-80, -50, k), lerp(-46, 4, k)], [lerp(-98, -74, k), lerp(-14, 28, k)]], dk(r, 0.4), 1.3);
        fillPts([[-46, -70], [-60, -84], [-70, -66], [-56, -60], [-72, -44], [-60, -40]], rd); dot(-54, -64, 4, dk(r, 0.5));                  // nœud
        for (const [y0, x0, x1] of [[96, -82, 41], [150, -88, 46], [200, -98, 50]]) {                 // trois volants
          fillPts([[x0, y0], [x1, y0], [x1 + 4, y0 + 20], [x0 - 4, y0 + 20]], rd);
          for (let x = x0; x < x1; x += 10) strokePts(ep(x + 5, y0 + 18, 5, 4, 6, 0, PI), lt(r, 0.25), 1.2);
          strokePts([[x0, y0], [x1, y0]], 'rgba(30,20,20,0.4)', 1.2);
        }
        fillPts([[-30, -72, 1], [22, -72, 1], [20, -62, 1], [-32, -62, 1]], rd);                   // ceinture
        fillPts([[-26, -150], [-12, -166], [8, -170], [16, -160], [24, -146], [-28, -138]], VE.peau);   // décolleté
        pc(bumpy([[-32, -146], [-16, -160], [6, -164], [22, -150], [28, -138], [10, -134], [-30, -132]], 2, 71), VE.dentelle, () => { for (let x = -26; x < 24; x += 6) dot(x, -142, 1.4, 'rgba(160,150,120,0.6)'); }, 9402, { drop: false });
        hatch([[-110, -170], [-14, -170], [-20, 240], [-110, 240]], 0.75, 4.4, 0.24, 1.05, '230,225,235');
        shade(40, 0, -70, 0, 0.26);
      } },
      armB_up: upDef([-10, -146], '#8c6f7c', 9403, (p) => dk(vRobe(p), 0.2), (p) => fillPts([[-17, -20], [17, -20], [18, 14], [0, 22], [-18, 14]], dk(vRobe(p), 0.32))),
      armB_lo: foreDef('armB_up', '#8c6f7c', VE.gantD, true, 9404, VE.gantD, (p) => dk(vRobe(p), 0.2)),
      head: { parent: 'torso', at: [6, -170], pts: VE_HEAD, base: VE.peau, seed: 9405, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-6, -46); dot(-4, -36, 2.4, '#efe8da');
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.18); dot(13, -30, 8, 'rgba(215,120,110,0.3)');
        X.eye(f, 15, -47, 0.95); strokePts([[9, -50], [7, -53]], 'rgba(28,16,14,0.9)', 1.2);
        X.brow(f, 15, -55, 'rgba(60,40,28,0.9)', 1.7);
        if (p._bouche) bouche(f, 23, -20, p._bouche * 0.8); else X.mouth(f, 23, -20, 'rgba(150,50,55,0.95)');
      } },
      cheveux: { parent: 'head', at: [0, 0], seed: 9406, noRivet: true, base: '#3b2a1f',
        pts: (p) => (p.coiffe === 'bonnet' ? OFFP : [[24, -66], [18, -80], [4, -90], [-14, -92], [-28, -84], [-36, -66], [-36, -40], [-30, -24], [-20, -26], [-12, -38], [-2, -50], [6, -60], [16, -64]]),
        paint: (p) => { fillPts(rect(-60, -110, 60, 20), vHair(p)); strokePts([[20, -76], [0, -88], [-22, -80], [-30, -56]], 'rgba(255,240,220,0.25)', 1.4); hatch(null, 0.4, 3.2, 0.2); } },
      chignon: { parent: 'head', at: [-32, -34], seed: 9407, noRivet: true, base: '#3b2a1f',
        pts: (p) => (p.coiffe === 'bonnet' ? OFFP : p.coiffe === 'chignon' ? ell(0, 0, 17, 15, 14).concat([[-4, 14], [-8, 40], [-4, 52, 1], [-12, 46], [-14, 20]]) : ell(0, 0, 15, 13, 14)),
        paint: (p) => { fillPts(rect(-40, -40, 40, 70), vHair(p)); strokePts(ep(0, 0, 9, 8, 12, -0.5, 4.4), 'rgba(255,230,200,0.25)', 1.3); if (p.coiffe === 'chignon') { strokePts([[-8, 18], [-10, 32], [-6, 46]], 'rgba(255,230,200,0.3)', 1.2); dot(10, -10, 5, '#d8c8e0'); dot(12, -4, 3.5, '#efe6f2'); } hatch(null, 0.5, 3, 0.25); } },
      coiffe: { parent: 'head', at: [0, 0], seed: 9408, noRivet: true, base: '#5a4038',
        pts: (p) => {
          const c = p.coiffe;
          if (c === 'chapeau') return [[-8, -92], [8, -100], [30, -100], [42, -92], [34, -86], [10, -84], [-6, -82]];
          if (c === 'voilette') return [[-4, -88], [4, -102], [26, -104], [36, -92], [28, -86], [6, -84]];
          if (c === 'bonnet') return [[30, -70], [24, -88], [6, -100], [-18, -100], [-36, -86], [-42, -60], [-40, -30], [-30, -16], [-22, -26], [-18, -50], [-6, -66], [12, -74], [26, -76]];
          return OFFP;
        },
        paint: (p) => {
          const c = p.coiffe, col = p.chapeauCol || dk(vRobe(p), 0.35);
          fillPts(rect(-60, -120, 60, 20), c === 'bonnet' ? (p.chapeauCol || '#e4dccb') : col);
          if (c === 'chapeau') { fillPts([[4, -98], [36, -98], [36, -92], [4, -92]], lt(col, 0.35)); }
          if (c === 'bonnet') { strokePts([[28, -72], [8, -92], [-20, -94], [-38, -66], [-34, -26]], 'rgba(150,130,100,0.6)', 1.4); for (let k = 0; k < 5; k++) strokePts([[20 - k * 10, -76 + k * 2], [14 - k * 12, -94 + k * 4]], 'rgba(150,130,100,0.35)', 1); }
          hatch(null, 0.7, 3.4, 0.2);
        },
        extra: (p) => {
          const c = p.coiffe;
          if (c === 'chapeau') { pc([[30, -100], [22, -118], [6, -126], [-14, -122], [-30, -110], [-14, -114], [4, -114], [20, -106]], p.plumeCol || '#e9e2d0', () => { strokePts([[28, -100], [4, -118], [-28, -110]], 'rgba(120,110,90,0.6)', 1); }, 9409); }
          if (c === 'voilette' && !SIL()) { const cc = cx_(); cc.save(); cc.fillStyle = 'rgba(30,24,30,0.28)'; cc.beginPath(); cc.moveTo(36, -92); cc.lineTo(38, -46); cc.lineTo(26, -40); cc.lineTo(10, -84); cc.closePath(); cc.fill(); cc.strokeStyle = 'rgba(30,24,30,0.4)'; cc.lineWidth = 0.6; for (let k = 0; k < 6; k++) { cc.beginPath(); cc.moveTo(12 + k * 4.5, -86); cc.lineTo(26 + k * 2, -42); cc.stroke(); } cc.restore(); dot(30, -60, 1.8, 'rgba(30,24,30,0.6)'); dot(34, -70, 1.6, 'rgba(30,24,30,0.6)'); }
          if (c === 'bonnet') { strokePts([[-24, -22], [-4, 2], [8, 12]], p.rubanCol || '#6e2233', 3); pc([[6, 10], [16, 4], [18, 16], [12, 26], [8, 18], [0, 26], [-2, 14]], p.rubanCol || '#6e2233', null, 9410); }
        } },
      armF_up: upDef([-2, -146], '#8c6f7c', 9411, (p) => vRobe(p), (p) => { fillPts([[-17, -20], [17, -20], [18, 14], [0, 22], [-18, 14]], dk(vRobe(p), 0.15)); strokePts([[-16, 12], [0, 20], [16, 12]], lt(vRobe(p), 0.3), 1.4); }),
      armF_lo: foreDef('armF_up', '#8c6f7c', VE.gant, false, 9412, VE.dentelle, (p) => vRobe(p)),
    };
    Object.assign(parts, heldParts(VE.gant, 9420));
    return { nom: 'Viennoise', hipY: -238, parts, handLen: HL, rod: { part: 'torso', at: [-22, 30] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'head', 'chignon', 'cheveux', 'coiffe', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts'] };
  }
  CH.danViennoise = mkViennoise();
  DAN.viennoisePose = function (p, G) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    q.coiffe = q.coiffe || 'chignon'; q.robe = q.robe || '#8c6f7c';
    const ap = clamp(q.applaudir || 0), ev = ease(clamp(q.eventer || 0)), te = ease(clamp(q.tendre || 0)), ba = ease(clamp(q.baille || 0)), ho = clamp(q.hoche || 0);
    if ((ev > 0 || te > 0 || ba > 0) && q.tenu == null) q.tenu = 'eventail';
    if (ho > 0) A.head = (A.head || 0) + 0.16 * ho * (0.5 + 0.5 * Math.sin(t * 6.5));
    if (te > 0) { blend(q, 'armF_up', -1.5, te); blend(q, 'armF_lo', -0.06, te); }
    if (ev > 0) { reach(G, q, 'armF', [76, -116], ev, 'torso'); A.objet = (A.objet || 0) + 0.75 * ev; if (q.tenu === 'eventail') q.tenuO = Object.assign({}, q.tenuO, { battre: Math.max(ev, (q.tenuO && q.tenuO.battre) || 0) }); }
    if (ba > 0) { A.head = (A.head || 0) - 0.12 * ba; q._bouche = ba; if (ba > 0.4 && !q.face.eyes) q.face.eyes = 'closed'; reach(G, q, 'armF', [40, 30], ba, 'head'); }
    if (ap > 0) clap(G, q, ap, q.fort ? 1 : 0);
    return finish(q);
  };
  DAN.viennoise = wrap(CH.danViennoise, DAN.viennoisePose, 0.88);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
    const r = M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.pt = (nom) => { const q = ptOf(ob, nom, o); return q ? r.w('o', q[0] - ob.base[0], q[1] - ob.base[1]) : null; };
    return r;
  }
  for (const n of ['eventail', 'gueridon', 'note', 'portee', 'portraitStrauss']) DAN[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // =====================================================================
  // DÉCORS PRÉ-RENDUS — DAN.init() → DAN.K = { salle, salon, lustre }
  // =====================================================================
  function texToile(x, H, a) { x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = a; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, M.W, H); x.restore(); }
  const arche = (x0, x1, ys, y1) => [[x0, y1, 1], [x0, ys]].concat(ep((x0 + x1) / 2, ys, (x1 - x0) / 2, (x1 - x0) / 2, 14, PI, TAU), [[x1, ys], [x1, y1, 1]]);
  function ciel(x, x0, x1, y0, y1) {
    const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#2e3458'); g.addColorStop(0.45, '#6a5274'); g.addColorStop(0.8, '#c9805e'); g.addColorStop(1, '#e0a464');
    x.fillStyle = g; x.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  // Salle de bal : mur crème et or, trois hautes fenêtres (celle du milieu : flèche de Saint-Étienne), pilastres, tentures, estrade à droite
  DAN.SALLE = { fenetres: [[150, 330], [450, 630], [750, 930]], fleche: { x: 540, y: 520 }, estrade: { x0: 600, x1: 1080, y: 1300 }, pupitres: [690, 850], chaises: [760, 930], lustre: { x: 540, y: 600 } };
  function makeSalle() {
    const H = ST.back + 5, S = DAN.SALLE, YS = 560, YB = 1060;
    return M.pre(M.W, H, (x) => {
      x.fillStyle = '#e2d6b8'; x.fillRect(0, 0, M.W, H);
      x.fillStyle = '#5a4630'; x.fillRect(0, 0, M.W, 330);
      for (let k = 0; k < 9; k++) pc(rect(k * 124 - 10, 200, k * 124 + 104, 300), '#6a5238', () => strokePts(rect(k * 124 + 4, 214, k * 124 + 90, 286), '#c8a24a', 2, true), 9500 + k);
      pc(rect(-10, 300, M.W + 10, 352), '#d8c690', () => { for (let k = 0; k < 54; k++) dot(k * 20 + 10, 326, 4, '#b8913f'); strokePts([[0, 306], [M.W, 306]], 'rgba(255,250,230,0.6)', 2); strokePts([[0, 346], [M.W, 346]], 'rgba(110,80,30,0.5)', 2); }, 9510);
      S.fenetres.forEach(([x0, x1], i) => {
        pc(arche(x0 - 20, x1 + 20, YS, YB + 20), '#c8a24a', () => {
          ciel(x, x0, x1, YS - 100, YB);
          if (i === 1) {                                                                      // cathédrale Saint-Étienne : flèche gothique + grand toit à chevrons
            const fx = (x0 + x1) / 2;
            fillPts([[x0, YB], [x0, 930], [fx - 40, 900], [fx - 30, 760], [fx - 18, 740], [fx - 14, 640], [fx - 6, 600], [fx, YS - 60, 1], [fx + 6, 600], [fx + 14, 640], [fx + 18, 740], [fx + 30, 760], [fx + 40, 870], [x1 - 20, 820], [x1, 840], [x1, YB]], '#3c3048');
            for (let k = 0; k < 4; k++) strokePts([[fx + 44, 880 + k * 22], [fx + 56, 868 + k * 22], [fx + 68, 880 + k * 22], [fx + 80, 864 + k * 22]], 'rgba(160,130,90,0.45)', 2);
            for (const [wx, wy] of [[fx - 8, 800], [fx + 4, 800], [fx - 2, 700]]) fillPts(rect(wx, wy, wx + 5, wy + 18), 'rgba(240,190,110,0.5)');
          } else {
            fillPts([[x0, YB], [x0, 960], [x0 + 30, 950], [x0 + 40, 930], [x0 + 70, 930], [x0 + 80, 900], [x0 + 110, 905], [x0 + 120, 940], [x1, 935], [x1, YB]], '#4a3a52');
            for (let k = 0; k < 4; k++) fillPts(rect(x0 + 20 + k * 40, 960, x0 + 26 + k * 40, 970), 'rgba(240,190,110,0.55)');
          }
          x.strokeStyle = '#8a6a28'; x.lineWidth = 6; x.beginPath(); x.moveTo((x0 + x1) / 2, YS - 90); x.lineTo((x0 + x1) / 2, YB);
          for (const yy of [700, 840, 980]) { x.moveTo(x0, yy); x.lineTo(x1, yy); } x.stroke();
          x.fillStyle = 'rgba(255,250,235,0.16)'; x.beginPath(); x.moveTo(x0, 760); x.lineTo(x0 + 70, YS - 40); x.lineTo(x0 + 110, YS - 40); x.lineTo(x0, 840); x.fill();
        }, 9520 + i);
        pc(rect(x0 - 34, YB + 14, x1 + 34, YB + 34), '#d8c690', null, 9530 + i);
        for (const sd of [-1, 1]) {                                                             // rideaux de velours rouge sombre noués
          const xa = sd < 0 ? x0 - 60 : x1 + 60, xb = sd < 0 ? x0 + 16 : x1 - 16, xm = sd < 0 ? x0 - 6 : x1 + 6;
          pc([[xa, 400], [xb, 400], [lerp(xb, xm, 0.6), 600], [xm, 800], [lerp(xb, xm, 0.3), 960], [xb + sd * 10, 1110], [xa, 1110]], '#6a2430', () => {
            for (let k = 1; k < 4; k++) strokePts([[lerp(xa, xb, k / 4), 404], [lerp(xa, xm, k / 4), 800], [lerp(xa, xb, k / 4), 1106]], 'rgba(30,8,10,0.45)', 2);
            hatch(null, 1.3, 4, 0.2, 1, P.encre, [Math.min(xa, xb) - 10, 400, Math.max(xa, xb) + 10, 1112]);
          }, 9540 + i * 2 + (sd > 0 ? 1 : 0));
          pc(ell(xm, 800, 12, 9, 12), '#c8a24a', null, 9560 + i);
        }
        pc([[x0 - 70, 384, 1], [x1 + 70, 384, 1], [x1 + 70, 452], [x1 + 10, 476], [(x0 + x1) / 2, 458], [x0 - 10, 476], [x0 - 70, 452]], '#6a2430', () => {
          strokePts([[x0 - 70, 448], [x0 - 10, 472], [(x0 + x1) / 2, 454], [x1 + 10, 472], [x1 + 70, 448]], '#c8a24a', 3);
        }, 9570 + i);
      });
      for (const px of [40, 390, 690, 1040]) {                                                  // pilastres crème à chapiteaux dorés
        pc([[px - 26, 1100, 1], [px + 26, 1100, 1], [px + 22, 420], [px + 32, 392, 1], [px - 32, 392, 1], [px - 22, 420]], '#ece2c6', () => {
          for (let k = -14; k <= 14; k += 7) strokePts([[px + k, 430], [px + k, 1090]], 'rgba(140,120,80,0.35)', 1.6);
          fillPts(rect(px - 32, 380, px + 32, 420), '#c8a24a'); for (const dx of [-18, 0, 18]) strokePts(ep(px + dx, 404, 6, 6, 8, 0, 5.5), 'rgba(110,80,30,0.7)', 1.4);
        }, 9580 + px);
      }
      pc(rect(-10, 1100, M.W + 10, H + 10), '#d4c7a2', () => {                                   // lambris crème à moulures dorées
        for (let k = 0; k < 8; k++) strokePts(rect(24 + k * 136, 1150, 136 + k * 136, 1360), '#b8913f', 2.2, true);
        strokePts([[0, 1112], [M.W, 1112]], '#b8913f', 3); hatch(null, 0.2, 5, 0.12, 1, P.encre, [0, 1100, M.W, H]);
      }, 9590);
      // estrade de bois avec deux pupitres vides et deux chaises viennoises cintrées
      const E = S.estrade;
      pc(rect(E.x0, E.y, E.x1 + 10, H + 10), '#7a5434', () => {
        fillPts(rect(E.x0, E.y, E.x1 + 10, E.y + 10), '#9a7048');
        for (let y = E.y + 26; y < H; y += 24) strokePts([[E.x0, y], [E.x1 + 10, y]], 'rgba(40,24,10,0.45)', 1.4);
        for (let k = E.x0 + 60; k < E.x1; k += 130) strokePts([[k, E.y + 10], [k, H]], 'rgba(40,24,10,0.3)', 1.2);
      }, 9600);
      for (const cx of S.chaises) {
        pc([[cx - 26, E.y, 1], [cx - 22, E.y - 68], [cx + 24, E.y - 68], [cx + 26, E.y, 1], [cx + 20, E.y], [cx + 18, E.y - 60], [cx - 16, E.y - 60], [cx - 20, E.y]], '#3a2418', null, 9610 + cx);
        pc(rect(cx - 30, E.y - 76, cx + 30, E.y - 66), '#4a2e1e', null, 9620 + cx);
        pc([[cx - 24, E.y - 72], [cx - 30, E.y - 130], [cx - 22, E.y - 172], [cx - 6, E.y - 180], [cx + 2, E.y - 168], [cx - 10, E.y - 164], [cx - 18, E.y - 130], [cx - 16, E.y - 72]], '#3a2418', () => strokePts(ep(cx - 16, E.y - 140, 8, 14, 10, 0, TAU), 'rgba(200,160,110,0.4)', 1.4), 9630 + cx);
      }
      for (const px of S.pupitres) {
        pc([[px - 3, E.y - 4], [px + 3, E.y - 4], [px + 3, E.y - 200], [px - 3, E.y - 200]], '#2a2420', null, 9640 + px);
        pc([[px - 30, E.y, 1], [px, E.y - 34], [px + 30, E.y, 1], [px + 26, E.y], [px, E.y - 26], [px - 26, E.y]], '#2a2420', null, 9650 + px);
        pc([[px - 46, E.y - 196], [px + 40, E.y - 230], [px + 46, E.y - 218], [px - 40, E.y - 184]], '#3a302a', () => strokePts([[px - 40, E.y - 190], [px + 42, E.y - 222]], 'rgba(200,180,140,0.35)', 1.2), 9660 + px);
      }
      texToile(x, H, 0.35);
      const vg = x.createLinearGradient(0, H - 160, 0, H); vg.addColorStop(0, 'rgba(30,20,10,0)'); vg.addColorStop(1, 'rgba(30,20,10,0.3)'); x.fillStyle = vg; x.fillRect(0, H - 160, M.W, 160);
    });
  }
  // Salon bourgeois : papier peint vert pâle rayé, lambris ivoire, fenêtre à rideau, petite bibliothèque ; place du portrait à gauche
  DAN.SALON = { portrait: { x: 260, y: 660 }, fenetre: { x0: 690, x1: 880, y0: 470, y1: 960 }, bibli: { x0: 110, x1: 400, y: 1180 }, metronome: { x: 340, y: 1180 } };
  function makeSalon() {
    const H = ST.back + 5, S = DAN.SALON, F = S.fenetre, B = S.bibli;
    return M.pre(M.W, H, (x) => {
      x.fillStyle = '#b8c5a0'; x.fillRect(0, 0, M.W, H);
      for (let k = 0; k < M.W; k += 54) { x.fillStyle = 'rgba(120,140,100,0.35)'; x.fillRect(k, 340, 16, 720); x.fillStyle = 'rgba(255,255,240,0.2)'; x.fillRect(k + 30, 340, 3, 720); }
      for (let r = 0; r < 10; r++) for (let k = 0; k < 20; k++) { const px = k * 54 + 38, py = 400 + r * 68 + (k % 2) * 34; if (py < 1040) { x.fillStyle = 'rgba(110,130,90,0.45)'; x.beginPath(); x.ellipse(px, py, 3, 6, 0, 0, TAU); x.fill(); } }
      x.fillStyle = '#3e4a38'; x.fillRect(0, 0, M.W, 300);
      pc(rect(-10, 296, M.W + 10, 350), '#ece6d2', () => { strokePts([[0, 304], [M.W, 304]], 'rgba(255,255,255,0.6)', 2); for (let k = 0; k < 60; k++) fillPts(rect(k * 18 + 4, 322, k * 18 + 12, 340), 'rgba(160,150,120,0.5)'); }, 9701);
      pc(rect(F.x0 - 20, F.y0 - 20, F.x1 + 20, F.y1 + 20), '#ece6d2', () => {
        ciel(x, F.x0, F.x1, F.y0, F.y1);
        fillPts([[F.x0, F.y1], [F.x0, 860], [720, 850], [730, 820], [770, 820], [776, 790], [784, 820], [820, 826], [850, 806], [F.x1, 840], [F.x1, F.y1]], '#4a3a52');
        for (let k = 0; k < 5; k++) fillPts(rect(F.x0 + 18 + k * 34, 880, F.x0 + 24 + k * 34, 890), 'rgba(240,190,110,0.55)');
        x.strokeStyle = '#ece6d2'; x.lineWidth = 7; x.beginPath(); x.moveTo((F.x0 + F.x1) / 2, F.y0); x.lineTo((F.x0 + F.x1) / 2, F.y1); x.moveTo(F.x0, 640); x.lineTo(F.x1, 640); x.moveTo(F.x0, 800); x.lineTo(F.x1, 800); x.stroke();
      }, 9702);
      for (const sd of [-1, 1]) {
        const xa = sd < 0 ? F.x0 - 70 : F.x1 + 70, xb = sd < 0 ? F.x0 + 22 : F.x1 - 22, xm = sd < 0 ? F.x0 - 10 : F.x1 + 10;
        pc([[xa, 420], [xb, 420], [lerp(xb, xm, 0.6), 600], [xm, 760], [lerp(xb, xm, 0.3), 900], [xb, 1030], [xa, 1030]], '#3d5a5a', () => {
          for (let k = 1; k < 5; k++) strokePts([[lerp(xa, xb, k / 5), 424], [lerp(xa, xm, k / 5), 760], [lerp(xa, xb, k / 5), 1026]], 'rgba(10,30,30,0.45)', 2);
          hatch(null, 1.3, 4, 0.2, 1, P.encre, [Math.min(xa, xb) - 10, 420, Math.max(xa, xb) + 10, 1032]);
        }, 9710 + sd);
        pc(ell(xm, 760, 11, 8, 12), '#c8a24a', null, 9714 + sd);
      }
      pc([[F.x0 - 84, 404, 1], [F.x1 + 84, 404, 1], [F.x1 + 84, 440, 1], [F.x0 - 84, 440, 1]], '#7a5a3a', () => strokePts([[F.x0 - 84, 414], [F.x1 + 84, 414]], 'rgba(255,230,190,0.4)', 1.4), 9716);
      pc(rect(-10, 1040, M.W + 10, H + 10), '#ddd3b6', () => {
        for (let k = 0; k < 7; k++) { const x0 = 22 + k * 154; strokePts([[x0, 1340], [x0, 1090], [x0 + 130, 1090]], 'rgba(255,255,240,0.6)', 2.2); strokePts([[x0 + 130, 1090], [x0 + 130, 1340], [x0, 1340]], 'rgba(100,86,60,0.5)', 2.2); }
        strokePts([[0, 1048], [M.W, 1048]], 'rgba(100,86,60,0.6)', 3); hatch(null, 0.2, 5, 0.1, 1, P.encre, [0, 1040, M.W, H]);
      }, 9720);
      // petite bibliothèque (dos de livres de couleur, sans titre) + métronome
      pc(rect(B.x0, B.y, B.x1, H + 10), '#5a3a24', () => {
        const cols = ['#6a2430', '#3d4f6a', '#5a6a3a', '#8a6a3a', '#4a3a52', '#7a3a2a', '#2f4a52'];
        for (let sh = 0; sh < 2; sh++) {
          const y0 = B.y + 20 + sh * 100, y1 = y0 + 84; fillPts(rect(B.x0 + 12, y0, B.x1 - 12, y1), '#2a1a10');
          let xx = B.x0 + 16, k = sh * 3;
          while (xx < B.x1 - 30) { const w = 12 + (k * 7) % 9, hgt = 62 + (k * 13) % 20; fillPts(rect(xx, y1 - hgt, xx + w, y1), cols[k % cols.length]); fillPts(rect(xx + 2, y1 - hgt + 10, xx + w - 2, y1 - hgt + 13), 'rgba(220,190,120,0.6)'); xx += w + 2; k++; }
          fillPts(rect(B.x0 + 6, y1, B.x1 - 6, y1 + 10), '#6a4a30');
        }
        strokePts(rect(B.x0 + 4, B.y + 4, B.x1 - 4, H), 'rgba(255,220,170,0.25)', 2, true);
      }, 9730);
      pc(rect(B.x0 - 10, B.y - 12, B.x1 + 10, B.y + 4), '#6a4a30', null, 9731);
      const Mx = S.metronome.x, My = B.y - 12;
      pc([[Mx - 22, My, 1], [Mx + 22, My, 1], [Mx + 8, My - 80, 1], [Mx - 8, My - 80, 1]], '#4a2a1c', () => { strokePts([[Mx, My - 10], [Mx + 10, My - 74]], '#c8a24a', 2); dot(Mx + 7, My - 56, 3.5, '#c8a24a'); }, 9732);
      pc([[S.portrait.x - 4, S.portrait.y - 154], [S.portrait.x + 4, S.portrait.y - 154], [S.portrait.x + 4, S.portrait.y - 146], [S.portrait.x - 4, S.portrait.y - 146]], '#8a6a28', null, 9733);
      texToile(x, H, 0.35);
      const vg = x.createLinearGradient(0, H - 140, 0, H); vg.addColorStop(0, 'rgba(30,20,10,0)'); vg.addColorStop(1, 'rgba(30,20,10,0.3)'); x.fillStyle = vg; x.fillRect(0, H - 140, M.W, 140);
    });
  }
  // lustre : pré-rendu (origine = bas-centre) ; flammes animées par DAN.lustre(t)
  const LU = { w: 420, h: 330, flammes: [] };
  for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2; LU.flammes.push([a * 170, -150 + Math.abs(a) * 10]); }
  for (let i = 0; i < 4; i++) { const a = (i / 3 - 0.5) * 2; LU.flammes.push([a * 92, -232 + Math.abs(a) * 6]); }
  function makeLustre() {
    const cv = M.cutFlat(LU.w + 20, LU.h + 40, (LU.w + 20) / 2, LU.h + 20, () => {
      pc([[-6, -330], [6, -330], [8, -60], [18, -40], [10, 0], [-10, 0], [-18, -40], [-8, -60]], '#b8913f', () => strokePts([[-2, -320], [-2, -10]], 'rgba(255,240,190,0.6)', 1.6), 9801);
      for (const [fx, fy] of LU.flammes) {
        const ty = fy + 26;
        pc([[0, ty + 50], [fx * 0.3, ty + 56], [fx * 0.8, ty + 34], [fx, ty + 2], [fx + (fx >= 0 ? 4 : -4), ty + 2], [fx * 0.84, ty + 40], [fx * 0.3, ty + 62], [0, ty + 58]], '#b8913f', null, 9802 + Math.round(fx));
        pc(rect(fx - 10, ty - 2, fx + 10, ty + 6), '#c8a24a', null, 9803 + Math.round(fx));
        pc(rect(fx - 4, fy, fx + 4, ty - 2), '#f1ead8', null, 9804 + Math.round(fx));
      }
      for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2; const px = a * 130, py = -96 + Math.abs(a) * 26; pc([[px, py - 8], [px + 5, py + 4], [px, py + 16], [px - 5, py + 4]], '#dfe8ec', () => dot(px - 1, py, 1.6, '#ffffff'), 9810 + i); }
      pc([[-14, -10], [14, -10], [6, 14], [0, 22], [-6, 14]], '#c8a24a', null, 9820);
    });
    cv.padB = 20; return M.withShadow(cv, 8);
  }
  DAN.lustre = function (t, o) {
    o = o || {}; const L = DAN.K && DAN.K.lustre; if (!L) return;
    const x = o.x == null ? DAN.SALLE.lustre.x : o.x, y = o.y == null ? DAN.SALLE.lustre.y : o.y, f = o.f || 0.7, ph = o.ph || 0, amp = o.amp == null ? 0.012 : o.amp;
    const sw = Math.sin((t || 0) * f + ph) * amp, c = cx_();
    c.save(); c.strokeStyle = 'rgba(40,30,15,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + Math.sin(sw) * 330, y - 330 * Math.cos(sw)); c.lineTo(x, -20); c.stroke(); c.restore();
    M.flat(L, x, y, { rot: sw, cast: o.cast });
    c.save(); c.translate(x, y); c.rotate(sw);
    const oy = 0;
    for (let i = 0; i < LU.flammes.length; i++) {
      const [fx, fy] = LU.flammes[i], fl = 1 + 0.18 * Math.sin(t * 11 + i * 2.3) + 0.08 * Math.sin(t * 23 + i);
      const g = c.createRadialGradient(fx, fy + oy - 6, 1, fx, fy + oy - 6, 26); g.addColorStop(0, 'rgba(255,220,140,0.45)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.fillRect(fx - 28, fy + oy - 34, 56, 56);
      c.fillStyle = '#ffcf6a'; c.beginPath(); c.moveTo(fx - 4, fy + oy); c.quadraticCurveTo(fx - 5, fy + oy - 9 * fl, fx + 0.6 * Math.sin(t * 9 + i), fy + oy - 17 * fl); c.quadraticCurveTo(fx + 5, fy + oy - 9 * fl, fx + 4, fy + oy); c.fill();
      c.fillStyle = '#fff4d0'; c.beginPath(); c.ellipse(fx, fy + oy - 4, 1.8, 4 * fl, 0, 0, TAU); c.fill();
    }
    c.restore();
  };
  DAN.init = function () {
    if (DAN.K) return DAN.K;
    const K = (DAN.K = {});
    K.salle = makeSalle(); K.salon = makeSalon(); K.lustre = makeLustre();
    return K;
  };
})();
