// persos.js — « Le saint-bernard, le tonneau qui n'a jamais existé » (col du Grand-Saint-Bernard vers 1800) : marionnettes, accessoires et
// décors PROPRES À CETTE VIDÉO. Espace M.sb (alias SB). Appeler SB.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier).
// Aucun texte, lettre, chiffre, logo, croix ni symbole religieux. Déterministe (hash / M.rng) : tout est une fonction pure de t.
(function () {
  const X = M.X, P = M.P, CH = M.chars;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, easeOut, easeIn, smooth, hash, noise, wob } = M;
  const PI = Math.PI, TAU = M.TAU, D = 180 / PI;
  const SB = (M.sb = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const ST = M.ST;

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const rotP = (pts, a, cx, cy) => { cx = cx || 0; cy = cy || 0; const C = Math.cos(a), S = Math.sin(a); return pts.map((p) => { const x = p[0] - cx, y = p[1] - cy, q = [cx + x * C - y * S, cy + x * S + y * C]; if (p[2]) q.push(1); return q; }); };
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  function ribbon(line, w0, w1) {
    const L = [], R = []; w1 = w1 == null ? w0 : w1;
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
  // bord irrégulier (neige, nuage, fourrure) : polygone fermé autour d'un centre, rayon modulé
  function blob(cx, cy, rx, ry, n, seed, amp) { const o = []; amp = amp == null ? 0.18 : amp; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + amp * (hash(seed + i * 7.3) - 0.5) * 2; o.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return o; }
  // ligne de crête irrégulière (congère) de x0 à x1, hauteur h au-dessus de y, fermée par le bas en yb
  function congere(x0, x1, y, h, yb, seed, n) {
    n = n || 14; const o = [[x0, yb, 1]];
    for (let i = 0; i <= n; i++) { const u = i / n, b = Math.sin(PI * u); o.push([lerp(x0, x1, u), y - h * Math.pow(b, 0.7) * (0.88 + 0.24 * hash(seed + i * 3.1)) - 3 * hash(seed + i)]); }
    o.push([x1, yb, 1]); return o;
  }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  function worldPt(x, y) { return mp(cx_().getTransform(), [x, y]); }
  const mix = (a, b, t) => (t <= 0 ? a : M.mixc(a, b, clamp(t)));
  // n'affiche que ce qui est au-dessus de la ligne écran yS (objet planté dans la neige) ; appeler entre save/restore
  function clipAuDessus(yS) { const c = cx_(), T = c.getTransform(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); c.rect(-2000, -2000, 5000, yS + 2000); c.clip(); c.setTransform(T); }
  SB.geo = { ep, ell, ribbon, qbez, blob, congere, rotP };

  // ------------------------------------------------------------ palette
  const C = SB.C = {
    neige: '#e8ecef', neigeO: '#b9c4cf', neigeL: '#f6f8f9', pierre: '#8d8a84', pierreD: '#6c6964', pierreL: '#a9a59d',
    soutane: '#1f1d22', soutaneL: '#3a3640', pelerine: '#29262d', fourrure: '#6e4c2e', fourrureD: '#4e3420', fourrureL: '#8e6a46',
    moufle: '#8b8984', moufleD: '#6e6c68', peauCh: '#d4a386', barbe: '#aaa7a1',
    manteau: '#4f6273', manteauD: '#3e4e5c', cache: '#8e2b25', cacheD: '#6e1f1b', feutre: '#7f7d79', feutreD: '#5e5c59',
    culotte: '#b6a57e', guetre: '#6a5e4e', peauV: '#e0bf9b', favoris: '#5a3a22',
    bois: '#c9a066', boisD: '#9a7444', boisL: '#e2bf86', fer: '#3d3c3e', ferL: '#77777a', cuir: '#6b4224', cuirD: '#4a2c16',
    barry: '#9a5a2c', barryD: '#7a4420', ocre: '#c49a5a', ocreD: '#a07a40', blanc: '#ece6da', blancD: '#d2cabb',
  };

  // =====================================================================
  // OBJETS — un registre ; chaque objet se dessine dans son repère (échelle 1). Tenu : la prise `grip` est sur le poing.
  // =====================================================================
  // ---- tonnelet : couché, axe horizontal, 120 × 84 (fond visible à gauche) ; origine = centre ; o.k échelle (1 ; 1,3 quand il porte le gag) ; o.roule (rad)
  //      sangle de cuir en V jusqu'à un petit anneau de laiton en (0,−64) : c'est par là qu'il pend au collier
  const TON_ANNEAU = 64;
  function drawTonnelet(o) {
    const c = cx_(), k = o.k || 1;
    c.save(); c.scale(k, k); if (o.roule) c.rotate(o.roule);
    for (const sx of [-1, 1]) pc(ribbon([[sx * 30, -36], [sx * 16, -50], [sx * 4, -60]], 5, 4), C.cuir, null, 7103 + sx);          // sangle en V
    pc(ribbon(ep(0, -TON_ANNEAU, 5, 5, 12, 0, TAU), 2.6), '#b08d45', null, 7106);                                                     // anneau
    const corps = [[-50, -33], [-30, -40], [0, -42], [30, -40], [50, -33], [58, -16], [60, 0], [58, 16], [50, 33], [30, 40], [0, 42], [-30, 40], [-50, 33]];
    pc(corps, C.bois, () => {
      for (const y of [-30, -18, -6, 6, 18, 30]) strokePts([[-52, y * 0.82], [-20, y * 0.98], [20, y * 0.98], [58, y * 0.82]], 'rgba(110,70,30,0.5)', 1.2);   // douelles
      for (const x of [-26, 30]) { fillPts([[x - 6, -46], [x + 6, -46], [x + 6, 46], [x - 6, 46]], C.fer); strokePts([[x - 3, -38], [x - 3, 38]], 'rgba(200,200,205,0.5)', 1.3); for (const y of [-24, 0, 24]) dot(x, y, 1.6, '#a0a0a4'); }   // deux cercles de fer
      strokePts([[-40, -30], [44, -30]], 'rgba(255,240,200,0.4)', 2);
      shade(0, -42, 0, 44, 0.32, [-64, -46, 64, 46]);
    }, 7101);
    pc(ell(-50, 0, 13, 34, 20), '#b88c54', () => {                                                                                  // fond du tonnelet (cercles concentriques)
      for (const r of [0.75, 0.45]) strokePts(ell(-50, 0, 13 * r, 34 * r, 14).concat([ell(-50, 0, 13 * r, 34 * r, 14)[0]]), 'rgba(90,55,20,0.5)', 1);
      strokePts([[-56, -20], [-44, -20]], 'rgba(90,55,20,0.4)', 1); strokePts([[-58, 8], [-42, 8]], 'rgba(90,55,20,0.4)', 1);
    }, 7104);
    pc([[-7, -40], [7, -40], [8, -50], [-8, -50]], '#7a5428', () => strokePts([[-5, -47], [5, -47]], 'rgba(255,230,180,0.4)', 1), 7102);   // bouchon de bois
    c.restore();
  }
  // ---- bol de bois fumant : 120 × 52 ; origine = centre du fond ; o.vapeur (true)
  function drawBol(o) {
    const c = cx_();
    pc([[-60, -28], [60, -28], [56, -8], [42, 10], [22, 20], [-22, 20], [-42, 10], [-56, -8]], '#8a5a32', () => {
      for (const y of [-16, -4, 8]) strokePts([[-56, y], [-20, y + 3], [20, y + 3], [56, y]], 'rgba(60,30,10,0.4)', 1.1);
      strokePts([[-50, -22], [-30, 8]], 'rgba(255,220,170,0.3)', 2); shade(-40, 0, 50, 0, 0.35, [-62, -30, 62, 24]);
    }, 7201);
    pc(ell(0, -28, 59, 8, 18), '#5e3a1c', () => fillPts(ell(0, -27, 52, 5.5, 16), '#c98a3c'), 7202);   // bord et soupe
    pc([[-18, 18, 1], [18, 18, 1], [16, 26, 1], [-16, 26, 1]], '#6e4624', null, 7203);
    if (o.vapeur !== false) M.fumee(o.t || 0, { x: 0.001, y: -34, s: 0.32, n: 6, haut: 150, vent: 12, col: '#f6f4ee', a: 0.6, per: 2.4, seed: 7204 });
  }
  // ---- lanterne de fer à quatre vitres (deux vues de profil) : 132 de haut ; origine = fond (base) ; anneau en (0,-124)
  function drawLanterne(o) {
    const c = cx_();
    pc([[-30, -16], [30, -16], [26, 0, 1], [-26, 0, 1]], C.fer, () => strokePts([[-26, -12], [26, -12]], 'rgba(200,200,205,0.4)', 1), 7301);
    pc([[-24, -88, 1], [24, -88, 1], [24, -16, 1], [-24, -16, 1]], 'rgba(255,214,140,0.30)', () => { fillPts([[-20, -84], [-4, -84], [-4, -20], [-20, -20]], 'rgba(255,236,190,0.22)'); strokePts([[-16, -80], [-12, -24]], 'rgba(255,255,255,0.5)', 1.2); }, 7302, { texA: 0.2 });
    if (o.flamme !== false) M.flamme(o.t || 0, { x: 0.001, y: -30, s: 0.62, r: 120, seed: 7303 });
    for (const x of [-24, 0, 24]) pc([[x - 3, -90, 1], [x + 3, -90, 1], [x + 3, -14, 1], [x - 3, -14, 1]], C.fer, null, 7304 + x);
    pc([[-28, -88], [-20, -100], [-8, -112], [8, -112], [20, -100], [28, -88]], C.fer, () => { for (const x of [-12, 0, 12]) dot(x, -98, 2.2, '#1a1a1a'); strokePts([[-20, -96], [20, -96]], 'rgba(200,200,205,0.35)', 1); }, 7310);
    pc([[-6, -110], [6, -110], [5, -116], [-5, -116]], C.fer, null, 7311);
    pc(ribbon(ep(0, -124, 9, 9, 16, 0, TAU), 4.2), C.ferL, null, 7312);   // anneau
  }
  // ---- perche-sonde de bois (longue) : origine = prise ; de y −230 à +330, pointe ferrée ; o.solY : y écran du sol (la pointe s'y enfonce)
  function drawPerche(o) {
    const c = cx_(); c.save(); if (o.solY != null) clipAuDessus(o.solY);
    pc([[-4.5, -232], [4.5, -232], [5, 300], [3, 318], [-3, 318], [-5, 300]], '#9a7444', () => { strokePts([[-1.5, -226], [-1, 300]], 'rgba(255,225,170,0.4)', 1.4); for (let y = -200; y < 300; y += 70) strokePts([[-4, y], [4, y + 6]], 'rgba(60,35,15,0.4)', 1); }, 7401);
    pc([[-5, 300], [5, 300], [1.5, 334], [-1.5, 334]], C.fer, null, 7402);
    c.restore();
  }
  // ---- bâton de marche : origine = prise (pommeau juste au-dessus) ; jusqu'à +250 ; o.solY comme la perche
  function drawBaton(o) {
    const c = cx_(); c.save(); if (o.solY != null) clipAuDessus(o.solY);
    pc([[-4, -22], [4, -22], [5, 250], [-5, 250]], '#6e4a2a', () => { strokePts([[-1, -18], [0, 246]], 'rgba(255,220,170,0.3)', 1.3); for (const y of [40, 120, 190]) fillPts(ell(2, y, 3, 5, 8), 'rgba(40,20,10,0.5)'); }, 7501);
    pc(ell(0, -24, 8, 7, 12), '#5a3a20', null, 7502);
    c.restore();
  }
  // ---- chapeau rond de feutre gris (voyageur) : origine = milieu du bord ; bord 148 de large, calotte basse 40 ; o.gel 0..1 (givre, stalactites)
  const HAT = [[-74, 2, 1], [-60, -3], [-36, -6], [-35, -26], [-28, -38], [-10, -43], [10, -43], [28, -38], [35, -26], [36, -6], [60, -3], [74, 2, 1], [62, 8], [30, 10], [-30, 10], [-62, 8]];
  function hatPaint(gel) {
    return () => {
      fillPts([[-36, -14], [36, -14], [36, -5], [-36, -5]], '#3e3c3a');
      strokePts([[-70, 1], [-36, -4], [36, -4], [70, 1]], 'rgba(255,255,255,0.18)', 1.4);
      hatch([[-36, -42], [36, -42], [36, -14], [-36, -14]], 0.6, 3.6, 0.22); shade(0, -44, 0, 10, 0.25, [-76, -46, 76, 12]);
      if (gel > 0) {
        fillPts([[-34, -30], [-26, -40], [-8, -44], [10, -44], [28, -39], [34, -30], [20, -34], [0, -38], [-18, -34]], `rgba(245,250,255,${0.85 * gel})`);
        fillPts([[-72, 0], [-50, -5], [-36, -7], [-36, -3], [-56, -1]], `rgba(245,250,255,${0.85 * gel})`);
        fillPts([[72, 0], [50, -5], [36, -7], [36, -3], [56, -1]], `rgba(245,250,255,${0.85 * gel})`);
      }
    };
  }
  function drawGlacons(gel) {   // petites stalactites fines sous le bord (elles dépassent du chapeau)
    if (gel <= 0.05 || SIL()) return;
    for (let i = 0; i < 11; i++) { const x = -66 + i * 13 + 4 * hash(i + 3), L = (5 + 10 * hash(i * 5.1)) * gel; fillPts([[x - 1.6, 7], [x + 1.6, 7], [x, 7 + L]], 'rgba(228,240,250,0.95)'); strokePts([[x - 1.6, 7], [x, 7 + L]], 'rgba(120,150,180,0.6)', 0.8); }
  }
  function drawChapeau(o) { pc(HAT, mix(C.feutre, '#9aa8b6', (o.gel || 0) * 0.5), hatPaint(o.gel || 0), 7601); drawGlacons(o.gel || 0); }

  const OBJ = {
    tonnelet: { draw: drawTonnelet, grip: (o) => [0, 34 * (o.k || 1)], pts: { bouchon: [0, -50], anse: [0, -TON_ANNEAU], centre: [0, 0], fond: [0, 42] }, base: [0, 42], k: true },
    bol: { draw: drawBol, grip: [24, 22], p2: () => [-24, 22], pts: { bord: [0, -28], vapeur: [0, -80], fond: [0, 26] }, base: [0, 26] },
    lanterne: { draw: drawLanterne, grip: [0, -124], pts: { flamme: [0, -30], anneau: [0, -124], fond: [0, 0] }, base: [0, 0] },
    perche: { draw: drawPerche, grip: [0, 0], p2: () => [0, 118], pts: { bout: [0, 334], haut: [0, -232] }, base: [0, 334] },
    baton: { draw: drawBaton, grip: [0, 0], pts: { bout: [0, 250], haut: [0, -30] }, base: [0, 250] },
    chapeau: { draw: drawChapeau, grip: [62, 4], pts: { centre: [0, -20] }, base: [0, 8] },
  };
  SB.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, nom, o) => { const q = ob.pts[nom]; if (!q) return null; const k = ob.k ? (o.k || 1) : 1; return [q[0] * k, q[1] * k]; };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  // doigts (ou moufle) dessinés PAR-DESSUS l'objet tenu : ils entourent le corps / l'anse
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const DOIGTS_M = [[-16, -11], [10, -13], [15, -5], [15, 8], [8, 14], [-8, 14], [-16, 5]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const HAND_AT = [2, 92];
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, seed, moufle) {
    const DG = moufle ? DOIGTS_M : DOIGTS;
    return {
      objet: { parent: 'armF_lo', at: HAND_AT, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: HAND_AT, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DG : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: HAND_AT, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: HAND_AT, noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DG : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: HAND_AT, noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p._deux ? DG : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran)
  SB.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ptOf(ob, nom, oo); if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };

  // ---- accessoires seuls (sans tige) : M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s;
    const ob = OBJ[name];
    const def = accDef(name, (oo) => { const c = cx_(), bb = name === 'tonnelet' ? [0, 42 * (oo.k || 1)] : ob.base; c.save(); c.translate(-bb[0], -bb[1]); ob.draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  // (x,y) = point posé au sol (dessous de l'objet) ; tonnelet qui roule : o.roule (rad) — l'axe reste à 41·k au-dessus du sol
  for (const n of ['tonnelet', 'bol', 'lanterne', 'perche', 'baton', 'chapeau']) SB[n] = (x, y, s, o) => acc(n, x, y, s, o);
  SB._intern = { ep, ell, tr, scl, rotP, mp, box, ribbon, qbez, normA, blob, congere, pc, worldPt, mix, clipAuDessus, OFFP, drawTonnelet, TON_ANNEAU, drawChapeau, hatPaint, drawGlacons, HAT, heldParts, heldOpts, gripOf, OBJ, has };

  // =====================================================================
  // MARIONNETTES HUMAINES — bras à articulations rondes (épaule et coude en demi-cercles centrés sur le rivet)
  // =====================================================================
  const R_COUDE = 11.5, LA = 94, SH_F = [-2, -146], SH_B = [-10, -146];
  const LB = Math.hypot(HAND_AT[0], HAND_AT[1]), PHI = Math.atan2(-HAND_AT[0], HAND_AT[1]);
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const MOUF_FIST = [[13, 80], [17, 90], [17, 102], [11, 111], [0, 114], [-9, 110], [-13, 100], [-12, 86]];
  const MOUF_OPEN = [[12, 80], [16, 86], [23, 91], [23, 99], [16, 100], [14, 108], [11, 118], [4, 124], [-5, 122], [-11, 110], [-12, 92]];
  function foreMoufle(kind) { return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[10, 40], [10, 74]], kind === 'open' ? MOUF_OPEN : MOUF_FIST, [[-11, 74], [-11, 40]]); }
  // cuisse (genou rond en bas) et tibia (genou rond en haut, pied vers +x, semelle en len+9)
  function thighR(len, wT, wK) { return [[-wT, -16], [wT - 2, -18], [wT + 1, 30], [wK + 1, len - 6]].concat(ep(0, len, wK, wK, 10, 0, PI), [[-wK - 1, len - 6], [-wT - 1, 30]]); }
  function shinR(len, wK) { return ep(0, 0, wK, wK, 10, PI, TAU).concat([[wK, 30], [wK - 2, len - 22], [wK, len - 12], [wK + 22, len - 5], [wK + 31, len + 3, 1], [wK + 29, len + 9, 1], [-wK - 2, len + 9, 1], [-wK - 3, len - 6], [-wK, len - 30], [-wK + 1, 30]]); }
  const LT = 112, LS = 114, HIP_V = -(2 + LT + LS + 9);
  // IK deux segments (repère du torse). Le coude ne plie QUE vers l'avant (angle d'avant-bras ≤ 0 : convention du kit, bendSign 1)
  function ik2(S, T, L1, L2, ph, genou) {
    L1 = L1 || LA; L2 = L2 || LB; ph = ph == null ? PHI : ph;
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - L1 * Math.sin(a), S[1] + L1 * Math.cos(a)];
      const b = normA(Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - ph - a);
      const ok = genou ? b >= -0.02 : b <= 0.02;
      if (!best || (ok && !best.ok)) best = { a: normA(a), b, ok };
    }
    return best;
  }
  function prep(p) {
    p = p || {};
    return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face),
      tenuO: p.tenuO ? Object.assign({}, p.tenuO) : undefined, tenuBO: p.tenuBO ? Object.assign({}, p.tenuBO) : undefined });
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function armTo(q, arm, T, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  // point écran → repère du torse (avec la pose courante : tilt, dx, dy). Appeler sous la même transformation que la marionnette.
  function toTorso(def, q, x, y, s, dir, P) { const { mats } = M.partMatrices(def, q, x, y, s, dir); return mp(mats.torso.inverse(), P); }
  function marche(q, ph, amp, genou) {
    const A = q.ang, w = ph * TAU, sw = Math.sin(w);
    A.legF = (A.legF || 0) - amp * sw; A.legB = (A.legB || 0) + amp * sw;
    if (genou) { A.legF_lo = (A.legF_lo || 0) + 0.45 * Math.max(0, -Math.cos(w)) * (sw > 0 ? 1 : 0.4); A.legB_lo = (A.legB_lo || 0) + 0.45 * Math.max(0, Math.cos(w)) * (sw < 0 ? 1 : 0.4); }
    A.armF_up = (A.armF_up || 0) + 0.16 * sw; A.armB_up = (A.armB_up || 0) - 0.14 * sw;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(w)) * 7;
  }
  function frisson(q, k) {
    if (!(k > 0)) return;
    const g = M.tg(q.t || 0), A = q.ang;
    q.tilt = (q.tilt || 0) + 0.018 * k * Math.sin(g * 47);
    q.dx = (q.dx || 0) + 2.2 * k * Math.sin(g * 61 + 1);
    A.head = (A.head || 0) + 0.05 * k * Math.sin(g * 53 + 2);
    A.armF_lo = (A.armF_lo || 0) + 0.05 * k * Math.sin(g * 57); A.armB_lo = (A.armB_lo || 0) + 0.05 * k * Math.sin(g * 59 + 1);
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
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(HAND_AT[0], HAND_AT[1]).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, ob.p2(oo)));
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o || {});
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // points nommés du corps (écran) : 'bouche' 'oeil' 'tete' (sommet du crâne) 'main' (poing avant) 'mainB' 'mains' (milieu des deux poings) 'nuque'
  SB.corps = function (r, nom) {
    if (nom === 'bouche') return r.w('head', 28, -27);
    if (nom === 'oeil') return r.w('head', 17, -52);
    if (nom === 'tete') return r.w('head', -2, -100);
    if (nom === 'nuque') return r.w('head', -20, -10);
    if (nom === 'main') return r.w('armF_lo', HAND_AT[0], HAND_AT[1]);
    if (nom === 'mainB') return r.w('armB_lo', HAND_AT[0], HAND_AT[1]);
    if (nom === 'mains') { const a = r.w('armF_lo', HAND_AT[0], HAND_AT[1]), b = r.w('armB_lo', HAND_AT[0], HAND_AT[1]); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
    return null;
  };

  // =====================================================================
  // LE CHANOINE — soutane noire jusqu'aux chevilles, pèlerine courte, col blanc droit, bonnet de fourrure brun rond,
  // barbe courte grise, nez rougi, grosses moufles grises, chaussures montantes. Aucune croix, aucun cordon, aucune capuche.
  // =====================================================================
  const CHN_TORSO = [[-14, -178], [8, -182], [16, -170], [26, -152], [34, -112], [36, -60], [37, 0], [42, 70], [48, 140], [55, 204, 1], [-57, 206, 1], [-50, 140], [-44, 70], [-40, 0], [-38, -60], [-38, -110], [-34, -150], [-26, -168]];
  const CHN_PELERINE = [[-18, -184], [10, -186], [22, -178], [34, -152], [44, -120], [50, -88], [47, -78, 1], [-51, -78, 1], [-55, -92], [-49, -140], [-37, -170]];
  const CHN_BARBE = [[-10, -40], [-2, -32], [10, -31], [22, -34], [31, -34], [35, -29], [32, -22], [34, -14], [31, -4], [25, 4], [13, 10], [0, 8], [-9, 1], [-15, -14], [-15, -30]];
  const CHN_BONNET = (() => { const o = []; for (let i = 0; i <= 18; i++) { const a = PI + i / 18 * PI, k = 1 + (i % 2 ? 0.05 : -0.03); o.push([-4 + Math.cos(a) * 41 * k, -80 + Math.sin(a) * 47 * k]); } return o.concat([[36, -74], [30, -68], [10, -70], [-14, -68], [-40, -66], [-46, -72]]); })();
  const moufPaint = (kind) => () => {
    fillPts([[-30, 74], [30, 74], [30, 140], [-30, 140]], C.moufle);
    fillPts([[-13, 70], [12, 70], [13, 80], [-13, 80]], C.moufleD);
    if (kind === 'open') { strokePts([[14, 92], [8, 100]], 'rgba(40,40,40,0.4)', 1); strokePts([[-2, 98], [-1, 118]], 'rgba(40,40,40,0.3)', 1); }
    else { strokePts([[0, 92], [13, 92]], 'rgba(40,40,40,0.4)', 1); strokePts([[-4, 102], [11, 102]], 'rgba(40,40,40,0.35)', 1); }
    hatch([[-14, 76], [-2, 76], [-2, 124], [-14, 124]], 0.9, 3.2, 0.25);
  };
  function mkChanoine() {
    const handK = (back) => (p) => (back ? p.handB : p.handF) || 'fist';
    const fore = (back, seed) => ({ parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreMoufle(handK(back)(p)), base: back ? '#18161a' : C.soutane, seed,
      paint: (p) => { moufPaint(handK(back)(p))(); hatch([[-14, -10], [-3, -10], [-3, 62], [-14, 62]], 0.9, 3.8, 0.25, 1.05, '200,200,210'); } });
    const legPaint = (back) => () => {
      fillPts([[-40, 196], [60, 196], [60, 262], [-40, 262]], back ? '#1c140e' : '#2c2016');
      strokePts([[-16, 200], [16, 200]], 'rgba(255,240,220,0.2)', 1.2); for (const y of [206, 216]) dot(10, y, 1.4, '#8a7a5a');
      hatch(null, 0.8, 3.5, 0.25);
    };
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: CHN_TORSO, base: C.soutane, seed: 8101, paint: () => {
        for (let y = -100; y < 200; y += 15) dot(28 + y * 0.09, y, 1.5, '#4a4650');                          // boutonnage serré de la soutane
        strokePts([[25, -110], [44, 200]], 'rgba(140,135,150,0.35)', 1);
        strokePts([[-20, 20], [-30, 200]], 'rgba(140,135,150,0.25)', 1.2); strokePts([[8, 40], [10, 200]], 'rgba(140,135,150,0.2)', 1.2);
        hatch([[-60, -170], [-14, -170], [-20, 210], [-60, 210]], 0.75, 4, 0.3, 1.05, '120,115,130'); shade(40, 0, -40, 0, 0.3);
      } },
      pelerine: { parent: 'torso', at: [0, 0], pts: CHN_PELERINE, base: C.pelerine, seed: 8102, noRivet: true, paint: () => {
        fillPts([[-6, -188], [14, -188], [21, -172], [-2, -170]], '#efece4');                                // col blanc droit
        strokePts([[-2, -172], [20, -173]], 'rgba(80,80,90,0.4)', 1);
        strokePts([[-51, -82], [47, -82]], 'rgba(150,145,160,0.35)', 1.4);
        hatch([[-56, -160], [-10, -160], [-10, -78], [-56, -78]], 0.7, 4, 0.3, 1.05, '120,115,130'); shade(0, -190, 0, -76, 0.25, [-60, -190, 60, -76]);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(0.9), base: '#141216', seed: 8103, noRivet: true, paint: legPaint(true) },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(0.9), base: '#1d1b20', seed: 8104, noRivet: true, paint: legPaint(false) },
      armB_up: { parent: 'torso', at: SH_B, pts: armR(LA, 16), base: '#18161a', seed: 8105, paint: () => hatch(null, 0.8, 3.6, 0.3, 1.05, '150,150,160') },
      armB_lo: fore(true, 8106),
      armF_up: { parent: 'torso', at: SH_F, pts: armR(LA, 16), base: C.soutane, seed: 8107, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3, 1.05, '150,150,160') },
      armF_lo: fore(false, 8108),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: C.peauCh, seed: 8109, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-34, -76], [-33, -46], [-26, -28], [-18, -30], [-21, -50], [-14, -74]], C.barbe, 3);   // cheveux gris sous le bonnet
        for (const y of [-64, -52, -40]) strokePts([[-30, y], [-22, y + 6]], 'rgba(90,88,84,0.5)', 1);
        X.earPaint(-8, -44);
        dot(17, -34, 9, 'rgba(200,80,70,0.25)');
        fillPts(ell(33, -38, 6.5, 5.5, 10), 'rgba(196,72,62,0.55)');                                   // nez rougi par le froid
        strokePts([[6, -62], [12, -64]], 'rgba(120,70,50,0.45)', 1); strokePts([[8, -46], [14, -44], [20, -46]], 'rgba(120,70,50,0.4)', 1);   // rides
        strokePts([[24, -48], [28, -44]], 'rgba(120,70,50,0.35)', 1);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(150,146,140,1)', 3.6);
      } },
      barbe: { parent: 'head', at: [0, 0], pts: CHN_BARBE, base: C.barbe, seed: 8110, noRivet: true, paint: (p) => {
        const f = p.face || {};
        for (let i = 0; i < 9; i++) strokePts([[-8 + i * 4.5, -26 + (i % 3) * 3], [-10 + i * 4.5, -10 + (i % 2) * 6]], 'rgba(90,88,84,0.5)', 1);
        fillPts([[18, -34], [33, -34], [35, -29], [22, -29]], '#bdbab4');                                 // moustache
        X.mouth(f, 27, -26, 'rgba(90,40,38,0.95)');
        hatch(null, 1.1, 3, 0.18);
      } },
      bonnet: { parent: 'head', at: [0, 0], pts: CHN_BONNET, base: C.fourrure, seed: 8111, noRivet: true, paint: () => {
        fillPts([[-50, -86], [40, -86], [40, -60], [-50, -60]], C.fourrureD);
        for (let i = 0; i < 26; i++) { const x = -44 + i * 3.2, y = -84 + (i % 3) * 2; strokePts([[x, y], [x + 2, y + 10]], 'rgba(180,140,100,0.45)', 1); }
        for (let i = 0; i < 30; i++) { const a = PI + 0.15 + (i / 30) * (PI - 0.3), r = 18 + (i % 4) * 7; strokePts([[-4 + Math.cos(a) * r, -84 + Math.sin(a) * r * 1.05], [-4 + Math.cos(a) * (r + 7), -84 + Math.sin(a) * (r + 7) * 1.05]], 'rgba(40,24,12,0.4)', 1); }
        shade(-30, -120, 20, -80, 0.25, [-50, -130, 40, -60]);
      } },
    }, heldParts(C.moufle, 8120, true));
    return { hipY: -238, handLen: 92, rod: { part: 'torso', at: [-26, 18] }, nom: 'chanoine', parts,
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'torso', 'pelerine', 'barbe', 'bonnet', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2'] };
  }
  CH.sbChanoine = mkChanoine();
  // gestes du chanoine (0..1 sauf mention). x, y, s, dir : les mêmes que l'appel (pour les cibles écran)
  SB.chanoinePose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.sbChanoine; s = s == null ? 0.9 : s; dir = dir || 1;
    if (q.marche != null) marche(q, q.marche, 0.26, false);
    const T = (P) => toTorso(def, q, x, y, s, dir, P);
    if (q.accueille) { const k = clamp(q.accueille); blend(q, 'armF_up', -1.5, k); blend(q, 'armF_lo', -0.45, k); blend(q, 'armB_up', -0.55, k); blend(q, 'armB_lo', -0.3, k); blend(q, 'head', -0.1, k); if (k > 0.3 && !q.handF) q.handF = 'open'; if (k > 0.5 && !q.face.mouth) q.face.mouth = 'smile'; }
    if (q.porte) { const k = clamp(q.porte); if (!q.tenu) q.tenu = 'lanterne'; blend(q, 'armF_up', -2.05, k); blend(q, 'armF_lo', -0.5, k); blend(q, 'head', -0.14, k);
      A.objet = (A.objet || 0) + 0.07 * Math.sin(M.tg(q.t || 0) * 2.3); }
    if (q.sonde) { const k = clamp(q.sonde), e = clamp(q.enfonce || 0); if (!q.tenu) q.tenu = 'perche'; q.deuxMains = true; q.tilt = (q.tilt || 0) + 0.05 * k;
      q.tenuO = Object.assign({ solY: y + 4 }, q.tenuO); armTo(q, 'armF', [62, -132 + 64 * e], k); blend(q, 'head', 0.22, k); }
    if (q.tend) { const k = clamp(q.tend); if (!q.tenu) q.tenu = 'bol'; q.deuxMains = true; armTo(q, 'armF', [104, -102], k); blend(q, 'head', 0.1, k); if (k > 0.5 && !q.face.mouth) q.face.mouth = 'smile'; }
    if (q.frissonne) { const k = clamp(q.frissonne); armTo(q, 'armF', [58, -184], k); armTo(q, 'armB', [52, -172], k); blend(q, 'head', 0.12, k); if (!q.face.brow) q.face.brow = 'worry'; frisson(q, k); }
    if (q.releve && q.cible) { const k = clamp(q.releve); q.tilt = (q.tilt || 0) - 0.07 * k; const P = T(q.cible); armTo(q, 'armF', P, k); armTo(q, 'armB', [P[0] - 16, P[1] + 10], k); blend(q, 'head', 0.18, k); }
    if (q.caresse && q.cible) { const k = clamp(q.caresse), g = M.tg(q.t || 0); q.tilt = (q.tilt || 0) + 0.05 * k; const P = T([q.cible[0] + 10 * Math.sin(g * 3.2) * dir, q.cible[1]]); if (!q.handF) q.handF = 'open'; armTo(q, 'armF', [P[0] - 8, P[1] - 16], k); blend(q, 'head', 0.25, k); if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (q.ouvre && q.cible) { const k = clamp(q.ouvre); if (!q.handF) q.handF = 'open'; const P = T(q.cible); armTo(q, 'armF', [P[0] - 4, P[1] - 8], k); }
    return finish(q);
  };
  SB.chanoine = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; o = Object.assign({ slot: ST.slotF }, o || {}); return run(CH.sbChanoine, SB.chanoinePose(pose, x, y, s, o.dir || 1), x, y, s, o); };

  // =====================================================================
  // LE VOYAGEUR — vers 1800 : chapeau rond de feutre gris à bord large, calotte basse ; favoris bruns, mèches ; long manteau bleu ardoise
  // boutonné ; très long cache-nez rouge sang qui flotte ; culotte, guêtres ; sac de toile au dos ; bâton.
  // =====================================================================
  const VOY_TORSO = [[-14, -178], [8, -182], [18, -170], [28, -152], [36, -112], [38, -60], [39, 0], [44, 60], [48, 120, 1], [-52, 124, 1], [-48, 60], [-42, 0], [-40, -60], [-39, -110], [-34, -150], [-26, -168]];
  const VOY_CHEVEUX = [[-36, -84], [-44, -70, 1], [-38, -64], [-43, -50, 1], [-35, -46], [-38, -32, 1], [-28, -36], [-24, -26, 1], [-20, -40], [-15, -52], [-8, -70], [4, -74], [10, -66, 1], [16, -76], [24, -68, 1], [26, -80], [33, -82, 1], [20, -94], [0, -100], [-20, -98], [-32, -92]];
  const VOY_FAV = [[-12, -72], [1, -71], [3, -46], [9, -26], [7, -14], [-2, -18], [-9, -40]];
  const VOY_SAC = [[-4, -30], [-22, -30], [-34, -12], [-36, 18], [-26, 34], [-4, 36]];
  // bout arrière du cache-nez : 7 segments de 25 ; p.vent 0 = pend dans le dos … 1 = flotte à l'horizontale (défaut 0,5) ; ondule en temps global
  function echarpePts(p) {
    const g = M.tg(p.t || 0), v = clamp(p.vent == null ? 0.5 : p.vent), th0 = lerp(0.3, 1.4, v), L = [[0, 0]];
    let x = 0, y = 0;
    for (let i = 1; i <= 7; i++) {
      const th = th0 + (0.16 + 0.24 * v) * Math.sin(g * (2.6 + 3.4 * v) - i * 0.9) * (0.3 + i / 7) + 0.02 * i;
      x -= 25 * Math.sin(th); y += 25 * Math.cos(th); L.push([x, y]);
    }
    const r = ribbon(L, 20, 15), n = L.length, e = L[n - 1], e2 = L[n - 2], dx = e[0] - e2[0], dy = e[1] - e2[1], l = Math.hypot(dx, dy) || 1;
    const fr = []; for (let i = 0; i <= 6; i++) { const u = i / 6 - 0.5; fr.push([e[0] - dy / l * 17 * u + dx / l * (i % 2 ? 10 : 2), e[1] + dx / l * 17 * u + dy / l * (i % 2 ? 10 : 2)]); }
    return r.slice(0, n).concat(fr.reverse(), r.slice(n));
  }
  function mkVoyageur() {
    const handK = (back) => (p) => (back ? p.handB : p.handF) || 'fist';
    const gelT = (p, a) => { const g = clamp(p.gel || 0); if (g > 0) fillPts([[-300, -300], [300, -300], [300, 300], [-300, 300]], `rgba(150,180,210,${a * g})`); };
    const fore = (back, seed) => ({ parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(handK(back)(p)), base: back ? C.manteauD : C.manteau, seed,
      paint: (p) => { fillPts([[-20, 76], [20, 76], [24, 130], [-20, 130]], back ? '#c9a585' : C.peauV); X.handPaint(null, handK(back)(p)); gelT(p, 0.45);
        fillPts([[-14, 60], [14, 60], [15, 78], [-14, 78]], '#2f3c48'); hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.25); } });
    const thP = (back) => (p) => { hatch([[-22, -10], [-6, -10], [-6, LT + 8], [-22, LT + 8]], 0.85, 3.8, back ? 0.32 : 0.22); };
    const shP = (back) => (p) => {
      fillPts([[-30, 14], [30, 14], [30, LS - 6], [-30, LS - 6]], back ? '#55493c' : C.guetre);                    // guêtres
      for (let y = 24; y < LS - 10; y += 16) dot(10, y, 1.6, '#2a2018');
      fillPts([[-30, LS - 8], [60, LS - 8], [60, LS + 20], [-30, LS + 20]], back ? '#18120e' : '#241a14');               // soulier
      gelT(p, 0.3); hatch([[-16, -10], [-4, -10], [-4, LS], [-16, LS]], 0.85, 3.8, back ? 0.3 : 0.2);
    };
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: (p) => { const a = clamp(p.assis === true ? 1 : (p.assis || 0)); return a <= 0 ? VOY_TORSO : VOY_TORSO.map((q) => (q[1] > 0 ? [q[0] - (q[0] < 0 ? 12 * a : 0), lerp(q[1], q[1] * 0.3, a), q[2]] : q)); }, base: C.manteau, seed: 8201, paint: (p) => {
        fillPts([[16, -176], [28, -152], [34, -112], [24, -100], [14, -140]], C.manteauD);                    // revers
        for (const y of [-96, -66, -36, -6, 24]) { dot(20, y, 2.6, '#9a8a5a'); dot(32, y + 2, 2.6, '#9a8a5a'); }   // double boutonnage
        strokePts([[-30, 40], [-36, 124]], 'rgba(30,40,50,0.5)', 1.4);                                          // fente des basques
        fillPts([[20, -156], [28, -150], [-34, -36], [-42, -44]], '#7a6a4a');                                   // bretelle du sac (épaule avant → hanche arrière)
        hatch([[-56, -170], [-12, -170], [-12, 126], [-56, 126]], 0.75, 4.2, 0.3); shade(40, 0, -40, 0, 0.28);
        gelT(p, 0.35);
        if ((p.gel || 0) > 0.05) { const g = clamp(p.gel); fillPts([[-34, -160], [-20, -172], [0, -176], [18, -170], [28, -152], [14, -156], [0, -162], [-20, -158]], `rgba(245,250,255,${0.85 * g})`); }
      } },
      basque: { parent: 'legF', at: [0, 0], pts: (p) => ((p.assis === true || (p.assis || 0) > 0.3) ? [[-23, -16], [21, -18], [25, 84], [8, 96], [-25, 88]] : OFFP), base: C.manteau, seed: 8216, noRivet: true, paint: () => { strokePts([[14, -10], [16, 80]], 'rgba(30,40,50,0.45)', 1.2); hatch(null, 0.75, 4.2, 0.28); } },
      sac: { parent: 'torso', at: [-30, -24], pts: VOY_SAC, base: '#b5a888', seed: 8202, noRivet: true, paint: () => { fillPts([[-36, -32], [-2, -32], [-2, -8], [-36, -12]], '#9a8c6c'); dot(-18, -10, 2.4, '#5a4a30'); strokePts([[-30, 6], [-6, 8]], 'rgba(90,70,40,0.5)', 1.2); hatch(null, 0.5, 3.6, 0.25); } },
      echarpeB: { parent: 'torso', at: [-14, -166], pts: echarpePts, base: C.cache, seed: 8203, noRivet: true, paint: (p) => { const L = echarpePts(p), n = (L.length - 7) / 2, e = L[n - 2] || L[0]; for (const k of [0.82, 0.9]) { const a = L[Math.floor(n * k)], b = L[L.length - 1 - Math.floor(n * k)]; if (a && b) strokePts([a, b], C.cacheD, 3.2); } hatch(null, 0.6, 3.6, 0.25); } },
      echarpe: { parent: 'torso', at: [0, 0], pts: (p) => { const g = M.tg(p.t || 0), sw = 3 * Math.sin(g * 4.2) * (0.3 + clamp(p.vent == null ? 0.55 : p.vent));
        return [[-26, -190], [20, -190], [30, -172], [32, -150], [26, -146], [24 + sw * 0.3, -120], [30 + sw, -70], [26 + sw, -62], [22 + sw, -68], [18 + sw, -62], [14 + sw, -70], [12 + sw * 0.3, -118], [8, -148], [-24, -156]]; },
        base: C.cache, seed: 8204, noRivet: true, paint: () => { strokePts([[-24, -172], [28, -168]], C.cacheD, 2); for (const y of [-110, -90]) strokePts([[10, y], [30, y + 2]], C.cacheD, 2); hatch(null, 0.6, 3.6, 0.25); } },
      legB: { parent: 'torso', at: [-6, -2], pts: thighR(LT, 19, 12.5), base: '#958660', seed: 8205, noRivet: true, paint: thP(true) },
      legB_lo: { parent: 'legB', at: [0, LT], pts: shinR(LS, 12.5), base: '#958660', seed: 8206, paint: shP(true) },
      legF: { parent: 'torso', at: [6, -2], pts: thighR(LT, 19, 12.5), base: C.culotte, seed: 8207, noRivet: true, paint: thP(false) },
      legF_lo: { parent: 'legF', at: [0, LT], pts: shinR(LS, 12.5), base: C.culotte, seed: 8208, paint: shP(false) },
      armB_up: { parent: 'torso', at: SH_B, pts: armR(LA, 16), base: C.manteauD, seed: 8209, paint: (p) => { hatch(null, 0.8, 3.6, 0.3); gelT(p, 0.35); } },
      armB_lo: fore(true, 8210),
      armF_up: { parent: 'torso', at: SH_F, pts: armR(LA, 16), base: C.manteau, seed: 8211, paint: (p) => { hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3); gelT(p, 0.35);
        if ((p.gel || 0) > 0.05) fillPts([[-15, -14], [0, -19], [15, -12], [10, -4], [-10, -6]], `rgba(245,250,255,${0.85 * clamp(p.gel)})`); } },
      armF_lo: fore(false, 8212),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: C.peauV, seed: 8213, noRivet: true, paint: (p) => {
        const f = Object.assign({}, p.face || {}), te = clamp(p.teint || 0), gl = clamp(p.gel || 0);
        if (te > 0.5 && !f.mouth) f.mouth = 'smile';
        fillPts(VOY_FAV, C.favoris);
        for (const y of [-64, -52, -40, -28]) strokePts([[-6, y], [2, y + 8]], 'rgba(40,24,12,0.5)', 1);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        dot(18, -34, 8 + 4 * te, `rgba(205,80,70,${0.18 + 0.4 * te})`);
        fillPts(ell(33, -38, 5.5, 5, 10), `rgba(200,70,60,${0.1 + 0.5 * te})`);
        if (gl > 0) { fillPts([[-300, -300], [300, -300], [300, 300], [-300, 300]], `rgba(140,175,210,${0.42 * gl})`); dot(33, -38, 5, `rgba(120,150,200,${0.4 * gl})`); }
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(70,45,25,0.95)', 2.6); X.mouth(f, 27, -27);
        if (gl > 0.05) { strokePts([[9, -62], [17, -65], [25, -62]], `rgba(250,252,255,${gl})`, 3.2); strokePts([[-4, -60], [-6, -40]], `rgba(250,252,255,${0.7 * gl})`, 2.4); }
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: VOY_CHEVEUX, base: '#5e3b22', seed: 8214, noRivet: true, paint: () => { for (const x of [-34, -26, -18, -8]) strokePts([[x, -80], [x - 3, -44]], 'rgba(30,16,8,0.5)', 1.2); hatch(null, 1.2, 3.2, 0.25); } },
      chapeau: { parent: 'head', at: [-2, -84], pts: HAT, base: C.feutre, seed: 8215, noRivet: true, paint: (p) => { hatPaint(clamp(p.gel || 0))(); gelT(p, 0.2); }, extra: (p) => drawGlacons(clamp(p.gel || 0)) },
    }, heldParts(C.peauV, 8220, false));
    return { hipY: HIP_V, handLen: 92, rod: { part: 'torso', at: [-26, 18] }, nom: 'voyageur', parts,
      order: ['echarpeB', 'armB_up', 'armB_lo', 'objetB', 'doigtsB', 'sac', 'legB', 'legB_lo', 'legF', 'legF_lo', 'head', 'cheveux', 'torso', 'basque', 'echarpe', 'chapeau', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2'] };
  }
  CH.sbVoyageur = mkVoyageur();
  SB.voyageurPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.sbVoyageur; s = s == null ? 0.9 : s; dir = dir || 1;
    const ch = q.chapeau || 'tete';
    if (ch !== 'tete') q.hide.chapeau = 1;
    if (ch === 'main') { if (!q.tenu) { q.tenu = 'chapeau'; q.tenuO = Object.assign({ gel: q.gel || 0 }, q.tenuO); if (!(p.ang && (p.ang.armF_up != null))) { blend(q, 'armF_up', -0.42, 1); blend(q, 'armF_lo', -0.5, 1); } }
      else if (!q.tenuB) { q.tenuB = 'chapeau'; q.tenuBO = Object.assign({ gel: q.gel || 0 }, q.tenuBO); blend(q, 'armB_up', -0.5, 1); blend(q, 'armB_lo', -0.5, 1); } }
    if (q.marche != null) marche(q, q.marche, 0.34, true);
    const T = (P) => toTorso(def, q, x, y, s, dir, P);
    const as = clamp(q.assis === true ? 1 : (q.assis || 0));
    if (as > 0) {
      q.dy = (q.dy || 0) + 192 * as; q.tilt = (q.tilt || 0) - 0.06 * as;
      blend(q, 'legF', -2.35, as); blend(q, 'legF_lo', 2.35 + 0.06, as); blend(q, 'legB', -2.2, as); blend(q, 'legB_lo', 2.2 + 0.06, as);
      const kn = mp(new DOMMatrix().translate(6, -2).rotate(A.legF * D), [0, LT]);
      if (!q.palpe && !q.boit) { armTo(q, 'armF', [kn[0] + 8, kn[1] + 34], as); armTo(q, 'armB', [kn[0] - 2, kn[1] + 40], as); }
      q.hide.sac = 1;
    }
    if (q.couche) { q.hide.sac = 1; if (q.vent == null) q.vent = 0; }
    const en = clamp(q.enseveli || 0);
    if (en > 0) { blend(q, 'armF_up', -2.85, Math.min(1, en * 1.5)); blend(q, 'armF_lo', -0.25, Math.min(1, en * 1.5)); if (!q.handF) q.handF = 'open'; }
    if (q.suspendu) { const k = clamp(q.suspendu); blend(q, 'armF_up', -2.98, k); blend(q, 'armF_lo', -0.12, k); blend(q, 'armB_up', -2.9, k); blend(q, 'armB_lo', -0.2, k);
      const g = M.tg(q.t || 0); blend(q, 'legF', 0.1 + 0.08 * Math.sin(g * 2.1), k); blend(q, 'legF_lo', 0.22, k); blend(q, 'legB', -0.12 + 0.08 * Math.sin(g * 2.1 + 1), k); blend(q, 'legB_lo', 0.35, k); blend(q, 'head', -0.2, k); }
    if (q.palpe && q.cible) { const k = clamp(q.palpe); q.tilt = (q.tilt || 0) + 0.06 * k * (1 - as); if (!q.handF) q.handF = 'open'; const P = T(q.cible); armTo(q, 'armF', [P[0] - 12, P[1] - 34], k); blend(q, 'head', 0.2, k); }
    if (q.boit) {
      const k = clamp(q.boit);
      if (q.cible) { q.tilt = (q.tilt || 0) + 0.08 * k * (1 - as); const P = T(q.cible); armTo(q, 'armF', P, k); blend(q, 'head', 0.28, k); }
      else {
        if (!q.tenu) q.tenu = 'tonnelet';
        blend(q, 'head', -0.32, k);
        const m = headPt(q, 30, -27);
        if (q.tenu === 'bol') { q.deuxMains = true; A.objet = (A.objet || 0) - 0.55 * k; armTo(q, 'armF', [m[0] + 96, m[1] + 4], k); }
        else { A.objet = (A.objet || 0) - 1.25 * k; armTo(q, 'armF', [m[0] + 80, m[1] + 26], k); }
        if (!q.face.eyes) q.face.eyes = 'closed';
      }
    }
    frisson(q, clamp(q.frisson || 0));
    if ((q.frisson || 0) > 0.3 && !q.face.brow) q.face.brow = 'worry';
    return finish(q);
  };
  SB.voyageur = function (pose, x, y, s, o) {
    s = s == null ? 0.9 : s; o = Object.assign({ slot: ST.slotF }, o || {}); const dir = o.dir || 1;
    const q = SB.voyageurPose(pose, x, y, s, dir), c = cx_(), def = CH.sbVoyageur;
    const cou = clamp(q.couche === true ? 1 : (q.couche || 0)), en = clamp(q.enseveli || 0);
    let r;
    if (cou > 0) {
      c.save(); const R = new DOMMatrix().translate(x, y - 44 * s * cou).rotate(-90 * ease(cou) * dir).translate(-x, -y);
      c.setTransform(c.getTransform().multiply(R)); r = run(def, q, x, y, s, Object.assign({}, o, { rod: false, floorShadow: false })); c.restore();
    } else if (en > 0) {
      c.save(); c.beginPath(); c.rect(-2000, -2000, 5000, y + 2002); c.clip();
      q.dy = (q.dy || 0) + 360 * en; r = run(def, q, x, y, s, Object.assign({}, o, { floorShadow: en < 0.3 })); c.restore();
      if (q.tas !== false) SB.monticule(q.t || 0, x + 8 * s * dir, y, s, { h: lerp(0.45, 1, en) * (q.tasH || 1), seed: 5 });
    } else r = run(def, q, x, y, s, Object.assign({}, o, q.suspendu ? { rod: false, floorShadow: false } : {}));
    return r;
  };
  // tas de neige (aussi l'option monticule du col) : (x, y) = pied au sol ; 340·s de large, 140·s·h de haut
  SB.monticule = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s; const h = (o.h == null ? 1 : o.h) * 140 * s, w = 175 * s, sd = o.seed || 1;
    const bosse = (hh, y0, yb, sd2) => { const P = [[x - w, yb, 1]]; for (let i = 0; i <= 22; i++) { const u = i / 22, b = Math.pow(Math.sin(PI * u), 0.85) * (0.86 + 0.14 * Math.sin(PI * u * 3 + sd2)); P.push([x - w + 2 * w * u, y0 - hh * b - 2.5 * hash(sd2 + i)]); } P.push([x + w, yb, 1]); return P; };
    pc(bosse(h, y + 6, y + 14, sd), C.neige, () => {
      fillPts(bosse(h * 0.42, y + 8, y + 16, sd + 9), C.neigeO);
      for (let i = 0; i < 7; i++) { const u = 0.15 + i * 0.11; strokePts([[x - w + 2 * w * u, y - h * 0.62 * Math.sin(PI * u)], [x - w + 2 * w * (u + 0.05), y - h * 0.45 * Math.sin(PI * u)]], 'rgba(150,170,190,0.35)', 1.2); }
      shade(x - w, y - h, x + w, y, 0.18, [x - w - 10, y - h - 10, x + w + 10, y + 20], '90,110,140');
    }, 620 + sd, { drop: true });
  };

  // =====================================================================
  // LE SAINT-BERNARD (def.libre : animal). Origine = sol sous le corps ; regarde vers +x. À s 1 : garrot ≈ 312 px, ≈ 490 px de la croupe à la truffe.
  // Robe 'a' = Barry (blanc à grandes plaques brun-roux, masque brun, liste blanche) | 'b' (blanc, une seule tache fauve clair sur le dos).
  // Pattes en IK (pied posé au sol) : avant = épaule → coude (en arrière) → poignet → pied ; arrière = hanche → grasset (en avant) → jarret → pied.
  // =====================================================================
  const ROBE = {
    a: { base: C.blanc, baseD: '#c9c0b0', tache: C.barry, tacheD: C.barryD, oreille: '#6e3a1a', masque: '#5a3018', queueBout: C.blanc },
    b: { base: C.blanc, baseD: '#c9c0b0', tache: C.ocre, tacheD: C.ocreD, oreille: '#b8894a', masque: null, queueBout: C.blanc },
  };
  const H0 = [-150, -222], S0 = [105, -212], NB0 = [124, -262], TB0 = [-198, -286];
  const BODY = [[128, -302], [95, -313], [40, -307], [-20, -299], [-90, -301], [-150, -311], [-194, -294], [-210, -258], [-210, -214], [-196, -178], [-176, -156], [-150, -146, 1], [-140, -152], [-120, -144], [-96, -152], [-74, -142], [-50, -150], [-26, -140], [0, -148], [24, -138], [48, -146], [70, -130], [92, -132], [118, -136], [148, -156], [166, -194], [170, -236], [160, -274]];
  const SADDLE_A = [[118, -330], [40, -330], [-60, -326], [-160, -332], [-222, -306], [-226, -226], [-204, -196], [-150, -206], [-104, -214], [-40, -222], [16, -220], [66, -230], [106, -246], [126, -276]];
  const TACHE_B = (() => { const o = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; o.push([-44 + Math.cos(a) * 92 * (1 + 0.08 * Math.sin(i * 2.7)), -306 + Math.sin(a) * 34 * (1 + 0.1 * Math.cos(i * 1.9))]); } return o; })();
  const HEADP = [[-40, -36], [-30, -66], [-6, -84], [22, -90], [46, -86], [60, -74], [66, -62], [92, -60], [108, -57], [116, -50], [118, -38], [115, -30], [114, -18], [112, 0], [104, 14], [88, 20], [70, 18], [54, 10], [38, 24], [14, 38], [-18, 36], [-40, 8]];
  const JAW = [[48, 4], [100, 0], [106, 8], [98, 18], [70, 24], [48, 18]];
  const EAR = [[0, 0], [26, -6], [37, 14], [38, 44], [28, 70], [10, 77], [-5, 60], [-9, 28]];
  const PAW = [[-24, -13], [8, -17], [28, -9], [35, 2], [32, 13, 1], [-26, 13, 1], [-30, 2]];
  const app = (m, pts) => pts.map((p) => { const q = mp(m, p); if (p[2]) q.push(1); return q; });
  function capsule(A, B, wa, wb) { const th = Math.atan2(B[1] - A[1], B[0] - A[0]); return ep(A[0], A[1], wa, wa, 8, th + PI / 2, th + PI * 1.5).concat(ep(B[0], B[1], wb, wb, 8, th - PI / 2, th + PI / 2)); }
  function twoBone(A, P, L1, L2, bend) {
    const dx = P[0] - A[0], dy = P[1] - A[1], d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
    const th = Math.atan2(dy, dx), a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    return [A[0] + L1 * Math.cos(th + bend * a), A[1] + L1 * Math.sin(th + bend * a)];
  }
  function gait(ph, off, L, h) { const u = (((ph + off) % 1) + 1) % 1, st = 0.62; if (u < st) { const v = u / st; return [L / 2 - L * v, 0]; } const v = (u - st) / (1 - st); return [-L / 2 + L * ease(v), -h * Math.sin(PI * v)]; }
  function drawChien(p) {
    const o = p.o || {}, R = ROBE[o.robe === 'b' ? 'b' : 'a'], c = cx_(), pts = (o._pts = {}), t = o.t || 0, g = M.tg(t);
    const as = clamp(o.assis === true ? 1 : (o.assis || 0)), co = clamp(o.couche === true ? 1 : (o.couche || 0)) * (1 - as);
    const fl = clamp(o.flaire || 0), rg = clamp(o.regard || 0), te = clamp(o.tete || 0), se = clamp(o.secoue || 0), ab = clamp(o.aboie || 0), rm = clamp(o.remue || 0);
    const mv = o.trot != null ? { ph: o.trot, L: 150, h: 44, b: 9 } : o.marche != null ? { ph: o.marche, L: 104, h: 28, b: 5 } : null;
    const cr = o.creuse != null ? o.creuse : null;
    // --- corps : hanche H, angle β
    let Hx = H0[0], Hy = H0[1], be = 0;
    Hx = lerp(Hx, -118, as); Hy = lerp(Hy, -66, as); be = lerp(be, -0.66, as);
    Hx = lerp(Hx, -146, co); Hy = lerp(Hy, -116, co); be = lerp(be, 0.0, co);
    if (mv) { const w = mv.ph * TAU; Hy += -mv.b * Math.abs(Math.sin(w)); be += 0.018 * Math.sin(w); }
    be += 0.07 * fl * (1 - as) + (cr != null ? 0.13 : 0);
    if (se > 0) { be += 0.07 * se * Math.sin(g * 31); Hx += 4 * se * Math.sin(g * 29); }
    const Mb = new DOMMatrix().translate(Hx, Hy).rotate(be * D).translate(-H0[0], -H0[1]);
    const S = mp(Mb, S0), H = [Hx, Hy];
    // --- pattes : cibles des pieds (sol y = 0, centre du pied à −13)
    const PY = -13;
    const legs = { fN: [S0[0] + 4, PY], fF: [S0[0] - 14, PY], hN: [-138, PY], hF: [-156, PY] };
    if (as > 0) { legs.fN = [lerp(legs.fN[0], S[0] + 8, as), PY]; legs.fF = [lerp(legs.fF[0], S[0] - 8, as), PY]; legs.hN = [lerp(legs.hN[0], Hx + 96, as), PY]; legs.hF = [lerp(legs.hF[0], Hx + 80, as), PY]; }
    if (co > 0) { legs.fN = [lerp(legs.fN[0], S[0] + 66, co), PY]; legs.fF = [lerp(legs.fF[0], S[0] + 44, co), PY]; legs.hN = [lerp(legs.hN[0], Hx + 74, co), PY]; legs.hF = [lerp(legs.hF[0], Hx + 56, co), PY]; }
    if (mv && as + co < 0.01) {
      const a1 = gait(mv.ph, 0, mv.L, mv.h), a2 = gait(mv.ph, 0.5, mv.L, mv.h), b1 = gait(mv.ph, 0.58, mv.L, mv.h), b2 = gait(mv.ph, 0.08, mv.L, mv.h);
      legs.fN = [legs.fN[0] + a1[0], PY + a1[1]]; legs.fF = [legs.fF[0] + a2[0], PY + a2[1]]; legs.hN = [legs.hN[0] + b1[0], PY + b1[1]]; legs.hF = [legs.hF[0] + b2[0], PY + b2[1]];
    }
    if (cr != null && as + co < 0.01) { const w = cr * TAU; legs.fN = [S[0] + 40 + 46 * Math.cos(w), PY - 44 * Math.max(0, Math.sin(w))]; legs.fF = [S[0] + 28 + 46 * Math.cos(w + PI), PY - 44 * Math.max(0, Math.sin(w + PI))]; }
    const lie = Math.max(as, co);
    const jarret = (P) => [P[0] - lerp(20, 62, lie), P[1] - lerp(68, 10, lie)];
    const poignet = (P) => [P[0] - lerp(2, 26, co), P[1] - lerp(36, 8, co)];
    function patteAv(P, col, seed, near) {
      const W = poignet(P), E = twoBone(S, W, 100, 82, 1);
      pc(capsule(S, E, 34, 24), col, () => hatch(null, 1.2, 3.6, 0.15), seed);
      pc(capsule(E, W, 24, 20), col, () => { hatch(null, 1.2, 3.6, 0.15); if (near) strokePts([[E[0] - 12, E[1] + 20], [W[0] - 14, W[1] - 6]], 'rgba(120,110,95,0.35)', 1); }, seed + 1);
      pc(capsule(W, [P[0] + 2, P[1] - 4], 20, 18), col, null, seed + 2);
      pc(tr(PAW, P[0], P[1]), col, () => { for (const x of [6, 16, 25]) strokePts([[P[0] + x, P[1] - 8], [P[0] + x + 2, P[1] + 9]], 'rgba(90,80,70,0.55)', 1.1); }, seed + 3);
      M.rivet(E[0], E[1], 2.6); M.rivet(W[0], W[1], 2.2);
    }
    function patteAr(P, col, seed, near) {
      const J = jarret(P), K = twoBone(H, J, 104, 86, -1);
      pc(capsule(H, K, 50, 27), col, () => { hatch(null, 1.0, 3.6, 0.15); if (R.tache && o.robe !== 'b') fillPts(capsule(H, K, 60, 18), R.tache); }, seed);
      pc(capsule(K, J, 27, 19), col, () => hatch(null, 1.2, 3.6, 0.15), seed + 1);
      pc(capsule(J, [P[0] - 2, P[1] - 4], 19, 18), col, () => { if (near) strokePts([[J[0] - 16, J[1] + 4], [J[0] - 22, J[1] + 22]], 'rgba(255,255,255,0.5)', 1.2); }, seed + 2);
      pc(tr(PAW, P[0], P[1]), col, () => { for (const x of [6, 16, 25]) strokePts([[P[0] + x, P[1] - 8], [P[0] + x + 2, P[1] + 9]], 'rgba(90,80,70,0.55)', 1.1); }, seed + 3);
      M.rivet(K[0], K[1], 2.6); M.rivet(J[0], J[1], 2.2);
    }
    // --- tête : articulation N au bout du cou
    let Nx = 172, Ny = -322, hth = -0.04;
    const NB = mp(Mb, NB0);
    Nx = NB[0] + 34; Ny = NB[1] - 46;
    if (as > 0) { Nx += 8 * as; Ny -= 6 * as; hth += 0.12 * as; }
    if (co > 0) { Nx += 16 * co; Ny += 6 * co; }
    Nx += 52 * fl; Ny += 168 * fl; hth += 1.2 * fl;
    Nx -= 6 * rg; Ny -= 16 * rg; hth -= 0.55 * rg;
    hth -= 0.16 * ab;
    if (cr != null) { Nx += 20; Ny += 50; hth += 0.55; }
    if (mv) hth += 0.04 * Math.sin(mv.ph * TAU * 2);
    let roll = -0.3 * te + (se > 0 ? 0.32 * se * Math.sin(g * 31 + 1) : 0);
    const Mh = new DOMMatrix().translate(Nx, Ny).rotate(hth * D).scale(1.1).translate(50, -40).rotate(roll * D).translate(-50, 40);
    // --- queue (portée basse, longue, touffue) : remue
    const TB = mp(Mb, TB0);
    let ta = 0.12 + 0.45 * as + 0.55 * co - 0.15 * (mv ? 1 : 0) + rm * 0.32 * Math.sin(g * 13) + 0.05 * Math.sin(g * 1.3);
    if (as > 0 || co > 0) ta += -be;
    function queue() {
      const Lq = qbez([0, 0], [-40, 58], [-36, 140], 12).concat(qbez([-36, 140], [-34, 172], [-12, 186], 5).slice(1));
      const rl = rotP(scl(Lq, 1 - 0.3 * lie), ta - 0.25 * lie).map((q) => [q[0] + TB[0], q[1] + TB[1]]);
      const rb = ribbon(rl, 42, 18);
      const n = rb.length / 2;
      for (let i = 0; i < n; i += 2) { rb[i][0] -= 5 * (i % 4 ? 1 : 0.4); }
      pc(rb, R.base, () => { fillPts(ribbon(rl.slice(0, 12), 50, 30), R.tache); for (let i = 2; i < rl.length; i += 2) strokePts([rl[i], [rl[i][0] - 14, rl[i][1] + 6]], 'rgba(120,100,80,0.4)', 1); }, 8301);
    }
    const D_ = R.baseD;
    // ---------------- dessin (du fond vers l'avant)
    patteAv(legs.fF, D_, 8310, false);
    patteAr(legs.hF, D_, 8320, false);
    queue();
    if (cr != null && !SIL()) for (let i = 0; i < 8; i++) { const u = (((cr * 1.6 + i / 8) % 1) + 1) % 1, x = S[0] + 20 - u * 460, y = -10 - Math.sin(PI * u) * 150; pc(blob(x, y, (6 + 4 * hash(i)) * (1 - 0.4 * u), (5 + 3 * hash(i + 1)) * (1 - 0.4 * u), 8, 640 + i, 0.3), C.neige, null, 640 + i, { drop: false }); }
    // corps
    const bodyW = app(Mb, BODY);
    pc(bodyW, R.base, () => {
      if (o.robe === 'b') fillPts(app(Mb, TACHE_B), R.tache, 8331);
      else { fillPts(app(Mb, SADDLE_A), R.tache, 8332); fillPts(app(Mb, [[-40, -330], [40, -330], [30, -300], [-30, -304]]), R.tacheD); }
      for (let i = 0; i < 9; i++) { const q = mp(Mb, [-150 + i * 30, -150]); strokePts([q, [q[0] - 4, q[1] + 10]], 'rgba(150,140,125,0.6)', 1.2); }
      hatch(null, 0.8, 3.8, 0.16, 1.05, M.P.encre, [-260, -360, 200, -100]);
      const a = mp(Mb, [0, -310]), b = mp(Mb, [0, -140]); shade(a[0], a[1], b[0], b[1], 0.28, [-260, -380, 220, -90]);
    }, 8330);
    patteAr(legs.hN, R.base, 8340, true);
    // cou
    const N = [Nx, Ny], mid = [(NB[0] + Nx) / 2 + 6, (NB[1] + Ny) / 2 - 2];
    const neck = ribbon([NB, mid, [Nx - 6, Ny + 6]], 150, 116);
    pc(neck, R.base, () => { fillPts(ribbon([[NB[0] - 30, NB[1] - 30], [mid[0] - 20, mid[1] - 26], [Nx - 22, Ny - 18]], 60, 50), R.tache); hatch(null, 0.9, 3.8, 0.15); }, 8350);
    // collier de cuir (sur le cou, près de la tête) + anneau
    const cu = 0.7, cA = [lerp(NB[0], Nx, cu), lerp(NB[1], Ny, cu)], dxn = Nx - NB[0], dyn = Ny - NB[1], ln = Math.hypot(dxn, dyn) || 1, nx = -dyn / ln, ny = dxn / ln;
    const half = 58, cw = 10;
    const collier = [[cA[0] - nx * half - dxn / ln * cw, cA[1] - ny * half - dyn / ln * cw], [cA[0] - nx * half + dxn / ln * cw, cA[1] - ny * half + dyn / ln * cw], [cA[0] + nx * half + dxn / ln * cw, cA[1] + ny * half + dyn / ln * cw], [cA[0] + nx * half - dxn / ln * cw, cA[1] + ny * half - dyn / ln * cw]];
    const ring = [cA[0] + nx * (half + 4), cA[1] + ny * (half + 4)];
    // tête (mâchoire derrière, puis tête, oreille)
    c.save(); c.setTransform(c.getTransform().multiply(Mh));
    c.save(); c.translate(50, 8); c.rotate(ab * 0.5); c.translate(-50, -8);
    if (ab > 0.05) pc([[48, 4], [110, -14], [104, 8], [52, 16]], '#5a1c1c', () => { for (const x of [76, 88, 98]) fillPts([[x, -4], [x + 4, -4], [x + 2, 4]], '#f1ead8'); }, 8359);
    pc(JAW, R.base, () => strokePts([[54, 6], [100, 4]], 'rgba(90,40,40,0.5)', 1), 8360);
    c.restore();
    pc(HEADP, R.base, () => {
      if (o.robe !== 'b') {
        fillPts([[-50, -96], [40, -96], [58, -74], [62, -58], [44, -40], [24, -30], [0, -18], [-30, -2], [-50, 12]], R.tache);        // tête brun-roux
        fillPts([[16, -96], [34, -96], [52, -76], [62, -62], [94, -62], [94, -55], [60, -54], [44, -70], [26, -84]], R.base);          // liste blanche (front → museau)
        fillPts([[30, -70], [44, -72], [58, -60], [56, -46], [40, -44], [30, -54]], R.masque);                                         // masque autour de l'œil
      } else fillPts([[-50, -96], [6, -96], [0, -60], [-20, -30], [-50, -20]], 'rgba(196,154,90,0.22)');
      fillPts([[106, -57], [116, -50], [118, -38], [115, -30], [102, -32], [100, -48]], '#1c1614');                                     // truffe large
      dot(110, -48, 2.2, 'rgba(255,255,255,0.35)');
      fillPts([[112, -26], [114, -10], [110, 4], [100, 14], [86, 18], [76, 14], [90, 6], [104, -6]], 'rgba(170,150,135,0.35)');      // babine tombante (ombre)
      strokePts([[114, -24], [108, 2], [94, 14], [74, 14]], 'rgba(90,60,50,0.6)', 1.4);
      for (const [x, y] of [[90, -40], [97, -38], [93, -32], [100, -30]]) dot(x, y, 1.3, 'rgba(60,40,30,0.6)');
      for (const y of [-80, -74]) strokePts([[18, y], [30, y - 2], [40, y + 1]], 'rgba(60,40,30,0.4)', 1.1);                         // rides du front
      strokePts([[36, -66], [46, -70], [56, -66]], 'rgba(40,24,14,0.7)', 2.2);                                                          // arcade
      fillPts([[38, -57], [45, -62], [54, -60], [52, -53], [43, -52]], '#2a1a12');                                                        // œil doux, en amande
      dot(47, -58, 1.4, 'rgba(255,255,255,0.75)');
      strokePts([[39, -52], [46, -48], [53, -51]], 'rgba(160,70,60,0.55)', 1.4);                                                        // paupière basse tombante
      strokePts([[60, -68], [66, -58]], 'rgba(60,40,30,0.35)', 1.3);                                                                    // stop marqué
      hatch(null, 0.7, 3.6, 0.15); shade(110, -30, -30, -30, 0.18, [-50, -100, 130, 45]);
    }, 8361);
    const ea = 0.06 * Math.sin(g * 1.7) + (mv ? 0.1 * Math.sin(mv.ph * TAU * 2) : 0) + (se > 0 ? 0.5 * se * Math.sin(g * 31 + 2) : 0) + 0.3 * te - 0.25 * fl;
    c.save(); c.translate(6, -70); c.rotate(ea); pc(EAR, R.oreille, () => { hatch(null, 0.6, 3, 0.25); strokePts([[6, 10], [12, 60]], 'rgba(30,15,5,0.35)', 1.2); }, 8362); c.restore();
    c.restore();
    // patte avant proche, collier, tonnelet
    patteAv(legs.fN, R.base, 8370, true);
    pc(collier, C.cuir, () => { strokePts([collier[0], collier[3]], 'rgba(255,220,180,0.3)', 1.2); }, 8380);
    if (!SIL()) { c.save(); c.beginPath(); c.arc(ring[0], ring[1], 6, 0, TAU); c.strokeStyle = '#b08d45'; c.lineWidth = 3 * M._lw(); c.stroke(); c.restore(); }
    if (o.tonneau) {
      const k = (o.tonneauK || 1) * 0.8, sw = 0.08 * Math.sin(g * 2.1) + (mv ? 0.12 * Math.sin(mv.ph * TAU * 2) : 0) + (se > 0 ? 0.3 * se * Math.sin(g * 31) : 0);
      c.save(); c.translate(ring[0], ring[1]); c.rotate(sw); c.translate(0, TON_ANNEAU * k);
      drawTonnelet({ k }); c.restore();
      pts.tonneau = [ring[0] - Math.sin(sw) * TON_ANNEAU * k, ring[1] + Math.cos(sw) * TON_ANNEAU * k];
    }
    // effets : neige qui vole (creuse, secoue) — dessin brut
    if (!SIL()) {
      if (se > 0.05) for (let i = 0; i < 18; i++) { const u = (((g * 1.9 + i / 18) % 1) + 1) % 1, a = -PI * 0.95 + (i / 18) * PI * 0.9, cxs = -20, cys = -260, rr = 90 + u * 200; dot(cxs + Math.cos(a) * rr, cys + Math.sin(a) * rr * 0.7, (3.4 + 2 * hash(i)) * (1 - u) * se, `rgba(240,244,248,${0.9 * (1 - u)})`); }
    }
    pts.nez = mp(Mh, [118, -40]); pts.tete = mp(Mh, [18, -90]); pts.oeil = mp(Mh, [46, -56]); pts.gueule = mp(Mh, [100, 10]);
    pts.cou = ring; pts.dos = mp(Mb, [-30, -300]); pts.garrot = mp(Mb, [95, -313]);
    if (!pts.tonneau) pts.tonneau = [ring[0], ring[1] + TON_ANNEAU * 0.8];
  }
  const CHIEN_DEF = { hipY: 0, handLen: 10, rod: { part: 'o', at: [-20, -170] }, nom: 'chien', libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
    parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => drawChien(p) } }, order: ['o'] };
  CH.sbChien = CHIEN_DEF;
  SB.chien = (pose, x, y, s, o) => {
    pose = pose || {}; s = s == null ? 0.85 : s;
    const q = { o: Object.assign({ t: pose.t || 0 }, pose), tilt: pose.tilt || 0, dx: pose.dx || 0, dy: pose.dy || 0 };
    const r = M.puppet(CHIEN_DEF, q, x, y, s, Object.assign({ slot: ST.slotF }, o || {}));
    r.pts = q.o._pts || {}; return r;
  };
  // points écran : 'nez' 'tete' (haut du crâne : main qui caresse) 'oeil' 'gueule' 'cou' (anneau du collier : main qui palpe) 'tonneau' (centre du tonnelet) 'dos' 'garrot'
  SB.chienPt = (r, nom) => { const q = r.pts && r.pts[nom]; return q ? r.w('o', q[0], q[1]) : null; };

  // =====================================================================
  // LE TABLEAU — vu de face : cadre doré mouluré (ou acajou, noir) + toile peinte (deux saint-bernards robe b penchés sur un voyageur
  // affalé dans la neige, ciel de montagne). Pré-rendus dans SB.init(). (x,y) = centre. Grand : 520 × 400 à s 1 ; copies : s ≈ 0,385.
  // =====================================================================
  const TW = 440, TH = 320, FW = 40;
  const KT = {};
  const CADRES = { or: { b: '#b08d45', l: '#e2c47a', d: '#6e5424', fil: '#f3dc9a' }, acajou: { b: '#6b2e1c', l: '#9a4a2c', d: '#3e180e', fil: '#c9a060' }, noir: { b: '#24201f', l: '#4a4440', d: '#0e0c0c', fil: '#b08d45' } };
  function cadre(w, h, fw, col) {
    return M.pre(w, h, (c) => {
      const Cc = CADRES[col];
      const side = (pts, f) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = f; c.fill(); };
      side([[0, 0], [w, 0], [w - fw, fw], [fw, fw]], Cc.l); side([[w, 0], [w, h], [w - fw, h - fw], [w - fw, fw]], Cc.b);
      side([[w, h], [0, h], [fw, h - fw], [w - fw, h - fw]], Cc.d); side([[0, h], [0, 0], [fw, fw], [fw, h - fw]], Cc.b);
      for (const k of [0.25, 0.5, 0.75]) {                                                   // moulures (filets concentriques)
        const e = fw * k; c.strokeStyle = k === 0.5 ? Cc.fil : 'rgba(30,20,10,0.45)'; c.lineWidth = k === 0.5 ? 2.2 : 1.4; c.strokeRect(e, e, w - 2 * e, h - 2 * e);
      }
      for (let i = 0; i < Math.floor((w + h) / 14); i++) {                                      // perles de la moulure intérieure
        const u = i / Math.floor((w + h) / 14), per = 2 * (w + h - 4 * fw * 0.8), d = u * per, iw = w - 2 * fw * 0.8, ih = h - 2 * fw * 0.8;
        let x, y; if (d < iw) { x = fw * 0.8 + d; y = fw * 0.8; } else if (d < iw + ih) { x = w - fw * 0.8; y = fw * 0.8 + d - iw; } else if (d < 2 * iw + ih) { x = w - fw * 0.8 - (d - iw - ih); y = h - fw * 0.8; } else { x = fw * 0.8; y = h - fw * 0.8 - (d - 2 * iw - ih); }
        c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fillStyle = Cc.fil; c.fill();
      }
      for (const [x, y] of [[fw / 2, fw / 2], [w - fw / 2, fw / 2], [w - fw / 2, h - fw / 2], [fw / 2, h - fw / 2]]) {   // rosettes rondes aux angles
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.ellipse(x + Math.cos(a) * fw * 0.17, y + Math.sin(a) * fw * 0.17, fw * 0.12, fw * 0.12, 0, 0, TAU); c.fillStyle = Cc.l; c.fill(); }
        c.beginPath(); c.arc(x, y, fw * 0.14, 0, TAU); c.fillStyle = Cc.fil; c.fill();
      }
      c.strokeStyle = 'rgba(20,12,6,0.85)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3); c.strokeRect(fw - 1, fw - 1, w - 2 * fw + 2, h - 2 * fw + 2);
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.5; c.fillStyle = M.tex.paperPat; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 1; c.fillRect(fw, fw, w - 2 * fw, h - 2 * fw);
    });
  }
  function toileFond(c) {
    const gr = c.createLinearGradient(0, 0, 0, TH); gr.addColorStop(0, '#5f7fa2'); gr.addColorStop(0.55, '#c4d0d8'); gr.addColorStop(1, '#e6e1d2');
    c.fillStyle = gr; c.fillRect(0, 0, TW, TH);
    const mt = (pts, col) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = col; c.fill(); };
    mt([[0, 200], [50, 120], [90, 150], [150, 70], [200, 130], [250, 90], [300, 40], [360, 120], [400, 90], [440, 140], [440, 240], [0, 240]], '#7d8aa0');
    mt([[130, 92], [150, 70], [172, 100], [160, 96], [150, 108], [140, 98]], '#f2f2ee'); mt([[278, 70], [300, 40], [326, 78], [310, 72], [300, 86], [290, 74]], '#f2f2ee');
    mt([[380, 108], [400, 90], [418, 116], [400, 110]], '#f2f2ee');
    mt([[0, 230], [80, 180], [160, 210], [260, 170], [340, 200], [440, 175], [440, 260], [0, 260]], '#9aa5b2');
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.05 + 0.08 * hash(i)})`; c.fillRect(hash(i * 3) * TW, hash(i * 7) * 120, 30 + 40 * hash(i), 3); }   // coups de pinceau du ciel
  }
  function toileSol(c) {
    c.beginPath(); c.moveTo(0, 240); for (let x = 0; x <= TW; x += 20) c.lineTo(x, 236 + 10 * Math.sin(x * 0.03) + 4 * hash(x)); c.lineTo(TW, TH); c.lineTo(0, TH); c.closePath();
    const gr = c.createLinearGradient(0, 230, 0, TH); gr.addColorStop(0, '#f1f0ea'); gr.addColorStop(1, '#cfd6dd'); c.fillStyle = gr; c.fill();
    c.fillStyle = 'rgba(150,165,185,0.45)'; c.beginPath(); c.ellipse(220, 300, 170, 14, 0, 0, TAU); c.fill();
    c.fillStyle = '#6f6a64'; c.beginPath(); c.ellipse(60, 262, 34, 16, 0, PI, TAU); c.fill(); c.fillStyle = '#f1f0ea'; c.beginPath(); c.ellipse(60, 254, 30, 7, 0, PI, TAU); c.fill();
  }
  // figures : voyageur affalé (assis, tête tombée), deux chiens robe b penchés (gauche : flaire ; droite : tête basse)
  let figPts = null;
  function toileFigures(c) {
    const T0 = c.getTransform();
    SB.chapeau(330, 296, 0.3, { rot: 0.5 });
    const g1 = SB.chien({ t: 0, robe: 'b', flaire: 0.5 }, 112, 290, 0.3, { dir: 1, rod: false, floorShadow: false });
    SB.voyageur({ t: 0, couche: 1, ang: { head: -0.3, armF_up: -0.5, armF_lo: -0.6 }, face: { eyes: 'closed', brow: 'worry' }, chapeau: 'aucun' }, 168, 290, 0.3, { dir: -1, rod: false, floorShadow: false });
    const g2 = SB.chien({ t: 0, robe: 'b', flaire: 0.45 }, 360, 292, 0.3, { dir: -1, rod: false, floorShadow: false });
    figPts = { cou: SB.chienPt(g2, 'cou') };
    c.setTransform(T0);
  }
  function toileTonneau(c) {
    const p = figPts.cou, T0 = c.getTransform(), m = T0.inverse(), q = mp(m, p);
    c.save(); c.translate(q[0], q[1] + TON_ANNEAU * 0.8 * 0.3); c.scale(0.3 * 0.8, 0.3 * 0.8); drawTonnelet({ k: 1 }); c.restore();
    KT.tonBox = [q[0] - 22, q[1] - 6, q[0] + 22, q[1] + 34];
  }
  function vernis(c) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(232,214,170,0.28)'; c.fillRect(0, 0, TW, TH); c.globalAlpha = 0.35; c.fillStyle = M.tex.canvasPat; c.fillRect(0, 0, TW, TH); c.restore(); }
  function initTableau() {
    KT.toile0 = M.pre(TW, TH, (c) => { c.fillStyle = '#e9e1cf'; c.fillRect(0, 0, TW, TH); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.6; c.fillStyle = M.tex.canvasPat; c.fillRect(0, 0, TW, TH); });
    KT.fond = M.pre(TW, TH, (c) => { toileFond(c); vernis(c); });
    KT.sol = M.pre(TW, TH, (c) => { toileSol(c); });
    KT.fig = M.pre(TW, TH, (c) => { toileFigures(c); });
    KT.ton = M.pre(TW, TH, (c) => { toileTonneau(c); });
    KT.cadre = { or: cadre(TW + 2 * FW, TH + 2 * FW, FW, 'or'), acajou: cadre(TW + 2 * FW, TH + 2 * FW, FW, 'acajou'), noir: cadre(TW + 2 * FW, TH + 2 * FW, FW, 'noir') };
    KT.vide = cadre(860, 1100, 56, 'or');
    for (const k in KT.cadre) M.withShadow(KT.cadre[k], 10);
    M.withShadow(KT.vide, 12);
  }
  // révèle un calque de gauche à droite avec un bord de pinceau irrégulier ; v 0..1 ; zone [x0,x1]
  function pinceau(c, cv, v, x0, x1, y0, y1, seed) {
    if (v <= 0) return; if (v >= 1) { c.drawImage(cv, 0, 0); return; }
    const X1 = lerp(x0 - 30, x1 + 30, v);
    c.save(); c.beginPath(); c.moveTo(x0 - 40, y0 - 10);
    const n = 16; for (let i = 0; i <= n; i++) { const y = lerp(y0 - 10, y1 + 10, i / n); c.lineTo(X1 + 22 * Math.sin(i * 1.7 + seed) * (i % 2 ? 1 : 0.4), y); }
    c.lineTo(x0 - 40, y1 + 10); c.closePath(); c.clip(); c.drawImage(cv, 0, 0); c.restore();
  }
  // SB.tableau(x, y, s, o) : o.peint 0..1 (1) · o.tonneau 0..1 (0) · o.copie 'or'|'acajou'|'noir' (cadre ; défaut 'or') · o.vide (cadre de carte postale 860 × 1100, centre transparent)
  //   o.rot · o.alpha · o.cast ({dx,dy,a} ombre portée) · o.fils (deux fils vers les cintres)
  SB.tableau = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const c = cx_(); if (!KT.fond) initTableau();
    const cad = o.vide ? KT.vide : KT.cadre[o.copie && KT.cadre[o.copie] ? o.copie : 'or'];
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    if (o.fils && !SIL()) { const hw = cad.width / 2 * s * 0.7, top = y - cad.height / 2 * s; c.strokeStyle = 'rgba(30,24,18,0.75)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - hw, top + 4); c.lineTo(x - hw * 1.05, 0); c.moveTo(x + hw, top + 4); c.lineTo(x + hw * 1.05, 0); c.stroke(); }
    c.translate(x, y); if (o.rot) c.rotate(o.rot); c.scale(s, s);
    if (o.cast && cad.shadow) { c.save(); c.globalAlpha *= (o.cast.a == null ? 0.35 : o.cast.a); c.drawImage(cad.shadow, -cad.width / 2 - 20 + (o.cast.dx == null ? 16 : o.cast.dx) / s, -cad.height / 2 - 20 + (o.cast.dy == null ? 8 : o.cast.dy) / s); c.restore(); }
    if (!o.vide) {
      c.save(); c.translate(-TW / 2, -TH / 2);
      const pe = o.peint == null ? 1 : clamp(o.peint);
      c.drawImage(KT.toile0, 0, 0);
      pinceau(c, KT.fond, smooth(0, 0.45, pe), 0, TW, 0, TH, 1);
      pinceau(c, KT.sol, smooth(0.35, 0.7, pe), 0, TW, 220, TH, 2);
      pinceau(c, KT.fig, smooth(0.62, 1, pe), 60, 400, 150, TH, 3);
      const tn = clamp(o.tonneau || 0); if (tn > 0 && KT.tonBox) { const b = KT.tonBox; pinceau(c, KT.ton, tn, b[0], b[2], b[1], b[3], 4); }
      c.restore();
    }
    c.drawImage(cad, -cad.width / 2, -cad.height / 2);
    c.restore();
  };
  SB.TABLEAU = { w: TW + 2 * FW, h: TH + 2 * FW, toile: [TW, TH], vide: [860, 1100] };

  // =====================================================================
  // DÉCOR DU COL DU GRAND-SAINT-BERNARD vers 1800 — SB.col(t, o) (avant M.drawFloor) · SB.colSol(t, o) (après M.drawFloor, avant les
  // marionnettes) · SB.colNeige(t, o) (flocons devant, après les marionnettes). Pré-rendus dans SB.init().
  // Hospice à GAUCHE (porte x 296–372), lac gelé à droite, abreuvoir + luge à droite ; la zone x 250–800 / y 900–1430 reste dégagée.
  // =====================================================================
  const W = 1080, BACK = ST.back;
  const HOS = { x0: 56, x1: 396, eave: 790, ridge: 664, base: BACK,
    fen: [], porte: { x0: 296, x1: 372, y0: 1226, y1: BACK }, lanterne: [272, 1226], cheminee: [146, 606], clocheton: [304, 664], cloche: [304, 606], auvent: [282, 386, 1206] };
  for (const y of [858, 990, 1112]) for (const x of [104, 174, 244, 334]) if (!(y === 1112 && x === 334)) HOS.fen.push({ x, y, w: 36, h: 50 });
  HOS.volet = HOS.fen[7];
  SB.COL = { HOS, crete: { x0: 490, x1: 750, y: 868 }, lac: { x: 770, y: 1200 }, sapin: { x: 900, y: 860 } };
  const KC = {};
  const P3 = (c, pts, col) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = col; c.fill(); };
  function preAt(x0, y0, x1, y1, fn) { const cv = M.pre(x1 - x0, y1 - y0, (c) => { c.translate(-x0, -y0); fn(c); }); cv.ox = x0; cv.oy = y0; return cv; }
  const put = (c, cv, dy) => c.drawImage(cv, cv.ox, cv.oy + (dy || 0));
  // ---------------- ciels (lés cousus)
  function makeCiel(kind) {
    return M.pre(W, BACK + 6, (c) => {
      const S = { normal: ['#93a5b8', '#c6d0d8', '#e0e4e6'], nuit: ['#141d33', '#2c3c5e', '#6a7a9c'], cp: ['#2f78c4', '#6fb0e2', '#cfe8f4'] }[kind];
      const gr = c.createLinearGradient(0, 0, 0, BACK); gr.addColorStop(0, S[0]); gr.addColorStop(0.5, S[1]); gr.addColorStop(1, S[2]); c.fillStyle = gr; c.fillRect(0, 0, W, BACK + 6);
      for (let i = 0; i < 7; i++) {                                             // lés de toile cousus
        const x = 60 + i * 170; c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x - 85, 0, 85, BACK);
        c.strokeStyle = kind === 'nuit' ? 'rgba(160,180,220,0.18)' : 'rgba(90,90,100,0.18)'; c.lineWidth = 1.2; c.setLineDash([6, 7]); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, BACK); c.stroke(); c.setLineDash([]);
      }
      if (kind === 'nuit') for (let i = 0; i < 70; i++) { const x = hash(i * 1.3) * W, y = 160 + hash(i * 2.7) * 520; c.fillStyle = `rgba(240,240,255,${0.3 + 0.5 * hash(i * 5.1)})`; c.beginPath(); c.arc(x, y, 0.8 + 1.4 * hash(i * 9.7), 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.45; c.fillStyle = M.tex.canvasPat; c.fillRect(0, 0, W, BACK + 6);
    });
  }
  // ---------------- montagnes (deux chaînes) : même géométrie, deux palettes
  const FAR = [[-20, 880], [40, 790], [90, 730], [140, 690], [175, 640], [215, 690], [260, 650], [300, 600], [345, 548], [395, 620], [440, 590], [495, 668], [560, 610], [620, 560], [662, 506], [712, 574], [770, 640], [820, 600], [880, 548], [935, 520], [990, 600], [1050, 640], [1100, 700], [1100, 1160], [-20, 1160]];
  const MID = [[-20, 980], [50, 900], [110, 920], [170, 830], [215, 852], [270, 772], [320, 742], [370, 800], [420, 846], [470, 872], [560, 866], [660, 862], [760, 870], [810, 830], [850, 772], [890, 722], [925, 692], [965, 742], [1010, 772], [1100, 800], [1100, 1190], [-20, 1190]];
  const NEAR = [[-20, 1064], [90, 1022], [200, 1046], [330, 1004], [450, 1036], [570, 1018], [690, 1042], [820, 1000], [950, 1026], [1100, 1006], [1100, 1190], [-20, 1190]];
  const capOf = (pts, idx, dn, seed) => { const pk = pts[idx], L = pts[idx - 1], R = pts[idx + 1]; const o = [L.slice(0, 2).map((v, k) => lerp(pk[k], v, 0.55)), pk.slice(0, 2), R.slice(0, 2).map((v, k) => lerp(pk[k], v, 0.55))];
    const a = o[0], b = o[2]; for (let i = 6; i >= 0; i--) { const u = i / 6; o.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + dn * (0.3 + 0.7 * hash(seed + i)) * (i % 2 ? 1 : 0.55)]); } return o; };
  function makeMonts(kind) {
    return M.pre(W, BACK + 6, (c) => {
      const cp = kind === 'cp';
      const far = cp ? '#7b9bd0' : '#a9b3c0', farS = cp ? '#ffffff' : '#e6eaee', farO = cp ? '#6588c0' : '#96a2b2';
      const mid = cp ? '#7a77a0' : '#8c9099', midD = cp ? '#615d88' : '#71757e', midS = cp ? '#ffffff' : '#e8ecef', gla = cp ? '#a8d8f4' : '#c0d4e2';
      pc(FAR, far, () => {
        for (let i = 1; i < FAR.length - 3; i++) if (FAR[i][1] < FAR[i - 1][1] && FAR[i][1] < FAR[i + 1][1]) { P3(c, capOf(FAR, i, 110, i * 7), farS); P3(c, [FAR[i], [FAR[i][0] + 40, FAR[i][1] + 60], [FAR[i][0] + 10, FAR[i][1] + 120]], farO); }
        hatch(null, 0.5, 6, 0.12, 1, M.P.encre, [0, 480, W, 1160]);
      }, 9001, { drop: false, texA: 0.4 });
      pc(MID, mid, () => {
        for (let i = 1; i < MID.length - 3; i++) if (MID[i][1] < 850 && MID[i][1] < MID[i - 1][1] && MID[i][1] < MID[i + 1][1]) {
          const [px, py] = MID[i];
          P3(c, [[px, py], [px - 34, py + 74], [px - 66, py + 42]], midD);                                      // versant à l'ombre
          for (let k = 0; k < 3; k++) { const sx = px - 30 + k * 26, L = 110 + 60 * hash(i * 3 + k); P3(c, [[sx - 5, py + 40], [sx + 5, py + 40], [sx + 10 + 14 * k, py + 40 + L], [sx + 6 + 14 * k, py + 44 + L]], midS); }   // couloirs de neige
          P3(c, capOf(MID, i, 130, i * 11), midS);
        }
        c.strokeStyle = 'rgba(40,40,55,0.4)'; c.lineWidth = 1.3;
        for (let k = 0; k < 14; k++) { const x = 40 + hash(k * 2.3) * 1000, y = 860 + hash(k * 4.1) * 140; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30, y - 6); c.lineTo(x + 58, y + 4); c.stroke(); }   // bancs de roche
        for (const [gx, gy, sd] of [[248, 800, 1], [878, 742, 2]]) {                                            // glaciers : langue qui s'amincit vers le bas, front lobé
          const Lf = [], Rt = []; for (let k = 0; k <= 8; k++) { const u = k / 8, y = gy + u * 210, w = lerp(46, 22, u) + 5 * Math.sin(u * 9 + sd); Lf.push([gx - w + 6 * Math.sin(u * 5 + sd), y]); Rt.push([gx + w + 5 * Math.sin(u * 6 + sd * 2), y]); }
          P3(c, Lf.concat(ep(gx, gy + 210, 24, 12, 8, PI, 0), Rt.reverse()), gla);
          c.strokeStyle = 'rgba(80,110,140,0.45)'; c.lineWidth = 1.2; for (let k = 1; k < 6; k++) { const y = gy + k * 34, w = lerp(40, 20, k / 6); c.beginPath(); c.moveTo(gx - w * 0.7, y); c.quadraticCurveTo(gx, y + 7, gx + w * 0.7, y - 2); c.stroke(); }
        }
        hatch(null, 0.9, 4.6, 0.16, 1, M.P.encre, [0, 700, W, 1190]);
        shade(0, 760, 0, 1190, 0.16, [0, 700, W, 1190], cp ? '40,40,90' : '60,60,70');
      }, 9002, { texA: 0.5 });
      pc(NEAR, cp ? '#f4f8fd' : '#dfe5ea', () => {                                                              // contreforts enneigés, affleurements rocheux
        for (const [x, y, r] of [[120, 1040, 26], [360, 1030, 20], [600, 1036, 18], [840, 1020, 28], [990, 1040, 22]]) { P3(c, blob(x, y, r * 1.4, r * 0.7, 10, x, 0.3), cp ? '#8a86a0' : C.pierreD); P3(c, blob(x, y - r * 0.5, r * 1.2, r * 0.32, 9, x + 1, 0.25), cp ? '#ffffff' : C.neige); }
        c.fillStyle = cp ? 'rgba(130,170,225,0.25)' : 'rgba(150,168,188,0.3)'; c.fillRect(0, 1080, W, 120);
        hatch(null, 0.2, 6, 0.08, 1, M.P.encre, [0, 990, W, 1190]);
      }, 9003, { texA: 0.35 });
    });
  }
  // ---------------- plateau du col : neige, sentier à jalons, lac gelé (droite)
  const SENTIER = [[372, BACK], [470, 1330], [590, 1268], [710, 1226], [820, 1176], [920, 1132], [1040, 1100]];
  const JALONS = [[452, 1344, 46], [575, 1276, 38], [700, 1232, 32], [812, 1182, 26], [912, 1138, 22], [1000, 1112, 18]];
  function makePlateau(kind) {
    return M.pre(W, BACK + 6, (c) => {
      const cp = kind === 'cp';
      const top = []; for (let i = 0; i <= 24; i++) { const x = -20 + i * 47; top.push([x, 1090 + 26 * Math.sin(i * 0.9) + 14 * hash(i + 4)]); }
      pc(top.concat([[1110, BACK + 6, 1], [-20, BACK + 6, 1]]), cp ? '#f7fbff' : C.neige, () => {
        for (let k = 0; k < 4; k++) { const yy = 1150 + k * 60; c.fillStyle = cp ? 'rgba(140,180,230,0.25)' : 'rgba(150,168,188,0.3)'; c.beginPath(); c.moveTo(-20, yy); for (let x = -20; x <= 1110; x += 40) c.lineTo(x, yy + 10 * Math.sin(x * 0.012 + k * 2)); c.lineTo(1110, yy + 26); c.lineTo(-20, yy + 26); c.closePath(); c.fill(); }
        c.strokeStyle = cp ? 'rgba(120,150,200,0.35)' : 'rgba(110,125,145,0.45)'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(SENTIER[0][0], SENTIER[0][1]);
        for (let i = 1; i < SENTIER.length; i++) c.lineTo(SENTIER[i][0], SENTIER[i][1]); c.stroke();
        // lac gelé
        const L = ell(770, 1200, 104, 22, 22); P3(c, L, cp ? '#bfe2f6' : '#b7c8d6');
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.3; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(690 + k * 36, 1194 + (k % 2) * 8); c.lineTo(708 + k * 36, 1206); c.lineTo(726 + k * 36, 1200); c.stroke(); }
        hatch(null, 0.15, 6, 0.08, 1, M.P.encre, [0, 1080, W, BACK]);
      }, 9010, { drop: false, texA: 0.35 });
      for (let i = 0; i < 4; i++) {                                                                      // roches au bord du lac
        const x = [662, 700, 858, 884][i], y = [1196, 1214, 1190, 1206][i], r = [16, 11, 18, 12][i];
        pc(blob(x, y, r, r * 0.7, 9, 9020 + i, 0.25), cp ? '#8a86a0' : C.pierre, () => P3(c, blob(x, y - r * 0.5, r * 0.9, r * 0.3, 8, 9030 + i, 0.2), cp ? '#ffffff' : C.neige), 9020 + i);
      }
      for (const [x, y, h] of JALONS) { pc([[x - 3, y], [x + 3, y], [x + 2, y - h], [x - 2, y - h]], '#6e4a2a', () => { c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x - 3, y - h, 6, 4); }, 9040 + x, { drop: false }); }
    });
  }
  // ---------------- nuages de carton à bords irréguliers (jamais de bord droit) sur fils
  function makeNuage(seed, col, colD) {
    return M.pre(300, 150, (c) => {
      c.translate(150, 80); const R = M.rng(seed), bl = [];
      for (let i = 0; i < 8; i++) bl.push([-100 + i * 28 + 10 * R(), -10 - 30 * Math.sin(PI * (i + 0.5) / 8) * (0.7 + 0.5 * R()) + 6 * R(), 22 + 18 * Math.sin(PI * (i + 0.5) / 8) + 8 * R()]);
      const shape = (gw) => { c.beginPath(); for (const [x, y, r] of bl) { c.moveTo(x + r + gw, y); c.arc(x, y, r + gw, 0, TAU); } for (let i = 0; i < 7; i++) { const x = -90 + i * 30, r = 16 + 6 * R(); c.moveTo(x + r + gw, 14); c.arc(x, 14, r + gw, 0, TAU); } };
      shape(4); c.fillStyle = 'rgba(40,30,20,0.55)'; c.fill(); shape(2); c.fillStyle = 'rgba(250,246,236,0.9)'; c.fill(); shape(0); c.fillStyle = col; c.fill();
      c.save(); shape(0); c.clip(); c.fillStyle = colD; c.fillRect(-150, 16, 300, 60); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.5; c.fillStyle = M.tex.paperPat; c.fillRect(-150, -80, 300, 160); c.restore();
    });
  }
  // ---------------- hospice (pierre grise, toit de lauzes chargé de neige, 3 étages, volets, porte cloutée sous auvent, clocheton SANS croix, cheminée)
  function makeHospice() {
    const cv = preAt(20, 540, 430, BACK + 4, (c) => {
      const { x0, x1, eave, ridge } = HOS;
      // cheminée
      pc([[128, 700], [128, 606], [164, 606], [164, 700]], C.pierreD, () => { for (let y = 616; y < 700; y += 14) { c.strokeStyle = 'rgba(40,40,40,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(128, y); c.lineTo(164, y); c.stroke(); } }, 9101);
      pc(blob(146, 604, 24, 8, 12, 9102, 0.25), C.neige, null, 9102);
      // clocheton (deux piliers, petit toit en pavillon, boule de faîte ; cloche dessinée à part)
      pc([[286, 668], [286, 588], [292, 588], [292, 668]], C.pierre, null, 9103); pc([[316, 668], [316, 588], [322, 588], [322, 668]], C.pierre, null, 9104);
      pc([[278, 592], [304, 556], [330, 592]], '#5a5654', () => { for (let y = 566; y < 592; y += 7) { c.strokeStyle = 'rgba(20,20,20,0.35)'; c.beginPath(); c.moveTo(270, y); c.lineTo(340, y); c.stroke(); } }, 9105);
      pc(blob(304, 566, 18, 7, 10, 9106, 0.2), C.neige, null, 9106);
      pc(ell(304, 552, 4, 4, 8), '#6e6a64', null, 9107);
      // toit de lauzes
      const toit = [[x0 - 18, eave + 6, 1], [x0 + 30, ridge, 1], [x1 - 30, ridge, 1], [x1 + 18, eave + 6, 1]];
      pc(toit, '#5d5a58', () => {
        for (let r = 0; r < 9; r++) { const y = ridge + 6 + r * 15; for (let k = 0; k < 16; k++) { const x = x0 - 10 + k * 26 + (r % 2) * 13; c.fillStyle = `rgba(${90 + 30 * hash(r * 16 + k)},${88 + 28 * hash(r * 16 + k)},${86 + 26 * hash(r * 16 + k)},0.9)`; c.beginPath(); c.ellipse(x, y, 13, 8, 0, 0, PI); c.fill(); } }
        hatch(null, 0.4, 4, 0.2);
      }, 9108);
      // neige épaisse sur le toit (bord inférieur irrégulier, débord + glaçons)
      const nt = [[x0 - 4, ridge - 10]]; for (let i = 0; i <= 18; i++) { const u = i / 18; nt.push([lerp(x0 + 20, x1 - 20, u), ridge - 12 - 8 * Math.sin(u * 9) * hash(i)]); }
      nt.push([x1 + 22, eave - 4]); for (let i = 18; i >= 0; i--) { const u = i / 18; nt.push([lerp(x0 - 22, x1 + 22, u), eave - 22 + 16 * hash(i * 2.3) + (i % 3 === 0 ? 10 : 0)]); }
      pc(nt, C.neige, () => { P3(c, congere(x0 - 22, x1 + 22, eave - 10, 26, eave + 4, 9109, 18), C.neigeO); }, 9109);
      for (let i = 0; i < 16; i++) { const x = x0 - 10 + i * 22 + 6 * hash(i), L = 10 + 18 * hash(i * 3); pc([[x - 3, eave - 6], [x + 3, eave - 6], [x, eave - 6 + L]], 'rgba(220,235,246,0.95)', null, 9110 + i, { drop: false, texA: 0 }); }
      // façade
      pc([[x0, eave, 1], [x1, eave, 1], [x1, BACK + 4, 1], [x0, BACK + 4, 1]], C.pierre, () => {
        for (let r = 0; r < 40; r++) { const y = eave + 6 + r * 16; for (let k = 0; k < 12; k++) { const w = 26 + 18 * hash(r * 12 + k), x = x0 + ((k * 34 + (r % 2) * 17) % 360); c.strokeStyle = 'rgba(50,48,45,0.35)'; c.lineWidth = 1; c.strokeRect(x, y, w, 14); } }
        for (const x of [x0, x1 - 26]) for (let y = eave + 4; y < BACK; y += 44) { c.fillStyle = 'rgba(200,196,188,0.5)'; c.fillRect(x, y, 26, 20); c.strokeStyle = 'rgba(50,48,45,0.5)'; c.strokeRect(x, y, 26, 20); }   // chaînes d'angle
        hatch(null, 0.7, 4.4, 0.18); shade(x0, 0, x1, 0, 0.22, [x0, eave, x1, BACK + 4]);
        for (const F of HOS.fen) {                                                                          // fenêtres : un seul meneau vertical (pas de croisée)
          P3(c, box(F.x - F.w / 2 - 5, F.y - 6, F.x + F.w / 2 + 5, F.y + F.h + 5), '#a9a59d');
          P3(c, box(F.x - F.w / 2, F.y, F.x + F.w / 2, F.y + F.h), '#26303a');
          c.fillStyle = '#6e5a3e'; c.fillRect(F.x - 2, F.y, 4, F.h);
          c.strokeStyle = 'rgba(200,210,220,0.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(F.x - F.w / 2 + 4, F.y + 4); c.lineTo(F.x - 6, F.y + 16); c.stroke();
          P3(c, congere(F.x - F.w / 2 - 7, F.x + F.w / 2 + 7, F.y + F.h + 5, 7, F.y + F.h + 8, F.x + F.y, 6), C.neige);   // neige sur l'appui
          if (F !== HOS.volet) { for (const sd of [-1, 1]) { const xs = sd < 0 ? F.x - F.w / 2 - 25 : F.x + F.w / 2 + 5; P3(c, box(xs, F.y - 2, xs + 20, F.y + F.h + 2), '#56665e'); for (let y = F.y + 4; y < F.y + F.h; y += 7) { c.strokeStyle = 'rgba(20,30,25,0.5)'; c.beginPath(); c.moveTo(xs + 2, y); c.lineTo(xs + 18, y); c.stroke(); } } }
          else { const xs = F.x - F.w / 2 - 25; P3(c, box(xs, F.y - 2, xs + 20, F.y + F.h + 2), '#56665e'); }
        }
        // encadrement de la porte (le battant est dessiné à part) + seuil
        const Pt = HOS.porte; P3(c, box(Pt.x0 - 10, Pt.y0 - 10, Pt.x1 + 10, BACK + 4), '#a9a59d'); P3(c, box(Pt.x0, Pt.y0, Pt.x1, BACK + 4), '#2a1c12');
        // raquettes en osier accrochées au mur, côte à côte (jamais croisées)
        for (const rx of [118, 156]) { c.strokeStyle = '#7a5a34'; c.lineWidth = 4; c.beginPath(); c.ellipse(rx, 1226, 14, 30, 0, 0, TAU); c.stroke(); c.lineWidth = 1; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(rx + k * 5, 1200); c.lineTo(rx + k * 5, 1252); c.stroke(); } c.beginPath(); c.moveTo(rx - 12, 1218); c.lineTo(rx + 12, 1218); c.stroke(); c.fillStyle = '#3a3030'; c.beginPath(); c.arc(rx, 1192, 2.5, 0, TAU); c.fill(); }
        // potence de la lanterne murale
        c.strokeStyle = '#2a2a2c'; c.lineWidth = 4; c.beginPath(); c.moveTo(250, 1176); c.lineTo(272, 1176); c.lineTo(272, 1186); c.stroke();
      }, 9120);
      // auvent de la porte
      const [ax0, ax1, ay] = HOS.auvent;
      pc([[ax0, ay, 1], [ax1, ay, 1], [ax1 - 8, ay + 16, 1], [ax0 + 8, ay + 16, 1]], '#5a3c22', () => { for (let x = ax0; x < ax1; x += 12) { c.strokeStyle = 'rgba(20,10,5,0.45)'; c.beginPath(); c.moveTo(x, ay); c.lineTo(x, ay + 16); c.stroke(); } }, 9121);
      pc(congere(ax0 - 6, ax1 + 6, ay + 2, 18, ay + 4, 9122, 10), C.neige, null, 9122);
      // bûcher de rondins (sous un appentis) et banc de pierre
      pc([[60, 1288, 1], [236, 1270, 1], [240, 1280, 1], [62, 1300, 1]], '#5a3c22', null, 9123);
      pc(congere(56, 244, 1278, 14, 1286, 9124, 10), C.neige, null, 9124);
      for (let r = 0; r < 5; r++) for (let k = 0; k < 8; k++) { const x = 76 + k * 21 + (r % 2) * 10, y = 1384 - r * 19; if (x > 232) continue; pc(ell(x, y, 10, 9.5, 12), '#8a6238', () => { c.strokeStyle = 'rgba(60,35,15,0.6)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.stroke(); c.fillStyle = '#c9a066'; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); }, 9130 + r * 8 + k); }
      pc(box(246, 1362, 290, BACK + 4), C.pierreD, null, 9150); pc([[240, 1356, 1], [294, 1356, 1], [294, 1366, 1], [240, 1366, 1]], C.pierreL, null, 9151); pc(congere(238, 296, 1356, 7, 1360, 9152, 6), C.neige, null, 9152);
    });
    M.withShadow(cv, 10); return cv;
  }
  // ---------------- annexe à droite : abreuvoir gelé, luge de bois
  function makeAnnexe() {
    const cv = preAt(780, 1180, 990, BACK + 4, (c) => {
      // luge appuyée
      pc([[872, BACK - 2], [884, BACK - 4], [936, 1236], [926, 1232]], '#7a5232', null, 9201);
      pc([[900, BACK - 2], [912, BACK - 4], [962, 1246], [952, 1240]], '#7a5232', null, 9202);
      for (let k = 0; k < 5; k++) { const u = 0.2 + k * 0.16, xa = lerp(878, 931, u), ya = lerp(BACK - 3, 1234, u); pc([[xa - 4, ya], [xa + 30, ya + 8], [xa + 30, ya + 15], [xa - 4, ya + 7]], '#a07a48', null, 9203 + k); }
      pc(ribbon(qbez([930, 1234], [940, 1206], [958, 1242], 8), 5), '#5a3a22', null, 9210);
      // abreuvoir de pierre gelé
      pc(box(806, 1336, 930, BACK + 4), C.pierre, () => { hatch(null, 0.7, 4, 0.22); c.strokeStyle = 'rgba(40,40,40,0.4)'; c.strokeRect(812, 1342, 112, 50); }, 9211);
      pc([[800, 1330, 1], [936, 1330, 1], [936, 1340, 1], [800, 1340, 1]], C.pierreL, () => { c.fillStyle = '#bcd3e3'; c.fillRect(806, 1330, 124, 4); }, 9212);
      for (let i = 0; i < 9; i++) { const x = 810 + i * 14 + 4 * hash(i), L = 8 + 14 * hash(i + 2); pc([[x - 3, 1340], [x + 3, 1340], [x, 1340 + L]], 'rgba(220,235,246,0.95)', null, 9213 + i, { drop: false, texA: 0 }); }
      pc([[924, 1300], [960, 1300], [960, 1308], [930, 1308], [930, 1330], [924, 1330]], '#6e4a2a', null, 9230);       // goulotte de bois
      pc([[926, 1308], [932, 1308], [929, 1330]], 'rgba(220,235,246,0.95)', null, 9231, { drop: false, texA: 0 });
      pc(congere(800, 940, 1332, 9, 1336, 9232, 8), C.neige, null, 9232);
    });
    M.withShadow(cv, 9); return cv;
  }
  // ---------------- coulisses : rochers (gauche bas, droite haut) et sapins enneigés (carte postale)
  function makeRochers() {
    const cv = M.pre(W, BACK + 6, (c) => {
      const R = [[868, BACK + 6, 1], [872, 1300], [896, 1220], [890, 1120], [914, 1010], [906, 900], [930, 800], [950, 700], [990, 640], [1040, 630], [1090, 650], [1090, BACK + 6, 1]];
      pc(R, C.pierreD, () => {
        for (const y of [760, 900, 1040, 1180, 1300]) { const x0r = y > 1150 ? 870 : y > 950 ? 900 : 920; P3(c, congere(x0r, 1090, y, 16, y + 10, y, 8), C.neige); c.strokeStyle = 'rgba(30,30,30,0.45)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0r + 12, y + 40); c.lineTo(x0r + 60, y + 70); c.lineTo(x0r + 110, y + 52); c.stroke(); }
        hatch(null, 1.1, 4, 0.3); shade(870, 0, 1080, 0, 0.3, [860, 600, 1090, BACK + 6]);
      }, 9301);
      pc(congere(960, 1090, 650, 26, 672, 9302, 8), C.neige, null, 9302);
      const L = [[30, BACK + 6, 1], [36, 1330], [70, 1300], [110, 1306], [140, 1340], [150, BACK + 6, 1]];
      pc(L, C.pierreD, () => { P3(c, congere(30, 150, 1316, 18, 1330, 9303, 8), C.neige); hatch(null, 1.1, 4, 0.3); }, 9303);
    });
    M.withShadow(cv, 10); return cv;
  }
  function sapin(c, x, yb, h, seed) {
    pc(box(x - 9, yb - 40, x + 9, yb + 4), '#4a3020', null, seed);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const u = i / n, y = yb - 40 - u * h, w = (1 - u) * h * 0.36 + 20, hh = h / n * 1.5;
      pc([[x - w, y], [x, y - hh], [x + w, y], [x + w * 0.6, y - 6], [x, y - 2], [x - w * 0.6, y - 6]], '#2e4a3a', () => hatch(null, 0.9, 4, 0.25), seed + 1 + i);
      pc([[x - w * 0.95, y - 6], [x - w * 0.5, y - hh * 0.55], [x, y - hh + 2], [x + w * 0.5, y - hh * 0.55], [x + w * 0.95, y - 6], [x + w * 0.6, y - hh * 0.35], [x + w * 0.2, y - hh * 0.5], [x - w * 0.3, y - hh * 0.4]], C.neigeL, null, seed + 20 + i, { drop: false });
    }
  }
  function makeSapins() { const cv = M.pre(W, BACK + 6, (c) => { sapin(c, 120, BACK, 760, 9400); sapin(c, 230, BACK, 520, 9430); sapin(c, 960, BACK, 820, 9460); sapin(c, 860, BACK, 480, 9490); }); M.withShadow(cv, 10); return cv; }
  // ---------------- sol enneigé (après M.drawFloor) : neige sur le plancher, traces de pas, jalon incliné, congères à l'avant
  function makeSol() {
    return preAt(0, BACK - 30, W, 1700, (c) => {
      const top = []; for (let i = 0; i <= 30; i++) top.push([-10 + i * 37.3, BACK - 4 - 10 * hash(i * 1.9) - (i % 4 === 0 ? 8 : 0)]);
      pc(top.concat([[1090, 1660, 1], [-10, 1660, 1]]), C.neige, () => {
        const gr = c.createLinearGradient(0, BACK, 0, 1660); gr.addColorStop(0, 'rgba(150,170,195,0.35)'); gr.addColorStop(0.3, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(150,170,195,0.3)'); c.fillStyle = gr; c.fillRect(0, BACK - 30, W, 300);
        for (const y of [ST.slotB, ST.slotF]) { c.strokeStyle = 'rgba(40,40,55,0.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(60, y); c.lineTo(1020, y); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(60, y + 3); c.lineTo(1020, y + 3); c.stroke(); }
        for (let i = 0; i < 16; i++) { const u = i / 15, x = lerp(150, 920, u), y = 1500 + 60 * Math.sin(u * 4) + (i % 2 ? 14 : -14); c.fillStyle = 'rgba(140,160,185,0.45)'; c.beginPath(); c.ellipse(x, y, 12, 5, 0.2, 0, TAU); c.fill(); }   // traces de pas
        for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(hash(i * 3.7) * W, BACK + hash(i * 5.3) * 260, 2, 2); }
        hatch(null, 0.1, 7, 0.06, 1, M.P.encre, [0, BACK - 30, W, 1660]);
      }, 9501, { drop: false, texA: 0.3 });
      pc(congere(40, 300, 1648, 34, 1670, 9502, 10), C.neigeL, () => P3(c, congere(40, 300, 1654, 14, 1670, 9503, 8), C.neigeO), 9502);
      pc(congere(760, 1040, 1648, 40, 1670, 9504, 10), C.neigeL, () => P3(c, congere(760, 1040, 1654, 16, 1670, 9505, 8), C.neigeO), 9504);
      pc([[132, 1560], [140, 1558], [176, 1440], [170, 1438]], '#6e4a2a', () => { c.fillStyle = '#e8ecef'; c.fillRect(160, 1430, 20, 8); }, 9506);      // jalon incliné
      pc(congere(112, 170, 1562, 12, 1570, 9507, 6), C.neige, null, 9507);
    });
  }
  function initCol() {
    if (KC.ciel) return;
    KC.ciel = { normal: makeCiel('normal'), nuit: makeCiel('nuit'), cp: makeCiel('cp') };
    KC.monts = { normal: makeMonts('normal'), cp: makeMonts('cp') };
    KC.plateau = { normal: makePlateau('normal'), cp: makePlateau('cp') };
    KC.nuage = { normal: [1, 2, 3].map((k) => makeNuage(9600 + k, '#e9e6de', 'rgba(150,150,160,0.35)')), nuit: [1, 2, 3].map((k) => makeNuage(9600 + k, '#55617a', 'rgba(20,25,40,0.4)')), cp: [1, 2, 3].map((k) => makeNuage(9600 + k, '#ffffff', 'rgba(170,200,235,0.45)')) };
    KC.hospice = makeHospice(); KC.annexe = makeAnnexe(); KC.rochers = makeRochers(); KC.sapins = makeSapins(); KC.sol = makeSol();
  }
  // ---------------- options communes
  function colOpts(o) {
    o = o || {};
    const cp = clamp(o.cartePostale || 0), nu = clamp(o.nuit || 0) * (1 - cp), ra = clamp(o.rafale || 0) * (1 - cp);
    const h = (o.hospice == null ? 1 : clamp(o.hospice)) * (1 - cp);
    const ne = o.neige == null ? 0.5 : clamp(o.neige);
    return { cp, nu, ra, h, ne, o };
  }
  function hospiceDy(t, h, o) { return (1 - easeOut(h)) * -1300 + (o.hospiceT1 != null ? wob(t, o.hospiceT1, -12, 2.2, 5.5) : 0); }
  function glow(c, x, y, r, rgb, a) { if (a <= 0.003) return; const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
  function teinteNuit(c, a, y0, y1) { if (a <= 0.003) return; c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(52,70,120,${0.62 * a})`; c.fillRect(0, y0, W, y1 - y0); c.restore(); }
  function flocons(c, g, n, ra, x0, x1, y0, y1, sz, seed, a) {
    if (n <= 0) return;
    const R = M.rng(seed), H = y1 - y0, Wd = x1 - x0;
    for (let i = 0; i < n; i++) {
      const px = R(), py = R(), v = 0.6 + 0.6 * R(), ph = R() * TAU, s = sz * (0.6 + 0.8 * R());
      const vy = lerp(40, 70, ra) * v, vx = lerp(-8, -520, ra) * v;
      let y = y0 + ((py * H + g * vy) % H + H) % H, x = x0 + ((px * Wd + g * vx + Math.sin(g * 1.3 + ph) * 18) % Wd + Wd) % Wd;
      if (ra > 0.3) { c.strokeStyle = `rgba(250,252,255,${0.7 * a})`; c.lineWidth = s * 0.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18 * ra * s, y - 3 * s); c.stroke(); }
      else { c.fillStyle = `rgba(250,252,255,${0.85 * a})`; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); }
    }
  }
  // SB.col(t, o) — toile de fond, montagnes, plateau, hospice (descend des cintres), annexe, coulisses, ambiance, événements
  SB.col = function (t, o) {
    initCol(); const c = cx_(), g = M.tg(t), Q = colOpts(o); o = Q.o;
    const { cp, nu, ra, h, ne } = Q;
    // 1) ciel
    c.drawImage(KC.ciel.normal, 0, 0);
    if (nu > 0) { c.save(); c.globalAlpha = nu; c.drawImage(KC.ciel.nuit, 0, 0); c.restore(); }
    if (cp > 0) { c.save(); c.globalAlpha = cp; c.drawImage(KC.ciel.cp, 0, 0); c.restore(); }
    if (cp > 0) { glow(c, 820, 400, 330, '255,236,170', 0.55 * cp); c.save(); c.globalAlpha = cp; c.translate(820, 400); c.rotate(g * 0.05); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; P3(c, [[Math.cos(a - 0.09) * 58, Math.sin(a - 0.09) * 58], [Math.cos(a) * 92, Math.sin(a) * 92], [Math.cos(a + 0.09) * 58, Math.sin(a + 0.09) * 58]], 'rgba(255,214,110,0.8)'); } c.rotate(-g * 0.05); c.translate(-820, -400); pc(blob(820, 400, 54, 54, 24, 9700, 0.03), '#ffd76a', () => { fillPts(ell(808, 388, 30, 30, 16), 'rgba(255,240,180,0.6)'); }, 9700); c.restore(); }
    if (nu > 0) { c.save(); c.globalAlpha = nu; pc(blob(840, 360, 30, 30, 20, 9701, 0.03), '#e9e6d6', () => P3(c, ell(852, 352, 28, 30, 16), 'rgba(40,50,80,0.6)'), 9701); c.restore(); }
    // 2) nuages (sur fils), choucas lointains
    const nv = nu > 0.5 ? KC.nuage.nuit : cp > 0.5 ? KC.nuage.cp : KC.nuage.normal;
    for (let i = 0; i < 5; i++) { const cv = nv[i % 3], sp = 1300, sc = 0.66 + 0.25 * hash(i * 3.1), vit = (10 + 6 * hash(i)) * (1 + 3 * ra);
      const x = ((((i / 5 + 0.1 * hash(i * 7.7)) * sp + g * vit) % sp) + sp) % sp - 110, y = 300 + 200 * hash(i * 5.3) + 3 * Math.sin(g * 0.7 + i);
      c.strokeStyle = 'rgba(30,24,18,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 60 * sc, y - 40 * sc); c.lineTo(x - 60 * sc, 0); c.moveTo(x + 60 * sc, y - 40 * sc); c.lineTo(x + 60 * sc, 0); c.stroke();
      c.drawImage(cv, x - 150 * sc, y - 80 * sc, 300 * sc, 150 * sc); }
    if (cp < 0.5) { const per = 22, gc = ((g % per) + per) % per; M.oiseaux(gc, { x0: 1120, x1: -60, y: 470, t0: 0, dur: 13, n: 4, s: 0.55, seed: 9710, col: '#1e1c22', brume: 0.3 }); }
    // 3) montagnes, chamois (rare), plateau, lac
    c.drawImage(KC.monts.normal, 0, 0);
    if (cp > 0) { c.save(); c.globalAlpha = cp; c.drawImage(KC.monts.cp, 0, 0); c.restore(); }
    { const per = 40, gc = ((g % per) + per) % per; if (gc < 18) M.passage('chamois', gc, { x0: 490, x1: 750, y: 868, dur: 18, s: 0.2, brume: 0.35, seed: 9711, broute: 0.5 }); }
    c.drawImage(KC.plateau.normal, 0, 0);
    if (cp > 0) { c.save(); c.globalAlpha = cp; c.drawImage(KC.plateau.cp, 0, 0); c.restore(); }
    { const u = ((g * 0.08) % 1 + 1) % 1; c.save(); c.beginPath(); c.ellipse(770, 1200, 102, 20, 0, 0, TAU); c.clip(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(650 + u * 260, 1176); c.lineTo(670 + u * 260, 1176); c.lineTo(640 + u * 260, 1224); c.lineTo(620 + u * 260, 1224); c.fill(); c.restore(); }
    flocons(c, g, Math.round(60 * ne * (1 + ra)), ra, 0, W, 150, BACK, 1.4, 9712, 0.55);
    if (o.monticule && o.monticuleFond) SB.monticule(t, o.monticule.x, BACK + 2, 0.9, { h: o.monticule.h == null ? 1 : o.monticule.h });
    teinteNuit(c, nu, 0, BACK + 6);
    // 4) hospice et annexe (descendent des cintres sur leurs câbles)
    if (h > 0.001) {
      const dy = hospiceDy(t, h, o), H = HOS, rot = o.hospiceT1 != null ? wob(t, o.hospiceT1, 0.006, 1.6, 4) : 0;
      c.save(); c.translate(226, BACK); c.rotate(rot); c.translate(-226, -BACK);
      if (!SIL()) { c.strokeStyle = 'rgba(25,20,15,0.7)'; c.lineWidth = 1.6; for (const x of [96, 360]) { c.beginPath(); c.moveTo(x, H.ridge + 10 + dy); c.lineTo(x, 0); c.stroke(); } }
      c.save(); c.globalAlpha = 0.32; c.drawImage(KC.hospice.shadow, KC.hospice.ox - 20 + 16, KC.hospice.oy - 20 + 8 + dy); c.restore();
      // fumée de la cheminée (couchée par la rafale, soufflée par le rotor)
      const so = clamp(o.souffle || 0);
      M.fumee(t, { x: H.cheminee[0], y: H.cheminee[1] + dy - 4, s: 0.9, n: 7, haut: lerp(240, 120, Math.max(ra, so)), vent: lerp(40, 300, ra) + 380 * so, col: '#e4e0d6', a: 0.6, per: lerp(3.4, 1.6, Math.max(ra, so)), seed: 9720 });
      put(c, KC.hospice, dy);
      // cloche du clocheton (oscille : o.cloche 0..1 ; un peu au vent)
      const ca = (clamp(o.cloche || 0) * 0.5 + 0.06 * ra) * Math.sin(g * 4.4) + 0.02 * Math.sin(g * 1.1);
      c.save(); c.translate(H.cloche[0], H.cloche[1] + dy); c.rotate(ca); c.scale(0.62, 0.62); pc([[-2, -6], [2, -6], [5, 0], [9, 4], [11, 20], [15, 28, 1], [-15, 28, 1], [-11, 20], [-9, 4], [-5, 0]], '#a8823e', () => strokePts([[-5, 6], [-7, 22]], 'rgba(255,240,190,0.6)', 1.5), 9721); pc(ell(0, 31, 3.5, 3.5, 8), '#5a4420', null, 9722); c.restore();
      // fenêtres : lumière chaude (nuit), voilages au vent (rafale)
      for (const F of H.fen) {
        const li = nu * (0.75 + 0.25 * Math.sin(g * 3 + F.x * 0.1)) * (F === H.volet && o.volet != null ? 1 : 1);
        if (li > 0.01) { c.save(); c.globalAlpha = li; P3(c, box(F.x - F.w / 2, F.y + dy, F.x + F.w / 2, F.y + F.h + dy), '#f2c46e'); c.fillStyle = '#6e5a3e'; c.fillRect(F.x - 2, F.y + dy, 4, F.h); c.restore(); }
        if (ra > 0.05 || nu > 0.3) { c.save(); c.beginPath(); c.rect(F.x - F.w / 2, F.y + dy, F.w, F.h); c.clip(); M.voilage(t + F.x * 0.01, { x: F.x - F.w / 2 + 1, y: F.y + dy + 3, w: F.w * 0.42, h: F.h - 6, cote: 1, amp: 2 + 7 * ra, col: `rgba(240,232,214,${0.4 + 0.25 * ra})` }); c.restore(); }
      }
      // volet qui claque (o.volet 0..1 : s'ouvre à fond puis claque contre le mur, rebonds) ; sinon il bat un peu au vent
      { const F = H.volet, xh = F.x + F.w / 2 + 3; let a;
        if (o.volet != null) { const u = clamp(o.volet); a = u < 0.4 ? lerp(0.15, 2.9, easeIn(u / 0.4)) : 2.9 + 0.35 * Math.sin((u - 0.4) * 30) * Math.exp(-(u - 0.4) * 9) - 0.05; }
        else a = 0.12 + 0.08 * ra * (1 + Math.sin(g * 3.1)) + 0.02 * Math.sin(g * 0.9);
        const w = 22 * Math.cos(a), x1 = xh - w; P3(c, [[xh, F.y - 2 + dy], [x1, F.y - 2 + dy + 3 * Math.sin(a)], [x1, F.y + F.h + 2 + dy - 3 * Math.sin(a)], [xh, F.y + F.h + 2 + dy]], Math.cos(a) > 0 ? '#56665e' : '#48564f');
        c.strokeStyle = 'rgba(20,30,25,0.6)'; c.lineWidth = 1; for (let y = F.y + 4; y < F.y + F.h; y += 7) { c.beginPath(); c.moveTo(xh, y + dy); c.lineTo(x1, y + dy); c.stroke(); } }
      // porte cloutée (o.porte 0..1 : s'ouvre vers l'intérieur, gond à gauche) ; intérieur chaud
      { const Pt = H.porte, pk = clamp(o.porte || 0), w = (Pt.x1 - Pt.x0) * (1 - 0.82 * ease(pk));
        if (pk > 0.01) { const gi = c.createLinearGradient(0, Pt.y0 + dy, 0, BACK + dy); gi.addColorStop(0, '#c98a40'); gi.addColorStop(1, '#f2c070'); c.fillStyle = gi; c.fillRect(Pt.x0, Pt.y0 + dy, Pt.x1 - Pt.x0, BACK - Pt.y0); glow(c, (Pt.x0 + Pt.x1) / 2, Pt.y0 + 90 + dy, 150, '255,190,110', 0.6 * pk);
          if (!SIL()) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,190,110,${0.22 * pk})`; c.beginPath(); c.moveTo(Pt.x0, BACK + dy); c.lineTo(Pt.x1, BACK + dy); c.lineTo(Pt.x1 + 80, BACK + 40 + dy); c.lineTo(Pt.x0 - 30, BACK + 40 + dy); c.closePath(); c.fill(); c.restore(); } }
        pc(box(Pt.x0, Pt.y0 + dy, Pt.x0 + w, BACK + dy), '#5e3c20', () => { for (let k = 1; k < 4; k++) { c.strokeStyle = 'rgba(20,10,5,0.55)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(Pt.x0 + w * k / 4, Pt.y0 + dy); c.lineTo(Pt.x0 + w * k / 4, BACK + dy); c.stroke(); }
          for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) { c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(Pt.x0 + w * (k + 0.5) / 4, Pt.y0 + 18 + r * 30 + dy, 2.2, 0, TAU); c.fill(); }    // clous
          c.fillStyle = '#3a3a3c'; for (const y of [Pt.y0 + 30, BACK - 40]) c.fillRect(Pt.x0, y + dy, w * 0.7, 6); }, 9730);
        if (w > 10) { const hx = Pt.x0 + w - 12, hy = 1310 + dy; c.strokeStyle = '#1e1e20'; c.lineWidth = 3; c.beginPath(); c.arc(hx, hy, 6, 0, TAU); c.stroke(); } }
      // lanterne murale (flamme qui vacille)
      { const [lx, ly] = H.lanterne; c.save(); c.translate(lx, ly + 22 + dy); c.scale(0.42, 0.42); drawLanterne({ t, flamme: true }); c.restore(); if (nu > 0) glow(c, lx, ly + dy, 160, '255,190,110', 0.35 * nu); }
      // pan de neige du toit (o.panNeige 0..1 : glisse sur le toit, tombe de l'avant-toit, s'écrase en poudre)
      if (o.panNeige != null) { const u = clamp(o.panNeige), x0p = 236; let x, y, a = 0, al = 1;
        if (u < 0.35) { const k = easeIn(u / 0.35); x = x0p - 30 * k; y = lerp(H.ridge + 30, H.eave - 26, k); }
        else if (u < 0.6) { const k = (u - 0.35) / 0.25; x = x0p - 30 - 20 * k; y = H.eave - 26 + (BACK - 20 - H.eave + 26) * k * k; a = 0.5 * k; }
        else { x = x0p - 50; y = BACK - 20; al = 1 - (u - 0.6) / 0.4; }
        if (u < 0.6) { c.save(); c.translate(x, y + dy); c.rotate(a); pc(blob(0, 0, 46, 16, 14, 9740, 0.25), C.neige, () => P3(c, blob(0, 8, 40, 7, 10, 9741, 0.2), C.neigeO), 9740); c.restore(); }
        else { for (let i = 0; i < 14; i++) { const r = 20 + (u - 0.6) * 260 * hash(i), aa = PI + (i / 13) * PI; c.fillStyle = `rgba(245,248,250,${0.8 * al})`; c.beginPath(); c.arc(x + Math.cos(aa) * r, y + dy + Math.sin(aa) * r * 0.5, 6 + 10 * hash(i * 3), 0, TAU); c.fill(); } pc(congere(x - 50, x + 50, BACK + dy, 22, BACK + 4 + dy, 9742, 8), C.neige, null, 9742); } }
      // choucas qui se pose sur le clocheton (o.choucas 0..1)
      if (o.choucas != null) { const u = clamp(o.choucas), k = smooth(0, 0.45, u), A0 = [760, 330], B0 = [H.clocheton[0] + 2, 552 + dy - 8];
        const x = lerp(A0[0], B0[0], k), y = lerp(A0[1], B0[1], k) - Math.sin(k * PI) * 80;
        if (k < 1) { const fl = Math.sin(g * 22) * 10; strokePts([[x - 16, y - fl], [x - 5, y], [x, y + 2], [x + 5, y], [x + 16, y - fl]], '#1a181c', 3.4); }
        else { const hb = Math.max(0, Math.sin(g * 5)) * 4; pc([[-14, -8], [-4, -18], [10, -16], [14, -8], [8, 0], [-8, 2], [-22, 4]].map((p) => [p[0] + B0[0], p[1] + B0[1]]), '#1e1c22', () => fillPts(ell(B0[0] + 6, B0[1] - 16, 6, 4, 8), '#4a4850'), 9750, { drop: false });
          pc(ell(B0[0] + 12, B0[1] - 20 + hb, 6, 5.5, 10), '#1e1c22', () => dot(B0[0] + 14, B0[1] - 21 + hb, 1.3, '#d8d0c0'), 9751, { drop: false }); pc([[B0[0] + 17, B0[1] - 21 + hb], [B0[0] + 24, B0[1] - 18 + hb], [B0[0] + 17, B0[1] - 17 + hb]], '#e2c040', null, 9752, { drop: false }); } }
      // annexe (droite)
      c.save(); c.globalAlpha = 0.3; c.drawImage(KC.annexe.shadow, KC.annexe.ox - 20 + 14, KC.annexe.oy - 20 + 8 + dy); c.restore();
      put(c, KC.annexe, dy);
      c.restore();
      teinteNuit(c, nu * 0.5, 0, BACK + 6);
      if (nu > 0) for (const F of H.fen) glow(c, F.x, F.y + F.h / 2 + dy, 70, '255,180,90', 0.18 * nu);
    }
    // 5) coulisses : rochers (ou sapins enneigés en carte postale), avec le paquet de neige qui glisse d'un sapin (o.sapinNeige 0..1)
    const sw = 0.004 * Math.sin(g * 0.8) * (1 + 3 * ra);
    if (cp < 1) { c.save(); c.globalAlpha = 1 - cp; c.translate(980, BACK); c.rotate(sw); c.translate(-980, -BACK); c.save(); c.globalAlpha *= 0.3; c.drawImage(KC.rochers.shadow, -20 - 14, -20 + 8); c.restore(); c.drawImage(KC.rochers, 0, 0); c.restore(); teinteNuit(c, nu * 0.6, 600, BACK + 6); }
    if (cp > 0) {
      c.save(); c.globalAlpha = cp; c.save(); c.globalAlpha *= 0.3; c.drawImage(KC.sapins.shadow, -20 + 14, -20 + 8); c.restore(); c.drawImage(KC.sapins, 0, 0); c.restore();
      if (o.sapinNeige != null) { const u = clamp(o.sapinNeige), [bx, by] = [SB.COL.sapin.x, SB.COL.sapin.y]; let x, y, a = 0;
        if (u < 0.3) { const k = easeIn(u / 0.3); x = bx + 60 * k; y = by + 22 * k; }
        else { const k = (u - 0.3) / 0.7; x = bx + 60 + 30 * k; y = by + 22 + (BACK - by - 30) * k * k; a = k * 2; }
        if (u < 0.92) { c.save(); c.globalAlpha = cp; c.translate(x, y); c.rotate(a); pc(blob(0, 0, 26, 12, 12, 9760, 0.3), C.neigeL, null, 9760); c.restore(); }
        else { c.save(); c.globalAlpha = cp * (1 - (u - 0.92) / 0.08); for (let i = 0; i < 10; i++) { const r = 10 + 40 * hash(i); c.fillStyle = 'rgba(250,252,255,0.9)'; c.beginPath(); c.arc(bx + 90 + Math.cos(PI + i / 9 * PI) * r, BACK - 10 + Math.sin(PI + i / 9 * PI) * r * 0.5, 5 + 6 * hash(i * 2), 0, TAU); c.fill(); } c.restore(); }
        if (u > 0.25) { const k = wob(u, 0.3, 0.06, 2.5, 5); c.save(); c.globalAlpha = cp; c.strokeStyle = 'rgba(46,74,58,0.9)'; c.lineWidth = 6; c.beginPath(); c.moveTo(bx - 20, by + 4); c.lineTo(bx + 70, by + 10 - 30 * k); c.stroke(); c.restore(); }
      }
    }
  };
  // SB.colSol(t, o) — après M.drawFloor(), avant les marionnettes : neige au sol, traces, jalon incliné, congères de l'avant ; rafale = poudrerie au ras du sol
  SB.colSol = function (t, o) {
    initCol(); const c = cx_(), g = M.tg(t), Q = colOpts(o); o = Q.o;
    put(c, KC.sol, 0);
    if (Q.cp > 0) { c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = `rgba(60,90,140,${0.15 * Q.cp})`; c.fillRect(0, BACK - 30, W, 300); c.restore(); }
    if (o.monticule && !o.monticuleFond) SB.monticule(t, o.monticule.x, o.monticule.y == null ? ST.slotB - 30 : o.monticule.y, 0.9, { h: o.monticule.h == null ? 1 : o.monticule.h, seed: 3 });
    if (Q.ra > 0.05 && !SIL()) for (let i = 0; i < 16; i++) { const u = (((g * 0.9 + hash(i) ) % 1) + 1) % 1, y = BACK + 10 + hash(i * 3) * 200, x = lerp(1100, -100, u); c.strokeStyle = `rgba(250,252,255,${0.5 * Q.ra * Math.sin(PI * u)})`; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 60, y - 10, x + 140, y - 4); c.stroke(); }
    teinteNuit(c, Q.nu * 0.7, BACK - 30, 1700);
  };
  // SB.colNeige(t, o) — flocons au premier plan (après les marionnettes, avant M.stageLight)
  SB.colNeige = function (t, o) {
    initCol(); const c = cx_(), g = M.tg(t), Q = colOpts(o);
    if (SIL()) return;
    flocons(c, g + 7, Math.round(70 * Q.ne * (1 + 1.5 * Q.ra)), Q.ra, 0, W, 140, 1640, 2.6, 9800, 0.9);
  };
  // poignée de la porte (écran) : cible de SB.chanoine({ ouvre, cible }) ; o = mêmes options que SB.col (porte, hospice)
  SB.portePt = function (t, o) { o = o || {}; const Q = colOpts(o), Pt = HOS.porte, w = (Pt.x1 - Pt.x0) * (1 - 0.82 * ease(clamp(o.porte || 0))); return [Pt.x0 + w - 12, 1310 + (Q.h > 0 ? hospiceDy(t || 0, Q.h, o) : 0)]; };
  SB.init = function () { initCol(); initTableau(); return SB; };
})();
