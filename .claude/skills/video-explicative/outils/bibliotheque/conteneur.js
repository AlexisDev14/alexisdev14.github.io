// persos.js — « Le conteneur, né d'une journée d'attente » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.cont (alias CON). Appeler CON.init() dans S.init.
// Mode d'emploi complet : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre ni chiffre. Déterministe (hash, aucun Math.random).
// MARIONNETTES (tige ; (x,y) = pieds) : CON.mclean / CON.dockerA / CON.dockerB (pose,x,y,s,o) — toujours par l'enveloppe.
// ACCESSOIRES (sans tige) : CON.sablier, CON.goeland, CON.camion, CON.balle, CON.caisse, CON.crochet, CON.conteneur, CON.grue, CON.navire, CON.bateauPompe.
// DÉCORS : CON.init() → CON.K = { quai37:{ciel,fond}, port56:{ciel,fond}, grue:{orange,gris,jaune,bleu}, navire } ; repères CON.GRUE, CON.NAVIRE, CON.QUAI, CON.PORT.
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const CON = (M.cont = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const rot = (pts, cx, cy, a) => { const co = Math.cos(a), si = Math.sin(a); return pts.map((p) => { const x = p[0] - cx, y = p[1] - cy; const q = [cx + x * co - y * si, cy + x * si + y * co]; if (p[2]) q.push(1); return q; }); };
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
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
  const seg = (a, b, w) => ribbon([a, b], w, w);
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  CON.geo = { ep, ell, ribbon, rrect, rect, rot, qbez };

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le rivet)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
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

  // =====================================================================
  // OBJETS TENUS — chaque objet se dessine dans son repère ; grip = point serré dans le poing ; p2 = seconde prise (deuxMains)
  // =====================================================================
  const BOIS = [   // teintes de caisse : [aplat, clair, sombre]
    ['#a77b4a', '#c69a63', '#7d5a33'], ['#8a6a42', '#a8875a', '#5e4428'], ['#c09a62', '#dbb985', '#8f6f40'], ['#7a5236', '#99704f', '#57391f']];
  function drawCaisse(o) {
    const B = BOIS[((o.teinte | 0) % 4 + 4) % 4], sd = 8000 + (o.teinte | 0) * 10;
    pc(rect(-70, -108, 70, 0), B[0], () => {
      for (const y of [-81, -54, -27]) { strokePts([[-70, y], [70, y]], 'rgba(40,25,10,0.55)', 1.4); strokePts([[-70, y + 2], [70, y + 2]], 'rgba(255,235,200,0.18)', 1); }
      for (let i = 0; i < 9; i++) { const y = -100 + i * 11.5 + hash(i + sd) * 4; strokePts([[-60 + hash(i * 3 + sd) * 30, y], [-10 + hash(i * 7 + sd) * 60, y + 1]], 'rgba(60,40,20,0.22)', 0.9); }
      hatch(null, 0.25, 5, 0.12, 1, '40,25,10', [-70, -108, 70, 0]); shade(-70, -108, 70, 0, 0.22, [-70, -108, 70, 0]);
    }, sd);
    const cad = () => hatch(null, 1.2, 4, 0.14, 1, '40,25,10', [-80, -120, 80, 10]);
    pc([[-58, -22], [-58, -12], [-46, -12], [58, -86], [58, -96], [46, -96]], B[1], cad, sd + 1);
    pc(rect(-70, -108, -57, 0), B[1], cad, sd + 2); pc(rect(57, -108, 70, 0), B[1], cad, sd + 3);
    pc(rect(-70, -108, 70, -96), B[1], cad, sd + 4); pc(rect(-70, -12, 70, 0), B[1], cad, sd + 5);
    for (const [x, y] of [[-63, -102], [63, -102], [-63, -6], [63, -6], [-30, -102], [30, -102], [-30, -6], [30, -6]]) dot(x, y, 1.7, '#3a3a3c');
  }
  // balle de coton : 130 × 86, sangles brunes ; o.sangles (3)
  function drawBalle(o) {
    const sd = 8100 + (o.seed | 0);
    const top = []; for (let i = 0; i <= 12; i++) { const x = -60 + i * 10; top.push([x, -84 - 3 * Math.sin(i * 1.7 + sd) - (i % 2) * 2]); }
    const pts = [[-65, -4], [-66, -40], [-63, -78]].concat(top, [[63, -78], [66, -40], [65, -4], [58, 0, 1], [-58, 0, 1]]);
    pc(pts, '#e6e0d0', () => {
      for (let y = -80; y < 0; y += 5) strokePts([[-66, y], [66, y + 1]], 'rgba(150,135,105,0.18)', 1);
      for (let x = -62; x < 66; x += 6) strokePts([[x, -86], [x + 1, 0]], 'rgba(150,135,105,0.12)', 1);
      for (let i = 0; i < 14; i++) dot(-58 + hash(i + sd) * 116, -78 + hash(i * 5 + sd) * 74, 2 + hash(i * 9) * 2.5, 'rgba(255,255,250,0.55)');
      shade(0, -86, 0, 0, 0.25, [-70, -90, 70, 0]); shade(-66, 0, 66, 0, 0.18, [-70, -90, 70, 0]);
    }, sd);
    const n = o.sangles == null ? 3 : o.sangles;
    for (let k = 0; k < n; k++) {
      const x = n === 1 ? 0 : -40 + 80 * k / (n - 1);
      pc([[x - 4, -86], [x + 4, -86], [x + 5, 0, 1], [x - 5, 0, 1]], '#6b4a2e', () => strokePts([[x - 1, -84], [x - 1, -2]], 'rgba(255,220,180,0.25)', 1), sd + 1 + k, { drop: false });
      dot(x, -46, 2.2, '#3a3a3c');
    }
  }
  // crochet de docker : poignée de bois en (0,0), tige de fer, crochet vers l'avant ; pointe en (25,36)
  function drawCrochet() {
    pc(rrect(-20, -7, 20, 7, 6), '#8a6a42', () => { strokePts([[-16, -3], [16, -3]], 'rgba(255,235,200,0.35)', 1.2); hatch(null, 0.2, 3, 0.2); }, 8201);
    const hook = [[-3, 4], [3, 4], [3, 40]].concat(ep(13, 44, 10, 10, 8, PI, 0), [[25, 30, 1]], ep(13, 44, 17, 17, 10, 0, PI));   // bord intérieur, pointe, bord extérieur
    pc(hook, '#3e4448', () => strokePts([[0, 6], [0, 38]], 'rgba(255,255,255,0.3)', 1), 8202);
  }
  // corde verticale qui passe dans le poing : o.haut (au-dessus du poing), o.bas (en dessous)
  function drawCorde(o) {
    const h = o.haut == null ? 420 : o.haut, b = o.bas == null ? 120 : o.bas;
    pc(rect(-3.6, -h, 3.6, b), '#b49a6a', () => {
      for (let y = -h; y < b; y += 7) strokePts([[-3.6, y], [3.6, y + 5]], 'rgba(70,50,25,0.55)', 1.1);
    }, 8301, { drop: false });
  }
  const OBJ = {
    caisse: { draw: drawCaisse, grip: [0, 2], p2: () => [-64, -50], pts: () => ({ haut: [0, -108], centre: [0, -54], base: [0, 0] }) },
    balle: { draw: drawBalle, grip: [0, 2], p2: () => [-60, -42], pts: () => ({ haut: [0, -86], centre: [0, -43], base: [0, 0] }) },
    crochet: { draw: drawCrochet, grip: [0, 0], pts: () => ({ pointe: [25, 30], poignee: [0, 0] }) },
    corde: { draw: drawCorde, grip: [0, 0], pts: (o) => ({ haut: [0, -(o.haut == null ? 420 : o.haut)], bas: [0, o.bas == null ? 120 : o.bas] }) },
  };
  CON.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, skinB, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsD: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par CON.mclean / dockerA / dockerB
  CON.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, q = ob.pts(oo)[nom]; if (!q) return null;
    const g = gripOf(ob, oo);
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };

  // =====================================================================
  // POSES — préparation commune
  // =====================================================================
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function plier(q, th) {
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
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
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)), 'bas');
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o || {});
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }

  // ---------------- pièces de corps communes
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  // o : nu (y où commence la peau nue), roule (bourrelet de manche), poignet (manchette), rayures (couleur des rayures de tricot)
  function foreDef(parent, base, skin, back, seed, o) {
    o = o || {};
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (o.rayures) for (let y = 6; y < 60; y += 18) fillPts(rect(-24, y, 24, y + 8), o.rayures);
      if (o.nu != null) fillPts([[-24, o.nu, 1], [24, o.nu, 1], [24, 300, 1], [-24, 300, 1]], skin);
      if (o.roule) { fillPts([[-24, o.nu - 13, 1], [24, o.nu - 13, 1], [24, o.nu + 2, 1], [-24, o.nu + 2, 1]], o.roule); strokePts([[-20, o.nu - 6], [20, o.nu - 7]], 'rgba(90,80,60,0.45)', 1); }
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (o.poignet) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.poignet);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  function legDef(at, base, seed, back, paint, th) {
    return { parent: 'torso', at, pts: X.legPts(th || 0.95), base, seed, noRivet: !!back, paint: () => {
      paint();
      if (!back) hatch([[-26, -20], [-6, -20], [-6, 196], [-26, 196]], 0.8, 4, 0.25); else hatch(null, 0.8, 3.6, 0.3);
    } };
  }
  const shoes = (c, y0) => () => { fillPts([[-40, y0 || 210, 1], [60, y0 || 210, 1], [60, 260, 1], [-40, 260, 1]], c); strokePts([[22, 226], [44, 230]], 'rgba(255,255,255,0.22)', 1.3); };

  // =====================================================================
  // MALCOLM McLEAN (1937 → 1956, même tenue) — casquette de chauffeur gris souris, chemise ivoire à brassards, cravate brique,
  // gilet moutarde, pantalon bleu nuit, fine moustache, cheveux bruns plaqués. Jeune et mince.
  // =====================================================================
  const MC = { peau: '#e2bd98', peauD: '#c59c78', chem: '#ebe4d2', chemD: '#cdc5af', col: '#f5f1e6', gilet: '#b58a2c', giletD: '#8f6b1c', giletL: '#cda548',
    cravate: '#9a3b2e', cravateD: '#76291f', pant: '#2d3748', pantD: '#232b39', chaus: '#2a1d16', cap: '#6b6f72', capD: '#505457', capL: '#878b8d', visiere: '#1d1b1d',
    chev: '#3b2a20', brass: '#2c2c30' };
  const MC_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [32, -114], [33, -62], [31, -16], [31, 12], [-32, 14], [-34, -40], [-35, -110], [-31, -150], [-25, -168]];
  // casquette de chauffeur : calotte souple qui avance un peu sur la visière, bandeau, visière noire vernie (repère : posée en [-2,-84] de la tête)
  const MC_CAP = [[-36, 8], [-38, -10], [-50, -30], [-48, -40, 1], [-10, -45], [34, -43], [56, -34, 1], [46, -14], [40, 0], [62, 6], [70, 14, 1], [40, 12], [10, 10]];
  const CAP_GRIP = [16, -20];                    // où la main ouverte se pose sur la casquette (calotte, côté avant)
  function capPaint(dx, dy) {
    const T = (p) => tr(p, dx, dy);
    return () => {
      fillPts(T([[-39, -14], [43, -14], [41, 2], [-36, 4]]), '#2a2b2e');                                // bandeau noir
      fillPts(T([[38, 0], [62, 6], [70, 14], [40, 12]]), MC.visiere);                                       // visière vernie
      strokePts(T([[44, 4], [62, 8]]), 'rgba(255,255,255,0.45)', 1.4);
      strokePts(T([[2, -6], [40, -8]]), '#9a9c98', 1.4); dot(38 + dx, -8 + dy, 2.2, '#c9c9c2');                // jugulaire et bouton (sans insigne)
      strokePts(T([[-46, -36], [0, -40], [50, -32]]), 'rgba(30,30,32,0.45)', 1.2); strokePts(T([[-40, -20], [42, -20]]), 'rgba(255,255,255,0.18)', 1.2);            // couture de la calotte
      hatch(null, 0.6, 3.2, 0.22); hatch(null, -0.7, 4.4, 0.12); shade(dx, -46 + dy, dx, 10 + dy, 0.28, [-52 + dx, -48 + dy, 72 + dx, 16 + dy]);
    };
  }
  function mkMclean() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: MC_TORSO, base: MC.gilet, seed: 9101, paint: () => {
        fillPts(rect(-44, -14, 44, 22), MC.pant);                                                           // haut du pantalon
        fillPts([[2, -16], [33, -16], [30, -2], [20, -8]], MC.gilet);                                        // pointe du gilet
        strokePts([[-36, -15], [33, -16]], MC.giletD, 1.4);
        fillPts([[2, -186], [16, -172], [25, -150], [23, -124], [14, -128], [8, -160]], MC.chem);           // plastron dans l'échancrure
        fillPts([[3, -186], [18, -175], [14, -164], [3, -174]], MC.col);                                     // col
        fillPts([[14, -171], [22, -169], [26, -142], [28, -124], [21, -114], [15, -124], [14, -150]], MC.cravate);   // cravate
        dot(18, -168, 3.4, MC.cravateD); strokePts([[19, -160], [22, -128]], 'rgba(255,200,180,0.25)', 1);
        strokePts([[25, -150], [29, -118], [31, -60], [31, -16]], MC.giletD, 1.4);                           // bord du gilet
        for (const y of [-104, -80, -56, -32]) dot(28, y, 2.2, '#5b4515');
        strokePts([[2, -64], [22, -66]], MC.giletD, 1.6);                                                    // poche passepoilée
        fillPts([[-34, -150], [-10, -152], [-12, -110], [-35, -110]], 'rgba(120,90,20,0.25)');
        hatch([[-50, -172], [-12, -172], [-10, 14], [-50, 14]], 0.75, 4.2, 0.3);
        shade(36, 0, -40, 0, 0.26);
      } },
      legB: legDef([-6, -2], MC.pantD, 9102, true, shoes(MC.chaus), 0.92),
      legF: legDef([6, -2], MC.pant, 9103, false, () => { for (const x of [-4]) strokePts([[x, 0], [x, 208]], 'rgba(255,255,255,0.12)', 1.6); shoes(MC.chaus)(); }, 0.92),
      armB_up: upDef([-10, -146], MC.chemD, 9104, () => { fillPts(rect(-18, 30, 18, 36), MC.brass); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28); }),
      armB_lo: foreDef('armB_up', MC.chemD, MC.peauD, true, 9105, { poignet: MC.chem }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: MC.peau, seed: 9106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[30, -80], [22, -92], [2, -100], [-24, -92], [-34, -72], [-35, -46], [-28, -34], [-20, -44], [-16, -62], [-4, -76], [16, -84]], MC.chev, 3);   // cheveux plaqués
        fillPts([[-6, -72], [2, -72], [3, -56], [-4, -52]], MC.chev);                                       // favori court
        X.earPaint(-9, -45);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.2);
        dot(16, -32, 8, 'rgba(205,130,110,0.18)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, MC.chev, 2.4);
        fillPts([[22, -34], [29, -36], [35, -35], [34, -31.5], [24, -31]], MC.chev, 0, 0.2);                // fine moustache
        X.mouth(f, 27, -25);
      } },
      casquette: { parent: 'head', at: [-2, -84], pts: MC_CAP, base: MC.cap, seed: 9107, noRivet: true, paint: capPaint(0, 0) },
      casquetteM: { parent: 'armF_lo', at: [2, 100], noRivet: true, base: MC.cap, seed: 9108, paint: capPaint(-CAP_GRIP[0], -CAP_GRIP[1]),
        pts: (p) => (p._capM ? tr(MC_CAP, -CAP_GRIP[0], -CAP_GRIP[1]) : OFFP) },
      armF_up: upDef([-2, -146], MC.chem, 9109, () => { fillPts(rect(-18, 30, 18, 36), MC.brass); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26); }),
      armF_lo: foreDef('armF_up', MC.chem, MC.peau, false, 9110, { poignet: MC.col }),
    };
    Object.assign(parts, heldParts(MC.peau, MC.peauD, 9120));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'mclean',
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'casquette', 'torso', 'casquetteM', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsD'] };
  }
  CH.conMclean = mkMclean();
  // options : ballants, menton, hanches, casquette (0,5 main à la casquette ; 1 levée au-dessus de la tête), trepigne (avec t)
  CON.mcleanPose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    const ba = ease(clamp(q.ballants || 0)), me = ease(clamp(q.menton || 0)), ha = ease(clamp(q.hanches || 0));
    const ch = clamp(q.casquette || 0), tp = clamp(q.trepigne || 0);
    if (ba > 0) { plier(q, 0.045 * ba); A.head = (A.head || 0) + 0.14 * ba; blend(q, 'armF_up', 0.06, ba); blend(q, 'armF_lo', -0.04, ba); blend(q, 'armB_up', -0.05, ba); blend(q, 'armB_lo', -0.03, ba); }
    if (ha > 0) {
      plier(q, -0.03 * ha); A.head = (A.head || 0) - 0.08 * ha;
      armTo(q, 'armF', [24, -34], 'arriere', ha); armTo(q, 'armB', [-36, -34], 'arriere', ha);
      if (q.face.mouth == null && ha > 0.5) q.face.mouth = 'smile';
    }
    if (me > 0) { A.head = (A.head || 0) + 0.05 * me; armTo(q, 'armF', headPt(q, 30, -6), 'bas', me); }
    if (tp > 0) {                                     // trépigne : le pied avant tape le plancher 2,5 fois par seconde (talon au sol à t = 0,4·k + 0,2)
      const u = Math.max(0, Math.sin(t * TAU * 2.5));
      A.legF = (A.legF || 0) - 0.34 * u * tp; q.dy = (q.dy || 0) - 4 * u * tp;
      blend(q, 'armF_up', 0.22, tp); blend(q, 'armF_lo', -0.25, tp); blend(q, 'armB_up', -0.2, tp); blend(q, 'armB_lo', -0.2, tp);
      if (q.face.brow == null) q.face.brow = 'frown'; if (q.face.mouth == null) q.face.mouth = 'tight';
    }
    if (ch > 0) {                                     // salut de la casquette, main OUVERTE posée sur la calotte
      const a = ease(clamp(ch / 0.5)), u = ease(clamp((ch - 0.5) / 0.5));
      const g = [-2 + CAP_GRIP[0], -84 + CAP_GRIP[1]];
      armTo(q, 'armF', headPt(q, g[0] + 12 * u, g[1] - 62 * u), 'bas', ch >= 0.5 ? 1 : a);
      if (!has(q.tenu)) q.handF = 'open';
      if (ch >= 0.5) { q.hide.casquette = 1; q._capM = 1; A.casquetteM = (A.head || 0) - (A.armF_up || 0) - (A.armF_lo || 0) - 0.1 * u; }
    }
    return finish(q);
  };
  CON.mclean = (pose, x, y, s, o) => run(CH.conMclean, CON.mcleanPose(pose), x, y, s == null ? 0.9 : s, Object.assign({ slot: M.ST.slotF, nom: 'mclean' }, o));

  // =====================================================================
  // LES DOCKERS — gestes communs : porte, tend (caisse ou balle), hisse + tire (corde), regardeCrochet, ballants
  // =====================================================================
  CON.DOCK = { cordeX: 64 };                       // x local (repère du personnage) de la corde quand il hisse
  function dockerPose(p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    const po = ease(clamp(q.porte || 0)), te = ease(clamp(q.tend || 0)), hi = ease(clamp(q.hisse || 0)), ti = clamp(q.tire || 0);
    const rc = ease(clamp(q.regardeCrochet || 0)), ba = ease(clamp(q.ballants || 0));
    if ((po > 0 || te > 0) && q.tenu == null) q.tenu = 'caisse';
    if ((po > 0 || te > 0) && q.deuxMains == null) q.deuxMains = true;
    if (ba > 0) { plier(q, 0.04 * ba); A.head = (A.head || 0) + 0.12 * ba; blend(q, 'armF_up', 0.05, ba); blend(q, 'armB_up', -0.05, ba); }
    if (po > 0) { plier(q, -0.04 * po); armTo(q, 'armF', [58, -44], 'bas', po); }
    if (te > 0) { plier(q, 0.03 * te); armTo(q, 'armF', [146, -98], 'bas', te); }
    if (hi > 0) {
      if (q.tenu == null) { q.tenu = 'corde'; q.tenuO = Object.assign({ haut: 440, bas: 30 }, q.tenuO); }
      if (q.tenuB == null) { q.tenuB = 'corde'; q.tenuBO = Object.assign({ haut: 10, bas: 150 }, q.tenuBO); }
      plier(q, -(0.06 + 0.06 * ti) * hi);
      const cx = CON.DOCK.cordeX;
      armTo(q, 'armF', [cx, lerp(-262, -182, ti)], 'bas', hi); armTo(q, 'armB', [cx, lerp(-176, -96, ti)], 'bas', hi);
      A.head = (A.head || 0) - 0.12 * hi;
    }
    if (rc > 0) {
      if (q.tenu == null) q.tenu = 'crochet';
      armTo(q, 'armF', [40, -66], 'bas', rc); A.head = (A.head || 0) + 0.36 * rc;
    }
    if (q.tenu === 'crochet') q.hide.crochetC = 1;
    return finish(q);
  }
  function crochetCeinture(p) { if (p.hide && p.hide.crochetC) return; const c = cx_(); c.save(); c.rotate(-0.2); c.scale(-1, 1); drawCrochet(); c.restore(); }

  // ---------------- DOCKER A — bonnet de laine bleu pétrole, tricot rayé crème et brun, pantalon gris, ceinture à crochet, barbe de trois jours
  const DA = { peau: '#d9ab85', peauD: '#bc8e69', creme: '#e3d7bb', cremeD: '#c6b996', brun: '#6e4b30', brunD: '#57391f', pant: '#6e6f6c', pantD: '#585956', botte: '#3a2a1e',
    bonnet: '#2f5d6a', bonnetD: '#234852', bonnetL: '#4a7d8b', ceint: '#2e2219', boucle: '#a3884a', poil: '#8a6a3a' };
  const DA_TORSO = [[-16, -178], [10, -182], [22, -170], [34, -150], [42, -116], [44, -66], [41, -18], [38, 12], [-38, 14], [-42, -30], [-44, -100], [-40, -150], [-28, -170]];
  const DA_HEAD = [[-16, 16], [12, 16], [16, 4], [24, -4], [31, -10], [33, -17], [31, -22], [33, -27], [32, -31], [36, -35], [43, -41, 1], [38, -50], [31, -58], [30, -66], [26, -78], [13, -92], [-8, -96], [-27, -88], [-35, -68], [-34, -46], [-27, -26], [-20, -8]];
  const DA_BONNET = [[-40, 12], [-43, -4], [-40, -26], [-26, -44], [-2, -52], [22, -48], [36, -34], [41, -14], [40, 12]];
  function mkDockerA() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: DA_TORSO, base: DA.creme, seed: 9201, paint: () => {
        for (let y = -164; y < -16; y += 20) fillPts(rect(-60, y, 60, y + 9), DA.brun);                 // rayures du tricot
        fillPts([[-14, -186], [10, -188], [22, -172], [10, -168], [-12, -172]], DA.cremeD);                // col rond côtelé
        for (let x = -10; x < 18; x += 4) strokePts([[x, -184], [x + 1, -172]], 'rgba(90,70,40,0.35)', 0.9);
        fillPts(rect(-50, -16, 50, -4), DA.ceint); fillPts(rect(-50, -4, 50, 24), DA.pant);                  // ceinture, pantalon
        strokePts(rect(18, -18, 30, -2).concat([[18, -18]]), DA.boucle, 1.6);
        hatch([[-54, -176], [-14, -176], [-12, 14], [-54, 14]], 0.75, 4.2, 0.3); shade(40, 0, -44, 0, 0.26);
      } },
      crochetC: { parent: 'torso', at: [-30, -8], pts: OFFP, base: '#000', seed: 9202, noRivet: true, extra: crochetCeinture },
      legB: legDef([-6, -2], DA.pantD, 9203, true, shoes(DA.botte, 196), 1),
      legF: legDef([6, -2], DA.pant, 9204, false, () => { shoes(DA.botte, 196)(); strokePts([[-18, 196], [18, 196]], 'rgba(255,255,255,0.18)', 2); }, 1),
      armB_up: upDef([-10, -146], DA.cremeD, 9205, () => { for (let y = 4; y < 100; y += 20) fillPts(rect(-20, y, 20, y + 9), DA.brunD); hatch(null, 0.9, 3.6, 0.3); }),
      armB_lo: foreDef('armB_up', DA.cremeD, DA.peauD, true, 9206, { rayures: DA.brunD, poignet: DA.cremeD }),
      head: { parent: 'torso', at: [6, -170], pts: DA_HEAD, base: DA.peau, seed: 9207, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-36, -76], [-16, -74], [-15, -56], [-24, -44], [-36, -48]], DA.poil);                     // cheveux sous le bonnet
        X.earPaint(-10, -44);
        hatch([[2, -30], [32, -14], [26, 6], [0, 14], [-12, -6], [-6, -26]], 0.35, 2.4, 0.4, 1, '70,60,50');   // barbe de trois jours
        dot(38, -40, 4, 'rgba(200,100,80,0.22)');
        X.eye(f, 18, -54); X.brow(f, 18, -62, '#5a4128', 3.6); X.mouth(f, 28, -22);
      } },
      bonnet: { parent: 'head', at: [-4, -78], pts: DA_BONNET, base: DA.bonnet, seed: 9208, noRivet: true, paint: () => {
        for (let x = -36; x < 40; x += 7) strokePts([[x, -46 + Math.abs(x) * 0.25], [x, 10]], 'rgba(10,30,36,0.35)', 1.1);   // côtes du tricot
        fillPts([[-42, -6], [40, -10], [41, 12], [-40, 12]], DA.bonnetD);                                 // revers
        for (let x = -38; x < 40; x += 5) strokePts([[x, -6], [x, 11]], 'rgba(120,170,180,0.3)', 1);
        shade(0, -52, 0, 12, 0.25, [-45, -55, 45, 14]);
      } },
      armF_up: upDef([-2, -146], DA.creme, 9209, () => { for (let y = 4; y < 100; y += 20) fillPts(rect(-20, y, 20, y + 9), DA.brun); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26); }),
      armF_lo: foreDef('armF_up', DA.creme, DA.peau, false, 9210, { rayures: DA.brun, poignet: DA.cremeD }),
    };
    Object.assign(parts, heldParts(DA.peau, DA.peauD, 9220));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'dockerA',
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'bonnet', 'torso', 'crochetC', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsD'] };
  }
  CH.conDockerA = mkDockerA();
  CON.dockerAPose = dockerPose;
  CON.dockerA = (pose, x, y, s, o) => run(CH.conDockerA, dockerPose(pose), x, y, s == null ? 0.9 : s, Object.assign({ slot: M.ST.slotF, nom: 'dockerA' }, o));

  // ---------------- DOCKER B — gavroche brune (casquette bouffante à bouton), salopette vert éteint, chemise rouille, grosse moustache noire en guidon, bedaine
  const DB = { peau: '#d4a07a', peauD: '#b6825e', chem: '#9c5a35', chemD: '#7f4729', salo: '#566b4a', saloD: '#45573b', saloL: '#6f8562', botte: '#241a14',
    cap: '#6a4a35', capD: '#523826', capL: '#87634a', moust: '#1f1a17', laiton: '#b08d45' };
  const DB_TORSO = [[-16, -178], [10, -182], [22, -170], [36, -150], [48, -120], [58, -86], [62, -50], [58, -16], [48, 12], [-40, 14], [-44, -30], [-46, -100], [-42, -150], [-30, -170]];
  const DB_HEAD = [[-16, 16], [12, 16], [18, 6], [26, -2], [32, -10], [34, -17], [31, -22], [34, -27], [33, -31], [38, -34], [48, -40, 1], [44, -48], [34, -54], [31, -60], [29, -68], [25, -80], [12, -93], [-8, -97], [-27, -89], [-35, -69], [-34, -46], [-28, -26], [-21, -8]];
  const DB_CAP = [[-42, 8], [-48, -6], [-48, -22], [-34, -38], [-4, -45], [28, -42], [48, -30], [55, -14], [50, -4], [62, 3], [64, 9, 1], [40, 10], [10, 10]];
  function mkDockerB() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: DB_TORSO, base: DB.chem, seed: 9301, paint: () => {
        fillPts([[4, -186], [20, -172], [16, -160], [4, -170]], DB.chemD);                                   // col de chemise
        fillPts([[4, -124], [38, -128], [52, -106], [60, -72], [63, -40], [58, -12], [48, 16], [-48, 18], [-48, -60], [-30, -68], [-6, -72], [2, -100]], DB.salo);   // salopette
        fillPts(rect(14, -114, 40, -88), DB.saloD); strokePts([[14, -114], [40, -114]], 'rgba(255,255,255,0.25)', 1.2);   // poche de bavette
        strokePts([[8, -120], [16, -60], [24, -10]], 'rgba(230,220,180,0.35)', 1);                            // piqûres
        strokePts([[32, -124], [18, -160], [0, -178], [-22, -174], [-38, -150], [-42, -100], [-40, -68]], DB.saloD, 6);   // bretelle
        dot(32, -122, 3.4, DB.laiton); dot(-40, -68, 3.2, DB.laiton);
        hatch([[-56, -176], [-14, -176], [-12, 16], [-56, 16]], 0.75, 4.2, 0.3); shade(52, -40, -44, 0, 0.28);
      } },
      crochetC: { parent: 'torso', at: [-36, -2], pts: OFFP, base: '#000', seed: 9302, noRivet: true, extra: crochetCeinture },
      legB: legDef([-6, -2], DB.saloD, 9303, true, shoes(DB.botte, 198), 1.08),
      legF: legDef([6, -2], DB.salo, 9304, false, () => { fillPts(rect(-24, 182, 24, 198), DB.saloL); shoes(DB.botte, 198)(); }, 1.08),
      armB_up: upDef([-10, -146], DB.chemD, 9305),
      armB_lo: foreDef('armB_up', DB.chemD, DB.peauD, true, 9306, { poignet: '#6a3a22' }),
      head: { parent: 'torso', at: [6, -170], pts: DB_HEAD, base: DB.peau, seed: 9307, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-36, -78], [-14, -76], [-14, -58], [-22, -44], [-30, -32], [-37, -36]], '#2a211c');
        X.earPaint(-10, -45);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        dot(22, -34, 10, 'rgba(200,95,75,0.28)'); dot(44, -42, 4, 'rgba(200,90,70,0.3)');
        X.eye(f, 18, -55); X.brow(f, 18, -64, DB.moust, 4.4);
        X.mouth(f, 30, -16);
        fillPts([[46, -36], [42, -28], [34, -24], [26, -22], [18, -26], [12, -24], [6, -28], [10, -35], [22, -38], [34, -40]], DB.moust, 6, 0.4);   // moustache en guidon
        strokePts([[8, -29], [2, -33], [0, -39], [4, -44]], DB.moust, 3.4);
        for (const x of [16, 24, 32, 40]) strokePts([[x + 2, -36], [x, -26]], 'rgba(255,255,255,0.15)', 1);
      } },
      casquette: { parent: 'head', at: [-2, -80], pts: DB_CAP, base: DB.cap, seed: 9308, noRivet: true, paint: () => {
        fillPts([[40, 2], [62, 3], [64, 9], [40, 10]], DB.capD);
        for (const a of [-0.9, -0.3, 0.3, 0.9]) strokePts([[-2, -44], [-2 + Math.sin(a) * 50, -44 + Math.cos(a) * 46]], 'rgba(40,25,15,0.45)', 1.1);   // panneaux de la gavroche
        dot(-2, -45, 3.6, DB.capD);
        hatch(null, 0.7, 3, 0.26); hatch(null, -0.7, 3, 0.16); shade(0, -46, 0, 10, 0.3, [-50, -50, 66, 12]);
      } },
      armF_up: upDef([-2, -146], DB.chem, 9309),
      armF_lo: foreDef('armF_up', DB.chem, DB.peau, false, 9310, { poignet: DB.chemD }),
    };
    Object.assign(parts, heldParts(DB.peau, DB.peauD, 9320));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'dockerB',
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'casquette', 'torso', 'crochetC', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsD'] };
  }
  CH.conDockerB = mkDockerB();
  CON.dockerBPose = dockerPose;
  CON.dockerB = (pose, x, y, s, o) => run(CH.conDockerB, dockerPose(pose), x, y, s == null ? 0.9 : s, Object.assign({ slot: M.ST.slotF, nom: 'dockerB' }, o));

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accRun(name, draw, x, y, s, o) {
    const r = M.puppet(accDef(name, draw), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.pt = (q) => r.w('o', q[0], q[1]);
    return r;
  }
  const withT = (o) => Object.assign({}, o || {});
  CON.caisse = (x, y, s, o) => { o = withT(o); const r = accRun('caisse', drawCaisse, x, y, s == null ? 0.9 : s, o); r.haut = r.pt([0, -108]); return r; };
  CON.balle = (x, y, s, o) => { o = withT(o); const r = accRun('balle', drawBalle, x, y, s == null ? 0.9 : s, o); r.haut = r.pt([0, -86]); return r; };
  CON.crochet = (x, y, s, o) => { o = withT(o); return accRun('crochet', drawCrochet, x, y, s == null ? 0.9 : s, o); };

  // ---------------- SABLIER (×1,3 ≈ 170 px) — (x,y) = milieu du socle ; avec chaise : sol sous le milieu de la chaise
  const SB = { bois: '#4a2f1e', boisL: '#6e4a2e', boisD: '#2f1d12', sable: '#c99a45', sableD: '#a87a30', sableL: '#e0b866', paille: '#d9bc6a', pailleD: '#b39446', ruban: '#7a2c22',
    toileR: '#b8443a', toile: '#efe6d2', chaise: '#a8835a', chaiseD: '#7d5f3c' };
  const NECK = -64, BUL = 50;
  const bulbW = (v) => 3 + 27 * Math.sin(Math.min(1, v * 1.3) * PI / 2);
  function glassPts() {
    const R = [], L = [];
    for (let i = 12; i >= 0; i--) { const v = i / 12; R.push([bulbW(v), NECK - BUL * v]); }
    for (let i = 1; i <= 12; i++) { const v = i / 12; R.push([bulbW(v), NECK + BUL * v]); }
    for (const p of R) L.push([-p[0], p[1]]);
    return R.concat(L.reverse());
  }
  const GLASS = glassPts();
  // sable du bulbe bas (posé sur le fond) : fraction f ; renvoie [pts, ySommet]
  function sandBas(f) {
    const hv = 0.8 * Math.pow(f, 0.85), v0 = 1 - hv, yT = NECK + BUL * v0, wT = bulbW(v0) - 1.5, mound = 7 * Math.min(1, f * 3);
    const pts = [];
    for (let i = 0; i <= 8; i++) { const v = 1 - hv * i / 8; pts.push([bulbW(v) - 1.5, NECK + BUL * v]); }
    for (let i = 1; i < 10; i++) { const x = wT - 2 * wT * i / 10; pts.push([x, yT - mound * (1 - Math.abs(x) / wT)]); }
    for (let i = 8; i >= 0; i--) { const v = 1 - hv * i / 8; pts.push([-(bulbW(v) - 1.5), NECK + BUL * v]); }
    return [pts, yT - mound];
  }
  // sable du bulbe haut (contre le col) : fraction f ; creux en entonnoir au centre
  function sandHaut(f, dip) {
    const hv = 0.82 * Math.pow(f, 0.62), yT = NECK - BUL * hv, wT = bulbW(hv) - 1.5;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const v = hv * i / 8; pts.push([bulbW(v) - 1.5, NECK - BUL * v]); }
    for (let i = 1; i < 10; i++) { const x = wT - 2 * wT * i / 10; pts.push([x, yT + dip * (1 - Math.abs(x) / wT)]); }
    for (let i = 8; i >= 0; i--) { const v = hv * i / 8; pts.push([-(bulbW(v) - 1.5), NECK - BUL * v]); }
    return pts;
  }
  function drawSablierSeul(o) {
    const t = o.t || 0, cou = clamp(o.coule == null ? 1 : o.coule), r = clamp(o.retourne || 0), c = cx_();
    c.save(); c.translate(0, NECK); c.rotate(PI * ease(r)); c.translate(0, -NECK);
    pc(rect(-3, -116, 3, -12), SB.boisD, null, 8401, { drop: false });                                     // montant arrière
    const flow = r < 0.02 && cou > 0.004 && cou < 0.996 && o.filet !== false;
    pc(GLASS, 'rgba(214,232,236,0.30)', () => {
      if (cou > 0.004) fillPts(sandHaut(cou, flow ? 6 : 0), SB.sable, 0, 0);
      let yB = NECK + BUL;
      if (cou < 0.996) { const [pts, y] = sandBas(1 - cou); fillPts(pts, SB.sable, 0, 0); hatch(pts, 0.6, 2.6, 0.18, 1, '120,80,20'); yB = y; }
      if (flow && !SIL()) {
        strokePts([[0, NECK - 2], [0, yB]], SB.sableD, 2.6);
        for (let i = 0; i < 5; i++) { const u = (t * 2.2 + i / 5) % 1; dot(Math.sin(i * 7 + t * 9) * 0.8, lerp(NECK, yB, u), 1.3, SB.sableL); }
      }
      strokePts([[-18, -110], [-26, -96], [-24, -80]], 'rgba(255,255,255,0.6)', 2.2);
      strokePts([[-20, -46], [-27, -32], [-24, -20]], 'rgba(255,255,255,0.5)', 2);
    }, 8402, { texA: 0.15, drop: false });
    for (const x of [-38, 38]) {                                                                              // montants tournés
      pc([[x - 2.5, -116], [x + 2.5, -116], [x + 3.5, -64], [x + 2.5, -12], [x - 2.5, -12], [x - 3.5, -64]], SB.boisL, () => strokePts([[x - 1, -112], [x - 1, -16]], 'rgba(255,230,190,0.3)', 1), 8403 + x, { drop: false });
      for (const y of [-100, -64, -28]) pc(ell(x, y, 4.6, 3.6, 10), SB.boisL, () => shade(x - 5, y, x + 5, y, 0.4, [x - 6, y - 7, x + 6, y + 7]), 8410 + x + y, { drop: false });
    }
    const plaque = (y0, y1, sd) => pc(rrect(-47, y0, 47, y1, 4), SB.bois, () => { strokePts([[-42, y0 + 3], [42, y0 + 3]], 'rgba(255,220,180,0.25)', 1.2); hatch(null, 0.15, 3, 0.25); }, sd);
    plaque(-128, -116, 8420); plaque(-12, 0, 8421);
    if (o.chapeau && r < 0.02) {                                                                             // canotier de paille
      c.save(); c.translate(4, -128); c.rotate(-0.14);
      pc(ell(0, -4, 44, 6, 18), SB.paille, () => hatch(null, 0.9, 2.6, 0.3, 1, '120,90,30'), 8430);
      pc([[-24, -4], [-23, -24, 1], [23, -26, 1], [24, -4]], SB.paille, () => { fillPts(rect(-26, -12, 26, -5), SB.ruban); hatch(null, -0.9, 2.6, 0.3, 1, '120,90,30'); }, 8431);
      c.restore();
    }
    c.restore();
  }
  // chaise longue rayée (repère : sol sous le milieu) ; 'fond' = pied arrière et toile, 'devant' = grand montant et barre d'assise
  const CH_P0 = [-84, -150], CH_P1 = [-20, -48], CH_P2 = [72, -60];
  function drawChaise() {
    const fr = (a, b, sd) => pc(seg(a, b, 9), SB.chaise, () => { strokePts([a, b], 'rgba(255,230,190,0.35)', 1.2); hatch(null, 1.4, 3, 0.15); }, sd);
    fr([-84, 0], [30, -86], 8441);                                                                          // pied arrière
    fr([-92, -160], [112, 0], 8443);                                                                        // grand montant
    const sl = qbez(CH_P0, CH_P1, CH_P2, 18), band = ribbon(sl, 24, 24);
    pc(band, SB.toile, () => {
      for (let i = 0; i < 18; i += 2) { const a = sl[i], b = sl[i + 1]; fillPts([[a[0] - 14, a[1] - 14], [b[0] - 14, b[1] - 14], [b[0] + 14, b[1] + 14], [a[0] + 14, a[1] + 14]], SB.toileR, 0, 0); }
      hatch(null, 0.8, 3, 0.15);
    }, 8442);
    fr([60, -62], [88, -62], 8444);
    for (const p of [[-23, -48], [-84, -150], [72, -62]]) M.rivet(p[0], p[1], 3.2);
  }
  // chaise à ×1,25 ; couché : centre du sablier à (15,-140), incliné de -1,03 rad (le haut vers le dossier) ; debout (couche 0) : à x +190
  function drawSablier(o) {
    const c = cx_();
    if (!o.chaise) { drawSablierSeul(o); return; }
    c.save(); c.scale(1.25, 1.25); drawChaise(); c.restore();
    const u = ease(clamp(o.couche || 0));
    c.save(); c.translate(lerp(190, 15, u), lerp(0, -140, u) - 50 * Math.sin(PI * u)); c.rotate(lerp(0, -1.03, u)); c.translate(0, lerp(0, 64, u));
    drawSablierSeul(Object.assign({}, o, { retourne: 0 })); c.restore();
  }
  CON.sablier = (x, y, s, o) => { o = withT(o); return accRun('sablier', drawSablier, x, y, s == null ? 1.3 : s, o); };

  // ---------------- GOÉLAND — (x,y) = pattes au sol ; etat 'debout' | 'dort' | 'eveil' ; vieux ; ailes 0..1 + bat (rad) ; t
  const GO = { blanc: '#eeebe4', blancD: '#cfcbc0', gris: '#9aa4aa', grisD: '#77828a', noir: '#26272a', bec: '#e2b33c', becD: '#b8862a', rouge: '#b8402f', patte: '#d79f86', canne: '#6b4a2e' };
  const GO_BODY = [[30, -58], [26, -44], [14, -32], [-6, -28], [-24, -34], [-44, -44], [-66, -54, 1], [-50, -58], [-30, -64], [-6, -70], [16, -70]];
  const GO_WING = [[18, -66], [8, -52], [-16, -44], [-44, -48], [-72, -57, 1], [-52, -63], [-24, -70], [4, -72]];
  const GO_OPEN = [[12, -66], [0, -58], [-30, -55], [-70, -57], [-112, -64, 1], [-84, -74], [-44, -80], [0, -75]];
  function goTete(hx, hy, o, vx, ev) {
    pc([[hx - 12, hy + 12], [hx + 10, hy + 22], [hx + 10, hy + 4], [hx - 6, hy - 2]], GO.blanc, null, 8501, { drop: false });   // cou
    pc(ell(hx, hy, 15, 14, 16), GO.blanc, () => { shade(hx - 13, hy, hx + 13, hy, 0.2, [hx - 14, hy - 14, hx + 14, hy + 14]); if (vx) hatch(null, 0.5, 3, 0.18); }, 8502, { drop: false });
    if (ev) for (let i = 0; i < 4; i++) { const a = -2.3 + i * 0.35; pc([[hx + Math.cos(a) * 11, hy + Math.sin(a) * 11], [hx + Math.cos(a) * 21, hy + Math.sin(a) * 21, 1], [hx + Math.cos(a + 0.2) * 11, hy + Math.sin(a + 0.2) * 11]], GO.blanc, null, 8503 + i, { drop: false }); }
    const op = ev ? 0.18 : 0;
    pc([[hx + 9, hy - 3], [hx + 28, hy], [hx + 31, hy + 4, 1], [hx + 26, hy + 5], [hx + 10, hy + 4]], vx ? '#d6b45e' : GO.bec, () => strokePts([[hx + 11, hy + 2], [hx + 28, hy + 3]], 'rgba(90,60,20,0.6)', 1), 8510, { drop: false });
    pc(rot([[hx + 10, hy + 4], [hx + 26, hy + 5], [hx + 22, hy + 9], [hx + 10, hy + 7]], hx + 10, hy + 4, op), vx ? '#cfae58' : GO.becD, () => dot(hx + 22, hy + 7, 2, GO.rouge), 8511, { drop: false });
    if (o.etat === 'dort') return;
    const ex = hx + 3, ey = hy - 3;
    dot(ex, ey, ev ? 3.8 : 2.8, '#f0d878'); dot(ex + 0.6, ey, ev ? 1.9 : 1.6, '#151515');
    strokePts(ev ? [[ex - 5, ey - 6], [ex + 5, ey - 7]] : [[ex - 5, ey - 4], [ex + 5, ey - 2]], 'rgba(60,60,64,0.8)', 1.4);
    if (vx) {                                                                                                  // vieux : sourcils de plumes tombants, lorgnon
      strokePts([[ex - 8, ey - 5], [ex, ey - 7], [ex + 8, ey - 3], [ex + 11, ey + 3]], '#f8f6f0', 3);
      strokePts(ell(ex + 1, ey + 0.5, 5.5, 5.5, 12).concat([[ex + 6.5, ey + 0.5]]), '#5a4a32', 1.2);
      strokePts([[ex - 4, ey + 2], [ex - 12, ey + 10]], '#5a4a32', 0.8);
    }
  }
  function goAile(a, open, far) {
    const pts = open ? rot(GO_OPEN, 12, -66, a) : GO_WING;
    pc(pts, far ? GO.grisD : GO.gris, () => {
      const tip = open ? rot([[-70, -57], [-112, -64], [-84, -74], [-62, -70]], 12, -66, a) : [[-44, -48], [-72, -57], [-52, -63], [-40, -58]];
      fillPts(tip, GO.noir, 0, 0);
      const sp = open ? rot([[-100, -66]], 12, -66, a)[0] : [-60, -57];
      dot(sp[0], sp[1], 2.4, '#f0eee8');
      hatch(null, 0.4, 4, 0.16);
    }, far ? 8520 : 8521);
  }
  function drawGoeland(o) {
    const t = o.t || 0, et = o.etat || 'debout', vx = !!o.vieux, c = cx_();
    const dort = et === 'dort', ev = et === 'eveil';
    const ai = dort ? 0 : clamp(o.ailes == null ? (ev ? 0.2 : 0) : o.ailes);
    const flap = ai > 0 ? Math.sin(o.bat || 0) * 0.5 * ai : 0, wa = (0.15 + 1.75 * ai) + flap;
    if (dort) {                                                                                                // boule de plumes posée, tête retournée sur le dos, bec glissé sous l'aile
      const br = 1 + 0.045 * Math.sin(t * 2.4);
      if (vx) pc(seg([34, 0], [26, -56], 5), GO.canne, null, 8530);
      c.save(); c.scale(1, br);
      pc([[-40, -30], [-66, -44], [-62, -34, 1], [-44, -18]], GO.blanc, () => fillPts([[-56, -40], [-66, -44], [-62, -34]], GO.noir), 8529);   // queue
      pc(ell(-6, -27, 42, 26, 22), GO.blanc, () => shade(0, -52, 0, -2, 0.28, [-50, -56, 40, 0]), 8531);
      pc([[2, -46], [-14, -44], [-18, -40], [0, -40]], GO.bec, () => dot(-12, -42, 1.6, GO.rouge), 8533, { drop: false });      // bec glissé vers l'arrière
      pc([[22, -40], [10, -50], [-14, -50], [-40, -44], [-62, -38, 1], [-44, -30], [-16, -26], [10, -28]], GO.gris, () => { fillPts([[-40, -44], [-62, -38], [-44, -30], [-36, -36]], GO.noir); dot(-48, -37, 2.2, '#f0eee8'); hatch(null, 0.4, 4, 0.16); }, 8534);
      pc(ell(16, -50, 15, 14, 16), GO.blanc, () => { strokePts([[6, -52], [11, -49], [16, -52]], 'rgba(40,40,40,0.85)', 1.5); if (vx) strokePts([[2, -57], [10, -59], [18, -55], [20, -50]], '#f8f6f0', 3); }, 8532);
      c.restore();
      return;
    }
    const hunch = vx ? 1 : 0;
    for (const [x0, x1, sd] of [[-8, -10, 8540], [4, 6, 8541]]) {
      pc(seg([x0, -30], [x1, -2], 3.6), GO.patte, null, sd, { drop: false });
      pc([[x1 - 5, 0], [x1 + 12, 0, 1], [x1 + 2, -5]], GO.patte, null, sd + 2, { drop: false });
    }
    if (ai > 0.04) goAile(wa + 0.3, true, true);
    pc(GO_BODY, GO.blanc, () => { shade(0, -70, 0, -26, 0.25, [-70, -75, 35, -20]); hatch([[30, -58], [14, -32], [-6, -28], [-6, -50]], 0.6, 3.4, 0.12); }, 8550);
    const hx = ev ? 28 : vx ? 32 : 24, hy = ev ? -96 : vx ? -74 : -84;
    goTete(hx, hy + 0 * hunch, o, vx, ev);
    if (ai > 0.04) goAile(wa, true, false); else goAile(0, false, false);
    if (vx) {                                                                                                  // canne tenue par le bout de l'aile
      pc(seg([48, 0], [42, -44], 5), GO.canne, () => strokePts([[47, -4], [43, -40]], 'rgba(255,230,190,0.3)', 1), 8560);
      pc(ep(34, -44, 10, 8, 8, PI, TAU).concat(ep(34, -44, 5, 3.5, 8, TAU, PI)), GO.canne, null, 8561);
    }
  }
  CON.goeland = (x, y, s, o) => { o = withT(o); return accRun('goeland', drawGoeland, x, y, s == null ? 1.1 : s, o); };

  // ---------------- CAMION 1937 — (x,y) = sol sous le milieu ; cabine à droite (dir:1) ; charge 0..5 balles ; phares 0..1 (s'affaissent) ; klaxon 0..1 ; roule (px)
  const CA = { vert: '#4f6a52', vertD: '#3c5340', vertL: '#6a856b', chassis: '#24211f', pneu: '#1c1a19', jante: '#b8a46e', bois: '#8a6a42', boisD: '#634a2c', chrome: '#b4b6b0', verre: '#9fb3b8', phare: '#efe3b0' };
  const CAM_R = 34, CAM_BALLES = [[-165, -100], [-87, -100], [-9, -100], [-126, -154], [-48, -154]];
  function roue(cx, cy, R, ang, sd) {
    pc(ell(cx, cy, R, R, 22), CA.pneu, () => { strokePts(ell(cx, cy, R - 6, R - 6, 22).concat([[cx + R - 6, cy]]), 'rgba(255,255,255,0.12)', 1.4); }, sd);
    pc(ell(cx, cy, R * 0.56, R * 0.56, 18), CA.jante, () => {
      for (let k = 0; k < 6; k++) { const a = ang + k * PI / 3; dot(cx + Math.cos(a) * R * 0.38, cy + Math.sin(a) * R * 0.38, 2.4, '#6b5a30'); }
      shade(cx - R, cy - R, cx + R, cy + R, 0.3, [cx - R, cy - R, cx + R, cy + R]);
    }, sd + 1);
    dot(cx, cy, 5, '#4a3e22');
  }
  function drawCamion(o) {
    const k = clamp(o.klaxon || 0), ph = clamp(o.phares || 0), ang = (o.roule || 0) / CAM_R, c = cx_();
    const n = o.charge == null ? 5 : Math.max(0, Math.min(5, o.charge | 0));
    pc(ep(-125, -40, 46, 30, 10, PI, TAU), CA.chassis, null, 8601);
    roue(-125, -CAM_R, CAM_R, ang, 8602); roue(128, -CAM_R, CAM_R, ang, 8604);
    const lift = -9 * Math.sin(PI * k);
    c.save(); c.translate(0, lift); c.translate(128, -CAM_R); c.rotate(-0.025 * Math.sin(PI * k)); c.translate(-128, CAM_R);
    pc(rect(-206, -64, 204, -50), CA.chassis, null, 8606);
    pc(rect(-212, -80, 40, -62), CA.boisD, () => strokePts([[-212, -72], [40, -72]], 'rgba(0,0,0,0.3)', 1), 8607);       // plateau
    for (let i = 0; i < n; i++) {
      const [bx, by] = CAM_BALLES[i]; c.save(); c.translate(bx, by + 18); c.scale(0.62, 0.62); drawBalle({ seed: i * 7 }); c.restore();
    }
    pc(rect(-212, -100, 40, -78), CA.bois, () => { for (const y of [-93, -86]) strokePts([[-212, y], [40, y]], 'rgba(40,25,10,0.4)', 1); hatch(null, 0.2, 4, 0.18); }, 8608);   // ridelle
    for (const x of [-206, -128, -50, 30]) pc(rect(x - 4, -110, x + 4, -64), CA.boisD, null, 8610 + x, { drop: false });
    // cabine et capot
    pc([[40, -62], [40, -184], [50, -198], [104, -198], [113, -186], [115, -132], [119, -62]], CA.vert, () => {
      fillPts(rrect(54, -182, 102, -140, 5), CA.verre); strokePts([[60, -176], [72, -150]], 'rgba(255,255,255,0.45)', 2);
      strokePts([[46, -136], [112, -134], [114, -66]], 'rgba(20,30,20,0.5)', 1.3); dot(100, -122, 2.6, CA.chrome);
      hatch(null, 0.8, 4.2, 0.18); shade(40, -198, 40, -62, 0.25, [36, -200, 120, -60]);
    }, 8620);
    pc([[112, -134], [194, -130], [204, -122], [206, -62], [116, -62]], CA.vert, () => {
      for (let x = 132; x < 186; x += 8) strokePts([[x, -122], [x, -98]], 'rgba(20,30,20,0.55)', 1.4);
      hatch(null, 0.8, 4.2, 0.18); shade(112, -134, 112, -62, 0.22, [110, -136, 208, -60]);
    }, 8621);
    pc(rect(198, -132, 211, -66), CA.chrome, () => { for (let y = -128; y < -68; y += 6) strokePts([[199, y], [210, y]], 'rgba(40,40,40,0.5)', 1); }, 8622);   // calandre
    pc(ep(128, -40, 56, 46, 14, PI, TAU).concat([[188, -54], [184, -54]], ep(128, -40, 44, 36, 14, TAU, PI), [[70, -54], [66, -54]]), CA.vertD, () => hatch(null, 0.5, 3.6, 0.2), 8623);   // aile avant
    pc(rect(40, -68, 82, -58), CA.chassis, null, 8624);
    pc(rect(204, -76, 216, -62), CA.chrome, null, 8625);
    // phare : pivote vers le sol quand il s'affaisse (paupière de tôle)
    c.save(); c.translate(176, -136); c.rotate(0.85 * ph);
    pc(ell(8, 0, 15, 16, 18), CA.chrome, () => {
      fillPts(ell(13, 0, 10, 12, 16), CA.phare); dot(15, -4, 3, 'rgba(255,255,255,0.8)');
      if (ph > 0) fillPts([[-8, -18], [26, -18], [26, -18 + 24 * ph], [-8, -18 + 20 * ph]], CA.vertD, 0, 0);
    }, 8626);
    c.restore();
    pc(rect(166, -124, 176, -116), CA.chassis, null, 8627, { drop: false });
    if (k > 0.02 && !SIL()) {                                                                                  // klaxon : ondes de papier
      c.save(); c.lineCap = 'round'; c.lineWidth = 3 * M._lw();
      for (let i = 0; i < 3; i++) { const rr = 18 + i * 14 + 10 * k; c.strokeStyle = `rgba(250,240,215,${0.85 * k * (1 - i * 0.25)})`; c.beginPath(); c.arc(214, -104, rr, -0.6, 0.6); c.stroke(); }
      c.restore();
    }
    c.restore();
  }
  CON.CAMION = { long: 428, cabine: [40, 119], balles: CAM_BALLES, phare: [184, -134], klaxon: [214, -104] };
  CON.camion = (x, y, s, o) => {
    o = withT(o); s = s == null ? 1 : s;
    const r = accRun('camion', drawCamion, x, y, s, o), n = o.charge == null ? 5 : Math.max(0, Math.min(5, o.charge | 0));
    const lift = -9 * Math.sin(PI * clamp(o.klaxon || 0));
    const top = n >= 5 ? [-48, -189] : n === 4 ? [-126, -189] : n >= 1 ? [CAM_BALLES[n - 1][0], -135] : [-87, -80];
    r.dessus = r.pt([top[0], top[1] + lift]); r.phare = r.pt([184, -134 + lift]); r.klaxon = r.pt([214, -104 + lift]);
    return r;
  };

  // ---------------- CONTENEUR — 280 × 120 à s 1 ; (x,y) = milieu du bas ; couleur 'rouge'|'bleu'|'ocre'|'vert'|'#hex' ; ruban 0..1 ; scelle
  const CT = { rouge: ['#9a3b2e', '#b8574a', '#6e281f'], bleu: ['#3f5a78', '#5b7899', '#2b3f56'], ocre: ['#b58a2c', '#d1a84a', '#86651c'], vert: ['#566b4a', '#738a64', '#3d4d34'] };
  const ctCols = (c) => CT[c] || (typeof c === 'string' && c[0] === '#' ? [c, M.mixc(c, '#ffffff', 0.2), M.mixc(c, '#000000', 0.3)] : CT.rouge);
  CON.COULEURS = ['rouge', 'bleu', 'ocre', 'vert'];
  function drawConteneur(o) {
    const C3 = ctCols(o.couleur), sd = 8700 + (CON.COULEURS.indexOf(o.couleur) + 1) * 13;
    pc(rect(-140, -120, 140, 0), C3[0], () => {
      for (let x = -124; x <= 124; x += 12) { fillPts(rect(x - 3, -110, x + 1, -10), C3[1], 0, 0); fillPts(rect(x + 1, -110, x + 4, -10), C3[2], 0, 0); }
      for (let i = 0; i < 7; i++) strokePts([[-120 + hash(i + sd) * 200, -100 + hash(i * 3 + sd) * 30], [-110 + hash(i * 3 + sd) * 220, -60 + hash(i * 5 + sd) * 40]], 'rgba(120,70,30,0.12)', 3);   // patine
      hatch(null, 1.3, 5, 0.1); shade(0, -120, 0, 0, 0.3, [-140, -120, 140, 0]);
    }, sd);
    const rail = (pts, k) => pc(pts, C3[2], () => hatch(null, 0.3, 3, 0.15), sd + k, { drop: false });
    rail(rect(-140, -120, 140, -110), 1); rail(rect(-140, -10, 140, 0), 2); rail(rect(-140, -120, -128, 0), 3); rail(rect(128, -120, 140, 0), 4);
    for (const [x, y] of [[-140, -120], [126, -120], [-140, -14], [126, -14]]) { pc(rect(x, y, x + 14, y + 14), '#3a3a3c', null, sd + 5, { drop: false }); dot(x + 7, y + 7, 3, '#141416'); }
    const rb = clamp(o.ruban || 0);
    if (rb > 0) {
      const RO = '#d77a9a', ROD = '#a9506f', v = ease(clamp(rb * 2)), h = ease(clamp(rb * 2 - 0.6)), b = ease(clamp((rb - 0.6) / 0.4));
      pc(rect(-9, -122, 9, -122 + 124 * v), RO, () => strokePts([[-4, -120], [-4, 0]], 'rgba(255,255,255,0.35)', 1.2), 8790, { drop: false });
      if (h > 0) pc(rect(-142, -69, -142 + 284 * h, -51), RO, () => strokePts([[-140, -64], [140, -64]], 'rgba(255,255,255,0.35)', 1.2), 8791, { drop: false });
      if (b > 0) {
        const c = cx_(); c.save(); c.translate(0, -122); c.scale(b, b);
        pc([[0, 0], [-40, -30], [-46, -12], [-10, -2]], RO, () => fillPts([[-6, -4], [-30, -18], [-34, -10]], ROD), 8792);
        pc([[0, 0], [40, -30], [46, -12], [10, -2]], RO, () => fillPts([[6, -4], [30, -18], [34, -10]], ROD), 8793);
        pc([[-4, 2], [-20, 30], [-12, 32], [0, 6]], ROD, null, 8794); pc([[4, 2], [20, 30], [12, 32], [0, 6]], ROD, null, 8795);
        pc(ell(0, -2, 8, 7, 12), ROD, null, 8796);
        c.restore();
      }
    }
    if (o.scelle) {                                                                                            // scellé rose (rosette de cire) sur le montant de porte
      pc([[124, -66], [118, -40], [124, -42], [128, -38], [130, -64]], '#a9506f', null, 8797);
      pc(ell(126, -70, 13, 13, 16), '#d77a9a', () => { strokePts(ell(126, -70, 8, 8, 12).concat([[134, -70]]), '#a9506f', 1.6); dot(122, -74, 2.4, 'rgba(255,255,255,0.5)'); }, 8798);
    }
  }
  CON.conteneur = (x, y, s, o) => { o = withT(o); const r = accRun('conteneur', drawConteneur, x, y, s == null ? 1 : s, o); r.haut = r.pt([0, -120]); return r; };

  // ---------------- GRUE PORTIQUE — charpente pré-rendue (CON.K.grue[couleur]) + chariot, câbles, palonnier, conteneur (vivants)
  const GC = { orange: ['#c0703a', '#d88e58', '#8e4f26'], gris: ['#6d7a80', '#8b979c', '#4e585d'], jaune: ['#c9a43c', '#dfc067', '#977a26'], bleu: ['#4c6f8c', '#6a8ba6', '#365169'] };
  CON.GRUE = { rail: 0, fleche: -760, chariotMin: -380, chariotMax: 560, palMin: -700, palMax: -30, haut: -1010, pieds: [-200, 200] };
  function drawGrueCharpente(col) {
    const G = GC[col] || GC.orange, P3 = (pts, k, base) => pc(pts, base || G[0], () => { hatch(null, 0.8, 4, 0.16); }, 8800 + k);
    pc(rect(-640, -8, 640, 2), '#3a3a3c', () => strokePts([[-640, -6], [640, -6]], 'rgba(255,255,255,0.25)', 1), 8801);   // rails
    for (const bx of [-200, 200]) {
      P3(rect(bx - 44, -36, bx + 44, -10), 2, G[2]);
      for (const wx of [-30, -10, 10, 30]) { pc(ell(bx + wx, -9, 8, 8, 10), '#2a2a2c', null, 8803); dot(bx + wx, -9, 2.4, '#8a8a86'); }
    }
    P3([[-216, -36], [-186, -36], [-148, -770], [-176, -770]], 4); P3([[186, -36], [216, -36], [176, -770], [148, -770]], 5);   // jambes
    P3(rect(-190, -428, 190, -402), 6, G[2]);                                                                       // traverse
    P3(seg([-178, -420], [150, -748], 12), 7); P3(seg([178, -420], [-150, -748], 12), 8);                          // croix de Saint-André
    for (let y = -400; y > -760; y -= 22) strokePts([[-206 + (y + 36) * -0.04, y], [-186 + (y + 36) * -0.04, y]], 'rgba(30,30,30,0.6)', 1.6);   // échelle
    // A de tête et haubans
    P3(seg([-150, -800], [-26, -1010], 16), 9); P3(seg([150, -800], [-10, -1010], 16), 10);
    pc(seg([-18, -1004], [630, -806], 5), '#3a3a3c', null, 8811, { drop: false }); pc(seg([-18, -1004], [-440, -806], 5), '#3a3a3c', null, 8812, { drop: false });
    pc(ell(-18, -1006, 12, 12, 12), G[2], null, 8813);
    // flèche en treillis : membrures + montants + diagonales
    P3(rect(-450, -812, 630, -796), 14); P3([[-450, -770], [610, -770], [640, -796], [630, -796], [604, -756], [-450, -756]], 15);
    for (let x = -440; x < 600; x += 70) { P3(seg([x, -798], [x, -770], 6), 16); P3(seg([x, -770], [x + 70, -798], 6), 17); }
    // salle des machines (arrière)
    pc(rect(-440, -890, -260, -812), '#d6d0c0', () => { fillPts(rect(-440, -890, -260, -878), G[0]); for (const x of [-420, -380, -340]) fillPts(rect(x, -864, x + 24, -840), '#3c4a52'); fillPts(rect(-300, -870, -276, -812), '#8a8478'); hatch(null, 0.9, 4, 0.12); }, 8818);
  }
  function drawGrueVive(o) {
    const G = GC[o.couleur] || GC.orange, cxp = clamp(o.chariot == null ? 0 : o.chariot, CON.GRUE.chariotMin, CON.GRUE.chariotMax);
    const palY = clamp(o.bas != null ? o.bas - 136 : (o.palonnier == null ? -420 : o.palonnier), CON.GRUE.palMin, CON.GRUE.palMax), c = cx_();
    pc(rect(cxp - 38, -756, cxp + 38, -726), '#3a3e40', () => { fillPts(rect(cxp - 38, -742, cxp + 38, -736), G[0]); }, 8830);   // chariot
    for (const wx of [-26, 26]) dot(cxp + wx, -758, 5, '#1d1d1f');
    pc(rrect(cxp - 30, -726, cxp + 6, -688, 4), '#d8d2c2', () => { fillPts(rect(cxp - 24, -718, cxp, -700), '#4a6a7c'); strokePts([[cxp - 22, -716], [cxp - 14, -704]], 'rgba(255,255,255,0.5)', 1.4); }, 8831);   // cabine du grutier
    c.save(); c.translate(cxp + 14, -726); c.rotate(o.balance || 0); c.translate(-(cxp + 14), 726);
    const hb = palY - 22;
    for (const dx of [-12, 12]) pc([[cxp + 14 + dx * 0.5 - 1.5, -726], [cxp + 14 + dx * 0.5 + 1.5, -726], [cxp + dx + 1.5, hb], [cxp + dx - 1.5, hb]], '#26292b', null, 8832, { drop: false });   // câbles
    pc(rect(cxp - 20, hb, cxp + 20, palY - 2), '#2f3335', () => dot(cxp, hb + 10, 4, '#8a8a86'), 8834);
    pc(rect(cxp - 148, palY - 4, cxp + 148, palY + 14), G[2], () => { for (let x = cxp - 140; x < cxp + 140; x += 24) fillPts(rect(x, palY - 4, x + 12, palY + 14), '#2a2a2a', 0, 0); }, 8835);   // palonnier
    for (const dx of [-138, 132]) pc(rect(cxp + dx, palY + 14, cxp + dx + 6, palY + 20), '#2a2a2a', null, 8836, { drop: false });
    if (o.charge) { c.save(); c.translate(cxp, palY + 136); drawConteneur(o.charge === true ? {} : o.charge); c.restore(); }
    c.restore();
  }
  CON.grue = (x, y, s, o) => {
    o = withT(o); s = s == null ? 0.55 : s;
    if (!CON.K) throw new Error('CON.grue : appeler CON.init() dans S.init');
    M.flat(CON.K.grue[o.couleur] || CON.K.grue.orange, x, y, { scale: s, cast: o.cast, alpha: o.alpha });
    const r = accRun('grue', drawGrueVive, x, y, s, Object.assign({}, o, { cast: o.cast }));
    const cxp = clamp(o.chariot == null ? 0 : o.chariot, CON.GRUE.chariotMin, CON.GRUE.chariotMax);
    const palY = clamp(o.bas != null ? o.bas - 136 : (o.palonnier == null ? -420 : o.palonnier), CON.GRUE.palMin, CON.GRUE.palMax);
    const b = o.balance || 0, pv = [cxp + 14, -726], R = (p) => rot([p], pv[0], pv[1], b)[0];
    r.palonnier = r.pt(R([cxp, palY + 14])); r.conteneur = r.pt(R([cxp, palY + 136])); r.chariot = r.pt([cxp, -740]);
    return r;
  };

  // ---------------- NAVIRE IDEAL X — coque pré-rendue (CON.K.navire) + pont à conteneurs, conteneurs, fumée (vivants) ; (x,y) = ligne de flottaison, milieu
  CON.NAVIRE = { long: 1560, pont: -232, charpente: -252, slots: [[-290, -252], [0, -252], [290, -252], [-290, -374], [0, -374], [290, -374]], cheminee: [-570, -585], proue: 780, poupe: -760 };
  function drawNavireCoque() {
    const hull = [[-760, -236], [-700, -232], [0, -232], [560, -244], [700, -262], [784, -280, 1], [744, -120], [700, 30], [660, 44, 1], [-690, 44, 1], [-740, 20], [-768, -40], [-776, -150]];
    pc(hull, '#1e1e22', () => {
      fillPts([[-800, -18], [800, -18], [800, 80], [-800, 80]], '#8e3229');                                          // œuvres vives rouges
      strokePts([[-800, -20], [800, -20]], 'rgba(240,235,220,0.7)', 2.4);
      strokePts([[-760, -226], [0, -226], [560, -238], [700, -256], [780, -272]], 'rgba(240,235,220,0.75)', 2.2);       // liston blanc
      for (let x = -720; x < 700; x += 60) strokePts([[x, -224], [x, -22]], 'rgba(120,120,130,0.18)', 1.2);           // tôles
      for (const x of [-700, -660, -620, -580]) dot(x, -190, 4.5, '#cfc9b6');
      pc([[716, -220], [732, -220], [736, -204], [714, -204]], '#3a3a3e', null, 8901, { drop: false });             // écubier
      hatch(null, 0.15, 6, 0.12, 1, '200,200,210'); shade(0, -240, 0, 44, 0.35, [-800, -300, 800, 60]);
    }, 8900);
    // château arrière (passerelle blanche) et cheminée noire à bande rouge
    pc([[-740, -232], [-740, -330, 1], [-470, -330, 1], [-470, -232]], '#e8e4d8', () => { for (let x = -720; x < -480; x += 34) fillPts(rect(x, -306, x + 18, -292), '#3c4a52'); hatch(null, 0.9, 4, 0.1); }, 8902);
    pc([[-716, -330], [-716, -412, 1], [-492, -412, 1], [-492, -330]], '#efebe0', () => { fillPts(rect(-716, -412, -492, -404), '#b9b3a3'); for (let x = -700; x < -500; x += 26) fillPts(rect(x, -392, x + 16, -372), '#3c4a52'); hatch(null, 0.9, 4, 0.1); }, 8903);
    pc([[-680, -412], [-680, -466, 1], [-520, -466, 1], [-520, -412]], '#efebe0', () => { fillPts(rect(-670, -450, -530, -430), '#3c4a52'); for (let x = -660; x < -530; x += 22) strokePts([[x, -450], [x, -430]], '#efebe0', 2); }, 8904);
    pc(rect(-694, -472, -506, -464), '#b9b3a3', null, 8905);
    pc([[-600, -466], [-596, -590, 1], [-540, -590, 1], [-536, -466]], '#1e1e22', () => { fillPts(rect(-600, -560, -536, -544), '#8e3229'); hatch(null, 0.9, 4, 0.12, 1, '200,200,210'); }, 8906);
    // mâts
    pc(rect(632, -560, 640, -262), '#3a3a3e', null, 8907); pc(rect(604, -500, 668, -494), '#3a3a3e', null, 8908);
    pc(rect(-640, -560, -634, -472), '#3a3a3e', null, 8909);
    strokePts([[636, -556], [780, -276]], 'rgba(30,30,30,0.6)', 1.2); strokePts([[636, -556], [-500, -470]], 'rgba(30,30,30,0.45)', 1);
  }
  function drawNavireVif(o) {
    const t = o.t || 0, c = cx_();
    if (o.charpente !== false) {                                                                               // pont à conteneurs (spar deck) de l'Ideal X
      pc(rect(-450, -256, 450, -242), '#6c6f6e', () => strokePts([[-450, -250], [450, -250]], 'rgba(255,255,255,0.25)', 1), 8920);
      for (let x = -440; x <= 440; x += 88) pc(rect(x - 3, -242, x + 3, -228), '#55585a', null, 8921, { drop: false });
    }
    const n = o.nombre == null ? 6 : Math.max(0, Math.min(6, o.nombre | 0)), cols = o.couleurs || ['rouge', 'bleu', 'ocre', 'vert', 'bleu', 'rouge'];
    for (let i = 0; i < n; i++) { const [sx, sy] = CON.NAVIRE.slots[i]; c.save(); c.translate(sx, sy); drawConteneur(Object.assign({ couleur: cols[i % cols.length] }, o.conteneurO || {})); c.restore(); }
    const fu = clamp(o.fumee == null ? 0.6 : o.fumee);
    if (fu > 0 && !SIL()) {
      const [fx, fy] = CON.NAVIRE.cheminee;
      for (let i = 0; i < 6; i++) { const u = (t * 0.22 + i / 6) % 1; c.beginPath(); c.arc(fx - 150 * u + 10 * Math.sin(t + i), fy - 130 * u, 14 + 34 * u, 0, TAU); c.fillStyle = `rgba(110,108,104,${0.38 * fu * (1 - u)})`; c.fill(); }
    }
  }
  CON.navire = (x, y, s, o) => {
    o = withT(o); s = s == null ? 0.5 : s;
    if (!CON.K) throw new Error('CON.navire : appeler CON.init() dans S.init');
    M.flat(CON.K.navire, x, y, { scale: s, cast: o.cast, alpha: o.alpha });
    const r = accRun('navire', drawNavireVif, x, y, s, Object.assign({}, o, { cast: null }));
    r.slot = (i) => r.pt(CON.NAVIRE.slots[i]);
    return r;
  };

  // ---------------- BATEAU-POMPE lointain — (x,y) = flottaison, milieu ; jets 0..1 ; t
  function drawPompe(o) {
    const t = o.t || 0, j = clamp(o.jets == null ? 1 : o.jets), c = cx_();
    pc([[-90, -30], [70, -30], [96, -44, 1], [80, 4], [-80, 4], [-92, -20]], '#9a3b2e', () => { fillPts(rect(-100, -8, 100, 8), '#26262a'); strokePts([[-90, -26], [80, -26]], 'rgba(255,255,255,0.5)', 1.6); }, 8950);
    pc(rect(-50, -70, 20, -30), '#e8e4d8', () => { for (const x of [-42, -20]) fillPts(rect(x, -62, x + 14, -50), '#3c4a52'); }, 8951);
    pc(rect(-30, -96, -12, -70), '#9a3b2e', null, 8952);
    for (const [nx, a0] of [[40, -0.9], [-60, -2.3]]) pc(seg([nx, -30], [nx + Math.cos(a0) * 16, -30 + Math.sin(a0) * 16], 6), '#b4b6b0', null, 8953);
    if (j > 0 && !SIL()) {
      c.save(); c.lineCap = 'round';
      for (const [nx, vx] of [[52, 160], [-70, -150]]) {
        for (let i = 0; i < 18; i++) { const u = ((t * 1.4 + i / 18) % 1), X0 = nx + vx * u, Y0 = -44 - 190 * u + 210 * u * u; c.beginPath(); c.arc(X0, Y0, 3 + 4 * u, 0, TAU); c.fillStyle = `rgba(225,238,245,${0.75 * j * (1 - u * 0.7)})`; c.fill(); }
      }
      c.restore();
    }
  }
  CON.bateauPompe = (x, y, s, o) => { o = withT(o); return accRun('pompe', drawPompe, x, y, s == null ? 0.4 : s, o); };

  // =====================================================================
  // DÉCORS — quai de 1937 (New Jersey) et port de Newark 1956
  // =====================================================================
  const W = M.W;
  function paper(x, w, h, ox, oy, a) { if (!M.tex || !M.tex.paperPat) return; x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = a; x.fillStyle = M.tex.paperPat; x.fillRect(-ox, -oy, w, h); x.restore(); }
  function toile(x, stops, seed, H) {
    const g = x.createLinearGradient(0, 0, 0, H); for (const [o, col] of stops) g.addColorStop(o, col);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const R = M.rng(seed);
    for (let i = 0; i < 200; i++) {
      const cx = R() * W, cy = R() * H * 0.8, l = 40 + R() * 160;
      x.strokeStyle = `rgba(${R() < 0.5 ? '255,245,225' : '60,50,40'},${0.03 + R() * 0.04})`; x.lineWidth = 6 + R() * 18; x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + l / 2, cy + (R() - 0.5) * 20, cx + l, cy + (R() - 0.5) * 12); x.stroke();
    }
  }
  function eau(x, y0, y1, c0, c1, seed, sale) {
    const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1);
    x.fillStyle = g; x.fillRect(0, y0, W, y1 - y0);
    const R = M.rng(seed);
    for (let i = 0; i < 90; i++) { const yy = y0 + 6 + R() * (y1 - y0 - 10), xx = R() * W, l = 20 + R() * 70 * (0.4 + (yy - y0) / (y1 - y0)); x.strokeStyle = `rgba(235,230,210,${0.12 + R() * 0.15})`; x.lineWidth = 1.5 + R() * 1.5; x.beginPath(); x.moveTo(xx, yy); x.quadraticCurveTo(xx + l / 2, yy - 3, xx + l, yy); x.stroke(); }
    if (sale) for (let i = 0; i < 12; i++) { const xx = R() * W, yy = y0 + 20 + R() * (y1 - y0 - 30); const g2 = x.createRadialGradient(xx, yy, 2, xx, yy, 40); g2.addColorStop(0, 'rgba(150,120,170,0.18)'); g2.addColorStop(0.5, 'rgba(120,160,120,0.12)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g2; x.save(); x.translate(xx, yy); x.scale(1, 0.25); x.translate(-xx, -yy); x.fillRect(xx - 40, yy - 40, 80, 80); x.restore(); }
  }
  CON.QUAI = { eau: 1170, entrepot: [-560, -150], porte: { dx: -400, w: 170, h: 330 }, bollards: [120, 400], tonneaux: 250 };
  function makeQuaiCiel() {
    const H = M.ST.back + 5;
    return M.pre(W, H, (x) => {
      toile(x, [[0, '#6d6a5a'], [0.4, '#a59a74'], [0.72, '#d4c08a'], [1, '#d9c690']], 37, H);
      const R = M.rng(371);
      for (let i = 0; i < 6; i++) { const cx = R() * W, cy = 320 + R() * 520, w = 220 + R() * 260, pts = []; for (let k = 0; k <= 12; k++) { const a = PI + k * PI / 12; pts.push([cx + Math.cos(a) * w / 2, cy + Math.sin(a) * (30 + 20 * hash(i * 9 + k))]); } pts.push([cx + w * 0.4, cy + 8], [cx - w * 0.4, cy + 8]); piece(pts, M.mixc('#b3a882', '#e6d7a6', clamp((cy - 300) / 600)), () => hatch(null, 0.2, 6, 0.08), { seed: 380 + i, texA: 0.5 }); }
      // rive lointaine : entrepôts et gratte-ciel pâles (sans enseigne)
      const sky = [[0, 1172]]; let xx = 0; const R2 = M.rng(372);
      while (xx < W) { const w = 30 + R2() * 60, h = 20 + R2() * 45 + (xx > 600 && xx < 900 ? 60 * R2() : 0); sky.push([xx, 1172 - h], [xx + w, 1172 - h]); if (xx > 680 && xx < 760) sky.push([xx + w / 2 - 5, 1172 - h], [xx + w / 2, 1172 - h - 50], [xx + w / 2 + 5, 1172 - h]); xx += w; }
      sky.push([W, 1172]);
      piece(sky.map((p) => [p[0], p[1], 1]), '#b9b399', () => { x.fillStyle = 'rgba(80,80,70,0.2)'; for (let i = 0; i < 80; i++) x.fillRect(R2() * W, 1080 + R2() * 80, 3, 5); }, { seed: 373, texA: 0.4, drop: false });
      eau(x, 1170, H, '#6d6f58', '#4a4d3c', 374, true);
      paper(x, W, H, 0, 0, 0.35);
    });
  }
  function brique(x, x0, y0, x1, y1, R) {
    for (let y = y1; y > y0; y -= 11) {
      x.fillStyle = 'rgba(40,15,10,0.22)'; x.fillRect(x0, y - 1.5, x1 - x0, 1.5);
      const off = ((y1 - y) / 11) % 2 ? 0 : 13;
      for (let xx = x0 + off; xx < x1; xx += 26) { x.fillRect(xx, y - 11, 1.5, 9.5); if (R() < 0.12) { x.fillStyle = `rgba(${R() < 0.5 ? '160,80,60' : '60,30,25'},0.25)`; x.fillRect(xx + 2, y - 10, 22, 8); x.fillStyle = 'rgba(40,15,10,0.22)'; } }
    }
  }
  function makeQuaiFond() {
    const w = W + 120, h = 860;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      const R = M.rng(375);
      // entrepôt de briques (gauche)
      const ent = [[-600, 0, 1], [-600, -700, 1], [-470, -700, 1], [-470, -730, 1], [-380, -770, 1], [-290, -730, 1], [-290, -700, 1], [-150, -700, 1], [-150, 0, 1]];
      piece(ent, '#8a4a36', () => {
        brique(x, -600, -700, -150, 0, R);
        x.fillStyle = 'rgba(40,20,15,0.85)'; for (const [wx, wy] of [[-560, -620], [-480, -620], [-300, -620], [-220, -620], [-560, -500], [-220, -500]]) { x.fillRect(wx, wy, 50, 70); x.fillStyle = 'rgba(190,170,120,0.35)'; x.fillRect(wx + 4, wy + 4, 20, 30); x.fillStyle = 'rgba(40,20,15,0.85)'; }
        fillPts([[-485, 0], [-485, -300], [-400, -345], [-315, -300], [-315, 0]], '#3a2a22');               // grande porte cintrée
        for (let xx = -480; xx < -318; xx += 16) strokePts([[xx, -300], [xx, 0]], 'rgba(120,90,60,0.35)', 1.4);
        fillPts(rect(-610, -712, -140, -700), '#6e5a4a'); fillPts(rect(-610, -260, -140, -248), 'rgba(110,90,74,0.8)');
        shade(-600, 0, -150, 0, 0.25, [-600, -780, -150, 0]);
      }, { seed: 376 });
      // pile de caisses près de la porte
      for (const [bx, by, sc, te] of [[-250, 0, 0.7, 1], [-180, 0, 0.62, 3], [-218, -76, 0.6, 0]]) { x.save(); x.translate(bx, by); x.scale(sc, sc); drawCaisse({ teinte: te }); x.restore(); }
      // margelle de pierre du quai
      piece(rect(-w / 2, -26, w / 2, 0), '#8d887c', () => { for (let xx = -w / 2; xx < w / 2; xx += 90) strokePts([[xx, -26], [xx, 0]], 'rgba(40,40,40,0.35)', 1.2); strokePts([[-w / 2, -24], [w / 2, -24]], 'rgba(255,255,240,0.3)', 1.5); }, { seed: 377 });
      // pieux de bois dans l'eau (droite)
      for (const px of [470, 520, 560]) piece(rect(px - 9, -150 - (px % 3) * 10, px + 9, -20), '#5e4428', () => hatch(null, 1.5, 3, 0.3), { seed: 378 + px });
      // bollards
      for (const bx of CON.QUAI.bollards) piece([[bx - 16, -26], [bx - 13, -58], [bx - 20, -64], [bx - 20, -74, 1], [bx + 20, -74, 1], [bx + 20, -64], [bx + 13, -58], [bx + 16, -26]], '#2a2a2e', () => strokePts([[bx - 8, -70], [bx - 6, -30]], 'rgba(255,255,255,0.3)', 2), { seed: 379 + bx });
      // tonneaux
      for (const [tx, ty] of [[250, -26], [300, -26], [275, -98]]) piece(rrect(tx - 24, ty - 72, tx + 24, ty, 10), '#7a5236', () => { for (const yy of [ty - 60, ty - 12]) fillPts(rect(tx - 26, yy - 4, tx + 26, yy + 4), '#3a3a3c'); for (let xx = tx - 18; xx < tx + 20; xx += 9) strokePts([[xx, ty - 70], [xx, ty - 2]], 'rgba(40,25,10,0.4)', 1); shade(tx - 24, 0, tx + 24, 0, 0.35, [tx - 26, ty - 74, tx + 26, ty]); }, { seed: 380 + tx });
      // amarre qui court du bollard vers le bord
      strokePts(qbez([400, -66], [460, -20], [w / 2, -40], 10), '#b49a6a', 4);
      paper(x, w, h, w / 2, h - 10, 0.25);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  CON.PORT = { mer: 1150, portiqueFond: 820, bollards: [-260, 160, 420] };
  function makePortCiel() {
    const H = M.ST.back + 5;
    return M.pre(W, H, (x) => {
      toile(x, [[0, '#5f86a6'], [0.5, '#9dbac8'], [0.82, '#d9dccb'], [1, '#e4dfc8']], 56, H);
      const R = M.rng(561);
      for (let i = 0; i < 5; i++) { const cx = 100 + R() * 880, cy = 300 + R() * 420, w = 200 + R() * 240, pts = []; for (let k = 0; k <= 12; k++) { const a = PI + k * PI / 12; pts.push([cx + Math.cos(a) * w / 2, cy + Math.sin(a) * (34 + 22 * hash(i * 7 + k))]); } pts.push([cx + w * 0.4, cy + 8], [cx - w * 0.4, cy + 8]); piece(pts, '#f1efe6', () => hatch(null, 0.2, 6, 0.06), { seed: 562 + i, texA: 0.4 }); }
      // rive lointaine plate et portique de fond, pâles
      piece([[0, 1152, 1], [0, 1120], [180, 1112], [420, 1124], [700, 1110], [W, 1118], [W, 1152, 1]], '#a9b2ad', null, { seed: 568, texA: 0.4, drop: false });
      x.save(); x.globalAlpha = 0.45; x.translate(CON.PORT.portiqueFond, 1150); x.scale(0.26, 0.26); drawGrueCharpente('gris'); x.restore();
      x.save(); x.globalAlpha = 0.4; x.translate(190, 1150); x.scale(0.16, 0.16); drawNavireCoque(); x.restore();
      eau(x, 1150, H, '#5c8796', '#3c6272', 563, false);
      paper(x, W, H, 0, 0, 0.3);
    });
  }
  function makePortFond() {
    const w = W + 120, h = 260;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      piece(rect(-w / 2, -30, w / 2, 0), '#a3a093', () => { for (let xx = -w / 2; xx < w / 2; xx += 120) strokePts([[xx, -30], [xx, 0]], 'rgba(40,40,40,0.3)', 1.2); fillPts(rect(-w / 2, -30, w / 2, -24), '#c9c4b2'); }, { seed: 564 });
      for (const bx of CON.PORT.bollards) piece([[bx - 15, -30], [bx - 12, -60], [bx - 18, -66], [bx - 18, -74, 1], [bx + 18, -74, 1], [bx + 18, -66], [bx + 12, -60], [bx + 15, -30]], '#3a3f44', () => strokePts([[bx - 7, -70], [bx - 5, -34]], 'rgba(255,255,255,0.3)', 2), { seed: 565 + bx });
      // réverbère de quai (droite)
      piece(rect(476, -230, 484, -30), '#3a3f44', null, { seed: 566 }); piece([[464, -232], [496, -232], [490, -246], [470, -246]], '#3a3f44', () => dot(480, -236, 4, '#f3e8b8'), { seed: 567 });
      paper(x, w, h, w / 2, h - 10, 0.25);
    });
    cv.padB = 10; return M.withShadow(cv, 6);
  }
  function makeGrue(col) {
    const cv = M.cutFlat(1300, 1060, 650, 1040, () => drawGrueCharpente(col)); cv.padB = 20; return M.withShadow(cv, 8);
  }
  function makeNavire() {
    const cv = M.cutFlat(1640, 680, 820, 620, () => drawNavireCoque()); cv.padB = 60; return M.withShadow(cv, 8);
  }
  CON.init = function () {
    if (CON.K) return CON.K;
    const K = (CON.K = {});
    K.quai37 = { ciel: makeQuaiCiel(), fond: makeQuaiFond() };
    K.port56 = { ciel: makePortCiel(), fond: makePortFond() };
    K.grue = {}; for (const c of Object.keys(GC)) K.grue[c] = makeGrue(c);
    K.navire = makeNavire();
    return K;
  };
})();
