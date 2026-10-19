// persos.js — « Le Toblerone, des danseuses plutôt que le Cervin » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.tob (alias TOB). Appeler TOB.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (aucun Math.random).
(function () {
  const X = M.X, P = M.P, CH = M.chars, PI = Math.PI, TAU = M.TAU, ST = M.ST;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const TOB = (M.tob = {});
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const D = 180 / PI;

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  function ribbon(line, w0, w1, wf) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const u = i / (line.length - 1), w = (wf ? wf(u) : lerp(w0, w1, u)) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  TOB.geo = { ep, ell, ribbon, qbez };

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le pivot)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant', 'arriere'
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      const sc = (b <= 0.02 ? 1000 : 0) + (pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1]);   // coude toujours plié vers l'avant (b ≤ 0)
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }

  // =====================================================================
  // OBJETS — dessinés dans leur repère (échelle 1), tenus (pièce de l'avant-bras) ou seuls
  // =====================================================================
  const CHOC = { lait: '#8a5a3a', clair: '#a8774f', ombre: '#5a3522', fonce: '#4a2a18', nougat: '#efe4c4', amande: '#c9a36a', miel: '#d9a43a' };
  const BAR = { L: 310, n: 7, h: 54, base: 11, val: 15 };
  TOB.BAR = BAR;
  function barPeaks() {                                                        // [xl, xm, xr] de chaque pointe
    const w = BAR.L / BAR.n, o = [];
    for (let i = 0; i < BAR.n; i++) { const xl = -BAR.L / 2 + i * w; o.push([xl, xl + w / 2, xl + w]); }
    return o;
  }
  function barOutline(cut) {
    const pk = barPeaks(), L2 = BAR.L / 2, o = [[-L2 - 10, -2, 1], [-L2, 0, 1], [L2, 0, 1], [L2 + 10, -4, 1], [L2 + 10, -BAR.base - 4, 1]];
    for (let i = BAR.n - 1; i >= 0; i--) {
      const [xl, xm, xr] = pk[i];
      o.push([xr, -BAR.val, 1]);
      if (cut && i === 4) { const yb = -BAR.h * 0.5; o.push([lerp(xr, xm, 0.5), yb + 4, 1], [xm + 4, yb - 3, 1], [xm - 3, yb + 2, 1], [lerp(xl, xm, 0.5), yb - 2, 1]); }
      else o.push([xm, -BAR.h, 1]);
      o.push([xl, -BAR.val, 1]);
    }
    o.push([-L2 - 10, -BAR.base - 6, 1]);
    return o;
  }
  function amandes(pts, seed, n) {                                             // petits points ivoire sur une face coupée
    const bb = M.bbox(pts);
    for (let k = 0; k < n; k++) {
      const x = lerp(bb[0] + 2, bb[2] - 2, hash(seed + k * 3.1)), y = lerp(bb[1] + 2, bb[3] - 2, hash(seed + k * 7.7));
      dot(x, y, 1.3 + 1.2 * hash(seed + k), k % 3 ? CHOC.nougat : CHOC.amande);
    }
  }
  function drawBarre(o) {
    const k = o.k || 1, c = cx_(), cut = clamp(o.coupe || 0), pk = barPeaks(), L2 = BAR.L / 2;
    c.save(); c.scale(k, k);
    pc(barOutline(cut > 0.02), CHOC.lait, () => {
      fillPts([[-L2 - 12, 2], [L2 + 12, 2], [L2 + 12, -BAR.base], [-L2 - 12, -BAR.base]], '#7a4c30');
      strokePts([[-L2, -BAR.base], [L2, -BAR.base]], 'rgba(40,20,10,0.45)', 1);
      for (let i = 0; i < BAR.n; i++) {
        const [xl, xm, xr] = pk[i];
        fillPts([[xl, -BAR.base, 1], [xm, -BAR.h, 1], [xm + 7, -BAR.h + 8, 1], [xr - 9, -BAR.base, 1]], CHOC.clair, 0, 0);      // face éclairée
        const notch = [[xm + 7, -BAR.h + 8, 1], [xm, -BAR.h, 1], [xr, -BAR.val, 1], [xr - 9, -BAR.base, 1]];                    // face coupée (encoche)
        fillPts(notch, CHOC.ombre, 0, 0); amandes(notch, 31 + i * 17, 5);
        strokePts([[xl + 2, -BAR.val], [xm, -BAR.h + 1]], 'rgba(255,230,190,0.45)', 1.2);
        hatch([[xm, -BAR.h], [xr, -BAR.val], [xr - 9, -BAR.base]], -0.5, 3.2, 0.2);
      }
      // bout gauche : section triangulaire coupée (amandes)
      const bout = [[-L2 - 10, -2, 1], [-L2, 0, 1], [-L2, -BAR.val, 1], [-L2 + pk[0][1] - pk[0][0] - 4, -BAR.h + 4, 1], [-L2 - 10, -BAR.base - 6, 1]];
      fillPts(bout, '#6b4128', 0, 0); amandes(bout, 7, 6);
      fillPts([[L2, 0], [L2 + 10, -4], [L2 + 10, -BAR.base - 4], [L2, -BAR.val]], CHOC.fonce, 0, 0);
      if (cut > 0.02) {                                                        // pointe cassée : nougat, éclats d'amande
        const [xl, xm, xr] = pk[4], yb = -BAR.h * 0.5;
        const cs = [[lerp(xl, xm, 0.5), yb - 2], [xm - 3, yb + 2], [xm + 4, yb - 3], [lerp(xr, xm, 0.5), yb + 4], [lerp(xr, xm, 0.5) - 2, yb + 12], [lerp(xl, xm, 0.5) + 2, yb + 12]];
        fillPts(cs, CHOC.nougat, 0, 0);
        for (let q = 0; q < 6; q++) dot(lerp(xl + 14, xr - 14, hash(q * 5.3)), yb + 3 + 7 * hash(q * 2.1), 2 + hash(q) * 1.6, q % 2 ? CHOC.amande : '#e8d3a2');
      }
      hatch([[-L2 - 12, -2], [L2 + 12, -2], [L2 + 12, 4], [-L2 - 12, 4]], 0, 3, 0.25);
    }, 8101);
    if (cut > 0.02 && !SIL()) {                                                // filet de miel doré qui coule de la cassure
      const [xl, xm] = pk[4], yb = -BAR.h * 0.5, len = 26 * clamp((cut - 0.3) / 0.7);
      if (len > 0.5) { c.save(); c.fillStyle = CHOC.miel; c.globalAlpha = 0.9; c.beginPath(); c.moveTo(xm - 4, yb + 2); c.lineTo(xm + 1, yb + 2); c.lineTo(xm, yb + 4 + len); c.arc(xm - 1.5, yb + 4 + len, 2.6, 0, TAU); c.fill(); c.restore(); }
    }
    if (cut > 0.02 && cut < 0.98) {                                            // la pointe qui se détache
      const [xl, xm, xr] = pk[4], yb = -BAR.h * 0.5, u = ease(cut);
      c.save(); c.translate(xm + 30 * u, yb - 30 * u); c.rotate(0.9 * u); c.globalAlpha = 1 - u;
      pc([[lerp(xl, xm, 0.5) - xm, -2, 1], [0, -BAR.h - yb, 1], [lerp(xr, xm, 0.5) - xm, 4, 1], [4, -3, 1]], CHOC.clair, null, 8102);
      c.restore();
    }
    const e = clamp(o.eclat || 0);
    if (e > 0 && e < 1 && !SIL()) {                                            // lueur brillante qui passe
      c.save(); M.path(barOutline(cut > 0.02), 8101, 0); c.clip();
      const xx = lerp(-L2 - 60, L2 + 60, e), g = c.createLinearGradient(xx - 40, 0, xx + 40, 0);
      g.addColorStop(0, 'rgba(255,245,220,0)'); g.addColorStop(0.5, 'rgba(255,245,220,0.75)'); g.addColorStop(1, 'rgba(255,245,220,0)');
      c.fillStyle = g; c.setTransform(c.getTransform().multiply(new DOMMatrix([1, 0, -0.5, 1, 0, 0]))); c.fillRect(xx - 80, -BAR.h - 20, 160, BAR.h + 40);
      c.restore();
    }
    c.restore();
  }
  // document plié (papier ivoire, pli, cachet rouge sans signe)
  function drawDocument(o) {
    pc([[-34, -48, 1], [30, -52, 1], [36, 46, 1], [-30, 50, 1]], '#ece2c8', () => {
      strokePts([[-32, -2], [33, -4]], 'rgba(90,70,40,0.55)', 1.4);                                   // pli
      fillPts([[-32, -2], [33, -4], [34, 6], [-31, 8]], 'rgba(120,100,60,0.12)');
      for (const y of [-38, -28, -18, 14, 24]) strokePts([[-24, y], [22, y - 1]], 'rgba(120,105,80,0.28)', 1);   // lignes muettes
      hatch(null, 0.8, 4, 0.12);
    }, 8201);
    if (o.sceau !== false) { pc(ell(10, 34, 9, 8, 10), '#8a2a24', () => dot(8, 32, 3, 'rgba(255,200,180,0.35)'), 8202); }
  }
  const OBJ = {
    barre: { draw: drawBarre, grip: (o) => [(o.prise === 'centre' ? -22 : -62) * (o.k || 1), -8 * (o.k || 1)], p2: (o) => [(o.prise === 'centre' ? 22 : -22) * (o.k || 1), -8 * (o.k || 1)], held: { k: 1.08 }, base: [0, 0],
      pts: (o) => { const k = o.k || 1, pk = barPeaks(); return { centre: [0, -BAR.h * 0.45 * k], sommet: [0, -BAR.h * k], gauche: [-BAR.L / 2 * k, -6 * k], droite: [BAR.L / 2 * k, -6 * k], cassure: [pk[4][1] * k, -BAR.h * 0.5 * k] }; } },
    document: { draw: drawDocument, grip: [-22, 34], base: [0, 50], derriere: true, pts: () => ({ centre: [0, 0], sceau: [10, 34] }) },
  };
  TOB.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  const devant = (v) => has(v) && OBJ[v] && !OBJ[v].derriere;
  function heldParts(skin, seed) {
    return {
      objetD: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed, pts: OFFP, extra: (p) => { if (has(p.tenu) && !devant(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (devant(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (devant(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (devant(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par TOB.tobler / TOB.danseuse
  TOB.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts(oo)[nom]; if (!q) return null;
    const part = arriere ? 'objetB' : devant(name) ? 'objet' : 'objetD';
    return r.w(part, q[0] - g[0], q[1] - g[1]);
  };

  // =====================================================================
  // POSES — préparation commune
  // =====================================================================
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function plier(q, th) {
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function marche(q, ph) {                                                     // q.marche = phase (rad) : un pas par demi-tour
    if (ph == null) return;
    const s = Math.sin(ph), A = q.ang;
    A.legF = (A.legF || 0) - 0.3 * s; A.legB = (A.legB || 0) + 0.3 * s;
    A.armB_up = (A.armB_up || 0) - 0.22 * s; if (!has(q.tenu)) A.armF_up = (A.armF_up || 0) + 0.18 * s;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 6;
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.objetD = A.objet;
    q._deux = false;
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
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.pose = q;
    return r;
  }
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  function foreDef(parent, base, skin, back, seed, cuffTop, cuffCol) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base: skin, seed, paint: (p) => {
      X.handPaint(null, hk(p));
      if (cuffTop) { fillPts([[-24, -14, 1], [24, -14, 1], [24, cuffTop, 1], [-24, cuffTop, 1]], base); strokePts([[-14, cuffTop - 5], [14, cuffTop - 6]], cuffCol || 'rgba(90,70,40,0.5)', 1.2); }
      hatch([[-14, cuffTop || -10], [-3, cuffTop || -10], [-3, 70], [-14, 70]], 0.9, 3.8, 0.18);
    } };
  }

  // =====================================================================
  // THEODOR TOBLER (Berne, 1908) — haute toque blanche plissée, moustache en guidon, gilet bordeaux à boutons dorés,
  // chemise ivoire manches retroussées, long tablier chocolat, pantalon gris, souliers noirs
  // =====================================================================
  const TO = { peau: '#e2bd98', peauD: '#c69c77', toque: '#f4f0e6', toqueD: '#d8d1c2', poil: '#5b3a22', poilD: '#3e2716', gilet: '#8a2a24', giletD: '#6a1f1a', or: '#c9a650',
    chemise: '#ece2c8', chemiseD: '#cfc3a5', tablier: '#5a3522', tablierD: '#432616', pant: '#6e6e72', pantD: '#58585c', soulier: '#1d1a19' };
  const TO_TORSO = [[-14, -176], [8, -180], [16, -168], [28, -150], [40, -116], [45, -76], [44, -40], [38, -6], [30, 16], [-34, 18], [-40, -40], [-42, -110], [-36, -150], [-26, -168]];
  const TO_TABLIER = [[-40, -4], [42, -6], [48, 30], [52, 110], [56, 214, 1], [-30, 218, 1], [-38, 110], [-42, 30]];
  const TOQUE_BAND = [[-38, 4, 1], [36, 0, 1], [37, -24, 1], [-39, -22, 1]];
  const TOQUE_PUFF = [[-39, -20, 1], [-46, -56], [-50, -98], [-42, -118], [-26, -126], [-8, -122], [8, -128], [26, -124], [42, -114], [48, -96], [44, -56], [37, -22, 1]];
  const TOQUE_GRIP = [36, -12];
  function drawToque(p) {
    const T = p._toque || { dx: 0, dy: 0, rot: 0 }, c = cx_();
    c.save(); c.translate(T.dx, T.dy); c.rotate(T.rot);
    pc(TOQUE_PUFF, TO.toque, () => {
      for (const x0 of [-36, -24, -12, 0, 12, 24, 36]) strokePts([[x0 * 0.9, -24], [x0 * 1.08, -70], [x0 * 1.05, -112]], 'rgba(120,110,95,0.45)', 1.2);
      for (const x0 of [-30, -6, 18]) fillPts([[x0, -26], [x0 + 8, -26], [x0 + 10, -110], [x0 + 2, -112]], 'rgba(150,140,120,0.14)');
      strokePts([[-40, -100], [-26, -120], [-8, -116], [8, -122], [26, -118], [40, -104]], 'rgba(255,255,255,0.7)', 1.6);
      shade(44, 0, -48, 0, 0.22, [-60, -140, 60, 0]);
    }, 3110);
    pc(TOQUE_BAND, TO.toqueD, () => { strokePts([[-36, -12], [36, -13]], 'rgba(255,255,255,0.5)', 1.2); hatch(null, 0.2, 3.4, 0.15); }, 3111);
    c.restore();
  }
  function moustache() {
    const front = ribbon([[28, -31], [38, -30], [47, -32], [53, -38], [53, -46], [49, -48]], 0, 0, (u) => 10 * (1 - u) + 2.2);
    const back = ribbon([[30, -31], [20, -31], [11, -33], [5, -39], [5, -47], [9, -49]], 0, 0, (u) => 10 * (1 - u) + 2.2);
    pc(back, TO.poilD, () => strokePts([[26, -31], [10, -34]], 'rgba(255,220,180,0.25)', 1), 3120);
    pc(front, TO.poil, () => { strokePts([[30, -32], [46, -32], [51, -40]], 'rgba(255,220,180,0.3)', 1.1); hatch(null, 0.3, 2.8, 0.25); }, 3121);
  }
  function mkTobler() {
    const shoe = () => { fillPts([[-40, 214, 1], [60, 214, 1], [60, 260, 1], [-40, 260, 1]], TO.soulier); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: TO_TORSO, base: TO.gilet, seed: 3101, paint: () => {
        fillPts([[-14, -178], [10, -182], [18, -168], [12, -152], [-2, -160], [-12, -162]], TO.chemise);       // col de chemise
        fillPts([[8, -172], [22, -150], [16, -136], [6, -158]], '#e8dcc0');
        strokePts([[18, -150], [34, -112], [40, -70], [38, -30], [30, 10]], 'rgba(40,10,8,0.6)', 1.5);         // bord du gilet
        for (const y of [-118, -96, -74, -52]) { dot(36 + (y + 118) * 0.05, y, 3.1, TO.or); dot(35 + (y + 118) * 0.05, y - 1, 1.2, 'rgba(255,245,200,0.8)'); }
        fillPts([[-30, -110], [-12, -110], [-12, -100], [-30, -100]], TO.giletD);                                  // poche du gilet
        strokePts([[-12, -104], [8, -96], [18, -104]], TO.or, 1.3);                                                 // chaîne de montre
        hatch([[-50, -170], [-12, -170], [-10, 20], [-50, 20]], 0.75, 4.2, 0.3);
        shade(44, 0, -42, 0, 0.3);
      } },
      tablier: { parent: 'torso', at: [0, -62], pts: TO_TABLIER, base: TO.tablier, seed: 3102, paint: () => {
        fillPts([[-42, -6], [44, -8], [44, 6], [-42, 8]], TO.tablierD);                                            // ceinture
        for (const [x0, x1] of [[-20, -22], [2, 6], [24, 34]]) strokePts([[x0, 10], [(x0 + x1) / 2, 110], [x1, 214]], 'rgba(20,8,4,0.45)', 1.3);
        fillPts([[8, 40], [36, 38], [38, 70], [10, 72]], TO.tablierD); strokePts([[8, 40], [36, 38]], 'rgba(220,180,140,0.35)', 1.1);   // poche
        dot(-6, 130, 5, 'rgba(40,18,8,0.35)'); dot(18, 96, 3.5, 'rgba(160,110,70,0.3)'); dot(30, 160, 4, 'rgba(40,18,8,0.3)');          // taches de chocolat
        hatch([[-44, 0], [-6, 0], [-4, 220], [-44, 220]], 0.75, 4.4, 0.3);
        shade(50, 0, -44, 0, 0.3, [-60, -10, 70, 230]);
      }, extra: () => {                                                                                            // nœud du tablier dans le dos
        pc([[-38, -6], [-58, -18], [-62, -2], [-56, 10], [-38, 4]], TO.tablierD, null, 3103);
        pc([[-42, 2], [-50, 30, 1], [-44, 34, 1], [-38, 6]], TO.tablierD, null, 3104);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(1.05), base: TO.pantD, seed: 3105, noRivet: true, paint: () => { shoe(); hatch(null, 0.8, 3.6, 0.3); } },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(1.05), base: TO.pant, seed: 3106, paint: () => {
        shoe(); strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25);
      } },
      armB_up: upDef([-10, -146], TO.chemiseD, 3107),
      armB_lo: foreDef('armB_up', TO.chemiseD, TO.peauD, true, 3108, 16),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: TO.peau, seed: 3109, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-44, -100], [-8, -102], [6, -86], [-12, -78], [-18, -62], [-20, -40], [-26, -30], [-44, -30]], TO.poil, 4);   // cheveux courts
        fillPts([[-6, -76], [2, -74], [3, -48], [-3, -44]], TO.poil);                                                          // favori
        X.earPaint(-10, -46);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        dot(16, -36, 9, 'rgba(205,120,100,0.26)');
        strokePts([[31, -36], [34, -35]], 'rgba(70,35,25,0.7)', 1.3);
        X.eye(f, 17, -53); X.brow(f, 17, -62, 'rgba(70,42,24,0.95)', 4); X.mouth(f, 28, -21);
        strokePts([[22, -8], [27, -13]], 'rgba(90,50,40,0.3)', 1);
      }, extra: () => moustache() },
      toque: { parent: 'head', at: [-2, -80], pts: OFFP, base: '#000', noRivet: true, seed: 3112, extra: (p) => drawToque(p) },
      armF_up: upDef([-2, -146], TO.chemise, 3113),
      armF_lo: foreDef('armF_up', TO.chemise, TO.peau, false, 3114, 16),
    };
    Object.assign(parts, heldParts(TO.peau, 3120));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Tobler',
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head', 'toque', 'torso', 'tablier', 'objetD', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.tobTobler = mkTobler();
  TOB.toblerPose = function (p) {
    const q = prep(p), A = q.ang, k = (n) => ease(clamp(q[n] || 0));
    const br = k('brandir'), pe = k('perplexe'), fi = k('fier'), fb = k('fierB'), te = k('tendre'), ha = k('hausser'), de = k('designer');
    const sa = clamp(q.salut || 0), s1 = ease(clamp(sa * 2)), s2 = ease(clamp(sa * 2 - 1));
    marche(q, q.marche);
    if (fi > 0 || fb > 0) { const f = Math.max(fi, fb); plier(q, -0.06 * f); A.head = (A.head || 0) - 0.14 * f; q.dy = (q.dy || 0) - 3 * f; }
    if (br > 0) { blend(q, 'armF_up', -1.35, br); blend(q, 'armF_lo', -0.22, br); A.head = (A.head || 0) - 0.06 * br; }
    if (te > 0) { blend(q, 'armF_up', -1.25, te); blend(q, 'armF_lo', -0.3, te); }
    if (de > 0) { blend(q, 'armF_up', -0.55, de); blend(q, 'armF_lo', -0.95, de); if (!has(q.tenu)) q.handF = 'open'; }
    if (ha > 0) {
      A.head = (A.head || 0) + 0.12 * ha;
      blend(q, 'armF_up', 0.22, ha); blend(q, 'armF_lo', -1.3, ha); blend(q, 'armB_up', 0.05, ha); blend(q, 'armB_lo', -1.4, ha);
      if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open';
      if (!q.face.brow) q.face.brow = 'up'; if (!q.face.mouth) q.face.mouth = 'tight';
    }
    if (pe > 0) { A.head = (A.head || 0) + 0.06 * pe; armTo(q, 'armF', headPt(q, 44, -14), 'bas', pe); if (!q.face.brow) q.face.brow = 'worry'; }
    if (fi > 0) armTo(q, 'armF', [-2, -52], 'arriere', fi);
    if (fb > 0) armTo(q, 'armB', [-12, -52], 'arriere', fb);
    if (sa > 0) {                                                               // salut : la main prend la toque (1re moitié) puis la soulève
      A.head = (A.head || 0) + 0.1 * s2;
      const T = { dx: 30 * s2, dy: -26 * s2, rot: 0.35 * s2 };
      q._toque = T;
      const g = [-2 + T.dx + Math.cos(T.rot) * TOQUE_GRIP[0] - Math.sin(T.rot) * TOQUE_GRIP[1], -80 + T.dy + Math.sin(T.rot) * TOQUE_GRIP[0] + Math.cos(T.rot) * TOQUE_GRIP[1]];
      armTo(q, 'armF', headPt(q, g[0], g[1]), 'avant', s1);
      if (!has(q.tenu)) q.handF = 'fist';
      if (!q.face.mouth && s2 > 0.3) q.face.mouth = 'smile';
    }
    if (pe > 0 || fi > 0 || sa > 0) { if (!has(q.tenu)) q.handF = 'fist'; }
    if (fb > 0 && !has(q.tenuB)) q.handB = 'fist';
    return finish(q);
  };
  TOB.tobler = (pose, x, y, s, o) => run(CH.tobTobler, TOB.toblerPose(pose), x, y, s == null ? 0.9 : s, Object.assign({ nom: 'Tobler' }, o));

  // =====================================================================
  // LES SIX DANSEUSES DES FOLIES BERGÈRE — robe-corsage, jupe de volants au genou, bas sombres, coiffe à grande plume
  // =====================================================================
  const DA = { peau: '#ecc9a8', peauD: '#cfa686', bas: '#2a2430', basD: '#1f1a24', or: '#c9a650', jupon: '#efe6d2' };
  const DA_SERIE = [null,
    { robe: '#8a2a24', plume: '#f4f1e8', cheveux: '#3b2a20' },
    { robe: '#5d6b4f', plume: '#b8873a', cheveux: '#9a5f2a' },
    { robe: '#23304a', plume: '#c98c8c', cheveux: '#cfae70' },
    { robe: '#b8873a', plume: '#8fa9c4', cheveux: '#2a1f1a' },
    { robe: '#5e3a5a', plume: '#ece2c8', cheveux: '#6e4226' },
    { robe: '#b0707a', plume: '#9cb8a8', cheveux: '#c3965a' }];
  TOB.DANSEUSES = DA_SERIE.slice(1).map((d) => Object.assign({}, d));
  const dk = (hex, k) => M.mixc(hex, '#000000', k);
  const HEM = (() => { const o = []; const n = 9; for (let i = 0; i <= n; i++) { const x = lerp(88, -84, i / n); o.push(i % 2 ? [x, 104] : [x, 96, 1]); } return o; })();
  const DA_TORSO = [[-12, -176], [6, -180], [12, -168], [20, -152], [30, -132], [29, -110], [20, -94], [16, -76], [34, -60], [54, -20], [70, 30], [82, 70], [90, 94, 1]].concat(HEM.slice(1, -1),
    [[-86, 94, 1], [-76, 60], [-60, 14], [-40, -34], [-26, -72], [-24, -100], [-28, -130], [-28, -152], [-22, -168]]);
  const DA_HEAD = [[-12, 16], [8, 16], [9, 2], [14, -6], [20, -10], [23, -15], [22, -19], [24, -22], [23, -25], [25, -29], [30, -34, 1], [27, -41], [24, -51], [25, -60], [21, -72], [10, -82], [-6, -86], [-22, -82], [-30, -66], [-30, -44], [-24, -28], [-16, -10]];
  const DA_HAIR = [[22, -70], [12, -84], [-6, -90], [-24, -86], [-34, -70], [-36, -50], [-30, -36], [-24, -40], [-22, -56], [-12, -66], [2, -68], [14, -74]];
  const PLUME = (() => { const line = qbez([0, 0], [10, -90], [-40, -150], 14); return ribbon(line, 0, 0, (u) => 4 + 30 * Math.pow(Math.sin(PI * Math.min(1, u * 1.1)), 0.8)); })();
  function mkDanseuse(i) {
    const C = DA_SERIE[i], robeD = dk(C.robe, 0.25), seed = 4000 + i * 50;
    const legPaint = (back) => () => {
      fillPts([[-30, 212, 1], [52, 212, 1], [52, 250, 1], [-30, 250, 1]], dk(C.robe, 0.15));
      fillPts([[-16, 226, 1], [-6, 226, 1], [-6, 244, 1], [-16, 244, 1]], '#1a1416');                          // talon
      strokePts([[10, 214], [36, 220]], 'rgba(255,255,255,0.25)', 1.2);
      if (!back) strokePts([[-14, 0], [-12, 120], [-10, 200]], 'rgba(255,255,255,0.12)', 2.4);
      hatch(null, 0.8, 3.6, back ? 0.3 : 0.15);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: DA_TORSO, base: C.robe, seed: seed + 1, paint: (p) => {
        for (const [y, k] of [[-6, 0.62], [42, 0.82], [88, 1]]) {                                                  // trois volants festonnés
          const w0 = -86 * k - 4, w1 = 90 * k + 2, sc = [];
          for (let q = 0; q <= 9; q++) sc.push([lerp(w1, w0, q / 9), y + (q % 2 ? 8 : 0)]);
          fillPts([[w1, y - 14]].concat(sc, [[w0, y - 14]]), 'rgba(255,240,225,0.12)');
          strokePts(sc, DA.jupon, 2.6); strokePts(sc.map((q) => [q[0], q[1] + 3]), 'rgba(0,0,0,0.35)', 1.2);
        }
        fillPts([[-28, -80], [22, -82], [20, -68], [-28, -66]], robeD);                                             // ceinture
        dot(18, -75, 4, DA.or);
        fillPts([[4, -180], [14, -168], [6, -160], [-2, -170]], DA.jupon);                                           // col montant de dentelle
        strokePts([[14, -150], [26, -126], [20, -100]], DA.or, 1.4);                                                 // galon doré
        for (let k = 0; k < 6; k++) dot(lerp(-18, 20, hash(seed + k)), lerp(-150, -96, hash(seed + k * 3)), 1.3, 'rgba(255,235,170,0.75)');   // paillettes
        hatch([[-60, -170], [-14, -170], [-30, 120], [-80, 120]], 0.75, 4.4, 0.24);
        shade(50, 0, -50, 0, 0.26, [-90, -200, 90, 140]);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(0.8), base: DA.basD, seed: seed + 2, noRivet: true, paint: legPaint(true) },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(0.8), base: DA.bas, seed: seed + 3, paint: legPaint(false) },
      armB_up: upDef([-10, -146], DA.peauD, seed + 4, () => { fillPts([[-20, -24], [20, -24], [18, 26], [-18, 28]], robeD); strokePts([[-16, 26], [16, 24]], 'rgba(255,240,220,0.4)', 1.4); }),
      armB_lo: foreDef('armB_up', DA.peauD, DA.peauD, true, seed + 5, 0),
      head: { parent: 'torso', at: [6, -170], pts: DA_HEAD, base: DA.peau, seed: seed + 6, noRivet: true, paint: (p) => {
        const f = Object.assign({}, p.face || {}), cl = clamp(p.clin || 0);
        if (cl > 0.5) { f.eyes = 'closed'; if (!f.mouth) f.mouth = 'smile'; }
        X.earPaint(-6, -44); dot(-4, -34, 2.4, DA.or);
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.18);
        dot(13, -30, 8, `rgba(215,110,110,${0.3 + 0.15 * cl})`);
        X.eye(f, 15, -45, 0.95);
        if (f.eyes !== 'closed') { strokePts([[9, -48], [7, -51]], 'rgba(28,16,14,0.9)', 1.2); strokePts([[13, -49], [12, -52]], 'rgba(28,16,14,0.9)', 1.2); }
        else strokePts([[10, -40], [18, -40]], 'rgba(150,80,70,0.4)', 1);
        X.brow(f, 15, cl > 0.5 ? -51 : -53, 'rgba(70,40,25,0.9)', 1.6);
        fillPts([[24, -22], [20, -21], [18, -19], [22, -18]], '#a83838', 0, 0);
        X.mouth(f, 23, -20, 'rgba(150,40,40,0.95)');
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: DA_HAIR, base: C.cheveux, seed: seed + 7, noRivet: true, paint: () => {
        strokePts([[16, -76], [0, -84], [-18, -82]], 'rgba(255,230,190,0.3)', 1.4); hatch(null, 0.5, 3.4, 0.22);
      }, extra: () => {
        pc(ell(-30, -74, 15, 13, 14), C.cheveux, () => hatch(null, 0.4, 3, 0.25), seed + 8);                         // chignon
        pc([[-30, -76, 1], [20, -86, 1], [22, -80, 1], [-30, -70, 1]], DA.or, () => strokePts([[-26, -73], [18, -82]], 'rgba(255,250,210,0.6)', 1), seed + 9);   // bandeau doré
        pc(ell(6, -84, 6, 6, 10), C.plume, () => dot(5, -85, 2.4, 'rgba(255,255,255,0.6)'), seed + 10);             // bijou
      } },
      plume: { parent: 'head', at: [-6, -86], pts: PLUME, base: C.plume, seed: seed + 11, noRivet: true, rest: -0.05, paint: () => {
        const line = qbez([0, 0], [10, -90], [-40, -150], 14);
        strokePts(line, 'rgba(0,0,0,0.3)', 1.2);
        for (let k = 2; k < 14; k++) { const a = line[k], b = line[k + 1] || a, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
          strokePts([[a[0], a[1]], [a[0] + (-dy / l) * 14 + dx / l * 6, a[1] + (dx / l) * 14 + dy / l * 6]], 'rgba(0,0,0,0.18)', 1);
          strokePts([[a[0], a[1]], [a[0] + (dy / l) * 14 + dx / l * 6, a[1] - (dx / l) * 14 + dy / l * 6]], 'rgba(255,255,255,0.3)', 1); }
      } },
      armF_up: upDef([-2, -146], DA.peau, seed + 12, () => { fillPts([[-20, -24], [20, -24], [18, 26], [-18, 28]], C.robe); strokePts([[-16, 26], [16, 24]], 'rgba(255,240,220,0.5)', 1.4); hatch([[-16, 30], [-3, 30], [-3, 100], [-16, 100]], 0.9, 3.8, 0.15); }),
      armF_lo: foreDef('armF_up', DA.peau, DA.peau, false, seed + 13, 0),
    };
    Object.assign(parts, heldParts(DA.peau, seed + 20));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-20, 20] }, nom: 'danseuse' + i,
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'plume', 'head', 'cheveux', 'torso', 'objetD', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  for (let i = 1; i <= 6; i++) CH['tobDanseuse' + i] = mkDanseuse(i);
  TOB.danseusePose = function (p, i) {
    const q = prep(p), A = q.ang, br = ease(clamp(q.bras || 0)), j = ease(clamp(q.jambe || 0)), po = ease(clamp(q.porte || 0)), t = q.t || 0;
    marche(q, q.marche);
    A.plume = (A.plume || 0) + 0.05 * Math.sin(t * 2.3 + (i || 0) * 1.7);
    if (br > 0) {                                                               // bras en V : avant levé devant, arrière levé derrière, poings fermés
      blend(q, 'armF_up', -2.55, br); blend(q, 'armF_lo', -0.22, br);
      blend(q, 'armB_up', 2.5, br); blend(q, 'armB_lo', -0.2, br);
      A.head = (A.head || 0) - 0.08 * br;
      if (!has(q.tenu)) q.handF = 'fist'; if (!has(q.tenuB)) q.handB = 'fist';
    }
    if (j > 0) { blend(q, 'legF', -1.45, j); q.tilt = (q.tilt || 0) - 0.07 * j; A.head = (A.head || 0) - 0.05 * j; }
    if (po > 0) {                                                               // tient la barre devant elle, à deux mains
      if (!has(q.tenu)) q.tenu = 'barre';
      q.tenuO = Object.assign({ k: 1.7, prise: 'centre' }, q.tenuO); if (q.deuxMains == null) q.deuxMains = true;
      blend(q, 'armF_up', -0.45, po); blend(q, 'armF_lo', -0.9, po);
    }
    if (!q.face.mouth) q.face.mouth = 'smile';
    return finish(q);
  };
  TOB.danseuse = (i, pose, x, y, s, o) => { i = Math.max(1, Math.min(6, i | 0)); return run(CH['tobDanseuse' + i], TOB.danseusePose(pose, i), x, y, s == null ? 0.53 : s, Object.assign({ nom: 'danseuse' + i }, o)); };

  // =====================================================================
  // ACCESSOIRES SEULS (sans tige) — M.puppet à une pièce invisible ; dessin dans l'extra
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accDraw(name, x, y, s, o, fn) {
    o = o || {};
    return M.puppet(accDef(name, fn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function acc(name, x, y, s, o, sDef) {
    const ob = OBJ[name];
    return accDraw(name, x, y, s == null ? (sDef || 0.9) : s, o, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); });
  }
  TOB.barre = (x, y, s, o) => acc('barre', x, y, s, o, 1.4);
  TOB.document = (x, y, s, o) => acc('document', x, y, s, o, 0.9);

  // =====================================================================
  // LE CERVIN EN CARTON — pic crochu à visage peint, suspendu à deux fils
  // =====================================================================
  const CV = { clair: '#8290a3', ombre: '#525c6c', gris: '#77828f', loin: '#6b7584', neige: '#ede8da', neigeO: '#b8c3cd', roc: '#46403d', rocC: '#6c625a', h: 560 };
  TOB.CERVIN = { h: 560, w: 556, fils: [[-100, -300], [100, -300]], sommet: [-116, -563], yeux: [[-38, -300], [30, -300]], bouche: [2, -236] };
  // silhouette en corne : haut très raide, crochet du sommet penché à gauche (face nord), ressaut du nez de Zmutt, épaule sur l'arête droite, base évasée
  const CV_PTS = [[-276, 0, 1], [-262, -26], [-246, -52, 1], [-226, -78], [-208, -104, 1], [-188, -128], [-172, -150, 1], [-160, -176], [-150, -206, 1], [-142, -240], [-134, -278, 1],
    [-127, -316], [-120, -356, 1], [-114, -396], [-108, -428, 1], [-126, -444, 1], [-118, -460, 1], [-104, -466, 1], [-100, -490], [-100, -512, 1], [-106, -530], [-113, -548, 1], [-116, -563, 1],
    [-102, -560, 1], [-82, -551, 1], [-62, -535], [-40, -514], [-18, -496], [0, -482, 1], [22, -452], [44, -422], [66, -392, 1], [86, -366], [100, -350, 1], [118, -344, 1], [130, -330, 1], [140, -306], [150, -280, 1],
    [164, -248], [176, -218, 1], [192, -184], [208, -150, 1], [224, -112], [240, -72, 1], [254, -36], [262, 0, 1]];
  // épaulement rocheux plus bas, derrière, à droite
  const CV_EPAULE = [[124, 0, 1], [138, -140], [156, -190, 1], [180, -210], [204, -234, 1], [218, -226, 1], [232, -206, 1], [250, -170], [264, -120, 1], [274, -64], [280, 0, 1]];
  const CV_ARETE = [[-116, -563], [-86, -505], [-58, -446], [-32, -384], [-14, -330], [-4, -290], [6, -246], [18, -196], [34, -136], [54, -70], [72, 0]];
  const CV_GLACIER = [[-276, -24, 1], [-268, -46], [-250, -58, 1], [-230, -76], [-208, -92, 1], [-186, -104], [-164, -112, 1], [-146, -108], [-128, -96, 1], [-112, -80], [-96, -64, 1],
    [-84, -46], [-100, -34, 1], [-150, -28], [-220, -24]];
  const CV_ROCS = [[-276, 0, 1], [-276, -30, 1], [-258, -44, 1], [-240, -38, 1], [-222, -62, 1], [-204, -56, 1], [-190, -40, 1], [-168, -52, 1], [-150, -74, 1], [-130, -60, 1], [-118, -40, 1], [-96, -46, 1],
    [-78, -30, 1], [-56, -44, 1], [-36, -36, 1], [-14, -58, 1], [8, -50, 1], [22, -34, 1], [44, -46, 1], [64, -40, 1], [84, -66, 1], [104, -58, 1], [118, -42, 1], [140, -50, 1], [160, -80, 1], [182, -70, 1],
    [198, -50, 1], [220, -62, 1], [244, -90, 1], [262, -74, 1], [280, -50, 1], [280, 0, 1]];
  function cvForme(pts, g) {                                                   // gonfle : le sommet crochu se redresse
    return pts.map((p) => { const u = clamp((-p[1] - 400) / 160); return [p[0] + g * 34 * u * u, p[1], p[2]].filter((v) => v !== undefined); });
  }
  function cvAreteX(y) { const A = CV_ARETE; for (let i = 1; i < A.length; i++) if (y <= A[i][1]) return lerp(A[i - 1][0], A[i][0], (y - A[i - 1][1]) / (A[i][1] - A[i - 1][1])); return A[A.length - 1][0]; }
  function drawCervin(o) {
    const c = cx_(), g = ease(clamp(o.gonfle || 0)), af = ease(clamp(o.affaisse || 0)), hu = clamp(o.humeur || 0, -1, 1), rg = clamp(o.regard || 0, -1, 1), t = o.t || 0;
    const sh = 0.08 * af, sc = 1 + 0.06 * g;
    const T = new DOMMatrix().scale(sc, sc).multiply(new DOMMatrix([1, 0, -sh, 1, 0, 0]));      // x' = x − sh·y : le pic s'incline vers la droite
    // fils (verticaux à l'écran, depuis les points d'accroche)
    if (o.fils !== false) for (const f of TOB.CERVIN.fils) { const q = mp(T, f); strokePts([[q[0], q[1]], [q[0], -4000]], 'rgba(25,20,18,0.75)', 1.3); }
    c.save(); c.transform(T.a, T.b, T.c, T.d, T.e, T.f);
    const gf = g - 0.7 * af, F = (p) => cvForme(p, gf), ar = F(CV_ARETE);
    const INK = 'rgba(28,32,44,', LUM = 'rgba(226,232,240,';
    // 1) épaulement rocheux (plan arrière, plus pâle)
    pc(CV_EPAULE, CV.loin, () => {
      fillPts([[204, -234], [218, -226], [232, -206], [226, -196], [214, -212], [196, -214]], CV.neige);
      for (let k = 0; k < 7; k++) { const y = -196 + k * 28; strokePts([[130, y + 10], [180, y + 18], [230, y + 30], [290, y + 44]], INK + '0.35)', 1); }
      hatch(null, -0.9, 5, 0.22, 1, undefined, [140, -270, 290, 0]);
    }, 6100);
    // 2) la pyramide : deux faces séparées par l'arête du Hörnli
    const sliver = (x0, y0, x1, y1, th, sd) => {                               // névé : lame de neige déchiquetée posée sur une vire
      const top = [], bot = [];
      for (let i = 0; i <= 6; i++) { const u = i / 6, x = lerp(x0, x1, u), y = lerp(y0, y1, u); top.push([x + (hash(sd + i) - 0.5) * 3, y - th * Math.pow(Math.sin(PI * u), 0.7) * (0.55 + 0.6 * hash(sd * 1.7 + i))]); bot.push([x, y + 1]); }
      return top.concat(bot.reverse());
    };
    const jag = (line, w0, w1, sd) => { const L = []; for (let i = 0; i < line.length - 1; i++) for (let j = 0; j < 4; j++) L.push([lerp(line[i][0], line[i + 1][0], j / 4), lerp(line[i][1], line[i + 1][1], j / 4)]); L.push(line[line.length - 1]);
      return ribbon(L, 0, 0, (u) => lerp(w0, w1, u) * (0.6 + 0.8 * hash(sd + Math.round(u * 40)))); };
    pc(F(CV_PTS), CV.gris, () => {
      fillPts([[-320, 10], [-320, -640], [ar[0][0], -640]].concat(ar), CV.clair);                         // face gauche éclairée, gris-bleu
      fillPts(ar.concat([[320, 10], [320, -640], [ar[0][0], -640]]), CV.ombre);                           // face droite dans l'ombre
      hatch(F([[-300, -600], [ar[0][0], -600]].concat(CV_ARETE.slice(1), [[-300, 0]])), 1.86, 6, 0.13);
      hatch(F(CV_ARETE.concat([[300, 0], [300, -600], [CV_ARETE[0][0], -600]])), 0.95, 3.6, 0.3);
      // nervures dans le sens de la pente (trait sombre + reflet), qui partent de l'arête
      for (let k = 0; k < 13; k++) {
        const y0 = -540 + k * 36 + 12 * hash(k * 2.9), xa = cvAreteX(y0), sideL = k % 3 !== 2, len = 70 + 90 * hash(k * 5.1);
        const dx = sideL ? -0.42 : 0.6, x0 = xa + (sideL ? -1 : 1) * (6 + 40 * hash(k * 1.3)), pts = [];
        for (let j = 0; j <= 5; j++) pts.push([x0 + dx * len * j / 5 + (hash(k * 13 + j) - 0.5) * 7, y0 + len * j / 5]);
        strokePts(F(pts), INK + (sideL ? '0.38)' : '0.5)'), 1.1); if (sideL) strokePts(F(pts.map((p) => [p[0] - 3, p[1]])), LUM + '0.3)', 1.1);
      }
      // vires (strates) courtes et cassées ; neige posée sur la plupart
      for (let k = 0; k < 30; k++) {
        const y = -515 + 330 * hash(k * 3.7 + 0.2), xa = cvAreteX(y), L = k % 5 < 3;
        const xe = L ? -(108 + 0.32 * (y + 430)) : (y < -350 ? 60 + 0.9 * (y + 420) : 150 + 0.55 * (y + 280)), u = 0.08 + 0.75 * hash(k * 1.9);
        const x0 = lerp(xa, xe, u), len = (L ? -1 : 1) * (18 + 40 * hash(k * 6.1)), sl = L ? 0.3 : 0.5;
        const x1 = x0 + len, y1 = y + Math.abs(len) * sl;
        strokePts(F([[x0, y + 1], [x1, y1 + 1]]), INK + '0.6)', 1.2);
        if (hash(k * 8.3) > 0.25) fillPts(F(sliver(x0, y, x1, y1, 3 + 6 * hash(k * 4.4), k * 17)), L ? CV.neige : '#d5dade');
      }
      // couloirs de neige en diagonale
      for (const [line, w0, w1, col, sd] of [
        [[[-24, -336], [-56, -292], [-90, -248], [-120, -214]], 4, 20, CV.neige, 300],
        [[[-74, -466], [-88, -436], [-100, -404]], 2, 7, CV.neige, 340],
        [[[46, -414], [70, -376], [94, -336], [114, -304]], 3, 14, '#d6dbe0', 380],
        [[[40, -232], [72, -196], [104, -164], [140, -134], [170, -112]], 4, 22, '#d6dbe0', 420]]) {
        fillPts(jag(F(line), w0, w1, sd), col); strokePts(F(line.map((p) => [p[0] + 3, p[1] + 4])), 'rgba(120,130,145,0.35)', 1);
      }
      // fissures
      for (let k = 0; k < 18; k++) {
        const y = -480 + 400 * hash(k * 1.7 + 0.3), side = k % 2 ? 1 : -1, x = lerp(cvAreteX(y), side * 150, 0.15 + 0.6 * hash(k * 2.3));
        const pts = [[x, y]]; for (let j = 1; j < 4; j++) pts.push([x + (hash(k * 3 + j) - 0.5) * 8 + side * j * 2, y + j * 8]);
        strokePts(F(pts), INK + '0.6)', 1.1);
      }
      // calotte sommitale et neige accrochée le long de l'arête
      fillPts(F([[-116, -563], [-102, -560], [-82, -551], [-70, -543], [-84, -546], [-100, -553], [-112, -556]]), CV.neige);
      for (const [x, y, w] of [[-82, -490, 8], [-52, -424, 8], [-28, -366, 7], [-8, -312, 6], [10, -224, 7], [26, -166, 6], [44, -104, 6]]) fillPts([[x - w - 5, y + 5], [x - 2, y - 4], [x, y + 3], [x - w, y + 12]], CV.neige);
      // arête du Hörnli : liseré clair côté soleil, trait sombre côté ombre
      strokePts(ar.map((p) => [p[0] - 2, p[1]]), LUM + '0.85)', 2.6);
      strokePts(ar.map((p) => [p[0] + 1.5, p[1]]), INK + '0.85)', 2);
      shade(0, -560, 0, 0, 0.16, [-300, -600, 300, 10]);
    }, 6101);
    // 3) glacier blanc à la base, côté gauche (séracs et crevasses)
    pc(CV_GLACIER, CV.neige, () => {
      fillPts([[-276, -40], [-240, -56], [-200, -64], [-160, -66], [-130, -52], [-118, -40], [-150, -30], [-276, -24]], CV.neigeO);           // front du glacier à l'ombre
      for (let k = 0; k < 5; k++) { const y = -50 - k * 12, x = -250 + k * 24; strokePts(qbez([x - 14, y + 10], [x + 14, y - 6], [x + 46, y + 4], 8), 'rgba(100,120,145,0.55)', 1.1); }   // crevasses
      for (let k = 0; k < 9; k++) { const x = -262 + k * 16; strokePts([[x, -44 - 4 * hash(k)], [x + 2, -30]], 'rgba(100,120,145,0.6)', 1); }      // séracs
      shade(-90, -190, -200, -40, 0.2, [-280, -200, -60, 0], '70,90,120');
    }, 6102);
    // 4) socle de rochers sombres (premier plan), taillés en blocs
    pc(CV_ROCS, CV.roc, () => {
      for (let i = 1; i < CV_ROCS.length - 1; i++) {
        const [px, py] = CV_ROCS[i], a = CV_ROCS[i - 1][1], b = CV_ROCS[i + 1][1];
        if (py < a && py < b && py < -36) { const [qx, qy] = CV_ROCS[i - 1]; fillPts([[qx, qy, 1], [px, py, 1], [px + 3, py + 20, 1], [qx + 4, qy + 10, 1]], CV.rocC); strokePts([[px, py], [px + 3, py + 20], [px - 2, py + 40]], 'rgba(18,14,12,0.6)', 1.1); }   // pan au soleil, arête de bloc
      }
      for (let k = 0; k < 16; k++) { const x = -262 + k * 35 + 10 * hash(k); strokePts([[x, -30 - 16 * hash(k + 3)], [x + 6, -20], [x + 1, -6]], 'rgba(18,14,12,0.7)', 1.2); }
      hatch(null, 0.9, 4, 0.3, 1, undefined, [-280, -95, 280, 0]);
      strokePts([[-276, -3], [280, -3]], 'rgba(30,26,22,0.5)', 2);                                          // bord de carton
    }, 6103);
    // 5) visage discret : petits yeux sous des sourcils de rocher, bouche fine (l'arête fait le nez)
    const [[ex1, ey], [ex2]] = TOB.CERVIN.yeux, lid = hu > 0 ? 0.25 + 0.3 * hu : 0.12 * (1 + hu), bl = clamp(1 - Math.abs(((t * 0.31) % 1) - 0.5) * 40);   // clignement bref
    for (const [ex, sgn, fc] of [[ex1, -1, CV.clair], [ex2, 1, CV.ombre]]) {
      fillPts(ell(ex, ey + 2, 20, 16, 14), 'rgba(24,28,40,0.36)');                                   // orbite creusée
      if (hu < -0.6) {                                                         // ravi : yeux plissés de joie
        strokePts(ep(ex, ey + 7, 13, 11, 10, PI * 1.08, PI * 1.92), 'rgba(24,20,22,0.95)', 3.8);
      } else {
        pc(ell(ex, ey, 14, 12, 16), '#f1ede2', () => {
          dot(ex + rg * 6, ey + 1.5, 6.2, '#1f1b1b'); dot(ex + rg * 6 - 2, ey - 0.8, 1.9, 'rgba(255,255,255,0.9)');
          const lv = clamp(Math.max(lid, bl)), yl = ey - 12 + 24 * lv;
          fillPts([[ex - 16, ey - 14], [ex + 16, ey - 14], [ex + 16, yl + sgn * hu * 4], [ex - 16, yl - sgn * hu * 4]], fc);    // paupière de roche
          strokePts([[ex - 14, yl - sgn * hu * 4], [ex + 14, yl + sgn * hu * 4]], 'rgba(24,20,22,0.85)', 1.8);
        }, 6110 + sgn);
      }
      // sourcil de rocher : ravi = relevé et arqué ; vexé = froncé (bout intérieur bas)
      const inner = ex - sgn * 18, outer = ex + sgn * 22, by = ey - 18 - 5 * Math.max(0, -hu), fr = 8 * Math.max(0, hu), ar2 = 4 * Math.max(0, -hu);
      const brow = [[outer + sgn * 3, by + 6, 1], [outer, by, 1], [ex + sgn * 4, by - 6 - ar2, 1], [inner, by - 2 + fr, 1], [inner - sgn * 3, by + 4 + fr, 1], [ex, by + 3 - ar2, 1]];
      fillPts(brow, '#3a414e'); strokePts(brow.slice(1, 4), LUM + '0.75)', 1.4);
    }
    const [mx, my] = TOB.CERVIN.bouche, cu = -hu;                              // bouche fine : sourire (ravi) … moue (vexé)
    if (hu < -0.6) pc([[mx - 18, my - 4, 1], [mx + 18, my - 4, 1], [mx + 11, my + 8], [mx, my + 12], [mx - 11, my + 8]], '#3e2224', () => fillPts([[mx - 7, my + 6], [mx + 7, my + 6], [mx, my + 12]], '#a65656'), 6120);
    else strokePts([[mx - 17, my - 5 * cu], [mx - 7, my + 3 * cu], [mx + 7, my + 3 * cu], [mx + 17, my - 5 * cu]], 'rgba(28,18,18,0.95)', 3.2);
    if (hu < -0.2) { dot(ex1 - 8, ey + 24, 10, 'rgba(205,120,120,0.36)'); dot(ex2 + 8, ey + 24, 10, 'rgba(205,120,120,0.36)'); }
    c.restore();
    // fanion suisse au sommet (rouge, croix blanche)
    const dr = clamp(o.drapeau || 0);
    if (dr > 0.01) {
      const s0 = mp(T, cvForme([TOB.CERVIN.sommet], g - 0.7 * af)[0]), H = 92 * dr;
      c.save(); c.translate(s0[0], s0[1]); c.rotate(0.05 * af);
      pc([[-2.5, 6, 1], [2.5, 6, 1], [2.5, -H, 1], [-2.5, -H, 1]], '#6b4a2e', null, 6130);
      const pend = af, wv = Math.sin(t * 4) * 0.08 * (1 - pend);
      c.translate(2, -H + 2); c.rotate(lerp(wv, 1.5, pend)); c.scale(1, lerp(1, 0.42, pend));
      const fs = 40 * Math.min(1, dr * 1.4);
      pc([[0, 0, 1], [fs, 3 * Math.sin(t * 4), 1], [fs, fs + 3 * Math.sin(t * 4), 1], [0, fs, 1]], '#c0302a', () => {
        const m = fs / 2, a = fs * 0.32, b = fs * 0.1;
        fillPts([[m - b, m - a, 1], [m + b, m - a, 1], [m + b, m - b, 1], [m + a, m - b, 1], [m + a, m + b, 1], [m + b, m + b, 1], [m + b, m + a, 1], [m - b, m + a, 1], [m - b, m + b, 1], [m - a, m + b, 1], [m - a, m - b, 1], [m - b, m - b, 1]], '#f4f0e6', 0, 0);
      }, 6131);
      c.restore();
    }
  }
  // descente : 0 = caché dans les cintres, 1 = posé ; 0→0,65 chute freinée, 0,65→1 rebond amorti (≈ 0,35 s si la descente dure 1 s)
  TOB.cervinDescente = function (u) {
    u = clamp(u);
    if (u < 0.65) { const p = u / 0.65; return 1 - (1 - p) * (1 - p); }
    const r = (u - 0.65) / 0.35; return 1 - 0.05 * Math.sin(r * TAU) * (1 - r) * (1 - r);
  };
  TOB.cervin = function (t, x, yBase, s, o) {
    o = Object.assign({ t }, o || {}); s = s == null ? 1 : s;
    const ds = o.descente == null ? 1 : o.descente, pos = TOB.cervinDescente(ds), yH = 130;
    const y = lerp(yH, yBase, pos);
    const sw = (o.balance == null ? 1 : o.balance) * 0.008 * Math.sin(t * 0.9);
    return accDraw('cervin', x, y, s, Object.assign({}, o, { rot: (o.rot || 0) + sw, slot: y }), drawCervin);
  };

  // =====================================================================
  // LA PYRAMIDE EN GRADINS — praticable rouge sang et or, frises de losanges
  // =====================================================================
  const GR = { y: [0, -232, -462], blocs: [[-320, 320, 0, -232], [-190, 190, -232, -462]], places: [[-200, 0], [0, 0], [200, 0], [-105, -232], [105, -232], [0, -462]] };
  TOB.GRADINS = { y: GR.y.slice(), x: GR.places.map((p) => p[0]), places: GR.places.map((p) => p.slice()), largeur: 640, hauteur: 462 };
  function drawGradins() {
    for (let b = 0; b < GR.blocs.length; b++) {
      const [x0, x1, yb, yt] = GR.blocs[b], dep = 16;
      pc([[x0 + 10, yt - dep, 1], [x1 - 10, yt - dep, 1], [x1, yt, 1], [x0, yt, 1]], '#a5463a', () => {                 // dessus de la marche
        for (let x = x0; x < x1; x += 26) strokePts([[x, yt], [x + 4, yt - dep]], 'rgba(60,20,10,0.25)', 1);
      }, 7001 + b);
      pc([[x0, yt, 1], [x1, yt, 1], [x1, yb, 1], [x0, yb, 1]], '#8a2a24', () => {
        fillPts([[x0, yt, 1], [x1, yt, 1], [x1, yt + 12, 1], [x0, yt + 12, 1]], '#b39250');                              // moulure dorée
        strokePts([[x0, yt + 3], [x1, yt + 3]], 'rgba(255,240,200,0.6)', 1.2);
        const fy = yt + 40, n = Math.round((x1 - x0) / 44);
        fillPts([[x0, fy - 20, 1], [x1, fy - 20, 1], [x1, fy + 20, 1], [x0, fy + 20, 1]], '#6e211c');
        for (let k = 0; k < n; k++) {                                                                                     // frise de losanges
          const cx = lerp(x0, x1, (k + 0.5) / n);
          fillPts([[cx, fy - 16, 1], [cx + 15, fy, 1], [cx, fy + 16, 1], [cx - 15, fy, 1]], '#b39250', 0, 0);
          fillPts([[cx, fy - 7, 1], [cx + 6, fy, 1], [cx, fy + 7, 1], [cx - 6, fy, 1]], '#8a2a24', 0, 0);
        }
        strokePts([[x0, fy - 20], [x1, fy - 20]], '#b39250', 1.6); strokePts([[x0, fy + 20], [x1, fy + 20]], '#b39250', 1.6);
        for (let k = 1; k < 4; k++) { const px = lerp(x0, x1, k / 4); strokePts([[px, fy + 30], [px, yb - 12]], 'rgba(40,10,8,0.35)', 1.3); }      // panneaux
        fillPts([[x0, yb - 10, 1], [x1, yb - 10, 1], [x1, yb, 1], [x0, yb, 1]], '#5a1a16');
        hatch(null, 0.8, 5, 0.18, 1, M.P.encre, [x0, yt, x1, yb]);
        shade(0, yt, 0, yb, 0.2, [x0, yt, x1, yb]);
      }, 7010 + b);
    }
  }
  TOB.gradins = (x, y, s, o) => accDraw('gradins', x, y, s == null ? 1 : s, o, drawGradins);
  TOB.place = (k, x, y, s) => { s = s == null ? 1 : s; const p = GR.places[k]; return [x + p[0] * s, y + p[1] * s]; };

  // =====================================================================
  // DÉCORS PRÉ-RENDUS — TOB.init() (dans S.init) → TOB.K
  // =====================================================================
  TOB.FAB = { fenetre: { x0: 330, x1: 710, y0: 330, y1: 800 }, bassine: { x: 830, y: 1080 }, etageres: [600, 760], lambris: 1000 };
  TOB.TABLE = { cx: 540, top: 1150, x0: 280, x1: 800 };
  TOB.CAB = { eiffel: { x: 800, y: 1060 }, colonnes: [150, 930], arc: { cx: 540, cy: 980, r: 400 } };
  function makeFabrique() {
    const H = ST.back + 5, F = TOB.FAB.fenetre;
    return M.pre(M.W, H, (x) => {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#cfb68a'); g.addColorStop(1, '#dcc59a');
      x.fillStyle = g; x.fillRect(0, 0, M.W, H);
      for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(120,90,50,${0.03 + 0.03 * hash(k)})`; x.fillRect(k * 80, 0, 40, TOB.FAB.lambris); }
      // fenêtre : toits de Berne
      pc([[F.x0 - 22, F.y0 - 22, 1], [F.x1 + 22, F.y0 - 22, 1], [F.x1 + 22, F.y1 + 18, 1], [F.x0 - 22, F.y1 + 18, 1]], '#6b4a2e', () => {
        const sk = x.createLinearGradient(0, F.y0, 0, F.y1); sk.addColorStop(0, '#b9c6cc'); sk.addColorStop(1, '#e2e2d4');
        x.fillStyle = sk; x.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
        // tour à horloge (sans chiffres)
        const tx = 560;
        pc([[tx - 34, F.y1, 1], [tx + 34, F.y1, 1], [tx + 34, 470, 1], [tx - 34, 470, 1]], '#a58a66', () => { hatch(null, 0.9, 4, 0.2); }, 7101);
        pc([[tx - 42, 472, 1], [tx, 380, 1], [tx + 42, 472, 1]], '#5c3a2a', () => hatch(null, -0.6, 3.6, 0.25), 7102);
        pc(ell(tx, 520, 20, 20, 16), '#e9dfbf', () => { strokePts([[tx, 520], [tx, 506]], '#2a2020', 2.2); strokePts([[tx, 520], [tx + 10, 524]], '#2a2020', 2.2); }, 7103);
        // toits de tuiles brunes
        const roofs = [[F.x0 - 10, 640, 120, 90], [F.x0 + 90, 610, 130, 120], [F.x0 + 260, 650, 140, 80], [F.x1 - 120, 600, 150, 130], [F.x0 + 180, 690, 110, 60]];
        roofs.forEach(([rx, ry, rw, rh], k) => {
          pc([[rx, F.y1 + 4, 1], [rx, ry + rh * 0.35, 1], [rx + rw / 2, ry, 1], [rx + rw, ry + rh * 0.35, 1], [rx + rw, F.y1 + 4, 1]], ['#7a4a30', '#8a5536', '#6e4129', '#80503a', '#734630'][k], () => {
            for (let yy = ry + 10; yy < F.y1; yy += 9) strokePts([[rx, yy], [rx + rw, yy]], 'rgba(40,20,10,0.3)', 1);
            fillPts([[rx, ry + rh * 0.35 + 30, 1], [rx + rw, ry + rh * 0.35 + 30, 1], [rx + rw, F.y1 + 4, 1], [rx, F.y1 + 4, 1]], '#cdbb98');
            for (let wx = rx + 14; wx < rx + rw - 14; wx += 30) fillPts([[wx, ry + rh * 0.35 + 46, 1], [wx + 12, ry + rh * 0.35 + 46, 1], [wx + 12, ry + rh * 0.35 + 64, 1], [wx, ry + rh * 0.35 + 64, 1]], '#5a5a5e');
          }, 7110 + k);
        });
        x.fillStyle = 'rgba(255,255,250,0.22)'; x.beginPath(); x.moveTo(F.x0, F.y1 - 60); x.lineTo(F.x0 + 150, F.y0); x.lineTo(F.x0 + 210, F.y0); x.lineTo(F.x0 + 40, F.y1); x.lineTo(F.x0, F.y1); x.fill();
        x.strokeStyle = '#6b4a2e'; x.lineWidth = 7; x.beginPath();
        for (let k = 1; k < 4; k++) { const xx = lerp(F.x0, F.x1, k / 4); x.moveTo(xx, F.y0); x.lineTo(xx, F.y1); }
        for (let k = 1; k < 6; k++) { const yy = lerp(F.y0, F.y1, k / 6); x.moveTo(F.x0, yy); x.lineTo(F.x1, yy); } x.stroke();
      }, 7100);
      pc([[F.x0 - 36, F.y1 + 12, 1], [F.x1 + 36, F.y1 + 12, 1], [F.x1 + 30, F.y1 + 30, 1], [F.x0 - 30, F.y1 + 30, 1]], '#8a6040', null, 7120);
      // étagères : moules et pots de cuivre (à gauche)
      for (const yy of TOB.FAB.etageres) {
        pc([[70, yy, 1], [290, yy, 1], [290, yy + 14, 1], [70, yy + 14, 1]], '#6b4a2e', () => hatch(null, 0.1, 3, 0.2), 7130 + yy);
        for (const bx of [84, 276]) pc([[bx - 4, yy + 14, 1], [bx + 4, yy + 14, 1], [bx + 4, yy + 40, 1], [bx - 12, yy + 14, 1]], '#553a24', null, 7140 + bx + yy);
        let px = 82, i = 0;
        while (px < 270) {
          if ((i + yy / 20) % 2 < 1) {                                          // pot de cuivre
            const w = 42, h = 40 + 10 * hash(i + yy);
            pc([[px, yy, 1], [px + w, yy, 1], [px + w + 2, yy - h * 0.8], [px + w - 4, yy - h, 1], [px + 4, yy - h, 1], [px - 2, yy - h * 0.8]], '#b06a3a', () => {
              strokePts([[px + 8, yy - h * 0.8], [px + 10, yy - 6]], 'rgba(255,220,170,0.6)', 2.2); hatch(null, 0.9, 3.4, 0.2);
            }, 7150 + i + yy);
            pc([[px + w, yy - h * 0.6, 1], [px + w + 26, yy - h * 0.6 - 4, 1], [px + w + 26, yy - h * 0.6 + 2, 1], [px + w, yy - h * 0.6 + 6, 1]], '#7a4424', null, 7160 + i + yy);
            px += w + 34;
          } else {                                                              // moule à chocolat (fer-blanc)
            const w = 50, h = 22;
            pc([[px, yy, 1], [px + w, yy, 1], [px + w - 4, yy - h, 1], [px + 4, yy - h, 1]], '#a9a69c', () => {
              for (let k = 1; k < 5; k++) strokePts([[px + k * w / 5, yy - h + 3], [px + k * w / 5, yy - 3]], 'rgba(60,60,60,0.4)', 1);
              strokePts([[px + 6, yy - h + 3], [px + w - 6, yy - h + 3]], 'rgba(255,255,255,0.5)', 1.2);
            }, 7170 + i + yy);
            px += w + 14;
          }
          i++;
        }
      }
      // lambris brun
      pc([[0, TOB.FAB.lambris, 1], [M.W, TOB.FAB.lambris, 1], [M.W, H, 1], [0, H, 1]], '#6b4a2e', () => {
        fillPts([[0, TOB.FAB.lambris, 1], [M.W, TOB.FAB.lambris, 1], [M.W, TOB.FAB.lambris + 16, 1], [0, TOB.FAB.lambris + 16, 1]], '#5a3c24');
        for (let k = 0; k < 9; k++) { const x0 = 20 + k * 120; strokePts([[x0, TOB.FAB.lambris + 40, 1], [x0 + 96, TOB.FAB.lambris + 40, 1], [x0 + 96, H - 40, 1], [x0, H - 40, 1], [x0, TOB.FAB.lambris + 40, 1]], 'rgba(30,18,8,0.5)', 1.6);
          strokePts([[x0 + 2, TOB.FAB.lambris + 42], [x0 + 94, TOB.FAB.lambris + 42]], 'rgba(255,220,170,0.25)', 1.2); }
        hatch(null, 0.2, 4, 0.18, 1, M.P.encre, [0, TOB.FAB.lambris, M.W, H]);
      }, 7180);
      // bassine de cuivre sur son fourneau (côté droit)
      const B = TOB.FAB.bassine;
      pc([[B.x - 100, H, 1], [B.x + 100, H, 1], [B.x + 92, B.y + 70, 1], [B.x - 92, B.y + 70, 1]], '#3f3a36', () => {
        for (let yy = B.y + 90; yy < H; yy += 26) strokePts([[B.x - 96, yy], [B.x + 96, yy]], 'rgba(0,0,0,0.4)', 1.2);
        fillPts([[B.x - 34, H - 110, 1], [B.x + 34, H - 110, 1], [B.x + 34, H - 60, 1], [B.x - 34, H - 60, 1]], '#1c1814');
        fillPts([[B.x - 26, H - 100, 1], [B.x + 26, H - 100, 1], [B.x + 26, H - 64, 1], [B.x - 26, H - 64, 1]], 'rgba(220,110,40,0.55)');
        hatch(null, 0.8, 4, 0.2, 1, M.P.encre, [B.x - 100, B.y, B.x + 100, H]);
      }, 7190);
      pc(ep(B.x, B.y, 118, 84, 16, 0, PI).concat([[B.x - 124, B.y - 6, 1], [B.x + 124, B.y - 6, 1]].reverse()), '#b06a3a', () => {
        strokePts(ep(B.x, B.y, 104, 70, 12, 0.3, PI - 0.3), 'rgba(255,220,170,0.4)', 2.4); hatch(null, 0.9, 3.6, 0.2, 1, M.P.encre, [B.x - 130, B.y - 10, B.x + 130, B.y + 90]);
        shade(B.x + 110, B.y, B.x - 110, B.y, 0.3, [B.x - 130, B.y - 10, B.x + 130, B.y + 90]);
      }, 7191);
      pc(ell(B.x, B.y - 4, 122, 14, 20), '#4a2a18', () => strokePts(ep(B.x, B.y - 4, 90, 8, 10, PI * 1.1, PI * 1.6), 'rgba(200,140,90,0.5)', 1.6), 7192);
      for (const sg of [-1, 1]) pc([[B.x + sg * 120, B.y + 4, 1], [B.x + sg * 144, B.y + 2, 1], [B.x + sg * 144, B.y + 14, 1], [B.x + sg * 120, B.y + 16, 1]], '#7a4424', null, 7193 + sg);
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, M.W, H);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      const vg = x.createLinearGradient(0, H - 120, 0, H); vg.addColorStop(0, 'rgba(40,30,20,0)'); vg.addColorStop(1, 'rgba(40,30,20,0.3)'); x.fillStyle = vg; x.fillRect(0, H - 120, M.W, 120);
    });
  }
  function makeTable() {
    const T = TOB.TABLE, w = T.x1 - T.x0 + 40, h = ST.back - T.top + 30;
    const cv = M.cutFlat(w, h, w / 2, h - 10, () => {
      const top = T.top - ST.back, hw = (T.x1 - T.x0) / 2;
      for (const lx of [-hw + 20, hw - 44]) pc([[lx, top + 30, 1], [lx + 24, top + 30, 1], [lx + 22, 0, 1], [lx + 2, 0, 1]], '#5e3e24', () => hatch(null, 1.2, 3.6, 0.25), 7201 + lx);
      pc([[-hw + 40, top + 50, 1], [hw - 40, top + 50, 1], [hw - 40, top + 62, 1], [-hw + 40, top + 62, 1]], '#4e3420', null, 7203);
      pc([[-hw - 6, top - 4, 1], [hw + 6, top - 4, 1], [hw + 6, top + 30, 1], [-hw - 6, top + 30, 1]], '#8a6040', () => {
        fillPts([[-hw - 6, top - 4, 1], [hw + 6, top - 4, 1], [hw + 6, top + 4, 1], [-hw - 6, top + 4, 1]], '#a87c54');
        for (let k = 0; k < 3; k++) strokePts([[-hw, top + 12 + k * 6], [hw, top + 13 + k * 6]], 'rgba(60,35,15,0.3)', 1);
        dot(-hw + 80, top + 1, 6, 'rgba(70,35,20,0.4)'); dot(hw - 140, top, 4, 'rgba(70,35,20,0.35)');
        hatch(null, 0.15, 4, 0.18, 1, M.P.encre, [-hw - 10, top - 6, hw + 10, top + 32]);
      }, 7204);
    });
    cv.padB = 10; return M.withShadow(cv, 8);
  }
  function makeCabaret() {
    const H = ST.back + 5, A = TOB.CAB.arc;
    return M.pre(M.W, H, (x) => {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#300c13'); g.addColorStop(0.5, '#521a24'); g.addColorStop(1, '#3e121b');
      x.fillStyle = g; x.fillRect(0, 0, M.W, H);
      for (let k = 0; k < 28; k++) {                                            // plis de velours
        const xx = k * 40 + 20, gg = x.createLinearGradient(xx - 20, 0, xx + 20, 0);
        gg.addColorStop(0, 'rgba(0,0,0,0.22)'); gg.addColorStop(0.5, 'rgba(255,120,120,0.07)'); gg.addColorStop(1, 'rgba(0,0,0,0.22)');
        x.fillStyle = gg; x.fillRect(xx - 20, 0, 40, H);
      }
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.6; x.fillStyle = M.tex.velvetPat || M.tex.canvasPat; x.fillRect(0, 0, M.W, H);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      // arc doré et lampes rondes allumées
      strokePts(ep(A.cx, A.cy, A.r + 18, A.r + 18, 40, PI, TAU), '#b39250', 10);
      strokePts(ep(A.cx, A.cy, A.r - 18, A.r - 18, 40, PI, TAU), '#8a6d38', 4);
      for (let k = 0; k <= 22; k++) {
        const a = PI + PI * k / 22, lx = A.cx + A.r * Math.cos(a), ly = A.cy + A.r * Math.sin(a);
        const gl = x.createRadialGradient(lx, ly, 2, lx, ly, 34); gl.addColorStop(0, 'rgba(255,225,150,0.55)'); gl.addColorStop(1, 'rgba(255,200,120,0)');
        x.fillStyle = gl; x.fillRect(lx - 34, ly - 34, 68, 68);
        pc(ell(lx, ly, 10, 10, 12), '#f6e2a8', () => dot(lx - 3, ly - 3, 3.5, 'rgba(255,255,255,0.9)'), 7300 + k, { texA: 0.2 });
      }
      // colonnes dorées
      for (const cx of TOB.CAB.colonnes) {
        pc([[cx - 34, H, 1], [cx + 34, H, 1], [cx + 30, 440, 1], [cx - 30, 440, 1]], '#b39250', () => {
          for (let k = -2; k <= 2; k++) strokePts([[cx + k * 11, 460], [cx + k * 12, H - 40]], 'rgba(70,50,20,0.5)', 1.6);
          strokePts([[cx - 18, 460], [cx - 20, H - 40]], 'rgba(255,240,190,0.5)', 2.2);
          shade(cx + 34, 0, cx - 34, 0, 0.3, [cx - 40, 400, cx + 40, H]);
        }, 7340 + cx);
        pc([[cx - 46, 440, 1], [cx + 46, 440, 1], [cx + 40, 410, 1], [cx - 40, 410, 1]], '#c9a650', () => strokePts([[cx - 40, 425], [cx + 40, 425]], 'rgba(70,50,20,0.5)', 1.4), 7350 + cx);
        pc([[cx - 46, H, 1], [cx + 46, H, 1], [cx + 42, H - 36, 1], [cx - 42, H - 36, 1]], '#9c7c3c', null, 7360 + cx);
      }
      // tentures à glands (lambrequin bordeaux, frange d'or)
      const sw = (x0, x1, y0, dy, seed) => {
        const pts = [[x0, 0, 1], [x1, 0, 1], [x1, y0, 1]].concat(qbez([x1, y0], [(x0 + x1) / 2, y0 + dy], [x0, y0], 14).slice(1));
        pc(pts, '#6e1e28', () => {
          for (let k = 1; k < 4; k++) strokePts(qbez([x1, y0 * k / 4], [(x0 + x1) / 2, y0 * k / 4 + dy * k / 4], [x0, y0 * k / 4], 10), 'rgba(0,0,0,0.3)', 1.6);
          strokePts(qbez([x1, y0 - 4], [(x0 + x1) / 2, y0 + dy - 4], [x0, y0 - 4], 14), '#b39250', 4);
          hatch(null, 0.6, 5, 0.18, 1, M.P.encre, [x0, 0, x1, y0 + dy]);
        }, seed);
      };
      sw(0, 380, 230, 110, 7370); sw(700, M.W, 230, 110, 7371); sw(300, 780, 200, 120, 7372);
      for (const [gx, gy] of [[380, 250], [700, 250], [40, 260], [1040, 260]]) {
        strokePts([[gx, gy - 30], [gx, gy + 30]], '#b39250', 2.4);
        pc([[gx - 7, gy + 30, 1], [gx + 7, gy + 30, 1], [gx + 12, gy + 70, 1], [gx - 12, gy + 70, 1]], '#c9a650', () => { for (let k = -9; k <= 9; k += 3) strokePts([[gx + k * 0.6, gy + 40], [gx + k, gy + 70]], 'rgba(90,60,20,0.6)', 1); }, 7380 + gx);
        pc(ell(gx, gy + 28, 8, 8, 10), '#b39250', null, 7390 + gx);
      }
      const vg = x.createLinearGradient(0, H - 160, 0, H); vg.addColorStop(0, 'rgba(20,5,8,0)'); vg.addColorStop(1, 'rgba(20,5,8,0.45)'); x.fillStyle = vg; x.fillRect(0, H - 160, M.W, 160);
    });
  }
  function makeEiffel() {
    // proportions vraies : 1er étage à 57/300 de la hauteur, 2e à 115/300, 3e à 276/300 ; base ≈ 0,5 × hauteur (légèrement élargie pour la lecture)
    const w = 300, h = 452;
    const cv = M.cutFlat(w, h, w / 2, h - 10, () => {
      const BR = '#7a5a3a', BRF = '#5e432b', LN = 'rgba(36,22,10,0.78)', LNf = 'rgba(36,22,10,0.5)', HI = 'rgba(246,208,150,0.42)', RIV = '#d2aa68';
      const prof = (P, y) => { for (let i = 1; i < P.length; i++) if (y >= P[i][0]) { const [y0, a] = P[i - 1], [y1, b] = P[i]; return lerp(a, b, (y - y0) / (y1 - y0)); } return P[P.length - 1][1]; };
      const OUT = [[0, 108], [-16, 95], [-32, 84], [-48, 76], [-64, 69], [-88, 58], [-110, 48], [-130, 40], [-150, 33], [-162, 28], [-200, 21], [-250, 15.5], [-300, 12], [-340, 10], [-366, 9]];
      const IN1 = [[0, 62], [-14, 57], [-64, 40]], IN2 = (y) => 31 * Math.max(0, 1 - Math.pow((-90 - y) / 52, 2));
      const side = (P, y0, y1, n, sg) => { const o = []; for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n); o.push(i === 0 || i === n ? [sg * prof(P, y), y, 1] : [sg * prof(P, y), y]); } return o; };
      const rv = (x, y) => dot(x, y, 1.5, RIV);
      // treillis d'une jambe : membrures, entretoises, croisillons en X, rivets aux nœuds
      function treillis(xo, xi, ys) {
        for (let i = 0; i < ys.length; i++) {
          const y = ys[i]; strokePts([[xo(y), y], [xi(y), y]], LN, 1.2);
          if (i) { const yp = ys[i - 1]; strokePts([[xo(yp), yp], [xi(y), y]], LN, 1); strokePts([[xi(yp), yp], [xo(y), y]], LN, 1);
            const ym = (y + yp) / 2; strokePts([[(xo(yp) + xi(yp)) / 2, yp], [(xo(y) + xi(y)) / 2, y]], LNf, 0.8); rv((xo(ym) + xi(ym)) / 2, ym); }
          rv(xo(y), y); rv(xi(y), y);
        }
        const N = 12, eo = [], ei = []; for (let i = 0; i <= N; i++) { const y = lerp(ys[0], ys[ys.length - 1], i / N); eo.push([xo(y), y]); ei.push([xi(y), y]); }
        strokePts(eo, LN, 2.4); strokePts(ei, LN, 2); strokePts(eo.map((p) => [p[0] + (p[0] < 0 ? 2.5 : -2.5), p[1]]), HI, 1.2);
      }
      const plateforme = (yb, yt, hb, ht, seed) => {
        pc([[-hb, yb, 1], [hb, yb, 1], [ht, yb - 0.45 * (yb - yt), 1], [ht, yt, 1], [-ht, yt, 1], [-ht, yb - 0.45 * (yb - yt), 1]], BR, () => {
          const ym = yb - 0.45 * (yb - yt);
          for (let x = -ht + 4; x < ht - 2; x += 8) strokePts(ep(x + 4, ym + 0.5 * (yb - ym), 3.4, 0.45 * (yb - ym), 6, PI, TAU), LN, 0.9);   // frise d'arcades
          strokePts([[-ht, ym], [ht, ym]], LN, 1.2);
          for (let x = -ht + 3; x <= ht - 3; x += 6) rv(x, (ym + yt) / 2);
          strokePts([[-ht, yt + 1.5], [ht, yt + 1.5]], HI, 1);
        }, seed, { texA: 0.5 });
        for (let x = -ht + 2; x <= ht - 2; x += 4) strokePts([[x, yt], [x, yt - 5]], LN, 0.8);                      // garde-corps
        strokePts([[-ht, yt - 5], [ht, yt - 5]], LN, 1.2);
      };
      // 1) les quatre piliers écartés et le grand arc
      const arc = ep(0, -14, 57, 48, 18, 0, -PI);
      pc(side(OUT, 0, -64, 4, -1).concat(side(OUT, -64, 0, 4, 1), [[62, 0, 1]], arc.map((p, i) => i === 0 || i === arc.length - 1 ? [p[0], p[1], 1] : p), [[-62, 0, 1]]), BR, () => {
        for (const sg of [-1, 1]) treillis((y) => sg * prof(OUT, y), (y) => sg * prof(IN1, y), [0, -14, -28, -42, -56, -64]);
        for (let x = -60; x < 60; x += 9) { strokePts([[x, -64], [x + 18, -14]], LNf, 0.8); strokePts([[x + 18, -64], [x, -14]], LNf, 0.8); }   // tympans ajourés
        strokePts(arc, LN, 2.4); strokePts(ep(0, -14, 51, 42, 18, 0, -PI), LN, 1.4);
        for (let a = 0.12; a < PI; a += 0.16) strokePts([[57 * Math.cos(-a), -14 + 48 * Math.sin(-a)], [51 * Math.cos(-a), -14 + 42 * Math.sin(-a)]], LN, 0.9);
        strokePts(ep(0, -14, 59, 50, 18, -PI, -0.02), HI, 1);
        shade(-110, 0, 110, 0, 0.22, [-120, -80, 120, 10]);
      }, 7401, { texA: 0.5 });
      // pied de maçonnerie sous chaque pilier
      for (const sg of [-1, 1]) pc([[sg * 58, 2, 1], [sg * 112, 2, 1], [sg * 110, -5, 1], [sg * 60, -5, 1]], '#8f8573', () => strokePts([[sg * 85, 2], [sg * 85, -7]], 'rgba(60,50,40,0.5)', 1), 7403 + sg);
      // 2) premier étage
      plateforme(-64, -90, 68, 74, 7404);
      // 3) les piliers se resserrent jusqu'au deuxième étage (jour en ogive entre eux)
      const og = qbez([31, -90], [28, -126], [0, -142], 8).concat(qbez([0, -142], [-28, -126], [-31, -90], 8).slice(1));
      pc(side(OUT, -90, -150, 4, -1).concat(side(OUT, -150, -90, 4, 1), og.map((p, i) => i === 0 || i === og.length - 1 ? [p[0], p[1], 1] : p)), BR, () => {
        for (const sg of [-1, 1]) treillis((y) => sg * prof(OUT, y), (y) => sg * Math.max(2, IN2(y)), [-90, -105, -120, -135, -150]);
        strokePts(og, LN, 1.8);
        shade(-60, 0, 60, 0, 0.22, [-70, -160, 70, -90]);
      }, 7408, { texA: 0.5 });
      // 4) deuxième étage
      plateforme(-150, -164, 36, 41, 7409);
      // 5) long fût effilé jusqu'au troisième étage
      pc(side(OUT, -169, -366, 8, -1).concat(side(OUT, -366, -169, 8, 1), [[13, -169, 1], [0, -214, 1], [-13, -169, 1]]), BR, () => {
        const ys = []; for (let y = -169; y >= -366; y -= y > -260 ? 19 : 15) ys.push(y); ys.push(-366);
        for (const sg of [-1, 1]) treillis((y) => sg * prof(OUT, y), (y) => sg * Math.max(0.6, 13 * (y + 214) / 45), ys);
        strokePts([[0, -214], [0, -366]], LN, 1.4);
        shade(-28, 0, 28, 0, 0.24, [-30, -370, 30, -160]);
      }, 7410, { texA: 0.5 });
      // 6) troisième étage, campanile, antenne
      plateforme(-366, -375, 12, 15, 7411);
      pc([[-8, -380, 1], [8, -380, 1], [8, -390, 1], [-8, -390, 1]], BRF, () => { for (const x of [-4.5, 0, 4.5]) dot(x, -385, 1.2, '#e7c27c'); }, 7412);
      pc([[-5, -390, 1], [5, -390, 1], [4, -397, 1], [-4, -397, 1]], BR, () => strokePts([[0, -390], [0, -397]], LN, 0.8), 7413);
      pc(ep(0, -397, 4.5, 5.5, 8, PI, TAU), BR, null, 7414);
      pc([[-1.6, -401, 1], [1.6, -401, 1], [1, -440, 1], [-1, -440, 1]], BRF, null, 7415);
      for (const y of [-412, -424]) strokePts([[-4, y], [4, y]], LN, 1);
    });
    cv.padB = 10; return M.withShadow(cv, 6);
  }
  // vapeur de la bassine (dessin direct, appelée dans S.draw après le décor)
  TOB.vapeur = function (t, x, y, s) {
    if (x == null) { x = TOB.FAB.bassine.x; y = TOB.FAB.bassine.y - 10; } s = s == null ? 1 : s;
    const c = M.ctx(); c.save();
    for (let k = 0; k < 7; k++) {
      const u = ((t * 0.32 + k / 7) % 1), px = x + (k - 3) * 22 * s + Math.sin(t * 1.3 + k) * 14 * s, py = y - u * 260 * s, r = (16 + 30 * u) * s;
      const gg = c.createRadialGradient(px, py, 1, px, py, r); gg.addColorStop(0, `rgba(250,244,232,${0.32 * (1 - u)})`); gg.addColorStop(1, 'rgba(250,244,232,0)');
      c.fillStyle = gg; c.fillRect(px - r, py - r, 2 * r, 2 * r);
    }
    c.restore();
  };
  TOB.init = function () {
    if (TOB.K) return TOB.K;
    const K = (TOB.K = {});
    K.fabrique = makeFabrique(); K.table = makeTable(); K.cabaret = makeCabaret(); K.eiffel = makeEiffel();
    return K;
  };
})();
