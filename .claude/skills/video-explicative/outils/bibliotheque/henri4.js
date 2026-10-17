// persos.js — « Paris vaut bien une messe, la phrase jamais dite » (Henri IV, 1589–1593) : marionnettes, accessoires et décors
// PROPRES À CETTE VIDÉO. Espace M.hq (alias HQ). Appeler HQ.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo ; déterministe (aucun Math.random) : tout dépend de pose.t / o.t.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease } = M;
  const HQ = (M.hq = {});
  const CH = M.chars;
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const has = (v) => v && v !== 'rien';

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const sclP = (pts, sx, sy) => pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy]));
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
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  HQ.geo = { ep, ell, ribbon, qbez, rrect };

  // ------------------------------------------------------------ bras ronds (épaule et coude en demi-cercles centrés sur le rivet)
  const R_C = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt, lift) { wt = wt || 15; lift = lift || 0; return ep(0, -lift, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_C + 0.5, len - 6]], ep(0, len, R_C, R_C, 10, 0, PI), [[-R_C - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_C, R_C, 10, PI, TAU).concat(f.slice(2)); }
  // IK deux segments dans le repère du torse (amène le point [4,96] de l'avant-bras = le poing sur T) ; pick 'bas' | 'avant' | 'arriere'
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
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function plier(q, th) {                                    // buste plié aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;     // jambes d'une pièce (Sully)
  }
  function headPt(q, at, hx, hy) { return mp(new DOMMatrix().translate(at[0], at[1]).rotate((q.ang.head || 0) * D), [hx, hy]); }
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: (p) => armR(LA, 15, 7 * (p._hausse || 0)), base, seed,
    paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  function foreDef(parent, base, skin, back, seed, cuffCol, cuffPaint) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (cuffCol) { fillPts([[-14, 60, 1], [14, 60, 1], [16, 78, 1], [-15, 78, 1]], cuffCol); if (cuffPaint) cuffPaint(); }
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, 0.22);
    } };
  }

  // =====================================================================
  // OBJETS (dessinés dans leur repère ; tenus : la pièce 'objet' du poing ; seuls : HQ.couronne)
  // =====================================================================
  // ---------------- chapeau d'Henri : feutre noir, calotte ronde, bord court relevé, grand panache blanc vers l'arrière. Origine = milieu du bord.
  const HC = { feutre: '#1f1d1b', feutreL: '#34302c', plume: '#f4f1ea', plumeD: '#d6d0c3', or: '#b08a3e', orL: '#d8b866' };
  function plumeLine(o, sc, dyy) {
    const r = clamp(o.rabat || 0), t = o.t || 0, on = 0.35 + 1.3 * clamp(o.onde || 0);
    const L = (a, b) => [lerp(a[0], b[0], r), lerp(a[1], b[1], r)];
    const P0 = [20, -28], C1 = L([4, -94], [10, -52]), Pm = L([-36, -86], [-26, -38]), C2 = L([-86, -80], [-60, -22]), P2 = L([-96, -16], [-66, 36]);
    const pts = qbez(P0, C1, Pm, 8).concat(qbez(Pm, C2, P2, 8).slice(1));
    return pts.map((q, i) => { const w = i / (pts.length - 1); return [q[0] * sc, q[1] * sc + dyy + Math.sin(t * 6.5 - i * 0.55) * 3.4 * on * w]; });
  }
  function drawChapeau(o) {
    const L2 = plumeLine(o, 0.8, 4), L1 = plumeLine(o, 1, 0);
    pc(ribbon(L2, 22, 7), HC.plumeD, () => hatch(null, 1.1, 3, 0.16), 7103);                          // second panache, en retrait
    pc([[-31, -6], [-33, -24], [-27, -38], [-13, -46], [4, -48], [19, -44], [29, -32], [33, -6]], HC.feutre, () => {
      strokePts([[-20, -40], [-4, -45], [12, -43]], 'rgba(255,255,255,0.16)', 2);
      hatch(null, 0.5, 3.4, 0.35, 1, P.encre, [-40, -52, 40, 0]);
      fillPts([[-34, -17, 1], [35, -17, 1], [35, -7, 1], [-34, -7, 1]], '#3a2f22');                          // ruban
      strokePts([[-33, -12], [34, -12]], HC.or, 1.1);
    }, 7101);
    pc([[-54, -14], [-47, -17], [-34, -9], [0, -7], [34, -9], [48, -19], [55, -11], [48, 2], [0, 5], [-46, 2]], HC.feutreL, () => {
      strokePts([[-48, -6], [0, -2], [48, -6]], 'rgba(255,255,255,0.2)', 1.2); hatch(null, 0.3, 3.2, 0.3);
    }, 7102);
    pc(ribbon(L1, 30, 9), HC.plume, () => {
      for (let i = 1; i < L1.length - 1; i++) {
        const a = L1[i - 1], b = L1[i + 1]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const q = L1[i];
        strokePts([[q[0] + dy * 15 - dx * 5, q[1] - dx * 15 - dy * 5], [q[0], q[1]], [q[0] - dy * 15 - dx * 5, q[1] + dx * 15 - dy * 5]], 'rgba(120,110,100,0.35)', 1);
      }
      hatch(null, 0.9, 3.6, 0.1);
    }, 7104);
    pc(ell(21, -27, 6, 6, 10), HC.or, () => dot(20, -28, 2.4, '#7d2a24'), 7105);                          // agrafe d'or
  }
  // ---------------- couronne royale fermée (origine = milieu du bas du cercle)
  const CO = { or: '#b08a3e', orL: '#dcc06e', orD: '#7c5f25', velours: '#7d2a24', pierre: '#a8231d' };
  function fdl(cx, by, h, sx, seed) {                                                                   // fleur de lys (pied en by)
    const S = (pts) => pts.map((q) => [cx + q[0] * h * sx, by + q[1] * h]);
    const pnt = () => { strokePts(S([[0, -0.9], [0, -0.4]]), 'rgba(255,240,190,0.55)', 1.1); hatch(null, 0.8, 3, 0.2); };
    pc(S([[0, -1, 1], [0.15, -0.74], [0.13, -0.44], [0, -0.33], [-0.13, -0.44], [-0.15, -0.74]]), CO.or, pnt, seed);
    pc(S([[0.06, -0.34], [0.26, -0.62], [0.46, -0.66], [0.54, -0.5], [0.44, -0.36], [0.36, -0.48], [0.26, -0.36], [0.16, -0.22]]), CO.or, null, seed + 1);
    pc(S([[-0.06, -0.34], [-0.26, -0.62], [-0.46, -0.66], [-0.54, -0.5], [-0.44, -0.36], [-0.36, -0.48], [-0.26, -0.36], [-0.16, -0.22]]), CO.or, null, seed + 2);
    pc(S([[-0.27, -0.3, 1], [0.27, -0.3, 1], [0.27, -0.19, 1], [-0.27, -0.19, 1]]), CO.orD, null, seed + 3);
    pc(S([[-0.15, -0.2], [0.15, -0.2], [0.08, 0, 1], [-0.08, 0, 1]]), CO.or, null, seed + 4);
  }
  function drawCouronne() {
    pc([[-58, -28], [-56, -58], [-42, -82], [-20, -95], [0, -98], [20, -95], [42, -82], [56, -58], [58, -28]], CO.velours, () => {
      hatch(null, 0.6, 3.2, 0.3); shade(-40, -60, 40, -30, 0.3, [-60, -100, 60, -20]);
    }, 7201);
    pc(ribbon(ep(0, -30, 57, 68, 16, PI, TAU), 10, 10), CO.or, () => hatch(null, 0.8, 3, 0.2), 7202);         // arceau de face
    pc(ribbon([[0, -30], [0, -64], [0, -98]], 10, 10), CO.or, null, 7203);                                     // arceau de profil
    if (!SIL()) for (let i = 1; i < 16; i += 2) { const a = PI + PI * i / 16; dot(57 * Math.cos(a), -30 + 68 * Math.sin(a), 2.6, '#efe9da'); }
    pc(ell(0, -104, 9, 9, 12), CO.or, () => strokePts([[-4, -108], [2, -110]], 'rgba(255,245,200,0.7)', 1.4), 7204); // globe
    fdl(0, -110, 28, 1, 7210);
    pc(rrect(-66, -36, 66, 0, 4), CO.or, () => {
      strokePts([[-64, -32], [64, -32]], CO.orL, 1.6); strokePts([[-64, -4], [64, -4]], CO.orD, 1.4);
      for (const gx of [-44, 0, 44]) { fillPts(ell(gx, -18, 9, 10, 12), CO.pierre); strokePts([[gx - 3, -23], [gx + 1, -25]], 'rgba(255,220,210,0.7)', 1.4); }
      for (const gx of [-58, -22, 22, 58]) dot(gx, -18, 3.4, '#efe9da');
      hatch(null, 0.9, 3.2, 0.18); shade(60, 0, -60, 0, 0.25, [-70, -40, 70, 2]);
    }, 7205);
    fdl(0, -34, 46, 1, 7220); fdl(-48, -34, 36, 0.66, 7230); fdl(48, -34, 36, 0.66, 7240);
    for (const gx of [-25, 25]) { pc(ell(gx, -42, 4.5, 4.5, 8), '#efe9da', null, 7250 + gx); }
  }
  // ---------------- Bible noire de Sully (origine = centre ; tranche dorée ; aucune croix, aucune lettre)
  function drawBible() {
    pc([[-44, -68], [48, -68], [55, -61], [55, 63], [48, 68], [-44, 68]], '#c9a54e', () => {
      for (let y = -60; y <= 60; y += 5) strokePts([[46, y], [55, y]], 'rgba(120,90,30,0.4)', 0.8);
      for (let x = -40; x <= 48; x += 6) strokePts([[x, -68], [x + 4, -62]], 'rgba(120,90,30,0.35)', 0.8);
    }, 7301);
    pc([[-48, -65, 1], [44, -65, 1], [47, -60], [47, 62], [44, 67, 1], [-48, 67, 1], [-53, 60], [-53, -58]], '#33251c', () => {
      strokePts(rrect(-38, -55, 38, 57, 4).concat([[34, -55]]), 'rgba(196,160,104,0.4)', 1.2);
      strokePts(rrect(-30, -47, 30, 49, 3).concat([[26, -47]]), 'rgba(196,160,104,0.3)', 1);
      for (const y of [-40, -14, 14, 40]) strokePts([[-53, y], [-45, y]], 'rgba(220,190,140,0.35)', 1.6);
      hatch(null, 0.7, 3.4, 0.3); shade(40, -60, -40, 60, 0.3, [-56, -70, 50, 70]);
    }, 7302);
    for (const y of [-30, 26]) pc([[42, y - 4, 1], [56, y - 4, 1], [56, y + 4, 1], [42, y + 4, 1]], '#9c7c3c', null, 7303 + y);
  }
  // registre : grip = point tenu dans le poing (fonction de o possible) ; pts = points nommés ; base = origine de l'objet seul
  const OBJ = {
    chapeau: { draw: drawChapeau, grip: [52, -6], pts: { panache: [-96, -16], centre: [0, -24] }, base: [0, 0] },
    couronne: { draw: drawCouronne, grip: [0, 4], pts: { sommet: [0, -138], centre: [0, -50] }, base: [0, 0] },
    bible: { draw: drawBible, grip: (o) => [lerp(-47, 42, clamp(o._prise || 0)), 8], pts: { centre: [0, 0] }, base: [0, 68] },
    chapelet: { draw: () => {}, grip: [0, 0], pts: { main: [0, 0] }, base: [0, 0] },
  };
  HQ.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0, rabat: p.rabat, onde: p.brandir }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) && p.tenu !== 'chapelet' ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) ; r = valeur renvoyée par HQ.henri / HQ.sully
  HQ.pt = function (r, nom) {
    const ob = OBJ[r.tenu]; if (!ob || !ob.pts[nom]) return null;
    const g = gripOf(ob, r.tenuO || {}), q = ob.pts[nom];
    return r.w('objet', q[0] - g[0], q[1] - g[1]);
  };
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    return q;
  }
  function run(def, q, x, y, s, o) {
    o = Object.assign({ nom: def.nom }, o || {});
    if (o.slot == null && y > M.ST.slotB - 50) o.slot = y > M.ST.slotB - 18 ? M.ST.slotF : M.ST.slotB;
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    r.pose = q;
    return r;
  }

  // =====================================================================
  // HENRI IV — barbe pointue poivre et sel, nez busqué, fraise, pourpoint ivoire brodé d'or, cape noire courte, chapeau à panache blanc
  // jambes en deux pièces (cuisse à chausses bouffantes, jambe à bas ivoire) + pied : il peut s'agenouiller
  // =====================================================================
  const HN = { peau: '#dcb48f', peauD: '#bf9470', pp: '#e6dcc4', ppD: '#cbbfa3', or: '#b08a3e', orL: '#d8b866', fraise: '#f2ede0',
    cape: '#25221f', barbe: '#8f877a', cheveux: '#9a958c', bas: '#e9e0c9', basD: '#cfc5ad', soulier: '#1d1a19' };
  const L1 = 116, L2 = 102;                          // hanche → genou, genou → cheville ; semelle 22 sous la cheville
  const HEN_TORSO = [[-14, -178], [8, -182], [18, -172], [28, -152], [36, -120], [42, -84], [48, -44], [51, -16], [42, 2], [32, 8], [36, 24, 1], [-36, 24, 1], [-36, 4], [-38, -50], [-38, -110], [-34, -150], [-26, -170]];
  const HEN_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [29, -26], [30, -30], [34, -33], [39, -35], [42, -39, 1], [41, -45], [37, -51], [32, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const HEN_BEARD = [[-17, -50], [-11, -42], [-5, -33], [3, -27], [11, -24], [19, -21], [28, -21], [33, -16], [32, -6], [28, 4], [22, 14], [15, 31, 1], [8, 16], [-2, 4], [-10, -8], [-15, -24], [-19, -40]];
  const HEN_CAPE = [[0, 0], [-14, 8], [-30, 56], [-40, 112], [-36, 150], [-14, 158], [10, 152], [20, 70], [16, 10]];
  const thighPts = [[-30, -14], [-16, -24], [14, -24], [32, -14], [38, 6], [36, 30], [28, 52], [17, 62], [15, 80], [14.5, L1 - 4]].concat(ep(0, L1, 14.5, 14.5, 10, 0, PI), [[-14.5, L1 - 4], [-15, 80], [-18, 62], [-32, 52], [-40, 28], [-40, 4]]);
  const shinPts = ep(0, 0, 14.5, 14.5, 10, PI, TAU).concat([[14, 10], [13, 40], [11, 72], [9, L2 + 2], [-9, L2 + 2], [-12, 72], [-14, 40], [-14, 10]]);
  const FOOT = [[-11, -12], [9, -12], [16, 0], [34, 8], [48, 14, 1], [47, 22, 1], [-16, 22, 1], [-17, 8]];
  function eyeH(f, x, y, rg, rgy) {
    const e = f.eyes || 'open';
    if (e === 'closed') { strokePts([[x - 6, y], [x, y + 2.2], [x + 6, y - 0.5]], 'rgba(30,18,16,0.9)', 1.7); return; }
    const k = e === 'wide' ? 1.45 : e === 'half' ? 0.55 : 1;
    fillPts([[x - 6, y], [x - 1, y - 3.3 * k], [x + 5.5, y - 1.2 * k], [x + 2.5, y + 1.8 * k], [x - 4, y + 1]], '#efe8da', 0, 0);
    const px = x + 2.3 + (rg < 0 ? rg * 5.2 : rg * 1.6), py = y - 0.6 * k + rgy * 1.4 * k;
    dot(px, py, 2.0 * Math.min(1.15, k), '#2a1f1d');
    strokePts([[x - 6.5, y + 0.3], [x - 1, y - 3.6 * k], [x + 6, y - 1.4 * k]], 'rgba(28,16,14,0.95)', 1.8);
  }
  function browH(f, x, y, col, lw, up) {
    if (!up) { X.brow(f, x, y, col, lw); return; }
    strokePts([[x - 8, y - 1 - 2 * up], [x - 1, y - 3 - 7 * up], [x + 8, y - 1.5 - 4 * up]], col, lw);
  }
  function legParts(c, seedB) {
    const thighPaint = (back) => () => {
      for (const x of [-26, -14, -2, 10, 22]) strokePts([[x * 0.85, -20], [x * 1.12, 18], [x * 0.75, 58]], back ? 'rgba(140,105,45,0.6)' : HN.or, 1.6);
      strokePts([[-34, 56], [-16, 64], [16, 64], [30, 54]], HN.or, 2);                           // bande d'or au bas des chausses
      fillPts([[-20, 64, 1], [20, 64, 1], [20, 140, 1], [-20, 140, 1]], back ? HN.basD : HN.bas);  // bas ivoire
      hatch([[-40, -24], [-14, -24], [-14, 60], [-40, 60]], 0.8, 3.8, back ? 0.36 : 0.26); shade(36, 10, -38, 10, 0.28, [-42, -26, 40, 64]);
    };
    const shinPaint = (back) => () => {
      strokePts([[-14, 10], [14, 8]], HN.or, 2.2); dot(12, 9, 2.8, HN.orL);                        // jarretière
      hatch([[-16, -16], [-5, -16], [-5, 110], [-16, 110]], 0.8, 3.8, back ? 0.36 : 0.22);
    };
    const footPaint = (back) => () => { strokePts([[-14, 18], [46, 18]], 'rgba(255,255,255,0.18)', 1.2); if (!back) { dot(16, 2, 5.5, '#e9dfc4'); dot(16, 2, 2.2, HN.or); } };
    return {
      legB_up: { parent: 'torso', at: [-6, -2], pts: thighPts, base: HN.ppD, seed: seedB, noRivet: true, paint: thighPaint(true) },
      legB_lo: { parent: 'legB_up', at: [0, L1], pts: shinPts, base: HN.basD, seed: seedB + 1, paint: shinPaint(true) },
      footB: { parent: 'legB_lo', at: [0, L2], pts: FOOT, base: HN.soulier, seed: seedB + 2, noRivet: true, paint: footPaint(true) },
      legF_up: { parent: 'torso', at: [6, -2], pts: thighPts, base: HN.pp, seed: seedB + 3, noRivet: true, paint: thighPaint(false) },
      legF_lo: { parent: 'legF_up', at: [0, L1], pts: shinPts, base: HN.bas, seed: seedB + 4, paint: shinPaint(false) },
      footF: { parent: 'legF_lo', at: [0, L2], pts: FOOT, base: HN.soulier, seed: seedB + 5, noRivet: true, paint: footPaint(false) },
    };
  }
  const HAT_AT = [-2, -76], HAT_REST = -0.06, HEAD_AT = [6, -170];
  function mkHenri() {
    const sleevePaint = (back) => () => {
      for (const y of [12, 34, 56, 78]) strokePts([[-15, y], [0, y + 3], [15, y]], back ? 'rgba(140,105,45,0.6)' : HN.or, 1.4);
      hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, back ? 0.36 : 0.26);
    };
    const lace = () => { for (let x = -13; x <= 13; x += 4) strokePts([[x, 61], [x + 1.5, 70], [x, 78]], 'rgba(150,140,120,0.6)', 0.9); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: HEN_TORSO, base: HN.pp, seed: 8001, paint: () => {
        for (let i = 0; i < 7; i++) { const y = -150 + i * 24; strokePts([[-38, y + 10], [0, y + 4], [44, y - 6 + i * 1.5]], 'rgba(176,138,62,0.7)', 1.3); }   // galons brodés
        strokePts([[16, -170], [30, -134], [40, -90], [47, -46], [50, -16]], HN.or, 2.6);                                              // bordure de devant
        for (let i = 0; i < 8; i++) { const u = i / 7; dot(lerp(24, 47, u), lerp(-150, -26, u), 2.4, HN.orL); }                        // boutons
        strokePts([[-36, 6], [0, 10], [40, 4]], HN.or, 2.2);                                                                             // ceinture
        for (const x of [-22, -8, 6, 20]) strokePts([[x, 9], [x + 1, 24]], 'rgba(120,95,50,0.6)', 1.1);                                  // basques
        fillPts([[-38, -150], [-30, -170], [-16, -179], [-6, -177], [-20, -152], [-30, -124], [-38, -110]], HN.cape);                     // cape sur l'épaule arrière
        hatch([[-50, -170], [-14, -170], [-12, 26], [-50, 26]], 0.75, 4.2, 0.26); shade(46, -40, -40, -40, 0.26);
      } },
      cape: { parent: 'torso', at: [-26, -168], pts: HEN_CAPE, base: HN.cape, seed: 8002, noRivet: true, paint: () => {
        for (const x of [-22, -10, 2, 12]) strokePts([[x * 0.4, 8], [x * 0.9, 80], [x, 150]], 'rgba(255,255,255,0.12)', 1.4);
        hatch(null, 0.8, 3.4, 0.3);
      } },
      armB_up: upDef(SH_B, HN.ppD, 8003, sleevePaint(true)),
      armB_lo: foreDef('armB_up', HN.ppD, HN.peauD, true, 8004, '#ded7c6', lace),
      head: { parent: 'torso', at: HEAD_AT, pts: HEN_HEAD, base: HN.peau, seed: 8005, noRivet: true, paint: (p) => {
        const f = p.face || {}, so = clamp(p.sourcil || 0);
        fillPts([[-33, -70], [-26, -88], [-6, -97], [14, -92], [22, -84], [6, -80], [-8, -77], [-15, -66], [-19, -54], [-23, -42], [-30, -40], [-34, -54]], HN.cheveux, 3);
        for (const [a, b] of [[[-28, -60], [-20, -40]], [[-22, -70], [-14, -54]], [[-12, -80], [-4, -72]]]) strokePts([a, b], 'rgba(60,55,50,0.4)', 1.1);
        X.earPaint(-8, -46);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(16, -38, 8, 'rgba(205,120,100,0.2)');
        strokePts([[8, -49], [3, -46]], 'rgba(110,70,50,0.45)', 1); strokePts([[9, -55], [4, -57]], 'rgba(110,70,50,0.4)', 1);    // pattes d'oie
        strokePts([[17, -73], [27, -71]], 'rgba(110,70,50,0.35)', 1);
        strokePts([[38, -45], [34, -38]], 'rgba(110,60,45,0.4)', 1);                                                            // arête du nez
        eyeH(f, 19, -53, p.regard || 0, p.regardY || 0);
        browH(f, 19, -61, 'rgba(70,64,58,0.95)', 3, so);
        fillPts([[36, -31], [30, -33], [20, -31], [12, -26], [16, -28], [24, -27], [33, -27]], HN.barbe);                       // moustache
        strokePts([[33, -30], [20, -29], [12, -25]], 'rgba(60,55,50,0.6)', 1);
        const m = f.mouth || 'n';
        if (m === 'o') fillPts([[24, -25], [29, -26], [30, -20], [24, -19]], '#3a1714', 0, 0);
        else if (m === 'smile') strokePts([[30, -24], [25, -22], [19, -24]], 'rgba(110,40,38,0.95)', 1.6);
        else strokePts([[30, -24], [25, -23], [20, -23.5]], 'rgba(110,40,38,0.9)', 1.5);
      } },
      fraise: { parent: 'torso', at: [8, -175], pts: ell(0, 0, 33, 12, 24).map((q) => [q[0] * Math.cos(0.12) - q[1] * Math.sin(0.12), q[0] * Math.sin(0.12) + q[1] * Math.cos(0.12)]),
        base: HN.fraise, seed: 8006, noRivet: true, paint: () => {
          for (let x = -30; x <= 30; x += 4) { const f = Math.sqrt(Math.max(0, 1 - (x / 33) * (x / 33))) * 11; strokePts([[x, -f + 3.6 * x / 30], [x + 1.6, 3.6 * x / 30], [x, f + 3.6 * x / 30]], 'rgba(150,140,120,0.7)', 1); }
          shade(-30, 0, 30, 0, 0.25, [-36, -16, 36, 16]);
        } },
      barbe: { parent: 'head', at: [0, 0], pts: HEN_BEARD, base: HN.barbe, seed: 8007, noRivet: true, paint: () => {
        for (let i = 0; i < 7; i++) { const x = -12 + i * 6.5, u = i / 6; strokePts([[x, -38 + u * 18], [x + 4 + 4 * u, -10 + u * 6], [lerp(-4, 16, u), lerp(4, 28, u)]], i % 2 ? 'rgba(246,242,234,0.5)' : 'rgba(50,46,40,0.3)', 1); }
        shade(30, 0, -16, 0, 0.18, [-20, -52, 36, 32]);
      } },
      hat: { parent: 'head', at: HAT_AT, rest: HAT_REST, pts: OFFP, base: '#000', seed: 8008, noRivet: true,
        extra: (p) => drawChapeau({ t: p.t || 0, rabat: p.rabat, onde: 0 }) },
      armF_up: upDef(SH_F, HN.pp, 8009, sleevePaint(false)),
      armF_lo: foreDef('armF_up', HN.pp, HN.peau, false, 8010, '#f2ede0', lace),
    };
    Object.assign(parts, legParts(HN, 8020), heldParts(HN.peau, 8040));
    return { nom: 'henri', hipY: -238, handLen: 100, parts, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'cape', 'legB_up', 'legB_lo', 'footB', 'legF_up', 'legF_lo', 'footF', 'head', 'torso', 'fraise', 'barbe', 'hat', 'armF_up', 'armF_lo', 'objet', 'doigts'] };
  }
  CH.hqHenri = mkHenri();

  // ---- jambes : genou (IK des deux jambes, pieds posés) ; repère « pieds » : (0,0) = sol sous la marionnette
  function footLow(phi) { let m = -1e9; for (const q of FOOT) m = Math.max(m, q[0] * Math.sin(phi) + q[1] * Math.cos(phi)); return m; }
  function legIK(H, Aq) {                                    // renvoie angles absolus (cuisse, jambe), genou vers l'avant
    const vx = Aq[0] - H[0], vy = Aq[1] - H[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.4), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, K = [H[0] - L1 * Math.sin(a), H[1] + L1 * Math.cos(a)];
      const s2 = Math.atan2(-(Aq[0] - K[0]), Aq[1] - K[1]);
      if (!best || K[0] > best.kx) best = { a, b: s2, kx: K[0] };
    }
    return best;
  }
  function jambesGenou(q, g) {
    const A = q.ang, tl = q.tilt || 0, c = Math.cos(tl), s = Math.sin(tl);
    const hip = (hx) => { const X0 = (q.dx || 0) + hx, Y0 = -238 + (q.dy || 0) - 2; return [X0 * c - Y0 * s, X0 * s + Y0 * c]; };
    const phiB = 1.15 * g;
    const ankF = [lerp(6, 121.7, g), -22], ankB = [lerp(-6, -101, g), -footLow(phiB)];
    const solF = legIK(hip(6), ankF), solB = legIK(hip(-6), ankB);
    A.legF_up = normA(solF.a - tl); A.legF_lo = normA(solF.b - solF.a); A.footF = normA(0 - solF.b);
    A.legB_up = normA(solB.a - tl); A.legB_lo = normA(solB.b - solB.a); A.footB = normA(phiB - solB.b);
  }
  // ---- gestes d'Henri
  const HN_P1 = [150, -262], HN_P2 = [165, -170], HN_PF = [104, -46], HN_PB = [160, -280], HN_PR = [96, -30];
  function hatOnHead(q) {
    const A = q.ang;
    const m = new DOMMatrix().translate(HEAD_AT[0], HEAD_AT[1]).rotate((A.head || 0) * D).translate(HAT_AT[0], HAT_AT[1]).rotate((HAT_REST + (A.hat || 0)) * D);
    return { p: mp(m, OBJ.chapeau.grip), a: (A.head || 0) + HAT_REST + (A.hat || 0) };
  }
  function etapes(pts, k) {                                   // trajet par étapes (chaque tronçon adouci)
    const n = pts.length - 1, u = clamp(k) * n, i = Math.min(n - 1, Math.floor(u)), f = ease(u - i);
    return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
  }
  HQ.henriPose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    const gn = ease(clamp(q.genou || 0)), rv = ease(clamp(q.reverence || 0)), sh = ease(clamp(q.epaules || 0));
    const fr = ease(clamp(q.frapper || 0)), br = ease(clamp(q.brandir || 0)), so = clamp(q.sourcil || 0);
    let oc = clamp(q.oteChapeau || 0); if (q.tenu === 'chapeau') oc = Math.max(oc, 1);
    if (A.legF) A.legF_up = (A.legF_up || 0) + A.legF;                       // pas de marche « à la kit » : legF / legB = jambe entière
    if (A.legB) A.legB_up = (A.legB_up || 0) + A.legB;
    delete A.legF; delete A.legB;
    if (rv > 0) {
      plier(q, 0.55 * rv); A.head = (A.head || 0) + 0.3 * rv;
      blend(q, 'armB_up', 1.0, rv); blend(q, 'armB_lo', -0.25, rv); if (rv > 0.3 && !q.handB) q.handB = 'open';
      if (oc < 0.35) { armTo(q, 'armF', [34, -104], 'bas', rv); if (rv > 0.4 && !has(q.tenu)) q.handF = 'open'; }
    }
    if (sh > 0) {
      q._hausse = sh;
      if (oc < 0.35 && !has(q.tenu)) { blend(q, 'armF_up', -0.15, sh); blend(q, 'armF_lo', -1.35, sh); if (sh > 0.4) q.handF = 'open'; }
      blend(q, 'armB_up', 0.12, sh); blend(q, 'armB_lo', -1.8, sh); if (sh > 0.4) q.handB = 'open';
      A.head = (A.head || 0) + 0.1 * sh; if (!q.face.brow && !so) q.face.brow = 'up';
    }
    if (fr > 0) {
      const cp = q.coup != null ? clamp(q.coup) : Math.pow(Math.max(0, Math.sin(t * TAU * 2.2)), 0.7);
      armTo(q, 'armF', [lerp(56, 178, cp), lerp(-152, -140, cp)], 'bas', fr);
      if (!has(q.tenu)) q.handF = 'fist';
    }
    if (oc < 0.35 && br > 0) { blend(q, 'armF_up', -2.2, br); blend(q, 'armF_lo', -0.5, br); if (!has(q.tenu)) q.handF = 'fist'; }
    let hatA = null;
    if (oc > 0) {
      A.head = (A.head || 0) - 0.1 * (oc <= 0.35 ? ease(oc / 0.35) : 1 - ease((oc - 0.35) / 0.65));   // menton levé pendant la prise
      const H = hatOnHead(q);
      if (oc <= 0.35) { const k1 = ease(oc / 0.35); armTo(q, 'armF', H.p, 'bas', k1); q.handF = k1 > 0.8 ? 'fist' : 'open'; }
      else {
        const k2 = (oc - 0.35) / 0.65;
        let T = etapes([H.p, HN_P1, HN_P2, HN_PF], k2), a = lerp(H.a, -0.15, ease(k2));
        if (br > 0) { T = [lerp(T[0], HN_PB[0], br), lerp(T[1], HN_PB[1], br)]; a = lerp(a, 1.25 + 0.12 * Math.sin(t * 5), br); }
        if (rv > 0) { T = [lerp(T[0], HN_PR[0], rv), lerp(T[1], HN_PR[1], rv)]; a = lerp(a, -0.45, rv); }
        armTo(q, 'armF', T, 'bas', 1); hatA = a;
        q.tenu = 'chapeau'; q.droit = false; q.hide.hat = 1;
      }
    }
    if (so > 0) { q.sourcil = so; if (q.regard == null) q.regard = -0.8 * so; }
    A.cape = (A.cape || 0) + 0.03 * Math.sin(t * 1.6) - 0.6 * (q.tilt || 0);
    if (gn > 0) { q.dy = (q.dy || 0) + 108 * gn; jambesGenou(q, gn); }
    finish(q);
    if (hatA != null) { A.objet = hatA - ((A.armF_up || 0) + (A.armF_lo || 0)); q.handF = 'fist'; }
    return q;
  };
  HQ.henri = (pose, x, y, s, o) => run(CH.hqHenri, HQ.henriPose(pose), x, y, s == null ? 0.9 : s, o);

  // =====================================================================
  // SULLY — grand et raide, crâne chauve à couronne de cheveux brun foncé, barbe carrée, tout en noir, grand col plat blanc (rabat)
  // =====================================================================
  const SU = { peau: '#d9b292', peauD: '#bb9172', noir: '#1e1c22', noirL: '#2c2a31', bas: '#55585e', basD: '#45474c', col: '#f1ece0', barbe: '#4a3426', cheveux: '#3f2c20', soulier: '#141215' };
  const SU_TORSO = [[-14, -180], [8, -184], [16, -172], [26, -154], [33, -116], [35, -60], [34, -10], [32, 16], [-34, 18], [-36, -40], [-37, -110], [-33, -152], [-26, -172]];
  const SU_HEAD = [[-14, 20], [10, 20], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [29, -26], [28, -30], [31, -34], [37, -40, 1], [34, -46], [30, -56], [29, -66], [26, -80], [14, -94], [-6, -99], [-24, -90], [-33, -70], [-32, -46], [-24, -28], [-17, -8]];
  const SU_BEARD = [[-15, -52], [-9, -42], [-3, -32], [6, -26], [14, -22], [22, -19], [30, -19], [34, -13], [35, 8], [34, 27, 1], [2, 29, 1], [-6, 14], [-12, 0], [-16, -18], [-18, -38]];
  const SU_COL = [[-38, -168], [-24, -186], [-4, -192], [14, -188], [26, -176], [37, -152], [46, -116, 1], [30, -108, 1], [14, -130], [-2, -144], [-20, -148], [-40, -144, 1]];
  const SU_LEG = sclP(X.legPts(0.92), 1, 1.05);
  function mkSully() {
    const legPaint = (back) => () => {
      fillPts([[-40, 126, 1], [60, 126, 1], [60, 236, 1], [-40, 236, 1]], back ? SU.basD : SU.bas);           // bas gris ardoise sous le genou
      strokePts([[-22, 126], [20, 126]], 'rgba(10,10,12,0.8)', 3);                                           // jarretière sombre
      fillPts([[-40, 226, 1], [60, 226, 1], [60, 270, 1], [-40, 270, 1]], SU.soulier);
      strokePts([[-14, 60], [-12, 120]], 'rgba(255,255,255,0.08)', 1.4);
      hatch(null, 0.8, 3.6, back ? 0.34 : 0.22);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: SU_TORSO, base: SU.noir, seed: 8101, paint: () => {
        strokePts([[22, -156], [30, -112], [32, -60], [31, -12]], 'rgba(255,255,255,0.12)', 1.4);
        for (let i = 0; i < 9; i++) { const u = i / 8; dot(lerp(26, 32, u), lerp(-140, -24, u), 2.2, '#4a4650'); dot(lerp(26, 32, u) - 0.6, lerp(-140, -24, u) - 0.8, 0.9, 'rgba(255,255,255,0.4)'); }
        fillPts([[-36, -14, 1], [33, -14, 1], [33, -4, 1], [-36, -4, 1]], '#2a2018');                       // ceinture sobre
        fillPts([[24, -15, 1], [32, -15, 1], [32, -3, 1], [24, -3, 1]], '#6e6658');                          // boucle mate
        strokePts([[-36, 14], [0, 16], [32, 14]], 'rgba(255,255,255,0.08)', 1.2);
        hatch([[-50, -170], [-14, -170], [-12, 20], [-50, 20]], 0.75, 4.2, 0.3); shade(40, -40, -40, -40, 0.22);
      } },
      bibleB: { parent: 'torso', at: [-50, -92], rest: -0.12, pts: (p) => (p.tenuB === 'bible' ? [[-60, -40, 1], [56, -40, 1], [58, 38, 1], [-60, 40, 1]] : OFFP),
        base: '#33251c', seed: 8102, noRivet: true, paint: () => {
          fillPts([[-60, -40, 1], [56, -40, 1], [56, -32, 1], [-60, -32, 1]], '#c9a54e'); for (let x = -56; x < 54; x += 6) strokePts([[x, -40], [x + 3, -32]], 'rgba(120,90,30,0.4)', 0.8);
          strokePts(rrect(-50, -24, 46, 30, 3).concat([[42, -24]]), 'rgba(196,160,104,0.4)', 1.2); hatch(null, 0.7, 3.4, 0.3);
        } },
      armB_up: upDef(SH_B, SU.noirL, 8103, () => hatch(null, 0.9, 3.4, 0.34)),
      armB_lo: foreDef('armB_up', SU.noirL, SU.peauD, true, 8104, SU.col),
      legB: { parent: 'torso', at: [-6, -2], pts: SU_LEG, base: SU.noirL, seed: 8105, noRivet: true, paint: legPaint(true) },
      legF: { parent: 'torso', at: [6, -2], pts: SU_LEG, base: SU.noir, seed: 8106, paint: legPaint(false) },
      head: { parent: 'torso', at: [6, -176], pts: SU_HEAD, base: SU.peau, seed: 8107, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-33, -72], [-26, -76], [-16, -66], [-14, -50], [-22, -34], [-30, -36], [-34, -52]], SU.cheveux, 3);    // couronne de cheveux
        strokePts([[-10, -92], [6, -95]], 'rgba(255,250,240,0.6)', 2.6);                                                // crâne luisant
        X.earPaint(-8, -46);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        strokePts([[12, -76], [24, -74]], 'rgba(110,70,50,0.35)', 1);
        X.eye(f, 18, -54); browH(f, 18, -62, 'rgba(40,26,18,0.98)', 4.2, f.brow === 'up' ? 0.7 : 0);
      } },
      col: { parent: 'torso', at: [0, 0], pts: SU_COL, base: SU.col, seed: 8108, noRivet: true, paint: () => {
        strokePts([[-30, -160], [0, -164], [26, -150]], 'rgba(150,140,120,0.5)', 1); hatch(null, 1.2, 4, 0.12); shade(-30, -160, 30, -150, 0.2, [-40, -190, 44, -110]);
      } },
      barbe: { parent: 'head', at: [0, 0], pts: SU_BEARD, base: SU.barbe, seed: 8109, noRivet: true, paint: (p) => {
        const f = p.face || {};
        for (let i = 0; i < 9; i++) { const x = -14 + i * 5.5; strokePts([[x, -40 + i * 2], [x + 1, 6], [x + 2, 27]], i % 2 ? 'rgba(120,90,60,0.45)' : 'rgba(20,12,8,0.45)', 1.2); }
        fillPts([[36, -31], [30, -32], [18, -28], [14, -22], [22, -24], [34, -25]], '#3a281d');                                 // moustache
        const m = f.mouth || 'n';
        if (m === 'o') fillPts([[24, -22], [30, -23], [31, -15], [24, -14]], '#2a100e', 0, 0);
        else strokePts([[31, -21], [25, -20], [19, -21]], 'rgba(90,30,28,0.95)', 1.6);
        hatch(null, 0.4, 3.4, 0.2);
      } },
      armF_up: upDef(SH_F, SU.noir, 8110, () => { strokePts([[8, -6], [10, 90]], 'rgba(255,255,255,0.1)', 1.4); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3); }),
      armF_lo: foreDef('armF_up', SU.noir, SU.peau, false, 8111, SU.col),
    };
    Object.assign(parts, heldParts(SU.peau, 8140));
    return { nom: 'sully', hipY: -250, handLen: 100, parts, rod: { part: 'torso', at: [-26, 18] },
      order: ['bibleB', 'armB_up', 'armB_lo', 'legB', 'legF', 'head', 'torso', 'col', 'barbe', 'armF_up', 'armF_lo', 'objet', 'doigts'] };
  }
  CH.hqSully = mkSully();
  HQ.sullyPose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    const ch = ease(clamp(q.chuchote || 0)), te = ease(clamp(q.tendre || 0)), su = ease(clamp(q.surpris || 0)), sb = ease(clamp(q.serreBible || 0)), ho = clamp(q.hoche || 0);
    if (q.tenuB === 'bible') { blend(q, 'armB_up', 0.32, 1); blend(q, 'armB_lo', -0.5, 1); }
    if (sb > 0 && q.tenu == null) q.tenu = 'bible';
    if (ch > 0) {
      plier(q, 0.2 * ch); A.head = (A.head || 0) + 0.04 * ch;
      armTo(q, 'armF', headPt(q, [6, -176], 50, -24), 'bas', ch); if (ch > 0.4 && !has(q.tenu)) q.handF = 'open';
    }
    if (te > 0) { blend(q, 'armF_up', -1.35, te); blend(q, 'armF_lo', -0.18, te); if (te > 0.4 && !has(q.tenu)) q.handF = 'open'; }
    if (su > 0) {
      armTo(q, 'armF', [28, -112], 'bas', su); if (su > 0.4 && !has(q.tenu)) q.handF = 'open';
      if (su > 0.3) { q.face.mouth = q.face.mouth || 'o'; q.face.brow = q.face.brow || 'up'; q.face.eyes = q.face.eyes || 'wide'; }
      A.head = (A.head || 0) - 0.06 * su; q.dy = (q.dy || 0) - 4 * su;
    }
    if (sb > 0) {
      armTo(q, 'armF', [58, -108], 'bas', sb); A.head = (A.head || 0) - 0.14 * sb;
      q.tenuO = Object.assign({}, q.tenuO, { _prise: sb }); A.objet = (A.objet || 0) + 0.06 * sb;
    }
    if (ho > 0) A.head = (A.head || 0) + ho * 0.22 * Math.pow(Math.max(0, Math.sin(t * TAU * 1.8)), 1.4);
    return finish(q);
  };
  HQ.sully = (pose, x, y, s, o) => run(CH.hqSully, HQ.sullyPose(pose), x, y, s == null ? 0.92 : s, o);

  // =====================================================================
  // LIGUEURS (bustes derrière les créneaux) : a moine (robe brun tabac, capuche rabattue, tonsure, visage rond),
  // b bourgeois (toque noire plate, petite fraise, manteau rouge sang), c femme (coiffe blanche en pointe, corsage vert éteint)
  // =====================================================================
  const LG = {
    a: { peau: '#e2b08c', habit: '#6b4a2e', habitD: '#56391f', seed: 8200 },
    b: { peau: '#d8b394', habit: '#7d2a24', habitD: '#64201b', seed: 8230 },
    c: { peau: '#e4c2a2', habit: '#56664a', habitD: '#46553c', seed: 8260 },
  };
  const BUST = [[-14, -176], [8, -180], [16, -168], [28, -150], [36, -112], [40, -60], [42, 60, 1], [-42, 60, 1], [-40, -60], [-38, -110], [-34, -150], [-26, -168]];
  const HEAD_ROND = [[-16, 18], [12, 18], [16, 6], [24, -2], [32, -10], [35, -18], [33, -25], [34, -30], [38, -36, 1], [35, -44], [31, -54], [30, -68], [22, -86], [2, -96], [-20, -91], [-35, -74], [-39, -50], [-34, -26], [-24, -6]];
  function mkLigueur(k) {
    const c = LG[k], sd = c.seed;
    const parts = {
      torso: { parent: null, at: [0, 0], pts: BUST, base: c.habit, seed: sd + 1, paint: () => {
        if (k === 'a') { for (const x of [-20, 0, 18]) strokePts([[x, -150], [x * 1.1, -60], [x * 1.2, 40]], 'rgba(30,18,8,0.4)', 1.4); }
        if (k === 'b') { fillPts([[24, -168], [40, -110], [42, 60], [26, 60], [20, -120]], '#5a4a3a'); for (let y = -160; y < 50; y += 12) strokePts([[26, y], [36, y + 6]], 'rgba(255,240,220,0.2)', 1); }   // revers de fourrure
        if (k === 'c') { fillPts([[2, -176], [18, -170], [30, -150], [28, -132], [10, -136], [0, -150]], '#e9dcc4'); strokePts([[4, -150], [30, -140]], 'rgba(30,40,20,0.6)', 1.4); for (let i = 0; i < 6; i++) dot(30, -128 + i * 16, 1.8, '#c9b98a'); }
        hatch([[-50, -170], [-14, -170], [-12, 60], [-50, 60]], 0.75, 4.2, 0.3); shade(40, -40, -40, -40, 0.24);
      } },
      head: { parent: 'torso', at: [6, -170], pts: k === 'a' ? HEAD_ROND : X.NAP_HEAD, base: c.peau, seed: sd + 2, noRivet: true, paint: (p) => {
        const f = p.face || {};
        if (k === 'a') {
          fillPts([[29, -74], [10, -81], [-10, -81], [-28, -73], [-38, -58], [-37, -42], [-27, -56], [-10, -66], [8, -68], [26, -63]], '#4a3020', 3);   // couronne de la tonsure
          strokePts([[-8, -91], [10, -90]], 'rgba(255,245,235,0.7)', 2.6);
          dot(20, -32, 10, 'rgba(205,95,75,0.35)'); strokePts([[14, -2], [24, -6]], 'rgba(120,70,50,0.4)', 1.2);
          X.earPaint(-10, -44); X.eye(f, 19, -52); X.brow(f, 19, -60, 'rgba(60,36,22,0.9)', 2.8); X.mouth(f, 28, -24);
        } else if (k === 'b') {
          fillPts([[-33, -68], [-24, -84], [-28, -60], [-24, -36], [-30, -36]], '#3a2a20', 3);
          X.earPaint(-8, -44); X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(40,26,18,0.95)', 2.6);
          fillPts([[30, -31], [22, -32], [12, -26], [22, -28], [30, -28]], '#3a2a20'); X.mouth(f, 26, -24);
          fillPts([[22, -14], [28, -10], [24, 2], [16, -6]], '#3a2a20');                                                                // barbiche
        } else {
          fillPts([[-30, -70], [-22, -84], [6, -86], [22, -80], [10, -78], [-10, -72], [-22, -60]], '#5a3a26', 3);
          X.eye(f, 17, -52); X.brow(f, 17, -59, 'rgba(70,40,26,0.85)', 2); X.mouth(f, 27, -27, 'rgba(150,50,50,0.95)');
          dot(14, -34, 7, 'rgba(215,120,110,0.28)');
        }
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
      } },
      armF_up: upDef(SH_F, c.habit, sd + 3, () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3)),
      armF_lo: foreDef('armF_up', c.habit, c.peau, false, sd + 4, k === 'b' ? '#f2ede0' : c.habitD),
    };
    if (k === 'a') parts.capuche = { parent: 'torso', at: [0, 0], noRivet: true, base: c.habitD, seed: sd + 5,
      pts: [[-50, -120], [-50, -160], [-36, -186], [-14, -192], [2, -186], [-2, -172], [-18, -168], [-30, -150], [-34, -120]],
      paint: () => { strokePts([[-44, -150], [-24, -178], [-6, -184]], 'rgba(30,18,8,0.5)', 1.4); hatch(null, 0.8, 3.6, 0.3); } };
    if (k === 'b') {
      parts.fraise = { parent: 'torso', at: [8, -174], noRivet: true, base: '#f2ede0', seed: sd + 5, pts: ell(0, 0, 22, 8, 18),
        paint: () => { for (let x = -18; x <= 18; x += 4) strokePts([[x, -6], [x + 1, 0], [x, 6]], 'rgba(150,140,120,0.7)', 0.9); } };
      parts.toque = { parent: 'head', at: [-2, -88], noRivet: true, base: '#1c1a1c', seed: sd + 6,
        pts: [[-46, 2], [-42, -10], [-12, -18], [26, -16], [50, -6], [48, 3], [10, 6], [-28, 6]],
        paint: () => { strokePts([[-40, -2], [44, -2]], 'rgba(255,255,255,0.12)', 1.4); hatch(null, 0.3, 3.2, 0.3); } };
    }
    if (k === 'c') parts.coiffe = { parent: 'head', at: [0, 0], noRivet: true, base: '#ece6d6', seed: sd + 5,
      pts: [[-46, 24], [-44, -40], [-40, -74], [-26, -96], [-4, -106], [16, -102], [30, -94], [40, -86, 1], [26, -80], [10, -84], [-6, -82], [-18, -70], [-24, -48], [-26, -20], [-30, 22]],
      paint: () => { strokePts([[-36, -70], [-14, -94], [12, -98], [34, -88]], 'rgba(150,140,120,0.6)', 1.2); strokePts([[-38, 0], [-34, -50]], 'rgba(150,140,120,0.5)', 1); hatch(null, 1, 4, 0.1); } };
    const order = ['torso'].concat(k === 'a' ? ['head', 'capuche'] : k === 'b' ? ['head', 'fraise', 'toque'] : ['head', 'coiffe'], ['armF_up', 'armF_lo']);
    return { nom: 'ligueur' + k, hipY: -238, handLen: 100, parts, rod: null, order };
  }
  CH.hqLigueurA = mkLigueur('a'); CH.hqLigueurB = mkLigueur('b'); CH.hqLigueurC = mkLigueur('c');
  const LG_PH = { a: 0, b: 1.9, c: 3.8 };
  HQ.LIG_SILL = 314;                                                           // le rebord du créneau est 314 unités au-dessus des « pieds » virtuels
  HQ.ligueurPose = function (k, p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    const ph = q.phase != null ? q.phase : LG_PH[k], no = clamp(q.non || 0);
    if (no > 0) { const w = Math.sin(TAU * 2.4 * t + ph); A.head = (A.head || 0) + 0.11 * no * w; q.dx = (q.dx || 0) + 5 * no * w; }
    const ou = clamp(q.outre === true ? 1 : q.outre || 0);
    if (ou > 0.3) { q.face.brow = q.face.brow || 'frown'; q.face.mouth = q.face.mouth || 'o'; q.face.eyes = q.face.eyes || 'wide'; }
    A.head = (A.head || 0) - 0.06 * ou;
    const br = ease(clamp(q.bras || 0));
    blend(q, 'armF_up', -0.75, br); blend(q, 'armF_lo', -0.82, br); q.handF = q.handF || (br > 0.5 ? 'open' : 'fist');
    q.dy = (q.dy || 0) + 250 * ease(clamp(q.baisse || 0));
    return q;
  };
  // (x,y) = point du rebord du créneau (écran) ; le buste est découpé sous cette ligne
  HQ.ligueur = function (k, pose, x, y, s, o) {
    k = String(k).toLowerCase(); s = s == null ? 0.8 : s; o = o || {};
    const def = CH['hqLigueur' + k.toUpperCase()], q = HQ.ligueurPose(k, pose), c = cx_();
    c.save(); c.beginPath(); c.rect(x - 3000, y - 6000, 6000, 6000); c.clip();
    const r = M.puppet(def, q, x, y + HQ.LIG_SILL * s, s, Object.assign({ rod: false, floorShadow: false, nom: def.nom }, o));
    c.restore(); return r;
  };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; le dessin se fait dans l'extra (traits constants, ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { nom: name, hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, fn, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    return M.puppet(accDef(name, fn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  HQ.couronne = (x, y, s, o) => acc('couronne', () => drawCouronne(), x, y, s, o);

  // ---------------- girouette en coq (origine = pied de la tige, posé sur le faîte) ; hauteur 210 à l'échelle 1
  const GI = { metal: '#2b2a28', or: '#b08a3e' };
  const COQ = [[8, -130], [20, -136], [30, -148], [34, -162], [34, -174], [38, -182], [36, -176], [42, -172], [46, -180], [44, -188], [56, -193, 1], [44, -198],
    [46, -204], [41, -203], [41, -210], [36, -205], [32, -211], [28, -203], [24, -196], [20, -182], [14, -170], [0, -166], [-14, -168], [-24, -178],
    [-24, -200], [-30, -214, 1], [-34, -196], [-42, -210, 1], [-44, -190], [-56, -200, 1], [-52, -178], [-60, -176, 1], [-50, -160], [-40, -146], [-26, -136], [-10, -130]];
  const FLECHE = [[-82, -121], [80, -121], [80, -126, 1], [99, -118, 1], [80, -110, 1], [80, -115], [-82, -115], [-90, -106, 1], [-102, -106, 1], [-92, -118], [-102, -130, 1], [-90, -130, 1]];
  function metal(pts, seed) { pc(pts, GI.metal, () => hatch(null, 0.6, 3.4, 0.2), seed); if (!SIL()) strokePts(pts.concat([pts[0]]), GI.or, 1.4); }
  function drawGirouette(o) {
    const t = o.t || 0, tr = clamp(o.tremble || 0), bl = clamp(o.bloque || 0);
    let sens = clamp(o.sens == null ? 1 : o.sens, -1, 1);
    sens = clamp(sens + tr * (0.16 * Math.sin(t * TAU * 4.3) + 0.07 * Math.sin(t * TAU * 7.9 + 1)), -1, 1);
    const shake = bl > 0 && bl < 1 ? Math.sin(bl * 38) * (1 - bl) * 0.06 : 0, jit = bl > 0 && bl < 1 ? Math.sin(bl * 51) * (1 - bl) * 3 : 0;
    const c = cx_();
    c.save(); c.translate(jit, 0);
    metal([[-3, -4], [3, -4], [3, -122], [-3, -122]], 7401);                                                     // tige
    metal(ell(0, -10, 8, 8, 12), 7402);                                                                         // boule du pied
    metal([[-48, -62], [48, -62], [48, -57], [-48, -57]], 7403);                                                // croisillon (est-ouest)
    for (const [bx, by, br] of [[-50, -59.5, 6], [50, -59.5, 6], [-13, -52, 4.6], [13, -67, 4]]) metal(ell(bx, by, br, br, 10), 7404 + bx);   // quatre boules, aucune lettre
    if (!SIL()) strokePts([[-13, -52], [13, -67]], GI.metal, 2.4);
    metal(ell(0, -110, 5, 5, 10), 7410);
    c.save(); c.translate(0, -118); c.rotate(shake + tr * 0.025 * Math.sin(t * 29));
    let sx = sens; if (Math.abs(sx) < 0.07) sx = sx < 0 ? -0.07 : 0.07;
    c.scale(sx, 1); c.translate(0, 118);
    metal(FLECHE, 7411);
    if (!SIL()) { strokePts([[-2, -132], [-4, -121]], GI.metal, 2.6); strokePts([[7, -132], [7, -121]], GI.metal, 2.6); }
    metal(COQ, 7412);
    if (!SIL()) { strokePts([[-22, -150], [-2, -158], [16, -150]], GI.or, 1.2); strokePts([[-18, -142], [2, -148]], GI.or, 1); dot(33, -192, 1.9, GI.or); }
    c.restore();
    c.restore();
    if (bl > 0 && bl < 1 && !SIL()) {
      for (let i = 0; i < 8; i++) {
        const a = i * 0.8 + 0.3, r = 12 + 60 * ease(bl) * (0.7 + 0.3 * Math.sin(i * 3.1)), rr = 7 + 16 * bl;
        c.beginPath(); c.arc(Math.cos(a) * r, -118 + Math.sin(a) * r * 0.6 + 14 * bl, rr, 0, TAU);
        c.fillStyle = `rgba(214,200,170,${0.5 * (1 - bl)})`; c.fill();
      }
    }
  }
  // o : sens (−1..1 ; 1 = bec à droite), tremble 0..1, bloque 0..1 (avancement de la secousse + poussière), t
  HQ.girouette = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const r = acc('girouette', drawGirouette, x, y, s, o);
    const sens = clamp(o.sens == null ? 1 : o.sens, -1, 1);
    r.bec = r.w('o', 56 * sens, -193);
    return r;
  };

  // ---------------- vantaux (porte de Paris et portail de l'abbatiale) : chaque vantail tourne vers l'intérieur autour de sa charnière
  function vantail(side, wH, outline, th, col, colD, seed, details) {
    // outline : contour du vantail gauche (charnière en x = -wH) ; side 1 = vantail droit (miroir)
    const hinge = wH * side, sn = Math.sin(th), cs = Math.cos(th);
    const T = (q) => { const x = -side * q[0], u = (x - hinge) / (0 - hinge); return [hinge + (x - hinge) * cs, -280 + (q[1] + 280) * (1 - 0.1 * sn * u)]; };
    const TP = (pts) => pts.map((q) => (q[2] ? T(q).concat([1]) : T(q)));
    pc(TP(outline), M.mixc(col, '#1e140c', 0.55 * sn), () => details(TP, T, sn), seed);
  }
  // porte de Paris : ouverture 280 × 560 (arc en plein cintre), origine = milieu du seuil
  const PO = { wH: 140, h: 560, spring: 420, bois: '#6e4a2a', fer: '#2c2a28' };
  const PO_LEFT = (() => { const pts = [[-140, 0, 1], [0, 0, 1], [0, -560]]; for (let i = 1; i <= 10; i++) { const x = -14 * i, y = -420 - Math.sqrt(Math.max(0, 140 * 140 - x * x)); pts.push([x, y]); } pts.push([-140, -420, 1]); return pts; })();
  function drawPorte(o) {
    const th = clamp(o.ouvre || 0) * 1.42, ju = clamp(o.judas || 0), t = o.t || 0;
    for (const side of [-1, 1]) vantail(side, PO.wH, PO_LEFT, th, PO.bois, null, 7501 + side, (TP, T, sn) => {
      for (let x = -126; x < 0; x += 18) strokePts([T([x, -6]), T([x, -420 - Math.sqrt(Math.max(0, 19600 - x * x)) + 4])], 'rgba(30,18,8,0.5)', 1.3);
      for (const y of [-80, -250, -400]) { fillPts(TP([[-136, y - 7, 1], [-24, y - 7], [-14, y], [-24, y + 7], [-136, y + 7, 1]]), PO.fer); for (let x = -120; x < -20; x += 24) dot(...T([x, y]), 2, '#6a645c'); }
      for (let y = -40; y > -400; y -= 52) for (let x = -112; x < 0; x += 36) dot(...T([x, y - 120 * 0]), 1.8, 'rgba(20,14,10,0.7)');
      hatch(null, 0.15, 4.2, 0.22, 1, P.encre, [-200, -580, 200, 10]);
      if (side === 1 && sn < 0.3) {                                                                  // judas (vantail droit)
        fillPts(TP([[-92, -420, 1], [-48, -420, 1], [-48, -380, 1], [-92, -380, 1]]), PO.fer);
        fillPts(TP([[-88, -416, 1], [-52, -416, 1], [-52, -384, 1], [-88, -384, 1]]), '#120c08');
        if (o.yeux && ju > 0.4) { dot(...T([-78, -402]), 2.6, '#efe8da'); dot(...T([-62, -402]), 2.6, '#efe8da'); dot(...T([-77, -401]), 1.2, '#111'); dot(...T([-61, -401]), 1.2, '#111'); }
        const cj = Math.cos(ju * 1.45);
        fillPts(TP([[-88, -416, 1], [-88 + 36 * cj, -416 - 2 * ju, 1], [-88 + 36 * cj, -384 + 2 * ju, 1], [-88, -384, 1]]), M.mixc('#7a5232', '#3a2616', 0.5 * ju));
        for (const y of [-408, -392]) strokePts(TP([[-86, y], [-88 + 34 * cj, y]]), 'rgba(30,18,8,0.6)', 1);
      }
    });
    if (!SIL() && th > 0.02) { const c = cx_(); c.save(); c.globalAlpha = 0.25 * Math.sin(th); c.fillStyle = '#000'; c.fillRect(-140, -6, 280, 6); c.restore(); }
    void t;
  }
  // o : ouvre 0..1 (vantaux tournés vers l'intérieur), judas 0..1 (volet du judas, vantaux fermés seulement), yeux (deux yeux dans le judas), t
  HQ.porte = (x, y, s, o) => acc('porte', drawPorte, x, y, s, o);

  // portail central de l'abbatiale : ouverture 180 × 410 (arc brisé), origine = milieu du seuil
  const PT = { wH: 90, bois: '#5a3c26', fer: '#3a342c', bronze: '#8a6a34' };
  const PT_LEFT = (() => { const pts = [[-90, 0, 1], [0, 0, 1], [0, -410, 1]]; const a1 = Math.atan2(-100, -10.55) + TAU; for (let i = 9; i >= 1; i--) { const a = PI + (a1 - PI) * i / 10; pts.push([10.55 + 100.55 * Math.cos(a), -310 + 100.55 * Math.sin(a)]); } pts.push([-90, -310, 1]); return pts; })();
  function drawPortail(o) {
    const k = clamp(o.ouvre || 0), th = k * 1.42, c = cx_();
    if (!SIL() && k > 0) {
      c.save(); c.beginPath(); c.moveTo(-90, 0); c.lineTo(-90, -310); c.quadraticCurveTo(-80, -380, 0, -410); c.quadraticCurveTo(80, -380, 90, -310); c.lineTo(90, 0); c.closePath(); c.clip();
      const g = c.createRadialGradient(0, -170, 10, 0, -170, 260); g.addColorStop(0, `rgba(255,214,130,${0.55 * k})`); g.addColorStop(1, 'rgba(255,190,90,0)');
      c.globalCompositeOperation = 'screen'; c.fillStyle = g; c.fillRect(-100, -420, 200, 430); c.restore();
    }
    for (const side of [-1, 1]) vantail(side, PT.wH, PT_LEFT, th, PT.bois, null, 7601 + side, (TP, T) => {
      for (let x = -78; x < 0; x += 13) strokePts([T([x, -6]), T([x, -300 - (x + 90) * 0.9])], 'rgba(20,12,6,0.5)', 1.2);
      for (const y of [-70, -200, -300]) { fillPts(TP([[-88, y - 6, 1], [-16, y - 6], [-8, y], [-16, y + 6], [-88, y + 6, 1]]), PT.fer); }
      for (let y = -30; y > -300; y -= 40) for (let x = -76; x < 0; x += 26) dot(...T([x, y]), 1.7, PT.bronze);
      hatch(null, 0.15, 4.2, 0.24, 1, P.encre, [-120, -420, 120, 10]);
    });
    if (!SIL() && k > 0) {                                                                                // lumière dorée sur le parvis
      c.save(); c.globalCompositeOperation = 'screen';
      const g = c.createRadialGradient(0, 30, 10, 0, 30, 240); g.addColorStop(0, `rgba(255,205,120,${0.3 * k})`); g.addColorStop(1, 'rgba(255,190,90,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(-90, 0); c.lineTo(90, 0); c.lineTo(200, 70); c.lineTo(-200, 70); c.closePath(); c.fill(); c.restore();
    }
  }
  // o : ouvre 0..1
  HQ.portail = (x, y, s, o) => acc('portail', drawPortail, x, y, s, o);

  // =====================================================================
  // DÉCORS pré-rendus (HQ.init) — coordonnées ÉCRAN pour une pose M.flat(K.x, 540, ST.back) à l'échelle 1
  // =====================================================================
  const GAPS = [20, 180, 340, 500, 660, 820, 980];
  HQ.REMP = { creneauY: 760, merlonY: 690, creneaux: [20, 180, 500, 660, 980], porte: { x: 580, y: 1395, s: 1, w: 280, h: 560 },
    girouette: { x: 830, y: 500 }, tours: [330, 830], notreDame: { x: 580, y: 482 } };
  HQ.ABB = { portail: { x: 540, y: 1330, w: 180, h: 410 }, girouette: { x: 280, y: 476 }, rosace: { x: 540, y: 800, r: 72 }, parvisY: 1330, facade: [160, 920] };
  function stones(x0, y0, x1, y1, h, w, R, col) {
    for (let y = y1, row = 0; y > y0; y -= h, row++) {
      strokePts([[x0, y], [x1, y]], col, 1);
      const off = (row % 2) * w * 0.5;
      for (let x = x0 + off + R() * 10; x < x1; x += w * (0.8 + R() * 0.4)) strokePts([[x, y], [x, Math.max(y0, y - h)]], col, 0.9);
    }
  }
  function tower(cx, top, r, R, roofApex) {
    pc([[cx - r, 1400, 1], [cx - r, top + 30], [cx - r - 8, top + 4, 1], [cx - r - 8, top, 1], [cx + r + 8, top, 1], [cx + r + 8, top + 4, 1], [cx + r, top + 30], [cx + r, 1400, 1]], '#a69a83', () => {
      stones(cx - r - 10, top, cx + r + 10, 1400, 26, 44, R, 'rgba(70,58,40,0.35)');
      for (let x = cx - r - 6; x < cx + r + 8; x += 16) fillPts([[x, top + 4], [x + 9, top + 4], [x + 8, top + 22], [x + 1, top + 22]], 'rgba(40,30,20,0.45)');   // mâchicoulis
      fillPts([[cx - 4, 900], [cx + 4, 900], [cx + 4, 960], [cx - 4, 960]], '#1c140e');                                                    // archère
      fillPts([[cx - 4, 1120], [cx + 4, 1120], [cx + 4, 1180], [cx - 4, 1180]], '#1c140e');
      shade(cx + r, 0, cx - r, 0, 0.42, [cx - r - 10, top, cx + r + 10, 1400]);
      hatch([[cx + r * 0.3, top], [cx + r + 10, top], [cx + r + 10, 1400], [cx + r * 0.3, 1400]], 0.9, 4, 0.22);
    }, 9001 + cx);
    pc([[cx - r - 14, top + 2, 1], [cx - r * 0.5, top - 40], [cx, roofApex, 1], [cx + r * 0.5, top - 40], [cx + r + 14, top + 2, 1]], '#56606b', () => {
      for (let i = 1; i < 6; i++) { const y = lerp(roofApex, top, i / 6), hw = (r + 14) * i / 6; for (let x = cx - hw; x < cx + hw; x += 12) strokePts([[x, y], [x + 6, y + 6], [x + 12, y]], 'rgba(20,24,30,0.35)', 0.9); }
      shade(cx + r, 0, cx - r, 0, 0.4, [cx - r - 20, roofApex, cx + r + 20, top + 4]);
    }, 9101 + cx);
    pc(ell(cx, roofApex + 2, 5, 5, 10), '#3a3a3a', null, 9201 + cx);
  }
  function mkRemparts() {
    const cv = M.cutFlat(1160, 1010, 580, 1000, (x) => {
      x.translate(-540, -1395);
      const R = M.rng(1589);
      // Notre-Dame, silhouette pâle (deux tours carrées à sommet plat, façade entre les deux)
      x.save(); x.globalAlpha = 0.8;
      pc([[470, 820, 1], [470, 482, 1], [540, 482, 1], [540, 592, 1], [620, 592, 1], [620, 482, 1], [690, 482, 1], [690, 820, 1]], '#a9b2bd', () => {
        for (const tx of [480, 508, 630, 658]) fillPts([[tx, 580, 1], [tx, 512], [tx + 11, 498, 1], [tx + 22, 512], [tx + 22, 580, 1]], 'rgba(55,65,82,0.5)');
        for (const tx of [470, 620]) { strokePts([[tx, 488], [tx + 70, 488]], 'rgba(55,65,82,0.4)', 1.4); strokePts([[tx, 590], [tx + 70, 590]], 'rgba(55,65,82,0.4)', 1.4); }
        for (let ax = 474; ax < 688; ax += 9) fillPts([[ax, 616, 1], [ax, 602], [ax + 3.5, 597, 1], [ax + 7, 602], [ax + 7, 616, 1]], 'rgba(55,65,82,0.38)');
        strokePts(ell(580, 648, 28, 28, 18).concat([[608, 648]]), 'rgba(55,65,82,0.5)', 1.6); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; strokePts([[580, 648], [580 + 28 * Math.cos(a), 648 + 28 * Math.sin(a)]], 'rgba(55,65,82,0.35)', 1); }
        for (const tx of [484, 640]) fillPts([[tx, 690, 1], [tx, 646], [tx + 18, 630, 1], [tx + 36, 646], [tx + 36, 690, 1]], 'rgba(55,65,82,0.4)');
        hatch(null, 0.9, 5, 0.12);
      }, 9300, { drop: false });
      x.restore();
      // toits de Paris (ferme basse du kit, relevée et pâlie)
      const row = M.makeParisRow(); x.save(); x.globalAlpha = 0.72; x.drawImage(row, -40, 830 - 330); x.restore();
      // courtine crénelée
      const wall = [[-40, 1400, 1], [-40, 690, 1]];
      for (const g of GAPS) { const a = g - 46, b = g + 46; wall.push([a, 690, 1], [a, 760, 1], [b, 760, 1], [b, 690, 1]); }
      wall.push([1120, 690, 1], [1120, 1400, 1]);
      pc(wall, '#ab9f88', () => {
        stones(-40, 690, 1120, 1400, 28, 52, R, 'rgba(70,58,40,0.32)');
        strokePts([[-40, 792], [1120, 792]], 'rgba(60,48,32,0.5)', 2.4); strokePts([[-40, 796], [1120, 796]], 'rgba(255,245,225,0.3)', 1.2);
        for (const g of GAPS) fillPts([[g - 46, 760], [g + 46, 760], [g + 46, 768], [g - 46, 768]], 'rgba(40,30,20,0.35)');
        hatch([[-40, 1300], [1120, 1300], [1120, 1400], [-40, 1400]], 0.3, 4.5, 0.25);
        for (let i = 0; i < 26; i++) { const sx = R() * 1160 - 40, sy = 820 + R() * 540; fillPts([[sx, sy], [sx + 7, sy + 2], [sx + 4, sy + 8]], 'rgba(90,100,60,0.25)'); }
        shade(0, 700, 0, 1400, 0.25, [-40, 680, 1120, 1400]);
      }, 9400);
      // porte fortifiée : passage sombre (les vantaux sont dessinés par HQ.porte)
      const PX = 580, arch = (r, y0) => [[PX - r, 1400, 1], [PX - r, y0]].concat(ep(PX, y0, r, r, 16, PI, TAU).slice(1, -1), [[PX + r, y0], [PX + r, 1400, 1]]);
      pc(arch(172, 975), '#9b8f78', () => { for (let i = 0; i <= 14; i++) { const a = PI + PI * i / 14; strokePts([[PX + 140 * Math.cos(a), 975 + 140 * Math.sin(a)], [PX + 172 * Math.cos(a), 975 + 172 * Math.sin(a)]], 'rgba(60,48,32,0.55)', 1.4); } hatch(null, 0.9, 4, 0.2); }, 9500);
      pc(arch(140, 975), '#24180f', () => {
        const g = x.createRadialGradient(PX, 1150, 20, PX, 1150, 300); g.addColorStop(0, 'rgba(120,90,55,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(PX - 150, 820, 300, 600);
        fillPts(arch(62, 1080), 'rgba(236,214,170,0.55)');                                                           // sortie du passage, côté ville
        fillPts([[PX - 62, 1330], [PX + 62, 1330], [PX + 62, 1400], [PX - 62, 1400]], 'rgba(150,130,100,0.5)');
        strokePts([[PX - 140, 1395], [PX - 62, 1330]], 'rgba(0,0,0,0.4)', 1.4); strokePts([[PX + 140, 1395], [PX + 62, 1330]], 'rgba(0,0,0,0.4)', 1.4);
      }, 9501);
      tower(330, 640, 88, R, 500); tower(830, 640, 88, R, 500);
    });
    cv.padB = 10; return cv;
  }
  function mkTente() {
    const cv = M.cutFlat(420, 520, 210, 510, () => {
      const BL = '#56687a', IV = '#e3dac4';
      strokePts([[-176, -226], [-204, 0]], '#6e5a3e', 1.4); strokePts([[176, -226], [204, 0]], '#6e5a3e', 1.4);
      pc([[-2, -420], [2, -420], [2, -492], [-2, -492]], '#6e4a2a', null, 9601);
      pc([[2, -490, 1], [72, -480], [52, -474], [72, -466], [2, -458, 1]], '#3f5876', () => hatch(null, 0.4, 3.4, 0.25), 9602);
      pc(ell(0, -494, 5, 5, 10), '#b08a3e', null, 9603);
      pc([[-180, 0, 1], [-168, -230, 1], [168, -230, 1], [180, 0, 1]], IV, () => {
        for (let i = 0; i < 10; i++) { if (i % 2) continue; const a0 = -PI / 2 + PI * i / 10, a1 = -PI / 2 + PI * (i + 1) / 10; fillPts([[180 * Math.sin(a0), 0], [168 * Math.sin(a0), -230], [168 * Math.sin(a1), -230], [180 * Math.sin(a1), 0]], BL); }
        shade(170, 0, -170, 0, 0.32, [-182, -232, 182, 2]); hatch(null, 0.2, 4.4, 0.16);
      }, 9604);
      pc([[-64, 0, 1], [-62, -150], [0, -206, 1], [62, -150], [64, 0, 1]], '#2a1e16', () => {
        const g = M.ctx().createRadialGradient(0, -60, 10, 0, -60, 150); g.addColorStop(0, 'rgba(200,140,70,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); M.ctx().fillStyle = g; M.ctx().fillRect(-70, -210, 140, 212);
      }, 9605);
      for (const sd of [-1, 1]) pc([[0, -206], [sd * 66, -150], [sd * 104, -96, 1], [sd * 92, -60], [sd * 112, 0, 1], [sd * 66, 0], [sd * 58, -120]].map((q) => [q[0], q[1]]), IV, () => {
        fillPts([[sd * 20, -190], [sd * 48, -164], [sd * 78, -128], [sd * 70, -110], [sd * 40, -150]], BL); fillPts([[sd * 84, -94], [sd * 100, -80], [sd * 106, 0], [sd * 86, 0]], BL);
        strokePts([[sd * 96, -104], [sd * 86, -88]], '#b08a3e', 3); hatch(null, 0.8, 3.8, 0.22);
      }, 9606 + sd);
      pc([[-168, -230, 1], [-110, -330], [-40, -404], [0, -422, 1], [40, -404], [110, -330], [168, -230, 1]], IV, () => {
        for (let i = 0; i < 12; i++) { if (i % 2) continue; const x0 = -168 + 28 * i, x1 = x0 + 28; fillPts([[x0, -230], [0, -422], [x1, -230]], BL); }
        shade(160, -300, -160, -300, 0.3, [-170, -424, 170, -228]); hatch(null, 0.3, 4.6, 0.14);
      }, 9608);
      const val = [[-172, -232, 1], [172, -232, 1]];
      for (let i = 0; i <= 12; i++) { const x0 = 172 - i * 344 / 12; val.push([x0, -204], [x0 - 14.3, -196]); }
      pc(val.slice(0, -1).concat([[-172, -204, 1]]), BL, () => { strokePts([[-172, -226], [172, -226]], '#b08a3e', 2); hatch(null, 0.4, 3.6, 0.2); }, 9609);
      for (const sd of [-1, 1]) { pc([[sd * 200, -6], [sd * 208, -6], [sd * 206, 6], [sd * 202, 6]], '#5a4430', null, 9610 + sd); }
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function mkAbbatiale() {
    const cv = M.cutFlat(1160, 945, 580, 935, (x) => {
      x.translate(-540, -1395);
      const R = M.rng(1593), ST_ = '#d8d0bd', STD = '#c3b9a2';
      // parvis dallé
      pc([[-40, 1330, 1], [1120, 1330, 1], [1120, 1400, 1], [-40, 1400, 1]], '#c9bfa8', () => {
        for (const y of [1340, 1354, 1372]) strokePts([[-40, y], [1120, y]], 'rgba(80,66,46,0.4)', 1);
        for (let i = -14; i <= 14; i++) { const xb = 540 + i * 70; strokePts([[540 + (xb - 540) * 0.55, 1330], [xb, 1400]], 'rgba(80,66,46,0.32)', 1); }
        hatch(null, 0.2, 5, 0.12);
      }, 9700, { drop: false });
      // tour gauche + flèche
      pc([[170, 604, 1], [170, 592, 1], [390, 592, 1], [390, 604, 1]], ST_, null, 9702);
      pc([[204, 592, 1], [266, 524], [280, 476, 1], [294, 524], [356, 592, 1]], '#a79d88', () => {
        strokePts([[280, 476], [250, 592]], 'rgba(60,50,35,0.4)', 1.2); strokePts([[280, 476], [310, 592]], 'rgba(60,50,35,0.4)', 1.2);
        for (let y = 500; y < 592; y += 12) { const hw = (y - 476) * 0.65; strokePts([[280 - hw, y], [280 + hw, y]], 'rgba(60,50,35,0.25)', 0.8); }
        shade(374, 0, 186, 0, 0.35, [180, 470, 380, 594]);
      }, 9703);
      for (const gx of [200, 360]) pc([[gx - 14, 594, 1], [gx, 548, 1], [gx + 14, 594, 1]], STD, null, 9704 + gx);
      for (const gx of [236, 324]) pc([[gx - 10, 572, 1], [gx - 10, 556], [gx, 540, 1], [gx + 10, 556], [gx + 10, 572, 1]], '#a79d88', () => fillPts([[gx - 4, 570, 1], [gx - 4, 558], [gx, 552, 1], [gx + 4, 558], [gx + 4, 570, 1]], '#2c2a30'), 9708 + gx);
      // façade
      const top = [[385, 1330, 1], [385, 700, 1]];
      for (let mx = 395; mx < 920; mx += 40) top.push([mx, 700, 1], [mx, 690, 1], [mx + 22, 690, 1], [mx + 22, 700, 1]);
      top.push([920, 700, 1], [920, 1330, 1]);
      pc(top, ST_, () => {
        stones(385, 690, 920, 1330, 26, 54, R, 'rgba(90,76,52,0.28)');
        for (const y of [760, 1000]) { strokePts([[385, y], [920, y]], 'rgba(80,66,46,0.5)', 2.2); strokePts([[385, y + 4], [920, y + 4]], 'rgba(255,250,235,0.35)', 1.2); }
        hatch(null, 0.5, 5, 0.1);
      }, 9706);
      pc([[160, 1330, 1], [160, 700, 1], [175, 700, 1], [175, 600, 1], [385, 600, 1], [385, 1330, 1]], ST_, () => {
        stones(160, 600, 385, 1330, 26, 48, R, 'rgba(90,76,52,0.28)');
        for (const y of [760, 1000]) { strokePts([[160, y], [385, y]], 'rgba(80,66,46,0.5)', 2.2); }
        for (const lx of [212, 300]) { fillPts([[lx, 702, 1], [lx, 652], [lx + 2, 640], [lx + 24, 612, 1], [lx + 46, 640], [lx + 48, 652], [lx + 48, 702, 1]], '#2c2a30'); for (let y = 648; y < 700; y += 8) strokePts([[lx + 2, y], [lx + 46, y + 3]], 'rgba(150,140,120,0.45)', 1.2); strokePts([[lx + 24, 616], [lx + 24, 702]], 'rgba(150,140,120,0.5)', 1.4); }
        shade(385, 0, 160, 0, 0.2, [160, 600, 385, 1330]);
      }, 9707);
      // contreforts
      for (const [a, b] of [[160, 190], [370, 398], [682, 710], [890, 920]]) pc([[a - 6, 1330, 1], [a - 6, 1000, 1], [a, 980, 1], [a, 720, 1], [b, 720, 1], [b, 980, 1], [b + 6, 1000, 1], [b + 6, 1330, 1]], STD, () => {
        stones(a - 8, 720, b + 8, 1330, 26, 30, R, 'rgba(90,76,52,0.3)'); shade(b, 0, a, 0, 0.3, [a - 8, 700, b + 8, 1330]);
      }, 9710 + a);
      // portails latéraux (fermés) et lancettes
      const pointed = (cx, hw, spring, apex, base) => [[cx - hw, base, 1], [cx - hw, spring]].concat(qbez([cx - hw, spring], [cx - hw, apex + (spring - apex) * 0.2], [cx, apex], 6).slice(1, -1), [[cx, apex, 1]], qbez([cx, apex], [cx + hw, apex + (spring - apex) * 0.2], [cx + hw, spring], 6).slice(1, -1), [[cx + hw, spring], [cx + hw, base, 1]]);
      for (const cx of [280, 800]) {
        pc(pointed(cx, 78, 1120, 1030, 1330), STD, () => { for (let i = 0; i < 3; i++) strokePts(pointed(cx, 76 - i * 8, 1120, 1032 + i * 9, 1330).slice(1, -1), 'rgba(80,66,46,0.45)', 1.4); }, 9720 + cx);
        pc(pointed(cx, 54, 1140, 1078, 1330), '#4a3424', () => { strokePts([[cx, 1080], [cx, 1330]], 'rgba(10,6,4,0.7)', 1.6); for (const y of [1180, 1270]) strokePts([[cx - 52, y], [cx + 52, y]], '#2c2a28', 3); hatch(null, 0.1, 4, 0.25); }, 9730 + cx);
        pc(pointed(cx, 26, 880, 820, 960), '#2d3a52', () => { strokePts([[cx, 824], [cx, 960]], 'rgba(200,190,160,0.6)', 1.6); for (const y of [860, 900, 930]) strokePts([[cx - 26, y], [cx + 26, y]], 'rgba(200,190,160,0.5)', 1.2); fillPts([[cx - 20, 880], [cx - 4, 880], [cx - 4, 920], [cx - 20, 920]], 'rgba(160,60,50,0.4)'); }, 9740 + cx);
      }
      // portail central : voussures + intérieur sombre doré (les vantaux sont dessinés par HQ.portail)
      pc(pointed(540, 132, 1000, 870, 1330), STD, () => {
        for (let i = 0; i < 4; i++) { strokePts(pointed(540, 128 - i * 11, 1000, 874 + i * 12, 1330).slice(1, -1), 'rgba(80,66,46,0.5)', 1.6); }
        for (let i = 0; i < 9; i++) { const a = -PI * 0.92 + PI * 0.84 * i / 8; dot(540 + 112 * Math.cos(a), 1000 + 108 * Math.sin(a) * 0.95, 4, 'rgba(120,104,80,0.5)'); }
        for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) strokePts([[540 + sx * (96 + i * 9), 1010], [540 + sx * (96 + i * 9), 1330]], 'rgba(80,66,46,0.45)', 1.4);
        hatch(null, 0.9, 4, 0.14);
      }, 9750);
      pc(pointed(540, 90, 1020, 920, 1330), '#1c140c', () => {
        const g = x.createRadialGradient(540, 1180, 10, 540, 1180, 230); g.addColorStop(0, 'rgba(214,160,72,0.75)'); g.addColorStop(0.5, 'rgba(120,80,30,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(440, 900, 200, 440);
        for (const cx of [490, 590]) strokePts([[cx, 1330], [cx, 980]], 'rgba(10,6,2,0.45)', 6);
        for (const [cx, cy] of [[520, 1205], [560, 1205], [540, 1190]]) { dot(cx, cy, 3.4, 'rgba(255,226,150,0.95)'); dot(cx, cy + 9, 1.6, 'rgba(240,230,200,0.8)'); }
      }, 9751);
      // grande rosace (verres colorés, réseau rayonnant sans motif lisible)
      const RO = HQ.ABB.rosace;
      pc(ell(RO.x, RO.y, RO.r + 10, RO.r + 10, 28), STD, null, 9760);
      pc(ell(RO.x, RO.y, RO.r, RO.r, 28), '#2a3550', () => {
        const cols = ['#4a5f8a', '#8a3a32', '#b08a3e', '#56664a', '#4a5f8a', '#7a4a6a'];
        for (let i = 0; i < 12; i++) { const a0 = i * TAU / 12, a1 = (i + 1) * TAU / 12; fillPts([[RO.x + 24 * Math.cos(a0), RO.y + 24 * Math.sin(a0)], [RO.x + RO.r * Math.cos(a0), RO.y + RO.r * Math.sin(a0)], [RO.x + RO.r * Math.cos((a0 + a1) / 2) * 1.02, RO.y + RO.r * Math.sin((a0 + a1) / 2) * 1.02], [RO.x + RO.r * Math.cos(a1), RO.y + RO.r * Math.sin(a1)], [RO.x + 24 * Math.cos(a1), RO.y + 24 * Math.sin(a1)]], cols[i % 6] + 'cc'); }
        for (let i = 0; i < 12; i++) { const a = i * TAU / 12; strokePts([[RO.x + 22 * Math.cos(a), RO.y + 22 * Math.sin(a)], [RO.x + RO.r * Math.cos(a), RO.y + RO.r * Math.sin(a)]], '#cfc6b0', 2.4); }
        for (let i = 0; i < 12; i++) { const a = (i + 0.5) * TAU / 12; strokePts(ell(RO.x + 52 * Math.cos(a), RO.y + 52 * Math.sin(a), 9, 9, 10).concat([[RO.x + 52 * Math.cos(a) + 9, RO.y + 52 * Math.sin(a)]]), '#cfc6b0', 1.6); }
        strokePts(ell(RO.x, RO.y, 22, 22, 16).concat([[RO.x + 22, RO.y]]), '#cfc6b0', 2.4); dot(RO.x, RO.y, 10, '#b08a3e');
      }, 9761);
    });
    cv.padB = 10; return cv;
  }
  HQ.init = () => { HQ.K = { remparts: mkRemparts(), tente: mkTente(), abbatiale: mkAbbatiale() }; return HQ.K; };
})();
