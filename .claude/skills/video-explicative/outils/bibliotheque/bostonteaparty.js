// persos.js — « La Boston Tea Party, la révolte contre un thé moins cher » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.btp (alias BTP). Appeler BTP.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre, drapeau ni logo (la couronne de la pièce d'or est le seul symbole). Déterministe (hash, aucun Math.random).
// Cadre des marionnettes (corps, bras à articulations rondes, jambes à deux segments, objets tenus, charge à deux mains) repris de bibliotheque/greve.js.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const BTP = (M.btp = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const W = 1080;

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const leafPts = (x, y, a, l, w) => [[0, 0], [l * 0.3, -w], [l * 0.72, -w * 0.75], [l, 0, 1], [l * 0.72, w * 0.75], [l * 0.3, w]].map((p) => { const r = rot(p, a); return [x + r[0], y + r[1]]; });
  BTP.geo = { ep, ell, rrect, box, qbez };

  // =====================================================================
  // 1) OBJETS — dessinés à l'échelle 1 dans leur repère
  // =====================================================================
  const BOIS = '#6b4a2e', BOISL = '#86603c', BOISD = '#4b3320', LAI = '#b08d45', LAIL = '#d9bd72', LAID = '#76592a';
  const CUI = '#a8603a', CUIL = '#cf8a5c', CUID = '#73401f', OR = '#c9a24a', ORL = '#efd88a', ORD = '#86662a';
  const CA = { w: 83, h: 102, lid: 16 };          // caisse : demi-largeur, hauteur du corps, épaisseur du couvercle
  function coin(x, yb, rx, ry, h, col, colL, colD, seed) {             // pièce vue de chant, posée : yb = bas
    pc(ep(x, yb - h, rx, ry, 10, PI, TAU).concat(ep(x, yb, rx, ry, 10, 0, PI)), col, () => {
      for (let i = -rx + 5; i < rx - 2; i += 5) strokePts([[x + i, yb - h + ry * 0.4], [x + i, yb + ry * 0.4]], 'rgba(40,20,5,0.28)', 1);
      strokePts([[x - rx + 3, yb - h * 0.45], [x + rx - 3, yb - h * 0.45]], 'rgba(255,240,200,0.22)', 1.4);
      shade(x + rx, 0, x - rx, 0, 0.3, [x - rx - 2, yb - h - ry - 2, x + rx + 2, yb + ry + 2]);
    }, seed, { drop: false });
    pc(ell(x, yb - h, rx, ry, 18), colL, () => { fillPts(ell(x, yb - h, rx * 0.72, ry * 0.6, 14), col); strokePts(ep(x, yb - h, rx * 0.72, ry * 0.6, 10, PI * 1.1, PI * 1.6), 'rgba(255,250,220,0.6)', 1.2); }, seed + 1, { drop: false });
  }
  const crownPts = (cx, cy, w, h) => [[cx - w / 2, cy + h / 2, 1], [cx + w / 2, cy + h / 2, 1], [cx + w / 2, cy - h / 2, 1], [cx + w / 4, cy - h * 0.05], [cx, cy - h / 2 - 2, 1], [cx - w / 4, cy - h * 0.05], [cx - w / 2, cy - h / 2, 1]];
  function drawPile(o, yTop) {                                            // pile de pièces de cuivre (+ pièce d'or à couronne en bas)
    const cr = o.couronne ? 1 : 0, n = cr + clamp(o.pieces || 0, 0, 6);
    if (n <= 0) return;
    const full = Math.floor(n + 1e-6), fr = n - full;
    let y = yTop;
    for (let i = 0; i < Math.ceil(n - 1e-6); i++) {
      const gold = cr && i === 0, h = gold ? 26 : 22, rx = gold ? 40 : 37, dx = (hash(i * 7.3 + 1) - 0.5) * 9;
      let yy = y; const c = cx_(); let alpha = 1;
      if (i === full && fr > 0) { yy = y - (1 - ease(fr)) * 90; alpha = clamp(fr * 3); }
      c.save(); c.globalAlpha *= alpha;
      if (gold) {
        coin(dx, yy, rx, 8, h, OR, ORL, ORD, 9180);
        pc(crownPts(dx, yy - h * 0.5 + 1, 30, 16), ORD, () => { strokePts([[dx - 13, yy - 7], [dx + 13, yy - 7]], ORL, 1.2); }, 9183, { drop: false });
        for (const k of [-1, 0, 1]) dot(dx + k * 15, yy - h * 0.5 - 8 + (k === 0 ? -2 : 0), 2.6, ORL);
      } else coin(dx, yy, rx, 8, h, CUI, CUIL, CUID, 9170 + i * 3);
      c.restore();
      y -= h;
    }
  }
  function drawCadenas(o) {                                               // origine = milieu du bas du corps ; 62 × 92 à l'échelle 1
    const e = o.etat || 'ferme', neuf = e === 'neuf', casse = e === 'casse', c = cx_();
    const body = neuf ? '#a7acb2' : '#3b3a38', bodyL = neuf ? '#eef1f3' : '#64615c', anseC = neuf ? '#c0c5ca' : '#4c4a46';
    const Ro = 20, Ri = 11, cy = -70;
    const U = [[-Ro, -46], [-Ro, cy]].concat(ep(0, cy, Ro, Ro, 12, PI, TAU), [[Ro, cy], [Ro, -46], [Ri, -46], [Ri, cy]], ep(0, cy, Ri, Ri, 12, TAU, PI), [[-Ri, cy], [-Ri, -46]]);
    const ansePaint = () => { strokePts(ep(0, cy, (Ro + Ri) / 2 + 2, (Ro + Ri) / 2 + 2, 10, PI * 1.15, PI * 1.6), neuf ? 'rgba(255,255,255,0.85)' : 'rgba(200,200,190,0.35)', 2); hatch(null, 0.6, 3.4, 0.2); };
    if (!casse) pc(U, anseC, ansePaint, 9301);
    else {
      c.save(); c.translate(-15.5, -50); c.rotate(-0.62); c.translate(15.5, 50 - 16);
      pc(U.map((p) => (p[0] > 0 ? [p[0] + (p[1] < cy ? 0 : 6), p[1] + (p[0] > 8 && p[1] > cy ? -4 : 0)] : p)), anseC, ansePaint, 9302);
      c.restore();
      pc([[11, -60], [20, -60], [21, -54, 1], [10, -52, 1]], anseC, null, 9303);              // bout cassé resté dans le corps
    }
    pc(rrect(-31, -54, 31, 0, 9), body, () => {
      fillPts(rrect(-25, -48, 25, -6, 7), neuf ? '#bcc1c6' : '#45433f');
      dot(0, -32, 5.5, '#0e0d0c'); fillPts([[-2.6, -30], [2.6, -30], [3.6, -15, 1], [-3.6, -15, 1]], '#0e0d0c');
      for (const [x, y] of [[-22, -46], [22, -46], [-22, -8], [22, -8]]) dot(x, y, 2.4, neuf ? '#d8dcdf' : '#6d6a64');
      strokePts([[-26, -44], [-26, -12]], bodyL, neuf ? 3 : 1.6);
      if (neuf) { strokePts([[-18, -50], [8, -50]], 'rgba(255,255,255,0.9)', 2); dot(18, -40, 3, 'rgba(255,255,255,0.9)'); }
      if (casse) strokePts([[6, -54], [12, -42], [4, -34], [14, -20], [8, -6]], '#141211', 1.8);
      hatch(null, 0.7, 3.6, neuf ? 0.1 : 0.3); shade(31, 0, -31, 0, 0.3, [-32, -56, 32, 2]);
    }, 9304);
  }
  function drawCaisse(o) {                                                // origine = milieu du dessous ; 166 × 118 (+ couvercle, pièces)
    const w = CA.w, h = CA.h, L = CA.lid, c = cx_();
    const k = clamp(o.couvercle || 0);
    pc(box(-w, -h, w, 0), BOIS, () => {
      for (const y of [-68, -34]) strokePts([[-w, y], [w, y]], 'rgba(25,14,6,0.6)', 1.5);
      for (let i = 0; i < 9; i++) strokePts([[-w + 6, -h + 7 + i * 11], [w - 6, -h + 8 + i * 11 + (hash(i * 3.1) - 0.5) * 4]], 'rgba(170,120,75,0.2)', 1);
      // branche de thé peinte : tige + trois feuilles (aucune lettre)
      const bx = -14, by = -48, P0 = [bx - 44, by + 28], P1 = [bx - 4, by + 12], P2 = [bx + 36, by - 22];
      strokePts(qbez(P0, P1, P2, 10), '#d7c08c', 3.2);
      fillPts(leafPts(bx - 22, by + 18, -1.35, 34, 10), '#c9b07a'); fillPts(leafPts(bx + 6, by + 2, -0.2, 38, 11), '#d7c08c'); fillPts(leafPts(bx + 30, by - 18, -1.0, 30, 9), '#c9b07a');
      for (const [x, y, a] of [[bx - 22, by + 18, -1.35], [bx + 6, by + 2, -0.2], [bx + 30, by - 18, -1.0]]) { const e = rot([26, 0], a); strokePts([[x, y], [x + e[0], y + e[1]]], 'rgba(90,60,30,0.6)', 1); }
      hatch(null, 0.5, 4.4, 0.22, 1, undefined, [-w, -h, w, 0]); shade(w, 0, -w, 0, 0.28, [-w, -h, w, 0]);
    }, 9101);
    const plate = (x, y, sx, sy) => pc([[x, y, 1], [x + sx * 26, y, 1], [x + sx * 26, y + sy * 8, 1], [x + sx * 8, y + sy * 8, 1], [x + sx * 8, y + sy * 26, 1], [x, y + sy * 26, 1]], LAI, () => { dot(x + sx * 4.5, y + sy * 4.5, 2, LAID); dot(x + sx * 18, y + sy * 4, 1.6, LAID); dot(x + sx * 4, y + sy * 18, 1.6, LAID); }, 9110 + (sx > 0 ? 1 : 0) + (sy > 0 ? 2 : 0), { drop: false });
    plate(-w, 0, 1, -1); plate(w, 0, -1, -1); plate(-w, -h, 1, 1); plate(w, -h, -1, 1);
    if (k > 0) {                                                          // intérieur : thé en vrac
      fillPts(box(-w + 4, -h - 2, w - 4, -h + 8), '#24160b');
      pc(ep(0, -h + 2, w - 10, 10 + 8 * k, 12, PI, TAU), '#4f4128', () => { for (let i = 0; i < 26; i++) dot(-w + 16 + hash(i * 2.7) * (2 * w - 32), -h - 4 - hash(i * 5.3) * 10 * k, 1.6, i % 2 ? '#6b5a36' : '#30261a'); }, 9120, { drop: false });
    }
    c.save(); c.translate(-w, -h); c.rotate(-k * 1.9);
    pc(box(-3, -L, 2 * w + 3, 0), BOISL, () => { strokePts([[0, -L / 2], [2 * w, -L / 2]], 'rgba(30,18,8,0.35)', 1); hatch(null, 0.3, 4, 0.2); }, 9105);
    for (const x of [-3, 2 * w + 3]) pc(box(x - (x < 0 ? 0 : 12), -L - 1, x + (x < 0 ? 12 : 0), 1), LAI, null, 9106, { drop: false });
    if (o.cadenas) pc(box(2 * w - 46, -6, 2 * w - 28, 16), '#3d3b38', () => dot(2 * w - 37, 8, 3, '#111'), 9107);   // moraillon
    c.restore();
    if (o.cadenas && k < 0.05) {                                          // cadenas accroché au moraillon
      pc(box(w - 42, -h + 2, w - 32, -h + 12), '#2a2826', null, 9108, { drop: false });
      c.save(); c.translate(w - 37, -h + 58); c.scale(0.62, 0.62); drawCadenas({ etat: o.cadenas }); c.restore();
    }
    if (k < 0.05) drawPile(o, -h - L);
  }
  // tasse de porcelaine à filet bleu (origine = prise : milieu du corps) ; o.eclabousse 0..1 + o.t : gouttes de thé qui jaillissent
  const TASSE = [[-23, -16], [23, -16], [21, -3], [16, 9], [10, 16, 1], [-10, 16, 1], [-16, 9], [-21, -3]];
  function drawTasse(o) {
    pc([[18, -10], [32, -12], [38, -4], [34, 6], [20, 7], [21, 2], [30, 1], [32, -5], [28, -7], [19, -5]], '#f1eee6', () => strokePts([[30, -11], [37, -4], [33, 5]], '#4a6a9a', 1.2), 9201);
    pc(TASSE, '#f3f0e8', () => {
      strokePts([[-22, -11], [22, -11]], '#4a6a9a', 2.2); strokePts([[-15, 8], [15, 8]], '#4a6a9a', 1.6);
      for (let i = -14; i <= 14; i += 7) dot(i, -2, 1.4, '#6c86ac');
      strokePts([[-17, -12], [-12, 10]], 'rgba(255,255,255,0.9)', 2.2); shade(23, 0, -23, 0, 0.18, [-24, -18, 24, 18]);
    }, 9202);
    fillPts(ell(0, -16, 22, 3.2, 12), '#7a4a26');
    const e = clamp(o.eclabousse || 0), t = o.t || 0;
    if (e > 0 && !SIL()) {
      const c = cx_();
      for (let i = 0; i < 6; i++) {
        const per = 0.55 + hash(i * 3.7) * 0.25, u = (((t + hash(i * 1.9) * per) % per) + per) % per / per;
        const vx = (hash(i * 4.1) - 0.5) * 120, vy = -150 - hash(i * 2.3) * 90;
        const x = (hash(i * 6.1) - 0.5) * 30 + vx * u, y = -18 + vy * u + 420 * u * u;
        c.save(); c.globalAlpha = e * (1 - u); c.fillStyle = '#7a4a26';
        c.beginPath(); c.ellipse(x, y, 4.2, 5.4, Math.atan2(vy + 840 * u, vx), 0, TAU); c.fill(); c.restore();
      }
    }
  }
  const SOUC = [[-42, -6], [42, -6], [36, 0], [14, 4, 1], [-14, 4, 1], [-36, 0]];
  function drawSoucoupe() {                                               // origine = milieu du dessous (posée à plat sur la paume)
    pc(tr(SOUC, 0, -4), '#f3f0e8', () => { strokePts([[-40, -9], [40, -9]], '#4a6a9a', 2); strokePts([[-30, -6], [30, -6]], 'rgba(255,255,255,0.8)', 1.2); }, 9210);
  }
  const CANNE_L = 236;
  function drawCanne() {                                                  // canne du vieil homme : origine = prise (haut), embout en (0, 236)
    pc([[-5, -6], [-3, -18], [8, -26], [22, -22], [26, -10], [21, -8], [18, -16], [8, -18], [3, -10], [5, CANNE_L], [-5, CANNE_L]], '#5e4128', () => { strokePts([[-1, -8], [0, CANNE_L - 4]], 'rgba(255,225,180,0.3)', 1.2); fillPts(box(-6, CANNE_L - 12, 6, CANNE_L), '#2a2420'); }, 9220);
  }
  // sac de toile du contrebandier : origine = nœud du col ; corps vers +y ; o.plein 0..1 ; o.filet 0..1 + o.filetY (y écran) + o.t
  function sacPts(k) {                                                   // k 1 = plein (ventru, bosselé, fond plat), 0 = flasque (toile vide qui pend)
    const P1 = [[-8, 2], [8, 2], [18, 14], [36, 30], [48, 54], [56, 82], [52, 96], [56, 112], [46, 132], [26, 144, 1], [-28, 144, 1], [-48, 130], [-56, 108], [-52, 92], [-56, 74], [-44, 46], [-28, 24], [-16, 12]];
    const P0 = [[-8, 2], [8, 2], [12, 14], [18, 30], [22, 54], [20, 82], [24, 96], [22, 112], [24, 128], [18, 138, 1], [-20, 136, 1], [-24, 124], [-20, 108], [-24, 92], [-20, 74], [-22, 46], [-16, 24], [-12, 12]];
    return P1.map((p, i) => (p[2] ? [lerp(P0[i][0], p[0], k), lerp(P0[i][1], p[1], k), 1] : [lerp(P0[i][0], p[0], k), lerp(P0[i][1], p[1], k)]));
  }
  function drawSac(o) {
    const k = clamp(o.plein == null ? 1 : o.plein), c = cx_();
    const pts = sacPts(k);
    const h2 = lerp(124, 140, k);
    pc(pts, '#c9b88f', () => {
      for (const [a, b2, c2] of [[[-4, 18], [-18, 70], [-12, h2 - 6]], [[4, 18], [14, 64], [18, h2 - 4]], [[0, 20], [-2, 80], [2, h2 - 2]]]) strokePts(qbez(a, b2, c2, 8), 'rgba(110,90,55,0.45)', 1.3);   // plis de la toile
      if (k < 0.6) for (let i = 0; i < 4; i++) strokePts([[-18, 44 + i * 20], [16, 50 + i * 20]], 'rgba(100,82,52,0.4)', 1.3);
      strokePts([[-40 * k - 8, h2 * 0.62], [40 * k + 8, h2 * 0.6]], 'rgba(255,248,225,0.35)', 2);
      fillPts(box(-14, h2 * 0.6, 8, h2 * 0.6 + 24), '#a8966c'); for (let i = 0; i < 5; i++) strokePts([[-14 + i * 5.5, h2 * 0.6 - 2], [-14 + i * 5.5, h2 * 0.6 + 2]], '#f2ead6', 1);   // pièce cousue
      shade(46, 0, -46, 0, 0.22, [-60, 0, 60, 160]);
    }, 9230);
    pc([[-9, 4], [-22, -14], [-14, -12], [-10, -24], [-3, -15], [3, -25], [9, -15], [14, -24], [16, -12], [24, -14], [9, 4]], '#bfae86', () => { for (const x of [-12, -4, 4, 12]) strokePts([[x * 0.4, 2], [x, -16]], 'rgba(100,82,52,0.5)', 1.1); }, 9231);   // col froncé
    pc(box(-12, -3, 12, 6), '#5b3d24', null, 9232);                                              // lien de corde
    pc([[8, 2], [14, 4], [22, 26], [18, 28], [10, 8]], '#5b3d24', null, 9233);
    const f = clamp(o.filet || 0);
    if (f > 0 && !SIL()) {                                                // filet de feuilles de thé qui tombe du col (vers le bas de l'écran)
      const m = c.getTransform(), B = mp(m, [0, -16]), t = o.t || 0, sc = Math.hypot(m.a, m.b);
      const yEnd = o.filetY != null ? o.filetY : B[1] + 150 * sc;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 18; i++) {
        const u = ((t * 1.6 + i / 18) % 1), y = B[1] + (yEnd - B[1]) * u, x = B[0] + Math.sin(i * 2.1 + t * 5) * 3 * sc + (hash(i) - 0.5) * 6 * sc;
        if (u > f) continue;
        c.save(); c.translate(x, y); c.rotate(i * 1.3 + t * 4); c.fillStyle = i % 3 ? '#3d2f1c' : '#5d4a2a';
        c.beginPath(); c.ellipse(0, 0, 3.2 * sc, 1.6 * sc, 0, 0, TAU); c.fill(); c.restore();
      }
      c.restore();
    }
  }
  // registre : draw, grip (prise), p2 (seconde prise), pts (points nommés), base (origine de l'accessoire seul), held (options par défaut en main)
  const OBJ = {
    caisse: { draw: drawCaisse, grip: [40, -50], p2: () => [-38, -40], pts: { dessus: [0, -CA.h - CA.lid], face: [0, -51] }, base: [0, 0] },
    cadenas: { draw: drawCadenas, grip: [0, -28], pts: { anse: [0, -90] }, base: [0, 0] },
    tasse: { draw: drawTasse, grip: [0, 0], pts: { bord: [0, -16], fond: [0, 16] }, base: [0, 16] },
    soucoupe: { draw: drawSoucoupe, grip: [0, 2], plat: true, pts: { dessus: [0, -10] }, base: [0, 0] },
    canne: { draw: drawCanne, grip: [0, 0], pts: { embout: [0, CANNE_L] }, base: [0, CANNE_L] },
    sac: { draw: drawSac, grip: [0, 8], p2: () => [0, 128], pts: { bouche: [0, -16], fond: [0, 140] }, base: [0, 0] },
  };
  BTP.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  // accessoire seul : M.puppet à une pièce invisible (ombre portée possible), l'objet se dessine dans l'extra
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accRaw(key, fn, x, y, s, o) {
    o = o || {};
    return M.puppet(accDef(key, fn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name];
    return accRaw(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({ t: 0 }, oo)); c.restore(); }, x, y, s, o);
  }
  // caisse seule ; flotte : (x,y) = point de la surface de l'eau sous la caisse, penchée, à moitié immergée, tangue avec o.t (passer M.tg(t))
  function drawCaisseFlotte(o) {
    const c = cx_(), t = o.t || 0, a = (o.penche == null ? 0.3 : o.penche) + 0.06 * Math.sin(t * 1.7 + (o.ph || 0)), bob = 4 * Math.sin(t * 2.1 + (o.ph || 0));
    const one = () => { c.save(); c.translate(0, 54 + bob); c.rotate(a); drawCaisse(o); c.restore(); };
    c.save(); c.beginPath(); c.rect(-400, 0, 800, 300); c.clip(); c.globalAlpha *= 0.3; one(); c.restore();
    c.save(); c.beginPath(); c.rect(-400, -600, 800, 600); c.clip(); one(); c.restore();
    if (!SIL()) for (let i = 0; i < 3; i++) { const r = 96 + i * 18 + 6 * Math.sin(t * 2 + i); strokePts(ep(0, 2 + i * 3, r, 6 + i * 2, 12, PI * 0.05, PI * 0.95), `rgba(225,235,235,${0.55 - i * 0.15})`, 1.6); }
  }
  BTP.caisse = (x, y, s, o) => { o = o || {}; s = s == null ? 0.9 : s;
    if (o.flotte) return accRaw('caisseFlotte', (oo) => drawCaisseFlotte(oo), x, y, s, o);
    return acc('caisse', x, y, s, o); };
  BTP.cadenas = (x, y, s, o) => acc('cadenas', x, y, s == null ? 1.4 : s, o);
  BTP.tasse = (x, y, s, o) => acc('tasse', x, y, s == null ? 0.8 : s, o);
  BTP.soucoupe = (x, y, s, o) => acc('soucoupe', x, y, s == null ? 0.8 : s, o);
  BTP.sac = (x, y, s, o) => acc('sac', x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // 2) CORPS — bras à articulations rondes, jambes à deux segments (cuisse, jambe, pied), objets tenus, charge à deux mains
  // =====================================================================
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  const KNEE = 108, ANK = 117, HIPY = -238;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  const HAND_CUP = [[-8, 78], [8, 78], [12, 86], [17, 92], [14, 96], [9, 93], [8, 104], [11, 111], [15, 113], [12, 119], [3, 119], [-5, 114], [-9, 102], [-9, 90]];
  function foreR(kind) {
    if (kind === 'cup') return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[11, 0], [10, 40], [9, 76]], HAND_CUP.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [[-9, 86], [-10, 76], [-11, 40]]);
    const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2));
  }
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      if (b > 0.05) continue;                                                   // coude toujours plié vers l'avant
      const sc = pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1];
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    if (!best) best = { a: normA(tv), b: 0 };
    return best;
  }
  const thighPts = (th) => [[-19 * th, -12], [17 * th, -14], [22 * th, 20], [20 * th, 70], [17, KNEE - 6]].concat(ep(0, KNEE, 17, 17, 8, 0, PI), [[-17, KNEE - 6], [-21 * th, 60], [-22 * th, 10]]);
  const shinPts = () => ep(0, 0, 16, 16, 8, PI, TAU).concat([[16, 12], [15, 60], [12, ANK - 14], [13, ANK + 3], [-15, ANK + 3], [-16, 70], [-17, 20], [-16, 8]]);
  const FOOT = {
    soulier: [[-16, -6], [12, -6], [22, -1], [38, 3], [46, 11, 1], [45, 15, 1], [-17, 15, 1], [-19, 5]],
    botte: [[-18, -8], [14, -6], [24, -1], [40, 3], [47, 11, 1], [46, 15, 1], [-19, 15, 1], [-21, 5]],
  };
  function footPaint(kind) {
    return () => {
      fillPts([[-20, 11], [50, 11], [50, 16], [-20, 16]], 'rgba(10,8,6,0.55)'); strokePts([[16, -2], [36, 3]], 'rgba(255,255,255,0.22)', 1.3);
      if (kind === 'boucle') { fillPts(box(12, -5, 24, 3), '#c9a24a'); fillPts(box(15, -3, 21, 1), '#3a2c20'); }
      if (kind === 'botte') strokePts([[-18, -4], [12, -4]], 'rgba(255,230,190,0.18)', 1.2);
    };
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  const plat = (v) => has(v) && OBJ[v] && OBJ[v].plat;
  function chargeDraw(p, dos) {
    const ch = p._charge; if (!ch || ch.cache || !!ch.dos !== dos) return;
    const ob = OBJ[ch.nom], c = cx_(); c.save(); c.translate(ch.pos[0], ch.pos[1]); c.rotate(ch.angT); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({ t: p.t || 0 }, ch.o)); c.restore();
  }
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => ((has(p.tenu) && !plat(p.tenu)) || (p._charge && p._charge.tient) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => ((has(p.tenuB) && !plat(p.tenuB)) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      charge: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => chargeDraw(p, false) },
      chargeDos: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => chargeDraw(p, true) },
    };
  }
  function foreDef(parent, base, skin, back, seed, o) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (o.roule != null) fillPts([[-24, o.roule, 1], [24, o.roule, 1], [24, 140, 1], [-24, 140, 1]], skin);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin);
      if (k === 'cup') { strokePts([[2, 100], [6, 110]], 'rgba(70,35,20,0.45)', 1); hatch([[-12, 76], [-2, 76], [-2, 122], [-12, 122]], 0.9, 3.4, 0.22); } else X.handPaint(null, k);
      if (o.roule != null) fillPts([[-15, o.roule - 8, 1], [15, o.roule - 8, 1], [15, o.roule + 4, 1], [-15, o.roule + 4, 1]], o.cuff || base);
      else if (o.cuff) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.cuff);
      if (o.lo) o.lo(p, back);
      hatch([[-14, -10], [-3, -10], [-3, Math.min(60, o.roule || 60)], [-14, Math.min(60, o.roule || 60)]], 0.9, 3.8, 0.22);
    } };
  }
  function torsoPts(w, hem, belly, tails) {
    belly = belly || 0;
    const back = tails ? [[-40 * w, tails, 1], [-26 * w, tails - 6], [-30 * w, hem + 10]] : [[-40 * w, hem + 2, 1]];
    return [[-14, -176], [8, -180], [16, -168], [26 * w, -150], [34 * w, -112], [36 * w + belly * 0.7, -70], [36 * w + belly, -30], [36 * w + belly * 0.6, 4], [38 * w, hem * 0.55], [40 * w, hem, 1], [0, hem + 2]]
      .concat(back, [[-38 * w, hem * 0.4], [-38 * w, -60], [-37 * w, -110], [-33 * w, -150], [-26, -168]]);
  }
  // fabrique : o = { seed, torso, coat, torsoPaint, sleeve, sleeveB, skin, skinD, cuff, roule, armW, thigh, thighB, shin, shinB, shinPaint, thighPaint,
  //   shoe, foot, head, headPaint, parts, backs / heads / fronts (ordre), objetBDevant (objet de la main arrière dessiné devant le torse) }
  function body(o) {
    const sd = o.seed, th = o.th || 1, fk = o.foot === 'boucle' ? 'soulier' : (o.foot || 'soulier');
    const legPaint = (back, lo) => () => { if (lo && o.shinPaint) o.shinPaint(back); if (!lo && o.thighPaint) o.thighPaint(back); hatch(back ? null : [[-26, -20], [-6, -20], [-6, 130], [-26, 130]], 0.8, 3.8, back ? 0.3 : 0.22); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: o.torso, base: o.coat, seed: sd, paint: o.torsoPaint },
      legB: { parent: 'torso', at: [-6, -2], pts: thighPts(th), base: o.thighB || o.thigh, seed: sd + 1, noRivet: true, paint: legPaint(true, false) },
      legB_lo: { parent: 'legB', at: [0, KNEE], pts: shinPts(), base: o.shinB || o.shin || o.thighB || o.thigh, seed: sd + 2, noRivet: true, paint: legPaint(true, true) },
      footB: { parent: 'legB_lo', at: [0, ANK], pts: FOOT[fk], base: o.shoeB || o.shoe, seed: sd + 3, noRivet: true, paint: footPaint(o.foot) },
      legF: { parent: 'torso', at: [6, -2], pts: thighPts(th), base: o.thigh, seed: sd + 4, paint: legPaint(false, false) },
      legF_lo: { parent: 'legF', at: [0, KNEE], pts: shinPts(), base: o.shin || o.thigh, seed: sd + 5, paint: legPaint(false, true) },
      footF: { parent: 'legF_lo', at: [0, ANK], pts: FOOT[fk], base: o.shoe, seed: sd + 6, noRivet: true, paint: footPaint(o.foot) },
      armB_up: { parent: 'torso', at: SH_B, pts: armR(LA, o.armW), base: o.sleeveB || o.sleeve, seed: sd + 7, paint: () => hatch(null, 0.8, 3.6, 0.3) },
      armB_lo: foreDef('armB_up', o.sleeveB || o.sleeve, o.skinD, true, sd + 8, o),
      head: { parent: 'torso', at: [6, -170], pts: o.head || X.NAP_HEAD, base: o.skin, seed: sd + 9, noRivet: true, paint: o.headPaint },
      armF_up: { parent: 'torso', at: SH_F, pts: armR(LA, o.armW), base: o.sleeve, seed: sd + 10, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26) },
      armF_lo: foreDef('armF_up', o.sleeve, o.skin, false, sd + 11, o),
    };
    Object.assign(parts, heldParts(o.skin, sd + 20), o.parts || {});
    const order = ['armB_up', 'armB_lo'].concat(o.objetBDevant ? [] : ['objetB'], ['legB', 'legB_lo', 'footB', 'legF', 'legF_lo', 'footF'], o.backs || [], ['chargeDos', 'head'], o.heads || [], ['torso'], o.fronts || [],
      o.objetBDevant ? ['objetB'] : [], ['charge', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'], o.tops || []);
    return { hipY: HIPY, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, parts, order };
  }
  function face(p, o) {
    const f = p.face || {};
    X.earPaint(o.ear ? o.ear[0] : -8, o.ear ? o.ear[1] : -44);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
    if (o.joue) dot(14, -32, o.joueR || 8, o.joue);
    X.eye(f, 17, -52, o.eyeSz || 1); X.brow(f, 17, o.browY || -60, o.browCol || 'rgba(45,30,22,0.95)', o.browW || 2.4);
    if (!o.sansBouche) X.mouth(f, 27, -27, o.lip);
  }

  // =====================================================================
  // POSES — aides communes
  // =====================================================================
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  const toTorso = (q, P_) => { const r = rot(P_, -(q.tilt || 0)); return [r[0] - (q.dx || 0), r[1] - (HIPY + (q.dy || 0))]; };
  const toWorld = (q, T) => rot([T[0] + (q.dx || 0), T[1] + HIPY + (q.dy || 0)], q.tilt || 0);
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const add = (q, n, v) => { q.ang[n] = (q.ang[n] || 0) + v; };
  function legTo(q, leg, Aw, k) {                                              // cheville sur Aw (repère des pieds), genou vers l'avant, pied à plat
    const H = toWorld(q, [leg === 'legF' ? 6 : -6, -2]), vx = Aw[0] - H[0], vy = Aw[1] - H[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(KNEE - ANK) + 1, KNEE + ANK - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((KNEE * KNEE + d * d - ANK * ANK) / (2 * KNEE * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) { const a = tv + sg * a1, E = [H[0] - KNEE * Math.sin(a), H[1] + KNEE * Math.cos(a)]; if (!best || E[0] > best.E[0]) best = { a, E }; }
    const sAbs = Math.atan2(-(Aw[0] - best.E[0]), Aw[1] - best.E[1]), tl = q.tilt || 0;
    blend(q, leg, normA(best.a - tl), k); blend(q, leg + '_lo', normA(sAbs - best.a), k); blend(q, leg === 'legF' ? 'footF' : 'footB', normA(-sAbs), k);
  }
  // gestes communs (valeurs 0..1) : marche, assis, leve, surpris
  function gestes(q) {
    const t = q.t || 0;
    if (q.marche) {                                                             // pas sur place (le plan déplace x) ; q.t obligatoire
      const k = clamp(q.marche), ph = t * (q.cadence || 6), sw = Math.sin(ph) * 0.3 * k;
      add(q, 'legF', -sw); add(q, 'legB', sw);
      add(q, 'legF_lo', Math.max(0, Math.sin(ph + 1.9)) * 0.45 * k); add(q, 'legB_lo', Math.max(0, -Math.sin(ph + 1.9)) * 0.45 * k);
      add(q, 'footF', -(-sw + Math.max(0, Math.sin(ph + 1.9)) * 0.45 * k) * 0.8); add(q, 'footB', -(sw + Math.max(0, -Math.sin(ph + 1.9)) * 0.45 * k) * 0.8);
      if (!q._brasPris) { add(q, 'armF_up', sw * 0.45); add(q, 'armB_up', -sw * 0.45); add(q, 'armF_lo', -0.15 * k); add(q, 'armB_lo', -0.15 * k); }
      q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    }
    if (q.assis) {                                                              // assis sur un siège de hauteur q.siege (local, défaut 100)
      const k = ease(clamp(q.assis)), h = q.siege == null ? 100 : q.siege;
      q.dy = (q.dy || 0) + (238 - h) * k; q.tilt = (q.tilt || 0) + 0.06 * k;
      const fw = q.pieds == null ? 84 : q.pieds;
      legTo(q, 'legF', [fw, -16], k); legTo(q, 'legB', [fw - 14, -16], k);
    }
    if (q.leve) {                                                               // poing levé (hourra)
      const k = ease(clamp(q.leve));
      blend(q, 'armF_up', -2.75, k); blend(q, 'armF_lo', -0.3, k); add(q, 'head', -0.12 * k); q._brasLeve = true;
    }
    if (q.surpris) { const k = ease(clamp(q.surpris)); add(q, 'head', -0.12 * k); q.tilt = (q.tilt || 0) - 0.04 * k; q.dy = (q.dy || 0) - 6 * k;
      blend(q, 'armF_up', -0.6, k); blend(q, 'armF_lo', -1.6, k); if (k > 0.3) q.handF = 'open';
      if (k > 0.3) { q.face.brow = q.face.brow || 'up'; q.face.eyes = q.face.eyes || 'wide'; q.face.mouth = q.face.mouth || 'o'; } }
  }
  // caisse portée à deux mains DEVANT soi (porter), puis lancée (lancer 0..1 : 0 devant le ventre, 0,45 au-dessus de la tête, 0,7 lâchée)
  const CK = [
    { u: 0, w: [84, -206], ang: 0, g1: [40, -50], g2: [-38, -40], tilt: 0 },
    { u: 0.45, w: [34, -548], ang: -0.12, g1: [52, -4], g2: [-48, -4], tilt: -0.07 },
    { u: 0.7, w: [170, -470], ang: 0.35, g1: [-70, -36], g2: [-72, -86], tilt: 0.1 },
  ];
  function caisseGestes(q) {
    if (!q.porter && q.lancer == null) return;
    const k = clamp(q.lancer || 0);
    let a = CK[0], b = CK[1];
    if (k > CK[1].u) { a = CK[1]; b = CK[2]; }
    const u = ease(clamp((Math.min(k, 0.7) - a.u) / (b.u - a.u)));
    const L = (A_, B_) => [lerp(A_[0], B_[0], u), lerp(A_[1], B_[1], u)];
    const after = smooth(0.7, 1, k);
    const w = L(a.w, b.w); w[0] += 30 * after; w[1] += 10 * after;
    q.tilt = (q.tilt || 0) + lerp(a.tilt, b.tilt, u) + 0.04 * after;
    if (k > 0.05 && k < 0.7) { add(q, 'legF', -0.12 * Math.sin(k / 0.7 * PI)); add(q, 'legB', 0.1 * Math.sin(k / 0.7 * PI)); }
    add(q, 'head', k < 0.45 ? -0.25 * Math.sin(k / 0.45 * PI / 2) : -0.25 * (1 - smooth(0.45, 0.8, k)));
    q._charge = { nom: 'caisse', o: q.porterO || {}, w, ang: lerp(a.ang, b.ang, u), g1: L(a.g1, b.g1), g2: L(a.g2, b.g2), cache: k > 0.7 };
    q._brasPris = true;
    if (k > 0.7) { q.handF = 'open'; q.handB = 'open'; }
  }
  // positions et grips → angles de bras ; objets droits ; seconde main
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (q._charge) {
      const ch = q._charge, ob = OBJ[ch.nom];
      ch.pos = toTorso(q, ch.w); ch.angT = ch.ang - tl;
      const gp = (g) => { const r = rot([g[0] - ob.base[0], g[1] - ob.base[1]], ch.angT); return [ch.pos[0] + r[0], ch.pos[1] + r[1]]; };
      const k = 1 - ease(clamp(ch.libre || 0));
      const g1 = ch.g1 || null, g2 = ch.g2 || null;
      const a0 = [A.armF_up || 0, A.armF_lo || 0, A.armB_up || 0, A.armB_lo || 0];
      const kf = k * (ch.kF == null ? 1 : ch.kF), kb = k * (ch.kB == null ? 1 : ch.kB);
      if (g1) { armTo(q, 'armF', gp(g1), ch.pick1 || 'bas', 1); A.armF_up = lerp(a0[0], A.armF_up, kf); A.armF_lo = lerp(a0[1], A.armF_lo, kf); }
      if (g2) { armTo(q, 'armB', gp(g2), ch.pick2 || 'bas', 1); A.armB_up = lerp(a0[2], A.armB_up, kb); A.armB_lo = lerp(a0[3], A.armB_lo, kb); }
      if (g2 && kb > 0.5 && !ch.cache) { q.handB = 'fist'; q._deux = true; }
      if (g1 && kf > 0.5 && !ch.cache) { q.handF = 'fist'; ch.tient = true; } else ch.tient = false;
    }
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = plat(q.tenuB) ? 'open' : 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    return q;
  }
  function run(def, q, x, y, s, o, nom) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ nom }, o || {}));
    const dir = (o && o.dir) || 1;
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB; r.charge = q._charge || null; r.dir = dir; r.s = s;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    if (q._charge && q._charge.nom === 'caisse') { const p0 = r.w('charge', q._charge.pos[0], q._charge.pos[1]); r.caisse = { x: p0[0], y: p0[1], rot: q._charge.angT + (q.tilt || 0), dir, s }; }
    return r;
  }
  // point nommé (écran) de l'objet tenu (main avant, ou main arrière si arriere) ou de la charge (caisse, sac)
  BTP.pt = function (r, nom, arriere) {
    if (r.charge && OBJ[r.charge.nom].pts[nom] && !arriere) {
      const ch = r.charge, ob = OBJ[ch.nom], q = ob.pts[nom], v = rot([q[0] - ob.base[0], q[1] - ob.base[1]], ch.angT);
      return r.w('charge', ch.pos[0] + v[0], ch.pos[1] + v[1]);
    }
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };
  function mkWrap(chName, own, sDef) {
    const pose = (p) => { const q = prep(p); if (own) own(q, 'avant'); gestes(q); caisseGestes(q); if (own) own(q, 'apres'); return finish(q); };
    const f = (p, x, y, s, o) => run(CH[chName], pose(p), x, y, s == null ? sDef : s, o, chName);
    f.pose = pose; f.def = () => CH[chName];
    return f;
  }

  // ---- déguisement commun : couverture drapée sur la tête et les épaules + foulard noué sur le bas du visage (yeux visibles)
  const CAPUCHE = [[36, -68], [30, -94], [10, -114], [-20, -114], [-46, -94], [-54, -60], [-56, -20], [-58, 20, 1], [-28, 24, 1], [-18, 6], [-14, -22], [-12, -50], [4, -68], [22, -74]];
  const FOULARD = [[39, -37], [36, -29], [33, -19], [28, -8], [18, 4], [2, 12], [-12, 10], [-17, -10], [-12, -30], [2, -36], [22, -38]];
  const DRAPE = [[-16, -180], [12, -184], [32, -162], [46, -122], [48, -92, 1], [18, -86], [-12, -82], [-48, -88, 1], [-48, -132], [-36, -170]];
  function deguiseParts(col, sd, foul) {
    const colD = M.mixc(col, '#1a1410', 0.3);
    return {
      capuche: { parent: 'head', at: [0, 0], noRivet: true, base: col, seed: sd, pts: (p) => (p.deguise ? CAPUCHE : OFFP),
        paint: () => { strokePts([[34, -70], [20, -78], [2, -70], [-12, -50], [-14, -20]], colD, 3); for (const y of [-96, -80]) strokePts([[-46, y + 4], [24, y - 6]], 'rgba(30,20,10,0.25)', 2.4); hatch(null, 0.6, 3.6, 0.3); } },
      foulard: { parent: 'head', at: [0, 0], noRivet: true, base: foul || '#2b2624', seed: sd + 1, pts: (p) => (p.deguise ? FOULARD : OFFP),
        paint: () => { strokePts([[38, -34], [14, -32], [-12, -26]], 'rgba(255,240,220,0.18)', 1.4); strokePts([[30, -16], [6, -8], [-12, -6]], 'rgba(0,0,0,0.35)', 1.2); hatch(null, 0.4, 3, 0.25); } },
      drape: { parent: 'torso', at: [0, 0], noRivet: true, base: col, seed: sd + 2, pts: (p) => (p.deguise ? DRAPE : OFFP),
        paint: () => { for (const y of [-120, -104]) strokePts([[-48, y], [48, y - 6]], colD, 3.2); for (let x = -46; x < 48; x += 6) strokePts([[x, -88 + (x > 18 ? -4 : 0)], [x - 1, -80 + (x > 18 ? -4 : 0)]], colD, 1.4); hatch(null, 0.8, 3.8, 0.28); } },
    };
  }

  // =====================================================================
  // 3) MARIONNETTES
  // =====================================================================
  // ---------------- NATHAN, le colon de Boston (héros) — catogan châtain-roux à ruban noir, favoris, redingote bleu canard à grands revers, gilet chamois
  const NA = { peau: '#e3bb98', peauD: '#c69c7a', chev: '#8a4f2c', chevL: '#a8673c', ruban: '#1c1714', red: '#2f5552', redD: '#244341', redL: '#3e6b67', gilet: '#c9a86a', giletD: '#a9894e',
    chem: '#ece5d4', culotte: '#5b4330', culotteD: '#4a3626', bas: '#e6dfcf', soulier: '#2a2220', couv: '#7b3a2c' };
  CH.btpNathan = body({
    seed: 9500, torso: torsoPts(0.94, 96, 0, 128), coat: NA.red, sleeve: NA.red, sleeveB: NA.redD, skin: NA.peau, skinD: NA.peauD, cuff: NA.redL,
    thigh: NA.culotte, thighB: NA.culotteD, shin: NA.bas, shoe: NA.soulier, foot: 'boucle', head: X.GR_HEAD,
    shinPaint: () => { fillPts(box(-20, -18, 20, 12), NA.culotte); fillPts(box(-17, 8, 17, 12), '#c9a24a'); },
    lo: (p, back) => fillPts([[-14, 66], [14, 66], [16, 80], [0, 76], [-14, 80]], NA.chem),
    torsoPaint: () => {
      fillPts([[10, -164], [26, -150], [34, -112], [38, -60], [38, 0], [22, 6], [14, -60]], NA.gilet);                 // gilet chamois
      for (const y of [-120, -96, -72, -48, -24]) dot(28 + (y + 120) * 0.05, y, 2.1, '#7a5f34');
      fillPts([[6, -184], [20, -172], [22, -150], [12, -142], [6, -160]], NA.chem);                                    // chemise et cravate
      fillPts([[12, -170], [22, -162], [20, -148], [12, -152]], '#f4efe2'); strokePts([[14, -166], [20, -150]], 'rgba(150,140,120,0.5)', 1);
      fillPts([[14, -178], [28, -156], [26, -120], [16, -104], [8, -140]], NA.redL);                                   // grand revers
      strokePts([[8, -140], [16, -104], [18, 96]], 'rgba(15,30,30,0.6)', 1.3);
      fillPts([[-6, 30], [28, 28], [30, 44], [-4, 46]], NA.redD); strokePts([[-6, 30], [28, 28]], 'rgba(200,190,160,0.4)', 1);   // poche à rabat
      for (const y of [-80, -40]) dot(20, y, 2.2, '#c9b78a');
      hatch([[-50, -170], [-12, -170], [-10, 128], [-50, 128]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.3);
    },
    headPaint: (p) => {
      fillPts([[30, -78], [26, -90], [10, -98], [-12, -99], [-28, -90], [-34, -72], [-33, -50], [-26, -38], [-18, -46], [-14, -60], [-4, -70], [12, -76], [24, -74]], NA.chev);
      strokePts([[22, -84], [4, -90], [-16, -88], [-28, -74]], NA.chevL, 1.4); strokePts([[18, -78], [-2, -82], [-22, -76]], 'rgba(60,30,15,0.4)', 1.1);
      face(p, { ear: [-8, -44], joue: 'rgba(205,110,90,0.22)' });
      fillPts([[-1, -62], [6, -60], [7, -40], [2, -34], [-3, -44]], NA.chev);                                          // favoris courts
    },
    parts: Object.assign({
      catogan: { parent: 'head', at: [0, 0], noRivet: true, base: NA.chev, seed: 9531, pts: (p) => (p.deguise ? OFFP : [[-28, -50], [-38, -46], [-42, -30], [-44, -6], [-40, 14, 1], [-34, 0], [-31, -26]]),
        paint: () => { strokePts([[-36, -40], [-40, -14], [-38, 8]], NA.chevL, 1.2); hatch(null, 1.2, 3, 0.25); } },
      ruban: { parent: 'head', at: [0, 0], noRivet: true, base: NA.ruban, seed: 9532, pts: (p) => (p.deguise ? OFFP : [[-30, -46], [-44, -54], [-46, -40], [-36, -40], [-48, -30], [-42, -22], [-32, -34], [-30, -30], [-40, -38]]) },
    }, deguiseParts(NA.couv, 9540, '#2b2624')),
    heads: ['capuche', 'foulard'], fronts: ['catogan', 'ruban', 'drape'],
  });
  BTP.nathan = mkWrap('btpNathan', (q, ph) => {
    if (ph !== 'apres') return;
    const A = q.ang;
    if (q.boire) {                                                              // tasse à la bouche, main autour de la tasse, menton levé
      const k = ease(clamp(q.boire)); if (!has(q.tenu)) q.tenu = 'tasse';
      add(q, 'head', -0.14 * k);
      armTo(q, 'armF', headPt(q, 46, -10), 'bas', k); q._brasPris = true;
      add(q, 'objet', -0.55 * k);
    }
    if (q.repousse) {                                                           // bras avant tendu bas, main ouverte, buste en retrait
      const k = ease(clamp(q.repousse));
      blend(q, 'armF_up', -0.62, k); blend(q, 'armF_lo', -0.16, k); blend(q, 'armB_up', -0.1, k); blend(q, 'armB_lo', -0.25, k);
      q.tilt = (q.tilt || 0) - 0.07 * k; add(q, 'head', -0.06 * k); add(q, 'legF', -0.08 * k);
      if (k > 0.3) { q.handF = 'open'; q.face.brow = q.face.brow || 'frown'; q.face.mouth = q.face.mouth || 'tight'; }
    }
    if (q.perplexe) {                                                           // main à la nuque, tête penchée
      const k = ease(clamp(q.perplexe));
      add(q, 'head', 0.08 * k); armTo(q, 'armF', headPt(q, -16, -88), 'avant', k);
      if (k > 0.4) { q.handF = 'open'; q.face.brow = q.face.brow || 'worry'; }
    }
    if (q.fier) {                                                               // buste bombé, menton levé, poing sur la hanche
      const k = ease(clamp(q.fier));
      q.tilt = (q.tilt || 0) - 0.045 * k; add(q, 'head', -0.2 * k); q.dy = (q.dy || 0) - 3 * k;
      armTo(q, 'armF', [12, -14], 'arriere', k); blend(q, 'armB_up', 0.08, k);
      if (k > 0.4) q.face.mouth = q.face.mouth || 'smile';
    }
    if (q.cadenas) {                                                            // accroupi, deux mains vers un point bas devant lui (q.cible, repère des pieds)
      const k = ease(clamp(q.cadenas)), T = q.cible || [116, -70];
      q.dy = (q.dy || 0) + 104 * k; q.dx = (q.dx || 0) - 10 * k; q.tilt = (q.tilt || 0) + 0.2 * k;
      legTo(q, 'legF', [34, -15], k); legTo(q, 'legB', [-2, -15], k);
      add(q, 'head', 0.3 * k);
      armTo(q, 'armF', toTorso(q, T), 'bas', k); armTo(q, 'armB', toTorso(q, [T[0] - 18, T[1] + 6]), 'bas', k); q._brasPris = true;
      if (k > 0.5) { q.handF = q.handF || 'fist'; q.handB = q.handB || 'fist'; }
    }
    if (q.deguise) q.hide = Object.assign({ catogan: 1, ruban: 1 }, q.hide);
    void A;
  }, 0.9);

  // ---------------- LE CONTREBANDIER — voûté, maigre, grand chapeau mou rabattu, longue cape bleu nuit, foulard ocre, barbe de trois jours, bottes ; sac de toile
  const CB = { peau: '#cfa784', peauD: '#b38b68', chap: '#5e5648', chapD: '#4a4338', cape: '#23304a', capeD: '#1a2438', capeL: '#2f3e5c', foul: '#a8783a', foulD: '#8a6230',
    chem: '#8f8676', culotte: '#4a4238', botte: '#2b2420', cheveux: '#3a3028' };
  const CB_HAT = [[-92, -66], [-74, -80], [-40, -86], [-34, -108], [-22, -126], [0, -132], [10, -122], [20, -130], [32, -116], [36, -92], [62, -88], [90, -78], [104, -60, 1], [86, -64], [60, -74], [30, -80], [-20, -80], [-56, -74], [-88, -54, 1]];
  CH.btpContre = body({
    seed: 9600, torso: [[-14, -176], [8, -180], [16, -168], [24, -150], [30, -112], [32, -60], [34, 0], [40, 70], [44, 150, 1], [0, 156], [-50, 158, 1], [-46, 80], [-42, 0], [-42, -60], [-46, -110], [-44, -150], [-30, -172]],
    coat: CB.cape, sleeve: CB.capeL, sleeveB: CB.capeD, skin: CB.peau, skinD: CB.peauD, cuff: CB.capeD, armW: 14, th: 0.88,
    thigh: CB.culotte, shin: CB.botte, shoe: CB.botte, foot: 'botte', head: X.AR_HEAD,
    shinPaint: () => { fillPts(box(-20, -18, 20, -6), CB.culotte); fillPts(box(-19, -8, 19, -2), '#3a3028'); strokePts([[-10, 10], [-8, 100]], 'rgba(255,230,190,0.12)', 1.6); },
    torsoPaint: () => {
      fillPts([[8, -168], [22, -150], [26, -112], [26, -40], [16, -40], [10, -120]], CB.chem);                         // chemise grise dans l'ouverture
      strokePts([[24, -150], [30, -60], [40, 70], [44, 150]], 'rgba(5,10,20,0.6)', 1.6);
      for (const x of [-34, -18, -2]) strokePts([[x, -120], [x * 1.25, 150]], 'rgba(5,10,25,0.35)', 1.2);              // plis de la cape
      hatch([[-56, -176], [-10, -176], [-8, 160], [-56, 160]], 0.75, 4, 0.34); shade(40, 0, -50, 0, 0.32);
    },
    headPaint: (p) => {
      fillPts([[-30, -84], [-12, -88], [-6, -80], [-14, -64], [-22, -50], [-34, -36], [-38, -60]], CB.cheveux);
      face(p, { ear: [-6, -44], browW: 3, browCol: 'rgba(40,30,22,0.95)', joue: 'rgba(150,90,70,0.15)' });
      fillPts([[2, -44], [14, -38], [12, -22], [0, -18], [-6, -32]], 'rgba(90,60,40,0.16)');
      for (let i = 0; i < 46; i++) dot(-10 + hash(i * 1.7) * 42, -30 + hash(i * 3.3) * 40, 0.9, 'rgba(40,30,25,0.55)');   // barbe de trois jours
    },
    parts: {
      foulardCou: { parent: 'torso', at: [0, 0], noRivet: true, base: CB.foul, seed: 9630, pts: [[-28, -178], [-6, -176], [10, -172], [20, -166], [24, -158], [32, -144], [26, -128, 1], [18, -146], [6, -156], [-22, -160], [-32, -168]],
        paint: () => { strokePts([[-26, -168], [18, -164]], CB.foulD, 2); dot(20, -158, 4, CB.foulD); hatch(null, 0.6, 3.4, 0.25); } },
      chapeau: { parent: 'head', at: [0, 0], noRivet: true, base: CB.chap, seed: 9631, pts: CB_HAT,
        paint: () => { fillPts([[-36, -88], [36, -92], [37, -84], [-38, -80]], CB.chapD); strokePts([[-2, -132], [4, -96]], 'rgba(30,25,20,0.5)', 1.6);
          strokePts([[-88, -60], [-40, -78], [30, -82], [100, -62]], 'rgba(255,240,210,0.14)', 1.6); hatch(null, 0.4, 3.4, 0.3); } },
    },
    heads: ['chapeau'], fronts: ['foulardCou'],
  });
  const SAC = {
    dos: { w: [10, -394], ang: 0.78, g2: [0, 8] },
    verse: { w: [126, -262], ang: 2.1, g1: [0, 8], g2: [0, 128] },
  };
  BTP.contrebandier = mkWrap('btpContre', (q, ph) => {
    if (ph === 'avant') { add(q, 'head', 0.1); q.tilt = (q.tilt || 0) + 0.025; return; }               // voûté
    const t = q.t || 0;
    if (q.rabat) {                                                              // main avant qui rabat le bord du chapeau
      const k = ease(clamp(q.rabat));
      add(q, 'head', 0.1 * k); add(q, 'chapeau', 0.1 * k);
      armTo(q, 'armF', headPt(q, 70, -66), 'bas', k); q._brasPris = true;
      if (k > 0.4) { q.handF = 'fist'; q.face.eyes = q.face.eyes || 'half'; }
    }
    if (q.seul) {                                                               // bras ballants, sac qui s'affaisse, tête basse
      const k = ease(clamp(q.seul));
      add(q, 'head', 0.22 * k); q.dy = (q.dy || 0) + 4 * k;
      blend(q, 'armF_up', 0.04, k); blend(q, 'armF_lo', -0.05, k);
      if (k > 0.4) { q.face.eyes = q.face.eyes || 'half'; q.face.brow = q.face.brow || 'worry'; }
    }
    if (q.sansSac) return;
    const kv = clamp(q.verse || 0), ks = ease(clamp(q.seul || 0)), plein = clamp(q.sac == null ? 1 : q.sac) * (1 - 0.85 * ks);
    const u = ease(kv), a = SAC.dos, b = SAC.verse;
    const w = [lerp(a.w[0], b.w[0], u), lerp(a.w[1], b.w[1], u) - 70 * Math.sin(u * PI)];
    w[0] -= 6 * ks; w[1] += 18 * ks;
    q._charge = { nom: 'sac', o: { plein, filet: q.filet == null ? smooth(0.85, 1, kv) : q.filet, filetY: q.filetY }, w, ang: lerp(a.ang, b.ang, u) + 0.12 * ks, dos: u < 0.35,
      g1: b.g1, g2: [lerp(a.g2[0], b.g2[0], u), lerp(a.g2[1], b.g2[1], u)], kF: smooth(0.35, 0.85, kv), kB: 1 - ks };
    if (kv > 0) { q._brasPris = true; add(q, 'head', 0.12 * u); q.tilt = (q.tilt || 0) + 0.05 * u; }
    void t;
  }, 0.9);

  // ---------------- LE LORD DE LONDRES — corpulent, perruque poudrée à deux rouleaux et toupet haut, bourse de soie noire, double menton,
  //                  habit de velours cramoisi brodé d'or vieilli, jabot ; toujours sa tasse (main avant) et sa soucoupe (paume arrière)
  const LO = { peau: '#efc0aa', peauD: '#d4a28c', habit: '#6b2232', habitD: '#561a28', brod: '#b8964a', gilet: '#c9a85a', giletD: '#a8893e', jabot: '#f2ede2',
    perr: '#e9e5dc', perrD: '#c9c4b8', bourse: '#1a1616', bas: '#ece6d8', soulier: '#1e1a1a' };
  const LORD_HEAD = [[-14, 18], [16, 18], [24, 8], [31, -2], [33, -11], [30, -19], [31, -25], [30, -30], [33, -34], [40, -40, 1], [34, -47], [30, -57], [30, -66], [26, -79], [14, -92], [-6, -97], [-26, -88], [-35, -68], [-34, -46], [-28, -24], [-22, -2]];
  CH.btpLord = body({
    seed: 9700, torso: torsoPts(1.12, 70, 30, 136), coat: LO.habit, sleeve: LO.habit, sleeveB: LO.habitD, skin: LO.peau, skinD: LO.peauD, armW: 17, th: 1.12,
    thigh: LO.habit, thighB: LO.habitD, shin: LO.bas, shoe: LO.soulier, foot: 'boucle', head: LORD_HEAD, objetBDevant: true,
    shinPaint: () => fillPts(box(-20, -18, 20, 10), LO.habit),
    lo: (p, back) => { fillPts(box(-18, 34, 18, 64), back ? '#4a1622' : LO.habitD); if (!SIL()) { strokePts([[-16, 38], [16, 38]], LO.brod, 2); strokePts([[-16, 60], [16, 60]], LO.brod, 2); }
      fillPts([[-16, 64], [16, 64], [19, 82], [8, 76], [0, 84], [-8, 76], [-17, 82]], '#f4f0e6'); },
    torsoPaint: () => {
      fillPts([[12, -160], [30, -146], [44, -110], [66, -60], [68, -20], [54, 12], [26, 20], [16, -40]], LO.gilet);     // gilet de brocart
      for (let i = 0; i < 14; i++) dot(30 + hash(i * 2.1) * 30, -130 + i * 10, 1.6, LO.giletD);
      for (const y of [-120, -96, -72, -48, -24, 0]) dot(26 + Math.max(0, (y + 100) * 0.32), y, 2.3, '#e6cf8a');
      strokePts([[16, -150], [20, -60], [20, 70]], LO.brod, 3.2); strokePts([[-32, 50], [-38, 136]], LO.brod, 2.4);    // broderies d'or
      for (let y = -140; y < 60; y += 22) { strokePts([[12, y], [6, y + 8], [12, y + 16]], LO.brod, 1.4); }
      fillPts([[-10, 34], [30, 30], [32, 50], [-8, 52]], LO.habitD); strokePts([[-10, 34], [30, 30]], LO.brod, 2);
      hatch([[-56, -170], [-12, -170], [-10, 136], [-56, 136]], 0.75, 4.2, 0.3); shade(66, -20, -40, 0, 0.34);
    },
    headPaint: (p) => {
      const fu = clamp(p.furieux || 0);
      face(p, { ear: [-10, -46], joue: `rgba(220,${Math.round(90 - 40 * fu)},${Math.round(90 - 40 * fu)},${0.38 + 0.3 * fu})`, joueR: 10, browCol: 'rgba(120,110,100,0.95)', browW: 2.8 });
      strokePts([[6, 8], [20, 10], [28, 2]], 'rgba(150,80,60,0.55)', 1.6); strokePts([[-4, -6], [10, -2], [24, -8]], 'rgba(150,80,60,0.35)', 1.2);   // double menton
      if (fu > 0) fillPts(LORD_HEAD, `rgba(200,40,30,${0.22 * fu})`);
    },
    parts: {
      jabot: { parent: 'torso', at: [0, 0], noRivet: true, base: LO.jabot, seed: 9730, pts: [[6, -182], [22, -176], [30, -160], [26, -150], [34, -140], [26, -128], [30, -118], [18, -112], [10, -140], [4, -164]],
        paint: () => { for (const y of [-160, -142, -126]) strokePts(ep(20, y, 10, 5, 6, 0, PI), 'rgba(150,140,120,0.55)', 1); } },
      perruque: { parent: 'head', at: [0, 0], noRivet: true, base: LO.perr, seed: 9731,
        pts: [[30, -80], [30, -96], [18, -112], [-4, -120], [-28, -114], [-44, -98], [-50, -76], [-50, -52], [-44, -32], [-32, -26], [-24, -36], [-20, -56], [-14, -74], [4, -84], [20, -86]],
        paint: () => {
          for (const y of [-72, -54, -36]) { fillPts(ell(-30, y, 18, 7.5, 12), '#f4f1ea'); strokePts(ep(-30, y, 18, 7.5, 10, 0, PI), 'rgba(110,105,96,0.6)', 1.2); }   // trois rouleaux
          strokePts([[24, -100], [4, -112], [-24, -108]], 'rgba(120,115,105,0.45)', 1.2); strokePts([[26, -92], [8, -100], [-16, -98]], 'rgba(120,115,105,0.35)', 1);
          hatch(null, 0.3, 3, 0.16);
        } },
      bourse: { parent: 'head', at: [0, 0], noRivet: true, base: LO.bourse, seed: 9732, pts: [[-40, -26], [-52, -22], [-56, -2], [-48, 10, 1], [-38, 4], [-36, -14]],
        paint: () => { strokePts([[-50, -16], [-44, 6]], 'rgba(255,255,255,0.15)', 1.4); } },
      noeud: { parent: 'head', at: [0, 0], noRivet: true, base: '#2a2424', seed: 9733, pts: [[-40, -30], [-54, -40], [-56, -26], [-44, -26], [-56, -14], [-48, -10], [-38, -22]] },
    },
    heads: ['perruque', 'bourse', 'noeud'], fronts: ['jabot'],
  });
  const LORD_TASSE = [64, -98], LORD_SOUC = [66, -64];
  const lordPose = mkWrap('btpLord', (q, ph) => {
    if (ph === 'avant') {
      if (q.tenu == null) q.tenu = 'tasse'; if (q.tenuB == null) q.tenuB = 'soucoupe';
      if (!q.face.mouth && !q.furieux && !q.ecrase) q.face.mouth = 'smile';
      if (!q.face.eyes && !q.furieux && !q.ecrase) q.face.eyes = 'half';
      add(q, 'head', -0.06);
      return;
    }
    const t = q.t || 0, fu = ease(clamp(q.furieux || 0)), ec = clamp(q.ecrase || 0), si = ease(clamp(q.siroter || 0));
    if (!q._brasPris) {
      if (q.tenuB === 'soucoupe') armTo(q, 'armB', LORD_SOUC, 'bas', 1);
      if (q.tenu === 'tasse') {
        const S0 = [LORD_SOUC[0] + 1, LORD_SOUC[1] - 28], M_ = headPt(q, 48, -14);
        armTo(q, 'armF', [lerp(S0[0], M_[0], si), lerp(S0[1], M_[1], si)], 'bas', 1);
        if (si > 0) { add(q, 'objet', -0.5 * si); add(q, 'head', -0.12 * si); q.face.eyes = 'closed'; }
      }
    }
    if (fu > 0) {                                                               // furieux : sourcils froncés, rouge, tasse qui tremble et éclabousse
      q.face.brow = q.face.brow || 'frown'; q.face.mouth = q.face.mouth || 'tight'; q.face.eyes = q.face.eyes || 'wide';
      add(q, 'head', 0.06 * fu); q.dy = (q.dy || 0) - 2 * fu * Math.abs(Math.sin(t * 30));
      armTo(q, 'armF', [LORD_TASSE[0] + 8, LORD_TASSE[1] - 30 + 4 * Math.sin(t * 37)], 'bas', fu);
      add(q, 'objet', 0.12 * fu * Math.sin(t * 41));
      q.tenuO = Object.assign({ eclabousse: fu }, q.tenuO);
    }
    if (ec > 0) {                                                               // écrasé sous les caisses : la tasse tenue à bout de bras au-dessus du tas
      const k = ease(smooth(0, 0.5, ec));
      q.dy = (q.dy || 0) + 56 * k; armTo(q, 'armF', [lerp(LORD_TASSE[0], 132, k), lerp(LORD_TASSE[1], -292, k)], 'bas', 1); q._brasPris = true;
      add(q, 'head', -0.1 * k); q.face.brow = q.face.brow || 'worry'; q.face.mouth = q.face.mouth || 'o'; q.face.eyes = q.face.eyes || 'wide';
      q.hide = Object.assign({ objetB: 1, doigtsB: 1 }, q.hide); q.tenuB = 'rien';
    }
  }, 0.8);
  // tas de caisses posé sur le lord (ecrase 0..1 : les caisses tombent l'une après l'autre)
  const TAS = [[-92, 0, 0.02], [86, 0, -0.03], [-62, -118, 0.05], [108, -116, -0.04], [-24, -226, 0.03], [-196, -228, -0.08]];
  BTP.lord = function (p, x, y, s, o) {
    s = s == null ? 0.8 : s; o = o || {};
    const r = lordPose(p, x, y, s, o), ec = clamp((p && p.ecrase) || 0), dir = o.dir || 1;
    if (ec > 0) TAS.forEach(([cx, cy, a], i) => {
      const u = smooth(i / TAS.length * 0.8, i / TAS.length * 0.8 + 0.3, ec); if (u <= 0) return;
      const yy = y + cy * s - (1 - easeInL(u)) * 520 * s;
      BTP.caisse(x + dir * cx * s, yy, s, { dir, rot: a * (u < 1 ? u : 1), cast: o.cast, pieces: 0 });
    });
    return r;
  };
  const easeInL = (u) => u * u;
  BTP.lord.pose = lordPose.pose; BTP.lord.def = lordPose.def;

  // ---------------- FIGURANTS COLONS (a femme, b homme au tricorne, c vieil homme à canne, d jeune homme) — option deguise (couvertures de couleurs différentes)
  const FG = {
    a: { peau: '#e8c2a2', peauD: '#cba383', robe: '#4f5f72', robeD: '#3f4d5e', tablier: '#ece5d4', bonnet: '#f3efe6', chev: '#6b4a32', couv: '#7e7b74' },
    b: { peau: '#dcb08c', peauD: '#bf916e', veste: '#a88a3a', vesteD: '#8a7030', chem: '#e2d9c4', culotte: '#5e5850', bas: '#cfc7b3', tricorne: '#4a3626', chev: '#5a4030', couv: '#b08443' },
    c: { peau: '#dcae90', peauD: '#bf9174', manteau: '#6f6e6a', manteauD: '#5a5956', bonnet: '#7a2e2a', chev: '#c6c2b8', culotte: '#4e4a44', bas: '#9a958a', couv: '#5b6b45' },
    d: { peau: '#ecc6a4', peauD: '#cfa684', gilet: '#6a2a34', giletD: '#56222a', chem: '#ece5d4', chemD: '#cfc6b0', culotte: '#3e3a36', bas: '#d8d0bc', chev: '#1e1a18', couv: '#466283' },
  };
  const SKIRT = [[-14, -176], [8, -180], [16, -168], [24, -150], [30, -112], [30, -60], [34, -20], [50, 80], [64, 200], [66, 222, 1], [-66, 222, 1], [-62, 190], [-48, 80], [-36, -20], [-34, -60], [-34, -110], [-30, -150], [-24, -168]];
  const shoePaint = (col) => () => fillPts(box(-20, -18, 20, 14), col);
  const colonDefs = {
    a: () => { const c = FG.a; return body({
      seed: 9800, torso: SKIRT, coat: c.robe, sleeve: c.robe, sleeveB: c.robeD, skin: c.peau, skinD: c.peauD, cuff: c.tablier, armW: 13.5, th: 0.86,
      thigh: c.robeD, shin: '#d8d0bc', shoe: '#3a2c22', head: X.GR_HEAD,
      torsoPaint: () => {
        fillPts([[8, -176], [22, -160], [24, -130], [-20, -128], [-24, -160]], '#efe8d8');                              // fichu
        fillPts([[14, -100], [30, -100], [36, -20], [54, 90], [62, 214], [24, 214], [16, 80], [10, -20]], c.tablier);   // tablier
        strokePts([[-34, -96], [30, -98]], c.robeD, 3);
        for (const x of [-40, -20, 0]) strokePts([[x * 0.6, -20], [x * 1.4, 214]], 'rgba(20,30,40,0.3)', 1.1);
        hatch([[-70, -170], [-12, -170], [-10, 222], [-70, 222]], 0.75, 4.2, 0.3); shade(50, 0, -60, 0, 0.28);
      },
      headPaint: (p) => { fillPts([[-30, -78], [-10, -84], [-4, -70], [-16, -58], [-26, -46], [-34, -58]], c.chev); face(p, { joue: 'rgba(220,120,100,0.26)' }); },
      parts: Object.assign({
        bonnet: { parent: 'head', at: [0, 0], noRivet: true, base: c.bonnet, seed: 9830, pts: (p) => (p.deguise ? OFFP : [[30, -72], [34, -86], [24, -104], [0, -114], [-26, -110], [-44, -94], [-48, -70], [-42, -48], [-30, -50], [-22, -66], [-6, -76], [14, -78]]),
          paint: () => { strokePts([[32, -74], [10, -82], [-16, -76], [-34, -58]], 'rgba(150,140,120,0.6)', 1.4); for (let i = 0; i < 7; i++) strokePts([[30 - i * 9, -76 + i * 2], [32 - i * 9, -70 + i * 2]], 'rgba(150,140,120,0.5)', 1); hatch(null, 0.5, 3.4, 0.14); } },
      }, deguiseParts(c.couv, 9840, '#33302c')),
      heads: ['bonnet', 'capuche', 'foulard'], fronts: ['drape'] }); },
    b: () => { const c = FG.b; return body({
      seed: 9850, torso: torsoPts(1.0, 76, 6), coat: c.veste, sleeve: c.veste, sleeveB: c.vesteD, skin: c.peau, skinD: c.peauD, cuff: c.vesteD,
      thigh: c.culotte, shin: c.bas, shoe: '#2e2620', foot: 'boucle', head: X.NAP_HEAD,
      shinPaint: shoePaint(c.culotte),
      torsoPaint: () => {
        fillPts([[4, -184], [18, -172], [20, -150], [8, -146]], c.chem); strokePts([[20, -150], [28, -40], [34, 76]], 'rgba(40,30,10,0.6)', 1.3);
        for (const y of [-120, -90, -60, -30, 0]) dot(28, y, 2.4, '#5a4520');
        hatch([[-50, -170], [-12, -170], [-10, 78], [-50, 78]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.3);
      },
      headPaint: (p) => { fillPts([[-30, -74], [-14, -78], [-10, -64], [-20, -50], [-32, -40], [-36, -58]], c.chev); face(p, { joue: 'rgba(200,100,80,0.2)' });
        fillPts([[16, -30], [32, -32], [30, -28], [16, -26]], 'rgba(70,45,30,0.6)'); },
      parts: Object.assign({
        tricorne: { parent: 'head', at: [0, 0], noRivet: true, base: c.tricorne, seed: 9880, pts: (p) => (p.deguise ? OFFP : [[-54, -80, 1], [-38, -102], [-14, -114], [14, -112], [36, -100], [54, -82, 1], [30, -90], [0, -94], [-30, -90]]),
          paint: () => { strokePts([[-30, -90], [0, -94], [30, -90]], 'rgba(255,240,210,0.14)', 1.4); hatch(null, -0.3, 3.4, 0.3); } },
      }, deguiseParts(c.couv, 9890, '#2a2c30')),
      heads: ['tricorne', 'capuche', 'foulard'], fronts: ['drape'] }); },
    c: () => { const c = FG.c; return body({
      seed: 9900, torso: torsoPts(0.96, 118, 4, 124), coat: c.manteau, sleeve: c.manteau, sleeveB: c.manteauD, skin: c.peau, skinD: c.peauD, cuff: c.manteauD,
      thigh: c.culotte, shin: c.bas, shoe: '#2a2420', head: X.AR_HEAD,
      shinPaint: shoePaint(c.culotte),
      torsoPaint: () => {
        fillPts([[6, -184], [18, -172], [16, -150], [6, -156]], '#d8d0bc'); strokePts([[18, -150], [26, 20], [36, 118]], 'rgba(30,30,30,0.6)', 1.3);
        for (const y of [-110, -70, -30]) dot(24, y, 2.6, '#3a3834');
        hatch([[-50, -170], [-12, -170], [-10, 124], [-50, 124]], 0.75, 4.2, 0.32); shade(40, 0, -40, 0, 0.3);
      },
      headPaint: (p) => { fillPts([[-30, -70], [-14, -72], [-12, -58], [-20, -44], [-34, -36], [-38, -54]], c.chev); face(p, { ear: [-6, -44], browCol: 'rgba(170,165,155,0.95)', browW: 3.2 });
        strokePts([[4, -58], [12, -60]], 'rgba(120,80,60,0.4)', 1); strokePts([[6, -40], [14, -30]], 'rgba(120,80,60,0.35)', 1); strokePts([[24, -24], [18, -12]], 'rgba(120,80,60,0.35)', 1); },
      parts: Object.assign({
        bonnet: { parent: 'head', at: [0, 0], noRivet: true, base: c.bonnet, seed: 9930, pts: (p) => (p.deguise ? OFFP : [[26, -70], [28, -86], [16, -100], [-6, -108], [-28, -102], [-40, -86], [-40, -66], [-32, -60], [-10, -68], [10, -70]]),
          paint: () => { fillPts([[-40, -74], [28, -80], [28, -68], [-38, -62]], '#64241f'); for (let x = -36; x < 26; x += 5) strokePts([[x, -76 + x * 0.05], [x, -64]], 'rgba(30,10,10,0.4)', 1); hatch(null, 0.5, 3, 0.24); } },
      }, deguiseParts(c.couv, 9940, '#2c2a26')),
      heads: ['bonnet', 'capuche', 'foulard'], fronts: ['drape'] }); },
    d: () => { const c = FG.d; return body({
      seed: 9950, torso: torsoPts(0.92, 36, 0), coat: c.gilet, sleeve: c.chem, sleeveB: c.chemD, skin: c.peau, skinD: c.peauD, cuff: c.chemD, armW: 15, roule: 50,
      thigh: c.culotte, shin: c.bas, shoe: '#2a2220', foot: 'boucle', head: X.GR_HEAD,
      shinPaint: shoePaint(c.culotte),
      torsoPaint: () => {
        fillPts([[-44, -150], [-24, -176], [4, -184], [18, -170], [14, -150], [-4, -160], [-30, -150]], c.chem);           // épaules de chemise
        fillPts([[6, -184], [18, -172], [16, -154], [6, -160]], '#f4efe2');
        strokePts([[16, -150], [24, -40], [30, 36]], 'rgba(30,10,10,0.6)', 1.3); for (const y of [-120, -90, -60, -30, 0]) dot(24 + (y + 120) * 0.02, y, 2.2, '#c9a870');
        fillPts(box(-38, 26, 36, 38), c.culotte);
        hatch([[-50, -170], [-12, -170], [-10, 40], [-50, 40]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.3);
      },
      headPaint: (p) => { fillPts([[30, -80], [26, -90], [8, -98], [-14, -98], [-30, -88], [-34, -70], [-32, -50], [-26, -40], [-18, -48], [-14, -62], [-2, -72], [12, -78], [24, -76]], c.chev);
        face(p, { joue: 'rgba(220,120,100,0.26)' }); },
      parts: Object.assign({
        catogan: { parent: 'head', at: [0, 0], noRivet: true, base: c.chev, seed: 9980, pts: (p) => (p.deguise ? OFFP : [[-28, -50], [-36, -46], [-40, -26], [-40, 4, 1], [-34, -6], [-30, -28]]) },
        ruban: { parent: 'head', at: [0, 0], noRivet: true, base: '#4a1a20', seed: 9981, pts: (p) => (p.deguise ? OFFP : [[-30, -46], [-42, -52], [-44, -40], [-34, -40], [-42, -30], [-38, -26], [-30, -34]]) },
      }, deguiseParts(c.couv, 9990, '#2e2a28')),
      heads: ['capuche', 'foulard'], fronts: ['catogan', 'ruban', 'drape'] }); },
  };
  const colonWraps = {};
  for (const m of ['a', 'b', 'c', 'd']) {
    CH['btpColon' + m.toUpperCase()] = colonDefs[m]();
    colonWraps[m] = mkWrap('btpColon' + m.toUpperCase(), (q, ph) => {
      if (m === 'c' && ph === 'avant') {                                       // vieil homme : un peu voûté, canne plantée devant lui
        add(q, 'head', 0.08); q.tilt = (q.tilt || 0) + 0.03;
        if (q.tenu == null && !q.porter && q.lancer == null && !q.leve) q.tenu = 'canne';
      }
      if (m === 'c' && ph === 'apres' && q.tenu === 'canne' && !q._brasPris && !q._brasLeve) armTo(q, 'armF', [48, 6], 'bas', 1);
    }, m === 'd' ? 0.84 : m === 'c' ? 0.8 : 0.82);
  }
  BTP.colon = (p, x, y, s, o) => colonWraps[(p && p.modele) || 'a'](p, x, y, s, o);
  BTP.colon.pose = (p) => colonWraps[(p && p.modele) || 'a'].pose(p);
  BTP.colon.def = (p) => CH['btpColon' + ((p && p.modele) || 'a').toUpperCase()];

  // =====================================================================
  // 4) DÉCORS — le port de Boston (jour / nuit / aube), le navire marchand, les fonds de Londres
  // =====================================================================
  const ST = M.ST, NUITC = '18,26,58';
  const VILLE_Y = 1188, NAV = { x: 720, y: 1322, s: 1 };
  BTP.NAVIRE = { long: 700, pont: -132, pavois: -166, pts: { pont: [0, -132], pontAvant: [200, -132], pontArriere: [-170, -132], ecoutille: [55, -190], proue: [420, -218], poupe: [-330, -214] } };
  BTP.TABLE = { x: 340, dessus: 1315, banc: 1357 };
  function tint(cv, a, col) {
    const o = M.pre(cv.width, cv.height, (x) => { x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(${col || NUITC},${a})`; x.fillRect(0, 0, cv.width, cv.height); });
    o.padB = cv.padB; return o;
  }
  const dn = (cv, a, sh) => { cv.padB = cv.padB || 0; const n = tint(cv, a == null ? 0.6 : a); if (sh !== false) { M.withShadow(cv, 8); M.withShadow(n, 8); } return { j: cv, n }; };
  function flatDN(o2, x, y, d, op) { M.flat(o2.j, x, y, op || {}); if (d > 0.01) M.flat(o2.n, x, y, Object.assign({}, op || {}, { alpha: d, cast: null })); }
  // ---- ciels
  function sky(kind) {
    return M.pre(W, ST.back + 5, (x) => {
      const g = x.createLinearGradient(0, 0, 0, ST.back);
      const st = { jour: [['#93aabb', 0], ['#bccbcf', 0.55], ['#e6e1cf', 1]], nuit: [['#0f1730', 0], ['#1b2747', 0.6], ['#2f3d5e', 1]], aube: [['#33406a', 0], ['#8e6f86', 0.45], ['#e0a07a', 0.8], ['#f0c48e', 1]] }[kind];
      for (const [c, s] of st) g.addColorStop(s, c);
      x.fillStyle = g; x.fillRect(0, 0, W, ST.back + 5);
      for (let y = 160; y < ST.back; y += 9) { x.fillStyle = `rgba(${M.P.encre},0.035)`; x.fillRect(0, y, W, 1); }
      if (M.tex && M.tex.canvasPat) { x.globalAlpha = 0.22; x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, W, ST.back + 5); }
    });
  }
  // ---- ville sur sa colline (origine = bas-centre, y = VILLE_Y à l'écran)
  const VILLE = { chem: [], fen: [] };
  function drawVille() {
    VILLE.chem.length = 0; VILLE.fen.length = 0;
    const hill = (x) => -170 - 100 * Math.exp(-(((x + 120) / 330) ** 2)) + 30 * Math.sin(x * 0.006);
    const hp = [[-560, 30, 1]]; for (let x = -560; x <= 560; x += 40) hp.push([x, hill(x)]); hp.push([560, 30, 1]);
    pc(hp, '#8d957f', () => { hatch(null, 0.3, 5, 0.12, 1, undefined, [-560, -360, 560, 30]); }, 9401, { drop: false });
    const R = M.rng(1773), brique = ['#8f5a48', '#7f4d3e', '#9a6a52', '#a08466', '#86604e'], toitC = ['#5b5550', '#6a4a3c', '#4f4a48'];
    const house = (x, yb, w, h, fade, chimney, steepY) => {
      const col = M.mixc(brique[Math.floor(R() * brique.length)], '#b9bcb4', fade), roof = M.mixc(toitC[Math.floor(R() * toitC.length)], '#b9bcb4', fade * 0.8);
      const rh = w * 0.55;
      pc(box(x - w / 2, yb - h, x + w / 2, yb + 2), col, () => {
        for (let r = 0; r < 2; r++) for (let cI = 0; cI < Math.max(1, Math.floor(w / 22)); cI++) {
          const fx = x - w / 2 + 8 + cI * 22, fy = yb - h + 12 + r * Math.max(20, h * 0.42);
          if (fy + 12 > yb - 4) continue;
          fillPts(box(fx, fy, fx + 8, fy + 12), 'rgba(40,36,40,0.55)'); VILLE.fen.push([fx, fy, 8, 12]);
        }
        hatch(null, 0.9, 4.6, 0.12);
      }, 9410 + Math.floor(x), { drop: false });
      pc([[x - w / 2 - 4, yb - h + 1, 1], [x, yb - h - rh, 1], [x + w / 2 + 4, yb - h + 1, 1]], roof, null, 9420 + Math.floor(x), { drop: false });
      if (chimney) { const cx = x + w * 0.22; pc(box(cx - 5, yb - h - rh * 0.8, cx + 5, yb - h - rh * 0.2), M.mixc('#6a4a3c', '#b9bcb4', fade), null, 9430 + Math.floor(x), { drop: false }); VILLE.chem.push([cx, yb - h - rh * 0.8]); }
      void steepY;
    };
    for (let x = -520; x < 540; x += 46 + Math.floor(R() * 18)) { const yb = hill(x) + 26; house(x, yb, 34 + R() * 18, 34 + R() * 26, 0.42, R() < 0.35); }
    for (let x = -500; x < 540; x += 56 + Math.floor(R() * 20)) { const yb = hill(x) + 90 + R() * 30; house(x, yb, 40 + R() * 22, 46 + R() * 34, 0.25, R() < 0.45); }
    // dôme du State House (gauche) et clocher blanc d'Old North (centre)
    const sx = -150, sy = hill(sx) + 70;
    pc(box(sx - 60, sy - 96, sx + 60, sy + 4), '#9a6a52', () => { for (let i = 0; i < 5; i++) { fillPts(box(sx - 50 + i * 22, sy - 80, sx - 42 + i * 22, sy - 62), 'rgba(40,36,40,0.5)'); VILLE.fen.push([sx - 50 + i * 22, sy - 80, 8, 18]); } hatch(null, 0.9, 4.6, 0.12); }, 9450, { drop: false });
    pc([[sx - 66, sy - 94, 1], [sx, sy - 128, 1], [sx + 66, sy - 94, 1]], '#5b5550', null, 9451, { drop: false });
    pc(box(sx - 14, sy - 150, sx + 14, sy - 120), '#e6e0d2', null, 9452, { drop: false });
    pc(ep(sx, sy - 150, 18, 20, 10, PI, TAU).concat([[sx + 18, sy - 148], [sx - 18, sy - 148]]), '#cdb98a', () => strokePts(ep(sx, sy - 150, 12, 14, 6, PI * 1.1, PI * 1.5), 'rgba(255,250,220,0.7)', 1.4), 9453, { drop: false });
    pc(box(sx - 3, sy - 184, sx + 3, sy - 168), '#cdb98a', null, 9454, { drop: false });
    const ox = 60, oy = hill(ox) + 120;
    pc(box(ox - 22, oy - 300, ox + 22, oy + 4), '#ebe6da', () => { fillPts(box(ox - 8, oy - 270, ox + 8, oy - 240), 'rgba(50,46,50,0.55)'); fillPts(box(ox - 7, oy - 180, ox + 7, oy - 156), 'rgba(50,46,50,0.4)'); hatch(null, 0.9, 4.4, 0.1); }, 9460, { drop: false });
    pc(box(ox - 16, oy - 360, ox + 16, oy - 298), '#ebe6da', () => fillPts(box(ox - 6, oy - 348, ox + 6, oy - 316), 'rgba(50,46,50,0.5)'), 9461, { drop: false });
    pc(box(ox - 11, oy - 400, ox + 11, oy - 358), '#ebe6da', null, 9462, { drop: false });
    pc([[ox - 9, oy - 398, 1], [ox, oy - 520, 1], [ox + 9, oy - 398, 1]], '#e2dccd', null, 9463, { drop: false });
    // entrepôts du front de mer
    for (const [x0, x1, h] of [[-520, -300, 86], [-290, -60, 70], [200, 520, 92]]) {
      pc(box(x0, -h, x1, 6), '#7a4c3c', () => { for (let x = x0 + 20; x < x1 - 20; x += 46) { fillPts(box(x, -h + 16, x + 14, -h + 34), 'rgba(40,36,40,0.55)'); VILLE.fen.push([x, -h + 16, 14, 18]); fillPts(box(x + 4, -30, x + 26, 6), 'rgba(40,30,25,0.5)'); } hatch(null, 0.9, 4.6, 0.14); }, 9470 + x0, { drop: false });
      pc([[x0 - 6, -h + 1, 1], [x0 + 30, -h - 24, 1], [x1 - 30, -h - 24, 1], [x1 + 6, -h + 1, 1]], '#55504c', null, 9480 + x0, { drop: false });
    }
  }
  // ---- bandes d'eau (largeur W + 260 ; origine bas-centre)
  const EAU = [{ top: 1162, h: 130, col: ['#8aa2a6', '#6f8c94'] }, { top: 1232, h: 140, col: ['#64818b', '#4e6d79'] }, { top: 1306, h: 110, col: ['#456574', '#36525f'] }];
  function drawEau(i) {
    const e = EAU[i], w = W + 260, pts = [[-w / 2, e.h, 1]];
    for (let x = -w / 2; x <= w / 2; x += 30) pts.push([x, -e.h + 12 + 7 * Math.sin(x * 0.035 + i * 2) + 4 * Math.sin(x * 0.09 + i)]);
    pts.push([w / 2, 16, 1]); pts[0] = [-w / 2, 16, 1];
    pc(pts, e.col[0], () => {
      const c = cx_(), g = c.createLinearGradient(0, -e.h, 0, 0); g.addColorStop(0, e.col[0]); g.addColorStop(1, e.col[1]); c.fillStyle = g; c.fillRect(-w / 2, -e.h - 20, w, e.h + 30);
      for (let k = 0; k < 9; k++) { const y = -e.h + 26 + k * (e.h - 30) / 9, x0 = -w / 2 + ((k * 137) % 200); for (let x = x0; x < w / 2; x += 120 + (k % 3) * 30) strokePts([[x, y], [x + 34, y - 2], [x + 60, y]], 'rgba(235,240,235,0.25)', 1.3); }
      hatch(null, 0.05, 6, 0.08);
    }, 9490 + i, { drop: false });
  }
  // ---- navire marchand (origine = milieu de la ligne de flottaison ; proue vers +x) ; couche 'devant' = pavois seul (à redessiner devant les colons du pont)
  function drawNavire(devant) {
    const pav = BTP.NAVIRE.pavois, pont = BTP.NAVIRE.pont;
    const pavois = () => pc([[-200, pav, 1], [270, pav - 6], [300, pav - 10, 1], [296, pont + 6, 1], [-200, pont + 6, 1]], '#6a4a30', () => {
      strokePts([[-200, pav + 4], [296, pav - 6]], '#a8783a', 3); for (let x = -180; x < 290; x += 34) strokePts([[x, pav + 6], [x, pont + 4]], 'rgba(30,18,8,0.45)', 1.2); hatch(null, 0.1, 4, 0.18);
    }, 9512);
    if (devant) { pavois(); return; }
    const mats = [[-190, 400], [10, 560], [184, 470]];
    // gréement d'abord (derrière les voiles roulées)
    const lin = (a, b, w) => strokePts([a, b], 'rgba(35,26,20,0.75)', w || 1.1);
    for (const [mx, h] of mats) { const top = pont - h; for (const dxs of [-60, -30, 30, 60]) lin([mx, top + 20], [mx + dxs * 1.2, pav]); }
    lin([-190, pont - 400], [10, pont - 520]); lin([10, pont - 540], [184, pont - 440]); lin([184, pont - 450], [380, -196]); lin([-190, pont - 380], [-326, -214]);
    for (const [mx, h] of mats) {
      const top = pont - h;
      pc([[mx - 6, pont, 1], [mx + 6, pont, 1], [mx + 3, top, 1], [mx - 3, top, 1]], '#5a3e28', () => strokePts([[mx - 2, pont], [mx - 1, top]], 'rgba(255,225,180,0.25)', 1.2), 9500 + mx);
      for (const [f, L] of [[0.3, 1], [0.58, 0.82], [0.82, 0.6]]) {
        const y = pont - h * f, l = 120 * L * (h / 520);
        pc(box(mx - l, y - 3, mx + l, y + 3), '#5a3e28', null, 9505 + mx + f * 10, { drop: false });
        const fe = [[mx - l + 4, y + 2]]; for (let k2 = 0; k2 <= 8; k2++) { const xx = lerp(mx - l + 8, mx + l - 8, k2 / 8); fe.push([xx, y + 9 + (k2 % 2 ? 4 : 0)]); } fe.push([mx + l - 4, y + 2]);
        pc(fe, '#d9cfb2', () => { for (let k2 = 1; k2 < 8; k2 += 2) { const xx = lerp(mx - l + 8, mx + l - 8, k2 / 8); strokePts([[xx, y], [xx, y + 13]], 'rgba(90,70,45,0.6)', 1.2); } }, 9507 + mx + f * 10, { drop: false });
      }
    }
    // coque : brune, préceinte ocre, château arrière, beaupré
    pc([[300, -168], [420, -220], [424, -214], [306, -158]], '#5a3e28', null, 9508);
    pc([[-336, -214, 1], [-210, -206], [-200, -170], [-60, -152], [120, -150], [272, -160], [302, -172, 1], [296, -128], [270, -60], [226, 10], [140, 24], [-260, 26], [-300, -20], [-322, -90]], '#5c4029', () => {
      fillPts([[-330, -118], [300, -114], [298, -98], [-326, -102]], '#a8783a');                                       // préceinte ocre
      fillPts([[-330, -60], [290, -56], [270, 30], [-300, 30]], '#3e2c1e');                                            // œuvres vives
      for (let y = -150; y < 20; y += 13) strokePts([[-320, y], [296, y + 4]], 'rgba(20,12,6,0.35)', 1);
      for (const x of [-312, -290, -268]) fillPts(box(x, -196, x + 14, -176), '#2a1e14');                                // fenêtres de poupe
      hatch(null, 0.15, 4.4, 0.2); shade(300, 0, -330, 0, 0.25, [-340, -230, 430, 30]);
    }, 9509);
    // écoutille (hiloire) : la trappe est dessinée à part (trappe 0..1)
    pc(box(10, -190, 100, pont + 4), '#4e3622', () => { strokePts([[10, -186], [100, -186]], 'rgba(255,225,180,0.25)', 1.4); }, 9510);
    pavois();
    pc(box(-336, -232, -200, -206), '#6a4a30', () => strokePts([[-336, -226], [-200, -224]], '#a8783a', 2.4), 9511);   // rambarde de poupe
  }
  // ---- coulisses, grue, lanterne, table, enseigne
  function drawTaverne() {                                                 // origine bas-centre, 300 × 900
    pc([[-150, 0, 1], [-150, -720, 1], [-20, -860, 1], [150, -730, 1], [150, 0, 1]], '#8a5a44', () => {
      for (let y = -700; y < 0; y += 14) for (let x = -150 + ((y / 14) % 2 ? 0 : 14); x < 150; x += 28) strokePts([[x, y], [x, y + 14]], 'rgba(60,30,20,0.25)', 1);
      for (let y = -700; y < 0; y += 14) strokePts([[-150, y], [150, y]], 'rgba(60,30,20,0.3)', 1);
      for (const x of [-150, -2, 148]) fillPts(box(x - 6, -730, x + 6, 0), '#4a3424');                                 // colombages
      fillPts(box(-150, -440, 150, -426), '#4a3424');
      fillPts(box(30, -250, 120, 0), '#3a2a1e'); fillPts(box(36, -244, 114, -4), '#5a3e28'); dot(100, -120, 4, '#c9a24a');   // porte
      fillPts(box(-120, -330, -30, -230), '#2a2430'); fillPts(box(-116, -326, -34, -234), '#55606a');                    // fenêtre basse
      strokePts([[-75, -326], [-75, -234]], '#3a2a1e', 2.4); strokePts([[-116, -280], [-34, -280]], '#3a2a1e', 2.4);
      fillPts(box(-100, -640, -20, -540), '#2a2430'); fillPts(box(-96, -636, -24, -544), '#55606a'); strokePts([[-60, -636], [-60, -544]], '#3a2a1e', 2);   // fenêtre haute
      for (let i = 0; i < 9; i++) strokePts([[-146, -200 + i * 10], [-60, -120 + i * 8]], 'rgba(120,110,90,0.7)', 1);    // filets de pêche
      for (let i = 0; i < 9; i++) strokePts([[-146 + i * 10, -200], [-130 + i * 8, -110]], 'rgba(120,110,90,0.7)', 1);
      hatch(null, 0.8, 4.4, 0.2); shade(150, 0, -150, 0, 0.3, [-160, -880, 160, 10]);
    }, 9550);
    pc([[-160, -716, 1], [-20, -872, 1], [160, -726, 1], [150, -706, 1], [-20, -848, 1], [-150, -700, 1]], '#3e2c22', null, 9551);
    pc([[150, -520, 1], [262, -520, 1], [262, -512, 1], [150, -512, 1]], '#2e2a26', null, 9552);                        // potence de l'enseigne
    pc([[-110, 0, 1], [-110, -110], [-60, -118], [-10, -110], [-10, 0, 1]], '#7a5a3a', () => { for (const y of [-90, -40]) strokePts([[-110, y], [-10, y]], '#3a3028', 3); hatch(null, 0.2, 4, 0.2); }, 9553);   // tonneau
  }
  function drawEnseigne() {                                                // origine = milieu du haut du panneau, 120 × 96
    pc(rrect(-60, 8, 60, 100, 12), '#5a3e28', () => {
      fillPts(rrect(-52, 16, 52, 92, 9), '#2f3e3a');
      pc([[-22, 78], [-30, 60], [-26, 44], [-12, 36], [12, 36], [26, 44], [30, 60], [22, 78]], '#d7c08c', null, 9561, { drop: false });   // théière peinte
      fillPts([[28, 50], [46, 38], [48, 42], [32, 60]], '#d7c08c'); strokePts(ep(-34, 58, 10, 12, 8, PI * 0.5, PI * 1.5), '#d7c08c', 4);
      fillPts([[-6, 36], [6, 36], [4, 28], [-4, 28]], '#d7c08c'); fillPts(box(-26, 78, 26, 82), '#c9b07a');
      hatch(null, 0.3, 4, 0.15);
    }, 9560);
    for (const x of [-40, 40]) strokePts([[x, 10], [x * 0.9, -4]], '#2a2622', 2);
  }
  function drawBallots() {                                                 // coulisse droite : ballots et tonneaux, origine bas-centre, 300 × 560
    const bal = (x, y, w, h, s) => pc(rrect(x - w / 2, y - h, x + w / 2, y, 14), '#d2c9b2', () => { for (const k of [0.3, 0.7]) strokePts([[x - w / 2 + w * k, y - h], [x - w / 2 + w * k + 4, y]], '#6b5a40', 3); strokePts([[x - w / 2, y - h * 0.5], [x + w / 2, y - h * 0.5 - 4]], '#6b5a40', 2.4); hatch(null, 0.6, 4, 0.22); shade(x + w / 2, 0, x - w / 2, 0, 0.25, [x - w / 2, y - h, x + w / 2, y]); }, s);
    const ton = (x, y, s) => pc([[x - 44, y, 1], [x - 50, y - 60], [x - 44, y - 120, 1], [x + 44, y - 120, 1], [x + 50, y - 60], [x + 44, y, 1]], '#7a5a3a', () => { for (const yy of [y - 100, y - 20]) strokePts([[x - 48, yy], [x + 48, yy]], '#3a3028', 4); for (let k = -30; k <= 30; k += 15) strokePts([[x + k, y - 118], [x + k * 1.1, y - 2]], 'rgba(30,20,10,0.35)', 1); hatch(null, 0.2, 4, 0.2); }, s);
    bal(-40, 0, 170, 120, 9570); bal(60, -120, 150, 110, 9571); bal(-70, -120, 130, 104, 9572); bal(10, -230, 140, 100, 9573);
    ton(-120, 0, 9574); ton(110, 0, 9575); ton(-10, -330, 9576);
    pc([[90, -230], [130, -230], [124, -186, 1], [96, -186, 1]], '#6a6a66', () => strokePts([[92, -222], [128, -222]], '#3a3a38', 2), 9577);   // seau
  }
  function drawGrue() {                                                    // grue de quai en bois à poulie ; origine = pied du mât, flèche vers +x
    pc(box(-10, -620, 10, 0), '#6a4a30', () => strokePts([[-4, -610], [-3, 0]], 'rgba(255,225,180,0.25)', 1.4), 9580);
    pc([[-6, -600], [190, -650], [192, -640], [-4, -588]], '#6a4a30', null, 9581);
    pc([[0, -420], [150, -640], [160, -636], [8, -404]], '#5a3e28', null, 9582);
    pc(box(-30, -16, 30, 0), '#4a3424', null, 9583);
    pc(ell(186, -640, 13, 13, 12), '#4a3a2a', () => dot(186, -640, 3, '#c9a24a'), 9584);
  }
  function drawLanterne() {                                                // lanterne de quai sur poteau ; origine = pied ; flamme en (0, −382)
    pc(box(-7, -360, 7, 0), '#4a3424', null, 9590);
    pc(box(-22, -364, 22, -356), '#2a2622', null, 9591);
    pc([[-18, -356], [18, -356], [14, -412], [-14, -412]], 'rgba(230,210,150,0.45)', () => { for (const x of [-16, 0, 16]) strokePts([[x, -356], [x * 0.8, -412]], '#2a2622', 2); }, 9592);
    pc([[-20, -412], [20, -412], [0, -436]], '#2a2622', null, 9593);
    strokePts(ep(0, -444, 6, 8, 8, PI * 0.8, PI * 2.2), '#2a2622', 2);
  }
  function drawTable() {                                                   // table et banc de taverne ; origine bas-centre, dessus à −82, banc à −40
    pc(box(-110, -86, 110, -76), '#7a5a3a', () => strokePts([[-110, -82], [110, -82]], 'rgba(255,225,180,0.3)', 1.2), 9595);
    for (const x of [-96, 96]) pc(box(x - 6, -76, x + 6, 0), '#5a3e28', null, 9596 + x);
    pc(box(-90, -44, 90, -36), '#6a4a30', null, 9598); for (const x of [-76, 76]) pc(box(x - 5, -36, x + 5, 0), '#4e3622', null, 9599 + x);
  }
  // ---- fonds de Londres (pré-rendus 440 × 400, centre (220, 200))
  const LON = { w: 440, h: 400 };
  function fenetreTamise(x, y, w, h) {
    pc([[x, y + h, 1], [x, y + 30], [x + w / 2, y, 1], [x + w, y + 30], [x + w, y + h, 1]], '#3a2a1e', () => {
      const c = cx_(), g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#b8b6aa'); g.addColorStop(1, '#8e8f88'); c.fillStyle = g; c.fillRect(x + 6, y + 6, w - 12, h - 12);
      fillPts(box(x + 6, y + h * 0.7, x + w - 6, y + h - 6), '#6f7a7a'); for (let k = 0; k < 4; k++) strokePts([[x + 12 + k * 14, y + h * 0.76 + k * 6], [x + 30 + k * 14, y + h * 0.76 + k * 6]], 'rgba(230,235,230,0.5)', 1);
      fillPts([[x + w * 0.3, y + h * 0.7], [x + w * 0.3, y + h * 0.42], [x + w * 0.36, y + h * 0.3], [x + w * 0.42, y + h * 0.42], [x + w * 0.42, y + h * 0.7]], '#5e5e5c');   // clocher lointain
      fillPts([[x + w * 0.55, y + h * 0.7], [x + w * 0.55, y + h * 0.56], [x + w * 0.85, y + h * 0.56], [x + w * 0.85, y + h * 0.7]], '#6a6a66');
      strokePts([[x + w / 2, y + 8], [x + w / 2, y + h - 6]], '#3a2a1e', 3); strokePts([[x + 6, y + h * 0.5], [x + w - 6, y + h * 0.5]], '#3a2a1e', 3);
    }, 9600 + x);
  }
  function drawLondres(kind) {
    return M.pre(LON.w, LON.h, (x) => {
      const g = x.createLinearGradient(0, 0, 0, LON.h); g.addColorStop(0, '#7a7266'); g.addColorStop(1, '#5a5248'); x.fillStyle = g; x.fillRect(0, 0, LON.w, LON.h);
      if (kind === 'parlement') {
        for (let i = 0; i < 6; i++) pc(box(i * 76 + 4, 150, i * 76 + 72, 300), '#5e4430', () => fillPts(box(i * 76 + 12, 160, i * 76 + 64, 290), '#6e5038'), 9610 + i, { drop: false });   // boiseries
        fenetreTamise(290, 30, 110, 120);
        pc([[0, 300, 1], [440, 300, 1], [440, 400, 1], [0, 400, 1]], '#4a3a2c', null, 9620, { drop: false });
        pc([[20, 214, 1], [250, 214, 1], [256, 292], [250, 312, 1], [20, 312, 1]], '#2f4a3a', () => { for (let xx = 36; xx < 246; xx += 26) for (const yy of [232, 256]) dot(xx, yy, 2.2, '#1e3226'); fillPts(box(20, 282, 250, 296), '#3e5c4a'); hatch(null, 0.6, 4, 0.2); }, 9621);   // banc de cuir vert
        pc([[272, 220, 1], [400, 220, 1], [406, 300], [400, 314, 1], [272, 314, 1]], '#2f4a3a', () => { for (let xx = 288; xx < 396; xx += 26) for (const yy of [238, 262]) dot(xx, yy, 2.2, '#1e3226'); fillPts(box(272, 284, 400, 298), '#3e5c4a'); hatch(null, 0.6, 4, 0.2); }, 9622);   // siège vide
        for (const xx of [30, 240, 282, 392]) pc(box(xx - 4, 312, xx + 4, 352), '#3a2a1e', null, 9623 + xx, { drop: false });
        x.strokeStyle = '#2a221a'; x.lineWidth = 2; x.beginPath(); x.moveTo(120, 0); x.lineTo(120, 40); x.stroke();
        pc([[80, 40, 1], [160, 40, 1], [150, 56], [90, 56]], '#b08d45', null, 9630);                                         // chandelier
        for (const xx of [90, 120, 150]) pc(box(xx - 4, 22, xx + 4, 42), '#ece6d6', null, 9631 + xx, { drop: false });
      } else if (kind === 'entrepot') {
        for (const yy of [40, 120]) pc(box(0, yy, 440, yy + 16), '#4a3424', null, 9640 + yy, { drop: false });            // poutres
        for (const xx of [60, 380]) pc(box(xx - 10, 0, xx + 10, 400), '#4a3424', null, 9645 + xx, { drop: false });
        fenetreTamise(170, 30, 100, 90);
        for (let r = 0; r < 4; r++) for (const side of [0, 1]) for (let k = 0; k < 2; k++) {
          const cx0 = side ? 330 + k * 70 - r * 6 : 30 + k * 70 + r * 6, cy0 = 360 - r * 76;
          x.save(); x.translate(cx0, cy0); x.scale(0.42, 0.42); drawCaisse({}); x.restore();
        }
        pc([[0, 360, 1], [440, 360, 1], [440, 400, 1], [0, 400, 1]], '#3e3024', null, 9650, { drop: false });
        x.strokeStyle = '#2a221a'; x.lineWidth = 2; x.beginPath(); x.moveTo(220, 136); x.lineTo(220, 170); x.stroke();
        pc([[206, 170], [234, 170], [230, 200], [210, 200]], 'rgba(230,210,150,0.5)', () => strokePts([[220, 170], [220, 200]], '#2a2622', 2), 9651);   // lanterne
      } else {
        for (let i = 0; i < 9; i++) strokePts([[i * 52 + 10, 0], [i * 52 + 10, 300]], 'rgba(40,50,40,0.25)', 6);           // papier peint rayé
        pc(box(20, 180, 170, 330), '#8a8478', () => { fillPts(box(46, 222, 144, 330), '#1e1612'); hatch(null, 0.9, 4, 0.2); }, 9660);   // cheminée
        pc(box(10, 170, 180, 186), '#a09a8c', null, 9661);
        pc(box(40, 40, 150, 160), '#b08d45', () => { fillPts(box(50, 50, 140, 150), '#4a4038'); fillPts(ell(95, 88, 18, 22, 12), '#7a6a5a'); fillPts([[60, 150], [66, 118], [95, 108], [124, 118], [130, 150]], '#3a2e2a'); }, 9662);   // portrait (sans visage)
        fenetreTamise(310, 40, 100, 110);
        pc([[0, 330, 1], [440, 330, 1], [440, 400, 1], [0, 400, 1]], '#4a3a2c', null, 9663, { drop: false });
        pc(box(240, 250, 430, 266), '#5a3e28', null, 9664); pc(box(250, 266, 420, 340), '#4e3622', () => { strokePts([[335, 270], [335, 336]], 'rgba(20,10,5,0.5)', 1.4); dot(300, 300, 3, '#b08d45'); dot(370, 300, 3, '#b08d45'); }, 9665);   // bureau
        pc(box(262, 238, 284, 250), '#1e1a18', null, 9666); pc([[272, 238], [300, 180], [304, 182], [276, 240]], '#ece6d6', null, 9667);   // encrier et plume
      }
      x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(120,110,95,0.18)'; x.fillRect(0, 0, LON.w, LON.h);    // brume
    });
  }

  BTP.init = function () {
    const K = (BTP.K = {});
    K.ciel = { jour: sky('jour'), nuit: sky('nuit'), aube: sky('aube') };
    K.ville = dn((() => { const cv = M.cutFlat(W + 40, 760, (W + 40) / 2, 730, drawVille); cv.padB = 30; return cv; })(), 0.62, false);
    K.eau = [0, 1, 2].map((i) => dn((() => { const cv = M.cutFlat(W + 260, EAU[i].h + 30, (W + 260) / 2, EAU[i].h + 10, () => drawEau(i)); cv.padB = 20; return cv; })(), 0.6, false));
    const nav = M.cutFlat(900, 960, 450, 900, () => drawNavire(false)); nav.padB = 60;
    const navD = M.cutFlat(900, 960, 450, 900, () => drawNavire(true)); navD.padB = 60;
    K.navire = dn(nav, 0.62); K.navireDev = dn(navD, 0.62);
    const pale = tint(nav, 0.5, '185,192,190'); K.navireLoin = dn(pale, 0.55, false);
    const mk = (w, h, fn) => { const cv = M.cutFlat(w, h, w / 2, h - 10, fn); cv.padB = 10; return cv; };
    K.taverne = dn(mk(560, 900, drawTaverne), 0.6); K.ballots = dn(mk(340, 600, drawBallots), 0.6); K.grue = dn(mk(460, 700, drawGrue), 0.6);
    K.lanterne = dn(mk(80, 470, drawLanterne), 0.6); K.table = dn(mk(260, 110, drawTable), 0.6);
    K.enseigne = dn((() => { const cv = M.cutFlat(140, 130, 70, 20, drawEnseigne); cv.padB = 110; return cv; })(), 0.6);
    K.lon = { parlement: drawLondres('parlement'), entrepot: drawLondres('entrepot'), bureau: drawLondres('bureau') };
  };

  // ---- navire seul (animé) : BTP.navire(t, x, y, s, o) ; o.nuit 0..1, o.trappe 0..1, o.couche 'tout'|'fond'|'devant', o.loin (pâle), o.voile 0..1 (voile qui se déploie)
  BTP.navire = function (t, x, y, s, o) {
    o = o || {}; const g = M.tg(t), c = cx_(), d = clamp(o.nuit || 0), ph = o.ph || 0;
    const rt = 0.012 * Math.sin(g * 0.8 + ph), dy = 3 * Math.sin(g * 1.1 + ph) * s;
    const K = BTP.K, couche = o.couche || 'tout', src = o.loin ? K.navireLoin : K.navire;
    const info = { x, y: y + dy, s, rot: rt };
    const L2W = (p) => { const r = rot([p[0] * s, p[1] * s], rt); return [x + r[0], y + dy + r[1]]; };
    info.pt = (nom) => L2W(BTP.NAVIRE.pts[nom] || [0, 0]); info.local = L2W;
    if (couche !== 'devant') {
      flatDN(src, x, y + dy, d, { rot: rt, scale: s, cast: o.loin ? null : o.cast });
      // fanions unis qui ondulent en tête de mât
      if (!SIL()) for (const [mx, h, col] of [[-190, 400, '#a8783a'], [10, 560, '#e9e0c6'], [184, 470, '#8a3a2c']]) {
        const P0 = L2W([mx, BTP.NAVIRE.pont - h]), L = 46 * s, fl = Math.sin(g * 4 + mx);
        c.save(); c.beginPath(); c.moveTo(P0[0], P0[1]); c.quadraticCurveTo(P0[0] - L * 0.5, P0[1] + 6 * s + fl * 5 * s, P0[0] - L, P0[1] + 10 * s + fl * 3 * s); c.lineTo(P0[0], P0[1] + 12 * s); c.closePath();
        c.fillStyle = o.loin ? M.mixc(col, '#b9c0be', 0.5) : col; c.fill(); if (d > 0) { c.fillStyle = `rgba(${NUITC},${0.6 * d})`; c.fill(); } c.restore();
      }
      if (o.voile > 0 && !SIL()) {                                            // voile qui se déploie sous la grand-vergue
        const v = clamp(o.voile), y0 = BTP.NAVIRE.pont - 560 * 0.3, l = 120 * 0.82 * (560 / 520) * 0.9;
        const A_ = L2W([10 - l, y0]), B_ = L2W([10 + l, y0]), C_ = L2W([10 + l * 0.9, y0 + 200 * v]), D_ = L2W([10 - l * 0.9, y0 + 200 * v]);
        c.save(); c.beginPath(); c.moveTo(...A_); c.lineTo(...B_); c.quadraticCurveTo(C_[0] + 20 * s, (B_[1] + C_[1]) / 2, ...C_); c.lineTo(...D_); c.closePath();
        c.fillStyle = o.loin ? '#dcd8cc' : '#e6dcc0'; c.globalAlpha = 0.95; c.fill(); if (d > 0) { c.fillStyle = `rgba(${NUITC},${0.55 * d})`; c.fill(); } c.restore();
      }
      if (!o.loin && couche === 'tout' || couche === 'fond') {                 // trappe de l'écoutille (charnière côté poupe)
        const k = clamp(o.trappe || 0);
        c.save(); const H = L2W([10, -190]); c.translate(H[0], H[1]); c.rotate(rt); c.scale(s, s);
        if (k > 0.02 && !SIL()) { c.fillStyle = 'rgba(10,6,4,0.9)'; c.fillRect(2, -2, 86, 6); }
        c.rotate(-k * 1.65);
        pc(box(-2, -8, 92, 0), '#6a4a30', () => { strokePts([[4, -4], [88, -4]], 'rgba(255,225,180,0.3)', 1.2); dot(80, -4, 2.4, '#3a3028'); }, 9515);
        if (d > 0.01 && !SIL()) { c.globalAlpha = d * 0.6; c.fillStyle = `rgb(${NUITC})`; c.fillRect(-2, -8, 94, 8); }
        c.restore();
      }
      if (!o.loin && d > 0.05 && !SIL()) for (const xx of [-305, -283, -261]) { const P_ = L2W([xx, -186]); c.save(); c.globalAlpha = d * 0.85; c.fillStyle = '#f2c66a'; c.fillRect(P_[0] - 6 * s, P_[1] - 9 * s, 12 * s, 18 * s); c.restore(); }
    }
    if (couche === 'tout' || couche === 'devant') flatDN(K.navireDev, x, y + dy, d, { rot: rt, scale: s });
    return info;
  };

  // ---- le port de Boston : BTP.port(t, o) ; o.nuit 0..1, o.aube 0..1 (la nuit pâlit), o.navire (x du trois-mâts, défaut 720 ; false = absent),
  //      o.navireO (options du navire : trappe…), o.table (true), o.lointains (true), o.voile 0..1, o.fenetreEteinte 0..1 → renvoie { navire: info }
  BTP.port = function (t, o) {
    o = o || {}; const g = M.tg(t), c = cx_(), K = BTP.K;
    const N = clamp(o.nuit || 0), A = clamp(o.aube || 0), Dk = N * (1 - 0.7 * A), day = 1 - Dk;
    // toile de fond : ciel, astres, nuages, mouettes
    c.drawImage(K.ciel.jour, 0, 0);
    if (N > 0) { c.save(); c.globalAlpha = N; c.drawImage(K.ciel.nuit, 0, 0); c.restore(); }
    if (N * A > 0) { c.save(); c.globalAlpha = N * A; c.drawImage(K.ciel.aube, 0, 0); c.restore(); }
    const astre = N * (1 - A);
    if (astre > 0.01 && !SIL()) {
      c.save(); c.globalAlpha = astre;
      for (let i = 0; i < 46; i++) { const sx = 60 + hash(i * 3.7) * 960, sy = 170 + hash(i * 5.1) * 620, tw = 0.55 + 0.45 * Math.sin(g * (1.5 + hash(i) * 2) + i); c.fillStyle = `rgba(245,238,214,${tw})`; c.beginPath(); c.arc(sx, sy, 1.2 + hash(i * 7.7) * 1.8, 0, TAU); c.fill(); }
      const mx = 330, my = 300 + 4 * Math.sin(g * 0.6);
      c.strokeStyle = 'rgba(30,30,40,0.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(mx, 0); c.lineTo(mx, my - 46); c.stroke();
      c.fillStyle = '#efe6c8'; c.beginPath(); c.arc(mx, my, 46, 0, TAU); c.fill(); c.fillStyle = 'rgba(190,180,150,0.45)';
      for (const [dx, dy, r] of [[-14, -10, 9], [12, 8, 7], [-6, 18, 5]]) { c.beginPath(); c.arc(mx + dx, my + dy, r, 0, TAU); c.fill(); }
      c.restore();
    }
    c.save(); c.globalAlpha = 1 - 0.75 * Dk; M.nuages(t, { y0: 250, y1: 470, n: 4, vit: 9, s: 0.85, seed: 17, brume: 0.1 + 0.3 * Dk }); c.restore();
    if (day > 0.3) { c.save(); c.globalAlpha = day; M.oiseaux(g, { x0: -100, x1: 1180, y: 440, n: 4, dur: 18, s: 0.7, col: '#e9e4d8', boucle: true, seed: 5, brume: 0.2 });
      M.oiseaux(g + 7, { x0: 1180, x1: -100, y: 560, n: 3, dur: 22, s: 0.55, col: '#e9e4d8', boucle: true, seed: 8, brume: 0.3 }); c.restore(); }
    // ville sur la colline, fumées, fenêtres
    flatDN(K.ville, 540, VILLE_Y, Dk * 0.95);
    for (let i = 0; i < Math.min(5, VILLE.chem.length); i++) { const ch = VILLE.chem[(i * 7) % VILLE.chem.length]; M.fumee(t, { x: 540 + ch[0], y: VILLE_Y + ch[1], s: 0.4, n: 5, haut: 160, vent: 50, per: 4.2, seed: 30 + i, col: Dk > 0.5 ? '#8a8ea0' : '#ddd6c8', a: 0.55 }); }
    if (Dk > 0.02 && !SIL()) {
      c.save();
      if (BTP.FENETRE_ETEINTE == null) BTP.FENETRE_ETEINTE = Math.max(0, VILLE.fen.findIndex((f) => 540 + f[0] > 560 && 540 + f[0] < 660 && VILLE_Y + f[1] < 1060));
      VILLE.fen.forEach((f, i) => { if (i !== BTP.FENETRE_ETEINTE && hash(i * 1.37) > 0.55) return; let a = Dk * (0.75 + 0.25 * Math.sin(g * 2 + i));
        if (i === BTP.FENETRE_ETEINTE) a *= 1 - clamp(o.fenetreEteinte || 0);
        c.fillStyle = `rgba(246,196,100,${a})`; c.fillRect(540 + f[0], VILLE_Y + f[1], f[2], f[3]); });
      c.restore();
    }
    // la rade : bandes d'eau, navires lointains, grue, trois-mâts
    const band = (i) => flatDN(K.eau[i], 540 + 22 * Math.sin(g * (0.45 + i * 0.12) + i * 1.7), EAU[i].top + EAU[i].h + 3 * Math.sin(g * 0.9 + i), Dk * 0.95);
    band(0);
    if (astre > 0.01 && !SIL()) { c.save(); for (let k = 0; k < 9; k++) { const yy = 1180 + k * 16, w = 30 - k * 1.5 + 8 * Math.sin(g * 3 + k * 1.3); c.fillStyle = `rgba(240,230,190,${astre * (0.5 + 0.3 * Math.sin(g * 4 + k))})`; c.fillRect(330 - w / 2 + 6 * Math.sin(g * 1.7 + k), yy, w, 3); } c.restore(); }
    const info = {};
    if (o.lointains !== false) {
      BTP.navire(t, 190, 1236, 0.3, { nuit: Dk, loin: true, ph: 1.3 });
      BTP.navire(t, 470, 1226, 0.24, { nuit: Dk, loin: true, ph: 2.6, voile: o.voile || 0 });
    }
    band(1);
    M.poissons(t, { x0: 420, x1: 640, y: 1268, n: 2, periode: 5.2, s: 0.55, seed: 4, brume: 0.2 });
    flatDN(K.grue, 300, ST.back - 14, Dk);
    if (!SIL()) { const sw = 0.06 * Math.sin(g * 0.9), top = [486, ST.back - 14 - 640], L = 300, bx = top[0] + Math.sin(sw) * L, by = top[1] + Math.cos(sw) * L;
      strokePts([top, [bx, by]], '#2a2622', 1.6); c.save(); c.translate(bx, by); c.rotate(-sw);
      pc(rrect(-36, 6, 36, 62, 10), Dk > 0.5 ? '#7e7a70' : '#d2c9b2', () => { strokePts([[-12, 6], [-10, 62]], '#6b5a40', 2.6); strokePts([[14, 6], [16, 62]], '#6b5a40', 2.6); }, 9585);
      strokePts([[0, 0], [-24, 8]], '#2a2622', 1.4); strokePts([[0, 0], [24, 8]], '#2a2622', 1.4); c.restore(); }
    if (o.navire !== false) info.navire = BTP.navire(t, typeof o.navire === 'number' ? o.navire : NAV.x, NAV.y, NAV.s, Object.assign({ nuit: Dk, cast: { dx: 14, dy: 6, a: 0.25 } }, o.navireO || {}));
    band(2);
    // coulisses et premier plan
    flatDN(K.taverne, 150, ST.back + 4, Dk, { cast: { dx: 16, dy: 6, a: 0.3 } });
    const ens = 0.06 * Math.sin(g * 1.1);
    flatDN(K.enseigne, 404, ST.back + 4 - 512, Dk, { rot: ens, cast: { dx: 10, dy: 4, a: 0.25 } });
    if (Dk > 0.02 && !SIL()) { c.save(); c.globalAlpha = Dk * 0.9; c.fillStyle = '#f2c066'; c.fillRect(150 - 116, ST.back + 4 - 326, 82, 92); c.fillRect(150 - 96, ST.back + 4 - 636, 72, 92); c.restore(); }
    flatDN(K.ballots, 935, ST.back + 6, Dk, { cast: { dx: 16, dy: 6, a: 0.3 } });
    flatDN(K.lanterne, 812, ST.back + 4, Dk, { cast: { dx: 12, dy: 6, a: 0.3 } });
    if (Dk > 0.05) { c.save(); c.globalAlpha = Dk; M.flamme(t, { x: 812, y: ST.back + 4 - 372, s: 0.7, r: 130, seed: 2 }); c.restore(); }
    if (o.table !== false) flatDN(K.table, BTP.TABLE.x, ST.back + 6, Dk, { cast: { dx: 12, dy: 6, a: 0.3 } });
    return info;
  };
  BTP.FENETRE_ETEINTE = null;                                       // fenêtre de la ville qui s'éteint (o.fenetreEteinte), choisie au premier dessin
  // quai de planches au premier plan (APRÈS M.drawFloor, avant les marionnettes) ; o.nuit, o.aube ; amarre vers le navire si o.amarre = [x, y] écran
  BTP.portSol = function (t, o) {
    o = o || {}; const c = cx_(), N = clamp(o.nuit || 0), A = clamp(o.aube || 0), Dk = N * (1 - 0.7 * A);
    pc([[ST.L, ST.back - 6, 1], [ST.R, ST.back - 6, 1], [ST.R, ST.back + 8, 1], [ST.L, ST.back + 8, 1]], '#5a3e28', () => { for (let x = 70; x < ST.R; x += 90) dot(x, ST.back + 1, 2.6, '#2a2018'); strokePts([[ST.L, ST.back - 3], [ST.R, ST.back - 3]], 'rgba(255,225,180,0.25)', 1.2); }, 9700, { drop: false });
    if (!SIL()) { c.save(); c.globalAlpha = 0.35; for (let x = 120; x < ST.R; x += 150) { c.fillStyle = 'rgba(40,25,12,0.6)'; c.fillRect(x, ST.back + 8, 2, ST.slotF - ST.back - 8); } c.restore(); }
    const bitte = (x) => { const y0 = ST.back + 30; pc([[x - 13, y0, 1], [x - 12, y0 - 40], [x - 20, y0 - 48], [x - 22, y0 - 58], [x - 12, y0 - 64], [x + 12, y0 - 64], [x + 22, y0 - 58], [x + 20, y0 - 48], [x + 12, y0 - 40], [x + 13, y0, 1]], '#34302c', () => { strokePts([[x - 7, y0 - 60], [x - 6, y0 - 2]], 'rgba(255,255,255,0.2)', 2); strokePts([[x - 20, y0 - 52], [x + 20, y0 - 52]], 'rgba(0,0,0,0.4)', 1.4); }, 9710 + x); };
    const lov = (x) => { const y0 = ST.back + 30; pc(ell(x, y0 - 8, 40, 13, 18), '#a88c5e', () => { for (let k = 0; k < 5; k++) strokePts(ell(x + k * 1.5, y0 - 10 - k * 2.2, 36 - k * 7, 10 - k * 1.6, 16), 'rgba(70,52,28,0.75)', 1.6, true); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; strokePts([[x + Math.cos(a) * 30, y0 - 8 + Math.sin(a) * 9], [x + Math.cos(a) * 38, y0 - 8 + Math.sin(a) * 12]], 'rgba(70,52,28,0.35)', 1); } }, 9720 + x); };
    bitte(190); lov(126); bitte(890); lov(960);
    if (o.amarre) strokePts(qbez([890, ST.back - 12], [(890 + o.amarre[0]) / 2, (ST.back + o.amarre[1]) / 2 + 40], o.amarre, 12), '#8a7550', 3);
    if (Dk > 0.01 && !SIL()) { c.save(); c.globalAlpha = Dk * 0.45; c.fillStyle = `rgb(${NUITC})`; c.fillRect(0, ST.back - 8, W, ST.front - ST.back + 8); c.restore(); }
  };

  // ---- fonds de vignette de Londres : à appeler dans le draw de M.vignette ; flamme animée (temps global)
  BTP.londres = function (t, kind, cx, cy, rx, ry) {
    const c = cx_(), K = BTP.K, f = Math.max((rx || 190) / 220, (ry || 160) / 200);
    cx = cx == null ? 540 : cx; cy = cy == null ? 500 : cy;
    c.save(); c.translate(cx, cy); c.scale(f, f); c.drawImage(K.lon[kind], -LON.w / 2, -LON.h / 2);
    const L = (x, y) => [x - LON.w / 2, y - LON.h / 2];
    if (kind === 'parlement') for (const xx of [90, 120, 150]) { const p = L(xx, 22); M.flamme(t, { x: p[0], y: p[1], s: 0.42, r: 60, seed: xx }); }
    if (kind === 'entrepot') { const p = L(220, 196); M.flamme(t, { x: p[0], y: p[1], s: 0.45, r: 80, seed: 6 }); }
    if (kind === 'bureau') { for (const [xx, sd] of [[78, 1], [96, 2], [114, 3]]) { const p = L(xx, 330); M.flamme(t, { x: p[0], y: p[1], s: 0.9, r: 90, seed: sd }); }
      const p = L(272, 120); M.pendule(t, { x: p[0], y: p[1], s: 0.34, per: 2 }); }
    c.restore();
  };
  // placement conseillé du lord dans la vignette : { x, y (pieds), s, assis, siege } ; le lord regarde vers +x (dir 1)
  BTP.londresPied = function (kind, cx, cy, rx, ry) {
    const f = Math.max((rx || 190) / 220, (ry || 160) / 200);
    if (kind === 'parlement') return { x: cx - 40 * f, y: cy + 144 * f, s: 0.6 * f, assis: 1, siege: 100 };
    if (kind === 'entrepot') return { x: cx, y: cy + 160 * f, s: 0.56 * f };
    return { x: cx - 20 * f, y: cy + 150 * f, s: 0.6 * f };
  };
})();
