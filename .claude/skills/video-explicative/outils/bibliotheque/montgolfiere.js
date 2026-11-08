// persos.js — « La montgolfière, des moutons avant les hommes » (France 1783) : Joseph et Étienne de Montgolfier, Louis XVI, Pilâtre de Rozier,
// mouton, canard, coq, cage d'osier, ballon (annonay / versailles / muette), foyer, décors ciel de Paris, cour d'Annonay, cour de Versailles.
// Espace M.mgf (alias MGF). Appeler MGF.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre, monogramme, fleur de lys, blason ni croix. Déterministe (aucun Math.random).
// MARIONNETTES : MGF.joseph / etienne / louis / pilatre (pose, x, y, s, o) → r ; MGF.pt(r, nom, arriere) ; MGF.main(r, arriere)
// ANIMAUX      : MGF.mouton / canard / coq (pose, x, y, s, o) → r (tige facultative)
// ACCESSOIRES  : MGF.cage(x, y, s, o) ; MGF.ballon(x, y, s, o) ; MGF.ballonPt(nom, x, y, s, o) ; MGF.foyer(t, x, y, s, o) ; MGF.volutes(t, o)
// DÉCORS       : MGF.ciel(t, o), MGF.annonay(t, o), MGF.versailles(t, o) (+ MGF.annonayAvant, MGF.versaillesAvant) ; repères MGF.ANN, MGF.VER, MGF.CIEL
(function () {
  const X = M.X, P = M.P, CH = M.chars, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const MGF = (M.mgf = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const W = 1080, ST = M.ST, HB = ST.back + 5;

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function ribbonW(line, wf) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = (typeof wf === 'function' ? wf(i / (line.length - 1)) : wf) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function rrect(x0, y0, x1, y1, r) { return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5)); }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const rot = (p, a, c0) => { c0 = c0 || [0, 0]; const x = p[0] - c0[0], y = p[1] - c0[1], ca = Math.cos(a), sa = Math.sin(a); return [c0[0] + x * ca - y * sa, c0[1] + x * sa + y * ca]; };
  // contour bouclé (laine, perruques) : points alternés repoussés vers l'extérieur
  function boucle(pts, amp, step) {
    let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
    const o = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
      for (let k = 0; k < n; k++) {
        const u = k / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u);
        const push = (k % 2) ? amp : 0, dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1;
        o.push([x + dx / l * push, y + dy / l * push]);
      }
    }
    return o;
  }

  // ------------------------------------------------------------ volutes de fumée (bords tout en arcs, jamais droits)
  // o : { x, y, k (densité 0..1), haut, vent, per, n, r, seed, noire 0..1, a, larg (écart latéral au départ), dir (−1 = descend) }
  function volutes(t, o) {
    if (SIL() || !(o.k > 0.01)) return;
    const c = cx_(), n = o.n || 7, per = o.per || 2.4, k = clamp(o.k), haut = (o.haut || 200) * (0.55 + 0.45 * k), R = M.rng(o.seed || 7), nr = clamp(o.noire || 0);
    const col = M.mixc('#f0ece4', '#2a2624', nr), colD = M.mixc('#b9b3a8', '#141110', nr), colL = M.mixc('#ffffff', '#5a5450', nr);
    for (let i = 0; i < n; i++) {
      const ph = R() * TAU, off = i / n + R() * 0.08, sx = (R() - 0.5) * (o.larg || 0);
      const u = (((t / per + off) % 1) + 1) % 1;
      const px = o.x + sx + (o.vent == null ? 24 : o.vent) * Math.pow(u, 1.3) + Math.sin(u * 6 + ph) * 9 * u, py = o.y - (o.dir || 1) * haut * Math.pow(u, 0.85);
      const r = (6 + (o.r || 34) * Math.pow(u, 0.75)) * (0.6 + 0.4 * k) * (1 + 0.35 * nr), al = Math.min(1, k * 1.4) * Math.pow(1 - u, 0.8) * Math.min(1, u * 8) * (o.a || 0.92);
      const B = []; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + ph + u * 2.2; B.push([px + Math.cos(a) * r * 0.48, py + Math.sin(a) * r * 0.36, r * (0.46 + 0.16 * Math.sin(j * 2.3 + ph))]); }
      c.save(); c.globalAlpha = al;
      c.strokeStyle = colD; c.lineWidth = 2.2 * (M._lw ? M._lw() : 1);
      for (const b of B) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, TAU); c.stroke(); }
      c.fillStyle = col; for (const b of B) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, TAU); c.fill(); }
      c.fillStyle = colL; c.globalAlpha = al * 0.45; for (const b of B) { c.beginPath(); c.arc(b[0] - b[2] * 0.25, b[1] - b[2] * 0.3, b[2] * 0.45, 0, TAU); c.fill(); }
      c.fillStyle = colD; c.globalAlpha = al * 0.35; for (const b of B) { c.beginPath(); c.arc(b[0] + b[2] * 0.3, b[1] + b[2] * 0.3, b[2] * 0.5, 0, TAU); c.fill(); }
      c.restore();
    }
  }
  MGF.volutes = volutes;

  // ------------------------------------------------------------ bras à articulations rondes, IK (repris de cocotte.js)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  function ik2(S, T) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI, b = normA(cAbs - a);
      const sc = -b;
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }

  // ================================================================== OBJETS TENUS (repère : y vers le bas, échelle 1)
  const LAIT = '#b8913e', LAITL = '#e2c271', LAITD = '#8a6a2a', FER = '#3b3a38';
  // aiguille à coudre + fil (prise au milieu, pointe en bas devant)
  function drawAiguille(o) {
    const t = o.t || 0;
    if (!SIL()) { const c = cx_(); c.save(); c.strokeStyle = 'rgba(236,228,206,0.95)'; c.lineWidth = 1.6 * M._lw(); c.beginPath(); c.moveTo(0, -40);
      const sw = Math.sin(t * 5) * 8; c.bezierCurveTo(-18, -66, -44 + sw, -30, -40 + sw, 30); c.stroke(); c.restore(); }
    pc([[-2.2, -46], [2.2, -46], [2.6, 18], [0, 38, 1], [-2.6, 18]], '#d4d7da', () => { strokePts([[0, -43], [0, -37]], '#333', 1.4); strokePts([[-1, -30], [-1, 22]], 'rgba(255,255,255,0.9)', 0.9); }, 7801);
  }
  // lorgnette (longue-vue de poche) : oculaire à −x, objectif à +x ; prise au milieu
  function drawLorgnette(o) {
    pc([[-30, -6], [6, -6], [6, 6], [-30, 6]], '#2a2420', () => strokePts([[-28, -3], [4, -3]], 'rgba(255,255,255,0.25)', 1.2), 7811);
    pc([[4, -8], [34, -8], [34, 8], [4, 8]], LAIT, () => { strokePts([[6, -4], [32, -4]], LAITL, 1.4); for (const x of [10, 22]) strokePts([[x, -8], [x, 8]], LAITD, 1.2); }, 7812);
    pc([[32, -11], [46, -11], [46, 11], [32, 11]], '#2a2420', () => strokePts([[34, -7], [44, -7]], 'rgba(255,255,255,0.25)', 1.2), 7813);
    pc([[-36, -5], [-28, -5], [-28, 5], [-36, 5]], LAITD, null, 7814);
    if (!SIL()) dot(46, 0, 4, 'rgba(170,200,220,0.8)');
  }
  // perche-fourche à éponge : prise haute (main avant) ; seconde prise plus bas ; éponge en haut
  function drawPerche(o) {
    pc([[-3.5, -230], [3.5, -230], [4, 150, 1], [-4, 150, 1]], '#8a6238', () => { strokePts([[-1.5, -220], [-1.5, 140]], 'rgba(255,230,190,0.4)', 1.2); hatch(null, 0.1, 5, 0.2); }, 7821);
    pc([[-4, -226], [-18, -250], [-20, -268], [-14, -268], [-10, -252], [0, -240], [10, -252], [14, -268], [20, -268], [18, -250], [4, -226]], '#6b4a2a', null, 7822);
    const mo = clamp(o.mouille == null ? 0.5 : o.mouille);
    pc(boucle(ell(0, -284, 26, 18, 14), 3, 6), M.mixc('#d8b65a', '#9a7a32', mo), () => { const R = M.rng(5); for (let i = 0; i < 16; i++) dot(-20 + R() * 40, -296 + R() * 24, 1.8 + R() * 1.6, 'rgba(110,80,20,0.55)'); }, 7823);
    if (mo > 0.3 && !SIL()) for (let i = 0; i < 2; i++) { const u = (((o.t || 0) * 1.3 + i * 0.5) % 1); dot(-8 + i * 16, -266 + u * 40, 2.4, `rgba(170,200,220,${0.8 * (1 - u)})`); }
  }
  const OBJ = {
    aiguille: { draw: drawAiguille, grip: [0, 0], pts: { pointe: [0, 38], chas: [0, -42] }, base: [0, 38] },
    lorgnette: { draw: drawLorgnette, grip: [-8, 0], pts: { oeil: [-36, 0], bout: [46, 0] }, base: [0, 6] },
    perche: { draw: drawPerche, grip: [0, -40], p2: () => [0, -150], pts: { eponge: [0, -290], bas: [0, 150] }, base: [0, 150] },
  };
  MGF.OBJ = OBJ;
  const objOf = (v) => (v && typeof v === 'object' ? v : OBJ[v]);
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = objOf(name); return Object.assign({ t: p.t || 0 }, (ob && ob.held) || {}, o || {}); }
  function heldDraw(name, o, p) { const ob = objOf(name); if (!ob) return; const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(); c.save(); const e = oo.echelle || 1; c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore(); }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB0: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  MGF.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = objOf(name); if (!ob || !ob.pts || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom], e = (oo && oo.echelle) || 1;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  MGF.main = (r, arriere) => r.w(arriere ? 'armB_lo' : 'armF_lo', 4, 96);

  // ================================================================== POSES — outils communs
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function toTorso(def, q, P_, x, y, s, dir) { const m = M.partMatrices(def, q, x, y, s, dir).mats.torso; const r = new DOMPoint(P_[0], P_[1]).matrixTransform(m.inverse()); return [r.x, r.y]; }
  function armTo(q, arm, T, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T), A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const faceDef = (q, k, f) => { if (k > 0.5) for (const n in f) if (q.face[n] == null) q.face[n] = f[n]; };
  const lp2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  function cibleT(def, q, cible, x, y, s, dir, off, dflt) {
    if (!cible) return dflt;
    const T = toTorso(def, q, cible, x, y, s, dir); if (!off) return T;
    const tl = q.tilt || 0, ox = off[0], oy = off[1];
    return [T[0] - (ox * Math.cos(tl) + oy * Math.sin(tl)), T[1] - (-ox * Math.sin(tl) + oy * Math.cos(tl))];
  }
  function offsetObj(name, oo, nom, rotA) { const ob = objOf(name); if (!ob || !ob.pts || !ob.pts[nom]) return [0, 0]; const g = gripOf(ob, oo || {}), q = ob.pts[nom], e = (oo && oo.echelle) || 1; const vx = (q[0] - g[0]) * e, vy = (q[1] - g[1]) * e, cr = Math.cos(rotA || 0), sr = Math.sin(rotA || 0); return [vx * cr - vy * sr, vx * sr + vy * cr]; }
  // point de la tête (repère tête) → repère du torse, tête tournée de a
  const headPt = (a, lp) => { const p = rot(lp, a || 0); return [6 + p[0], -170 + p[1]]; };
  function marche(q, k, t) {
    if (!(k > 0)) return; const ph = t * 7.2, A = q.ang;
    A.legF = (A.legF || 0) + Math.sin(ph) * 0.3 * k; A.legB = (A.legB || 0) - Math.sin(ph) * 0.3 * k;
    A.armF_up = (A.armF_up || 0) - Math.sin(ph) * 0.12 * k; A.armB_up = (A.armB_up || 0) + Math.sin(ph) * 0.1 * k;
    A.armF_lo = (A.armF_lo || 0) - 0.2 * k; A.armB_lo = (A.armB_lo || 0) - 0.2 * k;
    q.dy = (q.dy || 0) - Math.abs(Math.sin(ph)) * 7 * k;
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
    const ob = has(q.tenu) ? objOf(q.tenu) : null;
    if (q.deuxMains && ob && ob.p2) {
      const oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).scale(e, e).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)));
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    o = Object.assign({ slot: ST.slotF }, o || {});
    if (q.galerie) { o.rod = false; o.floorShadow = false; }
    const r = M.puppet(def, q, x, y, s, o);
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && objOf(q.tenu)) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && objOf(q.tenuB)) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }

  // ------------------------------------------------------------ accessoires seuls : M.puppet à une pièce invisible (traits constants, ombre portée possible)
  const accDefs = {};
  function accDef(name, fn, rod) { const k = name + (rod ? '_t' : ''); return accDefs[k] || (accDefs[k] = { hipY: 0, handLen: 10, rod: rod || null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accDraw(name, draw, x, y, s, o, sDef, rod) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const useRod = rod && o.rod !== false;
    return M.puppet(accDef(name, draw, useRod ? rod : null), { o, tilt: o.rot || 0, dx: o.dx || 0, dy: o.dy || 0 }, x, y, s,
      { dir: o.dir || 1, rod: useRod ? undefined : false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }

  // ================================================================== HOMMES DE 1783 : constructeur commun
  const SKIN = '#e2c3a0', SKIND = '#c9a07c';
  const upDef = (at, base, seed) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28) });
  function foreDef(parent, base, skin, back, seed) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  // parement étroit (1783) + manchette de dentelle au poignet
  const parDef = (parent, col, colD, seed, galon) => ({ parent, at: [0, 0], noRivet: true, base: col, seed,
    pts: [[-14, 48], [0, 45], [14, 48], [15, 70, 1], [-13, 72, 1]],
    paint: () => { strokePts([[-13, 52], [14, 50]], galon || colD, galon ? 2.6 : 1.4); if (galon) strokePts([[-13, 68], [14, 66]], galon, 2.2); hatch(null, 1.2, 3.6, 0.2);
      fillPts([[-11, 70], [12, 69], [14, 78], [8, 75], [4, 80], [-2, 76], [-7, 80], [-11, 76]], '#f1ebdc'); } });
  // jambes : debout (legPts allongées de k) ou assis (cuisse horizontale, tibia vertical, pointe vers l'avant)
  const SEAT_LEG = [[-18, -14], [96, -17], [110, -12], [120, 0], [121, 40], [119, 96], [121, 104], [146, 110], [152, 120, 1], [150, 123, 1], [96, 123, 1], [96, 106], [98, 60], [97, 22], [86, 15], [-20, 14]];
  function legDef(at, cfg, seed, back) {
    const k = cfg.k || 1, Y = (y) => (y <= 205 ? y * k : y + 205 * (k - 1));
    const legS = X.legPts(cfg.th || 0.95).map((p) => (p[2] ? [p[0], Y(p[1]), 1] : [p[0], Y(p[1])]));
    const dk = (c) => (back ? M.mixc(c, '#000000', 0.2) : c);
    return { parent: 'torso', at, seed, noRivet: !!back, base: back ? M.mixc(cfg.culotte, '#000000', 0.15) : cfg.culotte, pts: (p) => (p.assis ? SEAT_LEG : legS),
      paint: (p) => {
        if (p.assis) {
          fillPts([[96, 6, 1], [140, 6, 1], [140, 106, 1], [96, 106, 1]], dk(cfg.botte ? cfg.botte : cfg.bas));
          fillPts([[90, 104, 1], [160, 104, 1], [160, 130, 1], [90, 130, 1]], cfg.soulier);
          if (cfg.talon) fillPts(rect(94, 119, 108, 130), cfg.talon);
          if (cfg.boucle && !back) fillPts(rect(120, 104, 132, 110), '#d9cc9a');
          hatch([[-20, -20], [100, -20], [100, -4], [-20, -4]], 0.2, 4, 0.22);
          return;
        }
        if (cfg.botte) {
          fillPts([[-40, Y(118), 1], [60, Y(118), 1], [60, Y(150), 1], [-40, Y(150), 1]], dk(cfg.bas));
          fillPts([[-40, Y(150), 1], [60, Y(150), 1], [60, 262, 1], [-40, 262, 1]], dk(cfg.botte));
          fillPts([[-40, Y(150), 1], [60, Y(150), 1], [60, Y(166), 1], [-40, Y(166), 1]], dk(cfg.botteR));
          if (!back) strokePts([[-14, Y(176)], [-12, Y(208)]], 'rgba(255,240,220,0.25)', 2);
        } else {
          fillPts([[-40, Y(116), 1], [60, Y(116), 1], [60, Y(216), 1], [-40, Y(216), 1]], dk(cfg.bas));
          fillPts([[-40, Y(214), 1], [60, Y(214), 1], [60, 262, 1], [-40, 262, 1]], cfg.soulier);
          if (cfg.talon) fillPts(rect(-24, Y(228), -8, 262), cfg.talon);
          if (cfg.boucle && !back) { fillPts(rect(12, Y(215), 26, Y(223)), '#d9cc9a'); fillPts(rect(16, Y(217), 22, Y(221)), cfg.soulier); }
        }
        fillPts([[-40, Y(108), 1], [60, Y(108), 1], [60, Y(116), 1], [-40, Y(116), 1]], dk(cfg.jarretiere || cfg.culotte));  // jarretière de la culotte
        if (!back) { dot(14, Y(112), 2, LAITL); hatch([[-26, -20], [-6, -20], [-6, Y(214)], [-26, Y(214)]], 0.8, 4, 0.25); } else hatch(null, 0.8, 3.6, 0.3);
      } };
  }
  // torse 1783 : habit à la française (pans qui s'écartent en arrondi devant, gilet visible jusqu'en haut des cuisses)
  function T1783(fx, bx, low) {
    return [[-14, -178], [8, -182], [18, -172], [30, -152], [fx * 0.92, -118], [fx, -82], [fx, -44], [fx - 2, -10], [fx + 1, 18], [fx - 5, 34, 1],
      [fx - 22, 30], [fx - 30, 56], [fx - 42, 90], [fx - 52, low, 1], [bx - 2, low + 4, 1], [bx + 2, 70], [bx + 6, 20], [bx + 8, -30], [bx + 8, -90], [bx + 10, -140], [-30, -166]];
  }
  function T1783A(fx, bx) {
    return [[-14, -178], [8, -182], [18, -172], [30, -152], [fx * 0.92, -118], [fx, -82], [fx, -44], [fx - 2, -10], [fx + 4, 22], [fx + 6, 36, 1], [bx - 2, 38, 1], [bx + 4, 20], [bx + 8, -30], [bx + 8, -90], [bx + 10, -140], [-30, -166]];
  }
  const ventreF = (T, b) => T.map((p) => { if (p[0] <= 10 || p[1] < -150 || p[1] > 40) return p; const v = b * Math.exp(-Math.pow((p[1] + 46) / 62, 2)); return p[2] ? [p[0] + v, p[1], 1] : [p[0] + v, p[1]]; });
  function torsoPaint(cfg) {
    const fx = cfg.fx, b = cfg.ventre || 0, vx = (y) => b * Math.exp(-Math.pow((y + 46) / 62, 2));
    return (p) => {
      const gil = [[18, -168], [30, -152], [fx * 0.92, -118], [fx + vx(-82), -82], [fx + vx(-44), -44], [fx - 2 + vx(-10), -10], [fx + 1 + vx(18), 18], [fx - 5, 34], [fx - 20, 30], [fx - 16 + vx(-10), -10], [fx - 14 + vx(-60), -60], [fx - 16 + vx(-110), -110], [14, -160]];
      fillPts(p.assis ? gil.map((q) => [q[0], Math.min(q[1], 30)]) : gil, cfg.gilet);
      if (cfg.brocart) for (let y = -150; y < 24; y += 18) for (const dx of [-10, -4]) dot(fx + dx + vx(y), y + (dx === -4 ? 9 : 0), 1.5, cfg.brocart);
      for (let y = -146; y < 28; y += 13) dot(fx - 5 + vx(y), y, 1.5, cfg.boutonG || '#8d8676');
      const edge = [[14, -160], [fx - 16 + vx(-110), -110], [fx - 14 + vx(-60), -60], [fx - 16 + vx(-10), -10], [fx - 22, 30], [fx - 30, 56], [fx - 42, 90], [fx - 52, cfg.low]];
      strokePts(p.assis ? edge.slice(0, 5) : edge, cfg.bord, cfg.bordLw || 3);
      for (let y = -140; y < -6; y += 18) dot(fx - 20 + vx(y), y, 2.4, cfg.bouton);
      if (!p.assis) { const px = fx - 74; fillPts([[px, 30], [px + 38, 26], [px + 40, 40], [px + 20, 46], [px, 42]], cfg.habitD); strokePts([[px, 30], [px + 38, 26]], cfg.bord, cfg.bordLw ? 2.4 : 1.2); for (const dx of [8, 20, 32]) dot(px + dx, 36, 2, cfg.bouton); }
      // col montant + cravate blanche et jabot
      fillPts([[-12, -184], [10, -186], [18, -174], [4, -172], [-14, -174]], cfg.habitD);
      fillPts([[12, -182], [24, -176], [31, -160], [27, -146], [19, -150], [13, -168]], '#f1ebdc'); strokePts([[20, -168], [26, -156], [22, -148]], 'rgba(150,140,120,0.6)', 1);
      if (cfg.cordon) {                                                           // cordon bleu ciel en écharpe (sans croix ni médaille)
        const band = ribbonW([[-34, -166], [-12, -128], [10, -84], [fx - 6 + vx(-40), -40]], 17);
        fillPts(band, cfg.cordon); strokePts([[-30, -170], [-8, -132], [14, -88], [fx - 2 + vx(-46), -46]], 'rgba(255,255,255,0.45)', 1.4);
        strokePts([[-38, -160], [-16, -122], [6, -78], [fx - 10 + vx(-34), -34]], 'rgba(40,60,90,0.5)', 1.2);
      }
      hatch(cfg.dos, 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.26);
      if (b) shade(fx + b, -50, -60, -50, 0.18);
    };
  }
  // chapeaux (repère de la tête) et point du bord avant où la main le saisit
  const HAT = {
    rond: { pts: [[-68, -77, 1], [-66, -83], [-36, -88], [-35, -128], [-30, -147], [-10, -154], [14, -153], [30, -146], [35, -128], [34, -90], [66, -86], [72, -81, 1], [40, -82], [0, -84], [-40, -81]],
      base: '#1f1c1d', prise: [64, -82],
      paint: () => { fillPts([[-36, -102], [35, -104], [34, -90], [-36, -88]], '#3a3436'); strokePts([[-34, -101], [34, -103]], 'rgba(255,255,255,0.18)', 1.2);
        strokePts([[-24, -140], [-28, -112]], 'rgba(255,255,255,0.14)', 2.4); strokePts([[-60, -80], [60, -84]], 'rgba(255,255,255,0.2)', 1.2); hatch(null, 0.9, 3.6, 0.25, 1, '200,200,200', [-80, -170, 80, -60]); } },
    tricorne: { pts: [[-60, -80, 1], [-60, -100], [-56, -122, 1], [-40, -112], [-18, -110], [0, -124], [16, -126], [30, -114], [52, -106], [70, -100, 1], [56, -90], [24, -86], [-10, -86], [-40, -80]],
      base: '#1d1b1d', prise: [64, -98],
      paint: () => { strokePts([[-56, -118], [-40, -108], [-18, -106], [0, -116], [30, -110], [66, -100]], 'rgba(255,255,255,0.2)', 1.4);
        strokePts([[-50, -86], [-10, -90], [40, -92]], 'rgba(255,255,255,0.12)', 1.6); fillPts(ell(30, -98, 4.5, 4.5, 8), '#2c2a2c'); hatch(null, 0.9, 3.6, 0.22, 1, '200,200,200', [-80, -140, 80, -70]); } },
  };
  function mk1783(cfg) {
    const k = cfg.k || 1, fx = cfg.fx, bx = cfg.bx;
    let T = T1783(fx, bx, cfg.low), TA = T1783A(fx, bx); if (cfg.ventre) { T = ventreF(T, cfg.ventre); TA = ventreF(TA, cfg.ventre); }
    cfg.dos = [[-70, -170], [-14, -170], [-12, 130], [-70, 130]];
    const hat = cfg.chapeau ? HAT[cfg.chapeau] : null;
    const parts = {
      torso: { parent: null, at: [0, 0], base: cfg.habit, seed: cfg.seed, pts: (p) => (p.assis ? TA : T), paint: torsoPaint(cfg) },
      legB: legDef([-6, -2], cfg.jambe, cfg.seed + 2, true),
      legF: legDef([6, -2], cfg.jambe, cfg.seed + 3, false),
      armB_up: upDef(SH_B, cfg.habitD, cfg.seed + 4),
      armB_lo: foreDef('armB_up', cfg.habitD, SKIND, true, cfg.seed + 5),
      parB: parDef('armB_lo', M.mixc(cfg.parement, '#000000', 0.15), cfg.habitD, cfg.seed + 6, cfg.galonP),
      head: { parent: 'torso', at: [6, -170], pts: cfg.head, base: cfg.peau || SKIN, seed: cfg.seed + 7, noRivet: true, paint: cfg.headPaint },
      queue: cfg.queue ? { parent: 'head', at: cfg.queue.at, noRivet: true, base: cfg.queue.col, seed: cfg.seed + 8, pts: cfg.queue.pts, paint: cfg.queue.paint, extra: cfg.queue.extra } : null,
      chapeau: hat ? { parent: 'head', at: [0, 0], noRivet: true, base: hat.base, seed: cfg.seed + 9, pts: (p) => (p._chapeauMain ? OFFP : hat.pts), paint: hat.paint } : null,
      armF_up: upDef(SH_F, cfg.habit, cfg.seed + 10),
      armF_lo: foreDef('armF_up', cfg.habit, cfg.peau || SKIN, false, cfg.seed + 11),
      parF: parDef('armF_lo', cfg.parement, cfg.habitD, cfg.seed + 12, cfg.galonP),
      chapeauM: hat ? { parent: 'armF_lo', at: [4, 96], noRivet: true, base: hat.base, seed: cfg.seed + 13, pts: (p) => (p._chapeauMain ? hat.pts.map((q) => [q[0] - hat.prise[0], q[1] - hat.prise[1], q[2]]) : OFFP),
        paint: () => { const c = cx_(); c.save(); c.translate(-hat.prise[0], -hat.prise[1]); hat.paint(); c.restore(); } } : null,
    };
    for (const n in parts) if (!parts[n]) delete parts[n];
    Object.assign(parts, heldParts(cfg.peau || SKIN, cfg.seed + 20));
    const order = ['armB_up', 'armB_lo', 'parB', 'objetB', 'doigtsB0', 'legB', 'legF', 'head', 'torso', 'queue', 'chapeau', 'armF_up', 'armF_lo', 'parF', 'objet', 'doigts', 'doigtsB', 'chapeauM'].filter((n) => parts[n]);
    return { hipY: -238 - 237 * (k - 1), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order, nom: cfg.nom };
  }

  // ---- têtes (repère : cou en y = 16, nez vers +x)
  const faceStd = (f, o) => { X.eye(f, 17, o.eyeY || -52, o.eyeS || 1); X.brow(f, 17, (o.eyeY || -52) - 9, o.sourcil || 'rgba(45,30,22,0.95)', o.sourcilLw || 2.4); X.mouth(f, o.mx || 27, o.my || -27); };
  const JO_HEAD = [[-14, 16], [12, 16], [14, 4], [20, -2], [27, -8], [31, -15], [29, -21], [31, -25], [30, -30], [32, -34], [38, -39, 1], [33, -46], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-26, -26], [-18, -6]];
  const ET_HEAD = [[-12, 16], [9, 16], [10, 2], [15, -6], [21, -10], [24, -16], [22, -20], [25, -24], [24, -28], [28, -32], [36, -40, 1], [31, -47], [28, -56], [28, -66], [25, -79], [13, -92], [-6, -98], [-24, -90], [-33, -70], [-32, -48], [-25, -28], [-17, -8]];
  const LO_HEAD = [[-16, 16], [16, 18], [24, 12], [29, 4], [31, -6], [29, -14], [31, -20], [33, -24], [34, -28], [40, -32], [51, -40, 1], [44, -48], [38, -54], [33, -58], [31, -66], [27, -80], [15, -94], [-6, -99], [-25, -90], [-34, -70], [-33, -46], [-26, -24], [-20, -4]];
  const PI_HEAD = [[-13, 16], [10, 16], [11, 2], [16, -6], [23, -10], [26, -16], [24, -21], [27, -25], [26, -29], [29, -33], [36, -39, 1], [32, -46], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  function josephHead(p) {
    const f = p.face || {};
    fillPts([[24, -86], [10, -95], [-8, -98], [-26, -90], [-34, -72], [-35, -52], [-30, -28], [-20, -34], [-14, -46], [-8, -62], [-2, -74], [8, -82]], '#a9a59c', 3);      // cheveux gris courts
    for (let i = 0; i < 6; i++) strokePts([[-30 + i * 4, -82], [-26 + i * 3, -40]], 'rgba(110,105,96,0.6)', 1);
    fillPts([[-4, -70], [2, -70], [4, -48], [-2, -46]], '#a9a59c');                                                                 // favori court
    X.earPaint(-10, -46);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
    dot(16, -30, 11, 'rgba(210,120,100,0.3)');                                                                                       // joues rondes
    strokePts([[20, -38], [26, -32], [24, -24]], 'rgba(120,70,50,0.45)', 1.2); strokePts([[10, -66], [24, -68]], 'rgba(90,50,40,0.3)', 1);
    strokePts([[8, 8], [20, 4], [28, -4]], 'rgba(120,70,50,0.4)', 1.2);
    faceStd(f, { sourcil: 'rgba(110,104,96,0.95)', sourcilLw: 3 });
  }
  function etienneHead(p) {
    const f = p.face || {};
    fillPts([[30, -80], [24, -90], [12, -97], [-6, -101], [-24, -93], [-35, -72], [-36, -48], [-31, -30], [-22, -30], [-16, -42], [-12, -58], [-4, -68], [8, -76], [20, -78]], '#6b4a30', 3);
    for (let i = 0; i < 7; i++) strokePts([[16 - i * 7, -92 + i], [4 - i * 6, -70 + i * 4]], 'rgba(40,24,14,0.5)', 1.1);
    strokePts(ep(-22, -52, 10, 8, 8, -2.6, 0.6), 'rgba(150,110,70,0.7)', 1.4);                                                       // boucle souple sur l'oreille
    X.earPaint(-6, -42);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.4, 0.3);
    strokePts([[22, -30], [16, -18], [16, -12]], 'rgba(90,50,40,0.45)', 1.1); dot(14, -30, 7, 'rgba(205,130,110,0.16)');
    faceStd(f, { sourcil: 'rgba(70,45,28,0.95)' });
  }
  function louisHead(p) {
    const f = p.face || {};
    fillPts([[30, -82], [22, -94], [6, -103], [-14, -104], [-31, -94], [-39, -70], [-39, -40], [-31, -24], [-20, -28], [-15, -46], [-10, -62], [2, -76], [18, -82]], '#eeeae0', 3);   // perruque poudrée
    for (let i = 0; i < 8; i++) strokePts([[24 - i * 7, -94 + i * 0.5], [10 - i * 6, -78 + i * 3]], 'rgba(160,156,146,0.5)', 1);
    for (const [y, x0] of [[-62, -38], [-46, -39]]) {                                                                                // deux rouleaux au-dessus de l'oreille
      fillPts(rrect(x0, y - 7, -6, y + 7, 7), '#f6f3ec'); strokePts([[x0 + 2, y + 4], [-8, y + 4]], 'rgba(150,146,136,0.8)', 1.2);
      for (let x = x0 + 6; x < -8; x += 8) strokePts(ep(x, y, 3.5, 5.5, 5, -1.2, 1.5), 'rgba(150,146,136,0.7)', 0.9);
    }
    X.earPaint(-4, -30);
    hatch([[-22, -30], [2, -24], [14, -4], [-6, 18], [-32, 4]], 0.6, 3.4, 0.28);
    dot(18, -24, 10, 'rgba(210,130,110,0.24)');
    strokePts([[6, 14], [18, 12], [27, 4]], 'rgba(120,70,50,0.55)', 1.4);                                                            // double menton
    strokePts([[4, 6], [16, 2], [24, -4]], 'rgba(120,70,50,0.35)', 1.1);
    strokePts([[28, -34], [24, -30]], 'rgba(90,50,40,0.5)', 1.1); strokePts([[36, -46], [40, -40]], 'rgba(255,240,220,0.4)', 1.4);
    faceStd(f, { sourcil: 'rgba(150,130,110,0.95)', mx: 28, my: -20, eyeY: -56 });
    if ((f.eyes || 'open') === 'open' || f.eyes === 'half') strokePts([[12, -59], [18, -61], [24, -59]], 'rgba(150,100,80,0.6)', 1.2);   // paupière lourde
  }
  function pilatreHead(p) {
    const f = p.face || {};
    fillPts([[30, -78], [22, -88], [6, -96], [-14, -96], [-30, -88], [-36, -68], [-36, -44], [-30, -30], [-22, -32], [-16, -44], [-10, -60], [4, -72], [18, -78]], '#d6d4ce', 3);
    const aile = boucle([[-2, -64], [-14, -72], [-30, -72], [-40, -62], [-38, -48], [-26, -44], [-10, -48]], 3, 7);                   // aile poudrée sur la tempe
    fillPts(aile, '#e6e4de'); strokePts([[-6, -58], [-20, -62], [-34, -58]], 'rgba(140,138,132,0.8)', 1.2); strokePts([[-8, -52], [-24, -54], [-36, -52]], 'rgba(140,138,132,0.6)', 1);
    X.earPaint(-10, -36);
    hatch([[-22, -36], [2, -26], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
    dot(16, -30, 7, 'rgba(215,125,105,0.24)');
    faceStd(f, { sourcil: 'rgba(60,40,30,0.95)', sourcilLw: 2.6 });
  }
  // catogan (repère : nœud à la nuque) — queue repliée + ruban noir
  const catogan = (col, colD, nd) => ({ at: [-28, -10], col, pts: [[-6, -2], [6, -2], [8, 18], [6, 38], [-2, 46], [-9, 40], [-10, 18]],
    paint: () => { strokePts([[-2, 0], [0, 40]], colD, 1.2); hatch(null, 0.3, 3, 0.25); },
    extra: () => { pc([[-3, 2], [-14, 8], [-16, 34 * nd], [-10, 32 * nd], [-4, 8]], '#1e1c20', null, 4404);
      pc([[0, 0], [-8, -9 * nd], [-2, -15 * nd], [4, -3]], '#141316', null, 4401); pc([[0, 4], [-9, 12 * nd], [-3, 18 * nd], [4, 6]], '#141316', null, 4402); pc(ell(0, 2, 3.5, 4, 8), '#2a282c', null, 4403); } });

  const JOSEPH = { nom: 'Joseph', seed: 5100, k: 0.97, fx: 46, bx: -50, low: 112, ventre: 22, habit: '#6b4a2e', habitD: '#54391f', gilet: '#b8862f', bord: '#4a311b', bouton: '#3a2814', boutonG: '#7a5a1a',
    parement: '#5e4126', head: JO_HEAD, headPaint: josephHead, chapeau: 'rond',
    jambe: { k: 0.97, th: 1.06, culotte: '#4e3524', bas: '#8e8c88', soulier: '#211c1a', boucle: true } };
  const ETIENNE = { nom: 'Étienne', seed: 5200, k: 1.07, fx: 34, bx: -38, low: 118, habit: '#3f5468', habitD: '#2f3f50', gilet: '#e6dcc4', bord: '#2a3846', bouton: '#9aa4ae', boutonG: '#a89c80',
    parement: '#34475a', head: ET_HEAD, headPaint: etienneHead, queue: catogan('#6b4a30', 'rgba(40,24,14,0.6)', 1),
    jambe: { k: 1.07, th: 0.88, culotte: '#1f1c1e', bas: '#ece6d8', soulier: '#1a1716', boucle: true } };
  const LOUIS = { nom: 'Louis XVI', seed: 5300, k: 1.05, fx: 50, bx: -54, low: 116, ventre: 34, habit: '#2c3f7a', habitD: '#223163', gilet: '#d9c48a', brocart: '#b39545', bord: '#b39545', bordLw: 4.5, bouton: '#d8bf6a', boutonG: '#b39545',
    parement: '#2c3f7a', galonP: '#b39545', cordon: '#8fb4d8', head: LO_HEAD, headPaint: louisHead, queue: catogan('#eeeae0', 'rgba(150,146,136,0.7)', 1.3),
    jambe: { k: 1.05, th: 1.1, culotte: '#2c3f7a', bas: '#f1ece0', soulier: '#2a2224', boucle: true, talon: '#a8322a', jarretiere: '#b39545' } };
  const PILATRE = { nom: 'Pilâtre', seed: 5400, k: 1.0, fx: 38, bx: -42, low: 114, habit: '#8e2a24', habitD: '#6e1f1a', gilet: '#e8e0cc', bord: '#5a1612', bouton: '#e2c271', boutonG: '#b8a888',
    parement: '#7a2420', head: PI_HEAD, headPaint: pilatreHead, chapeau: 'tricorne', queue: catogan('#d6d4ce', 'rgba(140,138,132,0.7)', 0.9),
    jambe: { k: 1.0, th: 0.92, culotte: '#1f1c1e', bas: '#e8e2d4', soulier: '#2a1f1a', botte: '#2c211b', botteR: '#5a4030' } };
  CH.mgfJoseph = mk1783(JOSEPH); CH.mgfEtienne = mk1783(ETIENNE); CH.mgfLouis = mk1783(LOUIS); CH.mgfPilatre = mk1783(PILATRE);

  // ================================================================== GESTES (communs aux quatre ; chaque réglage 0..1)
  function mkPose(defName, cfg) {
    const hat = cfg.chapeau ? HAT[cfg.chapeau] : null;
    return function (p, x, y, s, dir) {
      const def = CH[defName], q = prep(p), A = q.ang, t = q.t || 0; x = x || 0; y = y || 0; s = s || 0.9; dir = dir || 1;
      const k = (n) => ease(clamp(q[n] || 0));
      if (A.armF_up == null) A.armF_up = 0.04; if (A.armF_lo == null) A.armF_lo = -0.14;
      if (A.armB_up == null) A.armB_up = -0.05; if (A.armB_lo == null) A.armB_lo = -0.14;
      if (q.galerie) { q.hide.legF = 1; q.hide.legB = 1; }
      if (q.assis) { q.dy = (q.dy || 0) + (-def.hipY - 121); if (p.ang == null || p.ang.armB_up == null) { armTo(q, 'armB', [70, -10], 1); if (q.handB == null) q.handB = 'open'; } if (p.ang == null || p.ang.armF_up == null) { armTo(q, 'armF', [84, -14], 1); if (q.handF == null) q.handF = 'open'; } }
      marche(q, q.marche ? 1 : 0, t);
      const hd = (v) => { A.head = (A.head || 0) + v; };
      const open = (b) => { if (b) { if (q.handB == null) q.handB = 'open'; } else if (q.handF == null) q.handF = 'open'; };
      // -- corps et tête
      const rc = k('surpris'); if (rc > 0) { q.tilt = (q.tilt || 0) - 0.1 * rc; q.dx = (q.dx || 0) - 10 * rc; hd(-0.14 * rc); faceDef(q, rc, { eyes: 'wide', brow: 'up', mouth: 'o' }); armTo(q, 'armF', [100, -196], rc); armTo(q, 'armB', [84, -204], rc); open(); open(true); }
      const dc = k('deconfit'); if (dc > 0) { hd(0.34 * dc); q.tilt = (q.tilt || 0) + 0.03 * dc; q.dy = (q.dy || 0) + 4 * dc; faceDef(q, dc, { brow: 'worry', mouth: 'tight', eyes: 'half' }); armTo(q, 'armF', [cfg.fx + (cfg.ventre || 0) * 0.5 + 24, -42], dc); armTo(q, 'armB', [cfg.fx + (cfg.ventre || 0) * 0.5 + 18, -38], dc); open(); open(true); }
      const rh = k('regardeHaut'); if (rh > 0) { hd(-0.42 * rh); faceDef(q, rh, { brow: 'up' }); if (q.visiere !== false) { armTo(q, 'armF', headPt(A.head, [40, -66]), rh); open(); A.armF_lo -= 0.0; } }
      // -- la main avant
      const nz = k('nez'); if (nz > 0) { hd(0.06 * nz); faceDef(q, nz, { eyes: 'closed', brow: 'worry', mouth: 'tight' }); armTo(q, 'armF', headPt(A.head, [44, -34]), nz); }
      const ag = k('agite'); if (ag > 0) { hd(-0.06 * ag); q.tilt = (q.tilt || 0) - 0.03 * ag; faceDef(q, ag, { eyes: 'half', brow: 'frown', mouth: 'tight' }); const w = Math.sin(t * 16); armTo(q, 'armF', lp2(headPt(A.head, [66, -40]), [0, 0], 0).map((v, i) => v + (i ? 6 * w : 10 * w)), ag); open(); }
      const pr = k('presente'); if (pr > 0) { const T = cibleT(def, q, q.cible, x, y, s, dir, null, [150, -128]); armTo(q, 'armF', T, pr); open(); hd(-0.06 * pr); faceDef(q, pr, { mouth: 'smile' }); }
      const ho = k('honneur'), rq = k('reclame');
      if (rq > 0) { armTo(q, 'armF', [128, -262], rq); open(); hd(-0.14 * rq); faceDef(q, rq, { brow: 'up' }); }
      if (ho > 0) { q.tilt = (q.tilt || 0) - 0.035 * ho; hd(-0.16 * ho); faceDef(q, ho, { eyes: 'half', mouth: 'smile' });
        if (rq > 0.01) { armTo(q, 'armB', [cfg.fx + 14 + (cfg.ventre || 0) * 0.2, -124], ho); open(true); } else { armTo(q, 'armF', [cfg.fx - 4 + (cfg.ventre || 0) * 0.2, -122], ho); open(); } }
      const co = k('coudre'); if (co > 0) {
        if (q.tenu == null) q.tenu = 'aiguille';
        const sw = Math.max(0, Math.sin(t * 6)), T = cibleT(def, q, q.cible, x, y, s, dir, null, [cfg.fx + (cfg.ventre || 0) + 62, -108]);
        armTo(q, 'armF', [T[0] + 4 * sw, T[1] - 18 * sw], co); armTo(q, 'armB', [T[0] - 22, T[1] + 8], co); hd(0.22 * co);
      }
      const je = clamp(q.jeter || 0); if (je > 0 || q.jeter === 0) { const u = ease(je), kk = q.jeter === 0 ? 1 : Math.min(1, je * 6); armTo(q, 'armF', lp2([66, -292], [150, -40], u), kk); armTo(q, 'armB', [52, -70], kk); q.tilt = (q.tilt || 0) + 0.12 * u * kk; hd(0.12 * u * kk); faceDef(q, kk, { mouth: 'tight', brow: 'frown' }); }
      const la = clamp(q.lance || 0); if (la > 0 || q.lance === 0) { const u = ease(la), kk = q.lance === 0 ? 1 : Math.min(1, la * 6); armTo(q, 'armF', lp2([24, -26], [132, -214], u), kk); armTo(q, 'armB', [56, -80], kk); q.tilt = (q.tilt || 0) - 0.05 * u * kk; hd(-0.1 * u * kk); }
      const te = k('tenir'); if (te > 0) { armTo(q, 'armF', cibleT(def, q, q.cible, x, y, s, dir, null, [104, -168]), te); const ob = objOf(q.tenu); if (q.deuxMains == null && ob && ob.p2) q.deuxMains = true; if (!q.deuxMains) armTo(q, 'armB', cibleT(def, q, q.cibleB, x, y, s, dir, null, [86, -150]), te); }
      const po = k('porte'); if (po > 0) { if (q.tenu == null) { q.tenu = 'cage'; q.tenuO = Object.assign({ echelle: 0.72 }, q.tenuO); } armTo(q, 'armF', [140, -122], po); if (q.deuxMains == null) q.deuxMains = true; hd(0.04 * po); }
      const eo = k('eponge'); if (eo > 0) {
        if (q.tenu == null) q.tenu = 'perche'; if (q.deuxMains == null) q.deuxMains = true;
        // mains à hauteur de poitrine ; la perche s'incline vers la cible (point écran de l'éponge), les mains glissent le long de la perche
        const H0 = [64, -126], T = q.cible ? toTorso(def, q, q.cible, x, y, s, dir) : null;
        let lean = q.incline == null ? 0.6 : q.incline, slide = 0;
        if (T) { lean = clamp(Math.atan2(T[0] - H0[0], -(T[1] - H0[1])), -0.2, 1.3); slide = clamp(Math.hypot(T[0] - H0[0], T[1] - H0[1]) - 250 * ((q.tenuO && q.tenuO.echelle) || 1), -50, 50); }
        const tp = slide + (q.tamponne == null ? 1 : q.tamponne) * Math.sin(t * 9) * 8, ux = Math.sin(lean), uy = -Math.cos(lean);
        A.objet = (A.objet || 0) + lean * eo;
        armTo(q, 'armF', [H0[0] + ux * tp, H0[1] + uy * tp], eo); hd(-0.12 * eo); faceDef(q, eo, { brow: 'frown', mouth: 'tight' });
      }
      const ob_ = k('observe'); if (ob_ > 0) {
        if (q.tenu == null) q.tenu = 'lorgnette'; const vz = q.visee || 0; hd(vz * 0.85 * ob_);
        A.objet = (A.objet || 0) + vz; const off = offsetObj(q.tenu, q.tenuO, 'oeil', vz), E = headPt(A.head, [24, -52]);
        armTo(q, 'armF', [E[0] - off[0], E[1] - off[1]], ob_); faceDef(q, ob_, { eyes: 'half' });
      }
      const pe = k('pense'); if (pe > 0) { hd(-0.26 * pe); faceDef(q, pe, { brow: 'up', mouth: 'tight' }); armTo(q, 'armF', headPt(A.head, [32, 0]), pe); armTo(q, 'armB', [44, -82], pe); open(true); }
      const ap = k('applaudit'); if (ap > 0) { const d = 9 * (0.5 + 0.5 * Math.sin(t * 15)); armTo(q, 'armF', [84 + d, -130], ap); armTo(q, 'armB', [70 - d, -128], ap); open(); open(true); hd(-0.08 * ap); faceDef(q, ap, { mouth: 'smile', eyes: 'half' }); }
      // -- salut (chapeau soulevé) : 0 → 0,45 la main va au bord avant du chapeau ; 0,45 → 1 le chapeau monte dans la main
      const sa = clamp(q.salut || 0); if (hat && sa > 0) {
        const ua = ease(smooth(0, 0.45, sa)), ub = ease(smooth(0.45, 1, sa)), Pp = headPt(A.head, [hat.prise[0] - 8, hat.prise[1] + 4]);
        armTo(q, 'armF', lp2(Pp, [78, -268], ub), ua); q.handF = 'fist';
        if (sa > 0.45) { q._chapeauMain = true; A.chapeauM = (A.head || 0) - (A.armF_up + A.armF_lo) - 0.35 * ub; }
        hd(-0.06 * ub); faceDef(q, ub, { mouth: 'smile' });
      }
      return finish(q);
    };
  }
  MGF.josephPose = mkPose('mgfJoseph', JOSEPH); MGF.etiennePose = mkPose('mgfEtienne', ETIENNE); MGF.louisPose = mkPose('mgfLouis', LOUIS); MGF.pilatrePose = mkPose('mgfPilatre', PILATRE);
  for (const [n, d] of [['joseph', 'mgfJoseph'], ['etienne', 'mgfEtienne'], ['louis', 'mgfLouis'], ['pilatre', 'mgfPilatre']])
    MGF[n] = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH[d], MGF[n + 'Pose'](pose, x, y, s, dir), x, y, s, o); };

  // ================================================================== ANIMAUX DE FERME (repère : pieds au sol en (0,0), regard vers +x, échelle 1)
  const WOOL = '#e8e0cc', WOOLD = '#c9bfa6', SHB = '#3a2f28', SHBF = '#2a221d';
  function oeilBete(x, y, r, f, col) {
    if (f === 'closed') { strokePts([[x - r, y], [x, y + r * 0.4], [x + r, y]], '#141010', 1.6); return; }
    const k = f === 'wide' ? 1.35 : 1;
    dot(x, y, r * 1.25 * k, f === 'wide' ? '#f4efe2' : (col || '#d9c27a')); dot(x + r * 0.15, y, r * 0.75, '#141010'); dot(x - r * 0.25, y - r * 0.35, r * 0.28, 'rgba(255,255,255,0.85)');
    if (f === 'half') fillPts([[x - r * 1.5, y - r * 1.6], [x + r * 1.5, y - r * 1.6], [x + r * 1.5, y - r * 0.05], [x - r * 1.5, y + r * 0.1]], col === '#ffffff' ? '#ddd' : (f.lid || SHB));
  }
  // ---- le mouton : toison ivoire bouclée, tête et pattes brun noir, oreilles tombantes
  function moutonTete(o, g) {
    const f = o.inquiet ? 'wide' : (o.fier ? 'half' : (o.yeux || 'open')), ch = o.mache ? Math.max(0, Math.sin(g * 9)) * 0.22 * (o.mache === true ? 1 : o.mache) : 0, bl = clamp(o.bele || 0);
    // oreille lointaine
    pc([[2, -18], [-8, -16], [-20, -4], [-26, 8], [-20, 10], [-8, 0], [4, -8]], SHBF, null, 6110);
    // mâchoire (rumine / bêle)
    const c = cx_(); c.save(); c.translate(26, 22); c.rotate(ch + bl * 0.45);
    pc([[-6, -2], [26, 6], [30, 12, 1], [20, 16], [-2, 10]], SHB, () => strokePts([[0, 4], [24, 9]], 'rgba(0,0,0,0.4)', 1), 6111); c.restore();
    pc([[-12, -20], [4, -28], [20, -26], [34, -16], [46, 0], [55, 14], [58, 24, 1], [52, 30], [40, 32], [30, 28], [18, 20], [4, 14], [-10, 10]], SHB, () => {
      strokePts([[30, -14], [44, 2], [52, 14]], 'rgba(255,240,220,0.18)', 2.2); dot(53, 18, 2.4, '#140e0c');
      strokePts([[42, 27], [52, 25]], 'rgba(0,0,0,0.6)', 1.2); hatch(null, 0.6, 3.6, 0.18, 1, '255,240,220', [-20, -40, 70, 40]);
    }, 6112);
    oeilBete(22, -8, 3.4, f, '#c9a64a');
    if (o.fier) strokePts([[16, -12], [28, -12]], '#140e0c', 1.6);
    pc(boucle(ell(4, -26, 15, 9, 10), 2.5, 5), WOOL, () => hatch(null, 0.8, 3, 0.2), 6113);                       // toupet de laine
    pc([[4, -18], [-6, -20], [-22, -8], [-32, 6], [-28, 12], [-16, 4], [2, -6]], SHB, () => fillPts([[-4, -14], [-18, -6], [-26, 6], [-18, 2], [-4, -8]], '#6a4a40'), 6114);   // oreille tombante
  }
  function moutonFace(o) {                                                         // tête de face (vers le public)
    const f = o.inquiet ? 'wide' : (o.fier ? 'half' : 'open');
    pc([[-18, -18], [-46, -6], [-44, 2], [-18, -6]], SHBF, null, 6120); pc([[18, -18], [46, -6], [44, 2], [18, -6]], SHBF, null, 6121);
    pc([[-18, -26], [18, -26], [23, -6], [17, 20], [9, 36], [-9, 36], [-17, 20], [-23, -6]], SHB, () => { dot(-5, 28, 2.2, '#140e0c'); dot(5, 28, 2.2, '#140e0c'); strokePts([[-5, 33], [0, 35], [5, 33]], 'rgba(0,0,0,0.6)', 1.2); strokePts([[0, -10], [0, 22]], 'rgba(255,240,220,0.15)', 2); }, 6122);
    oeilBete(-12, -6, 3.2, f, '#c9a64a'); oeilBete(12, -6, 3.2, f, '#c9a64a');
    if (o.fier) { strokePts([[-17, -10], [-7, -10]], '#140e0c', 1.6); strokePts([[7, -10], [17, -10]], '#140e0c', 1.6); }
    pc(boucle(ell(0, -28, 20, 10, 12), 2.5, 5), WOOL, () => hatch(null, 0.8, 3, 0.2), 6123);
  }
  function drawMouton(o) {
    const t = o.t || 0, g = M.tg(t), c = cx_(), sw = o.pas ? Math.sin(t * 10) * 0.32 : 0, bob = o.pas ? Math.abs(Math.sin(t * 10)) * 3 : 0;
    const leg = (x, a, far, sd) => { c.save(); c.translate(x, -54); c.rotate(a); pc([[-6, -4], [6, -4], [5, 38], [7, 50, 1], [-6, 52, 1], [-5, 38]], far ? SHBF : SHB, () => strokePts([[-5, 45], [6, 45]], 'rgba(0,0,0,0.6)', 1.2), sd); c.restore(); };
    leg(-56, sw, true, 6101); leg(40, -sw, true, 6102);
    c.save(); c.translate(0, -bob);
    pc(boucle(ell(-90, -92, 12, 10, 8), 2, 5), WOOLD, null, 6103);                                                // queue
    const body = boucle([[-92, -92], [-84, -118], [-50, -130], [-8, -132], [30, -128], [56, -130], [74, -116], [78, -96], [70, -74], [50, -58], [10, -52], [-40, -52], [-80, -64]], 5.5, 10);
    pc(body, WOOL, () => {
      const R = M.rng(61); for (let i = 0; i < 46; i++) { const x = -86 + R() * 160, y = -126 + R() * 72, r = 3 + R() * 3; strokePts(ep(x, y, r, r * 0.8, 6, 0.3, 3.4), 'rgba(140,128,100,0.75)', 1.1); }
      hatch(null, 0.9, 3.8, 0.22, 1, P.encre, [-100, -140, 90, -40]); shade(-8, -130, -8, -50, 0.3, [-100, -140, 90, -40]);
    }, 6104);
    const tk = clamp(o.tete || 0), ha = (o.fier ? -0.32 : 0) + (o.regardeHaut ? -0.6 * (o.regardeHaut === true ? 1 : o.regardeHaut) : 0) - 0.12 * clamp(o.bele || 0);
    c.save(); c.translate(60, -112); c.rotate(ha * (1 - tk));
    c.scale(1.22, 1.22);
    if (tk < 0.5) { c.save(); c.scale(Math.cos(tk * PI), 1); moutonTete(o, g); c.restore(); }
    else { c.save(); c.translate(22, 6); c.rotate(ha * tk * 0.6); c.scale(Math.sin((tk - 0.5) * PI), 1); moutonFace(o); c.restore(); }
    c.restore();
    c.restore();
    leg(-44, -sw, false, 6106); leg(54, sw, false, 6107);
  }
  // ---- le canard colvert
  function drawCanard(o) {
    const t = o.t || 0, g = M.tg(t), c = cx_(), cu = clamp(o.cou || 0), al = clamp(o.ailes || 0), f = o.blase ? 'half' : (o.inquiet ? 'wide' : 'open');
    const hx = 44 + 10 * cu, hy = -92 - 26 * cu;
    for (const [x, sd] of [[-6, 6201], [6, 6202]]) { pc([[x - 3, -26], [x + 3, -26], [x + 3, -6], [x + 16, -2], [x + 18, 1, 1], [x - 6, 1, 1], [x - 3, -6]], x < 0 ? '#b8682a' : '#d27a30', null, sd); }
    // aile levée lointaine
    if (al > 0.02) { const a = (0.7 + 0.5 * Math.sin(t * 16)) * al; c.save(); c.translate(-6, -62); c.rotate(a);
      pc([[0, 0], [-20, -10], [-60, -24], [-74, -18], [-66, -8], [-40, 2]], '#6e6a62', () => { for (const x of [-60, -50, -40]) strokePts([[x, -18], [x + 6, -2]], 'rgba(30,30,30,0.5)', 1.2); }, 6203); c.restore(); }
    pc([[-60, -52], [-70, -64, 1], [-56, -60], [-40, -66], [0, -70], [30, -66], [40, -54], [42, -38], [30, -26], [-10, -22], [-44, -28]], '#a29e94', () => {
      fillPts([[22, -70], [36, -66], [44, -54], [44, -36], [32, -26], [18, -30], [16, -60]], '#7a4a30');             // poitrine brun-roux
      fillPts([[-62, -50], [-70, -64], [-58, -60], [-52, -48]], '#1e1c1c'); strokePts([[-64, -58], [-58, -66], [-60, -72], [-54, -72]], '#1e1c1c', 2.2);   // queue et boucle
      for (let x = -40; x < 14; x += 6) strokePts([[x, -64], [x + 3, -30]], 'rgba(60,60,60,0.25)', 0.8);
      hatch(null, 0.5, 3.6, 0.2, 1, P.encre, [-80, -80, 50, -20]); shade(0, -70, 0, -22, 0.25, [-80, -80, 50, -20]);
    }, 6204);
    // aile pliée (ou levée)
    c.save(); c.translate(-2, -58); c.rotate(al > 0.02 ? (0.5 + 0.5 * Math.sin(t * 16 + 0.6)) * al : 0);
    pc([[10, -2], [-14, -6], [-44, -4], [-58, 4], [-40, 10], [-6, 10]], '#6e6a62', () => { fillPts([[-30, -2], [-12, -3], [-12, 6], [-30, 6]], '#3f5a8a'); strokePts([[-32, -3], [-10, -4]], '#f4f0e6', 1.4); strokePts([[-32, 7], [-10, 7]], '#f4f0e6', 1.4); }, 6205);
    c.restore();
    // cou + collier blanc + tête verte + bec ocre
    pc(ribbonW([[30, -60], [lerp(36, 44, cu), lerp(-74, -90, cu)], [hx - 2, hy + 8]], 18), '#3d5a3a', () => hatch(null, 0.5, 3.4, 0.2, 1, P.encre, [0, -140, 80, -40]), 6206);
    fillPts(ribbonW([[24, -63], [38, -66]], 5).map((p) => [p[0], p[1]]), '#f4f0e6');
    const cb = clamp(o.coin || 0);
    c.save(); c.translate(hx + 12, hy + 3); c.rotate(cb * 0.35); pc([[0, 0], [20, 3], [22, 6, 1], [2, 5]], '#b8902e', null, 6207); c.restore();
    pc([[hx + 10, hy - 3], [hx + 30, hy + 2], [hx + 34, hy + 6, 1], [hx + 28, hy + 7], [hx + 10, hy + 5]], '#c9a03a', () => dot(hx + 18, hy + 1, 1.3, '#5a4010'), 6208);
    pc(ell(hx, hy, 15, 13, 14), '#3d5a3a', () => { strokePts([[hx - 8, hy - 8], [hx + 6, hy - 10]], 'rgba(170,220,170,0.45)', 2); }, 6209);
    oeilBete(hx + 5, hy - 3, 2.6, f, '#3a2a14');
  }
  // ---- le coq gaulois de ferme
  function drawCoq(o) {
    const t = o.t || 0, c = cx_(), ch = clamp(o.chante || 0), eb = clamp(o.ebouriffe || 0), f = o.inquiet ? 'wide' : (ch > 0.5 ? 'closed' : 'open');
    const hx = 32 + 8 * ch, hy = -126 - 14 * ch, ha = -0.45 * ch;
    for (const [x, sd, col] of [[-8, 6301, '#8a8248'], [8, 6302, '#a89c58']]) {
      pc([[x - 3, -50], [x + 3, -50], [x + 2, -8], [x + 16, -2], [x + 18, 1, 1], [x - 10, 1, 1], [x - 3, -6], [x - 7, -14], [x - 3, -16]], col, () => { for (let y = -44; y < -10; y += 6) strokePts([[x - 3, y], [x + 3, y + 1]], 'rgba(60,50,20,0.5)', 0.8); }, sd);
    }
    // queue en faucilles vert-noir
    const sick = [[-34, -86, -70, -168, -82, -126, 12], [-36, -80, -84, -150, -92, -100, 11], [-38, -76, -78, -122, -94, -76, 10], [-30, -88, -50, -170, -66, -150, 9]];
    for (const [i, s_] of sick.entries()) pc(ribbonW(qbez([s_[0], s_[1]], [s_[2], s_[3]], [s_[4], s_[5]], 10), (u) => s_[6] * (1 - 0.7 * u)), i % 2 ? '#20302a' : '#1a2622', () => strokePts(qbez([s_[0], s_[1] - 2], [s_[2], s_[3] - 2], [s_[4], s_[5] - 2], 8), 'rgba(110,170,130,0.5)', 1.4), 6310 + i);
    const bodyP = ell(-6, -74, 40 + 6 * eb, 30 + 5 * eb, 18);
    pc(eb > 0.05 ? boucle(bodyP, 6 * eb, 7) : bodyP, '#8a4a2a', () => {
      fillPts([[-46, -74], [-20, -86], [10, -84], [16, -66], [-4, -54], [-40, -58]], '#6e3a20');                      // aile
      fillPts([[-46, -70], [-40, -58], [-14, -56], [-22, -64]], '#20302a');
      for (let x = -38; x < 10; x += 7) strokePts([[x, -82], [x - 4, -60]], 'rgba(40,20,10,0.5)', 1);
      hatch(null, 0.6, 3.6, 0.22, 1, P.encre, [-60, -110, 40, -40]); shade(0, -104, 0, -44, 0.25, [-60, -110, 40, -40]);
    }, 6320);
    // camail ocre doré (plumes en pointes)
    const cam = [[hx - 10, hy - 4], [hx + 8, hy + 6], [24, -100], [30, -88], [20, -86], [14, -80], [6, -86], [-2, -80], [-8, -88], [-14, -84], [-16, -94], [-6, -106], [hx - 18, hy + 8]];
    pc(eb > 0.05 ? cam.map((p, i) => (i > 2 && i < 11 && i % 2 ? [p[0], p[1] + 6 * eb] : p)) : cam, '#c08a2f', () => { for (let i = 0; i < 9; i++) strokePts([[hx - 10 + i * 3, hy + 4], [-10 + i * 5, -72]], 'rgba(120,70,20,0.55)', 1); }, 6321);
    c.save(); c.translate(hx, hy); c.rotate(ha);
    pc([[2, -10], [4, -22, 1], [8, -15], [12, -25, 1], [15, -15], [20, -24, 1], [21, -13], [26, -18, 1], [24, -8], [8, -6]], '#a52a22', () => hatch(null, 0.5, 3, 0.2), 6322);   // crête
    pc([[14, 4], [18, 20], [12, 26], [8, 18], [9, 6]], '#a52a22', null, 6323);                                         // barbillon
    c.save(); c.translate(18, 1); c.rotate(0.5 * ch); pc([[0, 0], [10, 2], [0, 4]], '#a8843a', null, 6324); c.restore();
    pc([[18, -4], [30, 0], [18, 2]], '#c9a03a', null, 6325);
    pc(ell(8, -2, 12, 10, 12), '#b0302a', () => fillPts(ell(4, -4, 8, 7, 10), '#c08a2f'), 6326);
    oeilBete(11, -4, 2.4, f, '#d8862a');
    c.restore();
  }
  // enveloppe commune : marionnette d'animal (tige facultative) ; pose = options de l'animal + t, tilt, dx, dy
  const BETE = { mouton: { fn: drawMouton, rod: [-8, -56] }, canard: { fn: drawCanard, rod: [-6, -26] }, coq: { fn: drawCoq, rod: [-6, -48] } };
  for (const n of Object.keys(BETE)) {
    MGF[n + 'Draw'] = BETE[n].fn;
    MGF[n] = (pose, x, y, s, o) => {
      pose = pose || {}; o = o || {}; s = s == null ? 1 : s;
      const def = accDef('bete_' + n, BETE[n].fn, o.rod === false ? null : { part: 'o', at: BETE[n].rod });
      return M.puppet(def, { o: Object.assign({ t: 0 }, pose), tilt: pose.tilt || 0, dx: pose.dx || 0, dy: pose.dy || 0 }, x, y, s,
        { dir: o.dir || 1, slot: o.slot != null ? o.slot : ST.slotF, cast: o.cast, alpha: o.alpha, rod: o.rod === false ? false : undefined, floorShadow: o.floorShadow, nom: n });
    };
  }

  // ================================================================== LA CAGE D'OSIER (repère : milieu du fond (0,0) ; R = 150)
  const OSI = '#a8823f', OSIL = '#c9a25a', OSID = '#7a5a28';
  const CAGE = { R: 150, rim: -70, ring: -205, lid: -248, arche: -300, montant: 156 };
  const ARCHE = qbez([-156, -230], [0, -370], [156, -230], 18);
  MGF.CAGE = CAGE;
  function vannerie(x0, y0, x1, y1, seed) {                                        // tressage : rangs d'ovales alternés
    const R = M.rng(seed);
    for (let y = y0 + 6, row = 0; y < y1; y += 10, row++) for (let x = x0 + (row % 2 ? 8 : 0); x < x1; x += 16) {
      const pts = ell(x, y, 8, 4.6, 8); fillPts(pts, R() < 0.5 ? OSIL : '#b8924a'); strokePts(pts.concat([pts[0]]), 'rgba(80,55,20,0.55)', 0.8); }
  }
  function drawCage(o) {
    const t = o.t || 0, g = M.tg(t), c = cx_(), R = CAGE.R, rim = CAGE.rim, rg = CAGE.ring;
    // cordes (pendue) : quatre cordes du cercle haut vers deux points d'attache
    if (o.pendue) { const L = o.pendue, a = o.attache == null ? 46 : o.attache;
      for (const [x, ax] of [[-0.9, -1], [-0.35, -1], [0.35, 1], [0.9, 1]]) strokePts([[x * R, rg + 4], [ax * a, rg - L]], '#5a4630', 2.2); }
    // intérieur sombre et barreaux du fond
    pc([[-R + 6, rim], [R - 6, rim], [R - 8, rg], [-R + 8, rg]], '#6e5634', () => { for (let x = -R + 26; x < R; x += 48) strokePts([[x + 20, rim], [x + 20, rg]], 'rgba(60,40,20,0.45)', 3); hatch(null, 0.2, 6, 0.2); }, 6400, { drop: false });
    // animaux (dessinés à l'intérieur, le bas caché par la vannerie)
    const ani = (name, x, y, sc, opt) => { if (!opt) return; const op = Object.assign({ t }, opt === true ? {} : opt), ag = op.agrippe ? clamp(op.agrippe) : 0;
      c.save(); c.translate(x, y - 14 * ag); c.rotate(-0.18 * ag); c.scale(sc * (op.dir || 1), sc); BETE[name].fn(op); c.restore(); };
    ani('coq', 104, -36, 0.92, o.coq);
    ani('mouton', -34, -44, 0.86, o.mouton);
    ani('canard', -98, -58, 0.96, o.canard);
    // vannerie de devant, barreaux, cercles
    pc([[-R - 2, rim, 1], [R + 2, rim, 1]].concat(ep(0, -12, R, 14, 12, 0, PI)), OSI, () => { vannerie(-R, rim, R, 0, 6401); shade(-R, 0, R, 0, 0.22, [-R - 4, rim - 4, R + 4, 4]); }, 6402);
    for (let x = -R + 10; x <= R - 10; x += 46) pc(rect(x - 2.5, rg, x + 2.5, rim), OSI, () => strokePts([[x - 1, rg], [x - 1, rim]], OSIL, 1.2), 6410 + x);
    pc(rrect(-R - 4, rim - 8, R + 4, rim + 2, 4), OSID, () => strokePts([[-R, rim - 5], [R, rim - 5]], OSIL, 1.4), 6403);
    pc(rrect(-R - 2, rg - 6, R + 2, rg + 4, 4), OSID, () => strokePts([[-R, rg - 3], [R, rg - 3]], OSIL, 1.4), 6404);
    // pattes agrippées au bord
    for (const [n, hx] of [['mouton', 44], ['coq', 128]]) { const op = o[n]; if (op && op.agrippe > 0.3) { if (n === 'mouton') { pc([[hx - 6, rim - 14], [hx + 6, rim - 14], [hx + 7, rim + 2, 1], [hx - 6, rim + 2, 1]], SHB, null, 6420); pc([[hx + 14, rim - 12], [hx + 24, rim - 12], [hx + 25, rim + 2, 1], [hx + 13, rim + 2, 1]], SHB, null, 6421); } else for (const d of [-6, 2, 10]) strokePts([[hx + d, rim - 10], [hx + d + 3, rim + 4]], '#8a8248', 2.4); } }
    // couvercle bombé (charnière à l'arrière, ouvert vers le haut)
    const cv = ease(clamp(o.couvercle || 0));
    c.save(); c.translate(-R, rg); c.rotate(-1.9 * cv);
    pc(ep(R, 0, R + 4, 44, 16, PI, TAU).concat([[2 * R + 4, 2, 1], [-4, 2, 1]]), OSI, () => { for (let a = -0.9; a <= 0.9; a += 0.3) strokePts(qbez([R + a * 30, -44], [R + a * 100, -30], [R + a * (R + 2), 0], 6), 'rgba(80,55,20,0.6)', 1.2); for (const yy of [-12, -26]) strokePts(ep(R, 0, R + 2 - (-yy) * 1.2, -yy, 12, PI + 0.2, TAU - 0.2), 'rgba(220,180,110,0.5)', 1); }, 6405);
    pc(ell(R, -50, 9, 7, 10), OSID, null, 6406);
    c.restore();
    // drap ivoire qui couvre la cage (remue, un coin qui se soulève)
    const dr = clamp(o.drap || 0);
    if (dr > 0.02) {
      const rm = clamp(o.remue || 0), co = ease(clamp(o.coin || 0)), yb = lerp(rg - 30, -26, dr), wob = (x, y) => rm * (9 * Math.sin(g * 7 + y * 0.04 + x * 0.02) + 6 * Math.sin(g * 11.3 + x * 0.05));
      const pts = [];
      for (let i = 0; i <= 8; i++) { const y = lerp(yb, rg + 10, i / 8); pts.push([-R - 14 - wob(-R, y) - 2 * Math.sin(i * 1.7), y]); }
      for (let i = 0; i <= 16; i++) { const a = PI + i / 16 * PI, x = Math.cos(a) * (R + 14), y = rg + 6 + Math.sin(a) * 60; pts.push([x, y - Math.abs(wob(x, y)) * 0.8]); }
      for (let i = 8; i >= 0; i--) { const y = lerp(yb, rg + 10, i / 8); pts.push([R + 14 + wob(R, y) + 2 * Math.sin(i * 1.3), y - (i < 3 ? co * (3 - i) * 16 : 0)]); }
      for (let i = 1; i < 12; i++) { const x = lerp(R + 10, -R - 10, i / 12); pts.push([x, yb + 6 * Math.sin(i * 1.9) + 4 - (x > 40 ? co * 46 * smooth(40, R, x) : 0)]); }
      pc(pts, '#e8e0c8', () => { for (let x = -R + 10; x < R; x += 34) strokePts(qbez([x, rg - 40], [x + 10 + wob(x, 0) * 0.8, (rg + yb) / 2], [x - 4, yb], 8), 'rgba(140,128,100,0.5)', 1.4); hatch(null, 1.2, 4.2, 0.18, 1, P.encre, [-R - 20, rg - 80, R + 20, 10]); shade(-R, 0, R, 0, 0.18, [-R - 20, rg - 80, R + 20, 10]); }, 6407);
    }
    // montants latéraux et anse en arceau (prises)
    for (const sx of [-1, 1]) pc(rect(sx * CAGE.montant - 6, -228, sx * CAGE.montant + 6, 4), OSID, () => { for (let y = -220; y < 0; y += 14) strokePts([[sx * CAGE.montant - 6, y], [sx * CAGE.montant + 6, y + 6]], 'rgba(220,180,110,0.45)', 1.2); }, 6430 + sx);
    pc(ribbonW(ARCHE, 11), OSID, () => strokePts(ARCHE, 'rgba(220,180,110,0.5)', 1.4), 6433);
  }
  OBJ.cage = { draw: drawCage, grip: [-30, -297], p2: () => [-156, -150], pts: { fond: [0, 0], haut: [0, -300], bord: [0, CAGE.rim] }, base: [0, 0] };
  MGF.cage = (x, y, s, o) => accDraw('cage', drawCage, x, y, s, o, 1);
  // point écran d'un repère de la cage posée par MGF.cage(x, y, s, o) : 'fond' 'bord' (haut de la vannerie) 'anneau' 'haut' (sommet de l'anse) 'attache' (cordes)
  MGF.cagePt = (nom, x, y, s, o) => { o = o || {}; s = s == null ? 1 : s; const d = o.dir || 1;
    const q = { fond: [0, 0], bord: [0, CAGE.rim], anneau: [0, CAGE.ring], haut: [0, CAGE.arche], attache: [0, CAGE.ring - (o.pendue || 0)], prise: [-30, -297] }[nom] || [0, 0];
    return [x + d * s * q[0], y + s * q[1]]; };

  // ================================================================== LE BALLON (repère : centre du col inférieur (0,0), enveloppe vers le haut)
  const OR = '#c9a24a', ORL = '#e8c86a', ORD = '#8a6a2a', AZ = '#3d6a9a', AZD = '#2c5078', AZL = '#5a88b8';
  const BT = {
    annonay: { H: 700, Rm: 250, rc: 62, col: '#cdb68a', colD: '#a8915e' },
    versailles: { H: 760, Rm: 270, rc: 66, col: AZ, colD: AZD },
    muette: { H: 820, Rm: 292, rc: 74, col: AZ, colD: AZD },
  };
  MGF.BT = BT;
  const VM = 0.6;
  function rayon(G, v) { return v <= VM ? G.rc + (G.Rm - G.rc) * Math.pow(Math.sin(PI / 2 * v / VM), 1.15) : G.Rm * Math.sqrt(Math.max(0, 1 - Math.pow((v - VM) / (1 - VM), 2))); }
  // géométrie selon le gonflement : point (côté ±1, hauteur relative v 0..1) ; phi = méridien (−π/2..π/2) pour les coutures
  function bGeo(type, gonfle) {
    const G = BT[type] || BT.annonay, e = ease(clamp(gonfle == null ? 1 : gonfle)), hs = lerp(0.24, 1, e), sp = lerp(1.2, 1, e), mou = 1 - e;
    const h = (v) => G.H * v * hs;
    const r = (v, side) => lerp(G.Rm * 1.2 * Math.pow(Math.max(0, 1 - v), 0.45) + G.rc * 0.3, rayon(G, v), e) + mou * (16 * Math.sin(v * 23 + side * 1.7) + 9 * Math.sin(v * 41 + side));
    const lean = (v) => mou * 110 * v * v;
    const at = (v, phi) => { const rr = r(v, Math.sign(phi) || 1); return [rr * Math.sin(phi) + lean(v), -h(v) + rr * 0.07 * Math.cos(phi) * (1 - Math.pow(v, 3))]; };
    const out = []; for (let i = 0; i <= 26; i++) { const v = i / 26; out.push([r(v, 1) + lean(v), -h(v)]); }
    for (let i = 26; i >= 0; i--) { const v = i / 26; out.push([-r(v, -1) + lean(v), -h(v)]); }
    return { G, e, hs, h, r, lean, at, out, cy: -G.H * hs * 0.5, H: G.H * hs };
  }
  // points nommés (repère du ballon, avant le tangage)
  function bPtsLocal(type, gonfle, nom) {
    const B = bGeo(type, gonfle), G = B.G;
    switch (nom) {
      case 'col': return [0, 0];
      case 'haut': return [B.lean(1), -B.H];
      case 'centre': return [B.lean(0.5), B.cy];
      case 'trou': return B.at(0.46, -0.42);
      case 'flancG': return [-B.r(0.5, -1) + B.lean(0.5), -B.h(0.5)];
      case 'flancD': return [B.r(0.5, 1) + B.lean(0.5), -B.h(0.5)];
      case 'galerieAvant': return [-(G.rc + 96), 56];
      case 'galerieArriere': return [G.rc + 96, 56];
      case 'cage': return [0, 150];
      case 'rechaud': return [0, 70];
      default: return [0, 0];
    }
  }
  const bTilt = (o) => { const g = M.tg(o.t || 0), b = o.balance === true ? 1 : (o.balance || 0); return (o.incline || 0) + b * 0.035 * Math.sin(g * 1.1) + b * 0.012 * Math.sin(g * 2.7); };
  function bMap(x, y, s, o) { const B = bGeo(o.type || 'annonay', o.gonfle), a = bTilt(o), d = o.dir || 1, cy = B.cy;
    return (p) => { const q = rot([p[0], p[1]], a, [0, cy]); return [x + d * s * q[0], y + s * q[1]]; }; }
  MGF.ballonPt = (nom, x, y, s, o) => { o = o || {}; s = s == null ? 1 : s; return bMap(x, y, s, o)(bPtsLocal(o.type || 'annonay', o.gonfle, nom)); };

  function paintAnnonay(B) {
    const G = B.G, R = M.rng(83);
    for (let j = 0; j < 14; j++) for (let i = 0; i < 10; i++) {                                    // papiers collés (teintes voisines)
      const v0 = j / 14, v1 = (j + 1) / 14, p0 = -PI / 2 + i * PI / 10, p1 = p0 + PI / 10, tone = R();
      fillPts([B.at(v0, p0), B.at(v0, p1), B.at(v1, p1), B.at(v1, p0)], tone < 0.33 ? '#d6c296' : tone < 0.66 ? '#c4ab7c' : '#dccba2', 0, 0);
    }
    for (let i = 1; i < 10; i++) { const phi = -PI / 2 + i * PI / 10, L = []; for (let k = 0; k <= 30; k++) L.push(B.at(k / 30, phi)); strokePts(L, 'rgba(90,70,40,0.7)', 1.5);
      for (let k = 1; k < 30; k += 1) { const a = L[k]; strokePts([[a[0] - 3, a[1]], [a[0] + 3, a[1]]], 'rgba(90,70,40,0.55)', 1); } }
    for (let j = 1; j < 14; j++) { const L = []; for (let k = 0; k <= 20; k++) L.push(B.at(j / 14, -PI / 2 + k * PI / 20)); strokePts(L, 'rgba(110,86,50,0.5)', 1.2); for (let k = 2; k < 20; k += 3) dot(L[k][0], L[k][1], 2.2, '#5a4426'); }
    hatch(null, 0.7, 4.4, 0.16, 1, P.encre, [-420, -800, 420, 20]);
  }
  function soleil(x, y, r, sx) {                                                    // soleil d'or SANS visage, raccourci par sx
    const ray = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, rr = i % 2 ? r * 1.0 : r * 1.55; ray.push([x + Math.cos(a) * rr * sx, y + Math.sin(a) * rr]); }
    fillPts(ray, ORD); fillPts(ray.map((p) => [x + (p[0] - x) * 0.9, y + (p[1] - y) * 0.9]), OR);
    fillPts(ell(x, y, r * 0.78 * sx, r * 0.78, 16), ORL); strokePts(ell(x, y, r * 0.78 * sx, r * 0.78, 16).concat([[x + r * 0.78 * sx, y]]), ORD, 1.4);
    strokePts(ep(x, y, r * 0.5 * sx, r * 0.5, 10, PI * 1.1, PI * 1.6), 'rgba(255,250,220,0.8)', 1.6);
  }
  function paintRoyal(B, muette) {
    const G = B.G;
    for (let i = 1; i < 12; i++) { const phi = -PI / 2 + i * PI / 12, L = []; for (let k = 0; k <= 30; k++) L.push(B.at(k / 30, phi)); strokePts(L, 'rgba(20,40,70,0.55)', 1.6); }
    if (B.e < 0.4) { hatch(null, 0.7, 4.4, 0.2, 1, P.encre, [-420, -800, 420, 20]); return; }
    const band = (v, w, col, colL) => { const L = [], U = []; for (let k = 0; k <= 24; k++) { const phi = -PI / 2 + k * PI / 24; L.push(B.at(v - w / 2, phi)); U.push(B.at(v + w / 2, phi)); } fillPts(L.concat(U.reverse()), col, 0, 0); if (colL) strokePts(U, colL, 1.4); };
    // draperie basse : bande d'or + festons d'azur foncé frangés d'or
    band(0.17, 0.035, OR, ORL);
    for (let k = 0; k < 8; k++) { const p0 = -PI / 2 + k * PI / 8, p1 = p0 + PI / 8, a = B.at(0.16, p0), b = B.at(0.16, p1), m = B.at(0.07, (p0 + p1) / 2);
      const sw = qbez(a, [m[0], m[1] + 26], b, 10); fillPts([a].concat(sw, [b]), AZD, 0, 0); strokePts(sw, OR, 3); for (let i = 1; i < 10; i += 2) strokePts([sw[i], [sw[i][0], sw[i][1] + 10]], ORL, 1.4); }
    // guirlandes d'or entre les fuseaux
    band(0.45, 0.012, OR);
    for (let k = 0; k < 10; k++) { const p0 = -PI / 2 + k * PI / 10, p1 = p0 + PI / 10, a = B.at(0.45, p0), b = B.at(0.45, p1), m = B.at(0.37, (p0 + p1) / 2);
      const L = qbez(a, m, b, 10); strokePts(L, OR, 4); for (let i = 1; i < 10; i += 2) dot(L[i][0], L[i][1], 3, ORL); dot(a[0], a[1], 5, ORL); }
    // soleils (sans visage)
    for (const phi of [-0.95, -0.32, 0.32, 0.95]) { const p = B.at(0.62, phi); soleil(p[0], p[1], 30, Math.max(0.25, Math.cos(phi))); }
    if (muette) { band(0.3, 0.02, OR, ORL); for (let k = 0; k < 14; k++) { const p = B.at(0.3, -PI / 2 + (k + 0.5) * PI / 14); dot(p[0], p[1], 3.2, AZD); }
      band(0.8, 0.016, OR); for (let k = 0; k < 12; k++) { const p = B.at(0.86, -PI / 2 + (k + 0.5) * PI / 12); fillPts(ell(p[0], p[1], 5, 5, 8), OR); } }
    // calotte d'or
    const cap = []; for (let k = 0; k <= 20; k++) cap.push(B.at(0.92, -PI / 2 + k * PI / 20)); cap.push(B.at(1, 0));
    fillPts(cap, OR, 0, 0); strokePts(cap.slice(0, 21), ORD, 1.6); for (let k = 2; k < 20; k += 3) strokePts([cap[k], B.at(0.995, 0)], ORD, 1);
    hatch(null, 0.7, 4.6, 0.16, 1, P.encre, [-420, -800, 420, 20]);
  }
  function drawBallonArr(o) {
    const type = o.type || 'annonay', B = bGeo(type, o.gonfle), G = B.G, c = cx_(), a = bTilt(o), g = M.tg(o.t || 0);
    c.save(); c.translate(0, B.cy); c.rotate(a); c.translate(0, -B.cy);
    const royal = type !== 'annonay';
    if (type === 'muette') { const gw = G.rc + 140; pc([[-gw, -94], [-gw * 0.6, -106], [0, -110], [gw * 0.6, -106], [gw, -94], [gw - 6, -86], [0, -100], [-gw + 6, -86]], '#7a5a28', () => strokePts([[-gw, -96], [0, -108], [gw, -96]], OSIL, 1.4), 6501); }
    pc(B.out, G.col, () => {
      if (royal) paintRoyal(B, type === 'muette'); else paintAnnonay(B);
      if (B.e < 0.6) for (let i = 0; i < 9; i++) { const x = lerp(-B.r(0.3, -1), B.r(0.3, 1), (i + 0.5) / 9) + B.lean(0.3); strokePts(qbez([x, 0], [x + 30 * Math.sin(i * 2.1), -B.H * 0.5], [x * 0.6 + B.lean(0.9), -B.H * 0.95], 8), `rgba(30,20,10,${0.35 * (1 - B.e)})`, 2); }
      shade(-G.Rm * 1.1, B.cy, G.Rm * 0.9, B.cy, 0.34, [-460, -900, 460, 30]);
      shade(G.Rm * 1.1, B.cy, -G.Rm * 0.2, B.cy, 0.18, [-460, -900, 460, 30]);
      strokePts(ep(B.lean(0.7), -B.h(0.7), G.Rm * 0.62, G.Rm * 0.7, 12, -PI * 0.92, -PI * 0.62), 'rgba(255,255,255,0.28)', 6);
    }, 6502, { texA: 0.55 });
    // col : bande de renfort + ouverture sombre (lueur si feu)
    const rc = G.rc, colc = type === 'annonay' ? '#8a6a40' : OR;
    pc([[-rc - 6, -30], [rc + 6, -30], [rc + 3, 2, 1], [-rc - 3, 2, 1]], colc, () => { strokePts([[-rc - 4, -24], [rc + 4, -24]], type === 'annonay' ? '#5a4426' : ORL, 1.6); if (type === 'annonay') for (let x = -rc; x <= rc; x += 18) strokePts([[x, -28], [x, 0]], '#5a4426', 2.4); }, 6503);
    const fe = clamp(o.feu == null ? (type === 'muette' ? 1 : 0) : o.feu);
    pc(ell(0, 0, rc + 2, 12, 18), '#1c1410', () => { if (fe > 0 && !SIL()) { dot(0, 0, rc * 0.8, `rgba(255,150,60,${0.55 * fe * (0.85 + 0.15 * Math.sin(g * 13))})`); dot(0, -2, rc * 0.4, `rgba(255,220,140,${0.6 * fe})`); } }, 6504, { drop: false });
    // trou roussi (brule)
    const br = clamp(o.brule || 0);
    if (br > 0.02) { const p = B.at(0.46, -0.42), rr = 7 + 13 * br;
      fillPts(boucle(ell(p[0], p[1], rr * 1.9, rr * 1.6, 12), 3, 5), 'rgba(70,40,20,0.75)'); fillPts(boucle(ell(p[0], p[1], rr * 1.2, rr, 12), 2, 4), '#2a1a10'); fillPts(ell(p[0], p[1], rr * 0.6, rr * 0.5, 10), '#0e0806');
      if (!SIL()) dot(p[0] + rr * 0.6, p[1] + rr * 0.3, 3, `rgba(255,140,40,${0.8 * br * (0.6 + 0.4 * Math.sin(g * 17))})`); }
    c.restore();
  }
  function drawBallonAv(o) {
    const type = o.type || 'annonay', B = bGeo(type, o.gonfle), G = B.G, c = cx_(), a = bTilt(o), rc = G.rc;
    c.save(); c.translate(0, B.cy); c.rotate(a); c.translate(0, -B.cy);
    // galerie circulaire d'osier (devant)
    const gw = rc + 140, band = [[-gw, -96], [-gw * 0.7, -90], [0, -86], [gw * 0.7, -90], [gw, -96], [gw - 4, 14, 1], [gw * 0.7, 22], [0, 26], [-gw * 0.7, 22], [-gw + 4, 14, 1]];
    pc(band, OSI, () => { vannerie(-gw, -98, gw, 30, 6510); for (let x = -gw + 30; x < gw; x += 52) fillPts(rect(x - 4, -96, x + 4, 28), OSID);
      fillPts([[-gw, -96], [0, -86], [gw, -96], [gw, -80], [0, -70], [-gw, -80]], AZD); strokePts([[-gw, -80], [0, -70], [gw, -80]], OR, 3); strokePts([[-gw, -94], [0, -84], [gw, -94]], ORL, 1.6);
      shade(-gw, 0, gw, 0, 0.3, [-gw - 4, -110, gw + 4, 40]); }, 6511);
    // réchaud suspendu (chaînes + corbeille de fer + flammes)
    const fe = clamp(o.feu == null ? 1 : o.feu);
    for (const x of [-30, 30]) strokePts([[x * 1.4, 28], [x, 62]], '#2a2622', 2.2);
    pc([[-40, 62], [40, 62], [30, 96, 1], [-30, 96, 1]], '#3b3a38', () => { for (let x = -36; x < 40; x += 12) strokePts([[x, 62], [x * 0.75, 96]], '#1a1918', 1.6); strokePts([[-36, 78], [36, 78]], '#1a1918', 1.6); }, 6512);
    if (fe > 0.02) for (const [dx, sc, sd] of [[-18, 1.3, 1], [0.01, 1.8, 2], [18, 1.2, 3]]) M.flamme(o.t || 0, { x: dx, y: 64, s: sc * fe, r: 110, seed: sd + 40 });
    c.restore();
  }
  // MGF.ballon(x, y, s, o) — (x,y) = centre du col inférieur. o : type 'annonay'|'versailles'|'muette', gonfle 0..1, fumee 0..1, noire 0..1, feu 0..1,
  //   brule 0..1, balance (true ou 0..1, tangage en temps global), incline (rad), dir, t (obligatoire pour les animations), cast,
  //   cordes [[x,y],…] (cordes du col vers des points écran), cage (true ou options de MGF.cage : pendue sous le col), cageS (échelle de la cage, défaut 1),
  //   passagers(P) (muette : appelé entre l'enveloppe et le devant de la galerie ; P.avant / P.arriere = {x, y (pieds), s, rot})
  MGF.ballon = function (x, y, s, o) {
    o = Object.assign({ t: 0 }, o || {}); s = s == null ? 1 : s;
    const type = o.type || 'annonay', map = bMap(x, y, s, o), B = bGeo(type, o.gonfle), G = B.G, g = M.tg(o.t), a = bTilt(o), d = o.dir || 1;
    const pt = (nom) => map(bPtsLocal(type, o.gonfle, nom)), r0 = {};
    if (o.cordes && !SIL()) for (const [i, T] of o.cordes.entries()) { const side = T[0] < x ? 'flancG' : 'flancD', A0 = map([(side === 'flancG' ? -1 : 1) * G.rc * 1.05 * d, -20]), A1 = pt(side);
      strokePts([A1, A0, T], '#5a4630', 2.4 * Math.max(0.6, s)); strokePts([A0, T], 'rgba(220,200,160,0.5)', 0.9); }
    accDraw('ballonArr', drawBallonArr, x, y, s, Object.assign({}, o, { rot: 0 }), 1);
    // fumée épaisse au col (entre et déborde du col)
    const fu = clamp(o.fumee || 0), col = pt('col');
    if (fu > 0.01) { volutes(o.t, { x: col[0], y: col[1] + 70 * s, k: fu, haut: 120 * s, vent: 0, per: 1.8, n: 9, r: 46 * s, larg: G.rc * 1.6 * s, seed: 91, noire: o.noire, a: 0.95 });
      volutes(o.t + 0.7, { x: col[0] - G.rc * 0.9 * s, y: col[1] + 10 * s, k: fu * 0.8, haut: 150 * s, vent: -60 * s, per: 2.6, n: 5, r: 36 * s, seed: 92, noire: o.noire });
      volutes(o.t + 1.3, { x: col[0] + G.rc * 0.9 * s, y: col[1] + 10 * s, k: fu * 0.8, haut: 150 * s, vent: 60 * s, per: 2.9, n: 5, r: 36 * s, seed: 93, noire: o.noire }); }
    // cage pendue sous le col
    if (o.cage) { const cs = (o.cageS || 1) * s, Lc = o.cageCorde || 170, cp = pt('col');
      const co = Object.assign({}, o.cage === true ? {} : o.cage, { pendue: Lc, attache: G.rc * 0.8 * s / cs, t: o.t, dir: d, cast: o.cast });
      MGF.cage(cp[0], cp[1] + cs * (Lc - CAGE.ring), cs, co); r0.cage = [cp[0], cp[1] + cs * (Lc - CAGE.ring)]; }
    const r = { cage: r0.cage, col, haut: pt('haut'), trou: pt('trou'), centre: pt('centre'), flancG: pt('flancG'), flancD: pt('flancD') };
    if (type === 'muette') {
      const sp = 0.62 * s, P_ = { avant: Object.assign({}, { x: 0, y: 0 }), arriere: {} };
      const pa = pt('galerieAvant'), pb = pt('galerieArriere'); P_.avant = { x: pa[0], y: pa[1], s: sp, rot: a * d }; P_.arriere = { x: pb[0], y: pb[1], s: sp, rot: a * d };
      r.places = P_;
      if (o.passagers) o.passagers(P_);
      accDraw('ballonAv', drawBallonAv, x, y, s, Object.assign({}, o, { rot: 0, cast: null }), 1);
    }
    const br = clamp(o.brule || 0); if (br > 0.05) volutes(o.t, { x: r.trou[0], y: r.trou[1] - 6 * s, k: br, haut: 130 * s, vent: -30 * s * d, per: 1.6, n: 6, r: 18 * s, seed: 97, noire: 0.6 });
    return r;
  };

  // ================================================================== LE FOYER (fosse cerclée de pierres, feu de paille, fumée grise → noire)
  function drawFoyer(o) {
    const R = M.rng(71), pa = clamp(o.paille == null ? 1 : o.paille);
    pc([[-112, -8], [112, -8], [104, 4, 1], [-104, 4, 1]], '#2a2420', null, 6601, { drop: false });
    if (pa > 0) for (let i = 0; i < 26; i++) { const x = -90 + R() * 180, a = -1.2 + R() * 2.4; strokePts([[x, -10], [x + Math.sin(a) * 30, -10 - Math.abs(Math.cos(a)) * 22 * pa]], i % 3 ? '#c9a23a' : '#8a6a2a', 2.2); }
    for (let i = 0; i < 9; i++) { const x = -104 + i * 26, w = 15 + R() * 6, h = 20 + R() * 14;
      pc(boucle(ell(x, -h / 2 + 2, w, h / 2 + 2, 10), 1.6, 6), ['#8e8a80', '#a29d90', '#7a766c'][i % 3], () => { strokePts(ep(x, -h / 2, w * 0.6, h * 0.3, 6, PI * 1.1, PI * 1.7), 'rgba(255,255,255,0.3)', 1.4); hatch(null, 0.7, 3.6, 0.2); }, 6610 + i); }
  }
  // MGF.foyer(t, x, y, s, o) — (x,y) = milieu du pied des pierres. o : feu 0..1, fumee 0..1, noire 0..1, haut (px de fumée, 420), paille 0..1, vent
  MGF.foyer = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const fe = clamp(o.feu || 0), fu = clamp(o.fumee || 0), nr = clamp(o.noire || 0);
    if (fe > 0.02) for (const [dx, sc, sd] of [[-60, 1.6, 11], [-24, 2.3, 12], [10, 2.7, 13], [44, 2.1, 14], [76, 1.5, 15]]) M.flamme(t, { x: x + dx * s, y: y - 14 * s, s: sc * s * (0.4 + 0.6 * fe) * (1 - 0.35 * nr), r: 110 * s, seed: sd });
    accDraw('foyer', drawFoyer, x, y, s, { paille: o.paille, cast: o.cast }, 1);
    if (fu > 0.01) { const H = (o.haut || 420) * s;
      volutes(t, { x: x - 10 * s, y: y - 40 * s, k: fu, haut: H, vent: (o.vent == null ? 20 : o.vent) * s, per: 2.2, n: 9, r: (40 + 26 * nr) * s, larg: 120 * s, seed: 81, noire: nr });
      volutes(t + 1.1, { x: x + 20 * s, y: y - 60 * s, k: fu * 0.9, haut: H * 0.8, vent: -16 * s, per: 2.8, n: 6, r: (34 + 20 * nr) * s, larg: 80 * s, seed: 82, noire: nr }); }
  };

  // ================================================================== DÉCORS : outils
  const pcv = (pts, base, paint, seed, o) => pc(pts.map((q) => [q[0], q[1], 1]), base, paint, seed, o);   // architecture : angles vifs
  function speckle(c, x0, y0, w, h, n, seed, col) { const R = M.rng(seed); for (let i = 0; i < n; i++) { c.fillStyle = col.replace('A', (0.02 + R() * 0.035).toFixed(3)); c.beginPath(); c.ellipse(x0 + R() * w, y0 + R() * h, 10 + R() * 50, 6 + R() * 30, R() * 3, 0, TAU); c.fill(); } }
  function degrade(c, w, h, stops) { const g = c.createLinearGradient(0, 0, 0, h); for (const [u, col] of stops) g.addColorStop(u, col); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  function arbreTouffe(x, y, r, col, colD, seed) {                                  // bouquet d'arbre de carton : tronc + boules
    pc(rect(x - r * 0.08, y - r * 0.9, x + r * 0.08, y), '#4a3826', null, seed);
    const R = M.rng(seed), B = [[0, -1.25, 0.62], [-0.45, -0.95, 0.5], [0.45, -0.98, 0.52], [0, -0.7, 0.55]];
    for (const [dx, dy, rr] of B) pc(boucle(ell(x + dx * r, y + dy * r, rr * r * (0.9 + R() * 0.2), rr * r * 0.85, 12), r * 0.05, r * 0.16), col, () => { hatch(null, 0.8, 4, 0.22); shade(x, y - r * 1.8, x, y - r * 0.4, 0.3, [x - r * 1.4, y - r * 2, x + r * 1.4, y]); }, seed + 1);
    strokePts(ep(x - r * 0.15, y - r * 1.3, r * 0.3, r * 0.22, 6, PI * 1.1, PI * 1.7), 'rgba(255,255,230,0.25)', 2);
  }
  function fenetre(x, y, w, h, cadre, vitre, arc) {
    const pts = arc ? [[x, y + h, 1], [x, y + w / 2]].concat(ep(x + w / 2, y + w / 2, w / 2, w / 2, 8, PI, TAU)).concat([[x + w, y + h, 1]]) : rect(x, y, x + w, y + h);
    fillPts(pts.map((p) => [p[0] < x + w / 2 ? p[0] - 4 : p[0] + 4, p[1] < y + h / 2 ? p[1] - 4 : p[1] + 4]), cadre); fillPts(pts, vitre);
    strokePts([[x + w / 2, y + (arc ? w / 2 : 0)], [x + w / 2, y + h]], cadre, 2); for (let yy = y + h * 0.33; yy < y + h; yy += h * 0.33) strokePts([[x, yy], [x + w, yy]], cadre, 1.6);
    strokePts([[x + 3, y + h - 4], [x + w * 0.4, y + h * 0.4]], 'rgba(255,255,255,0.22)', 2);
  }
  // pose d'une bande qui défile (tuile de 2160 px) : u (abscisse dans la bande) → x écran
  const TUILE = 2160;
  const wrapX = (u, off) => { let X = ((u - off) % TUILE + TUILE) % TUILE; if (X > 1620) X -= TUILE; return X; };
  function bande(cv, off, yBas) { const c = cx_(), o = ((off % TUILE) + TUILE) % TUILE; c.drawImage(cv, -o, yBas - cv.height); c.drawImage(cv, TUILE - o, yBas - cv.height); if (o > TUILE - W) c.drawImage(cv, -o + 2 * TUILE, yBas - cv.height); }
  function pigeonVol(x, y, t, sens, s) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(sens * (s || 1), s || 1); const fl = Math.sin(t * 22);
    pc([[-20, -6], [-30, -2], [-34, 3, 1], [-14, 2], [10, 2], [20, -6], [16, -14], [-8, -14]], '#8e9096', null, 7101);
    pc([[14, -12], [24, -20], [30, -16], [32, -13, 1], [22, -8]], '#7a7c84', () => dot(25, -16, 1.4, '#c96a2a'), 7102);
    pc([[-8, -10], [10, -10], [2, -10 - 28 * fl], [-16, -12 - 24 * fl]], '#a0a2a8', null, 7103); c.restore();
  }
  function flammeche(x, y, w, h, col, t, ph) {                                      // oriflamme unie qui ondule (hampe à gauche)
    const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x + u * w, y + Math.sin(t * 4 + u * 5 + ph) * 7 * u]); }
    for (let i = 10; i >= 0; i--) { const u = i / 10; pts.push([x + u * w, y + h * (1 - 0.55 * u) + Math.sin(t * 4 + u * 5 + ph + 0.4) * 7 * u]); }
    pc(pts, col, () => { strokePts(pts.slice(0, 11).map((p) => [p[0], p[1] + h * 0.18]), 'rgba(255,255,255,0.25)', 1.4); hatch(null, 0.5, 4, 0.15, 1, P.encre, [x - 10, y - 20, x + w + 10, y + h + 20]); }, 7201);
  }

  // ================================================================== CIEL DE PARIS (novembre 1783) — MGF.ciel(t, o)
  const CIEL = { far: { y: 1000, v: 0.12 }, seine: { y: 1090, v: 0.3 }, mid: { y: 1330, v: 0.55 }, near: { y: 1400, v: 1 }, cheminees: [], lucarnes: [], pigeonnier: null, reverbere: null };
  MGF.CIEL = CIEL;
  function makeCielSky() {
    return M.pre(W, HB, (c) => {
      degrade(c, W, HB, [[0, '#7f93a6'], [0.35, '#a7b5c0'], [0.62, '#cfd2cc'], [0.82, '#e7dcc2'], [1, '#e2d4b6']]);
      speckle(c, 0, 150, W, HB - 150, 140, 301, 'rgba(255,250,240,A)'); speckle(c, 0, 150, W, HB - 150, 80, 302, 'rgba(70,80,100,A)');
      const g = c.createRadialGradient(830, 470, 10, 830, 470, 220); g.addColorStop(0, 'rgba(255,246,220,0.55)'); g.addColorStop(1, 'rgba(255,246,220,0)'); c.fillStyle = g; c.fillRect(600, 250, 460, 440);
      pc(ell(830, 470, 46, 46, 24), '#f2e6c8', () => shade(810, 450, 860, 500, 0.2, [780, 420, 880, 520]), 303);
      for (let i = 0; i < 7; i++) strokePts([[40 + i * 150, 760 + 40 * Math.sin(i)], [190 + i * 150, 752 + 40 * Math.sin(i + 1)]], 'rgba(255,255,255,0.25)', 3);
    });
  }
  function makeCielFar() { const pc = pcv;
    return M.pre(TUILE, 400, (c) => {
      const by = 400, A = '#aeb4bc', B = '#a2a9b2', Dk = '#959ca6', R = M.rng(311);
      for (let x = 0; x < TUILE;) { const w = 34 + R() * 60, h = 36 + R() * 50; fillPts(rect(x, by - h, Math.min(TUILE, x + w), by), R() < 0.5 ? A : B, 0, 0); fillPts([[x - 2, by - h], [x + w * 0.5, by - h - 18 - R() * 10], [Math.min(TUILE, x + w + 2), by - h]], Dk, 0, 0); for (let wy = by - h + 10; wy < by - 8; wy += 14) for (let wx = x + 6; wx < x + w - 6; wx += 12) fillPts(rect(wx, wy, wx + 4, wy + 6), 'rgba(110,116,128,0.5)', 0, 0); x += w; }
      // Notre-Dame : deux tours carrées, façade, nef et flèche (sans croix)
      const nd = 560;
      pc([[nd + 150, by - 150], [nd + 520, by - 150], [nd + 560, by - 110], [nd + 560, by], [nd + 150, by]], B, () => { for (let x = nd + 170; x < nd + 540; x += 34) { fillPts([[x, by - 110], [x + 12, by - 110], [x + 12, by - 60], [x, by - 60]], Dk); strokePts([[x + 6, by - 150], [x - 14, by - 100]], Dk, 2); } }, 312);
      fillPts([[nd + 168, by - 150], [nd + 520, by - 150], [nd + 500, by - 196], [nd + 190, by - 196]], Dk);
      pc([[nd + 330, by - 196], [nd + 342, by - 196], [nd + 338, by - 330], [nd + 334, by - 330]], Dk, null, 313);
      for (const tx of [nd, nd + 110]) pc(rect(tx, by - 270, tx + 76, by), A, () => { for (let yy = by - 250; yy < by - 120; yy += 64) for (const dx of [14, 46]) fillPts([[tx + dx, yy + 50], [tx + dx, yy + 10], [tx + dx + 8, yy], [tx + dx + 16, yy + 10], [tx + dx + 16, yy + 50]], Dk); fillPts(rect(tx - 4, by - 276, tx + 80, by - 266), Dk); }, 314 + tx);
      pc(rect(nd + 70, by - 196, nd + 116, by), B, () => { fillPts(ell(nd + 93, by - 150, 18, 18, 14), Dk); fillPts(ell(nd + 93, by - 150, 9, 9, 10), A); }, 316);
      pc(rect(nd - 4, by - 120, nd + 190, by), B, () => { for (const dx of [20, 76, 132]) fillPts([[nd + dx, by], [nd + dx, by - 50], [nd + dx + 20, by - 70], [nd + dx + 40, by - 50], [nd + dx + 40, by]], Dk); fillPts(rect(nd - 4, by - 96, nd + 190, by - 88), Dk); }, 317);
      // dômes et clochers
      const dome = (x, w, h, sd) => { pc(rect(x - w * 0.45, by - h, x + w * 0.45, by), A, () => { for (let k = -2; k <= 2; k++) fillPts(rect(x + k * w * 0.16 - 3, by - h + 14, x + k * w * 0.16 + 3, by - h + 44), Dk); }, sd); pc(ep(x, by - h, w * 0.5, w * 0.55, 14, PI, TAU), B, () => { for (let k = -2; k <= 2; k++) strokePts(qbez([x + k * w * 0.2, by - h], [x + k * w * 0.12, by - h - w * 0.4], [x, by - h - w * 0.55], 6), Dk, 1.6); }, sd + 1); pc(rect(x - 8, by - h - w * 0.55 - 30, x + 8, by - h - w * 0.5), A, null, sd + 2); pc([[x - 4, by - h - w * 0.55 - 30], [x + 4, by - h - w * 0.55 - 30], [x, by - h - w * 0.55 - 62]], Dk, null, sd + 3); };
      dome(1460, 120, 170, 320); dome(1880, 90, 120, 324);
      for (const [x, h] of [[220, 210], [290, 210]]) pc(rect(x - 22, by - h, x + 22, by), A, () => { fillPts(ep(x, by - h, 22, 20, 8, PI, TAU), Dk); fillPts(rect(x - 6, by - h + 30, x + 6, by - h + 60), Dk); }, 330 + x);
      for (const [x, h] of [[400, 190], [1240, 200], [2060, 170], [1060, 150]]) { pc(rect(x - 14, by - h, x + 14, by), B, () => fillPts(rect(x - 4, by - h + 14, x + 4, by - h + 36), Dk), 340 + x); pc([[x - 18, by - h], [x + 18, by - h], [x, by - h - 80]], Dk, null, 341 + x); }
      c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(214,214,208,0.25)'; c.fillRect(0, 0, TUILE, by); c.globalCompositeOperation = 'source-over';
    });
  }
  function makeCielSeine() { const pc = pcv;
    return M.pre(TUILE, 170, (c) => {
      pc(rect(-10, 0, TUILE + 10, 40), '#b6ad9c', () => { for (let x = 0; x < TUILE; x += 26) strokePts([[x, 8], [x, 40]], 'rgba(90,80,60,0.25)', 1); strokePts([[0, 6], [TUILE, 6]], 'rgba(255,255,255,0.3)', 2); }, 351, { drop: false });
      fillPts(rect(-10, 40, TUILE + 10, 130), '#8d9ca6', 0, 0);
      for (let i = 0; i < 60; i++) { const x = (i * 97) % TUILE, y = 52 + (i * 37) % 70; strokePts([[x, y], [x + 40, y]], 'rgba(220,230,236,0.35)', 1.6); }
      pc(rect(-10, 130, TUILE + 10, 170), '#a89f8e', () => strokePts([[0, 134], [TUILE, 134]], 'rgba(255,255,255,0.3)', 2), 352, { drop: false });
      // pont de pierre à arches (sept arches)
      pc(rect(240, -6, 1040, 104), '#c2b8a4', () => { strokePts([[240, 4], [1040, 4]], 'rgba(255,255,255,0.35)', 2); fillPts(rect(240, 22, 1040, 28), '#a89e8a'); hatch(null, 0.9, 4.4, 0.18);
        for (let i = 0; i < 7; i++) { const cx0 = 300 + i * 112; fillPts(ep(cx0, 106, 44, 62, 10, PI, TAU), '#7d8c96'); strokePts(ep(cx0, 106, 46, 64, 10, PI, TAU), '#8a8070', 2); fillPts([[cx0 + 52, 28], [cx0 + 60, 28], [cx0 + 64, 104], [cx0 + 48, 104]], '#a89e8a'); } }, 353);
      // bateau-lavoir (barge couverte)
      pc([[1440, 92], [1780, 92], [1760, 116, 1], [1460, 116, 1]], '#4a3a2a', () => strokePts([[1446, 98], [1774, 98]], 'rgba(255,220,180,0.25)', 1.6), 354);
      for (let x = 1470; x <= 1750; x += 56) pc(rect(x - 4, 50, x + 4, 92), '#5b4632', null, 355 + x);
      pc([[1450, 52], [1610, 30], [1770, 52], [1770, 58], [1450, 58]], '#6e5a44', () => { for (let x = 1460; x < 1770; x += 14) strokePts([[x, 54], [x + 4, 36 + Math.abs(x - 1610) * 0.13]], 'rgba(40,30,20,0.35)', 1); }, 356);
      pc(rect(1690, 16, 1702, 40), '#7a4a32', null, 357);
      for (let x = 1480; x < 1750; x += 28) fillPts(rect(x, 64, x + 16, 80), x % 3 ? '#e8e2d2' : '#cfc6b2');
    });
  }
  function makeCielMid() { const pc = pcv;
    CIEL.cheminees = []; CIEL.lucarnes = [];
    return M.pre(TUILE, 340, (c) => {
      const by = 340, R = M.rng(361);
      for (let x = 0; x < TUILE;) {
        const w = 150 + Math.floor(R() * 90), fh = 150 + R() * 60, ry = by - fh, rh = 48 + R() * 20, col = ['#cfc6b2', '#c4b9a2', '#d8cfba', '#bdb29c'][Math.floor(R() * 4)];
        pc(rect(x, ry, Math.min(TUILE, x + w), by), col, () => { for (let wy = ry + 30; wy < by - 10; wy += 46) for (let wx = x + 18; wx < x + w - 24; wx += 34) { fillPts(rect(wx - 3, wy - 3, wx + 17, wy + 31), '#e8e0cc'); fillPts(rect(wx, wy, wx + 14, wy + 28), '#4c5662'); fillPts(rect(wx - 3, wy + 28, wx + 17, wy + 32), '#a89e88'); } strokePts([[x, ry + 8], [x + w, ry + 8]], 'rgba(120,110,90,0.5)', 3); hatch(null, 0.9, 5, 0.12); }, 362 + x);
        pc([[x - 4, ry + 4], [x + 14, ry - rh], [x + w - 14, ry - rh], [Math.min(TUILE + 4, x + w + 4), ry + 4]], '#6e7886', () => { for (let yy = ry - rh + 8; yy < ry; yy += 9) strokePts([[x, yy], [x + w, yy]], 'rgba(40,46,56,0.35)', 1); strokePts([[x + 14, ry - rh + 1], [x + w - 14, ry - rh + 1]], '#9aa2ac', 2.4); }, 363 + x);
        for (let lx = x + 30; lx < x + w - 30; lx += 52) { pc([[lx, ry - 4], [lx, ry - 30], [lx + 12, ry - 40], [lx + 24, ry - 30], [lx + 24, ry - 4]], '#e0d8c4', () => fillPts(rect(lx + 5, ry - 28, lx + 19, ry - 6), '#3c4652'), 364 + lx); CIEL.lucarnes.push([lx + 12, ry - 20]); }
        const cx0 = x + w * (0.25 + R() * 0.5), ch = 34 + R() * 26;
        pc(rect(cx0 - 12, ry - rh - ch, cx0 + 12, ry - rh + 6), '#8a4a32', () => { for (let yy = ry - rh - ch + 6; yy < ry - rh; yy += 7) strokePts([[cx0 - 12, yy], [cx0 + 12, yy]], 'rgba(40,20,10,0.35)', 1); fillPts(rect(cx0 - 15, ry - rh - ch - 4, cx0 + 15, ry - rh - ch + 2), '#6e3a26'); }, 365 + x);
        for (const dx of [-6, 6]) pc(rect(cx0 + dx - 3, ry - rh - ch - 14, cx0 + dx + 3, ry - rh - ch - 2), '#b0603a', null, 366 + x + dx);
        CIEL.cheminees.push([cx0, ry - rh - ch - 14 - 4 + (by === 340 ? 0 : 0), 'mid']);
        x += w + 2;
      }
    });
  }
  function makeCielNear() { const pc = pcv;
    CIEL.near = Object.assign(CIEL.near, { chem: [], luc: [] });
    return M.pre(TUILE, 400, (c) => {
      const by = 400;
      pc([[-10, 210], [TUILE + 10, 210], [TUILE + 10, 352], [-10, 352]], '#5e6876', () => { for (let yy = 220; yy < 350; yy += 11) strokePts([[0, yy], [TUILE, yy]], 'rgba(30,36,46,0.4)', 1.2); for (let x = 0; x < TUILE; x += 23) for (let yy = 214; yy < 350; yy += 22) strokePts([[x + (yy % 44 ? 11 : 0), yy], [x + (yy % 44 ? 11 : 0), yy + 11]], 'rgba(30,36,46,0.3)', 1); hatch(null, 0.6, 5, 0.12); }, 371, { drop: false });
      pc(rect(-10, 200, TUILE + 10, 214), '#9aa2ac', () => strokePts([[0, 203], [TUILE, 203]], 'rgba(255,255,255,0.45)', 2), 372);
      pc(rect(-10, 350, TUILE + 10, by), '#cfc5ae', () => { strokePts([[0, 356], [TUILE, 356]], 'rgba(255,255,255,0.4)', 2); strokePts([[0, 372], [TUILE, 372]], 'rgba(90,80,60,0.45)', 2); for (let x = 0; x < TUILE; x += 30) fillPts(rect(x, 378, x + 14, 392), 'rgba(90,80,60,0.25)'); }, 373);
      // lucarnes à volets (le volet droit est dessiné en direct)
      for (const u of [470, 1620]) { pc([[u - 48, 352], [u - 48, 250], [u, 214], [u + 48, 250], [u + 48, 352]], '#e0d6c0', () => { fillPts(rect(u - 32, 262, u + 32, 344), '#262c34'); strokePts([[u, 262], [u, 344]], '#8a7a60', 2); strokePts([[u - 32, 300], [u + 32, 300]], '#8a7a60', 1.6); }, 374 + u);
        pc([[u - 58, 254], [u, 204], [u + 58, 254], [u + 50, 258], [u, 216], [u - 50, 258]], '#4e5866', null, 375 + u);
        pc(rect(u - 32 - 34, 262, u - 32, 344), '#5a7a5a', () => { for (let y = 268; y < 344; y += 8) strokePts([[u - 64, y], [u - 34, y + 3]], 'rgba(20,30,20,0.5)', 1); }, 376 + u); CIEL.near.luc.push(u); }
      // souches de cheminées à mitres
      for (const u of [170, 780, 1280, 1900]) { pc(rect(u - 44, 70, u + 44, 214), '#8a4a32', () => { for (let yy = 76; yy < 214; yy += 9) for (let x = u - 44 + ((yy / 9) % 2 ? 0 : 10); x < u + 44; x += 20) strokePts([[x, yy], [x, yy + 9]], 'rgba(40,20,10,0.35)', 1); for (let yy = 76; yy < 214; yy += 9) strokePts([[u - 44, yy], [u + 44, yy]], 'rgba(40,20,10,0.3)', 1); shade(u - 44, 0, u + 44, 0, 0.3, [u - 50, 60, u + 50, 220]); }, 377 + u);
        pc(rect(u - 52, 60, u + 52, 74), '#6e3a26', null, 378 + u);
        for (const dx of [-28, 0, 28]) { pc([[u + dx - 8, 60], [u + dx - 6, 30], [u + dx - 10, 22], [u + dx + 10, 22], [u + dx + 6, 30], [u + dx + 8, 60]], '#b0603a', () => strokePts([[u + dx - 4, 54], [u + dx - 4, 30]], 'rgba(255,220,180,0.3)', 1.4), 379 + u + dx); CIEL.near.chem.push([u + dx, 20]); } }
      // pigeonnier sur son mât, girouette en flèche
      pc(rect(1046, 120, 1054, 214), '#4a3826', null, 381);
      pc([[1010, 120], [1090, 120], [1090, 60], [1010, 60]], '#b8a27a', () => { for (const [x, y] of [[1026, 78], [1050, 78], [1074, 78], [1038, 100], [1062, 100]]) { fillPts(ep(x, y, 7, 9, 8, PI, TAU).concat([[x + 7, y + 8], [x - 7, y + 8]]), '#2a2420'); fillPts(rect(x - 10, y + 8, x + 10, y + 11), '#7a6440'); } hatch(null, 1.4, 4, 0.2); }, 382);
      pc([[1000, 62], [1050, 14], [1100, 62]], '#7a3a2a', () => hatch(null, 0.4, 4, 0.2), 383); CIEL.pigeonnier = [1050, 50];
      pc(rect(1405, 30, 1411, 210), '#2a2622', null, 384); pc(ell(1408, 30, 7, 7, 10), '#c9a24a', null, 385);
      pc([[1340, 200], [1476, 200], [1476, 214], [1340, 214]], '#4e5866', null, 386);
    });
  }
  // dessin direct sur une bande qui défile : girouette, volet, corde à linge, réverbère, pigeon
  function cielNearLive(t, g, off, yBas, o) {
    const c = cx_(), y0 = yBas - 400, X = (u) => wrapX(u, off);
    // corde à linge vide (pinces) entre une cheminée et le pigeonnier
    const a = X(824), b = X(1010); if (b > a && a > -300 && a < 1380) { const sw = 4 * Math.sin(g * 1.3); for (const yy of [120, 150]) { const L = qbez([a, y0 + yy], [(a + b) / 2, y0 + yy + 34 + sw], [b, y0 + yy + 6], 14); strokePts(L, '#4a4036', 1.8); for (const i of [3, 6, 9, 12]) fillPts(rect(L[i][0] - 2, L[i][1] - 2, L[i][0] + 2, L[i][1] + 9), '#8a6a44'); } }
    // girouette en flèche qui tourne lentement au vent
    const gx = X(1408); if (gx > -100 && gx < 1180) { const k = Math.cos(0.7 * Math.sin(g * 0.6)); c.save(); c.translate(gx, y0 + 16); c.scale(k, 1);
      pc([[-56, -3], [34, -3], [34, -9], [56, 0], [34, 9], [34, 3], [-56, 3]], '#2a2622', null, 7301); pc([[-60, -12], [-40, -3], [-40, 3], [-60, 12], [-50, 0]], '#2a2622', null, 7302); c.restore(); }
    // volets des lucarnes (o.volet ouvre celui de gauche de la bande, 0..1)
    for (const [i, u] of CIEL.near.luc.entries()) { const lx = X(u); if (lx < -100 || lx > 1180) continue; const k = i === 0 ? ease(clamp(o.volet || 0)) : 0, w = -33 * Math.cos(k * PI);
      if (Math.abs(w) > 2) pc(rect(lx + 32, y0 + 262, lx + 32 + w, y0 + 344).map((p) => [p[0], p[1]]), '#5a7a5a', () => { for (let y = y0 + 268; y < y0 + 344; y += 8) strokePts([[lx + 32, y], [lx + 32 + w, y + 3]], 'rgba(20,30,20,0.5)', 1); }, 7303 + i);
      if (k > 0.3 && !SIL()) dot(lx + 16, y0 + 318, 10, `rgba(255,214,140,${0.5 * k})`); }
    // réverbère à huile suspendu à une potence de la cheminée
    const rx = X(1350); if (rx > -100 && rx < 1180) { const c2 = cx_(), ang = 0.06 * Math.sin(g * 1.1); strokePts([[rx - 26, y0 + 92], [rx + 40, y0 + 92]], '#2a2622', 3);
      c2.save(); c2.translate(rx + 30, y0 + 92); c2.rotate(ang); strokePts([[0, 0], [0, 40]], '#2a2622', 1.6);
      pc([[-12, 40], [12, 40], [16, 52], [12, 76], [-12, 76], [-16, 52]], 'rgba(240,230,190,0.75)', () => { fillPts(rect(-12, 40, 12, 46), '#2a2622'); fillPts(rect(-14, 74, 14, 80), '#2a2622'); }, 7310); c2.restore();
      M.flamme(t, { x: rx + 30 - Math.sin(ang) * 64, y: y0 + 92 + Math.cos(ang) * 68, s: 0.45, r: 40, seed: 77 }); }
    // pigeon qui s'envole du pigeonnier (o.pigeon = instant de départ)
    if (o.pigeon != null) { const u = (t - o.pigeon) / 2.2; const px = X(CIEL.pigeonnier[0]); if (u > -1 && u < 1) { if (u < 0) pigeonVol(px - 20, y0 + 70, 0, -1, 0.9); else pigeonVol(px - 20 - 420 * u, y0 + 70 - 300 * u + 60 * Math.sin(u * 3), t, -1, 0.9); } else if (u <= -1) pigeonVol(px - 20, y0 + 70, 0, -1, 0.9); }
  }
  // o : defile (px de défilement des toits proches ; le fond suit plus lentement), volet 0..1, pigeon (instant), derriere(c) (appelé entre les toits du milieu
  //     et la rampe de toits proches : un ballon qui monte de derrière les toits), nuages (true), corneilles (true)
  MGF.ciel = function (t, o) {
    o = o || {}; const K = MGF.K, c = cx_(), g = M.tg(t), off = o.defile || 0;
    c.drawImage(K.cSky, 0, 0);
    M.hung(K.nuage1, 250, 470, t, { f: 0.6, amp: 0.02 }); M.hung(K.nuage2, 880, 650, t, { f: 0.7, ph: 1, amp: 0.02 });
    if (o.nuages !== false) M.nuages(t, { y0: 330, y1: 700, n: 4, vit: 12 + off * 0, s: 0.9, seed: 31, brume: 0.2 });
    if (o.corneilles !== false) M.oiseaux(g % 11, { x0: 1150, x1: -80, y: 560, t0: 0, dur: 10, n: 4, s: 0.55, seed: 7, col: '#2a2a30', brume: 0.3 });
    bande(K.cFar, off * CIEL.far.v, CIEL.far.y);
    bande(K.cSeine, off * CIEL.seine.v, CIEL.seine.y);
    if (!SIL()) { c.save(); c.globalAlpha = 0.55; for (let i = 0; i < 9; i++) { const x = ((i * 137 + g * 22 - off * CIEL.seine.v) % 1180 + 1180) % 1180 - 50, y = CIEL.seine.y - 125 + (i * 23) % 70; strokePts([[x, y], [x + 26 + 10 * Math.sin(g * 2 + i), y]], 'rgba(240,246,250,0.9)', 1.6); } c.restore(); }
    bande(K.cMid, off * CIEL.mid.v, CIEL.mid.y);
    for (const [i, ch] of CIEL.cheminees.entries()) { const X0 = wrapX(ch[0], off * CIEL.mid.v); if (X0 > -40 && X0 < 1120 && i % 2 === 0) M.fumee(t, { x: X0, y: CIEL.mid.y - 340 + ch[1], s: 0.42, n: 5, haut: 170, vent: -40, a: 0.55, per: 3.8, seed: 40 + i, col: '#d6d2ca' }); }
    if (o.derriere) o.derriere(c);
    bande(K.cNear, off, CIEL.near.y);
    for (const [i, ch] of CIEL.near.chem.entries()) { if (i % 3 !== 1) continue; const X0 = wrapX(ch[0], off); if (X0 > -40 && X0 < 1120) M.fumee(t, { x: X0, y: CIEL.near.y - 400 + ch[1], s: 0.6, n: 6, haut: 260, vent: -60, a: 0.6, per: 3.4, seed: 60 + i, col: '#cfcac0' }); }
    cielNearLive(t, g, off, CIEL.near.y, o);
  };

  // ================================================================== COUR DE LA PAPETERIE D'ANNONAY (juin 1783) — MGF.annonay(t, o)
  const ANN = { roue: { x: 745, y: 1170, r: 128 }, foyer: { x: 540, y: ST.back }, cordes: [[[60, 860], [470, 880]], [[60, 960], [470, 975]]], cheminee: [1035, 690], riviere: 1300, ballon: { x: 540, y: 1290, s: 0.95 } };
  MGF.ANN = ANN;
  function makeAnnFond() {
    return M.pre(W, HB, (c) => {
      degrade(c, W, HB, [[0, '#7fa6c8'], [0.4, '#a9c4d6'], [0.62, '#e3e2c8'], [1, '#d9cfa8']]);
      speckle(c, 0, 150, W, 800, 90, 401, 'rgba(255,255,245,A)');
      const crete = (y0, amp, col, seed, colD) => { const R = M.rng(seed), pts = [[-10, HB]]; for (let x = -10; x <= W + 10; x += 30) pts.push([x, y0 - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + seed)) - R() * 14]); pts.push([W + 10, HB]); pc(pts, col, () => { hatch(null, 0.3, 6, 0.12); for (let i = 0; i < 26; i++) { const x = R() * W, y = y0 - amp * 0.4 + R() * 120; arbreTouffe(x, y, 12 + R() * 8, colD, colD, seed + 10 + i); } }, seed, { drop: false }); };
      crete(820, 120, '#9fb0a8', 411, '#8a9c94'); crete(900, 90, '#8fa486', 412, '#76906e');
      // village et clocher (pyramide, sans croix)
      const vx = 300, vy = 930;
      for (const [x, w, h] of [[vx - 120, 50, 34], [vx - 64, 44, 30], [vx + 40, 56, 38], [vx + 100, 40, 28], [vx + 146, 52, 32]]) { pc(rect(x, vy - h, x + w, vy), '#d8cbb0', () => fillPts(rect(x + w * 0.3, vy - h + 10, x + w * 0.45, vy - h + 20), '#5a5040'), 420 + x); pc([[x - 4, vy - h], [x + w / 2, vy - h - 18], [x + w + 4, vy - h]], '#b8603a', null, 421 + x); }
      pc(rect(vx - 14, vy - 120, vx + 22, vy), '#cfc2a4', () => { fillPts([[vx - 2, vy - 90], [vx - 2, vy - 104], [vx + 4, vy - 110], [vx + 10, vy - 104], [vx + 10, vy - 90]], '#4a4232'); }, 425);
      pc([[vx - 20, vy - 120], [vx + 28, vy - 120], [vx + 4, vy - 182]], '#9a5034', () => hatch(null, 0.4, 4, 0.2), 426); pc(ell(vx + 4, vy - 186, 4, 4, 8), '#8a8270', null, 427);
      for (let i = 0; i < 4; i++) { const y = 990 + i * 26; pc([[-10, y], [W + 10, y - 10], [W + 10, y + 30], [-10, y + 40]], ['#a8b07a', '#b8b884', '#9aa870', '#c0b47e'][i], () => hatch(null, 0.1 + i * 0.3, 5, 0.12), 430 + i, { drop: false }); }
      crete(1060, 50, '#6e8a5a', 413, '#557446');
      M.fillPts(rect(0, HB - 40, W, HB), 'rgba(70,60,30,0.25)', 0, 0);
    });
  }
  function makeAnnMoulin() { const pc = pcv;
    const cv = M.cutFlat(440, 760, 220, 750, () => {                                // moulin à papier de pierre (x écran 760–1080)
      const x0 = -190, x1 = 220, top = -560;
      pc([[x0, 0, 1], [x0, top], [x1, top], [x1, 0, 1]], '#bdb19a', () => { const R = M.rng(441); for (let i = 0; i < 160; i++) { const x = x0 + R() * (x1 - x0), y = top + R() * -top; strokePts(ep(x, y, 10 + R() * 8, 6 + R() * 4, 6, 0, TAU), 'rgba(90,80,60,0.3)', 1); }
        for (const [x, y] of [[-120, -460], [-20, -460], [80, -460], [-120, -320], [80, -320]]) { fillPts(rect(x - 6, y - 6, x + 46, y + 70), '#e0d6c0'); fillPts(rect(x, y, x + 40, y + 64), '#3a3a3c'); fillPts(rect(x - 20, y, x, y + 64), '#5a6a4a'); fillPts(rect(x + 40, y, x + 60, y + 64), '#5a6a4a'); }
        fillPts([[-40, 0], [-40, -150], [0, -186], [40, -150], [40, 0]], '#4a3826'); strokePts([[0, -180], [0, 0]], 'rgba(0,0,0,0.4)', 2); dot(28, -80, 3, LAITD);
        shade(x0, 0, x1, 0, 0.3, [x0 - 10, top - 10, x1 + 10, 10]); }, 442);
      pc([[x0 - 26, top + 10, 1], [15, top - 150, 1], [x1 + 26, top + 10, 1]], '#a8583a', () => { for (let yy = top - 140; yy < top + 10; yy += 12) strokePts([[x0 - 20, yy + 30], [x1 + 20, yy + 30]], 'rgba(60,20,10,0.35)', 1); hatch(null, 0.4, 4, 0.2); }, 443);
      pc(rect(120, top - 170, 150, top - 60), '#9a5a3c', null, 444);
      // bief en bois qui amène l'eau à la roue
      pc([[-300, -470], [x0 + 6, -470], [x0 + 6, -450], [-300, -450]], '#6b4a2a', () => strokePts([[-300, -466], [x0, -466]], 'rgba(150,190,210,0.8)', 3), 445);
      for (const x of [-280, -230]) pc(rect(x - 5, -450, x + 5, -250), '#5b3d22', null, 446 + x);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeAnnSechoir() { const pc = pcv;
    const cv = M.cutFlat(380, 720, 190, 710, () => {                                // séchoir à claire-voie (x écran 40–380)
      pc([[-170, 0, 1], [-170, -520], [170, -520], [170, 0, 1]], '#8a6a44', () => { for (let x = -160; x < 170; x += 14) { fillPts(rect(x, -500, x + 7, -60), '#5b4430'); strokePts([[x + 1, -500], [x + 1, -60]], 'rgba(255,230,190,0.3)', 1); } for (const y of [-520, -300, -60]) fillPts(rect(-170, y, 170, y + 16), '#6b4a2a'); fillPts(rect(-40, -140, 40, 0), '#3a2a1c'); shade(-170, 0, 170, 0, 0.3, [-180, -540, 180, 10]); }, 451);
      pc([[-196, -500, 1], [0, -640, 1], [196, -500, 1]], '#a8583a', () => { for (let yy = -630; yy < -494; yy += 12) strokePts([[-190, yy + 20], [190, yy + 20]], 'rgba(60,20,10,0.35)', 1); }, 452);
      for (let i = 0; i < 5; i++) fillPts(rect(-150 + i * 60, -470, -112 + i * 60, -440), '#ece4cc');                          // feuilles qui sèchent derrière la claire-voie
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeProp(w, h, fn) { const cv = M.cutFlat(w, h, w / 2, h - 10, fn); cv.padB = 10; return M.withShadow(cv, 8); }
  function makeAnnProps() {
    return {
      presse: makeProp(260, 380, () => { for (const x of [-90, 82]) pc(rect(x - 12, -340, x + 12, 0), '#6b4a2a', () => hatch(null, 0.1, 4, 0.2), 461 + x); pc(rect(-110, -350, 110, -310), '#5b3d22', null, 463); pc(rect(-100, -60, 100, -30), '#5b3d22', null, 464);
        pc([[-10, -310], [10, -310], [10, -170], [-10, -170]], '#8a6238', () => { for (let y = -300; y < -170; y += 12) strokePts([[-10, y], [10, y + 8]], 'rgba(40,25,10,0.6)', 2); }, 465);
        pc(rect(-70, -170, 70, -146), '#6b4a2a', null, 466); pc(rect(-120, -186, 120, -176), '#7a5a34', null, 467); pc(rect(-60, -146, 60, -60), '#ece4cc', () => { for (let y = -140; y < -60; y += 6) strokePts([[-60, y], [60, y]], 'rgba(120,110,90,0.5)', 1); }, 468); }),
      cuve: makeProp(240, 200, () => { pc([[-96, -150], [96, -150], [86, 0, 1], [-86, 0, 1]], '#7a5232', () => { for (let x = -88; x < 96; x += 16) strokePts([[x, -150], [x * 0.9, 0]], 'rgba(40,20,10,0.5)', 1.2); for (const y of [-130, -40]) fillPts(rect(-100, y, 100, y + 8), '#3b3a38'); }, 471);
        fillPts(ell(0, -150, 94, 12, 16), '#e6dfcc'); pc([[30, -230], [38, -232], [8, -140], [0, -138]], '#8a6238', null, 472); }),
      rames: makeProp(220, 220, () => { for (let i = 0; i < 6; i++) pc(rect(-80 + (i % 2) * 6, -30 * (i + 1), 80 + (i % 2) * 6, -30 * i - 2), i % 2 ? '#ece4cc' : '#e0d6bc', () => { for (let y = -30 * (i + 1) + 5; y < -30 * i; y += 5) strokePts([[-78, y], [78, y]], 'rgba(130,120,100,0.4)', 1); strokePts([[-80, -30 * i - 14], [84, -30 * i - 14]], '#8a6a44', 2); }, 481 + i); }),
      tonneaux: makeProp(260, 200, () => { for (const [x, sd] of [[-60, 491], [60, 492]]) pc([[x - 44, -150], [x + 44, -150], [x + 52, -75], [x + 44, 0, 1], [x - 44, 0, 1], [x - 52, -75]], '#7a5232', () => { for (const y of [-138, -96, -54, -14]) fillPts(rect(x - 54, y, x + 54, y + 7), '#3b3a38'); for (let k = -36; k <= 36; k += 14) strokePts([[x + k, -150], [x + k * 1.12, -75], [x + k, 0]], 'rgba(40,20,10,0.4)', 1); }, sd); }),
      fagots: makeProp(240, 140, () => { for (let j = 0; j < 3; j++) { const y = -24 - j * 34, x0 = -90 + j * 12; const R = M.rng(500 + j); for (let i = 0; i < 18; i++) strokePts([[x0, y + R() * 26 - 13], [x0 + 170 - j * 20, y + R() * 26 - 13]], ['#6b4a2a', '#8a6238', '#5b3d22'][i % 3], 2.6); strokePts([[x0 + 40, y - 16], [x0 + 40, y + 16]], '#c9a25a', 3); strokePts([[x0 + 120, y - 16], [x0 + 120, y + 16]], '#c9a25a', 3); } }),
      brouette: makeProp(260, 160, () => { pc([[-90, -100], [70, -100], [50, -50], [-80, -50]], '#7a5a34', () => hatch(null, 0.1, 5, 0.2), 511); pc(ribbonW([[-110, -110], [-80, -70], [60, -60], [100, -40]], 8), '#5b3d22', null, 512); pc(ell(80, -30, 30, 30, 16), '#5b3d22', () => { for (let a = 0; a < TAU; a += PI / 4) strokePts([[80, -30], [80 + Math.cos(a) * 26, -30 + Math.sin(a) * 26]], '#3a2a1c', 2); }, 513); pc(rect(-70, -50, -62, 0), '#5b3d22', null, 514); for (let i = 0; i < 4; i++) fillPts(rect(-70 + i * 30, -114 - i % 2 * 6, -44 + i * 30, -100), '#ece4cc'); }),
    };
  }
  function roueAubes(t, x, y, r) {                                                  // roue à aubes qui tourne (temps global)
    const c = cx_(), g = M.tg(t), a = g * 0.7;
    c.save(); c.translate(x, y); c.rotate(a);
    for (let i = 0; i < 12; i++) { const b = i / 12 * TAU, ca = Math.cos(b), sa = Math.sin(b); pc([[ca * 30 - sa * 5, sa * 30 + ca * 5], [ca * r - sa * 5, sa * r + ca * 5], [ca * r + sa * 5, sa * r - ca * 5], [ca * 30 + sa * 5, sa * 30 - ca * 5]], '#6b4a2a', null, 521);
      const p0 = [ca * (r - 6), sa * (r - 6)], tg = [-sa, ca]; pc([[p0[0] - tg[0] * 4, p0[1] - tg[1] * 4, 1], [p0[0] + ca * 34 - tg[0] * 4, p0[1] + sa * 34 - tg[1] * 4, 1], [p0[0] + ca * 34 + tg[0] * 4, p0[1] + sa * 34 + tg[1] * 4, 1], [p0[0] + tg[0] * 4, p0[1] + tg[1] * 4, 1]], '#8a6238', null, 522); }
    for (const rr of [r, r + 28]) { const c2 = cx_(); if (!SIL()) { c2.save(); c2.lineWidth = 10; c2.strokeStyle = '#3a2614'; c2.beginPath(); c2.arc(0, 0, rr - 5, 0, TAU); c2.stroke(); c2.lineWidth = 6; c2.strokeStyle = '#6b4a2a'; c2.stroke(); c2.restore(); } }
    pc(ell(0, 0, 30, 30, 16), '#4a3220', () => { dot(0, 0, 9, '#2a2622'); dot(-3, -3, 3, '#6a6660'); }, 524);
    c.restore();
  }
  // o : foyer (true par défaut), feu 0..1, fumee 0..1, noire 0..1, chat (instant où le chat traverse au fond), feuille (instant où une feuille s'envole)
  MGF.annonay = function (t, o) {
    o = o || {}; const K = MGF.K, c = cx_(), g = M.tg(t), cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    c.drawImage(K.aFond, 0, 0);
    M.nuages(t, { y0: 300, y1: 560, n: 3, vit: 10, s: 0.8, seed: 21 });
    M.hung(K.nuage1, 640, 430, t, { f: 0.5, amp: 0.02 });
    M.oiseaux(g % 9, { x0: -60, x1: 1140, y: 640, t0: 0, dur: 8, n: 5, s: 0.4, seed: 3, col: '#2c2a2e', brume: 0.3 });
    // chat qui traverse sur le muret du fond
    if (o.chat != null) { const u = (t - o.chat) / 4; if (u > 0 && u < 1) chatMarche(lerp(1100, -60, u), 1190, t); }
    M.flat(K.aSechoir, 210, ST.back, { cast });
    M.flat(K.aMoulin, 920, ST.back, { cast });
    M.fumee(t, { x: ANN.cheminee[0], y: ANN.cheminee[1], s: 0.6, n: 6, haut: 260, vent: -40, a: 0.6, per: 3.6, seed: 23 });
    // eau qui tombe du bief + roue + rivière
    if (!SIL()) { c.save(); for (let i = 0; i < 5; i++) { const u = ((g * 1.6 + i / 5) % 1); fillPts(ell(ANN.roue.x - 34 + 5 * Math.sin(i), lerp(935, 1050, u), 8, 14, 8), `rgba(170,205,225,${0.8 * (1 - u)})`); } c.restore(); }
    roueAubes(t, ANN.roue.x, ANN.roue.y, ANN.roue.r);
    pc([[-10, ANN.riviere], [1090, ANN.riviere - 10], [1090, ST.back + 6], [-10, ST.back + 6]], '#7a98a8', () => { for (let i = 0; i < 14; i++) { const x = ((i * 83 + M.tg(t) * 30) % 1180) - 60, y = ANN.riviere + 14 + (i * 29) % 80; strokePts([[x, y], [x + 34, y]], 'rgba(230,240,245,0.6)', 1.6); } }, 531, { drop: false });
    if (!SIL()) for (let i = 0; i < 4; i++) { const u = (g * 0.9 + i * 0.25) % 1; dot(ANN.roue.x + 90 + u * 50, ANN.riviere + 8 - Math.sin(u * PI) * 20, 4 * (1 - u), 'rgba(230,240,248,0.8)'); }
    // cordes et feuilles de papier qui sèchent (elles ondulent)
    for (const [ci, [A0, A1]] of ANN.cordes.entries()) {
      const L = qbez(A0, [(A0[0] + A1[0]) / 2, A0[1] + 30], A1, 16); strokePts(L, '#4a4036', 1.8);
      for (let i = 2; i < 15; i += 2) { const p = L[i], ph = g * 2.4 + i * 0.7 + ci, vol = o.feuille != null && ci === 0 && i === 10 ? clamp((t - o.feuille) / 2.4) : 0;
        if (vol >= 1) continue; const vx = 380 * ease(vol), vy = -260 * vol + 80 * Math.sin(vol * 5), sw = Math.sin(ph) * 0.12 + vol * 3 * Math.sin(t * 6);
        c.save(); c.translate(p[0] + vx, p[1] + vy); c.rotate(sw); pc([[-16, 0, 1], [16, 0, 1], [17, 44 + 3 * Math.sin(ph), 1], [-15, 46, 1]], ci ? '#e6dcc4' : '#ece4cc', () => strokePts([[-14, 6], [14, 6]], 'rgba(140,128,100,0.4)', 1), 540 + i + ci * 20); c.restore(); fillPts(rect(p[0] - 2, p[1] - 3, p[0] + 2, p[1] + 5), '#8a6a44'); }
    }
    for (const x of [470]) pc(rect(x - 6, 840, x + 6, ST.back), '#5b3d22', null, 549);
    // premier plan : presse à vis, rames, cuve, tonneaux, fagots, brouette (sur la ligne du fond)
    M.flat(K.aProps.presse, 110, ST.back, { cast }); M.flat(K.aProps.rames, 250, ST.back, { cast });
    M.flat(K.aProps.fagots, 770, ST.back, { cast }); M.flat(K.aProps.cuve, 880, ST.back, { cast }); M.flat(K.aProps.tonneaux, 1000, ST.back, { cast });
    if (o.foyer !== false) MGF.foyer(t, ANN.foyer.x, ANN.foyer.y, 1, { feu: o.feu, fumee: o.fumee, noire: o.noire, cast });
  };
  // devant (après les marionnettes) : brouette au coin gauche
  MGF.annonayAvant = function (t, o) { M.flat(MGF.K.aProps.brouette, 130, 1600, { cast: { dx: 10, dy: 4, a: 0.25 } }); };
  function chatMarche(x, y, t) {
    const c = cx_(), ph = t * 9; c.save(); c.translate(x, y); c.scale(-1, 1);
    for (const [lx, o_] of [[-22, 0], [-14, PI], [18, PI / 2], [26, PI * 1.5]]) { const a = Math.sin(ph + o_) * 0.35; c.save(); c.translate(lx, -18); c.rotate(a); pc(rect(-2.5, 0, 2.5, 18), '#4a4440', null, 7001); c.restore(); }
    pc(ribbonW(qbez([-30, -26], [-52, -40], [-46, -66 + 4 * Math.sin(t * 3)], 8), 6), '#5a5450', null, 7002);
    pc([[-32, -34], [-10, -38], [20, -36], [32, -30], [30, -18], [-30, -16]], '#5a5450', null, 7003);
    pc([[26, -36], [30, -48, 1], [36, -42], [42, -48, 1], [46, -34], [44, -26], [32, -24]], '#5a5450', () => dot(40, -36, 1.6, '#d8c040'), 7004);
    c.restore();
  }

  // ================================================================== COUR DU CHÂTEAU DE VERSAILLES (19 septembre 1783) — MGF.versailles(t, o)
  const VER = { mats: [[262, 330], [818, 330]], estrade: { x: 540, y: 1250, w: 520 }, ballon: { x: 540, y: 1120, s: 0.85 }, bois: { x: 940, y: 1040 }, fontaine: [960, 1240] };
  MGF.VER = VER;
  function makeVerFond() {
    return M.pre(W, HB, (c) => {
      degrade(c, W, HB, [[0, '#86a8c8'], [0.45, '#b6c9d6'], [0.7, '#e6e0c8'], [1, '#d8ccac']]);
      speckle(c, 0, 150, W, 700, 80, 601, 'rgba(255,255,245,A)');
    });
  }
  function makeVerBois() {                                                           // colline boisée sombre au loin à droite
    return M.pre(W, HB, (c) => {
      const pts = [[700, HB], [700, 1060], [780, 1010], [880, 980], [980, 990], [1090, 1020], [1090, HB]];
      pc(pts, '#5a6e58', () => hatch(null, 0.4, 5, 0.15), 611, { drop: false });
      const R = M.rng(612); for (let i = 0; i < 24; i++) { const x = 720 + R() * 360, y = 1000 + R() * 70 + (x < 800 ? 50 : 0); arbreTouffe(x, y + 30, 22 + R() * 14, i % 2 ? '#2f4434' : '#3a523e', '#2a3a2c', 620 + i); }
    });
  }
  function makeVerChateau() { const pc = pcv;
    return M.pre(W, HB, (c) => {
      const top = 640, base = 1180, x1 = 780, BR = '#9a4a3a', PS = '#e6dfcc', SL = '#5a6470';
      // aile gauche et corps central (brique et pierre), toits d'ardoise à lucarnes et plombs dorés
      pc([[-10, base], [-10, top], [x1, top], [x1, base]], BR, () => {
        for (let y = top; y < base; y += 8) strokePts([[-10, y], [x1, y]], 'rgba(60,20,10,0.25)', 1);
        for (const x of [0, 250, 520, x1 - 30]) fillPts(rect(x, top, x + 30, base), PS);
        fillPts(rect(-10, top, x1, top + 24), PS); fillPts(rect(-10, 930, x1, 946), PS); fillPts(rect(-10, base - 30, x1, base), '#cfc6b0');
        for (const x of [40, 110, 180, 300, 370, 440, 570, 640, 710]) { fenetre(x, 700, 40, 200, PS, '#3e4a58', true); fenetre(x, 970, 40, 170, PS, '#3e4a58', true); }
        hatch(null, 0.9, 5, 0.1); shade(-10, 0, x1, 0, 0.18, [-10, top, x1, base]);
      }, 631, { drop: false });
      pc([[-20, top + 4], [10, top - 110], [x1 - 10, top - 110], [x1 + 20, top + 4]], SL, () => { for (let y = top - 104; y < top; y += 10) strokePts([[-20, y], [x1 + 20, y]], 'rgba(20,26,36,0.4)', 1); strokePts([[10, top - 108], [x1 - 10, top - 108]], '#c9a24a', 4); for (let x = 40; x < x1; x += 70) { fillPts(rect(x - 2, top - 126, x + 2, top - 108), '#c9a24a'); dot(x, top - 128, 4, '#e8c86a'); } }, 632);
      for (const x of [80, 220, 360, 500, 640]) pc([[x - 22, top + 2], [x - 22, top - 54], [x, top - 76], [x + 22, top - 54], [x + 22, top + 2]], PS, () => { fillPts([[x - 12, top - 4], [x - 12, top - 46], [x, top - 58], [x + 12, top - 46], [x + 12, top - 4]], '#3e4a58'); fillPts(ell(x, top - 66, 6, 6, 8), '#c9a24a'); }, 633 + x);
      for (const x of [150, 430, 700]) pc(rect(x - 16, top - 170, x + 16, top - 100), '#e0d8c4', () => fillPts(rect(x - 20, top - 176, x + 20, top - 166), '#cfc6b0'), 638 + x);
      // avant-corps central à balcon doré et colonnes jumelées
      pc(rect(250, top - 30, 520, base), '#a85444', () => { for (const x of [262, 300, 470, 508]) fillPts(rect(x - 7, 700, x + 7, base - 30), PS); fillPts(rect(250, top - 30, 520, top - 4), PS); fenetre(352, 980, 66, 170, PS, '#3e4a58', true); }, 640);
      pc([[240, top - 30], [385, top - 120], [530, top - 30]], PS, () => { fillPts([[270, top - 36], [385, top - 104], [500, top - 36]], '#d8d0bc'); fillPts(ell(385, top - 64, 22, 16, 14), '#c9a24a'); }, 641);
      pc(rect(300, 940, 470, 956), '#2a2622', () => { for (let x = 304; x < 470; x += 10) strokePts([[x, 940], [x, 956]], '#c9a24a', 1.4); }, 642);
      // pavillon d'angle à droite
      pc(rect(x1 - 20, top - 40, x1 + 70, base), PS, () => { fenetre(x1 + 5, 720, 40, 190, '#cfc6b0', '#3e4a58', true); fenetre(x1 + 5, 980, 40, 160, '#cfc6b0', '#3e4a58', true); hatch(null, 0.9, 5, 0.1); }, 643);
      pc([[x1 - 30, top - 36], [x1 + 25, top - 140], [x1 + 80, top - 36]], SL, () => strokePts([[x1 + 25, top - 138], [x1 + 25, top - 160]], '#c9a24a', 3), 644);
      // grille dorée
      pc(rect(-10, 1196, 1090, 1206), '#2a2622', null, 645, { drop: false });
      for (let x = 0; x < W; x += 16) { fillPts(rect(x - 1.6, 1206, x + 1.6, 1296), '#2a2622'); fillPts([[x - 4, 1206], [x, 1192], [x + 4, 1206]], '#c9a24a'); }
      pc(rect(-10, 1280, 1090, 1290), '#2a2622', null, 646, { drop: false });
      for (const x of [140, 940]) pc(rect(x - 20, 1150, x + 20, 1300), PS, () => { fillPts(rect(x - 24, 1150, x + 24, 1160), '#cfc6b0'); }, 647 + x);
      // pavés de la cour
      pc(rect(-10, 1296, 1090, HB + 5), '#b8ad96', () => { for (let y = 1300; y < HB; y += 14) for (let x = (y / 14) % 2 ? 0 : 14; x < W; x += 28) strokePts(ell(x, y + 6, 12, 5, 8).concat([[x + 12, y + 6]]), 'rgba(80,70,50,0.35)', 1); shade(0, 1296, 0, HB, 0.25, [-10, 1290, 1090, HB + 5]); }, 648, { drop: false });
    });
  }
  function makeVerProps() { const pc = pcv;
    const tissu = (pts, col, sd) => pc(pts, col, () => { for (let x = -400; x < 400; x += 18) strokePts([[x, -400], [x + 4, 40]], 'rgba(60,20,10,0.3)', 1.2); hatch(null, 1.2, 4.4, 0.15); }, sd);
    return {
      estrade: makeProp(600, 200, () => { const w = 260;                              // estrade octogonale drapée de toile
        pc([[-w, -120], [-w * 0.55, -150], [w * 0.55, -150], [w, -120], [w, -96], [-w, -96]], '#c9b48a', () => { for (let x = -w; x < w; x += 30) strokePts([[x, -150], [x * 1.05, -96]], 'rgba(90,70,40,0.35)', 1); }, 651);
        tissu([[-w - 4, -100], [-w * 0.55, -110], [w * 0.55, -110], [w + 4, -100], [w, 0, 1], [-w, 0, 1]], '#e8e0cc', 652);
        for (let k = 0; k < 6; k++) { const x0 = -w + k * w / 3, L = qbez([x0, -100], [x0 + w / 6, -60], [x0 + w / 3, -100], 10); strokePts(L, '#c9a24a', 4); fillPts([[x0, -100]].concat(L, [[x0 + w / 3, -100]]), 'rgba(170,40,30,0.75)'); }
        for (const x of [-w * 0.55, -w * 0.18, w * 0.18, w * 0.55]) strokePts([[x, -100], [x * 1.1, 0]], 'rgba(120,110,90,0.5)', 2); }),
      mat: makeProp(80, 1140, () => { pc([[-11, -1080], [11, -1080], [15, 0, 1], [-15, 0, 1]], '#7a5a34', () => { strokePts([[-4, -1070], [-6, -10]], 'rgba(255,230,190,0.35)', 2); hatch(null, 0.1, 6, 0.2); }, 661); pc(rect(-30, -1070, 30, -1058), '#5b3d22', null, 662); for (const x of [-26, 26]) pc(ell(x, -1050, 9, 9, 10), '#3b3a38', () => dot(x, -1050, 3, '#8a8270'), 663 + x); pc(ell(0, -1092, 10, 10, 10), '#c9a24a', null, 665); }),
      tribune: makeProp(320, 420, () => { pc(rect(-140, -220, 140, 0), '#6b4a2a', () => { for (let y = -200; y < 0; y += 40) fillPts(rect(-140, y, 140, y + 8), '#5b3d22'); }, 671);
        tissu([[-150, -400], [150, -400], [150, -360], [-150, -360]], '#8a2a24', 672);
        for (let k = 0; k < 5; k++) { const x0 = -150 + k * 60, L = qbez([x0, -360], [x0 + 30, -320], [x0 + 60, -360], 10); fillPts([[x0, -360]].concat(L, [[x0 + 60, -360]]), '#8a2a24'); strokePts(L, '#c9a24a', 3); for (let i = 1; i < 10; i += 2) strokePts([L[i], [L[i][0], L[i][1] + 10]], '#e8c86a', 1.4); }
        for (const x of [-140, 140]) pc(rect(x - 6, -400, x + 6, -220), '#c9a24a', null, 673 + x);
        tissu([[-150, -220], [150, -220], [150, 0, 1], [-150, 0, 1]], '#9a3028', 675); strokePts([[-150, -216], [150, -216]], '#c9a24a', 5); strokePts([[-150, -200], [150, -200]], '#c9a24a', 2); }),
      oranger: makeProp(220, 360, () => { pc([[-56, -110], [56, -110], [50, 0, 1], [-50, 0, 1]], '#3f5a4a', () => { strokePts([[-50, -100], [50, -100]], '#c9a24a', 2); for (const x of [-30, 0, 30]) strokePts([[x, -104], [x, -6]], 'rgba(20,30,20,0.5)', 1.4); }, 681);
        for (const x of [-56, 56]) pc(ell(x, -112, 7, 7, 8), '#c9a24a', null, 682 + x); pc(rect(-6, -190, 6, -110), '#4a3826', null, 684);
        pc(boucle(ell(0, -250, 84, 74, 22), 6, 12), '#3e5a34', () => { const R = M.rng(685); for (let i = 0; i < 18; i++) dot(-60 + R() * 120, -310 + R() * 120, 6, '#d8862a'); hatch(null, 0.8, 4, 0.2); shade(0, -320, 0, -180, 0.3, [-90, -330, 90, -170]); }, 686); }),
      vase: makeProp(160, 260, () => { pc(rect(-40, -90, 40, 0), '#d8d0bc', () => fillPts(rect(-44, -96, 44, -86), '#cfc6b0'), 691); pc([[-16, -96], [16, -96], [36, -140], [44, -180], [30, -204], [-30, -204], [-44, -180], [-36, -140]], '#e0d8c4', () => { strokePts([[-40, -170], [40, -170]], 'rgba(120,110,90,0.5)', 2); shade(-44, 0, 44, 0, 0.3, [-50, -210, 50, -90]); }, 692); pc([[-34, -204], [34, -204], [26, -216], [-26, -216]], '#cfc6b0', null, 693); }),
      balustrade: makeProp(280, 160, () => { pc(rect(-130, -110, 130, -92), '#d8d0bc', null, 701); pc(rect(-130, -14, 130, 0), '#cfc6b0', null, 702); for (let x = -114; x <= 114; x += 26) pc([[x - 6, -92], [x + 6, -92], [x + 10, -66], [x + 6, -40], [x + 9, -14], [x - 9, -14], [x - 6, -40], [x - 10, -66]], '#e0d8c4', () => shade(x - 10, 0, x + 10, 0, 0.3, [x - 12, -94, x + 12, -12]), 703 + x); }),
      lanterne: makeProp(80, 300, () => { pc(rect(-4, -240, 4, 0), '#2a2622', null, 711); pc([[-16, -280], [16, -280], [20, -262], [14, -236], [-14, -236], [-20, -262]], 'rgba(240,230,190,0.7)', () => { fillPts(rect(-16, -284, 16, -278), '#c9a24a'); fillPts(rect(-16, -240, 16, -234), '#c9a24a'); }, 712); pc([[-10, -284], [0, -300], [10, -284]], '#c9a24a', null, 713); }),
    };
  }
  function paonMarche(x, y, t, sens) {                                               // paon bleu qui traverse (traîne fermée)
    const c = cx_(), ph = t * 7; c.save(); c.translate(x, y); c.scale(sens, 1);
    for (const [lx, o_] of [[-4, 0], [6, PI]]) { const a = Math.sin(ph + o_) * 0.3; c.save(); c.translate(lx, -40); c.rotate(a); pc(rect(-2, 0, 2, 40), '#8a8070', null, 7401); c.restore(); }
    pc([[-20, -50], [-150, -40], [-170, -34], [-150, -28], [-20, -34]], '#3e5a3a', () => { for (let x = -150; x < -30; x += 22) { fillPts(ell(x, -38, 6, 4, 8), '#c9a24a'); dot(x, -38, 2.2, '#2a4a7a'); } }, 7402);
    pc(ell(0, -56, 26, 18, 14), '#2a4a7a', () => hatch(null, 0.6, 3.4, 0.2), 7403);
    pc(ribbonW([[16, -64], [24, -88], [24, -104]], 9), '#2a5a8a', null, 7404);
    pc(ell(26, -108, 8, 7, 10), '#2a5a8a', () => dot(28, -110, 1.4, '#111'), 7405); pc([[32, -108], [40, -106], [32, -104]], '#8a8070', null, 7406);
    for (const dx of [-4, 0, 4]) { strokePts([[24 + dx, -114], [22 + dx * 1.6, -128]], '#2a5a8a', 1); dot(22 + dx * 1.6, -129, 2, '#2a5a8a'); }
    c.restore();
  }
  // o : paon (instant où le paon entre à droite ; il traverse vers la gauche en 5 s), ballonLoin 0..1 (petit ballon bleu qui descend derrière les bois),
  //     estrade (true), mats (true), oriflammes (true), cast
  MGF.versailles = function (t, o) {
    o = o || {}; const K = MGF.K, c = cx_(), g = M.tg(t), cast = o.cast || { dx: 14, dy: 6, a: 0.3 };
    c.drawImage(K.vFond, 0, 0);
    M.nuages(t, { y0: 300, y1: 520, n: 4, vit: 12, s: 0.8, seed: 41 });
    M.hung(K.nuage2, 220, 420, t, { f: 0.6, amp: 0.02 });
    M.oiseaux(g % 10, { x0: 1140, x1: -60, y: 470, t0: 0, dur: 9, n: 4, s: 0.45, seed: 5, col: '#2c2a2e', brume: 0.3 });
    if (o.ballonLoin != null && o.ballonLoin > 0 && o.ballonLoin < 1.02) { const u = clamp(o.ballonLoin), bx = lerp(990, 935, u), by = lerp(760, 1110, ease(u));
      MGF.ballon(bx, by, 0.12, { type: 'versailles', gonfle: 1, t, balance: 1, cage: { mouton: false }, cageS: 1 }); }
    c.drawImage(K.vBois, 0, 0);
    c.drawImage(K.vChateau, 0, 0);
    // oriflammes unies sur le toit
    for (const [i, [x, col]] of [[60, '#2c4a8a'], [385, '#e8e0cc'], [720, '#9a2a24']].entries()) { pc(rect(x - 2, 380, x + 2, 520), '#2a2622', null, 720 + i); flammeche(x + 2, 382, 70, 38, col, g + i, i); }
    // fontaine à jet d'eau (derrière la grille, à droite)
    const F = VER.fontaine; pc([[F[0] - 70, F[1]], [F[0] + 70, F[1]], [F[0] + 60, F[1] + 40, 1], [F[0] - 60, F[1] + 40, 1]], '#d8d0bc', () => fillPts(rect(F[0] - 64, F[1] + 2, F[0] + 64, F[1] + 10), '#7a98a8'), 730);
    if (!SIL()) { const h = 150 + 12 * Math.sin(g * 3.1); c.save(); for (let i = 0; i < 14; i++) { const u = (g * 1.2 + i / 14) % 1, side = i % 2 ? 1 : -1; fillPts(ell(F[0] + side * 34 * u, F[1] - h * 4 * u * (1 - u) * 1.0 - 10, 4, 6, 8), `rgba(200,225,240,${0.85 * (1 - u * 0.6)})`); } strokePts([[F[0], F[1]], [F[0], F[1] - h]], 'rgba(220,236,246,0.85)', 4); c.restore(); }
    // paon qui traverse
    if (o.paon != null) { const u = (t - o.paon) / 5; if (u > 0 && u < 1) paonMarche(lerp(1120, -80, u), 1340, t, -1); }
    M.flat(K.vProps.tribune, 150, ST.back, { cast });
    M.flat(K.vProps.oranger, 950, ST.back, { cast }); M.flat(K.vProps.oranger, 1060, ST.back - 2, { cast, scale: 0.85 });
    if (o.mats !== false) for (const [x] of VER.mats) M.flat(K.vProps.mat, x, ST.back, { cast });
    if (o.oriflammes !== false && o.mats !== false) for (const [i, [x, y]] of VER.mats.entries()) flammeche(x + 4, y - 26, 90, 46, i ? '#9a2a24' : '#2c4a8a', g + i * 1.7, i * 2);
    if (o.estrade !== false) M.flat(K.vProps.estrade, VER.estrade.x, ST.back, { cast });
    for (const x of [300, 780]) { M.flat(K.vProps.lanterne, x + (x < 540 ? 40 : -40), ST.back, { cast }); M.flamme(t, { x: x + (x < 540 ? 40 : -40), y: ST.back - 252, s: 0.5, r: 50, seed: x }); }
  };
  // devant (après les marionnettes) : balustrades et vases aux deux coins
  MGF.versaillesAvant = function (t, o) {
    const K = MGF.K, cast = { dx: 10, dy: 4, a: 0.25 };
    M.flat(K.vProps.balustrade, 60, 1610, { cast }); M.flat(K.vProps.vase, 150, 1530, { cast, scale: 0.8 });
    M.flat(K.vProps.balustrade, 1020, 1610, { cast }); M.flat(K.vProps.vase, 930, 1530, { cast, scale: 0.8 });
  };

  MGF.init = function () {
    MGF.K = {
      cSky: makeCielSky(), cFar: makeCielFar(), cSeine: makeCielSeine(), cMid: makeCielMid(), cNear: makeCielNear(),
      nuage1: M.makeCloud(3, 0.8), nuage2: M.makeCloud(8, 0.65),
      aFond: makeAnnFond(), aMoulin: makeAnnMoulin(), aSechoir: makeAnnSechoir(), aProps: makeAnnProps(),
      vFond: makeVerFond(), vBois: makeVerBois(), vChateau: makeVerChateau(), vProps: makeVerProps(),
    };
    return MGF.K;
  };
})();
