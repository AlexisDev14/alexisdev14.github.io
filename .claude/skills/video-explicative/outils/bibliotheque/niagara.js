// persos.js — « Le tonneau du Niagara, la chute qui ne rapporta rien » (Annie Edson Taylor, 1901) : marionnettes, accessoires et
// décors PROPRES À CETTE VIDÉO. Espace M.nia (alias NIA). Appeler NIA.init() dans S.init. Mode d'emploi : persos.md (seul document à lire).
// Contenu : NIA.annie, NIA.manager, NIA.chat (marionnettes) ; NIA.tonneau, NIA.bourse, NIA.mite, NIA.pompe, NIA.photo, NIA.coussin (accessoires) ;
// NIA.salon / NIA.salonSol, NIA.rive, NIA.chutes (décors riches en trois couches, animés en temps global).
(function () {
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const NIA = (M.nia = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const has = (v) => v && v !== 'rien';

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
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
  function cbez(p0, p1, p2, p3, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }
  // contour hérissé (poils mouillés, queue en goupillon) : un pic au milieu de chaque côté
  function spiky(pts, amp, seed) {
    let cx = 0, cy = 0; pts.forEach((p) => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
    const o = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      let dx = mx - cx, dy = my - cy; const l = Math.hypot(dx, dy) || 1; const k = amp * (0.6 + 0.6 * hash(i * 3.1 + seed));
      o.push([a[0], a[1], 1], [mx + dx / l * k, my + dy / l * k, 1]);
    }
    return o;
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function worldPt(x, y) { return mp(cx_().getTransform(), [x, y]); }
  function gradRect(c, x0, y0, x1, y1, stops, horiz) {
    const g = horiz ? c.createLinearGradient(x0, 0, x1, 0) : c.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  function blob(c, x, y, r, col, a) { c.save(); c.globalAlpha = a == null ? 1 : a; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); c.restore(); }

  // ------------------------------------------------------------ bras à articulations rondes, IK locale (coude toujours vers l'avant)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96);
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  // poing [4,96] de l'avant-bras sur la cible T (repère du torse) ; des deux solutions, celle dont le coude plie vers l'avant (lo < 0 = M.ik bendSign 1)
  function ik2(S, T) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const b = normA(Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI - a);
      if (!best || b < best.b) best = { a: normA(a), b };
    }
    return best;
  }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: p.tenuO ? Object.assign({}, p.tenuO) : p.tenuO }); }
  function armTo(q, arm, T, k, SH) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH.F : SH.B, T), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function plier(q, th, hip) {                                                 // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - hip * Math.sin(th); q.dy = (q.dy || 0) + hip * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  // marche (ph en pas : jambes jointes aux entiers) ; petits sauts du kit
  function pas(q, ph, amp, bob, bras) {
    const sn = Math.sin(ph * PI), A = q.ang;
    A.legF = (A.legF || 0) + amp * sn; A.legB = (A.legB || 0) - amp * sn;
    q.dy = (q.dy || 0) - Math.abs(sn) * bob;
    if (bras) { A.armF_up = (A.armF_up || 0) - 0.12 * sn; A.armB_up = (A.armB_up || 0) + 0.1 * sn; }
  }

  // =====================================================================
  // OBJETS TENUS (repère : point de prise à l'origine après translate(-grip)) — même dessin que l'accessoire seul
  // =====================================================================
  const BO = { tissu: '#5e4660', tissuD: '#433146', brode: '#d9c9a0', laiton: '#b08d45', laitonL: '#e0c47c', laitonD: '#76592a' };
  function drawBourse(o) {
    const c = cx_(), op = clamp(o.ouverte || 0), rv = clamp(o.retournee || 0);
    c.save(); c.translate(0, 2); c.rotate(PI * ease(rv)); c.translate(0, -2);
    if (op > 0.02) pc(ell(0, -2 - 6 * op, 34, 3 + 10 * op, 16), '#1d1316', null, 7101, { drop: false });          // bouche ouverte (intérieur sombre)
    pc([[-34, 0], [34, 0], [40, 22], [44, 50], [38, 72], [20, 84], [-20, 84], [-38, 72], [-44, 50], [-40, 22]], BO.tissu, () => {
      for (const [x, y] of [[-18, 34], [0, 50], [18, 34], [-10, 68], [12, 68]]) {                                 // broderie de petites fleurs
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; dot(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 2.4, BO.brode); }
        dot(x, y, 2, '#b8862e');
      }
      strokePts([[-34, 8], [-40, 44], [-28, 76]], 'rgba(0,0,0,0.3)', 1.3); strokePts([[30, 8], [36, 46], [24, 78]], 'rgba(255,255,255,0.12)', 1.3);
      hatch(null, 0.8, 4, 0.2, 1, M.P.encre, [-46, -4, 46, 88]); shade(-44, 0, 44, 0, 0.3, [-48, -10, 48, 90]);
    }, 7102);
    // fermoir de laiton : barre arrière (charnière à gauche) qui s'ouvre, barre avant fixe, boules du fermoir
    c.save(); c.translate(-34, -1); c.rotate(-1.0 * op);
    pc([[0, -4], [68, -4], [71, 0], [68, 4], [0, 4], [-2, 0]], BO.laitonD, null, 7103);
    pc(ell(36, -9, 4.5, 4.5, 10), BO.laiton, () => dot(35, -10, 1.6, BO.laitonL), 7104);
    c.restore();
    pc([[-35, -3], [35, -3], [38, 1], [35, 5], [-35, 5], [-38, 1]], BO.laiton, () => strokePts([[-32, -1], [32, -1]], BO.laitonL, 1.2), 7105);
    if (op < 0.3) pc(ell(-4, -7, 4.5, 4.5, 10), BO.laiton, () => dot(-5, -8, 1.6, BO.laitonL), 7106);
    c.restore();
  }
  // photographie-carte (cabinet card) vue DE FACE : un petit dessin d'Annie à côté de son tonneau, sans aucune lettre
  function drawPhoto(o) {
    pc(rect(-38, -52, 38, 52), '#e6dcc4', () => {
      strokePts([[-34, -48], [34, -48], [34, 48], [-34, 48], [-34, -48]], '#b08d45', 1);
      fillPts(rect(-31, -44, 31, 30), '#b59b74');
      fillPts(rect(-31, -44, 31, -10), '#c9b590');                                                                 // ciel
      for (const x of [-26, -20, -15, -9]) strokePts([[x, -40], [x - 1, -12]], 'rgba(250,245,232,0.8)', 1.4);         // chute au loin
      fillPts([[-31, -10], [31, -10], [31, 30], [-31, 30]], '#9c8462');                                            // rive
      // Annie : robe noire, tête, grand chapeau à fleur
      fillPts([[-14, -14], [-8, -14], [-4, 22], [-20, 22]], '#2a2420'); dot(-11, -19, 4.2, '#e2c4a4');
      fillPts([[-22, -22], [0, -23], [-4, -26], [-18, -26]], '#1e1a18'); dot(-6, -26, 2, '#9b2d24');
      // tonneau cerclé
      fillPts([[6, -16], [22, -16], [25, 4], [22, 24], [6, 24], [3, 4]], '#6e4a2c');
      for (const y of [-10, 0, 10, 18]) strokePts([[4, y], [24, y]], '#2e2a28', 1.4);
      strokePts([[-31, 30], [31, 30]], 'rgba(60,40,20,0.6)', 1);
      hatch([[-31, -44], [31, -44], [31, 30], [-31, 30]], 0.8, 3.2, 0.12);
    }, 7201);
  }
  function drawCoussin(o) {
    pc([[-46, -20], [-30, -26], [0, -23], [30, -26], [46, -20], [50, 0], [46, 20], [30, 26], [0, 23], [-30, 26], [-46, 20], [-50, 0]], '#a8823a', () => {
      for (const x of [-30, -10, 10, 30]) strokePts([[x, -24], [x + 2, 24]], 'rgba(240,230,200,0.55)', 3);
      strokePts([[-40, -12], [-20, -4]], 'rgba(255,255,255,0.25)', 2); hatch(null, 0.7, 4, 0.18, 1, M.P.encre, [-52, -30, 52, 30]);
      shade(0, -26, 0, 26, 0.35, [-52, -30, 52, 30]);
    }, 7301);
    for (const [x, y] of [[-48, -22], [48, -22], [-48, 22], [48, 22]]) pc([[x - 4, y - 2], [x + 4, y - 2], [x + 6, y + 10, 1], [x - 6, y + 10, 1]], '#9b2d24', null, 7302 + x, { drop: false });
  }
  function drawGaffe(o) {
    pc([[-250, -5], [298, -5, 1], [298, 5, 1], [-250, 5], [-254, 0]], '#8a6a40', () => { strokePts([[-246, -2], [294, -2]], 'rgba(255,225,170,0.35)', 1.4); hatch(null, 0.1, 6, 0.15, 1, M.P.encre, [-260, -8, 300, 8]); }, 7401);
    pc([[294, -7], [332, -4], [356, 0, 1], [332, 3], [318, 4], [324, 16], [314, 26, 1], [306, 14], [298, 7]], '#3b3d40', () => strokePts([[300, -3], [340, -2]], 'rgba(255,255,255,0.3)', 1.2), 7402);
    pc(rect(-262, -6, -248, 6), '#5a5e64', null, 7403, { drop: false });
  }
  const OBJ = {
    bourse: { draw: drawBourse, grip: [0, 3], s: 1, pts: { bouche: (o) => rotPt([0, -6], [0, 2], PI * ease(clamp(o.retournee || 0))), fond: (o) => rotPt([0, 84], [0, 2], PI * ease(clamp(o.retournee || 0))) }, base: [0, 84] },
    photo: { draw: drawPhoto, grip: [0, 50], s: 1, plat: true, pts: { centre: [0, -8], haut: [0, -52] }, base: [0, 52] },
    coussin: { draw: drawCoussin, grip: [40, 0], p2: () => [-38, 2], s: 1, pts: { centre: [0, 0], avant: [52, 0] }, base: [0, 26] },
    gaffe: { draw: drawGaffe, grip: [0, 0], p2: () => [-84, 0], s: 1, pts: { croc: [352, 0], talon: [-254, 0] }, base: [0, 0] },
  };
  function rotPt(p, c0, a) { const dx = p[0] - c0[0], dy = p[1] - c0[1]; return [c0[0] + dx * Math.cos(a) - dy * Math.sin(a), c0[1] + dx * Math.sin(a) + dy * Math.cos(a)]; }
  NIA.OBJ = OBJ;
  const objOf = (name, o) => OBJ[name] || (o && o.draw ? { draw: o.draw, grip: o.grip || [0, 0], s: 1, pts: o.pts || {}, p2: o.p2 ? () => o.p2 : undefined, plat: !!o.plat } : null);
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(o, p) { return Object.assign({ t: p.t || 0 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = objOf(name, o); if (!ob) return;
    const oo = heldOpts(o, p), g = gripOf(ob, oo), c = cx_(), k = oo.k != null ? oo.k : ob.s;
    c.save(); c.scale(k, k); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    const plat = (n, o) => { const ob = objOf(n, o); return !!(ob && ob.plat); };
    return {
      objet0: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (has(p.tenu) && plat(p.tenu, p.tenuO)) heldDraw(p.tenu, p.tenuO, p); } },
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !plat(p.tenu, p.tenuO)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  function finish(q, SH) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !q.handF) q.handF = 'fist';
    if (has(q.tenuB) && !q.handB) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    A.objet0 = A.objet;
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    const ob = has(q.tenu) ? objOf(q.tenu, q.tenuO) : null;
    if (q.deuxMains && ob && ob.p2) {
      const oo = heldOpts(q.tenuO, q), g = gripOf(ob, oo), k = oo.k != null ? oo.k : ob.s;
      const Hf = new DOMMatrix().translate(SH.F[0], SH.F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).scale(k, k).translate(-g[0], -g[1]);
      const sol = ik2(SH.B, mp(Hf, ob.p2(oo)));
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  // cible écran (main avant / arrière) : M.ik du kit, bendSign 1 (coude vers l'avant), mélangé par cibleK / cibleBK
  function cibles(def, q, x, y, s, dir) {
    for (const [key, arm, kk] of [['cible', 'armF', 'cibleK'], ['cibleB', 'armB', 'cibleBK']]) {
      if (!q[key]) continue;
      const sol = M.ik(def, q, x, y, s, dir, arm, q[key], 1), k = q[kk] == null ? 1 : q[kk];
      q.ang[arm + '_up'] = lerp(q.ang[arm + '_up'] || 0, sol.up, k); q.ang[arm + '_lo'] = lerp(q.ang[arm + '_lo'] || 0, sol.lo, k);
      if (arm === 'armF' && !q.handF) q.handF = 'fist'; if (arm === 'armB' && !q.handB) q.handB = 'fist';
    }
  }
  function run(def, q, x, y, s, o, nom) {
    o = Object.assign({ slot: y + 34, nom }, o || {});
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.tenuO = heldOpts(q.tenuO, q); r.tenuBO = heldOpts(q.tenuBO, q); r.q = q;
    return r;
  }
  // point nommé de l'objet tenu, en coordonnées écran : NIA.pt(r, 'bouche') ; arriere = true pour l'objet de la main arrière
  NIA.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, oo = arriere ? r.tenuBO : r.tenuO, ob = objOf(name, oo); if (!ob || !ob.pts || !ob.pts[nom]) return null;
    const g = gripOf(ob, oo), k = oo.k != null ? oo.k : ob.s, q0 = ob.pts[nom], q = typeof q0 === 'function' ? q0(oo) : q0;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };
  function foreDef(parent, base, skin, back, seed, cuffCol) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (cuffCol) { fillPts([[-13, 60, 1], [13, 60, 1], [14, 77, 1], [-13, 77, 1]], cuffCol); for (let x = -11; x <= 11; x += 4) dot(x, 77, 1.6, cuffCol); }
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, 0.22);
    } };
  }
  const upDef = (at, base, seed, wt, paint) => ({ parent: 'torso', at, pts: armR(LA, wt), base, seed, paint: paint || (() => hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.28)) });

  // =====================================================================
  // ANNIE TAYLOR (63 ans) — robe de veuve bleu nuit jusqu'au sol, col montant ivoire, grand chapeau noir à fleurs et plume, lunettes d'or
  // =====================================================================
  const AN = { robe: '#23242e', robeL: '#353849', robeD: '#15161c', col: '#e8dfc8', colD: '#c9bea4', or: '#b08d45', orL: '#e0c47c', chev: '#b9b6ad', chevV: '#d4d1ca', chevJ: '#4a3222',
    chap: '#1d1c22', chapL: '#3a3842', ocre: '#c08a32', rouge: '#9b2d24', plume: '#d6cfbd', peau: '#e2c4a4', peauJ: '#e8c6a2', peauD: '#c7a685', botte: '#141316', bas: '#2a2a30', bandage: '#efe8d6' };
  const AN_SH = { F: [-2, -146], B: [-10, -146] };
  const AN_TORSO = [[-12, -182], [12, -184], [18, -170], [22, -152], [30, -130], [32, -108], [24, -76], [19, -48], [22, -14], [30, 40], [40, 110], [46, 170], [52, 220, 1],
    [-64, 220, 1], [-56, 170], [-46, 110], [-38, 40], [-30, -14], [-28, -50], [-30, -90], [-32, -130], [-28, -158], [-20, -174]];
  const AN_TORSO_ASSISE = [[-12, -182], [12, -184], [18, -170], [22, -152], [30, -130], [32, -108], [24, -76], [19, -48], [24, -14], [34, 14, 1], [-38, 18, 1], [-30, -14], [-28, -50], [-30, -90], [-32, -130], [-28, -158], [-20, -174]];
  const AN_GIRON = [[-40, 2], [0, -10], [118, -10], [148, 0], [158, 30], [164, 148, 1], [98, 148, 1], [94, 60], [70, 38], [-36, 40]];
  const AN_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [19, -9], [22, -14], [21, -19], [23, -22], [22, -26], [25, -30], [32, -37, 1], [28, -44], [25, -54], [26, -64], [22, -78], [10, -90], [-8, -94], [-24, -86], [-32, -68], [-31, -46], [-24, -28], [-16, -8]];
  const AN_CHAP = [[-96, 4], [-90, -3], [-46, -7], [-44, -30], [-30, -47], [0, -53], [30, -47], [42, -30], [46, -9], [94, -11], [102, -6, 1], [98, 2], [50, 7], [0, 9], [-50, 9]];
  const AN_CHAP_ECR = [[-92, 18], [-80, 6], [-44, 0], [-40, -10], [-20, -18], [-4, -11], [10, -20], [34, -16], [44, -4], [80, 12], [96, 28, 1], [88, 32], [52, 14], [0, 10], [-50, 12], [-86, 24]];
  const AN_LEG = X.legPts(0.72);
  function annieLeg(back) {
    return () => {
      fillPts([[-40, 150, 1], [60, 150, 1], [60, 196, 1], [-40, 196, 1]], AN.bas);
      fillPts([[-40, 196, 1], [62, 196, 1], [62, 260, 1], [-40, 260, 1]], AN.botte);
      if (!back) { for (const y of [202, 210, 218]) dot(10, y, 1.5, '#5a5860'); strokePts([[18, 226], [42, 230]], 'rgba(255,255,255,0.28)', 1.3); }
      hatch(null, 0.8, 3.6, back ? 0.3 : 0.18);
    };
  }
  function mkAnnie() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => (p.assise ? AN_TORSO_ASSISE : AN_TORSO), base: AN.robe, seed: 8101, paint: (p) => {
        fillPts([[-6, -150], [22, -150], [30, -110], [24, -76], [18, -48], [2, -48]], AN.robeL);                         // plastron
        for (let y = -140; y <= -58; y += 14) dot(21 + (y + 140) * -0.02, y, 2.1, '#0c0c10');                               // boutons de jais
        for (let y = -140; y <= -58; y += 14) dot(20.4 + (y + 140) * -0.02, y - 0.8, 0.8, 'rgba(255,255,255,0.5)');
        fillPts([[-32, -54], [21, -54], [22, -42], [-30, -42]], AN.robeD); fillPts(rect(10, -53, 18, -43), AN.or);       // ceinture, boucle
        if (!p.assise) {
          for (const [x0, x1] of [[-20, -44], [-6, -18], [8, 10], [-30, -58], [16, 34]]) strokePts([[x0, -40], [(x0 + x1) / 2, 90], [x1, 214]], 'rgba(5,5,10,0.55)', 1.3);
          for (const [x0, x1] of [[-14, -36], [2, -4], [12, 22]]) strokePts([[x0 + 3, -36], [(x0 + x1) / 2 + 3, 90], [x1 + 3, 210]], 'rgba(120,125,150,0.22)', 1.1);
          fillPts([[-62, 204], [50, 204], [52, 220], [-64, 220]], AN.robeL); strokePts([[-62, 206], [50, 206]], 'rgba(200,190,160,0.35)', 1);   // galon de l'ourlet
        }
        // col montant ivoire à petite ruche, broche d'or vieilli
        fillPts([[-12, -186], [14, -188], [16, -164], [-10, -160]], AN.col); for (let x = -10; x <= 14; x += 4) dot(x, -187, 2, AN.col);
        strokePts([[-10, -176], [15, -177]], AN.colD, 1); strokePts([[-10, -168], [15, -169]], AN.colD, 1);
        fillPts(ell(19, -158, 6, 7.5, 12), AN.or); fillPts(ell(19, -158, 3, 4, 10), '#3b2a3a'); dot(18, -160, 1.2, AN.orL);
        hatch([[-60, -170], [-14, -170], [-20, 216], [-66, 216]], 0.75, 4.4, 0.26, 1.05, '200,205,220');
        shade(36, 0, -50, 0, 0.3, [-80, -200, 70, 230]);
      } },
      giron: { parent: 'torso', at: [0, 0], noRivet: true, pts: (p) => (p.assise ? AN_GIRON : OFFP), base: AN.robe, seed: 8102, paint: () => {
        strokePts([[0, 8], [120, 4]], 'rgba(120,125,150,0.25)', 1.2); strokePts([[110, 20], [130, 140]], 'rgba(5,5,10,0.5)', 1.3); strokePts([[140, 30], [150, 140]], 'rgba(5,5,10,0.5)', 1.3);
        fillPts([[124, 136, 1], [176, 136, 1], [178, 150, 1], [124, 150, 1]], AN.botte); strokePts([[150, 140], [172, 143]], 'rgba(255,255,255,0.25)', 1.2);   // bottines
        hatch(null, 0.75, 4.4, 0.24, 1.05, '200,205,220', [-50, -20, 180, 160]);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: AN_LEG, base: AN.bas, seed: 8103, noRivet: true, paint: annieLeg(true) },
      legF: { parent: 'torso', at: [6, -2], pts: AN_LEG, base: AN.bas, seed: 8104, noRivet: true, paint: annieLeg(false) },
      armB_up: upDef([-10, -146], AN.robeD, 8105, 17),
      armB_lo: foreDef('armB_up', AN.robeD, AN.peauD, true, 8106, AN.colD),
      head: { parent: 'torso', at: [6, -170], pts: AN_HEAD, base: AN.peau, seed: 8107, noRivet: true, paint: (p) => {
        const f = p.face || {}, j = p.jeune, hc = j ? AN.chevJ : p.vieille ? AN.chevV : AN.chev;
        if (j) fillPts([[-40, -120], [60, -120], [60, 30], [-40, 30]], AN.peauJ);
        // cheveux tirés en arrière (bandeaux), oreille dégagée
        fillPts([[26, -76], [14, -90], [-8, -96], [-26, -88], [-35, -66], [-34, -40], [-24, -36], [-16, -52], [-6, -66], [10, -72], [24, -68]], hc);
        for (const k of [0, 1, 2]) strokePts([[22 - k * 4, -72 + k * 3], [0, -82 + k * 6], [-24, -76 + k * 10]], j ? 'rgba(30,18,10,0.5)' : 'rgba(120,118,110,0.6)', 1);
        X.earPaint(-10, -44);
        if (!j) {                                                                                                  // rides fines
          for (const a of [-0.35, 0, 0.35]) strokePts([[8, -50], [8 - 7 * Math.cos(a), -50 + 7 * Math.sin(a)]], 'rgba(120,80,60,0.45)', 0.9);
          strokePts([[20, -24], [16, -18], [12, -12]], 'rgba(120,80,60,0.5)', 1); strokePts([[10, -66], [22, -68]], 'rgba(120,80,60,0.35)', 0.9);
          strokePts([[6, -8], [14, -4]], 'rgba(120,80,60,0.4)', 0.9);
          if (p.vieille) { strokePts([[8, -60], [22, -62]], 'rgba(120,80,60,0.4)', 0.9); strokePts([[-2, -30], [4, -18]], 'rgba(120,80,60,0.35)', 0.9); }
        }
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.25);
        dot(14, -30, 8, j ? 'rgba(215,120,110,0.32)' : 'rgba(205,130,110,0.2)');
        if (p.joues) { fillPts(ell(18, -26, 8, 7, 12), j ? AN.peauJ : AN.peau); strokePts(ep(18, -26, 8, 7, 8, -1.2, 1.6), 'rgba(140,80,60,0.6)', 1.1); }
        X.eye(f, 16, -50, 0.92); X.brow(f, 16, -58, j ? 'rgba(60,35,20,0.9)' : 'rgba(130,128,120,0.95)', 1.8); X.mouth(f, 24, -21, 'rgba(130,60,55,0.9)');
        if (!j) {                                                                                                  // lunettes rondes cerclées d'or
          const ring = ell(17, -50, 9, 9, 14);
          fillPts(ring, 'rgba(200,225,235,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), AN.or, 1.7);
          strokePts([[8, -51], [-10, -52]], AN.or, 1.3); strokePts([[12, -56], [18, -58]], 'rgba(255,255,255,0.7)', 1.1);
        }
        if (p.pansement) {                                                                                       // bandage ivoire, sans sang
          const tour = [[30, -63], [29, -78], [-32, -68], [-36, -53]], crane = [[16, -88], [4, -97], [-22, -66], [-10, -60]];
          for (const b of [crane, tour]) { fillPts(b, AN.bandage); strokePts(b.concat([b[0]]), 'rgba(90,80,60,0.9)', 1.8); }
          for (const k of [0.33, 0.66]) strokePts([[lerp(30, -36, 0), lerp(-63, -78, k)], [-34, lerp(-53, -68, k)]], 'rgba(150,140,120,0.55)', 0.9);
          strokePts([[10, -92], [-16, -63]], 'rgba(150,140,120,0.55)', 0.9);
        }
      } },
      chignon: { parent: 'head', at: [-30, -62], noRivet: true, pts: ell(0, 0, 15, 14, 12), base: AN.chev, seed: 8108, paint: (p) => {
        if (p.jeune || p.vieille) fillPts(rect(-20, -20, 20, 20), p.jeune ? AN.chevJ : AN.chevV);
        strokePts(ep(0, 0, 9, 8, 10, 0.2, 5.2), 'rgba(80,70,60,0.5)', 1.1); strokePts(ep(0, 0, 4, 4, 8, 0.5, 5.5), 'rgba(80,70,60,0.5)', 1);
      } },
      plume: { parent: 'chapeau', at: [-24, -40], noRivet: true, base: AN.plume, seed: 8109,
        pts: (p) => ribbon(p.chapeauEcrase ? [[6, 26], [-20, 18], [-40, 26], [-48, 48], [-50, 74]] : [[0, 0], [-26, -28], [-56, -42], [-88, -40], [-110, -26]], 16, 6),
        paint: (p) => { const L = p.chapeauEcrase ? [[6, 26], [-20, 18], [-40, 26], [-48, 48], [-50, 74]] : [[0, 0], [-26, -28], [-56, -42], [-88, -40], [-110, -26]];
          strokePts(L, 'rgba(120,110,95,0.8)', 1.3); for (let i = 1; i < L.length; i++) { const a = L[i - 1], b = L[i]; for (let k = 0; k < 4; k++) { const u = k / 4, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); strokePts([[x, y], [x - 4, y - 8]], 'rgba(150,140,120,0.6)', 0.8); strokePts([[x, y], [x - 5, y + 7]], 'rgba(150,140,120,0.6)', 0.8); } } } },
      chapeau: { parent: 'head', at: [-2, -84], rest: -0.06, noRivet: true, pts: (p) => (p.chapeauEcrase ? AN_CHAP_ECR : AN_CHAP), base: AN.chap, seed: 8110, paint: (p) => {
        const e = p.chapeauEcrase;
        fillPts(e ? [[-40, -4], [44, -3], [44, 4], [-40, 4]] : [[-44, -16], [45, -18], [46, -8], [-46, -7]], '#3b2a3a');            // ruban violine
        strokePts(e ? [[-90, 6], [-20, 6], [40, 6], [90, 14]] : [[-92, 2], [0, 6], [96, -4]], 'rgba(255,255,255,0.18)', 1.3);
        hatch(null, 0.9, 4, 0.25, 1, M.P.encre, [-100, -60, 104, 20]); shade(-40, -50, 40, 10, 0.25, [-104, -60, 104, 22]);
      } },
      fleurs: { parent: 'chapeau', at: [20, -40], noRivet: true, base: '#3e4a32', seed: 8111, pts: (p) => (p.chapeauEcrase ? tr(ell(4, 2, 30, 18, 14), -44, 24) : ell(4, 2, 30, 18, 14)), paint: (p) => {
        if (p.chapeauEcrase) M.ctx().translate(-44, 24);
        for (const [x, y, r, col] of [[-12, 0, 11, AN.ocre], [10, -4, 12, AN.rouge], [24, 8, 9, AN.ocre], [0, 12, 8, AN.rouge]]) {
          fillPts(ell(x, y, r, r * 0.9, 10), col); strokePts(ep(x, y, r * 0.6, r * 0.5, 8, 0, 5), 'rgba(40,15,10,0.55)', 1); dot(x, y, 2.2, 'rgba(40,15,10,0.6)');
        }
        fillPts([[-30, 6], [-18, -6], [-14, 10]], '#4d5a3c'); fillPts([[30, -2], [36, 14], [20, 12]], '#4d5a3c');
      } },
      armF_up: upDef([-2, -146], AN.robe, 8112, 17, () => { hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.28); strokePts([[6, -12], [10, 30]], 'rgba(120,125,150,0.3)', 1.2); }),
      armF_lo: foreDef('armF_up', AN.robe, AN.peau, false, 8113, AN.col),
    };
    Object.assign(parts, heldParts(AN.peau, 8120));
    return { hipY: -238, handLen: 104, rod: { part: 'torso', at: [-26, 18] }, parts, nom: 'annie',
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head', 'chignon', 'plume', 'chapeau', 'fleurs', 'torso', 'giron', 'objet0', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.niaAnnie = mkAnnie();
  // gestes d'Annie (repère du torse) ; renvoie la pose avant finish (les cibles écran s'appliquent ensuite)
  function annieGestes(p) {
    const q = prep(p), A = q.ang, t = q.t || 0, SH = AN_SH;
    const userF = p && p.ang && (p.ang.armF_up != null || p.ang.armF_lo != null);
    if (A.armF_lo == null) A.armF_lo = -0.22; if (A.armB_lo == null) A.armB_lo = -0.3; if (A.armF_up == null) A.armF_up = -0.05;
    if (q.marche != null) pas(q, q.marche, 0.3, 7, true);
    if (q.vieille) { const v = clamp(q.vieille); plier(q, 0.08 * v, 238); A.head = (A.head || 0) - 0.08 * v; A.armF_up -= 0.1 * v; A.armB_up = (A.armB_up || 0) - 0.08 * v; }
    if (q.assise) { q.hide.legF = 1; q.hide.legB = 1; q.dy = (q.dy || 0) + 88; }
    if (q.chapeau === false || (q.pansement && q.chapeau !== true && !q.chapeauEcrase)) { q.hide.chapeau = 1; q.hide.plume = 1; q.hide.fleurs = 1; }
    if (q.chapeauEcrase) { A.chapeau = (A.chapeau || 0) + 0.2; A.fleurs = (A.fleurs || 0) - 0.6; A.plume = (A.plume || 0) + 0.3; }
    const k = (n) => ease(clamp(q[n] || 0));
    let geste = false;
    const so = k('souffle');
    if (so > 0) { plier(q, 0.1 * so, 238); A.head = (A.head || 0) + 0.14 * so; if (!q.face.mouth) q.face.mouth = 'o'; if (so > 0.4) q.joues = true; armTo(q, 'armF', [38, -54], so, SH); armTo(q, 'armB', [32, -50], so, SH); geste = true; }
    const to = k('toque');
    if (to > 0) { armTo(q, 'armF', [114, -112], to, SH); q.handF = q.handF || 'fist'; geste = true; }
    const te = k('tendre');
    if (te > 0) { armTo(q, 'armF', [150, -126], te, SH); if (q.droit == null) q.droit = true; geste = true; }
    const rv = k('retourne');
    if (rv > 0 || (q.tenu === 'bourse' && q.retourne != null)) { q.tenuO = Object.assign({}, q.tenuO, { retournee: clamp(q.retourne || 0) }); armTo(q, 'armF', [lerp(80, 104, rv), lerp(-104, -150, rv)], 1, SH); A.head = (A.head || 0) + 0.08 * rv; geste = true; }
    const no = k('non');
    if (no > 0) { blend(q, 'armF_up', -0.5, no); blend(q, 'armF_lo', -2.2 + 0.18 * Math.sin(t * 10), no); q.handF = 'open'; A.head = (A.head || 0) + 0.05 * Math.sin(t * 5) * no; geste = true; }
    const fi = k('fiere');
    if (fi > 0) { A.head = (A.head || 0) - 0.26 * fi; q.tilt = (q.tilt || 0) - 0.04 * fi; armTo(q, 'armF', [30, -124], fi, SH); if (!q.handF) q.handF = 'open'; geste = true; }
    const po = k('pousse');
    if (q.tenu === 'coussin' || po > 0) { if (q.deuxMains == null) q.deuxMains = true; plier(q, 0.2 * po, 238); armTo(q, 'armF', [lerp(84, 150, po), lerp(-100, -30, po)], 1, SH); geste = true; }
    if (has(q.tenu) && !geste && !userF) armTo(q, 'armF', [78, -104], q.montre == null ? 1 : ease(clamp(q.montre)), SH);
    return q;
  }
  NIA.anniePose = (p) => finish(annieGestes(p), AN_SH);
  NIA.annie = function (pose, x, y, s, o) {
    s = s == null ? 0.9 : s; o = o || {};
    const q = annieGestes(pose); cibles(CH.niaAnnie, q, x, y, s, o.dir || 1); finish(q, AN_SH);
    return run(CH.niaAnnie, q, x, y, s, o, 'annie');
  };

  // =====================================================================
  // FRANK RUSSELL, LE MANAGER — bonimenteur grand et maigre, costume à grands carreaux moutarde/brun, gilet rouge, nœud papillon,
  // cheveux noirs gominés raie au milieu (pas de chapeau), moustache en guidon cirée, cigare
  // =====================================================================
  const MA = { car: '#b8892e', carD: '#5a3d22', carL: '#cfa24a', gilet: '#8e2a22', noeud: '#a3302a', cheveux: '#141214', peau: '#dcb894', peauD: '#c29e7c',
    chemise: '#ece6d6', guetre: '#d9d2c0', soulier: '#2a1d16', cigare: '#6a4426' };
  const MA_HIP = 280, MA_SH = { F: [-2, -158], B: [-10, -158] };
  const MA_TORSO = [[-12, -196], [10, -198], [16, -186], [26, -166], [32, -130], [33, -90], [30, -50], [32, 0], [36, 62, 1], [-38, 64, 1], [-36, 0], [-33, -60], [-34, -120], [-32, -160], [-24, -184]];
  const MA_LEG = X.legPts(0.78).map((p) => (p[2] ? [p[0], p[1] * 1.19, 1] : [p[0], p[1] * 1.19]));
  const MA_HEAD = X.NAP_HEAD.map((p) => [p[0] * 0.94, p[1] * 1.07]);
  function carreaux(x0, y0, x1, y1, sp, ofs) {                                      // grands carreaux moutarde / brun
    for (let i = 0, x = x0 + (ofs || 0); x < x1; x += sp, i++) for (let j = 0, y = y0; y < y1; y += sp, j++) if ((i + j) % 2) fillPts(rect(x, y, x + sp, y + sp), 'rgba(90,61,34,0.2)', 0, 0);
    for (let x = x0 + (ofs || 0); x < x1; x += sp) { strokePts([[x, y0], [x, y1]], 'rgba(90,61,34,0.75)', 2.6); strokePts([[x + sp / 2, y0], [x + sp / 2, y1]], 'rgba(90,61,34,0.4)', 0.9); }
    for (let y = y0; y < y1; y += sp) { strokePts([[x0, y], [x1, y]], 'rgba(90,61,34,0.75)', 2.6); strokePts([[x0, y + sp / 2], [x1, y + sp / 2]], 'rgba(90,61,34,0.4)', 0.9); }
  }
  function managerLeg(back) {
    return () => {
      carreaux(-40, -20, 60, 250, 26, back ? 9 : 0);
      fillPts([[-40, 236, 1], [64, 236, 1], [64, 262, 1], [-40, 262, 1]], MA.guetre); if (!back) for (const y of [242, 250, 258]) dot(14, y, 1.5, '#8a8270');   // guêtres
      fillPts([[-40, 262, 1], [64, 262, 1], [64, 300, 1], [-40, 300, 1]], MA.soulier); if (!back) strokePts([[20, 268], [46, 272]], 'rgba(255,255,255,0.3)', 1.3);
      hatch(null, 0.8, 3.6, back ? 0.32 : 0.16);
    };
  }
  function mkManager() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: MA_TORSO, base: MA.car, seed: 8201, paint: () => {
        carreaux(-50, -210, 50, 70, 26, 0);
        fillPts([[8, -186], [18, -172], [30, -132], [32, -92], [28, -60], [18, -60], [14, -120], [6, -176]], MA.gilet);              // gilet rouge
        for (const y of [-150, -128, -106, -84]) dot(22 + (y + 150) * 0.05, y, 2, '#e0c47c');
        strokePts([[16, -110], [4, -98], [-10, -104]], '#e0c47c', 1.3);                                                             // chaîne de montre
        fillPts([[6, -198], [14, -190], [12, -182], [4, -188]], MA.chemise);                                                         // col de chemise
        fillPts([[16, -184], [26, -164], [30, -130], [22, -120], [20, -150], [12, -176]], 'rgba(60,40,20,0.35)');                  // revers
        strokePts([[28, -60], [32, 0], [35, 60]], 'rgba(40,25,10,0.7)', 1.6);                                                        // bord de la veste
        fillPts(rect(-26, -10, 2, 0), 'rgba(60,40,20,0.35)'); fillPts([[-24, -130], [-6, -130], [-8, -122], [-22, -120]], MA.noeud);  // poche, pochette
        hatch([[-50, -190], [-14, -190], [-16, 64], [-50, 64]], 0.75, 4.2, 0.3);
        shade(36, 0, -40, 0, 0.3, [-60, -210, 50, 70]);
      } },
      noeud: { parent: 'torso', at: [14, -186], noRivet: true, base: MA.noeud, seed: 8202, pts: [[-2, 0], [10, -8, 1], [12, 8, 1], [2, 2], [-6, 9, 1], [-8, -7, 1]], paint: () => dot(2, 0, 2.6, '#6e1d18') },
      legB: { parent: 'torso', at: [-6, -2], pts: MA_LEG, base: MA.car, seed: 8203, noRivet: true, paint: managerLeg(true) },
      legF: { parent: 'torso', at: [6, -2], pts: MA_LEG, base: MA.car, seed: 8204, noRivet: true, paint: managerLeg(false) },
      armB_up: upDef([-10, -158], MA.car, 8205, 15, () => { carreaux(-20, -20, 20, 110, 26, 7); hatch(null, 0.9, 3.8, 0.35); }),
      armB_lo: Object.assign(foreDef('armB_up', MA.car, MA.peauD, true, 8206, MA.chemise), {}),
      head: { parent: 'torso', at: [6, -184], pts: MA_HEAD, base: MA.peau, seed: 8207, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[30, -84], [24, -96], [6, -106], [-14, -104], [-30, -92], [-34, -70], [-32, -46], [-24, -40], [-18, -60], [-4, -74], [16, -80]], MA.cheveux);   // gominés
        strokePts([[22, -92], [4, -100], [-18, -96]], 'rgba(255,255,255,0.35)', 1.6); strokePts([[26, -90], [10, -104], [-10, -106]], '#d8b894', 1.3);    // raie au milieu
        fillPts([[-2, -54], [3, -54], [3, -40], [-2, -38]], MA.cheveux);                                                                    // favori
        strokePts([[18, -86], [0, -94], [-20, -88]], 'rgba(255,255,255,0.22)', 2.4); strokePts([[-24, -80], [-30, -60]], 'rgba(255,255,255,0.18)', 2);
        X.earPaint(-14, -46);
        strokePts([[22, -12], [14, -4]], 'rgba(120,80,60,0.45)', 1); strokePts([[6, -40], [10, -30]], 'rgba(120,80,60,0.35)', 1);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        X.eye(f, 16, -54, 0.85); X.brow(f, 16, -63, 'rgba(15,12,12,0.95)', 3.2);
        strokePts([[8, -66], [16, -70], [24, -64]], 'rgba(15,12,12,0.9)', 1.2);
        X.mouth(Object.assign({ mouth: 'smile' }, f), 26, -26, 'rgba(110,40,38,0.95)');
      } },
      moustache: { parent: 'head', at: [24, -33], noRivet: true, base: MA.cheveux, seed: 8208,
        pts: [[-8, -1], [4, -4], [10, -3], [15, -6], [18, -12], [16, -18, 1], [22, -13], [21, -4], [14, 2], [4, 3], [-8, 3]], paint: () => strokePts([[-4, 0], [12, -2], [18, -10]], 'rgba(255,255,255,0.3)', 1) },
      cigare: { parent: 'head', at: [26, -24], rest: 0.35, noRivet: true, base: MA.cigare, seed: 8209, pts: [[0, -4], [40, -4, 1], [40, 4, 1], [0, 4]], paint: () => {
        fillPts(rect(32, -4, 40, 4), '#9a9590'); strokePts([[8, -4], [8, 4]], '#b08d45', 3); for (const x of [16, 24]) strokePts([[x, -3], [x + 2, 3]], 'rgba(0,0,0,0.3)', 0.8);
      }, extra: (p) => {
        if (SIL()) return; const c = cx_(), t = p.t || 0;
        c.save(); c.beginPath(); c.arc(41, 0, 3, 0, TAU); c.fillStyle = `rgba(230,${110 + 40 * Math.sin(t * 7)},50,0.9)`; c.fill();
        for (let i = 0; i < 3; i++) { const u = ((t * 0.5 + i / 3) % 1); c.globalAlpha = 0.35 * (1 - u); c.beginPath(); c.arc(42 + u * 10 + Math.sin(u * 8 + i) * 4, -u * 40, 3 + u * 7, 0, TAU); c.fillStyle = '#d9d2c4'; c.fill(); }
        c.restore();
      } },
      charge: { parent: 'torso', at: [130, 200], noRivet: true, base: '#000', seed: 8210, pts: OFFP, extra: (p) => {
        if (!p.charge) return; const c = cx_(), k = p.chargeS || 1 / 0.9;
        c.save(); c.scale(k, k); drawTonneau(Object.assign({ t: p.t || 0 }, p.chargeO)); c.restore();
      } },
      armF_up: upDef([-2, -158], MA.car, 8211, 15, () => { carreaux(-20, -20, 20, 110, 26, 0); hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.28); }),
      armF_lo: foreDef('armF_up', MA.car, MA.peau, false, 8212, MA.chemise),
    };
    // carreaux sur les avant-bras (par-dessus la peinture de foreDef, sous la manchette)
    for (const n of ['armF_lo', 'armB_lo']) { const pp = parts[n].paint; parts[n].paint = (p) => { carreaux(-20, -14, 20, 60, 26, n === 'armB_lo' ? 7 : 0); pp(p); }; }
    Object.assign(parts, heldParts(MA.peau, 8220));
    return { hipY: -MA_HIP, handLen: 104, rod: { part: 'torso', at: [-26, 18] }, parts, nom: 'manager',
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head', 'moustache', 'cigare', 'torso', 'noeud', 'charge', 'objet0', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.niaManager = mkManager();
  function managerGestes(p) {
    const q = prep(p), A = q.ang, t = q.t || 0, SH = MA_SH;
    const userF = p && p.ang && (p.ang.armF_up != null || p.ang.armF_lo != null);
    if (A.armF_lo == null) A.armF_lo = -0.2; if (A.armB_lo == null) A.armB_lo = -0.28; if (A.armF_up == null) A.armF_up = -0.04;
    const k = (n) => ease(clamp(q[n] || 0));
    const pt = k('porte'), ti = k('tire'), ga = k('gaffe'), pm = k('pompe'), bo = k('bonimente');
    const brasLibres = !(pt || ti || ga || pm || bo || has(q.tenu) || userF);
    if (q.marche != null) pas(q, q.marche, 0.32, 8, brasLibres);
    if (q.court != null) {
      const sn = Math.sin(q.court * PI); A.legF = (A.legF || 0) + 0.52 * sn; A.legB = (A.legB || 0) - 0.52 * sn;
      q.tilt = (q.tilt || 0) + 0.1; q.dy = (q.dy || 0) - Math.abs(sn) * 14;
      if (brasLibres) { A.armF_up = -0.3 - 0.35 * sn; A.armF_lo = -1.55; A.armB_up = -0.3 + 0.35 * sn; A.armB_lo = -1.55; q.handF = q.handF || 'fist'; q.handB = q.handB || 'fist'; }
    }
    if (pt > 0) { q.tilt = (q.tilt || 0) - 0.07 * pt; armTo(q, 'armF', [98, -62], pt, SH); armTo(q, 'armB', [150, -26], pt, SH); q.handF = q.handF || 'fist'; q.handB = q.handB || 'fist'; if (q.charge == null) q.charge = pt > 0.5; }
    if (pm > 0) { plier(q, (q.pliage != null ? q.pliage : 0.6) * pm, MA_HIP); armTo(q, 'armF', [112, 36], pm, SH); armTo(q, 'armB', [96, 40], pm, SH); q.handF = q.handF || 'fist'; q.handB = q.handB || 'fist'; }
    if (ti > 0) { q.tilt = (q.tilt || 0) - 0.1 * ti; A.legF = (A.legF || 0) - 0.28 * ti; A.legB = (A.legB || 0) + 0.12 * ti; armTo(q, 'armF', [156, -104], ti, SH); armTo(q, 'armB', [118, -98], ti, SH); q.handF = q.handF || 'fist'; q.handB = q.handB || 'fist'; }
    if (ga > 0) { if (!q.tenu) q.tenu = 'gaffe'; if (q.deuxMains == null) q.deuxMains = true; armTo(q, 'armF', [150, -90], ga, SH); }
    if (bo > 0) { blend(q, 'armF_up', -1.5, bo); blend(q, 'armF_lo', -0.2, bo); q.handF = q.handF || 'open'; armTo(q, 'armB', [44, -120], bo, SH); A.head = (A.head || 0) - 0.12 * bo; if (!q.face.mouth) q.face.mouth = 'o'; }
    if (has(q.tenu) && !(pt || ti || ga || pm || bo || userF)) armTo(q, 'armF', [80, -110], 1, SH);
    return q;
  }
  NIA.managerPose = (p) => finish(managerGestes(p), MA_SH);
  NIA.manager = function (pose, x, y, s, o) {
    s = s == null ? 0.9 : s; o = o || {};
    const q = managerGestes(pose); cibles(CH.niaManager, q, x, y, s, o.dir || 1); finish(q, MA_SH);
    const r = run(CH.niaManager, q, x, y, s, o, 'manager');
    r.charge = r.w('charge', 0, 0);                                                    // bas du tonneau porté (écran)
    return r;
  };

  // =====================================================================
  // LE CHAT — tigré gris-brun, de profil (def.libre : animal). Postures mélangées : herisse, assis, saute (0..1) ; marche = phase
  // =====================================================================
  const CA = { poil: '#7b7266', ray: '#4a443c', ventre: '#a49a8a', loin: '#5e574d', oeil: '#c9a03a', nez: '#b77a6e', mouille: '#5d5850' };
  const CAT_B = {
    N: [[-72, -6], [-62, -22], [-30, -28], [0, -27], [30, -28], [56, -30], [70, -14], [64, 8], [46, 22], [0, 20], [-40, 22], [-66, 14]],
    H: [[-66, 10], [-62, -22], [-38, -62], [0, -78], [30, -66], [54, -42], [68, -18], [62, 6], [44, 18], [0, 2], [-38, 14], [-60, 20]],
    A: [[-46, 46], [-60, 14], [-54, -18], [-34, -44], [-6, -62], [20, -76], [38, -66], [42, -38], [36, -8], [22, 30], [-8, 48], [-34, 50]],
    S: [[-92, -2], [-78, -18], [-36, -24], [0, -23], [40, -24], [76, -24], [90, -10], [82, 8], [56, 16], [0, 14], [-50, 16], [-84, 10]],
  };
  const CAT_AT = { tete: { N: [64, -20], H: [62, -34], A: [30, -78], S: [86, -14] }, av: { N: [44, 12], H: [44, 12], A: [24, -6], S: [64, 8] }, ar: { N: [-50, 12], H: [-48, 14], A: [-36, 42], S: [-72, 8] },
    queue: { N: [-66, -8], H: [-60, -10], A: [-50, 30], S: [-86, -6] } };
  const CAT_Q = { N: [[0, 0], [-34, -14], [-50, -54], [-40, -90]], H: [[0, 0], [-10, -40], [-14, -80], [-8, -116]], A: [[0, 0], [-10, 20], [20, 30], [70, 24]], S: [[0, 0], [-40, -6], [-80, -10], [-124, -4]], W: [[0, 0], [-20, 20], [-32, 44], [-52, 54]] };
  const CAT_HEAD = [[-8, 0], [-12, -16], [-8, -34], [-2, -42], [4, -62, 1], [16, -46], [26, -46], [34, -58, 1], [38, -38], [44, -28], [48, -18], [50, -12, 1], [44, -6], [38, 0], [24, 6], [8, 8]];
  const CAT_HEAD_H = [[-8, 0], [-12, -16], [-8, -34], [-14, -46, 1], [2, -44], [16, -46], [22, -48], [18, -56, 1], [36, -40], [44, -28], [48, -18], [50, -12, 1], [44, -6], [38, 0], [24, 6], [8, 8]];
  const catLeg = (L) => [[-9, -6], [9, -6], [8, L * 0.5], [7, L - 8], [14, L - 5], [17, L, 1], [-8, L, 1], [-8, L - 8], [-9, L * 0.5]];
  function mixPts(w, src) { return src.N.map((p, i) => { let x = p[0], y = p[1]; for (const k of ['H', 'A', 'S', 'W']) if (w[k] && src[k]) { x += w[k] * (src[k][i][0] - p[0]); y += w[k] * (src[k][i][1] - p[1]); } return p[2] ? [x, y, 1] : [x, y]; }); }
  function mix2(w, src) { let x = src.N[0], y = src.N[1]; for (const k of ['H', 'A', 'S']) if (w[k]) { x += w[k] * (src[k][0] - src.N[0]); y += w[k] * (src[k][1] - src.N[1]); } return [x, y]; }
  function catPaintBody(w) {
    const mo = w.mo;
    fillPts([[-70, 6], [70, 0], [70, 40], [-70, 40]], mo ? '#7a746a' : CA.ventre);
    for (let i = 0; i < 6; i++) { const x = -58 + i * 20; strokePts([[x - 2, -90], [x + 4, -40], [x + 8, 2]], CA.ray, 5); }
    hatch(null, 0.7, 4, 0.22, 1, M.P.encre, [-100, -100, 100, 60]); shade(0, -40, 0, 30, 0.25, [-100, -100, 100, 60]);
    if (mo) fillPts([[-100, -100], [100, -100], [100, 60], [-100, 60]], 'rgba(30,40,50,0.22)');
  }
  function chatDef(w) {
    const leg = (at, L, base, back, seed) => ({ parent: 'torso', at, pts: w.mo ? spiky(catLeg(L), 3, seed) : catLeg(L), base, seed, noRivet: !!back, paint: () => { fillPts(rect(-12, L - 9, 20, L + 2), back ? '#4a443c' : '#9a9080'); for (const y of [L * 0.3, L * 0.6]) strokePts([[-9, y], [8, y + 2]], CA.ray, 3); } });
    const yg = 60 - w.dy, atF = mix2(w, CAT_AT.av), atB = mix2(w, CAT_AT.ar);
    const LF = Math.max(30, yg - atF[1]), LB = Math.max(30, w.A > 0.5 ? 48 : yg - atB[1]);
    return {
      hipY: -60, handLen: 0, libre: { armF: 1, armB: 1, legF: 1, legB: 1 }, rod: { part: 'torso', at: [-6, 14] }, nom: 'chat',
      parts: {
        torso: { parent: null, at: [0, 0], pts: (p) => (w.mo ? spiky(mixPts(w, CAT_B), 5, 3) : mixPts(w, CAT_B)), base: w.mo ? CA.mouille : CA.poil, seed: 8301, paint: () => catPaintBody(w) },
        queue: { parent: 'torso', at: mix2(w, CAT_AT.queue), noRivet: true, base: w.mo ? CA.mouille : CA.poil, seed: 8302, pts: (p) => {
          const L = mixPts(Object.assign({}, w, { W: w.mo }), CAT_Q), sw = Math.sin((p.t || 0) * 2.2) * 8 * (1 - w.H);
          const line = cbez(L[0], L[1], [L[2][0] + sw * 0.5, L[2][1]], [L[3][0] + sw, L[3][1]], 14);
          const rb = ribbon(line, lerp(14, 30, w.H), lerp(8, 24, w.H));
          return w.H > 0.3 || w.mo ? spiky(rb, lerp(3, 8, w.H), 7) : rb;
        }, paint: () => { for (let i = 0; i < 6; i++) fillPts(ell(0, 0, 1, 1, 4), CA.ray); hatch(null, 1.2, 7, 0.35, 3, '74,68,60', [-160, -160, 100, 80]); } },
        pArL: Object.assign(leg(atB, LB, CA.loin, true, 8303), { rest: 0 }),
        pAvL: Object.assign(leg(atF, LF, CA.loin, true, 8304), {}),
        tete: { parent: 'torso', at: mix2(w, CAT_AT.tete), noRivet: true, base: w.mo ? CA.mouille : CA.poil, seed: 8305, pts: () => {
          let h = w.H > 0.5 ? CAT_HEAD_H : CAT_HEAD;
          if (w.bo) h = h.slice(0, 3).concat([[-6, -40], [-2, -52], [8, -56], [16, -50]], h.slice(4));               // bosse ronde sur le crâne
          return w.mo ? spiky(h, 3.5, 5) : h;
        }, paint: (p) => {
          for (const x of [6, 14, 22]) strokePts([[x, -40], [x + 4, -28]], CA.ray, 3);
          fillPts([[30, -10], [50, -14], [48, 4], [30, 6]], w.mo ? '#7a746a' : CA.ventre);
          const yeux = w.H > 0.5 ? 1.3 : w.mo ? 0.5 : 1;
          fillPts(ell(32, -26, 6, 4.5 * yeux, 10), CA.oeil); fillPts(ell(33, -26, 1.4, 4 * yeux, 6), '#1a1410'); strokePts(ep(32, -26, 6.5, 5 * yeux, 8, PI, TAU), '#1a1410', 1.2);
          fillPts([[47, -18], [51, -16], [48, -12]], CA.nez);
          if (w.H > 0.5) fillPts([[36, -4], [46, -8], [44, 2]], '#6a2a2a'); else strokePts([[46, -10], [42, -6], [36, -6]], '#2a2420', 1.1);
          strokePts([[4, -60], [10, -50]], 'rgba(240,200,190,0.5)', 2);
          hatch(null, 0.6, 3.6, 0.22, 1, M.P.encre, [-20, -70, 60, 20]);
        }, extra: (p) => {
          if (w.bo) {                                                                                                   // pansement croisé ivoire (sans sang)
            for (const a of [0.6, -0.6]) { const c = cx_(); c.save(); c.translate(4, -52); c.rotate(a); pc(rect(-14, -3.5, 14, 3.5), '#efe8d6', () => strokePts([[-12, 0], [12, 0]], 'rgba(150,140,120,0.5)', 0.8), 8310 + a * 10, { drop: false }); c.restore(); }
          }
          if (SIL()) return; const c = cx_();
          c.save(); c.strokeStyle = 'rgba(240,235,220,0.8)'; c.lineWidth = 1 * M._lw();
          for (const [dy, dx] of [[-12, 26], [-8, 30], [-4, 26]]) { c.beginPath(); c.moveTo(44, -10); c.quadraticCurveTo(44 + dx * 0.6, -10 + dy * 0.5, 44 + dx, -10 + dy * 0.3 + 6); c.stroke(); }
          c.restore();
          if (w.mo) { const t = p.t || 0; for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i / 3) % 1; c.save(); c.globalAlpha = 1 - u; c.beginPath(); c.ellipse(20 + i * 10, 10 + u * 40, 2.2, 3.4, 0, 0, TAU); c.fillStyle = '#b9d2dc'; c.fill(); c.restore(); } }
        } },
        pArP: leg(atB, LB, w.mo ? CA.mouille : CA.poil, false, 8306),
        pAvP: leg(atF, LF, w.mo ? CA.mouille : CA.poil, false, 8307),
      },
      order: ['queue', 'pArL', 'pAvL', 'torso', 'tete', 'pArP', 'pAvP'],
    };
  }
  CH.niaChat = chatDef({ H: 0, A: 0, S: 0, mo: 0, bo: 0, dy: 0 });
  NIA.chat = function (pose, x, y, s, o) {
    pose = pose || {}; s = s == null ? 1 : s; o = o || {};
    const wH = ease(clamp(pose.herisse || 0)), wA = ease(clamp(pose.assis || 0)) * (1 - wH), wS = ease(clamp(pose.saute || 0)) * (1 - wH) * (1 - wA);
    const w = { H: wH, A: wA, S: wS, mo: pose.mouille ? 1 : 0, bo: pose.bosse ? 1 : 0, dy: -10 * wH + 12 * wA };
    const def = chatDef(w), q = { t: pose.t, tilt: pose.tilt, dx: pose.dx, dy: (pose.dy || 0) + w.dy, ang: Object.assign({}, pose.ang), hide: pose.hide };
    const A = q.ang;
    if (pose.marche != null && wS < 0.5 && wA < 0.5) { const sn = Math.sin(pose.marche * PI); A.pAvP = (A.pAvP || 0) + 0.32 * sn; A.pArL = (A.pArL || 0) + 0.32 * sn; A.pAvL = (A.pAvL || 0) - 0.32 * sn; A.pArP = (A.pArP || 0) - 0.32 * sn; q.dy -= Math.abs(sn) * 4; A.tete = (A.tete || 0) + 0.04 * sn; }
    if (wA > 0) { A.pArP = (A.pArP || 0) - 1.45 * wA; A.pArL = (A.pArL || 0) - 1.45 * wA; }
    if (wS > 0) { A.pAvP = (A.pAvP || 0) - 1.0 * wS; A.pAvL = (A.pAvL || 0) - 0.85 * wS; A.pArP = (A.pArP || 0) + 1.0 * wS; A.pArL = (A.pArL || 0) + 0.85 * wS; }
    if (wH > 0) A.tete = (A.tete || 0) + 0.12 * wH;
    return M.puppet(def, q, x, y, s, Object.assign({ slot: y + 30, nom: 'chat' }, o));
  };

  // =====================================================================
  // LE TONNEAU (objet emblématique, même fonction partout). Repère : bas-centre, debout ; H 330 (≈ 330 px à s = 1)
  // =====================================================================
  const TO = { H: 330, Rm: 108, Re: 90, ry: 16, chene: '#8a5a32', cheneL: '#a8743f', cheneD: '#5e3c20', fer: '#3b3d40', ferL: '#6a6d70', corde: '#c9b48a' };
  NIA.TO = TO;
  const tonHW = (y) => { const v = (y + TO.H / 2) / (TO.H / 2 - TO.ry); return TO.Re + (TO.Rm - TO.Re) * Math.max(0, 1 - v * v); };
  function tonBody() {
    const o = [], yT = -TO.H + TO.ry, yB = -TO.ry;
    for (let i = 0; i <= 14; i++) { const y = lerp(yB, yT, i / 14); o.push([-tonHW(y), y]); }
    for (let i = 0; i <= 12; i++) { const a = PI - i / 12 * PI; o.push([TO.Re * Math.cos(a), yT + TO.ry * Math.sin(a)]); }
    for (let i = 0; i <= 14; i++) { const y = lerp(yT, yB, i / 14); o.push([tonHW(y), y]); }
    for (let i = 1; i < 12; i++) { const a = i / 12 * PI; o.push([TO.Re * Math.cos(a), yB + TO.ry * Math.sin(a)]); }
    return o;
  }
  const TON_BODY = tonBody();
  const TON_CERCLES = [-34, -100, -230, -296];
  function tonContenu(o, yT) {
    const c = cx_(), it = o.interieur;
    c.save(); c.beginPath(); c.moveTo(-500, -1400); c.lineTo(500, -1400); c.lineTo(500, yT);
    for (let i = 0; i <= 16; i++) { const a = i / 16 * PI; c.lineTo(TO.Re * Math.cos(a), yT + TO.ry * Math.sin(a)); } c.lineTo(-500, yT); c.closePath(); c.clip();
    if (it === 'annie') {
      const io = Object.assign({}, o.interieurO), s = 0.9, fy = 12, hipY = fy - s * 238;
      const T = (X0, Y0) => [X0 / s, (Y0 - hipY) / s];
      const pose = Object.assign({ t: o.t }, io, { ang: Object.assign({}, io.ang), hide: Object.assign({ legF: 1, legB: 1 }, io.hide) });
      const q = annieGestes(pose); armTo(q, 'armF', T(88, yT - 4), 1, AN_SH); armTo(q, 'armB', T(76, yT - 8), 1, AN_SH); q.handF = 'fist'; q.handB = 'fist'; finish(q, AN_SH);
      M.puppet(CH.niaAnnie, q, 0, fy, s, { rod: false, floorShadow: false, dir: 1, nom: 'annie (tonneau)' });
    } else if (it === 'chat') {
      NIA.chat({ assis: 1, t: o.t, bosse: o.chatBosse, mouille: o.mouille }, -6, yT + 84, 1, { rod: false, floorShadow: false });
    } else if (it === 'coussins') {
      c.save(); c.translate(-28, yT - 6); c.rotate(-0.25); drawCoussin({}); c.restore();
      c.save(); c.translate(34, yT - 2); c.rotate(0.3); c.scale(0.8, 0.8); pc([[-46, -20], [0, -26], [46, -20], [50, 0], [46, 20], [0, 24], [-46, 20], [-50, 0]], '#7a3a30', () => hatch(null, 0.8, 4, 0.2, 1, M.P.encre, [-52, -30, 52, 30]), 7310); c.restore();
    } else if (it === 'matelas') {
      pc([[-76, yT + 10], [-70, yT - 16], [-40, yT - 26], [40, yT - 26], [72, yT - 14], [78, yT + 10]], '#e3dcc8', () => { for (let x = -70; x < 80; x += 12) strokePts([[x, yT - 30], [x, yT + 12]], 'rgba(62,88,114,0.6)', 3); }, 7311);
      for (const x of [-50, -10, 30]) dot(x, yT - 12, 2.5, '#3e5872');
    }
    c.restore();
  }
  function drawTonneau(o) {
    const c = cx_(), yT = -TO.H + TO.ry, cv = clamp(o.couvercle || 0), t = o.t || 0, mo = o.mouille;
    const ouvert = cv > 0.02;
    if (ouvert) {                                                                                                  // ouverture : bord arrière + fond sombre
      pc(ell(0, yT, TO.Re, TO.ry, 24), TO.cheneD, () => { fillPts(ell(0, yT + 2, TO.Re - 7, TO.ry - 4, 24), '#24160c'); for (let i = -4; i <= 4; i++) strokePts([[i * 18, yT - 14], [i * 18, yT + 4]], 'rgba(0,0,0,0.4)', 1); }, 7501, { drop: false });
      if (has(o.interieur) && o.interieur !== 'vide') tonContenu(o, yT);
    }
    pc(TON_BODY, TO.chene, () => {
      for (let k = -5; k <= 5; k++) {                                                                              // douelles (suivent le ventre)
        const th = k * 0.27, line = [], hl = [];
        for (let i = 0; i <= 16; i++) { const y = lerp(-TO.ry + 10, yT + 10, i / 16), w = tonHW(y); line.push([w * Math.sin(th), y]); hl.push([w * Math.sin(th + 0.05) + 2, y]); }
        strokePts(line, 'rgba(50,28,12,0.75)', 1.4); strokePts(hl, 'rgba(255,220,170,0.18)', 1.2);
      }
      for (let i = 0; i < 16; i++) {                                                                             // veinures
        const th = (hash(i * 7.3) - 0.5) * 2.4, y0 = -40 - hash(i * 3.1) * 240, L = 30 + hash(i * 5.7) * 50, w = tonHW(y0);
        const x0 = w * Math.sin(th); strokePts([[x0, y0], [x0 + 3, y0 - L * 0.5], [x0 - 1, y0 - L]], 'rgba(60,32,14,0.4)', 0.9);
      }
      if (!ouvert || true) strokePts(ep(0, yT, TO.Re - 2, TO.ry - 1, 16, 0.1, PI - 0.1), 'rgba(255,225,180,0.35)', 3);   // bout des douelles (lèvre avant)
      dot(26, -168, 8, '#3a2412'); dot(26, -168, 5, '#7a5230');                                                       // bonde
      hatch(null, 1.4, 5, 0.18, 1, M.P.encre, [-120, -340, 120, 10]);
      shade(-30, 0, -112, 0, 0.32, [-120, -340, 0, 10]); shade(20, 0, 112, 0, 0.45, [0, -340, 120, 10]);
      if (mo) { fillPts([[-120, -340], [120, -340], [120, 10], [-120, 10]], 'rgba(20,35,50,0.25)'); for (const x of [-56, -20, 40]) strokePts([[x, -300], [x * 1.08, -60]], 'rgba(235,245,255,0.45)', 2.4); }
    }, 7502);
    for (const y of TON_CERCLES) {                                                                               // cerceaux de fer
      const w = tonHW(y) + 2, arc = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * PI; arc.push([w * Math.cos(a), y + TO.ry * 0.85 * Math.sin(a)]); }
      pc(ribbon(arc, 11, 11), TO.fer, () => { strokePts(arc.map((p) => [p[0], p[1] - 3]), 'rgba(255,255,255,0.25)', 1.2); for (const a of [0.5, 1.2, 1.9, 2.6]) dot(w * Math.cos(a) * 0.98, y + TO.ry * 0.85 * Math.sin(a), 1.8, TO.ferL); }, 7510 + y, { drop: false });
    }
    if (o.corde) {                                                                                                 // corde enroulée (harnais) + boucle
      for (const [y0, y1] of [[-150, -200], [-170, -126]]) {
        const L = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * PI, y = lerp(y0, y1, (1 - Math.cos(a)) / 2); L.push([tonHW(y) * Math.cos(a), y + 10 * Math.sin(a)]); }
        pc(ribbon(L, 8, 8), TO.corde, () => { for (let i = 1; i < L.length; i += 1) strokePts([[L[i][0] - 3, L[i][1] - 3], [L[i][0] + 3, L[i][1] + 3]], 'rgba(90,70,40,0.6)', 1); }, 7520 + y0, { drop: false });
      }
      pc(ribbon(qbez([104, -150], [150, -90], [110, -40], 12), 7, 7), TO.corde, null, 7525, { drop: false });
    }
    if (mo && !SIL()) {                                                                                           // gouttes qui glissent
      for (let i = 0; i < 6; i++) { const u = (t * 0.45 + hash(i * 9.1)) % 1, x = (hash(i * 4.3) - 0.5) * 160, y = -300 + u * 300; c.save(); c.globalAlpha = 0.8 * (1 - u * 0.6); c.beginPath(); c.ellipse(x, y, 2.6, 4, 0, 0, TAU); c.fillStyle = '#d6e6ee'; c.fill(); c.restore(); }
    }
    if (o.interieur === 'chat' && ouvert && cv > 0.3) for (const x of [44, 62]) pc(ell(x, yT + 12, 9, 6, 10), CA.poil, () => strokePts([[x - 3, yT + 14], [x - 3, yT + 18]], CA.ray, 1), 7530 + x, { drop: false });
    // couvercle : 0 fermé, s'ôte (se soulève) puis se pose debout contre le flanc (côté o.couvercleCote, 1 = devant le regard)
    const lid = (cxl, cyl, rot) => { c.save(); c.translate(cxl, cyl); c.rotate(rot);
      pc(ell(0, 4, TO.Re + 3, TO.ry + 2, 24), TO.cheneD, null, 7540, { drop: rot !== 0 });
      pc(ell(0, 0, TO.Re + 3, TO.ry + 2, 24), TO.cheneL, () => { for (const x of [-46, -14, 18, 50]) strokePts([[x, -TO.ry], [x + 4, TO.ry]], 'rgba(60,32,14,0.5)', 1.2); dot(30, -2, 4, '#3a2412'); hatch(null, 0.2, 5, 0.15); }, 7541, { drop: false });
      c.restore(); };
    if (cv < 0.02) lid(0, yT - 2, 0);
    else if (cv < 0.999 || o.couvercleVu !== false) {
      const sd = o.couvercleCote || 1, u1 = ease(clamp(cv / 0.4)), u2 = ease(clamp((cv - 0.4) / 0.6));
      lid(sd * lerp(0, TO.Rm + 24, u2), lerp(yT - 2 - 70 * u1, -100, u2), sd * lerp(0, -1.38, u2));
    }
  }
  // fond du tonneau vu en bout (pour rouler en travers de la scène) ; repère : centre
  function drawBout(o) {
    pc(ell(0, 0, TO.Rm, TO.Rm, 32), TO.cheneD, () => { for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; strokePts([[Math.cos(a) * 92, Math.sin(a) * 92], [Math.cos(a) * 108, Math.sin(a) * 108]], 'rgba(20,10,5,0.6)', 1.3); } }, 7601);
    pc(ribbon(ep(0, 0, 100, 100, 40, 0, TAU), 9, 9), TO.fer, null, 7602, { drop: false });
    pc(ell(0, 0, 90, 90, 32), TO.cheneL, () => {
      for (const y of [-54, -18, 18, 54]) strokePts([[-90, y], [90, y]], 'rgba(60,32,14,0.6)', 1.4);
      for (let i = 0; i < 8; i++) strokePts([[-80 + i * 20, -70 + hash(i) * 30], [-70 + i * 20, -40 + hash(i + 3) * 40]], 'rgba(60,32,14,0.3)', 0.9);
      dot(0, -64, 9, '#3a2412'); dot(0, -64, 5.5, '#7a5230'); hatch(null, 0.3, 5, 0.16); shade(-60, -60, 70, 70, 0.3, [-95, -95, 95, 95]);
      if (o.mouille) fillPts(ell(0, 0, 92, 92, 20), 'rgba(20,35,50,0.22)');
    }, 7603);
  }
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, fn, x, y, s, o) {
    o = o || {};
    return M.puppet(accDef(name, fn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha, nom: name });
  }
  const tonHalf = (o) => (o.sens === 'couche' || o.sens === 'bout' ? TO.Rm : TO.H / 2);
  function tonMat(o) { const m = new DOMMatrix().translate(0, -tonHalf(o)).rotate(((o.roule || 0) + (o.sens === 'couche' ? PI / 2 : 0)) * D); return o.sens === 'bout' ? m : m.translate(0, TO.H / 2); }
  NIA.tonneau = function (x, y, s, o) {
    o = Object.assign({}, o); s = s == null ? 1 : s;
    return acc('tonneau', (oo) => { const c = cx_(); c.save(); const m = tonMat(oo); c.transform(m.a, m.b, m.c, m.d, m.e, m.f); if (oo.sens === 'bout') drawBout(oo); else drawTonneau(oo); c.restore(); }, x, y, s, Object.assign(o, { rot: 0, t: o.t }));
  };
  // point nommé du tonneau à l'écran : 'haut' (centre de l'ouverture), 'centre', 'bas', 'bonde', 'flancAvant' (flanc à mi-hauteur côté +x local)
  NIA.tonneauPt = function (x, y, s, o, nom) {
    o = o || {}; s = s == null ? 1 : s; const dir = o.dir || 1;
    const L = { haut: [0, -TO.H + TO.ry], centre: [0, -TO.H / 2], bas: [0, 0], bonde: [26, -168], flancAvant: [TO.Rm, -TO.H / 2] }[nom] || [0, 0];
    const m = new DOMMatrix().translate(x, y).scale(s * dir, s).multiply(tonMat(o));
    const pl = o.sens === 'bout' ? (nom === 'bonde' ? [0, -64] : [0, 0]) : L;
    return mp(m, pl);
  };

  // ---------------- bourse, mite, photo, coussin, pompe (accessoires seuls)
  NIA.bourse = (x, y, s, o) => acc('bourse', (oo) => { const c = cx_(); c.save(); c.translate(0, -84); drawBourse(oo); c.restore(); }, x, y, s == null ? 1.4 : s, o);
  NIA.photo = (x, y, s, o) => acc('photo', (oo) => { const c = cx_(); c.save(); c.translate(0, -52); drawPhoto(oo); c.restore(); }, x, y, s == null ? 1 : s, o);
  NIA.coussin = (x, y, s, o) => acc('coussin', (oo) => { const c = cx_(); c.save(); c.translate(0, -26); drawCoussin(oo); c.restore(); }, x, y, s == null ? 1 : s, o);
  // mite beige qui s'envole en zigzag à partir de t0 depuis (x,y) (ex. NIA.pt(r,'bouche')) ; o : { dir=1, dur=5 (s avant de disparaître), haut=260 }
  NIA.mite = function (t, x, y, s, t0, o) {
    o = o || {}; s = s == null ? 1 : s; const u = t - (t0 || 0); if (u < 0 || SIL()) return;
    const dir = o.dir || 1, dur = o.dur || 5, haut = o.haut || 260, e = Math.min(1, u / 0.6);
    const px = x + dir * (55 * u + 22 * Math.sin(u * 6.5) * e) * s, py = y - (haut / dur * u * 1.0 + 16 * Math.sin(u * 9.3) * e) * s;
    const a = Math.min(1, u / 0.15, Math.max(0, (dur - u) / 0.6)); if (a <= 0) return;
    const c = cx_(), fl = Math.abs(Math.sin(u * 34));
    c.save(); c.globalAlpha = a; c.translate(px, py); c.scale(s * dir, s); c.rotate(0.25 * Math.sin(u * 6.5));
    for (const [sg, col] of [[-1, '#b9ab88'], [1, '#d9cba6']]) {
      c.save(); c.scale(1, sg < 0 ? 0.55 + 0.45 * fl : 0.35 + 0.65 * fl);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-12, -16, -20, -6); c.quadraticCurveTo(-12, 2, 0, 0); c.moveTo(0, 0); c.quadraticCurveTo(8, -18, 16, -10); c.quadraticCurveTo(10, 0, 0, 0);
      c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(90,75,50,0.7)'; c.lineWidth = 0.9; c.stroke(); c.restore();
    }
    c.beginPath(); c.ellipse(0, 0, 9, 3.2, -0.15, 0, TAU); c.fillStyle = '#a89878'; c.fill();
    c.strokeStyle = 'rgba(80,65,45,0.8)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(8, -1); c.quadraticCurveTo(13, -8, 16, -9); c.moveTo(8, 0); c.quadraticCurveTo(14, -5, 17, -4); c.stroke();
    c.restore();
  };
  // pompe à pied 1900 (laiton), repère : bas-centre ; piston 0 (poignée basse, 160 de haut) … 1 (tirée, 222) ; o.tuyau = [X,Y] écran (bout du tuyau noir)
  function drawPompe(o) {
    const pi = clamp(o.piston == null ? 0 : o.piston), yh = -152 - 62 * pi;
    pc(rect(-3, yh, 3, -122), '#9aa0a4', () => strokePts([[-1, yh], [-1, -122]], 'rgba(255,255,255,0.5)', 1), 7701);
    pc([[-44, yh - 7], [44, yh - 7], [48, yh], [44, yh + 7], [-44, yh + 7], [-48, yh]], '#7a4e2a', () => { strokePts([[-40, yh - 3], [40, yh - 3]], 'rgba(255,220,170,0.35)', 1.4); hatch(null, 0.2, 4, 0.2); }, 7702);
    pc([[-15, -12], [15, -12], [15, -118], [10, -124], [-10, -124], [-15, -118]], '#b08d45', () => {
      fillPts(rect(-9, -116, -4, -16), 'rgba(255,240,190,0.45)'); for (const y of [-30, -104]) fillPts(rect(-16, y - 3, 16, y + 3), '#8a6a30');
      shade(-15, 0, 15, 0, 0.35, [-16, -126, 16, -10]);
    }, 7703);
    pc(rect(-18, -132, 18, -122), '#76592a', null, 7704);
    pc([[-44, 0, 1], [44, 0, 1], [44, -7], [18, -14], [-18, -14], [-44, -7]], '#3b3d40', () => { strokePts([[-40, -5], [40, -5]], 'rgba(255,255,255,0.2)', 1); }, 7705);
    for (const sx of [-1, 1]) pc(rect(sx * 30 - 12, -10, sx * 30 + 12, -4), '#5a5e64', null, 7706 + sx, { drop: false });
    pc(ell(18, -12, 5, 5, 10), '#76592a', null, 7708, { drop: false });
  }
  NIA.POMPE = { poignee: (pi) => [0, -152 - 62 * clamp(pi || 0)], embout: [22, -12] };
  NIA.pompe = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const dir = o.dir || 1;
    const r = acc('pompe', drawPompe, x, y, s, o);
    const e = [x + dir * 22 * s, y - 12 * s], f = o.tuyau || [x + dir * 120 * s, y - 4 * s];
    if (!SIL()) {
      const c = cx_(); c.save(); c.lineCap = 'round';
      const cxm = (e[0] + f[0]) / 2 + dir * 30 * s, cym = Math.max(e[1], f[1]) + 30 * s;
      for (const [w, col] of [[8, '#0e0e10'], [5, '#2a2a2e'], [1.5, 'rgba(255,255,255,0.25)']]) { c.beginPath(); c.moveTo(e[0], e[1]); c.quadraticCurveTo(cxm, cym, f[0], f[1]); c.strokeStyle = col; c.lineWidth = w * s; c.stroke(); }
      c.beginPath(); c.arc(f[0], f[1], 4 * s, 0, TAU); c.fillStyle = '#b08d45'; c.fill(); c.restore();
    }
    return r;
  };
  NIA.pompePt = function (x, y, s, o, nom) { o = o || {}; s = s == null ? 1 : s; const dir = o.dir || 1, p = nom === 'embout' ? NIA.POMPE.embout : NIA.POMPE.poignee(o.piston); return [x + dir * p[0] * s, y + p[1] * s]; };

  // =====================================================================
  // DÉCORS — pré-rendus par NIA.init() ; chaque fonction dessine fond → animations → plan intermédiaire → premier plan, décalée de `up`
  // =====================================================================
  const BACK = M.ST.back;
  const layer = (fn) => M.pre(1080, 1400, fn);
  function feuille(c, x, y, s, rot, col) {                                        // feuille d'érable rousse (dessin brut)
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.beginPath();
    const pts = [[0, -12], [3, -6], [9, -9], [7, -2], [13, 0], [6, 3], [7, 9], [1, 5], [0, 12], [-1, 5], [-7, 9], [-6, 3], [-13, 0], [-7, -2], [-9, -9], [-3, -6]];
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(60,25,10,0.6)'; c.lineWidth = 0.8; c.stroke(); c.restore();
  }
  function feuillage(c, cx, cy, rx, ry, n, cols, seed) {
    const R = M.rng(seed);
    for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, r = 14 + R() * 26; blob(c, x + 3, y + 4, r, 'rgba(40,20,10,0.25)'); blob(c, x, y, r, cols[Math.floor(R() * cols.length)]); }
    for (let i = 0; i < n / 2; i++) { const a = R() * TAU, d = Math.sqrt(R()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d; feuille(c, x, y, 0.9 + R() * 0.6, R() * TAU, cols[Math.floor(R() * cols.length)]); }
  }
  function lanterne(c, x, y, s) {                                                 // lanterne de batelier (pendue en x,y = anneau)
    c.save(); c.translate(x, y); c.scale(s, s);
    pc(ell(0, 4, 5, 5, 8), '#2a2624', null, 9001, { drop: false });
    pc([[-14, 10], [14, 10], [18, 20], [14, 60], [-14, 60], [-18, 20]], '#3a3634', () => { fillPts(rect(-11, 22, 11, 56), 'rgba(255,214,140,0.6)'); for (const xx of [-5, 5]) fillPts(rect(xx - 1.2, 22, xx + 1.2, 56), '#3a3634'); }, 9002);
    pc([[-20, 60], [20, 60], [14, 68], [-14, 68]], '#2a2624', null, 9003, { drop: false });
    c.restore();
  }

  // ---------------------------------------------------------------- SALON D'ANNIE (Michigan, automne 1901)
  const WIN = { x0: 140, y0: 430, x1: 300, y1: 790 };
  const SALON = { fenetre: WIN, table: { x: 420, y: 1168, rx: 106 }, poele: { x: 196, y: 1160 }, lampe: { x: 560, y: 650 }, tableau: { x: 880, y: 760 } };
  NIA.SALON = SALON;
  function salonVue() { return layer((c) => {
    gradRect(c, WIN.x0, WIN.y0, WIN.x1, WIN.y1, [[0, '#aebfc6'], [0.6, '#dcd6c2'], [1, '#e9dcbc']]);
    c.fillStyle = '#9aa486'; c.beginPath(); c.moveTo(WIN.x0, 720); c.quadraticCurveTo(220, 690, WIN.x1, 712); c.lineTo(WIN.x1, WIN.y1); c.lineTo(WIN.x0, WIN.y1); c.fill();
    c.fillStyle = '#b39a5e'; c.fillRect(WIN.x0, 752, WIN.x1 - WIN.x0, 40);
    for (let x = WIN.x0; x < WIN.x1; x += 16) { c.fillStyle = '#e4dccb'; c.fillRect(x, 738, 5, 30); } c.fillRect(WIN.x0, 744, WIN.x1 - WIN.x0, 4);   // barrière blanche
    c.fillStyle = '#4a3222'; c.beginPath(); c.moveTo(244, 760); c.lineTo(252, 600); c.lineTo(262, 600); c.lineTo(266, 760); c.fill();
    feuillage(c, 236, 540, 90, 100, 26, ['#9b3a22', '#b5522a', '#c27a2e', '#8a2e1c'], 41);
  }); }
  function salonFond() { return layer((c) => {
    gradRect(c, 0, 0, 1080, 1124, [[0, '#56614a'], [0.5, '#6c7758'], [1, '#626c50']]);
    for (let x = 0; x < 1080; x += 88) { c.fillStyle = 'rgba(255,240,200,0.045)'; c.fillRect(x, 300, 44, 820); }
    for (let y = 320, r = 0; y < 1100; y += 46, r++) for (let x = (r % 2) * 22; x < 1080; x += 44) {             // papier peint à petites fleurs ocre
      c.save(); c.globalAlpha = 0.5; for (let k = 0; k < 4; k++) { const a = k * PI / 2 + 0.4; c.beginPath(); c.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3.4, 2.2, a, 0, TAU); c.fillStyle = '#b4934e'; c.fill(); }
      c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fillStyle = '#7a3a28'; c.fill(); c.restore();
    }
    pc(rect(-10, 266, 1090, 304), '#7d6f52', () => { strokePts([[0, 282], [1080, 282]], 'rgba(255,240,200,0.3)', 2); strokePts([[0, 296], [1080, 296]], 'rgba(40,25,10,0.4)', 1.5); }, 9101);
    pc(rect(-10, 1104, 1090, 1124), '#5a3d24', () => strokePts([[0, 1108], [1080, 1108]], 'rgba(255,220,170,0.35)', 1.5), 9102);
    pc(rect(-10, 1124, 1090, 1410), '#6b4a2c', () => {
      for (let x = 20; x < 1080; x += 130) { strokePts([[x, 1150], [x + 110, 1150], [x + 110, 1370], [x, 1370], [x, 1150]], 'rgba(30,18,8,0.5)', 1.6); strokePts([[x + 2, 1152], [x + 108, 1152]], 'rgba(255,220,170,0.25)', 1.2); }
      hatch(null, 0.15, 6, 0.15, 1, M.P.encre, [0, 1124, 1080, 1400]);
    }, 9103);
    // fenêtre à petits carreaux : trou, chambranle, croisillons, appui, pot de géranium
    pc(rect(WIN.x0 - 16, WIN.y0 - 16, WIN.x1 + 16, WIN.y1 + 16), '#d9cfb6', () => strokePts([[WIN.x0 - 10, WIN.y0 - 10], [WIN.x1 + 10, WIN.y0 - 10]], 'rgba(255,255,255,0.4)', 1.5), 9104);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); c.restore();
    for (let i = 1; i < 3; i++) pc(rect(lerp(WIN.x0, WIN.x1, i / 3) - 3, WIN.y0, lerp(WIN.x0, WIN.x1, i / 3) + 3, WIN.y1), '#d9cfb6', null, 9105 + i, { drop: false });
    for (let j = 1; j < 4; j++) pc(rect(WIN.x0, lerp(WIN.y0, WIN.y1, j / 4) - 3, WIN.x1, lerp(WIN.y0, WIN.y1, j / 4) + 3), '#d9cfb6', null, 9108 + j, { drop: false });
    pc(rect(WIN.x0 - 28, WIN.y1 + 10, WIN.x1 + 28, WIN.y1 + 28), '#cfc4a8', () => strokePts([[WIN.x0 - 24, WIN.y1 + 13], [WIN.x1 + 24, WIN.y1 + 13]], 'rgba(255,255,255,0.4)', 1.2), 9112);
    pc([[200, WIN.y1 + 10], [244, WIN.y1 + 10], [238, WIN.y1 - 30], [206, WIN.y1 - 30]], '#a8583a', () => strokePts([[204, WIN.y1 - 24], [240, WIN.y1 - 24]], 'rgba(255,220,180,0.4)', 2), 9113);
    for (const [x, y, r] of [[208, 742, 14], [236, 738, 15], [222, 726, 13], [196, 728, 10], [250, 726, 10]]) pc(ell(x, y, r, r * 0.8, 10), '#4f6a3c', () => strokePts([[x - r * 0.5, y], [x + r * 0.5, y - 2]], 'rgba(30,50,20,0.5)', 1), 9114 + x, { drop: false });
    for (const [x, y] of [[214, 712], [238, 716], [226, 704]]) { blob(c, x, y, 6, '#9b2d24'); blob(c, x - 1, y - 1, 2.5, '#c95a48'); }
    // portrait du mari défunt : cadre ovale doré, crêpe noir en travers
    strokePts([[420, 412], [384, 440]], '#3a2a1c', 1.4); strokePts([[420, 412], [456, 440]], '#3a2a1c', 1.4); dot(420, 410, 3, '#8a6a30');
    pc(ell(420, 510, 58, 74, 28), '#b08d45', () => { strokePts(ep(420, 510, 52, 68, 28, 0, TAU), 'rgba(255,230,160,0.5)', 1.5); hatch(null, 0.8, 4, 0.18); }, 9120);
    pc(ell(420, 510, 46, 62, 28), '#b9a888', () => {
      gradRect(c, 370, 446, 470, 574, [[0, '#c6b694'], [1, '#9e8c6a']]);
      fillPts([[380, 580], [384, 548], [400, 536], [440, 536], [456, 548], [460, 580]], '#2e2620');                       // épaules
      fillPts(ell(420, 502, 21, 26, 16), '#cdb698'); fillPts([[399, 494], [402, 478], [420, 472], [440, 478], [442, 494], [434, 484], [420, 486], [406, 486]], '#5a4a3a');   // tête, cheveux
      fillPts([[402, 510], [438, 510], [436, 530], [420, 540], [404, 530]], '#6a5848'); dot(412, 499, 1.8, '#2e2620'); dot(428, 499, 1.8, '#2e2620');   // barbe, yeux
      strokePts([[410, 512], [420, 509], [430, 512]], '#3e3228', 1.6);
    }, 9121);
    pc([[372, 470], [392, 446], [420, 438], [448, 446], [468, 470], [452, 466], [420, 452], [388, 466]], '#141216', () => hatch(null, 0.9, 3, 0.25), 9122);   // crêpe noir drapé
    for (const sx of [-1, 1]) pc([[420 + sx * 50, 462], [420 + sx * 58, 470], [420 + sx * 64, 536], [420 + sx * 54, 540]], '#141216', null, 9124 + sx, { drop: false });
    pc([[404, 428], [420, 442], [436, 428], [440, 450], [420, 448], [400, 450]], '#141216', null, 9123);
    // étagère : globe terrestre, pile de factures (lignes ondulées), boîte à couture
    pc(rect(760, 640, 950, 654), '#5a3d24', () => strokePts([[762, 642], [948, 642]], 'rgba(255,220,170,0.35)', 1.2), 9130);
    for (const x of [780, 930]) pc([[x - 6, 654], [x + 6, 654], [x + 2, 690], [x - 2, 690]], '#4a3220', null, 9131 + x, { drop: false });
    pc([[786, 640], [814, 640], [808, 630], [792, 630]], '#76592a', null, 9133);
    pc(ell(800, 598, 30, 30, 20), '#5f7d84', () => { fillPts([[784, 584], [796, 578], [806, 590], [798, 606], [786, 600]], '#b49a5e'); fillPts([[806, 604], [818, 596], [824, 612], [812, 620]], '#b49a5e'); strokePts(ep(800, 598, 30, 10, 16, 0, PI), 'rgba(255,255,255,0.25)', 1); shade(780, 580, 826, 620, 0.35, [768, 566, 832, 630]); }, 9134);
    strokePts(ep(800, 598, 36, 36, 16, 2.4, 5.6), '#b08d45', 2.4);
    for (let i = 0; i < 6; i++) pc(rect(846 + i * 1.5, 632 - i * 6, 896 + i * 1.5, 638 - i * 6), i % 2 ? '#e6dcc4' : '#d9cdb0', () => { const y = 635 - i * 6; strokePts([[850, y], [860, y - 1], [870, y + 1], [880, y - 1], [890, y]], 'rgba(60,50,40,0.5)', 0.8); }, 9140 + i, { drop: false });
    pc([[852, 590], [892, 584], [896, 596], [856, 600]], '#ece4d0', () => { for (const y of [590, 594]) strokePts([[856, y + 1], [866, y], [876, y + 2], [890, y - 1]], 'rgba(60,50,40,0.5)', 0.8); }, 9147);
    pc(rect(904, 612, 946, 640), '#7a3a30', () => { fillPts(rect(904, 612, 946, 618), '#5a2a22'); dot(925, 626, 3, '#b08d45'); }, 9150);
    for (const [x, col] of [[912, '#c9b48a'], [922, '#3e5872'], [934, '#9b2d24']]) pc(rect(x - 4, 598, x + 4, 612), col, () => fillPts(rect(x - 5, 598, x + 5, 600), '#e6dcc4'), 9151 + x, { drop: false });
    gradRect(c, 0, 300, 1080, 420, [[0, 'rgba(30,20,10,0.35)'], [1, 'rgba(30,20,10,0)']]);
    gradRect(c, 0, 0, 160, 1400, [[0, 'rgba(30,20,10,0.35)'], [1, 'rgba(30,20,10,0)']], true);
    gradRect(c, 920, 0, 1080, 1400, [[0, 'rgba(30,20,10,0)'], [1, 'rgba(30,20,10,0.35)']], true);
  }); }
  function salonMilieu() { return layer((c) => {
    // poêle en fonte, tuyau qui entre dans le mur, bouilloire
    pc(rect(168, 920, 186, 1160), '#2a2a2e', () => { for (const y of [1000, 1080]) strokePts([[168, y], [186, y]], 'rgba(255,255,255,0.2)', 1.5); }, 9201);
    pc(ell(177, 920, 20, 20, 14), '#3b3d40', () => dot(177, 920, 9, '#1a1a1c'), 9202, { drop: false });
    pc([[148, 1160], [246, 1160], [252, 1170], [142, 1170]], '#2a2a2e', null, 9203);
    pc([[152, 1170], [242, 1170], [238, 1310], [156, 1310]], '#232326', () => { fillPts(rect(176, 1250, 222, 1290), '#120c0a'); for (let x = 180; x < 222; x += 8) strokePts([[x, 1250], [x, 1290]], '#3b3d40', 2); strokePts([[160, 1180], [160, 1300]], 'rgba(255,255,255,0.15)', 2); hatch(null, 0.8, 4, 0.2); }, 9204);
    for (const x of [160, 234]) pc([[x - 6, 1310], [x + 6, 1310], [x + 10, 1395], [x - 2, 1395]], '#1c1c1e', null, 9205 + x, { drop: false });
    pc([[184, 1158], [180, 1128], [190, 1114], [218, 1112], [228, 1126], [226, 1158]], '#5a5e64', () => { strokePts([[188, 1126], [220, 1124]], 'rgba(255,255,255,0.3)', 1.5); shade(184, 0, 228, 0, 0.3, [176, 1100, 232, 1160]); }, 9208);
    pc([[224, 1132], [238, 1120], [246, 1114], [244, 1122], [230, 1140]], '#5a5e64', null, 9209, { drop: false });
    strokePts(ep(204, 1110, 14, 14, 10, PI, TAU), '#2a2a2e', 2.4);
    // parapluie dans son porte-parapluie
    pc(ell(272, 1236, 6, 10, 10), '#3a2a1c', null, 9210, { drop: false });
    pc([[262, 1240], [282, 1240], [286, 1340], [258, 1340]], '#2e3a4a', () => { for (const x of [266, 272, 278]) strokePts([[x, 1244], [x - 2, 1336]], 'rgba(0,0,0,0.35)', 1); }, 9211);
    pc([[254, 1330], [290, 1330], [292, 1395], [252, 1395]], '#7a5a3a', () => { strokePts([[254, 1350], [292, 1350]], '#b08d45', 2); }, 9212);
    // commode (boîte à couture dessus)
    pc(rect(812, 1210, 960, 1395), '#3e2416', () => {
      for (const y of [1240, 1290, 1340]) { strokePts([[818, y], [954, y], [954, y + 44], [818, y + 44], [818, y]], 'rgba(30,18,8,0.6)', 1.4); for (const x of [850, 922]) dot(x, y + 22, 3.5, '#b08d45'); }
      hatch(null, 0.2, 5, 0.16);
    }, 9220);
    pc(rect(804, 1200, 968, 1212), '#7a5434', () => strokePts([[806, 1202], [966, 1202]], 'rgba(255,220,170,0.4)', 1.2), 9221);
    pc([[826, 1200], [870, 1200], [872, 1190], [824, 1190]], '#e6dcc4', () => { for (let x = 828; x < 870; x += 6) dot(x, 1200, 2, '#e6dcc4'); }, 9222, { drop: false });
    pc(rect(892, 1170, 950, 1200), '#7a5a3a', () => { fillPts(rect(892, 1170, 950, 1176), '#5a3d24'); for (const [x, col] of [[904, '#c9b48a'], [918, '#3e5872'], [934, '#9b2d24']]) dot(x, 1188, 5, col); }, 9223);
    // tableau noir d'école sur chevalet : maison, pomme, soleil à la craie
    for (const [a, b] of [[[880, 700], [812, 1395]], [[880, 700], [948, 1395]], [[884, 700], [892, 1395]]]) pc(ribbon([a, b], 9, 9), '#6b4a2c', null, 9230 + b[0], {});
    pc(rect(800, 760, 960, 950), '#7a5434', null, 9234);
    pc(rect(808, 768, 952, 942), '#2f3a34', () => {
      const ch = 'rgba(235,232,220,0.85)';
      strokePts([[826, 900], [826, 860], [866, 860], [866, 900], [826, 900]], ch, 2); strokePts([[820, 862], [846, 836], [872, 862]], ch, 2); strokePts([[840, 900], [840, 880], [852, 880], [852, 900]], ch, 1.6);
      strokePts(ep(906, 892, 16, 15, 16, 0, TAU), 'rgba(220,120,110,0.85)', 2); strokePts([[906, 877], [908, 868]], ch, 1.6); strokePts([[909, 870], [918, 864], [914, 874]], 'rgba(150,200,140,0.85)', 1.6);
      strokePts(ep(910, 806, 13, 13, 14, 0, TAU), 'rgba(240,215,120,0.9)', 2); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; strokePts([[910 + Math.cos(a) * 18, 806 + Math.sin(a) * 18], [910 + Math.cos(a) * 26, 806 + Math.sin(a) * 26]], 'rgba(240,215,120,0.9)', 1.6); }
      for (let i = 0; i < 20; i++) strokePts([[812 + hash(i) * 130, 772 + hash(i + 9) * 160], [826 + hash(i) * 130, 776 + hash(i + 9) * 160]], 'rgba(235,232,220,0.08)', 4);
    }, 9235);
    pc(rect(800, 950, 960, 960), '#6b4a2c', null, 9236); pc(rect(820, 944, 836, 950), '#ece8dc', null, 9237, { drop: false }); pc(rect(926, 940, 948, 950), '#8a8270', null, 9238, { drop: false });
    // lampe à pétrole suspendue (monture de laiton, abat-jour opaline, verre, réservoir)
    for (let y = 268; y < 594; y += 12) strokePts(ell(560, y + 6, 2.4, 6, 8).concat([[562.4, y + 6]]), '#76592a', 1.6);
    pc([[530, 594], [590, 594], [596, 602], [524, 602]], '#b08d45', null, 9240);
    pc([[524, 602], [596, 602], [624, 636], [496, 636]], '#ece4d0', () => { strokePts([[504, 630], [616, 630]], 'rgba(176,141,69,0.7)', 2); shade(496, 0, 624, 0, 0.25, [490, 596, 630, 640]); }, 9241);
    pc([[550, 636], [570, 636], [574, 660], [546, 660]], 'rgba(220,235,240,0.5)', null, 9242, { drop: false, texA: 0.1 });
    pc([[536, 660], [584, 660], [592, 676], [580, 692], [540, 692], [528, 676]], '#b08d45', () => { strokePts([[540, 668], [560, 664]], 'rgba(255,240,190,0.6)', 2); shade(528, 0, 592, 0, 0.3, [524, 656, 596, 696]); }, 9243);
    pc(ell(560, 698, 8, 8, 10), '#76592a', null, 9244, { drop: false });
  }); }
  function salonTable() { return layer((c) => {
    // chaise cannée à barreaux (derrière la table, à gauche)
    pc([[300, 1060], [318, 1060], [322, 1250], [304, 1250]], '#5a3d24', null, 9301);
    pc([[300, 1070], [312, 1066], [318, 1110], [306, 1112]], '#6b4a2c', null, 9302, { drop: false });
    for (const y of [1120, 1160, 1200]) pc(rect(306, y, 352, y + 6), '#5a3d24', null, 9303 + y, { drop: false });
    pc([[292, 1240], [380, 1240], [384, 1254], [288, 1254]], '#6b4a2c', null, 9306);
    for (const x of [296, 376]) pc([[x - 4, 1254], [x + 4, 1254], [x + 3, 1395], [x - 3, 1395]], '#5a3d24', null, 9307 + x, { drop: false });
    // table ronde à nappe (dentelle festonnée), pied central
    pc([[404, 1290], [436, 1290], [444, 1370], [470, 1386], [470, 1395], [370, 1395], [370, 1386], [396, 1370]], '#4a3220', null, 9310);
    const T = SALON.table, pts = [[T.x - T.rx, T.y]];
    for (let i = 0; i <= 16; i++) { const x = lerp(T.x - T.rx - 6, T.x + T.rx + 6, i / 16); pts.push([x, 1300 + (i % 2 ? 10 : 0), i % 2 ? 0 : 1]); }
    pts.push([T.x + T.rx, T.y]);
    pc(pts, '#e8e0cc', () => { for (let i = 0; i < 9; i++) strokePts([[T.x - 90 + i * 22, T.y + 8], [T.x - 100 + i * 25, 1298]], 'rgba(150,135,110,0.35)', 1.2); for (let i = 0; i < 16; i++) dot(T.x - T.rx + i * 14, 1290, 3, 'rgba(150,135,110,0.4)'); hatch(null, 0.8, 4, 0.12); shade(T.x - 120, 0, T.x + 120, 0, 0.3, [T.x - 130, T.y - 20, T.x + 130, 1320]); }, 9311);
    pc(ell(T.x, T.y, T.rx + 4, 14, 24), '#efe8d6', () => strokePts(ep(T.x, T.y, T.rx - 10, 9, 20, 0, TAU), 'rgba(150,135,110,0.4)', 1), 9312, { drop: false });
  }); }
  NIA.salon = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), K = NIA.K, g = M.tg(t);
    c.save(); c.translate(0, -up);
    c.save(); c.beginPath(); c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); c.clip();
    c.drawImage(K.salonVue, 0, 0);
    const nx = WIN.x0 - 70 + ((g * 6) % 300); c.save(); c.globalAlpha = 0.8; for (const [dx, dy, r] of [[0, 0, 16], [16, -8, 20], [34, 0, 14]]) blob(c, nx + dx, 470 + dy, r, '#f1ebdc'); c.restore();
    for (let i = 0; i < 2; i++) { const per = 7, u = ((g + i * 3.5) % per) / per, fx = 200 + 50 * Math.sin(u * 7 + i) + 40 * u, fy = 600 + u * 190; feuille(c, fx, fy, 0.7, u * 9 + i, i ? '#c27a2e' : '#b5522a'); }
    if (o.feuilleT0 != null && t > o.feuilleT0) { const u = Math.min(1, (t - o.feuilleT0) / 3.2); feuille(c, 236 + 30 * Math.sin(u * 8) + 20 * u, 540 + u * 250, 1.1, u * 12, '#9b3a22'); }
    c.restore();
    c.drawImage(K.salonFond, 0, 0);
    const gust = o.ventT0 != null && t > o.ventT0 ? 30 * Math.exp(-1.6 * (t - o.ventT0)) * Math.min(1, (t - o.ventT0) / 0.3) : 0;
    M.voilage(t, { x: WIN.x0 - 8, y: WIN.y0 - 6, w: 46, h: 300 + gust * 0.5, amp: 5 + gust, cote: 1 });
    M.voilage(t + 0.7, { x: WIN.x1 - 38, y: WIN.y0 - 6, w: 46, h: 300 + gust * 0.5, amp: 5 + gust, cote: -1 });
    M.pendule(t, { x: 650, y: 330, s: 0.82, per: 2 });
    c.drawImage(K.salonMilieu, 0, 0);
    const fl = 0.5 + 0.5 * Math.sin(g * 9) * Math.sin(g * 5.3); c.save(); c.globalAlpha = 0.55 + 0.35 * fl; c.fillStyle = '#e07a2a'; c.fillRect(178, 1256, 42, 30); c.restore();
    M.fumee(t, { x: 248, y: 1110, s: 0.45, n: 5, haut: 200, vent: 40, col: '#e8e2d6', a: 0.6, per: 3.4, seed: 7 });
    M.flamme(t, { x: 560, y: 656, s: 0.42, r: 170, seed: 3 });
    if (!SIL()) {                                                                                                // rayon de la fenêtre + poussière
      const poly = [[WIN.x0 + 20, WIN.y0 + 40], [WIN.x1, WIN.y0 + 10], [640, BACK], [330, BACK]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      const gr = c.createLinearGradient(0, WIN.y0, 0, BACK); gr.addColorStop(0, 'rgba(255,236,200,0.13)'); gr.addColorStop(1, 'rgba(255,236,200,0.02)'); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: 200, y: WIN.y0 + 40, w: 420, h: BACK - WIN.y0 - 40, n: 40, a: 0.7, seed: 21 });
      c.restore();
    }
    if (o.table !== false) c.drawImage(K.salonTable, 0, 0);
    c.restore();
  };
  // tapis élimé et panier à ouvrage, sur le plancher : à dessiner APRÈS M.drawFloor(), avant les marionnettes
  NIA.salonSol = function (t, o) {
    o = o || {}; const c = cx_();
    pc(ell(520, 1428, 320, 24, 30), '#7a3a30', () => {
      strokePts(ep(520, 1428, 290, 18, 30, 0, TAU), 'rgba(200,170,110,0.6)', 2); strokePts(ep(520, 1428, 200, 12, 24, 0, TAU), 'rgba(200,170,110,0.4)', 1.5);
      for (const [x, w] of [[420, 60], [640, 40]]) fillPts(ell(x, 1430, w, 7, 12), 'rgba(160,120,90,0.45)');
      hatch(null, 0.1, 4, 0.18);
    }, 9401, { drop: false });
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, x = 520 + Math.cos(a) * 322, y = 1428 + Math.sin(a) * 25; if (Math.sin(a) > 0.2) strokePts([[x, y], [x, y + 5]], 'rgba(220,200,160,0.6)', 1); }
    if (o.panier !== false) {
      pc([[860, 1432], [930, 1432], [924, 1404], [866, 1404]], '#a8823a', () => { for (let x = 866; x < 930; x += 6) strokePts([[x, 1404], [x + 2, 1432]], 'rgba(90,60,20,0.5)', 1); for (const y of [1412, 1422]) strokePts([[864, y], [928, y]], 'rgba(90,60,20,0.5)', 1); }, 9402);
      for (const [x, col] of [[880, '#3e5872'], [902, '#9b2d24'], [918, '#e0d6bc']]) pc(ell(x, 1402, 10, 9, 12), col, () => strokePts(ep(x, 1402, 6, 5, 8, 0, 5), 'rgba(0,0,0,0.3)', 0.8), 9403 + x, { drop: false });
      strokePts([[886, 1404], [916, 1376]], '#b9b6ad', 1.6); strokePts([[892, 1404], [928, 1382]], '#b9b6ad', 1.6);
    }
  };

  // ---------------------------------------------------------------- RIVE DU NIAGARA (au-dessus des chutes, matin d'octobre)
  const RIVE = { rapides: [905, 975, 1060, 1160], ponton: { x0: 40, x1: 430, y: 1262 }, poisson: { x: 720, y: 1010 } };
  NIA.RIVE = RIVE;
  function riveCiel() { return layer((c) => {
    gradRect(c, 0, 0, 1080, 900, [[0, '#a9bcc6'], [0.55, '#d7d8cc'], [1, '#ede1c4']]);
    c.save(); c.globalAlpha = 0.5; for (const [x, y, r] of [[200, 420, 50], [250, 400, 60], [310, 424, 44], [640, 360, 40], [690, 344, 52], [740, 368, 38]]) blob(c, x, y, r, '#f2ede2'); c.restore();
    // gorge lointaine (falaises pâles) et rive canadienne aux bois roux et or
    c.fillStyle = '#b8b2a0'; c.beginPath(); c.moveTo(0, 690); c.lineTo(70, 668); c.lineTo(150, 676); c.lineTo(230, 698); c.lineTo(310, 742); c.lineTo(350, 800); c.lineTo(0, 810); c.fill();
    for (let y = 700; y < 800; y += 16) { c.fillStyle = 'rgba(120,110,90,0.25)'; c.fillRect(0, y, 300 - (y - 700) * -0.4, 2); }
    c.fillStyle = '#c4bca6'; c.beginPath(); c.moveTo(1080, 650); c.lineTo(1000, 630); c.lineTo(900, 650); c.lineTo(820, 720); c.lineTo(790, 800); c.lineTo(1080, 800); c.fill();
    c.fillStyle = '#b9ae90'; c.fillRect(0, 820, 1080, 80);
    const R = M.rng(77); for (let i = 0; i < 70; i++) { const x = R() * 1100, y = 800 + R() * 50, r = 12 + R() * 18; blob(c, x, y, r, ['#c69a5a', '#b9774a', '#cfb070', '#a8664a'][Math.floor(R() * 4)], 0.75); }
    c.fillStyle = 'rgba(237,225,196,0.45)'; c.fillRect(0, 780, 1080, 120);
    // nuage de brume des chutes, au loin à droite, et arc-en-ciel pâle
    for (let i = 0; i < 18; i++) blob(c, 760 + R() * 300, 560 + R() * 320, 40 + R() * 60, '#f6f3ec', 0.35);
    c.save(); c.lineWidth = 6; c.globalAlpha = 0.22; ['#c0584a', '#d29a4a', '#d8cc6a', '#7aa070', '#6a8ab0', '#8a6aa0'].forEach((col, i) => { c.beginPath(); c.arc(880, 920, 250 - i * 6, PI * 1.08, PI * 1.62); c.strokeStyle = col; c.stroke(); }); c.restore();
    gradRect(c, 0, 880, 1080, 910, [[0, '#9db3b0'], [1, '#8ea7a5']]);
  }); }
  function vague(i, h, col, per, bulles) { return M.pre(1080 + per * 2, h, (c) => {
    const W2 = 1080 + per * 2, crest = (x) => 16 + 7 * Math.sin(x / per * TAU) + 3 * Math.sin(x / per * TAU * 2 + i);
    const pts = [[0, h, 1]]; for (let x = 0; x <= W2; x += per / 10) pts.push([x, crest(x)]); pts.push([W2, h, 1]);
    pc(pts, col, () => {
      for (let k = 0; k < 6; k++) { const y0 = 30 + k * 18; const L = []; for (let x = 0; x <= W2; x += 10) L.push([x, y0 + 5 * Math.sin(x / per * TAU * 2 + k)]); strokePts(L, `rgba(220,235,235,${0.22 - k * 0.03})`, 1.4); }
      const L = []; for (let x = 0; x <= W2; x += 6) L.push([x, crest(x) + 3]); strokePts(L, 'rgba(245,242,232,0.9)', 4);
      for (let x = 0; x < W2; x += per) for (let k = 0; k < 4; k++) blob(c, x + per * 0.2 + k * 9, crest(x + per * 0.2 + k * 9) + 2, 6 - k, '#f4f1e8', 0.85);
      for (let x = 0; x < W2; x += per / 2) for (let k = 0; k < 3; k++) { const y = 36 + k * 26 + 8 * hash(x * 0.37 + k), xx = x + per * 0.25 * hash(x * 0.11 + k * 7); strokePts([[xx, y], [xx + 18, y - 2], [xx + 30, y + 1]], 'rgba(245,242,232,0.55)', 2.2); }
      if (bulles) for (let x = 0; x < W2; x += 26) for (let k = 0; k < 3; k++) { const y = 26 + k * 26 + 14 * hash(x * 0.3 + k), xx = (x + 40 * hash(x + k * 5)) % W2; blob(c, xx, y, 1.5 + 3 * hash(x * 0.7 + k), '#f6f4ee', 0.35); }
      shade(0, 0, 0, h, 0.3, [0, 0, W2, h]);
    }, 9500 + i, { drop: false });
  }); }
  const padB = (cv, b) => { cv.padB = b; return cv; };
  function rocher(w, h, seed, col) { return padB(M.cutFlat(w + 40, h + 30, (w + 40) / 2, h + 10, () => {
    const R = M.rng(seed), pts = []; for (let i = 0; i <= 12; i++) { const a = PI + i / 12 * PI, rr = 0.8 + R() * 0.25; pts.push([Math.cos(a) * w / 2 * rr, Math.sin(a) * h * rr * (0.75 + 0.25 * Math.abs(Math.cos(a)))]); }
    pts.push([w / 2, 6, 1], [-w / 2, 6, 1]);
    pc(pts, col, () => { for (let i = 0; i < 6; i++) strokePts([[-w / 3 + R() * w * 0.6, -h * 0.8 + R() * h * 0.3], [-w / 3 + R() * w * 0.6, -h * 0.3 + R() * 20]], 'rgba(20,20,20,0.35)', 1.3); strokePts([[-w * 0.3, -h * 0.7], [0, -h * 0.85], [w * 0.2, -h * 0.75]], 'rgba(255,255,255,0.3)', 2); hatch(null, 0.9, 4.5, 0.25); shade(-w / 2, -h, w / 2, 0, 0.35, [-w, -h * 1.2, w, 10]); }, seed);
  }), 20); }
  function arbre(seed, cols, flip) { return padB(M.withShadow(M.cutFlat(380, 1260, 190, 1250, (c) => {
    pc([[-16, 0], [16, 0], [12, -300], [20, -560], [8, -760], [-6, -760], [-18, -540], [-12, -300]], '#3e2c1e', () => { hatch(null, 0.1, 5, 0.3); strokePts([[-6, -20], [-2, -700]], 'rgba(255,220,170,0.2)', 2); }, seed);
    for (const [a, b] of [[[4, -560], [flip ? -120 : 120, -760]], [[0, -640], [flip ? 100 : -100, -860]], [[6, -720], [flip ? -60 : 60, -960]]]) pc(ribbon([a, [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5) + 20], b], 12, 5), '#3e2c1e', null, seed + b[0], { drop: false });
    feuillage(c, flip ? 20 : -20, -880, 170, 210, 70, cols, seed + 1);
  }), 8), 10); }
  function riveDevant() { return layer((c) => {
    const PT = RIVE.ponton;
    const PIL = [60, 140, 220, 300, 380, 424];
    for (let i = 0; i < PIL.length - 1; i++) { const a = PIL[i], b = PIL[i + 1]; pc(ribbon([[a, PT.y + 20], [b, 1360]], 6, 6), '#5a4430', null, 9590 + i, { drop: false }); pc(ribbon([[b, PT.y + 20], [a, 1360]], 6, 6), '#4a3a2a', null, 9596 + i, { drop: false }); }
    for (const x of PIL) pc([[x - 9, PT.y + 10], [x + 9, PT.y + 10], [x + 8, 1400], [x - 8, 1400]], '#4a3a2a', () => { fillPts(rect(x - 10, 1340, x + 10, 1400), 'rgba(20,30,30,0.45)'); hatch(null, 0.1, 4, 0.3); }, 9601 + x);
    pc([[PT.x0 - 6, PT.y], [PT.x1 + 6, PT.y], [PT.x1 + 6, PT.y + 18], [PT.x0 - 6, PT.y + 18]], '#7a5a3a', () => { for (let x = PT.x0; x < PT.x1; x += 22) strokePts([[x, PT.y], [x, PT.y + 18]], 'rgba(30,18,8,0.55)', 1.2); strokePts([[PT.x0, PT.y + 2], [PT.x1, PT.y + 2]], 'rgba(255,220,170,0.35)', 1.5); }, 9610);
    // caisse, rames appuyées, cordage enroulé, poteau à lanterne, bouée de liège
    pc(rect(178, PT.y - 56, 244, PT.y), '#8a6a40', () => { for (const y of [PT.y - 40, PT.y - 22]) strokePts([[180, y], [242, y]], 'rgba(30,18,8,0.55)', 1.4); strokePts([[180, PT.y - 54], [242, PT.y - 2]], 'rgba(30,18,8,0.4)', 2); hatch(null, 0.2, 5, 0.18); }, 9611);
    for (const [a, b] of [[[236, PT.y - 2], [168, 1040]], [[246, PT.y - 4], [206, 1030]]]) { pc(ribbon([a, b], 7, 7), '#a07848', null, 9612 + a[0], { drop: true }); const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); pc(ribbon([[a[0] + dx * 0.02, a[1] + dy * 0.02], [a[0] + dx * 0.2, a[1] + dy * 0.2]], 18, 12), '#a07848', null, 9614 + a[0], { drop: false }); }
    for (let k = 0; k < 4; k++) pc(ell(318, PT.y - 4 - k * 5, 34 - k * 4, 6, 14), '#c9b48a', () => strokePts(ep(318, PT.y - 4 - k * 5, 30 - k * 4, 4, 12, 0, PI), 'rgba(90,70,40,0.5)', 1), 9620 + k, { drop: k === 0 });
    pc(rect(152, 1110, 164, PT.y), '#5a4430', null, 9625); pc(rect(152, 1110, 196, 1118), '#5a4430', null, 9626, { drop: false });
    lanterne(c, 190, 1118, 0.9);
    pc(rect(410, 1180, 424, PT.y), '#5a4430', () => strokePts([[412, 1184], [412, PT.y - 4]], 'rgba(255,220,170,0.3)', 1.2), 9627);
    pc(ribbon(ep(417, 1222, 26, 26, 24, 0, TAU), 12, 12), '#d9cfb6', () => { for (const a of [0.4, 2, 3.6, 5.2]) { const x = 417 + Math.cos(a) * 26, y = 1222 + Math.sin(a) * 26; fillPts(ell(x, y, 7, 7, 8), '#9b2d24'); } }, 9628);
    // rive droite : terre, herbes, seau de tonnelier, maillet, douelles
    pc([[770, 1395], [800, 1330], [880, 1312], [1000, 1318], [1090, 1330], [1090, 1400], [770, 1400]], '#6a5a3a', () => { hatch(null, 0.3, 4, 0.2); for (let i = 0; i < 18; i++) strokePts([[800 + i * 15, 1326], [804 + i * 15, 1300 - (i % 3) * 8]], '#7a7a3a', 1.6); }, 9630);
    pc([[836, 1330], [884, 1330], [880, 1272], [840, 1272]], '#7a5434', () => { for (const y of [1284, 1318]) strokePts([[838, y], [882, y]], '#3b3d40', 3); for (const x of [848, 860, 872]) strokePts([[x, 1274], [x, 1328]], 'rgba(30,18,8,0.5)', 1); }, 9631);
    pc(ell(860, 1272, 20, 5, 12), '#2a1a10', null, 9632, { drop: false });
    pc(ribbon([[900, 1330], [944, 1248]], 6, 6), '#8a6a40', null, 9633); pc([[928, 1236], [962, 1254], [956, 1266], [922, 1248]], '#6b4a2c', () => hatch(null, 0.2, 4, 0.2), 9634);
    for (const [x, r] of [[960, -0.3], [978, -0.2]]) { c.save(); c.translate(x, 1330); c.rotate(r); pc([[-6, 0], [6, 0], [8, -70], [-4, -72]], '#9a7444', null, 9635 + x); c.restore(); }
  }); }
  function riveBarque() { return padB(M.withShadow(M.cutFlat(260, 120, 130, 100, () => {
    pc([[-118, -40], [118, -44], [100, -6], [60, 4], [-70, 4], [-104, -10]], '#3e5240', () => { fillPts([[-118, -40], [118, -44], [116, -34], [-116, -32]], '#b8862e'); for (let x = -90; x < 100; x += 30) strokePts([[x, -30], [x + 4, 2]], 'rgba(0,0,0,0.25)', 1); hatch(null, 0.1, 4, 0.2); }, 9650);
    pc(rect(-30, -46, 30, -40), '#6b4a2c', null, 9651, { drop: false });
  }), 6), 20); }
  NIA.rive = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), K = NIA.K, g = M.tg(t);
    c.save(); c.translate(0, -up);
    c.drawImage(K.riveCiel, 0, 0);
    M.nuages(t, { y0: 330, y1: 520, n: 4, vit: 12, s: 0.8, seed: 23, brume: 0.2 });
    M.oiseaux(g, { x0: -80, x1: 1160, y: 420, n: 4, s: 0.5, col: '#e9e4d8', dur: 18, boucle: true, seed: 5, brume: 0.15 });
    M.fumee(t, { x: 880, y: 880, s: 2.4, n: 7, haut: 420, vent: -50, col: '#f3efe6', a: 0.35, per: 7, seed: 21 });
    const V = K.riveVagues;
    V.forEach((cv, i) => {
      const per = cv._per, off = ((g * [16, 26, 38, 52][i]) % per + per) % per;
      c.drawImage(cv, -per * 2 + off, RIVE.rapides[i] + 2 * Math.sin(g * 1.3 + i));
      if (i === 1) { M.flat(K.riveRocD, 900, 1010); }
      if (i === 2) { M.flat(K.riveRocG, 120, 1110); }
    });
    for (const [x, y, ph] of [[860, 1012, 0], [930, 1016, 1], [100, 1112, 2], [168, 1114, 3]]) { const u = (g * 0.9 + ph * 0.3) % 1; c.save(); c.globalAlpha = 0.6 * (1 - u); c.beginPath(); c.ellipse(x + u * 30, y, 10 + u * 22, 3 + u * 4, 0, 0, TAU); c.fillStyle = '#f4f1e8'; c.fill(); c.restore(); }
    // mouettes posées sur le rocher de droite ; elles s'envolent à o.mouettesT0
    for (let i = 0; i < 3; i++) {
      const bx = 868 + i * 34, by = 940 - (i % 2) * 8, u = o.mouettesT0 != null && t > o.mouettesT0 + i * 0.12 ? t - o.mouettesT0 - i * 0.12 : -1;
      const x = u < 0 ? bx : bx + 160 * u + 30 * u * u, y = u < 0 ? by : by - 170 * u + 10 * Math.sin(u * 5), fl = u < 0 ? 0.15 : Math.sin(u * 16);
      if (y < 200 || SIL()) continue;
      c.save(); c.translate(x, y); c.scale(0.9, 0.9);
      c.beginPath(); c.ellipse(0, 0, 12, 6, 0, 0, TAU); c.fillStyle = '#ece8dc'; c.fill(); c.beginPath(); c.arc(10, -5, 5, 0, TAU); c.fill(); c.fillStyle = '#d29a4a'; c.fillRect(14, -6, 6, 2);
      c.beginPath(); c.moveTo(-4, -2); c.quadraticCurveTo(-14, -14 - 12 * fl, -24, -6 - 16 * fl); c.lineTo(-8, 2); c.fillStyle = '#9a9a9a'; c.fill(); c.restore();
    }
    if (o.poissonT0 != null && t > o.poissonT0 && t < o.poissonT0 + 1.4 && !SIL()) {                                 // un poisson saute dans les rapides
      const u = (t - o.poissonT0) / 0.9, P0 = RIVE.poisson;
      if (u <= 1) { c.save(); c.translate(P0.x + 70 * u, P0.y - Math.sin(u * PI) * 80); c.rotate(-0.9 + 1.8 * u); c.beginPath(); c.ellipse(0, 0, 18, 6, 0, 0, TAU); c.fillStyle = '#8e9ea4'; c.fill(); c.beginPath(); c.moveTo(-16, 0); c.lineTo(-28, -8); c.lineTo(-28, 8); c.fill(); c.restore(); }
      for (const [x0, t1] of [[P0.x, 0], [P0.x + 70, 0.9]]) { const v = (t - o.poissonT0 - t1) / 0.5; if (v > 0 && v < 1) { c.save(); c.globalAlpha = 1 - v; c.strokeStyle = '#f4f1e8'; c.lineWidth = 2; c.beginPath(); c.ellipse(x0, P0.y + 4, 10 + 30 * v, 3 + 6 * v, 0, 0, TAU); c.stroke(); c.restore(); } }
    }
    c.drawImage(K.riveDevant, 0, 0);
    M.flat(K.riveBarque, 200, 1398 + 3 * Math.sin(g * 1.6), { rot: 0.015 * Math.sin(g * 1.2), cast: { a: 0.25, dx: 10, dy: 4 } });
    M.flamme(t, { x: 190, y: 1170, s: 0.4, r: 110, seed: 9 });
    M.flat(K.riveArbreG, 110, BACK + 6, { rot: 0.006 * Math.sin(g * 0.9), cast: { a: 0.3, dx: 14, dy: 6 } });
    M.flat(K.riveArbreD, 975, BACK + 6, { rot: 0.006 * Math.sin(g * 0.8 + 1), cast: { a: 0.3, dx: 14, dy: 6 } });
    for (let i = 0; i < 9; i++) {                                                                                   // feuilles qui tombent des coulisses
      const per = 8 + (i % 3), u = ((g + i * 2.3) % per) / per, left = i % 2 === 0;
      const x0 = left ? 60 + hash(i) * 180 : 830 + hash(i) * 180, x = x0 + (left ? 1 : -1) * 120 * u + 30 * Math.sin(u * 9 + i), y = 520 + u * 860;
      feuille(c, x, y, 0.9, u * 10 + i, ['#9b3a22', '#c27a2e', '#cfa040'][i % 3]);
    }
    c.restore();
  };

  // ---------------------------------------------------------------- PIED DES CHUTES (le fer à cheval vu d'en bas)
  const CHUTES = { crete: 422, bas: 905, impact: [540, 905], belvedere: { x0: 790, x1: 990, y: 716 }, escalier: { x: 160 }, x0: 170, x1: 910 };
  NIA.CHUTES = CHUTES;
  const FALLS = (() => { const o = []; for (let i = 0; i <= 20; i++) { const x = lerp(170, 910, i / 20), v = (x - 540) / 370; o.push([x, 422 + 50 * v * v]); } o.push([935, 905], [145, 905]); return o; })();
  function chCiel() { return layer((c) => {
    gradRect(c, 0, 0, 1080, 960, [[0, '#a9bcc6'], [0.5, '#cfd5cf'], [1, '#e6e0cc']]);
    c.save(); c.globalAlpha = 0.5; for (const [x, y, r] of [[300, 330, 40], [350, 316, 52], [700, 300, 46], [750, 320, 36]]) blob(c, x, y, r, '#f2ede2'); c.restore();
    const R = M.rng(91); for (let i = 0; i < 40; i++) blob(c, 200 + R() * 680, 400 + R() * 20 - 30 * Math.cos((R() - 0.5) * 2), 10 + R() * 14, ['#b9774a', '#cfb070', '#a8664a'][i % 3], 0.6);
    // rideau d'eau (fond), lèvre verte de la crête
    c.beginPath(); FALLS.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    const gr = c.createLinearGradient(0, 420, 0, 905); gr.addColorStop(0, '#7fa59a'); gr.addColorStop(0.08, '#c9dcdc'); gr.addColorStop(0.6, '#e4ecec'); gr.addColorStop(1, '#f4f4ee'); c.fillStyle = gr; c.fill();
    c.save(); c.clip(); for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(90,130,140,${0.08 + 0.05 * (i % 2)})`; c.fillRect(190 + i * 82, 420, 30, 500); } c.restore();
    // falaises de calcaire ocre, strates, arbres d'automne au sommet
    for (const side of [-1, 1]) {
      const pts = side < 0 ? [[0, 300], [120, 290], [190, 380], [176, 520], [214, 700], [196, 905], [0, 960]] : [[1080, 300], [960, 290], [892, 380], [906, 520], [870, 700], [886, 905], [1080, 960]];
      pc(pts, '#b49a6c', () => { for (let y = 330; y < 960; y += 38) strokePts([[side < 0 ? 0 : 860, y], [side < 0 ? 230 : 1080, y + 6]], 'rgba(90,70,40,0.4)', 2); hatch(null, 0.3, 5, 0.22); shade(side < 0 ? 200 : 880, 0, side < 0 ? 0 : 1080, 0, 0.35, [side < 0 ? 0 : 860, 280, side < 0 ? 240 : 1080, 960]); }, 9700 + side);
      feuillage(c, side < 0 ? 90 : 990, 300, 110, 40, 22, ['#9b3a22', '#c27a2e', '#cfa040'], 9710 + side);
    }
    for (let i = 0; i < 26; i++) blob(c, 160 + R() * 760, 870 + R() * 70, 40 + R() * 50, '#f6f4ee', 0.55);
  }); }
  function chStries() { return M.pre(1080, 300, (c) => {
    const R = M.rng(17);
    for (let i = 0; i < 120; i++) { const x = 160 + R() * 760, y = R() * 300, L = 30 + R() * 90, a = 0.2 + R() * 0.45, col = R() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(110,150,160,${a * 0.6})`;
      for (const dy of [0, -300, 300]) { c.beginPath(); c.moveTo(x, y + dy); c.lineTo(x + 2, y + dy + L); c.strokeStyle = col; c.lineWidth = 1.5 + R() * 2.5; c.stroke(); } }
  }); }
  function chMilieu() { return layer((c) => {
    // escalier de bois des visiteurs (falaise gauche) : volées en zigzag avec rampe
    const vol = [[[70, 470], [214, 590]], [[214, 600], [80, 720]], [[80, 730], [214, 850]], [[214, 860], [96, 980]]];
    for (const [a, b] of vol) {
      pc(ribbon([a, b], 8, 8), '#7a5434', () => {}, 9750 + a[1]);
      for (let k = 1; k < 10; k++) { const x = lerp(a[0], b[0], k / 10), y = lerp(a[1], b[1], k / 10); strokePts([[x - 6, y - 2], [x + 6, y - 2]], '#5a3d24', 3); }
      for (let k = 0; k <= 4; k++) { const x = lerp(a[0], b[0], k / 4), y = lerp(a[1], b[1], k / 4); strokePts([[x, y], [x, y - 34]], '#5a3d24', 2.4); }
      strokePts([[a[0], a[1] - 34], [b[0], b[1] - 34]], '#6b4a2c', 2.4);
      pc(rect(b[0] - 10, b[1], b[0] + 10, b[1] + 8), '#6b4a2c', null, 9760 + b[1], { drop: false });
    }
    // belvédère à rambarde (falaise droite)
    const B = CHUTES.belvedere;
    pc(rect(B.x0, B.y, B.x1 + 40, B.y + 14), '#6b4a2c', () => strokePts([[B.x0, B.y + 2], [B.x1 + 40, B.y + 2]], 'rgba(255,220,170,0.35)', 1.5), 9770);
    for (let x = B.x0 + 4; x <= B.x1 + 30; x += 22) strokePts([[x, B.y], [x, B.y - 44]], '#5a3d24', 2.6);
    pc(rect(B.x0, B.y - 48, B.x1 + 40, B.y - 42), '#7a5434', null, 9771, { drop: false });
    for (const x of [B.x0 + 20, B.x0 + 110]) pc(ribbon([[x, B.y + 14], [x + 90, B.y + 120]], 9, 9), '#5a3d24', null, 9772 + x, { drop: false });
  }); }
  function chRochers() { return layer((c) => {
    // rochers noirs mouillés au pied
    for (const [x, y, w, h, s] of [[170, 1210, 160, 120, 9781], [900, 1200, 170, 150, 9782]]) {
      const R = M.rng(s), pts = []; for (let i = 0; i <= 12; i++) { const a = PI + i / 12 * PI, rr = 0.8 + R() * 0.25; pts.push([x + Math.cos(a) * w / 2 * rr, y + Math.sin(a) * h * rr]); }
      pc(pts, '#2b2d31', () => { strokePts(ep(x - w * 0.1, y - h * 0.2, w * 0.36, h * 0.62, 10, PI * 1.15, PI * 1.6), 'rgba(220,235,240,0.55)', 3); strokePts(ep(x + w * 0.12, y - h * 0.1, w * 0.3, h * 0.5, 8, PI * 1.25, PI * 1.55), 'rgba(220,235,240,0.35)', 2); fillPts([[x - w * 0.1, y - h * 0.9], [x + w * 0.3, y - h * 0.6], [x + w * 0.4, y], [x + w * 0.05, y]], 'rgba(0,0,0,0.25)'); hatch(null, 0.9, 4.5, 0.25); }, s);
      for (let k = 0; k < 6; k++) { const r = 10 + 6 * hash(k + s); fillPts(ell(x - w / 2 + 6 + k * w / 5.5, y + 1, r * 1.7, r * 0.45, 12), 'rgba(244,241,232,0.8)'); }
    }
  }); }
  function ecume(i, h, col) { const per = 160; return Object.assign(vague(10 + i, h, col, per, true), { _per: per }); }
  function chDevant() { return layer((c) => {
    pc([[0, 1340], [300, 1328], [700, 1336], [1080, 1326], [1080, 1400], [0, 1400]], '#8a8070', () => {
      const R = M.rng(55); for (let i = 0; i < 150; i++) { const x = R() * 1080, y = 1336 + R() * 62, r = 4 + R() * 9; fillPts(ell(x, y, r, r * 0.6, 8), ['#9a9286', '#7a7266', '#b0a490', '#6a6458'][i % 4]); strokePts(ep(x, y - 1, r * 0.6, r * 0.3, 6, PI, TAU), 'rgba(255,255,255,0.3)', 0.8); }
    }, 9801, { drop: false });
    for (const x of [190, 900]) {                                                                                   // bornes d'amarrage en fonte + cordages
      pc([[x - 16, 1360], [x + 16, 1360], [x + 12, 1316], [x + 18, 1306], [x - 18, 1306], [x - 12, 1316]], '#2a2a2e', () => strokePts([[x - 8, 1314], [x - 8, 1356]], 'rgba(255,255,255,0.2)', 2), 9802 + x);
      for (let k = 0; k < 3; k++) pc(ell(x, 1330 - k * 4, 22 - k * 3, 6, 12), '#c9b48a', null, 9805 + x + k, { drop: k === 0 });
    }
    pc(ribbon(qbez([212, 1328], [300, 1360], [380, 1350], 10), 6, 6), '#c9b48a', null, 9810, { drop: false });
    pc(ribbon([[110, 1376], [330, 1392]], 8, 8), '#8a6a40', null, 9811);                                                   // gaffe posée sur les galets
    pc([[326, 1384], [350, 1390], [360, 1396], [340, 1398], [332, 1404], [324, 1396]], '#3b3d40', null, 9812, { drop: false });
    pc(rect(966, 1110, 976, 1395), '#5a4430', null, 9813); pc(rect(940, 1110, 976, 1118), '#5a4430', null, 9814, { drop: false });
    lanterne(c, 946, 1118, 0.9);
  }); }
  function chBarque() { return padB(M.withShadow(M.cutFlat(280, 140, 140, 120, () => {
    pc([[-128, -50], [128, -56], [110, -10], [66, 2], [-80, 2], [-114, -14]], '#2f4a3e', () => { fillPts([[-128, -50], [128, -56], [126, -44], [-126, -40]], '#e8dfc8'); for (let x = -100; x < 110; x += 30) strokePts([[x, -38], [x + 4, 0]], 'rgba(0,0,0,0.25)', 1); hatch(null, 0.1, 4, 0.2); }, 9850);
    pc(ribbon(ep(20, -24, 18, 18, 20, 0, TAU), 9, 9), '#d9cfb6', () => { for (const a of [0.4, 2, 3.6, 5.2]) fillPts(ell(20 + Math.cos(a) * 18, -24 + Math.sin(a) * 18, 5, 5, 8), '#9b2d24'); }, 9851);
    pc(ribbon([[-60, -50], [-20, -130]], 6, 6), '#a07848', null, 9852, { drop: false });
  }), 6), 20); }
  function chPanier() { return padB(M.withShadow(M.cutFlat(120, 100, 60, 90, () => {
    pc([[-44, 0], [44, 0], [48, -46], [-48, -46]], '#a8823a', () => { for (let x = -44; x < 46; x += 7) strokePts([[x, -46], [x + 2, 0]], 'rgba(90,60,20,0.5)', 1); for (const y of [-34, -20, -8]) strokePts([[-46, y], [46, y]], 'rgba(90,60,20,0.5)', 1); }, 9860);
    pc([[-48, -46], [48, -46], [40, -56], [-40, -56]], '#e8dfc8', () => { for (let x = -40; x < 40; x += 10) fillPts(rect(x, -56, x + 5, -46), '#9b2d24'); }, 9861);
    pc(ribbon(ep(0, -50, 34, 30, 16, PI, TAU), 5, 5), '#8a6a2a', null, 9862, { drop: false });
  }), 6), 10); }
  const FAN_COLS = ['#c08a32', '#9b2d24', '#e8dfc8', '#5f7a52', '#3e5872'];
  const fanY = (x) => 300 + 90 * (1 - Math.pow((x - 540) / 430, 2));
  NIA.chutes = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), K = NIA.K, g = M.tg(t), de = clamp(o.descente || 0);
    c.save(); c.translate(0, -up);
    c.drawImage(K.chCiel, 0, 0);
    M.nuages(t, { y0: 300, y1: 380, n: 3, vit: 10, s: 0.6, seed: 31, brume: 0.2 });
    c.save(); c.beginPath(); FALLS.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();         // stries qui descendent
    const off = (g * (230 + 120 * de)) % 300; for (let k = -1; k < 3; k++) c.drawImage(K.chStries, 0, 420 + off + k * 300);
    c.restore();
    c.save(); c.lineWidth = 8; c.globalAlpha = 0.3 + 0.1 * Math.sin(g * 1.1) + 0.05 * Math.sin(g * 3.7);                     // arc-en-ciel qui scintille
    ['#c0584a', '#d29a4a', '#d8cc6a', '#7aa070', '#6a8ab0', '#8a6aa0'].forEach((col, i) => { c.beginPath(); c.arc(560, 1160, 440 - i * 8, PI * 1.16, PI * 1.44); c.strokeStyle = col; c.stroke(); }); c.restore();
    for (const [x, sd] of [[260, 1], [430, 2], [600, 3], [790, 4]]) M.fumee(t, { x, y: 930, s: 2.1, n: 6, haut: 330 + 200 * de, vent: 20, col: '#f6f4ee', a: 0.32 + 0.3 * de, per: 6, seed: sd });
    M.oiseaux(g, { x0: 1160, x1: -80, y: 360, n: 3, s: 0.45, col: '#e9e4d8', dur: 20, boucle: true, seed: 8, brume: 0.15 });
    c.drawImage(K.chMilieu, 0, 0);
    if (o.passants !== false) { c.save(); c.beginPath(); c.rect(CHUTES.belvedere.x0, 500, CHUTES.belvedere.x1 - CHUTES.belvedere.x0 + 40, 230); c.clip(); M.passants(t, { y: CHUTES.belvedere.y, s: 0.17, n: 2, per: 16, x0: CHUTES.belvedere.x0 + 10, x1: CHUTES.belvedere.x1 + 20, brume: 0.35, seed: 41 }); c.restore(); }
    if (o.chatT0 != null && t > o.chatT0 && t < o.chatT0 + 7) { const u = (t - o.chatT0) / 7; NIA.chat({ marche: u * 18, bosse: 1, t }, lerp(CHUTES.belvedere.x0 - 10, CHUTES.belvedere.x1 + 40, u), CHUTES.belvedere.y, 0.34, { dir: 1, rod: false, floorShadow: false }); }
    K.chEcume.forEach((cv, i) => { const per = cv._per, ox = 18 * Math.sin(g * 0.8 + i * 1.7) - per; c.drawImage(cv, ox, [900, 975, 1070][i] + 3 * Math.sin(g * 1.3 + i)); });
    c.drawImage(K.chRochers, 0, 0);
    if (de > 0.02 && !SIL()) {                                                                                    // gerbe d'écume au point d'impact (descente → 1)
      const I = CHUTES.impact; c.save();
      for (let i = 0; i < 12; i++) { const a = PI + (i + 0.5) / 12 * PI, r = (30 + 150 * de) * (0.6 + 0.4 * hash(i)); c.globalAlpha = 0.75 * de; blob(c, I[0] + Math.cos(a) * r * 1.2, I[1] + Math.sin(a) * r, 18 + 30 * de * hash(i + 3), '#f6f4ee'); }
      c.restore();
    }
    const tg = 0.02 * Math.sin(g * 1.1) + (o.tangueT0 != null ? M.wob(t, o.tangueT0, 0.09, 0.8, 0.9) : 0);
    M.flat(K.chBarque, 870, 1330 + 3 * Math.sin(g * 1.4), { rot: tg, cast: { a: 0.25, dx: 10, dy: 4 } });
    c.drawImage(K.chDevant, 0, 0);
    M.flamme(t, { x: 946, y: 1170, s: 0.4, r: 110, seed: 13 });
    if (o.panier) M.flat(K.chPanier, 270, 1392, { cast: { a: 0.25, dx: 8, dy: 4 } });
    if (o.fanions) {                                                                                            // fanions de foire (sans lettre) ; l'un se décroche à o.fanionT0
      const L = []; for (let x = 110; x <= 970; x += 20) L.push([x, fanY(x) + 3 * Math.sin(g * 1.2 + x * 0.01)]); strokePts(L, '#3a2a1c', 1.6);
      let n = 0;
      for (let x = 130; x <= 950; x += 48, n++) {
        const y = fanY(x) + 3 * Math.sin(g * 1.2 + x * 0.01), col = FAN_COLS[n % FAN_COLS.length];
        let px = x, py = y, rot = 0.1 * Math.sin(g * 3 + n);
        if (o.fanionT0 != null && n === 9 && t > o.fanionT0) { const u = t - o.fanionT0; px = x + 30 * u + 40 * Math.sin(u * 1.6); py = Math.min(1330, y + 150 * u); rot = 0.8 * Math.sin(u * 2.4); }
        c.save(); c.translate(px, py); c.rotate(rot); pc([[-16, 0, 1], [16, 0, 1], [0, 40, 1]], col, () => strokePts([[-12, 4], [12, 4]], 'rgba(0,0,0,0.2)', 1), 9900 + n, { drop: false }); c.restore();
      }
    }
    c.restore();
  };

  // =====================================================================
  NIA.init = function () {
    if (NIA.K) return NIA.K;
    const K = (NIA.K = {});
    K.salonVue = salonVue(); K.salonFond = salonFond(); K.salonMilieu = salonMilieu(); K.salonTable = salonTable();
    K.riveCiel = riveCiel(); K.riveVagues = [['#9cb3ad', 140], ['#7d9a98', 150], ['#5f8084', 160], ['#486a72', 170]].map(([col, per], i) => Object.assign(vague(i, 1400 - RIVE.rapides[i], col, per), { _per: per }));
    K.riveRocG = M.withShadow(rocher(220, 150, 61, '#5a5650'), 6); K.riveRocD = M.withShadow(rocher(200, 120, 62, '#625e56'), 6);
    K.riveArbreG = arbre(71, ['#9b3a22', '#b5522a', '#c27a2e', '#8a2e1c'], false); K.riveArbreD = arbre(72, ['#c27a2e', '#cfa040', '#b8862e', '#9b3a22'], true);
    K.riveDevant = riveDevant(); K.riveBarque = riveBarque();
    K.chCiel = chCiel(); K.chStries = chStries(); K.chMilieu = chMilieu(); K.chRochers = chRochers(); K.chEcume = [['#d6e0de', 0], ['#a9bfbe', 1], ['#86a2a2', 2]].map(([col, i]) => ecume(i, 1400 - [900, 975, 1070][i], col));
    K.chDevant = chDevant(); K.chBarque = chBarque(); K.chPanier = chPanier();
    return K;
  };
})();
