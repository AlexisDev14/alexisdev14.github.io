// persos.js — « Le Black Friday, un surnom inventé par des policiers excédés » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.bf (alias BF). Appeler BF.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre ni chiffre. Déterministe (hash, aucun Math.random). Tout dans une IIFE.
// Infrastructure du corps (bras à coude rond, genoux, IK interne, objets tenus) reprise de bibliotheque/greve.js.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, noise, smooth } = M;
  const BF = (M.bf = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  BF.geo = { ep, ell, rrect, box, mp, rot };

  // OBJ : registre des objets (rempli plus bas) ; grip = point tenu, p2 = seconde prise, pts = points nommés, base = point posé, plat = dessiné DERRIÈRE la marionnette
  const OBJ = {};
  BF.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }

  // ---- accessoire seul : M.puppet à une pièce invisible (ombre portée possible), l'objet se dessine dans l'extra
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accRaw(key, fn, x, y, s, o) {
    o = o || {};
    return M.puppet(accDef(key, fn), { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name];
    return accRaw(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({ t: 0 }, oo)); c.restore(); }, x, y, s == null ? 0.9 : s, o);
  }
  // =====================================================================
  // CORPS — bras et jambes à articulations rondes (rivet au centre), genoux et chevilles articulés
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
      if (b > 0.05) continue;                                                   // coude toujours plié vers l'avant (jamais cassé)
      const sc = pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1];
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    if (!best) { const a = tv; best = { a: normA(a), b: 0 }; }
    return best;
  }
  const thighPts = (th) => [[-19 * th, -12], [17 * th, -14], [22 * th, 20], [20 * th, 70], [17, KNEE - 6]].concat(ep(0, KNEE, 17, 17, 8, 0, PI), [[-17, KNEE - 6], [-21 * th, 60], [-22 * th, 10]]);
  const shinPts = () => ep(0, 0, 16, 16, 8, PI, TAU).concat([[16, 12], [15, 60], [12, ANK - 14], [13, ANK + 3], [-15, ANK + 3], [-16, 70], [-17, 20], [-16, 8]]);
  const FOOT = {
    soulier: [[-16, -6], [12, -6], [22, -1], [38, 3], [46, 11, 1], [45, 15, 1], [-17, 15, 1], [-19, 5]],
    sabot: [[-17, -9], [8, -9], [26, -4], [44, -1], [54, -8, 1], [53, 4], [46, 15, 1], [-17, 15, 1], [-20, 2]],
    basket: [[-17, -8], [10, -8], [24, -2], [40, 2], [49, 9], [48, 15, 1], [-18, 15, 1], [-20, 3]],
    escarpin: [[-15, -6], [8, -6], [20, -2], [36, 4], [44, 10, 1], [42, 14, 1], [-6, 14], [-12, 26, 1], [-17, 26, 1], [-17, 8]],
    botte: [[-17, -6], [14, -6], [24, -1], [40, 3], [47, 11, 1], [46, 15, 1], [-18, 15, 1], [-20, 5]],
  };
  function footPaint(kind, col) {
    return () => {
      if (kind === 'basket') { fillPts([[-20, 8], [50, 8], [50, 16], [-20, 16]], '#cfc8b9'); strokePts([[0, -4], [24, 0]], 'rgba(120,110,100,0.6)', 1.2); strokePts([[-10, 4], [36, 6]], '#b98a5a', 1.4); return; }
      if (kind === 'escarpin') { strokePts([[0, -2], [30, 4]], 'rgba(255,255,255,0.25)', 1.2); return; }
      if (kind === 'bicolore') { fillPts([[-20, -8], [10, -8], [14, 16], [-20, 16]], '#5a3a24'); fillPts([[30, 0], [50, 6], [50, 16], [28, 16]], '#5a3a24'); fillPts([[-20, 11], [50, 11], [50, 16], [-20, 16]], 'rgba(10,8,6,0.55)'); return; }
      if (kind === 'sabot') { strokePts([[-14, -2], [40, 2]], 'rgba(255,230,180,0.35)', 1.4); hatch(null, 0.4, 4, 0.2); return; }
      fillPts([[-20, 11], [50, 11], [50, 16], [-20, 16]], 'rgba(10,8,6,0.55)'); strokePts([[16, -2], [36, 3]], 'rgba(255,255,255,0.22)', 1.3);
      if (kind === 'boucle') { fillPts(box(14, -4, 24, 4), '#c9a24a'); }
    };
  }
  // pièces « objet tenu » (TEF) + « charge » portée à deux mains (dessinée dans le repère du torse, devant ou dans le dos)
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function chargeDraw(p, dos) {
    const ch = p._charge; if (!ch || (ch.dos ? 'dos' : ch.dessus ? 'dessus' : 'avant') !== dos) return;
    const ob = OBJ[ch.nom], c = cx_(); c.save(); c.translate(ch.pos[0], ch.pos[1]); c.rotate(ch.angT); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({ t: p.t || 0 }, ch.o)); c.restore();
  }
  function heldParts(skin, seed) {
    const has = (v) => v && v !== 'rien';
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !(OBJ[p.tenu] && OBJ[p.tenu].plat)) heldDraw(p.tenu, p.tenuO, p); } },
      objetPlat: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 7, pts: OFFP, extra: (p) => { if (has(p.tenu) && OBJ[p.tenu] && OBJ[p.tenu].plat) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => ((has(p.tenu) && p.handF !== 'open' && p.handF !== 'cup') || (p._charge && p._charge.tient) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      charge: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => chargeDraw(p, 'avant') },
      chargeAv: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 8, pts: OFFP, extra: (p) => chargeDraw(p, 'dessus') },
      chargeDos: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => chargeDraw(p, 'dos') },
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
  // torse générique : w largeur, hem bas de l'habit (y local), belly ventre, tails pans arrière
  function torsoPts(w, hem, belly, tails) {
    belly = belly || 0;
    const back = tails ? [[-40 * w, tails, 1], [-26 * w, tails - 6], [-30 * w, hem + 10]] : [[-40 * w, hem + 2, 1]];
    return [[-14, -176], [8, -180], [16, -168], [26 * w, -150], [34 * w, -112], [36 * w + belly * 0.7, -70], [36 * w + belly, -30], [36 * w + belly * 0.6, 4], [38 * w, hem * 0.55], [40 * w, hem, 1], [0, hem + 2]]
      .concat(back, [[-38 * w, hem * 0.4], [-38 * w, -60], [-37 * w, -110], [-33 * w, -150], [-26, -168]]);
  }
  // fabrique d'une marionnette : o = { seed, torso, coat, torsoPaint, sleeve, sleeveB, skin, skinD, cuff, roule, armW, thigh, thighB, shin, shinB, shinPaint,
  //   shoe, foot, head, headPaint, parts (pièces en plus), backs / heads / fronts (ordre) }
  function body(o) {
    const sd = o.seed, th = o.th || 1;
    const legPaint = (back, lo) => () => { if (lo && o.shinPaint) o.shinPaint(back); if (!lo && o.thighPaint) o.thighPaint(back); hatch(back ? null : [[-26, -20], [-6, -20], [-6, 130], [-26, 130]], 0.8, 3.8, back ? 0.3 : 0.22); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: o.torso, base: o.coat, seed: sd, paint: o.torsoPaint },
      legB: { parent: 'torso', at: [-6, -2], pts: thighPts(th), base: o.thighB || o.thigh, seed: sd + 1, noRivet: true, paint: legPaint(true, false) },
      legB_lo: { parent: 'legB', at: [0, KNEE], pts: shinPts(), base: o.shinB || o.shin || o.thighB || o.thigh, seed: sd + 2, noRivet: true, paint: legPaint(true, true) },
      footB: { parent: 'legB_lo', at: [0, ANK], pts: FOOT[(o.foot === 'boucle' || o.foot === 'bicolore') ? 'soulier' : (o.foot || 'soulier')], base: o.shoeB || o.shoe, seed: sd + 3, noRivet: true, paint: footPaint(o.foot, o.shoe) },
      legF: { parent: 'torso', at: [6, -2], pts: thighPts(th), base: o.thigh, seed: sd + 4, paint: legPaint(false, false) },
      legF_lo: { parent: 'legF', at: [0, KNEE], pts: shinPts(), base: o.shin || o.thigh, seed: sd + 5, paint: legPaint(false, true) },
      footF: { parent: 'legF_lo', at: [0, ANK], pts: FOOT[(o.foot === 'boucle' || o.foot === 'bicolore') ? 'soulier' : (o.foot || 'soulier')], base: o.shoe, seed: sd + 6, noRivet: true, paint: footPaint(o.foot, o.shoe) },
      armB_up: { parent: 'torso', at: SH_B, pts: armR(LA, o.armW), base: o.sleeveB || o.sleeve, seed: sd + 7, paint: () => hatch(null, 0.8, 3.6, 0.3) },
      armB_lo: foreDef('armB_up', o.sleeveB || o.sleeve, o.handD || o.skinD, true, sd + 8, o),
      head: { parent: 'torso', at: [6, -170], pts: o.head || X.NAP_HEAD, base: o.skin, seed: sd + 9, noRivet: true, paint: o.headPaint },
      armF_up: { parent: 'torso', at: SH_F, pts: armR(LA, o.armW), base: o.sleeve, seed: sd + 10, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26) },
      armF_lo: foreDef('armF_up', o.sleeve, o.hand || o.skin, false, sd + 11, o),
    };
    Object.assign(parts, heldParts(o.hand || o.skin, sd + 20), o.parts || {});
    const order = ['objetPlat'].concat(o.dos || [], ['armB_up', 'armB_lo', 'objetB', 'legB', 'legB_lo', 'footB', 'legF', 'legF_lo', 'footF'].concat(o.backs || [], ['chargeDos', 'head'], o.heads || [], ['torso'], o.fronts || [],
      ['charge', 'armF_up', 'armF_lo', 'chargeAv', 'objet', 'doigts', 'doigtsB'], o.devant || []));
    return { hipY: HIPY, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, parts, order, nom: o.nom };
  }
  // visage commun
  function face(p, o) {
    const f = p.face || {};
    X.earPaint(o.ear ? o.ear[0] : -8, o.ear ? o.ear[1] : -44);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
    if (o.joue) dot(14, -32, 8, o.joue);
    X.eye(f, 17, -52, o.eyeSz || 1); X.brow(f, 17, o.browY || -60, o.browCol || 'rgba(45,30,22,0.95)', o.browW || 2.4); X.mouth(f, 27, -27, o.lip);
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
  function plier(q, th) {                                                      // plie le buste aux hanches (th > 0 = vers l'avant), jambes verticales
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    add(q, 'legF', -th); add(q, 'legB', -th);
  }
  // jambes à deux segments : amène la cheville sur A (repère des pieds), genou vers le haut / l'avant ; pied à plat
  function legTo(q, leg, Aw, k) {
    const H = toWorld(q, [leg === 'legF' ? 6 : -6, -2]), vx = Aw[0] - H[0], vy = Aw[1] - H[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(KNEE - ANK) + 1, KNEE + ANK - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((KNEE * KNEE + d * d - ANK * ANK) / (2 * KNEE * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) { const a = tv + sg * a1, E = [H[0] - KNEE * Math.sin(a), H[1] + KNEE * Math.cos(a)]; if (!best || E[1] < best.E[1]) best = { a, E }; }
    const sAbs = Math.atan2(-(Aw[0] - best.E[0]), Aw[1] - best.E[1]), tl = q.tilt || 0;
    blend(q, leg, normA(best.a - tl), k); blend(q, leg + '_lo', normA(sAbs - best.a), k); blend(q, leg === 'legF' ? 'footF' : 'footB', normA(-sAbs), k);
  }
  const has = (v) => v && v !== 'rien';

  // gestes communs à toutes les marionnettes (valeurs 0..1)
  function gestes(q) {
    const A = q.ang, t = q.t || 0;
    if (q.marche) {                                                             // pas sur place (le plan déplace x) ; q.t obligatoire
      const k = clamp(q.marche), ph = t * (q.cadence || 6), sw = Math.sin(ph) * 0.3 * k;
      add(q, 'legF', -sw); add(q, 'legB', sw);
      add(q, 'legF_lo', Math.max(0, Math.sin(ph + 1.9)) * 0.45 * k); add(q, 'legB_lo', Math.max(0, -Math.sin(ph + 1.9)) * 0.45 * k);
      add(q, 'footF', -(-sw + Math.max(0, Math.sin(ph + 1.9)) * 0.45 * k) * 0.8); add(q, 'footB', -(sw + Math.max(0, -Math.sin(ph + 1.9)) * 0.45 * k) * 0.8);
      if (!q._brasPris) { add(q, 'armF_up', sw * 0.45); add(q, 'armB_up', -sw * 0.45); add(q, 'armF_lo', -0.15 * k); add(q, 'armB_lo', -0.15 * k); }
      q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    }
    if (q.assis) {                                                              // assis sur un siège de hauteur q.siege (local, défaut 100 = le caillou à 1,1)
      const k = ease(clamp(q.assis)), h = q.siege == null ? 100 : q.siege;
      q.dy = (q.dy || 0) + (238 - h) * k; q.tilt = (q.tilt || 0) + 0.06 * k;
      const fw = q.pieds == null ? (h < 70 ? 150 : 84) : q.pieds;
      legTo(q, 'legF', [fw, -16], k); legTo(q, 'legB', [fw - 14, -16], k);
      if (q.mainsGenoux !== false && !has(q.tenu) && !q._brasPris) {
        const kn = toTorso(q, [fw + 20, -150]); armTo(q, 'armF', [kn[0] - 8, kn[1] + 6], 'bas', k); armTo(q, 'armB', [kn[0] - 20, kn[1] + 10], 'bas', k);
        if (k > 0.5) { q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
      }
    }
    if (q.attendre) {                                                           // attendre : poids sur une jambe, mains jointes DEVANT le ventre
      const k = ease(clamp(q.attendre));
      add(q, 'legB', 0.05 * k); add(q, 'legF', -0.1 * k); add(q, 'legF_lo', 0.14 * k); add(q, 'footF', -0.04 * k);
      q.tilt = (q.tilt || 0) - 0.015 * k; add(q, 'head', 0.04 * k);
      armTo(q, 'armF', [34, -52], 'bas', k); armTo(q, 'armB', [30, -46], 'bas', k);
      if (k > 0.5) { q.handF = q.handF || 'open'; q.handB = q.handB || 'fist'; }
    }
    if (q.croise) {                                                             // bras repliés devant la poitrine (se lit mal de profil : préférer attendre / hanche)
      const k = ease(clamp(q.croise));
      armTo(q, 'armF', [44, -96], 'bas', k); armTo(q, 'armB', [40, -104], 'bas', k);
    }
    if (q.pointes) {                                                            // sur la pointe des pieds pour être vu
      const k = ease(clamp(q.pointes)), a = 0.55 * k, lift = 46 * Math.sin(a) + 15 * Math.cos(a) - 15;
      add(q, 'footF', a); add(q, 'footB', a); q.dy = (q.dy || 0) - lift; add(q, 'head', -0.14 * k); q.tilt = (q.tilt || 0) + 0.015 * k;
    }
    if (q.leve) {                                                               // bras levé, main ouverte tendue paume vers le bas (« moi ! »)
      const k = ease(clamp(q.leve));
      blend(q, 'armF_up', -2.85, k); blend(q, 'armF_lo', -0.38, k); if (k > 0.3) q.handF = 'open';
    }
    if (q.tendre) {                                                             // tendre la main paume ouverte (demande)
      const k = ease(clamp(q.tendre));
      blend(q, 'armF_up', -1.25, k); blend(q, 'armF_lo', -0.32, k); add(q, 'head', 0.05 * k); if (k > 0.3) q.handF = 'cup';
    }
    if (q.epaules) {                                                            // haussement d'épaules : avant-bras ouverts, paumes en l'air
      const k = ease(clamp(q.epaules));
      blend(q, 'armF_up', 0.1, k); blend(q, 'armF_lo', -1.45, k); blend(q, 'armB_up', -0.05, k); blend(q, 'armB_lo', -1.3, k);
      add(q, 'head', 0.1 * k); q.dy = (q.dy || 0) - 4 * k;
      if (k > 0.3) { q.handF = 'cup'; q.handB = 'cup'; }
      if (!q.face.brow) q.face.brow = 'up';
    }
    if (q.hanche) {                                                             // poing avant sur la hanche, coude en arrière
      const k = ease(clamp(q.hanche)); armTo(q, 'armF', [10, -14], 'arriere', k); if (k > 0.5) q.handF = 'fist';
    }
    if (q.menton) {                                                             // main au menton (examiner, perplexe)
      const k = ease(clamp(q.menton)); armTo(q, 'armF', headPt(q, 24, -2), 'bas', k); add(q, 'head', -0.05 * k); if (k > 0.5) q.handF = 'fist';
    }
    if (q.essuie) {                                                             // s'essuyer le front (q.t anime le geste)
      const k = ease(clamp(q.essuie)); armTo(q, 'armF', headPt(q, 14 + 8 * Math.sin(t * 7), -86), 'bas', k); add(q, 'head', 0.08 * k); if (k > 0.5) q.handF = 'open';
    }
    if (q.soupir) { const k = ease(clamp(q.soupir)); add(q, 'head', 0.2 * k); q.dy = (q.dy || 0) + 3 * k; q.tilt = (q.tilt || 0) - 0.02 * k; if (k > 0.5 && !q.face.eyes) q.face.eyes = 'half'; if (!q.face.brow) q.face.brow = 'worry'; }
    if (q.surpris) { const k = ease(clamp(q.surpris)); add(q, 'head', -0.12 * k); q.tilt = (q.tilt || 0) - 0.04 * k; q.dy = (q.dy || 0) - 6 * k;
      blend(q, 'armF_up', -0.6, k); blend(q, 'armF_lo', -1.6, k); if (k > 0.3) q.handF = 'open';
      if (k > 0.3) { q.face.brow = q.face.brow || 'up'; q.face.eyes = q.face.eyes || 'wide'; q.face.mouth = q.face.mouth || 'o'; } }
    if (q.penche) { add(q, 'head', -0.16 * clamp(q.penche, -1, 1)); }            // tête qui penche (perplexe) : menton levé de côté
  }
  // poser au sol une charge (sac, outil) par étapes : k 0 → kSol (se pencher, déposer), kSol → 1 (lâcher, se relever)
  function deposer(q, nom, o, k, from, sol, kSol) {
    const ob = OBJ[nom], s1 = smooth(0, kSol, k), s2 = smooth(kSol + 0.02, 1, k);
    const bend = (q.penchePose == null ? 0.62 : q.penchePose) * Math.sin(Math.min(1, k / kSol) * PI / 2) * (1 - s2);
    plier(q, bend);
    const base = [lerp(from.base[0], sol.base[0], ease(s1)), lerp(from.base[1], sol.base[1], ease(s1))];
    if (from.via && s1 < 1) { const u = Math.sin(s1 * PI); base[0] += from.via[0] * u; base[1] += from.via[1] * u; }
    const ang = lerp(from.ang, sol.ang, ease(s1));
    q._charge = { nom, o: o || {}, w: base, ang, dos: !!from.dos && s1 < (from.swap || 0.3), libre: s2 };
  }
  // positions et grips → angles de bras ; objets droits ; seconde main
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (q._charge) {
      const ch = q._charge, ob = OBJ[ch.nom];
      if (ch.posT) { ch.pos = ch.posT; ch.angT = ch.ang; } else { ch.pos = toTorso(q, ch.w); ch.angT = ch.ang - tl; }
      const gp = (g) => { const r = rot([g[0] - ob.base[0], g[1] - ob.base[1]], ch.angT); return [ch.pos[0] + r[0], ch.pos[1] + r[1]]; };
      const k = 1 - ease(clamp(ch.libre || 0));
      const g1 = ch.g1 === null ? null : (ch.g1 || gripOf(ob, ch.o || {})), g2 = ch.g2 === null ? null : (ch.g2 || (ob.p2 ? ob.p2(ch.o || {}) : null));
      const a0 = [A.armF_up || 0, A.armF_lo || 0, A.armB_up || 0, A.armB_lo || 0];
      if (g1) { armTo(q, 'armF', gp(g1), 'bas', 1); A.armF_up = lerp(a0[0], A.armF_up, k); A.armF_lo = lerp(a0[1], A.armF_lo, k); }
      const kb = k * (ch.kB == null ? 1 : ch.kB);
      if (g2) { armTo(q, 'armB', gp(g2), 'bas', 1); A.armB_up = lerp(a0[2], A.armB_up, kb); A.armB_lo = lerp(a0[3], A.armB_lo, kb); }
      if (g2 && kb > 0.5) { q.handB = 'fist'; q._deux = true; }
      if (k > 0.5) { if (g1) q.handF = 'fist'; ch.tient = !!g1; } else ch.tient = false;
    }
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    A.objetPlat = A.objet || 0;
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)), 'bas');
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ nom: def.nom }, o || {}));
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // point nommé de l'objet tenu (écran) ; BF.pt(r, 'tete') ; arriere = main arrière
  BF.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };
  // enveloppe : pose → gestes communs → gestes propres → finish ; BF.nom.pose(p) = pose finale sans dessiner
  function mkWrap(chName, own, sDef) {
    const pose = (p, x, y, s, dir) => { const q = prep(p); q._loc = x == null ? null : { x, y, s: s == null ? sDef : s, dir: dir || 1 };
      if (own) own(q, 'avant'); gestes(q); if (own) own(q, 'apres'); return finish(q); };
    const f = (p, x, y, s, o) => run(CH[chName], pose(p, x, y, s == null ? sDef : s, (o && o.dir) || 1), x, y, s == null ? sDef : s, o);
    f.pose = pose; f.def = () => CH[chName];
    return f;
  }

  // =====================================================================
  // OBJETS — dessinés à l'échelle 1 dans leur repère ; à 0,9 (échelle des marionnettes) ils ont la taille de la fiche
  // =====================================================================
  const NOIR = '#16161a', NOIRL = '#2a2a30', IVOIRE = '#ece4cf', FICELLE = '#e2d6b4';
  // ---- la feuille noire : page d'éphéméride 134 × 166 (120 × 150 px à 0,9), origine = centre ; deux trous de reliure en haut
  function feuillePts(o) {
    const w = 67, h = 83, fr = clamp(o.froisse || 0), ar = clamp(o.arrache == null ? 0 : +o.arrache);
    const top = [];
    for (let i = 0; i <= 12; i++) { const x = -w + (2 * w) * i / 12; top.push([x, -h + (ar > 0 ? ar * (i % 2 ? -5 : 4) * (0.6 + hash(i * 7.1) * 0.8) : 0), ar > 0 ? 1 : 0]); }
    const pts = [[-w, h, 1], [-w, -h + 4]].concat(top.map((p, i) => (i === 0 || i === 12 ? [p[0], p[1], 1] : p)), [[w, -h + 4], [w, h, 1]]);
    if (fr <= 0) return pts;
    return pts.map(([x, y, k], i) => [x * (1 - 0.16 * fr) + (hash(i * 3.3) - 0.5) * 14 * fr, y * (1 - 0.12 * fr) + (hash(i * 5.9) - 0.5) * 14 * fr, 1]);
  }
  function drawFeuille(o) {
    const c = cx_(), fr = clamp(o.froisse || 0), pl = clamp(o.plie || 0), t = o.t || 0;
    c.save();
    if (o.vol) c.rotate(Math.sin(t * 2.3) * 0.16 * (+o.vol || 1));
    if (pl > 0) { c.translate(0, 83 * pl * 0.5); c.scale(1, 1 - 0.5 * pl); }
    pc(feuillePts(o), NOIR, () => {
      hatch(null, 0.7, 5, 0.10, 1, '255,255,255', [-80, -90, 80, 90]);
      fillPts([[-67, -83], [-30, -83], [-60, 40], [-67, 60]], 'rgba(255,255,255,0.04)');
      if (fr > 0) for (let i = 0; i < 5; i++) strokePts([[-60 + hash(i) * 40, -70 + i * 30], [10 + hash(i + 9) * 50, -50 + i * 28 + hash(i * 2) * 20]], `rgba(255,255,255,${0.12 * fr})`, 1.2);
      if (pl > 0) strokePts([[-67, 0], [67, 0]], `rgba(255,255,255,${0.25 * pl})`, 1.4);
      if (!(o.arrache > 0)) for (const hx of [-28, 28]) { dot(hx, -70, 6.5, '#8d8679'); dot(hx, -70, 4, '#cfc6b2'); }
      else for (const hx of [-28, 28]) { fillPts([[hx - 6, -83], [hx + 6, -83], [hx + 4, -78], [hx - 4, -78]], '#8d8679'); }
    }, 7601, { edge: '#f4efe2' });
    c.restore();
  }
  OBJ.feuille = { draw: drawFeuille, grip: [-60, 6], pts: { centre: [0, 0], haut: [0, -83], bas: [0, 83] }, base: [0, 0], plat: true };
  // ---- l'étiquette noire : rectangle à coin coupé 134 × 78 (120 × 70 px à 0,9), œillet blanc à gauche, ficelle ivoire ; origine = centre
  const ETI = [[-67, -22, 1], [-45, -39, 1], [67, -39, 1], [67, 39, 1], [-45, 39, 1], [-67, 22, 1]];
  function drawEtiquette(o) {
    const c = cx_(), t = o.t || 0, fl = o.ficelle == null ? 0 : o.ficelle;
    if (fl > 0 && !SIL()) {                                                       // ficelle (vers le haut-gauche) + petit nœud
      c.save(); c.strokeStyle = FICELLE; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-44, 0);
      c.bezierCurveTo(-60, -fl * 0.4, -50 + 10 * Math.sin(t * 2), -fl * 0.8, -44, -fl); c.stroke(); c.restore();
    }
    pc(ETI, NOIR, () => {
      hatch(null, 0.6, 5, 0.09, 1, '255,255,255', [-70, -40, 70, 40]);
      strokePts([[-30, -28], [58, -28]], 'rgba(255,255,255,0.10)', 1.2);
      dot(-44, 0, 9, '#f4efe2'); dot(-44, 0, 4.5, '#3a3a40');                      // œillet blanc (bague) et son trou
    }, 7611, { edge: '#f4efe2' });
    if (!SIL()) { c.save(); c.strokeStyle = FICELLE; c.lineWidth = 2; c.beginPath(); c.arc(-44, 0, 4.5, 0, TAU); c.stroke(); c.restore(); }
  }
  OBJ.etiquette = { draw: drawEtiquette, grip: [-58, 10], pts: { centre: [0, 0], oeillet: [-44, 0] }, base: [0, 0], plat: true };
  // ---- mouchoir blanc froissé (agent, essuie) ; origine = poing
  function drawMouchoir(o) {
    const t = o.t || 0, w = Math.sin(t * 9) * 3;
    pc([[-14, -10], [10, -18], [26, -8 + w], [34, 6 + w], [24, 22], [36, 34 + w], [12, 30], [-6, 36], [-16, 20], [-24, 8]], '#f1eee6', () => {
      strokePts([[-6, -4], [16, 10], [10, 26]], 'rgba(120,110,100,0.45)', 1); strokePts([[-14, 14], [4, 22]], 'rgba(120,110,100,0.35)', 1); hatch(null, 0.5, 4, 0.10);
    }, 7621);
  }
  OBJ.mouchoir = { draw: drawMouchoir, grip: [0, 4], pts: {}, base: [0, 30] };
  // ---- stylo (marchande, trace) : pointe en bas ; origine = milieu
  function drawStylo() { pc([[-5, -60, 1], [5, -60, 1], [5, 16, 1], [0, 32, 1], [-5, 16, 1]], '#2a3a5a', () => { fillPts([[-5, 16], [5, 16], [0, 32]], '#c9a44a'); fillPts(box(-5, -60, 5, -48), '#c9a44a'); strokePts([[-2, -46], [-2, 6]], 'rgba(255,255,255,0.3)', 1); }, 7631); }
  OBJ.stylo = { draw: drawStylo, grip: [0, -14], pts: { pointe: [0, 32] }, base: [0, 32] };
  // ---- registre (marchande, tient) : livre de comptes relié 150 × 116, dos bordeaux, coins cuivre ; origine = centre
  function drawRegistre() {
    pc(rrect(-75, -58, 75, 58, 5), '#5a2a2e', () => {
      fillPts(box(-75, -58, -52, 58), '#3e1c20'); for (const y of [-40, 0, 40]) strokePts([[-75, y], [-52, y]], '#c9a44a', 1.6);
      for (const [x, y] of [[75, -58], [75, 58]]) fillPts([[x, y], [x - 18, y], [x, y - Math.sign(y) * 18]], '#b07a44');
      fillPts(box(-20, -22, 44, 18), 'rgba(236,228,207,0.85)'); strokePts([[-14, -10], [38, -10]], 'rgba(90,70,50,0.35)', 1); strokePts([[-14, 4], [30, 4]], 'rgba(90,70,50,0.35)', 1);
      hatch(null, 0.8, 5, 0.14);
    }, 7641);
  }
  OBJ.registre = { draw: drawRegistre, grip: [-66, 12], pts: { centre: [0, 0] }, base: [0, 58], plat: true };
  // ---- paquets : boîtes ficelées 140 de large (126 px à 0,9) ; couleurs entières
  const PAQ_COL = { a: ['#9a3a2e', '#3e6a8a', '#d0a640'], b: ['#4f7a5a', '#e2d3aa', '#7a3f66'], c: ['#c9772e', '#55689a', '#8a8a3a'] };
  const PAQ_DIM = [[140, 54], [124, 46], [104, 40]];
  function boite(x0, y1, w, h, col, seed, noeud) {                               // boîte : (x0 = gauche, y1 = bas)
    const x1 = x0 + w, y0 = y1 - h, cxm = x0 + w * 0.56;
    pc(rrect(x0, y0, x1, y1, 3), col, () => {
      fillPts(box(x0, y0, x1, y0 + 8), 'rgba(255,255,255,0.14)'); fillPts(box(x0, y1 - 8, x1, y1), 'rgba(0,0,0,0.12)');
      fillPts(box(cxm - 3, y0, cxm + 3, y1), FICELLE); fillPts(box(x0, y0 + h * 0.5 - 3, x1, y0 + h * 0.5 + 3), FICELLE);
      hatch(null, 0.8, 5, 0.12);
    }, seed);
    if (noeud) { pc([[cxm, y0 + 1], [cxm - 16, y0 - 12], [cxm - 18, y0 - 2, 1]], FICELLE, null, seed + 1); pc([[cxm, y0 + 1], [cxm + 16, y0 - 12], [cxm + 18, y0 - 2, 1]], FICELLE, null, seed + 2); dot(cxm, y0, 4, '#c9bd98'); }
  }
  // pile de n boîtes (1..3), origine = milieu du bas de la pile ; o.cols ; hauteur totale ≈ 54 + 46 + 40 = 140
  function drawPile(o) {
    const n = clamp(Math.round(o.n == null ? 3 : o.n), 1, 3), cols = o.cols || PAQ_COL.a;
    let y = 0;
    for (let i = 0; i < n; i++) { const [w, h] = PAQ_DIM[i], dxs = [0, 6, -4][i]; boite(-w / 2 + dxs, y, w, h, cols[i % cols.length], 7650 + i * 5, i === n - 1); y -= h; }
  }
  OBJ.pile = { draw: drawPile, grip: [60, -6], p2: () => [-50, -6], pts: { haut: [0, -140] }, base: [0, 0] };
  // un paquet porté par sa ficelle (main au nœud) ; origine = bas
  function drawPaquet(o) {
    const cols = o.cols || PAQ_COL.a, col = cols[(o.i || 0) % cols.length];
    if (!SIL()) { const c = cx_(); c.save(); c.strokeStyle = FICELLE; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-10, -56); c.lineTo(0, -84); c.lineTo(10, -56); c.stroke(); c.restore(); }
    boite(-62, 0, 124, 56, col, 7670, false);
  }
  OBJ.paquet = { draw: drawPaquet, grip: [0, -86], pts: {}, base: [0, 0] };
  BF.PAQ_COL = PAQ_COL;

  // ---- accessoires seuls (sans tige ; ils volent) : même dessin que tenus
  BF.feuilleNoire = (x, y, s, o) => acc('feuille', x, y, s == null ? 0.9 : s, o);
  BF.etiquette = (x, y, s, o) => {                                               // o.balance (rad) : balancement autour de la ficelle ; o.ficelle (longueur locale)
    o = Object.assign({}, o || {}); const t = o.t || 0, b = o.balance || 0;
    if (b) o.rot = (o.rot || 0) + Math.sin(t * 1.7) * b;
    return acc('etiquette', x, y, s == null ? 0.9 : s, o);
  };
  BF.paquets = (x, y, s, o) => acc('pile', x, y, s == null ? 0.9 : s, o);
  BF.registre = (x, y, s, o) => acc('registre', x, y, s == null ? 0.9 : s, o);
  BF.mouchoir = (x, y, s, o) => acc('mouchoir', x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // GESTES PROPRES À LA VIDÉO (valeurs 0..1) — repère du torse : épaule avant [-2,-146], tête [6,-170] ; +x = devant
  // q.cible = point ÉCRAN (passer par BF.nom(p, x, y, s, o) ou BF.nom.pose(p, x, y, s, dir) pour qu'il soit converti)
  // =====================================================================
  function cib(q, def, key) {
    const Pt = q[key || 'cible'], L = q._loc;
    if (!Pt || !L) return def;
    const T = toTorso(q, [(Pt[0] - L.x) / (L.s * L.dir), (Pt[1] - L.y) / L.s]);
    const S = SH_F, dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy), mx = LA + LB - 4;
    return d > mx ? [S[0] + dx / d * mx, S[1] + dy / d * mx] : T;                // ramenée à portée du bras
  }
  BF.BANC_SIEGE = 150;                                                            // hauteur locale du siège pour le banc du décor (s 0,9, pieds à FEET)
  function gestesBF(q) {
    const t = q.t || 0;
    if (q.assis && q.siege == null) q.siege = BF.BANC_SIEGE;
    if (q.sautille) { const k = clamp(q.sautille); q.dy = (q.dy || 0) - Math.abs(Math.sin(t * (q.cadence || 6))) * 9 * k; }
    if (q.fuit) {                                                                  // pas pressés, penché en avant, yeux ronds
      const k = ease(clamp(q.fuit)); q.marche = Math.max(q.marche || 0, k); q.cadence = q.cadence || 9.5; q.tilt = (q.tilt || 0) + 0.07 * k;
      if (k > 0.3) { q.face.eyes = q.face.eyes || 'wide'; q.face.brow = q.face.brow || 'worry'; q.face.mouth = q.face.mouth || 'o'; }
    }
    if (q.queue) q.attendre = Math.max(q.attendre || 0, q.queue);
    if (q.stop) {                                                                  // bras levé à hauteur d'épaule, avant-bras dressé, paume ouverte vers l'avant
      const k = ease(clamp(q.stop)); blend(q, 'armF_up', -1.48, k); blend(q, 'armF_lo', -1.32, k); if (k > 0.3) { q.handF = 'open'; q.face.brow = q.face.brow || 'frown'; }
      q._brasPris = true;
    }
    if (q.circule) {                                                               // bras avant qui balaie en arc, main ouverte
      const k = ease(clamp(q.circule)), u = 0.5 + 0.5 * Math.sin(t * 4.6);
      blend(q, 'armF_up', -0.75 - 0.8 * u, k); blend(q, 'armF_lo', -0.2 - 0.1 * u, k); if (k > 0.3) q.handF = 'open'; q._brasPris = true;
    }
    if (q.siffle) {                                                                // sifflet à la bouche, tenu au poing, joues gonflées
      const k = ease(clamp(q.siffle)); add(q, 'head', -0.06 * k); armTo(q, 'armF', headPt(q, 70, -16), 'bas', k); if (k > 0.4) q.handF = 'fist'; q._brasPris = true;
    }
    if (q.epuise) {                                                                // épaules tombées, tête basse, bras ballants
      const k = ease(clamp(q.epuise)); add(q, 'head', 0.36 * k); q.dy = (q.dy || 0) + 6 * k; q.tilt = (q.tilt || 0) + 0.03 * k;
      blend(q, 'armF_up', 0.06, k); blend(q, 'armF_lo', -0.05, k); blend(q, 'armB_up', 0.02, k); blend(q, 'armB_lo', -0.05, k);
      if (k > 0.4) { q.face.eyes = q.face.eyes || 'half'; q.face.brow = q.face.brow || 'worry'; }
    }
    if (q.arrache) {                                                               // main avant qui saisit à hauteur de poitrine (cible écran : la page)
      const k = ease(clamp(q.arrache)); armTo(q, 'armF', cib(q, [104, -118]), 'bas', k); if (k > 0.4) q.handF = 'fist'; q._brasPris = true;
    }
    if (q.tient) {                                                                 // objet (plat) tenu main avant, tendu devant la poitrine ; cible écran = la main
      const k = ease(clamp(q.tient)); armTo(q, 'armF', cib(q, [92, -104]), 'bas', k); q._brasPris = true;
    }
    if (q.frotte) {                                                                // mains qui se frottent devant le ventre
      const k = ease(clamp(q.frotte)), w = Math.sin(t * 15) * 7;
      armTo(q, 'armF', [60 + w, -72], 'bas', k); armTo(q, 'armB', [54 - w, -66], 'bas', k); if (k > 0.4) { q.handF = 'open'; q.handB = 'open'; q.face.mouth = q.face.mouth || 'smile'; }
      add(q, 'head', -0.04 * k); q._brasPris = true;
    }
    if (q.fier) {                                                                  // bras en V, menton levé
      const k = ease(clamp(q.fier)); blend(q, 'armF_up', -2.78, k); blend(q, 'armF_lo', -0.3, k); blend(q, 'armB_up', -3.3, k); blend(q, 'armB_lo', -0.12, k);
      add(q, 'head', -0.2 * k); q.tilt = (q.tilt || 0) - 0.03 * k; if (k > 0.3) { q.handF = 'fist'; q.handB = 'fist'; q.face.mouth = q.face.mouth || 'smile'; } q._brasPris = true;
    }
    if (q.fige) {                                                                  // le sourire tombe, sourcils levés, buste un peu en arrière
      const k = ease(clamp(q.fige)); q.tilt = (q.tilt || 0) - 0.03 * k; add(q, 'head', -0.05 * k);
      if (k > 0.5) { q.face.brow = q.face.brow || 'up'; q.face.eyes = q.face.eyes || 'wide'; q.face.mouth = q.face.mouth || 'tight'; }
    }
    if (q.desespoir) {                                                             // mains ouvertes de part et d'autre de la tête, sans la toucher
      const k = ease(clamp(q.desespoir)), w = Math.sin(t * 8) * 4;
      armTo(q, 'armF', headPt(q, 56, -112 + w), 'bas', k); armTo(q, 'armB', headPt(q, -50, -96 - w), 'bas', k); add(q, 'head', 0.06 * k);
      if (k > 0.3) { q.handF = 'open'; q.handB = 'open'; q.face.brow = q.face.brow || 'worry'; q.face.mouth = q.face.mouth || 'o'; q.face.eyes = q.face.eyes || 'wide'; } q._brasPris = true;
    }
    if (q.deroule) {                                                               // tire un cordon vers le bas : main au-dessus de l'épaule ; tire 0 (haut) → 1 (épaule)
      const k = ease(clamp(q.deroule)), u = ease(clamp(q.tire || 0));
      armTo(q, 'armF', cib(q, [34, lerp(-322, -214, u)]), 'bas', k); add(q, 'head', -0.12 * k); if (k > 0.4) q.handF = 'fist'; q._brasPris = true;
    }
    if (q.epingle) {                                                               // main ouverte qui plaque un objet plat contre une surface devant lui
      const k = ease(clamp(q.epingle)); q.tilt = (q.tilt || 0) + 0.03 * k; armTo(q, 'armF', cib(q, [150, -150]), 'bas', k); if (k > 0.4) q.handF = 'open'; q._brasPris = true;
    }
    if (q.colle) {                                                                 // main tendue vers le haut et l'avant (poser l'étiquette sur la casquette)
      const k = ease(clamp(q.colle)); q.tilt = (q.tilt || 0) + 0.04 * k; add(q, 'head', -0.14 * k); armTo(q, 'armF', cib(q, [140, -270]), 'bas', k); if (k > 0.4 && !has(q.tenu)) q.handF = 'fist'; q._brasPris = true;
    }
    if (q.applaudit) {                                                             // mains qui claquent devant la poitrine
      const k = ease(clamp(q.applaudit)), u = Math.abs(Math.sin(t * 11)) * 14;
      armTo(q, 'armF', [80 + u, -108], 'bas', k); armTo(q, 'armB', [72 - u * 0.4, -104], 'bas', k); add(q, 'head', -0.08 * k);
      if (k > 0.4) { q.handF = 'open'; q.handB = 'open'; q.face.mouth = q.face.mouth || 'smile'; } q._brasPris = true;
    }
    if (q.ouvre) {                                                                 // pousse une porte : penché, main ouverte à plat devant la poitrine
      const k = ease(clamp(q.ouvre)); q.tilt = (q.tilt || 0) + 0.06 * k; add(q, 'legF', -0.16 * k); add(q, 'legB', 0.1 * k);
      armTo(q, 'armF', cib(q, [150, -128]), 'bas', k); if (k > 0.4) q.handF = 'open'; q._brasPris = true;
    }
    if (q.outree) {                                                                // main avant à plat sur la poitrine, tête en arrière
      const k = ease(clamp(q.outree)); armTo(q, 'armF', [38, -118], 'bas', k); add(q, 'head', -0.26 * k); q.tilt = (q.tilt || 0) - 0.05 * k;
      if (k > 0.4) { q.handF = 'open'; q.face.brow = q.face.brow || 'up'; q.face.mouth = q.face.mouth || 'o'; } q._brasPris = true;
    }
    if (q.montre) {                                                                // bras tendu, paume ouverte vers un objet (cible écran)
      const k = ease(clamp(q.montre)); armTo(q, 'armF', cib(q, [176, -112]), 'bas', k); if (k > 0.4) q.handF = 'cup'; q._brasPris = true;
    }
    if (q.devoile) {                                                               // tire un drap vers le côté : tire 0 (bras tendu) → 1 (main ramenée près du corps)
      const k = ease(clamp(q.devoile)), u = ease(clamp(q.tire || 0));
      armTo(q, 'armF', cib(q, [lerp(176, 40, u), lerp(-118, -84, u)]), 'bas', k); q.tilt = (q.tilt || 0) - 0.05 * k * u; if (k > 0.4) q.handF = 'fist'; q._brasPris = true;
    }
    if (q.trace) {                                                                 // stylo tenu main avant : sa pointe suit q.cible (écran)
      const k = ease(clamp(q.trace)); q.tenu = q.tenu || 'stylo';
      const T = cib(q, [130, -110]); armTo(q, 'armF', [T[0], T[1] - 46], 'bas', k); add(q, 'head', 0.08 * k); q._brasPris = true;
    }
  }

  // =====================================================================
  // L'AGENT KOWALSKI (variante 'a') et LE SECOND AGENT (variante 'b')
  // =====================================================================
  const AG = { uni: '#1f2a44', uniD: '#18213a', uniL: '#2c3a5c', bouton: '#c9a24a', cuir: '#6b4a2e', cuirD: '#553a24', gant: '#efece4', gantD: '#d8d3c6',
    peau: '#e3b897', peauD: '#c69a7c', moust: '#5a3a22', cheveux: '#4a3424', gris: '#a9a49a', visiere: '#141416', plaque: '#c9a44a', plaqueD: '#9c7a2e', argent: '#c8ccd2', chaussure: '#1d1a18' };
  // tête de l'agent a : nez rond, double menton léger ; agent b : nez long, visage maigre
  const HEAD_A = [[-14, 16], [12, 16], [14, 4], [20, -4], [27, -8], [31, -14], [29, -20], [31, -24], [30, -28], [34, -30], [41, -34], [43, -40], [40, -46], [33, -48], [30, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const HEAD_B = [[-12, 16], [9, 16], [10, 2], [14, -8], [21, -12], [24, -18], [22, -23], [25, -27], [24, -31], [28, -34], [46, -40, 1], [32, -48], [28, -58], [28, -66], [24, -79], [12, -91], [-8, -96], [-25, -87], [-32, -68], [-31, -46], [-25, -28], [-18, -8]];
  // casquette à visière, calotte haute évasée vers l'avant ; b : un peu de travers (penchée en arrière)
  const rotPts = (pts, a, cxp, cyp) => pts.map(([x, y, k]) => { const r = rot([x - cxp, y - cyp], a); return [r[0] + cxp, r[1] + cyp, k]; });
  const CAP = [[-34, -72], [-36, -86], [-46, -104], [-44, -116], [-20, -124], [16, -126], [40, -120], [46, -112], [32, -96], [28, -84], [30, -76]];
  const VISIERE = [[22, -80], [34, -82], [52, -76], [58, -70, 1], [44, -68], [24, -70]];
  function capParts(seed, tiltCap) {
    const T = (p) => (tiltCap ? rotPts(p, tiltCap, -6, -80) : p);
    return {
      visiere: { parent: 'head', at: [0, 0], noRivet: true, base: AG.visiere, seed: seed, pts: T(VISIERE), paint: () => strokePts(T([[26, -78], [50, -74]]), 'rgba(255,255,255,0.35)', 1.4) },
      casquette: { parent: 'head', at: [0, 0], noRivet: true, base: AG.uni, seed: seed + 1, pts: T(CAP), paint: (p) => {
        fillPts(T([[-36, -86], [30, -88], [30, -76], [-34, -72]]), '#111522');                  // bandeau noir
        strokePts(T([[-36, -88], [31, -90]]), AG.bouton, 1.2);
        fillPts(T([[-44, -112], [-20, -122], [16, -124], [40, -118], [44, -112], [10, -114], [-30, -110]]), AG.uniL);   // dessus de la calotte
        // plaque de casquette : petit écusson doré lisse, sans motif
        pc(T([[18, -110], [30, -112], [32, -100], [25, -92], [17, -99]]), AG.plaque, () => fillPts(T([[21, -107], [28, -108], [29, -101], [25, -96], [20, -100]]), AG.plaqueD), seed + 2, { drop: false });
        hatch(T([[-46, -118], [-10, -124], [-10, -74], [-36, -72]]), 0.5, 3.4, 0.26, 1, '200,210,230');
      }, extra: (p) => {                                                           // étiquette noire collée sur la calotte (plan 6)
        const k = clamp(p.etiquette || 0); if (k <= 0) return;
        const c = cx_(), sp = M.spring(k * 0.9, 0.5, 14), a = -0.18 + (tiltCap || 0);
        c.save(); const cp = T([[-6, -108]])[0]; c.translate(cp[0], cp[1]); c.rotate(a); c.scale(0.42 * sp, 0.42 * sp); drawEtiquette({ t: p.t || 0 }); c.restore();
      } },
    };
  }
  function agentDef(b) {
    const sd = b ? 9100 : 9000;
    const torsoPaint = () => {
      fillPts([[4, -184], [18, -170], [20, -150], [6, -160]], AG.uniD);                                 // col montant
      fillPts([[16, -170], [30, -150], [34, -112], [20, -118], [12, -150]], AG.uniD);                   // revers
      for (const y of [-124, -92, -60, -28]) { dot(14, y, 3.2, AG.bouton); dot(30, y + 2, 3.2, AG.bouton); dot(13, y - 1, 1, 'rgba(255,255,255,0.7)'); dot(29, y + 1, 1, 'rgba(255,255,255,0.7)'); }
      // baudrier en diagonale + ceinturon brun et boucle
      fillPts([[-30, -156], [-18, -160], [36, -14], [24, -8]], AG.cuir); strokePts([[-26, -156], [30, -12]], 'rgba(255,230,190,0.25)', 1);
      fillPts(box(-42, -6, 42, 12), AG.cuir); fillPts(box(22, -8, 36, 14), AG.bouton); fillPts(box(25, -4, 33, 10), AG.cuirD);
      // plaque de poitrine : écusson doré lisse (aucun motif lisible)
      pc([[-4, -130], [10, -136], [24, -130], [24, -116], [10, -104], [-4, -116]], AG.plaque, () => { fillPts([[0, -127], [10, -131], [20, -127], [20, -117], [10, -108], [0, -117]], AG.plaqueD); dot(10, -120, 3, AG.plaque); }, sd + 40, { drop: false });
      // cordon du sifflet (de l'épaulette à la poche de poitrine)
      strokePts([[-20, -150], [-6, -136], [8, -100], [22, -96]], AG.argent, 1.4);
      fillPts([[-34, -150], [-10, -158], [-6, -150], [-30, -144]], AG.uniL);                             // épaulette
      hatch([[-50, -170], [-12, -170], [-10, 52], [-50, 52]], 0.75, 4.2, 0.32, 1.05, '200,210,230'); shade(40, 0, -40, 0, 0.32);
    };
    const headPaint = (p) => {
      const f = p.face || {}, sf = clamp(p.siffle || 0);
      if (b) {                                                                     // agent b : rasé, longs favoris gris, cheveux gris courts
        fillPts([[-30, -78], [-8, -80], [-10, -60], [-16, -48], [-32, -50]], AG.gris);
        fillPts([[-6, -78], [4, -76], [6, -54], [4, -30], [-4, -24], [-8, -40], [-10, -66]], AG.gris);
        strokePts([[-2, -70], [0, -36]], 'rgba(255,255,255,0.3)', 1);
      } else {
        fillPts([[-30, -78], [-8, -80], [-12, -60], [-18, -50], [-32, -50]], AG.cheveux);
      }
      face(p, { joue: b ? null : `rgba(200,70,60,${0.3 + 0.15 * sf})`, browCol: b ? 'rgba(120,115,105,0.95)' : 'rgba(70,45,28,0.95)', browW: b ? 2.2 : 3 });
      if (sf > 0.5) dot(18, -28, 10 * sf, b ? 'rgba(220,150,140,0.35)' : 'rgba(210,90,80,0.45)');       // joue gonflée
      if (b) { strokePts([[12, -40], [18, -34]], 'rgba(120,80,60,0.4)', 1); strokePts([[4, -28], [8, -18]], 'rgba(120,80,60,0.35)', 1); }
    };
    const parts = Object.assign(capParts(sd + 30, b ? -0.13 : 0), {
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: AG.moust, seed: sd + 35, pts: (p) => (b ? OFFP : [[18, -34], [32, -36], [42, -32], [42, -24, 1], [34, -26], [24, -24], [16, -26, 1]]),
        paint: () => { for (let x = 20; x < 42; x += 4) strokePts([[x, -34], [x - 1, -26]], 'rgba(30,18,10,0.5)', 1); } },
      sifflet: { parent: 'head', at: [0, 0], noRivet: true, base: AG.argent, seed: sd + 36, pts: (p) => ((p.siffle || 0) > 0.5 ? [[34, -32], [58, -30], [62, -26], [58, -20], [36, -22]] : OFFP),
        paint: () => { dot(52, -26, 3, '#7a7e86'); strokePts([[36, -30], [56, -28]], 'rgba(255,255,255,0.6)', 1.2); } },
      siffletP: { parent: 'torso', at: [0, 0], noRivet: true, base: AG.argent, seed: sd + 37, pts: (p) => ((p.siffle || 0) > 0.5 ? OFFP : [[18, -104], [34, -102], [36, -94], [30, -90], [18, -92]]),
        paint: () => dot(30, -96, 2.5, '#7a7e86') },
    });
    const d = body({
      nom: b ? 'agent b' : 'agent', seed: sd, torso: torsoPts(b ? 0.88 : 1.06, 54, b ? 0 : 8), coat: AG.uni, sleeve: AG.uni, sleeveB: AG.uniD, skin: AG.peau, skinD: AG.peauD,
      hand: AG.gant, handD: AG.gantD, cuff: AG.gant, thigh: AG.uni, thighB: AG.uniD, shoe: AG.chaussure, head: b ? HEAD_B : HEAD_A, armW: b ? 14 : 15.5,
      thighPaint: (back) => { if (!back) strokePts([[16, -10], [14, 100]], 'rgba(0,0,0,0.35)', 2); },
      torsoPaint, headPaint, parts, heads: ['moustache', 'sifflet', 'visiere', 'casquette'], fronts: ['siffletP'],
    });
    return d;
  }
  CH.bfAgent = agentDef(false);
  CH.bfAgentB = agentDef(true);
  const agentOwn = (q, ph) => {
    if (ph === 'avant') gestesBF(q);
    if (ph === 'apres' && q.essuie && q.essuie > 0.3 && !has(q.tenu)) { q.tenu = 'mouchoir'; q.handF = 'fist'; }
  };
  const wAgentA = mkWrap('bfAgent', agentOwn, 0.9), wAgentB = mkWrap('bfAgentB', agentOwn, 0.96);
  BF.agent = (p, x, y, s, o) => ((p && p.variante === 'b') ? wAgentB : wAgentA)(p, x, y, s, o);
  BF.agent.pose = (p, x, y, s, dir) => ((p && p.variante === 'b') ? wAgentB : wAgentA).pose(p, x, y, s, dir);
  BF.agent.def = (p) => CH[(p && p.variante === 'b') ? 'bfAgentB' : 'bfAgent'];

  // =====================================================================
  // M. FAIRBANKS, LE MARCHAND — costume croisé gris perle, gilet, œillet rouge, cravate vert éteint, cheveux noirs gominés, lunettes rondes dorées
  // =====================================================================
  const MA = { costume: '#b7b1a4', costumeD: '#9e988b', gilet: '#7f7a6e', chemise: '#f3f0e8', cravate: '#56664a', oeillet: '#b3262a', peau: '#e6c09e', peauD: '#c9a07e',
    cheveux: '#151317', lunettes: '#c9a24a', soulierB: '#ece6d8' };
  CH.bfMarchand = body({
    nom: 'marchand', seed: 9200, torso: torsoPts(1.1, 60, 30), coat: MA.costume, sleeve: MA.costume, sleeveB: MA.costumeD, skin: MA.peau, skinD: MA.peauD, cuff: MA.chemise,
    thigh: MA.costume, thighB: MA.costumeD, shoe: MA.soulierB, foot: 'bicolore', head: X.GR_HEAD, armW: 16,
    torsoPaint: () => {
      fillPts([[2, -184], [22, -170], [30, -140], [22, -112], [10, -150]], MA.chemise);                   // plastron
      fillPts([[8, -172], [16, -170], [24, -118], [16, -110], [10, -140]], MA.cravate);                    // cravate
      fillPts([[14, -150], [32, -134], [34, -100], [20, -104]], MA.gilet);                                 // gilet
      fillPts([[20, -168], [36, -146], [42, -100], [28, -92], [22, -120], [16, -150]], MA.costumeD);       // revers croisé
      for (const [x, y] of [[26, -60], [42, -58], [28, -24], [46, -22]]) { dot(x, y, 3.4, '#5e584e'); dot(x - 1, y - 1, 1, 'rgba(255,255,255,0.5)'); }
      strokePts([[30, -100], [50, -40], [48, 20], [44, 60]], 'rgba(60,55,45,0.5)', 1.3);                 // bord du croisé
      strokePts([[-20, 12], [12, 14]], 'rgba(60,55,45,0.45)', 1.2);                                         // poche
      // œillet rouge à la boutonnière
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; dot(30 + Math.cos(a) * 5, -138 + Math.sin(a) * 5, 4.2, MA.oeillet); }
      dot(30, -138, 3, '#7e1418'); strokePts([[28, -132], [24, -122]], '#4e6a3a', 1.6);
      hatch([[-50, -170], [-12, -170], [-10, 60], [-50, 60]], 0.75, 4.2, 0.28); shade(46, -20, -40, 0, 0.3);
    },
    headPaint: (p) => {
      face(p, { joue: 'rgba(210,120,100,0.22)', browCol: 'rgba(20,18,20,0.95)' });
      fillPts([[18, -32], [26, -34], [36, -32], [36, -29], [26, -30], [18, -29]], MA.cheveux);              // fine moustache
      fillPts([[0, -12], [20, -8], [22, 6], [2, 8]], 'rgba(200,140,110,0.18)');                               // bajoue
      if (!SIL()) {                                                                  // lunettes rondes dorées
        const ring = ell(19, -52, 10.5, 10.5, 16);
        fillPts(ring, 'rgba(200,230,240,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), MA.lunettes, 2);
        strokePts([[9, -53], [-24, -56]], MA.lunettes, 1.5); strokePts([[14, -58], [20, -60]], 'rgba(255,255,255,0.7)', 1.2);
      }
    },
    parts: { cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: MA.cheveux, seed: 9230, pts: [[26, -76], [22, -88], [8, -98], [-10, -100], [-28, -92], [-36, -72], [-34, -50], [-26, -48], [-22, -62], [-12, -78], [6, -84], [20, -82]],
      paint: () => { strokePts([[18, -86], [-2, -92], [-24, -84]], 'rgba(255,255,255,0.35)', 1.6); strokePts([[-6, -95], [10, -86]], 'rgba(200,200,220,0.5)', 1.2); strokePts([[-20, -88], [-30, -70]], 'rgba(255,255,255,0.18)', 1.2); } } },
    heads: ['cheveux'],
  });
  BF.marchand = mkWrap('bfMarchand', (q, ph) => { if (ph === 'avant') gestesBF(q); }, 0.9);

  // =====================================================================
  // MME FAIRBANKS, LA MARCHANDE — tailleur vert bouteille cintré, chapeau-tambourin bordeaux à voilette, gants ivoire, perles, cheveux roux en rouleaux
  // =====================================================================
  const MM = { tailleur: '#3f5a3e', tailleurD: '#334a32', chapeau: '#6e2232', chapeauD: '#541824', gant: '#ece4cf', gantD: '#d6ccb2', perle: '#f3eee2', cheveux: '#a9532c', cheveuxD: '#86401f',
    peau: '#efcdb0', peauD: '#d2ad8e', bas: '#d8b8a0', basD: '#c4a48c', escarpin: '#5a1f28' };
  const MM_TORSO = [[-12, -176], [8, -180], [16, -168], [24, -150], [32, -124], [32, -100], [24, -66], [26, -40], [40, -14], [44, 6, 1], [34, 10], [32, 60], [30, 128, 1], [-30, 130, 1], [-32, 60], [-34, 10], [-44, 8, 1], [-40, -14], [-30, -40], [-30, -66], [-34, -104], [-33, -150], [-24, -168]];
  CH.bfMarchande = body({
    nom: 'marchande', seed: 9300, torso: MM_TORSO, coat: MM.tailleur, sleeve: MM.tailleur, sleeveB: MM.tailleurD, skin: MM.peau, skinD: MM.peauD, hand: MM.gant, handD: MM.gantD, cuff: MM.gant,
    thigh: MM.bas, thighB: MM.basD, shin: MM.bas, shinB: MM.basD, shoe: MM.escarpin, foot: 'escarpin', head: X.GR_HEAD, th: 0.8, armW: 13,
    torsoPaint: () => {
      fillPts([[4, -182], [14, -172], [12, -160], [2, -168]], MM.peau);
      for (let i = 0; i < 7; i++) dot(2 + i * 2.4, -176 + i * 2.2, 2.4, MM.perle);                      // collier de perles
      fillPts([[14, -170], [26, -148], [24, -128], [14, -140]], MM.tailleurD);                          // revers
      for (const y of [-110, -84, -58]) { dot(26, y, 2.8, '#c9a44a'); }
      fillPts([[-40, -14], [40, -14], [44, 6], [34, 10], [-34, 10], [-44, 8]], MM.tailleurD);          // basque
      strokePts([[-36, 10], [34, 10]], 'rgba(10,20,10,0.5)', 1.3); strokePts([[0, 14], [2, 128]], 'rgba(10,20,10,0.35)', 1.2);
      hatch([[-50, -170], [-14, -170], [-12, 130], [-50, 130]], 0.75, 4.2, 0.28, 1.05, '210,225,205'); shade(40, -40, -40, 0, 0.28);
    },
    headPaint: (p) => {
      face(p, { joue: 'rgba(215,110,100,0.22)', browCol: 'rgba(110,50,25,0.95)', browW: 2, lip: '#8e2f2a', eyeSz: 1.05 });
      strokePts([[22, -55], [26, -60]], 'rgba(30,20,20,0.8)', 1.2);                                   // cils
    },
    parts: {
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: MM.cheveux, seed: 9330, pts: [[22, -82], [24, -94], [10, -104], [-12, -106], [-30, -98], [-42, -80], [-46, -58], [-40, -36], [-26, -28], [-18, -44], [-22, -62], [-12, -78], [8, -84]],
        paint: () => { for (const [x, y, r] of [[-34, -50, 15], [-32, -80, 13], [-8, -94, 12]]) { strokePts(ep(x, y, r, r, 12, 0, TAU), 'rgba(80,30,10,0.55)', 1.3); strokePts(ep(x, y, r * 0.5, r * 0.5, 8, 0, TAU), 'rgba(255,200,160,0.3)', 1.1); } } },
      chapeau: { parent: 'head', at: [0, 0], noRivet: true, base: MM.chapeau, seed: 9331, pts: [[-14, -100], [-12, -122], [4, -128], [24, -124], [30, -104], [18, -98]],
        paint: () => { fillPts([[-12, -122], [4, -128], [24, -124], [8, -118]], MM.chapeauD); strokePts([[-14, -104], [30, -106]], 'rgba(255,220,220,0.2)', 1.4); hatch(null, 0.4, 3.2, 0.2); },
        extra: (p) => {                                                             // voilette : résille fine qui tombe du bord du chapeau sur les yeux
          if (SIL()) return; const c = cx_();
          const V = [[-8, -102], [30, -106], [40, -60], [34, -42], [10, -46]];
          c.save(); M.path(V, 0, 0, true); c.fillStyle = 'rgba(40,12,20,0.16)'; c.fill(); c.clip();
          c.strokeStyle = 'rgba(40,12,20,0.5)'; c.lineWidth = 0.8;
          for (let k = -60; k < 80; k += 6) { c.beginPath(); c.moveTo(-20 + k, -110); c.lineTo(20 + k, -36); c.stroke(); c.beginPath(); c.moveTo(60 - k, -110); c.lineTo(20 - k, -36); c.stroke(); }
          c.restore();
        } },
    },
    heads: ['cheveux', 'chapeau'],
  });
  BF.marchande = mkWrap('bfMarchande', (q, ph) => { if (ph === 'avant') gestesBF(q); }, 0.9);

  // =====================================================================
  // CLIENTS DE 1955 — a : feutre brun, pardessus moutarde ; b : manteau prune à col de fourrure, toque ; c : blouson rouge sang, casquette plate, écharpe à rayures
  // =====================================================================
  const CL = {
    a: { coat: '#a8741f', coatD: '#8c5f18', pant: '#4c4a4a', pantD: '#3e3c3c', peau: '#ddb592', peauD: '#c09676', shoe: '#3a2a20', feutre: '#5a3e28', ruban: '#2e2016' },
    b: { coat: '#5e2f4a', coatD: '#4c243c', fur: '#8a6a4c', furD: '#6e523a', bas: '#cfae96', basD: '#bb9a82', peau: '#edc9ab', peauD: '#d1a98a', gant: '#2a2226', shoe: '#2a1e20', cheveux: '#3a2a20' },
    c: { coat: '#8e2f2a', coatD: '#74241f', pant: '#4a5468', pantD: '#3c4456', peau: '#e2bb98', peauD: '#c69c7a', shoe: '#2e2420', cap: '#6b6253', capD: '#544c40', ech1: '#e0d6bc', ech2: '#3f6a5a', cheveux: '#6a4a2a' },
  };
  CH.bfClientA = body({
    nom: 'client a', seed: 9400, torso: torsoPts(1.04, 112, 4), coat: CL.a.coat, sleeve: CL.a.coat, sleeveB: CL.a.coatD, skin: CL.a.peau, skinD: CL.a.peauD, cuff: CL.a.coatD,
    thigh: CL.a.pant, thighB: CL.a.pantD, shoe: CL.a.shoe, head: X.NAP_HEAD,
    torsoPaint: () => {
      fillPts([[4, -184], [16, -172], [12, -156], [2, -166]], '#efeadd'); fillPts([[8, -170], [14, -170], [16, -150], [10, -150]], '#5a3a3a');
      fillPts([[14, -172], [30, -150], [36, -116], [22, -112], [12, -150]], CL.a.coatD);                    // grand col
      for (const y of [-90, -50, -10, 30]) dot(30, y, 3.2, '#4a3a24');
      strokePts([[30, -110], [36, 112]], 'rgba(60,40,10,0.5)', 1.3); strokePts([[-6, 20], [24, 20]], 'rgba(60,40,10,0.5)', 1.2);
      hatch([[-50, -170], [-12, -170], [-10, 112], [-50, 112]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.3);
    },
    headPaint: (p) => { fillPts([[-30, -76], [-10, -78], [-14, -58], [-22, -46], [-32, -52]], '#6a5040'); face(p, { joue: 'rgba(200,110,90,0.2)' }); strokePts([[6, -70], [-2, -66]], 'rgba(60,40,30,0.3)', 1); },
    parts: { feutre: { parent: 'head', at: [0, 0], noRivet: true, base: CL.a.feutre, seed: 9430,
      pts: [[-50, -76], [-44, -82], [-30, -84], [-30, -104], [-20, -116], [-2, -112], [8, -118], [22, -110], [26, -88], [44, -86], [58, -78, 1], [44, -76], [10, -80], [-30, -78]],
      paint: () => { fillPts([[-31, -92], [26, -96], [26, -86], [-30, -84]], CL.a.ruban); strokePts([[-2, -112], [2, -96]], 'rgba(20,10,5,0.5)', 1.4); strokePts([[-46, -80], [52, -80]], 'rgba(255,230,200,0.18)', 1.4); hatch(null, 0.5, 3.4, 0.28); } },
      cacheCol: { parent: 'torso', at: [0, 0], noRivet: true, base: '#4a3020', seed: 9431, pts: [[-24, -178], [4, -186], [22, -176], [24, -160], [6, -156], [-20, -160]],
        paint: () => { for (let x = -20; x < 24; x += 6) strokePts([[x, -182], [x + 2, -158]], 'rgba(255,220,180,0.18)', 1); } } },
    heads: ['feutre'], fronts: ['cacheCol'],
  });
  CH.bfClientB = body({
    nom: 'client b', seed: 9500, torso: torsoPts(0.94, 116, 0), coat: CL.b.coat, sleeve: CL.b.coat, sleeveB: CL.b.coatD, skin: CL.b.peau, skinD: CL.b.peauD, hand: CL.b.gant, handD: CL.b.gant, cuff: CL.b.fur,
    thigh: CL.b.bas, thighB: CL.b.basD, shin: CL.b.bas, shinB: CL.b.basD, shoe: CL.b.shoe, foot: 'escarpin', head: X.GR_HEAD, th: 0.82, armW: 13.5,
    torsoPaint: () => {
      for (const y of [-100, -60, -20]) dot(28, y, 3.6, '#2a1420');
      strokePts([[-36, 40], [36, 40]], 'rgba(20,5,15,0.4)', 1.2); strokePts([[24, -110], [30, 116]], 'rgba(20,5,15,0.45)', 1.2);
      hatch([[-50, -170], [-12, -170], [-10, 116], [-50, 116]], 0.75, 4.2, 0.3, 1.05, '230,210,225'); shade(40, 0, -40, 0, 0.3);
    },
    headPaint: (p) => { face(p, { joue: 'rgba(215,110,110,0.24)', browCol: 'rgba(50,30,20,0.95)', browW: 2, lip: '#8a3a4a' }); strokePts([[22, -55], [26, -60]], 'rgba(30,20,20,0.8)', 1.2); },
    parts: {
      cheveuxB: { parent: 'head', at: [0, 0], noRivet: true, base: CL.b.cheveux, seed: 9529, pts: [[-6, -84], [-30, -82], [-40, -64], [-38, -40], [-24, -36], [-20, -54], [-12, -70]] },
      toque: { parent: 'head', at: [0, 0], noRivet: true, base: CL.b.fur, seed: 9530, pts: [[-34, -78], [-38, -96], [-32, -116], [-10, -124], [14, -122], [28, -110], [28, -86], [18, -80]],
        paint: () => { for (let i = 0; i < 40; i++) strokePts([[-36 + hash(i) * 64, -120 + hash(i * 3) * 40], [-34 + hash(i) * 64, -114 + hash(i * 3) * 40]], 'rgba(60,40,25,0.5)', 1.2); hatch(null, 1.2, 3, 0.25); } },
      col: { parent: 'torso', at: [0, 0], noRivet: true, base: CL.b.fur, seed: 9531, pts: [[-30, -168], [-14, -182], [8, -184], [24, -174], [36, -150], [34, -128], [18, -136], [0, -150], [-24, -146], [-36, -154]],
        paint: () => { for (let i = 0; i < 46; i++) strokePts([[-34 + hash(i * 1.3) * 70, -182 + hash(i * 2.9) * 54], [-31 + hash(i * 1.3) * 70, -176 + hash(i * 2.9) * 54]], 'rgba(60,40,25,0.5)', 1.2); } },
    },
    heads: ['cheveuxB', 'toque'], fronts: ['col'],
  });
  CH.bfClientC = body({
    nom: 'client c', seed: 9600, torso: torsoPts(0.98, 16, 0), coat: CL.c.coat, sleeve: CL.c.coat, sleeveB: CL.c.coatD, skin: CL.c.peau, skinD: CL.c.peauD, cuff: CL.c.coatD,
    thigh: CL.c.pant, thighB: CL.c.pantD, shoe: CL.c.shoe, head: X.GR_HEAD,
    torsoPaint: () => {
      fillPts(box(-40, 2, 40, 18), CL.c.coatD); for (let x = -36; x < 38; x += 6) strokePts([[x, 4], [x, 16]], 'rgba(30,5,5,0.35)', 1);   // bord-côte
      strokePts([[28, -150], [32, 4]], '#c9c2b0', 1.6);                                                    // fermeture
      fillPts([[-4, -60], [20, -60], [20, -40], [-4, -40]], CL.c.coatD);
      hatch([[-50, -170], [-12, -170], [-10, 18], [-50, 18]], 0.75, 4.2, 0.32); shade(40, 0, -40, 0, 0.3);
    },
    headPaint: (p) => { fillPts([[-30, -76], [-8, -80], [-12, -58], [-20, -48], [-32, -52]], CL.c.cheveux); face(p, { joue: 'rgba(215,110,90,0.26)' }); },
    parts: {
      casquette: { parent: 'head', at: [0, 0], noRivet: true, base: CL.c.cap, seed: 9630, pts: [[-36, -74], [-38, -90], [-22, -104], [6, -106], [26, -98], [44, -88], [50, -82, 1], [28, -80], [-10, -78]],
        paint: () => { for (let i = 0; i < 8; i++) strokePts([[-36 + i * 10, -100], [-30 + i * 10, -76]], 'rgba(40,34,26,0.3)', 1); fillPts([[26, -90], [50, -82], [28, -80]], CL.c.capD); dot(-4, -104, 3, CL.c.capD); hatch(null, 0.5, 3.2, 0.25); } },
      echarpe: { parent: 'torso', at: [0, 0], noRivet: true, base: CL.c.ech1, seed: 9631, pts: [[-22, -176], [4, -186], [22, -176], [26, -160], [30, -150], [34, -96, 1], [20, -96, 1], [16, -150], [-6, -160], [-26, -160]],
        paint: () => { for (let y = -184; y < -96; y += 12) fillPts(box(-30, y, 40, y + 6), CL.c.ech2); for (const x of [22, 26, 30]) strokePts([[x, -96], [x, -86]], CL.c.ech1, 1.5); } },
    },
    heads: ['casquette'], fronts: ['echarpe'],
  });
  const clientOwn = (q, ph) => {
    if (ph === 'avant') {
      gestesBF(q);
      if (q.porte) {                                                               // pile de paquets à deux mains devant la poitrine, le haut sous le menton
        const k = ease(clamp(q.porte)), n = q.paquets == null ? 3 : q.paquets;
        const hTot = [54, 100, 140][clamp(Math.round(n), 1, 3) - 1];
        q._charge = { nom: 'pile', o: { n, cols: PAQ_COL[q._var] }, posT: [lerp(40, 92, k), lerp(-40, -156 + hTot, k)], ang: 0, libre: 1 - k, dessus: true };
        q._brasPris = true;
      }
    }
    if (ph === 'apres' && has(q.tenu) && q.tenu === 'paquet') q.tenuO = Object.assign({ cols: PAQ_COL[q._var] }, q.tenuO || {});
  };
  const wCl = { a: mkWrap('bfClientA', clientOwn, 0.9), b: mkWrap('bfClientB', clientOwn, 0.88), c: mkWrap('bfClientC', clientOwn, 0.86) };
  const varOf = (p) => (p && wCl[p.variante] ? p.variante : 'a');
  BF.client = (p, x, y, s, o) => { const v = varOf(p); return wCl[v](Object.assign({ _var: v }, p), x, y, s, o); };
  BF.client.pose = (p, x, y, s, dir) => { const v = varOf(p); return wCl[v].pose(Object.assign({ _var: v }, p), x, y, s, dir); };
  BF.client.def = (p) => CH[{ a: 'bfClientA', b: 'bfClientB', c: 'bfClientC' }[varOf(p)]];
  BF.BEND = { agent: [1, 1, 1, 1], marchand: [1, 1, 1, 1], marchande: [1, 1, 1, 1], client: [1, 1, 1, 1] };   // vérifié page 7 de la planche (bras avant d1, d−1, arrière d1, d−1)

  // =====================================================================
  // LA VOITURE DES ANNÉES 50 — berline de profil 330 × 150 (s = 1), avant vers +x ; (x,y) = sol sous le milieu
  // =====================================================================
  const VCOL = { vert: '#8fb3a6', creme: '#e6d8b0', rouge: '#8e2f2a' };
  const CHROME = '#d9dcde', CHROMED = '#9aa0a6';
  const CAR_BODY = [[-166, -34, 1], [-162, -62], [-150, -76], [-112, -84], [-86, -88], [-66, -132], [-46, -146], [26, -148], [44, -140], [66, -96], [82, -92], [138, -88], [158, -80], [166, -66], [168, -40, 1], [150, -26], [-150, -26]];
  function puff(cxp, cyp, r, k, seed, col, a) {                                  // bouffée en volutes aux bords irréguliers
    const pts = [], n = 18;
    for (let i = 0; i < n; i++) { const an = i / n * TAU, rr = r * (0.72 + 0.28 * Math.abs(Math.sin(an * 3 + seed)) + 0.12 * hash(seed + i)); pts.push([cxp + Math.cos(an) * rr, cyp + Math.sin(an) * rr * 0.8]); }
    const c = cx_(); c.save(); c.globalAlpha *= a; fillPts(pts, col, seed, 1.2);
    strokePts(ep(cxp - r * 0.15, cyp, r * 0.42, r * 0.34, 10, 0.4, 5.2), 'rgba(120,110,100,0.35)', 1.2); c.restore();
  }
  function drawVoiture(o) {
    const col = VCOL[o.col] || o.col || VCOL.vert, k = clamp(o.klaxon || 0), roue = (o.roule || 0) / 30;
    const c = cx_(), jolt = Math.sin(k * PI) * 5 + Math.sin((o.t || 0) * 13) * 0.6 * (o.cahot == null ? 1 : o.cahot);
    const dark = M.mixc(col.length === 7 ? col : '#8fb3a6', '#000000', 0.25);
    c.save(); c.translate(0, -jolt);
    pc(CAR_BODY, col, () => {
      fillPts([[-160, -60], [-112, -70], [140, -74], [162, -62], [162, -50], [-162, -48]], 'rgba(255,255,255,0.16)');   // reflet de la caisse
      fillPts([[-166, -40], [168, -44], [168, -26], [-166, -26]], dark);
      strokePts([[-158, -58], [-20, -62], [160, -62]], CHROME, 2.4);                                              // jonc chromé
      // vitres (sans rien d'écrit) + montants
      fillPts([[-80, -88], [-62, -128], [-44, -140], [-12, -141], [-12, -90]], '#9db0bc'); fillPts([[-4, -141], [24, -142], [40, -134], [58, -96], [-4, -92]], '#9db0bc');
      fillPts([[-74, -92], [-60, -122], [-50, -130], [-58, -96]], 'rgba(255,255,255,0.35)'); fillPts([[6, -136], [20, -138], [12, -98], [2, -98]], 'rgba(255,255,255,0.28)');
      strokePts([[-12, -142], [-12, -30]], dark, 1.6); strokePts([[60, -94], [60, -30]], dark, 1.2);              // portières
      fillPts(box(-30, -80, -16, -76), CHROME); fillPts(box(40, -82, 54, -78), CHROME);                            // poignées
      // ailes arrondies (renflements) et passages de roues
      strokePts(ep(-102, -30, 46, 36, 12, PI, TAU), dark, 1.6); strokePts(ep(104, -30, 46, 36, 12, PI, TAU), dark, 1.6);
      fillPts(ep(-102, -26, 38, 32, 12, PI, TAU).concat([[-64, -24], [-140, -24]]), '#1c1a1a'); fillPts(ep(104, -26, 38, 32, 12, PI, TAU).concat([[142, -24], [66, -24]]), '#1c1a1a');
      dot(160, -70, 8, CHROME); dot(160, -70, 5, '#f4efd8');                                                       // phare
      fillPts([[-166, -64], [-158, -66], [-158, -54], [-166, -54]], '#a12a24');                                    // feu arrière
      hatch([[-166, -150], [168, -150], [168, -100], [-166, -100]], 0.4, 5, 0.12); shade(0, -150, 0, -20, 0.25, [-170, -150, 170, -20]);
    }, 7700 + (o.seed || 0));
    pc(rrect(-172, -40, -138, -24, 5), CHROME, () => fillPts(box(-172, -34, -138, -30), CHROMED), 7710, { drop: false });   // pare-chocs
    pc(rrect(140, -42, 174, -24, 5), CHROME, () => fillPts(box(140, -36, 174, -32), CHROMED), 7711, { drop: false });
    c.restore();
    for (const wx of [-102, 104]) {                                                // roues à flasques blanches (tournent avec o.roule)
      pc(ell(wx, -30, 30, 30, 20), '#1a1818', () => {
        fillPts(ell(wx, -30, 22, 22, 18), '#efebe2'); fillPts(ell(wx, -30, 15, 15, 16), '#1a1818'); fillPts(ell(wx, -30, 11, 11, 14), CHROME);
        for (let i = 0; i < 4; i++) { const a = roue + i * PI / 2; strokePts([[wx, -30], [wx + Math.cos(a) * 10, -30 + Math.sin(a) * 10]], CHROMED, 1.4); }
      }, 7720 + wx, { drop: false });
    }
    if (k > 0) {                                                                    // klaxon : bouffée devant le capot
      for (let i = 0; i < 3; i++) { const u = clamp(k * 1.4 - i * 0.2); if (u > 0 && u < 1) puff(176 + 34 * u + i * 26, -100 - 26 * u - i * 10, 14 + 22 * u, u, 11 + i * 3, '#f4efe4', (1 - u) * 0.95); }
    }
  }
  OBJ.voiture = { draw: drawVoiture, grip: [0, -80], pts: { pot: [-170, -30], phare: [160, -70], capot: [150, -88] }, base: [0, 0] };
  // BF.voiture(x, y, s, o) : o.col 'vert'|'creme'|'rouge'|hex ; klaxon 0..1 ; fumee (true/0..1 : pot d'échappement) ; phares 0..1 ; roule (px parcourus : roues) ; cahot (1) ; t ; dir ; cast
  BF.voiture = (x, y, s, o) => {
    o = Object.assign({ t: 0 }, o || {}); s = s == null ? 1 : s; const dir = o.dir || 1, t = o.t || 0, c = cx_();
    if (o.fumee && !SIL()) M.fumee(t, { x: x - dir * 172 * s, y: y - 30 * s, s: 0.35 * s, n: 5, haut: 90, vent: -dir * 36, col: '#cfc9c0', a: 0.55 * (o.fumee === true ? 1 : +o.fumee), per: 1.6, seed: 7 });
    const ph = clamp(o.phares || 0);
    if (ph > 0 && !SIL()) {                                                         // faisceau des phares (le soir)
      const hx = x + dir * 160 * s, hy = y - 70 * s;
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(hx, hy, 2, hx, hy, 60 * s); gr.addColorStop(0, `rgba(255,240,190,${0.7 * ph})`); gr.addColorStop(1, 'rgba(255,240,190,0)');
      c.fillStyle = gr; c.fillRect(hx - 70 * s, hy - 70 * s, 140 * s, 140 * s);
      const bg = c.createLinearGradient(hx, hy, hx + dir * 260 * s, hy); bg.addColorStop(0, `rgba(255,236,180,${0.28 * ph})`); bg.addColorStop(1, 'rgba(255,236,180,0)');
      c.fillStyle = bg; c.beginPath(); c.moveTo(hx, hy - 6 * s); c.lineTo(hx + dir * 260 * s, hy - 40 * s); c.lineTo(hx + dir * 260 * s, hy + 66 * s); c.lineTo(hx, hy + 6 * s); c.fill(); c.restore();
    }
    return acc('voiture', x, y, s, Object.assign({ ombre: true }, o));
  };
  BF.VCOL = VCOL;

  // =====================================================================
  // LE SOLEIL « BIG FRIDAY » — bannière de toile dorée 420 × 300 (s = 1) peinte d'un soleil souriant (aucune lettre)
  // (x,y) = milieu de la tringle (en haut). Pré-rendue dans BF.init().
  // =====================================================================
  const BAN = { w: 420, h: 300, sx: 0, sy: 150, r: 74 };
  function drawBanniereCv() {
    return M.pre(BAN.w + 40, BAN.h + 40, (c) => {
      c.translate(20 + BAN.w / 2, 10);
      const hw = BAN.w / 2, H = BAN.h;
      const bord = []; for (let i = 0; i <= 14; i++) bord.push([hw - i * BAN.w / 14, H + (i % 2 ? 10 : 0), 1]);
      pc([[-hw, 0, 1], [hw, 0, 1]].concat(bord, [[-hw, H, 1]]), '#d8b04a', () => {
        for (let x = -hw; x < hw; x += 5) strokePts([[x, 0], [x + 1, H + 10]], 'rgba(140,100,30,0.12)', 1);
        for (let y = 4; y < H; y += 5) strokePts([[-hw, y], [hw, y]], 'rgba(255,240,200,0.10)', 1);
        fillPts(box(-hw, 12, hw, 22), '#b5822e'); fillPts(box(-hw, H - 22, hw, H - 12), '#b5822e');
        // rayons ondulés, alternés orange et or
        const n = 18;
        for (let i = 0; i < n; i++) {
          const a0 = i / n * TAU, col = i % 2 ? '#e08a2c' : '#f0c850', pts = [];
          for (let j = 0; j <= 8; j++) { const u = j / 8, rr = BAN.r + 10 + u * (i % 2 ? 58 : 76), w = 0.13 * (1 - u * 0.7), wv = Math.sin(u * 9 + i) * 0.05; pts.push([BAN.sx + Math.cos(a0 + w + wv) * rr, BAN.sy + Math.sin(a0 + w + wv) * rr]); }
          for (let j = 8; j >= 0; j--) { const u = j / 8, rr = BAN.r + 10 + u * (i % 2 ? 58 : 76), w = 0.13 * (1 - u * 0.7), wv = Math.sin(u * 9 + i) * 0.05; pts.push([BAN.sx + Math.cos(a0 - w + wv) * rr, BAN.sy + Math.sin(a0 - w + wv) * rr]); }
          fillPts(pts, col, i, 0.4); strokePts(pts, 'rgba(140,70,20,0.35)', 1, true);
        }
        // disque et visage souriant (yeux en arcs, joues, sourire)
        fillPts(ell(BAN.sx, BAN.sy, BAN.r, BAN.r, 30), '#f2b23a'); strokePts(ep(BAN.sx, BAN.sy, BAN.r, BAN.r, 30, 0, TAU), '#b8651e', 2.2);
        fillPts(ell(BAN.sx - 10, BAN.sy - 14, BAN.r * 0.72, BAN.r * 0.6, 20), 'rgba(255,230,140,0.45)');
        for (const ex of [-26, 26]) strokePts(ep(BAN.sx + ex, BAN.sy - 14, 12, 9, 8, PI * 1.1, PI * 1.9), '#6a3010', 3.4);
        for (const ex of [-40, 40]) fillPts(ell(BAN.sx + ex, BAN.sy + 12, 12, 8, 12), 'rgba(220,90,50,0.45)');
        strokePts(ep(BAN.sx, BAN.sy + 6, 32, 26, 12, 0.25, PI - 0.25), '#6a3010', 3.6);
        hatch(null, 0.8, 6, 0.08);
      }, 7801);
    });
  }
  // BF.banniere(x, y, s, o) : o.deroule 0..1 (0 = roulée sur sa tringle, 1 = déroulée) ; o.eclipse 0..1 (disque noir qui se pose au centre du soleil) ; o.t (balancement)
  BF.banniere = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const c = cx_(), K = BF.K, t = o.t || 0;
    const dr = clamp(o.deroule == null ? 1 : o.deroule), ec = clamp(o.eclipse || 0), hw = BAN.w / 2, H = BAN.h + 12;
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(0.006 * Math.sin(t * 0.9));
    if (dr > 0 && K.banniere && !SIL()) {
      const hh = H * ease(dr);
      c.save(); c.shadowColor = 'rgba(20,12,4,0.35)'; c.shadowBlur = 10; c.shadowOffsetX = 12; c.shadowOffsetY = 6;
      c.drawImage(K.banniere, 0, 10, BAN.w + 40, hh + 2, -hw - 20, 0, BAN.w + 40, hh + 2); c.restore();
      if (ec > 0 && hh > BAN.sy + BAN.r) {                                          // l'éclipse : la feuille noire se pose sur le soleil
        const u = ease(ec), dy = -(1 - u) * 150, sc = 0.75 + 0.25 * u + M.wob(ec, 0.95, 0.04, 2, 6);
        c.save(); c.globalAlpha = Math.min(1, ec * 3); c.translate(BAN.sx, BAN.sy + dy); c.scale(sc, sc);
        fillPts(ell(0, 0, BAN.r + 6, BAN.r + 6, 30), '#f4efe2'); fillPts(ell(0, 0, BAN.r + 2, BAN.r + 2, 30), NOIR);
        hatch(ell(0, 0, BAN.r, BAN.r, 30), 0.7, 5, 0.10, 1, '255,255,255');
        c.restore();
      }
      if (dr < 1) {                                                                 // rouleau au bas de la partie déroulée
        fillPts(rrect(-hw - 4, hh - 10, hw + 4, hh + 12, 10), '#c39a3e'); strokePts([[-hw, hh - 2], [hw, hh - 2]], 'rgba(255,240,200,0.5)', 1.6);
      }
    }
    // tringle (bois laqué) + deux cordons courts vers la corniche
    if (!SIL()) { c.strokeStyle = 'rgba(40,30,20,0.7)'; c.lineWidth = 1.6; for (const dx of [-hw + 20, hw - 20]) { c.beginPath(); c.moveTo(dx, 0); c.lineTo(dx * 0.92, -22); c.stroke(); } }
    fillPts(rrect(-hw - 14, -6, hw + 14, 8, 6), '#5a3a22'); dot(-hw - 14, 1, 7, '#c9a24a'); dot(hw + 14, 1, 7, '#c9a24a');
    if (dr <= 0) { fillPts(rrect(-hw - 4, 6, hw + 4, 28, 10), '#c39a3e'); strokePts([[-hw, 16], [hw, 16]], 'rgba(255,240,200,0.5)', 1.6); }
    c.restore();
  };
  BF.BAN = { w: 420, h: 300, soleil: [0, 150], r: 74 };                           // soleil à (x, y + 150·s), rayon 74·s

  // =====================================================================
  // LE GRAND MAGASIN DE PHILADELPHIE — BF.magasin(t, o) avant M.drawFloor(), BF.magasinSol(t, o) juste après
  // couches : toile de fond (rue, hôtel de ville au loin, ciel d'hiver) → façade (vitrines, porte, marquise, horloge, corniche) → premier plan (banc, borne, lampadaire, bouche d'incendie)
  // =====================================================================
  const ST = M.ST, W = 1080;
  const K = (BF.K = {});
  const lin = (x0, y0, x1, y1, stops) => { const g = cx_().createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const flatCv = (w, h, fn, sh) => { const cv = M.cutFlat(w, h, w / 2, h - 10, fn); cv.padB = 10; return sh === false ? cv : M.withShadow(cv, 8); };
  const MAG = BF.MAG = {
    corniche: { y: 452, x0: 0, x1: 960 },                                         // dessus de la corniche (pigeons) ; bannière accrochée dessous
    banniere: { x: 480, y: 476 },                                                 // milieu de la tringle de la bannière (s 1 : 420 × 300, jusqu'à y ≈ 788)
    horloge: { x: 480, y: 846, r: 32 },
    marquise: { x0: 372, x1: 588, y: 904, bas: 952 },
    porte: { x0: 402, x1: 558, y0: 962, y1: 1395, x: 480 },
    vitrines: [{ x0: 60, x1: 330, y0: 992, y1: 1318 }, { x0: 640, x1: 930, y0: 992, y1: 1318 }],
    enseigne: { y0: 898, y1: 940 },                                               // bandeau au-dessus des vitrines (néon 1961, LED aujourd'hui)
    banc: { x: 700, x0: 636, x1: 766, assise: 1286, dossier: 1240 },               // assise (y écran) ; BF.BANC_SIEGE = 150 pour une marionnette à s 0,9 aux pieds FEET
    borne: { x: 822, haut: 948, boite: [778, 960, 866, 1072] },                    // borne d'appel de police (1955, 1961)
    ephem: { x: 822, y0: 1080, y1: 1250, w: 130, haut: [822, 1096], centre: [822, 1170] },
    lampadaire: { x: 884, lampe: [884, 668] },
    bouche: { x: 178 },
    zone: { x0: 250, x1: 780, y0: 900, y1: 1430 },                                // zone des personnages : rien devant
  };
  const EPQ = {
    '1955': { pierre: '#d8cdb6', pierreD: '#bfb39a', cadre: '#3e4a3a', cadreL: '#5a6a50', bandeau: '#33402f', or: '#c9a24a', store: ['#e8dfc8', '#4f6a48'] },
    '1961': { pierre: '#ddd4c2', pierreD: '#c4baa4', cadre: '#2f3a40', cadreL: '#4a5860', bandeau: '#242a30', or: '#c9a24a', store: ['#3f7074', '#3f7074'] },
    'auj': { pierre: '#cfcdc6', pierreD: '#b4b1a8', cadre: '#26262a', cadreL: '#3c3c42', bandeau: '#1c1c20', or: '#bfa060', store: null },
  };
  const ep_ = (o) => (EPQ[o && o.epoque] ? o.epoque : '1955');
  const FEN_HAUT = [[110, 560], [250, 560], [710, 560], [850, 560], [110, 700], [250, 700], [710, 700], [850, 700]];   // fenêtres de l'étage (milieu du haut)

  // ---------------------------------------------------------------- toile de fond
  function brick(x0, y0, x1, y1, col, R) {
    fillPts(box(x0, y0, x1, y1), col, 0, 0);
    for (let y = y0 + 6; y < y1; y += 7) strokePts([[x0, y], [x1, y]], 'rgba(40,20,15,0.10)', 0.8);
  }
  function drawFond(kind, heure) {
    const ciel = { jour: ['#9fb2c4', '#c9cfd2', '#dcd8cc'], soir: ['#3e3866', '#8a6a8a', '#d29a7e'], nuit: ['#0e1326', '#1c2240', '#2e3352'] }[heure];
    const brume = { jour: 0.16, soir: 0.18, nuit: 0.15 }[heure], fonce = heure === 'nuit' ? 0.72 : heure === 'soir' ? 0.4 : 0;
    const hx2 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const mixH = (a, b, k) => { const A = hx2(a), B = hx2(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
    const tint = (col) => mixH(mixH(col, ciel[1], brume), '#0b1020', fonce);
    const fen = [], chem = [];
    const cv = M.pre(W, ST.back + 6, (c) => {
      c.fillStyle = lin(0, 0, 0, 900, [[0, ciel[0]], [0.55, ciel[1]], [1, ciel[2]]]); c.fillRect(0, 0, W, ST.back + 6);
      for (let x = 180; x < W; x += 180) strokePts([[x, 0], [x + 2, ST.back]], 'rgba(90,70,50,0.10)', 1.2);
      const R = M.rng(kind === 'auj' ? 2026 : 1955);
      if (heure === 'nuit') for (let i = 0; i < 60; i++) dot(R() * W, 160 + R() * 300, 0.8 + R() * 1.2, 'rgba(255,250,230,0.7)');
      if (heure !== 'jour') { const gg = c.createRadialGradient(880, 300, 4, 880, 300, 60); gg.addColorStop(0, 'rgba(250,245,225,0.95)'); gg.addColorStop(0.3, 'rgba(250,245,225,0.6)'); gg.addColorStop(1, 'rgba(250,245,225,0)'); c.fillStyle = gg; c.fillRect(800, 220, 160, 160); }
      // tours de verre (aujourd'hui), pâles
      if (kind === 'auj') for (const [x0, x1, y0] of [[96, 186, 210], [560, 620, 250], [900, 1000, 150]]) {
        fillPts(box(x0, y0, x1, 480), tint('#8fa2b2'), 0, 0); for (let y = y0 + 10; y < 480; y += 12) strokePts([[x0, y], [x1, y]], 'rgba(255,255,255,0.12)', 1);
        for (let x = x0 + 10; x < x1; x += 14) strokePts([[x, y0], [x, 480]], 'rgba(40,50,60,0.12)', 1);
        for (let y = y0 + 14; y < 470; y += 24) for (let x = x0 + 6; x < x1 - 8; x += 14) fen.push([x, y, 8, 8, 0.3 + R() * 0.65]);
      }
      // hôtel de ville de Philadelphie au loin : tour à étages, cadran rond, coupole et statue (silhouette pâle)
      const hv = tint('#a9a49a'), hx = 740;
      fillPts(box(hx - 70, 400, hx + 70, 480), hv); fillPts(box(hx - 34, 260, hx + 34, 400), hv);
      fillPts(box(hx - 40, 214, hx + 40, 262), hv); fillPts(ell(hx, 238, 17, 17, 16), tint('#d8d2c0'));
      fillPts([[hx - 34, 214], [hx - 24, 150], [hx - 10, 128], [hx + 10, 128], [hx + 24, 150], [hx + 34, 214]], hv);
      fillPts(box(hx - 6, 100, hx + 6, 128), hv); fillPts(ell(hx, 96, 6, 8, 10), hv);
      for (let y = 280; y < 396; y += 26) for (const dx of [-20, 0, 20]) fillPts(box(hx + dx - 4, y, hx + dx + 4, y + 14), tint('#8f8c86'));
      // immeubles de brique (lointains), réservoir d'eau en bois, cheminées
      let x = -20;
      while (x < W) {
        const w = 90 + R() * 110, h = 300 + R() * 130, col = tint(['#9a6a5a', '#a87a62', '#8a5e52', '#b08a70'][Math.floor(R() * 4)]);
        if (x + w > hx - 80 && x < hx + 80 && h < 380) { x += w; continue; }
        brick(x, h, x + w, 480, col, R);
        fillPts(box(x - 3, h - 6, x + w + 3, h), tint('#6e5a50'));
        for (let yy = h + 16; yy < 470; yy += 30) for (let xx = x + 10; xx < x + w - 14; xx += 22) { fillPts(box(xx, yy, xx + 10, yy + 16), tint('#4a4a52')); fen.push([xx, yy, 10, 16, 0.3 + R() * 0.65]); }
        if (R() < 0.6) { const cx2 = x + 14 + R() * (w - 30); fillPts(box(cx2, h - 34, cx2 + 14, h), tint('#6e4a40')); chem.push([cx2 + 7, h - 34]); }
        if (R() < 0.25 && kind !== 'auj') {                                          // réservoir d'eau sur pieds
          const rx = x + w * 0.5; fillPts(box(rx - 22, h - 70, rx + 22, h - 30), tint('#7a5a40')); fillPts([[rx - 24, h - 70], [rx, h - 88], [rx + 24, h - 70]], tint('#5a4030'));
          for (const dx of [-18, 18]) strokePts([[rx + dx, h - 30], [rx + dx * 1.2, h]], tint('#3a3030'), 2);
        }
        x += w + 4;
      }
      // rue transversale à droite (x 960–1080) : façades qui fuient en perspective, trottoir et chaussée
      for (let i = 0; i < 4; i++) {
        const xa = 960 + i * 32, xb = xa + 32, ta = 440 + i * 70, tb = ta + 70, col = tint(['#a06a56', '#8e6a5e', '#b08468', '#94604e'][i]);
        fillPts([[xa, ta], [xb, tb], [xb, 1300], [xa, 1300]], col, 0, 0);
        for (let j = 0; j < 6; j++) { const yy = ta + 60 + j * ((1260 - ta) / 6); fillPts([[xa + 8, yy], [xb - 8, yy + 8], [xb - 8, yy + 40], [xa + 8, yy + 34]], tint('#3e3e48')); fen.push([xa + 8, yy, xb - xa - 16, 34, 0.3 + R() * 0.65, 1]); }
      }
      fillPts(box(940, 1300, W, 1330), tint('#a8a498')); fillPts(box(940, 1330, W, ST.back + 6), tint('#6a6a6e'));
      for (let i = 0; i < 5; i++) strokePts([[960, 1340 + i * 12], [W, 1336 + i * 14]], 'rgba(230,225,210,0.15)', 1);
    });
    cv.fen = fen; cv.chem = chem; return cv;
  }

  // ---------------------------------------------------------------- façade du grand magasin (pré-rendue par époque, jour + nuit)
  function vitrineFond(v, e) {
    const { x0, x1, y0, y1 } = v;
    fillPts(box(x0, y0, x1, y1), '#e6d9bc', 0, 0);
    const c = cx_(); c.save(); c.fillStyle = lin(0, y0, 0, y1, [[0, 'rgba(80,60,40,0.35)'], [0.4, 'rgba(80,60,40,0)'], [1, 'rgba(80,60,40,0.15)']]); c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore();
    fillPts(box(x0, y1 - 26, x1, y1), e === 'auj' ? '#2a2a2e' : '#7a2e2a', 0, 0);                                   // estrade
    strokePts([[x0, y1 - 26], [x1, y1 - 26]], 'rgba(255,230,200,0.3)', 1.4);
  }
  function vitrineVerre(v) {
    const { x0, x1, y0, y1 } = v, c = cx_();
    c.save(); c.globalAlpha = 0.16; fillPts([[x0 + 20, y1], [x0 + 90, y0], [x0 + 130, y0], [x0 + 60, y1]], '#ffffff', 0, 0); fillPts([[x0 + 150, y1], [x0 + 200, y0], [x0 + 212, y0], [x0 + 162, y1]], '#ffffff', 0, 0); c.restore();
    c.save(); c.fillStyle = 'rgba(70,90,100,0.10)'; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore();
  }
  function sapin(x, yb, h) {
    pc(box(x - 6, yb - 20, x + 6, yb), '#5a3a22', null, 8101, { drop: false });
    for (let i = 0; i < 4; i++) { const y = yb - 20 - i * h * 0.22, w = h * (0.34 - i * 0.07); pc([[x - w, y], [x, y - h * 0.36], [x + w, y]], ['#2f5a3a', '#346240', '#2f5a3a', '#3a6a46'][i], () => hatch(null, 0.9, 4, 0.2), 8102 + i, { drop: false }); }
    dot(x, yb - 20 - h * 0.95, 6, '#c9a24a');
    for (let i = 0; i < 12; i++) dot(x + (hash(i * 3.1) - 0.5) * h * 0.5 * (1 - hash(i * 3.1 + 1) * 0.3), yb - 34 - hash(i * 7.3) * h * 0.75, 4, ['#b3262a', '#c9a24a', '#5a7ab0'][i % 3]);
  }
  function cadeaux(x, yb, cols) {
    let y = yb; const dims = [[60, 40], [48, 34], [36, 28]];
    for (let i = 0; i < 3; i++) { const [w, h] = dims[i]; pc(box(x - w / 2 + i * 4, y - h, x + w / 2 + i * 4, y), cols[i], () => { fillPts(box(x - 3 + i * 4, y - h, x + 3 + i * 4, y), '#e8dcb0'); fillPts(box(x - w / 2 + i * 4, y - h / 2 - 3, x + w / 2 + i * 4, y - h / 2 + 3), '#e8dcb0'); }, 8120 + i, { drop: false }); y -= h; }
    pc([[x + 8, y], [x - 6, y - 12], [x - 8, y - 2]], '#e8dcb0', null, 8124, { drop: false }); pc([[x + 8, y], [x + 22, y - 12], [x + 24, y - 2]], '#e8dcb0', null, 8125, { drop: false });
  }
  function mannequin(x, yb, robe, kind) {                                         // buste de couture sur pied, tête ronde sans visage
    strokePts([[x, yb], [x, yb - 90]], '#3a2a20', 3); fillPts(box(x - 26, yb - 4, x + 26, yb), '#3a2a20');
    if (kind === 'trapeze') pc([[x - 18, yb - 210], [x + 18, yb - 210], [x + 24, yb - 180], [x + 46, yb - 80, 1], [x - 46, yb - 80, 1], [x - 24, yb - 180]], robe, () => { fillPts(box(x - 50, yb - 100, x + 50, yb - 92), 'rgba(255,255,255,0.35)'); hatch(null, 0.9, 5, 0.15); }, 8131, { drop: false });
    else pc([[x - 22, yb - 214], [x + 22, yb - 214], [x + 30, yb - 170], [x + 34, yb - 70, 1], [x - 34, yb - 70, 1], [x - 30, yb - 170]], robe, () => { strokePts([[x + 6, yb - 210], [x + 10, yb - 72]], 'rgba(0,0,0,0.3)', 1.4); for (const y of [-190, -160, -130]) dot(x + 12, yb + y, 2.5, '#2a2020'); fillPts([[x - 22, yb - 214], [x + 22, yb - 214], [x + 14, yb - 196], [x - 14, yb - 196]], '#8a6a4c'); hatch(null, 0.9, 5, 0.15); }, 8132, { drop: false });
    pc(box(x - 6, yb - 228, x + 6, yb - 212), '#d8c8b0', null, 8133, { drop: false }); pc(ell(x, yb - 246, 16, 19, 14), '#d8c8b0', null, 8134, { drop: false });
    if (kind !== 'trapeze') pc([[x - 22, yb - 256], [x - 14, yb - 270], [x + 14, yb - 270], [x + 22, yb - 256]], '#3a3028', null, 8135, { drop: false });
  }
  function couronne(x, y, r) {
    pc(ell(x, y, r, r, 20), '#2f5a3a', () => { for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; fillPts(ell(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, 7, 3.5, 6), i % 2 ? '#3f7048' : '#28503a'); } for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3; dot(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, 3, '#b3262a'); } }, 8140 + x, { drop: false });
    fillPts(ell(x, y, r * 0.55, r * 0.55, 16), '#e6d9bc', 0, 0);
    pc([[x, y + r * 0.8], [x - 16, y + r * 0.8 - 10], [x - 14, y + r * 0.8 + 8]], '#a12a24', null, 8150 + x, { drop: false }); pc([[x, y + r * 0.8], [x + 16, y + r * 0.8 - 10], [x + 14, y + r * 0.8 + 8]], '#a12a24', null, 8151 + x, { drop: false });
  }
  function dinde(x, yb) {                                                         // dinde de carton (Thanksgiving) : roue de plumes, corps brun
    for (let i = 0; i < 7; i++) { const a = PI + 0.25 + i * (PI - 0.5) / 6; pc([[x, yb - 60], [x + Math.cos(a - 0.15) * 70, yb - 60 + Math.sin(a - 0.15) * 70], [x + Math.cos(a) * 80, yb - 60 + Math.sin(a) * 80], [x + Math.cos(a + 0.15) * 70, yb - 60 + Math.sin(a + 0.15) * 70]], ['#a4512e', '#c9772e', '#d8b04a', '#8e2f2a', '#c9772e', '#a4512e', '#d8b04a'][i], null, 8160 + i, { drop: false }); }
    pc(ell(x, yb - 42, 30, 34, 16), '#6b4a2e', () => hatch(null, 0.8, 4, 0.2), 8170, { drop: false });
    pc(ell(x + 22, yb - 80, 12, 13, 12), '#7a5a3a', () => { dot(x + 26, yb - 84, 2, '#111'); fillPts([[x + 32, yb - 80], [x + 40, yb - 78], [x + 32, yb - 75]], '#d8a040'); fillPts([[x + 30, yb - 74], [x + 34, yb - 62], [x + 28, yb - 66]], '#b3262a'); }, 8171, { drop: false });
    strokePts([[x - 6, yb - 10], [x - 8, yb]], '#c9a040', 2); strokePts([[x + 8, yb - 10], [x + 10, yb]], '#c9a040', 2);
  }
  function gerbe(x, yb) {
    for (let i = 0; i < 9; i++) { const a = -0.35 + i * 0.09; strokePts([[x, yb], [x + Math.sin(a) * 120, yb - Math.cos(a) * 120]], '#b08a3a', 1.6); fillPts(ell(x + Math.sin(a) * 124, yb - Math.cos(a) * 124, 4, 11, 8), '#d8b04a'); }
    fillPts(box(x - 10, yb - 52, x + 10, yb - 42), '#8e2f2a');
  }
  function televiseur(x, yb) {
    for (const dx of [-30, 30]) strokePts([[x + dx, yb], [x + dx * 0.8, yb - 40]], '#3a2a20', 3);
    pc(rrect(x - 52, yb - 140, x + 52, yb - 40, 8), '#7a5236', () => { fillPts(rrect(x - 42, yb - 130, x + 26, yb - 60, 10), '#20262a'); for (const yy of [-120, -100, -80]) dot(x + 38, yb + yy, 3.5, '#c9a24a'); hatch(null, 0.9, 4, 0.15); }, 8180, { drop: false });
  }
  function chapeaux(x, yb) {
    strokePts([[x, yb], [x, yb - 150]], '#3a2a20', 2.6); fillPts(box(x - 22, yb - 4, x + 22, yb), '#3a2a20');
    for (const [dx, dy, col] of [[-22, -150, '#6e2232'], [18, -118, '#d8c8a0'], [-18, -86, '#3f6a5a']]) pc([[x + dx - 18, yb + dy], [x + dx - 14, yb + dy - 18], [x + dx + 14, yb + dy - 18], [x + dx + 18, yb + dy]], col, null, 8190 + dx, { drop: false });
  }
  function sacs(x, yb) { for (const [dx, col, w] of [[0, '#8e2f2a', 44], [52, '#2f3a40', 38]]) { pc(rrect(x + dx - w / 2, yb - 40, x + dx + w / 2, yb, 6), col, null, 8195 + dx, { drop: false }); strokePts(ep(x + dx, yb - 40, w * 0.3, 18, 8, PI, TAU), col, 2.4); } }
  function radio(x, yb) { pc(rrect(x - 30, yb - 44, x + 30, yb, 6), '#c9772e', () => { fillPts(rrect(x - 24, yb - 38, x + 6, yb - 6, 4), '#e8dcb0'); for (let yy = -34; yy < -8; yy += 5) strokePts([[x - 22, yb + yy], [x + 4, yb + yy]], 'rgba(80,60,40,0.4)', 1); dot(x + 18, yb - 22, 7, '#3a2a20'); }, 8197, { drop: false }); }
  function afficheNoire(x0, y0, x1, y1, seed) {                                   // affiche noire sans lettre : bande dorée en biais, éclat blanc dentelé
    pc(box(x0, y0, x1, y1), NOIR, () => {
      fillPts([[x0, y1 - (y1 - y0) * 0.35], [x1, y0 + (y1 - y0) * 0.25], [x1, y0 + (y1 - y0) * 0.38], [x0, y1 - (y1 - y0) * 0.22]], '#bfa060');
      const cxp = x0 + (x1 - x0) * (0.3 + hash(seed) * 0.4), cyp = y0 + (y1 - y0) * 0.36, r = Math.min(x1 - x0, y1 - y0) * 0.22, pts = [];
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, rr = i % 2 ? r : r * 0.72; pts.push([cxp + Math.cos(a) * rr, cyp + Math.sin(a) * rr, 1]); }
      fillPts(pts, '#f2eee4'); fillPts(ell(cxp, cyp, r * 0.5, r * 0.5, 14), NOIR);
      hatch(null, 0.7, 6, 0.08, 1, '255,255,255', [x0, y0, x1, y1]);
    }, 8200 + seed, { edge: '#f4efe2' });
  }
  function paintFacade(e) {
    const E = EPQ[e], c = cx_();
    c.translate(-540, -ST.back);
    // mur de pierre, chaînages, pilastres
    pc([[-10, 452, 1], [966, 452, 1], [966, ST.back + 6, 1], [-10, ST.back + 6, 1]], E.pierre, () => {
      for (let y = 470; y < 890; y += 30) strokePts([[-10, y], [966, y]], 'rgba(90,80,60,0.16)', 1);
      for (let y = 470; y < 890; y += 30) for (let x = ((y / 30) % 2) * 45; x < 966; x += 90) strokePts([[x, y], [x, y + 30]], 'rgba(90,80,60,0.12)', 1);
      for (const x of [30, 180, 330, 630, 780, 930]) { fillPts(box(x - 14, 470, x + 14, 880), E.pierreD); fillPts(box(x - 18, 470, x + 18, 486), E.pierreD); strokePts([[x - 8, 490], [x - 8, 876]], 'rgba(255,255,255,0.2)', 1.2); }
      hatch([[-10, 452], [966, 452], [966, 560], [-10, 520]], 0.6, 6, 0.1);
      c.fillStyle = lin(0, 452, 0, ST.back, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(60,45,30,0.18)']]); c.fillRect(-10, 452, 976, ST.back - 446);
    }, 8300, { drop: false });
    // corniche à denticules
    pc(box(-16, 436, 972, 470), E.pierreD, () => { for (let x = -10; x < 972; x += 18) fillPts(box(x, 458, x + 10, 470), E.pierre); fillPts(box(-16, 436, 972, 446), E.pierre); strokePts([[-16, 446], [972, 446]], 'rgba(255,255,255,0.4)', 1.4); }, 8301);
    // fenêtres de l'étage (vitres sombres ; elles s'allument le soir)
    for (const [x, y] of FEN_HAUT) {
      pc(box(x - 44, y - 6, x + 44, y + 118), E.pierreD, null, 8310 + x + y, { drop: false });
      fillPts(box(x - 36, y, x + 36, y + 110), '#3e4652', 0, 0);
      strokePts([[x, y], [x, y + 110]], E.pierre, 3); strokePts([[x - 36, y + 46], [x + 36, y + 46]], E.pierre, 3);
      fillPts([[x - 32, y + 104], [x - 6, y + 4], [x + 2, y + 4], [x - 24, y + 104]], 'rgba(255,255,255,0.10)');
      fillPts(box(x - 46, y + 112, x + 46, y + 122), E.pierre);
    }
    // grande baie centrale (derrière la bannière)
    fillPts(ep(480, 600, 64, 64, 12, PI, TAU).concat([[544, 780], [416, 780]]), '#3e4652');
    strokePts([[480, 538], [480, 780]], E.pierre, 3); strokePts([[416, 660], [544, 660]], E.pierre, 3);
    strokePts(ep(480, 600, 68, 68, 12, PI, TAU), E.pierreD, 6);
    // cordon de pierre + bandeau d'enseigne (aucune lettre)
    pc(box(-10, 880, 966, 898), E.pierreD, () => strokePts([[-10, 884], [966, 884]], 'rgba(255,255,255,0.35)', 1.2), 8320, { drop: false });
    for (const [x0, x1] of [[40, 352], [608, 920]]) pc(box(x0, MAG.enseigne.y0, x1, MAG.enseigne.y1), E.bandeau, () => { strokePts([[x0 + 6, MAG.enseigne.y0 + 6], [x1 - 6, MAG.enseigne.y0 + 6]], E.or, 1.4); strokePts([[x0 + 6, MAG.enseigne.y1 - 6], [x1 - 6, MAG.enseigne.y1 - 6]], E.or, 1.4); if (e === '1955') for (let x = x0 + 30; x < x1 - 20; x += 60) fillPts(ell(x, (MAG.enseigne.y0 + MAG.enseigne.y1) / 2, 6, 6, 8), E.or); }, 8321 + x0);
    // horloge ronde sans chiffre (cadran à traits ; aiguilles dessinées à part)
    pc(ell(MAG.horloge.x, MAG.horloge.y, MAG.horloge.r + 8, MAG.horloge.r + 8, 24), '#5a4a32', () => strokePts(ep(MAG.horloge.x, MAG.horloge.y, MAG.horloge.r + 4, MAG.horloge.r + 4, 24, 0, TAU), E.or, 2), 8330);
    fillPts(ell(MAG.horloge.x, MAG.horloge.y, MAG.horloge.r, MAG.horloge.r, 24), '#efe8d6', 0, 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = i % 3 ? 25 : 21; strokePts([[MAG.horloge.x + Math.cos(a) * r0, MAG.horloge.y + Math.sin(a) * r0], [MAG.horloge.x + Math.cos(a) * 29, MAG.horloge.y + Math.sin(a) * 29]], '#3a3028', i % 3 ? 1.2 : 2.4); }
    // vitrines : fond, contenu d'époque, verre, cadres
    const [VL, VR] = MAG.vitrines;
    for (const v of MAG.vitrines) vitrineFond(v, e);
    if (e === '1955') {
      sapin(118, VL.y1 - 26, 230); cadeaux(196, VL.y1 - 26, ['#a12a24', '#3f6a4a', '#c9a24a']); mannequin(282, VL.y1 - 26, '#5a4a6a');
      cadeaux(690, VR.y1 - 26, ['#3e6a8a', '#c9a24a', '#a12a24']); gerbe(818, VR.y1 - 26); dinde(882, VR.y1 - 26);
    } else if (e === '1961') {
      televiseur(116, VL.y1 - 26); mannequin(212, VL.y1 - 26, '#d0782e', 'trapeze'); mannequin(290, VL.y1 - 26, '#4f8a8e', 'trapeze');
      chapeaux(680, VR.y1 - 26); sacs(756, VR.y1 - 26); radio(860, VR.y1 - 26); mannequin(902, VR.y1 - 26, '#b84a5a', 'trapeze');
    } else {
      mannequin(282, VL.y1 - 26, '#26262a', 'trapeze'); mannequin(700, VR.y1 - 26, '#3a3a40', 'trapeze');
    }
    for (const v of MAG.vitrines) vitrineVerre(v);
    if (e === 'auj') {                                                             // vitrines tapissées d'affiches noires (sans lettre)
      afficheNoire(70, 1100, 168, 1240, 1); afficheNoire(176, 1150, 246, 1300, 2); afficheNoire(70, 1250, 168, 1306, 3);
      afficheNoire(790, 1004, 924, 1150, 5); afficheNoire(790, 1166, 924, 1306, 6); afficheNoire(650, 1210, 720, 1306, 4);
      fillPts(box(70, 1000, 168, 1090), '#0c0c10');                                 // écran noir (animé à part)
    }
    for (const v of MAG.vitrines) {
      pc([[v.x0 - 12, v.y0 - 50, 1], [v.x1 + 12, v.y0 - 50, 1], [v.x1 + 12, v.y1 + 4, 1], [v.x0 - 12, v.y1 + 4, 1], [v.x0 - 12, v.y0 - 50, 1], [v.x0, v.y0, 1], [v.x0, v.y1 - 2, 1], [v.x1, v.y1 - 2, 1], [v.x1, v.y0, 1], [v.x0, v.y0, 1]], E.cadre, () => {
        for (let x = v.x0; x < v.x1; x += (v.x1 - v.x0) / 6) fillPts(box(x + 4, v.y0 - 42, x + (v.x1 - v.x0) / 6 - 4, v.y0 - 8), '#4c5866');
        strokePts([[v.x0 - 8, v.y0 - 4], [v.x1 + 8, v.y0 - 4]], E.cadreL, 2);
      }, 8340 + v.x0);
      pc(box(v.x0 - 16, v.y1 + 2, v.x1 + 16, ST.back + 6), E.pierreD, () => { strokePts([[v.x0 - 10, v.y1 + 20], [v.x1 + 10, v.y1 + 20]], 'rgba(255,255,255,0.25)', 1.2); hatch(null, 0.7, 5, 0.12); }, 8350 + v.x0);
    }
    // embrasure de la porte + intérieur chaud (comptoirs, lustre) ; les battants sont dessinés à part
    const Pp = MAG.porte;
    pc(box(Pp.x0 - 22, Pp.y0 - 14, Pp.x1 + 22, ST.back + 6), E.pierreD, null, 8360);
    fillPts(box(Pp.x0, Pp.y0, Pp.x1, ST.back), '#d8b878', 0, 0);
    c.save(); c.fillStyle = lin(0, Pp.y0, 0, ST.back, [[0, 'rgba(120,70,20,0.2)'], [1, 'rgba(90,50,20,0.55)']]); c.fillRect(Pp.x0, Pp.y0, Pp.x1 - Pp.x0, ST.back - Pp.y0); c.restore();
    fillPts(box(Pp.x0 + 10, 1240, Pp.x0 + 70, 1330), '#7a4a2a'); fillPts(box(Pp.x1 - 66, 1250, Pp.x1 - 10, 1330), '#7a4a2a');
    fillPts(box(Pp.x0 + 6, 1230, Pp.x0 + 74, 1240), '#c9a24a'); fillPts(box(Pp.x1 - 70, 1240, Pp.x1 - 6, 1250), '#c9a24a');
    strokePts([[480, Pp.y0], [480, 1010]], '#5a4a32', 1.4); fillPts(ell(480, 1020, 22, 12, 12), '#e8c070'); for (const dx of [-16, 0, 16]) dot(480 + dx, 1032, 4, '#fff2c0');
    // marquise au-dessus de la porte
    const Mq = MAG.marquise;
    pc([[Mq.x0, Mq.y, 1], [Mq.x1, Mq.y, 1], [Mq.x1 + 10, Mq.bas, 1], [Mq.x0 - 10, Mq.bas, 1]], E.cadre, () => {
      fillPts(box(Mq.x0 - 10, Mq.bas - 10, Mq.x1 + 10, Mq.bas), E.or); for (let x = Mq.x0 + 10; x < Mq.x1; x += 24) strokePts([[x, Mq.y + 4], [x, Mq.bas - 12]], 'rgba(255,255,255,0.14)', 1.2);
    }, 8370);
    for (const dx of [-90, 90]) strokePts([[480 + dx, Mq.y], [480 + dx * 0.8, 880]], '#2a2a2a', 2);
  }
  function nightVersion(cv) {
    const n = M.pre(cv.width, cv.height, (c) => { c.drawImage(cv, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(14,18,42,0.62)'; c.fillRect(0, 0, cv.width, cv.height); });
    n.padB = cv.padB; return M.withShadow(n, 8);
  }

  // ---------------------------------------------------------------- premier plan (pré-rendus)
  function drawLampadaire() {
    const c = cx_(); c.save(); c.translate(0, 0);
    pc([[-26, 0, 1], [26, 0, 1], [20, -30], [12, -60, 1], [-12, -60, 1], [-20, -30]], '#2a3030', () => hatch(null, 0.8, 4, 0.2), 8401);
    pc(box(-7, -660, 7, -58), '#2f3636', () => { strokePts([[-2, -650], [-2, -70]], 'rgba(255,255,255,0.2)', 1.2); for (let y = -560; y > -660; y -= 34) fillPts(box(-9, y, 9, y + 6), '#3e4646'); }, 8402);
    pc([[-12, -680], [12, -680], [18, -664], [-18, -664]], '#2f3636', null, 8403);
    pc(ell(0, -716, 30, 38, 18), '#ece6d0', () => { fillPts(ell(-8, -726, 10, 16, 10), 'rgba(255,255,255,0.6)'); }, 8404);
    pc([[-14, -754], [14, -754], [6, -770], [-6, -770]], '#2f3636', null, 8405); dot(0, -774, 5, '#2f3636');
    c.restore();
  }
  function drawBorne() {                                                          // borne d'appel de police, bleue ; éphéméride accroché au fût (dessiné à part)
    pc([[-22, 0, 1], [22, 0, 1], [16, -40], [10, -300, 1], [-10, -300, 1], [-16, -40]], '#2e4a7a', () => { strokePts([[-4, -296], [-6, -40]], 'rgba(255,255,255,0.2)', 1.4); hatch(null, 0.8, 4, 0.2); }, 8411);
    pc(rrect(-44, -436, 44, -322, 6), '#2e4a7a', () => {
      fillPts(rrect(-34, -424, 34, -334, 4), '#25406c'); dot(20, -380, 4, '#c9a24a'); strokePts([[-26, -414], [26, -414]], 'rgba(255,255,255,0.25)', 1.2);
      for (let y = -400; y < -344; y += 9) strokePts([[-26, y], [10, y]], 'rgba(10,20,40,0.35)', 1);
    }, 8412);
    pc([[-48, -436], [48, -436], [30, -456], [-30, -456]], '#25406c', null, 8413);
    pc(ell(0, -464, 10, 10, 12), '#6a8ac0', null, 8414);
    fillPts(box(-14, -318, 14, -300), '#25406c');
  }
  function drawBanc() {
    for (const dx of [-56, 56]) pc([[dx - 6, 0, 1], [dx + 6, 0, 1], [dx + 4, -110, 1], [dx - 4, -110, 1]], '#2a2a28', null, 8421 + dx);
    for (const dx of [-56, 56]) pc([[dx - 4, -110], [dx + 4, -110], [dx + 2, -160], [dx - 6, -160]], '#2a2a28', null, 8423 + dx);
    pc(rrect(-66, -118, 66, -104, 3), '#7a5a3a', () => strokePts([[-62, -114], [62, -114]], 'rgba(255,230,190,0.3)', 1.2), 8425);
    for (const y of [-156, -138]) pc(rrect(-66, y, 66, y + 12, 3), '#7a5a3a', () => strokePts([[-62, y + 4], [62, y + 4]], 'rgba(255,230,190,0.3)', 1.2), 8426 + y);
  }
  function drawBouche() {
    pc([[-24, 0, 1], [24, 0, 1], [20, -12, 1], [16, -70], [12, -82], [-12, -82], [-16, -70], [-20, -12, 1]], '#b8902e', () => { fillPts(box(-30, -54, 30, -40), '#9a7a24'); dot(32, -47, 6, '#c8ccd2'); dot(-32, -47, 6, '#c8ccd2'); strokePts([[-6, -76], [-8, -14]], 'rgba(255,255,255,0.25)', 1.4); hatch(null, 0.8, 4, 0.2); }, 8431);
    pc(ell(0, -88, 16, 10, 12), '#c8ccd2', null, 8432);
  }
  function drawVelos() {                                                          // station de vélos en libre-service (aujourd'hui), deux vélos
    pc(box(-80, -16, 80, 0), '#3a3a40', null, 8441);
    for (const dx of [-40, 40]) {
      pc(box(dx - 30, -120, dx - 20, -16), '#3a3a40', null, 8442 + dx);
      for (const wx of [-26, 26]) { pc(ell(dx + wx * 1.3, -34, 30, 30, 18), '#1a1a1c', () => { fillPts(ell(dx + wx * 1.3, -34, 25, 25, 16), 'rgba(0,0,0,0)'); }, 8450 + dx + wx, { drop: false }); fillPts(ell(dx + wx * 1.3, -34, 24, 24, 16), '#cfcdc6'); fillPts(ell(dx + wx * 1.3, -34, 4, 4, 8), '#3a3a40'); }
      strokePts([[dx - 34, -34], [dx, -70], [dx + 34, -34], [dx - 6, -34], [dx - 34, -34]], '#bfa060', 4); strokePts([[dx, -70], [dx + 28, -78], [dx + 34, -34]], '#bfa060', 4);
      fillPts(box(dx - 10, -82, dx + 6, -76), '#1a1a1c'); fillPts(box(dx + 22, -96, dx + 34, -80), '#2a2a2e');
    }
  }
  function drawTrottinette() { strokePts([[-26, -10], [26, -10]], '#3a3a40', 5); strokePts([[24, -10], [34, -120]], '#3a3a40', 4); strokePts([[24, -120], [44, -120]], '#1a1a1c', 5); for (const x of [-26, 30]) { fillPts(ell(x, -10, 10, 10, 12), '#1a1a1c'); dot(x, -10, 3, '#9aa0a6'); } fillPts(box(-20, -16, 20, -10), '#bfa060'); }
  function drawPoubelle() { pc([[-24, 0, 1], [24, 0, 1], [28, -96, 1], [-28, -96, 1]], '#2f3a36', () => { for (let x = -22; x < 24; x += 8) strokePts([[x, -4], [x * 1.1, -92]], 'rgba(255,255,255,0.12)', 1.2); }, 8461); pc(rrect(-32, -108, 32, -94, 4), '#2a302e', null, 8462); }
  function drawMarrons() {                                                        // marchand de marrons au loin (silhouette + chariot à braises)
    pc(box(-30, -40, 30, -12), '#4a3a30', null, 8471, { drop: false }); for (const x of [-18, 18]) fillPts(ell(x, -10, 9, 9, 10), '#2a2220');
    pc([[-24, -40], [24, -40], [18, -56], [-18, -56]], '#2a2a2a', null, 8472, { drop: false });
    pc([[-50, 0], [-36, 0], [-34, -50], [-30, -70], [-46, -74], [-52, -50]], '#3a3a48', null, 8473, { drop: false });
    pc(ell(-41, -84, 9, 10, 10), '#cfae90', null, 8474, { drop: false }); pc([[-52, -88], [-30, -88], [-36, -98], [-48, -98]], '#2a2a30', null, 8475, { drop: false });
  }

  BF.init = function () {
    K.banniere = drawBanniereCv();
    for (const kind of ['ancien', 'auj']) for (const h of ['jour', 'soir', 'nuit']) K['fond_' + kind + '_' + h] = drawFond(kind, h);
    for (const e of ['1955', '1961', 'auj']) { K['fac' + e] = flatCv(W, 1000, () => paintFacade(e)); K['facN' + e] = nightVersion(K['fac' + e]); }
    K.lampadaire = flatCv(90, 800, drawLampadaire); K.borne = flatCv(110, 490, drawBorne); K.banc = flatCv(160, 180, drawBanc);
    K.bouche = flatCv(90, 110, drawBouche); K.velos = flatCv(180, 140, drawVelos); K.trottinette = flatCv(90, 140, drawTrottinette); K.poubelle = flatCv(80, 125, drawPoubelle);
    K.marrons = flatCv(120, 120, drawMarrons, false);
    for (const e of ['1955', '1961', 'auj']) K['sol' + e] = M.pre(W, 70, (c) => {
      const R = M.rng(e.length * 17 + 3);
      fillPts(box(0, 0, W, 40), e === 'auj' ? '#a9a8a2' : '#b4ad9c');
      for (let x = 0; x < W; x += 96) strokePts([[x, 0], [x - 8, 40]], 'rgba(70,65,55,0.35)', 1.2);
      strokePts([[0, 20], [W, 20]], 'rgba(70,65,55,0.2)', 1);
      for (let i = 0; i < 260; i++) dot(R() * W, 2 + R() * 36, 0.6 + R(), 'rgba(80,75,65,0.3)');
      fillPts(box(0, 38, W, 48), '#8e897c'); strokePts([[0, 38], [W, 38]], 'rgba(255,255,255,0.35)', 1.4);   // bordure du trottoir
      fillPts(box(0, 48, W, 56), '#3a3a3c');                                                              // caniveau
      for (const gx of [210, 960]) { fillPts(box(gx, 47, gx + 70, 56), '#1c1c1e'); for (let x = gx + 4; x < gx + 70; x += 7) strokePts([[x, 48], [x, 55]], '#5a5a5c', 1.4); }
      if (e === '1955') for (let i = 0; i < 40; i++) fillPts(ell(R() * W, 4 + R() * 30, 10 + R() * 26, 2 + R() * 3, 10), 'rgba(250,250,248,0.75)');   // neige tassée
    });
    return K;
  };

  // ---------------------------------------------------------------- parties animées
  function pigeon(x, y, s, ph, pick, dir) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * (dir || 1), s);
    const hd = Math.max(0, Math.sin(ph)) * 0.6 * pick;
    fillPts([[-16, -8], [-4, -16], [10, -14], [16, -6], [10, 0], [-10, 0], [-22, -4]], '#8d929c');
    fillPts([[-14, -10], [4, -14], [8, -8], [-8, -6]], '#a7acb5');
    c.save(); c.translate(10, -14); c.rotate(hd); fillPts(ell(4, -4, 6, 5, 8), '#6f7480'); dot(6, -6, 1.2, '#e8d070'); fillPts([[9, -4], [14, -2], [9, -1]], '#c9a080'); c.restore();
    strokePts([[0, 0], [0, 6]], '#c47a6a', 1.4); strokePts([[4, 0], [5, 6]], '#c47a6a', 1.4);
    c.restore();
  }
  function pigeonVol(x, y, s, dir, fold, g) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s);
    fillPts([[-18, -8], [-2, -14], [12, -12], [18, -6], [10, -2], [-12, -2], [-26, -4]], '#8d929c'); fillPts(ell(14, -14, 6, 5, 8), '#6f7480'); dot(16, -16, 1.2, '#e8d070');
    if (fold < 1) { const a = (1 - fold) * (0.5 + 0.5 * Math.sin(g * 22)); fillPts([[-6, -10], [6, -10], [-10, -10 - 34 * a]], '#a7acb5'); }
    c.restore();
  }
  function store(x0, x1, cols, g, ph) {                                           // store rayé qui ondule (bas festonné)
    const y0 = 946, y1 = 1004, n = Math.round((x1 - x0) / 22), dw = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const xa = x0 + i * dw, xb = xa + dw, wa = Math.sin(g * 2.2 + xa * 0.04 + ph) * 3, wb = Math.sin(g * 2.2 + xb * 0.04 + ph) * 3;
      fillPts([[xa, y0, 1], [xb, y0, 1], [xb + (xb - 480) * 0.03, y1 + wb, 1], [xb - dw * 0.5 + (xa - 480) * 0.03, y1 + 12 + (wa + wb) / 2], [xa + (xa - 480) * 0.03, y1 + wa, 1]], cols[i % 2], 0, 0);
    }
    fillPts(box(x0 - 4, y0 - 6, x1 + 4, y0 + 2), '#2a2a2a');
    hatch([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 0.5, 5, 0.12);
    strokePts([[x0, y0 + 2], [x1, y0 + 2]], 'rgba(255,255,255,0.3)', 1.2);
  }
  function guirlande(x0, x1, y, g, kind, vague) {                                 // guirlande : feuillage (1955) ou fil LED (aujourd'hui) avec ampoules qui scintillent
    const pts = []; const n = Math.round((x1 - x0) / 10);
    for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(x0, x1, u); pts.push([x, y + Math.sin(u * PI * 3) * 0 + 18 * Math.abs(Math.sin(u * PI * 3))]); }
    if (kind === 'houx') { for (let i = 0; i < pts.length; i += 1) fillPts(ell(pts[i][0], pts[i][1], 7, 4, 6), i % 2 ? '#2f5a3a' : '#3f7048', 0, 0); }
    else strokePts(pts, '#2a2a2e', 1.2);
    for (let i = 0; i < pts.length; i += 2) {
      const [x, yy] = pts[i], on = kind === 'led' ? (vague != null && vague > 0 && vague < 1 ? (Math.abs((x - 40) / 900 - vague) < 0.08 ? 1 : 0.35) : 0.5 + 0.5 * Math.sin(g * 5 + i * 1.7)) : 0.55 + 0.45 * Math.sin(g * 3 + i * 2.3);
      const col = kind === 'led' ? `rgba(255,255,255,${0.35 + 0.65 * on})` : ['rgba(230,70,60,', 'rgba(240,200,90,', 'rgba(120,170,230,'][(i / 2) % 3] + (0.45 + 0.55 * on) + ')';
      dot(x, yy + 4, kind === 'led' ? 2.6 : 3.4, col);
      if (on > 0.8) { const c = cx_(); c.save(); c.globalCompositeOperation = 'lighter'; dot(x, yy + 4, 7, kind === 'led' ? 'rgba(255,255,255,0.18)' : 'rgba(255,220,150,0.18)'); c.restore(); }
    }
  }
  function glow(x, y, r, col, a) { const c = cx_(); c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
  function neon(g, o) {                                                           // enseigne au néon 1961 : formes seulement (éclats, vagues, anneaux)
    let on = 0.85 + 0.15 * Math.sin(g * 31) * Math.sin(g * 7);
    const k = o.clignote; if (k != null && k > 0 && k < 1) on = (k < 0.15 || (k > 0.3 && k < 0.42) || k > 0.6) ? on : 0.08;
    const c = cx_(), ym = (MAG.enseigne.y0 + MAG.enseigne.y1) / 2;
    const tube = (pts, col) => { c.save(); c.globalCompositeOperation = 'lighter'; strokePts(pts, `rgba(${col},${0.25 * on})`, 9); strokePts(pts, `rgba(${col},${0.9 * on})`, 3); c.restore(); strokePts(pts, `rgba(255,255,255,${0.6 * on})`, 1); };
    for (const [x0, x1] of [[60, 330], [628, 900]]) {
      const w = []; for (let x = x0 + 70; x <= x1 - 10; x += 6) w.push([x, ym + Math.sin((x - x0) * 0.09) * 9]);
      tube(w, '120,230,255');
      tube(ep(x0 + 34, ym, 9, 9, 14, 0, TAU), '255,130,170'); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; tube([[x0 + 34 + Math.cos(a) * 13, ym + Math.sin(a) * 13], [x0 + 34 + Math.cos(a) * 19, ym + Math.sin(a) * 19]], '255,130,170'); }
    }
    tube(ep(MAG.horloge.x, MAG.horloge.y, MAG.horloge.r + 14, MAG.horloge.r + 14, 30, 0, TAU), '255,130,170');
    if (on > 0.5) glow(480, ym, 380, '255,160,200', 0.05 * on);
  }
  function ecran(g) {                                                             // écran noir animé (aujourd'hui) : barres de lumière qui défilent, éclat qui pulse
    const c = cx_(); c.save(); c.beginPath(); c.rect(72, 1002, 94, 86); c.clip();
    fillPts(box(72, 1002, 166, 1088), '#08080c', 0, 0);
    for (let i = 0; i < 4; i++) { const x = 72 + (((g * 60 + i * 40) % 160) + 160) % 160 - 30; fillPts([[x, 1002], [x + 16, 1002], [x - 14, 1088], [x - 30, 1088]], 'rgba(191,160,96,0.6)', 0, 0); }
    const p = 0.5 + 0.5 * Math.sin(g * 4); fillPts(ell(119, 1045, 14 + 4 * p, 14 + 4 * p, 12), `rgba(242,238,228,${0.5 + 0.4 * p})`, 0, 0); fillPts(ell(119, 1045, 7, 7, 10), '#08080c', 0, 0);
    c.restore();
  }
  function aiguilles(g, vit) {
    const { x, y } = MAG.horloge, a2 = g * 0.08 * vit, a1 = a2 / 12 + 1.2;
    strokePts([[x, y], [x + Math.sin(a1) * 16, y - Math.cos(a1) * 16]], '#2a2420', 3); strokePts([[x, y], [x + Math.sin(a2) * 25, y - Math.cos(a2) * 25]], '#2a2420', 1.8); dot(x, y, 3, '#c9a24a');
  }
  function portes(k, e) {                                                         // deux battants vitrés qui s'ouvrent vers l'intérieur
    const Pp = MAG.porte, wv = (Pp.x1 - Pp.x0) / 2, u = ease(clamp(k)), col = EPQ[e].cadre;
    for (const side of [-1, 1]) {
      const hx = side < 0 ? Pp.x0 : Pp.x1, w = wv * (1 - 0.78 * u), xi = hx - side * w, sk = 10 * u;
      const pts = [[hx, Pp.y0, 1], [xi, Pp.y0 + sk, 1], [xi, ST.back - sk, 1], [hx, ST.back, 1]];
      pc(pts, col, () => {
        const m = 9 * (1 - 0.6 * u); fillPts([[hx - side * m, Pp.y0 + 12], [xi + side * m, Pp.y0 + sk + 12], [xi + side * m, 1300 - sk], [hx - side * m, 1300]], 'rgba(190,170,120,0.55)');
        fillPts([[hx - side * w * 0.2, Pp.y0 + 30], [hx - side * w * 0.45, Pp.y0 + 30 + sk * 0.5], [hx - side * w * 0.55, 1200], [hx - side * w * 0.3, 1200]], 'rgba(255,255,255,0.12)');
        fillPts([[hx - side * m * 0.5, 1180], [xi + side * m * 0.5, 1180], [xi + side * m * 0.5, 1190], [hx - side * m * 0.5, 1190]], '#c9a24a');
      }, 8380 + side, { drop: false });
    }
  }
  const FLOC = []; { const R = M.rng(1127); for (let i = 0; i < 70; i++) FLOC.push({ x: R() * 1180 - 50, ph: R() * TAU, v: 26 + R() * 30, r: 1.4 + R() * 2.4, o: R() * 1600 }); }
  function flocons(g, a) {
    for (const f of FLOC) { const y = 150 + ((f.o + g * f.v) % 1260), x = f.x + Math.sin(g * 0.8 + f.ph) * 18 - g * 4 % 1180; const xx = ((x % 1180) + 1180) % 1180 - 50; dot(xx, y, f.r, `rgba(250,250,255,${0.7 * a})`); }
  }

  // BF.magasin(t, o) : o.epoque '1955' | '1961' | 'auj' ; nuit 0..1 (0 jour, 0,5 soir violet, 1 nuit) ; ephem 0..1 (0 page blanche, 1 page arrachée → page noire) ;
  //   horloge (vitesse des aiguilles, 1) ; porte 0..1 ; banniere ({deroule, eclipse} ou true) ; affichesNoires / etiquettes (auj, true) ; neige (1955 : true) ;
  //   pigeon 0..1 (un pigeon vient se poser sur la marquise) ; marrons 0..1 (bouffée du marchand de marrons, 1955) ; clignote 0..1 (le néon 1961 clignote une fois) ;
  //   vague 0..1 (aujourd'hui : la guirlande LED clignote en vague de gauche à droite) ; borne (true en 1955/1961) ; premierPlan (true)
  BF.magasin = function (t, o) {
    o = o || {}; const e = ep_(o), E = EPQ[e], g = M.tg(t), c = cx_(), n = clamp(o.nuit || 0), kind = e === 'auj' ? 'auj' : 'ancien';
    // 1) toile de fond (jour → soir → nuit)
    const fj = K['fond_' + kind + '_jour'], fs = K['fond_' + kind + '_soir'], fn = K['fond_' + kind + '_nuit'];
    c.drawImage(n < 0.5 ? fj : fs, 0, 0);
    if (n > 0 && n < 0.5) { c.save(); c.globalAlpha = n * 2; c.drawImage(fs, 0, 0); c.restore(); }
    if (n > 0.5) { c.save(); c.globalAlpha = (n - 0.5) * 2; c.drawImage(fn, 0, 0); c.restore(); }
    if (n < 0.75) M.nuages(t, { y0: 190, y1: 360, n: 3, vit: 9, s: 0.8, seed: 55, col: n > 0.3 ? '#b8a0b0' : '#eceae4', brume: 0.25 });
    if (n < 0.9) M.oiseaux(g, { x0: -80, x1: 1160, y: 380, t0: 0, dur: 19, n: 4, s: 0.5, seed: 12, boucle: true, col: '#5a5e68', brume: 0.3 });
    for (const [i, p] of fj.chem.entries()) if (i % 2 === 0) M.fumee(t, { x: p[0], y: p[1], s: 0.3, n: 4, haut: 110, vent: 22, col: n > 0.5 ? '#6a6a80' : '#d8d4cc', a: 0.45, seed: 60 + i });
    if (n > 0.05) for (const f of fj.fen) { const a = clamp((n - f[4]) * 6); if (a > 0) fillPts(box(f[0], f[1], f[0] + f[2], f[1] + f[3]), `rgba(242,200,110,${0.85 * a})`, 0, 0); }
    M.passants(t, { y: 1318, s: 0.22, n: 3, per: 15, x0: 968, x1: 1100, brume: 0.45 + 0.3 * n, seed: 41 });
    if (e !== 'auj') {                                                              // poteau de barbier (rayures rouge et ivoire qui tournent)
      const bx = 978, by0 = 1150, by1 = 1236; fillPts(box(bx - 9, by0, bx + 9, by1), '#efe8d6', 0, 0);
      c.save(); c.beginPath(); c.rect(bx - 9, by0, 18, by1 - by0); c.clip(); for (let y = by0 - 40; y < by1 + 20; y += 16) { const yy = y + ((g * 22) % 16); fillPts([[bx - 9, yy], [bx + 9, yy - 10], [bx + 9, yy - 3], [bx - 9, yy + 7]], '#a12a24', 0, 0); } c.restore();
      fillPts(ell(bx, by0 - 4, 11, 7, 10), '#c8ccd2'); fillPts(ell(bx, by1 + 4, 11, 7, 10), '#c8ccd2');
    }
    if (e === '1955') {                                                             // marchand de marrons au loin, sa fumée
      M.flat(K.marrons, 1018, 1322, { scale: 0.75 });
      M.fumee(t, { x: 1018, y: 1286, s: 0.3 + 0.25 * clamp(o.marrons || 0), n: 5, haut: 120 + 120 * clamp(o.marrons || 0), vent: -14, col: '#e6e0d6', a: 0.55 + 0.3 * clamp(o.marrons || 0), per: 2.4, seed: 77 });
      glow(1018, 1290, 26, '255,140,60', 0.35 + 0.15 * Math.sin(g * 9));
    }
    // 2) façade (jour / nuit)
    const fc = K['fac' + e], fcN = K['facN' + e];
    M.flat(n > 0.5 ? fcN : fc, 540, ST.back, { cast: { a: 0.22, dx: 12, dy: 5 } });
    if (n > 0 && n <= 0.5) { c.save(); c.globalAlpha = n * 2; M.flat(fcN, 540, ST.back); c.restore(); }
    if (n > 0.5 && n < 1) { /* nuit pleine : rien */ }
    // pigeons sur la corniche
    pigeon(150, MAG.corniche.y - 14, 1.1, g * 5, 1, 1); pigeon(612, MAG.corniche.y - 14, 1.0, g * 4 + 2, 1, -1); pigeon(668, MAG.corniche.y - 14, 1.05, g * 6 + 1, 1, 1);
    // fenêtres de l'étage qui s'allument une à une le soir
    if (n > 0.05) for (const [i, [x, y]] of FEN_HAUT.entries()) { const a = clamp((n - (0.2 + hash(i * 4.7) * 0.6)) * 7); if (a > 0) { fillPts(box(x - 36, y, x + 36, y + 110), `rgba(240,200,120,${0.8 * a})`, 0, 0); strokePts([[x, y], [x, y + 110]], E.pierreD, 3); strokePts([[x - 36, y + 46], [x + 36, y + 46]], E.pierreD, 3); } }
    // vitrines allumées le soir
    if (n > 0.05) for (const v of MAG.vitrines) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = lin(0, v.y0, 0, v.y1, [[0, `rgba(255,210,140,${0.35 * n})`], [1, `rgba(255,190,110,${0.15 * n})`]]); c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); c.restore(); }
    // époque : store, guirlandes, néon, écran, étiquettes suspendues
    if (e === '1955') {
      for (const v of MAG.vitrines) { couronneDyn(v); }
      guirlande(44, 350, 940, g, 'houx'); guirlande(610, 918, 940, g, 'houx');
      store(50, 340, E.store, g, 0); store(630, 940, E.store, g, 1.3);
      sapinLumieres(g);
    } else if (e === '1961') {
      store(50, 340, E.store, g, 0); store(630, 940, E.store, g, 1.3);
      fillPts(box(50, 1000, 340, 1006), '#e8e2d4'); fillPts(box(630, 1000, 940, 1006), '#e8e2d4');
      tele(g); neon(g, o);
    } else {
      guirlande(40, 352, 942, g, 'led', o.vague); guirlande(608, 920, 942, g, 'led', o.vague == null ? null : o.vague - 0.05);
      ecran(g);
      if (o.etiquettes !== false) for (const [x, y, ph] of [[150, 1050, 0], [860, 1050, 1.7]]) { const ax = x - 70; strokePts([[ax, 992], [ax, y]], FICELLE, 1.6); c.save(); c.translate(ax, y); c.rotate(Math.sin(g * 1.3 + ph) * 0.05); c.translate(70, 0); c.scale(1.6, 1.6); drawEtiquette({ t: g }); c.restore(); }
      if (o.affichesNoires === false) { /* affiches dans le pré-rendu : toujours présentes aujourd'hui */ }
    }
    aiguilles(g, o.horloge == null ? 1 : o.horloge);
    portes(o.porte || 0, e);
    if (n > 0.05) { for (let x = MAG.marquise.x0 + 16; x < MAG.marquise.x1; x += 30) dot(x, MAG.marquise.bas - 4, 2.6, `rgba(255,236,170,${0.5 + 0.5 * n})`); glow(480, 960, 120, '255,210,140', 0.25 * n); }
    if (o.pigeon != null && o.pigeon > 0) {                                        // un pigeon vient se poser sur la marquise
      const k = clamp(o.pigeon), u = ease(Math.min(1, k / 0.75)), px = 540, py = MAG.marquise.y - 2;
      if (k < 0.75) pigeonVol(lerp(1060, px, u), lerp(330, py, u) - Math.sin(u * PI) * 60, 1.1, -1, smooth(0.55, 0.75, k), g);
      else pigeon(px, py, 1.1, (g - 0) * 5, smooth(0.8, 1, k), -1);
    }
    // bannière (accroche sous la corniche)
    if (o.banniere) { const b = o.banniere === true ? {} : o.banniere; BF.banniere(MAG.banniere.x, MAG.banniere.y, 1, { deroule: b.deroule == null ? 1 : b.deroule, eclipse: b.eclipse || 0, t: g }); }
    // 3) premier plan
    if (o.premierPlan !== false) {
      if (e === 'auj') { M.flat(K.velos, 150, ST.back, { cast: { a: 0.25, dx: 10, dy: 4 } }); M.flat(K.poubelle, 820, ST.back, { cast: { a: 0.25, dx: 10, dy: 4 } }); M.flat(K.trottinette, 958, ST.back, { rot: -0.04 }); }
      M.flat(K.bouche, MAG.bouche.x, ST.back, { cast: { a: 0.25, dx: 10, dy: 4 } });
      M.flat(K.banc, MAG.banc.x, ST.back, { cast: { a: 0.25, dx: 10, dy: 4 } });
      if (e !== 'auj' && o.borne !== false) { M.flat(K.borne, MAG.borne.x, ST.back, { cast: { a: 0.25, dx: 10, dy: 4 } }); ephemeride(o.ephem || 0, g); if (n > 0.2) glow(MAG.borne.x, MAG.borne.haut - 16, 40, '120,160,255', 0.5 * n * (0.7 + 0.3 * Math.sin(g * 3))); }
      M.flat(K.lampadaire, MAG.lampadaire.x, ST.back, { cast: { a: 0.25, dx: 10, dy: 4 } });
      const [lx, ly] = MAG.lampadaire.lampe;
      if (n > 0.1) { glow(lx, ly - 48, 150, '255,220,150', 0.45 * n * (0.94 + 0.06 * Math.sin(g * 11))); fillPts(ell(lx, ly - 48, 26, 34, 16), `rgba(255,240,190,${0.6 * n})`, 0, 0); }
    }
    if (e === '1955' && o.neige !== false) flocons(g, 1);
    if (n > 0.02) { c.save(); c.fillStyle = `rgba(20,24,60,${0.22 * n})`; c.fillRect(0, 0, W, ST.back); c.restore(); }
  };
  function couronneDyn(v) { couronne((v.x0 + v.x1) / 2, v.y0 + 46, 30); }
  function sapinLumieres(g) { for (let i = 0; i < 14; i++) { const on = 0.5 + 0.5 * Math.sin(g * 4 + i * 2.1); dot(118 + (hash(i * 5.1) - 0.5) * 100 * (0.4 + hash(i * 2.2) * 0.6), MAG.vitrines[0].y1 - 60 - hash(i * 9.7) * 170, 2.6, `rgba(255,${200 + 40 * on},120,${0.4 + 0.6 * on})`); } }
  function tele(g) { const x = 116, yb = MAG.vitrines[0].y1 - 26, f = 0.75 + 0.25 * Math.sin(g * 17) * Math.sin(g * 3.1); fillPts(rrect(x - 42, yb - 130, x + 26, yb - 60, 10), `rgba(150,190,220,${0.55 * f})`, 0, 0); fillPts(ell(x - 8, yb - 96, 12, 16, 10), 'rgba(40,50,60,0.6)', 0, 0); fillPts(box(x - 28, yb - 80, x + 12, yb - 64), 'rgba(40,50,60,0.5)', 0, 0); }
  function ephemeride(k, g) {                                                     // bloc ivoire 130 × 170 sous la boîte de la borne
    const { x, y0, y1, w } = MAG.ephem, hw = w / 2;
    strokePts([[x - 30, y0], [x - 26, y0 - 14]], '#2a2a2a', 1.6); strokePts([[x + 30, y0], [x + 26, y0 - 14]], '#2a2a2a', 1.6);
    pc(box(x - hw, y0 + 8, x + hw, y1), '#e8dfc8', () => { for (let i = 1; i < 6; i++) strokePts([[x - hw, y1 - i * 3], [x + hw, y1 - i * 3]], 'rgba(120,110,90,0.4)', 1); }, 8501);
    // page noire (découverte quand la page blanche est arrachée)
    pc(box(x - hw + 4, y0 + 16, x + hw - 4, y1 - 16), NOIR, () => hatch(null, 0.7, 5, 0.1, 1, '255,255,255', [x - hw, y0, x + hw, y1]), 8502, { edge: '#f4efe2', drop: false });
    const u = clamp(k);
    if (u < 1) {                                                                  // page blanche du dessus : se soulève et bascule vers le haut, puis disparaît
      const sy = 1 - 1.15 * ease(u), top = y0 + 16, a = 1 - smooth(0.8, 1, u);
      const c = cx_(); c.save(); c.globalAlpha *= a; c.translate(0, top); c.scale(1, Math.max(-0.2, sy)); c.translate(0, -top);
      pc(box(x - hw + 4, top, x + hw - 4, y1 - 16), sy < 0 ? '#d8d0bc' : '#fbf8f0', () => { fillPts(box(x - hw + 4, top, x + hw - 4, top + 26), '#e6dfcf'); hatch(null, 0.7, 6, 0.05); }, 8503, { drop: false });
      c.restore();
    }
    pc(box(x - hw - 2, y0, x + hw + 2, y0 + 16), '#5a2a2e', () => { for (const dx of [-28, 28]) dot(x + dx, y0 + 8, 3.5, '#c9a24a'); }, 8504);   // reliure
  }
  // BF.magasinSol(t, o) : après M.drawFloor() : trottoir (dalles), bordure, caniveau à grilles ; flaques de lumière du lampadaire le soir
  BF.magasinSol = function (t, o) {
    o = o || {}; const e = ep_(o), g = M.tg(t), n = clamp(o.nuit || 0), c = cx_();
    c.drawImage(K['sol' + e], 0, ST.back - 2);
    if (n > 0.1) glow(MAG.lampadaire.x, ST.back + 22, 160, '255,220,150', 0.22 * n);
    if (n > 0.05) for (const v of MAG.vitrines) glow((v.x0 + v.x1) / 2, ST.back + 18, 150, '255,200,120', 0.14 * n);
    pigeon(1000, ST.back + 30, 1.3, g * 5 + 1, 1, -1);
  };
})();
