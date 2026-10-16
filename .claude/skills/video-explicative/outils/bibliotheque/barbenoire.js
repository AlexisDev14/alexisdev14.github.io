// persos.js — « Barbe Noire, le pirate qui fumait » : marionnettes et accessoires PROPRES À CETTE VIDÉO. Espace M.bn (alias BN). Appeler BN.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte ni lettre. Déterministe (hash, jamais Math.random).
// MARIONNETTES (avec tige ; (x,y) = pieds ; slot: ST.slotF / ST.slotB) : BN.barbeNoire, BN.marin (modele 'a'|'b'|'c'), BN.otage (modele 'conseiller'|'planteur'|'marchand').
// ACCESSOIRES (sans tige) : BN.coffreOr, BN.tete, BN.fumee, BN.sabre, BN.drapeau. Point nommé d'un objet tenu : BN.pt(r, 'pointe'|'garde'|'haut').
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const BN = (M.bn = {});
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
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
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
  function qbez(p0, p1, p2, n, u1) { const o = []; u1 = u1 == null ? 1 : u1; for (let i = 0; i <= n; i++) { const t = u1 * i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));

  // bras à articulations rondes (épaule et coude en demi-cercles centrés sur le pivot) — repris du Téflon
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const sc = pick === 'plie' ? -normA(cAbs - a) : pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1];
      if (!best || sc > best.sc) best = { a: normA(a), b: normA(cAbs - a), sc };
    }
    return best;
  }

  // =====================================================================
  // FUMÉE — volutes grises qui montent (dessinées dans le repère COURANT ; pour les marionnettes : en coordonnées écran)
  // =====================================================================
  function volutes(x, y, sc, t, o) {
    o = o || {}; const k = clamp(o.k == null ? 1 : o.k); if (k < 0.01 || SIL()) return;
    const c = cx_(), n = o.n || 7, h = (o.h || 190) * sc, w = o.w || 1, vent = (o.vent || 0) * sc, sd = o.seed || 0;
    const pf = [];
    for (let i = 0; i < n; i++) { const rate = 0.42 + 0.16 * hash(sd * 3.1 + i * 1.7); pf.push({ i, u: (t * rate + i / n + 0.37 * hash(sd + i * 5.3)) % 1 }); }
    pf.sort((a, b) => b.u - a.u);
    c.save(); c.lineCap = 'round';
    if (o.fil !== false) {                                                       // filet fin qui part de la source
      c.beginPath(); c.moveTo(x, y);
      for (let j = 1; j <= 8; j++) { const v = j / 8; c.lineTo(x + Math.sin(v * 5 + t * 3 + sd) * 3 * sc * v + vent * 0.06 * v, y - v * 30 * sc * w); }
      c.strokeStyle = `rgba(140,136,130,${0.6 * k})`; c.lineWidth = 2.2 * sc * w; c.stroke();
    }
    for (const p of pf) {
      const u = p.u, a = k * 0.86 * sm(0, 0.1, u) * Math.pow(1 - u, 0.75);
      if (a < 0.01) continue;
      const yy = y - 22 * sc * w - u * h, xx = x + Math.sin(u * 4.6 + t * 1.1 + p.i * 2.3 + sd) * 11 * u * sc * w + vent * Math.pow(u, 1.5);
      const r = (6 + 25 * u) * sc * w, g = Math.round(lerp(92, 158, u));
      c.globalAlpha = a;
      c.beginPath(); c.arc(xx, yy, r, 0, TAU); c.fillStyle = `rgb(${g},${g - 3},${g - 7})`; c.fill();
      c.beginPath(); c.arc(xx - r * 0.28, yy - r * 0.3, r * 0.52, 0, TAU); c.fillStyle = 'rgba(232,228,220,0.38)'; c.fill();
      if (p.i % 2 === 0 && r > 6 * sc) {                                         // volute : petite spirale de papier
        c.beginPath();
        for (let j = 0; j <= 16; j++) { const aa = j / 16 * TAU * 1.15 + t * 0.8 + p.i, rr = r * 0.72 * (1 - j / 20), px = xx + Math.cos(aa) * rr, py = yy + Math.sin(aa) * rr * 0.8; if (j) c.lineTo(px, py); else c.moveTo(px, py); }
        c.strokeStyle = 'rgba(60,56,52,0.5)'; c.lineWidth = 1.3 * sc; c.stroke();
      }
    }
    c.restore();
  }
  // fumée d'un point local de la pièce courante, dessinée à l'écran (monte toujours verticalement)
  function fumeeEcran(lx, ly, t, o) {
    if (SIL()) return;
    const c = cx_(), m = c.getTransform(), p = mp(m, [lx, ly]), sc = Math.hypot(m.a, m.b), face = Math.sign(m.a * m.d - m.b * m.c) || 1;
    const oo = Object.assign({}, o); if (oo.vent == null) oo.vent = -face * 34; else oo.vent *= face;   // vent par défaut : vers la nuque (le visage reste libre)
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); volutes(p[0], p[1], sc, t, oo); c.restore();
  }
  BN.fumee = (x, y, s, t, o) => volutes(x, y, s == null ? 1 : s, t || 0, o);

  // =====================================================================
  // OBJETS TENUS — sabre (coutelas de carton) et chiffon blanc ; origine = point de prise
  // =====================================================================
  function drawSabre() {
    pc([[-5, -16], [-6, -60], [-4, -110], [2, -150], [12, -172, 1], [15, -150], [14, -108], [10, -60], [7, -16]], '#b5bac0', () => {
      strokePts([[-1, -22], [0, -110], [7, -160]], 'rgba(255,255,255,0.8)', 1.6); strokePts([[9, -22], [11, -104]], 'rgba(60,64,70,0.5)', 1.1);
      hatch(null, 0.3, 4.4, 0.12);
    }, 7101, { texA: 0.35 });
    pc([[-15, -21], [17, -23], [21, -15], [17, -9], [-15, -10], [-19, -15]], P.or, () => strokePts([[-12, -18], [15, -19]], 'rgba(255,240,190,0.6)', 1.2), 7102);
    pc([[-6, -10], [6, -10], [7, 18], [-7, 18]], '#2a1e18', () => { for (let y = -6; y < 16; y += 4) strokePts([[-6, y], [6, y + 2]], 'rgba(200,170,120,0.35)', 1); }, 7103);
    pc(ell(0, 22, 7.5, 6, 10), P.or, () => dot(-2, 20, 2, 'rgba(255,240,190,0.7)'), 7104);
    pc([[15, -12], [24, -2], [24, 14], [8, 26], [4, 21], [17, 10], [17, -2], [10, -10]], P.orD, null, 7105);
  }
  function drawDrapeau(o) {
    const t = o.t || 0;
    pc(R4(-3, -98, 3, 26), P.boisL, () => strokePts([[-1, -96], [-1, 24]], 'rgba(255,240,210,0.4)', 1), 7201);
    const top = [], bot = [];
    for (let j = 0; j <= 6; j++) { const x = j * 14, wv = Math.sin(x * 0.07 - t * 8) * 6 * (j / 6); top.push([3 + x, -96 + wv + j * 2]); bot.push([3 + x * 0.94, -46 + wv + j * 4]); }
    pc(top.concat(bot.reverse()), '#ece6d6', () => {
      for (let j = 1; j < 5; j++) { const x = j * 17; strokePts([[3 + x, -94 + j * 2], [3 + x * 0.95, -48 + j * 3]], 'rgba(120,110,90,0.35)', 1.1); }
      hatch(null, 0.6, 4, 0.12);
    }, 7202, { texA: 0.5 });
  }
  const OBJ = {
    sabre: { draw: drawSabre, grip: [0, 0], pts: { pointe: [12, -172], garde: [0, -16] }, base: [0, 28] },
    drapeau: { draw: drawDrapeau, grip: [0, 0], pts: { haut: [0, -98] }, base: [0, 26] },
  };
  BN.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, OBJ[name].held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const CORDE = '#9c8a62';
  const LIENS = [[-17, -12], [15, -14], [19, -2], [17, 12], [-15, 14], [-19, 2]];
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      // corde qui lie les deux poignets (pose.mains)
      liens: { parent: 'armF_lo', at: [2, 80], noRivet: true, base: CORDE, seed: seed + 5, pts: (p) => (p._liees ? LIENS : OFFP), paint: () => {
        for (let x = -16; x <= 16; x += 5) strokePts([[x, -13], [x + 4, 13]], 'rgba(60,45,25,0.6)', 1.2);
        strokePts([[-18, 0], [18, -1]], 'rgba(60,45,25,0.55)', 1.4); hatch(null, 0.9, 3, 0.2);
      }, extra: (p) => { if (!p._liees) return; pc([[6, 12], [10, 12], [8, 34], [3, 40], [2, 34]], CORDE, null, seed + 6); } },
    };
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par BN.barbeNoire / marin / otage
  BN.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q = ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
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
  function plier(q, th) {                                                      // plie le buste aux hanches (th > 0 = vers l'avant), jambes droites
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function liees(q, k) {                                                       // mains liées devant la ceinture
    if (k <= 0) return;
    armTo(q, 'armF', [36, 14], 'bas', k); armTo(q, 'armB', [32, 18], 'bas', k);
    if (!has(q.tenu)) q.handF = 'fist'; if (!has(q.tenuB)) q.handB = 'fist';
    q._liees = k > 0.6;
  }
  function tremble(q, k) {
    if (k <= 0) return;
    const t = q.t || 0, A = q.ang;
    q.dx = (q.dx || 0) + Math.sin(t * 47) * 1.8 * k; A.head = (A.head || 0) + Math.sin(t * 37) * 0.035 * k;
    A.armF_lo = (A.armF_lo || 0) + Math.sin(t * 43) * 0.07 * k; A.armB_lo = (A.armB_lo || 0) + Math.sin(t * 41 + 1) * 0.07 * k;
    A.legF = (A.legF || 0) + Math.sin(t * 39) * 0.03 * k;
    if (!q.face.brow) q.face.brow = 'worry';
  }
  // garde-fou des coudes (marins, otages) : le coude reste sous la ligne épaule–main, vers l'arrière (avant-bras plié vers l'avant : armX_lo ≤ 0).
  // Un angle de coude positif (coude « à l'envers », p. ex. M.ik avec bendSign −1) est remplacé par l'autre solution qui met la main AU MÊME ENDROIT.
  function coudeBas(q, arm) {
    const A = q.ang, a = A[arm + '_up'] || 0, b = A[arm + '_lo'] || 0;
    if (b <= 0) return;
    const S = arm === 'armF' ? SH_F : SH_B;
    const H = mp(new DOMMatrix().translate(S[0], S[1]).rotate(a * D).translate(0, LA).rotate(b * D), [4, 96]);
    const sol = ik2(S, H, 'plie');
    if (sol.b < b) { A[arm + '_up'] = sol.a; A[arm + '_lo'] = Math.min(0, sol.b); }
  }
  // gestes communs aux marins et aux otages
  function gestes(q) {
    const t = q.t || 0, lv = ease(k01(q.leve)), dr = k01(q.drapeau), hh = ease(k01(q.hanches)), ta = ease(k01(q.tate));
    if (dr > 0 && q.tenu == null) q.tenu = 'drapeau';
    if (lv > 0) {
      blend(q, 'armF_up', -2.75, lv); blend(q, 'armF_lo', -0.25, lv); blend(q, 'armB_up', -2.5, lv); blend(q, 'armB_lo', -0.4, lv);
      if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; q.ang.head = (q.ang.head || 0) + 0.06 * lv;
    }
    if (hh > 0) { armTo(q, 'armF', [-14, -28], 'arriere', hh); armTo(q, 'armB', [-24, -28], 'arriere', hh); if (!has(q.tenu)) q.handF = 'fist'; if (!has(q.tenuB)) q.handB = 'fist'; }
    if (ta > 0) { blend(q, 'armF_up', 0.15, ta); blend(q, 'armF_lo', -2.7 + 0.12 * Math.sin(t * 11), ta); if (!has(q.tenu)) q.handF = 'open'; q.ang.head = (q.ang.head || 0) + 0.12 * ta; }   // coude en bas, main qui frotte le haut du bras opposé
    if (k01(q.mains) > 0) liees(q, ease(k01(q.mains)));
    tremble(q, k01(q.tremble));
    coudeBas(q, 'armF'); coudeBas(q, 'armB');
    return finish(q);
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o || {});
    r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // une marionnette qui pivote sur elle-même : o.dir = BN.tourne(u) (u 0 → 1 : de face à droite → face à gauche)
  BN.tourne = (u) => { const d = Math.cos(PI * clamp(u)); return Math.abs(d) < 0.07 ? (d < 0 ? -0.07 : 0.07) : d; };

  // ---------------- pièces de corps communes
  const upDef = (at, base, seed, L) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: (p) => {
    if (L && L.nu && L.nu(p)) { fillPts(R4(-30, -30, 30, 120), L.peau); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.2); return; }
    hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28);
  } });
  // L : { peau, back, manchette (couleur du parement), galon, dentelle, nu(p) }
  function foreDef(parent, base, seed, L) {
    const hk = (p) => (L.back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p), nu = L.nu && L.nu(p);
      if (nu) fillPts(R4(-30, -20, 30, 140), L.peau);
      else if (L.manchette) { fillPts(R4(-24, 40, 24, 78), L.manchette); if (L.galon) strokePts([[-14, 41], [14, 41]], L.galon, 2.2); }
      fillPts(R4(-20, 76, 24, 130), L.peau); X.handPaint(null, k);
      if (!nu && L.dentelle) { fillPts([[-12, 70], [12, 70], [14, 80], [8, 77], [4, 82], [0, 77], [-4, 82], [-8, 77], [-13, 80]], L.dentelle); }
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  // L : { culotte (y bas de culotte), bas (couleur des bas), botte (y haut de botte), botteCol, revers, chaus, boucle, peau, nu(p) }
  function legDef(at, base, seed, back, L) {
    return { parent: 'torso', at, pts: X.legPts(0.95), base, seed, noRivet: !!back, paint: (p) => {
      const nu = L.nu && L.nu(p);
      if (nu) fillPts(R4(-40, -30, 60, 216), L.peau);
      else if (L.bas) fillPts(R4(-40, L.culotte, 60, 216), L.bas);
      if (!nu && L.botte != null) {
        fillPts(R4(-40, L.botte, 60, 262), L.botteCol);
        if (L.revers) fillPts(R4(-40, L.botte, 60, L.botte + 16), L.revers);
        if (!back) strokePts([[16, L.botte + 24], [16, 210]], 'rgba(255,255,255,0.14)', 2.5);
      } else fillPts(R4(-40, 214, 60, 262), L.chaus);
      if (L.boucle && !nu) fillPts(R4(20, 218, 30, 226), '#c9c2b0');
      if (!nu && L.culotte != null && !L.botte) strokePts([[-22, L.culotte], [22, L.culotte]], 'rgba(30,20,15,0.5)', 1.4);
      if (!back) { strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
    } };
  }

  // =====================================================================
  // BARBE NOIRE — tricorne noir à galon or + plume rouge, barbe noire de jais tressée jusqu'à la ceinture, six mèches de chanvre,
  // redingote bleu nuit #1f2a44, écharpe rouge #7a1f1f, bandoulière de pistolets, sabre au côté, bottes noires
  // =====================================================================
  const BB = { peau: '#cfa57e', peauD: '#b48862', coat: '#1f2a44', coatD: '#172036', coatL: '#2e3c5e', sash: '#7a1f1f', sashD: '#561414',
    galon: '#a8873f', galonL: '#d4b66c', barbe: '#131117', barbeL: '#454a5c', cuir: '#4e3220', cuirD: '#36231a', botte: '#141317', botteL: '#2c2a30',
    culotte: '#2a2a32', chemise: '#e8e0cc', meche: '#7b756b', bois: '#6b4a2c', acier: '#80868c' };
  const BB_TORSO = [[-14, -178], [8, -182], [18, -170], [30, -150], [40, -114], [43, -62], [40, -14], [46, 50], [54, 130, 1], [-52, 132, 1], [-48, 60], [-42, 0], [-42, -60], [-42, -112], [-38, -150], [-28, -168]];
  // barbe pendante (repère : rivet sous le menton) — une grande barbe, tressée, qui se partage en deux nattes nouées de rouge
  const BEARD = [[-34, -16], [-18, -13], [0, -11], [14, -12], [23, -4], [27, 16], [29, 48], [27, 84], [21, 110], [17, 122],
    [19, 146], [15, 168], [9, 184, 1], [3, 170], [3, 146], [-1, 130], [-5, 146], [-9, 170], [-15, 182, 1], [-21, 166], [-20, 144], [-22, 122],
    [-28, 96], [-34, 60], [-38, 24], [-38, 0]];
  const CHEEK = [[-16, -64], [-6, -60], [-1, -46], [6, -37], [14, -35], [22, -33], [30, -32], [34, -28], [33, -22], [32, -14], [28, -6], [20, -1], [6, 6], [-10, 8], [-22, -12], [-24, -36], [-26, -60]];
  // tricorne (repère : milieu du bord inférieur, posé sur la tête)
  const TRI = [[-66, -32, 1], [-52, -14], [-30, -2], [0, 4], [30, 0], [50, -10], [68, -30, 1], [52, -24], [36, -22], [32, -42], [14, -58], [-10, -60], [-28, -50], [-36, -28], [-48, -28]];
  const TRI_BORD = [[68, -30], [52, -24], [36, -22], [0, -20], [-36, -26], [-66, -32]];
  const PLUME_C = qbez([18, -54], [-34, -84], [-92, -30], 12);
  const PLUME = (() => { const L = [], Rr = []; PLUME_C.forEach((q, i) => { const u = i / 12, w = 2 + 9 * Math.sin(PI * Math.min(1, u * 1.1)) * (1 - 0.3 * u), j = i % 2 ? 2.5 : 0; L.push([q[0], q[1] - w - j]); Rr.push([q[0] + j * 0.5, q[1] + w * 0.8 + j]); }); return L.concat(Rr.reverse()); })();
  // perruque poudrée (même objet sur le conseiller et sur le tricorne) — repère de la tête
  const WIG = [[30, -80], [26, -93], [12, -105], [-8, -109], [-28, -101], [-40, -85], [-45, -62], [-45, -40], [-39, -24], [-47, -14], [-50, 4], [-44, 14], [-34, 8], [-28, -10], [-20, -24], [-12, -34], [-12, -50], [-6, -62], [6, -71], [18, -75]];
  function wigPaint() {
    for (const [x, y] of [[-24, -50], [-26, -36], [-28, -22]]) { fillPts(ell(x, y, 15, 6, 12), '#e3ded3'); strokePts(ep(x, y, 15, 6, 12, PI * 0.5, PI * 2.3), 'rgba(120,115,105,0.8)', 1.4); }
    for (let i = 0; i < 6; i++) strokePts([[18 - i * 9, -98 + i * 2], [10 - i * 10, -76 + i * 4]], 'rgba(150,145,135,0.45)', 1.1);
    fillPts([[-50, -6], [-40, -10], [-38, 2], [-46, 8], [-56, 2], [-52, -4]], '#1d1b1f');                     // nœud noir de la queue
    hatch(null, 0.7, 3.6, 0.12); shade(-40, -60, 20, -100, 0.18, [-60, -112, 34, 16]);
  }
  // mèches de chanvre : racine sous le bord du tricorne, milieu, bout (repère de la tête) ; ordre d'apparition
  const MECHES = [[[44, -84], [52, -70], [52, -50]], [[-40, -82], [-48, -64], [-46, -42]], [[58, -88], [66, -74], [68, -56]],
    [[-54, -86], [-62, -70], [-64, -52]], [[30, -84], [36, -74], [38, -62]], [[-26, -84], [-30, -70], [-28, -54]]];
  function mecheG(meches, i) { return clamp((meches == null ? 1 : meches) * 6 - i); }
  function drawMeches(p) {
    const fu = clamp(p.fume || 0), t = p.t || 0;
    MECHES.forEach((m, i) => {
      const g = mecheG(p.meches, i); if (g <= 0.01) return;
      const line = qbez(m[0], m[1], m[2], 8, g);
      pc(ribbon(line, 3.6, 3.2), BB.meche, () => { for (let j = 1; j < line.length; j++) strokePts([[line[j][0] - 2, line[j][1] - 2], [line[j][0] + 2, line[j][1] + 2]], 'rgba(70,64,56,0.55)', 0.9); }, 7400 + i, { drop: false, texA: 0.3 });
      const tp = line[line.length - 1], gl = fu * (0.75 + 0.25 * Math.sin(t * 7 + i * 1.9));
      dot(tp[0], tp[1], 3.6, gl > 0.05 ? M.mixc('#3a3530', '#d8682a', clamp(gl * 1.2)) : '#3a3530');
      if (gl > 0.05 && !SIL()) {
        const c = cx_(); c.save(); c.globalAlpha = 0.45 * gl;
        const g2 = c.createRadialGradient(tp[0], tp[1], 0, tp[0], tp[1], 13); g2.addColorStop(0, 'rgba(255,170,80,0.9)'); g2.addColorStop(1, 'rgba(255,120,40,0)');
        c.fillStyle = g2; c.beginPath(); c.arc(tp[0], tp[1], 13, 0, TAU); c.fill(); c.restore();
        dot(tp[0], tp[1], 1.8, '#ffd08a');
      }
    });
  }
  function fumeeMeches(p) {
    const fu = clamp(p.fume || 0); if (fu <= 0.01) return;
    MECHES.forEach((m, i) => { if (mecheG(p.meches, i) < 0.98) return; fumeeEcran(m[2][0], m[2][1], p.t || 0, { k: fu * 0.75, n: 5, h: 150, w: 0.68, seed: i * 7 + 3, vent: m[2][0] > 0 ? 30 : -34 }); });
  }
  function fumeeBarbe(p) {
    const fu = clamp(p.fume || 0); if (fu <= 0.01) return;
    fumeeEcran(-30, 24, p.t || 0, { k: fu, n: 6, h: 200, w: 0.95, seed: 31 });
    fumeeEcran(-26, 96, (p.t || 0) + 0.4, { k: fu * 0.85, n: 5, h: 170, w: 0.8, seed: 47 });
  }
  function beardPaint() {
    const L = BB.barbeL;
    for (const [x0, x1] of [[-6, -9]]) for (let y = -2; y < 122; y += 8) { const x = lerp(x0, x1, y / 122), wd = 13 - y / 40; strokePts([[x - wd, y - 3], [x, y + 3], [x + wd, y - 3]], L, 1.5); }
    for (const [x0, y0] of [[9, 128], [-12, 128]]) for (let y = y0; y < 174; y += 7) strokePts([[x0 - 5, y - 2], [x0 - 1 + (y - y0) * 0.02, y + 2], [x0 + 4, y - 2]], L, 1.2);
    for (const x of [-28, 18]) strokePts([[x, 0], [x + (x < 0 ? -2 : 2), 50], [x * 0.7, 100]], 'rgba(90,96,116,0.6)', 1.1);
    fillPts([[3, 124], [17, 122], [18, 132], [3, 134]], P.sang); fillPts([[-21, 124], [-3, 124], [-3, 134], [-21, 134]], P.sang);   // rubans rouges
    hatch(null, 0.9, 3.2, 0.3); shade(26, 0, -30, 0, 0.3, [-40, -20, 32, 190]);
  }
  function headBB(f, closed) {
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
    fillPts([[-6, -99], [-30, -90], [-38, -70], [-36, -52], [-24, -60], [-14, -72], [4, -82], [28, -84], [32, -100]], BB.barbe);          // cheveux noirs
    dot(16, -36, 8, 'rgba(190,100,80,0.22)');
    fillPts(CHEEK, BB.barbe, 2, 0.6);                                                                                      // barbe des joues
    for (let i = 0; i < 6; i++) strokePts([[-18 + i * 7, -50 + i * 6], [-14 + i * 7, -14 + i * 2]], 'rgba(80,86,104,0.6)', 1);
    fillPts([[37, -37], [31, -31], [22, -30], [10, -24], [14, -31], [24, -37]], BB.barbe);                                        // moustache
    strokePts([[34, -35], [22, -32], [12, -26]], 'rgba(90,96,116,0.7)', 1);
    strokePts([[29, -24], [23, -23]], 'rgba(150,70,60,0.9)', 1.8);                                                         // lèvre sous la moustache
    fillPts([[8, -58], [26, -58], [24, -48], [10, -47]], 'rgba(60,30,25,0.18)');                                          // orbite sombre
    X.eye(closed ? Object.assign({}, f, { eyes: 'closed' }) : f, 17, -52);
    strokePts(f.brow === 'up' ? [[6, -63], [16, -67], [27, -63]] : f.brow === 'worry' ? [[6, -59], [16, -64], [27, -65]] : f.brow === 'n' ? [[6, -61], [16, -64], [27, -61]] : [[6, -64], [16, -62], [28, -57]], '#121015', 4.2);
    if (f.mouth === 'o') fillPts([[27, -25], [31, -25], [31, -19], [27, -19]], '#3a1714');
    if (f.mouth === 'smile') strokePts([[30, -24], [24, -21], [19, -24]], 'rgba(150,70,60,0.9)', 1.8);
  }
  function mkBarbeNoire() {
    const LEG = { culotte: 0, botte: 112, botteCol: BB.botte, revers: BB.botteL, chaus: BB.botte };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: BB_TORSO, base: BB.coat, seed: 7001, paint: () => {
        fillPts([[-30, -170], [-6, -178], [14, -170], [8, -154], [-22, -152]], BB.coatL);                              // col
        strokePts([[30, -146], [40, -100], [42, -40], [46, 60], [52, 128]], 'rgba(8,12,24,0.75)', 1.6);                 // bord avant
        strokePts([[46, 58], [52, 127]], BB.galon, 2.4); strokePts([[-50, 128], [52, 128]], BB.galon, 2.4);
        for (const y of [-126, -96, -66, -36]) dot(35, y, 2.6, BB.galonL);
        for (const y of [30, 60, 90]) dot(44, y + 4, 2.4, BB.galonL);
        fillPts([[-10, 34], [36, 32], [38, 50], [-8, 54]], BB.coatL); strokePts([[-10, 34], [36, 32]], BB.galon, 1.8);   // poche à rabat
        for (const x of [0, 13, 26]) dot(x, 44, 2, BB.galonL);
        strokePts([[-46, 56], [-50, 130]], 'rgba(8,12,24,0.8)', 1.6);                                                   // fente du dos
        // écharpe rouge nouée sur la hanche, pans qui pendent
        fillPts([[-44, -20], [42, -22], [44, 10], [-46, 14]], BB.sash);
        for (const y of [-12, -4, 4]) strokePts([[-44, y], [0, y + 1], [42, y - 1]], 'rgba(40,6,6,0.45)', 1.2);
        fillPts([[-42, 6], [-28, 8], [-30, 76], [-36, 82, 1], [-46, 72]], BB.sash); fillPts([[-30, 8], [-20, 8], [-18, 62], [-24, 68, 1], [-30, 58]], BB.sashD);
        fillPts([[-40, -10], [-26, -14], [-22, 4], [-36, 10]], BB.sashD);
        // bandoulière de cuir et trois pistolets de carton
        const band = [[-38, -162], [-14, -116], [10, -70], [34, -26]];
        fillPts(ribbon(band, 15, 15), BB.cuir); strokePts(band.map((q) => [q[0] - 5, q[1] + 2]), 'rgba(220,180,120,0.35)', 1);
        fillPts(R4(16, -66, 30, -52), BB.galon); fillPts(R4(19, -63, 27, -55), BB.cuir);
        const c = cx_();
        for (const [px, py, a] of [[-27, -132, 0.35], [-8, -100, 0.4], [10, -66, 0.45]]) {
          c.save(); c.translate(px, py); c.rotate(a);
          pc([[-7, -16], [9, -18], [12, -6], [7, 6], [-1, 4], [-9, -6]], BB.bois, () => strokePts([[-4, -12], [7, -14]], 'rgba(255,220,160,0.35)', 1), 7010);
          pc(R4(1, 2, 7, 42), BB.acier, () => strokePts([[3, 4], [3, 40]], 'rgba(255,255,255,0.45)', 1), 7011);
          pc(R4(-2, -4, 10, 6), '#5d6066', null, 7012);
          dot(-6, -15, 2.4, BB.galon);
          c.restore();
        }
        hatch([[-52, -170], [-14, -170], [-12, 132], [-52, 132]], 0.75, 4.2, 0.3);
        shade(40, 0, -44, 0, 0.3);
      } },
      legB: legDef([-6, -2], BB.culotte, 7002, true, LEG),
      legF: legDef([6, -2], BB.culotte, 7003, false, LEG),
      armB_up: upDef([-10, -146], BB.coatD, 7004),
      armB_lo: foreDef('armB_up', BB.coatD, 7005, { peau: BB.peauD, back: true, manchette: BB.coat, galon: BB.galon, dentelle: '#cfc6b0' }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: BB.peau, seed: 7006, noRivet: true, paint: (p) => headBB(p.face || {}, false) },
      cheveux: { parent: 'head', at: [-24, -64], pts: [[-12, -26], [14, -22], [10, 14], [6, 54], [-4, 86, 1], [-20, 80], [-24, 40], [-20, 0]], base: BB.barbe, seed: 7007, noRivet: true,
        paint: () => { for (const x of [-12, -4, 4]) strokePts([[x + 4, -18], [x, 40], [x - 4, 80]], 'rgba(80,86,104,0.55)', 1.1); hatch(null, 1, 3.4, 0.3); } },
      meches: { parent: 'head', at: [0, 0], pts: OFFP, base: '#000', seed: 7008, noRivet: true, extra: drawMeches },
      chapeau: { parent: 'head', at: [0, -86], pts: TRI, base: '#19181c', seed: 7009, noRivet: true, paint: () => {
        fillPts([[-66, -32], [-52, -14], [-30, -2], [0, 4], [30, 0], [50, -10], [68, -30], [36, -21], [0, -19], [-36, -25]], '#25232a');   // bord relevé
        strokePts(TRI_BORD, BB.galon, 3.4); strokePts(TRI_BORD.map((q) => [q[0], q[1] + 2.2]), BB.galonL, 1);
        strokePts([[-60, -26], [-30, -6], [0, 0], [30, -4], [62, -24]], 'rgba(255,255,255,0.12)', 1.4);
        hatch(null, 0.5, 3.6, 0.3); shade(0, -60, 0, 4, 0.25, [-70, -64, 72, 8]);
      } },
      plume: { parent: 'chapeau', at: [0, 0], pts: PLUME, base: P.sang, seed: 7013, noRivet: true, paint: () => {
        const c = PLUME_C;
        strokePts(c, 'rgba(240,210,190,0.7)', 1.3);
        for (let i = 1; i < c.length - 1; i++) { strokePts([c[i], [c[i][0] - 6, c[i][1] - 8]], 'rgba(60,8,8,0.45)', 1); strokePts([c[i], [c[i][0] - 6, c[i][1] + 7]], 'rgba(60,8,8,0.45)', 1); }
      } },
      perruque: { parent: 'chapeau', at: [-4, -54], pts: (p) => (k01(p.perruque) > 0 ? tr(WIG, 0, -(1 - ease(k01(p.perruque))) * 160) : OFFP), base: '#eeeae2', seed: 7014, noRivet: true,
        paint: (p) => { const c = cx_(); c.save(); c.translate(0, -(1 - ease(k01(p.perruque))) * 160); wigPaint(); c.restore(); } },
      fourreau: { parent: 'torso', at: [-12, 10], rest: 0.5, seed: 7015, noRivet: true, base: '#2a1d16',
        pts: [[-5, 0], [5, 0], [6, 92], [3, 114], [-1, 120, 1], [-4, 110], [-5, 76]], paint: () => {
          fillPts(R4(-8, 0, 8, 10), BB.galon); fillPts([[-6, 104], [6, 104], [3, 118], [-2, 120]], BB.galon);
          strokePts([[2, 12], [3, 100]], 'rgba(255,220,170,0.25)', 1.2);
        }, extra: (p) => { if (p.tenu !== 'sabre') drawGarde(); } },
      barbe: { parent: 'head', at: [16, -6], pts: BEARD, base: BB.barbe, seed: 7016, noRivet: true, paint: beardPaint },
      armF_up: upDef([-2, -146], BB.coat, 7017),
      armF_lo: foreDef('armF_up', BB.coat, 7018, { peau: BB.peau, manchette: BB.coatL, galon: BB.galon, dentelle: BB.chemise }),
      fumeeM: { parent: 'head', at: [0, 0], pts: OFFP, base: '#000', seed: 7019, noRivet: true, extra: fumeeMeches },
      fumeeB: { parent: 'barbe', at: [0, 0], pts: OFFP, base: '#000', seed: 7020, noRivet: true, extra: fumeeBarbe },
    };
    Object.assign(parts, heldParts(BB.peau, 7030));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'torso', 'cheveux', 'meches', 'chapeau', 'plume', 'perruque', 'fourreau', 'barbe',
        'armF_up', 'armF_lo', 'objet', 'doigts', 'liens', 'fumeeM', 'fumeeB'] };
  }
  // poignée du sabre au fourreau (repère du fourreau : bouche en (0,0), le fourreau descend vers +y)
  function drawGarde() {
    pc([[-6, 0], [6, 0], [6, -28], [-6, -28]], '#2a1e18', () => { for (let y = -24; y < -2; y += 4) strokePts([[-6, y], [6, y + 2]], 'rgba(200,170,120,0.35)', 1); }, 7021);
    pc([[-14, 2], [16, 0], [18, -6], [-14, -6]], P.or, null, 7022);
    pc(ell(0, -32, 7, 6, 10), P.or, null, 7023);
    pc([[14, -4], [20, -14], [16, -30], [6, -36], [4, -31], [12, -26], [14, -14], [10, -6]], P.orD, null, 7024);
  }
  CH.bnBarbeNoire = mkBarbeNoire();

  BN.barbeNoirePose = function (p) {
    const q = prep(p), A = q.ang, t = q.t || 0;
    if (q.meches == null) q.meches = 1;
    if (!q.face.brow) q.face.brow = 'frown';
    const hh = ease(k01(q.hanches)), rv = ease(k01(q.reverence)), ca = ease(k01(q.caresse)), cp = clamp(q.coup || 0);
    if (cp > 0 && q.tenu == null) q.tenu = 'sabre';
    if (hh > 0) { armTo(q, 'armF', [-14, -28], 'arriere', hh); armTo(q, 'armB', [-24, -28], 'arriere', hh); if (!has(q.tenu)) q.handF = 'fist'; if (!has(q.tenuB)) q.handB = 'fist'; }
    if (rv > 0) {
      plier(q, 0.42 * rv); A.head = (A.head || 0) + 0.22 * rv;
      armTo(q, 'armF', [8, -100], 'bas', rv); blend(q, 'armB_up', 0.75, rv); blend(q, 'armB_lo', -0.12, rv);
      A.legF = (A.legF || 0) - 0.1 * rv; A.legB = (A.legB || 0) + 0.14 * rv;
      if (rv > 0.5 && !has(q.tenu)) q.handF = 'open'; if (!q.handB) q.handB = 'open';
    }
    if (ca > 0) {
      const yy = lerp(30, 84, 0.5 + 0.5 * Math.sin(t * 4.2)), ch = headPt(q, 16, -6);
      armTo(q, 'armF', [ch[0] + 22, ch[1] + yy], 'avant', ca); A.head = (A.head || 0) - 0.1 * ca;
      if (!has(q.tenu)) q.handF = 'open';
    }
    if (cp > 0) {
      const R0 = [A.armF_up || 0, A.armF_lo || 0, 0], AR = [-2.75, -0.35, -0.75], FR = [-1.3, -0.1, 1.9];
      let u;
      if (cp < 0.5) { const k = ease(cp / 0.5); u = R0.map((v, i) => lerp(v, AR[i], k)); }
      else { const k = ease((cp - 0.5) / 0.5); u = AR.map((v, i) => lerp(v, FR[i], k)); q.tilt = (q.tilt || 0) + 0.06 * k; A.legF = (A.legF || 0) - 0.22 * k; A.legB = (A.legB || 0) + 0.16 * k; }
      A.armF_up = u[0]; A.armF_lo = u[1]; A.objet = (A.objet || 0) + u[2];
    }
    if (k01(q.mains) > 0) liees(q, ease(k01(q.mains)));
    if (q.chute >= 0.95 && !q.face.eyes) q.face.eyes = 'closed';
    A.barbe = (A.barbe || 0) - (A.head || 0) - (q.tilt || 0) + 0.025 * Math.sin(t * 1.6);       // la barbe pend toujours
    return finish(q);
  };
  BN.barbeNoire = function (pose, x, y, s, o) {
    s = s == null ? 1 : s; o = Object.assign({}, o || {});
    const q = BN.barbeNoirePose(pose), ch = clamp(q.chute || 0);
    if (ch <= 0) return run(CH.bnBarbeNoire, q, x, y, s, o);
    // chute à plat, en arrière, autour du talon ; la tige n'est plus dessinée (le plan la retire lui-même s'il le veut)
    const dir = o.dir || 1, sg = dir < 0 ? -1 : 1, c = cx_();
    const rot = -sg * PI / 2 * Math.pow(ch, 2.3), hx = x - 18 * s * sg, lift = -46 * s * Math.sin(Math.abs(rot));
    const R = new DOMMatrix().translate(0, lift).translate(hx, y).rotate(rot * D).translate(-hx, -y);
    c.save(); c.setTransform(c.getTransform().multiply(R));
    const r = run(CH.bnBarbeNoire, q, x, y, s, Object.assign(o, { rod: false, floorShadow: false }));
    c.restore();
    return r;
  };

  // =====================================================================
  // MARINS MARCHANDS — a : bonnet rouge, chemise blanche, gilet vert sapin ; b : chapeau de paille rond, gilet ocre ;
  // c : casquette bleu ardoise, vareuse grise
  // =====================================================================
  const MAR = {
    a: { peau: '#e2bb96', peauD: '#c49c78', haut: '#ece7da', hautD: '#cfc8b6', gilet: '#35584a', giletD: '#284438', culotte: '#9a8f78', culotteD: '#7e745f', bas: '#d9d1bd', chaus: '#2c241e', cheveux: '#6b4a2e', coiffe: '#8f2a24' },
    b: { peau: '#d4a780', peauD: '#b68a64', haut: '#e1d8c4', hautD: '#c6bca6', gilet: '#b0832f', giletD: '#8c6823', culotte: '#5f5b54', culotteD: '#4c4944', bas: '#bdb5a2', chaus: '#3a2a20', cheveux: '#8d867c', coiffe: '#cdb06a' },
    c: { peau: '#dcb28a', peauD: '#be9470', haut: '#85888b', hautD: '#6c6f72', gilet: null, culotte: '#3e4550', culotteD: '#323843', bas: '#a59c8a', chaus: '#231d1a', cheveux: '#2c221d', coiffe: '#4f6274' },
  };
  const MAR_TORSO = [[-14, -176], [8, -180], [16, -168], [28, -150], [36, -112], [38, -60], [36, -10], [36, 26, 1], [-38, 28, 1], [-38, -40], [-38, -110], [-34, -150], [-26, -168]];
  const VAR_TORSO = [[-14, -176], [8, -180], [16, -168], [30, -150], [40, -112], [42, -60], [42, -10], [46, 46, 1], [-44, 48, 1], [-42, -40], [-40, -110], [-35, -150], [-26, -168]];
  const BONNET = [[-36, 10], [-38, -8], [-46, -18], [-60, -8, 1], [-58, -26], [-40, -40], [-14, -46], [12, -42], [30, -30], [37, -10], [38, 10], [0, 14]];
  const PAILLE_R = [[-58, 4], [-34, 0], [-32, -30], [-24, -36], [24, -36], [32, -30], [34, 0], [60, 2], [56, 10], [0, 12], [-54, 10]];
  const CASQ = [[-36, 8], [-38, -12], [-28, -28], [-6, -34], [20, -30], [32, -16], [34, -2], [58, 2], [60, 9], [30, 12], [-30, 12]];
  function marinHead(m, mod) {
    return (p) => {
      const f = p.face || {};
      fillPts([[-40, -84], [-14, -78], [-16, -56], [-22, -40], [-26, -30], [-42, -28]], m.cheveux);
      X.earPaint(-8, -44);
      hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
      dot(15, -34, 9, 'rgba(205,120,100,0.25)');
      if (mod === 'b') { fillPts([[-14, -70], [-6, -66], [-4, -40], [-12, -34], [-16, -50]], m.cheveux); }               // favoris gris
      if (mod === 'c') for (let i = 0; i < 26; i++) dot(lerp(-12, 28, hash(i * 3.3)), lerp(-30, -2, hash(i * 5.1)), 0.9, 'rgba(50,40,35,0.55)');   // barbe de trois jours
      X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(60,40,28,0.95)', 2.6); X.mouth(f, 27, -26);
    };
  }
  function mkMarin(mod) {
    const m = MAR[mod], vareuse = mod === 'c';
    const LEG = { culotte: 150, bas: m.bas, chaus: m.chaus };
    const coiffe = mod === 'a' ? { at: [-4, -80], pts: BONNET, paint: () => {
      fillPts(R4(-40, 0, 40, 14), '#6e1f1a'); for (let x = -36; x < 38; x += 5) strokePts([[x, 1], [x, 13]], 'rgba(40,10,8,0.5)', 1);
      hatch(null, 0.4, 3.2, 0.25); shade(30, -40, -40, 0, 0.2, [-62, -48, 40, 16]);
    } } : mod === 'b' ? { at: [-2, -84], pts: PAILLE_R, paint: () => {
      fillPts(R4(-33, -10, 34, -2), '#7a2a22');
      for (let x = -30; x <= 30; x += 6) strokePts([[x, -34], [x * 1.05, -10]], 'rgba(110,80,30,0.35)', 1);
      for (const k of [0.45, 0.8]) strokePts([[-56 * k, 7], [56 * k, 7]], 'rgba(110,80,30,0.45)', 1);
      hatch(null, 0.5, 3.6, 0.18);
    } } : { at: [0, -80], pts: CASQ, paint: () => {
      fillPts([[34, -2], [58, 2], [60, 9], [30, 12]], '#36455a'); strokePts([[-34, 2], [34, 2]], 'rgba(20,26,40,0.6)', 1.4);
      hatch(null, 0.5, 3.6, 0.25); shade(0, -34, 0, 10, 0.2, [-40, -36, 62, 14]);
    } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: vareuse ? VAR_TORSO : MAR_TORSO, base: m.haut, seed: 7101 + 40 * mod.charCodeAt(0), paint: () => {
        if (!vareuse) {
          fillPts([[4, -184], [18, -168], [12, -150], [2, -166]], m.hautD);
          fillPts([[-40, -170], [-20, -172], [10, -150], [16, -100], [14, 30], [-40, 30]], m.gilet);
          strokePts([[-20, -172], [10, -150], [16, -100], [14, 28]], 'rgba(20,20,16,0.6)', 1.4);
          for (const y of [-120, -80, -40, 0]) dot(10, y, 2, m.giletD);
          fillPts(R4(-40, 8, 40, 20), '#3b2a1e'); fillPts(R4(6, 6, 18, 22), '#8d7a52');
          if (mod === 'a') fillPts([[6, -176], [22, -166], [16, -148], [10, -160]], '#2a2a30');                    // foulard noir
        } else {
          fillPts([[-6, -178], [16, -170], [20, -150], [-24, -146], [-34, -162]], '#5c6f84');                      // large col bleu
          strokePts([[-30, -150], [18, -152]], 'rgba(240,235,225,0.6)', 1.4);
          strokePts([[22, -150], [32, -60], [34, 40]], 'rgba(40,40,44,0.45)', 1.2);
          fillPts([[-44, 14], [44, 10], [44, 18], [-44, 22]], CORDE); for (let x = -40; x < 44; x += 5) strokePts([[x, 12], [x + 3, 20]], 'rgba(60,45,25,0.5)', 1);
        }
        hatch([[-50, -170], [-12, -170], [-10, 48], [-50, 48]], 0.75, 4.2, 0.3);
        shade(38, 0, -40, 0, 0.28);
      } },
      legB: legDef([-6, -2], m.culotteD, 7102 + 40 * mod.charCodeAt(0), true, LEG),
      legF: legDef([6, -2], m.culotte, 7103 + 40 * mod.charCodeAt(0), false, LEG),
      armB_up: upDef([-10, -146], m.hautD, 7104 + 40 * mod.charCodeAt(0)),
      armB_lo: foreDef('armB_up', m.hautD, 7105 + 40 * mod.charCodeAt(0), { peau: m.peauD, back: true }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: m.peau, seed: 7106 + 40 * mod.charCodeAt(0), noRivet: true, paint: marinHead(m, mod) },
      coiffe: Object.assign({ parent: 'head', base: m.coiffe, seed: 7107 + 40 * mod.charCodeAt(0), noRivet: true }, coiffe),
      armF_up: upDef([-2, -146], m.haut, 7108 + 40 * mod.charCodeAt(0)),
      armF_lo: foreDef('armF_up', m.haut, 7109 + 40 * mod.charCodeAt(0), { peau: m.peau }),
    };
    Object.assign(parts, heldParts(m.peau, 7120 + 40 * mod.charCodeAt(0)));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'coiffe', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'liens'] };
  }
  CH.bnMarinA = mkMarin('a'); CH.bnMarinB = mkMarin('b'); CH.bnMarinC = mkMarin('c');
  BN.marinPose = (p) => gestes(prep(p));
  BN.marin = function (pose, x, y, s, o) {
    const mod = (pose && pose.modele) || 'a', def = mod === 'c' ? CH.bnMarinC : mod === 'b' ? CH.bnMarinB : CH.bnMarinA;
    return run(def, BN.marinPose(pose), x, y, s == null ? 0.88 : s, o);
  };

  // =====================================================================
  // OTAGES DE CHARLESTON — conseiller (perruque poudrée, habit prune, jabot ivoire) ; planteur (grand chapeau de paille, habit moutarde) ;
  // marchand (bicorne brun, habit vert mousse). Option tonneau 0..1 (le tonneau descend sur lui ; à 1 : bras et jambes nus, bretelles)
  // =====================================================================
  const OTG = {
    conseiller: { peau: '#ecc9aa', peauD: '#cfa888', habit: '#5b3a5e', habitD: '#462c49', galon: '#b9a57a', culotte: '#4f3352', bas: '#ebe6da', chaus: '#1f1a1c', cheveux: '#bdb8ae' },
    planteur: { peau: '#d9a27a', peauD: '#bb845e', habit: '#b08a2e', habitD: '#8e6f22', galon: '#7a5c1c', culotte: '#e0d6bd', bas: '#e0d6bd', chaus: '#4a3020', botte: true, cheveux: '#6b4a2e' },
    marchand: { peau: '#e3bf9c', peauD: '#c6a07c', habit: '#4d6a4d', habitD: '#3c543c', galon: '#2e402e', culotte: '#3f3a33', bas: '#cfc7b3', chaus: '#2a2220', cheveux: '#8f8a82' },
  };
  const OTG_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [34, -112], [36, -60], [36, -6], [40, 60], [44, 122, 1], [-44, 124, 1], [-42, 60], [-38, 0], [-38, -60], [-37, -110], [-33, -150], [-26, -168]];
  const OTG_TORSO_NU = [[-14, -176], [8, -180], [16, -168], [26, -150], [34, -112], [36, -60], [36, 40, 1], [-38, 40, 1], [-38, -60], [-37, -110], [-33, -150], [-26, -168]];
  const JABOT = [[-4, -4], [8, -6], [14, 6], [20, 12], [16, 20], [22, 28], [16, 36], [20, 46], [10, 52], [0, 40], [-2, 20]];
  const GRAND_PAILLE = [[-92, 6], [-60, -2], [-34, -4], [-30, -28], [-20, -34], [22, -34], [30, -28], [34, -4], [62, -2], [96, 6], [90, 14], [40, 10], [0, 10], [-40, 10], [-88, 14]];
  const BICORNE_BRUN = [[-54, -8, 1], [-40, -2], [-14, 2], [14, 2], [40, -2], [56, -8, 1], [40, -22], [20, -40], [0, -48], [-20, -40], [-40, -22]];
  const BARIL = [[-58, -132], [58, -132], [64, -100], [68, -40], [66, 20], [58, 64, 1], [-58, 64, 1], [-66, 20], [-68, -40], [-64, -100]];
  const BRETELLE = [[22, -136], [26, -152], [16, -174], [-6, -182], [-24, -176], [-34, -158], [-36, -136], [-28, -136], [-26, -154], [-18, -168], [-4, -172], [10, -166], [16, -150], [14, -136]];
  function otageNu(p) { return k01(p.tonneau) > 0.92; }
  function mkOtage(mod) {
    const m = OTG[mod], sd = 7300 + 50 * Object.keys(OTG).indexOf(mod);
    const nu = otageNu;
    const LEG = m.botte ? { culotte: 110, botte: 120, botteCol: '#4a3020', revers: '#6a4a30', chaus: m.chaus, peau: m.peau, nu } : { culotte: 118, bas: m.bas, chaus: m.chaus, boucle: true, peau: m.peau, nu };
    const LEGB = Object.assign({}, LEG, { peau: m.peauD });
    const coiffe = mod === 'conseiller' ? { at: [0, 0], pts: WIG, base: '#f4f1ea', paint: wigPaint }
      : mod === 'planteur' ? { at: [-2, -84], pts: GRAND_PAILLE, base: '#e2cc8e', paint: () => {
        fillPts(R4(-31, -12, 34, -3), '#2b2422');
        for (let x = -28; x <= 28; x += 6) strokePts([[x, -32], [x * 1.05, -12]], 'rgba(120,90,40,0.35)', 1);
        for (const k of [0.4, 0.62, 0.84]) strokePts([[-92 * k, 8], [94 * k, 8]], 'rgba(120,90,40,0.4)', 1);
        hatch(null, 0.5, 3.6, 0.15);
      } }
      : { at: [0, -86], pts: BICORNE_BRUN, base: '#5a3f2a', paint: () => {
        strokePts([[-54, -8], [-40, -2], [-14, 2], [14, 2], [40, -2], [56, -8]], '#8a6a46', 2.2);
        strokePts([[0, -46], [0, -4]], 'rgba(30,18,10,0.45)', 1.4);
        hatch(null, 0.5, 3.6, 0.28); shade(0, -48, 0, 4, 0.22, [-56, -50, 58, 6]);
      } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => (otageNu(p) ? OTG_TORSO_NU : OTG_TORSO), base: m.habit, seed: sd + 1, paint: (p) => {
        if (otageNu(p)) { fillPts(R4(-60, -200, 60, 140), m.peau); hatch([[-50, -170], [-12, -170], [-10, 130], [-50, 130]], 0.75, 4.2, 0.22); return; }
        fillPts([[4, -184], [18, -168], [12, -150], [2, -166]], '#efe9dc');                                      // col de chemise
        fillPts([[14, -150], [32, -112], [34, -10], [22, -10], [16, -110]], mod === 'planteur' ? '#e6dcc4' : mod === 'marchand' ? '#c9b98f' : '#d9cfc0');   // gilet
        strokePts([[22, -146], [30, -100], [32, -10], [38, 60], [42, 120]], 'rgba(20,14,20,0.55)', 1.4);
        for (const y of [-120, -90, -60, -30]) dot(28, y, 2.1, m.galon);
        fillPts([[-6, 30], [30, 28], [31, 44], [-5, 46]], m.habitD); strokePts([[-6, 30], [30, 28]], m.galon, 1.4);  // poche à rabat
        if (mod === 'planteur') fillPts([[8, -178], [22, -166], [18, -152], [10, -160]], '#2b2422');                // cravate noire
        if (mod === 'marchand') fillPts([[6, -178], [20, -166], [16, -150], [8, -160]], '#efe9dc');
        hatch([[-50, -170], [-12, -170], [-10, 130], [-50, 130]], 0.75, 4.2, 0.3);
        shade(40, 0, -40, 0, 0.28);
      } },
      jabot: { parent: 'torso', at: [16, -170], pts: (p) => (mod === 'conseiller' && !otageNu(p) ? JABOT : OFFP), base: '#efe8d6', seed: sd + 2, noRivet: true, paint: () => {
        for (const y of [8, 20, 32, 44]) strokePts([[0, y - 6], [10, y], [18, y - 2]], 'rgba(150,140,120,0.6)', 1.1); hatch(null, 0.7, 3.4, 0.1);
      } },
      tonneau: { parent: 'torso', at: [0, 0], seed: sd + 3, noRivet: true, base: '#8a5d36',
        pts: (p) => { const u = k01(p.tonneau); return u > 0 ? tr(BARIL, 0, -(1 - ease(u)) * 340) : OFFP; },
        paint: (p) => {
          const dy = -(1 - ease(k01(p.tonneau))) * 340;
          for (const x of [-46, -26, -8, 10, 28, 46]) strokePts([[x * 0.95, -130 + dy], [x * 1.05, -40 + dy], [x * 0.92, 62 + dy]], 'rgba(50,30,15,0.55)', 1.3);
          for (const [y, w] of [[-112, 64], [-20, 68], [44, 62]]) { fillPts(R4(-w - 4, y + dy, w + 4, y + 10 + dy), '#4a4a4e'); strokePts([[-w, y + 2 + dy], [w, y + 2 + dy]], 'rgba(255,255,255,0.25)', 1); }
          hatch(null, 0.15, 4, 0.22); shade(60, 0, -60, 0, 0.35, [-70, -140 + dy, 70, 70 + dy]);
        } },
      bretelle: { parent: 'torso', at: [0, 0], seed: sd + 4, noRivet: true, base: '#5a3a22', pts: (p) => (otageNu(p) ? BRETELLE : OFFP),
        paint: () => strokePts([[18, -140], [10, -170], [-8, -176], [-28, -156], [-32, -138]], 'rgba(255,220,170,0.3)', 1) },
      legB: legDef([-6, -2], m.culotte, sd + 5, true, LEGB),
      legF: legDef([6, -2], m.culotte, sd + 6, false, LEG),
      armB_up: upDef([-10, -146], m.habitD, sd + 7, { nu, peau: m.peauD }),
      armB_lo: foreDef('armB_up', m.habitD, sd + 8, { peau: m.peauD, back: true, manchette: m.habit, nu, dentelle: mod === 'conseiller' ? '#ddd5c4' : null }),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: m.peau, seed: sd + 9, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[-40, -88], [-14, -80], [-16, -56], [-22, -40], [-26, -30], [-42, -28]], m.cheveux);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        dot(15, -34, 9, mod === 'planteur' ? 'rgba(200,90,70,0.35)' : 'rgba(205,120,100,0.22)');
        if (mod === 'conseiller') strokePts([[12, -40], [20, -36]], 'rgba(120,80,60,0.4)', 1);
        if (mod === 'planteur') fillPts([[-14, -70], [-6, -66], [-4, -38], [-12, -32], [-16, -50]], m.cheveux);
        if (mod === 'marchand') fillPts([[-42, -30], [-32, -28], [-36, 4], [-44, 2]], m.cheveux);
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(70,50,40,0.9)', 2.4); X.mouth(f, 27, -26);
      } },
      coiffe: Object.assign({ parent: 'head', base: '#000', seed: sd + 10, noRivet: true }, coiffe),
      armF_up: upDef([-2, -146], m.habit, sd + 11, { nu, peau: m.peau }),
      armF_lo: foreDef('armF_up', m.habit, sd + 12, { peau: m.peau, manchette: m.habitD, galon: m.galon, nu, dentelle: mod === 'conseiller' ? '#efe8d6' : null }),
    };
    Object.assign(parts, heldParts(m.peau, sd + 20));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head', 'coiffe', 'torso', 'jabot', 'tonneau', 'bretelle', 'armF_up', 'armF_lo', 'objet', 'doigts', 'liens'] };
  }
  CH.bnConseiller = mkOtage('conseiller'); CH.bnPlanteur = mkOtage('planteur'); CH.bnMarchand = mkOtage('marchand');
  BN.otagePose = (p) => gestes(prep(p));
  BN.otage = function (pose, x, y, s, o) {
    const mod = (pose && pose.modele) || 'conseiller', def = mod === 'planteur' ? CH.bnPlanteur : mod === 'marchand' ? CH.bnMarchand : CH.bnConseiller;
    return run(def, BN.otagePose(pose), x, y, s == null ? 0.88 : s, o);
  };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, draw, base, x, y, s, o, sDef) {
    o = o || {}; s = s == null ? (sDef || 0.9) : s;
    const def = accDef(name, (oo) => { const c = cx_(); c.save(); c.translate(-base[0], -base[1]); draw(oo); c.restore(); });
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  BN.sabre = (x, y, s, o) => acc('sabre', drawSabre, OBJ.sabre.base, x, y, s, o, 1);
  BN.drapeau = (x, y, s, o) => acc('drapeau', drawDrapeau, OBJ.drapeau.base, x, y, s, o, 0.88);

  // ---------------- coffre d'or (vue de profil ; (x,y) = milieu du fond) : bois brun cerclé de laiton, couvercle bombé à charnière arrière
  const CF = { bois: '#6e4526', boisL: '#8a5a33', boisD: '#4e3019', laiton: '#b08d45', laitonL: '#d9bd72', fer: '#3c3a3e' };
  const COUV = [[0, 0, 1], [200, 0, 1], [200, -8], [196, -30], [180, -50], [150, -62], [100, -66], [50, -62], [20, -50], [4, -30], [0, -8]];
  function drawCoffre(o) {
    const op = clamp(o.ouvre || 0), au = clamp(o.or == null ? 1 : o.or), t = o.t || 0, c = cx_();
    const lid = () => {
      c.save(); c.translate(-100, -112); c.rotate(-op * 1.95);
      pc(COUV, CF.boisL, () => {
        for (const y of [-14, -30, -46]) strokePts([[4, y], [196, y]], 'rgba(40,22,10,0.45)', 1.2);
        for (const x of [30, 170]) fillPts(R4(x - 6, -70, x + 6, 2), CF.laiton);
        fillPts(R4(-2, -10, 202, 2), CF.laiton); strokePts([[0, -8], [200, -8]], 'rgba(255,240,190,0.5)', 1);
        hatch(null, 0.2, 4, 0.2); shade(100, -66, 100, 0, 0.25, [0, -70, 200, 4]);
      }, 7501);
      pc(R4(194, -6, 208, 18), CF.laiton, () => dot(201, 10, 2.4, CF.fer), 7502);
      c.restore();
    };
    pc(R4(-100, -112, 100, 0), CF.bois, () => {
      for (const y of [-84, -56, -28]) strokePts([[-100, y], [100, y]], 'rgba(40,22,10,0.5)', 1.3);
      for (const x of [-70, 70]) { fillPts(R4(x - 7, -114, x + 7, 2), CF.laiton); for (const y of [-100, -56, -12]) dot(x, y, 2, CF.laitonL); }
      fillPts(R4(-102, -10, 102, 2), CF.laiton); fillPts(R4(-102, -114, 102, -104), CF.laiton);
      hatch(null, 0.2, 4, 0.22); shade(100, 0, -100, 0, 0.3, [-102, -116, 102, 4]);
    }, 7504);
    if (op > 0.45) lid();
    const k = au * sm(0.05, 0.55, op);
    if (k > 0.01) {
      const Hh = 70 * k, R = M.rng(77), coin = (x, y, rx, ry, sd) => pc(ell(x, y, rx, ry, 12), P.or, () => { strokePts(ep(x, y, rx * 0.7, ry * 0.7, 8, PI, TAU), 'rgba(120,85,30,0.6)', 1); dot(x - rx * 0.3, y - ry * 0.3, 1.6, P.orL); }, sd, { texA: 0.3 });
      pc([[-94, -110]].concat(ep(0, -110, 94, Hh + 6, 14, PI, TAU)), '#b69447', () => hatch(null, 0.6, 3.4, 0.2), 7505);
      for (let i = 0; i < 26; i++) {
        const x = lerp(-86, 86, R()), top = -110 - Hh * Math.sqrt(Math.max(0, 1 - (x / 92) ** 2));
        coin(x, lerp(-108, top, Math.sqrt(R())), 9, 3 + R() * 5, 7510 + i);
      }
      pc(ell(-30, -110 - Hh * 0.7, 7, 6, 8), '#8e2222', () => dot(-32, -112 - Hh * 0.7, 2, '#e08a80'), 7540);
      pc(ell(34, -110 - Hh * 0.55, 6, 5, 8), '#2f6b4a', () => dot(32, -112 - Hh * 0.55, 1.8, '#9fd4b0'), 7541);
      if (au > 0.55) {                                                          // l'or déborde : collier de perles et pièces qui glissent devant
        const v = sm(0.55, 1, au), pr = qbez([60, -112 - Hh * 0.4], [104, -110], [110, lerp(-100, -60, v)], 10);
        for (const q of pr) dot(q[0], q[1], 3, '#efe9da');
        for (let i = 0; i < 7; i++) { const u = (i + 1) / 8; coin(lerp(98, 128, u) + 4 * Math.sin(i * 2), lerp(-104, -6, u * v), 9, 4 + 2 * hash(i), 7550 + i); }
        for (let i = 0; i < 5; i++) coin(112 + i * 13 - 20 * hash(i * 3), -4 - (i % 2) * 5, 9, 3.5, 7560 + i);
      }
      if (!SIL()) for (let i = 0; i < 3; i++) {                                // éclats qui scintillent (étoile à 4 branches)
        const a = Math.max(0, Math.sin(t * 3 + i * 2.1)), x = [-50, 10, 60][i], y = -110 - Hh * [0.6, 0.95, 0.5][i];
        if (a < 0.05) continue;
        c.save(); c.globalAlpha = a * k; c.fillStyle = '#fff5d8'; c.beginPath();
        c.moveTo(x, y - 9); c.lineTo(x + 2, y - 2); c.lineTo(x + 9, y); c.lineTo(x + 2, y + 2); c.lineTo(x, y + 9); c.lineTo(x - 2, y + 2); c.lineTo(x - 9, y); c.lineTo(x - 2, y - 2); c.closePath(); c.fill(); c.restore();
      }
    }
    if (op <= 0.45) lid();
  }
  BN.coffreOr = (x, y, s, o) => acc('coffreOr', drawCoffre, [0, 0], x, y, s, o, 1);
  BN.COFFRE = { w: 200, h: 178, couvercle: [-100, -112] };

  // ---------------- tête seule (pendue) : même visage, barbe, mèches et fumée ; yeux fermés ; corde nouée aux cheveux
  // (x,y) = haut de la corde ; o.corde (longueur locale, 70) ; o.rot (balancement, rad autour de (x,y)) ; o.fume 0..1 ; o.t
  function mkTete() {
    const parts = {
      head: { parent: null, at: [0, 0], pts: X.NAP_HEAD, base: BB.peau, seed: 7601, noRivet: true, paint: (p) => {
        headBB({ brow: 'n' }, true);
        fillPts([[30, -84], [26, -94], [12, -104], [-8, -106], [-28, -98], [-38, -80], [-36, -52], [-24, -60], [-14, -72], [4, -80]], BB.barbe);
        for (const x of [-20, -4, 12]) strokePts([[x + 10, -100], [x, -78]], 'rgba(80,86,104,0.6)', 1);
      } },
      cheveux: { parent: 'head', at: [-24, -64], pts: [[-12, -26], [14, -22], [10, 14], [6, 54], [-4, 86, 1], [-20, 80], [-24, 40], [-20, 0]], base: BB.barbe, seed: 7602, noRivet: true,
        paint: () => { for (const x of [-12, -4, 4]) strokePts([[x + 4, -18], [x, 40], [x - 4, 80]], 'rgba(80,86,104,0.55)', 1.1); hatch(null, 1, 3.4, 0.3); } },
      meches: { parent: 'head', at: [0, 12], pts: OFFP, base: '#000', seed: 7603, noRivet: true, extra: drawMeches },
      noeud: { parent: 'head', at: [-6, -104], pts: ell(0, 0, 13, 10, 12), base: BB.barbe, seed: 7604, noRivet: true, paint: () => {
        for (const y of [-4, 2]) strokePts([[-12, y], [12, y + 2]], CORDE, 3);
      }, extra: (p) => {
        const L = p.corde, ln = [[0, -2], [2, -L * 0.5], [0, -L]];
        pc(ribbon(ln, 6, 6), CORDE, () => { for (let y = -4; y > -L; y -= 6) strokePts([[-3, y], [3, y - 4]], 'rgba(60,45,25,0.6)', 1); }, 7605, { drop: false });
      } },
      barbe: { parent: 'head', at: [16, -6], pts: BEARD, base: BB.barbe, seed: 7606, noRivet: true, paint: beardPaint },
      fumeeM: { parent: 'head', at: [0, 12], pts: OFFP, base: '#000', seed: 7607, noRivet: true, extra: fumeeMeches },
      fumeeB: { parent: 'barbe', at: [0, 0], pts: OFFP, base: '#000', seed: 7608, noRivet: true, extra: fumeeBarbe },
    };
    return { hipY: 0, parts, handLen: 10, rod: null, order: ['noeud', 'cheveux', 'head', 'meches', 'barbe', 'fumeeM', 'fumeeB'] };
  }
  CH.bnTete = mkTete();
  BN.tete = function (x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s;
    const L = o.corde == null ? 70 : o.corde, rot = o.rot || 0;
    const pose = { t: o.t || 0, fume: o.fume == null ? 1 : o.fume, meches: o.meches == null ? 1 : o.meches, corde: L, dx: 6, dy: L + 104, tilt: rot,
      ang: { barbe: -rot + 0.03 * Math.sin((o.t || 0) * 1.4) } };
    return M.puppet(CH.bnTete, pose, x, y, s, { dir: o.dir || 1, rod: false, floorShadow: false, cast: o.cast, alpha: o.alpha, slot: y + 900 });
  };

  BN.init = () => { BN.K = {}; return BN.K; };                                // rien à pré-rendre (appel conservé pour l'uniformité)
})();
