// persos.js — « Petit Bateau, la culotte née d'une comptine » (Troyes 1910-1920 → aujourd'hui) : marionnettes, accessoires, étendoir et décor PROPRES À CETTE VIDÉO.
// Espace M.pb (alias PB). Mode d'emploi : persos.md (ne pas lire ce fichier en entier). PB.init() dans S.init (pré-rendus du décor PB.maison).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash / M.rng, aucun Math.random) : tout est fonction pure de t.
// MARIONNETTES (avec tige ; (x,y) = pieds) : PB.etienne (0,9) · PB.germaine (0,85) · PB.garcon (0,58) · PB.fille (0,52) · PB.chat (def.libre, 1)
// ACCESSOIRES (sans tige) : PB.bateau · PB.culotte · PB.etiquette · PB.tasEtiquettes · PB.ciseaux · PB.tampon ; PB.etendoir(t, o)
// DÉCOR : PB.maison(t, o) → M.drawFloor() → PB.maisonSol(t, o) ; repères PB.MAISON ; PB.pt(r, nom, arriere) = point nommé de l'objet tenu
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const PB = (M.pb = {});
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
  const rotP = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
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
  function ringPts(cx, cy, rx, ry, w, n) { const l = ep(cx, cy, rx, ry, n || 20, 0, TAU); return ribbon(l, w, w); }
  function qbez(p0, p1, p2, n) { const o = []; n = n || 12; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function clipDo(pts, fn) { if (SIL()) return; const c = cx_(); c.save(); M.path(pts, 0, 0); c.clip(); fn(c); c.restore(); }
  PB.geo = { ep, ell, ribbon, qbez, rot, tr, scl, mp, box, ringPts };

  // ------------------------------------------------------------ squelettes : adulte (A) et enfant (K)
  const R_COUDE = 11.5;
  function mkSK(o) { const k = Object.assign({}, o); k.LB = Math.hypot(k.HAND[0], k.HAND[1]); k.PHI = Math.atan2(-k.HAND[0], k.HAND[1]); return k; }
  const SK_A = mkSK({ SH_F: [-2, -146], SH_B: [-10, -146], LA: 96, HAND: [4, 96], NECK: [6, -170], fk: 1, H: 238 });
  const SK_K = mkSK({ SH_F: [-2, -124], SH_B: [-8, -124], LA: 82, HAND: [3.5, 84], NECK: [4, -142], fk: 0.875, H: 216 });
  PB.SK = { A: SK_A, K: SK_K };
  function armR(len, wt, wTop, rc) { wt = wt || 15; rc = rc || R_COUDE; const wT = wTop || wt; return ep(0, 0, wT, wT, 10, PI, TAU).concat([[wT - 1, 22], [wt - 1, len * 0.46], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, len * 0.46], [-wT + 1, 22]]); }
  const H_BAS = [[-8, 78], [8, 78], [9, 90], [9, 105], [5, 117], [-2, 119], [-8, 114], [-10, 104], [-10, 94], [-15, 99], [-18, 95], [-12, 86]];
  function handShape(k) { return k === 'fist' ? X.HAND_FIST : k === 'bas' ? H_BAS : X.HAND_OPEN; }
  function foreR(kind, fk) {
    const h = handShape(kind);
    const o = ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[10, 40], [9, 76]], h.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [[-9, 86], [-10, 76], [-11, 40]]);
    return fk && fk !== 1 ? scl(o, fk) : o;
  }
  function handPaintK(kind) {
    if (kind === 'fist') { strokePts([[0, 92], [12, 92]], 'rgba(60,30,20,0.5)', 1); strokePts([[-2, 99], [10, 99]], 'rgba(60,30,20,0.5)', 1); return; }
    if (kind === 'bas') { strokePts([[-1, 100], [-3, 113]], 'rgba(70,35,20,0.45)', 1); strokePts([[3, 100], [3, 112]], 'rgba(70,35,20,0.45)', 1); return; }
    X.handPaint(null, 'open');
    if (kind === 'paume') fillPts([[2, 88], [9, 92], [8, 108], [2, 112]], 'rgba(255,225,200,0.25)');
  }
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant' (coude devant), 'arriere'. Le coude ne plie que vers l'avant.
  function ik2(SK, S, T, pick, retry) {
    const LA = SK.LA, LB = SK.LB, PHI = SK.PHI;
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      const sc = (b > 0.05 ? -1e6 : 0) + (pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : pick === 'haut' ? -E[1] : E[1]);
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    if (best.sc < -1e5) return retry ? { a: tv, b: 0, sc: 0 } : ik2(SK, S, [Math.max(T[0], S[0] + 12), T[1]], pick, true);
    return best;
  }
  PB.ik2 = ik2;

  // ------------------------------------------------------------ poses : outils communs
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function headPt(q, SK, hx, hy) { return mp(new DOMMatrix().translate(SK.NECK[0], SK.NECK[1]).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, SK, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(SK, arm === 'armF' ? SK.SH_F : SK.SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const has = (v) => v && v !== 'rien';
  const kv = (q, n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
  function plier(q, th, H) {                                 // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return; H = H || 238;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - H * Math.sin(th); q.dy = (q.dy || 0) + H * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function marcher(q, cad, amp, bob, bras) {
    const m = q.marche === true ? 1 : clamp(q.marche || 0); if (m <= 0) return;
    const ph = (q.t || 0) * PI * cad, s = Math.sin(ph), A = q.ang;
    A.legF = (A.legF || 0) - amp * s * m; A.legB = (A.legB || 0) + amp * s * m;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * bob * m;
    if (bras.F) A.armF_up = (A.armF_up || 0) + 0.14 * s * m;
    if (bras.B) A.armB_up = (A.armB_up || 0) - 0.14 * s * m;
  }
  // point écran → repère du torse (options `cible`)
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

  // =====================================================================
  // OBJETS — chacun dessiné dans son repère (échelle 1), seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const BT = { coque: '#8E2A22', coqueD: '#6c1f19', coqueL: '#a8402f', liser: '#efe5cc', mat: '#6a4426', matL: '#8a5e36', voile: '#efe6d0', voileD: '#d3c8ac', fanion: '#8E2A22', bois: '#c8a06a', boisD: '#9a7444', soulier: '#2a1e1a' };
  PB.BT = BT;
  const COQUE = [[-80, -46, 1], [-30, -48], [20, -49], [60, -51], [86, -56, 1], [74, -36], [54, -16], [22, -5], [-26, -4], [-58, -12], [-74, -26], [-79, -38]];
  // petites jambes de marionnette en bois sous la coque (gag du plan 3) : k 0..1 sortie, gigotent avec t
  function jambeBois(x0, k, t, ph) {
    const a1 = (0.55 * Math.sin(t * 11 + ph) - 0.15) * k, a2 = (0.5 + 0.45 * Math.sin(t * 11 + ph + 1.3)) * k, L = 24 * k;
    const K = [x0 - L * Math.sin(a1), -8 + L * Math.cos(a1)];
    const sh = a1 - a2 * 0.6, F = [K[0] - L * Math.sin(sh), K[1] + L * Math.cos(sh)];
    pc(ribbon([[x0, -10], K], 9, 8), BT.bois, () => strokePts([[x0 - 2, -6], [K[0] - 2, K[1]]], 'rgba(255,240,200,0.4)', 1), 9101);
    pc(ribbon([K, F], 8, 7), BT.bois, null, 9102);
    const fa = sh; pc(rot([[-5, -3], [12, -4], [16, 2, 1], [-6, 4, 1]], fa, 0, 0).map((p) => [p[0] + F[0], p[1] + F[1]]), BT.soulier, null, 9103);
    if (!SIL()) { M.rivet(x0, -8, 2.2); M.rivet(K[0], K[1], 2.2); }
  }
  function drawBateau(o) {
    const t = o.t || 0, c = cx_(), ja = clamp(o.jambes || 0), cu = ease(clamp(o.couche || 0));
    c.save();
    if (cu > 0) { const a = cu * 1.0; let my = -1e9; for (const q of rot(COQUE, a, 54, -14)) my = Math.max(my, q[1]); c.translate(0, -4 - my); c.translate(54, -14); c.rotate(a); c.translate(-54, 14); }
    if (o.tangue) { const k = o.tangue === true ? 1 : +o.tangue; c.translate(0, -3 * Math.sin(t * 2.3) * k); c.rotate(0.085 * Math.sin(t * 1.6) * k); }
    if (ja > 0) { jambeBois(-26, ja, t, 0); jambeBois(24, ja, t, 2.1); }
    // fanion qui flotte (sans motif)
    const fl = Math.sin(t * 5) * 3;
    pc([[1, -152, 1], [24, -148 + fl], [1, -141, 1]], BT.fanion, null, 9110, { drop: false });
    // voiles : grand-voile derrière le mât, foc vers l'étrave
    pc([[-3, -140, 1], [-3, -58, 1], [-62, -57, 1]], BT.voile, () => { for (let k = 1; k < 4; k++) strokePts([[-3, -58 - k * 20], [-62 + k * 14, -57 - k * 2]], 'rgba(120,100,70,0.35)', 1); shade(-3, -100, -60, -60, 0.22, [-70, -150, 10, -50]); }, 9111);
    pc([[5, -136, 1], [78, -60, 1], [6, -60, 1]], BT.voile, () => { strokePts([[6, -98], [40, -62]], 'rgba(120,100,70,0.3)', 1); shade(6, -100, 70, -60, 0.18, [0, -140, 80, -55]); }, 9112);
    pc(box(-3, -150, 3, -44), BT.mat, () => strokePts([[-1, -148], [-1, -46]], 'rgba(255,230,190,0.4)', 1), 9113);
    pc(box(-64, -58, 0, -54), BT.mat, null, 9114, { drop: false });                       // bôme
    // coque rouge, liseré ivoire, hublots
    pc(COQUE, BT.coque, () => {
      fillPts(ribbon([[-82, -41], [-30, -43], [20, -44], [62, -46], [90, -51]], 6), BT.liser);
      for (const x of [-40, -10, 20]) { dot(x, -28, 4.2, BT.liser); dot(x, -28, 2.4, '#5a6a7a'); }
      hatch([[-80, -40], [80, -40], [60, -2], [-80, -2]], 0.8, 4, 0.22);
      shade(0, -46, 0, -2, 0.35, [-90, -60, 90, 0]);
      strokePts([[-60, -14], [20, -8], [54, -18]], 'rgba(255,200,180,0.25)', 1.4);
    }, 9115);
    c.restore();
  }
  // --- la culotte de coton (vue de face) : origine = bas des jambes ; ceinture y −118..−101
  const CU = { coton: '#F1EBDD', cotonD: '#d9d0bd', cotonDD: '#c4b9a2', fil: 'rgba(150,135,110,0.7)' };
  PB.CU = CU;
  function culotteGeo(o) {
    const e = clamp(o.etire || 0), m = clamp(o.molle || 0), wb = 1 + 0.4 * e, wc = 1 + 0.25 * e, k = 0.93;
    const f = (x, y, band) => {
      const w = band ? wb : lerp(wb, wc, clamp((y + 100) / 60));
      let X1 = x * k * w, Y1 = y;
      if (m > 0 && !band) { const d = clamp((y + 100) / 100); X1 *= 1 - 0.18 * m * d; Y1 += m * (22 * d + 6 * Math.abs(x) / 90 * d); }
      if (m > 0 && band) Y1 += m * 7 * (1 - Math.abs(x) / 80);
      return [X1, Y1];
    };
    const body = [[80, -101], [86, -70], [90, -34], [92, -10, 1], [54, -2], [16, -8, 1], [0, -30, 1], [-16, -8, 1], [-54, -2], [-92, -10, 1], [-90, -34], [-86, -70], [-80, -101]];
    const bandT = [], bandB = [];
    for (let i = 0; i <= 16; i++) { const x = -80 + i * 10; bandT.push(f(x, -118 + (i % 2 ? -1.6 : 0) * (1 - e), true)); bandB.push(f(x, -101, true)); }
    const all = [f(-80, -118, true).concat(1), f(80, -118, true).concat(1)].concat(body.map((p) => { const q = f(p[0], p[1], false); if (p[2]) q.push(1); return q; }));
    return { all, bandT, bandB, f, wb, e, m };
  }
  function drawEtiquette(o) {
    // petite étiquette ivoire cousue, dessin d'un bateau rouge (aucune lettre) ; origine = centre ; 44 × 32
    pc(box(-22, -16, 22, 16), '#efe7d2', () => {
      strokePts([[-18, -12], [18, -12], [18, 12], [-18, 12], [-18, -12]], 'rgba(140,40,34,0.55)', 0.9);
      for (let x = -16; x <= 16; x += 4) { strokePts([[x, -15], [x + 2, -15]], 'rgba(120,100,70,0.6)', 0.8); strokePts([[x, 15], [x + 2, 15]], 'rgba(120,100,70,0.6)', 0.8); }
      fillPts([[-10, 3], [11, 3], [7, 8], [-7, 8]], BT.coque);
      fillPts([[0, -10], [0, 2], [-8, 2]], '#d8ccb0'); strokePts([[0, -10], [0, 2], [-8, 2], [0, -10]], 'rgba(90,40,30,0.8)', 0.8);
      fillPts([[2, -8], [9, 2], [2, 2]], '#d8ccb0'); strokePts([[2, -8], [9, 2], [2, 2]], 'rgba(90,40,30,0.8)', 0.8);
      strokePts([[-12, 11], [-8, 10], [-4, 11], [0, 10], [4, 11], [8, 10], [12, 11]], 'rgba(60,80,110,0.7)', 0.9);
    }, 9120, { drop: o && o.drop === false ? false : undefined });
  }
  function drawCulotte(o) {
    const g = culotteGeo(o), c = cx_(), et = clamp(o.etiquette || 0);
    if (et > 0) {                                     // étiquette cousue au dos de la ceinture : elle dépasse au-dessus, grossie ×1,4 à 1
      const s = lerp(0.2, 1.4, ease(et)), y0 = g.f(0, -118, true)[1];
      c.save(); c.translate(0, y0 - 14 * s + 4); c.scale(s, s); c.rotate(-0.04); drawEtiquette({}); c.restore();
    }
    pc(g.all, o.couleur || CU.coton, () => {
      if (o.rayures) for (let y = -96; y < 0; y += 13) fillPts([[-140, y], [140, y], [140, y + 6], [-140, y + 6]], o.rayures);
      fillPts(g.bandT.concat(g.bandB.slice().reverse()), 'rgba(120,100,70,0.2)');
      for (let i = 0; i < g.bandT.length; i++) { const a = g.bandT[i], b = g.bandB[i]; strokePts([[a[0] + 2, a[1] + 1], [b[0] + 1, b[1] - 1]], `rgba(140,125,100,${0.55 - 0.4 * g.e})`, 1); }
      strokePts(g.bandB, CU.fil, 1.1); strokePts(g.bandB.map((p) => [p[0], p[1] + 3]), 'rgba(150,135,110,0.35)', 0.8);
      strokePts([g.f(0, -100, false), g.f(0, -32, false)], 'rgba(150,135,110,0.45)', 1);
      for (const s of [-1, 1]) {
        const h = [g.f(92 * s, -10, false), g.f(54 * s, -2, false), g.f(16 * s, -8, false)];
        strokePts(h.map((p) => [p[0], p[1] - 5]), CU.fil, 0.9);
        strokePts([g.f(70 * s, -96, false), g.f(78 * s, -60, false), g.f(60 * s, -20, false)], 'rgba(160,145,120,0.3)', 1.2);
      }
      hatch(null, 0.8, 5, 0.12, 1, '120,105,80', [-130, -140, 130, 30]);
      shade(0, -110, 0, 0, 0.2, [-130, -140, 130, 40]);
    }, 9121);
  }
  // --- tas d'étiquettes en cône (niveau 0..1 → ≈ 300 de haut), quelques-unes glissent sur la pente avec t
  const TAS = []; { const R = M.rng(9130); for (let i = 0; i < 260; i++) TAS.push({ u: R() * 2 - 1, v: Math.pow(R(), 0.8), a: (R() - 0.5) * 1.6, s: 0.8 + R() * 0.35 }); TAS.sort((a, b) => a.v - b.v); }
  function tasH(n) { return 300 * clamp(n); }
  function drawTas(o) {
    const n = clamp(o.niveau == null ? 1 : o.niveau), t = o.t || 0, c = cx_(); if (n <= 0.01) return;
    const H = tasH(n), B = 1.25 * H + 50;
    pc([[-B / 2, 0, 1], [-B * 0.3, -H * 0.42], [-B * 0.12, -H * 0.86], [0, -H], [B * 0.12, -H * 0.86], [B * 0.3, -H * 0.42], [B / 2, 0, 1]], '#d8ceb4', () => {
      hatch(null, 0.7, 4.4, 0.18, 1, '90,70,40', [-B, -H - 10, B, 10]); shade(-B / 2, 0, B / 2, 0, 0.25, [-B, -H - 10, B, 10]);
    }, 9131);
    const cnt = Math.round(TAS.length * clamp(0.15 + 0.85 * n));
    for (let i = 0; i < TAS.length; i++) {
      const L = TAS[i]; if (i % Math.max(1, Math.round(TAS.length / cnt)) && n < 0.98) continue;
      const y = -L.v * H * 0.97, hw = (1 - L.v) * B / 2 * 0.92, x = L.u * hw;
      c.save(); c.translate(x, y); c.rotate(L.a + 0.3 * L.u); c.scale(L.s, L.s * 0.92); drawEtiquette({ drop: false }); c.restore();
    }
    for (let k = 0; k < 3; k++) {                       // glissades le long de la pente
      const u = ((t * 0.32 + k * 0.37) % 1 + 1) % 1, sd = k % 2 ? 1 : -1, y = -H * (1 - u) * 0.9, x = sd * (u * B / 2 * 0.95 + 6);
      c.save(); c.globalAlpha = c.globalAlpha * smooth(0, 0.1, u) * (1 - smooth(0.85, 1, u)); c.translate(x, y); c.rotate(sd * (0.6 + u * 2.4)); drawEtiquette({ drop: false }); c.restore();
    }
  }
  // --- grands ciseaux de tailleur (fer noir) : origine = pivot ; lames vers +x ; coupe 0 ouvert → 1 fermé
  const FER = '#2b2a2e', FERL = '#5a5960';
  function cisOuv(o) { return lerp(0.46, 0.02, clamp(o.coupe || 0)); }
  function drawCiseaux(o) {
    const op = cisOuv(o), c = cx_();
    const lame = (sg) => [[-10, 0], [40, -2 * sg], [104, -1 * sg], [126, 1 * sg, 1], [104, 4 * sg], [40, 7 * sg], [-6, 8 * sg]];
    const bras = (sg) => sg > 0 ? { sh: [[-6, 2], [-36, 10], [-44, 12]], ring: [-62, 15, 15, 11] } : { sh: [[-6, -2], [-34, -10], [-44, -12]], ring: [-68, -15, 22, 13] };
    for (const sg of [1, -1]) {                        // sg 1 : lame inférieure + anneau du pouce ; sg −1 : lame supérieure + grand anneau
      const a = sg > 0 ? op * 0.35 : -op * 0.65;
      c.save(); c.rotate(a);
      const b = bras(sg);
      pc(ringPts(b.ring[0], b.ring[1], b.ring[2], b.ring[3], 6.5, 22), FER, () => strokePts(ep(b.ring[0], b.ring[1], b.ring[2] - 2, b.ring[3] - 2, 10, PI, TAU * 0.9), 'rgba(200,200,210,0.35)', 1), 9140 + sg);
      pc(ribbon(b.sh.concat([[b.ring[0] + b.ring[2] * 0.7, b.ring[1] * 0.85]]), 9, 7), FER, null, 9142 + sg);
      pc(lame(sg > 0 ? -1 : 1), FER, () => { strokePts([[0, sg > 0 ? -3 : 3], [110, 0]], 'rgba(220,220,230,0.5)', 1.2); }, 9144 + sg);
      c.restore();
    }
    if (!SIL()) M.rivet(0, 0, 3.6);
  }
  // --- tampon de bois (gestes `tampon`) : origine = semelle ; poignée en haut
  function drawTampon() {
    pc(box(-22, -20, 22, -6), '#7a4a28', () => strokePts([[-20, -17], [20, -17]], 'rgba(255,220,170,0.35)', 1), 9150);
    pc(box(-20, -6, 20, 0), '#6a2420', null, 9151, { drop: false });
    pc(box(-5, -40, 5, -19), '#9a6438', null, 9152);
    pc(ell(0, -48, 12, 10, 14), '#9a6438', () => strokePts([[-6, -53], [2, -55]], 'rgba(255,230,190,0.5)', 1.2), 9153);
  }
  // seconde main de la culotte et du bateau : prise « deux mains » quand o.deux
  const cuW = (o) => 80 * 0.93 * (1 + 0.4 * clamp(o.etire || 0));

  // =====================================================================
  // REGISTRE : grip = point tenu dans le poing ; p2 = seconde prise (deuxMains) ; pts = points nommés ; base = origine de l'accessoire seul
  // =====================================================================
  const OBJ = {
    bateau: { draw: drawBateau, grip: (o) => (o.deux ? [40, -26] : [0, -26]), p2: () => [-42, -26],
      pts: { coque: [0, -26], mat: [0, -150], voile: [-24, -90], quille: [0, -4], etrave: [86, -56] }, base: [0, 0] },
    culotte: { draw: drawCulotte, grip: (o) => (o.deux ? [cuW(o), -110] : [0, -110]), p2: (o) => [-cuW(o), -110],
      pts: { ceinture: [0, -112], etiquette: [0, -140], centre: [0, -60], fond: [0, -4] }, base: [0, 0] },
    etiquette: { draw: drawEtiquette, grip: [-14, 0], pts: { centre: [0, 0] }, base: [0, 0] },
    ciseaux: { draw: drawCiseaux, grip: [-62, 0], pts: { pointe: (o) => rotP([126, 1], cisOuv(o) * 0.35), pivot: [0, 0], anneaux: [-62, 0] }, base: [0, 0] },
    tampon: { draw: drawTampon, grip: [0, -32], pts: { empreinte: [0, 0] }, base: [0, 0] },
    tas: { draw: drawTas, grip: [0, 0], pts: { sommet: (o) => [0, -tasH(o.niveau == null ? 1 : o.niveau)] }, base: [0, 0] },
    libre: { draw: (o) => { if (o.draw) o.draw(o); }, grip: (o) => o.grip || [0, 0], p2: (o) => o.p2 || [0, 0], pts: {}, base: [0, 0] },
  };
  PB.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, nom, o) => { const v = ob.pts[nom]; return typeof v === 'function' ? v(o) : v; };

  // objet tenu : options par défaut selon l'objet (k = échelle de l'objet dans la main)
  const HELD = { culotte: { k: 0.8 } };
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, HELD[name] || {}, p._heldK ? { k: p._heldK } : {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), k = oo.k || 1;
    c.save(); c.scale(k, k); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed, SK) {
    const H = SK.HAND, fd = SK.fk === 1 ? DOIGTS : scl(DOIGTS, SK.fk);
    return {
      objet: { parent: 'armF_lo', at: H, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: H, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fd : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: H, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB) && !p._devB) heldDraw(p.tenuB, p.tenuBO, p); } },
      objetB2: { parent: 'armB_lo', at: H, noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (has(p.tenuB) && p._devB) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: H, noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? fd : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran (r renvoyé par une enveloppe PB.etienne/germaine/garcon/fille)
  PB.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ptOf(ob, nom, oo), k = oo.k || 1;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };
  // objet droit à l'écran, seconde main sur la seconde prise
  function finish(q, SK) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.objetB2 = A.objetB;
    q._deux = !!q._deuxL; q._devB = q.devantB != null ? !!q.devantB : false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2 && !has(q.tenuB)) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), k = oo.k || 1, p2 = ob.p2(oo);
      const Hf = new DOMMatrix().translate(SK.SH_F[0], SK.SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, SK.LA).rotate((A.armF_lo || 0) * D)
        .translate(SK.HAND[0], SK.HAND[1]).rotate((A.objet || 0) * D).scale(k, k).translate(-g[0], -g[1]);
      const T = mp(Hf, p2), sol = ik2(SK, SK.SH_B, T, q.pickB || 'bas');
      const kk = q.deuxMains === true ? 1 : clamp(q.deuxMains);
      A.armB_up = lerp(A.armB_up || 0, sol.a, kk); A.armB_lo = lerp(A.armB_lo || 0, sol.b, kk); q.handB = 'fist'; q._deux = kk > 0.6;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o || {}));
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB; r.def = def;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', def.handAt[0], def.handAt[1]); r.mainB = r.w('armB_lo', def.handAt[0], def.handAt[1]);
    return r;
  }
  // pièces de bras communes
  function upDef(SK, at, base, seed, paint, wt, wTop) {
    return { parent: 'torso', at, pts: armR(SK.LA, wt, wTop, R_COUDE * SK.fk), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) };
  }
  // avant-bras : manche (couleur `manche`) jusqu'à y = finManche (repère local), puis peau ; revers facultatif
  function foreDef(SK, back, manche, skin, seed, finManche, revers) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist', fk = SK.fk;
    return { parent: back ? 'armB_up' : 'armF_up', at: [0, SK.LA], pts: (p) => foreR(hk(p), fk), base: skin, seed, paint: (p) => {
      c_scale(fk, () => {
        if (finManche > -20) fillPts([[-30, -30, 1], [30, -30, 1], [30, finManche, 1], [-30, finManche, 1]], manche);
        if (revers) { fillPts([[-22, finManche - 14, 1], [22, finManche - 14, 1], [22, finManche + 2, 1], [-22, finManche + 2, 1]], revers); strokePts([[-16, finManche - 6], [16, finManche - 8]], 'rgba(120,110,90,0.55)', 1); }
        handPaintK(hk(p));
        if (finManche < 60) for (let y = finManche + 10; y < 70; y += 9) strokePts([[-6, y], [-2, y + 4]], 'rgba(60,30,20,0.3)', 0.8);
        hatch([[-14, -10], [-3, -10], [-3, 70], [-14, 70]], 0.9, 3.8, 0.18);
      });
    } };
  }
  function c_scale(k, fn) { if (k === 1) { fn(); return; } const c = cx_(); c.save(); c.scale(k, k); fn(); c.restore(); }
  const ORDER = (fond, heads, apres, jambes) => ['armB_up', 'armB_lo', 'objetB'].concat(fond || [], jambes || ['legB', 'legF'], ['head'], heads, ['torso'], apres || [], ['objetB2', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);

  // =====================================================================
  // ÉTIENNE VALTON (vers 1913, la quarantaine) — bonnetier : cheveux bruns plaqués en arrière, moustache en guidon relevée, tête nue ;
  // chemise ivoire manches retroussées + fixe-manches noirs, gilet bleu nuit à boutons laiton, pantalon gris ardoise, chaussures brunes ;
  // mètre ruban jaune ocre autour du cou (son emblème)
  // =====================================================================
  const ET = { peau: '#e2bd98', peauD: '#c49c78', cheveux: '#3b2618', cheveuxL: '#7a5a3e', chemise: '#ece6d6', chemiseD: '#cfc8b4', gilet: '#23324F', giletD: '#18233a',
    laiton: '#c09a48', pant: '#4b5159', pantD: '#3c4148', chaus: '#5a3820', metre: '#C9A23A', metreD: '#9c7a26', fixe: '#141214' };
  PB.ET = ET;
  const ET_TORSO = [[-14, -178], [10, -182], [20, -170], [30, -150], [37, -116], [41, -76], [41, -36], [36, 0], [36, 40, 1], [-36, 40, 1], [-36, 0], [-36, -60], [-37, -110], [-35, -150], [-26, -170]];
  const ET_HEAD = [[-14, 16], [10, 16], [11, 2], [17, -5], [24, -9], [28, -15], [27, -20], [29, -24], [28, -28], [31, -33], [39, -40, 1], [33, -47], [29, -56], [29, -65], [26, -79], [14, -92], [-6, -97], [-25, -88], [-33, -68], [-32, -46], [-25, -28], [-18, -8]];
  const ET_HAIR = [[27, -73], [27, -86], [17, -98], [-4, -104], [-24, -98], [-36, -82], [-39, -60], [-36, -40], [-29, -34], [-25, -46], [-16, -58], [-7, -62], [-3, -50], [3, -50], [4, -64], [14, -70]];
  const ET_MOUST = [[22, -30], [28, -33], [34, -32], [40, -30], [44, -32], [46, -38, 1], [48.5, -32], [45, -27], [39, -25], [32, -25], [26, -26]];
  function etHeadPaint(p) {
    const f = p.face || {};
    X.earPaint(-8, -44);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
    dot(14, -30, 8, 'rgba(205,120,100,0.2)');
    X.eye(f, 16, -52); X.brow(f, 16, -61, 'rgba(40,24,14,0.95)', 2.6);
    strokePts([[31, -44], [27, -36]], 'rgba(120,70,50,0.35)', 1);
    if (p._souffle) { dot(22, -22, 7, 'rgba(225,150,130,0.35)'); fillPts(ell(30, -21, 3.2, 3.6, 10), '#3a1714', 0, 0); }
    else X.mouth(f, 26, -20);
  }
  function mkEtienne() {
    const torsoPaint = () => {
      fillPts(box(-40, 4, 40, 44), ET.pant); strokePts([[-36, 8], [36, 8]], 'rgba(20,20,24,0.5)', 1.2);
      const gil = [[-38, -170], [-4, -176], [6, -164], [20, -132], [31, -112], [41, -76], [41, -36], [37, 0], [40, 14, 1], [14, 7], [-38, 9]];
      fillPts(gil, ET.gilet);
      strokePts([[6, -164], [20, -132], [31, -112], [41, -76], [41, -36], [37, 0], [40, 14]], 'rgba(150,170,210,0.35)', 1.2);
      for (const [x, y] of [[26, -122], [33, -98], [37, -74], [37, -50], [37, -26], [35, -4]]) { dot(x, y, 2.4, ET.laiton); dot(x - 0.6, y - 0.6, 0.9, 'rgba(255,245,200,0.9)'); }
      fillPts([[-4, -48], [16, -48], [16, -44], [-4, -44]], 'rgba(10,14,26,0.6)');                                   // poche
      fillPts([[10, -184], [22, -170], [16, -164], [6, -172]], '#f6f1e4');                                            // col
      fillPts([[16, -170], [24, -168], [22, -162], [16, -164]], '#2a1e1a');                                           // petit nœud sombre
      // mètre ruban : brin avant sur la poitrine, brin arrière sur l'omoplate
      const ml = [[9, -180], [16, -152], [21, -120], [24, -88], [24, -56]], m1 = ribbon(ml, 10);
      fillPts(m1, '#d6ad40'); strokePts(m1.concat([m1[0]]), 'rgba(90,64,14,0.8)', 0.8);
      for (let k = 0; k < 15; k++) { const u = k / 14, i = Math.min(3, Math.floor(u * 4)), f = u * 4 - i, P0 = ml[i], P1 = ml[i + 1], x = lerp(P0[0], P1[0], f), y = lerp(P0[1], P1[1], f); strokePts([[x - 4.5, y], [x + (k % 2 ? -1 : 1.5), y]], 'rgba(40,28,10,0.75)', 0.8); }
      fillPts(box(19, -60, 29, -50), ET.laiton);
      const m2 = ribbon([[-14, -180], [-22, -150], [-26, -120], [-27, -98]], 10); fillPts(m2, ET.metreD);
      fillPts(box(-31, -100, -23, -92), ET.laiton);
      hatch([[-50, -170], [-12, -170], [-10, 40], [-50, 40]], 0.75, 4.2, 0.28);
      shade(36, 0, -34, 0, 0.26);
    };
    const legP = (back) => () => {
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], ET.chaus);
      strokePts([[-18, 214], [44, 222]], 'rgba(255,220,180,0.25)', 1);
      if (!back) { strokePts([[18, 226], [40, 230]], 'rgba(255,230,200,0.3)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); strokePts([[6, 20], [6, 205]], 'rgba(20,20,26,0.25)', 1); }
      else hatch(null, 0.8, 3.6, 0.3);
    };
    const upP = (back) => () => {
      fillPts(box(-20, 34, 20, 46), ET.fixe); dot(back ? -6 : 8, 40, 1.6, '#8a8a90');
      for (const x of [-10, 2]) strokePts([[x, 50], [x + 3, 80]], 'rgba(120,110,90,0.35)', 1);
      hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, back ? 0.32 : 0.22);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: ET_TORSO, base: ET.chemise, seed: 8001, paint: torsoPaint },
      legB: { parent: 'torso', at: [-5, -2], pts: X.legPts(0.92), base: ET.pantD, seed: 8002, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [5, -2], pts: X.legPts(0.92), base: ET.pant, seed: 8003, paint: legP(false) },
      armB_up: upDef(SK_A, [-10, -146], ET.chemiseD, 8004, upP(true), 14),
      armB_lo: foreDef(SK_A, true, ET.chemiseD, ET.peauD, 8005, 14, '#c4bca6'),
      head: { parent: 'torso', at: [6, -170], pts: ET_HEAD, base: ET.peau, seed: 8006, noRivet: true, paint: etHeadPaint,
        extra: (p) => {                                                    // souffle : petites bouffées d'air devant la bouche
          if (!p._souffle || SIL()) return; const t = p.t || 0;
          for (let k = 0; k < 3; k++) { const u = ((t * 1.6 + k / 3) % 1); strokePts(qbez([36 + u * 40, -26 - 8 + k * 7], [44 + u * 46, -22 + k * 7], [36 + u * 60, -18 - 6 + k * 7], 6), `rgba(250,248,240,${0.95 * (1 - u)})`, 2.6); }
        } },
      cheveux: { parent: 'head', at: [0, 0], pts: ET_HAIR, base: ET.cheveux, seed: 8007, noRivet: true, paint: () => {
        for (let k = 0; k < 6; k++) strokePts(qbez([24 - k * 2, -78 + k * 5], [0, -96 + k * 7], [-30 + k, -76 + k * 7], 8), 'rgba(160,120,80,0.35)', 1.1);
        strokePts([[24, -88], [4, -100], [-18, -96]], 'rgba(230,200,160,0.3)', 1.6);
      } },
      moustache: { parent: 'head', at: [0, 0], pts: ET_MOUST, base: ET.cheveux, seed: 8008, noRivet: true, paint: () => strokePts([[26, -30], [40, -29], [48, -33]], 'rgba(170,130,90,0.4)', 1) },
      armF_up: upDef(SK_A, [-2, -146], ET.chemise, 8009, upP(false), 14),
      armF_lo: foreDef(SK_A, false, ET.chemise, ET.peau, 8010, 14, '#ddd6c2'),
    };
    Object.assign(parts, heldParts(ET.peau, 8020, SK_A));
    return { hipY: -238, parts, handLen: 104, handAt: SK_A.HAND, rod: { part: 'torso', at: [-24, 22] }, nom: 'Etienne', order: ORDER([], ['cheveux', 'moustache']) };
  }
  CH.pbEtienne = mkEtienne();
  // gestes : marche, ciseaux (+coupe), presente, idee, perplexe, etire (0 = tient à deux mains → 1 étirée), tampon (+frappe), souffle, reverence, range (+cible)
  PB.etiennePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, SK = SK_A;
    const ci = kv(q, 'ciseaux'), pr = kv(q, 'presente'), id = kv(q, 'idee'), pe = kv(q, 'perplexe'), so = kv(q, 'souffle'), rv = kv(q, 'reverence'), ra = kv(q, 'range');
    const etOn = q.etire != null && q.etire !== false, et = etOn ? clamp(q.etire === true ? 1 : q.etire) : 0;
    const ta = kv(q, 'tampon'), fr = clamp(q.frappe || 0);
    if (ci > 0) { q.tenu = 'ciseaux'; q.tenuO = Object.assign({ coupe: q.coupe || 0 }, q.tenuO); }
    if (etOn) { q.tenu = 'culotte'; q.tenuO = Object.assign({}, q.tenuO, { deux: true, etire: et }); }
    if (ta > 0) q.tenu = 'tampon';
    const libreF = !has(q.tenu) && !pr && !id && !rv && !ra && !so && !pe, libreB = !has(q.tenuB) && !etOn && !ra && !so && !ta && !(q.deuxMains);
    marcher(q, 1.6, 0.26, 4, { F: libreF, B: libreB });
    A.armF_lo = (A.armF_lo || 0) - 0.08; A.armB_lo = (A.armB_lo || 0) - 0.08;
    if (so > 0) { plier(q, 0.3 * so, 238); armTo(q, SK, 'armF', [96, -14], 'bas', so); armTo(q, SK, 'armB', [60, -10], 'bas', so); if (so > 0.5) { q.handF = 'bas'; q.handB = 'bas'; } A.head = (A.head || 0) + 0.06 * so; q._souffle = so > 0.5; if (!f.brow) f.brow = 'n'; }
    if (rv > 0) { plier(q, 0.3 * rv, 238); A.head = (A.head || 0) + 0.24 * rv; armTo(q, SK, 'armF', [30, -134], 'bas', rv); if (rv > 0.5) q.handF = 'open'; blend(q, 'armB_up', 0.08, rv); if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'smile'; }
    if (ra > 0) {
      const L = q.cibleL || [150, -10];
      plier(q, 0.32 * ra, 238); armTo(q, SK, 'armF', L, 'bas', ra); armTo(q, SK, 'armB', [L[0] - 70, L[1] + 4], 'bas', ra);
      if (ra > 0.5) { q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; } A.head = (A.head || 0) + 0.2 * ra;
    }
    if (ci > 0) { armTo(q, SK, 'armF', [150, -64], 'bas', ci); A.objet = 0.04; armTo(q, SK, 'armB', [70, -40], 'bas', ci); A.head = (A.head || 0) + 0.12 * ci; }
    if (etOn) {
      const hw = cuW(q.tenuO) * 0.8, C = [96, -98];
      armTo(q, SK, 'armF', [C[0] + hw, C[1]], 'bas', 1); A.objet = 0; q.deuxMains = true; q.pickB = 'bas';
      A.head = (A.head || 0) + 0.08; if (!f.mouth) f.mouth = 'smile'; if (et > 0.6 && !f.brow) f.brow = 'up';
    }
    if (ta > 0) {
      armTo(q, SK, 'armF', [lerp(118, 132, fr), lerp(-104, -10, ease(fr))], 'bas', ta); A.objet = 0;
      armTo(q, SK, 'armB', [70, -12], 'bas', ta); if (ta > 0.5) q.handB = 'bas'; A.head = (A.head || 0) + 0.18 * ta;
    }
    if (pr > 0) {
      armTo(q, SK, 'armF', q.cibleL || [128, -118], 'bas', pr);
      if (has(q.tenu)) A.objet = 0; else if (pr > 0.4) q.handF = 'paume';
      A.head = (A.head || 0) - 0.04 * pr; if (!f.mouth) f.mouth = 'smile';
    }
    if (id > 0) {
      armTo(q, SK, 'armF', headPt(q, SK, 62, -84), 'bas', id); if (id > 0.5) q.handF = 'open';
      A.head = (A.head || 0) - 0.14 * id; if (!f.brow) f.brow = 'up'; if (!f.eyes) f.eyes = 'wide'; if (!f.mouth) f.mouth = 'o';
    }
    if (pe > 0) {
      const H = headPt(q, SK, -20 + 3 * Math.sin(t * 15), -86 + 4 * Math.cos(t * 15));
      armTo(q, SK, 'armF', H, 'avant', pe); if (pe > 0.5) q.handF = 'open';
      A.head = (A.head || 0) + 0.1 * pe; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
    }
    return finish(q, SK);
  };
  PB.etienne = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; return run(CH.pbEtienne, avecCible(CH.pbEtienne, PB.etiennePose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // GERMAINE VALTON — cheveux auburn en chignon haut noué d'un ruban vert éteint ; robe longue ocre moutarde à fines rayures,
  // tablier à petits carreaux rouge sang / ivoire ; pas de jambes (la robe touche le sol)
  // =====================================================================
  const GE = { peau: '#ecc9a6', peauD: '#cfa684', cheveux: '#8A4B2A', cheveuxL: '#b26a3e', ruban: '#5f7350', rubanD: '#4a5a3e', robe: '#B8892F', robeD: '#977024', robeL: '#cf9f42',
    tab: '#f0e6d0', carreau: '#9b2a24', col: '#f4eee0' };
  PB.GE = GE;
  const GE_TORSO_F = (j) => [[-12, -176], [8, -180], [16, -170], [24, -150], [32, -124], [30, -96], [22, -66], [30, -40], [42, 30], [54, 120], [63 + 2 * j, 200], [70 + 5 * j, 234, 1], [-58 + 5 * j, 236, 1], [-54 + 2 * j, 160], [-46, 70], [-34, -20], [-24, -64], [-28, -96], [-32, -130], [-30, -152], [-22, -170]];
  const GE_HEAD = [[-12, 16], [10, 16], [14, 6], [20, -2], [25, -9], [27, -15], [26, -19], [28, -22], [27, -26], [29, -30], [34, -36, 1], [30, -43], [28, -52], [29, -62], [25, -76], [13, -87], [-6, -91], [-22, -85], [-32, -66], [-32, -44], [-26, -26], [-18, -8]];
  const GE_HAIR = [[27, -60], [31, -74], [25, -88], [12, -97], [0, -100], [-6, -110], [-4, -124], [-14, -134], [-30, -132], [-36, -118], [-31, -104], [-38, -92], [-42, -70], [-40, -46], [-32, -30], [-24, -36], [-22, -54], [-10, -68], [8, -74], [20, -70]];
  const GE_RUBAN = [[-30, -108], [-40, -116], [-46, -106], [-36, -102], [-32, -100], [-38, -90], [-28, -94], [-22, -104], [-8, -106], [-8, -100], [-26, -98]];
  function geHeadPaint(p) {
    const f = p.face || {};
    X.earPaint(-6, -44); dot(-4, -34, 2.2, '#c9a24a');
    hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.2);
    dot(13, -28, 8, 'rgba(215,120,110,0.3)');
    X.eye(f, 15, -47, 0.95); strokePts([[9, -50], [7, -53]], 'rgba(28,16,14,0.9)', 1.2);
    X.brow(f, 15, -55, 'rgba(110,56,30,0.9)', 1.8);
    const bo = p._bouche;
    if (bo != null && bo > 0.04) { fillPts(ell(22, -19, 2.6 + 1.2 * bo, 1.2 + 4.6 * bo, 12), '#4a1a16', 0, 0); strokePts(ep(22, -19, 3.4 + 1.2 * bo, 2 + 4.6 * bo, 8, -PI * 0.9, -PI * 0.1), 'rgba(170,70,70,0.8)', 1.2); }
    else { fillPts([[24, -22], [20, -21], [18, -19], [22, -18]], '#b05050', 0, 0); X.mouth(f, 23, -20, 'rgba(140,45,45,0.9)'); }
  }
  function mkGermaine() {
    const torsoPaint = (p) => {
      const j = p._jupe || 0;
      for (let x = -60; x < 80; x += 7) strokePts([[x * 0.45, -176], [x * 0.5, -66], [x * 0.85 + j * 2, 236]], 'rgba(90,60,16,0.35)', 0.8);
      fillPts([[-10, -184], [10, -186], [18, -168], [12, -160], [-8, -164]], GE.col); strokePts([[-8, -170], [14, -172]], 'rgba(150,130,100,0.6)', 1);
      // tablier à bavette, petits carreaux rouge sang / ivoire
      const tab = [[4, -132], [27, -128], [24, -68], [36, -20], [48, 70], [58, 172], [16, 182], [8, 70], [4, -20], [2, -68]];
      fillPts(tab, GE.tab);
      clipDo(tab, () => {
        for (let x = -4; x < 64; x += 8) fillPts([[x, -140], [x + 3.5, -140], [x + 3.5, 190], [x, 190]], 'rgba(155,42,36,0.55)');
        for (let y = -136; y < 190; y += 8) fillPts([[-4, y], [70, y], [70, y + 3.5], [-4, y + 3.5]], 'rgba(155,42,36,0.45)');
        hatch(null, 0.7, 4, 0.15, 1, '90,30,20', [0, -140, 70, 190]);
      });
      strokePts(tab.concat([tab[0]]), 'rgba(110,30,26,0.6)', 1.2);
      strokePts([[4, -132], [-6, -172]], GE.tab, 2.6); strokePts([[4, -132], [-6, -172]], 'rgba(155,42,36,0.5)', 1);
      fillPts([[-26, -72, 1], [24, -72, 1], [24, -62, 1], [-26, -62, 1]], GE.tab);                       // cordon de taille
      strokePts([[-24, -66], [-38, -46], [-34, -36]], GE.tab, 3); strokePts([[-24, -66], [-40, -56]], GE.tab, 3);
      hatch([[-60, -170], [-14, -170], [-20, 236], [-60, 236]], 0.75, 4.4, 0.26, 1.05, '80,50,20');
      shade(40, 0, -44, 0, 0.24);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => GE_TORSO_F(p._jupe || 0), base: GE.robe, seed: 8101, paint: torsoPaint },
      armB_up: upDef(SK_A, [-10, -146], GE.robeD, 8104, () => { for (const x of [-12, -4, 4, 12]) strokePts([[x, -24], [x * 0.8, 96]], 'rgba(80,50,10,0.35)', 0.8); hatch(null, 0.9, 3.8, 0.3); }, 14, 22),
      armB_lo: foreDef(SK_A, true, GE.robeD, GE.peauD, 8105, 68, GE.col),
      head: { parent: 'torso', at: [6, -172], pts: GE_HEAD, base: GE.peau, seed: 8106, noRivet: true, paint: geHeadPaint },
      cheveux: { parent: 'head', at: [0, 0], pts: GE_HAIR, base: GE.cheveux, seed: 8107, noRivet: true, paint: () => {
        for (let k = 0; k < 5; k++) strokePts(qbez([26 - k * 3, -66 - k * 4], [6, -92 + k * 3], [-30 + k * 2, -84 + k * 8], 8), 'rgba(220,140,90,0.35)', 1.1);
        strokePts(ep(-20, -120, 12, 10, 10, -PI, PI * 0.7), 'rgba(220,150,100,0.4)', 1.2);
        hatch(null, 0.5, 3.4, 0.2, 1, '60,20,10');
      } },
      ruban: { parent: 'head', at: [0, 0], pts: GE_RUBAN, base: GE.ruban, seed: 8108, noRivet: true, paint: () => strokePts([[-40, -110], [-32, -104], [-24, -102]], 'rgba(220,230,200,0.35)', 1) },
      armF_up: upDef(SK_A, [-2, -146], GE.robe, 8109, () => { for (const x of [-12, -4, 4, 12]) strokePts([[x, -24], [x * 0.8, 96]], 'rgba(80,50,10,0.35)', 0.8); strokePts([[-10, -16], [-8, 60]], 'rgba(255,240,200,0.2)', 2); hatch([[-20, -20], [-3, -20], [-3, 100], [-20, 100]], 0.9, 3.8, 0.22); }, 14, 18),
      armF_lo: foreDef(SK_A, false, GE.robe, GE.peau, 8110, 68, GE.col),
    };
    Object.assign(parts, heldParts(GE.peau, 8120, SK_A));
    return { hipY: -236, parts, handLen: 104, handAt: SK_A.HAND, rod: { part: 'torso', at: [-16, 40] }, nom: 'Germaine', order: ORDER([], ['cheveux', 'ruban'], [], []) };
  }
  CH.pbGermaine = mkGermaine();
  // gestes : marche, tenu:'bateau', berce, tendre (+cible), nonTete, chante
  PB.germainePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, SK = SK_A;
    const be = kv(q, 'berce'), te = kv(q, 'tendre'), no = kv(q, 'nonTete'), ch = kv(q, 'chante');
    if (be > 0) q.tenu = 'bateau';
    const m = q.marche === true ? 1 : clamp(q.marche || 0);
    if (m > 0) { const ph = t * PI * 1.6; q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 3 * m; q.tilt = (q.tilt || 0) + 0.012 * Math.sin(ph) * m; q._jupe = Math.sin(ph) * m;
      if (!has(q.tenu) && !te) A.armF_up = (A.armF_up || 0) + 0.12 * Math.sin(ph) * m; if (!has(q.tenuB) && !be) A.armB_up = (A.armB_up || 0) - 0.12 * Math.sin(ph) * m; }
    A.armF_lo = (A.armF_lo || 0) - 0.1; A.armB_lo = (A.armB_lo || 0) - 0.1;
    if (q.tenu === 'bateau' && be <= 0 && !te) { armTo(q, SK, 'armF', q.cibleL || [112, -96], 'bas', 1); A.objet = 0; }
    if (be > 0) {
      const w = TAU * 0.45, sw = Math.sin(t * w), C = [104 + 20 * sw, -96 - 9 * Math.abs(Math.cos(t * w))], ao = 0.16 * Math.sin(t * w + 0.6) * be;
      q.tenuO = Object.assign({}, q.tenuO, { deux: true });
      const gF = rotP([40, 0], ao);
      armTo(q, SK, 'armF', [C[0] + gF[0], C[1] + gF[1]], 'bas', 1); A.objet = ao; q.deuxMains = be; q.pickB = 'bas';
      A.head = (A.head || 0) + (0.12 + 0.04 * sw) * be; if (!f.mouth) f.mouth = 'smile'; if (!f.eyes) f.eyes = 'half';
    }
    if (te > 0) {
      plier(q, 0.06 * te, 236);
      armTo(q, SK, 'armF', q.cibleL || [150, -40], 'bas', te);
      if (has(q.tenu)) A.objet = 0; else if (te > 0.4) q.handF = 'paume';
      A.head = (A.head || 0) + 0.12 * te; if (!f.mouth) f.mouth = 'smile';
    }
    if (no > 0) { A.head = (A.head || 0) + 0.09 * Math.sin(t * TAU * 1.7) * no; if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'up'; }
    if (ch > 0) {
      A.head = (A.head || 0) + 0.07 * Math.sin(t * TAU * 0.5) * ch - 0.05 * ch;
      q._bouche = ch * (0.5 + 0.5 * Math.sin(t * TAU * 1.5)); if (!f.eyes) f.eyes = 'half';
    }
    return finish(q, SK);
  };
  PB.germaine = (pose, x, y, s, o) => { s = s == null ? 0.85 : s; return run(CH.pbGermaine, avecCible(CH.pbGermaine, PB.germainePose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // LES ENFANTS VALTON — gabarit d'enfant à genoux articulés (legX = cuisse, legX_lo = tibia + pied nu ; legX_lo > 0 plie le genou)
  // garçon ≈ 6 ans (cheveux châtains en épi) ; fille ≈ 4 ans (blond vénitien, deux couettes à rubans rouge sang, maillot à petit col)
  // tenue : 'calecon' (caleçon long de laine gris-beige chiné, trois boutons d'os) | 'coupe' (coupé au-dessus du genou, bords effilochés)
  //         | 'culotte' (coton blanc écru, ceinture froncée) | 'aujourdhui' (culotte + t-shirt marinière, garçon)
  // =====================================================================
  const KD = { peau: '#efcfb2', peauD: '#d6b090', maillot: '#efe9da', maillotD: '#d8d1bf', calecon: '#9C8F7A', caleconD: '#857a66', culotte: '#F1EBDD', culotteD: '#d9d0bd',
    mar: '#23324F', boy: '#7a5232', boyL: '#a0744c', girl: '#c8874f', girlL: '#e2a66a', ruban: '#8E2A22', os: '#efe6cf' };
  PB.KD = KD;
  const KD_TORSO = [[-12, -150], [8, -153], [16, -144], [24, -128], [28, -104], [30, -70], [32, -34], [29, 0], [30, 24, 1], [-28, 24, 1], [-27, 0], [-28, -60], [-30, -100], [-28, -128], [-20, -146]];
  const KD_THIGH = ep(0, -4, 15, 15, 10, PI, TAU).concat([[15, 30], [13, 96]], ep(0, 108, 12.5, 12.5, 10, 0, PI), [[-13, 96], [-15, 30]]);
  const KD_SHIN = ep(0, 0, 12.5, 12.5, 10, PI, TAU).concat([[11, 40], [9, 84], [14, 92], [30, 97], [37, 102], [35, 108, 1], [-12, 108, 1], [-14, 98], [-10, 84], [-11, 40]]);
  const KD_HEAD = [[-14, 14], [12, 14], [13, 2], [20, -4], [26, -8], [29, -13], [28, -17], [31, -21], [30, -26], [34, -30], [39, -34, 1], [34, -40], [33, -48], [36, -62], [34, -80], [26, -98], [8, -114], [-14, -118], [-32, -110], [-46, -90], [-50, -64], [-46, -40], [-36, -22], [-20, -6]];
  const BOY_HAIR = [[33, -74], [31, -92], [21, -106], [12, -114], [16, -131, 1], [4, -119], [-2, -138, 1], [-9, -121], [-20, -121], [-35, -113], [-48, -94], [-53, -70], [-51, -48], [-43, -44], [-39, -58], [-30, -70], [-18, -76], [0, -80], [14, -82], [24, -76]];
  const GIRL_HAIR = [[33, -72], [32, -92], [22, -108], [6, -120], [-14, -124], [-34, -116], [-49, -96], [-54, -70], [-52, -46], [-44, -40], [-40, -56], [-32, -70], [-18, -78], [-2, -86], [10, -84], [18, -90], [24, -78]];
  const BOY_HAIR_MOD = [[35, -64], [37, -84], [29, -101], [14, -113], [-6, -121], [-27, -117], [-43, -103], [-51, -82], [-53, -60], [-49, -46], [-42, -44], [-38, -58], [-28, -68], [-14, -73], [2, -74], [14, -70], [22, -62], [28, -68]];
  const COUETTE = [[-7, -4], [7, -4], [12, 14], [13, 34], [8, 52], [0, 64, 1], [-6, 52], [-11, 32], [-11, 12]];
  const NOEUD = [[-15, -10, 1], [0, -3], [15, -10, 1], [15, 8, 1], [0, 3], [-15, 8, 1]];
  const isCal = (te) => te === 'calecon' || te === 'coupe';
  function kidLegPaint(back, lo) {
    return (p) => {
      const te = p.tenue || 'calecon', base = back ? KD.peauD : KD.peau;
      if (!lo) {
        if (isCal(te)) {
          const y1 = te === 'coupe' ? 80 : 140;
          fillPts(box(-30, -30, 30, y1), back ? KD.caleconD : KD.calecon);
          for (let k = 0; k < 40; k++) dot(lerp(-12, 12, hash(k * 3.1 + (back ? 7 : 0))), lerp(-14, y1 - 4, hash(k * 5.7 + 1)), 1.2, 'rgba(230,220,200,0.45)');
          if (te === 'coupe') { const fr = []; for (let x = -16; x <= 16; x += 4) fr.push([x, 80 + (Math.abs(x) % 8 ? 7 : 0)]); fillPts([[-16, 76]].concat(fr, [[16, 76]]), back ? KD.caleconD : KD.calecon); for (let x = -12; x <= 12; x += 5) strokePts([[x, 82], [x + 1, 90]], 'rgba(120,108,88,0.8)', 0.8); }
        } else {
          fillPts(box(-30, -30, 30, 24), back ? KD.culotteD : KD.culotte); strokePts([[-16, 20], [16, 24]], 'rgba(150,135,110,0.7)', 1);
        }
      } else if (te === 'calecon') {
        fillPts(box(-30, -20, 30, 84), back ? KD.caleconD : KD.calecon);
        for (let k = 0; k < 30; k++) dot(lerp(-10, 10, hash(k * 2.3 + (back ? 9 : 2))), lerp(-10, 82, hash(k * 4.1 + 3)), 1.2, 'rgba(230,220,200,0.45)');
        fillPts(box(-12, 76, 12, 86), back ? '#7a705e' : '#8a7f6a'); for (let x = -9; x <= 9; x += 3) strokePts([[x, 77], [x, 85]], 'rgba(60,50,40,0.5)', 0.7);
      }
      if (lo) { strokePts([[30, 100], [34, 104]], 'rgba(120,70,50,0.5)', 0.8); strokePts([[24, 100], [27, 106]], 'rgba(120,70,50,0.4)', 0.8); dot(4, 92, 2, 'rgba(150,90,70,0.3)'); }
      hatch(back ? null : [[-16, -10], [-5, -10], [-5, 110], [-16, 110]], 0.8, 3.8, back ? 0.28 : 0.2);
      void base;
    };
  }
  function kidTorsoPaint(fille) {
    return (p) => {
      const te = p.tenue || 'calecon';
      fillPts([[6, -154], [16, -144], [22, -132], [10, -138], [2, -146]], KD.peau);                                 // encolure
      if (te === 'aujourdhui') { for (let y = -136; y < -6; y += 13) fillPts(box(-40, y, 40, y + 6), KD.mar); }
      else { for (let x = -24; x < 30; x += 7) strokePts([[x, -140], [x + 1, -8]], 'rgba(150,140,120,0.25)', 0.8); }
      if (fille) { fillPts(ep(10, -146, 9, 6, 8, 0, PI).concat([[1, -146]]), '#fbf7ec'); fillPts(ep(-10, -148, 9, 6, 8, 0, PI).concat([[-19, -148]]), '#fbf7ec'); strokePts(ep(10, -146, 9, 6, 8, 0, PI), 'rgba(150,130,100,0.7)', 0.9); }
      if (isCal(te)) {
        fillPts(box(-40, -8, 40, 30), KD.calecon);
        for (let k = 0; k < 50; k++) dot(lerp(-26, 28, hash(k * 1.9 + 4)), lerp(-6, 24, hash(k * 3.3 + 2)), 1.2, 'rgba(230,220,200,0.45)');
        strokePts([[-28, -6], [30, -6]], 'rgba(80,70,56,0.6)', 1.2);
        for (const y of [0, 9, 18]) { dot(25, y, 2.6, KD.os); dot(25, y, 0.9, 'rgba(120,100,70,0.8)'); }
      } else {
        fillPts(box(-40, -10, 40, 30), KD.culotte);
        fillPts(box(-40, -10, 40, -2), KD.culotteD); for (let x = -26; x < 30; x += 4) strokePts([[x, -9], [x + 1, -3]], 'rgba(140,125,100,0.6)', 0.8);
        strokePts([[22, 0], [26, 24]], 'rgba(150,135,110,0.4)', 1);
      }
      hatch([[-44, -150], [-10, -150], [-8, 26], [-44, 26]], 0.75, 4.2, 0.22);
      shade(30, 0, -30, 0, 0.22);
    };
  }
  function kidEye(f, x, y) {
    const e = f.eyes || 'open';
    if (e === 'closed') { strokePts([[x - 7, y], [x, y + 3], [x + 7, y - 1]], 'rgba(30,18,16,0.9)', 1.8); return; }
    const k = e === 'wide' ? 1.4 : e === 'half' ? 0.55 : 1;
    fillPts(ell(x, y, 6.5, 4.6 * k, 12), '#f6f1e6', 0, 0);
    dot(x + 2.4, y + 0.4, 3.1 * Math.min(1.1, k + 0.1), '#2a1f1d'); dot(x + 3.3, y - 0.8, 0.9, 'rgba(255,255,255,0.9)');
    strokePts(ep(x, y, 7, 5 * k, 8, PI * 1.05, PI * 1.95), 'rgba(28,16,14,0.95)', 1.8);
  }
  function kidHeadPaint(fille) {
    return (p) => {
      const f = p.face || {};
      X.earPaint(-10, -48);
      dot(16, -28, 10, 'rgba(225,110,100,0.32)');
      hatch([[-24, -40], [0, -24], [10, -6], [-8, 14], [-34, 0]], 0.6, 3.8, 0.18);
      kidEye(f, 19, -52); X.brow(f, 19, -63, fille ? 'rgba(170,110,60,0.9)' : 'rgba(90,56,30,0.9)', 1.8);
      if (!fille) for (const [x, y] of [[8, -38], [12, -36], [6, -34]]) dot(x, y, 0.9, 'rgba(150,80,50,0.5)');
      if (f.mouth === 'joie') { fillPts([[30, -20], [22, -17], [25, -11], [30, -13]], '#5a1a18', 0, 0); }
      else X.mouth(f, 29, -18, 'rgba(150,60,55,0.95)');
    };
  }
  function mkKid(fille) {
    const sd = fille ? 8300 : 8200, hair = fille ? KD.girl : KD.boy;
    const parts = {
      torso: { parent: null, at: [0, 0], pts: KD_TORSO, base: KD.maillot, seed: sd + 1, paint: kidTorsoPaint(fille) },
      legB: { parent: 'torso', at: [-4, -2], pts: KD_THIGH, base: KD.peauD, seed: sd + 2, noRivet: true, paint: kidLegPaint(true, false) },
      legB_lo: { parent: 'legB', at: [0, 108], pts: KD_SHIN, base: KD.peauD, seed: sd + 3, paint: kidLegPaint(true, true) },
      legF: { parent: 'torso', at: [5, -2], pts: KD_THIGH, base: KD.peau, seed: sd + 4, paint: kidLegPaint(false, false) },
      legF_lo: { parent: 'legF', at: [0, 108], pts: KD_SHIN, base: KD.peau, seed: sd + 5, paint: kidLegPaint(false, true) },
      armB_up: upDef(SK_K, [-8, -124], KD.peauD, sd + 6, (p) => { fillPts(box(-20, -20, 20, 32), p.tenue === 'aujourdhui' ? KD.maillotD : KD.maillotD); if (p.tenue === 'aujourdhui') for (const y of [-6, 12]) fillPts(box(-20, y, 20, y + 6), KD.mar); hatch(null, 0.9, 3.8, 0.28); }, 12, 13),
      armB_lo: foreDef(SK_K, true, null, KD.peauD, sd + 7, -99),
      head: { parent: 'torso', at: [4, -142], pts: KD_HEAD, base: KD.peau, seed: sd + 8, noRivet: true, paint: kidHeadPaint(fille) },
      cheveux: { parent: 'head', at: [0, 0], pts: (p) => (fille ? GIRL_HAIR : p.coiffure === 'moderne' ? BOY_HAIR_MOD : BOY_HAIR), base: hair, seed: sd + 9, noRivet: true, paint: () => {
        for (let k = 0; k < 5; k++) strokePts(qbez([28 - k * 3, -80 + k * 3], [4, -104 + k * 6], [-38 + k * 2, -84 + k * 8], 8), fille ? 'rgba(250,200,140,0.4)' : 'rgba(190,140,90,0.35)', 1.1);
        hatch(null, 0.5, 3.4, 0.18, 1, '70,40,20');
      } },
      armF_up: upDef(SK_K, [-2, -124], KD.peau, sd + 10, (p) => { fillPts(box(-20, -20, 20, 32), KD.maillot); if (p.tenue === 'aujourdhui') for (const y of [-6, 12]) fillPts(box(-20, y, 20, y + 6), KD.mar); strokePts([[-12, 32], [12, 32]], 'rgba(150,140,120,0.6)', 1); hatch([[-16, -20], [-3, -20], [-3, 90], [-16, 90]], 0.9, 3.8, 0.2); }, 12, 13),
      armF_lo: foreDef(SK_K, false, null, KD.peau, sd + 11, -99),
    };
    if (fille) {
      const cp = (back) => () => { for (let k = -1; k <= 1; k++) strokePts([[k * 4, 0], [k * 5, 50]], back ? 'rgba(60,30,10,0.4)' : 'rgba(250,200,140,0.5)', 1); hatch(null, 0.5, 3.2, back ? 0.3 : 0.15, 1, '70,30,10'); };
      const np = () => { dot(0, 0, 3.6, '#5a1a14'); strokePts([[-12, -6], [-4, -1]], 'rgba(255,210,200,0.4)', 1); };
      parts.couetteB = { parent: 'head', at: [-46, -82], rest: 0.8, pts: COUETTE, base: '#a86c3c', seed: sd + 12, noRivet: true, paint: cp(true) };
      parts.noeudB = { parent: 'couetteB', at: [0, -2], pts: NOEUD, base: '#6e1e18', seed: sd + 14, noRivet: true, paint: np };
      parts.couette = { parent: 'head', at: [-40, -62], rest: 0.4, pts: COUETTE, base: KD.girl, seed: sd + 13, noRivet: true, paint: cp(false) };
      parts.noeud = { parent: 'couette', at: [0, -2], pts: NOEUD, base: KD.ruban, seed: sd + 15, noRivet: true, paint: np };
    }
    Object.assign(parts, heldParts(KD.peau, sd + 20, SK_K));
    const heads = fille ? ['cheveux', 'couette', 'noeud'] : ['cheveux'];
    const fond = fille ? ['couetteB', 'noeudB'] : [];
    return { hipY: -214, parts, handLen: 86, handAt: SK_K.HAND, rod: { part: 'torso', at: [-18, 6] }, nom: fille ? 'Fille' : 'Garcon', order: ORDER(fond, heads, [], ['legB', 'legB_lo', 'legF', 'legF_lo']) };
  }
  CH.pbGarcon = mkKid(false);
  CH.pbFille = mkKid(true);
  // gestes : marche, court (+t), gratte, effroi, joie, regardeBas, assis (par terre, genoux levés), tenu:'bateau'
  function kidPose(fille) {
    return function (p) {
      const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, SK = SK_K, H = 214;
      if (!q.tenue) q.tenue = 'calecon';
      if (q.tenue === 'aujourdhui' && fille) q.tenue = 'culotte';
      const gr = kv(q, 'gratte'), ef = kv(q, 'effroi'), jo = kv(q, 'joie'), rb = kv(q, 'regardeBas'), as = kv(q, 'assis');
      const co = q.court ? (q.court === true ? 1 : clamp(q.court)) : 0;
      
      // marche : petits pas, genou arrière un peu plié
      const m = q.marche === true ? 1 : clamp(q.marche || 0);
      if (m > 0) {
        const ph = t * PI * 2.2, s = Math.sin(ph);
        A.legF = (A.legF || 0) - 0.3 * s * m; A.legB = (A.legB || 0) + 0.3 * s * m;
        A.legF_lo = (A.legF_lo || 0) + 0.25 * Math.max(0, -s) * m; A.legB_lo = (A.legB_lo || 0) + 0.25 * Math.max(0, s) * m;
        q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 4 * m;
        if (!has(q.tenu)) A.armF_up = (A.armF_up || 0) + 0.2 * s * m; if (!has(q.tenuB)) A.armB_up = (A.armB_up || 0) - 0.2 * s * m;
      }
      A.armF_lo = (A.armF_lo || 0) - 0.12; A.armB_lo = (A.armB_lo || 0) - 0.12;
      if (co > 0) {
        const ph = t * TAU * 1.7, s = Math.sin(ph);
        const th = -0.62 * s * co, tb = 0.62 * s * co;
        A.legF = (A.legF || 0) + th; A.legB = (A.legB || 0) + tb;
        A.legF_lo = (A.legF_lo || 0) + Math.min(0.55 - 0.3 * th, 0.88 - th) * co; A.legB_lo = (A.legB_lo || 0) + Math.min(0.55 - 0.3 * tb, 0.88 - tb) * co;
        q.dy = (q.dy || 0) - Math.abs(s) * 16 * co;
        plier(q, 0.1 * co, H);
        if (!has(q.tenu)) { A.armF_up = (A.armF_up || 0) + 0.5 * s * co; A.armF_lo = (A.armF_lo || 0) - 1.2 * co; }
        if (!has(q.tenuB)) { A.armB_up = (A.armB_up || 0) - 0.5 * s * co; A.armB_lo = (A.armB_lo || 0) - 1.2 * co; }
        if (!f.mouth) f.mouth = 'smile';
      }
      if (as > 0) {
        q.dy = (q.dy || 0) + (H - 22) * as;
        blend(q, 'legF', -2.3, as); blend(q, 'legF_lo', 1.8, as); blend(q, 'legB', -2.15, as); blend(q, 'legB_lo', 1.72, as);
      }
      if (has(q.tenu) && !gr && !ef && !jo) { armTo(q, SK, 'armF', q.cibleL || (as > 0.5 ? [104, -30] : [104, -40]), 'bas', 1); A.objet = A.objet || 0; }
      if (gr > 0 && !fille) {
        plier(q, 0.62 * gr, H);
        const sc = Math.sin(t * 17) * 7;
        armTo(q, SK, 'armF', [44, 34 + sc], 'bas', gr); if (gr > 0.5) q.handF = 'open';
        A.head = (A.head || 0) + 0.3 * gr; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
      }
      if (gr > 0 && fille) {
        A.legF = (A.legF || 0) - 1.9 * gr; A.legF_lo = (A.legF_lo || 0) + 2.2 * gr;
        plier(q, 0.6 * gr, H);
        q.dy = (q.dy || 0) - Math.abs(Math.sin(t * 8)) * 9 * gr;
        const kn = mp(new DOMMatrix().translate(5, -2).rotate(A.legF * D), [0, 108]), an = mp(new DOMMatrix().translate(5, -2).rotate(A.legF * D).translate(0, 108).rotate(A.legF_lo * D), [6, 70]);
        const sc = Math.sin(t * 17) * 5;
        armTo(q, SK, 'armF', [an[0] + 6, an[1] - 4 + sc], 'bas', gr); if (gr > 0.5) q.handF = 'open';
        A.head = (A.head || 0) + 0.3 * gr; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
        void kn;
      }
      if (ef > 0) {
        armTo(q, SK, 'armF', headPt(q, SK, 46, -18), 'bas', ef); armTo(q, SK, 'armB', headPt(q, SK, 40, -6), 'bas', ef);
        if (ef > 0.5) { q.handF = 'open'; q.handB = 'open'; }
        A.head = (A.head || 0) - 0.08 * ef; q.dx = (q.dx || 0) - 8 * ef;
        if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'up';
      }
      if (jo > 0) {
        blend(q, 'armF_up', -2.55, jo); blend(q, 'armF_lo', -0.25, jo); blend(q, 'armB_up', -3.1, jo); blend(q, 'armB_lo', -0.15, jo);
        if (jo > 0.5) { q.handF = 'open'; q.handB = 'open'; }
        A.head = (A.head || 0) - 0.28 * jo; q.dy = (q.dy || 0) - Math.abs(Math.sin(t * 7)) * 10 * jo;
        if (!f.mouth) f.mouth = 'joie'; if (!f.brow) f.brow = 'up';
      }
      if (rb > 0) { A.head = (A.head || 0) + 0.35 * rb; if (!f.eyes) f.eyes = 'half'; }
      return finish(q, SK);
    };
  }
  PB.garconPose = kidPose(false); PB.fillePose = kidPose(true);
  PB.garcon = (pose, x, y, s, o) => { s = s == null ? 0.58 : s; return run(CH.pbGarcon, avecCible(CH.pbGarcon, PB.garconPose, pose, x, y, s, o), x, y, s, o); };
  PB.fille = (pose, x, y, s, o) => { s = s == null ? 0.52 : s; return run(CH.pbFille, avecCible(CH.pbFille, PB.fillePose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // LE CHAT ROUX — def.libre (animal). Origine = sol sous le corps ; regarde vers +x (dir 1). Tigré roux, queue en point d'interrogation.
  // pose : (debout par défaut) | assis | oreilles 0..1 (assis, pattes avant sur les oreilles, yeux plissés) | dort | queue (balancement avec t) | t
  // =====================================================================
  const CA = { roux: '#B5652E', rouxD: '#8c4a1f', rouxL: '#d48a4c', creme: '#ead2a8', nez: '#c47a72', oeil: '#c9c25a', raie: 'rgba(90,40,12,0.55)' };
  PB.CA = CA;
  function rayures(pts, n, seed, len) { for (let k = 0; k < n; k++) { const a = pts[0][0] + (pts[1][0] - pts[0][0]) * (k + 0.5) / n, y0 = pts[0][1], y1 = pts[1][1]; strokePts([[a + 3, y0], [a - 2 + 3 * hash(seed + k), lerp(y0, y1, len || 0.6)]], CA.raie, 2.2); } }
  function queueLine(base, pts, a) { return pts.map((p) => { const r = rotP([p[0] - base[0], p[1] - base[1]], a); return [base[0] + r[0], base[1] + r[1]]; }); }
  function chatTete(cx, cy, o) {
    const ec = o.oreillesK || 0, yeux = o.dort ? 'dort' : ec > 0.4 ? 'plisse' : 'ouvert';
    pc([[cx - 10, cy - 12], [cx - 6, cy - 30, 1], [cx + 4, cy - 15]], CA.rouxD, () => fillPts([[cx - 7, cy - 14], [cx - 6, cy - 24], [cx, cy - 15]], '#d9a58a'), 9201);
    pc(ell(cx, cy, 20, 16, 18).map((p) => [p[0], p[1]]).concat([]), CA.roux, () => {
      fillPts(ell(cx + 14, cy + 5, 9, 7, 10), CA.creme);
      for (const k of [-1, 0, 1]) strokePts([[cx - 6 + k * 5, cy - 15], [cx - 4 + k * 5, cy - 8]], CA.raie, 1.8);
      strokePts([[cx - 18, cy + 2], [cx - 10, cy + 4]], CA.raie, 1.6);
      if (yeux === 'ouvert') { fillPts([[cx + 6, cy - 4], [cx + 11, cy - 7], [cx + 15, cy - 4], [cx + 11, cy - 1]], CA.oeil, 0, 0); fillPts([[cx + 10.5, cy - 6.5], [cx + 11.8, cy - 6.5], [cx + 11.8, cy - 1.5], [cx + 10.5, cy - 1.5]], '#1a1210', 0, 0); }
      else if (yeux === 'plisse') { strokePts([[cx + 6, cy - 3], [cx + 10, cy - 6], [cx + 15, cy - 3]], '#2a1810', 1.8); strokePts([[cx + 7, cy - 1], [cx + 14, cy - 1]], '#2a1810', 1.2); }
      else strokePts([[cx + 6, cy - 3], [cx + 10, cy - 1], [cx + 15, cy - 3]], '#2a1810', 1.6);
      dot(cx + 19, cy + 1, 2.4, CA.nez);
      strokePts([[cx + 18, cy + 4], [cx + 15, cy + 8], [cx + 11, cy + 7]], 'rgba(60,30,20,0.7)', 1);
      shade(cx, cy - 16, cx, cy + 16, 0.2, [cx - 22, cy - 18, cx + 22, cy + 18]);
    }, 9202);
    pc([[cx + 4, cy - 14], [cx + 12, cy - 32, 1], [cx + 17, cy - 10]], CA.roux, () => fillPts([[cx + 7, cy - 14], [cx + 12, cy - 26], [cx + 14, cy - 12]], '#e0ae96'), 9203);
    if (!SIL() && !o.dort) for (const dy of [3, 7]) strokePts([[cx + 16, cy + dy], [cx + 32, cy + dy - 3 + dy * 0.4]], 'rgba(250,245,235,0.7)', 0.8);
  }
  function patte(x0, y0, x1, y1, w, col, seed) { pc(ribbon([[x0, y0], [lerp(x0, x1, 0.5) + 1, lerp(y0, y1, 0.5)], [x1, y1]], w, w * 0.8), col, () => strokePts([[x0 - 3, lerp(y0, y1, 0.3)], [x0 + 4, lerp(y0, y1, 0.36)]], CA.raie, 1.6), seed); pc(ell(x1 + 3, y1 - 3, 7, 4, 10), col, null, seed + 50); }
  function drawChat(o) {
    const t = o.t || 0, q = o.queue ? (o.queue === true ? 1 : +o.queue) : 0, qa = q * 0.18 * Math.sin(t * 2.4), c = cx_();
    const ore = ease(clamp(o.oreilles || 0));
    if (o.dort) {
      const br = 1 + 0.035 * Math.sin(t * 2.2);
      c.save(); c.scale(1, br);
      pc(ell(-4, -22, 52, 22, 22), CA.roux, () => { for (let k = 0; k < 6; k++) strokePts(qbez([-44 + k * 14, -40], [-40 + k * 14, -26], [-42 + k * 14, -6], 5), CA.raie, 2.4); fillPts(ell(10, -8, 30, 8, 12), CA.creme); shade(0, -44, 0, 0, 0.25, [-60, -50, 60, 0]); }, 9210);
      c.restore();
      pc(ribbon(qbez([-52, -14], [-10, 8], [44, -6], 12), 11, 7), CA.rouxD, () => { for (let k = 0; k < 4; k++) strokePts([[-30 + k * 18, -8], [-28 + k * 18, 2]], CA.raie, 2); }, 9211);
      chatTete(40, -24 * br, { dort: true });
      return { tete: [40, -24], nez: [59, -23] };
    }
    if (o.assis || ore > 0) {
      const qb = [-30, -14], ql = queueLine(qb, [[-30, -14], [-48, -40], [-54, -72], [-46, -94], [-32, -100], [-26, -90]], qa);
      pc(ribbon(ql, 10, 7), CA.roux, () => { for (let k = 1; k < 5; k++) { const p = ql[k]; strokePts([[p[0] - 5, p[1]], [p[0] + 5, p[1] + 2]], CA.raie, 2); } }, 9220);
      patte(4, -50, 8, -2, 11, CA.rouxD, 9221);                                     // patte avant lointaine (posée)
      pc([[-46, -2], [-48, -30], [-36, -60], [-14, -84], [8, -94], [26, -84], [30, -56], [26, -24], [22, -2]], CA.roux, () => {
        fillPts([[12, -86], [26, -84], [30, -56], [24, -40], [14, -56]], CA.creme);
        for (let k = 0; k < 5; k++) strokePts(qbez([-40 + k * 9, -50 + k * 6], [-30 + k * 9, -36 + k * 6], [-34 + k * 9, -20 + k * 5], 5), CA.raie, 2.2);
        shade(-40, -40, 20, -40, 0.22, [-50, -100, 40, 0]);
      }, 9222);
      pc(ell(-16, -26, 30, 26, 18), CA.roux, () => { strokePts(qbez([-36, -38], [-20, -50], [-4, -40], 6), CA.raie, 2.2); strokePts(qbez([-40, -24], [-22, -34], [-6, -26], 6), CA.raie, 2.2); }, 9223);
      if (ore > 0) {                                                                 // pattes avant sur les oreilles
        const hy = -104, P1 = [lerp(18, 10, ore), lerp(-2, hy - 20, ore)], P2 = [lerp(26, 30, ore), lerp(-2, hy - 18, ore)];
        patte(8, -70, P1[0], P1[1], 11, CA.rouxD, 9224);
        chatTete(18, hy, { oreillesK: ore });
        patte(20, -64, P2[0], P2[1], 12, CA.roux, 9225);
      } else {
        patte(20, -52, 24, -2, 12, CA.roux, 9226);
        chatTete(18, -104, {});
      }
      return { tete: [18, -104], nez: [37, -103] };
    }
    // debout
    const qb = [-46, -58], ql = queueLine(qb, [[-46, -58], [-62, -74], [-70, -100], [-64, -122], [-50, -126], [-46, -114]], qa);
    pc(ribbon(ql, 10, 7), CA.roux, () => { for (let k = 1; k < 5; k++) { const p = ql[k]; strokePts([[p[0] - 5, p[1]], [p[0] + 5, p[1] + 2]], CA.raie, 2); } }, 9230);
    patte(-26, -44, -24, -2, 11, CA.rouxD, 9231); patte(30, -44, 34, -2, 10, CA.rouxD, 9232);
    pc([[-52, -60], [-38, -72], [0, -74], [32, -70], [48, -64], [50, -44], [34, -32], [0, -30], [-36, -32], [-54, -44]], CA.roux, () => {
      fillPts([[0, -32], [34, -32], [44, -44], [20, -40]], CA.creme);
      for (let k = 0; k < 7; k++) strokePts(qbez([-40 + k * 12, -72], [-36 + k * 12, -56], [-40 + k * 12, -38], 5), CA.raie, 2.2);
      shade(0, -74, 0, -30, 0.25, [-60, -80, 60, -28]);
    }, 9233);
    patte(-38, -46, -36, -2, 13, CA.roux, 9234); patte(40, -46, 44, -2, 12, CA.roux, 9235);
    chatTete(56, -76, {});
    return { tete: [56, -76], nez: [75, -75] };
  }
  const CHAT_DEF = { hipY: 0, handLen: 10, rod: { part: 'o', at: [-6, -36] }, nom: 'chat', libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
    parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => { p._pts = drawChat(p.o); } } }, order: ['o'] };
  CH.pbChat = CHAT_DEF;
  PB.chat = (pose, x, y, s, o) => {
    pose = pose || {}; o = Object.assign({ slot: M.ST.slotF }, o); s = s == null ? 1 : s;
    const q = { o: Object.assign({ t: pose.t || 0 }, pose), tilt: pose.tilt || 0, dx: pose.dx || 0, dy: pose.dy || 0 };
    const r = M.puppet(CHAT_DEF, q, x, y, s, o);
    r.pts = q._pts || {}; return r;
  };
  PB.chatPt = (r, nom) => { const q = r.pts && r.pts[nom]; return q ? r.w('o', q[0], q[1]) : null; };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
    const r = M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.o = o; r.name = name; return r;
  }
  PB.bateau = (x, y, s, o) => acc('bateau', x, y, s, o, 1);
  PB.culotte = (x, y, s, o) => acc('culotte', x, y, s, o, 1);
  PB.etiquette = (x, y, s, o) => acc('etiquette', x, y, s, o, 1);
  PB.tasEtiquettes = (x, y, s, o) => acc('tas', x, y, s, o, 1);
  PB.ciseaux = (x, y, s, o) => acc('ciseaux', x, y, s, o, 1);
  PB.tampon = (x, y, s, o) => acc('tampon', x, y, s, o, 1);
  // point nommé d'un accessoire seul : PB.accPt(r, 'mat') (r = valeur renvoyée par PB.bateau, PB.culotte…)
  PB.accPt = (r, nom) => { const ob = OBJ[r.name]; if (!ob || !ob.pts[nom]) return null; const q = ptOf(ob, nom, r.o); return r.w('o', q[0] - ob.base[0], q[1] - ob.base[1]); };

  // =====================================================================
  // ÉTENDOIR — fil à linge tendu entre deux poulies pendues aux cintres ; 3 culottes blanches à pinces de bois (ou 5 `modernes` en couleurs)
  // PB.etendoir(t, { descente 0..1 (défaut 1 : en place ; 0 = dans les cintres, hors champ), y (fil, défaut 700), x0 260, x1 820, modernes, s (culottes, 0,62) })
  // =====================================================================
  const MODERNES = [{ couleur: '#f3efe6' }, { couleur: '#a9c4d8' }, { couleur: '#e2b4b4' }, { couleur: '#b4d4c4' }, { couleur: '#f3efe6', rayures: '#23324F' }];
  PB.etendoir = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), x0 = o.x0 == null ? 260 : o.x0, x1 = o.x1 == null ? 820 : o.x1, Y = o.y == null ? 700 : o.y, s = o.s || 0.62;
    const d = clamp(o.descente == null ? 1 : o.descente), u = clamp(d / 0.75);
    let yy = lerp(-320, Y, 1 - (1 - u) * (1 - u));
    if (d > 0.75) { const v = (d - 0.75) / 0.25; yy += -20 * Math.sin(v * PI * 2) * (1 - v); }
    if (yy < -200) return { y: yy };
    const sag = 16, mid = (x) => { const k = (x - x0) / (x1 - x0); return yy + sag * 4 * k * (1 - k); };
    if (!SIL()) {
      c.save(); c.strokeStyle = 'rgba(40,30,20,0.85)'; c.lineWidth = 1.6;
      for (const x of [x0, x1]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, yy - 14); c.stroke(); }
      c.beginPath(); c.moveTo(x0, yy); for (let x = x0; x <= x1; x += 10) c.lineTo(x, mid(x)); c.strokeStyle = '#e6dcc4'; c.lineWidth = 2.4; c.stroke();
      c.strokeStyle = 'rgba(60,45,30,0.6)'; c.lineWidth = 0.8; c.stroke();
      c.restore();
      for (const x of [x0, x1]) { pc(ell(x, yy - 8, 12, 12, 14), '#8a5e36', () => { strokePts(ep(x, yy - 8, 7, 7, 10, 0, TAU), 'rgba(40,24,12,0.7)', 1.2); }, 9300 + x); M.rivet(x, yy - 8, 3); }
    }
    const L = o.modernes ? MODERNES : [{}, {}, {}], n = L.length, out = [];
    for (let i = 0; i < n; i++) {
      const px = lerp(x0 + 90, x1 - 90, n === 1 ? 0.5 : i / (n - 1)), py = mid(px) + 2, rt = 0.05 * Math.sin(g * 1.3 + i * 1.7) + 0.03 * Math.sin(g * 2.9 + i);
      const k = s * (o.modernes ? 0.92 : 1), v = rotP([0, 118 * k], rt);
      acc('culotte', px + v[0], py + v[1], k, Object.assign({ rot: rt }, L[i]));
      for (const sx of [-1, 1]) {
        const pp = rotP([sx * 58 * k, 0], rt), qx = px + pp[0], qy = py + pp[1];
        pc(box(qx - 3.5, qy - 12, qx + 3.5, qy + 10), '#b08a58', () => strokePts([[qx, qy - 10], [qx, qy + 8]], 'rgba(60,40,20,0.6)', 0.8), 9310 + i * 2 + sx, { drop: false });
      }
      out.push([px, py]);
    }
    return { y: yy, culottes: out };
  };

  // =====================================================================
  // DÉCOR — la maison-atelier Valton, Troyes, vers 1913 (plans 1 à 6, première moitié du 6)
  // PB.maison(t, o) (toile de fond + plan intermédiaire, AVANT M.drawFloor) ; PB.maisonSol(t, o) (premier plan, APRÈS M.drawFloor, avant les marionnettes)
  // =====================================================================
  const W = M.W, BACK = M.ST.back;
  const MA = { fen: { x0: 440, y0: 330, x1: 640, y1: 640 }, lampe: { x: 330, y: 398 }, pendule: { x: 690, y: 296, s: 0.72 }, bassine: { x: 324, y: 1256 },
    marmite: { x: 190, y: 1110 }, cuisiniere: { x0: 124, x1: 252, y: 1172 }, etabli: { x0: 722, x1: 934, y: 1180 }, metier: { x: 886, y: 1090 }, manivelle: { x: 856, y: 1106 },
    appui: { x: 560, y: 642 }, ciseaux: { x: 700, y: 496 }, calendrier: { x: 792, y: 470 }, volets: { x: 594, y: 556 }, cartons: { x0: 430, x1: 650, y: 1395 } };
  PB.MAISON = MA;
  const KM = {};
  PB.K = KM;
  const bar = (a, b, w) => ribbon([a, b], w, w);
  function glow(x, y, r, col, a) { if (a <= 0 || SIL()) return; const c = cx_(), gr = c.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
  function teinte(cv, col) { return M.pre(cv.width, cv.height, (x) => { x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, cv.width, cv.height); }); }
  function poutre(a, b, w, seed) {
    const pts = bar(a, b, w).map((q) => [q[0], q[1], 1]), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
    pc(pts, '#4a3020', () => {
      for (let k = -2; k <= 2; k++) { const o = k * w * 0.18; strokePts([[a[0] + nx * o, a[1] + ny * o], [lerp(a[0], b[0], 0.5) + nx * (o + 1.5), lerp(a[1], b[1], 0.5) + ny * (o + 1.5)], [b[0] + nx * o, b[1] + ny * o]], 'rgba(20,10,4,0.35)', 0.8); }
      strokePts([[a[0] - nx * w * 0.38, a[1] - ny * w * 0.38], [b[0] - nx * w * 0.38, b[1] - ny * w * 0.38]], 'rgba(255,220,170,0.18)', 1.4);
      hatch(null, 0.9, 4.5, 0.18, 1, M.P.encre, M.bbox(pts));
    }, seed);
  }
  // --- vue de la rue (une toile par ciel) : façades à colombages en encorbellement, tour unique de la cathédrale
  const CIELS = {
    apresmidi: { h: '#9fb6c6', b: '#efd7a2', fac: 0, lum: 0.9, tint: [255, 226, 180, 0.12] },
    soir: { h: '#4c4c78', m: '#c77a6c', b: '#f2b26e', fac: 0.35, lum: 0.6, tint: [205, 140, 120, 0.34] },
    nuit: { h: '#121830', b: '#2e3660', fac: 0.75, lum: 0.2, tint: [70, 80, 130, 0.55] },
    hiver: { h: '#9ea3a8', b: '#d2d4d2', fac: 0.2, lum: 0.6, tint: [170, 176, 186, 0.3] },
    printemps: { h: '#7aaed6', b: '#d2e6ef', fac: 0, lum: 1, tint: [240, 246, 228, 0.05] },
    jour1920: { h: '#8ab6d8', b: '#e6eff2', fac: 0, lum: 1, tint: [255, 255, 255, 0] },
  };
  PB.CIELS = Object.keys(CIELS);
  function makeCiel(kind) {
    const C = CIELS[kind], F = MA.fen, ox = F.x0 - 20, oy = F.y0 - 20;
    const cv = M.pre(F.x1 - F.x0 + 40, F.y1 - F.y0 + 40, (c) => {
      c.translate(-ox, -oy);
      const g = c.createLinearGradient(0, F.y0, 0, F.y1); g.addColorStop(0, C.h); if (C.m) g.addColorStop(0.5, C.m); g.addColorStop(1, C.b);
      c.fillStyle = g; c.fillRect(ox, oy, F.x1 - F.x0 + 40, F.y1 - F.y0 + 40);
      if (kind === 'nuit') { const R = M.rng(9420); for (let i = 0; i < 30; i++) dot(F.x0 + R() * 200, F.y0 + R() * 140, 0.8 + R(), 'rgba(250,245,220,0.8)'); pc(ell(F.x0 + 150, F.y0 + 50, 16, 16, 16), '#efe8c8', () => dot(F.x0 + 144, F.y0 + 46, 4, 'rgba(180,170,140,0.5)'), 9421, { drop: false }); }
      if (kind === 'soir') { const sg = c.createRadialGradient(F.x0 + 60, F.y0 + 190, 4, F.x0 + 60, F.y0 + 190, 90); sg.addColorStop(0, 'rgba(255,220,150,0.8)'); sg.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = sg; c.fillRect(F.x0 - 40, F.y0 + 90, 200, 200); }
      if (kind === 'apresmidi' || kind === 'printemps' || kind === 'jour1920') for (const [x, y, s] of [[F.x0 + 40, F.y0 + 40, 1], [F.x0 + 150, F.y0 + 70, 0.7]]) pc([[x - 30 * s, y + 6], [x - 16 * s, y - 8], [x, y - 12 * s], [x + 18 * s, y - 6], [x + 32 * s, y + 6]], 'rgba(250,248,240,0.85)', null, 9422 + x, { drop: false });
      // tour de la cathédrale (unique), au loin
      const tc = mixH('#8e9ab0', C.h, 0.35 + 0.4 * C.fac), tx = F.x0 + 44;
      pc([[tx - 22, F.y0 + 230, 1], [tx - 22, F.y0 + 92], [tx - 26, F.y0 + 86], [tx - 20, F.y0 + 70, 1], [tx - 14, F.y0 + 84], [tx - 6, F.y0 + 58, 1], [tx + 2, F.y0 + 84], [tx + 8, F.y0 + 66, 1], [tx + 14, F.y0 + 84], [tx + 20, F.y0 + 70, 1], [tx + 26, F.y0 + 86], [tx + 22, F.y0 + 92], [tx + 22, F.y0 + 230, 1]], tc, () => {
        for (const y of [110, 150, 190]) { fillPts(box(tx - 12, F.y0 + y, tx - 4, F.y0 + y + 24), 'rgba(40,40,60,0.35)'); fillPts(box(tx + 4, F.y0 + y, tx + 12, F.y0 + y + 24), 'rgba(40,40,60,0.35)'); }
      }, 9430, { drop: false });
      pc([[F.x0 - 20, F.y0 + 240], [F.x0 + 20, F.y0 + 196], [F.x0 + 70, F.y0 + 210], [F.x0 + 110, F.y0 + 186], [F.x0 + 170, F.y0 + 204], [F.x0 + 230, F.y0 + 190], [F.x0 + 230, F.y0 + 260], [F.x0 - 20, F.y0 + 260]], mixH('#7c7a84', C.h, 0.3 + 0.3 * C.fac), null, 9431, { drop: false });
      // façades d'en face : rez-de-chaussée + étage en encorbellement + pignon
      const maisons = [[F.x0 - 30, 96, '#d9c7a4', 0], [F.x0 + 66, 84, '#c9a98e', 1], [F.x0 + 150, 96, '#d3c39a', 2]];
      for (const [x, w, col, i] of maisons) {
        const base = F.y1 + 10, y1 = F.y1 - 64, y2 = F.y1 - 150, top = F.y0 + 120 - i * 14;
        const cc = mixH(col, '#2a2a40', C.fac * 0.8);
        pc([[x + 4, base, 1], [x + 4, y1, 1], [x - 4, y1, 1], [x - 4, y2, 1], [x + w / 2, top, 1], [x + w + 4, y2, 1], [x + w + 4, y1, 1], [x + w - 4, y1, 1], [x + w - 4, base, 1]], cc, () => {
          const pb = mixH('#5a3a24', '#1a1420', C.fac * 0.7);
          for (const yy of [y1, y2, base - 6]) fillPts(box(x - 6, yy - 3, x + w + 6, yy + 3), pb);
          for (let k = 0; k <= 4; k++) fillPts(box(x - 4 + k * w / 4 - 2, y2, x - 4 + k * w / 4 + 2, y1), pb);
          strokePts([[x - 2, y1 - 4], [x + w / 4, y2 + 4]], pb, 2); strokePts([[x + w + 2, y1 - 4], [x + w * 0.75, y2 + 4]], pb, 2);
          strokePts([[x + w / 2, top + 6], [x + w / 2, y2]], pb, 2);
          const lit = C.lum < 0.7, wc = lit ? 'rgba(255,200,110,0.95)' : mixH('#3a4a5a', C.h, 0.3);
          for (const wx of [x + w * 0.2, x + w * 0.62]) { fillPts(box(wx, y2 + 22, wx + 16, y2 + 50), (i + wx) % 3 < 1.5 || !lit ? wc : 'rgba(40,40,60,0.9)'); }
          fillPts(box(x + w * 0.35, y1 + 20, x + w * 0.62, base), mixH('#3a2a20', '#101018', C.fac));
          fillPts([[x + w / 2 - 10, top + 40], [x + w / 2 + 10, top + 40], [x + w / 2 + 10, top + 58], [x + w / 2 - 10, top + 58]], wc);
        }, 9440 + i, { drop: false });
        pc([[x - 10, y2 + 2], [x + w / 2, top - 8], [x + w + 10, y2 + 2], [x + w + 4, y2 + 8], [x + w / 2, top + 2], [x - 4, y2 + 8]], mixH('#7a3e2a', '#1c1420', C.fac * 0.8), null, 9450 + i, { drop: false });
        if (kind === 'hiver') { fillPts([[x - 10, y2 + 1], [x + w / 2, top - 9], [x + w + 10, y2 + 1], [x + w + 6, y2 - 2], [x + w / 2, top - 13], [x - 6, y2 - 2]], '#f4f4f2'); fillPts(box(x - 6, y1 - 6, x + w + 6, y1 - 2), '#f4f4f2'); }
      }
      if (kind === 'printemps') {                       // branche de lilas fleurie devant la vitre
        const br = qbez([F.x0 - 10, F.y1 - 40], [F.x0 + 60, F.y1 - 110], [F.x0 + 120, F.y1 - 170], 10);
        strokePts(br, '#4a3a2a', 5); strokePts(qbez([F.x0 + 40, F.y1 - 86], [F.x0 + 70, F.y1 - 70], [F.x0 + 96, F.y1 - 74], 6), '#4a3a2a', 3);
        const R = M.rng(9460);
        for (const [cxx, cyy] of [[F.x0 + 120, F.y1 - 168], [F.x0 + 96, F.y1 - 74], [F.x0 + 54, F.y1 - 100]]) {
          for (let k = 0; k < 4; k++) pc(ell(cxx + (R() - 0.5) * 24, cyy + (R() - 0.5) * 16, 14, 9, 10).map((p) => [p[0], p[1]]), '#4f7a3e', null, 9461 + k, { drop: false });
          for (let k = 0; k < 26; k++) dot(cxx + (R() - 0.5) * 26, cyy - 14 + R() * 30, 3 + R() * 2, R() < 0.5 ? '#9a7ab8' : '#b89ad0');
        }
      }
    });
    cv.ox = ox; cv.oy = oy; return cv;
  }
  function mixH(a, b, k) { const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((x, i) => Math.round(lerp(x, B[i], clamp(k))).toString(16).padStart(2, '0')).join(''); }
  // --- mur : plâtre ocre pâle et colombages, fenêtre à petits carreaux, appui et géranium, calendrier sans chiffre
  function makeMur() {
    const F = MA.fen;
    return M.pre(W, BACK + 40, (c) => {
      c.fillStyle = '#d8c398'; c.fillRect(0, 130, W, BACK - 90);
      const R = M.rng(9401);
      for (let i = 0; i < 300; i++) { const x = R() * W, y = 150 + R() * (BACK - 150), r = 8 + R() * 30; c.fillStyle = `rgba(${R() < 0.5 ? '255,246,222' : '150,118,78'},${0.05 + R() * 0.07})`; c.beginPath(); c.ellipse(x, y, r * 1.6, r, R(), 0, TAU); c.fill(); }
      for (let i = 0; i < 7; i++) { let x = 60 + R() * (W - 120), y = 260 + R() * 900; const pts = [[x, y]]; for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 22; y += 8 + R() * 14; pts.push([x, y]); } strokePts(pts, 'rgba(110,80,50,0.35)', 0.9); }
      const sh = c.createLinearGradient(0, 150, 0, BACK); sh.addColorStop(0, 'rgba(40,24,10,0.38)'); sh.addColorStop(0.25, 'rgba(40,24,10,0.02)'); sh.addColorStop(1, 'rgba(40,24,10,0.28)'); c.fillStyle = sh; c.fillRect(0, 130, W, BACK - 90);
      // colombages (pans de bois troyens)
      for (let x = 30; x < W; x += 96) pc(box(x, 134, x + 34, 176), '#3a2416', null, 9402 + x, { drop: false });          // bouts de solives
      poutre([0, 192], [W, 192], 34, 9403);
      for (const x of [150, 960]) poutre([x, 200], [x, BACK + 10], 30, 9404 + x);
      for (const x of [420, 660]) poutre([x, 200], [x, BACK + 10], 26, 9405 + x);
      poutre([150, 770], [420, 770], 22, 9406); poutre([660, 770], [960, 770], 22, 9407); poutre([420, 706], [660, 706], 20, 9408);
      poutre([166, 520], [262, 206], 18, 9409); poutre([944, 520], [848, 206], 18, 9410);
      poutre([166, 1385], [404, 784], 18, 9411); poutre([404, 1385], [166, 784], 18, 9412);
      poutre([676, 1385], [944, 784], 18, 9413); poutre([944, 1385], [676, 784], 18, 9414);
      for (const x of [500, 580]) poutre([x, 716], [x, BACK + 10], 16, 9415 + x);
      // trou de la fenêtre
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.restore();
      // reflets de la vitre, croisillons, dormant
      for (let k = 0; k < 5; k++) { const y = lerp(F.y0, F.y1, k / 5); fillPts([[F.x0 + 8, y + 50], [F.x0 + 40, y + 6], [F.x0 + 50, y + 6], [F.x0 + 18, y + 50]], 'rgba(255,255,255,0.08)'); fillPts([[F.x0 + 140, y + 56], [F.x0 + 176, y + 10], [F.x0 + 182, y + 10], [F.x0 + 146, y + 56]], 'rgba(255,255,255,0.06)'); }
      const vb = '#5c4430';
      for (let k = 1; k < 3; k++) { const x = lerp(F.x0, F.x1, k / 3); pc(box(x - 3, F.y0, x + 3, F.y1), vb, null, 9420 + k, { drop: false }); }
      for (let k = 1; k < 5; k++) { const y = lerp(F.y0, F.y1, k / 5); pc(box(F.x0, y - 3, F.x1, y + 3), vb, null, 9425 + k, { drop: false }); }
      pc(box(F.x0 - 16, F.y0 - 16, F.x1 + 16, F.y0), vb, () => strokePts([[F.x0 - 14, F.y0 - 13], [F.x1 + 14, F.y0 - 13]], 'rgba(255,230,190,0.3)', 1.2), 9430);
      pc(box(F.x0 - 16, F.y0, F.x0, F.y1), vb, null, 9431); pc(box(F.x1, F.y0, F.x1 + 16, F.y1), vb, null, 9432);
      pc(box(F.x0 + 96, F.y0, F.x0 + 104, F.y1), vb, null, 9433);
      pc(box(F.x0 - 26, F.y1, F.x1 + 26, F.y1 + 16), '#6a4a30', () => strokePts([[F.x0 - 24, F.y1 + 3], [F.x1 + 24, F.y1 + 3]], 'rgba(255,230,190,0.4)', 1.4), 9434);
      pc(box(F.x0 - 30, F.y0 - 34, F.x1 + 30, F.y0 - 26), '#7a6040', null, 9435);                                       // tringle
      for (const x of [F.x0 - 30, F.x1 + 30]) dot(x, F.y0 - 30, 6, '#b08d45');
      // pot de géranium sur l'appui
      const gx = F.x1 - 34, gy = F.y1;
      pc([[gx - 13, gy - 26], [gx + 13, gy - 26], [gx + 10, gy, 1], [gx - 10, gy, 1]], '#a85a3a', () => strokePts([[gx - 13, gy - 22], [gx + 13, gy - 22]], 'rgba(60,20,10,0.5)', 1.4), 9436);
      for (const [dx, dy, r] of [[-12, -36, 10], [8, -40, 11], [-2, -50, 10], [14, -54, 8], [-16, -54, 8]]) pc(ell(gx + dx, gy + dy, r, r * 0.8, 10), '#4e6e3a', () => strokePts([[gx + dx - r * 0.6, gy + dy], [gx + dx + r * 0.6, gy + dy]], 'rgba(30,50,20,0.5)', 1), 9437 + dx);
      for (const [dx, dy] of [[-4, -64], [12, -66], [-14, -62]]) for (let k = 0; k < 7; k++) dot(gx + dx + Math.cos(k) * 5, gy + dy + Math.sin(k * 1.7) * 4, 3.2, k % 2 ? '#b8322a' : '#d0473a');
      // calendrier à feuillets (petite image sans lettre + bloc de feuillets unis)
      const ka = MA.calendrier;
      strokePts([[ka.x, ka.y - 40], [ka.x - 14, ka.y - 24], [ka.x + 14, ka.y - 24], [ka.x, ka.y - 40]], 'rgba(40,30,20,0.7)', 1); dot(ka.x, ka.y - 40, 2.4, '#3a2a1a');
      pc(box(ka.x - 26, ka.y - 24, ka.x + 26, ka.y + 50), '#b8894a', () => {
        fillPts(box(ka.x - 20, ka.y - 18, ka.x + 20, ka.y + 8), '#8fb0c0'); fillPts([[ka.x - 20, ka.y + 8], [ka.x - 6, ka.y - 6], [ka.x + 6, ka.y + 2], [ka.x + 20, ka.y - 8], [ka.x + 20, ka.y + 8]], '#6a8a50');
        fillPts(box(ka.x - 20, ka.y + 14, ka.x + 20, ka.y + 44), '#f2ecdc'); for (const y of [ka.y + 42, ka.y + 44]) strokePts([[ka.x - 20, y], [ka.x + 20, y]], 'rgba(120,100,70,0.6)', 0.8);
      }, 9440);
      // étagère de gauche (pots, cruches) et de droite (bobines, pelotes) : planches et consoles
      for (const [x0, x1, y] of [[120, 356, 600], [736, 946, 600]]) {
        pc(box(x0, y, x1, y + 12), '#6a4a2e', () => strokePts([[x0 + 2, y + 3], [x1 - 2, y + 3]], 'rgba(255,230,190,0.35)', 1.2), 9450 + x0);
        for (const x of [x0 + 24, x1 - 24]) pc([[x - 4, y + 12], [x + 4, y + 12], [x + 4, y + 50], [x - 22, y + 14]].map((p) => [p[0], p[1]]), '#5a3e26', null, 9452 + x);
      }
    });
  }

  // --- plan intermédiaire gauche : poêle-cuisinière en fonte, marmite, torchons, pots et cruches, casseroles de cuivre, tabouret et bassine de zinc
  function makeGauche() {
    return M.pre(W, BACK + 40, (c) => {
      const C = MA.cuisiniere, fo = '#2a2826', foL = '#45423e';
      c.save(); c.translate(28, 0);
      pc(ribbon([[118, C.y - 8], [118, 640], [126, 560], [150, 540]], 20), fo, () => { for (const y of [700, 860, 1020]) strokePts([[106, y], [130, y]], 'rgba(150,150,150,0.4)', 2); }, 9501);
      // pots et cruches sur l'étagère de gauche (y 600)
      const sx = (x, w, h, col, seed, fn) => pc([[x - w / 2, 600, 1], [x - w / 2 + 3, 600 - h * 0.7], [x - w * 0.3, 600 - h], [x + w * 0.3, 600 - h], [x + w / 2 - 3, 600 - h * 0.7], [x + w / 2, 600, 1]], col, fn, seed);
      sx(130, 30, 52, '#d9cdb0', 9502, () => { fillPts(box(110, 560, 150, 572), '#3a5a7a'); strokePts([[118, 552], [142, 552]], 'rgba(60,40,20,0.4)', 1); });
      pc(ribbon(qbez([146, 560], [160, 566], [150, 584], 6), 5), '#d9cdb0', null, 9503);
      sx(178, 40, 40, '#a8603a', 9504, () => { fillPts(box(156, 572, 200, 578), 'rgba(255,220,180,0.3)'); });
      sx(222, 24, 60, '#7a6a52', 9505, () => strokePts([[214, 548], [216, 594]], 'rgba(255,240,220,0.3)', 1.6));
      sx(260, 36, 34, '#e9e0c8', 9506, () => { for (let x = 246; x < 276; x += 8) dot(x, 584, 2.4, '#3a5a8a'); });
      sx(300, 26, 46, '#b07a3a', 9507, null);
      for (const [x, r] of [[180, 26], [250, 22]]) { pc(ell(x, 640 + r, r, r, 16), '#b0683a', () => { strokePts(ep(x, 640 + r, r - 6, r - 6, 10, PI * 1.1, PI * 1.6), 'rgba(255,220,170,0.5)', 2); }, 9508 + x); pc(box(x - 3, 612, x + 3, 640), '#6a3a1e', null, 9509 + x); dot(x, 610, 3, '#3a2a1a'); }
      c.restore();
      // cuisinière
      pc([[C.x0, C.y + 12, 1], [C.x1, C.y + 12, 1], [C.x1 - 4, BACK - 20, 1], [C.x0 + 4, BACK - 20, 1]], fo, () => {
        fillPts(box(C.x0 + 12, C.y + 40, C.x0 + 70, C.y + 120), foL); strokePts(box(C.x0 + 12, C.y + 40, C.x0 + 70, C.y + 120).concat([[C.x0 + 12, C.y + 40]]), 'rgba(200,170,110,0.6)', 1.4);
        fillPts(box(C.x0 + 84, C.y + 40, C.x1 - 12, C.y + 84), foL); fillPts(box(C.x0 + 92, C.y + 62, C.x1 - 20, C.y + 70), '#e07a2a');
        fillPts(box(C.x0 + 30, C.y + 76, C.x0 + 52, C.y + 82), '#c09a48'); dot(C.x1 - 24, C.y + 52, 3, '#c09a48');
        fillPts(box(C.x0 + 84, C.y + 100, C.x1 - 12, C.y + 150), foL);
        hatch(null, 0.8, 3.6, 0.3, 1, '200,200,200'); shade(C.x0, 0, C.x1, 0, 0.3, [C.x0 - 4, C.y, C.x1 + 4, BACK]);
      }, 9510);
      pc(box(C.x0 - 8, C.y, C.x1 + 8, C.y + 14), foL, () => strokePts([[C.x0 - 6, C.y + 3], [C.x1 + 6, C.y + 3]], 'rgba(220,220,220,0.35)', 1.4), 9511);
      for (const x of [C.x0 + 6, C.x1 - 10]) pc(box(x, BACK - 22, x + 8, BACK + 6), fo, null, 9512 + x);
      pc(box(C.x0 - 4, C.y + 26, C.x1 + 4, C.y + 31), '#c09a48', null, 9514, { drop: false });                       // barre à torchons
      const torchon = (x, w, h, col, raie, seed) => pc([[x, C.y + 26], [x + w, C.y + 26], [x + w + 3, C.y + 26 + h, 1], [x - 2, C.y + 26 + h, 1]], col, () => { for (const y of [C.y + 26 + h - 18, C.y + 26 + h - 10]) fillPts(box(x - 4, y, x + w + 4, y + 3), raie); hatch(null, 0.8, 4, 0.15); }, seed);
      torchon(C.x0 + 14, 40, 70, '#ece4d0', '#8E2A22', 9515); torchon(C.x0 + 62, 34, 58, '#c8d0d4', '#3a5a7a', 9516);
      // marmite
      const Mx = MA.marmite.x, My = MA.marmite.y;
      pc([[Mx - 36, My + 6], [Mx + 36, My + 6], [Mx + 34, My + 50, 1], [Mx - 34, My + 50, 1]], '#3a3632', () => { strokePts([[Mx - 30, My + 14], [Mx - 30, My + 44]], 'rgba(220,220,220,0.3)', 2); hatch(null, 0.8, 3.4, 0.25, 1, '220,220,220'); }, 9517);
      pc(ep(Mx, My + 6, 38, 12, 12, PI, TAU), '#4a4540', () => {}, 9518); pc(ell(Mx, My - 8, 6, 5, 8), '#4a4540', null, 9519);
      for (const s of [-1, 1]) pc(ringPts(Mx + s * 40, My + 18, 6, 6, 3, 10), '#4a4540', null, 9520 + s);
      // tabouret et bassine (arrière : paroi du fond + eau)
      const B = MA.bassine;
      pc(box(B.x - 62, B.y + 40, B.x + 62, B.y + 52), '#8a5e36', () => strokePts([[B.x - 60, B.y + 43], [B.x + 60, B.y + 43]], 'rgba(255,230,190,0.35)', 1.2), 9530);
      for (const [x, a] of [[B.x - 50, -0.08], [B.x + 50, 0.08], [B.x - 18, -0.02]]) pc(rot(box(x - 5, B.y + 50, x + 5, BACK + 4), a, x, B.y + 50), '#7a5030', null, 9531 + x);
      pc(ep(B.x, B.y, 72, 16, 16, PI, TAU).concat([[B.x + 72, B.y + 2]]), '#8f969a', () => fillPts(ell(B.x, B.y + 3, 64, 11, 18), '#5f7c8c'), 9533, { drop: false });
    });
  }
  function makeBassineAv() {
    return M.pre(W, BACK + 40, (c) => {
      const B = MA.bassine;
      pc(ep(B.x, B.y, 72, 16, 12, PI, 0).concat(ep(B.x, B.y + 40, 66, 10, 10, 0, PI)), '#a2a9ad', () => {
        for (let x = B.x - 60; x < B.x + 60; x += 14) strokePts([[x, B.y + 12], [x + 1, B.y + 46]], 'rgba(60,70,80,0.25)', 1);
        strokePts(ep(B.x, B.y, 70, 15, 12, PI * 0.05, PI * 0.95), 'rgba(255,255,255,0.5)', 1.6);
        shade(B.x - 70, 0, B.x + 70, 0, 0.3, [B.x - 80, B.y - 20, B.x + 80, B.y + 60]);
      }, 9540);
      for (const s of [-1, 1]) pc(ringPts(B.x + s * 76, B.y + 10, 7, 5, 3, 10), '#7f868a', null, 9541 + s);
    });
  }
  // --- plan intermédiaire droit : bobines et pelotes sur l'étagère, mannequin de couturière, établi de coupe + rouleau, métier circulaire (sans manivelle)
  const BOB = ['#efe6cf', '#8E2A22', '#C9A23A', '#3a5a7a', '#5f7350', '#b8892f', '#e2d6bc', '#6a3a4a'];
  function bobine(x, y, col, seed, h) { h = h || 26; pc(box(x - 9, y - h, x + 9, y), col, () => { for (let yy = y - h + 4; yy < y - 2; yy += 3) strokePts([[x - 9, yy], [x + 9, yy + 1]], 'rgba(0,0,0,0.15)', 0.7); }, seed); pc(box(x - 12, y - h - 4, x + 12, y - h), '#b08a58', null, seed + 1, { drop: false }); pc(box(x - 12, y - 4, x + 12, y), '#b08a58', null, seed + 2, { drop: false }); }
  function pelote(x, y, r, col, seed) { pc(ell(x, y - r, r, r, 16), col, () => { for (let k = -2; k <= 2; k++) strokePts(ep(x + k * r * 0.25, y - r, r * 0.9, r * 0.5, 8, -PI * 0.6, PI * 0.6), 'rgba(0,0,0,0.2)', 1); shade(x - r, y - 2 * r, x + r, y, 0.25, [x - r - 2, y - 2 * r - 2, x + r + 2, y + 2]); }, seed); }
  function etagereBobines(y, seed) {
    let i = 0; for (let x = 756; x < 940; x += 26) { if (i % 3 === 2) pelote(x, y, 13, BOB[(i * 3 + seed) % BOB.length], seed + i * 3); else bobine(x, y, BOB[(i + seed) % BOB.length], seed + i * 3); i++; }
  }
  function metierStatique(cx, cy, seed) {
    pc(box(cx - 30, cy + 70, cx + 30, cy + 98), '#3a3634', null, seed);                                                // étau sous le bord
    pc([[cx - 26, cy - 10], [cx + 26, cy - 10], [cx + 24, cy + 74, 1], [cx - 24, cy + 74, 1]], '#4a4a4e', () => {
      for (let x = cx - 22; x < cx + 24; x += 4) strokePts([[x, cy - 6], [x, cy + 70]], 'rgba(220,220,230,0.35)', 0.8);
      fillPts(box(cx - 26, cy + 20, cx + 26, cy + 34), '#5a5a60'); shade(cx - 26, 0, cx + 26, 0, 0.35, [cx - 30, cy - 12, cx + 30, cy + 76]);
    }, seed + 1);
    pc(box(cx - 34, cy - 18, cx + 34, cy - 8), '#5a5a60', null, seed + 2);
    pc(box(cx + 22, cy - 140, cx + 27, cy - 18), '#3a3634', null, seed + 3);                                        // mât de guide-fil
    pc(box(cx - 4, cy - 144, cx + 30, cy - 138), '#3a3634', null, seed + 4);
    pc([[cx - 6, cy + 74], [cx + 6, cy + 74], [cx + 8, cy + 150], [cx - 8, cy + 150, 1]], '#e8dfca', () => { for (let y = cy + 80; y < cy + 150; y += 5) strokePts([[cx - 7, y], [cx + 7, y + 1]], 'rgba(120,100,70,0.5)', 0.7); }, seed + 5);   // tricot tubulaire
  }
  function makeDroite() {
    return M.pre(W, BACK + 40, (c) => {
      etagereBobines(600, 9600);
      // mannequin de couturière (contre le mur, derrière l'établi)
      const mx = 798;
      pc(box(mx - 3, 1040, mx + 3, MA.etabli.y), '#3a2a1a', null, 9620);
      pc([[mx - 8, 902], [mx + 8, 902], [mx + 26, 920], [mx + 30, 960], [mx + 22, 990], [mx + 30, 1030], [mx + 34, 1060, 1], [mx - 34, 1060, 1], [mx - 30, 1030], [mx - 22, 990], [mx - 30, 960], [mx - 26, 920]], '#c9b48a', () => {
        strokePts([[mx, 904], [mx + 2, 1058]], 'rgba(90,60,30,0.5)', 1.2); fillPts(box(mx - 30, 984, mx + 30, 992), '#8a6a44'); shade(mx - 30, 0, mx + 30, 0, 0.3, [mx - 40, 900, mx + 40, 1062]);
        fillPts([[mx - 26, 940], [mx + 28, 948], [mx + 26, 958], [mx - 28, 950]], '#C9A23A'); for (let x = mx - 24; x < mx + 26; x += 5) strokePts([[x, 942 + (x - mx + 26) * 0.15], [x, 946 + (x - mx + 26) * 0.15]], 'rgba(40,28,10,0.7)', 0.6);
      }, 9621);
      pc(ell(mx, 898, 7, 6, 8), '#3a2a1a', null, 9622);
      // établi de coupe
      const E = MA.etabli;
      for (const x of [E.x0 + 12, E.x1 - 20]) pc(box(x, E.y + 10, x + 12, BACK + 4), '#5e3e24', null, 9630 + x);
      pc(box(E.x0 + 8, 1320, E.x1 - 8, 1332), '#6a4a2e', null, 9632);
      pc([[E.x0 + 20, 1320], [E.x0 + 90, 1320], [E.x0 + 92, 1290], [E.x0 + 22, 1294]], '#8a8f9a', () => { for (const y of [1300, 1310]) strokePts([[E.x0 + 22, y], [E.x0 + 90, y - 2]], 'rgba(40,40,50,0.4)', 0.8); }, 9633);
      pc(box(E.x0, E.y, E.x1, E.y + 14), '#7a5434', () => { strokePts([[E.x0 + 2, E.y + 3], [E.x1 - 2, E.y + 3]], 'rgba(255,230,190,0.4)', 1.4); hatch(null, 0.1, 4, 0.2); }, 9634);
      // rouleau de tissu et pelotes sur l'établi
      pc([[E.x0 + 14, E.y], [E.x0 + 14, E.y - 30], [E.x0 + 96, E.y - 30], [E.x0 + 96, E.y]], '#e4dccb', () => { for (let x = E.x0 + 20; x < E.x0 + 96; x += 6) strokePts([[x, E.y - 29], [x, E.y - 1]], 'rgba(150,135,110,0.3)', 0.7); }, 9635);
      pc(ell(E.x0 + 14, E.y - 15, 8, 15, 12), '#d4cab4', () => strokePts(ep(E.x0 + 14, E.y - 15, 4, 8, 10, 0, TAU * 0.9), 'rgba(120,100,70,0.6)', 0.8), 9636);
      pelote(E.x0 + 116, E.y, 12, '#8E2A22', 9637); pelote(E.x0 + 136, E.y, 10, '#5f7350', 9638);
      // métier à tricoter circulaire serré au bout de l'établi ; cône de fil
      metierStatique(MA.metier.x, MA.metier.y, 9640);
      pc([[E.x1 - 30, E.y], [E.x1 - 22, E.y - 42], [E.x1 - 14, E.y]], '#efe6cf', () => { for (let y = E.y - 36; y < E.y; y += 4) strokePts([[E.x1 - 28, y], [E.x1 - 16, y]], 'rgba(120,100,70,0.35)', 0.6); }, 9650);
    });
  }
  function makeA20() {
    return M.pre(W, BACK + 40, (c) => {
      pc(box(740, 756, 956, 768), '#6a4a2e', () => strokePts([[742, 759], [954, 759]], 'rgba(255,230,190,0.35)', 1.2), 9660);
      for (const x of [764, 932]) pc([[x - 4, 768], [x + 4, 768], [x + 4, 800], [x - 18, 770]], '#5a3e26', null, 9661 + x);
      etagereBobines(756, 9670);
      metierStatique(MA.etabli.x0 + 56, MA.etabli.y - 90, 9690);
      const CA0 = MA.cartons;
      for (let i = 0; i < 6; i++) {                                                                                   // rangée de cartons de culottes (dessin du bateau)
        const x = lerp(CA0.x0 + 18, CA0.x1 - 18, i / 5), h = 46 + (i % 2) * 10;
        pc(box(x - 17, CA0.y - h, x + 17, CA0.y + 2), '#a87e4e', () => { strokePts([[x - 17, CA0.y - h + 8], [x + 17, CA0.y - h + 8]], 'rgba(60,40,20,0.5)', 1); fillPts([[x - 7, CA0.y - h + 24], [x + 7, CA0.y - h + 24], [x + 4, CA0.y - h + 28], [x - 4, CA0.y - h + 28]], '#8E2A22'); fillPts([[x, CA0.y - h + 14], [x, CA0.y - h + 23], [x - 5, CA0.y - h + 23]], '#efe6cf'); }, 9700 + i);
      }
    });
  }
  // --- premier plan : panier à linge d'osier, tabouret, bobines tombées, coulisses de cretonne
  function cretonne(x0, x1, seed) {
    const pts = [[x0, 280], [x1, 280], [x1 - 6, 820], [x1 + 4, 900, 1], [x1 + 10, 1300], [x0 - 4, 1300], [x0, 900]];
    pc(pts, '#e8dcc0', () => {
      const R = M.rng(seed);
      for (let i = 0; i < 90; i++) { const x = lerp(x0, x1, R()), y = 290 + R() * 1000; dot(x, y, 3.2, R() < 0.6 ? '#b0453a' : '#8a5a7a'); dot(x + 4, y + 3, 2.2, '#5f7350'); }
      for (let x = x0 + 8; x < x1; x += 12) strokePts([[x, 284], [x + 2, 880], [x + 6, 1296]], 'rgba(90,60,40,0.25)', 1.2);
      shade(x0, 0, x1, 0, 0.25, [x0 - 10, 270, x1 + 14, 1310]);
    }, seed);
    pc(box(x0 - 6, 892, x1 + 10, 906), '#8E2A22', null, seed + 1);
  }
  function makeSol() {
    return M.pre(W, M.H, (c) => {
      cretonne(112, 142, 9801); cretonne(940, 970, 9803);
      // panier à linge d'osier
      const px = 172, py = 1462;
      pc([[px - 76, py - 70], [px + 76, py - 70], [px + 64, py, 1], [px - 64, py, 1]], '#b48a52', () => {
        for (let y = py - 64; y < py; y += 9) strokePts([[px - 74, y], [px + 74, y]], 'rgba(90,60,30,0.5)', 1.4);
        for (let x = px - 70; x < px + 72; x += 12) strokePts([[x, py - 70], [x * 0.98 + px * 0.02, py]], 'rgba(255,230,180,0.3)', 1.2);
        shade(px - 70, 0, px + 70, 0, 0.25, [px - 80, py - 80, px + 80, py + 4]);
      }, 9810);
      pc([[px - 66, py - 70], [px - 40, py - 96], [px - 6, py - 84], [px + 30, py - 100], [px + 64, py - 72]], '#efe8d8', () => strokePts([[px - 40, py - 82], [px + 20, py - 86]], 'rgba(120,110,90,0.4)', 1), 9811);
      pc(ringPts(px - 82, py - 52, 9, 12, 5, 12), '#9a7444', null, 9812); pc(ringPts(px + 82, py - 52, 9, 12, 5, 12), '#9a7444', null, 9813);
      // tabouret
      const tx = 902, ty = 1470;
      for (const [x, a] of [[tx - 30, -0.1], [tx + 30, 0.1]]) pc(rot(box(x - 5, ty - 74, x + 5, ty), a, x, ty - 74), '#6a4428', null, 9820 + x);
      pc(box(tx - 44, ty - 86, tx + 44, ty - 72), '#8a5e36', () => strokePts([[tx - 42, ty - 83], [tx + 42, ty - 83]], 'rgba(255,230,190,0.35)', 1.2), 9822);
      pelote(tx - 12, ty - 86, 14, '#3a5a7a', 9823);
      // bobines tombées au sol
      c.save(); c.translate(262, 1458); c.rotate(PI / 2); bobine(0, 0, '#C9A23A', 9830, 22); c.restore();
      c.save(); c.translate(800, 1462); c.rotate(-PI / 2); bobine(0, 0, '#efe6cf', 9834, 22); c.restore();
      strokePts(qbez([262, 1458], [300, 1470], [340, 1452], 10), 'rgba(201,162,58,0.8)', 1.4);
    });
  }
  PB.init = function () {
    if (KM.mur) return PB;
    KM.mur = makeMur(); KM.gauche = makeGauche(); KM.bassineAv = makeBassineAv(); KM.droite = makeDroite(); KM.a20 = makeA20();
    KM.sol = makeSol(); KM.solS = teinte(KM.sol, 'rgba(30,30,60,0.55)');
    KM.ciel = {}; for (const k in CIELS) KM.ciel[k] = makeCiel(k);
    return PB;
  };
  function cielMix(o) {
    const a = CIELS[o.ciel] ? o.ciel : 'soir', b = o.ciel2 && CIELS[o.ciel2] ? o.ciel2 : null, f = b ? clamp(o.fondu || 0) : 0;
    const A = CIELS[a], B = b ? CIELS[b] : A;
    return { a, b, f, tint: A.tint.map((v, i) => lerp(v, B.tint[i], f)), lum: lerp(A.lum, B.lum, f), jour: lerp(A.lum >= 0.9 ? 1 : 0, B.lum >= 0.9 ? 1 : 0, f), hiver: lerp(a === 'hiver' ? 1 : 0, b === 'hiver' ? 1 : 0, f), printemps: lerp(a === 'printemps' ? 1 : 0, b === 'printemps' ? 1 : 0, f) };
  }
  function oiseau(x, y, s, g, col) { const fl = Math.sin(g * 18) * 6 * s; strokePts([[x - 9 * s, y - fl], [x - 3 * s, y], [x, y + 1 * s], [x + 3 * s, y], [x + 9 * s, y - fl]], col, 2); }
  function moineau(x, y, s, t, picore) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s, s);
    const hb = picore ? Math.max(0, Math.sin(t * 7)) * 5 : 0;
    pc([[-16, -8], [-6, -16], [8, -14], [14, -8], [10, 0], [-6, 2], [-22, -2]], '#7a5a3a', () => { strokePts([[-8, -12], [4, -6]], 'rgba(40,24,10,0.6)', 1.4); fillPts([[-4, -2], [8, -2], [10, 0], [-6, 2]], '#d8c8a8'); }, 9850, { drop: false });
    pc(ell(12, -16 + hb, 7, 6, 10), '#6a4a30', () => { dot(15, -18 + hb, 1.4, '#111'); fillPts([[10, -12 + hb], [14, -10 + hb], [8, -10 + hb]], '#2a2420'); }, 9851, { drop: false });
    pc([[18, -16 + hb], [24, -14 + hb], [18, -13 + hb]], '#3a3020', null, 9852, { drop: false });
    strokePts([[0, 2], [0, 7]], '#3a3020', 1); strokePts([[4, 2], [4, 7]], '#3a3020', 1);
    c.restore();
  }
  // --- PB.maison(t, o) : options ciel / ciel2 + fondu / lampe / vacille / annees20 / bateau (+ bateauO) / bobine / volets / moineau / manivelle / ciseauxMur
  PB.maison = function (t, o) {
    o = o || {}; PB.init();
    const c = cx_(), g = M.tg(t), F = MA.fen, cm = cielMix(o);
    // 1) la rue derrière la vitre
    const cA = KM.ciel[cm.a]; c.drawImage(cA, cA.ox, cA.oy);
    if (cm.b && cm.f > 0) { c.save(); c.globalAlpha = cm.f; const cB = KM.ciel[cm.b]; c.drawImage(cB, cB.ox, cB.oy); c.restore(); }
    c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    const V = MA.volets, vk = ease(clamp(o.volets || 0));                                                          // volets du voisin d'en face
    for (const s of [-1, 1]) { const w = 11 * lerp(1, -1, vk); fillPts([[V.x, V.y - 15], [V.x + s * (11 + w), V.y - 15 + 2 * vk], [V.x + s * (11 + w), V.y + 13 - 2 * vk], [V.x, V.y + 13]], mixH('#4f6a4a', '#1a2030', 1 - cm.lum)); strokePts([[V.x + s * (11 + w) * 0.5, V.y - 12], [V.x + s * (11 + w) * 0.5, V.y + 10]], 'rgba(0,0,0,0.3)', 1); }
    M.passants(t, { y: F.y1 + 34, s: 0.2, n: 2, per: 11, x0: F.x0 - 30, x1: F.x1 + 30, brume: 0.25 + 0.4 * (1 - cm.lum), seed: 9860 });
    if (cm.hiver > 0) { const R = M.rng(9861); for (let i = 0; i < 46; i++) { const x0 = R(), v = 0.5 + R() * 0.5, ph = R(); const y = F.y0 + (((g * 38 * v + ph * 320) % 320) + 320) % 320, x = F.x0 + x0 * 200 + 8 * Math.sin(g * 1.2 + i); dot(x, y, 1.6 + v, `rgba(250,250,250,${0.85 * cm.hiver})`); } }
    if (cm.printemps > 0) { const u = ((g % 9) + 9) % 9 / 2.2; if (u < 1) { c.globalAlpha = cm.printemps; oiseau(lerp(F.x1 + 20, F.x0 - 20, u), F.y0 + 70 + 20 * Math.sin(u * 5), 1, g, '#3a3a40'); c.globalAlpha = 1; } }
    c.restore();
    // 2) mur, fenêtre, voilages, pendule, calendrier
    c.drawImage(KM.mur, 0, 0);
    M.voilage(t, { x: F.x0 - 6, y: F.y0 - 28, w: 46, h: F.y1 - F.y0 + 24, cote: 1, amp: 7, col: 'rgba(242,236,220,0.45)' });
    M.voilage(t + 1.9, { x: F.x1 - 40, y: F.y0 - 28, w: 46, h: F.y1 - F.y0 + 24, cote: -1, amp: 7, col: 'rgba(242,236,220,0.45)' });
    if (o.moineau != null) {
      const u = clamp(o.moineau), A0 = [F.x1 + 140, F.y0 - 40], B0 = [F.x0 + 60, F.y1 - 2], k = smooth(0, 0.4, u);
      const x = lerp(A0[0], B0[0], k), y = lerp(A0[1], B0[1], k) - Math.sin(k * PI) * 60;
      if (k < 1) oiseau(x, y, 1.1, g, '#5a4430'); else moineau(B0[0], B0[1], 1.2, t, true);
    }
    M.pendule(t, { x: MA.pendule.x, y: MA.pendule.y, s: MA.pendule.s, per: 2, bois: '#5a3a22' });
    // 3) lampe à pétrole suspendue
    const L = MA.lampe, la = clamp(o.lampe == null ? 0 : o.lampe), va = clamp(o.vacille || 0);
    if (!SIL()) { c.save(); c.strokeStyle = '#3a2a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(L.x, 130); c.lineTo(L.x, L.y - 70); c.stroke(); for (let y = 140; y < L.y - 70; y += 10) { c.beginPath(); c.ellipse(L.x, y, 2.5, 4.5, 0, 0, TAU); c.stroke(); } c.restore(); }
    pc([[L.x - 4, L.y - 72], [L.x + 4, L.y - 72], [L.x + 58, L.y - 44, 1], [L.x - 58, L.y - 44, 1]], '#e9e2cc', () => { fillPts(box(L.x - 60, L.y - 48, L.x + 60, L.y - 43), '#5f7350'); shade(L.x, L.y - 72, L.x, L.y - 44, 0.25, [L.x - 62, L.y - 74, L.x + 62, L.y - 40]); }, 9870);
    const fl = 1 - 0.38 * smooth(0.25, 1, va) + 0.12 * Math.sin(t * 37) * Math.sin(Math.min(1, va) * PI);
    if (la > 0) { c.save(); c.globalAlpha = c.globalAlpha * la; M.flamme(t, { x: L.x, y: L.y - 2, s: 0.5 * fl, r: 70, seed: 9871 }); c.restore(); }
    pc([[L.x - 9, L.y - 44], [L.x + 9, L.y - 44], [L.x + 12, L.y - 20], [L.x + 7, L.y + 6], [L.x - 7, L.y + 6], [L.x - 12, L.y - 20]], `rgba(235,240,235,${0.28 + 0.15 * la})`, () => strokePts([[L.x - 6, L.y - 38], [L.x - 8, L.y - 2]], 'rgba(255,255,255,0.6)', 1.4), 9872, { drop: false });
    pc(box(L.x - 14, L.y + 6, L.x + 14, L.y + 14), '#b08d45', null, 9873);
    pc(ep(L.x, L.y + 14, 26, 30, 14, 0, PI).concat([[L.x - 26, L.y + 14]]), '#b08d45', () => { strokePts(ep(L.x, L.y + 14, 20, 22, 8, PI * 0.2, PI * 0.6), 'rgba(255,240,190,0.5)', 1.6); shade(L.x - 26, 0, L.x + 26, 0, 0.3, [L.x - 30, L.y + 10, L.x + 30, L.y + 50]); }, 9874);
    pc(ell(L.x, L.y + 48, 5, 5, 8), '#8a6a34', null, 9875);
    // 4) plan intermédiaire gauche : cuisinière (lueur du foyer), marmite qui fume, bassine (bateau qui flotte)
    c.drawImage(KM.gauche, 0, 0);
    const Cq = MA.cuisiniere; glow(Cq.x0 + 130, Cq.y + 66, 40, '255,140,60', 0.25 + 0.08 * Math.sin(g * 5));
    M.fumee(t, { x: MA.marmite.x, y: MA.marmite.y - 10, s: 0.55, n: 6, haut: 260, vent: 24, col: '#ece6da', a: 0.55, per: 3, seed: 9876 });
    if (o.bateau) PB.bateau(MA.bassine.x + 4, MA.bassine.y + 8, 0.6, Object.assign({ t, tangue: 1 }, o.bateauO));
    c.drawImage(KM.bassineAv, 0, 0);
    // 5) plan intermédiaire droit : étagères, mannequin, établi, métier (manivelle qui tourne par moments), bobine qui roule, ciseaux au mur
    c.drawImage(KM.droite, 0, 0);
    if (o.annees20) c.drawImage(KM.a20, 0, 0);
    const per = 14, gm = ((g % per) + per) % per, tours = Math.floor(g / per) + smooth(0, 3.2, gm) + ease(clamp(o.manivelle || 0));
    const Mv = MA.manivelle, an = tours * TAU, bx = Mv.x + Math.sin(an) * 22, by = Mv.y - Math.cos(an) * 22 * 0.45;
    pc(ribbon([[Mv.x, Mv.y], [bx, by]], 6), '#3a3634', null, 9880); M.rivet(Mv.x, Mv.y, 3);
    pc(box(bx - 4, by - 14, bx + 4, by + 2), '#7a4a28', null, 9881);
    if (o.annees20) { const m2 = MA.etabli.x0 + 56 - 30, b2x = m2 + Math.sin(an * 0.8 + 1) * 20, b2y = MA.etabli.y - 80 - Math.cos(an * 0.8 + 1) * 9; pc(ribbon([[m2, MA.etabli.y - 80], [b2x, b2y]], 6), '#3a3634', null, 9882); pc(box(b2x - 4, b2y - 14, b2x + 4, b2y + 2), '#7a4a28', null, 9883); }
    if (o.ciseauxMur !== false) { const Cs = MA.ciseaux; dot(Cs.x, Cs.y - 4, 3, '#2a2a2a'); PB.ciseaux(Cs.x, Cs.y + 10, 0.62, { rot: PI / 2 + 0.03 * Math.sin(g * 0.7), coupe: 0.9 }); }
    if (o.bobine != null) {
      const u = clamp(o.bobine), E = MA.etabli; let x, y, a;
      if (u < 0.45) { const k = u / 0.45; x = lerp(E.x0 + 120, E.x0 - 4, k * k); y = E.y - 9; a = -(E.x0 + 120 - x) / 9; }
      else if (u < 0.6) { const k = (u - 0.45) / 0.15; x = E.x0 - 4 - 30 * k; y = E.y - 9 + (BACK - 9 - E.y + 9) * k * k; a = -(124 + 30 * k) / 9; }
      else { const k = (u - 0.6) / 0.4; x = E.x0 - 34 - 70 * (1 - (1 - k) * (1 - k)); y = BACK - 9 - Math.abs(Math.sin(k * 9)) * 10 * (1 - k); a = -(154 + 70 * k) / 9; }
      c.save(); c.translate(x, y); c.rotate(a); bobine(0, 13, '#8E2A22', 9890, 22); c.restore();
    }
    // 6) lumière : teinte du ciel sur toute la pièce, rayon de soleil (jour), lueur de la lampe
    if (!SIL()) {
      const T = cm.tint;
      if (T[3] > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(${T[0] | 0},${T[1] | 0},${T[2] | 0},${T[3]})`; c.fillRect(0, 0, W, BACK + 40); c.restore(); }
      if (cm.jour > 0.02) {
        const poly = [[F.x0 + 10, F.y0 + 20], [F.x1 - 10, F.y0 + 20], [880, BACK], [600, BACK]];
        c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
        const gr = c.createLinearGradient(540, F.y0, 740, BACK); gr.addColorStop(0, `rgba(255,236,190,${0.12 * cm.jour})`); gr.addColorStop(1, `rgba(255,236,190,${0.02 * cm.jour})`); c.fillStyle = gr; c.fill(); c.clip();
        M.poussiere(t, { x: F.x0, y: F.y0, w: 440, h: BACK - F.y0, n: 60, a: 0.6 * cm.jour, seed: 9891 });
        c.restore();
      }
      const lg = la * fl * (0.35 + 0.65 * (1 - cm.lum));
      glow(L.x, L.y, 460, '255,190,110', 0.2 * lg); glow(L.x, L.y - 10, 120, '255,220,150', 0.35 * lg);
    }
  };
  PB.maisonSol = function (t, o) {
    o = o || {}; PB.init(); const c = cx_(), cm = cielMix(o);
    c.drawImage(KM.sol, 0, 0);
    const dk = clamp((1 - cm.lum) * 0.8 - clamp(o.lampe || 0) * 0.2);
    if (dk > 0) { c.save(); c.globalAlpha = dk; c.drawImage(KM.solS, 0, 0); c.restore(); }
  };
})();
