// persos.js — « La fève de la galette, le roi qui payait la tournée » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.gal (alias GAL). Appeler GAL.init() dans S.init.
// Mode d'emploi : persos.md (les plans ne lisent pas ce fichier). Aucun texte, lettre, chiffre ni logo. Déterministe (hash/noise, jamais Math.random).
// MARIONNETTES (toujours par l'enveloppe) : GAL.gontran / GAL.berthe / GAL.petit (pose, x, y, s, o) ; (x,y) = pieds ; o.dir ±1 ; slot ST.slotF par défaut.
// ACCESSOIRES (sans tige) : GAL.galette, part, feve, couronne, bourse, pieces, piece, addition, assiette, couteau (x, y, s, o) ; (x,y) = point posé (base).
// DÉCOR : GAL.salle(t, up, {epoque}), GAL.lustre(t, x, y, {epoque}), GAL.tapisserie(t, x, y, o), GAL.table(x, y, s, {nappe}) + GAL.TABLE.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, noise, smooth } = M;
  const GAL = (M.gal = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 18, 0, TAU); o.pop(); return o; }
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const has = (v) => !!v && v !== 'rien';
  GAL.geo = { ep, ell, qbez, scl, tr };

  // =====================================================================
  // 1) OBJETS — dessinés à l'échelle 1 dans leur repère ; même dessin seul ou tenu
  // =====================================================================
  const GOLD = '#d9a24e', GOLDL = '#efc67c', GOLDD = '#a7672a', CRUST = '#c4823a', FRANG = '#e8c77a', FRANGD = '#c9a356', FEUIL = '#f1d89c';

  // ---- galette : vue de 3/4 dessus ; origine = point le plus bas du bord avant
  const G = { R: 130, K: 0.38, TH: 24 }; G.TOP = G.R * G.K + G.TH;
  const gP = (a, r, top, off) => [off[0] + r * Math.cos(a), off[1] + (top ? -G.TOP : -G.TOP + G.TH) + r * G.K * Math.sin(a)];
  const gArc = (a0, a1, top, off, n) => { const o = []; for (let i = 0; i <= n; i++) o.push(gP(lerp(a0, a1, i / n), G.R, top, off)); return o; };
  function dessusPaint(off) {
    return () => {
      const c = cx_(), cy = off[1] - G.TOP;
      const g = c.createRadialGradient(off[0] - 30, cy - 12, 8, off[0], cy, G.R * 1.05);
      g.addColorStop(0, GOLDL); g.addColorStop(0.55, GOLD); g.addColorStop(1, GOLDD);
      c.fillStyle = g; c.fillRect(off[0] - 170, cy - 80, 340, 160);
      for (let k = -300; k <= 300; k += 30) {                                           // losanges tracés au couteau
        const L1 = [[off[0] - 170, cy + (-170 - k) * G.K], [off[0] + 170, cy + (170 - k) * G.K]];
        const L2 = [[off[0] - 170, cy + (k + 170) * G.K], [off[0] + 170, cy + (k - 170) * G.K]];
        strokePts(L1, 'rgba(105,55,18,0.55)', 1.4); strokePts(tr(L1, 0, 2), 'rgba(255,236,180,0.45)', 1);
        strokePts(L2, 'rgba(105,55,18,0.55)', 1.4); strokePts(tr(L2, 0, 2), 'rgba(255,236,180,0.45)', 1);
      }
      strokePts(ep(off[0], cy, G.R - 10, (G.R - 10) * G.K, 30, 0, TAU), 'rgba(120,62,20,0.35)', 2);
    };
  }
  function bordPaint(off, a0, a1) {
    return () => {
      for (let d = 4; d < G.TH; d += 4) {                                               // feuilletage en strates
        const L = gArc(a0, a1, true, off, 16).map((p) => [p[0], p[1] + d]);
        strokePts(L, 'rgba(250,226,160,0.65)', 1.2); strokePts(tr(L, 0, 1.6), 'rgba(110,60,20,0.4)', 1);
      }
      hatch(null, 0.3, 4, 0.12, 1, '20,16,24', [off[0] - 140, off[1] - 80, off[0] + 140, off[1] + 10]);
    };
  }
  function tranche(off, a) {                                                            // face coupée (rayon) : feuilletage + frangipane
    const c0 = [off[0], off[1] - G.TOP], c1 = [off[0], off[1] - G.TOP + G.TH], r0 = gP(a, G.R, true, off), r1 = gP(a, G.R, false, off);
    pc([c0, r0, r1, c1], FRANG, () => {
      fillPts([c0, r0, [r0[0], r0[1] + 7], [c0[0], c0[1] + 7]], FEUIL, 0, 0);
      fillPts([[c1[0], c1[1] - 5], [r1[0], r1[1] - 5], r1, c1], '#e2b36a', 0, 0);
      for (const f of [0.18, 0.22, 0.78]) strokePts([[lerp(c0[0], c1[0], f), lerp(c0[1], c1[1], f)], [lerp(r0[0], r1[0], f), lerp(r0[1], r1[1], f)]], 'rgba(150,100,40,0.45)', 1);
      for (let i = 0; i < 9; i++) { const u = 0.15 + 0.7 * hash(i * 3.1 + a), v = 0.4 + 0.3 * hash(i * 7.7 + a); dot(lerp(lerp(c0[0], r0[0], u), lerp(c1[0], r1[0], u), v), lerp(lerp(c0[1], r0[1], u), lerp(c1[1], r1[1], u), v), 1.4, 'rgba(160,110,50,0.55)'); }
    }, 7101 + Math.round(a * 10), { drop: false });
  }
  function drawGalette(o) {
    const etat = o.etat || 'entiere', ouv = clamp(o.ouvreK || 0);
    const n = o.parts != null ? Math.round(clamp(o.parts, 0, 8)) : etat === 'entamee' ? 7 : etat === 'vide' ? 0 : 8;
    const entiere = etat === 'entiere' && o.parts == null && ouv < 0.01;
    if (o.miettes) miettes(o.miettes, 7);
    if (entiere) {
      const off = [0, 0];
      pc(gArc(0, PI, true, off, 20).concat(gArc(0, PI, false, off, 20).reverse()), CRUST, bordPaint(off, 0, PI), 7001);
      pc(ell(0, -G.TOP, G.R, G.R * G.K, 40), GOLD, dessusPaint(off), 7002, { drop: false });
      return;
    }
    const ORD = [0, 1, 7, 2, 6, 3, 5, 4], gone = new Set(ORD.slice(0, 8 - n)), Wd = [];
    for (let i = 0; i < 8; i++) if (!gone.has(i)) {
      const a0 = normA(PI / 2 - PI / 8 + i * PI / 4), a1 = a0 + PI / 4, m = a0 + PI / 8;
      Wd.push({ i, a0, a1, m, off: [Math.cos(m) * ouv * 18, Math.sin(m) * ouv * 18 * G.K] });
    }
    Wd.sort((a, b) => Math.sin(a.m) - Math.sin(b.m));
    for (const w of Wd) {
      const pg = gone.has((w.i + 7) % 8) || ouv > 0.01, ng = gone.has((w.i + 1) % 8) || ouv > 0.01;
      if (Math.cos(w.a0) < 0 && pg) tranche(w.off, w.a0);
      if (Math.cos(w.a1) > 0 && ng) tranche(w.off, w.a1);
      const r0 = Math.max(w.a0, 0), r1 = Math.min(w.a1, PI);
      if (r1 > r0) pc(gArc(r0, r1, true, w.off, 8).concat(gArc(r0, r1, false, w.off, 8).reverse()), CRUST, bordPaint(w.off, r0, r1), 7010 + w.i);
      pc([[w.off[0], w.off[1] - G.TOP]].concat(gArc(w.a0, w.a1, true, w.off, 10)), GOLD, dessusPaint(w.off), 7020 + w.i, { drop: false });
    }
  }
  function miettes(k, seed) {
    for (let i = 0; i < 14 * k; i++) {
      const a = hash(i * 1.7 + seed) * TAU, r = G.R * (0.9 + 0.5 * hash(i * 2.3 + seed));
      const x = Math.cos(a) * r, y = -G.TH + Math.sin(a) * r * G.K + 14, sz = 2 + 3 * hash(i * 5.1);
      pc([[x - sz, y], [x, y - sz * 0.8], [x + sz, y - 0.2 * sz], [x + 0.3 * sz, y + sz * 0.6]], hash(i) < 0.5 ? GOLD : FRANG, null, 7050 + i, { drop: false });
    }
  }

  // ---- part : coin triangulaire, pointe à gauche (vers le centre de la galette), croûte à droite ; origine = base
  const PT = { T1: [-64, -30], T2: [42, -62], T3: [64, -28], B1: [-64, -10], B3: [64, -6], B2: [42, -42] };
  function biteClip(k, fn) {
    if (k <= 0.01) { fn(); return; }
    const c = cx_(), r = 14 + 34 * k, cxy = [-72 + 8 * k, -34];
    const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, rr = r + 3.4 * Math.cos(a * 12); pts.push([cxy[0] + rr * Math.cos(a), cxy[1] + rr * Math.sin(a) * 0.8]); }
    c.save(); c.beginPath(); c.rect(-400, -400, 800, 800); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); c.closePath(); c.clip('evenodd');
    fn(pts); c.restore();
  }
  function drawPart(o) {
    const k = clamp(o.croque || 0), Q = PT;
    biteClip(k, (bite) => {
      const biteEdge = () => { if (bite) { strokePts(bite.concat([bite[0]]), FRANG, 7); strokePts(bite.concat([bite[0]]), 'rgba(140,90,30,0.5)', 1.2); } };
      pc([Q.T2, [60, -48], Q.T3, Q.B3, [62, -24], Q.B2], CRUST, () => {
        for (let d = 4; d < 22; d += 4) { strokePts([[Q.T2[0], Q.T2[1] + d], [60, -48 + d], [Q.T3[0], Q.T3[1] + d]], 'rgba(250,226,160,0.65)', 1.2); }
        hatch(null, 0.3, 4, 0.14);
      }, 7201);
      pc([Q.T1, Q.T3, Q.B3, Q.B1], FRANG, () => {
        fillPts([Q.T1, Q.T3, [64, -21], [-64, -23]], FEUIL, 0, 0);
        strokePts([[-64, -26], [64, -24]], 'rgba(150,100,40,0.45)', 1); strokePts([[-64, -15], [64, -11]], 'rgba(150,100,40,0.4)', 1);
        fillPts([[-64, -14], [64, -10], Q.B3, Q.B1], '#e2b36a', 0, 0);
        for (let i = 0; i < 12; i++) dot(-56 + 112 * hash(i * 1.3), -19 + 5 * hash(i * 2.9), 1.4, 'rgba(160,110,50,0.55)');
        biteEdge();
      }, 7202);
      if (o.feve && o.feve !== 'rien') {                                                // la fève qui dépasse de la tranche
        const cc = cx_(); cc.save(); cc.translate(10, -12); cc.rotate(-0.25); cc.scale(0.42, 0.42);
        drawFeve({ sorte: o.feve, couleur: o.couleur, brille: o.brille });
        cc.restore();
        fillPts([[-6, -11], [26, -14], [30, -7], [-4, -6]], FRANG, 0, 0);
      }
      const off = [0, 0];
      pc([Q.T1, Q.T2, [58, -52], Q.T3], GOLD, () => {
        const c = cx_(), g = c.createLinearGradient(-60, -30, 60, -50); g.addColorStop(0, GOLDL); g.addColorStop(1, GOLDD);
        c.fillStyle = g; c.fillRect(-80, -80, 160, 80);
        for (let kk = -200; kk <= 200; kk += 22) { strokePts([[kk - 60, -20], [kk + 60, -70]], 'rgba(105,55,18,0.5)', 1.3); strokePts([[kk - 60, -70], [kk + 60, -20]], 'rgba(105,55,18,0.5)', 1.3); }
        biteEdge();
      }, 7203, { drop: false });
      void off;
    });
  }

  // ---- fève : vraie (graine), porcelaine (petit roi blanc et cobalt), plastique (même roi, couleur unie) ; origine = base
  const PLAST = { rouge: '#c4432f', jaune: '#dcb12c', vert: '#3e8f48', bleu: '#2f68ad' };
  const FIG_BODY = [[-22, -3, 1], [22, -3, 1], [18, -20], [14, -36], [15, -42], [8, -47], [-8, -47], [-15, -42], [-14, -36], [-18, -20]];
  const FIG_CROWN = [[-9, -61, 1], [-11, -73, 1], [-5, -67, 1], [0, -76, 1], [5, -67, 1], [11, -73, 1], [9, -61, 1]];
  const BEAN = (() => { const o = []; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, x = 36 * Math.cos(a); let y = -24 + 22 * Math.sin(a); if (Math.sin(a) < 0) y += 9 * Math.exp(-(x / 13) * (x / 13)) * -Math.sin(a); o.push([x, y]); } return o; })();
  function etoile(x, y, r, seed) { const o = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - PI / 2, rr = i % 2 ? r * 0.3 : r; o.push([x + rr * Math.cos(a), y + rr * Math.sin(a), 1]); } pc(o, '#f6ecc8', () => fillPts(tr(scl(o, 0.5), x * 0.5, y * 0.5), '#fffaf0', 0, 0), seed || 7390, { drop: false }); }
  function drawFeve(o) {
    const sorte = o.sorte || 'vraie';
    if (sorte === 'vraie') {
      pc(BEAN, '#7a6a3a', () => {
        const c = cx_(), g = c.createRadialGradient(-12, -32, 3, 0, -24, 40); g.addColorStop(0, '#a8975c'); g.addColorStop(1, '#5a4c26');
        c.fillStyle = g; c.fillRect(-40, -50, 80, 52);
        strokePts([[-8, -37], [0, -35], [8, -37]], '#2a2214', 3.2); strokePts([[-8, -34], [8, -34]], 'rgba(220,210,170,0.5)', 1);
        strokePts([[-26, -30], [-18, -40]], 'rgba(255,250,220,0.45)', 2);
        hatch(null, 0.7, 4, 0.15);
      }, 7301);
      if (o.brille) etoile(30, -48, 16 * o.brille, 7391);
      return;
    }
    const porc = sorte === 'porcelaine', col = porc ? '#f3f0ea' : (PLAST[o.couleur] || o.couleur || PLAST.rouge);
    const cobalt = '#22469a', dark = porc ? 'rgba(60,80,120,0.25)' : 'rgba(20,10,10,0.25)';
    pc(ell(0, -3, 21, 5, 14), porc ? '#dfe3ea' : col, null, 7310);
    pc(FIG_BODY, col, () => {
      if (porc) {
        fillPts([[-22, -12], [22, -12], [22, -4], [-22, -4]], cobalt, 0, 0);                     // bande d'ourlet
        strokePts([[0, -44], [0, -14]], cobalt, 2.2);
        for (const yy of [-38, -30, -22]) dot(0, yy, 2, cobalt);
        strokePts([[-14, -40], [-17, -16]], cobalt, 1.6); strokePts([[14, -40], [17, -16]], cobalt, 1.6);
        for (let i = 0; i < 5; i++) dot(-15 + i * 7.5, -8, 1.3, '#f3f0ea');
      }
      fillPts([[6, -46], [16, -40], [20, -4], [8, -4]], dark, 0, 0);
      strokePts([[-12, -40], [-15, -12]], 'rgba(255,255,255,0.75)', 2.2);
    }, 7311);
    pc(ell(0, -54, 9, 10, 16), porc ? '#f6f3ee' : col, () => {
      dot(-3, -55, 1.3, porc ? cobalt : 'rgba(20,10,10,0.6)'); dot(3, -55, 1.3, porc ? cobalt : 'rgba(20,10,10,0.6)');
      fillPts([[3, -62], [9, -56], [8, -48], [2, -46]], dark, 0, 0); strokePts([[-5, -60], [-6, -52]], 'rgba(255,255,255,0.8)', 1.5);
    }, 7312);
    pc(FIG_CROWN, porc ? cobalt : col, () => { strokePts([[-8, -63], [8, -63]], porc ? '#8fa6d8' : 'rgba(255,255,255,0.5)', 1.2); }, 7313);
    if (o.brille) etoile(26, -64, 16 * o.brille, 7392);
  }

  // ---- couronne de carton doré ; origine = milieu du bord inférieur
  function drawCouronne(o) {
    const pl = clamp(o.plie || 0);
    const topF = qbez([-75, -34], [0, -18], [75, -34], 14), topB = qbez([-75, -34], [0, -50], [75, -34], 14);
    const zig = (curve, h, half, bend) => { const out = []; const N = 7;
      for (let i = N; i >= 0; i--) {
        const v = curve[Math.round(i / N * 14)]; out.push([v[0], v[1], 1]);
        if (i > 0) { const u = (i - 0.5) / N, a = curve[Math.round(u * 14)] || v; let hx = 0, hh = h; if (bend && i === 5) { hx = 8 * pl; hh = h * (1 - 0.35 * pl); } out.push([a[0] + hx + (half ? 4 : 0), a[1] - hh, 1]); }
      }
      return out; };
    pc(topF.concat(zig(topB, 24, true, false)), '#8f6c2a', () => hatch(null, 0.6, 4, 0.25), 7401, { drop: false });
    const front = qbez([-75, -8], [0, 8], [75, -8], 14).concat(zig(topF, 30, false, true));
    pc(front, '#d2a64a', () => {
      const c = cx_(), g = c.createLinearGradient(-75, 0, 75, 0); g.addColorStop(0, '#a98232'); g.addColorStop(0.4, '#e9c76e'); g.addColorStop(1, '#a37a2c');
      c.fillStyle = g; c.fillRect(-80, -80, 160, 90);
      for (let x = -70; x <= 70; x += 7) for (let y = -60; y <= 4; y += 7) { dot(x, y, 0.9, 'rgba(255,240,190,0.45)'); dot(x + 1.2, y + 1.2, 0.8, 'rgba(110,80,20,0.35)'); }
      strokePts(qbez([-75, -12], [0, 3], [75, -12], 12), 'rgba(110,80,20,0.6)', 1.3);
      strokePts(qbez([-75, -30], [0, -14], [75, -30], 12), 'rgba(110,80,20,0.6)', 1.3);
      [['#8e2b25', -40], ['#3f6a3a', 0], ['#2d4a73', 40]].forEach(([cl, x]) => { const y = -20 + (x === 0 ? 8 : 4) * (1 - Math.abs(x) / 75); dot(x, y, 5.2, cl); dot(x - 1.5, y - 1.5, 1.6, 'rgba(255,255,255,0.6)'); });
      if (pl > 0.02) { strokePts([[22, -24], [26, -60]], 'rgba(90,60,15,' + (0.7 * pl) + ')', 1.6); strokePts([[24, -24], [28, -60]], 'rgba(255,240,190,' + (0.6 * pl) + ')', 1.2); }
    }, 7402);
  }

  // ---- bourse de cuir à cordon ; origine = fond
  const BOURSE = [[-9, -60], [9, -60], [15, -52], [28, -40], [34, -20], [31, -5], [17, 1], [-17, 1], [-31, -5], [-34, -20], [-28, -40], [-15, -52]];
  function drawBourse(o) {
    const ouv = !!o.ouverte;
    if (ouv) { pc(ell(0, -66, 18, 7, 16), '#2a1a10', () => { for (const [x, y, cl] of [[-8, -66, '#cfa547'], [4, -68, '#b8703e'], [10, -64, '#cfa547']]) { fillPts(ell(x, y, 6, 2.6, 10), cl, 0, 0); } }, 7501, { drop: false }); }
    pc(BOURSE, '#7a5232', () => {
      const c = cx_(), g = c.createRadialGradient(-10, -34, 4, 0, -26, 40); g.addColorStop(0, '#9c6d44'); g.addColorStop(1, '#5a3a22'); c.fillStyle = g; c.fillRect(-40, -70, 80, 74);
      for (const x of [-18, -6, 6, 18]) strokePts([[x * 0.5, -58], [x, -30], [x * 0.8, 0]], 'rgba(40,24,12,0.45)', 1.1);
      strokePts([[-22, -36], [-16, -50]], 'rgba(255,230,190,0.35)', 2);
      hatch(null, 0.7, 4, 0.2);
    }, 7502);
    const ruche = ouv ? [[-20, -60], [-24, -70, 1], [-14, -64, 1], [-8, -72, 1], [0, -64, 1], [8, -72, 1], [14, -64, 1], [24, -70, 1], [20, -60]] : [[-10, -60], [-13, -72, 1], [-6, -66, 1], [0, -74, 1], [6, -66, 1], [13, -72, 1], [10, -60]];
    pc(ruche, '#8a5e3a', () => hatch(null, 1.4, 3, 0.25), 7503);
    strokePts([[-12, -60], [0, -57], [12, -60]], '#c9a35a', 3);
    strokePts([[6, -58], [12, -46], [10, -36]], '#c9a35a', 2.2); strokePts([[4, -58], [-2, -44]], '#c9a35a', 2.2);
  }
  // ---- pièces (cuivre et or, aucun signe) ; origine = sol sous la pile / la rangée
  function coin(x, y, gold, seed, face) {
    const col = gold ? '#cfa547' : '#b8703e', colD = gold ? '#8d6c25' : '#7d4524';
    if (face) {
      pc(ell(x + 3, y, 18, 17, 20), colD, null, seed, { drop: true });
      pc(ell(x, y, 18, 17, 20), col, () => { strokePts(ell(x, y, 13, 12, 18).concat([[x + 13, y]]), 'rgba(80,50,15,0.55)', 1.4); strokePts(ell(x - 0.8, y - 0.8, 13, 12, 18).concat([[x + 12.2, y - 0.8]]), 'rgba(255,240,190,0.55)', 1); strokePts([[x - 10, y - 6], [x - 4, y - 12]], 'rgba(255,255,240,0.7)', 2); }, seed + 1, { drop: false });
      return;
    }
    pc(ep(x, y, 17, 6.5, 12, 0, PI).concat(ep(x, y - 4, 17, 6.5, 12, PI, 0)), colD, () => { for (let k = -14; k <= 14; k += 3) strokePts([[x + k, y - 4], [x + k, y + 4]], 'rgba(255,230,170,0.3)', 0.8); }, seed);
    pc(ell(x, y - 4, 17, 6.5, 18), col, () => { strokePts(ell(x, y - 4, 12, 4.4, 16).concat([[x + 12, y - 4]]), 'rgba(80,50,15,0.5)', 1.2); strokePts([[x - 9, y - 6], [x - 2, y - 8.5]], 'rgba(255,250,230,0.7)', 1.6); }, seed + 1, { drop: false });
  }
  function drawPieces(o) {
    const n = Math.max(1, Math.round(o.n == null ? 5 : o.n));
    if (o.pile) { for (let i = 0; i < n; i++) coin((hash(i * 3.3) - 0.5) * 4, -2 - i * 5, hash(i * 1.9) > 0.45, 7600 + i * 2); return; }
    for (let i = 0; i < n; i++) coin((i - (n - 1) / 2) * 27, -3 - 3 * hash(i * 2.1), hash(i * 1.9) > 0.45, 7640 + i * 2);
  }
  function drawPieceSeule() { coin(0, -18, true, 7690, true); }

  // ---- addition : rouleau ivoire qui se déroule vers le bas depuis un bâton ; origine = milieu du bâton
  const addLen = (o) => 40 + clamp(o.deroule == null ? 0.3 : o.deroule) * 860;
  function drawAddition(o) {
    const L = addLen(o), t = o.t || 0, k = clamp(o.deroule == null ? 0.3 : o.deroule), wv = (y) => Math.sin(y * 0.018 - t * 2.2) * 3 * k;
    const left = [], right = []; for (let y = 6; y <= L; y += 24) { left.push([-46 + wv(y), y]); right.push([46 + wv(y + 30), y]); }
    left.push([-46 + wv(L), L]); right.push([46 + wv(L + 30), L]);
    pc(left.concat(right.reverse()), '#efe6cf', () => {
      for (let y = 30; y < L - 20; y += 19) { const ln = []; const w = 30 + 34 * hash(y * 0.37); for (let x = -36; x <= -36 + w; x += 6) ln.push([x + wv(y), y + 2.2 * Math.sin(x * 0.45 + y)]); strokePts(ln, 'rgba(110,105,95,0.6)', 1.3);
        const ln2 = []; for (let x = 14; x <= 36; x += 6) ln2.push([x + wv(y), y + 2 * Math.sin(x * 0.5 + y * 0.7)]); strokePts(ln2, 'rgba(110,105,95,0.55)', 1.3); }
      if (L > 300) { const sy = L * 0.62; strokePts(ell(-6 + wv(sy), sy, 22, 18, 20).concat([[16 + wv(sy), sy]]), 'rgba(120,30,45,0.45)', 3); fillPts(ell(-6 + wv(sy), sy, 18, 14, 16), 'rgba(140,40,55,0.18)'); dot(22 + wv(sy), sy + 20, 4, 'rgba(120,30,45,0.35)'); }
      hatch(null, 0.2, 5, 0.08);
    }, 7701);
    const rr = lerp(24, 9, k);
    pc(ell(wv(L + 15), L, 52, rr, 20), '#e3d8bc', () => { strokePts([[-48, L], [48, L]], 'rgba(120,110,90,0.4)', 1); strokePts([[-44, L - rr * 0.5], [44, L - rr * 0.5]], 'rgba(255,255,250,0.5)', 1.4); }, 7702);
    pc([[-62, -7], [62, -7], [62, 7], [-62, 7]], '#6a4428', () => strokePts([[-60, -2], [60, -2]], 'rgba(255,220,170,0.3)', 1.2), 7703);
    for (const sx of [-1, 1]) pc(ell(sx * 66, 0, 9, 10, 12), '#53351f', null, 7704 + sx);
  }
  // ---- assiette de 3/4 ; origine = fond
  function drawAssiette(o) {
    const etain = !!o.etain, base = etain ? '#9a9890' : '#efe8d8', bord = etain ? '#7d7b74' : '#3f5f8a';
    pc(ell(0, -17, 62, 20, 30), etain ? '#6f6d66' : '#cfc6b2', null, 7801);
    pc(ell(0, -20, 62, 20, 30), base, () => {
      strokePts(ell(0, -20, 54, 17, 30).concat([[54, -20]]), bord, 2.2);
      fillPts(ell(0, -19, 38, 11, 24), etain ? 'rgba(60,58,52,0.25)' : 'rgba(120,110,90,0.18)');
      strokePts([[-40, -30], [-18, -35]], 'rgba(255,255,255,0.7)', 1.8);
    }, 7802, { drop: false });
  }
  // ---- couteau : lame effilée + manche distinct ; origine = milieu du manche ; pointe vers +x
  function drawCouteau() {
    pc([[38, -6], [100, -4], [136, 2, 1], [104, 8], [38, 8]], '#b9bcbf', () => { strokePts([[40, 6], [104, 6], [132, 2]], 'rgba(255,255,255,0.85)', 1.4); strokePts([[42, -3], [100, -1]], 'rgba(70,70,75,0.5)', 1); }, 7901);
    pc([[30, -9], [40, -9], [40, 10], [30, 10]], '#8d8a80', null, 7902);
    pc([[-38, -7], [30, -8], [30, 8], [-38, 7], [-42, 0]], '#4a3122', () => { strokePts([[-36, -3], [28, -4]], 'rgba(255,220,180,0.3)', 1.2); dot(-14, 0, 2.4, P.orL); dot(10, 0, 2.4, P.orL); }, 7903);
  }

  // registre : draw(o), grip (point de prise), p2 (seconde main), pts (points nommés), base (point posé), held (options par défaut quand tenu)
  const OBJ = {
    galette: { draw: drawGalette, grip: [72, 10], p2: () => [-72, 10], pts: { centre: [0, -G.TOP], bouche: [70, -G.TOP], base: [0, 0] }, base: [0, 0], doigts: false, held: { echelle: 0.75 } },
    part: { draw: drawPart, grip: [46, -24], pts: { pointe: [-60, -22], bouche: [-56, -22], centre: [0, -28], base: [0, 0] }, base: [0, 0] },
    feve: { draw: drawFeve, grip: [0, -6], pts: { centre: [0, -24], bouche: [0, -24], base: [0, 0] }, base: [0, 0], held: { sorte: 'vraie', echelle: 1.4 } },
    figurine: { draw: drawFeve, grip: [0, -10], pts: { centre: [0, -38], bouche: [0, -38], haut: [0, -76], base: [0, 0] }, base: [0, 0], held: { sorte: 'porcelaine', echelle: 1.4 } },
    couronne: { draw: drawCouronne, grip: [-62, -14], pts: { centre: [0, -16], bas: [0, 0], base: [0, 0] }, base: [0, 0] },
    bourse: { draw: drawBourse, grip: [0, -62], pts: { centre: [0, -30], bouche: [0, -66], base: [0, 0] }, base: [0, 0] },
    piece: { draw: drawPieceSeule, grip: [0, 2], pts: { centre: [0, -18], bouche: [0, -18], base: [0, 0] }, base: [0, 0] },
    pieces: { draw: drawPieces, grip: [0, -4], pts: { base: [0, 0] }, base: [0, 0] },
    couteau: { draw: drawCouteau, grip: [0, 0], pts: { pointe: [134, 2], centre: [70, 0], base: [0, 8] }, base: [0, 8] },
    assiette: { draw: drawAssiette, grip: [58, -14], pts: { centre: [0, -20], dessus: [0, -20], base: [0, 0] }, base: [0, 0] },
    addition: { draw: drawAddition, grip: [0, 0], pts: { bas: (o) => [0, addLen(o)], base: [0, 0] }, base: [0, 0] },
  };
  GAL.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (ob, n, o) => { const v = ob.pts[n]; return v == null ? null : typeof v === 'function' ? v(o) : v; };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: (p && p.t) || 0, echelle: 1 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.scale(oo.echelle, oo.echelle); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }

  // =====================================================================
  // 2) PIÈCES COMMUNES DES MARIONNETTES : bras à articulations rondes, objets tenus, doigts par-dessus
  // =====================================================================
  const R_COUDE = 11.5, DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  function armR(len, wt, rc) { rc = rc || R_COUDE; const m = len * 0.42; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, m], [rc + 0.5, len - 6]], ep(0, len, rc, rc, 10, 0, PI), [[-rc - 0.5, len - 6], [-wt + 1, m]]); }
  function foreR(kind, k) { if (!k) return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(X.forePts(kind).slice(2));
    return ep(0, 0, 9, 9, 10, PI, TAU).concat(scl(X.forePts(kind).slice(2), k[0], k[1])); }
  function upDef(at, base, seed, len, wt, rc, paint) { return { parent: 'torso', at, pts: armR(len, wt, rc), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, len + 6], [-16, len + 6]], 0.9, 3.8, 0.26)) }; }
  function foreDef(parent, len, base, skin, back, seed, cuff, k) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, len], pts: (p) => foreR(hk(p), k), base, seed, paint: (p) => {
      const c = cx_(); c.save(); if (k) c.scale(k[0], k[1]);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (cuff) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], cuff);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
      c.restore();
    } };
  }
  function heldParts(skin, seed, fist, dk) {
    const DG = dk ? scl(DOIGTS, dk) : DOIGTS, dP = () => { for (const y of [-3, 2, 7]) strokePts([[-10 * (dk || 1), y * (dk || 1)], [10 * (dk || 1), (y - 1) * (dk || 1)]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
    const doigtsOn = (v) => has(v) && OBJ[v] && OBJ[v].doigts !== false;
    return {
      objet: { parent: 'armF_lo', at: fist, noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu) && !p._cacheObjet) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: fist, noRivet: true, base: skin, seed: seed + 2, pts: (p) => (doigtsOn(p.tenu) && !p._cacheObjet ? DG : OFFP), paint: dP },
      objetB: { parent: 'armB_lo', at: fist, noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: fist, noRivet: true, base: skin, seed: seed + 4, pts: (p) => (doigtsOn(p.tenuB) || (p._deux && doigtsOn(p.tenu)) ? DG : OFFP), paint: dP },
    };
  }

  // ---- préparation commune des poses
  function prep(p) { p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); q._o0 = q.ang.objet || 0; q._oB0 = q.ang.objetB || 0; return q; }
  function defA(A, d) { for (const k in d) if (A[k] == null) A[k] = d[k]; }
  function applyDroit(q) {
    const A = q.ang, tl = q.tilt || 0;
    A.objet = q.droit ? q._o0 - ((A.armF_up || 0) + (A.armF_lo || 0) + tl) : q._o0;
    A.objetB = q.droitB ? q._oB0 - ((A.armB_up || 0) + (A.armB_lo || 0) + tl) : q._oB0;
  }
  function autoTenu(q) {
    if (has(q.tenu)) { if (!q.handF) q.handF = 'fist'; if (q.droit == null) q.droit = true; }
    if (has(q.tenuB)) { if (!q.handB) q.handB = 'fist'; if (q.droitB == null) q.droitB = true; }
  }
  function locPt(def, q, x, y, s, dir, part, p) { const { mats } = M.partMatrices(def, q, x, y, s, dir); return M.wpt(mats[part], p[0], p[1]); }
  // point écran d'un point de l'objet tenu (coordonnées de l'objet), ou du poing si pas d'objet
  function objPt(def, q, x, y, s, dir, arm, p, raw) {
    const F = arm === 'armF', name = F ? q.tenu : q.tenuB, { mats } = M.partMatrices(def, q, x, y, s, dir), m = mats[arm + '_lo'];
    const fm = m.translate(def.fist[0], def.fist[1]);
    if (!has(name) || !OBJ[name]) return M.wpt(fm, 0, 0);
    const ob = OBJ[name], oo = heldOpts(name, F ? q.tenuO : q.tenuBO, q), g = gripOf(ob, oo), e = oo.echelle;
    const pp = raw ? p : (p ? ptOf(ob, p, oo) : null); if (!pp) return M.wpt(fm, 0, 0);
    return M.wpt(fm.rotate(((F ? q.ang.objet : q.ang.objetB) || 0) * D), (pp[0] - g[0]) * e, (pp[1] - g[1]) * e);
  }
  // amène le poing (ou le point nommé de l'objet tenu) sur la cible écran, par M.ik (bendSign du personnage), mélange k
  function reach(def, q, x, y, s, dir, arm, cible, k, ptName) {
    if (!(k > 0) || !cible) return;
    const bend = (def.bend && def.bend[arm]) || 1, A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    const tmp = Object.assign({}, q, { ang: Object.assign({}, A) });
    let T = [cible[0], cible[1]], sol = null;
    for (let it = 0; it < 4; it++) {
      sol = M.ik(def, tmp, x, y, s, dir, arm, T, bend);
      tmp.ang[arm + '_up'] = sol.up; tmp.ang[arm + '_lo'] = sol.lo; applyDroit(tmp);
      const E = objPt(def, tmp, x, y, s, dir, arm, ptName);
      T = [T[0] + cible[0] - E[0], T[1] + cible[1] - E[1]];
    }
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  function finishQ(def, q, x, y, s, dir) {
    // geste générique : atteint 0..1 + cible [X,Y] écran (bras:'B' = main arrière ; ptCible = point nommé de l'objet)
    if (q.atteint > 0 && q.cible) { const arm = q.bras === 'B' ? 'armB' : 'armF'; reach(def, q, x, y, s, dir, arm, q.cible, ease(clamp(q.atteint)), q.ptCible || (has(arm === 'armF' ? q.tenu : q.tenuB) ? 'centre' : null)); }
    applyDroit(q); q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const oo = heldOpts(q.tenu, q.tenuO, q), P2 = objPt(def, q, x, y, s, dir, 'armF', OBJ[q.tenu].p2(oo), true);
      reach(def, q, x, y, s, dir, 'armB', P2, 1, null); q.handB = 'fist'; q._deux = true;
    }
    applyDroit(q);
    return q;
  }
  function run(def, q, x, y, s, o, nom) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF, nom }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par GAL.gontran / berthe / petit
  GAL.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, q = ptOf(ob, nom, oo); if (!q) return null; const g = gripOf(ob, oo), e = oo.echelle;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  const faceSet = (q, d) => { for (const k in d) if (q.face[k] == null) q.face[k] = d[k]; };
  function larmes(q, ex, ey) {                                                          // larmes qui coulent de l'œil (fonction de t)
    const k = clamp(q.larmes || 0); if (k <= 0) return;
    strokePts([[ex - 5, ey + 3], [ex + 6, ey + 2]], 'rgba(170,215,240,' + (0.9 * k) + ')', 2.4);
    for (let i = 0; i < 2; i++) {
      const u = (((q.t || 0) * 0.7 + i * 0.5) % 1), yy = ey + 7 + u * 40 * k, xx = ex - 2 - u * 7, r = 4.6 * k * (1 - 0.3 * u);
      fillPts([[xx, yy - r * 2.2], [xx + r, yy], [xx, yy + r], [xx - r, yy]], 'rgba(160,210,240,' + (0.85 * (1 - u * 0.6)) + ')', 0, 0);
      dot(xx - r * 0.3, yy - r * 0.2, r * 0.35, 'rgba(255,255,255,0.8)');
    }
  }

  // =====================================================================
  // 3) GONTRAN, le radin — rond, chauve et luisant, couronne de cheveux bruns, moustache tombante, nez rouge ;
  //    pourpoint moutarde, ceinture brune et bourse, manches brun clair, chausses bleu ardoise. ≈ 470 px à s 0,9.
  // =====================================================================
  const GO = { peau: '#e6c09c', peauD: '#c99c78', nez: '#c25a4a', cheveux: '#5a3a22', moust: '#4b301b', pp: '#b8913a', ppD: '#94722a', ppL: '#d1ad55',
    ceint: '#5a3d24', manche: '#a88a66', mancheD: '#8a6e4e', chausse: '#4f6475', chausseD: '#3e5160', soulier: '#4a2e1c', chemise: '#ece4d2' };
  const GO_TORSO = [[-12, -190], [6, -188], [14, -176], [24, -166], [34, -156], [50, -132], [66, -104], [78, -72], [83, -40], [79, -10], [69, 12], [56, 32, 1], [-44, 34, 1], [-49, 0], [-49, -60], [-47, -110], [-41, -150], [-28, -176]];
  // Profil « clair » (défaut ; profilClair:false = ancien profil) : nez rougeaud en pomme de terre dans le contour,
  // moustache en guidon horizontal, bouche visible dessous, joue qui bombe dans le contour entre moustache et mâchoire.
  // Repères locaux (tête) : bouche = [44 + 11·joues, -12] ; centre de la joue = [36 + 6·joues, -8] ; œil [21, -58].
  const goClair = (p) => p.profilClair === true;
  const GO_NEZ_PC = [[38, -29], [43, -30], [48, -34], [50, -40], [47, -47], [41, -51], [36, -53]];
  GAL.GONTRAN_PTS = { bouche: (j) => [44 + 11 * (j || 0), -12], joue: (j) => [36 + 6 * (j || 0), -8], oeil: [21, -58] };
  function goHeadClair(p) {
    const j = clamp(p.joues || 0), g = clamp(p.anguleux || 0), o = (p.face || {}).mouth === 'o';
    const pts = [[-18, 18], [14, 18], [22, 15], [30, 9 + 2 * j], [37 + 8 * j, 3 + 2 * j]];
    if (g > 0.02) pts.push([42 + 10 * j + 12 * g, 5 + 3 * g, 1], [43 + 11 * j + 2 * g, -1, 1], [46 + 12 * j + 22 * g, -6, 1], [44 + 12 * j + 4 * g, -11, 1]);
    else pts.push([43 + 11 * j, -5]);
    if (o) pts.push([46 + 12 * j, -8], [41 + 7 * j, -12], [46 + 12 * j, -17]);       // bouche ouverte : encoche sous la moustache
    else pts.push([45 + 12 * j, -13]);
    pts.push([43 + 8 * j, -19], [39, -23]);
    return pts.concat(GO_NEZ_PC, [[34, -58], [32, -64], [31, -72], [27, -84], [16, -95], [0, -101], [-18, -97], [-32, -84], [-40, -64], [-40, -44], [-34, -26], [-26, -10], [-22, 4]]);
  }
  function goHead(p) {
    if (goTete(p)) return goTete(p).pts(p);
    if (goClair(p)) return goHeadClair(p);
    const j = clamp(p.joues || 0), g = clamp(p.anguleux || 0);
    const cheek = [[30 + 12 * j, -4 + 3 * j], [33 + 17 * j, -14], [31 + 13 * j, -24]];
    if (g > 0.02) { cheek[0] = [30 + 12 * j + 2 * g, -4 + 3 * j, 1]; cheek[1] = [36 + 17 * j + 14 * g, -10 + 4 * g, 1]; cheek[2] = [31 + 13 * j + 3 * g, -24, 1]; }
    return [[-18, 18], [14, 18], [16, 8], [24, 0 + 2 * j]].concat(cheek, [[34, -28], [40, -32], [46, -38], [47, -46], [42, -52], [34, -54], [32, -62], [31, -72], [27, -84], [16, -95], [0, -101], [-18, -97], [-32, -84], [-40, -64], [-40, -44], [-34, -26], [-26, -10], [-22, 4]]);
  }
  // moustache en guidon : barre horizontale sous le nez, pointes qui remontent (arrière sur la joue, avant devant la lèvre)
  const GO_MOUST_PC = [[15, -33], [19, -29], [26, -28], [34, -30], [40, -31], [48, -29], [55, -29], [59, -34], [62, -32], [60, -25], [54, -21], [44, -20], [36, -21], [28, -21], [20, -22], [14, -28]];
  const GO_BROW = { n: [-66, -67, -67.5], up: [-68.5, -71.5, -70], frown: [-68.5, -66, -63.5], worry: [-65.5, -68.5, -72] };
  function goFaceClair(p, f, j) {
    const g = clamp(p.anguleux || 0);
    fillPts([[-4, -66], [-20, -72], [-35, -66], [-42, -50], [-37, -30], [-29, -22], [-24, -34], [-18, -50], [-6, -56], [6, -58]], GO.cheveux, 3);   // couronne de cheveux
    for (const [a, b] of [[[-36, -60], [-30, -40]], [[-28, -66], [-22, -48]], [[-16, -66], [-12, -56]]]) strokePts([a, b], 'rgba(30,18,10,0.5)', 1.2);
    X.earPaint(-10, -44);
    strokePts([[-14, -92], [2, -98], [16, -92]], 'rgba(255,250,235,0.8)', 3.2); dot(-2, -88, 3, 'rgba(255,255,240,0.6)');   // crâne luisant
    hatch([[-24, -40], [4, -28], [10, -8], [-6, 18], [-34, 4]], 0.6, 3.6, 0.28);
    // joue : léger rose dans le bombé, pli qui la sépare du nez, ombre sous la mâchoire, lustre quand elle est gonflée
    fillPts([[30, -24], [40 + 8 * j, -20], [44 + 11 * j, -12], [40 + 9 * j, -2], [32 + 5 * j, 4], [26, -4], [25, -16]], 'rgba(222,120,105,' + (0.16 + 0.14 * j) + ')', 0, 0);
    strokePts([[34, -31], [27, -24], [24, -12], [27, -1], [33 + 4 * j, 6]], 'rgba(150,85,65,' + (0.35 + 0.3 * j) + ')', 1.6);
    strokePts([[22, 14], [32, 9], [38 + 6 * j, 4]], 'rgba(120,70,50,0.45)', 1.6);
    if (j > 0.05) strokePts([[40 + 6 * j, -17], [44 + 9 * j, -11]], 'rgba(255,245,230,' + (0.6 * j) + ')', 2.2);
    if (g > 0.02) {                                                                                     // arêtes de l'objet anguleux sous la peau
      strokePts([[30, -2], [42 + 10 * j + 12 * g, 5 + 3 * g]], 'rgba(140,80,60,' + (0.7 * g) + ')', 1.4);
      strokePts([[30, -8], [46 + 12 * j + 22 * g, -6], [36, -14]], 'rgba(140,80,60,' + (0.7 * g) + ')', 1.4);
      strokePts([[34, -6], [44 + 12 * j + 18 * g, -6.5]], 'rgba(255,240,225,' + (0.6 * g) + ')', 1.6);
    }
    // nez rougeaud dans le profil : teinte, narine, reflet
    fillPts(GO_NEZ_PC.concat([[35, -34], [35, -46]]), 'rgba(196,88,72,0.86)', 0, 0);
    strokePts([[40, -34], [44, -33], [46, -36]], 'rgba(120,40,35,0.6)', 1.3);
    dot(45, -43, 2.6, 'rgba(255,225,210,0.7)');
    // bouche sous la moustache
    const m = f.mouth || 'n', bx = 44 + 11 * j, by = -12;
    if (m === 'o') { fillPts([[bx + 6, -18], [bx - 4 - 2 * j, -13], [bx - 5 - 2 * j, -11], [bx + 6, -6]], '#3a1714', 0, 0); strokePts([[bx - 4, -16], [bx - 6 - 2 * j, -12], [bx - 4, -8]], 'rgba(110,35,35,0.9)', 1.6); }
    else if (m === 'tight') { fillPts([[bx, -14], [bx - 6 - 4 * j, -12], [bx - 10 - 5 * j, -15], [bx - 6 - 4 * j, -10], [bx, -11]], 'rgba(190,95,90,0.85)', 0, 0);
      strokePts([[bx + 1, -13], [bx - 6 - 4 * j, -12], [bx - 11 - 5 * j, -16]], 'rgba(110,35,35,0.95)', 1.8); }          // lèvres pincées, sourire gêné
    else if (m === 'smile') strokePts([[bx + 1, -13], [bx - 6, -11], [bx - 12, -16]], 'rgba(110,35,35,0.95)', 2);
    else strokePts([[bx + 1, by], [bx - 9, by]], 'rgba(110,35,35,0.95)', 1.8);
    // œil : blanc, pupille (devant ; dans le coin arrière avec regardCoin), paupière selon face.eyes
    const e = f.eyes || 'open';
    if (e === 'closed') strokePts([[14, -57], [21, -55], [28, -58]], 'rgba(30,18,16,0.9)', 2);
    else {
      const k = e === 'wide' ? 1.35 : 1, cy = -58.5, Y = (y) => cy + (y - cy) * k;
      fillPts([[13, Y(-58)], [19, Y(-63)], [27, Y(-62.5)], [30, Y(-59)], [26, Y(-55)], [17, Y(-54.5)]], '#f4efe4', 0, 0);
      const px = p.regardCoin ? 17.5 : 24.5, pr = e === 'wide' ? 2.6 : 3.1;
      dot(px, -58, pr, '#2a1f1d'); dot(px - 0.9, -59, 1, 'rgba(255,255,255,0.85)');
      const lid = p.regardCoin ? 2.5 : e === 'half' ? 4 : 0;                                         // paupière qui descend
      if (lid > 0) fillPts([[12, -58.5], [19, -64], [28, -63.5], [31, -59.5], [27, -63.5 + lid], [19, -64 + lid], [13, -57.5]], GO.peauD, 0, 0);
      strokePts([[12, -58.5], [19, Y(-63) + lid], [27, Y(-62.5) + lid], [31, -59.5]], 'rgba(28,16,14,0.95)', 1.9);
      strokePts([[16, Y(-54.5)], [26, Y(-55)]], 'rgba(120,80,60,0.45)', 1);
    }
    // sourcil épais (face.brow : n | up | frown | worry = levé côté nez)
    const b = GO_BROW[f.brow] || GO_BROW.n, d = e === 'wide' ? -1.5 : 0;
    fillPts([[11, b[0] - 2 + d], [21, b[1] - 2.5 + d], [32, b[2] - 2 + d], [33, b[2] + 1.5 + d], [21, b[1] + 1.5 + d], [11, b[0] + 1 + d]], GO.cheveux, 0, 0);
    larmes(p, 21, -58);
  }
  // ---- Tête B, « bon roi barbu » (option tete:'B' ; absente = tête d'origine) : barbe courte et ronde qui suit la mâchoire
  //      et englobe la moustache, joues rondes au-dessus, nez rond rougeaud dans le profil, sourcils épais, crâne dégarni.
  //      Repères locaux (tête) : bouche (devant des lèvres) [44 + 4·joues, -13] ; centre de la joue [24 + 2·joues, -33] ; œil [25, -51].
  const GO_TETE_B = {
    bouche: (j) => [44 + 4 * j, -13], joue: (j) => [24 + 2 * j, -33], oeil: [25, -51],
    pts(p) {
      const j = clamp(p.joues || 0), dj = 4 * j;
      return [[-20, 22], [14, 22], [16, 12], [17, 2], [22, 2], [30, 3], [37, 0], [42 + dj, -6], [44 + dj, -11], [46 + dj, -16], [46 + dj, -21], [42, -24],
        [45, -26], [48, -29], [49, -34], [47, -39], [43, -44], [40, -50], [38, -56], [38, -60], [36, -66], [32, -78], [24, -90], [12, -98],
        [-4, -101], [-20, -97], [-33, -86], [-40, -70], [-41, -52], [-37, -34], [-31, -18], [-27, -4], [-24, 10]];
    },
    bosse(a) { const r = 8 * Math.pow(Math.sin(PI * a), 0.35); return ell(lerp(19, 16, a), lerp(1, 13, a), r * 1.1, r, 12); },
    paint(p, f, j) {
      const g = clamp(p.anguleux || 0), dj = 4 * j, EN = 'rgba(40,22,12,';
      // couronne de cheveux bruns (arrière du crâne), crâne luisant, rides du front
      fillPts([[4, -60], [-8, -68], [-24, -73], [-37, -64], [-43, -46], [-40, -26], [-31, -14], [-25, -26], [-21, -44], [-12, -56], [0, -52]], GO.cheveux, 3);
      for (const [a, b] of [[[-36, -58], [-31, -36]], [[-28, -66], [-23, -46]], [[-17, -66], [-12, -56]], [[-40, -40], [-35, -22]]]) strokePts([a, b], EN + '0.5)', 1.2);
      strokePts([[-12, -92], [2, -97], [16, -91]], 'rgba(255,250,235,0.8)', 3.2); dot(0, -88, 3, 'rgba(255,255,240,0.6)');
      strokePts([[22, -74], [30, -72]], 'rgba(120,70,50,0.35)', 1.1); strokePts([[20, -68], [31, -66]], 'rgba(120,70,50,0.3)', 1.1);
      // ombre gravée (nuque, cou, sous la barbe)
      hatch([[-26, -36], [-2, -26], [6, -4], [-4, 22], [-34, 10]], 0.6, 3.6, 0.28);
      hatch([[8, 2], [22, 2], [20, 22], [6, 22]], -0.7, 3, 0.35);
      // barbe : favoris devant l'oreille, suit la mâchoire, englobe la moustache ; bord inférieur = contour
      const BARBE = [[-3, -54], [5, -52], [6, -40], [8, -30], [14, -23], [22, -20], [30, -22], [36, -24], [42, -24], [56, -22], [56, 10], [20, 10], [12, 4], [4, -4], [-4, -16], [-7, -32], [-7, -46]];
      fillPts(BARBE, '#4e3220', 2);
      for (let y = -50; y < 8; y += 5) for (let x = -6; x < 50; x += 5) {
        const h = hash(x * 3.1 + y * 7.7), xx = x + 2 * h, yy = y + 2 * hash(y * 1.3 + x);
        if (yy < -24 + (xx < 10 ? -10 - (10 - xx) : 0) && !(xx < 6 && yy > -54)) continue;
        strokePts([[xx, yy], [xx + 1.5 - 3 * h, yy + 3.5]], h > 0.5 ? EN + '0.6)' : 'rgba(150,105,70,0.45)', 1.1);
      }
      // moustache fournie dans la barbe : plus sombre, mèches qui retombent sur la lèvre
      const MOUST = [[24, -20], [31, -24], [38, -26], [43, -25], [47 + dj, -21], [47 + dj, -14], [44 + dj, -13.5], [40 + dj, -15], [36, -15], [30, -16], [25, -17]];
      fillPts(MOUST, '#3d2616', 2);
      for (const x of [28, 32, 36, 40, 44]) strokePts([[x - 1, -24], [x + 1.5, -16]], 'rgba(140,100,65,0.55)', 1.1);
      strokePts([[25, -17], [30, -16], [36, -15], [42 + dj, -15], [47 + dj, -16]], EN + '0.7)', 1.2);
      // bouche dans la barbe, sous la moustache
      const m = f.mouth || 'n', bx = 44 + dj;
      if (m === 'o') { fillPts([[bx - 11, -15], [bx + 3, -15], [bx + 3, -6], [bx - 9, -5]], '#2a0f0c', 0, 0); fillPts([[bx - 9, -7], [bx + 3, -8], [bx + 3, -4], [bx - 8, -3]], 'rgba(200,110,100,0.95)', 0, 0); }
      else {
        fillPts([[bx - 8, -14.8], [bx - 2.5, -14.8], [bx - 3, -12.6], [bx - 7, -12.4]], 'rgba(168,96,86,0.9)', 0, 0);   // petite lèvre inférieure, en retrait dans la barbe
        if (m === 'tight') strokePts([[bx - 1, -14.8], [bx - 6, -14.2], [bx - 11, -17.5]], 'rgba(90,25,25,0.95)', 1.7);       // pincée, coin relevé : sourire gêné
        else if (m === 'smile') strokePts([[bx - 1, -14.8], [bx - 6, -13], [bx - 12, -18]], 'rgba(90,25,25,0.95)', 1.9);
        else strokePts([[bx - 1, -14.8], [bx - 10, -14.8]], 'rgba(90,25,25,0.9)', 1.5);
      }
      // joue ronde au-dessus de la barbe (gonfle avec joues)
      const jc = [24 + 2 * j, -33], jr = 9 + 8 * j, arc = (r, a0, a1) => { const P = []; for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * i / 12; P.push([jc[0] + r * Math.cos(a), jc[1] + r * Math.sin(a)]); } return P; };
      if (g > 0.02) {                                       // anguleux : la joue se déforme en pointes (contour de la joue, ombre nette, ≈ 20 px)
        const SP = [[-2.6, 15], [2.3, 9]], rg = (th) => jr + g * SP.reduce((m, [a0, L]) => { let d = Math.abs(th - a0); if (d > PI) d = TAU - d; return Math.max(m, L * Math.max(0, 1 - d / 0.42)); }, 0);
        const CH = []; for (let i = 0; i < 48; i++) { const th = -PI + i * TAU / 48; CH.push([jc[0] + rg(th) * Math.cos(th), jc[1] + rg(th) * Math.sin(th)]); }
        fillPts(CH, GO.peau, 0, 0);
        for (const [a0, L] of SP) { const tip = [jc[0] + (jr + L * g) * Math.cos(a0), jc[1] + (jr + L * g) * Math.sin(a0)], b1 = [jc[0] + jr * Math.cos(a0 + 0.42), jc[1] + jr * Math.sin(a0 + 0.42)], m1 = [jc[0] + jr * 0.55 * Math.cos(a0 + 0.15), jc[1] + jr * 0.55 * Math.sin(a0 + 0.15)];
          fillPts([tip, b1, m1], 'rgba(85,42,28,' + (0.5 * g) + ')', 0, 0); }
        fillPts(arc(jr, 0, 2 * PI), 'rgba(226,122,106,' + (0.2 + 0.2 * j) + ')', 0, 0);
        strokePts(CH.concat([CH[0]]), 'rgba(80,38,26,' + (0.9 * g) + ')', 1.6);
      }
      fillPts(arc(jr, 0, 2 * PI), 'rgba(226,122,106,' + (0.2 + 0.2 * j) + ')', 0, 0); fillPts(arc(jr * 0.6, 0, 2 * PI), 'rgba(226,122,106,' + (0.14 + 0.1 * j) + ')', 0, 0);
      if (j > 0.05 && g <= 0.02) strokePts(arc(jr, 0.6, 2.8), 'rgba(130,60,45,' + (0.7 * j) + ')', 1.5);
      strokePts(arc(jr * 0.62, -2.2, -1.1), 'rgba(255,248,238,' + (0.35 + 0.45 * j) + ')', 1.8);
      dot(jc[0] + 1, jc[1] - jr * 0.5, 1.6 + 1.2 * j, 'rgba(255,250,240,0.7)');
      // nez rond rougeaud (dans le contour) : teinte, aile, reflet
      fillPts([[42, -24], [45, -26], [48, -29], [49, -34], [47, -39], [43, -44], [40, -48], [37, -42], [36, -30]], 'rgba(200,96,80,0.55)', 0, 0);   // nez rougeaud
      fillPts([[43, -27], [47, -29], [48.5, -34], [46.5, -38], [42, -36]], 'rgba(196,72,58,0.75)', 0, 0);                                         // bout plus rouge
      strokePts([[38, -30], [41, -28], [43, -30], [42, -33]], 'rgba(110,40,32,0.7)', 1.3);                                                       // aile du nez
      dot(45.5, -35, 2, 'rgba(255,228,212,0.8)');
      // oreille lisible, bord ourlé
      const ox = -9, oy = -42;
      fillPts([[ox - 7, oy - 11], [ox + 4, oy - 13], [ox + 8, oy - 4], [ox + 6, oy + 8], [ox - 1, oy + 13], [ox - 8, oy + 5]], GO.peauD, 0, 0);
      strokePts([[ox - 7, oy - 11], [ox + 4, oy - 13], [ox + 8, oy - 4], [ox + 6, oy + 8], [ox - 1, oy + 13], [ox - 8, oy + 5], [ox - 7, oy - 11]], 'rgba(90,45,35,0.75)', 1.3);
      strokePts([[ox + 3, oy - 8], [ox - 3, oy - 5], [ox - 3, oy + 3], [ox + 2, oy + 6]], 'rgba(90,45,35,0.6)', 1.1);
      // œil : blanc, pupille (devant ; coin arrière avec regardCoin), paupière selon face.eyes ; poche sous l'œil
      const e = f.eyes || 'open', ex = 25, ey = -51;
      if (e === 'closed') strokePts([[ex - 7, ey], [ex, ey + 2.5], [ex + 7, ey - 0.5]], 'rgba(30,18,16,0.95)', 2);
      else {
        const k = e === 'wide' ? 1.4 : 1, Y = (dy) => ey + dy * k;
        fillPts([[ex - 7, Y(0.5)], [ex - 2, Y(-4)], [ex + 5, Y(-3.4)], [ex + 7.5, Y(-0.2)], [ex + 4, Y(3)], [ex - 3, Y(3)]], '#f4efe4', 0, 0);
        const px = p.regardCoin ? ex - 3.6 : ex + 3, pr = e === 'wide' ? 2.4 : 2.9;
        dot(px, ey - 0.3, pr, '#2a1f1d'); dot(px - 0.8, ey - 1.3, 0.9, 'rgba(255,255,255,0.9)');
        const lid = p.regardCoin ? 2.6 : e === 'half' ? 3.6 : 0;
        if (lid > 0) fillPts([[ex - 8, Y(0.5)], [ex - 2, Y(-4.6)], [ex + 5, Y(-4)], [ex + 8.5, Y(-0.4)], [ex + 5, Y(-3.4) + lid], [ex - 2, Y(-4) + lid], [ex - 7, Y(0.8)]], GO.peauD, 0, 0);
        strokePts([[ex - 7.5, Y(0.6)], [ex - 2, Y(-4) + lid], [ex + 5, Y(-3.4) + lid], [ex + 8, Y(-0.3)]], 'rgba(28,16,14,0.95)', 1.9);
      }
      strokePts([[ex - 5, ey + 5.5], [ex + 1, ey + 7], [ex + 6, ey + 5]], 'rgba(130,75,55,0.45)', 1.1);
      // sourcils épais (n | up | frown | worry = levé côté nez)
      const B = { n: [-58, -59.5, -59], up: [-60.5, -63.5, -62], frown: [-60, -58, -55], worry: [-57, -60, -64] }[f.brow] || [-58, -59.5, -59], d = e === 'wide' ? -1.5 : 0;
      const BR = [[ex - 11, B[0] - 1.5 + d], [ex - 1, B[1] - 3 + d], [ex + 10, B[2] - 2.5 + d], [ex + 11, B[2] + 1.2 + d], [ex - 1, B[1] + 1.5 + d], [ex - 11, B[0] + 1.5 + d]];
      fillPts(BR, GO.cheveux, 0, 0);
      for (const u of [0.15, 0.4, 0.65, 0.88]) { const x = ex - 11 + 21 * u; strokePts([[x, B[0] + (B[2] - B[0]) * u + 1 + d], [x + 3, B[0] + (B[2] - B[0]) * u - 2.5 + d]], EN + '0.6)', 1); }
      const lk = clamp(p.larmes || 0);
      if (lk > 0) {                                         // larmes au coin avant de l'œil, qui glissent le long du nez (loin de la joue)
        strokePts([[ex - 4, ey + 3], [ex + 7, ey + 1.5]], 'rgba(170,215,240,' + (0.9 * lk) + ')', 2.2);
        for (let i = 0; i < 2; i++) {
          const u = (((p.t || 0) * 0.7 + i * 0.5) % 1), xx = ex + 9 + u * 1.5, yy = ey + 4 + u * 22 * lk, r = 3.8 * lk * (1 - 0.3 * u);
          fillPts([[xx, yy - r * 2.2], [xx + r, yy], [xx, yy + r], [xx - r, yy]], 'rgba(160,210,240,' + (0.9 * (1 - u * 0.5)) + ')', 0, 0);
          dot(xx - r * 0.3, yy - r * 0.2, r * 0.35, 'rgba(255,255,255,0.8)');
        }
      }
    },
  };
  const goTete = (p) => (p.tete === 'ancienne' || p.profilClair === true ? null : GO_TETE_B);   // tête B par défaut ; tete:'ancienne' = tête d'origine
  function mkGontran() {
    const legP = (back) => () => {
      fillPts([[-40, 214, 1], [60, 214, 1], [60, 262, 1], [-40, 262, 1]], GO.soulier);
      if (!back) { strokePts([[22, 224], [44, 229]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25); }
      else hatch(null, 0.8, 3.6, 0.3);
      strokePts([[-20, 100], [22, 96]], 'rgba(20,30,40,0.35)', 1.2);
    };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: GO_TORSO, base: GO.pp, seed: 8101, paint: () => {
        fillPts([[2, -190], [12, -180], [22, -168], [16, -162], [6, -174], [-2, -182]], GO.chemise);                                       // col de chemise
        for (const [x, y] of [[30, -158], [45, -138], [58, -116], [68, -94], [74, -70], [77, -50]]) { dot(x, y, 2.6, P.orD); dot(x - 0.6, y - 0.6, 1.1, P.orL); }
        strokePts([[22, -176], [36, -156], [52, -132], [68, -104], [79, -72], [82, -44]], 'rgba(90,60,20,0.45)', 1.3);
        fillPts([[-52, -38, 1], [86, -42, 1], [86, -26, 1], [-52, -22, 1]], GO.ceint);                         // ceinture
        fillPts([[62, -43, 1], [74, -43, 1], [74, -25, 1], [62, -25, 1]], P.orD); fillPts([[65, -40, 1], [71, -40, 1], [71, -28, 1], [65, -28, 1]], GO.ceint);
        for (const x of [-30, -6, 18, 42]) strokePts([[x, -22], [x - 2, 32]], 'rgba(90,60,20,0.5)', 1.2);         // basques plissées
        hatch([[-56, -180], [-14, -180], [-20, 40], [-56, 40]], 0.75, 4.4, 0.28);
        shade(70, -80, -30, -80, 0.22); shade(0, -40, 0, 30, 0.18);
        strokePts([[40, -120], [58, -96]], 'rgba(255,240,190,0.35)', 2.4);
      } },
      legB: { parent: 'torso', at: [-8, -2], pts: X.legPts(1.15), base: GO.chausseD, seed: 8102, noRivet: true, paint: legP(true) },
      legF: { parent: 'torso', at: [8, -2], pts: X.legPts(1.15), base: GO.chausse, seed: 8103, paint: legP(false) },
      armB_up: upDef([-12, -152], GO.mancheD, 8104, 94, 17),
      armB_lo: foreDef('armB_up', 94, GO.mancheD, GO.peauD, true, 8105, GO.chemise),
      head: { parent: 'torso', at: [8, -182], pts: goHead, base: GO.peau, seed: 8106, noRivet: true, paint: (p) => {
        const f = p.face || {}, j = clamp(p.joues || 0), g = clamp(p.anguleux || 0);
        if (goTete(p)) { goTete(p).paint(p, f, j); return; }
        if (goClair(p)) { goFaceClair(p, f, j); return; }
        fillPts([[-4, -66], [-20, -72], [-35, -66], [-42, -50], [-37, -30], [-29, -22], [-24, -34], [-18, -50], [-6, -56], [6, -58]], GO.cheveux, 3);   // couronne de cheveux
        for (const [a, b] of [[[-36, -60], [-30, -40]], [[-28, -66], [-22, -48]], [[-16, -66], [-12, -56]]]) strokePts([a, b], 'rgba(30,18,10,0.5)', 1.2);
        X.earPaint(-10, -44);
        strokePts([[-14, -92], [2, -98], [16, -92]], 'rgba(255,250,235,0.8)', 3.2); dot(-2, -88, 3, 'rgba(255,255,240,0.6)');   // crâne luisant
        hatch([[-24, -40], [4, -28], [14, -8], [-6, 18], [-34, 4]], 0.6, 3.6, 0.28);
        dot(26, -32, 11 + 5 * j, 'rgba(218,110,105,' + (0.4 + 0.15 * j) + ')');                                    // joue rose
        if (g > 0.02) { const zz = [[8, -26, 1], [14, -36, 1], [19, -27, 1], [25, -38, 1], [30, -26, 1], [44 + 10 * g, -12, 1], [24, -8, 1], [10, -14, 1]]; fillPts(zz, 'rgba(255,236,215,' + (0.6 * g) + ')', 0, 0); strokePts(zz.concat([zz[0]]), 'rgba(140,80,60,' + (0.75 * g) + ')', 1.4); }
        if (j > 0.02) strokePts([[18, -40], [30 + 6 * j, -30], [32 + 8 * j, -16]], 'rgba(255,240,225,' + (0.6 * j) + ')', 2);
        pc([[34, -30], [41, -31], [47, -38], [48, -47], [42, -53], [33, -52], [30, -42]], GO.nez, () => { dot(41, -45, 3, 'rgba(255,220,210,0.6)'); }, 8120, { drop: false });   // nez rouge
        X.eye(f, 21, -58, 1.05); X.brow(f, 21, -67, 'rgba(70,45,25,0.95)', 2.8);
        X.mouth(f, 30 + 6 * j, -6, 'rgba(120,45,40,0.95)');
        larmes(p, 21, -58);
      } },
      bosse: { parent: 'head', at: [0, 0], noRivet: true, base: GO.peau, seed: 8107, pts: (p) => { const a = clamp(p.avale || 0); if (a <= 0.01 || a >= 0.99) return OFFP; if (goTete(p)) return goTete(p).bosse(a); const r = 8.5 * Math.pow(Math.sin(PI * a), 0.35); return goClair(p) ? ell(lerp(31, 15, a), lerp(8, 22, a), r * 1.1, r * 1.15, 12) : ell(lerp(26, 17, a), lerp(-4, 16, a), r, r * 1.1, 12); }, paint: () => hatch(null, 0.6, 3, 0.2) },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: GO.moust, seed: 8121, pts: (p) => { if (goTete(p)) return OFFP; if (goClair(p)) return GO_MOUST_PC; const j = clamp(p.joues || 0) * 8; return [[28, -35], [38, -34], [44 + j * 0.5, -29], [44 + j, -19], [41 + j, -9], [37 + j, 0, 1], [33 + j, -9], [30 + j * 0.6, -17], [23, -21], [17, -25], [20, -32]]; },
        paint: (p) => {
          if (!p || goClair(p)) { for (const x of [22, 30, 38, 46, 54]) strokePts([[x - 3, -29], [x + 2, -22]], 'rgba(150,110,70,0.5)', 1); strokePts([[20, -26], [40, -26], [56, -25]], 'rgba(255,230,190,0.25)', 1.2); hatch(null, 1.2, 3, 0.2); return; }
          for (const d of [0, 4, 8, 12]) strokePts([[36 - d * 0.6, -30], [38 - d, -10]], 'rgba(150,110,70,0.5)', 1); hatch(null, 1.2, 3, 0.2); } },
      couronneT: { parent: 'head', at: [-5, -80], noRivet: true, base: '#000', seed: 8108, pts: OFFP, extra: (p) => {
        if (!p.couronne) return; const c = cx_(); c.save(); c.scale(0.5, 0.5); drawCouronne({ plie: p.couronnePlie || 0 }); c.restore(); } },
      bourseT: { parent: 'torso', at: [52, -26], noRivet: true, base: '#000', seed: 8109, pts: OFFP, extra: (p) => {
        if (p.bourse === false || p.tenu === 'bourse' || p.tenuB === 'bourse') return; const c = cx_(); c.save(); c.scale(0.62, 0.62); c.translate(0, 62); drawBourse({ ouverte: false }); c.restore(); } },
      armF_up: upDef([-4, -152], GO.manche, 8110, 94, 17),
      armF_lo: foreDef('armF_up', 94, GO.manche, GO.peau, false, 8111, GO.chemise),
    };
    Object.assign(parts, heldParts(GO.peau, 8130, [4, 96]));
    return { hipY: -238, parts, handLen: 100, fist: [4, 96], bend: { armF: 1, armB: 1 }, nom: 'gontran', rod: { part: 'torso', at: [-30, 10] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'head', 'bosse', 'moustache', 'couronneT', 'torso', 'bourseT', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.galGontran = mkGontran();
  const GO_EXPR = { beat: { eyes: 'half', mouth: 'smile', brow: 'up' }, ronds: { eyes: 'wide', mouth: 'o', brow: 'up' }, soupir: { eyes: 'half', mouth: 'o', brow: 'worry' }, malin: { eyes: 'half', mouth: 'smile', brow: 'frown' }, inquiet: { eyes: 'wide', mouth: 'tight', brow: 'worry' } };
  GAL.gontranPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.galGontran; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, { armF_up: -0.14, armF_lo: -0.18, armB_up: 0.06, armB_lo: -0.14 });
    if (q.expr && GO_EXPR[q.expr]) faceSet(q, GO_EXPR[q.expr]);
    if (q.joues > 0.3) faceSet(q, { mouth: 'tight' });
    if (q.larmes > 0.2) faceSet(q, { brow: 'worry' });
    A.couronneT = (A.couronneT || 0) + (q.couronneRot || 0);
    A.bourseT = (A.bourseT || 0) + Math.sin((q.t || 0) * 2.1) * 0.04;
    autoTenu(q);
    for (const [suf, arm] of [['', 'armF'], ['B', 'armB']]) {
      const k = (n) => ease(clamp(q[n + suf] || 0)), held = has(arm === 'armF' ? q.tenu : q.tenuB), hk = arm === 'armF' ? 'handF' : 'handB', fwd = arm === 'armB' ? 12 : 0;
      const vt = k('ventreTape'), po = k('poser'), br = k('brandir'), bo = k('bouche');
      if (vt > 0) { const tap = q.tapote ? Math.abs(Math.sin((q.t || 0) * 7)) * 8 : 0; reach(def, q, x, y, s, dir, arm, locPt(def, q, x, y, s, dir, 'torso', [74 + fwd, -70 - tap]), vt, null); if (!held) q[hk] = 'open'; }
      if (po > 0) { const cb = q['cible' + suf] || locPt(def, q, x, y, s, dir, 'torso', [130 + fwd, -22]); reach(def, q, x, y, s, dir, arm, cb, po, held ? 'base' : null); if (!held) q[hk] = 'open'; }
      if (br > 0) reach(def, q, x, y, s, dir, arm, locPt(def, q, x, y, s, dir, 'torso', [150 + fwd, -252]), br, held ? 'centre' : null);
      if (bo > 0) { const jq = clamp(q.joues || 0), m = locPt(def, q, x, y, s, dir, 'head', goTete(q) ? ((b) => (held ? [b[0] + fwd, b[1]] : [b[0] + 4 + fwd, b[1] + 1]))(goTete(q).bouche(jq)) : goClair(q) ? (held ? [44 + 11 * jq + fwd, -12] : [48 + 11 * jq + fwd, -11]) : (held ? [40 + fwd, -18] : [44 + fwd, -14])); reach(def, q, x, y, s, dir, arm, m, bo, held ? 'bouche' : null); }
    }
    return finishQ(def, q, x, y, s, dir);
  };
  GAL.gontran = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.galGontran, GAL.gontranPose(pose, x, y, s, dir), x, y, s, o, 'gontran'); };

  // =====================================================================
  // 4) TANTE BERTHE — âgée, maigre et droite ; haute coiffe blanche à ailes, robe longue vert éteint, tablier ivoire, châle rouge sang.
  // =====================================================================
  const BE = { peau: '#e4c4a6', peauD: '#c6a183', coiffe: '#efe9da', coiffeD: '#d2c9b4', robe: '#5f6e4b', robeD: '#4b5a3b', tablier: '#e6dcc4', tablierD: '#cbbf9f', chale: '#7e2b26', chaleD: '#5c1d1a', soulier: '#2e2420', cheveux: '#c9c4ba' };
  const BE_TORSO = [[-12, -190], [10, -190], [18, -176], [24, -156], [27, -128], [21, -98], [18, -66], [24, -20], [32, 40], [42, 120], [52, 200], [58, 236, 1], [-50, 236, 1], [-44, 180], [-36, 100], [-30, 20], [-26, -60], [-28, -110], [-30, -150], [-24, -176]];
  const BE_HEAD = [[-14, 16], [10, 16], [11, 4], [17, -4], [22, -8], [25, -14], [24, -20], [26, -24], [25, -28], [28, -32], [42, -38, 1], [31, -46], [27, -56], [27, -66], [24, -80], [12, -93], [-6, -98], [-24, -90], [-33, -70], [-32, -48], [-25, -30], [-18, -10]];
  const BE_COIFFE = [[28, -68], [33, -84], [36, -100], [44, -112], [40, -124], [24, -128], [4, -134], [-20, -142], [-44, -152], [-64, -156], [-74, -146], [-66, -128], [-52, -110], [-42, -88], [-38, -64], [-34, -42], [-27, -28, 1], [-28, -54], [-22, -76], [-6, -88], [14, -86]];
  function mkBerthe() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: BE_TORSO, base: BE.robe, seed: 8201, paint: () => {
        fillPts([[2, -66], [20, -66], [26, -20], [36, 40], [46, 130], [54, 228], [14, 232], [4, 140], [-2, 40]], BE.tablier);           // tablier
        strokePts([[2, -66], [20, -66], [26, -20], [36, 40], [46, 130], [54, 228]], 'rgba(120,105,80,0.55)', 1.2);
        for (const xx of [12, 22, 30]) strokePts([[xx * 0.6, -50], [xx, 80], [xx + 10, 226]], 'rgba(120,105,80,0.35)', 1);
        fillPts([[-30, -70, 1], [24, -70, 1], [24, -60, 1], [-30, -60, 1]], BE.robeD);
        for (const [x0, x1] of [[-14, -30], [-4, -16], [-24, -42]]) strokePts([[x0, -56], [(x0 + x1) / 2, 80], [x1, 228]], 'rgba(20,30,20,0.4)', 1.2);
        const CHALE = [[-26, -180], [16, -182], [28, -150], [28, -118], [22, -86], [16, -64, 1], [4, -84], [-10, -100], [-24, -90], [-34, -74, 1], [-34, -110], [-34, -150]];
        fillPts(CHALE, BE.chale);   // châle sur les épaules, pointe devant à la taille
        strokePts([[16, -182], [28, -150], [28, -118], [22, -86], [16, -64], [4, -84], [-10, -100], [-24, -90], [-34, -74]], 'rgba(40,10,8,0.6)', 1.4);
        for (let i = 0; i < 9; i++) { const u = i / 8, fx = lerp(16, -34, u), fy = lerp(-64, -74, u) - 22 * Math.sin(PI * u); strokePts([[fx, fy], [fx - 1, fy + 9]], BE.chaleD, 1.3); }   // franges
        strokePts([[-20, -170], [8, -120], [14, -80]], 'rgba(255,200,180,0.25)', 2);
        hatch(CHALE, 0.5, 3.6, 0.22, 1, '40,10,8');
        fillPts([[4, -190], [14, -184], [10, -176], [2, -182]], BE.coiffe);
        hatch([[-56, -150], [-16, -150], [-22, 236], [-56, 236]], 0.75, 4.4, 0.26, 1.05, '220,225,210');
        shade(40, 0, -48, 0, 0.26);
      } },
      soulier: { parent: 'torso', at: [40, 230], noRivet: true, base: BE.soulier, seed: 8202, pts: [[-14, -8], [14, -10], [28, -2], [30, 7, 1], [-14, 8, 1]] },
      armB_up: upDef([-10, -150], BE.robeD, 8204, 94, 13),
      armB_lo: foreDef('armB_up', 94, BE.robeD, BE.peauD, true, 8205, BE.tablierD),
      head: { parent: 'torso', at: [6, -184], pts: BE_HEAD, base: BE.peau, seed: 8206, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        strokePts([[10, -40], [18, -26]], 'rgba(120,80,60,0.45)', 1.2); strokePts([[6, -62], [12, -66]], 'rgba(120,80,60,0.35)', 1);   // rides
        dot(16, -30, 7, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -54, 0.95); X.brow(f, 17, -62, 'rgba(70,60,55,0.95)', 2.6);
        X.mouth(f, 25, -21, 'rgba(120,60,55,0.95)');
      } },
      coiffe: { parent: 'head', at: [0, 0], pts: BE_COIFFE, base: BE.coiffe, seed: 8207, noRivet: true, paint: () => {
        for (const [a, b, cc] of [[[20, -90], [34, -116], [26, -124]], [[0, -96], [-10, -126], [-24, -138]], [[-20, -94], [-40, -126], [-58, -146]], [[-34, -84], [-52, -118], [-68, -146]]]) strokePts([a, b, cc], 'rgba(150,140,120,0.5)', 1.2);
        strokePts([[28, -72], [-6, -84], [-34, -64]], 'rgba(150,140,120,0.55)', 1.4);
        hatch([[-74, -150], [-36, -110], [-36, -40], [-74, -40]], 0.5, 3.6, 0.2); strokePts([[36, -100], [42, -112], [36, -122]], 'rgba(255,255,255,0.7)', 2);
        shade(30, -100, -40, -100, 0.15);
      } },
      armF_up: upDef([-2, -150], BE.robe, 8208, 94, 13),
      armF_lo: foreDef('armF_up', 94, BE.robe, BE.peau, false, 8209, BE.tablier),
    };
    Object.assign(parts, heldParts(BE.peau, 8230, [4, 96]));
    return { hipY: -238, parts, handLen: 100, fist: [4, 96], bend: { armF: 1, armB: 1 }, nom: 'berthe', rod: { part: 'torso', at: [-20, 30] },
      order: ['armB_up', 'armB_lo', 'objetB', 'soulier', 'head', 'coiffe', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.galBerthe = mkBerthe();
  const BE_SOURCILS = { severe: { brow: 'frown', mouth: 'tight' }, 'sévère': { brow: 'frown', mouth: 'tight' }, surpris: { brow: 'up', eyes: 'wide', mouth: 'o' }, satisfait: { brow: 'n', eyes: 'half', mouth: 'smile' } };
  GAL.berthePose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.galBerthe; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    defA(A, { armF_up: -0.1, armF_lo: -0.3, armB_up: 0.05, armB_lo: -0.2 });
    faceSet(q, BE_SOURCILS[q.sourcils || 'severe'] || BE_SOURCILS.severe);
    if (q.tenu === 'galette') { if (q.deuxMains == null) q.deuxMains = true; if (q.presente == null) q.presente = 1; }
    const cou = ease(clamp(q.couronner || 0)); if (cou > 0) q.tilt = (q.tilt || 0) + 0.05 * cou;
    autoTenu(q);
    const pr = ease(clamp(q.presente || 0));
    if (pr > 0) reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [124, -96]), pr, has(q.tenu) ? 'centre' : null);
    const br = ease(clamp(q.brandir || 0));
    if (br > 0) reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [96, -250]), br, has(q.tenu) ? 'centre' : null);
    if (cou > 0) { const cb = q.cible || locPt(def, q, x, y, s, dir, 'torso', [170, -250]); reach(def, q, x, y, s, dir, 'armF', cb, cou, has(q.tenu) ? (q.tenu === 'couronne' ? 'bas' : 'centre') : null); }
    const cp = ease(clamp(q.couper || 0));
    if (cp > 0 && q.tenu === 'couteau' && !(p.ang && p.ang.objet != null)) q._o0 = 0.9 * cp;
    if (cp > 0) { const c0 = q.cible || locPt(def, q, x, y, s, dir, 'torso', [150, -40]); const cb = [c0[0], c0[1] - Math.abs(Math.sin((q.t || 0) * 8)) * 14 * s]; reach(def, q, x, y, s, dir, 'armF', cb, cp, q.tenu === 'couteau' ? 'pointe' : null); }
    for (const [suf, arm, pt] of [['', 'armF', [-6, -44]], ['B', 'armB', [-16, -44]]]) {
      const h = ease(clamp(q['poingHanche' + suf] || 0)); if (h <= 0) continue;
      reach(def, q, x, y, s, dir, arm, locPt(def, q, x, y, s, dir, 'torso', pt), h, null);
      if (!has(arm === 'armF' ? q.tenu : q.tenuB)) q[arm === 'armF' ? 'handF' : 'handB'] = 'fist';
    }
    return finishQ(def, q, x, y, s, dir);
  };
  GAL.berthe = (pose, x, y, s, o) => { s = s == null ? 0.9 : s; const dir = (o && o.dir) || 1; return run(CH.galBerthe, GAL.berthePose(pose, x, y, s, dir), x, y, s, o, 'berthe'); };

  // =====================================================================
  // 5) LE PETIT — enfant (tête 1/4), blouse bleu ciel délavé à col blanc, culotte brune, cheveux roux en épi, taches de rousseur.
  //    Postures : 'aGenoux' (défaut), 'quatrePattes', 'debout'. Tige vers la fente avant (dessinée par l'enveloppe).
  // =====================================================================
  const PE = { peau: '#efcfae', peauD: '#d4ab88', blouse: '#7f9fb3', blouseD: '#65859a', col: '#f1ece0', culotte: '#6a4a32', culotteD: '#523826', cheveux: '#b0602c', cheveuxD: '#8a4520', bas: '#ddd5c4', basD: '#bdb4a2', soulier: '#3a2a20' };
  const PE_TORSO = [[-10, -130], [10, -130], [18, -118], [28, -100], [32, -60], [34, -20], [36, 14], [32, 26, 1], [-34, 28, 1], [-36, 10], [-34, -40], [-32, -90], [-26, -114], [-18, -126]];
  const PE_HEAD = [[-14, 14], [10, 14], [12, 4], [20, -2], [27, -8], [29, -16], [27, -22], [29, -26], [35, -32, 1], [30, -38], [28, -46], [28, -58], [24, -74], [12, -88], [-6, -95], [-26, -90], [-40, -74], [-44, -52], [-38, -30], [-28, -14], [-20, 0]];
  const PE_HAIR = [[27, -70], [32, -60, 1], [22, -65], [20, -56, 1], [13, -68], [6, -60, 1], [0, -71], [-14, -68], [-24, -60, 1], [-27, -66], [-34, -46, 1], [-37, -56], [-44, -34, 1], [-46, -54], [-50, -60, 1], [-45, -72], [-52, -82, 1], [-38, -88], [-30, -100, 1], [-18, -96], [-14, -118, 1], [-5, -101], [5, -122, 1], [7, -98], [18, -102, 1], [17, -90], [26, -80]];
  const PE_POCHE = [[6, -42, 1], [30, -42, 1], [31, -14, 1], [6, -12, 1]];
  const legC = (len, wt, rk) => ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.5], [rk + 0.5, len - 4]], ep(0, len, rk, rk, 10, 0, PI), [[-rk - 0.5, len - 4], [-wt + 1, len * 0.5]]);
  const PE_FOOT = ep(0, 0, 8, 8, 8, PI, TAU).concat([[14, 2], [28, 4], [31, 11, 1], [-10, 12, 1], [-9, 4]]);
  function mkPetit() {
    const legU = (back) => ({ parent: 'torso', at: [back ? -5 : 5, -2], pts: legC(80, 15, 11), base: back ? PE.culotteD : PE.culotte, seed: back ? 8301 : 8302, noRivet: !!back, paint: () => { fillPts([[-30, 50, 1], [30, 50, 1], [30, 100, 1], [-30, 100, 1]], back ? PE.peauD : PE.peau); strokePts([[-14, 50], [14, 50]], 'rgba(40,20,10,0.5)', 1.2); hatch(null, 0.8, 3.6, back ? 0.3 : 0.2); } });
    const legL = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, 80], pts: legC(78, 11, 8), base: back ? PE.peauD : PE.peau, seed: back ? 8303 : 8304, noRivet: !!back, paint: () => { fillPts([[-20, 44, 1], [20, 44, 1], [20, 90, 1], [-20, 90, 1]], back ? PE.basD : PE.bas); strokePts([[-12, 46], [12, 46]], 'rgba(120,110,90,0.6)', 1.2); hatch(null, 0.8, 3.6, 0.2); } });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, 78], pts: PE_FOOT, base: PE.soulier, seed: back ? 8305 : 8306, noRivet: true, paint: () => strokePts([[4, 3], [22, 6]], 'rgba(255,255,255,0.25)', 1.2) });
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PE_TORSO, base: PE.blouse, seed: 8310, paint: () => {
        fillPts(PE_POCHE, PE.blouseD); strokePts([[6, -42], [30, -42]], 'rgba(30,40,50,0.6)', 1.3);
        fillPts([[-12, -132], [12, -132], [24, -118], [12, -110], [0, -118], [-14, -120]], PE.col);                      // col blanc
        strokePts([[12, -132], [24, -118], [12, -110]], 'rgba(120,110,90,0.6)', 1.2);
        for (const [x0, x1] of [[-10, -16], [4, 8], [-24, -30]]) strokePts([[x0, -100], [x1, 24]], 'rgba(30,45,60,0.35)', 1.2);
        hatch([[-40, -120], [-12, -120], [-14, 30], [-40, 30]], 0.75, 4, 0.26);
        shade(30, 0, -36, 0, 0.22);
      } },
      legB_up: legU(true), legB_lo: legL(true), piedB: foot(true), legF_up: legU(false), legF_lo: legL(false), piedF: foot(false),
      armB_up: upDef([-8, -110], PE.blouseD, 8320, 64, 11, 9),
      armB_lo: foreDef('armB_up', 64, PE.blouseD, PE.peauD, true, 8321, null, [0.82, 0.7]),
      head: { parent: 'torso', at: [4, -124], pts: PE_HEAD, base: PE.peau, seed: 8322, noRivet: true, paint: (p) => {
        const f = p.face || {}, cl = clamp(p.clin || 0);
        X.earPaint(-12, -38);
        hatch([[-26, -36], [0, -26], [8, -6], [-8, 14], [-34, 2]], 0.6, 3.6, 0.22);
        dot(18, -26, 8, 'rgba(225,125,110,' + (0.28 + 0.2 * cl) + ')');
        for (let i = 0; i < 7; i++) dot(10 + 12 * hash(i * 2.7), -34 + 10 * hash(i * 5.3), 1.3, PE.cheveuxD);              // taches de rousseur
        if (cl > 0.5) { strokePts([[8, -46], [15, -43 + 2 * cl], [22, -47]], 'rgba(30,18,14,0.95)', 2.6); strokePts([[9, -40], [16, -38], [22, -41]], 'rgba(150,90,70,0.5)', 1.2); }
        else X.eye(f, 16, -46, 1.35);
        X.brow(f.brow ? f : Object.assign({}, f, { brow: cl > 0.5 ? 'frown' : 'n' }), 16, -57, 'rgba(140,70,30,0.95)', 2.4);
        if (cl > 0.5) strokePts([[27, -18], [22, -14], [14, -16], [12, -20]], 'rgba(130,50,45,0.95)', 2);
        else X.mouth(f, 25, -17, 'rgba(140,55,50,0.95)');
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: PE_HAIR, base: PE.cheveux, seed: 8323, noRivet: true, paint: () => { for (const [a, b] of [[[-30, -86], [-22, -64]], [[-20, -92], [-10, -70]], [[-6, -94], [2, -70]], [[6, -92], [12, -70]], [[-42, -70], [-36, -48]], [[-48, -64], [-42, -44]], [[18, -84], [22, -68]]]) strokePts([a, b], 'rgba(90,40,15,0.6)', 1.3); strokePts([[16, -86], [-8, -94]], 'rgba(255,200,150,0.4)', 1.6); hatch(null, 0.5, 3.4, 0.18); } },
      armF_up: upDef([-2, -110], PE.blouse, 8324, 64, 11, 9),
      armF_lo: foreDef('armF_up', 64, PE.blouse, PE.peau, false, 8325, null, [0.82, 0.7]),
      pocheBord: { parent: 'torso', at: [0, 0], noRivet: true, base: PE.blouseD, seed: 8326, pts: (p) => (p.poche > 0.05 ? PE_POCHE : OFFP), paint: () => { strokePts([[6, -42], [30, -42]], 'rgba(30,40,50,0.6)', 1.3); hatch(null, 0.8, 3.4, 0.2); } },
    };
    Object.assign(parts, heldParts(PE.peau, 8340, [3.3, 67], 0.72));
    return { hipY: -170, parts, handLen: 70, fist: [3.3, 67], bend: { armF: 1, armB: 1 }, nom: 'petit', rod: { part: 'torso', at: [-16, 6] },
      order: ['armB_up', 'armB_lo', 'objetB', 'legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF', 'head', 'cheveux', 'torso', 'armF_up', 'armF_lo', 'objet', 'doigts', 'pocheBord', 'doigtsB'] };
  }
  CH.galPetit = mkPetit();
  // postures : hanche (repère des pieds, avant = +x), inclinaison du buste, angles relatifs cuisse / jambe / pied, tête
  const PE_POST = {
    debout: { tilt: 0, hip: [0, -170], u: 0, l: 0, f: 0, head: 0 },
    aGenoux: { tilt: 0, hip: [0, -40], u: -1.2, l: 2.77, f: 1.57, head: 0 },
    quatrePattes: { tilt: 1.2, hip: [-10, -92], u: -1.2, l: 1.57, f: 1.57, head: -1.0 },
  };
  GAL.petitPose = function (p, x, y, s, dir) {
    const q = prep(p), A = q.ang, def = CH.galPetit; x = x || 0; y = y || 0; s = s == null ? 0.9 : s; dir = dir || 1;
    const name = q.posture || (q.quatrePattes ? 'quatrePattes' : q.debout ? 'debout' : 'aGenoux');
    const P0 = PE_POST[name] || PE_POST.aGenoux, P1 = PE_POST[q.posture2] || P0, mk = ease(clamp(q.mixK || 0));
    const L = (k) => lerp(P0[k], P1[k], mk), hip = [lerp(P0.hip[0], P1.hip[0], mk), lerp(P0.hip[1], P1.hip[1], mk)], tl = L('tilt');
    const w4 = (name === 'quatrePattes' ? 1 - mk : 0) + (q.posture2 === 'quatrePattes' ? mk : 0), wG = (name === 'aGenoux' ? 1 - mk : 0) + (q.posture2 === 'aGenoux' ? mk : 0);
    const ca = Math.cos(-tl), sa = Math.sin(-tl);
    q.tilt = tl + (p.tilt || 0); q.dx = hip[0] * ca - hip[1] * sa + (p.dx || 0); q.dy = hip[0] * sa + hip[1] * ca - def.hipY + (p.dy || 0);
    const sw = q.marche ? Math.sin((q.t || 0) * 7) * 0.32 * q.marche : 0;
    A.legF_up = (A.legF_up || 0) + L('u') + sw; A.legB_up = (A.legB_up || 0) + L('u') - 0.06 - sw;
    A.legF_lo = (A.legF_lo || 0) + L('l') + (sw < 0 ? -sw * 0.8 : 0); A.legB_lo = (A.legB_lo || 0) + L('l') + 0.04 + (sw > 0 ? sw * 0.8 : 0);
    A.piedF = (A.piedF || 0) + L('f'); A.piedB = (A.piedB || 0) + L('f');
    const me = ease(clamp(q.menton || 0)), cl = clamp(q.clin || 0);
    A.head = (A.head || 0) + L('head') - 0.32 * me - 0.08 * cl;
    if (me > 0.3) faceSet(q, { eyes: 'half', mouth: 'smile', brow: 'up' });
    if (cl > 0.5) faceSet(q, { mouth: 'smile' });
    const userF = p.ang && p.ang.armF_up != null, userB = p.ang && p.ang.armB_up != null;
    defA(A, { armF_up: -0.1, armF_lo: -0.25, armB_up: 0.05, armB_lo: -0.2 });
    for (const [k, ko] of [['tenu', 'tenuO'], ['tenuB', 'tenuBO']]) if (has(q[k]) && !(q[ko] && q[ko].echelle != null)) q[ko] = Object.assign({ echelle: { part: 0.7, galette: 0.5, couronne: 0.7 }[q[k]] || 1 }, q[ko]);
    autoTenu(q);
    if (w4 > 0) {                                                                     // mains au plancher
      const cr = q.ramper ? Math.sin((q.t || 0) * 6) * 10 : 0;
      if (!userF) reach(def, q, x, y, s, dir, 'armF', [x + dir * s * (120 + cr), y - 9 * s], w4, null);
      if (!userB) reach(def, q, x, y, s, dir, 'armB', [x + dir * s * (98 - cr), y - 9 * s], w4, null);
    }
    if (wG > 0) {                                                                     // mains posées sur les cuisses
      if (!userF) reach(def, q, x, y, s, dir, 'armF', [x + dir * s * 56, y - 50 * s], wG, null);
      if (!userB) reach(def, q, x, y, s, dir, 'armB', [x + dir * s * 44, y - 50 * s], wG, null);
    }
    const de = ease(clamp(q.designe || 0));
    if (de > 0) {                                                                     // bras tendu, main ouverte, vers la cible
      const S0 = locPt(def, q, x, y, s, dir, 'torso', [-2, -110]);
      const cb = q.cible || locPt(def, q, x, y, s, dir, 'torso', [140, -230]);
      let vx = cb[0] - S0[0], vy = cb[1] - S0[1]; const dl = Math.hypot(vx, vy) || 1; vx /= dl; vy /= dl;
      reach(def, q, x, y, s, dir, 'armF', [S0[0] + vx * 128 * s, S0[1] + vy * 128 * s], de, null);
      if (!has(q.tenu)) q.handF = 'open';
    }
    const po = clamp(q.poche || 0);
    if (po > 0) {
      const dn = smooth(0.55, 1, po);
      reach(def, q, x, y, s, dir, 'armF', locPt(def, q, x, y, s, dir, 'torso', [18, lerp(-58, -24, dn)]), ease(Math.min(1, po * 1.6)), has(q.tenu) ? 'centre' : null);
      if (po >= 0.98) q._cacheObjet = true;
    }
    return finishQ(def, q, x, y, s, dir);
  };
  function drawRodV(x0, y0, slotY, w, lean) {
    const c = cx_(); if (y0 >= slotY) return; const len = slotY - y0;
    c.save(); c.translate(x0, y0); c.rotate(-lean);
    const gr = c.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#5b3d22'); gr.addColorStop(0.45, '#c8a06a'); gr.addColorStop(1, '#6e4a2a');
    c.fillStyle = gr; c.fillRect(-w / 2, 0, w, len / Math.cos(lean)); c.restore();
    c.save(); c.beginPath(); c.ellipse(x0 + Math.sin(lean) * len, slotY, w * 1.6, 2.6, 0, 0, TAU); c.fillStyle = 'rgba(8,4,2,0.6)'; c.fill(); c.restore();
  }
  GAL.petit = (pose, x, y, s, o) => {
    o = o || {}; s = s == null ? 0.9 : s; const dir = o.dir || 1, def = CH.galPetit, q = GAL.petitPose(pose, x, y, s, dir);
    const slot = o.slot != null ? o.slot : M.ST.slotF;
    if (o.rod !== false) { const { mats } = M.partMatrices(def, q, x, y, s, dir), rp = M.wpt(mats.torso, def.rod.at[0], def.rod.at[1]); drawRodV(rp[0], rp[1], slot, 7.5 * Math.max(0.6, s), 0.05 * dir); }
    return run(def, q, x, y, s, Object.assign({}, o, { rod: false, slot }), 'petit');
  };
  GAL.BEND = { gontran: CH.galGontran.bend, berthe: CH.galBerthe.bend, petit: CH.galPetit.bend };

  // =====================================================================
  // 6) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; (x,y) = base de l'objet ; o.rot, o.dir, o.cast, o.alpha, o.ombre
  // =====================================================================
  const accDefs = {};
  function accDef(name) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => { const ob = OBJ[name], c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(p.o); c.restore(); } } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    o = Object.assign({}, OBJ[name].held && name === 'figurine' ? { sorte: 'porcelaine' } : {}, o || {}); s = s == null ? 1 : s;
    return M.puppet(accDef(name), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of ['galette', 'part', 'feve', 'figurine', 'couronne', 'bourse', 'pieces', 'piece', 'addition', 'assiette', 'couteau']) GAL[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // =====================================================================
  // 7) DÉCORS — pré-rendus dans GAL.init()
  // =====================================================================
  const BOIS = '#4a3020', BOISL = '#6b4a30';
  function poutre(pts, seed) { piece(pts, BOIS, () => { const bb = M.bbox(pts); for (let i = 0; i < 6; i++) { const y = bb[1] + (bb[3] - bb[1]) * (i + 0.5) / 6; strokePts([[bb[0], y], [bb[2], y + 3 * Math.sin(i)]], 'rgba(150,110,70,0.25)', 1); } hatch(null, 0.8, 4.4, 0.3); }, { seed }); }
  function poutreV(x0, x1, y0, y1, seed) { piece([[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]], BOIS, () => { for (let i = 1; i < 4; i++) { const x = lerp(x0, x1, i / 4); strokePts([[x, y0], [x + 2, (y0 + y1) / 2], [x, y1]], 'rgba(150,110,70,0.3)', 1); } hatch(null, 0.3, 4.4, 0.3); }, { seed }); }
  function brace(x0, y0, x1, y1, w, seed) { piece([[x0, y0, 1], [x0 + w, y0, 1], [x1, y1, 1], [x1 - w, y1, 1]], BOIS, () => hatch(null, 0.6, 4.4, 0.3), { seed }); }
  const SALLE = { cheminee: { x: 260, foyer: [160, 360], feuY: 1372, linteau: 950 }, fenetre: { x: 820, y0: 540, y1: 900 }, tapisserie: { x: 588, y: 900 }, lustre: { x: 540, y: 540 } };
  GAL.SALLE = SALLE;
  function drawSalle(x, ep_) {
    const W = 1080, H = 1400, R = M.rng(77 + (ep_ === 'xix' ? 1 : ep_ === 'moderne' ? 2 : 0));
    x.fillStyle = ep_ === 'moderne' ? '#e4d7b8' : ep_ === 'xix' ? '#d4bf92' : '#d9c49a'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) dot(R() * W, R() * H, 6 + R() * 34, 'rgba(140,110,60,0.05)');
    x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.55; x.fillStyle = M.tex.paperPat; x.fillRect(0, 0, W, H); x.restore();
    hatch([[0, 0], [W, 0], [W, H], [0, H]], 0.8, 9, 0.06, 1, '20,16,24', [0, 0, W, H]);
    // colombages : sablières, poteaux, décharges parallèles (aucune croix)
    poutreV(0, W, 300, 334, 9001); poutreV(0, W, 1350, 1384, 9002);
    for (const [a, b, sd] of [[456, 486, 9003], [640, 670, 9004], [958, 990, 9005]]) poutreV(a, b, 334, 1350, sd);
    poutreV(486, 640, 820, 846, 9006); poutreV(670, 958, 470, 496, 9007); poutreV(670, 958, 930, 956, 9008);
    brace(488, 818, 612, 336, 30, 9009); brace(488, 1348, 612, 848, 30, 9010); brace(990, 1348, 1080, 1000, 30, 9011); brace(672, 1348, 760, 958, 30, 9012);
    // fenêtre à petits carreaux, nuit bleue
    const F = SALLE.fenetre, fx0 = F.x - 90, fx1 = F.x + 90;
    piece([[fx0 - 16, F.y0 - 16, 1], [fx1 + 16, F.y0 - 16, 1], [fx1 + 16, F.y1 + 16, 1], [fx0 - 16, F.y1 + 16, 1]], BOISL, null, { seed: 9020 });
    piece([[fx0, F.y0, 1], [fx1, F.y0, 1], [fx1, F.y1, 1], [fx0, F.y1, 1]], '#1f2c4a', () => {
      const g = x.createLinearGradient(0, F.y0, 0, F.y1); g.addColorStop(0, '#16213c'); g.addColorStop(1, '#34476e'); x.fillStyle = g; x.fillRect(fx0, F.y0, 180, F.y1 - F.y0);
      fillPts(ep(F.x + 40, F.y0 + 70, 22, 22, 16, -1.2, 2.0).concat(ep(F.x + 50, F.y0 + 64, 18, 18, 16, 2.0, -1.2)), '#efe6c4');
      for (const [sx, sy] of [[F.x - 50, F.y0 + 40], [F.x - 20, F.y0 + 150], [F.x + 60, F.y0 + 220], [F.x - 60, F.y0 + 260]]) dot(sx, sy, 2, 'rgba(240,235,200,0.9)');
      fillPts([[fx0, F.y1 - 60], [F.x - 30, F.y1 - 110], [F.x + 40, F.y1 - 80], [fx1, F.y1 - 120], [fx1, F.y1], [fx0, F.y1]], '#141c30');
      for (let i = 1; i < 4; i++) strokePts([[lerp(fx0, fx1, i / 4), F.y0], [lerp(fx0, fx1, i / 4), F.y1]], '#3b2a1c', 3.2);
      for (let i = 1; i < 6; i++) strokePts([[fx0, lerp(F.y0, F.y1, i / 6)], [fx1, lerp(F.y0, F.y1, i / 6)]], '#3b2a1c', 3.2);
      strokePts([[fx0 + 10, F.y0 + 20], [fx0 + 30, F.y0 + 6]], 'rgba(255,255,255,0.25)', 2);
    }, { seed: 9021 });
    poutreV(fx0 - 24, fx1 + 24, F.y1 + 14, F.y1 + 30, 9022);
    // cheminée : hotte, linteau, jambages de pierre, foyer
    const C = SALLE.cheminee;
    piece([[96, 960, 1], [424, 960, 1], [372, 334, 1], [148, 334, 1]], '#cdbfa6', () => { for (let y = 380; y < 960; y += 70) strokePts([[110, y], [410, y + 4]], 'rgba(120,100,80,0.2)', 1.2); hatch(null, 0.8, 5, 0.18); shade(260, 400, 420, 400, 0.25); }, { seed: 9030 });
    piece([[80, 950, 1], [440, 950, 1], [440, 1040, 1], [80, 1040, 1]], P.pierre, () => { for (const xx of [140, 210, 290, 370]) strokePts([[xx, 960], [xx, 1040]], 'rgba(90,75,55,0.5)', 1.4); strokePts([[80, 994], [440, 994]], 'rgba(90,75,55,0.3)', 1); hatch(null, 0.5, 4.5, 0.2); }, { seed: 9031 });
    piece([[66, 936, 1], [454, 936, 1], [460, 958, 1], [60, 958, 1]], BOISL, () => hatch(null, 0.2, 4, 0.25), { seed: 9032 });
    piece([[C.foyer[0], 1040, 1], [C.foyer[1], 1040, 1], [C.foyer[1], 1395, 1], [C.foyer[0], 1395, 1]], '#2a1c14', () => {
      for (let y = 1060; y < 1395; y += 26) strokePts([[C.foyer[0], y], [C.foyer[1], y]], 'rgba(120,70,50,0.35)', 1.2);
      for (let y = 1060; y < 1395; y += 26) for (let xx = C.foyer[0] + ((y / 26) % 2) * 22; xx < C.foyer[1]; xx += 44) strokePts([[xx, y], [xx, y + 26]], 'rgba(120,70,50,0.3)', 1);
      const g = x.createLinearGradient(0, 1040, 0, 1200); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(C.foyer[0], 1040, 200, 160);
      fillPts(ell(C.x, 1220, 46, 56, 20), '#1b1310'); strokePts(ell(C.x, 1220, 30, 36, 18).concat([[C.x + 30, 1220]]), 'rgba(110,90,70,0.5)', 1.6);   // contrecœur de fonte (cercle)
    }, { seed: 9033 });
    for (const [a, b] of [[100, 160], [360, 420]]) piece([[a, 1040, 1], [b, 1040, 1], [b, 1395, 1], [a, 1395, 1]], P.pierreD, () => { for (let y = 1100; y < 1395; y += 62) strokePts([[a, y], [b, y]], 'rgba(70,55,40,0.5)', 1.4); hatch(null, 0.5, 4.5, 0.22); }, { seed: 9034 + a });
    for (const [lx, ly, lw, sd] of [[C.x - 70, 1366, 150, 9040], [C.x - 50, 1350, 120, 9041]]) piece([[lx, ly - 12], [lx + lw, ly - 14], [lx + lw + 6, ly], [lx + lw, ly + 12], [lx, ly + 12], [lx - 6, ly]], '#5a3a24', () => { strokePts([[lx, ly], [lx + lw, ly - 2]], 'rgba(200,150,100,0.3)', 1.2); fillPts(ell(lx + lw + 2, ly, 5, 10, 10), '#a07650'); }, { seed: sd });
    for (const ax of [C.x - 80, C.x + 80]) { piece([[ax - 5, 1395, 1], [ax + 5, 1395, 1], [ax + 5, 1330, 1], [ax - 5, 1330, 1]], '#2a2622', null, { seed: 9045 + ax }); dot(ax, 1326, 9, '#3a3430'); }
    // garniture du manteau selon l'époque
    if (ep_ === 'moyenage') {
      for (const [px, sd] of [[150, 9050], [370, 9051]]) piece(ell(px, 900, 34, 34, 20), '#8f8d86', () => { strokePts(ell(px, 900, 24, 24, 18).concat([[px + 24, 900]]), 'rgba(60,58,52,0.5)', 1.4); strokePts([[px - 18, 884], [px - 6, 876]], 'rgba(255,255,255,0.5)', 1.6); }, { seed: sd });
      piece([[230, 936, 1], [290, 936, 1], [284, 904, 1], [236, 904, 1]], '#6b4a30', () => hatch(null, 0.3, 4, 0.25), { seed: 9052 });
    } else if (ep_ === 'xix') {
      piece(ell(260, 700, 92, 120, 30), '#b08d45', () => { fillPts(ell(260, 700, 76, 104, 30), '#9fb0b4'); strokePts([[214, 640], [240, 600]], 'rgba(255,255,255,0.5)', 3); }, { seed: 9053 });   // miroir ovale doré
      piece([[226, 936, 1], [294, 936, 1], [290, 880], [276, 856], [244, 856], [230, 880]], '#6a4428', () => { fillPts(ell(260, 888, 18, 18, 18), '#efe8d8'); strokePts([[260, 888], [260, 874]], '#222', 1.6); strokePts([[260, 888], [270, 892]], '#222', 1.6); }, { seed: 9054 });   // pendule au cadran nu
      for (const vx of [140, 380]) { piece([[vx - 14, 936, 1], [vx + 14, 936, 1], [vx + 18, 900], [vx + 8, 880], [vx - 8, 880], [vx - 18, 900]], '#3f5f8a', () => strokePts([[vx - 8, 920], [vx - 6, 892]], 'rgba(255,255,255,0.5)', 1.4), { seed: 9055 + vx }); for (let i = 0; i < 3; i++) strokePts([[vx, 880], [vx - 14 + i * 14, 846]], '#6a7a4a', 1.6); }
      for (const [a, b, sd] of [[fx0 - 30, fx0 + 26, 9058], [fx1 - 26, fx1 + 30, 9059]]) piece([[a, F.y0 - 30, 1], [b, F.y0 - 30, 1], [b - 6, F.y1 + 40], [a + 6, F.y1 + 50]], '#8a3b2c', () => { for (let k = 1; k < 4; k++) strokePts([[lerp(a, b, k / 4), F.y0 - 30], [lerp(a, b, k / 4), F.y1 + 40]], 'rgba(40,10,5,0.4)', 1.2); }, { seed: sd });
    } else {
      piece([[190, 640, 1], [330, 640, 1], [330, 760, 1], [190, 760, 1]], '#efe9dc', () => { fillPts([[202, 652], [318, 652], [318, 748], [202, 748]], '#7f9fb3'); fillPts([[202, 720], [250, 690], [290, 710], [318, 680], [318, 748], [202, 748]], '#5f7a4b'); dot(290, 676, 10, '#e8c46a'); }, { seed: 9060 });   // cadre (paysage)
      piece([[130, 936, 1], [170, 936, 1], [176, 900, 1], [124, 900, 1]], '#b5603c', null, { seed: 9061 }); for (let i = 0; i < 5; i++) piece(ell(150 + (i - 2) * 9, 884 - Math.abs(i - 2) * -4, 9, 16, 10), '#4f7a46', null, { seed: 9062 + i });
      piece([[fx0 - 6, 990, 1], [fx1 + 6, 990, 1], [fx1 + 6, 1110, 1], [fx0 - 6, 1110, 1]], '#ece6d6', () => { for (let xx = fx0 + 6; xx < fx1; xx += 16) strokePts([[xx, 996], [xx, 1104]], 'rgba(120,110,90,0.5)', 2); }, { seed: 9063 });   // radiateur
      piece([[fx0 + 20, 1110, 1], [fx0 + 30, 1110, 1], [fx0 + 30, 1350, 1], [fx0 + 20, 1350, 1]], '#d9d2c2', null, { seed: 9064 });
    }
    // pied de mur sombre (raccord avec le plancher)
    const g2 = x.createLinearGradient(0, 1300, 0, 1400); g2.addColorStop(0, 'rgba(40,25,10,0)'); g2.addColorStop(1, 'rgba(40,25,10,0.35)'); x.fillStyle = g2; x.fillRect(0, 1300, W, 100);
  }
  // feu animé (dessin direct, fonction pure de t)
  function feu(t, fx, fy, k) {
    const c = cx_(); k = k == null ? 1 : k;
    c.save();
    const g = c.createRadialGradient(fx, fy - 70, 10, fx, fy - 70, 240 * k); g.addColorStop(0, 'rgba(255,170,70,' + (0.32 + 0.05 * noise(t * 5, 3)) + ')'); g.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g; c.fillRect(fx - 260, fy - 330, 520, 360);
    for (const [col, sc] of [['rgba(196,72,34,0.92)', 1], ['rgba(236,138,46,0.95)', 0.74], ['rgba(250,206,96,0.95)', 0.46]]) {
      for (let i = 0; i < 6; i++) {
        const bx = fx + (i - 2.5) * 22 * k, h = (78 + 40 * hash(i * 3.7)) * (0.72 + 0.28 * noise(t * 3.2 + i * 7.1, i)) * sc * k, swy = noise(t * 4.1 + i * 3.3, 9 + i) * 12 * k, w = 16 * k * (0.6 + 0.4 * sc);
        c.beginPath(); c.moveTo(bx - w, fy); c.quadraticCurveTo(bx - w * 0.8 + swy * 0.3, fy - h * 0.55, bx + swy, fy - h); c.quadraticCurveTo(bx + w * 0.8 + swy * 0.3, fy - h * 0.55, bx + w, fy); c.closePath();
        c.fillStyle = col; c.fill();
      }
    }
    for (let i = 0; i < 7; i++) { const u = (t * 0.6 + i * 0.29) % 1, sx = fx + Math.sin(u * 9 + i * 2) * 26 * k + (hash(i) - 0.5) * 60 * k, sy = fy - 50 * k - u * 190 * k; c.beginPath(); c.arc(sx, sy, 2.2 * k * (1 - u), 0, TAU); c.fillStyle = 'rgba(255,200,110,' + (0.9 * (1 - u)) + ')'; c.fill(); }
    c.restore();
  }
  GAL.feu = feu;
  GAL.salle = function (t, up, o) {
    o = o || {}; up = up || 0; const ep_ = o.epoque || 'moyenage', c = cx_(), K = GAL.K;
    c.drawImage(K.salle[ep_] || K.salle.moyenage, 0, -up);
    if (o.feu !== false) feu(t, SALLE.cheminee.x, SALLE.cheminee.feuY - up, 1);
  };
  // ---- lustres (suspendus à une chaîne qui monte hors cadre) ; (x,y) = bas de la pièce
  function drawLustreMA(x) {
    const ring = (back) => { const o = []; for (let i = 0; i <= 24; i++) { const a = back ? PI + i / 24 * PI : i / 24 * PI; o.push([130 * Math.cos(a), -70 + 24 * Math.sin(a)]); } return o; };
    for (const a of [-2.4, -1.57, -0.74]) strokePts([[0, -330], [130 * Math.cos(a), -70 + 24 * Math.sin(a)]], '#2a2622', 2.4);
    const cand = (a) => { const cx = 130 * Math.cos(a), cy = -70 + 24 * Math.sin(a); piece([[cx - 5, cy, 1], [cx + 5, cy, 1], [cx + 5, cy - 34, 1], [cx - 5, cy - 34, 1]], '#efe6cf', () => strokePts([[cx - 2, cy - 4], [cx - 2, cy - 30]], 'rgba(255,255,255,0.6)', 1.4), { seed: 9100 + Math.round(a * 10) }); };
    for (const a of LUSTRE_MA_A) if (Math.sin(a) < 0) cand(a);
    piece(ring(true).concat(ring(true).reverse().map((p) => [p[0] * 0.92, p[1] + 2])), '#3a3430', null, { seed: 9110 });
    piece(ring(false).concat(ring(false).reverse().map((p) => [p[0] * 0.92, p[1] - 10])), '#3a3430', () => hatch(null, 0.4, 3, 0.3), { seed: 9111 });
    for (const a of LUSTRE_MA_A) if (Math.sin(a) >= 0) cand(a);
    for (const a of [0.6, 1.57, 2.5]) piece(ell(130 * Math.cos(a), -60 + 24 * Math.sin(a), 6, 9, 10), '#2a2622', null, { seed: 9112 });
    piece([[-6, -340, 1], [6, -340, 1], [6, -320, 1], [-6, -320, 1]], '#2a2622', null, { seed: 9113 });
  }
  const LUSTRE_MA_A = [0.3, 1.35, 2.4, 3.45, 4.5, 5.55];
  function drawLustreXIX(x) {
    for (const sx of [-1, 0, 1]) strokePts([[0, -400], [sx * 70, -250]], '#8a6a2c', 2);
    piece([[-20, -410, 1], [20, -410, 1], [12, -392], [-12, -392]], P.or, null, { seed: 9120 });
    piece(ep(0, -250, 120, 30, 20, PI, TAU).concat([[110, -238], [-110, -238]]), '#ece6d6', () => { const g = x.createLinearGradient(0, -290, 0, -236); g.addColorStop(0, '#f6f2e8'); g.addColorStop(1, '#d9e0d4'); x.fillStyle = g; x.fillRect(-130, -290, 260, 60); strokePts([[-90, -262], [-40, -276]], 'rgba(255,255,255,0.8)', 3); }, { seed: 9121 });   // abat-jour d'opaline
    piece([[-6, -330, 1], [6, -330, 1], [7, -260, 1], [-7, -260, 1]], 'rgba(220,235,235,0.7)', null, { seed: 9122 });            // verre de lampe
    piece(ell(0, -205, 46, 40, 24), '#efe9dc', () => { const g = x.createRadialGradient(-10, -215, 4, 0, -205, 46); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#d8d4c4'); x.fillStyle = g; x.fillRect(-50, -250, 100, 90); }, { seed: 9123 });   // globe d'opaline
    piece([[-44, -170, 1], [44, -170, 1], [36, -140], [0, -128], [-36, -140]], P.or, () => { strokePts([[-30, -160], [20, -164]], 'rgba(255,240,190,0.6)', 2); hatch(null, 0.3, 3.4, 0.2); }, { seed: 9124 });   // réservoir de laiton
    piece([[-8, -130, 1], [8, -130, 1], [4, -100], [0, -86, 1], [-4, -100]], P.orD, null, { seed: 9125 });
  }
  function drawLustreMod(x) {
    piece([[-22, -200, 1], [22, -200, 1], [100, -110], [110, -96, 1], [-110, -96, 1], [-100, -110]], '#efe6cc', () => { strokePts([[-100, -104], [100, -104]], '#2a2a2a', 4); strokePts([[-60, -150], [-20, -186]], 'rgba(255,255,255,0.8)', 3); shade(-60, -150, 80, -120, 0.2); }, { seed: 9130 });
    piece([[-10, -214, 1], [10, -214, 1], [10, -198, 1], [-10, -198, 1]], '#2a2a2a', null, { seed: 9131 });
    strokePts([[0, -214], [0, -400]], '#2a2a2a', 2.2);
  }
  const LUSTRE = { moyenage: { w: 320, h: 360, flammes: LUSTRE_MA_A.map((a) => [130 * Math.cos(a), -70 + 24 * Math.sin(a) - 34]) }, xix: { w: 280, h: 420, glow: [0, -205] }, moderne: { w: 260, h: 420, glow: [0, -90] } };
  GAL.LUSTRE = LUSTRE;
  GAL.lustre = function (t, x, y, o) {
    o = o || {}; const ep_ = o.epoque || 'moyenage', cv = GAL.K.lustre[ep_], L = LUSTRE[ep_], c = cx_();
    const sw = Math.sin(t * (o.f || 0.7) + (o.ph || 0)) * (o.amp == null ? 0.012 : o.amp);
    c.save(); c.translate(x, y); c.rotate(sw);
    c.strokeStyle = 'rgba(20,15,10,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -cv.height + 30); c.lineTo(0, -2200); c.stroke();
    M.flat(cv, 0, 0, { cast: o.cast });
    const lit = o.allume !== false;
    if (lit && ep_ === 'moyenage') for (let i = 0; i < L.flammes.length; i++) { const [fx, fy] = L.flammes[i], h = 14 + 3 * noise(t * 6 + i * 3, i), sx = noise(t * 5 + i, 20 + i) * 2; const g = c.createRadialGradient(fx, fy - 6, 1, fx, fy - 6, 26); g.addColorStop(0, 'rgba(255,210,120,0.45)'); g.addColorStop(1, 'rgba(255,180,80,0)'); c.fillStyle = g; c.fillRect(fx - 28, fy - 34, 56, 56); c.beginPath(); c.moveTo(fx - 4, fy); c.quadraticCurveTo(fx - 4, fy - h * 0.6, fx + sx, fy - h); c.quadraticCurveTo(fx + 4, fy - h * 0.6, fx + 4, fy); c.fillStyle = 'rgba(250,196,90,0.95)'; c.fill(); }
    if (lit && L.glow) { const [gx, gy] = L.glow, r = ep_ === 'xix' ? 120 : 170, a = ep_ === 'xix' ? 0.34 + 0.03 * noise(t * 4, 2) : 0.3; const g = c.createRadialGradient(gx, gy, 6, gx, gy, r); g.addColorStop(0, 'rgba(255,226,150,' + a + ')'); g.addColorStop(1, 'rgba(255,210,120,0)'); c.fillStyle = g; c.fillRect(gx - r, gy - r, 2 * r, 2 * r); if (ep_ === 'moderne') { c.beginPath(); c.ellipse(0, -92, 18, 12, 0, 0, TAU); c.fillStyle = 'rgba(255,246,210,0.95)'; c.fill(); } }
    c.restore();
  };
  // ---- tapisserie (bannière à fleurs et étoile, sans lettre) ; (x,y) = bas des franges
  function drawTapisserie(x) {
    piece([[-120, -560, 1], [120, -560, 1], [120, -560 + 18, 1], [-120, -542, 1]], BOISL, null, { seed: 9200 });
    for (const sx of [-1, 1]) piece(ell(sx * 126, -551, 9, 12, 12), P.orD, null, { seed: 9201 + sx });
    piece([[-104, -542, 1], [104, -542, 1], [104, -40, 1], [-104, -40, 1]], '#6d2a2a', () => {
      fillPts([[-90, -528], [90, -528], [90, -54], [-90, -54]], '#2f3a52');
      strokePts([[-90, -528], [90, -528], [90, -54], [-90, -54], [-90, -528]], P.ocreL, 3);
      for (let y = -520; y < -60; y += 24) { dot(-97, y, 3, P.ocreL); dot(97, y, 3, P.ocreL); }
      const st = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - PI / 2, r = i % 2 ? 26 : 62; st.push([r * Math.cos(a), -300 + r * Math.sin(a), 1]); }
      fillPts(st, '#c9a046'); strokePts(st.concat([st[0]]), 'rgba(80,50,10,0.6)', 1.4); dot(0, -300, 10, '#7e2b26');
      const fleur = (fx, fy, r, cl) => { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; fillPts(ell(fx + Math.cos(a) * r, fy + Math.sin(a) * r, r * 0.7, r * 0.7, 10), cl); } dot(fx, fy, r * 0.6, '#e8c46a'); };
      for (const [fx, fy] of [[-50, -460], [50, -460], [-50, -140], [50, -140]]) { strokePts([[fx, fy + 10], [fx + 6, fy + 44]], '#5f7a4b', 2); fleur(fx, fy, 9, '#e6dcc4'); }
      for (const [fx, fy] of [[0, -470], [0, -130], [-60, -300], [60, -300]]) fleur(fx, fy, 6, '#b5603c');
      hatch(null, 0.8, 5, 0.18, 1, '20,16,24', [-110, -560, 110, -30]);
    }, { seed: 9202 });
    for (let i = 0; i < 26; i++) strokePts([[-100 + i * 8, -40], [-100 + i * 8 + 1, -6]], P.ocreL, 2.2);
  }
  GAL.tapisserie = function (t, x, y, o) {
    o = o || {}; const cv = GAL.K.tapisserie, c = cx_(), sw = Math.sin(t * 0.6 + (o.ph || 1)) * (o.amp == null ? 0.008 : o.amp), sc = o.s || 1;
    c.save(); c.translate(x, y); c.rotate(sw); c.scale(sc, sc);
    c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3; c.beginPath(); for (const sx of [-110, 110]) { c.moveTo(sx, -560); c.lineTo(sx, -2400); } c.stroke();
    M.flat(cv, 0, 0, { cast: o.cast }); c.restore();
  };
  // ---- table de bois massif vue de face ; origine = bas des pieds avant
  const TABLE = { largeur: 640, plateau: -258, pieds: [-285, 285], places: [-210, -75, 75, 210], nappeBas: -182, dessous: -212, x: 540, y: 1388, s: 1 };
  GAL.TABLE = TABLE;
  GAL.tableAt = (x, y, s) => { s = s == null ? 1 : s; return { plateauY: y + TABLE.plateau * s, places: TABLE.places.map((px) => [x + px * s, y + TABLE.plateau * s]), pieds: TABLE.pieds.map((px) => x + px * s), nappeBasY: y + TABLE.nappeBas * s, dessousY: y + TABLE.dessous * s, gauche: x - 320 * s, droite: x + 320 * s }; };
  Object.assign(TABLE, (() => { const a = GAL.tableAt(TABLE.x, TABLE.y, TABLE.s); return { plateauY: a.plateauY, placesXY: a.places, piedsX: a.pieds, nappeBasY: a.nappeBasY }; })());
  function drawTable(x, nappe) {
    const pied = (cx, y0, y1, w, col, sd) => piece([[cx - w, y0, 1], [cx + w, y0, 1], [cx + w - 2, y1 - 30], [cx + w + 3, y1 - 12, 1], [cx + w + 3, y1, 1], [cx - w - 3, y1, 1], [cx - w - 3, y1 - 12, 1], [cx - w + 2, y1 - 30]], col, () => { strokePts([[cx - w + 6, y0], [cx - w + 6, y1 - 30]], 'rgba(255,220,170,0.25)', 2); hatch(null, 0.2, 4, 0.3); }, { seed: sd });
    for (const sx of [-1, 1]) pied(sx * 250, -262, -14, 13, '#3a2416', 9300 + sx);
    piece([[-250, -64, 1], [250, -64, 1], [250, -46, 1], [-250, -46, 1]], '#3a2416', () => hatch(null, 0.2, 4, 0.3), { seed: 9303 });
    const g = x.createLinearGradient(0, -212, 0, 0); g.addColorStop(0, 'rgba(20,12,6,0.42)'); g.addColorStop(1, 'rgba(20,12,6,0.08)'); x.fillStyle = g; x.fillRect(-270, -212, 540, 200);
    for (const sx of [-1, 1]) pied(sx * 285, -236, 0, 17, BOISL, 9305 + sx);
    piece([[-300, -236, 1], [300, -236, 1], [300, -212, 1], [-300, -212, 1]], '#5a3a24', () => hatch(null, 0.2, 4, 0.3), { seed: 9308 });
    piece([[-300, -280, 1], [300, -280, 1], [320, -258, 1], [-320, -258, 1]], nappe ? '#efe8d6' : '#7a5232', () => { if (!nappe) for (let i = 0; i < 5; i++) strokePts([[-300, -276 + i * 4], [300, -276 + i * 4]], 'rgba(200,150,100,0.3)', 1); shade(0, -280, 0, -258, 0.15); }, { seed: 9309 });
    piece([[-320, -258, 1], [320, -258, 1], [320, -236, 1], [-320, -236, 1]], '#6b4a30', () => { strokePts([[-318, -254], [318, -254]], 'rgba(255,220,170,0.3)', 1.5); hatch(null, 0.2, 4, 0.25); }, { seed: 9310 });
    if (nappe) {
      const bas = []; for (let i = 0; i <= 32; i++) { const xx = lerp(330, -330, i / 32); bas.push([xx, TABLE.nappeBas + (i % 2 ? -8 : 2)]); }
      piece([[-326, -262, 1], [326, -262, 1]].concat(bas), '#ebe3cf', () => {
        for (let i = 0; i < 14; i++) { const xx = -300 + i * 46; strokePts([[xx, -256], [xx + 4, TABLE.nappeBas]], 'rgba(150,135,105,0.35)', 1.3); }
        const by = TABLE.nappeBas + 20;
        strokePts([[-326, by - 8], [326, by - 8]], 'rgba(126,43,38,0.7)', 1.6); strokePts([[-326, by + 4], [326, by + 4]], 'rgba(126,43,38,0.7)', 1.6);
        for (let xx = -310; xx <= 310; xx += 28) { dot(xx, by - 2, 3.2, 'rgba(63,95,138,0.8)'); for (const a of [0, 1.57, 3.14, 4.71]) dot(xx + 14 + Math.cos(a) * 4, by - 2 + Math.sin(a) * 4, 1.6, 'rgba(126,43,38,0.75)'); }
        hatch(null, 0.8, 5, 0.12, 1, '20,16,24', [-330, -270, 330, -170]);
      }, { seed: 9311 });
    }
  }
  GAL.table = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const cv = o.nappe === false ? GAL.K.table.nue : GAL.K.table.nappe;
    M.flat(cv, x, y, { scale: s, cast: o.cast, alpha: o.alpha });
    return GAL.tableAt(x, y, s);
  };

  // ---- pré-rendus
  GAL.init = function () {
    const K = (GAL.K = { salle: {}, lustre: {}, table: {} });
    for (const e of ['moyenage', 'xix', 'moderne']) K.salle[e] = M.pre(1080, 1400, (x) => drawSalle(x, e));
    const mkL = (e, fn) => { const L = LUSTRE[e], cv = M.cutFlat(L.w, L.h, L.w / 2, L.h - 10, fn); cv.padB = 10; return M.withShadow(cv, 8); };
    K.lustre.moyenage = mkL('moyenage', drawLustreMA); K.lustre.xix = mkL('xix', drawLustreXIX); K.lustre.moderne = mkL('moderne', drawLustreMod);
    K.tapisserie = (() => { const cv = M.cutFlat(280, 590, 140, 580, drawTapisserie); cv.padB = 10; return M.withShadow(cv, 8); })();
    for (const [k, n] of [['nappe', true], ['nue', false]]) { const cv = M.cutFlat(700, 310, 350, 300, (x) => drawTable(x, n)); cv.padB = 10; K.table[k] = M.withShadow(cv, 8); }
    return K;
  };
})();
