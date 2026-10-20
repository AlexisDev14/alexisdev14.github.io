// persos.js — « Le Teddy bear, l'ours que Roosevelt épargna » (1902) : marionnettes, accessoires et vignette de chambre PROPRES À CETTE VIDÉO.
// Espace M.ted (alias TED). Mode d'emploi : persos.md (ne pas lire ce fichier en entier). TED.init() dans S.init (rien de lourd à pré-rendre).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun Math.random) : tout est fonction pure de t.
// MARIONNETTES (avec tige ; (x,y) = pieds ; slot: ST.slotF/slotB) — toujours par l'enveloppe TED.xxx(pose,x,y,s,o) :
//   TED.roosevelt (C.tedRoosevelt, s 0,9) · TED.collier (C.tedCollier, 0,9) · TED.morris (C.tedMorris, 0,9) · TED.rose (C.tedRose, 0,88)
//   TED.ours(pose,x,y,s,o) (def.libre, s 1) · TED.chien(pose,x,y,s,o) (def.libre, s 0,8 ; pose.robe 'a'|'b')
// ACCESSOIRES : TED.peluche, TED.journal, TED.fusil, TED.cor, TED.aiguille (x,y,s,o) ; TED.corde(a,b,o) (corde entre deux points écran)
// VIGNETTE : TED.chambre(t,cx,cy,rx,ry,o) (intérieur complet de la chambre d'enfant, à appeler dans le draw de M.vignette)
// POINTS : TED.pt(r,'nom',arriere) (objet tenu) ; TED.ourspt(r,'corde'|'tete'|'nez'|'oeil') ; TED.chienpt(r,'nez')
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const TED = (M.ted = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rot = (pts, a, ox, oy) => { ox = ox || 0; oy = oy || 0; const c = Math.cos(a), s = Math.sin(a); return pts.map((p) => { const x = p[0] - ox, y = p[1] - oy, q = [ox + x * c - y * s, oy + x * s + y * c]; if (p[2]) q.push(1); return q; }); };
  function ribbon(line, w0, w1) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1 == null ? w0 : w1, i / (line.length - 1)) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  function qbez(p0, p1, p2, n) { const o = []; n = n || 12; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  // poil / fourrure : petits traits courbes
  function fur(reg, n, seed, col, lw, len) {
    if (SIL()) return;
    const bb = M.bbox(reg), R = M.rng(seed);
    const c = cx_(); c.save(); M.path(reg, 0, 0); c.clip();
    for (let i = 0; i < n; i++) {
      const x = lerp(bb[0], bb[2], R()), y = lerp(bb[1], bb[3], R()), a = 0.9 + R() * 0.8, l = (len || 9) * (0.6 + R() * 0.7);
      strokePts([[x, y], [x + Math.cos(a) * l * 0.5 + 1.5, y + Math.sin(a) * l * 0.5], [x + Math.cos(a) * l, y + Math.sin(a) * l]], col, lw || 1);
    }
    c.restore();
  }
  TED.geo = { ep, ell, ribbon, qbez, rrect, rot, tr, scl, mp };

  // ------------------------------------------------------------ bras à articulations rondes (rivet au centre de chaque arrondi)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt, wTop) { wt = wt || 15; const wT = wTop || wt; return ep(0, 0, wT, wT, 10, PI, TAU).concat([[wT - 1, 22], [wt - 1, 44], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 44], [-wT + 1, 22]]); }
  // mains : 'fist' poing ; 'open' main ouverte (pouce côté +x) ; 'paume' = open (paume vers le haut quand l'avant-bras est tendu devant) ;
  // 'bas' main plate pouce côté −x (paume vers le sol, bras tendu) ; 'visiere' main plate pliée au poignet vers −x (visière, salut au bord du chapeau)
  const H_BAS = [[-8, 78], [8, 78], [9, 90], [9, 105], [5, 117], [-2, 119], [-8, 114], [-10, 104], [-10, 94], [-15, 99], [-18, 95], [-12, 86]];
  const H_VIS = [[-8, 78], [8, 78], [10, 88], [4, 96], [-10, 94], [-24, 88], [-36, 82], [-39, 77], [-35, 73], [-22, 74], [-12, 80], [-10, 84]];
  function handShape(k) { return k === 'fist' ? X.HAND_FIST : k === 'bas' ? H_BAS : k === 'visiere' ? H_VIS : X.HAND_OPEN; }
  function foreR(kind) {
    const h = handShape(kind);
    return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[10, 40], [9, 76]], h.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [[-9, 86], [-10, 76], [-11, 40]]);
  }
  function handPaintK(kind, skinD) {
    if (kind === 'fist') { strokePts([[0, 92], [12, 92]], 'rgba(60,30,20,0.5)', 1); strokePts([[-2, 99], [10, 99]], 'rgba(60,30,20,0.5)', 1); return; }
    if (kind === 'bas') { strokePts([[-1, 100], [-3, 113]], 'rgba(70,35,20,0.45)', 1); strokePts([[3, 100], [3, 112]], 'rgba(70,35,20,0.45)', 1); return; }
    if (kind === 'visiere') { strokePts([[-4, 90], [-30, 80]], 'rgba(70,35,20,0.45)', 1); strokePts([[-6, 86], [-26, 77]], 'rgba(70,35,20,0.35)', 1); return; }
    X.handPaint(null, 'open');
    if (kind === 'paume') fillPts([[2, 88], [9, 92], [8, 108], [2, 112]], 'rgba(255,225,200,0.25)');
  }
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant' (coude devant), 'arriere'
  function ik2(S, T, pick, retry) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      // le coude ne plie que vers l'avant (b ≤ 0) : la solution à l'envers est écartée
      const sc = (b > 0.05 ? -1e6 : 0) + (pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1]);
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    // aucune solution au coude vers l'avant (cible derrière l'épaule) : la main s'arrête juste devant l'épaule, sinon bras tendu
    if (best.sc < -1e5) return retry ? { a: tv, b: 0, sc: 0 } : ik2(S, [Math.max(T[0], S[0] + 12), T[1]], pick, true);
    return best;
  }
  TED.ik2 = ik2;

  // ------------------------------------------------------------ poses : outils communs
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const has = (v) => v && v !== 'rien';
  function plier(q, th) {                                   // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  // marche : m 0..1 (amplitude), q.t (s), cad (pas/s), amp (rad de jambe), lourd (sautillement)
  function marcher(q, cad, amp, bob, brasLibres) {
    const m = q.marche === true ? 1 : clamp(q.marche || 0); if (m <= 0) return;
    const ph = (q.t || 0) * PI * cad, s = Math.sin(ph), A = q.ang;
    A.legF = (A.legF || 0) - amp * s * m; A.legB = (A.legB || 0) + amp * s * m;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * bob * m;
    if (brasLibres.F) A.armF_up = (A.armF_up || 0) + 0.15 * s * m;
    if (brasLibres.B) A.armB_up = (A.armB_up || 0) - 0.15 * s * m;
  }

  // =====================================================================
  // OBJETS — chacun dessiné dans son repère, seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const BOIS = '#7a4a28', BOISL = '#9a6438', BRONZE = '#5b4c34', BRONZEL = '#8a7650', CORDE = '#b59a62', CORDED = '#8c7444';
  // ---------------- fusil à levier (crosse à x 0, canon vers +x, bouche à x 300)
  function drawFusil(o) {
    pc([[0, -7, 1], [12, -8], [40, -5], [72, -3], [74, 10], [52, 14], [26, 22], [4, 30, 1], [0, 28, 1]], BOIS, () => {
      strokePts([[6, 2], [40, 2], [70, 3]], 'rgba(255,220,170,0.25)', 1.4); hatch(null, 0.25, 3.6, 0.25);
      fillPts(box(0, -7, 5, 29), '#3a2a1e');
    }, 7001);
    // levier (anneau) sous la boîte de culasse
    if (!SIL()) { strokePts(ep(92, 18, 12, 9, 12, -0.2, PI + 0.2), '#2c241a', 3.4); strokePts([[96, 10], [98, 16]], '#2c241a', 2); }
    pc([[70, -7, 1], [114, -7, 1], [116, 8, 1], [76, 12, 1], [70, 10]], BRONZE, () => {
      strokePts([[74, -3], [112, -3]], 'rgba(255,240,200,0.35)', 1.2); dot(84, 2, 2, '#2a2218'); dot(104, 2, 2, '#2a2218');
    }, 7002);
    pc([[114, -5, 1], [206, -4, 1], [210, 3, 1], [204, 9, 1], [114, 9, 1]], BOISL, () => hatch(null, 0.2, 4, 0.22), 7003);
    pc([[112, 6, 1], [282, 4, 1], [284, 9, 1], [112, 11, 1]], '#3e3528', null, 7004, { drop: false });
    pc([[112, -7, 1], [300, -5, 1], [300, 1, 1], [112, 1, 1]], BRONZE, () => strokePts([[116, -5], [296, -4]], 'rgba(255,240,200,0.35)', 1), 7005);
    pc([[290, -9, 1], [294, -9, 1], [294, -5, 1], [290, -5, 1]], '#2a2218', null, 7006, { drop: false });
    if (o.bretelle && !SIL()) strokePts(qbez([24, 26], [140, 60], [240, 10], 14), '#4a3020', 3);
  }
  // ---------------- corde de chanvre tenue : de la main avant (0,0) à la main arrière (p2), boucle qui pend de la main arrière
  function cordeSeg(pts, w) { if (SIL()) return; strokePts(pts, CORDED, w + 1.6); strokePts(pts, CORDE, w); for (let i = 1; i < pts.length; i += 1) { const a = pts[i - 1], b = pts[i]; strokePts([[lerp(a[0], b[0], 0.3) - 1.5, lerp(a[1], b[1], 0.3) - 1.5], [lerp(a[0], b[0], 0.6) + 1.5, lerp(a[1], b[1], 0.6) + 1.5]], 'rgba(90,70,30,0.6)', 1); } }
  function drawCordeTenue(o) {
    const g2 = o._p2 || [-60, 6], tire = clamp(o.tire || 0);
    cordeSeg([[24, 0], [0, 0], [lerp(g2[0], 0, 0.5), lerp(g2[1], 0, 0.5) + 8 * (1 - tire)], g2], 4.4);
    const bx = g2[0], by = g2[1];
    cordeSeg(qbez([bx, by], [bx - 26, by + 70], [bx + 10, by + 96], 10).concat(qbez([bx + 10, by + 96], [bx + 34, by + 70], [bx + 4, by + 4], 8)), 4);
    if (o.noue) { const k = (o.t || 0) * 5; pc(ell(-30 + 3 * Math.sin(k), 0, 10, 8, 10), CORDE, () => strokePts([[-36, -4], [-24, 4]], 'rgba(90,70,30,0.7)', 1.2), 7011); }
  }
  // ---------------- cor de chasse en corne (embouchure à gauche, pavillon à droite)
  function drawCor(o) {
    const line = qbez([-58, 6], [0, 44], [62, -14], 14);
    const w = (i) => lerp(5, 26, Math.pow(i / (line.length - 1), 1.6));
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      L.push([line[i][0] - dy * w(i) / 2, line[i][1] + dx * w(i) / 2]); R.push([line[i][0] + dy * w(i) / 2, line[i][1] - dx * w(i) / 2]);
    }
    pc(L.concat(R.reverse()), '#d8c9a3', () => {
      for (let i = 2; i < line.length - 1; i += 2) strokePts([L[i], R[i]], 'rgba(120,95,60,0.35)', 1);
      fillPts([L[0], L[2], R[2], R[0]], '#5a4630');
      fillPts([L[line.length - 2], L[line.length - 1], R[line.length - 1], R[line.length - 2]], '#a8916a');
      hatch(null, 0.5, 3.6, 0.2);
    }, 7021);
    pc(ell(-62, 6, 5, 4, 8), P.orD || '#8a6a2a', null, 7022);
    if (o.bretelle && !SIL()) strokePts(qbez([-40, 14], [0, -60], [40, 4], 12), '#3a2618', 2.6);
  }
  // ---------------- aiguille (chas en haut) ; le fil est tracé par l'enveloppe de Rose
  function drawAiguille() {
    if (SIL()) return;
    strokePts([[-3, -20], [4, 20]], '#cfd3d6', 2.6); strokePts([[-3, -20], [4, 20]], '#7d858a', 1);
    strokePts(ell(-3, -17, 1.6, 3.2, 8).concat([[-1.4, -17]]), '#5d656a', 1);
  }

  // =====================================================================
  // L'OURS EN PELUCHE 1902 — vu de face ; origine = sol entre les pieds ; debout ≈ 192 de haut, assis ≈ 172
  // o.couture 0..1 (0 : deux pièces d'étoffe + tête à moitié bourrée ; 0,5 : assemblé, mou, bourre qui dépasse, un œil ; 1 : fini, nœud rouge)
  // o.assis, o.penche (−1..1, tête inclinée), o.bras 0..1 (pattes avant ouvertes), o.t
  // =====================================================================
  const PE = { miel: '#9a6a3a', mielD: '#7c522b', mielL: '#b8854f', ivoire: '#e8dcc0', ivoireD: '#cbbd9c', noir: '#1a1412', ruban: '#8a2a22', rubanD: '#6a1e18', bourre: '#f1ece0' };
  TED.PE = PE;
  function pelGeo(o) {
    const as = !!o.assis;
    return as ? { bodyC: [0, -70], bodyR: [50, 54], headC: [0, -132], neck: [0, -94], arm: [-42, -104], legs: 'assis' }
      : { bodyC: [0, -84], bodyR: [48, 58], headC: [0, -152], neck: [0, -114], arm: [-40, -122], legs: 'debout' };
  }
  function pelTete(o, gq, st, cx, cy, yeux, seed) {
    const c = cx_();
    c.save(); c.translate(cx, cy); c.rotate(clamp(o.penche || 0, -1, 1) * 0.3);
    const flat = lerp(0.72, 1, st), dent = (1 - st) * 12;
    for (const sx of [-1, 1]) {                                                             // oreilles rondes
      pc(ell(sx * 32, -32 * flat, 15, 15, 12), PE.miel, () => { fillPts(ell(sx * 32, -31 * flat, 8, 8, 10), PE.ivoireD); hatch(null, 0.6, 3.4, 0.2); }, seed + 1 + sx);
    }
    const hd = ell(0, 0, 42, 40 * flat, 22).map((p) => (p[0] > 10 ? [p[0], p[1] + dent * Math.sin((p[0] - 10) / 32 * PI) * (p[1] < 0 ? 1 : 0)] : p));
    pc(hd, PE.miel, () => {
      fur(hd, 40, seed + 5, 'rgba(70,40,20,0.35)', 1, 7);
      fur(hd, 18, seed + 6, 'rgba(230,190,140,0.3)', 1, 6);
      if (st > 0.3 && !SIL()) for (let y = -36; y < -8; y += 5) strokePts([[-1.5, y], [1.5, y + 2.5]], 'rgba(60,35,18,0.55)', 1);   // couture du crâne
      shade(-30, -30, 30, 30, 0.22, [-50, -50, 50, 50]);
    }, seed + 4);
    pc(ell(0, 12 * flat, 20, 14, 14), PE.ivoire, () => hatch(null, 0.4, 3.2, 0.15), seed + 7);   // museau feutre
    fillPts([[-7, 4 * flat], [7, 4 * flat], [5, 9 * flat], [0, 11 * flat], [-5, 9 * flat]], PE.noir);
    strokePts([[0, 11 * flat], [0, 16 * flat]], 'rgba(30,20,15,0.9)', 1.3);
    strokePts([[-9, 14 * flat], [-5, 19 * flat], [0, 16 * flat], [5, 19 * flat], [9, 14 * flat]], 'rgba(30,20,15,0.9)', 1.3);   // sourire cousu
    for (const [i, sx] of [[0, -1], [1, 1]]) {
      if (yeux <= i) continue;
      dot(sx * 15, -8 * flat, 6, PE.noir); dot(sx * 15 - 2, -10 * flat, 2, 'rgba(255,255,255,0.9)');
    }
    if (yeux === 1) strokePts([[11, -8 * flat], [19, -8 * flat]], 'rgba(60,35,18,0.6)', 1);            // fil de l'œil à venir
    c.restore();
  }
  function pelPatte(sx, a, ax, ay, seed, len) {                                              // patte avant (pivot à l'épaule)
    const c = cx_(); c.save(); c.translate(ax * sx, ay); c.rotate(-sx * a);
    const L = len || 62, sh = [[-13, -4], [13, -6], [16, L * 0.5], [14, L - 8], [4, L + 6], [-10, L + 2], [-15, L * 0.5]].map((p) => [p[0] * sx, p[1]]);
    pc(sh, PE.miel, () => { fillPts(ell(2 * sx, L - 6, 10, 8, 10), PE.ivoire); fur(sh, 10, seed, 'rgba(70,40,20,0.35)', 1, 6); }, seed);
    M.rivet(0, 2, 2.6);
    c.restore();
  }
  const GINGER = [[0, -118], [14, -116], [22, -104], [36, -100], [50, -84], [46, -74], [30, -80], [28, -56], [34, -24], [30, -2, 1], [8, -2, 1], [0, -30], [-8, -2, 1], [-30, -2, 1], [-34, -24], [-28, -56], [-30, -80], [-46, -74], [-50, -84], [-36, -100], [-22, -104], [-14, -116]];
  function drawPeluche(o) {
    o = o || {};
    const cpl = clamp(o.couture == null ? 1 : o.couture), st = smooth(0.18, 0.82, cpl), sep = 1 - smooth(0.22, 0.48, cpl);
    const G = pelGeo(o), bras = clamp(o.bras || 0), c = cx_();
    const yeux = cpl < 0.42 ? 0 : cpl < 0.7 ? 1 : 2;
    if (sep > 0.02) {                                                                         // état 0 : deux pièces d'étoffe à plat + tête à moitié bourrée
      for (const sx of [-1, 1]) {
        c.save(); c.translate(sx * 52 * sep, 6 * sep); c.rotate(sx * 0.22 * sep);
        const patron = scl(GINGER, 0.78, 0.86).map((p) => [p[0] * sx, p[1]]);
        pc(patron, PE.miel, () => {
          fur(patron, 20, 7101 + sx, 'rgba(70,40,20,0.3)', 1, 6);
          if (!SIL()) for (let i = 0; i < patron.length - 1; i++) { const a = patron[i], b = patron[i + 1]; strokePts([[lerp(a[0], b[0], 0.2) * 0.86, lerp(a[1], b[1], 0.2) * 0.94 - 6], [lerp(a[0], b[0], 0.6) * 0.86, lerp(a[1], b[1], 0.6) * 0.94 - 6]], 'rgba(240,230,200,0.6)', 1); }
        }, 7100 + sx, { texA: 0.4 });
        c.restore();
      }
      c.save(); c.globalAlpha *= 1; c.translate(0, -10 * sep); pelTete(o, G, st, G.headC[0], G.headC[1] - 6, yeux, 7110); c.restore();
      if (!SIL()) for (const [x, y, r] of [[22, -150, 7], [30, -142, 6], [-26, -146, 6]]) dot(x, y - 10 * sep, r, PE.bourre);   // bourre qui dépasse
      return;
    }
    const ry = G.bodyR[1] * lerp(0.8, 1, st), rx = G.bodyR[0] * lerp(0.86, 1, st);
    // jambes
    if (G.legs === 'debout') {
      for (const sx of [-1, 1]) {
        const lg = [[sx * 8, -50], [sx * 40, -54], [sx * 44, -20], [sx * 42, 0, 1], [sx * 8, 0, 1], [sx * 6, -26]];
        pc(lg, PE.miel, () => { fillPts(ell(sx * 25, -7, 15, 7, 12), PE.ivoire); fur(lg, 8, 7120 + sx, 'rgba(70,40,20,0.35)', 1, 6); }, 7121 + sx);
      }
    } else {
      for (const sx of [-1, 1]) {
        const lg = ell(sx * 30, -24, 24, 24, 14);
        pc(lg, PE.miel, () => { fillPts(ell(sx * 32, -20, 15, 17, 14), PE.ivoire); hatch(ell(sx * 32, -20, 15, 17, 14), 0.5, 3.2, 0.15); }, 7123 + sx);
      }
    }
    // corps
    const bd = ell(G.bodyC[0], G.bodyC[1], rx, ry, 22);
    pc(bd, PE.miel, () => {
      fur(bd, 50, 7130, 'rgba(70,40,20,0.35)', 1, 7);
      fur(bd, 22, 7131, 'rgba(230,190,140,0.3)', 1, 6);
      if (!SIL()) for (let y = G.bodyC[1] - ry + 8; y < G.bodyC[1] + ry - 6; y += 6) strokePts([[-1.5, y], [1.5, y + 3]], 'rgba(60,35,18,0.5)', 1);   // couture verticale
      if (cpl < 0.8 && !SIL()) {                                                              // couture encore ouverte : bourre qui dépasse
        const k = 1 - smooth(0.5, 0.8, cpl);
        for (const [x, y, r] of [[2, -6, 9], [-4, 10, 8], [6, 22, 7], [0, -20, 6]]) dot(G.bodyC[0] + x, G.bodyC[1] + y, r * k, PE.bourre);
      }
      shade(-40, -40, 40, 40, 0.25, [-60, -150, 60, 0]);
    }, 7132);
    // pattes avant (rivets aux épaules)
    for (const sx of [-1, 1]) pelPatte(sx, lerp(0.28, 1.25, bras) * (st > 0.5 ? 1 : 0.7), -G.arm[0], G.arm[1], 7140 + sx, 60);
    // tête
    pelTete(o, G, st, G.headC[0], G.headC[1], yeux, 7150);
    // nœud de ruban rouge
    const nk = smooth(0.82, 1, cpl);
    if (nk > 0.01) {
      c.save(); c.translate(G.neck[0], G.neck[1] + 2); c.scale(nk, nk);
      for (const sx of [-1, 1]) pc([[0, 0], [sx * 20, -10], [sx * 24, 0], [sx * 20, 10]], PE.ruban, () => strokePts([[sx * 6, 0], [sx * 18, -3]], 'rgba(255,200,190,0.35)', 1.2), 7160 + sx);
      for (const sx of [-1, 1]) pc([[sx * 2, 2], [sx * 12, 22], [sx * 6, 24], [sx * 1, 6]], PE.rubanD, null, 7163 + sx);
      pc(ell(0, 0, 6, 6, 8), PE.ruban, null, 7166);
      c.restore();
    }
  }
  TED.drawPeluche = drawPeluche;

  // =====================================================================
  // LE JOURNAL À LA CARICATURE — page de face, centrée en (0,0), 280 × 370 ; o.version 0..1 (ours du dessin) ; o.k échelle interne
  // =====================================================================
  const JN = { W: 250, H: 370, papier: '#e9e0c6', papierD: '#d3c7a6', encre: '#221c18' };
  function inkLine(pts, w, a) { strokePts(pts, `rgba(34,28,24,${a == null ? 0.95 : a})`, w || 1.6); }
  function drawCaricature(v) {                                                               // dessin à la plume, cadre x −112..112, y −96..86
    const c = cx_();
    // sol et piquet / arbre
    inkLine([[-108, 70], [-40, 72], [40, 70], [108, 72]], 1.4);
    for (let x = -100; x < 100; x += 9) inkLine([[x, 74], [x - 5, 80]], 1, 0.6);
    inkLine([[96, 70], [94, -40], [97, -60]], 3.4); inkLine([[94, -20], [106, -34]], 2);
    // --- Roosevelt (de profil, regarde à droite) : chapeau de campagne, moustache, trapu, main tendue en refus, fusil baissé vers le sol
    const ink = (pts, w, fill) => { if (fill) fillPts(pts, fill); inkLine(pts.concat([pts[0]]), w || 1.6); };
    ink([[-74, 20], [-62, 20], [-62, 60], [-58, 66], [-58, 70], [-76, 70], [-74, 60]], 1.4, 'rgba(60,40,24,0.55)');            // bottes
    ink([[-56, 20], [-44, 20], [-44, 60], [-38, 66], [-38, 70], [-56, 70], [-56, 60]], 1.4, 'rgba(60,40,24,0.55)');
    const veste = [[-80, -38], [-60, -44], [-38, -40], [-30, -14], [-32, 24], [-82, 24], [-84, -10]];
    ink(veste, 1.8, 'rgba(120,118,70,0.35)'); hatch(veste, 0.8, 3.4, 0.4, 1, '34,28,24');
    inkLine([[-82, 6], [-32, 6]], 2.6); inkLine([[-36, -38], [-30, -20]], 1);
    ink(ell(-56, -56, 12, 13, 14), 1.6, '#efe6cc');
    fillPts([[-52, -54], [-38, -56], [-36, -48], [-46, -46], [-52, -48]], JN.encre);                          // moustache
    inkLine([[-48, -62], [-42, -62]], 1.2); dot(-45, -61, 2.4, 'rgba(34,28,24,0.0)'); inkLine(ell(-45, -61, 3, 2.6, 8).concat([[-42, -61]]), 1);   // pince-nez
    ink([[-82, -66], [-30, -68], [-28, -64], [-82, -62]], 1.4, JN.encre);                                       // bord du chapeau
    ink([[-70, -66], [-68, -80], [-60, -84], [-56, -80], [-52, -84], [-44, -80], [-42, -66]], 1.4, 'rgba(34,28,24,0.55)');
    ink([[-42, -40], [-24, -46], [-10, -50], [-8, -44], [-24, -38], [-40, -32]], 1.4, 'rgba(120,118,70,0.35)');  // bras tendu
    ink([[-10, -50], [-6, -64], [-2, -66], [0, -62], [2, -66], [5, -63], [4, -48], [-6, -42]], 1.3, '#efe6cc'); // main ouverte, paume vers l'ours
    ink([[-80, -30], [-88, -4], [-80, 2], [-74, -24]], 1.4, 'rgba(120,118,70,0.35)');                           // bras arrière
    inkLine([[-86, -10], [-104, 66]], 3); inkLine([[-82, -16], [-88, 2]], 5.4);                                  // fusil baissé, canon vers le sol
    // --- l'ours : 0 = grand, noir, hirsute, attaché ; 0,5 = moyen, plus rond ; 1 = petit ourson rond aux grands yeux
    const k = smooth(0, 1, v), big = lerp(1, 0.6, k), rond = smooth(0.25, 1, v), hir = 1 - smooth(0, 0.65, v);
    const bx = 50, by = 70;
    c.save(); c.translate(bx, by); c.scale(big, big);
    const body = ell(0, -52, lerp(40, 46, rond), lerp(62, 48, rond), 26).map((p, i) => {
      const sp = hir * (i % 2 ? 7 : -2); const dx = p[0], dy = p[1] + 52, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * sp, p[1] + dy / l * sp];
    });
    const fond = v < 0.5 ? `rgba(34,28,24,${lerp(0.92, 0.45, smooth(0, 0.5, v))})` : `rgba(120,90,60,${lerp(0.45, 0.28, smooth(0.5, 1, v))})`;
    fillPts(body, fond); inkLine(body.concat([body[0]]), 1.8);
    const hy = lerp(-128, -112, rond), hr = lerp(26, 34, rond);
    const head = ell(-2, hy, hr, hr * lerp(0.92, 1, rond), 20).map((p, i) => { const sp = hir * (i % 2 ? 5 : -1.5), dx = p[0] + 2, dy = p[1] - hy, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * sp, p[1] + dy / l * sp]; });
    for (const sx of [-1, 1]) { const e = ell(-2 + sx * hr * 0.7, hy - hr * 0.78, lerp(7, 12, rond), lerp(7, 12, rond), 10); fillPts(e, fond); inkLine(e.concat([e[0]]), 1.4); }
    fillPts(head, fond); inkLine(head.concat([head[0]]), 1.8);
    const mz = ell(-2, hy + hr * 0.38, hr * 0.42, hr * 0.3, 12); fillPts(mz, '#efe6cc'); inkLine(mz.concat([mz[0]]), 1.2);
    dot(-2, hy + hr * 0.26, lerp(4, 5, rond), JN.encre);
    const er = lerp(2.6, 10, smooth(0.2, 1, v));
    for (const sx of [-1, 1]) {
      dot(-2 + sx * hr * 0.42, hy - hr * 0.12, er + 1.6, '#efe6cc'); dot(-2 + sx * hr * 0.42, hy - hr * 0.12, er, JN.encre);
      if (v > 0.4) dot(-2 + sx * hr * 0.42 - er * 0.3, hy - hr * 0.12 - er * 0.35, er * 0.35, '#efe6cc');
      if (hir > 0.5) inkLine([[-2 + sx * hr * 0.2, hy - hr * 0.42], [-2 + sx * hr * 0.62, hy - hr * 0.3]], 2);   // sourcils froncés (hirsute)
    }
    if (v > 0.6) inkLine([[-8, hy + hr * 0.5], [-2, hy + hr * 0.56], [4, hy + hr * 0.5]], 1.2);                  // petit sourire
    if (hir > 0.1) { const R2 = M.rng(91); for (let i = 0; i < 26 * hir; i++) { const a = R2() * TAU, rr = 0.55 + R2() * 0.4; inkLine([[Math.cos(a) * 34 * rr, -52 + Math.sin(a) * 52 * rr], [Math.cos(a) * 34 * rr + 4, -52 + Math.sin(a) * 52 * rr + 5]], 1, 0.55 * hir); } }
    for (const sx of [-1, 1]) { const pw = ell(sx * 22, -4, lerp(12, 14, rond), 8, 10); fillPts(pw, fond); inkLine(pw.concat([pw[0]]), 1.2); }
    c.restore();
    // corde : du cou de l'ours au piquet
    inkLine(qbez([bx + 4 * big, by - 96 * big], [bx + 30, by - 70 * big], [95, -10], 10), 1.5);
    inkLine(ell(bx - 2 * big, by - 92 * big, 22 * big, 6 * big, 12).concat([[bx + 20 * big, by - 92 * big]]), 1.3);
  }
  function drawJournal(o) {
    o = o || {};
    const k = o.k || 1, W = JN.W, H = JN.H, c = cx_();
    c.save(); c.scale(k, k);
    const page = [[-W / 2, -H / 2, 1], [W / 2 - 4, -H / 2 + 2, 1], [W / 2, H / 2, 1], [-W / 2 + 3, H / 2 - 2, 1]];
    pc(page, JN.papier, () => {
      if (SIL()) return;
      fillPts(box(-W / 2, -H / 2, W / 2, H / 2), 'rgba(160,130,80,0.08)');
      // filet de titre : gros traits noirs abstraits (aucune lettre) + doubles filets
      const R = M.rng(17); let x = -106;
      while (x < 100) { const w = 6 + R() * 14, h = 18 + R() * 10; fillPts([[x, -150 - h / 2, 1], [x + w, -150 - h / 2 - 2, 1], [x + w, -150 + h / 2, 1], [x, -150 + h / 2 + 1, 1]], JN.encre); x += w + 4 + R() * 6; }
      for (const y of [-130, -126]) strokePts([[-112, y], [112, y]], JN.encre, y === -130 ? 2.2 : 1);
      // colonnes de traits gris ondulés
      const cols = [[-112, -60], [-54, -3], [3, 54], [60, 112]];
      for (let ci = 0; ci < 4; ci++) {
        const [x0, x1] = cols[ci];
        for (let y = -118; y < 170; y += 7) {
          if (y > -104 && y < 96) continue;                                                    // place du dessin
          const pts = []; for (let xx = x0; xx <= x1; xx += 6) pts.push([xx, y + Math.sin(xx * 0.25 + y + ci) * 1.2]);
          strokePts(pts, 'rgba(70,64,58,0.55)', 1.6);
        }
        if (ci < 3) strokePts([[x1 + 2, 100], [x1 + 2, 170]], 'rgba(40,34,30,0.5)', 0.8);
      }
      for (let y = -118; y < -104; y += 7) { const pts = []; for (let xx = -112; xx <= 112; xx += 6) pts.push([xx, y + Math.sin(xx * 0.25 + y) * 1.2]); strokePts(pts, 'rgba(70,64,58,0.5)', 1.4); }
      // cadre du dessin
      fillPts(box(-108, -100, 108, 92), '#efe6cc');
      strokePts(box(-108, -100, 108, 92).concat([[-108, -100]]), JN.encre, 1.6);
      const cc = cx_(); cc.save(); cc.translate(0, -2); cc.scale(0.93, 0.93); drawCaricature(clamp(o.version || 0)); cc.restore();
      hatch(null, 0.3, 6, 0.05, 1, '120,100,60', [-W / 2, -H / 2, W / 2, H / 2]);
      shade(-W / 2, 0, W / 2, 0, 0.12, [-W / 2, -H / 2, W / 2, H / 2]);
      strokePts([[-W / 2 + 6, H / 2 - 4], [W / 2 - 2, H / 2 - 2]], 'rgba(120,100,60,0.35)', 2);
    }, 7201, { texA: 0.5 });
    if (o.punaise && !SIL()) { dot(0, -H / 2 + 10, 6, P.sang); dot(-2, -H / 2 + 8, 2, 'rgba(255,255,255,0.7)'); }
    c.restore();
  }
  TED.JN = JN;

  // =====================================================================
  // REGISTRE DES OBJETS : grip = point tenu dans le poing ; p2 = seconde prise (deuxMains) ; pts = points nommés ; base = origine de l'accessoire seul
  // =====================================================================
  const OBJ = {
    fusil: { draw: drawFusil, grip: [130, 4], p2: () => [70, 6], pts: { bouche: [300, -2], crosse: [2, 12], levier: [92, 18] }, base: [150, 16] },
    corde: { draw: (o) => drawCordeTenue(Object.assign({ _p2: OBJ.corde.p2(o) }, o)), grip: [0, 0], p2: (o) => [lerp(-62, -44, clamp(o.tire || 0)), 6], pts: { bout: [24, 0] }, base: [0, 0] },
    cor: { draw: drawCor, grip: [-20, 22], pts: { embouchure: [-62, 6], pavillon: [62, -14] }, base: [0, 30] },
    aiguille: { draw: drawAiguille, grip: [0, 0], pts: { chas: [-3, -17], pointe: [4, 20] }, base: [0, 20] },
    peluche: { draw: drawPeluche, grip: (o) => [o.prise === 'g' ? -46 : 46, o.assis ? -100 : -116], p2: (o) => [-46, o.assis ? -100 : -116],
      pts: { tete: [0, -152], couture: [0, -84], pieds: [0, 0] }, base: [0, 0] },
    journal: { draw: drawJournal, grip: (o) => [99 * (o.k || 1), 0], p2: (o) => [-99 * (o.k || 1), 0], pts: { centre: [0, 0], dessin: [0, -5] }, base: [0, 185] },
  };
  TED.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const HELD = { journal: { k: 0.94 } };
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, HELD[name] || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const PINCE = [[-8, -8], [6, -9], [9, -2], [6, 4], [-6, 6], [-9, 0]];
  function heldParts(skin, seed) {
    const fing = (n) => (n === 'aiguille' ? PINCE : DOIGTS);
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fing(p.tenu) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB) && !p._devB) heldDraw(p.tenuB, p.tenuBO, p); } },
      objetB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (has(p.tenuB) && p._devB) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? fing(p.tenuB) : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran (r renvoyé par une enveloppe TED.roosevelt/collier/morris/rose)
  TED.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom], k = name === 'journal' ? (oo.k || 1) : 1;
    return r.w(arriere ? 'objetB' : 'objet', q[0] * k - g[0], q[1] * k - g[1]);
  };
  // objet droit à l'écran, seconde main sur la seconde prise
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.objetB2 = A.objetB;
    q._deux = !!q._deuxL; q._devB = q.devantB != null ? !!q.devantB : q.tenuB === 'peluche';
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2 && !has(q.tenuB)) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)), q.pickB || 'bas');
      const kk = q.deuxMains === true ? 1 : clamp(q.deuxMains);
      A.armB_up = lerp(A.armB_up || 0, sol.a, kk); A.armB_lo = lerp(A.armB_lo || 0, sol.b, kk); q.handB = 'fist'; q._deux = kk > 0.6;
    }
    return q;
  }
  // pose de l'objet tenu (repère du torse) : la main avant va sur T, l'objet a l'angle écran th
  function tenirA(q, T, th, pick) {
    const sol = ik2(SH_F, T, pick || 'bas'); q.ang.armF_up = sol.a; q.ang.armF_lo = sol.b; q.droit = true; q.ang.objet = th;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o || {});
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // pièces de bras communes
  function upDef(at, base, seed, paint, wt, wTop) {
    return { parent: 'torso', at, pts: armR(LA, wt, wTop), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) };
  }
  function foreDef(back, base, skin, seed, cuffCol, sleeveEnd) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (sleeveEnd != null) fillPts([[-24, sleeveEnd, 1], [24, sleeveEnd, 1], [24, 140, 1], [-24, 140, 1]], skin);
      fillPts([[-40, 76, 1], [40, 76, 1], [40, 140, 1], [-40, 140, 1]], skin); if (k === 'visiere') fillPts(box(-46, 66, -11, 84), skin); handPaintK(k);
      if (cuffCol) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  const ORDER = (avant, heads, apres) => ['armB_up', 'armB_lo', 'objetB'].concat(avant || [], ['legB', 'legF', 'head'], heads, ['torso'], apres || [], ['objetB2', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);

  // =====================================================================
  // THEODORE ROOSEVELT (1902, 44 ans) — trapu, torse bombé ; chapeau de campagne mastic, veste de chasse kaki olive, foulard rouge,
  // cartouchière, culotte mastic, hautes bottes lacées ; pince-nez, grosse moustache en brosse ; fusil à levier
  // =====================================================================
  const TR = { peau: '#d9b08c', peauD: '#bd9370', veste: '#7d7a4a', vesteD: '#67643c', vesteL: '#94905c', foulard: '#8a2a22', ceint: '#5a3a22', laiton: '#b08d45',
    culotte: '#b3a07a', culotteD: '#988662', botte: '#5a3a24', botteD: '#3e2817', chap: '#b9a27a', chapD: '#9a845d', bande: '#3a2a1e', moust: '#3a2a1e', cheveux: '#4a3626' };
  const TR_TORSO = [[-16, -178], [12, -182], [24, -170], [38, -152], [48, -124], [52, -92], [50, -58], [45, -24], [42, 8], [44, 40], [46, 58, 1], [-44, 60, 1], [-44, 30], [-44, -30], [-46, -100], [-44, -146], [-32, -170]];
  const TR_LEG = [[-20, -12], [18, -14], [26, 20], [29, 60], [23, 100], [17, 120], [17, 170], [15, 205], [17, 219], [42, 223], [50, 233, 1], [48, 237, 1], [-18, 238, 1], [-21, 222], [-20, 180], [-21, 140], [-21, 120], [-25, 100], [-29, 60], [-25, 10]];
  const TR_HEAD = [[-16, 16], [12, 16], [13, 4], [22, 0], [30, -4], [33, -12], [32, -20], [31, -26], [33, -30], [33, -36], [38, -41, 1], [34, -48], [30, -57], [30, -66], [27, -80], [15, -93], [-6, -98], [-25, -89], [-34, -68], [-33, -46], [-27, -26], [-20, -6]];
  const TR_HAT = [[76, 4], [40, 9], [0, 11], [-40, 9], [-58, 3], [-67, -6], [-68, -22, 1], [-58, -15], [-44, -8], [-35, -10], [-34, -34], [-28, -48], [-14, -54], [-4, -50], [0, -45], [4, -50], [14, -54], [28, -48], [33, -34], [34, -10], [56, -4]];
  function trLegPaint(back) {
    return () => {
      fillPts([[-40, 118, 1], [60, 118, 1], [60, 260, 1], [-40, 260, 1]], back ? TR.botteD : TR.botte);
      fillPts([[-40, 228, 1], [60, 228, 1], [60, 260, 1], [-40, 260, 1]], '#24180f');
      if (!back) {
        for (let y = 128; y < 206; y += 9) { strokePts([[9, y], [17, y + 5]], 'rgba(220,200,160,0.7)', 1.1); strokePts([[17, y], [9, y + 5]], 'rgba(220,200,160,0.5)', 1); }
        strokePts([[-14, 124], [-12, 214]], 'rgba(255,230,190,0.18)', 2.4);
        fillPts([[-24, 112, 1], [26, 112, 1], [24, 122, 1], [-24, 122, 1]], TR.botteD);
        hatch([[-26, -10], [-8, -10], [-8, 112], [-26, 112]], 0.8, 4, 0.22);
        strokePts([[-2, 10], [6, 60], [4, 100]], 'rgba(90,70,40,0.35)', 1.2);
      } else hatch(null, 0.8, 3.6, 0.3);
    };
  }
  function trMouth(f, x, y) {
    const m = f.mouth || 'n';
    if (m === 'dents') {                                                                  // large sourire à dents, sous la moustache
      fillPts([[x - 12, y - 3], [x + 6, y - 4], [x + 4, y + 5], [x - 3, y + 8], [x - 11, y + 4]], '#3a1714', 0, 0);
      fillPts([[x - 11, y - 3], [x + 5, y - 4], [x + 4, y + 1.5], [x - 10, y + 1.5]], '#f1ead8', 0, 0);
      for (const xx of [-7, -3, 1]) strokePts([[x + xx, y - 3.5], [x + xx, y + 1.5]], 'rgba(120,100,80,0.7)', 0.8);
      strokePts([[x - 14, y - 4], [x - 12, y - 1]], 'rgba(110,60,40,0.6)', 1.2);
      return;
    }
    if (m === 'moue') { fillPts([[x - 2, y - 2], [x + 5, y - 1], [x + 7, y + 3], [x + 2, y + 6], [x - 4, y + 4]], '#a65a4a', 0, 0); strokePts([[x - 4, y + 2], [x + 6, y + 2]], 'rgba(70,25,20,0.8)', 1.2); return; }
    X.mouth(f, x, y);
  }
  function mkRoosevelt() {
    const parts = {
      fusilDos: { parent: 'torso', at: [-18, 44], rest: -1.93, noRivet: true, base: '#000', seed: 7300, pts: OFFP,
        extra: (p) => { if (p.bandouliere) drawFusil({ bretelle: false }); } },
      torso: { parent: null, at: [0, 0], pts: TR_TORSO, base: TR.veste, seed: 7301, paint: (p) => {
        fillPts([[8, -184], [28, -168], [24, -148], [10, -160]], TR.vesteD);                                       // col
        strokePts([[30, -150], [44, -90], [44, -20], [46, 58]], 'rgba(40,38,20,0.55)', 1.4);                        // boutonnage
        for (const y of [-130, -96, -62, 30]) dot(42 - (y > 0 ? -2 : 0), y, 2.4, '#4a3a22');
        for (const [x0, y0, w, h] of [[8, -132, 30, 34], [-36, -130, 30, 32], [10, 18, 32, 34], [-38, 18, 32, 32]]) {     // quatre poches à rabat
          fillPts(box(x0, y0, x0 + w, y0 + h), TR.vesteL); strokePts(box(x0, y0, x0 + w, y0 + h).concat([[x0, y0]]), 'rgba(40,38,20,0.5)', 1);
          fillPts([[x0 - 1, y0 - 2, 1], [x0 + w + 1, y0 - 2, 1], [x0 + w, y0 + 9, 1], [x0 + w / 2, y0 + 12], [x0, y0 + 9, 1]], TR.vesteD); dot(x0 + w / 2, y0 + 7, 1.8, '#4a3a22');
        }
        fillPts([[-46, -12, 1], [46, -14, 1], [46, 6, 1], [-46, 8, 1]], TR.ceint);                                  // cartouchière
        for (let x = -40; x < 42; x += 7) { fillPts(box(x, -12, x + 4, 4), '#6e4a2c'); fillPts(box(x + 0.5, -17, x + 3.5, -11), TR.laiton); }
        fillPts(box(36, -14, 46, 6), TR.laiton);
        if (p.bandouliere) { fillPts([[-12, -172], [-2, -176], [48, -40], [40, -34]], '#4a3020'); strokePts([[-8, -172], [44, -38]], 'rgba(255,220,180,0.2)', 1); }
        fillPts([[-18, -182], [14, -186], [28, -172], [22, -164], [-16, -170]], TR.foulard);                        // foulard rouge noué
        fillPts([[18, -174], [32, -168], [30, -156], [18, -160]], TR.foulard);
        fillPts([[24, -160], [36, -130], [28, -126], [20, -150]], '#74221c'); fillPts([[22, -158], [26, -128], [18, -130], [16, -152]], '#74221c');
        hatch([[-56, -170], [-14, -170], [-12, 62], [-56, 62]], 0.75, 4.2, 0.3);
        shade(46, 0, -44, 0, 0.28);
      } },
      legB: { parent: 'torso', at: [-8, -2], pts: TR_LEG, base: TR.culotteD, seed: 7302, noRivet: true, paint: trLegPaint(true) },
      legF: { parent: 'torso', at: [8, -2], pts: TR_LEG, base: TR.culotte, seed: 7303, paint: trLegPaint(false) },
      armB_up: upDef([-10, -146], TR.vesteD, 7304, null, 17),
      armB_lo: foreDef(true, TR.vesteD, TR.peauD, 7305, '#57542f'),
      head: { parent: 'torso', at: [6, -170], pts: TR_HEAD, base: TR.peau, seed: 7306, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-36, -80], [-14, -76], [-18, -58], [-24, -42], [-28, -30], [-38, -30]], TR.cheveux, 4);          // cheveux courts sous le chapeau
        const crane = [[25, -74], [20, -86], [8, -95], [-8, -99], [-26, -90], [-36, -70], [-37, -48], [-30, -32], [-22, -44], [-18, -60], [-8, -72], [8, -76]];   // cheveux brun foncé courts (visibles sans chapeau)
        fillPts(crane, '#2e2219', 4); strokePts([[6, -94], [-2, -86], [-16, -80]], 'rgba(230,200,170,0.55)', 1.4);              // raie de côté
        for (const [a, b] of [[[18, -82], [-4, -90]], [[-8, -84], [-28, -76]], [[-20, -72], [-32, -56]]]) strokePts([a, b], 'rgba(120,90,60,0.4)', 1.1);
        X.earPaint(-8, -44);
        hatch([[-24, -40], [4, -26], [26, 6], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        strokePts([[14, 2], [26, -2], [32, -12]], 'rgba(120,70,50,0.35)', 1.4);                                    // mâchoire carrée
        dot(18, -32, 9, 'rgba(205,120,100,0.25)');
        X.eye(f, 19, -52); X.brow(f, 19, -61, 'rgba(58,42,30,0.95)', 3.4);
        trMouth(f, 27, -21);
        fillPts([[14, -36], [26, -39], [38, -36], [42, -30], [41, -24], [32, -22], [22, -25], [14, -28]], TR.moust, 6, 0.4);   // moustache en brosse
        if (!SIL()) for (let x = 16; x < 41; x += 3) strokePts([[x, -36], [x + 1, -25]], 'rgba(20,14,10,0.6)', 0.9);
        // pince-nez ovale + cordon noir
        const ring = ell(21, -52, 7.5, 6, 14);
        fillPts(ring, 'rgba(190,225,240,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), '#1e1a16', 1.6);
        strokePts([[28, -53], [31, -52]], '#1e1a16', 1.4); strokePts([[18, -57], [22, -58]], 'rgba(255,255,255,0.7)', 1.1);
        strokePts([[14, -50], [2, -36], [-2, -14], [2, 12]], '#141210', 1);
      } },
      chapeau: { parent: 'head', at: [-2, -86], pts: TR_HAT, base: TR.chap, seed: 7307, noRivet: true, paint: () => {
        fillPts([[-36, -16, 1], [35, -16, 1], [35, -6, 1], [-36, -6, 1]], TR.bande);
        strokePts([[-4, -50], [0, -42], [4, -50]], 'rgba(80,60,30,0.6)', 1.4);
        strokePts([[-26, -46], [-30, -18]], 'rgba(80,60,30,0.3)', 1.2); strokePts([[26, -46], [30, -18]], 'rgba(80,60,30,0.3)', 1.2);
        strokePts([[-64, -18], [-56, -2], [-40, 6], [0, 8], [40, 6], [74, 3]], 'rgba(80,60,30,0.55)', 1.2);
        hatch(null, 0.5, 3.6, 0.22); shade(0, -54, 0, 12, 0.22, [-70, -56, 78, 14]);
      } },
      armF_up: upDef([-2, -146], TR.veste, 7308, null, 17),
      armF_lo: foreDef(false, TR.veste, TR.peau, 7309, TR.vesteD),
    };
    Object.assign(parts, heldParts(TR.peau, 7320));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Roosevelt', order: ['fusilDos'].concat(ORDER([], ['chapeau'])) };
  }
  CH.tedRoosevelt = mkRoosevelt();
  // gestes : marche, fier, jumelles, refus, mainsVides, pinceNez, salut, bouderie, epaule, baisse (voir persos.md)
  TED.roosePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0;
    const k = (n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
    const ep_ = k('epaule'), bs = k('baisse');
    if (ep_ > 0 || bs > 0) q.tenu = 'fusil';
    const libres = { F: !has(q.tenu) && !q.refus && !q.jumelles && !q.mainsVides && !q.pinceNez && !q.salut && !q.fier, B: !has(q.tenuB) && !q.mainsVides && !q.fier && !q.jumelles };
    marcher(q, 1.5, 0.3, 6, libres);
    if (q.tenu === 'fusil') {                                                                   // à la main, canon vers le bas
      if (A.armF_up == null) A.armF_up = 0.1; if (A.armF_lo == null) A.armF_lo = -0.35; if (A.objet == null) A.objet = 1.15;
    }
    if (q.tenuB === 'fusil') { if (A.armB_up == null) A.armB_up = 0.06; if (A.armB_lo == null) A.armB_lo = -0.3; if (A.objetB == null) A.objetB = 1.15; }
    const fi = k('fier'); if (fi > 0) {
      plier(q, -0.07 * fi); A.head = (A.head || 0) - 0.18 * fi; q.dy = (q.dy || 0) - 3 * fi;
      if (!has(q.tenu)) { armTo(q, 'armF', [30, -2], 'bas', fi); q.handF = 'fist'; }
      if (!has(q.tenuB)) { armTo(q, 'armB', [14, 0], 'bas', fi); q.handB = 'fist'; }
      if (!f.mouth) f.mouth = 'dents';
    }
    const ju = k('jumelles'); if (ju > 0) {
      A.head = (A.head || 0) - 0.06 * ju; armTo(q, 'armB', headPt(q, 26, -62), 'avant', ju); if (ju > 0.5) q.handB = 'visiere';   // main ARRIÈRE : le visage reste dégagé
      if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'frown';
    }
    const sa = k('salut'); if (sa > 0) {
      armTo(q, 'armF', headPt(q, 42, -84), 'avant', sa); if (sa > 0.5) q.handF = 'visiere'; A.head = (A.head || 0) + 0.06 * sa;
      if (!f.mouth) f.mouth = 'dents';
    }
    const rf = k('refus'); if (rf > 0) {
      blend(q, 'armF_up', -1.05, rf); blend(q, 'armF_lo', -0.12, rf); if (rf > 0.4) q.handF = 'bas';
      A.head = (A.head || 0) + rf * (0.05 + 0.07 * Math.sin(t * 13)); q.dx = (q.dx || 0) + rf * 2.5 * Math.sin(t * 13 + 1);
      if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight';
    }
    const mv = k('mainsVides'); if (mv > 0) {
      armTo(q, 'armF', [76, -82], 'bas', mv); armTo(q, 'armB', [104, -48], 'bas', mv);
      if (mv > 0.4) { q.handF = 'paume'; q.handB = 'paume'; }
      q.dy = (q.dy || 0) - 5 * mv; A.head = (A.head || 0) + 0.06 * mv; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'tight';
    }
    const pn = k('pinceNez'); if (pn > 0) { armTo(q, 'armF', headPt(q, 40, -54), 'avant', pn); if (pn > 0.5) q.handF = 'fist'; if (!f.brow) f.brow = 'up'; }
    const bo = k('bouderie'); if (bo > 0) {
      A.head = (A.head || 0) + 0.12 * bo; q.dy = (q.dy || 0) + 2 * bo;
      if (!has(q.tenu)) { blend(q, 'armF_up', 0.02, bo); blend(q, 'armF_lo', -0.06, bo); }
      if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'moue';
    }
    if (ep_ > 0 || bs > 0) {                                                                     // épaulé (crosse à l'épaule, canon horizontal), puis baissé (canon vers le sol)
      const w = Math.max(ep_, bs), T = [lerp(154, 118, bs), lerp(-144, -40, bs)];
      armTo(q, 'armF', T, 'bas', w);
      A.objet = lerp(lerp(1.15, 0, ep_), 0.85, bs); q.droit = true; q.deuxMains = smooth(0.15, 0.7, w);
      A.head = (A.head || 0) + 0.06 * ep_ * (1 - bs);
    }
    if (q.bandouliere && q.tenu === 'fusil') q.bandouliere = false;
    return finish(q);
  };
  TED.roosevelt = (pose, x, y, s, o) => run(CH.tedRoosevelt, TED.roosePose(pose), x, y, s == null ? 0.9 : s, o);

  // point écran → repère du torse (pour les options `cible`)
  function toTorso(def, q, x, y, s, dir, Pt) {
    const T0 = cx_().getTransform();
    const root = T0.translate(x, y).scale(s * (dir || 1), s).rotate((q.tilt || 0) * D).translate(q.dx || 0, def.hipY + (q.dy || 0));
    const pp = new DOMPoint(Pt[0], Pt[1]).matrixTransform(root.inverse()); return [pp.x, pp.y];
  }
  function avecCible(def, poseFn, pose, x, y, s, o) {
    let q = poseFn(pose);
    if (pose && pose.cible) { const L = toTorso(def, q, x, y, s, (o || {}).dir, pose.cible); q = poseFn(Object.assign({}, pose, { cibleL: L })); }
    return q;
  }
  TED.toTorso = toTorso;

  // =====================================================================
  // HOLT COLLIER (1902, ≈ 55 ans) — guide de chasse : feutre noir à très larges bords cabossé, barbe courte grise, longue veste de laine brun-rouge,
  // chemise ivoire, gilet ocre, pantalon gris ardoise, guêtres de cuir ; cor de chasse en bandoulière, corde enroulée à l'épaule
  // =====================================================================
  const CO = { peau: '#5a3a28', peauD: '#472d1f', barbe: '#9a9a94', barbeL: '#c4c2ba', chap: '#1e1a18', chapL: '#3a3430', veste: '#7a3a26', vesteD: '#62301f', vesteL: '#8c4a32',
    chemise: '#e6dfcc', gilet: '#a8823a', pant: '#5a5f66', pantD: '#4a4e54', guetre: '#6a4a2c', guetreD: '#523822', chaus: '#22180f' };
  const CO_TORSO = [[-14, -178], [10, -182], [20, -170], [32, -150], [40, -118], [42, -80], [40, -40], [38, 0], [44, 50], [50, 110, 1], [-46, 112, 1], [-42, 50], [-40, 0], [-40, -60], [-42, -110], [-40, -148], [-28, -170]];
  const CO_HEAD = [[-14, 16], [12, 16], [13, 2], [18, -4], [26, -8], [30, -14], [29, -20], [31, -24], [30, -28], [33, -33], [39, -39, 1], [35, -46], [31, -56], [31, -64], [28, -78], [16, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const CO_HAT = [[88, 20], [70, 12], [40, 6], [0, 5], [-40, 7], [-70, 13], [-88, 22], [-90, 16, 1], [-70, 2], [-46, -4], [-33, -6], [-35, -30], [-28, -44], [-14, -42], [-4, -50], [10, -49], [24, -45], [32, -32], [33, -6], [50, -3], [72, 4], [90, 14, 1]];
  function coLegPaint(back) {
    return () => {
      fillPts([[-40, 136, 1], [60, 136, 1], [60, 216, 1], [-40, 216, 1]], back ? CO.guetreD : CO.guetre);
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], CO.chaus);
      if (!back) {
        for (const y of [150, 176, 200]) { fillPts(box(10, y - 3, 20, y + 3), '#8a7a5a'); strokePts([[-18, y], [12, y]], 'rgba(30,20,10,0.5)', 1); }
        strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.22)', 1.3);
        hatch([[-26, -20], [-6, -20], [-6, 136], [-26, 136]], 0.8, 4, 0.25);
      } else hatch(null, 0.8, 3.6, 0.3);
    };
  }
  function mkCollier() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CO_TORSO, base: CO.veste, seed: 7401, paint: (p) => {
        fillPts([[8, -182], [22, -172], [26, -150], [10, -164]], CO.chemise);                                  // col de chemise
        fillPts([[12, -168], [26, -150], [32, -110], [30, -40], [22, -36], [16, -110]], CO.gilet);               // gilet ocre (veste ouverte)
        for (const y of [-136, -110, -84, -58]) dot(27, y, 1.8, '#5a4420');
        strokePts([[10, -176], [18, -120], [20, -36], [36, 0], [48, 108]], 'rgba(40,16,10,0.6)', 1.5);          // bord de la veste
        fillPts([[10, -178], [24, -160], [22, -132], [14, -150]], CO.vesteD);                                    // revers
        for (const [x0, y0] of [[-6, 18], [-36, 22]]) { fillPts(box(x0, y0, x0 + 30, y0 + 8), CO.vesteD); strokePts([[x0, y0 + 8], [x0 + 30, y0 + 8]], 'rgba(30,12,8,0.5)', 1); }
        strokePts([[-20, 60], [-24, 110]], 'rgba(30,12,8,0.35)', 1.2); strokePts([[10, 60], [14, 110]], 'rgba(30,12,8,0.35)', 1.2);
        if (!p._corMain) { fillPts([[-6, -178], [4, -180], [36, 24], [26, 28]], '#3a2618'); strokePts([[-2, -178], [30, 24]], 'rgba(255,220,180,0.18)', 1); }
        hatch([[-56, -170], [-14, -170], [-12, 114], [-56, 114]], 0.75, 4.2, 0.32);
        hatch(null, -0.7, 7, 0.08, 1, '255,230,210');
        shade(42, 0, -44, 0, 0.3);
      } },
      corHanche: { parent: 'torso', at: [22, 42], rest: 0.5, noRivet: true, base: '#000', seed: 7410, pts: OFFP,
        extra: (p) => { if (!p._corMain) { const c = cx_(); c.save(); c.scale(0.82, 0.82); drawCor({}); c.restore(); } } },
      cordeEpaule: { parent: 'torso', at: [0, -118], noRivet: true, base: '#000', seed: 7411, pts: OFFP, extra: (p) => {
        if (p.hide && p.hide.cordeEpaule) return;
        for (const [rx, ry, a, dx] of [[30, 52, 0.42, 0], [27, 49, 0.36, 4], [32, 55, 0.48, -4]]) cordeSeg(rot(ell(dx, 0, rx, ry, 18), a).concat([rot([[dx + rx, 0]], a)[0]]), 4.6);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(0.95), base: CO.pantD, seed: 7402, noRivet: true, paint: coLegPaint(true) },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(0.95), base: CO.pant, seed: 7403, paint: coLegPaint(false) },
      armB_up: upDef([-10, -146], CO.vesteD, 7404, null, 16),
      armB_lo: foreDef(true, CO.vesteD, CO.peauD, 7405, CO.chemise),
      head: { parent: 'torso', at: [6, -170], pts: CO_HEAD, base: CO.peau, seed: 7406, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-36, -76], [-16, -74], [-20, -56], [-26, -40], [-36, -38]], CO.barbe, 4);                    // cheveux gris ras
        fillPts([[-6, -46], [-2, -42], [-4, -36]], 'rgba(0,0,0,0.15)');
        fillPts([[-12, -54], [-2, -52], [2, -42], [-2, -32], [-10, -32], [-14, -42]], CO.peauD); strokePts([[-4, -50], [-8, -46], [-8, -38], [-4, -36]], 'rgba(20,10,5,0.6)', 1.1);   // oreille
        hatch([[-24, -40], [4, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.25);
        strokePts([[30, -46], [34, -40]], 'rgba(0,0,0,0.25)', 1.2);
        X.eye(f, 18, -53); X.brow(f, 18, -61, 'rgba(200,198,190,0.95)', 2.6);
        strokePts([[8, -66], [22, -67]], 'rgba(0,0,0,0.22)', 1);
        const beard = [[33, -30], [31, -16], [26, -4], [14, 6], [0, 10], [-14, 6], [-20, -12], [-16, -26], [-6, -22], [8, -18], [20, -20], [26, -26]];
        fillPts(beard, CO.barbe, 7, 0.6);
        if (!SIL()) { const R = M.rng(7407); for (let i = 0; i < 40; i++) { const x = lerp(-16, 30, R()), y = lerp(-24, 6, R()); dot(x, y, 1, R() > 0.5 ? CO.barbeL : 'rgba(60,60,60,0.5)'); } }
        fillPts([[16, -33], [26, -36], [36, -34], [38, -29], [30, -27], [20, -28]], CO.barbeL, 6, 0.4);        // moustache grise
        X.mouth(f, 28, -23, 'rgba(60,20,18,0.95)');
      } },
      chapeau: { parent: 'head', at: [-2, -84], pts: CO_HAT, base: CO.chap, seed: 7408, noRivet: true, paint: () => {
        fillPts([[-34, -14, 1], [33, -14, 1], [33, -6, 1], [-34, -6, 1]], '#2e2826');
        strokePts([[-14, -42], [-6, -34], [2, -46]], 'rgba(120,110,100,0.5)', 1.3);                              // creux cabossé
        strokePts([[-84, 18], [-60, 6], [0, 2], [60, 4], [86, 16]], 'rgba(140,130,120,0.35)', 1.2);
        strokePts([[-24, -38], [-26, -12]], 'rgba(140,130,120,0.25)', 1.2);
        hatch(null, 0.5, 3.4, 0.25, 1, '200,190,180');
        shade(0, -50, 0, 22, 0.25, [-92, -52, 92, 24]);
      } },
      armF_up: upDef([-2, -146], CO.veste, 7409, null, 16),
      armF_lo: foreDef(false, CO.veste, CO.peau, 7412, CO.chemise),
    };
    Object.assign(parts, heldParts(CO.peau, 7420));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Collier', order: ORDER([], ['chapeau'], ['corHanche', 'cordeEpaule']) };
  }
  CH.tedCollier = mkCollier();
  // gestes : marche, piste (+visiere), corde (+tire), noue (+cible), presente, cor, degu
  TED.collierPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0;
    const k = (n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
    const pi = k('piste'), co = k('corde'), nu = k('noue'), pr = k('presente'), cr = k('cor'), dg = k('degu');
    if (co > 0 || nu > 0) { if (!q.tenu) q.tenu = 'corde'; q.tenuO = Object.assign({ tire: k('tire'), noue: nu > 0.5 }, q.tenuO); }
    if (cr > 0.5) { q.tenu = 'cor'; q._corMain = true; }
    marcher(q, 1.4, 0.3, 4, { F: !has(q.tenu) && !pi && !pr, B: !has(q.tenuB) && !pi && !pr && !co && !nu });
    if (pi > 0) {
      plier(q, 0.32 * pi); A.head = (A.head || 0) + (q.visiere ? -0.2 : 0.3) * pi;
      if (q.visiere) { armTo(q, 'armB', headPt(q, 24, -58), 'avant', pi); if (pi > 0.5) q.handB = 'visiere'; armTo(q, 'armF', [30, 54], 'bas', pi); if (pi > 0.5) q.handF = 'open'; }   // visière : main ARRIÈRE (visage dégagé), main avant sur la cuisse
      else { armTo(q, 'armF', [104, 30], 'bas', pi); if (pi > 0.5) q.handF = 'bas'; armTo(q, 'armB', [26, 56], 'bas', pi); if (pi > 0.5) q.handB = 'open'; }
      if (!f.brow) f.brow = 'frown';
    }
    if (co > 0) {
      const ti = k('tire');
      plier(q, -0.1 * ti); A.legF = (A.legF || 0) - 0.22 * ti; A.legB = (A.legB || 0) + 0.06 * ti;
      armTo(q, 'armF', [lerp(112, 90, ti), lerp(-50, -66, ti)], 'bas', co); A.objet = 0.04; q.deuxMains = co;
      if (ti > 0.3 && !f.brow) f.brow = 'frown';
    }
    if (nu > 0) {
      const L = q.cibleL || [100, -40], w = 3 * Math.sin(t * 9);
      armTo(q, 'armF', [L[0] + 10 + w, L[1] + 2], 'bas', nu); A.objet = 0.1; q.deuxMains = nu; A.head = (A.head || 0) + 0.2 * nu;
    }
    if (pr > 0) {
      plier(q, 0.1 * pr); A.head = (A.head || 0) + 0.12 * pr;
      blend(q, 'armF_up', -1.32, pr); blend(q, 'armF_lo', -0.18, pr); if (pr > 0.4) q.handF = 'paume';
      armTo(q, 'armB', [34, -46], 'bas', pr); if (pr > 0.4) q.handB = 'open';
      if (!f.mouth) f.mouth = 'smile';
    }
    if (cr > 0) {
      A.head = (A.head || 0) - 0.14 * cr;
      if (cr > 0.5) {
        const m = headPt(q, 36, -24), th = -0.35;
        const e = mp(new DOMMatrix().rotate(th * D), [-42, -16]);
        armTo(q, 'armF', [m[0] - e[0], m[1] - e[1]], 'bas', 1); A.objet = th; q.droit = true;
      } else blend(q, 'armF_up', -0.6, cr * 2);
      if (!f.eyes) f.eyes = 'half';
    }
    if (dg > 0) {
      q.dy = (q.dy || 0) + 4 * dg; A.head = (A.head || 0) + 0.28 * dg;
      if (!has(q.tenu)) { blend(q, 'armF_up', 0.05, dg); blend(q, 'armF_lo', -0.05, dg); }
      if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
    }
    return finish(q);
  };
  TED.collier = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; return run(CH.tedCollier, avecCible(CH.tedCollier, TED.collierPose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // MORRIS MICHTOM (1902, ≈ 32 ans) — marchand de Brooklyn, mince : casquette plate gris ardoise à huit pans et bouton, cheveux noirs courts,
  // fine moustache noire, chemise blanche aux manches retroussées + brassards noirs, gilet bordeaux, long tablier vert éteint, pantalon gris foncé
  // =====================================================================
  const MO = { peau: '#e2bf9c', peauD: '#c49c7a', cap: '#5f6b77', capD: '#47515c', cheveux: '#1e1a1a', chemise: '#efece4', chemiseD: '#d3cfc3', brassard: '#1c1a1c',
    gilet: '#6e2a30', giletD: '#5a2026', tablier: '#55654a', tablierD: '#465540', pant: '#3e3e44', pantD: '#323238', chaus: '#1e1a18' };
  const MO_TORSO = [[-12, -178], [10, -182], [18, -170], [28, -150], [33, -114], [33, -70], [31, -30], [30, 0], [38, 60], [40, 120], [42, 150, 1], [-6, 152, 1], [-6, 30], [-28, 26], [-30, 0], [-30, -60], [-32, -110], [-32, -148], [-24, -170]];
  const MO_HEAD = [[-13, 16], [9, 16], [10, 2], [15, -6], [22, -10], [26, -16], [25, -21], [27, -25], [26, -29], [30, -34], [38, -40, 1], [32, -47], [28, -56], [28, -64], [25, -78], [13, -91], [-6, -96], [-24, -87], [-32, -68], [-31, -46], [-24, -28], [-17, -8]];
  const MO_CAP = [[-40, 10], [-50, 0], [-50, -16], [-38, -32], [-14, -44], [14, -46], [40, -38], [58, -22], [62, -10], [56, -4], [72, 2, 1], [70, 9, 1], [30, 10], [0, 12], [-30, 13]];
  function moHead(cap) {
    return (p) => {
      const f = p.face || {};
      fillPts([[-36, -80], [-10, -82], [10, -84], [-14, -72], [-20, -52], [-24, -38], [-32, -34], [-38, -50]], MO.cheveux, 4);
      X.earPaint(-8, -44);
      hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
      dot(14, -32, 8, 'rgba(205,130,110,0.2)');
      X.eye(f, 16, -52); X.brow(f, 16, -60, 'rgba(25,20,20,0.95)', 2.2);
      X.mouth(f, 25, -24);
      fillPts([[20, -31], [30, -34], [36, -32], [33, -29], [26, -28]], MO.cheveux, 0, 0.2);              // fine moustache
    };
  }
  const moCapPaint = () => {
    for (let x = -50; x < 64; x += 9) strokePts([[x, -48], [x + 4, 12]], 'rgba(200,210,220,0.22)', 1);           // petits carreaux
    for (let y = -42; y < 12; y += 9) strokePts([[-52, y], [64, y]], 'rgba(200,210,220,0.18)', 1);
    for (const x of [-34, -12, 12, 34]) strokePts([[x * 0.4, -45], [x, -4]], 'rgba(30,36,44,0.5)', 1.1);
    dot(0, -45, 5, MO.capD); dot(-1, -46, 1.6, 'rgba(255,255,255,0.4)'); strokePts([[-46, 2], [0, 6], [58, -2]], 'rgba(30,36,44,0.55)', 1.4);
    fillPts([[54, -4], [72, 2], [70, 9], [46, 8]], MO.capD);
    hatch(null, 0.5, 3.4, 0.22); shade(0, -36, 0, 12, 0.22, [-48, -38, 70, 14]);
  };
  function moForeDef(back) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(hk(p)), base: back ? MO.peauD : MO.peau, seed: back ? 7505 : 7509, paint: (p) => {
      const k = hk(p);
      fillPts([[-20, -16, 1], [20, -16, 1], [19, 16, 1], [-19, 16, 1]], back ? MO.chemiseD : MO.chemise);   // manche retroussée au coude
      strokePts([[-16, 8], [16, 6]], 'rgba(120,115,100,0.6)', 1); strokePts([[-16, 14], [16, 12]], 'rgba(120,115,100,0.5)', 1);
      if (k === 'visiere') fillPts(box(-46, 66, -11, 84), back ? MO.peauD : MO.peau);
      handPaintK(k);
      for (let y = 26; y < 70; y += 9) strokePts([[-6, y], [-2, y + 4]], 'rgba(60,30,20,0.35)', 0.8);
      hatch([[-14, 18], [-4, 18], [-4, 70], [-14, 70]], 0.9, 3.8, 0.18);
    } };
  }
  function mkMorris() {
    const torsoPaint = () => {
      fillPts([[-34, -172], [-4, -176], [14, -170], [28, -150], [33, -114], [33, -60], [30, 4], [-34, 4]], MO.gilet);         // gilet
      for (const y of [-150, -126, -102, -78]) dot(24, y, 1.8, '#2a1214');
      fillPts([[2, -184], [16, -172], [10, -158], [0, -168]], MO.chemise);                                                       // col de chemise
      strokePts([[4, -170], [2, -140], [0, -124]], '#30382a', 2);                                                                // cordon du tablier
      const tab = [[0, -124], [28, -122], [33, -70], [31, -30], [30, 0], [38, 60], [40, 120], [42, 152], [-6, 154], [-6, 30], [-2, -20], [-2, -80]];
      fillPts(tab, MO.tablier);
      strokePts([[30, 0], [38, 60], [40, 120]], 'rgba(255,255,255,0.12)', 2);
      for (const x of [8, 20]) strokePts([[x, 10], [x + 2, 80], [x + 4, 150]], 'rgba(30,40,24,0.35)', 1.2);
      fillPts(box(-32, -6, 31, 2), MO.tablierD); fillPts([[-30, -4], [-44, -14], [-44, 8]], MO.tablierD); fillPts([[-30, -2], [-40, 20], [-34, 22]], MO.tablierD);
      fillPts(box(6, 24, 26, 44), MO.tablierD); strokePts([[6, 24], [26, 24]], 'rgba(20,28,16,0.6)', 1);                         // poche
      hatch([[-50, -170], [-12, -170], [-8, 154], [-50, 154]], 0.75, 4.2, 0.28);
      shade(36, 0, -34, 0, 0.26);
    };
    const legP = (back) => () => {
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], MO.chaus);
      if (!back) { strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
    };
    const overJ = (p) => p.tenu === 'journal';
    const parts = {
      torso: { parent: null, at: [0, 0], pts: MO_TORSO, base: MO.chemise, seed: 7501, paint: torsoPaint },
      legB: { parent: 'torso', at: [-5, -2], pts: X.legPts(0.88), base: MO.pantD, seed: 7502, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [5, -2], pts: X.legPts(0.88), base: MO.pant, seed: 7503, paint: legP(false) },
      armB_up: upDef([-10, -146], MO.chemiseD, 7504, () => { fillPts(box(-20, 36, 20, 48), MO.brassard); hatch(null, 0.9, 3.8, 0.25); }, 14),
      armB_lo: moForeDef(true),
      head: { parent: 'torso', at: [6, -170], pts: (p) => (overJ(p) ? OFFP : MO_HEAD), base: MO.peau, seed: 7506, noRivet: true, paint: moHead() },
      casquette: { parent: 'head', at: [-2, -84], pts: (p) => (overJ(p) ? OFFP : MO_CAP), base: MO.cap, seed: 7507, noRivet: true, paint: moCapPaint },
      armF_up: upDef([-2, -146], MO.chemise, 7508, () => { fillPts(box(-20, 36, 20, 48), MO.brassard); strokePts([[-14, 37], [14, 37]], 'rgba(255,255,255,0.2)', 1); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.22); }, 14),
      armF_lo: moForeDef(false),
      // tête redessinée PAR-DESSUS le journal tenu (sinon la page cacherait le visage)
      headJ: { parent: 'torso', at: [6, -170], pts: (p) => (overJ(p) ? MO_HEAD : OFFP), base: MO.peau, seed: 7516, noRivet: true, paint: moHead() },
      capJ: { parent: 'headJ', at: [-2, -84], pts: (p) => (overJ(p) ? MO_CAP : OFFP), base: MO.cap, seed: 7517, noRivet: true, paint: moCapPaint },
    };
    Object.assign(parts, heldParts(MO.peau, 7520));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-22, 18] }, nom: 'Morris', order: ORDER([], ['casquette']).concat(['headJ', 'capJ']) };
  }
  CH.tedMorris = mkMorris();
  // gestes : marche, lit (journal), attendri, idee, pose (+cible), presente, salut
  TED.morrisPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face;
    const k = (n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
    const li = k('lit'), at = k('attendri'), id = k('idee'), po = k('pose'), pr = k('presente'), sa = k('salut');
    if (li > 0) q.tenu = 'journal';
    marcher(q, 1.6, 0.28, 4, { F: !has(q.tenu) && !at && !id && !pr && !sa, B: !has(q.tenuB) && !at && !has(q.tenu) });
    if (li > 0) {                                                   // les deux bras vont ensemble vers la pose finale (la main arrière n'est jamais derrière l'épaule)
      const full = prep({ ang: {}, tenu: 'journal', tenuO: q.tenuO, droit: true, deuxMains: true });
      armTo(full, 'armF', [183, -100], 'bas', 1); full.ang.objet = 0; finish(full);
      for (const n of ['armF_up', 'armF_lo', 'armB_up', 'armB_lo']) blend(q, n, full.ang[n], li);
      A.objet = 0; q.droit = true; q.deuxMains = false; q._deuxL = li > 0.85; if (li > 0.6) q.handB = 'fist';
      A.head = (A.head || 0) + 0.1 * li;
    }
    if (q.tenu === 'peluche' && !li) { q.tenuO = Object.assign({}, q.tenuO); if (!po) { armTo(q, 'armF', [132, -70], 'bas', 1); q.deuxMains = true; } }
    if (po > 0) {
      const L = q.cibleL || [150, -10];
      plier(q, 0.12 * po); armTo(q, 'armF', L, 'bas', po); q.deuxMains = true; A.head = (A.head || 0) + 0.2 * po;
    }
    if (at > 0) {
      armTo(q, 'armF', [8, -112], 'avant', at); if (at > 0.5) q.handF = 'open';
      A.head = (A.head || 0) + 0.16 * at; if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'worry';
    }
    if (id > 0) {
      armTo(q, 'armF', [64, -150], 'bas', id); if (id > 0.5) q.handF = 'paume';
      A.head = (A.head || 0) - 0.08 * id; if (!f.brow) f.brow = 'up'; if (!f.eyes) f.eyes = 'wide'; if (!f.mouth) f.mouth = 'o';
    }
    if (pr > 0) {
      blend(q, 'armF_up', -1.45, pr); blend(q, 'armF_lo', -0.35, pr); if (pr > 0.4) q.handF = 'paume';
      A.head = (A.head || 0) - 0.04 * pr; if (!f.mouth) f.mouth = 'smile';
    }
    if (sa > 0) { armTo(q, 'armF', headPt(q, 50, -90), 'avant', sa); if (sa > 0.5) q.handF = 'visiere'; if (!f.mouth) f.mouth = 'smile'; }
    return finish(q);
  };
  TED.morris = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; return run(CH.tedMorris, avecCible(CH.tedMorris, TED.morrisPose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // ROSE MICHTOM (1902) — chignon noir haut, visage rond, robe bleu ardoise à col montant et manches gigot, tablier court ivoire à bavette,
  // broche dorée ; debout (jupe longue, bottines) ou assise sur un tabouret
  // =====================================================================
  const RO = { peau: '#e8c8a8', peauD: '#cba486', cheveux: '#1c1616', robe: '#4a5a74', robeD: '#3b4860', robeL: '#5b6c88', tablier: '#ece4d0', tablierD: '#d4c9b0', broche: '#c9a24a', bottine: '#2a1e1a', bois: '#8a6238' };
  const RO_TORSO = [[-12, -176], [8, -180], [16, -170], [24, -150], [31, -122], [27, -88], [21, -62], [30, -30], [40, 40], [50, 120], [57, 200], [60, 222, 1], [-52, 224, 1], [-48, 150], [-40, 60], [-30, -20], [-22, -62], [-26, -96], [-30, -130], [-30, -150], [-22, -170]];
  const RO_ASSISE = [[-12, -176], [8, -180], [16, -170], [24, -150], [31, -122], [27, -88], [21, -62], [32, -28], [60, -14], [104, -10], [118, 4], [114, 40], [118, 90], [124, 134, 1], [40, 136, 1], [-40, 60], [-38, 10], [-30, -20], [-22, -62], [-26, -96], [-30, -130], [-30, -150], [-22, -170]];
  const RO_HEAD = [[-12, 16], [10, 16], [14, 6], [20, -2], [25, -9], [27, -15], [26, -19], [28, -22], [27, -26], [28, -30], [32, -35, 1], [29, -42], [28, -52], [28, -62], [24, -75], [12, -86], [-6, -90], [-22, -84], [-32, -66], [-32, -44], [-26, -26], [-18, -8]];
  const RO_HAIR = [[26, -66], [24, -80], [14, -90], [0, -96], [-6, -112], [2, -124], [-8, -136], [-26, -132], [-30, -116], [-24, -102], [-34, -88], [-40, -66], [-38, -42], [-30, -28], [-22, -34], [-20, -54], [-8, -74], [10, -78]];
  const RO_LEG = [[-12, -10], [12, -12], [14, 40], [12, 110], [10, 160], [8, 200], [9, 216], [30, 222], [38, 232, 1], [-12, 236, 1], [-14, 222], [-12, 200], [-14, 160], [-16, 110], [-15, 40]];
  const RO_TAB = [[-40, -4], [26, -6], [30, 6], [16, 10], [18, 132, 1], [10, 132, 1], [6, 12], [-28, 12], [-30, 132, 1], [-38, 132, 1], [-36, 10]];
  function mkRose() {
    const parts = {
      tabouret: { parent: 'torso', at: [-14, 4], pts: (p) => (p.assise ? RO_TAB : OFFP), base: RO.bois, seed: 7600, noRivet: true, paint: () => { strokePts([[-38, 0], [28, -2]], 'rgba(255,220,170,0.3)', 1.4); hatch(null, 0.3, 4, 0.25); } },
      torso: { parent: null, at: [0, 0], pts: (p) => (p.assise ? RO_ASSISE : RO_TORSO), base: RO.robe, seed: 7601, paint: (p) => {
        const as = !!p.assise;
        fillPts([[-10, -184], [10, -186], [18, -168], [12, -160], [-8, -164]], RO.robeD);                                 // col montant
        strokePts([[-8, -176], [14, -178]], RO.tablier, 1.4);
        fillPts([[4, -128], [27, -124], [23, -66], [6, -64]], RO.tablier);                                                 // bavette
        strokePts([[4, -128], [-4, -170]], RO.tablierD, 2.4);
        const tab = as ? [[0, -66], [24, -64], [36, -26], [70, -14], [100, -10], [104, 20], [70, 26], [30, 8], [4, -20]] : [[0, -66], [24, -64], [34, 0], [44, 84], [8, 90], [2, 0]];
        fillPts(tab, RO.tablier); strokePts(tab.slice(1, 4), 'rgba(120,105,80,0.5)', 1.2);
        fillPts([[-26, -70, 1], [24, -70, 1], [24, -60, 1], [-26, -60, 1]], RO.robeD);                                    // ceinture
        strokePts([[-24, -64], [-36, -44], [-32, -34]], RO.tablier, 3); strokePts([[-24, -64], [-38, -54]], RO.tablier, 3);
        dot(18, -166, 4.2, RO.broche); dot(17, -167, 1.4, 'rgba(255,250,220,0.9)');                                     // broche
        if (!as) { for (const [x0, x1] of [[-14, -30], [-4, -12], [-26, -44], [10, 24]]) strokePts([[x0, -40], [(x0 + x1) / 2, 80], [x1, 220]], 'rgba(20,30,50,0.4)', 1.2); }
        else {
          for (const x of [70, 90, 108]) strokePts([[x, 20], [x + 4, 130]], 'rgba(20,30,50,0.4)', 1.2);
          for (const dx of [0, 18]) { fillPts([[102 + dx, 118], [124 + dx, 120], [134 + dx, 130], [132 + dx, 138, 1], [100 + dx, 138, 1]], RO.bottine); }   // bottines
        }
        hatch([[-56, -170], [-14, -170], [-20, 226], [-56, 226]], 0.75, 4.4, 0.26, 1.05, '220,225,235');
        shade(40, 0, -44, 0, 0.26);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: RO_LEG, base: '#3a3036', seed: 7602, noRivet: true, paint: () => { fillPts([[-30, 200, 1], [50, 200, 1], [50, 250, 1], [-30, 250, 1]], RO.bottine); hatch(null, 0.8, 3.6, 0.3); } },
      legF: { parent: 'torso', at: [6, -2], pts: RO_LEG, base: '#4a3e44', seed: 7603, paint: () => { fillPts([[-30, 200, 1], [50, 200, 1], [50, 250, 1], [-30, 250, 1]], RO.bottine); strokePts([[16, 222], [34, 228]], 'rgba(255,255,255,0.22)', 1.2); } },
      armB_up: upDef([-10, -146], RO.robeD, 7604, () => { for (const x of [-14, -6, 2, 10]) strokePts([[x, -24], [x * 0.6, 30]], 'rgba(20,30,50,0.4)', 1); hatch(null, 0.9, 3.8, 0.3); }, 14, 29),
      armB_lo: foreDef(true, RO.robeD, RO.peauD, 7605, RO.tablier),
      head: { parent: 'torso', at: [6, -172], pts: RO_HEAD, base: RO.peau, seed: 7606, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-6, -44); dot(-4, -34, 2.4, RO.broche);
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.2);
        dot(13, -30, 8, 'rgba(215,120,110,0.32)');
        if (f.eyes === 'rire') { strokePts([[9, -45], [15, -48], [21, -45]], 'rgba(28,16,14,0.95)', 1.8); }
        else { X.eye(f, 15, -45, 0.95); strokePts([[9, -48], [7, -51]], 'rgba(28,16,14,0.9)', 1.2); }
        X.brow(f, 15, -53, 'rgba(40,24,20,0.9)', 1.8);
        if (f.mouth === 'rire') { fillPts([[16, -22], [26, -23], [24, -16], [18, -15]], '#5a1a18', 0, 0); fillPts([[17, -22], [25, -23], [25, -20], [17, -20]], '#f1ead8', 0, 0); }
        else { fillPts([[24, -22], [20, -21], [18, -19], [22, -18]], '#a24848', 0, 0); X.mouth(f, 23, -20, 'rgba(140,45,45,0.9)'); }
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: RO_HAIR, base: RO.cheveux, seed: 7607, noRivet: true, paint: () => {
        strokePts([[20, -74], [6, -86], [-10, -92]], 'rgba(200,200,220,0.25)', 1.6);
        strokePts(ep(-12, -120, 12, 10, 10, -PI, PI * 0.6), 'rgba(160,160,180,0.3)', 1.2);
        hatch(null, 0.5, 3.4, 0.2, 1, '180,180,200');
      } },
      armF_up: upDef([-2, -146], RO.robe, 7608, () => { for (const x of [-16, -8, 0, 8, 16]) strokePts([[x, -26], [x * 0.55, 34]], 'rgba(20,30,50,0.4)', 1); strokePts([[-12, -18], [-8, 30]], 'rgba(255,255,255,0.18)', 2); hatch([[-22, -20], [-3, -20], [-3, 100], [-22, 100]], 0.9, 3.8, 0.22); }, 14, 23),
      armF_lo: foreDef(false, RO.robe, RO.peau, 7609, RO.tablier),
    };
    Object.assign(parts, heldParts(RO.peau, 7620));
    return { hipY: -236, parts, handLen: 100, rod: { part: 'torso', at: [-16, 40] }, nom: 'Rose', order: ['tabouret'].concat(ORDER([], ['cheveux'])) };
  }
  CH.tedRose = mkRose();
  // gestes : marche, assise, coud (aiguille + ouvrage), fiere, tend, rit, reverence
  TED.rosePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0;
    const k = (n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
    const cd = k('coud'), fi = k('fiere'), te = k('tend'), ri = k('rit'), rv = k('reverence');
    if (q.assise) { q.dy = (q.dy || 0) + 100; q.hide.legF = 1; q.hide.legB = 1; }
    if (fi > 0 || te > 0) { q.tenu = 'peluche'; q.deuxMains = true; }
    marcher(q, 1.6, 0.22, 3, { F: !has(q.tenu) && !cd && !rv, B: !has(q.tenuB) && !cd && !rv });
    if (cd > 0) {
      if (!q.tenu) q.tenu = 'aiguille';
      if (q.tenuB == null) q.tenuB = 'peluche';
      q.tenuBO = Object.assign({ prise: 'g' }, q.tenuBO);
      armTo(q, 'armB', [40, -112], 'bas', cd);
      const u = 0.5 - 0.5 * Math.cos(t * TAU * 0.7), W = [86, -78];
      armTo(q, 'armF', [W[0] + 16 + 34 * u, W[1] - 4 - 66 * u], 'bas', cd); A.objet = lerp(0.3, -0.5, u);
      A.head = (A.head || 0) + 0.22 * cd; if (!f.eyes) f.eyes = 'half';
      q._fil = cd > 0.5;
    }
    if (fi > 0) { armTo(q, 'armF', [136, -74], 'bas', fi); A.objet = 0; A.head = (A.head || 0) - 0.1 * fi; if (!f.mouth) f.mouth = 'smile'; }
    if (te > 0) { plier(q, 0.08 * te); armTo(q, 'armF', [lerp(136, 172, te), lerp(-74, -100, te)], 'bas', 1); A.objet = 0; if (!f.mouth) f.mouth = 'smile'; }
    if (ri > 0) {
      const sh = Math.abs(Math.sin(t * 14));
      q.dy = (q.dy || 0) - 2.5 * sh * ri; A.head = (A.head || 0) - (0.1 + 0.03 * Math.sin(t * 14)) * ri;
      if (!f.mouth) f.mouth = 'rire'; if (!f.eyes) f.eyes = 'rire';
      if (!has(q.tenu) && !cd) { armTo(q, 'armF', [30, -90], 'bas', ri); q.handF = 'open'; }
    }
    if (rv > 0) {
      plier(q, 0.14 * rv); A.head = (A.head || 0) + 0.26 * rv;
      armTo(q, 'armF', [38, 30], 'bas', rv); armTo(q, 'armB', [12, 28], 'bas', rv); q.handF = 'fist'; q.handB = 'fist';
      if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'smile';
    }
    return finish(q);
  };
  TED.rose = (pose, x, y, s, o) => {
    s = s == null ? 0.88 : s;
    const q = TED.rosePose(pose), r = run(CH.tedRose, q, x, y, s, o);
    if (q._fil && !SIL()) {                                                                     // fil : du chas de l'aiguille, en arc, jusqu'à la couture de l'ouvrage
      const a = TED.pt(r, 'chas'), b = r.tenuB === 'peluche' ? TED.pt(r, 'couture', true) : r.w('armB_lo', 4, 96);
      if (a && b) {
        const c = cx_(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        const m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 40 * s];
        c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], b[0], b[1]);
        c.strokeStyle = P.sang; c.lineWidth = 1.6; c.stroke(); c.restore();
      }
    }
    return r;
  };

  // =====================================================================
  // L'OURS NOIR — def.libre (animal). Origine = sol sous le corps ; il regarde vers +x (dir 1).
  // pose : tete | quatrePattes (défaut) + marche (phase en tours) | recule 0..1 | assis | attache | bouderie | ouf | clin | humeur −1..1 | t
  // =====================================================================
  const OU = { poil: '#2a2420', poilL: '#3a322d', poilD: '#1c1815', museau: '#a8865a', museauD: '#8a6a44', sourcil: '#9a7a52', oeil: '#e9e0cc', iris: '#4a2c18', corde: CORDE };
  const OU_HEAD = [[-26, 34], [-34, 6], [-30, -22], [-14, -38], [10, -44], [32, -38], [48, -24], [74, -16], [94, -10], [104, -2], [104, 8], [96, 14], [80, 18], [58, 22], [38, 32], [10, 42], [-16, 42]];
  const OU_MUSEAU = [[44, -22], [74, -16], [94, -10], [104, -2], [104, 8], [96, 14], [80, 18], [58, 22], [42, 18], [36, 0]];
  const OU_BODY4 = [[100, -112], [60, -104], [10, -100], [-40, -102], [-100, -108], [-140, -118], [-168, -140], [-178, -170], [-170, -200], [-146, -222], [-100, -232], [-40, -236], [20, -246], [60, -252], [96, -238], [122, -212], [132, -180], [124, -146]];
  const OU_FLEG = [[-24, -20], [22, -22], [26, 40], [22, 100], [23, 128], [36, 138], [44, 148, 1], [-22, 150, 1], [-24, 128], [-26, 80]];
  const OU_RLEG = [[-38, -34], [32, -36], [36, 20], [22, 70], [22, 128], [36, 138], [44, 148, 1], [-20, 150, 1], [-24, 110], [-32, 60]];
  const OU_BODYS = [[70, -20], [90, -62], [88, -112], [74, -160], [58, -200], [40, -226], [10, -240], [-24, -236], [-50, -214], [-66, -170], [-80, -110], [-92, -50], [-90, -14], [-70, 0, 1], [50, 0, 1]];
  const OU_CUISSE = [[-46, -96], [8, -104], [48, -84], [64, -44], [100, -26], [122, -12], [126, 0, 1], [-34, 0, 1], [-60, -36]];
  function oursPoil(reg, seed, n) { hatch(reg, 0.9, 3.6, 0.25, 1, '150,130,110'); fur(reg, n || 40, seed, 'rgba(160,140,120,0.35)', 1, 10); }
  function teteOurs(o, hum, seed) {
    const c = cx_(), back = !!o._oreillesArriere;
    for (const [ex, ey, r, col] of [[4, -40, 13, OU.poilD], [-12, -36, 15, OU.poil]]) {
      const e = ell(ex - (back ? 10 : 0), ey + (back ? 6 : 0), r, r, 12);
      pc(e, col, () => fillPts(ell(ex - (back ? 10 : 0) + 2, ey + (back ? 6 : 0) + 2, r * 0.5, r * 0.5, 10), '#4a3a30'), seed + (r > 14 ? 1 : 2));
    }
    pc(OU_HEAD, OU.poil, () => {
      fillPts(OU_MUSEAU, OU.museau); hatch(OU_MUSEAU, 0.5, 3.4, 0.2);
      oursPoil([[-34, -44], [44, -44], [40, 44], [-34, 44]], seed + 3, 30);
      fillPts([[94, -12], [106, -6], [107, 3], [100, 6], [93, 0]], '#141010'); dot(100, -6, 2, 'rgba(255,255,255,0.6)');
      const mc = hum > 0.3 ? 5 : hum < -0.3 ? -4 : 0;
      strokePts([[98, 12], [84, 16], [70, 17], [64, 17 + mc]], 'rgba(30,20,12,0.9)', 1.8);
      // œil rond expressif
      const lid = o.clin ? 1 : o.ouf ? 0.55 : hum < -0.3 ? 0.4 : 0;
      if (lid >= 1) strokePts([[27, -14], [34, -10], [42, -14]], OU.oeil, 2.2);
      else {
        fillPts(ell(34, -14, 9, 8.5, 14), OU.oeil); dot(35, -14, 5.6, OU.iris); dot(35.5, -14, 3, '#100a08'); dot(37, -17, 1.8, 'rgba(255,255,255,0.95)');
        if (lid > 0) fillPts([[23, -26], [46, -26], [46, -14 - 8.5 * (1 - 2 * lid)], [23, -14 - 8.5 * (1 - 2 * lid)]], OU.poil);
        strokePts(ep(34, -14, 9.5, 9, 10, PI * 1.05, PI * 1.95), 'rgba(0,0,0,0.6)', 1.2);
      }
      const br = hum > 0.3 || o.bouderie ? [[24, -31], [34, -28], [45, -21]] : hum < -0.3 || o.ouf ? [[24, -24], [34, -30], [44, -29]] : [[24, -27], [34, -29], [44, -26]];
      strokePts(br, OU.sourcil, 3.2);
      shade(60, -30, -30, 30, 0.2, [-40, -50, 110, 50]);
    }, seed + 4);
  }
  function jambeOurs(pts, x, y, a, col, seed) {
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(a);
    pc(pts, col, () => { oursPoil(pts, seed, 14); fillPts([[18, 140], [44, 147], [44, 150], [16, 150]], '#4a3a30'); for (const xx of [30, 36, 42]) strokePts([[xx, 140], [xx + 5, 146]], '#d8ccb0', 1.4); }, seed);
    M.rivet(0, 0, 3.2); c.restore();
  }
  function drawOurs(p) {
    const o = p.o || {}, hum = clamp(o.humeur == null ? (o.bouderie ? 1 : o.ouf ? -1 : 0) : o.humeur, -1, 1), c = cx_();
    const pts = (p._pts = {});
    const H = (x, y, a) => new DOMMatrix().translate(x, y).rotate(a * D);
    if (o.tete) {                                                                          // seule la tête et une patte dépassent (touffe de cannes devant)
      const Mh = H(0, -86, -0.08 + (o.bouderie ? 0.25 : 0));
      c.save(); c.setTransform(c.getTransform().multiply(Mh)); teteOurs(o, hum, 7700); c.restore();
      pts.tete = mp(Mh, [30, -6]); pts.nez = mp(Mh, [104, 0]); pts.oeil = mp(Mh, [34, -14]); pts.corde = mp(Mh, [-10, 30]);
      if (o.feuilles !== false) {
        const R = M.rng(7710);
        for (let i = 0; i < 15; i++) {
          const x0 = lerp(-100, 120, i / 14) + (R() - 0.5) * 12, h = 48 + R() * 34 + (i < 3 || i > 11 ? 30 : 0), lean = (R() - 0.5) * 0.7;
          pc(ribbon(qbez([x0, 6], [x0 + lean * 40, 6 - h * 0.6], [x0 + lean * 90 + 10, 6 - h], 6), 26, 2), i % 2 ? '#4f6a3a' : '#5c7844', () => strokePts([[x0, 4], [x0 + lean * 40, 6 - h * 0.6]], 'rgba(220,230,180,0.3)', 1), 7711 + i);
        }
      }
      c.save(); c.translate(84, -62); c.rotate(-0.3);
      pc([[-16, -10], [14, -14], [24, -2], [20, 12], [-14, 14], [-20, 2]], OU.poil, () => { oursPoil([[-20, -14], [24, -14], [24, 14], [-20, 14]], 7720, 8); for (const yy of [-8, -1, 6]) strokePts([[18, yy], [27, yy + 2]], '#d8ccb0', 1.6); }, 7721);
      c.restore();
      return;
    }
    if (o.assis) {
      const ouf = o.ouf ? 1 : 0, Mh = H(36, -226 + 6 * ouf, -0.14 + (o.bouderie ? 0.32 : 0) + 0.16 * ouf + (o.tourne || 0));
      jambeOurs(scl(OU_FLEG, 0.78, 1.28), 26, -192 + 4 * ouf, -0.2, OU.poilD, 7730);
      pc(OU_BODYS, OU.poil, () => { oursPoil(OU_BODYS, 7731, 60); fillPts(ell(36, -120, 30, 50, 14), 'rgba(80,66,56,0.4)'); shade(80, -100, -80, -100, 0.3, [-100, -250, 100, 0]); }, 7732);
      pc(OU_CUISSE, OU.poil, () => { oursPoil(OU_CUISSE, 7733, 24); fillPts(ell(118, -10, 7, 11, 10), '#4a3a30'); for (const yy of [-16, -8, 0]) strokePts([[121, yy], [128, yy + 1]], '#d8ccb0', 1.4); }, 7734);
      if (o.attache) {
        const band = ribbon(qbez([-86, -112], [0, -94], [88, -106], 14), 13);
        pc(band, OU.corde, () => { for (let x = -84; x < 88; x += 8) strokePts([[x, -116], [x + 5, -100]], 'rgba(90,70,30,0.55)', 1); }, 7735);
        pc(ell(-90, -110, 11, 9, 10), OU.corde, () => strokePts([[-96, -114], [-84, -106]], 'rgba(90,70,30,0.7)', 1.2), 7736);
        pts.corde = [-98, -112];
      } else pts.corde = [-92, -112];
      jambeOurs(scl(OU_FLEG, 0.78, 1.28), 46, -188 + 4 * ouf, -0.27, OU.poilL, 7737);
      c.save(); c.setTransform(c.getTransform().multiply(Mh)); teteOurs(o, hum, 7740); c.restore();
      pts.tete = mp(Mh, [30, -6]); pts.nez = mp(Mh, [104, 0]); pts.oeil = mp(Mh, [34, -14]);
      if (ouf && !SIL()) { const u = ((o.t || 0) * 0.8) % 1, n = mp(Mh, [108, 4]); for (let i = 0; i < 3; i++) strokePts(ep(n[0] + 12 + u * 30 + i * 8, n[1] + 4, 6 + i * 3, 5 + i * 2, 8, -1.2, 1.2), `rgba(240,235,220,${0.5 * (1 - u)})`, 1.6); }
      return;
    }
    // à quatre pattes (marche / recule)
    const rc = clamp(o.recule || 0), ph = (o.marche || 0) * TAU, sw = (o.marche != null || rc > 0) ? 0.3 : 0, s1 = Math.sin(ph) * sw;
    const bob = -Math.abs(Math.sin(ph)) * 4 * (sw ? 1 : 0), arch = 18 * rc;
    o._oreillesArriere = rc > 0.3;
    c.save(); c.translate(0, bob);
    const body = OU_BODY4.map((q) => (q[1] < -200 && q[0] > -150 && q[0] < 100 ? [q[0], q[1] - arch * Math.sin(PI * (q[0] + 150) / 250)] : q));
    jambeOurs(OU_FLEG, 46, -152, -s1, OU.poilD, 7750);
    jambeOurs(OU_RLEG, -140, -152, s1, OU.poilD, 7751);
    pc(body, OU.poil, () => { oursPoil(body, 7752, 80); shade(0, -250, 0, -100, 0.3, [-180, -260, 140, -96]); }, 7753);
    if (o.attache) {
      const band = ribbon(qbez([-6, -244 - arch * 0.9], [0, -170], [-22, -100], 12), 13);
      pc(band, OU.corde, () => { for (let y = -240; y < -100; y += 8) strokePts([[-14, y], [2, y + 5]], 'rgba(90,70,30,0.55)', 1); }, 7754);
      pc(ell(-6, -248 - arch * 0.9, 10, 8, 10), OU.corde, () => strokePts([[-12, -252], [0, -244]], 'rgba(90,70,30,0.7)', 1.2), 7755);
      pts.corde = [-10, -256 - arch * 0.9 + bob];
    } else pts.corde = [-8, -248 - arch + bob];
    jambeOurs(OU_FLEG, 66, -150, s1, OU.poilL, 7756);
    jambeOurs(OU_RLEG, -118, -150, -s1, OU.poilL, 7757);
    pc([[-170, -190], [-186, -196], [-188, -180], [-174, -176]], OU.poil, null, 7758);
    const Mh = H(116, -198 - arch * 0.3, -0.05 + 0.25 * rc + (o.bouderie ? 0.35 : 0) + (o.ouf ? 0.15 : 0) + 0.04 * Math.sin(ph * 2) * (sw ? 1 : 0));
    c.save(); c.setTransform(c.getTransform().multiply(Mh)); teteOurs(o, hum, 7760); c.restore();
    c.restore();
    const mb = (q) => { const z = mp(Mh, q); return [z[0], z[1] + bob]; }; pts.tete = mb([30, -6]); pts.nez = mb([104, 0]); pts.oeil = mb([34, -14]);
  }
  const OURS_DEF = { hipY: 0, handLen: 10, rod: { part: 'o', at: [-10, -150] }, nom: 'ours', libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
    parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => drawOurs(p) } }, order: ['o'] };
  CH.tedOurs = OURS_DEF;
  TED.ours = (pose, x, y, s, o) => {
    pose = pose || {}; o = Object.assign({}, o); s = s == null ? 1 : s;
    if (pose.tete && o.rod == null) o.rod = false;
    const q = { o: Object.assign({ t: pose.t || 0 }, pose), tilt: pose.tilt || 0, dx: pose.dx || 0, dy: pose.dy || 0 };
    const r = M.puppet(OURS_DEF, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o));
    r.pts = q._pts || {}; return r;
  };
  TED.ourspt = (r, nom) => { const q = r.pts && r.pts[nom]; return q ? r.w('o', q[0], q[1]) : null; };

  // =====================================================================
  // LES CHIENS DE MEUTE — def.libre. Origine = sol sous le corps. robe 'a' tricolore (blanc, feu, selle noire) | 'b' fauve roux uni.
  // pose : court (phase en tours) | aboie 0..1 | assis | queue (remue, avec t) | t
  // =====================================================================
  const CHR = { a: { base: '#e9e2d2', baseD: '#cfc6b2', feu: '#b5652a', selle: '#1e1a18', oreille: '#9a5222' }, b: { base: '#b8642c', baseD: '#9a5022', feu: '#a85a28', selle: null, oreille: '#7e3e18' } };
  const CN_BODY = [[60, -126], [20, -122], [-30, -120], [-78, -122], [-94, -110], [-92, -92], [-70, -82], [-40, -86], [-10, -90], [20, -78], [44, -70], [66, -80], [80, -100], [76, -118]];
  const CN_HEAD = [[-10, 10], [-14, -20], [-4, -50], [12, -62], [30, -64], [44, -58], [70, -50], [84, -46], [87, -40], [82, -34], [56, -32], [40, -26], [24, -16], [12, 4]];
  const CN_JAW = [[40, -34], [82, -34], [80, -28], [58, -24], [40, -24]];
  const CN_EAR = [[16, -62], [30, -60], [34, -40], [30, -16], [22, -6], [12, -12], [10, -36]];
  const CN_FL = [[-9, -8], [9, -8], [8, 40], [6, 78], [16, 84], [18, 90, 1], [-6, 90, 1], [-7, 60], [-9, 30]];
  const CN_RL = [[-16, -16], [14, -16], [12, 30], [0, 56], [3, 80], [14, 85], [16, 90, 1], [-8, 90, 1], [-10, 60], [-14, 30]];
  function jambeChien(pts, x, y, a, col, feu, seed) {
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(a);
    pc(pts, col, () => { if (feu) fillPts([[-20, 40], [20, 40], [20, 96], [-20, 96]], feu); fillPts([[-10, 84], [20, 84], [20, 92], [-10, 92]], 'rgba(40,30,20,0.35)'); hatch(null, 0.9, 3.4, 0.18); }, seed);
    M.rivet(0, 0, 2.6); c.restore();
  }
  function teteChien(o, R, seed) {
    const ab = clamp(o.aboie || 0), c = cx_();
    c.save(); c.translate(40, -30); c.rotate(ab * 0.42); c.translate(-40, 30);
    pc(CN_JAW, R.feu || R.base, () => { if (ab > 0.2) { fillPts([[44, -34], [80, -34], [78, -30], [46, -30]], '#6a2020'); for (const x of [56, 66, 74]) fillPts([[x, -34], [x + 3, -34], [x + 1.5, -30]], '#f1ead8'); } }, seed + 1);
    c.restore();
    pc(CN_HEAD, R.feu || R.base, () => {
      if (R.selle) fillPts([[60, -54], [86, -46], [88, -38], [62, -34]], R.base);
      fillPts([[82, -46], [89, -42], [88, -36], [82, -36]], '#141010');
      fillPts(ell(48, -52, 4.6, 4, 10), '#2a1a12'); dot(49.5, -53.5, 1.4, 'rgba(255,255,255,0.9)');
      strokePts([[42, -58], [54, -58]], 'rgba(40,20,10,0.5)', 1.6);
      hatch(null, 0.7, 3.4, 0.2); shade(80, -40, -10, -10, 0.2, [-20, -70, 90, 12]);
    }, seed + 2);
    const ea = -0.1 * clamp(o._vit || 0) + 0.06 * Math.sin((o.t || 0) * 6);
    c.save(); c.translate(22, -60); c.rotate(ea); c.translate(-22, 60);
    pc(CN_EAR, R.oreille, () => hatch(null, 0.6, 3, 0.25), seed + 3);
    c.restore();
    if (ab > 0.5 && !SIL()) { for (let i = 0; i < 3; i++) strokePts(ep(96, -40, 10 + i * 9, 10 + i * 9, 8, -0.7, 0.5), `rgba(240,235,220,${0.6 - i * 0.15})`, 2); }
  }
  function drawChien(p) {
    const o = p.o || {}, R = CHR[o.robe === 'b' ? 'b' : 'a'], c = cx_(), pts = (p._pts = {});
    const t = o.t || 0, qw = o.queue ? Math.sin(t * 16) * 0.35 : 0.05 * Math.sin(t * 2);
    const H = (x, y, a) => new DOMMatrix().translate(x, y).rotate(a * D);
    const queue = (x, y, a) => { c.save(); c.translate(x, y); c.rotate(a + qw); pc(ribbon(qbez([0, 0], [-30, -24], [-26, -64], 10), 9, 3), R.base, () => { if (R.selle) fillPts([[-40, -70], [-10, -70], [-10, -50], [-40, -50]], '#f4f0e6'); }, 7801); c.restore(); };
    if (o.assis) {
      queue(-46, -12, 0.9);
      jambeChien(CN_FL, 22, -86, 0.02, R.base, R.feu, 7802);
      const bd = rot(ell(-8, -74, 34, 62, 18), -0.38, -8, -74);
      pc(bd, R.base, () => { if (R.selle) fillPts(rot([[-60, -130], [-10, -150], [0, -60], [-50, -30]], -0.1), R.selle); hatch(null, 0.8, 3.6, 0.2); }, 7803);
      pc(ell(-24, -32, 32, 30, 14), R.baseD, () => hatch(null, 0.8, 3.6, 0.25), 7804);
      pc([[-10, -6], [26, -8], [30, 0, 1], [-12, 0, 1]], R.feu || R.base, null, 7805);
      jambeChien(CN_FL, 32, -84, -0.02, R.base, R.feu, 7806);
      const Mh = H(14, -120, -0.1 - 0.3 * clamp(o.aboie || 0));
      c.save(); c.setTransform(c.getTransform().multiply(Mh)); teteChien(o, R, 7810); c.restore();
      pts.nez = mp(Mh, [88, -40]); pts.tete = mp(Mh, [36, -50]);
      return;
    }
    const ph = (o.court || 0) * TAU, run = o.court != null ? 1 : 0, sg = Math.sin(ph);
    o._vit = run;
    const pitch = 0.05 * Math.cos(ph) * run, bob = -Math.abs(Math.cos(ph)) * 8 * run;
    c.save(); c.translate(0, bob); c.rotate(pitch);
    queue(-90, -116, -0.2 - 0.5 * run);
    jambeChien(CN_FL, 44, -90, run * (0.15 + 0.55 * sg), R.baseD, R.feu, 7820);
    jambeChien(CN_RL, -80, -96, run * (0.1 - 0.55 * sg), R.baseD, R.feu, 7821);
    pc(CN_BODY, R.base, () => { if (R.selle) fillPts([[-70, -130], [40, -130], [30, -104], [-10, -98], [-66, -104]], R.selle); hatch(null, 0.8, 3.6, 0.18); shade(0, -126, 0, -70, 0.25, [-100, -130, 90, -66]); }, 7822);
    jambeChien(CN_FL, 54, -90, run * (0.15 - 0.55 * sg), R.base, R.feu, 7823);
    jambeChien(CN_RL, -70, -96, run * (0.1 + 0.55 * sg), R.base, R.feu, 7824);
    const Mh = H(66, -116, -0.06 - 0.35 * clamp(o.aboie || 0) + 0.12 * run);
    c.save(); c.setTransform(c.getTransform().multiply(Mh)); teteChien(o, R, 7830); c.restore();
    c.restore();
    const Mt = new DOMMatrix().translate(0, bob).rotate(pitch * D).multiply(Mh);
    pts.nez = mp(Mt, [88, -40]); pts.tete = mp(Mt, [36, -50]);
  }
  const CHIEN_DEF = { hipY: 0, handLen: 10, rod: { part: 'o', at: [-10, -100] }, nom: 'chien', libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
    parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => drawChien(p) } }, order: ['o'] };
  CH.tedChien = CHIEN_DEF;
  TED.chien = (pose, x, y, s, o) => {
    pose = pose || {}; s = s == null ? 0.8 : s;
    const q = { o: Object.assign({ t: pose.t || 0 }, pose), tilt: pose.tilt || 0, dx: pose.dx || 0, dy: pose.dy || 0 };
    const r = M.puppet(CHIEN_DEF, q, x, y, s * 1.05, Object.assign({ slot: M.ST.slotF }, o));   // dessin interne ×1,05 : s 0,8 ≈ 150 px
    r.pts = q._pts || {}; return r;
  };
  TED.chienpt = (r, nom) => { const q = r.pts && r.pts[nom]; return q ? r.w('o', q[0], q[1]) : null; };

  // =====================================================================
  // LA CHAMBRE D'ENFANT (vignettes des plans 1 et 6) — TED.chambre(t, cx, cy, rx, ry, o) dessine tout l'intérieur (déjà découpé par M.vignette).
  // Repère interne : ±210 × ±260 (mis à l'échelle de rx, ry). o.bosse 0..1, o.revele 0..1, o.bouge 0..1 (avec t), o.sourire (bool), o.lueur 0..1
  // =====================================================================
  const CB = { mur: '#2c3a5a', murL: '#3a4a6c', etoile: '#d9c98a', ciel: '#16203a', lune: '#efe2a8', bois: '#c9a172', boisD: '#a67f52', drap: '#eae4d4',
    pyjama: '#a9c8e0', pyjamaD: '#86a8c4', cheveux: '#d8b860', cheveuxD: '#b8963e', peau: '#f0cfb0', patch: ['#b98a3a', '#6f7f56', '#4f6a8e', '#c48a8a'] };
  function etoile(x, y, r, col) { const o = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.45 : r; o.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } fillPts(o, col, 0, 0); }
  TED.chambre = function (t, cx, cy, rx, ry, o) {
    o = o || {}; rx = rx || 210; ry = ry || 260;
    const c = cx_(), bosse = clamp(o.bosse || 0), rev = ease(clamp(o.revele || 0)), bg = clamp(o.bouge || 0);
    c.save(); c.translate(cx, cy); c.scale(rx / 210, ry / 260);
    // mur à étoiles
    fillPts(box(-240, -290, 240, 290), CB.mur, 0, 0);
    for (let j = 0; j < 9; j++) for (let i = 0; i < 7; i++) etoile(-200 + i * 66 + (j % 2) * 33, -250 + j * 52, 5, 'rgba(217,201,138,0.55)');
    fillPts(box(-240, 70, 240, 290), '#5a4434', 0, 0);                                                   // plancher
    for (let y = 90; y < 290; y += 22) strokePts([[-240, y], [240, y]], 'rgba(30,20,12,0.4)', 1);
    // fenêtre, lune, voilage
    fillPts(box(-176, -226, -54, -78), CB.boisD, 0, 0); fillPts(box(-168, -218, -62, -86), CB.ciel, 0, 0);
    dot(-96, -180, 18, CB.lune); dot(-88, -186, 16, CB.ciel);
    for (const [x, y] of [[-150, -200], [-130, -120], [-80, -110], [-146, -150]]) etoile(x, y, 3.5, CB.etoile);
    strokePts([[-115, -218], [-115, -86]], CB.boisD, 3); strokePts([[-168, -152], [-62, -152]], CB.boisD, 3);
    strokePts([[-184, -232], [-46, -232]], '#6a4a2a', 4);
    const vo = []; for (let i = 0; i <= 14; i++) { const y = -230 + i * 12; vo.push([-60 - 22 + 9 * Math.sin(t * 1.4 + i * 0.6) * (i / 14), y]); }
    fillPts([[-46, -230]].concat(vo, [[-46, -62]]), 'rgba(240,236,226,0.55)', 0, 0);
    const vo2 = []; for (let i = 0; i <= 14; i++) { const y = -230 + i * 12; vo2.push([-188 + 20 + 8 * Math.sin(t * 1.2 + i * 0.6 + 1) * (i / 14), y]); }
    fillPts([[-188, -230]].concat(vo2, [[-188, -62]]), 'rgba(240,236,226,0.55)', 0, 0);
    // étagère à jouets : cubes sans lettres, toupie, petit train
    fillPts(box(30, -116, 196, -106), CB.boisD, 0, 0); fillPts([[40, -106], [50, -106], [44, -90]], CB.boisD, 0, 0); fillPts([[176, -106], [186, -106], [182, -90]], CB.boisD, 0, 0);
    for (const [x, col, h] of [[40, '#a83a32', 22], [64, '#5d7a4a', 22], [52, '#c9a24a', 20]]) {
      const y0 = x === 52 ? -158 : -138; fillPts(box(x, y0, x + h, y0 + h), col, 0, 0); strokePts(box(x, y0, x + h, y0 + h).concat([[x, y0]]), 'rgba(0,0,0,0.4)', 1); dot(x + h / 2, y0 + h / 2, 4, 'rgba(255,255,255,0.5)');
    }
    fillPts([[100, -140], [126, -140], [113, -116]], '#c48a8a', 0, 0); fillPts(box(110, -150, 116, -140), CB.boisD, 0, 0); strokePts([[102, -134], [124, -134]], '#f0e8d8', 2);   // toupie
    fillPts(box(136, -134, 162, -116), '#4f6a8e', 0, 0); fillPts(box(150, -146, 162, -134), '#4f6a8e', 0, 0); fillPts(box(140, -142, 146, -134), '#2a2a2a', 0, 0);
    fillPts(box(164, -130, 190, -116), '#a83a32', 0, 0); for (const x of [142, 156, 170, 184]) { dot(x, -114, 5, '#222'); dot(x, -114, 2, '#999'); }
    // mobile d'étoiles qui tourne
    strokePts([[60, -290], [60, -236]], 'rgba(230,220,190,0.7)', 1.2);
    const ma = t * 0.6; strokePts([[60 - 40 * Math.cos(ma), -236], [60 + 40 * Math.cos(ma), -236]], '#c9a172', 2);
    for (const [k, h, col] of [[-1, 34, '#e9d68a'], [1, 50, '#d9a0a0'], [0, 62, '#a9c8e0']]) { const x = 60 + 40 * Math.cos(ma) * k; strokePts([[x, -236], [x, -236 + h]], 'rgba(230,220,190,0.6)', 1); etoile(x, -230 + h, 9, col); }
    // table de nuit + veilleuse
    fillPts(box(-206, 24, -150, 130), CB.boisD, 0, 0); fillPts(box(-210, 18, -146, 26), CB.bois, 0, 0);
    const lu = 0.8 + 0.2 * Math.sin(t * 2.3) * Math.sin(t * 3.7);
    const gr = c.createRadialGradient(-178, -6, 4, -178, -6, 110); gr.addColorStop(0, `rgba(255,214,140,${0.45 * lu})`); gr.addColorStop(1, 'rgba(255,214,140,0)');
    c.fillStyle = gr; c.fillRect(-300, -120, 260, 260);
    fillPts(box(-182, 4, -174, 18), CB.bois, 0, 0); fillPts([[-196, 4], [-160, 4], [-168, -22], [-188, -22]], '#f2d79a', 0, 0); strokePts([[-196, 4], [-160, 4]], '#b8963e', 2);
    // lit + enfant + couverture : agrandis ×1,3 autour de la tête de lit (lisibles en vignette)
    c.save(); c.translate(-160, 70); c.scale(1.3, 1.3); c.translate(160, -70);
    // lit : tête de lit, oreiller
    const bx0 = -156, bx1 = 196, top = 54;
    fillPts([[bx0 - 12, -40, 1], [bx0 + 6, -40, 1], [bx0 + 6, 140, 1], [bx0 - 12, 140, 1]], CB.bois, 0, 0);
    fillPts(ep(bx0 - 3, -40, 12, 10, 8, PI, TAU), CB.bois, 0, 0);
    fillPts(box(bx1 - 6, 10, bx1 + 10, 140), CB.bois, 0, 0);
    fillPts(box(bx0, top, bx1, top + 26), CB.drap, 0, 0);
    fillPts(ell(-112, 44, 44, 18, 14), '#f4efe4', 0, 0); strokePts(ep(-112, 44, 44, 18, 10, 0.2, PI - 0.2), 'rgba(160,150,130,0.6)', 1.2);
    // l'enfant : tête sur l'oreiller (profil, nez vers le haut), yeux fermés
    const hr = bg * (0.14 * Math.sin(t * 0.9) + 0.06 * Math.sin(t * 2.1)), sh = bg * 6 * Math.sin(t * 0.9);
    c.save(); c.translate(-104 + sh * 0.3, 30); c.rotate(hr);
    fillPts(ell(0, 0, 30, 26, 18), CB.peau, 0, 0);
    fillPts([[16, -20], [22, -28], [26, -22], [22, -16]], CB.peau, 0, 0);                                   // nez
    const ch = []; const R = M.rng(7901); for (let i = 0; i <= 12; i++) { const a = PI * 0.55 + i / 12 * PI * 1.05, rr = 31 + (i % 2 ? 9 + R() * 6 : 0); ch.push([Math.cos(a) * rr - 2, Math.sin(a) * rr - 2]); }
    fillPts([[-4, -26]].concat(ch, [[-20, 18]]), CB.cheveux, 0, 0);                                        // cheveux paille ébouriffés
    for (let i = 0; i < 6; i++) strokePts([[-20 + i * 3, -14 + i * 4], [-34 + i * 2, -22 + i * 6]], CB.cheveuxD, 1.2);
    strokePts([[2, -12], [8, -8], [14, -10]], 'rgba(40,24,20,0.9)', 1.6);                                 // œil fermé
    dot(4, 4, 6, 'rgba(230,140,130,0.35)');
    if (o.sourire) strokePts([[18, 2], [22, 6], [26, 2]], 'rgba(150,60,60,0.9)', 1.6); else strokePts([[19, 4], [24, 4]], 'rgba(150,60,60,0.8)', 1.4);
    c.restore();
    // pyjama + bras + peluche (révélés quand la couverture glisse)
    const edge = lerp(-84, 4, rev), kb = bosse * (1 - rev), bx = -52 + sh * 0.3, by = 12 + bg * 2 * Math.sin(t * 0.9), brx = 27, bry = 25;   // bosse : forme ronde contre la poitrine (≈ 70 × 60 px en vignette)
    if (rev > 0.02) {
      fillPts([[-80, 46], [-60, 20], [-10, 22], [20, 40], [20, 70], [-80, 70]], CB.pyjama, 0, 0);
      for (let x = -76; x < 20; x += 9) strokePts([[x, 24], [x + 2, 70]], 'rgba(255,255,255,0.55)', 2);
      c.save(); c.translate(bx, 36); c.rotate(-0.2); c.scale(0.4, 0.4); drawPeluche({ couture: 1, t, assis: true }); c.restore();
      fillPts([[-70, 34], [-40, 18], [-16, 16], [-12, 26], [-40, 32], [-64, 46]], CB.pyjamaD, 0, 0);       // bras qui serre l'ours
      fillPts(ell(-12, 21, 8, 7, 10), CB.peau, 0, 0);
    }
    // couverture en patchwork
    const bump = (x) => { let y = top - 8; y -= 14 * Math.exp(-Math.pow((x + 40) / 50, 2)); y -= 8 * Math.exp(-Math.pow((x - 60) / 60, 2)); y -= 12 * Math.exp(-Math.pow((x - 160) / 18, 2)); y += bg * 3 * Math.sin(t * 0.9 + x * 0.02);
      const u = (x - bx) / (brx + 8); if (kb > 0 && Math.abs(u) < 1) y = lerp(y, Math.min(y, by - bry * Math.sqrt(1 - u * u) + 6 * u * u), kb);
      return y; };
    const cov = []; for (let x = edge; x <= bx1 + 4; x += Math.abs(x - bx) < 40 ? 3 : 8) cov.push([x, bump(x)]);
    cov.push([bx1 + 6, top + 4], [bx1 + 2, top + 96], [edge + 10, top + 98], [edge - 4, top + 30]);
    c.save(); M.path(cov, 0, 0); c.clip();
    for (let j = -2; j < 6; j++) for (let i = 0; i < 12; i++) { const x = -110 + i * 28, y = top - 50 + j * 28; fillPts(box(x, y, x + 28, y + 28), CB.patch[(i + j * 3) % 4], 0, 0); strokePts([[x + 2, y + 2], [x + 26, y + 2]], 'rgba(255,250,235,0.5)', 1); strokePts([[x + 2, y + 2], [x + 2, y + 26]], 'rgba(255,250,235,0.4)', 1); }
    c.restore();
    strokePts(cov.slice(0, -4), 'rgba(60,40,30,0.7)', 1.6);
    strokePts([[edge - 4, top + 30], [edge + 10, top + 98]], 'rgba(60,40,30,0.5)', 1.2);
    if (kb > 0.02) {                                                                         // ombre de la bosse + bras par-dessus la couverture, main posée dessus
      c.save(); c.globalAlpha *= kb;
      fillPts(ell(bx + 16, by + bry - 2, 24, 6, 14), 'rgba(40,25,35,0.35)', 0, 0);
      strokePts(ep(bx, by, brx - 3, bry - 3, 10, PI * 1.1, PI * 1.6), 'rgba(255,250,235,0.45)', 2);
      const arm = ribbon(qbez([-88, 44], [bx - 22, by - bry + 2], [bx + 16, by - 6], 10), 14, 11);
      fillPts(arm, CB.pyjama, 0, 0); strokePts(arm.concat([arm[0]]), 'rgba(60,80,110,0.6)', 1);
      for (const s of [0.25, 0.45, 0.65]) { const p = qbez([-88, 44], [bx - 22, by - bry + 2], [bx + 16, by - 6], 10)[Math.round(s * 10)]; strokePts([[p[0] - 3, p[1] - 6], [p[0] + 3, p[1] + 6]], 'rgba(255,255,255,0.6)', 1.6); }
      fillPts(ell(bx + 20, by - 3, 8, 6.5, 10), CB.peau, 0, 0); strokePts([[bx + 18, by + 1], [bx + 26, by - 1]], 'rgba(150,90,80,0.5)', 1);
      c.restore();
    }
    fillPts(box(bx0, top + 96, bx1, top + 108), CB.boisD, 0, 0);
    c.restore();
    c.restore();
  };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  // (x,y) : peluche = sol entre ses pieds ; journal = milieu du bord inférieur ; fusil = sous son milieu ; cor = sous son milieu ; aiguille = pointe
  TED.peluche = (x, y, s, o) => acc('peluche', x, y, s, o, 1);
  TED.journal = (x, y, s, o) => acc('journal', x, y, s, o, 1);
  TED.fusil = (x, y, s, o) => acc('fusil', x, y, s, o, 0.9);
  TED.cor = (x, y, s, o) => acc('cor', x, y, s, o, 0.9);
  TED.aiguille = (x, y, s, o) => acc('aiguille', x, y, s, o, 0.9);
  TED.accPt = (r, name, nom) => { const ob = OBJ[name], q = ob && ob.pts[nom]; if (!q) return null; const k = name === 'journal' ? ((r && r.k) || 1) : 1; return r.w('o', q[0] * k - ob.base[0], q[1] * k - ob.base[1]); };
  // corde de chanvre entre deux points écran (a → b), avec un mou en px (o.mou, défaut 30), o.w épaisseur (px, défaut 4)
  TED.corde = function (a, b, o) {
    o = o || {}; if (!a || !b) return;
    const c = cx_(), mou = o.mou == null ? 30 : o.mou, w = o.w || 4;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + mou];
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], b[0], b[1]);
    c.strokeStyle = CORDED; c.lineWidth = w + 1.6; c.stroke(); c.strokeStyle = CORDE; c.lineWidth = w; c.stroke();
    c.setLineDash([3, 5]); c.strokeStyle = 'rgba(90,70,30,0.6)'; c.lineWidth = w * 0.5; c.stroke(); c.setLineDash([]);
    c.restore();
  };
  TED.init = function () { return TED; };
})();

