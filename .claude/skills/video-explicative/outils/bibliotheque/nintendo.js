// nintendo.js — « Nintendo, le géant du jeu vidéo né de cartes en papier » (Kyoto 1880-1977 → salon d'aujourd'hui) : marionnettes,
// accessoires et décors PROPRES À CETTE VIDÉO. Espace M.nin (alias NIN). Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Dans S.init : NIN.init() (pré-rendus des trois décors). Aucun texte, lettre, chiffre, idéogramme ni logo. Déterministe (hash, jamais Math.random).
// MARIONNETTES (avec tige ; (x,y) = pieds) : NIN.yamauchi (0,9) · NIN.policier (0,9) · NIN.gros (0,85) · NIN.maigre (0,85) · NIN.mere (0,9)
//   · NIN.garcon (enveloppe du garçon de petitbateau.js recoloré : sweat vert, jean ; 0,65)
// ACCESSOIRES (x,y,s,o) : NIN.carte · NIN.eventail · NIN.tas · NIN.boite · NIN.carteOcc · NIN.cartesOcc · NIN.planche · NIN.feuille
//   · NIN.manette · NIN.console · NIN.tele ; points : NIN.pt(r,'nom',arriere) (objet tenu), NIN.accPt(r,'objet','nom') (objet seul)
// DÉCORS (t, up, o) : NIN.salon + NIN.salonSol · NIN.tripot + NIN.tripotSol · NIN.atelier + NIN.atelierSol ; repères NIN.SALON / TRIPOT / ATELIER
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const NIN = (M.nin = {});
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
  const rotP = (pts, a, ox, oy) => { ox = ox || 0; oy = oy || 0; const c = Math.cos(a), s = Math.sin(a); return pts.map((p) => { const x = p[0] - ox, y = p[1] - oy, q = [ox + x * c - y * s, oy + x * s + y * c]; if (p[2]) q.push(1); return q; }); };
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
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function blob(cx, cy, rx, ry, seed, n) { n = n || 13; const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 0.8 + 0.28 * hash(seed + i * 1.7); o.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return o; }
  // fleur à 5 pétales (cerisier) : centre, rayon
  function fleur5(x, y, r, col, coeur, a0) {
    a0 = a0 || 0;
    for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * TAU; fillPts(ell(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.5, 8), col, 0, 0); }
    dot(x, y, r * 0.25, coeur || '#c9a24a');
  }
  function etoile(x, y, r, n, col, a0) { const o = []; for (let i = 0; i < n * 2; i++) { const a = (a0 || 0) + i / (n * 2) * TAU, rr = i % 2 ? r * 0.45 : r; o.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } fillPts(o, col, 0, 0.3); }
  NIN.geo = { ep, ell, tr, scl, mp, rotP, ribbon, qbez, rrect, pc, box, blob, fleur5, etoile, normA };

  // ------------------------------------------------------------ bras à articulations rondes (rivet au centre de chaque arrondi)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt, wTop) { wt = wt || 15; const wT = wTop || wt; return ep(0, 0, wT, wT, 10, PI, TAU).concat([[wT - 1, 22], [wt - 1, 44], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 44], [-wT + 1, 22]]); }
  const H_BAS = [[-8, 78], [8, 78], [9, 90], [9, 105], [5, 117], [-2, 119], [-8, 114], [-10, 104], [-10, 94], [-15, 99], [-18, 95], [-12, 86]];
  function handShape(k) { return k === 'fist' ? X.HAND_FIST : k === 'bas' ? H_BAS : X.HAND_OPEN; }
  function foreR(kind) {
    const h = handShape(kind);
    return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[10, 40], [9, 76]], h.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [[-9, 86], [-10, 76], [-11, 40]]);
  }
  function handPaintK(kind) {
    if (kind === 'fist') { strokePts([[0, 92], [12, 92]], 'rgba(60,30,20,0.5)', 1); strokePts([[-2, 99], [10, 99]], 'rgba(60,30,20,0.5)', 1); return; }
    if (kind === 'bas') { strokePts([[-1, 100], [-3, 113]], 'rgba(70,35,20,0.45)', 1); strokePts([[3, 100], [3, 112]], 'rgba(70,35,20,0.45)', 1); return; }
    X.handPaint(null, 'open');
    if (kind === 'paume') fillPts([[2, 88], [9, 92], [8, 108], [2, 112]], 'rgba(255,225,200,0.25)');
  }
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant' (coude devant), 'arriere' ; le coude ne plie que vers l'avant
  function ik2(S, T, pick, retry) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      const sc = (b > 0.05 ? -1e6 : 0) + (pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1]);
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    if (best.sc < -1e5) return retry ? { a: tv, b: 0, sc: 0 } : ik2(S, [Math.max(T[0], S[0] + 12), T[1]], pick, true);
    return best;
  }
  NIN.ik2 = ik2;

  // ------------------------------------------------------------ poses : outils communs
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function headPt(q, hx, hy, neck) { neck = neck || [6, -170]; return mp(new DOMMatrix().translate(neck[0], neck[1]).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const has = (v) => v && v !== 'rien';
  const kv = (q, n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));
  // plie le buste aux hanches (th > 0 = vers l'avant) en gardant la hanche en place ; H = hauteur de jambe du personnage
  function plier(q, th, H) {
    if (!th) return;
    const h = (H || 238) - (q.dy || 0);
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - h * Math.sin(th); q.dy = (q.dy || 0) + h * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  // marche : m 0..1 (amplitude), q.t (s), cad (pas/s), amp (rad de jambe), bob (sautillement)
  function marcher(q, cad, amp, bob, brasLibres, brasAmp) {
    const m = q.marche === true ? 1 : clamp(q.marche || 0); if (m <= 0) return;
    const ph = (q.t || 0) * PI * cad, s = Math.sin(ph), A = q.ang, ba = brasAmp == null ? 0.15 : brasAmp;
    A.legF = (A.legF || 0) - amp * s * m; A.legB = (A.legB || 0) + amp * s * m;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * bob * m;
    if (brasLibres.F) A.armF_up = (A.armF_up || 0) + ba * s * m;
    if (brasLibres.B) A.armB_up = (A.armB_up || 0) - ba * s * m;
  }
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
  NIN.toTorso = toTorso;
  NIN._outils = { prep, headPt, armTo, blend, has, kv, plier, marcher, avecCible, armR, foreR, handPaintK, SH_F, SH_B, LA };

  // =====================================================================
  // OBJETS — chacun dessiné à l'échelle 1 dans son repère, seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const ROUGE = '#8E2B22', ROUGED = '#6e1f18', IVOIRE = '#EFE6CF', LAQUE = '#161213', OR = "#c9a24a", ORF = "#9a7a34";
  const CW = 40, CH2 = 64;                       // demi-largeur / demi-hauteur d'une hanafuda (80 × 128 à s 1)
  // ---------------- motifs des hanafuda (zone intérieure x −34..34, y −58..58), aucune inscription
  function rideau(y0, col, colD) {               // rideau (maku) rouge à festons, plis verticaux
    const pts = [[-36, 60, 1], [-36, y0]]; for (let x = -36; x <= 36; x += 12) pts.push([x + 6, y0 + 8], [x + 12, y0]); pts.push([36, 60, 1]);
    fillPts(pts, col, 0, 0.2);
    for (let x = -30; x <= 30; x += 12) strokePts([[x, y0 + 8], [x - 1, 60]], colD, 1.4);
    for (let x = -30; x <= 30; x += 24) fillPts(ell(x + 6, y0 + 26, 5, 5, 8), 'rgba(239,230,207,0.55)', 0, 0);
  }
  function branche(pts, w) { const r = ribbon(pts, w, w * 0.4); fillPts(r, '#4a3020', 0, 0.2); }
  const MOTIFS = {
    cerisier: (champ) => {
      rideau(14, '#b8322a', '#7a1e18');
      branche([[-40, -40], [-18, -30], [2, -36], [20, -22], [36, -26]], 7); branche([[-6, -34], [-2, -14], [8, 2]], 4);
      const fl = [[-22, -36], [-8, -44], [6, -30], [16, -40], [26, -20], [-14, -20], [6, -6], [30, -34], [-30, -24]];
      fl.forEach(([x, y], i) => fleur5(x, y, 7.5, i % 2 ? '#f2b7c4' : '#e994aa', '#b8322a', i));
      for (const [x, y] of [[-26, -4], [18, 4], [-4, 8]]) fillPts(ell(x, y, 2.6, 1.6, 6), '#eea6b8', 0, 0);
      if (champ) {                                // petit champignon rouge à pois blancs (clin d'œil générique)
        fillPts([[13, 52, 1], [13, 38], [23, 38], [23, 52, 1]], '#f3ead6', 0, 0.2);
        fillPts(ep(18, 38, 14, 12, 10, PI, TAU).concat([[32, 40], [4, 40]]), '#d0281e', 0, 0.2);
        for (const [x, y, r] of [[12, 32, 2.6], [20, 29, 3], [27, 35, 2.2], [17, 36, 1.8]]) dot(x, y, r, '#fbf6ea');
        strokePts([[6, 40], [30, 40]], 'rgba(90,20,14,0.6)', 0.9);
      }
    },
    grue: () => {
      fillPts(ell(10, -22, 24, 24, 20), '#c7342a', 0, 0);
      fillPts([[-36, 60, 1], [-36, 34], [-20, 24], [-6, 34], [10, 22], [26, 34], [36, 26], [36, 60, 1]], '#4f7a4a', 0, 0.3);
      for (let x = -28; x < 34; x += 9) strokePts([[x, 30], [x + 4, 44]], 'rgba(20,40,20,0.6)', 1);
      // grue blanche, cou noir, tête rouge, ailes ouvertes
      fillPts([[-24, 14], [-8, 4], [8, 6], [22, 14], [8, 18], [-10, 20]], '#fbf8ef', 0, 0.3);
      fillPts([[-10, 6], [-26, -14], [-34, -30], [-14, -16], [0, 4]], '#fbf8ef', 0, 0.3);
      strokePts([[-26, -14], [-34, -30]], 'rgba(30,30,30,0.7)', 1.6);
      strokePts([[18, 12], [26, -2], [28, -12]], '#1a1616', 3.2); dot(28, -14, 3.2, '#d0281e'); strokePts([[30, -14], [38, -12]], '#3a2a1a', 1.4);
      strokePts([[-2, 20], [-6, 34]], '#1a1616', 1.4); strokePts([[6, 20], [6, 34]], '#1a1616', 1.4);
    },
    lune: () => {
      fillPts(box(-36, -60, 36, 14), '#b23a2e', 0, 0);
      fillPts(ell(0, -22, 24, 24, 20), '#f6ecd0', 0, 0); dot(-6, -26, 5, 'rgba(220,200,160,0.35)');
      fillPts([[-36, 60, 1], [-36, 12], [-12, -2], [10, 4], [36, -6], [36, 60, 1]], '#1c1a18', 0, 0.3);
      for (let i = 0; i < 14; i++) { const x = -32 + i * 5, h = 18 + 10 * hash(i * 3.3); strokePts(qbez([x, 58], [x + 2, 40 - h * 0.4], [x + 8 - (i % 3) * 2, 36 - h]), i % 2 ? '#e8dcc0' : '#c9b48a', 1.3); }
    },
    pin: () => {
      for (const [y, w] of [[-44, 30], [-30, 22]]) fillPts(rrect(-36, y, -36 + w * 2, y + 8, 4), '#c0392e', 0, 0);
      branche([[-6, 60], [-2, 30], [6, 10], [2, -10]], 9);
      for (const [x, y, r] of [[-14, -6, 15], [16, 4, 17], [-4, 20, 13], [20, -18, 12], [-20, 18, 10]]) { fillPts(blob(x, y, r, r * 0.6, x * 3 + y, 11), '#2f5a36', 0, 0.3); for (let k = -2; k <= 2; k++) strokePts([[x + k * 4, y - 3], [x + k * 4 + 2, y + 3]], 'rgba(160,200,140,0.5)', 0.9); }
      fillPts([[-36, 60, 1], [-36, 46], [36, 42], [36, 60, 1]], '#6a8a5a', 0, 0);
    },
    erable: () => {
      const lv = [[-22, -40, 0.2], [0, -48, 0.9], [22, -36, 1.6], [-28, -16, 2.2], [14, -14, 0.5], [-6, -24, 1.2], [28, -8, 2.8]];
      for (const [x, y, a] of lv) { etoile(x, y, 9, 5, '#b8322a', a); strokePts([[x, y], [x + 6, y + 9]], '#6e1f18', 0.9); }
      // cerf brun, tête tournée
      fillPts([[-24, 40], [-20, 26], [4, 22], [18, 24], [22, 30], [20, 40], [-22, 42]], '#8a5a34', 0, 0.3);
      fillPts([[16, 26], [24, 10], [32, 6], [34, 10], [26, 16], [22, 28]], '#8a5a34', 0, 0.3);
      strokePts([[26, 8], [22, -4], [16, -8]], '#5a3a1e', 1.3); strokePts([[28, 7], [32, -6], [36, -8]], '#5a3a1e', 1.3);
      for (const x of [-18, -10, 10, 16]) strokePts([[x, 40], [x + 1, 56]], '#5a3a1e', 2);
      for (const [x, y] of [[-12, 30], [0, 28], [8, 32]]) dot(x, y, 1.6, '#e8d8b8');
    },
    iris: () => {
      branche([[-40, 46], [-10, 38], [20, 46], [40, 38]], 8);
      for (const x of [-26, -12, 6, 22]) { strokePts([[x, 44], [x - 3, -6]], '#3e6a3a', 3); strokePts([[x + 4, 44], [x + 8, 4]], '#4f7a4a', 2.4); }
      for (const [x, y] of [[-28, -14], [-12, -28], [6, -12], [24, -26]]) {
        fillPts([[x, y], [x - 9, y - 10], [x - 2, y - 2]], '#5a3a8a', 0, 0.2); fillPts([[x, y], [x + 9, y - 10], [x + 2, y - 2]], '#5a3a8a', 0, 0.2);
        fillPts([[x - 3, y], [x, y - 16], [x + 3, y]], '#7a5ab0', 0, 0.2); fillPts([[x - 6, y + 2], [x, y + 10], [x + 6, y + 2]], '#4a2a72', 0, 0.2);
      }
    },
  };
  MOTIFS.champignon = () => MOTIFS.cerisier(true);
  NIN.MOTIFS = ['cerisier', 'grue', 'lune', 'pin', 'erable', 'iris', 'champignon'];
  function carteFace(motif) {
    pc(rrect(-CW, -CH2, CW, CH2, 6), ROUGE, () => {
      fillPts(rrect(-CW + 5, -CH2 + 5, CW - 5, CH2 - 5, 3), IVOIRE, 0, 0);
      const c = cx_(); if (!SIL()) { c.save(); M.path(rrect(-CW + 5, -CH2 + 5, CW - 5, CH2 - 5, 3), 0, 0); c.clip(); }
      (MOTIFS[motif] || MOTIFS.cerisier)();
      if (!SIL()) c.restore();
      strokePts(rrect(-CW + 5, -CH2 + 5, CW - 5, CH2 - 5, 3), 'rgba(90,20,14,0.55)', 1, true);
    }, 8101, { texA: 0.35 });
  }
  function carteDos() {
    pc(rrect(-CW, -CH2, CW, CH2, 6), ROUGE, () => {
      fillPts(rrect(-CW + 5, -CH2 + 5, CW - 5, CH2 - 5, 3), LAQUE, 0, 0);
      strokePts([[-24, -50], [-30, 10]], 'rgba(255,255,255,0.22)', 3); strokePts([[-18, -54], [-22, -30]], 'rgba(255,255,255,0.15)', 2);
    }, 8102, { texA: 0.25 });
  }
  // o : motif, face (1 face / 0 dos ; entre les deux = la carte se retourne), couche (0..1 : posée à plat, vue en perspective)
  function drawCarte(o) {
    const f = o.face == null ? 1 : +o.face, ca = Math.cos((1 - clamp(f)) * PI), cou = clamp(o.couche || 0), c = cx_();
    c.save(); c.scale(Math.max(Math.abs(ca), 0.04), 1 - 0.68 * cou);
    if (cou > 0) c.transform(1, 0, -0.35 * cou, 1, 0, 0);
    if (!SIL()) fillPts(tr(rrect(-CW, -CH2, CW, CH2, 6), 2.5, 3), 'rgba(60,20,14,0.85)', 0, 0);       // épaisseur
    if (ca >= 0) carteFace(o.motif || 'cerisier'); else carteDos();
    c.restore();
  }
  // ---------------- cartes occidentales (50 × 75) : enseignes et roi, aucune lettre ni chiffre
  function coeurPts(x, y, r) { return [[x, y + r * 0.9]].concat(ep(x - r * 0.48, y - r * 0.15, r * 0.52, r * 0.52, 8, PI * 0.75, PI * 2), ep(x + r * 0.48, y - r * 0.15, r * 0.52, r * 0.52, 8, PI, PI * 2.25)); }
  function coeur(x, y, r, col) { fillPts(coeurPts(x, y, r), col, 0, 0.2); }
  function pique(x, y, r, col) {
    fillPts(coeurPts(x, y - r * 0.1, r).map((p) => [p[0], 2 * (y - r * 0.1) - p[1]]), col, 0, 0.2);
    fillPts([[x - 2, y + 0.2 * r], [x - r * 0.4, y + r], [x + r * 0.4, y + r], [x + 2, y + 0.2 * r]], col, 0, 0);
  }
  function drawCarteOcc(o) {
    const f = o.face == null ? 1 : +o.face, ca = Math.cos((1 - clamp(f)) * PI), cou = clamp(o.couche || 0), c = cx_(), en = o.enseigne || 'coeur';
    c.save(); c.scale(Math.max(Math.abs(ca), 0.04), 1 - 0.68 * cou); if (cou > 0) c.transform(1, 0, -0.35 * cou, 1, 0, 0);
    if (!SIL()) fillPts(tr(rrect(-25, -37, 25, 37, 4), 2, 2), 'rgba(40,40,50,0.6)', 0, 0);
    if (ca < 0) {
      pc(rrect(-25, -37, 25, 37, 4), '#f2efe6', () => { fillPts(rrect(-21, -33, 21, 33, 2), '#3a4a7a', 0, 0); for (let k = -40; k < 40; k += 6) { strokePts([[-21, k], [21, k + 30]], 'rgba(230,220,200,0.35)', 0.8); strokePts([[-21, k + 30], [21, k]], 'rgba(230,220,200,0.35)', 0.8); } }, 8111, { texA: 0.25 });
    } else {
      pc(rrect(-25, -37, 25, 37, 4), '#f6f3ea', () => {
        strokePts(rrect(-21, -33, 21, 33, 2), 'rgba(80,80,90,0.35)', 0.8, true);
        if (en === 'roi') {
          fillPts(box(-17, -29, 17, 29), '#efe4c8', 0, 0);
          fillPts([[-11, -14], [-12, -24], [-6, -18], [0, -26], [6, -18], [12, -24], [11, -14]], OR, 0, 0.2);                 // couronne
          fillPts(ell(0, -6, 8, 9, 12), '#e6c4a0', 0, 0); dot(-3, -8, 1.3, '#2a1a14'); dot(3, -8, 1.3, '#2a1a14');
          fillPts([[-8, -2], [8, -2], [6, 10], [0, 14], [-6, 10]], '#8a5a30', 0, 0.2);                                       // barbe
          fillPts([[-16, 29], [-14, 10], [0, 16], [14, 10], [16, 29]], '#b8322a', 0, 0.2); fillPts([[-4, 14], [4, 14], [3, 29], [-3, 29]], '#3a4a7a', 0, 0);
          coeur(-12, -24, 4, '#c0282a'); coeur(12, 22, 4, '#c0282a');
        } else if (en === 'pique') { pique(0, 0, 13, '#1a1a1e'); pique(-13, -24, 4, '#1a1a1e'); pique(13, 24, 4, '#1a1a1e'); }
        else { coeur(0, 0, 13, '#c0282a'); coeur(-13, -24, 4, '#c0282a'); coeur(13, 24, 4, '#c0282a'); }
      }, 8112, { texA: 0.25 });
    }
    c.restore();
  }
  // ---------------- éventail de cartes tenu (pivot en bas = prise) ; o : n (3..8), motifs [..], occ (cartes occidentales), face, ouvert 0..1
  function drawEventail(o) {
    const n = Math.max(1, Math.round(o.n || 5)), ouv = o.ouvert == null ? 1 : clamp(o.ouvert), spread = 0.95 * ouv, c = cx_();
    const mot = o.motifs || ['cerisier', 'grue', 'lune', 'pin', 'erable', 'iris', 'champignon'], ens = ['coeur', 'pique', 'roi', 'coeur', 'pique', 'coeur', 'pique', 'roi'];
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? 0 : -spread / 2 + spread * i / (n - 1);
      c.save(); c.rotate(a); c.translate(0, o.occ ? -30 : -46);
      if (o.occ) drawCarteOcc({ enseigne: (o.enseignes || ens)[i % 8], face: o.face }); else drawCarte({ motif: mot[i % mot.length], face: o.face });
      c.restore();
    }
  }
  // ---------------- paquet de cartes (dos), posé : origine = milieu du bas ; o : n, couche (défaut 1 : à plat sur la table)
  function drawTas(o) {
    const n = Math.max(1, Math.round(o.n || 12)), c = cx_(), cou = o.couche == null ? 1 : clamp(o.couche);
    for (let i = 0; i < n; i++) {
      c.save(); c.translate((hash(i * 7.1 + (o.seed || 0)) - 0.5) * 6, -i * (cou > 0.5 ? 2.3 : 1.2) - (cou > 0.5 ? 14 : 64)); c.rotate((hash(i * 3.7) - 0.5) * 0.08 * (1 - cou));
      drawCarte({ face: i === n - 1 && o.dessus ? 1 : 0, motif: o.dessus, couche: cou }); c.restore();
    }
  }
  // ---------------- boîte à fleurs (carton laqué rouge, fleurs peintes) : origine = milieu du bas ; o : ouvert 0..1, pile (nombre), cartes (dedans, true)
  const BX = 75, BH = 70, BD = 22, BS = 12;            // demi-largeur, hauteur de face, hauteur du dessus en perspective, décalage oblique
  function fleursPeintes(x0, x1, y0, y1, seed) {
    const R = M.rng(seed || 9);
    branche([[x0, y1 - 10], [x0 + (x1 - x0) * 0.3, y0 + 18], [x0 + (x1 - x0) * 0.55, y0 + 10]], 3);
    for (let i = 0; i < 5; i++) fleur5(lerp(x0 + 8, x0 + (x1 - x0) * 0.6, R()), lerp(y0 + 6, y1 - 12, R()), 6 + R() * 2, i % 2 ? '#f2b7c4' : '#e994aa', '#b8322a', i);
    const cx = x1 - 26, cy = (y0 + y1) / 2;                                           // chrysanthème or
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; fillPts(ell(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 6, 2.4, 6).map((p) => { const dx = p[0] - (cx + Math.cos(a) * 8), dy = p[1] - (cy + Math.sin(a) * 8); return [cx + Math.cos(a) * 8 + dx * Math.cos(a) - dy * Math.sin(a), cy + Math.sin(a) * 8 + dx * Math.sin(a) + dy * Math.cos(a)]; }), i % 2 ? OR : '#e0b85a', 0, 0); }
    dot(cx, cy, 5, ORF);
    strokePts([[x0 + 4, y1 - 4], [x1 - 4, y1 - 4]], 'rgba(201,162,74,0.7)', 1.2);
  }
  function uneBoite(ouv, cartes, seed) {
    const c = cx_();
    // corps : face avant + flanc droit (oblique)
    pc([[BX, -BH, 1], [BX + BS, -BH - BD, 1], [BX + BS, -BD + 2, 1], [BX, 0, 1]], ROUGED, () => hatch(null, 1.2, 3.4, 0.3), seed + 1);
    pc(box(-BX, -BH, BX, 0), ROUGE, () => {
      fleursPeintes(-BX, BX, -BH + 18, 0, seed); strokePts([[-BX + 3, -BH + 18], [BX - 3, -BH + 18]], 'rgba(201,162,74,0.6)', 1);
      shade(0, -BH, 0, 0, 0.22, [-BX, -BH, BX, 0]);
    }, seed + 2, { texA: 0.4 });
    const a = clamp(ouv) * 1.95;
    if (a > 0.02) {                                       // intérieur : bord noir, cartes ivoire rangées
      fillPts([[-BX, -BH], [BX, -BH], [BX + BS, -BH - BD], [-BX + BS, -BH - BD]], '#1e1414', 0, 0);
      if (cartes !== false) for (let i = 0; i < 7; i++) { const x = -BX + 14 + i * 19; fillPts([[x, -BH - 3], [x + 15, -BH - 3], [x + 15 + BS * 0.6, -BH - BD * 0.6 - 3], [x + BS * 0.6, -BH - BD * 0.6 - 3]], i % 2 ? '#e9dfc6' : '#d8ccae', 0, 0); dot(x + 10, -BH - 9, 2.4, i % 3 ? '#c03a2e' : '#e994aa'); }
    }
    // couvercle : charnière au bord arrière (y −BH−BD) ; se relève derrière la boîte
    const hy = -BH - BD, fy = hy + BD * Math.cos(a) - 46 * Math.sin(a), fx = BS * (1 - Math.cos(a));
    const lid = [[-BX + BS, hy, 1], [BX + BS, hy, 1], [BX + fx, fy, 1], [-BX + fx, fy, 1]];
    if (a < 1.4) {
      pc(lid, ROUGE, () => { fleursPeintes(-BX + 8, BX + 4, Math.min(hy, fy) + 2, Math.max(hy, fy) - 2, seed + 5); }, seed + 3, { texA: 0.35 });
      pc(box(-BX - 2, fy, BX + 2, fy + 16), ROUGED, () => strokePts([[-BX, fy + 3], [BX, fy + 3]], 'rgba(201,162,74,0.7)', 1.2), seed + 4);
    } else {
      pc(lid, '#2a1414', () => { strokePts([[-BX + 20, fy + 8], [BX - 10, fy + 8]], 'rgba(255,255,255,0.12)', 3); }, seed + 3, { texA: 0.3 });
      pc(box(-BX - 2, fy - 16, BX + 2, fy), ROUGED, () => strokePts([[-BX, fy - 4], [BX, fy - 4]], 'rgba(201,162,74,0.7)', 1.2), seed + 4);
    }
    void c;
  }
  function drawBoite(o) {
    const n = Math.max(1, Math.round(o.pile || 1)), c = cx_();
    for (let i = 0; i < n; i++) { c.save(); c.translate((hash(i * 5.3 + 1) - 0.5) * 10 * (i > 0), -i * (BH + 6)); uneBoite(i === n - 1 ? o.ouvert || 0 : 0, o.cartes, 8200 + i * 10); c.restore(); }
  }
  NIN.BOITE = { w: 2 * BX + BS, h: BH + BD, etage: BH + 6 };
  // ---------------- planche à imprimer (bois clair gravé, cerisier en relief) ; o : vue 'cote' (défaut, poignée en haut) | 'dessus' ; encre 0..1
  const BOIS = '#b88a5a', BOISD = '#93683e', BOISL = '#d2a676';
  function grain(x0, y0, x1, y1, seed) { const R = M.rng(seed); for (let i = 0; i < 9; i++) { const y = lerp(y0, y1, R()); strokePts(qbez([x0, y], [lerp(x0, x1, 0.5), y + (R() - 0.5) * 8], [x1, y + (R() - 0.5) * 6], 6), 'rgba(90,56,30,0.35)', 0.9); } }
  function drawPlanche(o) {
    const en = clamp(o.encre || 0);
    if (o.vue === 'dessus') {
      pc(rrect(-80, -230, 80, 0, 8), BOIS, () => {
        grain(-80, -230, 80, 0, 51);
        for (let i = 0; i < 4; i++) {                    // 2 × 2 cartes gravées (en miroir), relief brun clair, encrées de rouge
          const cx = i % 2 ? 38 : -38, cy = i < 2 ? -170 : -60, c = cx_();
          fillPts(rrect(cx - 32, cy - 50, cx + 32, cy + 50, 4), en > 0.05 ? M.mixc('#93683e', '#7a2018', en) : BOISD, 0, 0);
          fillPts(rrect(cx - 27, cy - 45, cx + 27, cy + 45, 3), BOISL, 0, 0);
          c.save(); c.translate(cx, cy); c.scale(-0.75, 0.75);
          const m = ['cerisier', 'grue', 'lune', 'pin'][i];
          if (!SIL()) { c.globalAlpha = 0.55 + 0.45 * en; (MOTIFS[m])(); c.globalAlpha = 1; }
          c.restore();
          if (en < 1) fillPts(rrect(cx - 27, cy - 45, cx + 27, cy + 45, 3), `rgba(196,150,100,${0.6 * (1 - en)})`, 0, 0);
        }
        shade(-80, -230, 80, 0, 0.18, [-80, -230, 80, 0]);
      }, 8301);
      return;
    }
    pc([[-80, -30, 1], [80, -30, 1], [80, 0, 1], [-80, 0, 1]], BOIS, () => {
      grain(-80, -30, 80, 0, 52); fillPts(box(-80, -6, 80, 0), en > 0.05 ? M.mixc('#93683e', '#8e2b22', en) : BOISD, 0, 0);
      for (let x = -70; x < 72; x += 14) fillPts(box(x, -6, x + 8, -2), 'rgba(60,30,14,0.4)', 0, 0);
    }, 8302);
    pc([[-34, -30, 1], [-28, -46], [28, -46], [34, -30, 1]], BOISD, () => { strokePts([[-24, -42], [24, -42]], 'rgba(255,220,170,0.35)', 1.4); }, 8303);
  }
  // ---------------- feuille d'écorce de mûrier (150 × 220, ivoire fibreuse) : origine = milieu du bas ; o : encre 0..1 (impression 2 × 2), motifs, couche 0..1
  function drawFeuille(o) {
    const en = clamp(o.encre || 0), cou = clamp(o.couche || 0), c = cx_();
    c.save(); if (cou > 0) { c.scale(1, 1 - 0.85 * cou); c.transform(1, 0, -0.5 * cou, 1, 0, 0); }
    const bord = []; for (let i = 0; i <= 10; i++) bord.push([-75 + 15 * i, -220 + 2.5 * Math.sin(i * 2.1)]);
    pc([[-75, 0], [75, 0], [76, -110]].concat(bord.reverse(), [[-76, -110]]), '#ede4cc', () => {
      const R = M.rng(61); for (let i = 0; i < 70; i++) { const x = lerp(-74, 74, R()), y = lerp(-218, -2, R()), a = R() * PI; strokePts([[x, y], [x + Math.cos(a) * 7, y + Math.sin(a) * 7]], 'rgba(150,130,90,0.35)', 0.8); }
      if (en > 0.01) {
        const mot = o.motifs || ['cerisier', 'grue', 'lune', 'pin'];
        for (let i = 0; i < 4; i++) {
          const cx = i % 2 ? 36 : -36, cy = i < 2 ? -164 : -56;
          if (SIL()) continue;
          c.save(); c.globalAlpha = clamp(en * 1.6 - i * 0.12); c.translate(cx, cy); c.scale(0.8, 0.8);
          fillPts(rrect(-36, -60, 36, 60, 4), '#a8342a', 0, 0); fillPts(rrect(-32, -56, 32, 56, 3), '#efe4cc', 0, 0);
          c.save(); M.path(rrect(-32, -56, 32, 56, 3), 0, 0); c.clip(); MOTIFS[mot[i % mot.length]](); c.restore();
          c.restore();
        }
      }
      shade(-75, -220, 75, 0, 0.12, [-80, -230, 80, 0]);
    }, 8401, { texA: 0.6 });
    c.restore();
  }
  // ---------------- manette (gris clair, deux poignées, boutons ronds de couleur, aucune marque) : origine = centre ; ≈ 124 × 70 à s 1
  function drawManette(o) {
    const t = o.t || 0, joue = clamp(o.joue || 0);
    const corps = [[-34, -22], [34, -22], [52, -16], [62, 4], [62, 24], [54, 36], [42, 36], [30, 22], [-30, 22], [-42, 36], [-54, 36], [-62, 24], [-62, 4], [-52, -16]];
    pc(corps, '#c9cbca', () => {
      fillPts([[-30, 22], [30, 22], [26, 10], [-26, 10]], '#b5b7b6', 0, 0);
      strokePts([[-50, -14], [50, -14]], 'rgba(255,255,255,0.5)', 1.6); hatch(null, 0.7, 4, 0.12);
      fillPts([[-46, -6], [-40, -6], [-40, -12], [-34, -12], [-34, -6], [-28, -6], [-28, 0], [-34, 0], [-34, 6], [-40, 6], [-40, 0], [-46, 0]], '#3a3c40', 0, 0);   // croix
      const B = [[38, -12, '#c0392e'], [48, -3, '#3a6ab0'], [28, -3, '#4f8a4a'], [38, 6, '#d8b030']];
      B.forEach(([x, y, col], i) => { const on = joue > 0 && Math.sin(t * 9 + i * 1.7) > 0.6; dot(x, y + (on ? 0.8 : 0), 4.6, col); dot(x - 1.4, y - 1.4, 1.4, on ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)'); });
      for (const x of [-14, 14]) { dot(x + (joue ? 2 * Math.sin(t * 6 + x) : 0), 12, 7, '#2e3034'); dot(x, 12, 4.4, '#45484c'); }
      dot(-6, -12, 2, '#8a8c8e'); dot(6, -12, 2, '#8a8c8e');
    }, 8501, { texA: 0.3 });
  }
  function drawConsole(o) {
    const t = o.t || 0;
    pc(rrect(-50, -26, 50, 0, 4), '#2b2d31', () => { fillPts(box(-50, -26, 50, -21), '#3c3f44', 0, 0); strokePts([[-40, -12], [10, -12]], 'rgba(255,255,255,0.12)', 2); }, 8502);
    if (!SIL()) { const a = 0.55 + 0.45 * Math.sin(M.tg(t) * 2.2); dot(36, -12, 2.6, `rgba(90,200,230,${a})`); }
  }
  // ---------------- télévision à écran plat (pied central) : origine = bas du pied ; écran 210 × 120 à s 1 ; o : allume 0..1, jeu 0..1, t
  function ecranJeu(o, x0, y0, x1, y1) {
    const al = clamp(o.allume == null ? 1 : o.allume), c = cx_(); if (al <= 0 || SIL()) return;
    const t = M.tg(o.t || 0), off = (o.jeu == null ? (t * 0.06) % 1 : o.jeu) * 700;
    c.save(); M.path(box(x0, y0, x1, y1), 0, 0); c.clip(); c.globalAlpha = al;
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#3f86b0'); g.addColorStop(0.65, '#5fb0c4'); g.addColorStop(1, '#4f9a6a'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let k = -1; k < 4; k++) { const cx = x0 + ((k * 120 - off * 0.4) % 480 + 480) % 480 - 60; fillPts(ell(cx, y0 + 26, 22, 8, 10), 'rgba(255,255,255,0.75)', 0, 0); }
    for (let k = -1; k < 5; k++) { const cx = x0 + ((k * 90 - off * 0.8) % 450 + 450) % 450 - 40; fillPts(ep(cx, y1 + 6, 52, 40, 12, PI, TAU), k % 2 ? '#3f8a4a' : '#57a050', 0, 0); }
    fillPts(box(x0, y1 - 12, x1, y1), '#8a5a30', 0, 0); for (let x = x0 - (off % 16); x < x1; x += 16) strokePts([[x, y1 - 12], [x, y1]], 'rgba(40,20,10,0.5)', 1);
    for (let k = 0; k < 6; k++) { const bx = x0 + ((k * 70 + 30 - off) % 420 + 420) % 420 - 20, by = y0 + 50 + (k % 2) * 14; fillPts(box(bx, by, bx + 14, by + 14), k % 3 ? '#c9822a' : '#d8b030', 0, 0); strokePts(box(bx, by, bx + 14, by + 14), 'rgba(60,30,10,0.6)', 1, true); }
    const ju = Math.abs(Math.sin(t * 3.2)) * 22, px = (x0 + x1) / 2 - 30, py = y1 - 12 - ju;                     // petit personnage-bloc
    fillPts(box(px - 6, py - 22, px + 6, py - 10), '#c0392e', 0, 0); fillPts(box(px - 7, py - 10, px + 7, py), '#3a5aa0', 0, 0); fillPts(box(px - 5, py - 30, px + 5, py - 22), '#f0d0b0', 0, 0);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(160,220,255,${0.08 + 0.05 * Math.sin(t * 7)})`; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.restore();
  }
  function drawTele(o) {
    pc([[-56, -8, 1], [56, -8, 1], [60, 0, 1], [-60, 0, 1]], '#1c1d20', null, 8601);
    pc(box(-8, -40, 8, -8), '#24262a', null, 8602);
    pc(rrect(-108, -164, 108, -36, 3), '#121316', () => {
      fillPts(box(-103, -159, 103, -41), '#0b0c0e', 0, 0);
      strokePts([[-96, -152], [-40, -152]], 'rgba(255,255,255,0.12)', 2);
    }, 8603, { texA: 0.15 });
    ecranJeu(o, -103, -159, 103, -41);
    if (!SIL() && (o.allume == null || o.allume > 0)) strokePts([[-90, -150], [-60, -150]], 'rgba(255,255,255,0.18)', 2);
  }
  NIN.ecranJeu = ecranJeu;

  // ---------------- registre : grip = point de prise (la main l'entoure) ; p2 = seconde prise (deuxMains) ; pts = points nommés ; base = point posé
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, nom, o) => { const v = ob.pts[nom]; return typeof v === 'function' ? v(o) : v; };
  const OBJ = {
    carte: { draw: drawCarte, grip: [0, 50], pts: { centre: [0, 0], haut: [0, -64], bas: [0, 64] }, base: [0, 64] },
    carteOcc: { draw: drawCarteOcc, grip: [0, 28], pts: { centre: [0, 0], haut: [0, -37], bas: [0, 37] }, base: [0, 37] },
    eventail: { draw: drawEventail, grip: [0, 0], pts: { centre: (o) => [0, o.occ ? -30 : -46], haut: (o) => [0, o.occ ? -67 : -110] }, base: [0, 0] },
    tas: { draw: drawTas, grip: [0, -20], pts: { dessus: (o) => [0, -14 - 2.3 * (o.n || 12)] }, base: [0, 0] },
    boite: { draw: drawBoite, grip: [BX - 6, -BH / 2], p2: () => [-BX + 44, -10], pts: { centre: [0, -BH / 2], dessus: [0, -BH - BD], dedans: [6, -BH - 8] }, base: [0, 0] },
    planche: { draw: drawPlanche, grip: (o) => (o.vue === 'dessus' ? [70, -200] : [22, -40]), p2: (o) => (o.vue === 'dessus' ? [-70, -200] : [-22, -40]), pts: { dessous: [0, 0], centre: (o) => (o.vue === 'dessus' ? [0, -115] : [0, -15]) }, base: [0, 0] },
    feuille: { draw: drawFeuille, grip: [66, -212], p2: () => [-66, -212], pts: { centre: [0, -110], bas: [0, 0] }, base: [0, 0] },
    manette: { draw: drawManette, grip: [46, 26], p2: () => [-46, 26], pts: { centre: [0, 0] }, base: [0, 36] },
    console: { draw: drawConsole, grip: [0, -13], pts: { lumiere: [36, -12] }, base: [0, 0] },
    tele: { draw: drawTele, grip: [0, -100], pts: { ecran: [0, -100] }, base: [0, 0] },
    libre: { draw: (o) => { if (o.draw) o.draw(o); }, grip: (o) => o.grip || [0, 0], p2: (o) => o.p2 || [0, 0], pts: {}, base: [0, 0] },
  };
  NIN.OBJ = OBJ;
  const HELD = { carte: { k: 1 }, boite: { k: 1 }, eventail: { k: 0.7 }, feuille: { k: 0.85 } };
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, HELD[name] || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), k = oo.k || 1;
    c.save(); c.scale(k, k); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran
  NIN.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ptOf(ob, nom, oo), k = oo.k || 1;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };
  // objet droit à l'écran, seconde main sur la seconde prise
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = !!q._deuxL;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2 && !has(q.tenuB)) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), k = oo.k || 1;
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).scale(k, k).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)), q.pickB || 'bas');
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
    r.main = r.w('armF_lo', 4, 96); r.mainB = r.w('armB_lo', 4, 96);
    return r;
  }
  // tenir un objet : la main avant va sur T (repère du torse) ; l'objet garde l'angle écran th
  function tenirA(q, T, th, pick, k) { armTo(q, 'armF', T, pick || 'bas', k == null ? 1 : k); q.droit = true; q.ang.objet = th || 0; }

  // ---------------- accessoires seuls — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
    const r = M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.name = name; r.o = o; return r;
  }
  // (x,y) : carte / carteOcc = milieu du bord inférieur ; eventail = pivot (prise) ; tas, boite, planche, feuille, console, tele = milieu du bas ; manette = bas des poignées
  NIN.carte = (x, y, s, o) => acc('carte', x, y, s, o, 1);
  NIN.carteOcc = (x, y, s, o) => acc('carteOcc', x, y, s, o, 1);
  NIN.eventail = (x, y, s, o) => acc('eventail', x, y, s, o, 1);
  NIN.tas = (x, y, s, o) => acc('tas', x, y, s, o, 0.6);
  NIN.boite = (x, y, s, o) => acc('boite', x, y, s, o, 1);
  NIN.planche = (x, y, s, o) => acc('planche', x, y, s, o, 1);
  NIN.feuille = (x, y, s, o) => acc('feuille', x, y, s, o, 1);
  NIN.manette = (x, y, s, o) => acc('manette', x, y, s, o, 1);
  NIN.console = (x, y, s, o) => acc('console', x, y, s, o, 1);
  NIN.tele = (x, y, s, o) => acc('tele', x, y, s, o, 1);
  NIN.accPt = (r, nom) => { const ob = OBJ[r.name], q = ob && ptOf(ob, nom, r.o || {}); if (!q) return null; return r.w('o', q[0] - ob.base[0], q[1] - ob.base[1]); };
  // cartes occidentales éparpillées sur une table : (x, y) = centre, y = dessus de la table ; o : n (8), largeur (160), seed, couche (0,55)
  NIN.cartesOcc = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const n = o.n || 8, L = o.largeur || 160, R = M.rng(o.seed || 31), ens = ['coeur', 'pique', 'roi'];
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1), xx = x + (u - 0.5) * L * s + (R() - 0.5) * 14 * s, face = R() < 0.75 ? 1 : 0;
      acc('carteOcc', xx, y - R() * 3 * s, s, { enseigne: ens[Math.floor(R() * 3)], face, couche: o.couche == null ? 0.55 : o.couche, rot: (R() - 0.5) * 0.5, cast: o.cast });
    }
  };

  // =====================================================================
  // PIÈCES COMMUNES DES MARIONNETTES
  // =====================================================================
  function upDef(at, base, seed, paint, wt, wTop) {
    return { parent: 'torso', at, pts: armR(LA, wt, wTop), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) };
  }
  // avant-bras : manche jusqu'à y = finManche, puis peau (ou gant) ; revers facultatif
  function foreDef(back, skin, seed, manche, finManche, revers) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(hk(p)), base: skin, seed, paint: (p) => {
      if (manche && finManche > -20) fillPts([[-30, -30, 1], [30, -30, 1], [30, finManche, 1], [-30, finManche, 1]], manche);
      if (revers) fillPts([[-30, finManche - 10, 1], [30, finManche - 10, 1], [30, finManche + 2, 1], [-30, finManche + 2, 1]], revers);
      handPaintK(hk(p));
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.2);
    } };
  }
  // jambe à articulation ronde (hanche au rivet), pied pointé vers +x, semelle à y = L
  function legShape(L, wt, wb, toe) {
    toe = toe || 36;
    return ep(0, 0, wt, wt * 0.9, 8, PI, TAU).concat([[wt + 1, L * 0.22], [wt - 1, L * 0.48], [wb + 2, L * 0.78], [wb, L - 24], [wb + 8, L - 16], [wb + toe * 0.7, L - 11], [wb + toe, L - 4, 1], [wb + toe - 2, L, 1], [-wb - 4, L, 1], [-wb - 6, L - 14], [-wb - 1, L - 28], [-wb - 3, L * 0.78], [-wt + 3, L * 0.48], [-wt - 1, L * 0.22]]);
  }
  const zori = (L, col) => { fillPts(box(-30, L - 5, 70, L + 4), col || '#c8b07a'); strokePts([[14, L - 14], [30, L - 9], [40, L - 5]], '#1a1616', 2); };
  // jambes repliées (assis) : pièce enfant du torse, à la hanche ; mode 'tailleur' | 'seiza' | 'genou' (agenouillé droit)
  const PLIE = {
    tailleur: [[-40, -10], [-10, -18], [40, -16], [92, -10], [120, 4], [124, 22, 1], [104, 34], [40, 36], [-34, 36, 1], [-44, 20]],
    seiza: [[-36, -12], [30, -14], [96, -6], [122, 10], [126, 34, 1], [40, 40, 1], [-46, 40, 1], [-58, 30], [-50, 8]],
    genou: [[-24, -12], [26, -14], [30, 50], [34, 114], [38, 130, 1], [-78, 132, 1], [-82, 120], [-32, 110], [-28, 50]],
  };
  const PLIE_H = { tailleur: 54, seiza: 40, genou: 132 };     // hauteur de la hanche au-dessus du sol (unités ; tailleur : coussin compris)
  function plieDef(seed, tissu, peau, motif) {
    return { parent: 'torso', at: [0, -2], noRivet: true, base: tissu, seed, pts: (p) => (p._plie ? PLIE[p._plie] : OFFP), paint: (p) => {
      const m = p._plie;
      if (motif) motif(m);
      if (m === 'tailleur') { fillPts(ell(92, 24, 16, 9, 10), peau, 0, 0); fillPts(ell(60, 30, 14, 7, 10), peau, 0, 0); strokePts([[-30, 6], [60, 4], [116, 14]], 'rgba(30,20,10,0.4)', 1.4); }
      if (m === 'seiza') { fillPts(ell(-46, 32, 12, 8, 10), peau, 0, 0); strokePts([[-30, 10], [70, 8], [118, 22]], 'rgba(30,20,10,0.4)', 1.4); }
      if (m === 'genou') { fillPts([[-82, 120], [-60, 112], [-56, 132], [-82, 132]], peau, 0, 0); strokePts([[30, 112], [-60, 116]], 'rgba(30,20,10,0.4)', 1.4); }
      hatch(null, 0.7, 4, 0.22); shade(0, -10, 0, 40, 0.2, [-90, -20, 130, 140]);
    } };
  }
  function coussinDef(seed, col) {
    return { parent: 'torso', at: [14, 36], noRivet: true, base: col, seed, pts: (p) => (p._plie === 'tailleur' && p.coussin !== false ? [[-82, -2], [84, -4], [92, 8], [86, 20, 1], [-84, 20, 1], [-90, 8]] : OFFP),
      paint: () => { strokePts([[-80, 2], [86, 0]], 'rgba(255,255,255,0.2)', 1.4); dot(0, 8, 2.4, 'rgba(0,0,0,0.4)'); hatch(null, 0.3, 4, 0.2); } };
  }
  // applique une position assise : mode, hauteur de jambe H ; cache les jambes
  function asseoir(q, mode, H) {
    q._plie = mode; q.hide.legF = 1; q.hide.legB = 1;
    q.dy = (q.dy || 0) + H - PLIE_H[mode];
  }
  const ORD = (o) => ['armB_up'].concat(o.mancheB ? ['mancheB'] : [], ['armB_lo', 'objetB'], o.avant || [], o.legs || ['legB', 'legF'], ['head'], o.heads || [], ['torso'], o.apres || [], ['armF_up'], o.mancheF ? ['mancheF'] : [], ['armF_lo', 'objet', 'doigts', 'doigtsB'], o.fin || []);
  // geste générique « main avant vers la cible » (pose.cible écran) quand aucun geste ne l'occupe
  function cibleLibre(q, occupe) { if (q.cibleL && !occupe) { armTo(q, 'armF', q.cibleL, 'bas', 1); if (!has(q.tenu) && !q.handF) q.handF = 'paume'; } }

  // =====================================================================
  // FUSAJIRO YAMAUCHI (1889, ≈ 30 ans) — cheveux noirs courts à l'occidentale (ère Meiji), fine moustache, sourcils marqués ;
  // kimono court indigo, tablier de travail brun tabac noué à la taille, hakama gris ardoise, tabi ivoire et zori ; hachimaki ivoire noué sur le côté
  // =====================================================================
  const YA = { peau: '#dcb48e', peauD: '#c09670', kimono: '#2F3E5C', kimonoD: '#24304a', juban: '#e8dfc8', tablier: '#6B4A2E', tablierD: '#57391f', hakama: '#5C6470', hakamaD: '#4b525c', tabi: '#ece4d0', cheveux: '#161313', bandeau: '#E8DFC8' };
  const YA_TORSO = [[-12, -178], [10, -182], [20, -170], [30, -150], [34, -114], [33, -70], [34, -40], [38, 0], [41, 40], [43, 70, 1], [-6, 72, 1], [-10, 46], [-38, 44, 1], [-38, 0], [-35, -60], [-35, -110], [-35, -148], [-24, -170]];
  const YA_HEAD = [[-13, 16], [9, 16], [10, 2], [14, -5], [21, -10], [25, -16], [24, -21], [26, -25], [25, -29], [29, -34], [36, -41, 1], [31, -47], [28, -56], [28, -64], [25, -78], [13, -91], [-6, -96], [-24, -87], [-32, -68], [-31, -46], [-24, -28], [-17, -8]];
  const YA_HAIR = [[27, -66], [27, -80], [18, -96], [-2, -104], [-24, -98], [-36, -80], [-37, -58], [-34, -38], [-27, -34], [-22, -50], [-14, -60], [-2, -66], [12, -71], [20, -64]];
  const YA_LEG = ep(0, 0, 24, 22, 8, PI, TAU).concat([[27, 40], [31, 110], [35, 170], [37, 204, 1], [20, 207], [22, 216], [42, 224], [48, 233, 1], [46, 238, 1], [-16, 238, 1], [-18, 224], [-17, 207], [-36, 204, 1], [-32, 150], [-28, 80], [-25, 30]]);
  const MANCHE = [[-10, 12], [-26, 22], [-31, 62], [-26, 86], [-10, 90], [-6, 50]];
  function mkYamauchi() {
    const legP = (back) => () => {
      for (const x of [-14, -2, 10, 22]) strokePts([[x * 0.8, -6], [x * 1.25, 204]], back ? 'rgba(20,24,30,0.45)' : 'rgba(30,34,40,0.4)', 1.2);
      fillPts(box(-22, 205, 54, 234), back ? '#d6cdb6' : YA.tabi); strokePts([[18, 214], [20, 232]], 'rgba(120,110,90,0.6)', 1);
      zori(238);
      hatch(back ? null : [[-30, -10], [-10, -10], [-12, 204], [-34, 204]], 0.8, 3.8, back ? 0.3 : 0.22);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: YA_TORSO, base: YA.kimono, seed: 9001, paint: () => {
        fillPts([[-40, -42], [2, -44], [-4, 72], [-40, 46]], YA.hakama);                                         // haut du hakama (côté dos)
        for (const x of [-30, -18]) strokePts([[x, -40], [x - 2, 46]], 'rgba(30,34,40,0.4)', 1.1);
        fillPts(ribbon([[-2, -184], [12, -160], [24, -126], [30, -104]], 9, 7), YA.juban);                       // col croisé : sous-kimono ivoire
        fillPts(ribbon([[6, -186], [20, -160], [30, -128], [34, -108]], 7, 6), YA.kimonoD);
        strokePts([[30, -104], [18, -60], [10, -44]], 'rgba(10,14,24,0.6)', 1.4);
        // tablier brun tabac noué à la taille (cordon qui fait le tour, nœud dans le dos)
        fillPts([[2, -52], [35, -54], [38, 0], [41, 40], [43, 70], [-4, 72], [-6, 0]], YA.tablier);
        strokePts([[10, -40], [14, 66]], 'rgba(30,18,8,0.35)', 1.2); strokePts([[26, -40], [32, 66]], 'rgba(30,18,8,0.3)', 1.2);
        fillPts(box(-38, -56, 36, -48), YA.tablierD);
        fillPts([[-38, -54], [-52, -64], [-50, -46]], YA.tablierD); fillPts([[-38, -52], [-48, -30], [-42, -28]], YA.tablierD);
        fillPts(box(8, -14, 28, 10), YA.tablierD); strokePts([[8, -14], [28, -14]], 'rgba(20,10,4,0.6)', 1);  // poche à outils
        strokePts([[14, -20], [16, -8]], '#c9a24a', 2);                                                            // manche de gouge
        hatch([[-50, -170], [-12, -170], [-8, 72], [-50, 72]], 0.75, 4.2, 0.28);
        shade(36, 0, -34, 0, 0.26);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: YA_LEG, base: YA.hakamaD, seed: 9002, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [6, -2], pts: YA_LEG, base: YA.hakama, seed: 9003, paint: legP(false) },
      armB_up: upDef([-10, -146], YA.kimonoD, 9004, () => hatch(null, 0.9, 3.8, 0.3), 17, 18),
      mancheB: { parent: 'armB_up', at: [0, 0], pts: MANCHE, base: YA.kimonoD, seed: 9005, noRivet: true, paint: () => hatch(null, 0.9, 3.6, 0.3) },
      armB_lo: foreDef(true, YA.peauD, 9006, YA.kimonoD, 24),
      head: { parent: 'torso', at: [6, -170], pts: YA_HEAD, base: YA.peau, seed: 9007, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(14, -32, 8, 'rgba(205,130,110,0.18)');
        X.eye(f, 16, -52); X.brow(f, 16, -61, 'rgba(18,14,14,1)', 3.6);
        X.mouth(f, 24, -24);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: YA_HAIR, base: YA.cheveux, seed: 9008, noRivet: true, paint: () => {
        for (let k = 0; k < 5; k++) strokePts(qbez([22 - k * 4, -70 + k], [0, -98 + k * 4], [-30 + k * 2, -84 + k * 6], 8), 'rgba(120,110,110,0.35)', 1);
        strokePts([[14, -98], [-14, -100]], 'rgba(200,190,180,0.35)', 1.2);                                        // raie de côté
      } },
      moustache: { parent: 'head', at: [0, 0], pts: [[19, -30], [27, -33], [33, -32], [34, -29], [28, -28], [21, -27]], base: YA.cheveux, seed: 9009, noRivet: true },
      bandeau: { parent: 'head', at: [0, 0], pts: (p) => (p.bandeau === false ? OFFP : [[30, -66], [28, -76], [0, -84], [-32, -82], [-40, -74], [-38, -66], [-6, -72]]), base: YA.bandeau, seed: 9010, noRivet: true,
        paint: () => { strokePts([[28, -70], [-38, -78]], 'rgba(120,110,90,0.5)', 1); hatch(null, 0.3, 4, 0.15); } },
      noeud: { parent: 'head', at: [-38, -72], pts: (p) => (p.bandeau === false ? OFFP : [[2, -6], [-10, -12], [-13, -6], [-4, -1], [-11, 10], [-7, 13], [3, 3]]), base: YA.bandeau, seed: 9011, noRivet: true,
        paint: () => strokePts([[0, -2], [-10, 10]], 'rgba(120,110,90,0.5)', 1) },
      armF_up: upDef([-2, -146], YA.kimono, 9012, () => hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.26), 17, 18),
      mancheF: { parent: 'armF_up', at: [0, 0], pts: MANCHE, base: YA.kimono, seed: 9013, noRivet: true, paint: () => { strokePts([[-26, 24], [-29, 80]], 'rgba(255,255,255,0.12)', 1.4); hatch(null, 0.9, 3.6, 0.24); } },
      armF_lo: foreDef(false, YA.peau, 9014, YA.kimono, 24),
    };
    Object.assign(parts, heldParts(YA.peau, 9020));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-24, 18] }, nom: 'Yamauchi',
      order: ORD({ mancheB: 1, mancheF: 1, heads: ['cheveux', 'moustache', 'bandeau', 'noeud'] }) };
  }
  CH.ninYamauchi = mkYamauchi();
  // gestes : marche, presse (+appui, cible), feuille, noren (+cible), tend (boîte), salut
  NIN.yamauchiPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face;
    const pr = kv(q, 'presse'), fe = kv(q, 'feuille'), no = kv(q, 'noren'), te = kv(q, 'tend'), sa = kv(q, 'salut');
    if (pr > 0 && !has(q.tenu)) { q.tenu = 'planche'; q.tenuO = Object.assign({ vue: 'cote' }, q.tenuO); }
    if (fe > 0) q.tenu = 'feuille';
    if (te > 0 && !has(q.tenu)) q.tenu = 'boite';
    marcher(q, 1.7, 0.3, 4, { F: !has(q.tenu) && !no && !sa, B: !has(q.tenuB) && !has(q.tenu) && !no && !sa });
    const occupe = pr || fe || no || te || sa;
    if (pr > 0) {
      const ap = clamp(q.appui || 0), L = q.cibleL || [120, -44];
      plier(q, (0.16 + 0.08 * ap) * pr); tenirA(q, [L[0], L[1] + 8 * ap], 0, 'bas', pr); q.deuxMains = true;
      A.head = (A.head || 0) + 0.28 * pr; if (!f.brow) f.brow = 'frown';
    }
    if (fe > 0) { const L = q.cibleL || [172, -160]; tenirA(q, L, 0, 'bas', fe); q.deuxMains = true; A.head = (A.head || 0) - 0.04 * fe; if (!f.mouth) f.mouth = 'smile'; }
    if (no > 0) {
      const L = q.cibleL || [56, -318];
      armTo(q, 'armF', L, 'avant', no); armTo(q, 'armB', [L[0] - 30, L[1] - 2], 'avant', no);
      A.head = (A.head || 0) - 0.3 * no; if (no > 0.5) { q.handF = q.handF || 'fist'; q.handB = q.handB || 'fist'; }
    }
    if (te > 0) { const L = q.cibleL || [150, -84]; plier(q, 0.06 * te); tenirA(q, L, 0, 'bas', te); q.deuxMains = true; if (!f.mouth) f.mouth = 'smile'; }
    if (sa > 0) {
      plier(q, 0.5 * sa); A.head = (A.head || 0) + 0.3 * sa;
      armTo(q, 'armF', [30, 40], 'bas', sa); armTo(q, 'armB', [20, 44], 'bas', sa); if (sa > 0.5) { q.handF = 'open'; q.handB = 'open'; }
      if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'smile';
    }
    cibleLibre(q, occupe);
    return finish(q);
  };
  NIN.yamauchi = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; return run(CH.ninYamauchi, avecCible(CH.ninYamauchi, NIN.yamauchiPose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // LE POLICIER MEIJI — vareuse bleu nuit très foncé à brandebourgs noirs, pantalon à bande ivoire, képi bas à bandeau ivoire et visière noire,
  // gants blancs, grosse moustache noire tombante, sabre au fourreau (JAMAIS tiré), sac de saisie en toile ocre en bandoulière
  // =====================================================================
  const PO = { peau: '#d8b089', peauD: '#bd9470', vareuse: '#1E2433', vareuseD: '#161b27', vareuseL: '#2c3446', bande: '#e3dac2', gant: '#f2efe6', gantD: '#d9d5ca', botte: '#121012', moust: '#141112', sac: '#A8823F', sacD: '#8a6a30', sacL: '#c09a52', fourreau: '#0f0d0e', laiton: '#b08d45' };
  const PO_TORSO = [[-14, -178], [10, -182], [22, -172], [34, -150], [40, -118], [40, -80], [38, -40], [36, -8], [40, 30], [42, 62, 1], [-40, 64, 1], [-40, 30], [-38, -10], [-40, -70], [-42, -118], [-40, -150], [-28, -172]];
  const PO_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -5], [23, -9], [28, -15], [27, -20], [29, -24], [28, -28], [33, -33], [41, -40, 1], [34, -48], [30, -57], [30, -64], [26, -78], [14, -91], [-6, -96], [-24, -88], [-33, -68], [-32, -46], [-25, -28], [-18, -8]];
  const PO_KEPI = [[-36, 10], [-36, -36], [-31, -48, 1], [26, -54, 1], [33, -42], [31, 0], [50, 6], [60, 12, 1], [54, 17], [30, 13]];
  const PO_MOUST = [[16, -31], [28, -36], [38, -34], [42, -28], [41, -16], [37, -6], [33, -14], [30, -22], [24, -24], [14, -20], [8, -12], [6, -20], [10, -27]];
  function sacPts(p) { const f = clamp(p.sac || 0), w = 22 + 10 * f, h = 46 + 16 * f; return [[-w, -4], [w, -4], [w + 4, h * 0.6], [w - 2, h, 1], [-w + 2, h, 1], [-w - 4, h * 0.6]]; }
  function mkPolicier() {
    const legP = (back) => () => {
      strokePts([[-2, -6], [-1, 200]], PO.bande, 3.4);
      fillPts([[-40, 190, 1], [60, 190, 1], [60, 260, 1], [-40, 260, 1]], PO.botte);
      if (!back) { strokePts([[18, 226], [42, 230]], 'rgba(255,255,255,0.3)', 1.4); strokePts([[-14, 196], [-14, 214]], 'rgba(255,255,255,0.18)', 2); hatch([[-26, -20], [-8, -20], [-8, 190], [-26, 190]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
    };
    const parts = {
      sabre: { parent: 'torso', at: [-24, -4], rest: 0.6, pts: [[-5, -8], [5, -8], [6, 176], [0, 192, 1], [-6, 176]], base: PO.fourreau, seed: 9101, noRivet: true,
        paint: () => { fillPts(box(-7, 160, 7, 192), PO.laiton); fillPts(box(-7, 40, 7, 50), PO.laiton); strokePts([[-2, 0], [-2, 150]], 'rgba(255,255,255,0.22)', 1.2); } },
      torso: { parent: null, at: [0, 0], pts: PO_TORSO, base: PO.vareuse, seed: 9102, paint: () => {
        fillPts([[-6, -184], [12, -184], [22, -172], [20, -160], [-8, -160]], PO.vareuseL);                       // col droit
        strokePts([[-6, -162], [20, -162]], PO.bande, 1.4);
        for (const y of [-140, -122, -104, -86, -68]) {                                                           // brandebourgs noirs
          strokePts([[6, y], [36, y - 1]], '#050506', 3.4); dot(6, y, 3, '#050506'); dot(37, y - 1, 2.6, '#050506');
          strokePts([[8, y - 3], [34, y - 4]], 'rgba(255,255,255,0.12)', 1);
        }
        fillPts(box(-42, -20, 44, -9), '#08080a'); fillPts(box(22, -22, 32, -7), PO.laiton);                       // ceinturon
        strokePts([[36, -8], [40, 60]], 'rgba(0,0,0,0.5)', 1.4);
        fillPts(ribbon([[-30, -154], [8, -86], [30, -16]], 11, 11), PO.sacD);                                    // bandoulière du sac
        strokePts([[-26, -154], [32, -18]], 'rgba(255,230,180,0.25)', 1);
        hatch([[-52, -172], [-14, -172], [-10, 64], [-52, 64]], 0.75, 4.2, 0.3);
        shade(38, 0, -36, 0, 0.3);
      } },
      sac: { parent: 'torso', at: [24, -8], pts: sacPts, base: PO.sac, seed: 9103, noRivet: true, paint: (p) => {
        const f = clamp(p.sac || 0), w = 22 + 10 * f, ou = clamp(p.ouvert || 0);
        if (ou > 0.05) fillPts([[-w + 4, -4], [w - 4, -4], [w - 8, 8 * ou], [-w + 8, 8 * ou]], '#2a1e10');
        for (let k = 0; k < 3 + 4 * f; k++) if (f > 0.15) dot(-w + 10 + hash(k * 3.1) * (2 * w - 20), 20 + hash(k * 5.3) * 30 * f, 3 + 2 * f, k % 2 ? '#d8ccae' : '#8E2B22');   // bosses (cartes saisies)
        strokePts([[-w, 12], [w, 12]], 'rgba(60,40,10,0.4)', 1); hatch(null, 0.5, 3.4, 0.28); shade(-w, 0, w, 0, 0.2, [-60, -10, 60, 80]);
      } },
      rabat: { parent: 'sac', at: [0, -4], pts: (p) => { const f = clamp(p.sac || 0), w = 24 + 10 * f; return [[-w, -2], [w, -2], [w - 2, 22], [0, 28, 1], [-w + 2, 22]]; }, base: PO.sacD, seed: 9104, noRivet: true,
        rest: 0, paint: () => { dot(0, 20, 3, PO.laiton); strokePts([[-20, 2], [20, 2]], 'rgba(255,230,180,0.3)', 1); } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(1.0), base: PO.vareuseD, seed: 9105, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(1.0), base: PO.vareuse, seed: 9106, paint: legP(false) },
      armB_up: upDef([-10, -146], PO.vareuseD, 9107, () => hatch(null, 0.9, 3.8, 0.3), 15),
      armB_lo: foreDef(true, PO.gantD, 9108, PO.vareuseD, 70, '#050506'),
      head: { parent: 'torso', at: [6, -170], pts: PO_HEAD, base: PO.peau, seed: 9109, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-34, -66], [-12, -64], [-14, -40], [-24, -26], [-33, -40]], '#161313', 4);                      // cheveux ras sous le képi
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        X.eye(f, 18, -52); fillPts([[8, -62], [24, -66], [30, -62], [24, -58], [10, -58]], '#141112', 0, 0.3);     // sourcil broussailleux
        if (f.brow === 'frown') strokePts([[12, -60], [28, -56]], '#141112', 2.6);
        X.mouth(f, 28, -18);
      } },
      moustache: { parent: 'head', at: [0, 0], pts: PO_MOUST, base: PO.moust, seed: 9110, noRivet: true, paint: () => { for (let x = 14; x < 40; x += 5) strokePts([[x, -32], [x + 2, -16]], 'rgba(255,255,255,0.12)', 0.8); } },
      kepi: { parent: 'head', at: [-2, -72], rest: -0.06, pts: PO_KEPI, base: PO.vareuse, seed: 9111, noRivet: true, paint: () => {
        fillPts(box(-38, -10, 34, 4), PO.bande); strokePts([[-36, -10], [32, -10]], 'rgba(0,0,0,0.4)', 1);
        strokePts([[-32, -46], [26, -52]], 'rgba(255,255,255,0.18)', 1.6);
        fillPts([[30, 0], [50, 6], [60, 12], [54, 17], [30, 13]], '#050506'); strokePts([[34, 4], [54, 10]], 'rgba(255,255,255,0.3)', 1.2);
        dot(26, -3, 2.6, PO.laiton);
        hatch(null, 0.5, 3.4, 0.24);
      } },
      poignee: { parent: 'torso', at: [-24, -4], rest: 0.6, pts: [[-4, -10], [4, -10], [4, -60], [0, -66, 1], [-4, -60]], base: '#2a2224', seed: 9112, noRivet: true,
        paint: () => { for (let y = -58; y < -12; y += 6) strokePts([[-4, y], [4, y + 3]], 'rgba(230,220,200,0.5)', 1); }, extra: () => { fillPts(ell(0, -10, 10, 4, 10), PO.laiton); } },
      armF_up: upDef([-2, -146], PO.vareuse, 9113, () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28), 15),
      armF_lo: foreDef(false, PO.gant, 9114, PO.vareuse, 70, '#050506'),
    };
    Object.assign(parts, heldParts(PO.gant, 9120));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Policier',
      order: ORD({ heads: ['moustache', 'kepi'], legs: ['legB', 'sabre', 'legF'], apres: ['sac', 'rabat', 'poignee'] }) };
  }
  CH.ninPolicier = mkPolicier();
  // gestes : marche (raide), rafle 0..1 (+cible : point de la table d'où part le balayage), menton, carte, renifle, fenetre (+cible), sac, ouvert
  NIN.policierPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face;
    const me = kv(q, 'menton'), ca = kv(q, 'carte'), re = kv(q, 'renifle'), fe = kv(q, 'fenetre');
    const ra = q.rafle != null && q.rafle !== false ? clamp(q.rafle === true ? 1 : q.rafle) : null;
    if ((ca > 0 || re > 0) && !has(q.tenu)) { q.tenu = 'carte'; q.tenuO = Object.assign({ k: 0.75, motif: 'cerisier' }, q.tenuO); }
    marcher(q, 1.5, 0.22, 2, { F: !has(q.tenu) && ra == null && !me, B: !has(q.tenuB) }, 0.06);
    if (q.marche) q.tilt = (q.tilt || 0) - 0.025;
    if (q.ouvert == null && ra != null) q.ouvert = 1;
    if (ra != null) {
      const L0 = q.cibleL || [176, -30], B = [36, -14], u = ease(ra);
      plier(q, 0.3 * (1 - u) + 0.04);
      armTo(q, 'armF', [lerp(L0[0], B[0], u), lerp(L0[1], B[1], u) - 30 * Math.sin(PI * u)], 'bas', 1);
      q.handF = u < 0.8 ? 'bas' : 'fist';
      armTo(q, 'armB', [24, 10], 'bas', 1); q.handB = 'open';
      if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight';
    }
    if (fe > 0) {
      plier(q, 0.3 * fe); A.head = (A.head || 0) - 0.14 * fe;
      const L = q.cibleL || [128, -64]; armTo(q, 'armF', L, 'bas', fe); armTo(q, 'armB', [L[0] - 24, L[1] + 4], 'bas', fe);
      if (fe > 0.5) { q.handF = q.handF || 'bas'; q.handB = q.handB || 'bas'; } if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'frown';
    }
    if (me > 0) {
      plier(q, 0.16 * me); A.head = (A.head || 0) + 0.04 * me;
      armTo(q, 'armF', headPt(q, 24, 16), 'bas', me); if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'frown';
    }
    if (ca > 0 && !re) { A.head = (A.head || 0) + 0.06 * ca; armTo(q, 'armF', headPt(q, 88, 22), 'bas', ca); if (!f.brow) f.brow = 'up'; }
    if (re > 0) {
      A.head = (A.head || 0) - 0.26 * re; const k = (q.tenuO && q.tenuO.k) || 0.75;
      armTo(q, 'armF', headPt(q, 46, -18 + 116 * k), 'bas', re);
      if (!f.eyes) f.eyes = re > 0.5 ? 'closed' : 'half'; if (!f.mouth && re > 0.5) f.mouth = 'smile';
    }
    cibleLibre(q, ra != null || me || ca || re || fe);
    return finish(q);
  };
  NIN.policier = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; return run(CH.ninPolicier, avecCible(CH.ninPolicier, NIN.policierPose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // JOUEUR A « LE GROS » — crâne rasé brillant, sourcils épais, ventre rond, kimono rouille ouvert sur un haramaki ivoire, pipe kiseru (option)
  // =====================================================================
  const GR = { peau: '#d6a982', peauD: '#b98c66', kimono: '#8E4A2B', kimonoD: '#733a20', kimonoL: '#a65c38', hara: '#ece2c8', obi: '#3a2618', coussin: '#4a3a5a' };
  const GR_TORSO = [[-14, -178], [10, -182], [24, -172], [38, -152], [50, -122], [60, -84], [66, -46], [64, -10], [56, 18], [48, 40, 1], [-42, 42, 1], [-44, 10], [-46, -40], [-46, -100], [-44, -148], [-30, -170]];
  const GR_HEAD = [[-16, 18], [12, 18], [18, 8], [26, 0], [31, -9], [33, -16], [31, -21], [33, -25], [32, -29], [35, -34], [42, -41, 1], [36, -48], [32, -56], [32, -64], [28, -80], [14, -94], [-6, -98], [-26, -90], [-36, -70], [-36, -46], [-30, -24], [-22, -4]];
  function mkGros() {
    const legP = (back) => () => {
      fillPts(box(-40, -20, 50, 150), back ? GR.kimonoD : GR.kimono); strokePts([[-30, 148], [40, 146]], 'rgba(30,14,6,0.6)', 1.6);
      zori(238); hatch(back ? null : [[-30, -10], [-12, -10], [-12, 150], [-30, 150]], 0.8, 3.8, back ? 0.3 : 0.22);
    };
    const parts = {
      coussin: coussinDef(9201, GR.coussin),
      torso: { parent: null, at: [0, 0], pts: GR_TORSO, base: GR.kimono, seed: 9202, paint: () => {
        fillPts([[6, -182], [24, -172], [38, -152], [44, -128], [16, -104], [4, -150]], GR.peau);                  // torse nu dans l'ouverture
        strokePts([[18, -150], [28, -130]], 'rgba(150,90,60,0.4)', 1);
        fillPts([[8, -104], [48, -120], [60, -84], [66, -46], [64, -14], [6, -12]], GR.hara);                     // haramaki ivoire sur le ventre
        for (const y of [-92, -70, -48, -28]) strokePts([[10, y], [62, y - 4]], 'rgba(140,120,90,0.45)', 1);
        fillPts(ribbon([[2, -184], [16, -150], [10, -104], [4, -10]], 10, 12), GR.kimonoL);                      // bord du kimono ouvert
        fillPts(box(-46, -14, 62, -2), GR.obi);
        hatch([[-56, -170], [-14, -170], [-10, 42], [-56, 42]], 0.75, 4.2, 0.3); shade(60, -50, -30, -50, 0.28);
      } },
      plie: plieDef(9203, GR.kimono, GR.peau),
      legB: { parent: 'torso', at: [-6, -2], pts: legShape(238, 19, 13, 34), base: GR.peauD, seed: 9204, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [6, -2], pts: legShape(238, 19, 13, 34), base: GR.peau, seed: 9205, paint: legP(false) },
      armB_up: upDef([-10, -146], GR.kimonoD, 9206, () => hatch(null, 0.9, 3.8, 0.3), 19, 20),
      armB_lo: foreDef(true, GR.peauD, 9207, GR.kimonoD, 34),
      head: { parent: 'torso', at: [6, -170], pts: GR_HEAD, base: GR.peau, seed: 9208, noRivet: true, paint: (p) => {
        const f = p.face || {};
        for (let k = 0; k < 60; k++) dot(lerp(-34, 26, hash(k * 2.3)), lerp(-96, -64, hash(k * 4.1)), 0.9, 'rgba(70,60,70,0.35)');   // crâne rasé
        fillPts(ell(-2, -86, 16, 5, 10), 'rgba(255,250,235,0.5)', 0, 0);                                          // reflet du crâne
        X.earPaint(-10, -44);
        hatch([[-24, -42], [2, -30], [12, -10], [-6, 18], [-34, 4]], 0.6, 3.6, 0.28);
        dot(18, -30, 10, 'rgba(205,120,100,0.26)'); strokePts([[16, 4], [26, -2]], 'rgba(120,70,50,0.5)', 1.2);  // double menton
        X.eye(f, 18, -51);
        fillPts([[6, -60], [16, -66], [30, -64], [32, -59], [18, -59], [8, -56]], '#1a1414', 0, 0.3);               // sourcils épais
        if (f.brow === 'frown') fillPts([[18, -60], [32, -56], [30, -53]], '#1a1414', 0, 0);
        if (f.brow === 'up' || f.brow === 'worry') fillPts([[8, -66], [28, -70], [30, -66], [10, -62]], '#1a1414', 0, 0);
        X.mouth(f, 30, -22);
      } },
      pipe: { parent: 'head', at: [30, -22], rest: 0.18, pts: (p) => (p.pipe ? [[0, -2], [60, -1], [80, -2], [84, -9], [94, -9], [96, 1], [84, 4], [60, 3], [0, 3]] : OFFP), base: '#5a3a22', seed: 9209, noRivet: true,
        paint: () => { fillPts(box(-2, -3, 12, 4), PO.laiton); fillPts([[80, -2], [84, -9], [94, -9], [96, 1], [84, 4]], PO.laiton); },
        extra: (p) => {
          if (!p.pipe || SIL()) return; const t = M.tg(p.t || 0), c = cx_();
          dot(89, -9, 2.6, `rgba(230,120,50,${0.6 + 0.3 * Math.sin(t * 5)})`);
          for (let i = 0; i < 4; i++) { const u = ((t * 0.5 + i * 0.25) % 1); c.globalAlpha = 0.45 * (1 - u); fillPts(ell(89 + Math.sin(t * 2 + i) * 6 + u * 10, -14 - u * 70, 5 + u * 9, 4 + u * 6, 10), '#d8d2c6', 0, 0); }
          c.globalAlpha = 1;
        } },
      armF_up: upDef([-2, -146], GR.kimono, 9210, () => hatch([[-18, -20], [-3, -20], [-3, 100], [-18, 100]], 0.9, 3.8, 0.26), 19, 20),
      armF_lo: foreDef(false, GR.peau, 9211, GR.kimono, 34),
    };
    Object.assign(parts, heldParts(GR.peau, 9220));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Gros', H: 238,
      order: ORD({ avant: ['coussin'], heads: ['pipe'], apres: ['plie'] }) };
  }
  CH.ninGros = mkGros();

  // =====================================================================
  // JOUEUR B « LE MAIGRE » — grand et maigre, cheveux mi-longs noirs en petite queue basse, bandeau bleu ardoise, kimono à rayures vert/ocre, menton pointu
  // =====================================================================
  const MA = { peau: '#dcb894', peauD: '#bf9a76', vert: '#5E7553', vertD: '#4a5e42', ocre: '#b08a3e', cheveux: '#141112', bandeau: '#4F6478', obi: '#2e2418', coussin: '#6a4a2a' };
  const MA_TORSO = [[-12, -186], [8, -190], [16, -178], [22, -156], [25, -120], [24, -80], [24, -40], [26, -4], [28, 30, 1], [-26, 30, 1], [-26, -4], [-25, -60], [-27, -120], [-27, -156], [-20, -178]];
  const MA_HEAD = [[-12, 16], [8, 16], [9, 4], [16, 0], [26, -2, 1], [28, -8], [25, -16], [26, -22], [25, -27], [28, -32], [35, -40, 1], [29, -47], [26, -56], [26, -66], [23, -82], [12, -96], [-6, -102], [-22, -94], [-30, -74], [-30, -48], [-24, -28], [-16, -8]];
  const MA_HAIR = [[26, -70], [25, -88], [13, -103], [-8, -110], [-27, -102], [-35, -80], [-37, -50], [-35, -24], [-26, -14], [-21, -30], [-17, -52], [-6, -66], [10, -74]];
  function rayures(x0, x1, y0, y1, w) { for (let x = x0; x < x1; x += w * 2) fillPts(box(x, y0, x + w, y1), MA.ocre, 0, 0); }
  function mkMaigre() {
    const legP = (back) => () => {
      fillPts(box(-40, -20, 50, 176), back ? MA.vertD : MA.vert); if (!back) rayures(-30, 40, -20, 176, 6);
      strokePts([[-30, 174], [40, 172]], 'rgba(20,30,16,0.6)', 1.6);
      zori(258); hatch(back ? null : [[-26, -10], [-12, -10], [-12, 176], [-26, 176]], 0.8, 3.8, back ? 0.3 : 0.22);
    };
    const parts = {
      coussin: coussinDef(9301, MA.coussin),
      torso: { parent: null, at: [0, 0], pts: MA_TORSO, base: MA.vert, seed: 9302, paint: () => {
        rayures(-30, 30, -190, 32, 6);
        fillPts([[2, -190], [16, -178], [22, -150], [8, -120], [0, -160]], MA.peau);
        fillPts(ribbon([[0, -192], [12, -156], [20, -112]], 8, 9), MA.vertD);
        fillPts(box(-28, -26, 28, -12), MA.obi);
        hatch([[-36, -180], [-10, -180], [-8, 30], [-36, 30]], 0.75, 4.2, 0.28); shade(24, 0, -24, 0, 0.24);
      } },
      plie: plieDef(9303, MA.vert, MA.peau, () => rayures(-90, 130, -20, 140, 6)),
      legB: { parent: 'torso', at: [-5, -2], pts: legShape(258, 15, 10, 34), base: MA.peauD, seed: 9304, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [5, -2], pts: legShape(258, 15, 10, 34), base: MA.peau, seed: 9305, paint: legP(false) },
      armB_up: upDef([-10, -146], MA.vertD, 9306, () => { hatch(null, 0.9, 3.8, 0.3); }, 13, 14),
      armB_lo: foreDef(true, MA.peauD, 9307, MA.vertD, 30),
      head: { parent: 'torso', at: [6, -178], pts: MA_HEAD, base: MA.peau, seed: 9308, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -46);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        strokePts([[10, -24], [16, -12]], 'rgba(140,90,60,0.45)', 1.2);                                          // joue creuse
        X.eye(f, 15, -54); X.brow(f, 15, -62, 'rgba(20,16,16,0.95)', 2);
        X.mouth(f, 23, -22);
      } },
      queue: { parent: 'head', at: [-32, -26], rest: 0.25, pts: [[-6, -4], [6, -4], [8, 16], [4, 40], [0, 50, 1], [-4, 40], [-8, 16]], base: MA.cheveux, seed: 9309, noRivet: true,
        paint: () => { fillPts(box(-8, 2, 8, 8), '#8E2B22'); strokePts([[0, 10], [1, 44]], 'rgba(255,255,255,0.15)', 1); } },
      cheveux: { parent: 'head', at: [0, 0], pts: MA_HAIR, base: MA.cheveux, seed: 9310, noRivet: true, paint: () => {
        for (let k = 0; k < 5; k++) strokePts(qbez([20 - k * 4, -76], [-4, -104 + k * 3], [-32 + k, -60 + k * 8], 8), 'rgba(120,110,110,0.3)', 1);
      } },
      bandeau: { parent: 'head', at: [0, 0], pts: [[28, -68], [26, -80], [0, -91], [-32, -89], [-40, -78], [-36, -68], [-4, -76]], base: MA.bandeau, seed: 9311, noRivet: true, paint: () => hatch(null, 0.3, 4, 0.2) },
      noeud: { parent: 'head', at: [-38, -78], pts: [[2, -6], [-10, -14], [-14, -6], [-4, 0], [-10, 18], [-5, 20], [4, 4]], base: MA.bandeau, seed: 9312, noRivet: true },
      armF_up: upDef([-2, -146], MA.vert, 9313, () => { rayures(-16, 16, -20, 100, 5); hatch([[-14, -20], [-3, -20], [-3, 100], [-14, 100]], 0.9, 3.8, 0.24); }, 13, 14),
      armF_lo: foreDef(false, MA.peau, 9314, MA.vert, 30),
    };
    Object.assign(parts, heldParts(MA.peau, 9320));
    return { hipY: -258, parts, handLen: 100, rod: { part: 'torso', at: [-22, 18] }, nom: 'Maigre', H: 258,
      order: ORD({ avant: ['coussin', 'queue'], heads: ['cheveux', 'bandeau', 'noeud'], apres: ['plie'] }) };
  }
  CH.ninMaigre = mkMaigre();

  // gestes des joueurs (A et B) : assis 'tailleur' | 'seiza' (true = tailleur pour A, seiza pour B) ; leve 0..1 (se lever par étapes : 0–0,34 assis
  // et mains aux genoux, 0,34–0,67 à genoux dressé, 0,67–1 debout avec un bond) ; cache ; contemple / montre (éventail) ; attrape (+cible) ; abat 0..1 (+cible) ; mince
  function joueurPose(def, defMode) {
    const H = def.H;
    return function (p) {
      const q = prep(p), A = q.ang, f = q.face, t = q.t || 0;
      const ca = kv(q, 'cache'), co = kv(q, 'contemple'), mo = kv(q, 'montre'), at = kv(q, 'attrape'), mi = kv(q, 'mince');
      const ab = q.abat != null && q.abat !== false ? clamp(q.abat === true ? 1 : q.abat) : null;
      let mode = q.assis ? (q.assis === true ? defMode : q.assis) : null;
      if (q.leve != null) {
        const l = clamp(q.leve);
        if (l < 0.34) { mode = mode || defMode; const k = l / 0.34; plier(q, 0, H); q._mainsGenoux = k; }
        else if (l < 0.67) mode = 'genou';
        else { mode = null; const k = (l - 0.67) / 0.33; q.dy = (q.dy || 0) - Math.sin(PI * k) * 34; A.legF = (A.legF || 0) - 0.25 * Math.sin(PI * k); A.legB = (A.legB || 0) + 0.15 * Math.sin(PI * k); if (!f.eyes) f.eyes = 'wide'; }
      }
      if (mode) asseoir(q, mode, H);
      if ((co > 0 || mo > 0 || ca > 0) && !has(q.tenu)) { q.tenu = 'eventail'; q.tenuO = Object.assign({ n: 5, face: 1 }, q.tenuO); }
      if (ca > 0) q.tenuO = Object.assign({}, q.tenuO, { ouvert: q.tenuO && q.tenuO.ouvert != null ? q.tenuO.ouvert : 0.12 });
      if (ab != null && !has(q.tenu)) { q.tenu = 'carteOcc'; q.tenuO = Object.assign({ enseigne: 'roi' }, q.tenuO); }
      if (!mode) marcher(q, 1.7, 0.3, 4, { F: !has(q.tenu) && !at && !mi, B: !has(q.tenuB) && !has(q.tenu) && !at && !mi });
      const mg = q._mainsGenoux || 0;
      if (mg > 0 && mode) {                                                       // se prépare à se lever : penché, mains aux genoux
        plier(q, 0.25 * mg, H); armTo(q, 'armF', [104, 8], 'bas', mg); armTo(q, 'armB', [90, 12], 'bas', mg); if (mg > 0.5) { q.handF = 'bas'; q.handB = 'bas'; }
      }
      if (ca > 0) {                                                               // cartes serrées contre la poitrine, deux mains
        tenirA(q, [34, -112], 0, 'bas', ca); q.deuxMains = false; q.tenuO.face = 0; armTo(q, 'armB', [22, -100], 'bas', ca); q.handB = 'open';
        A.head = (A.head || 0) + 0.12 * ca; if (!f.brow) f.brow = 'worry'; if (!f.eyes) f.eyes = 'half';
      }
      if (co > 0) { tenirA(q, q.cibleL || [118, -118], 0, 'bas', co); A.head = (A.head || 0) + 0.1 * co; if (!f.mouth) f.mouth = 'smile'; if (!f.eyes) f.eyes = 'half'; }
      if (mo > 0) { tenirA(q, q.cibleL || [118, -176], 0, 'bas', mo); A.head = (A.head || 0) - 0.06 * mo; if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'up'; }
      if (at > 0) {
        const L = q.cibleL || [150, -84]; plier(q, 0.1 * at, H);
        if (has(q.tenu)) { tenirA(q, L, 0, 'bas', at); q.deuxMains = true; }
        else { armTo(q, 'armF', L, 'bas', at); armTo(q, 'armB', [L[0] - 26, L[1] + 8], 'bas', at); if (at > 0.4) { q.handF = 'open'; q.handB = 'open'; } }
        if (!f.eyes) f.eyes = 'wide'; if (!f.mouth) f.mouth = 'o';
      }
      if (ab != null) {
        const L = q.cibleL || [150, -20], u = ease(ab), U = [64, -258];
        plier(q, 0.22 * u, H); tenirA(q, [lerp(U[0], L[0], u), lerp(U[1], L[1], u)], 0, 'bas', 1);
        if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = u > 0.8 ? 'o' : 'tight';
      }
      if (mi > 0) {                                                               // se faire tout mince (caché derrière A) : bras collés, menton rentré
        blend(q, 'armF_up', 0.03, mi); blend(q, 'armF_lo', -0.06, mi); blend(q, 'armB_up', 0.02, mi); blend(q, 'armB_lo', -0.05, mi);
        q.handF = 'open'; q.handB = 'open'; A.head = (A.head || 0) + 0.12 * mi; q.dy = (q.dy || 0) - 6 * mi;
        if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
      }
      cibleLibre(q, ca || co || mo || at || ab != null || mi || mg);
      void t;
      return finish(q);
    };
  }
  NIN.grosPose = joueurPose(CH.ninGros, 'tailleur');
  NIN.maigrePose = joueurPose(CH.ninMaigre, 'seiza');
  NIN.gros = (pose, x, y, s, o) => { s = s == null ? 0.85 : s; return run(CH.ninGros, avecCible(CH.ninGros, NIN.grosPose, pose, x, y, s, o), x, y, s, o); };
  NIN.maigre = (pose, x, y, s, o) => { s = s == null ? 0.85 : s; return run(CH.ninMaigre, avecCible(CH.ninMaigre, NIN.maigrePose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // LA MÈRE D'AUJOURD'HUI (≈ 40 ans) — carré court châtain, pull col roulé moutarde, pantalon gris anthracite, baskets ivoire
  // =====================================================================
  const ME = { peau: '#e6c3a2', peauD: '#c9a383', pull: '#C49A3A', pullD: '#a8822c', pullL: '#d6ae52', pant: '#3A3D44', pantD: '#2e3136', basket: '#efe8d8', semelle: '#b9b2a2', cheveux: '#7a4e2e', cheveuxL: '#9a6a42' };
  const ME_TORSO = [[-12, -176], [8, -180], [16, -170], [26, -150], [32, -126], [30, -100], [26, -70], [28, -40], [30, -10], [32, 12, 1], [-30, 14, 1], [-30, -10], [-28, -60], [-32, -110], [-32, -148], [-24, -170]];
  const ME_HEAD = [[-12, 16], [9, 16], [10, 2], [14, -4], [20, -9], [24, -15], [23, -20], [25, -24], [24, -28], [27, -33], [33, -40, 1], [28, -46], [26, -55], [26, -64], [23, -78], [12, -90], [-6, -95], [-23, -87], [-31, -68], [-30, -46], [-24, -28], [-17, -8]];
  const ME_HAIR = [[23, -62], [27, -80], [18, -97], [0, -105], [-22, -101], [-38, -86], [-43, -62], [-42, -30], [-38, -6, 1], [-16, -8, 1], [-18, -26], [-12, -46], [0, -58], [12, -60]];
  function mkMere() {
    const legP = (back) => () => {
      fillPts([[-40, 212, 1], [60, 212, 1], [60, 260, 1], [-40, 260, 1]], back ? '#d8d0bf' : ME.basket);
      fillPts(box(-40, 231, 60, 240), ME.semelle); strokePts([[6, 218], [26, 222]], 'rgba(120,110,90,0.7)', 1); strokePts([[10, 214], [30, 219]], 'rgba(120,110,90,0.6)', 1);
      if (!back) { strokePts([[18, -6], [14, 200]], 'rgba(0,0,0,0.35)', 1); hatch([[-26, -20], [-8, -20], [-8, 210], [-26, 210]], 0.8, 4, 0.22); } else hatch(null, 0.8, 3.6, 0.3);
    };
    const pullManche = () => { for (let x = -12; x <= 12; x += 6) strokePts([[x, -10], [x, 96]], 'rgba(120,90,30,0.25)', 0.9); hatch(null, 0.9, 3.8, 0.22); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: ME_TORSO, base: ME.pull, seed: 9401, paint: () => {
        for (let x = -28; x < 32; x += 6) strokePts([[x, -168], [x + 1, -6]], 'rgba(120,90,30,0.22)', 0.9);    // côtes du tricot
        fillPts(box(-34, -12, 34, 2), ME.pullD); for (let x = -30; x < 32; x += 4) strokePts([[x, -11], [x, 1]], 'rgba(90,60,20,0.35)', 0.8);
        fillPts(box(-34, 2, 36, 16), ME.pant);
        hatch([[-42, -170], [-10, -170], [-8, 16], [-42, 16]], 0.75, 4.2, 0.24); shade(30, 0, -30, 0, 0.24);
      } },
      col: { parent: 'torso', at: [0, 0], pts: [[-11, -190], [9, -191], [12, -170], [-13, -169]], base: ME.pullL, seed: 9402, noRivet: true, paint: () => { for (let y = -194; y < -168; y += 5) strokePts([[-16, y], [16, y - 1]], 'rgba(120,90,30,0.4)', 0.9); } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(0.9), base: ME.pantD, seed: 9403, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(0.9), base: ME.pant, seed: 9404, paint: legP(false) },
      armB_up: upDef([-10, -146], ME.pullD, 9405, pullManche, 13),
      armB_lo: foreDef(true, ME.peauD, 9406, ME.pullD, 66, ME.pullD),
      head: { parent: 'torso', at: [6, -170], pts: ME_HEAD, base: ME.peau, seed: 9407, noRivet: true, paint: (p) => {
        const f = p.face || {};
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.2);
        dot(14, -30, 8, 'rgba(215,130,120,0.24)');
        X.eye(f, 15, -52); strokePts([[19, -55], [23, -57]], 'rgba(30,20,20,0.8)', 1.2); X.brow(f, 15, -60, 'rgba(90,56,34,0.95)', 2);
        X.mouth(f, 23, -24, 'rgba(160,70,70,0.95)');
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: ME_HAIR, base: ME.cheveux, seed: 9408, noRivet: true, paint: () => {
        for (let k = 0; k < 6; k++) strokePts(qbez([22 - k * 3, -72 + k * 2], [-6, -100 + k * 5], [-36 + k * 2, -30 + k * 3], 8), 'rgba(200,150,100,0.35)', 1.1);
        strokePts([[-38, -10], [-16, -10]], 'rgba(40,20,10,0.5)', 1.2); dot(-12, -24, 2.2, '#c9a24a');
      } },
      armF_up: upDef([-2, -146], ME.pull, 9409, pullManche, 13),
      armF_lo: foreDef(false, ME.peau, 9410, ME.pull, 66, ME.pullD),
    };
    Object.assign(parts, heldParts(ME.peau, 9420));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-22, 18] }, nom: 'Mere', order: ORD({ heads: ['cheveux'], apres: ['col'] }) };
  }
  CH.ninMere = mkMere();
  // gestes : marche (décidée), tend (+cible : main paume ouverte « donne »), leve (tient l'objet très haut ; manette par défaut), panier (deux mains devant, tenu 'libre'), regarde, hoche
  NIN.merePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0;
    const te = kv(q, 'tend'), le = kv(q, 'leve'), pa = kv(q, 'panier'), rg = kv(q, 'regarde'), ho = kv(q, 'hoche');
    if (le > 0 && !has(q.tenu)) q.tenu = 'manette';
    marcher(q, 1.9, 0.34, 3, { F: !has(q.tenu) && !te && !le && !pa, B: !has(q.tenuB) && !has(q.tenu) && !pa }, 0.2);
    if (te > 0) { armTo(q, 'armF', q.cibleL || [152, -72], 'bas', te); if (te > 0.4 && !has(q.tenu)) q.handF = 'paume'; A.head = (A.head || 0) + 0.06 * te; if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight'; }
    if (le > 0) { tenirA(q, q.cibleL || [62, -330], 0, 'avant', le); A.head = (A.head || 0) + 0.1 * le; if (!f.mouth) f.mouth = 'tight'; if (!f.brow) f.brow = 'frown'; }
    if (pa > 0) { tenirA(q, q.cibleL || [118, -40], 0, 'bas', pa); q.deuxMains = true; }
    if (rg > 0) { A.head = (A.head || 0) + 0.24 * rg; if (!f.eyes) f.eyes = 'half'; }
    if (ho > 0) { A.head = (A.head || 0) + 0.14 * ho * Math.max(0, Math.sin(t * 6)); if (!f.mouth) f.mouth = 'smile'; }
    cibleLibre(q, te || le || pa);
    return finish(q);
  };
  NIN.mere = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; return run(CH.ninMere, avecCible(CH.ninMere, NIN.merePose, pose, x, y, s, o), x, y, s, o); };

  // =====================================================================
  // LE GARÇON D'AUJOURD'HUI — garçon de petitbateau.js (PB.garconPose, coiffure moderne) RECOLORÉ : sweat à capuche vert éteint, jean bleu ardoise,
  // baskets blanches. Options en plus : canape 0..1 (assis sur un siège, cuisses à l'horizontale), tenu 'manette' | 'boite' | 'carte' (+ tenuO),
  // joue (pouces qui bougent), montre (carte levée face au public)
  // =====================================================================
  const GA = { sweat: '#5E7553', sweatD: '#4b5e42', sweatL: '#6f8864', jean: '#4F6478', jeanD: '#40536a', basket: '#f2eee4', semelle: '#9a9488' };
  function mkGarconNin() {
    const G0 = CH.pbGarcon; if (!G0) return null;
    const parts = {}; for (const k in G0.parts) parts[k] = Object.assign({}, G0.parts[k]);
    parts.torso.base = GA.sweat;
    parts.torso.paint = () => {
      fillPts(box(-44, -4, 44, 30), GA.jean); strokePts([[-30, -2], [30, -2]], 'rgba(20,30,40,0.6)', 1.2);
      fillPts(box(-44, -14, 44, -4), GA.sweatD);
      fillPts([[2, -54], [28, -56], [30, -18], [4, -16]], GA.sweatD); strokePts([[4, -54], [4, -18]], 'rgba(20,30,16,0.5)', 1);
      strokePts([[12, -146], [14, -112]], '#e9e4d6', 1.4); strokePts([[18, -144], [21, -116]], '#e9e4d6', 1.4);
      hatch([[-44, -150], [-10, -150], [-8, 26], [-44, 26]], 0.75, 4.2, 0.22); shade(30, 0, -30, 0, 0.22);
    };
    parts.capuche = { parent: 'torso', at: [0, 0], pts: [[-34, -150], [-10, -158], [2, -146], [-8, -126], [-30, -118], [-40, -132]], base: GA.sweatL, seed: 9501, noRivet: true, paint: () => { strokePts([[-30, -146], [-8, -136]], 'rgba(20,30,16,0.5)', 1.2); hatch(null, 0.7, 3.6, 0.2); } };
    const jean = (back, lo) => () => {
      if (!lo) { fillPts(box(-30, -30, 30, 130), back ? GA.jeanD : GA.jean); strokePts([[-4, -10], [-2, 120]], 'rgba(200,210,220,0.3)', 0.9); }
      else { fillPts(box(-30, -20, 30, 84), back ? GA.jeanD : GA.jean); fillPts(box(-16, 84, 42, 112), back ? '#dcd7cc' : GA.basket); fillPts(box(-16, 102, 42, 112), GA.semelle); strokePts([[4, 88], [18, 92]], 'rgba(120,110,100,0.7)', 1); }
      hatch(back ? null : [[-16, -10], [-5, -10], [-5, 110], [-16, 110]], 0.8, 3.8, back ? 0.28 : 0.2);
    };
    parts.legF.base = GA.jean; parts.legF.paint = jean(false, false); parts.legF_lo.base = GA.jean; parts.legF_lo.paint = jean(false, true);
    parts.legB.base = GA.jeanD; parts.legB.paint = jean(true, false); parts.legB_lo.base = GA.jeanD; parts.legB_lo.paint = jean(true, true);
    parts.armF_up.base = GA.sweat; parts.armF_up.paint = () => hatch([[-16, -20], [-3, -20], [-3, 90], [-16, 90]], 0.9, 3.8, 0.2);
    parts.armB_up.base = GA.sweatD; parts.armB_up.paint = () => hatch(null, 0.9, 3.8, 0.28);
    for (const [k, col] of [['armF_lo', GA.sweat], ['armB_lo', GA.sweatD]]) {
      const p0 = G0.parts[k].paint;
      parts[k].paint = (p) => { if (p0) p0(p); fillPts(box(-30, -30, 30, 54), col); fillPts(box(-30, 50, 30, 60), GA.sweatD); };
    }
    const order = G0.order.slice(); order.splice(order.indexOf('torso') + 1, 0, 'capuche');
    return Object.assign({}, G0, { parts, order, nom: 'GarconNin' });
  }
  CH.ninGarcon = mkGarconNin();
  const OBJ_LIBRE = (name, k, extra) => { const ob = OBJ[name]; return (o) => Object.assign({ draw: (oo) => ob.draw(Object.assign({}, o, oo, extra || {})), grip: typeof ob.grip === 'function' ? ob.grip(o || {}) : ob.grip, p2: ob.p2 ? ob.p2(o || {}) : [0, 0], k }, o || {}); };
  NIN.garconPose = function (p) {
    if (!M.pb || !M.pb.garconPose) return null;
    p = p || {}; const c = clamp(p.canape === true ? 1 : p.canape || 0), t = p.t || 0;
    const q0 = Object.assign({ tenue: 'aujourdhui', coiffure: 'moderne' }, p, { ang: Object.assign({}, p.ang) });
    if (c > 0) { const A = q0.ang; A.legF = (A.legF || 0) - 1.52 * c; A.legF_lo = (A.legF_lo || 0) + 1.52 * c; A.legB = (A.legB || 0) - 1.44 * c; A.legB_lo = (A.legB_lo || 0) + 1.44 * c; q0.dy = (q0.dy || 0) + 106 * c; }
    const mo = clamp(p.montre === true ? 1 : p.montre || 0);
    if (p.tenu === 'manette') { const jo = clamp(p.joue === true ? 1 : p.joue || 0); q0.tenu = 'libre'; q0.tenuO = OBJ_LIBRE('manette', 1.0, { joue: jo, t })(p.tenuO); q0.deuxMains = true; if (!q0.cibleL) q0.cibleL = [100, -60 + (jo ? 2 * Math.sin(t * 11) : 0)]; }
    else if (p.tenu === 'boite') { q0.tenu = 'libre'; q0.tenuO = OBJ_LIBRE('boite', 0.7)(p.tenuO); q0.deuxMains = true; if (!q0.cibleL) q0.cibleL = [104, -50]; }
    else if (p.tenu === 'carte') { q0.tenu = 'libre'; q0.tenuO = OBJ_LIBRE('carte', 1.1)(p.tenuO); if (!q0.cibleL) q0.cibleL = mo > 0 ? [lerp(98, 92, mo), lerp(-50, -150, mo)] : [98, -50]; }
    return M.pb.garconPose(q0);
  };
  NIN.garcon = function (pose, x, y, s, o) {
    s = s == null ? 0.65 : s; o = o || {};
    let q = NIN.garconPose(pose); if (!q) return null;
    if (pose && pose.cible) { const L = toTorso(CH.ninGarcon, q, x, y, s, o.dir, pose.cible); q = NIN.garconPose(Object.assign({}, pose, { cibleL: L })); }
    const r = M.puppet(CH.ninGarcon, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o));
    r.q = q; r.def = CH.ninGarcon; r.main = r.w('armF_lo', 3.5, 84); r.mainB = r.w('armB_lo', 3.5, 84);
    return r;
  };
})();

// ——— DÉCORS de la vidéo : NIN.salon / salonSol, NIN.tripot / tripotSol, NIN.atelier / atelierSol ; pré-rendus par NIN.init() ; signature (t, up, o) ;
// t = temps LOCAL du plan (les ambiances passent seules en temps global M.tg(t)) ; up = décalage vertical (px, vers le haut).
(function () {
  'use strict';
  const NIN = M.nin, TAU = M.TAU, PI = Math.PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, smooth, hash, ease } = M;
  const { ep, ell, ribbon, qbez, rrect, blob, fleur5 } = NIN.geo;
  const W = M.W, BACK = M.ST.back;
  const cx_ = () => M.ctx();
  const K = {};
  NIN.K = K;
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function lay(x0, y0, x1, y1, fn) { const cv = M.pre(x1 - x0, y1 - y0, (c) => { c.translate(-x0, -y0); fn(c); }); cv.x0 = x0; cv.y0 = y0; return cv; }
  function ombre(cv, blur) { cv.sh = M.pre(cv.width + 40, cv.height + 40, (x) => { x.filter = `brightness(0) blur(${blur || 8}px)`; x.drawImage(cv, 20, 20); }); return cv; }
  function put(cv, sh, al) {
    const c = cx_(); c.save(); if (al != null) c.globalAlpha = al;
    if (sh && cv.sh) { const a0 = c.globalAlpha; c.globalAlpha = a0 * sh; c.drawImage(cv.sh, cv.x0 - 20 + 16, cv.y0 - 20 + 8); c.globalAlpha = a0; }
    c.drawImage(cv, cv.x0, cv.y0); c.restore();
  }
  function glow(x, y, r, col, a) { if (a <= 0) return; const c = cx_(), gr = c.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
  function grad(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([k, col]) => g.addColorStop(k, col)); return g; }
  function cut(c, pts) { c.save(); c.globalCompositeOperation = 'destination-out'; M.path(pts, 0, 0); c.fillStyle = '#000'; c.fill(); c.restore(); }
  function clipRect(x0, y0, x1, y1, fn) { const c = cx_(); c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip(); fn(c); c.restore(); }
  function planches(x0, y0, x1, y1, w, col, seed) { const R = M.rng(seed); for (let x = x0; x < x1; x += w) { fillPts(rect(x, y0, Math.min(x1, x + w - 1.5), y1), M.mixc(col, '#000000', R() * 0.12), 0, 0); strokePts([[x, y0], [x, y1]], 'rgba(30,18,8,0.45)', 1); for (let k = 0; k < 3; k++) { const xx = x + 4 + R() * (w - 8); strokePts([[xx, y0 + R() * 40], [xx + (R() - 0.5) * 6, y1 - R() * 40]], 'rgba(60,36,16,0.22)', 0.8); } } }
  function tuiles(x0, x1, y, h, col, seed) {                 // toit de tuiles japonaises vu de face (rangs de tuiles rondes)
    fillPts([[x0 - 14, y + h], [x0 + 6, y], [x1 - 6, y], [x1 + 14, y + h]], col, seed || 0, 0.4);
    for (let x = x0; x < x1 + 8; x += 9) strokePts([[x, y + 2], [x + (x - (x0 + x1) / 2) * 0.06, y + h]], 'rgba(255,255,255,0.12)', 1.4);
    strokePts([[x0 - 14, y + h], [x1 + 14, y + h]], 'rgba(0,0,0,0.6)', 2.4); fillPts(rect(x0 + 2, y - 5, x1 - 2, y + 2), M.mixc(col, '#000000', 0.3), 0, 0);
  }
  function maisonBois(x0, x1, yT, yB, seed, jour) {            // façade de machiya : treillis koshi, étage, toit de tuiles
    const R = M.rng(seed), mid = lerp(yT, yB, 0.42);
    fillPts(rect(x0, yT + 30, x1, yB), jour ? '#5a3c26' : '#2a1e16', 0, 0);
    tuiles(x0, x1, yT, 34, jour ? '#3e3e44' : '#14141a', seed);
    tuiles(x0, x1, mid - 10, 24, jour ? '#46464c' : '#18181e', seed + 1);
    for (let x = x0 + 4; x < x1 - 2; x += 5) strokePts([[x, mid + 18], [x, yB - 6]], jour ? 'rgba(30,18,10,0.55)' : 'rgba(255,200,120,0.18)', 1.6);
    fillPts(rect(x0 + 8, yT + 44, x1 - 8, mid - 14), jour ? '#e6dcc2' : '#c9934a', 0, 0);
    for (let x = x0 + 12; x < x1 - 10; x += 10) strokePts([[x, yT + 44], [x, mid - 14]], 'rgba(40,24,12,0.6)', 1.2);
    if (R() < 0.6) fillPts(rect(lerp(x0, x1, 0.3), mid + 22, lerp(x0, x1, 0.7), mid + 60), jour ? '#3a4e7a' : '#2a3352', 0, 0);   // petit noren de la maison d'en face
  }

  // =====================================================================
  // LIEU 1 — SALON D'AUJOURD'HUI, le soir (plans 1 et 7)
  // =====================================================================
  const SA = { tele: { x: 238, y: 1255, ecran: [135, 1091, 341, 1214] }, meuble: { x0: 126, x1: 350, dessus: 1255 }, console: { x: 238, y: 1318 },
    canape: { x0: 300, x1: 620, assise: 1318, dossier: 1150, cx: 460 }, fenetre: { x0: 700, x1: 900, y0: 380, y1: 1000 }, lampe: { x: 676, y: 968 },
    horloge: { x: 600, y: 330, r: 42 }, etagere: { x0: 380, x1: 640, y: 600 }, cadre: { x: 470, y: 440 }, tableBasse: { x0: 812, x1: 928, dessus: 1352 },
    tapis: { x: 520, y: 1430 }, chatY: 1150 };
  NIN.SALON = SA;
  const SAW = [];                                              // fenêtres des immeubles lointains (s'allument une à une)
  function makeSaVille() {
    const F = SA.fenetre;
    return lay(F.x0 - 10, F.y0 - 10, F.x1 + 10, F.y1 + 10, (c) => {
      c.fillStyle = grad(c, 0, F.y0, 0, F.y1, [[0, '#18223f'], [0.55, '#34406e'], [0.85, '#8a5a6a'], [1, '#c27a56']]); c.fillRect(F.x0 - 10, F.y0 - 10, 220, 640);
      for (let i = 0; i < 18; i++) dot(F.x0 + hash(i * 3.3) * 200, F.y0 + hash(i * 7.7) * 260, 1 + hash(i) * 0.8, 'rgba(240,236,220,0.7)');
      fillPts(ell(856, 440, 16, 16, 14), '#efe6c8', 0, 0); fillPts(ell(864, 436, 14, 14, 14), '#2a3560', 0, 0);       // croissant de lune
      const R = M.rng(71);
      for (let layer = 0; layer < 2; layer++) {
        let x = F.x0 - 10;
        while (x < F.x1 + 10) {
          const w = 34 + R() * 40, h = (layer ? 180 : 300) + R() * 160, y0 = F.y1 + 10 - h, col = layer ? '#1a2036' : '#2c3556';
          fillPts(rect(x, y0, x + w, F.y1 + 10), col, 0, 0);
          if (R() < 0.3) strokePts([[x + w / 2, y0], [x + w / 2, y0 - 26]], col, 2);
          for (let yy = y0 + 12; yy < F.y1 - 4; yy += 22) for (let xx = x + 6; xx < x + w - 8; xx += 13) { fillPts(rect(xx, yy, xx + 7, yy + 10), 'rgba(10,12,24,0.6)', 0, 0); if (layer === 0) SAW.push([xx, yy]); }
          x += w + 4;
        }
      }
    });
  }
  function makeSaMur() {
    return lay(46, 150, 1034, BACK + 6, (c) => {
      const F = SA.fenetre;
      fillPts(rect(46, 150, 1034, BACK + 6), '#93a89c', 0, 0);
      for (let y = 190, r = 0; y < 1350; y += 62, r++) for (let x = 60 + (r % 2) * 30; x < 1030; x += 60) {     // papier peint : brins de feuilles
        strokePts([[x, y + 10], [x + 2, y - 10]], 'rgba(90,110,98,0.45)', 1);
        fillPts(ell(x - 5, y - 2, 6, 3, 8).map((p) => [p[0], p[1] + (p[0] - x) * 0.4]), 'rgba(120,142,128,0.5)', 0, 0);
        fillPts(ell(x + 7, y - 8, 6, 3, 8).map((p) => [p[0], p[1] - (p[0] - x) * 0.4]), 'rgba(170,190,176,0.45)', 0, 0);
      }
      c.fillStyle = grad(c, 0, 150, 0, BACK, [[0, 'rgba(20,30,40,0.28)'], [0.5, 'rgba(20,30,40,0.05)'], [1, 'rgba(20,30,40,0.25)']]); c.fillRect(46, 150, 988, BACK - 144);
      pc(rect(46, 150, 1034, 178), '#d9d4c6', () => strokePts([[46, 172], [1034, 172]], 'rgba(0,0,0,0.25)', 2), 1101);
      pc(rect(46, 1350, 1034, BACK + 6), '#d6d0c0', () => strokePts([[46, 1358], [1034, 1358]], 'rgba(0,0,0,0.2)', 1.6), 1102);
      cut(c, rect(F.x0, F.y0, F.x1, F.y1));
      // fenêtre : cadre blanc, croisillon, appui
      for (const p of [rect(F.x0 - 12, F.y0 - 12, F.x1 + 12, F.y0), rect(F.x0 - 12, F.y0, F.x0, F.y1), rect(F.x1, F.y0, F.x1 + 12, F.y1), rect(796, F.y0, 804, F.y1), rect(F.x0, 686, F.x1, 694)]) pc(p, '#e8e4da', null, 1103);
      pc([[F.x0 - 24, F.y1], [F.x1 + 24, F.y1], [F.x1 + 30, F.y1 + 16, 1], [F.x0 - 30, F.y1 + 16, 1]], '#e2ddd0', () => strokePts([[F.x0 - 24, F.y1 + 4], [F.x1 + 24, F.y1 + 4]], 'rgba(0,0,0,0.2)', 1), 1104);
      pc(rect(F.x0 - 30, F.y0 - 40, F.x1 + 30, F.y0 - 30), '#6a5a4a', null, 1105);                                            // tringle
      // étagère murale : livres (dos sans lettres), plantes retombantes
      const E = SA.etagere;
      pc(rect(E.x0, E.y, E.x1, E.y + 12), '#b8936a', () => strokePts([[E.x0, E.y + 3], [E.x1, E.y + 3]], 'rgba(255,230,190,0.4)', 1.2), 1106);
      for (const x of [E.x0 + 30, E.x1 - 30]) pc([[x - 4, E.y + 12], [x + 4, E.y + 12], [x + 4, E.y + 40], [x - 4, E.y + 30]], '#7a6a5a', null, 1107);
      const cols = ['#8E2B22', '#3a5a7a', '#c49a3a', '#5e7553', '#e0d6c0', '#6a4a6a', '#a65c38', '#2f3e5c', '#d8c8a0'];
      let bx = E.x0 + 52;
      for (let i = 0; i < 11; i++) { const w = 12 + hash(i * 2.2) * 10, h = 58 + hash(i * 5.1) * 26; pc(rect(bx, E.y - h, bx + w, E.y), cols[i % cols.length], () => { strokePts([[bx + 2, E.y - h + 10], [bx + w - 2, E.y - h + 10]], 'rgba(255,255,255,0.35)', 1); strokePts([[bx + 2, E.y - 12], [bx + w - 2, E.y - 12]], 'rgba(255,255,255,0.3)', 1); }, 1110 + i); bx += w + 1; if (i === 6) bx += 30; }
      pc([[bx + 4, E.y], [bx + 18, E.y - 70], [bx + 32, E.y - 66], [bx + 18, E.y]], '#5e7553', null, 1130);
      for (const [x, s] of [[E.x0 + 18, 1], [E.x1 - 22, 0.9], [E.x0 + 160, 0.7]]) {
        pc([[x - 14 * s, E.y - 30 * s], [x + 14 * s, E.y - 30 * s], [x + 10 * s, E.y], [x - 10 * s, E.y]], '#b5653a', null, 1131);
        for (let k = 0; k < 7; k++) { const a = -PI / 2 + (k - 3) * 0.45; fillPts(ell(x + Math.cos(a) * 18 * s, E.y - 34 * s + Math.sin(a) * 14 * s, 9 * s, 5 * s, 8), k % 2 ? '#4f7a4a' : '#3e6a3a', 0, 0); }
        for (let k = 0; k < 4; k++) fillPts(ell(x + 14 * s + k * 3, E.y + 14 + k * 22 * s, 7 * s, 4 * s, 8), '#4f7a4a', 0, 0);
      }
      // cadre (dessin abstrait), horloge sans chiffres
      const Cd = SA.cadre;
      pc(rect(Cd.x - 64, Cd.y - 50, Cd.x + 64, Cd.y + 50), '#3a2a1e', () => {
        fillPts(rect(Cd.x - 56, Cd.y - 42, Cd.x + 56, Cd.y + 42), '#ede6d2', 0, 0);
        fillPts(ell(Cd.x - 18, Cd.y - 6, 22, 22, 16), '#c49a3a', 0, 0); fillPts(rect(Cd.x + 2, Cd.y - 30, Cd.x + 42, Cd.y + 10), '#3a5a7a', 0, 0); fillPts([[Cd.x - 40, Cd.y + 34], [Cd.x + 10, Cd.y + 34], [Cd.x - 14, Cd.y + 6]], '#8E2B22', 0, 0);
      }, 1140);
      const H = SA.horloge;
      pc(ell(H.x, H.y, H.r + 6, H.r + 6, 24), '#2a2a2e', () => { fillPts(ell(H.x, H.y, H.r, H.r, 24), '#f2eee4', 0, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[H.x + Math.cos(a) * (H.r - 10), H.y + Math.sin(a) * (H.r - 10)], [H.x + Math.cos(a) * (H.r - 3), H.y + Math.sin(a) * (H.r - 3)]], '#2a2a2e', i % 3 ? 1.4 : 3); } }, 1141);
      pc(rect(150, 560, 330, 700), '#c9a77c', () => {                                                                                 // grand cadre : paysage abstrait
        fillPts(rect(160, 570, 320, 690), '#e6dcc8', 0, 0); fillPts([[160, 690], [210, 620], [250, 660], [290, 600], [320, 650], [320, 690]], '#5e7553', 0, 0);
        fillPts([[160, 690], [230, 650], [320, 690]], '#3a5a7a', 0, 0); fillPts(ell(280, 600, 14, 14, 12), '#c0582e', 0, 0); }, 1143);
      pc(rect(176, 760, 300, 790), '#e2ddd0', () => strokePts([[176, 764], [300, 764]], 'rgba(0,0,0,0.2)', 1), 1144);                    // petite étagère : bougie, galet, photo
      pc(rect(196, 712, 226, 760), '#f0e8d0', null, 1145); pc(ell(256, 752, 18, 9, 12), '#8a8a90', null, 1146); pc(rect(270, 726, 296, 760), '#3a2a1e', () => fillPts(rect(274, 730, 292, 756), '#9ab0c0', 0, 0), 1147);
      pc(rect(360, 1200, 380, 1230), '#e8e4da', () => dot(370, 1215, 3, '#9a948a'), 1142);                                             // prise électrique
    });
  }
  function makeSaMil() {
    return ombre(lay(46, 880, 1034, BACK + 6, (c) => {
      // meuble télé bas en bois clair : tiroirs, niche de la console
      const Mb = SA.meuble;
      pc(rect(Mb.x0, Mb.dessus, Mb.x1, BACK - 12), '#c9a77c', () => {
        fillPts(rect(Mb.x0, Mb.dessus, Mb.x1, Mb.dessus + 10), '#d8b88c', 0, 0);
        fillPts(rect(Mb.x0 + 60, Mb.dessus + 26, Mb.x1 - 60, Mb.dessus + 72), '#4a3a2a', 0, 0);
        for (const x0 of [Mb.x0 + 8, Mb.x1 - 54]) { strokePts(rect(x0, Mb.dessus + 20, x0 + 46, BACK - 22), 'rgba(80,50,20,0.5)', 1.2, true); fillPts(rect(x0 + 18, Mb.dessus + 60, x0 + 28, Mb.dessus + 64), '#6a5a4a', 0, 0); }
        fillPts(rect(Mb.x0 + 60, Mb.dessus + 86, Mb.x1 - 60, BACK - 22), 'rgba(80,50,20,0.15)', 0, 0);
        strokePts([[Mb.x0 + 66, Mb.dessus + 110], [Mb.x1 - 66, Mb.dessus + 110]], 'rgba(80,50,20,0.4)', 1);
        hatch(null, 0.2, 5, 0.12, 1, '80,50,20', [Mb.x0, Mb.dessus, Mb.x1, BACK]);
      }, 1201);
      for (const x of [Mb.x0 + 10, Mb.x1 - 18]) pc(rect(x, BACK - 12, x + 8, BACK + 2), '#5a4a3a', null, 1202);
      // lampe sur pied (derrière le bout droit du canapé)
      const L = SA.lampe;
      pc(ell(L.x, BACK - 2, 34, 7, 16), '#2a2a2e', null, 1203); pc(rect(L.x - 3, L.y + 30, L.x + 3, BACK - 4), '#3a3a3e', null, 1204);
      pc([[L.x - 32, L.y - 30], [L.x + 32, L.y - 30], [L.x + 44, L.y + 30, 1], [L.x - 44, L.y + 30, 1]], '#ede2c8', () => { for (let x = -36; x < 40; x += 8) strokePts([[L.x + x * 0.8, L.y - 28], [L.x + x, L.y + 28]], 'rgba(160,140,100,0.3)', 1); }, 1205, { texA: 0.5 });
      // canapé bleu ardoise : dossier, coussins de dos, accoudoirs, assise, pieds
      const Cn = SA.canape, col = '#56677a', colD = '#46566a', colL = '#6a7c90';
      pc([[Cn.x0 + 20, Cn.dossier + 20], [Cn.x0 + 40, Cn.dossier, 1], [Cn.x1 - 40, Cn.dossier, 1], [Cn.x1 - 20, Cn.dossier + 20], [Cn.x1 - 20, Cn.assise], [Cn.x0 + 20, Cn.assise]], colD, () => hatch(null, 0.8, 4, 0.2), 1210);
      for (const [x0, x1] of [[Cn.x0 + 40, Cn.cx - 4], [Cn.cx + 4, Cn.x1 - 40]]) pc(rrect(x0, Cn.dossier + 22, x1, Cn.assise - 6, 14), col, () => { strokePts([[x0 + 10, Cn.dossier + 34], [x1 - 10, Cn.dossier + 34]], 'rgba(255,255,255,0.15)', 2); shade(0, Cn.dossier, 0, Cn.assise, 0.2, [x0, Cn.dossier, x1, Cn.assise]); }, 1211);
      pc(rrect(Cn.x0 + 60, Cn.dossier + 50, Cn.x0 + 150, Cn.dossier + 130, 12), '#a65c38', () => { for (let k = 0; k < 4; k++) strokePts([[Cn.x0 + 64, Cn.dossier + 62 + k * 18], [Cn.x0 + 146, Cn.dossier + 58 + k * 18]], 'rgba(255,220,180,0.3)', 2); }, 1212);
      pc(rrect(Cn.x1 - 150, Cn.dossier + 56, Cn.x1 - 66, Cn.dossier + 132, 12), '#e0d6c0', () => { for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) dot(Cn.x1 - 134 + j * 26, Cn.dossier + 74 + k * 22, 4, '#5e7553'); }, 1213);
      pc(rrect(Cn.x0 + 24, Cn.assise - 4, Cn.x1 - 24, Cn.assise + 30, 10), colL, () => { strokePts([[Cn.cx, Cn.assise], [Cn.cx, Cn.assise + 28]], 'rgba(0,0,0,0.25)', 1.4); strokePts([[Cn.x0 + 30, Cn.assise + 2], [Cn.x1 - 30, Cn.assise + 2]], 'rgba(255,255,255,0.2)', 2); }, 1214);
      pc(rect(Cn.x0 + 10, Cn.assise + 26, Cn.x1 - 10, Cn.assise + 62), colD, () => hatch(null, 0.8, 4, 0.2), 1215);
      for (const x0 of [Cn.x0, Cn.x1 - 44]) pc(rrect(x0, Cn.assise - 84, x0 + 44, Cn.assise + 62, 16), col, () => { strokePts([[x0 + 8, Cn.assise - 74], [x0 + 36, Cn.assise - 74]], 'rgba(255,255,255,0.2)', 2); hatch(null, 0.8, 4, 0.18); }, 1216);
      pc([[Cn.x1 - 44, Cn.assise - 84], [Cn.x1, Cn.assise - 84], [Cn.x1 + 4, Cn.assise - 10], [Cn.x1 - 20, Cn.assise + 10], [Cn.x1 - 48, Cn.assise - 30]], '#5e7553', () => { for (let k = 0; k < 4; k++) strokePts([[Cn.x1 - 40 + k * 10, Cn.assise - 80], [Cn.x1 - 36 + k * 10, Cn.assise - 20]], 'rgba(255,255,255,0.15)', 1.2); }, 1217);   // plaid
      for (const x of [Cn.x0 + 16, Cn.x1 - 26]) pc(rect(x, Cn.assise + 62, x + 10, BACK + 2), '#3a2a1e', null, 1218);
    }), 10);
  }
  function chatGris(x, y, g, dir) {                           // chat gris qui marche (vu de profil), pattes en mouvement ; (x,y) = sous les pattes
    const c = cx_(), ph = g * 7;
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const col = '#7d7f84', colD = '#5d5f64';
    for (const [lx, o] of [[-26, 0], [-16, PI], [18, PI * 0.5], [28, PI * 1.5]]) { const a = 0.35 * Math.sin(ph + o); pc(ribbon([[lx, -26], [lx + Math.sin(a) * 18, -2]], 7, 6), o > 2 ? colD : col, null, 1250); }
    pc([[-36, -44], [-10, -52], [24, -50], [38, -44], [36, -26], [-34, -24]], col, () => { for (let k = 0; k < 4; k++) strokePts([[-20 + k * 12, -50], [-24 + k * 12, -30]], 'rgba(40,40,44,0.35)', 2); }, 1251);
    pc(qbez([-34, -40], [-62, -56 + 6 * Math.sin(g * 2)], [-56, -86], 10).length ? ribbon(qbez([-34, -40], [-62, -56 + 6 * Math.sin(g * 2)], [-52, -88], 10), 8, 5) : [], col, null, 1252);
    pc([[30, -46], [36, -66], [40, -76], [46, -64], [54, -66], [58, -50], [54, -36], [36, -34]], col, () => { dot(50, -52, 2.2, '#d8c040'); dot(51, -52, 1, '#1a1a1a'); dot(58, -44, 1.6, '#c08080'); strokePts([[56, -42], [70, -44]], 'rgba(230,230,230,0.6)', 0.8); }, 1253);
    c.restore();
  }
  NIN.salon = function (t, up, o) {
    o = o || {}; up = up || 0;
    const c = cx_(), g = M.tg(t), F = SA.fenetre, H = SA.horloge;
    const tv = o.tele || {}, al = tv.allume == null ? 1 : clamp(tv.allume);
    c.save(); c.translate(0, -up);
    // 1) fond : ville du soir par la fenêtre (fenêtres qui s'allument une à une), mur à papier peint, étagère, cadre, horloge
    clipRect(F.x0, F.y0, F.x1, F.y1, () => {
      put(K.saVille);
      SAW.forEach(([x, y], i) => { const ph = hash(i * 3.7), on = ((g * 0.05 + ph) % 1) < 0.42 + 0.3 * hash(i * 1.3); if (on) { fillPts(rect(x, y, x + 7, y + 10), i % 5 ? 'rgba(242,199,106,0.85)' : 'rgba(200,220,240,0.75)', 0, 0); } });
    });
    put(K.saMur);
    M.voilage(t, { x: F.x0 - 22, y: F.y0 - 30, w: 74, h: 650, cote: 1, amp: 9, col: 'rgba(240,236,226,0.5)' });
    M.voilage(t + 2.1, { x: F.x1 - 52, y: F.y0 - 30, w: 74, h: 650, cote: -1, amp: 9, col: 'rgba(240,236,226,0.5)' });
    const hm = g / 60 * TAU / 12 + 2.2, mn = g / 60 * TAU + 0.6;
    strokePts([[H.x, H.y], [H.x + Math.sin(hm) * 22, H.y - Math.cos(hm) * 22]], '#2a2a2e', 3.4); strokePts([[H.x, H.y], [H.x + Math.sin(mn) * 32, H.y - Math.cos(mn) * 32]], '#2a2a2e', 2.2);
    strokePts([[H.x, H.y], [H.x + Math.sin(g * TAU / 60) * 34, H.y - Math.cos(g * TAU / 60) * 34]], '#8E2B22', 1); dot(H.x, H.y, 3, '#2a2a2e');
    // 2) intermédiaire : meuble télé, télé, console, canapé, lampe ; lueur de la télé qui palpite ; lampe et poussière ; chat
    put(K.saMil, 0.3);
    NIN.tele(SA.tele.x, SA.tele.y, 1, { allume: al, jeu: tv.jeu, t });
    NIN.console(SA.console.x, SA.console.y, 1, { t });
    if (o.chat != null) { const u = clamp(o.chat), x = lerp(660, 250, u), k = smooth(0, 0.08, u) * (1 - smooth(0.92, 1, u)); c.save(); c.globalAlpha = k; chatGris(x, SA.chatY + 4, g, -1); c.restore(); }
    const L = SA.lampe, li = o.lampe == null ? 1 : clamp(o.lampe);
    if (li > 0) {
      glow(L.x, L.y, 260, '255,214,150', 0.22 * li); glow(L.x, L.y + 10, 70, '255,236,190', 0.35 * li);
      c.save(); c.beginPath(); c.moveTo(L.x - 44, L.y + 30); c.lineTo(L.x + 44, L.y + 30); c.lineTo(L.x + 170, BACK); c.lineTo(L.x - 170, BACK); c.closePath();
      c.globalCompositeOperation = 'lighter'; c.fillStyle = grad(c, 0, L.y, 0, BACK, [[0, `rgba(255,220,160,${0.12 * li})`], [1, 'rgba(255,220,160,0)']]); c.fill(); c.clip();
      M.poussiere(t, { x: L.x - 170, y: L.y + 30, w: 340, h: BACK - L.y - 30, n: 40, a: 0.7 * li, seed: 1291 }); c.restore();
    }
    if (al > 0) {
      const pul = 0.75 + 0.25 * M.noise(g * 2.3, 7) + 0.1 * Math.sin(g * 9), tx = SA.tele.x, ty = 1150;
      glow(tx, ty, 420, '120,190,240', 0.11 * al * pul); glow(tx + 220, 1260, 260, '120,190,240', 0.08 * al * pul);
    }
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(70,80,120,0.22)'; c.fillRect(0, 150, W, BACK - 144); c.restore();     // soir
    c.restore();
  };
  function makeSaSol() {
    return ombre(lay(46, 1180, 1034, 1500, (c) => {
      const T = SA.tapis;
      pc(ell(T.x, T.y, 250, 24, 30), '#b08a3e', () => { strokePts(ell(T.x, T.y, 220, 18, 30), 'rgba(110,70,20,0.5)', 2, true); strokePts(ell(T.x, T.y, 150, 12, 30), 'rgba(142,43,34,0.5)', 3, true); strokePts(ell(T.x, T.y, 70, 6, 30), 'rgba(110,70,20,0.5)', 2, true); }, 1301, { texA: 0.6 });
      pc(rrect(690, 1406, 760, 1446, 12), '#c49a3a', () => { dot(725, 1426, 3, 'rgba(0,0,0,0.3)'); strokePts([[696, 1414], [754, 1412]], 'rgba(255,255,255,0.25)', 2); }, 1302);          // coussin tombé
      const Tb = SA.tableBasse;                                                                                                                  // table basse + verre de jus
      pc(rect(Tb.x0, Tb.dessus, Tb.x1, Tb.dessus + 12), '#c9a77c', () => strokePts([[Tb.x0, Tb.dessus + 3], [Tb.x1, Tb.dessus + 3]], 'rgba(255,240,210,0.5)', 1.4), 1303);
      for (const x of [Tb.x0 + 8, Tb.x1 - 16]) pc(rect(x, Tb.dessus + 12, x + 8, 1446), '#8a6a4a', null, 1304);
      pc([[842, Tb.dessus - 46], [866, Tb.dessus - 46], [863, Tb.dessus], [845, Tb.dessus]], 'rgba(230,240,245,0.55)', () => { fillPts([[843, Tb.dessus - 30], [865, Tb.dessus - 30], [863, Tb.dessus], [845, Tb.dessus]], '#e0902a', 0, 0); strokePts([[848, Tb.dessus - 42], [848, Tb.dessus - 6]], 'rgba(255,255,255,0.7)', 1.4); }, 1305);
      strokePts([[858, Tb.dessus - 30], [870, Tb.dessus - 64]], '#c0392e', 2.4);
      pc([[884, Tb.dessus - 6], [912, Tb.dessus - 8], [914, Tb.dessus], [882, Tb.dessus]], '#3a5a7a', null, 1306);                               // livre posé
      pc([[935, 1340], [1010, 1340], [1000, 1446], [945, 1446]], '#b5653a', () => { strokePts([[938, 1352], [1008, 1352]], 'rgba(0,0,0,0.3)', 2); hatch(null, 0.8, 4, 0.2); }, 1307);   // pot de la monstera
    }), 8);
  }
  function monstera(g) {                                     // feuilles découpées qui balancent (temps global)
    const c = cx_(), lv = [[972, 1340, -1.2, 1.0], [972, 1340, -0.55, 1.1], [972, 1340, 0.05, 0.95], [972, 1340, -1.75, 0.85], [972, 1340, 0.55, 0.8]];
    lv.forEach(([x, y, a0, s], i) => {
      const a = a0 + 0.05 * Math.sin(g * 1.1 + i * 1.7), L = 150 * s; s *= 0.8;
      c.save(); c.translate(x, y); c.rotate(a);
      strokePts([[0, 0], [0, -L * 0.6]], '#3e5a34', 3);
      c.translate(0, -L * 0.6);
      pc(ell(0, -L * 0.3, 52 * s, 62 * s, 18), i % 2 ? '#3f6a3a' : '#4a7a42', () => {
        strokePts([[0, 20 * s], [0, -L * 0.62]], 'rgba(200,230,170,0.5)', 1.4);
        for (let k = -2; k <= 2; k++) if (k) { const yy = -L * 0.3 + k * 18 * s; fillPts([[k > 0 ? 60 : -60, yy - 6], [k > 0 ? 16 : -16, yy], [k > 0 ? 60 : -60, yy + 5]], '#1e3a1e', 0, 0); }
      }, 1320 + i, { texA: 0.4 });
      c.restore();
    });
  }
  NIN.salonSol = function (t, o) {
    o = o || {}; const c = cx_(), up = o.up || 0;
    c.save(); c.translate(0, -up); put(K.saSol, 0.3); monstera(M.tg(t));
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(70,80,120,0.18)'; c.fillRect(0, 1180, W, 320); c.restore();
    c.restore();
  };

  // =====================================================================
  // LIEU 2 — TRIPOT DE KYOTO, années 1880, le soir (plans 2 et 3)
  // =====================================================================
  const TR = { table: { x0: 400, x1: 680, cx: 540, dessus: 1270 }, shoji: { x0: 345, x1: 595, y0: 490, y1: 1300 }, porte: { x0: 790, x1: 965, y0: 500, y1: BACK },
    fenetre: { cx: 240, cy: 640, r: 86 }, kakejiku: { x0: 650, x1: 734, y0: 500, y1: 880 }, paravent: { x0: 120, x1: 262, y0: 930 },
    andon: { x: 905, y: 1440, flamme: [905, 1318] }, hibachi: { x: 190, y: 1440, bec: [226, 1300] }, sake: { x: 644, y: 1270 }, coupelle: { x: 606, y: 1270 }, jetons: { x: 444, y: 1270 } };
  NIN.TRIPOT = TR;
  function makeTrRuelle() {
    return lay(46, 400, 1034, BACK + 6, (c) => {
      c.fillStyle = grad(c, 0, 400, 0, BACK, [[0, '#0e1428'], [0.5, '#1c2644'], [1, '#2a2a3a']]); c.fillRect(46, 400, 988, BACK - 394);
      for (let i = 0; i < 30; i++) dot(60 + hash(i * 2.9) * 960, 410 + hash(i * 6.1) * 200, 1 + hash(i), 'rgba(230,226,210,0.6)');
      maisonBois(110, 250, 590, 900, 21, false); maisonBois(250, 380, 610, 900, 22, false);
      maisonBois(800, 900, 620, 1300, 23, false); maisonBois(900, 1000, 600, 1300, 24, false);
      fillPts(rect(790, 1300, 980, BACK + 6), '#1a1612', 0, 0);
    });
  }
  function makeTrMur() {
    return lay(46, 150, 1034, BACK + 6, (c) => {
      const S = TR.shoji, P = TR.porte, Fe = TR.fenetre, Kk = TR.kakejiku;
      planches(46, 150, 1034, BACK + 6, 46, '#3e2c1e', 201);
      c.fillStyle = grad(c, 0, 150, 0, BACK, [[0, 'rgba(0,0,0,0.45)'], [0.4, 'rgba(0,0,0,0.1)'], [1, 'rgba(0,0,0,0.35)']]); c.fillRect(46, 150, 988, BACK - 144);
      for (const y of [150, 210]) pc(rect(46, y, 1034, y + 30), '#24180f', () => strokePts([[46, y + 6], [1034, y + 6]], 'rgba(255,220,170,0.15)', 1.4), 2001);
      // ramma (imposte ajourée à vagues) au-dessus de la poutre nageshi
      pc(rect(345, 380, 777, 470), '#2a1c12', () => { for (let x = 350; x < 777; x += 46) for (let k = 0; k < 2; k++) strokePts(ep(x + 20, 440 - k * 26, 20, 14, 10, PI, TAU), 'rgba(230,190,120,0.45)', 2.2); }, 2002);
      pc(rect(46, 470, 1034, 492), '#24180f', () => strokePts([[46, 474], [1034, 474]], 'rgba(255,220,170,0.2)', 1.2), 2003);
      // shoji éclairé de l'intérieur
      c.fillStyle = grad(c, S.x0, 0, S.x1, 0, [[0, '#d9c497'], [0.5, '#f0e2b8'], [1, '#d9c497']]); c.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
      pc(rect(S.x0, S.y1, S.x1, BACK + 6), '#2e2016', () => { for (let x = S.x0 + 20; x < S.x1; x += 40) strokePts([[x, S.y1 + 4], [x, BACK]], 'rgba(255,220,170,0.15)', 1); }, 2004);
      // tokonoma : niche, rouleau peint (paysage, aucun idéogramme), vase
      fillPts(rect(607, 492, 777, 1300), '#2a1e14', 0, 0);
      pc(rect(607, 1250, 777, 1300), '#1a1210', () => strokePts([[607, 1253], [777, 1253]], 'rgba(255,220,170,0.25)', 1.4), 2005);
      pc(rect(Kk.x0 - 6, Kk.y0, Kk.x1 + 6, Kk.y1), '#6a5a3a', () => {
        fillPts(rect(Kk.x0, Kk.y0 + 40, Kk.x1, Kk.y1 - 40), '#e8dcc0', 0, 0);
        for (const [x, y, w, h, a] of [[Kk.x0 + 10, 760, 60, 90, 0.5], [Kk.x0 + 30, 700, 50, 120, 0.35], [Kk.x0 + 46, 790, 40, 60, 0.6]]) fillPts([[x - w / 2, y + h / 2], [x, y - h / 2], [x + w / 2, y + h / 2]], `rgba(60,64,70,${a})`, 0, 0.5);
        fillPts(rect(Kk.x0, 780, Kk.x1, 800), 'rgba(232,220,192,0.8)', 0, 0);
        strokePts([[Kk.x0 + 52, 640], [Kk.x0 + 58, 600], [Kk.x0 + 52, 580]], 'rgba(40,40,40,0.7)', 2); for (const [x, y] of [[Kk.x0 + 46, 598], [Kk.x0 + 60, 586], [Kk.x0 + 52, 574]]) fillPts(ell(x, y, 12, 5, 8), 'rgba(40,60,40,0.6)', 0, 0);
        fillPts([[Kk.x0 + 20, 822], [Kk.x0 + 40, 822], [Kk.x0 + 36, 828], [Kk.x0 + 24, 828]], 'rgba(40,40,40,0.7)', 0, 0); strokePts([[Kk.x0 + 30, 822], [Kk.x0 + 30, 806]], 'rgba(40,40,40,0.7)', 1);
        fillPts(ell(Kk.x1 - 20, Kk.y0 + 70, 10, 10, 12), 'rgba(180,60,40,0.7)', 0, 0);
      }, 2006);
      for (const y of [Kk.y0, Kk.y1]) pc(rect(Kk.x0 - 12, y - 6, Kk.x1 + 12, y + 6), '#1a1210', null, 2007);
      strokePts([[Kk.x0 + 10, Kk.y0], [(Kk.x0 + Kk.x1) / 2, 470], [Kk.x1 - 10, Kk.y0]], '#1a1210', 1.2);
      pc([[680, 1250], [704, 1250], [710, 1214], [700, 1190], [684, 1190], [674, 1214]], '#3a4a5a', () => strokePts([[684, 1200], [682, 1240]], 'rgba(255,255,255,0.25)', 2), 2008);
      strokePts(qbez([692, 1190], [700, 1120], [736, 1080], 8), '#3a2a1a', 2.4); for (const [x, y] of [[712, 1110], [728, 1090], [702, 1140], [740, 1076]]) fleur5(x, y, 6, '#e8dcc8', '#c9a24a');
      // fenêtre ronde sur la ruelle, porte coulissante (découpées : la ruelle pré-rendue est derrière)
      cut(c, ell(Fe.cx, Fe.cy, Fe.r, Fe.r, 40)); cut(c, rect(P.x0, P.y0, P.x1, P.y1 + 8));
      strokePts(ell(Fe.cx, Fe.cy, Fe.r + 4, Fe.r + 4, 40), '#8a7a4a', 7, true); strokePts(ell(Fe.cx, Fe.cy, Fe.r + 9, Fe.r + 9, 40), '#24180f', 4, true);
      for (const x of [-40, 0, 40]) strokePts([[Fe.cx + x, Fe.cy - Math.sqrt(Fe.r * Fe.r - x * x)], [Fe.cx + x, Fe.cy + Math.sqrt(Fe.r * Fe.r - x * x)]], '#6a5a3a', 2.4);
      // poteaux
      for (const [x0, x1] of [[118, 134], [333, 345], [595, 607], [777, 790], [965, 982]]) pc(rect(x0, 150, x1, BACK + 6), '#22160d', () => strokePts([[x0 + 3, 150], [x0 + 3, BACK]], 'rgba(255,220,170,0.15)', 1.2), 2010);
      pc(rect(P.x0 - 4, P.y0 - 14, P.x1 + 4, P.y0), '#22160d', null, 2011);
    });
  }
  function makeTrShoji() {
    const S = TR.shoji;
    return lay(S.x0, S.y0, S.x1, S.y1, (c) => {
      for (let x = S.x0; x <= S.x1; x += 42) strokePts([[x, S.y0], [x, S.y1]], '#3a2a1e', x === S.x0 || x > S.x1 - 4 ? 8 : 2.6);
      for (let y = S.y0; y <= S.y1; y += 58) strokePts([[S.x0, y], [S.x1, y]], '#3a2a1e', 2.6);
      strokePts([[(S.x0 + S.x1) / 2, S.y0], [(S.x0 + S.x1) / 2, S.y1]], '#2a1c12', 7);
      strokePts(rect(S.x0 + 2, S.y0 + 2, S.x1 - 2, S.y1 - 2), '#2a1c12', 6, true);
    });
  }
  function makeTrPorte() {
    const P = TR.porte, w = P.x1 - P.x0;
    return lay(0, 0, w, P.y1 - P.y0 + 8, (c) => {
      pc(rect(0, 0, w, P.y1 - P.y0 + 8), '#2e2016', () => {
        fillPts(rect(10, 10, w - 10, P.y1 - P.y0 - 140), '#c8b88e', 0, 0);
        for (let x = 10; x < w; x += 39) strokePts([[x, 10], [x, P.y1 - P.y0 - 140]], '#2e2016', 2.4);
        for (let y = 10; y < P.y1 - P.y0 - 140; y += 56) strokePts([[10, y], [w - 10, y]], '#2e2016', 2.4);
        fillPts(rect(10, P.y1 - P.y0 - 130, w - 10, P.y1 - P.y0 - 4), '#3a2a1e', 0, 0); fillPts(ell(26, 440, 6, 16, 12), '#14100c', 0, 0);
      }, 2020);
    });
  }
  function makeTrMil() {
    return ombre(lay(46, 960, 1034, BACK + 6, (c) => {
      // tatamis (bords noirs) au fond, en perspective
      c.fillStyle = '#a89858'; c.fillRect(46, 1330, 988, BACK - 1330 + 6);
      for (let x = 46; x < 1034; x += 180) { strokePts([[x, 1330], [x - 20, BACK + 6]], '#1a1410', 5); }
      strokePts([[46, 1333], [1034, 1333]], '#1a1410', 5); for (let y = 1340; y < BACK; y += 8) strokePts([[46, y], [1034, y]], 'rgba(90,80,40,0.35)', 0.8);
      // paravent (byōbu) à vagues
      const Pv = TR.paravent, n = 3, pw = (Pv.x1 - Pv.x0) / n;
      for (let i = 0; i < n; i++) {
        const x0 = Pv.x0 + i * pw, sk = i % 2 ? -10 : 10;
        pc([[x0, Pv.y0 + (i % 2 ? 10 : 0), 1], [x0 + pw, Pv.y0 + (i % 2 ? 0 : 10), 1], [x0 + pw, BACK, 1], [x0, BACK, 1]], '#1a1210', () => {
          fillPts(rect(x0 + 5, Pv.y0 + 14, x0 + pw - 5, BACK - 8), i % 2 ? '#b09048' : '#c8a85a', 0, 0);
          for (let k = 0; k < 5; k++) { const y = 1150 + k * 46; fillPts([[x0 + 5, y + 30]].concat(ep(x0 + pw * 0.5, y + 22, pw * 0.5, 20, 10, PI, TAU), [[x0 + pw - 5, y + 30], [x0 + pw - 5, BACK - 8], [x0 + 5, BACK - 8]]), k % 2 ? '#2f4a6a' : '#3a5a7c', 0, 0); for (let j = 0; j < 3; j++) strokePts(ep(x0 + 10 + j * 14, y + 16, 7, 6, 6, PI, TAU * 0.95), 'rgba(240,236,220,0.8)', 1.4); }
          shade(x0, 0, x0 + pw, 0, i % 2 ? 0.3 : 0.12, [x0, Pv.y0, x0 + pw, BACK]); void sk;
        }, 2101 + i);
      }
      // chabudai (table basse ronde laquée) : dessus y 1270
      const T = TR.table;
      for (const x of [T.x0 + 46, T.x1 - 56]) pc(rect(x, T.dessus + 12, x + 12, 1340), '#3a1a10', null, 2110);
      pc(ell(T.cx, T.dessus, (T.x1 - T.x0) / 2, 18, 36).concat([]), '#6a3220', () => { strokePts(ep(T.cx, T.dessus, (T.x1 - T.x0) / 2 - 10, 12, 18, PI * 1.1, PI * 1.6), 'rgba(255,220,180,0.3)', 2); }, 2111);
      pc([[T.x0, T.dessus], [T.x1, T.dessus]].concat(ep(T.cx, T.dessus, (T.x1 - T.x0) / 2, 18, 18, 0, PI).map((p) => [p[0], p[1] + 14]).reverse().reverse()), '#4a2216', null, 2112);
      // saké : bouteille tokkuri + coupelles, plateau de jetons (pièces percées)
      pc([[634, T.dessus], [654, T.dessus], [660, T.dessus - 26], [651, T.dessus - 44], [651, T.dessus - 56], [637, T.dessus - 56], [637, T.dessus - 44], [628, T.dessus - 26]], '#e6dcc4', () => { fillPts(rect(626, T.dessus - 24, 662, T.dessus - 18), '#3a5a7a', 0, 0); strokePts([[634, T.dessus - 40], [632, T.dessus - 8]], 'rgba(255,255,255,0.5)', 1.6); }, 2113);
      pc([[664, T.dessus], [682, T.dessus], [686, T.dessus - 12], [660, T.dessus - 12]], '#e6dcc4', null, 2114);
      pc([[420, T.dessus], [474, T.dessus], [480, T.dessus - 10], [414, T.dessus - 10]], '#3a2216', () => { for (const [x, y] of [[428, -14], [440, -16], [452, -14], [446, -20], [462, -15], [434, -20]]) { fillPts(ell(x, T.dessus + y, 6, 3, 10), '#a8743a', 0, 0); fillPts(rect(x - 1.5, T.dessus + y - 1, x + 1.5, T.dessus + y + 1), '#2a1a10', 0, 0); } }, 2115);
      for (const [x, y] of [[428, -14], [440, -16], [452, -14], [446, -20], [462, -15], [434, -20], [458, -22]]) { fillPts(ell(x, T.dessus + y, 6, 3, 10), '#b8843a', 0, 0); fillPts(rect(x - 1.5, T.dessus + y - 1, x + 1.5, T.dessus + y + 1), '#2a1a10', 0, 0); }
      // zabutons empilés près de la porte
      for (let k = 0; k < 3; k++) pc(rrect(748, BACK - 18 - k * 16, 852, BACK - 4 - k * 16, 6), k % 2 ? '#5a2a3a' : '#4a3a5a', () => dot(800, BACK - 11 - k * 16, 2, 'rgba(0,0,0,0.4)'), 2120 + k);
    }), 8);
  }
  function chatOmbre(x, y, g) {                              // chat noir en ombre chinoise derrière le shoji (≈ 200 px de haut)
    const c = cx_(), ph = g * 6; c.save(); c.translate(x, y); c.fillStyle = 'rgba(46,30,20,0.78)';
    c.beginPath(); c.ellipse(0, -74, 84, 30, 0, 0, TAU); c.fill();
    for (const [lx, o] of [[-62, 0], [-44, PI], [46, PI * 0.5], [64, PI * 1.5]]) { const a = 0.4 * Math.sin(ph + o); c.save(); c.translate(lx, -60); c.rotate(a); c.fillRect(-7, 0, 14, 60); c.restore(); }
    c.beginPath(); c.arc(92, -104, 28, 0, TAU); c.fill();
    M.path([[72, -120, 1], [76, -152, 1], [92, -128, 1]], 0, 0); c.fill(); M.path([[96, -128, 1], [112, -154, 1], [118, -118, 1]], 0, 0); c.fill();
    c.lineWidth = 13; c.lineCap = 'round'; c.strokeStyle = c.fillStyle; c.beginPath(); c.moveTo(-80, -84); c.quadraticCurveTo(-136, -110 + 10 * Math.sin(g * 2), -118, -186); c.stroke();
    c.restore();
  }
  function lanterneRouge(x, y, g, i) {                       // lanterne de papier rouge qui balance, flamme à l'intérieur
    const c = cx_(), a = 0.12 * Math.sin(g * 1.3 + i * 1.9);
    c.save(); c.translate(x, y); c.rotate(a);
    strokePts([[0, -30], [0, -6]], '#0a0a0a', 1.2);
    pc(ell(0, 18, 14, 22, 16), '#b8322a', () => { for (let k = -2; k <= 2; k++) strokePts([[-14, 18 + k * 8], [14, 18 + k * 8]], 'rgba(60,10,6,0.5)', 0.8); }, 2200 + i, { drop: false });
    fillPts(rect(-8, -6, 8, -2), '#111', 0, 0); fillPts(rect(-8, 38, 8, 42), '#111', 0, 0);
    c.restore();
    glow(x + Math.sin(a) * 18, y + 18, 46, '255,120,60', 0.35);
  }
  NIN.tripot = function (t, up, o) {
    o = o || {}; up = up || 0;
    const c = cx_(), g = M.tg(t), S = TR.shoji, P = TR.porte, Fe = TR.fenetre;
    c.save(); c.translate(0, -up);
    // 1) fond : ruelle nocturne (toits noirs, lanternes rouges qui balancent), mur de bois, shoji éclairé, tokonoma, fenêtre ronde, porte
    put(K.trRuelle);
    for (const [x, y, i] of [[180, 600, 0], [250, 640, 1], [312, 606, 2], [850, 700, 3], [930, 740, 4]]) lanterneRouge(x, y, g, i);
    strokePts(qbez([140, 590], [240, 650], [340, 596]), 'rgba(10,10,10,0.8)', 1);
    put(K.trMur);
    clipRect(S.x0, S.y0, S.x1, S.y1, () => {
      glow((S.x0 + S.x1) / 2, 900, 300, '255,200,120', 0.08 + 0.03 * Math.sin(g * 3.1) + 0.02 * Math.sin(g * 11));
      if (o.chat != null) { const u = clamp(o.chat); chatOmbre(lerp(S.x0 - 160, S.x1 + 160, u), 1240, g); }
    });
    put(K.trShoji);
    { const a = 0.05 * Math.sin(g * 0.9), lx = 540, ly = 330; c.save(); c.translate(lx, 150); c.rotate(a); c.translate(-lx, -150); strokePts([[lx, 150], [lx, ly]], '#111', 1.4);
      pc(ell(lx, ly + 44, 34, 46, 18), '#efe0b4', () => { for (let k = -4; k <= 4; k++) strokePts([[lx - 34, ly + 44 + k * 10], [lx + 34, ly + 44 + k * 10]], 'rgba(90,60,30,0.4)', 0.9); }, 2240, { drop: false });
      fillPts(rect(lx - 16, ly - 4, lx + 16, ly + 2), '#1a1210', 0, 0); fillPts(rect(lx - 16, ly + 86, lx + 16, ly + 92), '#1a1210', 0, 0); c.restore();
      glow(lx, ly + 44, 200, '255,200,120', 0.16 + 0.03 * Math.sin(g * 7)); }
    // porte coulissante : porte 0 fermée → 1 ouverte (le panneau glisse vers la droite, derrière le poteau)
    const po = clamp(o.porte || 0);
    clipRect(P.x0, P.y0, P.x1 + 2, P.y1 + 8, (cc) => { cc.drawImage(K.trPorte, P.x0 + po * (P.x1 - P.x0 + 4), P.y0); });
    // 2) intermédiaire : paravent, chabudai, saké, jetons, zabutons ; coupelle (renverse 0..1)
    put(K.trMil, 0.3);
    const T = TR.table, rv = clamp(o.renverse || 0), cpx = TR.coupelle.x;
    c.save(); c.translate(cpx + 10 * rv, T.dessus - 2 * rv); c.rotate(1.45 * ease(rv));
    pc([[-11, 0], [11, 0], [14, -12], [-14, -12]], '#e6dcc4', () => fillPts(rect(-12, -12, 12, -8), 'rgba(220,230,240,0.7)', 0, 0), 2230); c.restore();
    if (rv > 0.3) fillPts(ell(cpx + 26 + 30 * rv, T.dessus - 3, 26 * rv, 3 * rv, 14), 'rgba(220,230,240,0.55)', 0, 0);
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(60,40,70,0.28)'; c.fillRect(0, 150, W, BACK - 144); c.restore();      // soir
    glow(T.cx, 1180, 420, '255,180,100', 0.07);
    void Fe;
    c.restore();
  };
  function makeTrSol() {
    return ombre(lay(46, 1180, 1034, 1500, (c) => {
      const H = TR.hibachi, A = TR.andon;
      // hibachi (brasero de céramique) + bouilloire de fonte
      pc([[H.x - 64, H.y - 100], [H.x + 64, H.y - 100], [H.x + 58, H.y - 6], [H.x + 44, H.y, 1], [H.x - 44, H.y, 1], [H.x - 58, H.y - 6]], '#4a5a6a', () => { strokePts(ep(H.x, H.y - 56, 50, 16, 16, PI * 0.1, PI * 0.9), 'rgba(230,236,240,0.5)', 2); for (let k = 0; k < 6; k++) fillPts(ell(H.x - 40 + k * 16, H.y - 70, 5, 3, 8), 'rgba(230,236,240,0.4)', 0, 0); shade(H.x - 60, 0, H.x + 60, 0, 0.3, [H.x - 70, H.y - 110, H.x + 70, H.y]); }, 2301);
      fillPts(ell(H.x, H.y - 100, 62, 8, 20), '#2a1e18', 0, 0);
      pc([[H.x - 34, H.y - 104], [H.x + 34, H.y - 104], [H.x + 40, H.y - 126], [H.x + 26, H.y - 140], [H.x - 26, H.y - 140], [H.x - 40, H.y - 126]], '#2a2626', () => { for (let k = -2; k <= 2; k++) for (let j = 0; j < 2; j++) dot(H.x + k * 12, H.y - 128 + j * 10, 2, 'rgba(255,255,255,0.12)'); }, 2302);
      pc([[H.x + 34, H.y - 126], [H.x + 52, H.y - 142], [H.x + 56, H.y - 138], [H.x + 40, H.y - 118]], '#2a2626', null, 2303);
      strokePts(ep(H.x, H.y - 140, 30, 30, 12, PI, TAU), '#1a1616', 3);
      // andon (lanterne de papier sur pied)
      pc(rect(A.x - 34, A.y - 210, A.x + 34, A.y - 70), '#efe0b4', () => { strokePts([[A.x, A.y - 210], [A.x, A.y - 70]], '#3a2a1e', 2); for (let y = A.y - 180; y < A.y - 70; y += 36) strokePts([[A.x - 34, y], [A.x + 34, y]], '#3a2a1e', 1.6); }, 2310, { texA: 0.4 });
      for (const x of [A.x - 36, A.x + 30]) pc(rect(x, A.y - 214, x + 6, A.y), '#2a1c12', null, 2311);
      pc(rect(A.x - 40, A.y - 218, A.x + 40, A.y - 210), '#2a1c12', null, 2312); pc(rect(A.x - 40, A.y - 74, A.x + 40, A.y - 66), '#2a1c12', null, 2313);
      // sandales (geta, zori) en désordre
      for (const [x, y, a, col] of [[300, 1452, 0.15, '#8a6a3a'], [344, 1456, -0.25, '#8a6a3a'], [392, 1450, 0.4, '#5a4a2a']]) {
        c.save(); c.translate(x, y); c.rotate(a); pc(rrect(-26, -6, 26, 4, 3), col, () => strokePts([[-6, -4], [4, -8], [14, -4]], '#1a1616', 2), 2320); c.restore();
      }
    }), 8);
  }
  NIN.tripotSol = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), up = o.up || 0, A = TR.andon, H = TR.hibachi;
    c.save(); c.translate(0, -up);
    put(K.trSol, 0.3);
    glow(A.x, A.y - 140, 120, '255,200,120', 0.28 + 0.04 * Math.sin(g * 9)); M.flamme(t, { x: A.flamme[0], y: A.flamme[1], s: 0.7, r: 160, seed: 2401 });
    fillPts(ell(H.x, H.y - 100, 50, 6, 16), `rgba(230,100,40,${0.5 + 0.2 * Math.sin(g * 4)})`, 0, 0);
    M.fumee(t, { x: H.bec[0] + 28, y: H.bec[1] - 2, s: 0.5, n: 6, haut: 260, vent: 40, col: '#e6e0d4', a: 0.5, per: 2.8, seed: 2402 });
    const mx = A.x + 46 * Math.cos(g * 2.6) + 10 * Math.sin(g * 7), my = A.y - 150 + 30 * Math.sin(g * 3.9), fl = Math.abs(Math.sin(g * 26));    // papillon de nuit
    if (!M._sil()) { fillPts([[mx, my], [mx - 9, my - 7 * fl - 2], [mx - 11, my + 3]], 'rgba(200,184,150,0.9)', 0, 0); fillPts([[mx, my], [mx + 9, my - 7 * fl - 2], [mx + 11, my + 3]], 'rgba(220,204,170,0.9)', 0, 0); dot(mx, my, 1.8, '#4a3a2a'); }
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(60,40,70,0.2)'; c.fillRect(0, 1180, W, 320); c.restore();
    c.restore();
  };

  // =====================================================================
  // LIEU 3 — ATELIER-BOUTIQUE DE YAMAUCHI, Kyoto (plans 4, 5, 6) ; epoque 1889 | 1960 | 1977
  // =====================================================================
  const AT = { ouverture: { x0: 132, x1: 418, y0: 420, y1: BACK, sol: BACK }, vitrine: { x0: 140, x1: 258 }, porte: { x0: 262, x1: 418 }, linteau: { x0: 132, x1: 418, y: 890 },
    noren: { x0: 264, x1: 416, y0: 900, y1: 1080 }, etabli: { x0: 520, x1: 820, dessus: 1180, libre: [600, 730] }, comptoir: { x0: 132, x1: 300, dessus: 1220 },
    fils: [{ y: 300, x0: 450, x1: 905 }, { y: 432, x0: 450, x1: 905 }], lanterne: { x: 470, y: 600 }, ampoule: { x: 650, y: 650 }, etagere: { x0: 850, x1: 1004, y: [780, 920, 1060] },
    piles: [870, 940], furin: { x: 404, y: 900 }, bouilloire: { x: 478, y: BACK }, etagere2: { x0: 600, x1: 820, y: 900 } };
  NIN.ATELIER = AT;
  AT.feuilles = [];
  for (let l = 0; l < 2; l++) for (let i = 0; i < 5; i++) { const F = AT.fils[l], x = lerp(F.x0 + 46, F.x1 - 46, i / 4) + (l ? 22 : 0); AT.feuilles.push({ x, y: F.y + 8 * Math.sin(PI * (x - F.x0) / (F.x1 - F.x0)), l, i }); }
  function kimonoPassants(t, o) {                            // passants en kimono et chapeau de paille (ombres pâlies), qui traversent la rue
    const g = M.tg(t), c = cx_(), n = o.n || 3, per = o.per || 12, R = M.rng(o.seed || 3);
    for (let i = 0; i < n; i++) {
      const sens = R() < 0.5 ? 1 : -1, off = R() * per, kind = R(), u = (((g + off) % per) + per) % per / per;
      if (u > 0.9) continue;
      const x = sens > 0 ? lerp(o.x0, o.x1, u / 0.9) : lerp(o.x1, o.x0, u / 0.9), s = o.s, pas = Math.sin(g * 6 + i * 2), col = o.col || 'rgba(60,52,60,0.55)';
      c.save(); c.translate(x, o.y - Math.abs(pas) * 2 * s); c.scale(sens * s, s); c.fillStyle = col;
      M.path([[-26, -300], [26, -300], [34, -40], [26, 0], [-26, 0], [-34, -40]], 0, 0); c.fill();
      c.fillRect(-24, -6, 18, 8); c.fillRect(6 + pas * 6, -6, 18, 8);
      c.beginPath(); c.arc(4, -330, 24, 0, TAU); c.fill();
      if (kind < 0.45) { M.path([[-50, -340], [4, -380], [58, -340]], 0, 0); c.fill(); }
      else if (kind < 0.75) { c.beginPath(); c.arc(4, -350, 12, 0, TAU); c.fill(); }
      else { c.fillRect(30, -330, 4, 120); M.path([[-40, -330], [32, -400], [100, -330]], 0, 0); c.fill(); }
      c.restore();
    }
  }
  function makeAtRue(moderne) {
    const O = AT.ouverture;
    return lay(O.x0 - 10, O.y0, O.x1 + 10, O.y1 + 6, (c) => {
      c.fillStyle = grad(c, 0, O.y0, 0, 1100, [[0, '#a9c8d6'], [0.6, '#d8e2dc'], [1, '#efe6cc']]); c.fillRect(O.x0 - 10, O.y0, 310, 1000);
      fillPts([[O.x0 - 10, 760], [180, 690], [260, 710], [330, 660], [430, 720], [430, 900], [O.x0 - 10, 900]], '#8a9a8e', 0, 0.4);     // colline
      const px = 352, py = 700;                                                                                                       // pagode lointaine à cinq toits
      for (let k = 0; k < 5; k++) { const w = 40 - k * 5, y = py - k * 26; fillPts([[px - w, y], [px - w * 0.6, y - 8], [px + w * 0.6, y - 8], [px + w, y]], '#5a6670', 0, 0); fillPts(rect(px - w * 0.45, y, px + w * 0.45, y + 18), '#6a7680', 0, 0); }
      strokePts([[px, py - 130], [px, py - 170]], '#5a6670', 2.4);
      maisonBois(O.x0 - 10, 250, 760, 1300, 31, true); maisonBois(250, O.x1 + 10, 740, 1300, 32, true);
      fillPts(rect(O.x0 - 10, 1300, O.x1 + 10, O.y1 + 6), '#b8a684', 0, 0); strokePts([[O.x0 - 10, 1310], [O.x1 + 10, 1310]], 'rgba(80,60,40,0.5)', 2);
      for (let i = 0; i < 20; i++) dot(O.x0 + hash(i * 3.1) * 300, 1320 + hash(i * 5.3) * 70, 1.5, 'rgba(90,70,40,0.4)');
      if (moderne) {                                                                                                                  // poteaux et fils électriques
        for (const x of [190, 380]) { fillPts(rect(x - 4, 560, x + 4, 1300), '#4a3a2a', 0, 0); fillPts(rect(x - 22, 590, x + 22, 596), '#4a3a2a', 0, 0); }
        for (const y of [592, 610]) strokePts(qbez([O.x0 - 10, y + 8], [285, y + 30], [O.x1 + 10, y + 6]), 'rgba(30,30,30,0.8)', 1.2);
      }
    });
  }
  function makeAtMur() {
    return lay(46, 150, 1034, BACK + 6, (c) => {
      const O = AT.ouverture, E = AT.etagere;
      planches(46, 150, 1034, BACK + 6, 52, '#c9a979', 301);
      fillPts(rect(430, 470, 1034, 560), '#e3d9c2', 0, 0); strokePts([[430, 470], [1034, 470]], '#5a3a24', 3); strokePts([[430, 560], [1034, 560]], '#5a3a24', 3);
      c.fillStyle = grad(c, 0, 150, 0, BACK, [[0, 'rgba(40,20,0,0.35)'], [0.4, 'rgba(40,20,0,0.02)'], [1, 'rgba(40,20,0,0.22)']]); c.fillRect(46, 150, 988, BACK - 144);
      pc(rect(46, 150, 1034, 236), '#4a3020', () => { for (let x = 60; x < 1034; x += 70) strokePts([[x, 150], [x + 40, 236]], 'rgba(20,10,4,0.5)', 6); }, 3001);         // chevrons du toit
      pc(rect(46, 236, 1034, 258), '#3a2416', null, 3002);
      // râtelier d'outils (gouges, ciseaux à bois)
      pc(rect(456, 640, 574, 652), '#5a3a24', null, 3003);
      for (let k = 0; k < 8; k++) { const x = 466 + k * 14; pc(rect(x - 2, 652, x + 3, 700 + (k % 3) * 8), k % 2 ? '#8a6a4a' : '#7a5a3a', null, 3004); pc(rect(x - 1.5, 700 + (k % 3) * 8, x + 2.5, 716 + (k % 3) * 8), '#9a9a9e', null, 3005); }
      // épreuves de cartes épinglées au mur, étagère de planches gravées et de pots
      [['cerisier', 640], ['grue', 700], ['lune', 760]].forEach(([m, x], k) => { c.save(); c.translate(x, 700 + (k % 2) * 10); c.rotate((k - 1) * 0.06); c.scale(0.55, 0.55); NIN.OBJ.carte.draw({ motif: m }); c.restore(); dot(x, 668 + (k % 2) * 10, 3, '#3a2a1e'); });
      pc(rect(AT.etagere2.x0, AT.etagere2.y, AT.etagere2.x1, AT.etagere2.y + 12), '#7a5a3a', null, 3011);
      for (let k = 0; k < 4; k++) { c.save(); c.translate(AT.etagere2.x0 + 30 + k * 20, AT.etagere2.y); c.rotate(-0.12); c.scale(0.38, 0.38); NIN.OBJ.planche.draw({ vue: 'dessus', encre: k % 2 ? 0.5 : 0 }); c.restore(); }
      for (const [x, col] of [[740, '#8E2B22'], [770, '#1a1616'], [800, '#3e6a3a']]) pc([[x - 12, AT.etagere2.y, 1], [x + 12, AT.etagere2.y, 1], [x + 10, AT.etagere2.y - 34], [x - 10, AT.etagere2.y - 34]], '#c8b890', () => fillPts(rect(x - 10, AT.etagere2.y - 34, x + 10, AT.etagere2.y - 28), col, 0, 0), 3012);
      // étagère de boîtes à fleurs rouges
      for (const y of E.y) { pc(rect(E.x0, y, E.x1, y + 12), '#7a5a3a', () => strokePts([[E.x0, y + 3], [E.x1, y + 3]], 'rgba(255,230,190,0.35)', 1.2), 3010); }
      E.y.forEach((y, r) => { for (let k = 0; k < 2; k++) { c.save(); c.translate(E.x0 + 42 + k * 74, y); c.scale(0.44, 0.44); NIN.OBJ.boite.draw({ pile: 3 - ((r + k) % 2) }); c.restore(); } });
      // façade : découpe de l'ouverture sur la rue, poteaux, linteau, poutre haute
      cut(c, rect(O.x0, O.y0, O.x1, O.y1 + 8));
      for (const [x0, x1] of [[110, O.x0 + 2], [O.x1 - 2, 440]]) pc(rect(x0, 150, x1, BACK + 6), '#3a2416', () => strokePts([[x0 + 4, 150], [x0 + 4, BACK]], 'rgba(255,220,170,0.2)', 1.4), 3020);
      pc(rect(100, O.y0 - 24, 450, O.y0), '#3a2416', () => strokePts([[100, O.y0 - 18], [450, O.y0 - 18]], 'rgba(255,220,170,0.2)', 1.2), 3021);
      for (let x = O.x0 + 8; x < O.x1; x += 14) strokePts([[x, O.y0], [x, O.y0 + 90]], '#3a2416', 4);                                 // treillis haut (koshi)
      pc(rect(O.x0, O.y0 + 86, O.x1, O.y0 + 96), '#3a2416', null, 3022);
      pc(rect(O.x0 - 6, AT.linteau.y - 10, O.x1 + 6, AT.linteau.y + 10), '#3a2416', () => strokePts([[O.x0, AT.linteau.y - 6], [O.x1, AT.linteau.y - 6]], 'rgba(255,220,170,0.25)', 1.2), 3023);
      pc(rect(O.x0, O.y1 - 10, O.x1, O.y1 + 6), '#4a3020', null, 3024);                                                                     // seuil
    });
  }
  function makeAtMil(ep2) {
    return ombre(lay(46, 960, 1034, BACK + 6, (c) => {
      const Eb = AT.etabli, Cp = AT.comptoir;
      // établi bas d'imprimeur : planches gravées, pots d'encre rouge/noir/vert, pinceaux, pile de feuilles sur l'étagère basse
      for (const x of [Eb.x0 + 10, Eb.x1 - 26]) pc(rect(x, Eb.dessus + 18, x + 16, BACK + 2), '#6a4a2e', null, 3101);
      pc(rect(Eb.x0 + 10, 1318, Eb.x1 - 10, 1330), '#7a5a3a', null, 3102);
      for (let k = 0; k < 6; k++) pc(rect(Eb.x0 + 40 + k * 3, 1318 - 6 - k * 6, Eb.x0 + 190 + k * 2, 1318 - k * 6), k % 2 ? '#ede4cc' : '#e4dac0', null, 3103 + k);
      pc(rect(Eb.x0, Eb.dessus, Eb.x1, Eb.dessus + 20), '#a07850', () => { strokePts([[Eb.x0, Eb.dessus + 4], [Eb.x1, Eb.dessus + 4]], 'rgba(255,230,190,0.45)', 1.6); for (let k = 0; k < 5; k++) fillPts(ell(Eb.x0 + 120 + k * 40, Eb.dessus + 8, 10, 2, 8), 'rgba(140,40,30,0.35)', 0, 0); }, 3110);
      for (let k = 0; k < 3; k++) { c.save(); c.translate(Eb.x0 + 40, Eb.dessus - k * 30); c.scale(0.5, 1); NIN.OBJ.planche.draw({ vue: 'cote', encre: k === 0 ? 0.7 : 0 }); c.restore(); }
      c.save(); c.translate(Eb.x1 - 20, Eb.dessus - 2); c.rotate(-0.28); c.scale(0.55, 0.55); NIN.OBJ.planche.draw({ vue: 'dessus', encre: 0.6 }); c.restore();
      for (const [x, col] of [[748, '#8E2B22'], [772, '#1a1616'], [796, '#3e6a3a']]) { pc([[x - 10, Eb.dessus], [x + 10, Eb.dessus], [x + 12, Eb.dessus - 18], [x + 7, Eb.dessus - 24], [x - 7, Eb.dessus - 24], [x - 12, Eb.dessus - 18]], '#d8ccb0', () => fillPts(ell(x, Eb.dessus - 23, 7, 2.4, 8), col, 0, 0), 3120); }
      pc([[726, Eb.dessus], [740, Eb.dessus], [742, Eb.dessus - 30], [724, Eb.dessus - 30]], '#6a7a6a', null, 3121);
      for (let k = 0; k < 3; k++) { strokePts([[728 + k * 5, Eb.dessus - 30], [722 + k * 9, Eb.dessus - 74]], '#c8a870', 2); fillPts(ell(722 + k * 9, Eb.dessus - 78, 2.6, 6, 8), '#1a1616', 0, 0); }
      // comptoir de vente côté rue : soroban, petite balance, boîtes
      pc(rect(Cp.x0, Cp.dessus, Cp.x1, BACK + 2), '#5a3a24', () => { for (let x = Cp.x0 + 12; x < Cp.x1; x += 22) strokePts([[x, Cp.dessus + 18], [x, BACK]], 'rgba(20,10,4,0.45)', 2); fillPts(rect(Cp.x0, Cp.dessus, Cp.x1, Cp.dessus + 14), '#7a5234', 0, 0); }, 3130);
      pc(rect(150, Cp.dessus - 22, 232, Cp.dessus - 2), '#3a2416', () => { fillPts(rect(154, Cp.dessus - 18, 228, Cp.dessus - 6), '#d8c8a0', 0, 0); strokePts([[154, Cp.dessus - 14], [228, Cp.dessus - 14]], '#3a2416', 1.4); for (let k = 0; k < 9; k++) { const x = 158 + k * 8; strokePts([[x, Cp.dessus - 18], [x, Cp.dessus - 6]], '#5a4030', 0.8); dot(x, Cp.dessus - 16, 2.4, '#4a2a1a'); for (let j = 0; j < 3; j++) dot(x, Cp.dessus - 10 + j * 0 + (j - 1) * 0, 2.4, '#4a2a1a'); } }, 3131);
      pc(rect(270, Cp.dessus - 54, 274, Cp.dessus - 2), '#5a4a3a', null, 3132); pc(rect(246, Cp.dessus - 56, 298, Cp.dessus - 52), '#5a4a3a', null, 3133);
      for (const x of [250, 294]) { strokePts([[x, Cp.dessus - 54], [x - 6, Cp.dessus - 30]], '#3a3a3a', 0.8); strokePts([[x, Cp.dessus - 54], [x + 6, Cp.dessus - 30]], '#3a3a3a', 0.8); pc(ep(x, Cp.dessus - 30, 10, 4, 8, 0, PI), '#a8823f', null, 3134); }
      if (ep2 >= 1960) { c.save(); c.translate(200, Cp.dessus); c.scale(0.4, 0.4); NIN.OBJ.boite.draw({ pile: 2 }); c.restore(); }
      // bouilloire sur un petit brasero (fond droit)
      const B = AT.bouilloire;
      pc([[B.x - 40, B.y - 56], [B.x + 40, B.y - 56], [B.x + 34, B.y], [B.x - 34, B.y]], '#6a6a6e', () => shade(B.x - 40, 0, B.x + 40, 0, 0.3, [B.x - 50, B.y - 60, B.x + 50, B.y]), 3140);
      pc([[B.x - 26, B.y - 58], [B.x + 26, B.y - 58], [B.x + 30, B.y - 76], [B.x + 18, B.y - 88], [B.x - 18, B.y - 88], [B.x - 30, B.y - 76]], '#2a2626', null, 3141);
      pc([[B.x - 28, B.y - 76], [B.x - 44, B.y - 92], [B.x - 40, B.y - 96], [B.x - 24, B.y - 82]], '#2a2626', null, 3142);
    }), 8);
  }
  function makeAtSol() {
    return ombre(lay(46, 1250, 1034, 1500, (c) => {
      for (let b = 0; b < 3; b++) {                                     // bottes d'écorce de mûrier liées
        const x = 150 + b * 34, y = 1452 - (b === 1 ? 12 : 0);
        pc([[x - 18, y, 1], [x + 18, y, 1], [x + 22, y - 110, 1], [x - 22, y - 110, 1]], b % 2 ? '#8a7458' : '#9a8464', () => { for (let k = -3; k <= 3; k++) strokePts([[x + k * 5, y], [x + k * 6, y - 110]], 'rgba(60,40,20,0.45)', 1); fillPts(rect(x - 22, y - 70, x + 22, y - 62), '#5a4a2a', 0, 0); fillPts(rect(x - 21, y - 30, x + 21, y - 22), '#5a4a2a', 0, 0); }, 3201 + b);
      }
      pc([[256, 1380], [322, 1380], [316, 1452], [262, 1452]], '#8a6a42', () => { for (const y of [1396, 1436]) fillPts(rect(256, y, 322, y + 5), '#3a3a3a', 0, 0); for (let x = 262; x < 320; x += 10) strokePts([[x, 1382], [x + 1, 1450]], 'rgba(40,24,10,0.4)', 1); }, 3210);
      fillPts(ell(289, 1382, 32, 5, 14), '#5a7a8a', 0, 0);
      for (let k = 0; k < 7; k++) pc(rect(870 + k * 2, 1446 - 6 - k * 5, 970 - k * 2, 1446 - k * 5), k % 2 ? '#ede4cc' : '#e2d8bc', null, 3220 + k);
    }), 8);
  }
  function moineau(x, y, g, vol) {                             // moineau brun ; vol 0..1 = battement
    const c = cx_(), fl = vol ? Math.sin(g * 30) : 0;
    c.save(); c.translate(x, y);
    pc([[-14, -4], [-4, -12], [8, -12], [14, -6], [10, 2], [-6, 4]], '#8a6a4a', () => { dot(9, -8, 1.4, '#111'); fillPts([[-6, -6], [4, -6], [-2, 0]], '#5a4030', 0, 0); }, 3300, { drop: false });
    fillPts([[14, -8], [20, -6], [14, -4]], '#c9a24a', 0, 0); fillPts([[-14, -4], [-24, -10], [-22, -2]], '#6a4a30', 0, 0);
    if (vol) { fillPts([[-2, -10], [-12, -24 * fl - 4], [6, -14]], '#7a5a3a', 0, 0); }
    else { strokePts([[0, 3], [-1, 9]], '#3a2a1a', 1); strokePts([[5, 3], [5, 9]], '#3a2a1a', 1); }
    c.restore();
  }
  NIN.atelier = function (t, up, o) {
    o = o || {}; up = up || 0;
    const c = cx_(), g = M.tg(t), O = AT.ouverture, ep2 = o.epoque || 1889, mod = ep2 >= 1960;
    const amp = o.ampoule != null ? clamp(o.ampoule) : (mod ? 1 : 0), lan = o.lanterne != null ? clamp(o.lanterne) : (mod ? 0 : 1);
    const piles = o.piles != null ? clamp(o.piles) : (ep2 >= 1977 ? 1 : mod ? 0.6 : 0.15);
    c.save(); c.translate(0, -up);
    // 1) fond : la rue de Kyoto par la façade ouverte (maisons de bois, pagode, passants en kimono, oiseaux), personnage dehors (o.dehors)
    clipRect(O.x0, O.y0, O.x1, O.y1 + 6, () => {
      put(mod ? K.atRue2 : K.atRue);
      M.oiseaux(t, { x0: O.x0 - 60, x1: O.x1 + 80, y: 560, t0: 0, dur: 6, n: 3, s: 0.42, seed: 3401, col: '#4a4a52', brume: 0.3, boucle: true });
      kimonoPassants(t, { y: 1300, s: 0.3, n: 3, per: 11, x0: O.x0 - 40, x1: O.x1 + 40, seed: 3402 });
      if (o.dehors) o.dehors(t);
      const vo = clamp(o.volets || 0);                                     // volets de bois (amado) : 1 = boutique fermée
      if (vo > 0) for (let i = 0; i < 4; i++) { const w = (O.x1 - O.x0) / 4, x = O.x0 + i * w - (1 - vo) * (i + 1) * w * 1.05; pc(rect(x, O.y0, x + w + 1, O.y1), i % 2 ? '#6a4a2e' : '#7a5636', () => { for (let y = O.y0 + 30; y < O.y1; y += 60) strokePts([[x, y], [x + w, y]], 'rgba(30,16,6,0.5)', 1.4); }, 3410 + i); }
    });
    // 2) mur de l'atelier, façade, étagère de boîtes, râtelier ; rayon de soleil poussiéreux
    put(K.atMur);
    if (!mod || lan > 0.5) {
      c.save(); c.beginPath(); c.moveTo(O.x1, O.y0 + 100); c.lineTo(O.x1, AT.linteau.y); c.lineTo(900, BACK); c.lineTo(560, BACK); c.closePath();
      c.globalCompositeOperation = 'lighter'; c.fillStyle = grad(c, O.x1, 600, 800, BACK, [[0, 'rgba(255,236,190,0.16)'], [1, 'rgba(255,236,190,0.02)']]); c.fill(); c.clip();
      M.poussiere(t, { x: O.x1, y: O.y0 + 100, w: 500, h: BACK - O.y0, n: 70, a: 0.7, seed: 3403 }); c.restore();
    }
    // fils tendus où sèchent les feuilles imprimées (balancement en temps global) ; moineau (o.moineau 0..1)
    for (const F of AT.fils) strokePts(qbez([F.x0, F.y - 4], [(F.x0 + F.x1) / 2, F.y + 16], [F.x1, F.y - 4], 16), '#3a2a1e', 1.6);
    for (const F of AT.fils) for (const x of [F.x0, F.x1]) fillPts(rect(x - 4, F.y - 12, x + 4, F.y + 2), '#3a2416', 0, 0);
    const mot = [['cerisier', 'grue', 'lune', 'pin'], ['erable', 'iris', 'cerisier', 'grue'], ['lune', 'pin', 'erable', 'iris']];
    AT.feuilles.forEach((f, k) => {
      const a = 0.05 * Math.sin(g * 1.2 + k * 1.3) + 0.02 * Math.sin(g * 3.1 + k);
      c.save(); c.translate(f.x, f.y); c.rotate(a); c.scale(0.4, 0.4); c.translate(0, 226); NIN.OBJ.feuille.draw({ encre: 1, motifs: mot[k % 3] }); c.restore();
      fillPts(rect(f.x - 3, f.y - 4, f.x + 3, f.y + 8), '#8a6a42', 0, 0);
    });
    if (o.moineau != null) {
      const u = clamp(o.moineau), F = AT.fils[0], xP = 690, yP = F.y + 8 * Math.sin(PI * (xP - F.x0) / (F.x1 - F.x0)) - 9;
      if (u < 0.5) { const k = u / 0.5; moineau(lerp(O.x0 + 40, xP, ease(k)), lerp(500, yP, ease(k)) - Math.sin(PI * k) * 60, g, true); }
      else moineau(xP + (u > 0.75 ? 6 * Math.floor(((u - 0.75) * 12) % 2) : 0), yP - (u < 0.6 ? Math.abs(Math.sin((u - 0.5) * 60)) * 4 : 0), g, false);
    }
    // lanterne de façade (lanterne 0..1 allumée) ; ampoule électrique qui descend des cintres (ampoule 0..1)
    const L = AT.lanterne;
    strokePts([[L.x - 24, L.y - 40], [L.x, L.y - 40], [L.x, L.y - 26]], '#2a1c12', 2.4);
    c.save(); c.translate(L.x, L.y); c.rotate(0.04 * Math.sin(g * 1.1));
    pc(ell(0, 10, 26, 36, 18), lan > 0.05 ? M.mixc('#d8c8a0', '#f6d88a', lan) : '#d8c8a0', () => { for (let k = -3; k <= 3; k++) strokePts([[-26, 10 + k * 10], [26, 10 + k * 10]], 'rgba(60,40,20,0.45)', 0.9); fillPts(ell(0, 10, 9, 9, 10), 'rgba(142,43,34,0.8)', 0, 0); fleur5(0, 10, 6, 'rgba(240,236,220,0.9)', '#8E2B22'); }, 3420, { texA: 0.4 });
    fillPts(rect(-12, -30, 12, -24), '#1a1210', 0, 0); fillPts(rect(-12, 44, 12, 50), '#1a1210', 0, 0);
    c.restore();
    if (lan > 0) { glow(L.x, L.y + 10, 110, '255,190,110', 0.3 * lan); M.flamme(t, { x: L.x, y: L.y + 24, s: 0.35 * lan, r: 80, seed: 3404, lueur: false }); }
    if (amp > 0) {
      const A2 = AT.ampoule, by = lerp(-80, A2.y, ease(amp)) + M.wob(t, o.ampouleT || -99, -10, 2, 5);
      strokePts([[A2.x, 0], [A2.x, by - 20]], '#1a1a1a', 1.6);
      fillPts(rect(A2.x - 6, by - 22, A2.x + 6, by - 10), '#6a6a6a', 0, 0);
      pc(ell(A2.x, by + 4, 13, 16, 14), '#f6eec8', () => strokePts([[A2.x - 4, by], [A2.x, by + 8], [A2.x + 4, by]], '#c08a3a', 1.2), 3421, { drop: false });
      glow(A2.x, by + 4, 260, '255,226,160', 0.22 * amp); glow(A2.x, by + 4, 40, '255,250,220', 0.5 * amp);
    }
    // 3) intermédiaire : établi, comptoir, bouilloire (vapeur) ; piles de boîtes (piles 0..1) ; noren ; fūrin
    put(mod ? K.atMil2 : K.atMil, 0.3);
    M.fumee(t, { x: AT.bouilloire.x - 44, y: AT.bouilloire.y - 96, s: 0.4, n: 6, haut: 240, vent: -30, col: '#ece6da', a: 0.5, per: 2.6, seed: 3405 });
    const np = Math.round(piles * 7);
    AT.piles.forEach((x, k) => { const n = Math.max(0, np - k * 2); if (n > 0) NIN.boite(x, BACK - 2, 0.6, { pile: n, cast: { dx: 14, dy: 6, a: 0.25 } }); });
    const no = o.noren == null ? 1 : clamp(o.noren), N = AT.noren;
    if (no < 0.999) pc(rrect(N.x0, N.y0 - 14, N.x1, N.y0 + 12 + 10 * (1 - no), 10), '#2F3E5C', () => strokePts([[N.x0 + 4, N.y0 - 6], [N.x1 - 4, N.y0 - 6]], 'rgba(255,255,255,0.15)', 2), 3430);
    if (no > 0.02) {
      const h = (N.y1 - N.y0) * no, w = (N.x1 - N.x0) / 3;
      for (let i = 0; i < 3; i++) {
        const x0 = N.x0 + i * w + 1, sw = 3 * Math.sin(g * 1.4 + i * 1.1) * no + M.wob(t, o.furin == null ? -99 : o.furin, 8, 1.6, 3) * (i - 1);
        pc([[x0, N.y0, 1], [x0 + w - 2, N.y0, 1], [x0 + w - 2 + sw, N.y0 + h, 1], [x0 + sw, N.y0 + h, 1]], '#2F3E5C', () => {
          strokePts([[x0 + 4, N.y0 + 6], [x0 + 4 + sw, N.y0 + h - 4]], 'rgba(255,255,255,0.1)', 1.4);
          const c2 = cx_(); c2.save(); c2.translate(sw * 0.5, 0); fleur5((N.x0 + N.x1) / 2, N.y0 + 92 * no, 30 * no, '#efe8d8', '#2F3E5C'); c2.restore();
          hatch(null, 1.2, 4, 0.18, 1, undefined, [x0, N.y0, x0 + w, N.y0 + h]);
        }, 3440 + i, { texA: 0.5 });
      }
      pc(rect(N.x0 - 8, N.y0 - 6, N.x1 + 8, N.y0 + 2), '#6a4a2e', null, 3445);
    }
    const Fu = AT.furin, fa = 0.15 * Math.sin(g * 1.7) + M.wob(t, o.furin == null ? -99 : o.furin, 0.5, 2.2, 1.6);
    c.save(); c.translate(Fu.x, Fu.y); c.rotate(fa); strokePts([[0, 0], [0, 26]], '#2a2a2a', 1);
    pc(ep(0, 40, 14, 16, 12, PI, TAU).concat([[14, 42], [-14, 42]]), 'rgba(200,225,235,0.75)', () => fillPts(ell(-4, 32, 4, 6, 8), 'rgba(142,43,34,0.7)', 0, 0), 3450, { drop: false });
    strokePts([[0, 30], [0, 62]], '#2a2a2a', 0.8); pc(rect(-6, 62, 6, 84), '#e8dcc0', null, 3451, { drop: false });
    c.restore();
    if (mod) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = ep2 >= 1977 ? 'rgba(200,190,170,0.18)' : 'rgba(210,200,180,0.12)'; c.fillRect(0, 150, W, BACK - 144); c.restore(); }
    c.restore();
  };
  NIN.atelierSol = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), up = o.up || 0;
    c.save(); c.translate(0, -up); put(K.atSol, 0.3);
    for (let k = 0; k < 3; k++) strokePts(ep(289 + 8 * Math.sin(g * 1.3 + k * 2), 1382, 6 + k * 7 + 3 * Math.sin(g * 2 + k), 1.2, 8, 0, PI), 'rgba(230,240,245,0.5)', 1);
    c.restore();
  };

  NIN.init = function () {
    if (K.ok) return NIN;
    K.saVille = makeSaVille(); K.saMur = makeSaMur(); K.saMil = makeSaMil(); K.saSol = makeSaSol();
    K.trRuelle = makeTrRuelle(); K.trMur = makeTrMur(); K.trShoji = makeTrShoji(); K.trPorte = makeTrPorte(); K.trMil = makeTrMil(); K.trSol = makeTrSol();
    K.atRue = makeAtRue(false); K.atRue2 = makeAtRue(true); K.atMur = makeAtMur(); K.atMil = makeAtMil(1889); K.atMil2 = makeAtMil(1960); K.atSol = makeAtSol();
    K.ok = true; return NIN;
  };
})();
