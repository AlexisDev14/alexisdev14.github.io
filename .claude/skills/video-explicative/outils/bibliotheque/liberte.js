// persos.js — « La statue de la Liberté, le cadeau sans socle » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.lib (alias LIB). Appeler LIB.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo (étoiles et rayures seulement). Déterministe (hash, aucun tirage aléatoire) : fonction pure de t.
// INDEX : 1) géométrie, cuivre  2) objets tenus (OBJ)  3) mains, IK, enveloppes  4) marionnettes Bartholdi, Eiffel, Oncle Sam, Pulitzer
//         5) statue, tête, bras, morceaux, caisse, sou…  6) décors atelier et port (pré-rendus dans LIB.init)
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const LIB = (M.lib = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // =====================================================================
  // 1) GÉOMÉTRIE ET COULEURS
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
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
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function mixA(a, b, k, al) { const A = hx(a), B = hx(b); k = clamp(k); const v = A.map((x, i) => Math.round(lerp(x, B[i], k))); return al == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${al})`; }
  const rgba = (h, a) => `rgba(${hx(h).join(',')},${a})`;
  const flipped = () => { const m = cx_().getTransform(); return m.a * m.d - m.b * m.c < 0; };
  LIB.geo = { ep, ell, rect, ribbon, qbez, scl, tr };

  // cuivre neuf (0) → vert-de-gris (1), interpolé
  const CU = { b0: '#C47A3E', l0: '#F0B070', d0: '#8A4A22', k0: '#5A2E14', b1: '#6FA593', l1: '#A9D3C2', d1: '#3E6B5E', k1: '#28473F' };
  function cuivre(k) { k = clamp(k || 0); return { k, b: mixA(CU.b0, CU.b1, k), l: mixA(CU.l0, CU.l1, k), d: mixA(CU.d0, CU.d1, k), x: mixA(CU.k0, CU.k1, k),
    lA: (a) => mixA(CU.l0, CU.l1, k, a), dA: (a) => mixA(CU.d0, CU.d1, k, a), xA: (a) => mixA(CU.k0, CU.k1, k, a) }; }
  LIB.cuivre = cuivre;
  // martelage : petites cupules de dinandier (reflet + ombre) dans une boîte
  function martele(x0, y0, x1, y1, C, seed, dens) {
    if (SIL()) return;
    const n = Math.round((x1 - x0) * (y1 - y0) / (dens || 260));
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, hash(seed + i * 1.37)), y = lerp(y0, y1, hash(seed * 0.7 + i * 2.91)), r = 2.2 + 2.6 * hash(i + seed * 3.3);
      strokePts(ep(x, y, r, r * 0.8, 5, PI * 1.1, PI * 1.9), C.lA(0.55), 1);
      strokePts(ep(x, y, r, r * 0.8, 5, PI * 0.1, PI * 0.9), C.dA(0.35), 1);
    }
  }
  // traînées vert-de-gris (patine qui coule) quand la couleur est entre deux
  function patine(x0, y0, x1, y1, k, seed, n) {
    const a = smooth(0.08, 0.5, k) * (1 - smooth(0.82, 1, k)); if (a <= 0.01 || SIL()) return;
    for (let i = 0; i < (n || 7); i++) {
      const x = lerp(x0, x1, hash(seed + i * 3.7)), y = lerp(y0, y0 + (y1 - y0) * 0.5, hash(seed + i * 5.1)), h = (y1 - y0) * (0.3 + 0.5 * hash(i * 9.3 + seed)), w = 3 + 6 * hash(i + seed);
      fillPts([[x - w, y], [x + w, y], [x + w * 0.6, y + h * 0.7], [x, y + h], [x - w * 0.5, y + h * 0.6]], rgba('#7fb8a4', 0.55 * a), 0, 0);
    }
  }
  // éclat : étoile de reflet à 4 branches + halo (dessin additif)
  function etoile(x, y, r, a) {
    if (SIL() || !(a > 0.01)) return;
    const c = cx_(); c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 0, x, y, r * 1.1); g.addColorStop(0, `rgba(255,240,200,${0.55 * a})`); g.addColorStop(1, 'rgba(255,220,150,0)');
    c.fillStyle = g; c.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
    c.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * PI / 4, rr = i % 2 ? r * 0.16 : (i % 4 ? r * 0.62 : r); c.lineTo(x + Math.sin(ang) * rr, y - Math.cos(ang) * rr); }
    c.closePath(); c.fillStyle = `rgba(255,250,225,${0.95 * a})`; c.fill();
    c.restore();
  }
  LIB.etoile = etoile;
  function rivets(pts, r, col) { if (SIL()) return; for (const p of pts) dot(p[0], p[1], r || 1.6, col || 'rgba(60,30,15,0.6)'); }
  function rivetLine(a, b, n, C) { const o = []; for (let i = 0; i <= n; i++) o.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]); strokePts([a, b], C.xA(0.35), 1); rivets(o, 1.5, C.xA(0.5)); }

  // =====================================================================
  // 2) OBJETS — chaque objet se dessine dans son repère (origine = point de prise sauf mention), seul ou tenu en main
  // =====================================================================
  // ---------------- le sou : pièce de cuivre, profil gravé sans lettre ; couleur 0..1, eclat 0..1, tranche 0..1 ; repère = centre, r = 22
  const PROFIL = scl(tr([[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [29, -26], [28, -30], [31, -34], [37, -39], [33, -46], [29, -56], [29, -64], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]], -2, 40), 0.24);
  function drawSou(o) {
    const C = cuivre(o.couleur), c = cx_(), r = 22;
    c.save(); if (flipped()) c.scale(-1, 1);
    c.scale(lerp(1, 0.2, clamp(o.tranche || 0)), 1);
    pc(ell(0, 0, r, r, 22), C.b, () => {
      fillPts(ell(0, 0, r, r, 22), C.d, 0, 0); fillPts(ell(-0.6, -0.8, r - 2.4, r - 2.4, 22), C.b, 0, 0);
      strokePts(ell(0, 0, r - 4.5, r - 4.5, 22).concat([[r - 4.5, 0]]), C.dA(0.8), 1.1);
      if (!SIL()) for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; dot(Math.cos(a) * (r - 2.6), Math.sin(a) * (r - 2.6), 0.75, C.lA(0.8)); }
      fillPts(PROFIL, C.dA(0.55), 0, 0); strokePts(PROFIL.slice(8, 16), C.lA(0.9), 1.1);
      for (const k of [0, 1, 2]) strokePts([[-6 + k * 4, -16], [-3 + k * 4, -21]], C.dA(0.8), 1.2);   // couronne de laurier stylisée
      fillPts(ep(0, 0, r - 3, r - 3, 10, PI * 1.05, PI * 1.55).concat(ep(0, 0, r - 8, r - 8, 10, PI * 1.55, PI * 1.05)), C.lA(0.55), 0, 0);
      shade(-r, -r, r, r, 0.3, [-r, -r, r, r]);
    }, 7101);
    c.restore();
    if (o.eclat) etoile(-9, -9, 30 * clamp(o.eclat), clamp(o.eclat));
  }
  // ---------------- tas de pièces dans la paume (compte) ; repère = dessous du tas
  function drawMonnaie(o) {
    const cols = [0, 0.15, 0.05, 0.3], C0 = o.couleur == null ? null : o.couleur, n = o.n || 4;
    for (let i = 0; i < n; i++) {
      const C = cuivre(C0 == null ? cols[i % 4] : C0), x = [-10, 6, -2, 12][i % 4], y = -6 - [0, 2, 9, 5][i % 4];
      pc(ell(x, y, 13, 5, 14), C.b, () => { fillPts(ell(x, y + 1.5, 13, 4, 14), C.d, 0, 0); fillPts(ell(x - 0.5, y - 0.6, 11.5, 3.6, 14), C.l, 0, 0); }, 7150 + i, { drop: false });
    }
  }
  // ---------------- maillet de dinandier : manche le long de +x depuis la prise, tête de buis ronde ; pts.face = face qui frappe (dessous)
  function drawMaillet() {
    pc([[-18, -5], [-12, -7], [82, -6, 1], [82, 6, 1], [-12, 7], [-18, 5]], '#8f6a3c', () => {
      strokePts([[-12, -2], [80, -2]], 'rgba(255,225,170,0.35)', 1.3); strokePts([[-8, 3], [78, 3]], 'rgba(60,35,15,0.4)', 1);
      hatch(null, 0.05, 3.2, 0.2);
    }, 7201);
    pc([[74, -26], [80, -31, 1], [112, -31, 1], [118, -26], [121, 0], [118, 26], [112, 31, 1], [80, 31, 1], [74, 26], [71, 0]], '#c39a62', () => {
      for (const y of [-18, -6, 6, 18]) strokePts([[73, y], [119, y + 1]], 'rgba(110,70,30,0.35)', 1);
      fillPts([[72, -31], [120, -31], [120, -25], [72, -25]], '#a87e4a'); fillPts([[72, 25], [120, 25], [120, 31], [72, 31]], '#8a6236');
      strokePts([[80, -20], [80, 20]], 'rgba(255,235,190,0.5)', 2);
      shade(71, 0, 121, 0, 0.3, [70, -32, 122, 32]);
    }, 7202);
  }
  // ---------------- bourse de cuir (etat 'fermee' | 'ouverte' | 'vide' = retournée, tenue par le fond, bouche en bas) ; papillon 0..1
  const BOURSE = [[-9, 4], [9, 4], [16, 12], [30, 30], [37, 52], [33, 72], [20, 84], [0, 88, 1], [-20, 84], [-33, 72], [-37, 52], [-30, 30], [-16, 12]];
  const BOURSE_VIDE = [[-8, 4], [8, 4], [14, 14], [24, 34], [27, 56], [22, 74], [12, 84], [0, 88, 1], [-12, 84], [-22, 74], [-27, 56], [-24, 34], [-14, 14]];
  function drawBourse(o) {
    const e = o.etat || 'fermee', c = cx_(), cuir = '#7a4a26', cuirD = '#5a3418', t = o.t || 0;
    c.save();
    if (e === 'vide') { c.rotate(PI); c.translate(0, -88); }
    const body = e === 'vide' ? BOURSE_VIDE : BOURSE;
    pc(body, cuir, () => {
      fillPts([[-37, 60], [37, 60], [37, 90], [-37, 90]], 'rgba(40,20,8,0.25)');
      for (const x of [-18, -6, 8, 20]) strokePts([[x * 0.5, 10], [x, 50], [x * 0.7, 84]], 'rgba(40,20,8,0.4)', 1.1);
      strokePts([[-26, 34], [-14, 30]], 'rgba(255,220,170,0.35)', 2);
      hatch(null, 0.7, 3.6, 0.22); shade(-36, 40, 36, 40, 0.3, [-40, 0, 40, 92]);
    }, 7301);
    // col et cordon
    if (e === 'ouverte') {
      pc([[-24, -12], [-14, -18], [0, -15], [14, -18], [24, -12], [16, 6, 1], [-16, 6, 1]], cuirD, () => fillPts(ell(0, -12, 18, 5, 14), '#2a160a'), 7302);
      for (let i = 0; i < 3; i++) { const C = cuivre(0.05 * i); dot(-8 + i * 8, -12 - (i % 2) * 3, 5, C.b); dot(-9 + i * 8, -13 - (i % 2) * 3, 2, C.l); }
    } else if (e === 'vide') {
      pc([[-20, -16], [-12, -22], [0, -18], [12, -22], [20, -16], [12, 6, 1], [-12, 6, 1]], cuirD, () => fillPts(ell(0, -15, 15, 5, 14), '#1e1008'), 7302);
    } else {
      pc([[-11, -14], [-6, -18], [0, -13], [6, -18], [11, -14], [9, 4, 1], [-9, 4, 1]], cuirD, () => hatch(null, 1.4, 3, 0.25), 7302);
    }
    pc(rect(-12, -1, 12, 6), '#c9a24e', () => strokePts([[-11, 2], [11, 2]], 'rgba(90,60,20,0.6)', 1), 7303);
    strokePts([[10, 3], [18, 14], [16, 24]], '#c9a24e', 2.2); dot(16, 25, 2.6, '#b08d45');
    c.restore();
    if (e === 'vide' && o.papillon > 0) { const q = papPos(o.papillon); papillon(t, q[0], q[1], 0.9, { a: q[2] }); }
  }
  function papPos(u) { u = clamp(u); return [Math.sin(u * 9) * 26 + 70 * u, 100 - 330 * Math.pow(u, 0.9) + 20 * Math.sin(u * 14), Math.min(1, u * 8)]; }
  // ---------------- papillon de nuit (gris-brun, ailes qui battent) ; repère = corps
  function papillon(t, x, y, s, o) {
    o = o || {}; const c = cx_(), fl = Math.abs(Math.sin(t * 22 + (o.ph || 0))), a = o.a == null ? 1 : o.a;
    c.save(); c.translate(x, y); c.scale(s * (o.dir || 1), s); c.rotate(o.rot || 0.2 * Math.sin(t * 3));
    if (a < 1) c.globalAlpha *= a;
    const aile = (sg) => {
      const k = lerp(0.25, 1, fl);
      pc([[0, -2], [sg * 10, -14 * k], [sg * 24, -16 * k], [sg * 26, -6 * k], [sg * 16, 2], [sg * 20, 10 * k], [sg * 10, 14 * k], [0, 4]], '#8a7e6a', () => {
        dot(sg * 15, -9 * k, 3, 'rgba(50,40,30,0.6)'); strokePts([[sg * 3, -1], [sg * 22, -11 * k]], 'rgba(60,50,40,0.5)', 1); hatch(null, 0.4, 2.6, 0.2);
      }, 7350 + (sg > 0 ? 1 : 0), { drop: false });
    };
    aile(-1); aile(1);
    pc(ell(0, 2, 3.6, 9, 10), '#4a3e30', null, 7352, { drop: false });
    strokePts([[1, -6], [5, -13]], '#4a3e30', 1); strokePts([[-1, -6], [-5, -13]], '#4a3e30', 1);
    c.restore();
  }
  LIB.papillon = (t, x, y, s, o) => papillon(t, x, y, s == null ? 1 : s, o);
  // ---------------- journal de Pulitzer : de face, gravure de la statue sur son socle + colonnes de lignes ; plie 0..1 ; repère = centre
  const JW = 105, JH = 138;
  function drawJournal(o) {
    const c = cx_(), pl = clamp(o.plie || 0);
    c.save(); if (flipped()) c.scale(-1, 1);
    if (pl < 0.5) {
      c.scale(1 - pl * 1.6, 1);
      pc(rect(-JW, -JH, JW, JH), '#ebe4d0', () => {
        fillPts(rect(-JW + 10, -JH + 10, JW - 10, -JH + 36), '#2c2826');                                 // bandeau de titre : bande noire nue
        for (const x of [-60, 0, 60]) { const st = ep(x, -JH + 23, 7, 7, 10, 0, TAU); fillPts(st.filter((_, i) => i % 2 === 0), '#ebe4d0', 0, 0); }
        strokePts([[-JW + 10, -JH + 42], [JW - 10, -JH + 42]], '#2c2826', 1.4); strokePts([[-JW + 10, -JH + 46], [JW - 10, -JH + 46]], '#2c2826', 0.8);
        // gravure : cadre, ciel clair, rayons, île, socle, statue nettement découpée (torche levée, couronne, tablette)
        const gx0 = -JW + 14, gx1 = JW - 14, gy0 = -JH + 52, gy1 = 44, I = '#26221f', kS = 0.66;
        fillPts(rect(gx0, gy0, gx1, gy1), '#e6dec8');
        for (let i = 0; i < 11; i++) { const a = -PI + 0.15 + i * (PI - 0.3) / 10; strokePts([[-12 + Math.cos(a) * 26, gy1 - 104 + Math.sin(a) * 26], [-12 + Math.cos(a) * 80, gy1 - 104 + Math.sin(a) * 80]], 'rgba(38,34,31,0.3)', 1); }
        hatch([[gx0, gy1 - 24], [gx1, gy1 - 24], [gx1, gy1], [gx0, gy1]], 0.05, 3, 0.45);
        fillPts([[gx0, gy1 - 8], [gx0 + 34, gy1 - 18], [gx1 - 34, gy1 - 18], [gx1, gy1 - 8], [gx1, gy1], [gx0, gy1]], '#5f5a52');
        fillPts([[-44, gy1 - 16], [-36, gy1 - 26], [36, gy1 - 26], [44, gy1 - 16]], '#4a4640');
        fillPts([[-17, gy1 - 24, 1], [-14, gy1 - 50, 1], [-18, gy1 - 54, 1], [18, gy1 - 54, 1], [14, gy1 - 50, 1], [17, gy1 - 24, 1]], '#3c3833');   // socle
        for (const x of [-9, 0, 9]) strokePts([[x, gy1 - 48], [x, gy1 - 28]], '#8a837a', 1.2);
        const sy = gy1 - 54, R = (x, y) => [x * kS, sy - y * kS];
        fillPts([R(-13, 0), R(-12, 26), R(-10, 46), R(-12, 54), R(-6, 58), R(-5, 63), R(5, 63), R(6, 58), R(12, 54), R(16, 40), R(13, 26), R(14, 0)], I);   // robe
        fillPts([R(-12, 54), R(-16, 72), R(-18, 92), R(-13, 92), R(-9, 72), R(-6, 58)], I);                                                              // bras levé
        fillPts([R(-20, 92), R(-11, 92), R(-15, 104)], '#b08d45'); strokePts([R(-18, 93), R(-14, 101)], '#f0d890', 1.2);                                  // flamme
        fillPts(ell(0, sy - 68 * kS, 5.5 * kS, 6.5 * kS, 10), I);                                                                                                     // tête
        for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * 0.42; strokePts([[Math.cos(a) * 5, sy - 70 * kS + Math.sin(a) * 5], [Math.cos(a) * 10, sy - 70 * kS + Math.sin(a) * 10]], I, 1.4); }
        fillPts([R(10, 50), R(18, 44), R(19, 30), R(13, 32)], '#6a645c');                                                                              // tablette
        strokePts([R(-6, 40), R(10, 20)], 'rgba(230,222,200,0.6)', 1);
        strokePts(rect(gx0, gy0, gx1, gy1), '#2c2826', 1.6, true);
        // colonnes de noms : lignes fines grises
        for (let col = 0; col < 3; col++) {
          const x0 = -JW + 14 + col * 62, x1 = x0 + 52;
          for (let y = 54; y < JH - 10; y += 7) { const w = 0.55 + 0.45 * hash(col * 31 + y); strokePts([[x0, y], [x0 + (x1 - x0) * w, y]], 'rgba(70,64,58,0.75)', 1.3); }
          if (col) strokePts([[x0 - 5, 52], [x0 - 5, JH - 12]], 'rgba(44,40,38,0.6)', 1);
        }
        strokePts([[0, -JH], [0, JH]], 'rgba(120,110,90,0.35)', 1);
        hatch(null, 0.6, 7, 0.05);
      }, 7401);
    } else {
      c.scale((pl - 0.5) * 2, 1);
      pc(rect(-JW / 2, -JH / 2, JW / 2, JH / 2), '#e4dcc6', () => {
        fillPts(rect(-JW / 2 + 6, -JH / 2 + 6, JW / 2 - 6, -JH / 2 + 22), '#2c2826');
        for (let y = -JH / 2 + 32; y < JH / 2 - 8; y += 7) strokePts([[-JW / 2 + 8, y], [JW / 2 - 8 - 14 * hash(y), y]], 'rgba(70,64,58,0.7)', 1.2);
        strokePts([[JW / 2 - 4, -JH / 2], [JW / 2 - 4, JH / 2]], 'rgba(90,80,60,0.6)', 1.6);
      }, 7402);
    }
    c.restore();
  }
  // ---------------- plan d'Eiffel : bleu avec le squelette en treillis ; deroule 0 (rouleau) → 1 (feuille 150 × 230) ; prise = coin haut avant
  const PLW = 150, PLH = 230;
  function drawPlan(o) {
    const c = cx_(), h = PLH * ease(clamp(o.deroule || 0));
    if (h > 4) {
      c.save(); if (flipped()) { c.translate(-PLW / 2, 0); c.scale(-1, 1); c.translate(PLW / 2, 0); }
      pc(rect(-PLW, 0, 0, h), '#2f5373', () => {
        const k = h / PLH, cxp = -PLW / 2, y0 = PLH - 18, top = 22;
        c.save(); c.translate(0, 0); c.scale(1, k);
        const L = 'rgba(232,236,226,0.95)', Lf = 'rgba(232,236,226,0.45)';
        strokePts(rect(-PLW + 6, 6, -6, PLH - 6).concat([[-PLW + 6, 6]]), Lf, 1);
        // silhouette pointillée de la statue
        const sil = [[cxp - 34, y0], [cxp - 30, y0 - 90], [cxp - 26, y0 - 130], [cxp - 30, y0 - 140], [cxp - 34, y0 - 178], [cxp - 30, y0 - 186], [cxp - 22, y0 - 150], [cxp - 10, y0 - 146], [cxp - 9, y0 - 160], [cxp, y0 - 170], [cxp + 9, y0 - 160], [cxp + 8, y0 - 146], [cxp + 20, y0 - 140], [cxp + 30, y0 - 112], [cxp + 26, y0 - 96], [cxp + 32, y0]];
        for (let i = 0; i < sil.length - 1; i++) { const a = sil[i], b = sil[i + 1]; strokePts([a, [lerp(a[0], b[0], 0.6), lerp(a[1], b[1], 0.6)]], Lf, 1.2); }
        // pylône : quatre montants, croix de Saint-André à chaque étage
        const lv = 6, wB = 22, wT = 10;
        for (let i = 0; i < lv; i++) {
          const ya = y0 - i * 22, yb = ya - 22, wa = lerp(wB, wT, i / lv), wb = lerp(wB, wT, (i + 1) / lv);
          strokePts([[cxp - wa, ya], [cxp - wb, yb]], L, 1.8); strokePts([[cxp + wa, ya], [cxp + wb, yb]], L, 1.8);
          strokePts([[cxp - wa, ya], [cxp + wb, yb]], L, 1.1); strokePts([[cxp + wa, ya], [cxp - wb, yb]], L, 1.1);
          strokePts([[cxp - wb, yb], [cxp + wb, yb]], L, 1.2);
        }
        // bras en treillis vers la torche
        const sh = [cxp - 10, y0 - 132], tp = [cxp - 30, y0 - 184];
        strokePts([sh, tp], L, 1.6); strokePts([[sh[0] + 6, sh[1]], [tp[0] + 6, tp[1] + 2]], L, 1.6);
        for (let i = 0; i < 4; i++) { const u0 = i / 4, u1 = (i + 1) / 4; strokePts([[lerp(sh[0], tp[0], u0), lerp(sh[1], tp[1], u0)], [lerp(sh[0], tp[0], u1) + 6, lerp(sh[1], tp[1], u1) + 2]], L, 1); }
        strokePts(ell(tp[0] + 3, tp[1] - 6, 5, 6, 10).concat([[tp[0] + 8, tp[1] - 6]]), L, 1.3);
        strokePts([[cxp - 40, y0], [cxp + 40, y0]], L, 1.6);
        c.restore();
        hatch(null, 0.9, 6, 0.06, 1, '255,255,255');
      }, 7451);
      c.restore();
    }
    // rouleau (en bas de la feuille ; seul s'il n'est pas déroulé)
    pc([[-PLW - 5, h - 9], [3, h - 9, 1], [5, h], [3, h + 9, 1], [-PLW - 5, h + 9], [-PLW - 8, h]], '#d9d2bc', () => {
      fillPts([[-PLW - 5, h - 9], [3, h - 9], [3, h - 5], [-PLW - 5, h - 5]], 'rgba(255,255,255,0.45)');
      strokePts([[-PLW - 5, h + 4], [3, h + 4]], 'rgba(80,70,50,0.4)', 1);
      fillPts(ell(-PLW - 4, h, 3.5, 8, 10), '#2f5373');
    }, 7452);
  }
  // ---------------- pinceau à long manche : prise = main AVANT sur le manche (x 0), seconde prise (main arrière) en x −120, poils au bout
  function drawPinceau(o) {
    const pein = o.peinture || CU.b0, ch = o.charge == null ? 1 : clamp(o.charge);
    pc([[-128, -4], [-122, -6], [180, -5, 1], [180, 5, 1], [-122, 6], [-128, 4]], '#9a7444', () => {
      strokePts([[-120, -2], [178, -2]], 'rgba(255,225,170,0.35)', 1.3); hatch(null, 0.05, 3.4, 0.18);
    }, 7501);
    pc([[178, -7, 1], [200, -8, 1], [200, 8, 1], [178, 7, 1]], '#b9b6ae', () => { strokePts([[180, -3], [198, -4]], 'rgba(255,255,255,0.6)', 1.2); strokePts([[189, -8], [189, 8]], 'rgba(60,60,60,0.5)', 1); }, 7502);
    pc([[200, -8], [226, -11], [240, -6], [242, 0, 1], [240, 6], [226, 11], [200, 8]], '#4a3a28', () => {
      for (const y of [-7, -3, 1, 5]) strokePts([[202, y], [238, y * 0.7]], 'rgba(20,12,6,0.5)', 0.9);
      if (ch > 0) fillPts([[218, -12], [244, -7], [244, 7], [218, 12]], mixA('#4a3a28', pein, ch));
    }, 7503);
  }
  // ---------------- seau de peinture : prise = haut de l'anse ; fond en y 112
  function drawSeau(o) {
    const pein = o.peinture || CU.b0;
    strokePts(ep(0, 40, 38, 40, 14, PI, TAU), '#4a4644', 2.6);
    pc([[-40, 38], [40, 38, 1], [33, 112, 1], [-33, 112, 1]], '#8e8c88', () => {
      for (const y of [52, 96]) strokePts([[-40, y], [40, y]], 'rgba(40,40,40,0.5)', 2);
      fillPts([[8, 38], [14, 38], [12, 70], [9, 74], [7, 62]], pein); fillPts([[-22, 38], [-17, 38], [-18, 56], [-21, 58]], pein);
      strokePts([[-26, 46], [-22, 104]], 'rgba(255,255,255,0.35)', 2.4); hatch(null, 0.2, 3.6, 0.15); shade(-40, 0, 40, 0, 0.3, [-42, 36, 42, 114]);
    }, 7551);
    pc(ell(0, 38, 40, 7, 18), pein, () => { fillPts(ell(-6, 37, 20, 3, 12), 'rgba(255,220,170,0.35)'); }, 7552, { drop: false });
    strokePts(ell(0, 38, 40, 7, 18).concat([[40, 38]]), '#5a5856', 1.6);
    dot(-38, 40, 3, '#4a4644'); dot(38, 40, 3, '#4a4644');
  }

  // registre : grip = point tenu dans le poing (dans le repère de l'objet) ; p2 = seconde prise ; pts = points nommés ; base = point posé (objet seul)
  const OBJ = {
    sou: { draw: drawSou, grip: [0, 21], pts: { centre: [0, 0], haut: [0, -22] }, base: [0, 0], doigts: 'pince' },
    monnaie: { draw: drawMonnaie, grip: [0, 2], pts: { centre: [0, -8] }, base: [0, 0], doigts: 'aucun' },
    maillet: { draw: drawMaillet, grip: [0, 0], pts: { face: [96, 31], tete: [96, 0], bout: [-18, 0] }, base: [0, 0] },
    bourse: { draw: drawBourse, grip: (o) => (o.etat === 'vide' ? [0, 6] : [0, 2]), pts: { centre: (o) => (o.etat === 'vide' ? [0, 40] : [0, 48]), bouche: (o) => (o.etat === 'vide' ? [0, 100] : [0, -14]), papillon: (o) => { const q = papPos(o.papillon || 0); return [q[0], q[1]]; } }, base: (o) => (o.etat === 'vide' ? [0, 0] : [0, 88]) },
    journal: { draw: drawJournal, grip: (o) => (o.plie > 0.5 ? [0, 60] : [-82, 132]), p2: () => [82, 132], pts: { centre: [0, 0], gravure: [0, -50], haut: [0, -138] }, base: [0, 138] },
    plan: { draw: drawPlan, grip: [-4, 0], p2: () => [-140, 0], pts: { centre: (o) => [-75, PLH * ease(clamp(o.deroule || 0)) / 2], bas: (o) => [-75, PLH * ease(clamp(o.deroule || 0))] }, base: [-75, 9] },
    pinceau: { draw: drawPinceau, grip: [0, 0], p2: () => [-84, 0], pts: { bout: [244, 0], poils: [222, 0], manche: [-120, 0] }, base: [0, 0] },
    seau: { draw: drawSeau, grip: [0, 2], pts: { bord: [0, 38], fond: [0, 112] }, base: [0, 112] },
    chapeau: { draw: (o) => samHat(o), grip: [30, 8], pts: { centre: [0, -40] }, base: [0, 10] },
  };
  LIB.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);

  // =====================================================================
  // 3) OBJETS TENUS, IK, ENVELOPPES (principe heldParts de bibliotheque/teflon.js)
  // =====================================================================
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), e = oo.echelle || 1;
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const PINCE = [[-7, -4], [0, -7], [8, -4], [9, 2], [3, 6], [-5, 5]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  const fingers = (name) => { const ob = OBJ[name]; return !ob || ob.doigts === 'aucun' ? OFFP : ob.doigts === 'pince' ? PINCE : DOIGTS; };
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fingers(p.tenu) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? fingers(p.tenuB) : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) : LIB.pt(r, 'bout') ; main arrière : LIB.pt(r, 'nom', true)
  LIB.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1;
    const q = nom === 'prise' ? g : ob.pts[nom] ? ptOf(ob.pts[nom], oo) : null; if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };

  const LA = 96, PG = [4, 96], SH_F = [-2, -146], SH_B = [-10, -146];
  // IK dans le repère du torse (même convention que M.ik : bend 1 = coude en bas / vers l'arrière de la ligne épaule-main, plié vers l'avant)
  function ikT(S, T, bend) {
    const L1 = LA, L2 = Math.hypot(PG[0], PG[1]), phi = Math.atan2(-PG[0], PG[1]);
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), base = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), a2 = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    return { a: normA(base + bend * a1), b: normA(-bend * (PI - a2) - phi) };
  }
  function armTo(q, arm, T, k, bend) {
    if (!(k > 0)) return;
    const sol = ikT(arm === 'armF' ? SH_F : SH_B, T, bend == null ? 1 : bend), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function plier(q, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), pieds à plat
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - 238 * Math.sin(th); q.dy = (q.dy || 0) + 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  function marche(q, k) {                                     // pas sur place selon t : jambes en opposition, petits bras, léger rebond
    if (!(k > 0)) return;
    const t = q.t || 0, w = Math.sin(t * TAU * (q.cadence || 1.1)), A = q.ang;
    A.legF = (A.legF || 0) - 0.34 * w * k; A.legB = (A.legB || 0) + 0.34 * w * k;
    A.armF_up = (A.armF_up || 0) + 0.13 * w * k; A.armB_up = (A.armB_up || 0) - 0.13 * w * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(t * TAU * (q.cadence || 1.1))) * 5 * k;
  }
  function vers(S, C, r) { const v = [C[0] - S[0], C[1] - S[1]], l = Math.hypot(v[0], v[1]) || 1, k = Math.min(l, r) / l; return [S[0] + v[0] * k, S[1] + v[1] * k]; }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: Object.assign({}, p.tenuO), tenuBO: Object.assign({}, p.tenuBO) }); }
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
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).scale(e, e).translate(-g[0], -g[1]);
      const T = mp(Hf, ob.p2(oo)), sol = ikT(SH_B, T, 1);
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // enveloppe commune : prépare la pose (gestes → angles ; cibles écran converties dans le repère du torse), puis dessine
  function wrap(key, poseFn, sDef) {
    const fn = (pose, x, y, s, o) => {
      s = s == null ? sDef : s; o = Object.assign({ slot: M.ST.slotF, nom: CH[key].nom }, o || {});
      const dir = o.dir || 1, q = prep(pose), def0 = CH[key];
      let def = def0;
      const loc = (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; };
      poseFn(q, loc); marche(q, q.marche === true ? 1 : q.marche); finish(q);
      if (q.brasBDevant) def = def0.devantB;
      return run(def, q, x, y, s, o);
    };
    fn.pose = (pose) => { const q = prep(pose); poseFn(q, (Pt) => Pt); marche(q, q.marche === true ? 1 : q.marche); return finish(q); };
    return fn;
  }
  LIB.BEND = { bartholdi: { armF: [1, 1], armB: [1, 1] }, eiffel: { armF: [1, 1], armB: [1, 1] }, oncleSam: { armF: [1, 1], armB: [1, 1] }, pulitzer: { armF: [1, 1], armB: [1, 1] } };

  // ---------------- pièces de corps communes (bras à articulations rondes, rivet au pivot)
  const R_COUDE = 11.5;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const upDef = (at, base, seed, paint) => ({ parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) });
  function foreDef(parent, base, skin, back, seed, cuffCol, cuffY) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, k);
      if (cuffCol) fillPts([[-14, cuffY || 62, 1], [14, cuffY || 62, 1], [15, 78, 1], [-14, 78, 1]], cuffCol);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, 0.22);
    } };
  }
  function legDef(at, base, shoe, seed, back, extraPaint, bootY) {
    return { parent: 'torso', at, pts: X.legPts(0.95), base, seed, noRivet: !!back, paint: () => {
      if (extraPaint) extraPaint();
      fillPts([[-40, bootY || 214, 1], [60, bootY || 214, 1], [60, 260, 1], [-40, 260, 1]], shoe);
      if (!back) { strokePts([[20, 224], [42, 229]], 'rgba(255,255,255,0.25)', 1.3); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.22); }
      else { hatch(null, 0.8, 3.6, 0.3); fillPts([[-40, -20], [60, -20], [60, 260], [-40, 260]], 'rgba(20,14,10,0.12)'); }
    } };
  }
  const ORDER = (pre, post) => ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB', 'legF', 'head'].concat(pre, ['torso'], post, ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']);
  const ORDER_B = (pre, post) => ['legB', 'legF', 'head'].concat(pre, ['torso'], post, ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB2']);
  function defOf(nom, parts, skin, seed, pre, post) {
    Object.assign(parts, heldParts(skin, seed));
    const d = { nom, hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(pre, post) };
    d.devantB = Object.assign({}, d, { order: ORDER_B(pre, post) });   // variante : bras arrière dessiné devant le corps (compter dans la paume…)
    return d;
  }
  const CAP = [[30, -112], [28, -86], [20, -82], [8, -84], [-4, -80], [-14, -70], [-18, -56], [-20, -42], [-26, -30], [-46, -26], [-46, -112]];
  const BOUCHE = (f) => f;   // (lisibilité)

  // =====================================================================
  // 4a) BARTHOLDI — béret noir, barbe brune courte en pointe + moustache, longue blouse gris-ivoire au genou, pantalon brun
  // =====================================================================
  const BA = { peau: '#e0bc98', peauD: '#c49c78', blouse: '#CFC7B4', blouseD: '#b3aa95', blouseL: '#e2dccd', pant: '#4A3A2C', pantD: '#3a2d22', soulier: '#1d1a19', barbe: '#4a3122', beret: '#1f1d22' };
  const BA_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [38, -112], [42, -60], [44, 0], [48, 60], [52, 122, 1], [-50, 124, 1], [-46, 60], [-42, 0], [-40, -60], [-38, -110], [-34, -150], [-26, -168]];
  const BA_BARBE = [[-3, -50], [4, -40], [14, -34], [22, -30], [31, -22], [33, -12], [29, 2], [23, 14], [15, 30, 1], [5, 14], [-6, 5], [-14, -6], [-17, -22], [-10, -38]];
  const BA_BERET = [[-48, 0], [-56, -10], [-48, -22], [-24, -30], [6, -31], [30, -25], [42, -14], [40, -3], [26, 3], [0, 5], [-26, 5]];
  function mkBartholdi() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: BA_TORSO, base: BA.blouse, seed: 8001, paint: () => {
        strokePts([[-38, -118], [-10, -112], [20, -116], [40, -120]], 'rgba(90,80,60,0.6)', 1.4);                    // empiècement
        for (const x of [-30, -16, -2, 12, 26, 38]) strokePts([[x * 0.9, -114], [x * 1.04, 30], [x * 1.12, 122]], 'rgba(90,80,60,0.38)', 1.2);
        fillPts([[4, -184], [20, -170], [16, -154], [2, -166]], BA.blouseL);                                           // col
        fillPts([[14, -168], [24, -172], [26, -160], [16, -158]], '#1f1d22'); fillPts([[18, -160], [24, -146], [19, -144], [15, -158]], '#1f1d22'); // petit nœud noir
        for (const y of [-140, -112, -84]) dot(32, y, 2, '#8d8676');
        fillPts([[4, 10, 1], [36, 10, 1], [38, 46, 1], [6, 46, 1]], 'rgba(120,110,90,0.2)'); strokePts([[4, 10], [36, 10]], 'rgba(90,80,60,0.55)', 1.2);
        fillPts([[-50, 92], [52, 92], [52, 124], [-50, 124]], 'rgba(160,140,110,0.18)');                              // bas sali de poussière de cuivre
        for (let i = 0; i < 9; i++) dot(-30 + 70 * hash(i * 3.3), 70 + 50 * hash(i * 7.1), 1.6, 'rgba(196,122,62,0.45)');
        hatch([[-54, -170], [-14, -170], [-12, 126], [-54, 126]], 0.75, 4.2, 0.28); shade(44, 0, -44, 0, 0.26);
      } },
      legB: legDef([-6, -2], BA.pantD, BA.soulier, 8002, true),
      legF: legDef([6, -2], BA.pant, BA.soulier, 8003, false),
      armB_up: upDef([-10, -146], BA.blouseD, 8004),
      armB_lo: foreDef('armB_up', BA.blouseD, BA.peauD, true, 8005, '#a49b86'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: BA.peau, seed: 8006, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts(CAP, '#3a2a1e', 3);
        X.earPaint(-8, -44); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(14, -38, 8, 'rgba(205,130,110,0.22)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(50,32,22,0.95)', 2.8); X.mouth(f, 27, -25);
        fillPts([[37, -33], [35, -29], [29, -28], [21, -29], [17, -31], [21, -35], [30, -36]], BA.barbe, 6, 0.4);   // moustache
      } },
      barbe: { parent: 'head', at: [0, 0], pts: BA_BARBE, base: BA.barbe, seed: 8007, noRivet: true, paint: () => {
        for (const [a, b] of [[[6, -36], [12, 10]], [[16, -28], [16, 18]], [[24, -18], [18, 22]], [[-6, -30], [2, 6]]]) strokePts([a, b], 'rgba(20,12,8,0.5)', 1);
        hatch(null, 1.3, 3, 0.3); strokePts([[20, -16], [26, -4]], 'rgba(255,220,180,0.2)', 1.4);
      } },
      beret: { parent: 'head', at: [-4, -84], pts: BA_BERET, base: BA.beret, seed: 8008, noRivet: true, paint: () => {
        strokePts([[-40, -16], [-10, -24], [24, -20]], 'rgba(255,255,255,0.16)', 2); fillPts([[2, -31], [5, -40], [8, -39], [7, -30]], BA.beret);
        hatch(null, 0.4, 3.4, 0.25);
      }, extra: () => { if (!SIL()) strokePts([[3, -31], [6, -40]], '#1f1d22', 2.4); } },
      armF_up: upDef([-2, -146], BA.blouse, 8009),
      armF_lo: foreDef('armF_up', BA.blouse, BA.peau, false, 8010, BA.blouseD),
    };
    return defOf('Bartholdi', parts, BA.peau, 8020, ['barbe', 'beret'], []);
  }
  CH.libBartholdi = mkBartholdi();
  LIB.bartholdi = wrap('libBartholdi', function (q, loc) {
    const A = q.ang, f = q.face;
    const fr = ease(clamp(q.frappe || 0)), pr = ease(clamp(q.presente || 0)), so = ease(clamp(q.sou || 0)), rb = ease(clamp(q.regardeBas || 0)), pe = ease(clamp(q.perplexe || 0));
    if (fr > 0 && q.tenu == null) q.tenu = 'maillet';
    if (so > 0 && q.tenu == null) q.tenu = 'sou';
    if (rb > 0) { plier(q, 0.34 * rb); A.head = (A.head || 0) + 0.38 * rb; blend(q, 'armF_up', -0.55, rb); blend(q, 'armF_lo', -0.25, rb); blend(q, 'armB_up', -0.3, rb); }
    if (pr > 0) {
      plier(q, 0.15 * pr); A.head = (A.head || 0) + 0.2 * pr;
      armTo(q, 'armF', q.cible ? vers(SH_F, loc(q.cible), 178) : [158, -112], pr);
      armTo(q, 'armB', [26, -64], pr * 0.9);
      if (pr > 0.3 && !has(q.tenu)) { q.handF = q.handF || 'open'; q.handB = q.handB || 'open'; }
      if (!f.mouth) f.mouth = 'smile';
    }
    if (fr > 0) {
      const lv = clamp(q.leve || 0), e = q.tenuO.echelle || 1, T = q.cible ? loc(q.cible) : [160, -112];
      armTo(q, 'armF', [T[0] - 96 * e - 8 * lv, T[1] - 31 * e - 30 * lv], fr);
      A.objet = (A.objet || 0) - 1.05 * lv * fr;
      armTo(q, 'armB', [Math.max(T[0] - 70, 20), T[1] + 40], 0.75 * fr);
      A.head = (A.head || 0) + 0.1 * fr;
    }
    if (so > 0) {
      const e = q.tenuO.echelle || 1;
      armTo(q, 'armF', q.cible ? (() => { const C = loc(q.cible); return [C[0], C[1] + 21 * e]; })() : [92, -236], so);
      A.head = (A.head || 0) - 0.05 * so;
    }
    if (pe > 0) {
      A.head = (A.head || 0) - 0.06 * pe; armTo(q, 'armF', headPt(q, 22, 12 + 3 * Math.sin((q.t || 0) * 9)), pe);
      if (!has(q.tenu)) q.handF = q.handF || 'open';
      if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
    }
  }, 0.9);

  // =====================================================================
  // 4b) GUSTAVE EIFFEL — tête nue, cheveux gris courts, barbe grise courte carrée + moustache, redingote noire, gilet gris perle, lavallière bordeaux
  // =====================================================================
  const EI = { peau: '#e2c2a2', peauD: '#c6a07e', habit: '#23232A', habitD: '#18181d', habitL: '#3a3a44', gilet: '#BDBCB4', giletD: '#9d9c94', lav: '#6E2232', pant: '#3c3a3e', pantD: '#2f2d31', soulier: '#141214', gris: '#a9a7a0', grisD: '#8a8880' };
  const EI_TORSO = [[-14, -176], [8, -180], [18, -168], [32, -150], [42, -112], [47, -60], [46, -10], [44, 40], [46, 116, 1], [-46, 118, 1], [-46, 40], [-46, -20], [-46, -90], [-41, -146], [-28, -168]];
  const EI_BARBE = [[-3, -50], [4, -40], [14, -34], [24, -28], [32, -22], [35, -10], [35, 12, 1], [4, 15, 1], [-10, 6], [-16, -14], [-12, -36]];
  function mkEiffel() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: EI_TORSO, base: EI.habit, seed: 8101, paint: () => {
        fillPts([[6, -176], [20, -168], [34, -148], [42, -110], [46, -60], [44, -14], [26, -12], [14, -60], [8, -120]], EI.gilet);      // gilet
        for (const y of [-128, -100, -72, -44]) dot(36, y, 2.2, EI.giletD);
        strokePts([[30, -150], [40, -100], [44, -14]], 'rgba(60,60,58,0.4)', 1);
        fillPts([[8, -176], [22, -150], [16, -96], [8, -112], [2, -160]], EI.habitL);                                                // revers
        strokePts([[16, -96], [26, -12], [44, -10]], 'rgba(0,0,0,0.6)', 1.6);
        fillPts([[4, -184], [20, -172], [17, -160], [2, -168]], '#f1ede2');                                                         // col blanc
        pc([[14, -170], [34, -182], [38, -164], [26, -162], [40, -150], [32, -140], [18, -158]], EI.lav, () => hatch(null, 0.5, 3, 0.25), 8111, { drop: false });   // lavallière
        pc([[14, -156], [40, -150], [46, -112], [34, -106], [24, -130], [14, -110], [6, -116], [10, -150]], '#8a2a3c', () => { strokePts([[24, -150], [24, -132]], 'rgba(40,0,10,0.5)', 1.4); hatch(null, 0.4, 3, 0.2); }, 8112, { drop: false });
        for (const y of [-6, 22]) dot(40, y, 2.4, '#0d0d10');
        strokePts([[-46, -14], [46, -12]], 'rgba(0,0,0,0.5)', 1.4);
        hatch([[-50, -170], [-14, -170], [-12, 120], [-50, 120]], 0.75, 4, 0.34, 1.05, '120,120,140'); shade(46, 0, -46, 0, 0.3);
      } },
      legB: legDef([-6, -2], EI.pantD, EI.soulier, 8102, true),
      legF: legDef([6, -2], EI.pant, EI.soulier, 8103, false),
      armB_up: upDef([-10, -146], EI.habitD, 8104, () => hatch(null, 0.9, 3.8, 0.3, 1, '120,120,140')),
      armB_lo: foreDef('armB_up', EI.habitD, EI.peauD, true, 8105, '#e6e1d4'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: EI.peau, seed: 8106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[30, -112], [26, -90], [18, -88], [6, -90], [-6, -84], [-14, -70], [-18, -56], [-20, -42], [-26, -30], [-46, -26], [-46, -112]], EI.gris, 3);   // cheveux gris courts
        for (let i = 0; i < 7; i++) strokePts([[-36 + i * 9, -92 + Math.abs(i - 3)], [-40 + i * 9, -80 + Math.abs(i - 3) * 2]], 'rgba(255,255,255,0.4)', 1.1);
        X.earPaint(-8, -44); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(14, -38, 8, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(90,88,84,0.95)', 3); X.mouth(f, 27, -25);
        fillPts([[38, -32], [36, -27], [29, -26], [20, -27], [16, -30], [21, -35], [31, -36]], EI.grisD, 6, 0.4);
      } },
      barbe: { parent: 'head', at: [0, 0], pts: EI_BARBE, base: EI.gris, seed: 8107, noRivet: true, paint: () => {
        for (let x = -6; x < 34; x += 6) strokePts([[x, -30 + Math.abs(x - 14) * 0.3], [x + 1, 13]], 'rgba(60,60,58,0.4)', 1);
        hatch(null, 1.5, 3, 0.22);
      } },
      armF_up: upDef([-2, -146], EI.habit, 8108, () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3, 1, '120,120,140')),
      armF_lo: foreDef('armF_up', EI.habit, EI.peau, false, 8109, '#e6e1d4', 66),
    };
    return defOf('Eiffel', parts, EI.peau, 8120, [], ['barbe']);
  }
  CH.libEiffel = mkEiffel();
  LIB.eiffel = wrap('libEiffel', function (q, loc) {
    const A = q.ang, f = q.face;
    const pl = ease(clamp(q.plan || 0)), sb = ease(clamp(q.sousBras || 0)), mo = ease(clamp(q.montre || 0));
    if ((pl > 0 || sb > 0) && q.tenu == null) q.tenu = 'plan';
    if (q.tenu === 'plan' && q.tenuO.deroule == null) q.tenuO.deroule = q.deroule != null ? q.deroule : pl;
    if (sb > 0) { blend(q, 'armF_up', 0.08, sb); blend(q, 'armF_lo', -1.05, sb); q.tenuO.deroule = 0; }
    if (pl > 0) { armTo(q, 'armF', [150, -150], pl); if (q.deuxMains == null) q.deuxMains = pl > 0.05; A.head = (A.head || 0) + 0.14 * pl; if (!f.mouth) f.mouth = 'smile'; }
    if (mo > 0) { armTo(q, 'armF', q.cible ? vers(SH_F, loc(q.cible), 178) : [160, -150], mo); if (!has(q.tenu)) q.handF = q.handF || 'open'; }
  }, 0.88);

  // =====================================================================
  // 4c) L'ONCLE SAM — haut-de-forme BLANC à bande bleue étoilée, cheveux blancs longs, barbiche blanche, habit queue-de-pie bleu, gilet rouge, pantalon rayé
  // =====================================================================
  const SA = { peau: '#e4c4a4', peauD: '#c8a282', habit: '#2D4470', habitD: '#22355a', habitL: '#3d5688', gilet: '#9A3A30', giletD: '#7c2c24', ivoire: '#E6DECB', rouge: '#9A3A30', botte: '#1c1a1c', blanc: '#eeebe4', blancD: '#cfcbc2' };
  const SA_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [38, -112], [40, -60], [38, -22], [30, -4], [-8, 2], [-22, 40], [-30, 112], [-42, 116, 1], [-46, 40], [-42, -40], [-42, -110], [-36, -150], [-26, -168]];
  const SA_HAT = [[-52, 6], [-46, 0], [-30, -2], [-31, -40], [-34, -80, 1], [34, -82, 1], [32, -40], [30, -2], [46, -2], [54, 4], [46, 9], [0, 7], [-44, 10]];
  const SA_CHEV = [[-6, -86], [-28, -80], [-40, -62], [-44, -34], [-46, -4], [-42, 22], [-30, 28, 1], [-25, 6], [-20, -24], [-12, -50]];
  const SA_BARBICHE = [[13, -15], [22, -16], [30, -12], [31, -2], [27, 14], [19, 36, 1], [14, 18], [10, 0]];
  function star5(x, y, r, col) { const o = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.42 : r; o.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } fillPts(o, col, 0, 0); }
  LIB.star5 = star5;
  function samHatPaint() {
    fillPts([[-31.5, -6], [31, -6], [31.6, -26], [-31.8, -26]], SA.habit);
    for (const x of [-22, -8, 6, 20]) star5(x, -16, 4.6, '#f4f1ea');
    fillPts([[-34, -80], [34, -82], [33, -74], [-33, -72]], '#f7f5f0');
    strokePts([[-20, -70], [-21, -32]], 'rgba(255,255,255,0.7)', 2.4);
    hatch([[12, -80], [34, -80], [32, -2], [12, -2]], 0.3, 3.4, 0.22); shade(-32, 0, 32, 0, 0.18, [-56, -84, 56, 12]);
  }
  function samHat() { pc(SA_HAT, SA.blanc, samHatPaint, 8251); }
  function mkSam() {
    const stripes = () => { for (let x = -22; x < 26; x += 10) fillPts([[x, -20], [x + 4.5, -20], [x + 4.5 + (x > 10 ? 2 : 0), 214], [x, 214]], SA.rouge, 0, 0); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: SA_TORSO, base: SA.habit, seed: 8201, paint: () => {
        fillPts([[6, -176], [20, -168], [32, -148], [38, -110], [40, -60], [37, -24], [20, -16], [12, -60], [8, -120]], SA.gilet);     // gilet rouge
        for (const y of [-120, -94, -68, -42]) dot(32, y, 2.2, '#d9bd72');
        fillPts([[4, -184], [20, -172], [17, -158], [2, -168]], '#f4f1ea');                                                          // col
        fillPts([[16, -170], [30, -176], [31, -162], [17, -164]], '#1d1b1f'); fillPts([[16, -170], [6, -176], [6, -162], [16, -164]], '#1d1b1f');   // nœud papillon
        fillPts([[8, -176], [22, -150], [16, -92], [8, -112], [2, -160]], SA.habitL);                                                // revers
        star5(14, -138, 4.2, '#f4f1ea');
        strokePts([[16, -92], [22, -16], [-8, 2]], 'rgba(10,16,30,0.6)', 1.6);
        strokePts([[-14, 0], [-24, 60], [-30, 110]], 'rgba(10,16,30,0.5)', 1.4);                                                   // fente des basques
        for (const y of [-60, -24]) dot(24, y, 2.4, '#d9bd72');
        hatch([[-50, -170], [-14, -170], [-12, 118], [-50, 118]], 0.75, 4.2, 0.3); shade(40, 0, -44, 0, 0.26);
      } },
      legB: legDef([-6, -2], '#cfc6b2', SA.botte, 8202, true, stripes, 150),
      legF: legDef([6, -2], SA.ivoire, SA.botte, 8203, false, stripes, 150),
      armB_up: upDef([-10, -146], SA.habitD, 8204),
      armB_lo: foreDef('armB_up', SA.habitD, SA.peauD, true, 8205, '#efe9da'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: SA.peau, seed: 8206, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[24, -112], [22, -86], [12, -84], [-2, -82], [-14, -72], [-18, -56], [-20, -40], [-26, -28], [-46, -24], [-46, -112]], SA.blanc, 3);
        X.earPaint(-8, -44); hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
        dot(15, -38, 8, 'rgba(210,120,100,0.26)'); strokePts([[20, -44], [26, -42]], 'rgba(120,70,50,0.4)', 1);
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(250,248,240,1)', 4.2); X.mouth(f, 27, -26);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: SA_CHEV, base: SA.blanc, seed: 8207, noRivet: true, paint: () => {
        for (let i = 0; i < 5; i++) strokePts([[-14 - i * 6, -70 + i * 4], [-26 - i * 4, 0], [-28 - i * 3, 24]], 'rgba(150,145,135,0.5)', 1);
        hatch(null, 1.4, 3.4, 0.18);
      } },
      barbiche: { parent: 'head', at: [0, 0], pts: SA_BARBICHE, base: SA.blanc, seed: 8208, noRivet: true, paint: () => {
        for (const x of [14, 20, 26]) strokePts([[x, -12], [x - 2, 24]], 'rgba(150,145,135,0.55)', 1); hatch(null, 1.5, 3, 0.15);
      } },
      chapeau: { parent: 'head', at: [-2, -84], rest: -0.06, noRivet: true, base: SA.blanc, seed: 8251,
        pts: (p) => { const k = ease(clamp(p.surpris || 0)), sa = p.salut || 0; return tr(SA_HAT, 0, -16 * k * (sa > 0 ? 0 : 1) - 4 * Math.sin((p.t || 0) * 30) * k * (sa > 0 ? 0 : 1)); },
        paint: (p) => { const k = ease(clamp(p.surpris || 0)) * ((p.salut || 0) > 0 ? 0 : 1); const c = cx_(); c.save(); c.translate(0, -16 * k - 4 * Math.sin((p.t || 0) * 30) * k); samHatPaint(); c.restore(); } },
      armF_up: upDef([-2, -146], SA.habit, 8209),
      armF_lo: foreDef('armF_up', SA.habit, SA.peau, false, 8210, '#efe9da'),
    };
    return defOf('Oncle Sam', parts, SA.peau, 8220, ['chapeau'], ['cheveux', 'barbiche']);
  }
  CH.libSam = mkSam();
  LIB.oncleSam = wrap('libSam', function (q, loc) {
    const A = q.ang, f = q.face, t = q.t || 0;
    const sa = clamp(q.salut || 0), ac = ease(clamp(q.accepte || 0)), pt = ease(clamp(q.pocheTapote || 0)), bo = ease(clamp(q.bourse || 0)), rt = ease(clamp(q.retourne || 0));
    const co = ease(clamp(q.compte || 0)), si = ease(clamp(q.siffle || 0)), su = ease(clamp(q.surpris || 0)), pn = ease(clamp(q.pinceau || 0)), dg = ease(clamp(q.degu || 0));
    if (pt > 0) { armTo(q, 'armF', [32, -38 + 7 * Math.sin(t * 17)], pt); A.head = (A.head || 0) + 0.22 * pt; if (!f.brow) f.brow = 'up'; }
    if (bo > 0) {
      if (q.tenu == null && bo > 0.12) q.tenu = 'bourse';
      armTo(q, 'armF', [lerp(32, 86, smooth(0.2, 1, bo)), lerp(-38, -120, smooth(0.2, 1, bo))], Math.min(1, bo * 5)); A.head = (A.head || 0) + 0.16 * bo;
    }
    if (rt > 0) {
      if (q.tenu == null) q.tenu = 'bourse'; if (q.tenu === 'bourse' && !q.tenuO.etat) q.tenuO.etat = 'vide';
      if (q.papillon != null) q.tenuO.papillon = q.papillon;
      armTo(q, 'armF', [96, -214], rt); A.head = (A.head || 0) - 0.12 * rt; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'o';
    }
    if (ac > 0) { A.head = (A.head || 0) + (0.1 + 0.1 * Math.sin(t * 7)) * ac; armTo(q, 'armF', [30, -112], ac); if (!has(q.tenu)) q.handF = q.handF || 'open'; if (!f.mouth) f.mouth = 'smile'; }
    if (co > 0) {
      if (q.tenuB == null) q.tenuB = 'monnaie'; q.handB = 'open'; q.brasBDevant = true;
      armTo(q, 'armB', [46, -62], co); armTo(q, 'armF', [52, -88 + 5 * Math.sin(t * 9)], co);
      if (q.tenu == null) { q.tenu = 'sou'; q.tenuO.echelle = q.tenuO.echelle || 0.6; }
      A.head = (A.head || 0) + 0.32 * co; if (!f.mouth) f.mouth = 'smile';
    }
    if (si > 0) {
      plier(q, -0.05 * si); A.head = (A.head || 0) - 0.36 * si; armTo(q, 'armF', [24, 14], si); armTo(q, 'armB', [12, 12], si);
      if (!f.mouth) f.mouth = 'o'; if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'up';
    }
    if (pn > 0) {
      if (q.tenu == null) q.tenu = 'pinceau'; if (q.deuxMains == null) q.deuxMains = true;
      armTo(q, 'armF', [lerp(120, 96, dg), lerp(-112, -62, dg)], pn); A.objet = (A.objet || 0) + 0.5 * dg;
    }
    if (dg > 0) { A.head = (A.head || 0) + 0.3 * dg; q.dy = (q.dy || 0) + 4 * dg; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight'; }
    if (sa > 0) {
      const hb = headPt(q, -2 + 30, -84 + 8);
      if (sa < 0.4) armTo(q, 'armF', hb, ease(sa / 0.4));
      else { const u = ease((sa - 0.4) / 0.6); armTo(q, 'armF', [lerp(hb[0], 64, u), lerp(hb[1], -332, u)], 1); q.hide.chapeau = 1; q.tenu = 'chapeau'; A.objet = (A.objet || 0) + (A.head || 0) - 0.06 - 0.3 * u; }
      if (!f.mouth) f.mouth = 'smile';
    }
    if (su > 0) {
      q.dy = (q.dy || 0) - 8 * su * Math.abs(Math.sin(t * 9)); if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o';
      armTo(q, 'armB', [64, -208], su); if (sa <= 0 && !has(q.tenu)) { armTo(q, 'armF', [96, -236], su); q.handF = q.handF || 'open'; }
      if (!has(q.tenuB)) q.handB = q.handB || 'open';
    }
  }, 0.9);

  // =====================================================================
  // 4d) JOSEPH PULITZER — tête nue, cheveux bruns, barbe pleine brun-roux, pince-nez, redingote vert sombre, gilet ocre
  // =====================================================================
  const PU = { peau: '#e3c09c', peauD: '#c69e7a', habit: '#334A3C', habitD: '#28392f', habitL: '#46604f', gilet: '#B5893E', giletD: '#93702f', pant: '#4a4440', pantD: '#3a3532', soulier: '#161414', cheveux: '#3e2a1c', barbe: '#7A4A2A', barbeL: '#a0643a' };
  const PU_TORSO = [[-14, -176], [8, -180], [16, -168], [28, -150], [35, -112], [37, -60], [35, -10], [36, 40], [38, 118, 1], [-40, 120, 1], [-40, 40], [-38, -20], [-38, -90], [-36, -146], [-26, -168]];
  const PU_BARBE = [[-4, -52], [5, -40], [16, -34], [26, -30], [34, -23], [41, -10], [43, 6], [39, 22], [29, 34], [15, 39], [0, 31], [-10, 18], [-17, 0], [-18, -26], [-11, -42]];
  function mkPulitzer() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PU_TORSO, base: PU.habit, seed: 8301, paint: () => {
        fillPts([[6, -176], [18, -168], [30, -148], [35, -110], [37, -60], [34, -14], [20, -12], [12, -60], [8, -120]], PU.gilet);
        for (const y of [-120, -94, -68, -42]) dot(30, y, 2, PU.giletD);
        fillPts([[4, -184], [20, -172], [17, -158], [2, -168]], '#f1ede2'); fillPts([[12, -168], [22, -170], [24, -156], [16, -150], [12, -158]], '#1b1a1c');
        fillPts([[8, -176], [20, -150], [15, -94], [8, -112], [2, -160]], PU.habitL);
        strokePts([[15, -94], [22, -12], [36, -10]], 'rgba(0,0,0,0.5)', 1.6);
        for (const y of [-2, 26, 54]) dot(32, y, 2.3, '#1a221d');
        hatch([[-50, -170], [-14, -170], [-12, 122], [-50, 122]], 0.75, 4.2, 0.3); shade(38, 0, -40, 0, 0.28);
      } },
      legB: legDef([-6, -2], PU.pantD, PU.soulier, 8302, true),
      legF: legDef([6, -2], PU.pant, PU.soulier, 8303, false),
      armB_up: upDef([-10, -146], PU.habitD, 8304),
      armB_lo: foreDef('armB_up', PU.habitD, PU.peauD, true, 8305, '#ebe6d8'),
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: PU.peau, seed: 8306, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[34, -112], [30, -90], [22, -86], [10, -90], [-2, -86], [-14, -74], [-18, -58], [-20, -42], [-26, -30], [-46, -26], [-46, -112]], PU.cheveux, 3);
        X.earPaint(-8, -44); dot(14, -40, 7, 'rgba(205,130,110,0.2)');
        X.eye(f, 17, -52); X.brow(f, 17, -61, 'rgba(60,36,22,0.95)', 3); X.mouth(f, 28, -25);
        fillPts([[38, -32], [36, -27], [29, -26], [19, -28], [15, -31], [21, -35], [31, -36]], PU.barbe, 6, 0.4);
        // pince-nez : un verre rond sur le nez, cordon noir vers l'oreille
        const ring = ell(21, -51, 8, 8, 14); fillPts(ring, 'rgba(200,225,235,0.25)', 0, 0); strokePts(ring.concat([ring[0]]), '#1e1a18', 1.6);
        strokePts([[29, -51], [34, -48]], '#1e1a18', 1.4); strokePts([[16, -57], [21, -59]], 'rgba(255,255,255,0.75)', 1.2);
        strokePts([[14, -46], [2, -30], [-4, -12]], 'rgba(20,18,16,0.75)', 1);
      } },
      toupet: { parent: 'head', at: [0, 0], pts: [[-40, -72], [-37, -90], [-22, -103], [2, -107], [22, -102], [33, -92], [24, -88], [8, -93], [-10, -91], [-26, -84]], base: PU.cheveux, seed: 8310, noRivet: true, paint: () => {
        for (let i = 0; i < 6; i++) strokePts([[26 - i * 11, -100 + i], [16 - i * 11, -93 + i * 2], [6 - i * 11, -89 + i * 3]], 'rgba(255,220,180,0.28)', 1.3); } },
      barbe: { parent: 'head', at: [0, 0], pts: PU_BARBE, base: PU.barbe, seed: 8307, noRivet: true, paint: () => {
        for (const [a, b] of [[[4, -36], [10, 30]], [[14, -30], [18, 40]], [[24, -22], [26, 36]], [[32, -14], [32, 20]], [[-6, -30], [-2, 18]]]) strokePts([a, [(a[0] + b[0]) / 2 + 3, (a[1] + b[1]) / 2], b], 'rgba(40,20,8,0.45)', 1.1);
        hatch(null, 1.3, 3, 0.22); for (const [a, b] of [[[28, -16], [34, 8]], [[18, -20], [22, 20]], [[36, -2], [36, 16]]]) strokePts([a, b], PU.barbeL, 1.8);
      } },
      armF_up: upDef([-2, -146], PU.habit, 8308),
      armF_lo: foreDef('armF_up', PU.habit, PU.peau, false, 8309, '#ebe6d8', 66),
    };
    return defOf('Pulitzer', parts, PU.peau, 8320, ['toupet'], ['barbe']);
  }
  CH.libPulitzer = mkPulitzer();
  LIB.pulitzer = wrap('libPulitzer', function (q, loc) {
    const A = q.ang, f = q.face;
    const br = ease(clamp(q.brandir || 0)), mo = ease(clamp(q.montre || 0)), sb = ease(clamp(q.sousBras || 0));
    if ((br > 0 || sb > 0) && q.tenu == null) q.tenu = 'journal';
    if (sb > 0) { blend(q, 'armF_up', 0.08, sb); blend(q, 'armF_lo', -0.95, sb); if (q.tenuO.plie == null) q.tenuO.plie = 1; }
    if (br > 0) {
      armTo(q, 'armF', [84, -214], br); armTo(q, 'armB', [24, -116], br * 0.85); q.handB = q.handB || 'open';
      A.head = (A.head || 0) - 0.12 * br; if (!f.mouth) f.mouth = 'o'; if (!f.brow) f.brow = 'up';
    }
    if (mo > 0) { armTo(q, 'armF', q.cible ? vers(SH_F, loc(q.cible), 178) : [158, -120], mo); if (!has(q.tenu)) q.handF = q.handF || 'open'; A.head = (A.head || 0) + 0.08 * mo; }
  }, 0.94);

  // =====================================================================
  // 5) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accDraw(key, drawFn, x, y, s, o) {
    o = o || {};
    return M.puppet(accDef(key, drawFn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name];
    return accDraw('o_' + name, (oo) => { const b = ptOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(Object.assign({ t: oo.t || 0 }, oo)); c.restore(); }, x, y, s == null ? 1 : s, o);
  }
  for (const n of ['sou', 'maillet', 'bourse', 'journal', 'plan', 'pinceau', 'seau', 'monnaie']) LIB[n] = (x, y, s, o) => acc(n, x, y, s, o);
  LIB.chapeauSam = (x, y, s, o) => acc('chapeau', x, y, s == null ? 0.9 : s, o);
  // point écran d'un accessoire posé (mêmes x, y, s, o) ; LIB.accPt('journal', x, y, s, o, 'gravure')
  function locPt(px, py, x, y, s, o) { o = o || {}; const d = o.dir || 1, r = o.rot || 0, X0 = px * s * d, Y0 = py * s; return [x + X0 * Math.cos(r) - Y0 * Math.sin(r) * d, y + X0 * Math.sin(r) * d + Y0 * Math.cos(r)]; }
  LIB.accPt = function (name, x, y, s, o, nom) { const ob = OBJ[name], oo = o || {}, b = ptOf(ob.base, oo), q = ptOf(ob.pts[nom] || [0, 0], oo); return locPt(q[0] - b[0], q[1] - b[1], x, y, s == null ? 1 : s, oo); };

  // =====================================================================
  // 5b) LA STATUE (vue de face, proportions vraies : 46 m du talon à la flamme ; repère : bas du petit socle propre, hauteur 1000)
  //     o.couleur 0 cuivre neuf → 1 vert-de-gris ; o.eclat 0..1 (étoile sur la couronne, ou o.eclatPt 'torche')
  // =====================================================================
  const ST_ROBE = [[-122, -34], [-127, -62], [-120, -140], [-113, -240], [-105, -330], [-99, -420], [-97, -500], [-100, -560], [-104, -596], [-80, -612], [-42, -618], [-22, -622],
    [22, -622], [46, -617], [84, -608], [104, -592], [107, -540], [105, -470], [107, -400], [111, -320], [117, -240], [121, -150], [127, -70], [122, -34]];
  const ST_STOLA = [[58, -614], [100, -596], [108, -520], [104, -430], [112, -330], [118, -232], [110, -170], [84, -206], [52, -262], [4, -300], [-58, -322], [-103, -340], [-100, -392], [-42, -402], [8, -444], [38, -522]];
  const ST_ARMR = [[-82, -600], [-92, -680], [-102, -760], [-110, -862], [-146, -866], [-142, -790], [-138, -720], [-136, -650], [-126, -604], [-108, -586]];
  const ST_MANCHE = [[-80, -600], [-90, -690], [-98, -744], [-124, -752], [-146, -712], [-142, -640], [-126, -598]];
  const ST_ARML = [[84, -598], [108, -600], [118, -520], [120, -462], [102, -452], [94, -520]];
  const ST_TAB = [[100, -640, 1], [152, -656, 1], [204, -448, 1], [150, -428, 1]];
  const ST_TABE = [[100, -640, 1], [150, -428, 1], [140, -424, 1], [90, -634, 1]];
  function crownRays(cx, cy, R0, Ls, w) { const o = []; for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.42, L = Ls[Math.abs(i - 3)], b = [cx + Math.sin(a) * R0, cy - Math.cos(a) * R0], tp = [cx + Math.sin(a) * (R0 + L), cy - Math.cos(a) * (R0 + L)], n = [Math.cos(a) * w, Math.sin(a) * w]; o.push([[b[0] - n[0], b[1] - n[1]], [tp[0], tp[1], 1], [b[0] + n[0], b[1] + n[1]]]); } return o; }
  const PLATRE = { k: 0, b: '#ece6d8', l: '#ffffff', d: '#bdb4a0', x: '#8a826e', lA: (a) => `rgba(255,255,255,${a})`, dA: (a) => `rgba(150,140,120,${a})`, xA: (a) => `rgba(110,100,85,${a})` };
  const OR_T = '#d4a03c', OR_TL = '#f6d98a', OR_TD = '#9a6e22';
  function drawStatue(o) {
    const C = o.platre ? PLATRE : cuivre(o.couleur), k = C.k, sd = 9100;
    const folds = (pts, col, lw) => strokePts(pts, col || C.dA(0.7), lw || 1.6);
    // petit socle propre (rocher taillé) + chaînes brisées
    pc([[-120, 0, 1], [120, 0, 1], [118, -30], [-118, -30]], C.d, () => { fillPts(rect(-120, -34, 120, -26), C.b); hatch(null, 0.3, 4, 0.25); }, sd);
    // manche + bras droit levé (derrière la robe)
    pc(ST_ARMR, C.b, () => { folds([[-120, -700], [-124, -850]], C.lA(0.6), 2.2); hatch([[-146, -870], [-128, -870], [-124, -600], [-140, -600]], 0.9, 3.4, 0.3); martele(-146, -860, -100, -620, C, 11, 300); }, sd + 1);
    // torche : poignée, coupe dorée, flamme dorée (dorure : reste dorée quand la statue verdit)
    pc(rect(-138, -930, -120, -868), C.d, () => hatch(null, 0.2, 3, 0.3), sd + 2);
    pc([[-164, -952], [-94, -952], [-100, -936], [-116, -924], [-142, -924], [-158, -936]], C.b, () => { fillPts(rect(-166, -956, -92, -946), mixA('#d4a03c', '#b7a46a', k * 0.4)); for (let x = -160; x < -96; x += 9) dot(x, -942, 2.2, C.lA(0.8)); shade(-160, 0, -96, 0, 0.3, [-170, -960, -90, -920]); }, sd + 3);
    pc([[-158, -952], [-162, -970], [-150, -986], [-136, -998], [-128, -1004], [-120, -994], [-106, -976], [-100, -952]], OR_T, () => {
      fillPts([[-146, -952], [-148, -970], [-134, -990], [-130, -972], [-120, -952]], OR_TL); strokePts([[-128, -1000], [-130, -960]], 'rgba(120,80,20,0.5)', 1.4);
      for (const [a, b] of [[[-150, -956], [-142, -980]], [[-112, -956], [-116, -982]]]) strokePts([a, b], 'rgba(120,80,20,0.45)', 1.2);
    }, sd + 4);
    pc([[-142, -888], [-116, -890], [-108, -876], [-112, -858], [-140, -856], [-148, -870]], C.b, () => { for (const y of [-882, -874, -866]) strokePts([[-146, y], [-112, y + 1]], C.dA(0.7), 1.2); }, sd + 5);   // main sur la poignée
    pc(ST_MANCHE, C.b, () => { folds([[-96, -700], [-128, -744]]); folds([[-90, -650], [-136, -700]]); folds([[-86, -612], [-132, -650]]); hatch(null, 0.8, 3.4, 0.25); }, sd + 6);
    // robe
    pc(ST_ROBE, C.b, () => {
      for (const [x0, x1] of [[-90, -100], [-60, -66], [-32, -30], [-6, 2], [22, 30], [52, 64], [84, 96], [104, 116]]) folds([[x0 * 0.92, -330], [lerp(x0, x1, 0.5), -180], [x1, -40]]);
      for (const [x0, x1] of [[-78, -98], [-48, -54], [-16, -12], [14, 26], [48, 64]]) folds([[x0 + 6, -330], [x1 + 4, -40]], C.lA(0.45), 2.2);
      fillPts([[-122, -60], [-80, -48], [-40, -56], [0, -46], [40, -56], [80, -46], [124, -60], [124, -30], [-124, -30]], C.dA(0.35));
      martele(-110, -600, 110, -60, C, 21, 380); patine(-110, -620, 110, -40, k, 31, 12);
      hatch([[50, -620], [130, -620], [130, -30], [60, -30]], 0.9, 3.6, 0.28); shade(-110, 0, 120, 0, 0.32, [-130, -630, 130, -30]);
    }, sd + 7);
    // pied gauche qui dépasse, chaînes brisées
    pc([[18, -44], [52, -44], [62, -36], [58, -30], [18, -30]], C.b, () => strokePts([[40, -42], [56, -36]], C.lA(0.6), 1.4), sd + 8);
    for (let i = 0; i < 4; i++) strokePts(ell(-60 + i * 16, -38, 8, 4.5, 10).concat([[-52 + i * 16, -38]]), C.d, 2.2);
    // étole en diagonale
    pc(ST_STOLA, C.b, () => {
      for (let i = 0; i < 5; i++) folds([[60 - i * 6, -600 + i * 4], [20 - i * 26, -470 + i * 22], [-96 + i * 10, -350 + i * 6]]);
      for (let i = 0; i < 3; i++) folds([[96 - i * 10, -500], [104 - i * 8, -340], [100 - i * 10, -200]]);
      folds([[-80, -380], [20, -350], [90, -300]], C.lA(0.5), 2); patine(-100, -600, 110, -200, k, 41, 7);
      hatch([[40, -620], [120, -620], [120, -170], [40, -170]], 0.9, 3.4, 0.3);
    }, sd + 9);
    // bras gauche et tablette VIERGE
    pc(ST_ARML, C.b, () => hatch(null, 0.9, 3.4, 0.3), sd + 10);
    pc(ST_TABE, C.d, () => strokePts([[96, -634], [144, -428]], C.xA(0.5), 1.2), sd + 11);
    pc(ST_TAB, C.l, () => { fillPts([[108, -630], [148, -642], [194, -454], [152, -438]], C.b, 0, 0); strokePts([[108, -630], [148, -642], [194, -454], [152, -438], [108, -630]], C.dA(0.7), 1.6); strokePts([[104, -636], [150, -650]], C.lA(0.9), 2); patine(100, -650, 200, -430, k, 51, 4); hatch([[150, -650], [210, -650], [210, -420], [150, -420]], 0.5, 4, 0.2); }, sd + 12);
    pc([[140, -440], [168, -446], [174, -426], [150, -420]], C.b, () => { strokePts([[146, -436], [170, -440]], C.dA(0.7), 1.2); strokePts([[148, -429], [170, -432]], C.dA(0.7), 1.2); }, sd + 13);   // doigts sous la tablette
    // cou, cheveux, visage
    pc([[-24, -616], [-20, -644], [20, -644], [24, -616]], C.b, () => shade(-20, 0, 24, 0, 0.3, [-30, -650, 30, -610]), sd + 14);
    pc([[-52, -694], [-50, -726], [-30, -744], [0, -748], [30, -744], [50, -726], [52, -694], [46, -660], [36, -640], [30, -656], [-30, -656], [-36, -640], [-46, -660]], C.d, () => {
      for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) strokePts([[sg * (40 + i * 2), -720 + i * 16], [sg * (48 - i), -712 + i * 16], [sg * (42 + i * 2), -704 + i * 16]], C.lA(0.55), 1.6);
    }, sd + 15);
    pc([[0, -632], [18, -636], [32, -650], [40, -676], [40, -704], [34, -726], [0, -734], [-34, -726], [-40, -704], [-40, -676], [-32, -650], [-18, -636]], C.b, () => {
      const L = C.xA(0.9);
      for (const sg of [-1, 1]) {
        fillPts([[sg * 23, -692], [sg * 15, -698], [sg * 6, -693], [sg * 15, -688]], C.lA(0.9), 0, 0);
        strokePts([[sg * 24, -693], [sg * 15, -699.5], [sg * 5, -694]], L, 2.4); dot(sg * 14, -693, 2.8, C.xA(0.9));
        strokePts([[sg * 27, -705], [sg * 16, -710], [sg * 4, -706]], L, 2.2);
      }
      strokePts([[-3, -702], [-4, -676], [-8, -669], [0, -666], [8, -669]], L, 1.9); fillPts([[-3, -700], [3, -700], [6, -672], [-1, -668]], C.lA(0.45), 0, 0);
      fillPts([[-11, -654], [0, -658], [11, -654], [0, -647]], C.x, 0, 0); strokePts([[-12, -654], [12, -654]], L, 1.8);
      fillPts(ell(0, -640, 8, 4, 10), C.lA(0.35), 0, 0); dot(-20, -668, 6, C.lA(0.25)); dot(20, -668, 6, C.dA(0.2));
      hatch([[16, -740], [44, -740], [44, -630], [16, -630]], 0.9, 3.2, 0.24); patine(-36, -720, 36, -640, k, 61, 3);
    }, sd + 16);
    // couronne : diadème à fenêtres + 7 rayons
    for (const [i, ray] of crownRays(0, -704, 42, [66, 64, 60, 54], 6.5).entries()) pc(ray, C.b, () => strokePts([ray[0].map((v, j) => (v + ray[2][j]) / 2), ray[1]], C.lA(0.7), 1.4), sd + 20 + i);
    pc([[-46, -712], [-40, -736], [0, -746], [40, -736], [46, -712], [0, -722]], C.b, () => { for (let i = -3; i <= 3; i++) fillPts(rect(i * 11 - 3, -737 + Math.abs(i), i * 11 + 3, -729 + Math.abs(i)), C.xA(0.8), 0, 0); strokePts([[-44, -716], [0, -726], [44, -716]], C.lA(0.7), 1.6); }, sd + 30);
    const e = clamp(o.eclat || 0);
    if (e > 0) { const p = o.eclatPt === 'torche' ? [-128, -985] : [-22, -742]; etoile(p[0], p[1], 70 * e, e); }
  }
  const STATUE_PTS = { base: [0, 0], torche: [-128, -985], flamme: [-128, -1004], main: [-128, -872], tablette: [152, -540], tete: [0, -690], couronne: [0, -742], visage: [0, -684], pieds: [0, -40], epaule: [-96, -600] };
  // socle de granit (piédestal de Hunt) : repère = pied du socle, hauteur 850, largeur ≈ 460 ; dessiné en entier (le décor le découpe par blocs)
  const GR = '#A8968A', GRL = '#c4b4a6', GRD = '#7f6f66', GRDD = '#5f524c';
  const SOCLE_H = 850;
  function drawSocle() {
    pc([[-232, 0, 1], [232, 0, 1], [224, -60, 1], [206, -70, 1], [200, -190, 1], [182, -204, 1], [-182, -204, 1], [-200, -190, 1], [-206, -70, 1], [-224, -60, 1]], GR, () => {
      for (let y = -20; y > -200; y -= 30) strokePts([[-230, y], [230, y]], 'rgba(80,66,60,0.45)', 1.2);
      for (let y = -20, r = 0; y > -200; y -= 30, r++) for (let x = -220 + (r % 2) * 40; x < 220; x += 80) strokePts([[x, y], [x, y - 30]], 'rgba(80,66,60,0.35)', 1);
      fillPts(rect(-90, -150, 90, -60), GRD); fillPts(rect(-80, -142, 80, -66), GRDD);                    // porte d'entrée
      hatch([[100, -200], [232, -200], [232, 0], [100, 0]], 0.9, 4, 0.22); shade(-232, 0, 232, 0, 0.28, [-240, -210, 240, 2]);
    }, 9201);
    pc([[-168, -204, 1], [168, -204, 1], [162, -600, 1], [-162, -600, 1]], GR, () => {
      for (const x of [-150, -110, 110, 150]) { fillPts(rect(x - 14, -590, x + 14, -214), GRL); strokePts([[x + 14, -590], [x + 14, -214]], 'rgba(80,66,60,0.55)', 1.4); }   // pilastres
      fillPts(rect(-82, -560, 82, -240), GRD); fillPts(rect(-70, -548, 70, -252), '#8f7f75');            // panneau central
      for (let y = -230; y > -600; y -= 34) strokePts([[-162, y], [-96, y]], 'rgba(80,66,60,0.35)', 1), strokePts([[96, y], [162, y]], 'rgba(80,66,60,0.35)', 1);
      for (const x of [-130, 130]) { fillPts(ell(x, -470, 13, 13, 14), GRD); fillPts(ell(x, -470, 8, 8, 12), GRL); }    // écussons nus
      hatch([[90, -600], [168, -600], [168, -204], [90, -204]], 0.9, 4, 0.22); shade(-168, 0, 168, 0, 0.26, [-170, -602, 170, -202]);
    }, 9202);
    pc([[-186, -600, 1], [186, -600, 1], [186, -624, 1], [-186, -624, 1]], GRL, () => strokePts([[-186, -606], [186, -606]], 'rgba(80,66,60,0.5)', 1.2), 9203);
    pc([[-170, -624, 1], [170, -624, 1], [166, -760, 1], [-166, -760, 1]], GR, () => {
      for (let i = 0; i < 5; i++) { const x = -120 + i * 60; fillPts(rect(x - 18, -740, x + 18, -650), GRDD); fillPts([[x - 18, -740], [x, -756], [x + 18, -740]], GRDD); for (const cxx of [x - 22, x + 22]) fillPts(rect(cxx - 4, -748, cxx + 4, -646), GRL); }   // loggia à colonnes
      hatch([[100, -760], [170, -760], [170, -624], [100, -624]], 0.9, 4, 0.22);
    }, 9204);
    pc([[-196, -760, 1], [196, -760, 1], [190, -786, 1], [-190, -786, 1]], GRL, () => { for (let x = -186; x < 190; x += 16) fillPts(rect(x, -784, x + 8, -776), GRD); }, 9205);
    pc([[-160, -786, 1], [160, -786, 1], [156, -850, 1], [-156, -850, 1]], GR, () => { for (let x = -150; x < 154; x += 22) fillPts(rect(x, -842, x + 10, -794), GRD); strokePts([[-156, -846], [156, -846]], 'rgba(255,255,255,0.3)', 1.4); }, 9206);   // parapet
  }
  LIB.SOCLE = { h: SOCLE_H, w: 464, haut: 850 };
  LIB.statue = function (x, y, s, o) {
    o = o || {}; s = s == null ? 0.37 : s;
    if (o.socle) { accDraw('socle', () => drawSocle(), x, y, s, { cast: o.cast, alpha: o.alpha }); y -= SOCLE_H * s; }
    return accDraw('statue', drawStatue, x, y, s, o);
  };
  LIB.statuePt = function (nom, x, y, s, o) { o = o || {}; s = s == null ? 0.37 : s; const q = STATUE_PTS[nom] || [0, 0]; return locPt(q[0], q[1], x, y - (o.socle ? SOCLE_H * s : 0), s, o); };

  // ---------------- tête couronnée seule (atelier) : repère = base du cou posée au sol ; ≈ 520 de haut à s 1
  const TT_RAYS = crownRays(0, -250, 132, [138, 134, 126, 118], 17);
  function drawTete(o) {
    const C = cuivre(o.couleur), k = C.k, sd = 9300;
    for (const [i, ray] of TT_RAYS.entries()) pc(ray, C.b, () => { strokePts([ray[0].map((v, j) => (v + ray[2][j]) / 2), ray[1]], C.lA(0.75), 2); strokePts([ray[2], ray[1]], C.dA(0.5), 1.4); martele(-240, -520, 240, -280, C, 70 + i, 500); }, sd + i);
    // cou (coupe nette au sol : bord sombre de l'intérieur)
    pc([[-80, 0, 1], [80, 0, 1], [72, -84], [-72, -84]], C.b, () => { fillPts(rect(-82, -12, 82, 2), C.x); rivetLine([-76, -16], [76, -16], 14, C); hatch([[30, -90], [84, -90], [84, 0], [30, 0]], 0.9, 3.4, 0.28); shade(-80, 0, 80, 0, 0.3, [-84, -90, 84, 2]); }, sd + 10);
    // chevelure (ondes) derrière le visage
    pc([[-150, -230], [-146, -300], [-120, -350], [-60, -376], [0, -382], [60, -376], [120, -350], [146, -300], [150, -230], [140, -170], [122, -120], [100, -96], [70, -84], [-70, -84], [-100, -96], [-122, -120], [-140, -170]], C.d, () => {
      for (const sg of [-1, 1]) for (let i = 0; i < 6; i++) { const y = -320 + i * 40; strokePts([[sg * 108, y], [sg * 132, y + 12], [sg * 116, y + 26], [sg * 138, y + 40]], C.lA(0.55), 2.4); strokePts([[sg * 110, y + 8], [sg * 128, y + 20]], C.xA(0.45), 1.4); }
      hatch(null, 1.2, 4, 0.2);
    }, sd + 11);
    // visage
    pc([[0, -70], [36, -76], [66, -96], [88, -130], [100, -180], [104, -230], [100, -280], [92, -322], [0, -336], [-92, -322], [-100, -280], [-104, -230], [-100, -180], [-88, -130], [-66, -96], [-36, -76]], C.b, () => {
      const L = C.xA(0.9);
      for (const sg of [-1, 1]) {                                                     // yeux en amande, paupières lourdes, iris gravé
        fillPts([[sg * 72, -230], [sg * 50, -246], [sg * 24, -236], [sg * 48, -222]], C.lA(0.9), 0, 0);
        fillPts([[sg * 74, -232], [sg * 50, -250], [sg * 22, -238], [sg * 50, -246]], C.d, 0, 0);
        strokePts(ell(sg * 47, -235, 9, 8, 12).concat([[sg * 56, -235]]), C.dA(0.85), 1.6); dot(sg * 47, -236, 3.2, C.xA(0.7));
        strokePts([[sg * 76, -230], [sg * 50, -252], [sg * 20, -240]], L, 2.6); strokePts([[sg * 70, -226], [sg * 48, -219], [sg * 28, -228]], C.dA(0.6), 1.6);
        strokePts([[sg * 86, -262], [sg * 56, -276], [sg * 14, -264]], L, 2.6);               // arcade
        fillPts(ell(sg * 64, -170, 22, 16, 12), C.lA(0.22), 0, 0);                          // pommette
      }
      fillPts([[-8, -258], [8, -258], [16, -176], [26, -158], [10, -150], [0, -154], [-10, -150], [-26, -158], [-16, -176]], C.lA(0.4), 0, 0);   // nez
      strokePts([[10, -256], [18, -178], [28, -160], [12, -150]], L, 2); strokePts([[-26, -158], [-12, -150], [0, -154], [12, -150]], L, 1.8);
      fillPts([[-8, -158], [-2, -156], [-4, -152]], C.x, 0, 0); fillPts([[8, -158], [2, -156], [4, -152]], C.x, 0, 0);
      fillPts([[-34, -118], [-12, -126], [0, -122], [12, -126], [34, -118], [12, -112], [-12, -112]], C.d, 0, 0);   // lèvres closes
      fillPts([[-30, -116], [0, -114], [30, -116], [14, -100], [-14, -100]], C.dA(0.7), 0, 0); strokePts([[-36, -117], [0, -115], [36, -117]], L, 2);
      fillPts(ell(0, -84, 26, 12, 12), C.lA(0.3), 0, 0);                                   // menton
      rivetLine([-74, -300], [-80, -110], 12, C); rivetLine([74, -300], [80, -110], 12, C); // coutures des feuilles de cuivre
      martele(-100, -330, 100, -80, C, 81, 340); patine(-90, -330, 90, -90, k, 91, 6);
      hatch([[50, -340], [110, -340], [110, -70], [50, -70]], 0.9, 3.6, 0.22); shade(-104, 0, 104, 0, 0.3, [-110, -340, 110, -66]);
    }, sd + 12);
    // diadème à fenêtres
    pc([[-138, -320], [-128, -370], [-70, -392], [0, -398], [70, -392], [128, -370], [138, -320], [70, -336], [0, -342], [-70, -336]], C.b, () => {
      for (let i = -4; i <= 4; i++) { const x = i * 26, yy = -368 + Math.abs(i) * 4; fillPts([[x - 8, yy + 2], [x - 8, yy - 10], [x, yy - 15], [x + 8, yy - 10], [x + 8, yy + 2]], C.x, 0, 0); fillPts(rect(x - 5, yy - 9, x - 1, yy + 1), C.dA(0.6), 0, 0); }
      strokePts([[-136, -326], [-70, -342], [0, -348], [70, -342], [136, -326]], C.lA(0.8), 2.2); strokePts([[-130, -364], [-70, -386], [0, -392], [70, -386], [130, -364]], C.dA(0.6), 1.6);
    }, sd + 13);
    const e = clamp(o.eclat || 0); if (e > 0) etoile(-64, -380, 90 * e, e);
  }
  const TETE_PTS = { base: [0, 0], joue: [-100, -178], joueD: [100, -178], nez: [0, -160], oeil: [-47, -235], couronne: [0, -392], sommet: [0, -520], menton: [0, -72], front: [0, -300] };
  LIB.tete = (x, y, s, o) => accDraw('tete', drawTete, x, y, s == null ? 1 : s, o);
  LIB.tetePt = function (nom, x, y, s, o) { const q = TETE_PTS[nom] || [0, 0]; return locPt(q[0], q[1], x, y, s == null ? 1 : s, o); };

  // ---------------- le bras à la torche (Philadelphie) : repère = bas de la petite base ; 1000 de haut à s 1
  function drawBras(o) {
    const C = cuivre(o.couleur), k = C.k, sd = 9400, back = (o.balconAvant !== false);
    pc([[-124, 0, 1], [124, 0, 1], [124, -46, 1], [104, -46, 1], [104, -78, 1], [-104, -78, 1], [-104, -46, 1], [-124, -46, 1]], '#8a7d70', () => { strokePts([[-124, -46], [124, -46]], 'rgba(255,255,255,0.3)', 1.6); for (let x = -100; x < 110; x += 50) strokePts([[x, -46], [x, 0]], 'rgba(40,30,25,0.35)', 1.2); hatch(null, 0.3, 4, 0.2); }, sd);
    // avant-bras dans sa manche drapée
    pc([[-92, -78], [92, -78], [80, -170], [62, -300], [52, -420], [42, -560], [-42, -560], [-52, -420], [-66, -300], [-84, -170]], C.b, () => {
      for (let i = 0; i < 6; i++) strokePts([[-80 + i * 30, -82], [-62 + i * 22, -200], [-50 + i * 16, -320]], C.dA(0.7), 1.8);
      fillPts([[-70, -300], [-20, -330], [30, -322], [66, -300], [62, -290], [-66, -290]], C.dA(0.5));
      martele(-80, -560, 80, -90, C, 101, 380); patine(-80, -560, 80, -90, k, 111, 8);
      hatch([[20, -570], [96, -570], [96, -78], [20, -78]], 0.9, 3.6, 0.28); shade(-90, 0, 90, 0, 0.32, [-96, -570, 96, -76]);
      rivetLine([-4, -540], [-6, -320], 10, C);
    }, sd + 1);
    pc(rect(-26, -742, 26, -600), C.d, () => hatch(null, 0.2, 3, 0.3), sd + 2);                     // poignée
    pc([[-48, -552], [48, -552], [60, -580], [-60, -580]], C.b, () => hatch(null, 0.9, 3.4, 0.25), sd + 3);                    // poignet
    for (let i = 0; i < 4; i++) {                                                                       // quatre doigts repliés autour de la poignée
      const y0 = -582 - i * 27, y1 = y0 - 27;
      pc([[-58, y0, 1], [48, y0], [66, y0 - 4], [72, (y0 + y1) / 2], [66, y1 + 4], [48, y1], [-58, y1, 1]], i % 2 ? C.b : C.l, () => {
        strokePts([[-56, y1 + 3], [46, y1 + 2]], C.xA(0.6), 1.6); fillPts(ell(58, (y0 + y1) / 2, 7, 9, 10), C.lA(0.5), 0, 0); strokePts([[50, y0 - 4], [64, (y0 + y1) / 2]], C.dA(0.6), 1.2);
      }, sd + 40 + i);
    }
    pc([[-66, -598], [-60, -650], [-48, -694], [-20, -712], [16, -712], [24, -698], [-10, -690], [-38, -672], [-46, -620]], C.b, () => { strokePts([[-56, -640], [-30, -694], [14, -704]], C.lA(0.7), 2); fillPts(ell(12, -704, 8, 6, 10), C.lA(0.6), 0, 0); hatch(null, 0.9, 3.2, 0.22); }, sd + 44);   // pouce par-dessus
    pc([[-92, -800], [92, -800], [80, -780], [48, -752], [26, -742], [-26, -742], [-48, -752], [-80, -780]], C.b, () => {   // coupe à rebord doré
      fillPts(rect(-96, -806, 96, -790), mixA(OR_T, '#b7a46a', k * 0.4)); for (let x = -86; x < 90; x += 14) fillPts([[x, -790], [x + 7, -778], [x + 14, -790]], C.dA(0.6));
      shade(-92, 0, 92, 0, 0.3, [-96, -806, 96, -740]);
    }, sd + 4);
    const balcon = (front) => {                                                                        // balcon : plancher + garde-corps (moitié arrière ou avant)
      const a0 = front ? 0 : PI, a1 = front ? PI : TAU, rail = ep(0, -846, 150, 18, 16, a0, a1), sol = ep(0, -800, 150, 18, 16, a0, a1);
      if (!front) pc(ell(0, -800, 152, 20, 28), '#4b4440', () => { fillPts(ell(0, -804, 150, 16, 28), '#6a615a'); for (let i = 0; i < 12; i++) strokePts([[-150 + i * 26, -812], [-150 + i * 26 + 10, -790]], 'rgba(30,25,20,0.4)', 1); }, sd + 5);
      for (let i = 0; i <= 16; i += 2) { const p = sol[i], q = rail[i]; strokePts([p, q], '#2e2a28', 2.2); }
      strokePts(rail, '#2e2a28', 3); strokePts(ep(0, -824, 150, 18, 16, a0, a1), '#2e2a28', 1.4);
    };
    balcon(false);
    pc([[-78, -800], [-84, -840], [-70, -890], [-40, -940], [-14, -984], [0, -1000], [10, -982], [40, -936], [68, -888], [82, -840], [78, -800]], OR_T, () => {   // flamme dorée
      fillPts([[-50, -800], [-56, -846], [-30, -900], [-6, -960], [-2, -900], [10, -846], [6, -800]], OR_TL);
      for (const [a, b] of [[[-60, -806], [-46, -880]], [[50, -806], [44, -880]], [[10, -820], [6, -940]]]) strokePts([a, [(a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2], b], OR_TD, 1.8);
      hatch([[30, -1000], [90, -1000], [90, -800], [30, -800]], 0.9, 3.4, 0.22);
    }, sd + 6);
    if (back) balcon(true);
    const e = clamp(o.eclat || 0); if (e > 0) etoile(-30, -930, 110 * e, e);
  }
  const BRAS_PTS = { base: [0, 0], main: [0, -640], torche: [0, -900], flamme: [0, -1000], balcon: [-96, -806], balconD: [96, -806], balconC: [0, -812], rambarde: [0, -846], coupe: [0, -800], coude: [0, -90] };
  LIB.bras = (x, y, s, o) => accDraw('bras', drawBras, x, y, s == null ? 1 : s, o);
  LIB.brasPt = function (nom, x, y, s, o) { const q = BRAS_PTS[nom] || [0, 0]; return locPt(q[0], q[1], x, y, s == null ? 1 : s, o); };

  // ---------------- morceaux de cuivre (≥ 120 px à s 0,9) : repère = milieu de la base
  function coupe(pts, C) { strokePts(pts, C.x, 3); rivets(pts.filter((_, i) => i % 2 === 0), 2, C.lA(0.8)); }
  const MORCEAUX = {
    orteil: (C) => {
      pc([[-82, 0], [-86, -44], [-78, -86], [-40, -98], [22, -98], [62, -88], [84, -64], [90, -36], [82, -10], [60, 0, 1]], C.b, () => {
        fillPts([[40, -94], [70, -84], [84, -60], [62, -58], [42, -68]], C.l); strokePts([[42, -68], [62, -58], [84, -60]], C.dA(0.8), 1.6);
        strokePts([[-20, -96], [-24, -60], [-18, -20]], C.dA(0.6), 1.6); martele(-80, -96, 80, -6, C, 131, 260);
        hatch([[-90, -40], [90, -40], [90, 0], [-90, 0]], 0.1, 3.6, 0.25);
      }, 9501);
      pc(ell(-80, -48, 12, 46, 16), C.x, () => { for (const y of [-80, -48, -16]) strokePts([[-90, y], [-70, y]], '#2a2420', 3); }, 9502);
      coupe(ep(-80, -48, 12, 46, 10, -PI / 2, PI / 2), C);
    },
    nez: (C) => {
      pc([[-56, 0, 1], [-54, -152, 1], [-30, -152], [-12, -112], [14, -66], [44, -30], [52, -12], [40, 0, 1]], C.b, () => {
        strokePts([[-30, -150], [-10, -110], [16, -64], [44, -30]], C.lA(0.8), 2.4);
        fillPts([[4, -12], [26, -16], [34, -4], [12, -2]], C.x); strokePts([[-4, -24], [20, -32], [38, -22]], C.dA(0.7), 1.6);
        martele(-50, -150, 44, -6, C, 141, 240); hatch([[-56, -152], [-20, -152], [-20, 0], [-56, 0]], 0.9, 3.4, 0.28);
      }, 9511);
      coupe([[-56, 0], [-55, -50], [-55, -100], [-54, -152]], C);
    },
    main: (C) => {
      pc([[-52, 0, 1], [-60, -46], [-58, -84], [40, -88], [56, -60], [62, -26], [44, 0, 1]], C.b, () => { martele(-58, -86, 60, -4, C, 151, 240); strokePts([[-40, -30], [30, -40]], C.dA(0.6), 1.6); hatch([[20, -90], [64, -90], [64, 0], [20, 0]], 0.9, 3.4, 0.25); }, 9521);
      for (let i = 0; i < 4; i++) { const x = -48 + i * 26, h = [62, 76, 72, 56][i], b = -84; pc([[x - 11, b + 4], [x - 10, b - h * 0.55], [x - 8, b - h], [x + 4, b - h - 4, 1], [x + 12, b - h + 4], [x + 13, b - h * 0.5], [x + 12, b + 4]], C.b, () => { strokePts([[x - 10, b - h * 0.5], [x + 12, b - h * 0.52]], C.dA(0.7), 1.4); strokePts([[x - 4, b - h + 6], [x - 4, b - 10]], C.lA(0.6), 1.6); }, 9522 + i); }
      pc([[50, -52], [76, -78], [92, -96, 1], [100, -86], [84, -54], [62, -26]], C.b, () => strokePts([[60, -52], [86, -84]], C.lA(0.6), 1.6), 9527);
      coupe([[-52, 0], [-4, -2], [44, 0]], C);
    },
    rayon: (C) => {
      pc([[-30, 0, 1], [30, 0, 1], [26, -16], [7, -200, 1], [-7, -200, 1], [-26, -16]], C.b, () => { strokePts([[0, -14], [0, -196]], C.lA(0.85), 2.4); strokePts([[3, -14], [3, -190]], C.dA(0.6), 1.2); martele(-26, -190, 26, -16, C, 161, 200); hatch([[2, -200], [32, -200], [32, 0], [2, 0]], 0.9, 3.2, 0.25); }, 9531);
      pc(rect(-34, -16, 34, 0), C.d, () => rivets([[-24, -8], [-8, -8], [8, -8], [24, -8]], 2.2, C.lA(0.8)), 9532);
    },
    oeil: (C) => {
      pc([[-94, -6], [-86, -70], [-40, -98], [10, -104], [62, -88], [92, -60], [96, -8], [0, 0, 1]], C.b, () => {
        fillPts([[-66, -50], [-30, -76], [20, -78], [58, -54], [20, -36], [-30, -34]], C.lA(0.85));
        fillPts([[-70, -52], [-30, -82], [20, -84], [62, -56], [24, -74], [-30, -72]], C.d);
        strokePts(ell(-4, -56, 18, 16, 14).concat([[14, -56]]), C.dA(0.85), 2); dot(-4, -57, 6, C.xA(0.7));
        strokePts([[-74, -50], [-30, -86], [20, -88], [66, -56]], C.xA(0.9), 3); strokePts([[-62, -46], [-26, -30], [24, -32], [56, -50]], C.dA(0.7), 2);
        martele(-90, -100, 92, -6, C, 171, 300); hatch([[40, -104], [96, -104], [96, 0], [40, 0]], 0.9, 3.4, 0.25);
      }, 9541);
      coupe([[-94, -6], [-48, -3], [0, 0], [48, -3], [96, -8]], C);
    },
  };
  const MORCEAU_H = { orteil: 98, nez: 152, main: 166, rayon: 200, oeil: 104 };
  LIB.MORCEAUX = Object.keys(MORCEAUX);
  function drawMorceau(type, o) { const C = cuivre(o.couleur); (MORCEAUX[type] || MORCEAUX.nez)(C); const e = clamp(o.eclat || 0); if (e > 0) etoile(-10, -(MORCEAU_H[type] || 120) * 0.7, 60 * e, e); }
  LIB.morceau = (type, x, y, s, o) => accDraw('m_' + type, (oo) => drawMorceau(type, oo), x, y, s == null ? 0.9 : s, o);
  LIB.MORCEAU_H = MORCEAU_H;

  // ---------------- caisse de bois cerclée, couvercle à charnière (ouvre 0..1), contenu (morceau) qui sort ; repère = milieu du bas de la face avant
  const CB = '#B89868', CBL = '#d2b688', CBD = '#937650', FER = '#4a4644';
  const BANDES = { rouge: '#8a2f28', bleu: '#2D4470', vert: '#3d5e46', noir: '#2a2624', ocre: '#a07a2c' };
  function drawCaisse(o) {
    const th = ease(clamp(o.ouvre || 0)) * 1.95, sor = clamp(o.sortie == null ? o.ouvre || 0 : o.sortie), D_ = 110, cth = Math.cos(th), sth = Math.sin(th);
    const lid = [[-64, -146, 1], [96, -146, 1], [80 + 16 * (1 - cth), -130 - 16 * (1 - cth) - D_ * sth, 1], [-80 + 16 * (1 - cth), -130 - 16 * (1 - cth) - D_ * sth, 1]];
    const lidDraw = () => pc(lid, th < PI / 2 ? CBL : CBD, () => { for (let i = 1; i < 4; i++) strokePts([[lerp(lid[0][0], lid[3][0], i / 4), lerp(lid[0][1], lid[3][1], i / 4)], [lerp(lid[1][0], lid[2][0], i / 4), lerp(lid[1][1], lid[2][1], i / 4)]], 'rgba(80,55,30,0.45)', 1.1); hatch(null, 0.2, 4, 0.18); }, 9611);
    pc([[-80, -130, 1], [80, -130, 1], [96, -146, 1], [-64, -146, 1]], th > 0.05 ? '#3a2a1a' : CBL, () => hatch(null, 0.2, 4, 0.2), 9601);   // dessus / intérieur
    if (th > 1.0) lidDraw();
    if (o.contenu && sor > 0) {
      const c = cx_(), ms = o.contenuS || 0.8; c.save();
      if (!SIL()) { c.beginPath(); c.rect(-400, -1200, 800, 1200 - 130 + 2); c.clip(); }
      c.translate(8, lerp(20, -118, ease(sor))); c.scale(ms, ms); drawMorceau(o.contenu, { couleur: o.couleur, eclat: o.eclat }); c.restore();
    }
    pc([[80, 0, 1], [96, -16, 1], [96, -146, 1], [80, -130, 1]], CBD, () => { strokePts([[88, -8], [88, -138]], FER, 3); hatch(null, 0.3, 4, 0.25); }, 9602);
    pc(rect(-80, -130, 80, 0), CB, () => {
      for (const y of [-98, -66, -34]) strokePts([[-80, y], [80, y]], 'rgba(80,55,30,0.55)', 1.3);
      fillPts(rect(-80, -130, -64, 0), CBL); fillPts(rect(64, -130, 80, 0), CBD); fillPts(rect(-80, -130, 80, -118), CBL); fillPts(rect(-80, -12, 80, 0), CBD);
      fillPts(rect(-58, -84, 58, -66), o.bande === 'aucune' ? CB : rgba(BANDES[o.bande] || o.bande || BANDES.noir, 0.8));   // pochoir : une simple bande
      for (const x of [-40, 40]) { fillPts(rect(x - 5, -130, x + 5, 0), FER); rivets([[x, -122], [x, -64], [x, -8]], 2.2, '#9a948c'); }
      hatch(null, 0.15, 4.4, 0.18); shade(-80, -130, 80, 0, 0.22, [-82, -132, 82, 2]);
    }, 9603);
    if (th <= 1.0) lidDraw();
    if (o.suspendue) { const A = CAISSE_PTS.anneau; for (const p of [[-70, -136], [86, -140], [-56, -146], [92, -146]]) strokePts([p, A], '#c9b48a', 2); strokePts(ell(A[0], A[1] - 6, 7, 7, 10).concat([[A[0] + 7, A[1] - 6]]), '#3a3634', 2.6); }
  }
  const CAISSE_PTS = { base: [0, 0], dessus: [8, -146], anneau: [8, -290], contenu: [8, -200], devant: [0, -65], couvercle: [80, -130] };
  LIB.caisse = (x, y, s, o) => accDraw('caisse', drawCaisse, x, y, s == null ? 1 : s, o);
  LIB.caissePt = function (nom, x, y, s, o) { const q = CAISSE_PTS[nom] || [0, 0]; return locPt(q[0], q[1], x, y, s == null ? 1 : s, o); };

  // =====================================================================
  // 6) DÉCORS — pré-rendus dans LIB.init() ; LIB.atelier(t, o) et LIB.port(t, o) se dessinent AVANT M.drawFloor()
  // =====================================================================
  const BACK = 1395;
  function withDrop(A, dx, dy, a) { return M.pre(1080, 1400, (c) => { c.save(); c.globalAlpha = a || 0.3; c.filter = 'brightness(0) blur(8px)'; c.drawImage(A, dx || 14, dy || 7); c.restore(); c.drawImage(A, 0, 0); }); }
  function gradRect(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(0, y0, 0, y1); for (const [k, col] of stops) g.addColorStop(k, col); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
  function briques(x0, y0, x1, y1, base, seed) {
    const c = cx_(); c.fillStyle = base; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0, r = 0; y < y1; y += 22, r++) for (let x = x0 - (r % 2) * 26; x < x1; x += 52) {
      const v = hash(x * 0.37 + y * 1.3 + seed); c.fillStyle = `rgba(${v < 0.3 ? '120,60,30' : v < 0.6 ? '170,100,55' : '150,85,45'},${0.25 + 0.2 * v})`; c.fillRect(x + 2, y + 2, 48, 18);
    }
    c.strokeStyle = 'rgba(225,205,170,0.35)'; c.lineWidth = 1.2; c.beginPath();
    for (let y = y0, r = 0; y < y1; y += 22, r++) { c.moveTo(x0, y + 0.5); c.lineTo(x1, y + 0.5); for (let x = x0 - (r % 2) * 26; x < x1; x += 52) { c.moveTo(x + 0.5, y); c.lineTo(x + 0.5, y + 22); } }
    c.stroke();
  }
  // éclat de cuivre ou copeau : petit polygone plein irrégulier (triangle ou losange), jamais un arc ouvert
  function paillette(x, y, r, i, col) {
    const n = i % 2 ? 3 : 4, a0 = hash(i * 3.7) * TAU, pts = [];
    for (let k = 0; k < n; k++) { const a = a0 + k * TAU / n + 0.4 * hash(i + k * 1.3), rr = r * (k % 2 && n === 4 ? 0.45 : 1) * (0.7 + 0.3 * hash(i * 5 + k)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6, 1]); }
    fillPts(pts, col, 0, 0); strokePts(pts, 'rgba(70,40,20,0.55)', 0.9, true); dot(x - r * 0.2, y - r * 0.15, 0.9, 'rgba(255,235,190,0.8)');
  }
  // crochet de fer plein (pièce fermée, lisible comme un crochet et non comme une lettre)
  function crochetPlein(x, y, k) { const o = ep(x, y, 12 * k, 14 * k, 10, -0.5, PI * 1.05).concat(ep(x, y, 5 * k, 7 * k, 10, PI * 1.05, -0.5)); pc(o, '#2e2a28', () => strokePts([[x - 10 * k, y + 2 * k], [x - 2 * k, y + 12 * k]], 'rgba(255,255,255,0.3)', 1.2), 9795, { drop: false }); fillPts(rect(x + 8 * k, y - 22 * k, x + 13 * k, y - 4 * k), '#2e2a28'); }
  function poutre(pts, col, seed) { pc(pts, col || '#7a5a36', () => { hatch(null, 0.05, 4, 0.2); strokePts([pts[0], pts[1]], 'rgba(255,230,190,0.25)', 1.4); }, seed); }
  function bar(x0, y0, x1, y1, w, col, seed) { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2; poutre([[x0 + nx, y0 + ny, 1], [x1 + nx, y1 + ny, 1], [x1 - nx, y1 - ny, 1], [x0 - nx, y0 - ny, 1]], col, seed); }
  function echelle(xb, yb, xt, yt, w, seed) { const n = Math.round(Math.hypot(xt - xb, yt - yb) / 34); bar(xb - w / 2, yb, xt - w / 2, yt, 9, '#8a6a40', seed); bar(xb + w / 2, yb, xt + w / 2, yt, 9, '#8a6a40', seed + 1); for (let i = 1; i < n; i++) { const u = i / n; bar(lerp(xb, xt, u) - w / 2, lerp(yb, yt, u), lerp(xb, xt, u) + w / 2, lerp(yb, yt, u), 6, '#9a7a4c', seed + 2 + i); } }

  // ---------------------------------------------------------------- ATELIER (Gaget-Gauthier, Paris, vers 1878)
  const AT = { win: { x0: 236, y0: 176, x1: 844, y1: 636 }, poutre: { x0: 90, x1: 470, y: 520 }, forge: { x: 193, y: 1206 }, lanterne: { x: 330, y0: 150, y1: 474 }, poulie: { x: 716, y0: 150, y: 300 },
    pendule: { x: 908, y: 470, s: 0.62 }, etabli: { x0: 772, x1: 1050, y: 1170 }, rayonX: 690, libre: { x0: 250, x1: 780 } };
  LIB.AT = AT;
  function makeAtelierVue() {
    const W = AT.win;
    return M.pre(1080, 1400, (c) => {
      gradRect(c, W.x0, W.y0, W.x1, W.y1, [[0, '#8193a6'], [0.6, '#b9c4c8'], [1, '#d8d6cc']]);
      // toits de Paris derrière les vitres : zinc, cheminées, un dôme et un clocher au loin
      fillPts([[W.x0, 560], [300, 548], [360, 552], [420, 540], [520, 546], [600, 536], [700, 544], [W.x1, 538], [W.x1, W.y1], [W.x0, W.y1]], '#9aa3a8');
      fillPts(ell(612, 548, 36, 30, 20).slice(10).concat([[648, 552], [576, 552]]), '#8d969c'); fillPts(rect(608, 498, 616, 520), '#8d969c');
      fillPts([[430, 546], [438, 470], [446, 546]], '#8d969c');
      for (const [x, w, h, col] of [[W.x0, 90, 50, '#6f7b86'], [326, 110, 64, '#76828c'], [436, 80, 44, '#6b7782'], [516, 120, 70, '#73808a'], [636, 90, 52, '#6d7984'], [726, 120, 60, '#76828c']]) {
        fillPts([[x, W.y1], [x, 640 - h + 14], [x + 12, 640 - h], [x + w - 12, 640 - h], [x + w, 640 - h + 14], [x + w, W.y1]], col);
        for (let i = 0; i < Math.floor(w / 30); i++) { fillPts(rect(x + 14 + i * 30, 640 - h + 20, x + 26 + i * 30, 640 - h + 34), '#4f5962'); fillPts([[x + 12 + i * 30, 640 - h + 20], [x + 20 + i * 30, 640 - h + 12], [x + 28 + i * 30, 640 - h + 20]], '#5d6770'); }
        for (const cxx of [x + 18, x + w - 26]) { fillPts(rect(cxx, 640 - h - 22, cxx + 14, 640 - h + 2), '#9a6a4c'); for (let j = 0; j < 3; j++) fillPts(rect(cxx + 1 + j * 4, 640 - h - 28, cxx + 4 + j * 4, 640 - h - 22), '#b07a52'); }
      }
    });
  }
  function makeAtelierFond() {
    const W = AT.win;
    return M.pre(1080, 1400, (c) => {
      briques(0, 140, 1080, 1400, '#b07a4a', 3);
      gradRect(c, 0, 1100, 1080, 1400, [[0, 'rgba(40,25,15,0)'], [1, 'rgba(40,25,15,0.45)']]);
      gradRect(c, 0, 140, 1080, 360, [[0, 'rgba(40,25,15,0.35)'], [1, 'rgba(40,25,15,0)']]);
      // verrière : chambranle de fer, trou, vitres teintées, petits bois
      pc(rect(W.x0 - 26, W.y0 - 22, W.x1 + 26, W.y1 + 30), '#4a4c4e', () => strokePts([[W.x0 - 18, W.y1 + 22], [W.x1 + 18, W.y1 + 22]], 'rgba(255,255,255,0.25)', 1.4), 9701, { drop: false });
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0); c.restore();
      for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) { const v = hash(i * 7 + j * 13); c.fillStyle = `rgba(${200 + 30 * v},${215 + 20 * v},${225},${0.1 + 0.12 * v})`; c.fillRect(lerp(W.x0, W.x1, i / 7), lerp(W.y0, W.y1, j / 6), (W.x1 - W.x0) / 7, (W.y1 - W.y0) / 6); }
      for (let i = 0; i <= 7; i++) { const x = lerp(W.x0, W.x1, i / 7), w = i % 7 ? (i === 3 || i === 4 ? 5 : 3) : 8; c.fillStyle = '#3a3c3e'; c.fillRect(x - w, W.y0, 2 * w, W.y1 - W.y0); }
      for (let j = 0; j <= 6; j++) { const y = lerp(W.y0, W.y1, j / 6), w = j % 6 ? 3 : 8; c.fillStyle = '#3a3c3e'; c.fillRect(W.x0, y - w, W.x1 - W.x0, 2 * w); }
      for (let i = 0; i < 6; i++) strokePts([[lerp(W.x0, W.x1, (i + 0.2) / 7), W.y0 + 20], [lerp(W.x0, W.x1, (i + 0.5) / 7), W.y0 + 70]], 'rgba(255,255,255,0.25)', 2);
      // moulages en plâtre : main géante (haut gauche) et oreille (haut droite), pendus à un clou
      const platre = '#ece6d8', platreD = '#c9c1ae';
      c.save(); c.translate(84, 290);
      strokePts([[130, 250], [100, 300], [160, 300], [130, 250]], '#5a4a3a', 1.4);
      pc([[70, 470], [64, 410], [72, 360], [86, 300], [98, 298], [100, 350], [108, 296], [122, 294], [122, 346], [134, 298], [148, 300], [146, 352], [160, 316], [172, 322], [166, 380], [190, 360], [200, 372], [176, 420], [168, 470]], platre, () => {
        for (const [a, b] of [[[96, 340], [100, 300]], [[118, 340], [116, 300]], [[140, 344], [142, 304]]]) strokePts([a, b], platreD, 1.6);
        hatch(null, 0.8, 4, 0.12); shade(64, 0, 200, 0, 0.18, [60, 290, 204, 474]);
      }, 9702);
      c.restore(); strokePts([[214, 520], [214, 540]], '#5a4a3a', 1.4);
      c.save(); c.translate(-50, 0);
      strokePts([[960, 250], [940, 300], [980, 300], [960, 250]], '#5a4a3a', 1.4); dot(960, 250, 3, '#3a3030');
      pc([[930, 300], [970, 296], [996, 320], [1002, 360], [990, 400], [972, 430], [952, 432], [944, 412], [958, 396], [960, 370], [944, 350], [932, 330]], platre, () => { strokePts([[964, 316], [984, 340], [980, 380], [964, 404]], platreD, 2.4); strokePts([[950, 330], [962, 356]], platreD, 1.6); hatch(null, 0.8, 4, 0.12); }, 9703);
      c.restore();
      // râtelier à outils (au-dessus de l'établi) : maillets, marteaux, cisaille
      pc(rect(790, 776, 956, 794), '#6a4a2c', () => hatch(null, 0.1, 4, 0.2), 9704);
      for (let i = 0; i < 5; i++) {
        const x = 806 + i * 34; dot(x, 786, 3, '#c9a24e');
        if (i % 3 === 0) { bar(x, 790, x, 880, 8, '#8f6a3c', 9710 + i); pc([[x - 16, 880], [x + 16, 880], [x + 18, 912], [x - 18, 912]], '#c39a62', () => hatch(null, 0.1, 4, 0.2), 9720 + i); }
        else if (i % 3 === 1) { bar(x, 790, x, 870, 6, '#7a5a36', 9730 + i); pc(rect(x - 20, 870, x + 12, 886), '#5a5a5e', () => strokePts([[x - 18, 873], [x + 10, 873]], 'rgba(255,255,255,0.35)', 1.2), 9740 + i); }
        else { strokePts([[x - 4, 792], [x + 6, 860]], '#3a3a3e', 3); strokePts([[x + 4, 792], [x - 6, 860]], '#3a3a3e', 3); }
      }
      // gabarits de bois contre le mur, derrière l'établi
      for (const [x, h, a] of [[944, 210, 0.12], [900, 176, -0.08]]) { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x + Math.sin(u * PI) * 40 * (a > 0 ? 1 : -1) + a * u * 60, AT.etabli.y - u * h]); } pc(ribbon(pts, 18, 12), '#b48c5a', () => hatch(null, 0.1, 4, 0.2), 9750 + h); }
    });
  }
  function makeAtelierMilieu() {
    const A = M.pre(1080, 1400, (c) => {
      // échafaudage de bois à gauche : montants, croisillons, plancher, échelle ; poutre haute (passage du chat)
      for (const x of [124, 262]) bar(x, 420, x, BACK + 4, 16, '#7a5a36', 9800 + x);
      bar(AT.poutre.x0, AT.poutre.y, AT.poutre.x1, AT.poutre.y, 20, '#6e5030', 9810);
      bar(104, 860, 284, 860, 18, '#8a6a40', 9811); for (let x = 110; x < 280; x += 30) strokePts([[x, 852], [x, 868]], 'rgba(60,40,20,0.4)', 1);
      bar(124, 540, 262, 850, 9, '#86643c', 9812); bar(262, 540, 124, 850, 9, '#86643c', 9813);
      bar(470, 520, 470, 150, 14, '#6e5030', 9814); bar(470, 600, 418, 522, 9, '#86643c', 9815);
      echelle(288, BACK, 236, 860, 40, 9820);
      pc([[140, 851, 1], [168, 851, 1], [164, 818], [144, 818]], '#6b5a48', () => strokePts([[144, 826], [164, 826]], 'rgba(0,0,0,0.4)', 1.4), 9830);
      pc([[176, 851], [252, 851], [252, 838], [176, 838]], '#e4dcc6', () => fillPts(ell(176, 844, 4, 7, 8), '#c9c0a8'), 9831);
      // forge sous l'échafaudage : foyer de briques, hotte, tuyau ; soufflet appuyé
      pc([[128, BACK, 1], [258, BACK, 1], [258, 1214, 1], [128, 1214, 1]], '#8a4a32', () => { briques(128, 1214, 258, BACK, '#8a4a32', 9); fillPts(rect(128, 1206, 258, 1222), '#3a2a24'); fillPts(rect(144, 1240, 242, 1300), '#2a1a14'); }, 9840);
      pc([[118, 1090, 1], [268, 1090, 1], [246, 1060], [140, 1060]], '#3e3a38', () => strokePts([[126, 1086], [260, 1086]], 'rgba(255,255,255,0.25)', 1.4), 9841);
      pc(rect(170, 868, 218, 1062), '#46423f', () => { for (const y of [900, 960, 1020]) strokePts([[170, y], [218, y]], 'rgba(0,0,0,0.35)', 2); }, 9842);
      pc([[226, 1352], [270, 1318], [282, 1330], [272, 1362], [236, 1368]], '#7a4a2a', () => { for (let i = 0; i < 4; i++) strokePts([[238 + i * 9, 1362 - i * 6], [246 + i * 9, 1326 - i * 3]], 'rgba(30,15,5,0.45)', 1.2); }, 9843);
      bar(270, 1326, 292, 1276, 6, '#5a3a20', 9844);
      // établi long à droite : plateau, pieds, étau, bol de cuivre, maquette de la statue, outils
      const E = AT.etabli;
      pc(rect(E.x0, E.y, E.x1, E.y + 26), '#8a6238', () => { hatch(null, 0.05, 4, 0.2); strokePts([[E.x0, E.y + 2], [E.x1, E.y + 2]], 'rgba(255,230,190,0.35)', 1.6); }, 9860);
      for (const x of [790, 1020]) pc(rect(x - 12, E.y + 26, x + 12, BACK + 4), '#6e4c2a', () => hatch(null, 0.1, 4, 0.2), 9861 + x);
      bar(790, 1340, 1020, 1340, 12, '#6e4c2a', 9863);
      pc([[800, E.y], [800, E.y - 34], [846, E.y - 34], [846, E.y - 18], [830, E.y - 18], [830, E.y]], '#4a4a50', () => { strokePts([[800, E.y - 30], [846, E.y - 30]], 'rgba(255,255,255,0.3)', 1.2); bar(816, E.y - 40, 816, E.y - 6, 4, '#2e2e32', 9864); }, 9865);
      pc(ep(900, E.y - 2, 34, 26, 12, PI, TAU).concat([[934, E.y], [866, E.y]]), '#c47a3e', () => { strokePts(ep(900, E.y - 2, 28, 18, 10, PI * 1.1, PI * 1.5), 'rgba(255,220,160,0.6)', 1.6); }, 9866);
      // maquette en plâtre de la statue (petite, sur l'établi)
      accDraw('maquette', () => drawStatue({ platre: true }), 990, E.y, 0.12, {});
      bar(930, E.y - 6, 960, E.y - 14, 5, '#6a6a70', 9867); pc(rect(952, E.y - 22, 966, E.y - 6), '#c39a62', null, 9868);
      for (let i = 0; i < 6; i++) pc([[796 + i * 2, 1390 - i * 7, 1], [944 - i * 2, 1390 - i * 7, 1], [942 - i * 2, 1383 - i * 7, 1], [798 + i * 2, 1383 - i * 7, 1]], i % 2 ? '#c47a3e' : '#b46a32', () => strokePts([[810, 1386 - i * 7], [930, 1386 - i * 7]], 'rgba(255,210,150,0.5)', 1.2), 9870 + i, { drop: false });
    });
    return withDrop(A, 14, 8, 0.32);
  }
  function makeAtelierDevant() {
    const A = M.pre(1080, 1400, (c) => {
      // enclume sur sa souche (droite), tréteau avec feuille de cuivre (bord droit), seau (gauche) ; copeaux
      c.save(); c.translate(680, 0);
      pc([[150, BACK, 1], [250, BACK, 1], [244, 1290, 1], [156, 1290, 1]], '#6a4a2c', () => { for (let i = 0; i < 4; i++) strokePts(ep(200, 1290, 40 - i * 9, 6 - i, 10, 0, PI), 'rgba(40,25,10,0.4)', 1); hatch(null, 1.5, 4, 0.2); }, 9901);
      pc([[132, 1290, 1], [272, 1290, 1], [262, 1270], [236, 1262], [244, 1236], [290, 1232], [258, 1222], [140, 1222], [150, 1250], [162, 1262], [140, 1270]], '#3a3a3e', () => { strokePts([[142, 1226], [256, 1226]], 'rgba(255,255,255,0.35)', 2); hatch(null, 0.2, 3.6, 0.25); }, 9902);
      c.restore();
      for (const x of [990]) { bar(x - 40, BACK, x - 10, 1270, 10, '#8a6a40', 9910 + x); bar(x + 40, BACK, x + 10, 1270, 10, '#8a6a40', 9911 + x); }
      bar(950, 1270, 1060, 1270, 16, '#9a7a4c', 9915);
      pc([[296, BACK, 1], [336, BACK, 1], [342, 1344], [290, 1344]], '#6b5a48', () => { strokePts([[292, 1354], [340, 1354]], 'rgba(0,0,0,0.4)', 2); strokePts(ep(316, 1344, 26, 20, 10, PI, TAU), '#3a3030', 2); }, 9917);
      for (let i = 0; i < 14; i++) { const x = i < 7 ? 130 + i * 14 + 6 * hash(i) : 790 + (i - 7) * 24 + 8 * hash(i), y = BACK - 2 - 4 * hash(i * 3); paillette(x, y - 3, 5 + 2 * hash(i * 9), i, i % 3 ? '#c9a46a' : '#c47a3e'); }
    });
    return withDrop(A, 10, 6, 0.3);
  }
  function chat(x, y, g, s) {
    const c = cx_(), w = Math.sin(g * 9);
    c.save(); c.translate(x, y); c.scale(s, s);
    for (const [lx, ph] of [[-14, 0], [12, PI]]) { const a = 0.4 * Math.sin(g * 9 + ph); pc([[lx - 3, -12], [lx + 3, -12], [lx + 3 + Math.sin(a) * 12, 0], [lx - 3 + Math.sin(a) * 12, 0]], '#2e2a2a', null, 9950, { drop: false }); }
    pc([[-26, -12], [-20, -24], [10, -26], [20, -20], [22, -12], [0, -8]], '#3a3434', () => { for (const x2 of [-14, -6, 2, 10]) strokePts([[x2, -24], [x2 - 2, -12]], 'rgba(120,110,100,0.5)', 1.4); }, 9951, { drop: false });
    pc([[18, -22], [24, -36], [28, -30], [34, -36], [38, -24], [36, -14], [22, -12]], '#3a3434', () => { dot(32, -24, 1.8, '#d8c050'); }, 9952, { drop: false });
    strokePts([[-26, -16], [-40, -24 + 4 * w], [-46, -40 + 3 * w]], '#3a3434', 4);
    c.restore();
  }
  function pigeon(x, y, s, vol, g, dir) {
    const c = cx_(), fl = vol ? Math.sin(g * 26) : 0;
    c.save(); c.translate(x, y); c.scale(s * (dir || 1), s);
    pc(ell(0, -10, 16, 9, 12), '#8a8e96', () => fillPts(ell(4, -12, 8, 5, 8), '#6e8a7a'), 9960, { drop: false });
    pc(ell(14, -20, 6, 6, 10), '#7a7e86', () => dot(16, -21, 1.4, '#e08a30'), 9961, { drop: false });
    fillPts([[19, -20], [25, -18], [19, -17]], '#d8b090');
    pc([[-6, -14], [10, -14], [4, -14 - 18 * fl - (vol ? 6 : 0)], [-14, -12 - 14 * fl]], '#6e727a', null, 9962, { drop: false });
    if (!vol) { strokePts([[0, -2], [0, 4]], '#c06050', 1.6); strokePts([[4, -2], [5, 4]], '#c06050', 1.6); }
    fillPts([[-14, -10], [-26, -6], [-24, -2], [-12, -6]], '#5e626a');
    c.restore();
  }
  LIB.pigeon = (x, y, s, o) => { o = o || {}; pigeon(x, y, s == null ? 1 : s, o.vol, M.tg(o.t || 0), o.dir); };
  LIB.atelier = function (t, o) {
    o = o || {}; const K = LIB.K, c = cx_(), g = M.tg(t), W = AT.win;
    // vue par la verrière : ciel gris-bleu, nuages, toits, fumées de cheminées, pigeon
    c.save(); c.beginPath(); c.rect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0); c.clip();
    c.drawImage(K.atVue, 0, 0);
    M.nuages(t, { y0: W.y0 + 40, y1: W.y0 + 200, n: 4, vit: 10, s: 0.5, seed: 31, col: '#e6e2d8', brume: 0.15 });
    M.fumee(t, { x: 352, y: 560, s: 0.32, n: 5, haut: 200, vent: 60, col: '#c9c6c0', a: 0.55, seed: 4 });
    M.fumee(t, { x: 748, y: 568, s: 0.28, n: 5, haut: 180, vent: 60, col: '#c9c6c0', a: 0.5, seed: 8 });
    c.restore();
    c.drawImage(K.atFond, 0, 0);
    if (o.pigeon > 0) { const u = clamp(o.pigeon), vol = u < 0.4, px = vol ? lerp(W.x1 + 60, 640, M.easeOut(u / 0.4)) : 640, py = vol ? lerp(W.y0 + 40, W.y0 + 152, M.easeOut(u / 0.4)) : W.y0 + 152 + (Math.sin(g * 5) > 0.7 ? 2 : 0); c.save(); c.globalAlpha = 0.85; pigeon(px, py, 0.9, vol, g, -1); c.restore(); }
    M.pendule(t, { x: AT.pendule.x, y: AT.pendule.y, s: AT.pendule.s, per: 2 });
    // lanterne à huile suspendue (balance sur sa chaîne) + poulie et chaîne qui balance
    const swing = (x0, y0, len, a) => [x0 + Math.sin(a) * len, y0 + Math.cos(a) * len];
    const aL = 0.035 * Math.sin(g * 1.3), L = AT.lanterne, pL = swing(L.x, L.y0, L.y1 - L.y0, aL);
    strokePts([[L.x, L.y0], pL], '#2a2624', 2);
    c.save(); c.translate(pL[0], pL[1]); c.rotate(-aL);
    pc([[-16, 0], [16, 0], [22, 14], [18, 64], [-18, 64], [-22, 14]], '#3a3634', () => { fillPts(rect(-14, 16, 14, 58), 'rgba(255,214,140,0.55)'); for (const x of [-7, 7]) fillPts(rect(x - 1.4, 16, x + 1.4, 58), '#3a3634'); }, 9970, { drop: false });
    pc([[-24, 64], [24, 64], [16, 74], [-16, 74]], '#2a2624', null, 9971, { drop: false });
    c.restore();
    M.flamme(t, { x: pL[0], y: pL[1] + 52, s: 0.5, r: 120, seed: 5 });
    const P0 = AT.poulie, aP = 0.05 * Math.sin(g * 0.9 + 1), pP = swing(P0.x, P0.y0, P0.y - P0.y0, aP * 0.3);
    strokePts([[P0.x - 4, P0.y0], [pP[0] - 4, pP[1]]], '#5a4a3a', 2); strokePts([[P0.x + 4, P0.y0], [pP[0] + 4, pP[1]]], '#5a4a3a', 2);
    pc(ell(pP[0], pP[1] + 14, 18, 18, 14), '#5a5a60', () => { dot(pP[0], pP[1] + 14, 5, '#2a2a2e'); }, 9972, { drop: false });
    for (const [sg, len, ph] of [[-1, 300, 0], [1, 220, 1.4]]) {
      const a = aP * (sg > 0 ? 1.4 : 1) + 0.02 * Math.sin(g * 1.7 + ph), x0 = pP[0] + sg * 18, y0 = pP[1] + 14;
      for (let i = 0; i < len / 12; i++) { const p = swing(x0, y0, i * 12, a), r = i % 2 ? 3 : 5; strokePts(ell(p[0], p[1] + 6, i % 2 ? r : 2.4, 6, 8).concat([[p[0] + (i % 2 ? r : 2.4), p[1] + 6]]), '#3a3a3e', 1.8); }
      if (sg > 0) { const p = swing(x0, y0, len, a); crochetPlein(p[0] - 8, p[1] + 10, 0.9); }
    }
    c.drawImage(K.atMilieu, 0, 0);
    // forge : braise, flamme, fumée qui s'échappe de la hotte
    const F = AT.forge;
    for (let i = 0; i < 9; i++) dot(F.x - 60 + i * 15, F.y + 6 + 3 * Math.sin(i * 2), 6, `rgba(${230 + 20 * Math.sin(g * 3 + i)},${90 + 40 * Math.sin(g * 2.3 + i * 1.7)},40,0.95)`);
    M.flamme(t, { x: F.x - 30, y: F.y + 2, s: 1.0, r: 200, seed: 7 }); M.flamme(t, { x: F.x + 24, y: F.y + 4, s: 0.8, r: 120, seed: 9 });
    M.fumee(t, { x: F.x, y: 1056, s: 0.55, n: 6, haut: 260, vent: 70, col: '#b9b2a6', a: 0.55, seed: 12 });
    // chat sur la poutre haute (o.chat 0..1 : traversée de gauche à droite)
    if (o.chat > 0 && o.chat < 1) chat(lerp(AT.poutre.x0 - 30, AT.poutre.x1 + 10, clamp(o.chat)), AT.poutre.y - 10, g, 1.35);
    c.drawImage(K.atDevant, 0, 0);
    // rayon de la verrière + poussière (tombe vers o.rayonX au sol)
    const rx = o.rayonX == null ? AT.rayonX : o.rayonX, ra = o.rayon == null ? 1 : o.rayon;
    if (ra > 0 && !SIL()) {
      const poly = [[W.x0 + 260, W.y1], [W.x1 - 20, W.y1], [rx + 190, BACK], [rx - 190, BACK]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      const gr = c.createLinearGradient(0, W.y1, 0, BACK); gr.addColorStop(0, `rgba(255,236,200,${0.14 * ra})`); gr.addColorStop(1, 'rgba(255,236,200,0.02)'); c.fillStyle = gr; c.fill(); c.clip();
      M.poussiere(t, { x: rx - 220, y: W.y1, w: 440, h: BACK - W.y1, n: 44, a: 0.75 * ra, seed: 21 });
      c.restore();
    }
  };
  // copeaux et chutes de cuivre sur le plancher (après M.drawFloor, sous les pieds, sur les côtés)
  LIB.atelierSol = function () {
    for (let i = 0; i < 16; i++) { const x = i < 8 ? 120 + i * 18 + 10 * hash(i * 5) : 800 + (i - 8) * 20 + 10 * hash(i * 5), y = 1430 + 60 * hash(i * 7.7); paillette(x, y, 5 + 3 * hash(i * 9), i + 40, i % 3 ? '#c9a46a' : '#c47a3e'); }
    pc([[196, 1470], [236, 1462], [240, 1470], [200, 1478]], '#c47a3e', () => strokePts([[200, 1468], [234, 1464]], 'rgba(255,220,160,0.6)', 1.2), 9990, { drop: false });
  };

  // ---------------------------------------------------------------- PORT DE NEW YORK (1885-1886)
  const PO = { horizon: 1088, eauY: 1096, quai: 1332, isere: { x0: 40, x1: 545, y: 1300 }, grue: { x: 176, y: BACK, pivot: [190, 1262], L: 690 },
    ile: { fond: { x: 800, y: 1150, s: 0.33 }, centre: { x: 540, y: 1238, s: 0.37 } }, bitte: { x: 312, y: 1340 }, lanterne: { x: 924, y: 1150 } };
  LIB.PO = PO;
  function drapeauUS(x, y, w, h, g, ph) {
    const c = cx_(), n = 12, sw = w / n;
    for (let i = 0; i < n; i++) {
      const u = i / n, dy = Math.sin(u * 5 - g * 4 + (ph || 0)) * 5 * u, xx = x + i * sw;
      for (let k = 0; k < 7; k++) { c.fillStyle = k % 2 ? '#ece6d8' : '#a8352c'; c.fillRect(xx, y + dy + k * h / 7, sw + 0.6, h / 7 + 0.6); }
      if (u < 0.42) { c.fillStyle = '#2D4470'; c.fillRect(xx, y + dy, sw + 0.6, h * 4 / 7); if (i % 2 === 0) for (let k = 0; k < 3; k++) { c.fillStyle = '#ece6d8'; c.fillRect(xx + sw * 0.4, y + dy + (k + 0.5) * h * 4 / 21 - 1, 2, 2); } }
    }
  }
  function drapeauFR(x, y, w, h, g, ph) {
    const c = cx_(), n = 10, sw = w / n;
    for (let i = 0; i < n; i++) { const u = i / n, dy = Math.sin(u * 5 - g * 4.2 + (ph || 0)) * 5 * u; c.fillStyle = u < 1 / 3 ? '#2D4470' : u < 2 / 3 ? '#ece6d8' : '#a8352c'; c.fillRect(x + i * sw, y + dy, sw + 0.6, h); }
  }
  function flamme_(x, y, w, g, ph, col) { const c = cx_(); c.beginPath(); c.moveTo(x, y); for (let i = 0; i <= 8; i++) { const u = i / 8; c.lineTo(x + u * w, y + 4 * u + Math.sin(u * 4 - g * 5 + ph) * 3 * u); } for (let i = 8; i >= 0; i--) { const u = i / 8; c.lineTo(x + u * w, y + 10 - 6 * u + Math.sin(u * 4 - g * 5 + ph) * 3 * u); } c.closePath(); c.fillStyle = col || '#a8352c'; c.fill(); }
  LIB.drapeauUS = drapeauUS; LIB.drapeauFR = drapeauFR;
  function makePortCiel() {
    return M.pre(1080, 1400, (c) => {
      gradRect(c, 0, 0, 1080, PO.horizon, [[0, '#7f9cb4'], [0.55, '#b8c9d0'], [1, '#e2ddc8']]);
      gradRect(c, 0, PO.eauY - 10, 1080, 1400, [[0, '#8fa6ac'], [0.4, '#5f7f8a'], [1, '#3e5a66']]);
      // Manhattan 1885 : immeubles bas, clochers (Trinity), tour de la Bourse, mâts des quais, pont de Brooklyn à droite
      const brume = (h, a) => mixA(h, '#c8d0cf', a);
      for (let i = 0; i < 46; i++) { const x = i * 24 - 10 + 10 * hash(i), h = 30 + 46 * hash(i * 3.1), w = 20 + 14 * hash(i * 5.3); fillPts(rect(x, PO.horizon - h, x + w, PO.horizon + 2), brume(i % 3 ? '#7d8790' : '#8a8f8c', 0.35)); for (let j = 0; j < 3; j++) fillPts(rect(x + 4, PO.horizon - h + 8 + j * 12, x + w - 4, PO.horizon - h + 11 + j * 12), brume('#5a6470', 0.4)); }
      fillPts([[226, PO.horizon - 40], [226, PO.horizon - 110], [232, PO.horizon - 118], [238, PO.horizon - 110], [238, PO.horizon - 40]], brume('#6f7a84', 0.3)); fillPts([[228, PO.horizon - 118], [232, PO.horizon - 190], [236, PO.horizon - 118]], brume('#6f7a84', 0.3));
      fillPts(rect(470, PO.horizon - 120, 500, PO.horizon), brume('#76808a', 0.3)); fillPts([[466, PO.horizon - 120], [485, PO.horizon - 146], [504, PO.horizon - 120]], brume('#6f7a84', 0.3));
      fillPts([[640, PO.horizon - 60], [640, PO.horizon - 96], [646, PO.horizon - 104], [652, PO.horizon - 96], [652, PO.horizon - 60]], brume('#6f7a84', 0.3)); fillPts([[642, PO.horizon - 104], [646, PO.horizon - 150], [650, PO.horizon - 104]], brume('#6f7a84', 0.3));
      for (let i = 0; i < 14; i++) { const x = 60 + i * 66 + 20 * hash(i * 9); strokePts([[x, PO.horizon + 2], [x, PO.horizon - 70 - 30 * hash(i)]], brume('#5a5450', 0.4), 1.4); strokePts([[x - 10, PO.horizon - 50], [x + 10, PO.horizon - 50]], brume('#5a5450', 0.4), 1); }
      // pont de Brooklyn (tours gothiques, câbles)
      for (const x of [860, 1060]) { fillPts(rect(x - 14, PO.horizon - 150, x + 14, PO.horizon + 4), brume('#7a7670', 0.35)); fillPts(rect(x - 8, PO.horizon - 132, x - 2, PO.horizon - 96), brume('#c9cfcc', 0.2)); fillPts(rect(x + 2, PO.horizon - 132, x + 8, PO.horizon - 96), brume('#c9cfcc', 0.2)); }
      strokePts(qbez([760, PO.horizon - 40], [810, PO.horizon - 50], [860, PO.horizon - 150], 10), brume('#5a5652', 0.4), 1.4); strokePts(qbez([860, PO.horizon - 150], [960, PO.horizon - 40], [1060, PO.horizon - 150], 14), brume('#5a5652', 0.4), 1.4);
      fillPts(rect(760, PO.horizon - 44, 1080, PO.horizon - 38), brume('#6a6662', 0.35));
      for (let x = 870; x < 1060; x += 12) strokePts([[x, PO.horizon - 42], [x, PO.horizon - 150 + 110 * Math.pow(Math.abs((x - 960) / 100), 1.6) * 0.98]], brume('#5a5652', 0.6), 0.6);
      gradRect(c, 0, PO.horizon - 200, 1080, PO.horizon + 4, [[0, 'rgba(220,224,220,0)'], [1, 'rgba(220,224,220,0.35)']]);
      fillPts(rect(0, PO.horizon, 1080, PO.eauY + 2), '#a8b8b6');
    });
  }
  function makeIle(k) {
    const w = 640 * k / 0.37, h = 200 * k / 0.37;
    const cv = M.cutFlat(Math.ceil(w), Math.ceil(h) + 10, w / 2, h, () => {
      const s = k / 0.37;
      // île (rochers, herbe), fort en étoile (bastions), arbres
      pc([[-300 * s, 0], [-250 * s, -30 * s], [-180 * s, -44 * s], [180 * s, -44 * s], [250 * s, -30 * s], [300 * s, 0]], '#6d7a5a', () => { hatch(null, 0.3, 4, 0.2); for (let i = 0; i < 12; i++) dot(-260 * s + i * 46 * s, -10 * s, 8 * s, 'rgba(80,80,70,0.6)'); }, 9601 + Math.round(k * 100));
      const star = []; for (let i = 0; i < 22; i++) { const a = PI + i / 22 * TAU, r = (i % 2 ? 150 : 236) * s; star.push([Math.cos(a) * r, -112 * s + Math.sin(a) * r * 0.16, 1]); }
      pc([[-236 * s, -40 * s, 1], [-226 * s, -108 * s, 1], [226 * s, -108 * s, 1], [236 * s, -40 * s, 1]], '#9a8b7a', () => {
        for (let y = -50; y > -110; y -= 14) strokePts([[-240 * s, y * s], [240 * s, y * s]], 'rgba(70,60,50,0.4)', 1);
        for (let i = -3; i <= 3; i++) { const x = i * 66 * s; fillPts([[x - 30 * s, -108 * s], [x, -44 * s], [x + 30 * s, -108 * s]], i % 2 ? 'rgba(255,245,230,0.18)' : 'rgba(70,60,50,0.3)'); }
        hatch([[60 * s, -110 * s], [240 * s, -110 * s], [240 * s, -40 * s], [60 * s, -40 * s]], 0.9, 4, 0.2);
      }, 9611 + Math.round(k * 100));
      pc(star, '#7d9a62', () => { strokePts(star.concat([star[0]]), 'rgba(60,50,40,0.6)', 1.2); fillPts(star.map((q) => [q[0] * 0.8, -112 * s + (q[1] + 112 * s) * 0.8]), '#8aa86e'); }, 9615 + Math.round(k * 100), { drop: false });
      for (const x of [-270, -224, 226, 268]) { pc(ell(x * s, -54 * s, 26 * s, 34 * s, 12), '#4f6a46', () => hatch(null, 0.8, 3.4, 0.25), 9620 + x); fillPts(rect((x - 3) * s, -26 * s, (x + 3) * s, -6 * s), '#4a3a2a'); }
    });
    cv.padB = 10; return M.withShadow(cv, 6);
  }
  function makeSocle(k) { const w = 480 * k, h = SOCLE_H * k; const cv = M.cutFlat(Math.ceil(w) + 8, Math.ceil(h) + 12, (w + 8) / 2, h + 2, () => { accDraw('socleK', () => drawSocle(), 0, 0, k, {}); }); cv.hpx = h; cv.base = h + 2; return cv; }
  function makeIsere() {
    const W = 620, H = 760;
    return M.withShadow(M.cutFlat(W, H, 40, H - 10, () => {
      const y = 0, B = (x) => x;   // coque : proue à gauche, poupe à droite
      // mâts, vergues, voiles ferlées, haubans
      for (const [x, top, yd] of [[110, -690, [-560, -470, -380]], [252, -720, [-590, -490, -400]], [396, -640, [-520, -440]]]) {
        for (const yy of yd) { const half = 74 + (yy + 600) * 0.1; bar(B(x) - half, yy, B(x) + half, yy, 6, '#4a3a2a', 9640 + x + yy); pc([[x - half + 4, yy + 2, 1], [x + half - 4, yy + 2, 1], [x + half - 10, yy + 12], [x - half + 10, yy + 12]], '#e4dccb', () => strokePts([[x - half + 12, yy + 7], [x + half - 12, yy + 7]], 'rgba(120,110,90,0.4)', 1), 9650 + x + yy, { drop: false }); }
        bar(x, -60, x, top, 9, '#5a4632', 9660 + x);
        for (const sg of [-1, 1]) strokePts([[x + sg * 46, -70], [x, top + 60]], 'rgba(40,32,26,0.6)', 1);
      }
      strokePts([[-36, -110], [110, -690]], 'rgba(40,32,26,0.6)', 1.2); strokePts([[110, -690], [252, -720]], 'rgba(40,32,26,0.6)', 1.2); strokePts([[252, -720], [396, -640]], 'rgba(40,32,26,0.6)', 1.2); strokePts([[396, -640], [520, -110]], 'rgba(40,32,26,0.6)', 1.2);
      bar(-34, -112, 30, -92, 7, '#4a3a2a', 9670);                                   // beaupré
      // cheminée de la machine à vapeur
      pc(rect(318, -230, 344, -70), '#2a2828', () => { fillPts(rect(318, -230, 344, -214), '#a8352c'); strokePts([[324, -210], [324, -80]], 'rgba(255,255,255,0.2)', 1.6); }, 9671);
      // coque noire, liseré blanc, sabords
      pc([[-20, -110], [10, -116], [500, -116], [526, -104], [520, -40], [500, 0, 1], [40, 0, 1], [6, -50]], '#1e1e22', () => {
        fillPts([[0, -96], [516, -96], [516, -88], [2, -88]], '#ece6d8');
        for (let x = 60; x < 480; x += 36) fillPts(rect(x, -82, x + 14, -70), '#0e0e10');
        fillPts([[-20, -110], [520, -110], [520, -104], [-14, -104]], '#6a5440');
        strokePts([[40, -20], [500, -20]], 'rgba(255,255,255,0.12)', 1.4); hatch(null, 0.1, 4, 0.18);
      }, 9672);
    }), 8);
  }
  const ISERE_PTS = { pavillon: [255, -716], cheminee: [331, -230], flamme: [113, -686], pont: [270, -116] };
  function makeQuai() {
    const A = M.pre(1080, 1400, (c) => {
      // quai pavé (bordure de pierre) + parapet
      pc([[0, PO.quai, 1], [1080, PO.quai, 1], [1080, 1400, 1], [0, 1400, 1]], '#8c8378', () => {
        for (let y = PO.quai + 10, r = 0; y < 1400; y += 14, r++) for (let x = (r % 2) * 14; x < 1080; x += 28) { c.fillStyle = `rgba(${hash(x + y) < 0.5 ? '70,62,56' : '150,140,128'},0.3)`; c.fillRect(x + 1, y + 1, 25, 11); }
        fillPts(rect(0, PO.quai, 1080, PO.quai + 10), '#a49a8c'); strokePts([[0, PO.quai + 10], [1080, PO.quai + 10]], 'rgba(40,34,30,0.5)', 1.4);
      }, 9701, { drop: false });
      // bittes d'amarrage et cordages lovés
      for (const x of [PO.bitte.x, 700]) { pc([[x - 14, PO.bitte.y + 22], [x + 14, PO.bitte.y + 22], [x + 12, PO.bitte.y - 4], [x + 18, PO.bitte.y - 12], [x - 18, PO.bitte.y - 12], [x - 12, PO.bitte.y - 4]], '#2e2c2c', () => strokePts([[x - 16, PO.bitte.y - 10], [x + 4, PO.bitte.y - 10]], 'rgba(255,255,255,0.3)', 1.4), 9702 + x); }
      for (const x of [370, 1000]) { for (let i = 0; i < 5; i++) strokePts(ell(x, BACK - 8 - i * 4, 34 - i * 4, 8 - i, 14).concat([[x + 34 - i * 4, BACK - 8 - i * 4]]), '#b9a27a', 3); }
      strokePts(qbez([PO.bitte.x, PO.bitte.y - 8], [250, 1330], [200, 1296], 8), '#b9a27a', 3);
      // à gauche : bouées sur poteau ; à droite : tonneaux, ballots, chariot à bras, lanterne de quai
      for (const [x, y, col] of [[132, 1232, '#ece6d8'], [226, 1286, '#a8352c']]) { pc(ell(x, y, 24, 24, 18), col, () => { for (let i = 0; i < 4; i++) { const a = i * PI / 2 + 0.4; fillPts(ep(x, y, 24, 24, 4, a, a + 0.5).concat(ep(x, y, 13, 13, 4, a + 0.5, a)), i % 2 ? '#a8352c' : '#ece6d8'); } }, 9711 + y); dot(x, y, 11, '#7d8a86'); strokePts([[x, y - 24], [PO.grue.x + (x < PO.grue.x ? -20 : 20), y - 46]], '#b9a27a', 1.6); }
      for (const [x, y, s] of [[850, BACK, 1], [910, BACK, 1], [880, BACK - 92, 1], [1010, BACK, 0.9]]) {
        pc([[x - 30 * s, y], [x + 30 * s, y], [x + 34 * s, y - 46 * s], [x + 30 * s, y - 92 * s], [x - 30 * s, y - 92 * s], [x - 34 * s, y - 46 * s]], '#8a6238', () => { for (const yy of [y - 14 * s, y - 78 * s]) strokePts([[x - 32 * s, yy], [x + 32 * s, yy]], '#3a3634', 3); for (let i = -2; i <= 2; i++) strokePts([[x + i * 12 * s, y], [x + i * 13 * s, y - 92 * s]], 'rgba(50,30,15,0.4)', 1); }, 9720 + x + y);
      }
      for (const [x, y] of [[780, BACK], [790, BACK - 46]]) pc([[x - 40, y], [x + 40, y], [x + 44, y - 42], [x - 44, y - 44]], '#c9b48a', () => { strokePts([[x - 40, y - 22], [x + 42, y - 22]], '#7a5a36', 2); strokePts([[x, y], [x + 2, y - 44]], '#7a5a36', 2); hatch(null, 0.6, 3.4, 0.2); }, 9730 + y);
      // chariot à bras (gauche)
      pc(rect(100, 1330, 230, 1352), '#7a5a36', () => hatch(null, 0.1, 4, 0.2), 9740); bar(230, 1340, 300, 1310, 6, '#6a4a2c', 9741);
      pc(ell(150, 1362, 28, 28, 18), '#5a4632', () => { for (let i = 0; i < 6; i++) { const a = i * PI / 3; strokePts([[150, 1362], [150 + Math.cos(a) * 24, 1362 + Math.sin(a) * 24]], '#3a2a1a', 2); } }, 9742);
      pc([[110, 1330], [210, 1330], [204, 1296], [116, 1296]], '#B89868', () => { fillPts(rect(116, 1312, 204, 1320), '#8a2f28'); for (const x of [136, 184]) fillPts(rect(x - 3, 1296, x + 3, 1330), '#4a4644'); }, 9743);
      // lanterne de quai sur poteau
      bar(PO.lanterne.x, BACK, PO.lanterne.x, PO.lanterne.y + 40, 8, '#2e2c2c', 9750);
      pc([[PO.lanterne.x - 14, PO.lanterne.y + 40], [PO.lanterne.x + 14, PO.lanterne.y + 40], [PO.lanterne.x + 18, PO.lanterne.y], [PO.lanterne.x - 18, PO.lanterne.y]], '#2e2c2c', () => fillPts(rect(PO.lanterne.x - 10, PO.lanterne.y + 6, PO.lanterne.x + 10, PO.lanterne.y + 34), 'rgba(255,214,140,0.5)'), 9751);
      fillPts([[PO.lanterne.x - 20, PO.lanterne.y], [PO.lanterne.x, PO.lanterne.y - 16], [PO.lanterne.x + 20, PO.lanterne.y]], '#2e2c2c');
      // mât du crochet de grue (le bras est dessiné en direct)
      const G = PO.grue;
      pc([[G.x - 44, BACK, 1], [G.x + 44, BACK, 1], [G.x + 34, BACK - 30, 1], [G.x - 34, BACK - 30, 1]], '#5a4a3e', () => hatch(null, 0.2, 4, 0.2), 9760);
      bar(G.x, BACK - 30, G.x, 640, 22, '#7a5a36', 9761); bar(G.x - 40, BACK - 30, G.x, 900, 10, '#86643c', 9762); bar(G.x + 40, BACK - 30, G.x, 900, 10, '#86643c', 9763);
      pc(ell(G.x - 24, 1180, 20, 20, 16), '#4a4644', () => { dot(G.x - 24, 1180, 6, '#2a2828'); bar(G.x - 44, 1180, G.x - 4, 1180, 6, '#2a2828', 9764); }, 9765);   // treuil
    });
    return withDrop(A, 10, 6, 0.28);
  }
  function makeFleche(L) { const cv = M.cutFlat(60, L + 30, 30, L + 10, () => { bar(-8, 0, -4, -L, 12, '#7a5a36', 9770); bar(8, 0, 4, -L, 12, '#7a5a36', 9771); for (let i = 1; i < 8; i++) { const y = -L * i / 8; bar(-8 + 4 * i / 8, y, 8 - 4 * i / 8, y - L / 8, 4, '#86643c', 9772 + i); } pc(ell(0, -L, 12, 12, 12), '#3a3634', () => dot(0, -L, 4, '#9a948c'), 9780); }); cv.padB = 20; return M.withShadow(cv, 6); }
  LIB.grue = function (o) { o = o || {}; const G = PO.grue, a = lerp(0.24, 0.6, clamp(o.fleche == null ? 0.5 : o.fleche)); return { pivot: G.pivot, bout: [G.pivot[0] + Math.sin(a) * G.L, G.pivot[1] - Math.cos(a) * G.L], a }; };
  // point nommé du port : LIB.portPt('crochet' | 'bout' | 'socle' (haut du socle selon o.socle) | 'statue' (pied) | 'ile' | 'bitte' | 'pavillon' | 'cheminee', o)
  LIB.portPt = function (nom, o) {
    o = o || {}; const I = PO.ile[o.ile === 'centre' ? 'centre' : 'fond'], k = I.s, top = I.y - 112 * k / 0.37 + 2;
    const gr = LIB.grue(o), hy = o.crochetY != null ? o.crochetY : gr.bout[1] + 300;
    const sway = 4 * Math.sin(M.tg(o.t || 0) * 1.6) * (o.crochetFixe ? 0 : 1);
    switch (nom) {
      case 'crochet': return [gr.bout[0] + sway, hy + 26];
      case 'bout': return gr.bout;
      case 'socle': return [I.x, top - SOCLE_H * k * socleVu(o.socle == null ? (o.hauteur == null ? 1 : o.hauteur) : o.socle)];
      case 'statue': return [I.x, top - SOCLE_H * k];
      case 'ile': return [I.x, top];
      case 'bitte': return [PO.bitte.x, PO.bitte.y - 14];
      case 'pavillon': return [PO.isere.x0 + ISERE_PTS.pavillon[0], PO.isere.y + ISERE_PTS.pavillon[1]];
      case 'cheminee': return [PO.isere.x0 + ISERE_PTS.cheminee[0], PO.isere.y + ISERE_PTS.cheminee[1]];
      default: return [540, 1200];
    }
  };
  const NBLOCS = 20;
  function socleVu(v) { v = clamp(v); const n = v * NBLOCS, f = Math.floor(n + 1e-6); return (f + ease(clamp(n - f))) / NBLOCS; }
  function drawSocleBlocs(cv, x, ytop, v, k) {
    const c = cx_(), H = cv.hpx, n = clamp(v) * NBLOCS, full = Math.floor(n + 1e-6), fr = clamp(n - full), hB = H / NBLOCS, W = cv.width;
    const sy = (i) => cv.base - (i + 1) * hB;   // haut du bloc i dans le canevas
    if (full > 0) c.drawImage(cv, 0, sy(full - 1), W, full * hB + 2, x - W / 2, ytop - full * hB, W, full * hB + 2);
    if (fr > 0.001 && full < NBLOCS) { c.save(); c.globalAlpha *= smooth(0, 0.35, fr); const off = (1 - ease(fr)) * 46; c.drawImage(cv, 0, sy(full), W, hB + 1, x - W / 2, ytop - (full + 1) * hB - off, W, hB + 1); c.restore(); }
    return ytop - (full + ease(fr)) * hB;
  }
  function echafaudage(x, yb, ytop, w, a, g) {
    if (a <= 0.01) return;
    const c = cx_(); c.save(); c.globalAlpha *= a;
    const top = ytop - 26, xs = [x - w / 2 - 10, x - w / 4, x + w / 4, x + w / 2 + 10];
    for (const xx of xs) strokePts([[xx, yb], [xx, top]], '#7a5a36', 3);
    for (let y = yb - 24; y > top; y -= 24) strokePts([[xs[0], y], [xs[3], y]], '#86643c', 2);
    for (let i = 0; i < 3; i++) { strokePts([[xs[i], yb], [xs[i + 1], top + 10]], 'rgba(122,90,54,0.8)', 1.4); }
    strokePts([[xs[0] - 6, ytop + 2], [xs[3] + 6, ytop + 2]], '#9a7a4c', 4);
    // grue à mât sur le chantier
    const mx = x + w * 0.12; strokePts([[mx, ytop], [mx, ytop - 96]], '#5a4632', 3); strokePts([[mx, ytop - 90], [mx + 70, ytop - 60]], '#5a4632', 2.4);
    const sw = 3 * Math.sin(g * 1.4); strokePts([[mx + 70, ytop - 60], [mx + 70 + sw, ytop - 20]], '#2a2424', 1); fillPts(rect(mx + 62 + sw, ytop - 20, mx + 78 + sw, ytop - 10), '#A8968A');
    strokePts([[mx, ytop - 96], [x - w / 2, ytop]], 'rgba(40,30,20,0.6)', 1);
    c.restore();
  }
  function tasDePieces(x, y, v, k) {
    if (!(v > 0)) return;
    const n = Math.round(10 + 50 * v), w = (60 + 160 * v) * k / 0.33, h = (8 + 30 * v) * k / 0.33;
    for (let i = 0; i < n; i++) { const u = hash(i * 1.7), r = Math.sqrt(hash(i * 3.9)), px = x + (u - 0.5) * w * r * 1.6, py = y - h * (1 - Math.abs(u - 0.5) * 2 * r) * hash(i * 7.3), C = cuivre(i % 5 === 0 ? 0.35 : 0.08 * hash(i)); dot(px, py, 3.6 * k / 0.33, C.d); dot(px - 0.6, py - 0.8, 2.6 * k / 0.33, i % 7 === 0 ? '#d8d6cc' : C.b); }
  }
  function bateauLoin(x, y, s, voile, g, i) {
    const c = cx_(); c.save(); c.translate(x, y + Math.sin(g * 1.2 + i) * 1.5); c.scale(s, s);
    fillPts([[-40, 0], [44, 0], [36, 10], [-34, 10]], '#4a5056');
    if (voile) { fillPts([[-4, -2], [-4, -70], [30, -6]], '#ece6d8'); fillPts([[-8, -4], [-8, -56], [-34, -6]], '#e0d8c6'); strokePts([[-4, 0], [-4, -74]], '#4a4440', 1.4); }
    else { fillPts(rect(-20, -16, 20, 0), '#5a5e62'); fillPts(rect(-4, -34, 4, -16), '#2a2828'); }
    c.restore();
  }
  LIB.port = function (t, o) {
    o = o || {}; const K = LIB.K, c = cx_(), g = M.tg(t), gN = o.gNuages == null ? t : o.gNuages;
    const mode = o.ile === 'centre' ? 'centre' : 'fond', I = PO.ile[mode], k = I.s, isere = o.isere == null ? mode === 'fond' : !!o.isere;
    const socle = clamp(o.socle == null ? (o.hauteur == null ? 1 : o.hauteur) : o.socle);
    c.drawImage(K.poCiel, 0, 0);
    M.nuages(gN, { y0: 220, y1: 720, n: 7, vit: 12, s: 0.85, seed: 41, col: '#f0ebe0', brume: 0.1 });
    M.oiseaux(t, { x0: -80, x1: 1160, y: 420, dur: 16, n: 4, s: 0.9, seed: 5, col: '#e9e4d8', boucle: true, brume: 0.15 });
    M.oiseaux(t, { x0: 1160, x1: -80, y: 560, dur: 21, n: 3, s: 0.7, seed: 9, col: '#e9e4d8', boucle: true, brume: 0.25 });
    for (const [x, sp] of [[180, 0.2], [430, 0.25], [700, 0.22]]) M.fumee(t, { x, y: PO.horizon - 60, s: sp, n: 4, haut: 160, vent: 50, col: '#c9c6bc', a: 0.4, seed: Math.round(x) });
    // eau lointaine + bateaux qui croisent lentement
    for (let i = 0; i < 3; i++) { const sp = [7, -5, 4][i], x = ((([120, 640, 900][i] + g * sp) % 1300) + 1300) % 1300 - 110; bateauLoin(x, PO.eauY + 18 + i * 14, 0.5 + 0.1 * i, i !== 1, g, i); }
    if (o.remorqueur > 0 && o.remorqueur < 1) { const x = lerp(1140, -120, o.remorqueur); bateauLoin(x, PO.eauY + 46, 0.85, false, g, 7); M.fumee(t, { x: x + 2, y: PO.eauY + 16, s: 0.35, n: 6, haut: 150, vent: 70, col: '#a9a59c', a: 0.6, seed: 17 }); }
    // île, socle par blocs, échafaudage, statue, pavillon du fort
    M.flat(K['ile_' + mode], I.x, I.y, {});
    const top = I.y - 112 * k / 0.37 + 2, cvS = K['socle_' + mode];
    const yS = drawSocleBlocs(cvS, I.x, top, socle, k);
    tasDePieces(I.x + 120 * k / 0.37, top, o.pieces || 0, k);
    echafaudage(I.x, top, yS, 360 * k, 1 - smooth(0.9, 1, socle), g);
    if (o.statue && socle >= 0.999) { const so = o.statue === true ? {} : o.statue; LIB.statue(I.x, top - SOCLE_H * k, k, { couleur: so.couleur || 0, eclat: so.eclat, eclatPt: so.eclatPt }); }
    if (o.salve != null) for (let i = 0; i < 3; i++) { const u = (t - o.salve - i * 0.55) / 2.4; if (u > 0 && u < 1) for (const sg of [-1, 1]) for (let j = 0; j < 4; j++) { const r = (10 + 50 * u) * k / 0.37 * (1 - j * 0.15); c.save(); c.globalAlpha = 0.7 * (1 - u); dot(I.x + sg * (190 + 30 * j * u) * k / 0.37, top - 20 - j * 14 * u - 30 * u, r, '#e8e4da'); c.restore(); } }
    // vaguelettes de la rade
    if (!SIL()) {
      c.save(); c.lineWidth = 1.6; c.lineCap = 'round';
      for (let r = 0; r < 16; r++) { const y = PO.eauY + 24 + r * 14 + r * r * 0.25, amp = 6 + r * 1.4, sp = 0.6 + 0.08 * r;
        for (let i = 0; i < 14; i++) { const x = ((i * 86 + r * 37 + g * 22 * sp) % 1180) - 50, dy = Math.sin(g * 1.8 + i + r) * 2; c.strokeStyle = r % 2 ? 'rgba(235,240,232,0.35)' : 'rgba(30,50,60,0.3)'; c.beginPath(); c.moveTo(x, y + dy); c.quadraticCurveTo(x + amp, y + dy - 3, x + amp * 2.4, y + dy); c.stroke(); } }
      c.restore();
    }
    // frégate Isère à quai (fond gauche) : pavillon, flamme, fumée de la cheminée
    if (isere) {
      const bob = Math.sin(g * 1.1) * 2, X0 = PO.isere.x0;
      M.fumee(t, { x: X0 + ISERE_PTS.cheminee[0], y: PO.isere.y + ISERE_PTS.cheminee[1] + bob, s: 0.6, n: 6, haut: 320, vent: 90, col: '#9e9a92', a: 0.6, seed: 23 });
      M.flat(K.isere, PO.isere.x0 + 270, PO.isere.y + 10 + bob, { cast: { dx: 10, dy: 4, a: 0.25 } });
      drapeauFR(X0 + ISERE_PTS.pavillon[0], PO.isere.y + ISERE_PTS.pavillon[1] + bob, 52, 34, g, 0.5);
      flamme_(X0 + ISERE_PTS.flamme[0], PO.isere.y + ISERE_PTS.flamme[1] + bob, 70, g, 0, '#a8352c');
      if (!SIL()) { c.save(); c.globalAlpha = 0.5; for (let i = 0; i < 8; i++) { const x = PO.isere.x0 + 20 + i * 64 + 10 * Math.sin(g * 2 + i); c.fillStyle = 'rgba(235,240,232,0.5)'; c.fillRect(x, PO.isere.y + 2 + Math.sin(g * 2.4 + i) * 1.5, 30, 2); } c.restore(); }
    }
    // grue de quai : bras (flèche) et crochet ; quai et ses accessoires
    const gr = LIB.grue(o);
    c.drawImage(K.poQuai, 0, 0);
    M.flat(K.fleche, gr.pivot[0], gr.pivot[1], { rot: gr.a, cast: { dx: 10, dy: 5, a: 0.25 } });
    strokePts([[PO.grue.x, 650], gr.bout], '#2a2424', 1.6); strokePts([[PO.grue.x - 24, 1180], [PO.grue.x, 650]], '#2a2424', 1.2);
    const hk = LIB.portPt('crochet', Object.assign({ t }, o));
    strokePts([gr.bout, [hk[0], hk[1] - 26]], '#2a2424', 1.8);
    pc([[hk[0] - 8, hk[1] - 30], [hk[0] + 8, hk[1] - 30], [hk[0] + 6, hk[1] - 14], [hk[0] - 6, hk[1] - 14]], '#3a3634', null, 9790, { drop: false });
    crochetPlein(hk[0] - 6, hk[1] - 2, 1);
    M.flamme(t, { x: PO.lanterne.x, y: PO.lanterne.y + 30, s: 0.35, r: 50, seed: 13 });
    bar(902, BACK, 902, 660, 7, '#3a3434', 9799); dot(902, 656, 6, '#c9a24e'); drapeauUS(905, 664, 92, 58, g, 2.2);
    if (o.fete) fanions(g);
    // mouette qui se pose sur la bitte (o.mouette 0..1)
    if (o.mouette > 0) { const u = clamp(o.mouette), vol = u < 0.4, B = LIB.portPt('bitte'), px = vol ? lerp(1100, B[0], M.easeOut(u / 0.4)) : B[0], py = vol ? lerp(760, B[1], M.easeOut(u / 0.4)) : B[1]; mouette(px, py, 1, vol, g); }
  };
  function fanions(g) {                                         // guirlandes de fanions de l'inauguration (en hauteur)
    const cols = ['#a8352c', '#ece6d8', '#2D4470'];
    for (const [y0, sag, n, ph] of [[250, 60, 16, 0], [312, 50, 13, 1.3]]) {
      const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(120, 960, u), y0 + Math.sin(u * PI) * sag + Math.sin(g * 1.2 + ph) * 4 * Math.sin(u * PI)]); }
      strokePts(pts, '#4a4440', 1.4);
      for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], sw = Math.sin(g * 2.2 + i) * 3; fillPts([a, b, [m[0] + sw, m[1] + 30]], cols[i % 3], 0, 0); if (i % 3 === 2) star5(m[0] + sw * 0.5, m[1] + 9, 4, '#ece6d8'); }
    }
  }
  function mouette(x, y, s, vol, g) {
    const c = cx_(), fl = vol ? Math.sin(g * 18) : 0;
    c.save(); c.translate(x, y); c.scale(-s, s);
    pc(ell(0, -12, 18, 9, 12), '#ece8e0', null, 9795, { drop: false }); pc(ell(16, -22, 7, 6, 10), '#ece8e0', () => dot(18, -23, 1.3, '#2a2a2a'), 9796, { drop: false });
    fillPts([[22, -22], [30, -20], [22, -19]], '#e0a030');
    pc([[-8, -16], [12, -16], [2, -18 - 22 * fl - (vol ? 4 : 0)], [-22, -14 - 16 * fl]], '#9aa0a6', () => fillPts([[-22, -14 - 16 * fl], [-14, -15 - 10 * fl], [-18, -12]], '#2a2a2a'), 9797, { drop: false });
    if (!vol) { strokePts([[0, -4], [0, 2]], '#d09a40', 1.6); strokePts([[4, -4], [5, 2]], '#d09a40', 1.6); }
    c.restore();
  }

  LIB.init = function () {
    if (LIB.K) return LIB.K;
    const K = (LIB.K = {});
    K.atVue = makeAtelierVue(); K.atFond = makeAtelierFond(); K.atMilieu = makeAtelierMilieu(); K.atDevant = makeAtelierDevant();
    K.poCiel = makePortCiel(); K.ile_fond = makeIle(PO.ile.fond.s); K.ile_centre = makeIle(PO.ile.centre.s);
    K.socle_fond = makeSocle(PO.ile.fond.s); K.socle_centre = makeSocle(PO.ile.centre.s);
    K.isere = makeIsere(); K.poQuai = makeQuai(); K.fleche = makeFleche(PO.grue.L);
    return K;
  };
})();
