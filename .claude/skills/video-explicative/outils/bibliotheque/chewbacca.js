// persos.js — « Chewbacca, la voix faite de quatre ours et d'un morse » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.chw (alias CHW). Appeler CHW.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
//   MARIONNETTES : CHW.geant / CHW.pilote / CHW.burtt (pose,x,y,s,o) ; animaux (def.libre) CHW.ourson, CHW.ours({robe}), CHW.lion,
//                  CHW.phoque, CHW.blaireau, CHW.morse (pose,x,y,s,o)
//   ACCESSOIRES  : CHW.masque, CHW.pain, CHW.micro, CHW.ciseaux, CHW.bande, CHW.piedMicro (x,y,s,o) ; CHW.pt(r,'nom') ; CHW.accPt
//   DÉCORS       : CHW.plateau(t,up,o), CHW.ferme(t,up,o), CHW.studio(t,up,o) (avant M.drawFloor) ; repères CHW.PLATEAU / FERME / STUDIO
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const CHW = (M.chw = {});
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
  function rrect(x0, y0, x1, y1, r) { return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5)); }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function mixH(a, b, k) { const A = hx(a), B = hx(b); return '#' + A.map((x, i) => Math.round(lerp(x, B[i], clamp(k))).toString(16).padStart(2, '0')).join(''); }
  function mixA(a, b, k, al) { const A = hx(a), B = hx(b); const v = A.map((x, i) => Math.round(lerp(x, B[i], clamp(k)))); return al == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${al})`; }
  // fourrure en mèches découpées : chaque arête du polygone (où amp(x,y) > 0) reçoit des pointes vers l'extérieur
  function poilu(pts, amp, seed, step) {
    step = step || 13; const R = M.rng(seed || 1), out = [];
    let ar = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; ar += a[0] * b[1] - b[0] * a[1]; }
    const sg = ar > 0 ? 1 : -1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      out.push(a[2] ? [a[0], a[1], 1] : [a[0], a[1]]);
      const n = Math.floor(L / step); if (n < 1) continue;
      const nx = sg * (b[1] - a[1]) / L, ny = -sg * (b[0] - a[0]) / L;
      for (let j = 0; j < n; j++) {
        const u = (j + 0.55) / (n + 0.1), x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u);
        const k = typeof amp === 'function' ? amp(x, y) : amp; if (k <= 0.5) continue;
        let dx_ = nx, dy_ = ny + 0.95; const dl = Math.hypot(dx_, dy_) || 1; dx_ /= dl; dy_ /= dl;
        if (dx_ * nx + dy_ * ny < 0.35) { dx_ = nx; dy_ = ny; }
        const l = k * (0.9 + 0.7 * R()), dn = (b[0] - a[0]) / L, dm = (b[1] - a[1]) / L, w = step * 0.42;
        out.push([x - dn * w, y - dm * w]);
        out.push([x + dx_ * l * 0.55 - dn * w * 0.2, y + dy_ * l * 0.55 - dm * w * 0.2]);
        out.push([x + dx_ * l + dn * w * 0.25, y + dy_ * l + dm * w * 0.25, 1]);
        out.push([x + dn * w * 0.6, y + dm * w * 0.6]);
      }
    }
    return out;
  }
  // mèches peintes à l'intérieur (clippées) : petits rubans pointus orientés vers le bas
  function meches(bb, n, seed, col, len, lean, w) {
    if (SIL()) return; const R = M.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = lerp(bb[0], bb[2], R()), y = lerp(bb[1], bb[3], R()), l = (len || 22) * (0.6 + 0.7 * R()), a = (lean || 0) + (R() - 0.5) * 0.5;
      fillPts(ribbon(qbez([x, y], [x + Math.sin(a) * l * 0.5 + 2, y + l * 0.5], [x + Math.sin(a) * l, y + l * Math.cos(a)], 4), w || 5, 0.3), col, 0, 0.2);
    }
  }
  // fourrure douce : longues mèches qui TOMBENT (pointes arrondies, ondulées) sur les arêtes qui ne regardent pas vers le haut
  function crin(pts, amp, seed, step) {
    step = step || 18; const R = M.rng(seed || 1), out = [];
    let ar = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; ar += a[0] * b[1] - b[0] * a[1]; }
    const sg = ar > 0 ? 1 : -1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      out.push(a[2] ? [a[0], a[1], 1] : [a[0], a[1]]);
      const n = Math.floor(L / step); if (n < 1) continue;
      const nx = sg * (b[1] - a[1]) / L, ny = -sg * (b[0] - a[0]) / L; if (ny < -0.3) continue;
      let dx = nx * 0.5, dy = 1; const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
      const tn = (b[0] - a[0]) / L, tm = (b[1] - a[1]) / L;
      for (let j = 0; j < n; j++) {
        const u = (j + 0.5) / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), k = typeof amp === 'function' ? amp(x, y) : amp; if (k <= 0.5) continue;
        const l = k * (0.75 + 0.55 * R()), w = step * 0.5, wv = (R() - 0.5) * 0.5 * l;
        out.push([x - tn * w, y - tm * w]);
        out.push([x + dx * l * 0.55 - dy * wv * 0.4 - tn * w * 0.3, y + dy * l * 0.55 + dx * wv * 0.4 - tm * w * 0.3]);
        out.push([x + dx * l + dy * wv * 0.3, y + dy * l]);
        out.push([x + dx * l * 0.45 + tn * w * 0.35, y + dy * l * 0.45 + tm * w * 0.35]);
      }
    }
    return out;
  }
  // mèches peintes en couches qui se chevauchent (feuilles pointe en bas), plus foncées et plus claires çà et là
  function couches(bb, seed, colD, colL, sz, dens) {
    if (SIL()) return; const R = M.rng(seed); sz = sz || 22;
    for (let y = bb[1], row = 0; y < bb[3]; y += sz * 0.62, row++) for (let x = bb[0] + (row % 2) * sz * 0.4; x < bb[2]; x += sz * 0.78) {
      if (R() > (dens || 1)) continue;
      const l = sz * (1 + R() * 0.9), w = sz * 0.36, wv = (R() - 0.5) * sz * 0.35, r = R();
      const lk = [[x - w, y], [x - w * 0.55 + wv * 0.5, y + l * 0.6], [x + wv, y + l], [x + w * 0.5 + wv * 0.5, y + l * 0.55], [x + w, y]];
      if (r < 0.2) fillPts(lk, colD, 0, 0.3); else if (r < 0.32) fillPts(lk, colL, 0, 0.3);
      strokePts([[x - w, y], [x - w * 0.55 + wv * 0.5, y + l * 0.6], [x + wv, y + l]], 'rgba(40,24,12,0.42)', 1.1);
    }
  }
  CHW.geo = { ep, ell, ribbon, qbez, rrect, rot, tr, scl, mp, box, poilu, meches, mixH, mixA };
  CHW._ = { X, TAU, PI, D, OFFP, cx_, SIL, ep, ell, tr, scl, mp, rot, ribbon, qbez, normA, rrect, pc, box, mixH, mixA, poilu, meches, crin, couches };

  // ------------------------------------------------------------ squelette humain paramétrable (bras et jambes à articulations rondes)
  // G : { SF, SB épaules, LA bras, k échelle de l'avant-bras (poing en [4k, 96k]) }
  function geom(SF, SB, LA, k) { return { SF, SB, LA, k, LB: k * Math.hypot(4, 96), PHI: Math.atan2(-4, 96), FIST: [4 * k, 96 * k] }; }
  function armR(len, wt, wTop, rj) { const R = rj || 11.5; wt = wt || 15; const wT = wTop || wt; return ep(0, 0, wT, wT, 10, PI, TAU).concat([[wT - 1, 22], [wt - 1, 44], [R + 0.5, len - 6]], ep(0, len, R, R, 10, 0, PI), [[-R - 0.5, len - 6], [-wt + 1, 44], [-wT + 1, 22]]); }
  const H_BAS = [[-8, 78], [8, 78], [9, 90], [9, 105], [5, 117], [-2, 119], [-8, 114], [-10, 104], [-10, 94], [-15, 99], [-18, 95], [-12, 86]];
  function handShape(kd) { return kd === 'fist' ? X.HAND_FIST : kd === 'bas' ? H_BAS : X.HAND_OPEN; }
  function foreR(kd, k, rj, w) {
    k = k || 1; const R = rj || 11.5, h = handShape(kd), ww = w || 10;
    return ep(0, 0, R, R, 10, PI, TAU).concat([[ww, 40 * k], [9 * k, 76 * k]], h.slice(2, -1).map((p) => [p[0] * 1.05 * k, p[1] * k]), [[-9 * k, 86 * k], [-10 * k, 76 * k], [-ww - 1, 40 * k]]);
  }
  function handPaintK(kd, k) {
    k = k || 1; const S = (pts) => pts.map((p) => [p[0] * k, p[1] * k]);
    if (kd === 'fist') { strokePts(S([[0, 92], [12, 92]]), 'rgba(60,30,20,0.5)', 1); strokePts(S([[-2, 99], [10, 99]]), 'rgba(60,30,20,0.5)', 1); return; }
    if (kd === 'bas') { strokePts(S([[-1, 100], [-3, 113]]), 'rgba(70,35,20,0.45)', 1); strokePts(S([[3, 100], [3, 112]]), 'rgba(70,35,20,0.45)', 1); return; }
    strokePts(S([[1, 100], [3, 113]]), 'rgba(70,35,20,0.45)', 1); strokePts(S([[-3, 100], [-3, 112]]), 'rgba(70,35,20,0.45)', 1);
    if (kd === 'paume') fillPts(S([[2, 88], [9, 92], [8, 108], [2, 112]]), 'rgba(255,225,200,0.25)');
  }
  // jambes en deux pièces : cuisse (hanche → genou en (0, L1)), tibia (genou → semelle en y = L2, pointe vers +x)
  function thighPts(L1, w) { w = w || 20; return ep(0, 0, w, w, 10, PI, TAU).concat([[w - 1, 30], [w - 3, L1 - 22]], ep(0, L1, 16, 16, 10, 0, PI), [[-w + 2, L1 - 22], [-w - 1, 30]]); }
  function shinPts(L2, toe) { toe = toe || 46; return ep(0, 0, 16, 16, 10, PI, TAU).concat([[15, 40], [13, L2 - 26], [15, L2 - 14], [toe - 8, L2 - 10], [toe, L2 - 2, 1], [toe - 2, L2, 1], [-17, L2, 1], [-19, L2 - 16], [-17, L2 - 40], [-16, 10]]); }
  // IK deux segments dans le repère du torse ; pick 'bas' (coude bas), 'avant', 'arriere' ; le coude ne plie que vers l'avant
  function ik2(G, S, T, pick, retry) {
    const LA = G.LA, LB = G.LB, PHI = G.PHI;
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI, b = normA(cAbs - a);
      const sc = (b > 0.05 ? -1e6 : 0) + (pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1]);
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    if (best.sc < -1e5) return retry ? { a: tv, b: 0, sc: 0 } : ik2(G, S, [Math.max(T[0], S[0] + 12), T[1]], pick, true);
    return best;
  }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function armTo(G, q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(G, arm === 'armF' ? G.SF : G.SB, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const has = (v) => v && v !== 'rien';
  const kk = (q, n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
  // marche : q.marche 0..1 (amplitude) + q.t ; cad = pas/s ; amp = rad de cuisse ; genou plié sur la jambe qui avance
  function marcher(q, cad, amp, bob, libres) {
    const m = q.marche === true ? 1 : clamp(q.marche || 0); if (m <= 0) return;
    const ph = (q.t || 0) * PI * cad, s = Math.sin(ph), A = q.ang;
    A.legF_up = (A.legF_up || 0) - amp * s * m; A.legB_up = (A.legB_up || 0) + amp * s * m;
    A.legF_lo = (A.legF_lo || 0) + 0.45 * Math.max(0, Math.sin(ph + 0.9)) * m;
    A.legB_lo = (A.legB_lo || 0) + 0.45 * Math.max(0, -Math.sin(ph + 0.9)) * m;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * bob * m;
    if (libres.F) A.armF_up = (A.armF_up || 0) + 0.14 * s * m;
    if (libres.B) A.armB_up = (A.armB_up || 0) - 0.14 * s * m;
  }
  // point écran → repère du torse
  function toTorso(def, q, x, y, s, dir, Pt) {
    const T0 = cx_().getTransform();
    const root = T0.translate(x, y).scale(s * (dir || 1), s).rotate((q.tilt || 0) * D).translate(q.dx || 0, def.hipY + (q.dy || 0));
    const pp = new DOMPoint(Pt[0], Pt[1]).matrixTransform(root.inverse()); return [pp.x, pp.y];
  }
  function headPt(HD, q, hx_, hy_) { return mp(new DOMMatrix().translate(HD[0], HD[1]).rotate((q.ang.head || 0) * D), [hx_, hy_]); }

  // =====================================================================
  // OBJETS — registre unique (dessinés à l'échelle 1, repère propre) : seuls (accessoires) ou tenus (pièce 'objet' du poing)
  // =====================================================================
  const OBJ = {};
  CHW.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p, dflt) { return Object.assign({ t: p.t || 0 }, (dflt && dflt[name]) || {}, o || {}); }
  function heldDraw(name, o, p, dflt) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p, dflt), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const ANNEAU = [[-10, -12], [6, -12], [10, -4], [9, 7], [3, 11], [-8, 10], [-12, 2]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed, G, dflt, poilD) {
    const F = G.FIST, kf = G.k, fing = () => scl(DOIGTS, kf);
    const paint = poilD ? () => { doigtsPaint(); meches([-16, -14, 16, 12], 6, seed + 9, poilD, 8, 0, 3); } : doigtsPaint;
    return {
      objet: { parent: 'armF_lo', at: F, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p, dflt); } },
      doigts: { parent: 'armF_lo', at: F, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) && p.tenu !== 'masque0' ? fing() : OFFP), paint },
      objetB: { parent: 'armB_lo', at: F, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p, dflt); } },
      doigtsB: { parent: 'armB_lo', at: F, noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? fing() : OFFP), paint },
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran ; r = retour d'une enveloppe CHW.geant/pilote/burtt
  CHW.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = typeof ob.pts[nom] === 'function' ? ob.pts[nom](oo) : ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };
  function finish(G, q, dflt) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2 && !has(q.tenuB)) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q, dflt), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(G.SF[0], G.SF[1]).rotate((A.armF_up || 0) * D).translate(0, G.LA).rotate((A.armF_lo || 0) * D).translate(G.FIST[0], G.FIST[1]).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(G, G.SB, mp(Hf, ob.p2(oo)), q.pickB || 'bas');
      const w = q.deuxMains === true ? 1 : clamp(q.deuxMains);
      A.armB_up = lerp(A.armB_up || 0, sol.a, w); A.armB_lo = lerp(A.armB_lo || 0, sol.b, w); q.handB = 'fist'; q._deux = w > 0.6;
    }
    return q;
  }
  function run(def, q, x, y, s, o, dflt) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o || {}));
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q, dflt);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q, dflt);
    return r;
  }
  // accessoires seuls : M.puppet à une pièce invisible (ombre portée possible) ; (x,y) = point `base` de l'objet
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(), b = typeof ob.base === 'function' ? ob.base(oo) : ob.base; c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); });
    const r = M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.name = name; r.oo = o; return r;
  }
  CHW.accPt = (r, nom) => { const ob = OBJ[r.name], q = ob && ob.pts && ob.pts[nom]; if (!q) return null; const qq = typeof q === 'function' ? q(r.oo) : q, b = typeof ob.base === 'function' ? ob.base(r.oo) : ob.base; return r.w('o', qq[0] - b[0], qq[1] - b[1]); };
  Object.assign(CHW._, { geom, armR, foreR, handPaintK, thighPts, shinPts, ik2, prep, armTo, blend, has, kk, marcher, toTorso, headPt, OBJ, heldParts, finish, run, acc, accDef, DOIGTS });

  // ---------------- le pain : miche ovale bien bombée, base (milieu du dessous) en (0,0), haut y −92, largeur ±72. croque 0/1/2 (côté +x)
  const PAIN = { croute: '#c58f4a', fonce: '#8f5c2a', clair: '#ecc888', mie: '#efe2c2' };
  const BITES = (cq) => (cq >= 2 ? [[60, -58, 24], [34, -84, 22]] : cq >= 1 ? [[60, -58, 24]] : []);
  function painPts(cq) {
    const out = [];
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, x = Math.cos(a) * 72, y = -46 + Math.sin(a) * 46 * (Math.sin(a) > 0 ? 0.92 : 1); out.push([x, y]); }
    const bites = BITES(cq); if (!bites.length) return out;
    return out.map((p) => { let [x, y] = p; for (const [bx, by, r] of bites) { const d = Math.hypot(x - bx, y - by); if (d < r) { const k = r / (d || 1); x = bx + (x - bx) * k * 0.5 - 8; y = by + (y - by) * k * 0.5 + 4; } } return [x, y]; });
  }
  function drawPain(o) {
    if (o.sens === -1) { const c = cx_(); c.save(); c.scale(-1, 1); drawPain(Object.assign({}, o, { sens: 1 })); c.restore(); return; }
    const cq = o.croque || 0;
    pc(painPts(cq), PAIN.croute, () => {
      fillPts(ep(0, -46, 74, 48, 24, 0.15, PI - 0.15).concat([[-74, -30], [74, -30]].reverse()), PAIN.fonce);          // dessous, croûte plus foncée
      strokePts(ep(0, -40, 70, 34, 20, 0.2, PI - 0.2), 'rgba(250,210,150,0.35)', 1.4);
      shade(-30, -86, 40, -6, 0.38, [-80, -100, 80, 6], '120,60,20');
      fillPts(ell(-14, -72, 38, 13, 16), 'rgba(250,236,215,0.42)', 0, 0.3);                                            // voile de farine
      for (let i = 0; i < 30; i++) dot(-48 + hash(i * 7.3) * 84, -84 + hash(i * 3.1 + 9) * 22, 1.1, 'rgba(255,250,240,0.75)');
      for (const [x0, y0, x1, y1] of [[-46, -50, -26, -80], [-14, -48, 6, -82], [18, -46, 38, -78]]) {                // trois entailles en biais
        fillPts(ribbon(qbez([x0, y0], [(x0 + x1) / 2 + 4, (y0 + y1) / 2], [x1, y1], 6), 3, 9), PAIN.clair, 0, 0.2);
        strokePts(qbez([x0 + 4, y0], [(x0 + x1) / 2 + 8, (y0 + y1) / 2], [x1 + 4, y1], 6), 'rgba(110,60,20,0.65)', 1.3);
      }
      hatch([[-74, -60], [-40, -92], [-40, 0], [-74, 0]], 0.8, 4, 0.16);
      for (const [bx, by, r] of BITES(cq)) { fillPts(ell(bx - 6, by + 3, r * 0.74, r * 0.7, 14), PAIN.mie); for (let i = 0; i < 5; i++) dot(bx - 14 + hash(i + bx) * 14, by - 4 + hash(i * 2 + by) * 14, 1.6, 'rgba(180,150,100,0.6)'); }
    }, 9101);
  }
  OBJ.pain = { draw: drawPain, grip: [0, -6], p2: (o) => [64 * (o.sens || 1), -30], pts: { haut: [0, -92], bord: (o) => [70 * (o.sens || 1), -46], centre: [0, -46] }, base: [0, 0] };
  CHW.pain = (x, y, s, o) => acc('pain', x, y, s, o, 1);

  // ---------------- micro à main (noir et argent) : prise (0,0) au milieu du manche, grille en haut (0,−58), sortie du câble (0, 36)
  function drawMicro(o) {
    pc([[-8, -30], [8, -30], [7, 30], [4, 38, 1], [-4, 38, 1], [-7, 30]], '#1e1e22', () => { strokePts([[-4, -26], [-3, 30]], 'rgba(255,255,255,0.22)', 1.4); for (const y of [-12, 0, 12]) strokePts([[-8, y], [8, y]], 'rgba(0,0,0,0.5)', 1); }, 9111);
    pc([[-11, -34], [11, -34], [8, -28, 1], [-8, -28, 1]], '#9a9a96', null, 9112);
    pc(ell(0, -50, 16, 18, 20), '#c4c4bc', () => {
      for (let x = -16; x < 18; x += 4) strokePts([[x, -70], [x, -30]], 'rgba(40,40,40,0.45)', 0.8);
      for (let y = -68; y < -32; y += 4) strokePts([[-18, y], [18, y]], 'rgba(40,40,40,0.35)', 0.8);
      fillPts(ell(-5, -56, 6, 6, 10), 'rgba(255,255,255,0.35)'); shade(10, -40, -10, -60, 0.3, [-20, -70, 20, -30]);
    }, 9113);
  }
  OBJ.micro = { draw: drawMicro, grip: [0, 2], pts: { tete: [0, -54], bas: [0, 38], haut: [0, -68] }, base: [0, 38] };
  CHW.micro = (x, y, s, o) => acc('micro', x, y, s, o, 0.9);

  // ---------------- ciseaux : prise (0,0) = anneaux, pivot (40,0), lames vers +x jusqu'à (118,0) ; ouvre 0..1
  function drawCiseaux(o) {
    const op = clamp(o.ouvre == null ? 0.2 : o.ouvre) * 0.42;
    const lame = (sg) => rot([[38, -3], [118, sg * 1.5], [112, sg * 5], [40, sg * 6]], -sg * op * 0.5, 40, 0);
    const anneau = (sg) => rot(ep(-2, sg * 9, 15, 11, 16, 0, TAU).slice(0, -1).concat([[24, sg * 4], [42, sg * 2]]), -sg * op * 0.5, 40, 0);
    pc(lame(1), '#c9c9c2', () => strokePts([[44, 2], [112, 3]], 'rgba(255,255,255,0.6)', 1.2), 9121);
    pc(anneau(1), '#2c3a4a', () => fillPts(rot(ell(-2, 9, 8, 5, 12), -op * 0.5, 40, 0), 'rgba(0,0,0,0.85)'), 9122);
    pc(lame(-1), '#d8d8d0', () => strokePts([[44, -2], [112, -3]], 'rgba(255,255,255,0.7)', 1.2), 9123);
    pc(anneau(-1), '#34465a', () => fillPts(rot(ell(-2, -9, 8, 5, 12), op * 0.5, 40, 0), 'rgba(0,0,0,0.85)'), 9124);
    M.rivet(40, 0, 3.2);
  }
  OBJ.ciseaux = { draw: drawCiseaux, grip: [-2, 0], pts: { pointe: [116, 0], pivot: [40, 0], coupe: [70, 0] }, base: [40, 6] };
  CHW.ciseaux = (x, y, s, o) => acc('ciseaux', x, y, s, o, 0.9);

  // ---------------- bout de bande magnétique brune : prise (0,0) au bout haut, pend vers le bas (long px, défaut 96) ; ondule avec t
  function bandeLine(o) { const L = o.long || 96, t = o.t || 0, n = 8, out = []; for (let i = 0; i <= n; i++) { const u = i / n; out.push([Math.sin(u * 3 + t * 2.2) * 6 * u + (o.vent || 0) * u * u, u * L]); } return out; }
  function drawBande(o) {
    pc(ribbon(bandeLine(o), 12, 11), o.couleur || '#6a4426', () => { const l = bandeLine(o); strokePts(l.map((p) => [p[0] - 2, p[1]]), 'rgba(230,190,140,0.35)', 1.2); }, 9131, { texA: 0.3 });
  }
  OBJ.bande = { draw: drawBande, grip: [0, 4], pts: { bas: (o) => bandeLine(o)[8], haut: [0, 0] }, base: (o) => bandeLine(o)[8] };
  CHW.bande = (x, y, s, o) => acc('bande', x, y, s, o, 0.9);
  // ruban de bande entre deux points écran (a → b, mou en px), dessiné en direct
  CHW.ruban = function (a, b, o) {
    o = o || {}; const mou = o.mou == null ? 10 : o.mou, w = o.w || 9;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + mou];
    pc(ribbon(qbez(a, mid, b, 14), w), o.couleur || '#6a4426', () => strokePts(qbez([a[0], a[1] - 2], [mid[0], mid[1] - 2], [b[0], b[1] - 2], 14), 'rgba(230,190,140,0.35)', 1.1), 9141, { texA: 0.3, drop: false });
  };
  Object.assign(CHW._, { drawPain, drawMicro, PAIN });
})();
// ---- partie 2 : le géant velu (+ tête-masque), le pilote, Ben Burtt
(function () {
  'use strict';
  const CHW = M.chw, CH = M.chars, _ = CHW._;
  const { X, TAU, PI, D, OFFP, cx_, SIL, ep, ell, scl, mp, rot, ribbon, qbez, pc, box, poilu, meches, crin, couches, mixA, rrect, tr,
    geom, armR, foreR, handPaintK, thighPts, shinPts, prep, armTo, blend, has, kk, marcher, toTorso, headPt, OBJ, heldParts, finish, run, acc } = _;
  const { fillPts, strokePts, dot, hatch, shade, lerp, clamp, ease, smooth, hash } = M;

  // =====================================================================
  // LE GÉANT VELU — costume de Wookiee porté par Peter Mayhew. Repère : pieds (0,0), hanche y −272, regarde vers +x.
  // =====================================================================
  const GV = { poil: '#7a5634', poilD: '#4e3620', poilL: '#a27445', poilDD: '#3e2a18', peau: '#4a3626', cuir: '#8a5a2c', cuirD: '#6a4320', metal: '#8d8a80', metalD: '#6c6a62',
    oeil: '#6f8492', dent: '#ece2c8', gueule: '#3a1612', langue: '#8a4a44', mPeau: '#e0bf9b', mPeauD: '#c49e7c', mCheveux: '#5b4a3a', mCheveuxL: '#7a6a58' };
  const GG = geom([-2, -168], [-12, -168], 112, 1.17);
  const HD = [8, -196];
  const GV_TORSO = [[-24, -210], [14, -214], [38, -202], [56, -178], [66, -140], [68, -90], [64, -36], [58, 8], [54, 36], [20, 44], [-20, 44], [-58, 40], [-66, 0], [-70, -60], [-72, -124], [-66, -176], [-48, -202]];
  const GV_TORSO_P = crin(GV_TORSO, (x, y) => (y < -190 ? 0 : y > 20 ? 30 : Math.abs(x) > 50 && y > -130 ? 24 : 16), 4101, 20);
  // tête-masque (repère : rivet du cou ; museau vers +x)
  const WK_HEAD = [[-34, 22], [-46, 2], [-54, -30], [-57, -64], [-51, -96], [-36, -118], [-12, -130], [14, -129], [34, -118], [47, -100], [53, -82], [60, -68], [70, -60], [76, -50], [75, -40], [66, -33], [50, -31], [36, -27], [28, -16], [22, 4], [18, 22]];
  const WK_HEAD_P = crin(WK_HEAD, (x, y) => (x < 36 && y > -110 ? 16 : 0), 4111, 17);
  const WK_JAW = [[-6, -20], [36, -22], [46, -10], [47, 0], [40, 12], [20, 18], [2, 16], [-4, 4]];
  const WK_JAW_P = crin(WK_JAW, (x, y) => (y > 6 ? 9 : 0), 4112, 12);
  const WK_JAW_AT = [24, -26];
  function wkHeadPaint(f) {
    const b = f.bouche || 0, sc = f.sourcils || 'n';
    couches([-60, -132, 26, 24], 4121, 'rgba(78,54,32,0.75)', 'rgba(162,116,69,0.8)', 20);
    fillPts([[14, -98], [44, -96], [62, -70], [76, -50], [70, -34], [40, -34], [18, -52], [10, -80]], 'rgba(170,126,80,0.55)');   // visage plus clair
    meches([20, -96, 70, -40], 10, 4123, 'rgba(78,54,32,0.6)', 10, -0.6, 3);
    // œil bleu-gris bienveillant
    const e = f.eyes || 'open';
    if (e === 'closed') strokePts([[18, -79], [27, -76], [36, -79]], GV.poilDD, 2.4);
    else {
      const k = e === 'half' ? 0.5 : e === 'wide' ? 1.25 : 1;
      fillPts(ell(27, -79, 9, 6.5 * k, 14), '#e8dfc8'); dot(28, -79, 4.6 * Math.min(1, k + 0.2), GV.oeil); dot(28.5, -79, 2.2, '#1a1a1e'); dot(30, -81, 1.5, 'rgba(255,255,255,0.95)');
      strokePts(ep(27, -79, 9.5, 6.8 * k, 10, PI * 1.05, PI * 1.95), GV.poilDD, 1.8);
      if (e === 'half') fillPts([[16, -92], [38, -92], [38, -80], [16, -80]], 'rgba(106,74,46,1)');
    }
    // sourcils touffus (mèches)
    const by = sc === 'colere' ? [[10, -94], [24, -92], [40, -84]] : sc === 'doux' ? [[10, -88], [24, -95], [40, -93]] : [[10, -91], [24, -94], [40, -90]];
    fillPts(ribbon(qbez(by[0], by[1], by[2], 6), 8, 3), GV.poilDD, 0, 0.3);
    for (let i = 0; i < 4; i++) { const p = qbez(by[0], by[1], by[2], 3)[i]; strokePts([[p[0], p[1]], [p[0] + 5, p[1] - 8]], GV.poilDD, 2); }
    // truffe et pli du museau
    fillPts([[62, -64], [72, -60], [76, -52], [70, -47], [62, -52]], '#2a1c14'); dot(68, -59, 1.8, 'rgba(255,255,255,0.45)');
    strokePts([[56, -48], [48, -40], [44, -32]], 'rgba(40,26,16,0.6)', 1.4);
    if (b > 0.12) { for (let i = 0; i < 4; i++) { const x = 40 + i * 8; fillPts([[x, -33], [x + 6, -33], [x + 3, -25 - (i === 3 ? 4 : 0)]], GV.dent, 0, 0); } }
    else strokePts([[38, -31], [54, -31], [66, -33]], 'rgba(40,24,14,0.85)', 1.6);
    shade(60, -40, -50, -80, 0.22, [-60, -130, 80, 24]);
  }
  function wkJawPaint(f) {
    fillPts([[-6, -24], [40, -24], [46, -8], [40, -4], [-4, -4]], GV.gueule);
    fillPts([[6, -14], [34, -16], [40, -8], [10, -6]], GV.langue);
    for (let i = 0; i < 4; i++) { const x = 14 + i * 7; fillPts([[x, -4], [x + 5, -4], [x + 2.5, -11 - (i === 3 ? 4 : 0)]], GV.dent, 0, 0); }
    fillPts([[-6, -4], [48, -4], [48, 20], [-6, 20]], GV.poil);
    meches([-4, -4, 44, 20], 8, 4131, GV.poilD, 10, 0, 3);
  }
  function drawWkHeadObj(o) {                                          // tête-masque seule : mâchoire, tête, ouverture du cou
    const c = cx_(), k = o.k || 1;
    c.save(); c.scale(k, k);
    c.save(); c.translate(WK_JAW_AT[0], WK_JAW_AT[1]); c.rotate((o.bouche || 0) * 0.62); pc(WK_JAW_P, GV.poil, () => wkJawPaint(o), 4140); c.restore();
    pc(WK_HEAD_P, GV.poil, () => { wkHeadPaint(Object.assign({ eyes: 'open' }, o)); fillPts(ell(-8, 18, 26, 7, 14), '#1e140c'); }, 4141);
    c.restore();
  }
  // tête-masque tenue : prise avant = nuque, seconde prise = menton (repère de la tête ; o.k = échelle)
  const GN = [-46, -30], GC = [50, -10];
  OBJ.masque = { draw: drawWkHeadObj, grip: (o) => [GC[0] * (o.k || 1), GC[1] * (o.k || 1)], p2: (o) => [GN[0] * (o.k || 1), GN[1] * (o.k || 1)],
    pts: { nuque: (o) => scl([GN], o.k || 1)[0], menton: (o) => scl([GC], o.k || 1)[0], oeil: (o) => [27 * (o.k || 1), -79 * (o.k || 1)], cou: (o) => [-8 * (o.k || 1), 22 * (o.k || 1)] },
    base: (o) => [-8 * (o.k || 1), 24 * (o.k || 1)] };
  CHW.masque = (x, y, s, o) => acc('masque', x, y, s, o, 1);
  // tête de Peter Mayhew (humain, ×1,12 : cheveux bouclés châtain-gris, barbe courte)
  const MY_K = 1.25, MY_HEAD = scl([[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [29, -26], [28, -30], [31, -34], [37, -39, 1], [33, -46], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]], MY_K);
  function myPaint(p) {                                               // dessiné en coordonnées de tête standard, agrandi ×MY_K
    const f = Object.assign({}, p.face), c = cx_();
    if ((p.bouche || 0) > 0.3 && !f.mouth) f.mouth = 'o';
    if (!f.brow) f.brow = p.sourcils === 'colere' ? 'frown' : p.sourcils === 'doux' ? 'worry' : 'n';
    c.save(); c.scale(MY_K, MY_K);
    X.earPaint(-8, -44);
    fillPts([[-12, -34], [2, -26], [12, -20], [24, -18], [30, -12], [27, -1], [14, 8], [0, 11], [-12, 7], [-16, -10]], GV.mCheveux, 3, 0.5);   // barbe courte
    for (let i = 0; i < 22; i++) dot(-10 + hash(i * 3.3) * 38, -26 + hash(i * 7.1) * 32, 1.2, 'rgba(160,140,120,0.55)');
    fillPts([[20, -32], [30, -34], [33, -29], [25, -27], [18, -28]], GV.mCheveux);                                   // moustache
    X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(70,52,40,0.95)', 2.4);
    if (f.mouth === 'o') fillPts([[22, -26], [28, -27], [29, -20], [23, -19]], '#3a1714', 0, 0); else strokePts([[28, -24], [22, -23], [17, -24]], 'rgba(110,40,38,0.95)', 1.5);
    dot(14, -38, 8, 'rgba(205,130,110,0.2)');
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
    c.restore();
  }
  const MY_BOUCLES = (() => {
    const o = []; const n = 20;
    for (let i = 0; i <= n; i++) { const a = -0.9 - i / n * 3.0, r = i % 2 ? 46 : 41; o.push([-4 + Math.cos(a) * r, -58 + Math.sin(a) * r]); }
    o.push([-24, -30], [-20, -52], [-8, -70], [10, -78], [20, -82]);
    return scl(o, MY_K);
  })();
  function myHairPaint() {
    const c = cx_(); c.save(); c.scale(MY_K, MY_K);
    for (let i = 0; i < 26; i++) { const a = -0.9 - hash(i * 2.7) * 3.0, r = 14 + hash(i * 5.1) * 28; const x = -4 + Math.cos(a) * r, y = -58 + Math.sin(a) * r; strokePts(ep(x, y, 4.5, 4, 8, 0, PI * 1.6), 'rgba(40,30,22,0.55)', 1.1); }
    for (let i = 0; i < 12; i++) { const a = -0.9 - hash(i * 9.3) * 3.0, r = 24 + hash(i * 4.4) * 16; strokePts(ep(-4 + Math.cos(a) * r, -58 + Math.sin(a) * r, 3.5, 3.5, 6, PI, TAU), GV.mCheveuxL, 1.1); }
    c.restore();
  }
  // bras et jambes velus (articulations rondes : cercle centré sur le rivet en haut de chaque segment)
  const GV_UP = crin(armR(112, 21, 23, 15), (x, y) => (y > 10 && y < 96 ? 14 : 0), 4151, 18);
  const gvFore = (kd) => crin(foreR(kd, 1.17, 14, 15), (x, y) => (y > 8 && y < 82 ? 22 : 0), 4152, 17);
  const GV_THIGH = crin(thighPts(130, 27), (x, y) => (y > 16 && y < 110 ? 16 : 0), 4153, 18);
  const GV_SHIN = crin(shinPts(142, 58).map((p) => (p[1] > 100 ? [p[0] * 1.15, p[1], p[2]] : p)), (x, y) => (y > 12 && y < 104 ? 14 : 0), 4154, 18);
  function gvForePaint(back) {
    return (p) => {
      const kd = (back ? p.handB : p.handF) || 'fist';
      couches([-26, -8, 26, 86], back ? 4161 : 4162, 'rgba(78,54,32,0.75)', 'rgba(162,116,69,0.7)', 18);
      fillPts([[-30, 88, 1], [30, 88, 1], [30, 150, 1], [-30, 150, 1]], back ? '#3c2a1c' : GV.peau);
      handPaintK(kd, 1.17);
      meches([-14, 86, 14, 110], 5, back ? 4163 : 4164, back ? '#2a1c10' : GV.poilD, 8, 0, 3);
    };
  }
  // bandoulière (pièce du torse dessinée PAR-DESSUS le haut du bras avant pour rester lisible) : épaule avant → hanche arrière
  const B0 = [46, -200], B1 = [-62, 30], bp = (u) => [lerp(B0[0], B1[0], u), lerp(B0[1], B1[1], u)], BANG = Math.atan2(B1[1] - B0[1], B1[0] - B0[0]);
  const BAND = ribbon([B0, bp(0.5), B1], 22);
  function bandPaint() {
    strokePts([[B0[0] + 6, B0[1] + 4], [B1[0] + 6, B1[1] + 4]], 'rgba(255,225,170,0.5)', 1.4);
    strokePts([[B0[0] - 6, B0[1] - 4], [B1[0] - 6, B1[1] - 4]], 'rgba(60,30,10,0.55)', 1.2);
    for (let u = 0.04; u < 1; u += 0.05) { const p = bp(u); dot(p[0] + 7, p[1] + 3, 0.9, 'rgba(60,30,10,0.6)'); }
  }
  function bandBoxes() {
    for (const u of [0.14, 0.4, 0.66, 0.88]) {
      const [x, y] = bp(u);
      pc(rot(box(x - 11, y - 13, x + 11, y + 13), BANG, x, y), GV.metal, () => { strokePts(rot([[x - 8, y - 9], [x + 8, y - 9]], BANG, x, y), 'rgba(255,255,255,0.55)', 1.2); dot(x, y + 3, 1.8, '#5a5850'); }, 4260 + Math.round(u * 100));
    }
  }
  function mkGeant() {
    const torsoPaint = (p) => {
      couches([-80, -214, 72, 50], 4171, 'rgba(78,54,32,0.8)', 'rgba(162,116,69,0.8)', 26);
      shade(58, -80, -62, -80, 0.32, [-70, -215, 70, 50]);
    };
    const legPaint = (back) => () => { couches([-34, -14, 34, 130], back ? 4181 : 4182, 'rgba(78,54,32,0.75)', 'rgba(162,116,69,0.7)', 22); };
    const shinPaint = (back) => () => { couches([-26, -10, 34, 120], back ? 4184 : 4185, 'rgba(78,54,32,0.75)', 'rgba(162,116,69,0.7)', 20); fillPts([[-24, 128], [70, 128], [70, 150], [-24, 150]], back ? '#2e2016' : '#3e2a1c'); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: GV_TORSO_P, base: GV.poil, seed: 4201, paint: torsoPaint },
      legB_up: { parent: 'torso', at: [-8, -4], pts: GV_THIGH, base: '#664629', seed: 4202, noRivet: true, paint: legPaint(true) },
      legB_lo: { parent: 'legB_up', at: [0, 130], pts: GV_SHIN, base: '#664629', seed: 4203, paint: shinPaint(true) },
      legF_up: { parent: 'torso', at: [8, -4], pts: GV_THIGH, base: GV.poil, seed: 4204, paint: legPaint(false) },
      legF_lo: { parent: 'legF_up', at: [0, 130], pts: GV_SHIN, base: GV.poil, seed: 4205, paint: shinPaint(false) },
      armB_up: { parent: 'torso', at: GG.SB, pts: GV_UP, base: '#664629', seed: 4206, paint: () => couches([-26, -14, 26, 112], 4207, 'rgba(62,42,24,0.8)', 'rgba(162,116,69,0.5)', 20) },
      armB_lo: { parent: 'armB_up', at: [0, 112], pts: (p) => gvFore(p.handB || 'fist'), base: '#664629', seed: 4208, paint: gvForePaint(true) },
      jaw: { parent: 'head', at: WK_JAW_AT, pts: (p) => (p.tete === 'otee' ? OFFP : WK_JAW_P), base: GV.poil, seed: 4209, noRivet: true, paint: (p) => wkJawPaint(p) },
      head: { parent: 'torso', at: HD, pts: (p) => (p.tete === 'otee' ? MY_HEAD : WK_HEAD_P), base: (p) => (p.tete === 'otee' ? GV.mPeau : GV.poil), seed: 4210, noRivet: true,
        paint: (p) => (p.tete === 'otee' ? myPaint(p) : wkHeadPaint(Object.assign({ bouche: p.bouche, sourcils: p.sourcils }, p.face))) },
      boucles: { parent: 'head', at: [0, 0], pts: (p) => (p.tete === 'otee' ? MY_BOUCLES : OFFP), base: GV.mCheveux, seed: 4211, noRivet: true, paint: myHairPaint },
      bandou: { parent: 'torso', at: [0, 0], pts: BAND, base: GV.cuir, seed: 4259, noRivet: true, paint: bandPaint, extra: () => bandBoxes() },
      col: { parent: 'torso', at: [0, 0], pts: (p) => (p.tete === 'otee' ? crin([[-40, -196], [-20, -214], [10, -216], [30, -204], [36, -190], [0, -186], [-36, -186]], 10, 4212, 13) : OFFP), base: GV.poil, seed: 4213, noRivet: true,
        paint: () => couches([-42, -220, 40, -180], 4214, 'rgba(78,54,32,0.75)', 'rgba(162,116,69,0.7)', 14) },
      armF_up: { parent: 'torso', at: GG.SF, pts: GV_UP, base: GV.poil, seed: 4215, paint: () => { couches([-26, -14, 26, 112], 4216, 'rgba(78,54,32,0.75)', 'rgba(162,116,69,0.75)', 20); } },
      armF_lo: { parent: 'armF_up', at: [0, 112], pts: (p) => gvFore(p.handF || 'fist'), base: GV.poil, seed: 4218, paint: gvForePaint(false) },
    };
    // le base d'une pièce doit être une couleur : on l'évalue par la pose dans paint
    parts.head.base = GV.poil;
    Object.assign(parts, heldParts(GV.peau, 4230, GG, {}, GV.poilD));
    const order = ['armB_up', 'armB_lo', 'objetB', 'legB_up', 'legB_lo', 'legF_up', 'legF_lo', 'jaw', 'head', 'boucles', 'torso', 'col', 'armF_up', 'bandou', 'armF_lo', 'objet', 'doigts', 'doigtsB'];
    return { hipY: -272, parts, handLen: 117, rod: { part: 'torso', at: [-30, 10] }, nom: 'géant', order };
  }
  CH.chwGeant = mkGeant();
  // la tête de Mayhew a la couleur chair : pièce séparée pour garder un `base` fixe
  CH.chwGeant.parts.head.pts = (p) => (p.tete === 'otee' ? OFFP : WK_HEAD_P);
  CH.chwGeant.parts.mayhew = { parent: 'torso', at: HD, pts: (p) => (p.tete === 'otee' ? MY_HEAD : OFFP), base: GV.mPeau, seed: 4219, noRivet: true, paint: myPaint };
  CH.chwGeant.parts.head.paint = (p) => wkHeadPaint(Object.assign({ bouche: p.bouche, sourcils: p.sourcils }, p.face));
  CH.chwGeant.parts.boucles.parent = 'mayhew';
  CH.chwGeant.order.splice(CH.chwGeant.order.indexOf('boucles'), 0, 'mayhew');
  CH.chwGeant.parts.mayhew.rest = 0;

  // gestes : marche, rugit, geste, mange (+ tenu 'pain'), tendre, ote (tête-masque ôtée : 0 portée → 1 contre la poitrine), bouche, sourcils, tete
  CHW.geantPose = function (p) {
    const q = prep(p), A = q.ang;
    q.tete = q.tete || 'portee';
    if (q.bouche == null) q.bouche = 0;
    const ru = kk(q, 'rugit'), ge = kk(q, 'geste'), ma = kk(q, 'mange'), te = kk(q, 'tendre');
    const ot = clamp(q.ote == null ? 0 : q.ote);
    if (ma > 0 && !has(q.tenu)) q.tenu = 'pain';
    marcher(q, 1.25, 0.24, 7, { F: !has(q.tenu) && !ru && !ge && !ma && !te && !ot, B: !has(q.tenu) && !ru && !ot && !has(q.tenuB) });
    // respiration lente (toujours)
    q.dy = (q.dy || 0) + Math.sin((q.t || 0) * 1.6) * 1.5;
    if (ru > 0) {
      armTo(GG, q, 'armF', [-24, -356], 'bas', ru); armTo(GG, q, 'armB', [46, -350], 'avant', ru);
      q.bouche = Math.max(q.bouche, ru); A.head = (A.head || 0) - 0.14 * ru; if (!q.sourcils) q.sourcils = 'colere';
    }
    if (ge > 0) { blend(q, 'armF_up', -1.5, ge); blend(q, 'armF_lo', -0.12, ge); blend(q, 'armB_up', -0.35, ge); if (ge > 0.4) q.handF = 'open'; A.head = (A.head || 0) - 0.06 * ge; }
    if (ma > 0) {
      const m = headPt(HD, q, 60, -36), T = [m[0] + 62, m[1] + 44];
      armTo(GG, q, 'armF', T, 'bas', ma); q.tenuO = Object.assign({ sens: -1 }, q.tenuO);
      if (q.deuxMains == null) q.deuxMains = ma;
    }
    if (te > 0) { armTo(GG, q, 'armF', q.tenu === 'masque' ? [170, -120] : [130, -120], 'bas', te); if (q.deuxMains == null && q.tenu === 'masque') q.deuxMains = true; if (!has(q.tenu)) q.handF = 'paume'; }
    if (ot > 0) {
      // 0 → 0,25 : les mains vont à la nuque et au menton de la tête portée ; 0,25 → 0,55 : la tête monte ; 0,55 → 1 : vers la poitrine
      const Ow = HD, Ol = [10, -318], Oc = [84, -66];
      if (ot < 0.25) {
        const u = ease(ot / 0.25);
        armTo(GG, q, 'armF', [Ow[0] + GC[0], Ow[1] + GC[1]], 'bas', u); armTo(GG, q, 'armB', [Ow[0] + GN[0], Ow[1] + GN[1]], 'bas', u);
        if (u > 0.85) { q.handF = 'fist'; q.handB = 'fist'; q._deuxSans = true; }
      } else {
        q.tete = 'otee'; q.tenu = 'masque'; q.tenuO = Object.assign({ k: 1 }, q.tenuO, { bouche: 0 });
        let O;
        if (ot < 0.55) { const u = ease((ot - 0.25) / 0.3); O = [lerp(Ow[0], Ol[0], u), lerp(Ow[1], Ol[1], u)]; }
        else { const u = ease((ot - 0.55) / 0.45); O = qbez(Ol, [150, -300], Oc, 20)[Math.round(u * 20)]; }
        armTo(GG, q, 'armF', [O[0] + GC[0], O[1] + GC[1]], 'bas', 1); q.deuxMains = true;
        if (te > 0) { const T = [lerp(O[0], 120, te), lerp(O[1], -110, te)]; armTo(GG, q, 'armF', [T[0] + GC[0], T[1] + GC[1]], 'bas', 1); }
      }
    } else if (q.tenu === 'masque') { q.tenuO = Object.assign({ k: 1 }, q.tenuO); if (!te) armTo(GG, q, 'armF', [84 + GC[0], -66 + GC[1]], 'bas', 1); if (q.deuxMains == null) q.deuxMains = true; }
    if (q.tenu === 'masque' && q.tete !== 'otee') q.tete = 'otee';
    finish(GG, q, {});
    if (q._deuxSans) q._deux = true;
    return q;
  };
  CHW.geant = (pose, x, y, s, o) => { s = s == null ? 1 : s; const q = CHW.geantPose(avecCible(CH.chwGeant, pose, x, y, s, o)); return run(CH.chwGeant, q, x, y, s, o, {}); };
  function avecCible(def, pose, x, y, s, o) { return pose || {}; }

  // =====================================================================
  // SQUELETTE HUMAIN STANDARD (pilote, Burtt) : épaules [-2,-146]/[-10,-146], bras 96, poing [4,96], hanches [±6,-2], cuisse 112, tibia 126
  // =====================================================================
  const GH = geom([-2, -146], [-10, -146], 96, 1);
  const HH = [6, -170];
  const H_TORSO = [[-14, -178], [10, -182], [20, -170], [30, -150], [36, -118], [37, -80], [35, -40], [33, 0], [34, 24, 1], [-36, 26, 1], [-38, 0], [-38, -60], [-40, -110], [-38, -148], [-28, -170]];
  const H_HEAD = [[-14, 16], [11, 16], [12, 2], [18, -5], [25, -10], [29, -16], [28, -22], [30, -26], [29, -30], [32, -34], [38, -40, 1], [34, -47], [30, -56], [30, -64], [27, -78], [15, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const H_THIGH = thighPts(112, 20), H_SHIN = shinPts(126, 46);
  function humanParts(C, seed, skin, skinD, o) {
    const sleeve = (back) => (back ? C.mancheD : C.manche);
    const foreP = (back) => (p) => {
      const kd = (back ? p.handB : p.handF) || 'fist';
      if (o.forePaint) o.forePaint(back, p);
      fillPts([[-40, 76, 1], [40, 76, 1], [40, 140, 1], [-40, 140, 1]], back ? skinD : skin); handPaintK(kd);
      if (o.manchette !== false) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], sleeve(back));
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    };
    return {
      legB_up: { parent: 'torso', at: [-6, -2], pts: H_THIGH, base: C.pantD, seed: seed + 1, noRivet: true, paint: () => { if (o.legPaint) o.legPaint(true, false); hatch(null, 0.8, 3.6, 0.3); } },
      legB_lo: { parent: 'legB_up', at: [0, 112], pts: H_SHIN, base: C.pantD, seed: seed + 2, paint: () => { if (o.legPaint) o.legPaint(true, true); hatch(null, 0.8, 3.6, 0.3); } },
      legF_up: { parent: 'torso', at: [6, -2], pts: H_THIGH, base: C.pant, seed: seed + 3, paint: () => { if (o.legPaint) o.legPaint(false, false); hatch([[-22, -10], [-8, -10], [-8, 120], [-22, 120]], 0.8, 4, 0.22); } },
      legF_lo: { parent: 'legF_up', at: [0, 112], pts: H_SHIN, base: C.pant, seed: seed + 4, paint: () => { if (o.legPaint) o.legPaint(false, true); hatch([[-18, -10], [-6, -10], [-6, 100], [-18, 100]], 0.8, 4, 0.22); } },
      armB_up: { parent: 'torso', at: GH.SB, pts: armR(96, 14), base: C.mancheD, seed: seed + 5, paint: () => { if (o.armPaint) o.armPaint(true); hatch(null, 0.9, 3.8, 0.25); } },
      armB_lo: { parent: 'armB_up', at: [0, 96], pts: (p) => foreR(p.handB || 'fist'), base: C.mancheD, seed: seed + 6, paint: foreP(true) },
      armF_up: { parent: 'torso', at: GH.SF, pts: armR(96, 14), base: C.manche, seed: seed + 7, paint: () => { if (o.armPaint) o.armPaint(false); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.22); } },
      armF_lo: { parent: 'armF_up', at: [0, 96], pts: (p) => foreR(p.handF || 'fist'), base: C.manche, seed: seed + 8, paint: foreP(false) },
    };
  }
  const HORDER = (heads, apres) => ['armB_up', 'armB_lo', 'objetB', 'legB_up', 'legB_lo', 'legF_up', 'legF_lo', 'head'].concat(heads, ['torso'], apres || [], ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);
  function assis(q, k) {
    if (k <= 0) return; const A = q.ang;
    blend(q, 'legF_up', -1.5, k); blend(q, 'legB_up', -1.42, k); blend(q, 'legF_lo', 1.5, k); blend(q, 'legB_lo', 1.42, k);
    q.dy = (q.dy || 0) + 112 * k;
  }
  // tenu par un humain : la tête-masque à l'échelle 1 (le géant est à 1, les humains à 0,9)
  const HDEF = { masque: { k: 1 } };
  function tenirMasque(q, T) { q.tenuO = Object.assign({ k: 1 }, q.tenuO); armTo(GH, q, 'armF', T || [104, -44], 'bas', 1); if (q.deuxMains == null) q.deuxMains = true; }

  // =====================================================================
  // LE PILOTE — 35 ans, cheveux châtains en bataille, chemise ivoire à col montant, gilet noir ouvert, pantalon bleu nuit à bande rouge, bottes noires
  // =====================================================================
  const PI_ = { peau: '#dcb48e', peauD: '#c09672', chem: '#e6dfcc', chemD: '#cfc6b0', gilet: '#24242a', giletL: '#3a3a42', pant: '#2c3448', pantD: '#232a3a', bande: '#8e2a22', botte: '#1c1a1a', botteL: '#3a3634', ceint: '#5e3e24', cheveux: '#6a4a2e', cheveuxD: '#4a321e' };
  const PI_HAIR = [[30, -66], [32, -80], [40, -86, 1], [28, -88], [30, -100, 1], [16, -94], [12, -110, 1], [2, -98], [-8, -112, 1], [-14, -98], [-28, -106, 1], [-28, -92], [-42, -92, 1], [-36, -78], [-46, -70, 1], [-36, -62], [-40, -46, 1], [-30, -42], [-26, -30], [-22, -40], [-18, -58], [-4, -72], [12, -76], [22, -70]];
  function mkPilote() {
    const C = { manche: PI_.chem, mancheD: PI_.chemD, pant: PI_.pant, pantD: PI_.pantD };
    const parts = humanParts(C, 4300, PI_.peau, PI_.peauD, {
      legPaint: (back, lo) => {
        if (!back) fillPts(lo ? [[3, -16], [9, -16], [8, 70], [2, 70]] : [[3, -24], [9, -24], [8, 130], [2, 130]], PI_.bande);
        if (lo) { fillPts([[-40, 56, 1], [60, 56, 1], [60, 140, 1], [-40, 140, 1]], back ? '#141212' : PI_.botte); fillPts([[-22, 56], [18, 56], [18, 62], [-22, 62]], back ? '#201c1c' : PI_.botteL); if (!back) strokePts([[-10, 70], [-8, 112]], 'rgba(255,255,255,0.18)', 2); fillPts([[-40, 120, 1], [60, 120, 1], [60, 140, 1], [-40, 140, 1]], '#0e0c0c'); }
      },
    });
    Object.assign(parts, {
      torso: { parent: null, at: [0, 0], pts: H_TORSO, base: PI_.chem, seed: 4310, paint: () => {
        fillPts([[-40, -170], [-6, -176], [-2, -150], [-4, -100], [-2, -40], [0, 8], [-40, 8]], PI_.gilet);                 // gilet noir (dos et flanc)
        fillPts([[22, -160], [32, -146], [37, -110], [37, -60], [35, -20], [33, 2], [26, 6], [26, -40], [24, -110]], PI_.gilet);   // pan avant, ouvert
        strokePts([[-4, -168], [-2, -100], [0, 4]], 'rgba(120,120,140,0.5)', 1.3); strokePts([[24, -158], [26, -60], [27, 4]], 'rgba(120,120,140,0.5)', 1.3);
        fillPts([[0, -186], [20, -182], [22, -164], [4, -166]], PI_.chemD);                                                    // col montant, sans boutons
        strokePts([[4, -168], [20, -166]], 'rgba(90,80,60,0.5)', 1);
        for (const y of [-120, -80]) strokePts([[2, y], [22, y + 6]], 'rgba(150,140,120,0.45)', 1.1);                         // plis de la chemise
        fillPts([[-40, -4], [37, -6], [37, 6], [-40, 8]], PI_.ceint); dot(30, 0, 2.2, '#8a7a5a');
        fillPts([[-40, 8], [37, 6], [36, 30], [-40, 30]], PI_.pant);
        hatch([[-50, -170], [-6, -170], [-6, 8], [-50, 8]], 0.75, 4.2, 0.3); shade(36, 0, -40, 0, 0.26);
      } },
      head: { parent: 'torso', at: HH, pts: H_HEAD, base: PI_.peau, seed: 4311, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44); fillPts([[-12, -60], [-6, -62], [-6, -36], [-12, -38]], PI_.cheveuxD);                          // favori
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(60,40,26,0.95)', 2.6);
        X.mouth(f, 26, -26); strokePts([[16, -14], [26, -10]], 'rgba(120,80,60,0.3)', 1.2);                                 // menton marqué
        dot(14, -34, 8, 'rgba(205,130,110,0.16)');
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: PI_HAIR, base: PI_.cheveux, seed: 4312, noRivet: true, paint: () => {
        for (let i = 0; i < 9; i++) { const x = -34 + i * 8; strokePts([[x, -64], [x + 3, -88 - (i % 3) * 6]], 'rgba(40,26,14,0.55)', 1.2); }
        strokePts([[20, -78], [30, -92]], 'rgba(200,160,110,0.4)', 1.4); hatch(null, 0.5, 3.2, 0.2);
      } },
    });
    Object.assign(parts, heldParts(PI_.peau, 4320, GH, HDEF));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-24, 16] }, nom: 'pilote', order: HORDER(['cheveux']) };
  }
  CH.chwPilote = mkPilote();
  // gestes : assis (+ cible = mains sur le levier), surpris, oreilles, tend (objet à deux mains), marche
  CHW.pilotePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face;
    const as = kk(q, 'assis'), su = kk(q, 'surpris'), ore = kk(q, 'oreilles'), tn = kk(q, 'tend');
    marcher(q, 1.6, 0.28, 4, { F: !has(q.tenu) && !su && !ore && !tn, B: !has(q.tenuB) && !ore && !tn && !q.deuxMains });
    assis(q, as);
    if (as > 0 && !ore && !su) {
      const L = q.cibleL || [76, -92]; armTo(GH, q, 'armF', L, 'bas', as); armTo(GH, q, 'armB', [L[0] - 8, L[1] + 6], 'bas', as);
    }
    if (su > 0) {
      if (!as) { q.tilt = (q.tilt || 0) - 0.07 * su; q.dx = (q.dx || 0) - 6 * su; }
      A.head = (A.head || 0) - 0.06 * su; if (!f.brow) f.brow = 'up'; if (!f.eyes) f.eyes = 'wide'; if (!f.mouth) f.mouth = 'o';
      if (!ore && !has(q.tenu)) { armTo(GH, q, 'armF', [46, -150], 'bas', su); armTo(GH, q, 'armB', [30, -140], 'bas', su * 0.8); if (su > 0.4) { q.handF = 'paume'; q.handB = 'open'; } }
    }
    if (ore > 0) {
      const e = headPt(HH, q, -10, -38);
      armTo(GH, q, 'armF', [e[0], e[1] + 4], 'avant', ore); armTo(GH, q, 'armB', [e[0] - 2, e[1] + 2], 'avant', ore);
      if (ore > 0.5) { q.handF = 'open'; q.handB = 'open'; if (!f.eyes) f.eyes = 'closed'; if (!f.mouth) f.mouth = 'tight'; if (!f.brow) f.brow = 'worry'; }
      A.head = (A.head || 0) + 0.08 * ore;
    }
    if (tn > 0) {
      if (q.tenu === 'masque') tenirMasque(q, [lerp(104, 130, tn), lerp(-44, -96, tn)]);
      else { armTo(GH, q, 'armF', [128, -118], 'bas', tn); armTo(GH, q, 'armB', [112, -112], 'bas', tn); if (!has(q.tenu)) { q.handF = 'paume'; q.handB = 'paume'; } }
    } else if (q.tenu === 'masque') tenirMasque(q);
    return finish(GH, q, HDEF);
  };
  CHW.pilote = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; let q = CHW.pilotePose(pose); if (pose && pose.cible) { const L = toTorso(CH.chwPilote, q, x, y, s, (o || {}).dir, pose.cible); q = CHW.pilotePose(Object.assign({}, pose, { cibleL: L })); } return run(CH.chwPilote, q, x, y, s, o, HDEF); };

  // =====================================================================
  // BEN BURTT — 28 ans, cheveux bruns mi-longs à raie, lunettes rondes cerclées d'acier, chemise à carreaux vert/ocre, jean délavé, baskets crème ;
  // casque audio (cou | oreilles), magnétophone portable en bandoulière sur la hanche (bobines qui tournent), micro à main + câble spiralé
  // =====================================================================
  const BU = { peau: '#e2c09c', peauD: '#c6a07e', chem: '#5d6b4a', chemD: '#4c583c', ocre: '#b08a48', jean: '#4b6a8c', jeanD: '#3e5874', basket: '#e8dfc6', cheveux: '#4a3322', cheveuxL: '#6a4a32',
    arceau: '#1c1c20', coque: '#6e2430', coqueL: '#8e3a44', mag: '#b8b6ad', magD: '#8e8c84', cuir: '#6a4426', cuirD: '#4e301a' };
  function carreaux(x0, y0, x1, y1, sp, a) {
    for (let x = x0; x < x1; x += sp) fillPts([[x, y0], [x + 3, y0], [x + 3, y1], [x, y1]], `rgba(176,138,72,${a || 0.7})`, 0, 0);
    for (let y = y0; y < y1; y += sp) fillPts([[x0, y], [x1, y], [x1, y + 3], [x0, y + 3]], `rgba(176,138,72,${a || 0.7})`, 0, 0);
    for (let x = x0 + sp / 2; x < x1; x += sp) strokePts([[x, y0], [x, y1]], 'rgba(30,36,24,0.4)', 0.9);
    for (let y = y0 + sp / 2; y < y1; y += sp) strokePts([[x0, y], [x1, y]], 'rgba(30,36,24,0.4)', 0.9);
  }
  const BU_HAIR = [[30, -66, 1], [32, -82], [20, -95], [0, -101], [-20, -97], [-35, -82], [-41, -60], [-42, -36], [-40, -14], [-44, -2, 1], [-34, -8], [-30, 2, 1], [-26, -14], [-22, -34], [-18, -52], [-8, -64], [8, -70], [16, -66, 1], [20, -74]];
  const MAG = { w: 76, h: 50 };
  function drawMagneto(p) {
    const c = cx_(), sp = p.bobines == null ? 2.5 : p.bobines, a = (p.t || 0) * sp;
    pc(rrect(-38, -26, 38, 24, 6), BU.mag, () => {
      fillPts([[-38, 6], [38, 6], [38, 24], [-38, 24]], BU.magD);
      for (const x of [-14, 14]) { fillPts(ell(x, -8, 13, 13, 16), '#2a2a2c'); }
      for (const x of [-30, -22, 22, 30]) dot(x, 14, 2.6, '#3a3a3c');
      strokePts([[-36, -24], [36, -24]], 'rgba(255,255,255,0.5)', 1.4); shade(38, 0, -38, 0, 0.25, [-40, -30, 40, 30]);
    }, 4401);
    for (const [x, ph] of [[-14, 0], [14, 1.3]]) {                                 // deux petites bobines qui tournent
      fillPts(ell(x, -8, 11, 11, 16), '#7a5a3a'); fillPts(ell(x, -8, 5.5, 5.5, 12), '#d8d4c8');
      for (let k = 0; k < 3; k++) { const b = a + ph + k * TAU / 3; fillPts(rot([[x - 1.6, -8 - 9], [x + 1.6, -8 - 9], [x + 1.6, -8 - 5], [x - 1.6, -8 - 5]], b, x, -8), '#d8d4c8', 0, 0); }
      dot(x, -8, 2, '#3a3a3c');
    }
    strokePts([[-14, 3], [14, 3]], '#5a3e26', 2);                                  // la bande entre les bobines
    pc(box(-36, 8, 6, 24), BU.cuir, () => { strokePts([[-34, 12], [4, 12]], 'rgba(255,220,170,0.25)', 1); dot(-15, 16, 2.2, '#b9a06a'); }, 4402);   // sacoche de cuir
    dot(36, -12, 3, '#1a1a1a');                                                     // prise du câble
  }
  function mkBurtt() {
    const C = { manche: BU.chem, mancheD: BU.chemD, pant: BU.jean, pantD: BU.jeanD };
    const parts = humanParts(C, 4410, BU.peau, BU.peauD, {
      armPaint: (back) => carreaux(-20, -20, 20, 110, 12, back ? 0.45 : 0.65),
      forePaint: (back) => carreaux(-16, -12, 16, 66, 12, back ? 0.45 : 0.65),
      legPaint: (back, lo) => {
        strokePts(lo ? [[10, -10], [10, 90]] : [[12, -10], [12, 120]], 'rgba(200,215,230,0.35)', 1.2);
        if (lo) { fillPts([[-40, 100, 1], [60, 100, 1], [60, 140, 1], [-40, 140, 1]], back ? '#cfc6ae' : BU.basket); fillPts([[-40, 119, 1], [60, 119, 1], [60, 140, 1], [-40, 140, 1]], back ? '#a8a08a' : '#f6f2e6'); if (!back) strokePts([[-4, 104], [30, 112]], 'rgba(120,110,90,0.6)', 1.2); }
      },
    });
    Object.assign(parts, {
      torso: { parent: null, at: [0, 0], pts: H_TORSO, base: BU.chem, seed: 4420, paint: (p) => {
        carreaux(-40, -186, 40, 10, 14, 0.7);
        fillPts([[4, -186], [22, -178], [16, -160], [2, -168]], BU.chemD); strokePts([[20, -164], [26, -120], [27, -40], [30, 6]], 'rgba(30,36,24,0.6)', 1.2);
        for (const y of [-140, -100, -60, -20]) dot(27, y, 2, '#d8d0b8');
        fillPts([[-40, 0], [36, -2], [36, 30], [-40, 30]], BU.jean); fillPts([[-40, -4], [36, -6], [36, 3], [-40, 5]], '#3a2a1a');
        // sangle du magnétophone : de l'épaule avant à la hanche arrière
        fillPts(ribbon([[10, -178], [-6, -110], [-24, -30], [-30, 0]], 9), BU.cuirD); strokePts([[13, -178], [-3, -110], [-21, -30]], 'rgba(255,220,170,0.25)', 1);
        hatch([[-50, -170], [-12, -170], [-10, 30], [-50, 30]], 0.75, 4.2, 0.28); shade(36, 0, -40, 0, 0.26);
      } },
      head: { parent: 'torso', at: HH, pts: H_HEAD, base: BU.peau, seed: 4421, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(60,40,26,0.95)', 2.2); X.mouth(f, 26, -26);
        dot(14, -34, 8, 'rgba(205,130,110,0.18)');
        const ring = ep(18, -52, 9.5, 9.5, 16, 0, TAU);                                    // lunettes rondes cerclées d'acier
        fillPts(ring, 'rgba(190,225,240,0.25)', 0, 0); strokePts(ring, '#8a8e94', 1.7, true); strokePts([[8, -53], [-14, -50]], '#8a8e94', 1.4);
        strokePts([[13, -57], [18, -59]], 'rgba(255,255,255,0.7)', 1.2);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: BU_HAIR, base: BU.cheveux, seed: 4422, noRivet: true, paint: () => {
        strokePts([[6, -98], [-2, -80], [-14, -70]], 'rgba(20,12,6,0.6)', 1.4);                // raie
        for (let i = 0; i < 7; i++) { const x = -32 + i * 7; strokePts([[x + 6, -86], [x, -50], [x - 2, -16]], 'rgba(30,20,10,0.45)', 1.1); }
        strokePts([[10, -86], [24, -78]], 'rgba(170,130,90,0.4)', 1.3);
      } },
      // casque : arceau sur la tête + coquille sur l'oreille (oreilles) | autour du cou (cou)
      casqueT: { parent: 'head', at: [0, 0], pts: (p) => (p.casque === 'oreilles' ? ribbon(qbez([-8, -46], [-14, -112], [8, -102], 10), 7) : OFFP), base: BU.arceau, seed: 4423, noRivet: true },
      coqueT: { parent: 'head', at: [-8, -44], pts: (p) => (p.casque === 'oreilles' ? ell(0, 0, 14, 17, 16) : OFFP), base: BU.coque, seed: 4424, noRivet: true, paint: () => { fillPts(ell(2, 0, 9, 12, 14), BU.coqueL); strokePts(ep(0, 0, 13, 16, 12, PI * 1.1, PI * 1.6), 'rgba(255,255,255,0.35)', 1.4); } },
      casqueC: { parent: 'torso', at: [0, 0], pts: (p) => (p.casque === 'oreilles' ? OFFP : ribbon(qbez([-24, -180], [-6, -192], [12, -176], 10), 6)), base: BU.arceau, seed: 4425, noRivet: true },
      coqueC: { parent: 'torso', at: [12, -174], pts: (p) => (p.casque === 'oreilles' ? OFFP : ell(0, 0, 11, 14, 14)), base: BU.coque, seed: 4426, noRivet: true, paint: () => fillPts(ell(2, 0, 7, 10, 12), BU.coqueL) },
      magneto: { parent: 'torso', at: [2, -10], noRivet: true, base: '#000', seed: 4427, pts: OFFP, extra: (p) => drawMagneto(p) },
    });
    Object.assign(parts, heldParts(BU.peau, 4430, GH, HDEF));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-24, 16] }, nom: 'Burtt', order: HORDER(['cheveux', 'casqueT', 'coqueT'], ['casqueC', 'coqueC', 'magneto']) };
  }
  CH.chwBurtt = mkBurtt();
  // gestes : marche, tend_micro (+ visee rad), ecoute, brandit_pain, coupe, colle, appuie (+ cible écran) ; micro 0/1 ; casque ; bobines ; tenu
  CHW.burttPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face;
    q.casque = q.casque || 'cou';
    const tm = kk(q, 'tend_micro'), ec = kk(q, 'ecoute'), bp = kk(q, 'brandit_pain'), cp = clamp(q.coupe === true ? 1 : q.coupe || 0), co = kk(q, 'colle'), ap = kk(q, 'appuie');
    if (ec > 0) q.casque = 'oreilles';
    if (bp > 0 && !has(q.tenu)) q.tenu = 'pain';
    if (cp > 0 && !has(q.tenu)) q.tenu = 'ciseaux';
    if (q.micro) { if (!has(q.tenu) && !ec && !co && !ap) q.tenu = 'micro'; else if (!has(q.tenuB) && q.tenu !== 'micro') q.tenuB = 'micro'; }
    marcher(q, 1.7, 0.28, 4, { F: !has(q.tenu) && !tm && !ec && !bp && !cp && !co && !ap, B: !has(q.tenuB) && !cp && !q.deuxMains });
    q.dy = (q.dy || 0) + Math.sin((q.t || 0) * 1.9) * 1;
    if (tm > 0) {
      const v = q.visee || 0; blend(q, 'armF_up', -1.5 + v * 0.9, tm); blend(q, 'armF_lo', -0.1, tm);
      if (q.tenu === 'micro') { q.droit = false; A.objet = lerp(-((A.armF_up || 0) + (A.armF_lo || 0)), PI / 2 + v - ((A.armF_up || 0) + (A.armF_lo || 0)), tm); }
      A.head = (A.head || 0) + 0.05 * v * tm; if (!f.brow) f.brow = 'up';
    }
    if (ec > 0) {
      const e = headPt(HH, q, -6, -42); armTo(GH, q, 'armF', [e[0] + 8, e[1] + 6], 'avant', ec); if (ec > 0.5) q.handF = 'open';
      A.head = (A.head || 0) + 0.14 * ec; if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'smile';
    }
    if (bp > 0) {
      const L = q.cibleL || [64, -318]; armTo(GH, q, 'armF', L, 'bas', bp);
      A.head = (A.head || 0) - 0.16 * bp; if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'up';
    }
    if (cp > 0) {
      const u = ease(clamp(cp / 0.5)), w = clamp((cp - 0.5) / 0.5);
      armTo(GH, q, 'armF', [86, -98], 'bas', u); armTo(GH, q, 'armB', [56, -108], 'bas', u);
      q.tenuB = q.tenuB || 'rien'; q.handB = 'fist'; q._bande = u;
      q.tenuO = Object.assign({ ouvre: 1 - w }, q.tenuO);
      A.head = (A.head || 0) + 0.18 * u; if (!f.eyes) f.eyes = 'half';
    }
    if (co > 0 || ap > 0) {
      const k = Math.max(co, ap), L = q.cibleL || (co >= ap ? [118, -40] : [100, -96]);
      q.tilt = (q.tilt || 0) + 0.08 * k;
      armTo(GH, q, 'armF', L, 'bas', k); if (k > 0.4) q.handF = 'bas';
      A.head = (A.head || 0) + 0.16 * k; q._colle = co > 0.5 && co >= ap;
    }
    if (q.tenu === 'masque' && !tm && !bp) tenirMasque(q);
    if (q.tenu === 'pain' && !bp && q.deuxMains == null && !tm) armTo(GH, q, 'armF', [70, -86], 'bas', 1);
    return finish(GH, q, HDEF);
  };
  // câble spiralé entre deux points écran (a → b) ; o.mou (px), o.boucles (nombre), o.r (rayon des spires, px)
  CHW.cable = function (a, b, o) {
    o = o || {}; const c = cx_(); const mou = o.mou == null ? 40 : o.mou, n = o.boucles || 14, r = o.r || 4.5;
    const mid = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + mou], line = qbez(a, mid, b, n * 6), pts = [];
    for (let i = 0; i < line.length; i++) {
      const A = line[Math.max(0, i - 1)], B = line[Math.min(line.length - 1, i + 1)], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1;
      const ph = i / 6 * TAU, e = Math.min(1, i / 6, (line.length - 1 - i) / 6);
      pts.push([line[i][0] - dy / l * Math.sin(ph) * r * e + dx / l * Math.cos(ph) * r * 0.6 * e, line[i][1] + dx / l * Math.sin(ph) * r * e + dy / l * Math.cos(ph) * r * 0.6 * e]);
    }
    if (SIL()) return;
    strokePts(pts, '#0e0e10', (o.w || 2.6) + 1); strokePts(pts, '#2a2a2e', o.w || 2.6);
    strokePts(pts.filter((_, i) => i % 6 < 2), 'rgba(255,255,255,0.18)', 1);
  };
  CHW.burtt = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s; pose = pose || {};
    let q = CHW.burttPose(pose);
    if (pose.cible) { const L = toTorso(CH.chwBurtt, q, x, y, s, (o || {}).dir, pose.cible); q = CHW.burttPose(Object.assign({}, pose, { cibleL: L })); }
    const r = run(CH.chwBurtt, q, x, y, s, o, HDEF);
    r.jack = r.w('magneto', 36, -12);
    // bande tendue entre la main arrière et les ciseaux (coupe), coupée quand coupe = 1
    if (q._bande > 0.6) {
      const hb = r.w('armB_lo', 4, 96), pv = CHW.pt(r, 'coupe') || hb, d = [pv[0] - hb[0], pv[1] - hb[1]];
      const far = [pv[0] + d[0] * 0.9, pv[1] + d[1] * 0.9 + 60 * s];
      if ((pose.coupe || 0) >= 0.999) { CHW.ruban(hb, [pv[0] - d[0] * 0.08, pv[1] - d[1] * 0.08], { mou: 3 * s, w: 9 * s }); CHW.ruban([pv[0] + d[0] * 0.1, pv[1] + d[1] * 0.1 + 6 * s], far, { mou: 20 * s, w: 9 * s }); }
      else CHW.ruban(hb, far, { mou: 16 * s, w: 9 * s });
      // doigts de la main arrière par-dessus le ruban
      const cxx = cx_(); cxx.save(); cxx.setTransform(r.mats.armB_lo); cxx.translate(4, 96); if (!SIL()) pc(_.DOIGTS, BU.peauD, () => hatch(null, 0.9, 3.4, 0.15), 4440); cxx.restore();
    }
    if (q._colle) { const h = r.w('armF_lo', 4, 112); const c = cx_(); if (!SIL()) { c.save(); fillPts([[h[0] - 30 * s, h[1] + 2 * s], [h[0] + 26 * s, h[1]], [h[0] + 26 * s, h[1] + 7 * s], [h[0] - 30 * s, h[1] + 9 * s]], '#6a4426'); c.restore(); } }
    const mk = r.tenu === 'micro' ? CHW.pt(r, 'bas') : r.tenuB === 'micro' ? CHW.pt(r, 'bas', true) : null;
    if (mk && pose.cable !== false) CHW.cable(r.jack, mk, { mou: 34 * s, r: 4.4 * s, w: 2.4 });
    return r;
  };
  CHW.HD = { geant: HD, humain: HH };
})();
// ---- partie 3 : animaux (def.libre : dessin hors convention bras/jambes du kit) et pied de micro
(function () {
  'use strict';
  const CHW = M.chw, CH = M.chars, _ = CHW._;
  const { TAU, PI, D, OFFP, cx_, SIL, ep, ell, scl, tr, mp, rot, ribbon, qbez, pc, box, poilu, meches, crin, couches, OBJ, acc } = _;
  const { fillPts, strokePts, dot, hatch, shade, lerp, clamp, ease, hash } = M;
  const kv = (o, n) => ease(clamp(o[n] === true ? 1 : o[n] || 0));
  const H = (x, y, a, sx, sy) => new DOMMatrix().translate(x, y).rotate((a || 0) * D).scale(sx || 1, sy == null ? (sx || 1) : sy);
  function at(m, fn) { const c = cx_(); c.save(); c.setTransform(c.getTransform().multiply(m)); fn(); c.restore(); }
  function poil(reg, n, seed, col, len) { meches(M.bbox(reg), n, seed, col, len || 14, 0, 3); }

  // fabrique : marionnette animale à une pièce ; pose → p.o ; renvoie r avec r.pts (points nommés locaux) → CHW.animPt(r, nom)
  function animal(nom, draw, rodAt) {
    const def = { hipY: 0, handLen: 10, rod: { part: 'o', at: rodAt }, nom, libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
      parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => draw(p.o, (p._pts = {})) } }, order: ['o'] };
    const fn = (pose, x, y, s, o) => {
      pose = pose || {}; o = Object.assign({ slot: M.ST.slotF }, o); s = s == null ? 1 : s;
      const q = { o: Object.assign({ t: pose.t || 0 }, pose), tilt: pose.tilt || 0, dx: pose.dx || 0, dy: pose.dy || 0 };
      const r = M.puppet(def, q, x, y, s, o); r.pts = q._pts || {}; return r;
    };
    return { def, fn };
  }
  CHW.animPt = (r, nom) => { const q = r.pts && r.pts[nom]; return q ? r.w('o', q[0], q[1]) : null; };
  function rec(pts, m, nom, p) { pts[nom] = mp(m, p); }
  // gueule ouverte générique (repère de la tête) : (x0,y0) commissure, (x1,y1) avant ; k ouverture px
  function gueule(x0, y0, x1, y1, k, teeth) {
    const g = [[x0, y0], [x1, y1 - 2], [x1 - 2, y1 + k * 0.6], [lerp(x0, x1, 0.5), y1 + k], [x0 + 2, y0 + 4]];
    fillPts(g, '#3a1612', 0, 0); fillPts([[lerp(x0, x1, 0.25), y0 + k * 0.6], [lerp(x0, x1, 0.75), y1 + k * 0.6], [lerp(x0, x1, 0.5), y1 + k * 0.9]], '#9a4a48', 0, 0);
    if (teeth) for (const u of [0.55, 0.85]) { const x = lerp(x0, x1, u), y = lerp(y0, y1, u); fillPts([[x - 3, y], [x + 3, y - 0.5], [x, y + 7]], '#ece2c8', 0, 0); fillPts([[x - 3, y + k * 0.85], [x + 3, y + k * 0.85], [x, y + k * 0.85 - 6]], '#ece2c8', 0, 0); }
  }

  // =====================================================================
  // OURS (ourson cannelle + adultes noir / brun / grizzly) — même famille. Origine = sol sous le corps, regarde vers +x.
  // =====================================================================
  const ROBES = {
    cannelle: { poil: '#a0663a', poilD: '#7c4a26', poilL: '#c08452', clair: '#c89a6a', ventre: '#c89a6a', truffe: '#1a1210' },
    noir: { poil: '#2a2522', poilD: '#1a1614', poilL: '#3e3632', clair: '#b08a58', ventre: '#3a302a', truffe: '#0e0b0a' },
    brun: { poil: '#5e3b22', poilD: '#432716', poilL: '#7a5032', clair: '#a07a54', ventre: '#7a5636', truffe: '#140e0a' },
    grizzly: { poil: '#7c6a58', poilD: '#5c4c3e', poilL: '#a89680', clair: '#b8a68e', ventre: '#8e7c68', truffe: '#18120e', pointes: '#cfc3ae' },
  };
  function bearHead(R, f, cub, seed) {
    const c = cx_(), back = f.oreilles === 'arriere';
    // oreilles rondes
    for (const [ex, ey, r, col] of [[-4, -38, 13, R.poilD], [-20, -30, 14, R.poil]]) {
      const x = ex - (back ? 12 : 0), y = ey + (back ? 10 : 0);
      pc(ell(x, y, r, r, 14), col, () => fillPts(ell(x + 2, y + 2, r * 0.52, r * 0.52, 10), R.clair), seed + (r > 13 ? 1 : 2));
    }
    const HEAD = [[-38, 10], [-42, -14], [-34, -34], [-14, -44], [10, -44], [28, -34], [38, -20], [60, -16], [74, -10], [78, 0], [74, 8], [60, 14], [40, 22], [16, 32], [-14, 32], [-32, 24]];
    const m = f.mouth || 'n', op = m === 'ouvert' ? 16 : m === 'baille' ? 22 : 0;
    if (op) {                                                                                   // mâchoire abaissée (dessinée derrière)
      at(H(30, 14, 0.25 + op / 60), () => pc([[-6, -6], [40, -8], [44, 2], [36, 12], [6, 14]], R.poil, () => { fillPts([[-6, -6], [42, -8], [40, -2], [-4, 0]], '#3a1612'); for (const x of [30, 22]) fillPts([[x, -3], [x + 4, -3], [x + 2, -9]], '#ece2c8', 0, 0); fillPts([[0, 2], [40, 0], [40, 14], [0, 14]], R.clair); }, seed + 3));
    }
    pc(HEAD, R.poil, () => {
      fillPts([[34, -24], [60, -18], [76, -9], [79, 1], [74, 9], [58, 15], [38, 18], [30, 2]], R.clair);
      poil([[-40, -44], [30, -44], [30, 32], [-40, 32]], 14, seed + 4, R.poilD, 10);
      if (R.pointes) poil([[-40, -44], [20, -44], [20, 10], [-40, 10]], 10, seed + 5, R.pointes, 8);
      fillPts([[68, -12], [78, -7], [79, 2], [72, 4], [66, -4]], R.truffe); dot(73, -7, 1.8, 'rgba(255,255,255,0.55)');
      // œil noir brillant (grand chez l'ourson)
      const er = cub ? 7.5 : 4.6, e = f.eyes || 'open';
      if (e === 'closed') strokePts([[16, -18], [24, -15], [32, -18]], '#120c0a', 2.2);
      else {
        const k = e === 'half' ? 0.55 : 1;
        fillPts(ell(24, -18, er, er * k, 14), '#120c0a'); dot(26, -20, er * 0.38, 'rgba(255,255,255,0.95)'); if (cub) dot(21.5, -15.5, 1.4, 'rgba(255,255,255,0.6)');
        if (e === 'half') fillPts([[14, -30], [36, -30], [36, -18], [14, -18]], R.poil);
      }
      const b = f.brow || 'n', by = -30 - (cub ? 2 : 0);
      if (b === 'worry') strokePts([[14, by + 2], [24, by - 4], [34, by - 6]], R.clair, 3);
      else if (b === 'frown') strokePts([[14, by - 5], [24, by - 2], [34, by + 4]], cub ? '#3a2414' : R.clair, 3.2);
      // bouche
      if (m === 'o') fillPts(ell(60, 17, 5, 6, 10), '#3a1612');
      else if (!op) strokePts([[74, 8], [64, 13], [54, 13], [50, 10]], 'rgba(30,18,12,0.9)', 1.6);
      if (f.joue) dot(40, 4, 8, 'rgba(200,120,100,0.25)');
      shade(60, -30, -40, 30, 0.2, [-44, -46, 80, 34]);
    }, seed + 6);
  }
  // spec : cub (bool), k (taille du corps), hk (taille de la tête), R (robe), bosse (grizzly)
  function drawBear(o, pts, sp) {
    const R = sp.R, k = sp.k, hk = sp.hk, c = cx_(), t = o.t || 0, cub = sp.cub;
    const sit = !!o.assis && !o.debout;
    const re = kv(o, 'reclame'), ge = kv(o, 'gemit'), bo = kv(o, 'boude'), ind = kv(o, 'indigne'), cri = kv(o, 'cri'), vx = kv(o, 'vexe'), sa = kv(o, 'salut'), ve = kv(o, 'ventre');
    const br = Math.sin(t * 2.1) * 1.5;
    const face = { mouth: o.mouth, brow: o.brow, eyes: o.eyes };
    if (ge > 0.3) { face.mouth = face.mouth || 'o'; face.brow = face.brow || 'worry'; }
    if (ind > 0.3) { face.mouth = face.mouth || 'ouvert'; face.brow = face.brow || 'frown'; face.oreilles = 'arriere'; }
    if (bo > 0.3) { face.brow = face.brow || 'frown'; face.eyes = face.eyes || 'half'; }
    if (cri > 0.3) { face.mouth = face.mouth || 'ouvert'; face.brow = face.brow || 'frown'; }
    if (vx > 0.3) { face.brow = face.brow || 'frown'; face.eyes = face.eyes || 'half'; }
    if (sa > 0.3) { face.eyes = face.eyes || 'closed'; }
    // corps (repère « unités ourson » × k)
    const hip = sit ? [0, -40] : [0, -76], bodyC = sit ? [4, -96] : [2, -140], bodyR = sit ? [60, 64] : [56, 74];
    const tilt = sa * 0.42 + ind * -0.04, sh = sit ? [24, -142] : [26, -186];
    const B = H(0, 0, 0, k).multiply(H(hip[0], hip[1], tilt)).multiply(H(-hip[0], -hip[1]));
    const legCol = R.poilD;
    // pattes arrière
    if (sit) {
      at(H(0, 0, 0, k), () => {
        for (const [dx, col, sd] of [[-14, R.poilD, 11], [0, R.poil, 12]]) {
          pc([[-30 + dx, -70], [20 + dx, -66], [52 + dx, -44], [74 + dx, -36], [82 + dx, -14], [76 + dx, 0, 1], [-34 + dx, 0, 1], [-46 + dx, -30]], col, () => { poil([[-40 + dx, -70], [70 + dx, -70], [70 + dx, 0], [-40 + dx, 0]], 8, 70 + sd, R.poilD, 10); fillPts(ell(76 + dx, -18, 9, 15, 12), '#3a2a20'); for (const yy of [-28, -18, -8]) strokePts([[82 + dx, yy], [89 + dx, yy + 1]], '#e6dcc4', 1.4); }, 700 + sd);
        }
      });
    } else {
      const ph = (o.marche || 0) * TAU, sw = o.marche != null ? 0.32 : 0;
      at(H(0, 0, 0, k), () => {
        for (const [dx, a, col, sd] of [[-8, Math.sin(ph) * sw, R.poilD, 13], [8, -Math.sin(ph) * sw, R.poil, 14]]) {
          at(H(dx, -76, a), () => { pc(ep(0, 0, 25, 25, 8, PI, TAU).concat([[26, 30], [22, 52], [46, 60], [52, 72, 1], [50, 76, 1], [-22, 76, 1], [-26, 50]]), col, () => { poil([[-26, -10], [26, -10], [26, 60], [-26, 60]], 6, 80 + sd, R.poilD, 10); fillPts([[-22, 70], [52, 70], [52, 78], [-22, 78]], '#3a2a20'); for (const xx of [40, 46, 52]) strokePts([[xx, 66], [xx + 4, 73]], '#e6dcc4', 1.3); }, 720 + sd); M.rivet(0, 0, 3); });
        }
      });
    }
    // patte avant arrière (derrière le corps)
    const armB = sit ? 0.5 - re * 0.3 : (0.25 - sa * 0.9 + cri * -0.8 + ind * 0.15);
    const armF = sit ? 0.55 - re * 2.3 - ve * 0.9 : (0.2 - re * 1.95 - sa * 0.35 - cri * 1.05 + ind * 0.12 - ve * 1.0 + (vx ? 0.05 : 0));
    const armFlo = (1 - re) * (ve * 1.2 + sa * 1.3) + re * 0.5;
    const arm = (a, alo, col, sd) => at(H(sh[0], sh[1], a), () => {
      pc(_.armR(46, 17, 18, 13), col, () => poil([[-18, -10], [18, -10], [18, 40], [-18, 40]], 4, 95 + sd, R.poilD, 9), 740 + sd);
      at(H(0, 46, alo), () => pc(ep(0, 0, 13, 13, 8, PI, TAU).concat([[16, 30], [22, 46], [18, 56], [-4, 58], [-16, 48], [-14, 20]]), col, () => { poil([[-18, -6], [18, -6], [18, 40], [-18, 40]], 5, 90 + sd, R.poilD, 10); for (const xx of [6, 12, 18]) strokePts([[xx, 52], [xx + 3, 60]], '#e6dcc4', 1.3); }, 760 + sd));
      M.rivet(0, 0, 3);
    });
    at(B, () => arm(armB, sit ? -0.4 : -0.2 - cri * 0.5, R.poilD, 1));
    // corps
    at(B, () => {
      const body = ell(bodyC[0], bodyC[1], bodyR[0], bodyR[1], 22);
      if (sp.bosse) body.splice(15, 2, [bodyC[0] - 24, bodyC[1] - bodyR[1] - 14], [bodyC[0] + 6, bodyC[1] - bodyR[1] - 8]);
      pc(body, R.poil, () => {
        fillPts(ell(bodyC[0] + 30, bodyC[1] + 10, 24, bodyR[1] * 0.7, 14), R.ventre);
        poil([[bodyC[0] - 60, bodyC[1] - 70], [bodyC[0] + 60, bodyC[1] - 70], [bodyC[0] + 60, bodyC[1] + 70], [bodyC[0] - 60, bodyC[1] + 70]], 34, 101 + (cub ? 0 : 7), R.poilD, 14);
        if (R.pointes) poil([[bodyC[0] - 60, bodyC[1] - 80], [bodyC[0] + 30, bodyC[1] - 80], [bodyC[0] + 30, bodyC[1]], [bodyC[0] - 60, bodyC[1]]], 22, 103, R.pointes, 10);
        shade(bodyC[0] + 60, bodyC[1], bodyC[0] - 60, bodyC[1], 0.32, [-80, -260, 90, 0]);
      }, 780 + (cub ? 0 : 9));
      // petite queue
      pc(ell(bodyC[0] - bodyR[0] + 2, bodyC[1] + bodyR[1] * 0.55, 9, 8, 10), R.poilD, null, 790);
    });
    // tête (avec le corps qui s'incline) ; boude = détournée (miroir), ventre = regard vers le bas
    const neck = mp(B, [sh[0] + 6, sh[1] - 30 + br * 0.3]);
    const ha = -0.28 * ge - 0.2 * re + 0.32 * bo + 0.35 * sa - 0.1 * cri - 0.22 * vx + 0.06 * ind + 0.25 * ve + (o.tete || 0) + tilt;
    const hm = H(neck[0], neck[1], ha, hk * (bo > 0.5 ? -1 : 1), hk).multiply(H(cub ? 6 : 10, -12));
    at(hm, () => bearHead(R, face, cub, cub ? 800 : 820 + (sp.seed || 0)));
    rec(pts, hm, 'tete', [10, -10]); rec(pts, hm, 'nez', [76, -2]); rec(pts, hm, 'bouche', [60, 14]);
    // patte avant (devant)
    at(B, () => arm(armF, (sit ? -0.4 : -0.3) * (1 - re) - armFlo - cri * 0.5, R.poil, 2));
    rec(pts, B, 'patte', [sh[0] + Math.sin(-armF) * 100, sh[1] + Math.cos(armF) * 100]);
    rec(pts, B, 'ventre', [bodyC[0] + 30, bodyC[1]]);
  }
  const OURSON = animal('ourson', (o, pts) => drawBear(o, pts, { R: ROBES.cannelle, k: 1, hk: 1, cub: true }), [-10, -110]);
  CH.chwOurson = OURSON.def;
  CHW.ourson = OURSON.fn;
  const OURS = {};
  for (const robe of ['noir', 'brun', 'grizzly']) {
    OURS[robe] = animal('ours ' + robe, (o, pts) => drawBear(o, pts, { R: ROBES[robe], k: 1.2, hk: 1.0, cub: false, bosse: robe === 'grizzly', seed: robe.length }), [-10, -150]);
    CH['chwOurs_' + robe] = OURS[robe].def;
  }
  CHW.ours = (pose, x, y, s, o) => OURS[(pose && pose.robe) || 'brun'].fn(pose, x, y, s, o);

  // =====================================================================
  // LE LION — ocre, crinière en mèches brun roux, queue à touffe. ≈ 300 px de long. cri, vexe, baille, salut
  // =====================================================================
  const LI = { poil: '#b8873e', poilD: '#966c2e', clair: '#d8b070', criniere: '#7a4a20', crinD: '#5a3414', truffe: '#3a2420' };
  function drawLion(o, pts) {
    const c = cx_(), t = o.t || 0, cri = kv(o, 'cri'), vx = kv(o, 'vexe'), ba = kv(o, 'baille'), sa = kv(o, 'salut');
    const ph = (o.marche || 0) * TAU, sw = o.marche != null ? 0.3 : 0;
    const front = sa * 46, LOW = 26;                                        // avant abaissé (salut) ; LOW : corps plus bas sur pattes
    const tq = Math.sin(t * 1.7) * 0.15 + vx * Math.sin(t * 6) * 0.25;
    // queue
    at(H(-118, -150 + LOW + front * 0.1, 0.9 + tq - sa * 0.4), () => { pc(ribbon(qbez([0, 0], [-10, 50], [26, 80], 10), 9, 6), LI.poil, null, 901); pc(crin(ell(28, 84, 11, 12, 12), 10, 902, 8), LI.criniere, () => couches([10, 70, 46, 110], 903, 'rgba(90,52,20,0.8)', 'rgba(170,110,50,0.6)', 10), 903); });
    // pattes (arrière d'abord)
    const leg = (x, y, a, col, sd, lo) => at(H(x, y, a), () => { pc(ep(0, 0, 18, 18, 8, PI, TAU).concat([[18, 20], [12, 64 - (lo || 0)], [12, 92 - (lo || 0)], [26, 100 - (lo || 0)], [30, 112 - (lo || 0), 1], [-12, 112 - (lo || 0), 1], [-13, 92 - (lo || 0)], [-14, 60 - (lo || 0)], [-20, 18]]), col, () => { for (const xx of [12, 20, 27]) strokePts([[xx, 104 - (lo || 0)], [xx + 2, 110 - (lo || 0)]], 'rgba(60,40,20,0.6)', 1.2); }, sd); M.rivet(0, 0, 3); });
    leg(-92, -110 + LOW, Math.sin(ph) * sw, LI.poilD, 911, LOW); leg(70, -110 + LOW + front, -Math.sin(ph) * sw - sa * 0.75, LI.poilD, 912, LOW + front * 0.4);
    // corps
    const body = [[-120, -168], [-60, -180], [20, -184 + front * 0.6], [80, -178 + front], [112, -150 + front], [108, -106 + front], [76, -92 + front * 0.8], [30, -104 + front * 0.4], [-40, -102], [-100, -100], [-128, -128]];
    at(H(0, LOW), () => pc(body, LI.poil, () => { fillPts([[-120, -120], [100, -120 + front], [100, -96], [-120, -96]], LI.clair); hatch(null, 0.9, 4, 0.2); shade(0, -190, 0, -100, 0.3, [-140, -200, 120, -90]); }, 913));
    leg(-70, -112 + LOW, -Math.sin(ph) * sw, LI.poil, 914, LOW); leg(88, -112 + LOW + front, Math.sin(ph) * sw - sa * 0.8, LI.poil, 915, LOW + front * 0.4);
    // tête + crinière
    const ha = -0.18 * cri - 0.3 * ba + 0.45 * sa - 0.2 * vx + (o.tete || 0);
    const hm = H(102, -186 + LOW + front * 1.1, ha);
    at(hm, () => {
      // crinière : mèches touffues qui retombent sur le cou et le poitrail (couches arrière plus sombre, avant plus claire)
      const g = 1 + cri * 0.12, mane = ep(-10, -14, 70 * g, 62 * g, 22, PI * 0.62, PI * 2.2).concat([[44, 40], [30, 86], [-10, 96], [-52, 84], [-74, 40]]);
      pc(crin(mane, (x, y) => (y > -40 ? 26 : 16), 922, 18), LI.crinD, () => couches([-90, -80, 70, 100], 923, 'rgba(60,32,12,0.6)', 'rgba(150,96,40,0.6)', 18), 924);
      pc(crin(ep(-6, -10, 58 * g, 52 * g, 20, PI * 0.7, PI * 2.15).concat([[36, 34], [20, 70], [-20, 76], [-50, 50]]), (x, y) => (y > -30 ? 22 : 12), 925, 16), LI.criniere, () => couches([-70, -66, 60, 80], 926, 'rgba(90,52,20,0.6)', 'rgba(176,120,56,0.7)', 16), 927);
      const op = Math.max(cri * 20, ba * 30);
      if (op > 1) at(H(26, 22, op / 50), () => pc([[-10, -6], [42, -6], [48, 4], [40, 16], [4, 18]], LI.poil, () => { fillPts([[-10, -6], [44, -6], [42, 0], [-8, 2]], '#3a1612'); for (const x of [36, 26]) fillPts([[x, -3], [x + 4, -3], [x + 2, -10]], '#ece2c8', 0, 0); fillPts([[0, 4], [46, 2], [46, 18], [0, 18]], LI.clair); }, 924));
      pc([[-36, -30], [-12, -46], [20, -44], [40, -30], [60, -20], [66, -6], [62, 8], [46, 18], [20, 26], [-10, 30], [-34, 16]], LI.poil, () => {
        fillPts([[36, -22], [60, -16], [66, -4], [62, 8], [44, 16], [30, 10]], LI.clair);
        fillPts([[56, -18], [66, -12], [67, -4], [60, -4]], LI.truffe);
        const e = ba > 0.4 || sa > 0.6 ? 'closed' : vx > 0.3 ? 'half' : 'open';
        if (e === 'closed') strokePts([[14, -22], [22, -19], [30, -22]], '#2a1a10', 2);
        else { fillPts(ell(22, -22, 6, e === 'half' ? 3 : 5, 12), '#e8d8a0'); dot(23, -22, 3, '#1a1008'); if (e === 'half') fillPts([[14, -30], [30, -30], [30, -22], [14, -22]], LI.poil); }
        strokePts(vx > 0.3 || cri > 0.3 ? [[12, -34], [22, -30], [32, -26]] : [[12, -30], [22, -33], [32, -31]], LI.crinD, 3);
        if (op <= 1) strokePts([[62, 8], [50, 14], [38, 12]], '#3a2010', 1.5);
        for (const yy of [0, 6]) strokePts([[48, yy], [70, yy - 4]], 'rgba(255,250,230,0.6)', 0.9);
        shade(50, -20, -30, 20, 0.2, [-40, -50, 70, 30]);
      }, 925);
      pc(ell(-16, -40, 11, 11, 12), LI.poil, () => dot(-14, -38, 5, LI.poilD), 926);
    });
    rec(pts, hm, 'tete', [10, -10]); rec(pts, hm, 'bouche', [56, 14]);
  }
  const LION = animal('lion', drawLion, [-10, -140]);
  CH.chwLion = LION.def; CHW.lion = LION.fn;

  // =====================================================================
  // LE PHOQUE — gris-bleu tacheté, gros yeux noirs, moustaches. ≈ 220 px de long, couché. cri, vexe, salut
  // =====================================================================
  const PH = { peau: '#6f7c86', peauD: '#56626c', ventre: '#9aa4aa', tache: '#4a545c' };
  function drawPhoque(o, pts) {
    const t = o.t || 0, cri = kv(o, 'cri'), vx = kv(o, 'vexe'), sa = kv(o, 'salut');
    const br = Math.sin(t * 2.4) * 1.5, lift = cri * 0.35 + vx * 0.15;
    // nageoires arrière
    pc([[-110, -18], [-140, -40], [-150, -30], [-136, -10], [-150, 2], [-138, 6], [-108, -2]], PH.peauD, null, 931);
    // corps en goutte, tête relevée
    const body = [[-112, -16], [-90, -46], [-40, -66 - br], [10, -74 - br], [46, -80], [70, -100 - lift * 60], [80, -112 - lift * 70], [96, -96 - lift * 60], [86, -60], [60, -14], [20, 0, 1], [-100, 0, 1]];
    pc(body, PH.peau, () => {
      fillPts([[-100, -10], [20, -12], [60, -18], [80, -50], [86, -40], [62, 0], [-100, 0]], PH.ventre);
      for (let i = 0; i < 18; i++) fillPts(ell(-90 + hash(i * 3.7) * 160, -60 + hash(i * 5.3) * 40, 4 + hash(i) * 4, 3, 8), PH.tache);
      shade(0, -80, 0, 0, 0.25, [-150, -120, 110, 0]);
    }, 932);
    // tête
    const ha = -0.45 * cri - 0.2 * vx + 0.25 * sa + (o.tete || 0);
    const hm = H(84 - lift * 6, -104 - lift * 66, ha);
    at(hm, () => {
      pc([[-24, 14], [-28, -8], [-16, -26], [6, -30], [24, -24], [40, -14], [50, -6], [50, 4], [40, 10], [18, 18], [-4, 22]], PH.peau, () => {
        fillPts(ell(42, 0, 12, 10, 12), PH.ventre);
        dot(48, -6, 4, '#1a1a1e');
        const e = vx > 0.3 ? 'half' : sa > 0.6 ? 'closed' : 'open';
        if (e === 'closed') strokePts([[8, -12], [16, -9], [24, -12]], '#101014', 2.2);
        else { fillPts(ell(16, -12, 8.5, e === 'half' ? 4 : 8.5, 14), '#101014'); dot(18.5, -15, 3, 'rgba(255,255,255,0.95)'); if (e === 'half') fillPts([[6, -24], [28, -24], [28, -12], [6, -12]], PH.peau); }
        if (vx > 0.3) strokePts([[6, -24], [16, -21], [26, -17]], '#2a3036', 2.4);
        for (const [dy, a] of [[-2, -0.2], [2, 0], [6, 0.2]]) strokePts([[44, dy], [62, dy + a * 20]], 'rgba(240,240,230,0.85)', 1);
        if (cri > 0.2) fillPts([[30, 6], [48, 6], [44, 6 + cri * 12], [32, 6 + cri * 10]], '#3a1612', 0, 0);
        else strokePts([[46, 8], [36, 9]], '#2a2a30', 1.3);
      }, 933);
    });
    rec(pts, hm, 'tete', [10, -6]); rec(pts, hm, 'nez', [50, 0]);
    // nageoire avant (salut : levée)
    at(H(30 + sa * 10, -30 - sa * 30, 0.5 - sa * 3.3 + Math.sin(t * 7) * 0.15 * sa, 1 + sa * 0.3), () => { pc([[-8, -6], [10, -8], [16, 30], [10, 46], [0, 48], [-8, 30]], PH.peauD, () => { for (const x of [-2, 4, 10]) strokePts([[x, 36], [x, 46]], 'rgba(30,30,30,0.5)', 1); }, 934); M.rivet(0, 0, 3); });
    rec(pts, H(30 + sa * 10, -30 - sa * 30, 0.5 - sa * 3.3, 1 + sa * 0.3), 'nageoire', [4, 46]);
  }
  const PHOQUE = animal('phoque', drawPhoque, [-10, -40]);
  CH.chwPhoque = PHOQUE.def; CHW.phoque = PHOQUE.fn;

  // =====================================================================
  // LE BLAIREAU — gris, masque facial blanc à deux bandes noires, pattes noires. ≈ 180 px de long. cri, vexe, salut ; sort 0..1 (terrier)
  // =====================================================================
  const BL = { poil: '#7d7a72', poilD: '#5e5b54', noir: '#1e1c1a', blanc: '#f0ece2' };
  function drawBlaireau(o, pts) {
    const c = cx_(), t = o.t || 0, cri = kv(o, 'cri'), vx = kv(o, 'vexe'), sa = kv(o, 'salut');
    const so = clamp(o.sort == null ? 1 : o.sort), dyS = (1 - ease(so)) * 120;
    if (so < 1 && !SIL()) { c.save(); c.beginPath(); c.rect(-400, -600, 800, 600); c.clip(); }
    else if (so < 1) { c.save(); c.beginPath(); c.rect(-400, -600, 800, 600); c.clip(); }
    c.save(); c.translate(0, dyS);
    const leg = (x, a, sd) => at(H(x, -40, a), () => { pc([[-11, -6], [11, -6], [12, 30], [22, 38], [24, 44, 1], [-10, 44, 1]], BL.noir, () => { for (const xx of [14, 19, 23]) strokePts([[xx, 38], [xx + 3, 44]], '#d8d0c0', 1.1); }, sd); M.rivet(0, 0, 2.6); });
    leg(-56, 0.1, 941); leg(46, -0.1 - sa * 1.7 + Math.sin(t * 6) * 0.15 * sa, 942);
    const body = [[-92, -40], [-86, -66], [-40, -80], [20, -78], [62, -62], [70, -40], [40, -30], [-60, -30], [-96, -30]];
    pc(body, BL.poil, () => { poil([[-96, -82], [70, -82], [70, -30], [-96, -30]], 40, 943, 'rgba(230,228,220,0.5)', 10); fillPts([[-90, -40], [60, -40], [60, -30], [-90, -30]], BL.poilD); }, 944);
    pc([[-92, -60], [-106, -66], [-104, -54]], BL.poilD, null, 945);
    leg(-38, -0.1, 946); leg(28, 0.1 - sa * 0.6, 947);
    const ha = -0.35 * cri - 0.25 * vx + 0.6 * sa + (o.tete || 0);
    const hm = H(62, -62, ha);
    at(hm, () => {
      pc([[-10, 18], [-14, -8], [-4, -22], [14, -24], [34, -16], [56, -8], [64, -2], [60, 6], [40, 12], [16, 18]], BL.blanc, () => {
        // deux bandes noires du museau aux oreilles, en passant par l'œil
        fillPts([[-12, -10], [6, -18], [30, -12], [56, -4], [58, 0], [30, -2], [8, -2], [-12, 2]], BL.noir, 0, 0.2);
        fillPts([[-14, 10], [10, 6], [40, 8], [54, 8], [44, 14], [16, 18], [-10, 18]], BL.poil, 0, 0.2);
        fillPts([[58, -6], [65, -3], [64, 3], [58, 2]], '#0e0c0a');
        const e = vx > 0.3 ? 'half' : sa > 0.6 ? 'closed' : 'open';
        if (e === 'closed') strokePts([[18, -8], [24, -6], [30, -8]], '#e8e0d0', 1.8);
        else { dot(24, -7, 3.6, '#0a0a0a'); dot(25.5, -8.5, 1.3, 'rgba(255,255,255,0.95)'); }
        if (vx > 0.3 || cri > 0.3) strokePts([[16, -16], [24, -14], [32, -10]], BL.blanc, 2.6);
        if (cri > 0.2) { fillPts([[38, 8], [60, 6], [54, 8 + cri * 12], [40, 8 + cri * 10]], '#3a1612', 0, 0); fillPts([[52, 7], [56, 7], [54, 12]], '#ece2c8', 0, 0); }
      }, 948);
      pc(ell(-6, -18, 7, 7, 10), BL.blanc, () => dot(-6, -18, 3.5, BL.noir), 949);
    });
    rec(pts, hm, 'tete', [20, -4]); rec(pts, hm, 'nez', [62, 0]);
    c.restore();
    if (so < 1) c.restore();
  }
  const BLAIREAU = animal('blaireau', drawBlaireau, [-10, -40]);
  CH.chwBlaireau = BLAIREAU.def; CHW.blaireau = BLAIREAU.fn;

  // =====================================================================
  // LE MORSE — massif, brun-rose, deux longues défenses ivoire, grosse moustache, plis. ≈ 330 px de long. cri, vexe, salut
  // =====================================================================
  const MO = { peau: '#8e6a58', peauD: '#6e5040', peauL: '#a8826e', defense: '#e8dcc0', moust: '#c8b49a' };
  function drawMorse(o, pts) {
    const t = o.t || 0, cri = kv(o, 'cri'), vx = kv(o, 'vexe'), sa = kv(o, 'salut');
    const br = Math.sin(t * 1.5) * 2, lift = cri * 0.3;
    pc([[-150, -20], [-182, -44], [-194, -32], [-178, -12], [-194, 2], [-180, 6], [-148, -2]], MO.peauD, null, 951);
    const body = [[-156, -18], [-150, -70], [-110, -118 - br], [-40, -146 - br], [30, -150], [80, -136], [110, -120 - lift * 40], [124, -96], [120, -40], [96, -6], [40, 0, 1], [-140, 0, 1]];
    pc(body, MO.peau, () => {
      for (let i = 0; i < 7; i++) { const x = -120 + i * 34; strokePts(qbez([x, -130 + Math.abs(i - 3) * 8], [x + 14, -70], [x + 4, -6], 8), 'rgba(80,50,40,0.45)', 1.6); }
      for (let i = 0; i < 26; i++) dot(-140 + hash(i * 2.9) * 250, -130 + hash(i * 6.1) * 120, 1.3, 'rgba(70,40,30,0.4)');
      shade(0, -150, 0, 0, 0.3, [-200, -160, 140, 0]); fillPts([[-140, -12], [100, -12], [100, 0], [-140, 0]], MO.peauD);
    }, 952);
    const ha = -0.3 * cri + 0.18 * vx + 0.6 * sa + (o.tete || 0);
    const hm = H(108, -116 - lift * 40, ha);
    at(hm, () => {
      // défenses (derrière la moustache) : deux longues dents ivoire vers le bas
      for (const [dx, col] of [[-4, '#d4c8aa'], [6, MO.defense]]) pc([[20 + dx, 20], [32 + dx, 20], [30 + dx, 70], [24 + dx, 104, 1], [18 + dx, 70]], col, () => strokePts([[26 + dx, 24], [25 + dx, 96]], 'rgba(255,255,255,0.6)', 1.2), 953 + dx);
      pc([[-30, 30], [-40, 0], [-30, -30], [-6, -44], [20, -40], [40, -24], [52, -6], [54, 12], [44, 30], [10, 40], [-20, 40]], MO.peau, () => {
        const e = vx > 0.3 ? 'half' : sa > 0.6 ? 'closed' : 'open';
        if (e === 'closed') strokePts([[8, -18], [14, -15], [20, -18]], '#1a100c', 2);
        else { dot(14, -18, 4.4, '#140c0a'); dot(15.5, -19.5, 1.5, 'rgba(255,255,255,0.9)'); if (e === 'half') fillPts([[6, -26], [22, -26], [22, -18], [6, -18]], MO.peau); }
        strokePts(vx > 0.3 ? [[4, -28], [14, -25], [24, -20]] : [[4, -26], [14, -28], [24, -26]], '#4a2e22', 2.4);
        for (let i = 0; i < 4; i++) strokePts([[-20 + i * 6, -30], [-24 + i * 6, 20]], 'rgba(80,50,40,0.35)', 1.2);
        if (cri > 0.2) { fillPts([[10, 24], [44, 24], [40, 24 + cri * 26], [26, 24 + cri * 30], [14, 24 + cri * 22]], '#3a1612', 0, 0); fillPts([[18, 30 + cri * 14], [36, 30 + cri * 14], [30, 24 + cri * 26]], '#9a4a48', 0, 0); }
      }, 955);
      // moustache : coussinet de soies (retombe si vexé)
      const dr = vx * 10;
      pc([[22, -6], [44, -10], [58, 0], [60, 16 + dr], [50, 28 + dr], [30, 30 + dr], [18, 20 + dr]], MO.peauL, () => {
        for (let i = 0; i < 9; i++) { const y = -4 + i * 3.6; strokePts([[30, y + dr * i / 9], [60, y + 6 + dr]], MO.moust, 1.3); }
        for (let i = 0; i < 12; i++) dot(30 + hash(i * 1.7) * 24, -2 + hash(i * 4.1) * 24 + dr * 0.6, 1.3, 'rgba(60,40,30,0.5)');
      }, 957);
    });
    rec(pts, hm, 'tete', [10, -10]); rec(pts, hm, 'defenses', [28, 104]);
    at(H(40, -40, 0.4 - sa * 1.8 + Math.sin(t * 5) * 0.12 * sa), () => { pc([[-12, -8], [12, -10], [22, 36], [16, 54], [-4, 56], [-12, 34]], MO.peauD, () => { for (const x of [0, 8, 14]) strokePts([[x, 44], [x + 2, 54]], 'rgba(40,20,10,0.5)', 1.2); }, 958); M.rivet(0, 0, 3); });
  }
  const MORSE = animal('morse', drawMorse, [-20, -60]);
  CH.chwMorse = MORSE.def; CHW.morse = MORSE.fn;

  // =====================================================================
  // PIED DE MICRO de studio chromé à trois pieds : base (0,0) = sol au centre ; pince en (0, −312) ; micro:1 = micro de Burtt fixé
  // =====================================================================
  const CHROME = '#b9b9b2', CHROMED = '#8a8a84';
  function drawPied(o) {
    const h = o.haut || 312, a = o.angle == null ? 0.9 : o.angle;
    for (const [x1, col] of [[-74, CHROMED], [70, CHROME], [10, CHROME]]) pc(ribbon([[0, -40], [x1, -2]], 6), col, () => strokePts([[0, -42], [x1, -4]], 'rgba(255,255,255,0.5)', 1), 961 + x1);
    for (const x1 of [-74, 70, 10]) dot(x1, -2, 4.5, '#2a2a2c');
    pc(box(-8, -60, 8, -30), '#4a4a4e', null, 964);
    pc(box(-5, -200, 5, -56), CHROME, () => strokePts([[-2, -198], [-2, -58]], 'rgba(255,255,255,0.7)', 1.3), 965);
    pc(box(-7, -212, 7, -198), '#3a3a3e', () => dot(9, -205, 3, '#2a2a2c'), 966);                     // bague de réglage
    pc(box(-3, -h, 3, -210), CHROME, () => strokePts([[-1, -h], [-1, -212]], 'rgba(255,255,255,0.7)', 1.1), 967);
    pc(ell(0, -h, 6, 6, 10), '#3a3a3e', null, 968);                                                     // rotule
    const c = cx_(); c.save(); c.translate(0, -h); c.rotate(a);
    pc([[-6, -6], [6, -6], [6, -24], [-6, -24]], '#3a3a3e', null, 969);                                 // pince
    if (o.micro) { c.translate(0, -28); _.drawMicro(o); }
    c.restore();
  }
  OBJ.pied = { draw: drawPied, grip: [0, -150], base: [0, 0], pts: { pince: (o) => [0, -(o.haut || 312)], micro: (o) => { const a = o.angle == null ? 0.9 : o.angle; return [Math.sin(a) * 82, -(o.haut || 312) - Math.cos(a) * 82]; } } };
  CHW.piedMicro = (x, y, s, o) => acc('pied', x, y, s, Object.assign({ ombre: true }, o), 1);
})();
// ---- partie 4 : décors récurrents (pré-rendus par CHW.init) — CHW.plateau, CHW.ferme, CHW.studio (t, up, o) AVANT M.drawFloor()
//      o.couche : 'fond' (tout sauf le premier plan) | 'avant' (premier plan seul : console, barrière…) | défaut : tout
(function () {
  'use strict';
  const CHW = M.chw, _ = CHW._;
  const { TAU, PI, D, cx_, SIL, ep, ell, scl, tr, rot, ribbon, qbez, pc, box, rrect, poilu, meches, mixA, mixH } = _;
  const { fillPts, strokePts, dot, hatch, shade, lerp, clamp, ease, hash, smooth } = M;
  const W = M.W, BACK = M.ST.back;
  const full = (fn) => M.pre(W, BACK + 40, fn);
  function glow(x, y, r, col, a) { if (a <= 0 || SIL()) return; const c = cx_(), g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
  function beam(x0, y0, x1a, y1a, x1b, y1b, a, col) { if (SIL() || a <= 0) return; const c = cx_(), g = c.createLinearGradient(x0, y0, (x1a + x1b) / 2, (y1a + y1b) / 2); g.addColorStop(0, `rgba(${col || '255,240,200'},${a})`); g.addColorStop(1, `rgba(${col || '255,240,200'},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1a, y1a); c.lineTo(x1b, y1b); c.closePath(); c.fill(); c.restore(); }
  const sh = (pts) => pts.map((p) => [p[0], p[1], 1]);
  const star4 = (x, y, r) => [[x, y - r], [x + r * 0.25, y - r * 0.25], [x + r, y], [x + r * 0.25, y + r * 0.25], [x, y + r], [x - r * 0.25, y + r * 0.25], [x - r, y], [x - r * 0.25, y - r * 0.25]];
  function rivets(x0, y0, x1, y1, sp) { for (let x = x0; x <= x1; x += sp) { dot(x, y0, 2.4, 'rgba(40,42,48,0.8)'); dot(x - 0.6, y0 - 0.6, 0.9, 'rgba(255,255,255,0.4)'); if (y1 !== y0) { dot(x, y1, 2.4, 'rgba(40,42,48,0.8)'); } } }

  // =====================================================================
  // PLATEAU SPATIAL (P1, P2) — toile de nuit cousue en lés, étoiles d'argent, planète à anneau + lune (suspendues), nébuleuse ;
  // cockpit de carton : hublot rond à montants courbes, console courbe à lampes, deux leviers, sièges ; câbles, caisse, palmier, rampe d'accessoires ;
  // coulisses (P2) : caméra de cinéma sur chariot (gauche), projecteur de tournage (cintres), perche de son (haut droite)
  // =====================================================================
  const PL = { hublot: { x: 640, y: 640, r: 196 }, console: { x0: 300, x1: 1034, y: 1108 }, leviers: [[330, 1196], [372, 1190]], siege: { x: 238, y: 1300 }, siege2: { x: 900, y: 1300 },
    planete: { x: 250, y: 500 }, lune: { x: 900, y: 360 }, camera: { x: 160 }, projo: { x: 540, y: 300 }, perche: { x: 860, y: 420 }, caisse: { x: 960 }, palmier: { x: 96 } };
  CHW.PLATEAU = PL;
  const LAMPS = []; { const R = M.rng(501); for (let row = 0; row < 3; row++) for (let i = 0; i < 16; i++) { const x = 470 + i * 34 + row * 10, y = 1130 + row * 22 - Math.sin((x - 450) / 600 * PI) * 10; LAMPS.push({ x, y, col: ['#e04a32', '#e8a632', '#7ed27a'][(i + row) % 3], f: 0.8 + R() * 3.4, ph: R() * TAU, r: 5 + (row === 1 ? 1 : 0) }); } }
  const STARS = []; { const R = M.rng(502); for (let i = 0; i < 70; i++) STARS.push({ x: 60 + R() * 960, y: 160 + R() * 900, r: 2 + R() * 4.5, f: 0.7 + R() * 2.4, ph: R() * TAU }); }
  function makePlFond() {
    return full((c) => {
      const g = c.createLinearGradient(0, 0, 0, BACK); g.addColorStop(0, '#0e1222'); g.addColorStop(0.6, '#141a2e'); g.addColorStop(1, '#1e2438'); c.fillStyle = g; c.fillRect(0, 0, W, BACK + 40);
      for (let x = 0; x < W; x += 180) { strokePts([[x, 0], [x + 3, BACK]], 'rgba(0,0,0,0.45)', 2); for (let y = 10; y < BACK; y += 14) strokePts([[x - 3, y], [x + 3, y + 5]], 'rgba(190,190,210,0.18)', 1); }   // coutures des lés
      // nébuleuse en volutes rose éteint (bords irréguliers)
      for (const [cx, cy, rx, ry, a, sd] of [[760, 300, 260, 110, 0.32, 11], [880, 460, 170, 80, 0.26, 12], [180, 760, 200, 90, 0.2, 13]]) {
        const R = M.rng(sd), blob = []; for (let i = 0; i < 22; i++) { const t = i / 22 * TAU, k = 0.7 + R() * 0.45; blob.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]); }
        fillPts(blob, `rgba(154,106,116,${a})`, sd, 3);
        strokePts(qbez([cx - rx * 0.6, cy], [cx, cy - ry * 0.9], [cx + rx * 0.5, cy + ry * 0.2], 16), `rgba(200,150,160,${a})`, 3);
        strokePts(qbez([cx - rx * 0.3, cy + ry * 0.4], [cx + rx * 0.2, cy - ry * 0.2], [cx + rx * 0.7, cy + ry * 0.3], 16), `rgba(120,80,100,${a})`, 2);
      }
      const R = M.rng(503); for (let i = 0; i < 160; i++) dot(R() * W, R() * BACK, 0.8 + R() * 1.2, `rgba(220,225,240,${0.25 + R() * 0.4})`);
      const sh = c.createLinearGradient(0, 150, 0, BACK); sh.addColorStop(0, 'rgba(0,0,0,0.4)'); sh.addColorStop(0.25, 'rgba(0,0,0,0)'); c.fillStyle = sh; c.fillRect(0, 150, W, BACK);
    });
  }
  function makePlanete() {
    return M.withShadow(M.cutFlat(320, 230, 160, 210, () => {
      pc(ribbon(ep(0, -100, 150, 34, 24, PI * 0.95, PI * 2.05), 12), '#9a8a6a', null, 511);
      pc(ell(0, -100, 86, 86, 30), '#b8873e', () => { for (let i = 0; i < 5; i++) fillPts([[-90, -150 + i * 24], [90, -146 + i * 24], [90, -136 + i * 24], [-90, -140 + i * 24]], i % 2 ? 'rgba(140,90,40,0.4)' : 'rgba(230,190,120,0.3)'); shade(40, -140, -60, -60, 0.4, [-90, -190, 90, -10]); hatch([[-90, -150], [-20, -190], [-20, -10], [-90, -10]], 0.8, 4, 0.2); }, 512);
      pc(ribbon(ep(0, -100, 150, 34, 24, -PI * 0.05, PI * 1.05), 12), '#c4b48e', () => strokePts(ep(0, -100, 146, 30, 24, 0, PI), 'rgba(255,255,255,0.35)', 1.2), 513);
    }), 8);
  }
  function makeLune() { return M.withShadow(M.cutFlat(100, 100, 50, 90, () => pc(ell(0, -40, 34, 34, 20), '#dcd6c4', () => { for (const [x, y, r] of [[-10, -50, 7], [8, -30, 5], [12, -54, 4]]) fillPts(ell(x, y, r, r, 10), 'rgba(150,140,120,0.45)'); shade(20, -60, -20, -20, 0.3, [-40, -80, 40, 0]); }, 514)), 6); }
  function makePlMilieu() {
    return full((c) => {
      const Hb = PL.hublot;
      // cloison du cockpit : panneaux d'acier rivetés (carton peint), percée du hublot
      pc([[300, 520], [360, 430], [470, 390, 1], [980, 380, 1], [1040, 420, 1], [1040, BACK + 20, 1], [250, BACK + 20, 1], [250, 900]], '#565a62', () => {
        for (let y = 420; y < BACK; y += 120) { strokePts([[260, y], [1040, y]], 'rgba(20,22,26,0.6)', 2); rivets(280, y + 8, 1030, y + 8, 40); }
        for (let x = 380; x < 1040; x += 160) strokePts([[x, 380], [x, BACK]], 'rgba(20,22,26,0.5)', 1.6);
        hatch(null, 0.8, 5, 0.18, 1, M.P.encre, [260, 380, 1040, BACK]); shade(1040, 0, 260, 0, 0.35, [260, 380, 1040, BACK]);
        fillPts([[300, 980], [1040, 980], [1040, 1000], [300, 1000]], 'rgba(30,32,36,0.6)');
      }, 521);
      c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(Hb.x, Hb.y, Hb.r, 0, TAU); c.fill(); c.restore();
      // cadre du hublot : anneau épais et montants COURBES (aucune croix)
      pc(ribbon(ep(Hb.x, Hb.y, Hb.r + 16, Hb.r + 16, 48, 0, TAU), 34), '#7a7e86', () => { strokePts(ep(Hb.x, Hb.y, Hb.r + 26, Hb.r + 26, 48, PI, PI * 1.6), 'rgba(255,255,255,0.35)', 2); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; dot(Hb.x + Math.cos(a) * (Hb.r + 16), Hb.y + Math.sin(a) * (Hb.r + 16), 3, '#3a3c42'); } }, 522);
      for (const [a0, a1] of [[-0.9, 0.9], [PI - 0.9, PI + 0.9]]) pc(ribbon(ep(Hb.x, Hb.y, Hb.r * 0.62, Hb.r * 1.02, 16, a0, a1), 9), '#6a6e76', null, 523);
      // console courbe gris acier (devant) avec rangées de lampes (allumées en direct), grilles, deux leviers (en direct)
      const C0 = PL.console;
      // sièges de pilote en cuir brun
      for (const [sx, sy, sd] of [[PL.siege.x, PL.siege.y, 524], [PL.siege2.x, PL.siege2.y, 525]]) {
        pc([[sx - 48, sy - 190], [sx - 20, sy - 200], [sx - 8, sy - 30, 1], [sx + 60, sy - 24], [sx + 64, sy + 4, 1], [sx - 50, sy + 10, 1]], '#6a3e24', () => { for (let y = sy - 180; y < sy; y += 30) strokePts([[sx - 44, y], [sx - 14, y - 4]], 'rgba(30,14,6,0.5)', 1.6); dot(sx - 30, sy - 120, 3, '#2a1a10'); shade(sx + 60, 0, sx - 50, 0, 0.3, [sx - 60, sy - 210, sx + 70, sy + 20]); }, sd);
        pc(box(sx - 10, sy + 6, sx + 12, BACK + 10), '#3a3c42', null, sd + 10);
      }
    });
  }
  function makePlConsole() {
    return full((c) => {
      const C0 = PL.console;
      pc([[C0.x0, C0.y + 40, 1], [C0.x0 + 120, C0.y + 4], [700, C0.y - 10], [C0.x1 + 10, C0.y + 6, 1], [C0.x1 + 10, BACK + 20, 1], [C0.x0 - 10, BACK + 20, 1]], '#6c7078', () => {
        fillPts([[C0.x0, C0.y + 40], [C0.x0 + 120, C0.y + 4], [700, C0.y - 10], [C0.x1 + 10, C0.y + 6], [C0.x1 + 10, C0.y + 20], [C0.x0, C0.y + 56]], '#8a8e96');
        for (let x = 420; x < 1030; x += 60) { fillPts(box(x, 1230, x + 44, 1290), '#4e5258'); for (let y = 1236; y < 1288; y += 6) strokePts([[x + 4, y], [x + 40, y]], 'rgba(20,20,24,0.6)', 1.2); }
        for (const L of LAMPS) { fillPts(ell(L.x, L.y, L.r + 2.5, L.r + 2.5, 12), '#3a3c42'); }
        rivets(C0.x0 + 20, 1320, 1030, 1320, 46);
        shade(0, C0.y, 0, BACK, 0.35, [C0.x0 - 20, C0.y - 20, C0.x1 + 20, BACK + 20]);
      }, 531);
      // câbles, caisse de matériel, palmier de carton, rampe d'accessoires (premier plan)
      pc(sh([[900, 1300], [1030, 1296], [1034, BACK + 10], [896, BACK + 10]]), '#7a5a34', () => { strokePts([[900, 1320], [1032, 1318]], 'rgba(30,18,8,0.6)', 2); for (const x of [920, 1010]) for (const y of [1310, 1370]) dot(x, y, 3, '#3a2a18'); hatch(null, 0.8, 4, 0.25); }, 532);
      const px = PL.palmier.x;
      pc(box(px - 34, 1310, px + 34, BACK + 10), '#8a4a2a', () => hatch(null, 0.8, 4, 0.3), 533);
      pc(ribbon(qbez([px, 1312], [px - 10, 1150], [px + 6, 990], 10), 18, 12), '#8a6a3a', () => { for (let y = 1000; y < 1300; y += 18) strokePts([[px - 14, y], [px + 14, y + 4]], 'rgba(40,24,10,0.5)', 1.4); }, 534);
      for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * 0.45, L = 150 + (i % 2) * 30, tip = [px + 6 + Math.cos(a) * L, 990 + Math.sin(a) * L * 0.6 + 60];
        pc(ribbon(qbez([px + 6, 990], [px + 6 + Math.cos(a) * L * 0.5, 990 + Math.sin(a) * L * 0.5 - 10], tip, 10), 26, 2), i % 2 ? '#4f6a3a' : '#5c7844', () => strokePts(qbez([px + 6, 990], [px + 6 + Math.cos(a) * L * 0.5, 990 + Math.sin(a) * L * 0.5 - 10], tip, 10), 'rgba(220,230,170,0.35)', 1.2), 535 + i); }
    });
  }
  function makeCamera() {     // caméra de cinéma années 70 sur trépied et chariot (aucune marque)
    return M.withShadow(M.cutFlat(300, 520, 150, 500, () => {
      pc(box(-110, -40, 110, -10), '#3a3c42', () => rivets(-100, -25, 100, -25, 40), 541);
      for (const x of [-90, 90]) pc(ell(x, -10, 16, 16, 12), '#1e1e22', () => dot(x, -10, 5, '#8a8a84'), 542 + x);
      for (const x1 of [-80, 0, 80]) pc(ribbon([[0, -250], [x1, -42]], 8), '#2a2a2e', null, 545 + x1);
      pc(box(-60, -330, 90, -250), '#1c1c20', () => { strokePts([[-56, -326], [86, -326]], 'rgba(255,255,255,0.25)', 1.4); fillPts(box(-40, -300, 0, -270), '#2c2c30'); }, 548);
      pc([[90, -310], [140, -320], [140, -260], [90, -270]], '#2a2a2e', () => fillPts(ell(140, -290, 8, 26, 10), '#4a5a6a'), 549);
      for (const x of [-20, 50]) pc(ell(x, -380, 48, 48, 22), '#1c1c20', () => { fillPts(ell(x, -380, 18, 18, 12), '#3a3a3e'); for (let k = 0; k < 3; k++) { const a = k * TAU / 3; fillPts(rot(box(x - 4, -380 - 40, x + 4, -380 - 20), a, x, -380), '#3a3a3e'); } }, 550 + x);
      pc(ribbon([[-60, -300], [-130, -240]], 7), '#3a3a3e', null, 553);
    }), 8);
  }
  function makeProjo() {      // projecteur de tournage à volets (sans texte)
    return M.withShadow(M.cutFlat(220, 220, 110, 200, () => {
      pc(ribbon(ep(0, -60, 70, 70, 16, PI * 0.9, PI * 2.1), 10), '#2a2a2e', null, 561);
      pc(rrect(-60, -130, 60, 0, 14), '#2e3034', () => { fillPts(ell(0, -10, 50, 8, 16), '#1a1a1c'); for (let x = -50; x < 60; x += 14) strokePts([[x, -126], [x, -110]], 'rgba(255,255,255,0.15)', 2); }, 562);
      for (const s of [-1, 1]) pc([[s * 56, -4], [s * 92, 30], [s * 82, 36], [s * 50, 4]], '#24262a', null, 563 + s);
    }), 6);
  }
  CHW.plateau = function (t, up, o) {
    o = o || {}; up = up || 0; const K = CHW.K, c = cx_(), g = M.tg(t), cou = clamp(o.coulisses || 0), cl = o.clignote || 1;
    const fond = o.couche !== 'avant', avant = o.couche !== 'fond';
    c.save(); c.translate(0, -up);
    if (fond) {
      c.drawImage(K.plFond, 0, 0);
      for (const S of STARS) { const k = 0.45 + 0.55 * Math.abs(Math.sin(g * S.f + S.ph)); fillPts(star4(S.x, S.y, S.r * (0.7 + 0.3 * k)), `rgba(225,228,240,${k})`, 0, 0); }
      // planète (descend des cintres avec o.planete 0 → 1) et lune, suspendues
      const pk = clamp(o.planete == null ? 1 : o.planete), py = PL.planete.y - (1 - ease(pk)) * 700;
      if (pk < 1) for (const dx of [-60, 60]) strokePts([[PL.planete.x + dx, py - 230], [PL.planete.x + dx, 0]], 'rgba(200,200,200,0.5)', 1.1);
      M.hung(K.planete, PL.planete.x, py, t, { f: 0.6, amp: 0.025, cast: { a: 0.3, dx: 12, dy: 6 } });
      M.hung(K.lune, PL.lune.x, PL.lune.y, t, { f: 0.8, ph: 1, amp: 0.03 });
      // étoiles qui défilent dans le hublot
      const Hb = PL.hublot;
      if (!SIL()) {
        c.save(); c.beginPath(); c.arc(Hb.x, Hb.y, Hb.r, 0, TAU); c.clip();
        c.fillStyle = '#0a0c18'; c.fillRect(Hb.x - Hb.r, Hb.y - Hb.r, 2 * Hb.r, 2 * Hb.r);
        const R = M.rng(504); for (let i = 0; i < 46; i++) { const sp = 30 + R() * 90, x = Hb.x + Hb.r - (((R() * 2 * Hb.r + g * sp) % (2 * Hb.r + 40)) - 20), y = Hb.y - Hb.r + R() * 2 * Hb.r, r = 1 + R() * 2.4; strokePts([[x, y], [x + sp * 0.12, y]], `rgba(220,230,255,${0.4 + R() * 0.5})`, r); }
        const gg = c.createRadialGradient(Hb.x - 60, Hb.y - 60, 10, Hb.x, Hb.y, Hb.r); gg.addColorStop(0, 'rgba(120,140,200,0.12)'); gg.addColorStop(1, 'rgba(0,0,0,0.3)'); c.fillStyle = gg; c.fillRect(Hb.x - Hb.r, Hb.y - Hb.r, 2 * Hb.r, 2 * Hb.r);
        c.restore();
      }
      c.drawImage(K.plMilieu, 0, 0);
      // coulisses : projecteur qui descend des cintres, perche de son
      if (cou > 0) {
        const kp = ease(clamp(cou / 0.8)), y = lerp(-80, PL.projo.y, kp) + M.wob(g, 0, 0, 1, 1);
        strokePts([[PL.projo.x, y - 200], [PL.projo.x, 0]], 'rgba(20,20,22,0.8)', 1.6);
        M.flat(K.projo, PL.projo.x, y, { rot: -0.25 + 0.01 * Math.sin(g * 1.2), cast: { a: 0.3, dx: 10, dy: 5 } });
        const kb = clamp(o.projecteur == null ? smooth(0.9, 1, cou) : o.projecteur);
        if (kb > 0) { beam(PL.projo.x + 20, y - 10, 260, 1390, 700, 1390, 0.2 * kb); M.poussiere(t, { x: 330, y: y + 100, w: 300, h: 800, n: 30, a: 0.6 * kb, seed: 71 }); glow(PL.projo.x + 30, y - 10, 70, '255,235,190', 0.5 * kb); }
        const kq = ease(clamp((cou - 0.2) / 0.8)), tip = [lerp(1200, PL.perche.x, kq), PL.perche.y + 4 * Math.sin(g * 0.9)];
        pc(ribbon([[1120, 220], tip], 7), '#3a3a3e', null, 571);
        strokePts([[tip[0], tip[1] + 6], [tip[0], tip[1] + 40]], '#1a1a1a', 1.4);
        pc(rrect(tip[0] - 40, tip[1] + 40, tip[0] + 10, tip[1] + 62, 8), '#8a8a82', () => { for (let x = tip[0] - 36; x < tip[0] + 8; x += 4) strokePts([[x, tip[1] + 42], [x, tip[1] + 60]], 'rgba(40,40,40,0.4)', 0.8); }, 572);
      }
    }
    if (avant) {
      c.drawImage(K.plConsole, 0, 0);
      for (const L of LAMPS) { const on = Math.sin(g * L.f * cl + L.ph) > 0.1; fillPts(ell(L.x, L.y, L.r, L.r, 10), on ? L.col : mixA(L.col, '#202024', 0.75), 0, 0); if (on) { dot(L.x - 1.5, L.y - 1.5, 1.6, 'rgba(255,255,255,0.7)'); glow(L.x, L.y, 14, L.col === '#e04a32' ? '255,90,60' : L.col === '#e8a632' ? '255,190,80' : '140,255,140', 0.35); } }
      PL.leviers.forEach(([lx, ly], i) => {
        const a = (o.levier == null ? 0 : o.levier) * (i ? 0.5 : 0.9) - 0.35 + 0.02 * Math.sin(g + i);
        pc(box(lx - 12, ly + 20, lx + 12, ly + 34), '#2a2c30', null, 575 + i);
        const tip = [lx + Math.sin(a) * 80, ly + 26 - Math.cos(a) * 80];
        pc(ribbon([[lx, ly + 26], tip], 7), '#b9b9b2', null, 577 + i); pc(ell(tip[0], tip[1], 10, 10, 12), i ? '#8e2a22' : '#2a2a2e', () => dot(tip[0] - 3, tip[1] - 3, 2.5, 'rgba(255,255,255,0.5)'), 579 + i);
      });
      // câbles qui pendent des cintres
      for (const [x, L, ph] of [[180, 300, 0], [214, 240, 1.2], [1000, 360, 2.1]]) { const sw = 8 * Math.sin(g * 0.7 + ph); strokePts(qbez([x, 150], [x + sw, 150 + L * 0.6], [x + sw * 1.6 + 6, 150 + L], 10), '#1a1a1c', 3); }
      // coulisses : caméra sur son chariot qui entre par la gauche
      if (cou > 0) { const kc = ease(clamp(cou / 0.9)); M.flat(K.camera, lerp(-220, PL.camera.x, kc) + M.wob(g, 0, 0, 1, 1), BACK + 6, { scale: 0.9, cast: { a: 0.3, dx: 12, dy: 6 } }); }
    }
    c.restore();
  };

  // =====================================================================
  // FERME D'ANIMAUX (P3, P4) — collines dorées, chênes ronds, montagnes bleutées ; grange rouge à toit de tôle, éolienne américaine,
  // enclos, abreuvoir, meules ; clôture basse, seau, fourche, herbes ; bassin (monte de la trappe à droite), terrier (butte au centre-gauche)
  // =====================================================================
  const FE = { grange: { x0: 70, x1: 400, y: 800 }, eolienne: { x: 880, y: 610, r: 104 }, enclos: { x0: 560, x1: 1034, y: 1250 }, abreuvoir: { x: 470 }, bassin: { x0: 690, x1: 1010, h: 110 }, terrier: { x: 430, trou: [400, 1376] }, crete: 760 };
  CHW.FERME = FE;
  function makeFeFond() {
    return full((c) => {
      const g = c.createLinearGradient(0, 150, 0, 900); g.addColorStop(0, '#9fb6c6'); g.addColorStop(1, '#dfe2d4'); c.fillStyle = g; c.fillRect(0, 0, W, BACK + 40);
      // montagnes bleutées
      const mt = [[-10, 760]]; for (let x = 0; x <= W + 20; x += 60) mt.push([x, 640 - Math.abs(Math.sin(x * 0.006 + 1)) * 110 - Math.sin(x * 0.021) * 18]); mt.push([W + 20, 800], [-10, 800]);
      fillPts(mt, '#8a9cb0', 1, 1);
      // collines dorées (deux plans), crête plate x 560–920 pour le cheval
      for (const [y0, amp, col, sd] of [[760, 40, '#b99a5a', 2], [870, 60, '#c9a35a', 3]]) {
        const h = [[-10, BACK + 40]]; for (let x = -10; x <= W + 20; x += 30) h.push([x, y0 - amp * Math.sin(x * 0.008 + sd) * (x > 540 && x < 940 && sd === 2 ? 0.1 : 1)]); h.push([W + 20, BACK + 40]);
        pc(h, col, () => { hatch(null, 0.5, 6, 0.12, 1, '120,90,40', [0, y0 - 100, W, BACK]); for (let i = 0; i < 60; i++) strokePts([[hash(i * 3.1 + sd) * W, y0 + 20 + hash(i * 5.7) * 300], [hash(i * 3.1 + sd) * W + 8, y0 + 18 + hash(i * 5.7) * 300]], 'rgba(120,90,40,0.25)', 1); }, 600 + sd, { drop: false });
      }
      // chênes ronds et sombres sur les crêtes
      for (const [x, y, s] of [[120, 720, 1], [210, 732, 0.7], [470, 800, 0.8], [980, 708, 1.1], [1040, 726, 0.7], [700, 832, 0.6]]) {
        pc(box(x - 4 * s, y - 20 * s, x + 4 * s, y + 4), '#3a2e22', null, 610 + x);
        pc(poilu(ell(x, y - 46 * s, 46 * s, 32 * s, 14), 4, 611 + x, 10), '#3e4a2c', () => { fillPts(ell(x - 12 * s, y - 54 * s, 20 * s, 12 * s, 10), 'rgba(110,130,80,0.4)'); }, 612 + x, { drop: false });
      }
    });
  }
  function makeFeMilieu() {
    return full((c) => {
      const G = FE.grange;
      // grange rouge éteint à toit de tôle (pignon de face), portes à croisillon EN DIAGONALE simple
      pc(sh([[G.x0, BACK + 10], [G.x0, G.y + 110], [(G.x0 + G.x1) / 2, G.y - 10], [G.x1, G.y + 110], [G.x1, BACK + 10]]), '#8a3a2c', () => {
        for (let x = G.x0 + 10; x < G.x1; x += 16) strokePts([[x, G.y], [x, BACK]], 'rgba(40,12,8,0.35)', 1.2);
        const dx0 = G.x0 + 90, dx1 = G.x1 - 90; fillPts(box(dx0, 1130, dx1, BACK + 10), '#6e2a20'); strokePts(box(dx0, 1130, dx1, BACK + 10), '#e6dcc4', 4, true); strokePts([[dx0, 1130], [dx1, BACK]], '#e6dcc4', 4);
        fillPts(box((G.x0 + G.x1) / 2 - 30, 960, (G.x0 + G.x1) / 2 + 30, 1030), '#2a1410'); strokePts(box((G.x0 + G.x1) / 2 - 30, 960, (G.x0 + G.x1) / 2 + 30, 1030), '#e6dcc4', 3, true);
        shade(G.x1, 0, G.x0, 0, 0.3, [G.x0, G.y - 20, G.x1, BACK]);
      }, 621);
      pc(sh([[G.x0 - 26, G.y + 124], [(G.x0 + G.x1) / 2, G.y - 30], [G.x1 + 26, G.y + 124], [G.x1 + 8, G.y + 132], [(G.x0 + G.x1) / 2, G.y - 4], [G.x0 - 8, G.y + 132]]), '#8e9296', () => { for (let i = 0; i < 20; i++) { const u = i / 20; strokePts([[lerp(G.x0 - 26, (G.x0 + G.x1) / 2, u), lerp(G.y + 124, G.y - 30, u)], [lerp(G.x0 - 8, (G.x0 + G.x1) / 2, u), lerp(G.y + 132, G.y - 4, u)]], 'rgba(40,44,48,0.4)', 1.2); } }, 622);
      // pylône de l'éolienne (treillis)
      const E = FE.eolienne;
      for (const s of [-1, 1]) pc(ribbon([[E.x + s * 8, E.y + 10], [E.x + s * 70, BACK + 6]], 7), '#5a5a5e', null, 623 + s);
      for (let y = E.y + 60; y < BACK; y += 90) { const w0 = 8 + (y - E.y) / (BACK - E.y) * 62, w1 = 8 + (y + 90 - E.y) / (BACK - E.y) * 62; strokePts([[E.x - w0, y], [E.x + w1, y + 90]], '#5a5a5e', 2.4); strokePts([[E.x + w0, y], [E.x - w1, y + 90]], '#5a5a5e', 2.4); strokePts([[E.x - w0, y], [E.x + w0, y]], '#5a5a5e', 2.4); }
      // meules de foin, abreuvoir
      for (const [x, w, h] of [[470, 110, 70], [1000, 120, 80]]) pc(box(x - w / 2, BACK - 150 - h, x + w / 2, BACK - 150), '#d8b860', () => { for (let i = 0; i < 30; i++) strokePts([[x - w / 2 + hash(i + x) * w, BACK - 150 - h + hash(i * 3 + x) * h], [x - w / 2 + hash(i + x) * w + 8, BACK - 152 - h + hash(i * 3 + x) * h]], 'rgba(140,100,30,0.5)', 1.2); fillPts(box(x - w / 2, BACK - 150 - h * 0.45, x + w / 2, BACK - 150 - h * 0.38), '#8a6a2a'); }, 630 + x);
      pc(sh([[FE.abreuvoir.x - 70, 1290], [FE.abreuvoir.x + 70, 1290], [FE.abreuvoir.x + 60, 1340], [FE.abreuvoir.x - 60, 1340]]), '#6e7478', () => { fillPts(box(FE.abreuvoir.x - 66, 1290, FE.abreuvoir.x + 66, 1298), '#5e8a9a'); rivets(FE.abreuvoir.x - 60, 1320, FE.abreuvoir.x + 60, 1320, 30); }, 633);
      for (const x of [FE.abreuvoir.x - 50, FE.abreuvoir.x + 50]) pc(box(x - 5, 1340, x + 5, BACK + 8), '#4a3a2a', null, 634 + x);
    });
  }
  function makeFeAvant() {
    return full((c) => {
      // enclos : barrière de bois à trois lisses (l'ourson monte derrière), poteaux
      const Q = FE.enclos;
      for (let x = Q.x0; x <= Q.x1; x += 96) pc(box(x - 8, Q.y - 14, x + 8, BACK + 10), '#7a5a3a', () => { strokePts([[x - 4, Q.y - 10], [x - 4, BACK]], 'rgba(255,230,190,0.2)', 1.5); hatch(null, 0.9, 4, 0.3); }, 640 + x);
      for (const y of [Q.y, Q.y + 50, Q.y + 100]) pc(box(Q.x0 - 10, y, Q.x1 + 10, y + 16), '#8a6a44', () => { for (let x = Q.x0; x < Q.x1; x += 40) strokePts([[x, y + 4], [x + 26, y + 8]], 'rgba(60,40,20,0.4)', 1); }, 650 + y);
      // clôture basse (gauche), seau, fourche appuyée, panneau de bois sans lettre
      for (let x = 60; x < 300; x += 60) pc(box(x - 5, 1300, x + 5, BACK + 10), '#6e5236', null, 660 + x);
      pc(box(50, 1316, 300, 1328), '#7e6040', null, 666);
      pc(sh([[150, 1340], [196, 1340], [190, BACK + 6], [156, BACK + 6]]), '#8a8e92', () => { strokePts([[150, 1352], [196, 1352]], 'rgba(40,40,40,0.5)', 1.4); strokePts(ep(173, 1340, 26, 22, 12, PI, TAU), '#4a4a4e', 1.6); }, 667);
      pc(ribbon([[420, 1390], [380, 1150]], 6), '#9a7444', null, 668);
      pc([[364, 1150], [396, 1150], [394, 1100], [388, 1150], [382, 1096], [378, 1150], [372, 1100]], '#6a6e72', null, 669);
      pc(box(940, 1250, 1030, 1310), '#8a6a44', () => { for (let y = 1258; y < 1306; y += 12) strokePts([[944, y], [1026, y]], 'rgba(60,40,20,0.45)', 1.2); }, 670);
      pc(box(980, 1310, 992, BACK + 8), '#6e5236', null, 671);
    });
  }
  CHW.ferme = function (t, up, o) {
    o = o || {}; up = up || 0; const K = CHW.K, c = cx_(), g = M.tg(t), vent = o.vent || 1;
    const fond = o.couche !== 'avant', avant = o.couche !== 'fond';
    c.save(); c.translate(0, -up);
    if (fond) {
      c.drawImage(K.feFond, 0, 0);
      M.nuages(t, { y0: 300, y1: 520, n: 4, vit: 10, seed: 31 });
      M.oiseaux(g, { x0: -80, x1: 1160, y: 470, n: 5, s: 0.6, dur: 16, boucle: true, brume: 0.4, seed: 32 });
      M.passage('cheval', g, { x0: 600, x1: 900, y: FE.crete - 4, s: 0.28, broute: 0.7, dur: 40, boucle: true, brume: 0.45, seed: 33 });
      c.drawImage(K.feMilieu, 0, 0);
      // roue de l'éolienne (18 pales) + gouvernail ; vent = vitesse
      const E = FE.eolienne, a = g * 1.1 * vent;
      pc([[E.x - 10, E.y - 6], [E.x - 130, E.y - 30], [E.x - 150, E.y - 10], [E.x - 130, E.y + 10]], '#a8aaa8', null, 681);
      if (!SIL()) for (let i = 0; i < 18; i++) { const b = a + i * TAU / 18, cs = Math.cos(b), sn = Math.sin(b); fillPts([[E.x + cs * 26, E.y + sn * 26], [E.x + Math.cos(b - 0.12) * E.r, E.y + Math.sin(b - 0.12) * E.r], [E.x + Math.cos(b + 0.06) * E.r, E.y + Math.sin(b + 0.06) * E.r]], i % 2 ? '#c4c6c2' : '#9a9c98', 0, 0); }
      strokePts(ep(E.x, E.y, E.r, E.r, 36, 0, TAU), '#6a6c6a', 2); strokePts(ep(E.x, E.y, E.r * 0.55, E.r * 0.55, 24, 0, TAU), '#6a6c6a', 1.6); dot(E.x, E.y, 9, '#4a4a4e');
      // poussière dorée dans le soleil
      M.poussiere(t, { x: 480, y: 520, w: 380, h: 700, n: 24, a: 0.45, seed: 34 });
      // terrier : butte de terre qui pousse (trou noir au centre-gauche)
      const tk = clamp(o.terrier || 0);
      if (tk > 0) { const T = FE.terrier, hh = 90 * ease(tk); c.save(); c.beginPath(); c.rect(0, 0, W, BACK + 2); c.clip(); pc([[T.x - 150, BACK + 4], [T.x - 110, BACK - hh * 0.7], [T.x - 30, BACK - hh], [T.x + 60, BACK - hh * 0.9], [T.x + 140, BACK + 4]], '#7a5a3a', () => { fillPts(ell(T.trou[0], BACK - hh * 0.35, 46, 30 * ease(tk), 16), '#120c08'); for (let i = 0; i < 14; i++) dot(T.x - 120 + hash(i) * 240, BACK - hash(i * 3) * hh, 3, 'rgba(60,40,20,0.5)'); }, 690); c.restore(); }
    }
    if (avant) {
      c.drawImage(K.feAvant, 0, 0);
      // bassin bleu-vert à bord de pierre (monte de la trappe à droite), eau qui ondule
      const bk = clamp(o.bassin || 0);
      if (bk > 0) {
        const B = FE.bassin, y = BACK - B.h * ease(bk);
        c.save(); c.beginPath(); c.rect(0, 0, W, BACK + 2); c.clip();
        pc(sh([[B.x0, y + 20], [B.x0 + 20, y], [B.x1 - 20, y], [B.x1, y + 20], [B.x1, BACK + 40], [B.x0, BACK + 40]]), '#8a8a80', () => { for (let x = B.x0; x < B.x1; x += 44) for (let yy = y; yy < BACK + 40; yy += 30) strokePts(box(x + ((yy / 30) % 2) * 22, yy, x + 40 + ((yy / 30) % 2) * 22, yy + 28), 'rgba(50,50,44,0.5)', 1.2, true); }, 691);
        const wy = y + 18;
        if (!SIL()) { const wv = []; for (let x = B.x0 + 20; x <= B.x1 - 20; x += 10) wv.push([x, wy + 4 * Math.sin(x * 0.05 + g * 2.2)]); wv.push([B.x1 - 20, wy + 40], [B.x0 + 20, wy + 40]); fillPts(wv, '#4f8a84', 0, 0); for (let i = 0; i < 4; i++) { const x = B.x0 + 60 + i * 70 + 10 * Math.sin(g + i); strokePts([[x, wy + 10], [x + 26, wy + 10]], 'rgba(230,245,240,0.5)', 1.6); } }
        c.restore();
      }
      M.fleurs(t, { x0: 60, x1: 1020, y: BACK + 2, n: 34, h: 46, seed: 35, cols: ['#d8c070', '#e8dcb0', '#c9a35a'] });
    }
    c.restore();
  };

  // =====================================================================
  // STUDIO DE MONTAGE (P5, P6) — mur capitonné en damier, étagères de bobines, affiches sans texte, horloge ; écran de projection (faisceau),
  // table de montage à deux plateaux, magnétophone à grandes bobines, console de mixage + deux vu-mètres, chariot à bandes ; tabouret, corbeille,
  // tasse fumante, lampe de bureau
  // =====================================================================
  const ST_ = { ecran: { x0: 110, x1: 420, y0: 330, y1: 560 }, projo: { x: 1010, y: 380 }, table: { x0: 150, x1: 560, y: 1176 }, plateaux: [[250, 1168], [440, 1168]],
    magneto: { x0: 590, x1: 760, y0: 760 }, bobines: [[632, 830], [720, 830]], tetes: [676, 930], console: { x0: 770, x1: 1034, y: 1170 }, vu: [[820, 1060], [940, 1060]],
    chariot: { x0: 760, x1: 1000, y: 590 }, horloge: { x: 540, y: 300 }, tasse: [520, 1176], lampe: { x: 190, y: 1176 }, etagere: { x0: 440, x1: 700, y: [430, 560] }, corbeille: 990, tabouret: 110 };
  CHW.STUDIO = ST_;
  function makeStFond() {
    return full((c) => {
      c.fillStyle = '#5a4030'; c.fillRect(0, 0, W, BACK + 40);
      const P = 86;
      for (let y = 150, j = 0; y < BACK; y += P, j++) for (let x = 0, i = 0; x < W; x += P, i++) pc(box(x + 3, y + 3, x + P - 3, y + P - 3), (i + j) % 2 ? '#7a5638' : '#9a7444', () => { strokePts([[x + 6, y + 6], [x + P - 6, y + P - 6]], 'rgba(40,24,12,0.25)', 1.2); strokePts([[x + P - 6, y + 6], [x + 6, y + P - 6]], 'rgba(40,24,12,0.25)', 1.2); dot(x + P / 2, y + P / 2, 3, 'rgba(40,24,12,0.6)'); shade(x + P, y, x, y + P, 0.25, [x, y, x + P, y + P]); }, 700 + i * 31 + j, { drop: false });
      const sh = c.createLinearGradient(0, 150, 0, BACK); sh.addColorStop(0, 'rgba(20,10,6,0.55)'); sh.addColorStop(0.3, 'rgba(20,10,6,0.1)'); sh.addColorStop(1, 'rgba(20,10,6,0.35)'); c.fillStyle = sh; c.fillRect(0, 150, W, BACK);
      // étagères de bobines rondes empilées
      const E = ST_.etagere;
      for (const y of E.y) {
        pc(box(E.x0, y, E.x1, y + 12), '#5a3a22', () => strokePts([[E.x0, y + 2], [E.x1, y + 2]], 'rgba(255,220,170,0.3)', 1.2), 710 + y);
        for (let x = E.x0 + 26, k = 0; x < E.x1 - 20; x += 48, k++) { const r = 20 + (k % 3) * 2; pc(ell(x, y - r, r, r, 18), ['#3a3a3e', '#6a4426', '#8a8a84'][k % 3], () => { fillPts(ell(x, y - r, r * 0.35, r * 0.35, 10), '#c9c6bc'); for (let a = 0; a < 3; a++) fillPts(rot(box(x - 2, y - r - r * 0.85, x + 2, y - r - r * 0.4), a * TAU / 3, x, y - r), '#c9c6bc', 0, 0); }, 720 + x + y); }
      }
      // affiches de film sans texte : une planète, une étoile éclatante (rayons fins)
      pc(box(760, 250, 900, 440), '#e0d6bc', () => { fillPts(box(770, 260, 890, 430), '#1e2438'); fillPts(ell(830, 350, 34, 34, 18), '#b8873e'); strokePts(ep(830, 350, 58, 14, 20, 0, TAU), '#c4b48e', 3); for (let i = 0; i < 12; i++) dot(780 + hash(i) * 100, 270 + hash(i * 3) * 150, 1.4, '#e8e8f0'); }, 731);
      pc(box(930, 270, 1034, 430), '#e0d6bc', () => { fillPts(box(938, 278, 1030, 422), '#3a2236'); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 22 : 42; strokePts([[984, 350], [984 + Math.cos(a) * r, 350 + Math.sin(a) * r]], '#e8c870', i % 2 ? 1.4 : 2.4); } fillPts(ell(984, 350, 8, 8, 10), '#fff2c8'); }, 732);
      // écran de projection (toile blanche sur cadre)
      const S = ST_.ecran;
      pc(box(S.x0 - 12, S.y0 - 12, S.x1 + 12, S.y1 + 12), '#2a2a2c', null, 733);
      fillPts(box(S.x0, S.y0, S.x1, S.y1), '#d8d4c8');
      strokePts([[S.x0 - 20, S.y0 - 16], [S.x1 + 20, S.y0 - 16]], '#1a1a1c', 6);
      // lucarne de la cabine de projection
      pc(box(ST_.projo.x - 30, ST_.projo.y - 26, ST_.projo.x + 30, ST_.projo.y + 26), '#2a2420', () => fillPts(ell(ST_.projo.x - 10, ST_.projo.y, 12, 12, 12), '#0e0c0a'), 734);
    });
  }
  function makeStMilieu() {
    return full((c) => {
      // chariot à bandes : barre à crochets (les rubans pendent en direct)
      const Ch = ST_.chariot;
      pc(box(Ch.x0, Ch.y - 8, Ch.x1, Ch.y + 6), '#8a8a84', () => strokePts([[Ch.x0, Ch.y - 6], [Ch.x1, Ch.y - 6]], 'rgba(255,255,255,0.5)', 1.4), 741);
      for (const x of [Ch.x0 + 10, Ch.x1 - 10]) pc(box(x - 6, Ch.y, x + 6, BACK + 10), '#6a6a64', null, 742 + x);
      for (const x of [Ch.x0, Ch.x1]) for (const s of [-1, 1]) pc(ell(x + 10 * (x === Ch.x0 ? 1 : -1) + s * 30, BACK - 4, 10, 10, 10), '#1e1e22', null, 744 + x + s);
      // magnétophone de studio à grandes bobines (meuble)
      const Mg = ST_.magneto;
      pc(box(Mg.x0, Mg.y0, Mg.x1, BACK + 10), '#8e8c84', () => {
        fillPts(box(Mg.x0 + 8, Mg.y0 + 8, Mg.x1 - 8, Mg.y0 + 230), '#3a3a3e');
        fillPts(box(Mg.x0 + 30, 912, Mg.x1 - 30, 950), '#c9c9c2'); for (const x of [650, 676, 702]) fillPts(box(x - 7, 916, x + 7, 946), '#7a7a74');
        for (let i = 0; i < 5; i++) fillPts(box(Mg.x0 + 22 + i * 26, 1000, Mg.x0 + 40 + i * 26, 1018), i === 4 ? '#8e2a22' : '#2a2a2e');
        for (let y = 1060; y < BACK; y += 12) strokePts([[Mg.x0 + 14, y], [Mg.x1 - 14, y]], 'rgba(40,40,40,0.35)', 1.2);
        shade(Mg.x1, 0, Mg.x0, 0, 0.3, [Mg.x0, Mg.y0, Mg.x1, BACK]);
      }, 751);
      // table de montage grise (pieds) et son plateau (les deux plateaux tournent en direct)
      const T = ST_.table;
      pc(sh([[T.x0, T.y], [T.x1, T.y], [T.x1 - 10, T.y + 30], [T.x0 + 10, T.y + 30]]), '#7a7e82', () => { strokePts([[T.x0, T.y + 2], [T.x1, T.y + 2]], 'rgba(255,255,255,0.4)', 1.6); fillPts(box(320, T.y + 6, 380, T.y + 26), '#2e3034'); for (let i = 0; i < 4; i++) dot(330 + i * 14, T.y + 16, 3, i === 3 ? '#e8a632' : '#9a9a94'); }, 752);
      for (const x of [T.x0 + 24, T.x1 - 24]) pc(box(x - 9, T.y + 30, x + 9, BACK + 10), '#5a5e62', null, 753 + x);
      pc(box(T.x0 + 40, T.y + 60, T.x1 - 40, T.y + 150), '#6a6e72', () => { for (let x = T.x0 + 60; x < T.x1 - 50; x += 60) strokePts(box(x, T.y + 70, x + 46, T.y + 140), 'rgba(30,30,30,0.4)', 1.2, true); }, 755);
      // console de mixage (dessinée dans la couche 'avant')
    });
  }
  function makeStAvant() {
    return full((c) => {
      const Co = ST_.console;
      pc(sh([[Co.x0, Co.y - 140], [Co.x1 + 10, Co.y - 150], [Co.x1 + 10, Co.y], [Co.x0, Co.y]]), '#4e4a44', () => { for (const [x, y] of ST_.vu) { fillPts(box(x - 46, y - 34, x + 46, y + 30), '#1e1e20'); fillPts(ep(x, y + 22, 40, 44, 16, PI * 1.15, PI * 1.85).concat([[x + 32, y + 20], [x - 32, y + 20]]), '#e8dcb0'); for (let i = 0; i <= 8; i++) { const a = PI * 1.2 + i / 8 * PI * 0.6; strokePts([[x + Math.cos(a) * 34, y + 22 + Math.sin(a) * 38], [x + Math.cos(a) * 40, y + 22 + Math.sin(a) * 44]], i > 5 ? '#8e2a22' : '#2a2a2a', 1.4); } } }, 761);
      pc(sh([[Co.x0 - 20, Co.y], [Co.x1 + 10, Co.y - 10], [Co.x1 + 10, BACK + 10], [Co.x0, BACK + 10]]), '#5e5a54', () => {
        fillPts([[Co.x0 - 20, Co.y], [Co.x1 + 10, Co.y - 10], [Co.x1 + 10, Co.y + 50], [Co.x0 - 14, Co.y + 60]], '#6e6a62');
        for (let i = 0; i < 6; i++) { const x = Co.x0 + 20 + i * 40; for (let k = 0; k < 2; k++) { dot(x, Co.y + 14 + k * 20, 7, '#2a2a2c'); strokePts([[x, Co.y + 14 + k * 20], [x + 3, Co.y + 8 + k * 20]], '#e8dcb0', 1.6); } fillPts(box(x - 2, Co.y + 66, x + 2, Co.y + 150), '#1e1e20'); }
        for (let y = Co.y + 170; y < BACK; y += 14) strokePts([[Co.x0, y], [Co.x1, y]], 'rgba(20,20,20,0.35)', 1.2);
        shade(0, Co.y, 0, BACK, 0.35, [Co.x0 - 20, Co.y - 20, Co.x1 + 20, BACK + 10]);
      }, 762);
      // tabouret, corbeille de chutes de bande
      const tb = ST_.tabouret;
      pc(ell(tb, 1250, 46, 12, 16), '#8e2a22', null, 771); for (const s of [-1, 1]) pc(ribbon([[tb + s * 20, 1256], [tb + s * 40, BACK + 8]], 8), '#3a3a3e', null, 772 + s);
      const cb = ST_.corbeille;
      pc(sh([[cb - 44, 1290], [cb + 44, 1290], [cb + 34, BACK + 8], [cb - 34, BACK + 8]]), '#4a5a52', () => { for (let x = cb - 40; x < cb + 44; x += 10) strokePts([[x, 1292], [x * 0.9 + cb * 0.1, BACK]], 'rgba(20,30,24,0.5)', 1.2); }, 775);
      for (let i = 0; i < 9; i++) { const x = cb - 40 + i * 10, h = 20 + hash(i * 3.3) * 40; pc(ribbon(qbez([x, 1296], [x + (hash(i) - 0.5) * 40, 1296 - h * 0.6], [x + (hash(i * 7) - 0.5) * 60, 1296 - h], 6), 7, 5), '#6a4426', null, 776 + i); }
    });
  }
  CHW.studio = function (t, up, o) {
    o = o || {}; up = up || 0; const K = CHW.K, c = cx_(), g = M.tg(t), ec = clamp(o.ecran || 0), lamp = clamp(o.lampe == null ? 1 : o.lampe);
    const fond = o.couche !== 'avant', avant = o.couche !== 'fond';
    c.save(); c.translate(0, -up);
    if (fond) {
      c.drawImage(K.stFond, 0, 0);
      M.pendule(t, { x: ST_.horloge.x, y: ST_.horloge.y, s: 0.62, per: 2 });
      // écran : faisceau du projecteur + image (drawEcran(cx, cy, w, h, k))
      const S = ST_.ecran;
      if (ec > 0) {
        if (!SIL()) { c.save(); c.globalAlpha = ec; c.fillStyle = '#f4ecd6'; c.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0); c.restore(); }
        if (o.drawEcran && ec > 0.3) { c.save(); c.beginPath(); c.rect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0); c.clip(); c.globalAlpha = clamp((ec - 0.3) / 0.5); o.drawEcran((S.x0 + S.x1) / 2, (S.y0 + S.y1) / 2, S.x1 - S.x0, S.y1 - S.y0, ec); c.restore(); }
        beam(ST_.projo.x - 10, ST_.projo.y, S.x1, S.y0, S.x1, S.y1, 0.2 * ec);
        M.poussiere(t, { x: S.x1, y: S.y0 - 20, w: ST_.projo.x - S.x1 - 40, h: 260, n: 26, a: 0.55 * ec, seed: 81 });
        glow(ST_.projo.x - 10, ST_.projo.y, 60, '255,240,200', 0.5 * ec);
      }
      c.drawImage(K.stMilieu, 0, 0);
      // rubans de bande qui pendent du chariot (balancent)
      const Ch = ST_.chariot;
      for (let i = 0; i < 7; i++) { const x = Ch.x0 + 26 + i * 32, L = 90 + hash(i * 5.1) * 110, sw = 7 * Math.sin(g * 0.9 + i * 1.3); dot(x, Ch.y + 6, 3, '#4a4a4e'); pc(ribbon(qbez([x, Ch.y + 8], [x + sw * 0.5, Ch.y + 8 + L * 0.5], [x + sw, Ch.y + 8 + L], 8), 9, 8), i % 3 ? '#6a4426' : '#5a3a20', null, 790 + i, { drop: false }); }
      // grandes bobines du magnétophone + plateaux de la table de montage : tournent (vitesse o.bobines, défaut 1,6 rad/s)
      const sp = o.bobines == null ? 1.6 : o.bobines;
      const bob = (x, y, r, a, col) => { pc(ell(x, y, r, r, 26), col, () => { fillPts(ell(x, y, r * 0.62, r * 0.62, 20), '#5a3a20'); for (let k = 0; k < 3; k++) { const b = a + k * TAU / 3; fillPts(rot(ep(x, y - r * 0.55, r * 0.22, r * 0.22, 10, 0, TAU), b, x, y), 'rgba(20,20,22,0.9)', 0, 0); } fillPts(ell(x, y, r * 0.16, r * 0.16, 10), '#c9c9c2'); dot(x, y, 3, '#2a2a2e'); }, 800 + x, { texA: 0.3 }); };
      const [b1, b2] = ST_.bobines; bob(b1[0], b1[1], 48, g * sp, '#c9c9c2'); bob(b2[0], b2[1], 48, g * sp * 1.15 + 1, '#c9c9c2');
      strokePts([[b1[0], b1[1] + 30], [ST_.tetes[0] - 26, ST_.tetes[1] - 6], [ST_.tetes[0] + 26, ST_.tetes[1] - 6], [b2[0], b2[1] + 30]], '#4a2e18', 2.2);
      for (const [x, y] of ST_.plateaux) { pc(ell(x, y - 6, 58, 12, 22), '#3a3a3e', null, 810 + x); const a = g * sp * 0.8 + x; if (!SIL()) for (let k = 0; k < 3; k++) { const b = a + k * TAU / 3; strokePts([[x, y - 8], [x + Math.cos(b) * 50, y - 8 + Math.sin(b) * 10]], '#8a8a84', 2.4); } dot(x, y - 8, 5, '#c9c9c2'); }
      // tasse de café fumante et lampe de bureau articulée (ampoule chaude)
      const [tx, ty] = ST_.tasse;
      pc([[tx - 16, ty - 30], [tx + 16, ty - 30], [tx + 13, ty], [tx - 13, ty]], '#e6dfcc', () => { fillPts(box(tx - 15, ty - 30, tx + 15, ty - 26), '#3a2416'); strokePts(ep(tx + 18, ty - 16, 8, 9, 10, -PI / 2, PI / 2), '#e6dfcc', 3); }, 821);
      M.fumee(t, { x: tx, y: ty - 32, s: 0.35, n: 4, haut: 110, vent: 12, col: '#efe8dc', a: 0.45, seed: 82 });
      const L = ST_.lampe;
      pc(ell(L.x, L.y - 6, 30, 8, 14), '#2e3034', null, 822);
      pc(ribbon([[L.x, L.y - 8], [L.x - 30, L.y - 140]], 7), '#3a3c40', null, 823); pc(ribbon([[L.x - 30, L.y - 140], [L.x + 40, L.y - 200]], 7), '#3a3c40', null, 824);
      M.rivet(L.x - 30, L.y - 140, 3);
      const flick = o.grezille ? (Math.sin(g * 47) > 0.3 ? 0.35 : 1) : 1, lk = lamp * flick;
      pc([[L.x + 30, L.y - 214], [L.x + 64, L.y - 200], [L.x + 82, L.y - 160], [L.x + 34, L.y - 176]], '#2e5a4a', null, 825);
      fillPts(ell(L.x + 60, L.y - 168, 12, 8, 10), mixA('#5a4a30', '#fff0b8', lk), 0, 0);
      beam(L.x + 60, L.y - 168, L.x + 10, L.y, L.x + 190, L.y, 0.16 * lk, '255,220,150'); glow(L.x + 60, L.y - 168, 70, '255,220,150', 0.5 * lk);
    }
    if (avant) {
      c.drawImage(K.stAvant, 0, 0);
      // aiguilles des vu-mètres
      ST_.vu.forEach(([x, y], i) => { const lv = clamp(0.35 + 0.3 * M.noise(g * 2.2, i * 7) + 0.25 * Math.sin(g * 5.3 + i) * (o.niveau == null ? 1 : o.niveau)), a = PI * 1.2 + lv * PI * 0.6; strokePts([[x, y + 22], [x + Math.cos(a) * 38, y + 22 + Math.sin(a) * 42]], '#1a1a1a', 1.6); dot(x, y + 22, 3, '#1a1a1a'); });
      // petites lampes de la console
      for (let i = 0; i < 6; i++) dot(ST_.console.x0 + 20 + i * 40, ST_.console.y - 20, 4, Math.sin(g * (1.3 + i * 0.37) + i) > 0.3 ? '#e8a632' : '#4a3a20');
    }
    c.restore();
  };

  CHW.init = function () {
    const K = (CHW.K = {});
    K.plFond = makePlFond(); K.plMilieu = makePlMilieu(); K.plConsole = makePlConsole(); K.planete = makePlanete(); K.lune = makeLune(); K.camera = makeCamera(); K.camera.padB = 20; K.projo = makeProjo();
    K.feFond = makeFeFond(); K.feMilieu = makeFeMilieu(); K.feAvant = makeFeAvant();
    K.stFond = makeStFond(); K.stMilieu = makeStMilieu(); K.stAvant = makeStAvant();
    return K;
  };
})();