// ——— Décors de la vidéo (ex-decors/casting.js, M.dec → M.ted) : TED.bayou/bayouSol/buissonAvant, TED.boutique/boutiqueSol ; pré-rendus : TED.init_casting() dans S.init.
// decors/casting.js — « Le Teddy bear, l'ours que Roosevelt épargna » : décors récurrents (espace M.dec). Mode d'emploi : decors.md.
//   Lieu 1 : camp de chasse au bord du bayou, Mississippi, novembre 1902 (plans 1–4) : M.ted.bayou, M.ted.bayouSol, M.ted.buissonAvant
//   Lieu 2 : boutique des Michtom, Brooklyn, 1902 (plans 5–6) : M.ted.boutique, M.ted.boutiqueSol
// Pré-rendus dans M.ted.init_casting (lancé par M.ted.init()). Fonctions pures de t (ambiances en temps global), aucun texte ni chiffre.
(function () {
  'use strict';
  const D = M.ted, TAU = M.TAU, PI = Math.PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, smooth, hash } = M;
  const W = M.W, BACK = M.ST.back;
  const cx_ = () => M.ctx();
  const K = {};

  // ------------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
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
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function mixA(a, b, k, al) { const A = hx(a), B = hx(b); k = clamp(k); const v = A.map((x, i) => Math.round(lerp(x, B[i], k))); return al == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${al})`; }
  function mixH(a, b, k) { const A = hx(a), B = hx(b); return '#' + A.map((x, i) => Math.round(lerp(x, B[i], clamp(k))).toString(16).padStart(2, '0')).join(''); }
  function blob(cx, cy, rx, ry, seed, n) { n = n || 13; const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 0.78 + 0.3 * hash(seed + i * 1.7); o.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return o; }
  // calque pré-rendu serré (coordonnées écran) ; ombre douce facultative ; pose avec rotation autour d'un pivot
  function lay(x0, y0, x1, y1, fn) { const cv = M.pre(x1 - x0, y1 - y0, (c) => { c.translate(-x0, -y0); fn(c); }); cv.x0 = x0; cv.y0 = y0; return cv; }
  function ombre(cv, blur) { cv.sh = M.pre(cv.width + 40, cv.height + 40, (x) => { x.filter = `brightness(0) blur(${blur || 8}px)`; x.drawImage(cv, 20, 20); }); return cv; }
  function put(cv, rot, px, py, sh, al) {
    const c = cx_(); c.save(); if (rot) { c.translate(px, py); c.rotate(rot); c.translate(-px, -py); }
    if (al != null) c.globalAlpha = al;
    if (sh && cv.sh) { const a0 = c.globalAlpha; c.globalAlpha = a0 * sh; c.drawImage(cv.sh, cv.x0 - 20 + 16, cv.y0 - 20 + 8); c.globalAlpha = a0; }
    c.drawImage(cv, cv.x0, cv.y0); c.restore();
  }
  function teinte(cv, col) { const o = M.pre(cv.width, cv.height, (x) => { x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, cv.width, cv.height); }); o.x0 = cv.x0; o.y0 = cv.y0; return o; }
  function rotAt(rot, px, py, fn) { const c = cx_(); c.save(); c.translate(px, py); c.rotate(rot); c.translate(-px, -py); fn(c); c.restore(); }
  function glow(x, y, r, col, a) { if (a <= 0) return; const c = cx_(), gr = c.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }

  // =====================================================================
  // LIEU 1 — LE BAYOU
  // =====================================================================
  const BY = { feu: { x: 212, y: 1388 }, pot: { x: 212, y: 1262 }, lant: { x: 300, y: 992 }, chL: [92, BACK], chR: [990, BACK],
    eau: 1150, heron: [556, 1150], tortue: [392, 1128] };
  D.BAYOU = BY;
  D.arbrePt = { x: 640, y: 1300 };
  D.buissonPt = { x: 820, y: BACK - 300 };
  const MOUSSE = '#9c9d8a', MOUSSED = '#6e7163';

  // cyprès chauve (toile de fond) : tronc évasé, plateaux de feuillage, mousse espagnole, « genoux » dans l'eau, reflet
  function cypres(c, x, yb, h, s, C, seed, edge) {
    const R = M.rng(seed), tr = [[x - 48 * s, yb, 1], [x - 22 * s, yb - 26 * s], [x - 13 * s, yb - 80 * s], [x - 8 * s, yb - h * 0.86], [x + 8 * s, yb - h * 0.86], [x + 13 * s, yb - 80 * s], [x + 22 * s, yb - 26 * s], [x + 48 * s, yb, 1]];
    // reflet dans l'eau
    c.save(); c.globalAlpha = 0.22; c.translate(0, 1.55 * yb); c.scale(1, -0.55); fillPts(tr, C.tronc, seed, 0.3); c.restore();
    const tufts = [];
    for (let i = 0; i < 6; i++) { const ty = yb - h * (0.4 + 0.1 * i), tw = (70 + 50 * R()) * s * (1 - i * 0.07), tx = x + (R() - 0.5) * 60 * s; tufts.push([tx, ty, tw]); }
    for (const [tx, ty] of tufts) fillPts(bar([x, ty + 34 * s], [tx, ty], 7 * s), C.tronc, seed + tx, 0.3);
    if (edge) pc(tr, C.tronc, () => { hatch(tr, 1.5, 5, 0.22); shade(x + 40 * s, 0, x - 30 * s, 0, 0.35, [x - 60 * s, yb - h, x + 60 * s, yb]); }, seed);
    else fillPts(tr, C.tronc, seed, 0.4);
    for (let k = 0; k < 4; k++) { const kx = x + (k - 1.5) * 34 * s + (R() - 0.5) * 16 * s, kh = (12 + 12 * R()) * s; fillPts([[kx - 7 * s, yb + 5], [kx - 2 * s, yb - kh], [kx + 2 * s, yb - kh], [kx + 7 * s, yb + 5]], C.tronc, seed + k, 0.3); }
    for (const [tx, ty, tw] of tufts) {
      const tp = [[tx - tw, ty + 2], [tx - tw * 0.62, ty - 17 * s], [tx - tw * 0.2, ty - 25 * s], [tx + tw * 0.3, ty - 22 * s], [tx + tw * 0.72, ty - 13 * s], [tx + tw, ty + 1], [tx + tw * 0.5, ty + 9 * s], [tx - tw * 0.5, ty + 9 * s]];
      if (edge) pc(tp, C.feuil, () => { for (let j = 0; j < 16; j++) dot(tx + (R() - 0.5) * tw * 1.6, ty - 18 * s + R() * 20 * s, 2.2 * s, C.feuilL); hatch(null, 0.2, 5, 0.18, 1, undefined, [tx - tw, ty - 30 * s, tx + tw, ty + 12 * s]); }, seed + ty, { drop: false });
      else { fillPts(tp, C.feuil, seed + ty, 0.5); for (let j = 0; j < 10; j++) dot(tx + (R() - 0.5) * tw * 1.5, ty - 14 * s + R() * 16 * s, 2 * s, C.feuilL); }
      for (let j = 0; j < 4; j++) { const mx = tx + (R() - 0.5) * tw * 1.3, ml = (30 + 55 * R()) * s; fillPts(ribbon([[mx, ty + 6 * s], [mx + 3 * s, ty + ml * 0.5], [mx - 2 * s, ty + ml]], 8 * s, 1.5), C.mousse, seed + j + tx, 0.6); }
    }
  }
  function makeByFond(S) {
    const C2 = (j, s) => (S ? s : j);
    return M.pre(W, BACK + 40, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 900);
      if (!S) { g.addColorStop(0, '#9fb0b2'); g.addColorStop(0.5, '#c9cfc3'); g.addColorStop(1, '#e6dec6'); }
      else { g.addColorStop(0, '#6a6584'); g.addColorStop(0.42, '#b98a8c'); g.addColorStop(0.78, '#e7ad6c'); g.addColorStop(1, '#f2cf8e'); }
      c.fillStyle = g; c.fillRect(0, 0, W, 920);
      if (S) { const h = c.createRadialGradient(430, 800, 10, 430, 800, 330); h.addColorStop(0, 'rgba(255,236,170,0.9)'); h.addColorStop(0.25, 'rgba(255,214,140,0.45)'); h.addColorStop(1, 'rgba(255,200,130,0)'); c.fillStyle = h; c.fillRect(100, 470, 660, 660); fillPts(ell(430, 806, 58, 58, 24), '#f8dc98', 3, 0.4); }
      else { const h = c.createRadialGradient(760, 330, 10, 760, 330, 260); h.addColorStop(0, 'rgba(255,250,230,0.55)'); h.addColorStop(1, 'rgba(255,250,230,0)'); c.fillStyle = h; c.fillRect(500, 70, 520, 520); }
      // lés de la toile (coutures)
      for (let x = 108; x < W; x += 216) { strokePts([[x, 150], [x + 2, 1100]], 'rgba(70,52,36,0.13)', 1.2); for (let y = 170; y < 1090; y += 22) strokePts([[x - 3, y], [x + 4, y + 6]], 'rgba(70,52,36,0.1)', 1); }
      // eau
      const ge = c.createLinearGradient(0, 880, 0, 1260);
      ge.addColorStop(0, C2('#b9bba6', '#e3b98a')); ge.addColorStop(0.25, C2('#7c8064', '#a07a62')); ge.addColorStop(1, C2('#4a4f39', '#4c3d36'));
      c.fillStyle = ge; c.fillRect(0, 880, W, 390);
      if (S) { for (let i = 0; i < 16; i++) strokePts([[430 - 40 + hash(i) * 30, 900 + i * 13], [430 + 20 + hash(i + 3) * 40, 900 + i * 13]], 'rgba(255,220,150,0.45)', 2); }
      for (let i = 0; i < 56; i++) { const y = 900 + hash(i * 2.3) * 330, x = hash(i * 5.1) * W; strokePts([[x, y], [x + 18 + hash(i) * 40, y]], C2('rgba(230,232,215,0.22)', 'rgba(255,214,160,0.25)'), 1.2); }
      // lointains : rive boisée dans la brume
      const far = [[0, 900, 1]]; for (let x = 0; x <= W; x += 16) far.push([x, 846 - 6 * Math.sin(x * 0.013) - 12 * Math.abs(Math.sin(x * 0.09 + hash(x) * 0.6))]); far.push([W, 900, 1]);
      fillPts(far, C2('#adb5ac', '#b4929a'), 5, 1);
      const far2 = [[0, 902, 1]]; for (let x = 0; x <= W; x += 14) far2.push([x, 874 - 8 * Math.abs(Math.sin(x * 0.11 + 1)) - 4 * hash(x * 0.71)]); far2.push([W, 902, 1]);
      fillPts(far2, C2('#929e92', '#9a7886'), 6, 0.6);
      const CF = { tronc: C2('#8e958a', '#94737a'), feuil: C2('#8c978a', '#8f727c'), feuilL: C2('#a3ab9c', '#a8868c'), mousse: C2('#bcbfb2', '#c2a0a4') };
      cypres(c, 180, 905, 330, 0.55, CF, 11, false); cypres(c, 560, 900, 300, 0.5, CF, 12, false); cypres(c, 905, 902, 350, 0.55, CF, 13, false);
      const CM = { tronc: C2('#5d5f4c', '#5e4646'), feuil: C2('#57624a', '#5a4b48'), feuilL: C2('#717c5c', '#7a6158'), mousse: C2(MOUSSE, '#b7999a') };
      cypres(c, 330, 1060, 690, 0.95, CM, 21, true); cypres(c, 770, 1040, 740, 1.0, CM, 22, true); cypres(c, 1010, 1080, 820, 1.05, CM, 23, true); cypres(c, 60, 1070, 660, 0.9, CM, 24, true);
      for (const [x, y, r] of [[420, 1190, 16], [452, 1200, 11], [560, 1172, 13], [690, 1206, 17], [720, 1196, 10], [250, 1214, 14]]) { pc([[x, y], ...ep(x, y, r, r * 0.32, 10, 0.3, TAU - 0.1)], C2('#5f7040', '#5a5040'), () => strokePts([[x - r * 0.6, y], [x + r * 0.5, y - 1]], 'rgba(220,230,180,0.35)', 1), x, { drop: false }); if (r > 15) dot(x - 4, y - 5, 4, C2('#e9e2d0', '#e8c8b0')); }
      // souche dans l'eau (pour la tortue)
      pc([[BY.tortue[0] - 22, BY.tortue[1] + 8, 1], [BY.tortue[0] - 16, BY.tortue[1] - 24], [BY.tortue[0] + 14, BY.tortue[1] - 26], [BY.tortue[0] + 22, BY.tortue[1] + 8, 1]], C2('#5a4c3a', '#523c34'), () => hatch(null, 1.4, 4, 0.25, 1, undefined, [BY.tortue[0] - 30, BY.tortue[1] - 30, BY.tortue[0] + 30, BY.tortue[1] + 10]), 31);
      // rive proche (sol de la clairière) + roseaux
      const rive = [[-10, 1236], [180, 1250], [400, 1228], [640, 1246], [860, 1232], [W + 10, 1240], [W + 10, BACK + 40, 1], [-10, BACK + 40, 1]];
      pc(rive, C2('#7a6a48', '#6a5240'), () => {
        const gr = c.createLinearGradient(0, 1230, 0, BACK); gr.addColorStop(0, C2('rgba(120,130,80,0.5)', 'rgba(140,110,70,0.4)')); gr.addColorStop(1, 'rgba(40,30,20,0.35)'); c.fillStyle = gr; c.fillRect(0, 1220, W, 220);
        const R = M.rng(41); for (let i = 0; i < 130; i++) { const x = R() * W, y = 1250 + R() * 150, h = 6 + R() * 12; strokePts([[x, y], [x + (R() - 0.5) * 6, y - h]], C2('rgba(95,108,62,0.75)', 'rgba(110,86,56,0.75)'), 1.2); }
        for (let i = 0; i < 60; i++) { const x = R() * W, y = 1256 + R() * 140; fillPts(ell(x, y, 4, 2.2, 6), ['#9a5a2e', '#b07a3a', '#7d4a2a'][i % 3], i, 0.3); }
        hatch(null, 0.08, 7, 0.12, 1, undefined, [-10, 1220, W + 10, BACK + 40]);
      }, 40, { drop: false });
      const R2 = M.rng(43);
      for (const rx of [380, 470, 600, 700]) for (let k = 0; k < 7; k++) { const x = rx + (R2() - 0.5) * 40, h = 30 + R2() * 40, y = 1240 + R2() * 8; strokePts([[x, y], [x + (R2() - 0.5) * 10, y - h]], C2('#6d7448', '#6a5644'), 1.6); if (k % 3 === 0) fillPts(ell(x + 1, y - h - 6, 2.4, 8, 6), C2('#6a4a2e', '#5a3a2a'), k, 0.2); }
    });
  }
  // grand chêne de coulisse (gauche ou droite, s = ±1) : tronc, grande branche en arche le long du haut, feuillage, mousse
  const CHL = { tr: [[30, BACK + 6, 1], [56, BACK - 40], [64, 900], [58, 500], [62, 150, 1], [150, 150, 1], [136, 520], [128, 900], [140, BACK - 46], [190, BACK + 6, 1]],
    br: [[120, 600], [230, 260], [560, 228]], br2: [[130, 860], [220, 790], [300, 760]] };
  function chene(c, side, seed) {
    const f = side < 0 ? (p) => [W - p[0], p[1], p[2]] : (p) => p, F = (a) => a.map(f), R = M.rng(seed);
    const brA = qbez(f(CHL.br[0]), f(CHL.br[1]), f(CHL.br[2]), 14), brB = qbez(f(CHL.br2[0]), f(CHL.br2[1]), f(CHL.br2[2]), 8);
    const ec = '#4b3a2a', ecL = '#6a5440';
    pc(ribbon(brA, 46, 12), ec, () => { hatch(null, 0.5, 5, 0.25, 1, undefined, [0, 150, W, 650]); }, seed + 1);
    pc(ribbon(brB, 22, 8), ec, null, seed + 2);
    pc(F(CHL.tr), ec, () => {
      const xs = side < 0 ? W - 100 : 100;
      for (let k = 0; k < 9; k++) strokePts([[xs - 34 + k * 8, BACK], [xs - 30 + k * 7 + Math.sin(k) * 6, 150]], 'rgba(30,20,12,0.35)', 1.4);
      for (let i = 0; i < 10; i++) { const y = 240 + i * 115; fillPts(ell(xs + (hash(i + seed) - 0.5) * 50, y, 8, 16, 10), 'rgba(30,20,12,0.4)', i); }
      shade(xs + 50 * side, 0, xs - 50 * side, 0, 0.45, [xs - 120, 140, xs + 120, BACK + 10]);
      strokePts([[xs - 40 * side, 160], [xs - 36 * side, BACK - 60]], `rgba(255,236,200,0.18)`, 3);
    }, seed);
    // feuillage le long de la branche et en haut
    const blobs = [];
    for (let i = 0; i < 9; i++) { const p = brA[Math.min(14, 2 + Math.round(i * 1.45))]; blobs.push([p[0] + (R() - 0.5) * 40, p[1] - 30 - R() * 40, 60 + R() * 40, 34 + R() * 18]); }
    blobs.push([f([100, 190])[0], 190, 90, 60], [f([180, 300])[0], 330, 60, 40], [f([300, 760])[0], 740, 46, 30], [f([250, 780])[0], 770, 40, 26]);
    for (const [bx, by, rx, ry] of blobs) pc(blob(bx, by, rx, ry, bx + by), '#4a5638', () => {
      const r2 = M.rng(Math.round(bx * 7 + by)); for (let j = 0; j < 26; j++) { const lx = bx + (r2() - 0.5) * rx * 1.8, ly = by + (r2() - 0.6) * ry * 1.6; fillPts(ell(lx, ly, 5, 3, 6), r2() < 0.15 ? '#9a5a2e' : (r2() < 0.5 ? '#6b7448' : '#3c4630'), j, 0.2); }
      shade(bx, by - ry, bx, by + ry, 0.4, [bx - rx - 10, by - ry - 10, bx + rx + 10, by + ry + 10]);
    }, Math.round(bx), { drop: true });
    if (side > 0) {   // cor de chasse pendu à la branche basse (corne claire, embouchure de laiton) + courroie
      const hx_ = 268, hy = 768;
      strokePts([[hx_, hy], [hx_ - 14, hy + 40], [hx_ + 18, hy + 50]], '#3a2616', 2.2);
      const cor = ribbon(qbez([hx_ - 26, hy + 48], [hx_ - 6, hy + 92], [hx_ + 30, hy + 56], 10), 6, 26);
      pc(cor, '#d8c49a', () => { for (let k = 0; k < 6; k++) strokePts([[hx_ - 20 + k * 9, hy + 50], [hx_ - 18 + k * 9, hy + 100]], 'rgba(90,60,30,0.35)', 1.4); }, 51);
      fillPts(rect(hx_ - 30, hy + 44, hx_ - 22, hy + 52), '#b08d45');
      fillPts(ell(hx_ + 31, hy + 56, 6, 13, 10), '#3a2a1a');
    }
  }
  // points d'accroche de la mousse (dans le repère de chaque arbre)
  function mousseAnchors(side) {
    const f = side < 0 ? (p) => [W - p[0], p[1]] : (p) => p, brA = qbez(f(CHL.br[0]), f(CHL.br[1]), f(CHL.br[2]), 14), out = [];
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach((i, k) => out.push([brA[i][0], brA[i][1] + 10, 100 + 120 * hash(k * 1.3 + side * 3), k + side * 20]));
    const brB = qbez(f(CHL.br2[0]), f(CHL.br2[1]), f(CHL.br2[2]), 8); out.push([brB[5][0], brB[5][1] + 6, 80, 7 + side]);
    return out;
  }
  const MOU = { L: null, R: null, A: [[560, 776, 100, 31], [600, 740, 70, 32], [712, 770, 110, 33], [752, 720, 80, 34], [520, 700, 70, 35]] };
  function mousse(g, list, amp, col) {
    for (const [ax, ay, L, sd] of list) {
      const ph = hash(sd) * TAU, raf = 0.75 + 0.25 * Math.sin(g * 0.31 + ph), sw = amp * raf * (Math.sin(g * 1.1 + ph) + 0.4 * Math.sin(g * 2.4 + ph * 2));
      for (let j = 0; j < 3; j++) {
        const ox = (j - 1) * 9, l = L * (0.6 + 0.4 * hash(sd + j)), pts = [];
        for (let k = 0; k <= 6; k++) { const v = k / 6; pts.push([ax + ox + sw * Math.pow(v, 1.6) + Math.sin(v * 5 + sd + j) * 3, ay + l * v]); }
        fillPts(ribbon(pts, 11 - j * 2, 1.6), j === 1 ? MOUSSED : col, sd * 3 + j, 0.7);
      }
    }
  }
  function makeJeuneChene() {
    return lay(440, 400, 860, BACK + 10, (c) => {
      const x = 640, tr = [[x - 34, BACK + 4, 1], [x - 20, BACK - 30], [x - 20, 1000], [x - 18, 840], [x - 62, 740], [x - 50, 730], [x - 8, 800], [x - 6, 700], [x + 6, 700], [x + 8, 790], [x + 60, 720], [x + 70, 730], [x + 18, 840], [x + 20, 1000], [x + 22, BACK - 30], [x + 36, BACK + 4, 1]];
      pc(tr, '#5a4632', () => { for (let k = 0; k < 5; k++) strokePts([[x - 14 + k * 7, BACK], [x - 12 + k * 6, 840]], 'rgba(30,20,12,0.35)', 1.2); shade(x + 24, 0, x - 24, 0, 0.45, [x - 70, 690, x + 80, BACK + 6]); }, 61);
      const R = M.rng(62), bl = [[640, 566, 92, 62], [566, 624, 62, 46], [722, 622, 68, 48], [600, 692, 70, 40], [690, 700, 70, 40], [640, 636, 86, 54], [584, 548, 50, 36], [708, 540, 54, 38]];
      for (const [bx, by, rx, ry] of bl) pc(blob(bx, by, rx, ry, bx * 3 + by), '#55603e', () => {
        for (let j = 0; j < 34; j++) { const lx = bx + (R() - 0.5) * rx * 1.8, ly = by + (R() - 0.55) * ry * 1.7; fillPts(ell(lx, ly, 5, 3, 6), R() < 0.2 ? '#a3622e' : (R() < 0.5 ? '#76804e' : '#3f4a30'), j, 0.2); }
        shade(bx, by - ry, bx, by + ry, 0.4, [bx - rx - 10, by - ry - 10, bx + rx + 10, by + ry + 10]);
      }, bx + by);
    });
  }
  // cannes (canebrake) : touffe de longues tiges à nœuds, feuilles en lanières
  function cannes(c, x0, n, hMin, hMax, seed, base) {
    const R = M.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = x0 + (R() - 0.5) * 130, h = hMin + R() * (hMax - hMin), lean = (R() - 0.5) * 0.12, top = [x + Math.sin(lean) * h, base - h];
      const col = R() < 0.5 ? '#8b8a52' : '#a19a5e';
      pc(bar([x, base], top, 7), col, () => { for (let y = base - 40; y > base - h; y -= 46) strokePts([[x - 6 + (base - y) * Math.sin(lean), y], [x + 6 + (base - y) * Math.sin(lean), y]], 'rgba(60,50,24,0.6)', 1.6); }, seed + i, { drop: false });
      for (let k = 0; k < 5; k++) {
        const v = 0.45 + k * 0.12, px = lerp(x, top[0], v), py = lerp(base, top[1], v), sgn = k % 2 ? 1 : -1, L = 40 + R() * 40;
        pc(ribbon(qbez([px, py], [px + sgn * L * 0.6, py - 14], [px + sgn * L, py + 12 + R() * 14], 6), 8, 1), R() < 0.5 ? '#6f7a44' : '#87894e', null, seed + i * 9 + k, { drop: false });
      }
    }
  }
  function makeCannes() {
    const out = [];
    [[830, 9, 420, 640, 71], [930, 10, 480, 720, 72], [1010, 8, 440, 660, 73]].forEach(([x, n, a, b, s]) => {
      const cv = lay(x - 160, BACK - b - 60, x + 160, BACK + 6, (c) => cannes(c, x, n, a, b, s, BACK)); cv.px = x; out.push(cv);
    });
    return out;
  }
  // buisson de cannes (fond, puis l'avant qui passe devant la tête de l'ours) ; origine = pied du buisson
  function makeBuisson(avant) {
    return lay(-180, -360, 180, 10, (c) => {
      const R = M.rng(avant ? 82 : 81);
      if (!avant) {
        cannes(c, 0, 12, 180, 330, 83, 0);
        for (let i = 0; i < 7; i++) pc(blob(-120 + i * 40, -60 - R() * 50, 50, 40, i * 5 + 1), i % 2 ? '#56603a' : '#4a5434', () => { for (let j = 0; j < 14; j++) fillPts(ell(-140 + i * 40 + R() * 40, -110 + R() * 90, 6, 2.5, 6), '#7a8450', j, 0.2); }, 84 + i);
      } else {
        for (let i = 0; i < 6; i++) pc(blob(-130 + i * 52, -40 - R() * 30, 52, 44, i * 7 + 3), i % 2 ? '#4c5634' : '#5c6640', () => { for (let j = 0; j < 16; j++) fillPts(ell(-170 + i * 52 + R() * 70, -90 + R() * 90, 7, 2.8, 6), j % 4 ? '#7f8a52' : '#9a6a36', j, 0.2); hatch(null, 0.6, 6, 0.14, 1, undefined, [-200, -120, 200, 10]); }, 91 + i);
        cannes(c, 0, 5, 140, 200, 95, 4);
      }
    });
  }
  // tente de toile, mât, haubans ; lanterne (éteinte) ; seau de toile
  function makeTente() {
    return ombre(lay(20, 900, 360, BACK + 10, (c) => {
      const T = '#c9b88e', TD = '#a8956a';
      strokePts([[60, 1102], [26, BACK]], '#6a5a40', 1.4); strokePts([[330, 1100], [352, BACK]], '#6a5a40', 1.4);
      pc([[110, 962], [276, 958, 1], [222, 1100, 1], [60, 1102, 1]], TD, () => { for (let k = 1; k < 6; k++) strokePts([[110 + k * 28, 962], [60 + k * 27, 1102]], 'rgba(90,70,40,0.3)', 1.2); shade(0, 960, 0, 1100, 0.3, [50, 950, 290, 1110]); }, 101);
      pc(rect(60, 1102, 222, BACK + 4), T, () => { for (let k = 1; k < 6; k++) strokePts([[60 + k * 27, 1102], [60 + k * 27, BACK]], 'rgba(90,70,40,0.25)', 1.2); shade(222, 0, 60, 0, 0.3, [50, 1100, 230, BACK + 6]); }, 102);
      pc([[222, 1100, 1], [276, 958, 1], [330, 1100, 1], [330, BACK + 4, 1], [222, BACK + 4, 1]], T, () => {
        fillPts([[238, BACK + 4], [276, 1012], [314, BACK + 4]], '#2c241a');
        fillPts([[300, 1270], [314, 1300], [314, BACK]], '#6a3a2a'); strokePts([[290, 1290], [314, 1290]], '#c9b07a', 2);  // coin de la couchette (couverture)
        fillPts([[232, BACK + 4], [276, 1016], [246, 1180], [226, BACK]], '#c4b38a'); fillPts([[320, BACK + 4], [276, 1016], [306, 1180], [326, BACK]], '#c4b38a');
        strokePts([[244, 1180], [222, 1186]], '#7a5a34', 2); strokePts([[308, 1180], [330, 1186]], '#7a5a34', 2);
      }, 103);
      pc(bar([276, BACK + 4], [276, 930], 7), '#6a4a2c', null, 104);
      fillPts(bar([276, 984], [292, 984], 5), '#4a3220');
      // lanterne tempête (éteinte) : anse, chapeau, globe, garde, réservoir
      const L = BY.lant;
      strokePts(ep(L.x, L.y + 8, 12, 12, 10, PI, TAU), '#2a2a2a', 1.6);
      pc([[L.x - 12, L.y + 10], [L.x + 12, L.y + 10], [L.x + 16, L.y + 20, 1], [L.x - 16, L.y + 20, 1]], '#3a3c3a', null, 105);
      pc(ell(L.x, L.y + 36, 12, 17, 14), '#c9cfb8', () => strokePts([[L.x - 5, L.y + 24], [L.x - 6, L.y + 46]], 'rgba(255,255,255,0.6)', 2), 106);
      for (const dx of [-12, 0, 12]) strokePts([[L.x + dx, L.y + 20], [L.x + dx * 1.1, L.y + 52]], '#2a2a2a', 1.3);
      pc([[L.x - 17, L.y + 52, 1], [L.x + 17, L.y + 52, 1], [L.x + 15, L.y + 64, 1], [L.x - 15, L.y + 64, 1]], '#4a4c48', () => strokePts([[L.x - 14, L.y + 56], [L.x + 14, L.y + 56]], 'rgba(255,255,255,0.3)', 1.4), 107);
      // seau de toile (près du feu)
      pc([[150, BACK - 46], [186, BACK - 46], [182, BACK + 2, 1], [154, BACK + 2, 1]], '#bfae86', () => { strokePts([[150, BACK - 40], [186, BACK - 40]], '#6a5a3a', 2); hatch(null, 1.2, 4, 0.2, 1, undefined, [140, BACK - 50, 200, BACK + 4]); }, 108);
      strokePts(ep(168, BACK - 46, 18, 16, 8, PI, TAU), '#5a4a2e', 1.6);
    }), 8);
  }
  // feu de camp : deux pierres, bûches, crémaillère (deux fourches + traverse), cafetière émaillée bleue (sans couvercle : dessiné vivant)
  function makeFeu() {
    return lay(120, 1200, 310, BACK + 10, (c) => {
      const F = BY.feu, P0 = BY.pot;
      for (const [x, w] of [[150, 26], [276, 26]]) pc(bar([x, BACK + 4], [x + (x < 200 ? 4 : -4), 1220], 6), '#5a4228', null, x);
      fillPts([[143, 1226], [150, 1234], [154, 1214]], '#5a4228'); fillPts([[283, 1226], [276, 1234], [272, 1214]], '#5a4228');
      pc(bar([140, 1226], [290, 1224], 6), '#6a4c2e', null, 111);
      strokePts([[P0.x, 1226], [P0.x, 1240]], '#2a2a2a', 1.6); strokePts(ep(P0.x, 1252, 18, 12, 10, PI, TAU), '#2a2a2a', 1.5);
      // cafetière émaillée bleue mouchetée
      pc([[P0.x - 14, 1250], [P0.x + 14, 1250], [P0.x + 22, 1314], [P0.x + 16, 1322, 1], [P0.x - 16, 1322, 1], [P0.x - 22, 1314]], '#3d5f88', () => {
        const R = M.rng(113); for (let j = 0; j < 22; j++) dot(P0.x - 18 + R() * 36, 1252 + R() * 68, 1.4, 'rgba(240,240,232,0.85)');
        shade(P0.x + 20, 0, P0.x - 20, 0, 0.35, [P0.x - 30, 1240, P0.x + 30, 1330]); strokePts([[P0.x - 8, 1258], [P0.x - 12, 1310]], 'rgba(255,255,255,0.35)', 2.4);
      }, 112);
      pc([[P0.x + 16, 1290], [P0.x + 40, 1262], [P0.x + 44, 1266], [P0.x + 22, 1302]], '#3d5f88', null, 114);
      strokePts(ep(P0.x - 22, 1286, 10, 18, 8, PI / 2, PI * 1.5), '#2c3e5a', 3);
      // pierres et bûches (charbonneuses)
      pc(blob(166, BACK - 10, 26, 18, 7), '#8a8478', () => hatch(null, 0.8, 4, 0.25, 1, undefined, [130, BACK - 30, 200, BACK + 10]), 115);
      pc(blob(262, BACK - 10, 28, 20, 9), '#7d776c', () => hatch(null, 0.8, 4, 0.25, 1, undefined, [230, BACK - 30, 300, BACK + 10]), 116);
      pc(bar([180, BACK - 2], [250, BACK - 22], 14), '#4a3424', () => fillPts(ell(250, BACK - 22, 6, 7, 8), '#c96a2a'), 117);
      pc(bar([246, BACK], [178, BACK - 20], 13), '#3e2c1e', () => fillPts(ell(178, BACK - 20, 5, 6, 8), '#b85a24'), 118);
      fillPts(ell(F.x, BACK + 2, 40, 6, 12), '#2a2420', 3, 0.3);
    });
  }
  // malle cerclée + couverture écossaise roulée + gamelle et quart ; râtelier de branches avec deux fusils au repos
  function makeCamp() {
    return ombre(lay(760, 1060, 1000, BACK + 10, (c) => {
      for (const x of [800, 896]) { pc(bar([x, BACK + 4], [x + (x < 850 ? 4 : -4), 1090], 9), '#5c4630', null, x); fillPts([[x - 12, 1086], [x - 2, 1104], [x + 2, 1104], [x + 12, 1084], [x + 4, 1100], [x - 4, 1100]], '#5c4630'); }
      pc(bar([790, 1104], [908, 1102], 8), '#6c5236', null, 121);
      for (const [x, s] of [[826, 1], [866, 2]]) {   // fusils debout (crosse au sol, canon contre la traverse)
        pc([[x - 9, BACK + 2, 1], [x + 9, BACK + 2, 1], [x + 6, 1330], [x + 3, 1290], [x - 3, 1290], [x - 6, 1330]], '#6a3e22', () => strokePts([[x - 4, BACK], [x - 2, 1300]], 'rgba(255,220,170,0.3)', 1.5), 122 + s);
        pc(bar([x, 1294], [x + 2, 1096], 5), '#3a3530', null, 124 + s); fillPts(bar([x - 2, 1294], [x - 1, 1250], 4), '#2a2622');
      }
      // malle bombée cerclée
      const m = [[830, BACK + 2, 1], [830, 1322], [836, 1300], [895, 1292], [954, 1300], [960, 1322], [960, BACK + 2, 1]];
      pc(m, '#6e4a2c', () => {
        for (const x of [852, 938]) fillPts(rect(x - 6, 1290, x + 6, BACK + 2), '#3a2a1c');
        fillPts(rect(828, 1324, 962, 1332), '#3a2a1c'); for (const x of [852, 938]) for (const y of [1330, 1370]) dot(x, y, 2.4, '#c9a24a');
        fillPts(rect(886, 1328, 904, 1346), '#b08d45'); dot(895, 1340, 2, '#2a1e14'); hatch(null, 0.3, 5, 0.2, 1, undefined, [820, 1280, 970, BACK + 4]); shade(960, 0, 830, 0, 0.3, [820, 1280, 970, BACK + 4]);
      }, 126);
      // couverture écossaise roulée (rouge et vert) attachée d'une courroie
      pc(bar([842, 1282], [916, 1280], 26), '#7f2a22', () => { for (let x = 842; x < 920; x += 14) { fillPts(rect(x, 1266, x + 5, 1296), 'rgba(40,70,48,0.8)'); } for (const y of [1274, 1288]) strokePts([[836, y], [922, y]], 'rgba(40,70,48,0.8)', 3); strokePts([[846, 1272], [916, 1271]], 'rgba(230,200,120,0.5)', 1); }, 127);
      for (const x of [860, 898]) fillPts(rect(x - 3, 1266, x + 3, 1296), '#3a2a1a');
      fillPts(ell(916, 1281, 6, 13, 10), '#5a1a16');
      // gamelle et quart en fer-blanc
      pc([[924, 1300], [954, 1300], [950, 1288, 1], [928, 1288, 1]], '#a9aba4', () => strokePts([[928, 1291], [950, 1291]], 'rgba(255,255,255,0.6)', 1.4), 128);
      pc(rect(936, 1272, 950, 1288), '#b9bbb2', () => strokePts([[938, 1274], [938, 1286]], 'rgba(255,255,255,0.7)', 1.4), 129);
      strokePts(ep(952, 1280, 6, 5, 6, -PI / 2, PI / 2), '#8a8c86', 1.6);
    }), 8);
  }
  // premier plan : souche + fougères (gauche), bûche + selle de cuir (droite), feuilles mortes
  function makeBySol(S) {
    return lay(0, 1240, W, BACK + 70, (c) => {
      const dk = (col) => (S ? mixA(col, '#3a2630', 0.35) : col);
      const R = M.rng(141 + (S ? 0 : 0));
      // souche
      pc([[30, BACK + 34, 1], [44, 1362], [50, 1342], [118, 1338], [128, 1362], [146, BACK + 34, 1]], dk('#5a4430'), () => {
        fillPts(ell(84, 1344, 34, 7, 16), dk('#b89a6a')); for (let k = 1; k < 4; k++) strokePts(ep(84, 1344, 34 - k * 8, 7 - k * 1.6, 16, 0, TAU), dk('#7a5e3c'), 1);
        hatch(null, 1.5, 5, 0.25, 1, undefined, [20, 1330, 160, BACK + 40]); shade(146, 0, 30, 0, 0.35, [20, 1330, 160, BACK + 40]);
      }, 142);
      // bûche + selle
      pc([[828, BACK + 30], [830, 1374], [1030, 1366], [1034, BACK + 26]], dk('#5e4632'), () => { fillPts(ell(830, BACK + 2, 10, 26, 12), dk('#b89a6a')); hatch(null, 0.05, 6, 0.25, 1, undefined, [820, 1360, 1040, BACK + 36]); }, 143);
      pc([[858, 1376, 1], [862, 1340], [990, 1336], [994, 1376, 1]], dk('#5e3018'), () => { strokePts(rect(868, 1346, 984, 1370), 'rgba(255,220,170,0.25)', 1.4, true); hatch(null, 0.3, 5, 0.18, 1, undefined, [850, 1330, 1000, 1380]); }, 146);
      const sel = [[866, 1346], [872, 1318], [868, 1300], [880, 1296], [886, 1316], [912, 1334], [946, 1332], [972, 1310], [984, 1288], [994, 1292], [992, 1320], [980, 1346]];
      pc(sel, dk('#8a4e2a'), () => { strokePts([[890, 1330], [960, 1330]], 'rgba(255,220,170,0.4)', 2); shade(0, 1290, 0, 1350, 0.35, [850, 1280, 1000, 1352]); for (let k = 0; k < 6; k++) dot(900 + k * 14, 1342, 1.6, '#c9a24a'); }, 144);
      fillPts(ell(874, 1296, 8, 5, 10), dk('#5a301a'));
      pc(ribbon([[926, 1350], [924, 1386], [926, 1410]], 20, 14), dk('#6a3a20'), () => strokePts([[918, 1356], [918, 1404]], 'rgba(255,220,170,0.3)', 1.2), 145);
      pc([[912, 1410, 1], [940, 1410, 1], [944, 1432, 1], [908, 1432, 1]], dk('#4a2c18'), () => fillPts(rect(914, 1414, 938, 1426), dk('#2a1a10')), 147);
      // feuilles mortes rousses
      for (let i = 0; i < 60; i++) { const left = i % 2 === 0, x = left ? 40 + R() * 220 : 800 + R() * 240, y = BACK + 8 + R() * 50, a = R() * PI; c.save(); c.translate(x, y); c.rotate(a); fillPts([[-8, 0], [-3, -4], [4, -4], [9, 0], [4, 4], [-3, 4]], dk(['#9a5a2e', '#b4783a', '#7a4422', '#c08a44'][i % 4]), i, 0.3); strokePts([[-8, 0], [9, 0]], 'rgba(60,30,14,0.5)', 0.8); c.restore(); }
    });
  }
  function makeFougere(seed, L) {
    return lay(-90, -L - 20, 90, 6, (c) => {
      const R = M.rng(seed);
      for (let f = 0; f < 4; f++) {
        const a = -0.9 + f * 0.6 + (R() - 0.5) * 0.2, line = qbez([0, 0], [Math.sin(a) * L * 0.5, -L * 0.6], [Math.sin(a) * L * 0.9, -L * (0.75 + 0.2 * R())], 10);
        pc(ribbon(line, 3, 1), '#4f6a3a', null, seed + f, { drop: false });
        for (let k = 1; k < 10; k++) { const p = line[k], q = line[k + 1] || p, dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = (1 - k / 10) * 22 + 5;
          for (const s of [-1, 1]) fillPts([[p[0], p[1]], [p[0] + nx * w * s + dx * 0.3, p[1] + ny * w * s + dy * 0.3], [q[0], q[1]]], k % 3 ? '#5f7d44' : '#6f8a4e', seed + k + s, 0.2); }
      }
    });
  }
  // héron immobile sur un pied (petit, pâli) ; tortue sur sa souche
  function heron(x, y, g, br) {
    const col = mixA('#7d8790', '#c9c2b0', br), dk = mixA('#3c4248', '#c9c2b0', br), dip = Math.max(0, Math.sin(g * 0.35)) > 0.97 ? 6 : 0;
    strokePts([[x, y], [x + 1, y - 26]], dk, 1.6);
    fillPts([[x - 14, y - 26], [x - 4, y - 34], [x + 12, y - 36], [x + 18, y - 30], [x + 6, y - 22], [x - 10, y - 20]], col, 3, 0.2);
    fillPts(ribbon([[x + 12, y - 34], [x + 18, y - 46], [x + 14, y - 56 + dip]], 4, 3), col, 4, 0.2);
    fillPts([[x + 12, y - 60 + dip], [x + 18, y - 60 + dip], [x + 32, y - 56 + dip], [x + 16, y - 54 + dip]], dk, 5, 0.1);
  }
  function tortue(x, y, g) {
    const k = smooth(0.2, 0.6, Math.sin(g * 0.45) * 0.5 + 0.5);
    fillPts(ep(x, y - 26, 14, 9, 10, PI, TAU).concat([[x + 14, y - 26]]), '#4e5236', 6, 0.2);
    fillPts(ell(x + 14 + 6 * k, y - 28 - 2 * k, 4, 3, 8), '#5e5e3a', 7, 0.1);
    strokePts([[x - 10, y - 30], [x + 8, y - 32]], 'rgba(200,200,160,0.35)', 1);
  }
  function ecureuil(x, y, rot, g, mode) {   // mode 0 = descend (tête en bas), 1 = arrêté (assis, regarde vers la droite)
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(rot); c.scale(1.35, 1.35);
    const col = '#7f7a72', cl = '#d9d2c2', fl = mode ? 0.25 * Math.sin(g * 6) * (Math.sin(g * 0.9) > 0.4 ? 1 : 0.15) : 0.1 * Math.sin(g * 9);
    pc(ribbon(qbez([-10, 0], [-34, -6 + fl * 20], [-30, -34 + fl * 30], 8), 14, 18), '#8a847a', () => strokePts([[-14, -2], [-30, -30]], 'rgba(255,255,255,0.25)', 2), 151, { drop: false });
    pc(ell(0, 0, 15, 10, 12), col, () => fillPts(ell(4, 5, 9, 4, 8), cl), 152, { drop: false });
    pc(ell(16, -6, 8, 7, 10), col, null, 153, { drop: false });
    fillPts([[12, -12], [14, -20], [17, -12]], col); dot(19, -8, 1.8, '#141414'); dot(24, -5, 1.4, '#3a2a2a');
    for (const dx of [-6, 8]) fillPts(bar([dx, 6], [dx + 3, 13], 3), '#6a655e');
    c.restore();
  }

  // ---- M.ted.bayou(t, up, o) : toile de fond + plan intermédiaire (AVANT M.drawFloor)
  D.bayou = function (t, up, o) {
    o = o || {}; up = up || 0;
    const c = cx_(), g = M.tg(t), so = clamp(o.soir || 0), br = o.brume == null ? 0.35 : clamp(o.brume);
    const feu = o.feu !== false, arbreX = o.arbre === false ? null : (typeof o.arbre === 'number' ? o.arbre : 640);
    const bX = o.buisson == null || o.buisson === false ? null : (typeof o.buisson === 'number' ? o.buisson : 820);
    const luc = clamp(o.lucioles == null ? so : o.lucioles), lan = clamp(o.lanterne == null ? smooth(0.3, 0.8, so) : o.lanterne);
    if (arbreX != null) D.arbrePt = { x: arbreX, y: 1300 - up };
    if (bX != null) D.buissonPt = { x: bX, y: BACK - 300 - up };
    c.save(); c.translate(0, -up);
    // 1) toile de fond (jour → soir)
    c.drawImage(K.byFond[0], 0, 0); if (so > 0) { c.save(); c.globalAlpha = so; c.drawImage(K.byFond[1], 0, 0); c.restore(); }
    M.nuages(t, { y0: 300, y1: 480, n: 5, vit: 20, s: 0.8, seed: 7, brume: 0.1, col: mixH('#f3eee2', '#f4cfa8', so) });
    M.oiseaux(g, { x0: 1150, x1: -80, y: 610, t0: 0, dur: 13, n: 5, s: 0.75, seed: 4, col: '#f4f0e4', brume: 0.15, boucle: true });
    M.oiseaux(g + 5, { x0: -60, x1: 1140, y: 700, t0: 0, dur: 15, n: 4, s: 0.6, seed: 9, col: '#f4f0e4', brume: 0.25, boucle: true });
    // vie de l'eau : reflets qui glissent, ronds autour des genoux de cyprès, poisson
    for (let i = 0; i < 12; i++) { const y = 925 + i * 26, sp = 5 + (i % 3) * 4, x = ((hash(i * 3.3) * 1300 + g * sp) % 1300) - 100, a = 0.16 + 0.1 * Math.sin(g * 1.3 + i); strokePts([[x, y], [x + 26 + 18 * hash(i + 5), y]], so > 0.5 ? `rgba(255,214,150,${a + 0.08})` : `rgba(240,242,228,${a})`, 1.4); }
    for (const [x, y, ph] of [[372, 1068, 0], [540, 1010, 0.37], [700, 1100, 0.71], [470, 1180, 0.2], [820, 1170, 0.55]]) { const u = ((g * 0.22 + ph) % 1 + 1) % 1; strokePts(ep(x, y, 6 + 44 * u, 2 + 7 * u, 18, 0, TAU), `rgba(235,236,220,${0.45 * (1 - u)})`, 1.3, true); }
    if (o.poisson != null) {
      const u = (t - o.poisson) / 0.8, px = o.poissonX || 540, sy = BY.eau;
      if (u > 0 && u < 1) { c.save(); c.translate(px - 30 + 60 * u, sy - Math.sin(u * PI) * 52); c.rotate((u - 0.5) * 2.2); fillPts([[16, 0], [4, -7], [-10, 0], [-18, -7], [-16, 0], [-18, 7], [-10, 0], [4, 7]], '#8a9298', 1, 0.2); dot(10, -1, 1.4, '#1a1a1a'); c.restore(); }
      for (const [x0, d0] of [[px - 30, 0], [px + 30, 0.8]]) { const v = (t - o.poisson - d0) / 2.2; if (v > 0 && v < 1) for (let k = 0; k < 2; k++) { const w = clamp(v - k * 0.18, 0, 1); if (w > 0) strokePts(ep(x0, sy, 6 + 46 * w, 2 + 8 * w, 18, 0, TAU), `rgba(240,240,226,${0.6 * (1 - w)})`, 1.6, true); } }
    }
    heron(BY.heron[0], BY.heron[1], g, 0.2 + 0.2 * so); tortue(BY.tortue[0], BY.tortue[1] - 18, g);
    // brume qui dérive au ras de l'eau
    if (br > 0) for (let i = 0; i < 3; i++) { const x = ((g * (7 + i * 3) + i * 420) % 1500) - 300, y = 940 + i * 70, gr = c.createRadialGradient(x, y, 10, x, y, 260); gr.addColorStop(0, `rgba(240,236,224,${0.4 * br})`); gr.addColorStop(1, 'rgba(240,236,224,0)'); c.save(); c.translate(x, y); c.scale(1, 0.22); c.translate(-x, -y); c.fillStyle = gr; c.fillRect(x - 260, y - 260, 520, 520); c.restore(); }
    // 2) plan intermédiaire : cannes (qui ondulent), tente, camp, feu, jeune chêne, buisson, grands chênes de coulisse + mousse
    K.cannes.forEach((cv, i) => put(cv, (0.016 * Math.sin(g * (0.8 + i * 0.13) + i * 1.7) + 0.007 * Math.sin(g * 2.3 + i)) * (0.8 + 0.2 * Math.sin(g * 0.37)), cv.px, BACK, 0, null));
    put(K.byTente, 0, 0, 0, 0.3);
    put(K.byCamp, 0, 0, 0, 0.3);
    put(K.byFeu, 0, 0, 0);
    if (bX != null) { const sec = (o.secoue || 0) * Math.sin(g * 17); c.save(); c.translate(bX, BACK); c.rotate(0.01 * Math.sin(g * 0.8) + 0.03 * sec); c.drawImage(K.buisson[0], K.buisson[0].x0, K.buisson[0].y0); c.restore(); }
    if (arbreX != null) rotAt(0.006 * Math.sin(g * 0.9), arbreX, BACK, () => { c.save(); c.translate(arbreX - 640, 0); put(K.byChene, 0, 0, 0, 0.3); mousse(g, MOU.A, 16, MOUSSE); c.restore(); });
    // feuilles de chêne qui tombent lentement (sur les côtés)
    for (let i = 0; i < 9; i++) { const per = 9 + (i % 4) * 2, u = (((g + i * 2.3) % per) + per) % per / per, x0 = 170 + ((i * 97) % 760), x = x0 + 50 * Math.sin(u * 9 + i), y = lerp(300, BACK - 10, u); if (u < 0.97) { c.save(); c.translate(x, y); c.rotate(Math.sin(u * 14 + i) * 1.2); c.scale(1.5, 1.5 * (0.4 + 0.6 * Math.abs(Math.sin(u * 11 + i)))); fillPts([[-8, 0], [-3, -4], [4, -4], [9, 0], [4, 4], [-3, 4]], ['#8a4a22', '#a8642c', '#6e5a2a'][i % 3], i, 0.2); c.restore(); } }
    rotAt(0.004 * Math.sin(g * 0.5 + 1), BY.chR[0], BY.chR[1], () => { put(K.chR, 0, 0, 0, 0.35); mousse(g, MOU.R, 21, MOUSSE); });
    rotAt(0.004 * Math.sin(g * 0.55), BY.chL[0], BY.chL[1], () => {
      put(K.chL, 0, 0, 0, 0.35); mousse(g, MOU.L, 21, MOUSSE);
      if (o.ecureuil != null) {    // écureuil gris : 0 → 0,1 sort de derrière le tronc, → 0,8 descend, puis s'arrête ; > 1 → 2 remonte et disparaît
        const e = o.ecureuil, up_ = e > 1 ? clamp(e - 1) : 0, d = smooth(0.1, 0.8, Math.min(e, 1)) * (1 - up_), y = lerp(560, 880, d), appear = smooth(0, 0.1, e) * (1 - smooth(0.85, 1, up_));
        const stop = e <= 1 ? smooth(0.8, 0.9, e) : 1 - smooth(1, 1.12, e);
        if (appear > 0.02) { c.save(); c.globalAlpha = appear; ecureuil(104, y, lerp(e > 1 ? -PI / 2 : PI / 2, 0, stop), g, stop > 0.5 ? 1 : 0); c.restore(); }
      }
    });
    // teinte du soir (crépuscule doré) sur tout le décor, puis les lumières par-dessus
    if (so > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(178,128,140,${0.32 * so})`; c.fillRect(0, 0, W, BACK + 40); c.restore(); glow(430, 820, 380, '255,190,110', 0.12 * so); }
    // feu, fumée, cafetière (événement : déborde, couvercle qui sautille)
    const P0 = BY.pot, cf = clamp(o.cafetiere || 0), bout = cf > 0 && cf < 1 ? Math.sin(cf * PI) : 0;
    if (feu) {
      glow(BY.feu.x, BY.feu.y - 30, 170, '255,150,60', 0.22 + 0.04 * Math.sin(g * 9));
      M.flamme(t, { x: BY.feu.x - 12, y: BY.feu.y - 4, s: 1.15, r: 150, seed: 61 }); M.flamme(t, { x: BY.feu.x + 14, y: BY.feu.y - 2, s: 0.9, lueur: false, seed: 62 }); M.flamme(t, { x: BY.feu.x, y: BY.feu.y - 6, s: 1.4, lueur: false, seed: 63 });
      for (let i = 0; i < 5; i++) { const u = ((g * 0.7 + i * 0.21) % 1), ex = BY.feu.x + Math.sin(u * 7 + i * 2) * 14 + (i - 2) * 5, ey = BY.feu.y - 30 - u * 120; dot(ex, ey, 1.6, `rgba(255,${180 - 60 * u},80,${0.9 * (1 - u)})`); }
      M.fumee(t, { x: BY.feu.x + 6, y: BY.feu.y - 60, s: 0.7, n: 6, haut: 420, vent: 50, col: '#cfc8bc', a: 0.42, seed: 64 });
      M.fumee(t, { x: P0.x + 44, y: 1260, s: 0.22 + 0.25 * bout, n: 4, haut: 120 + 120 * bout, vent: 30, col: '#f2eee6', a: 0.55 + 0.3 * bout, per: 2.2, seed: 65 });
    } else M.fumee(t, { x: BY.feu.x, y: BY.feu.y - 10, s: 0.4, n: 4, haut: 220, vent: 26, col: '#bdb7ad', a: 0.3, seed: 66 });
    const hop = bout * Math.abs(Math.sin(cf * PI * 9)) * 7;
    c.save(); c.translate(P0.x, 1250 - hop); c.rotate(bout * 0.12 * Math.sin(cf * PI * 9));
    pc([[-15, 1, 1], [15, 1, 1], [10, -6], [-10, -6]], '#365478', null, 117, { drop: false }); dot(0, -8, 3.2, '#2a2a2a'); c.restore();
    if (bout > 0.2) for (let i = 0; i < 3; i++) { const v = ((cf * 6 + i / 3) % 1); dot(P0.x + 44 + v * 20, 1262 + v * v * 60, 2, `rgba(220,226,232,${0.8 * (1 - v)})`); }
    // lanterne tempête (s'allume) ; lucioles près des cannes
    if (lan > 0) { const L = BY.lant; c.save(); c.globalAlpha = lan; glow(L.x, L.y + 36, 30, '255,210,120', 0.6); M.flamme(t, { x: L.x, y: L.y + 44, s: 0.42, r: 260, seed: 67 }); c.restore(); }
    if (luc > 0) { const th = [0, 0.4, 0.75, 0.8, 0.86, 0.92, 0.96];
      th.forEach((a, i) => { const on = smooth(a, a + 0.1, luc); if (on <= 0) return; const ph = hash(i * 7.1) * TAU, x = 720 + hash(i * 3.7) * 260 + 34 * Math.sin(g * 0.6 + ph), y = 980 + hash(i * 5.3) * 300 + 22 * Math.sin(g * 0.8 + ph * 1.3), b = on * Math.pow(0.5 + 0.5 * Math.sin(g * 2.1 + ph), 2) * (0.5 + 0.5 * Math.max(so, 0.3));
        glow(x, y, 22, '220,255,140', 0.8 * b); dot(x, y, 2.4, `rgba(250,255,200,${b})`); }); }
    c.restore();
  };
  // ---- M.ted.buissonAvant(t, x, o) : l'avant du buisson de cannes, APRÈS l'ours (cache son cou, laisse dépasser la tête)
  D.buissonAvant = function (t, x, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), up = o.up || 0, so = clamp(o.soir || 0), bx = typeof x === 'number' ? x : 820, sec = (o.secoue || 0) * Math.sin(g * 17);
    c.save(); c.translate(bx, BACK - up); c.rotate(0.012 * Math.sin(g * 0.8 + 0.6) + 0.04 * sec); c.drawImage(K.buisson[1], K.buisson[1].x0, K.buisson[1].y0);
    if (so > 0) { c.globalAlpha = so; c.drawImage(K.buissonS, K.buissonS.x0, K.buissonS.y0); }
    c.restore();
  };
  // ---- M.ted.bayouSol(t, o) : premier plan (souche, fougères, bûche + selle, feuilles mortes), APRÈS M.drawFloor
  D.bayouSol = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), so = clamp(o.soir || 0), up = o.up || 0;
    c.save(); c.translate(0, -up);
    put(K.bySol[0], 0, 0, 0); if (so > 0) put(K.bySol[1], 0, 0, 0, null, so);
    [[132, BACK + 34, 0, 0.62], [52, BACK + 32, 1, 0.8], [1010, BACK + 30, 2, 0.85], [808, BACK + 34, 0, 0.6]].forEach(([x, y, k, s], i) => {
      c.save(); c.translate(x, y); c.rotate(0.05 * Math.sin(g * (0.9 + i * 0.17) + i * 2)); c.scale(s * (i === 2 ? -1 : 1), s); c.drawImage(K.fougeres[k], K.fougeres[k].x0, K.fougeres[k].y0);
      if (so > 0) { c.globalAlpha = so; c.drawImage(K.fougeresS[k], K.fougeres[k].x0, K.fougeres[k].y0); }
      c.restore();
    });
    c.restore();
  };

  // =====================================================================
  // LIEU 2 — LA BOUTIQUE DES MICHTOM, BROOKLYN
  // =====================================================================
  const BT = { vit: { x0: 70, y0: 300, x1: 318, y1: 1120 }, porte: { x0: 846, y0: 560, x1: 1004 }, comptoirY: 1150, pendule: { x: 896, y: 286, s: 1 },
    lampe: { x: 380, y: 618 }, poele: { x: 382 }, balance: 862, caisse: 976, tabouret: 486 };
  D.BOUTIQUE = BT;
  D.vitrinePt = { x: 262, y: 1100 };
  D.comptoirPt = { x: 700, y: 1150 };
  D.murPt = { x: 752, y: 352 };
  // rue de Brooklyn vue par la vitrine (jour / soir)
  function makeRue(S) {
    const V = BT.vit, C2 = (j, s) => (S ? s : j);
    return lay(V.x0 - 10, V.y0 - 10, V.x1 + 10, V.y1 + 10, (c) => {
      const g = c.createLinearGradient(0, V.y0, 0, 460); g.addColorStop(0, C2('#b9c4c6', '#4c5272')); g.addColorStop(1, C2('#dcd8c8', '#9a7e8a')); c.fillStyle = g; c.fillRect(V.x0 - 10, V.y0 - 10, 280, 320);
      // immeubles d'en face : brique (gauche), pierre ocre (droite)
      const bld = (x0, x1, top, col, colF, seed) => pc([[x0, top, 1], [x1, top, 1], [x1, 1062, 1], [x0, 1062, 1]], C2(col, mixA(col, '#2a2440', 0.5)), () => {
        if (seed === 1) for (let y = top + 8; y < 1060; y += 9) strokePts([[x0, y], [x1, y]], 'rgba(60,30,20,0.25)', 0.8);
        fillPts(rect(x0 - 4, top, x1 + 4, top + 14), C2('#6a5040', '#3a3040'));
        for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) { const wx = x0 + 18 + k * (x1 - x0 - 36) * 0.62, wy = top + 40 + r * 120, ww = (x1 - x0) * 0.24;
          const lit = S && hash(seed * 9 + r * 3 + k) > 0.35;
          fillPts(rect(wx, wy, wx + ww, wy + 70), lit ? '#e8c27a' : C2('#4a5258', '#26283a')); strokePts([[wx + ww / 2, wy], [wx + ww / 2, wy + 70]], C2('#d8d0bc', '#5a5060'), 1.4); strokePts([[wx, wy + 35], [wx + ww, wy + 35]], C2('#d8d0bc', '#5a5060'), 1.4);
          fillPts(rect(wx - 4, wy - 8, wx + ww + 4, wy), C2(colF, '#4a4050')); }
      }, seed);
      bld(V.x0 - 10, 196, 560, '#8c5444', '#b9a58a', 1); bld(196, V.x1 + 10, 440, '#b49a74', '#e0d2b4', 2);
      fillPts(rect(128, 500, 152, 562), C2('#6a4a3a', '#3a2c34')); fillPts(rect(124, 494, 156, 502), C2('#5a3a2a', '#2a2430'));   // cheminée (sa fumée est animée)
      // boutique d'en face : auvent rayé + enseigne pendue (dessin d'un bonbon enveloppé)
      pc([[90, 900, 1], [196, 900, 1], [206, 940, 1], [80, 940, 1]], '#7f2a26', () => { for (let x = 92; x < 210; x += 20) fillPts([[x, 900], [x + 10, 900], [x + 12, 940], [x + 2, 940]], '#e6dcc2'); }, 3);
      fillPts(rect(96, 944, 190, 1062), C2('#3a3a3a', '#d8a860')); strokePts([[143, 944], [143, 1062]], '#2a2420', 2);
      strokePts([[200, 760], [262, 760]], '#2a2420', 2.4); strokePts([[210, 760], [210, 772]], '#2a2420', 1.2); strokePts([[252, 760], [252, 772]], '#2a2420', 1.2);
      pc(rect(200, 772, 262, 818), '#e9dcc0', () => { fillPts(ell(231, 795, 13, 9, 14), '#b8323a'); fillPts([[218, 795], [206, 786], [208, 804]], '#b8323a'); fillPts([[244, 795], [256, 786], [254, 804]], '#b8323a'); strokePts([[224, 789], [236, 801]], 'rgba(255,255,255,0.6)', 1.6); }, 4);
      // trottoir, bordure, pavés
      fillPts(rect(V.x0 - 10, 1062, V.x1 + 10, 1076), C2('#a39c8c', '#5a5464')); fillPts(rect(V.x0 - 10, 1076, V.x1 + 10, V.y1 + 10), C2('#7a7266', '#3e3a48'));
      for (let y = 1082; y < V.y1 + 10; y += 10) for (let x = V.x0 - 10 + (y % 20 ? 0 : 8); x < V.x1 + 10; x += 16) strokePts([[x, y], [x + 12, y]], 'rgba(40,36,30,0.35)', 1);
      strokePts([[V.x0 - 10, 1100], [V.x1 + 10, 1100]], C2('#5a5248', '#2a2834'), 2);   // rail du tramway
      // réverbère
      pc(bar([292, 1068], [292, 840], 6), '#2a2e2c', null, 5); pc([[280, 840, 1], [304, 840, 1], [312, 812], [272, 812]], C2('#d8d6c0', '#f2d48a'), () => strokePts([[292, 812], [292, 840]], '#2a2e2c', 1.4), 6);
      fillPts([[268, 812], [316, 812], [292, 798]], '#2a2e2c');
    });
  }
  function makeArriere() {
    const P = BT.porte;
    return lay(P.x0, P.y0, P.x1, BACK + 4, (c) => {
      fillPts(rect(P.x0, P.y0, P.x1, BACK + 4), '#2e241c');
      const gr = c.createRadialGradient(930, 640, 10, 930, 640, 260); gr.addColorStop(0, 'rgba(230,180,110,0.35)'); gr.addColorStop(1, 'rgba(230,180,110,0)'); c.fillStyle = gr; c.fillRect(P.x0, P.y0, 160, 700);
      for (const y of [640, 780]) { fillPts(rect(P.x0, y, P.x1, y + 8), '#5a4430'); for (let k = 0; k < 4; k++) fillPts(rect(P.x0 + 10 + k * 36, y - 40 - (k % 2) * 12, P.x0 + 40 + k * 36, y), ['#8a6a4a', '#6e5a7a', '#a08a5a', '#5a6a5a'][k]); }
      fillPts(rect(870, 860, 940, 1000), '#7a6a52'); strokePts([[905, 840], [905, 860]], '#3a2a1a', 2); // tablier pendu au crochet
    });
  }
  // mur, vitrine, étagères garnies, pilier (cartes postales, lampe à gaz), mur libre (clou), encadrement de porte
  function makeMur() {
    const V = BT.vit, P = BT.porte;
    return M.pre(W, BACK + 40, (c) => {
      // papier peint à rayures vert éteint et ocre
      for (let x = 0; x < W; x += 36) { c.fillStyle = (x / 36) % 2 ? '#a28c5e' : '#6f7a58'; c.fillRect(x, 150, 36, 1100); }
      for (let x = 0; x < W; x += 36) { strokePts([[x + 1, 150], [x + 1, 1250]], 'rgba(40,30,20,0.25)', 1); for (let y = 190; y < 1240; y += 48) dot(x + 18, y + ((x / 36) % 2) * 24, 2, 'rgba(235,220,180,0.35)'); }
      const sh = c.createLinearGradient(0, 150, 0, 1250); sh.addColorStop(0, 'rgba(30,20,12,0.4)'); sh.addColorStop(0.3, 'rgba(30,20,12,0.05)'); sh.addColorStop(1, 'rgba(30,20,12,0.3)'); c.fillStyle = sh; c.fillRect(0, 150, W, 1100);
      // corniche et lambris
      pc(rect(-10, 140, W + 10, 196), '#4a3020', () => { strokePts([[0, 186], [W, 186]], 'rgba(255,220,170,0.35)', 2); for (let x = 10; x < W; x += 24) fillPts(rect(x, 172, x + 12, 184), 'rgba(20,10,4,0.35)'); }, 201, { drop: false });
      pc(rect(-10, 1150, W + 10, BACK + 30), '#4e3422', () => { for (let x = 16; x < W; x += 122) { strokePts(rect(x, 1172, x + 100, BACK - 14), 'rgba(255,220,170,0.2)', 1.4, true); strokePts([[x + 100, 1172], [x + 100, BACK - 14], [x, BACK - 14]], 'rgba(20,10,4,0.45)', 1.4); } strokePts([[0, 1154], [W, 1154]], 'rgba(255,220,170,0.4)', 2); }, 202, { drop: false });
      // trous : vitrine et porte
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0); c.fillRect(P.x0, P.y0, P.x1 - P.x0, BACK + 10 - P.y0); c.restore();
      // vitrine à petits carreaux (bois vert sombre), reflets, banquette de vitrine
      const vb = '#2f4636';
      pc(rect(V.x0 - 22, V.y0 - 26, V.x1 + 22, V.y0), vb, () => strokePts([[V.x0 - 20, V.y0 - 22], [V.x1 + 20, V.y0 - 22]], 'rgba(255,240,200,0.3)', 1.4), 203);
      pc(rect(V.x0 - 22, V.y0, V.x0, V.y1), vb, null, 204); pc(rect(V.x1, V.y0, V.x1 + 22, V.y1), vb, null, 205);
      for (let k = 1; k < 3; k++) { const x = lerp(V.x0, V.x1, k / 3); fillPts(rect(x - 3, V.y0, x + 3, V.y1), vb); }
      for (let k = 1; k < 7; k++) { const y = lerp(V.y0, V.y1, k / 7); fillPts(rect(V.x0, y - 3, V.x1, y + 3), vb); }
      for (let k = 0; k < 7; k++) { const y = lerp(V.y0, V.y1, k / 7); fillPts([[V.x0 + 10, y + 70], [V.x0 + 50, y + 10], [V.x0 + 62, y + 10], [V.x0 + 22, y + 70]], 'rgba(255,255,255,0.09)'); fillPts([[V.x0 + 180, y + 90], [V.x0 + 230, y + 20], [V.x0 + 238, y + 20], [V.x0 + 188, y + 90]], 'rgba(255,255,255,0.07)'); }
      pc(rect(V.x0 - 30, V.y1, V.x1 + 30, V.y1 + 20), '#3e2a1a', () => strokePts([[V.x0 - 28, V.y1 + 3], [V.x1 + 28, V.y1 + 3]], 'rgba(255,220,170,0.4)', 1.6), 206);
      pc(rect(V.x0 - 22, V.y1 + 20, V.x1 + 22, BACK + 4), '#3a4a3a', () => { for (let x = V.x0; x < V.x1; x += 82) strokePts(rect(x + 6, V.y1 + 40, x + 74, BACK - 20), 'rgba(255,240,200,0.18)', 1.4, true); }, 207);
      // pilier : deux cartes postales punaisées (dessins), applique de la lampe à gaz
      const carte = (x, y, a, fn, sd) => { c.save(); c.translate(x, y); c.rotate(a); pc(rect(-30, -22, 30, 22), '#ece2c8', fn, sd); dot(0, -18, 2.4, '#b08d45'); c.restore(); };
      carte(374, 360, -0.06, () => { fillPts(rect(-24, -16, 24, 2), '#9ab0bc'); fillPts([[-24, 2], [-8, -10], [6, 0], [24, -8], [24, 16], [-24, 16]], '#6a7a52'); fillPts([[-4, -6], [4, -6], [2, 2], [-2, 2]], '#8a4a3a'); }, 208);
      carte(370, 470, 0.08, () => { fillPts(rect(-24, -16, 24, 16), '#d9c48e'); fillPts([[-16, 6], [16, 6], [10, 12], [-10, 12]], '#5a3a2a'); fillPts([[0, 6], [0, -12], [12, 4]], '#efe8d8'); strokePts([[0, 6], [0, -12]], '#3a2a1a', 1.2); fillPts(rect(-24, 12, 24, 16), '#5a7a8a'); }, 209);
      const L = BT.lampe;
      pc([[L.x - 10, L.y + 70, 1], [L.x + 10, L.y + 70, 1], [L.x + 6, L.y + 86], [L.x - 6, L.y + 86]], '#9a7a3a', null, 210);
      pc(ribbon([[L.x, L.y + 72], [L.x + 2, L.y + 40], [L.x, L.y + 18]], 6, 5), '#b08d45', null, 211);
      // étagères garnies
      pc(rect(436, 230, 668, BACK + 4), '#4a3020', null, 212);
      fillPts(rect(450, 270, 654, 830), '#2e1e14');
      pc(rect(426, 222, 678, 262), '#5a3a24', () => strokePts([[428, 254], [676, 254]], 'rgba(255,220,170,0.3)', 1.4), 213);
      const R = M.rng(220), JAR = ['#b8323a', '#4f8a4a', '#d8b03a', '#d88a9a', '#c8742a', '#6a7ab0'];
      const planche = (y) => pc(rect(444, y, 660, y + 12), '#6a4428', () => strokePts([[446, y + 2], [658, y + 2]], 'rgba(255,220,170,0.4)', 1.4), y);
      const bocal = (x, yb, w, h, col, sd) => { pc([[x - w / 2, yb, 1], [x + w / 2, yb, 1], [x + w / 2, yb - h + 8], [x + w / 2 - 6, yb - h], [x - w / 2 + 6, yb - h], [x - w / 2, yb - h + 8]], 'rgba(210,225,220,0.55)', () => { for (let j = 0; j < 22; j++) dot(x - w / 2 + 4 + R() * (w - 8), yb - 4 - R() * (h * 0.66), 3.4, j % 5 ? col : '#f0e8d8'); strokePts([[x - w / 2 + 5, yb - h + 10], [x - w / 2 + 5, yb - 6]], 'rgba(255,255,255,0.6)', 2); }, sd); pc(rect(x - w / 2 + 4, yb - h - 10, x + w / 2 - 4, yb - h + 1), '#8a6a3a', null, sd + 1); dot(x, yb - h - 13, 4, '#b08d45'); };
      planche(390); JAR.forEach((col, i) => bocal(468 + i * 35, 390, 28, 76, col, 230 + i * 3));
      planche(530);    // rouleaux d'étoffe couchés (vus par le bout) et coupons debout
      ['#7a3a40', '#4a6a8a', '#c9b48a', '#5a6a3e', '#9a6a3a'].forEach((col, i) => { const x = 476 + i * 40; pc(ell(x, 504, 18, 18, 16), col, () => { strokePts(ep(x, 504, 11, 11, 12, 0, 5), 'rgba(0,0,0,0.3)', 1.4); strokePts(ep(x, 504, 5, 5, 8, 0, 5), 'rgba(0,0,0,0.3)', 1.2); }, 240 + i); });
      for (let i = 0; i < 5; i++) pc(rect(460 + i * 40, 438, 492 + i * 40, 484), ['#d8c8a8', '#8a5a5a', '#5a7a6a', '#c8a85a', '#6a6a8a'][i], () => hatch(null, 1.57, 4, 0.18), 250 + i);
      planche(670);    // bobines de fil et jouets de bois (cheval à roulettes, toupie, quilles)
      for (let i = 0; i < 5; i++) { const x = 462 + i * 18, col = ['#b8323a', '#3a5a8a', '#e0d4b0', '#4f7a3a', '#d8b03a'][i]; pc(rect(x - 7, 642, x + 7, 668), col, () => { fillPts(rect(x - 8, 642, x + 8, 646), '#c9a878'); fillPts(rect(x - 8, 664, x + 8, 668), '#c9a878'); }, 260 + i); }
      pc([[560, 634], [600, 632], [604, 646], [598, 652], [562, 654], [556, 646]], '#c98a4a', () => { fillPts(ell(604, 626, 8, 10, 10), '#c98a4a'); strokePts([[598, 620], [586, 630]], '#5a3a1a', 3); }, 270);
      for (const x of [566, 594]) { pc(bar([x, 652], [x, 664], 4), '#8a5a2a', null, x); dot(x, 664, 5, '#3a2a1a'); }
      pc([[624, 668], [612, 650], [622, 640], [636, 640], [646, 650], [634, 668]], '#5a7aa0', () => strokePts([[612, 650], [646, 650]], '#e8d8b0', 3), 271); fillPts(rect(627, 630, 631, 640), '#5a3a1a');
      planche(810);    // cartons à chapeaux et petits bocaux
      pc(ell(486, 784, 32, 26, 18), '#c9a6a0', () => strokePts(ep(486, 774, 32, 6, 16, 0, TAU), 'rgba(80,40,40,0.5)', 1.6), 272);
      pc(rect(530, 760, 590, 810), '#8a9a7a', () => strokePts([[530, 772], [590, 772]], 'rgba(40,30,20,0.4)', 1.6), 273);
      bocal(616, 810, 26, 60, '#d88a9a', 274); bocal(644, 810, 22, 50, '#4f8a4a', 276);
      planche(950);    // tiroirs du bas
      for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { const x0 = 452 + k * 68, y0 = 966 + r * 104; pc(rect(x0, y0, x0 + 62, y0 + 96), '#5a3a24', () => { strokePts(rect(x0 + 6, y0 + 6, x0 + 56, y0 + 90), 'rgba(255,220,170,0.2)', 1.2, true); dot(x0 + 31, y0 + 48, 3.2, '#b08d45'); }, 280 + r * 3 + k); }
      // mur libre : clou (le journal y sera punaisé au plan 6) ; trace plus claire d'un ancien cadre
      fillPts(rect(694, 360, 812, 520), 'rgba(240,220,170,0.08)');
      dot(D.murPt.x, D.murPt.y, 4.2, '#3a3a3a'); dot(D.murPt.x - 1.2, D.murPt.y - 1.2, 1.6, '#c9c4b8');
      // encadrement de la porte de l'arrière-boutique
      pc(rect(P.x0 - 16, P.y0 - 22, P.x1 + 16, P.y0), '#3e2a1a', () => strokePts([[P.x0 - 14, P.y0 - 18], [P.x1 + 14, P.y0 - 18]], 'rgba(255,220,170,0.3)', 1.4), 290);
      pc(rect(P.x0 - 16, P.y0, P.x0, BACK + 4), '#3e2a1a', null, 291); pc(rect(P.x1, P.y0, P.x1 + 16, BACK + 4), '#3e2a1a', null, 292);
      // tuyau du poêle : monte puis entre dans le mur (rosace)
      const px = BT.poele.x;
      pc(rect(px - 13, 1000, px + 13, 1150), '#2a2a2c', () => strokePts([[px - 6, 1004], [px - 6, 1146]], 'rgba(255,255,255,0.18)', 2), 293);
      pc(ribbon(qbez([px, 1004], [px, 960], [px - 40, 960], 6), 26, 26), '#2a2a2c', null, 294);
      pc(ell(px - 42, 960, 22, 22, 14), '#3a3a3c', () => strokePts(ep(px - 42, 960, 14, 14, 12, 0, TAU), 'rgba(255,255,255,0.2)', 1.2), 295);
    });
  }
  // meubles : présentoir de vitrine, poêle + bouilloire, table à ouvrage + panier + ciseaux, comptoir mouluré + bocaux + balance de Roberval
  function makeMilieu() {
    return ombre(lay(150, 1060, W, BACK + 10, (c) => {
      // présentoir (guéridon drapé de velours vert à franges d'or), vide
      const Vp = D.vitrinePt;
      pc([[Vp.x - 10, 1110], [Vp.x + 10, 1110], [Vp.x + 14, BACK - 20], [Vp.x + 40, BACK + 4, 1], [Vp.x - 40, BACK + 4, 1], [Vp.x - 14, BACK - 20]], '#4a3020', null, 301);
      pc([[Vp.x - 64, Vp.y], [Vp.x + 64, Vp.y], [Vp.x + 70, Vp.y + 40], [Vp.x - 70, Vp.y + 40]], '#3c5a40', () => { for (let x = Vp.x - 66; x < Vp.x + 70; x += 8) strokePts([[x, Vp.y + 34], [x + 1, Vp.y + 44]], '#c9a24a', 2); hatch(null, 1.4, 4, 0.18); }, 302);
      fillPts(rect(Vp.x - 64, Vp.y - 4, Vp.x + 64, Vp.y + 2), '#5a3a24');
      // poêle en fonte ventru + bouilloire
      const px = BT.poele.x;
      pc([[px - 34, BACK + 2, 1], [px - 30, 1330], [px - 46, 1260], [px - 36, 1200], [px - 24, 1170], [px + 24, 1170], [px + 36, 1200], [px + 46, 1260], [px + 30, 1330], [px + 34, BACK + 2, 1]], '#2a2a2c', () => {
        fillPts(ell(px, 1290, 18, 14, 14), '#3a1a10'); fillPts(ell(px, 1292, 12, 8, 12), '#d8682a'); strokePts([[px - 30, 1330], [px + 30, 1330]], '#4a4a4c', 3); strokePts([[px - 40, 1220], [px + 40, 1220]], '#4a4a4c', 2);
        strokePts([[px - 30, 1190], [px - 40, 1290]], 'rgba(255,255,255,0.18)', 3);
      }, 303);
      fillPts(rect(px - 30, 1150, px + 30, 1170), '#3a3a3c');
      pc([[px - 22, 1150], [px - 18, 1118], [px + 18, 1118], [px + 22, 1150]], '#9a9890', () => strokePts([[px - 12, 1122], [px - 14, 1146]], 'rgba(255,255,255,0.5)', 2), 304);
      pc(bar([px + 18, 1140], [px + 36, 1118], 6), '#9a9890', null, 305); strokePts(ep(px, 1118, 16, 14, 8, PI, TAU), '#2a2a2a', 2);
      // table à ouvrage + panier de coupons + ciseaux de tailleur
      pc(rect(430, 1232, 548, 1244), '#6a4428', null, 306); for (const x of [440, 538]) pc(bar([x, 1244], [x, BACK + 2], 7), '#5a3a20', null, 307 + x);
      pc([[444, 1232], [440, 1196], [512, 1196], [508, 1232]], '#a8844a', () => { for (let x = 444; x < 512; x += 8) strokePts([[x, 1198], [x + 2, 1230]], 'rgba(60,40,20,0.4)', 1.2); for (let y = 1204; y < 1232; y += 8) strokePts([[440, y], [512, y]], 'rgba(60,40,20,0.3)', 1); }, 309);
      fillPts([[450, 1198], [462, 1176], [476, 1196]], '#8a3a40'); fillPts([[470, 1198], [490, 1180], [500, 1198]], '#4a6a8a'); fillPts([[488, 1198], [496, 1184], [508, 1198]], '#c9b48a');
      strokePts([[520, 1228], [546, 1222]], '#8a8c90', 2.4); strokePts([[520, 1222], [546, 1230]], '#8a8c90', 2.4); strokePts(ep(517, 1226, 5, 4, 8, 0, TAU), '#2a2a2a', 1.6); strokePts(ep(517, 1220, 5, 4, 8, 0, TAU), '#2a2a2a', 1.6);
      // comptoir à façade moulurée
      const y0 = BT.comptoirY;
      pc(rect(556, y0 + 14, W + 10, BACK + 4), '#5a3820', () => { for (let x = 576; x < W; x += 112) { strokePts(rect(x, y0 + 40, x + 90, BACK - 26), 'rgba(255,220,170,0.25)', 1.6, true); strokePts([[x + 90, y0 + 40], [x + 90, BACK - 26], [x, BACK - 26]], 'rgba(20,10,4,0.5)', 1.6); fillPts(ell(x + 45, y0 + 140, 14, 22, 12), 'rgba(255,220,170,0.08)'); } hatch(null, 0.05, 6, 0.12, 1, undefined, [550, y0, W + 10, BACK + 6]); }, 310);
      pc(rect(546, y0 - 6, W + 10, y0 + 14), '#6e4a2a', () => strokePts([[548, y0 - 3], [W, y0 - 3]], 'rgba(255,220,170,0.5)', 1.6), 311);
      // bocaux de bonbons sur le comptoir
      const R = M.rng(320);
      for (const [x, w, h, col, col2] of [[588, 34, 92, '#b8323a', '#f0e8d8'], [630, 30, 74, '#d8b03a', '#4f8a4a']]) {
        pc([[x - w / 2, y0 - 6, 1], [x + w / 2, y0 - 6, 1], [x + w / 2, y0 - h + 10], [x + w / 2 - 7, y0 - h], [x - w / 2 + 7, y0 - h], [x - w / 2, y0 - h + 10]], 'rgba(210,225,220,0.6)', () => { for (let j = 0; j < 30; j++) dot(x - w / 2 + 4 + R() * (w - 8), y0 - 10 - R() * h * 0.7, 3.6, j % 3 ? col : col2); strokePts([[x - w / 2 + 5, y0 - h + 12], [x - w / 2 + 5, y0 - 12]], 'rgba(255,255,255,0.6)', 2.2); }, Math.round(x));
        pc(ell(x, y0 - h - 2, w / 2 - 4, 6, 12), '#c9c4b8', null, x + 1); dot(x, y0 - h - 8, 4, '#c9c4b8');
      }
      // balance de Roberval en laiton (deux plateaux, poids)
      const bx = BT.balance;
      pc([[bx - 52, y0 - 6, 1], [bx + 52, y0 - 6, 1], [bx + 46, y0 - 34], [bx - 46, y0 - 34]], '#8a6a3a', () => { strokePts([[bx - 44, y0 - 28], [bx + 44, y0 - 28]], 'rgba(255,240,190,0.5)', 1.6); fillPts(ell(bx, y0 - 20, 8, 5, 10), '#3a2a1a'); }, 330);
      for (const s of [-1, 1]) { pc(bar([bx + s * 30, y0 - 34], [bx + s * 30, y0 - 46], 6), '#b08d45', null, 331 + s); pc(ell(bx + s * 30, y0 - 48, 30, 6, 16), '#c9a24a', () => strokePts([[bx + s * 30 - 22, y0 - 50], [bx + s * 30 + 10, y0 - 51]], 'rgba(255,255,255,0.5)', 1.4), 333 + s); }
      pc(bar([bx, y0 - 34], [bx, y0 - 62], 4), '#b08d45', null, 335); fillPts([[bx - 3, y0 - 60], [bx + 3, y0 - 60], [bx, y0 - 74]], '#3a2a1a');
      for (const [dx, h] of [[22, 14], [34, 10]]) pc(rect(bx + dx - 5, y0 - 54 - h, bx + dx + 5, y0 - 54), '#b08d45', () => fillPts(rect(bx + dx - 2, y0 - 58 - h, bx + dx + 2, y0 - 54 - h), '#8a6a3a'), 336 + dx);
    }), 8);
  }
  function makeCaisse() {   // caisse enregistreuse ouvragée (laiton, touches rondes sans chiffres, volets vides)
    const x = BT.caisse, y0 = BT.comptoirY - 6;
    return ombre(lay(x - 80, y0 - 170, x + 80, y0 + 4, (c) => {
      pc([[x - 64, y0, 1], [x + 64, y0, 1], [x + 58, y0 - 40], [x + 48, y0 - 96], [x - 48, y0 - 96], [x - 58, y0 - 40]], '#b08d45', () => {
        for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const kx = x - 40 + k * 16 + r * 2, ky = y0 - 30 - r * 18; fillPts(bar([kx, ky + 8], [kx, ky], 2), '#4a3a1a'); dot(kx, ky, 5, '#efe6d0'); strokePts(ep(kx, ky, 5, 5, 10, 0, TAU), '#4a3a1a', 1); }
        for (let k = 0; k < 9; k++) strokePts(ep(x - 52 + k * 13, y0 - 86, 6, 6, 8, PI, TAU), 'rgba(90,60,20,0.6)', 1.4);
        shade(x + 60, 0, x - 60, 0, 0.3, [x - 70, y0 - 100, x + 70, y0 + 4]); strokePts([[x - 50, y0 - 92], [x - 56, y0 - 42]], 'rgba(255,240,190,0.6)', 2);
      }, 340);
      pc([[x - 44, y0 - 96], [x + 44, y0 - 96], [x + 36, y0 - 150], [x - 36, y0 - 150]], '#c9a24a', () => { for (const dx of [-20, 0, 20]) pc(rect(x + dx - 8, y0 - 140, x + dx + 8, y0 - 112), '#efe6d0', null, 341 + dx, { drop: false }); }, 342);
      pc(ep(x, y0 - 150, 36, 18, 10, PI, TAU), '#b08d45', () => fillPts(ell(x, y0 - 156, 8, 8, 10), '#8a6a3a'), 343);
      pc(bar([x + 64, y0 - 50], [x + 82, y0 - 70], 5), '#8a6a3a', null, 344); dot(x + 82, y0 - 70, 6, '#2a2a2a');
    }), 6);
  }
  function makeTabouret() {
    return lay(-40, -110, 40, 4, (c) => {
      pc(ell(0, -100, 34, 8, 14), '#6a4428', () => strokePts([[-30, -102], [30, -102]], 'rgba(255,220,170,0.4)', 1.4), 351);
      for (const dx of [-26, 0, 26]) pc(bar([dx * 0.7, -96], [dx, 2], 6), '#5a3a20', null, 352 + dx);
      strokePts([[-20, -40], [20, -40]], '#5a3a20', 3);
    });
  }
  function makeBtSol() {   // sacs de toile (gauche), caisse en bois (droite), balai appuyé
    return ombre(lay(30, 1220, W, BACK + 60, (c) => {
      pc([[60, BACK + 40, 1], [62, 1340], [80, 1312], [92, 1300], [128, 1302], [136, 1316], [150, 1346], [154, BACK + 40, 1]], '#b9a780', () => { strokePts([[84, 1316], [130, 1318]], '#6a5a3a', 2.2); hatch(null, 1.1, 4, 0.2); fillPts(ell(108, 1380, 18, 14, 10), 'rgba(90,60,30,0.3)'); }, 361);
      pc([[140, BACK + 44, 1], [146, 1370], [160, 1352], [204, 1352], [214, 1372], [220, BACK + 44, 1]], '#a8966e', () => { hatch(null, 0.9, 4, 0.2); fillPts(ell(180, 1352, 22, 6, 12), '#efe6d0'); for (let i = 0; i < 8; i++) dot(166 + i * 4, 1350 - (i % 3) * 2, 2.6, '#efe6d0'); }, 362);
      pc(rect(880, 1330, 1000, BACK + 42), '#8a6a42', () => { for (let y = 1336; y < BACK + 40; y += 22) strokePts([[882, y], [998, y]], 'rgba(40,24,10,0.5)', 1.6); for (const x of [890, 990]) for (let y = 1344; y < BACK + 40; y += 22) dot(x, y, 1.8, '#2a2a2a'); hatch(null, 0.1, 5, 0.18); }, 363);
      for (let i = 0; i < 4; i++) pc(ell(902 + i * 26, 1324, 12, 9, 10), ['#c8742a', '#b8323a', '#d8b03a', '#c8742a'][i], null, 364 + i);
      pc(bar([1030, BACK + 40], [1000, 1230], 6), '#8a6a3a', null, 370);
      pc([[1018, BACK + 44, 1], [1050, BACK + 44, 1], [1044, 1360], [1028, 1360]], '#c9a85a', () => { for (let k = 0; k < 8; k++) strokePts([[1020 + k * 4, BACK + 42], [1029 + k * 2, 1362]], 'rgba(90,60,20,0.5)', 1); }, 371);
    }), 8);
  }
  // tramway hippomobile (dans la rue) ; chat tigré
  function tram(x, y, g, so) {
    const c = cx_(), body = '#8a3a2a', bL = '#d9c9a0';
    M.animal('cheval', x + 128, y + 10, 0.85, { dir: 1, ph: g * 1.4, brume: 0.35 + 0.2 * so });
    strokePts([[x + 60, y - 50], [x + 110, y - 54]], '#2a2420', 1.6);
    fillPts(rect(x - 96, y - 118, x + 66, y - 100), '#5a2a20'); fillPts(rect(x - 70, y - 132, x + 40, y - 118), '#6a3428');
    fillPts(rect(x - 100, y - 100, x + 70, y - 22), mixA(body, '#3a2a3a', 0.45 * so));
    for (let k = 0; k < 5; k++) fillPts(rect(x - 90 + k * 30, y - 92, x - 68 + k * 30, y - 62), so > 0.5 ? '#e8c27a' : '#c9d2d0');
    strokePts([[x - 100, y - 56], [x + 70, y - 56]], bL, 2.4);
    for (const wx of [x - 70, x + 40]) { dot(wx, y - 12, 12, '#2a2420'); dot(wx, y - 12, 4, '#8a7a5a'); }
  }
  function linge(g, so, y0, items) {   // corde à linge tendue entre les immeubles d'en face : draps et chemises qui battent au vent
    const x0 = 40, x1 = 350, sag = (x) => y0 + 26 * (1 - Math.pow((x - (x0 + x1) / 2) / ((x1 - x0) / 2), 2));
    strokePts([[x0, y0], [(x0 + x1) / 2, y0 + 30], [x1, y0]], '#3a3430', 1.2);
    items.forEach(([x, w, h, col], i) => {
      const a = 0.15 * Math.sin(g * (2.1 + i * 0.37) + i * 1.9 + y0) + 0.06 * Math.sin(g * 4.3 + i), y = sag(x), k = Math.sin(g * 3 + i) * 5;
      const pts = [[x - w / 2, y, 1], [x + w / 2, y, 1], [x + w / 2 + Math.sin(a) * h + k * 0.3, y + h * Math.cos(a)], [x + Math.sin(a) * h, y + h * Math.cos(a) + k * 0.4], [x - w / 2 + Math.sin(a) * h - k * 0.3, y + h * Math.cos(a)]];
      fillPts(pts, mixA(col, '#3a3448', 0.45 * so), 900 + i, 0.4); strokePts([[x - w / 2 + 6, y + 6], [x - w / 2 + 6 + Math.sin(a) * h * 0.8, y + h * 0.8]], 'rgba(60,50,40,0.25)', 1.2);
      dot(x - w / 2 + 3, y, 2.2, '#5a4a3a'); dot(x + w / 2 - 3, y, 2.2, '#5a4a3a');
    });
  }
  function cage(x, y, g) {   // cage de canari pendue au haut de la vitrine : se balance, l'oiseau sautille d'un perchoir à l'autre
    const c = cx_(), a = 0.05 * Math.sin(g * 1.3) + 0.02 * Math.sin(g * 3.1), hop = Math.floor(g / 0.9), side = hash(hop) > 0.5 ? 1 : -1, ju = (g / 0.9) % 1, dy = ju < 0.2 ? -Math.sin(ju / 0.2 * PI) * 10 : 0;
    strokePts([[x, y - 40], [x + Math.sin(a) * 40, y]], '#3a2a1a', 1.4);
    c.save(); c.translate(x + Math.sin(a) * 40, y); c.rotate(a);
    fillPts(ell(0, 74, 30, 5, 12), '#8a6a3a');
    strokePts([[-22, 50], [22, 50]], '#6a4a2a', 2);
    const bx = side * 9, by = 50 + dy;
    fillPts(ell(bx, by - 8, 7, 6, 10), '#e8c43a'); fillPts(ell(bx + side * 6, by - 15, 4.5, 4.5, 10), '#efd04a'); fillPts([[bx + side * 10, by - 16], [bx + side * 15, by - 15], [bx + side * 10, by - 13]], '#d88a3a');
    dot(bx + side * 7, by - 16, 1, '#1a1a1a'); fillPts([[bx - side * 5, by - 8], [bx - side * 14, by - 2], [bx - side * 6, by - 4]], '#c9a42a');
    for (let k = -3; k <= 3; k++) strokePts([[k * 8, 74], [k * 6, 10], [0, 0]], '#b08d45', 1.1);
    strokePts(ep(0, 10, 18, 10, 10, PI, TAU), '#b08d45', 1.2); dot(0, -2, 3, '#b08d45');
    c.restore();
  }
  function chat(x, y, k, g, ph) {   // k : 0 marche, 1 assis ; tourné vers la gauche
    const c = cx_(); c.save(); c.translate(x, y);
    const L = (a, b) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    const H = L([26, -30], [12, -14]), S = L([-22, -32], [-8, -46]), Hd = L([-42, -44], [-16, -66]), base = '#9a8466', str = 'rgba(60,44,30,0.75)';
    const sw = (1 - k) * Math.sin(ph) * 0.4, tf = Math.sin(g * 2.2) * 0.5 + Math.sin(g * 5.1) * 0.15;
    // queue
    const tq = k > 0.5 ? qbez(H, [H[0] + 24, -2], [-8 + 6 * tf, -3 - 4 * Math.abs(tf)], 8) : qbez(H, [H[0] + 22, H[1] - 6], [H[0] + 30 + 6 * tf, H[1] - 34], 8);
    pc(ribbon(tq, 9, 5), base, () => { for (let i = 1; i < 8; i += 2) dot(tq[i][0], tq[i][1], 3.4, str); }, 401, { drop: false });
    // pattes arrière / avant (fond)
    for (const s of [-1, 1]) {
      const fx = S[0] + (k ? -4 : Math.sin(ph + (s > 0 ? 0 : PI)) * 9);
      pc(bar([S[0] + 2, S[1] + 6], [fx, -1], 7), s < 0 ? '#7a6a52' : base, () => strokePts([[S[0] - 4, -14], [S[0] + 6, -14]], str, 2), 402 + s, { drop: false });
      if (k < 0.6) { const rx = H[0] + Math.sin(ph + (s > 0 ? PI : 0)) * 9; pc(bar([H[0], H[1] + 4], [rx, -1], 8), s < 0 ? '#7a6a52' : base, null, 404 + s, { drop: false }); }
    }
    // corps
    const mx = (H[0] + S[0]) / 2, my = (H[1] + S[1]) / 2, ang = Math.atan2(S[1] - H[1], S[0] - H[0]), hl = Math.hypot(S[0] - H[0], S[1] - H[1]) / 2 + 12;
    const body = ell(0, 0, hl, lerp(13, 15, k), 16).map((p) => [mx + p[0] * Math.cos(ang) - p[1] * Math.sin(ang), my + p[0] * Math.sin(ang) + p[1] * Math.cos(ang)]);
    pc(body, base, () => { for (let i = -2; i <= 2; i++) { const cx = mx + Math.cos(ang) * i * 9, cy = my + Math.sin(ang) * i * 9; strokePts([[cx - Math.sin(ang) * -14, cy + Math.cos(ang) * -14], [cx + Math.sin(ang) * 2, cy - Math.cos(ang) * 2]], str, 2.6); } }, 406);
    if (k >= 0.6) pc(ell(H[0], H[1] - 2, 18, 14, 14), base, () => { strokePts([[H[0] - 6, H[1] - 14], [H[0] - 2, H[1] + 6]], str, 2.4); strokePts([[H[0] + 4, H[1] - 12], [H[0] + 8, H[1] + 4]], str, 2.4); }, 407);
    // tête
    pc(ell(Hd[0], Hd[1], 13, 11, 14), base, () => { strokePts([[Hd[0] - 2, Hd[1] - 10], [Hd[0], Hd[1] - 4]], str, 2); strokePts([[Hd[0] + 4, Hd[1] - 10], [Hd[0] + 5, Hd[1] - 4]], str, 2); fillPts(ell(Hd[0] - 9, Hd[1] + 4, 5, 4, 8), '#d8c8a8'); }, 408);
    fillPts([[Hd[0] - 6, Hd[1] - 8], [Hd[0] - 3, Hd[1] - 22], [Hd[0] + 2, Hd[1] - 10]], base); fillPts([[Hd[0] + 4, Hd[1] - 9], [Hd[0] + 8, Hd[1] - 21], [Hd[0] + 11, Hd[1] - 7]], '#8a7458');
    const blink = (Math.sin(g * 0.9) > 0.985) ? 0.4 : 1;
    fillPts(ell(Hd[0] - 6, Hd[1] - 2, 2.6, 2.6 * blink, 8), '#c9b23a'); dot(Hd[0] - 6.4, Hd[1] - 2, 1.1, '#141414'); dot(Hd[0] - 13, Hd[1] + 3, 1.6, '#4a2a2a');
    for (const dy of [2, 5]) strokePts([[Hd[0] - 11, Hd[1] + dy], [Hd[0] - 24, Hd[1] + dy * 1.4]], 'rgba(240,235,220,0.7)', 0.8);
    c.restore();
  }

  // ---- M.ted.boutique(t, up, o) : rue, mur, vitrine, étagères, porte, meubles, comptoir (AVANT M.drawFloor)
  D.boutique = function (t, up, o) {
    o = o || {}; up = up || 0;
    const c = cx_(), g = M.tg(t), so = clamp(o.soir || 0), V = BT.vit, P = BT.porte;
    c.save(); c.translate(0, -up);
    // 1) derrière : rue (jour → soir), passants, tramway, fumée de cheminée ; arrière-boutique
    put(K.btRue[0], 0, 0, 0); if (so > 0) put(K.btRue[1], 0, 0, 0, null, so);
    c.save(); c.beginPath(); c.rect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0); c.clip();
    linge(g, so, 600, [[92, 44, 70, '#ece6d6'], [148, 30, 40, '#7a8aa8'], [196, 50, 76, '#efe9dc'], [258, 28, 46, '#b04a3a'], [300, 36, 54, '#e2d8c0']]);
    linge(g + 0.7, so, 400, [[110, 40, 52, '#e8e2d2'], [170, 34, 60, '#9a7a5a'], [236, 48, 64, '#f0eadc'], [292, 26, 36, '#5a6a8a']]);
    M.oiseaux(M.tg(t), { x0: -40, x1: 420, y: 420, t0: 0, dur: 5, n: 3, s: 0.55, seed: 87, col: '#5a5a60', brume: 0.3 + 0.3 * so, boucle: true });
    M.fumee(t, { x: 140, y: 496, s: 0.7, n: 6, haut: 240, vent: 40, col: so > 0.5 ? '#6a6478' : '#d6d0c4', a: 0.5, seed: 81 });
    M.passants(t, { y: 1064, s: 0.24, n: 3, per: 9, x0: 30, x1: 360, brume: 0.35 + 0.25 * so, seed: 82 });
    const tu = ((g % 16) + 16) % 16 / 16; if (tu < 0.45) tram(lerp(-160, 520, tu / 0.45), 1112, g, so);
    if (so > 0.2) { c.globalAlpha = so; M.flamme(t, { x: 292, y: 834, s: 0.4, r: 120, seed: 83 }); c.globalAlpha = 1; }
    c.restore();
    put(K.btArr, 0, 0, 0);
    // porte de l'arrière-boutique : charnière à droite, s'entrouvre (o.porte 0..1)
    const pa = clamp(o.porte || 0) * 1.05 + 0.04 * clamp(o.porte || 0) * Math.sin(g * 3), w = (P.x1 - P.x0) * Math.cos(pa), xl = P.x1 - w, sk = 18 * Math.sin(pa);
    const dp = [[xl, P.y0 + sk, 1], [P.x1, P.y0, 1], [P.x1, BACK + 4, 1], [xl, BACK + 4 - sk * 0.3, 1]];
    pc(dp, mixA('#5a3a24', '#3a2416', pa / 1.1), () => {
      const q = (u, v) => [lerp(xl, P.x1, u), lerp(P.y0 + sk * (1 - u), BACK, v) + 0];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { const a = q(0.12 + k * 0.4, 0.04 + r * 0.115), b = q(0.48 + k * 0.4, 0.15 + r * 0.115); fillPts(rect(a[0], a[1], b[0], b[1]), 'rgba(200,190,150,0.35)'); fillPts([[a[0] + 3, b[1] - 6], [a[0] + 10, a[1] + 4], [a[0] + 14, a[1] + 4], [a[0] + 7, b[1] - 6]], 'rgba(255,255,255,0.18)'); }
      const p1 = q(0.12, 0.42), p2 = q(0.88, 0.62); strokePts(rect(p1[0], p1[1], p2[0], p2[1]), 'rgba(255,220,170,0.25)', 1.4, true);
      const kn = q(0.12, 0.5); dot(kn[0], kn[1], 4, '#b08d45');
    }, 501);
    // 2) mur, vitrine, étagères ; voilage de vitrine ; pendule ; lampe à gaz ; rayon de soleil poussiéreux
    c.drawImage(K.btMur, 0, 0);
    cage(196, 330, g);
    M.voilage(t, { x: V.x0, y: V.y0 + 6, w: 80, h: 440, cote: 1, amp: 12, col: 'rgba(236,226,204,0.55)' });
    M.voilage(t + 1.7, { x: V.x1 - 80, y: V.y0 + 6, w: 80, h: 440, cote: -1, amp: 12, col: 'rgba(236,226,204,0.55)' });
    M.pendule(t, { x: BT.pendule.x, y: BT.pendule.y, s: BT.pendule.s, per: 2, bois: '#5a3a22' });
    const L = BT.lampe, lu = 0.6 + 0.4 * so;
    glow(L.x, L.y + 10, 120 + 160 * so, '255,200,120', 0.18 + 0.2 * so);
    M.flamme(t, { x: L.x, y: L.y + 30, s: 0.5, r: 110 + 120 * so, seed: 84 });
    pc(ell(L.x, L.y + 16, 22, 26, 18), `rgba(240,232,200,${0.45 + 0.1 * lu})`, () => strokePts([[L.x - 10, L.y + 2], [L.x - 12, L.y + 28]], 'rgba(255,255,255,0.6)', 2), 502, { drop: false });
    fillPts(rect(L.x - 12, L.y - 12, L.x + 12, L.y - 6), '#b08d45');
    const ray = 1 - so;
    if (ray > 0.02) {
      const poly = [[V.x1 + 8, V.y0 + 20], [V.x1 + 8, V.y1], [520, BACK], [940, BACK]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      const gr = c.createLinearGradient(V.x1, 600, 800, BACK); gr.addColorStop(0, `rgba(255,232,180,${0.13 * ray})`); gr.addColorStop(1, `rgba(255,232,180,${0.02 * ray})`); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: V.x1, y: V.y0, w: 560, h: BACK - V.y0, n: 90, a: 0.75 * ray, seed: 85 });
      c.restore();
    }
    // 3) meubles (présentoir, poêle, table à ouvrage, comptoir, bocaux, balance), tabouret, vapeur de la bouilloire, chat, caisse
    put(K.btMil, 0, 0, 0, 0.35);
    if (o.tabouret !== false) { const tx = typeof o.tabouret === 'number' ? o.tabouret : BT.tabouret; c.save(); c.translate(tx, BACK + 2); c.drawImage(K.btTab, K.btTab.x0, K.btTab.y0); c.restore(); }
    M.fumee(t, { x: BT.poele.x + 38, y: 1112, s: 0.3, n: 6, haut: 300, vent: 30, col: '#efe9de', a: 0.5, per: 2.6, seed: 86 });
    if (o.chat != null) {   // chat tigré : sort de derrière la caisse, longe le comptoir vers la gauche, s'assoit près de la balance
      const u = clamp(o.chat), x = lerp(BT.caisse + 20, BT.balance - 92, smooth(0.04, 0.7, u)), k = smooth(0.72, 0.9, u);
      chat(x, BT.comptoirY - 6, k, g, x * 0.09);
    }
    put(K.btCaisse, 0, 0, 0, 0.3);
    if (so > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(120,96,110,${0.35 * so})`; c.fillRect(0, 0, W, BACK + 40); c.restore(); glow(L.x, L.y + 20, 300, '255,190,110', 0.14 * so); }
    c.restore();
  };
  // ---- M.ted.boutiqueSol(t, o) : premier plan (sacs de toile, caisse en bois de bonbons, balai), APRÈS M.drawFloor
  D.boutiqueSol = function (t, o) {
    o = o || {}; const c = cx_(), so = clamp(o.soir || 0), up = o.up || 0;
    c.save(); c.translate(0, -up); put(K.btSol, 0, 0, 0, 0.3); if (so > 0) put(K.btSolS, 0, 0, 0, null, so);
    c.restore();
  };

  // =====================================================================
  D.init_casting = function () {
    K.byFond = [makeByFond(0), makeByFond(1)];
    K.cannes = makeCannes();
    K.byTente = makeTente(); K.byFeu = makeFeu(); K.byCamp = makeCamp();
    K.byChene = ombre(makeJeuneChene(), 8);
    K.chL = ombre(lay(0, 100, 600, BACK + 10, (c) => chene(c, 1, 501)), 10);
    K.chR = ombre(lay(480, 100, W, BACK + 10, (c) => chene(c, -1, 601)), 10);
    MOU.L = mousseAnchors(1); MOU.R = mousseAnchors(-1);
    K.buisson = [makeBuisson(false), makeBuisson(true)];
    K.bySol = [makeBySol(0), makeBySol(1)];
    K.fougeres = [makeFougere(701, 150), makeFougere(702, 120), makeFougere(703, 170)];
    K.fougeresS = K.fougeres.map((cv) => teinte(cv, 'rgba(70,40,64,0.35)')); K.buissonS = teinte(K.buisson[1], 'rgba(80,50,72,0.3)');
    K.btRue = [makeRue(0), makeRue(1)]; K.btArr = makeArriere(); K.btMur = makeMur();
    K.btMil = makeMilieu(); K.btCaisse = makeCaisse(); K.btTab = makeTabouret(); K.btSol = makeBtSol(); K.btSolS = teinte(K.btSol, 'rgba(70,50,80,0.35)');
  };
})();
