// persos.js — « Sésame, ouvre-toi, le mot de passe oublié » (Ali Baba, Galland) : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.ses (alias SES). Appeler SES.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte ni lettre. Déterministe (hash, jamais Math.random).
// MARIONNETTES (tige ; (x,y) = pieds ; slot ST.slotF / ST.slotB) : SES.ali, SES.cassim, SES.voleur (qui 'chef'|'barbu'|'grand').
// ACCESSOIRES (sans tige) : SES.hache, SES.buche, SES.fagot, SES.sac, SES.piece, SES.tas, SES.coffre, SES.jarre, SES.lampe, SES.bulle. Point nommé : SES.pt(r, nom).
// DÉCORS : SES.init() → SES.K ; SES.foret(t,o), SES.tronc(t,o), SES.falaise(t,o), SES.caverne(t,o) ; repères SES.PORTE, SES.FALAISE, SES.CAVE, SES.FORET.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const SES = (M.ses = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const has = (v) => v && v !== 'rien';
  const k01 = (v) => clamp(v === true ? 1 : (v || 0));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const R4 = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
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
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function couture(pts, closed) {                                                    // points de couture le long d'un contour
    const n0 = closed === false ? pts.length - 1 : pts.length;
    for (let i = 0; i < n0; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, n = Math.max(2, Math.floor(l / 5));
      for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); strokePts([[x - dy / l * 2.4, y + dx / l * 2.4], [x + dy / l * 2.4, y - dx / l * 2.4]], 'rgba(46,30,16,0.75)', 1); }
    }
  }
  function corde(x0, x1, y, th, col) {
    fillPts([[x0, y - th / 2], [x1, y - th / 2 - 2], [x1, y + th / 2 - 2], [x0, y + th / 2]], col || '#9C8A62');
    for (let x = x0 + 2; x < x1; x += 4) strokePts([[x, y - th / 2 + 1], [x + 3, y + th / 2 - 1]], 'rgba(60,45,25,0.6)', 1);
  }

  // ------------------------------------------------------------ palette (fiche)
  const C = { sable: '#C9A46A', sienne: '#9A5B34', garance: '#8E2F25', indigo: '#2F3B5C', vert: '#5E6B45', ivoire: '#E9DFC8', or: '#B8923A', argent: '#A9ADB0', brun: '#5A3A22' };
  const METAL = {
    or: { base: '#B8923A', L: '#E6C66E', D: '#7E5E1E', rim: '#8E6C24', hi: '#FFF0C0', glint: '255,246,210' },
    argent: { base: '#A9ADB0', L: '#DCE4EE', D: '#66717F', rim: '#7D8898', hi: '#F2F7FF', glint: '232,242,255' },
  };

  // ------------------------------------------------------------ bras à articulations rondes (repris du Téflon / Barbe Noire)
  const R_COUDE = 11.5, LA = 96, HL = 100;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  function upDef(at, base, seed, o) {
    o = o || {};
    return { parent: 'torso', at, pts: armR(LA, o.wt || 15), base, seed, paint: (p) => {
      if (o.patch) { const pp = [[-11, -8], [11, -10], [12, 26], [-10, 28]]; fillPts(pp, o.patch); couture(pp); }
      if (o.galon) strokePts([[-13, 4], [13, 2]], o.galon, 2);
      hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, o.back ? 0.32 : 0.26);
    } };
  }
  function foreDef(parent, base, seed, L) {
    const hk = (p) => (L.back ? p.handB : p.handF) || 'open';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      if (L.cuff) { fillPts(R4(-24, 52, 24, 78), L.cuff); if (L.galon) { strokePts([[-14, 55], [14, 55]], L.galon, 2); strokePts([[-14, 74], [14, 74]], L.galon, 2); } }
      fillPts(R4(-20, 76, 24, 130), L.peau); X.handPaint(null, hk(p));
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }

  // ------------------------------------------------------------ jambes à genou : cuisse (legX_up, rivet à la hanche, L1), mollet (legX_lo, rivet au genou, L2), babouche (footX, toujours à plat)
  // cuisse : angle négatif = vers l'avant ; mollet : angle POSITIF = plie le genou (pied vers l'arrière)
  const FOOT_N = [[-12, -4], [8, -6], [18, 0], [34, 4], [46, 7], [51, 12, 1], [44, 14, 1], [-16, 14, 1], [-18, 6]];
  const FOOT_P = [[-12, -4], [8, -6], [18, 0], [34, 3], [46, 3], [56, -4], [61, -12, 1], [60, -2], [54, 9], [44, 14, 1], [-16, 14, 1], [-18, 6]];
  function legSet(L) {
    const L1 = L.L1, L2 = L.L2, w = L.w || 19, kr = 12.5, b = L.bouffant ? 7 : 0;
    const thigh = ep(0, 0, w, w, 8, PI, TAU).concat([[w + b * 0.5, L1 * 0.45], [kr + 1 + b * 0.4, L1 - 6]], ep(0, L1, kr + 0.5, kr + 0.5, 8, 0, PI), [[-kr - 1 - b * 0.4, L1 - 6], [-w - b * 0.5, L1 * 0.45]]);
    const shin = ep(0, 0, kr, kr, 8, PI, TAU).concat([[kr + b + 2, L2 * 0.38], [kr + b * 0.6, L2 * 0.7], [9, L2 - 8], [8, L2 + 3, 1], [-8, L2 + 3, 1], [-9, L2 - 8], [-kr - b * 0.8, L2 * 0.66], [-kr - b - 3, L2 * 0.36]]);
    const foot = L.pointe ? FOOT_P : FOOT_N, out = {};
    for (const back of [true, false]) {
      const sx = back ? 'B' : 'F';
      out['leg' + sx + '_up'] = { parent: 'torso', at: [back ? -6 : 6, -2], noRivet: true, pts: thigh, base: back ? L.pantD : L.pant, seed: L.seed + (back ? 1 : 2), paint: () => {
        if (L.hem != null) {
          fillPts(R4(-44, -40, 44, L.hem), back ? L.robeD : L.robe);
          if (L.robeHem) strokePts([[-30, L.hem - 4], [30, L.hem - 4]], L.robeHem, 2.4);
          strokePts([[-30, L.hem], [30, L.hem]], 'rgba(20,14,10,0.5)', 1.3);
        }
        if (L.bouffant) for (const x of [-8, 5]) strokePts([[x, (L.hem || 0) + 8], [x + 3, L1 - 4]], 'rgba(30,20,14,0.32)', 1.1);
        hatch([[-w - 10, -20], [-4, -20], [-4, L1 + 10], [-w - 10, L1 + 10]], 0.8, 4.2, back ? 0.32 : 0.24);
      } };
      out['leg' + sx + '_lo'] = { parent: 'leg' + sx + '_up', at: [0, L1], noRivet: back, pts: shin, base: back ? L.pantD : L.pant, seed: L.seed + (back ? 3 : 4), paint: () => {
        if (L.hemLo != null) fillPts(R4(-40, -20, 40, L.hemLo), back ? L.robeD : L.robe);
        fillPts(R4(-14, L2 - 13, 14, L2 + 6), L.bas || (back ? L.pantD : L.pant)); strokePts([[-10, L2 - 13], [10, L2 - 13]], 'rgba(20,14,10,0.45)', 1.2);
        if (L.bouffant) for (const x of [-6, 5]) strokePts([[x, 8], [x * 0.5, L2 - 15]], 'rgba(30,20,14,0.32)', 1.1);
        hatch([[-kr - 10, -10], [-3, -10], [-3, L2], [-kr - 10, L2]], 0.85, 4, back ? 0.34 : 0.24);
      } };
      out['foot' + sx] = { parent: 'leg' + sx + '_lo', at: [0, L2], noRivet: true, pts: foot, base: back ? L.shoeD : L.shoe, seed: L.seed + (back ? 5 : 6), paint: () => {
        strokePts([[-14, 11], [48, 11]], 'rgba(20,10,6,0.45)', 1.3);
        if (!back) strokePts([[10, -2], [36, 3]], 'rgba(255,240,210,0.3)', 1.3);
        if (L.shoeTrim) strokePts([[-10, -1], [10, -3], [32, 2]], L.shoeTrim, 1.8);
      } };
    }
    return out;
  }

  // =====================================================================
  // OBJETS TENUS — origine = point de prise (la main l'entoure) ; dessinés droits (haut = −y)
  // =====================================================================
  function drawHache() {
    pc([[-5, 42], [-6, 0], [-5, -80], [-4, -150], [4, -152], [5, -80], [6, 0], [6, 42], [0, 46]], '#8A6038', () => {
      strokePts([[-1, 38], [0, -146]], 'rgba(255,230,190,0.35)', 1.3); hatch(null, 0.15, 4, 0.18);
    }, 8101);
    pc([[-9, -160], [8, -162], [14, -154], [30, -164], [44, -173, 1], [48, -147], [44, -121, 1], [30, -130], [14, -136], [8, -130], [-9, -132], [-12, -146]], '#7D8288', () => {
      strokePts([[43, -168], [46, -147], [43, -126]], 'rgba(235,240,245,0.9)', 2.2);
      strokePts([[-6, -152], [10, -152]], 'rgba(30,30,34,0.5)', 1.2); hatch(null, 0.5, 3.6, 0.2);
    }, 8102, { texA: 0.4 });
    dot(0, -146, 2.4, '#3c3a3e');
  }
  function drawSac(o) {
    const G = METAL.or, c = cx_(), k = o.taille || 1;
    c.save(); c.scale(k, k);
    const body = [[-10, 4], [10, 4], [22, 18], [40, 44], [52, 80], [53, 112], [43, 132], [20, 142], [-20, 142], [-43, 132], [-53, 112], [-52, 80], [-40, 44], [-22, 18]];
    pc(body, '#A88A5C', () => {
      for (let y = 26; y < 142; y += 6) strokePts([[-54, y], [54, y + 2]], 'rgba(90,64,34,0.22)', 1);
      for (let x = -48; x < 52; x += 6) strokePts([[x, 16], [x * 1.04, 142]], 'rgba(90,64,34,0.16)', 1);
      for (const x of [-26, 0, 24]) strokePts([[x * 0.3, 10], [x, 60], [x * 1.1, 130]], 'rgba(70,48,24,0.35)', 1.2);
      fillPts([[14, 92], [34, 88], [36, 108], [16, 112]], '#957548'); couture([[14, 92], [34, 88], [36, 108], [16, 112]]);   // pièce cousue
      shade(36, 60, -44, 110, 0.32, [-60, 0, 60, 150]);
    }, 8201);
    if (o.or !== false) for (const [x, y, r] of [[-7, -14, 9], [7, -18, 9], [0, -24, 8]]) coinFace(x, y, r, G, 0.8);
    pc([[-8, 4], [-17, -6], [-13, -18], [-5, -10], [0, -20], [5, -10], [13, -18], [17, -6], [8, 4]], '#B49A6A', () => hatch(null, 0.4, 3, 0.2), 8202);
    pc(R4(-13, -1, 13, 8), '#6E4A24', () => strokePts([[-12, 3], [12, 3]], 'rgba(255,220,160,0.3)', 1), 8203);
    pc([[10, 4], [16, 14], [12, 30], [7, 26], [9, 12]], '#6E4A24', null, 8204);                       // bout de la cordelette
    c.restore();
  }
  // pièce d'or de face (rosette au centre, aucun signe) ; sx = écrasement horizontal (pièce qui tourne)
  function coinFace(x, y, r, G, sx) {
    sx = sx == null ? 1 : sx; const lw = Math.max(0.8, r * 0.07);
    fillPts(ell(x, y, r * sx, r, 18), G.rim, 0, 0);
    fillPts(ell(x - r * 0.04 * sx, y - r * 0.04, r * 0.84 * sx, r * 0.84, 16), G.base, 0, 0);
    strokePts(ell(x, y, r * 0.62 * sx, r * 0.62, 16), G.D, lw, true);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; dot(x + Math.cos(a) * r * 0.36 * sx, y + Math.sin(a) * r * 0.36, r * 0.085, G.D); }
    dot(x, y, r * 0.12, G.D);
    strokePts(ep(x, y, r * 0.74 * sx, r * 0.74, 8, PI * 1.08, PI * 1.62), G.hi, lw * 1.2);
  }
  function coinFlat(x, y, r, G) {
    fillPts(ell(x, y + r * 0.14, r, r * 0.42, 12), G.D, 0, 0);
    fillPts(ell(x, y, r, r * 0.4, 12), G.base, 0, 0);
    strokePts(ep(x, y - r * 0.02, r * 0.78, r * 0.28, 6, PI * 1.05, PI * 1.7), G.hi, 1);
  }
  function drawPiece(o) {
    const G = METAL[o.metal === 'argent' ? 'argent' : 'or'], sx = o.tourne != null ? Math.cos(o.tourne) : 1;
    const asx = Math.max(0.08, Math.abs(sx));
    pc(ell(0, -26, 26 * asx, 26, 22), G.rim, () => {
      if (sx >= 0) coinFace(0, -26, 26, G, asx);
      else { fillPts(ell(0, -26, 22 * asx, 22, 16), G.base, 0, 0); strokePts(ell(0, -26, 15 * asx, 15, 14), G.D, 1.4, true); }
    }, 8301, { texA: 0.3 });
  }
  const OBJ = {
    hache: { draw: drawHache, grip: [0, 0], p2: [0, -40], pts: { tranchant: [47, -147], fer: [20, -147], manche: [0, 44] }, base: [0, 46] },
    sac: { draw: drawSac, grip: [0, 0], pts: { col: [0, 0], fond: [0, 142] }, base: [0, 142] },
    piece: { draw: drawPiece, grip: [0, 0], pts: { centre: [0, -26] }, base: [0, 0] },
  };
  SES.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const PINCE = [[-9, -2], [-3, -8], [3, -5], [9, -9], [13, -3], [11, 6], [-7, 7]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !p._dos) heldDraw(p.tenu, p.tenuO, p); } },
      objetDos: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 5, pts: OFFP, extra: (p) => { if (has(p.tenu) && p._dos) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? (p.tenu === 'piece' ? PINCE : DOIGTS) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par SES.ali / cassim / voleur
  SES.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo || {}), q = ob.pts[nom], k = (name === 'sac' && oo && oo.taille) || 1;
    return r.w(arriere ? 'objetB' : 'objet', q[0] * k - g[0], q[1] * k - g[1]);
  };

  // =====================================================================
  // POSES — outils communs (IK du kit : M.ik, bendSign 1 = coude plié vers l'avant, dans les deux directions)
  // =====================================================================
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  const Wd = (def, x, y, s, o) => ({ def, x, y, s, dir: (o && o.dir) || 1 });
  const mats = (W, q) => M.partMatrices(W.def, q, W.x, W.y, W.s, W.dir).mats;
  const feet = (W, lx, ly) => [W.x + lx * W.s * W.dir, W.y + ly * W.s];          // repère des pieds → écran
  const tp = (W, q, lx, ly) => M.wpt(mats(W, q).torso, lx, ly);                   // repère du torse → écran
  const hp = (W, q, lx, ly) => M.wpt(mats(W, q).head, lx, ly);                    // repère de la tête → écran
  function reach(W, q, arm, T, k, bend) {
    if (!(k > 0) || !T) return;
    const sol = M.ik(W.def, q, W.x, W.y, W.s, W.dir, arm, T, bend == null ? 1 : bend), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function pivot(q, th, hx, hy, hipY) {                                          // incline de th et place la hanche en (hx,hy) (repère des pieds)
    const cs = Math.cos(th), sn = Math.sin(th);
    q.tilt = th; q.dx = hx * cs + hy * sn; q.dy = -hx * sn + hy * cs - hipY;
  }
  function plier(q, th, hipY) {                                                  // plie le buste aux hanches, jambes droites
    if (!th) return;
    pivot(q, th, 0, hipY, hipY); q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
  }
  function legIK(q, sd, H, F, L1, L2, k) {                                       // hanche H → cheville F (repère des pieds), genou devant
    const vx = F[0] - H[0], vy = F[1] - H[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), base = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const th = base - a1, Kx = H[0] - L1 * Math.sin(th), Ky = H[1] + L1 * Math.cos(th);
    const sh = Math.atan2(-(F[0] - Kx), F[1] - Ky), A = q.ang, u = 'leg' + sd + '_up', l = 'leg' + sd + '_lo';
    A[u] = lerp(A[u] || 0, th - (q.tilt || 0), k); A[l] = lerp(A[l] || 0, sh - th, k);
  }
  function marche(q, ph, amp) {                                                  // pas : ph en cycles (t × cadence)
    const a = amp == null ? 1 : amp, f = TAU * ph, s = Math.sin(f), c = Math.cos(f), A = q.ang;
    q.dy = (q.dy || 0) - Math.abs(c) * 5 * a;
    A.legF_up = (A.legF_up || 0) - 0.42 * s * a; A.legB_up = (A.legB_up || 0) + 0.42 * s * a;
    A.legF_lo = (A.legF_lo || 0) + 0.8 * Math.max(0, c) * a; A.legB_lo = (A.legB_lo || 0) + 0.8 * Math.max(0, -c) * a;
    A.armF_up = (A.armF_up || 0) + 0.3 * s * a; A.armB_up = (A.armB_up || 0) - 0.3 * s * a;
    A.armF_lo = (A.armF_lo || 0) - 0.15 * a; A.armB_lo = (A.armB_lo || 0) - 0.15 * a;
  }
  function tendre(W, q, k, vers) {                                               // bras avant tendu, main ouverte, vers un point écran
    if (k <= 0) return;
    const S = M.wpt(mats(W, q).armF_up, 0, 0);
    let T = vers || feet(W, 240, -420);
    const vx = T[0] - S[0], vy = T[1] - S[1], L = Math.hypot(vx, vy) || 1, R = 0.93 * (LA + HL) * W.s;
    T = [S[0] + vx / L * R, S[1] + vy / L * R];
    reach(W, q, 'armF', T, k, 1);
    if (k > 0.25) q.handF = 'open';
    q.ang.head = (q.ang.head || 0) - 0.06 * k;
  }
  function sacEpaule(W, q, k) {                                                  // petit sac sur l'épaule : la main tient le col devant l'épaule
    if (k <= 0) return;
    if (q.tenu == null) q.tenu = 'sac';
    reach(W, q, 'armF', tp(W, q, 18, -170), k, 1);
    q.handF = 'fist'; q.ang.objet = lerp(q.ang.objet || 0, 1.35, k); q.droit = true; if (k > 0.5) q._dos = true;   // le sac passe derrière l'épaule, dans le dos
  }
  function finish(W, q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    A.objetDos = A.objet || 0;
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    for (const sd of ['F', 'B']) A['foot' + sd] = (A['foot' + sd] || 0) - (tl + (A['leg' + sd + '_up'] || 0) + (A['leg' + sd + '_lo'] || 0));
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], g = gripOf(ob, q.tenuO || {}), T = M.wpt(mats(W, q).objet, ob.p2[0] - g[0], ob.p2[1] - g[1]);
      reach(W, q, 'armB', T, 1, 1); q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  // chaîne commune : marche, respiration, geste propre, atteinte libre, finition
  function build(def, p, x, y, s, o, gestes) {
    const W = Wd(def, x, y, s, o), q = prep(p), t = q.t || 0;
    q.dy = (q.dy || 0) + Math.sin(t * 1.9 + x * 0.01) * 1.1;
    if (q.pas != null) marche(q, q.pas, q.pasAmp);
    if (gestes) gestes(W, q, t);
    if (k01(q.formule) > 0) tendre(W, q, ease(k01(q.formule)), q.vers);
    if (k01(q.sac) > 0) sacEpaule(W, q, ease(k01(q.sac)));
    if (k01(q.atteint) > 0 && q.cible) { reach(W, q, 'armF', q.cible, ease(k01(q.atteint)), q.bend); if (!has(q.tenu) && !q.handF) q.handF = 'open'; }
    if (k01(q.atteintB) > 0 && q.cibleB) reach(W, q, 'armB', q.cibleB, ease(k01(q.atteintB)), q.bendB);
    finish(W, q);
    const r = M.puppet(def, q, x, y, s, o || {});
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  SES.tourne = (u) => { const d = Math.cos(PI * clamp(u)); return Math.abs(d) < 0.07 ? (d < 0 ? -0.07 : 0.07) : d; };

  // assemble un personnage : cfg = { seed, skin, skinD, torso, torsoBase, torsoPaint, legs (legSet), sleeve, sleeveD, armO, cuff…, head (pts, paint), avant: {pièces de tête/torse dessinées après le torse}, fond: {pièces derrière tout} }
  function mkPerso(cfg) {
    const sd = cfg.seed, parts = {
      torso: { parent: null, at: [0, 0], pts: cfg.torso, base: cfg.torsoBase, seed: sd, paint: cfg.torsoPaint },
      armB_up: upDef([-10, -146], cfg.sleeveD, sd + 10, Object.assign({ back: true }, cfg.armBO || {})),
      armB_lo: foreDef('armB_up', cfg.sleeveD, sd + 11, { peau: cfg.skinD, back: true, cuff: cfg.cuffD, galon: cfg.galon }),
      head: { parent: 'torso', at: [6, -170], pts: cfg.headPts || X.NAP_HEAD, base: cfg.skin, seed: sd + 12, noRivet: true, paint: cfg.headPaint, extra: cfg.headExtra },
      armF_up: upDef([-2, -146], cfg.sleeve, sd + 13, cfg.armFO || {}),
      armF_lo: foreDef('armF_up', cfg.sleeve, sd + 14, { peau: cfg.skin, cuff: cfg.cuff, galon: cfg.galon }),
    };
    Object.assign(parts, legSet(cfg.legs), heldParts(cfg.skin, sd + 20), cfg.fond || {}, cfg.avant || {});
    const fond = Object.keys(cfg.fond || {}), avant = Object.keys(cfg.avant || {});
    return { hipY: -(cfg.legs.L1 + cfg.legs.L2 + 14), handLen: HL, rod: { part: 'torso', at: [-26, 18] }, L1: cfg.legs.L1, L2: cfg.legs.L2, nom: cfg.nom, parts,
      order: fond.concat(['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB_up', 'legB_lo', 'footB', 'legF_up', 'legF_lo', 'footF', 'objetDos', 'head', 'torso'], avant,
        ['armF_up', 'armF_lo', 'objet', 'doigts']) };
  }

  // =====================================================================
  // ALI BABA — bûcheron pauvre : turban ivoire sale enroulé bas, courte barbe brune, tunique verte rapiécée (pièce ocre à l'épaule),
  // ceinture de corde, pantalon bouffant brun, babouches de cuir clair
  // =====================================================================
  const AL = { peau: '#C38E62', peauD: '#A6754E', tun: C.vert, tunD: '#4B5636', turb: '#D8CDB2', barbe: '#4A3222', pant: '#5A3A22', pantD: '#46301C', cuir: '#8E6E42', cuirD: '#6E5230' };
  const ALI_T = [[-14, -176], [8, -180], [16, -168], [28, -150], [36, -112], [38, -60], [37, -10], [31, 26, 1], [-33, 28, 1], [-40, -30], [-39, -110], [-34, -150], [-26, -168]];
  const ALI_TURB = [[-38, -58], [-43, -74], [-39, -94], [-25, -108], [-3, -114], [17, -110], [31, -98], [35, -82], [31, -68], [19, -66], [1, -69], [-19, -62]];
  const ALI_PAN = [[-2, -6], [8, 0], [6, 24], [-2, 40], [-9, 32], [-8, 8]];
  const ALI_BARBE = [[-18, -40], [-10, -31], [0, -25], [12, -21], [22, -22], [30, -22], [33, -16], [32, -6], [27, 4], [16, 12], [2, 15], [-10, 12], [-18, 0], [-22, -22]];
  function turbanPaint(base, dark, light) {
    return () => {
      for (let i = 0; i < 6; i++) { const y0 = -64 - i * 8; strokePts([[-40, y0 + 4], [-10, y0 - 10], [20, y0 - 16], [36, y0 - 22]], dark, 1.6); strokePts([[-38, y0 + 1], [-8, y0 - 13], [20, y0 - 19]], light, 1); }
      hatch(null, 0.6, 3.6, 0.22); shade(30, -110, -40, -60, 0.24, [-60, -170, 60, -50]);
    };
  }
  CH.sesAli = mkPerso({
    nom: 'ali', seed: 9100, skin: AL.peau, skinD: AL.peauD, torso: ALI_T, torsoBase: AL.tun, sleeve: AL.tun, sleeveD: AL.tunD,
    armFO: { patch: C.sable },
    torsoPaint: () => {
      fillPts([[6, -180], [16, -168], [22, -150], [14, -142], [6, -160]], AL.peau);                         // échancrure du col
      strokePts([[4, -178], [14, -152], [20, -142]], 'rgba(30,36,20,0.6)', 1.3);
      const p1 = [[-32, -168], [-8, -172], [-6, -146], [-30, -142]]; fillPts(p1, C.sable); couture(p1);       // pièce ocre sur l'épaule
      const p2 = [[-36, -70], [-16, -72], [-15, -48], [-35, -46]]; fillPts(p2, '#7A6040'); couture(p2);       // pièce brune au flanc
      strokePts([[20, -100], [26, -84]], 'rgba(30,36,20,0.5)', 1.2); strokePts([[24, -98], [18, -88]], 'rgba(30,36,20,0.5)', 1);   // accroc
      corde(-42, 40, -24, 9, '#A08C60');
      pc([[28, -28], [36, -26], [38, -18], [30, -16]], '#A08C60', null, 9108);
      fillPts([[30, -18], [35, -18], [33, 14], [28, 12]], '#A08C60'); fillPts([[24, -18], [28, -18], [24, 6], [20, 4]], '#8E7A50');
      hatch([[-50, -170], [-12, -170], [-10, 30], [-50, 30]], 0.75, 4.2, 0.3);
      shade(40, 0, -40, 0, 0.26);
    },
    legs: { L1: 112, L2: 112, w: 21, bouffant: true, pant: AL.pant, pantD: AL.pantD, hem: 94, robe: AL.tun, robeD: AL.tunD, shoe: AL.cuir, shoeD: AL.cuirD, bas: AL.pantD, seed: 9130 },
    headPaint: (p) => {
      const f = p.face || {};
      fillPts([[-36, -70], [-22, -64], [-17, -46], [-21, -30], [-30, -26], [-37, -44]], '#3E2A1C');
      X.earPaint(-8, -44);
      hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
      dot(15, -36, 8, 'rgba(190,100,70,0.22)');
      strokePts([[19, -32], [28, -33], [34, -30]], '#3E2A1C', 2.8);
      strokePts([[21, -44], [24, -39]], 'rgba(90,50,30,0.35)', 1);
      X.eye(f, 17, -52); X.brow(f, 17, -60, '#3E2A1C', 2.8); X.mouth(f, 27, -26);
    },
    fond: { pan: { parent: 'head', at: [-34, -66], pts: ALI_PAN, base: '#C8BC9E', seed: 9115, noRivet: true, rest: 0.15, paint: () => hatch(null, 0.5, 3.4, 0.25) } },
    avant: {
      barbe: { parent: 'head', at: [0, 0], pts: ALI_BARBE, base: AL.barbe, seed: 9116, noRivet: true, paint: () => {
        for (let i = 0; i < 14; i++) { const x = -16 + i * 3.4, y = -18 + (i % 3) * 8; strokePts([[x, y], [x + 2, y + 5], [x, y + 9]], 'rgba(150,110,80,0.45)', 1); }
        hatch(null, 0.9, 3, 0.25);
      } },
      turban: { parent: 'head', at: [0, 0], pts: ALI_TURB, base: AL.turb, seed: 9117, noRivet: true, paint: turbanPaint(AL.turb, 'rgba(110,96,70,0.55)', 'rgba(255,250,235,0.35)') },
    },
  });
  // la bûche que frappe Ali (repère des pieds) : SES.bucheAli(x, y, s, dir) → [bx, by] = bas de la bûche
  const BUCHE_ALI = [172, -100];
  SES.bucheAli = (x, y, s, dir) => [x + BUCHE_ALI[0] * (s == null ? 0.9 : s) * (dir || 1), y];
  function aliGestes(W, q, t) {
    const A = q.ang, hip = W.def.hipY, L1 = W.def.L1, L2 = W.def.L2;
    const hc = clamp(q.hache || 0), ca = ease(k01(q.cache)), ch = ease(k01(q.chuchoter)), rv = ease(k01(q.reverence)), pi = ease(k01(q.piece));
    if (hc > 0 && q.tenu == null) q.tenu = 'hache';
    if (hc > 0 && q.deuxMains == null) q.deuxMains = true;
    if (pi > 0 && q.tenu == null) q.tenu = 'piece';
    if (ca > 0) {                                                                // accroupi, buste penché (se cacher derrière un tronc)
      const H = [lerp(0, -44, ca), lerp(hip, -132, ca)];
      pivot(q, 0.4 * ca, H[0], H[1], hip);
      legIK(q, 'F', H, [lerp(0, 30, ca), -14], L1, L2, 1); legIK(q, 'B', H, [lerp(0, -12, ca), -14], L1, L2, 1);
      A.head = (A.head || 0) - 0.32 * ca;
      blend(q, 'armF_up', -0.85, ca); blend(q, 'armF_lo', -1.15, ca); blend(q, 'armB_up', -0.45, ca); blend(q, 'armB_lo', -0.95, ca);
      if (!q.face.eyes) q.face.eyes = 'wide';
    }
    if (rv > 0) {                                                                // révérence : buste incliné, main sur le cœur
      plier(q, 0.42 * rv, hip); A.head = (A.head || 0) + 0.22 * rv; A.legB_up = (A.legB_up || 0) + 0.1 * rv;
      reach(W, q, 'armF', tp(W, q, 24, -118), rv, 1); blend(q, 'armB_up', 0.55, rv); blend(q, 'armB_lo', -0.25, rv);
      if (rv > 0.4) q.handF = 'open';
    }
    if (ch > 0) {                                                                // chuchoter : main en cornet devant la bouche
      plier(q, 0.06 * ch, hip); A.head = (A.head || 0) + 0.04 * ch;
      reach(W, q, 'armF', hp(W, q, 46, -24), ch, 1);
      if (ch > 0.3) q.handF = 'open';
    }
    if (pi > 0) {                                                                // montre une pièce d'or entre pouce et index, à hauteur de poitrine
      A.head = (A.head || 0) + 0.12 * pi;
      reach(W, q, 'armF', tp(W, q, 92, -122), pi, 1);
    }
    if (hc > 0) {                                                                // hache : 0 repos → 0,5 levée au-dessus de la tête → 1 frappe la bûche
      const R0 = [-0.35, -0.75, 0.35], AR = [-2.85, -0.35, -0.95];
      let u;
      if (hc <= 0.5) { const k = ease(hc / 0.5); plier(q, -0.05 * k, hip); u = R0.map((v, i) => lerp(v, AR[i], k)); }
      else {
        const k = ease((hc - 0.5) / 0.5), th = 2.0, tip = OBJ.hache.pts.tranchant;
        plier(q, 0.4 * k, hip);
        const rx = tip[0] * Math.cos(th) - tip[1] * Math.sin(th), ry = tip[0] * Math.sin(th) + tip[1] * Math.cos(th);
        const sol = M.ik(W.def, q, W.x, W.y, W.s, W.dir, 'armF', feet(W, BUCHE_ALI[0] - rx - 3, BUCHE_ALI[1] - ry + 4), 1);
        u = [lerp(AR[0], AR[0] + normA(sol.up - AR[0]), k), lerp(AR[1], AR[1] + normA(sol.lo - AR[1]), k), lerp(AR[2], th, k)];
      }
      A.armF_up = u[0]; A.armF_lo = u[1]; A.objet = u[2]; q.droit = true;
    }
  }
  SES.ali = (pose, x, y, s, o) => build(CH.sesAli, pose, x, y, s == null ? 0.9 : s, o, aliGestes);

  // =====================================================================
  // CASSIM — le frère riche, ventre rond : grand turban rouge garance à aigrette ivoire et broche or, moustache noire en crocs,
  // caftan indigo brodé or, large ceinture or vieilli, pantalon ivoire, babouches pointues rouges
  // =====================================================================
  const CA = { peau: '#D2A27A', peauD: '#B4855E', caf: C.indigo, cafD: '#242E48', cafL: '#3E4C72', turb: C.garance, turbD: '#6E241C', or: C.or, orL: '#E2C677', pant: '#E0D3B4', pantD: '#C5B890' };
  const CAS_T = [[-14, -178], [8, -182], [18, -170], [32, -150], [44, -120], [58, -86], [67, -50], [69, -16], [60, 12], [40, 28, 1], [-34, 30, 1], [-46, -20], [-45, -80], [-42, -122], [-36, -152], [-26, -170]];
  const CAS_TURB = [[-46, -58], [-54, -80], [-55, -102], [-46, -120], [-28, -132], [-4, -137], [18, -133], [38, -120], [48, -100], [46, -80], [40, -70], [22, -69], [0, -71], [-24, -60]];
  const CAS_AIGR = (() => { const c = qbez([0, 0], [6, -44], [-22, -76], 10); return ribbon(c, 13, 3); })();
  const CAS_MOUST = ribbon([[13, -31], [22, -32], [31, -31], [39, -33], [44, -38], [45, -45], [41, -49]], 5.5, 1.6);
  const CAS_HEAD = [[-16, 16], [12, 16], [16, 6], [24, -2], [29, -10], [30, -18], [28, -22], [30, -26], [29, -30], [33, -34], [39, -40, 1], [34, -47], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-34, -68], [-34, -46], [-27, -26], [-20, -6]];
  function cassimHead(p) {
    const f = p.face || {};
    fillPts([[-36, -66], [-24, -62], [-19, -46], [-24, -30], [-33, -30], [-37, -46]], '#1E1814');
    X.earPaint(-10, -44);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
    dot(16, -34, 10, 'rgba(205,110,90,0.28)');
    strokePts([[2, 2], [14, 6], [24, 0]], 'rgba(120,70,50,0.45)', 1.3);                                // double menton
    strokePts([[-6, 10], [10, 13]], 'rgba(120,70,50,0.35)', 1.1);
    X.eye(f, 17, -52);
    strokePts(f.brow === 'up' ? [[6, -63], [16, -67], [27, -63]] : f.brow === 'worry' ? [[6, -59], [16, -64], [27, -65]] : f.brow === 'frown' ? [[6, -64], [16, -62], [28, -57]] : [[6, -61], [16, -64], [27, -61]], '#18120E', 3.2);
    X.mouth(f, 27, -25);
  }
  function cassimYeux(p) {                                                       // reflets dorés dans les yeux (yeuxOr 0..1)
    const k = k01(p.yeuxOr); if (k <= 0 || SIL()) return;
    const f = p.face || {}; if (f.eyes === 'closed') return;
    const c = cx_(), x = 19.3, y = -52.6, t = p.t || 0;
    c.save();
    c.beginPath(); c.arc(x, y, 3.4, 0, TAU); c.fillStyle = `rgba(222,178,52,${k})`; c.fill();
    c.beginPath(); c.arc(x, y, 1.5, 0, TAU); c.fillStyle = `rgba(80,50,10,${k})`; c.fill();
    c.globalCompositeOperation = 'lighter';
    const gl = c.createRadialGradient(x + 2, y - 2, 1, x + 2, y - 2, 12); gl.addColorStop(0, `rgba(255,214,110,${0.55 * k})`); gl.addColorStop(1, 'rgba(255,200,90,0)');
    c.fillStyle = gl; c.fillRect(x - 12, y - 16, 28, 28);
    const L = (9 + 8 * k) * (0.75 + 0.25 * Math.sin(t * 9)), lw = 1.8 * M._lw();
    c.strokeStyle = `rgba(255,236,160,${0.9 * k})`; c.lineWidth = lw;
    c.beginPath(); c.moveTo(x + 2 - L, y - 2); c.lineTo(x + 2 + L, y - 2); c.moveTo(x + 2, y - 2 - L); c.lineTo(x + 2, y - 2 + L); c.stroke();
    c.beginPath(); c.arc(x + 2, y - 2, 1.3, 0, TAU); c.fillStyle = `rgba(255,255,230,${k})`; c.fill();
    c.restore();
  }
  CH.sesCassim = mkPerso({
    nom: 'cassim', seed: 9200, skin: CA.peau, skinD: CA.peauD, torso: CAS_T, torsoBase: CA.caf, sleeve: CA.caf, sleeveD: CA.cafD,
    cuff: CA.cafL, cuffD: CA.cafD, galon: CA.or, armFO: { galon: CA.or }, armBO: { galon: CA.or },
    torsoPaint: () => {
      fillPts([[-28, -172], [-6, -180], [16, -172], [14, -160], [-24, -158]], CA.cafL);                       // col
      strokePts([[-26, -164], [-4, -172], [14, -166]], CA.or, 2.4);
      const bord = [[18, -168], [31, -150], [42, -120], [55, -86], [63, -50], [65, -18], [57, 10], [38, 25]];
      fillPts(ribbon(bord.map((q) => [q[0] + 2, q[1]]), 22, 22), C.garance);                               // doublure garance du bord avant
      strokePts(bord.map((q) => [q[0] - 9, q[1] + 2]), CA.or, 3.4); strokePts(bord.map((q) => [q[0] - 13, q[1] + 2]), CA.orL, 1.1);
      for (const [x, y, r] of [[-22, -130, 13], [12, -98, 11], [-26, -76, 11], [-30, 8, 10], [8, 10, 9]]) {   // médaillons brodés (rosaces, aucun signe)
        strokePts(ell(x, y, r, r, 16), CA.or, 2, true);
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; dot(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, 2, CA.orL); }
        dot(x, y, 2.6, CA.or);
      }
      fillPts([[-48, -40], [66, -46], [69, -10], [-47, -4]], CA.or);                                        // large ceinture or vieilli
      strokePts([[-46, -36], [66, -42]], CA.orL, 1.4); strokePts([[-46, -8], [68, -13]], '#7E5E1E', 1.4);
      for (let x = -40; x < 64; x += 9) strokePts([[x, -36], [x + 1, -8]], 'rgba(110,80,25,0.45)', 1);
      pc(ell(58, -27, 9, 11, 12), '#7E5E1E', () => dot(58, -27, 5, C.garance), 9208);                     // agrafe à cabochon
      for (const y of [6, 18]) strokePts([[-40, y], [50, y - 4]], 'rgba(20,24,40,0.35)', 1.2);
      hatch([[-54, -170], [-14, -170], [-12, 32], [-54, 32]], 0.75, 4.2, 0.3);
      shade(64, -40, -40, -40, 0.3, [-60, -190, 80, 40]);
    },
    legs: { L1: 112, L2: 112, w: 23, bouffant: true, pant: CA.pant, pantD: CA.pantD, hem: 100, robe: CA.caf, robeD: CA.cafD, robeHem: CA.or, shoe: CA.turb, shoeD: CA.turbD, pointe: true, shoeTrim: CA.or, bas: '#B8A982', seed: 9230 },
    headPts: CAS_HEAD,
    headPaint: cassimHead, headExtra: cassimYeux,
    avant: {
      moustache: { parent: 'head', at: [0, 0], pts: CAS_MOUST, base: '#16120F', seed: 9216, noRivet: true },
      turban: { parent: 'head', at: [0, 0], pts: CAS_TURB, base: CA.turb, seed: 9217, noRivet: true, paint: () => {
        for (let i = 0; i < 7; i++) { const y0 = -64 - i * 10; strokePts([[-52, y0 + 6], [-16, y0 - 8], [20, y0 - 16], [46, y0 - 24]], 'rgba(60,14,10,0.55)', 1.8); strokePts([[-50, y0 + 3], [-14, y0 - 11], [20, y0 - 19]], 'rgba(220,120,100,0.3)', 1.1); }
        hatch(null, 0.6, 3.6, 0.22); shade(40, -120, -50, -60, 0.3, [-70, -150, 60, -50]);
        pc(ell(36, -104, 9, 12, 14), CA.or, () => { dot(36, -104, 5.5, '#2E6A52'); dot(34, -106, 1.6, 'rgba(255,255,255,0.7)'); }, 9218);
      } },
      aigrette: { parent: 'turban', at: [30, -114], pts: CAS_AIGR, base: '#EDE4CF', seed: 9219, noRivet: true, paint: () => {
        const cc = qbez([0, 0], [6, -44], [-22, -76], 10);
        strokePts(cc, 'rgba(150,130,100,0.7)', 1.2);
        for (let i = 1; i < cc.length - 1; i++) { strokePts([cc[i], [cc[i][0] - 6, cc[i][1] - 4]], 'rgba(150,130,100,0.5)', 1); strokePts([cc[i], [cc[i][0] + 6, cc[i][1] - 3]], 'rgba(150,130,100,0.5)', 1); }
      } },
    },
  });
  function cassimGestes(W, q, t) {
    const A = q.ang, hip = W.def.hipY, L1 = W.def.L1, L2 = W.def.L2;
    const fr = ease(k01(q.frotte)), jo = ease(k01(q.joie)), pu = ease(k01(q.pousse)), ta = ease(k01(q.tate)), gr = ease(k01(q.gratte)), as = ease(k01(q.assis));
    if (k01(q.yeuxOr) > 0.3 && !q.face.eyes) q.face.eyes = 'wide';
    if (as > 0) {                                                                // assis sur un tas d'or, coudes sur les genoux, tête dans les mains
      const H = [lerp(0, -8, as), lerp(hip, -126, as)];
      pivot(q, 0.6 * as, H[0], H[1], hip);
      legIK(q, 'F', H, [lerp(0, 96, as), -14], L1, L2, 1); legIK(q, 'B', H, [lerp(0, 82, as), -14], L1, L2, 1);
      A.head = (A.head || 0) + 0.32 * as;
      reach(W, q, 'armF', hp(W, q, 20, 2), as, 1); reach(W, q, 'armB', hp(W, q, 6, 6), as, 1);
      if (as > 0.4) { q.handF = q.handB = 'open'; if (!q.face.brow) q.face.brow = 'worry'; if (!q.face.eyes) q.face.eyes = 'half'; }
    }
    if (pu > 0) {                                                                // pousse la paroi des deux mains (cible écran ; défaut : devant, à hauteur de poitrine)
      const T = q.cible || feet(W, 170, -330);
      plier(q, 0.14 * pu, hip); A.legB_up = (A.legB_up || 0) + 0.32 * pu; A.legF_up = (A.legF_up || 0) - 0.12 * pu;
      q.dx = (q.dx || 0) + Math.sin(t * 31) * 0.8 * pu;
      reach(W, q, 'armF', T, pu, 1); reach(W, q, 'armB', [T[0] - 4 * W.dir * W.s, T[1] + 24 * W.s], pu, 1);
      if (pu > 0.3) { q.handF = q.handB = 'open'; if (!q.face.brow) q.face.brow = 'worry'; if (!q.face.mouth) q.face.mouth = 'tight'; }
    }
    if (ta > 0) {                                                                // tâte la paroi : main ouverte qui glisse de haut en bas autour de la cible
      const C0 = q.cible || feet(W, 160, -360), T = [C0[0], C0[1] + 34 * Math.sin(t * 2.2) * W.s];
      plier(q, 0.08 * ta, hip); A.head = (A.head || 0) + 0.08 * ta;
      reach(W, q, 'armF', T, ta, 1);
      if (ta > 0.3) { q.handF = 'open'; if (!q.face.brow) q.face.brow = 'worry'; }
    }
    if (fr > 0) {                                                                // se frotte les mains (cupide)
      const w = Math.sin(t * 9), v = Math.cos(t * 9);
      A.head = (A.head || 0) + 0.06 * fr;
      reach(W, q, 'armF', tp(W, q, 72 + 8 * w, -104 + 4 * v), fr, 1); reach(W, q, 'armB', tp(W, q, 66 - 8 * w, -98 - 4 * v), fr, 1);
      if (fr > 0.3) { q.handF = q.handB = 'open'; if (!q.face.mouth) q.face.mouth = 'smile'; if (!q.face.eyes) q.face.eyes = 'half'; }
    }
    if (jo > 0) {                                                                // joie : deux bras levés, coudes pliés vers l'avant, petits sauts
      q.dy = (q.dy || 0) - Math.abs(Math.sin(t * 7)) * 10 * jo; A.head = (A.head || 0) - 0.12 * jo;
      reach(W, q, 'armF', tp(W, q, 102, -284), jo, 1); reach(W, q, 'armB', tp(W, q, 74, -302), jo, 1);
      if (jo > 0.3) { q.handF = q.handB = 'open'; if (!q.face.mouth) q.face.mouth = 'o'; if (!q.face.eyes) q.face.eyes = 'wide'; if (!q.face.brow) q.face.brow = 'up'; }
    }
    if (gr > 0) {                                                                // se gratte le turban, perplexe
      A.head = (A.head || 0) + 0.1 * gr;
      reach(W, q, 'armF', hp(W, q, -10 + 4 * Math.sin(t * 16), -102 + 3 * Math.cos(t * 16)), gr, 1);
      if (gr > 0.3) { q.handF = 'open'; if (!q.face.brow) q.face.brow = 'worry'; if (!q.face.mouth) q.face.mouth = 'tight'; }
    }
  }
  SES.cassim = (pose, x, y, s, o) => build(CH.sesCassim, pose, x, y, s == null ? 0.9 : s, o, cassimGestes);

  // =====================================================================
  // VOLEURS — chef : turban noir + voile sur le bas du visage, manteau garance sombre, cimeterre AU FOURREAU ;
  // barbu : turban ocre, gilet brun, grosse barbe noire ; grand : bonnet pointu indigo, cape vert foncé, maigre et grand
  // =====================================================================
  const VO = {
    chef: { peau: '#B4855C', peauD: '#97693F', haut: '#6E2A22', hautD: '#561F19', pant: '#3A302C', pantD: '#2C2421', shoe: '#3B2B22', shoeD: '#2A1E17', turb: '#2A2522' },
    barbu: { peau: '#C29066', peauD: '#A2734C', haut: '#CDBF9E', hautD: '#ADA082', gilet: C.brun, pant: '#4B4D58', pantD: '#393B45', shoe: '#6B4A2E', shoeD: '#523822', turb: C.sable },
    grand: { peau: '#C79C72', peauD: '#A67D56', haut: '#6F5F48', hautD: '#584B38', cape: '#3F4A33', capeD: '#323B28', pant: '#5B5A55', pantD: '#484743', shoe: '#4A3A2A', shoeD: '#382B1F', bonnet: C.indigo },
  };
  const CHEF_T = [[-14, -176], [8, -180], [16, -168], [30, -150], [38, -112], [40, -60], [39, -10], [33, 26, 1], [-35, 28, 1], [-42, -30], [-40, -110], [-35, -150], [-26, -168]];
  const BAR_T = [[-14, -176], [8, -180], [18, -168], [32, -150], [42, -112], [44, -60], [41, -10], [34, 26, 1], [-36, 28, 1], [-46, -30], [-44, -110], [-38, -150], [-26, -168]];
  const GR_T = [[-12, -176], [8, -180], [14, -168], [22, -150], [28, -110], [30, -60], [29, -8], [24, 26, 1], [-26, 28, 1], [-32, -40], [-32, -110], [-28, -150], [-22, -168]];
  const TURB_NOIR = [[-40, -58], [-46, -78], [-42, -100], [-26, -114], [-2, -118], [20, -114], [34, -100], [38, -82], [34, -66], [20, -64], [0, -66], [-20, -60]];
  const VOILE = [[-16, -46, 1], [41, -44, 1], [43, -34], [40, -18], [38, -2], [36, 12], [31, 28], [20, 44, 1], [8, 28], [-6, 20], [-18, 8], [-22, -16], [-21, -36]];
  const PAN_NOIR = [[-2, -6], [9, 0], [8, 40], [2, 70], [-8, 62], [-9, 20]];
  const TURB_OCRE = [[-40, -60], [-45, -80], [-40, -98], [-24, -110], [0, -114], [22, -110], [36, -96], [40, -78], [34, -64], [16, -66], [-4, -66], [-22, -60]];
  const BARBE_N = [[-20, -42], [-8, -34], [6, -27], [20, -26], [31, -26], [37, -18], [40, -4], [38, 14], [33, 32], [24, 50], [10, 62], [-4, 60], [-14, 46], [-22, 22], [-26, -12]];
  const BONNET = [[-36, 18], [-37, 2], [-30, -20], [-18, -46], [-8, -72], [-10, -88], [-24, -100, 1], [-4, -92], [8, -70], [20, -44], [31, -16], [36, 4], [36, 18]];
  const BOUC = [[8, -14], [24, -16], [27, -6], [22, 10], [14, 26, 1], [8, 12], [4, -2]];
  const FOURREAU = [[-5, 0], [5, 0], [8, 40], [13, 78], [21, 108], [32, 128, 1], [24, 130], [9, 112], [0, 82], [-5, 42]];
  function voleurHead(m, qui) {
    return (p) => {
      const f = p.face || {};
      fillPts([[-36, -66], [-24, -62], [-19, -46], [-24, -30], [-33, -30], [-37, -46]], qui === 'grand' ? '#4A3A2C' : '#1E1814');
      X.earPaint(-8, -44);
      hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, qui === 'grand' ? 0.42 : 0.3);
      if (qui === 'grand') { strokePts([[2, -34], [10, -18], [8, -6]], 'rgba(90,60,40,0.45)', 1.3); }         // joue creuse
      if (qui === 'chef') { strokePts([[6, -50], [17, -55], [28, -52]], 'rgba(20,14,12,0.85)', 1.6); strokePts([[8, -49], [18, -48], [26, -50]], 'rgba(20,14,12,0.7)', 1.2); }   // khôl
      X.eye(f, 17, -52);
      const bf = f.brow || (qui === 'chef' ? 'frown' : 'n');
      X.brow(Object.assign({}, f, { brow: bf }), 17, -60, '#1E1814', qui === 'barbu' ? 3.6 : 2.8);
      if (qui === 'grand') X.mouth(f, 27, -26);
    };
  }
  function mkVoleur(qui) {
    const m = VO[qui], sd = 9300 + (qui === 'chef' ? 0 : qui === 'barbu' ? 100 : 200);
    const cfg = { nom: qui, seed: sd, skin: m.peau, skinD: m.peauD, sleeve: m.haut, sleeveD: m.hautD, headPaint: voleurHead(m, qui), avant: {}, fond: {} };
    if (qui === 'chef') {
      Object.assign(cfg, { torso: CHEF_T, torsoBase: m.haut, cuff: '#2A2522', cuffD: '#201B19',
        legs: { L1: 112, L2: 112, w: 21, bouffant: true, pant: m.pant, pantD: m.pantD, hem: 106, robe: m.haut, robeD: m.hautD, robeHem: '#2A2522', shoe: m.shoe, shoeD: m.shoeD, seed: sd + 30 },
        torsoPaint: () => {
          fillPts([[-30, -170], [-6, -180], [16, -170], [12, -156], [-24, -154]], '#2A2522');
          strokePts([[30, -146], [38, -100], [40, -40], [36, 24]], 'rgba(30,8,6,0.7)', 1.6);
          fillPts([[-44, -32], [40, -34], [41, -10], [-44, -8]], '#2A2522');                                 // ceinture noire
          for (const y of [-26, -18]) strokePts([[-42, y], [40, y - 1]], 'rgba(120,100,90,0.35)', 1);
          fillPts([[30, -12], [38, -12], [36, 20], [30, 22, 1], [27, 8]], '#2A2522');
          hatch([[-50, -170], [-12, -170], [-10, 30], [-50, 30]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.28);
        } });
      cfg.fond.pan = { parent: 'head', at: [-34, -64], pts: PAN_NOIR, base: '#221E1C', seed: sd + 15, noRivet: true, rest: 0.1, paint: () => hatch(null, 0.5, 3.4, 0.25) };
      cfg.avant.fourreau = { parent: 'torso', at: [-8, -14], rest: 0.75, pts: FOURREAU, base: '#2B1F18', seed: sd + 16, noRivet: true, paint: () => {
        fillPts(R4(-8, 0, 8, 10), C.or); fillPts([[18, 110], [26, 108], [33, 128], [24, 131]], C.or); strokePts([[1, 12], [8, 60], [18, 100]], 'rgba(255,220,170,0.22)', 1.2);
      }, extra: () => {                                                         // poignée du cimeterre, rangée (jamais dégainée)
        pc([[-4, 0], [4, 0], [5, -24], [-3, -26]], '#3A2A20', () => { for (let y = -22; y < -2; y += 4) strokePts([[-4, y], [5, y + 2]], 'rgba(200,170,120,0.35)', 1); }, sd + 17);
        pc([[-12, 2], [14, 0], [15, -5], [-12, -4]], C.or, null, sd + 18);
        pc(ell(1, -29, 6, 5, 10), C.or, null, sd + 19);
      } };
      cfg.avant.voile = { parent: 'head', at: [0, 0], pts: VOILE, base: '#5A4E48', seed: sd + 20, noRivet: true, paint: () => {
        strokePts([[-14, -43], [40, -41]], 'rgba(220,205,190,0.55)', 1.6); strokePts([[-14, -39], [40, -37]], 'rgba(30,22,20,0.55)', 1.2);
        for (const y of [-26, -10, 6, 20]) strokePts([[-18, y], [10, y + 4], [36, y - 1]], 'rgba(30,22,20,0.4)', 1.2);
        for (const x of [4, 22]) strokePts([[x, -36], [x + 2, 30]], 'rgba(220,205,190,0.18)', 1.4);
        hatch(null, 0.7, 3.4, 0.2);
      } };
      cfg.avant.turban = { parent: 'head', at: [0, 0], pts: TURB_NOIR, base: m.turb, seed: sd + 21, noRivet: true, paint: turbanPaint(m.turb, 'rgba(0,0,0,0.6)', 'rgba(170,150,140,0.28)') };
    } else if (qui === 'barbu') {
      Object.assign(cfg, { torso: BAR_T, torsoBase: m.haut,
        legs: { L1: 112, L2: 112, w: 22, bouffant: true, pant: m.pant, pantD: m.pantD, shoe: m.shoe, shoeD: m.shoeD, bas: m.pantD, seed: sd + 30 },
        torsoPaint: () => {
          const g = [[-48, -162], [-26, -178], [8, -164], [16, -116], [22, -40], [24, 28], [-48, 30]];
          fillPts(g, m.gilet); strokePts([[8, -164], [16, -116], [22, -40], [24, 28]], C.sable, 2.2);
          for (const y of [-120, -90, -60]) dot(19, y, 2.4, C.sable);
          fillPts([[-46, -30], [42, -32], [42, -14], [-46, -12]], C.sienne);                                 // ceinture de tissu sienne
          strokePts([[-44, -22], [42, -24]], 'rgba(60,30,14,0.45)', 1.2);
          hatch([[-50, -170], [-12, -170], [-10, 30], [-50, 30]], 0.75, 4.2, 0.32); shade(42, 0, -44, 0, 0.28);
        } });
      cfg.avant.barbe = { parent: 'head', at: [0, 0], pts: BARBE_N, base: '#191512', seed: sd + 20, noRivet: true, paint: () => {
        for (let i = 0; i < 22; i++) { const x = -18 + (i % 6) * 9, y = -20 + Math.floor(i / 6) * 18; strokePts([[x, y], [x + 3, y + 6], [x, y + 12]], 'rgba(110,104,120,0.5)', 1.1); }
        strokePts([[20, -24], [30, -22], [36, -20]], 'rgba(120,60,50,0.8)', 1.6);
        hatch(null, 0.9, 3, 0.25);
      } };
      cfg.avant.turban = { parent: 'head', at: [0, 0], pts: TURB_OCRE, base: m.turb, seed: sd + 21, noRivet: true, paint: () => {
        turbanPaint(m.turb, 'rgba(110,76,30,0.6)', 'rgba(255,240,200,0.35)')();
        pc(ell(-2, -108, 12, 8, 12), '#B48E54', () => strokePts([[-10, -108], [8, -110]], 'rgba(110,76,30,0.6)', 1.2), sd + 22);
      } };
    } else {
      Object.assign(cfg, { torso: GR_T, torsoBase: m.haut, cuff: m.hautD, cuffD: m.hautD,
        legs: { L1: 122, L2: 121, w: 16, bouffant: false, pant: m.pant, pantD: m.pantD, hem: 62, robe: m.haut, robeD: m.hautD, shoe: m.shoe, shoeD: m.shoeD, bas: m.pantD, seed: sd + 30 },
        torsoPaint: () => {
          for (const x of [-16, 0, 14]) strokePts([[x, -150], [x + 2, -40], [x + 1, 24]], 'rgba(30,24,16,0.35)', 1.2);
          fillPts([[-34, -24], [30, -26], [30, -18], [-34, -16]], '#2E2620');
          hatch([[-40, -170], [-10, -170], [-8, 30], [-40, 30]], 0.75, 4.2, 0.32); shade(30, 0, -32, 0, 0.3);
        } });
      cfg.fond.cape = { parent: 'torso', at: [-20, -168], pts: [[12, -8], [-14, -10], [-28, 40], [-40, 140], [-48, 250], [-52, 334], [-18, 340, 1], [2, 250], [8, 140], [16, 40]], base: m.cape, seed: sd + 15, noRivet: true,
        paint: () => { for (const x of [-30, -12]) strokePts([[x + 10, 20], [x, 180], [x - 4, 330]], 'rgba(10,14,8,0.45)', 1.4); hatch(null, 0.8, 4, 0.3); } };
      cfg.avant.capeF = { parent: 'torso', at: [0, 0], pts: [[-36, -178], [-12, -188], [14, -178], [24, -158], [10, -140], [-20, -134], [-40, -146]], base: m.cape, seed: sd + 16, noRivet: true,
        paint: () => { strokePts([[-36, -150], [10, -146]], 'rgba(10,14,8,0.45)', 1.2); hatch(null, 0.6, 3.6, 0.25); }, extra: () => { pc(ell(14, -160, 6, 6, 10), '#9A7A3A', () => dot(13, -161, 2, '#E2C677'), sd + 17); } };
      cfg.avant.bouc = { parent: 'head', at: [0, 0], pts: BOUC, base: '#5B4A3A', seed: sd + 20, noRivet: true, paint: () => hatch(null, 1.2, 2.8, 0.3) };
      cfg.avant.bonnet = { parent: 'head', at: [-2, -84], pts: BONNET, base: m.bonnet, seed: sd + 21, noRivet: true, paint: () => {
        fillPts(R4(-40, 6, 40, 18), '#232C46'); strokePts([[-36, 7], [36, 7]], 'rgba(200,190,170,0.3)', 1.2);
        strokePts([[-20, 0], [-8, -50], [-14, -90]], 'rgba(10,14,30,0.5)', 1.3); hatch(null, 0.5, 3.6, 0.25); shade(30, -40, -30, 0, 0.25, [-60, -110, 50, 20]);
      } };
    }
    return mkPerso(cfg);
  }
  CH.sesChef = mkVoleur('chef'); CH.sesBarbu = mkVoleur('barbu'); CH.sesGrand = mkVoleur('grand');
  SES.voleur = function (pose, x, y, s, o) {
    const qui = (pose && pose.qui) || 'chef', def = qui === 'grand' ? CH.sesGrand : qui === 'barbu' ? CH.sesBarbu : CH.sesChef;
    return build(def, pose, x, y, s == null ? 0.88 : s, o, null);
  };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, draw, base, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 1) : s;
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-base[0], -base[1]); draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  SES.hache = (x, y, s, o) => acc('hache', drawHache, OBJ.hache.base, x, y, s, o, 0.9);
  SES.sac = (x, y, s, o) => acc('sac', (oo) => { const c = cx_(); c.save(); c.translate(0, -142 * (oo.taille || 1)); drawSac(oo); c.restore(); }, [0, 0], x, y, s, o, 0.9);
  SES.piece = (x, y, s, o) => acc('piece', drawPiece, [0, -26], x, y, s, o, 1);

  // bûche de bois debout (billot) : (x,y) = bas ; 92 × 100 ; fendue 0..1 = les deux moitiés s'écartent
  function drawBuche(o) {
    const f = ease(k01(o.fendue)), c = cx_();
    const half = (sg) => {
      c.save(); c.translate(sg * 46 * 0.9, 0); c.rotate(sg * 0.55 * f); c.translate(-sg * 46 * 0.9, 0); c.translate(sg * 30 * f, 0);
      const pts = sg < 0 ? [[-46, 2, 1], [-48, -60], [-44, -96], [-22, -100], [0, -100, 1], [0, 2, 1]] : [[0, 2, 1], [0, -100, 1], [22, -100], [44, -96], [48, -60], [46, 2, 1]];
      pc(pts, '#6E5038', () => {
        for (let x = -44; x <= 44; x += 7) strokePts([[x, -94], [x + 2, -50], [x - 1, 0]], 'rgba(40,26,14,0.45)', 1.2);
        fillPts(f > 0.05 ? R4(sg < 0 ? -6 : 0, -100, sg < 0 ? 0 : 6, 2) : OFFP, '#D2B07A');
        hatch(null, 0.2, 4, 0.2); shade(sg * 44, -50, -sg * 10, -50, 0.25, [-60, -110, 60, 10]);
      }, 8401 + (sg > 0 ? 1 : 0));
      c.restore();
    };
    half(-1); half(1);
    if (f < 0.05) {                                                             // dessus : bois de bout, cernes
      pc(ell(0, -100, 46, 11, 20), '#D2B07A', () => { for (const r of [34, 22, 11]) strokePts(ell(0, -100, r, r * 0.24, 16), 'rgba(140,96,50,0.6)', 1, true); }, 8403);
    }
  }
  SES.buche = (x, y, s, o) => acc('buche', drawBuche, [0, 0], x, y, s, o, 0.9);
  // fagot de branches liées, couché : (x,y) = bas-centre ; 230 × 66
  function drawFagot() {
    for (let i = 0; i < 9; i++) {
      const y = -8 - (i % 3) * 18 - Math.floor(i / 3) * 6, x0 = -112 + hash(i * 3.7) * 12, x1 = 108 + hash(i * 5.1) * 14;
      pc([[x0, y - 6], [x1, y - 5 + hash(i) * 4], [x1 + 4, y + 1], [x0 - 2, y + 2]], i % 2 ? '#7A5A3A' : '#6A4C30', () => strokePts([[x0 + 4, y - 3], [x1 - 6, y - 2]], 'rgba(255,230,190,0.25)', 1), 8501 + i);
      if (i % 3 === 0) pc([[x1 - 30, y - 4], [x1 - 4, y - 22], [x1, y - 20], [x1 - 22, y - 2]], '#6A4C30', null, 8520 + i);
    }
    for (const x of [-50, 50]) pc([[x - 6, -62], [x + 6, -62], [x + 7, 2], [x - 7, 2]], '#9C8A62', () => { for (let y = -58; y < 0; y += 5) strokePts([[x - 6, y], [x + 6, y + 3]], 'rgba(60,45,25,0.5)', 1); }, 8530 + x);
  }
  SES.fagot = (x, y, s, o) => acc('fagot', drawFagot, [0, 0], x, y, s, o, 0.9);

  // tas de pièces : (x,y) = bas-centre ; taille 1 = 300 × 150 ; metal 'or' | 'argent' (argent : lingots + plat, bleuté)
  const tasGeom = (o) => { const k = o.taille == null ? 1 : o.taille; return { w: 300 * k, h: 150 * Math.pow(k, 0.85) }; };
  function tasTop(w, h, u) { return -h * Math.pow(Math.max(0, 1 - u * u), 0.75); }
  function drawTas(o) {
    const metal = o.metal === 'argent' ? 'argent' : 'or', G = METAL[metal], { w, h } = tasGeom(o), seed = (o.seed || 1) * 31 + (metal === 'or' ? 0 : 500), R = M.rng(seed);
    const prof = [[-w / 2 - 8, 4, 1]];
    for (let i = 0; i <= 26; i++) { const u = -1 + 2 * i / 26; prof.push([u * w / 2, tasTop(w, h, u) - 4 * hash(seed + i) * (1 - Math.abs(u))]); }
    prof.push([w / 2 + 8, 4, 1]);
    pc(prof, metal === 'or' ? G.D : G.rim, () => {
      for (let yy = -4; yy > -h - 6; yy -= 8) {
        const hw = (w / 2) * Math.sqrt(Math.max(0, 1 - Math.pow(-yy / h, 4 / 3)));
        for (let x = -hw - 6; x < hw + 6; x += 13 + R() * 6) coinFlat(x + R() * 4, yy + R() * 3, 8 + R() * 3, G);
      }
      hatch([[-w, -h * 0.35], [w, -h * 0.35], [w, 6], [-w, 6]], 0.3, 4.6, 0.22);
      shade(0, -h, 0, 4, 0.22, [-w, -h - 10, w, 8]);
    }, seed, { texA: 0.3 });
    for (let i = 0; i < 9; i++) {                                               // pièces debout sur la crête
      const u = -0.8 + 1.6 * hash(seed + i * 9.1), x = u * w / 2, y = tasTop(w, h, u) + 3;
      coinFace(x, y - 7, 8 + 2 * hash(i), G, 0.35 + 0.5 * hash(seed + i));
    }
    if (metal === 'or') {
      const gx = w * 0.12, gy = tasTop(w, h, 0.24) + 6, s0 = Math.min(1, w / 300);
      pc([[gx - 16 * s0, gy - 50 * s0], [gx + 16 * s0, gy - 50 * s0], [gx + 10 * s0, gy - 30 * s0], [gx + 3 * s0, gy - 24 * s0], [gx + 3 * s0, gy - 8 * s0], [gx + 12 * s0, gy, 1], [gx - 12 * s0, gy, 1], [gx - 3 * s0, gy - 8 * s0], [gx - 3 * s0, gy - 24 * s0], [gx - 10 * s0, gy - 30 * s0]], G.base,
        () => { strokePts([[gx - 10 * s0, gy - 46 * s0], [gx - 6 * s0, gy - 32 * s0]], G.hi, 1.4); dot(gx, gy - 40 * s0, 3.5 * s0, C.garance); }, seed + 2);
      for (let i = 0; i < 12; i++) { const u = -0.55 + i * 0.07, x = u * w / 2; dot(x, tasTop(w, h, u) + 14 + 6 * Math.sin(i * 0.9), 2.6, '#EFE8D8'); }   // collier de perles
      dot(-w * 0.2, tasTop(w, h, -0.4) + 18, 4, '#2E6A52'); dot(w * 0.3, tasTop(w, h, 0.6) + 16, 4, C.garance);
    } else {
      const lx = w * 0.18, ly = tasTop(w, h, 0.36) + 10;
      for (let i = 0; i < 3; i++) {                                             // lingots d'argent empilés
        const y = ly - i * 14, x = lx + (i % 2) * 8;
        pc([[x - 26, y], [x + 26, y], [x + 20, y - 13], [x - 20, y - 13]], '#B9C1CB', () => { strokePts([[x - 18, y - 11], [x + 16, y - 11]], G.hi, 1.4); fillPts([[x + 18, y - 12], [x + 25, y - 1], [x + 20, y - 1]], G.D); }, seed + 10 + i);
      }
      const px = -w * 0.2, py = tasTop(w, h, -0.4) + 4;                          // plat d'argent debout
      pc(ell(px, py - 30, 26, 32, 22), G.rim, () => { fillPts(ell(px, py - 30, 19, 24, 18), G.base, 0, 0); strokePts(ell(px, py - 30, 12, 15, 14), G.D, 1.2, true); strokePts(ep(px, py - 30, 22, 27, 8, PI * 1.1, PI * 1.55), G.hi, 1.6); }, seed + 20);
    }
  }
  function scintille(t, w, h, n, seed, metal) {                                 // éclats (repère courant : origine = bas-centre du tas)
    if (SIL()) return;
    const c = cx_(), col = METAL[metal === 'argent' ? 'argent' : 'or'].glint;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const u = (hash(seed + i * 7.3) * 2 - 1) * 0.85, x = u * w / 2, y = tasTop(w, h, u) * (0.2 + 0.75 * hash(seed + i * 3.1));
      const k = Math.pow(Math.max(0, Math.sin(t * (2 + hash(seed + i) * 1.6) + i * 2.1)), 12); if (k < 0.04) continue;
      const L = 10 * k + 2;
      c.strokeStyle = `rgba(${col},${0.9 * k})`; c.lineWidth = 1.6 * M._lw();
      c.beginPath(); c.moveTo(x - L, y); c.lineTo(x + L, y); c.moveTo(x, y - L); c.lineTo(x, y + L); c.stroke();
      c.fillStyle = `rgba(255,255,240,${k})`; c.beginPath(); c.arc(x, y, 2.2 * k + 0.6, 0, TAU); c.fill();
    }
    c.restore();
  }
  SES.tas = (x, y, s, o) => acc('tas', (oo) => { drawTas(oo); const g = tasGeom(oo); if (oo.t != null) scintille(oo.t, g.w, g.h, Math.round(8 * (oo.taille == null ? 1 : oo.taille)) + 3, (oo.seed || 1) * 13, oo.metal); }, [0, 0], x, y, s, o || {}, 1);

  // coffre ouvert qui déborde : (x,y) = milieu du fond ; 200 × 100 (+ couvercle et or : 205 de haut)
  function drawCoffre(o) {
    const G = METAL.or, B = { bois: '#6E4526', boisL: '#8A5A33', boisD: '#4E3019', laiton: '#B08D45' };
    pc([[-104, -96], [104, -96], [96, -186], [80, -204], [-80, -204], [-96, -186]], B.boisD, () => {        // couvercle ouvert (intérieur visible)
      fillPts([[-92, -104], [92, -104], [86, -184], [-86, -184]], '#3E2614');
      for (const x of [-64, 64]) fillPts(R4(x - 7, -204, x + 7, -96), B.laiton);
      hatch(null, 0.1, 4, 0.25);
    }, 8601);
    const mound = [[-100, -92]]; for (let i = 0; i <= 14; i++) { const u = -1 + i / 7; mound.push([u * 98, -100 - 34 * Math.pow(Math.max(0, 1 - u * u), 0.6) - 4 * hash(i)]); } mound.push([100, -92]);
    pc(mound, G.D, () => { const R = M.rng(77); for (let y = -96; y > -136; y -= 7) for (let x = -96; x < 96; x += 12 + R() * 5) coinFlat(x + R() * 3, y + R() * 3, 8 + R() * 2, G); }, 8602, { texA: 0.3 });
    coinFace(-30, -132, 11, G, 0.6); coinFace(40, -128, 10, G, 0.4);
    pc(R4(-100, -100, 100, 0), B.bois, () => {
      for (const y of [-66, -33]) strokePts([[-98, y], [98, y]], 'rgba(30,16,8,0.55)', 1.4);
      for (const x of [-70, 70]) fillPts(R4(x - 8, -100, x + 8, 0), B.laiton);
      fillPts(R4(-100, -100, 100, -90), B.laiton);
      pc([[-14, -92], [14, -92], [14, -62], [0, -54], [-14, -62]], B.laiton, () => dot(0, -74, 4, '#2A1E14'), 8603);
      hatch(null, 0.15, 4.4, 0.22); shade(80, -50, -90, -50, 0.25, [-110, -110, 110, 10]);
    }, 8604);
    for (const [x, y] of [[-60, -86], [-20, -80], [30, -84], [86, -70], [96, -40]]) coinFace(x, y, 10, G, 0.9);    // pièces qui débordent
    for (let i = 0; i < 9; i++) dot(-50 + i * 9, -92 + 12 * Math.sin(i * 0.4) + i * 2, 3, '#EFE8D8');               // perles qui pendent
    for (const [x, y, r] of [[118, -6, 10], [140, -4, 9], [126, -18, 9], [-118, -6, 9]]) coinFace(x, y, r, G, 0.5);
  }
  SES.coffre = (x, y, s, o) => acc('coffre', (oo) => { drawCoffre(oo); if (oo.t != null) scintille(oo.t, 180, 130, 6, 41, 'or'); }, [0, 0], x, y, s, o, 1);
  // jarre de terre cuite : (x,y) = bas ; 80 × 150 ; couleur 'terre' | 'cuivre'
  function drawJarre(o) {
    const col = o.couleur === 'cuivre' ? '#9A6B3A' : '#A0603A', D = o.couleur === 'cuivre' ? '#6E4A26' : '#6E3E24';
    pc([[-15, -150], [15, -150], [17, -140], [12, -130], [30, -112], [40, -80], [38, -40], [26, -10], [14, 0, 1], [-14, 0, 1], [-26, -10], [-38, -40], [-40, -80], [-30, -112], [-12, -130], [-17, -140]], col, () => {
      const wv = []; for (let x = -40; x <= 40; x += 4) wv.push([x, -86 + 4 * Math.sin(x * 0.3)]); strokePts(wv, D, 2.2);
      strokePts([[-36, -100], [36, -100]], D, 1.4); strokePts([[-38, -72], [38, -72]], D, 1.4);
      hatch(null, 0.3, 4, 0.2); shade(30, -80, -40, -80, 0.32, [-50, -160, 50, 10]);
    }, 8701 + (o.couleur === 'cuivre' ? 1 : 0));
    for (const sg of [-1, 1]) pc([[sg * 14, -128], [sg * 30, -134], [sg * 34, -118], [sg * 28, -114], [sg * 26, -126], [sg * 16, -120]], D, null, 8710 + sg);
  }
  SES.jarre = (x, y, s, o) => acc('jarre', drawJarre, [0, 0], x, y, s, o, 1);

  // lampe à huile suspendue : (x,y) = crochet ; chaîne jusqu'aux cintres ; flamme à (x + 58·s, y + 46·s) ; 120 × 80
  SES.lampe = function (x, y, s, t, o) {
    o = o || {}; s = s == null ? 1 : s; t = t || 0; const c = cx_(), sw = 0.03 * Math.sin(t * 1.1 + x * 0.02);
    c.save(); c.strokeStyle = 'rgba(40,30,18,0.85)'; c.lineWidth = 1.8; c.setLineDash([5, 3]); c.beginPath(); c.moveTo(x, -10); c.lineTo(x, y); c.stroke(); c.restore();
    c.save(); c.translate(x, y); c.rotate(sw); c.scale(s, s);
    c.save(); c.strokeStyle = 'rgba(60,44,20,0.85)'; c.lineWidth = 1.4; c.beginPath(); for (const ex of [-26, 0, 26]) { c.moveTo(0, 0); c.lineTo(ex, 46); } c.stroke(); c.restore();
    pc([[-36, 46], [36, 46], [32, 56], [48, 52], [60, 44, 1], [56, 56], [32, 68], [14, 78], [-14, 78], [-32, 68], [-38, 56]], '#B08D45', () => {
      strokePts([[-30, 52], [30, 52]], 'rgba(255,236,170,0.6)', 1.4); for (const ex of [-18, 0, 18]) dot(ex, 64, 2.6, '#7E5E1E');
      shade(20, 50, -30, 70, 0.3, [-50, 40, 70, 90]);
    }, 8801, { texA: 0.35 });
    pc([[-6, 78], [6, 78], [2, 92], [0, 96, 1], [-2, 92]], '#8E6C24', null, 8802);
    const fl = 1 + 0.15 * Math.sin(t * 13 + x) + 0.08 * Math.sin(t * 29 + x * 0.3), k = o.flamme == null ? 1 : o.flamme;
    if (k > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(58, 34, 4, 58, 34, 150 * k); g.addColorStop(0, `rgba(255,200,110,${0.32 * k})`); g.addColorStop(1, 'rgba(255,170,80,0)');
      c.fillStyle = g; c.fillRect(-100, -120, 320, 320);
      c.beginPath(); c.moveTo(53, 44); c.quadraticCurveTo(52, 34 * fl, 58 + 2 * Math.sin(t * 7), 16 - 10 * fl); c.quadraticCurveTo(64, 34 * fl, 63, 44); c.closePath();
      c.fillStyle = `rgba(255,190,80,${0.95 * k})`; c.fill();
      c.beginPath(); c.ellipse(58, 38, 2.6, 6 * fl, 0, 0, TAU); c.fillStyle = `rgba(255,248,210,${k})`; c.fill();
      c.restore();
    }
    c.restore();
  };

  // =====================================================================
  // BULLE DE PENSÉE en carton ivoire avec une poignée de graines de sésame : (x,y) = centre de la bulle ; 300 × 220 à s 1
  // gonfle 0..1 (apparition à ressort), vide (sans graines), envol 0..1 (les graines s'envolent comme des oiseaux, la bulle s'efface),
  // queue [dx,dy] (vers la tête du penseur, défaut [-150, 150]), fil (true), t
  // =====================================================================
  const CLOUD = (() => { const o = [], n = 10; for (let i = 0; i < n; i++) { for (let j = 0; j < 6; j++) { const a = (i + j / 6) / n * TAU, b = Math.sin(PI * j / 6) * (13 + 7 * hash(i * 3.1)); o.push(j === 0 ? [(138 + b) * Math.cos(a), (96 + b * 0.8) * Math.sin(a), 1] : [(138 + b) * Math.cos(a), (96 + b * 0.8) * Math.sin(a)]); } } return o; })();
  const GRAINE = [[0, -10], [4.5, -6], [5.5, 0], [4, 6], [0, 10, 1], [-4, 6], [-5.5, 0], [-4.5, -6]];
  const GRAINES = (() => { const o = [], R = M.rng(4242); for (let i = 0; i < 30; i++) { const a = R() * TAU, r = Math.sqrt(R()); o.push({ x: Math.cos(a) * r * 70, y: 14 + Math.sin(a) * r * 34 - (1 - r) * 18, rot: R() * TAU, h: R(), h2: R() }); } return o; })();
  SES.GRAINES = { centre: [0, 14], w: 150, h: 90 };
  SES.bulle = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const c = cx_(), t = o.t || 0, g = o.gonfle == null ? 1 : clamp(o.gonfle), env = clamp(o.envol || 0);
    if (g <= 0) return;
    const pop = g >= 1 ? 1 : Math.max(0.02, 1 + 2.70158 * Math.pow(g - 1, 3) + 1.70158 * Math.pow(g - 1, 2));
    const fade = 1 - sm(0.25, 0.85, env), qv = o.queue || [-150, 150];
    c.save(); c.translate(x, y); c.scale(s, s);
    if (fade > 0.01) {
      c.save(); c.globalAlpha = fade * (o.alpha == null ? 1 : o.alpha);
      if (o.fil !== false) { c.save(); c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3 / s; c.beginPath(); c.moveTo(0, -100 * pop); c.lineTo(0, -2400); c.stroke(); c.restore(); }
      for (let i = 0; i < 3; i++) { const u = 0.66 + i * 0.15, r = (17 - i * 5) * pop; pc(ell(qv[0] * u, qv[1] * u, r, r * 0.86, 12), '#EEE6D2', null, 9300 + i); }
      c.save(); c.scale(pop, pop);
      pc(CLOUD, '#EEE6D2', () => { hatch(null, 0.7, 5, 0.1); shade(0, -90, 0, 100, 0.18, [-170, -130, 170, 130]); strokePts(ep(-20, -10, 110, 70, 10, PI * 1.05, PI * 1.45), 'rgba(255,255,255,0.6)', 2); }, 9310);
      c.restore(); c.restore();
    }
    if (!o.vide) {
      for (let i = 0; i < GRAINES.length; i++) {
        const G = GRAINES[i], d = G.h * 0.35, u = clamp((env - d) / 0.65), side = G.x >= 0 ? 1 : -1;
        const ga = (1 - sm(0.7, 1, u)) * (o.alpha == null ? 1 : o.alpha); if (ga <= 0.01) continue;
        const ue = u * u * (3 - 2 * u);
        const px = (G.x + side * (60 + 220 * G.h2) * ue + 16 * Math.sin(u * 9 + i)) * pop, py = (G.y - (240 + 280 * G.h) * ue - 30 * Math.sin(u * PI)) * pop;
        c.save(); c.globalAlpha = ga; c.translate(px, py); c.rotate(lerp(G.rot, side * 0.3, ue)); c.scale(pop * 1.1, pop * 1.1);
        if (u > 0.02) {                                                         // petites ailes qui battent
          const fa = 0.5 + 0.6 * Math.sin(t * 24 + i * 1.7);
          c.save(); c.strokeStyle = 'rgba(70,52,26,0.85)'; c.lineWidth = 1.6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(-7, -9 - 5 * fa, -14, -6 - 10 * fa); c.moveTo(0, -2); c.quadraticCurveTo(7, -9 - 5 * fa, 14, -6 - 10 * fa); c.stroke(); c.restore();
        }
        pc(GRAINE, i % 3 ? '#E8D6A2' : '#D9BF7E', () => strokePts([[-2, -6], [-1, 4]], 'rgba(255,250,230,0.7)', 1), 9320 + i, { texA: 0.25 });
        c.restore();
      }
    }
    c.restore();
  };

  // =====================================================================
  // DÉCORS — pré-rendus dans SES.init() ; SES.foret, SES.tronc, SES.falaise (ext. / interieur), SES.caverne
  // =====================================================================
  const PORTE = { x: 700, w: 230, h: 340, haut: 1395 - 340 };
  const FAL = { cx: 790, x0: 520, x1: 1000, w: 580 };
  const FORET = { troncs: [{ x: 165, w: 80 }, { x: 305, w: 150 }], feuilles: [{ x: 150, y: 600 }, { x: 310, y: 500 }, { x: 440, y: 650 }] };
  const CAVE = { or: { x: 290, taille: 1 }, argent: { x: 505, taille: 0.6 }, coffre: { x: 905, s: 0.8 }, jarres: [{ x: 170, s: 1.05, couleur: 'terre' }, { x: 990, s: 0.9, couleur: 'cuivre' }],
    lampes: [{ x: 250, y: 470 }, { x: 520, y: 420 }, { x: 880, y: 470 }] };
  SES.PORTE = PORTE; SES.FALAISE = FAL; SES.FORET = FORET; SES.CAVE = CAVE;
  function doorPts(m, cx) {                                                      // contour de la porte (repère : bas-centre), m = marge
    cx = cx || 0; const hw = PORTE.w / 2 + m, ys = -(PORTE.h - PORTE.w / 2), pts = [[cx - hw, 6, 1]];
    for (let i = 0; i <= 18; i++) { const a = PI + PI * i / 18; pts.push([cx + hw * Math.cos(a), ys + hw * Math.sin(a)]); }
    pts.push([cx + hw, 6, 1]); return pts;
  }
  function doorPathScreen(c, m) { const B = M.ST.back; c.beginPath(); doorPts(m || 0, PORTE.x).forEach((p, i) => (i ? c.lineTo(p[0], B + p[1]) : c.moveTo(p[0], B + p[1]))); c.closePath(); }
  function speckle(c, x0, y0, w, h, n, seed, col) { const R = M.rng(seed); for (let i = 0; i < n; i++) { c.fillStyle = col.replace('A', (0.03 + R() * 0.06).toFixed(3)); c.beginPath(); c.ellipse(x0 + R() * w, y0 + R() * h, 8 + R() * 40, 5 + R() * 24, R() * 3, 0, TAU); c.fill(); } }
  function rocher(cx, cy, rx, ry, n, seed) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.2 * hash(seed + i), k = 0.78 + 0.34 * hash(seed + i * 3.3); o.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a), 1]); } return o; }
  function bumpy(cx, cy, rx, ry, n, amp, seed) { const o = []; for (let i = 0; i < n; i++) for (let j = 0; j < 5; j++) { const a = (i + j / 5) / n * TAU, b = Math.sin(PI * j / 5) * amp * (0.6 + 0.8 * hash(seed + i)); o.push(j === 0 ? [cx + (rx + b) * Math.cos(a), cy + (ry + b) * Math.sin(a), 1] : [cx + (rx + b) * Math.cos(a), cy + (ry + b) * Math.sin(a)]); } return o; }

  function makeCiel() {
    const W = 1080, H = M.ST.back + 5;
    return M.pre(W, H, (c) => {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2E2B47'); g.addColorStop(0.3, '#5E4762'); g.addColorStop(0.55, '#A86E6E'); g.addColorStop(0.76, '#D49A72'); g.addColorStop(1, '#E3BC85');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      const sg = c.createRadialGradient(440, 1060, 10, 440, 1060, 320); sg.addColorStop(0, 'rgba(255,226,160,0.5)'); sg.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = sg; c.fillRect(0, 700, W, 700);
      piece(ell(440, 1060, 58, 58, 28), '#F0CF92', () => shade(440, 1000, 440, 1120, 0.15, [380, 1000, 500, 1120]), { seed: 9001, drop: false });
      for (const [y, x0, x1, col, sd] of [[420, 40, 600, '#6E4F68', 1], [540, 380, 1060, '#8E6270', 2], [700, -20, 520, '#B47C74', 3], [820, 560, 1100, '#C48C76', 4], [930, 60, 380, '#CF9A7A', 5]]) {
        const pts = [[x0, y + 12, 1]], nb = Math.max(3, Math.round((x1 - x0) / 80));
        for (let b = 0; b < nb; b++) { const xa = lerp(x0, x1, b / nb), xb = lerp(x0, x1, (b + 1) / nb), hh = (12 + 22 * hash(sd * 9 + b)) * (1 - 0.6 * Math.abs((b + 0.5) / nb - 0.5) * 2); for (let j = 0; j <= 4; j++) pts.push(j === 0 ? [lerp(xa, xb, j / 4), y - hh * Math.sin(PI * j / 4), 1] : [lerp(xa, xb, j / 4), y - hh * Math.sin(PI * j / 4)]); }
        pts.push([x1, y + 12, 1]);
        piece(pts, col, () => strokePts([[x0 + 20, y - 4], [x1 - 20, y - 6]], 'rgba(255,230,210,0.25)', 1.5), { seed: 9010 + sd, drop: false, texA: 0.4 });
      }
      speckle(c, 0, 0, W, H, 200, 91, 'rgba(255,235,210,A)');
    });
  }
  function makeCollines() {
    const cv = M.cutFlat(1080, 430, 540, 420, () => {
      const far = [[-560, 12, 1]]; for (let x = -560; x <= 560; x += 20) far.push([x, -300 - 50 * Math.sin(x * 0.006 + 1.2) - 20 * Math.sin(x * 0.017)]); far.push([560, 12, 1]);
      piece(far, '#8C6F7E', () => hatch(null, 0.2, 6, 0.12), { seed: 9021, drop: false });
      const near = [[-560, 12, 1]]; for (let x = -560; x <= 560; x += 20) near.push([x, -170 - 40 * Math.sin(x * 0.008 + 3) - 14 * Math.sin(x * 0.03)]); near.push([560, 12, 1]);
      piece(near, '#6E6A4C', () => { hatch(null, 0.25, 5, 0.18); shade(0, -220, 0, 0, 0.2, [-560, -260, 560, 12]); }, { seed: 9022 });
      for (const [x, h] of [[-380, 60], [-300, 46], [-120, 70], [-60, 50], [120, 58], [210, 44]]) {
        const yb = -170 - 40 * Math.sin(x * 0.008 + 3) - 14 * Math.sin(x * 0.03) + 6;
        piece([[x - 3, yb], [x - 3, yb - h * 0.55], [x - 16, yb - h * 0.62], [x - 12, yb - h], [x, yb - h * 1.08], [x + 12, yb - h], [x + 16, yb - h * 0.62], [x + 3, yb - h * 0.55], [x + 3, yb]], '#4E5338', null, { seed: 9030 + x });
      }
    });
    cv.padB = 10; return cv;
  }
  function makeTronc(w, seed, H) {
    const cv = M.cutFlat(w + 160, H + 20, (w + 160) / 2, H + 10, () => {
      const L = [[-w / 2 - 34, 6, 1]], R = [[w / 2 + 34, 6, 1]];
      for (let y = -20; y >= -H; y -= 60) { const fl = Math.max(0, 1 + y / 140) * 26, bend = 10 * Math.sin(y * 0.004 + seed); L.push([-w / 2 - fl + bend + 4 * Math.sin(y * 0.05 + seed), y]); R.push([w / 2 + fl + bend + 4 * Math.sin(y * 0.043 + seed * 2), y]); }
      const pts = L.concat(R.reverse());
      piece(pts, '#5E4B3A', () => {
        for (let x = -w / 2; x < w / 2; x += 9) strokePts([[x + 3 * Math.sin(x), 0], [x + 8 * Math.sin(x * 0.3 + seed), -H * 0.5], [x + 4 * Math.sin(x * 0.7), -H]], 'rgba(30,20,12,0.45)', 1.4);
        for (let x = -w / 2 + 5; x < w / 2; x += 23) strokePts([[x, -40], [x + 4, -H * 0.6]], 'rgba(200,180,150,0.18)', 2);
        for (const [x, y] of [[-w * 0.15, -H * 0.42], [w * 0.2, -H * 0.66]]) { fillPts(ell(x, y, 10, 15, 12), '#3A2C20'); strokePts(ell(x, y, 15, 21, 12), 'rgba(30,20,12,0.5)', 1.2, true); }
        hatch(null, 0.15, 4.4, 0.25); shade(-w / 2, 0, w / 2, 0, 0.3, [-w, -H - 10, w, 10]);
      }, { seed: 9040 + seed });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeFeuilles(seed) {
    const cv = M.cutFlat(420, 360, 210, 350, () => {
      const pts = bumpy(0, -170, 170, 136, 13, 22, seed * 17);
      piece(pts, '#4A5536', () => {
        const R = M.rng(seed * 7);
        for (let i = 0; i < 90; i++) { const x = (R() - 0.5) * 320, y = -170 + (R() - 0.5) * 260; strokePts([[x, y], [x + 7, y - 5], [x + 14, y]], R() < 0.5 ? 'rgba(130,145,96,0.55)' : 'rgba(30,40,24,0.5)', 1.6); }
        shade(0, -300, 0, -40, 0.32, [-200, -330, 200, 0]);
      }, { seed: 9060 + seed });
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeFalaise() {
    const B = 1395, H = B + 10;
    const cv = M.cutFlat(FAL.w, H, FAL.w / 2, B, (c) => {
      const pts = [[-286, 10, 1], [290, 10, 1], [290, -B - 10, 1], [-196, -B - 10], [-206, -1310], [-188, -1220], [-214, -1130], [-204, -1040], [-232, -960], [-222, -860], [-246, -780], [-238, -690], [-258, -600], [-250, -500], [-270, -420], [-258, -330], [-276, -240], [-264, -150], [-282, -60]];
      piece(pts, C.sable, () => {
        for (let i = 0; i < 20; i++) {                                         // strates
          const y0 = -60 - i * 68 - 10 * hash(i), col = i % 3 === 0 ? 'rgba(154,91,52,0.42)' : i % 3 === 1 ? 'rgba(222,190,136,0.45)' : 'rgba(170,112,70,0.28)';
          const top = [], bot = []; for (let x = -300; x <= 300; x += 30) { top.push([x, y0 - 12 * Math.sin(x * 0.012 + i) - 8]); bot.push([x, y0 + 16 + 8 * Math.sin(x * 0.02 + i * 2)]); }
          fillPts(top.concat(bot.reverse()), col, i, 0.6);
          strokePts(top, 'rgba(90,50,26,0.35)', 1.2);
        }
        for (let i = 0; i < 9; i++) {                                          // fissures
          const x = -240 + hash(i * 3.3) * 500, y = -200 - hash(i * 7.7) * 1100, crack = [[x, y]];
          for (let j = 1; j < 6; j++) crack.push([x + 12 * Math.sin(j * 2 + i) + j * 3, y + j * 26]);
          strokePts(crack, 'rgba(60,32,18,0.55)', 1.6);
        }
        hatch(null, 0.9, 5, 0.16);
        shade(-290, 0, -150, 0, 0.35, [-300, -B - 20, 300, 20]);
        // embrasure de la porte : rainure sombre + lumière du bord
        c.save(); c.translate(PORTE.x - FAL.cx, 0);
        fillPts(doorPts(16), 'rgba(110,64,34,0.55)', 0, 0.3);
        strokePts(doorPts(12), 'rgba(60,34,18,0.8)', 4, false);
        strokePts(doorPts(18).slice(1, 10), 'rgba(255,236,190,0.35)', 2);
        // ombre portée du surplomb au-dessus de la porte
        fillPts([[-170, -360], [170, -360], [140, -400], [-150, -404]], 'rgba(80,44,22,0.35)');
        c.restore();
      }, { seed: 9100, texA: 0.55 });
      for (const [x, y, w] of [[-200, -900, 90], [40, -1180, 120], [160, -640, 100], [-120, -520, 70], [120, -420, 80]]) {   // corniches et touffes sèches
        fillPts([[x - w / 2, y + 2], [x + w / 2, y - 4], [x + w / 2 + 6, y + 4], [x - w / 2 - 2, y + 8]], 'rgba(236,212,160,0.7)', x);
        fillPts([[x - w / 2 - 2, y + 8], [x + w / 2 + 6, y + 4], [x + w / 2 - 10, y + 26], [x - w / 2 + 10, y + 24]], 'rgba(90,52,28,0.35)', x + 1);
        for (let k = 0; k < 4; k++) { const tx = x - w / 3 + k * w / 5; strokePts([[tx, y], [tx - 6, y - 16]], '#5E6B45', 2); strokePts([[tx, y], [tx + 5, y - 14]], '#6E7A4E', 2); }
      }
      for (const [x, r] of [[-240, 18], [-226, 12], [60, 14], [86, 22], [112, 12], [240, 20]]) piece(bumpy(x, -r * 0.6, r * 1.3, r * 0.8, 5, 4, x), '#A88054', () => hatch(null, 0.4, 3.6, 0.25), { seed: 9130 + x });   // éboulis
      c.save(); c.globalCompositeOperation = 'destination-out'; c.translate(PORTE.x - FAL.cx, 0);
      c.beginPath(); doorPts(0).forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = '#000'; c.fill(); c.restore();
    });
    cv.padB = 10; return M.withShadow(cv, 10);
  }
  function makeDalle(inside) {
    const cv = M.cutFlat(PORTE.w + 24, PORTE.h + 24, (PORTE.w + 24) / 2, PORTE.h + 12, (c) => {
      piece(doorPts(6), inside ? '#A8977A' : '#DCC69C', () => {
        const g = c.createLinearGradient(0, -PORTE.h, 0, 0); g.addColorStop(0, inside ? 'rgba(255,220,170,0.2)' : 'rgba(255,248,226,0.35)'); g.addColorStop(1, 'rgba(90,60,30,0.12)');
        c.fillStyle = g; c.fillRect(-PORTE.w, -PORTE.h - 20, PORTE.w * 2, PORTE.h + 30);
        strokePts(doorPts(-10).slice(1, -1), inside ? 'rgba(60,44,30,0.45)' : 'rgba(120,90,50,0.4)', 2);
        strokePts(doorPts(-14).slice(2, 10), 'rgba(255,250,236,0.45)', 1.6);
        strokePts([[-60, -120], [-30, -140], [10, -132]], 'rgba(150,120,80,0.25)', 1.2); strokePts([[30, -60], [60, -80]], 'rgba(150,120,80,0.22)', 1.2);
        hatch(null, 0.8, 7, 0.08); shade(80, -170, -120, -170, inside ? 0.35 : 0.22, [-130, -360, 130, 10]);
      }, { seed: inside ? 9151 : 9150, texA: 0.4 });
    });
    cv.padB = 12; return cv;
  }
  function makeParoi() {                                                         // paroi intérieure autour de la porte (ferme posée devant la toile de la caverne)
    const cv = M.cutFlat(440, 790, 220, 780, (c) => {
      const pts = [[-206, 10, 1], [206, 10, 1], [200, -200], [214, -360], [196, -520], [170, -640], [110, -720], [20, -748], [-80, -736], [-160, -680], [-196, -560], [-212, -400], [-200, -220]];
      piece(pts, '#4A3B3A', () => {
        for (let i = 0; i < 10; i++) { const y0 = -40 - i * 72, top = [], bot = []; for (let x = -220; x <= 220; x += 30) { top.push([x, y0 - 10 * Math.sin(x * 0.02 + i)]); bot.push([x, y0 + 18 + 6 * Math.sin(x * 0.03 + i * 2)]); } fillPts(top.concat(bot.reverse()), i % 2 ? 'rgba(70,60,90,0.3)' : 'rgba(110,80,60,0.25)', i); }
        hatch(null, 0.8, 4.4, 0.25);
        fillPts(doorPts(18), 'rgba(30,22,24,0.5)', 0, 0.3); strokePts(doorPts(12), 'rgba(150,120,90,0.55)', 3);
        shade(0, -700, 0, 0, 0.25, [-220, -760, 220, 12]);
      }, { seed: 9160 });
      c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); doorPts(0).forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.restore();
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeCaverne() {
    const W = 1080, H = M.ST.back + 5;
    return M.pre(W, H, (c) => {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16111A'); g.addColorStop(0.45, '#2A1F27'); g.addColorStop(1, '#3E2D26');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (const L of CAVE.lampes) { const lg = c.createRadialGradient(L.x + 58, L.y + 40, 10, L.x + 58, L.y + 40, 420); lg.addColorStop(0, 'rgba(230,160,80,0.30)'); lg.addColorStop(1, 'rgba(200,120,60,0)'); c.fillStyle = lg; c.fillRect(0, 0, W, H); }
      for (const [x, y, rx, ry, col, sd] of [[120, 900, 220, 520, '#3A2C30', 1], [980, 860, 200, 560, '#3A2C30', 2], [540, 1150, 520, 260, '#46352F', 3], [330, 760, 200, 300, '#433336', 4], [760, 700, 220, 320, '#40303A', 5]]) {
        piece(rocher(x, y, rx, ry, 15, sd * 11), col, () => { hatch(null, 0.7, 5, 0.22); for (let k = 0; k < 5; k++) strokePts([[x - rx * 0.6 + k * rx * 0.3, y - ry * 0.7], [x - rx * 0.5 + k * rx * 0.3 + 20, y + ry * 0.2]], 'rgba(10,6,8,0.35)', 1.4); shade(x, y - ry, x, y + ry, 0.3, [x - rx - 40, y - ry - 40, x + rx + 40, y + ry + 40]); }, { seed: 9200 + sd, texA: 0.5, edge: 'rgba(120,96,84,0.55)' });
      }
      const vo = [[0, 0, 1], [W, 0, 1], [W, 360]]; for (let x = W; x >= 0; x -= 40) vo.push([x, 300 - 90 * Math.sin(PI * x / W) + 22 * Math.sin(x * 0.05)]); vo.push([0, 360]);   // voûte
      piece(vo, '#241A1E', () => hatch(null, 0.3, 5, 0.3), { seed: 9210 });
      for (let i = 0; i < 12; i++) { const x = 40 + i * 90 + 20 * hash(i), yb = 300 - 90 * Math.sin(PI * x / W) + 10, h = 40 + 70 * hash(i * 3.3); piece([[x - 18, yb - 20], [x + 16, yb - 20], [x + 4, yb + h], [x, yb + h + 6, 1], [x - 4, yb + h]], '#2E2226', null, { seed: 9220 + i }); }   // stalactites
      for (const [x, y, a, col, col2, sd] of [[110, 1395, -0.32, C.garance, '#C9A46A', 1], [150, 1395, -0.18, C.indigo, C.or, 2]]) {   // tapis roulés appuyés
        c.save(); c.translate(x, y); c.rotate(a);
        piece(R4(-22, -300, 22, 0), col, () => { for (let yy = -280; yy < 0; yy += 34) fillPts(R4(-24, yy, 24, yy + 8), col2); hatch(null, 0.2, 4, 0.25); shade(-22, 0, 22, 0, 0.3, [-30, -310, 30, 10]); }, { seed: 9230 + sd });
        piece(ell(0, -300, 22, 8, 14), '#5A3A22', () => { for (const r of [16, 9]) strokePts(ell(0, -300, r, r * 0.36, 12), 'rgba(255,220,170,0.35)', 1, true); }, { seed: 9240 + sd });
        c.restore();
      }
      speckle(c, 0, 0, W, H, 260, 93, 'rgba(255,200,150,A)');
    });
  }
  function preAcc(draw, w, h, o) { const cv = M.cutFlat(w, h, w / 2, h - 12, () => draw(o || {})); cv.padB = 12; return M.withShadow(cv, 8); }

  SES.init = function () {
    if (SES.K) return SES.K;
    const K = (SES.K = {});
    K.ciel = makeCiel(); K.collines = makeCollines();
    K.troncA = makeTronc(FORET.troncs[0].w, 11, 1260); K.troncB = makeTronc(FORET.troncs[1].w, 12, 1260);
    K.feuilles = [makeFeuilles(1), makeFeuilles(2), makeFeuilles(3)];
    K.falaise = makeFalaise(); K.dalle = makeDalle(false); K.dalleIn = makeDalle(true); K.paroi = makeParoi();
    K.caverne = makeCaverne();
    const go = tasGeom({ taille: CAVE.or.taille }), ga = tasGeom({ taille: CAVE.argent.taille });
    K.tasOr = preAcc(drawTas, go.w + 80, go.h + 110, { metal: 'or', taille: CAVE.or.taille, seed: 3 });
    K.tasArg = preAcc(drawTas, ga.w + 80, ga.h + 120, { metal: 'argent', taille: CAVE.argent.taille, seed: 5 });
    K.coffre = preAcc(drawCoffre, 360, 240, {});
    K.jarre = preAcc(drawJarre, 120, 180, { couleur: 'terre' }); K.jarreC = preAcc(drawJarre, 120, 180, { couleur: 'cuivre' });
    return K;
  };
  // forêt au crépuscule : ciel, collines, deux troncs à gauche, feuillages pendus aux fils. o.tronc:false = sans le gros tronc (le dessiner après les marionnettes par SES.tronc pour cacher Ali)
  SES.foret = function (t, o) {
    o = o || {}; const K = SES.K, c = cx_(), cast = o.cast || { dx: 14, dy: 6, a: 0.3 }, up = o.up || 0;
    c.drawImage(K.ciel, 0, 0);
    if (o.oiseaux && M.oiseaux) M.oiseaux(t, o.oiseaux === true ? { y: 520, brume: 0.5 } : o.oiseaux);
    c.save(); c.translate(0, -up);
    M.flat(K.collines, 540, M.ST.back);
    M.flat(K.troncA, FORET.troncs[0].x, M.ST.back, { rot: 0.004 * Math.sin(t * 0.9), cast });
    if (o.tronc !== false) M.flat(K.troncB, FORET.troncs[1].x, M.ST.back, { rot: 0.003 * Math.sin(t * 0.8 + 1), cast });
    FORET.feuilles.forEach((F, i) => M.hung(K.feuilles[i], F.x, F.y, t, { f: 0.7 + i * 0.13, ph: i * 1.7, amp: 0.018, cast }));
    c.restore();
  };
  SES.tronc = function (t, o) {
    o = o || {}; const K = SES.K, c = cx_(), up = o.up || 0;
    c.save(); c.translate(0, -up);
    M.flat(K.troncB, o.x == null ? FORET.troncs[1].x : o.x, M.ST.back, { rot: 0.003 * Math.sin(t * 0.8 + 1), cast: o.cast || { dx: 14, dy: 6, a: 0.3 } });
    if (o.feuillage !== false) M.hung(K.feuilles[1], FORET.feuilles[1].x + ((o.x == null ? FORET.troncs[1].x : o.x) - FORET.troncs[1].x), FORET.feuilles[1].y, t, { f: 0.83, ph: 1.7, amp: 0.018 });
    c.restore();
  };
  // falaise de grès + porte de rocher (dehors) ou paroi de la caverne + même porte (interieur:true), porte au même x (700)
  // o.ouvre 0..1 (la dalle glisse vers le haut dans la roche), o.lueur 0..1 (lueur dorée du trou ; défaut = ouvre), o.tremble 0..1 (grondement), o.up (px, monte aux cintres),
  // o.fond (true : trou sombre derrière la porte ; false = laisser voir ce qui est derrière), o.cast
  SES.falaise = function (t, o) {
    o = o || {}; t = t || 0; const K = SES.K, c = cx_(), B = M.ST.back, up = o.up || 0, u = clamp(o.ouvre || 0), lu = o.lueur == null ? u : clamp(o.lueur), tm = clamp(o.tremble || 0);
    const jx = tm * (Math.sin(t * 61) * 2.4 + Math.sin(t * 37) * 1.4), jy = tm * Math.sin(t * 53) * 1.3;
    c.save(); c.translate(0, -up);
    if (up > 0) { c.save(); c.strokeStyle = 'rgba(20,15,10,0.7)'; c.lineWidth = 2.2; c.beginPath(); for (const x of o.interieur ? [560, 840] : [600, 960]) { c.moveTo(x, o.interieur ? B - 740 : 10); c.lineTo(x, -2000); } c.stroke(); c.restore(); }
    if (o.fond !== false && u > 0.001) {
      c.save(); doorPathScreen(c, 2); c.clip();
      if (!o.interieur) {
        c.fillStyle = '#1C130E'; c.fillRect(PORTE.x - 140, B - 360, 280, 380);
        if (lu > 0) {
          const g = c.createRadialGradient(PORTE.x, B - 70, 10, PORTE.x, B - 110, 300); g.addColorStop(0, `rgba(255,206,110,${0.9 * lu})`); g.addColorStop(0.45, `rgba(214,150,60,${0.55 * lu})`); g.addColorStop(1, 'rgba(120,70,20,0)');
          c.fillStyle = g; c.fillRect(PORTE.x - 140, B - 360, 280, 380);
          c.save(); c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 10; i++) { const k = Math.pow(Math.max(0, Math.sin(t * (2.4 + hash(i) * 2) + i * 1.9)), 10) * lu; if (k < 0.04) continue; const x = PORTE.x - 90 + hash(i * 5.3) * 180, y = B - 20 - hash(i * 2.9) * 110, L = 9 * k + 2; c.strokeStyle = `rgba(255,240,190,${k})`; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - L, y); c.lineTo(x + L, y); c.moveTo(x, y - L); c.lineTo(x, y + L); c.stroke(); }
          c.restore();
        }
      } else {                                                                  // vu de l'intérieur : le crépuscule dehors
        const g = c.createLinearGradient(0, B - 340, 0, B); g.addColorStop(0, '#B97A72'); g.addColorStop(1, '#E2BC86'); c.fillStyle = g; c.fillRect(PORTE.x - 140, B - 360, 280, 380);
        c.fillStyle = '#6E6A4C'; c.beginPath(); c.moveTo(PORTE.x - 140, B - 40); c.quadraticCurveTo(PORTE.x, B - 80, PORTE.x + 140, B - 50); c.lineTo(PORTE.x + 140, B + 10); c.lineTo(PORTE.x - 140, B + 10); c.fill();
        c.fillStyle = '#4A3E30'; c.fillRect(PORTE.x - 92, B - 300, 34, 300);
      }
      c.restore();
    }
    c.save(); doorPathScreen(c, 3); c.clip();                                   // la dalle disparaît dans la roche en montant
    const D = o.interieur ? K.dalleIn : K.dalle;
    c.drawImage(D, PORTE.x - D.width / 2 + jx, B - (PORTE.h + 12) - u * (PORTE.h + 14) + jy);
    if (u > 0 && u < 1) { c.fillStyle = 'rgba(20,12,8,0.35)'; c.fillRect(PORTE.x - 130, B - 6 - u * (PORTE.h + 14), 260, 8); }
    c.restore();
    if (o.interieur) M.flat(K.paroi, PORTE.x + jx * 0.3, B + jy * 0.3, { cast: o.cast });
    else M.flat(K.falaise, FAL.cx + jx * 0.3, B + jy * 0.3, { cast: o.cast });
    if (tm > 0) {                                                               // poussière qui tombe du linteau
      for (let i = 0; i < 26; i++) {
        const ph = (t * (0.9 + hash(i) * 0.8) + hash(i * 3.7)) % 1, x = PORTE.x - 115 + hash(i * 7.1) * 230 + Math.sin(ph * 6 + i) * 6, y = PORTE.haut - 4 + ph * 330;
        c.fillStyle = `rgba(222,200,160,${0.75 * tm * (1 - ph)})`; c.beginPath(); c.ellipse(x, y, 2.2 + hash(i) * 2, 1.6 + hash(i) * 1.5, 0, 0, TAU); c.fill();
      }
    }
    c.restore();
  };
  // caverne intérieure : toile (voûte, tapis), paroi + porte au même x, lampes, jarres, tas d'or, tas d'argent, coffre ouvert
  // o.porte = options de SES.falaise pour la porte intérieure (ouvre, tremble…), o.tresor (true), o.lampes (true), o.cast
  SES.caverne = function (t, o) {
    o = o || {}; t = t || 0; const K = SES.K, c = cx_(), B = M.ST.back, cast = o.cast || { dx: 14, dy: 6, a: 0.32 };
    c.drawImage(K.caverne, 0, 0);
    SES.falaise(t, Object.assign({ cast }, o.porte || {}, { interieur: true }));
    if (o.lampes !== false) for (const L of CAVE.lampes) SES.lampe(L.x, L.y, 1, t);
    if (o.tresor !== false) {
      for (const j of CAVE.jarres) M.flat(j.couleur === 'cuivre' ? K.jarreC : K.jarre, j.x, B + 2, { scale: j.s, cast });
      const go = tasGeom({ taille: CAVE.or.taille }), ga = tasGeom({ taille: CAVE.argent.taille });
      M.flat(K.tasOr, CAVE.or.x, B + 4, { cast }); c.save(); c.translate(CAVE.or.x, B + 4); scintille(t, go.w, go.h, 12, 39, 'or'); c.restore();
      M.flat(K.tasArg, CAVE.argent.x, B + 6, { cast }); c.save(); c.translate(CAVE.argent.x, B + 6); scintille(t, ga.w, ga.h, 6, 65, 'argent'); c.restore();
      M.flat(K.coffre, CAVE.coffre.x, B + 4, { scale: CAVE.coffre.s, cast }); c.save(); c.translate(CAVE.coffre.x, B + 4 - 100 * CAVE.coffre.s); c.scale(CAVE.coffre.s, CAVE.coffre.s); scintille(t, 180, 40, 5, 41, 'or'); c.restore();
    }
  };
})();
