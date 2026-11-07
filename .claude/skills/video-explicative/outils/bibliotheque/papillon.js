// persos.js — « Le papillon, la nage née d'un règlement flou » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.pap2 (alias PAP2). Appeler PAP2.init() dans S.init.
// Mode d'emploi : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre, chiffre, logo, drapeau ni anneaux. Déterministe (hash), fonctions pures de t.
// NAGEURS (dans l'eau jusqu'à la taille, (x, y) = point de la TAILLE à la surface) : PAP2.nageurModerne / brasseur / volant (pose, x, couloir|y, s, o)
// HUMAINS (debout, (x, y) = pieds) : PAP2.officiel(pose, x, y, s, o) ; ANIMAL : PAP2.grenouille(pose, x, y, s, o)
// ACCESSOIRES : PAP2.reglement / chrono / tampon / bouee / chaise (x, y, s, o) ; EAU : PAP2.eau(t, o), PAP2.eclabousse(t, x, y, t0, o), PAP2.sillage(r, t) ; repères PAP2.EAU, PAP2.ECH
// DÉCORS : PAP2.piscineModerne / bassin1930 / stadeBerlin (t, up, o) ; o.avant = premier plan (après les marionnettes)
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const PAP2 = (M.pap2 = {});
  const CH = M.chars, cx_ = () => M.ctx(), SIL = () => M._sil(), tg = (t) => M.tg(t || 0);
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = 1395, FEET = 1416;

  // =====================================================================
  // 0) OUTILS
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 18, 0, TAU); o.pop(); return o; }
  const sc = (pts, kx, ky) => pts.map((p) => (p[2] ? [p[0] * kx, p[1] * ky, 1] : [p[0] * kx, p[1] * ky]));
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const has = (v) => !!v && v !== 'rien';
  const frac = (v) => v - Math.floor(v);
  function gradL(x0, y0, x1, y1, stops, bb) { if (SIL()) return; const c = cx_(), g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); }
  const shadeHex = (h, k) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return '#' + v.map((x) => Math.round(clamp(x * k, 0, 255)).toString(16).padStart(2, '0')).join(''); };
  const gE = (q, n) => ease(clamp(q[n] || 0));
  // clés [[u, v], …] (u croissant 0..1) → valeur interpolée (mi-linéaire, mi-adoucie)
  function keyf(K, u) {
    for (let i = 0; i < K.length - 1; i++) if (u <= K[i + 1][0]) { const a = K[i], b = K[i + 1], f = (u - a[0]) / ((b[0] - a[0]) || 1); return lerp(a[1], b[1], lerp(f, smooth(0, 1, f), 0.5)); }
    return K[K.length - 1][1];
  }
  function polyPath(c, pts) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
  function clipPoly(pts, fn) { if (SIL()) return; const c = cx_(); c.save(); polyPath(c, pts); c.clip(); fn(c); c.restore(); }
  PAP2.geo = { ep, ell, rect };

  // =====================================================================
  // 1) ACCESSOIRES TENUS : registre (échelle 1, origine = centre ; draw(o) dessine autour de l'origine)
  // =====================================================================
  const CUIR = '#6b4a2b', CUIRD = '#4e3420', OR = '#c9a24a', PAGE = '#efe6cc', PAGED = '#d9ceb0', RUBAN = '#9a2a24', ENCRE = 'rgba(70,64,58,0.62)';
  const RG = { pw: 100, ph: 136, cw: 108, chh: 74 };
  function lignes(x0, y0, w, n, seed, dy, col) {
    for (let i = 0; i < n; i++) {
      const y = y0 + i * (dy || 11), L = w * (0.72 + 0.28 * hash(seed + i * 3.7)), P = [];
      for (let x = 0; x <= L; x += 5) P.push([x0 + x, y + 1.3 * Math.sin(x * 0.42 + i * 1.7 + seed)]);
      strokePts(P, col || ENCRE, 1.3);
    }
  }
  function dessinBrasse(cx, cy) {                           // nageur de brasse : tête hors de l'eau, bras SOUS la ligne d'eau
    const W = []; for (let x = -34; x <= 34; x += 4) W.push([cx + x, cy + 2 * Math.sin(x * 0.4)]);
    strokePts(W, 'rgba(60,110,130,0.8)', 1.6);
    dot(cx - 2, cy - 7, 5.5, 'rgba(60,50,45,0.85)');
    strokePts([[cx - 4, cy + 2], [cx - 22, cy + 8]], 'rgba(60,50,45,0.8)', 2.4);
    strokePts([[cx + 2, cy + 5], [cx + 16, cy + 10], [cx + 26, cy + 6]], 'rgba(60,50,45,0.6)', 1.6);
    strokePts([[cx - 2, cy + 6], [cx + 12, cy + 14], [cx + 24, cy + 12]], 'rgba(60,50,45,0.6)', 1.6);
  }
  function dessinPapillon(cx, cy, k) {                      // nageur papillon : les DEUX bras en arc AU-DESSUS de la ligne d'eau
    const W = []; for (let x = -36; x <= 36; x += 4) W.push([cx + x, cy + 2 * Math.sin(x * 0.4)]);
    strokePts(W, 'rgba(50,100,125,0.9)', 1.8);
    dot(cx + 4, cy - 10, 6, 'rgba(40,32,30,0.95)');
    strokePts([[cx + 2, cy - 4], [cx - 6, cy + 4]], 'rgba(40,32,30,0.9)', 3);
    strokePts(ep(cx - 2, cy - 4, 22, 24, 10, PI * 1.05, PI * 1.85), 'rgba(40,32,30,0.9)', 2.4);
    strokePts(ep(cx + 2, cy - 2, 26, 30, 10, PI * 1.1, PI * 1.9), 'rgba(40,32,30,0.6)', 2);
    if (k > 0.6) for (const a of [3.6, 4.2, 4.8]) strokePts([[cx + Math.cos(a) * 32, cy - 4 + Math.sin(a) * 34], [cx + Math.cos(a) * 40, cy - 4 + Math.sin(a) * 42]], 'rgba(150,40,36,0.7)', 1.4);
  }
  // contenu d'une page (origine = coin haut gauche de la page) ; cote 'g' | 'd'
  function pageContenu(cote, o, w) {
    w = w || RG.pw;
    if (cote === 'g') { lignes(10, 14, w - 20, 4, 3, 11); dessinBrasse(w / 2, 72); lignes(10, 100, w - 20, 3, 9, 11); return; }
    lignes(10, 14, w - 20, 5, 17, 11);
    const v = clamp(o.nouvellePage || 0);
    if (v > 0) {                                             // la page à moitié blanche se remplit : le dessin du papillon s'imprime de haut en bas
      clipPoly(rect(0, 64, w, 64 + 72 * v), () => { dessinPapillon(w / 2, 96, v); lignes(12, 112, w - 26, 2, 23, 9, 'rgba(40,36,32,0.75)'); });
    }
    if ((o.marque || 0) > 0) { const k = clamp(o.marque); strokePts(ell(w - 30, 112, 15 * k, 11 * k, 16).concat([ell(w - 30, 112, 15 * k, 11 * k, 16)[0]]), 'rgba(150,30,30,0.75)', 2.2); strokePts(ell(w - 30, 112, 10 * k, 7 * k, 14).concat([ell(w - 30, 112, 10 * k, 7 * k, 14)[0]]), 'rgba(150,30,30,0.6)', 1.4); }
  }
  function drawReglement(o) {
    const c = cx_(), k = ease(clamp(o.ouvert == null ? 1 : o.ouvert)), fl = clamp(o.aPlat || 0);
    c.save();
    if (fl > 0) { c.scale(1, lerp(1, 0.34, fl)); }
    const xs = -54 * (1 - k), H = RG.chh, cw = RG.cw;
    const coverPaint = (x0, x1) => () => {
      const L = Math.min(x0, x1), R = Math.max(x0, x1);
      strokePts(rect(L + 7, -H + 7, R - 7, H - 7), 'rgba(201,162,74,0.7)', 1.6, true);
      for (const [cx, cy] of [[L, -H], [R, -H], [L, H], [R, H]]) fillPts([[cx, cy], [cx + Math.sign(L + R - 2 * cx) * 16, cy], [cx, cy - Math.sign(cy) * 16]], OR);
      hatch(null, 0.6, 4.5, 0.18, 1, undefined, [L, -H, R, H]);
    };
    // plat arrière + bloc de pages droit
    pc(rect(xs, -H, xs + cw, H), CUIR, coverPaint(xs, xs + cw), 7101);
    if (fl > 0) fillPts(rect(xs + 2, H - 2, xs + cw - 2, H + 8 * fl), CUIRD);
    pc(rect(xs + 2, -H + 6, xs + RG.pw + 2, H - 6), PAGE, () => { const cc = cx_(); cc.save(); cc.translate(xs + 2, -H + 6); if (k > 0.3) pageContenu('d', o); cc.restore(); for (let i = 1; i < 4; i++) strokePts([[xs + RG.pw + 2 - i * 1.5, -H + 8], [xs + RG.pw + 2 - i * 1.5, H - 8]], 'rgba(120,100,70,0.35)', 0.8); shade(xs + 2, 0, xs + 20, 0, 0.25, [xs, -H, xs + 40, H]); }, 7102, { texA: 0.35 });
    const cA = Math.cos(PI * k);                             // plat avant qui tourne autour du dos
    if (cA < 0) {                                            // ouvert : plat avant et page gauche à gauche du dos
      const wv = -cA;
      pc(rect(xs - cw * wv, -H, xs, H), CUIR, coverPaint(xs - cw * wv, xs), 7103);
      pc(rect(xs - RG.pw * wv - 2, -H + 6, xs - 2, H - 6), PAGE, () => { const cc = cx_(); cc.save(); cc.translate(xs - RG.pw * wv - 2, -H + 6); cc.scale(wv, 1); if (wv > 0.3) pageContenu('g', o); cc.restore(); shade(xs - 2, 0, xs - 20, 0, 0.25, [xs - 40, -H, xs, H]); }, 7104, { texA: 0.35 });
    }
    // page qui tourne (feuillette) : de droite à gauche autour du dos
    const pg = o.page == null ? 0 : clamp(o.page);
    if (k > 0.9 && pg > 0 && pg < 1) {
      const cp = Math.cos(PI * pg), lift = 10 * Math.sin(PI * pg), wv = RG.pw * cp;
      const P = [[xs, -H + 6, 1], [xs + wv, -H + 6 - lift, 1], [xs + wv, H - 6 - lift * 0.4, 1], [xs, H - 6, 1]];
      pc(P, cp > 0 ? PAGE : PAGED, () => { lignes(Math.min(xs, xs + wv) + 8, -H + 22, Math.abs(wv) - 16, 6, 41, 12); shade(xs, 0, xs + wv, 0, 0.3, [xs - 110, -H, xs + 110, H]); }, 7105, { texA: 0.35 });
    }
    if (cA >= 0) pc(rect(xs, -H, xs + cw * cA, H), CUIR, coverPaint(xs, xs + cw * cA), 7106);
    // dos et ruban marque-page
    pc(rect(xs - 4, -H - 2, xs + 4, H + 2), CUIRD, () => { for (const y of [-H + 14, -H + 22, H - 22, H - 14]) strokePts([[xs - 4, y], [xs + 4, y]], OR, 1.6); }, 7107, { drop: false });
    if (fl < 0.5) { const sw = 2 * Math.sin(tg(o.t) * 2.2); pc([[xs + 1, H - 4], [xs + 7, H - 4], [xs + 9 + sw, H + 30], [xs + 4 + sw, H + 24], [xs - 1 + sw, H + 30]], RUBAN, null, 7108, { drop: false }); }
    c.restore();
  }
  const rgK = (o) => ease(clamp(o.ouvert == null ? 1 : o.ouvert));
  function drawChrono(o) {
    const g = tg(o.t);
    pc(ell(0, -38, 6, 6, 12).concat(ell(0, -38, 3, 3, 10).reverse()), OR, null, 7201, { drop: false });
    pc(rect(-5, -33, 5, -24), '#a8862f', null, 7202, { drop: false });
    pc(ell(0, 0, 24, 24, 24), '#b8913a', () => { strokePts(ep(0, 0, 21, 21, 20, PI * 1.1, PI * 1.6), 'rgba(255,240,190,0.7)', 1.6); }, 7203);
    fillPts(ell(0, 0, 19, 19, 24), '#f1ead6');
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[Math.sin(a) * 14, -Math.cos(a) * 14], [Math.sin(a) * 18, -Math.cos(a) * 18]], '#3a2a1c', i % 3 ? 0.9 : 1.8); }
    const a = (o.marche === false ? 0 : g * 2.4) + 0.6;
    strokePts([[0, 0], [Math.sin(a) * 15, -Math.cos(a) * 15]], '#9a2a24', 1.4); dot(0, 0, 1.8, '#3a2a1c');
  }
  function drawTampon() {
    pc(ell(0, -62, 14, 11, 16), '#7a5232', () => strokePts(ep(0, -64, 9, 6, 8, PI * 1.1, PI * 1.7), 'rgba(255,230,190,0.5)', 1.4), 7301);
    pc(rect(-6, -54, 6, -14), '#8a6038', null, 7302);
    pc(rect(-24, -16, 24, 0), '#5a3a22', () => strokePts([[-22, -13], [22, -13]], 'rgba(255,230,190,0.35)', 1.4), 7303);
    pc(rect(-22, 0, 22, 6), '#8e2a2a', null, 7304, { drop: false });
  }
  const OBJ = {
    reglement: { draw: drawReglement,
      grip: (o) => (clamp(o.aPlat || 0) > 0.5 ? [0, 30] : o.prise === 'g' ? [lerp(-30, -62, rgK(o)), 72] : o.prise === 'cote' ? [lerp(50, 100, rgK(o)), 40] : [lerp(30, 62, rgK(o)), 72]),
      p2: (o) => [lerp(-30, -62, rgK(o)), 72],
      pts: { centre: [0, 0], haut: [0, -74], bas: [0, 74], pageG: [-50, 0], pageD: [50, 0], blanc: [52, 34], dessus: (o) => [0, -74 * lerp(1, 0.34, clamp(o.aPlat || 0))] }, base: [0, 74], held: { droit: true } },
    chrono: { draw: drawChrono, grip: [0, 10], pts: { centre: [0, 0], anneau: [0, -38] }, base: [0, 24], held: { droit: true } },
    tampon: { draw: drawTampon, grip: [0, -34], pts: { base: [0, 6], pommeau: [0, -62] }, base: [0, 6], held: { droit: true } },
  };
  PAP2.OBJ = OBJ; PAP2.RG = RG;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, n, o) => { const v = ob.pts[n]; return v == null ? null : typeof v === 'function' ? v(o) : v; };
  function heldOpts(name, o, p) { return Object.assign({ t: (p && p.t) || 0, echelle: 1 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.scale(oo.echelle, oo.echelle); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }

  // =====================================================================
  // 2) MEMBRES À ARTICULATIONS RONDES, OBJETS TENUS (doigts par-dessus), POSES (repris de basket.js, validé)
  // =====================================================================
  const R_COUDE = 11.5, DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  function armR(len, wt, rc) { rc = rc || R_COUDE; const m = len * 0.42; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, m], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, m]]); }
  function foreR(kind) { const cap = ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU); return cap.concat(X.forePts(kind === 'open' ? 'open' : 'fist').slice(2)); }
  function thighR(L, w) { return ep(0, 0, w, w, 10, PI, TAU).concat([[w - 1, L * 0.45], [16.5, L - 4]], ep(0, L, 16.5, 16.5, 10, 0, PI), [[-16.5, L - 4], [-w + 1, L * 0.45]]); }
  function shinR(L) { return ep(0, 0, 16, 16, 10, PI, TAU).concat([[15, L * 0.4], [12, L - 28], [14, L - 16], [36, L - 11], [46, L - 4, 1], [45, L, 1], [-17, L, 1], [-19, L - 14], [-15, L - 30], [-16, L * 0.4]]); }
  function heldParts(skin, seed) {
    const dP = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
    const F = [4, 96];
    return {
      objet: { parent: 'armF_lo', at: F, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && OBJ[p.tenu]) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: F, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: dP },
      objetB: { parent: 'armB_lo', at: F, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB) && OBJ[p.tenuB] && !p._bDevant) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: F, noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux && !p._paume && !p._bDevant ? DOIGTS : OFFP), paint: dP },
      objetBF: { parent: 'armB_lo', at: F, noRivet: true, base: '#000', seed: seed + 7, pts: OFFP, extra: (p) => { if (has(p.tenuB) && OBJ[p.tenuB] && p._bDevant) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsBF: { parent: 'armB_lo', at: F, noRivet: true, base: skin, seed: seed + 8, pts: (p) => (has(p.tenuB) && !p._deux && !p._paume && p._bDevant ? DOIGTS : OFFP), paint: dP },
      doigtsB2: { parent: 'armB_lo', at: F, noRivet: true, base: skin, seed: seed + 6, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: dP },
    };
  }
  function prep(p) { p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); q._o0 = q.ang.objet || 0; q._oB0 = q.ang.objetB || 0; q.dx = q.dx || 0; q.dy = q.dy || 0; q.tilt = q.tilt || 0; return q; }
  function defA(A, d) { for (const k in d) if (A[k] == null) A[k] = d[k]; }
  const faceSet = (q, d) => { for (const k in d) if (q.face[k] == null) q.face[k] = d[k]; };
  function applyDroit(def, q) {
    const A = q.ang, tl = q.tilt || 0;
    A.objet = q.droit ? q._o0 - ((A.armF_up || 0) + (A.armF_lo || 0) + tl) : q._o0;
    A.objetB = q.droitB ? q._oB0 - ((A.armB_up || 0) + (A.armB_lo || 0) + tl) : q._oB0;
    A.objetBF = A.objetB;
  }
  function autoTenu(q) {
    if (has(q.tenu)) { if (!q.handF || q.handF === 'open') q.handF = 'fist'; if (q.droit == null) q.droit = true; }
    if (has(q.tenuB)) { if (!q._paume && (!q.handB || q.handB === 'open')) q.handB = 'fist'; if (q.droitB == null) q.droitB = true; }
  }
  function locPt(def, q, x, y, s, dir, part, p) { const { mats } = M.partMatrices(def, q, x, y, s, dir); return M.wpt(mats[part], p[0], p[1]); }
  function objPt(def, q, x, y, s, dir, arm, p, raw) {
    const F = arm === 'armF', name = F ? q.tenu : q.tenuB, { mats } = M.partMatrices(def, q, x, y, s, dir), fm = mats[arm + '_lo'].translate(4, 96);
    if (!has(name) || !OBJ[name]) return M.wpt(fm, 0, 0);
    const ob = OBJ[name], oo = heldOpts(name, F ? q.tenuO : q.tenuBO, q), g = gripOf(ob, oo), e = oo.echelle;
    const pp = raw ? p : (typeof p === 'string' ? ptOf(ob, p, oo) : null); if (!pp) return M.wpt(fm, 0, 0);
    return M.wpt(fm.rotate(((F ? q.ang.objet : q.ang.objetB) || 0) * D), (pp[0] - g[0]) * e, (pp[1] - g[1]) * e);
  }
  // même règle que le contrôle du kit : coude plié à l'envers (main derrière l'axe du bras) ou coude au-dessus de la ligne épaule–main
  function coudeMauvais(def, q, x, y, s, dir, arm) {
    const { mats } = M.partMatrices(def, q, x, y, s, dir), up = mats[arm + '_up'], lo = mats[arm + '_lo'];
    const S = M.wpt(up, 0, 0), E = M.wpt(lo, 0, 0), Hd = M.wpt(lo, 0, def.handLen), hl = new DOMPoint(Hd[0], Hd[1]).matrixTransform(up.inverse());
    const a1 = Math.atan2(E[1] - S[1], E[0] - S[0]), a2 = Math.atan2(Hd[1] - E[1], Hd[0] - E[0]); let pli = Math.abs(a2 - a1); if (pli > PI) pli = TAU - pli;
    if (pli > 0.3 && hl.x < -0.12 * def.handLen) return true;
    const sx = Hd[0] - S[0], sy = Hd[1] - S[1], Dd = Math.hypot(sx, sy);
    if (Dd >= 1 && Math.abs(sx) >= 0.35 * Dd && pli >= 0.3) { const u = ((E[0] - S[0]) * sx + (E[1] - S[1]) * sy) / (Dd * Dd); if (u > 0.05 && u < 0.95 && E[1] < S[1] + u * sy - Math.max(6, 10 * s)) return true; }
    return false;
  }
  function reach(def, q, x, y, s, dir, arm, cible, k, ptName, bend) {
    if (!(k > 0) || !cible) return;
    if (!bend) {                                                   // bendSign automatique : 1, sinon −1 si le coude serait à l'envers
      const t1 = Object.assign({}, q, { ang: Object.assign({}, q.ang) }); reach(def, t1, x, y, s, dir, arm, cible, 1, ptName, 1);
      bend = coudeMauvais(def, t1, x, y, s, dir, arm) ? -1 : 1;
    }
    const A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    const tmp = Object.assign({}, q, { ang: Object.assign({}, A) });
    let T = [cible[0], cible[1]], sol = null;
    for (let it = 0; it < (ptName ? 5 : 1); it++) {
      sol = M.ik(def, tmp, x, y, s, dir, arm, T, bend);
      tmp.ang[arm + '_up'] = sol.up; tmp.ang[arm + '_lo'] = sol.lo; applyDroit(def, tmp);
      if (!ptName) break;
      const E = objPt(def, tmp, x, y, s, dir, arm, ptName);
      T = [T[0] + cible[0] - E[0], T[1] + cible[1] - E[1]];
    }
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  const shPt = (def, q, x, y, s, dir, dx, dy) => locPt(def, q, x, y, s, dir, 'torso', [def.sh[0] + dx, def.sh[1] + dy]);
  function finishQ(def, q, x, y, s, dir) {
    if (q.atteint > 0 && q.cible) { const arm = q.bras === 'B' ? 'armB' : 'armF'; reach(def, q, x, y, s, dir, arm, q.cible, ease(clamp(q.atteint)), null, q.bendSign || 1); }
    applyDroit(def, q); q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const oo = heldOpts(q.tenu, q.tenuO, q), P2 = objPt(def, q, x, y, s, dir, 'armF', OBJ[q.tenu].p2(oo), true);
      reach(def, q, x, y, s, dir, 'armB', P2, 1, null, 0); q.handB = 'fist'; q._deux = true;
    }
    applyDroit(def, q);
    return q;
  }
  function run(def, q, x, y, s, o, nom) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF, nom }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q; r.def = def; r.s = s; r.dir = (o && o.dir) || 1;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', 4, 96); r.mainB = r.w('armB_lo', 4, 96); r.tete = r.w('head', -4, -104);
    if (def.post) def.post(r, q, o || {});
    return r;
  }
  // point nommé de l'objet tenu → [X, Y] écran
  PAP2.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, q = ptOf(ob, nom, oo); if (!q) return null; const g = gripOf(ob, oo), e = oo.echelle;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  // ---- têtes : contour de profil (cou en y = 16, nez vers +x), crâne, cheveux, bonnet, œil à regard
  function tetePts(nez, k, kx) {
    const N = { droit: [[29, -26], [28, -30], [31, -34], [37, -39, 1], [33, -46]], retrousse: [[29, -26], [28, -30], [32, -33], [36, -37, 1], [34, -41], [30, -46]], aquilin: [[29, -26], [28, -30], [33, -33], [39, -38, 1], [37, -44], [32, -50]], rond: [[29, -26], [29, -29], [34, -32], [38, -37, 1], [36, -43], [31, -47]] }[nez || 'droit'];
    const H = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22]].concat(N, [[29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]]);
    return sc(H, (kx || 1) * k, k);
  }
  const CRANE = [[24, -80], [20, -88], [12, -94], [0, -98], [-12, -96], [-24, -89], [-31, -78], [-34, -64], [-33, -48], [-29, -36]];
  const CRANE_IN = [[-24, -40], [-21, -54], [-12, -66], [2, -74], [14, -78], [20, -79]];
  function crane() { const P = []; for (let i = 0; i < CRANE.length - 1; i++) for (let j = 0; j < 4; j++) { const a = CRANE[i], b = CRANE[i + 1], u = j / 4; P.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]); } P.push(CRANE[CRANE.length - 1]); return P; }
  function cheveuxPts(th, kx, ky, frontTh) {
    const P = crane(), n = P.length, c0 = [-4, -60];
    const out = P.map((p, i) => { const u = i / (n - 1), dx = p[0] - c0[0], dy = p[1] - c0[1], l = Math.hypot(dx, dy), e = th + (frontTh || 0) * Math.max(0, 1 - u / 0.22); return [p[0] + dx / l * e, p[1] + dy / l * e]; });
    return sc(out.concat(CRANE_IN), kx, ky);
  }
  // cheveux plaqués (brillants) ; raie 'milieu' | 'cote'
  function cheveuxPlaques(col, seed, k, raie) {
    return { parent: 'head', at: [0, 0], noRivet: true, base: col, seed, pts: cheveuxPts(3.2, k, k, 2.5), paint: () => {
      const P = crane();
      for (const off of [-2, 1, 3]) strokePts(P.map((p) => { const dx = p[0] + 4, dy = p[1] + 60, l = Math.hypot(dx, dy); return [(p[0] + dx / l * off) * k, (p[1] + dy / l * off) * k]; }), 'rgba(20,12,8,0.35)', 1);
      strokePts(sc([[18, -90], [-2, -100], [-24, -92]], k, k), 'rgba(255,255,255,0.45)', 2);
      if (raie === 'milieu') strokePts(sc([[-2, -102], [0, -94], [2, -86]], k, k), 'rgba(240,220,200,0.75)', 1.6);
      else strokePts(sc([[16, -94], [4, -97]], k, k), 'rgba(240,220,200,0.6)', 1.4);
    } };
  }
  // bonnet de bain lisse (couvre le crâne jusqu'au-dessus de l'oreille) ; jugulaire (bonnet 1930)
  const BONNET_IN = [[-27, -34], [-20, -46], [-8, -58], [8, -68], [20, -76], [26, -78]];
  function bonnetPiece(col, seed, k, o) {
    o = o || {};
    const P = crane().map((p) => { const dx = p[0] + 4, dy = p[1] + 60, l = Math.hypot(dx, dy); return [p[0] + dx / l * 4.5, p[1] + dy / l * 4.5]; });
    return { parent: 'head', at: [0, 0], noRivet: true, base: col, seed, pts: sc(P.concat(BONNET_IN), k, k), paint: () => {
      strokePts(sc([[18, -88], [4, -98], [-14, -98]], k, k), 'rgba(255,255,255,0.55)', 3);
      strokePts(sc([[-22, -86], [-30, -70]], k, k), 'rgba(255,255,255,0.25)', 2);
      strokePts(sc(BONNET_IN, k, k), 'rgba(20,10,10,0.35)', 1.6);
      if (o.bande) strokePts(sc([[23, -80], [8, -92], [-12, -94], [-28, -80]], k, k), o.bande, 3.4);
      shade(10, -90, -30, -50, 0.25, [-60, -130, 60, -20]);
    }, extra: () => { if (o.jugulaire) strokePts(sc([[-14, -48], [-6, -20], [6, 6], [16, 10]], k, k), shadeHex(col, 0.8), 2.6); } };
  }
  function oeil(f, x, y, peau, rg) {
    const e = f.eyes || 'open';
    if (e === 'closed') { strokePts([[x - 6.5, y], [x - 1, y + 2.5], [x + 6, y + 0.5]], 'rgba(40,24,16,0.9)', 1.8); return; }
    const w = e === 'wide' ? 1.4 : 1;
    fillPts(ell(x, y, 6.4 * w, 4.4 * w, 12), '#f3eedf');
    const dx = rg === 'arriere' ? -2.8 : rg === 'haut' ? 1 : rg === 'bas' ? 1 : 1.8, dy = rg === 'haut' ? -1.8 : rg === 'bas' ? 1.6 : 0;
    dot(x + dx, y + dy, 2.7 * (e === 'wide' ? 0.9 : 1), '#24160e'); dot(x + dx + 0.8, y + dy - 1, 0.8, 'rgba(255,255,255,0.85)');
    if (e === 'half') fillPts([[x - 7.5, y - 6], [x + 7.5, y - 6], [x + 7.5, y - 0.4], [x - 7.5, y - 0.4]], peau);
    strokePts(ep(x, y, 6.4 * w, 4.4 * w, 8, PI * 1.05, PI * 1.95), 'rgba(40,24,16,0.7)', 1.2);
  }

  // =====================================================================
  // 3) NAGEURS : buste au-dessus de l'eau. Repère : TAILLE en (0,0) (hipY 0) = point posé sur la surface ; tilt pivote autour de la taille.
  //    Jambes sous l'eau (def.libre). Bras : 0 = pendant, négatif = vers l'avant ; les nages font tourner le bras en moulinet complet.
  // =====================================================================
  const NT = [[-16, -186], [10, -188], [20, -178], [32, -164], [42, -146], [46, -118], [41, -84], [33, -44], [29, -6], [32, 36], [36, 88, 1], [-36, 90, 1], [-35, 40], [-31, -4], [-35, -52], [-42, -100], [-46, -138], [-41, -166], [-29, -182]];
  const NSH = [-2, -150], NSHB = [-12, -150];
  // maillot une-pièce à bretelles (années 1920-30) : tout ce qui est sous l'encolure
  const MAILLOT = [[60, -118], [30, -116], [16, -126], [8, -144], [-2, -166], [-14, -180], [-30, -184], [-60, -170], [-60, 110], [60, 110]];
  function mkNageur(K) {
    const sd = K.seed, kH = K.kH || 1.04;
    const hk = (back) => (p) => (back ? p.handB : p.handF) || 'open';
    const up = (back) => ({ parent: 'torso', at: back ? NSHB : NSH, pts: armR(100, 19), base: back ? K.peauD : K.peau, seed: sd + (back ? 13 : 14), paint: () => {
      hatch([[-19, -20], [-6, -20], [-6, 104], [-19, 104]], 0.9, 3.8, back ? 0.34 : 0.2);
      strokePts([[8, 10], [12, 46], [8, 80]], 'rgba(255,240,220,0.25)', 2);
    } });
    const fore = (back) => ({ parent: back ? 'armB_up' : 'armF_up', at: [0, 100], pts: (p) => foreR(hk(back)(p)), base: back ? K.peauD : K.peau, seed: sd + (back ? 11 : 12), paint: (p) => {
      X.handPaint(null, hk(back)(p) === 'open' ? 'open' : 'fist'); hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.32 : 0.2);
    } });
    const leg = (back) => {
      const sk = back ? K.peauD : K.peau, sl = back ? shadeHex(K.slip, 0.8) : K.slip;
      return [{ parent: 'torso', at: [back ? -8 : 6, 62], pts: thighR(112, 22), base: sk, seed: sd + (back ? 21 : 22), noRivet: true, paint: () => { fillPts(rect(-30, -24, 30, K.maillot ? 52 : 18), sl); hatch([[-24, -10], [-6, -10], [-6, 120], [-24, 120]], 0.8, 4, back ? 0.36 : 0.2); M.rivet(0, 112, 3); } },
        { parent: back ? 'legB_up' : 'legF_up', at: [0, 112], pts: shinR(118), base: sk, seed: sd + (back ? 23 : 24), noRivet: true, paint: () => hatch([[-22, 0], [-6, 0], [-6, 118], [-22, 118]], 0.8, 4, back ? 0.36 : 0.2) }];
    };
    const [lbU, lbL] = leg(true), [lfU, lfL] = leg(false);
    const parts = {
      trace: { parent: 'torso', at: NSH, noRivet: true, base: '#000', seed: sd + 50, pts: OFFP, extra: (p) => traceArc(p) },
      torso: { parent: null, at: [0, 0], pts: NT, base: K.peau, seed: sd + 1, paint: () => {
        if (!K.maillot) {
          fillPts(rect(-60, 26, 60, 110), K.slip); strokePts([[-40, 28], [40, 26]], 'rgba(255,255,255,0.3)', 2);
          strokePts([[20, -132], [34, -120], [40, -104]], 'rgba(120,70,50,0.35)', 1.6);              // pectoral
          for (const y of [-74, -50, -26]) strokePts([[18, y], [30, y + 2]], 'rgba(120,70,50,0.22)', 1.3);
        } else clipPoly(MAILLOT, (c) => {
          c.fillStyle = K.maillot; c.fillRect(-60, -190, 120, 300);
          if (K.rayure) { c.fillStyle = K.rayure; for (let y = -186; y < 110; y += 22) c.fillRect(-60, y, 120, 11); }
          if (K.liseré) { strokePts(MAILLOT.slice(0, 7), K.liseré, 4); }
          strokePts([[-60, 60], [60, 58]], 'rgba(0,0,0,0.25)', 1.5);
        });
        if (K.maillot) strokePts([[-6, -182], [2, -160], [10, -140]], K.liseré || shadeHex(K.maillot, 0.75), 6);      // bretelle
        hatch([[-50, -170], [-14, -170], [-14, 100], [-50, 100]], 0.75, 4.2, 0.24); shade(44, -60, -44, -60, 0.26, [-60, -200, 60, 120]);
        strokePts([[42, -142], [46, -112]], 'rgba(255,250,235,0.3)', 3);
      } },
      legB_up: lbU, legB_lo: lbL, legF_up: lfU, legF_lo: lfL,
      armB_up: up(true), armB_lo: fore(true), armF_up: up(false), armF_lo: fore(false),
      head: { parent: 'torso', at: [6, -180], pts: tetePts(K.nez, kH), base: K.peau, seed: sd + 2, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8.5 * kH, -46 * kH);
        hatch([[-24, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
        dot(17 * kH, -34 * kH, 8, 'rgba(205,120,100,0.2)');
        oeil(f, 19 * kH, -55 * kH, K.peau, p.regard);
        X.brow(f, 19 * kH, -64 * kH, K.sourcil || 'rgba(60,40,30,0.95)', 2.6);
        X.mouth(f, 29 * kH, -25 * kH);
        if (K.moustache === 'guidon') pc(sc([[16, -37], [24, -40], [32, -39], [38, -37], [43, -40], [46, -46], [44, -50], [41, -45], [37, -33], [28, -31], [18, -32]], kH, kH), K.chev, () => strokePts(sc([[20, -36], [38, -36]], kH, kH), 'rgba(255,240,220,0.3)', 1), sd + 7, { drop: false });
      } },
      lunettes: { parent: 'head', at: [0, 0], noRivet: true, base: '#1d2a33', seed: sd + 8, pts: (p) => (!K.lunettes ? OFFP : (p._lunFront ? sc(ell(16, -86, 10, 6.5, 12), kH, kH) : sc(ell(20, -55, 10, 7, 12), kH, kH))), paint: (p) => {
        const y = p._lunFront ? -86 : -55, x = p._lunFront ? 16 : 20;
        fillPts(sc(ell(x, y, 7.5, 5, 10), kH, kH), p._lunFront ? 'rgba(80,140,170,0.9)' : 'rgba(110,170,200,0.45)');
        strokePts(sc([[x - 4, y - 3], [x + 1, y - 4]], kH, kH), 'rgba(255,255,255,0.8)', 1.4);
      }, extra: (p) => { if (!K.lunettes) return; const y = p._lunFront ? -86 : -55; strokePts(sc([[8, y - 1], [-14, y - 6], [-32, y - 2]], kH, kH), '#1d2a33', 2.2); } },
    };
    if (K.bonnet) parts.coiffe = bonnetPiece(K.bonnet, sd + 3, kH, { jugulaire: K.jugulaire, bande: K.bande });
    else parts.coiffe = cheveuxPlaques(K.chev, sd + 3, kH, K.raie);
    return { hipY: 0, handLen: 98, nom: K.nom, rod: { part: 'torso', at: [-24, 40] }, sh: NSH, libre: { legF: 1, legB: 1 }, nageur: true,
      parts, order: ['trace', 'armB_up', 'armB_lo', 'legB_lo', 'legB_up', 'legF_lo', 'legF_up', 'head', 'coiffe', 'lunettes', 'torso', 'armF_up', 'armF_lo'] };
  }
  // trace en arc du retour aérien (papillon / volant) : arc pâle autour de l'épaule, de la sortie (hanche) jusqu'aux mains
  function traceArc(p) {
    if (SIL() || !(p._trace > 0.02)) return;
    const a1 = p._traceA - 0.12, a0 = Math.max(p._traceA0, a1 - 1.25);
    if (!(a1 > a0 + 0.15)) return;
    const c = cx_(), n = 9; c.save(); c.lineCap = 'round';
    for (const [R, w] of [[222, 4.2], [196, 2.6], [172, 1.8]]) for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 0.7) / n, b0 = lerp(a0, a1, u0), b1 = lerp(a0, a1, u1);
      c.globalAlpha = 0.75 * p._trace * Math.pow(u1, 1.4); c.strokeStyle = 'rgba(248,244,230,0.95)'; c.lineWidth = w * M._lw();
      c.beginPath(); c.moveTo(-Math.sin(b0) * R, Math.cos(b0) * R); c.lineTo(-Math.sin((b0 + b1) / 2) * R, Math.cos((b0 + b1) / 2) * R); c.lineTo(-Math.sin(b1) * R, Math.cos(b1) * R); c.stroke();
    }
    c.restore();
  }
  // ---- identités
  const PEAUX = { a: ['#e2bd98', '#c39d7a'], b: ['#c99a72', '#a97c57'], c: ['#ebc9a8', '#cba886'], d: ['#b98563', '#9a6a4c'] };
  const MODERNES = {
    crawl: { bonnet: '#3d5a80', nez: 'droit', peau: 'a' },
    dos: { bonnet: '#5f7a4a', nez: 'retrousse', peau: 'b' },
    brasse: { bonnet: '#c49a3c', nez: 'rond', peau: 'c' },
    papillon: { bonnet: '#8e2c2c', nez: 'aquilin', peau: 'd' },
  };
  for (const k in MODERNES) { const m = MODERNES[k], pe = PEAUX[m.peau]; CH['pap2Mod_' + k] = mkNageur({ nom: 'nageur ' + k, seed: 1000 + 40 * Object.keys(MODERNES).indexOf(k), peau: pe[0], peauD: pe[1], bonnet: m.bonnet, slip: m.bonnet, nez: m.nez, lunettes: true }); }
  const BRASSEURS = {
    a: { maillot: '#e8e0c8', rayure: '#26304a', chev: '#1e1814', nez: 'droit', peau: ['#e6c3a0', '#c7a07f'] },
    b: { maillot: '#e8e0c8', rayure: '#8e2c2c', chev: '#6a4026', nez: 'aquilin', peau: ['#dcb38e', '#bd926f'] },
    c: { maillot: '#5f7a4a', chev: '#9a5a2a', nez: 'rond', peau: ['#efcfb2', '#cfae90'], bonnet: '#ece8dc', jugulaire: true },
  };
  for (const k in BRASSEURS) { const b = BRASSEURS[k]; CH['pap2Bra_' + k] = mkNageur({ nom: 'brasseur ' + k, seed: 1300 + 40 * 'abc'.indexOf(k), peau: b.peau[0], peauD: b.peau[1], maillot: b.maillot, rayure: b.rayure, slip: b.rayure || b.maillot, chev: b.chev, raie: 'milieu', nez: b.nez, moustache: 'guidon', bonnet: b.bonnet, jugulaire: b.jugulaire, sourcil: shadeHex(b.chev, 0.9) }); }
  const VOLANTS = {
    myers: { maillot: '#26304a', chev: '#5a3a22', nez: 'droit', peau: ['#e4c09c', '#c49e7c'] },
    higgins: { maillot: '#ebe4cf', liseré: '#26304a', bonnet: '#f2efe6', nez: 'retrousse', peau: ['#eccbab', '#ccab8b'] },
    p1952: { maillot: '#8e2c2c', bonnet: '#8e2c2c', nez: 'rond', peau: ['#d8ad86', '#b88d68'] },
  };
  for (const k in VOLANTS) { const v = VOLANTS[k]; CH['pap2Vol_' + k] = mkNageur({ nom: 'volant ' + k, seed: 1500 + 40 * Object.keys(VOLANTS).indexOf(k), peau: v.peau[0], peauD: v.peau[1], maillot: v.maillot, liseré: v.liseré, slip: v.maillot, chev: v.chev, raie: 'cote', nez: v.nez, bonnet: v.bonnet, kH: 1.02 }); }
  PAP2.MODERNES = MODERNES; PAP2.BRASSEURS = BRASSEURS; PAP2.VOLANTS = VOLANTS;

  // ---- les nages : angle d'épaule (repère du corps) le long d'un cycle φ. Le bras tourne toujours dans le même sens (moulinet).
  const PAPI = { a: [[0, 3.75], [0.2, 4.75], [0.38, 6.62], [0.5, 8.92], [0.75, 9.43], [1, 10.03]], lo: [[0, -0.05], [0.2, -0.9], [0.36, -0.3], [0.5, -0.04], [1, -0.04]],
    tilt: [[0, 1.12], [0.2, 0.95], [0.38, 0.66], [0.5, 0.5], [0.75, 0.8], [1, 1.12]], dy: [[0, 18], [0.2, 0], [0.38, -34], [0.5, -56], [0.75, -30], [1, 18]],
    head: [[0, 0.25], [0.3, -0.3], [0.45, -0.72], [0.62, -0.55], [0.85, 0.1], [1, 0.25]] };
  const CRAWL = { a: [[0, 3.9], [0.25, 5.2], [0.5, 6.55], [0.75, 8.6], [1, 10.18]], lo: [[0, -0.08], [0.25, -0.45], [0.5, -0.2], [0.68, -1.05], [0.88, -0.4], [1, -0.08]] };
  const DOS = { a: [[0, -3.4], [0.5, -6.25], [1, -9.68]], lo: [[0, -0.05], [0.25, -0.7], [0.5, -0.1], [1, -0.05]] };
  const BRASSE = { a: [[0, 4.4], [0.3, 4.95], [0.55, 5.55], [0.8, 4.65], [1, 4.4]], lo: [[0, -0.05], [0.3, -0.35], [0.55, -1.55], [0.8, -0.8], [1, -0.05]], dy: [[0, 8], [0.5, -22], [1, 8]], head: [[0, -0.7], [0.5, -0.95], [1, -0.7]] };
  const NREST = { armF_up: -0.16, armF_lo: -0.38, armB_up: 0.08, armB_lo: -0.32, head: 0, legF_up: -0.12, legF_lo: 0.25, legB_up: 0.14, legB_lo: 0.3 };
  const NAGES = ['crawl', 'dos', 'brasse', 'papillon'];
  const GESTES_N = NAGES.concat(['attente', 'joie', 'debout', 'stupeur', 'regardeVoisin', 'seGratteTete', 'brasseJambes', 'sourire', 'salut']);
  function mixTo(q, T, w) {
    if (!(w > 0)) return;
    for (const k of ['tilt', 'dy', 'dx']) if (T[k] != null) q[k] = lerp(q[k] || 0, T[k], w);
    for (const k in T.ang) q.ang[k] = lerp(q.ang[k] || 0, T.ang[k], w);
  }
  PAP2.nageurPose = function (def, p, x, y, s, dir) {
    p = p || {}; const q = prep(Object.assign({}, p, { ang: {} })), user = p.ang || {};
    s = s == null ? 0.9 : s; dir = dir || 1;
    const t = q.t || 0, g = tg(t), ph0 = q.phase;
    Object.assign(q.ang, NREST);
    if (q.nage) q[q.nage === 'vole' ? 'papillon' : q.nage] = q[q.nage] == null ? 1 : q[q.nage];
    if (q.vole != null && q.papillon == null) q.papillon = q.vole;
    const W = {}; for (const n of GESTES_N) W[n] = gE(q, n);
    let libre = false; q._trace = 0;
    const phOf = (f) => frac(ph0 != null ? ph0 : g * f + (q.phaseDecal || 0));
    // nages (pose complète au poids 1)
    if (W.papillon > 0) {
      const u = phOf(0.55), ub = frac(u - 0.03), air = smooth(0.34, 0.46, u) * (1 - smooth(0.84, 0.97, u)), ec = q.ecart == null ? 0.85 : q.ecart;
      mixTo(q, { tilt: keyf(PAPI.tilt, u), dy: keyf(PAPI.dy, u), ang: { armF_up: keyf(PAPI.a, u) - 0.18 * air * ec / 0.55, armF_lo: keyf(PAPI.lo, u), armB_up: keyf(PAPI.a, ub) + (ub > u ? -TAU : 0) + 0.1 + ec * air, armB_lo: keyf(PAPI.lo, ub), head: keyf(PAPI.head, u), legF_up: -0.3 + 0.5 * Math.sin(u * TAU * 2), legB_up: -0.3 + 0.5 * Math.sin(u * TAU * 2), legF_lo: 0.4, legB_lo: 0.4 } }, W.papillon);
      q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; libre = true; q._u = u;
      q._lunFront = false; if (u > 0.36 && u < 0.7) faceSet(q, { mouth: 'o', eyes: 'open', brow: 'up' });
      q._trace = (q.trace === false ? 0 : 1) * W.papillon * smooth(0.36, 0.45, u) * (1 - smooth(0.85, 0.98, u)); q._traceA = keyf(PAPI.a, u) - TAU; q._traceA0 = 0.2;
    }
    if (W.crawl > 0) {
      const u = phOf(0.6), v = frac(u + 0.5);
      mixTo(q, { tilt: 1.18 + 0.04 * Math.sin(u * TAU), dy: 10, ang: { armF_up: keyf(CRAWL.a, u), armF_lo: keyf(CRAWL.lo, u), armB_up: keyf(CRAWL.a, v), armB_lo: keyf(CRAWL.lo, v), head: lerp(0.1, -0.75, smooth(0.5, 0.65, u) * (1 - smooth(0.82, 0.95, u))), legF_up: 0.3 * Math.sin(u * TAU * 3), legB_up: -0.3 * Math.sin(u * TAU * 3) } }, W.crawl);
      q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; libre = true;
      if (u > 0.55 && u < 0.85) faceSet(q, { mouth: 'o' });
    }
    if (W.dos > 0) {
      const u = phOf(0.5), v = frac(u + 0.5);
      mixTo(q, { tilt: -0.95, dy: 10, ang: { armF_up: keyf(DOS.a, u), armF_lo: keyf(DOS.lo, u), armB_up: keyf(DOS.a, v), armB_lo: keyf(DOS.lo, v), head: 0.32, legF_up: -0.6 + 0.25 * Math.sin(u * TAU * 3), legB_up: -0.6 - 0.25 * Math.sin(u * TAU * 3) } }, W.dos);
      q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; libre = true; faceSet(q, { eyes: 'open' }); if (q.regard == null) q.regard = 'haut';
    }
    if (W.brasse > 0) {
      const u = phOf(0.6), ub = frac(u - 0.04);
      mixTo(q, { tilt: 0.82, dy: keyf(BRASSE.dy, u), ang: { armF_up: keyf(BRASSE.a, u), armF_lo: keyf(BRASSE.lo, u), armB_up: keyf(BRASSE.a, ub) + 0.08, armB_lo: keyf(BRASSE.lo, ub), head: keyf(BRASSE.head, u), legF_up: lerp(-1.2, 0.2, smooth(0.4, 0.7, u)), legB_up: lerp(-1.1, 0.25, smooth(0.42, 0.72, u)), legF_lo: lerp(1.6, 0.1, smooth(0.4, 0.7, u)), legB_lo: lerp(1.5, 0.1, smooth(0.42, 0.72, u)) } }, W.brasse);
      q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; libre = true;
      if (q.digne !== false) faceSet(q, { brow: 'n', mouth: 'tight' });
    }
    // gestes debout dans l'eau
    if (W.brasseJambes > 0) {
      const sw = Math.sin(g * 2.2);
      mixTo(q, { tilt: 0.12, dy: -4 * Math.abs(Math.sin(g * 2.2)), ang: { armF_up: -0.55 + 0.2 * sw, armF_lo: -0.45, armB_up: -0.35 - 0.2 * sw, armB_lo: -0.5, head: -0.05, legF_up: lerp(-0.9, 0.2, 0.5 + 0.5 * sw), legF_lo: lerp(1.2, 0.1, 0.5 + 0.5 * sw), legB_up: lerp(-0.85, 0.25, 0.5 + 0.5 * sw), legB_lo: lerp(1.1, 0.1, 0.5 + 0.5 * sw) } }, W.brasseJambes);
      q.handF = q.handF || 'open'; q.handB = q.handB || 'open';
    }
    if (W.joie > 0) {
      mixTo(q, { tilt: -0.05, dy: -Math.abs(Math.sin(g * 5)) * 10, ang: { armF_up: -2.75, armF_lo: -0.12, armB_up: -2.35, armB_lo: -0.15, head: -0.32 } }, W.joie);
      q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; faceSet(q, { mouth: 'smile', eyes: 'closed', brow: 'up' }); q._lunFront = true;
    }
    if (W.salut > 0) {
      mixTo(q, { ang: { armF_up: -2.65 + 0.22 * Math.sin(g * 6), armF_lo: -0.3 - 0.2 * Math.sin(g * 6 + 1), head: -0.08 } }, W.salut);
      q.handF = 'open'; faceSet(q, { mouth: 'smile', brow: 'up' }); q._lunFront = true;
    }
    if (W.stupeur > 0) {
      mixTo(q, { tilt: -0.1, dx: -12, ang: { armF_up: -0.7, armF_lo: -1.05, armB_up: -0.5, armB_lo: -1.15, head: -0.22 } }, W.stupeur);
      q.handF = 'open'; q.handB = 'open'; faceSet(q, { mouth: 'o', eyes: 'wide', brow: 'up' }); q._lunFront = true;
    }
    if (W.sourire > 0) { mixTo(q, { ang: { head: -0.1 } }, W.sourire); faceSet(q, { mouth: 'smile', eyes: 'half', brow: 'up' }); q._lunFront = true; }
    if (W.regardeVoisin > 0) { mixTo(q, { ang: { head: 0.16 } }, W.regardeVoisin); faceSet(q, { brow: 'frown', mouth: 'tight' }); if (q.regard == null) q.regard = 'arriere'; }
    if (W.debout > 0 || W.attente > 0 || W.seGratteTete > 0) q.dy += Math.sin(g * 1.4 + x * 0.01) * 2;
    if (W.debout > 0) {
      mixTo(q, { tilt: -0.04, ang: { head: -0.12 } }, W.debout); faceSet(q, { mouth: 'tight', brow: 'n' });
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [30, -6]), W.debout, null, 1);
      reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'torso', [-16, -2]), W.debout, null, 1);
    }
    if (W.attente > 0) {
      mixTo(q, { tilt: 0.12 }, W.attente); q._lunFront = true;
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [150, -22]), W.attente, null, 1);
      reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'torso', [124, -16]), W.attente, null, 1);
    }
    if (W.seGratteTete > 0) {
      faceSet(q, { brow: 'worry', mouth: 'tight' }); if (q.regard == null) q.regard = 'haut'; q._lunFront = true;
      q.ang.head += 0.12 * W.seGratteTete;
      q.handB = 'open'; const H = locPt(def, q, x, y, s, dir, 'head', [-8 + 5 * Math.sin(g * 13), -112]);
      reach(def, q, x, y, s, dir, 'armB', H, W.seGratteTete, null, 1);
    }
    if (W.papillon <= 0 && W.crawl <= 0 && W.brasse <= 0 && W.dos <= 0 && W.joie <= 0 && W.brasseJambes <= 0) q.dy += Math.sin(g * 1.7) * 1.4;
    if (q.lunettes === 'front') q._lunFront = true; if (q.lunettes === 'yeux') q._lunFront = false;
    for (const k in user) q.ang[k] = (q.ang[k] || 0) + user[k];
    if (libre) q.libre = Object.assign({ armF: 1, armB: 1 }, q.libre || {});
    return finishQ(def, q, x, y, s, dir);
  };
  const surfY = (c) => (typeof c === 'number' ? c : EAU[c] != null ? EAU[c] : EAU.milieu);
  function runNageur(def, pose, x, couloir, s, o, nom) {
    const y = surfY(couloir), sc0 = s == null ? (ECH[couloir] || 0.9) : s, dir = (o && o.dir) || 1;
    const q = PAP2.nageurPose(def, pose, x, y, sc0, dir), c = cx_();
    c.save(); c.beginPath(); c.rect(-2000, -2000, 5080, ((o && o.clipBas) || EAU.bas) + 2000); c.clip();
    const r = run(def, q, x, y, sc0, Object.assign({ slot: EAU.bas, floorShadow: false }, o || {}), nom);
    c.restore(); r.surf = y; r.x = x; return r;
  }
  PAP2.nageurModerne = (pose, x, couloir, s, o) => { const k = (pose && pose.qui) || (pose && NAGES.includes(pose.nage) ? pose.nage : 'crawl'); return runNageur(CH['pap2Mod_' + k], pose, x, couloir, s, o, 'nageur ' + k); };
  PAP2.brasseur = (pose, x, couloir, s, o) => { const k = (pose && pose.tenue) || 'a'; return runNageur(CH['pap2Bra_' + k], pose, x, couloir, s, o, 'brasseur ' + k); };
  PAP2.volant = (pose, x, couloir, s, o) => { const k = (pose && pose.qui) || 'myers'; const p = Object.assign({}, pose); if (p.vole == null && p.nage == null && !GESTES_N.some((n) => p[n] > 0)) p.vole = 1; return runNageur(CH['pap2Vol_' + k], p, x, couloir, s, o, 'volant ' + k); };
  PAP2.defNageur = (famille, qui) => CH['pap2' + ({ moderne: 'Mod_', brasseur: 'Bra_', volant: 'Vol_' }[famille] || 'Mod_') + qui];

  // =====================================================================
  // 4) OFFICIELS (années 1930) : blazer, flanelle, chaussures ; chef / b / c
  // =====================================================================
  function mkHumain(K) {
    const sd = K.seed, hk = (back) => (p) => (back ? p.handB : p.handF) || 'fist';
    const fore = (back) => ({ parent: back ? 'armB_up' : 'armF_up', at: [0, 94], pts: (p) => foreR(hk(back)(p)), base: back ? K.mancheD : K.manche, seed: sd + (back ? 11 : 12), paint: (p) => {
      const k = hk(back)(p), skin = back ? K.peauD : K.peau;
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k === 'open' ? 'open' : 'fist');
      fillPts([[-15, 64], [15, 64], [16, 77], [-15, 77]], '#efe9da');
      if (K.cuff) K.cuff(back, p);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.32 : 0.22);
    } });
    const up = (back) => ({ parent: 'torso', at: back ? K.shB : K.shF, pts: armR(94, K.armW || 17), base: back ? K.mancheD : K.manche, seed: sd + (back ? 13 : 14), paint: (p) => {
      if (K.armDeco) K.armDeco(back, p); hatch([[-18, -20], [-4, -20], [-4, 100], [-18, 100]], 0.9, 3.8, back ? 0.34 : 0.24);
    } });
    const leg = (back) => {
      const pant = back ? K.pantD : K.pant, shoe = back ? K.shoeD : K.shoe;
      return [{ parent: 'torso', at: [back ? -6 : 6, -2], pts: thighR(K.thigh, K.legW || 21), base: pant, seed: sd + (back ? 21 : 22), noRivet: true, paint: () => {
        hatch([[-24, -10], [-6, -10], [-6, K.thigh + 10], [-24, K.thigh + 10]], 0.8, 4, back ? 0.36 : 0.2); strokePts([[10, 0], [8, K.thigh]], 'rgba(255,255,255,0.18)', 1.6); M.rivet(0, K.thigh, 3.2);
      } }, { parent: back ? 'legB_up' : 'legF_up', at: [0, K.thigh], pts: shinR(K.shin), base: pant, seed: sd + (back ? 23 : 24), noRivet: true, paint: () => {
        fillPts([[-30, K.shin - 22, 1], [60, K.shin - 22, 1], [60, K.shin + 4, 1], [-30, K.shin + 4, 1]], shoe);
        if (K.spat) fillPts([[-20, K.shin - 22], [24, K.shin - 22], [30, K.shin - 12], [-20, K.shin - 12]], K.spat);
        strokePts([[14, K.shin - 15], [42, K.shin - 6]], 'rgba(255,240,220,0.3)', 1.3);
        hatch([[-22, 0], [-6, 0], [-6, K.shin - 22], [-22, K.shin - 22]], 0.8, 4, back ? 0.36 : 0.2);
      } }];
    };
    const [lbU, lbL] = leg(true), [lfU, lfL] = leg(false);
    const parts = {
      torso: { parent: null, at: [0, 0], pts: K.torso, base: K.corps, seed: sd + 1, paint: (p) => K.torsoPaint(p) },
      legB_up: lbU, legB_lo: lbL, legF_up: lfU, legF_lo: lfL,
      armB_up: up(true), armB_lo: fore(true), armF_up: up(false), armF_lo: fore(false),
      head: { parent: 'torso', at: K.neck, pts: K.headPts, base: K.peau, seed: sd + 2, noRivet: true, rest: K.headRest || 0, paint: (p) => K.headPaint(p, p.face || {}) },
    };
    Object.assign(parts, K.extra || {});
    Object.assign(parts, heldParts(K.peau, sd + 40));
    const extraH = K.orderHead || [], extraF = K.orderFront || [];
    return { hipY: 2 - K.thigh - K.shin, handLen: 98, nom: K.nom, rod: { part: 'torso', at: [-26, 18] }, sh: K.shF, shB: K.shB, thigh: K.thigh, shin: K.shin, post: K.post, neck: K.neck,
      parts, order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB_lo', 'legB_up', 'legF_lo', 'legF_up', 'head'].concat(extraH, ['torso'], extraF, ['objetBF', 'doigtsBF', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']) };
  }
  // chronomètre suspendu au cou (quand il n'est pas tenu)
  function chronoCou(p, K) {
    if (p.tenu === 'chrono' || p.chronoCou === false) return;
    strokePts([[K.neck[0] - 4, K.neck[1] + 4], [K.neck[0] + 10, K.neck[1] + 40], [K.neck[0] + 22, K.neck[1] + 70]], '#2a2a2a', 1.4);
    const c = cx_(); c.save(); c.translate(K.neck[0] + 24, K.neck[1] + 96); c.scale(0.7, 0.7); drawChrono({ t: p.t, marche: false }); c.restore();
  }
  function blazer(K, p, o) {
    const T = K.torso, top = K.neck[1];
    fillPts([[6, top - 6], [22, top + 2], [26, top + 20], [18, top + 34], [8, top + 18]], o.chemise || '#f0ebdc');          // col de chemise
    if (o.noeud) pc([[12, top + 10], [24, top + 4], [26, top + 18], [18, top + 14], [12, top + 22]], o.noeud, null, K.seed + 60, { drop: false });
    else fillPts([[14, top + 12], [22, top + 12], [24, top + 60], [18, top + 70], [13, top + 58]], o.cravate || '#2a2420');
    fillPts([[8, top + 14], [20, top + 26], [30, top + 60], [24, top + 120], [16, top + 80]], o.revers || shadeHex(K.corps, 0.78));        // revers
    strokePts([[18, top + 26], [26, top + 90], [28, top + 150], [30, top + 250]], 'rgba(10,10,14,0.55)', 1.6);
    for (const dy of [140, 172]) dot(o.bx || 30, top + dy, 2.8, o.bouton || '#c9a24a');
    fillPts([[-24, top + 138], [6, top + 138], [6, top + 146], [-24, top + 146]], 'rgba(0,0,0,0.18)');                          // poche
    if (o.liseré) strokePts(T.slice(1, 11), o.liseré, 2.4);
    if (o.rayures) for (let x = -44; x < 52; x += 9) strokePts([[x, top - 6], [x + 2, 80]], o.rayures, 1.1);
    if (o.pochette) fillPts([[-2, top + 56], [10, top + 50], [12, top + 60], [0, top + 62]], o.pochette);
    hatch([[-50, top], [-14, top], [-14, 80], [-50, 80]], 0.75, 4.4, 0.26); shade(40, -90, -40, -90, 0.24, [-60, -260, 70, 100]);
  }
  const OFF = {
    chef: { corps: '#27324a', corpsD: '#1c2438', pant: '#e8e2d0', pantD: '#cfc8b4', shoe: '#5a3a22', shoeD: '#3e2818', peau: '#ecc4a4', peauD: '#cba184', poil: '#a9a59c' },
    b: { corps: '#6e2430', corpsD: '#521a24', pant: '#8e8a80', pantD: '#74706a', shoe: '#1c1a1a', shoeD: '#100f0f', peau: '#e6c0a2', peauD: '#c69e80', poil: '#efebe2' },
    c: { corps: '#5a6b45', corpsD: '#45533a', pant: '#d9d0b6', pantD: '#bfb59a', shoe: '#6a4a2e', shoeD: '#4a321e', peau: '#d9b090', peauD: '#b98e70', poil: '#7a6a58' },
  };
  PAP2.OFF = OFF;
  function mkOfficiel(qui) {
    const C = OFF[qui];
    const K = { nom: 'officiel ' + qui, seed: 2000 + 100 * 'chef b c'.split(' ').indexOf(qui), peau: C.peau, peauD: C.peauD, corps: C.corps, manche: C.corps, mancheD: C.corpsD, pant: C.pant, pantD: C.pantD, shoe: C.shoe, shoeD: C.shoeD };
    if (qui === 'chef') Object.assign(K, {
      torso: [[-16, -190], [10, -192], [20, -182], [30, -166], [40, -140], [48, -100], [55, -52], [53, 0], [47, 38], [45, 70, 1], [-42, 72, 1], [-40, 38], [-40, 0], [-42, -60], [-44, -110], [-42, -150], [-36, -172], [-26, -186]],
      neck: [6, -186], shF: [-2, -160], shB: [-10, -160], thigh: 116, shin: 118, legW: 23, armW: 18, spat: '#f0ebdc',
      headPts: tetePts('rond', 1.06),
      torsoPaint: (p) => { blazer(K, p, { liseré: 'rgba(236,230,212,0.85)', bouton: '#c9a24a', pochette: '#ece6d4' }); chronoCou(p, K); },
      headPaint: (p, f) => {
        const k = 1.06; X.earPaint(-8.5 * k, -46 * k);
        fillPts(sc([[-30, -66], [-36, -50], [-34, -32], [-26, -24], [-20, -32], [-24, -50], [-20, -62]], k, k), C.poil);
        hatch([[-24, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22); dot(19, -34, 10, 'rgba(210,110,100,0.3)');
        oeil(f, 19 * k, -55 * k, C.peau, p.regard); X.brow(f, 19 * k, -64 * k, '#8a867e', 3.4); X.mouth(f, 29 * k, -25 * k);
        pc(sc([[14, -40], [26, -42], [36, -39], [41, -30], [40, -22], [34, -24], [30, -29], [22, -30], [14, -32]], k, k), C.poil, () => { for (let x = 18; x < 40; x += 3) strokePts([[x * k, -39 * k], [(x + 1) * k, -28 * k]], 'rgba(90,86,78,0.5)', 0.8); }, K.seed + 9, { drop: false });
        const ring = ell(20 * k, -55 * k, 10, 10, 14); fillPts(ring, 'rgba(200,225,235,0.22)'); strokePts(ring.concat([ring[0]]), '#5a5a5e', 1.8);
        strokePts([[9 * k, -56 * k], [-28 * k, -58 * k]], '#5a5a5e', 1.4);
      },
      extra: { canotier: { parent: 'head', at: [0, -86], noRivet: true, base: '#d8bf7a', seed: 2051, pts: [[-58, 6], [62, 5], [64, 0], [36, -3], [35, -34], [-31, -35], [-32, -3], [-56, -2]], paint: () => {
        for (let y = -32; y < 0; y += 4) strokePts([[-32, y], [36, y]], 'rgba(150,115,50,0.45)', 0.9);
        for (let x = -54; x < 62; x += 5) strokePts([[x, -1], [x + 1, 5]], 'rgba(150,115,50,0.4)', 0.8);
        fillPts(rect(-32, -15, 36, -5), '#27324a'); strokePts([[-30, -33], [34, -32]], 'rgba(255,245,210,0.6)', 1.6);
      } } }, orderHead: ['canotier'],
      post: (r, q) => { if (q.tenu === 'chrono' && !SIL()) { const A = r.w('torso', K.neck[0] - 2, K.neck[1] + 6), B = PAP2.pt(r, 'anneau'); if (B) strokePts([A, [(A[0] + B[0]) / 2, Math.max(A[1], B[1]) + 26], B], '#2a2a2a', 1.4); } },
    });
    if (qui === 'b') Object.assign(K, {
      torso: [[-14, -200], [10, -202], [18, -192], [26, -176], [31, -150], [32, -110], [30, -60], [29, -10], [31, 40], [34, 72, 1], [-34, 74, 1], [-32, 40], [-31, -10], [-33, -70], [-35, -130], [-34, -170], [-30, -188], [-22, -198]],
      neck: [6, -198], shF: [-2, -170], shB: [-10, -170], thigh: 128, shin: 132, legW: 19, armW: 16,
      headPts: tetePts('aquilin', 1.04, 0.96),
      torsoPaint: (p) => blazer(K, p, { rayures: 'rgba(236,228,210,0.55)', noeud: '#1c1a20', bouton: '#e8e0cc' }),
      headPaint: (p, f) => {
        const k = 1.04; X.earPaint(-8.5 * k, -46 * k);
        strokePts(sc([[16, -88], [0, -96], [-18, -92]], k, k), 'rgba(255,255,255,0.6)', 3.2);          // crâne chauve qui brille
        pc(sc([[-28, -64], [-35, -50], [-33, -32], [-24, -22], [-20, -34], [-24, -52]], k, k), C.poil, null, K.seed + 8, { drop: false });
        hatch([[-24, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.2);
        oeil(f, 19 * k, -55 * k, C.peau, p.regard); X.brow(f, 19 * k, -64 * k, C.poil, 3.6); X.mouth(f, 29 * k, -25 * k);
        pc(sc([[-2, -60], [8, -56], [12, -44], [18, -36], [28, -36], [36, -32], [34, -24], [26, -18], [20, -8], [8, -4], [-2, -10], [-6, -26], [-6, -44]], k, k), C.poil, () => { for (let i = 0; i < 9; i++) strokePts(sc([[2 + i * 3, -50 + i * 2], [6 + i * 3, -16 + i]], k, k), 'rgba(150,145,135,0.45)', 0.9); }, K.seed + 9, { drop: false });
      },
    });
    if (qui === 'c') Object.assign(K, {
      torso: [[-15, -190], [10, -192], [20, -182], [28, -164], [35, -140], [38, -100], [37, -50], [35, 0], [37, 40], [40, 72, 1], [-38, 74, 1], [-37, 40], [-36, 0], [-37, -60], [-40, -120], [-39, -160], [-34, -176], [-25, -188]],
      neck: [6, -188], shF: [-2, -160], shB: [-10, -160], thigh: 118, shin: 122, armW: 17,
      headPts: tetePts('retrousse', 1.0),
      torsoPaint: (p) => blazer(K, p, { cravate: '#7a5a2a', bouton: '#3a2a1a', pochette: '#c49a3c' }),
      headPaint: (p, f) => {
        X.earPaint(-8.5, -46);
        fillPts([[-28, -60], [-34, -44], [-30, -28], [-22, -22], [-20, -36], [-22, -54]], '#6a5a48');
        hatch([[-24, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.22);
        oeil(f, 19, -55, C.peau, p.regard); X.brow(f, 19, -63, '#5a4a3a', 2.8); X.mouth(f, 28, -25);
        pc([[16, -18], [24, -14], [28, -6], [24, 6], [18, 14], [12, 2], [12, -10]], C.poil, () => strokePts([[18, -12], [20, 8]], 'rgba(40,30,20,0.4)', 1), K.seed + 9, { drop: false });
      },
      extra: { casquette: { parent: 'head', at: [0, -78], noRivet: true, base: '#6e6250', seed: 2251, pts: [[-36, 10], [-34, -8], [-20, -20], [6, -24], [30, -18], [46, -8], [60, -2], [62, 3], [40, 5], [26, 3], [-30, 12]], paint: () => {
        for (let x = -36; x < 60; x += 7) strokePts([[x, -26], [x + 4, 12]], 'rgba(40,32,24,0.35)', 0.9);
        for (let y = -20; y < 12; y += 7) strokePts([[-36, y], [62, y]], 'rgba(200,180,140,0.25)', 0.9);
        strokePts([[26, 3], [62, 1]], 'rgba(20,16,10,0.6)', 1.6); dot(2, -23, 2.6, '#5a5040');
      } } }, orderHead: ['casquette'],
    });
    return mkHumain(K);
  }
  for (const qui of ['chef', 'b', 'c']) CH['pap2Off_' + qui] = mkOfficiel(qui);
  // assis 0..1 (cuisses horizontales ; assise à ≈ 108 au-dessus du sol)
  function assisQ(def, q, k) {
    if (!(k > 0)) return; const a = 1.5 * k;
    q.ang.legF_up = (q.ang.legF_up || 0) - a; q.ang.legB_up = (q.ang.legB_up || 0) - a * 0.96;
    q.ang.legF_lo = (q.ang.legF_lo || 0) + a; q.ang.legB_lo = (q.ang.legB_lo || 0) + a * 0.96;
    q.dy += def.thigh * (1 - Math.cos(a));
  }
  const OREST = { armF_up: -0.08, armF_lo: -0.22, armB_up: 0.04, armB_lo: -0.2, head: 0 };
  PAP2.officielPose = function (p, x, y, s, dir) {
    p = p || {}; const qui = p.qui || 'chef', def = CH['pap2Off_' + qui];
    const q = prep(p), A = q.ang; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, OREST);
    const t = q.t || 0, g = tg(t);
    const ch = gE(q, 'chrono'), li = gE(q, 'lit'), fe = gE(q, 'feuillette'), ha = gE(q, 'haussement'), he = gE(q, 'hesite'), dz = gE(q, 'dort'), ta = gE(q, 'tampon'), as = gE(q, 'assis');
    if (li > 0 && q.tenu == null) { q.tenu = 'reglement'; if (q.deuxMains == null) q.deuxMains = true; }
    if (fe > 0) q._bDevant = true;
    if (fe > 0 && q.tenuB == null) { q.tenuB = 'reglement'; q.tenuBO = Object.assign({ prise: 'g' }, q.tenuBO); if (q.tenuBO.page == null) q.tenuBO.page = q.page != null ? q.page : frac(g * 0.55); }
    if (ta > 0) { q._bDevant = true; if (q.tenu == null) q.tenu = 'tampon'; if (q.tenuB == null) { q.tenuB = 'reglement'; q.tenuBO = Object.assign({ aPlat: 1 }, q.tenuBO); q._paume = true; q.handB = 'open'; } }
    if (ch > 0 && q.tenu == null) q.tenu = 'chrono';
    assisQ(def, q, as);
    q.dy += Math.sin(g * (dz > 0 ? 0.9 : 1.6)) * (dz > 0 ? 1.8 : 1.1);
    autoTenu(q);
    if (as > 0) {                                                  // mains sur les genoux
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'legF_up', [16, def.thigh - 30]), as * (has(q.tenu) || he > 0 || ch > 0 ? 0 : 1));
      reach(def, q, x, y, s, dir, 'armB', locPt(def, q, x, y, s, dir, 'legB_up', [12, def.thigh - 50]), as * (has(q.tenuB) || q.deuxMains ? 0 : 1));
    }
    if (li > 0) {
      A.head += 0.24 * li; faceSet(q, { brow: 'frown', mouth: 'tight' }); if (q.regard == null) q.regard = 'bas';
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 122, 178), li);
    }
    if (fe > 0) {
      A.head += 0.22 * fe; faceSet(q, { brow: 'worry', mouth: 'tight' }); if (q.regard == null) q.regard = 'bas';
      reach(def, q, x, y, s, dir, 'armB', shPt(def, q, x, y, s, dir, -6, 168), fe);
      applyDroit(def, q);
      const u = clamp(q.tenuBO.page), tip = objPt(def, q, x, y, s, dir, 'armB', [RG.pw * Math.cos(PI * u) * 0.92 - 0, 36 - 10 * Math.sin(PI * u)], true);
      q.handF = 'open'; reach(def, q, x, y, s, dir, 'armF', tip, fe);
    }
    if (ta > 0) {
      A.head += 0.26 * ta; faceSet(q, { brow: 'frown', mouth: 'tight' }); if (q.regard == null) q.regard = 'bas';
      reach(def, q, x, y, s, dir, 'armB', shPt(def, q, x, y, s, dir, 118, 150), ta);
      applyDroit(def, q);
      const cp = q.coup != null ? clamp(q.coup) : frac(g * 1.1);
      const lift = cp < 0.55 ? lerp(70, 0, Math.pow(cp / 0.55, 2.2)) : lerp(0, 70, ease((cp - 0.55) / 0.45));
      q._frappe = lift < 4 ? 1 : 0;
      const top = objPt(def, q, x, y, s, dir, 'armB', [20, -74 * 0.34], true);
      reach(def, q, x, y, s, dir, 'armF', [top[0], top[1] - (lift + 2) * s], ta, 'base');
    }
    if (ch > 0) {
      A.head += 0.1 * ch; faceSet(q, { brow: 'frown', mouth: 'tight' });
      reach(def, q, x, y, s, dir, 'armF', shPt(def, q, x, y, s, dir, 104, -30), ch, 'centre');
      if (q.regard == null) q.regard = 'bas';
    }
    if (ha > 0) {
      A.armF_up = lerp(A.armF_up, -0.05, ha); A.armF_lo = lerp(A.armF_lo, -1.55, ha); A.armB_up = lerp(A.armB_up, 0.05, ha); A.armB_lo = lerp(A.armB_lo, -1.6, ha);
      A.head += 0.14 * ha; q.dy -= 4 * ha; q.handF = 'open'; q.handB = 'open'; faceSet(q, { brow: 'up', mouth: 'tight' });
    }
    if (he > 0) {
      faceSet(q, { brow: 'worry', mouth: 'tight' }); if (q.regard == null) q.regard = 'haut'; A.head -= 0.08 * he;
      q.handF = 'fist'; reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'head', [26, -2]), he, null, 1);
    }
    if (dz > 0) { A.head += 0.5 * dz; q.tilt += 0.03 * dz; faceSet(q, { eyes: 'closed', mouth: 'o', brow: 'n' }); }
    return finishQ(def, q, x, y, s, dir);
  };
  PAP2.officiel = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s; o = o || {}; const dir = o.dir || 1, qui = (pose && pose.qui) || 'chef', def = CH['pap2Off_' + qui];
    if (pose && pose.assis > 0 && pose.chaise !== false) PAP2.chaise(x - 6 * s * dir, y, s, { dir, toile: pose.toile, cast: o.cast });
    return run(def, PAP2.officielPose(pose, x, y, s, dir), x, y, s, o, 'officiel ' + qui);
  };

  // =====================================================================
  // 5) LA GRENOUILLE (carton vert éteint, ventre ivoire, yeux dorés) — def.libre : animal ; (x, y) = sous le séant
  // =====================================================================
  const GV = '#5f7a4a', GVD = '#4a6038', GVL = '#7a9460', GIV = '#e6dcc0', GOR = '#d0a43e';
  function mkGrenouille() {
    const eye = (far) => ({ parent: 'tete', at: far ? [2, -40] : [20, -38], noRivet: true, base: far ? GVD : GV, seed: far ? 3011 : 3012,
      pts: (p) => ell(0, -6, 16 * (p._exo || 1), 15 * (p._exo || 1), 16), paint: (p) => {
        const k = p._exo || 1, f = p.face || {};
        if (f.eyes === 'closed') { strokePts([[-12 * k, -4], [0, 0], [12 * k, -4]], 'rgba(30,40,20,0.85)', 2); strokePts([[-13 * k, -8], [13 * k, -8]], 'rgba(255,255,255,0.2)', 1.4); return; }
        fillPts(ell(0, -7, 11.5 * k, 11 * k, 16), far ? '#b08a34' : GOR);
        const px = p.regard === 'haut' ? 1 : p.regard === 'arriere' ? -4 : 3, py = p.regard === 'haut' ? -5 : p.regard === 'bas' ? 2 : 0;
        fillPts(ell(px * k, -7 + py, (k > 1.1 ? 4 : 6.5), (k > 1.1 ? 3.6 : 3.2), 12), '#1a140c');
        dot(-4 * k, -12 * k, 2.4, 'rgba(255,255,255,0.85)');
        if (f.eyes === 'half') fillPts([[-18, -24], [18, -24], [18, -8], [-18, -8]], far ? GVD : GV);
      } });
    const parts = {
      corps: { parent: null, at: [0, 0], base: GV, seed: 3001, pts: [[-38, 4], [-47, -24], [-45, -62], [-31, -92], [-6, -108], [20, -104], [36, -84], [43, -52], [39, -18], [24, 6]], paint: () => {
        fillPts([[12, -96], [32, -82], [41, -52], [36, -18], [22, 4], [6, -8], [2, -50]], GIV);
        for (const [x, y, r] of [[-30, -60, 6], [-18, -84, 4.5], [-36, -30, 5], [-14, -40, 3.5]]) dot(x, y, r, GVD);
        hatch([[-50, -100], [-10, -100], [-10, 10], [-50, 10]], 0.8, 4.2, 0.24); shade(40, -50, -44, -50, 0.22, [-60, -120, 60, 20]);
      } },
      tete: { parent: 'corps', at: [14, -96], noRivet: true, base: GV, seed: 3002, pts: [[-42, 4], [-40, -22], [-26, -40], [-2, -48], [26, -46], [50, -36], [62, -22], [64, -8], [54, 2], [28, 8], [-10, 10]], paint: (p) => {
        const f = p.face || {};
        fillPts([[30, 0], [54, 0], [60, -6], [40, 6], [20, 8]], GIV);
        dot(56, -28, 2, '#2a3418');
        if (f.mouth === 'o') { fillPts(ell(50, -6, 9, 8, 14), '#3a1a14'); fillPts(ell(50, -3, 5, 3.5, 10), '#a0484a'); }
        else if (f.mouth === 'down') strokePts([[63, -10], [44, -10], [20, -6], [6, 0]], 'rgba(30,36,16,0.85)', 2.2);
        else if (f.mouth === 'smile') strokePts([[63, -14], [50, -8], [28, -6], [10, -10], [4, -16]], 'rgba(30,36,16,0.85)', 2.2);
        else strokePts([[63, -12], [46, -8], [24, -6], [6, -8]], 'rgba(30,36,16,0.85)', 2);
        dot(10, -18, 7, 'rgba(200,120,90,0.18)');
        hatch([[-44, -40], [-10, -40], [-10, 10], [-44, 10]], 0.7, 4, 0.22);
      } },
      oeilB: eye(true), oeilF: eye(false),
      armB_up: { parent: 'corps', at: [12, -44], base: GVD, seed: 3021, pts: armR(36, 9, 7), paint: () => hatch(null, 0.8, 3.5, 0.3) },
      armB_lo: { parent: 'armB_up', at: [0, 36], base: GVD, seed: 3022, pts: [[-7, 0], [7, 0], [7, 26], [18, 33], [13, 38], [6, 34], [6, 42], [-1, 42], [-2, 34], [-9, 38], [-12, 32], [-7, 27]] },
      armF_up: { parent: 'corps', at: [24, -46], base: GV, seed: 3023, pts: armR(36, 9, 7), paint: () => hatch(null, 0.8, 3.5, 0.2) },
      armF_lo: { parent: 'armF_up', at: [0, 36], base: GV, seed: 3024, pts: [[-7, 0], [7, 0], [7, 26], [18, 33], [13, 38], [6, 34], [6, 42], [-1, 42], [-2, 34], [-9, 38], [-12, 32], [-7, 27]], paint: () => fillPts([[-8, 26], [8, 26], [8, 42], [-8, 42]], GVL) },
      legB_up: { parent: 'corps', at: [-24, -18], base: GVD, seed: 3031, pts: [[-14, -10], [10, -18], [40, -16], [58, -10], [62, 0], [54, 8], [20, 12], [-10, 10]], paint: () => hatch(null, 0.6, 3.5, 0.3) },
      legB_lo: { parent: 'legB_up', at: [54, -2], base: GVD, seed: 3032, pts: [[6, -8], [0, -10], [-30, -2], [-52, 4], [-56, 10], [-48, 14], [-20, 10], [4, 8], [10, 0]] },
      legB_pied: { parent: 'legB_lo', at: [-50, 10], base: GVD, seed: 3033, noRivet: true, pts: [[-4, -4], [30, -2], [54, 0], [64, -4], [66, 2], [58, 6], [62, 10], [52, 12], [30, 10], [-2, 6]] },
      legF_up: { parent: 'corps', at: [-16, -14], base: GV, seed: 3034, pts: [[-14, -10], [10, -18], [40, -16], [58, -10], [62, 0], [54, 8], [20, 12], [-10, 10]], paint: () => { for (const [x, y] of [[14, -8], [36, -6]]) dot(x, y, 3.5, GVD); hatch(null, 0.6, 3.5, 0.18); } },
      legF_lo: { parent: 'legF_up', at: [54, -2], base: GV, seed: 3035, pts: [[6, -8], [0, -10], [-30, -2], [-52, 4], [-56, 10], [-48, 14], [-20, 10], [4, 8], [10, 0]] },
      legF_pied: { parent: 'legF_lo', at: [-50, 10], base: GV, seed: 3036, noRivet: true, pts: [[-4, -4], [30, -2], [54, 0], [64, -4], [66, 2], [58, 6], [62, 10], [52, 12], [30, 10], [-2, 6]], paint: () => fillPts([[30, -2], [66, -4], [66, 12], [30, 12]], GVL) },
      bulle: { parent: 'tete', at: [60, -24], noRivet: true, base: '#000', seed: 3040, pts: OFFP, extra: (p) => {
        if (SIL() || !(p._dort > 0)) return; const u = 0.5 + 0.5 * Math.sin(tg(p.t) * 1.6), r = (10 + 22 * u) * p._dort, c = cx_();
        c.save(); c.beginPath(); c.arc(8 + r * 0.8, -4 - r * 0.6, r, 0, TAU); c.fillStyle = 'rgba(220,240,245,0.35)'; c.fill(); c.strokeStyle = 'rgba(250,252,255,0.85)'; c.lineWidth = 1.6 * M._lw(); c.stroke();
        c.beginPath(); c.arc(8 + r * 0.5, -4 - r * 0.9, r * 0.3, PI, PI * 1.5); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke(); c.restore();
      } },
    };
    return { hipY: -14, handLen: 40, nom: 'grenouille', rod: { part: 'corps', at: [-22, -30] }, libre: { armF: 1, armB: 1, legF: 1, legB: 1 }, parts,
      order: ['armB_up', 'armB_lo', 'legB_up', 'legB_lo', 'legB_pied', 'oeilB', 'corps', 'tete', 'oeilF', 'bulle', 'legF_lo', 'legF_pied', 'legF_up', 'armF_up', 'armF_lo'] };
  }
  CH.pap2Grenouille = mkGrenouille();
  const GREST = { armF_up: -0.25, armF_lo: -0.1, armB_up: -0.15, armB_lo: -0.1, tete: 0, legF_up: 0, legF_lo: 0, legB_up: 0, legB_lo: 0 };
  PAP2.grenouillePose = function (p) {
    p = p || {}; const q = prep(Object.assign({}, p, { ang: {} })), user = p.ang || {}, A = q.ang; Object.assign(A, GREST);
    const g = tg(q.t), W = {}; for (const n of ['fiere', 'brasse', 'stupeur', 'dort', 'boude', 'regardeHaut']) W[n] = gE(q, n);
    q.dy += Math.sin(g * 1.9) * 1.2;
    if (W.fiere > 0) { mixTo(q, { tilt: -0.14, ang: { tete: -0.22, armF_up: -0.35, armF_lo: 1.2, armB_up: -0.2, armB_lo: 1.1 } }, W.fiere); faceSet(q, { mouth: 'smile', eyes: 'half' }); }
    if (W.brasse > 0) {
      const u = frac(q.phase != null ? q.phase : g * 0.7);
      const aA = keyf([[0, -0.4], [0.3, -1.75], [0.55, -1.0], [0.75, -0.15], [1, -0.4]], u), aL = keyf([[0, -1.6], [0.3, -0.05], [0.55, -0.4], [0.75, -1.9], [1, -1.6]], u);
      const kick = keyf([[0, 0], [0.45, 0], [0.62, 1], [0.85, 0.3], [1, 0]], u);
      mixTo(q, { dy: -22 * kick - 6, tilt: 0.1 * kick, ang: { armF_up: aA, armF_lo: aL, armB_up: aA + 0.12, armB_lo: aL, legF_up: 1.1 * kick, legF_lo: -1.0 * kick, legB_up: 1.0 * kick, legB_lo: -0.9 * kick, tete: -0.12 } }, W.brasse);
      faceSet(q, { mouth: 'smile', eyes: 'half' });
    }
    if (W.stupeur > 0) { mixTo(q, { tilt: -0.1, dx: -6, ang: { tete: -0.2, armF_up: -1.3, armF_lo: -0.4, armB_up: -1.1, armB_lo: -0.5 } }, W.stupeur); q._exo = lerp(1, 1.35, W.stupeur); faceSet(q, { mouth: 'o' }); }
    if (W.dort > 0) { mixTo(q, { tilt: 0.06, ang: { tete: 0.28 } }, W.dort); q._dort = W.dort; faceSet(q, { eyes: 'closed', mouth: 'n' }); q.dy += Math.sin(g * 1.6) * 2; }
    if (W.boude > 0) { mixTo(q, { tilt: 0.08, ang: { tete: 0.3, armF_up: -0.05, armB_up: 0.05 } }, W.boude); faceSet(q, { mouth: 'down', eyes: 'half' }); if (q.regard == null) q.regard = 'bas'; }
    if (W.regardeHaut > 0) { mixTo(q, { tilt: -0.08, ang: { tete: -0.5 } }, W.regardeHaut); if (q.regard == null) q.regard = 'haut'; faceSet(q, { mouth: q.face.mouth || 'n' }); }
    for (const k in user) A[k] = (A[k] || 0) + user[k];
    return q;
  };
  PAP2.grenouille = (pose, x, y, s, o) => {
    s = s == null ? 0.85 : s; o = o || {}; pose = pose || {};
    const bo = pose.bouee, g = tg(pose.t), bob = bo ? 3 * Math.sin(g * 1.4) : 0;
    if (bo) PAP2.bouee(x, y + bob, s * 1.1, { couche: true, moitie: 'arriere', epoque: bo === true ? 'moderne' : bo });
    const r = M.puppet(CH.pap2Grenouille, PAP2.grenouillePose(pose), x, y + bob - (bo ? 8 * s : 0), s, Object.assign({ slot: bo ? EAU.bas : M.ST.slotF, nom: 'grenouille', floorShadow: !bo }, o));
    if (bo) PAP2.bouee(x, y + bob, s * 1.1, { couche: true, moitie: 'avant', epoque: bo === true ? 'moderne' : bo });
    r.tete = r.w('tete', 10, -60); r.q = pose; return r;
  };

  // =====================================================================
  // 6) ACCESSOIRES SEULS (sans tige) : règlement, chrono, tampon, bouée, chaise de jury
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, draw, base, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const oo = Object.assign({ t: o.t || 0 }, o);
    const def = accDef(name, (q) => { const c = cx_(), b = typeof base === 'function' ? base(q) : base; c.save(); c.translate(-b[0], -b[1]); draw(q); c.restore(); });
    return M.puppet(def, { o: oo, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha, nom: name });
  }
  // règlement : (x, y) = bas du livre ; o.centre → (x, y) = centre
  PAP2.reglement = (x, y, s, o) => { o = o || {}; return acc('reglement', drawReglement, o.centre ? [0, 0] : [0, 74], x, y, s == null ? 1 : s, o); };
  PAP2.chrono = (x, y, s, o) => acc('chrono', drawChrono, [0, 0], x, y, s, o);
  PAP2.tampon = (x, y, s, o) => acc('tampon', drawTampon, [0, 6], x, y, s, o);
  PAP2.reglementPt = function (nom, x, y, s, o) { o = o || {}; s = s == null ? 1 : s; const q = ptOf(OBJ.reglement, nom, o); if (!q) return null; const b = o.centre ? [0, 0] : [0, 74], d = o.dir || 1; return [x + (q[0] - b[0]) * s * d, y + (q[1] - b[1]) * s]; };
  const BOUEE_COL = { moderne: ['#d8d4c8', '#c9772e'], '1930': ['#e8e0c8', '#9a2a24'], '1936': ['#e8e0c8', '#9a2a24'] };
  function drawBouee(o) {
    const cols = BOUEE_COL[o.epoque] || BOUEE_COL['1930'];
    if (!o.couche) {                                            // debout (accrochée, posée contre un mur) : anneau vu de face
      const R = 40, r = 22;
      pc(ell(0, 0, R, R, 28).concat(ell(0, 0, r, r, 20).reverse()), cols[0], () => { for (let i = 0; i < 4; i++) { const a = i * PI / 2 + 0.4; fillPts([[Math.cos(a) * 18, Math.sin(a) * 18], [Math.cos(a) * 44, Math.sin(a) * 44], [Math.cos(a + 0.55) * 44, Math.sin(a + 0.55) * 44], [Math.cos(a + 0.55) * 18, Math.sin(a + 0.55) * 18]], cols[1]); } strokePts(ep(0, 0, 33, 33, 10, PI * 1.1, PI * 1.5), 'rgba(255,255,255,0.4)', 2); }, 7401);
      strokePts(ep(0, 0, 31, 31, 24, 0, TAU), 'rgba(80,60,40,0.55)', 1.2);
      return;
    }
    const R = 62, Ry = 15, th = 13, cA = o.moitie === 'avant' ? [0, PI] : o.moitie === 'arriere' ? [PI, TAU] : [0, TAU];
    const outer = ep(0, 0, R, Ry, 20, cA[0], cA[1]), inner = ep(0, -3, R - 24, Ry - 7, 16, cA[1], cA[0]);
    pc(outer.concat(tr(outer.slice().reverse(), 0, -th).slice(0, 0), inner), cols[0], () => {
      for (let i = 0; i < 8; i++) { const a0 = i * PI / 4 + 0.3, a1 = a0 + 0.35; fillPts(ep(0, 0, R + 4, Ry + 6, 4, a0, a1).concat(ep(0, -3, R - 26, Ry - 9, 4, a1, a0)), cols[1]); }
      strokePts(ep(0, -4, R - 8, Ry - 3, 14, PI * 1.1, PI * 1.6), 'rgba(255,255,255,0.45)', 2);
    }, 7402 + (o.moitie === 'avant' ? 1 : 0));
  }
  PAP2.bouee = (x, y, s, o) => acc('bouee', drawBouee, [0, 0], x, y, s, o);
  // chaise de jury (bois, dossier haut) ; (x, y) = sol ; o.toile 0..1 = toile d'araignée (gag 1952)
  function drawChaise(o) {
    pc(rect(-40, -116, 40, -104), '#7a5232', () => strokePts([[-38, -113], [38, -113]], 'rgba(255,230,190,0.35)', 1.4), 7501);
    for (const x of [-36, 30]) pc(rect(x, -106, x + 7, 0), '#5e3e24', null, 7502 + x);
    pc(rect(-44, -250, -34, -104), '#6a4628', null, 7505);
    pc(rect(-44, -250, -30, -226), '#6a4628', null, 7506);
    for (const y of [-220, -186, -152]) pc(rect(-42, y, -32, y + 10), '#7a5232', null, 7507 + y);
    const k = clamp(o.toile || 0);
    if (k > 0 && !SIL()) {
      const c = cx_(), cxp = -38, cyp = -104, R = 46 * k; c.save(); c.globalAlpha = 0.75 * k; c.strokeStyle = 'rgba(245,245,240,0.9)'; c.lineWidth = 1;
      for (let i = 0; i <= 6; i++) { const a = -PI / 2 + i * PI / 12; c.beginPath(); c.moveTo(cxp, cyp); c.lineTo(cxp + Math.cos(a) * R * 1.6, cyp + Math.sin(a) * R); c.stroke(); }
      for (let j = 1; j <= 4; j++) { c.beginPath(); for (let i = 0; i <= 6; i++) { const a = -PI / 2 + i * PI / 12, rr = R * j / 4; c.lineTo(cxp + Math.cos(a) * rr * 1.6, cyp + Math.sin(a) * rr - 2 * Math.sin(i)); } c.stroke(); }
      c.restore();
    }
  }
  PAP2.chaise = (x, y, s, o) => acc('chaise', drawChaise, [0, 0], x, y, s, o);

  // =====================================================================
  // 7) L'EAU : arrière (fond du bassin, plage), bandes par couloir (dessinées APRÈS les nageurs du couloir), lignes de nage, éclaboussures
  // =====================================================================
  const EAU = { loin: 1112, fond: 1150, milieu: 1248, devant: 1345, bas: 1492 };
  const ECH = { fond: 0.8, milieu: 0.9, devant: 1.0 };
  PAP2.EAU = EAU; PAP2.ECH = ECH;
  const COUCHES = ['arriere', 'fond', 'milieu', 'devant'], TOPS = { arriere: EAU.loin, fond: EAU.fond, milieu: EAU.milieu, devant: EAU.devant };
  const LIGNES = [1128, 1211, 1308, 1405];
  const COUL = { arriere: ['#355e68', '#2f5660'], fond: ['#41707a', '#365f69'], milieu: ['#4a7a82', '#3a6670'], devant: ['#4f7f86', '#3a6670'] };
  function vague(x, Y, g, k) { return Y + 3.6 * Math.sin(x * 0.028 + g * 1.7 + k) + 1.8 * Math.sin(x * 0.067 - g * 2.5 + k * 2); }
  function ligneNage(t, y, x0, x1, ep2) {
    const g = tg(t), c = cx_(), moderne = ep2 === 'moderne';
    if (!SIL()) { c.strokeStyle = 'rgba(30,30,30,0.6)'; c.lineWidth = 1.4; c.beginPath(); for (let x = x0; x <= x1; x += 20) { const yy = y + 1.5 * Math.sin(g * 1.6 + x * 0.02); x === x0 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
    const stp = moderne ? 15 : 22;
    for (let x = x0 + 6, i = 0; x < x1; x += stp, i++) {
      const yy = y + 1.5 * Math.sin(g * 1.6 + x * 0.02);
      let col;
      if (moderne) col = Math.floor(i / 4) % 2 ? '#c9a83a' : '#3d5a80';
      else col = Math.floor(i / 3) % 2 ? '#e8e0c8' : '#9a2a24';
      if (SIL()) continue;
      c.fillStyle = 'rgba(20,14,10,0.5)'; c.beginPath(); c.ellipse(x + 1.5, yy + 2, moderne ? 6.5 : 10, moderne ? 8 : 7, 0, 0, TAU); c.fill();
      c.fillStyle = col; c.beginPath(); c.ellipse(x, yy, moderne ? 6 : 9.5, moderne ? 7.5 : 6.5, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x - 2, yy - 2.5, moderne ? 2.4 : 4, 1.6, 0, 0, TAU); c.fill();
      if (!moderne) { c.strokeStyle = 'rgba(60,40,20,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 5, yy - 5); c.lineTo(x - 5, yy + 5); c.moveTo(x + 4, yy - 5); c.lineTo(x + 4, yy + 5); c.stroke(); }
    }
  }
  function margelle(x, y0, y1, ep2) {                         // bord vertical du bassin (fin de bassin)
    const col = ep2 === 'moderne' ? '#e6ecee' : ep2 === '1936' || ep2 === '1952' ? '#cbbd9e' : '#ece6d8';
    pc(rect(x - 9, y0 - 6, x + 9, y1), col, () => { for (let y = y0; y < y1; y += 18) strokePts([[x - 9, y], [x + 9, y]], 'rgba(80,80,90,0.35)', 1); strokePts([[x - 6, y0], [x - 6, y1]], 'rgba(255,255,255,0.6)', 1.6); }, 7601 + Math.round(y0), { drop: false });
  }
  // o : couche 'arriere'|'fond'|'milieu'|'devant' ; epoque 'moderne'|'1930'|'1936'|'1952' ; x0, x1 (bords du bassin, plage au-delà) ; couloirs [y…] (lignes) ; lignes:false ; sillages [r…]
  PAP2.eau = function (t, o) {
    o = o || {}; const c = cx_(), g = tg(t), cou = o.couche || 'arriere', ep2 = o.epoque || 'moderne';
    const x0 = o.x0 != null ? o.x0 : 30, x1 = o.x1 != null ? o.x1 : 1050, i = COUCHES.indexOf(cou), Y = TOPS[cou], Yn = i < 3 ? TOPS[COUCHES[i + 1]] : EAU.bas + 40;
    const up = o.up || 0; c.save(); c.translate(0, -up);
    if (cou === 'arriere') {
      // plages (au-delà de x0 / x1) puis fond du bassin
      const plage = ep2 === 'moderne' ? '#d9e2e4' : ep2 === '1930' ? '#e4ddcc' : '#c9bb9a';
      if (!SIL()) for (const [a, b] of [[0, x0], [x1, 1080]]) if (b - a > 2) {
        c.fillStyle = plage; c.fillRect(a, EAU.loin - 8, b - a, EAU.bas - EAU.loin + 160);
        c.strokeStyle = 'rgba(90,90,100,0.25)'; c.lineWidth = 1; for (let y = EAU.loin + 10; y < EAU.bas + 150; y += 34) { c.beginPath(); c.moveTo(a, y); c.lineTo(b, y); c.stroke(); }
        for (let x = a + 10; x < b; x += 40) { c.beginPath(); c.moveTo(x, EAU.loin); c.lineTo(x + (x - 540) * 0.25, EAU.bas + 150); c.stroke(); }
      }
      if (!SIL()) {
        const gr = c.createLinearGradient(0, EAU.loin, 0, EAU.bas); gr.addColorStop(0, '#2e5761'); gr.addColorStop(1, '#3f6f78');
        c.fillStyle = gr; c.fillRect(x0, EAU.loin - 2, x1 - x0, EAU.bas - EAU.loin + 40);
        c.fillStyle = ep2 === 'moderne' ? '#e8eef0' : ep2 === '1930' ? '#efe9dc' : '#d6c9aa'; c.fillRect(x0, EAU.loin - 10, x1 - x0, 10);       // margelle du fond
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x0, EAU.loin, x1 - x0, 4);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 18; k++) { const yy = EAU.loin + 8 + 30 * hash(k * 3.1), xx = x0 + frac(hash(k * 1.7) + g * 0.012 * (k % 2 ? 1 : -1)) * (x1 - x0); c.fillStyle = 'rgba(200,230,230,0.12)'; c.fillRect(xx, yy, 24 + 30 * hash(k), 2); }
        c.restore();
      }
    } else {
      const P = []; for (let x = x0; x <= x1 + 1; x += 18) P.push([Math.min(x, x1), vague(x, Y, g, i * 1.3)]);
      P.push([x1, EAU.bas + 40, 1], [x0, EAU.bas + 40, 1]);
      const C2 = COUL[cou];
      pc(P, C2[0], () => {
        gradL(0, Y, 0, EAU.bas, [[0, C2[0]], [1, C2[1]]], [x0 - 10, Y - 10, x1 + 10, EAU.bas + 60]);
        if (!SIL()) {
          c.save(); c.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 14; k++) { const yy = Y + 10 + (Yn - Y - 20) * hash(k * 2.3 + i), xx = x0 + frac(hash(k * 5.1 + i) + g * 0.015 * (k % 2 ? 1 : -1)) * (x1 - x0); c.fillStyle = 'rgba(235,230,210,0.16)'; c.fillRect(xx, yy, 18 + 26 * hash(k + i), 2.2); }
          c.restore();
          const L = []; for (let x = x0; x <= x1; x += 18) L.push([x, vague(x, Y, g, i * 1.3) + 1]); strokePts(L, 'rgba(240,236,222,0.75)', 2.4);
        }
      }, 7700 + i, { texA: 0.35 });
      if (cou === 'devant') {                                   // margelle avant du bassin
        pc(rect(x0 - 4, EAU.bas - 6, x1 + 4, EAU.bas + 10), ep2 === 'moderne' ? '#e6ecee' : ep2 === '1930' ? '#ece6d8' : '#cbbd9e', () => { for (let x = x0; x < x1; x += 46) strokePts([[x, EAU.bas - 6], [x, EAU.bas + 10]], 'rgba(80,80,90,0.3)', 1); strokePts([[x0, EAU.bas - 3], [x1, EAU.bas - 3]], 'rgba(255,255,255,0.6)', 1.6); }, 7710);
      }
      if (x1 < 1040) margelle(x1, Y, cou === 'devant' ? EAU.bas + 10 : Yn, ep2);
      if (x0 > 40) margelle(x0, Y, cou === 'devant' ? EAU.bas + 10 : Yn, ep2);
    }
    if (o.lignes !== false) for (const ly of (o.couloirs || LIGNES)) if (ly > Y + 6 && ly < Yn - 4) ligneNage(t, ly, x0 + 4, x1 - 4, ep2);
    if (o.sillages) for (const r of o.sillages) if (r) PAP2.sillage(r, t);
    c.restore();
  };
  // éclaboussure de gouttes de papier lancée à t0 depuis (x, y) ; o : s, n, haut, dir (biais horizontal), seed, dur
  PAP2.eclabousse = function (t, x, y, t0, o) {
    o = o || {}; const u = t - t0, dur = o.dur || 0.95; if (u < 0 || u > dur || SIL()) return;
    const c = cx_(), s = o.s || 1, n = o.n || 12, sd = o.seed || 7, G = 1500 * s, haut = o.haut || 1, bias = (o.dir || 0) * 90;
    c.save();
    const k = u / dur;
    c.strokeStyle = `rgba(240,240,230,${0.8 * (1 - k)})`; c.lineWidth = 2.2; c.beginPath(); c.ellipse(x, y, (20 + 70 * k) * s, (5 + 10 * k) * s, 0, PI, TAU); c.stroke();
    for (let i = 0; i < n; i++) {
      const vx = ((hash(sd + i * 1.7) - 0.5) * 320 + bias) * s, vy = -(260 + 300 * hash(sd + i * 2.9)) * s * haut, r = (3 + 4 * hash(sd + i * 4.1)) * s;
      const px = x + vx * u, py = y + vy * u + 0.5 * G * u * u; if (py > y + 6) continue;
      const a = Math.atan2(vy + G * u, vx);
      c.save(); c.translate(px, py); c.rotate(a - PI / 2);
      c.beginPath(); c.moveTo(0, -r * 2.2); c.quadraticCurveTo(r * 1.1, 0, 0, r); c.quadraticCurveTo(-r * 1.1, 0, 0, -r * 2.2); c.closePath();
      c.fillStyle = i % 3 ? 'rgba(170,210,215,0.95)' : 'rgba(240,238,226,0.95)'; c.fill(); c.strokeStyle = 'rgba(40,70,80,0.6)'; c.lineWidth = 1; c.stroke();
      c.restore();
    }
    c.restore();
  };
  // écume autour de la taille d'un nageur + gerbes aux mains qui traversent la surface (à dessiner après sa bande d'eau)
  PAP2.sillage = function (r, t) {
    if (!r || SIL() || r.surf == null) return;
    const c = cx_(), g = tg(t), s = r.s || 0.9, Y = r.surf;
    const A = r.w('torso', 0, 0), B = r.w('torso', 0, -150);
    let xb = A[0]; if (Math.abs(B[1] - A[1]) > 1) { const k = (Y - A[1]) / (B[1] - A[1]); xb = A[0] + (B[0] - A[0]) * k; }
    c.save();
    for (let i = 0; i < 7; i++) { const a = i / 7, xx = xb + (a - 0.5) * 110 * s + 4 * Math.sin(g * 3 + i), rr = (6 + 5 * Math.abs(Math.sin(g * 2.2 + i * 1.3))) * s; c.fillStyle = 'rgba(240,238,228,0.7)'; c.beginPath(); c.ellipse(xx, Y + 2, rr * 1.6, rr * 0.6, 0, 0, TAU); c.fill(); }
    for (const H of [r.main, r.mainB]) {
      if (!H) continue; const d = H[1] - Y;
      if (Math.abs(d) < 46 * s) { const k = 1 - Math.abs(d) / (46 * s);
        for (let j = 0; j < 6; j++) { const a = -PI * (0.15 + 0.7 * hash(j * 3.3 + Math.floor(g * 6))), rr = (12 + 30 * k * hash(j * 1.9)) * s, px = H[0] + Math.cos(a) * rr, py = Y + Math.sin(a) * rr * 1.2;
          c.fillStyle = j % 2 ? 'rgba(240,238,226,0.9)' : 'rgba(170,210,215,0.9)'; c.beginPath(); c.ellipse(px, py, 3.5 * s, 5 * s, a, 0, TAU); c.fill(); }
        c.strokeStyle = `rgba(240,238,226,${0.8 * k})`; c.lineWidth = 2; c.beginPath(); c.ellipse(H[0], Y + 1, 26 * s, 6 * s, 0, PI, TAU); c.stroke();
      }
    }
    c.restore();
  };

  // =====================================================================
  // 8) DÉCORS — toile (pré-rendu, fenêtres découpées) + animations + plan intermédiaire ; o.avant : premier plan
  // =====================================================================
  function carreaux(c, x0, y0, x1, y1, base, sz, seed) {
    c.fillStyle = shadeHex(base, 0.8); c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0; y < y1; y += sz) for (let x = x0; x < x1; x += sz) { const k = hash(x * 0.37 + y * 1.13 + seed); c.fillStyle = M.mixc(base, k > 0.5 ? '#ffffff' : shadeHex(base, 0.85), Math.abs(k - 0.5) * 0.5); c.fillRect(x + 1, y + 1, sz - 2, sz - 2); }
  }
  function briques(c, x0, y0, x1, y1, base, seed, h, w) {
    h = h || 22; w = w || 58; c.fillStyle = '#5e3e30'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0, r = 0; y < y1; y += h, r++) for (let x = x0 - (r % 2) * w / 2; x < x1; x += w) {
      const k = hash(x * 0.37 + y * 1.13 + seed), k2 = hash(x * 0.71 + y * 0.29 + seed * 3);
      c.fillStyle = M.mixc(base, k > 0.5 ? '#a0604a' : '#6e3a2c', Math.abs(k - 0.5) * 0.9); c.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      if (k2 > 0.7) { c.fillStyle = 'rgba(40,20,15,0.18)'; c.fillRect(x + 1.5, y + h * 0.55, w - 3, h * 0.45 - 1.5); }
    }
  }
  function pierres(c, x0, y0, x1, y1, seed, base) {
    c.fillStyle = shadeHex(base || '#cbbd9e', 0.78); c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0, r = 0; y < y1; y += 44, r++) for (let x = x0 - (r % 2) * 60; x < x1; x += 120) {
      const k = hash(x * 0.21 + y * 0.93 + seed); c.fillStyle = M.mixc(base || '#cbbd9e', k > 0.5 ? '#e2d7bd' : '#b6a682', Math.abs(k - 0.5) * 1.2); c.fillRect(x + 2, y + 2, 116, 40);
      c.fillStyle = 'rgba(80,60,30,0.1)'; c.fillRect(x + 2, y + 32, 116, 10);
    }
  }
  // ---- foule de gradins (silhouettes colorées, muettes) ; rows : [{y, x0, x1, pas, s}] ; o.vide 0..1 (gradins qui se vident) ; o.leve 0..1 (un spectateur se lève)
  const FOULE_COLS = ['#8e2c2c', '#3d5a80', '#c49a3c', '#5f7a4a', '#7a4a6a', '#b0603a', '#4a7a7a', '#a08a5a', '#5a5a7a', '#9a6a3a', '#6a8a4a', '#8a4a3a'];
  function foule(t, rows, o) {
    o = o || {}; const c = cx_(), g = tg(t), vide = clamp(o.vide || 0), br = o.brume || 0;
    if (SIL()) return;
    let n = 0;
    for (const R of rows) for (let x = R.x0; x < R.x1; x += R.pas, n++) {
      const h = hash(n * 7.13 + 3), xx = x + (h - 0.5) * R.pas * 0.4;
      if (hash(n * 3.31 + 9) < vide * 1.05) continue;
      const lv = o.leveIdx === n ? ease(clamp(o.leve || 0)) : 0;
      const s = R.s, y = R.y + Math.sin(g * (1.1 + h) + n) * 1.6 - lv * 26 * s;
      const col = M.mixc(FOULE_COLS[n % FOULE_COLS.length], '#c8d0d4', br), peau = M.mixc(['#e2bd98', '#c99a72', '#ebc9a8', '#b98563'][Math.floor(h * 4)], '#c8d0d4', br * 0.8);
      c.fillStyle = col; c.beginPath(); c.moveTo(xx - 15 * s, y + 40 * s); c.lineTo(xx - 13 * s, y + 6 * s); c.quadraticCurveTo(xx, y - 2 * s, xx + 13 * s, y + 6 * s); c.lineTo(xx + 15 * s, y + 40 * s); c.fill();
      c.fillStyle = peau; c.beginPath(); c.arc(xx, y - 6 * s, 8.5 * s, 0, TAU); c.fill();
      if (lv > 0) { c.strokeStyle = col; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(xx - 8 * s, y + 10 * s); c.lineTo(xx - 16 * s, y - 24 * s * lv); c.moveTo(xx + 8 * s, y + 10 * s); c.lineTo(xx + 16 * s, y - 24 * s * lv); c.stroke(); }
      const hat = o.chapeaux ? Math.floor(hash(n * 1.9) * 4) : 9;
      if (hat === 0) { c.fillStyle = M.mixc('#d8bf7a', '#c8d0d4', br); c.fillRect(xx - 12 * s, y - 13 * s, 24 * s, 3 * s); c.fillRect(xx - 7 * s, y - 20 * s, 14 * s, 7 * s); }
      else if (hat === 1) { c.fillStyle = M.mixc('#3a3430', '#c8d0d4', br); c.beginPath(); c.ellipse(xx, y - 13 * s, 12 * s, 3.5 * s, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(xx, y - 14 * s, 7.5 * s, PI, TAU); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(xx - 2.5 * s, y - 9 * s, 3 * s, 0, TAU); c.fill();
    }
  }
  // ---- fanion uni à la hampe (x, y = haut de la hampe), qui claque au vent
  function fanion(t, x, y, len, h, col, ph) {
    const g = tg(t), N = 8, T = [], B = [];
    for (let i = 0; i <= N; i++) { const u = i / N, w = Math.sin(g * 5.2 + u * 4 + ph) * (2 + 9 * u) + Math.sin(g * 9 + u * 7) * 2 * u, hh = h * (1 - 0.85 * u) / 2; T.push([x + len * u, y + h / 2 - hh + w]); B.push([x + len * u, y + h / 2 + hh + w]); }
    pc(T.concat(B.reverse()), col, () => strokePts(T.slice(0, 6).map((p) => [p[0], p[1] + 4]), 'rgba(255,255,255,0.25)', 1.4), 7800 + Math.round(x), { texA: 0.45 });
  }
  // ---- guirlande de fanions de dos (triangles alternés) entre (xa, ya) et (xb, yb)
  function guirlande(t, xa, ya, xb, yb, cols, n) {
    const g = tg(t), c = cx_(), sag = 26;
    const P = (u) => [lerp(xa, xb, u), lerp(ya, yb, u) + sag * Math.sin(PI * u) + 3 * Math.sin(g * 1.3 + u * 3)];
    if (!SIL()) { c.strokeStyle = 'rgba(40,40,40,0.7)'; c.lineWidth = 1.4; c.beginPath(); for (let i = 0; i <= 30; i++) { const p = P(i / 30); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, p = P(u), a = 0.14 * Math.sin(g * 2.6 + i * 0.9) + 0.06 * Math.sin(g * 5.1 + i), w = 30, hh = 40;
      c.save(); c.translate(p[0], p[1]); c.rotate(a);
      pc([[-w / 2, 0, 1], [w / 2, 0, 1], [0, hh, 1]], cols[i % cols.length], null, 7900 + i, { texA: 0.45, drop: false });
      c.restore();
    }
  }
  // ---- horloge-chronomètre de piscine (cadran à traits, sans chiffres)
  function horlogeRonde(t, x, y, r, o) {
    o = o || {}; const g = tg(t) + (o.dt || 0), c = cx_();
    pc(ell(x, y, r + 10, r + 10, 30), o.boite || '#2b3a48', () => strokePts(ep(x, y, r + 6, r + 6, 16, PI * 1.1, PI * 1.6), 'rgba(255,255,255,0.3)', 2), 8001 + x);
    fillPts(ell(x, y, r, r, 30), o.cadran || '#f1eee4');
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, l = i % 5 ? 0.9 : 0.78; strokePts([[x + Math.sin(a) * r * l, y - Math.cos(a) * r * l], [x + Math.sin(a) * r * 0.96, y - Math.cos(a) * r * 0.96]], '#2a2a30', i % 5 ? 0.9 : 2.4); }
    const aig = (a, L, w, col) => { const p = [[x - Math.sin(a) * L * 0.15 + Math.cos(a) * w, y + Math.cos(a) * L * 0.15 + Math.sin(a) * w], [x + Math.sin(a) * L, y - Math.cos(a) * L], [x - Math.sin(a) * L * 0.15 - Math.cos(a) * w, y + Math.cos(a) * L * 0.15 - Math.sin(a) * w]]; fillPts(p, col); };
    aig(g * TAU / 3600 * (o.vite || 1) + 1.2, r * 0.55, 4, '#22242a'); aig(g * TAU / 60 * (o.vite || 1) + 0.4, r * 0.8, 2.6, '#22242a');
    aig(g * TAU / (o.sec || 6) + 2, r * 0.9, 1.4, '#9a2a24'); dot(x, y, 3.5, '#22242a');
  }
  const K = {};
  PAP2.K = K;

  // ---------------------------------------------------------------- A. PISCINE D'AUJOURD'HUI
  const PM = { arc: { cx: 540, cy: 760, rx: 455, ry: 470 }, horloge: { x: 850, y: 600, r: 64 }, plongeoir: { x: 150 }, gradins: [{ y: 870, x0: 260, x1: 840, pas: 34, s: 0.95 }, { y: 925, x0: 240, x1: 860, pas: 34, s: 1 }, { y: 982, x0: 220, x1: 880, pas: 36, s: 1.05 }, { y: 1040, x0: 200, x1: 900, pas: 36, s: 1.1 }] };
  PAP2.PISCINE = PM;
  const pmArcPath = (c, rr) => { const A = PM.arc; c.beginPath(); c.moveTo(A.cx - A.rx * rr, A.cy); c.ellipse(A.cx, A.cy, A.rx * rr, A.ry * rr, 0, PI, TAU); c.closePath(); };
  function makePmCiel() {
    return M.pre(1080, 1400, (c) => { const g = c.createLinearGradient(0, 250, 0, 780); g.addColorStop(0, '#9fc1d8'); g.addColorStop(1, '#dde8ec'); c.fillStyle = g; c.fillRect(0, 0, 1080, 800);
      c.fillStyle = 'rgba(170,190,200,0.6)'; for (let i = 0; i < 9; i++) { const x = 60 + i * 120, h = 40 + 60 * hash(i * 2.2); c.fillRect(x, 760 - h, 70, h); } });
  }
  function makePmFond() {
    return M.pre(1080, 1400, (c) => {
      carreaux(c, 0, 0, 1080, 1400, '#a9cbd6', 30, 5);
      c.fillStyle = 'rgba(30,50,70,0.25)'; c.fillRect(0, 0, 1080, 300);
      // verrière : cadre, découpe des vitres, meneaux
      c.fillStyle = '#e8eef0'; pmArcPath(c, 1.04); c.fill();
      c.globalCompositeOperation = 'destination-out'; pmArcPath(c, 1); c.fill(); c.globalCompositeOperation = 'source-over';
      c.save(); pmArcPath(c, 1); c.clip(); c.fillStyle = 'rgba(210,235,245,0.14)'; c.fillRect(0, 0, 1080, 800);
      c.strokeStyle = '#d4dde0'; c.lineWidth = 7; const A = PM.arc;
      for (let i = 1; i < 8; i++) { const a = PI + i * PI / 8; c.beginPath(); c.moveTo(A.cx, A.cy); c.lineTo(A.cx + Math.cos(a) * A.rx * 1.1, A.cy + Math.sin(a) * A.ry * 1.1); c.stroke(); }
      c.lineWidth = 5; for (const rr of [0.35, 0.6, 0.82]) { c.beginPath(); c.ellipse(A.cx, A.cy, A.rx * rr, A.ry * rr, 0, PI, TAU); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(300 + i * 110, 420 + 40 * i % 3); c.lineTo(340 + i * 110, 380 + 40 * i % 3); c.stroke(); }
      c.restore();
      c.fillStyle = '#c9d6da'; c.fillRect(60, A.cy - 4, 960, 26); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(60, A.cy - 4, 960, 4);
      // gradins (marches) sous la verrière
      for (let i = 0; i < 4; i++) { const y = 900 + i * 57, x0 = 200 - i * 20, x1 = 880 + i * 20; c.fillStyle = i % 2 ? '#7d9aa6' : '#87a4b0'; c.fillRect(x0, y, x1 - x0, 57); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x0, y, x1 - x0, 4); c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(x0, y + 46, x1 - x0, 11); }
      c.fillStyle = '#6d8893'; c.fillRect(170, 880, 12, 250); c.fillRect(898, 880, 12, 250);
      c.fillStyle = '#e8eef0'; c.fillRect(0, 1100, 1080, 20);
    });
  }
  function makePmMilieu() {
    return M.pre(1080, 1400, (c) => {
      // plongeoir (tour de béton blanc, échelle, plate-forme et tremplin)
      pc(rect(70, 720, 150, 1112), '#dfe5e6', () => { for (let y = 740; y < 1112; y += 40) strokePts([[70, y], [150, y]], 'rgba(90,100,110,0.3)', 1); hatch(null, 0.4, 6, 0.12, 1, undefined, [70, 720, 150, 1112]); }, 8101);
      pc(rect(60, 706, 236, 724), '#c8d1d3', () => strokePts([[60, 709], [236, 709]], 'rgba(255,255,255,0.7)', 1.6), 8102);
      pc(rect(150, 890, 300, 902), '#3d5a80', () => strokePts([[152, 892], [298, 892]], 'rgba(255,255,255,0.5)', 1.4), 8103);
      for (const x of [158, 186]) pc(rect(x, 724, x + 6, 1112), '#b8c2c6', null, 8104 + x, { drop: false });
      for (let y = 750; y < 1100; y += 32) pc(rect(156, y, 192, y + 5), '#b8c2c6', null, 8110 + y, { drop: false });
      strokePts([[236, 706], [236, 660], [150, 660]], '#b8c2c6', 4);
      // plots de départ au bout du bassin (droite)
      for (let i = 0; i < 4; i++) { const x = 930 + i * 22, y = 1110 - i * 2, s2 = 0.7 + i * 0.1; pc([[x - 18 * s2, y], [x - 16 * s2, y - 40 * s2], [x + 20 * s2, y - 50 * s2], [x + 22 * s2, y]], ['#3d5a80', '#c9a83a', '#8e2c2c', '#5f7a4a'][i], () => strokePts([[x - 14 * s2, y - 42 * s2], [x + 18 * s2, y - 50 * s2]], 'rgba(255,255,255,0.5)', 1.4), 8130 + i); }
      // mâts des guirlandes et du chronomètre
      pc(rect(846, 676, 856, 1112), '#9aa6aa', null, 8140, { drop: false });
      pc(rect(980, 600, 990, 1112), '#9aa6aa', null, 8141, { drop: false });
      // projecteurs suspendus
      for (const x of [300, 540, 780]) { strokePts([[x, 150], [x, 300]], 'rgba(40,40,40,0.7)', 1.4); pc([[x - 26, 300], [x + 26, 300], [x + 34, 336], [x - 34, 336]], '#3a4248', () => fillPts([[x - 28, 330], [x + 28, 330], [x + 32, 336], [x - 32, 336]], '#f6f0d8'), 8150 + x); }
    });
  }
  // reflets d'eau qui dansent sur le mur carrelé
  function reflets(t, x0, x1, y0, y1, n, a) {
    if (SIL()) return; const c = cx_(), g = tg(t);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const bx = x0 + (x1 - x0) * frac(hash(i * 1.37) + g * 0.01 * (i % 2 ? 1 : -1)), by = y0 + (y1 - y0) * hash(i * 2.71) + 6 * Math.sin(g * 1.4 + i), w = 18 + 26 * hash(i * 4.3), k = 0.5 + 0.5 * Math.sin(g * 2.1 + i * 1.7);
      c.fillStyle = `rgba(230,250,255,${a * k})`; c.beginPath(); c.ellipse(bx, by, w, 4 + 3 * k, 0.15 * Math.sin(g + i), 0, TAU); c.fill(); }
    c.restore();
  }
  PAP2.piscineModerne = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), g = tg(t);
    c.save(); c.translate(0, -up);
    if (o.avant) { pmAvant(t, o); c.restore(); return; }
    c.drawImage(K.pmCiel, 0, 0);
    M.nuages(t, { y0: 360, y1: 600, n: 5, vit: 16, s: 0.8, seed: 21, brume: 0.1 });
    if (o.papillonLoin && M.papillons) M.papillons(t, { x: 640, y: 520, rx: 120, ry: 60, n: 1, s: 0.5 });
    c.drawImage(K.pmFond, 0, 0);
    reflets(t, 60, 1020, 790, 1100, 22, 0.16);
    foule(t, PM.gradins, { brume: 0.35, leve: o.leve, leveIdx: o.leveIdx != null ? o.leveIdx : 25 });
    c.drawImage(K.pmMilieu, 0, 0);
    if (!SIL()) { c.save(); c.globalCompositeOperation = 'lighter'; for (const [i, x] of [[0, 300], [1, 540], [2, 780]].map((p) => p)) { const a = 0.07 + 0.02 * Math.sin(g * 0.8 + i * 2); const gr = c.createLinearGradient(0, 336, 0, 1100); gr.addColorStop(0, `rgba(255,248,220,${a})`); gr.addColorStop(1, 'rgba(255,248,220,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(x - 30, 336); c.lineTo(x + 30, 336); c.lineTo(x + 170, 1100); c.lineTo(x - 170, 1100); c.closePath(); c.fill(); } c.restore(); }
    horlogeRonde(t, PM.horloge.x, PM.horloge.y, PM.horloge.r, { dt: o.horlogeDt });
    guirlande(t, 236, 660, 851, 690, ['#3d5a80', '#c9a83a', '#8e2c2c'], 14);
    guirlande(t, 851, 690, 985, 610, ['#c9a83a', '#8e2c2c', '#3d5a80'], 4);
    c.restore();
  };
  function pmAvant(t, o) {
    const c = cx_(), g = tg(t);
    // échelle chromée (à gauche, plonge dans l'eau du premier plan)
    for (const x of [150, 196]) { const P = [[x, EAU.bas + 4], [x, 1388], [x + 4, 1366], [x + 18, 1356], [x + 32, 1366], [x + 36, 1388], [x + 36, 1440]]; if (!SIL()) { strokePts(P, '#5c666c', 8); strokePts(P, '#d8e0e4', 5); strokePts(P.slice(1, 5), '#ffffff', 1.6); } }
    for (const y of [1420, 1460]) pc(rect(150, y, 232, y + 6), '#c9d2d6', null, 8201 + y, { drop: false });
    // serviettes pliées sur un banc (droite, plage avant) ; o.serviette 0..1 : celle du haut glisse et tombe
    pc(rect(860, 1500, 1010, 1514), '#8a6a4a', null, 8210); for (const x of [870, 996]) pc(rect(x, 1514, x + 8, 1560), '#6a4a32', null, 8211 + x, { drop: false });
    const cols = ['#3d5a80', '#ece6d4', '#c9a83a'];
    for (let i = 0; i < 2; i++) pc(rect(884, 1500 - 14 * (i + 1), 980, 1500 - 14 * i), cols[i], () => strokePts([[884, 1500 - 14 * i - 4], [980, 1500 - 14 * i - 4]], 'rgba(0,0,0,0.15)', 1), 8220 + i);
    const k = clamp(o.serviette || 0), fx = 932 + 80 * ease(k), fy = 1465 + (k < 0.4 ? 0 : 90 * M.easeIn((k - 0.4) / 0.6)), fr = 1.2 * ease(clamp((k - 0.2) / 0.6));
    c.save(); c.translate(fx, fy); c.rotate(fr); pc(rect(-48, -7, 48, 7), cols[2], () => strokePts([[-48, -2], [48, -2]], 'rgba(0,0,0,0.15)', 1), 8223); c.restore();
    // bouée posée contre le banc
    PAP2.bouee(1012, 1470, 0.9, { epoque: 'moderne', rot: 0.08 });
    // planche de nage
    c.save(); c.translate(110, 1500); c.rotate(-0.05); pc([[-28, 0], [28, 0], [30, -60, 1], [0, -74], [-30, -60, 1]], '#c9a83a', null, 8230); c.restore();
  }

  // ---------------------------------------------------------------- B. BASSIN COUVERT 1920-30 (Brooklyn)
  const B30 = { fen: [{ x0: 140, x1: 320, y0: 540, y1: 1000 }, { x0: 520, x1: 700, y0: 540, y1: 1000 }], pendule: { x: 420, y: 560, s: 0.85 }, lampes: [330, 740], cabines: [{ x0: 748, x1: 880 }, { x0: 890, x1: 1022 }], radiateur: { x: 612, y: 1040 }, bouee: { x: 818, y: 640 } };
  PAP2.BASSIN = B30;
  const fenPath30 = (c, F) => { const r = (F.x1 - F.x0) / 2, ya = F.y0 + r, cx = (F.x0 + F.x1) / 2; c.beginPath(); c.moveTo(F.x0, F.y1); c.lineTo(F.x0, ya); c.arc(cx, ya, r, PI, TAU); c.lineTo(F.x1, F.y1); c.closePath(); };
  function makeB30Dehors() {
    return M.pre(1080, 1400, (c) => { const g = c.createLinearGradient(0, 520, 0, 1000); g.addColorStop(0, '#b9c6cc'); g.addColorStop(1, '#e8e4d6'); c.fillStyle = g; c.fillRect(0, 400, 1080, 700);
      c.fillStyle = 'rgba(120,110,105,0.55)'; for (let i = 0; i < 12; i++) { const x = 100 + i * 60, h = 120 + 140 * hash(i * 1.9); c.fillRect(x, 1000 - h, 50, h); c.fillStyle = 'rgba(230,220,180,0.5)'; for (let j = 0; j < 4; j++) c.fillRect(x + 8 + (j % 2) * 20, 1000 - h + 20 + 30 * Math.floor(j / 2), 10, 12); c.fillStyle = 'rgba(120,110,105,0.55)'; }
      c.fillStyle = 'rgba(150,140,130,0.7)'; c.fillRect(560, 700, 14, 300); c.fillRect(600, 640, 10, 360); });
  }
  function makeB30Fond() {
    return M.pre(1080, 1400, (c) => {
      briques(c, 0, 0, 1080, 1400, '#8a4a3a', 11);
      // galerie à balustrade
      c.fillStyle = 'rgba(15,8,6,0.55)'; c.fillRect(0, 0, 1080, 470);
      c.fillStyle = '#4a2e1e'; c.fillRect(0, 150, 1080, 40);
      for (let x = 40; x < 1080; x += 30) { c.fillStyle = '#8a6a48'; c.beginPath(); c.moveTo(x - 5, 400); c.lineTo(x + 5, 400); c.lineTo(x + 8, 420); c.lineTo(x + 4, 440); c.lineTo(x + 8, 462); c.lineTo(x - 8, 462); c.lineTo(x - 4, 440); c.lineTo(x - 8, 420); c.closePath(); c.fill(); }
      c.fillStyle = '#6e4a2c'; c.fillRect(0, 388, 1080, 14); c.fillRect(0, 462, 1080, 40); c.fillStyle = 'rgba(255,225,170,0.25)'; c.fillRect(0, 389, 1080, 3); c.fillRect(0, 463, 1080, 4);
      const gs = c.createLinearGradient(0, 500, 0, 620); gs.addColorStop(0, 'rgba(20,10,8,0.5)'); gs.addColorStop(1, 'rgba(20,10,8,0)'); c.fillStyle = gs; c.fillRect(0, 500, 1080, 120);
      // fenêtres
      for (const F of B30.fen) {
        c.fillStyle = '#c9b79a'; fenPath30(c, { x0: F.x0 - 16, x1: F.x1 + 16, y0: F.y0 - 16, y1: F.y1 + 10 }); c.fill();
        c.fillStyle = '#ddd2bb'; c.fillRect(F.x0 - 26, F.y1 + 4, F.x1 - F.x0 + 52, 18);
        c.globalCompositeOperation = 'destination-out'; fenPath30(c, F); c.fill(); c.globalCompositeOperation = 'source-over';
        c.strokeStyle = '#3e4a40'; c.lineWidth = 7; fenPath30(c, F); c.stroke(); c.lineWidth = 3.5;
        const r = (F.x1 - F.x0) / 2, ya = F.y0 + r, cx = (F.x0 + F.x1) / 2;
        for (let x = F.x0 + 30; x < F.x1; x += 30) { c.beginPath(); c.moveTo(x, F.y0 + r - Math.sqrt(Math.max(0, r * r - (x - cx) ** 2))); c.lineTo(x, F.y1); c.stroke(); }
        for (let y = ya; y < F.y1; y += 36) { c.beginPath(); c.moveTo(F.x0, y); c.lineTo(F.x1, y); c.stroke(); }
        for (let i = 1; i < 6; i++) { const a = PI + i * PI / 6; c.beginPath(); c.moveTo(cx, ya); c.lineTo(cx + Math.cos(a) * r, ya + Math.sin(a) * r); c.stroke(); }
      }
      // carrelage blanc et frise
      carreaux(c, 0, 1010, 1080, 1120, '#efebe0', 22, 3);
      c.fillStyle = '#3d5a80'; c.fillRect(0, 1004, 1080, 22);
      for (let x = 0; x < 1080; x += 22) { c.fillStyle = (x / 22) % 2 ? '#c49a3c' : '#efebe0'; c.beginPath(); c.moveTo(x + 11, 1007); c.lineTo(x + 19, 1015); c.lineTo(x + 11, 1023); c.lineTo(x + 3, 1015); c.closePath(); c.fill(); }
    });
  }
  function makeB30Milieu() {
    return M.pre(1080, 1400, (c) => {
      // cabines de bain (bois) — rideaux dessinés à part (animés)
      for (const C of B30.cabines) {
        pc(rect(C.x0 - 6, 780, C.x1 + 6, 800), '#6a4628', () => strokePts([[C.x0 - 6, 784], [C.x1 + 6, 784]], 'rgba(255,225,170,0.35)', 2), 8301 + C.x0);
        for (const x of [C.x0 - 6, C.x1 - 4]) pc(rect(x, 800, x + 10, 1112), '#7a5232', null, 8302 + x, { drop: false });
        c.fillStyle = 'rgba(20,12,8,0.6)'; c.fillRect(C.x0 + 4, 800, C.x1 - C.x0 - 8, 312);
      }
      // banc de bois sous la fenêtre gauche
      pc(rect(150, 1060, 330, 1074), '#8a6038', () => strokePts([[150, 1063], [330, 1063]], 'rgba(255,225,170,0.4)', 1.6), 8320);
      for (const x of [162, 312]) pc(rect(x, 1074, x + 8, 1112), '#6a4628', null, 8321 + x, { drop: false });
      // radiateur en fonte sous la fenêtre droite
      const R = B30.radiateur; pc(rect(R.x - 60, R.y, R.x + 60, R.y + 66), '#4a4440', () => { for (let x = R.x - 54; x < R.x + 56; x += 12) { fillPts(rect(x, R.y + 4, x + 8, R.y + 62), '#5e5650'); strokePts([[x + 2, R.y + 6], [x + 2, R.y + 60]], 'rgba(255,255,255,0.2)', 1); } }, 8330);
      pc(rect(R.x - 64, R.y + 66, R.x - 56, R.y + 72), '#3a3430', null, 8331, { drop: false });
      // perche de maître-nageur posée contre le mur
      c.save(); c.translate(380, 1112); c.rotate(-0.22); pc(rect(-4, -520, 4, 0), '#b08a5a', () => strokePts([[-1, -510], [-1, -10]], 'rgba(255,240,200,0.5)', 1.4), 8340); strokePts([[0, -520], [0, -548], [16, -556], [24, -540]], '#5a5048', 4); c.restore();
      // bouée de liège accrochée
      strokePts([[B30.bouee.x, B30.bouee.y - 48], [B30.bouee.x, B30.bouee.y - 40]], '#2a2a2a', 3);
      c.save(); c.translate(B30.bouee.x, B30.bouee.y); drawBouee({ epoque: '1930' }); c.restore();
      // crochets et peignoirs
      for (const [x, col] of [[760, '#e8e0c8'], [985, '#9a2a24']]) { pc([[x - 14, 690], [x + 14, 690], [x + 20, 770], [x - 20, 770]], col, () => strokePts([[x, 692], [x, 768]], 'rgba(0,0,0,0.2)', 1), 8350 + x); }
    });
  }
  function rideauCabine(t, C, k, ph) {                        // rideau rayé qui ondule ; k = ouverture 0..1 (glisse vers la droite)
    const g = tg(t), w = (C.x1 - C.x0 - 8) * (1 - 0.7 * k), x0 = C.x0 + 4 + (C.x1 - C.x0 - 8) * 0.7 * k, N = 10;
    const top = 806, bot = 1100, T = [], B = [];
    for (let i = 0; i <= N; i++) { const u = i / N; T.push([x0 + w * u, top]); B.push([x0 + w * u + 6 * Math.sin(g * 1.3 + u * 5 + ph) * (1 + k), bot + 4 * Math.sin(g * 2 + u * 7)]); }
    pc(T.concat(B.reverse()), '#ece4d0', () => { for (let i = 0; i < N; i += 2) { const u0 = i / N, u1 = (i + 1) / N; fillPts([[x0 + w * u0, top], [x0 + w * u1, top], [B[N - i - 1][0], bot + 8], [B[N - i][0], bot + 8]], '#9a2a24'); } shade(x0, 900, x0 + w, 900, 0.2, [x0, top, x0 + w, bot + 10]); }, 8360 + C.x0, { texA: 0.45 });
    fillPts(rect(C.x0, 800, C.x1, 808), '#3a3430');
  }
  PAP2.bassin1930 = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), g = tg(t);
    c.save(); c.translate(0, -up);
    if (o.avant) { b30Avant(t, o); c.restore(); return; }
    c.drawImage(K.b30Dehors, 0, 0);
    c.drawImage(K.b30Fond, 0, 0);
    M.pendule(t + (o.horlogeDt || 0), { x: B30.pendule.x, y: B30.pendule.y, s: B30.pendule.s, per: 2, bois: '#5e3a22' });
    c.drawImage(K.b30Milieu, 0, 0);
    rideauCabine(t, B30.cabines[0], clamp(o.rideau || 0), 0); rideauCabine(t, B30.cabines[1], 0, 2.1);
    M.fumee(t, { x: B30.radiateur.x, y: B30.radiateur.y - 4, s: 0.45, n: 5, haut: 150, vent: 12, col: '#ece8de', a: 0.35, per: 4, seed: 9 });
    // lampes globes suspendues (o.lampe 0..1 : l'une se balance)
    for (let i = 0; i < 2; i++) {
      const x = B30.lampes[i], amp = i === 1 ? 0.02 + 0.18 * clamp(o.lampe || 0) : 0.02, a = amp * Math.sin(g * 2.1 + i), L = 210, X0 = x + Math.sin(a) * L, Y0 = 500 + Math.cos(a) * L;
      strokePts([[x, 500], [X0, Y0 - 22]], 'rgba(30,24,20,0.85)', 1.6);
      pc(rect(X0 - 8, Y0 - 28, X0 + 8, Y0 - 18), '#8a6a30', null, 8380 + i, { drop: false });
      if (!SIL()) { const gl = c.createRadialGradient(X0, Y0, 4, X0, Y0, 120); gl.addColorStop(0, 'rgba(255,230,170,0.35)'); gl.addColorStop(1, 'rgba(255,230,170,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(X0 - 120, Y0 - 120, 240, 240); c.restore(); }
      pc(ell(X0, Y0, 26, 26, 22), '#f3e8c8', () => strokePts(ep(X0, Y0, 18, 18, 8, PI * 1.1, PI * 1.5), 'rgba(255,255,255,0.8)', 2), 8385 + i, { texA: 0.3 });
    }
    // rayons des fenêtres et poussière
    if (!SIL()) for (const F of B30.fen) {
      const poly = [[F.x0 + 10, F.y0 + 80], [F.x1 - 10, F.y0 + 80], [F.x1 + 200, 1112], [F.x0 + 90, 1112]];
      c.save(); c.globalCompositeOperation = 'lighter'; polyPath(c, poly);
      const gr = c.createLinearGradient(F.x0, F.y0, F.x0 + 120, 1112); gr.addColorStop(0, 'rgba(255,240,205,0.16)'); gr.addColorStop(1, 'rgba(255,240,205,0)'); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: F.x0 + 20, y: F.y0 + 80, w: 340, h: 520, n: 24, a: 0.75, seed: F.x0 });
      c.restore();
    }
    c.restore();
  };
  function b30Avant(t, o) {
    // échelle de bois (gauche) et seau de bois, peignoir sur une patère au premier plan
    for (const x of [150, 200]) pc(rect(x, 1360, x + 10, EAU.bas + 4), '#8a6038', () => strokePts([[x + 2, 1362], [x + 2, EAU.bas]], 'rgba(255,230,190,0.4)', 1.4), 8401 + x);
    for (const y of [1388, 1430, 1470]) pc(rect(150, y, 210, y + 7), '#7a5232', null, 8410 + y, { drop: false });
    for (const x of [150, 200]) pc(ell(x + 5, 1358, 8, 8, 10), '#6a4628', null, 8420 + x, { drop: false });
    pc([[900, 1500], [960, 1500], [954, 1560], [906, 1560]], '#8a6038', () => { for (const y of [1512, 1546]) strokePts([[902, y], [958, y]], '#4a4440', 2.4); }, 8430);
    pc(rect(1000, 1420, 1012, 1560), '#6a4628', null, 8431);
  }

  // ---------------------------------------------------------------- C. STADE NAUTIQUE DE BERLIN 1936 (option epoque:'1952' + temps 0..1)
  const SB = { tour: { x: 880, y0: 360, y1: 1112, w: 130, horloge: { x: 880, y: 470, r: 44 } }, mats: [{ x: 170, col: '#c49a3c' }, { x: 360, col: '#5f7a4a' }, { x: 560, col: '#ece4cc' }, { x: 740, col: '#3d5a80' }], jury: 790,
    gradins: [{ y: 742, x0: 70, x1: 800, pas: 26, s: 0.72 }, { y: 788, x0: 60, x1: 805, pas: 27, s: 0.78 }, { y: 836, x0: 50, x1: 810, pas: 28, s: 0.84 }, { y: 886, x0: 46, x1: 812, pas: 29, s: 0.9 }, { y: 938, x0: 46, x1: 815, pas: 30, s: 0.96 }, { y: 992, x0: 46, x1: 815, pas: 31, s: 1.02 }] };
  PAP2.STADE = SB;
  function makeSbFond() {
    return M.pre(1080, 1400, (c) => {
      // gradins de pierre claire en arc (rangées)
      for (let i = 0; i < 8; i++) { const y = 700 + i * 52; c.fillStyle = i % 2 ? '#cfc3a6' : '#d9cfb4'; c.beginPath(); c.moveTo(0, y + 20); c.quadraticCurveTo(540, y - 26, 1080, y + 20); c.lineTo(1080, y + 72); c.quadraticCurveTo(540, y + 26, 0, y + 72); c.closePath(); c.fill(); c.fillStyle = 'rgba(90,70,40,0.15)'; c.fillRect(0, y + 46, 1080, 2); }
      c.fillStyle = '#bfb08e'; c.beginPath(); c.moveTo(0, 690); c.quadraticCurveTo(540, 640, 1080, 690); c.lineTo(1080, 712); c.quadraticCurveTo(540, 664, 0, 712); c.closePath(); c.fill();
      for (let x = 30; x < 1080; x += 60) { c.fillStyle = '#c9bc9c'; c.fillRect(x, 640 + 0.000035 * (x - 540) ** 2 - 4, 14, 52); }
      c.fillStyle = '#b7a888'; c.beginPath(); c.moveTo(0, 646); c.quadraticCurveTo(540, 600, 1080, 646); c.lineTo(1080, 660); c.quadraticCurveTo(540, 614, 0, 660); c.closePath(); c.fill();
      // escaliers
      for (const x of [300, 640]) { c.fillStyle = 'rgba(120,100,70,0.25)'; c.fillRect(x, 700, 24, 410); }
      c.fillStyle = '#cbbd9e'; c.fillRect(0, 1090, 1080, 30);
      // tour d'horloge en pierre
      const T = SB.tour; pierres(c, T.x - T.w / 2, T.y0, T.x + T.w / 2, T.y1, 4, '#d6cbb0');
      c.fillStyle = '#b9ab8c'; c.fillRect(T.x - T.w / 2 - 8, T.y0 - 10, T.w + 16, 18); c.beginPath(); c.moveTo(T.x - T.w / 2 - 4, T.y0 - 10); c.lineTo(T.x, T.y0 - 70); c.lineTo(T.x + T.w / 2 + 4, T.y0 - 10); c.closePath(); c.fill();
      c.fillStyle = 'rgba(40,30,20,0.35)'; for (let y = 600; y < 1000; y += 120) c.fillRect(T.x - 10, y, 20, 60);
    });
  }
  function makeSbMilieu() {
    return M.pre(1080, 1400, (c) => {
      // tremplin de plongeon en béton (gauche)
      for (const [x0, x1] of [[58, 92], [150, 184]]) pc(rect(x0, 640, x1, 1112), '#cfcac0', () => { for (let y = 660; y < 1112; y += 36) strokePts([[x0, y], [x1, y]], 'rgba(90,90,90,0.25)', 1); hatch(null, 0.4, 6, 0.15, 1, undefined, [x0, 640, x1, 1112]); }, 8501 + x0);
      for (const y of [760, 900, 1040]) pc(rect(58, y, 184, y + 14), '#c2bcb0', null, 8505 + y, { drop: false });
      pc(rect(56, 628, 250, 646), '#bcb6aa', () => strokePts([[56, 631], [250, 631]], 'rgba(255,255,255,0.6)', 1.6), 8502);
      pc(rect(56, 820, 200, 836), '#bcb6aa', null, 8503);
      strokePts([[250, 628], [250, 590], [160, 590]], '#6a6a6a', 3); strokePts([[200, 820], [200, 790], [130, 790]], '#6a6a6a', 3);
      // plots de départ (droite)
      for (let i = 0; i < 3; i++) { const x = 950 + i * 26, s2 = 0.75 + i * 0.1; pc([[x - 16 * s2, 1110], [x - 14 * s2, 1074], [x + 18 * s2, 1066], [x + 20 * s2, 1110]], '#bcb6aa', () => strokePts([[x - 12 * s2, 1076], [x + 16 * s2, 1068]], 'rgba(255,255,255,0.5)', 1.4), 8510 + i); }
      // mâts
      for (const m of SB.mats) { pc(rect(m.x - 4, 430, m.x + 4, 1112), '#e8e4da', () => strokePts([[m.x - 2, 432], [m.x - 2, 1110]], 'rgba(255,255,255,0.7)', 1.2), 8520 + m.x, { drop: false }); pc(ell(m.x, 428, 7, 7, 10), '#c9a24a', null, 8530 + m.x, { drop: false }); }
    });
  }
  const SAISONS = { ete: ['#8fb6d4', '#e4e6d6'], automne: ['#b9a88a', '#e6d2a8'], hiver: ['#a9b4bc', '#dfe2e2'], printemps: ['#9cc0cc', '#e8eacc'] };
  function saisonDe(o) { if (o.saison) return o.saison; if (o.epoque !== '1952') return 'ete'; const s = frac(clamp(o.temps || 0) * 2.5); return s < 0.25 ? 'ete' : s < 0.5 ? 'automne' : s < 0.75 ? 'hiver' : 'printemps'; }
  function feuilles(t, n, cols, neige) {
    if (SIL()) return; const c = cx_(), g = tg(t);
    for (let i = 0; i < n; i++) {
      const per = neige ? 9 : 7, u = frac(g / per + hash(i * 1.3)), x = 80 + 900 * hash(i * 2.7) + Math.sin(g * 1.2 + i) * 30 - u * 60, y = 280 + u * 840;
      c.save(); c.translate(x, y); c.rotate(g * 2 + i);
      if (neige) { c.fillStyle = 'rgba(250,250,252,0.9)'; c.beginPath(); c.arc(0, 0, 2.5 + 2 * hash(i), 0, TAU); c.fill(); }
      else { c.scale(Math.cos(g * 4 + i), 1); c.fillStyle = cols[i % cols.length]; c.beginPath(); c.ellipse(0, 0, 8, 4.5, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(60,30,10,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke(); }
      c.restore();
    }
  }
  PAP2.stadeBerlin = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_(), g = tg(t), e52 = o.epoque === '1952', tp = clamp(o.temps || 0), sa = saisonDe(o);
    c.save(); c.translate(0, -up);
    if (o.avant) { sbAvant(t, o); c.restore(); return; }
    if (!SIL()) { const C2 = SAISONS[sa], gr = c.createLinearGradient(0, 150, 0, 760); gr.addColorStop(0, C2[0]); gr.addColorStop(1, C2[1]); c.fillStyle = gr; c.fillRect(0, 0, 1080, 1120); }
    if (sa === 'ete' && !SIL()) { const gs = c.createRadialGradient(700, 330, 10, 700, 330, 120); gs.addColorStop(0, 'rgba(255,245,200,0.9)'); gs.addColorStop(0.4, 'rgba(255,230,160,0.4)'); gs.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = gs; c.fillRect(560, 190, 280, 280); c.fillStyle = '#f6e6a8'; c.beginPath(); c.arc(700, 330, 34, 0, TAU); c.fill(); }
    M.nuages(t, { y0: 330, y1: 560, n: 5, vit: 18, s: 0.85, seed: 33, brume: sa === 'hiver' ? 0.35 : 0.1 });
    M.oiseaux(t, { x0: 1100, x1: -60, y: 400, n: 5, s: 0.5, seed: 4, dur: 9, boucle: true, brume: 0.3 });
    c.drawImage(K.sbFond, 0, 0);
    horlogeRonde(t, SB.tour.horloge.x, SB.tour.horloge.y, SB.tour.horloge.r, { boite: '#9a8a6a', cadran: '#efe8d4', dt: (o.horlogeDt || 0) + (e52 ? tp * 40000 : 0), sec: 60 });
    foule(t, SB.gradins, { brume: 0.2, chapeaux: true, vide: e52 ? smooth(0.02, 0.85, tp) : 0, leve: o.leve, leveIdx: o.leveIdx != null ? o.leveIdx : 40 });
    c.drawImage(K.sbMilieu, 0, 0);
    // fanions unis aux mâts : 1936 ; 1952 → mâts nus au milieu du temps, fanions neufs à la fin
    const nus = e52 && tp > 0.12 && tp < 0.88, neufs = e52 && tp >= 0.88;
    SB.mats.forEach((m, i) => { if (nus) return; fanion(t, m.x + 4, 438, 120, 46, neufs ? shadeHex(m.col === '#ece4cc' ? '#f4eed8' : m.col, 1.12) : m.col, i * 1.7); });
    // canotier qui s'envole des gradins (o.canotier 0..1)
    if (o.canotier > 0 && o.canotier < 1) { const u = clamp(o.canotier), x = lerp(430, 980, u), y = 820 - 380 * Math.sin(PI * u * 0.9) + 120 * u; c.save(); c.translate(x, y); c.rotate(u * 9); pc([[-26, 3], [26, 3], [27, 0], [14, -1], [13, -14], [-12, -14], [-13, -1], [-25, 0]], '#d8bf7a', () => fillPts(rect(-13, -7, 14, -3), '#27324a'), 8590, { drop: false }); c.restore(); }
    if (sa === 'automne') feuilles(t, 22, ['#b0582a', '#c9802e', '#8e4a26', '#c49a3c'], false);
    if (sa === 'hiver') feuilles(t, 60, null, true);
    c.restore();
  };
  function sbAvant(t, o) {
    const e52 = o.epoque === '1952', tp = clamp(o.temps || 0), g = tg(t);
    // plantes en bac (lauriers taillés) aux deux coins
    for (const x of [108, 975]) {
      pc(rect(x - 44, 1440, x + 44, 1530), '#bcb6aa', () => { strokePts([[x - 44, 1446], [x + 44, 1446]], 'rgba(255,255,255,0.5)', 2); hatch(null, 0.4, 6, 0.15, 1, undefined, [x - 50, 1430, x + 50, 1540]); }, 8601 + x);
      const sw = 0.03 * Math.sin(g * 1.4 + x);
      const cx = cx_(); cx.save(); cx.translate(x, 1440); cx.rotate(sw);
      pc(ell(0, -70, 52, 70, 22), '#4e6a3a', () => { for (let i = 0; i < 26; i++) dot(-44 + 88 * hash(i * 1.7 + x), -130 + 120 * hash(i * 2.3 + x), 5, i % 2 ? '#5f7a4a' : '#3e5a2e'); }, 8610 + x);
      cx.restore();
    }
    // table du jury (si o.jury) : (x, FEET) ; la toile d'araignée gagne avec le temps (1952)
    if (o.jury) {
      const x = typeof o.jury === 'number' ? o.jury : SB.jury;
      pc(rect(x - 150, 1300, x + 150, 1318), '#7a5232', () => strokePts([[x - 150, 1303], [x + 150, 1303]], 'rgba(255,230,190,0.4)', 2), 8620);
      pc(rect(x - 144, 1318, x + 144, 1410), '#27324a', () => { for (let xx = x - 140; xx < x + 140; xx += 18) strokePts([[xx, 1318], [xx + 2, 1410]], 'rgba(255,255,255,0.08)', 1.2); fillPts(rect(x - 144, 1318, x + 144, 1330), '#c49a3c'); }, 8621);
      if (e52 && tp > 0.05 && !SIL()) { const cc = cx_(), k = smooth(0.05, 0.6, tp), R = 60 * k, X0 = x + 144, Y0 = 1318; cc.save(); cc.globalAlpha = 0.8; cc.strokeStyle = 'rgba(245,245,240,0.9)'; cc.lineWidth = 1;
        for (let i = 0; i <= 6; i++) { const a = PI / 2 + i * PI / 12; cc.beginPath(); cc.moveTo(X0, Y0); cc.lineTo(X0 + Math.cos(a) * R, Y0 + Math.sin(a) * R); cc.stroke(); }
        for (let j = 1; j <= 4; j++) { cc.beginPath(); for (let i = 0; i <= 6; i++) { const a = PI / 2 + i * PI / 12, rr = R * j / 4; cc.lineTo(X0 + Math.cos(a) * rr, Y0 + Math.sin(a) * rr); } cc.stroke(); }
        cc.restore(); }
    }
  }

  PAP2.init = function () {
    Object.assign(K, { pmCiel: makePmCiel(), pmFond: makePmFond(), pmMilieu: makePmMilieu(), b30Dehors: makeB30Dehors(), b30Fond: makeB30Fond(), b30Milieu: makeB30Milieu(), sbFond: makeSbFond(), sbMilieu: makeSbMilieu() });
    return K;
  };
})();
