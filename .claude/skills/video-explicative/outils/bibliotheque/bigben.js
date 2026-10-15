// persos.js — « Big Ben, la cloche fêlée » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.ben (alias BEN). Appeler BEN.init() dans S.init.
// Mode d'emploi complet : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre ni chiffre. Déterministe (hash, aucun Math.random).
// MARIONNETTES (tige ; (x,y) = pieds) : BEN.ouvrier / BEN.sir / BEN.touriste / BEN.touristeMini (pose,x,y,s,o) — toujours par l'enveloppe.
// ACCESSOIRES (sans tige) : BEN.cloche, BEN.ondes, BEN.marteau, BEN.appareil, BEN.canne, BEN.chariot, BEN.aiguilles, BEN.feu.
// DÉCORS : BEN.init() → BEN.K = { ciel, ville, tour, cour, fonderie, beffroi } ; repères BEN.TOUR, BEN.COUR, BEN.FONDERIE, BEN.BEFFROI, BEN.CL, BEN.CHAR.
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const BEN = (M.ben = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
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
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  function ring(cx, cy, r0, r1, n) { return ep(cx, cy, r1, r1, n, 0, TAU).concat(ep(cx, cy, r0, r0, n, TAU, 0)); }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  BEN.geo = { ep, ell, ribbon, rrect, rect };

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
  // OBJETS TENUS — chaque objet se dessine dans son repère ; grip = point serré dans le poing
  // =====================================================================
  const CHENE = '#8a6a42', CHENEL = '#b08a5a', CHENED = '#5e4428', FER = '#2f3a40', FERL = '#56646c', FERD = '#1b2327';
  // ---------------- marteau : manche vertical, bout en (0,0), tête en (0,-L)
  const MART = {
    lourd: { L: 250, G: 192, GS: 118, P2: 22, hw: 88, hh: 40, w: 17 },
    leger: { L: 128, G: 48, GS: 48, P2: 14, hw: 32, hh: 20, w: 10 },
  };
  const mk = (o) => MART[o && o.poids === 'leger' ? 'leger' : 'lourd'];
  function drawMarteau(o) {
    const g = mk(o), lg = o.poids === 'leger', L = g.L;
    const man = [[-g.w * 0.55, 0, 1], [g.w * 0.55, 0, 1], [g.w * 0.5, -L * 0.5], [g.w * 0.42, -L + 2], [-g.w * 0.42, -L + 2], [-g.w * 0.5, -L * 0.5]];
    pc(man, lg ? '#c09a62' : CHENE, () => {
      for (const k of [-0.25, 0.1, 0.3]) strokePts([[g.w * k, -4], [g.w * k * 0.8, -L * 0.5], [g.w * k * 0.7, -L]], 'rgba(60,35,15,0.45)', 1);
      strokePts([[-g.w * 0.3, -6], [-g.w * 0.28, -L + 6]], 'rgba(255,230,190,0.35)', 1.4);
      fillPts(rect(-g.w, -10, g.w, 0), lg ? '#9a7442' : CHENED);
      hatch(null, 1.4, 3.4, 0.2);
    }, 7101);
    if (!lg) {
      const hw = g.hw, hh = g.hh, y0 = -L;
      const H = [[-hw + 8, y0 - hh, 1], [hw - 8, y0 - hh, 1], [hw, y0 - hh + 8, 1], [hw, y0 + hh - 8, 1], [hw - 8, y0 + hh, 1], [-hw + 8, y0 + hh, 1], [-hw, y0 + hh - 8, 1], [-hw, y0 - hh + 8, 1]];
      pc(H, FER, () => {
        fillPts(rect(-hw, y0 - hh, hw, y0 - hh + 12), FERL);
        fillPts(rect(-hw, y0 + hh - 10, hw, y0 + hh), FERD);
        strokePts([[-hw + 10, y0 - hh + 4], [hw - 10, y0 - hh + 4]], 'rgba(220,230,235,0.55)', 1.6);
        for (const sx of [-1, 1]) fillPts(rect(sx > 0 ? hw - 14 : -hw, y0 - hh, sx > 0 ? hw : -hw + 14, y0 + hh), 'rgba(10,15,18,0.35)');
        fillPts(rect(-9, y0 - hh, 9, y0 - hh + 6), CHENED);                                   // coin du manche
        hatch(null, 0.5, 3.4, 0.28, 1, '200,210,215');
        shade(0, y0 - hh, 0, y0 + hh, 0.3, [-hw - 4, y0 - hh - 4, hw + 4, y0 + hh + 4]);
      }, 7102);
      for (const sx of [-1, 1]) pc(rect(sx * hw - (sx > 0 ? 0 : 8), y0 - hh + 9, sx * hw + (sx > 0 ? 8 : 0), y0 + hh - 9), FERD, () => strokePts([[sx * (hw + 4), y0 - hh + 12], [sx * (hw + 4), y0 + hh - 12]], 'rgba(200,210,215,0.4)', 1.2), 7103 + sx);
    } else {
      const hw = g.hw, hh = g.hh, y0 = -L;
      pc(rrect(-hw, y0 - hh, hw, y0 + hh, 7), '#d8b47a', () => {
        for (const x of [-hw + 7, hw - 7]) fillPts(rect(x - 3.5, y0 - hh, x + 3.5, y0 + hh), '#a8843e');
        strokePts([[-hw + 12, y0 - hh + 5], [hw - 12, y0 - hh + 5]], 'rgba(255,245,215,0.7)', 1.4);
        hatch(null, 0.2, 3.2, 0.18);
      }, 7110);
    }
  }
  // ---------------- appareil photo (de profil, objectif vers +x) ; prise = dessous du boîtier
  function drawAppareil(o) {
    pc([[-12, -44, 1], [-8, -55, 1], [8, -55, 1], [12, -44, 1]], '#34343a', () => strokePts([[-7, -52], [7, -52]], 'rgba(255,255,255,0.3)', 1), 7201);
    pc(rect(3, -64, 17, -55), '#dcd8cc', () => { fillPts(rect(5, -62, 15, -57), '#f6f2e2'); strokePts([[5, -60], [15, -60]], 'rgba(120,110,90,0.5)', 0.8); }, 7202);
    pc(rrect(-28, -44, 20, 0, 5), '#26262b', () => {
      fillPts(rect(-28, -40, -16, -4), '#3c3c42'); for (let y = -36; y < -6; y += 5) strokePts([[-27, y], [-17, y]], 'rgba(0,0,0,0.5)', 0.8);
      strokePts([[-24, -41], [16, -41]], 'rgba(255,255,255,0.35)', 1.2);
      fillPts(rect(-28, -26, 20, -22), '#8e2e28');                                               // bande rouge éteint
      hatch(null, 0.8, 3, 0.25, 1, '200,200,210');
    }, 7203);
    dot(-18, -47, 3.2, '#9a3b33');                                                                 // déclencheur
    pc(rect(18, -38, 44, -6), '#1d1d21', () => { for (const x of [27, 36]) strokePts([[x, -38], [x, -6]], '#a9a9a6', 2); strokePts([[20, -35], [42, -35]], 'rgba(255,255,255,0.3)', 1); }, 7204);
    pc(ell(45, -22, 6, 17, 14), '#6f8fa3', () => { dot(44, -29, 3, 'rgba(255,255,255,0.75)'); dot(46, -17, 5, 'rgba(20,30,40,0.5)'); }, 7205);
    const f = clamp(o.flash || 0);
    if (f > 0 && !SIL()) {
      const c = cx_(); c.save(); c.globalCompositeOperation = 'lighter';
      const R0 = 26 + 105 * f, g = c.createRadialGradient(10, -60, 2, 10, -60, R0);
      g.addColorStop(0, `rgba(255,255,245,${0.95 * f})`); g.addColorStop(0.35, `rgba(255,240,190,${0.55 * f})`); g.addColorStop(1, 'rgba(255,220,150,0)');
      c.fillStyle = g; c.beginPath(); c.arc(10, -60, R0, 0, TAU); c.fill();
      c.beginPath(); for (let k = 0; k < 16; k++) { const a = k * PI / 8, r = k % 2 ? 8 + 6 * f : 26 + 70 * f; c.lineTo(10 + Math.cos(a) * r, -60 + Math.sin(a) * r); }
      c.closePath(); c.fillStyle = `rgba(255,252,230,${0.9 * f})`; c.fill(); c.restore();
    }
  }
  // ---------------- canne (pointe en (0,0), pommeau en haut)
  function drawCanne() {
    pc([[-3.6, 0, 1], [3.6, 0, 1], [3.4, -194], [-3.4, -194]], '#211b19', () => { strokePts([[-1.5, -6], [-1.5, -190]], 'rgba(255,255,255,0.25)', 1); fillPts(rect(-4, -12, 4, 0), '#a9a49a'); }, 7301);
    pc(ell(0, -201, 9, 8, 12), '#c8c6bf', () => { dot(-3, -204, 2.4, 'rgba(255,255,255,0.8)'); shade(-6, -206, 6, -195, 0.4, [-10, -210, 10, -192]); }, 7302);
    pc(rect(-5, -195, 5, -190), '#8f8a80', null, 7303);
  }

  const OBJ = {
    marteau: { draw: drawMarteau, grip: (o) => [0, -(o.prise != null ? o.prise : mk(o).G)], p2: (o) => [0, -mk(o).P2], suit: PI,
      pts: (o) => { const g = mk(o); return { tete: [0, -g.L], face: [g.hw + 8, -g.L], dos: [-g.hw - 8, -g.L], bout: [0, 0] }; }, base: [0, 0] },
    appareil: { draw: drawAppareil, grip: [-4, 4], p2: () => [-24, -6], pts: () => ({ objectif: [51, -22], flash: [10, -60] }), base: [0, 0] },
    canne: { draw: drawCanne, grip: [0, -186], pts: () => ({ pommeau: [0, -205], bout: [0, 0] }), base: [0, 0] },
  };
  BEN.OBJ = OBJ;
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
  // point nommé de l'objet tenu (écran) : r renvoyé par BEN.ouvrier/sir/touriste
  BEN.pt = function (r, nom, arriere) {
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
    else if (has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].suit) A.objet = (A.objet || 0) + OBJ[q.tenu].suit;     // marteau : la tête prolonge l'avant-bras
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    else if (has(q.tenuB) && OBJ[q.tenuB] && OBJ[q.tenuB].suit) A.objetB = (A.objetB || 0) + OBJ[q.tenuB].suit;
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
  // o : nu (y où commence la peau nue), roule (couleur du bourrelet de manche retroussée), poignet (couleur de manchette)
  function foreDef(parent, base, skin, back, seed, o) {
    o = o || {};
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      if (o.nu != null) fillPts([[-24, o.nu, 1], [24, o.nu, 1], [24, 300, 1], [-24, 300, 1]], skin);
      if (o.roule) { fillPts([[-24, o.nu - 13, 1], [24, o.nu - 13, 1], [24, o.nu + 2, 1], [-24, o.nu + 2, 1]], o.roule); strokePts([[-20, o.nu - 6], [20, o.nu - 7]], 'rgba(90,80,60,0.45)', 1); }
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (o.poignet) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.poignet);
      if (o.nu != null) { for (const y of [o.nu + 12, o.nu + 26]) strokePts([[-6, y], [2, y + 4]], 'rgba(150,90,60,0.35)', 1); }
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  function legDef(at, base, seed, back, paint) {
    return { parent: 'torso', at, pts: X.legPts(0.95), base, seed, noRivet: !!back, paint: () => {
      paint();
      if (!back) hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); else hatch(null, 0.8, 3.6, 0.3);
    } };
  }

  // =====================================================================
  // L'OUVRIER FONDEUR (1856-1858) — casquette plate grise, moustache rousse, chemise écrue retroussée, tablier de cuir, pantalon ardoise
  // =====================================================================
  const OU = { peau: '#dcab86', peauD: '#bf8d68', chem: '#e6dcc4', chemD: '#c8bca0', tab: '#6b4a2b', tabD: '#553a21', tabL: '#87603b',
    pant: '#4f5d6b', pantD: '#3f4b57', botte: '#2c2018', cap: '#7c7e80', capD: '#5f6163', roux: '#b0683a', rouxD: '#86492a' };
  const OU_TORSO = [[-16, -178], [10, -182], [20, -170], [32, -152], [42, -118], [46, -70], [44, -20], [40, 10], [-40, 12], [-45, -30], [-45, -100], [-41, -150], [-29, -170]];
  const OU_TAB = [[8, -150], [30, -150], [44, -118], [49, -70], [50, -20], [54, 40], [58, 112, 1], [-14, 116, 1], [-18, 40], [-22, 0], [-24, -18], [-2, -24], [4, -100]];
  const OU_HEAD = [[-16, 16], [12, 16], [13, 2], [20, -6], [28, -10], [31, -16], [30, -22], [32, -27], [31, -31], [34, -35], [42, -41, 1], [36, -49], [30, -57], [30, -66], [26, -78], [13, -91], [-8, -95], [-26, -87], [-34, -68], [-33, -46], [-26, -26], [-19, -8]];
  const OU_CAP = [[-44, 8], [-48, -6], [-42, -18], [-16, -27], [22, -27], [46, -19], [60, -8], [64, 0, 1], [40, 6], [12, 8]];
  function mkOuvrier() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: OU_TORSO, base: OU.chem, seed: 7401, paint: () => {
        fillPts([[4, -186], [20, -170], [14, -152], [2, -168]], OU.chemD);                       // col ouvert
        strokePts([[12, -150], [0, -168], [-14, -178]], OU.tabD, 3.2);                             // bretelle du tablier
        fillPts([[8, -166], [14, -150], [10, -140], [4, -152]], OU.peauD);
        for (const y of [-130, -96]) dot(30, y, 2, '#a89c80');
        strokePts([[-30, -120], [-26, -60], [-30, 0]], 'rgba(120,105,80,0.45)', 1.2);
        hatch([[-52, -172], [-14, -172], [-12, 12], [-52, 12]], 0.75, 4.2, 0.3);
        shade(40, 0, -44, 0, 0.26);
      } },
      tablier: { parent: 'torso', at: [0, 0], pts: OU_TAB, base: OU.tab, seed: 7402, noRivet: true, paint: () => {
        fillPts([[10, -150], [30, -150], [32, -144], [10, -144]], OU.tabD);
        strokePts([[24, -110], [32, -40], [36, 40], [40, 108]], 'rgba(30,18,8,0.4)', 1.4);
        strokePts([[-6, -60], [-4, 10], [-8, 100]], 'rgba(255,220,180,0.18)', 2);
        fillPts([[16, -40, 1], [44, -40, 1], [46, -12, 1], [17, -12, 1]], OU.tabD);              // poche
        strokePts([[16, -40], [44, -40]], 'rgba(255,220,180,0.3)', 1.2);
        for (const [x, y] of [[12, -146], [28, -146], [-18, -14]]) dot(x, y, 2.4, '#b08d45');
        hatch(null, 0.9, 3.6, 0.22, 1, '30,20,10'); shade(0, -150, 0, 116, 0.25, [-30, -160, 70, 120]);
      } },
      sangle: { parent: 'torso', at: [0, 0], pts: [[-26, -20], [-2, -24], [0, -16], [-26, -12], [-34, -6], [-38, -16]], base: OU.tabD, seed: 7403, noRivet: true },
      legB: legDef([-6, -2], OU.pantD, 7404, true, () => fillPts([[-40, 196, 1], [60, 196, 1], [60, 260, 1], [-40, 260, 1]], OU.botte)),
      legF: legDef([6, -2], OU.pant, 7405, false, () => { fillPts([[-40, 196, 1], [60, 196, 1], [60, 260, 1], [-40, 260, 1]], OU.botte); strokePts([[-16, 200], [16, 200]], 'rgba(255,255,255,0.18)', 2); strokePts([[22, 226], [44, 230]], 'rgba(255,255,255,0.22)', 1.3); }),
      armB_up: upDef([-10, -146], OU.chemD, 7406),
      armB_lo: foreDef('armB_up', OU.chemD, OU.peauD, true, 7407, { nu: 22, roule: '#b5a98e' }),
      head: { parent: 'torso', at: [6, -170], pts: OU_HEAD, base: OU.peau, seed: 7408, noRivet: true, paint: (p) => {
        const f = p.face || {}, si = clamp(p._siffle || 0);
        fillPts([[-36, -76], [-14, -74], [-14, -56], [-20, -40], [-26, -28], [-38, -30]], OU.rouxD);   // nuque
        fillPts([[-8, -70], [2, -70], [4, -48], [-2, -40], [-8, -46]], OU.roux);                        // favori court
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        dot(20, -36, 9, 'rgba(200,100,80,0.25)'); dot(38, -42, 3.5, 'rgba(200,90,70,0.25)');            // joue et nez rougis
        X.eye(f, 17, -52); X.brow(f, 17, -61, OU.rouxD, 3.6);
        if (si < 0.05) X.mouth(f, 28, -23);
        fillPts([[43, -39], [43, -32], [40, -24], [35, -16], [29, -13], [24, -17], [17, -18], [11, -24], [12, -32], [20, -38], [32, -41]], OU.roux, 6, 0.4);   // moustache de morse
        for (const x of [18, 24, 30, 36]) strokePts([[x + 2, -36], [x, -20]], 'rgba(90,30,10,0.55)', 1);
      },
        extra: (p) => {                                                                             // sifflement : lèvres en cul-de-poule + filets d'air (hors découpe)
          const si = clamp(p._siffle || 0); if (si < 0.05 || SIL()) return;
          const t = p.t || 0, c = cx_();
          c.save(); c.beginPath(); c.ellipse(33, -11, 5, 4.4, 0, 0, TAU); c.fillStyle = '#b8665a'; c.fill();
          c.beginPath(); c.ellipse(34.5, -11, 2.2, 2, 0, 0, TAU); c.fillStyle = '#2a1410'; c.fill();
          c.lineCap = 'round'; c.lineWidth = 2.4 * M._lw();
          for (let i = 0; i < 3; i++) {
            const u = (t * 1.3 + i / 3) % 1, x0 = 42 + u * 50, y0 = -11 + (i - 1) * 8 - u * 12;
            c.strokeStyle = `rgba(250,245,230,${0.9 * si * (1 - u * 0.8)})`;
            c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + 7, y0 - 6, x0 + 14, y0); c.quadraticCurveTo(x0 + 21, y0 + 6, x0 + 28, y0); c.stroke();
          }
          c.restore();
        } },
      casquette: { parent: 'head', at: [-2, -82], pts: OU_CAP, base: OU.cap, seed: 7409, noRivet: true, paint: () => {
        fillPts([[30, -6], [60, -6], [64, 0], [40, 6], [24, 4]], OU.capD);
        strokePts([[-40, -14], [0, -22], [44, -16]], 'rgba(40,40,40,0.4)', 1.2);
        dot(4, -24, 3, OU.capD);
        hatch(null, 0.6, 3, 0.25); hatch(null, -0.6, 4, 0.15); shade(0, -28, 0, 8, 0.25, [-50, -30, 66, 10]);
      } },
      armF_up: upDef([-2, -146], OU.chem, 7410),
      armF_lo: foreDef('armF_up', OU.chem, OU.peau, false, 7411, { nu: 22, roule: OU.chemD }),
    };
    Object.assign(parts, heldParts(OU.peau, OU.peauD, 7420));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'casquette', 'torso', 'tablier', 'sangle', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsD'] };
  }
  CH.benOuvrier = mkOuvrier();
  BEN.ouvrierPose = function (p) {
    const q = prep(p), A = q.ang;
    const fr = ease(clamp(q.frappe || 0)), sw = Math.max(ease(clamp(q.leve || 0)), q.frappe > 0 ? 1 : 0);
    const epl = ease(clamp(q.epaule || 0)), tm = ease(clamp(q.teteMains || 0)), si = clamp(q.siffle || 0), ap = ease(clamp(q.appui || 0));
    if (q.poids) q.tenuO = Object.assign({ poids: q.poids }, q.tenuO);
    if (q.tenu === 'marteau' && (sw > 0 || q.tenuO == null || q.tenuO.prise == null)) {
      const g = mk(q.tenuO);
      if (sw > 0) q.tenuO = Object.assign({ prise: lerp(g.G, g.GS, sw) }, q.tenuO);
    }
    if (ap > 0 && q.tenu === 'marteau') {                                   // masse posée debout sur sa tête, la main sur le bout du manche
      const g = mk(q.tenuO);
      q.tenuO = Object.assign({ prise: lerp(g.G, 12, ap) }, q.tenuO);
      armTo(q, 'armF', [58, 238 - (g.L - 12 + g.hh)], 'bas', ap); A.objet = (A.objet || 0) + PI * ap;
    }
    if (sw > 0) {
      blend(q, 'armF_up', lerp(-2.75, -1.05, fr), sw); blend(q, 'armF_lo', lerp(-1.0, -0.2, fr), sw);
      plier(q, lerp(-0.07, 0.12, fr) * sw);
      A.legF = (A.legF || 0) - 0.2 * sw; A.legB = (A.legB || 0) + 0.18 * sw;
      A.head = (A.head || 0) + lerp(-0.12, 0.1, fr) * sw;
      if (q.droit == null && has(q.tenu)) q.droit = false;
      if (q.deuxMains == null && has(q.tenu)) q.deuxMains = true;
    }
    if (epl > 0) {
      armTo(q, 'armF', [28, -112], 'bas', epl); A.objet = (A.objet || 0) - 0.78 * epl;
      if (q.tenu === 'marteau') { const G = mk(q.tenuO).G; q.tenuO = Object.assign({ prise: lerp(G, 26, epl) }, q.tenuO); }
    }
    if (tm > 0) {
      armTo(q, 'armF', headPt(q, 6, -100), 'avant', tm); armTo(q, 'armB', headPt(q, -22, -96), 'avant', tm);
      if (tm > 0.5) { if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
    }
    if (si > 0) { q._siffle = si; A.head = (A.head || 0) - 0.08 * si; if (!q.face.eyes) q.face.eyes = si > 0.5 ? 'half' : 'open'; }
    return finish(q);
  };
  BEN.ouvrier = (pose, x, y, s, o) => run(CH.benOuvrier, BEN.ouvrierPose(pose), x, y, s == null ? 0.9 : s, Object.assign({ slot: M.ST.slotF }, o));

  // =====================================================================
  // SIR (le commissaire, 1858) — haut-de-forme gris perle, favoris blancs, monocle, redingote bleu nuit, pantalon gris rayé, canne
  // =====================================================================
  const SI = { peau: '#e6c4a6', peauD: '#c9a385', coat: '#24304a', coatD: '#1a2336', coatL: '#36456a', gilet: '#8d9197', cravate: '#7a2a2c',
    pant: '#8f8c85', pantD: '#76736d', chaus: '#1a191d', hat: '#cbc7bd', hatD: '#a9a59b', band: '#2a2a2f', blanc: '#efebe3', blancD: '#d4cfc4' };
  const SI_TORSO = [[-14, -176], [8, -180], [16, -168], [24, -150], [30, -112], [31, -60], [28, -12], [34, 40], [38, 122, 1], [-46, 126, 1], [-40, 60], [-33, 0], [-35, -60], [-35, -110], [-31, -150], [-24, -168]];
  const SI_HAT = [[-42, 4, 1], [46, 4, 1], [48, -4], [33, -8], [37, -102, 1], [-29, -104, 1], [-26, -8], [-42, -4]];
  const SI_BRIM = [34, -84];                                       // bord avant du chapeau, repère de la tête (la main le saisit là)
  function hatPaint() {
    fillPts([[-27, -36, 1], [33, -36, 1], [33, -14, 1], [-26, -14, 1]], SI.band);
    fillPts([[-40, -4], [46, -4], [44, 4, 1], [-40, 4, 1]], SI.hatD);
    strokePts([[-16, -98], [-12, -40]], 'rgba(255,255,255,0.45)', 3);
    hatch(null, 0.9, 4, 0.18); shade(-30, 0, 36, 0, 0.3, [-46, -110, 52, 8]);
  }
  function mkSir() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: SI_TORSO, base: SI.coat, seed: 7501, paint: () => {
        fillPts([[2, -184], [18, -172], [16, -156], [4, -164]], SI.blanc);                              // col cassé
        fillPts([[12, -164], [22, -150], [26, -112], [27, -60], [14, -54], [12, -110]], SI.gilet);       // gilet
        fillPts([[13, -166], [20, -156], [18, -136], [12, -142]], SI.cravate); dot(16, -144, 2.2, '#d9bd72');
        fillPts([[16, -170], [24, -150], [28, -116], [20, -108], [14, -140]], SI.coatL);                 // revers
        strokePts([[22, -108], [28, -60], [30, -12], [36, 120]], 'rgba(5,8,16,0.6)', 1.6);
        for (const y of [-92, -66]) dot(25, y, 2.3, '#b9b6ae');
        strokePts([[16, -84], [4, -76], [-6, -82]], '#b08d45', 1.2);                                     // chaîne de montre
        dot(21, -138, 4.2, '#a3322c'); dot(20, -139, 1.6, '#d9706a');                                  // œillet à la boutonnière
        hatch([[-52, -170], [-12, -170], [-10, 128], [-52, 128]], 0.75, 4.4, 0.34, 1, '220,225,240');
        shade(34, 0, -44, 0, 0.3);
      } },
      legB: legDef([-6, -2], SI.pantD, 7502, true, () => fillPts([[-40, 216, 1], [60, 216, 1], [60, 260, 1], [-40, 260, 1]], SI.chaus)),
      legF: legDef([6, -2], SI.pant, 7503, false, () => {
        for (const x of [-12, -2, 8]) strokePts([[x, 0], [x * 0.9, 120], [x * 0.8 + 1, 214]], 'rgba(40,40,45,0.35)', 1.1);
        fillPts([[-40, 216, 1], [60, 216, 1], [60, 260, 1], [-40, 260, 1]], SI.chaus); strokePts([[22, 226], [44, 230]], 'rgba(255,255,255,0.35)', 1.3);
      }),
      armB_up: upDef([-10, -146], SI.coatD, 7504),
      armB_lo: foreDef('armB_up', SI.coatD, SI.peauD, true, 7505, { poignet: SI.blancD }),
      head: { parent: 'torso', at: [6, -170], pts: X.AR_HEAD, base: SI.peau, seed: 7506, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-36, -84], [-16, -82], [-14, -62], [-20, -44], [-28, -30], [-38, -34]], SI.blanc);
        fillPts([[-12, -66], [2, -66], [6, -48], [13, -32], [17, -16], [11, -4], [0, -2], [-9, -14], [-14, -36]], SI.blanc, 4, 0.6);   // favoris
        for (const [a, b] of [[[-4, -60], [6, -20]], [[-10, -44], [2, -8]], [[2, -54], [12, -14]]]) strokePts([a, b], 'rgba(150,145,135,0.5)', 1);
        X.earPaint(-12, -46);
        dot(16, -30, 7, 'rgba(205,130,110,0.22)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, '#e9e5dc', 3.4); X.mouth(f, 27, -26);
        const mo = ell(19, -52, 9, 9, 14);                                                                // monocle
        fillPts(mo, 'rgba(200,225,235,0.3)', 0, 0); strokePts(mo.concat([mo[0]]), '#b08d45', 1.8);
        strokePts([[19, -43], [16, -20], [10, 4]], 'rgba(176,141,69,0.8)', 0.9);
      } },
      chapeau: { parent: 'head', at: [-2, -84], pts: SI_HAT, base: SI.hat, seed: 7507, noRivet: true, paint: hatPaint },
      armF_up: upDef([-2, -146], SI.coat, 7508, () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3, 1, '220,225,240')),
      armF_lo: foreDef('armF_up', SI.coat, SI.peau, false, 7509, { poignet: SI.blanc }),
      chapeauM: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: SI.hat, seed: 7510, paint: hatPaint,
        pts: (p) => (p._chapM ? tr(SI_HAT, -(SI_BRIM[0] + 2), 0) : OFFP) },
    };
    Object.assign(parts, heldParts(SI.peau, SI.peauD, 7520));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'chapeau', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'chapeauM', 'doigtsD'] };
  }
  CH.benSir = mkSir();
  BEN.sirPose = function (p) {
    const q = prep(p), A = q.ang;
    const ch = clamp(q.chapeau || 0), vi = ease(clamp(q.visage || 0)), ho = clamp(q.hoche || 0);
    if (q.tenuB == null) q.tenuB = vi > 0 ? 'rien' : 'canne';
    if (q.tenuB === 'canne' && A.armB_up == null && A.armB_lo == null) { A.armB_up = 0.3; A.armB_lo = -0.12; }     // canne visible derrière les jambes
    if (ho > 0) A.head = (A.head || 0) + 0.17 * ho * (0.5 - 0.5 * Math.cos((q.t || 0) * 7));
    if (ch > 0) {
      const a = ease(clamp(ch / 0.5)), u = ease(clamp((ch - 0.5) / 0.5));
      armTo(q, 'armF', headPt(q, SI_BRIM[0] + 2 + 16 * u, SI_BRIM[1] - 58 * u), 'bas', ch >= 0.5 ? 1 : a);
      if (ch >= 0.5) { q.hide.chapeau = 1; q._chapM = 1; A.chapeauM = (A.head || 0) - (A.armF_up || 0) - (A.armF_lo || 0) + 0.12 * u; }
      if (!has(q.tenu)) q.handF = 'fist';
    }
    if (vi > 0) {
      armTo(q, 'armF', headPt(q, 24, -28), 'bas', vi); armTo(q, 'armB', headPt(q, 8, -34), 'bas', vi);
      if (vi > 0.4) { if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
      if (vi > 0.5) { q.face.brow = q.face.brow || 'worry'; q.face.mouth = q.face.mouth || 'o'; q.face.eyes = q.face.eyes || 'wide'; }
    }
    return finish(q);
  };
  BEN.sir = (pose, x, y, s, o) => run(CH.benSir, BEN.sirPose(pose), x, y, s == null ? 0.9 : s, Object.assign({ slot: M.ST.slotF }, o));

  // =====================================================================
  // LE TOURISTE (aujourd'hui) — casquette rouge éteint, tee-shirt bleu canard, sac à dos ocre, short beige, baskets, appareil photo
  // =====================================================================
  const TO_BASE = { peau: '#e8c3a0', peauD: '#cba07e', tee: '#4f7d86', teeD: '#3f6770', short: '#b3a273', shortD: '#9a8a60', chaus: '#e9e6dc', semelle: '#8a8478',
    cap: '#9a3b33', capD: '#7a2c26', sac: '#c08f3c', sacD: '#9a7030', cheveux: '#4a3426' };
  const TO_TORSO = [[-14, -176], [8, -180], [16, -168], [28, -150], [34, -112], [36, -60], [35, -10], [33, 12], [-34, 14], [-36, -40], [-36, -110], [-32, -150], [-26, -168]];
  const TO_SAC = [[-28, -150], [-58, -148], [-70, -126], [-74, -60], [-70, -34], [-30, -32]];
  const TO_CAP = [[-40, 4], [-42, -12], [-34, -28], [-12, -36], [14, -36], [32, -28], [40, -14], [42, -6], [72, -2, 1], [68, 5, 1], [40, 6]];
  function mkTouriste(C, seed) {
    const shoe = (back) => () => {
      fillPts([[-40, 118, 1], [60, 118, 1], [60, 300, 1], [-40, 300, 1]], back ? C.peauD : C.peau);
      fillPts([[-40, 0, 1], [60, 0, 1], [60, 100, 1], [-40, 100, 1]], back ? C.shortD : C.short);
      fillPts([[-40, 196, 1], [60, 196, 1], [60, 214, 1], [-40, 214, 1]], '#f4f1e8');
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], C.chaus); fillPts([[-40, 231, 1], [60, 231, 1], [60, 260, 1], [-40, 260, 1]], C.semelle);
      strokePts([[0, 218], [24, 224]], 'rgba(154,59,51,0.8)', 2.2);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: TO_TORSO, base: C.tee, seed: seed + 1, paint: () => {
        fillPts([[4, -182], [16, -168], [10, -160], [0, -170]], C.teeD);
        fillPts([[-24, -170], [-14, -170], [6, -110], [-2, -104]], C.sacD);                                  // bretelle du sac
        strokePts([[-30, -10], [32, -10]], 'rgba(20,40,45,0.4)', 1.4);
        hatch([[-48, -170], [-12, -170], [-10, 14], [-48, 14]], 0.75, 4.2, 0.28); shade(36, 0, -40, 0, 0.26);
      } },
      sac: { parent: 'torso', at: [0, 0], pts: TO_SAC, base: C.sac, seed: seed + 2, noRivet: true, paint: () => {
        fillPts([[-30, -150], [-58, -148], [-70, -126], [-66, -112], [-30, -116]], C.sacD);
        fillPts(rrect(-70, -84, -50, -44, 5), C.sacD); strokePts([[-68, -76], [-52, -76]], 'rgba(60,40,10,0.5)', 1);
        dot(-48, -116, 2.4, '#3a3a3a'); hatch(null, 0.9, 3.6, 0.22); shade(-30, 0, -74, 0, 0.25, [-80, -156, -26, -26]);
      } },
      legB: legDef([-6, -2], C.shortD, seed + 3, true, shoe(true)),
      legF: legDef([6, -2], C.short, seed + 4, false, shoe(false)),
      armB_up: upDef([-10, -146], C.teeD, seed + 5, () => { fillPts([[-24, 42, 1], [24, 42, 1], [24, 140, 1], [-24, 140, 1]], C.peauD); hatch(null, 0.8, 3.6, 0.25); }),
      armB_lo: foreDef('armB_up', C.peauD, C.peauD, true, seed + 6),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: C.peau, seed: seed + 7, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-34, -80], [-12, -78], [-12, -60], [-18, -44], [-24, -30], [-34, -34]], C.cheveux);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(15, -33, 8, 'rgba(220,120,100,0.25)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(70,48,34,0.95)', 2.6); X.mouth(f, 27, -26);
      } },
      casquette: { parent: 'head', at: [-2, -80], pts: TO_CAP, base: C.cap, seed: seed + 8, noRivet: true, paint: () => {
        fillPts([[38, -8], [72, -2], [68, 5], [40, 6]], C.capD);
        strokePts([[0, -36], [6, -6]], 'rgba(40,10,8,0.4)', 1.2); dot(2, -35, 3, C.capD);
        hatch(null, 0.8, 3.6, 0.18); shade(0, -36, 0, 6, 0.25, [-44, -38, 74, 8]);
      } },
      armF_up: upDef([-2, -146], C.tee, seed + 9, () => { fillPts([[-24, 42, 1], [24, 42, 1], [24, 140, 1], [-24, 140, 1]], C.peau); fillPts([[-24, 34, 1], [24, 34, 1], [24, 44, 1], [-24, 44, 1]], C.teeD); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.25); }),
      armF_lo: foreDef('armF_up', C.peau, C.peau, false, seed + 10),
    };
    Object.assign(parts, heldParts(C.peau, C.peauD, seed + 20));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'casquette', 'sac', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsD'] };
  }
  const pale = (C, k, fog) => { const o = {}; for (const n in C) o[n] = M.mixc(C[n], fog, k); return o; };
  CH.benTouriste = mkTouriste(TO_BASE, 7600);
  CH.benTouristeMini = mkTouriste(pale(TO_BASE, 0.42, '#c9cdd0'), 7700);
  BEN.touristePose = function (p) {
    const q = prep(p), A = q.ang;
    if (q.tenu == null) q.tenu = 'appareil';
    const ph = ease(clamp(q.photo || 0)), rh = ease(clamp(q.regardHaut || 0));
    if (rh > 0) { plier(q, -0.05 * rh); A.head = (A.head || 0) - 0.42 * rh; }
    if (ph > 0 && q.tenu === 'appareil') {
      armTo(q, 'armF', headPt(q, 44, -28), 'bas', ph);
      if (q.deuxMains == null && ph > 0.6) q.deuxMains = true;
      A.objet = (A.objet || 0) + (A.head || 0) * ph;
    }
    if (q.flash != null && q.tenu === 'appareil') q.tenuO = Object.assign({ flash: q.flash }, q.tenuO);
    if (q.face.mouth == null) q.face.mouth = 'smile';
    return finish(q);
  };
  BEN.touriste = (pose, x, y, s, o) => run(CH.benTouriste, BEN.touristePose(pose), x, y, s == null ? 0.9 : s, Object.assign({ slot: M.ST.slotF }, o));
  BEN.touristeMini = (pose, x, y, s, o) => run(CH.benTouristeMini, BEN.touristePose(pose), x, y, s == null ? 0.72 : s, Object.assign({ slot: M.ST.slotB }, o));

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accRun(name, draw, x, y, s, o) {
    return M.puppet(accDef(name, draw), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  // marteau seul : o.pose 'manche' (défaut, (x,y) = bout du manche, tête en haut) | 'tete' (debout sur sa tête, (x,y) = sous la tête)
  BEN.marteau = (x, y, s, o) => {
    o = Object.assign({ poids: 'lourd' }, o || {}); s = s == null ? 0.9 : s;
    return accRun('marteau', (oo) => {
      const c = cx_(); c.save();
      if (oo.pose === 'tete') { const g = mk(oo); c.rotate(PI); c.translate(0, g.L + g.hh); }
      drawMarteau(oo); c.restore();
    }, x, y, s, o);
  };
  BEN.appareil = (x, y, s, o) => { o = o || {}; return accRun('appareil', drawAppareil, x, y, s == null ? 0.9 : s, o); };
  BEN.canne = (x, y, s, o) => { o = o || {}; return accRun('canne', drawCanne, x, y, s == null ? 0.9 : s, o); };

  // =====================================================================
  // LA CLOCHE — bronze vieilli, (x,y) = milieu du bord inférieur ; 440 × 400 à s = 1. Pas de visage.
  // =====================================================================
  const BR = { b: '#8a6a2e', l: '#c9a24a', d: '#5e4519', dd: '#3a2810', int: '#21160a' };
  const CL_R = [[200, 0], [197, -12], [188, -28], [171, -52], [155, -90], [141, -140], [129, -200], [121, -260], [116, -306], [111, -334], [99, -357], [77, -373], [45, -383], [0, -387]];
  const KY = 0.07;                                                     // aplatissement des cercles vus d'en bas (bouche, moulures)
  function clR(y) {
    for (let i = 1; i < CL_R.length; i++) { const a = CL_R[i - 1], b = CL_R[i]; if (y >= b[1]) return lerp(a[0], b[0], clamp((y - a[1]) / (b[1] - a[1]))); }
    return 0;
  }
  const proj = (phi, y) => { const r = clR(y); return [r * Math.sin(phi), y - KY * r * Math.cos(phi)]; };
  const CL_BODY = (() => {
    const right = CL_R.map((p, i) => (i === 0 ? [p[0], p[1], 1] : [p[0], p[1]]));
    const left = CL_R.slice(0, -1).reverse().map((p, i, a) => (i === a.length - 1 ? [-p[0], p[1], 1] : [-p[0], p[1]]));
    const bot = []; for (let i = 1; i < 12; i++) { const x = lerp(-200, 200, i / 12); bot.push([x, -KY * Math.sqrt(200 * 200 - x * x)]); }
    return right.concat(left, bot);
  })();
  const CL_ANSE = ep(0, -384, 36, 56, 12, PI, TAU).concat(ep(0, -384, 17, 34, 10, TAU, PI));
  BEN.CL = { h: 440, w: 400, anse: [0, -440], centre: [0, -200] };
  function clocheMat(o) {
    const m = new DOMMatrix(), sa = clamp(o.salut || 0), t = o.t || 0, gr = o.grande ? 1 : 0;
    const sx = gr ? 1.28 : 1, sy = gr ? 1.22 : 1;
    if (sa > 0) m.translateSelf(196 * sx, 0).rotateSelf(0.2 * ease(sa) * D).translateSelf(-196 * sx, 0);
    if (o.balance) m.translateSelf(0, -440 * sy).rotateSelf(o.balance * D).translateSelf(0, 440 * sy);
    const vb = clamp(o.vibre || 0);
    if (vb > 0) m.translateSelf(3.2 * vb * Math.sin(t * 71), 0).rotateSelf(0.25 * vb * Math.sin(t * 53));
    m.scaleSelf(sx, sy);
    return m;
  }
  function drawCloche(o) {
    const c = cx_(), t = o.t || 0, fe = clamp(o.fele || 0), tn = clamp(o.tourne || 0), lu = clamp(o.lueur || 0);
    const sy = o.grande ? 1.22 : 1, m = clocheMat(o);
    if (o.suspendue) {                                                 // chaîne verticale du crochet jusqu'en haut (o.hautY écran, défaut 0)
      const T = c.getTransform(), sc = Math.hypot(T.c, T.d) || 1, top = -440 * sy - 8;
      const yTop = o.hautY != null ? o.hautY : 0, scrTop = mp(T, [0, top])[1], len = Math.max(0, (scrTop - yTop) / sc);
      for (let k = 0, y = top; y > top - len - 30; y -= 22, k++) {
        if (k % 2) pc(rrect(-3.5, y - 16, 3.5, y + 4, 3), FER, null, 7810 + (k % 7), { drop: false });
        else pc(ring(0, y - 6, 4, 9, 10), FERL, null, 7820 + (k % 7), { drop: false });
      }
    }
    c.save(); c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    if (lu > 0 && !SIL()) {                                            // halo chaud derrière la cloche
      c.save(); c.globalCompositeOperation = 'lighter';
      const R0 = 330 * (1 + 0.03 * Math.sin(t * 5)), g = c.createRadialGradient(0, -200, 40, 0, -200, R0);
      g.addColorStop(0, `rgba(255,190,90,${0.5 * lu})`); g.addColorStop(1, 'rgba(255,140,40,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, -200, R0, 0, TAU); c.fill(); c.restore();
    }
    pc(ell(0, 0, 200, 14, 26), BR.int, () => { strokePts(ep(0, 0, 196, 12, 16, 0.15, PI - 0.15), BR.d, 3.5); strokePts(ep(0, 0, 190, 9, 16, 0.3, PI - 0.3), 'rgba(201,162,74,0.5)', 1.5); }, 7801);
    pc(CL_ANSE, BR.d, () => { strokePts(ep(0, -384, 30, 50, 10, PI + 0.3, PI * 1.6), 'rgba(230,200,120,0.6)', 2); hatch(null, 0.6, 3, 0.3); }, 7802);
    pc(rrect(-52, -398, 52, -380, 5), BR.b, () => { fillPts(rect(-52, -388, 52, -380), BR.d); strokePts([[-46, -394], [10, -395]], 'rgba(240,210,130,0.55)', 1.5); }, 7803);
    pc(CL_BODY, BR.b, () => {
      // reflets (lumière haute à gauche) et ombre à droite
      const hl = [], hr = [];
      for (let y = -372; y <= -22; y += 14) { const r = clR(y); hl.push([-0.56 * r, y]); hr.push([-0.26 * r, y]); }
      fillPts(hl.concat(hr.reverse()), 'rgba(214,176,92,0.55)', 0, 0);
      const ln = []; for (let y = -366; y <= -30; y += 14) ln.push([-0.42 * clR(y), y]);
      strokePts(ln, 'rgba(250,228,160,0.7)', 2.4);
      shade(-60, 0, 200, 0, 0.5, [-210, -400, 210, 20]);
      hatch([[60, -380], [210, -380], [210, 10], [60, 10]], 0.85, 4.4, 0.28);
      // moulures (cercles vus un peu d'en bas)
      for (const [y, col, lw] of [[-300, BR.d, 2.6], [-310, 'rgba(240,210,130,0.6)', 1.4], [-70, BR.d, 2.6], [-78, 'rgba(240,210,130,0.55)', 1.4], [-48, BR.d, 2], [-30, 'rgba(240,210,130,0.5)', 1.6]]) {
        const pts = []; for (let k = 0; k <= 16; k++) pts.push(proj(-PI / 2 + k * PI / 16, y)); strokePts(pts, col, lw);
      }
      // bourrelet de la pince (bas évasé)
      const bb = []; for (let k = 0; k <= 16; k++) bb.push(proj(-PI / 2 + k * PI / 16, -46)); for (let k = 16; k >= 0; k--) bb.push(proj(-PI / 2 + k * PI / 16, -16));
      fillPts(bb, 'rgba(60,40,15,0.22)', 0, 0);
      // rivets décoratifs autour de l'épaule : ils glissent quand la cloche tourne
      const rot = tn * PI / 2;
      for (let k = 0; k < 14; k++) {
        const ph = k * TAU / 14 + rot, cs = Math.cos(normA(ph));
        if (cs < 0.06) continue;
        const p = proj(ph, -290); fillPts(ell(p[0], p[1], 6.5 * cs, 6.5, 10), BR.d); fillPts(ell(p[0] - 1.5 * cs, p[1] - 1.5, 3.2 * cs, 3.2, 8), 'rgba(240,210,130,0.75)');
      }
      // fêlure : zigzag du bord vers le haut, côté face ; tourne → elle glisse sur le côté puis disparaît
      if (fe > 0) {
        const phc = 0.3 + tn * (PI / 2 + 0.45), cs = Math.cos(phc), vis = clamp(cs / 0.28);
        if (vis > 0) {
          const H = 270 * fe, n = 11, top = -14 - H, ptsL = [], ptsR = [], mid = [];
          for (let k = 0; k <= n; k++) {
            const y = lerp(-6, top, k / n), r = clR(y), z = (k % 2 ? 1 : -1) * (k === 0 ? 0 : 19 + 8 * hash(k * 7.3)), dph = z / r;
            const p = proj(phc + dph, y), w = lerp(11, 2, k / n) * Math.max(0.35, cs);
            mid.push([p[0], p[1], 1]); ptsL.push([p[0] - w, p[1], 1]); ptsR.push([p[0] + w * 0.7, p[1], 1]);
          }
          const a = vis;
          fillPts([[mid[0][0] - 16 * cs, -2], [mid[0][0] + 14 * cs, -2], [mid[1][0], mid[1][1]]], `rgba(25,14,4,${a})`, 0, 0);     // éclat au bord
          fillPts(ptsL.concat(ptsR.reverse()), `rgba(22,12,3,${a})`, 0, 0);
          strokePts(mid.map((p) => [p[0] + 7 * Math.max(0.4, cs), p[1] + 1, 1]), `rgba(250,228,160,${0.8 * a})`, 1.8);
          for (const [k, dx, dy] of [[4, 22, -16], [8, -18, -14]]) if (k < n * fe + 1 && k <= n) strokePts([mid[k], [mid[k][0] + dx * cs, mid[k][1] + dy]], `rgba(22,12,3,${a})`, 2.2);
        }
      }
      if (lu > 0) fillPts(CL_BODY, `rgba(255,120,30,${0.32 * lu})`, 0, 0);
    }, 7804);
    c.restore();
  }
  BEN.cloche = (x, y, s, o) => {
    o = o || {}; s = s == null ? 1 : s;
    const r = accRun('cloche', drawCloche, x, y, s, o);
    const P = { anse: [0, -440], centre: [0, -200], levre: [0, 0], avant: [178, -60], arriere: [-178, -60], sommet: [0, -387], fele: proj(0.3 + clamp(o.tourne || 0) * (PI / 2 + 0.45), -14 - 135 * clamp(o.fele || 0)) };
    r.pt = (nom) => { const q = P[nom]; if (!q) return null; const m = clocheMat(o), v = mp(m, q); return r.w('o', v[0], v[1]); };
    return r;
  };
  // ondes sonores en papier découpé autour de la cloche : (x,y) = centre (r.pt('centre')) ; o.t (s depuis le coup), o.k 0..1, o.fele 0..1 (ondes cassées), o.n (3)
  BEN.ondes = (x, y, s, o) => {
    o = o || {}; s = s == null ? 1 : s;
    const c = cx_(), t = Math.max(0, o.t || 0), k = clamp(o.k == null ? 1 : o.k), fe = clamp(o.fele || 0), n = o.n || 3;
    if (k <= 0) return;
    c.save(); c.translate(x, y); c.scale(s, s);
    for (let i = 0; i < n; i++) {
      const u = ((t * 0.9 + i / n) % 1), R0 = 230 + u * 260, a = k * Math.sin(PI * Math.min(1, u * 1.15)) * 0.9;
      if (a <= 0.02) continue;
      for (const sd of [-1, 1]) {
        const pts = [], N = 18;
        for (let j = 0; j <= N; j++) {
          const th = lerp(-0.62, 0.62, j / N), zz = fe * (j % 2 ? 13 : -9) * (0.6 + 0.4 * hash(i * 17 + j + (t * 3 | 0)));
          pts.push([sd * (R0 + zz) * Math.cos(th), (R0 + zz) * Math.sin(th)]);
        }
        const gap = fe > 0.3 ? [6, 7, 12] : [];
        c.lineCap = 'round'; c.lineJoin = fe > 0.3 ? 'miter' : 'round';
        for (const [lw, col] of [[11, `rgba(40,25,10,${0.35 * a})`], [7, `rgba(244,226,170,${a})`]]) {
          c.lineWidth = lw; c.strokeStyle = col; c.beginPath();
          pts.forEach((p, j) => { if (j === 0 || gap.includes(j)) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); });
          c.stroke();
        }
      }
    }
    c.restore();
  };

  // =====================================================================
  // LE CHARIOT — plateau de chêne, deux grandes roues, timon ; (x,y) = sol sous le milieu ; 560 × 200 local (dessus du plateau y = -200)
  // =====================================================================
  BEN.CHAR = { dessus: -214, roue: 90, roues: [-165, 165], timon: [510, -36] };
  function drawRoue(cx, cy, R, ang, seed) {
    pc(ring(cx, cy, R - 16, R, 28), FER, () => strokePts(ep(cx, cy, R - 4, R - 4, 14, PI * 1.05, PI * 1.6), 'rgba(200,210,215,0.4)', 1.6), seed);
    pc(ring(cx, cy, R - 28, R - 15, 28), CHENE, () => hatch(null, 0.4, 3.4, 0.25), seed + 1);
    for (let k = 0; k < 10; k++) {
      const a = ang + k * TAU / 10, ca = Math.cos(a), sa = Math.sin(a);
      pc(ribbon([[cx + ca * 16, cy + sa * 16], [cx + ca * (R - 24), cy + sa * (R - 24)]], 10, 7), CHENEL, () => hatch(null, a, 3, 0.2), seed + 2 + k, { drop: false });
    }
    pc(ell(cx, cy, 20, 20, 14), CHENED, () => { dot(cx, cy, 10, FER); dot(cx - 3, cy - 3, 3, 'rgba(220,220,210,0.6)'); for (let k = 0; k < 5; k++) dot(cx + Math.cos(ang + k * 1.256) * 15, cy + Math.sin(ang + k * 1.256) * 15, 2, '#b08d45'); }, seed + 14);
  }
  function drawChariot(o) {
    const ang = o.roule != null ? o.roule / (90 * (o._s || 1)) : (o.t || 0) * (o.vitesse || 0);
    pc(ribbon([[250, -168], [390, -110], [500, -40]], 18, 14), CHENE, () => { hatch(null, 0.5, 3.4, 0.22); strokePts([[260, -172], [495, -46]], 'rgba(255,230,190,0.3)', 1.4); }, 7901);   // timon
    pc(ring(510, -36, 7, 14, 14), FER, null, 7902);
    pc(rect(-250, -186, 250, -166), CHENED, () => { for (const x of [-200, -60, 60, 200]) dot(x, -176, 3, FERL); hatch(null, 0.3, 3, 0.25); }, 7903);   // longeron
    pc([[-266, -214, 1], [266, -214, 1], [262, -186, 1], [-262, -186, 1]], CHENE, () => {                                                         // plateau
      for (const y of [-205, -195]) strokePts([[-262, y], [262, y]], 'rgba(50,30,12,0.45)', 1);
      for (const x of [-180, -40, 110, 220]) strokePts([[x, -214], [x, -186]], 'rgba(50,30,12,0.55)', 1.2);
      strokePts([[-262, -212], [262, -212]], 'rgba(255,235,200,0.35)', 1.4); hatch(null, 0.15, 3.6, 0.2);
      for (const x of [-250, 250]) fillPts(rect(x - 8, -214, x + 8, -186), FER);
    }, 7904);
    for (const x of BEN.CHAR.roues) drawRoue(x, -90, 90, ang, 7910 + (x > 0 ? 20 : 0));
  }
  BEN.chariot = (x, y, s, o) => {
    o = Object.assign({}, o || {}); s = s == null ? 0.9 : s; o._s = s;
    const r = accRun('chariot', drawChariot, x, y, s, o);
    r.dessus = r.w('o', 0, -214);
    if (o.cloche) { const cs = (o.clocheS || 1) * s; r.cloche = BEN.cloche(r.dessus[0], r.dessus[1] + 2 * s, cs, Object.assign({ dir: o.dir, cast: o.cast }, o.cloche)); }
    return r;
  };

  // aiguilles du cadran (dessin direct à l'écran) : (cx,cy) centre écran, r rayon écran, h heure décimale (ex. 3.25)
  BEN.aiguilles = (cx, cy, r, h, o) => {
    o = o || {}; const c = cx_(); c.save(); c.translate(cx, cy); if (o.alpha != null) c.globalAlpha = o.alpha;
    const hand = (a, L, w) => { c.save(); c.rotate(a); c.beginPath(); c.moveTo(-w * 0.5, L * 0.18); c.lineTo(-w * 0.35, -L * 0.78); c.lineTo(-w * 1.3, -L * 0.84); c.lineTo(0, -L); c.lineTo(w * 1.3, -L * 0.84); c.lineTo(w * 0.35, -L * 0.78); c.lineTo(w * 0.5, L * 0.18); c.closePath();
      c.fillStyle = '#1d1f22'; c.fill(); c.strokeStyle = 'rgba(176,141,69,0.9)'; c.lineWidth = Math.max(1, r * 0.012); c.stroke(); c.restore(); };
    hand((h % 12) / 12 * TAU, r * 0.55, r * 0.05); hand((h % 1) * TAU, r * 0.84, r * 0.035);
    c.beginPath(); c.arc(0, 0, r * 0.07, 0, TAU); c.fillStyle = '#b08d45'; c.fill(); c.restore();
  };
  // feu du four : lueur vacillante + langues de flamme ; (x,y) = bas de la bouche (BEN.FONDERIE.bouche), s = échelle du décor
  BEN.feu = (t, x, y, s, k) => {
    k = k == null ? 1 : k; s = s || 1; const c = cx_(); c.save(); c.translate(x, y); c.scale(s, s); c.globalCompositeOperation = 'lighter';
    const fl = 0.85 + 0.15 * M.noise(t * 3, 5), g = c.createRadialGradient(0, -80, 10, 0, -80, 330 * fl);
    g.addColorStop(0, `rgba(255,170,70,${0.38 * k})`); g.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = g; c.fillRect(-340, -420, 680, 440);
    for (let i = 0; i < 5; i++) {
      const xx = -52 + i * 26, h = (60 + 40 * hash(i * 3.3)) * (0.8 + 0.3 * M.noise(t * 4 + i, i)), sw = 8 * M.noise(t * 5, i + 9);
      c.beginPath(); c.moveTo(xx - 15, 0); c.quadraticCurveTo(xx - 12 + sw, -h * 0.5, xx + sw * 1.5, -h); c.quadraticCurveTo(xx + 12 + sw, -h * 0.5, xx + 15, 0); c.closePath();
      c.fillStyle = `rgba(255,${150 + 60 * hash(i)},60,${0.6 * k})`; c.fill();
    }
    c.restore();
  };

  // =====================================================================
  // DÉCORS PRÉ-RENDUS — BEN.init() (dans S.init) → BEN.K
  // =====================================================================
  const W = M.W;
  function paper(x, w, h, ox, oy, a) { if (!M.tex || !M.tex.paperPat) return; x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = a; x.fillStyle = M.tex.paperPat; x.fillRect(-ox, -oy, w, h); x.restore(); }
  function makeCiel() {
    const H = M.ST.back + 5;
    return M.pre(W, H, (x) => {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#3a4556'); g.addColorStop(0.45, '#727e89'); g.addColorStop(0.8, '#b2b1a4'); g.addColorStop(1, '#d1c6aa');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const R = M.rng(1859);
      for (let i = 0; i < 9; i++) {
        const cx = R() * W, cy = 300 + R() * 760, w = 240 + R() * 300, h = 34 + R() * 40, pts = [];
        for (let k = 0; k <= 14; k++) { const a = PI + k * PI / 14; pts.push([cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h * (0.7 + 0.5 * hash(i * 13 + k))]); }
        pts.push([cx + w * 0.4, cy + 8], [cx - w * 0.4, cy + 8]);
        piece(pts, M.mixc('#8e98a0', '#d9d4c4', clamp((cy - 300) / 760)), () => hatch(null, 0.2, 6, 0.08), { seed: 1859 + i, texA: 0.5 });
      }
      const b = x.createLinearGradient(0, H - 420, 0, H); b.addColorStop(0, 'rgba(225,222,210,0)'); b.addColorStop(1, 'rgba(225,222,210,0.55)');
      x.fillStyle = b; x.fillRect(0, H - 420, W, 420);
      paper(x, W, H, 0, 0, 0.4);
    });
  }
  function makeVille() {
    const w = 1260, h = 560;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      const top = [[-630, 0, 1], [-630, -140, 1]];
      const add = (xx, y) => top.push([xx, y, 1]);
      add(-530, -140); add(-530, -400); add(-540, -400); add(-536, -452); add(-524, -400); add(-470, -410); add(-468, -440); add(-462, -410);   // Victoria Tower
      add(-410, -400); add(-406, -452); add(-394, -400); add(-390, -400); add(-390, -150);
      for (let xx = -380; xx < 600; xx += 34) {
        if (xx > -60 && xx < 40) { add(-50, -150); add(-50, -270); add(-34, -300); add(-6, -300); add(0, -390); add(6, -300); add(34, -300); add(50, -270); add(50, -150); xx = 50; continue; }   // tour centrale
        const bay = ((xx + 380) / 34 | 0) % 5 === 0, hb = bay ? -196 : -150;
        add(xx, hb); add(xx + 4, hb - (bay ? 34 : 22)); add(xx + 8, hb); add(xx + 34, hb);
      }
      add(630, -150); add(630, 0);
      piece(top, '#a3abb0', () => {
        for (let xx = -370; xx < 620; xx += 17) for (const y of [-120, -80, -44]) fillPts(rect(xx, y, xx + 5, y + 18), 'rgba(80,90,100,0.28)');
        for (let y = -380; y < -150; y += 32) for (const xx of [-518, -490, -440, -410]) fillPts(rect(xx, y, xx + 6, y + 18), 'rgba(80,90,100,0.28)');
        hatch(null, 1.2, 5, 0.12);
      }, { seed: 1834, texA: 0.5 });
      piece(rect(-630, -26, 630, 0), '#8c99a0', () => { for (let i = 0; i < 18; i++) strokePts([[-600 + i * 70, -14 + (i % 3) * 4], [-560 + i * 70, -14 + (i % 3) * 4]], 'rgba(230,235,235,0.5)', 1.5); }, { seed: 1835, texA: 0.4 });
      x.save(); x.globalCompositeOperation = 'source-atop';
      const g = x.createLinearGradient(0, -420, 0, 0); g.addColorStop(0, 'rgba(215,218,215,0.05)'); g.addColorStop(0.7, 'rgba(215,218,215,0.45)'); g.addColorStop(1, 'rgba(215,218,215,0.7)');
      x.fillStyle = g; x.fillRect(-w / 2, -h, w, h); x.restore();
    });
    cv.padB = 10; return M.withShadow(cv, 6);
  }
  BEN.TOUR = { cadran: { dx: 0, dy: -810, r: 92 }, beffroi: { dx: 0, dy: -970 }, haut: -1240, demiLarge: 128 };
  function makeTour() {
    const w = 320, h = 1260;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      const ST_ = '#c4ae84', STD = '#9c8762', STL = '#dccaa2', OR = '#b08d45', ORL = '#d9bd72';
      piece(rect(-120, -60, 120, 0), STD, () => hatch(null, 0.8, 4, 0.25), { seed: 2001 });
      piece(rect(-104, -700, 104, -58), ST_, () => {
        for (const xx of [-104, -52, 0, 52, 104]) fillPts(rect(xx - 4, -700, xx + 4, -58), STD);
        for (let y = -660; y < -100; y += 92) fillPts(rect(-104, y, 104, y + 6), STD);
        for (let y = -640; y < -120; y += 92) for (const xx of [-78, -26, 26, 78]) { const lan = [[xx - 8, y + 66, 1], [xx - 8, y + 18], [xx, y + 4, 1], [xx + 8, y + 18], [xx + 8, y + 66, 1]]; fillPts(lan, '#4c4436'); strokePts([[xx, y + 10], [xx, y + 66]], STL, 1); }
        strokePts([[-96, -690], [-96, -66]], 'rgba(255,245,220,0.35)', 3);
        hatch([[30, -700], [104, -700], [104, -58], [30, -58]], 0.9, 4.4, 0.22); shade(-104, 0, 104, 0, 0.3, [-110, -710, 110, -50]);
      }, { seed: 2002 });
      piece(rect(-128, -940, 128, -696), ST_, () => {
        fillPts(rect(-128, -940, 128, -924), STD); fillPts(rect(-128, -712, 128, -696), STD);
        for (const xx of [-128, 116]) fillPts(rect(xx, -940, xx + 12, -696), STD);
        fillPts(rect(-104, -914, 104, -706), OR);
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cxx = sx * 88, cyy = -810 + sy * 88; fillPts(ell(cxx, cyy, 10, 10, 10), ORL); dot(cxx, cyy, 4, '#76592a'); }
        hatch([[40, -940], [128, -940], [128, -696], [40, -696]], 0.9, 4.4, 0.2);
      }, { seed: 2003 });
      piece(ell(0, -810, 102, 102, 40), '#2a2620', null, { seed: 2004 });
      piece(ell(0, -810, 92, 92, 40), '#ece4cf', () => {
        for (let k = 0; k < 60; k++) { const a = k * TAU / 60; dot(Math.cos(a) * 84, -810 + Math.sin(a) * 84, 1.6, '#3a3328'); }
        for (let k = 0; k < 12; k++) {
          const a = k * TAU / 12, big = k % 3 === 0, r0 = big ? 56 : 66, r1 = 80, ww = big ? 4.5 : 2.6;
          const ca = Math.cos(a), sa = Math.sin(a);
          fillPts([[ca * r0 - sa * ww, -810 + sa * r0 + ca * ww, 1], [ca * r1 - sa * ww, -810 + sa * r1 + ca * ww, 1], [ca * r1 + sa * ww, -810 + sa * r1 - ca * ww, 1], [ca * r0 + sa * ww, -810 + sa * r0 - ca * ww, 1]], '#2a2620');
        }
        strokePts(ep(0, -810, 46, 46, 30, 0, TAU), 'rgba(176,141,69,0.7)', 1.5);
        shade(-60, -870, 60, -750, 0.18, [-95, -905, 95, -715]);
      }, { seed: 2005 });
      piece(rect(-112, -1012, 112, -936), ST_, () => {
        for (const xx of [-66, 0, 66]) { const ar = [[xx - 22, -944, 1], [xx - 22, -986], [xx, -1006, 1], [xx + 22, -986], [xx + 22, -944, 1]]; fillPts(ar, '#2c2820'); for (let y = -990; y < -948; y += 8) strokePts([[xx - 20, y], [xx + 20, y + 3]], 'rgba(176,141,69,0.75)', 1.6); }
        fillPts(rect(-112, -1012, 112, -1000), OR); hatch(null, 0.9, 4.4, 0.2);
      }, { seed: 2006 });
      piece([[-116, -1008, 1], [116, -1008, 1], [20, -1178, 1], [-20, -1178, 1]], '#3b434c', () => {
        for (const k of [-0.6, -0.2, 0.2, 0.6]) strokePts([[k * 116, -1008], [k * 20, -1178]], OR, 2.2);
        for (let y = -1030; y > -1170; y -= 28) { const hw = lerp(116, 20, (-1008 - y) / 170); strokePts([[-hw, y], [hw, y]], 'rgba(150,160,170,0.35)', 1); }
        hatch(null, 0.8, 4, 0.2, 1, '200,210,220');
      }, { seed: 2007 });
      for (const sx of [-1, 1]) piece([[sx * 104 - 9, -1008, 1], [sx * 104 + 9, -1008, 1], [sx * 104, -1072, 1]], OR, null, { seed: 2008 + sx });
      piece([[-20, -1180, 1], [20, -1180, 1], [14, -1206, 1], [-14, -1206, 1]], OR, () => strokePts([[-10, -1200], [-12, -1184]], 'rgba(255,240,200,0.6)', 1.4), { seed: 2010 });
      piece([[-4, -1204, 1], [4, -1204, 1], [0, -1240, 1]], ORL, null, { seed: 2011 });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  BEN.COUR = { lampe: { dx: 400, dy: -620 }, mur: -232, grilleHaut: -396 };
  function makeCour() {
    const w = 1140, h = 720;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      const R = M.rng(1858), FERG = '#23282b', PIER = '#b4a990';
      piece(rect(-570, -216, 570, -30), '#8a5a44', () => {
        for (let y = -212, r = 0; y < -30; y += 16, r++) { strokePts([[-570, y], [570, y]], 'rgba(205,180,155,0.55)', 1.2); for (let xx = -570 + (r % 2) * 22; xx < 570; xx += 44) strokePts([[xx, y], [xx, y + 16]], 'rgba(205,180,155,0.5)', 1); }
        for (let i = 0; i < 40; i++) { const bx = -570 + (R() * 26 | 0) * 44, by = -212 + (R() * 11 | 0) * 16; fillPts(rect(bx + 1, by + 1, bx + 43, by + 15), R() < 0.5 ? 'rgba(60,25,15,0.25)' : 'rgba(190,140,110,0.2)'); }
        hatch(null, 0.8, 4.2, 0.22); shade(0, -216, 0, -30, 0.25, [-575, -220, 575, -28]);
      }, { seed: 3001 });
      piece(rect(-570, -232, 570, -212), PIER, () => { strokePts([[-570, -229], [570, -229]], 'rgba(255,250,235,0.5)', 1.4); hatch(null, 0.2, 4, 0.2); }, { seed: 3002 });
      // grille : barreaux à pointes de lance
      for (let xx = -556; xx <= 556; xx += 22) {
        if ([-470, -120, 230].some((p) => Math.abs(xx - p) < 34) || Math.abs(xx - 400) < 18) continue;
        piece([[xx - 2.6, -232, 1], [xx + 2.6, -232, 1], [xx + 2.6, -378, 1], [xx + 6, -380, 1], [xx, -396, 1], [xx - 6, -380, 1], [xx - 2.6, -378, 1]], FERG, null, { seed: 3010 + (xx & 15), drop: false, texA: 0.3 });
      }
      for (const y of [-256, -360]) piece(rect(-560, y - 4, 560, y + 4), FERG, null, { seed: 3030, drop: false, texA: 0.3 });
      for (const px of [-470, -120, 230]) {
        piece(rect(px - 28, -430, px + 28, -30), PIER, () => { fillPts(rect(px + 10, -430, px + 28, -30), 'rgba(80,70,50,0.25)'); for (let y = -400; y < -40; y += 48) strokePts([[px - 28, y], [px + 28, y]], 'rgba(90,80,60,0.45)', 1.2); hatch(null, 0.8, 4, 0.2); }, { seed: 3040 + px });
        piece(rect(px - 36, -444, px + 36, -428), '#c8bea6', null, { seed: 3041 + px });
        piece(ell(px, -462, 17, 17, 14), '#c8bea6', () => { dot(px - 5, -467, 5, 'rgba(255,250,235,0.5)'); shade(px - 12, -470, px + 14, -452, 0.35, [px - 20, -482, px + 20, -444]); }, { seed: 3042 + px });
      }
      // pavés (cour)
      piece(rect(-570, -34, 570, 0), '#7a7166', () => {
        for (let r = 0; r < 3; r++) for (let xx = -566 + (r % 2) * 14; xx < 570; xx += 28) fillPts(ell(xx, -28 + r * 11, 12, 5, 10), M.mixc('#958b7e', '#6a6258', hash(xx * 0.7 + r)));
      }, { seed: 3050 });
      // lampadaire à gaz
      const lx = 400;
      const gl = x.createRadialGradient(lx, -640, 10, lx, -640, 170); gl.addColorStop(0, 'rgba(255,220,140,0.5)'); gl.addColorStop(1, 'rgba(255,200,120,0)');
      x.fillStyle = gl; x.fillRect(lx - 180, -820, 360, 360);
      piece([[lx - 22, -14, 1], [lx + 22, -14, 1], [lx + 16, -60], [lx + 8, -90], [lx + 6, -580, 1], [lx - 6, -580, 1], [lx - 8, -90], [lx - 16, -60]], '#2c3530', () => {
        strokePts([[lx - 2, -100], [lx - 2, -570]], 'rgba(200,220,210,0.3)', 1.6); fillPts(rect(lx - 14, -110, lx + 14, -100), '#b08d45');
        hatch(null, 0.8, 3, 0.25, 1, '200,220,210');
      }, { seed: 3060 });
      piece(rect(lx - 34, -526, lx + 34, -518), '#2c3530', null, { seed: 3061 });
      piece([[lx - 26, -580, 1], [lx + 26, -580, 1], [lx + 34, -660, 1], [lx - 34, -660, 1]], '#e8cf8c', () => {
        fillPts([[lx - 8, -584], [lx + 8, -584], [lx + 10, -656], [lx - 10, -656]], 'rgba(255,250,220,0.8)');
        for (const xx of [lx - 13, lx + 13]) strokePts([[xx, -582], [xx * 1 + (xx > lx ? 4 : -4), -658]], '#2c3530', 2.4);
      }, { seed: 3062 });
      piece([[lx - 42, -658, 1], [lx + 42, -658, 1], [lx + 8, -690, 1], [lx - 8, -690, 1]], '#2c3530', null, { seed: 3063 });
      piece(ell(lx, -696, 8, 8, 10), '#b08d45', null, { seed: 3064 });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  BEN.FONDERIE = { bouche: { dx: -280, dy: -70 }, moule: { dx: 330, dy: -40, haut: -470 }, cheminee: { dx: -280 } };
  function makeFonderie() {
    const w = 1160, h = 1330;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      const BRQ = '#3c2f2a', BRQF = '#9a5a3e';
      piece(rect(-580, -1320, 580, 0), BRQ, () => {
        for (let y = -1316, r = 0; y < 0; y += 22, r++) { strokePts([[-580, y], [580, y]], 'rgba(20,12,8,0.45)', 1.2); for (let xx = -580 + (r % 2) * 30; xx < 580; xx += 60) strokePts([[xx, y], [xx, y + 22]], 'rgba(20,12,8,0.4)', 1); }
        const g = x.createRadialGradient(-280, -160, 40, -280, -160, 520); g.addColorStop(0, 'rgba(230,120,50,0.5)'); g.addColorStop(1, 'rgba(230,120,50,0)');
        x.fillStyle = g; x.fillRect(-580, -700, 900, 700);
        hatch(null, 0.8, 5, 0.25, 1, '10,6,4'); shade(0, -400, 0, -1320, 0.5, [-585, -1325, 585, -380]);
      }, { seed: 4001, texA: 0.5 });
      // cheminée
      piece([[-345, -420, 1], [-215, -420, 1], [-225, -1320, 1], [-335, -1320, 1]], '#6e4432', () => {
        for (let y = -1310; y < -420; y += 20) strokePts([[-345, y], [-215, y]], 'rgba(20,12,8,0.45)', 1);
        for (const y of [-560, -760, -960, -1160]) fillPts(rect(-350, y, -210, y + 12), '#2a2422');
        hatch(null, 0.8, 4, 0.3); shade(-345, 0, -215, 0, 0.35, [-350, -1320, -210, -410]);
      }, { seed: 4002 });
      // four
      const four = [[-480, 0, 1], [-480, -330], [-440, -410], [-360, -450], [-280, -460], [-200, -450], [-120, -410], [-80, -330], [-80, 0, 1]];
      piece(four, BRQF, () => {
        for (let y = -450, r = 0; y < 0; y += 20, r++) { strokePts([[-480, y], [-80, y]], 'rgba(40,20,10,0.5)', 1.1); for (let xx = -480 + (r % 2) * 18; xx < -80; xx += 36) strokePts([[xx, y], [xx, y + 20]], 'rgba(40,20,10,0.45)', 1); }
        const g = x.createRadialGradient(-280, -120, 30, -280, -120, 240); g.addColorStop(0, 'rgba(255,170,80,0.55)'); g.addColorStop(1, 'rgba(255,140,60,0)');
        x.fillStyle = g; x.fillRect(-480, -460, 400, 460);
        hatch(null, 0.8, 4.2, 0.25); shade(-280, -460, -280, 0, 0.2, [-485, -465, -75, 0]);
      }, { seed: 4003 });
      const arch = [[-360, -10, 1], [-360, -150], [-340, -200], [-280, -228], [-220, -200], [-200, -150], [-200, -10, 1]];
      piece(arch.map((p) => [p[0] + (p[0] < -280 ? -14 : 14), p[1] - (p[1] < -100 ? 14 : 0), p[2]]), '#2b2522', null, { seed: 4004 });
      piece(arch, '#ffb35a', () => {
        const g = x.createRadialGradient(-280, -60, 10, -280, -60, 200); g.addColorStop(0, '#fff3c0'); g.addColorStop(0.45, '#ffb04a'); g.addColorStop(1, '#a8361c');
        x.fillStyle = g; x.fillRect(-370, -240, 180, 240);
        for (let i = 0; i < 5; i++) { const xx = -340 + i * 30; fillPts([[xx - 14, -10], [xx - 6, -70 - 30 * hash(i)], [xx, -110 - 30 * hash(i + 3)], [xx + 8, -60], [xx + 14, -10]], 'rgba(255,240,170,0.75)'); }
      }, { seed: 4005, texA: 0.25 });
      // moule de la cloche (chape d'argile cerclée de fer) dans sa fosse
      const mx = 330, ms = 1.0;
      const mould = [[mx - 180 * ms, -40, 1], [mx - 170 * ms, -90], [mx - 130 * ms, -200], [mx - 112 * ms, -320], [mx - 90 * ms, -400], [mx - 40 * ms, -430], [mx - 24, -436, 1], [mx - 30, -470, 1], [mx + 30, -470, 1], [mx + 24, -436, 1], [mx + 40 * ms, -430], [mx + 90 * ms, -400], [mx + 112 * ms, -320], [mx + 130 * ms, -200], [mx + 170 * ms, -90], [mx + 180 * ms, -40, 1]];
      piece(mould, '#8e7a62', () => {
        for (const y of [-110, -230, -340]) { const hw = y < -300 ? 118 : y < -200 ? 134 : 166; fillPts(rect(mx - hw, y - 7, mx + hw, y + 7), '#262626'); for (const s2 of [-1, 1]) dot(mx + s2 * (hw - 10), y, 3, '#7a7a74'); }
        strokePts([[mx - 70, -420], [mx - 120, -200], [mx - 150, -60]], 'rgba(230,210,180,0.35)', 3);
        hatch(null, 0.9, 4, 0.3); shade(mx - 150, 0, mx + 180, 0, 0.45, [mx - 190, -480, mx + 190, -30]);
      }, { seed: 4006 });
      piece(rect(mx - 230, -44, mx + 230, 0), '#55402f', () => { for (let xx = mx - 226; xx < mx + 230; xx += 34) strokePts([[xx, -44], [xx, 0]], 'rgba(20,12,8,0.5)', 1); strokePts([[mx - 230, -40], [mx + 230, -40]], 'rgba(255,220,180,0.25)', 1.4); }, { seed: 4007 });
      // chaîne de palan qui descend du plafond
      for (let y = -1320, k = 0; y < -640; y += 20, k++) { if (k % 2) piece(rrect(66, y, 74, y + 22, 3), '#2a2a2a', null, { seed: 4010 + (k % 5), drop: false }); else piece(ring(70, y + 10, 4, 9, 10), '#3a3a3a', null, { seed: 4020 + (k % 5), drop: false }); }
      piece([[60, -640], [80, -640], [84, -610], [74, -590], [62, -600], [70, -608], [72, -624], [62, -626]], '#2a2a2a', null, { seed: 4030 });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  BEN.BEFFROI = { crochet: { dx: 0, dy: -624 }, poteaux: [-340, 340], poutre: -650 };
  function makeBeffroi() {
    const w = 1000, h = 1430;
    const cv = M.cutFlat(w, h, w / 2, h - 10, (x) => {
      const OK = '#7a5a36', OKD = '#5c4226', OKL = '#a07a4a';
      const grain = (x0, y0, x1, y1, vert) => () => {
        for (let i = 1; i < 4; i++) { const f = i / 4; if (vert) strokePts([[lerp(x0, x1, f), y0 + 4], [lerp(x0, x1, f) + 2, (y0 + y1) / 2], [lerp(x0, x1, f) - 1, y1 - 4]], 'rgba(40,25,10,0.45)', 1); else strokePts([[x0 + 4, lerp(y0, y1, f)], [(x0 + x1) / 2, lerp(y0, y1, f) + 2], [x1 - 4, lerp(y0, y1, f) - 1]], 'rgba(40,25,10,0.45)', 1); }
        hatch(null, vert ? 1.3 : 0.25, 3.6, 0.25);
      };
      // cintres : cordes qui montent
      for (const sx of [-1, 1]) for (const dx of [0, 14]) piece(ribbon([[sx * (380 - dx), -800], [sx * (380 - dx), -1420]], 5, 5), '#b8a27a', () => { for (let y = -1410; y < -800; y += 12) strokePts([[sx * (380 - dx) - 2.5, y], [sx * (380 - dx) + 2.5, y + 6]], 'rgba(80,60,30,0.5)', 1); }, { seed: 5001 + dx + sx, drop: false });
      for (const sx of [-1, 1]) {
        piece(rect(sx * 340 - 25, -790, sx * 340 + 25, -10), OK, grain(sx * 340 - 25, -790, sx * 340 + 25, -10, true), { seed: 5010 + sx });
        piece(rect(sx * 340 - 40, -40, sx * 340 + 40, 0), '#8e8676', () => hatch(null, 0.8, 4, 0.25), { seed: 5012 + sx });
        piece(ribbon([[sx * 330, -480], [sx * 180, -660]], 28, 28), OKD, () => hatch(null, 0.9, 3.4, 0.25), { seed: 5014 + sx });
        for (const yy of [-600, -470]) dot(sx * 340, yy, 5, '#3a3a3a');
      }
      piece(rect(-440, -712, 440, -650), OKD, grain(-440, -712, 440, -650, false), { seed: 5020 });
      piece(rect(-410, -812, 410, -772), OK, grain(-410, -812, 410, -772, false), { seed: 5021 });
      for (const xx of [-200, 0, 200]) piece(rect(xx - 14, -774, xx + 14, -710), OKL, null, { seed: 5022 + xx });
      for (const xx of [-300, -120, 120, 300]) { dot(xx, -681, 6, '#2e2e2e'); dot(xx - 1.5, -682.5, 2, '#8a8a82'); }
      piece(rect(-40, -656, 40, -640), FER, null, { seed: 5030 });
      piece(ring(0, -632, 6, 13, 12), FER, () => strokePts(ep(0, -632, 10, 10, 6, PI, PI * 1.5), 'rgba(200,210,215,0.5)', 1.4), { seed: 5031 });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  BEN.init = function () {
    if (BEN.K) return BEN.K;
    const K = (BEN.K = {});
    K.ciel = makeCiel(); K.ville = makeVille(); K.tour = makeTour(); K.cour = makeCour(); K.fonderie = makeFonderie(); K.beffroi = makeBeffroi();
    return K;
  };
})();
