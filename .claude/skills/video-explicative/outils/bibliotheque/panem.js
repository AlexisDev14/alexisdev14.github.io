// persos.js — « Du pain et des jeux, la moquerie qui a nommé Panem » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.pej (alias PEJ). Appeler PEJ.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash / M.rng, aucun Math.random). Tout dans une IIFE.
// Mécanique des corps (bras et jambes à articulations rondes, genoux, gestes communs marche/assis, objets tenus) reprise de
// bibliotheque/greve.js (copiée ici, pour ne pas dépendre de ses internes) ; objets, personnages et décors propres à la vidéo.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, easeOut, easeIn, hash, noise, smooth } = M;
  const PEJ = (M.pej = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const W = 1080, ST = M.ST, HB = ST.back + 5, FEET = ST.slotF - 34;

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
  const pcv = (pts, base, paint, seed, o) => pc(pts.map((q) => [q[0], q[1], 1]), base, paint, seed, o);   // architecture : angles vifs
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function ribbon(line, w) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const ww = (typeof w === 'function' ? w(i / (line.length - 1)) : w) / 2;
      L.push([line[i][0] - dy * ww, line[i][1] + dx * ww]); R.push([line[i][0] + dy * ww, line[i][1] - dx * ww]);
    }
    return L.concat(R.reverse());
  }
  // contour bouclé (cheveux frisés, laurier) : points alternés repoussés vers l'extérieur
  function boucle(pts, amp, step) {
    let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
    const o = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
      for (let k = 0; k < n; k++) { const u = k / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), push = (k % 2) ? amp : 0, dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1; o.push([x + dx / l * push, y + dy / l * push]); }
    }
    return o;
  }
  // nuage / volute de papier : contour tout en bosses (aucun bord droit)
  function bosses(cx, cy, rx, ry, n, amp, seed) {
    const o = [], R = M.rng(seed || 1);
    for (let i = 0; i < n * 3; i++) { const a = i / (n * 3) * TAU, k = i % 3, bump = k === 1 ? 1 : k === 0 ? 0.25 : 0.55; const rr = 1 + amp * bump * (0.7 + 0.6 * R()); o.push([cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr]); }
    return o;
  }
  // volutes de fumée ou de poussière : bords tout en arcs (repris de montgolfiere.js) ;
  // o : { x, y, k (densité 0..1), haut, vent (dérive x), per, n, r, seed, col, colD, a, larg, dir (−1 = descend), horiz (dérive horizontale pure) }
  function volutes(t, o) {
    if (SIL() || !(o.k > 0.01)) return;
    const c = cx_(), n = o.n || 7, per = o.per || 2.4, k = clamp(o.k), haut = (o.haut || 200) * (0.55 + 0.45 * k), R = M.rng(o.seed || 7);
    const col = o.col || '#f0ece4', colD = o.colD || '#b9b3a8', colL = o.colL || '#ffffff', lw = M._lw ? M._lw() : 1;
    for (let i = 0; i < n; i++) {
      const ph = R() * TAU, off = i / n + R() * 0.08, sx = (R() - 0.5) * (o.larg || 0), sy = (R() - 0.5) * (o.largY || 0);
      const u = (((t / per + off) % 1) + 1) % 1;
      const px = o.x + sx + (o.vent == null ? 24 : o.vent) * Math.pow(u, 1.1) + Math.sin(u * 6 + ph) * 9 * u, py = o.y + sy - (o.dir || 1) * haut * Math.pow(u, 0.85);
      const r = (6 + (o.r || 34) * Math.pow(u, 0.75)) * (0.6 + 0.4 * k), al = Math.min(1, k * 1.4) * Math.pow(1 - u, 0.8) * Math.min(1, u * 8) * (o.a || 0.92);
      const B = []; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + ph + u * 2.2; B.push([px + Math.cos(a) * r * 0.5, py + Math.sin(a) * r * 0.34, r * (0.46 + 0.16 * Math.sin(j * 2.3 + ph))]); }
      c.save(); c.globalAlpha = al;
      c.strokeStyle = colD; c.lineWidth = 2 * lw;
      for (const b of B) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, TAU); c.stroke(); }
      c.fillStyle = col; for (const b of B) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, TAU); c.fill(); }
      c.fillStyle = colL; c.globalAlpha = al * 0.4; for (const b of B) { c.beginPath(); c.arc(b[0] - b[2] * 0.25, b[1] - b[2] * 0.3, b[2] * 0.45, 0, TAU); c.fill(); }
      c.restore();
    }
  }
  PEJ.volutes = volutes;
  PEJ.geo = { ep, ell, mp, rot, rrect, box, qbez, ribbon, bosses };
  const OBJ = {};
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
    sandale: [[-16, -4], [12, -4], [24, 0], [40, 4], [47, 11, 1], [46, 15, 1], [-17, 15, 1], [-19, 5]],
    basket: [[-17, -8], [10, -8], [24, -2], [40, 2], [49, 9], [48, 15, 1], [-18, 15, 1], [-20, 3]],
    botte: [[-17, -6], [14, -6], [24, -1], [40, 3], [47, 11, 1], [46, 15, 1], [-18, 15, 1], [-20, 5]],
  };
  function footPaint(kind, col) {
    return () => {
      if (kind === 'sandale') { fillPts([[-20, 10], [50, 10], [50, 16], [-20, 16]], '#5a3a22'); for (const [a, b] of [[[-14, -3], [4, 11]], [[6, -3], [24, 11]], [[26, 1], [36, 11]]]) strokePts([a, b], '#6b4526', 2.6); strokePts([[-16, -4], [12, -4]], '#6b4526', 3); return; }
      if (kind === 'basket') { fillPts([[-20, 8], [50, 8], [50, 16], [-20, 16]], '#cfc8b9'); strokePts([[0, -4], [24, 0]], 'rgba(120,110,100,0.6)', 1.2); strokePts([[-10, 4], [36, 6]], '#b98a5a', 1.4); return; }
      if (kind === 'sabot') { strokePts([[-14, -2], [40, 2]], 'rgba(255,230,180,0.35)', 1.4); hatch(null, 0.4, 4, 0.2); return; }
      fillPts([[-20, 11], [50, 11], [50, 16], [-20, 16]], 'rgba(10,8,6,0.55)'); strokePts([[16, -2], [36, 3]], 'rgba(255,255,255,0.22)', 1.3);
      if (kind === 'boucle') { fillPts(box(14, -4, 24, 4), '#c9a24a'); }
    };
  }
  // pièces « objet tenu » (TEF) + « charge » portée à deux mains (dessinée dans le repère du torse, devant ou dans le dos)
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function chargeDraw(p, dos) {
    const ch = p._charge; if (!ch || !!ch.dos !== dos) return;
    const ob = OBJ[ch.nom], c = cx_(); c.save(); c.translate(ch.pos[0], ch.pos[1]); c.rotate(ch.angT); c.translate(-ob.base[0], -ob.base[1]); ob.draw(Object.assign({ t: p.t || 0 }, ch.o)); c.restore();
  }
  function heldParts(skin, seed) {
    const has = (v) => v && v !== 'rien';
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !fondOf(p.tenu, p)) heldDraw(p.tenu, p.tenuO, p); } },
      objetFond: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 7, pts: OFFP, extra: (p) => { if (has(p.tenu) && fondOf(p.tenu, p)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) || (p._charge && p._charge.tient) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
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
      footB: { parent: 'legB_lo', at: [0, ANK], pts: FOOT[o.foot === 'boucle' ? 'soulier' : (o.foot || 'soulier')], base: o.shoeB || o.shoe, seed: sd + 3, noRivet: true, paint: footPaint(o.foot, o.shoe) },
      legF: { parent: 'torso', at: [6, -2], pts: thighPts(th), base: o.thigh, seed: sd + 4, paint: legPaint(false, false) },
      legF_lo: { parent: 'legF', at: [0, KNEE], pts: shinPts(), base: o.shin || o.thigh, seed: sd + 5, paint: legPaint(false, true) },
      footF: { parent: 'legF_lo', at: [0, ANK], pts: FOOT[o.foot === 'boucle' ? 'soulier' : (o.foot || 'soulier')], base: o.shoe, seed: sd + 6, noRivet: true, paint: footPaint(o.foot, o.shoe) },
      armB_up: { parent: 'torso', at: SH_B, pts: armR(LA, o.armW), base: o.sleeveB || o.sleeve, seed: sd + 7, paint: () => hatch(null, 0.8, 3.6, 0.3) },
      armB_lo: foreDef('armB_up', o.sleeveB || o.sleeve, o.skinD, true, sd + 8, o),
      head: { parent: 'torso', at: [6, -170], pts: o.head || X.NAP_HEAD, base: o.skin, seed: sd + 9, noRivet: true, paint: o.headPaint },
      armF_up: { parent: 'torso', at: SH_F, pts: armR(LA, o.armW), base: o.sleeve, seed: sd + 10, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26) },
      armF_lo: foreDef('armF_up', o.sleeve, o.skin, false, sd + 11, o),
    };
    Object.assign(parts, heldParts(o.skin, sd + 20), o.parts || {});
    const order = ['objetFond', 'armB_up', 'armB_lo', 'objetB', 'legB', 'legB_lo', 'footB', 'legF', 'legF_lo', 'footF'].concat(o.backs || [], ['chargeDos', 'head'], o.heads || [], ['torso'], o.fronts || [],
      ['charge', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);
    return { hipY: HIPY, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, parts, order };
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
    A.objetFond = A.objet || 0;                                                // objet plat tenu « derrière » (tablette) : même angle
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
    const r = M.puppet(def, q, x, y, s, o || {});
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // =====================================================================
  // OBJETS — chaque objet se dessine dans son repère, à l'échelle 1 (seul, tenu, ou « charge » portée)
  // =====================================================================
  const fondOf = (name, p) => { const ob = OBJ[name]; return !!(ob && ob.fond && ob.fond(heldOpts(name, p.tenuO, p))); };
  const IVO = '#E6DCC3', IVOD = '#cdc2a6', BOIS = '#7A5232', BOISD = '#5a3a22', CIRE = '#3B2F2A', CUIR = '#5a3a22';
  const ROUGE = '#8A2F2A', BLEU = '#3F5A7A', OR = '#c9a24a', ORD = '#9a7a30';
  // tracé partiel d'une polyligne (k 0..1 de sa longueur)
  function partial(pts, k) {
    if (k <= 0) return null; if (k >= 1) return pts;
    let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    let rest = L * k; const o = [pts[0]];
    for (let i = 1; i < pts.length; i++) { if (rest >= seg[i - 1]) { o.push(pts[i]); rest -= seg[i - 1]; } else { const u = rest / seg[i - 1]; o.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); break; } }
    return o;
  }
  // trait gravé dans la cire (ivoire, tremblé fixe), k = part tracée
  function grave(pts, k, lw, seed) {
    const q = partial(pts.map((p, i) => [p[0] + (hash(i * 3.1 + seed) - 0.5) * 1.6, p[1] + (hash(i * 5.7 + seed) - 0.5) * 1.6]), k); if (!q || q.length < 2) return;
    strokePts(q.map((p) => [p[0] + 0.8, p[1] + 1]), 'rgba(10,6,4,0.7)', lw + 1);
    strokePts(q, 'rgba(236,226,200,0.97)', lw);
  }
  // pictogrammes de la tablette (et de l'écran) : pain rond à 8 quartiers + ficelle ; roue de char à 8 rayons. k 0..1 chacun.
  function pictoPain(cx, cy, R, k, lw) {
    // miche vue de trois quarts : dessus ovale à 8 quartiers, flanc bombé, fond plat, ficelle (≠ roue : ni moyeu ni jante double)
    const ty = cy - R * 0.28, rx = R * 1.05, ry = R * 0.5;
    const contour = ep(cx, ty, rx, ry, 16, PI, TAU).concat([[cx + rx, ty + R * 0.12], [cx + rx * 0.98, ty + R * 0.42]], ep(cx, ty + R * 0.5, rx * 0.95, R * 0.34, 14, 0.1, PI - 0.1), [[cx - rx, ty + R * 0.12], [cx - rx, ty]]);
    grave(contour, smooth(0, 0.35, k), lw, 11);
    grave(ep(cx, ty, rx, ry, 12, 0, PI), smooth(0.33, 0.42, k), lw * 0.8, 12);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; grave([[cx + Math.cos(a) * rx * 0.08, ty + Math.sin(a) * ry * 0.08], [cx + Math.cos(a) * rx * 0.8, ty + Math.sin(a) * ry * 0.8]], smooth(0.42 + i * 0.045, 0.48 + i * 0.045, k), lw * 0.8, 20 + i); }
    grave(ep(cx, ty + R * 0.36, rx * 0.97, R * 0.3, 14, 0.15, PI - 0.15), smooth(0.85, 1, k), lw * 0.7, 31);
  }
  function pictoRoue(cx, cy, R, k, lw) {
    grave(ep(cx, cy, R, R, 30, -PI / 2, PI * 1.5), smooth(0, 0.3, k), lw * 1.1, 41);
    grave(ep(cx, cy, R * 0.82, R * 0.82, 26, PI / 2, PI * 2.5), smooth(0.3, 0.5, k), lw * 0.7, 42);
    grave(ep(cx, cy, R * 0.18, R * 0.18, 12, 0, TAU), smooth(0.5, 0.58, k), lw * 0.9, 43);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; grave([[cx + Math.cos(a) * R * 0.18, cy + Math.sin(a) * R * 0.18], [cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82]], smooth(0.58 + i * 0.05, 0.63 + i * 0.05, k), lw * 0.8, 50 + i); }
  }
  PEJ.pictos = function (cx, cy, R, k, lw) {                                    // pain à gauche, roue à droite (écran, affiche) : R = rayon d'un pictogramme
    pictoPain(cx - R * 1.25, cy, R, smooth(0, 0.5, k), lw || 3); pictoRoue(cx + R * 1.25, cy, R, smooth(0.5, 1, k), lw || 3);
  };

  // ---- pain rond romain (panis quadratus) : origine = centre ; o.croque 0..1 (deux morsures), o.taille (1 = 112 de large)
  const PAIN = { croute: '#b8803e', crouteD: '#8a5a28', crouteL: '#dcae68', mie: '#efdfb6' };
  function painPts(k) {
    const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, s = Math.sin(a); pts.push([56 * Math.cos(a), (s < 0 ? 46 : 30) * s]); }
    const bites = [[44, -30, 24 * smooth(0, 0.5, k)], [16, -46, 22 * smooth(0.5, 1, k)]];
    for (const [bx, by, br] of bites) if (br > 1) for (const p of pts) { const dx = p[0] - bx, dy = p[1] - by, d = Math.hypot(dx, dy); if (d < br) { p[0] = bx + dx / (d || 1) * br * 0.98 - (d < 1 ? br : 0); p[1] = by + dy / (d || 1) * br * 0.98; } }
    return { pts, bites };
  }
  function drawPain(o) {
    const c = cx_(), ta = o.taille || 1, k = clamp(o.croque || 0), { pts, bites } = painPts(k);
    c.save(); c.scale(ta, ta);
    pc(pts, PAIN.croute, () => {
      fillPts(ep(0, -14, 46, 24, 20, 0, TAU), PAIN.crouteL);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; strokePts([[Math.cos(a) * 4, -14 + Math.sin(a) * 2], [Math.cos(a) * 44, -14 + Math.sin(a) * 23]], 'rgba(90,50,20,0.75)', 2.2); strokePts([[Math.cos(a) * 6 + 1.5, -13 + Math.sin(a) * 3], [Math.cos(a) * 42 + 1.5, -12 + Math.sin(a) * 22]], 'rgba(255,230,180,0.35)', 1); }
      strokePts(ep(0, 8, 55, 18, 20, 0.05, PI - 0.05), 'rgba(80,45,18,0.8)', 2.6);              // ficelle de cuisson
      strokePts(ep(0, 5, 55, 18, 20, 0.1, PI - 0.1), 'rgba(250,225,175,0.4)', 1.1);
      hatch([[-56, 0], [56, 0], [56, 40], [-56, 40]], 0.5, 3.6, 0.22);
      for (const [bx, by, br] of bites) if (br > 1) { strokePts(ep(bx, by, br + 4, br + 4, 18, 0, TAU), PAIN.mie, 8); for (let i = 0; i < 6; i++) dot(bx + Math.cos(i * 1.1) * (br + 4), by + Math.sin(i * 1.1) * (br + 4), 1.3, 'rgba(160,120,60,0.6)'); }
      shade(-30, -40, 30, 30, 0.3, [-60, -50, 60, 40]);
    }, 9101);
    c.restore();
  }
  OBJ.pain = { draw: drawPain, grip: (o) => { const ta = o.taille || 1; return [-10 * ta, 24 * ta]; }, pts: { centre: [0, 0] }, base: [0, 30], baseF: (o) => [0, 30 * (o.taille || 1)] };

  // ---- sac de blé (toile écrue, col noué, épis dorés) : origine = milieu du fond ; o.couche (couché, dessus plat à y −80) ; o.epis (true) ; o.t
  const SAC = { toile: '#d6c6a0', toileD: '#b3a27c', corde: '#5a3a22', epi: '#d4ad52', epiD: '#9a7a30' };
  function epis(x0, y0, ang, n, len, t, seed) {
    for (let i = 0; i < n; i++) {
      const a = ang + (i - (n - 1) / 2) * 0.2 + 0.05 * Math.sin(t * 2 + i * 1.7), L = len * (0.8 + 0.3 * hash(i + seed)), ex = x0 + Math.sin(a) * L, ey = y0 - Math.cos(a) * L;
      strokePts([[x0 + (i - n / 2) * 2, y0], [ex, ey]], SAC.epiD, 2.2);
      const g = []; for (let j = 0; j < 6; j++) { const u = 0.55 + j * 0.08; g.push([x0 + Math.sin(a) * L * u, y0 - Math.cos(a) * L * u]); }
      for (const [j, [gx, gy]] of g.entries()) for (const sd of [-1, 1]) pc(ell(gx + Math.cos(a) * sd * 4, gy + Math.sin(a) * sd * 4, 3.4, 5.6, 8).map((p) => { const dx = p[0] - gx, dy = p[1] - gy; return [gx + dx * Math.cos(a) - dy * Math.sin(a), gy + dx * Math.sin(a) + dy * Math.cos(a)]; }), j % 2 ? SAC.epi : '#e2bf68', null, 9200 + i * 10 + j, { drop: false });
      strokePts([[ex, ey], [ex + Math.sin(a) * 14, ey - Math.cos(a) * 14]], 'rgba(160,130,60,0.8)', 1);
    }
  }
  function drawSac(o) {
    const t = o.t || 0;
    if (o.couche) {
      pc([[-84, -6], [-86, -44], [-76, -74], [-40, -82], [20, -82], [56, -76], [76, -56], [88, -46], [90, -30], [78, -16], [70, -2], [40, 0, 1], [-70, 0, 1]], SAC.toile, () => {
        for (const x of [-60, -30, 0, 30]) strokePts([[x, -80], [x + 8, -40], [x, -2]], 'rgba(120,100,70,0.35)', 1.2);
        fillPts(box(-40, -60, -6, -30), 'rgba(160,140,100,0.35)'); strokePts(box(-40, -60, -6, -30).concat([[-40, -60]]), 'rgba(110,90,60,0.5)', 1);
        hatch(null, 0.9, 4, 0.2); shade(0, -80, 0, 0, 0.32, [-90, -90, 95, 5]);
      }, 9301);
      pc(rrect(80, -50, 94, -26, 4), SAC.corde, null, 9302);
      if (o.epis !== false) epis(96, -38, 1.35, 6, 62, t, 9303);
      return;
    }
    if (o.epis !== false) epis(0, -142, 0, 7, 70, t, 9310);
    pc([[-50, -4], [-58, -40], [-60, -80], [-50, -112], [-24, -130], [-14, -138], [-24, -150], [-10, -156], [0, -150], [10, -156], [24, -150], [14, -138], [24, -130], [50, -112], [60, -80], [58, -40], [50, -4], [30, 0, 1], [-30, 0, 1]], SAC.toile, () => {
      for (const x of [-36, -14, 10, 32]) strokePts([[x * 0.4, -128], [x, -70], [x * 0.9, -4]], 'rgba(120,100,70,0.35)', 1.2);
      fillPts(box(10, -76, 40, -46), 'rgba(160,140,100,0.35)'); strokePts(box(10, -76, 40, -46).concat([[10, -76]]), 'rgba(110,90,60,0.5)', 1);
      for (let i = 0; i < 6; i++) strokePts([[12 + i * 5, -76], [12 + i * 5, -46]], 'rgba(110,90,60,0.25)', 0.8);
      hatch(null, 0.9, 4, 0.2); shade(-50, 0, 50, 0, 0.3, [-62, -160, 62, 5]);
    }, 9311);
    pc(rrect(-18, -142, 18, -130, 4), SAC.corde, () => strokePts([[-14, -136], [14, -136]], 'rgba(255,220,170,0.3)', 1), 9312);
    pc([[12, -136], [24, -112], [20, -110], [8, -132]], SAC.corde, null, 9313);
  }
  OBJ.sac = { draw: drawSac, grip: [44, -110], p2: () => [-44, -40], pts: { col: [0, -146], dessus: [0, -150] }, base: [0, 0] };

  // ---- tablette de cire à deux volets + stylet. o.face 0..1 (0 = tenue pour écrire, ×0,75 ; 1 = montrée au public, pleine taille),
  //      o.ouverte 0..1 (défaut = face), o.dessin 0..1 (pain puis roue gravés en ivoire). Origine = centre. Tenue par le bord gauche.
  const TAB = { w: 96, h: 128, gap: 6 };
  function tabGeo(o) {
    const fk = o.face === true ? 1 : clamp(o.face || 0), ouv = o.ouverte == null ? fk : (o.ouverte === true ? 1 : clamp(o.ouverte));
    const sc = lerp(0.75, 1, fk), wR = TAB.w * ouv, Wt = TAB.w + (wR > 2 ? TAB.gap + wR : 0), x0 = -Wt / 2;
    return { fk, ouv, sc, wR, Wt, x0 };
  }
  function vantail(x0, x1, y0, y1, seed, inner) {
    pc(rrect(x0, y0, x1, y1, 6), BOIS, () => {
      for (let y = y0 + 6; y < y1; y += 7) strokePts([[x0, y], [x1, y + 2]], 'rgba(60,35,15,0.25)', 1);
      strokePts([[x0 + 3, y0 + 4], [x1 - 3, y0 + 4]], 'rgba(255,220,170,0.35)', 1.2);
    }, seed);
    if (inner) pc(rrect(x0 + 9, y0 + 10, x1 - 9, y1 - 10, 3), CIRE, () => {
      fillPts([[x0 + 12, y0 + 12], [x1 - 30, y0 + 12], [x0 + 12, y0 + 50]], 'rgba(255,240,220,0.06)');
      hatch(null, 0.6, 4.6, 0.12, 1, '255,240,220');
    }, seed + 1, { drop: false });
    for (const [x, y] of [[x0 + 5, y0 + 5], [x1 - 5, y0 + 5], [x0 + 5, y1 - 5], [x1 - 5, y1 - 5]]) dot(x, y, 1.6, '#c9a870');
  }
  function drawTablette(o) {
    const c = cx_(), g = tabGeo(o), k = clamp(o.dessin || 0), H = TAB.h / 2;
    c.save(); c.scale(g.sc, g.sc);
    const L0 = g.x0, L1 = g.x0 + TAB.w;
    vantail(L0, L1, -H, H, 9401, true);
    if (g.wR > 2) {
      const R0 = L1 + TAB.gap, R1 = R0 + g.wR;
      vantail(R0, R1, -H, H, 9403, g.ouv > 0.6);
      for (const y of [-H * 0.55, H * 0.55]) pc(rrect(L1 - 6, y - 7, R0 + 6, y + 7, 3), CUIR, () => strokePts([[L1 - 4, y - 3], [R0 + 4, y - 3]], 'rgba(255,220,170,0.25)', 1), 9405 + y);
      if (g.ouv > 0.6) pictoRoue((R0 + R1) / 2, 0, 33, smooth(0.5, 1, k), 3.2);
      pictoPain((L0 + L1) / 2, 0, 33, smooth(0, 0.5, k), 3.2);
    } else {                                                                   // fermée : les deux dessins, petits, l'un sous l'autre
      pictoPain((L0 + L1) / 2, -H * 0.42, 22, smooth(0, 0.5, k), 2.6); pictoRoue((L0 + L1) / 2, H * 0.44, 22, smooth(0.5, 1, k), 2.6);
    }
    c.restore();
  }
  OBJ.tablette = { draw: drawTablette, fond: () => true,
    grip: (o) => { const g = tabGeo(o); return [(g.x0 + 4) * g.sc, lerp(0, TAB.h * 0.22, g.fk) * g.sc]; },
    pts: { centre: [0, 0] }, ptsF: (o) => { const g = tabGeo(o), cL = (g.x0 + TAB.w / 2) * g.sc; return { centre: [0, 0], pain: [cL, 0], roue: [(g.x0 + TAB.w + TAB.gap + g.wR / 2) * g.sc, 0], bord: [(g.x0 + 4) * g.sc, 0], haut: [0, -TAB.h / 2 * g.sc] }; },
    base: [0, TAB.h / 2], baseF: (o) => [0, TAB.h / 2 * tabGeo(o).sc] };
  function drawStylet() {
    pc([[-3, -36], [3, -36], [4, 30], [0, 44, 1], [-4, 30]], '#b08d45', () => strokePts([[-1, -34], [-1, 30]], 'rgba(255,240,190,0.5)', 1), 9411);
    pc([[-8, -46], [8, -46], [5, -34], [-5, -34]], '#8e6f34', null, 9412);
  }
  OBJ.stylet = { draw: drawStylet, grip: [0, 0], pts: { pointe: [0, 44] }, base: [0, 44] };
  // ---- rouleau scellé (décret de l'empereur) : origine = centre ; sceau de cire rouge sans signe
  function drawRouleau() {
    pc(rrect(-13, -58, 13, 58, 5), '#e9dfc4', () => { for (const y of [-40, -10, 20, 46]) strokePts([[-13, y], [13, y + 3]], 'rgba(140,120,80,0.35)', 1); shade(-13, 0, 13, 0, 0.3, [-14, -60, 14, 60]); }, 9421);
    for (const y of [-62, 62]) pc(rrect(-8, y - 6, 8, y + 6, 3), BOISD, null, 9422 + y);
    pc([[12, -4], [22, 26], [16, 28], [10, 6]], ROUGE, null, 9424); pc([[14, -4], [6, 28], [0, 26], [8, 2]], '#6e2420', null, 9425);
    pc(ell(14, -4, 11, 11, 14), '#9e2b25', () => { strokePts(ep(14, -4, 6, 6, 12, 0, TAU), 'rgba(60,10,8,0.6)', 1.4); dot(11, -7, 2.4, 'rgba(255,200,180,0.4)'); }, 9426);
  }
  OBJ.rouleau = { draw: drawRouleau, grip: [0, 22], pts: { sceau: [14, -4], haut: [0, -66] }, base: [0, 66] };
  // ---- jeton de vote (disque de bronze nu) : origine = centre
  function drawJeton() { pc(ell(0, 0, 15, 15, 16), '#a07a42', () => { strokePts(ep(0, 0, 10, 10, 14, 0, TAU), 'rgba(60,40,15,0.55)', 1.4); dot(-3, -3, 2.4, 'rgba(255,230,170,0.5)'); }, 9431); }
  OBJ.jeton = { draw: drawJeton, grip: [-16, 6], pts: { centre: [0, 0] }, base: [0, 11] };
  // ---- pot de pop-corn rayé rouge et ivoire, sans texte : origine = milieu du fond ; o.grain 0..1 (un grain saute en arc ; true = en boucle selon o.t)
  function drawPop(o) {
    const t = o.t || 0, Hh = 124, wb = 36, wt = 50, R = M.rng(77);
    pc([[-wb, 0, 1], [wb, 0, 1], [wt, -Hh, 1], [-wt, -Hh, 1]], '#efe6d0', () => {
      for (let i = 0; i < 8; i++) { if (i % 2) continue; const u0 = i / 8, u1 = (i + 1) / 8; fillPts([[lerp(-wb, wb, u0), 2], [lerp(-wb, wb, u1), 2], [lerp(-wt, wt, u1), -Hh - 2], [lerp(-wt, wt, u0), -Hh - 2]], '#a8382f'); }
      fillPts(box(-60, -Hh, 60, -Hh + 12), 'rgba(250,245,232,0.9)'); strokePts([[-wt, -Hh + 12], [wt, -Hh + 12]], 'rgba(120,60,50,0.5)', 1.2);
      hatch([[-wb, 0], [-10, 0], [-14, -Hh], [-wt, -Hh]], 0.9, 3.8, 0.22); shade(-wt, 0, wt, 0, 0.32, [-60, -Hh - 4, 60, 4]);
    }, 9441);
    const tas = []; for (const [row, n, w0, h0] of [[0, 9, wt - 4, 6], [1, 7, wt - 16, 20], [2, 5, wt - 28, 33], [3, 3, wt - 38, 44]]) for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0.5; tas.push([lerp(-w0, w0, u) + (R() - 0.5) * 6, -Hh - h0 - Math.sin(u * PI) * 8 - R() * 5]); }
    for (const [i, [x, y]] of tas.entries()) pc(bosses(x, y, 10 + R() * 3, 8 + R() * 2, 4, 0.4, 9450 + i), i % 3 ? '#f6efd8' : '#f1e4bc', () => { dot(x + 2, y + 2, 2.6, 'rgba(214,170,70,0.75)'); dot(x - 3, y - 2, 1.4, 'rgba(160,120,60,0.5)'); }, 9450 + i);
    const gr = o.grain === true ? ((t * 0.55) % 1) : (o.grain == null ? -1 : clamp(o.grain));
    if (gr > 0 && gr < 1) { const gx = 12 + 70 * gr, gy = -Hh - 30 - 150 * 4 * gr * (1 - gr) + 60 * gr * gr; const c = cx_(); c.save(); c.translate(gx, gy); c.rotate(gr * 7); pc(bosses(0, 0, 9, 8, 4, 0.35, 9470), '#f6efd8', () => dot(2, 2, 2.4, 'rgba(214,170,70,0.75)'), 9470); c.restore(); }
  }
  OBJ.pop = { draw: drawPop, grip: [0, -58], pts: { bouche: [0, -130] }, base: [0, 0] };
  if (M.grv && M.grv.OBJ) M.grv.OBJ.pejPop = { draw: drawPop, grip: [0, -58], pts: { bouche: [0, -130] }, base: [0, 0] };   // Léa (GRV.lea) : tenu:'pejPop'

  // point nommé de l'objet tenu (écran) ; PEJ.pt(r, 'nom', arriere)
  PEJ.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, pts = ob.ptsF ? ob.ptsF(oo) : ob.pts, q = pts[nom]; if (!q) return null;
    const g = gripOf(ob, oo), part = arriere ? 'objetB' : (fondOf(name, { tenuO: oo, t: oo.t }) ? 'objetFond' : 'objet');
    return r.w(part, q[0] - g[0], q[1] - g[1]);
  };
  // accessoires seuls (sans tige) : (x,y) = base de l'objet (fond du pot, dessous du pain, bas de la tablette…)
  function accB(name, x, y, s, o) {
    const ob = OBJ[name];
    return accRaw('pej_' + name, (oo) => { const b = ob.baseF ? ob.baseF(oo) : ob.base, c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(Object.assign({ t: 0 }, oo)); c.restore(); }, x, y, s == null ? 0.9 : s, o);
  }
  for (const n of ['pain', 'sac', 'tablette', 'stylet', 'rouleau', 'jeton', 'pop']) PEJ[n] = (x, y, s, o) => accB(n, x, y, s, o);
  PEJ.SAC = { haut: 156, hautCouche: 80, long: 180 };

  // ---- QUADRIGE : 4 chevaux au galop, char à deux roues, cocher penché, poussière en volutes. (x,y) = sol sous la roue ; regarde vers +x.
  //      o.couleur 'rouge'|'bleu' ; o.t (galop) ou o.phase ; o.petit (version lointaine, s défaut 0,36 ≈ 128 px) ; o.poussiere 0..1 (1) ; o.dir
  const CHEV = [['#4a3a30', '#2e241e'], ['#9a948a', '#6e6a62'], ['#7a4a2a', '#4e2e1a'], ['#a0603a', '#6e3e22']];
  function jambe(x, y, a1, a2, L1, L2, w, col, seed) {
    const K = [x + Math.sin(-a1) * L1, y + Math.cos(a1) * L1], a = a1 + a2, F = [K[0] + Math.sin(-a) * L2, K[1] + Math.cos(a) * L2];
    pc(ribbon([[x, y], K], (u) => lerp(w * 1.7, w, u)), col, null, seed, { drop: false });
    pc(ribbon([K, F], (u) => lerp(w * 0.85, w * 0.6, u)), col, null, seed + 1, { drop: false });
    pc(ell(F[0] + w * 0.3, F[1] + 2, w * 0.62, w * 0.45, 8), '#2a2420', null, seed + 2, { drop: false });
  }
  const HORSE = [[110, -160], [118, -176], [160, -184], [226, -190], [246, -222], [268, -250], [282, -256], [298, -244], [312, -226], [320, -212], [314, -203], [300, -204], [286, -214], [272, -204], [264, -174], [270, -142], [258, -118], [220, -111], [170, -114], [130, -122], [112, -140]];
  // galop : angles (cuisse, canon) des 4 jambes selon la phase ; 'fd' 'fn' = devant loin / près, 'hd' 'hn' = derrière
  function galop(ph) {
    const s = (o) => Math.sin(ph * TAU + o), m = (o) => Math.max(0, Math.sin(ph * TAU + o));
    return { fd: [-0.65 * s(0.4) - 0.1, -1.1 * m(1.6)], fn: [-0.65 * s(0.9) - 0.1, -1.1 * m(2.1)], hd: [0.55 * s(2.6) + 0.2, 0.9 * m(3.6)], hn: [0.55 * s(3.1) + 0.2, 0.9 * m(4.1)] };
  }
  function cheval(dx, dy, ph, cols, plume, seed, petit, pres) {
    const c = cx_(); c.save(); c.translate(dx, dy);
    const [col, colD] = cols, b = Math.sin(ph * TAU * 2) * 2.5, G = galop(ph), sombre = pres ? colD : '#2e2620';
    c.translate(0, b);
    // jambes côté lointain (sombres), derrière le corps
    jambe(248, -126, G.fd[0], G.fd[1], 54, 62, 8, sombre, seed + 10);
    jambe(134, -130, G.hd[0], G.hd[1], 56, 62, 9, sombre, seed + 20);
    // queue au vent
    pc([[114, -170], [92, -166 + 4 * Math.sin(ph * TAU)], [70, -152 + 8 * Math.sin(ph * TAU + 1)], [78, -146], [96, -148], [112, -152]], '#2a2018', () => hatch(null, 0.2, 3, 0.25), seed + 1);
    pc(HORSE, col, () => {
      if (!petit) { hatch([[110, -150], [270, -150], [262, -112], [118, -112]], 0.6, 3.8, 0.25); strokePts([[170, -176], [222, -180]], 'rgba(255,240,220,0.2)', 2.4); }
      dot(296, -236, 2.6, '#111'); dot(297, -237, 0.9, 'rgba(255,255,255,0.7)'); strokePts([[316, -208], [308, -206]], 'rgba(10,8,6,0.7)', 1.4);
      strokePts([[252, -190], [242, -150], [252, -120]], plume, 5);                                                    // collier aux couleurs de la faction
      strokePts([[284, -248], [300, -226], [318, -212]], '#3a2a1e', 2.2); strokePts([[300, -228], [292, -214]], '#3a2a1e', 2);   // bride
      shade(200, -190, 200, -112, 0.3, [100, -260, 330, -100]);
    }, seed + 2);
    pc([[226, -192], [244, -226], [264, -254], [276, -258], [262, -232], [248, -206], [234, -186]], '#2a2018', () => hatch(null, 1.2, 3, 0.3), seed + 3);   // crinière
    pc([[272, -256], [266, -282], [278, -288], [282, -262]], plume, null, seed + 4);                                   // plumet
    pc([[278, -252], [284, -268], [290, -252]], colD, null, seed + 5);                                                  // oreille
    if (pres) {                                                                                                         // jambes côté proche (un seul cheval : lisible)
      jambe(254, -128, G.fn[0], G.fn[1], 54, 62, 9, col, seed + 30);
      jambe(140, -132, G.hn[0], G.hn[1], 56, 62, 10, col, seed + 40);
    }
    c.restore();
  }
  function drawQuadrige(o) {
    const t = o.t || 0, ph = o.phase != null ? o.phase : t * 2.4, fac = o.couleur === 'bleu' ? BLEU : ROUGE, facL = o.couleur === 'bleu' ? '#5f7d9c' : '#b0463c', petit = !!o.petit, c = cx_();
    // poussière derrière le char (volutes irrégulières, traîne vers l'arrière)
    const pk = o.poussiere == null ? 1 : clamp(o.poussiere);
    if (pk > 0) {
      volutes(t, { x: -40, y: -6, k: pk, n: petit ? 6 : 10, per: 1.1, haut: 70, vent: -230, r: 44, larg: 30, seed: 9501, col: '#e2d4b2', colD: '#b8a47e', a: 0.85 });
      volutes(t + 0.5, { x: 150, y: -4, k: pk * 0.7, n: petit ? 4 : 7, per: 0.9, haut: 40, vent: -160, r: 26, larg: 160, seed: 9502, col: '#e8dcc0', colD: '#bcaa86', a: 0.7 });
    }
    // chevaux : du plus lointain (plus haut, plus sombre) au plus proche
    for (let i = 0; i < 4; i++) cheval(-26 + i * 16, -15 + i * 5, ph + i * 0.11, CHEV[i], i % 2 ? facL : fac, 9510 + i * 60, petit, i === 3);
    // timon et rênes
    pc(ribbon([[40, -72], [130, -128], [160, -140]], 6), BOISD, null, 9800, { drop: false });
    // cocher penché en avant
    const cb = Math.sin(ph * TAU * 2) * 2;
    pc([[-18, -56], [-30, -120 + cb], [-26, -150 + cb], [-6, -176 + cb], [18, -178 + cb], [26, -156 + cb], [14, -130 + cb], [8, -96], [10, -56]], fac, () => { strokePts([[-26, -132 + cb], [16, -150 + cb]], '#3a2a1e', 4); strokePts([[-20, -112 + cb], [12, -128 + cb]], '#3a2a1e', 4); hatch(null, 0.8, 3.6, 0.25); }, 9801);
    pc([[16, -178 + cb], [26, -188 + cb], [40, -190 + cb], [50, -178 + cb], [48, -164 + cb], [38, -160 + cb], [28, -166 + cb]], '#d2a882', () => { dot(42, -180 + cb, 1.8, '#111'); }, 9802);
    pc([[18, -184 + cb], [26, -200 + cb], [44, -202 + cb], [52, -190 + cb], [40, -188 + cb], [24, -186 + cb]], facL, () => strokePts([[22, -190 + cb], [50, -192 + cb]], 'rgba(255,255,255,0.3)', 1.4), 9803);   // casque de cuir
    pc(ribbon([[16, -152 + cb], [52, -142 + cb], [84, -134 + cb]], 9), '#d2a882', null, 9804);
    if (!SIL()) { const cc = cx_(); cc.save(); cc.strokeStyle = 'rgba(40,25,15,0.8)'; cc.lineWidth = 1.4 * M._lw(); for (let i = 0; i < 3; i++) { cc.beginPath(); cc.moveTo(84, -134 + cb); cc.quadraticCurveTo(170, -150 + i * 6, 270 + i * 9, -200 + i * 4); cc.stroke(); } cc.beginPath(); cc.moveTo(-6, -150 + cb); cc.quadraticCurveTo(-40, -230, -10, -250 + 6 * Math.sin(ph * TAU)); cc.stroke(); cc.restore(); }
    // caisse du char (peinte à la couleur de la faction, bord doré) et roue
    pc([[-46, -54], [-44, -84], [-30, -104], [34, -110], [48, -96], [50, -56], [36, -44], [-34, -44]], fac, () => {
      strokePts([[-42, -86], [-28, -102], [34, -106], [46, -94]], OR, 3); strokePts([[-40, -60], [46, -60]], ORD, 2);
      if (!petit) for (let i = 0; i < 5; i++) dot(-24 + i * 14, -78, 2.6, OR);
      hatch(null, 0.7, 3.8, 0.25); shade(0, -110, 0, -44, 0.3, [-50, -115, 55, -40]);
    }, 9805);
    const wr = 46, wa = -ph * TAU * 0.9;
    pc(ell(0, -wr, wr, wr, 26), BOISD, () => {
      for (let i = 0; i < 6; i++) { const a = wa + i / 6 * TAU; strokePts([[Math.cos(a) * 8, -wr + Math.sin(a) * 8], [Math.cos(a) * (wr - 6), -wr + Math.sin(a) * (wr - 6)]], '#c8a06a', 4); }
      strokePts(ep(0, -wr, wr - 4, wr - 4, 26, 0, TAU), '#8a6a42', 4);
    }, 9806, { texA: 0.3 });
    pc(ell(0, -wr, 9, 9, 12), OR, () => dot(-2, -wr - 2, 2.4, 'rgba(255,240,200,0.6)'), 9807);
  }
  PEJ.quadrige = (x, y, s, o) => { o = o || {}; return accRaw('pej_quadrige', (oo) => drawQuadrige(oo), x, y, s == null ? (o.petit ? 0.36 : 0.95) : s, o); };
  PEJ.QUADRIGE = { long: 390, haut: 300, avant: 342, arriere: -48 };

  // ---- FAUTEUIL DE CINÉMA (praticable) : (x,y) = sol sous l'assise, o.dir = sens où regarde la personne assise (dossier derrière elle).
  //      Assise à y − 120·s ; à s 0,9 : 108 px au-dessus du sol. Velours rouge, accoudoir de bois, joue latérale sombre.
  function drawFauteuil(o) {
    const V = '#8a2a2e', VD = '#5e1c20', VL = '#a8423e';
    pc([[-70, -128], [-92, -316], [-84, -332], [-62, -338], [-44, -330], [-38, -312], [-34, -130]], V, () => {           // dossier
      for (const x of [-72, -58]) strokePts([[x - 4, -320], [x + 6, -136]], 'rgba(40,10,10,0.35)', 1.4);
      fillPts([[-90, -300], [-82, -330], [-70, -334], [-80, -300]], VL); hatch(null, 1.2, 4, 0.22); shade(-90, 0, -30, 0, 0.3, [-100, -340, -30, -120]);
    }, 9601);
    pc([[-76, -132], [-70, -150], [52, -146], [60, -130], [58, -110], [-70, -108]], V, () => { strokePts([[-66, -144], [54, -140]], 'rgba(255,200,190,0.25)', 1.4); hatch(null, 0.4, 4, 0.2); shade(0, -150, 0, -108, 0.35, [-80, -155, 65, -105]); }, 9602);   // assise
    pc([[-74, -108], [-60, -108], [-50, 0, 1], [-66, 0, 1]], '#2a2224', null, 9603);                                                   // pied
    pc([[30, -108], [44, -108], [50, 0, 1], [36, 0, 1]], '#2a2224', null, 9604);
    pc([[-66, -196], [44, -196], [52, -190], [50, -180], [-66, -180]], '#6b4526', () => strokePts([[-62, -193], [46, -193]], 'rgba(255,220,170,0.35)', 1.2), 9605);  // accoudoir
    pc([[-62, -180], [-48, -180], [-46, -130], [-60, -130]], VD, null, 9606);
  }
  PEJ.fauteuil = (x, y, s, o) => { o = o || {}; return accRaw('pej_fauteuil', (oo) => drawFauteuil(oo), x, y, s == null ? 0.9 : s, o); };
  PEJ.FAUTEUIL = { assise: 120 };                                               // local ; écran : y − 120·s
  PEJ.siege = (sFauteuil, sPerso) => 120 * (sFauteuil == null ? 0.9 : sFauteuil) / sPerso;   // valeur de `siege` pour un personnage d'échelle sPerso

  // angles de bras (repère du torse) pour amener la main sur T (aide pour GRV.lea et toute marionnette du kit à épaules standard)
  PEJ.bras = function (T, arm) { const s = ik2(arm === 'armB' ? SH_B : SH_F, T, 'bas'); return arm === 'armB' ? { armB_up: s.a, armB_lo: s.b } : { armF_up: s.a, armF_lo: s.b }; };

  // =====================================================================
  // MARIONNETTES — enveloppe : pose → gestes propres (avant) → gestes communs (marche, assis…) → (après) → objets tenus
  // PEJ.nom(pose, x, y, s, o) ; PEJ.nom.pose(p, x, y, s, dir) ; PEJ.nom.def()
  // =====================================================================
  function mkWrap2(chName, own, sDef) {
    const pose = (p, at) => { const q = prep(p); q._at = at || null; if (own) own(q, 'avant'); gestes(q); if (own) own(q, 'apres'); return finish(q); };
    const f = (p, x, y, s, o) => { s = s == null ? sDef : s; return run(CH[chName], pose(p, { x, y, s, dir: (o && o.dir) || 1 }), x, y, s, o); };
    f.pose = (p, x, y, s, dir) => pose(p, x == null ? null : { x, y, s: s == null ? sDef : s, dir: dir || 1 });
    f.def = () => CH[chName];
    return f;
  }
  // cible écran → repère du torse (après les gestes communs) ; null sans cible
  const cibleT = (q, C) => { if (!C || !q._at) return null; const a = q._at; return toTorso(q, [(C[0] - a.x) / (a.s * a.dir), (C[1] - a.y) / a.s]); };
  const humeur = (q, f) => { for (const k in f) if (!q.face[k]) q.face[k] = f[k]; };
  const bras = (base, skin, seed, sleeveTo, back) => ({ parent: 'torso', at: back ? SH_B : SH_F, pts: armR(LA, 13.5), base: skin, seed, paint: () => {
    if (sleeveTo) fillPts([[-20, -20, 1], [20, -20, 1], [20, sleeveTo, 1], [-20, sleeveTo + 6, 1]], base);
    if (sleeveTo) strokePts([[-14, sleeveTo + 2], [14, sleeveTo - 2]], 'rgba(30,20,10,0.35)', 1.2);
    hatch(back ? null : [[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, back ? 0.3 : 0.22);
  } });
  const sandales = (col) => (back) => { for (const y of [88, 100]) strokePts([[-14, y], [14, y - 6]], col || '#6b4526', 2.4); };
  const plis = (x0, x1, y0, y1, n, col) => { for (let i = 0; i < n; i++) { const x = lerp(x0, x1, (i + 0.5) / n); strokePts([[x, y0], [x + 3 * Math.sin(i * 1.7), (y0 + y1) / 2], [x - 2, y1]], col || 'rgba(30,20,10,0.32)', 1.3); } };

  // ---------------------------------------------------------------- JUVÉNAL (vers 100) : grand, maigre, nez aquilin, toge ivoire sur tunique bleu nuit
  const JU = { peau: '#d8b18a', peauD: '#b88f6a', tunique: '#2E3A55', tuniqueD: '#252f45', toge: IVO, togeD: IVOD, cheveux: '#a9a59c' };
  const JUV_HEAD = [[-12, 16], [8, 16], [9, 4], [14, -3], [22, -7], [25, -13], [24, -19], [27, -23], [25, -28], [29, -33], [37, -36, 1], [36, -44], [33, -52], [30, -58], [28, -63], [30, -68], [27, -80], [17, -93], [0, -100], [-18, -96], [-30, -82], [-34, -62], [-32, -40], [-24, -20], [-16, -6]];
  CH.pejJuvenal = body({
    seed: 7100, torso: torsoPts(0.88, 98, 0), coat: JU.tunique, sleeve: JU.peau, sleeveB: JU.peauD, skin: JU.peau, skinD: JU.peauD, roule: -40, cuff: JU.peau,
    thigh: JU.peau, thighB: JU.peauD, shin: JU.peau, shinB: JU.peauD, shoe: JU.peau, shoeB: JU.peauD, foot: 'sandale', head: JUV_HEAD, th: 0.86,
    shinPaint: sandales(), thighPaint: () => {},
    torsoPaint: () => { plis(-30, 30, 20, 98, 5, 'rgba(10,15,30,0.5)'); hatch([[-46, -170], [-12, -170], [-10, 100], [-46, 100]], 0.75, 4.2, 0.3, 1.05, '200,210,230'); shade(36, 0, -36, 0, 0.3); },
    headPaint: (p) => {
      const f = p.face || {};
      fillPts([[-6, -101], [-22, -97], [-34, -84], [-38, -62], [-35, -40], [-27, -34], [-22, -46], [-16, -62], [-12, -78], [-4, -90], [6, -97]], JU.cheveux, 3);   // cheveux gris courts, front dégarni
      for (let i = 0; i < 7; i++) strokePts([[-30 + i * 4, -88 + i * 2], [-24 + i * 4, -70 + i * 3]], 'rgba(90,88,82,0.6)', 1);
      X.earPaint(-8, -46);
      fillPts([[2, -40], [16, -36], [20, -18], [6, -14], [-4, -26]], 'rgba(120,80,60,0.22)');                         // joue creuse
      strokePts([[26, -34], [20, -28], [20, -20]], 'rgba(110,70,50,0.55)', 1.2);                                     // pli du nez
      hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
      X.eye(f, 18, -55);
      const by = f.brow === 'up' ? -66 : f.brow === 'frown' ? -60 : -63;                                           // sourcils broussailleux
      pc([[8, by + 2], [14, by - 3], [24, by - 4], [29, by - (f.brow === 'frown' ? -1 : 1)], [24, by + 1], [12, by + 3]], '#7d7a72', () => { for (let i = 0; i < 5; i++) strokePts([[10 + i * 4, by + 2], [13 + i * 4, by - 4]], 'rgba(40,38,34,0.8)', 1); }, 7180, { drop: false });
      if (f.mouth && f.mouth !== 'n') X.mouth(f, 26, -26);
      else { strokePts([[20, -24], [25, -25], [28, -28]], 'rgba(110,55,45,0.95)', 2); strokePts([[18, -22], [20, -24]], 'rgba(110,55,45,0.6)', 1.2); }   // sourire en coin
    },
    parts: {
      armF_up: bras(JU.tunique, JU.peau, 7110, 34), armB_up: bras(JU.toge, JU.peauD, 7107, 44, true),
      // toge ivoire drapée sur l'épaule : grand pan oblique de l'épaule au genou, bleu de la tunique visible au haut de la poitrine
      toge: { parent: 'torso', at: [0, 0], noRivet: true, base: JU.toge, seed: 7130, pts: [[-26, -178], [-8, -186], [8, -180], [12, -150], [16, -110], [22, -60], [27, -22], [22, 24], [4, 64], [-14, 92], [-40, 114, 1], [-44, 60], [-40, -40], [-38, -110], [-34, -156]],
        paint: () => {
          for (let i = 0; i < 6; i++) strokePts(qbez([-34 + i * 2, -150 + i * 30], [-6 + i * 3, -116 + i * 30], [20 - i * 4, -60 + i * 26], 10), 'rgba(120,105,75,0.55)', 1.6);   // plis obliques
          for (const x of [-34, -20, -6]) strokePts([[x, 30], [x + 3, 66], [x - 2, 100]], 'rgba(120,105,75,0.5)', 1.3);
          strokePts([[27, -22], [22, 24], [4, 64], [-14, 92], [-40, 114]], 'rgba(120,105,75,0.7)', 2);
          fillPts([[8, -180], [12, -150], [16, -110], [22, -60], [14, -60], [6, -120]], JU.togeD);
          hatch([[-46, -180], [-14, -180], [-10, 120], [-46, 120]], 0.75, 4.2, 0.26); shade(40, -60, -40, -60, 0.24, [-50, -190, 50, 125]);
        } },
      stylo: { parent: 'head', at: [0, 0], noRivet: true, base: '#b08d45', seed: 7140, pts: (p) => (p._oreille ? [[-22, -78], [-18, -80], [4, -38], [0, -36]] : OFFP) },
    },
    fronts: ['toge'], heads: ['stylo'],
  });
  PEJ.juvenal = mkWrap2('pejJuvenal', (q, ph) => {
    const A = q.ang, t = q.t || 0;
    if (ph === 'avant') {
      if (q.tenu == null) q.tenu = 'tablette'; if (q.tenuB == null) q.tenuB = 'stylet';
      q.tenuO = Object.assign({}, q.tenuO); q.tenuBO = Object.assign({}, q.tenuBO);
      const busy = q.ecrit || q.montre || q.surprise || q.ricane;
      if (!busy && q.ang.armF_up == null && !q.marche) { blend(q, 'armF_up', -0.22, 1); blend(q, 'armF_lo', -0.5, 1); }
      if (!busy && q.ang.armB_lo == null) blend(q, 'armB_lo', -0.2, 1);
      if (q.ecrit) { const k = ease(clamp(q.ecrit)); armTo(q, 'armF', [44, -96], 'bas', k); armTo(q, 'armB', [84 + 6 * Math.sin(t * 15), -100 + 4 * Math.cos(t * 11)], 'bas', k);
        A.objet = (A.objet || 0) - 0.3 * k; A.objetB = (A.objetB || 0) - 0.65 * k; add(q, 'head', 0.3 * k); q._brasPris = true; humeur(q, { eyes: k > 0.5 ? 'half' : undefined }); }
      if (q.ricane) { const k = ease(clamp(q.ricane)); add(q, 'head', (0.14 + 0.06 * Math.sin(t * 15)) * k); q.dy = (q.dy || 0) - Math.abs(Math.sin(t * 11)) * 5 * k;
        armTo(q, 'armF', [40, -58], 'bas', k); armTo(q, 'armB', [36, -100 - 4 * Math.abs(Math.sin(t * 11))], 'bas', k); q._brasPris = true; if (k > 0.3) humeur(q, { eyes: 'half', brow: 'up' }); }
      if (q.montre) { const k = ease(clamp(q.montre)); armTo(q, 'armF', [96, -206], 'bas', k); q.tenuO.face = Math.max(q.tenuO.face === true ? 1 : (q.tenuO.face || 0), k);
        armTo(q, 'armB', [44, -112], 'bas', k); add(q, 'head', -0.08 * k); q._brasPris = true; }
      if (q.surprise) { const k = ease(clamp(q.surprise)); q.tilt = (q.tilt || 0) - 0.07 * k; q.dx = (q.dx || 0) - 10 * k; q.dy = (q.dy || 0) - 5 * k; add(q, 'head', -0.12 * k);
        armTo(q, 'armF', [30, -50], 'bas', k); if (k > 0.3) { q.tenuB = 'rien'; q._oreille = true; q.handB = 'open'; humeur(q, { brow: 'up', eyes: 'wide', mouth: 'o' }); } q._brasPris = true; }
    } else {
      if (q.surprise) { const k = ease(clamp(q.surprise)); armTo(q, 'armB', headPt(q, 52, -22), 'bas', k); }
      if (q.assis && !q.ecrit && !q.montre && !q.surprise && !q.ricane) { const k = ease(clamp(q.assis)), kn = toTorso(q, [(q.pieds == null ? 84 : q.pieds) + 10, -150]);
        armTo(q, 'armF', [kn[0] - 20, kn[1] - 30], 'bas', k); armTo(q, 'armB', [kn[0] - 24, kn[1] + 6], 'bas', k); if (k > 0.5) q.handB = q.handB || 'open'; }
    }
  }, 0.95);

  // ---------------------------------------------------------------- LE BADAUD : petit, rond, ventre bombé, joues rouges, cheveux bruns bouclés, tunique courte ocre
  const BD = { peau: '#dcae88', peauD: '#bd8e68', tunique: '#B8893A', tuniqueD: '#94692a', corde: '#5a3a22', cheveux: '#4a301e' };
  const BAD_HEAD = [[-16, 16], [10, 16], [14, 6], [22, 0], [28, -6], [30, -14], [29, -20], [31, -25], [29, -30], [33, -34], [41, -40, 1], [39, -49], [31, -51], [31, -58], [32, -66], [30, -80], [20, -94], [2, -102], [-18, -99], [-32, -86], [-38, -66], [-37, -44], [-30, -24], [-22, -6]];
  CH.pejBadaud = body({
    seed: 7200, torso: torsoPts(1.14, 66, 20), coat: BD.tunique, sleeve: BD.peau, sleeveB: BD.peauD, skin: BD.peau, skinD: BD.peauD, roule: -40, cuff: BD.peau, th: 1.18,
    thigh: BD.peau, thighB: BD.peauD, shin: BD.peau, shinB: BD.peauD, shoe: BD.peau, shoeB: BD.peauD, foot: 'sandale', head: BAD_HEAD, shinPaint: sandales(),
    torsoPaint: () => {
      plis(-34, 40, -20, 66, 6, 'rgba(70,45,10,0.45)');
      fillPts([[-44, -44], [60, -44], [62, -26], [-44, -28]], BD.tuniqueD);
      strokePts([[-44, -36], [60, -36]], BD.corde, 5); strokePts([[-44, -38], [60, -38]], 'rgba(255,220,170,0.35)', 1.2);   // cordelette
      pc(ell(54, -36, 6, 5, 10), BD.corde, null, 7290, { drop: false }); strokePts([[54, -32], [58, -6]], BD.corde, 3); strokePts([[52, -32], [50, -10]], BD.corde, 3);
      hatch([[-50, -170], [-12, -170], [-10, 68], [-50, 68]], 0.75, 4.2, 0.3); shade(50, -40, -40, -40, 0.3);
    },
    headPaint: (p) => {
      face(p, { joue: 'rgba(205,80,65,0.42)', browCol: 'rgba(55,30,18,0.95)', browW: 2.6 });
      dot(16, -33, 12, 'rgba(210,90,75,0.25)'); strokePts([[16, -2], [26, -6]], 'rgba(120,70,50,0.4)', 1.2);       // joues rouges, double menton
    },
    parts: {
      armF_up: bras(BD.tunique, BD.peau, 7210, 30), armB_up: bras(BD.tunique, BD.peauD, 7207, 30, true),
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: BD.cheveux, seed: 7230, pts: boucle([[30, -78], [24, -94], [6, -106], [-16, -106], [-34, -94], [-43, -72], [-41, -48], [-31, -46], [-26, -60], [-14, -74], [4, -82], [22, -82]], 4.5, 7),
        paint: () => { for (let i = 0; i < 9; i++) strokePts(ep(-30 + i * 7, -90 + (i % 3) * 8, 4, 4, 6, 0, 4.5), 'rgba(255,210,170,0.25)', 1); hatch(null, 0.5, 3.4, 0.25); } },
    },
    heads: ['cheveux'],
  });
  // porter un sac de blé : 'bras' (serré devant le ventre) | 'epaule' (couché sur l'épaule, main avant au col)
  function porteSac(q, mode, k) {
    if (!k) return;
    if (mode === 'epaule') q._charge = { nom: 'sac', posT: [44, -238], ang: -1.5, dos: true, g1: [-50, -6], g2: null, o: { t: q.t || 0 } };
    else q._charge = { nom: 'sac', posT: [74, 36], ang: 0, g1: [50, -96], g2: [-40, -40], o: { t: q.t || 0 } };
    q._charge.libre = 1 - k; q._brasPris = true;
  }
  PEJ.badaud = mkWrap2('pejBadaud', (q, ph) => {
    const A = q.ang, t = q.t || 0;
    if (ph === 'avant') {
      if ((q.mange || q.trinque) && q.tenu == null) q.tenu = 'pain';
      if (q.lance != null && q.tenu == null) q.tenu = 'tablette';
      if (q.tenu === 'pain') q.tenuO = Object.assign({ taille: 0.82 }, q.tenuO);
      if (q.grimpe) { const k = clamp(q.grimpe); q.pointes = Math.max(q.pointes || 0, k); }
      if (q.porte) porteSac(q, q.porte === 'epaule' ? 'epaule' : 'bras', 1);
      if (q.joie) { const k = ease(clamp(q.joie)); blend(q, 'armF_up', -2.6, k); blend(q, 'armF_lo', -0.25, k); blend(q, 'armB_up', -2.25, k); blend(q, 'armB_lo', -0.3, k);
        add(q, 'head', -0.22 * k); q.dy = (q.dy || 0) - Math.abs(Math.sin(t * 7)) * 14 * k; if (k > 0.3) { q.handF = q.handF || 'open'; q.handB = 'open'; humeur(q, { mouth: 'o', brow: 'up', eyes: 'closed' }); } q._brasPris = true; }
      if (q.vexe) { const k = ease(clamp(q.vexe)); q.tilt = (q.tilt || 0) + 0.05 * k; q.dx = (q.dx || 0) + 8 * k; add(q, 'head', -0.06 * k);
        armTo(q, 'armF', [70, -150 + 6 * Math.sin(t * 9)], 'bas', k); armTo(q, 'armB', [58, -138 - 6 * Math.sin(t * 9)], 'bas', k); q.handF = 'fist'; q.handB = 'fist';
        if (k > 0.3) humeur(q, { brow: 'frown', mouth: 'tight' }); q._brasPris = true; }
    } else {
      if (q.vote) { const k = ease(clamp(q.vote)); if (q.tenuB == null || q.tenuB === 'rien') q.tenuB = 'jeton';
        const C = cibleT(q, q.cible); armTo(q, 'armB', C || [92, -40 + 12 * smooth(0.5, 1, clamp(q.vote))], 'bas', k); add(q, 'head', 0.2 * k); q._brasPris = true; }
      if (q.ventre) { const k = ease(clamp(q.ventre)); armTo(q, 'armF', [66 + 5 * Math.abs(Math.sin(t * 8)), -40], 'bas', k); if (k > 0.3 && !has(q.tenu)) q.handF = 'open';
        add(q, 'head', -0.2 * k); if (k > 0.3) humeur(q, { brow: 'up', mouth: 'smile' }); q._brasPris = true; }
      if (q.mange) { const k = ease(clamp(q.mange)), ta = (q.tenuO && q.tenuO.taille) || 0.82; armTo(q, 'armF', headPt(q, 27 + 50 * ta - 8 * ta, -27 + 24 * ta), 'bas', k);
        add(q, 'head', 0.04 * k); if (k > 0.5) humeur(q, { mouth: Math.sin(t * 9) > 0 ? 'o' : 'tight', eyes: 'half' }); q._brasPris = true; }
      if (q.trinque) { const k = ease(clamp(q.trinque)); armTo(q, 'armF', [80, -160], 'bas', k); add(q, 'head', -0.08 * k); if (k > 0.4) humeur(q, { mouth: 'smile', brow: 'up' }); q._brasPris = true; }
      if (q.lance != null) { const u = clamp(q.lance), P0 = [36, -20], P1 = [70, -150], P2 = [128, -214], T = qbez(P0, P1, P2, 10)[Math.round(u * 10)];
        armTo(q, 'armF', T, 'bas', 1); q.tilt = (q.tilt || 0) + 0.08 * Math.sin(PI * u); add(q, 'head', -0.12 * u); armTo(q, 'armB', [30, -60], 'bas', 1); q._brasPris = true; }
      if (q.grimpe) { const k = ease(clamp(q.grimpe)); add(q, 'head', -0.2 * k); q.dx = (q.dx || 0) + 6 * k; if (!q._brasPris) { armTo(q, 'armB', [46, -120], 'bas', k); q.handB = 'open'; } }
      if (q.assis && !q._brasPris && has(q.tenu)) { const k = ease(clamp(q.assis)); armTo(q, 'armF', [60, -40], 'bas', k); }
    }
  }, 0.86);

  // ---------------------------------------------------------------- L'EMPEREUR : glabre, frange peignée en avant, laurier vert-or, toge pourpre éteint sur tunique ivoire
  const EM = { peau: '#dcb28c', peauD: '#bd916c', tunique: IVO, tuniqueD: IVOD, toge: '#6B2E4A', togeD: '#55233a', togeL: '#83405e', cheveux: '#3a2a1e', laurier: '#7d8a3a', laurierD: '#5a6628' };
  const EMP_HEAD = [[-12, 16], [9, 16], [10, 4], [16, -2], [25, -7], [27, -14], [26, -20], [28, -24], [26, -29], [29, -33], [37, -38, 1], [34, -46], [31, -56], [29, -63], [30, -72], [27, -84], [16, -96], [-2, -101], [-20, -96], [-31, -82], [-34, -60], [-31, -38], [-23, -18], [-15, -4]];
  const LAUR = (() => {                                                         // couronne de laurier vue de profil : feuilles pointées vers l'arrière
    const A0 = [-2, 4], B0 = [60, -10], up = [], dn = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8, x = lerp(A0[0], B0[0], u), y = lerp(A0[1], B0[1], u) - Math.sin(u * PI) * 6;
      up.push([x, y - 4], [x - 9, y - 15]); dn.push([x, y + 4], [x - 9, y + 14]); }
    return up.concat([[B0[0] + 6, B0[1]]], dn.reverse(), [[A0[0] - 8, A0[1]]]);
  })();
  CH.pejEmpereur = body({
    seed: 7300, torso: torsoPts(1.02, 124, 4), coat: EM.tunique, sleeve: EM.peau, sleeveB: EM.peauD, skin: EM.peau, skinD: EM.peauD, roule: -40, cuff: EM.peau,
    thigh: EM.peau, thighB: EM.peauD, shin: EM.peau, shinB: EM.peauD, shoe: '#7a3a2a', shoeB: '#5e2c20', foot: 'soulier', head: EMP_HEAD,
    shinPaint: () => { fillPts([[-20, 70], [20, 70], [20, 130], [-20, 130]], '#7a3a2a'); for (const y of [76, 90]) strokePts([[-16, y], [16, y - 4]], '#4e2418', 2); },
    torsoPaint: () => { plis(-34, 34, 40, 124, 6, 'rgba(120,105,75,0.5)'); hatch([[-50, -170], [-12, -170], [-10, 126], [-50, 126]], 0.75, 4.2, 0.28); shade(40, 0, -40, 0, 0.26); },
    headPaint: (p) => {
      const f = p.face || {};
      fillPts([[-4, -103], [-22, -98], [-34, -84], [-37, -62], [-34, -46], [-26, -44], [-20, -56], [-14, -70], [0, -80], [14, -82], [24, -78], [29, -74], [24, -84], [27, -88], [18, -92], [20, -97], [8, -101]], EM.cheveux, 3);   // frange peignée en avant
      for (let i = 0; i < 8; i++) strokePts([[-26 + i * 6, -96 + i], [-14 + i * 6, -82 + i * 0.5]], 'rgba(200,170,130,0.3)', 1);
      X.earPaint(-8, -46);
      hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
      X.eye(f, 18, -54); X.brow(f, 18, -62, 'rgba(45,30,22,0.95)', 2.6); X.mouth(f, 26, -26);
      strokePts([[22, -10], [27, -8]], 'rgba(120,80,60,0.4)', 1.2);
    },
    parts: {
      armF_up: bras(EM.tunique, EM.peau, 7310, 34), armB_up: bras(EM.toge, EM.peauD, 7307, 60, true),
      toge: { parent: 'torso', at: [0, 0], noRivet: true, base: EM.toge, seed: 7330, pts: [[-28, -178], [-6, -186], [12, -178], [20, -150], [30, -96], [40, -30], [42, 40], [40, 92], [30, 100, 1], [-42, 112, 1], [-44, 50], [-40, -40], [-38, -110], [-36, -158]],
        paint: () => {
          for (let i = 0; i < 6; i++) strokePts(qbez([-32 + i * 2, -160 + i * 30], [10 + i * 4, -118 + i * 34], [40, -56 + i * 30], 10), 'rgba(30,8,18,0.55)', 1.6);
          strokePts([[12, -178], [20, -150], [30, -96], [40, -30], [42, 40], [40, 92]], OR, 3.4);                            // bordure dorée
          fillPts([[20, -150], [30, -96], [40, -30], [32, -30], [18, -110]], EM.togeL);
          hatch([[-46, -180], [-14, -180], [-10, 120], [-46, 120]], 0.75, 4.2, 0.3, 1.05, '230,200,220'); shade(40, -60, -40, -60, 0.26, [-50, -190, 50, 125]);
        } },
      fibule: { parent: 'torso', at: [0, 0], noRivet: true, base: OR, seed: 7340, pts: ell(-8, -168, 9, 9, 12), paint: () => { strokePts(ep(-8, -168, 5, 5, 10, 0, TAU), ORD, 1.4); dot(-10, -171, 2.2, 'rgba(255,245,200,0.7)'); } },
      laurier: { parent: 'head', at: [-28, -72], rest: 0, noRivet: true, base: EM.laurier, seed: 7350, pts: LAUR,
        paint: () => { strokePts(qbez([-2, 4], [30, -6], [60, -10], 12), OR, 1.6); for (let i = 0; i <= 8; i++) { const x = lerp(-2, 60, i / 8), y = lerp(4, -10, i / 8) - Math.sin(i / 8 * PI) * 6; strokePts([[x, y], [x - 7, y - 11]], 'rgba(220,190,90,0.65)', 1); strokePts([[x, y], [x - 7, y + 10]], 'rgba(220,190,90,0.5)', 1); } hatch(null, 0.4, 3.4, 0.2); } },
    },
    fronts: ['toge', 'fibule'], heads: ['laurier'],
  });
  PEJ.empereur = mkWrap2('pejEmpereur', (q, ph) => {
    const A = q.ang, t = q.t || 0;
    if (ph === 'avant') {
      if (q.decide && q.tenu == null) q.tenu = 'rouleau';
      if (q.lancePain != null && q.tenu == null) { q.tenu = 'pain'; q.tenuO = Object.assign({ taille: 0.55 }, q.tenuO); }
      if (q.altier !== false) { add(q, 'head', -0.09); q.tilt = (q.tilt || 0) - 0.015; }
      if (q.sursaute) { const k = ease(clamp(q.sursaute)); q.tilt = (q.tilt || 0) - 0.08 * k; q.dx = (q.dx || 0) - 10 * k; q.dy = (q.dy || 0) - 10 * Math.sin(PI * Math.min(1, clamp(q.sursaute) * 1.4));
        add(q, 'laurier', 0.42 * k); add(q, 'head', -0.06 * k); armTo(q, 'armF', [58, -116], 'bas', k); armTo(q, 'armB', [46, -108], 'bas', k);
        if (k > 0.3) { if (!has(q.tenu)) q.handF = 'open'; q.handB = 'open'; humeur(q, { brow: 'up', eyes: 'wide', mouth: 'o' }); } q._brasPris = true; }
    } else {
      if (q.decide) { const k = ease(clamp(q.decide)); armTo(q, 'armF', [86, -158], 'bas', k); add(q, 'head', -0.06 * k); q._brasPris = true; }
      if (q.lancePain != null) { const u = clamp(q.lancePain), T = qbez([40, -120], [110, -110], [126, -36], 10)[Math.round(u * 10)];
        armTo(q, 'armF', T, 'bas', 1); q.tilt = (q.tilt || 0) + 0.07 * Math.sin(PI * u); add(q, 'head', 0.16 * u); q._brasPris = true; }
      if (q.toise) { const k = ease(clamp(q.toise)), C = cibleT(q, q.cible); armTo(q, 'armF', C || [72, -4], 'bas', k); add(q, 'head', -0.16 * k); if (k > 0.5 && !has(q.tenu)) q.handF = 'open';
        if (k > 0.3) humeur(q, { eyes: 'half' }); q._brasPris = true; }
    }
  }, 0.94);
  PEJ.EMPEREUR = { balustrade: 185 };                                          // hauteur (px écran à s 0,8 au-dessus de ses pieds) de la main de `toise`

  // ---------------------------------------------------------------- FIGURANTS ROMAINS — tenue 'a' 'b' 'c' 'd'
  const FG = {
    a: { tunique: '#5E6B4A', tuniqueD: '#4a5638', peau: '#d2a47c', peauD: '#b3865f', bonnet: '#6b4a2e' },
    b: { tunique: '#4F6478', tuniqueD: '#3e5062', peau: '#dcb08a', peauD: '#bd916c', barbe: '#9c978e' },
    c: { tunique: '#8A2F2A', tuniqueD: '#6e2420', peau: '#c99a72', peauD: '#ad7f5a', cheveux: '#2a1e16', foulard: IVO },
    d: { tunique: '#C9A24A', tuniqueD: '#a5832f', peau: '#e2bc98', peauD: '#c49c78', palla: IVO, pallaD: IVOD, cheveux: '#3a2618' },
  };
  const FEM_HEAD = [[-12, 16], [8, 16], [10, 4], [15, -4], [22, -8], [25, -14], [24, -20], [26, -24], [25, -28], [28, -33], [33, -38, 1], [30, -46], [28, -56], [28, -64], [25, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  function robeD(p) {                                                          // stola de la femme (sans jambes) : debout ↔ assise (genoux en avant)
    const k = ease(clamp(p.assis || 0)), h = p.siege == null ? 100 : p.siege, sw = p.marche ? Math.sin((p.t || 0) * (p.cadence || 6)) * 5 : 0;
    const L = (a, b) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    return [[-14, -176], [8, -180], [16, -168], [26, -150], [34, -112], [36, -70], [38, -30], [40, 10],
      L([42, 60], [96, 4]), L([46, 120], [112, 24]), L([52, 190], [114, h - 40]), [...L([56 + sw, 236], [118, h - 2]), 1], [...L([-50 + sw, 236], [40, h - 2]), 1],
      L([-46, 170], [44, 40]), L([-42, 100], [-20, 30]), L([-40, 30], [-40, 20]), [-38, -60], [-37, -110], [-33, -150], [-26, -168]];
  }
  function mkFigurant(tn) {
    const F = FG[tn], sd = 7400 + 'abcd'.indexOf(tn) * 100;
    const o = {
      seed: sd, torso: tn === 'd' ? robeD : torsoPts(1, 70, tn === 'b' ? 8 : 2), coat: F.tunique, sleeve: F.peau, sleeveB: F.peauD, skin: F.peau, skinD: F.peauD, roule: -40, cuff: F.peau,
      thigh: F.peau, thighB: F.peauD, shin: F.peau, shinB: F.peauD, shoe: F.peau, shoeB: F.peauD, foot: 'sandale', shinPaint: sandales(),
      head: tn === 'd' ? FEM_HEAD : tn === 'b' ? X.NAP_HEAD : X.GR_HEAD,
      torsoPaint: (p) => {
        if (tn === 'd') { plis(-40, 40, 0, (p && p.assis) ? 60 : 230, 7, 'rgba(90,60,10,0.4)'); fillPts([[-40, -40], [40, -40], [40, -30], [-40, -30]], F.tuniqueD); }
        else { plis(-32, 32, -10, 70, 5, 'rgba(20,15,10,0.4)'); strokePts([[-42, -34], [44, -34]], '#4a3020', 4); }
        hatch([[-50, -170], [-12, -170], [-10, 240], [-50, 240]], 0.75, 4.2, 0.28); shade(40, 0, -40, 0, 0.28);
      },
      headPaint: (p) => {
        if (tn === 'b') { fillPts([[-34, -60], [-36, -40], [-26, -36], [-24, -52]], F.barbe); X.earPaint(-8, -44); }      // crâne chauve, couronne grise
        else X.earPaint(-8, -44);
        if (tn === 'c') fillPts([[30, -80], [26, -92], [12, -101], [-8, -104], [-28, -94], [-36, -74], [-34, -50], [-26, -46], [-22, -60], [-10, -74], [8, -82], [22, -84]], F.cheveux, 3);
        face(p, { joue: tn === 'd' ? 'rgba(210,120,110,0.25)' : 'rgba(190,100,80,0.2)', lip: tn === 'd' ? 'rgba(150,60,60,0.95)' : undefined, browW: tn === 'd' ? 1.8 : 2.4, browCol: tn === 'b' ? 'rgba(130,125,115,0.95)' : undefined });
        if (tn === 'b') strokePts([[-20, -88], [4, -96]], 'rgba(255,240,220,0.35)', 2);
      },
      parts: { armF_up: bras(F.tunique, F.peau, sd + 10, tn === 'd' ? 50 : 30), armB_up: bras(F.tunique, F.peauD, sd + 7, tn === 'd' ? 50 : 30, true) },
      heads: [], fronts: [],
    };
    if (tn === 'a') { o.parts.bonnet = { parent: 'head', at: [0, 0], noRivet: true, base: F.bonnet, seed: sd + 30, pts: [[30, -72], [30, -86], [22, -100], [4, -108], [-18, -106], [-34, -92], [-40, -74], [-38, -62], [30, -64]],
      paint: () => { fillPts([[-40, -74], [31, -78], [31, -64], [-38, -62]], '#57391f'); hatch(null, 0.5, 3.2, 0.25); dot(-4, -106, 4, '#57391f'); } }; o.heads.push('bonnet'); }
    if (tn === 'b') { o.parts.barbe = { parent: 'head', at: [0, 0], noRivet: true, base: F.barbe, seed: sd + 30, pts: boucle([[30, -36], [28, -18], [26, -4], [16, 8], [0, 10], [-14, 2], [-20, -20], [-12, -34], [6, -26], [18, -30]], 2.5, 5),
      paint: () => { strokePts([[28, -26], [20, -27]], 'rgba(110,55,45,0.9)', 1.8); hatch(null, 1.2, 2.8, 0.3); } }; o.heads.push('barbe'); }
    if (tn === 'c') { o.parts.foulard = { parent: 'torso', at: [0, 0], noRivet: true, base: F.foulard, seed: sd + 30, pts: [[-26, -186], [8, -192], [24, -176], [28, -160], [40, -126, 1], [30, -120], [22, -146], [-10, -152], [-28, -166]],
      paint: () => { pc(ell(24, -152, 7, 6, 10), IVOD, null, sd + 31, { drop: false }); for (const y of [-182, -172, -162]) strokePts([[-20, y], [20, y + 2]], 'rgba(120,105,75,0.45)', 1); hatch(null, 0.6, 3.4, 0.18); } }; o.fronts.push('foulard'); }
    if (tn === 'd') { o.parts.palla = { parent: 'head', at: [0, 0], noRivet: true, base: F.palla, seed: sd + 30, pts: [[24, -88], [12, -100], [-8, -106], [-28, -98], [-40, -78], [-44, -40], [-42, 0], [-34, 30], [-20, 34], [-22, 0], [-20, -40], [-10, -66], [8, -80], [26, -80]],
      paint: () => { for (const x of [-34, -26, -18]) strokePts([[x, -90], [x - 6, -30], [x - 2, 28]], 'rgba(120,105,75,0.45)', 1.2); fillPts([[24, -86], [14, -78], [6, -78], [20, -90]], F.cheveux); hatch(null, 0.6, 3.4, 0.2); } }; o.heads.push('palla'); }
    const def = body(o);
    if (tn === 'd') { for (const k of ['legB', 'legB_lo', 'footB', 'legF', 'legF_lo', 'footF']) delete def.parts[k]; def.order = def.order.filter((n) => !/^(leg|foot)/.test(n));
      def.parts.pieds = { parent: 'torso', at: [0, 0], noRivet: true, base: '#6b4526', seed: sd + 40, pts: (p) => { const k = ease(clamp(p.assis || 0)), h = p.siege == null ? 100 : p.siege, y = lerp(236, h - 2, k), x = lerp(46, 116, k); return [[x - 4, y - 8], [x + 14, y - 8], [x + 26, y - 1], [x + 26, y + 2, 1], [x - 4, y + 2, 1]]; } };
      def.order.splice(def.order.indexOf('torso'), 0, 'pieds'); }
    return def;
  }
  for (const tn of ['a', 'b', 'c', 'd']) CH['pejFigurant' + tn.toUpperCase()] = mkFigurant(tn);
  const figOwn = (q, ph) => {
    const t = q.t || 0;
    if (ph === 'avant') {
      if (q.porte) porteSac(q, q.porte === 'epaule' ? 'epaule' : 'bras', 1);
      const j = Math.max(q.joie || 0, q.saute || 0);
      if (j) { const k = ease(clamp(j)); blend(q, 'armF_up', -2.55, k); blend(q, 'armF_lo', -0.3, k); blend(q, 'armB_up', -2.2, k); blend(q, 'armB_lo', -0.3, k); add(q, 'head', -0.2 * k);
        q.dy = (q.dy || 0) - Math.abs(Math.sin(t * 7)) * (q.saute ? 26 : 10) * k; if (k > 0.3) { q.handF = 'open'; q.handB = 'open'; humeur(q, { mouth: 'o', brow: 'up' }); } q._brasPris = true; }
    } else {
      if (q.applaudit) { const k = ease(clamp(q.applaudit)), cl = Math.abs(Math.sin(t * 8)); armTo(q, 'armF', [58 + 14 * cl, -112], 'bas', k); armTo(q, 'armB', [56, -108], 'bas', k);
        if (k > 0.3) { q.handF = 'open'; q.handB = 'open'; humeur(q, { mouth: 'smile' }); } q._brasPris = true; }
      if (q.attrape) { const k = ease(clamp(q.attrape)); armTo(q, 'armF', [76, -72], 'bas', k); armTo(q, 'armB', [64, -66], 'bas', k); add(q, 'head', 0.14 * k);
        if (k > 0.3) { q.handF = 'cup'; q.handB = 'cup'; humeur(q, { brow: 'up', mouth: 'o' }); } q._brasPris = true; }
    }
  };
  const figW = { a: mkWrap2('pejFigurantA', figOwn, 0.8), b: mkWrap2('pejFigurantB', figOwn, 0.8), c: mkWrap2('pejFigurantC', figOwn, 0.8), d: mkWrap2('pejFigurantD', figOwn, 0.8) };
  PEJ.figurant = (pose, x, y, s, o) => figW[(pose && pose.tenue) || 'a'](pose, x, y, s, o);
  PEJ.figurant.pose = (p, x, y, s, dir) => figW[(p && p.tenue) || 'a'].pose(p, x, y, s, dir);
  PEJ.figurant.def = (p) => CH['pejFigurant' + (((p && p.tenue) || 'a').toUpperCase())];

  // =====================================================================
  // DÉCORS — pré-rendus dans PEJ.init(), posés par PEJ.cinema / PEJ.forum / PEJ.cirque (+ couches « Avant » après les marionnettes)
  // =====================================================================
  function degrade(c, w, h, stops, y0) { const g = c.createLinearGradient(0, y0 || 0, 0, h); for (const [u, col] of stops) g.addColorStop(u, col); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  function speckle(c, x0, y0, w, h, n, seed, col) { const R = M.rng(seed); for (let i = 0; i < n; i++) { c.fillStyle = col.replace('A', (0.02 + R() * 0.035).toFixed(3)); c.beginPath(); c.ellipse(x0 + R() * w, y0 + R() * h, 10 + R() * 50, 6 + R() * 30, R() * 3, 0, TAU); c.fill(); } }
  function makeProp(w, h, fn) { const cv = M.cutFlat(w, h, w / 2, h - 10, fn); cv.padB = 10; return M.withShadow(cv, 8); }
  const glow = (x, y, r, col, a) => { if (SIL()) return; const c = cx_(), g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); };
  function colonne(x, yb, yt, w, col, colD, seed) {                             // colonne cannelée : base, fût, chapiteau
    pcv(box(x - w * 0.7, yb - 16, x + w * 0.7, yb), colD, null, seed);
    pcv([[x - w / 2, yb - 16], [x - w * 0.44, yt + 16], [x + w * 0.44, yt + 16], [x + w / 2, yb - 16]], col, () => { for (let i = 1; i < 5; i++) strokePts([[x - w / 2 + i * w / 5, yb - 18], [x - w * 0.44 + i * w * 0.88 / 5, yt + 18]], 'rgba(80,60,40,0.35)', 1.2); shade(x - w / 2, 0, x + w / 2, 0, 0.3, [x - w, yt, x + w, yb]); }, seed + 1);
    pcv(box(x - w * 0.75, yt, x + w * 0.75, yt + 16), colD, () => strokePts([[x - w * 0.7, yt + 8], [x + w * 0.7, yt + 8]], 'rgba(255,240,210,0.3)', 1.2), seed + 2);
  }
  function fanion(x, y, w, h, col, t, ph, seed) {                              // fanion en queue d'aronde qui flotte (hampe à gauche), sans signe
    const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x + u * w, y + Math.sin(t * 4.2 + u * 5 + ph) * 8 * u]); }
    pts.push([x + w * 0.78, y + h * 0.5 + Math.sin(t * 4.2 + 4 + ph) * 8]);
    for (let i = 10; i >= 0; i--) { const u = i / 10; pts.push([x + u * w, y + h + Math.sin(t * 4.2 + u * 5 + ph + 0.4) * 8 * u]); }
    pc(pts, col, () => { strokePts(pts.slice(0, 11).map((p) => [p[0], p[1] + h * 0.2]), 'rgba(255,240,210,0.45)', 2.4); hatch(null, 0.5, 4, 0.15, 1, P.encre, [x - 10, y - 30, x + w + 10, y + h + 30]); }, seed);
  }
  function hampe(x, y0, y1) { pcv(box(x - 3, y1, x + 3, y0), '#5a3a22', null, 8890 + x); pc(ell(x, y1 - 4, 6, 6, 10), OR, null, 8891 + x); }
  function nuagePapier(seed, rx, ry) {                                         // nuage pendu : bosses tout autour (aucun bord droit)
    return M.pre(rx * 2 + 60, ry * 2 + 60, () => {
      const cx = rx + 30, cy = ry + 30;
      pc(bosses(cx, cy, rx, ry, 7, 0.28, seed), '#fbf4e4', () => { for (const b of bosses(cx + 6, cy + ry * 0.35, rx * 0.8, ry * 0.3, 6, 0.2, seed + 1).slice(0, 12)) dot(b[0], b[1], 10, 'rgba(200,170,130,0.1)'); shade(cx, cy - ry, cx, cy + ry, 0.12, [0, 0, rx * 2 + 60, ry * 2 + 60]); }, seed, { texA: 0.35 });
    });
  }
  function fils(x0, y0, x1, y1) { if (SIL()) return; const c = cx_(); c.save(); c.strokeStyle = 'rgba(30,24,20,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, ST.top - 10); c.moveTo(x1, y1); c.lineTo(x1, ST.top - 10); c.stroke(); c.restore(); }
  const amphore = (x, yb, h, col, seed) => {
    pc([[x - 0.12 * h, yb - 0.92 * h], [x - 0.3 * h, yb - 0.7 * h], [x - 0.26 * h, yb - 0.3 * h], [x - 0.05 * h, yb, 1], [x + 0.05 * h, yb, 1], [x + 0.26 * h, yb - 0.3 * h], [x + 0.3 * h, yb - 0.7 * h], [x + 0.12 * h, yb - 0.92 * h], [x + 0.08 * h, yb - h, 1], [x - 0.08 * h, yb - h, 1]], col, () => {
      strokePts([[x - 0.27 * h, yb - 0.6 * h], [x + 0.27 * h, yb - 0.62 * h]], 'rgba(60,30,15,0.4)', 1.4); hatch(null, 0.8, 4, 0.2); shade(x - 0.3 * h, 0, x + 0.3 * h, 0, 0.35, [x - h, yb - h, x + h, yb]); }, seed);
    for (const s of [-1, 1]) strokePts([[x + s * 0.1 * h, yb - 0.95 * h], [x + s * 0.24 * h, yb - 0.9 * h], [x + s * 0.24 * h, yb - 0.74 * h]], col === '#a0603a' ? '#7a4528' : '#6e4a2a', 4);
  };

  // ------------------------------------------------------------------ CINÉMA D'AUJOURD'HUI — PEJ.cinema(t, o) / PEJ.fauteuil / PEJ.cinemaAvant / PEJ.cinemaLueur
  const CINE = { ecran: { x0: 272, y0: 300, x1: 808, y1: 604 }, cabine: [916, 352], porte: { x0: 868, x1: 958, y0: 968 }, appliques: [[178, 790], [372, 724], [708, 724], [912, 900]],
    sieges: [440, 640], assise: 108 };                                         // places conseillées (x) pour PEJ.fauteuil à s 0,9 ; assise = px au-dessus de FEET
  PEJ.CINE = CINE;
  function capiton(x0, y0, x1, y1, col, seed) {
    pcv(box(x0, y0, x1, y1), col, () => {
      for (let x = x0 - (y1 - y0); x < x1; x += 46) { strokePts([[x, y1], [x + (y1 - y0), y0]], 'rgba(20,6,14,0.35)', 1.2); strokePts([[x + (y1 - y0), y1], [x, y0]], 'rgba(20,6,14,0.35)', 1.2); }
      for (let y = y0 + 23; y < y1; y += 46) for (let x = x0 + ((y - y0) / 46 % 2 ? 0 : 23); x < x1; x += 46) { dot(x, y, 3, 'rgba(20,6,14,0.6)'); dot(x - 1, y - 1, 1.2, 'rgba(255,200,220,0.3)'); }
      strokePts([[x0 + 4, y0 + 4], [x1 - 4, y0 + 4]], 'rgba(255,200,220,0.15)', 2); shade(x0, y0, x0, y1, 0.3, [x0, y0, x1, y1]);
    }, seed, { drop: false });
  }
  function siegeRang(x, yb, s, col, colD, seed) {                               // fauteuil de rang vu de trois quarts (décor)
    pc([[x - 30 * s, yb - 96 * s], [x - 34 * s, yb - 180 * s], [x - 24 * s, yb - 196 * s], [x + 24 * s, yb - 196 * s], [x + 34 * s, yb - 180 * s], [x + 30 * s, yb - 96 * s]], col, () => {
      strokePts([[x - 20 * s, yb - 186 * s], [x + 20 * s, yb - 186 * s]], 'rgba(255,190,180,0.25)', 1.4); for (const dx of [-12, 0, 12]) strokePts([[x + dx * s, yb - 184 * s], [x + dx * s, yb - 104 * s]], 'rgba(20,0,0,0.3)', 1); }, seed);
    pc([[x - 34 * s, yb - 100 * s], [x + 34 * s, yb - 100 * s], [x + 30 * s, yb - 74 * s], [x - 30 * s, yb - 74 * s]], colD, null, seed + 1);
    for (const sd of [-1, 1]) pcv(box(x + sd * 40 * s - 5 * s, yb - 130 * s, x + sd * 40 * s + 5 * s, yb), '#2a1a1c', null, seed + 2 + sd);
  }
  function makeCineFond() {
    return M.pre(W, HB, (c) => {
      const E = CINE.ecran;
      degrade(c, W, HB, [[0, '#24101c'], [0.3, '#3a1c2c'], [1, '#2e1622']]);
      pcv(box(-10, 140, W + 10, 300), '#2a1420', () => { for (let x = 40; x < W; x += 120) pcv(box(x, 190, x + 90, 270), '#331a28', () => strokePts(box(x + 6, 196, x + 84, 264).concat([[x + 6, 196]]), 'rgba(200,160,90,0.35)', 1.4), 8001 + x, { drop: false });
        for (const y of [180, 284, 294]) strokePts([[-10, y], [W + 10, y]], 'rgba(200,160,90,0.45)', 2); }, 8000, { drop: false });
      capiton(120, 300, 262, 1180, '#4c2238', 8010); capiton(818, 300, 960, 960, '#4c2238', 8011); capiton(262, 640, 818, 1180, '#45203a', 8012);
      for (const x of [262, 818]) pcv(box(x - 4, 300, x + 4, 1180), '#2a1420', () => strokePts([[x, 300], [x, 1180]], 'rgba(200,160,90,0.4)', 1.4), 8020 + x);
      pcv(box(E.x0 - 16, E.y0 - 14, E.x1 + 16, E.y1 + 14), '#141014', null, 8030);                                      // cadre de l'écran
      // cabine de projection (haut droite) : renfoncement et fenêtre carrée
      pcv(box(870, 304, 962, 420), '#1e0e18', () => { fillPts(box(892, 328, 940, 376), '#efe0b8'); strokePts(box(892, 328, 940, 376).concat([[892, 328]]), '#3a2a20', 3); strokePts([[916, 328], [916, 376]], '#3a2a20', 1.6); }, 8040);
      // porte de sortie capitonnée au hublot rond (le battant est animé : voir porteCine)
      pcv(box(CINE.porte.x0 - 12, CINE.porte.y0 - 14, CINE.porte.x1 + 10, HB), '#1c1012', () => fillPts(box(CINE.porte.x0, CINE.porte.y0, CINE.porte.x1, HB), '#120a0a'), 8050);
      // appliques murales en coupe
      for (const [i, [x, y]] of CINE.appliques.entries()) { pc([[x - 26, y - 6], [x + 26, y - 6], [x + 16, y + 18], [x, y + 26], [x - 16, y + 18]], '#c9a24a', () => { fillPts([[x - 22, y - 6], [x + 22, y - 6], [x + 14, y + 4], [x - 14, y + 4]], '#f3e2b0'); strokePts([[x - 16, y + 10], [x + 16, y + 10]], 'rgba(90,60,20,0.5)', 1.2); }, 8060 + i); pcv(box(x - 4, y + 24, x + 4, y + 44), '#9a7a30', null, 8064 + i); }
      // allée en pente (gauche) : tapis à motifs et marches
      pcv([[132, HB], [140, 1060], [254, 1060], [262, HB]], '#6e1e24', () => {
        for (let y = 1080; y < HB; y += 46) { strokePts([[132, y], [262, y]], 'rgba(20,0,0,0.5)', 2); strokePts([[132, y + 3], [262, y + 3]], 'rgba(255,200,150,0.15)', 1); }
        for (let y = 1090; y < HB; y += 46) for (let x = 150; x < 250; x += 30) { const d = [[x, y + 10], [x + 10, y + 20], [x, y + 30], [x - 10, y + 20]]; strokePts(d.concat([d[0]]), 'rgba(201,162,74,0.55)', 1.2); }
        hatch(null, 0.4, 5, 0.12);
      }, 8070, { drop: false });
      speckle(c, 120, 300, 840, 900, 50, 8080, 'rgba(255,220,230,A)');
    });
  }
  function makeCineRangs() {
    return M.pre(W, HB, () => {
      for (let x = 290; x < 870; x += 58) siegeRang(x, 1236, 0.58, '#5a1c22', '#3e1418', 8100 + x);
      pcv(box(262, 1236, 870, 1250), '#1a0e10', null, 8098, { drop: false });
      for (let x = 300; x < 880; x += 76) siegeRang(x, ST.back + 4, 0.76, '#7a2228', '#561a1e', 8200 + x);
    });
  }
  function makeCinePorte() { return M.pre(110, 460, () => { pc(box(4, 4, 92, 446), '#5a2a26', () => { for (let y = 40; y < 446; y += 44) for (let x = 20; x < 92; x += 30) dot(x + ((y / 44) % 2 ? 15 : 0), y, 2.6, 'rgba(20,6,6,0.6)'); hatch(null, 0.8, 5, 0.15); }, 8300);
    pc(ell(48, 72, 20, 20, 18), '#b08d45', () => fillPts(ell(48, 72, 15, 15, 16), '#26344a'), 8301); pcv(box(8, 220, 20, 236), '#b08d45', null, 8302); }); }
  function makeCineAvant() {
    return M.pre(W, M.H, () => {
      for (let i = 0; i < 6; i++) { const x = 110 + i * 172; pc([[x - 70, 1700], [x - 74, 1490], [x - 60, 1462], [x - 30, 1452], [x + 30, 1452], [x + 60, 1462], [x + 74, 1490], [x + 70, 1700]], '#5e1a20', () => {
        strokePts([[x - 52, 1468], [x + 52, 1468]], 'rgba(255,170,160,0.25)', 2); for (const dx of [-30, 0, 30]) strokePts([[x + dx, 1472], [x + dx, 1700]], 'rgba(20,0,0,0.35)', 1.2); shade(x, 1450, x, 1640, 0.45, [x - 80, 1440, x + 80, 1700]); }, 8400 + i);
        if (i < 5) pcv(box(x + 76, 1500, x + 96, 1700), '#2a1a1c', () => fillPts(box(x + 74, 1494, x + 98, 1506), '#4a2e22'), 8410 + i); }
      // gobelet à paille posé sur un accoudoir
      pc([[350, 1494], [384, 1494], [380, 1440], [354, 1440]], '#e6dcc3', () => { fillPts(box(350, 1452, 386, 1466), '#a8382f'); }, 8420); pc(box(352, 1434, 382, 1442), '#cfc6b0', null, 8421);
      pc([[370, 1436], [376, 1384], [394, 1378], [396, 1384], [380, 1388], [376, 1436]], '#e6dcc3', () => { for (let y = 1390; y < 1436; y += 8) strokePts([[372, y], [380, y - 2]], '#a8382f', 2); }, 8422);
      // grains de pop-corn au sol
      const R = M.rng(8430); for (let i = 0; i < 9; i++) { const x = 560 + R() * 260, y = 1596 + R() * 30; pc(bosses(x, y, 6, 5, 4, 0.35, 8431 + i), '#f6efd8', () => dot(x + 1, y + 1, 1.6, 'rgba(214,170,70,0.75)'), 8431 + i); }
    });
  }
  function ecranCouleur(g, o) {
    const te = clamp(o.teinte || 0), b = (o.ecran == null ? 1 : clamp(o.ecran)) * (0.84 + 0.1 * noise(g * 2.6, 3) + 0.05 * Math.sin(g * 21));
    const froid = hexOf(M.mixc('#dbe6f2', '#f2f0ea', 0.5 + 0.5 * Math.sin(g * 0.9))), base = hexOf(M.mixc(froid, '#f2d9a6', te));
    return { col: M.mixc(base, '#16141a', 1 - b), b };
  }
  const hexOf = (rgb) => { const m = rgb.match(/\d+/g); return '#' + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); };
  // o : teinte 0..1 (0 = bleu-blanc changeant, 1 = ambre chaud) ; ecran 0..1 (intensité, 1) ; dessin 0..1 (pictogramme pain + roue en grand sur l'écran) ;
  //     porte (instant local où la porte de sortie s'entrouvre, lueur, se referme en 3 s) ; faisceau (true) ; cast
  PEJ.cinema = function (t, o) {
    o = o || {}; const K = PEJ.K, c = cx_(), g = M.tg(t), E = CINE.ecran, sc = ecranCouleur(g, o);
    c.drawImage(K.ciFond, 0, 0);
    // écran : lumière qui vacille (aucune image)
    c.save(); c.fillStyle = sc.col; c.fillRect(E.x0, E.y0, E.x1 - E.x0, E.y1 - E.y0);
    c.beginPath(); c.rect(E.x0, E.y0, E.x1 - E.x0, E.y1 - E.y0); c.clip();
    for (let i = 0; i < 3; i++) { const x = E.x0 + (0.5 + 0.4 * Math.sin(g * (0.3 + i * 0.17) + i * 2)) * (E.x1 - E.x0), y = E.y0 + (0.5 + 0.35 * Math.cos(g * (0.23 + i * 0.11) + i)) * (E.y1 - E.y0);
      const gr = c.createRadialGradient(x, y, 4, x, y, 220); gr.addColorStop(0, `rgba(255,255,255,${0.16 * sc.b})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(E.x0, E.y0, E.x1 - E.x0, E.y1 - E.y0); }
    const dk = clamp(o.dessin || 0);
    if (dk > 0) { c.globalAlpha = smooth(0, 0.2, dk); c.fillStyle = '#3B2F2A'; c.fillRect(E.x0, E.y0, E.x1 - E.x0, E.y1 - E.y0); c.globalAlpha = 1; PEJ.pictos((E.x0 + E.x1) / 2, (E.y0 + E.y1) / 2, 104, smooth(0.15, 1, dk), 7); }
    c.restore();
    // rideaux de scène bordeaux plissés qui ondulent à peine
    for (const sd of [-1, 1]) {
      const xe = sd < 0 ? E.x0 + 26 : E.x1 - 26, xo = sd < 0 ? 196 : 884, pts = [[xo, 290]];
      for (let i = 0; i <= 12; i++) { const y = 290 + i * 30; pts.push([xe - sd * (i * 3) + 6 * Math.sin(g * 1.1 + i * 0.6) * (i / 12), y]); }
      pts.push([xo, 650]);
      pc(pts, '#6e1a24', () => { for (let k = 1; k < 6; k++) { const x = lerp(xo, xe, k / 6); strokePts([[x, 292], [x + 4 * Math.sin(g * 1.1 + k), 470], [x - sd * 8, 648]], 'rgba(20,0,4,0.45)', 2.4); strokePts([[x + 6, 292], [x + 10, 640]], 'rgba(255,170,170,0.15)', 1.4); } }, 8500 + sd);
    }
    pc([[190, 282], [890, 282], [890, 318]].concat(Array.from({ length: 15 }, (_, i) => [890 - i * 50, 318 + (i % 2 ? 18 : 0) + 2 * Math.sin(g + i)]), [[190, 318]]), '#5e1620', () => { strokePts([[190, 300], [890, 300]], 'rgba(201,162,74,0.7)', 3); }, 8503);
    // appliques qui palpitent
    for (const [i, [x, y]] of CINE.appliques.entries()) { const p = 1 + 0.08 * Math.sin(g * 2.3 + i * 1.7) + 0.04 * noise(g * 3, i); glow(x, y - 10, 90 * p, '#ffc878', 0.32); glow(x, y - 30, 40 * p, '#fff0c8', 0.35); }
    // lumières de marche de l'allée
    for (let y = 1080, i = 0; y < HB; y += 46, i++) for (const x of [142, 252]) { dot(x, y - 4, 3, '#ffd88a'); glow(x, y - 4, 16 * (1 + 0.15 * Math.sin(g * 3 + i)), '#ffc060', 0.4); }
    // porte de sortie (événement) : le battant s'entrouvre, une lueur passe
    const Pp = CINE.porte, u = o.porte == null ? -1 : t - o.porte, ouv = u < 0 ? 0 : smooth(0, 0.8, u) * (1 - smooth(2.3, 3.1, u));
    if (ouv > 0.01) { glow(Pp.x0 + 30, 1200, 160 * ouv, '#ffe2a8', 0.5); if (!SIL()) { c.save(); c.fillStyle = `rgba(255,226,170,${0.8 * ouv})`; c.fillRect(Pp.x0, Pp.y0, (Pp.x1 - Pp.x0) * 0.6 * ouv, HB - Pp.y0); c.restore(); } }
    c.save(); c.translate(Pp.x1, Pp.y0 - 4); c.scale(1 - 0.62 * ouv, 1); c.drawImage(K.ciPorte, -96, 0); c.restore();
    c.drawImage(K.ciRangs, 0, 0);
    // faisceau du projecteur avec sa poussière, et la salle teintée par l'écran
    if (o.faisceau !== false && !SIL()) {
      const [px, py] = CINE.cabine, cone = [[px - 10, py - 12], [px - 10, py + 12], [E.x0 + 60, E.y1 - 20], [E.x0 + 90, E.y0 + 20]];
      c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createLinearGradient(px, py, E.x0, py); gr.addColorStop(0, `rgba(255,248,225,${0.4 * sc.b})`); gr.addColorStop(1, `rgba(220,230,255,${0.1 * sc.b})`);
      c.beginPath(); cone.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = gr; c.fill(); c.clip(); M.poussiere(t, { x: E.x0, y: E.y0, w: px - E.x0, h: E.y1 - E.y0, n: 46, seed: 8510, a: 0.75 }); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(540, 620, 40, 540, 620, 900); lg.addColorStop(0, rgba(hexOf(sc.col), 0.10 * sc.b)); lg.addColorStop(1, rgba(hexOf(sc.col), 0)); c.fillStyle = lg; c.fillRect(0, 150, W, HB - 150); c.restore();
    }
  };
  PEJ.cinemaLueur = function (t, o) {                                          // (facultatif) après les marionnettes : la lueur de l'écran les touche aussi
    if (SIL()) return; o = o || {}; const c = cx_(), sc = ecranCouleur(M.tg(t), o);
    c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(540, 600, 40, 540, 700, 1000); lg.addColorStop(0, rgba(hexOf(sc.col), 0.07 * sc.b)); lg.addColorStop(1, rgba(hexOf(sc.col), 0)); c.fillStyle = lg; c.fillRect(0, 150, W, 1500); c.restore();
  };
  PEJ.cinemaAvant = function () { cx_().drawImage(PEJ.K.ciAvant, 0, 0); };

  // ------------------------------------------------------------------ FORUM DE ROME (vers 100) — PEJ.forum(t, o) / PEJ.forumBalcon / PEJ.forumAvant
  const FORUM = { balcon: { x0: 700, x1: 950, cx: 825, sol: ST.back - 232, H: 800 }, cirque: { cx: 800, cy: 468, rx: 172, ry: 42, piste: { x0: 640, x1: 960, y: 506 } },
    portique: { x0: 130, x1: 372 }, chat: { x0: 140, x1: 420, y: 1392 }, chariot: { x: 200, y: ST.back }, brasero: [404, 1240], taberna: 566 };
  PEJ.FORUM = FORUM;
  PEJ.forumBalconY = (monte) => FORUM.balcon.sol + (1 - clamp(monte == null ? 1 : monte)) * FORUM.balcon.H;   // y écran du plancher du balcon
  function makeForumFond() {
    return M.pre(W, HB, (c) => {
      degrade(c, W, HB, [[0, '#d2aa72'], [0.45, '#e6c996'], [0.75, '#f1dfb8'], [1, '#e9d6ac']]);
      speckle(c, 0, 150, W, 800, 60, 8601, 'rgba(255,250,235,A)');
      // colline du Capitole et son temple (gauche, loin)
      pc([[-20, HB], [-20, 760], [80, 700], [220, 660], [340, 690], [450, 780], [520, HB]], '#a8a070', () => { hatch(null, 0.4, 5, 0.14); shade(0, 660, 0, 1000, 0.25, [-20, 650, 520, HB]); }, 8602, { drop: false });
      pcv(box(120, 600, 300, 664), '#e2d6bc', () => { for (let x = 132; x < 300; x += 22) fillPts(box(x, 610, x + 8, 660), '#cfc2a4'); }, 8603); pcv([[110, 604], [210, 560], [310, 604]], '#d8cbaf', null, 8604);
      // Circus Maximus peint, au loin à droite : arène ovale, gradins, spina et obélisque
      const Cc = FORUM.cirque;
      pc([[540, 900], [560, 560], [640, 470], [760, 430], [900, 428], [1000, 460], [1100, 520], [1100, 900]], '#b4a674', () => hatch(null, 0.4, 5, 0.12), 8605, { drop: false });
      pc(ell(Cc.cx, Cc.cy, Cc.rx + 26, Cc.ry + 16, 40), '#c8b08a', () => { for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; strokePts([[Cc.cx + Math.cos(a) * (Cc.rx + 6), Cc.cy + Math.sin(a) * (Cc.ry + 4)], [Cc.cx + Math.cos(a) * (Cc.rx + 24), Cc.cy + Math.sin(a) * (Cc.ry + 14)]], 'rgba(90,70,40,0.35)', 1); } }, 8606);
      pc(ell(Cc.cx, Cc.cy, Cc.rx, Cc.ry, 40), '#e4cc96', () => hatch(null, 0.1, 4, 0.1), 8607);
      pcv(box(Cc.cx - 110, Cc.cy - 4, Cc.cx + 110, Cc.cy + 4), '#a89a7a', null, 8608);
      pc([[Cc.cx - 4, Cc.cy - 4], [Cc.cx - 2, Cc.cy - 70], [Cc.cx, Cc.cy - 76], [Cc.cx + 2, Cc.cy - 70], [Cc.cx + 4, Cc.cy - 4]], '#c8bca0', null, 8609);
      for (const x of [Cc.cx - 116, Cc.cx + 116]) for (const dx of [-6, 0, 6]) pc([[x + dx - 3, Cc.cy], [x + dx, Cc.cy - 16], [x + dx + 3, Cc.cy]], '#b8a070', null, 8610 + x + dx);
      // aqueduc à arches au loin
      pcv(box(330, 900, W + 10, 916), '#cbb894', null, 8620);
      pcv(box(330, 916, W + 10, 1010), '#cfbc98', () => { for (let x = 344; x < W; x += 52) fillPts([[x, 1010, 1], [x, 956]].concat(ep(x + 19, 956, 19, 22, 8, PI, TAU), [[x + 38, 1010, 1]]), '#e9d8b0'); hatch(null, 1.2, 5, 0.12); }, 8621, { drop: false });
      // grand temple à fronton (centre) et basilique (droite)
      pcv(box(350, 1150, 650, 1196), '#d8ccb0', () => { for (const y of [1162, 1176, 1188]) strokePts([[350, y], [650, y]], 'rgba(90,70,40,0.3)', 1); }, 8630);
      for (let i = 0; i < 6; i++) colonne(378 + i * 49, 1152, 846, 30, '#e8dfca', '#cfc2a4', 8631 + i * 4);
      pcv(box(352, 812, 648, 848), '#ddd2b6', () => { strokePts([[352, 830], [648, 830]], 'rgba(90,70,40,0.35)', 1.4); for (let x = 360; x < 648; x += 18) fillPts(box(x, 836, x + 8, 846), '#c8bca0'); }, 8660);
      pcv([[340, 814], [500, 730], [660, 814]], '#e2d8be', () => { fillPts([[380, 806, 1], [500, 748, 1], [620, 806, 1]], '#cfc2a4'); for (const x of [430, 500, 570]) dot(x, 790, 6, '#bcae8e'); }, 8661);
      pcv(box(650, 940, 760, 1196), '#d4c6a6', () => { for (let x = 664; x < 760; x += 32) { fillPts([[x, 1196], [x, 1010], [x + 10, 994], [x + 20, 1010], [x + 20, 1196]], '#8a7a5e'); } }, 8662);
      speckle(c, 0, 600, W, 600, 40, 8670, 'rgba(255,245,225,A)');
    });
  }
  function makeForumProps() {
    return {
      portique: makeProp(280, 560, () => {
        pcv(box(-125, -26, 125, 0), '#d8ccb0', null, 8701);
        for (let i = 0; i < 4; i++) colonne(-96 + i * 64, -24, -432, 30, '#e8dfca', '#cfc2a4', 8702 + i * 4);
        pcv(box(-130, -476, 130, -432), '#ddd2b6', () => { strokePts([[-130, -452], [130, -452]], 'rgba(90,70,40,0.4)', 1.4); for (let x = -122; x < 130; x += 20) fillPts(box(x, -444, x + 9, -434), '#c8bca0'); }, 8720);
        pcv([[-138, -474], [-118, -520], [118, -520], [138, -474]], '#a8553a', () => { for (let x = -116; x < 120; x += 14) strokePts([[x, -518], [x * 1.08, -476]], 'rgba(60,20,10,0.4)', 1.2); }, 8721);
      }),
      taberna: makeProp(260, 360, () => {
        pcv(box(-112, -320, 112, 0), '#b89a74', () => { fillPts(box(-92, -300, 92, -110), '#3a2a20'); for (let y = -300; y < 0; y += 22) strokePts([[-112, y], [112, y]], 'rgba(90,60,30,0.3)', 1); }, 8730);
        pcv(box(-108, -116, 108, 0), '#8a6a48', () => { for (let x = -100; x < 108; x += 26) strokePts([[x, -116], [x, 0]], 'rgba(40,25,10,0.4)', 1.2); fillPts(box(-112, -122, 112, -110), '#6b4a2e'); }, 8731);
        amphore(-70, -122, 66, '#a0603a', 8732); amphore(-30, -122, 56, '#b8743e', 8733); amphore(60, -122, 70, '#a0603a', 8734);
        pc(ell(16, -136, 18, 14, 12), '#d8c890', () => fillPts(ell(16, -140, 14, 6, 10), '#c8a050'), 8735);           // panier de figues
        for (const [i, x] of [-60, -20, 20, 60].entries()) pc([[x - 6, -300], [x + 6, -300], [x + 3, -250], [x - 3, -250]], i % 2 ? '#7a8a3a' : '#9a7a40', null, 8736 + i);   // bottes d'herbes pendues
      }),
      statue: makeProp(150, 470, () => {
        pcv(box(-50, -140, 50, 0), '#cfc2a4', () => { fillPts(box(-56, -150, 56, -136), '#bcae8e'); fillPts(box(-56, -14, 56, 0), '#bcae8e'); strokePts(box(-36, -120, 36, -30).concat([[-36, -120]]), 'rgba(90,70,40,0.35)', 1.4); }, 8740);
        pc([[-22, -150], [-30, -260], [-26, -340], [-14, -360], [-12, -380], [-4, -396], [8, -398], [16, -384], [14, -366], [26, -350], [30, -300], [24, -230], [30, -150]], '#bdb8aa', () => {
          for (let i = 0; i < 5; i++) strokePts(qbez([-24, -330 + i * 30], [0, -300 + i * 30], [26, -320 + i * 34], 8), 'rgba(80,75,65,0.45)', 1.4); hatch(null, 0.8, 4, 0.2); shade(-30, 0, 30, 0, 0.3, [-40, -400, 40, -150]); }, 8741);
        pc([[24, -330], [52, -360], [58, -354], [30, -318]], '#bdb8aa', null, 8742);
      }),
      brasero: makeProp(120, 200, () => {
        for (const sd of [-1, 0, 1]) pc(ribbon([[sd * 34, 0], [sd * 16, -110]], 6), '#3a3230', null, 8750 + sd);
        pc([[-44, -150], [44, -150], [34, -112], [-34, -112]], '#5a4a40', () => { strokePts([[-40, -142], [40, -142]], '#8a6a40', 2); hatch(null, 0.6, 4, 0.2); }, 8753);
        for (let i = 0; i < 6; i++) pc(ell(-30 + i * 12, -152, 8, 6, 8), i % 2 ? '#d8582a' : '#a83a22', null, 8754 + i);
      }),
      balcon: makeProp(300, 820, () => {                                         // colonnes, tenture pourpre, plancher (le parapet est dans balconAvant)
        for (const x of [-118, 118]) colonne(x, 0, -760, 26, '#e8dfca', '#cfc2a4', 8760 + x);
        pcv(box(-136, -800, 136, -760), '#ddd2b6', () => { for (let x = -128; x < 136; x += 20) fillPts(box(x, -772, x + 9, -762), '#c8bca0'); }, 8770);
        pc([[-104, -760], [104, -760], [104, -230], [70, -246], [30, -230], [-10, -246], [-50, -230], [-104, -246]], '#6B2E4A', () => {
          for (let x = -96; x < 104; x += 16) strokePts([[x, -758], [x + 4, -500], [x - 2, -236]], 'rgba(20,4,12,0.45)', 1.6); strokePts([[-104, -740], [104, -740]], OR, 3); hatch(null, 1.2, 4, 0.15); }, 8771);
        pcv(box(-130, -232, 130, -214), '#cfc2a4', () => strokePts([[-130, -228], [130, -228]], 'rgba(255,245,220,0.5)', 1.4), 8772);
        pcv(box(-122, -214, 122, 0), '#c8b898', () => { for (let y = -200; y < 0; y += 30) strokePts([[-122, y], [122, y]], 'rgba(90,70,40,0.3)', 1); }, 8773);
      }),
      balconAvant: makeProp(300, 270, () => {                                    // parapet : balustres, drapé pourpre à frange d'or (hauteur 186 au-dessus du plancher)
        pcv(box(-132, -196, 132, -180), '#ddd2b6', null, 8780);
        for (let x = -116; x <= 116; x += 26) pc([[x - 6, -180], [x + 6, -180], [x + 10, -150], [x + 6, -120], [x + 9, -96], [x - 9, -96], [x - 6, -120], [x - 10, -150]], '#e2d8be', () => shade(x - 10, 0, x + 10, 0, 0.3, [x - 12, -182, x + 12, -94]), 8781 + x);
        pcv(box(-132, -100, 132, -84), '#ddd2b6', null, 8800);
        pc([[-132, -186], [132, -186], [126, -120], [90, -150], [44, -112], [0, -150], [-44, -112], [-90, -150], [-126, -120]], '#6B2E4A', () => { for (let x = -120; x < 130; x += 16) strokePts([[x, -184], [x, -120]], 'rgba(20,4,12,0.45)', 1.4); strokePts([[-132, -182], [132, -182]], OR, 3); }, 8801);
        const fr = qbez([-126, -120], [-108, -150], [-90, -150], 6).concat(qbez([-90, -150], [-67, -112], [-44, -112], 6), qbez([-44, -112], [-22, -150], [0, -150], 6), qbez([0, -150], [22, -112], [44, -112], 6), qbez([44, -112], [67, -150], [90, -150], 6), qbez([90, -150], [108, -150], [126, -120], 6));
        strokePts(fr, OR, 3); for (let i = 0; i < fr.length; i += 2) strokePts([fr[i], [fr[i][0], fr[i][1] + 8]], '#e8c86a', 1.4);
        pcv(box(-136, -84, 136, 0), '#c8b898', () => { fillPts(box(-136, -84, 136, -74), '#bcae8e'); for (const x of [-80, 0, 80]) strokePts(box(x - 30, -64, x + 30, -14).concat([[x - 30, -64]]), 'rgba(90,70,40,0.35)', 1.4); }, 8802);
      }),
      enseigne: makeProp(90, 150, () => { pcv(box(-40, -136, 4, -130), '#3a2a20', null, 8810); strokePts([[-20, -130], [-20, -112]], '#3a2a20', 1.6);
        pc([[-36, -112], [-4, -112], [-4, -40], [-36, -40]], '#d8c090', () => { amphore(-20, -48, 54, '#a0603a', 8812); }, 8811); }),
      fontaine: makeProp(260, 220, () => {
        pc([[-120, -60], [120, -60], [104, -14], [70, 0, 1], [-70, 0, 1], [-104, -14]], '#cfc2a4', () => { fillPts([[-112, -60], [112, -60], [108, -50], [-108, -50]], '#7a98a8'); hatch(null, 0.9, 4, 0.18); shade(-110, 0, 110, 0, 0.3, [-125, -65, 125, 5]); }, 8820);
        pcv(box(-14, -150, 14, -60), '#bcae8e', null, 8821); pc(ell(0, -158, 30, 10, 14), '#cfc2a4', null, 8822);
        pc([[-10, -168], [10, -168], [6, -196], [0, -204], [-6, -196]], '#bcae8e', null, 8823);
      }),
      cage: makeProp(170, 150, () => {
        pc(rrect(-74, -110, 74, 0, 8), 'rgba(120,90,50,0.25)', () => { for (let x = -66; x < 74; x += 12) strokePts([[x, -106], [x, -4]], '#7a5a32', 2); strokePts([[-74, -56], [74, -56]], '#7a5a32', 2); }, 8830, { drop: false });
        pcv(box(-80, -116, 80, -104), '#6b4a2e', null, 8831); pcv(box(-80, -6, 80, 4), '#6b4a2e', null, 8832);
      }),
      amphores: makeProp(220, 200, () => { amphore(-60, 0, 120, '#a0603a', 8840); amphore(10, 0, 150, '#b8743e', 8841); amphore(76, 0, 100, '#a0603a', 8842); }),
      chariot: makeProp(330, 220, () => {                                        // chariot à bras (les sacs sont dessinés par-dessus)
        pc([[-150, -96], [110, -96], [120, -70], [-140, -70]], '#7a5a3a', () => { for (let x = -140; x < 110; x += 30) strokePts([[x, -94], [x, -72]], 'rgba(40,25,10,0.45)', 1.2); }, 8850);
        pc(ribbon([[110, -86], [170, -40], [176, -10]], 8), '#6b4526', null, 8851);
        pc(ell(-50, -46, 44, 44, 22), '#5a3a22', () => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; strokePts([[-50, -46], [-50 + Math.cos(a) * 38, -46 + Math.sin(a) * 38]], '#a07a52', 3); } strokePts(ep(-50, -46, 40, 40, 20, 0, TAU), '#8a6a42', 4); }, 8852);
        pc(ell(-50, -46, 7, 7, 10), '#3a2a20', null, 8853);
      }),
    };
  }
  function auvent(x0, x1, y, t, cols, seed) {                                  // auvent rayé qui ondule (bord festonné)
    const n = 10, pts = [[x0 - 8, y - 40], [x1 + 8, y - 40]];
    for (let i = n; i >= 0; i--) { const x = lerp(x0, x1, i / n), w = 5 * Math.sin(t * 2.2 + i * 0.9); pts.push([x + (i % 2 ? 0 : 0), y + (i % 2 ? 26 : 8) + w]); }
    pc(pts, cols[1], () => { for (let i = 0; i < n; i += 2) { const xa = lerp(x0, x1, i / n), xb = lerp(x0, x1, (i + 1) / n); fillPts([[xa, y - 40], [xb, y - 40], [xb, y + 40], [xa, y + 40]], cols[0]); } hatch(null, 0.5, 4, 0.12); }, seed);
  }
  function chatMarche(x, y, t, sens) {                                         // chat tigré qui traverse
    const c = cx_(), ph = t * 8; c.save(); c.translate(x, y); c.scale(sens, 1);
    for (const [lx, o_] of [[-20, 0], [-12, PI], [16, PI / 2], [24, PI * 1.5]]) { const a = Math.sin(ph + o_) * 0.4; c.save(); c.translate(lx, -18); c.rotate(a); pc(box(-2.5, 0, 2.5, 18), '#6b5640', null, 8901); c.restore(); }
    pc([[-30, -34], [-6, -40], [24, -38], [32, -24], [26, -16], [-28, -16]], '#8a7050', () => { for (let i = 0; i < 5; i++) strokePts([[-20 + i * 10, -38], [-24 + i * 10, -18]], 'rgba(50,35,20,0.6)', 2); }, 8902);
    pc([[24, -38], [30, -50], [34, -46], [40, -50], [44, -38], [42, -28], [28, -26]], '#8a7050', () => dot(38, -40, 1.6, '#1a1a10'), 8903);
    pc(ribbon(qbez([-30, -32], [-52, -40 + 6 * Math.sin(ph * 0.5)], [-48, -66], 8), 5), '#8a7050', null, 8904);
    c.restore();
  }
  function pigeon(x, y, t, sens, vole) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(sens, 1);
    pc([[-18, -8], [0, -16], [14, -14], [20, -6], [10, 0], [-14, 0], [-26, -4]], '#8a8a92', () => fillPts([[6, -14], [14, -14], [16, -8], [8, -6]], '#6a7a6a'), 8910);
    pc(ell(16, -18, 6, 6, 10), '#7a7a84', () => dot(18, -19, 1.2, '#111'), 8911); pc([[21, -18], [27, -17], [21, -15]], '#d8a050', null, 8912);
    if (vole) { const a = Math.sin(t * 22) * 0.8; c.save(); c.translate(-2, -12); c.rotate(-0.6 + a); pc([[0, 0], [-26, -18], [-34, -8], [-10, 4]], '#9a9aa2', null, 8913); c.restore(); }
    else { const pk = Math.max(0, Math.sin(t * 5)); c.translate(0, 0); strokePts([[0, 0], [-2, 6]], '#c87a5a', 1.6); strokePts([[6, 0], [6, 6]], '#c87a5a', 1.6); if (pk > 0.8) dot(26, -12, 1, '#555'); }
    c.restore();
  }
  // o : monte 0..1 (balcon, défaut 1 ; 0 = sous la trappe) ; quadrige 0..1 (avance du petit quadrige sur la piste du cirque peint, null = absent) ;
  //     sacs 0..1 (chariot de sacs de blé qui entre par la gauche jusqu'à FORUM.chariot.x) ; chat (instant local : un chat traverse le portique en 4 s) ;
  //     pigeon (instant local : un pigeon se pose sur le sac du haut du chariot ; exige sacs ≥ 1) ; cast
  PEJ.forum = function (t, o) {
    o = o || {}; const K = PEJ.K, c = cx_(), g = M.tg(t), cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    c.drawImage(K.foFond, 0, 0);
    // petit quadrige qui file sur la piste du cirque peint (au loin)
    if (o.quadrige != null && o.quadrige >= 0 && o.quadrige <= 1) { const Pi = FORUM.cirque.piste; PEJ.quadrige(lerp(Pi.x0 + 30, Pi.x1 - 100, clamp(o.quadrige)), Pi.y, null, { petit: true, t, couleur: o.quadrigeCouleur || 'rouge' }); }
    // nuages pendus (bords en bosses) qui dérivent et se balancent
    for (const [i, n] of K.foNuages.entries()) { const x = ((150 + i * 380 + g * 7) % 1400) - 160; M.hung(n, x, 400 + (i % 2) * 50, t, { f: 0.5 + i * 0.1, ph: i, amp: 0.02 }); }
    M.oiseaux(g % 11, { x0: 1160, x1: -80, y: 560, t0: 0, dur: 10, n: 5, s: 0.42, seed: 12, col: '#5a5660', brume: 0.3 });
    M.passants(t, { y: 1188, s: 0.3, n: 3, per: 16, x0: 360, x1: 660, brume: 0.5, seed: 31 });
    M.flat(K.foProps.portique, (FORUM.portique.x0 + FORUM.portique.x1) / 2, ST.back, { cast });
    M.flat(K.foProps.statue, 250, ST.back - 26, { cast, scale: 0.7 });
    M.flat(K.foProps.taberna, FORUM.taberna, ST.back, { cast });
    auvent(FORUM.taberna - 128, FORUM.taberna + 128, 1072, g, ['#a8382f', '#e6dcc3'], 8960);
    M.flat(K.foProps.enseigne, FORUM.taberna + 146, 1104, { rot: 0.04 * Math.sin(g * 1.3) });
    // chat qui traverse le portique (événement)
    if (o.chat != null) { const u = (t - o.chat) / 4; if (u > 0 && u < 1) chatMarche(lerp(FORUM.chat.x0, FORUM.chat.x1, u), FORUM.chat.y, t, 1); }
    // brasero : flamme et fumée en volutes
    const B = FORUM.brasero; M.flat(K.foProps.brasero, B[0], ST.back, { cast });
    for (const [i, dx] of [-20, 0, 18].entries()) M.flamme(t, { x: B[0] + dx, y: ST.back - 150, s: 0.9, r: 80, seed: 61 + i });
    volutes(g, { x: B[0], y: ST.back - 190, k: 0.7, n: 7, per: 3.4, haut: 320, vent: 60, r: 40, seed: 8970, col: '#d8d0c4', colD: '#9a9288', a: 0.6 });
    // balcon impérial qui monte de la trappe
    const mo = clamp(o.monte == null ? 1 : o.monte), by = ST.back + (1 - mo) * FORUM.balcon.H;
    if (mo > 0) M.flat(K.foProps.balcon, FORUM.balcon.cx, by, { cast, clipY: ST.back + 1 });
    // chariot de sacs de blé (événement p3)
    if (o.sacs != null && o.sacs > 0) {
      const xc = lerp(-260, FORUM.chariot.x, easeOut(clamp(o.sacs))), bob = o.sacs < 1 ? Math.abs(Math.sin(t * 9)) * 2 : 0;
      M.flat(K.foProps.chariot, xc, ST.back - bob, { cast });
      for (const [i, [dx, dy]] of [[-96, 0], [-14, 0], [-56, -118]].entries()) PEJ.sac(xc + dx, ST.back - 96 - bob + dy, 0.74, { t: g + i });
      if (o.pigeon != null) { const u = (t - o.pigeon) / 1.6, tx = xc - 56, ty = ST.back - 96 - 118 - 150 * 0.74 - bob;
        if (u > 0 && u < 1) pigeon(lerp(tx + 260, tx, easeOut(u)), lerp(ty - 220, ty, ease(u)), t, -1, true); else if (u >= 1) pigeon(tx, ty, t, -1, false); }
    }
  };
  PEJ.forumBalcon = function (t, o) {                                          // APRÈS l'empereur : parapet du balcon (il est caché jusqu'à mi-cuisse)
    o = o || {}; const mo = clamp(o.monte == null ? 1 : o.monte); if (mo <= 0) return;
    M.flat(PEJ.K.foProps.balconAvant, FORUM.balcon.cx, PEJ.forumBalconY(mo) + 4, { cast: o.cast || { dx: 14, dy: 6, a: 0.3 }, clipY: ST.back + 1 });
  };
  PEJ.forumAvant = function (t, o) {                                           // après les marionnettes : fontaine qui coule, cage à poules, amphores (bords de scène)
    const K = PEJ.K, g = M.tg(t), cast = { dx: 10, dy: 4, a: 0.25 }, c = cx_();
    M.flat(K.foProps.fontaine, 150, 1640, { cast, scale: 0.9 });
    if (!SIL()) { c.save(); for (let i = 0; i < 18; i++) { const u = (g * 0.9 + i / 18) % 1, sd = i % 2 ? 1 : -1, x = 150 + sd * 80 * u, y = 1640 - 180 * 0.9 - 70 * 4 * u * (1 - u) + 120 * u * u; c.beginPath(); c.ellipse(x, y, 3.2, 4.6, 0, 0, TAU); c.fillStyle = `rgba(190,220,236,${0.85 * (1 - u * 0.5)})`; c.fill(); } c.restore(); }
    M.flat(K.foProps.cage, 990, 1500, { cast, scale: 0.8 });
    for (let i = 0; i < 2; i++) { const x = 960 + i * 56, y = 1500 - 50 + Math.max(0, Math.sin(g * 3 + i * 2)) * 10; pc([[x - 14, y], [x - 8, y - 18], [x + 6, y - 22], [x + 14, y - 10], [x + 10, y + 6], [x - 10, y + 8]], '#e8dcc0', () => { dot(x + 8, y - 16, 1.4, '#111'); }, 8990 + i); pc([[x + 2, y - 22], [x + 6, y - 30], [x + 10, y - 22]], '#a8382f', null, 8992 + i); }
    M.flat(K.foProps.amphores, 960, 1660, { cast, scale: 0.8 });
  };

  // ------------------------------------------------------------------ GRADINS DU CIRCUS MAXIMUS — PEJ.cirque / PEJ.cirqueGradins / PEJ.cirqueLoge / PEJ.cirqueAvant
  const CIRQUE = { gradins: [{ haut: FEET - 120, x0: 110, x1: 700 }, { haut: FEET - 240, x0: 110, x1: 700 }], loge: { x0: 704, x1: 952, cx: 828, sol: FEET - 240, balustrade: FEET - 240 - 186 },
    rail: { y: 1380, x0: -420, x1: 1500 }, arene: { y0: 860, y1: 1000 } };
  PEJ.CIRQUE = CIRQUE;
  PEJ.gradinSiege = (rang, s) => 120 / s;                                       // valeur de `siege` pour s'asseoir sur un gradin (rang 0 : pieds sur FEET ; rang 1 : pieds sur FEET−120)
  function makeCirqueFond() {
    return M.pre(W, HB, (c) => {
      degrade(c, W, HB, [[0, '#cfa46a'], [0.4, '#e6c48e'], [0.6, '#efd9ae'], [1, '#e2c99a']]);
      // le Palatin et ses palais
      pc([[-20, 760], [-20, 560], [140, 520], [380, 480], [640, 470], [900, 500], [1100, 540], [1100, 760]], '#a49a6c', () => hatch(null, 0.4, 5, 0.12), 9001, { drop: false });
      for (const [x0, x1, y0, col, sd] of [[50, 380, 430, '#d2bf98', 9002], [700, 1030, 446, '#d8c8a4', 9006], [360, 720, 384, '#c8b088', 9007]]) {
        pcv(box(x0, y0, x1, 562), col, () => { for (let x = x0 + 18; x < x1 - 18; x += 38) { fillPts([[x, 556, 1], [x, 516], [x + 10, 506], [x + 20, 516], [x + 20, 556, 1]], '#6e5a40'); if (y0 < 470) fillPts([[x, 490, 1], [x, 456], [x + 10, 446], [x + 20, 456], [x + 20, 490, 1]], '#86704f'); }
          strokePts([[x0, 498], [x1, 498]], 'rgba(90,70,40,0.5)', 3); strokePts([[x0, y0 + 10], [x1, y0 + 10]], 'rgba(90,70,40,0.4)', 2); hatch(null, 0.9, 6, 0.1); shade(x0, 0, x1, 0, 0.18, [x0, y0, x1, 562]); }, sd);
        pcv([[x0 - 8, y0 + 2], [x0 + 20, y0 - 30], [x1 - 20, y0 - 30], [x1 + 8, y0 + 2]], '#a8553a', () => { for (let x = x0; x < x1; x += 14) strokePts([[x, y0 - 28], [x, y0]], 'rgba(60,20,10,0.35)', 1); }, sd + 100);
      }
      pcv([[400, 356], [540, 300], [680, 356]], '#d8cbaf', () => fillPts(ell(540, 336, 14, 10, 10), '#c9a24a'), 9003);
      for (const x of [140, 960]) { pcv(box(x - 30, 330, x + 30, 432), '#e2d6bc', () => { for (let xx = x - 24; xx < x + 30; xx += 16) fillPts(box(xx, 340, xx + 7, 428), '#c8bca0'); }, 9004 + x); pcv([[x - 38, 334], [x, 306], [x + 38, 334]], '#d8cbaf', null, 9005 + x); }
      // gradins d'en face (la foule peinte est animée par-dessus) et arène de sable
      pcv(box(-10, 680, W + 10, 868), '#c8b48e', () => { for (let y = 700; y < 868; y += 28) { strokePts([[-10, y], [W + 10, y]], 'rgba(80,60,30,0.4)', 1.6); } for (let x = 20; x < W; x += 60) fillPts([[x, 868], [x, 846], [x + 10, 838], [x + 20, 846], [x + 20, 868]], '#7a6a4e'); }, 9010);
      pc([[-10, 860], [W + 10, 860], [W + 10, 1010], [-10, 1010]], '#dcc08a', () => { for (let i = 0; i < 30; i++) strokePts([[-10 + i * 40, 900 + (i % 3) * 30], [30 + i * 40, 902 + (i % 3) * 30]], 'rgba(150,110,60,0.25)', 1.4); hatch(null, 0.05, 6, 0.1); }, 9011, { drop: false });
      // spina : muret, obélisque, bornes coniques
      pcv(box(150, 926, 930, 946), '#b8a684', () => strokePts([[150, 930], [930, 930]], 'rgba(255,245,220,0.4)', 1.4), 9012);
      pc([[528, 928], [532, 640], [540, 624], [548, 640], [552, 928]], '#c6b48c', () => { strokePts([[536, 900], [538, 650]], 'rgba(255,245,220,0.35)', 2); shade(528, 0, 552, 0, 0.3, [520, 620, 560, 930]); }, 9013);
      pcv(box(520, 920, 560, 930), '#a89474', null, 9014);
      for (const x0 of [120, 890]) for (const dx of [0, 16, 32]) pc([[x0 + dx - 6, 930], [x0 + dx, 870], [x0 + dx + 6, 930]], '#b8963e', null, 9015 + x0 + dx);
      for (const x of [300, 420, 660, 780]) { pcv(box(x - 14, 890, x + 14, 928), '#c8bca0', null, 9020 + x); pc([[x - 18, 892], [x, 878], [x + 18, 892]], '#b8a684', null, 9021 + x); }
      // mur de l'arène côté nous
      pcv(box(-10, 1000, W + 10, 1030), '#b8a684', () => { for (let x = 0; x < W; x += 48) strokePts([[x, 1000], [x, 1030]], 'rgba(80,60,30,0.35)', 1); }, 9030);
      pcv(box(-10, 1030, W + 10, HB), '#a89676', () => hatch(null, 0.3, 6, 0.12), 9031, { drop: false });
    });
  }
  function makeCirqueProps() {
    return {
      logeFond: makeProp(270, 720, () => {                                       // fond de la loge : colonnes, tenture pourpre ; plancher à y 0
        for (const x of [-112, 112]) colonne(x, 0, -560, 24, '#e8dfca', '#cfc2a4', 9100 + x);
        pc([[-100, -560], [100, -560], [100, -40], [-100, -40]], '#6B2E4A', () => { for (let x = -92; x < 100; x += 15) strokePts([[x, -558], [x + 4, -300], [x - 2, -42]], 'rgba(20,4,12,0.45)', 1.6); strokePts([[-100, -540], [100, -540]], OR, 3); hatch(null, 1.2, 4, 0.15); }, 9110);
        pcv(box(-128, -600, 128, -560), '#ddd2b6', () => { for (let x = -120; x < 128; x += 20) fillPts(box(x, -572, x + 9, -562), '#c8bca0'); }, 9111);
        pcv(box(-124, -12, 124, 0), '#cfc2a4', null, 9112);
      }),
      logeAvant: makeProp(270, 240, () => {                                      // balustrade (rampe 186–196 au-dessus du plancher, origine = plancher) + drapé
        pcv(box(-128, -196, 128, -180), '#ddd2b6', null, 9120);
        for (let x = -112; x <= 112; x += 24) pc([[x - 6, -180], [x + 6, -180], [x + 10, -150], [x + 6, -120], [x + 9, -96], [x - 9, -96], [x - 6, -120], [x - 10, -150]], '#e2d8be', () => shade(x - 10, 0, x + 10, 0, 0.3, [x - 12, -182, x + 12, -94]), 9121 + x);
        pcv(box(-128, -100, 128, -84), '#ddd2b6', null, 9140);
        pc([[-128, -186], [128, -186], [122, -126], [84, -150], [42, -116], [0, -150], [-42, -116], [-84, -150], [-122, -126]], '#6B2E4A', () => { for (let x = -120; x < 128; x += 16) strokePts([[x, -184], [x, -120]], 'rgba(20,4,12,0.45)', 1.4); strokePts([[-128, -182], [128, -182]], OR, 3); }, 9141);
        pcv(box(-132, -84, 132, 0), '#c8b898', () => { fillPts(box(-132, -84, 132, -72), '#bcae8e'); strokePts(box(-100, -64, 100, -14).concat([[-100, -64]]), 'rgba(90,70,40,0.35)', 1.4); }, 9142);
      }),
      logePodium: makeProp(270, 260, () => {                                     // podium de la loge, du plancher (−240) au sol de scène (0)
        pcv(box(-132, -240, 132, 0), '#c8b898', () => { fillPts(box(-132, -240, 132, -228), '#bcae8e'); for (let y = -200; y < 0; y += 40) strokePts([[-132, y], [132, y]], 'rgba(90,70,40,0.3)', 1); for (const x of [-70, 70]) strokePts(box(x - 44, -210, x + 44, -24).concat([[x - 44, -210]]), 'rgba(90,70,40,0.4)', 1.6); hatch(null, 0.9, 6, 0.1); }, 9143);
      }),
      panier: makeProp(200, 120, () => {
        pc([[-80, -60], [80, -60], [64, 0, 1], [-64, 0, 1]], '#b8945a', () => { for (let y = -54; y < 0; y += 10) strokePts([[-78, y], [78, y]], 'rgba(90,60,20,0.5)', 1.6); for (let x = -70; x < 80; x += 14) strokePts([[x, -60], [x * 0.85, 0]], 'rgba(90,60,20,0.35)', 1.2); }, 9150);
        for (const [i, x] of [-48, -12, 26, 58].entries()) { const cc = cx_(); cc.save(); cc.translate(x, -66 - (i % 2) * 8); cc.scale(0.36, 0.36); drawPain({ croque: 0 }); cc.restore(); }
      }),
    };
  }
  function velum(t, y0, y1) {                                                  // velum de toile tendu au-dessus de tout, qui ondule
    const n = 9, w = W / n;
    for (let i = 0; i < n; i++) {
      const xa = i * w - 6, xb = (i + 1) * w + 6, pts = [];
      pts.push([xa, y0, 1], [xb, y0, 1]);
      for (let k = 8; k >= 0; k--) { const x = lerp(xa, xb, k / 8); pts.push([x, y1 + Math.sin(k / 8 * PI) * 10 + (k % 2 ? 6 : 0) + 7 * Math.sin(t * 1.7 + i * 1.3 + k * 0.5), k === 0 || k === 8 ? 1 : 0]); }
      pc(pts, i % 2 ? '#e6dcc3' : '#c9a24a', () => { for (let k = 1; k < 4; k++) strokePts([[lerp(xa, xb, k / 4), y0], [lerp(xa, xb, k / 4) + 6 * Math.sin(t + k), y1 + 20]], 'rgba(90,60,20,0.25)', 1.2); }, 9200 + i);
    }
    if (!SIL()) { const c = cx_(); c.save(); c.strokeStyle = 'rgba(60,40,20,0.6)'; c.lineWidth = 1.4; for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * w, y0); c.lineTo(i * w + (i - n / 2) * 6, ST.top - 10); c.stroke(); } c.restore(); }
  }
  function foule(t) {                                                         // foule peinte des gradins d'en face qui ondule (ombres colorées)
    const cols = ['#8A2F2A', '#3F5A7A', '#c9a24a', '#5E6B4A', '#e6dcc3', '#6B2E4A', '#a0603a', '#4F6478'], R = M.rng(9300);
    for (let row = 0; row < 5; row++) for (let i = 0; i < 34; i++) {
      const x = -10 + i * 33 + (row % 2) * 16 + (R() - 0.5) * 10, y = 712 + row * 30 + 2 * Math.sin(t * 3 + x * 0.04 + row), col = cols[Math.floor(R() * cols.length)], up = Math.max(0, Math.sin(t * 2.2 - x * 0.012)) * 7;
      fillPts([[x - 9, y + 16], [x - 8, y + 2], [x + 8, y + 2], [x + 9, y + 16]], col); dot(x, y - 4 - up * 0.3, 6.4, R() < 0.5 ? '#c8a07a' : '#a87a58');
      if (up > 5 && i % 4 === row % 4) strokePts([[x + 6, y + 2], [x + 10, y - 16 - up]], col, 3);
    }
  }
  // o : fanion (instant local : le fanion bleu de droite se décroche et retombe) ; marchand (instant local : un marchand de pains passe au fond en 7 s) ; cast
  PEJ.cirque = function (t, o) {
    o = o || {}; const K = PEJ.K, c = cx_(), g = M.tg(t), cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    c.drawImage(K.cqFond, 0, 0);
    foule(g);
    M.oiseaux(g % 9, { x0: -80, x1: 1160, y: 520, t0: 0, dur: 8, n: 4, s: 0.4, seed: 22, col: '#4a4650', brume: 0.3 });
    if (o.marchand != null) { const u = (t - o.marchand) / 7; if (u > 0 && u < 1) { const x = lerp(1000, 80, u), y = 1000 - Math.abs(Math.sin(t * 6)) * 3; if (!SIL()) { c.save(); c.fillStyle = 'rgba(70,58,48,0.75)';
      c.fillRect(x - 10, y - 110, 20, 80); c.fillRect(x - 8, y - 30, 7, 30); c.fillRect(x + 1, y - 30, 7, 30); c.beginPath(); c.arc(x + 2, y - 122, 11, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + 2, y - 140, 26, 8, 0, 0, TAU); c.fill(); c.fillRect(x - 6, y - 104, 26, 6); c.restore(); } } }
    M.flat(K.cqProps.logeFond, CIRQUE.loge.cx, CIRQUE.loge.sol + 12, { cast });
    velum(g, 270, 352);
  };
  PEJ.cirqueGradins = function (t, o) {                                       // APRÈS M.drawFloor(), avant les spectateurs : deux gradins praticables + podium de la loge
    const c = cx_(), G = CIRQUE.gradins;
    for (const [i, gr] of [[1, G[1]], [0, G[0]]]) {
      pcv(box(gr.x0, gr.haut, gr.x1, gr.haut + 120), i ? '#8e7a5a' : '#a28c68', () => {
        fillPts(box(gr.x0, gr.haut, gr.x1, gr.haut + 14), i ? '#cdbb94' : '#dccaa2'); fillPts(box(gr.x0, gr.haut + 14, gr.x1, gr.haut + 30), 'rgba(40,25,10,0.35)');
        for (let x = gr.x0 + 20 + i * 30; x < gr.x1; x += 92) strokePts([[x, gr.haut + 12], [x, gr.haut + 120]], 'rgba(80,60,30,0.4)', 1.4);
        strokePts([[gr.x0, gr.haut + 66], [gr.x1, gr.haut + 66]], 'rgba(80,60,30,0.3)', 1.2); hatch(null, 0.9, 6, 0.12); shade(0, gr.haut, 0, gr.haut + 120, 0.3, [gr.x0, gr.haut, gr.x1, gr.haut + 120]);
      }, 9400 + i);
    }
    for (const [i, [x, gi, col]] of [[230, 0, '#8A2F2A'], [560, 0, '#3F5A7A'], [330, 1, '#c9a24a'], [620, 1, '#5E6B4A']].entries()) { const y = G[gi].haut; pc([[x - 44, y + 2], [x - 40, y - 10], [x + 40, y - 10], [x + 44, y + 2]], col, () => strokePts([[x - 36, y - 6], [x + 36, y - 6]], 'rgba(255,240,210,0.3)', 1.2), 9410 + i); }   // coussins
    amphore(150, G[1].haut, 70, '#a0603a', 9420);
    M.flat(PEJ.K.cqProps.logePodium, CIRQUE.loge.cx, FEET, { clipY: null });
  };
  PEJ.cirqueLoge = function (t, o) {                                          // APRÈS l'empereur : balustrade et drapé de la loge (il est caché sous la taille)
    M.flat(PEJ.K.cqProps.logeAvant, CIRQUE.loge.cx, CIRQUE.loge.sol + 2, { cast: (o && o.cast) || { dx: 14, dy: 6, a: 0.3 } });
  };
  PEJ.cirqueAvant = function (t, o) {                                         // après les marionnettes : balustrade basse aux coins, panier de pains, fanions rouge et bleu
    o = o || {}; const K = PEJ.K, g = M.tg(t), cast = { dx: 10, dy: 4, a: 0.25 };
    for (const [x0, x1] of [[30, 290], [790, 1050]]) { pcv(box(x0, 1500, x1, 1516), '#ddd2b6', null, 9500 + x0); for (let x = x0 + 12; x < x1; x += 28) pcv(box(x - 5, 1516, x + 5, 1600), '#d2c6aa', null, 9501 + x); pcv(box(x0, 1600, x1, 1616), '#ddd2b6', null, 9502 + x0); }
    M.flat(K.cqProps.panier, 170, 1502, { cast, scale: 0.9 });
    hampe(80, 1640, 1436); fanion(83, 1440, 120, 64, ROUGE, g, 0, 9510);
    const u = o.fanion == null ? -1 : (t - o.fanion) / 1.8;
    hampe(1000, 1640, 1436);
    if (u < 0) fanion(997, 1440, -120, 64, BLEU, g, 1.5, 9511);
    else { const k = clamp(u), x = 940 - 60 * k + 30 * Math.sin(k * 9), y = lerp(1470, 1600, easeIn(k)), cc = cx_(); cc.save(); cc.translate(x, y); cc.rotate(k * 2.4 + 0.3 * Math.sin(k * 12)); fanion(-60, -35, 120, 70, BLEU, g, 1.5, 9511); cc.restore(); }
  };

  // ------------------------------------------------------------------ pré-rendus
  PEJ.init = function () {
    PEJ.K = {
      ciFond: makeCineFond(), ciRangs: makeCineRangs(), ciPorte: makeCinePorte(), ciAvant: makeCineAvant(),
      foFond: makeForumFond(), foProps: makeForumProps(), foNuages: [nuagePapier(8681, 120, 46), nuagePapier(8682, 90, 36), nuagePapier(8683, 140, 52)],
      cqFond: makeCirqueFond(), cqProps: makeCirqueProps(),
    };
    return PEJ.K;
  };
})();
