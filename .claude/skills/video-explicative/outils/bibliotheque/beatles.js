// persos.js — « Les Beatles, recalés par Decca » (Liverpool / Londres, 1962–1963) : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.btl (alias BTL). Appeler BTL.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun tirage aléatoire) : fonction pure de t.
// INDEX : 1) géométrie  2) objets (guitare, basse, batterie, ampli, contrat, stylo, disque, pile, baguette, pipe, mallette)
//         3) objets tenus, IK, enveloppes  4) corps commun (têtes, coiffures, vestes)  5) musiciens (Beatles, Tremeloes, Stones, Smith, Martin)
//         6) Dick Rowe  7) Brian Epstein  8) accessoires seuls  9) bureau de Dick Rowe (pré-rendu dans BTL.init)
(function () {
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const BTL = (M.btl = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const BACK = M.ST.back;

  // =====================================================================
  // 1) GÉOMÉTRIE
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
  const bar = (a, b, w) => ribbon([a, b], w, w);
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function mixA(a, b, k, al) { const A = hx(a), B = hx(b); k = clamp(k); const v = A.map((x, i) => Math.round(lerp(x, B[i], k))); return al == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${al})`; }
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  function gradFill(pts, g) { if (SIL()) { fillPts(pts, '#000'); return; } const c = cx_(); c.save(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = g; c.fill(); c.restore(); }
  BTL.geo = { ep, ell, rect, ribbon, qbez, bar };

  // =====================================================================
  // 2) OBJETS (dessinés à l'échelle 1 ; repère propre à chaque objet)
  // =====================================================================
  // ---- guitare électrique demi-caisse 1962 : centre de la grande courbe en (0,0), manche vers −y ; 92 × 238 (bas y 46, tête y −192)
  const GUI = {
    sunburst: { c0: '#e0a64c', c1: '#7a4418', c2: '#3a200e', bord: '#efe2c0', tete: '#2a1a10' },
    acajou: { c0: '#a4482a', c1: '#7a2e1a', c2: '#4e1a10', bord: '#e8dcc0', tete: '#3a1810' },
    blonde: { c0: '#f0dcaa', c1: '#dcc088', c2: '#b8965e', bord: '#5a4028', tete: '#2a2018' },
    noire: { c0: '#3a3638', c1: '#1e1c1e', c2: '#0e0c0e', bord: '#efe8d8', tete: '#121012' },
    cerise: { c0: '#b83a34', c1: '#8a2224', c2: '#561418', bord: '#efe2c0', tete: '#2a1214' },
  };
  const symX = (R) => R.concat(R.slice(1, -1).reverse().map((p) => [-p[0], p[1]]));
  const GBODY = symX([[0, 46], [22, 42], [38, 30], [46, 12], [46, -6], [40, -22], [31, -34], [29, -44], [33, -56], [34, -70], [28, -84], [16, -92], [0, -94]]);
  function corpsGuitare() { return GBODY; }
  function drawCorde(x0, y0, x1, y1, col) { strokePts([[x0, y0], [x1, y1]], col, 0.7); }
  function drawGuitareNue(o) {
    const K = GUI[o.couleur] || GUI.sunburst, c = cx_();
    const corps = corpsGuitare();
    // manche et tête (derrière le corps)
    pc([[-6.5, -80], [6.5, -80], [5.5, -168], [-5.5, -168]], '#5a3a22', () => {
      fillPts([[-5.5, -80], [5.5, -80], [4.6, -168], [-4.6, -168]], '#2a1a12');
      for (let i = 0; i < 11; i++) { const y = -96 - i * 6.6; strokePts([[-5.5, y], [5.5, y]], 'rgba(220,200,150,0.7)', 0.8); }
      for (const y of [-112, -125, -138, -151]) dot(0, y, 1.3, '#efe6cf');
    }, 9101, { drop: false });
    pc([[-6, -168, 1], [6, -168, 1], [12, -178], [13, -196], [8, -201, 1], [-8, -201, 1], [-13, -196], [-12, -178]], K.tete, () => {
      strokePts([[-7, -194], [0, -198], [7, -194]], 'rgba(230,210,160,0.55)', 1.1);
    }, 9102, { drop: false });
    for (const y of [-176, -184, -192]) { for (const sg of [-1, 1]) { fillPts(rect(sg * 12 - (sg > 0 ? 0 : 6), y - 1.6, sg * 12 + (sg > 0 ? 6 : 0), y + 1.6), '#c9b98a'); dot(sg * 19, y, 2.6, '#e8dcc0'); } }
    // caisse bicolore (dégradé radial)
    if (SIL()) fillPts(corps, '#000');
    else {
      pc(corps, K.c1, () => {
        const g = c.createRadialGradient(-4, -10, 6, 0, -12, 64); g.addColorStop(0, K.c0); g.addColorStop(0.55, K.c1); g.addColorStop(1, K.c2);
        c.fillStyle = g; c.fillRect(-60, -90, 120, 150);
        strokePts(corps, K.bord, 1.6, true);
        // ouïes en f (deux traits courbes) — demi-caisse
        for (const sg of [-1, 1]) strokePts(qbez([sg * 21, -54], [sg * 29, -30], [sg * 21, -6], 8), 'rgba(20,10,4,0.85)', 2.2);
        // micros, chevalet, cordier, plaque, boutons
        fillPts(rect(-14, -50, 14, -40), '#e8e2d0'); fillPts(rect(-14, -26, 14, -16), '#e8e2d0');
        strokePts([[-14, -45], [14, -45]], 'rgba(60,50,40,0.6)', 0.8); strokePts([[-14, -21], [14, -21]], 'rgba(60,50,40,0.6)', 0.8);
        fillPts(rect(-12, -6, 12, -2), '#c9b98a');
        fillPts([[-10, 18], [10, 18], [8, 34], [-8, 34]], '#c9b98a'); strokePts([[-8, 26], [8, 26]], 'rgba(80,60,30,0.6)', 1);
        fillPts([[14, -66], [26, -60], [28, -40], [20, -36], [12, -48]], 'rgba(30,20,14,0.55)');
        for (const [x, y] of [[22, 6], [32, -2], [24, 20], [34, 12]]) { dot(x, y, 3.4, '#d8c890'); dot(x - 1, y - 1, 1.2, '#fff6d8'); }
        shade(30, 0, -40, -20, 0.22, [-60, -90, 60, 60]);
      }, 9103);
    }
    // cordes (cordier → sillet)
    if (!SIL()) for (let i = 0; i < 6; i++) { const f = (i - 2.5) / 2.5; drawCorde(f * 7, 22, f * 4, -168, 'rgba(235,228,210,0.85)'); }
  }
  // étui noir (o.etui) : même silhouette agrandie, couvercle à charnière gauche qui s'ouvre (o.ouvert 0..1), doublure rouge, poignée au flanc droit
  function etuiForme() { const a = Math.acos(16 / 44); return ep(0, 4, 58, 58, 18, -0.6, PI + 0.6).concat(ep(0, -58, 44, 44, 8, PI + 0.6, PI + a), [[-16, -214, 1], [16, -214, 1]], ep(0, -58, 44, 44, 8, TAU - a, TAU - 0.6)); }
  function drawGuitare(o) {
    if (!o.etui) { (o.basse ? drawBasseNue : drawGuitareNue)(o); return; }
    const k = clamp(o.ouvert || 0), F = etuiForme(), c = cx_();
    pc([[50, -78], [66, -84], [66, -44], [50, -50]], '#2a2420', () => strokePts([[60, -78], [68, -80]], 'rgba(255,255,255,0.3)', 1), 9110, { drop: false });   // poignée
    pc(F, '#1c1a1c', () => { fillPts(scl(F, 0.9, 0.95), '#7a1e22'); hatch(null, 0.5, 2.6, 0.25, 0.8, '60,0,0'); }, 9111);       // fond + doublure
    if (k > 0.05) { c.save(); c.translate(0, 4); c.scale(0.86, 0.86); c.translate(0, -4); (o.basse ? drawBasseNue : drawGuitareNue)(o); c.restore(); }
    const cs = Math.cos(k * PI * 0.92);                              // couvercle : charnière en x = −58
    c.save(); c.translate(-58, 0); c.scale(cs, 1); c.translate(58, 0);
    pc(F, cs > 0 ? '#232023' : '#8a2428', () => {
      if (cs > 0) { strokePts(scl(F, 0.92, 0.96), 'rgba(255,255,255,0.12)', 1.4, true); strokePts([[-30, -10], [-10, -40], [10, -60]], 'rgba(255,255,255,0.2)', 2);
        for (const [x, y] of [[54, -20], [54, 16], [14, -160]]) { fillPts(rect(x - 5, y - 4, x + 5, y + 4), '#b8a46a'); } }
      else hatch(null, 0.5, 2.6, 0.3, 0.8, '60,0,0');
    }, 9112);
    c.restore();
  }
  // ---- basse violon (caisse en forme de violon, acajou-sunburst, 4 cordes) : même repère ; 84 × 246 (bas y 44, tête y −202)
  function corpsBasse() {
    return symX([[0, 44], [20, 41], [34, 32], [41, 16], [40, 0], [34, -12], [24, -18, 1], [17, -24], [16, -38], [22, -46, 1], [30, -52], [33, -66], [28, -80], [16, -88], [0, -91]]);
  }
  function drawBasseNue(o) {
    const c = cx_(), C = corpsBasse();
    pc([[-5.5, -80], [5.5, -80], [4.5, -172], [-4.5, -172]], '#5a3a22', () => {
      fillPts([[-4.5, -80], [4.5, -80], [3.8, -172], [-3.8, -172]], '#2a1a12');
      for (let i = 0; i < 14; i++) { const y = -90 - i * 6; strokePts([[-4.5, y], [4.5, y]], 'rgba(220,200,150,0.7)', 0.8); }
    }, 9121, { drop: false });
    pc([[-5, -172, 1], [5, -172, 1], [11, -180], [11, -198], [0, -204], [-11, -198], [-11, -180]], '#2a1810', () => strokePts([[-6, -196], [0, -200], [6, -196]], 'rgba(230,210,160,0.5)', 1), 9122, { drop: false });
    for (const y of [-182, -194]) for (const sg of [-1, 1]) { fillPts(rect(sg > 0 ? 11 : -16, y - 1.5, sg > 0 ? 16 : -11, y + 1.5), '#c9b98a'); dot(sg * 18, y, 2.6, '#e8dcc0'); }
    if (SIL()) fillPts(C, '#000');
    else pc(C, '#7a3a18', () => {
      const g = c.createRadialGradient(0, -10, 4, 0, -16, 62); g.addColorStop(0, '#d89a48'); g.addColorStop(0.5, '#9a5022'); g.addColorStop(1, '#3a1a0c');
      c.fillStyle = g; c.fillRect(-50, -100, 100, 150);
      strokePts(C, '#e8dcc0', 1.4, true);
      fillPts(rect(-11, -62, 11, -54), '#e8e2d0'); fillPts(rect(-11, -48, 11, -40), '#e8e2d0');
      fillPts([[-14, -34], [-2, -34], [-4, -16], [-14, -18]], 'rgba(240,230,200,0.7)');     // petite plaque de commandes
      strokePts(scl(C, 0.9, 0.93), 'rgba(30,12,6,0.5)', 1.2, true);
      fillPts(rect(-10, 4, 10, 8), '#c9b98a'); fillPts([[-7, 22], [7, 22], [5, 38], [-5, 38]], '#b8a46a');
      for (const [x, y] of [[22, -4], [26, 10]]) { dot(x, y, 3, '#d8c890'); }
      shade(30, 0, -40, -20, 0.2, [-50, -100, 50, 50]);
    }, 9123);
    if (!SIL()) for (let i = 0; i < 4; i++) { const f = (i - 1.5) / 1.5; drawCorde(f * 5, 28, f * 3, -172, 'rgba(235,228,210,0.85)'); }
  }
  // ---- batterie (posée au sol : (0,0) = milieu sous la grosse caisse) ; ≈ 330 × 262 ; o.frappe 0..1 (cymbale qui tremble), o.t
  function drawBatterie(o) {
    const t = o.t || 0, fr = clamp(o.frappe || 0), c = cx_();
    const pied = (x, y0, y1) => fillPts(bar([x, y0], [x, y1], 3.4), '#9a9ca0');
    // tabouret (à gauche : le batteur assis regarde vers +x)
    pc([[-176, -118], [-124, -118], [-128, -104], [-172, -104]], '#2a2224', () => strokePts([[-170, -114], [-130, -114]], 'rgba(255,255,255,0.25)', 1.2), 9201);
    for (const [a, b] of [[-168, -176], [-132, -124], [-150, -150]]) fillPts(bar([-150, -104], [a + (b - a) * 0.5, 0], 3.4), '#8a8c90');
    // charleston (hi-hat)
    pied(-104, -196, 0); fillPts(bar([-118, 0], [-104, -30], 3), '#8a8c90'); fillPts(bar([-90, 0], [-104, -30], 3), '#8a8c90');
    for (const dy of [0, 6]) pc([[-134, -196 + dy], [-74, -196 + dy], [-82, -201 + dy], [-126, -201 + dy]], '#b8923a', () => strokePts([[-128, -199 + dy], [-80, -199 + dy]], 'rgba(255,240,190,0.6)', 1), 9202 + dy, { drop: false });
    // cymbale (à droite) qui tremble
    const ca = fr * 0.16 * Math.sin(t * 34) * (0.6 + 0.4 * Math.sin(t * 7));
    pied(116, -250, 0); fillPts(bar([96, 0], [116, -40], 3), '#8a8c90'); fillPts(bar([136, 0], [116, -40], 3), '#8a8c90');
    c.save(); c.translate(116, -252); c.rotate(-0.12 + ca);
    pc([[-52, 4], [52, 4], [40, -3], [8, -8], [-8, -8], [-40, -3]], '#c49a3e', () => { strokePts([[-44, 1], [44, 1]], 'rgba(255,240,190,0.7)', 1.2); for (let i = -3; i <= 3; i++) strokePts([[i * 12, -6], [i * 14, 3]], 'rgba(120,80,20,0.35)', 0.8); }, 9204, { drop: false });
    dot(0, -8, 3, '#7a6a3a');
    c.restore();
    if (fr > 0.05 && !SIL()) { for (let i = 0; i < 3; i++) { const r = 64 + i * 14 + 6 * Math.sin(t * 20 + i); strokePts(ep(116, -252, r, r * 0.42, 12, -2.6, -0.5), `rgba(255,236,190,${0.35 * fr * (1 - i * 0.28)})`, 1.4); } }
    // caisse claire (sur pied, à gauche de la grosse caisse)
    pied(-62, -104, 0); fillPts(bar([-78, 0], [-62, -40], 3), '#8a8c90'); fillPts(bar([-46, 0], [-62, -40], 3), '#8a8c90');
    pc(rect(-96, -132, -28, -106), '#c8ccd0', () => { for (let x = -92; x < -28; x += 10) strokePts([[x, -130], [x, -108]], 'rgba(60,60,70,0.5)', 1.4); fillPts(rect(-96, -132, -28, -128), '#efe8d8'); fillPts(rect(-96, -110, -28, -106), '#9a9ca0'); }, 9205);
    // grosse caisse (peau ivoire de face, SANS logo) + cerclage acajou
    pc(ell(16, -66, 66, 66, 30), '#5a2418', () => {
      fillPts(ell(16, -66, 57, 57, 28), '#eee4cc'); strokePts(ep(16, -66, 57, 57, 28, 0, TAU), 'rgba(140,120,90,0.6)', 1.4);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; dot(16 + Math.cos(a) * 62, -66 + Math.sin(a) * 62, 2.4, '#d0c8b8'); }
      shade(60, -100, -30, -20, 0.22, [-60, -140, 90, 10]);
    }, 9206);
    // tom sur la grosse caisse
    fillPts(bar([16, -128], [26, -150], 4), '#8a8c90');
    pc(rect(-4, -184, 58, -148), '#5a2418', () => { fillPts(rect(-4, -184, 58, -178), '#eee4cc'); for (let x = 2; x < 58; x += 12) strokePts([[x, -178], [x, -150]], 'rgba(240,230,210,0.4)', 1.2); }, 9207);
    // pédale
    fillPts([[-6, -2], [20, -2], [16, -14], [-2, -12]], '#4a4c50');
  }
  // ---- ampli à lampes 1962 : (0,0) = milieu du dessous ; 150 × 130 (+ poignée 8) ; o.lueur 0..1 (voyant rouge)
  function drawAmpli(o) {
    const lu = o.lueur == null ? 0.6 : clamp(o.lueur);
    pc([[-75, -124, 0], [-70, -130, 1], [70, -130, 1], [75, -124], [75, -6], [70, 0, 1], [-70, 0, 1], [-75, -6]], '#d8caa2', () => {
      for (let y = -126; y < 0; y += 5) strokePts([[-74, y], [74, y + 1]], 'rgba(150,130,90,0.18)', 0.8);
      fillPts(rect(-64, -96, 64, -10), '#6a4a32');                                                         // toile marron
      for (let x = -64; x < 64; x += 5) strokePts([[x, -96], [x + 8, -10]], 'rgba(40,24,14,0.45)', 0.8);
      for (let x = -56; x < 72; x += 5) strokePts([[x, -96], [x - 8, -10]], 'rgba(150,110,70,0.3)', 0.8);
      strokePts(rect(-64, -96, 64, -10), '#3a2a1a', 1.6, true);
      fillPts(rect(-70, -126, 70, -104), '#3a2e26');                                                       // panneau de commande
      for (let i = 0; i < 6; i++) { dot(-50 + i * 17, -115, 4, '#efe6cf'); dot(-50 + i * 17, -115, 1.4, '#3a2a1a'); }
      dot(56, -115, 3.6, mixA('#5a1a16', '#f04a30', lu)); 
      for (const sg of [-1, 1]) fillPts(rect(sg * 72 - 3, -128, sg * 72 + 3, -2), '#b8a888');
      shade(70, 0, -70, 0, 0.18, [-80, -140, 80, 10]);
    }, 9301);
    pc([[-24, -130], [-20, -140, 1], [20, -140, 1], [24, -130]], '#3a2a1e', null, 9302, { drop: false });   // poignée de cuir
    for (const sg of [-1, 1]) fillPts(rect(sg * 60 - 6, 0, sg * 60 + 6, 5), '#2a2420');
  }
  // ---- contrat : feuille ivoire 150 × 200 centrée en (0,0) ; lignes ondulées, frise, sceau de cire ; o.signe 0..1 (paraphe qui se trace)
  const PARAPHE = (() => { const o = []; for (let i = 0; i <= 26; i++) { const a = PI * 0.8 + i / 26 * TAU * 1.15; o.push([22 + 13 * Math.cos(a), 64 + 9 * Math.sin(a)]); } const s = o[o.length - 1]; for (let i = 1; i <= 24; i++) { const u = i / 24; o.push([s[0] + u * 40, s[1] - 7 * Math.sin(u * PI) + 5 * u]); } o.push([s[0] + 46, s[1] - 6]); return o; })();
  function drawContrat(o) {
    const k = clamp(o.signe || 0);
    pc([[-75, -100, 1], [75, -100, 1], [75, 92], [70, 100, 1], [-75, 100, 1]], '#efe7d2', () => {
      fillPts([[75, 92], [66, 100], [75, 100]], '#cfc4a8');
      strokePts([[-60, -84], [60, -84]], 'rgba(90,70,40,0.75)', 1.6); strokePts([[-60, -79], [60, -79]], 'rgba(90,70,40,0.5)', 0.9);
      strokePts(ep(0, -91, 5, 5, 12, 0, TAU), 'rgba(90,70,40,0.6)', 1); dot(0, -91, 1.8, 'rgba(90,70,40,0.6)');
      for (let r = 0; r < 10; r++) {
        const y = -62 + r * 12, x1 = r === 9 ? 10 : 58 - (r % 4 === 3 ? 30 : 0), pts = [];
        for (let x = -58; x <= x1; x += 4) pts.push([x, y + 1.4 * Math.sin(x * 0.35 + r * 1.7)]);
        strokePts(pts, 'rgba(90,86,80,0.62)', 1.1);
      }
      strokePts([[6, 76], [64, 76]], 'rgba(60,50,40,0.7)', 1);                                           // ligne de signature
      hatch(null, 0.7, 6, 0.06);
    }, 9401);
    // sceau de cire rouge + rubans
    fillPts([[-50, 66], [-58, 94], [-50, 88], [-44, 96]], '#7a1e1a'); fillPts([[-40, 66], [-36, 94], [-30, 86], [-26, 92]], '#8e2620');
    pc(ell(-42, 66, 15, 14, 14), '#9a2a22', () => { strokePts(ep(-42, 66, 10, 9, 12, 0, TAU), 'rgba(60,8,6,0.6)', 1.4); fillPts(ell(-42, 66, 4, 4, 8), 'rgba(60,8,6,0.5)'); strokePts([[-50, 60], [-44, 58]], 'rgba(255,190,170,0.5)', 1.2); }, 9402, { drop: false });
    if (k > 0) { const n = Math.max(2, Math.round(PARAPHE.length * k)); strokePts(PARAPHE.slice(0, n), '#1c2448', 1.8); }
  }
  // ---- stylo plume noir et or : prise (0,0), plume vers +y (pointe en (0,36)), capuchon vers −y
  function drawStylo() {
    pc([[-4, -34, 1], [4, -34, 1], [4.5, 18], [-4.5, 18]], '#141216', () => { strokePts([[-1.5, -30], [-1.5, 14]], 'rgba(255,255,255,0.35)', 1.2); fillPts(rect(-4.5, -12, 4.5, -8), '#c9a24a'); fillPts(rect(-4.5, 14, 4.5, 18), '#c9a24a'); }, 9411, { drop: false });
    fillPts([[-4, 18], [4, 18], [0.6, 36, 1], [-0.6, 36, 1]], '#d8b85a'); strokePts([[0, 22], [0, 34]], 'rgba(60,40,10,0.7)', 0.8);
    fillPts([[3, -32], [6, -30], [6, -14], [4, -14]], '#c9a24a');                                         // agrafe
  }
  // ---- disque 45 tours : centre (0,0), Ø 140 ; o.tourne (rad, ou true = tourne avec t) ; o.pochette (couleur ou true) ; o.sort 0..1 (sort de la pochette vers +x)
  const POCH = ['#7a3a2e', '#3e5a6a', '#b08a3e', '#4f6b4a', '#6b3e57', '#8a6a52', '#2e3550', '#9a4a35', '#5a6a5a', '#a87a4a'];
  function drawPochette(col, trou) {
    pc(rect(-74, -74, 74, 74), col, () => {
      fillPts(rect(-74, -74, 74, -62), 'rgba(255,255,255,0.08)');
      strokePts([[-66, 62], [66, 62]], 'rgba(0,0,0,0.25)', 1.2); hatch(null, 0.8, 5, 0.12);
      if (trou) { fillPts(ell(0, 0, 26, 26, 18), '#141214'); fillPts(ell(0, 0, 22, 22, 18), '#9a2a24'); strokePts(ep(0, 0, 16, 16, 16, 0, TAU), 'rgba(240,210,170,0.6)', 1); dot(0, 0, 3, '#0a0808'); }
    }, 9501);
  }
  function drawVinyle(ang) {
    const c = cx_();
    pc(ell(0, 0, 70, 70, 32), '#141214', () => {
      for (let r = 30; r < 68; r += 3.2) strokePts(ep(0, 0, r, r, 28, 0, TAU), 'rgba(90,86,96,0.35)', 0.7);
      if (!SIL()) { c.save(); c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 69, -0.35, 0.05); c.closePath(); c.fillStyle = 'rgba(230,230,240,0.22)'; c.fill();
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 69, PI - 0.3, PI + 0.02); c.closePath(); c.fillStyle = 'rgba(230,230,240,0.14)'; c.fill(); c.restore(); }
    }, 9502);
    fillPts(ell(0, 0, 23, 23, 20), '#9a2a24');
    strokePts(ep(0, 0, 17, 17, 18, 0, TAU), 'rgba(240,210,170,0.6)', 1);
    if (!SIL()) { c.save(); c.rotate(ang); fillPts([[6, -20], [14, -14], [10, -12]], 'rgba(60,10,8,0.7)'); fillPts(rect(-12, 6, 12, 9), 'rgba(240,210,170,0.45)'); c.restore(); }
    dot(0, 0, 3, '#0a0808');
  }
  function drawDisque(o) {
    const t = o.t || 0, ang = o.tourne === true ? t * 4.7 : (o.tourne || 0), so = clamp(o.sort || 0);
    const col = o.pochette === true ? POCH[0] : o.pochette;
    if (col) { drawPochette(col, so < 0.05); if (so >= 0.05) { const c = cx_(); c.save(); c.beginPath(); c.rect(-74 + 10, -200, 400, 400); c.clip(); c.translate(so * 96, 0); drawVinyle(ang); c.restore(); pc(rect(-74, -74, 74 - 0, 74), col, () => hatch(null, 0.8, 5, 0.12), 9503, { drop: false }); } }
    else drawVinyle(ang);
  }
  // ---- pile de pochettes (posée : (0,0) = milieu du dessous) ; o.n (8) ; 150 × (8·n + 4)
  function drawPile(o) {
    const n = o.n == null ? 8 : o.n, sd = o.seed || 0;
    for (let i = 0; i < n; i++) {
      const y = -i * 8, dx = (hash(i * 7.3 + sd) - 0.5) * 8, col = POCH[(i * 3 + sd) % POCH.length];
      pc([[-75 + dx, y], [75 + dx, y], [75 + dx, y - 8], [-75 + dx, y - 8]], col, () => { strokePts([[-74 + dx, y - 7], [74 + dx, y - 7]], 'rgba(255,255,255,0.25)', 1); strokePts([[-74 + dx, y - 1], [74 + dx, y - 1]], 'rgba(0,0,0,0.3)', 1); }, 9510 + i, { drop: i === 0 });
    }
    const top = -n * 8, dx = (hash((n - 1) * 7.3 + sd) - 0.5) * 8;
    pc([[-75 + dx, top], [75 + dx, top], [62 + dx, top - 12], [-62 + dx, top - 12]], POCH[((n - 1) * 3 + sd) % POCH.length], () => fillPts(ell(dx, top - 6, 18, 4, 12), 'rgba(20,14,16,0.75)'), 9530, { drop: false });
  }
  // ---- baguette de batterie (prise (0,0), pointe vers +y : 86 px) ; pipe courbe (prise = tuyau) ; mallette (prise = poignée)
  function drawBaguette() { pc([[-2.6, -16], [2.6, -16], [2, 66], [-2, 66]], '#d8b880', () => strokePts([[-0.8, -14], [-0.6, 62]], 'rgba(255,255,255,0.4)', 1), 9601, { drop: false }); fillPts(ell(0, 68, 3.4, 4.4, 8), '#e8d0a0'); }
  function drawPipe() {
    fillPts(ribbon(qbez([-30, -2], [-6, 2], [6, 10], 8), 4, 5), '#1e1612');
    pc([[2, 2], [16, 2], [17, -18], [1, -18]], '#6a3a1e', () => { fillPts(rect(1, -18, 17, -14), '#2a1a10'); strokePts([[4, -12], [4, 0]], 'rgba(255,220,180,0.35)', 1.2); }, 9611, { drop: false });
    fillPts(ell(9, -16, 6, 2, 8), '#c84a1a');
  }
  function drawMallette() {
    pc([[-14, 0], [-12, -12, 1], [12, -12, 1], [14, 0]], '#3a2216', null, 9621, { drop: false });
    pc([[-62, 0, 1], [62, 0, 1], [62, 86, 1], [-62, 86, 1]], '#6a3e22', () => { strokePts([[-60, 14], [60, 14]], 'rgba(30,14,6,0.6)', 1.4); for (const x of [-40, 40]) fillPts(rect(x - 6, 4, x + 6, 14), '#c9a24a'); hatch(null, 0.7, 4, 0.18); shade(60, 0, -60, 0, 0.25, [-70, 0, 70, 90]); }, 9622);
  }

  // registre : grip = prise (repère de l'objet) ; p2 = seconde prise ; pts = points nommés ; base = point posé (objet seul) ; rot = rotation d'office quand il est tenu
  const gGrip = (o) => (o.etui ? [66, -64] : o.prise === 'tete' ? [0, -186] : o.prise === 'haut' ? [0, -160] : o.prise === 'caisse' ? [-44, 8] : [0, -128]);
  const GPTS = { manche: [0, -128], haut: [0, -160], tete: [0, -186], caisse: [0, -14], cordes: [0, -10], bas: [0, 46], centre: [0, -24] };
  const OBJ = {
    guitare: { draw: drawGuitare, grip: gGrip, p2: () => [-36, 8], pts: GPTS, base: (o) => (o.etui ? [0, 62] : [0, 46]), rot: (o) => (o.etui ? -PI / 2 : 0) },
    basse: { draw: (o) => drawGuitare(Object.assign({}, o, { basse: true })), grip: (o) => (o.etui ? [66, -64] : o.prise === 'tete' ? [0, -188] : o.prise === 'haut' ? [0, -160] : o.prise === 'caisse' ? [-38, 8] : [0, -126]),
      p2: () => [-34, 8], pts: { manche: [0, -126], haut: [0, -160], tete: [0, -188], caisse: [0, -20], cordes: [0, -16], bas: [0, 44], centre: [0, -24] }, base: (o) => (o.etui ? [0, 62] : [0, 44]), rot: (o) => (o.etui ? -PI / 2 : 0) },
    batterie: { draw: drawBatterie, grip: [0, -66], pts: { siege: [-150, -118], caisseClaire: [-62, -132], cymbale: [116, -252], tom: [27, -184], grosseCaisse: [16, -66] }, base: [0, 0] },
    ampli: { draw: drawAmpli, grip: [0, -140], pts: { assise: [0, -130], haut: [0, -140], centre: [0, -60] }, base: [0, 0] },
    contrat: { draw: drawContrat, grip: (o) => (o.prise === 'haut' ? [0, -94] : o.prise === 'droite' ? [70, 10] : [-70, 10]), p2: (o) => (o.prise === 'droite' ? [-70, 10] : [70, 10]),
      pts: { centre: [0, 0], signature: [8, 66], fin: [62, 62], sceau: [-42, 66], haut: [0, -100], bas: [0, 100] }, base: [0, 0] },
    stylo: { draw: drawStylo, grip: [0, 0], pts: { pointe: [0, 36], bout: [0, -34] }, base: [0, 0], doigts: 'pince' },
    disque: { draw: drawDisque, grip: (o) => (o.pochette ? [-70, 6] : [-64, 6]), p2: () => [70, 6], pts: { centre: [0, 0], bord: [70, 0], haut: [0, -74] }, base: [0, 0] },
    pile: { draw: drawPile, grip: [-74, -20], pts: { haut: (o) => [0, -8 * (o.n == null ? 8 : o.n) - 12] }, base: [0, 0] },
    baguette: { draw: drawBaguette, grip: [0, 0], pts: { pointe: [0, 68] }, base: [0, 0] },
    pipe: { draw: drawPipe, grip: [-18, 0], pts: { foyer: [9, -18], bec: [-30, -2] }, base: [0, 2], doigts: 'pince' },
    mallette: { draw: drawMallette, grip: [0, -7], pts: { centre: [0, 44], bas: [0, 86] }, base: [0, 86] },
  };
  BTL.OBJ = OBJ; BTL.COULEURS_POCHETTE = POCH;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);

  // =====================================================================
  // 3) OBJETS TENUS, IK, ENVELOPPES (principe heldParts de teflon.js / guerremondes.js)
  // =====================================================================
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_(), e = oo.echelle || 1;
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [13, -4], [13, 6], [6, 11], [-6, 11], [-13, 4]];
  const PINCE = [[-8, -5], [0, -8], [9, -4], [10, 3], [3, 7], [-6, 6]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  const fingers = (name) => { const ob = OBJ[name]; return !ob || ob.doigts === 'aucun' ? OFFP : ob.doigts === 'pince' ? PINCE : DOIGTS; };
  // instrument porté contre le corps (joue, serre) : pose._instr = { nom, o, x, y, rot } dans le repère du torse
  function instrDraw(p) {
    const I = p._instr; if (!I) return; const c = cx_();
    c.save(); c.translate(I.x, I.y); c.rotate(I.rot); OBJ[I.nom].draw(Object.assign({ t: p.t || 0 }, I.o || {})); c.restore();
  }
  function instrPt(I, nom) { const ob = OBJ[I.nom], q = ptOf(ob.pts[nom] || [0, 0], I.o || {}), cs = Math.cos(I.rot), sn = Math.sin(I.rot); return [I.x + cs * q[0] - sn * q[1], I.y + sn * q[0] + cs * q[1]]; }
  function heldParts(skin, skinB, seed) {
    return {
      instr: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 9, pts: OFFP, extra: instrDraw },
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fingers(p.tenu) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? fingers(p.tenuB) : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skinB, seed: seed + 5, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point écran d'un point nommé : objet tenu (main avant ; main arrière si arriere) ou instrument porté (joue, serre) ; 'prise' = point tenu
  BTL.pt = function (r, nom, arriere) {
    const q = r.q || {};
    if (!arriere && !has(r.tenu) && q._instr) { const P = instrPt(q._instr, nom); return r.w('torso', P[0], P[1]); }
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1;
    const p = nom === 'prise' ? g : ob.pts[nom] ? ptOf(ob.pts[nom], oo) : null; if (!p) return null;
    return r.w(arriere ? 'objetB' : 'objet', (p[0] - g[0]) * e, (p[1] - g[1]) * e);
  };

  const LA = 96, PG = [4, 96], SH_F = [-2, -146], SH_B = [-10, -146];
  function ikT(S, T, bend) {          // même convention que M.ik (bend 1 = coude sous la ligne épaule–main, plié vers l'avant)
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
    q['_' + arm] = true;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function headPt(q, hx_, hy) { return mp(new DOMMatrix().translate(6, -170).rotate((q.ang.head || 0) * D), [hx_, hy]); }
  function plier(q, th) {                                    // plie le buste aux hanches (th > 0 = vers l'avant), jambes inchangées
    if (!th) return; const h = q._hip || 238;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - h * Math.sin(th); q.dy = (q.dy || 0) + h * (1 - Math.cos(th));
    q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
  }
  function marche(q, k) {                                     // pas sur place (la scène déplace x) ; k 0..1 ; q.cadence (pas/s, 1,5) ; q.traine (pas traînant)
    if (!(k > 0)) return; const t = q.t || 0, tr_ = q.traine ? 0.55 : 1, ph = t * TAU * (q.cadence || (q.traine ? 1.0 : 1.5)), s = Math.sin(ph), A = q.ang, amp = 0.34 * tr_;
    A.legF_up = (A.legF_up || 0) + amp * s * k; A.legB_up = (A.legB_up || 0) - amp * s * k;
    A.legF_lo = (A.legF_lo || 0) + 0.42 * tr_ * Math.max(0, Math.sin(ph - 1.3)) * k; A.legB_lo = (A.legB_lo || 0) + 0.42 * tr_ * Math.max(0, Math.sin(ph + PI - 1.3)) * k;
    A.piedF = (A.piedF || 0) - 0.5 * ((A.legF_up || 0) + (A.legF_lo || 0)) * k; A.piedB = (A.piedB || 0) - 0.5 * ((A.legB_up || 0) + (A.legB_lo || 0)) * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * tr_ * k;
    if (!q._armF && !has(q.tenu)) A.armF_up = (A.armF_up || 0) - 0.16 * s * k * tr_;
    if (!q._armB) A.armB_up = (A.armB_up || 0) + 0.12 * s * k * tr_;
  }
  function assis(q, env, k) {                                 // hanche posée sur `siege` (y écran du dessus de l'assise) ; sinon hauteur de chaise ; jambes pliées
    if (!(k > 0)) return; const def = env.def, A = q.ang, L = def._legs, hip = -def.hipY;
    const seat = env.siege != null ? hip - (env.y - env.siege) / env.s - 14 : hip - (L.sh + 16) + 2;
    q.dy = (q.dy || 0) + seat * k;
    A.legF_up = (A.legF_up || 0) - 1.5 * k; A.legB_up = (A.legB_up || 0) - 1.42 * k;
    A.legF_lo = (A.legF_lo || 0) + 1.5 * k; A.legB_lo = (A.legB_lo || 0) + 1.36 * k; A.piedF = (A.piedF || 0) + 0.02 * k; A.piedB = (A.piedB || 0) + 0.08 * k;
    q._assis = k;
  }
  function vers(S, C, r) { const v = [C[0] - S[0], C[1] - S[1]], l = Math.hypot(v[0], v[1]) || 1, k = Math.min(l, r) / l; return [S[0] + v[0] * k, S[1] + v[1] * k]; }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: Object.assign({}, p.tenuO), tenuBO: Object.assign({}, p.tenuBO) }); }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    const rotF = has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].rot ? OBJ[q.tenu].rot(heldOpts(q.tenu, q.tenuO, q)) : 0;
    const rotB = has(q.tenuB) && OBJ[q.tenuB] && OBJ[q.tenuB].rot ? OBJ[q.tenuB].rot(heldOpts(q.tenuB, q.tenuBO, q)) : 0;
    if (q.droit) A.objet = (A.objet || 0) + rotF - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) + rotB - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    if (q._deux !== true) q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(PG[0], PG[1]).rotate((A.objet || 0) * D).scale(e, e).translate(-g[0], -g[1]);
      const T = mp(Hf, ob.p2(oo)), sol = ikT(SH_B, T, 1);
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = q.handBDeux || 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o);
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.q = q; r.pose = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', 0, 96); r.mainB = r.w('armB_lo', 0, 96);
    return r;
  }
  function wrap(key, poseFn, sDef, post) {
    const mk = (pose, x, y, s, o, draw) => {
      s = s == null ? sDef : s; o = Object.assign({ slot: M.ST.slotF, nom: CH[key].nom }, o || {});
      const dir = o.dir || 1, q = prep(pose), def = CH[key];
      q._hip = -def.hipY;
      const env = { def, x, y, s, dir, siege: q.siege, loc: (Pt) => { const { mats } = M.partMatrices(def, q, x, y, s, dir); const p = new DOMPoint(Pt[0], Pt[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; } };
      if (!draw) env.loc = (Pt) => Pt;
      assis(q, env, ease(clamp(q.assis === true ? 1 : q.assis || 0)));
      poseFn(q, env); marche(q, q.marche === true ? 1 : q.marche); finish(q);
      if (!draw) return q;
      const r = run(def, q, x, y, s, o);
      if (post) post(r, q, env);
      return r;
    };
    const fn = (pose, x, y, s, o) => mk(pose, x, y, s, o, true);
    fn.pose = (pose, x, y, s, o) => mk(pose, x || 0, y || 0, s, o, false);
    return fn;
  }

  // =====================================================================
  // 4) CORPS COMMUN — bras et jambes à articulations rondes (rivet au centre de chaque cercle), têtes, coiffures, vestes
  // =====================================================================
  const R_COUDE = 11.5;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const legC = (len, wt, rk) => ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.5], [rk + 0.5, len - 4]], ep(0, len, rk, rk, 10, 0, PI), [[-rk - 0.5, len - 4], [-wt + 1, len * 0.5]]);
  const FOOT = (ak, len) => ep(0, 0, ak, ak, 8, PI, TAU).concat([[ak + 2, 2], [len * 0.62, 4], [len * 0.92, 8], [len, 14, 1], [-15, 16, 1], [-15, 6]]);
  function legParts(L, seed) {
    const thigh = (back) => ({ parent: 'torso', at: [back ? -L.hx : L.hx, -2], pts: legC(L.th, L.wt, L.kt), base: back ? L.colD : L.col, seed: seed + (back ? 1 : 2), noRivet: !!back,
      paint: () => { if (L.raie) for (let x = -L.wt + 4; x < L.wt; x += 7) strokePts([[x, -10], [x * 0.8, L.th]], L.raie, 1); hatch(back ? null : [[-L.wt, -10], [-4, -10], [-4, L.th], [-L.wt, L.th]], 0.8, 3.8, back ? 0.3 : 0.22); } });
    const shin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, L.th], pts: legC(L.sh, L.kt, L.ak), base: back ? L.colD : L.col, seed: seed + (back ? 3 : 4), noRivet: !!back,
      paint: () => { if (L.raie) for (let x = -L.kt + 4; x < L.kt; x += 7) strokePts([[x, -6], [x * 0.8, L.sh]], L.raie, 1); hatch(back ? null : [[-L.kt, -6], [-3, -6], [-3, L.sh], [-L.kt, L.sh]], 0.8, 3.8, back ? 0.3 : 0.2); } });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, L.sh], pts: FOOT(L.ak + 1, L.fl), base: back ? L.shoeD : L.shoe, seed: seed + (back ? 5 : 6), noRivet: true,
      paint: () => { strokePts([[4, 4], [L.fl * 0.7, 7]], 'rgba(255,255,255,0.25)', 1.2); if (L.botte) fillPts([[-L.ak - 2, -26], [L.ak + 2, -26], [L.ak + 3, 6], [-L.ak - 3, 6]], back ? L.shoeD : L.shoe); } });
    return { legB_up: thigh(true), legB_lo: shin(true), piedB: foot(true), legF_up: thigh(false), legF_lo: shin(false), piedF: foot(false) };
  }
  // ---- têtes de profil (nez vers +x, cou en y 16, crâne jusqu'à y ≈ −99) ; h = { nez, menton, carre, rond, long, mince }
  const NEZ = { droit: [[33, -33], [39, -40, 1], [34, -48]], petit: [[32, -33], [36.5, -39, 1], [33, -46]], long: [[33, -32], [42, -40, 1], [35, -50]],
    busque: [[33, -33], [40, -39, 1], [38.5, -45], [34, -51]], rond: [[33, -33], [37, -34.5], [40, -39], [37, -44], [33, -48]] };
  function headPts(h) {
    h = h || {}; const m = h.menton || 0;
    const jaw = h.carre ? [[12, 16], [13, 2, 1], [24, -3, 1], [31 + m, -8, 1], [32 + m, -17]] : h.rond ? [[12, 16], [16, 4], [25, -4], [30 + m, -10], [31 + m, -17]] : [[12, 16], [14, 4], [22, -4], [29 + m, -9], [31 + m, -16]];
    const front = [[30, -22], [32, -26], [31, -30]].concat(NEZ[h.nez || 'droit'], [[30, -57], [30, -66], [27, -79], [15, -94], [-6, -99], [-26, -90], [-35, -70], [-35, -46], [-28, -26], [-20, -6], [-16, 16]]);
    let P = jaw.concat(front);
    if (h.long) P = P.map((p) => { const y = p[1] > -40 ? p[1] + (p[1] + 40) * h.long : p[1]; return p[2] ? [p[0], y, 1] : [p[0], y]; });
    if (h.mince) P = P.map((p) => (p[0] < 0 ? (p[2] ? [p[0] * (1 - h.mince), p[1], 1] : [p[0] * (1 - h.mince), p[1]]) : p));
    if (h.rond) P = P.map((p) => (p[0] < 0 && p[1] < -20 ? [p[0] * 1.05, p[1] * 1.02] : p));
    return P;
  }
  const yL = (h, y) => (h && h.long && y > -40 ? y + (y + 40) * h.long : y);      // position d'un trait du bas du visage sur une tête allongée
  // ---- coiffures (repère de la tête) — chacune sa silhouette
  const HAIR = {
    // frange brune « Beatles 1962 » : peignée vers l'avant jusqu'au milieu du front, couvre le haut des oreilles, nuque un peu longue
    frange: [[31, -62], [28, -67], [25, -61], [21, -67], [17, -62], [12, -66], [4, -64], [-6, -58], [-14, -50], [-22, -46], [-28, -36], [-30, -22], [-36, -14], [-43, -26], [-47, -46], [-47, -70], [-41, -90], [-28, -104], [-10, -110], [8, -108], [22, -100], [30, -88], [33, -74]],
    // frange plus volumineuse (Harrison)
    frangeVol: [[32, -63], [29, -68], [26, -62], [22, -68], [18, -63], [12, -67], [4, -65], [-6, -59], [-14, -51], [-22, -47], [-28, -38], [-31, -22], [-38, -12], [-47, -24], [-52, -46], [-52, -74], [-45, -98], [-30, -114], [-10, -120], [10, -118], [26, -108], [35, -92], [37, -76]],
    // banane légère, côtés courts en arrière (Best)
    banane: [[28, -76], [34, -86], [36, -96], [28, -106], [12, -112], [-6, -110], [-22, -104], [-34, -92], [-40, -74], [-38, -56], [-32, -46], [-28, -58], [-18, -70], [-2, -78], [14, -80]],
    // court gominé à raie (Tremeloes)
    gomine: [[28, -78], [27, -90], [16, -101], [-4, -105], [-24, -98], [-35, -82], [-38, -62], [-34, -48], [-28, -58], [-20, -70], [-6, -79], [12, -83], [22, -82]],
    // en bataille, longs et ébouriffés (Stones)
    bataille: [[31, -58], [27, -64], [33, -72], [29, -82], [36, -92], [24, -102], [28, -112], [10, -112], [2, -122], [-12, -112], [-28, -118], [-34, -102], [-50, -96], [-46, -80], [-56, -66], [-48, -52], [-54, -34], [-44, -24], [-46, -6], [-34, -12], [-30, -28], [-22, -40], [-14, -50], [-4, -58], [8, -62], [18, -58], [24, -64]],
    // casque blond à frange lourde jusqu'aux sourcils, oreilles couvertes (Stone blond)
    blond: [[34, -57], [30, -61], [26, -56], [21, -61], [16, -57], [8, -59], [-4, -54], [-14, -44], [-24, -34], [-28, -18], [-40, -12], [-48, -28], [-51, -52], [-49, -78], [-40, -98], [-22, -110], [0, -114], [20, -106], [32, -90], [35, -72]],
    // mi-longs, mèche de côté (grand Stone)
    meche: [[30, -60], [24, -70], [12, -74], [0, -70], [-10, -62], [-20, -52], [-28, -40], [-32, -24], [-40, -14], [-50, -28], [-52, -52], [-48, -80], [-36, -102], [-16, -114], [6, -116], [24, -108], [34, -92], [36, -76], [33, -66]],
    // plaqués en arrière avec raie (Rowe)
    plaque: [[27, -80], [25, -92], [14, -101], [-6, -104], [-26, -97], [-36, -80], [-38, -60], [-33, -46], [-27, -56], [-18, -68], [-4, -78], [12, -84], [22, -84]],
    // ondulés coiffés en arrière (Epstein)
    ondule: [[26, -80], [32, -90], [28, -102], [14, -112], [-6, -114], [-26, -107], [-39, -91], [-42, -68], [-37, -50], [-30, -56], [-24, -70], [-10, -82], [6, -88], [18, -86]],
    // courts et soignés, raie de côté (George Martin)
    court: [[28, -80], [29, -92], [20, -102], [0, -106], [-22, -100], [-34, -84], [-37, -64], [-33, -50], [-27, -60], [-18, -72], [-4, -80], [12, -84], [22, -84]],
    // décoiffés, épis (producteur à la gueule de bois)
    epis: [[27, -80], [34, -92], [24, -96], [30, -110], [14, -104], [12, -120], [0, -106], [-10, -122], [-16, -104], [-32, -112], [-30, -96], [-44, -92], [-38, -78], [-44, -62], [-34, -50], [-28, -60], [-18, -72], [-4, -80], [12, -84]],
  };
  function hairPaint(style, colL, colD) {
    const L = colL, Dk = colD;
    if (style === 'frange' || style === 'frangeVol' || style === 'blond') { for (let i = 0; i < 9; i++) { const x0 = -40 + i * 8; strokePts(qbez([x0 - 4, -100 + Math.abs(i - 4) * 2], [x0 + 10, -84], [x0 + 14, -64 + (i % 2) * 3], 8), Dk, 1.1); } strokePts(qbez([-20, -104], [8, -108], [26, -92], 8), L, 2); }
    else if (style === 'gomine' || style === 'plaque' || style === 'court') { strokePts([[14, -100], [6, -86]], Dk, 1.6); for (let i = 0; i < 6; i++) strokePts(qbez([10 - i * 6, -96 + i], [-14 - i * 3, -92 + i * 4], [-32, -66 + i * 3], 8), Dk, 1); strokePts(qbez([-10, -102], [10, -104], [22, -92], 8), L, 2.2); }
    else if (style === 'ondule') { for (let i = 0; i < 4; i++) { const pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push([24 - i * 4 - u * 60, -96 + i * 8 + u * 26 + 3 * Math.sin(u * 9)]); } strokePts(pts, Dk, 1.3); } strokePts(qbez([26, -100], [8, -114], [-14, -110], 8), L, 2); }
    else { for (let i = 0; i < 10; i++) { const a = -0.4 - i * 0.28; strokePts([[-6 + 20 * Math.cos(a), -70 + 22 * Math.sin(a)], [-6 + 44 * Math.cos(a), -70 + 46 * Math.sin(a)]], Dk, 1.2); } strokePts(qbez([-14, -104], [6, -110], [22, -96], 8), L, 2); }
    hatch(null, 1.2, 3.4, 0.18);
  }
  // ---- torse veste de profil : cfg.ventre 0..1, cfg.larg (×), ourlet y 44
  function torsoPts(cfg) {
    const v = cfg.ventre || 0, w = cfg.larg || 1;
    const P = [[-16, -182], [10, -188], [22, -178], [36, -162], [44 + 2 * v, -132], [46 + 10 * v, -98], [44 + 18 * v, -62], [42 + 18 * v, -24], [40 + 11 * v, 10], [40 + 6 * v, 44, 1], [-42, 44, 1], [-44, 10], [-46, -40], [-47, -90], [-48, -122], [-46, -152], [-32, -174]];
    return scl(P, w, 1);
  }
  function mkPerso(cfg) {
    const S = cfg.seed, w = cfg.larg || 1, v = cfg.ventre || 0, fr = (y) => (y < -132 ? 36 + 8 * (y + 162) / 30 : y < -98 ? 44 + 2 * v + (2 + 8 * v) * (-(y + 132) / 34) : y < -62 ? 46 + 10 * v + 8 * v * (-(y + 98) / 36) : 44 + 18 * v) * w;
    const hcfg = cfg.tete || {}, HP = headPts(hcfg), sz = cfg.yeux || 1;
    const L = Object.assign({ th: 116, sh: 108, hx: 6, wt: 17, kt: 12, ak: 9, fl: 46 }, cfg.jambes || {}, { col: cfg.pant, colD: cfg.pantD, shoe: cfg.shoe, shoeD: cfg.shoeD || '#0f0d0d', raie: cfg.raiePant });
    const fore = (parent, back, seed) => {
      const hk = (p) => (back ? p.handB : p.handF) || 'fist';
      return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base: back ? cfg.vesteD : cfg.veste, seed, paint: (p) => {
        if (cfg.rayures) for (let x = -14; x <= 14; x += 7) strokePts([[x, -8], [x, 62]], cfg.rayures, 1);
        fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], back ? cfg.peauD : cfg.peau); X.handPaint(null, hk(p));
        if (cfg.cuir) fillPts([[-15, 58, 1], [15, 58, 1], [15, 77, 1], [-15, 77, 1]], back ? '#121620' : '#181c28');
        else fillPts([[-15, 64, 1], [15, 64, 1], [15, 77, 1], [-15, 77, 1]], back ? mixA(cfg.chemise, '#000000', 0.2) : cfg.chemise);
        if (cfg.cuir) for (const y of [62, 67, 72]) strokePts([[-14, y], [14, y]], 'rgba(255,255,255,0.12)', 1);
        hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.3 : 0.2);
        if (cfg.cuir && !back) strokePts([[7, 4], [9, 50]], 'rgba(200,215,240,0.35)', 2);
      } };
    };
    const up = (at, back, seed) => ({ parent: 'torso', at, pts: armR(LA, cfg.bras || 16), base: back ? cfg.vesteD : cfg.veste, seed, paint: () => {
      if (cfg.rayures) for (let x = -14; x <= 14; x += 7) strokePts([[x, -14], [x, 96]], cfg.rayures, 1);
      if (cfg.cuir && !back) { strokePts([[8, 6], [10, 84]], 'rgba(200,215,240,0.35)', 2.2); strokePts([[-6, 30], [6, 34]], 'rgba(0,0,0,0.35)', 1.2); }
      hatch(back ? null : [[-17, -20], [-3, -20], [-3, 100], [-17, 100]], 0.9, 3.8, back ? 0.3 : 0.24);
    } });
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: torsoPts(cfg), base: cfg.veste, seed: S + 1, paint: (p) => {
        const F = (y) => fr(y);
        if (cfg.rayures) for (let x = -50; x < 70; x += 7) strokePts([[x, -190], [x, 46]], cfg.rayures, 1);
        if (cfg.coupe === 'courte') { fillPts([[-60, 14], [70, 14], [70, 60], [-60, 60]], cfg.pant); fillPts([[-60, 10], [70, 10], [70, 18], [-60, 18]], cfg.cuir ? '#141820' : cfg.vesteD); for (let x = -40; x < 50; x += 6) strokePts([[x, 10], [x, 18]], 'rgba(255,255,255,0.12)', 1); }
        // plastron : chemise / col roulé dans l'échancrure
        const vb = cfg.gilet ? -132 : cfg.col === 'roule' ? -108 : -116;
        const V = [[8, -190], [24, -178], [F(-162) - 2, -162], [F(-140) - 3, -140], [F(vb) - 4, vb], [F(vb) - 14, vb], [F(-140) - 18, -142], [14, -172]];
        fillPts(V, cfg.chemise);
        if (cfg.col === 'roule') for (let y = -180; y < vb; y += 5) strokePts([[F(y) - 24, y], [F(y), y + 1]], 'rgba(120,110,90,0.35)', 1);
        if (cfg.gilet) {                                                                                     // gilet (trois-pièces)
          const G = [[F(-132) - 16, -132], [F(-132) - 1, -132], [F(-98) - 1, -98], [F(-62) - 1, -62], [F(-24) - 1, -24], [F(10) - 2, 10], [F(10) - 30, 14], [F(-60) - 32, -60], [F(-110) - 28, -110]];
          fillPts(G, cfg.gilet); for (const y of [-118, -92, -66, -40, -14]) dot(F(y) - 6, y, 2.2, '#2a1e14');
          const ch = qbez([F(-50) - 4, -50], [F(-40) - 22, -30], [F(-40) - 30, -44], 10); strokePts(ch, '#d7b45a', 1.6);   // chaîne de montre
        }
        if (cfg.cravate) {                                                                                   // cravate
          const top = -176, bot = cfg.gilet ? -134 : vb + 2;
          const T = [[F(top) - 12, top], [F(top) - 4, top + 2], [F(bot) - 4, bot], [F(bot) - 9, bot + 6, 1], [F(bot) - 14, bot]];
          fillPts([[F(top) - 13, top - 2], [F(top) - 3, top - 1], [F(top) - 5, top + 8], [F(top) - 11, top + 8]], cfg.cravate);
          fillPts(T, cfg.cravate);
          if (cfg.motif === 'raye') for (let y = top + 6; y < bot; y += 8) strokePts([[F(y) - 16, y + 4], [F(y) - 2, y - 3]], cfg.cravate2 || '#c9a24a', 2);
          if (cfg.motif === 'pois') for (let y = top + 8; y < bot; y += 8) dot(F(y) - 9 + ((y / 8) % 2 ? 2 : -2), y, 1.4, '#e8e2d0');
          if (cfg.deTravers) fillPts([[F(top) - 4, top + 2], [F(top) + 2, top + 10], [F(top) - 6, top + 14]], cfg.chemise);
        }
        // col de chemise (pointes)
        if (cfg.col !== 'roule') { fillPts([[10, -190], [24, -180], [28, -170], [18, -172], [10, -182]], cfg.chemise); strokePts([[12, -188], [26, -172]], 'rgba(90,80,60,0.45)', 1); }
        // revers et bord de veste
        const lap = cfg.cuir ? 1.6 : 1;
        fillPts([[22, -178], [F(-162) - 2, -162], [F(-140) - 3, -140], [F(vb) - 4, vb], [F(vb) - 16 * lap, vb - 14], [F(-150) - 20 * lap, -150]], cfg.revers || cfg.vesteD);
        strokePts([[22, -178], [F(-150) - 20 * lap, -150], [F(vb) - 16 * lap, vb - 14], [F(vb) - 4, vb]], cfg.vesteL || 'rgba(255,255,255,0.25)', 1.3);
        if (cfg.cuir) { const zp = []; for (let y = vb; y < 12; y += 6) zp.push([F(y) - 5, y]); for (const p of zp) dot(p[0], p[1], 1.3, '#b8bcc4'); strokePts([[-30, -150], [-20, -60], [-28, 4]], 'rgba(200,215,240,0.22)', 3); strokePts([[F(-90) - 20, -98], [F(-40) - 24, -40]], 'rgba(200,215,240,0.3)', 2.2); }
        else if (cfg.croise) { for (const y of [-92, -64, -36]) { dot(F(y) - 6, y, 2.4, cfg.bouton || '#2a2a2e'); dot(F(y) - 26, y, 2.4, cfg.bouton || '#2a2a2e'); } strokePts([[F(vb) - 4, vb], [F(-60) - 2, -60], [F(10) - 2, 12]], 'rgba(0,0,0,0.3)', 1.2); }
        else { for (const y of (cfg.gilet ? [-6] : [-86, -54])) dot(F(y) - 6, y, 2.4, cfg.bouton || '#2a2420'); strokePts([[F(-100) - 2, -100], [F(10) - 2, 12]], 'rgba(0,0,0,0.25)', 1.1); }
        if (cfg.gilet) { fillPts([[F(-130) + 1, -132], [F(-98) + 1, -98], [F(-62) + 1, -62], [F(-24) + 1, -24], [F(10) + 1, 10], [F(10) - 4, 12], [F(-24) - 6, -24], [F(-62) - 8, -62], [F(-100) - 8, -100]], cfg.veste); }
        // poches, pochette
        if (cfg.coupe !== 'courte') { strokePts([[-14, 18], [22, 18]], 'rgba(0,0,0,0.35)', 1.3); }
        strokePts([[-8, -112], [16, -114]], 'rgba(0,0,0,0.3)', 1.2);
        if (cfg.pochette) fillPts([[-6, -114], [2, -124], [8, -116], [14, -122], [16, -114]], cfg.pochette);
        if (cfg.torsePaint) cfg.torsePaint(p, F);
        hatch([[-60, -180], [-14, -180], [-14, 46], [-60, 46]], 0.75, 4.2, 0.28); shade(50 + 18 * v, -40, -50, -40, 0.28, [-64, -200, 80, 50]);
      } },
      armB_up: up([-10, -146], true, S + 2),
      armB_lo: fore('armB_up', true, S + 3),
      head: { parent: 'torso', at: [6, -170], pts: HP, base: cfg.peau, seed: S + 4, noRivet: true, paint: (p) => {
        const f = Object.assign({}, cfg.face, p.face);
        X.earPaint(-8, -44);
        hatch([[-24, -42], [0, -30], [10, -8], [-6, 18], [-34, 4]], 0.6, 3.6, 0.24);
        dot(15, yL(hcfg, -30), 9, `rgba(210,130,110,${cfg.joues || 0.2})`);
        if (hcfg.carre) strokePts([[-6, -22], [-4, yL(hcfg, -4)], [22, yL(hcfg, -6)]], 'rgba(150,100,80,0.5)', 1.6);
        if (hcfg.mince) strokePts(qbez([4, -40], [12, -26], [8, -14], 6), 'rgba(150,100,80,0.4)', 1.3);
        if (cfg.cernes) { strokePts(ep(17, -47, 7, 4, 6, 0.2, PI - 0.2), 'rgba(110,70,90,0.55)', 1.4); }
        if (cfg.barbe) for (let i = 0; i < 26; i++) dot(4 + hash(i * 3.1) * 26, yL(hcfg, -20 + hash(i * 7.7) * 22), 0.9, 'rgba(60,40,30,0.5)');
        if (cfg.rides) { strokePts([[18, -72], [28, -73]], 'rgba(150,100,80,0.4)', 1); strokePts([[24, yL(hcfg, -34)], [26, yL(hcfg, -24)]], 'rgba(150,100,80,0.45)', 1.1); }
        X.eye(f, 17, -52, sz);
        if (p.nezPlisse) { for (const d of [0, 4]) strokePts([[30 + d, -50 + d], [34 + d, -47 + d]], 'rgba(120,70,60,0.7)', 1.1); }
        X.brow(f, 17, cfg.sourcilY || -61, cfg.sourcilCol || 'rgba(40,26,18,0.95)', cfg.sourcilLw || 3);
        if (cfg.levres) { fillPts([[20, yL(hcfg, -28)], [26, yL(hcfg, -31)], [32, yL(hcfg, -28)], [31, yL(hcfg, -22)], [24, yL(hcfg, -21)]], '#a8584c'); }
        X.mouth(f, 28, yL(hcfg, -26));
        if (cfg.headPaint) cfg.headPaint(p, f, hcfg);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: HAIR[cfg.coiffure], base: cfg.cheveux, seed: S + 5, noRivet: true, paint: () => hairPaint(cfg.coiffure, cfg.cheveuxL, cfg.cheveuxD || 'rgba(0,0,0,0.35)') },
      armF_up: up([-2, -146], false, S + 6),
      armF_lo: fore('armF_up', false, S + 7),
      col: { parent: 'torso', at: [0, 0], noRivet: true, base: cfg.chemise, seed: S + 8, pts: cfg.col === 'roule' ? [[-14, -172], [-12, -186], [6, -192], [20, -184], [24, -172], [12, -168]] : OFFP,
        paint: () => { for (let x = -10; x < 24; x += 5) strokePts([[x, -192], [x + 1, -168]], 'rgba(120,110,90,0.4)', 1); } },
    }, legParts(L, S + 20), heldParts(cfg.peau, cfg.peauD, S + 40), cfg.parts || {});
    const extraHead = cfg.extraHead || [];
    const order = ['armB_up', 'armB_lo', 'legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF', 'head', 'cheveux'].concat(extraHead, ['torso', 'col', 'instr', 'objetB', 'doigtsB', 'objet', 'armF_up', 'armF_lo', 'doigts', 'doigtsB2']);
    return { nom: cfg.nom, hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order, _legs: L, _cfg: cfg };
  }
  const EXPR = {
    neutre: {}, sourire: { mouth: 'smile' }, ravi: { mouth: 'smile', eyes: 'half' }, surpris: { brow: 'up', eyes: 'wide', mouth: 'o' }, inquiet: { brow: 'worry', mouth: 'tight' },
    degout: { brow: 'frown', eyes: 'half', mouth: 'tight' }, fache: { brow: 'frown', mouth: 'tight' }, triste: { brow: 'worry', eyes: 'half', mouth: 'tight' }, fier: { brow: 'up', mouth: 'smile' },
  };
  function expr(q, nom) { const e = EXPR[nom]; if (!e) return; for (const k in e) if (q.face[k] == null) q.face[k] = e[k]; }

  // =====================================================================
  // 5) MUSICIENS — BTL.musicien(qui, pose, x, y, s, o) ; un personnage = une tenue
  // =====================================================================
  const PJ = '#ecc9a6', PJD = '#cfa884';
  const pied2poule = (p, F) => { if (SIL()) return; for (let y = -176; y < 44; y += 6) for (let x = -46; x < 46; x += 6) if (((x + y) / 6) % 2 === 0) fillPts(rect(x, y, x + 3, y + 3), 'rgba(200,200,200,0.12)', 0, 0); };
  const froisse = () => { for (const [a, b] of [[[-30, -60], [-6, -40]], [[-20, -10], [10, 6]], [[-36, 20], [-10, 30]], [[0, -90], [20, -70]]]) strokePts([a, b], 'rgba(0,0,0,0.3)', 1.3); };
  const MUS = {
    lennon: { nom: 'lennon', seed: 11000, peau: PJ, peauD: PJD, veste: '#1f2533', vesteD: '#161a26', revers: '#141822', vesteL: 'rgba(190,205,230,0.35)', cuir: true, coupe: 'courte', chemise: '#ece6d6', col: 'ouvert',
      pant: '#2a2a30', pantD: '#1e1e24', shoe: '#121012', jambes: { botte: true }, tete: { long: 0.22, nez: 'droit' }, coiffure: 'frange', cheveux: '#4a3424', cheveuxL: '#7a5a40', sourcilLw: 2.8, instrument: 'guitare', couleur: 'sunburst' },
    mccartney: { nom: 'mccartney', seed: 11100, peau: PJ, peauD: PJD, veste: '#8a6a2e', vesteD: '#6e5422', revers: '#7a5c26', chemise: '#efe9da', col: 'cravate', cravate: '#141214',
      pant: '#3a3630', pantD: '#2c2924', shoe: '#121012', jambes: { botte: true }, tete: { rond: true, nez: 'petit', menton: -1 }, yeux: 1.25, sourcilY: -64, coiffure: 'frange', cheveux: '#3e2a1c', cheveuxL: '#6a4a32', instrument: 'basse' },
    harrison: { nom: 'harrison', seed: 11200, peau: PJ, peauD: PJD, veste: '#4a5e43', vesteD: '#3a4a35', revers: '#3e5038', chemise: '#ece4cc', col: 'roule', larg: 0.9, bras: 15,
      pant: '#2e3230', pantD: '#232624', shoe: '#121012', jambes: { botte: true, wt: 15, kt: 11 }, tete: { mince: 0.07, nez: 'droit', menton: 1 }, sourcilLw: 4.8, coiffure: 'frangeVol', cheveux: '#3a2618', cheveuxL: '#5e4230', instrument: 'guitare', couleur: 'acajou' },
    best: { nom: 'best', seed: 11300, peau: PJ, peauD: PJD, veste: '#6e2a2e', vesteD: '#561f23', revers: '#5a2024', chemise: '#c4c9ce', col: 'ouvert',
      pant: '#2a2626', pantD: '#1e1c1c', shoe: '#121012', tete: { carre: true, menton: 2, nez: 'droit' }, sourcilLw: 3.4, coiffure: 'banane', cheveux: '#1e1612', cheveuxL: '#4a3426', instrument: 'rien' },
    trem1: { nom: 'trem1', seed: 11400, peau: '#efcfae', peauD: '#d2ae8c', veste: '#8aa6b8', vesteD: '#70899a', chemise: '#f2eee2', col: 'cravate', cravate: '#2e3a5a',
      pant: '#4a4e58', pantD: '#3a3e46', shoe: '#1a1614', tete: { rond: true, nez: 'petit' }, coiffure: 'gomine', cheveux: '#3a2a1e', cheveuxL: '#6a5038', face: { mouth: 'smile' }, joues: 0.32, instrument: 'rien' },
    trem2: { nom: 'trem2', seed: 11500, peau: '#e8c4a0', peauD: '#cba27e', veste: '#cbb894', vesteD: '#ad9b78', vesteL: 'rgba(90,70,40,0.35)', chemise: '#f2eee2', col: 'cravate', cravate: '#7a2a2a',
      pant: '#5a4a3a', pantD: '#483a2e', shoe: '#2a1a12', tete: { carre: true, nez: 'droit' }, coiffure: 'gomine', cheveux: '#7a5a36', cheveuxL: '#a88050', face: { mouth: 'smile' }, instrument: 'guitare', couleur: 'blonde' },
    trem3: { nom: 'trem3', seed: 11600, peau: '#efcfae', peauD: '#d2ae8c', veste: '#bdbcb4', vesteD: '#9e9d96', vesteL: 'rgba(60,60,70,0.4)', rayures: 'rgba(60,60,80,0.32)', chemise: '#f2eee2', col: 'cravate', cravate: '#2e2e34',
      pant: '#4a4a50', pantD: '#3a3a40', shoe: '#141214', tete: { nez: 'rond' }, coiffure: 'gomine', cheveux: '#1e1a18', cheveuxL: '#4a4440', face: { mouth: 'smile' }, instrument: 'guitare', couleur: 'blonde' },
    trem4: { nom: 'trem4', seed: 11700, peau: '#e8c4a0', peauD: '#cba27e', veste: '#9a5a36', vesteD: '#7c4a2c', chemise: '#f2eee2', col: 'cravate', cravate: '#c9a24a',
      pant: '#3e342c', pantD: '#302822', shoe: '#2a1a12', tete: { nez: 'long', long: 0.1 }, coiffure: 'gomine', cheveux: '#a07a48', cheveuxL: '#c8a070', face: { mouth: 'smile' }, instrument: 'guitare', couleur: 'blonde' },
    stone1: { nom: 'stone1', seed: 11800, peau: '#e8c6a6', peauD: '#cba684', veste: '#2e2e30', vesteD: '#222224', revers: '#262628', chemise: '#5a2228', col: 'ouvert', torsePaint: pied2poule,
      pant: '#1e1e22', pantD: '#161618', shoe: '#0e0c0c', jambes: { botte: true, wt: 15, kt: 11 }, larg: 0.92, tete: { mince: 0.08, nez: 'busque' }, coiffure: 'bataille', cheveux: '#141012', cheveuxL: '#3a3030', sourcilLw: 3.2, instrument: 'guitare', couleur: 'noire' },
    stone2: { nom: 'stone2', seed: 11900, peau: '#ecc9a6', peauD: '#cfa884', veste: '#5a5046', vesteD: '#4a4238', revers: '#4e463c', chemise: '#b8c8d8', col: 'cravate', cravate: '#34343a', deTravers: true,
      pant: '#3a3630', pantD: '#2c2924', shoe: '#121012', jambes: { th: 124, sh: 116, wt: 15, kt: 11 }, larg: 0.92, levres: true, tete: { long: 0.12, nez: 'droit' }, coiffure: 'meche', cheveux: '#5a3e28', cheveuxL: '#86603e', instrument: 'guitare', couleur: 'noire' },
    stone3: { nom: 'stone3', seed: 12000, peau: '#f0d0b0', peauD: '#d4b090', veste: '#4e3a52', vesteD: '#3e2e42', revers: '#463448', chemise: '#efeadc', col: 'ouvert',
      pant: '#3a3440', pantD: '#2c2832', shoe: '#121012', jambes: { botte: true }, tete: { rond: true, nez: 'petit' }, coiffure: 'blond', cheveux: '#d8b868', cheveuxL: '#f4dc98', cheveuxD: 'rgba(120,90,30,0.45)', sourcilCol: 'rgba(150,110,50,0.95)', instrument: 'guitare', couleur: 'noire' },
    smith: { nom: 'smith', seed: 12100, peau: '#e6c0a0', peauD: '#c89e7e', veste: '#5e6670', vesteD: '#4a525c', revers: '#545c66', chemise: '#e8e2d4', col: 'cravate', cravate: '#8a4a2a', deTravers: true, torsePaint: froisse,
      pant: '#565e68', pantD: '#464e58', shoe: '#1a1614', tete: { nez: 'rond' }, coiffure: 'epis', cheveux: '#4a3426', cheveuxL: '#6e5038', cernes: true, barbe: true, face: { eyes: 'half' }, instrument: 'rien' },
    martin: { nom: 'martin', seed: 12200, peau: '#ecc8a6', peauD: '#cfa684', veste: '#24305a', vesteD: '#1a2446', revers: '#1e2a50', chemise: '#f4f2ec', col: 'cravate', cravate: '#1a1a22',
      pant: '#24305a', pantD: '#1a2446', shoe: '#0e0c0c', jambes: { th: 126, sh: 118, wt: 16, kt: 11 }, larg: 0.95, tete: { long: 0.14, nez: 'long' }, coiffure: 'court', cheveux: '#a88a5c', cheveuxL: '#d0b07a', rides: true, instrument: 'rien' },
  };
  // geste commun d'écriture (stylo) : la pointe va sur `cible` (écran) ou devant ; griffonne si sk > 0
  function ecrire(q, env, k, sk) {
    if (!(k > 0)) return; const t = q.t || 0;
    if (q.tenu == null) q.tenu = 'stylo';
    const T = q.cible ? env.loc(q.cible) : [150, -36], sw = sk * (10 * Math.sin(t * 7.5) + 4 * Math.sin(t * 19)), sv = sk * 3 * Math.sin(t * 15);
    armTo(q, 'armF', vers(SH_F, [T[0] + 12 + sw, T[1] - 34 + sv], 188), k); q.ang.objet = (q.ang.objet || 0) + 0.35;
    q.ang.head = (q.ang.head || 0) + 0.16 * k; if (!q.face.eyes) q.face.eyes = 'half';
  }
  function repos(q) {                                          // bras au repos, légèrement pliés vers l'avant (jamais en arrière)
    const A = q.ang;
    if (!q._armF && !has(q.tenu)) { A.armF_up = (A.armF_up || 0) - 0.06; A.armF_lo = (A.armF_lo || 0) - 0.14; }
    if (!q._armB && !has(q.tenuB)) { A.armB_up = (A.armB_up || 0) - 0.04; A.armB_lo = (A.armB_lo || 0) - 0.1; }
  }
  function mainsAssis(q, k) { if (!(k > 0)) return; if (!q._armF && !has(q.tenu)) { armTo(q, 'armF', [92, -22], k); q.handF = q.handF || 'open'; } if (!q._armB && !has(q.tenuB)) { armTo(q, 'armB', [70, -26], k); q.handB = q.handB || 'open'; } }
  function musPose(cfg) {
    const hc = cfg.tete || {};
    return function (q, env) {
      const A = q.ang, f = q.face, t = q.t || 0, kk = (v) => ease(clamp(v === true ? 1 : v || 0));
      expr(q, q.expr);
      const jo = kk(q.joue), po = kk(q.porte), at = kk(q.attend), ji = kk(q.joie), ch = kk(q.chuchote), ba = kk(q.baguettes), fo = kk(q.front), te = kk(q.tend), si = kk(q.signe);
      const inst = q.instrument || cfg.instrument, coul = q.couleur || cfg.couleur;
      if (jo > 0 && has(inst)) {                                  // joue : instrument contre le ventre, manche vers l'avant-haut
        const I = (q._instr = { nom: inst, o: { couleur: coul }, x: 52, y: -30, rot: 1.05 });
        const st = Math.sin(t * TAU * 2.2), C = instrPt(I, 'cordes'), Mn = instrPt(I, 'manche');
        armTo(q, 'armF', [C[0] + 2, C[1] - 4 + 9 * st * jo], jo);
        armTo(q, 'armB', [Mn[0] + 5 * Math.sin(t * 1.3), Mn[1] + 2], jo);
        q.handF = 'fist'; q.handB = 'fist'; q._deux = true; A.head = (A.head || 0) + 0.07 * jo;
        if (q.respire !== false) A.head += 0.03 * Math.sin(t * TAU * 1.1) * jo;
      }
      if (po > 0 && has(inst) && q.tenu == null) {                 // porte : instrument tenu par le manche, le long du corps (ou son étui par la poignée)
        q.tenu = inst; q.tenuO = Object.assign({ couleur: coul }, q.etui ? { etui: true, ouvert: q.ouvert || 0 } : {}, q.tenuO);
        blend(q, 'armF_up', q.etui ? 0.02 : -0.1, po); blend(q, 'armF_lo', q.etui ? -0.04 : -0.14, po); q._armF = true;
        if (!q.etui) { A.objet = (A.objet || 0) + 0.38; blend(q, 'armF_up', -0.2, po); }
      }
      if (at > 0) {                                                // attend : menton dans la main
        plier(q, 0.16 * at); A.head = (A.head || 0) + 0.1 * at;
        const Cn = headPt(q, 25, yL(hc, -1)); armTo(q, 'armF', [Cn[0] + 1, Cn[1] + 13], at); q.handF = 'fist';
        if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'tight';
      }
      if (ji > 0) {                                                // joie : bras en V, menton levé
        armTo(q, 'armF', [150, -300], ji); armTo(q, 'armB', [84, -330], ji); q.handF = 'open'; q.handB = 'open';
        A.head = (A.head || 0) - 0.24 * ji; q.dy = (q.dy || 0) - Math.abs(Math.sin(t * TAU * 1.6)) * 10 * ji;
        if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'up';
      }
      if (ch > 0) {                                                // chuchote : main ouverte près de la bouche, tournée vers l'autre
        plier(q, 0.07 * ch); A.head = (A.head || 0) + 0.06 * ch;
        const Mo = headPt(q, 30, yL(hc, -26)); armTo(q, 'armF', [Mo[0] + 30, Mo[1] + 22], ch); q.handF = 'open';
        if (!f.mouth) f.mouth = 'o'; if (!f.brow) f.brow = 'up'; if (!f.eyes) f.eyes = 'half';
      }
      if (ba > 0) {                                                // baguettes : bat la mesure sur `cible` (écran) ou devant lui
        if (q.tenu == null) q.tenu = 'baguette'; if (q.tenuB == null) q.tenuB = 'baguette';
        const T = q.cible ? env.loc(q.cible) : [150, -40], w = Math.sin(t * TAU * (q.tempo || 2)), bF = Math.max(0, w), bB = Math.max(0, -w);
        armTo(q, 'armF', vers(SH_F, [T[0] - 52, T[1] - 40 - 30 * bF], 186), ba); armTo(q, 'armB', vers(SH_B, [T[0] - 64, T[1] - 46 - 30 * bB], 186), ba);
        A.objet = (A.objet || 0) - 1.0 - 0.4 * bF; A.objetB = (A.objetB || 0) - 1.0 - 0.4 * bB;
        if (!f.mouth) f.mouth = 'smile';
      }
      if (fo > 0) {                                                // front : main sur le front (gueule de bois)
        plier(q, 0.05 * fo); A.head = (A.head || 0) + 0.18 * fo;
        const Fh = headPt(q, 30, -72); armTo(q, 'armF', [Fh[0] + 6, Fh[1] + 8], fo); q.handF = 'open';
        if (!f.eyes) f.eyes = 'closed'; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
      }
      if (te > 0) { armTo(q, 'armF', [162, -116], te); q.handF = 'open'; plier(q, 0.04 * te); if (!f.mouth) f.mouth = 'smile'; }   // tend : main ouverte (poignée de main)
      ecrire(q, env, si, q.griffonne == null ? 1 : q.griffonne);
      if (q.traine == null && cfg.nom === 'smith') q.traine = true;
      if (cfg.nom === 'smith' && (q.marche || q.assis)) { plier(q, q.assis ? -0.06 : 0.07); A.head = (A.head || 0) + 0.1; }
      mainsAssis(q, q._assis || 0); repos(q);
      if (q.respire !== false) q.dy = (q.dy || 0) + 1.2 * Math.sin(t * 1.9 + cfg.seed);
    };
  }
  const MW = {};
  for (const k in MUS) { CH['btl_' + k] = mkPerso(MUS[k]); MW[k] = wrap('btl_' + k, musPose(MUS[k]), 0.86); }
  BTL.musicien = (qui, pose, x, y, s, o) => MW[qui](pose, x, y, s, o);
  BTL.musicien.pose = (qui, pose, x, y, s, o) => MW[qui].pose(pose, x, y, s, o);
  BTL.MUSICIENS = Object.keys(MUS);

  // =====================================================================
  // 6) DICK ROWE — ≈ 40 ans, trois-pièces brun tabac, cravate rayée bordeaux et or, grosses lunettes noires, cheveux plaqués à raie, pipe
  // =====================================================================
  const ROWE = { nom: 'rowe', seed: 13000, peau: '#e6bf9c', peauD: '#c89c7a', veste: '#5a4330', vesteD: '#46341f', revers: '#4c3826', vesteL: 'rgba(230,200,150,0.3)', gilet: '#6a5038',
    chemise: '#efe8d6', col: 'cravate', cravate: '#7a2230', motif: 'raye', cravate2: '#c9a24a', ventre: 0.55, larg: 1.04, pant: '#5a4330', pantD: '#46341f', shoe: '#2a1a12', shoeD: '#1a100a',
    tete: { nez: 'busque', menton: 0.5 }, coiffure: 'plaque', cheveux: '#3a2a1e', cheveuxL: '#6a5038', rides: true, sourcilLw: 3.4, sourcilY: -63,
    extraHead: ['lunettes', 'pipeT'],
    headPaint: () => strokePts([[6, -8], [18, -4], [26, -6]], 'rgba(150,100,80,0.4)', 1.3),
    parts: {
      lunettes: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 13050, pts: OFFP, extra: (p) => {
        const c = cx_(), lr = p.lunettesRot || 0, ld = p.lunettesDy || 0;
        c.save(); c.translate(18, -52 + ld); c.rotate(lr);
        const fr = [[-12, -9], [11, -9], [13, -6], [13, 6], [10, 9], [-10, 9], [-13, 6], [-13, -6]];
        if (!SIL()) fillPts(fr, 'rgba(200,225,235,0.22)', 0, 0);
        strokePts(fr.concat([fr[0]]), '#121012', 4.6); strokePts([[-8, -6], [-2, -7]], 'rgba(255,255,255,0.6)', 1.3);
        strokePts([[13, -2], [18, 0]], '#121012', 3.2); strokePts([[-13, -4], [-28, 4]], '#121012', 3.6);
        c.restore();
      } },
      pipeT: { parent: 'head', at: [30, -24], noRivet: true, base: '#000', seed: 13051, pts: OFFP, extra: (p) => { if (p.pipe !== 'bouche') return; const c = cx_(); c.save(); c.translate(30, 2); drawPipe(); c.restore(); } },
    },
  };
  CH.btlRowe = mkPerso(ROWE);
  BTL.rowe = wrap('btlRowe', function (q, env) {
    const A = q.ang, f = q.face, t = q.t || 0, kk = (v) => ease(clamp(v === true ? 1 : v || 0));
    expr(q, q.expr);
    if (q.pipe == null) q.pipe = 'bouche';
    const pi = kk(q.pince), je = clamp(q.jette || 0), si = kk(q.signe), se = kk(q.serre), ra = kk(q.raide), ec = kk(q.ecoute), te = kk(q.tend);
    const obj = q.objet || 'guitare';
    if ((pi > 0 || je > 0) && q.tenu == null) { q.tenu = obj; q.tenuO = Object.assign({ prise: 'haut', couleur: 'sunburst' }, q.tenuO); }
    if (pi > 0 && je <= 0) {                                   // pince : bras tendu, la guitare au bout des doigts, nez plissé, tête en arrière
      armTo(q, 'armF', [176, -124], pi); A.head = (A.head || 0) - 0.07 * pi; q.tilt = (q.tilt || 0) - 0.03 * pi;
      if (!f.brow) f.brow = 'frown'; if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'tight'; q.nezPlisse = pi > 0.4;
    }
    if (je > 0) {                                              // jette : 0 → 0,45 lève, 0,45 → 0,8 lance vers l'avant, ≥ 0,8 lâche (r.lache, r.lachePt)
      const a = sm(0, 0.45, je), b = sm(0.45, 0.8, je);
      armTo(q, 'armF', [lerp(lerp(176, 96, a), 192, b), lerp(lerp(-124, -296, a), -168, b)], 1);
      A.objet = (A.objet || 0) + 1.7 * b; A.head = (A.head || 0) - 0.08;
      if (je >= 0.8 && q.lache !== false) { q._lache = true; q.tenu = 'rien'; q.handF = 'open'; }
      if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight'; q.nezPlisse = true;
    }
    ecrire(q, env, si, q.griffonne == null ? 1 : q.griffonne);
    if (se > 0) {                                              // serre : guitare contre la poitrine, à deux mains, yeux fermés
      const I = (q._instr = { nom: obj === 'basse' ? 'basse' : 'guitare', o: { couleur: q.couleur || 'sunburst' }, x: 58, y: -84, rot: 0.55 });
      const cs = Math.cos(I.rot), sn = Math.sin(I.rot), L_ = (px, py) => [I.x + cs * px - sn * py, I.y + sn * px + cs * py];
      armTo(q, 'armF', L_(30, 6), se); armTo(q, 'armB', L_(0, -110), se); q.handF = 'open'; q.handB = 'fist'; q._deux = true;
      A.head = (A.head || 0) + 0.14 * se; if (!f.eyes) f.eyes = 'closed'; if (!f.mouth) f.mouth = 'smile'; if (!f.brow) f.brow = 'worry';
    }
    if (ra > 0) {                                              // raide : figé, lunettes de travers
      if (!q._armF) { A.armF_up = (A.armF_up || 0) + 0.04 * ra; A.armF_lo = (A.armF_lo || 0) - 0.02; q._armF = true; }
      if (!q._armB) { A.armB_up = (A.armB_up || 0) - 0.02; A.armB_lo = (A.armB_lo || 0) - 0.02; q._armB = true; }
      A.head = (A.head || 0) - 0.05 * ra; q.lunettesRot = (q.lunettesRot || 0) + 0.3 * ra; q.lunettesDy = (q.lunettesDy || 0) + 4 * ra;
      q.dx = (q.dx || 0) + Math.sin(t * 47) * 0.9 * ra;
      if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'o';
    }
    if (ec > 0) {                                              // écoute : penché vers la radio (cible = bouton ou cadran, écran)
      plier(q, 0.2 * ec); A.head = (A.head || 0) + 0.12 * ec;
      if (!q._armF && !has(q.tenu)) { const T = q.cible ? vers(SH_F, env.loc(q.cible), 186) : [128, -40]; armTo(q, 'armF', T, ec); q.handF = q.cible ? 'fist' : 'open'; }
      if (!f.brow) f.brow = 'up';
    }
    if (te > 0) { armTo(q, 'armF', [164, -114], te); q.handF = 'open'; plier(q, 0.04 * te); if (!f.mouth) f.mouth = 'smile'; }
    if (q.pipe === 'main' && q.tenuB == null && !q._armB) { q.tenuB = 'pipe'; armTo(q, 'armB', [74, -76], 1); }
    mainsAssis(q, q._assis || 0); repos(q);
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.3 * Math.sin(t * 1.7);
  }, 0.9, function (r, q) {
    if (q._lache) { r.lache = true; r.lachePt = r.main; }
    if (q.pipe === 'bouche' && !SIL()) {
      const c = cx_(), m = c.getTransform(), k = Math.hypot(m.a, m.b), P = r.w('pipeT', 39, -16), sc = Math.hypot(r.mats.head.a, r.mats.head.b);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); M.fumee(q.t || 0, { x: P[0], y: P[1], s: 0.28 * sc, n: 4, haut: 150, vent: 14, col: '#e8e2d8', a: 0.45, seed: 61 }); c.restore();
    }
  });

  // =====================================================================
  // 7) BRIAN EPSTEIN — ≈ 27 ans, croisé gris perle, pochette blanche, cravate à pois bleu nuit, cheveux châtains ondulés en arrière
  // =====================================================================
  const EPS = { nom: 'epstein', seed: 14000, peau: '#ecc8a4', peauD: '#cfa682', veste: '#9aa0a6', vesteD: '#7e848a', revers: '#8a9096', vesteL: 'rgba(255,255,255,0.4)', croise: true, bouton: '#4a4e56',
    chemise: '#f4f2ec', col: 'cravate', cravate: '#1e2a44', motif: 'pois', pochette: '#fbfaf4', pant: '#9aa0a6', pantD: '#7e848a', shoe: '#141214',
    tete: { nez: 'droit', long: 0.08 }, coiffure: 'ondule', cheveux: '#6a4a30', cheveuxL: '#9a7550', sourcilLw: 2, sourcilCol: 'rgba(80,52,32,0.95)' };
  CH.btlEpstein = mkPerso(EPS);
  BTL.epstein = wrap('btlEpstein', function (q, env) {
    const A = q.ang, f = q.face, t = q.t || 0, kk = (v) => ease(clamp(v === true ? 1 : v || 0));
    expr(q, q.expr);
    const pl = kk(q.plaide), ab = kk(q.abattu), te = kk(q.tend);
    if (q.mallette && q.tenuB == null) { q.tenuB = 'mallette'; A.armB_up = (A.armB_up || 0) - 0.06; q._armB = true; }
    if (pl > 0) {                                              // plaide : deux mains ouvertes en avant, paumes vers le haut
      plier(q, 0.05 * pl); armTo(q, 'armF', [138, -84], pl); if (!has(q.tenuB)) { armTo(q, 'armB', [116, -94], pl); q.handB = 'open'; } q.handF = 'open';
      A.head = (A.head || 0) - 0.05 * pl; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'o';
    }
    if (ab > 0) {                                              // abattu : épaules basses, tête baissée
      q.dy = (q.dy || 0) + 5 * ab; plier(q, 0.07 * ab); A.head = (A.head || 0) + 0.4 * ab;
      if (!q._armF && !has(q.tenu)) { A.armF_up = (A.armF_up || 0) + 0.05 * ab; q._armF = true; }
      if (!f.eyes) f.eyes = 'half'; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'tight';
    }
    if (te > 0) {                                              // tend : tend le disque d'essai (dans sa pochette)
      if (q.tenu == null) { q.tenu = 'disque'; q.tenuO = Object.assign({ pochette: '#7a3a2e' }, q.tenuO); }
      armTo(q, 'armF', [160, -118], te); if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'smile';
    }
    mainsAssis(q, q._assis || 0); repos(q);
    if (q.respire !== false) q.dy = (q.dy || 0) + 1.1 * Math.sin(t * 1.8 + 1);
  }, 0.9);
  BTL.BEND = { tous: { armF: [1, 1], armB: [1, 1] } };

  // =====================================================================
  // 8) ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name]; o = o || {};
    if (o.ang != null && o.rot == null) o = Object.assign({}, o, { rot: o.ang });
    return M.puppet(accDef('o_' + name, (oo) => { const b = ptOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(Object.assign({ t: oo.t || 0 }, oo)); c.restore(); }),
      { o, tilt: o.rot || 0 }, x, y, s == null ? 1 : s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * (s || 1), floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  for (const n of ['guitare', 'basse', 'batterie', 'ampli', 'contrat', 'stylo', 'disque', 'baguette', 'pipe', 'mallette']) BTL[n] = (x, y, s, o) => acc(n, x, y, s, o);
  BTL.pileDisques = (x, y, s, o) => acc('pile', x, y, s, o);
  function locPt(px, py, x, y, s, o) { o = o || {}; const d = o.dir || 1, r = o.rot != null ? o.rot : o.ang || 0, X0 = px * s * d, Y0 = py * s; return [x + X0 * Math.cos(r) - Y0 * Math.sin(r) * d, y + X0 * Math.sin(r) * d + Y0 * Math.cos(r)]; }
  BTL.accPt = function (name, x, y, s, o, nom) { if (name === 'pileDisques') name = 'pile'; const ob = OBJ[name], oo = o || {}, b = ptOf(ob.base, oo), q = ob.pts[nom] ? ptOf(ob.pts[nom], oo) : nom === 'prise' ? gripOf(ob, oo) : [0, 0]; return locPt(q[0] - b[0], q[1] - b[1], x, y, s == null ? 1 : s, oo); };

  // =====================================================================
  // 9) BUREAU DE DICK ROWE (Decca, Londres, 1962) — BTL.bureau(t, up, o) AVANT M.drawFloor(), BTL.bureauSol(t, up, o) juste APRÈS (avant les marionnettes)
  // =====================================================================
  const W = M.W, FL = 1420;                                       // FL = sol des meubles du premier plan
  const BU = {
    fenetre: { x0: 360, x1: 660, y0: 290, y1: 790 }, porte: { x0: 770, x1: 940, y0: 735 }, pendule: { x: 862, y: 330, s: 0.8 },
    cadres: [[150, 330], [245, 330], [692, 330]], etagere: { x0: 128, x1: 322, y0: 520 }, platine: { x: 225, y: 1000 }, portemanteau: { x: 714 },
    plateau: { x0: 420, x1: 760, y: 1240 }, siege: { x: 345, y: 1318 }, radio: { x: 612, y: 1240 }, telephone: { x: 468, y: 1240 }, cendrier: { x: 530, y: 1240 }, lampe: { x: 730, y: 1240 },
    corbeille: { x: 862, y: FL, bord: 1270 }, plante: { x: 190, y: FL }, rebord: 790, cheminees: [[404, 636], [462, 664], [578, 628], [632, 652]], bigben: { x: 516, y: 640 },
  };
  BTL.BUREAU = BU;
  function cadreFen(x0, y0, x1, y1, e, col, seed) {
    pc(rect(x0 - e, y0 - e, x1 + e, y0), col, () => strokePts([[x0 - e + 3, y0 - e + 3], [x1 + e - 3, y0 - e + 3]], 'rgba(255,230,190,0.3)', 1.4), seed, { drop: false });
    pc(rect(x0 - e, y1, x1 + e, y1 + e), col, null, seed + 1);
    pc(rect(x0 - e, y0, x0, y1), col, () => strokePts([[x0 - 3, y0], [x0 - 3, y1]], 'rgba(0,0,0,0.35)', 1.4), seed + 2, { drop: false });
    pc(rect(x1, y0, x1 + e, y1), col, () => strokePts([[x1 + 3, y0], [x1 + 3, y1]], 'rgba(255,230,190,0.25)', 1.4), seed + 3, { drop: false });
  }
  function makeBuVue() {                                          // toits de Londres (transparent au-dessus des toits ; le ciel est peint en direct)
    return M.pre(W, BACK + 40, (c) => {
      const F = BU.fenetre, B = BU.bigben;
      // Big Ben lointain, en silhouette bleutée (cadran sans chiffre)
      pc([[B.x - 18, B.y, 1], [B.x - 18, 476, 1], [B.x - 23, 470, 1], [B.x - 23, 418, 1], [B.x - 18, 412, 1], [B.x - 18, 398, 1], [B.x - 13, 392, 1], [B.x - 7, 368, 1], [B.x, 346, 1], [B.x + 7, 368, 1], [B.x + 13, 392, 1], [B.x + 18, 398, 1], [B.x + 18, 412, 1], [B.x + 23, 418, 1], [B.x + 23, 470, 1], [B.x + 18, 476, 1], [B.x + 18, B.y, 1]], '#76808c', () => {
        fillPts(ell(B.x, 443, 13, 13, 16), '#e8e4d4'); strokePts(ep(B.x, 443, 13, 13, 16, 0, TAU), '#7a8490', 1.4); strokePts([[B.x, 443], [B.x + 1, 434]], '#5a6470', 1.4); strokePts([[B.x, 443], [B.x + 7, 446]], '#5a6470', 1.4);
        for (const dx of [-12, -4, 4, 12]) strokePts([[B.x + dx, 400], [B.x + dx, 410]], 'rgba(60,70,80,0.6)', 1.6);
        for (let y = 480; y < B.y; y += 16) strokePts([[B.x - 12, y], [B.x + 12, y]], 'rgba(90,100,110,0.4)', 1);
      }, 9701, { drop: false });
      // toits lointains puis proches
      const toits = (y0, col, colF, sd) => { const pts = [[F.x0 - 30, BU.rebord]]; for (let x = F.x0 - 30, i = 0; x <= F.x1 + 30; x += 34, i++) { const h = y0 + 30 * hash(i * 3.7 + sd); pts.push([x, h + 14, 1], [x + 10, h, 1], [x + 24, h, 1], [x + 34, h + 14, 1]); } pts.push([F.x1 + 30, BU.rebord]); fillPts(pts, col, sd, 0.4); for (let x = F.x0; x < F.x1; x += 22) fillPts(rect(x, y0 + 46 + 20 * hash(x + sd), x + 8, y0 + 58 + 20 * hash(x + sd)), colF, 0, 0); };
      toits(560, '#8e98a2', 'rgba(255,236,190,0.35)', 3); toits(640, '#6e7680', 'rgba(255,236,190,0.45)', 11);
      fillPts([[F.x0 - 30, 700], [F.x0 + 80, 680], [F.x0 + 150, 700], [F.x0 + 210, 668], [F.x1 + 30, 690], [F.x1 + 30, BU.rebord], [F.x0 - 30, BU.rebord]], '#5a5e64', 31, 0.4);
      for (const [x, y] of BU.cheminees) { pc(rect(x - 11, y, x + 11, y + 46), '#7a5446', () => { for (let yy = y + 6; yy < y + 46; yy += 7) strokePts([[x - 11, yy], [x + 11, yy]], 'rgba(40,20,14,0.35)', 1); }, 9710 + x, { drop: false }); for (const dx of [-5, 5]) fillPts(rect(x + dx - 3.5, y - 10, x + dx + 3.5, y), '#a0644a'); }
      pc(rect(F.x0 - 24, BU.rebord - 14, F.x1 + 24, BU.rebord + 4), '#9a948a', () => strokePts([[F.x0 - 24, BU.rebord - 12], [F.x1 + 24, BU.rebord - 12]], 'rgba(255,255,255,0.4)', 1.4), 9720, { drop: false });   // rebord extérieur
    });
  }
  function disqueOr(x, y, seed) {                                 // disque d'or encadré, sans inscription
    pc(rect(x, y, x + 80, y + 100), '#3a2614', () => {
      fillPts(rect(x + 7, y + 7, x + 73, y + 93), '#2a1e26');
      fillPts(ell(x + 40, y + 44, 26, 26, 22), '#c9a24a'); for (let r = 10; r < 26; r += 3) strokePts(ep(x + 40, y + 44, r, r, 18, 0, TAU), 'rgba(120,90,30,0.45)', 0.7);
      fillPts(ell(x + 40, y + 44, 8, 8, 12), '#8a2a24'); strokePts([[x + 26, y + 30], [x + 36, y + 24]], 'rgba(255,240,190,0.8)', 2);
      fillPts(rect(x + 26, y + 78, x + 54, y + 86), '#b8923a');
    }, seed);
  }
  function makeBuMur() {                                          // mur, fenêtre à petits carreaux (trou), lambris, cadres, étagère de disques, porte vitrée, portemanteau
    return M.pre(W, BACK + 40, (c) => {
      const B = BACK, F = BU.fenetre, P = BU.porte;
      pc(rect(-10, 120, W + 10, B + 30), '#7a7250', () => {
        for (let x = -10; x < W + 10; x += 36) { fillPts(rect(x, 120, x + 16, B), 'rgba(140,130,90,0.35)', 0, 0); strokePts([[x + 18, 120], [x + 18, B]], 'rgba(60,50,30,0.18)', 1); }
        for (let y = 200; y < 1100; y += 72) for (let x = 6; x < W; x += 72) fillPts([[x, y - 6], [x + 5, y], [x, y + 6], [x - 5, y]], 'rgba(200,180,120,0.25)', 0, 0);
        hatch(null, 0.8, 7, 0.07, 1, undefined, [-10, 120, W + 10, B]);
        const sh = c.createLinearGradient(0, 120, 0, 520); sh.addColorStop(0, 'rgba(40,30,20,0.4)'); sh.addColorStop(1, 'rgba(40,30,20,0)'); c.fillStyle = sh; c.fillRect(-10, 120, W + 20, 400);
      }, 9801, { drop: false });
      pc(rect(-10, 120, W + 10, 168), '#5a4a34', () => strokePts([[0, 164], [W, 164]], 'rgba(255,230,180,0.35)', 1.6), 9802, { drop: false });   // corniche
      pc(rect(-10, 268, W + 10, 278), '#5a3424', null, 9803, { drop: false });                                                                    // cimaise
      pc(rect(-10, 1100, W + 10, B + 30), '#5a3424', () => {                                                                                       // lambris d'acajou
        for (let x = 20; x < W; x += 130) { fillPts(rect(x, 1130, x + 104, B - 24), 'rgba(40,18,10,0.35)'); strokePts([[x, 1130], [x + 104, 1130], [x + 104, B - 24]], 'rgba(255,210,170,0.18)', 1.3); }
        strokePts([[0, 1104], [W, 1104]], 'rgba(255,220,180,0.4)', 2);
      }, 9804, { drop: false });
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.fillRect(P.x0 + 22, P.y0 + 26, P.x1 - P.x0 - 44, 330); c.restore();
      // fenêtre : cadre + petits bois (4 × 6 carreaux) + appui intérieur
      const Fc = '#e2dccb';
      cadreFen(F.x0, F.y0, F.x1, F.y1, 16, Fc, 9810);
      for (let k = 1; k < 4; k++) { const x = F.x0 + (F.x1 - F.x0) * k / 4; pc(rect(x - 3, F.y0, x + 3, F.y1), Fc, null, 9820 + k, { drop: false }); }
      for (let k = 1; k < 6; k++) { const y = F.y0 + (F.y1 - F.y0) * k / 6; pc(rect(F.x0, y - 3, F.x1, y + 3), Fc, null, 9830 + k, { drop: false }); }
      pc(rect(F.x0 - 30, F.y1 + 14, F.x1 + 30, F.y1 + 32), '#5a3424', () => strokePts([[F.x0 - 30, F.y1 + 16], [F.x1 + 30, F.y1 + 16]], 'rgba(255,220,180,0.4)', 1.4), 9840);
      pc(rect(F.x0 - 10, F.y1 + 60, F.x1 + 10, F.y1 + 150), '#8a8478', () => { for (let x = F.x0; x < F.x1; x += 14) { strokePts([[x, F.y1 + 64], [x, F.y1 + 146]], 'rgba(255,255,255,0.25)', 2); strokePts([[x + 6, F.y1 + 64], [x + 6, F.y1 + 146]], 'rgba(0,0,0,0.25)', 2); } }, 9841);   // radiateur
      // disques d'or encadrés
      BU.cadres.forEach(([x, y], i) => disqueOr(x, y, 9850 + i));
      // étagère de disques (tranches colorées, deux pochettes de face, compartiment de la platine)
      const E = BU.etagere;
      pc(rect(E.x0, E.y0, E.x1, B), '#4a2a1a', () => {
        const rows = [[E.y0 + 16, 640], [656, 800], [816, 960], [1130, 1270], [1286, B - 16]];
        rows.forEach(([y0, y1], r) => {
          fillPts(rect(E.x0 + 12, y0, E.x1 - 12, y1), '#24140c');
          let x = E.x0 + 16, i = 0;
          while (x < E.x1 - 18) { const wv = 3 + 2 * hash(r * 31 + i), hv = (y1 - y0) * (hash(r * 7 + i * 3) > 0.85 ? 0.8 : 0.92), col = POCH[(r * 5 + i) % POCH.length];
            if (r === 1 && i === 6) { fillPts(rect(x, y1 - 112, x + 112 > E.x1 - 16 ? E.x1 - 16 : x + 112, y1), POCH[3]); fillPts(ell(x + 50, y1 - 56, 16, 16, 12), 'rgba(20,14,16,0.7)'); break; }
            fillPts(rect(x, y1 - hv, x + wv, y1), col, 0, 0); strokePts([[x + 1, y1 - hv + 2], [x + 1, y1 - 2]], 'rgba(255,255,255,0.15)', 1); x += wv + 1; i++; }
        });
        fillPts(rect(E.x0 + 12, 976, E.x1 - 12, 1114), '#24140c');
        for (const y of [640, 800, 960, 1114, 1270]) { fillPts(rect(E.x0 + 8, y, E.x1 - 8, y + 16), '#5a3424'); strokePts([[E.x0 + 8, y + 2], [E.x1 - 8, y + 2]], 'rgba(255,220,180,0.35)', 1.2); }
        shade(E.x1, 0, E.x0, 0, 0.25, [E.x0, E.y0, E.x1, B]);
      }, 9860);
      pc(rect(E.x0 - 8, E.y0 - 14, E.x1 + 8, E.y0 + 4), '#5a3424', null, 9861);
      // platine tourne-disque (socle ; le disque tourne en direct)
      const Pl = BU.platine;
      pc(rect(Pl.x - 82, Pl.y + 70, Pl.x + 82, Pl.y + 112), '#8a6a4a', () => { fillPts(rect(Pl.x - 76, Pl.y + 76, Pl.x + 76, Pl.y + 86), '#2a2420'); dot(Pl.x + 60, Pl.y + 98, 4, '#efe6cf'); dot(Pl.x + 44, Pl.y + 98, 4, '#efe6cf'); }, 9862);
      // porte vitrée dépolie (dormant ; le battant est dessiné en direct)
      pc(rect(P.x0 - 14, P.y0 - 14, P.x1 + 14, B), '#4a2a1a', () => fillPts(rect(P.x0, P.y0, P.x1, B), '#1e1612'), 9870);
      // portemanteau : chapeau mou et parapluie
      const Pm = BU.portemanteau.x;
      pc(rect(Pm - 6, 860, Pm + 6, B), '#3a2414', () => strokePts([[Pm - 2, 862], [Pm - 2, B]], 'rgba(255,220,180,0.3)', 1.2), 9880);
      for (const sg of [-1, 1]) fillPts(bar([Pm, 880], [Pm + sg * 30, 866], 5), '#3a2414');
      pc([[Pm - 40, B], [Pm, B - 60], [Pm + 40, B]], '#3a2414', null, 9881);
      pc([[Pm + 6, 880], [Pm + 14, 900], [Pm + 22, 1080], [Pm + 2, 1120], [Pm - 6, 1084], [Pm, 900]], '#1e1e22', () => { strokePts([[Pm + 6, 900], [Pm + 4, 1100]], 'rgba(255,255,255,0.15)', 1.2); }, 9882);   // parapluie
      fillPts(ribbon(qbez([Pm + 2, 1118], [Pm - 6, 1150], [Pm + 10, 1150], 6), 4, 4), '#5a3424');
      pc([[Pm - 46, 878], [Pm + 46, 878], [Pm + 40, 870], [Pm + 26, 866], [Pm + 22, 836], [Pm - 22, 836], [Pm - 26, 866], [Pm - 40, 870]], '#5a4632', () => { fillPts(rect(Pm - 23, 856, Pm + 23, 864), '#2a1e14'); strokePts([[-6 + Pm, 840], [6 + Pm, 846]], 'rgba(0,0,0,0.4)', 1.3); }, 9883);   // chapeau mou
    });
  }
  function makeBuPorte() {                                       // battant de la porte (verre dépoli, bois, poignée) : repère = charnière gauche, bas
    const P = BU.porte, w = P.x1 - P.x0, h = BACK - P.y0;
    const cv = M.cutFlat(w + 20, h + 20, 0, h + 10, () => {
      pc(rect(0, -h, w, 0), '#6a3a22', () => {
        fillPts(rect(22, -h + 26, w - 22, -h + 356), '#c8cfc8'); for (let i = 0; i < 40; i++) dot(24 + hash(i) * (w - 48), -h + 30 + hash(i * 3.3) * 320, 6 + 6 * hash(i * 1.7), 'rgba(255,255,255,0.18)');
        strokePts([[30, -h + 40], [80, -h + 300]], 'rgba(255,255,255,0.35)', 4);
        strokePts(rect(22, -h + 26, w - 22, -h + 356), '#3a2010', 3, true);
        fillPts(rect(22, -h + 384, w - 22, -40), 'rgba(40,18,10,0.3)'); strokePts([[22, -h + 384], [w - 22, -h + 384]], 'rgba(255,220,180,0.25)', 1.2);
        shade(w, 0, 0, 0, 0.2, [0, -h, w, 0]);
      }, 9890);
      pc(ell(w - 18, -300, 7, 7, 10), '#c9a24a', null, 9891, { drop: false });
    });
    return cv;
  }
  function makeBuSol() {                                          // premier plan : bureau d'acajou, fauteuil de cuir, pot de la plante, corbeille (fond)
    return M.pre(W, M.H, (c) => {
      const Pt = BU.plateau, Si = BU.siege;
      // fauteuil de cuir (dossier à gauche : Rowe assis regarde vers +x)
      pc([[Si.x - 76, Si.y + 4], [Si.x - 92, 1100], [Si.x - 84, 1076, 1], [Si.x - 44, 1076, 1], [Si.x - 34, 1100], [Si.x - 38, Si.y - 6]], '#5a2a1e', () => { for (const y of [1110, 1160, 1210, 1260]) for (const dx of [-72, -54]) dot(Si.x + dx, y, 3, '#2e140c'); strokePts([[Si.x - 86, 1096], [Si.x - 74, Si.y]], 'rgba(255,200,170,0.25)', 2); hatch(null, 0.7, 4, 0.2); }, 9901);
      pc([[Si.x - 44, Si.y - 62], [Si.x + 36, Si.y - 62], [Si.x + 48, Si.y - 54], [Si.x + 46, Si.y - 40], [Si.x + 34, Si.y - 36], [Si.x + 34, Si.y], [Si.x + 20, Si.y], [Si.x + 20, Si.y - 40], [Si.x - 44, Si.y - 42]], '#6a3222', () => { strokePts([[Si.x - 40, Si.y - 58], [Si.x + 40, Si.y - 58]], 'rgba(255,200,170,0.35)', 2); fillPts(ell(Si.x + 38, Si.y - 50, 7, 7, 10), 'rgba(40,14,8,0.4)'); }, 9905);
      pc([[Si.x - 74, Si.y - 6], [Si.x + 56, Si.y - 6, 1], [Si.x + 62, Si.y + 10], [Si.x + 56, Si.y + 30, 1], [Si.x - 74, Si.y + 30, 1]], '#6a3222', () => { strokePts([[Si.x - 70, Si.y - 2], [Si.x + 54, Si.y - 2]], 'rgba(255,200,170,0.35)', 2); for (let x = Si.x - 50; x < Si.x + 50; x += 30) dot(x, Si.y + 18, 2.4, '#2e140c'); }, 9902);
      for (const x of [Si.x - 66, Si.x + 46]) pc([[x, Si.y + 30], [x + 14, Si.y + 30], [x + 12, FL], [x + 2, FL]], '#2e1a10', null, 9903 + x, { drop: false });
      // bureau d'acajou : plateau, caisson à tiroirs à droite, pied à gauche
      pc(rect(Pt.x1 - 170, Pt.y + 22, Pt.x1 - 6, FL), '#5a2a18', () => {
        for (let k = 0; k < 4; k++) { const y = Pt.y + 34 + k * 40; fillPts(rect(Pt.x1 - 160, y, Pt.x1 - 16, y + 32), 'rgba(30,10,4,0.3)'); strokePts([[Pt.x1 - 160, y], [Pt.x1 - 16, y]], 'rgba(255,210,170,0.3)', 1.2); fillPts(rect(Pt.x1 - 100, y + 13, Pt.x1 - 76, y + 19), '#c9a24a'); }
        for (let i = 0; i < 8; i++) strokePts(qbez([Pt.x1 - 170, Pt.y + 40 + i * 22], [Pt.x1 - 90, Pt.y + 30 + i * 22], [Pt.x1, Pt.y + 46 + i * 22], 8), 'rgba(30,10,4,0.18)', 1);
        shade(Pt.x1, 0, Pt.x1 - 170, 0, 0.3, [Pt.x1 - 180, Pt.y, Pt.x1, FL]);
      }, 9910);
      pc(rect(Pt.x0 + 8, Pt.y + 22, Pt.x0 + 30, FL), '#4a2214', null, 9911);
      pc(rect(Pt.x0 + 8, Pt.y + 22, Pt.x1 - 170, Pt.y + 56), '#5a2a18', () => { fillPts(rect(Pt.x0 + 120, Pt.y + 34, Pt.x0 + 150, Pt.y + 40), '#c9a24a'); }, 9912);
      pc(rect(Pt.x0, Pt.y, Pt.x1, Pt.y + 24), '#6e3420', () => { strokePts([[Pt.x0, Pt.y + 3], [Pt.x1, Pt.y + 3]], 'rgba(255,220,180,0.5)', 2); for (let i = 0; i < 6; i++) strokePts([[Pt.x0 + 20 + i * 50, Pt.y + 10], [Pt.x0 + 60 + i * 50, Pt.y + 14]], 'rgba(30,10,4,0.25)', 1); }, 9913);
      // sous-main de cuir vert + papiers + porte-plume
      pc([[Pt.x0 + 40, Pt.y], [Pt.x0 + 170, Pt.y], [Pt.x0 + 164, Pt.y - 5], [Pt.x0 + 46, Pt.y - 5]], '#3e5a40', null, 9914, { drop: false });
      // pot de la plante
      const Pl = BU.plante;
      pc([[Pl.x - 40, Pl.y - 92], [Pl.x + 40, Pl.y - 92], [Pl.x + 30, Pl.y], [Pl.x - 30, Pl.y]], '#9a5a3a', () => { fillPts(rect(Pl.x - 44, Pl.y - 100, Pl.x + 44, Pl.y - 84), '#8a4a2e'); for (let x = Pl.x - 30; x < Pl.x + 30; x += 12) strokePts([[x, Pl.y - 80], [x + 2, Pl.y - 6]], 'rgba(60,24,12,0.25)', 1); }, 9920);
    });
  }
  function osier(x0, y0, x1, y1, bas) {                          // vannerie : trame croisée
    for (let y = y0; y < y1; y += 9) strokePts([[lerp(x0, bas[0], (y - y0) / (y1 - y0)), y], [lerp(x1, bas[1], (y - y0) / (y1 - y0)), y]], 'rgba(90,60,20,0.55)', 2);
    for (let i = 0; i <= 12; i++) { const u = i / 12; strokePts([[lerp(x0, x1, u), y0], [lerp(bas[0], bas[1], u), y1]], 'rgba(60,40,14,0.5)', 1.6); }
  }
  // feuilles de la plante (en direct : balancement + feuille qui tombe)
  const FEUILLES = (() => { const o = []; for (let i = 0; i < 11; i++) o.push({ a: -1.5 + (i - 5) * 0.24 + 0.08 * Math.sin(i * 3.1), L: 120 + 70 * hash(i * 1.3), ph: i * 0.9 }); return o; })();
  function drawPlante(t, o) {
    const g = M.tg(t), Pl = BU.plante, by = Pl.y - 96, fe = clamp(o.feuille || 0);
    FEUILLES.forEach((F, i) => {
      if (i === 3 && fe > 0) return;
      const a = F.a + 0.03 * Math.sin(g * 0.9 + F.ph), ex = Pl.x + Math.cos(a) * F.L, ey = by + Math.sin(a) * F.L, mx = Pl.x + Math.cos(a) * F.L * 0.5, my = by + Math.sin(a) * F.L * 0.5;
      strokePts(qbez([Pl.x, by], [mx - 6, my], [ex, ey], 8), '#3e5a30', 2.4);
      const nx = -Math.sin(a), ny = Math.cos(a), lf = [[mx, my], [mx + Math.cos(a) * 20 + nx * 16, my + Math.sin(a) * 20 + ny * 16], [ex, ey], [mx + Math.cos(a) * 20 - nx * 16, my + Math.sin(a) * 20 - ny * 16]];
      pc(lf, i % 2 ? '#4f6b3a' : '#5a7a44', () => strokePts([[mx, my], [ex, ey]], 'rgba(220,240,180,0.4)', 1), 9930 + i, { drop: false });
    });
    if (fe > 0) {                                                 // P5 : une feuille se détache et tombe en planant
      const u = fe, x = lerp(Pl.x - 50, Pl.x + 40, u) + 26 * Math.sin(u * 9), y = lerp(by - 120, Pl.y - 4, Math.pow(u, 1.2)), r = 0.6 * Math.sin(u * 11) + (u > 0.95 ? 1.3 : 0);
      const c = cx_(); c.save(); c.translate(x, y); c.rotate(r);
      pc([[-24, 0], [0, -11], [24, 0], [0, 11]], '#6a8a48', () => strokePts([[-24, 0], [24, 0]], 'rgba(220,240,180,0.5)', 1), 9945, { drop: false }); c.restore();
    }
  }
  function drawTelephone(t, o) {                                  // téléphone noir de bakélite ; o.sonne 0..1 (il tremble, arcs muets)
    const T = BU.telephone, k = clamp(o.sonne || 0), g = t, dx = k * 2.6 * Math.sin(g * 70), hop = -k * Math.abs(Math.sin(g * 34)) * 5, c = cx_();
    c.save(); c.translate(T.x + dx, T.y);
    pc([[-34, 0], [34, 0], [26, -34], [-26, -34]], '#141214', () => { fillPts(ell(0, -16, 12, 9, 14), '#e8e2d0'); fillPts(ell(0, -16, 4, 3, 8), '#141214'); strokePts([[-22, -30], [20, -30]], 'rgba(255,255,255,0.25)', 1.3); }, 9950);
    c.translate(0, hop); pc([[-40, -40], [-32, -50], [32, -50], [40, -40], [30, -36], [22, -42], [-22, -42], [-30, -36]], '#1a181a', () => strokePts([[-30, -47], [30, -47]], 'rgba(255,255,255,0.3)', 1.4), 9951);
    c.restore();
    if (k > 0.05 && !SIL()) for (let i = 0; i < 3; i++) { const r = 34 + i * 12; for (const sg of [-1, 1]) strokePts(ep(T.x + dx, T.y - 40, r, r, 8, sg > 0 ? -0.9 : PI + 0.9 - 0.9, sg > 0 ? -0.1 : PI + 0.1 - 0.9 + 0.8), `rgba(240,230,200,${0.6 * k * (1 - i * 0.25)})`, 1.6); }
  }
  function drawLampe(t) {                                         // lampe de banquier : laiton, abat-jour de verre vert, halo
    const L = BU.lampe, g = M.tg(t), c = cx_(), fl = 0.94 + 0.04 * Math.sin(g * 2.3) + 0.02 * Math.sin(g * 7.1);
    if (!SIL()) { const gl = c.createRadialGradient(L.x, L.y - 92, 10, L.x, L.y - 60, 220); gl.addColorStop(0, `rgba(255,232,170,${0.4 * fl})`); gl.addColorStop(1, 'rgba(255,220,150,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(L.x - 230, L.y - 320, 460, 420); c.restore(); }
    pc([[L.x - 30, L.y], [L.x + 30, L.y], [L.x + 22, L.y - 10], [L.x - 22, L.y - 10]], '#b8923a', () => strokePts([[L.x - 24, L.y - 7], [L.x + 24, L.y - 7]], 'rgba(255,240,190,0.6)', 1.2), 9960);
    fillPts(bar([L.x, L.y - 10], [L.x, L.y - 80], 6), '#b8923a');
    pc([[L.x - 44, L.y - 74], [L.x + 44, L.y - 74], [L.x + 34, L.y - 100], [L.x - 34, L.y - 100]], '#2e6a4a', () => { strokePts([[L.x - 30, L.y - 96], [L.x + 10, L.y - 98]], 'rgba(200,255,220,0.5)', 2); fillPts(rect(L.x - 44, L.y - 78, L.x + 44, L.y - 74), '#c9a24a'); }, 9961);
    if (!SIL()) fillPts([[L.x - 40, L.y - 74], [L.x + 40, L.y - 74], [L.x + 30, L.y - 68], [L.x - 30, L.y - 68]], `rgba(255,240,190,${0.8 * fl})`, 0, 0);
  }
  function drawCendrier(t, o) {                                   // cendrier de verre avec une pipe qui fume
    const Cd = BU.cendrier;
    if (o.cendrier !== 'vide') { const c = cx_(); c.save(); c.translate(Cd.x + 4, Cd.y - 10); c.rotate(-0.15); drawPipe(); c.restore(); M.fumee(t, { x: Cd.x + 13, y: Cd.y - 30, s: 0.28, n: 5, haut: 170, vent: 16, col: '#e8e2d8', a: 0.5, seed: 71 }); }
    pc([[Cd.x - 24, Cd.y], [Cd.x + 24, Cd.y], [Cd.x + 28, Cd.y - 10], [Cd.x - 28, Cd.y - 10]], 'rgba(170,200,200,0.85)', () => { strokePts([[Cd.x - 24, Cd.y - 8], [Cd.x + 24, Cd.y - 8]], 'rgba(255,255,255,0.7)', 1.4); fillPts(rect(Cd.x - 18, Cd.y - 9, Cd.x + 18, Cd.y - 5), 'rgba(90,90,90,0.5)'); }, 9965);
  }
  function drawPlatine(t) {                                       // disque qui tourne sur la platine de l'étagère
    const Pl = BU.platine, g = M.tg(t), c = cx_();
    c.save(); c.translate(Pl.x - 6, Pl.y + 68); c.scale(1, 0.22); drawVinyle(g * 4.7); c.restore();
    fillPts(bar([Pl.x + 66, Pl.y + 62], [Pl.x + 30, Pl.y + 72], 3), '#c8ccd0'); dot(Pl.x + 66, Pl.y + 62, 5, '#8a8c90');
  }
  function drawPigeon(t, k) {                                     // P3 : un pigeon se pose sur le rebord extérieur
    if (!(k > 0)) return;
    const a = sm(0, 0.6, k), x = lerp(720, 600, a), y = lerp(560, BU.rebord - 14, a) - 40 * Math.sin(a * PI) * (1 - a), vol = k < 0.6, g = M.tg(t), c = cx_();
    c.save(); c.beginPath(); c.rect(BU.fenetre.x0, BU.fenetre.y0, BU.fenetre.x1 - BU.fenetre.x0, BU.rebord - BU.fenetre.y0 + 2); c.clip();
    c.translate(x, y); c.scale(-1, 1);
    const bob = vol ? 0 : 3 * Math.max(0, Math.sin(g * 5));
    pc([[-22, 0], [-8, -14], [14, -12], [24, -4], [16, 6], [-10, 8], [-30, 10]], '#8a8e98', () => { fillPts([[-6, -6], [12, -8], [16, 0], [-2, 2]], '#6a6e78'); }, 9970, { drop: false });
    pc(ell(20 + bob, -18 + bob * 0.3, 8, 7, 10), '#7a7e88', () => { dot(23 + bob, -20, 1.6, '#e8a030'); fillPts([[27 + bob, -17], [33 + bob, -16], [27 + bob, -14]], '#d8b880'); fillPts([[12, -12], [18, -12], [16, -6]], '#5a8a7a'); }, 9971, { drop: false });
    if (vol) { const w = Math.sin(g * 22) * 0.9; pc([[-6, -8], [10, -10], [-4 - 20 * Math.cos(w), -10 - 30 * Math.sin(w + 1)]], '#9a9ea8', null, 9972, { drop: false }); }
    else { strokePts([[2, 8], [0, 14]], '#c86a5a', 1.4); strokePts([[8, 8], [8, 14]], '#c86a5a', 1.4); }
    c.restore();
  }
  // corbeille d'osier ; o.corbeille 0..1 : la guitare y tombe (0 → 0,6) puis s'y pose, manche qui dépasse vers le haut-gauche
  function drawCorbeille(t, o) {
    const Co = BU.corbeille, k = clamp(o.corbeille || 0), c = cx_(), x0 = Co.x - 66, x1 = Co.x + 66, yb = Co.bord, bas = [Co.x - 52, Co.x + 52];
    fillPts([[x0, yb], [x1, yb], [x1 - 6, yb + 12], [x0 + 6, yb + 12]], '#2a1c0c');                 // intérieur sombre
    if (k > 0) {
      const a = sm(0, 0.6, k), w = k > 0.6 ? 0.08 * Math.sin((k - 0.6) * 30) * (1 - k) * 2.5 : 0;
      c.save(); c.translate(Co.x + 8, lerp(Co.bord - 260, Co.bord + 92, a)); c.rotate(lerp(-1.1, -0.42, a) + w); drawGuitareNue({ couleur: o.corbeilleCouleur || 'sunburst' }); c.restore();
    }
    pc([[x0, yb], [x1, yb], [bas[1], Co.y], [bas[0], Co.y]], '#b08a4a', () => { osier(x0, yb + 6, x1, Co.y, bas); shade(x1, 0, x0, 0, 0.25, [x0, yb, x1, Co.y]); }, 9980);
    pc(rect(x0 - 4, yb - 4, x1 + 4, yb + 8), '#9a743a', () => { for (let x = x0; x < x1; x += 8) strokePts([[x, yb - 2], [x + 6, yb + 6]], 'rgba(60,40,14,0.5)', 1.4); }, 9981, { drop: false });
  }
  // BTL.bureau(t, up, o) : toile de fond + plan intermédiaire, à dessiner en premier (avant M.drawFloor) ; up (px) monte tout le décor.
  //   o.pigeon 0..1 (P3 : il arrive et se pose sur le rebord à 0,6) ; o.porte 0..1 (le battant s'ouvre vers la salle) ; o.lumiere 0..1 (défaut 1)
  BTL.bureau = function (t, up, o) {
    o = o || {}; up = up || 0; const K = BTL.K, c = cx_(), g = M.tg(t), F = BU.fenetre, P = BU.porte;
    c.save(); c.translate(0, -up);
    // ciel gris qui avance + nuages, Big Ben et toits, fumées des cheminées, pigeon
    c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    const sk = c.createLinearGradient(0, F.y0, 0, F.y1); sk.addColorStop(0, '#9aa4ae'); sk.addColorStop(0.6, '#c4c8c4'); sk.addColorStop(1, '#ddd8c8'); c.fillStyle = sk; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    M.nuages(t, { y0: 320, y1: 470, n: 5, vit: 18, s: 0.7, seed: 23, col: '#e4e0d6', brume: 0.2 });
    c.drawImage(K.buVue, 0, 0);
    for (const [x, y] of BU.cheminees) M.fumee(t, { x: x - 4, y: y - 12, s: 0.24, n: 4, haut: 170, vent: 36, col: '#8a8680', a: 0.55, seed: x });
    drawPigeon(t, o.pigeon || 0);
    c.restore();
    c.drawImage(K.buMur, 0, 0);
    // couloir derrière la porte + battant qui s'ouvre
    const po = clamp(o.porte || 0);
    fillPts(rect(P.x0, P.y0, P.x1, BACK), '#2a2018');
    if (po > 0 && !SIL()) { const gl = c.createLinearGradient(P.x0, 0, P.x1, 0); gl.addColorStop(0, 'rgba(255,230,180,0.35)'); gl.addColorStop(1, 'rgba(255,230,180,0.05)'); c.fillStyle = gl; c.fillRect(P.x0, P.y0, P.x1 - P.x0, BACK - P.y0); }
    c.save(); c.translate(P.x0, BACK); c.scale(Math.cos(po * 1.3) * (1 - 0.15 * po), 1); c.drawImage(K.buPorte, 0, -K.buPorte.height + 10); c.restore();
    // voilages, pendule à balancier, platine qui tourne
    M.voilage(t, { x: F.x0 - 24, y: F.y0 - 20, w: 70, h: F.y1 - F.y0 + 40, cote: 1, amp: 6, col: 'rgba(236,228,206,0.62)' });
    M.voilage(t + 1.7, { x: F.x1 - 46, y: F.y0 - 20, w: 70, h: F.y1 - F.y0 + 40, cote: -1, amp: 6, col: 'rgba(236,228,206,0.62)' });
    M.pendule(t, { x: BU.pendule.x, y: BU.pendule.y, s: BU.pendule.s, per: 2, bois: '#4a2a1a' });
    drawPlatine(t);
    const lu = o.lumiere == null ? 1 : clamp(o.lumiere);
    if (lu < 1 && !SIL()) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(60,48,40,${0.7 * (1 - lu)})`; c.fillRect(0, 0, W, BACK + 40); c.restore(); }
    c.restore();
  };
  // BTL.bureauSol(t, up, o) : premier plan (fauteuil, bureau, téléphone, cendrier + pipe qui fume, lampe verte, corbeille, plante) — juste APRÈS M.drawFloor().
  //   o.corbeille 0..1 (+ o.corbeilleCouleur) ; o.sonne 0..1 (P4 : le téléphone tremble) ; o.feuille 0..1 (P5 : une feuille tombe) ; o.cendrier 'pipe' | 'vide'.
  //   La radio n'est pas dessinée : GDM.radio(BTL.BUREAU.radio.x, BTL.BUREAU.radio.y, 0.85, { t, … }) juste après.
  BTL.bureauSol = function (t, up, o) {
    o = o || {}; up = up || 0; const c = cx_();
    c.save(); c.translate(0, -up);
    c.drawImage(BTL.K.buSol, 0, 0);
    drawLampe(t); drawCendrier(t, o); drawTelephone(t, o);
    drawCorbeille(t, o); drawPlante(t, o);
    c.restore();
  };

  BTL.init = function () {
    if (BTL.K) return BTL.K;
    const K = (BTL.K = {});
    K.buVue = makeBuVue(); K.buMur = makeBuMur(); K.buPorte = makeBuPorte(); K.buSol = makeBuSol();
    return K;
  };
})();
