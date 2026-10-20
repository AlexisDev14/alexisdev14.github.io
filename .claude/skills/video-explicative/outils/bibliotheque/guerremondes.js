// persos.js — « La Guerre des mondes, la panique qui n'a pas eu lieu » (États-Unis, 1938) : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.gdm (alias GDM). Appeler GDM.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun tirage aléatoire) : fonction pure de t.
// INDEX : 1) géométrie  2) objets (feuillets, journal, cigare, valise, sac, micro, radio, pile)  3) objets tenus, IK, enveloppes
//         4) Welles, patron  5) tripode martien  6) accessoires seuls  7) décors studio CBS et salle de rédaction (pré-rendus dans GDM.init)
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const GDM = (M.gdm = {});
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
  const fr = (x) => x - Math.floor(x);
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function cbez(p0, p1, p2, p3, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }
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
  const INK = '#24201d', PAP = '#e9e1cc';

  // =====================================================================
  // 2) OBJETS (dessinés à l'échelle 1 ; repère propre à chaque objet)
  // =====================================================================
  // ---- feuillets du script : liasse de 4 feuilles (80 × 104), répliques en traits gris ; repère = centre
  const FW = 40, FH = 52;
  function drawFeuillets(o) {
    const c = cx_(), n = o.n || 4;
    for (let i = n - 1; i >= 0; i--) {
      c.save(); c.translate(i * 3.5, -i * 2.6); c.rotate((i % 2 ? -1 : 1) * 0.03 * i);
      pc(rect(-FW, -FH, FW, FH), i ? '#ddd5c2' : '#f2ede1', i ? () => hatch(null, 0.8, 5, 0.08) : () => {
        let y = -FH + 12;
        for (let b = 0; b < 7 && y < FH - 10; b++) {
          strokePts([[-FW + 10, y], [-FW + 25, y]], 'rgba(40,36,34,0.75)', 1.6); y += 6;
          const nl = 1 + ((b * 7) % 3);
          for (let l = 0; l < nl && y < FH - 6; l++) { strokePts([[-FW + 15, y], [FW - 9 - (((b + l) * 9) % 18), y]], 'rgba(90,85,80,0.5)', 1.1); y += 5.4; }
          y += 4;
        }
        strokePts([[-FW + 6, -FH + 3], [-FW + 6, FH - 3]], 'rgba(150,50,50,0.35)', 1);
        shade(FW, 0, -FW, 0, 0.12, [-FW, -FH, FW, FH]);
      }, 9100 + i, { texA: 0.35 });
      c.restore();
    }
    pc([[-FW + 6, -FH - 6], [-FW + 16, -FH - 6], [-FW + 16, -FH + 14], [-FW + 6, -FH + 14]], '#8e9298', () => strokePts([[-FW + 9, -FH - 3], [-FW + 9, -FH + 10]], '#d8dade', 1.2), 9109, { drop: false });   // pince
  }

  // ---- journal de 1938 : 240 × 312 (demi JW × JH), repère = centre ; o.face 'une' | 'dos' ; o.plie 0..1 (plié en deux, moitié basse repliée derrière)
  const JW = 120, JH = 156, JG = [-JW + 12, -JH + 8], JD = [JW - 12, -JH + 8], JG2 = [-JW + 56, -JH + 6];   // JG2 : prise de la main arrière sur le bord haut (le coude reste caché derrière le corps)
  function frise(x0, x1, y0, y1) {                     // bandeau de titre décoratif : frise d'arcs gothiques ajourés + rosace (aucune lettre)
    const h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    fillPts(rect(x0, y0, x1, y1), INK, 0, 0);
    for (let x = x0 + 8; x < x1 - 10; x += 13) {
      if (Math.abs(x + 3 - cx) < h * 0.75) continue;
      fillPts([[x, y1 - 5, 1], [x, y0 + h * 0.45], [x + 3.3, y0 + 5, 1], [x + 6.6, y0 + h * 0.45], [x + 6.6, y1 - 5, 1]], PAP, 0, 0);
    }
    fillPts(ell(cx, cy, h * 0.42, h * 0.42, 18), PAP, 0, 0);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; fillPts(ell(cx + Math.cos(a) * h * 0.22, cy + Math.sin(a) * h * 0.22, h * 0.085, h * 0.085, 8), INK, 0, 0); }
    dot(cx, cy, h * 0.1, INK);
  }
  function gravTripode(cx, by, h, encre) {           // tripode gravé (encre), (cx, by) = sol sous le corps
    const k = h / 520, I = encre || INK, hy = by - 330 * k;
    for (const [s0, s1, s2] of [[0.15, 0.9, 0.55], [-1, -1.6, -1.1], [1, 1.6, 1.1]]) {
      const hip = [cx + s0 * 30 * k, hy + 8 * k], knee = [cx + s1 * 92 * k, hy + 80 * k], foot = [cx + s2 * 92 * k, by];
      fillPts(ribbon([hip, knee, foot], 13 * k, 9 * k), I, 0, 0);
      fillPts(rect(foot[0] - 20 * k, by - 8 * k, foot[0] + 20 * k, by), I, 0, 0);
    }
    fillPts(ep(cx, hy, 98 * k, 186 * k, 18, PI, TAU), I, 0, 0);
    fillPts(rect(cx - 104 * k, hy - 8 * k, cx + 104 * k, hy + 14 * k), I, 0, 0);
    for (let i = 1; i < 5; i++) strokePts(ep(cx, hy, 98 * k * i / 5, 186 * k, 10, PI * 1.08, PI * 1.5), 'rgba(233,225,204,0.55)', 0.8);
    for (const tx of [-1, 1]) {                       // tentacules levés
      fillPts(ribbon(cbez([cx + 50 * k, hy + 10 * k], [cx + 120 * k + tx * 10 * k, hy - 20 * k], [cx + 150 * k, hy - 140 * k], [cx + (120 + 30 * tx) * k, hy - 190 * k], 12), 16 * k, 5 * k), I, 0, 0);
    }
    const ex = cx + 64 * k, ey = hy - 92 * k;
    fillPts(ell(ex, ey, 30 * k, 30 * k, 14), PAP, 0, 0); dot(ex + 4 * k, ey, 13 * k, I);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; strokePts([[ex + Math.cos(a) * 38 * k, ey + Math.sin(a) * 38 * k], [ex + Math.cos(a) * 60 * k, ey + Math.sin(a) * 60 * k]], I, 1); }
  }
  function coureur(x, by, h, o) {                      // silhouette gravée qui court vers +x ; o.chapeau, o.robe, o.chignon, o.valise
    const k = h / 100, I = INK, hip = [x, by - 50 * k], nk = [x + 12 * k, by - 84 * k];
    fillPts(ribbon([hip, [x + 16 * k, by - 26 * k], [x + 30 * k, by - 4 * k]], 9 * k, 7 * k), I, 0, 0);
    fillPts(ribbon([hip, [x - 12 * k, by - 26 * k], [x - 30 * k, by - 18 * k]], 9 * k, 7 * k), I, 0, 0);
    if (o.robe) fillPts([[nk[0] - 7 * k, nk[1]], [nk[0] + 7 * k, nk[1] + 2 * k], [x + 20 * k, by - 28 * k], [x - 22 * k, by - 24 * k]], I, 0, 0);
    else fillPts([[nk[0] - 9 * k, nk[1]], [nk[0] + 8 * k, nk[1] + 2 * k], [x + 9 * k, hip[1] + 4 * k], [x - 10 * k, hip[1] + 4 * k]], I, 0, 0);
    fillPts(ribbon([[nk[0] + 2 * k, nk[1] + 6 * k], [nk[0] + 18 * k, nk[1] + 18 * k], [nk[0] + 30 * k, nk[1] + 8 * k]], 7 * k, 6 * k), I, 0, 0);
    fillPts(ribbon([[nk[0] - 3 * k, nk[1] + 6 * k], [nk[0] - 14 * k, nk[1] + 20 * k], [nk[0] - 24 * k, nk[1] + 32 * k]], 7 * k, 6 * k), I, 0, 0);
    fillPts(ell(nk[0] + 4 * k, nk[1] - 11 * k, 9 * k, 10 * k, 10), I, 0, 0);
    if (o.chapeau) { fillPts(rect(nk[0] - 10 * k, nk[1] - 20 * k, nk[0] + 18 * k, nk[1] - 17 * k), I, 0, 0); fillPts(rect(nk[0] - 5 * k, nk[1] - 30 * k, nk[0] + 12 * k, nk[1] - 18 * k), I, 0, 0); }
    if (o.chignon) dot(nk[0] - 5 * k, nk[1] - 16 * k, 6 * k, I);
    if (o.valise) { fillPts(rect(nk[0] - 40 * k, nk[1] + 30 * k, nk[0] - 14 * k, nk[1] + 48 * k), I, 0, 0); strokePts(ep(nk[0] - 24 * k, nk[1] + 30 * k, 5 * k, 5 * k, 6, PI, TAU), I, 1); }
  }
  function uneFace() {
    const x0 = -JW, x1 = JW, y0 = -JH, y1 = JH;
    pc(rect(x0, y0, x1, y1), PAP, () => {
      shade(x1, y0, x0, y1, 0.14, [x0, y0, x1, y1]);
      frise(x0 + 10, x1 - 10, y0 + 10, y0 + 40);
      strokePts([[x0 + 10, y0 + 46], [x1 - 10, y0 + 46]], INK, 1.4); strokePts([[x0 + 10, y0 + 50], [x1 - 10, y0 + 50]], INK, 0.7);
      fillPts(rect(x0 + 10, y0 + 56, x1 - 10, y0 + 98), INK, 0, 0);                                             // manchette : énorme bande noire
      for (let i = 0; i < 7; i++) strokePts([[x0 + 16 + i * 32, y0 + 64 + (i % 3) * 11], [x0 + 38 + i * 32, y0 + 64 + (i % 3) * 11]], 'rgba(233,225,204,0.10)', 1.2);
      strokePts([[x0 + 10, y0 + 104], [x1 - 10, y0 + 104]], INK, 0.8);
      const gx0 = x0 + 12, gx1 = x1 - 12, gy0 = y0 + 110, gy1 = y0 + 246;                                       // grande gravure
      fillPts(rect(gx0, gy0, gx1, gy1), '#dcd2b8', 0, 0);
      hatch(rect(gx0, gy0, gx1, gy1 - 22), 0.06, 3.4, 0.42, 1, '36,32,29');
      dot(gx1 - 30, gy0 + 22, 11, PAP);                                                                        // lune
      fillPts([[gx0, gy1 - 18], [gx0 + 60, gy1 - 28], [gx1 - 40, gy1 - 24], [gx1, gy1 - 30], [gx1, gy1], [gx0, gy1]], '#5d564c', 0, 0);
      fillPts([[gx1 - 60, gy1 - 26], [gx1 - 60, gy1 - 46], [gx1 - 48, gy1 - 58], [gx1 - 36, gy1 - 46], [gx1 - 36, gy1 - 27]], '#3f3a33', 0, 0);   // ferme lointaine
      gravTripode(gx0 + 62, gy1 - 16, 116);
      coureur(gx0 + 136, gy1 - 6, 50, { chapeau: true, valise: true });
      coureur(gx0 + 168, gy1 - 6, 44, { robe: true, chignon: true });
      coureur(gx0 + 194, gy1 - 6, 26, {});
      for (let i = 0; i < 4; i++) strokePts([[gx0 + 104 - i * 4, gy1 - 40 + i * 8], [gx0 + 120 - i * 4, gy1 - 40 + i * 8]], INK, 1);   // traits de vitesse
      strokePts(rect(gx0, gy0, gx1, gy1), INK, 1.6, true);
      for (let col = 0; col < 3; col++) {                                                                       // colonnes : lignes grises
        const cx0 = x0 + 12 + col * 74, cx1 = cx0 + 66;
        for (let y = gy1 + 10; y < y1 - 8; y += 5.5) strokePts([[cx0, y], [cx1 - ((y * 7 + col * 13) % 14), y]], 'rgba(70,64,58,0.55)', 1);
        if (col) strokePts([[cx0 - 4, gy1 + 8], [cx0 - 4, y1 - 8]], 'rgba(40,36,32,0.6)', 0.8);
      }
      strokePts([[0, y0], [0, y1]], 'rgba(120,100,70,0.1)', 1);
    }, 9200, { texA: 0.45 });
  }
  function dosFace() {
    const x0 = -JW, x1 = JW, y0 = -JH, y1 = JH;
    pc(rect(x0, y0, x1, y1), '#e4dcc6', () => {
      shade(x0, y0, x1, y1, 0.14, [x0, y0, x1, y1]);
      strokePts([[x0 + 10, y0 + 16], [x1 - 10, y0 + 16]], INK, 1.2);
      const ix0 = x1 - 96, iy0 = y0 + 28;                                                                       // petite gravure d'immeuble
      fillPts(rect(ix0, iy0, x1 - 12, iy0 + 96), '#d6ccb2', 0, 0); hatch(rect(ix0, iy0, x1 - 12, iy0 + 96), 0.06, 3.6, 0.3, 1, '36,32,29');
      fillPts(rect(ix0 + 18, iy0 + 22, x1 - 30, iy0 + 96), '#4c463e', 0, 0);
      fillPts([[ix0 + 30, iy0 + 22], [ix0 + 42, iy0 + 6], [ix0 + 54, iy0 + 22]], '#4c463e', 0, 0);
      for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) fillPts(rect(ix0 + 23 + q * 12, iy0 + 28 + r * 11, ix0 + 29 + q * 12, iy0 + 34 + r * 11), '#d6ccb2', 0, 0);
      strokePts(rect(ix0, iy0, x1 - 12, iy0 + 96), INK, 1.2, true);
      for (let col = 0; col < 3; col++) {
        const cx0 = x0 + 12 + col * 74, cx1 = cx0 + 66;
        for (let y = y0 + 26; y < y1 - 8; y += 5.5) { if (col === 2 && y < iy0 + 104) continue; strokePts([[cx0, y], [cx1 - ((y * 5 + col * 11) % 12), y]], 'rgba(70,64,58,0.5)', 1); }
        if (col) strokePts([[cx0 - 4, y0 + 24], [cx0 - 4, y1 - 8]], 'rgba(40,36,32,0.55)', 0.8);
      }
      fillPts(rect(x0 + 12, y1 - 70, x0 + 76, y1 - 22), 'rgba(40,36,32,0.18)', 0, 0); strokePts(rect(x0 + 12, y1 - 70, x0 + 76, y1 - 22), INK, 1, true);
    }, 9201, { texA: 0.45 });
  }
  function drawJournal(o) {
    const c = cx_(), pl = clamp(o.plie || 0), face = o.face === 'dos' ? dosFace : uneFace;
    c.save(); if (flipped()) c.scale(-1, 1);
    if (pl <= 0) face();
    else {
      c.save(); c.beginPath(); c.rect(-JW - 20, -JH - 20, 2 * JW + 40, JH + 20); c.clip(); face(); c.restore();
      if (pl < 1) { c.save(); c.scale(1, 1 - pl); c.beginPath(); c.rect(-JW - 20, 0, 2 * JW + 40, JH + 20); c.clip(); face(); fillPts(rect(-JW, 0, JW, JH), `rgba(40,30,20,${0.3 * pl})`, 0, 0); c.restore(); }
      strokePts([[-JW, 0], [JW, 0]], 'rgba(90,70,50,0.6)', 1.4);
    }
    c.restore();
  }

  // ---- cigare (92 de long), repère = prise ; bague rouge et or sans inscription ; fumée M.fumee au bout (o.fumee false pour la couper)
  const CG = 0.6;
  function fumeeMonde(t, lx, ly, o) {          // fumée qui monte vers le haut de l'écran quel que soit l'angle de l'objet
    if (SIL()) return;
    const c = cx_(); c.save(); c.translate(lx, ly); const m = c.getTransform(), sc = Math.hypot(m.a, m.b);
    c.setTransform(sc, 0, 0, sc, m.e, m.f); M.fumee(t, Object.assign({ x: 0, y: 0 }, o)); c.restore();
  }
  function drawCigare(o) {
    const c0 = cx_(); c0.save(); c0.scale(CG, CG);
    pc([[-44, -6], [30, -8.5], [46, -7.5], [46, 7.5], [30, 8.5], [-44, 6], [-48, 3], [-48, -3]], '#6b4528', () => {
      strokePts([[-40, -2], [42, -3]], 'rgba(170,120,80,0.5)', 1.2);
      for (let x = -36; x < 42; x += 9) strokePts([[x, -8], [x + 5, 8]], 'rgba(40,24,12,0.4)', 1);
      fillPts(rect(-30, -9, -16, 9), '#9a2a26'); fillPts(rect(-27, -9, -19, 9), '#c9a24a');
    }, 9300);
    pc(rect(46, -7.5, 54, 7.5), '#a19b92', () => strokePts([[48, -6], [52, 6]], 'rgba(60,60,60,0.4)', 1), 9301, { drop: false });
    if (!SIL()) { const c = cx_(), g = c.createRadialGradient(55, 0, 1, 55, 0, 12); g.addColorStop(0, 'rgba(255,140,60,0.7)'); g.addColorStop(1, 'rgba(255,120,50,0)'); c.fillStyle = g; c.fillRect(43, -12, 24, 24); }
    dot(55, 0, 3.2, '#e0602a');
    c0.restore();
    if (o.fumee !== false) fumeeMonde(o.t || 0, 56 * CG, -3 * CG, { s: 0.28, n: 5, haut: 170, vent: 18, col: '#d8d2c6', a: 0.55, seed: 33 });
  }

  // ---- valise de cuir (156 × 104), repère : haut du corps au milieu (poignée au-dessus, prise [0,-17])
  function drawValise() {
    pc([[-26, 2], [-24, -16], [-15, -25], [15, -25], [24, -16], [26, 2], [17, 2], [15, -11], [10, -15], [-10, -15], [-15, -11], [-17, 2]], '#3a2416', () => strokePts([[-14, -21], [14, -21]], 'rgba(255,220,180,0.25)', 1.2), 9400);
    pc([[-74, 0], [74, 0], [78, 6], [78, 98], [74, 104], [-74, 104], [-78, 98], [-78, 6]], '#7a4a2a', () => {
      strokePts([[-74, 10], [74, 10]], 'rgba(40,20,10,0.5)', 1.2); strokePts([[-70, 14], [70, 14]], 'rgba(255,220,180,0.18)', 1);
      for (const x of [-46, 46]) { fillPts(rect(x - 9, 0, x + 9, 104), '#5a341c'); for (let y = 6; y < 100; y += 7) dot(x, y, 0.8, 'rgba(255,220,180,0.35)'); fillPts(rect(x - 11, 52, x + 11, 64), '#b58f45'); }
      for (const [x, y] of [[-78, 0], [78, 0], [-78, 104], [78, 104]]) fillPts(ell(x, y, 13, 13, 10), '#b58f45');
      for (const x of [-20, 20]) { fillPts(rect(x - 6, 6, x + 6, 18), '#c9a24a'); dot(x, 14, 1.6, '#5a4020'); }
      hatch([[-78, 50], [78, 50], [78, 104], [-78, 104]], 0.8, 4.2, 0.18); shade(0, 0, 0, 104, 0.25, [-80, 0, 80, 106]);
    }, 9401);
  }

  // ---- sac d'argent renflé et ficelé, sans inscription (108 × 126), repère : centre du ventre du sac ; prise 'cou' (défaut) ou 'dessous' (sur les paumes)
  function drawSac() {
    pc([[-14, -16], [-32, -4], [-50, 20], [-56, 48], [-50, 72], [-30, 84], [0, 88], [30, 84], [50, 72], [56, 48], [50, 20], [32, -4], [14, -16]], '#b39a6a', () => {
      for (const [a, b] of [[[-8, -10], [-28, 40]], [[6, -10], [20, 50]], [[-38, 30], [-30, 70]], [[36, 24], [40, 66]]]) strokePts([a, [(a[0] + b[0]) / 2 + 4, (a[1] + b[1]) / 2], b], 'rgba(90,70,40,0.45)', 1.3);
      fillPts(rect(14, 40, 40, 64), '#9c8458'); for (let x = 16; x < 40; x += 5) strokePts([[x, 40], [x, 64]], 'rgba(255,240,200,0.2)', 1);   // pièce cousue
      hatch(null, 0.8, 4.4, 0.2, 1, undefined, [-60, -20, 60, 90]); shade(50, 20, -50, 70, 0.3, [-60, -20, 60, 90]);
    }, 9500);
    pc([[-14, -16], [-22, -32], [-12, -40], [0, -35], [12, -42], [22, -32], [14, -16]], '#a88e5e', () => hatch(null, 1.2, 3, 0.25), 9501);
    pc([[-17, -24], [17, -24], [17, -17], [-17, -17]], '#5a4630', null, 9502, { drop: false });
    strokePts([[-4, -21], [-14, -8], [-10, 2]], '#5a4630', 1.8); strokePts([[4, -21], [10, -6], [16, 0]], '#5a4630', 1.8);
  }

  // ---- micro de studio 1938 (micro à ruban, capsule ovale nervurée, suspension en lyre, grand pied chromé) ; repère : sol, centre du socle ; capsule à 398
  const MIC = { cap: 398, tube: 300, h: 452 };
  function drawMicro(o) {
    const c = cx_(), g = M.tg(o.t || 0), osc = clamp(o.oscille == null ? 1 : o.oscille), lu = clamp(o.lueur == null ? 0.5 : o.lueur);
    const CHR = '#b8bcc0', CHD = '#7c8086', CHL = '#eef0f2';
    pc(ell(0, -10, 62, 13, 22), CHD, () => { fillPts(ell(0, -14, 52, 8, 18), CHR); strokePts(ep(0, -14, 48, 6, 10, PI * 1.1, PI * 1.6), CHL, 1.4); }, 9600);
    pc([[-7, -22], [7, -22], [6, -330], [-6, -330]], CHR, () => { fillPts(rect(-7, -330, -2, -22), CHD); strokePts([[3, -320], [3, -30]], CHL, 1.4); }, 9601);
    pc(rect(-11, -214, 11, -196), CHD, () => strokePts([[-9, -208], [9, -208]], CHL, 1), 9602);
    pc([[11, -210], [22, -206], [22, -200], [11, -200]], '#2a2a2c', null, 9603, { drop: false });
    // lyre (fourche en U) + capsule qui oscille doucement
    const a = 0.05 * osc * Math.sin(g * 1.3) + 0.02 * osc * Math.sin(g * 2.9);
    pc(ribbon([[-46, -MIC.cap], [-46, -350], [-34, -336], [0, -332], [34, -336], [46, -350], [46, -MIC.cap]], 8, 8), CHR, () => strokePts([[-44, -390], [-44, -352]], CHL, 1.2), 9604);
    c.save(); c.translate(0, -MIC.cap); c.rotate(a);
    pc([[-30, -48], [-20, -60], [0, -64], [20, -60], [30, -48], [34, 0], [30, 48], [20, 60], [0, 64], [-20, 60], [-30, 48], [-34, 0]], CHR, () => {
      for (let y = -54; y <= 54; y += 7) strokePts([[-31 * Math.sqrt(1 - (y / 66) ** 2), y], [31 * Math.sqrt(1 - (y / 66) ** 2), y]], 'rgba(60,62,66,0.5)', 1.2);
      fillPts(rect(-34, -6, 34, 6), CHD); strokePts([[-34, -6], [34, -6]], CHL, 1);
      shade(30, 0, -30, 0, 0.35, [-36, -66, 36, 66]);
      const sx = lerp(-24, 24, fr(g * 0.12)), al = 0.25 + 0.5 * lu;
      fillPts([[sx - 4, -58], [sx + 4, -58], [sx + 8, 58], [sx, 58]], `rgba(255,255,255,${al})`);
    }, 9605);
    for (const x of [-46, 46]) { dot(x, 0, 6, CHD); dot(x, 0, 2.5, CHL); }
    c.restore();
  }

  // ---- radio de salon « cathédrale » (180 × 236), repère : milieu de la base posée
  function drawRadio(o) {
    const c = cx_(), g = M.tg(o.t || 0), lu = clamp(o.lueur || 0), vi = clamp(o.vibre || 0), ai = clamp(o.aiguille || 0), bt = o.bouton || 0;
    c.save();
    if (vi > 0) { c.translate(1.6 * vi * Math.sin(g * 61), -Math.abs(Math.sin(g * 47)) * 2.2 * vi); c.rotate(0.02 * vi * Math.sin(g * 53)); }
    const BOIS = '#6b4226', BOISL = '#8e5c36', BOISD = '#4a2c18';
    const arch = [[-84, -12], [-84, -138]].concat(qbez([-84, -138], [-84, -206], [0, -236], 8).slice(1), qbez([0, -236], [84, -206], [84, -138], 8).slice(1), [[84, -12]]);
    pc(rect(-92, -14, 92, 0), BOISD, () => strokePts([[-90, -12], [90, -12]], 'rgba(255,220,170,0.3)', 1.2), 9700);
    pc(arch, BOIS, () => {
      const inner = [[-62, -70], [-62, -136]].concat(qbez([-62, -136], [-62, -188], [0, -210], 8).slice(1), qbez([0, -210], [62, -188], [62, -136], 8).slice(1), [[62, -70]]);
      fillPts(inner, '#c49a52');                                                         // grille de tissu ocre
      hatch(inner, 0.8, 3, 0.25); hatch(inner, -0.8, 3, 0.2);
      for (const x of [-34, 0, 34]) fillPts(ribbon(qbez([x, -70], [x * 0.9, -150], [x * 0.3, -200], 6), 9, 6), BOISL);   // découpe de bois ajourée (ogives)
      fillPts(ribbon(qbez([-62, -120], [0, -150], [62, -120], 8), 8, 8), BOISL);
      strokePts(inner.concat([inner[0]]), BOISD, 2.4);
      strokePts(arch.slice(0, 18), 'rgba(255,220,170,0.35)', 1.6);                       // vernis
      for (let i = 0; i < 9; i++) strokePts([[-80, -20 - i * 14], [-70, -26 - i * 14]], 'rgba(40,20,8,0.25)', 1);
      shade(84, -100, -84, -100, 0.3, [-90, -240, 90, 0]);
    }, 9701);
    // cadran (ambre quand il s'allume), aiguille, deux boutons
    pc(ell(0, -42, 22, 22, 20), mixA('#d9cfb4', '#f2b54a', lu), () => {
      for (let i = 0; i < 9; i++) { const a = -PI + 0.35 + i * (PI - 0.7) / 8; strokePts([[Math.cos(a) * 14, -42 + Math.sin(a) * 14], [Math.cos(a) * 19, -42 + Math.sin(a) * 19]], 'rgba(60,40,20,0.8)', i % 4 ? 1 : 1.8); }
    }, 9702, { drop: false });
    strokePts(ep(0, -42, 22, 22, 20, 0, TAU), '#b58f45', 2.4);
    const na = -PI + 0.35 + ai * (PI - 0.7);
    strokePts([[0, -40], [Math.cos(na) * 19, -42 + Math.sin(na) * 19]], '#7a1e14', 1.8); dot(0, -42, 2.5, '#3a2a1a');
    if (lu > 0 && !SIL()) { const gl = c.createRadialGradient(0, -42, 4, 0, -42, 70); gl.addColorStop(0, `rgba(255,190,90,${0.5 * lu})`); gl.addColorStop(1, 'rgba(255,170,60,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(-70, -112, 140, 140); c.restore(); }
    for (const x of [-56, 56]) {
      pc(ell(x, -38, 11, 11, 14), '#2e1d12', null, 9703 + x, { drop: false });
      const a = bt + (x > 0 ? 1.1 : 0); strokePts([[x, -38], [x + Math.cos(a - PI / 2) * 9, -38 + Math.sin(a - PI / 2) * 9]], '#d9b86a', 2);
    }
    c.restore();
    // ondes : arcs concentriques de papier qui s'échappent par le haut
    const on = clamp(o.ondes || 0);
    if (on > 0 && !SIL()) {
      const col = o.couleurOndes || '#efe6cf';
      for (let i = 0; i < 4; i++) {
        const u = fr(g * 0.7 + i / 4), r = 26 + 110 * u, y = -244 - 50 * u, al = on * Math.sin(PI * Math.min(1, u * 1.3)) * 0.95;
        if (al <= 0.02) continue;
        c.save(); c.globalAlpha = al;
        pc(ribbon(ep(0, y + r * 0.5, r, r * 0.55, 14, -PI * 0.82, -PI * 0.18), 7 - 3 * u, 7 - 3 * u), col, null, 9710 + i, { drop: false, texA: 0.4 });
        c.restore();
      }
    }
  }

  // ---- pile de journaux ficelée ; repère : milieu de la base ; o.n (6)
  function drawPile(o) {
    const n = Math.max(1, Math.round(o.n == null ? 6 : o.n)), th = 13;
    for (let i = 0; i < n; i++) {
      const y = -i * th, dx = 5 * Math.sin(i * 2.3), w = 118 + 4 * Math.sin(i * 1.7);
      pc([[-w + dx, y], [w + dx, y], [w + dx + 2, y - th + 2], [-w + dx + 2, y - th + 2]], i % 2 ? '#e2d9c2' : '#ebe3cf', () => {
        for (let k = 1; k < 3; k++) strokePts([[-w + dx + 4, y - k * 4], [w + dx - 4, y - k * 4]], 'rgba(90,80,60,0.35)', 0.9);
        fillPts(rect(w + dx - 60, y - th + 3, w + dx - 8, y - 2), 'rgba(36,32,29,0.55)');
      }, 9800 + i, { texA: 0.4 });
    }
    const top = -n * th;
    pc([[-112, top - 2], [112, top - 2], [116, top - 8], [-108, top - 8]], '#ece5d2', () => { fillPts(rect(-90, top - 8, 40, top - 3), 'rgba(36,32,29,0.85)'); fillPts(rect(50, top - 8, 100, top - 3), 'rgba(36,32,29,0.4)'); }, 9820, { drop: false });
    strokePts([[-30, 0], [-30, top - 6], [30, top - 6], [30, 0]], '#8a6a3c', 2.2);
    strokePts([[-112, -n * th / 2], [116, -n * th / 2 - 2]], '#8a6a3c', 2.2);
    strokePts([[0, top - 6], [-10, top - 18], [-2, top - 22], [4, top - 8], [12, top - 20], [18, top - 12], [0, top - 6]], '#8a6a3c', 1.8);
  }

  // registre : grip = prise (repère de l'objet) ; p2 = seconde prise ; pts = points nommés ; base = point posé (objet seul)
  const OBJ = {
    feuillets: { draw: drawFeuillets, grip: [-FW + 5, 14], pts: { centre: [0, 0], haut: [0, -FH], bord: [-FW, 14] }, base: [0, FH] },
    journal: { draw: drawJournal, held: { echelle: 0.92 }, grip: (o) => (o.prise === 'gauche' ? JG2 : JD), p2: (o) => (o.prise === 'gauche' ? JD : JG2),
      pts: { centre: [0, 0], gravure: [0, -JH + 178], manchette: [0, -JH + 77], gauche: JG, gauche2: JG2, droite: JD, haut: [0, -JH], bas: [0, JH] }, base: [0, 0] },
    cigare: { draw: drawCigare, grip: [-6 * CG, 0], pts: { braise: [55 * CG, 0], bouche: [-48 * CG, 0] }, base: [0, 6], doigts: 'pince' },
    valise: { draw: drawValise, grip: [0, -19], pts: { centre: [0, 52], bas: [0, 104] }, base: [0, 104] },
    sac: { draw: drawSac, grip: (o) => (o.prise === 'dessous' ? [30, 86] : [0, -21]), p2: (o) => (o.prise === 'dessous' ? [-30, 86] : [-40, 40]), pts: { centre: [0, 40], cou: [0, -21] }, base: [0, 88] },
    micro: { draw: drawMicro, grip: [0, -MIC.tube], pts: { capsule: [0, -MIC.cap], tube: [0, -MIC.tube], haut: [0, -MIC.h], socle: [0, -10] }, base: [0, 0] },
    radio: { draw: drawRadio, grip: [0, -120], pts: { cadran: [0, -42], haut: [0, -236], grille: [0, -140], boutonG: [-56, -38], boutonD: [56, -38] }, base: [0, 0] },
    pile: { draw: drawPile, grip: [0, -40], pts: { haut: (o) => [0, -13 * (o.n == null ? 6 : o.n) - 8] }, base: [0, 0] },
  };
  GDM.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);

  // =====================================================================
  // 3) OBJETS TENUS, IK, ENVELOPPES (principe heldParts de bibliotheque/teflon.js et liberte.js)
  // =====================================================================
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), e = oo.echelle || 1;
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const PINCE = [[-7, -4], [0, -7], [8, -4], [9, 2], [3, 6], [-5, 5]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  const fingers = (name) => { const ob = OBJ[name]; return !ob || ob.doigts === 'aucun' ? OFFP : ob.doigts === 'pince' ? PINCE : DOIGTS; };
  function heldParts(skin, skinB, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fingers(p.tenu) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 4, pts: (p) => (has(p.tenuB) ? fingers(p.tenuB) : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point écran d'un point nommé de l'objet tenu : GDM.pt(r, 'braise') ; main arrière : GDM.pt(r, 'nom', true) ; 'prise' = point tenu
  GDM.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1;
    const q = nom === 'prise' ? g : ob.pts[nom] ? ptOf(ob.pts[nom], oo) : null; if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };

  const LA = 96, PG = [4, 96], SH_F = [-2, -146], SH_B = [-10, -146];
  function ikT(S, T, bend) {          // même convention que M.ik (bend 1 = coude sous la ligne épaule–main, plié vers l'avant)
    const L1 = LA, L2 = Math.hypot(PG[0], PG[1]), phi = Math.atan2(-PG[0], PG[1]);
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), base = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), a2 = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    return { a: normA(base + bend * a1), b: normA(-bend * (PI - a2) - phi) };
  }
  function armTo(q, arm, T, k, bend) {
    if (!(k > 0)) return;
    const sol = ikT(arm === 'armF' ? SH_F : SH_B, T, bend == null ? 1 : bend), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function headPt(q, hx_, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx_, hy]); }
  function plier(q, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), pieds à plat
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function marche(q, k) {                                     // pas sur place selon t : jambes en opposition, petits bras, léger rebond
    if (!(k > 0)) return;
    const t = q.t || 0, w = Math.sin(t * TAU * (q.cadence || 1.1)), A = q.ang;
    A.legF = (A.legF || 0) - 0.34 * w * k; A.legB = (A.legB || 0) + 0.34 * w * k;
    if (!has(q.tenu) || q.tenu === 'valise') A.armF_up = (A.armF_up || 0) + 0.12 * w * k;
    if (!has(q.tenuB)) A.armB_up = (A.armB_up || 0) - 0.12 * w * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(t * TAU * (q.cadence || 1.1))) * 5 * k;
  }
  function vers(S, C, r) { const v = [C[0] - S[0], C[1] - S[1]], l = Math.hypot(v[0], v[1]) || 1, k = Math.min(l, r) / l; return [S[0] + v[0] * k, S[1] + v[1] * k]; }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: Object.assign({}, p.tenuO), tenuBO: Object.assign({}, p.tenuBO) }); }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(PG[0], PG[1]).rotate((A.objet || 0) * D).scale(e, e).translate(-g[0], -g[1]);
      const T = mp(Hf, ob.p2(oo)), sol = ikT(SH_B, T, 1);
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
  function wrap(key, poseFn, sDef) {
    const fn = (pose, x, y, s, o) => {
      s = s == null ? sDef : s; o = Object.assign({ slot: M.ST.slotF, nom: CH[key].nom }, o || {});
      const dir = o.dir || 1, q = prep(pose), def = CH[key];
      const loc = (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; };
      poseFn(q, loc); marche(q, q.marche === true ? 1 : q.marche); finish(q);
      return run(def, q, x, y, s, o);
    };
    fn.pose = (pose) => { const q = prep(pose); poseFn(q, (Pt) => Pt); marche(q, q.marche === true ? 1 : q.marche); return finish(q); };
    return fn;
  }

  // ---------------- pièces de corps communes (bras à articulations rondes, rivet au pivot)
  const R_COUDE = 11.5;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const upDef = (at, base, seed, paint, wt) => ({ parent: 'torso', at, pts: armR(LA, wt || 16), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  function legDef(at, base, shoe, seed, back, th, sy, extraPaint) {
    return { parent: 'torso', at, pts: scl(X.legPts(th || 0.95), 1, sy || 1), base, seed, noRivet: !!back, paint: () => {
      const by = 214 * (sy || 1);
      if (extraPaint) extraPaint();
      fillPts([[-40, by, 1], [60, by, 1], [60, 300, 1], [-40, 300, 1]], shoe);
      if (!back) { strokePts([[20, by + 10], [42, by + 15]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, by], [-26, by]], 0.8, 4, 0.22); }
      else { hatch(null, 0.8, 3.6, 0.3); fillPts([[-40, -20], [60, -20], [60, 300], [-40, 300]], 'rgba(20,14,10,0.12)'); }
    } };
  }
  const ORDER = (pre, post) => ['armB_up', 'armB_lo', 'legB', 'legF', 'head'].concat(pre, ['torso'], post, ['objetB', 'doigtsB', 'objet', 'armF_up', 'armF_lo', 'doigts', 'doigtsB2']);
  function defOf(nom, parts, skin, skinB, seed, pre, post, hipY) {
    Object.assign(parts, heldParts(skin, skinB, seed));
    return { nom, hipY: hipY || -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(pre, post) };
  }
  const EXPR = {
    neutre: {}, malin: { brow: 'up', eyes: 'half' }, theatre: { brow: 'up', mouth: 'o' }, gene: { brow: 'worry', eyes: 'half', mouth: 'tight' }, surpris: { brow: 'up', eyes: 'wide', mouth: 'o' },
    fier: { brow: 'up', mouth: 'smile' }, fache: { brow: 'frown', mouth: 'tight' }, ravi: { mouth: 'smile', eyes: 'half' }, inquiet: { brow: 'worry', eyes: 'wide', mouth: 'tight' },
  };
  function expr(q, nom) { const e = EXPR[nom]; if (!e) return; for (const k in e) if (q.face[k] == null) q.face[k] = e[k]; }

  // =====================================================================
  // 4a) ORSON WELLES — 23 ans, grand, épaules larges, visage plein et rond, glabre, gros sourcils noirs, cheveux bruns ondulés en arrière ;
  //     chemise blanche manches retroussées, cravate bordeaux desserrée, gilet anthracite ouvert, pantalon gris, chaussures noires
  // =====================================================================
  const WE = { peau: '#e8c4a0', peauD: '#cba27e', chem: '#efebe2', chemD: '#cfc9bb', gilet: '#33363d', giletL: '#4a4e57', cravate: '#7a2230', cravateL: '#9a3646', pant: '#5b5e66', pantD: '#484b52', soulier: '#141215', cheveux: '#3b2a20', cheveuxL: '#6a4c36' };
  const WE_TORSO = [[-18, -180], [10, -186], [24, -174], [42, -158], [53, -124], [55, -78], [50, -34], [45, 0], [43, 20, 1], [-45, 22, 1], [-50, -10], [-54, -60], [-57, -114], [-54, -152], [-36, -174]];
  const WE_GILET = [[-30, -170], [0, -174], [14, -160], [23, -124], [26, -72], [29, -24], [33, 6], [42, 12], [42, 24], [-48, 24], [-51, -10], [-55, -60], [-58, -114], [-55, -152]];
  const WE_HEAD = [[-16, 16], [12, 16], [14, 4], [22, -4], [29, -9], [32, -16], [30, -22], [32, -26], [31, -30], [33, -34], [39, -40, 1], [34, -47], [30, -57], [30, -66], [27, -79], [15, -94], [-6, -99], [-26, -90], [-35, -70], [-35, -46], [-28, -26], [-20, -6]];
  const WE_HAIR = [[27, -79], [30, -89], [30, -101], [24, -112], [12, -120], [0, -119], [-12, -124], [-27, -120], [-39, -108], [-46, -91], [-48, -72], [-45, -54], [-38, -40], [-34, -52], [-29, -64], [-18, -77], [-3, -84], [12, -85], [22, -82]];
  function foreWelles(parent, skin, chem, back, seed) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base: skin, seed, paint: (p) => {
      X.handPaint(null, hk(p));
      fillPts([[-17, -14], [17, -14], [16, 17, 1], [-16, 19, 1]], chem);                        // manche retroussée au coude
      strokePts([[-15, 3], [15, 1]], 'rgba(120,110,95,0.6)', 1.1); strokePts([[-15, 11], [15, 9]], 'rgba(120,110,95,0.5)', 1);
      hatch([[-14, 19], [-3, 19], [-3, 76], [-14, 76]], 0.9, 3.8, 0.18);
      strokePts([[5, 30], [7, 62]], 'rgba(150,100,80,0.25)', 1.2);
    } };
  }
  function mkWelles() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: WE_TORSO, base: WE.chem, seed: 7001, paint: () => {
        for (const x of [30, 38]) strokePts([[x, -150], [x + 6, 0]], 'rgba(150,140,125,0.35)', 1);                 // plis de chemise
        fillPts(WE_GILET, WE.gilet);
        strokePts([[13, -158], [21, -122], [24, -72], [27, -24], [31, 6]], WE.giletL, 1.6);
        for (const y of [-110, -84, -58, -32]) { dot(26 + (y + 110) * 0.04, y, 2.2, '#8a8d94'); strokePts([[18, y + 1], [22, y + 1]], 'rgba(0,0,0,0.5)', 1); }
        fillPts([[-40, -150], [-10, -150], [-12, -120], [-40, -112]], 'rgba(255,255,255,0.05)');
        fillPts([[4, -186], [24, -174], [28, -160], [16, -164], [6, -176]], WE.chem);                               // col ouvert
        fillPts([[22, -168], [34, -164], [30, -152], [22, -156]], WE.cravate);                                       // nœud desserré
        fillPts([[24, -154], [32, -154], [42, -88], [40, -58], [34, -56], [30, -86]], WE.cravate);                     // pan de cravate
        strokePts([[30, -150], [37, -90], [37, -62]], WE.cravateL, 1.2);
        for (let y = -140; y < -64; y += 12) strokePts([[27 + (y + 154) * 0.13, y], [33 + (y + 154) * 0.11, y + 4]], 'rgba(30,8,12,0.4)', 1);
        fillPts(rect(-50, 12, 44, 24), WE.pantD);                                                                   // ceinture
        hatch([[-60, -170], [-14, -170], [-14, 24], [-60, 24]], 0.75, 4.2, 0.3); shade(52, 0, -52, 0, 0.26);
      } },
      legB: legDef([-8, -2], WE.pantD, WE.soulier, 7002, true, 1.12, 1.05),
      legF: legDef([8, -2], WE.pant, WE.soulier, 7003, false, 1.12, 1.05),
      armB_up: upDef([-10, -146], WE.chemD, 7004, null, 18),
      armB_lo: foreWelles('armB_up', WE.peauD, WE.chemD, true, 7005),
      head: { parent: 'torso', at: [6, -172], pts: WE_HEAD, base: WE.peau, seed: 7006, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        hatch([[-24, -42], [0, -30], [10, -8], [-6, 18], [-34, 4]], 0.6, 3.6, 0.24);
        dot(14, -30, 10, 'rgba(210,130,110,0.22)');
        X.eye(f, 17, -52, 1.05);
        X.brow(f, 17, -62, 'rgba(18,12,10,0.97)', 4.6);
        if ((p.sourire || 0) > 0.3 && !f.mouth) { strokePts([[30, -26], [24, -24.5], [18, -26], [14, -30]], 'rgba(110,40,38,0.95)', 1.8); strokePts([[13, -33], [12, -28]], 'rgba(140,80,60,0.45)', 1.1); }
        else X.mouth(f, 29, -25);
        strokePts([[22, -13], [30, -11]], 'rgba(150,100,80,0.3)', 1.2);                                              // menton plein
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: WE_HAIR, base: WE.cheveux, seed: 7007, noRivet: true, paint: () => {
        for (let i = 0; i < 4; i++) strokePts(qbez([26 - i * 4, -88 - i * 7], [0 - i * 4, -112 + i * 2], [-42 + i * 2, -68 + i * 5], 10), 'rgba(140,100,70,0.55)', 1.3);   // ondulations peignées en arrière
        strokePts(qbez([26, -102], [12, -118], [-8, -114], 8), 'rgba(255,230,200,0.3)', 2);
        hatch(null, 1.2, 3.4, 0.2);
      } },
      armF_up: upDef([-2, -146], WE.chem, 7008, () => { strokePts([[6, 10], [8, 80]], 'rgba(150,140,125,0.4)', 1.1); hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.22); }, 18),
      armF_lo: foreWelles('armF_up', WE.peau, WE.chem, false, 7009),
    };
    return defOf('Welles', parts, WE.peau, WE.peauD, 7020, ['cheveux'], [], -250);
  }
  CH.gdmWelles = mkWelles();
  GDM.welles = wrap('gdmWelles', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0;
    expr(q, q.expr);
    const mi = ease(clamp(q.micro || 0)), fe = ease(clamp(q.feuillets || 0)), lm = ease(clamp(q.leveMain || 0)), bo = ease(clamp(q.brasOuvert || 0)),
      ex = ease(clamp(q.excuse || 0)), va = ease(clamp(q.valise || 0));
    if ((q.sourire || 0) > 0.3 && !f.brow) f.brow = 'up';
    if (va > 0) { if (q.tenu == null) q.tenu = 'valise'; blend(q, 'armF_up', 0.05, va); blend(q, 'armF_lo', -0.08, va); }
    if (mi > 0) {
      plier(q, 0.1 * mi); A.head = (A.head || 0) + 0.07 * mi;
      armTo(q, 'armF', q.cible ? vers(SH_F, loc(q.cible), 186) : [112, -128], mi); if (!has(q.tenu)) q.handF = q.handF || 'fist';
    }
    if (fe > 0) {
      if (mi > 0 || va > 0 || (has(q.tenu) && q.tenu !== 'feuillets')) { if (q.tenuB == null) q.tenuB = 'feuillets'; armTo(q, 'armB', [56, -88], fe); }
      else { if (q.tenu == null) q.tenu = 'feuillets'; armTo(q, 'armF', [66, -94], fe); }
    }
    if (lm > 0) { armTo(q, 'armF', [48, -300], lm); q.handF = 'open'; A.head = (A.head || 0) - 0.08 * lm; }
    if (bo > 0) { armTo(q, 'armF', [160, -240], bo); armTo(q, 'armB', [98, -190], bo * 0.85); q.handF = 'open'; q.handB = 'open'; A.head = (A.head || 0) - 0.14 * bo; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o'; }
    if (ex > 0) { plier(q, 0.04 * ex); armTo(q, 'armF', [28, -112], ex); q.handF = 'open'; A.head = (A.head || 0) + 0.26 * ex; if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'worry'; }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.2 * Math.sin(t * 1.9);
  }, 0.92);

  // =====================================================================
  // 4b) LE PATRON DE PRESSE — massif, ~60 ans, chauve à couronne grise, grosse moustache grise en brosse, ventre rond, chemise ivoire
  //     à fines rayures, nœud papillon rouge sang, gilet moutarde à chaîne de montre dorée, pantalon brun, gros cigare
  // =====================================================================
  const PA = { peau: '#e4b796', peauD: '#c69878', chem: '#ebe3cf', chemD: '#cdc4ae', raie: 'rgba(96,84,120,0.38)', gilet: '#a9822f', giletD: '#87681f', giletL: '#c49c4a', noeud: '#8e2b25', pant: '#4a3a2c', pantD: '#3a2d22', soulier: '#1a1512', gris: '#bcb9b2', grisD: '#8e8b85' };
  const PA_TORSO = [[-18, -180], [10, -184], [24, -172], [40, -154], [52, -126], [64, -96], [74, -60], [77, -22], [70, 6], [54, 24, 1], [-48, 24, 1], [-54, 0], [-57, -50], [-58, -110], [-52, -152], [-34, -172]];
  const PA_GILET = [[-30, -166], [4, -168], [22, -156], [38, -138], [54, -112], [66, -82], [74, -48], [74, -14], [66, 10], [52, 22], [-50, 22], [-54, 0], [-57, -50], [-58, -110], [-52, -152]];
  const PA_HEAD = [[-18, 16], [12, 16], [16, 4], [26, -4], [32, -10], [34, -18], [31, -24], [33, -28], [32, -32], [35, -36], [42, -42, 1], [36, -50], [31, -58], [31, -68], [28, -82], [16, -96], [-6, -101], [-28, -92], [-38, -72], [-38, -46], [-32, -24], [-24, -4]];
  const PA_COURONNE = [[0, -58], [-12, -64], [-26, -68], [-38, -62], [-42, -46], [-40, -26], [-34, -16], [-30, -26], [-26, -40], [-16, -50], [-4, -52]];
  const PA_MOUST = [[43, -35], [42, -27], [35, -23], [24, -23], [16, -27], [19, -33], [29, -37], [38, -38]];
  function forePatron(parent, back, seed) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base: back ? PA.chemD : PA.chem, seed, paint: (p) => {
      for (let x = -12; x <= 12; x += 6) strokePts([[x, -8], [x, 62]], PA.raie, 1);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], back ? PA.peauD : PA.peau); X.handPaint(null, hk(p));
      fillPts([[-15, 60, 1], [15, 60, 1], [16, 78, 1], [-15, 78, 1]], back ? '#c2b9a2' : '#f3ecdb'); dot(8, 69, 1.8, '#b58f45');
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, 0.2);
    } };
  }
  function mkPatron() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PA_TORSO, base: PA.chem, seed: 7101, paint: () => {
        for (let x = -40; x < 40; x += 6) strokePts([[x, -180], [x + 2, -130]], PA.raie, 1);
        fillPts(PA_GILET, PA.gilet);
        if (!SIL()) { const c = cx_(); c.save(); c.beginPath(); PA_GILET.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.clip();
          for (let x = -60; x < 80; x += 11) strokePts([[x, -170], [x + 3, 24]], 'rgba(90,50,20,0.28)', 1); for (let y = -164; y < 24; y += 11) strokePts([[-60, y], [80, y + 2]], 'rgba(90,50,20,0.28)', 1);
          for (let x = -55; x < 80; x += 33) strokePts([[x, -170], [x + 3, 24]], 'rgba(140,40,30,0.3)', 1); c.restore(); }
        strokePts([[22, -156], [38, -138], [54, -112], [66, -82], [74, -48], [74, -14], [66, 10]], PA.giletL, 1.8);
        for (const [x, y] of [[48, -122], [60, -96], [68, -66], [73, -38], [72, -10]]) { dot(x - 4, y, 2.6, PA.giletD); dot(x - 4.6, y - 0.6, 1, '#e8c87a'); }
        strokePts([[18, -40], [36, -42]], 'rgba(60,40,10,0.6)', 1.4); strokePts([[16, -70], [32, -72]], 'rgba(60,40,10,0.5)', 1.2);   // poches
        const ch = qbez([68, -66], [46, -40], [26, -42], 10); strokePts(ch, '#d7b45a', 1.6); for (const p of ch) dot(p[0], p[1], 1.4, '#f0d890');   // chaîne de montre
        fillPts(ell(24, -40, 4, 5, 8), '#c9a24a');
        fillPts([[4, -188], [22, -176], [26, -164], [14, -168], [4, -178]], PA.chem);                                 // col
        fillPts([[22, -172], [36, -184], [38, -168]], PA.noeud); fillPts([[22, -168], [38, -164], [34, -152]], PA.noeud);   // nœud papillon
        fillPts(ell(24, -169, 4, 4, 8), '#6e1e1a'); strokePts([[26, -176], [34, -180]], 'rgba(255,200,180,0.35)', 1.1);
        fillPts(rect(-52, 14, 56, 24), PA.pantD);
        hatch([[-60, -170], [-16, -170], [-16, 24], [-60, 24]], 0.75, 4.2, 0.28); shade(74, -40, -56, -40, 0.3, [-64, -190, 84, 30]);
      } },
      legB: legDef([-8, -2], PA.pantD, PA.soulier, 7102, true, 1.15),
      legF: legDef([8, -2], PA.pant, PA.soulier, 7103, false, 1.15),
      armB_up: upDef([-10, -146], PA.chemD, 7104, () => { for (let x = -12; x <= 12; x += 6) strokePts([[x, -14], [x, 96]], PA.raie, 1); hatch(null, 0.9, 3.8, 0.3); }),
      armB_lo: forePatron('armB_up', true, 7105),
      head: { parent: 'torso', at: [6, -170], pts: PA_HEAD, base: PA.peau, seed: 7106, noRivet: true, paint: (p) => {
        const f = p.face || {}, rire = (p.rire || 0) > 0.3;
        fillPts(PA_COURONNE, PA.gris, 7, 0.5); for (let i = 0; i < 7; i++) strokePts([[-4 - i * 5, -56 - i], [-10 - i * 4.4, -30 - i]], 'rgba(90,88,84,0.55)', 1.1);
        X.earPaint(-9, -42);
        strokePts([[-20, -88], [4, -98], [18, -92]], 'rgba(255,240,220,0.55)', 2.2);                              // crâne luisant
        hatch([[-26, -40], [0, -24], [12, -4], [-8, 18], [-36, 4]], 0.6, 3.6, 0.26);
        dot(16, -26, 11, `rgba(205,110,95,${0.25 + 0.35 * clamp(p.rouge || 0)})`); dot(38, -42, 4, 'rgba(200,90,80,0.35)');
        if (rire) { strokePts([[12, -51], [17, -55], [23, -51]], 'rgba(28,16,14,0.95)', 1.9); strokePts([[11, -46], [16, -44]], 'rgba(28,16,14,0.5)', 1); }
        else X.eye(f, 18, -53);
        X.brow(f, 18, -62, 'rgba(120,118,112,0.98)', 4);
        if (rire) fillPts([[34, -20], [30, -10], [20, -9], [16, -18]], '#3a1714', 0, 0);
        else if (f.mouth === 'o') fillPts([[30, -19], [28, -12], [22, -12], [20, -18]], '#3a1714', 0, 0);
        else X.mouth(f, 30, -17);
        if ((p.rouge || 0) > 0) fillPts(PA_HEAD, `rgba(200,60,50,${0.18 * clamp(p.rouge)})`);
      } },
      moustache: { parent: 'head', at: [0, 0], pts: PA_MOUST, base: '#a9a6a0', seed: 7108, noRivet: true, paint: () => { for (let x = 18; x < 44; x += 3) strokePts([[x, -37], [x - 1.5, -23]], 'rgba(70,68,64,0.6)', 1); strokePts([[20, -33], [40, -36]], 'rgba(255,255,255,0.35)', 1.2); } },
      cigareB: { parent: 'head', at: [36, -21], noRivet: true, base: '#000', seed: 7109, pts: OFFP, extra: (p) => {
        if (!p.bouche || p.tenu === 'cigare') return; const c = cx_(); c.save(); c.rotate(0.22); c.translate(44 * CG, 0); drawCigare({ t: p.t || 0, fumee: p.fumee }); c.restore(); } },
      armF_up: upDef([-2, -146], PA.chem, 7110, () => { for (let x = -12; x <= 12; x += 6) strokePts([[x, -14], [x, 96]], PA.raie, 1); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.24); }),
      armF_lo: forePatron('armF_up', false, 7111),
    };
    return defOf('patron', parts, PA.peau, PA.peauD, 7120, [], ['moustache', 'cigareB']);
  }
  CH.gdmPatron = mkPatron();
  GDM.patron = wrap('gdmPatron', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0;
    expr(q, q.expr);
    const br = ease(clamp(q.brandir || 0)), ta = ease(clamp(q.tape || 0)), fa = ease(clamp(q.fache || 0)), ri = ease(clamp(q.rire || 0)),
      rc = ease(clamp(q.recoit || 0)), ci = ease(clamp(q.cigare || 0));
    if (br > 0) {
      if (q.tenu == null) q.tenu = 'journal'; if (q.deuxMains == null) q.deuxMains = true;
      armTo(q, 'armF', [178, -122], br); A.head = (A.head || 0) - 0.05 * br; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o';
    }
    if (ta > 0) {
      const hit = Math.pow(0.5 + 0.5 * Math.cos(t * TAU * 2.2), 2);                                // 0 = main posée sur la une
      if (q.cible) { const T = loc(q.cible); armTo(q, 'armF', vers(SH_F, [T[0] - 22 * hit, T[1] - 44 * hit], 188), ta); }
      else {
        if (q.tenuB == null) { q.tenuB = 'journal'; if (q.tenuBO.prise == null) q.tenuBO.prise = 'gauche'; }
        const e = q.tenuBO.echelle || 0.92, H = [34, -122], Cn = [H[0] + (0 - JG2[0]) * e, H[1] + (-JH + 178 - JG2[1]) * e];
        armTo(q, 'armB', H, ta); armTo(q, 'armF', [Cn[0] - 22 * hit, Cn[1] - 44 * hit], ta);
      }
      q.handF = 'open'; if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'o';
    }
    if (fa > 0) {
      armTo(q, 'armF', [128 + 3.5 * Math.sin(t * 31), -150 + 3 * Math.sin(t * 37)], fa); if (!has(q.tenu)) q.handF = 'fist';
      q.dx = (q.dx || 0) + 1.2 * Math.sin(t * 29) * fa; A.head = (A.head || 0) + 0.06 * fa; if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight';
      if (q.rouge == null) q.rouge = fa;
    }
    if (ri > 0) {
      const sh = Math.sin(t * 15);
      q.dy = (q.dy || 0) - 3 * Math.abs(sh) * ri; q.tilt = (q.tilt || 0) + 0.015 * sh * ri; A.head = (A.head || 0) - (0.12 + 0.05 * sh) * ri;
      armTo(q, 'armF', [64, -44], ri); armTo(q, 'armB', [44, -34], ri * 0.8); q.handF = q.handF || 'open'; q.handB = q.handB || 'open';
      if (ri > 0.3) q.rire = Math.max(q.rire, 0.31);
    }
    if (rc > 0) {
      if (q.tenu === 'sac') { if (q.tenuO.prise == null) q.tenuO.prise = 'dessous'; if (q.deuxMains == null) q.deuxMains = true; q.handBDeux = 'open'; }
      armTo(q, 'armF', [150, -84], rc); armTo(q, 'armB', [116, -92], rc); q.handF = 'open'; q.handB = 'open';
      if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'smile';
    }
    if (ci > 0) {
      if (q.tenu == null) q.tenu = 'cigare';
      const Mo = headPt(q, 31, -20), a = 0.75 * ci, L = 42 * CG;                                       // cigare incliné vers la bouche : la main reste sous le menton
      armTo(q, 'armF', [Mo[0] + L * Math.cos(a), Mo[1] + L * Math.sin(a)], ci); q.ang.objet = (q.ang.objet || 0) + a; if (!f.eyes) f.eyes = 'half';
    }
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.4 * Math.sin(t * 1.7);
  }, 0.92);
  GDM.BEND = { welles: { armF: [1, 1], armB: [1, 1] }, patron: { armF: [1, 1], armB: [1, 1] } };

  // =====================================================================
  // 5) LE TRIPODE MARTIEN — machine de carton peint façon gravure : dôme de cuivre verdi riveté, œil-lentille rouge, trois longues jambes
  //    articulées, deux tentacules. Marionnette à tige (sous le dôme). def.libre : pas de bras ni de jambes humains.
  // =====================================================================
  const TR = { cu: '#6f8a6a', cuL: '#9db596', cuD: '#4d6650', cuX: '#34463a', oeil: '#b2382c', jambe: '#55604f', jambeD: '#3e463a' };
  const DOME = [[-98, 4], [-98, -10]].concat(ep(0, -10, 98, 176, 22, PI, TAU).slice(1, -1), [[98, -10], [98, 4]]);
  function legPart(parent, at, L, w, base, seed, back) {
    return { parent, at, base, seed, pts: ep(0, 0, w * 0.9, w * 0.9, 8, PI, TAU).concat([[w * 0.55, L * 0.5], [w * 0.4, L]], ep(0, L, w * 0.42, w * 0.42, 6, 0, PI).slice(1, -1), [[-w * 0.4, L], [-w * 0.55, L * 0.5]]),
      paint: () => { strokePts([[w * 0.2, 6], [w * 0.15, L - 6]], 'rgba(220,235,210,0.35)', 1.4); for (let y = 24; y < L - 10; y += 30) strokePts([[-w * 0.5, y], [w * 0.5, y + 3]], 'rgba(20,30,20,0.4)', 1); if (back) fillPts(rect(-40, -20, 40, L + 20), 'rgba(10,16,10,0.25)'); } };
  }
  const FOOT = [[-30, 0], [-22, -10], [22, -10], [30, 0], [26, 8, 1], [-26, 8, 1]];
  function mkTripode() {
    const parts = {
      hub: { parent: null, at: [0, 0], pts: ell(0, 0, 52, 18, 18), base: TR.cuX, seed: 7201, noRivet: true, paint: () => { for (const x of [-30, 0, 30]) dot(x, 4, 5, '#22301f'); } },
      jC1: legPart('hub', [0, 10], 120, 15, TR.jambeD, 7202, true), jC2: legPart('jC1', [0, 120], 212, 12, TR.jambeD, 7203, true),
      pC: { parent: 'jC2', at: [0, 212], pts: FOOT, base: TR.jambeD, seed: 7204, noRivet: true },
      jB1: legPart('hub', [-34, 6], 150, 17, TR.jambe, 7205, false), jB2: legPart('jB1', [0, 150], 250, 13, TR.jambe, 7206, false),
      pB: { parent: 'jB2', at: [0, 250], pts: FOOT, base: TR.jambe, seed: 7207, noRivet: true },
      dome: { parent: 'hub', at: [0, -6], base: TR.cu, seed: 7210, noRivet: true, pts: (p) => tr(DOME, 0, 46 * clamp(p.peur || 0)), paint: (p) => {
        const dy = 46 * clamp(p.peur || 0), Y = (y) => y + dy, lu = clamp(p.lueur == null ? 0.4 : p.lueur), pe = clamp(p.peur || 0);
        for (const k of [0.35, 0.62, 0.86]) strokePts(ep(0, Y(-10), 98 * k, 176 * k + 10, 16, PI, TAU), 'rgba(30,46,34,0.55)', 1.4);   // bandes
        for (const k of [0.35, 0.62, 0.86]) for (let i = 1; i < 12; i++) { const a = PI + i / 12 * PI; dot(98 * k * Math.cos(a), Y(-10) + (176 * k + 10) * Math.sin(a) + 4, 2.2, '#c9b77e'); }   // rivets
        for (const x of [-60, -20, 20, 60]) strokePts(qbez([x * 1.15, Y(0)], [x * 0.9, Y(-120)], [0, Y(-186)], 8), 'rgba(30,46,34,0.4)', 1.2);
        for (let i = 0; i < 7; i++) strokePts([[-70 + i * 22, Y(-20 - 40 * hash(i))], [-66 + i * 22, Y(-60 - 50 * hash(i + 3))]], 'rgba(170,200,160,0.25)', 2);   // patine
        hatch([[-98, Y(4)], [-30, Y(4)], [-40, Y(-190)], [-98, Y(-60)]], 0.75, 4.4, 0.3);
        shade(60, Y(-140), -80, Y(-20), 0.35, [-100, Y(-200), 100, Y(10)]);
        // œil-lentille : visière, lunette de bronze, verre rouge, paupière de métal (plus ouverte avec peur)
        const ex = 58, ey = Y(-74), R = 26 * (1 + 0.16 * pe);
        fillPts([[ex - 34, ey - 34], [ex + 22, ey - 44], [ex + 44, ey - 30], [ex + 36, ey - 24], [ex - 30, ey - 26]], TR.cuD);
        fillPts(ell(ex, ey, R + 8, R + 8, 20), '#2c3a2c');
        fillPts(ell(ex, ey, R, R, 20), mixA(TR.oeil, '#ff7a52', lu * 0.7));
        fillPts(ell(ex - R * 0.3, ey - R * 0.3, R * 0.55, R * 0.5, 12), 'rgba(255,190,160,0.35)');
        const pr = lerp(8, 4, pe); fillPts(ell(ex + 6, ey + 1, pr, pr * (pe > 0.5 ? 1 : 1.6), 10), '#2a0e0a');
        dot(ex - 8, ey - 9, 4, 'rgba(255,240,230,0.85)');
        const lid = lerp(0.42, 0.0, pe); if (lid > 0.02) fillPts(ep(ex, ey, R + 2, R + 2, 12, PI, TAU).map(([x, y]) => [x, ey + (y - ey) * 1]).concat([[ex + R + 2, ey - R * (1 - 2 * lid) - 2]]).map(([x, y]) => [x, Math.min(y, ey - R + 2 * R * lid)]), TR.cu);
        if (lid > 0.02) strokePts([[ex - R, ey - R + 2 * R * lid], [ex + R, ey - R + 2 * R * lid]], TR.cuX, 2);
        strokePts(ep(ex, ey, R + 8, R + 8, 20, 0, TAU), '#c9b77e', 1.4);
      }, extra: (p) => {
        if (SIL()) return;
        const lu = clamp(p.lueur == null ? 0.4 : p.lueur); if (lu <= 0) return;
        const dy = 46 * clamp(p.peur || 0), c = cx_(), g = M.tg(p.t || 0), k = lu * (0.85 + 0.15 * Math.sin(g * 5));
        const gl = c.createRadialGradient(58, dy - 74, 6, 58, dy - 74, 120); gl.addColorStop(0, `rgba(255,110,70,${0.55 * k})`); gl.addColorStop(1, 'rgba(255,80,50,0)');
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(-62, dy - 194, 240, 240); c.restore();
      } },
      fin: { parent: 'dome', at: [0, -186], base: TR.cuD, seed: 7211, noRivet: true, pts: (p) => tr([[-14, 6], [-8, -6], [-3, -30], [3, -30], [8, -6], [14, 6]], 0, 46 * clamp(p.peur || 0)), paint: () => {} },
      collier: { parent: 'hub', at: [0, -6], base: TR.cuD, seed: 7212, noRivet: true, pts: [[-104, -12], [104, -12], [108, 0], [104, 14], [-104, 14], [-108, 0]], paint: () => { for (let x = -96; x <= 96; x += 16) dot(x, 1, 2.4, '#c9b77e'); strokePts([[-104, -9], [104, -9]], 'rgba(200,220,190,0.4)', 1.2); } },
      jA1: legPart('hub', [34, 6], 150, 17, TR.jambe, 7213, false), jA2: legPart('jA1', [0, 150], 250, 13, TR.jambe, 7214, false),
      pA: { parent: 'jA2', at: [0, 250], pts: FOOT, base: TR.jambe, seed: 7215, noRivet: true },
      tentacules: { parent: 'hub', at: [0, 0], base: '#000', seed: 7216, noRivet: true, pts: OFFP, extra: (p) => drawTentacules(p) },
    };
    return { nom: 'tripode', hipY: -330, parts, rod: { part: 'hub', at: [-14, 14] }, libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
      order: ['jC1', 'jC2', 'pC', 'jB1', 'jB2', 'pB', 'hub', 'dome', 'fin', 'collier', 'jA1', 'jA2', 'pA', 'tentacules'] };
  }
  // tentacules (repère du moyeu) ; mode 'repos' | 'menace' | 'tient' (tiennent le journal devant le dôme, une de face)
  const TJ = { c: [190, 98], e: 0.78 };
  function tentaLine(mode, i, g, p) {
    const B = i ? [44, -2] : [56, 6], w = (k) => Math.sin(g * 1.7 + i * 2 + k) * 7;
    if (mode === 'menace') { const E = [118 + 34 * i + w(1), -150 - 30 * i + w(2)]; return cbez(B, [B[0] + 70, B[1] + 10 + w(0)], [E[0] + 30, E[1] + 90], E, 14); }
    if (mode === 'tient') {
      const e = TJ.e, gp = i ? [TJ.c[0] + JD[0] * e, TJ.c[1] + JD[1] * e] : [TJ.c[0] + JG[0] * e, TJ.c[1] + JG[1] * e];
      const tr_ = (p.peur || 0) * 3 * Math.sin(g * 40 + i), E = [gp[0] + tr_, gp[1] - 6 + tr_];
      return cbez(B, [B[0] + 40, B[1] + 40], [E[0] - 30 * (i ? -0.2 : 1), E[1] - 70], E, 14);
    }
    const E = [80 + 30 * i + w(1), 150 + 10 * i];
    return cbez(B, [B[0] + 40, B[1] + 30], [E[0] + 24 + w(0), E[1] - 70], E, 14);
  }
  function curl(E, prev, r, sens) {                  // petite spirale au bout d'un tentacule
    const a0 = Math.atan2(E[1] - prev[1], E[0] - prev[0]), o = [];
    const C = [E[0] + Math.cos(a0 + sens * PI / 2) * r, E[1] + Math.sin(a0 + sens * PI / 2) * r];
    for (let k = 1; k <= 8; k++) { const a = a0 - sens * PI / 2 + sens * k / 8 * PI * 1.5, rr = r * (1 - k / 12); o.push([C[0] + Math.cos(a) * rr, C[1] + Math.sin(a) * rr]); }
    return o;
  }
  function drawTentacule(line, i, mode) {
    const n = line.length, E = line[n - 1], full = mode === 'tient' ? line : line.concat(curl(E, line[n - 2], 12, i ? 1 : -1));
    pc(ribbon(full, 22, 6), i ? '#5d7558' : '#6f8a6a', () => { for (let k = 2; k < full.length - 3; k += 2) dot(full[k][0] + 4, full[k][1] + 3, 2.6, 'rgba(225,235,200,0.6)'); hatch(null, 0.8, 4, 0.2); }, 7230 + i);
  }
  function drawTentacules(p) {
    const g = M.tg(p.t || 0), mode = p.tentacules || (p.journal ? 'tient' : 'repos');
    const L0 = tentaLine(mode, 0, g, p), L1 = tentaLine(mode, 1, g, p);
    drawTentacule(L1, 1, mode);
    if (mode === 'tient' && p.journal) {
      const c = cx_(), jo = typeof p.journal === 'object' ? p.journal : {}, e = jo.echelle || TJ.e, sh = (p.peur || 0) * 2.5 * Math.sin(g * 40);
      c.save(); c.translate(TJ.c[0] + sh, TJ.c[1]); c.rotate(0.02 * (p.peur || 0) * Math.sin(g * 33)); c.scale(e, e); drawJournal({ face: jo.face || 'une', plie: jo.plie, t: p.t }); c.restore();
      for (const [P0, i] of [[[TJ.c[0] + JG[0] * e, TJ.c[1] + JG[1] * e], 0], [[TJ.c[0] + JD[0] * e, TJ.c[1] + JD[1] * e], 1]]) pc(ribbon(curl([P0[0], P0[1] + 4], [P0[0], P0[1] - 20], 9, i ? 1 : -1), 9, 5), i ? '#5d7558' : '#6f8a6a', null, 7240 + i);
    }
    drawTentacule(L0, 0, mode);
  }
  CH.gdmTripode = mkTripode();
  function tripodePose(pose) {
    const q = prep(pose), A = q.ang, t = q.t || 0, g = M.tg(t), pe = clamp(q.peur || 0), rv = ease(clamp(q.reverence || 0));
    if (q.journal && !q.tentacules) q.tentacules = 'tient';
    const ph = q.phase || 0, legs = [['jA', 1, 0], ['jB', -1, 1 / 3], ['jC', 1, 2 / 3]], rest = { jA: [-1.0, 1.15], jB: [1.0, -1.15], jC: [-0.35, 0.3] };
    let bob = 0;
    for (const [n, sg, off] of legs) {
      const u = fr(ph + off), sw = u < 1 / 3 ? u * 3 : 0, lift = ph ? Math.sin(PI * sw) : 0;
      const del = ph ? (u < 1 / 3 ? lerp(0.22, -0.22, ease(sw)) : lerp(-0.22, 0.22, (u - 1 / 3) * 1.5)) : 0;
      const trem = pe * 0.035 * Math.sin(g * 38 + off * 9);
      const a1 = rest[n][0] + del * (n === 'jC' ? 0.6 : 1) - sg * 0.25 * pe + trem, a2 = rest[n][1] + sg * 0.5 * lift + sg * 0.25 * pe - trem;
      A[n + '1'] = (A[n + '1'] || 0) + a1; A[n + '2'] = (A[n + '2'] || 0) + a2;
      A['p' + n[1]] = -(a1 + a2);
      bob = Math.max(bob, lift);
    }
    q.dy = (q.dy || 0) - 6 * bob + 32 * pe + pe * 1.5 * Math.sin(g * 45);
    q.dx = (q.dx || 0) + pe * 2 * Math.sin(g * 41);
    A.dome = (A.dome || 0) + 0.55 * rv + 0.015 * Math.sin(g * 1.3);
    return q;
  }
  GDM.tripodePose = tripodePose;
  GDM.tripode = (pose, x, y, s, o) => M.puppet(CH.gdmTripode, tripodePose(pose), x, y, s == null ? 1 : s, Object.assign({ slot: M.ST.slotF, nom: 'tripode' }, o || {}));

  // =====================================================================
  // 6) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name]; o = o || {};
    if (o.ang != null && o.rot == null) o = Object.assign({}, o, { rot: o.ang });
    return M.puppet(accDef('o_' + name, (oo) => { const b = ptOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(Object.assign({ t: oo.t || 0 }, oo)); c.restore(); }),
      { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of ['feuillets', 'journal', 'cigare', 'valise', 'sac', 'micro', 'radio', 'pile']) GDM[n] = (x, y, s, o) => acc(n, x, y, s, o);
  function locPt(px, py, x, y, s, o) { o = o || {}; const d = o.dir || 1, r = o.rot != null ? o.rot : o.ang || 0, X0 = px * s * d, Y0 = py * s; return [x + X0 * Math.cos(r) - Y0 * Math.sin(r) * d, y + X0 * Math.sin(r) * d + Y0 * Math.cos(r)]; }
  GDM.accPt = function (name, x, y, s, o, nom) { const ob = OBJ[name], oo = o || {}, b = ptOf(ob.base, oo), q = ob.pts[nom] ? ptOf(ob.pts[nom], oo) : nom === 'prise' ? gripOf(ob, oo) : [0, 0]; return locPt(q[0] - b[0], q[1] - b[1], x, y, s == null ? 1 : s, oo); };
  GDM.microPt = (x, y, s, o, nom) => GDM.accPt('micro', x, y, s, o, nom || 'capsule');
  GDM.radioPt = (x, y, s, o, nom) => GDM.accPt('radio', x, y, s, o, nom || 'cadran');
  GDM.journalPt = (x, y, s, o, nom) => GDM.accPt('journal', x, y, s, o, nom || 'centre');
  GDM.dessins = { gravTripode, coureur, frise };      // dessins gravés réutilisables (encre)

  // =====================================================================
  // 7) DÉCORS — pré-rendus dans GDM.init() ; GDM.studio / GDM.redaction AVANT M.drawFloor(), GDM.studioSol / GDM.redactionSol juste APRÈS
  // =====================================================================
  const W = M.W;
  const STU = { regie: { x0: 640, x1: 900, y0: 330, y1: 600 }, porte: { x0: 775, x1: 965, y0: 860 }, lampe: { x: 870, y: 800 }, pendule: { x: 470, y: 300, s: 0.8 },
    hp: { x: 300, y: 330 }, piano: { x0: 120, x1: 300, y0: 1055 }, tasse: { x: 272, y: 1049 }, metro: { x: 168, y: 1055 }, pupitre: { x: 350, y: 1100 },
    projo: { x: 250, y: 880 }, table: { x0: 600, x1: 770, y: 1185 }, tonnerre: { x: 700, y: 660 }, chaise: 190, cendrier: 915, cables: 760 };
  GDM.STUDIO = STU;
  function cadre(x0, y0, x1, y1, e, col, seed, eb) {             // cadre de fenêtre : 4 barres à angles vifs (e = épaisseur, eb = appui plus épais)
    eb = eb || e;
    pc(rect(x0 - e, y0 - e, x1 + e, y0), col, () => strokePts([[x0 - e + 3, y0 - e + 3], [x1 + e - 3, y0 - e + 3]], 'rgba(255,230,190,0.3)', 1.4), seed, { drop: false });
    pc(rect(x0 - e, y1, x1 + e, y1 + eb), col, () => strokePts([[x0 - e, y1 + 3], [x1 + e, y1 + 3]], 'rgba(255,230,190,0.35)', 1.6), seed + 1);
    pc(rect(x0 - e, y0, x0, y1), col, () => strokePts([[x0 - 3, y0], [x0 - 3, y1]], 'rgba(0,0,0,0.35)', 1.4), seed + 2, { drop: false });
    pc(rect(x1, y0, x1 + e, y1), col, () => strokePts([[x1 + 3, y0], [x1 + 3, y1]], 'rgba(255,230,190,0.25)', 1.4), seed + 3, { drop: false });
  }
  function panneauxLosanges(x0, y0, x1, y1, CW, CH_, c1, c2, seed) {
    for (let r = -1; r < (y1 - y0) / (CH_ / 2) + 1; r++) for (let k = -1; k < (x1 - x0) / CW + 1; k++) {
      const cx = x0 + k * CW + (r % 2 ? CW / 2 : 0), cy = y0 + r * CH_ / 2;
      const dm = [[cx, cy - CH_ / 2 + 3], [cx + CW / 2 - 3, cy], [cx, cy + CH_ / 2 - 3], [cx - CW / 2 + 3, cy]];
      fillPts(dm, (r & 1) ? c2 : c1, seed + r * 31 + k, 0.6);
      strokePts([dm[3], dm[0], dm[1]], 'rgba(255,230,180,0.22)', 1.3); strokePts([dm[1], dm[2], dm[3]], 'rgba(40,24,12,0.35)', 1.3);
      fillPts([[cx - 6, cy - 4], [cx, cy - 10], [cx + 6, cy - 4], [cx, cy + 2]], 'rgba(255,230,180,0.08)', 0, 0);
      dot(cx, cy - CH_ / 2, 2.6, '#3e2a1a');
    }
  }
  function makeStRegie() {
    return M.pre(W, BACK + 40, (c) => {
      const R = STU.regie;
      const g = c.createLinearGradient(0, R.y0, 0, R.y1); g.addColorStop(0, '#2e2622'); g.addColorStop(1, '#1d1816'); c.fillStyle = g; c.fillRect(R.x0 - 30, R.y0 - 30, R.x1 - R.x0 + 60, R.y1 - R.y0 + 60);
      for (const [x, w] of [[650, 70], [732, 60], [832, 66]]) { fillPts(rect(x, 350, x + w, 470), '#2a2a2e', x, 0.3); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { fillPts(ell(x + 14 + i * (w - 28) / 2, 380 + j * 50, 9, 9, 12), '#141416', 0, 0); strokePts(ep(x + 14 + i * (w - 28) / 2, 380 + j * 50, 9, 9, 12, 0, TAU), '#6a6a70', 1); } }
      fillPts([[R.x0, 548], [R.x1, 540], [R.x1, R.y1 + 10], [R.x0, R.y1 + 10]], '#3a2c22', 3, 0.5);
      for (let i = 0; i < 10; i++) dot(660 + i * 24, 560, 4, '#5a4a3a');
    });
  }
  function makeStFond() {
    return M.pre(W, BACK + 40, (c) => {
      const B = BACK, R = STU.regie;
      c.fillStyle = '#6a4a30'; c.fillRect(0, 0, W, B + 40);
      panneauxLosanges(0, 150, W, 1250, 92, 116, '#b18a52', '#86603c', 11);
      const sh = c.createLinearGradient(0, 150, 0, 1250); sh.addColorStop(0, 'rgba(30,18,10,0.45)'); sh.addColorStop(0.35, 'rgba(30,18,10,0)'); sh.addColorStop(1, 'rgba(30,18,10,0.25)'); c.fillStyle = sh; c.fillRect(0, 150, W, 1100);
      pc(rect(-10, 120, W + 10, 186), '#3e2a1a', () => { strokePts([[0, 176], [W, 176]], 'rgba(255,220,170,0.3)', 1.4); hatch(null, 0.05, 5, 0.2, 1, undefined, [-10, 120, W + 10, 186]); }, 8001, { drop: false });
      pc(rect(-10, 1250, W + 10, B + 30), '#4e3220', () => {                                                      // lambris
        for (let x = 20; x < W; x += 130) { strokePts(rect(x, 1272, x + 108, B - 16), 'rgba(255,220,170,0.18)', 1.4, true); strokePts([[x + 108, 1272], [x + 108, B - 16], [x, B - 16]], 'rgba(20,10,4,0.45)', 1.4); }
        strokePts([[0, 1254], [W, 1254]], 'rgba(255,220,170,0.35)', 2); hatch(null, 0.05, 6, 0.15, 1, undefined, [-10, 1250, W + 10, B + 30]);
      }, 8002, { drop: false });
      // baie vitrée de la régie (trou découpé) + cadre
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0); c.restore();
      cadre(R.x0, R.y0, R.x1, R.y1, 24, '#4a3324', 8003, 34);
      pc(rect(R.x0 - 4, R.y0 + 130, R.x1 + 4, R.y0 + 140), '#3a2618', null, 8004, { drop: false });
      // haut-parleur de contrôle (caisse de bois, grille en soleil)
      const H = STU.hp;
      pc(rect(H.x - 46, H.y, H.x + 46, H.y + 110), '#5a3a22', () => {
        fillPts(ell(H.x, H.y + 55, 34, 34, 20), '#b89a62'); hatch(ell(H.x, H.y + 55, 34, 34, 20), 0.8, 3, 0.25);
        for (let i = 0; i < 9; i++) { const a = -PI + i * PI / 8; fillPts(bar([H.x, H.y + 55], [H.x + Math.cos(a) * 34, H.y + 55 + Math.sin(a) * 34], 4), '#5a3a22'); }
        strokePts(ep(H.x, H.y + 55, 34, 34, 20, 0, TAU), '#3a2414', 2);
      }, 8005);
      // porte capitonnée à hublot + boîtier de la lampe « à l'antenne » (ronde, sans lettre)
      const Pt = STU.porte;
      pc(rect(Pt.x0 - 14, Pt.y0 - 14, Pt.x1 + 14, B + 6), '#3e2a1a', null, 8006);
      pc(rect(Pt.x0, Pt.y0, Pt.x1, B), '#5a2e28', () => {
        for (let y = Pt.y0 + 30; y < B; y += 46) for (let x = Pt.x0 + 22; x < Pt.x1; x += 38) { dot(x + ((y / 46) % 2 ? 19 : 0), y, 3, '#c9a24a'); }
        for (let k = -6; k < 12; k++) { strokePts([[Pt.x0 + k * 38, Pt.y0], [Pt.x0 + k * 38 + 540, Pt.y0 + 540 * 1.21]], 'rgba(30,10,8,0.3)', 1); strokePts([[Pt.x1 - k * 38, Pt.y0], [Pt.x1 - k * 38 - 540, Pt.y0 + 540 * 1.21]], 'rgba(30,10,8,0.3)', 1); }
        fillPts(ell((Pt.x0 + Pt.x1) / 2, Pt.y0 + 110, 30, 30, 18), '#2a2622'); strokePts(ep((Pt.x0 + Pt.x1) / 2, Pt.y0 + 110, 30, 30, 18, 0, TAU), '#b58f45', 3);
        strokePts([[(Pt.x0 + Pt.x1) / 2 - 18, Pt.y0 + 96], [(Pt.x0 + Pt.x1) / 2 - 4, Pt.y0 + 90]], 'rgba(255,255,255,0.35)', 2);
        fillPts(rect(Pt.x0 + 10, B - 50, Pt.x1 - 10, B - 10), '#a07c3a');
        shade(Pt.x1, 0, Pt.x0, 0, 0.3, [Pt.x0, Pt.y0, Pt.x1, B]);
      }, 8007);
      pc(ell(Pt.x0 + 26, Pt.y0 + 290, 9, 9, 12), '#c9a24a', null, 8008);
      // rideau acoustique bordeaux (fond plissé) à gauche
      pc([[50, 150], [250, 150], [236, 600], [226, 1000], [244, B], [50, B]], '#6e2230', () => {
        for (let x = 60; x < 250; x += 22) strokePts([[x, 150], [x + 6 * Math.sin(x), 700], [x - 4, B]], 'rgba(30,6,10,0.45)', 3);
        for (let x = 70; x < 250; x += 22) strokePts([[x, 150], [x + 4, 900], [x - 2, B]], 'rgba(220,120,130,0.18)', 2);
      }, 8101);
      const L = STU.lampe;
      pc(rect(L.x - 58, L.y - 40, L.x + 58, L.y + 40), '#2a2420', () => { strokePts(rect(L.x - 52, L.y - 34, L.x + 52, L.y + 34), 'rgba(200,180,140,0.35)', 1.2, true); for (const x of [-46, 46]) dot(L.x + x, L.y, 3, '#b58f45'); }, 8010);
      pc(ell(L.x, L.y, 33, 33, 22), '#9a9ea4', () => { strokePts(ep(L.x, L.y, 30, 30, 22, PI * 1.1, PI * 1.6), '#eef0f2', 1.6); }, 8009);
    });
  }
  function makeStMilieu() {
    return M.pre(W, BACK + 40, (c) => {
      const B = BACK;
      // projecteur sur pied (trépied + tête cylindrique, coupe-flux)
      const Pj = STU.projo;
      for (const dx of [-60, 0, 54]) fillPts(bar([Pj.x, Pj.y + 160], [Pj.x + dx, B], 7), '#2a2a2c');
      pc(rect(Pj.x - 5, Pj.y + 20, Pj.x + 5, Pj.y + 170), '#3a3a3e', null, 8102);
      c.save(); c.translate(Pj.x, Pj.y); c.rotate(0.62);
      pc([[-34, -26], [40, -26], [48, -34], [48, 34], [40, 26], [-34, 26], [-42, 14], [-42, -14]], '#2c2c30', () => { strokePts([[-30, -18], [36, -18]], 'rgba(255,255,255,0.25)', 1.4); for (let x = -26; x < 36; x += 10) strokePts([[x, -26], [x, -18]], 'rgba(0,0,0,0.5)', 1); }, 8103);
      pc([[48, -34], [74, -50], [76, -44], [52, -28]], '#1e1e22', null, 8104); pc([[48, 34], [74, 50], [76, 44], [52, 28]], '#1e1e22', null, 8105);
      fillPts(ell(49, 0, 6, 30, 12), '#f3e2b0', 0, 0);
      c.restore();
      // piano droit noir, tasse sur le dessus
      const Pi = STU.piano;
      pc(rect(Pi.x0, Pi.y0, Pi.x1, B), '#1c1a1e', () => {
        fillPts(rect(Pi.x0 + 12, Pi.y0 + 24, Pi.x1 - 12, Pi.y0 + 150), '#26232a'); strokePts(rect(Pi.x0 + 18, Pi.y0 + 30, Pi.x1 - 18, Pi.y0 + 144), 'rgba(200,180,140,0.35)', 1.2, true);
        for (let x = Pi.x0 + 30; x < Pi.x1 - 20; x += 26) strokePts([[x, Pi.y0 + 40], [x + 12, Pi.y0 + 132]], 'rgba(255,255,255,0.06)', 6);
        fillPts(rect(Pi.x0 - 6, Pi.y0 + 166, Pi.x1 + 6, Pi.y0 + 196), '#141216');
        fillPts(rect(Pi.x0, Pi.y0 + 170, Pi.x1, Pi.y0 + 184), '#efe8d6'); for (let x = Pi.x0 + 6; x < Pi.x1; x += 10) { strokePts([[x, Pi.y0 + 170], [x, Pi.y0 + 184]], 'rgba(0,0,0,0.4)', 0.8); if ((x / 10 | 0) % 7 !== 2 && (x / 10 | 0) % 7 !== 6) fillPts(rect(x + 3, Pi.y0 + 170, x + 7, Pi.y0 + 178), '#141216', 0, 0); }
        for (const x of [Pi.x0 + 14, Pi.x1 - 14]) fillPts(rect(x - 7, Pi.y0 + 196, x + 7, B), '#100e12');
        strokePts([[Pi.x0 + 4, Pi.y0 + 4], [Pi.x1 - 4, Pi.y0 + 4]], 'rgba(255,255,255,0.3)', 1.6);
        shade(Pi.x1, 0, Pi.x0, 0, 0.3, [Pi.x0, Pi.y0, Pi.x1, B]);
      }, 8106);
      const T = STU.tasse;
      pc([[T.x - 20, T.y + 6], [T.x + 20, T.y + 6], [T.x + 16, T.y + 1], [T.x - 16, T.y + 1]], '#e9e3d6', null, 8107);
      pc([[T.x - 12, T.y - 20], [T.x + 12, T.y - 20], [T.x + 9, T.y + 2], [T.x - 9, T.y + 2]], '#efe9dc', () => fillPts(rect(T.x - 12, T.y - 20, T.x + 12, T.y - 16), '#4a2c18'), 8108);
      strokePts(ep(T.x + 14, T.y - 10, 6, 6, 8, -PI / 2, PI / 2), '#d8d0bf', 2.4);
      // pupitre à partitions (la partition est dessinée en direct)
      const Pu = STU.pupitre;
      for (const dx of [-30, 0, 28]) fillPts(bar([Pu.x, B - 70], [Pu.x + dx, B], 4), '#1e1e22');
      pc(rect(Pu.x - 3, Pu.y + 20, Pu.x + 3, B - 60), '#2a2a2e', null, 8109);
      c.save(); c.translate(Pu.x, Pu.y + 20); c.rotate(-0.22); pc(rect(-48, -60, 48, 0), '#2a2a2e', () => { for (let x = -40; x < 48; x += 12) strokePts([[x, -56], [x, -4]], 'rgba(255,255,255,0.12)', 1); }, 8110); pc(rect(-50, -2, 50, 6), '#1e1e22', null, 8111); c.restore();
      // table de bruitages : porte miniature sur cadre, demi-noix de coco, casserole ; bassine au sol
      const Tb = STU.table;
      pc(rect(Tb.x0, Tb.y, Tb.x1, Tb.y + 18), '#6b4a2e', () => strokePts([[Tb.x0, Tb.y + 3], [Tb.x1, Tb.y + 3]], 'rgba(255,220,170,0.4)', 1.4), 8112);
      for (const x of [Tb.x0 + 10, Tb.x1 - 10]) pc(rect(x - 6, Tb.y + 18, x + 6, B), '#5a3c24', null, 8113 + x);
      pc(rect(Tb.x0 + 14, Tb.y - 132, Tb.x0 + 24, Tb.y), '#5a3c24', null, 8115); pc(rect(Tb.x0 + 86, Tb.y - 132, Tb.x0 + 96, Tb.y), '#5a3c24', null, 8116);
      pc(rect(Tb.x0 + 14, Tb.y - 140, Tb.x0 + 96, Tb.y - 130), '#5a3c24', null, 8117);
      pc(rect(Tb.x0 + 26, Tb.y - 126, Tb.x0 + 84, Tb.y - 2), '#8a5a34', () => { strokePts(rect(Tb.x0 + 32, Tb.y - 118, Tb.x0 + 78, Tb.y - 70), 'rgba(40,20,8,0.5)', 1.2, true); strokePts(rect(Tb.x0 + 32, Tb.y - 60, Tb.x0 + 78, Tb.y - 10), 'rgba(40,20,8,0.5)', 1.2, true); dot(Tb.x0 + 76, Tb.y - 64, 3, '#c9a24a'); }, 8118);
      for (const x of [Tb.x0 + 116, Tb.x0 + 140]) pc(ep(x, Tb.y, 12, 14, 10, PI, TAU), '#5a3a22', () => hatch(null, 0.8, 2.6, 0.4), 8119 + x);
      pc([[Tb.x1 - 34, Tb.y - 14], [Tb.x1 - 4, Tb.y - 14], [Tb.x1 - 6, Tb.y], [Tb.x1 - 32, Tb.y]], '#8c9096', null, 8121); fillPts(bar([Tb.x1 - 34, Tb.y - 10], [Tb.x1 - 74, Tb.y - 18], 5), '#2a2a2c');
      pc([[Tb.x0 + 50, B - 40], [Tb.x0 + 130, B - 40], [Tb.x0 + 120, B], [Tb.x0 + 60, B]], '#8a8e92', () => strokePts([[Tb.x0 + 54, B - 36], [Tb.x0 + 126, B - 36]], 'rgba(255,255,255,0.4)', 1.4), 8122);
    });
  }
  function makeStSol() {
    return M.pre(W, BACK + 120, (c) => {
      const y0 = BACK + 30;
      // chaise pliante en bois avec une veste de tweed
      const x = STU.chaise;
      fillPts(bar([x - 36, y0 - 210], [x + 30, y0], 8), '#6b4a2e'); fillPts(bar([x + 30, y0 - 210], [x - 36, y0], 8), '#5a3c24');
      pc(rect(x - 46, y0 - 108, x + 44, y0 - 96), '#7a5636', null, 8201);
      pc(rect(x - 44, y0 - 230, x - 30, y0 - 100), '#6b4a2e', null, 8202);
      pc([[x - 62, y0 - 226, 1], [x - 12, y0 - 226, 1], [x - 8, y0 - 200], [x - 6, y0 - 118, 1], [x - 34, y0 - 112, 1], [x - 64, y0 - 118, 1], [x - 66, y0 - 200]], '#6e6250', () => {
        hatch(null, 0.8, 3, 0.35); hatch(null, -0.8, 3, 0.22);
        fillPts([[x - 37, y0 - 234], [x - 26, y0 - 220], [x - 32, y0 - 196], [x - 40, y0 - 220]], '#5a4f40');                        // revers
        fillPts([[x - 12, y0 - 192], [x - 4, y0 - 120], [x - 14, y0 - 116], [x - 22, y0 - 180]], '#5e5444');                           // manche qui pend
        dot(x - 30, y0 - 180, 2.2, '#3a3028'); dot(x - 31, y0 - 160, 2.2, '#3a3028');
      }, 8203);
      // cendrier sur pied (la cigarette fume en direct)
      const X0 = STU.cendrier;
      pc(ell(X0, y0 - 6, 34, 8, 16), '#7c8086', null, 8204);
      pc(rect(X0 - 4, y0 - 170, X0 + 4, y0 - 8), '#b8bcc0', () => strokePts([[X0 + 1, y0 - 166], [X0 + 1, y0 - 12]], '#eef0f2', 1), 8205);
      pc([[X0 - 30, y0 - 178], [X0 + 30, y0 - 178], [X0 + 22, y0 - 166], [X0 - 22, y0 - 166]], '#9a9ea4', () => strokePts([[X0 - 26, y0 - 176], [X0 + 26, y0 - 176]], '#eef0f2', 1.2), 8206);
      pc(rect(X0 + 4, y0 - 184, X0 + 30, y0 - 179), '#efe9dc', () => fillPts(rect(X0 + 26, y0 - 184, X0 + 30, y0 - 179), '#8a8480'), 8207, { drop: false });
      // câbles enroulés au sol + câble qui serpente
      const Cx = STU.cables;
      for (let i = 0; i < 4; i++) strokePts(ep(Cx, y0 - 8, 46 - i * 6, 10 - i, 22, 0, TAU), i % 2 ? '#1a1a1c' : '#2a2a2e', 4);
      strokePts(qbez([Cx - 40, y0 - 4], [Cx - 160, y0 + 14], [Cx - 300, y0 + 2], 12), '#1a1a1c', 4);
    });
  }
  function regieVie(t, o) {            // régie : cadrans ambrés qui clignotent, vu-mètres, ingénieur en ombre chinoise (o.casque 0..1 : il ajuste son casque)
    const c = cx_(), g = M.tg(t), R = STU.regie;
    if (SIL()) return;
    c.save(); c.beginPath(); c.rect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0); c.clip();
    let i = 0;
    for (const [x, w] of [[650, 70], [732, 60], [832, 66]]) for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) {
      const k = clamp(0.35 + 0.65 * Math.sin(g * (1.3 + 0.37 * i) + i * 1.7)), cx = x + 14 + a * (w - 28) / 2, cy = 380 + b * 50; i++;
      fillPts(ell(cx, cy, 8, 8, 12), mixA('#5a3a10', '#ffc060', k), 0, 0);
      const gl = c.createRadialGradient(cx, cy, 1, cx, cy, 24); gl.addColorStop(0, `rgba(255,190,90,${0.35 * k})`); gl.addColorStop(1, 'rgba(255,190,90,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(cx - 24, cy - 24, 48, 48); c.restore();
    }
    for (const [x, ph] of [[680, 0], [720, 1.7]]) { fillPts(rect(x - 16, 500, x + 16, 528), '#e8c880', 0, 0); const a = -0.6 + 0.9 * (0.5 + 0.5 * M.noise(g * 2.2, ph)); strokePts([[x, 526], [x + Math.sin(a) * 22, 526 - Math.cos(a) * 22]], '#2a1a10', 1.4); }
    const cq = clamp(o.casque || 0), hx0 = 800 + 2 * Math.sin(g * 0.9), hy0 = 470 + 2 * Math.sin(g * 1.4);
    const sil = '#120e0c';
    fillPts([[hx0 - 70, R.y1 + 4], [hx0 - 56, 530], [hx0 - 20, 508], [hx0 + 24, 510], [hx0 + 58, 532], [hx0 + 70, R.y1 + 4]], sil, 0, 0);
    fillPts(ell(hx0, hy0, 30, 36, 18), sil, 0, 0); fillPts([[hx0 + 26, hy0 - 4], [hx0 + 36, hy0 + 6], [hx0 + 26, hy0 + 12]], sil, 0, 0);
    strokePts(ep(hx0, hy0 - 4, 36, 40, 14, PI * 1.05, PI * 1.95), sil, 6);
    fillPts(ell(hx0 - 4, hy0 + 2, 12, 16, 12), '#1d1714', 0, 0);
    if (cq > 0) { const a = Math.sin(cq * PI), hand = [hx0 - 40 + 30 * a, hy0 + 40 - 30 * a]; fillPts(ribbon([[hx0 - 50, R.y1 - 20], [hx0 - 60, hy0 + 50 - 10 * a], hand], 16, 13), sil, 0, 0); fillPts(ell(hand[0], hand[1], 11, 12, 10), sil, 0, 0); }
    c.restore();
    c.save(); c.globalAlpha = 0.5; fillPts([[R.x0 + 20, R.y0], [R.x0 + 70, R.y0], [R.x0 + 10, R.y1], [R.x0 - 30 > R.x0 ? R.x0 : R.x0, R.y1]], 'rgba(255,240,220,0.12)', 0, 0); fillPts([[R.x0 + 110, R.y0], [R.x0 + 130, R.y0], [R.x0 + 70, R.y1], [R.x0 + 50, R.y1]], 'rgba(255,240,220,0.10)', 0, 0); c.restore();
  }
  // GDM.studio(t, up, o) : studio CBS 1938, à dessiner en premier (avant M.drawFloor) ; up = décalage vertical (px, monte le décor).
  //   o.antenne 0..1 (lampe rouge ronde au-dessus de la porte, défaut 1) ; o.lumiere 0..1 (1 = pleine lumière chaude, 0 = pénombre) ;
  //   o.casque 0..1 (l'ingénieur ajuste son casque) ; o.partition 0..1 (la partition glisse du pupitre et tombe en planant) ; o.projecteur 0..1 (faisceau, défaut 1)
  GDM.studio = function (t, up, o) {
    o = o || {}; up = up || 0; const K = GDM.K, c = cx_(), g = M.tg(t), B = BACK, lum = clamp(o.lumiere == null ? 1 : o.lumiere), an = clamp(o.antenne == null ? 1 : o.antenne);
    c.save(); c.translate(0, -up);
    c.drawImage(K.stRegie, 0, 0); regieVie(t, o); c.drawImage(K.stFond, 0, 0);
    M.pendule(t, { x: STU.pendule.x, y: STU.pendule.y, s: STU.pendule.s, per: 2 });
    M.voilage(t, { x: 46, y: 160, w: 120, h: 1225, cote: 1, amp: 7, col: 'rgba(120,34,48,0.88)' });
    M.voilage(t + 1.3, { x: 120, y: 160, w: 120, h: 1225, cote: 1, amp: 5, col: 'rgba(98,26,38,0.8)' });
    c.drawImage(K.stMilieu, 0, 0);
    // métronome sur le piano
    const Mt = STU.metro, ma = 0.45 * Math.sin(g * PI * 1.6);
    pc([[Mt.x - 18, Mt.y], [Mt.x + 18, Mt.y], [Mt.x + 8, Mt.y - 64], [Mt.x - 8, Mt.y - 64]], '#5a3a22', () => fillPts([[Mt.x - 9, Mt.y - 8], [Mt.x + 9, Mt.y - 8], [Mt.x + 4, Mt.y - 56], [Mt.x - 4, Mt.y - 56]], '#e8dcc0'), 8301, { drop: false });
    fillPts(bar([Mt.x, Mt.y - 10], [Mt.x + Math.sin(ma) * 56, Mt.y - 10 - Math.cos(ma) * 56], 2.4), '#2a2a2c'); dot(Mt.x + Math.sin(ma) * 40, Mt.y - 10 - Math.cos(ma) * 40, 4, '#b58f45');
    M.fumee(t, { x: STU.tasse.x, y: STU.tasse.y - 22, s: 0.32, n: 5, haut: 150, vent: 14, col: '#efe8dc', a: 0.55, seed: 41 });
    // partition sur le pupitre (o.partition : glisse et tombe en planant)
    const Pu = STU.pupitre, pa = clamp(o.partition || 0);
    const px = Pu.x + 30 * Math.min(1, pa * 4) + 140 * Math.max(0, pa - 0.25) / 0.75 * Math.sin(pa * 9) * 0.6, py = Pu.y - 10 + lerp(0, B - 20 - Pu.y, Math.pow(Math.max(0, pa - 0.15) / 0.85, 1.4)), pr = -0.22 + (pa > 0.15 ? Math.sin(pa * 14) * 0.9 * (1 - pa) + (pa > 0.95 ? 1.35 : 0) : 0);
    c.save(); c.translate(px, py); c.rotate(pr); c.scale(1, pa > 0.15 ? 0.5 + 0.5 * Math.abs(Math.cos(pa * 11)) : 1);
    pc(rect(-40, -56, 40, 0), '#efe9da', () => { for (let s = 0; s < 4; s++) for (let l = 0; l < 5; l++) strokePts([[-34, -50 + s * 13 + l * 2], [34, -50 + s * 13 + l * 2]], 'rgba(60,50,40,0.45)', 0.7); for (let k = 0; k < 14; k++) dot(-30 + k * 4.6, -48 + (k % 4) * 13 + ((k * 3) % 5) * 1.6, 1.4, '#2a2420'); }, 8302, { drop: false });
    c.restore();
    // feuille de tonnerre suspendue qui oscille
    const Tn = STU.tonnerre, ta = 0.05 * Math.sin(g * 1.1) + 0.02 * Math.sin(g * 2.7);
    strokePts([[Tn.x - 24, 150], [Tn.x - 24 + Math.sin(ta) * 510, Tn.y]], '#2a2a2c', 1.2); strokePts([[Tn.x + 24, 150], [Tn.x + 24 + Math.sin(ta) * 510, Tn.y]], '#2a2a2c', 1.2);
    c.save(); c.translate(Tn.x + Math.sin(ta) * 510, Tn.y); c.rotate(ta);
    const rip = (y) => 3 * Math.sin(y * 0.06 + g * 2.3);
    const shp = []; for (let y = 0; y <= 190; y += 19) shp.push([-32 + rip(y), y]); for (let y = 190; y >= 0; y -= 19) shp.push([32 + rip(y), y]);
    pc(shp, '#6e7278', () => { for (let y = 10; y < 190; y += 18) strokePts([[-30 + rip(y), y], [30 + rip(y), y + 2]], 'rgba(255,255,255,0.18)', 1.1); shade(30, 0, -30, 0, 0.35, [-40, 0, 40, 200]); }, 8303);
    fillPts(rect(-36, -4, 36, 6), '#2a2a2e'); c.restore();
    // faisceau du projecteur + poussière
    const pj = clamp(o.projecteur == null ? 1 : o.projecteur) * lum;
    if (pj > 0 && !SIL()) {
      const Pj = STU.projo, s0 = [Pj.x + 40, Pj.y + 30], poly = [[s0[0] - 6, s0[1] - 26], [s0[0] + 20, s0[1] + 10], [770, B], [470, B]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      const gr = c.createLinearGradient(s0[0], s0[1], 620, B); gr.addColorStop(0, `rgba(255,226,170,${0.22 * pj})`); gr.addColorStop(1, `rgba(255,226,170,${0.03 * pj})`); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: s0[0] - 20, y: s0[1], w: 460, h: B - s0[1], n: 40, a: 0.8 * pj, seed: 23 });
      c.restore();
    }
    if (lum < 1 && !SIL()) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(60,44,40,${0.75 * (1 - lum)})`; c.fillRect(0, 0, W, B + 40); c.restore(); }
    // lampe « à l'antenne » (verre rouge rond, sans lettre)
    const L = STU.lampe;
    fillPts(ell(L.x, L.y, 24, 24, 20), mixA('#4a1a18', '#e8352a', an), 0, 0);
    dot(L.x - 8, L.y - 8, 5, `rgba(255,${200 - 60 * an},${190 - 80 * an},${0.35 + 0.4 * an})`);
    if (an > 0 && !SIL()) { const k = an * (0.92 + 0.08 * Math.sin(g * 3)), gl = c.createRadialGradient(L.x, L.y, 8, L.x, L.y, 150); gl.addColorStop(0, `rgba(255,70,50,${0.55 * k})`); gl.addColorStop(1, 'rgba(255,60,40,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(L.x - 150, L.y - 150, 300, 300); c.restore(); }
    c.restore();
  };
  // GDM.studioSol(t, up, o) : premier plan du studio (chaise pliante avec veste, cendrier sur pied qui fume, câbles) — juste APRÈS M.drawFloor()
  GDM.studioSol = function (t, up, o) {
    up = up || 0; const c = cx_();
    c.save(); c.translate(0, -up); c.drawImage(GDM.K.stSol, 0, 0);
    M.fumee(t, { x: STU.cendrier + 30, y: BACK + 30 - 184, s: 0.3, n: 5, haut: 200, vent: -16, col: '#ddd6ca', a: 0.5, seed: 47 });
    c.restore();
  };

  // ---------------- salle de rédaction, matin
  const RED = { fen: [[130, 300], [410, 590], [740, 910]], fy0: 250, fy1: 800, pendule: { x: 665, y: 330, s: 0.72 }, lampes: [270, 540, 810], lampeY: 560, fan: { x: 540, y: 300 },
    tube: 352, casier: { x0: 108, x1: 250, y0: 860, y1: 1180 }, bureauA: { x0: 112, x1: 346, y: 1195 }, bureauB: { x0: 540, x1: 700, y: 1215 },
    telA: { x: 318, y: 1195 }, telB: { x: 668, y: 1215 }, machine: { x: 210, y: 1195 }, rot: { x0: 730, x1: 965, y0: 1010 }, roul: [[790, 1125, 34], [880, 1188, 30], [812, 1262, 26]], volant: [912, 1078, 66],
    corbeille: 205, portemanteau: 945, crachoir: 870, chem: [[236, 610], [512, 590], [840, 640], [560, 590]] };
  GDM.REDACTION = RED;
  function immeuble(x, w, top, base, col, colF, seed, deco) {
    pc(rect(x, top, x + w, base), col, () => {
      for (let y = top + 16; y < base - 10; y += 22) for (let xx = x + 8; xx < x + w - 10; xx += 16) fillPts(rect(xx, y, xx + 8, y + 12), hash(seed + xx * 0.3 + y) > 0.78 ? 'rgba(255,236,190,0.55)' : colF, 0, 0);
      shade(x + w, 0, x, 0, 0.25, [x, top, x + w, base]);
    }, seed, { drop: false, texA: 0.3 });
    if (deco === 'spire') { pc([[x + w * 0.2, top], [x + w * 0.3, top - 40], [x + w * 0.42, top - 70], [x + w * 0.46, top - 160], [x + w * 0.54, top - 160], [x + w * 0.58, top - 70], [x + w * 0.7, top - 40], [x + w * 0.8, top]], col, null, seed + 1, { drop: false, texA: 0.3 }); }
    if (deco === 'couronne') { for (let i = 0; i < 4; i++) pc(ep(x + w / 2, top - i * 22, w * (0.5 - i * 0.1), 30, 10, PI, TAU), col, () => { for (let k = 1; k < 5; k++) dot(x + w / 2 + (k - 2.5) * w * 0.12 * (1 - i * 0.2), top - i * 22 - 14, 3, 'rgba(255,236,190,0.5)'); }, seed + 2 + i, { drop: false, texA: 0.3 }); }
    if (deco === 'reservoir') {
      const cx = x + w * 0.6, b = top;
      for (const dx of [-16, 16]) fillPts(bar([cx + dx, b], [cx + dx * 0.7, b - 40], 3), '#4a3e34');
      pc(rect(cx - 24, b - 90, cx + 24, b - 40), '#7a5a3e', () => { for (let y = b - 84; y < b - 40; y += 12) strokePts([[cx - 24, y], [cx + 24, y]], '#3a2a1c', 1.4); }, seed + 7, { drop: false });
      pc([[cx - 28, b - 90], [cx, b - 118], [cx + 28, b - 90]], '#5a4030', null, seed + 8, { drop: false });
    }
  }
  function makeRdVue() {
    return M.pre(W, BACK + 40, (c) => {
      const g = c.createLinearGradient(0, 150, 0, 900); g.addColorStop(0, '#93a8b8'); g.addColorStop(0.6, '#c9d2cf'); g.addColorStop(1, '#e6dfc8'); c.fillStyle = g; c.fillRect(0, 0, W, BACK + 40);
      const sl = c.createRadialGradient(150, 700, 10, 150, 700, 400); sl.addColorStop(0, 'rgba(255,240,205,0.6)'); sl.addColorStop(1, 'rgba(255,240,205,0)'); c.fillStyle = sl; c.fillRect(0, 300, 600, 800);
      for (const [x, w, top, d] of [[40, 120, 520, 0], [180, 90, 440, 0], [300, 140, 560, 0], [470, 110, 330, 'spire'], [620, 130, 500, 0], [780, 100, 420, 'couronne'], [900, 160, 540, 0]]) immeuble(x, w, top, 1000, '#a9b4b8', 'rgba(120,134,140,0.6)', 8400 + x, d);
      for (const [x, w, top, d] of [[100, 170, 660, 'reservoir'], [330, 120, 700, 0], [440, 180, 640, 0], [700, 150, 690, 'reservoir'], [880, 190, 660, 0]]) immeuble(x, w, top, 1000, '#7d888c', 'rgba(70,80,86,0.6)', 8500 + x, d);
      for (const [x, y] of RED.chem) pc(rect(x - 10, y, x + 10, y + 50), '#5a4a42', () => fillPts(rect(x - 12, y, x + 12, y + 8), '#3a302a'), 8600 + x, { drop: false });
      for (const [x0, x1] of RED.fen) pc(rect(x0 - 20, RED.fy1 - 16, x1 + 20, RED.fy1 + 4), '#9a948a', () => strokePts([[x0 - 20, RED.fy1 - 14], [x1 + 20, RED.fy1 - 14]], 'rgba(255,255,255,0.4)', 1.4), 8610 + x0, { drop: false });   // rebord extérieur
    });
  }
  function radiateur(x, y, w) {
    pc(rect(x, y, x + w, y + 80), '#6c7068', () => { for (let xx = x + 6; xx < x + w; xx += 12) { strokePts([[xx, y + 4], [xx, y + 76]], 'rgba(255,255,255,0.25)', 2); strokePts([[xx + 5, y + 4], [xx + 5, y + 76]], 'rgba(0,0,0,0.3)', 2); } }, 8700 + x);
  }
  function makeRdMur() {
    return M.pre(W, BACK + 40, (c) => {
      const B = BACK;
      pc(rect(-10, 120, W + 10, B + 30), '#a3a894', () => {
        for (let i = 0; i < 30; i++) fillPts(ell(hash(i * 3.1) * W, 200 + hash(i * 7.7) * 1000, 60 + 80 * hash(i), 40 + 50 * hash(i + 2), 10), 'rgba(255,255,240,0.06)');
        hatch(null, 0.8, 7, 0.07, 1, undefined, [-10, 120, W + 10, B]);
        const sh = c.createLinearGradient(0, 150, 0, 600); sh.addColorStop(0, 'rgba(40,46,40,0.35)'); sh.addColorStop(1, 'rgba(40,46,40,0)'); c.fillStyle = sh; c.fillRect(-10, 120, W + 20, 500);
      }, 8701, { drop: false });
      pc(rect(-10, 1150, W + 10, B + 30), '#4a3a2c', () => { for (let x = 10; x < W; x += 120) { strokePts(rect(x, 1172, x + 100, B - 14), 'rgba(255,220,170,0.16)', 1.3, true); } strokePts([[0, 1154], [W, 1154]], 'rgba(255,220,170,0.35)', 2); }, 8702, { drop: false });
      pc(rect(-10, 150, W + 10, 200), '#7c8270', () => strokePts([[0, 196], [W, 196]], 'rgba(255,255,255,0.3)', 1.4), 8703, { drop: false });
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; for (const [x0, x1] of RED.fen) c.fillRect(x0, RED.fy0, x1 - x0, RED.fy1 - RED.fy0); c.restore();
      for (const [x0, x1] of RED.fen) {
        const y0 = RED.fy0, y1 = RED.fy1, Fc = '#3c4238';
        cadre(x0, y0, x1, y1, 18, Fc, 8710 + x0, 10);
        for (let k = 1; k < 3; k++) { const x = x0 + (x1 - x0) * k / 3; pc(rect(x - 3, y0, x + 3, y1), Fc, null, 8720 + x, { drop: false }); }
        for (let k = 1; k < 6; k++) { const y = y0 + (y1 - y0) * k / 6; pc(rect(x0, y - 3, x1, y + 3), Fc, null, 8730 + y + x0, { drop: false }); }
        pc(rect(x0, y0 + (y1 - y0) / 2 - 6, x1, y0 + (y1 - y0) / 2 + 6), Fc, null, 8740 + x0, { drop: false });
        pc(rect(x0 - 28, y1 + 8, x1 + 28, y1 + 26), '#8e8a7c', () => strokePts([[x0 - 28, y1 + 10], [x1 + 28, y1 + 10]], 'rgba(255,255,255,0.35)', 1.4), 8750 + x0);
      }
      radiateur(150, 900, 130); radiateur(760, 900, 130);
      // tubes pneumatiques en laiton + réception
      const Tx = RED.tube;
      for (const dx of [0, 18]) pc(rect(Tx + dx - 6, 150, Tx + dx + 6, 960), '#b58f45', () => { strokePts([[Tx + dx - 2, 150], [Tx + dx - 2, 960]], '#f0d890', 1.4); for (let y = 240; y < 960; y += 120) fillPts(rect(Tx + dx - 8, y, Tx + dx + 8, y + 8), '#8a6a2a'); }, 8760 + dx);
      pc(rect(Tx - 24, 950, Tx + 42, 1030), '#9a7a3a', () => { fillPts(ell(Tx + 9, 990, 18, 18, 14), '#3a2a1a'); strokePts(ep(Tx + 9, 990, 18, 18, 14, 0, TAU), '#f0d890', 2); }, 8770);
      pc(rect(Tx - 9, 760, Tx + 27, 860), 'rgba(200,220,220,0.35)', () => strokePts([[Tx - 4, 764], [Tx - 4, 856]], 'rgba(255,255,255,0.6)', 1.2), 8771, { drop: false });
    });
  }
  function machineAEcrire(x, y) {
    pc([[x - 54, y], [x + 54, y], [x + 44, y - 40], [x - 44, y - 40]], '#1e1e22', () => { for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) dot(x - 36 + k * 10 + r * 3, y - 10 - r * 9, 2.6, '#d8d4c8'); }, 8800 + x);
    pc(rect(x - 60, y - 54, x + 60, y - 40), '#2a2a2e', () => { dot(x - 66, y - 47, 6, '#6a6a70'); strokePts([[x - 56, y - 50], [x + 56, y - 50]], 'rgba(255,255,255,0.3)', 1); }, 8810 + x);
    pc(rect(x - 34, y - 104, x + 34, y - 50), '#f0ebde', () => { for (let yy = y - 96; yy < y - 56; yy += 6) strokePts([[x - 28, yy], [x + 20 - (yy % 14), yy]], 'rgba(60,56,50,0.5)', 1); }, 8820 + x);
  }
  function makeRdMilieu() {
    return M.pre(W, BACK + 40, (c) => {
      const B = BACK;
      // casier à journaux (cases)
      const Cs = RED.casier;
      pc(rect(Cs.x0, Cs.y0, Cs.x1, B), '#5a4030', () => {
        for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) {
          const x = Cs.x0 + 10 + k * 44, y = Cs.y0 + 12 + r * 52; fillPts(rect(x, y, x + 38, y + 44), '#2e2218');
          if (hash(r * 3 + k) > 0.25) fillPts(rect(x + 2, y + 18 + 12 * hash(r + k), x + 36, y + 44), hash(r * 5 + k * 2) > 0.5 ? '#e4dcc6' : '#d6ccb2');
        }
        fillPts(rect(Cs.x0, Cs.y1 + 10, Cs.x1, B), '#4a3424');
      }, 8901);
      // rotative noire (bâti ; rouleaux et volant en direct)
      const Ro = RED.rot;
      pc([[Ro.x0, B, 1], [Ro.x0 + 10, Ro.y0 + 60, 1], [Ro.x0 + 60, Ro.y0, 1], [Ro.x1 - 20, Ro.y0, 1], [Ro.x1, Ro.y0 + 40, 1], [Ro.x1, B, 1]], '#262628', () => {
        for (let y = Ro.y0 + 40; y < B; y += 60) strokePts([[Ro.x0 + 14, y], [Ro.x1 - 6, y]], 'rgba(255,255,255,0.08)', 2);
        for (let i = 0; i < 18; i++) dot(Ro.x0 + 20 + (i % 6) * 38, Ro.y0 + 30 + Math.floor(i / 6) * 150, 3, '#6a6a70');
        fillPts(rect(Ro.x0 + 40, B - 70, Ro.x1 - 20, B - 10), '#1a1a1c');
        shade(Ro.x1, 0, Ro.x0, 0, 0.3, [Ro.x0, Ro.y0, Ro.x1, B]);
      }, 8902);
      pc(rect(Ro.x0 - 70, 1300, Ro.x0 + 6, 1316), '#3a3a3e', null, 8903);                           // plateau de sortie
      for (const [x, y, r] of RED.roul) { pc(ell(x, y, r + 8, r + 8, 18), '#3a3a3e', null, 8904 + x, { drop: false }); }
      // bureaux, machines à écrire, papiers ; piles ficelées
      for (const Bu of [RED.bureauA, RED.bureauB]) {
        pc(rect(Bu.x0, Bu.y, Bu.x1, Bu.y + 20), '#6b4a2e', () => strokePts([[Bu.x0, Bu.y + 3], [Bu.x1, Bu.y + 3]], 'rgba(255,220,170,0.4)', 1.4), 8910 + Bu.x0);
        pc(rect(Bu.x0 + 8, Bu.y + 20, Bu.x0 + 70, B), '#5a3c24', () => { for (let y = Bu.y + 40; y < B; y += 56) { strokePts(rect(Bu.x0 + 14, y, Bu.x0 + 64, y + 44), 'rgba(255,220,170,0.25)', 1.2, true); dot(Bu.x0 + 39, y + 22, 3, '#c9a24a'); } }, 8920 + Bu.x0);
        pc(rect(Bu.x1 - 18, Bu.y + 20, Bu.x1 - 6, B), '#5a3c24', null, 8930 + Bu.x0);
      }
      machineAEcrire(RED.machine.x, RED.bureauA.y);
      for (let i = 0; i < 5; i++) pc(rect(RED.bureauB.x0 + 14 + i * 2, RED.bureauB.y - 10 - i * 8, RED.bureauB.x0 + 84 + i * 2, RED.bureauB.y - 2 - i * 8), i % 2 ? '#e4dcc6' : '#ece5d2', () => fillPts(rect(RED.bureauB.x0 + 20 + i * 2, RED.bureauB.y - 9 - i * 8, RED.bureauB.x0 + 50, RED.bureauB.y - 5 - i * 8), 'rgba(36,32,29,0.6)'), 8940 + i, { drop: false });
      c.save(); c.translate(Ro.x0 - 50, B); c.scale(0.62, 0.62); drawPile({ n: 7 }); c.restore();
      c.save(); c.translate(Ro.x0 - 210, B); c.scale(0.55, 0.55); drawPile({ n: 5 }); c.restore();
      c.save(); c.translate(470, B); c.scale(0.5, 0.5); drawPile({ n: 4 }); c.restore();
    });
  }
  function makeRdSol() {
    return M.pre(W, BACK + 120, (c) => {
      const y0 = BACK + 30;
      // corbeille à papier débordante
      const x = RED.corbeille;
      pc([[x - 42, y0 - 96], [x + 42, y0 - 96], [x + 32, y0], [x - 32, y0]], '#6a5a44', () => { for (let k = -4; k <= 4; k++) strokePts([[x + k * 10, y0 - 96], [x + k * 7.6, y0]], 'rgba(30,22,14,0.6)', 1.4); for (let y = y0 - 80; y < y0; y += 18) strokePts([[x - 40, y], [x + 40, y]], 'rgba(30,22,14,0.5)', 1.2); }, 9001);
      for (let i = 0; i < 9; i++) { const bx = x - 40 + i * 10 + 6 * Math.sin(i * 2), by = y0 - 100 - 14 * hash(i * 1.7) - (i > 2 && i < 7 ? 14 : 0); pc(ell(bx, by, 13, 12, 9), i % 3 ? '#e4dcc6' : '#ece5d2', () => { strokePts([[bx - 8, by - 2], [bx + 4, by + 4], [bx + 8, by - 4]], 'rgba(80,70,60,0.5)', 1); }, 9002 + i); }
      pc(ell(x + 70, y0 - 10, 13, 12, 9), '#e4dcc6', null, 9015);
      // porte-manteau avec chapeau mou et manteau
      const P0 = RED.portemanteau;
      for (const dx of [-36, 0, 34]) fillPts(bar([P0, y0 - 40], [P0 + dx, y0], 6), '#3a2a1c');
      pc(rect(P0 - 5, y0 - 520, P0 + 5, y0 - 30), '#4a3424', null, 9020);
      for (const s of [-1, 1]) fillPts(bar([P0, y0 - 500], [P0 + s * 30, y0 - 520], 5), '#3a2a1c');
      pc([[P0 - 6, y0 - 512], [P0 + 8, y0 - 512], [P0 + 30, y0 - 494], [P0 + 36, y0 - 420], [P0 + 40, y0 - 280], [P0 + 26, y0 - 264], [P0 - 4, y0 - 270], [P0 - 30, y0 - 276], [P0 - 34, y0 - 420], [P0 - 28, y0 - 494]], '#5e5448', () => {
        hatch(null, 0.8, 3.4, 0.3);
        fillPts([[P0 - 6, y0 - 512], [P0 + 8, y0 - 512], [P0 + 14, y0 - 460], [P0 + 2, y0 - 400], [P0 - 8, y0 - 460]], '#4a4238');           // col et revers
        fillPts([[P0 + 30, y0 - 494], [P0 + 40, y0 - 470], [P0 + 44, y0 - 330], [P0 + 30, y0 - 326], [P0 + 26, y0 - 450]], '#544a3e');        // manche
        for (const y of [-380, -340, -300]) dot(P0 + 6, y0 + y, 2.4, '#2a241e');
        strokePts([[P0 + 2, y0 - 400], [P0 + 6, y0 - 268]], 'rgba(0,0,0,0.35)', 1.2);
      }, 9021);
      pc([[P0 - 44, y0 - 530], [P0 + 44, y0 - 530], [P0 + 34, y0 - 538], [P0 + 26, y0 - 566], [P0 - 22, y0 - 568], [P0 - 32, y0 - 538]], '#7a6248', () => fillPts(rect(P0 - 30, y0 - 546, P0 + 30, y0 - 536), '#3a2a1c'), 9022);
      // crachoir de laiton
      const Cr = RED.crachoir;
      pc([[Cr - 30, y0 - 40], [Cr + 30, y0 - 40], [Cr + 36, y0 - 22], [Cr + 24, y0], [Cr - 24, y0], [Cr - 36, y0 - 22]], '#b58f45', () => { strokePts([[Cr - 26, y0 - 34], [Cr + 26, y0 - 34]], '#f0d890', 1.4); shade(30, 0, -30, 0, 0.3, [Cr - 40, y0 - 44, Cr + 40, y0]); }, 9030);
      pc(ell(Cr, y0 - 42, 22, 5, 12), '#5a4020', null, 9031, { drop: false });
    });
  }
  function telephone(x, y, s, so, g, seed) {           // téléphone chandelier ; (x,y) = pied ; so 0..1 : il sonne et sautille
    const c = cx_(), hop = so * Math.abs(Math.sin(g * 26 + seed)), rot = so * 0.07 * Math.sin(g * 26 + seed);
    c.save(); c.translate(x, y - 7 * hop); c.rotate(rot); c.scale(s, s);
    pc(ell(0, -6, 26, 8, 14), '#1c1c1e', null, 9100 + seed, { drop: false });
    pc(rect(-6, -118, 6, -8), '#1c1c1e', () => strokePts([[2, -114], [2, -12]], 'rgba(255,255,255,0.25)', 1), 9101 + seed);
    pc([[-6, -118], [6, -118], [24, -134], [24, -148], [14, -150], [-8, -128]], '#1c1c1e', null, 9102 + seed);
    pc(rect(-30, -100, -18, -40), '#1c1c1e', () => fillPts(rect(-32, -104, -16, -96), '#2a2a2c'), 9103 + seed);
    strokePts([[-12, -88], [-18, -92]], '#3a3a3c', 3);
    strokePts(qbez([-24, -40], [-30, -10], [-12, -4], 6), '#2a2a2c', 1.6);
    c.restore();
    if (so > 0.05 && !SIL()) for (let i = 0; i < 2; i++) { const u = fr(g * 3 + i * 0.5), r = 30 + 40 * u; c.save(); c.globalAlpha = so * (1 - u) * 0.8; strokePts(ep(x, y - 80 * s - 7 * hop, r * s, r * s, 8, -PI * 0.85, -PI * 0.55), '#3a3a3c', 2); strokePts(ep(x, y - 80 * s - 7 * hop, r * s, r * s, 8, -PI * 0.45, -PI * 0.15), '#3a3a3c', 2); c.restore(); }
  }
  function pigeon(x, y, s, vol, g, dir) {
    const c = cx_(), fl = Math.sin(g * 18);
    c.save(); c.translate(x, y); c.scale(s * (dir || 1), s);
    pc(ell(0, -10, 16, 9, 12), '#8a8e96', () => fillPts(ell(4, -12, 8, 5, 8), '#6e8a7a'), 9160, { drop: false });
    pc(ell(14, -20, 6, 6, 10), '#7a7e86', () => dot(16, -21, 1.4, '#e08a30'), 9161, { drop: false });
    fillPts([[19, -20], [25, -18], [19, -17]], '#d8b090');
    pc([[-6, -14], [10, -14], [4, -14 - 18 * (vol ? fl : 0.2) - (vol ? 6 : 0)], [-14, -12 - 14 * (vol ? fl : 0.1)]], '#6e727a', null, 9162, { drop: false });
    if (!vol) { strokePts([[0, -2], [0, 4]], '#c06050', 1.6); strokePts([[4, -2], [5, 4]], '#c06050', 1.6); }
    fillPts([[-14, -10], [-26, -6], [-24, -2], [-12, -6]], '#5e626a');
    c.restore();
  }
  // GDM.redaction(t, up, o) : salle de rédaction au matin, à dessiner en premier (avant M.drawFloor) ; up = décalage vertical.
  //   o.rotative vitesse 0..1 (défaut 1 ; garder constante pendant un plan) ; o.sonne 0..1 (les téléphones sautillent ; o.sonneA / o.sonneB pour un seul) ;
  //   o.pigeon 0..1 (un pigeon arrive et se pose sur le rebord de la fenêtre de gauche) ; o.feuille 0..1 (une feuille s'envole du bureau de gauche) ; o.lampes (true)
  GDM.redaction = function (t, up, o) {
    o = o || {}; up = up || 0; const K = GDM.K, c = cx_(), g = M.tg(t), B = BACK, rv = o.rotative == null ? 1 : o.rotative;
    c.save(); c.translate(0, -up);
    c.drawImage(K.rdVue, 0, 0);
    M.nuages(t, { y0: 280, y1: 470, n: 5, vit: 9, s: 0.55, seed: 61, col: '#eef0ea', brume: 0.15 });
    for (const [x, y] of RED.chem) M.fumee(t, { x, y: y - 4, s: 0.35, n: 5, haut: 200, vent: 70, col: '#d6d8d2', a: 0.55, seed: 70 + x });
    const pg = clamp(o.pigeon || 0);
    if (pg > 0) { const vol = pg < 0.4, u = M.easeOut(pg / 0.4), px = vol ? lerp(-40, 216, u) : 216 + 6 * Math.sin(g * 0.8), py = vol ? lerp(420, RED.fy1 - 16, u) : RED.fy1 - 16; pigeon(px, py, 1.5, vol, g, 1); }
    c.drawImage(K.rdMur, 0, 0);
    if (!SIL()) { c.save(); c.globalAlpha = 0.18; for (const [x0, x1] of RED.fen) fillPts([[x0 + 10, RED.fy0], [x0 + 50, RED.fy0], [x0 + 6, RED.fy1], [x0 - 30 + 30, RED.fy1]], '#ffffff', 0, 0); c.restore(); }
    M.pendule(t, { x: RED.pendule.x, y: RED.pendule.y, s: RED.pendule.s, per: 2, bois: '#4a3424' });
    const cap = fr(g * 0.11); if (cap < 0.25 && !SIL()) { const y = lerp(740, 880, cap / 0.25); pc(rect(RED.tube - 5, y, RED.tube + 5, y + 30), '#c9a24a', null, 9170, { drop: false }); }
    c.drawImage(K.rdMilieu, 0, 0);
    // rotative : rouleaux et volant qui tournent, bande de papier qui défile
    const ang = g * 5 * rv;
    for (const [x, y, r] of RED.roul.concat([RED.volant])) {
      pc(ell(x, y, r, r, 20), r > 50 ? '#2e2e32' : '#4a4a50', () => { for (let k = 0; k < (r > 50 ? 6 : 4); k++) { const a = ang * (60 / r) + k * TAU / (r > 50 ? 6 : 4); fillPts(bar([x, y], [x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9], r > 50 ? 7 : 4), '#1a1a1c'); } dot(x, y, r * 0.2, '#8a8a90'); strokePts(ep(x, y, r * 0.92, r * 0.92, 16, PI * 1.1, PI * 1.6), 'rgba(255,255,255,0.3)', 1.4); }, 9180 + x, { drop: false });
    }
    const R0 = RED.roul, bl = cbez([R0[0][0], R0[0][1] - R0[0][2]], [R0[0][0] - 70, R0[0][1] - R0[0][2] - 40], [RED.rot.x0 - 30, 1200], [RED.rot.x0 - 40, 1298], 16);
    pc(ribbon(bl, 12, 12), '#ece5d2', () => strokePts(bl, 'rgba(120,110,90,0.4)', 1), 9190, { drop: false });
    if (!SIL()) for (let k = 0; k < 6; k++) { const u = fr(k / 6 + g * 0.35 * rv), i = Math.min(bl.length - 2, Math.floor(u * (bl.length - 1))); const p = bl[i], q = bl[i + 1]; strokePts([[p[0], p[1]], [lerp(p[0], q[0], 0.8), lerp(p[1], q[1], 0.8)]], 'rgba(36,32,29,0.55)', 3); }
    // téléphones
    const so = clamp(o.sonne || 0);
    telephone(RED.telA.x, RED.telA.y, 0.9, o.sonneA != null ? clamp(o.sonneA) : so, g, 1);
    telephone(RED.telB.x, RED.telB.y, 0.9, o.sonneB != null ? clamp(o.sonneB) : so, g, 2.3);
    // ventilateur de plafond
    const F = RED.fan;
    pc(rect(F.x - 4, 150, F.x + 4, F.y - 6), '#3a3a3e', null, 9200, { drop: false });
    const blades = [0, 1, 2, 3].map((k) => g * 4.2 + k * PI / 2).map((a) => [Math.cos(a), Math.sin(a)]);
    const blade = ([cs, sn]) => pc([[F.x, F.y + 12], [F.x + cs * 26, F.y + 9 + sn * 3], [F.x + cs * 110, F.y + 8 + sn * 8], [F.x + cs * 112, F.y + 16 + sn * 8], [F.x + cs * 26, F.y + 17 + sn * 3]], '#5a3c24', null, 9201, { drop: false });
    for (const b of blades) if (b[1] < 0) blade(b);
    pc([[F.x - 22, F.y - 6], [F.x + 22, F.y - 6], [F.x + 26, F.y + 14], [F.x + 14, F.y + 24], [F.x - 14, F.y + 24], [F.x - 26, F.y + 14]], '#4a3a2a', () => strokePts([[F.x - 18, F.y], [F.x + 18, F.y]], 'rgba(255,220,170,0.4)', 1.2), 9202, { drop: false });
    for (const b of blades) if (b[1] >= 0) blade(b);
    // lampes à abat-jour vert suspendues (oscillent)
    if (o.lampes !== false) RED.lampes.forEach((lx, i) => {
      const a = 0.03 * Math.sin(g * 1.1 + i * 1.9), L = RED.lampeY - 150, hx_ = lx + Math.sin(a) * L, hy = 150 + Math.cos(a) * L;
      strokePts([[lx, 150], [hx_, hy]], '#1e1e20', 1.6);
      c.save(); c.translate(hx_, hy); c.rotate(-a);
      if (!SIL()) { const gl = c.createRadialGradient(0, 40, 4, 0, 40, 120); gl.addColorStop(0, 'rgba(255,240,190,0.4)'); gl.addColorStop(1, 'rgba(255,240,190,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(-120, -80, 240, 240); c.restore(); }
      pc([[-8, 0], [8, 0], [10, 8], [46, 34], [-46, 34], [-10, 8]], '#2f5a3e', () => { strokePts([[-40, 30], [40, 30]], 'rgba(255,255,255,0.35)', 1.2); shade(40, 0, -40, 0, 0.3, [-50, 0, 50, 36]); }, 9210 + i, { drop: false });
      dot(0, 38, 7, '#fff4cc'); c.restore();
    });
    // rayon de la fenêtre de gauche + poussière
    if (!SIL()) {
      const poly = [[RED.fen[0][0] + 20, RED.fy0 + 40], [RED.fen[0][1], RED.fy0 + 20], [700, B], [380, B]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      const gr = c.createLinearGradient(200, 300, 540, B); gr.addColorStop(0, 'rgba(235,245,255,0.16)'); gr.addColorStop(1, 'rgba(235,245,255,0.02)'); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: 140, y: 300, w: 560, h: B - 300, n: 44, a: 0.7, seed: 29 });
      c.restore();
    }
    // feuille qui s'envole du bureau de gauche dans le souffle du ventilateur
    const fe = clamp(o.feuille || 0);
    if (fe > 0 && fe < 1) {
      const fx = lerp(RED.machine.x + 70, 620, fe) + 30 * Math.sin(fe * 9), fy = RED.bureauA.y - 8 - 300 * Math.sin(PI * fe * 0.8) + 260 * fe * fe;
      c.save(); c.translate(fx, fy); c.rotate(Math.sin(fe * 12) * 0.9); c.scale(1, 0.4 + 0.6 * Math.abs(Math.cos(fe * 10)));
      pc(rect(-30, -38, 30, 38), '#f0ebde', () => { for (let y = -30; y < 32; y += 6) strokePts([[-24, y], [22 - (y & 7), y]], 'rgba(60,56,50,0.45)', 0.9); }, 9220, { drop: false }); c.restore();
    }
    c.restore();
  };
  // GDM.redactionSol(t, up, o) : premier plan de la rédaction (corbeille débordante, porte-manteau et chapeau, crachoir) — juste APRÈS M.drawFloor()
  GDM.redactionSol = function (t, up) { up = up || 0; const c = cx_(); c.save(); c.translate(0, -up); c.drawImage(GDM.K.rdSol, 0, 0); c.restore(); };

  GDM.init = function () {
    if (GDM.K) return GDM.K;
    const K = (GDM.K = {});
    K.stRegie = makeStRegie(); K.stFond = makeStFond(); K.stMilieu = makeStMilieu(); K.stSol = makeStSol();
    K.rdVue = makeRdVue(); K.rdMur = makeRdMur(); K.rdMilieu = makeRdMilieu(); K.rdSol = makeRdSol();
    return K;
  };
})();
