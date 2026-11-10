// persos.js — « Alfred Nobel, le marchand de mort qui inventa la paix » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.nob (alias NOB). Appeler NOB.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre, logo ni symbole connu. Déterministe (hash, M.rng ; aucun Math.random).
// MARIONNETTES : NOB.alfred / laureate / mc / notaire / neveu / niece (pose, x, y, s, o) — renvoient r (r.w, r.q, r.tenu) ; NOB.pt(r, 'nom').
// ACCESSOIRES  : NOB.colombe, portrait, medaille, diplome, dynamite, journal, testament, eventail, medaillon(i, …), NOB.pouf(t, x, y, k, o).
// DÉCORS       : NOB.salle(t, up, o) + NOB.salleSol(t, o) ; NOB.cabinet(t, up, o) + NOB.cabinetSol(t, o) ; pré-rendus par NOB.init().
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, easeOut, hash, noise, smooth } = M;
  const NOB = (M.nob = {});
  const CH = M.chars, ST = M.ST;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  function ribbon(line, w0, w1) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1 == null ? w0 : w1, i / Math.max(1, line.length - 1)) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  // volute ronde irrégulière (fumée, nuage, feuillage) : aucun angle vif
  function blobPts(cx, cy, r, seed, n, irr) {
    n = n || 11; irr = irr == null ? 0.22 : irr; const o = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + hash(seed * 7 + i) * 0.3; const rr = r * (1 - irr / 2 + irr * hash(seed * 13 + i * 3)); o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92]); }
    return o;
  }
  // texte simulé : lignes ondulées
  function lignes(x0, x1, y0, y1, pas, col, lw, seed) {
    let k = 0;
    for (let y = y0; y <= y1; y += pas) {
      const pts = [], fin = x1 - (hash(seed + k) < 0.25 ? (x1 - x0) * 0.35 : 0);
      for (let x = x0; x <= fin; x += 6) pts.push([x, y + 1.3 * Math.sin(x * 0.45 + k * 1.7 + seed)]);
      if (pts.length > 1) strokePts(pts, col, lw || 1.1); k++;
    }
  }
  NOB.geo = { ep, ell, rect, rrect, ribbon, qbez, blobPts };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const OR = { or: '#c9a24a', orL: '#e6c877', orD: '#8d6b25', orDD: '#5e4515' };

  // ------------------------------------------------------------ bras et jambes à articulations rondes
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  // manche gigot : bras supérieur bouffant
  function armGigot(len) { return ep(0, 0, 21, 21, 10, PI, TAU).concat([[26, 18], [24, 46], [R_COUDE + 1, len - 8]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 1, len - 8], [-22, 50], [-24, 20]]); }
  // jambe en deux pièces : cuisse (hanche → genou y 112) et tibia + pied (genou → semelle y 125)
  const L_CUISSE = 112;
  const THIGH = ep(0, 0, 20, 20, 10, PI, TAU).concat([[21, 30], [17, L_CUISSE - 6]], ep(0, L_CUISSE, 16.5, 16.5, 10, 0, PI), [[-17, L_CUISSE - 6], [-21, 30]]);
  const SHIN = ep(0, 0, 16.5, 16.5, 10, PI, TAU).concat([[17, 10], [15, 58], [13, 93], [15, 107], [40, 111], [48, 121, 1], [46, 124, 1], [-17, 125, 1], [-20, 110], [-19, 68], [-21, 28], [-18, 8]]);
  // IK deux segments dans le repère du torse : toujours le coude vers l'avant (avant-bras plié en négatif)
  function ik2(S, T) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const b = normA(Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI - a);
      if (!best || -b > best.sc) best = { a: normA(a), b, sc: -b };
    }
    return best;
  }
  function handPt(q, arm, px, py) {           // point local de l'avant-bras → repère du torse
    const S = arm === 'armF' ? SH_F : SH_B, A = q.ang;
    return mp(new DOMMatrix().translate(S[0], S[1]).rotate((A[arm + '_up'] || 0) * D).translate(0, LA).rotate((A[arm + '_lo'] || 0) * D), [px, py]);
  }

  // ------------------------------------------------------------ objets tenus : registre OBJ (rempli plus bas)
  const OBJ = {};
  NOB.OBJ = OBJ;
  const has = (v) => v && v !== 'rien';
  const objOf = (name) => (typeof name === 'function' ? { draw: name, grip: [0, 0], pts: {} } : OBJ[name]);
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, nom, o) => { const q = ob.pts && ob.pts[nom]; return q ? (typeof q === 'function' ? q(o) : q) : null; };
  function heldOpts(name, o, p) { const ob = objOf(name); return Object.assign({ t: p.t || 0 }, (ob && ob.held) || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = objOf(name); if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]);
    if (ob.contre && p._dir < 0) { const cc = ob.centre ? ob.centre(oo) : [0, 0]; c.translate(cc[0], cc[1]); c.scale(-1, 1); c.translate(-cc[0], -cc[1]); }
    ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const isPlat = (n) => { const ob = has(n) && objOf(n); return !!(ob && ob.plat); };
  function heldParts(skin, seed) {
    const doigtsF = (p) => has(p.tenu) && !isPlat(p.tenu) && p.handF !== 'open' && !(objOf(p.tenu) || {}).sansDoigts;
    const doigtsBk = (p) => (has(p.tenuB) && !isPlat(p.tenuB) && p.handB !== 'open') || (p._deux && !isPlat(p.tenu) && p.handB !== 'open');
    return {
      plat: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (isPlat(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !isPlat(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (doigtsF(p) ? DOIGTS : OFFP), paint: doigtsPaint },
      platB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 6, pts: OFFP, extra: (p) => { if (isPlat(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB) && !isPlat(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (doigtsBk(p) ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par une marionnette NOB.xxx
  NOB.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = has(name) && objOf(name); if (!ob) return null;
    const oo = (arriere ? r.tenuBO : r.tenuO) || {}, q = ptOf(ob, nom, oo); if (!q) return null;
    const g = gripOf(ob, oo); let px = q[0], py = q[1];
    if (ob.contre && r.q._dir < 0) { const cc = ob.centre ? ob.centre(oo) : [0, 0]; px = 2 * cc[0] - px; }
    return r.w(arriere ? (isPlat(name) ? 'platB' : 'objetB') : (isPlat(name) ? 'plat' : 'objet'), px - g[0], py - g[1]);
  };

  // ------------------------------------------------------------ poses : préparation commune
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function armTo(q, arm, T, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const fset = (q, key, v) => { if (q.face[key] == null) q.face[key] = v; };
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  // marche : jambes en deux pièces, petit balancement des bras (gardé petit : sinon « main derrière le dos »)
  function marche(q, k) {
    if (!(k > 0)) return;
    const ph = (q.t || 0) * TAU * (q.cadence || 1.1), s = Math.sin(ph), A = q.ang;
    A.legF = (A.legF || 0) - 0.34 * s * k; A.legB = (A.legB || 0) + 0.34 * s * k;
    A.legF_lo = (A.legF_lo || 0) + Math.max(0, s) * 0.35 * k; A.legB_lo = (A.legB_lo || 0) + Math.max(0, -s) * 0.35 * k;
    A.armF_up = (A.armF_up || 0) + 0.12 * s * k; A.armB_up = (A.armB_up || 0) - 0.12 * s * k;
    A.armF_lo = (A.armF_lo || 0) - 0.15 * k; A.armB_lo = (A.armB_lo || 0) - 0.15 * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 6 * k;
  }
  // assis : cuisses à l'horizontale, tibias verticaux ; le bassin descend de 115 (siège ≈ 108 au-dessus des pieds)
  function assis(q, k) {
    if (!(k > 0)) return;
    const A = q.ang;
    A.legF = (A.legF || 0) - 1.52 * k; A.legB = (A.legB || 0) - 1.46 * k;
    A.legF_lo = (A.legF_lo || 0) + 1.52 * k; A.legB_lo = (A.legB_lo || 0) + 1.46 * k;
    q.dy = (q.dy || 0) + 115 * k;
  }
  // repère du torse depuis l'écran (pour vers / versB)
  function toLocal(def, q, x, y, s, dir, P_) {
    const root = new DOMMatrix().translate(x, y).scale(s * dir, s).rotate((q.tilt || 0) * D).translate(q.dx || 0, def.hipY + (q.dy || 0));
    const pt = new DOMPoint(P_[0], P_[1]).matrixTransform(root.inverse()); return [pt.x, pt.y];
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !q.handF) q.handF = 'fist';
    if (has(q.tenuB) && !q.handB) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.plat = A.objet; A.platB = A.objetB;
    q._deux = false;
    const ob = has(q.tenu) && objOf(q.tenu);
    const deux = q.deuxMains != null ? q.deuxMains : !!(ob && ob.deuxMains);
    if (deux && ob && ob.p2) {
      const oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      let p2 = ob.p2(oo);
      if (ob.contre && q._dir < 0) { const cc = ob.centre ? ob.centre(oo) : [0, 0]; p2 = [2 * cc[0] - p2[0], p2[1]]; }
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, p2));
      A.armB_up = sol.a; A.armB_lo = sol.b; if (!q.handB) q.handB = ob.paume ? 'open' : 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o || {});
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && objOf(q.tenu)) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && objOf(q.tenuB)) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // enveloppe commune : geste propre (poseFn) → vers/versB (cibles écran) → objets/seconde main → M.puppet
  function wrapper(def, poseFn, sDef) {
    const full = (pose, x, y, s, dir) => {
      const q = poseFn(pose); q._dir = dir;
      if (q.vers) {
        let L = toLocal(def, q, x, y, s, dir, q.vers);
        if (q.versPt && has(q.tenu)) {                // vers vise un point nommé de l'objet tenu (ex. 'pointe' de la plume)
          const ob = objOf(q.tenu), oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), pp = ptOf(ob, q.versPt, oo);
          if (pp) L = [L[0] - (pp[0] - g[0]), L[1] - (pp[1] - g[1])];
        }
        if (q._grib) L = [L[0] + q._grib[0], L[1] + q._grib[1]];
        armTo(q, 'armF', L, q.versK == null ? 1 : q.versK);
      }
      if (q.versB) armTo(q, 'armB', toLocal(def, q, x, y, s, dir, q.versB), q.versBK == null ? 1 : q.versBK);
      if (q._apres) q._apres(q);
      return finish(q);
    };
    const fn = (pose, x, y, s, o) => { o = o || {}; s = s == null ? sDef : s; return run(def, full(pose, x, y, s, o.dir || 1), x, y, s, o); };
    fn.pose = (pose, x, y, s, dir) => full(pose, x, y, s == null ? sDef : s, dir || 1);
    return fn;
  }

  // ------------------------------------------------------------ pièces de corps communes
  function foreDef(parent, base, skin, back, seed, cuffCol, extraPaint) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (cuffCol) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
      if (extraPaint) extraPaint(p);
    } };
  }
  const upDef = (at, base, seed, pts) => ({ parent: 'torso', at, pts: pts || armR(LA), base, seed, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28) });
  function legDefs(side, base, shoe, seed, extraPaint) {
    const back = side === 'B', at = back ? [-6, -2] : [6, -2], n = 'leg' + side;
    return {
      [n]: { parent: 'torso', at, pts: THIGH, base, seed, noRivet: back, paint: () => { if (extraPaint) extraPaint(); hatch(back ? null : [[-22, -10], [-6, -10], [-6, 120], [-22, 120]], 0.8, back ? 3.6 : 4, back ? 0.3 : 0.25); } },
      [n + '_lo']: { parent: n, at: [0, L_CUISSE], pts: SHIN, base, seed: seed + 1, noRivet: back, paint: () => {
        fillPts([[-40, 102, 1], [60, 102, 1], [60, 140, 1], [-40, 140, 1]], shoe);
        if (!back) { strokePts([[20, 112], [42, 117]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-22, -10], [-6, -10], [-6, 102], [-22, 102]], 0.8, 4, 0.25); }
        else hatch(null, 0.8, 3.6, 0.3);
      } },
    };
  }
  // tête qui se retourne (regarder derrière) : écrasement horizontal hs ∈ [−1,−0,25] ∪ [0,25, 1], jamais plus étroit
  const hsOf = (p) => (p._hs == null ? 1 : p._hs);
  function headDef(pts, base, seed, paint) {
    return { parent: 'torso', at: [6, -170], pts: (p) => scl(pts, hsOf(p), 1), base, seed, noRivet: true, paint: (p) => {
      const c = cx_(), hs = hsOf(p); c.save(); c.scale(hs, 1); paint(p); c.restore();
    } };
  }
  function headChild(pts, base, seed, paint, opt) {
    return Object.assign({ parent: 'head', at: [0, 0], noRivet: true, base, seed, pts: (p) => scl(typeof pts === 'function' ? pts(p) : pts, hsOf(p), 1),
      paint: paint ? (p) => { const c = cx_(); c.save(); c.scale(hsOf(p), 1); paint(p); c.restore(); } : undefined }, opt || {});
  }
  const ORDER = (heads, after) => ['plat', 'armB_up', 'armB_lo', 'platB', 'objetB', 'legB', 'legB_lo', 'legF', 'legF_lo', 'head'].concat(heads, ['torso'], after || [], ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);
  const ORDER_ROBE = (heads, after) => ['plat', 'armB_up', 'armB_lo', 'platB', 'objetB', 'jupe', 'head'].concat(heads, ['torso'], after || [], ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);
  function lunettesRondes(x, y, r, col) {
    const ring = ell(x, y, r, r, 14);
    fillPts(ring, 'rgba(200,225,235,0.22)', 0, 0); strokePts(ring.concat([ring[0]]), col, 1.5);
    strokePts([[x - r, y - 1], [-26, y - 4]], col, 1.2); strokePts([[x - 3, y - 6], [x + 2, y - 7]], 'rgba(255,255,255,0.7)', 1.1);
  }

  // =====================================================================
  // OBJETS — dessinés dans leur repère, échelle 1 ; seuls (accessoires) ou tenus (pièces plat / objet de l'avant-bras)
  // =====================================================================
  const DY = { brique: '#a2402e', briqueL: '#c0583f', briqueD: '#7a2c20', cire: '#e6dcc0', ficelle: '#c8b48a', meche: '#5a4a32' };
  // ---------------- bâtons de dynamite (couchés ; o.debout = bâtons verticaux, mèche en haut)
  const MECHE = [[80, 0], [96, -4], [112, -16], [122, -34], [124, -54], [118, -72], [108, -84]];
  function mechePts(o) {                                              // mèche restante (o.longueur 0..1)
    const L = clamp(o.longueur == null ? 1 : o.longueur), n = MECHE.length - 1, f = 0.15 + 0.85 * L, k = f * n, i = Math.floor(k), u = k - i;
    const pts = MECHE.slice(0, i + 1); if (i < n) pts.push([lerp(MECHE[i][0], MECHE[i + 1][0], u), lerp(MECHE[i][1], MECHE[i + 1][1], u)]);
    return pts;
  }
  function baton(y, seed, avecMeche) {
    pc([[-80, y - 18], [-74, y - 18], [74, y - 18], [80, y - 18], [83, y], [80, y + 18], [-80, y + 18], [-83, y]], DY.brique, () => {
      fillPts(rect(-80, y - 18, 80, y - 11), DY.briqueL); fillPts(rect(-80, y + 10, 80, y + 18), DY.briqueD);
      for (const xe of [-80, 64]) { fillPts(rect(xe, y - 18, xe + 16, y + 18), DY.cire); for (let k = 0; k < 4; k++) strokePts([[xe + 3 + k * 4, y - 16], [xe + 2 + k * 4, y + 16]], 'rgba(120,100,70,0.45)', 0.9); }
      strokePts([[-60, y - 6], [56, y - 6]], 'rgba(255,220,190,0.35)', 1.3);
      hatch(null, 0.15, 3.6, 0.2, 1, P.encre, [-84, y - 20, 84, y + 20]);
    }, seed);
    if (avecMeche) dot(82, y, 4, DY.meche);
  }
  function drawDynamite(o) {
    const c = cx_(), n = o.n === 1 ? 1 : 3, t = o.t || 0;
    c.save(); if (o.debout) c.rotate(-PI / 2);
    const ys = n === 1 ? [0] : [-30, 30, 0];
    // mèche tressée (de la tête du bâton du milieu)
    const mp_ = o.debout ? mechePts(o).map((p) => [p[0], -p[1]]) : mechePts(o);
    for (let i = 0; i < ys.length; i++) baton(ys[i], 4101 + i, i === ys.length - 1);
    if (n === 3) for (const xf of [-40, 40]) pc([[xf - 4, -49, 1], [xf + 4, -49, 1], [xf + 4, 49, 1], [xf - 4, 49, 1]], DY.ficelle, () => { for (let y = -46; y < 48; y += 7) strokePts([[xf - 4, y], [xf + 4, y + 3]], 'rgba(90,70,40,0.6)', 1); }, 4110 + xf, { drop: false });
    if (n === 3) pc(ell(40, -50, 6, 4, 10), DY.ficelle, null, 4115, { drop: false });
    pc(ribbon(mp_, 6.5, 5.5), DY.meche, () => { for (let i = 1; i < mp_.length; i++) strokePts([mp_[i - 1], mp_[i]], 'rgba(220,200,160,0.5)', 1, false); }, 4120, { drop: false });
    const tip = mp_[mp_.length - 1], m = clamp(o.meche || 0);
    c.restore();
    if (m > 0 && !SIL()) {
      const T = o.debout ? [tip[1], -tip[0]] : tip;
      c.save(); c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(T[0], T[1], 1, T[0], T[1], 34 * m); gl.addColorStop(0, `rgba(255,220,120,${0.9 * m})`); gl.addColorStop(1, 'rgba(255,140,40,0)');
      c.fillStyle = gl; c.beginPath(); c.arc(T[0], T[1], 34 * m, 0, TAU); c.fill();
      for (let i = 0; i < 14; i++) {
        const u = ((t * 2.6 + hash(i * 3.1)) % 1), a = hash(i * 7.7) * TAU + t * 3, d = (8 + 30 * hash(i + 2)) * u * m;
        const sx = T[0] + Math.cos(a) * d, sy = T[1] + Math.sin(a) * d + 12 * u * u;
        c.strokeStyle = `rgba(255,${170 + 60 * hash(i)},70,${(1 - u) * m})`; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - Math.cos(a) * 5, sy - Math.sin(a) * 5); c.stroke();
      }
      c.fillStyle = `rgba(255,250,220,${m})`; c.beginPath(); c.arc(T[0], T[1], 3.5 + 1.5 * Math.sin(t * 40), 0, TAU); c.fill();
      c.restore();
    }
  }
  const dynPt = (o, p) => (o.debout ? [-p[1], -p[0]] : p);

  // ---------------- journal-nécrologie (centre de la page ; o.k = taille, o.face 'mort'|'caricature', o.plie 0..1)
  const JW = 360, JH = 460, PAPIER = '#e4ddcb', PAPIERD = '#c9c0aa', ENCRE = 'rgba(70,64,58,0.75)';
  function gravureAlfred(cx, cy, s, sourire) {        // petit buste gravé d'Alfred (sépia), de 3/4
    const k = s;
    pc(tr(scl([[-46, 40], [-40, 10], [-20, -2], [20, -2], [40, 10], [46, 40]], k), cx, cy), '#5d6068', () => { strokePts(tr(scl([[-6, 0], [0, 30], [6, 0]], k), cx, cy), '#f0ead8', 2); fillPts(tr(scl([[-7, 2], [0, 8], [7, 2], [0, -2]], k), cx, cy), '#1c1a1a'); hatch(null, 0.8, 3, 0.35); }, 4201, { drop: false });
    pc(tr(scl(ell(0, -26, 20, 26, 16), k), cx, cy), '#d8c2a2', () => {
      fillPts(tr(scl([[-20, -30], [-14, -18], [-14, -6], [-20, -10]], k), cx, cy), '#4a3626'); fillPts(tr(scl([[20, -30], [14, -18], [14, -6], [20, -10]], k), cx, cy), '#4a3626');
      fillPts(tr(scl([[-17, -16], [-10, -4], [0, 2], [10, -4], [17, -16], [19, -4], [12, 4], [0, 10], [-12, 4], [-19, -4]], k), cx, cy), '#3e2c20');
      strokePts(tr(scl(sourire ? [[-7, -9], [0, -6], [7, -9]] : [[-7, -8], [7, -8]], k), cx, cy), '#3e2c20', 1.6);
      for (const ex of [-7, 7]) dot(cx + ex * k, cy - 26 * k, 1.6 * k, '#2a2020');
      for (const ex of [-7, 7]) strokePts(tr(scl([[ex - 5, -32], [ex + 5, -32]], k), cx, cy), '#3e2c20', 1.8);
      hatch(null, 0.9, 3, 0.25);
    }, 4202, { drop: false });
  }
  function caricature(o) {                             // Alfred en marchand derrière son étal de dynamite
    pc(rect(-150, -196, 150, 96), '#ece5d3', () => {
      for (let i = 0; i < 8; i++) fillPts([[-150 + i * 40, -186], [-130 + i * 40, -186], [-126 + i * 40, -150], [-146 + i * 40, -150]], i % 2 ? '#e7dfcc' : 'rgba(90,80,70,0.55)');
      strokePts([[-150, -150], [150, -150]], ENCRE, 1.6);
      for (let i = 0; i < 8; i++) strokePts(ep(-130 + i * 40, -150, 20, 8, 6, 0, PI), ENCRE, 1.2);
      gravureAlfred(-10, -38, 1.7, true);
      // bras tendu qui offre un bâton
      fillPts([[24, -6], [70, -22], [78, -12], [30, 8]], '#5d6068'); dot(80, -18, 7, '#d8c2a2');
      fillPts([[78, -42], [86, -42], [86, 6], [78, 6]], '#8f4b3a'); strokePts([[82, -42], [88, -56], [84, -66]], '#3a2e22', 1.4);
      // comptoir et piles de bâtons
      fillPts(rect(-140, 20, 140, 90), '#b9ad94'); strokePts([[-140, 20], [140, 20]], ENCRE, 2);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - r; i++) { const bx = -128 + i * 18 + r * 9, by = 12 - r * 14; fillPts(rect(bx, by - 12, bx + 16, by), '#9a5544'); strokePts([[bx, by - 12], [bx + 16, by - 12]], 'rgba(40,20,10,0.6)', 0.8); }
      for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - r; i++) { const bx = 40 + i * 18 + r * 9, by = 12 - r * 14; fillPts(rect(bx, by - 12, bx + 16, by), '#9a5544'); }
      hatch(rect(-140, 24, 140, 90), 0.7, 4, 0.3);
    }, 4210, { drop: false });
    strokePts([[-150, -196], [150, -196], [150, 96], [-150, 96], [-150, -196]], ENCRE, 2);
  }
  function pageJournal(o, dos) {
    pc(rect(-JW / 2, -JH / 2, JW / 2, JH / 2), PAPIER, () => {
      if (dos) { lignes(-160, -10, -200, 210, 11, 'rgba(90,84,76,0.45)', 1, 7); lignes(10, 160, -200, 210, 11, 'rgba(90,84,76,0.45)', 1, 9); return; }
      if (o.face === 'caricature') {
        caricature(o);
        lignes(-160, -86, 110, 214, 10, 'rgba(80,74,66,0.6)', 1, 3); lignes(-74, 0, 110, 214, 10, 'rgba(80,74,66,0.6)', 1, 5);
        lignes(12, 86, 110, 214, 10, 'rgba(80,74,66,0.6)', 1, 8); lignes(98, 160, 110, 214, 10, 'rgba(80,74,66,0.6)', 1, 11);
      } else {
        // bandeau de titre : ornement ondulé épais (aucune lettre)
        for (const y of [-212, -170]) strokePts([[-166, y], [166, y]], ENCRE, 1.6);
        const band = []; for (let x = -130; x <= 130; x += 5) band.push([x, -191 + 5 * Math.sin(x * 0.11)]);
        strokePts(band, 'rgba(50,46,42,0.85)', 7);
        for (const x of [-150, 150]) pc(ell(x, -191, 9, 9, 10), '#5a5550', null, 4230 + x, { drop: false });
        // portrait gravé encadré d'un épais cadre noir de deuil
        pc(rect(-82, -158, 82, -6), '#141214', () => {}, 4231, { drop: false });
        pc(rect(-68, -144, 68, -20), '#e9e2cf', () => { gravureAlfred(0, -70, 1.45, false); hatch(rect(-68, -144, 68, -20), 0.35, 5, 0.12); }, 4232, { drop: false });
        lignes(-166, -96, -150, 0, 10, 'rgba(80,74,66,0.6)', 1, 2); lignes(96, 166, -150, 0, 10, 'rgba(80,74,66,0.6)', 1, 4);
        strokePts([[-166, 12], [166, 12]], ENCRE, 1.4);
        for (let k = 0; k < 4; k++) lignes(-166 + k * 85, -94 + k * 85, 26, 214, 10, 'rgba(80,74,66,0.62)', 1, 20 + k * 5);
        for (let k = 1; k < 4; k++) strokePts([[-170 + k * 85, 22], [-170 + k * 85, 216]], 'rgba(80,74,66,0.35)', 1);
      }
      hatch(null, 0.3, 6, 0.06, 1, P.encre, [-JW / 2, -JH / 2, JW / 2, JH / 2]);
      shade(-JW / 2, 0, JW / 2, 0, 0.12, [-JW / 2, -JH / 2, JW / 2, JH / 2]);
    }, dos ? 4241 : 4240);
  }
  function drawJournal(o) {
    const c = cx_(), k = o.k || 1, f = clamp(o.plie || 0);
    c.save(); c.scale(k, k);
    if (f <= 0.001) pageJournal(o, false);
    else {
      // moitié basse (fixe), puis moitié haute qui se rabat autour du pli (y = 0)
      c.save(); c.beginPath(); c.rect(-JW, 0, 2 * JW, JH); c.clip(); pageJournal(o, false); c.restore();
      const cs = Math.cos(PI * f);
      c.save(); c.scale(1, Math.max(0.02, Math.abs(cs)) * (cs >= 0 ? 1 : -1));
      c.beginPath(); c.rect(-JW, -JH, 2 * JW, JH); c.clip(); pageJournal(o, cs < 0); c.restore();
      if (!SIL()) { c.fillStyle = `rgba(40,30,20,${0.25 * Math.sin(PI * f)})`; c.fillRect(-JW / 2, -6, JW, 12); }
    }
    c.restore();
  }
  // main avant (cote 1) sur le bord lointain, en haut ; main arrière (cote −1) sur le bord proche, plus bas (sinon le bras avant la cache)
  const journalMain = (o, cote) => { const k = o.k || 1; return [cote * JW / 2 * k, (-JH / 2 + (cote > 0 ? 0.28 : 0.74) * JH) * k]; };

  // ---------------- testament (centre ; o.k ; o.icones 0..5 ; o.roule 1 = roulé ; o.dechire 0..1)
  const TW = 300, TH = 400, PARCH = '#eee4cb', SEPIA = 'rgba(100,68,40,0.8)';
  function feuilleTestament(o, crump) {
    const ic = clamp(o.icones || 0, 0, 5);
    const w = crump * 7, out = [];
    for (let i = 0; i <= 10; i++) out.push([lerp(-TW / 2, TW / 2, i / 10), -TH / 2 + w * Math.sin(i * 2.1)]);
    for (let i = 1; i <= 10; i++) out.push([TW / 2 + w * Math.sin(i * 1.7), lerp(-TH / 2, TH / 2, i / 10)]);
    for (let i = 9; i >= 0; i--) out.push([lerp(-TW / 2, TW / 2, i / 10), TH / 2 + w * Math.sin(i * 2.6)]);
    for (let i = 9; i >= 1; i--) out.push([-TW / 2 + w * Math.sin(i * 1.3), lerp(-TH / 2, TH / 2, i / 10)]);
    pc(out.map((p) => [p[0], p[1], 1]), PARCH, () => {
      const fl = []; for (let x = -70; x <= 70; x += 4) fl.push([x, -168 + 6 * Math.sin(x * 0.09)]);
      strokePts(fl, 'rgba(90,58,32,0.9)', 3.2);
      strokePts([[-60, -154], [60, -154]], 'rgba(120,80,40,0.5)', 1);
      lignes(-88, 126, -132, 104, 13, SEPIA, 1.25, 31);
      strokePts([[-104, -140], [-104, 160]], 'rgba(160,80,60,0.35)', 1);
      // paraphe (trait ondulé) et sceau de cire rouge
      const pa = []; for (let x = -20; x <= 50; x += 3) pa.push([x, 146 + 7 * Math.sin(x * 0.2) - (x - 15) * 0.15]);
      strokePts(pa, 'rgba(80,50,28,0.95)', 2);
      // marge : vignettes des prix qui apparaissent une à une
      for (let i = 0; i < 5; i++) {
        const a = clamp(ic - i); if (a <= 0) continue;
        const kk = a < 1 ? easeOut(a) * (1 + 0.25 * Math.sin(a * PI)) : 1;
        const c = cx_(); c.save(); c.translate(-126, -112 + i * 52); c.scale(kk, kk); icone(i, 19, true); c.restore();
      }
      if (crump > 0) { const R = M.rng(77); for (let i = 0; i < 9; i++) { const x0 = -140 + R() * 280, y0 = -190 + R() * 380; strokePts([[x0, y0], [x0 + (R() - 0.5) * 90, y0 + (R() - 0.5) * 90], [x0 + (R() - 0.5) * 140, y0 + (R() - 0.5) * 140]], `rgba(110,80,50,${0.45 * crump})`, 1.2); } }
      hatch(null, 0.3, 6, 0.07, 1, P.encre, [-TW / 2, -TH / 2, TW / 2, TH / 2]);
      shade(-TW / 2, -TH / 2, TW / 2, TH / 2, 0.14, [-TW / 2 - 10, -TH / 2 - 10, TW / 2 + 10, TH / 2 + 10]);
    }, 4301);
    pc(blobPts(96, 150, 26, 5, 12, 0.18), '#9e2a22', () => { strokePts(ep(96, 150, 16, 16, 14, 0, TAU), 'rgba(60,10,8,0.6)', 2); fillPts([[90, 142], [102, 144], [98, 156], [92, 154]], 'rgba(255,180,160,0.25)'); strokePts([[88, 152], [96, 140], [104, 152]], 'rgba(60,10,8,0.5)', 1.6); }, 4302);
  }
  function drawTestament(o) {
    const c = cx_(), k = o.k || 1, r = clamp(o.deroule != null ? 1 - o.deroule : (o.roule || 0)), d = clamp(o.dechire || 0);
    c.save(); c.scale(k, k);
    if (r > 0.001) {
      const yc = lerp(TH / 2, -TH / 2 + 4, r);
      if (r < 0.99) { c.save(); c.beginPath(); c.rect(-TW, -TH, 2 * TW, yc + TH); c.clip(); feuilleTestament(o, 0); c.restore(); }
      pc(rrect(-TW / 2 - 6, yc - 17, TW / 2 + 6, yc + 17, 16), '#e2d6b6', () => { strokePts([[-TW / 2, yc - 6], [TW / 2, yc - 6]], 'rgba(255,255,255,0.5)', 2); shade(0, yc - 17, 0, yc + 17, 0.35, [-TW, yc - 20, TW, yc + 20]); }, 4310);
      if (r > 0.9) { pc(rect(-10, yc - 19, 10, yc + 19), '#8e2a24', null, 4311); pc([[0, yc + 8], [-14, yc + 40], [-4, yc + 36], [4, yc + 12]], '#8e2a24', null, 4312); }
    } else if (d < 0.4) feuilleTestament(o, d / 0.4);
    else {
      const u = (d - 0.4) / 0.6, yT = -TH / 2 + u * TH * 0.72, zz = [];
      for (let i = 0; i <= 12; i++) { const y = lerp(-TH / 2 - 10, yT, i / 12); zz.push([(i % 2 ? 7 : -7) * (0.6 + 0.4 * hash(i)), y]); }
      for (const sd of [-1, 1]) {
        c.save(); c.translate(sd * 8 * u, 0); c.rotate(sd * 0.05 * u);
        c.beginPath();
        if (sd < 0) { c.moveTo(-TW, -TH); for (const p of zz) c.lineTo(p[0], p[1]); c.lineTo(0, yT); c.lineTo(0, TH); c.lineTo(-TW, TH); }
        else { c.moveTo(TW, -TH); for (const p of zz) c.lineTo(p[0], p[1]); c.lineTo(0, yT); c.lineTo(0, TH); c.lineTo(TW, TH); }
        c.closePath(); c.clip(); feuilleTestament(o, 1); c.restore();
      }
    }
    c.restore();
  }
  const testamentMain = (o, cote) => { const k = o.k || 1; return [cote * TW / 2 * k, (-TH / 2 + (cote > 0 ? 0.28 : 0.74) * TH) * k]; };

  // ---------------- vignettes des cinq prix (centre ; r = rayon utile)
  function icone(i, r, encre) {
    const s = r / 40, c = cx_(); c.save(); c.scale(s, s);
    const L = encre ? '#6a4628' : '#efe6cc', L2 = encre ? '#a0402e' : '#e6c877', L3 = encre ? '#3f6a6a' : '#cfe0dc';
    if (i === 0) {           // aimant en fer à cheval + lignes de champ
      c.save(); c.rotate(-0.8);
      pc(ep(0, 4, 28, 28, 12, 0, PI).concat([[-28, -24, 1], [-12, -24, 1]], ep(0, 4, 12, 12, 10, PI, 0), [[12, -24, 1], [28, -24, 1]]), L2, () => strokePts(ep(0, 4, 20, 20, 10, 0.2, PI - 0.2), 'rgba(255,255,255,0.35)', 2), 4401, { drop: false });
      for (const x of [-20, 20]) pc(rect(x - 8, -36, x + 8, -24), '#e2e0d8', null, 4402 + x, { drop: false });
      c.restore();
      for (const rr of [14, 24]) strokePts(ep(-14, -18, rr, rr * 0.8, 10, PI * 1.05, PI * 1.6), L, 1.6);
    } else if (i === 1) {    // fiole
      pc([[-6, -34], [6, -34], [6, -12], [24, 22], [22, 30, 1], [-22, 30, 1], [-24, 22], [-6, -12]], L3, () => fillPts([[-17, 12], [17, 12], [24, 30], [-24, 30]], L2), 4405, { drop: false });
      pc(rect(-8, -40, 8, -32), L, null, 4406, { drop: false });
      for (const [bx, by, br] of [[2, -46, 3], [-4, -54, 2.2]]) dot(bx, by, br, L3);
    } else if (i === 2) {    // pilon et mortier
      pc([[-14, -40], [-6, -44], [14, -6], [8, -2]], L, null, 4408, { drop: false });
      pc([[-30, -6, 1], [30, -6, 1], [26, 10], [14, 24], [-14, 24], [-26, 10]], L2, () => strokePts([[-28, -2], [28, -2]], 'rgba(255,255,255,0.4)', 1.4), 4409, { drop: false });
      pc(rect(-16, 24, 16, 32), L, null, 4410, { drop: false });
    } else if (i === 3) {    // livre ouvert + plume
      pc([[-36, 0], [-20, -8], [0, -2], [20, -8], [36, 0], [36, 26, 1], [20, 20], [0, 28], [-20, 20], [-36, 26, 1]], '#f4eedc', () => { for (const y of [4, 10, 16]) { strokePts([[-30, y], [-6, y + 3]], '#6a4628', 1.3); strokePts([[6, y + 3], [30, y]], '#6a4628', 1.3); } strokePts([[0, -2], [0, 28]], '#6a4628', 1.6); }, 4412, { drop: false });
      pc([[16, -6], [10, -18], [16, -40], [30, -54], [28, -34], [20, -14]], L2, () => strokePts([[15, -6], [28, -50]], '#6a4628', 1.2), 4413, { drop: false });
    } else {                 // colombe au rameau
      pc([[-30, 4], [-14, -2], [4, -6], [14, -14], [24, -14], [30, -10], [24, -6], [18, 2], [6, 12], [-12, 14], [-24, 12]], encre ? '#f1ece0' : '#f1ece0', () => strokePts([[-12, 0], [8, -10], [0, -26], [-16, -30]], 'rgba(120,120,120,0.6)', 1), 4415, { drop: false });
      pc([[-8, -2], [6, -10], [2, -28], [-12, -36], [-6, -18]], '#e4e0d6', null, 4416, { drop: false });
      strokePts([[30, -10], [40, -2], [44, 8]], '#5d6b3a', 1.6);
      for (const [lx, ly, a] of [[37, -6, 0.8], [42, 2, 1.4], [40, 10, 2]]) { const c2 = cx_(); c2.save(); c2.translate(lx, ly); c2.rotate(a); fillPts(ell(0, 0, 6, 2.4, 8), '#6f7f45'); c2.restore(); }
    }
    c.restore();
  }
  NOB.icone = icone;

  // ---------------- médaille d'or (centre du disque) dans son écrin (o.ecrin : (x,y) = bas de l'écrin)
  const MED_R = 55;
  function disqueMedaille(o) {
    const c = cx_(), t = o.t || 0;
    pc(ell(0, 0, MED_R, MED_R, 28), OR.or, () => {
      fillPts(ell(0, 0, MED_R - 9, MED_R - 9, 26), '#b48d38');
      for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; dot(Math.cos(a) * (MED_R - 5), Math.sin(a) * (MED_R - 5), 1.8, i % 2 ? OR.orL : OR.orD); }
      // profil barbu en relief, tourné vers la gauche
      const PR = [[8, -36], [-4, -37], [-14, -31], [-19, -22], [-20, -14], [-26, -8], [-21, -4], [-22, 2], [-26, 8], [-24, 16], [-18, 24], [-10, 30], [-2, 34], [10, 40], [20, 40], [22, 30], [26, 14], [28, -6], [24, -24], [18, -32]];
      fillPts(tr(PR, 2, 2), 'rgba(80,55,15,0.55)'); fillPts(PR, '#d8b65e');
      strokePts([[-20, 2], [-10, 6], [-14, 16], [-4, 26], [8, 30]], 'rgba(110,80,25,0.8)', 1.6); dot(-10, -16, 2, 'rgba(90,60,20,0.8)'); strokePts([[-16, -22], [-6, -23]], 'rgba(110,80,25,0.8)', 1.4); strokePts([[16, -2], [20, 8], [14, 14]], 'rgba(110,80,25,0.7)', 1.4);
      strokePts([[6, -34], [-6, -34], [-16, -28], [-20, -18]], 'rgba(255,240,190,0.8)', 1.6);
      strokePts([[12, -6], [16, 4], [10, 12]], 'rgba(110,80,25,0.6)', 1.2);
      // feuillage de laurier gravé sur le pourtour bas
      for (let i = 0; i < 7; i++) { const a = PI * 0.25 + i * 0.075 * PI; const lx = Math.cos(a) * 38, ly = Math.sin(a) * 38; fillPts(ell(lx, ly, 4, 2, 6), 'rgba(110,80,25,0.5)'); }
      shade(-MED_R, -MED_R, MED_R, MED_R, 0.3, [-MED_R, -MED_R, MED_R, MED_R]);
    }, 4501);
    const e = clamp(o.eclat || 0);
    if (e > 0 && !SIL()) {
      c.save(); c.beginPath(); c.arc(0, 0, MED_R, 0, TAU); c.clip(); c.globalCompositeOperation = 'lighter';
      const xb = lerp(-MED_R * 1.6, MED_R * 1.6, (t * 0.45) % 1);
      const g = c.createLinearGradient(xb - 26, 0, xb + 26, 0); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, `rgba(255,245,215,${0.7 * e})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.translate(0, 0); c.transform(1, 0, -0.5, 1, 0, 0); c.fillStyle = g; c.fillRect(-MED_R * 3, -MED_R, MED_R * 6, MED_R * 2); c.restore();
      const tw = 0.5 + 0.5 * Math.sin(t * 5);
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,248,220,${e * tw})`; c.lineWidth = 2;
      const sx = -30, sy = -38, L = 14 * e * (0.6 + 0.4 * tw);
      c.beginPath(); c.moveTo(sx - L, sy); c.lineTo(sx + L, sy); c.moveTo(sx, sy - L); c.lineTo(sx, sy + L); c.stroke(); c.restore();
    }
  }
  function drawMedaille(o) {
    const c = cx_(), k = o.k || 1; c.save(); c.scale(k, k);
    if (!o.ecrin) { disqueMedaille(o); c.restore(); return; }
    pc(rrect(-76, -150, 76, -8, 12), '#1f2c4a', () => { fillPts(rrect(-66, -140, 66, -16, 8), '#efe4c8'); for (let i = 0; i < 6; i++) strokePts([[-60 + i * 24, -136], [-54 + i * 24, -20]], 'rgba(180,160,120,0.35)', 1.2); shade(0, -150, 0, -8, 0.25, [-80, -152, 80, -6]); }, 4510);
    c.save(); c.translate(0, -80); disqueMedaille(o); c.restore();
    pc(rrect(-80, -18, 80, 0, 6), '#263559', () => { fillPts(rect(-70, -18, 70, -12), '#efe4c8'); strokePts([[-78, -4], [78, -4]], 'rgba(200,170,90,0.6)', 1.4); }, 4511);
    c.restore();
  }

  // ---------------- diplôme : chemise de cuir rouge ouverte, paysage enluminé à gauche, lignes ondulées à droite (centre)
  function drawDiplome(o) {
    const c = cx_(), k = o.k || 1; c.save(); c.scale(k, k);
    pc(rrect(-78, -58, 78, 58, 6), '#8a2a24', () => { strokePts([[-72, -52], [72, -52], [72, 52], [-72, 52], [-72, -52]], 'rgba(220,180,90,0.7)', 1.4); strokePts([[0, -58], [0, 58]], 'rgba(40,10,8,0.6)', 2); hatch(null, 0.8, 3.6, 0.2); }, 4601);
    pc(rect(-68, -48, -4, 48), '#efe6cc', () => {
      const g = cx_().createLinearGradient(0, -44, 0, 10); g.addColorStop(0, '#9fb7c6'); g.addColorStop(1, '#efe0b8');
      if (!SIL()) { cx_().fillStyle = g; cx_().fillRect(-64, -44, 56, 60); }
      dot(-24, -24, 7, '#e6c35a');
      fillPts([[-64, 4], [-48, -14], [-36, -4], [-22, -20], [-8, 0], [-8, 16], [-64, 16]], '#6f8a5a');
      fillPts([[-64, 16], [-8, 16], [-8, 30], [-64, 30]], '#5e86a0');
      strokePts([[-60, 22], [-40, 22]], 'rgba(255,255,255,0.6)', 1);
      fillPts(ell(-50, -12, 6, 9, 10), '#3f5a36'); strokePts([[-50, -2], [-50, 8]], '#5a3a22', 1.6);
      fillPts([[-64, 30], [-8, 30], [-8, 44], [-64, 44]], '#8a7a48');
      strokePts([[-64, -44], [-8, -44], [-8, 44], [-64, 44], [-64, -44]], OR.or, 2);
    }, 4602, { drop: false });
    pc(rect(4, -48, 68, 48), '#efe6cc', () => { lignes(12, 60, -36, 26, 8, 'rgba(90,70,50,0.6)', 1, 41); dot(36, 38, 6, OR.or); }, 4603, { drop: false });
    c.restore();
  }

  // ---------------- éventail noir de la nièce (pivot = prise ; s'ouvre vers le haut ; o.ouvert 0..1)
  function drawEventail(o) {
    const ov = o.ouvert == null ? 1 : clamp(o.ouvert), a0 = -PI / 2 - 1.1 * ov - 0.08, a1 = -PI / 2 + 1.1 * ov + 0.08, R = 54;
    const out = [[0, 0]].concat(ep(0, 0, R, R, 14, a0, a1));
    pc(out, '#1e1a1e', () => {
      for (let i = 0; i <= 8; i++) { const a = lerp(a0, a1, i / 8); strokePts([[0, 0], [Math.cos(a) * R, Math.sin(a) * R]], 'rgba(200,190,170,0.35)', 1); }
      strokePts(ep(0, 0, R - 8, R - 8, 14, a0, a1), 'rgba(220,210,190,0.45)', 1.2);
      for (let i = 0; i < 9; i++) { const a = lerp(a0, a1, (i + 0.5) / 9); dot(Math.cos(a) * (R - 16), Math.sin(a) * (R - 16), 1.6, 'rgba(200,170,120,0.5)'); }
    }, 4701);
    dot(0, 0, 3, OR.or);
  }

  // ---------------- registre des objets tenus
  //   grip : point tenu ; p2 : seconde prise ; plat : dessiné DERRIÈRE la marionnette (main posée sur le bord) ; contre : contre-retourné en dir −1
  Object.assign(OBJ, {
    dynamite: { draw: drawDynamite, grip: [0, 0], held: { debout: true }, pts: { meche: (o) => dynPt(o, mechePts(o)[mechePts(o).length - 1]), centre: [0, 0] }, tenirA: [74, -84] },
    journal: { draw: drawJournal, plat: true, contre: true, deuxMains: true, held: { k: 0.35 }, centre: () => [0, 0], grip: (o) => journalMain(o, 1), p2: (o) => journalMain(o, -1),
      pts: { mainG: (o) => [-JW / 2 * (o.k || 1), 0], mainD: (o) => [JW / 2 * (o.k || 1), 0], prise: (o) => journalMain(o, 1), priseB: (o) => journalMain(o, -1), centre: [0, 0], haut: (o) => [0, -JH / 2 * (o.k || 1)] }, tenirA: 'bord' },
    testament: { draw: drawTestament, plat: true, contre: true, deuxMains: true, held: { k: 0.42 }, centre: () => [0, 0], grip: (o) => testamentMain(o, 1), p2: (o) => testamentMain(o, -1),
      pts: { mainG: (o) => [-TW / 2 * (o.k || 1), -0.05 * TH * (o.k || 1)], mainD: (o) => [TW / 2 * (o.k || 1), -0.05 * TH * (o.k || 1)], prise: (o) => testamentMain(o, 1), priseB: (o) => testamentMain(o, -1), centre: [0, 0], sceau: (o) => [96 * (o.k || 1), 150 * (o.k || 1)] }, tenirA: 'bord' },
    ecrin: { draw: (o) => drawMedaille(Object.assign({ ecrin: 1 }, o)), held: { k: 0.8 }, contre: true, centre: () => [0, 0],
      grip: (o) => (o._prise === 'paume' ? [46 * (o.k || 1), 12] : [0, -9 * (o.k || 1)]), p2: (o) => [-46 * (o.k || 1), 12],
      pts: { medaille: (o) => [0, -80 * (o.k || 1)] }, tenirA: [120, -86] },
    medaille: { draw: drawMedaille, held: { k: 0.9 }, grip: (o) => [0, (MED_R + 4) * (o.k || 1)], pts: { centre: [0, 0] }, tenirA: [80, -110] },
    diplome: { draw: drawDiplome, held: { k: 0.85 }, contre: true, plat: true, centre: () => [0, 0],
      grip: (o) => (o._prise === 'paume' ? [44 * (o.k || 1), 70 * (o.k || 1)] : [78 * (o.k || 1), 0]), p2: (o) => (o._prise === 'paume' ? [-44 * (o.k || 1), 70 * (o.k || 1)] : [-78 * (o.k || 1), 0]),
      pts: { centre: [0, 0] }, tenirA: [150, -110] },
    eventail: { draw: drawEventail, grip: [0, 6], pts: { bout: [0, -54] }, tenirA: [56, -150] },
    plume: { draw: (o) => { const c = cx_(), k = o.k || 0.6; c.save(); c.scale(k, k); M.mer.OBJ.plume.draw(o); c.restore(); }, grip: [0, 0], held: { k: 0.6 }, pts: { pointe: (o) => [10 * (o.k || 0.6), 38 * (o.k || 0.6)] }, tenirA: [70, -104] },
    sac: { draw: (o) => M.mer.OBJ.sac.draw(o), grip: [0, -100], pts: { bouche: [0, -110] }, tenirA: [60, -40] },
  });

  // =====================================================================
  // GESTES COMMUNS
  // =====================================================================
  function tenirObjet(q, k) {                          // objet tenu droit devant la poitrine ; objet plat : de face, une main sur chaque bord
    if (!(k > 0) || !has(q.tenu)) return;
    const ob = objOf(q.tenu), oo = heldOpts(q.tenu, q.tenuO, q);
    let T = q.cible || ob.tenirA || [72, -90];
    if (T === 'bord') { const g = gripOf(ob, oo); T = [56 + 2 * Math.abs(g[0]), -130]; }
    armTo(q, 'armF', T, k);
  }
  function sursautCommun(q, k) {
    if (!(k > 0)) return;
    q.dy = (q.dy || 0) - 16 * k; q.tilt = (q.tilt || 0) - 0.05 * k;
    blend(q, 'armF_up', -1.75, k); blend(q, 'armF_lo', -1.0, k); blend(q, 'armB_up', -1.35, k); blend(q, 'armB_lo', -1.05, k);
    if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open';
    if (k > 0.3) { fset(q, 'eyes', 'wide'); fset(q, 'brow', 'up'); fset(q, 'mouth', 'o'); }
  }
  const hsDe = (k) => { const c = Math.cos(PI * clamp(k)); return (c < 0 ? -1 : 1) * Math.max(0.25, Math.abs(c)); };
  const mixHex = (a, b, k) => (k <= 0 ? a : M.mixc(a, b, clamp(k)));

  // =====================================================================
  // ALFRED NOBEL (1865 → 1895) — redingote gris ardoise, gilet ocre, nœud noir, barbe en collier brun foncé, front dégarni
  // =====================================================================
  const AL = { peau: '#e0bf9c', peauD: '#c39e7c', coat: '#4a5560', coatD: '#3b444d', coatL: '#5d6873', gilet: '#a8843f', giletD: '#86672e', chemise: '#efe9da',
    noeud: '#151214', pant: '#3a3d42', pantD: '#2f3236', botte: '#151213', cheveux: '#3b2a1e', barbe: '#33241a', gris: '#9a958c' };
  const AL_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [38, -118], [42, -80], [41, -40], [37, -6], [39, 40], [43, 96], [45, 124, 1], [-46, 126, 1], [-44, 70], [-42, 10], [-42, -60], [-40, -112], [-35, -150], [-26, -168]];
  const jupeAssise = (pts, a) => (a > 0 ? pts.map((p) => (p[1] > 10 ? [p[0], lerp(p[1], 16 + (p[1] - 10) * 0.06, a), p[2]] : p)) : pts);
  const AL_BEARD = [[-4, -64], [3, -62], [6, -48], [10, -38], [16, -31], [22, -24], [29, -21], [34, -16], [35, -8], [32, 1], [24, 6], [14, 8], [4, 5], [-6, -2], [-12, -16], [-12, -34], [-9, -50]];
  const AL_MOUST = [[16, -33], [24, -35], [32, -34], [38, -30], [37, -25], [30, -27], [22, -26], [15, -28]];
  const alMeches = (p) => { const h = clamp(p._her || 0); return [[-2, -72], [-6, -76 - 24 * h], [-10, -73], [-15, -79 - 30 * h], [-19, -74], [-25, -78 - 26 * h], [-28, -71], [-34, -70 - 18 * h], [-35, -60], [-22, -66], [-8, -68]]; };
  function mkAlfred() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => jupeAssise(AL_TORSO, p._assis || 0), base: AL.coat, seed: 7001, paint: (p) => {
        const a = p._assis || 0;
        fillPts([[8, -168], [22, -158], [33, -126], [38, -84], [38, -42], [35, -8], [24, -6], [18, -50], [14, -120]], AL.gilet);
        for (const y of [-112, -88, -64, -40]) { dot(32, y, 2.6, AL.giletD); dot(31.5, y - 0.6, 1.2, '#d8b870'); }
        hatch([[14, -150], [26, -150], [30, -10], [20, -10]], 0.3, 3.4, 0.18);
        fillPts([[13, -170], [25, -154], [31, -126], [25, -102], [17, -118], [12, -150]], AL.coatD);
        fillPts([[2, -180], [16, -178], [23, -166], [15, -160], [5, -168]], AL.chemise);
        fillPts([[17, -168], [24, -170], [22, -163]], AL.chemise);
        fillPts([[10, -172], [18, -167], [10, -161]], AL.noeud); fillPts([[26, -173], [18, -167], [27, -160]], AL.noeud); dot(18, -167, 2.8, '#2a2628');
        strokePts([[-42, -8], [37, -6]], 'rgba(20,24,30,0.55)', 1.4);
        if (a < 0.5) { strokePts([[37, -6], [39, 40], [43, 96], [45, 122]], 'rgba(18,22,28,0.7)', 1.6); fillPts(rect(-8, 6, 24, 14), AL.coatD); }
        strokePts([[30, -100], [26, -70], [28, -60]], 'rgba(200,170,90,0.7)', 1.1);
        hatch([[-50, -170], [-14, -170], [-12, 130], [-50, 130]], 0.75, 4.2, 0.3);
        shade(40, 0, -42, 0, 0.28);
      } },
      ...legDefs('B', AL.pantD, AL.botte, 7002),
      ...legDefs('F', AL.pant, AL.botte, 7004),
      armB_up: upDef([-10, -146], AL.coatD, 7006),
      armB_lo: foreDef('armB_up', AL.coatD, AL.peauD, true, 7007, '#d9d2c2'),
      head: headDef(X.NAP_HEAD, AL.peau, 7008, (p) => {
        const f = p.face || {}, hair = mixHex(AL.cheveux, AL.gris, p._gris || 0);
        fillPts([[0, -68], [-12, -74], [-24, -72], [-33, -62], [-33, -44], [-26, -30], [-17, -36], [-15, -52], [-6, -58], [2, -62]], hair, 3);
        for (const y of [-66, -58, -50]) strokePts([[-4, y], [-28, y + 4]], 'rgba(255,240,220,0.18)', 1.1);
        strokePts([[-10, -92], [6, -95], [20, -88]], 'rgba(255,240,225,0.55)', 2.2);
        strokePts([[4, -84], [16, -82]], 'rgba(140,100,80,0.35)', 1); strokePts([[2, -78], [14, -77]], 'rgba(140,100,80,0.3)', 1);
        X.earPaint(-8, -44);
        dot(14, -38, 8, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -52); strokePts([[11, -56.5], [17, -58], [23, -55.5]], 'rgba(110,70,50,0.55)', 1.2);
        X.brow(f, 17, -62, hair, 3.8); X.mouth(f, 27, -24);
      }),
      meches: headChild(alMeches, AL.cheveux, 7009, () => hatch(null, 1.2, 3, 0.3), { base: AL.cheveux }),
      barbe: headChild(AL_BEARD, AL.barbe, 7010, (p) => {
        if ((p._gris || 0) > 0) fillPts(AL_BEARD, `rgba(160,155,148,${0.75 * p._gris})`);
        for (let i = 0; i < 12; i++) { const x = -10 + i * 4, y = -30 + Math.abs(i - 5) * 3; strokePts([[x, y], [x + 1, y + 7]], 'rgba(255,235,210,0.22)', 1); }
        hatch(null, 1.3, 3, 0.35);
      }),
      moustache: headChild(AL_MOUST, AL.barbe, 7011, (p) => { if ((p._gris || 0) > 0) fillPts(AL_MOUST, `rgba(160,155,148,${0.7 * p._gris})`); hatch(null, 0.2, 2.6, 0.3); }),
      armF_up: upDef([-2, -146], AL.coat, 7012),
      armF_lo: foreDef('armF_up', AL.coat, AL.peau, false, 7013, AL.chemise),
      deuxDoigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: AL.peau, seed: 7014, pts: (p) => ((p._pouls || 0) > 0.5 ? [[2, -6], [24, -3], [26, 2], [24, 7], [4, 6]] : OFFP), paint: () => strokePts([[6, 1], [24, 2]], 'rgba(90,50,40,0.5)', 1) },
    };
    parts.meches.base = AL.cheveux;
    parts.meches.pts = (p) => scl(alMeches(p), hsOf(p), 1);
    parts.meches.paint = (p) => { const c = cx_(); c.save(); c.scale(hsOf(p), 1); if ((p._gris || 0) > 0) fillPts(alMeches(p), `rgba(154,149,140,${p._gris})`); hatch(null, 1.2, 3, 0.3); c.restore(); };
    Object.assign(parts, heldParts(AL.peau, 7020));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['meches', 'barbe', 'moustache'], ['deuxDoigts']).map((n) => n) };
  }
  CH.nobAlfred = mkAlfred();
  {   // deuxDoigts doit passer après l'avant-bras avant
    const o = CH.nobAlfred.order; o.splice(o.indexOf('deuxDoigts'), 1); o.splice(o.indexOf('armF_lo') + 1, 0, 'deuxDoigts');
  }
  function alfredGestes(p) {
    const q = prep(p), A = q.ang;
    q._gris = clamp(q.gris || 0);
    const su = ease(clamp(q.sursaut || 0)), as = ease(clamp(q.assis || 0));
    q._her = Math.max(clamp(q.herisse || 0), su); q._assis = as;
    marche(q, clamp(q.marche || 0)); assis(q, as);
    const te = ease(clamp(q.tenir || 0)), ec = ease(clamp(q.ecrire || 0)), pr = ease(clamp(q.presente || 0)), po = ease(clamp(q.pouls || 0)), rd = clamp(q.regardeDerriere || 0);
    if (ec > 0 && q.tenu == null) q.tenu = 'plume';
    if (te > 0) tenirObjet(q, te);
    if (ec > 0) {
      const c0 = q.cible || [104, -52], tt = q.t || 0, g = [5 * Math.sin(tt * 13), 1.6 * Math.sin(tt * 27)];
      if (q.vers) { q.versPt = q.versPt || 'pointe'; q._grib = [g[0] * ec, g[1] * ec]; }
      else armTo(q, 'armF', [c0[0] - 6 + g[0], c0[1] - 23 + g[1]], ec);
      A.head = (A.head || 0) + 0.22 * ec; if (ec > 0.5) fset(q, 'eyes', 'half');
    }
    if (pr > 0) {
      if (q.cible) armTo(q, 'armF', q.cible, pr); else { blend(q, 'armF_up', -1.12, pr); blend(q, 'armF_lo', -0.42, pr); }
      if (!has(q.tenu)) q.handF = 'open';
    }
    if (po > 0) {
      blend(q, 'armB_up', -0.62, po); blend(q, 'armB_lo', -1.22, po);
      const W = handPt(q, 'armB', 4, 72); armTo(q, 'armF', [W[0] + 2, W[1] - 10], po);
      q._pouls = po; A.head = (A.head || 0) + 0.3 * po; fset(q, 'brow', 'worry');
    }
    sursautCommun(q, su);
    if (rd > 0) { q._hs = hsDe(rd); A.head = (A.head || 0) - 0.06 * Math.sin(PI * rd); }
    return q;
  }
  NOB.alfred = wrapper(CH.nobAlfred, alfredGestes, 0.9);

  // =====================================================================
  // LA LAURÉATE (aujourd'hui) — cheveux gris argent au carré, lunettes rondes fines, robe longue bleu canard (pas de jambes)
  // =====================================================================
  const LR = { peau: '#e3c3a3', peauD: '#c7a383', robe: '#2f6b6e', robeD: '#245659', robeL: '#3f8184', cheveux: '#cfcfcb', cheveuxD: '#a6a7a4', monture: '#3a3438' };
  const LR_TORSO = [[-12, -176], [8, -180], [16, -168], [26, -150], [34, -122], [36, -94], [30, -60], [26, -30], [30, -6], [-32, -6], [-30, -40], [-33, -86], [-35, -122], [-31, -150], [-24, -168]];
  const LR_JUPE = [[-30, -40], [28, -40], [32, 20], [40, 100], [50, 180], [58, 228], [62, 238, 1], [-64, 238, 1], [-60, 200], [-52, 120], [-42, 40], [-34, -10]];
  const LR_CHEV = [[32, -80], [26, -92], [10, -103], [-10, -106], [-28, -98], [-40, -80], [-43, -56], [-42, -34], [-36, -22], [-26, -20], [-18, -26], [-18, -44], [-12, -60], [2, -70], [18, -74], [30, -72]];
  function mkLaureate() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: LR_TORSO, base: LR.robe, seed: 7101, paint: () => {
        fillPts([[4, -180], [14, -176], [16, -166], [8, -164]], LR.peau);
        strokePts([[4, -176], [12, -168], [16, -160]], 'rgba(30,60,60,0.6)', 1.4);
        strokePts([[14, -170], [20, -160], [24, -150]], 'rgba(220,200,140,0.8)', 1.2); dot(24, -150, 2.6, OR.or);
        strokePts([[-30, -8], [30, -8]], 'rgba(20,50,50,0.6)', 2);
        hatch([[-44, -170], [-12, -170], [-10, 0], [-44, 0]], 0.75, 4.2, 0.28);
        shade(36, 0, -36, 0, 0.26);
      } },
      jupe: { parent: 'torso', at: [0, 0], pts: LR_JUPE, base: LR.robe, seed: 7102, noRivet: true, paint: () => {
        for (const [x0, x1] of [[-14, -34], [6, 0], [24, 36]]) strokePts([[x0, -30], [x1, 236]], 'rgba(20,50,50,0.45)', 1.6);
        strokePts([[10, -24], [22, 236]], 'rgba(120,180,180,0.25)', 2);
        hatch([[-70, -40], [-20, -40], [-20, 240], [-70, 240]], 0.75, 4.2, 0.28); shade(50, 100, -60, 100, 0.3, [-70, -40, 70, 240]);
      } },
      armB_up: upDef([-10, -146], LR.robeD, 7103),
      armB_lo: foreDef('armB_up', LR.robeD, LR.peauD, true, 7104),
      head: headDef(X.NAP_HEAD, LR.peau, 7105, (p) => {
        const f = p.face || {}, so = clamp(p._sourire || 0);
        dot(14, -36, 9, `rgba(210,120,110,${0.18 + 0.2 * so})`);
        strokePts([[6, -34], [12, -26]], 'rgba(150,100,80,0.35)', 1);
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(120,118,112,0.95)', 1.8); X.mouth(f, 27, -27, 'rgba(150,60,70,0.95)');
        lunettesRondes(20, -52, 9.5, LR.monture);
      }),
      cheveux: headChild(LR_CHEV, LR.cheveux, 7106, () => {
        for (let i = 0; i < 6; i++) strokePts([[24 - i * 10, -96 + i * 2], [10 - i * 9, -60 + i * 6], [-6 - i * 6, -26]], 'rgba(120,120,118,0.4)', 1.1);
        strokePts([[-6, -100], [14, -96], [28, -84]], 'rgba(255,255,255,0.5)', 2); hatch(null, 1.2, 3.2, 0.18);
      }),
      boucle: headChild(ell(-14, -24, 2.6, 2.6, 8), OR.or, 7107),
      armF_up: upDef([-2, -146], LR.robe, 7108),
      armF_lo: foreDef('armF_up', LR.robe, LR.peau, false, 7109),
    };
    Object.assign(parts, heldParts(LR.peau, 7120));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 0] }, order: ORDER_ROBE(['cheveux', 'boucle']) };
  }
  CH.nobLaureate = mkLaureate();
  function laureateGestes(p) {
    const q = prep(p), A = q.ang, tt = q.t || 0;
    A.jupe = (A.jupe || 0) + 0.008 * Math.sin(M.tg(tt) * 1.7);
    const rc = ease(clamp(q.recoit || 0)), sa = ease(clamp(q.salut || 0)), su = ease(clamp(q.sursaut || 0)), so = ease(clamp(q.sourire || 0));
    q._sourire = so; if (so > 0.3) fset(q, 'mouth', 'smile');
    if (rc > 0) {
      armTo(q, 'armF', q.cible || [150, -40], rc);
      if (has(q.tenu)) { q.tenuO = Object.assign({ _prise: 'paume' }, q.tenuO); if (q.deuxMains == null) q.deuxMains = rc > 0.5; }
      else armTo(q, 'armB', [86, -46], rc);
      if (rc > 0.4) { q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
      A.head = (A.head || 0) + 0.12 * rc;
    }
    if (sa > 0) {
      q.tilt = (q.tilt || 0) + 0.16 * sa; q.dy = (q.dy || 0) + 6 * sa; A.head = (A.head || 0) + 0.3 * sa;
      if (!has(q.tenu)) { armTo(q, 'armF', [26, -118], sa); q.handF = q.handF || 'open'; }
      blend(q, 'armB_up', -0.2, sa);
      fset(q, 'eyes', 'half');
    }
    sursautCommun(q, su);
    return q;
  }
  NOB.laureate = wrapper(CH.nobLaureate, laureateGestes, 0.9);

  // =====================================================================
  // LE MAÎTRE DE CÉRÉMONIE (aujourd'hui) — habit noir à queue de pie, plastron et nœud blancs, crâne rasé, barbe blanche courte, écharpe bleu roi
  // =====================================================================
  const MC = { peau: '#d4a983', peauD: '#b68b67', habit: '#1d1c22', habitL: '#34333c', plastron: '#f3f0e8', echarpe: '#2d4a8a', echarpeL: '#4566ad', barbe: '#ebe8e1', pant: '#212026', chaus: '#0f0e10' };
  const MC_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [38, -118], [42, -80], [40, -40], [36, -14], [30, -2], [-12, 4], [-24, 40], [-30, 112], [-46, 114, 1], [-48, 40], [-44, -40], [-42, -110], [-36, -150], [-26, -168]];
  const MC_BEARD = [[-2, -60], [4, -58], [8, -46], [14, -38], [20, -34], [26, -22], [32, -18], [35, -10], [33, 0], [26, 6], [14, 8], [2, 4], [-8, -6], [-12, -24], [-9, -44]];
  const MC_MOUST = [[18, -33], [28, -34], [36, -30], [34, -27], [26, -28], [18, -29]];
  function mkMC() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: MC_TORSO, base: MC.habit, seed: 7201, paint: () => {
        fillPts([[6, -176], [20, -170], [31, -148], [37, -116], [39, -80], [37, -44], [33, -18], [24, -16], [18, -60], [12, -130]], MC.plastron);
        for (const y of [-130, -104, -78]) dot(30, y, 1.8, '#9a9a9a');
        fillPts([[12, -172], [24, -160], [30, -128], [24, -100], [16, -116], [11, -150]], MC.habitL);
        fillPts([[2, -180], [16, -178], [22, -168], [14, -162], [5, -170]], MC.plastron);
        fillPts([[10, -172], [18, -167], [10, -161]], '#fbfaf6'); fillPts([[26, -173], [18, -167], [27, -160]], '#fbfaf6'); dot(18, -167, 2.6, '#d8d4ca');
        const band = ribbon([[-36, -152], [-12, -118], [12, -78], [30, -44], [42, -24]], 24, 26);
        fillPts(band, MC.echarpe); strokePts([[-34, -146], [-10, -112], [14, -72], [34, -36]], 'rgba(150,180,240,0.45)', 2.2);
        strokePts([[-42, -158], [-18, -124], [6, -84], [26, -50], [40, -32]], 'rgba(10,20,50,0.5)', 1.2);
        hatch([[-50, -170], [-14, -170], [-12, 116], [-50, 116]], 0.75, 4.2, 0.3, 1.05, '200,200,220');
        shade(40, 0, -42, 0, 0.3);
      } },
      ...legDefs('B', '#1a191e', MC.chaus, 7202, () => strokePts([[16, -6], [16, 116]], 'rgba(80,80,90,0.6)', 2)),
      ...legDefs('F', MC.pant, MC.chaus, 7204, () => strokePts([[17, -6], [16, 116]], 'rgba(120,120,135,0.7)', 2.4)),
      armB_up: upDef([-10, -146], '#18171c', 7206),
      armB_lo: foreDef('armB_up', '#18171c', MC.peauD, true, 7207, '#e6e2d8'),
      head: headDef(X.NAP_HEAD, MC.peau, 7208, (p) => {
        const f = p.face || {};
        fillPts([[30, -84], [24, -92], [8, -98], [-10, -96], [-26, -88], [-33, -68], [-32, -48], [-26, -36], [-14, -66], [6, -80]], 'rgba(90,80,75,0.22)');
        for (let i = 0; i < 26; i++) { const a = PI * 1.05 + i / 26 * PI * 0.9; dot(Math.cos(a) * 26 - 2, -58 + Math.sin(a) * 36, 0.7, 'rgba(60,50,45,0.35)'); }
        strokePts([[-14, -94], [4, -97], [20, -90]], 'rgba(255,240,225,0.55)', 2.2);
        X.earPaint(-8, -44);
        dot(14, -38, 8, 'rgba(190,110,90,0.2)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(225,222,215,0.95)', 2.8); X.mouth(f, 27, -24);
      }),
      barbe: headChild(MC_BEARD, MC.barbe, 7209, () => { for (let i = 0; i < 14; i++) dot(-6 + i * 3, -16 + Math.abs(i - 7) * 2, 0.9, 'rgba(150,145,140,0.6)'); hatch(null, 1.3, 2.8, 0.18); }),
      moustache: headChild(MC_MOUST, MC.barbe, 7210, () => hatch(null, 0.2, 2.6, 0.16)),
      armF_up: upDef([-2, -146], MC.habit, 7211),
      armF_lo: foreDef('armF_up', MC.habit, MC.peau, false, 7212, '#f6f3ec'),
    };
    Object.assign(parts, heldParts(MC.peau, 7220));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['barbe', 'moustache']) };
  }
  CH.nobMC = mkMC();
  function mcGestes(p) {
    const q = prep(p), A = q.ang, tt = q.t || 0;
    marche(q, clamp(q.marche || 0));
    const te = ease(clamp(q.tend || 0)), ap = ease(clamp(q.applaudit || 0)), su = ease(clamp(q.sursaut || 0));
    if (te > 0) { if (q.tenu == null) q.tenu = 'ecrin'; armTo(q, 'armF', q.cible || [150, -84], te); q.tilt = (q.tilt || 0) + 0.04 * te; A.head = (A.head || 0) + 0.06 * te; }
    if (ap > 0) {
      const s01 = 0.5 + 0.5 * Math.cos(tt * TAU * 2.6), C = [64, -102];
      armTo(q, 'armB', [C[0] - 2, C[1] + 2], ap); armTo(q, 'armF', [C[0] + 8 + 24 * s01, C[1] - 4], ap);
      if (!has(q.tenu)) q.handF = 'open'; q.handB = q.handB || 'open';
      fset(q, 'mouth', 'smile');
    }
    sursautCommun(q, su);
    return q;
  }
  NOB.mc = wrapper(CH.nobMC, mcGestes, 0.88);

  // =====================================================================
  // LE NOTAIRE (Stockholm, 1897) — chauve, favoris blancs sans moustache, pince-nez, redingote noire à revers de velours brun, gilet gris
  // =====================================================================
  const NO = { peau: '#e6c6a8', peauD: '#c8a688', habit: '#211d1d', velours: '#5c3c27', gilet: '#7f8182', chemise: '#efe9da', favoris: '#efece6', pant: '#2c2a2d', chaus: '#141112' };
  const NO_FAV = [[-6, -66], [2, -64], [8, -50], [13, -36], [14, -20], [9, -8], [-2, -4], [-12, -12], [-17, -30], [-15, -50]];
  const NO_COUR = [[-6, -70], [-20, -76], [-32, -68], [-36, -52], [-33, -36], [-26, -32], [-18, -40], [-17, -56], [-10, -64]];
  function mkNotaire() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: AL_TORSO, base: NO.habit, seed: 7301, paint: () => {
        fillPts([[8, -168], [22, -158], [33, -126], [38, -84], [38, -42], [35, -8], [24, -6], [18, -50], [14, -120]], NO.gilet);
        for (const y of [-110, -86, -62, -38]) dot(32, y, 2.2, '#4d4f50');
        fillPts([[11, -172], [26, -154], [33, -122], [25, -96], [16, -116], [10, -150]], NO.velours);
        hatch([[11, -172], [33, -172], [33, -96], [11, -96]], 1.2, 2.6, 0.25);
        fillPts([[2, -180], [16, -178], [23, -166], [15, -160], [5, -168]], NO.chemise);
        fillPts([[11, -170], [24, -168], [22, -158], [12, -160]], '#1a1618');
        strokePts([[37, -6], [39, 40], [43, 96], [45, 122]], 'rgba(5,5,5,0.7)', 1.6);
        strokePts([[22, -150], [26, -130], [24, -104]], 'rgba(10,10,10,0.8)', 1);
        hatch([[-50, -170], [-14, -170], [-12, 130], [-50, 130]], 0.75, 4.2, 0.3, 1.05, '200,190,180');
        shade(40, 0, -42, 0, 0.3);
      } },
      ...legDefs('B', '#252326', NO.chaus, 7302),
      ...legDefs('F', NO.pant, NO.chaus, 7304),
      armB_up: upDef([-10, -146], '#1b1818', 7306),
      armB_lo: foreDef('armB_up', '#1b1818', NO.peauD, true, 7307, '#ddd6c6'),
      head: headDef(X.NAP_HEAD, NO.peau, 7308, (p) => {
        const f = p.face || {};
        strokePts([[-12, -92], [6, -96], [20, -90]], 'rgba(255,240,225,0.55)', 2.2);
        for (const y of [-80, -74]) strokePts([[6, y], [24, y + 2]], 'rgba(140,100,80,0.4)', 1);
        strokePts([[22, -44], [26, -38]], 'rgba(140,100,80,0.4)', 1);
        X.earPaint(-8, -44);
        dot(16, -36, 8, 'rgba(205,120,110,0.25)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(225,222,215,0.95)', 3); X.mouth(f, 27, -26);
        // pince-nez : verre ovale devant l'œil, pont sur le nez, cordon noir
        const ring = ell(24, -51, 6.5, 8, 12); fillPts(ring, 'rgba(200,225,235,0.3)', 0, 0); strokePts(ring.concat([ring[0]]), '#2a2422', 1.4);
        strokePts([[30, -52], [35, -49]], '#2a2422', 1.3); strokePts([[18, -46], [8, -10], [4, 16]], 'rgba(20,18,18,0.8)', 0.9);
      }),
      couronne: headChild(NO_COUR, NO.favoris, 7309, () => hatch(null, 1.2, 3, 0.18)),
      favoris: headChild(NO_FAV, NO.favoris, 7310, () => { for (let i = 0; i < 6; i++) strokePts([[-12 + i * 4, -50 + i * 3], [-10 + i * 4, -20 + i * 2]], 'rgba(150,145,140,0.5)', 1); hatch(null, 1.3, 2.8, 0.16); }),
      armF_up: upDef([-2, -146], NO.habit, 7311),
      armF_lo: foreDef('armF_up', NO.habit, NO.peau, false, 7312, NO.chemise),
    };
    Object.assign(parts, heldParts(NO.peau, 7320));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['couronne', 'favoris']) };
  }
  CH.nobNotaire = mkNotaire();
  function notaireGestes(p) {
    const q = prep(p), A = q.ang;
    marche(q, clamp(q.marche || 0));
    const de = ease(clamp(q.deroule || 0)), li = ease(clamp(q.lit || 0));
    if (de > 0) { if (q.tenu == null) q.tenu = 'testament'; tenirObjet(q, de); }
    if (li > 0) { A.head = (A.head || 0) + 0.32 * li; q.tilt = (q.tilt || 0) + 0.03 * li; if (li > 0.4) fset(q, 'eyes', 'half'); }
    return q;
  }
  NOB.notaire = wrapper(CH.nobNotaire, notaireGestes, 0.85);

  // =====================================================================
  // LE NEVEU (1897) — moustache en guidon rousse, cheveux roux gominés raie au milieu, trois-pièces vert éteint, cravate bordeaux
  // =====================================================================
  const NE = { peau: '#e6c2a2', peauD: '#c9a283', costume: '#56684c', costumeD: '#46573e', gilet: '#4a5a40', cravate: '#6e2230', chemise: '#efe9da', roux: '#b0562a', rouxD: '#8a3e1c', pant: '#4f5f45', pantD: '#43513a', chaus: '#2a1d16' };
  const NE_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [38, -118], [42, -80], [41, -40], [38, -6], [40, 30], [42, 56, 1], [-44, 58, 1], [-44, 20], [-42, -60], [-40, -112], [-35, -150], [-26, -168]];
  const NE_CHEV = [[32, -82], [28, -94], [14, -103], [-6, -106], [-26, -98], [-36, -82], [-37, -62], [-30, -50], [-24, -60], [-14, -70], [2, -78], [20, -80]];
  const NE_MOUST = [[16, -33], [26, -35], [36, -34], [44, -38], [49, -46], [52, -44], [49, -36], [42, -29], [32, -27], [22, -27], [15, -29]];
  function mkNeveu() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: NE_TORSO, base: NE.costume, seed: 7401, paint: () => {
        fillPts([[8, -168], [22, -158], [33, -126], [38, -84], [38, -42], [36, -8], [26, -8], [20, -50], [14, -120]], NE.gilet);
        for (const y of [-108, -86, -64, -42]) dot(32, y, 2.2, '#2f3a2a');
        fillPts([[13, -170], [26, -152], [31, -124], [25, -100], [17, -118], [12, -150]], NE.costumeD);
        fillPts([[2, -180], [16, -178], [23, -166], [15, -160], [5, -168]], NE.chemise);
        fillPts([[16, -166], [24, -164], [26, -128], [21, -118], [18, -128]], NE.cravate);
        strokePts([[30, -70], [20, -60], [12, -64]], 'rgba(210,180,100,0.8)', 1.1);
        strokePts([[38, -6], [40, 30], [42, 56]], 'rgba(20,30,15,0.6)', 1.4);
        fillPts(rect(-6, 10, 26, 18), NE.costumeD);
        for (let x = -40; x < 42; x += 12) strokePts([[x, -176], [x + 2, 58]], 'rgba(30,40,25,0.18)', 1);
        hatch([[-50, -170], [-14, -170], [-12, 60], [-50, 60]], 0.75, 4.2, 0.3);
        shade(40, 0, -42, 0, 0.28);
      } },
      ...legDefs('B', NE.pantD, NE.chaus, 7402),
      ...legDefs('F', NE.pant, NE.chaus, 7404),
      armB_up: upDef([-10, -146], NE.costumeD, 7406),
      armB_lo: foreDef('armB_up', NE.costumeD, NE.peauD, true, 7407, '#ddd6c6'),
      head: headDef(X.NAP_HEAD, NE.peau, 7408, (p) => {
        const f = p.face || {}, bb = clamp(p._bee || 0);
        X.earPaint(-8, -44);
        dot(12, -36, 9, `rgba(215,120,100,${0.22 + 0.25 * clamp(p._rouge || 0)})`);
        X.eye(f, 17, -52); X.brow(f, 17, -61, NE.rouxD, 3);
        if (bb > 0.2) fillPts([[20, -28], [31, -28], [30, -28 + 14 * bb], [22, -28 + 12 * bb]], '#3a1714'); else X.mouth(f, 27, -24);
        for (const [x, y] of [[8, -30], [12, -24], [6, -22]]) dot(x, y, 0.9, 'rgba(150,80,50,0.5)');
      }),
      cheveux: headChild(NE_CHEV, NE.roux, 7409, () => {
        for (let i = 0; i < 5; i++) strokePts([[30 - i * 12, -90 + i * 2], [4 - i * 8, -76 + i * 3]], 'rgba(255,200,150,0.35)', 1.4);
        strokePts([[-2, -106], [0, -98]], 'rgba(60,20,8,0.8)', 1.6); strokePts([[-4, -104], [16, -100], [30, -88]], 'rgba(255,230,190,0.55)', 2); hatch(null, 1.2, 3, 0.15);
      }),
      moustache: headChild(NE_MOUST, NE.roux, 7410, () => { strokePts([[18, -31], [40, -32], [48, -42]], 'rgba(255,210,160,0.45)', 1.2); hatch(null, 0.2, 2.6, 0.25); }),
      armF_up: upDef([-2, -146], NE.costume, 7411),
      armF_lo: foreDef('armF_up', NE.costume, NE.peau, false, 7412, NE.chemise),
    };
    Object.assign(parts, heldParts(NE.peau, 7420));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux', 'moustache']) };
  }
  CH.nobNeveu = mkNeveu();
  function tireCommun(q, k) {                          // tirer : se pencher en arrière, poings serrés (cibles par vers / versB)
    if (!(k > 0)) return;
    q.tilt = (q.tilt || 0) - 0.1 * k; if (!q.handF) q.handF = 'fist'; if (!q.handB) q.handB = 'fist';
    if (!q.vers) armTo(q, 'armF', [150, -96], k); if (!q.versB) armTo(q, 'armB', [124, -90], k);
    fset(q, 'brow', 'frown'); fset(q, 'mouth', 'tight');
  }
  function neveuGestes(p) {
    const q = prep(p), A = q.ang, tt = q.t || 0;
    marche(q, clamp(q.marche || 0));
    const co = ease(clamp(q.colere || 0)), ti = ease(clamp(q.tire || 0)), bb = ease(clamp(q.boucheBee || 0));
    if (co > 0) {
      const sh = 0.1 * Math.sin(tt * 17) * co;
      blend(q, 'armF_up', -2.3 + sh, co); blend(q, 'armF_lo', -0.9, co);
      blend(q, 'armB_up', -2.1 - sh, co); blend(q, 'armB_lo', -1.05, co);
      q.handF = q.handF || 'fist'; q.handB = q.handB || 'fist';
      q.tilt = (q.tilt || 0) + 0.04 * co; A.head = (A.head || 0) - 0.12 * co; q._rouge = co;
      fset(q, 'brow', 'frown'); fset(q, 'mouth', 'tight');
      q.dy = (q.dy || 0) - Math.abs(Math.sin(tt * 8.5)) * 5 * co;
    }
    tireCommun(q, ti);
    if (bb > 0) { q._bee = bb; fset(q, 'eyes', 'wide'); fset(q, 'brow', 'up'); A.head = (A.head || 0) - 0.05 * bb; }
    return q;
  }
  NOB.neveu = wrapper(CH.nobNeveu, neveuGestes, 0.88);

  // =====================================================================
  // LA NIÈCE (1897) — chignon haut brun-noir, robe bordeaux à manches gigot, col montant ivoire, petit éventail noir
  // =====================================================================
  const NI = { peau: '#ecccb0', peauD: '#cfab8e', robe: '#7a2e35', robeD: '#5f2329', robeL: '#934049', col: '#efe6d2', cheveux: '#2a1c18' };
  const NI_TORSO = [[-12, -180], [8, -184], [14, -172], [24, -152], [32, -124], [34, -96], [26, -62], [20, -34], [26, -6], [-28, -6], [-24, -40], [-30, -88], [-33, -124], [-30, -152], [-22, -170]];
  const NI_JUPE = [[-24, -40], [22, -40], [28, 20], [38, 100], [52, 180], [62, 228], [66, 238, 1], [-66, 238, 1], [-62, 200], [-52, 120], [-38, 40], [-28, -10]];
  const NI_CHEV = [[28, -84], [22, -94], [8, -102], [-12, -102], [-28, -92], [-36, -74], [-36, -54], [-30, -40], [-22, -46], [-18, -62], [-6, -74], [12, -80]];
  function mkNiece() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: NI_TORSO, base: NI.robe, seed: 7501, paint: () => {
        fillPts([[-6, -186], [10, -188], [16, -174], [18, -158], [4, -156], [-8, -162]], NI.col);
        for (let i = 0; i < 4; i++) strokePts([[-4, -182 + i * 7], [16, -180 + i * 7]], 'rgba(150,130,100,0.5)', 0.9);
        dot(16, -156, 3, OR.or);
        for (const y of [-140, -120, -100, -80]) dot(28, y, 1.8, '#3a1418');
        strokePts([[-26, -8], [26, -8]], 'rgba(40,10,14,0.6)', 2);
        hatch([[-44, -170], [-12, -170], [-10, 0], [-44, 0]], 0.75, 4.2, 0.3);
        shade(34, 0, -34, 0, 0.26);
      } },
      jupe: { parent: 'torso', at: [0, 0], pts: NI_JUPE, base: NI.robe, seed: 7502, noRivet: true, paint: () => {
        for (const [x0, x1] of [[-12, -36], [6, 2], [22, 40]]) strokePts([[x0, -30], [x1, 236]], 'rgba(40,10,14,0.45)', 1.6);
        fillPts([[-66, 222], [66, 222], [66, 238], [-66, 238]], NI.robeD);
        hatch([[-70, -40], [-20, -40], [-20, 240], [-70, 240]], 0.75, 4.2, 0.3); shade(50, 100, -60, 100, 0.3, [-70, -40, 70, 240]);
      } },
      armB_up: upDef([-10, -146], NI.robeD, 7503, armGigot(LA)),
      armB_lo: foreDef('armB_up', NI.robeD, NI.peauD, true, 7504, NI.col),
      head: headDef(X.NAP_HEAD, NI.peau, 7505, (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        dot(14, -36, 9, 'rgba(220,120,120,0.28)');
        X.eye(f, 17, -52); strokePts([[22, -55], [25, -57]], 'rgba(28,16,14,0.9)', 1.2);
        X.brow(f, 17, -61, 'rgba(40,26,22,0.95)', 2); X.mouth(f, 27, -27, 'rgba(160,50,60,0.95)');
        dot(-10, -34, 2.6, OR.or);
      }),
      cheveux: headChild(NI_CHEV, NI.cheveux, 7506, () => { for (let i = 0; i < 5; i++) strokePts([[24 - i * 12, -92 + i * 2], [-4 - i * 6, -60 + i * 2]], 'rgba(200,170,150,0.25)', 1.2); hatch(null, 1.2, 3, 0.2); }),
      chignon: headChild(ell(-8, -110, 22, 19, 16), NI.cheveux, 7507, () => { strokePts(ep(-8, -110, 14, 11, 12, 0.4, 5.6), 'rgba(200,170,150,0.3)', 1.3); strokePts(ep(-8, -110, 6, 5, 8, 0.8, 5.2), 'rgba(200,170,150,0.3)', 1.1); }),
      armF_up: upDef([-2, -146], NI.robe, 7508, armGigot(LA)),
      armF_lo: foreDef('armF_up', NI.robe, NI.peau, false, 7509, NI.col),
    };
    Object.assign(parts, heldParts(NI.peau, 7520));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-24, 0] }, order: ORDER_ROBE(['chignon', 'cheveux']) };
  }
  CH.nobNiece = mkNiece();
  function nieceGestes(p) {
    const q = prep(p), A = q.ang, tt = q.t || 0;
    A.jupe = (A.jupe || 0) + 0.008 * Math.sin(M.tg(tt) * 1.5 + 1);
    const ev = ease(clamp(q.evente || 0)), ef = clamp(q.effondre || 0), ti = ease(clamp(q.tire || 0));
    if (q.tenu == null) q.tenu = ti > 0 || ef > 0.05 ? 'rien' : 'eventail';
    if (ev > 0) {
      armTo(q, 'armF', q.cible || [66, -126], ev);
      A.objet = (A.objet || 0) + 0.5 * Math.sin(tt * TAU * 4.2) * ev;
      q.tenuO = Object.assign({ ouvert: 0.3 + 0.7 * ev }, q.tenuO);
    } else if (q.tenu === 'eventail') q.tenuO = Object.assign({ ouvert: 0.2 }, q.tenuO);
    if (ef > 0) {
      const s1 = ease(smooth(0, 0.3, ef)), s2 = ease(smooth(0.3, 0.62, ef)), s3 = ease(smooth(0.62, 1, ef));
      armTo(q, 'armF', [30, -244], s1); if (s1 > 0.5) q.handF = 'open';
      q.tilt = (q.tilt || 0) - 0.12 * s2 - 0.24 * s3; A.head = (A.head || 0) - 0.18 * s2 - 0.12 * s3;
      blend(q, 'armB_up', -0.35 * s3 - 0.2 * s2, Math.max(s2, s3)); blend(q, 'armB_lo', -0.3, s3); if (s3 > 0.3) q.handB = 'open';
      fset(q, 'brow', 'worry'); if (s3 > 0.4) { fset(q, 'eyes', 'closed'); fset(q, 'mouth', 'o'); } else if (s2 > 0.3) fset(q, 'eyes', 'half');
    }
    tireCommun(q, ti);
    return q;
  }
  NOB.niece = wrapper(CH.nobNiece, nieceGestes, 0.85);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  // fn est gardée au premier appel (cache) : elle ne doit dépendre que de ses arguments
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o, p) } }, order: ['o'] }); }
  function accDraw(name, x, y, s, o, fn) {
    o = o || {};
    return M.puppet(accDef(name, fn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function accPts(r, ob, o, names, ox, oy) { for (const n of names) { const q = ptOf(ob, n, o); if (q) r[n] = r.w('o', q[0] - (ox || 0), q[1] - (oy || 0)); } return r; }
  NOB.dynamite = (x, y, s, o) => { o = o || {}; const r = accDraw('dynamite', x, y, s == null ? 0.9 : s, o, (oo) => drawDynamite(oo)); return accPts(r, OBJ.dynamite, o, ['meche']); };
  NOB.journal = (x, y, s, o) => {
    o = Object.assign({ k: 1 }, o || {}); const k = o.k, an = o.ancre || 'centre', oy = an.startsWith('haut') ? -JH / 2 * k : an === 'bas' ? JH / 2 * k * (1 - 0.5 * clamp(o.plie || 0)) : 0;
    const ox = an === 'hautG' ? -JW / 2 * k + 10 : an === 'hautD' ? JW / 2 * k - 10 : 0;
    o._ox = ox; o._oy = oy;   // (la fonction de dessin est mise en cache : tout passe par o)
    const r = accDraw('journal', x, y, s == null ? 1 : s, o, (oo) => { const c = cx_(); c.save(); c.translate(-(oo._ox || 0), -(oo._oy || 0)); drawJournal(oo); c.restore(); });
    return accPts(r, OBJ.journal, o, ['mainG', 'mainD', 'centre', 'haut'], ox, oy);
  };
  NOB.testament = (x, y, s, o) => { o = Object.assign({ k: 1 }, o || {}); const r = accDraw('testament', x, y, s == null ? 1 : s, o, (oo) => drawTestament(oo)); return accPts(r, OBJ.testament, o, ['mainG', 'mainD', 'centre', 'sceau']); };
  NOB.medaille = (x, y, s, o) => { o = o || {}; const r = accDraw('medaille', x, y, s == null ? 1 : s, o, (oo) => drawMedaille(oo)); r.medaille = o.ecrin ? r.w('o', 0, -80 * (o.k || 1)) : r.w('o', 0, 0); return r; };
  NOB.diplome = (x, y, s, o) => accDraw('diplome', x, y, s == null ? 1 : s, o, (oo) => drawDiplome(oo));
  NOB.eventail = (x, y, s, o) => accDraw('eventail', x, y, s == null ? 0.85 : s, o, (oo) => drawEventail(oo));

  // ---------------- colombe (sans tige) ; (x,y) = pattes (posée) ; o.pose 'perche'|'vol'|'effraie' ; o.rameau 0/1 ; o.t
  const CO = { plume: '#f6f2e8', perle: '#d8d5ce', perleD: '#a9a69f', bec: '#e3a5a2', patte: '#d98f8a' };
  const BEC = [69, -71];
  function coTete(o) {                                  // décalage de la tête (hochement posé)
    if ((o.pose || 'perche') !== 'perche') return [0, 0];
    const u = (M.tg(o.t || 0) * 0.77 + (o.ph || 0)) % 1, n = u < 0.22 ? Math.sin(u / 0.22 * PI) : 0;
    return [7 * n, 4 * n];
  }
  const pcC = (pts, base, paint, seed, o) => pc(pts, base, paint, seed, Object.assign({ texA: 0.28 }, o || {}));
  function aile(sx, sy, r, base, seed, fold) {
    const c = cx_(); c.save(); c.translate(sx, sy); c.rotate(r);
    const W = [[0, 6], [16, -4], [22, -36], [18, -70], [10, -98], [2, -108], [-6, -104], [-12, -92], [-18, -80], [-24, -62], [-26, -40], [-22, -16], [-12, 2]];
    pcC(W, base, () => {
      for (let i = 0; i < 5; i++) strokePts([[2 - i * 4, -30 - i * 4], [8 - i * 6, -96 + i * 10]], 'rgba(120,118,112,0.55)', 1.1);
      strokePts([[-22, -40], [16, -40]], 'rgba(120,118,112,0.35)', 1); hatch(null, 0.4, 4, 0.12);
    }, seed);
    c.restore();
  }
  function drawColombe(o) {
    const c = cx_(), t = o.t || 0, pose = o.pose || 'perche', vol = pose !== 'perche', ef = pose === 'effraie' ? 1 : 0;
    const fl = vol ? Math.sin(t * TAU * (ef ? 5.2 : 3.2)) : 0, u = (1 - fl) / 2, H = coTete(o);
    if (vol) aile(8, -62, lerp(0.35, -2.25, (1 - Math.sin(t * TAU * (ef ? 5.2 : 3.2) - 0.5)) / 2), CO.perle, 4801);
    pcC([[-46, -48], [-80, -58], [-92, -54], [-98, -46], [-95, -38], [-88, -32], [-46, -32]], CO.perle, () => { for (const y of [-50, -43, -37]) strokePts([[-50, -40], [-94, y]], 'rgba(120,118,112,0.5)', 1); }, 4802);
    if (!vol) for (const dx of [-4, 6]) { strokePts([[dx, -22], [dx + 2, -4]], CO.patte, 2.4); strokePts([[dx - 6, 0], [dx + 2, -4], [dx + 10, 0]], CO.patte, 2); }
    const body = [[44, -56], [30, -66], [8, -67], [-16, -61], [-40, -52], [-56, -44], [-58, -36], [-40, -28], [-14, -20], [10, -20], [30, -26], [44, -40]];
    pcC(body, CO.plume, () => { strokePts([[30, -30], [6, -24], [-20, -26]], 'rgba(170,165,155,0.5)', 1.2); shade(0, -66, 0, -20, 0.22, [-60, -70, 50, -16]); }, 4803);
    if (ef) for (let i = 0; i < 9; i++) {             // plumes ébouriffées
      const a = PI * 1.05 + i * 0.13 * PI, bx = -6 + Math.cos(a) * 46, by = -44 + Math.sin(a) * 22, w = 0.6 + 0.4 * Math.sin(t * 9 + i);
      pcC([[bx - 5, by + 3], [bx + Math.cos(a) * 14 * w - 2, by + Math.sin(a) * 14 * w], [bx + Math.cos(a) * 16 * w + 3, by + Math.sin(a) * 14 * w + 2], [bx + 5, by + 3]], CO.plume, null, 4804 + i, { drop: false });
    }
    c.save(); c.translate(H[0], H[1]);
    pcC([[30, -62], [36, -84], [48, -90], [60, -84], [62, -72], [56, -60], [44, -50]], CO.plume, () => { dot(54, -64, 6, 'rgba(200,170,190,0.25)'); }, 4815);
    pcC([[60, -76], [72, -72], [61, -67]], CO.bec, () => strokePts([[61, -71.5], [70, -71.5]], 'rgba(120,60,60,0.5)', 0.8), 4816);
    fillPts(ell(59, -76, 3, 2, 8), '#f8f4ec');
    dot(51, -76, ef ? 4 : 3.2, '#141010'); if (ef) strokePts(ep(51, -76, 6, 6, 10, 0, TAU), 'rgba(40,30,30,0.5)', 0.8); dot(52, -77.2, 1, '#ffffff');
    if (o.rameau) {
      strokePts([[66, -70], [80, -62], [94, -52], [104, -40]], '#6b5a34', 2);
      for (const [lx, ly, a, sd] of [[76, -64, 0.6, 1], [84, -60, -0.8, -1], [90, -55, 0.9, 1], [98, -47, -0.5, -1], [104, -38, 1.2, 1]]) {
        const c2 = cx_(); c2.save(); c2.translate(lx, ly); c2.rotate(a); pcC(ell(0, sd * 6, 11, 3.6, 10), '#6f7f45', () => strokePts([[-9, sd * 6], [9, sd * 6]], 'rgba(220,230,190,0.5)', 0.8), 4820 + lx, { drop: false }); c2.restore();
      }
      dot(88, -50, 3.6, '#3b3f26'); dot(100, -44, 3.2, '#3b3f26');
    }
    c.restore();
    if (vol) aile(14, -58, lerp(0.35, -2.25, u), CO.plume, 4830);
    else pcC([[30, -58], [14, -63], [-10, -59], [-40, -50], [-72, -44], [-64, -38], [-36, -35], [-8, -36], [18, -42]], CO.perle, () => {
      for (let i = 0; i < 4; i++) strokePts([[-20 - i * 12, -54 + i * 2], [-46 - i * 7, -40 + i]], 'rgba(120,118,112,0.6)', 1.1);
      strokePts([[24, -54], [-30, -48]], 'rgba(255,255,255,0.5)', 1.2);
    }, 4831);
    if (ef && !SIL()) for (let i = 0; i < 3; i++) {   // plumes qui s'envolent
      const uu = ((t * 0.8 + i * 0.33) % 1), fx = -30 + i * 26 + 20 * Math.sin(uu * 6 + i), fy = -40 - uu * 90;
      c.save(); c.globalAlpha = 1 - uu; c.translate(fx, fy); c.rotate(uu * 4 + i); fillPts(ell(0, 0, 8, 3, 8), CO.plume); strokePts([[-8, 0], [8, 0]], CO.perleD, 0.8); c.restore();
    }
  }
  NOB.colombe = (x, y, s, o) => {
    o = o || {}; const r = accDraw('colombe', x, y, s == null ? 0.85 : s, o, (oo) => drawColombe(oo)), H = coTete(o);
    r.bec = r.w('o', BEC[0] + H[0], BEC[1] + H[1]); r.rameau = r.w('o', 104 + H[0], -38 + H[1]); r.centre = r.w('o', 0, -44);
    return r;
  };

  // ---------------- portrait d'Alfred dans son cadre doré (pré-rendu dans init) ; (x,y) = milieu du bord HAUT du cadre
  const PW = 340, PH = 420;
  function dessinePortrait() {
    // cadre ouvragé
    pc(rect(-PW / 2, -PH, PW / 2, 0), OR.or, () => {
      fillPts(rect(-PW / 2 + 14, -PH + 14, PW / 2 - 14, -14), OR.orD);
      fillPts(rect(-PW / 2 + 22, -PH + 22, PW / 2 - 22, -22), OR.orL);
      for (let i = 0; i < 26; i++) { dot(-PW / 2 + 8 + i * 12.8, -PH + 7, 2.6, OR.orD); dot(-PW / 2 + 8 + i * 12.8, -7, 2.6, OR.orD); }
      for (let i = 0; i < 33; i++) { dot(-PW / 2 + 7, -PH + 8 + i * 12.6, 2.6, OR.orD); dot(PW / 2 - 7, -PH + 8 + i * 12.6, 2.6, OR.orD); }
      for (const [cx, cy] of [[-PW / 2 + 22, -PH + 22], [PW / 2 - 22, -PH + 22], [-PW / 2 + 22, -22], [PW / 2 - 22, -22]]) { fillPts(ell(cx, cy, 16, 16, 14), OR.or); strokePts(ep(cx, cy, 10, 10, 10, 0, TAU), OR.orDD, 1.4); dot(cx, cy, 3.5, OR.orL); }
      for (const cy of [-PH + 12, -12]) { fillPts(ell(0, cy, 34, 11, 14), OR.or); strokePts(ep(0, cy, 24, 6, 12, 0, TAU), OR.orDD, 1.2); }
      hatch(null, 0.8, 4, 0.18);
    }, 4901);
    // toile : fond olive sombre et buste de 3/4
    const IX0 = -PW / 2 + 30, IX1 = PW / 2 - 30, IY0 = -PH + 30, IY1 = -30;
    pc(rect(IX0, IY0, IX1, IY1), '#3c3b2c', () => {
      const c = cx_(), g = c.createRadialGradient(-30, -300, 10, -30, -300, 260); g.addColorStop(0, 'rgba(150,130,90,0.55)'); g.addColorStop(1, 'rgba(20,18,12,0)');
      if (!SIL()) { c.fillStyle = g; c.fillRect(IX0, IY0, IX1 - IX0, IY1 - IY0); }
      // buste : redingote ardoise, chemise, nœud noir
      fillPts([[-128, -30], [-120, -110], [-90, -150], [-40, -168], [40, -168], [86, -150], [116, -110], [128, -30]], '#46515b');
      fillPts([[-26, -168], [26, -168], [16, -100], [0, -80], [-16, -100]], '#ebe5d4');
      fillPts([[-40, -166], [-14, -150], [-6, -90], [-30, -110]], '#3a434c'); fillPts([[40, -166], [14, -150], [8, -90], [32, -110]], '#3a434c');
      fillPts([[-24, -160], [0, -150], [-24, -140]], '#121012'); fillPts([[24, -160], [0, -150], [24, -140]], '#121012'); dot(0, -150, 5, '#222');
      fillPts([[-12, -140], [12, -140], [10, -80], [-10, -80]], '#a8843f');
      // tête de 3/4 (tournée vers la gauche du tableau)
      fillPts([[-16, -176], [18, -176], [16, -200], [-12, -200]], '#c9a684');
      fillPts(ell(2, -258, 46, 60, 24), '#dcbc98');
      fillPts([[30, -290], [46, -276], [50, -246], [44, -222], [36, -236], [32, -262]], '#3b2a1e');
      fillPts([[-36, -284], [-44, -264], [-42, -246], [-36, -258]], '#3b2a1e');
      fillPts(ell(46, -250, 6, 11, 10), '#c9a684'); strokePts([[46, -258], [43, -250], [46, -243]], 'rgba(110,70,50,0.7)', 1.2);
      fillPts([[-40, -246], [-36, -226], [-24, -206], [-6, -194], [12, -196], [30, -208], [42, -226], [44, -244], [36, -232], [24, -218], [8, -214], [-6, -216], [-20, -222], [-30, -234]], '#33241a');
      fillPts([[-26, -232], [-14, -238], [-4, -236], [8, -238], [18, -232], [8, -228], [-4, -230], [-16, -228]], '#2c1f16');
      strokePts([[-14, -222], [4, -222]], 'rgba(120,60,50,0.85)', 1.6);
      strokePts([[-6, -270], [-14, -248], [-6, -242]], 'rgba(120,80,60,0.75)', 1.8);
      for (const [ex, sz] of [[-24, 0.85], [12, 1]]) { fillPts(ell(ex, -264, 7.5 * sz, 3.8, 10), '#f0e8da'); dot(ex - 1.5, -264, 2.8 * sz, '#2a1f1d'); strokePts([[ex - 11 * sz, -276], [ex, -279], [ex + 10 * sz, -276]], '#33241a', 3.6); strokePts([[ex - 7, -259], [ex + 6, -259]], 'rgba(120,80,60,0.45)', 1); }
      strokePts([[-26, -306], [-4, -316], [24, -310]], 'rgba(255,240,220,0.5)', 3);
      hatch(rect(IX0, IY0, IX1, IY1), 0.75, 5, 0.16);
      shade(IX0, 0, IX1, 0, 0.35, [IX0, IY0, IX1, IY1]);
    }, 4902, { drop: false });
    strokePts([[IX0, IY0], [IX1, IY0], [IX1, IY1], [IX0, IY1], [IX0, IY0]], OR.orDD, 2);
  }
  function laurier(k, t) {                               // couronne de laurier dorée (centre (0,0), rayon 52)
    const c = cx_(); c.save(); c.scale(k, k);
    for (let i = 0; i < 22; i++) {
      const a = PI * 0.62 + i / 21 * PI * 1.76, x = Math.cos(a) * 50, y = Math.sin(a) * 50;
      for (const sd of [-1, 1]) { c.save(); c.translate(x, y); c.rotate(a + PI / 2 + sd * 0.55); pc(ell(0, -10, 5.2, 12, 10), i % 2 ? OR.or : OR.orL, () => strokePts([[0, -20], [0, 0]], OR.orD, 0.9), 4950 + i * 2 + sd, { drop: false }); c.restore(); }
    }
    pc([[-8, 46], [8, 46], [20, 76], [10, 74], [0, 56], [-10, 74], [-20, 76]], '#8a2a24', null, 4999, { drop: false });
    pc(ell(0, 48, 9, 7, 10), '#a03a30', null, 4998, { drop: false });
    c.restore();
  }
  NOB.portrait = (x, y, s, o) => {
    o = o || {}; s = s == null ? 1 : s; const c = cx_(), K = NOB.K, t = o.t || 0, rot = o.rot || 0;
    const cs = Math.cos(rot), sn = Math.sin(rot), W = (lx, ly) => [x + (lx * cs - ly * sn) * s, y + (lx * sn + ly * cs) * s];
    const aG = W(-120, 0), aD = W(120, 0);
    if (o.cables !== false && !SIL()) { c.save(); c.strokeStyle = 'rgba(30,24,18,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(aG[0], aG[1]); c.lineTo(aG[0] - 4, 0); c.moveTo(aD[0], aD[1]); c.lineTo(aD[0] + 4, 0); c.stroke(); c.restore(); }
    c.save(); c.translate(x, y); c.rotate(rot);
    M.flat(K.portrait, 0, PH * s, { scale: s, cast: o.cast, alpha: o.alpha });
    c.scale(s, s);
    const om = clamp(o.ombre || 0);
    if (om > 0 && !SIL()) { c.fillStyle = `rgba(10,8,16,${0.62 * om})`; c.fillRect(-PW / 2 + 30, 30, PW - 60, PH - 60); const g = c.createLinearGradient(0, 30, 0, PH - 30); g.addColorStop(0, `rgba(0,0,0,${0.3 * om})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-PW / 2 + 30, 30, PW - 60, PH - 60); }
    for (const sx of [-120, 120]) pc(ell(sx, 4, 7, 7, 10), OR.orD, () => dot(sx, 4, 2.4, '#2a2018'), 4960 + sx, { drop: false });
    const la = clamp(o.laurier || 0);
    if (la > 0) { c.save(); c.translate(0, 0); laurier(easeOut(la) * (1 + 0.15 * Math.sin(la * PI)), t); c.restore(); }
    c.restore();
    return { accrocheG: aG, accrocheD: aD, centre: W(0, PH / 2), bas: W(0, PH) };
  };

  // ---------------- médaillons des cinq prix, suspendus à un fil ; (x,y) = centre du disque ; k = échelle (1 ≈ 120 px)
  const EMAIL = ['#2a3a62', '#3f5a3a', '#7e2620', '#9a7430', '#7f9bb4'];
  NOB.MEDAILLONS = { couleurs: EMAIL, sujets: ['physique', 'chimie', 'medecine', 'litterature', 'paix'] };
  NOB.medaillon = (i, x, y, k, o) => {
    o = o || {}; k = k == null ? 1 : k; const c = cx_(), g = M.tg(o.t || 0), d = o.descente == null ? 1 : clamp(o.descente);
    const yy = lerp(-90, y, easeOut(d)) + (d > 0.7 && d < 1 ? -10 * Math.sin((d - 0.7) / 0.3 * PI) : 0), rot = 0.05 * Math.sin(g * 1.3 + i * 1.7) * (o.balance == null ? 1 : o.balance);
    if (!SIL()) { c.save(); c.strokeStyle = 'rgba(40,32,22,0.85)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, -10); c.lineTo(x + Math.sin(rot) * 60 * k, yy - 60 * k); c.stroke(); c.restore(); }
    c.save(); c.translate(x, yy - 60 * k); c.rotate(-rot); c.translate(0, 60 * k); c.scale(k, k);
    if (o.cast && !SIL()) { c.save(); c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.arc(12, 8, 60, 0, TAU); c.fill(); c.restore(); }
    pc(ell(0, 0, 60, 60, 28), OR.or, () => {
      fillPts(ell(0, 0, 49, 49, 26), EMAIL[i]);
      for (let j = 0; j < 30; j++) { const a = j / 30 * TAU; dot(Math.cos(a) * 54.5, Math.sin(a) * 54.5, 1.9, j % 2 ? OR.orL : OR.orD); }
      const cc = cx_(); cc.save(); icone(i, 34, false); cc.restore();
      shade(-60, -60, 60, 60, 0.28, [-62, -62, 62, 62]);
    }, 5001 + i);
    pc(ell(0, -63, 7, 6, 10), OR.orD, null, 5010 + i, { drop: false });
    c.restore();
    return [x, yy];
  };

  // ---------------- bouffée d'explosion de théâtre : éclair bref puis volutes rondes irrégulières (jamais de bord droit)
  NOB.pouf = (t, x, y, k, o) => {
    o = o || {}; k = k == null ? 1 : k; const t0 = o.t0 || 0, dur = o.dur || 1.5, v = o.variante || 'boum', e = t - t0;
    if (e < 0 || e > dur) return;
    const u = e / dur, c = cx_(), col = v === 'colere' ? '#5b5753' : v === 'confettis' ? '#d9cfb4' : (o.couleur || '#8f8270');
    const big = v === 'colere' ? 0.62 : 1;
    if (e < 0.1 && v !== 'colere') {                        // éclair jaune bref (≈ 3 images)
      const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = (i % 2 ? 0.5 : 1) * 135 * k * (0.85 + 0.3 * hash(i + 3)); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
      pc(pts, '#f6d25a', () => fillPts(blobPts(x, y, 60 * k, 9, 10, 0.2), '#fff3c4'), 5101, { drop: false });
    }
    const R = M.rng(o.seed || 41), n = v === 'colere' ? 7 : 11;
    c.save(); c.globalAlpha = Math.pow(1 - u, 0.8);
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, dd = (20 + 90 * R()) * k * big * easeOut(Math.min(1, u * 2.2)), r = (38 + 34 * R()) * k * big * (0.45 + 0.75 * easeOut(Math.min(1, u * 1.8)));
      const bx = x + Math.cos(a) * dd, by = y + Math.sin(a) * dd * 0.75 - 40 * k * u;
      pc(blobPts(bx, by, r, i + 11, 12, 0.24), col, () => { fillPts(blobPts(bx - r * 0.18, by - r * 0.22, r * 0.62, i + 31, 10, 0.2), 'rgba(255,250,235,0.35)'); strokePts(ep(bx, by, r * 0.8, r * 0.7, 10, PI * 0.15, PI * 0.85), 'rgba(40,30,20,0.25)', 1.4); }, 5110 + i, { drop: false });
    }
    c.restore();
    if (!SIL() && v !== 'colere' && u < 0.6) {              // étincelles
      for (let i = 0; i < 12; i++) { const a = hash(i * 5.3) * TAU, d = (60 + 140 * hash(i)) * k * easeOut(u / 0.6), sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d + 160 * k * u * u;
        c.fillStyle = `rgba(255,${160 + 80 * hash(i + 1)},60,${1 - u / 0.6})`; c.beginPath(); c.arc(sx, sy, 3.2 * k, 0, TAU); c.fill(); }
    }
    if (v === 'confettis') for (let i = 0; i < 44; i++) {
      const a = hash(i * 2.7) * TAU, sp = (120 + 220 * hash(i + 9)) * k, fx = x + Math.cos(a) * sp * easeOut(Math.min(1, u * 2)) + 20 * Math.sin(e * 6 + i), fy = y + Math.sin(a) * sp * 0.6 * easeOut(Math.min(1, u * 2)) + 260 * k * u * u;
      const w = Math.cos(e * 9 + i) * 6 * k; c.save(); c.globalAlpha = 1 - Math.max(0, u - 0.7) / 0.3; c.translate(fx, fy); c.rotate(e * 3 + i);
      fillPts([[-w, -3 * k], [w, -3 * k], [w, 3 * k], [-w, 3 * k]], [OR.orL, OR.or, '#efe2b0', '#d9b65a'][i % 4]); c.restore();
    }
    if (v === 'colere') for (let i = 0; i < 4; i++) {        // étoiles de carton qui sautent autour du nuage
      const a = -PI / 2 + (i - 1.5) * 0.7, d = 80 * k * easeOut(Math.min(1, u * 2.5)), sx = x + Math.cos(a) * d * 1.2, sy = y + Math.sin(a) * d - 10 * Math.abs(Math.sin(e * 10 + i));
      const st = []; for (let j = 0; j < 12; j++) { const aa = j / 12 * TAU + e * 2, rr = (j % 2 ? 6 : 15) * k; st.push([sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr]); }
      pc(st, i % 2 ? '#e6c35a' : '#efe6cc', null, 5130 + i, { drop: false });
    }
  };

  // =====================================================================
  // DÉCORS — pré-rendus dans NOB.init() ; animations en temps global M.tg(t)
  // =====================================================================
  const BACK = ST.back;
  const layer = (fn) => M.pre(M.W, BACK + 5, (c) => fn(c));
  function grad(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [k, col] of stops) g.addColorStop(k, col); return g; }
  function toile(c, a) { c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = a; c.fillStyle = M.tex.canvasPat; c.fillRect(0, 0, M.W, BACK + 5); c.restore(); }
  function fleur(x, y, r, col, seed) { pc(blobPts(x, y, r, seed, 9, 0.3), col, () => dot(x, y, r * 0.32, col === '#f2eee2' ? '#e2c040' : '#b88a20'), seed, { drop: false }); }
  function gerbe(cx, by, w, h, seed) {                 // massif de fleurs blanches et jaunes dans une vasque
    const R = M.rng(seed);
    pc([[cx - 44, by - 70], [cx + 44, by - 70], [cx + 34, by - 30], [cx + 20, by - 18], [cx + 24, by, 1], [cx - 24, by, 1], [cx - 20, by - 18], [cx - 34, by - 30]], OR.or, () => { strokePts([[cx - 40, by - 62], [cx + 40, by - 62]], OR.orL, 2); hatch(null, 0.8, 4, 0.2); }, seed);
    for (let i = 0; i < 26; i++) { const a = -PI * (0.1 + 0.8 * R()), d = R(); pc(ell(cx + Math.cos(a) * w * 0.5 * d, by - 70 + Math.sin(a) * h * d, 14, 5, 8), '#56703f', null, seed + 1 + i, { drop: false }); }
    for (let i = 0; i < 34; i++) {
      const a = -PI * (0.05 + 0.9 * R()), d = 0.35 + 0.65 * Math.sqrt(R());
      fleur(cx + Math.cos(a) * w * 0.5 * d, by - 74 + Math.sin(a) * h * d, 9 + 6 * R(), R() < 0.55 ? '#f2eee2' : '#e6c35a', seed + 40 + i);
    }
  }
  function chaiseDoree(x, by, sc, flip, seed) {
    const f = flip ? -1 : 1, X_ = (v) => x + v * f * sc, Y_ = (v) => by - v * sc;
    pc([[X_(-26), Y_(180)], [X_(-14), Y_(186)], [X_(-12), Y_(90)], [X_(-24), Y_(88)]].map((p) => [p[0], p[1]]), OR.or, null, seed, { drop: false });
    pc([[X_(-22), Y_(176)], [X_(-14), Y_(178)], [X_(-14), Y_(102)], [X_(-22), Y_(102)]], '#8a2a24', () => hatch(null, 0.8, 3, 0.2), seed + 1, { drop: false });
    pc([[X_(-28), Y_(96)], [X_(36), Y_(96)], [X_(36), Y_(82)], [X_(-28), Y_(82)]], '#9a3028', null, seed + 2);
    for (const lx of [-24, 30]) pc([[X_(lx - 4), Y_(84)], [X_(lx + 4), Y_(84)], [X_(lx + 3), Y_(0)], [X_(lx - 3), Y_(0)]], OR.or, null, seed + 3 + lx, { drop: false });
  }
  // ---------------------------------------------------------------- SALLE DE CONCERT DE STOCKHOLM (aujourd'hui)
  const SALLE = { portrait: { x: 540, y: 520 }, lustres: [[330, 150, 370], [750, 150, 370]], fenetres: [[215, 296, 295, 600], [785, 296, 865, 600]],
    torcheres: [[238, 792], [846, 792]], pupitre: { x: 790, y: 1108 }, buste: { x: 905, y: 1060 }, gerbes: [[140, 1395], [905, 1395]], estrade: 1318 };
  NOB.SALLE = SALLE;
  function salleFond() { return layer((c) => {
    c.fillStyle = grad(c, 0, 0, 0, BACK, [[0, '#162a48'], [0.35, '#23406b'], [1, '#1d3558']]); c.fillRect(0, 0, M.W, BACK + 5);
    for (let r = 0; r < 16; r++) for (let k = 0; k < 13; k++) { const px = k * 90 + (r % 2) * 45, py = 250 + r * 70; c.fillStyle = 'rgba(160,190,230,0.06)'; c.beginPath(); c.ellipse(px, py, 10, 16, 0, 0, TAU); c.fill(); }
    // corniche dorée
    piece(rect(-10, 170, M.W + 10, 228), '#b89540', () => { for (let k = 0; k < 40; k++) dot(k * 28 + 10, 214, 4, OR.orD); strokePts([[0, 182], [M.W, 182]], OR.orL, 2); hatch(null, 0.2, 4, 0.18); }, { seed: 6001 });
    // fenêtres hautes cintrées : nuit d'hiver (la neige est animée)
    for (const [x0, y0, x1, y1] of SALLE.fenetres) {
      const cxw = (x0 + x1) / 2, rr = (x1 - x0) / 2;
      piece([[x0 - 14, y1 + 14, 1], [x0 - 14, y0 + rr], ...ep(cxw, y0 + rr, rr + 14, rr + 14, 10, PI, TAU).slice(1, -1), [x1 + 14, y0 + rr], [x1 + 14, y1 + 14, 1]], '#d8d0bc', null, { seed: 6010 + x0 });
      c.fillStyle = grad(c, 0, y0, 0, y1, [[0, '#0d1830'], [1, '#233a5c']]);
      c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, y0 + rr); c.arc(cxw, y0 + rr, rr, PI, TAU); c.lineTo(x1, y1); c.closePath(); c.fill();
      c.fillStyle = '#e8eef4'; c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, y1 - 30); c.quadraticCurveTo(cxw, y1 - 52, x1, y1 - 34); c.lineTo(x1, y1); c.fill();
      c.fillStyle = 'rgba(40,50,70,0.8)'; for (const [hx, hw, hh] of [[x0 + 8, 20, 40], [x0 + 40, 28, 56]]) c.fillRect(hx, y1 - 30 - hh, hw, hh);
      c.fillStyle = 'rgba(255,214,140,0.85)'; c.fillRect(x0 + 14, y1 - 58, 6, 8); c.fillRect(x0 + 50, y1 - 74, 6, 8);
      c.strokeStyle = '#d8d0bc'; c.lineWidth = 5; c.beginPath(); c.moveTo(cxw, y0); c.lineTo(cxw, y1); for (let y = y0 + rr; y < y1; y += 80) { c.moveTo(x0, y); c.lineTo(x1, y); } c.stroke();
    }
    // grand orgue : buffet doré, tuyaux d'étain en trois tourelles
    piece([[320, 640, 1], [320, 330], [360, 300], [420, 290], [470, 262], [540, 240], [610, 262], [660, 290], [720, 300], [760, 330], [760, 640, 1]], '#7a5a2a', () => { hatch(null, 0.9, 4, 0.22); }, { seed: 6020 });
    const tuyaux = (x0, n, w, yb, hTop, hDrop) => { for (let i = 0; i < n; i++) { const h = hTop - hDrop * Math.abs(i - (n - 1) / 2) / ((n - 1) / 2 || 1), x = x0 + i * w;
      piece([[x, yb, 1], [x, yb - h + 10], [x + w / 2, yb - h], [x + w, yb - h + 10], [x + w, yb, 1]], '#b9bec4', () => { strokePts([[x + w * 0.3, yb - h + 14], [x + w * 0.3, yb - 6]], 'rgba(255,255,255,0.6)', 2); fillPts(ell(x + w / 2, yb - 40, w * 0.32, 5, 8), '#1c2430'); }, { seed: 6030 + x }); } };
    tuyaux(452, 8, 22, 560, 290, 50); tuyaux(340, 5, 20, 560, 200, 40); tuyaux(640, 5, 20, 560, 200, 40);
    piece(rect(320, 560, 760, 650), '#5d4020', () => { for (let k = 0; k < 6; k++) { fillPts(rect(336 + k * 72, 576, 392 + k * 72, 634), '#6d4c28'); strokePts([[336 + k * 72, 634], [336 + k * 72, 576], [392 + k * 72, 576]], 'rgba(255,220,150,0.3)', 1.4); } strokePts([[320, 562], [760, 562]], OR.orL, 3); }, { seed: 6040 });
    for (const x of [330, 750]) piece([[x - 10, 650, 1], [x - 10, 330], [x, 312], [x + 10, 330], [x + 10, 650, 1]], OR.or, null, { seed: 6041 + x });
    // galerie à balcons dorés en arc
    piece(rect(-10, 660, M.W + 10, 770), '#1a3050', () => {
      for (let k = -1; k < 10; k++) { const ax = 60 + k * 120; strokePts(ep(ax, 770, 54, 70, 12, PI, TAU), OR.or, 4); fillPts(ep(ax, 770, 48, 62, 12, PI, TAU), 'rgba(10,20,35,0.5)'); }
      fillPts(rect(-10, 660, M.W + 10, 676), OR.or); for (let x = 0; x < M.W; x += 16) fillPts(rect(x, 676, x + 7, 704), OR.orD);
      fillPts(rect(-10, 702, M.W + 10, 710), OR.or);
    }, { seed: 6050 });
    // lambris bas
    piece(rect(-10, 770, M.W + 10, BACK + 10), '#1c3354', () => {
      for (let k = 0; k < 8; k++) { const x0 = 20 + k * 132; strokePts([[x0, 1240], [x0, 820], [x0 + 112, 820], [x0 + 112, 1240], [x0, 1240]], 'rgba(200,170,90,0.45)', 2); }
      strokePts([[0, 790], [M.W, 790]], OR.or, 3); hatch(null, 0.15, 5, 0.12, 1, P.encre, [0, 770, M.W, BACK]);
    }, { seed: 6060 });
    // colonnes corinthiennes blanc cassé
    for (const cxc of [170, 910]) {
      piece(rect(cxc - 32, 300, cxc + 32, 1250), '#e6dfcf', () => { for (let k = -2; k <= 2; k++) strokePts([[cxc + k * 12, 306], [cxc + k * 12, 1244]], 'rgba(120,110,90,0.4)', 2.2); shade(cxc - 32, 0, cxc + 32, 0, 0.35, [cxc - 34, 300, cxc + 34, 1250]); }, { seed: 6070 + cxc });
      piece([[cxc - 54, 300, 1], [cxc + 54, 300, 1], [cxc + 40, 242], [cxc - 40, 242]], '#ece6d6', () => {
        for (let k = 0; k < 7; k++) fillPts(blobPts(cxc - 36 + k * 12, 286 - (k % 2) * 12, 9, 6070 + k + cxc, 8, 0.3), '#d4ccb8');
        for (const sd of [-1, 1]) strokePts(ep(cxc + sd * 40, 256, 10, 10, 10, 0, TAU * 0.85), 'rgba(110,100,80,0.7)', 1.8);
      }, { seed: 6080 + cxc });
      piece(rect(cxc - 50, 230, cxc + 50, 244), '#ece6d6', null, { seed: 6090 + cxc });
      piece(rect(cxc - 46, 1250, cxc + 46, 1290), '#d8d0bc', null, { seed: 6095 + cxc });
    }
    toile(c, 0.35);
  }); }
  function salleMilieu() { return layer((c) => {
    // estrade à deux marches tendue de tapis bleu roi
    piece([[-10, SALLE.estrade, 1], [M.W + 10, SALLE.estrade, 1], [M.W + 10, BACK + 10, 1], [-10, BACK + 10, 1]], '#2d4a8a', () => {
      fillPts(rect(-10, SALLE.estrade, M.W + 10, SALLE.estrade + 8), '#4566ad'); fillPts(rect(-10, 1356, M.W + 10, 1364), '#4566ad');
      strokePts([[0, 1356], [M.W, 1356]], 'rgba(10,20,50,0.6)', 2); for (let x = 0; x < M.W; x += 26) strokePts([[x, 1324], [x + 4, 1354]], 'rgba(10,20,50,0.2)', 1);
      strokePts([[0, SALLE.estrade + 14], [M.W, SALLE.estrade + 14]], OR.or, 2); strokePts([[0, 1370], [M.W, 1370]], OR.or, 2);
    }, { seed: 6101 });
    for (const [x, s, fl] of [[60, 1, false], [130, 0.95, false], [995, 0.95, true]]) chaiseDoree(x, BACK, s, fl, 6110 + x);
    // torchères dorées (flammes animées)
    for (const [tx, ty] of SALLE.torcheres) {
      piece([[tx - 30, BACK, 1], [tx + 30, BACK, 1], [tx + 12, BACK - 30], [tx + 6, ty + 30], [tx + 18, ty + 6], [tx + 22, ty], [tx - 22, ty], [tx - 18, ty + 6], [tx - 6, ty + 30], [tx - 12, BACK - 30]], OR.or, () => {
        for (let y = ty + 60; y < BACK - 40; y += 90) fillPts(ell(tx, y, 9, 6, 10), OR.orD); strokePts([[tx - 3, ty + 40], [tx - 3, BACK - 40]], OR.orL, 1.6); hatch(null, 0.8, 4, 0.2);
      }, { seed: 6130 + tx });
    }
    // pupitre-lutrin doré
    const PU = SALLE.pupitre;
    piece([[PU.x - 50, BACK, 1], [PU.x + 50, BACK, 1], [PU.x + 16, BACK - 24], [PU.x + 10, PU.y + 34], [PU.x - 10, PU.y + 34], [PU.x - 16, BACK - 24]], OR.or, () => { strokePts([[PU.x - 3, PU.y + 40], [PU.x - 3, BACK - 30]], OR.orL, 2); hatch(null, 0.8, 4, 0.22); }, { seed: 6140 });
    piece([[PU.x - 72, PU.y, 1], [PU.x + 72, PU.y, 1], [PU.x + 58, PU.y + 64, 1], [PU.x - 58, PU.y + 64, 1]], '#a6852f', () => {
      strokePts([[PU.x - 70, PU.y + 4], [PU.x + 70, PU.y + 4]], OR.orL, 3); fillPts([[PU.x - 50, PU.y + 14, 1], [PU.x + 50, PU.y + 14, 1], [PU.x + 42, PU.y + 54, 1], [PU.x - 42, PU.y + 54, 1]], OR.orD);
      fillPts(ell(PU.x, PU.y + 34, 14, 10, 12), OR.or); strokePts(ep(PU.x, PU.y + 34, 22, 14, 14, PI * 0.1, PI * 0.9), OR.orL, 1.6); hatch(null, 0.8, 4, 0.2);
    }, { seed: 6141 });
    piece([[PU.x - 76, PU.y - 6, 1], [PU.x + 76, PU.y - 6, 1], [PU.x + 72, PU.y + 2, 1], [PU.x - 72, PU.y + 2, 1]], OR.orD, null, { seed: 6142 });
    // buste de marbre sur socle (anonyme)
    const BU = SALLE.buste;
    piece(rect(BU.x - 40, BU.y + 120, BU.x + 40, BACK), '#d9d3c6', () => { strokePts([[BU.x - 40, BU.y + 136], [BU.x + 40, BU.y + 136]], 'rgba(120,110,95,0.5)', 2); shade(BU.x - 40, 0, BU.x + 40, 0, 0.3, [BU.x - 42, BU.y + 118, BU.x + 42, BACK]); }, { seed: 6150 });
    piece(rect(BU.x - 50, BU.y + 108, BU.x + 50, BU.y + 124), '#e4dfd4', null, { seed: 6151 });
    piece([[BU.x - 44, BU.y + 108], [BU.x - 36, BU.y + 70], [BU.x - 14, BU.y + 58], [BU.x - 12, BU.y + 40], [BU.x - 24, BU.y + 20], [BU.x - 22, BU.y - 6], [BU.x - 4, BU.y - 22], [BU.x + 16, BU.y - 16], [BU.x + 22, BU.y + 4], [BU.x + 18, BU.y + 30], [BU.x + 12, BU.y + 56], [BU.x + 34, BU.y + 68], [BU.x + 44, BU.y + 108]], '#ece8de', () => { shade(BU.x + 30, 0, BU.x - 30, 0, 0.35, [BU.x - 50, BU.y - 30, BU.x + 50, BU.y + 110]); strokePts([[BU.x - 18, BU.y + 2], [BU.x - 10, BU.y + 4]], 'rgba(120,110,95,0.6)', 1.4); }, { seed: 6152 });
    for (const [gx, gy] of SALLE.gerbes) gerbe(gx, gy, 200, 150, 6160 + gx);
    toile(c, 0.3);
  }); }
  function lustre(x, yTop, yBody, t, fort) {
    const c = cx_(), g = M.tg(t), a = 0.025 * Math.sin(g * 0.9 + x * 0.01);
    c.save(); c.translate(x, yTop); c.rotate(a); const L = yBody - yTop;
    c.strokeStyle = 'rgba(60,45,20,0.9)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, -yTop); c.lineTo(0, L - 30); c.stroke();
    pc([[-8, L - 40], [8, L - 40], [14, L + 30], [0, L + 60], [-14, L + 30]], OR.or, null, 6201 + x, { drop: false });
    pc(ell(0, L + 10, 86, 16, 22), OR.orD, () => strokePts(ep(0, L + 8, 80, 12, 20, PI, TAU), OR.orL, 2), 6202 + x, { drop: false });
    for (let i = 0; i < 9; i++) {
      const ax = -78 + i * 19.5, ay = L + 16 + 6 * Math.sin(i), tw = 0.5 + 0.5 * Math.sin(g * (3 + i * 0.7) + i * 2) * Math.sin(g * 1.7 + i);
      c.strokeStyle = 'rgba(220,230,240,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(ax, L + 12); c.lineTo(ax, ay + 18); c.stroke();
      pc([[ax, ay + 14], [ax + 5, ay + 24], [ax, ay + 36], [ax - 5, ay + 24]], '#dfe8f0', null, 6210 + i + x, { drop: false });
      if (!SIL()) { const s = (0.4 + 0.6 * tw) * (fort ? 1.8 : 1); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,250,230,${0.55 * s})`; c.beginPath(); c.arc(ax, ay + 24, 2 + 3 * s, 0, TAU); c.fill(); c.restore(); }
    }
    for (const bx of [-60, -20, 20, 60]) { pc(rect(bx - 4, L - 20, bx + 4, L + 4), '#f3ecda', null, 6230 + bx + x, { drop: false }); M.flamme(t, { x: bx, y: L - 20, s: 0.32, r: 40, seed: 7 + bx }); }
    if (!SIL()) { c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(0, L, 10, 0, L, 200); gl.addColorStop(0, `rgba(255,230,170,${fort ? 0.4 : 0.22})`); gl.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = gl; c.beginPath(); c.arc(0, L, 200, 0, TAU); c.fill(); c.restore(); }
    c.restore();
  }
  function neigeDans(t, x0, y0, x1, y1, n, seed, vent, rafale) {
    if (SIL()) return; const c = cx_(), g = M.tg(t), R = M.rng(seed);
    c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip(); c.fillStyle = 'rgba(240,244,250,0.9)';
    for (let i = 0; i < n; i++) { const sp = 30 + 40 * R(), ph = R(), xx = R(), u = ((g * sp / (y1 - y0 + 40)) + ph) % 1, y = y0 - 20 + u * (y1 - y0 + 40), x = x0 + xx * (x1 - x0) + 8 * Math.sin(g * 1.3 + i) + (vent || 0) * u + rafale * 60 * Math.sin(u * 6 + i);
      c.beginPath(); c.arc(x, y, 1.4 + 1.6 * R(), 0, TAU); c.fill(); }
    c.restore();
  }
  NOB.salle = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), K = NOB.K, g = M.tg(t), lum = o.lumiere == null ? 1 : clamp(o.lumiere);
    c.save(); c.translate(0, -up);
    c.drawImage(K.salleFond, 0, 0);
    for (const [x0, y0, x1, y1] of SALLE.fenetres) neigeDans(t, x0, y0, x1, y1 - 30, 40, 900 + x0, 12, 0);
    const fort = o.scintilleT0 != null && t > o.scintilleT0 && t < o.scintilleT0 + 1.4;
    for (const [lx, ly, lb] of SALLE.lustres) lustre(lx, ly, lb, t, fort);
    c.drawImage(K.salleMilieu, 0, 0);
    for (const [tx, ty] of SALLE.torcheres) M.flamme(t, { x: tx, y: ty, s: 0.9, r: 150, seed: 11 + tx });
    // pétales qui tombent de la gerbe de gauche (+ événement o.petaleT0)
    if (!SIL()) {
      const pet = (x, y, a, col) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(Math.cos(a * 2.3), 1); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, TAU); c.fill(); c.restore(); };
      for (let i = 0; i < 3; i++) { const u = ((g / 7 + i / 3) % 1), x = 120 + i * 30 + 26 * Math.sin(u * 9 + i), y = 1250 + u * 140; pet(x, y, u * 7 + i, i % 2 ? 'rgba(242,238,226,0.9)' : 'rgba(230,195,90,0.9)'); }
      if (o.petaleT0 != null && t > o.petaleT0 && t < o.petaleT0 + 4) { const u = (t - o.petaleT0) / 4, x = 210 + 60 * u + 30 * Math.sin(u * 8), y = 1240 + u * 150; pet(x, y, u * 9, 'rgba(250,246,236,1)'); }
      // poussière dans le faisceau du projecteur
      c.save(); const beam = [[300, 150], [430, 150], [700, BACK], [420, BACK]];
      c.beginPath(); beam.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      c.globalCompositeOperation = 'lighter'; c.fillStyle = grad(c, 0, 150, 0, BACK, [[0, `rgba(255,236,200,${0.1 * lum})`], [1, 'rgba(255,236,200,0.01)']]); c.fill(); c.clip();
      M.poussiere(t, { x: 300, y: 160, w: 400, h: BACK - 160, n: 44, a: 0.7, seed: 31 }); c.restore();
      if (lum < 1) { c.fillStyle = `rgba(8,10,24,${0.5 * (1 - lum)})`; c.fillRect(0, 0, M.W, BACK + 5); }
    }
    c.restore();
  };
  NOB.salleSol = function (t, o) {
    o = o || {}; const c = cx_();
    for (const [x0, x1] of [[60, 250], [830, 1020]]) for (let i = 0; i < 12; i++) { const x = lerp(x0, x1, i / 11); fleur(x, 1452 + 6 * Math.sin(i * 2), 9, i % 3 ? '#f2eee2' : '#e6c35a', 6300 + x); pc(ell(x + 8, 1462, 10, 4, 8), '#56703f', null, 6400 + x, { drop: false }); }
    for (const x of [90, 170, 240, 840, 910, 990]) { pc(rect(x - 4, 1478, x + 4, 1506), '#f3ecda', () => strokePts([[x - 2, 1480], [x - 2, 1504]], 'rgba(255,255,255,0.6)', 1), 6500 + x); pc(ell(x, 1508, 12, 4, 10), OR.or, null, 6600 + x, { drop: false }); M.flamme(t, { x, y: 1478, s: 0.26, r: 38, seed: x }); }
    const pu = clamp(o.public || 0);
    if (pu > 0 && !SIL()) { c.save(); c.globalAlpha = pu; for (const [hx, hy, r] of [[70, 1600, 46], [170, 1630, 52], [930, 1610, 50], [1030, 1595, 44]]) { c.fillStyle = '#0c0a10'; c.beginPath(); c.ellipse(hx, hy, r * 0.8, r, 0, 0, TAU); c.fill(); c.fillRect(hx - r * 1.3, hy + r * 0.6, r * 2.6, 120); } c.restore(); }
  };

  // ---------------------------------------------------------------- CABINET : club parisien (1895) / bureau du notaire (Stockholm, 1897)
  const CAB = { fenetre: { x0: 380, x1: 660, y0: 330, y1: 880 }, bureau: { x0: 560, x1: 860, plateau: 1170 }, cheminee: { x0: 50, x1: 300, feu: [175, 1330] },
    bibli: { x0: 700, x1: 1010, y0: 300, y1: 1120 }, pendule: { x: 175, y: 760 }, lampe: { x: 800, y: 1054 }, globe: { x: 935, y: 1395 }, coffre: { x0: 880, x1: 1000 },
    drap: { x0: 120, x1: 640, y0: 560, y1: 920 } };
  NOB.CABINET = CAB;
  function cabVue(notaire) { return layer((c) => {          // vue par la fenêtre (clippée à la fenêtre au dessin)
    const F = CAB.fenetre;
    c.fillStyle = grad(c, 0, F.y0, 0, F.y1, notaire ? [[0, '#7e8a9a'], [1, '#c4ccd4']] : [[0, '#a7b0b8'], [1, '#d9d4c6']]); c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    if (notaire) {
      for (const [x, h, w] of [[430, 260, 14], [600, 200, 12]]) { c.fillStyle = '#5e8a7c'; c.beginPath(); c.moveTo(x, F.y1 - 180 - h); c.lineTo(x + w, F.y1 - 180); c.lineTo(x - w, F.y1 - 180); c.fill(); c.fillStyle = '#6a6460'; c.fillRect(x - w, F.y1 - 180, 2 * w, 80); }
      c.fillStyle = '#6a6c72'; c.beginPath(); c.moveTo(F.x0, F.y1 - 110); for (let x = F.x0; x <= F.x1; x += 40) c.lineTo(x, F.y1 - 110 - 30 * ((x / 40) % 2)); c.lineTo(F.x1, F.y1); c.lineTo(F.x0, F.y1); c.fill();
      c.fillStyle = '#f2f4f6'; c.beginPath(); c.moveTo(F.x0, F.y1 - 104); for (let x = F.x0; x <= F.x1; x += 40) c.lineTo(x, F.y1 - 104 - 30 * ((x / 40) % 2)); c.lineTo(F.x1, F.y1 - 90); c.lineTo(F.x0, F.y1 - 90); c.fill();
      c.fillStyle = 'rgba(255,220,150,0.8)'; for (const x of [420, 500, 590]) c.fillRect(x, F.y1 - 70, 8, 10);
    } else {
      for (const [bx, by, br] of [[440, 420, 40], [480, 400, 52], [530, 424, 36], [600, 470, 30]]) { c.fillStyle = 'rgba(240,240,236,0.7)'; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); }
      c.fillStyle = '#5e6a76'; c.beginPath(); c.moveTo(F.x0, F.y1 - 150); c.lineTo(450, F.y1 - 190); c.lineTo(520, F.y1 - 150); c.lineTo(580, F.y1 - 200); c.lineTo(F.x1, F.y1 - 160); c.lineTo(F.x1, F.y1); c.lineTo(F.x0, F.y1); c.fill();
      c.fillStyle = '#7d8993'; for (let x = F.x0; x < F.x1; x += 18) c.fillRect(x, F.y1 - 160 + 12 * Math.sin(x), 3, 160);
      c.fillStyle = '#5a3e30'; for (const x of [470, 600]) c.fillRect(x, F.y1 - 250, 18, 70);
      c.fillStyle = '#d8ccb8'; c.fillRect(F.x0, F.y1 - 90, F.x1 - F.x0, 90); c.fillStyle = 'rgba(80,70,60,0.6)'; for (let x = F.x0 + 10; x < F.x1; x += 34) c.fillRect(x, F.y1 - 76, 14, 20);
    }
  }); }
  function bibliotheque(notaire) {
    const B = CAB.bibli;
    piece(rect(B.x0, B.y0, B.x1, B.y1), '#4a2618', () => {
      const R = M.rng(notaire ? 61 : 62), cols = notaire ? ['#a89c80', '#968a70', '#b2a68a', '#8a7e64'] : ['#6e2a24', '#2f4a3a', '#2a3a5a', '#8a6a2a', '#5a2a40', '#3a5a5a'];
      for (let r = 0; r < 5; r++) {
        const y1 = B.y0 + 40 + (r + 1) * 150, y0 = y1 - 130; let x = B.x0 + 20;
        fillPts(rect(B.x0 + 12, y1, B.x1 - 12, y1 + 14), '#5e3422');
        while (x < B.x1 - 34) {
          const w = notaire ? 40 + 14 * R() : 14 + 12 * R(), h = notaire ? 50 + 30 * R() : 90 + 36 * R(), col = cols[Math.floor(R() * cols.length)];
          if (notaire) { fillPts(rect(x, y1 - h, x + w, y1), col); strokePts([[x, y1 - h / 2], [x + w, y1 - h / 2]], '#8a2a24', 1.4); strokePts([[x + w / 2, y1 - h], [x + w / 2, y1]], '#8a2a24', 1.4); fillPts(rect(x, y1 - h - 8, x + w, y1 - h), col); }
          else { fillPts(rect(x, y1 - h, x + w, y1), col); for (const yy of [y1 - h + 12, y1 - 14]) strokePts([[x + 2, yy], [x + w - 2, yy]], 'rgba(220,180,90,0.7)', 1.4); }
          x += w + 3;
        }
      }
      for (let k = 0; k < 3; k++) { const x0 = B.x0 + 14 + k * ((B.x1 - B.x0 - 28) / 3); strokePts([[x0, B.y0 + 20], [x0, B.y1 - 10]], '#3a1c12', 5); }
      if (!SIL()) { const c = cx_(); c.fillStyle = 'rgba(210,230,240,0.08)'; c.fillRect(B.x0 + 14, B.y0 + 20, B.x1 - B.x0 - 28, B.y1 - B.y0 - 30); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { const x = B.x0 + 40 + k * 100; c.beginPath(); c.moveTo(x, B.y0 + 30); c.lineTo(x + 60, B.y0 + 200); c.stroke(); } }
      hatch(null, 0.2, 5, 0.12, 1, P.encre, [B.x0, B.y0, B.x1, B.y1]);
    }, { seed: 6701 });
    piece(rect(B.x0 - 14, B.y0 - 30, B.x1 + 14, B.y0 + 6), '#5e3422', () => strokePts([[B.x0 - 10, B.y0 - 6], [B.x1 + 10, B.y0 - 6]], 'rgba(220,180,110,0.4)', 2), { seed: 6702 });
  }
  function cabFond(notaire) { return layer((c) => {
    const F = CAB.fenetre;
    c.fillStyle = notaire ? '#3a2a22' : '#3d2418'; c.fillRect(0, 0, M.W, BACK + 5);
    for (let k = 0; k < 14; k++) { const x0 = k * 80; c.fillStyle = k % 2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,200,150,0.04)'; c.fillRect(x0, 240, 80, 760); }
    piece(rect(-10, 150, M.W + 10, 250), '#4a2a1a', () => { for (let k = 0; k < 30; k++) fillPts(rect(k * 38, 222, k * 38 + 20, 238), '#5e3a24'); strokePts([[0, 244], [M.W, 244]], 'rgba(220,170,110,0.4)', 2); }, { seed: 6601 });
    for (let k = 0; k < 7; k++) { const x0 = 10 + k * 155; piece(rect(x0, 1010, x0 + 140, 1300), '#4e2c1c', () => { strokePts([[x0 + 10, 1290], [x0 + 10, 1020], [x0 + 130, 1020]], 'rgba(255,210,160,0.25)', 2); strokePts([[x0 + 130, 1020], [x0 + 130, 1290], [x0 + 10, 1290]], 'rgba(0,0,0,0.4)', 2); }, { seed: 6610 + k }); }
    piece(rect(-10, 990, M.W + 10, 1012), '#6b3e26', () => strokePts([[0, 994], [M.W, 994]], 'rgba(255,220,170,0.3)', 1.4), { seed: 6620 });
    piece(rect(-10, 1300, M.W + 10, BACK + 10), '#331c12', null, { seed: 6621 });
    // embrasure de la fenêtre (la vue, les carreaux et le battant sont dessinés à part)
    piece(rect(F.x0 - 26, F.y0 - 26, F.x1 + 26, F.y1 + 22), '#5a3422', null, { seed: 6630 });
    c.clearRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    bibliotheque(notaire);
    // tableau (club : marine ; notaire : paysage d'hiver) entre fenêtre et cheminée
    piece(rect(70, 330, 320, 520), OR.or, () => { fillPts(rect(84, 344, 306, 506), notaire ? '#a9b4bc' : '#5a6e7a'); fillPts([[84, 440], [150, 410], [220, 430], [306, 400], [306, 506], [84, 506]], notaire ? '#eef0f0' : '#2f4a5a'); if (!notaire) fillPts([[180, 440], [200, 380], [204, 440]], '#e8e0cc'); hatch(rect(84, 344, 306, 506), 0.7, 5, 0.12); }, { seed: 6640 });
    toile(c, 0.35);
  }); }
  function cabMilieu(notaire) { return layer((c) => {
    const Cm = CAB.cheminee, B = CAB.bureau;
    // cheminée de marbre
    piece([[Cm.x0, BACK, 1], [Cm.x0, 1080], [Cm.x0 - 16, 1080], [Cm.x0 - 16, 1050, 1], [Cm.x1 + 16, 1050, 1], [Cm.x1 + 16, 1080], [Cm.x1, 1080], [Cm.x1, BACK, 1]], notaire ? '#7d7a76' : '#d6cfc2', () => {
      for (let k = 0; k < 6; k++) strokePts([[Cm.x0 + 20 + k * 40, 1086], [Cm.x0 + 40 + k * 36, 1200], [Cm.x0 + 10 + k * 44, 1390]], 'rgba(120,110,100,0.35)', 1.4);
      shade(Cm.x0, 0, Cm.x1, 0, 0.25, [Cm.x0 - 20, 1040, Cm.x1 + 20, BACK]);
    }, { seed: 6801 });
    piece([[Cm.x0 + 40, BACK, 1], [Cm.x0 + 40, 1200], [Cm.x0 + 60, 1160], [Cm.x1 - 60, 1160], [Cm.x1 - 40, 1200], [Cm.x1 - 40, BACK, 1]], '#140c08', () => { strokePts([[Cm.x0 + 50, 1380], [Cm.x1 - 50, 1380]], '#5a5a5a', 4); for (let x = Cm.x0 + 60; x < Cm.x1 - 50; x += 20) strokePts([[x, 1366], [x, 1384]], '#4a4a4a', 2); }, { seed: 6802 });
    for (const [x, h, col] of [[100, 70, '#c9a24a'], [250, 54, '#3a5a5a']]) piece(rect(x - 12, 1050 - h, x + 12, 1050), col, null, { seed: 6803 + x });
    // bureau à cylindre
    piece([[B.x0, B.plateau, 1], [B.x0 + 20, 1010], [B.x0 + 60, 960], [B.x1 - 40, 950], [B.x1 - 10, 990], [B.x1, B.plateau, 1]], '#5a2e1a', () => {
      for (let k = 0; k < 9; k++) strokePts([[B.x0 + 40 + k * 26, 970 + Math.abs(k - 4) * 2], [B.x0 + 30 + k * 28, 1100]], 'rgba(20,8,4,0.35)', 1.4);
      fillPts(rect(B.x0 + 30, 1100, B.x1 - 30, B.plateau), '#3a1c10');
      for (let k = 0; k < 6; k++) fillPts(rect(B.x0 + 40 + k * 40, 1110, B.x0 + 70 + k * 40, 1160), '#24100a');
      for (let k = 0; k < 3; k++) fillPts(rect(B.x0 + 46 + k * 80, 1124, B.x0 + 64 + k * 80, 1160), '#e4dcc6');
      hatch(null, 0.3, 5, 0.18);
    }, { seed: 6810 });
    piece(rect(B.x0 - 14, B.plateau, B.x1 + 14, B.plateau + 18), '#6e3a20', () => strokePts([[B.x0 - 10, B.plateau + 3], [B.x1 + 10, B.plateau + 3]], 'rgba(255,210,160,0.35)', 2), { seed: 6811 });
    for (const [x0, x1] of [[B.x0, B.x0 + 90], [B.x1 - 90, B.x1]]) piece(rect(x0, B.plateau + 18, x1, BACK), '#5a2e1a', () => { for (let k = 0; k < 3; k++) { const y = B.plateau + 30 + k * 66; fillPts(rect(x0 + 8, y, x1 - 8, y + 54), '#4a2414'); dot((x0 + x1) / 2, y + 27, 3, OR.or); } }, { seed: 6812 + x0 });
    // sous-main, encrier
    piece(rect(B.x0 + 110, B.plateau - 6, B.x0 + 230, B.plateau), notaire ? '#2e3a2a' : '#5a1e1a', null, { seed: 6820, drop: false });
    piece([[B.x0 + 60, B.plateau], [B.x0 + 56, B.plateau - 20], [B.x0 + 84, B.plateau - 20], [B.x0 + 80, B.plateau]], '#1a1a22', () => strokePts([[B.x0 + 60, B.plateau - 16], [B.x0 + 80, B.plateau - 16]], 'rgba(255,255,255,0.3)', 1.4), { seed: 6821 });
    // lampe à abat-jour vert (la flamme et la lueur sont animées)
    const Lp = CAB.lampe;
    piece([[Lp.x - 22, B.plateau, 1], [Lp.x + 22, B.plateau, 1], [Lp.x + 6, B.plateau - 20], [Lp.x + 4, Lp.y + 30], [Lp.x - 4, Lp.y + 30], [Lp.x - 6, B.plateau - 20]], OR.or, null, { seed: 6830 });
    piece([[Lp.x - 44, Lp.y + 30, 1], [Lp.x + 44, Lp.y + 30, 1], [Lp.x + 24, Lp.y - 6], [Lp.x - 24, Lp.y - 6]], '#2f6a3e', () => strokePts([[Lp.x - 40, Lp.y + 26], [Lp.x + 40, Lp.y + 26]], 'rgba(200,240,190,0.5)', 2), { seed: 6831 });
    if (notaire) {
      const Cf = CAB.coffre;
      piece(rect(Cf.x0, 1150, Cf.x1, BACK), '#1c1c20', () => { strokePts([[Cf.x0 + 10, 1160], [Cf.x1 - 10, 1160], [Cf.x1 - 10, BACK - 14], [Cf.x0 + 10, BACK - 14], [Cf.x0 + 10, 1160]], '#55555c', 2); pc(ell((Cf.x0 + Cf.x1) / 2, 1250, 20, 20, 16), '#9a8a5a', () => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; strokePts([[(Cf.x0 + Cf.x1) / 2 + Math.cos(a) * 12, 1250 + Math.sin(a) * 12], [(Cf.x0 + Cf.x1) / 2 + Math.cos(a) * 18, 1250 + Math.sin(a) * 18]], '#4a3a1a', 1.4); } }, 6841, { drop: false }); fillPts(rect(Cf.x1 - 30, 1300, Cf.x1 - 20, 1340), '#9a8a5a'); }, { seed: 6840 });
      for (let k = 0; k < 3; k++) piece(rect(Cf.x0 + 8, 1150 - 26 - k * 24, Cf.x1 - 8 - k * 6, 1150 - k * 24), ['#a89c80', '#968a70', '#b2a68a'][k], () => strokePts([[Cf.x0 + 40, 1150 - 26 - k * 24], [Cf.x0 + 40, 1150 - k * 24]], '#8a2a24', 1.6), { seed: 6845 + k });
    } else {
      const G = CAB.globe;
      piece([[G.x - 40, BACK, 1], [G.x + 40, BACK, 1], [G.x + 8, BACK - 40], [G.x + 6, BACK - 170], [G.x - 6, BACK - 170], [G.x - 8, BACK - 40]], '#5a2e1a', null, { seed: 6850 });
      piece(ell(G.x, BACK - 230, 64, 64, 24), '#c9b88a', () => {
        for (const [bx, by, r] of [[G.x - 20, BACK - 250, 26], [G.x + 22, BACK - 210, 20], [G.x - 6, BACK - 196, 14]]) fillPts(blobPts(bx, by, r, bx, 10, 0.4), '#7a8a5a');
        for (let k = -2; k <= 2; k++) strokePts(ep(G.x, BACK - 230, 64 * Math.cos(k * 0.5), 64, 16, -PI / 2, PI / 2), 'rgba(90,70,40,0.35)', 1);
        shade(G.x - 60, BACK - 290, G.x + 60, BACK - 170, 0.4, [G.x - 66, BACK - 296, G.x + 66, BACK - 164]);
      }, { seed: 6851 });
      piece(ep(G.x, BACK - 230, 74, 74, 16, PI * 0.6, PI * 2.4).concat(ep(G.x, BACK - 230, 66, 66, 16, PI * 2.4, PI * 0.6)), OR.or, null, { seed: 6852, drop: false });
    }
    toile(c, 0.3);
  }); }
  function battant(x0, x1, y0, y1, ouvre, cote) {        // battant à petits carreaux ; cote 1 = charnière à droite
    const w = (x1 - x0) * Math.max(0.12, Math.cos(ouvre * 1.35)), xa = cote > 0 ? x1 - w : x0, xb = cote > 0 ? x1 : x0 + w;
    const c = cx_();
    if (!SIL()) { c.fillStyle = `rgba(215,228,236,${0.1 + 0.1 * ouvre})`; c.fillRect(xa, y0, xb - xa, y1 - y0); c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(xa + 10, y0 + 140); c.lineTo(xa + (xb - xa) * 0.5, y0 + 10); c.lineTo(xa + (xb - xa) * 0.75, y0 + 10); c.lineTo(xa + 10, y0 + 220); c.fill(); }
    for (let k = 1; k < 3; k++) { const x = lerp(xa, xb, k / 3); pc(rect(x - 2.5, y0, x + 2.5, y1), '#5a3422', null, 6903 + k, { drop: false }); }
    for (let k = 1; k < 6; k++) { const y = lerp(y0, y1, k / 6); pc(rect(xa, y - 2.5, xb, y + 2.5), '#5a3422', null, 6906 + k, { drop: false }); }
    for (const [a0, b0, a1, b1] of [[xa, y0, xb, y0 + 9], [xa, y1 - 9, xb, y1], [xa, y0, xa + 9, y1], [xb - 9, y0, xb, y1]]) pc(rect(a0, b0, a1, b1), '#6b4028', null, 6901 + cote, { drop: false });
  }
  NOB.cabinet = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), K = NOB.K, g = M.tg(t), notaire = o.variante === 'notaire', F = CAB.fenetre;
    c.save(); c.translate(0, -up);
    // vue + ambiance extérieure
    c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    c.drawImage(notaire ? K.cabVueNot : K.cabVueClub, 0, 0);
    const raf = o.rafaleT0 != null && t > o.rafaleT0 ? Math.exp(-1.4 * (t - o.rafaleT0)) * Math.min(1, (t - o.rafaleT0) / 0.25) : 0;
    if (notaire) neigeDans(t, F.x0, F.y0, F.x1, F.y1, 60 + Math.round(60 * raf), 77, 30 + 200 * raf, raf);
    else M.fumee(t, { x: 609, y: F.y1 - 250, s: 0.6, n: 6, haut: 260, vent: 50, col: '#d8d4cc', a: 0.6, per: 3.6, seed: 5 });
    c.restore();
    c.drawImage(notaire ? K.cabFondNot : K.cabFondClub, 0, 0);
    // fenêtre à petits carreaux : battant gauche fixe, battant droit ouvrable (o.fenetre 0..1, club)
    const xm = (F.x0 + F.x1) / 2, ouv = notaire ? 0 : clamp(o.fenetre || 0);
    battant(F.x0, xm, F.y0, F.y1, 0, -1); battant(xm, F.x1, F.y0, F.y1, ouv, 1);
    if (raf > 0 && !SIL()) { c.fillStyle = `rgba(245,248,252,${0.5 * raf})`; for (let i = 0; i < 30; i++) { const x = F.x0 + hash(i) * (F.x1 - F.x0), y = F.y0 + hash(i + 50) * (F.y1 - F.y0); c.beginPath(); c.arc(x, y, 2 + 2 * hash(i + 9), 0, TAU); c.fill(); } }
    // rideaux de velours vert
    for (const sd of [-1, 1]) {
      const xa = sd < 0 ? F.x0 - 70 : F.x1 + 70, xb = sd < 0 ? F.x0 + 24 : F.x1 - 24, sw = 4 * Math.sin(g * 0.8 + sd);
      pc([[xa, F.y0 - 50], [xb, F.y0 - 50], [lerp(xb, xa, 0.4) + sw, 640], [lerp(xb, xa, 0.6) + sw, 760], [lerp(xb, xa, 0.3) + sw, 900], [xb + sw, 1000], [xa, 1000]], '#2f4a34', () => {
        for (let k = 1; k < 5; k++) strokePts([[lerp(xa, xb, k / 5), F.y0 - 46], [lerp(xa, xb, k / 5) * 0.8 + xa * 0.2 + sw, 760], [lerp(xa, xb, k / 5) + sw, 996]], 'rgba(10,25,12,0.5)', 2);
        hatch(null, 1.3, 4, 0.2, 1, P.encre, [Math.min(xa, xb) - 20, F.y0 - 50, Math.max(xa, xb) + 20, 1004]);
      }, 6910 + sd);
      pc(ell(lerp(xb, xa, 0.5) + sw, 760, 16, 10, 12), OR.or, null, 6912 + sd, { drop: false });
    }
    pc([[F.x0 - 90, F.y0 - 70, 1], [F.x1 + 90, F.y0 - 70, 1], [F.x1 + 90, F.y0 - 20], [F.x1 + 30, F.y0], [xm, F.y0 - 16], [F.x0 - 30, F.y0], [F.x0 - 90, F.y0 - 20]], '#2a4230', () => strokePts([[F.x0 - 90, F.y0 - 24], [F.x0 - 30, F.y0 - 4], [xm, F.y0 - 20], [F.x1 + 30, F.y0 - 4], [F.x1 + 90, F.y0 - 24]], OR.or, 3), 6915);
    M.pendule(t, { x: CAB.pendule.x, y: CAB.pendule.y - 200, s: 0.8, per: 2 });
    // drap tendu (notaire) : descend des cintres, éclairé de derrière
    const dr = notaire ? clamp(o.drap || 0) : 0;
    if (dr > 0) {
      const D_ = CAB.drap, yb = lerp(D_.y0 + 4, D_.y1, easeOut(dr));
      if (!SIL()) { c.strokeStyle = 'rgba(30,20,14,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(D_.x0 + 20, 0); c.lineTo(D_.x0 + 20, D_.y0); c.moveTo(D_.x1 - 20, 0); c.lineTo(D_.x1 - 20, D_.y0); c.stroke(); }
      pc(rect(D_.x0 - 10, D_.y0 - 14, D_.x1 + 10, D_.y0 + 2), '#5a3a22', null, 6920);
      pc([[D_.x0, D_.y0, 1], [D_.x1, D_.y0, 1], [D_.x1 + 3 * Math.sin(g * 1.1), yb, 1], [lerp(D_.x0, D_.x1, 0.75), yb + 3 * Math.sin(g * 1.3)], [lerp(D_.x0, D_.x1, 0.5), yb - 2 * Math.sin(g * 1.3)], [lerp(D_.x0, D_.x1, 0.25), yb + 3 * Math.sin(g * 1.7)], [D_.x0 + 3 * Math.sin(g * 1.2), yb, 1]], '#f2ead6', () => {
        const cc = cx_(); if (!SIL()) { const gr = cc.createRadialGradient(lerp(D_.x0, D_.x1, 0.5), (D_.y0 + yb) / 2, 20, lerp(D_.x0, D_.x1, 0.5), (D_.y0 + yb) / 2, 340); gr.addColorStop(0, 'rgba(255,236,190,0.75)'); gr.addColorStop(1, 'rgba(210,180,130,0.2)'); cc.fillStyle = gr; cc.fillRect(D_.x0, D_.y0, D_.x1 - D_.x0, yb - D_.y0); }
        for (let k = 1; k < 6; k++) strokePts([[lerp(D_.x0, D_.x1, k / 6), D_.y0], [lerp(D_.x0, D_.x1, k / 6) + 2 * Math.sin(g + k), yb]], 'rgba(160,140,110,0.25)', 1.4);
      }, 6921, { drop: false });
    }
    c.drawImage(notaire ? K.cabMilieuNot : K.cabMilieuClub, 0, 0);
    // feu de cheminée (+ bûche qui s'affaisse : o.bucheT0)
    const Fc = CAB.cheminee.feu, bt = o.bucheT0 != null && t > o.bucheT0 ? clamp((t - o.bucheT0) / 0.35) : 0;
    if (!SIL()) { const gl = c.createRadialGradient(Fc[0], Fc[1], 10, Fc[0], Fc[1], 220); gl.addColorStop(0, `rgba(255,150,60,${0.35 + 0.08 * Math.sin(g * 7)})`); gl.addColorStop(1, 'rgba(255,150,60,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.beginPath(); c.arc(Fc[0], Fc[1], 220, 0, TAU); c.fill(); c.restore(); }
    for (const [dx, s, sd] of [[-34, 0.9, 1], [0, 1.25, 2], [36, 0.95, 3]]) M.flamme(t, { x: Fc[0] + dx, y: Fc[1] + 26, s, r: 60, seed: sd });
    pc(rrect(Fc[0] - 70, Fc[1] + 26 + 10 * bt, Fc[0] + 10, Fc[1] + 46 + 10 * bt, 9), '#4a2a18', () => fillPts(ell(Fc[0] - 66, Fc[1] + 36 + 10 * bt, 6, 9, 8), '#c98a4a'), 6930, { drop: false });
    pc(rrect(Fc[0] - 10, Fc[1] + 30, Fc[0] + 70, Fc[1] + 50, 9), '#553020', () => fillPts(ell(Fc[0] + 66, Fc[1] + 40, 6, 9, 8), '#c98a4a'), 6931, { drop: false });
    if (bt > 0 && t < o.bucheT0 + 1.6 && !SIL()) { const e = t - o.bucheT0; for (let i = 0; i < 16; i++) { const u = clamp(e / 1.4 - hash(i) * 0.2), a = -PI / 2 + (hash(i + 3) - 0.5) * 1.6; if (u <= 0 || u >= 1) continue; c.fillStyle = `rgba(255,${150 + 90 * hash(i)},60,${1 - u})`; c.beginPath(); c.arc(Fc[0] + Math.cos(a) * 120 * u, Fc[1] + 20 + Math.sin(a) * 160 * u + 60 * u * u, 2.6, 0, TAU); c.fill(); } }
    // lampe : flamme et lueur
    M.flamme(t, { x: CAB.lampe.x, y: CAB.lampe.y + 30, s: 0.35, r: 140, seed: 21 });
    // rayon de la fenêtre + poussière
    if (!SIL()) {
      const poly = [[F.x0 + 30, F.y0 + 60], [F.x1, F.y0 + 20], [760, BACK], [300, BACK]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      c.fillStyle = grad(c, 0, F.y0, 0, BACK, [[0, 'rgba(225,232,240,0.12)'], [1, 'rgba(225,232,240,0.02)']]); c.fill(); c.clip();
      M.poussiere(t, { x: 300, y: F.y0 + 60, w: 460, h: BACK - F.y0 - 60, n: 36, a: 0.7, seed: 23 }); c.restore();
    }
    c.restore();
  };
  NOB.cabinetSol = function (t, o) {
    o = o || {};
    pc(ell(540, 1432, 360, 26, 32), '#6a2a22', () => {
      strokePts(ep(540, 1432, 330, 20, 30, 0, TAU), 'rgba(210,170,100,0.7)', 3); strokePts(ep(540, 1432, 250, 14, 26, 0, TAU), 'rgba(40,40,80,0.7)', 4);
      for (let i = 0; i < 10; i++) { const x = 330 + i * 46; fillPts([[x, 1432], [x + 12, 1426], [x + 24, 1432], [x + 12, 1438]], i % 2 ? '#c9a24a' : '#2a3a5a'); }
      hatch(null, 0.1, 4, 0.15);
    }, 6950, { drop: false });
    if (o.fauteuil !== false) {
      const fx = 120, fy = 1470;
      pc([[fx - 70, fy, 1], [fx - 74, fy - 150], [fx - 60, fy - 176], [fx - 30, fy - 180], [fx - 20, fy - 100], [fx + 70, fy - 100], [fx + 86, fy - 116], [fx + 100, fy - 100], [fx + 92, fy - 40], [fx + 84, fy, 1]], '#6a3a22', () => {
        for (const [x, y] of [[fx - 60, fy - 150], [fx - 46, fy - 120], [fx - 60, fy - 90], [fx + 10, fy - 80], [fx + 50, fy - 80]]) dot(x, y, 3, '#3a1e10');
        strokePts([[fx - 20, fy - 100], [fx - 10, fy - 40], [fx + 90, fy - 40]], 'rgba(20,8,4,0.5)', 2); hatch(null, 0.7, 4, 0.22); shade(fx - 70, 0, fx + 100, 0, 0.3, [fx - 80, fy - 190, fx + 110, fy + 4]);
      }, 6960);
      pc([[fx - 66, fy, 1], [fx - 56, fy, 1], [fx - 56, fy + 14, 1], [fx - 66, fy + 14, 1]], '#2a1a10', null, 6961, { drop: false });
      pc([[fx + 70, fy, 1], [fx + 80, fy, 1], [fx + 80, fy + 14, 1], [fx + 70, fy + 14, 1]], '#2a1a10', null, 6962, { drop: false });
    }
  };

  // ---------------------------------------------------------------- pré-rendus
  NOB.init = function () {
    const K = (NOB.K = {});
    const cv = M.cutFlat(PW + 24, PH + 24, (PW + 24) / 2, PH + 12, () => dessinePortrait()); cv.padB = 12; K.portrait = M.withShadow(cv, 8);
    K.salleFond = salleFond(); K.salleMilieu = salleMilieu();
    K.cabVueClub = cabVue(false); K.cabVueNot = cabVue(true);
    K.cabFondClub = cabFond(false); K.cabFondNot = cabFond(true);
    K.cabMilieuClub = cabMilieu(false); K.cabMilieuNot = cabMilieu(true);
    return K;
  };
})();
