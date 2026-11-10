// fetelumieres.js — « La Fête des Lumières, née d’une cérémonie ratée » (Lyon 1852 → aujourd’hui), espace M.lyo (LYO) : organisateur, Lyonnaise, lumignon, statue dorée, nuage de pluie, lampions ; décors quai 1852, place 1852, Lyon aujourd’hui. Mode d’emploi : fetelumieres.md.
// Espace M.lyo (alias LYO). Appeler LYO.init() dans S.init. Mode d'emploi complet : persos.md (ne pas lire ce fichier en entier).
// MARIONNETTES : LYO.organisateur(pose,x,y,s,o) · LYO.lyonnaise(pose,x,y,s,o)   (enveloppes ; .pose(p) / .def() pour M.ik)
// ACCESSOIRES  : LYO.lumignon(t,x,y,s,o) · LYO.dansLaMain(r,t,o) · LYO.statue(x,y,s,o) · LYO.nuage(t,x,y,s,o) · LYO.pluie(t,o) · LYO.lampions(t,x0,x1,y,o)
//                LYO.perche / LYO.parapluie / LYO.chapeau / LYO.bougie (x,y,s,o)
// DÉCORS       : LYO.aujourdhui(t,o) + LYO.aujourdhuiSol(t,o) · LYO.quai1852(t,o) + LYO.quai1852Avant(t,o) · LYO.place1852(t,o) + LYO.place1852Sol(t,o)
// REPÈRES      : LYO.FEN (fenêtres de la place), LYO.AUJ, LYO.QUAI, LYO.PLACE. Aucun texte, lettre ni chiffre. Déterministe (hash, M.rng).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, easeOut, smooth, hash } = M;
  const LYO = (M.lyo = {});
  const CH = M.chars, ST = M.ST, W = 1080;
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  function ribbon(line, w0, w1, sharp) {
    const L = [], R = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1 == null ? w0 : w1, i / Math.max(1, line.length - 1)) / 2;
      L.push([line[i][0] - dy * w, line[i][1] + dx * w]); R.push([line[i][0] + dy * w, line[i][1] - dx * w]);
    }
    const o = L.concat(R.reverse()); return sharp ? o.map((p) => [p[0], p[1], 1]) : o;
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const lin = (x0, y0, x1, y1, stops) => { const g = cx_().createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  function glow(x, y, r, col, a) {                                               // lueur additive (dessin brut : jamais dans la passe silhouette)
    if (SIL() || a <= 0.003) return; const c = cx_(), g = c.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.45, `rgba(${col},${a * 0.35})`); g.addColorStop(1, `rgba(${col},0)`);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
  }
  const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
  LYO.geo = { ep, ell, box, rot, ribbon, qbez, rrect, glow };

  // ------------------------------------------------------------ membres (articulations rondes, rivet au centre)
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96), SH_F = [-2, -146], SH_B = [-10, -146];
  const KNEE = 108, ANK = 117, HIPY = -238;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  const HAND_CUP = [[-8, 78], [8, 78], [12, 86], [17, 92], [14, 96], [9, 93], [8, 104], [11, 111], [15, 113], [12, 119], [3, 119], [-5, 114], [-9, 102], [-9, 90]];
  function foreR(kind) {
    if (kind === 'cup') return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[11, 0], [10, 40], [9, 76]], HAND_CUP.slice(2, -1).map((p) => [p[0] * 1.05, p[1]]), [[-9, 86], [-10, 76], [-11, 40]]);
    const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2));
  }
  const thighPts = (th) => [[-19 * th, -12], [17 * th, -14], [22 * th, 20], [20 * th, 70], [17, KNEE - 6]].concat(ep(0, KNEE, 17, 17, 8, 0, PI), [[-17, KNEE - 6], [-21 * th, 60], [-22 * th, 10]]);
  const shinPts = () => ep(0, 0, 16, 16, 8, PI, TAU).concat([[16, 12], [15, 60], [12, ANK - 14], [13, ANK + 3], [-15, ANK + 3], [-16, 70], [-17, 20], [-16, 8]]);
  const FOOT = {
    soulier: [[-16, -6], [12, -6], [22, -1], [38, 3], [46, 11, 1], [45, 15, 1], [-17, 15, 1], [-19, 5]],
    bottine: [[-15, -10], [10, -10], [18, -3], [34, 2], [40, 9, 1], [39, 14, 1], [-16, 14, 1], [-18, 2]],
  };
  // IK deux segments dans le repère du torse : coude toujours plié vers l'avant ; pick 'bas' | 'avant' | 'arriere'
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI, b = normA(cAbs - a);
      if (b > 0.05) continue;
      const sc = pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1];
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best || { a: normA(tv), b: 0 };
  }
  function legIk(T) {                                                           // hanche → cheville, genou vers l'avant
    const S = [0, -2], vx = T[0] - S[0], vy = T[1] - S[1], d = clamp(Math.hypot(vx, vy), 20, KNEE + ANK - 1), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((KNEE * KNEE + d * d - ANK * ANK) / (2 * KNEE * d), -1, 1)), a = tv - a1;
    const E = [S[0] - KNEE * Math.sin(a), S[1] + KNEE * Math.cos(a)], c = Math.atan2(-(T[0] - E[0]), T[1] - E[1]);
    return { a: normA(a), b: normA(c - a) };
  }

  // ------------------------------------------------------------ poses : aides communes
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) }); }
  const add = (q, n, v) => { q.ang[n] = (q.ang[n] || 0) + v; };
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  const has = (v) => v && v !== 'rien';
  function armTo(q, arm, T, pick, k) {
    if (!(k > 0)) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  // point local du personnage (pieds = 0,0 ; +x devant) → repère du torse, et l'inverse
  const toTorso = (q, p_) => { const r = rot(p_, -(q.tilt || 0)); return [r[0] - (q.dx || 0), r[1] - (HIPY + (q.dy || 0))]; };

  // =====================================================================
  // OBJETS — chaque objet se dessine dans son repère (origine = base) ; grip = point tenu ; p2 = seconde prise ; pts = points nommés
  // =====================================================================
  const COUL = { ambre: '#C98A2B', rouge: '#A8322B', bleu: '#3E5F9C', vert: '#4F8C4A', clair: '#c9d6d2' };
  LYO.COULEURS = Object.keys(COUL);
  function drawLumignon(o) {
    const col = COUL[o.couleur] || o.couleur || COUL.ambre, on = o.allume == null ? 1 : clamp(o.allume), t = o.t || 0, c = cx_();
    const body = [[-21, 0, 1], [21, 0, 1], [24, -5], [26, -58], [27, -64, 1], [-27, -64, 1], [-26, -58], [-24, -5]];
    pc(body, col, () => {
      fillPts([[-20, -2], [20, -2], [20, -24], [-20, -24]], 'rgba(244,234,210,0.55)');                      // bougie (cire) qui remplit le fond
      fillPts(ell(0, -24, 20, 3.5, 12), 'rgba(255,250,236,0.75)');
      fillPts([[-23, -7], [23, -7], [22, 0], [-22, 0]], 'rgba(30,15,10,0.3)');                                 // fond épais
      for (const x of [-16, -6, 4, 14]) strokePts([[x, -60], [x * 0.92, -8]], 'rgba(255,255,255,0.16)', 1.4); // facettes
      strokePts([[-19, -56], [-17, -12]], 'rgba(255,255,255,0.6)', 2.6);
      strokePts(ep(0, -62, 26, 3.5, 10, 0, PI), 'rgba(255,255,255,0.4)', 1.4);
      if (on > 0 && !SIL()) {                                                                               // le verre s'illumine de sa couleur
        const g = c.createRadialGradient(0, -34, 2, 0, -32, 30);
        g.addColorStop(0, `rgba(255,226,150,${0.45 * on})`); g.addColorStop(0.6, `rgba(${hex2rgb(col)},${0.3 * on})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(-30, -70, 60, 72); c.restore();
      }
      hatch([[8, -64], [28, -64], [24, 0], [8, 0]], 0.9, 3.6, 0.18);
    }, 7101, { texA: 0.25 });
    strokePts([[0, -25], [0, -30]], '#2a1e16', 1.6);
    if (on > 0.02) {
      const lean = (o.vent || 0) * (0.35 + 0.15 * Math.sin(M.tg(t) * 5));
      c.save(); c.translate(0, -29); c.rotate(lean); c.scale(on, on);
      M.flamme(t, { x: 0.001, y: 0.001, s: 0.72, lueur: false, seed: o.seed || 7 }); c.restore();
      glow(0, -40, 120, hex2rgb(col), 0.3 * on); glow(0, -44, 56, '255,210,120', 0.28 * on);
    }
  }
  function drawPerche(o) {                                                       // perche d'allumeur : origine = prise ; bout en haut
    const etat = o.etat || 'flamme', t = o.t || 0;
    pc(ribbon([[0, 110], [0, -330]], 7, 6), '#7a5532', () => { strokePts([[-1.5, 100], [-1.5, -320]], 'rgba(255,220,170,0.35)', 1.2); hatch(null, 0.2, 5, 0.18); }, 7201, { texA: 0.3 });
    pc(rrect(-6, -364, 6, -330, 3), '#b08d45', () => { strokePts([[-3, -360], [-3, -334]], 'rgba(255,240,190,0.6)', 1.2); }, 7202);   // porte-mèche en laiton
    pc([[4, -350], [18, -352], [22, -362], [16, -372, 1], [14, -366], [17, -360], [6, -356]], '#8a6a34', null, 7203);                 // crochet d'allumeur
    strokePts([[0, -364], [0, -372]], '#2a1e16', 2);
    if (etat === 'flamme') { M.flamme(t, { x: 0.001, y: -370, s: 0.75, lueur: !SIL(), r: 70, seed: 21 }); }
    else if (!SIL()) M.fumee(t, { x: 0, y: -374, s: 0.25, n: 5, haut: 120, vent: 16, col: '#c9c4bb', a: etat === 'fumee' ? 0.75 : 0.35, per: 2.2, seed: 22 });
    if (o.goutte) for (let i = 0; i < 3; i++) { const u = ((M.tg(t) * 0.8 + i / 3) % 1); fillPts(ell(3, -330 + u * 240, 2, 3.5, 8), `rgba(200,220,235,${0.8 * (1 - u)})`); }
  }
  function drawParapluie(o) {                                                    // origine = prise (au-dessus de la crosse) ; ouvre 0..1, retourne 0..1
    const ouv = clamp(o.ouvre || 0), ret = clamp(o.retourne || 0), t = o.t || 0, g = M.tg(t), TOIL = o.couleur || '#2F4A3A';
    pc(ribbon([[0, 30], [0, -306]], 5, 4), '#3a2a20', null, 7301);                                                        // canne
    pc(ribbon(ep(-12, 30, 12, 12, 10, 0, PI), 9, 9), '#6b4526', () => strokePts([[-2, 36], [-14, 42]], 'rgba(255,220,170,0.3)', 1.2), 7302);   // crosse
    const apex = [0, -300];
    if (ouv < 0.08 && ret < 0.01) {                                                                                         // fermé : fuseau
      pc([[0, -306], [9, -270], [12, -200], [7, -120, 1], [-7, -120, 1], [-12, -200], [-9, -270]], TOIL, () => {
        for (const x of [-4, 3]) strokePts([[x, -290], [x * 1.5, -130]], 'rgba(0,0,0,0.3)', 1); fillPts(box(-12, -190, 12, -182), '#1d2b22');
      }, 7303);
      return;
    }
    const w = lerp(16, 168, ouv) * (1 - 0.18 * ret), wind = 26 * ret * Math.sin(g * 4.1) + 34 * ret;
    const rimY = lerp(-150, -222, ouv), up = lerp(0, -150, ret);                                                            // retourné : les bords montent au-dessus de la pointe
    const n = 8, rim = [];
    for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(-w, w, u); rim.push([x + wind * (0.5 + 0.5 * u), rimY + up + (i % 2 ? 0 : 8) * (1 - ret) - 12 * ret * Math.sin(u * PI)]); }
    const domeH = lerp(30, 78, ouv) * (1 - 2 * ret);                                                                         // > 0 = bombé ; < 0 = en coupe
    const top = []; for (let i = 0; i <= 12; i++) { const u = i / 12, x = lerp(-w, w, u); top.push([x + wind * (0.5 + 0.5 * u), rimY + up - domeH * Math.sin(u * PI) - (apex[1] - (rimY + up)) * 0 ]); }
    const poly = rim.map((p, i) => (i % 2 ? [p[0], p[1] - 6] : [p[0], p[1], 1])).reverse().concat(top);
    pc(poly, TOIL, () => {
      for (let i = 1; i < n; i++) { const r = rim[i]; strokePts([[apex[0] + wind * 0.7, apex[1] + (ret > 0.5 ? up * 0.2 : 0)], r], 'rgba(10,20,14,0.45)', 1.2); }
      hatch(null, 0.5, 5, 0.18, 1.05, P.encre, [-200, -480, 200, 0]); shade(0, -320, 0, -150, 0.3, [-220, -480, 220, 0]);
    }, 7304, { texA: 0.35 });
    if (ret > 0.15) {                                                                                                       // baleines tordues visibles dessous + lambeau
      for (let i = 1; i < n; i += 2) strokePts([[0, -250], [rim[i][0] * 0.6, rim[i][1] + 40 * ret], rim[i]], '#1a1a1a', 1.6);
      pc([[rim[n][0], rim[n][1]], [rim[n][0] + 40 * ret, rim[n][1] + 20 + 8 * Math.sin(g * 9)], [rim[n][0] + 26 * ret, rim[n][1] + 44]], TOIL, null, 7305);
    }
    pc(ell(apex[0] + wind * 0.7, apex[1] - 6, 3, 8, 8), '#d8cfb8', null, 7306);                                             // embout
  }
  const HAT = { brim: 45, band: 30, top: 36, h: 96 };
  function hatPts(tord, ph) {                                                    // haut-de-forme évasé ; origine = milieu du bord ; tord 0..1 = essoré
    const h = HAT.h * (1 - 0.18 * tord), sq = (y) => 1 - tord * 0.32 * Math.sin(PI * clamp(-y / h)) * (0.8 + 0.2 * Math.sin(ph));
    const L = [], R = [];
    for (let i = 0; i <= 6; i++) { const u = i / 6, y = -6 - u * (h - 6), w = lerp(HAT.band, HAT.top, u * u) * sq(y), tw = tord * 10 * Math.sin(u * PI * 2 + ph); R.push([w + tw, y]); L.push([-w + tw, y]); }
    return [[-HAT.brim, 4, 1], [HAT.brim + 2, 4, 1], [HAT.brim + 4, -3], [HAT.band + 6, -7]].concat(R.slice(1, 6), [[R[6][0], R[6][1], 1], [L[6][0], L[6][1], 1]], L.slice(1, 6).reverse(), [[-HAT.band - 6, -7], [-HAT.brim - 2, -3]]);
  }
  function hatPaint(p, tord, ph) {
    const h = HAT.h * (1 - 0.18 * tord), w = p.trempe || 0;
    fillPts([[-HAT.band - 1, -10], [HAT.band + 1, -10], [HAT.band + 3, -30], [-HAT.band - 3, -30]], '#5B2A4A');            // ruban prune
    strokePts([[-HAT.band, -28], [HAT.band + 2, -28]], 'rgba(255,255,255,0.25)', 1.2);
    fillPts([[-HAT.brim, -1], [HAT.brim + 2, -1], [HAT.brim + 3, 4], [-HAT.brim, 4]], 'rgba(60,55,50,0.35)');
    strokePts([[-HAT.band + 8, -40], [-HAT.band + 10, -h + 6]], 'rgba(255,255,255,0.5)', 3);
    if (tord > 0) for (let i = 0; i < 4; i++) strokePts([[-30, -30 - i * 22], [30, -44 - i * 22 + 10 * Math.sin(ph + i)]], 'rgba(60,50,60,0.45)', 1.4);
    hatch([[8, -6], [44, -6], [44, -h], [8, -h]], 0.9, 3.6, 0.22);
    if (w > 0) fillPts([[-60, 8], [60, 8], [60, -h - 4], [-60, -h - 4]], `rgba(40,40,60,${0.32 * w})`);
  }
  function drawChapeau(o) {                                                      // chapeau seul (tenu, posé, qui vole) ; o.tord, o.trempe, o.t
    const tord = clamp(o.tord || 0), ph = M.tg(o.t || 0) * 5;
    pc(hatPts(tord, ph), '#CFCAC0', () => hatPaint({ trempe: o.trempe }, tord, ph), 7401, { texA: 0.35 });
    if (tord > 0.05 && !SIL()) for (let i = 0; i < 6; i++) {                      // eau essorée qui coule en filets
      const u = ((M.tg(o.t || 0) * 1.6 + i / 6) % 1), x = -30 + i * 12;
      fillPts(ell(x + 6 * Math.sin(i), -HAT.h * 0.5 + 10, 2.2, 3 + 2 * u, 8), `rgba(190,215,235,${0.9 * tord * (1 - u)})`);
    }
  }
  function drawBougie(o) {                                                       // petite bougie sur bougeoir de laiton ; origine = dessous ; o.allume
    const on = clamp(o.allume || 0), t = o.t || 0;
    pc([[-24, 0, 1], [24, 0, 1], [26, -6], [10, -9], [8, -14, 1], [-8, -14, 1], [-10, -9], [-26, -6]], '#b08d45', () => strokePts([[-20, -4], [18, -6]], 'rgba(255,240,190,0.55)', 1.4), 7501);
    pc(ribbon(ep(30, -6, 8, 7, 8, -PI / 2, PI / 2), 4, 4), '#8a6a34', null, 7502);
    pc(rrect(-6, -62, 6, -12, 2), '#f1ebdc', () => { strokePts([[-3, -58], [-3, -16]], 'rgba(255,255,255,0.7)', 1.4); fillPts([[2, -62], [6, -62], [6, -52]], 'rgba(220,210,190,0.8)'); }, 7503);
    strokePts([[0, -62], [0, -68]], '#2a1e16', 1.6);
    if (on > 0.02) { const c = cx_(); c.save(); c.translate(0, -67); c.scale(on, on); M.flamme(t, { x: 0.001, y: 0.001, s: 0.62, lueur: false, seed: 31 }); c.restore(); glow(0, -74, 90, '255,200,120', 0.42 * on); }
  }
  const OBJ = {
    lumignon: { draw: drawLumignon, grip: (o) => (o.prise === 'flanc' ? [-26, -22] : [0, 4]), p2: () => [29, -30], pts: { flamme: [0, -48], base: [0, 0], bord: [0, -64] }, base: [0, 0], held: { echelle: 1.9 } },
    perche: { draw: drawPerche, grip: [0, 0], p2: () => [0, 60], pts: { meche: [0, -372], bout: [0, 110] }, base: [0, 0] },
    parapluie: { draw: drawParapluie, grip: [0, 0], pts: { pointe: [0, -310], crosse: [-24, 30] }, base: [0, 0] },
    chapeau: { draw: drawChapeau, grip: [0, -HAT.h + 10], p2: () => [0, -4], pts: { fond: [0, -HAT.h] }, base: [0, 0] },
    bougie: { draw: drawBougie, grip: [30, -6], pts: { flamme: [0, -70] }, base: [0, 0] },
  };
  LYO.OBJ = OBJ;
  const gripOf = (ob, o) => { const g = typeof ob.grip === 'function' ? ob.grip(o) : ob.grip, e = (o && o.echelle) || 1; return [g[0] * e, g[1] * e]; };
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob.held || {}, o || {}); }
  function drawScaled(ob, oo) { const c = cx_(), e = oo.echelle || 1; c.save(); c.scale(e, e); ob.draw(oo); c.restore(); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); drawScaled(ob, oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [13, -4], [13, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu (écran) : r renvoyé par une enveloppe LYO
  LYO.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1, q = ob.pts[nom];
    return r.w(arriere ? 'objetB' : 'objet', q[0] * e - g[0], q[1] * e - g[1]);
  };
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !q.handF) q.handF = 'fist';
    if (has(q.tenuB) && !q.handB) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1, p2 = ob.p2(oo);
      const Hf = new DOMMatrix().translate(SH_F[0], SH_F[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(SH_B, mp(Hf, [p2[0] * e, p2[1] * e]), q.deuxPick || 'bas'), k2 = q.deuxK == null ? 1 : clamp(q.deuxK);
      const a0 = A.armB_up || 0, b0 = A.armB_lo || 0;
      A.armB_up = a0 + normA(sol.a - a0) * k2; A.armB_lo = b0 + normA(sol.b - b0) * k2;
      if (k2 > 0.5) { q.handB = q.handB2 || 'fist'; q._deux = q.handB === 'fist'; }
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, o || {});
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (has(q.tenu) && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB) && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }

  // =====================================================================
  // FABRIQUE DE MARIONNETTE (genoux articulés, bras à articulations rondes)
  // =====================================================================
  function foreDef(parent, base, skin, back, seed, o) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      const k = hk(p);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], back ? (o.skinD || skin) : skin);
      if (k === 'cup') { strokePts([[2, 100], [6, 110]], 'rgba(70,35,20,0.45)', 1); hatch([[-12, 76], [-2, 76], [-2, 122], [-12, 122]], 0.9, 3.4, 0.22); } else X.handPaint(null, k);
      if (o.cuff) fillPts([[-14, 60, 1], [14, 60, 1], [15, 77, 1], [-14, 77, 1]], o.cuff);
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, back ? 0.3 : 0.22);
      if (o.wet) o.wet(p, [-30, -20, 30, 80]);
    } };
  }
  function corps(o) {
    const sd = o.seed, th = o.th || 1;
    const legPaint = (back, lo) => (p) => { if (o.legPaint) o.legPaint(p, back, lo); hatch(back ? null : [[-26, -20], [-6, -20], [-6, 130], [-26, 130]], 0.8, 3.8, back ? 0.3 : 0.22); if (o.wet) o.wet(p, [-30, -20, 30, 130]); };
    const footPaint = (p) => { fillPts([[-20, 10], [50, 10], [50, 16], [-20, 16]], 'rgba(10,8,6,0.55)'); strokePts([[14, -2], [34, 3]], 'rgba(255,255,255,0.22)', 1.3); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: o.torso, base: o.coat, seed: sd, paint: (p) => { if (o.torsoPaint) o.torsoPaint(p); if (o.wet) o.wet(p, [-60, -190, 70, 130]); } },
      legB: { parent: 'torso', at: [-6, -2], pts: thighPts(th), base: o.thighB || o.thigh, seed: sd + 1, noRivet: true, paint: legPaint(true, false) },
      legB_lo: { parent: 'legB', at: [0, KNEE], pts: shinPts(), base: o.thighB || o.thigh, seed: sd + 2, noRivet: true, paint: legPaint(true, true) },
      footB: { parent: 'legB_lo', at: [0, ANK], pts: FOOT[o.foot || 'soulier'], base: o.shoe, seed: sd + 3, noRivet: true, paint: footPaint },
      legF: { parent: 'torso', at: [6, -2], pts: thighPts(th), base: o.thigh, seed: sd + 4, paint: legPaint(false, false) },
      legF_lo: { parent: 'legF', at: [0, KNEE], pts: shinPts(), base: o.thigh, seed: sd + 5, paint: legPaint(false, true) },
      footF: { parent: 'legF_lo', at: [0, ANK], pts: FOOT[o.foot || 'soulier'], base: o.shoe, seed: sd + 6, noRivet: true, paint: footPaint },
      armB_up: { parent: 'torso', at: SH_B, pts: armR(LA, o.armW), base: o.sleeveB || o.sleeve, seed: sd + 7, paint: (p) => { hatch(null, 0.8, 3.6, 0.3); if (o.wet) o.wet(p, [-30, -30, 30, 110]); } },
      armB_lo: foreDef('armB_up', o.sleeveB || o.sleeve, o.skin, true, sd + 8, o),
      head: { parent: 'torso', at: [6, -170], pts: o.head || X.NAP_HEAD, base: o.skin, seed: sd + 9, noRivet: true, paint: o.headPaint },
      armF_up: { parent: 'torso', at: SH_F, pts: armR(LA, o.armW), base: o.sleeve, seed: sd + 10, paint: (p) => { hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.26); if (o.wet) o.wet(p, [-30, -30, 30, 110]); } },
      armF_lo: foreDef('armF_up', o.sleeve, o.skin, false, sd + 11, o),
    };
    Object.assign(parts, heldParts(o.skin, sd + 20), o.parts || {});
    const order = ['armB_up', 'armB_lo', 'objetB', 'legB', 'legB_lo', 'footB', 'legF', 'legF_lo', 'footF'].concat(o.backs || [], ['head'], o.heads || [], ['torso'], o.fronts || [],
      ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'], o.last || []);
    return { hipY: HIPY, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, parts, order };
  }
  function visage(p, o) {
    const f = p.face || {};
    X.earPaint(-8, -44);
    hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
    if (o.joue) dot(16, -32, o.joueR || 8, o.joue);
    X.eye(f, 17, -52, o.eyeSz || 1); X.brow(f, 17, o.browY || -60, o.browCol || 'rgba(45,30,22,0.95)', o.browW || 2.4);
    if (!o.sansBouche) X.mouth(f, o.mouthX || 27, o.mouthY || -27, o.lip);
  }
  function marche(q, k, cadence) {                                               // pas sur place (le plan déplace x) ; q.t obligatoire
    const t = q.t || 0, ph = t * (cadence || 6), sw = Math.sin(ph) * 0.3 * k;
    add(q, 'legF', -sw); add(q, 'legB', sw);
    add(q, 'legF_lo', Math.max(0, Math.sin(ph + 1.9)) * 0.45 * k); add(q, 'legB_lo', Math.max(0, -Math.sin(ph + 1.9)) * 0.45 * k);
    add(q, 'footF', -(-sw + Math.max(0, Math.sin(ph + 1.9)) * 0.45 * k) * 0.8); add(q, 'footB', -(sw + Math.max(0, -Math.sin(ph + 1.9)) * 0.45 * k) * 0.8);
    if (!q._brasPris) { add(q, 'armF_up', sw * 0.4); add(q, 'armB_up', -sw * 0.4); add(q, 'armF_lo', -0.15 * k); add(q, 'armB_lo', -0.15 * k); }
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    return ph;
  }
  function fenFind(f) { if (typeof f === 'string') return LYO.FEN.find((w) => w.id === f); if (typeof f === 'number') return LYO.FEN[f]; return f; }
  const SILL = -40;                                                              // rebord = y −40 du torse (bas de la poitrine)
  // marionnette en buste à une fenêtre : passe 1 (corps, découpé dans l'ouverture), objet posé, passe 2 (bras avant + objet tenu par-dessus le rebord)
  function fenetreDraw(chName, gestes, p, x, y, s, o) {
    const F = fenFind(p.fenetre); if (!F) return null;
    const dir = o.dir || F.dir || 1, bx = x != null ? x : F.corps, by = F.rebord - (HIPY + SILL) * s;
    const q = prep(p); q._fen = { tx: ((F.lum != null ? F.lum : F.x) - bx) * dir / s, ty: SILL, F, s };
    gestes(q); finish(q);
    const def = CH[chName], c = cx_(), legs = { legF: 1, legF_lo: 1, footF: 1, legB: 1, legB_lo: 1, footB: 1, jupe: 1, tablier: 1, pans: 1 };
    const front = ['armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB', 'coupeB'];
    const h1 = Object.assign({}, q.hide, legs); for (const n of front) h1[n] = 1;
    const h2 = {}; for (const n of def.order) if (front.indexOf(n) < 0) h2[n] = 1;
    const oo = { dir, rod: false, floorShadow: false, alpha: o.alpha, cast: o.cast };
    c.save(); c.beginPath(); c.rect(F.x - F.w / 2, F.rebord - F.h, F.w, F.h + 3); c.clip();
    M.puppet(def, Object.assign({}, q, { hide: h1 }), bx, by, s, oo); c.restore();
    if (q._pose) q._pose();
    const r = run(def, Object.assign({}, q, { hide: Object.assign({}, q.hide, h2) }), bx, by, s, oo);
    r.fen = F; r.lumignon = q._lumPt || null;
    return r;
  }
  function mkWrap(chName, gestes, sDef) {
    const pose = (p) => { const q = prep(p); gestes(q); return finish(q); };
    const f = (p, x, y, s, o) => {
      s = s == null ? sDef : s; o = o || {};
      if (p && p.fenetre != null) return fenetreDraw(chName, gestes, p, x, y, s, o);
      return run(CH[chName], pose(p), x, y, s, o);
    };
    f.pose = pose; f.def = () => CH[chName];
    return f;
  }
  const lavis = (col) => (p, b) => { const w = clamp(p.trempe || 0); if (w > 0) fillPts(box(b[0], b[1], b[2], b[3]), `rgba(${col},${0.3 * w})`); };

  // =====================================================================
  // L'ORGANISATEUR (notable de 1852) — haut-de-forme évasé gris perle à ruban prune, rouflaquettes rousses, moustache en guidon,
  // redingote prune, gilet moutarde, lavallière vert bouteille, pantalon gris rayé, ventre rond
  // =====================================================================
  const OR = { coat: '#5B2A4A', coatD: '#45203A', coatL: '#7A4766', gilet: '#B98A2E', giletD: '#93701F', pant: '#8E8C94', pantD: '#74727B', peau: '#E8BE9A', peauD: '#C99A78',
    roux: '#B4552B', rouxD: '#8A3D1C', rouxL: '#D27A45', chemise: '#EEE8DA', cravate: '#2F5A48', shoe: '#1f1a1a' };
  const ORG_TORSO = [[-14, -178], [8, -182], [18, -170], [30, -150], [42, -124], [52, -94], [57, -60], [55, -26], [46, -2], [40, 40], [38, 96, 1], [0, 100], [-38, 112, 1], [-32, 60], [-42, 0], [-44, -60], [-44, -112], [-38, -150], [-26, -170]];
  const ORG_HEAD = [[-16, 16], [12, 16], [15, 4], [22, -2], [28, -9], [30, -17], [28, -22], [30, -27], [29, -31], [33, -35], [41, -40, 1], [37, -50], [31, -57], [30, -66], [27, -79], [15, -93], [-6, -98], [-25, -89], [-34, -68], [-33, -46], [-26, -26], [-19, -6]];
  const ORG_FAV = [[-2, -70], [8, -68], [11, -54], [15, -40], [21, -26], [24, -14], [18, -2], [6, 2], [-6, -2], [-12, -16], [-14, -34], [-12, -54]];
  const ORG_MOUST = [[14, -33], [26, -36], [34, -34], [42, -32], [50, -34], [55, -41], [53, -48], [49, -50, 1], [50, -44], [46, -39], [38, -27], [28, -24], [18, -27], [10, -31], [3, -38], [0, -45], [-2, -40], [4, -32]];
  const ORG_CHEV = [[-4, -95], [-25, -88], [-35, -68], [-35, -48], [-28, -40], [-20, -52], [-12, -70], [2, -84], [16, -88]];
  const ORG_CHEV_MOUILLE = [[30, -76], [24, -88], [12, -96], [-8, -100], [-26, -92], [-36, -72], [-37, -50], [-30, -40], [-24, -56], [-14, -74], [2, -82], [18, -80], [22, -70], [26, -72]];
  const orgWet = lavis('30,26,48');
  CH.lyoOrga = corps({
    seed: 9100, torso: ORG_TORSO, coat: OR.coat, sleeve: OR.coat, sleeveB: OR.coatD, skin: OR.peau, skinD: OR.peauD, cuff: OR.chemise,
    thigh: OR.pant, thighB: OR.pantD, shoe: OR.shoe, foot: 'soulier', head: ORG_HEAD, th: 1.06, wet: orgWet,
    legPaint: (p, back) => { for (let x = -18; x <= 20; x += 6) strokePts([[x, -14], [x * 0.85, 128]], back ? 'rgba(40,38,46,0.35)' : 'rgba(50,48,58,0.4)', 1.1); },
    torsoPaint: (p) => {
      // gilet moutarde à petits carreaux sur le ventre, boutons de laiton
      const G = [[14, -168], [30, -150], [42, -124], [52, -94], [57, -60], [55, -26], [46, -2], [30, 4], [24, -30], [20, -80], [14, -130]];
      fillPts(G, OR.gilet);
      for (let y = -150; y < 6; y += 9) strokePts([[14, y], [58, y + 2]], 'rgba(110,70,20,0.35)', 0.9);
      for (let x = 18; x < 58; x += 9) strokePts([[x, -160], [x + 2, 4]], 'rgba(110,70,20,0.3)', 0.9);
      for (const [x, y] of [[40, -112], [48, -82], [52, -52], [49, -22]]) { dot(x, y, 3, '#7a5a1a'); dot(x - 0.8, y - 0.8, 1.6, '#f0d890'); }
      fillPts([[24, -30], [46, -2], [42, 40], [38, 96], [26, 98], [24, 20]], OR.coatD);                       // pan avant de la redingote
      fillPts([[14, -168], [24, -150], [26, -110], [20, -96], [12, -140]], OR.coatL);                          // revers
      dot(22, -128, 5, '#B23A3A'); dot(20, -130, 2.4, '#e2a0a0');                                             // œillet à la boutonnière
      strokePts([[-40, 20], [-30, 108]], 'rgba(30,10,25,0.5)', 1.4);                                           // fente des basques
      // col cassé blanc et lavallière vert bouteille (gros nœud mou)
      fillPts([[6, -184], [20, -180], [26, -168], [14, -166]], OR.chemise);
      fillPts([[10, -172], [26, -170], [34, -160], [30, -146], [22, -150], [16, -160]], OR.cravate);
      fillPts([[22, -164], [40, -172], [44, -158], [34, -152]], OR.cravate); fillPts([[24, -156], [40, -146], [36, -134], [26, -146]], '#264A3B');
      dot(26, -160, 4, '#3b6e58');
      hatch([[-50, -170], [-12, -170], [-12, 112], [-50, 112]], 0.75, 4.2, 0.3); shade(48, -40, -40, -20, 0.3);
    },
    headPaint: (p) => {
      visage(p, { joue: 'rgba(205,90,70,0.32)', joueR: 9, browCol: OR.rouxD, browW: 3, sansBouche: true });
      dot(38, -42, 4.5, 'rgba(200,90,80,0.35)');                                                            // nez rougeaud
      const f = p.face || {};
      if (f.mouth === 'o') fillPts([[24, -24], [30, -24], [30, -17], [24, -17]], '#3a1714');
      else strokePts([[30, -22], [24, -21], [18, -22]], 'rgba(110,40,38,0.9)', 1.5);
      fillPts([[-12, 6], [14, 6], [12, 16], [-14, 16]], 'rgba(170,110,80,0.25)');                            // double menton
      orgWet(p, [-50, -110, 50, 20]);
    },
    parts: {
      cheveux: { parent: 'head', at: [0, 0], noRivet: true, base: OR.roux, seed: 9130, pts: (p) => ((p.trempe || 0) > 0.45 || p._fen ? ORG_CHEV_MOUILLE : ORG_CHEV),
        paint: (p) => { const m = (p.trempe || 0) > 0.45 || p._fen; for (let i = 0; i < 4; i++) strokePts(m ? [[24 - i * 6, -80], [-10 - i * 4, -94 + i * 3], [-32, -70 + i * 6]] : [[-6 - i * 4, -90], [-26, -72 + i * 6]], m ? 'rgba(60,20,8,0.45)' : 'rgba(255,200,150,0.35)', 1.2); orgWet(p, [-50, -110, 40, -30]); } },
      favoris: { parent: 'head', at: [0, 0], noRivet: true, base: OR.roux, seed: 9131, pts: ORG_FAV,
        paint: (p) => { for (let i = 0; i < 6; i++) strokePts([[-6 + i * 4, -64 + i * 2], [-4 + i * 4, -6 + i]], 'rgba(255,190,140,0.35)', 1.1); hatch(null, 1.3, 3.4, 0.25); orgWet(p, [-20, -80, 30, 10]); } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: OR.rouxL, seed: 9132, pts: ORG_MOUST, rest: 0,
        paint: (p) => { strokePts([[16, -30], [36, -31], [48, -38]], 'rgba(120,50,20,0.55)', 1.2); orgWet(p, [0, -60, 60, -20]); } },
      chapeau: { parent: 'head', at: [2, -90], noRivet: true, base: '#CFCAC0', seed: 9133, rest: -0.06, pts: () => hatPts(0, 0), paint: (p) => hatPaint(p, 0, 0) },
      gouttes: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: 9134, pts: OFFP, extra: (p) => {
        const w = clamp(p.trempe || 0); if (w <= 0.05 || SIL()) return; const g = M.tg(p.t || 0);
        for (let i = 0; i < 9; i++) {                                                                       // gouttes qui tombent du bas de l'habit et du coude
          const u = (g * 1.3 + hash(i * 7.1)) % 1, x = -40 + i * 11, y0 = i < 6 ? 104 : -20;
          fillPts(ell(x, y0 + u * 90, 2.2, 3.6, 8), `rgba(190,215,235,${0.85 * w * (1 - u)})`);
        }
      } },
    },
    heads: ['cheveux', 'favoris', 'moustache', 'chapeau'], last: ['gouttes'],
  });
  const PARAP = { ferme: 0, ouvert: 1, retourne: 2 };
  function orgaGestes(q) {
    const A = q.ang, t = q.t || 0, g = M.tg(t), F = q._fen;
    if (q.chapeau === false) q.hide.chapeau = 1;
    if (q.marche) marche(q, clamp(q.marche), q.cadence);
    if (F) {                                                                     // buste à SA fenêtre, sans chapeau, cheveux mouillés, petite bougie sur le rebord
      q.hide.chapeau = 1; if (q.trempe == null) q.trempe = 0.55;
      const e = (q.tenuO && q.tenuO.echelle) || 1.5;
      q.tenu = 'bougie'; q.tenuO = Object.assign({ echelle: e, allume: q.allume || 0 }, q.tenuO);
      armTo(q, 'armF', [F.tx + 30 * e, F.ty - 6 * e], 'bas', 1); armTo(q, 'armB', [86, F.ty - 12], 'bas', 1);
      A.head = (A.head || 0) + 0.06; if (!q.face.brow) q.face.brow = 'worry';
      return;
    }
    if (q.fier) { const k = ease(clamp(q.fier)); add(q, 'head', -0.2 * k); q.tilt = (q.tilt || 0) - 0.05 * k; if (!q.face.mouth) q.face.mouth = 'smile'; }
    if (q.depit) { const k = ease(clamp(q.depit)); add(q, 'head', 0.32 * k); q.tilt = (q.tilt || 0) + 0.03 * k; if (!q.face.brow) q.face.brow = 'worry'; if (!q.face.eyes) q.face.eyes = 'half'; }
    if (q.montre) { const k = ease(clamp(q.montre)); armTo(q, 'armF', [128, -276], 'bas', k); if (k > 0.5) q.handF = q.handF || 'open'; add(q, 'head', -0.22 * k); q._brasPris = true; }
    if (q.repousse) { const k = ease(clamp(q.repousse)); armTo(q, 'armF', [118, -150], 'bas', k); blend(q, 'armF_lo', -1.75, k * 0.5); if (k > 0.4) q.handF = q.handF || 'open'; q._brasPris = true; }
    if (q.perche) {
      const k = ease(clamp(q.leve || 0));
      q.tenu = 'perche'; q.tenuO = Object.assign({ etat: q.perche === true ? 'flamme' : q.perche }, q.tenuO);
      armTo(q, 'armF', [lerp(52, 96, k), lerp(-58, -228, k)], 'bas', 1);
      A.objet = (A.objet || 0) + lerp(0.3, 0.3, k); q._brasPris = true;
    }
    if (q.parapluie != null && q.parapluie !== false) {
      const v = typeof q.parapluie === 'string' ? PARAP[q.parapluie] : +q.parapluie, ret = clamp(v - 1), k = ease(smooth(0, 0.6, v));
      q.tenu = 'parapluie'; q.tenuO = Object.assign({ ouvre: clamp(v), retourne: ret }, q.tenuO);
      armTo(q, 'armF', [lerp(46, 84, k) + 10 * ret * Math.sin(g * 6), lerp(-70, -292, k) - 8 * ret * Math.sin(g * 4.3)], 'bas', 1);
      A.objet = (A.objet || 0) + lerp(0.05, -0.26, k) + ret * (0.22 + 0.1 * Math.sin(g * 5.2));
      if (ret > 0.3) { armTo(q, 'armB', [92, -150], 'bas', ret); q.handB = 'open'; if (!q.face.mouth) q.face.mouth = 'o'; if (!q.face.eyes) q.face.eyes = 'wide'; }
      q._brasPris = true;
    }
    if (q.tordre) {                                                              // essore son chapeau à deux mains devant le ventre
      const k = ease(clamp(q.tordre)), a = 0.42 + 0.14 * Math.sin(g * 5) * k, C = [100, -96 + 3 * Math.sin(g * 10)];
      q.hide.chapeau = 1; q.tenu = 'chapeau'; q.tenuO = Object.assign({ tord: k, trempe: q.trempe }, q.tenuO);
      const L = (HAT.h - 10) / 2;
      armTo(q, 'armF', [C[0] + L * Math.cos(a), C[1] + L * Math.sin(a)], 'bas', 1);
      q.droit = true; A.objet = (A.objet || 0) + a + PI / 2; q.deuxMains = true;
      add(q, 'head', 0.22 * k); if (!q.face.brow) q.face.brow = 'frown'; q._brasPris = true;
    }
    if (q.peds) {                                                                // lève un pied hors de l'eau, bras en balancier, chapeau en équilibre
      const k = ease(clamp(q.peds));
      add(q, 'legF', -1.2 * k); add(q, 'legF_lo', 1.12 * k); add(q, 'footF', 0.06 * k);
      if (!q._brasPris) { armTo(q, 'armF', [96, -150 + 6 * Math.sin(g * 3)], 'bas', k); q.handF = q.handF || 'open'; }
      armTo(q, 'armB', [60, -170 + 6 * Math.sin(g * 3 + 1)], 'bas', k); q.handB = q.handB || 'open';
      q.tilt = (q.tilt || 0) - 0.04 * k; add(q, 'chapeau', (0.16 + 0.08 * Math.sin(g * 2.6)) * k);
      if (!q.face.brow) q.face.brow = 'worry'; if (!q.face.mouth) q.face.mouth = 'o';
    }
    if (!q.marche && !q._brasPris) { add(q, 'armF_up', 0.02 * Math.sin(g * 1.7)); add(q, 'armB_up', -0.02 * Math.sin(g * 1.7)); }
    q.dy = (q.dy || 0) + 1.2 * Math.sin(g * 1.9);
  }
  LYO.organisateur = mkWrap('lyoOrga', orgaGestes, 0.9);

  // =====================================================================
  // LA LYONNAISE (canuse, 1852) — bonnet de dentelle blanche noué sous le menton, châle carmin croisé, robe vert éteint, tablier ivoire
  // =====================================================================
  const LY = { peau: '#EDCAA8', peauD: '#D1AB88', robe: '#4E6B4F', robeD: '#3C5640', chale: '#8E2B2B', chaleD: '#6E1F22', tablier: '#E6DEC8', tablierD: '#CFC5AB', bonnet: '#F3EFE6', cheveux: '#5A3A26', shoe: '#2a1f1a' };
  const LY_TORSO = [[-12, -174], [8, -178], [16, -166], [24, -150], [32, -118], [34, -86], [28, -40], [26, 0], [-28, 0], [-30, -40], [-34, -90], [-34, -130], [-30, -156], [-22, -168]];
  const LY_HEAD = [[-14, 16], [10, 16], [11, 2], [15, -5], [22, -9], [26, -15], [25, -21], [27, -25], [26, -29], [29, -33], [34, -39, 1], [31, -46], [28, -56], [28, -64], [25, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const LY_JUPE = [[-30, -4], [28, -4], [38, 50], [50, 130], [58, 222, 1], [-54, 224, 1], [-48, 130], [-40, 50]];
  const LY_BONNET = [[22, -88], [10, -99], [-10, -104], [-29, -96], [-41, -78], [-43, -56], [-37, -38], [-27, -32], [-20, -46], [-18, -64], [-8, -80], [8, -88]];
  const LY_DENT = [[27, -88], [14, -94], [0, -90], [-11, -76], [-16, -58], [-15, -40], [-9, -24]];
  CH.lyoLyon = corps({
    seed: 9300, torso: LY_TORSO, coat: LY.robe, sleeve: LY.robe, sleeveB: LY.robeD, skin: LY.peau, skinD: LY.peauD, cuff: LY.tablier,
    thigh: LY.robeD, thighB: LY.robeD, shoe: LY.shoe, foot: 'bottine', head: LY_HEAD, th: 0.8, armW: 13,
    torsoPaint: () => {
      // châle carmin croisé sur la poitrine, pointes rentrées dans la ceinture du tablier
      fillPts([[-30, -160], [-12, -176], [10, -176], [22, -158], [32, -120], [34, -92], [22, -60], [12, -8], [2, -8], [6, -60], [-6, -100], [-26, -110], [-34, -128]], LY.chale);
      fillPts([[12, -150], [30, -112], [24, -76], [14, -40], [10, -60], [16, -100], [6, -140]], LY.chaleD);   // pan croisé
      for (const d of [0, 6]) strokePts([[-26 + d, -158], [-4 + d, -172], [18 + d, -156], [28 + d * 0.5, -112]], 'rgba(230,190,120,0.45)', 1);   // liteaux
      hatch([[-36, -176], [34, -176], [34, -10], [-36, -10]], 0.7, 4, 0.22);
      fillPts([[-28, -12], [26, -12], [26, 0], [-28, 0]], LY.tablierD);                                      // ceinture du tablier
      shade(30, -60, -30, -60, 0.26);
    },
    headPaint: (p) => {
      visage(p, { joue: 'rgba(215,120,110,0.25)', lip: 'rgba(150,60,60,0.95)', browW: 2, browCol: 'rgba(70,45,30,0.9)' });
      fillPts([[25, -84], [14, -87], [4, -83], [12, -81], [22, -80]], LY.cheveux);                     // bandeau de cheveux sous la dentelle
    },
    parts: {
      jupe: { parent: 'torso', at: [0, -2], noRivet: true, base: LY.robe, seed: 9330, pts: LY_JUPE, paint: () => {
        for (const x of [-30, -12, 8, 26]) strokePts([[x * 0.7, 6], [x * 1.25, 220]], 'rgba(20,35,20,0.35)', 1.2);
        hatch([[-60, 0], [-10, 0], [-10, 226], [-60, 226]], 0.8, 4.2, 0.28); strokePts([[-52, 214], [56, 212]], 'rgba(20,35,20,0.4)', 1.4);
      } },
      tablier: { parent: 'jupe', at: [0, 0], noRivet: true, base: LY.tablier, seed: 9331, pts: [[2, 4, 1], [30, 2], [40, 60], [48, 140], [52, 196, 1], [10, 198, 1], [6, 120]], paint: () => {
        strokePts([[18, 10], [26, 190]], 'rgba(120,110,90,0.35)', 1); strokePts([[34, 20], [44, 186]], 'rgba(120,110,90,0.3)', 1);
        fillPts([[8, 190], [52, 188], [52, 196], [10, 198]], LY.tablierD); hatch(null, 0.9, 4.4, 0.14);
      } },
      bonnet: { parent: 'head', at: [0, 0], noRivet: true, base: LY.bonnet, seed: 9332, pts: LY_BONNET, paint: () => {
        for (let i = 0; i < 4; i++) strokePts(ep(-14, -66, 18 + i * 8, 26 + i * 8, 8, PI * 0.55, PI * 1.5), 'rgba(150,140,120,0.35)', 1);
        hatch(null, 0.4, 3.4, 0.12);
      } },
      dentelle: { parent: 'head', at: [0, 0], noRivet: true, base: '#FBF8F1', seed: 9333, pts: () => ribbon(LY_DENT, 8, 6),     // ruché de dentelle festonné autour du visage
        paint: () => { for (const p of LY_DENT) dot(p[0], p[1], 1.3, 'rgba(150,140,120,0.6)'); },
        extra: () => { for (let i = 0; i < 13; i++) { const u = i / 12, k = Math.min(LY_DENT.length - 2, Math.floor(u * (LY_DENT.length - 1))), f = u * (LY_DENT.length - 1) - k, a = LY_DENT[k], b = LY_DENT[k + 1];
          const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
          fillPts(ell(x + dy / l * 5, y - dx / l * 5, 3.6, 3.6, 8), '#FBF8F1'); strokePts(ep(x + dy / l * 5, y - dx / l * 5, 3.6, 3.6, 8, 0, TAU), 'rgba(150,140,120,0.5)', 0.8); } } },
      coupeB: { parent: 'armB_lo', at: [0, 0], noRivet: true, base: LY.peauD, seed: 9335, pts: (p) => (p._coupe ? HAND_CUP.map((q) => [q[0] * 1.15, q[1]]) : OFFP),   // main en coupe, PAR-DESSUS le verre
        paint: () => { strokePts([[2, 100], [7, 112]], 'rgba(70,35,20,0.45)', 1); strokePts([[-3, 98], [0, 114]], 'rgba(70,35,20,0.4)', 1); } },
      ruban: { parent: 'head', at: [0, 0], noRivet: true, base: '#F7F3EA', seed: 9334, pts: [[-6, -24], [2, -10], [12, 4], [20, 8], [24, 2], [18, 14], [8, 16], [-2, 6], [-10, -14]], paint: () => strokePts([[4, -4], [16, 8]], 'rgba(150,140,120,0.5)', 1) },
    },
    backs: ['jupe', 'tablier'], heads: ['bonnet', 'dentelle', 'ruban'], last: ['coupeB'],
  });
  function lyonGestes(q) {
    const A = q.ang, t = q.t || 0, g = M.tg(t), F = q._fen;
    if (q.marche) { const ph = marche(q, clamp(q.marche), q.cadence); add(q, 'jupe', 0.04 * Math.sin(ph) * clamp(q.marche)); }
    add(q, 'jupe', 0.012 * Math.sin(g * 1.3));
    const lum = q.tient === 'lumignon' || q.tenu === 'lumignon';
    const lo = Object.assign({ echelle: 1.9, couleur: 'ambre', allume: 1 }, q.tientO, q.tenuO), e = lo.echelle;
    if (F) {                                                                     // accoudée au rebord ; pose 0..1 : du lumignon tenu à la poitrine au lumignon posé
      const rest = [104, F.ty - 13], restB = [86, F.ty - 12];
      armTo(q, 'armF', rest, 'bas', 1); armTo(q, 'armB', restB, 'bas', 1);
      if (lum) {
        const k = ease(clamp(q.pose || 0)), l = ease(clamp(q.lache || 0));
        lo.prise = 'flanc';
        const H1 = [F.tx - 26 * e, F.ty - 22 * e], H0 = [H1[0], H1[1] - 44], H = [lerp(lerp(H0[0], H1[0], k), rest[0], l), lerp(lerp(H0[1], H1[1], k) - 20 * Math.sin(PI * k), rest[1], l)];
        armTo(q, 'armF', H, 'bas', 1);
        const fl = [H[0] + 26 * e + 14 * e, H[1] - 30 * e]; armTo(q, 'armB', [lerp(fl[0], restB[0], l), lerp(fl[1], restB[1], l)], 'bas', 1); q.handB = l > 0.5 ? 'fist' : 'cup'; q._coupe = l < 0.5;
        if (k >= 0.999 || l > 0) {
          q.tenu = 'rien'; q.handF = l > 0.5 ? 'fist' : 'fist';
          q._pose = () => { const Fx = F.F.lum, Fy = F.F.rebord; q._lumPt = [Fx, Fy]; LYO.lumignon(t, Fx, Fy, F.s * e, Object.assign({}, lo, { echelle: 1 })); };
        } else { q.tenu = 'lumignon'; q.tenuO = lo; }
      }
      add(q, 'head', -0.04 + 0.03 * Math.sin(g * 0.9));
      return;
    }
    if (lum) {
      q.tenu = 'lumignon'; q.tenuO = lo;
      const kp = ease(clamp(q.presente || 0));
      const H = [lerp(66, 104, kp), lerp(-30, -110, kp)];
      armTo(q, 'armF', H, 'bas', 1); q._brasPris = true;
      if (!q.chante) {                                                          // l'autre main en coupe au-dessus de la flamme
        const fl = [H[0] + 16 * e, H[1] - 54 * e], sol = ik2(SH_B, fl, 'bas'); A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'cup'; q._coupe = kp < 0.5;
      }
      if (kp > 0) { q.deuxMains = true; q.deuxK = kp; q.deuxPick = 'bas'; add(q, 'head', -0.12 * kp); if (!q.face.mouth) q.face.mouth = 'smile'; }
    }
    if (q.chante) {                                                              // bouche ronde, menton levé, main sur le cœur
      const k = ease(clamp(q.chante));
      add(q, 'head', -0.24 * k + 0.04 * Math.sin(g * 2.2) * k); q.face.mouth = q.face.mouth || 'o'; q.face.brow = q.face.brow || 'up';
      if (!lum) { armTo(q, 'armF', [12, -112], 'bas', k); q.handF = q.handF || 'open'; armTo(q, 'armB', [64, -240 + 8 * Math.sin(g * 2)], 'bas', k); q.handB = q.handB || 'open'; q._brasPris = true; }
      else { armTo(q, 'armB', [60, -236], 'bas', k); q.handB = 'open'; }
    }
    if (!q.marche && !q._brasPris) { add(q, 'armF_up', 0.02 * Math.sin(g * 1.5)); add(q, 'armB_up', -0.02 * Math.sin(g * 1.5)); }
    q.dy = (q.dy || 0) + 1 * Math.sin(g * 2.1);
  }
  LYO.lyonnaise = mkWrap('lyoLyon', lyonGestes, 0.85);

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function acc(name, x, y, s, o, draw) {
    o = o || {};
    const def = accDef(name, draw || ((oo) => { const ob = OBJ[name]; drawScaled(ob, Object.assign({}, ob.held, oo, { echelle: 1 })); }));
    return M.puppet(def, { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  // lumignon seul : (x,y) = dessous du verre ; 72 px de haut à s 1 (≥ 120 px : s ≥ 1,7 ; en série sur un rebord : s 0,6–0,8)
  LYO.lumignon = (t, x, y, s, o) => acc('lumignon', x, y, s == null ? 1 : s, Object.assign({ t }, o));
  for (const n of ['perche', 'parapluie', 'chapeau', 'bougie']) LYO[n] = (x, y, s, o) => acc(n, x, y, s == null ? 0.9 : s, o);
  const coupeDef = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: HAND_CUP.map((q) => [q[0] * 1.15, q[1]]), base: '#d9b48f', noRivet: true, seed: 3 } }, order: ['o'] };
  const doigtsDef = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: DOIGTS, base: '#e6c4a2', noRivet: true, seed: 2, paint: doigtsPaint } }, order: ['o'] };
  // lumignon dans la main d'une marionnette qui ne le connaît pas (GRV.lea…) : r = retour de l'enveloppe ; o.arriere = main arrière ;
  // o.peau (couleur des doigts), o.echelle (1,9), o.couleur, o.allume, o.vent, o.dir (sens de la marionnette). Renvoie { base, flamme, coupe } (écran)
  LYO.dansLaMain = function (r, t, o) {
    o = o || {}; const part = o.arriere ? 'armB_lo' : 'armF_lo', m = r.mats[part]; if (!m) return null;
    const sc = Math.hypot(m.a, m.b), e = o.echelle || 1.9, H = r.w(part, 4, 96), dir = o.dir || 1, g = OBJ.lumignon.grip(o);
    const bx = H[0] - g[0] * e * sc * dir, by = H[1] - g[1] * e * sc;
    LYO.lumignon(t, bx, by, sc * e, Object.assign({}, o, { echelle: 1, dir }));
    doigtsDef.parts.o.base = o.peau || '#e6c4a2';
    M.puppet(doigtsDef, { tilt: Math.atan2(-m.c, m.d) * dir }, H[0], H[1], sc, { dir, rod: false, floorShadow: false });
    if (o.coupe && r.mats.armB_lo) {                                             // main arrière en coupe dessinée PAR-DESSUS le verre
      const mb = r.mats.armB_lo, E = r.w('armB_lo', 0, 0); coupeDef.parts.o.base = o.peauB || o.peau || '#d9b48f';
      M.puppet(coupeDef, { tilt: Math.atan2(-mb.c, mb.d) * dir }, E[0], E[1], sc, { dir, rod: false, floorShadow: false });
    }
    const fy = by - 48 * e * sc;
    return { base: [bx, by], flamme: [bx, fy], coupe: [bx + dir * 16 * e * sc, by - 58 * e * sc] };
  };

  // ------------------------------------------------------------ statue dorée de la Vierge (de face, voile, mains ouvertes vers le bas ; ni auréole ni croix)
  const OR_S = { base: '#C9A24A', l: '#EBCF7E', d: '#8E6B26' };
  LYO.STATUE = { h: 312, w: 124 };
  function statueGlint(o) {                                                      // reflet doré qui balaie la statue (dans le clip d'une pièce)
    const e = clamp(o.eclat == null ? 0.5 : o.eclat); if (e <= 0 || SIL()) return;
    const c = cx_(), g = M.tg(o.t || 0), u = ((g * 0.35) % 1.6) - 0.3, yb = lerp(-330, 20, u);
    c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createLinearGradient(-60, yb - 60, 60, yb + 30); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(0.5, `rgba(255,240,180,${0.55 * e})`); gr.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = gr; c.fillRect(-90, -340, 180, 360); c.restore();
  }
  function drawStatue(o) {
    const sh = o.socle || 0, c = cx_();
    if (sh > 0) {                                                                // socle de pierre (haut, hors de l'eau)
      pc([[-66, 0, 1], [66, 0, 1], [66, -16, 1], [56, -22, 1], [56, -sh + 22, 1], [66, -sh + 16, 1], [66, -sh, 1], [-66, -sh, 1], [-66, -sh + 16, 1], [-56, -sh + 22, 1], [-56, -22, 1], [-66, -16, 1]], '#B7AE9C', () => {
        for (let y = -sh + 40; y < -24; y += 30) strokePts([[-56, y], [56, y]], 'rgba(80,70,55,0.35)', 1);
        hatch([[20, -sh], [66, -sh], [66, 0], [20, 0]], 0.8, 4, 0.25); shade(-40, 0, 60, 0, 0.25, [-70, -sh - 5, 70, 5]);
      }, 7601);
      c.save(); c.translate(0, -sh);
    }
    const gl = () => { statueGlint(o); };
    const pnt = (extra) => () => { if (extra) extra(); hatch([[14, -330], [70, -330], [70, 0], [14, 0]], 0.9, 3.6, 0.28, 1.05, '90,60,20'); shade(-50, 0, 60, 0, 0.32, [-80, -340, 80, 10], '90,60,20'); gl(); };
    pc([[0, -310], [18, -304], [28, -286], [32, -258], [48, -232], [58, -182], [60, -112], [54, -90, 1], [-54, -90, 1], [-60, -112], [-58, -182], [-48, -232], [-32, -258], [-28, -286], [-18, -304]], OR_S.d, pnt(), 7602, { texA: 0.3 });   // voile, derrière
    pc([[-34, -14, 1], [34, -14, 1], [40, -70], [46, -140], [44, -196], [34, -232], [16, -246], [-16, -246], [-34, -232], [-44, -196], [-46, -140], [-40, -70]], OR_S.base, pnt(() => {
      for (const x of [-26, -12, 2, 16, 30]) strokePts([[x * 0.8, -226], [x * 0.95, -120], [x * 1.05, -18]], 'rgba(110,75,20,0.45)', 1.3);
      strokePts([[-40, -168], [-10, -160], [12, -160], [40, -168]], 'rgba(110,75,20,0.6)', 1.6);                       // cordelière
      strokePts([[-6, -240], [-10, -150]], 'rgba(255,240,190,0.45)', 2.2);
    }), 7603, { texA: 0.3 });
    pc(ell(-14, -14, 10, 5, 10), OR_S.d, null, 7604); pc(ell(14, -14, 10, 5, 10), OR_S.d, null, 7605);           // pointes des pieds
    pc([[-44, 0, 1], [44, 0, 1], [40, -14], [-40, -14]], OR_S.d, null, 7606);                                     // petite base
    for (const sg of [-1, 1]) {
      pc(ribbon([[sg * 30, -230], [sg * 46, -202], [sg * 60, -160]], 22, 32), OR_S.base, pnt(() => strokePts([[sg * 34, -220], [sg * 56, -164]], 'rgba(110,75,20,0.5)', 1.2)), 7607 + sg);
      pc([[sg * 54, -152], [sg * 72, -150], [sg * 78, -134], [sg * 80, -114], [sg * 74, -112], [sg * 71, -124], [sg * 67, -108], [sg * 60, -110], [sg * 58, -128], [sg * 52, -140]].map((p) => p), OR_S.l, pnt(() => {
        strokePts([[sg * 66, -132], [sg * 70, -114]], 'rgba(110,75,20,0.5)', 1); strokePts([[sg * 72, -134], [sg * 76, -116]], 'rgba(110,75,20,0.5)', 1);
      }), 7610 + sg);                                                                                                 // mains ouvertes vers le bas
    }
    pc(ell(0, -266, 11, 15, 14), OR_S.l, pnt(() => { strokePts([[-5, -268], [-2, -268]], 'rgba(110,75,20,0.6)', 1.2); strokePts([[3, -268], [6, -268]], 'rgba(110,75,20,0.6)', 1.2); strokePts([[-2, -256], [3, -256]], 'rgba(110,75,20,0.5)', 1); }), 7613);   // visage paisible, yeux baissés
    pc([[0, -310], [16, -304], [25, -288], [25, -262], [20, -246], [12, -242], [14, -262], [12, -280], [0, -286], [-12, -280], [-14, -262], [-12, -242], [-20, -246], [-25, -262], [-25, -288], [-16, -304]], OR_S.base, pnt(() => strokePts([[-18, -296], [0, -304], [18, -296]], 'rgba(255,240,190,0.5)', 1.6)), 7614);
    const e = clamp(o.eclat == null ? 0.5 : o.eclat);
    if (e > 0 && !SIL()) {                                                       // éclats ronds (jamais en croix)
      const g = M.tg(o.t || 0);
      for (const [i, [x, y]] of [[-20, -280], [30, -190], [-36, -120], [10, -60]].entries()) { const k = Math.max(0, Math.sin(g * 1.7 + i * 1.9)); glow(x, y, 26, '255,236,170', 0.5 * e * k * k); }
      glow(0, -170, 190, '255,215,120', 0.12 * e);
    }
    const dr = clamp(o.drap || 0);
    if (dr > 0.01) {                                                             // bâche de fondeur : épouse la forme, retombe en plis ; tirée vers +x quand drap baisse
      const u = 1 - dr; c.save(); c.globalAlpha *= smooth(0, 0.3, dr); c.translate(230 * u, -50 * u * (1 - u) - 10 * u); c.rotate(0.55 * u);
      pc([[-74, 6, 1], [74, 6, 1], [66, -50], [78, -130], [66, -200], [48, -250], [30, -298], [0, -324], [-30, -298], [-48, -250], [-66, -200], [-78, -130], [-66, -50]], '#B5AC98', () => {
        for (const x of [-50, -28, -8, 12, 34, 56]) strokePts([[x * 0.4, -300], [x * 0.9, -160], [x, 4]], 'rgba(80,70,55,0.45)', 1.4);
        strokePts([[-70, -110], [70, -104]], '#6b5234', 2.6);                                                       // corde
        hatch([[10, -330], [80, -330], [80, 10], [10, 10]], 0.8, 4, 0.3); shade(-60, 0, 70, 0, 0.3, [-90, -340, 90, 10]);
      }, 7620, { texA: 0.5 });
      c.restore();
    }
    if (sh > 0) c.restore();
  }
  LYO.statue = (x, y, s, o) => acc('statue', x, y, s == null ? 1 : s, o || {}, drawStatue);

  // ------------------------------------------------------------ nuage de pluie (carton en volutes, pendu à deux fils ; SANS visage)
  function nuageShape(dark) {
    const pts = [], n = 120;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, sy = Math.sin(a), top = sy < 0;
      const bump = top ? 1 + 0.13 * Math.abs(Math.sin(a * 3.5 + 0.7)) + 0.05 * Math.sin(a * 7 + 1) : 1 + 0.06 * Math.abs(Math.sin(a * 6.5 + 0.3));
      pts.push([Math.cos(a) * 196 * bump, sy * (top ? 96 : 62) * bump + (top ? 0 : 8)]);
    }
    pc(pts, dark ? '#5E6670' : '#8E979F', () => {
      const R = M.rng(dark ? 77 : 78);
      for (let k = 0; k < 7; k++) {                                              // volutes en spirale
        const cx = -150 + k * 50 + R() * 14, cy = -30 + R() * 30 - (k % 2) * 18, sp = [];
        for (let j = 0; j < 22; j++) { const a = j * 0.42, r = 4 + j * 1.5; sp.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8]); }
        strokePts(sp, dark ? 'rgba(200,210,220,0.35)' : 'rgba(240,244,248,0.5)', 1.6);
      }
      for (let k = 0; k < 6; k++) strokePts(ep(-150 + k * 60, 40, 34, 18, 8, PI * 1.1, PI * 1.9), 'rgba(30,35,45,0.35)', 1.3);
      shade(0, -80, 0, 70, 0.4, [-240, -130, 240, 90]); hatch([[-220, 10], [220, 10], [220, 90], [-220, 90]], 0.4, 4.6, 0.25);
    }, dark ? 7701 : 7702, { texA: 0.45 });
  }
  // pluie de papier : streaks + éclaboussures au sol ; o : { x0, x1, y0, y1 (sol), k 0..1, seed, vent (px de biais), col }
  LYO.pluie = function (t, o) {
    if (SIL()) return; const k = clamp(o.k == null ? 1 : o.k); if (k <= 0) return;
    const c = cx_(), g = M.tg(t), x0 = o.x0, x1 = o.x1, y0 = o.y0 == null ? 160 : o.y0, y1 = o.y1 == null ? ST.back + 34 : o.y1, L = y1 - y0, sd = o.seed || 1, v = o.vent == null ? 10 : o.vent;
    const n = Math.round(60 * k * (x1 - x0) / 340 * Math.max(0.5, L / 900));
    c.save();
    for (let i = 0; i < n; i++) {
      const sp = 1250 + 420 * hash(i * 5.7 + sd), y = y0 + ((g * sp + hash(i * 9.3 + sd) * L) % L), x = x0 + hash(i * 3.1 + sd) * (x1 - x0) - v * (y - y0) / 300;
      const len = 26 + 14 * hash(i * 1.7 + sd);
      fillPts([[x, y], [x + 2.6, y], [x + 2.6 - v * len / 300, y + len], [x - v * len / 300, y + len]], o.col || 'rgba(214,226,238,0.8)', 0, 0);
      strokePts([[x + 2.6, y], [x + 2.6 - v * len / 300, y + len]], 'rgba(60,70,90,0.35)', 0.8);
    }
    for (let j = 0; j < Math.round(n / 3); j++) {                                // éclaboussures
      const per = 0.5, ph = hash(j * 2.3 + sd) * per, cyc = Math.floor((g + ph) / per), u = ((g + ph) % per) / per;
      const x = x0 + hash(j * 13.1 + cyc * 0.77 + sd) * (x1 - x0), a = 0.8 * (1 - u);
      strokePts(ep(x, y1, 4 + 12 * u, 2 + 4 * u, 8, PI, TAU), `rgba(214,226,238,${a})`, 1.3);
      dot(x - 6 * u, y1 - 10 * u + 12 * u * u, 1.6, `rgba(214,226,238,${a})`); dot(x + 7 * u, y1 - 12 * u + 14 * u * u, 1.6, `rgba(214,226,238,${a})`);
    }
    c.restore();
  };
  // LYO.nuage(t,x,y,s,{pluie, gonfle, gris, sol, fils, dessinePluie, vent}) ; (x,y) = centre du nuage ; 420 × 220 px à s 1
  LYO.nuage = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const K = LYO.K, c = cx_(), g = M.tg(t);
    const gf = o.gonfle == null ? 0.5 : o.gonfle, sc = s * (1 + 0.035 * gf * Math.sin(g * 1.4)), r = 0.012 * Math.sin(g * 0.8);
    if (o.fils !== false && !SIL()) for (const sx of [-118, 112]) strokePts([[x + sx * s, y - 88 * s], [x + sx * s * 1.02 + 6, 0]], 'rgba(20,18,16,0.85)', 1.3);
    c.save(); c.translate(x, y); c.rotate(r); c.scale(sc, sc);
    c.drawImage(K.nuage.clair, -K.nuage.clair.width / 2, -K.nuage.clair.height / 2);
    const gr = clamp(o.gris || 0); if (gr > 0) { c.globalAlpha *= gr; c.drawImage(K.nuage.sombre, -K.nuage.sombre.width / 2, -K.nuage.sombre.height / 2); }
    c.restore();
    const p = clamp(o.pluie || 0);
    if (p > 0 && o.dessinePluie !== false) LYO.pluie(t, { x0: x - 170 * s, x1: x + 170 * s, y0: y + 56 * s, y1: o.sol == null ? ST.back + 34 : o.sol, k: p, seed: 5, vent: o.vent });
    return { bas: y + 62 * s, x0: x - 170 * s, x1: x + 170 * s };
  };

  // ------------------------------------------------------------ guirlande de lampions officiels (papier plissé ocre / rouge / bleu ardoise)
  const LAMP_COL = ['#C08A3E', '#A33B2E', '#4F6378'];
  LYO.lampions = function (t, x0, x1, y, o) {
    o = o || {}; const g = M.tg(t), c = cx_(), tr = clamp(o.trempe || 0), al = clamp(o.allume || 0) * (1 - tr), y1 = o.y1 == null ? y : o.y1, s = o.s || 1, nuit = clamp(o.ombre || 0);
    const n = o.n || Math.max(2, Math.round((x1 - x0) / (64 * s))), sag = (o.fleche == null ? 0.16 * (x1 - x0) : o.fleche) * (1 + 0.45 * tr), sway = 4 * Math.sin(g * 0.9) * (1 - 0.5 * tr);
    const at = (u) => [lerp(x0, x1, u), lerp(y, y1, u) + sag * 4 * u * (1 - u) + sway * Math.sin(PI * u)];
    const rope = []; for (let i = 0; i <= 20; i++) rope.push(at(i / 20));
    strokePts(rope, '#3a2e22', 1.8);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, p = at(u), sw = (0.06 * Math.sin(g * 1.6 + i * 1.3) + 0.03 * Math.sin(g * 2.9 + i)) * (1 - 0.6 * tr) + tr * 0.16 * (hash(i * 3.3) - 0.5);
      const lit = smooth(i / n - 0.02, i / n + 0.12, al * 1.12), col = LAMP_COL[i % 3];
      c.save(); c.translate(p[0], p[1]); c.rotate(sw); c.scale(s, s);
      strokePts([[0, 0], [0, 10]], '#3a2e22', 1.2);
      const wq = 1 - 0.18 * tr, hq = 1 + 0.3 * tr, pts = [[-17, -20], [17, -20], [20, -10], [21, 0], [20, 10], [17, 20], [-17, 20], [-20, 10], [-21, 0], [-20, -10]].map(([a, b]) => [a * wq + (b > 0 ? tr * 5 * b / 20 : 0), b * hq + (b > 10 ? tr * 8 : 0)]);
      c.translate(0, 10 + 24 * hq);
      pc(pts, tr > 0 ? M.mixc(col, '#3d3a3a', 0.45 * tr) : col, () => {
        for (let yy = -16; yy <= 16; yy += 6) strokePts(ep(0, yy * hq, 20 * wq, 3, 8, 0, PI), 'rgba(40,25,15,0.4)', 1);
        if (nuit > 0) fillPts(box(-30, -40, 30, 40), `rgba(16,20,44,${0.55 * nuit * (1 - lit)})`);
        if (lit > 0 && !SIL()) { const gg = cx_().createRadialGradient(0, 4, 2, 0, 0, 26); gg.addColorStop(0, `rgba(255,236,170,${0.85 * lit})`); gg.addColorStop(1, `rgba(255,190,90,${0.15 * lit})`); cx_().save(); cx_().globalCompositeOperation = 'lighter'; cx_().fillStyle = gg; cx_().fillRect(-30, -40, 60, 80); cx_().restore(); }
      }, 7800 + i, { texA: 0.4 });
      fillPts(box(-11 * wq, -24 * hq, 11 * wq, -19 * hq), '#2b2420'); fillPts(box(-9 * wq, 19 * hq, 9 * wq, 24 * hq + tr * 6), '#2b2420');
      if (lit > 0) glow(0, 0, 70, '255,190,100', 0.35 * lit);
      if (tr > 0.2 && !SIL()) { const uu = (g * 1.2 + hash(i * 5.1)) % 1; fillPts(ell(2, 26 * hq + uu * 70, 2, 3.4, 8), `rgba(190,215,235,${0.8 * tr * (1 - uu)})`); }
      c.restore();
    }
  };

  // =====================================================================
  // DÉCORS — aides de pré-rendu
  // =====================================================================
  const K = (LYO.K = {});
  const FL = (w, h, fn, sh) => { const cv = M.cutFlat(w, h, w / 2, h - 10, fn); cv.padB = 10; return sh === false ? cv : M.withShadow(cv, 8); };
  function les(h) { for (let x = 180; x < W; x += 180) strokePts([[x, 0], [x + 2, h]], 'rgba(90,70,50,0.10)', 1.2); }
  function pierres(x0, y0, x1, y1, col, seed, joint) {
    pc(box(x0, y0, x1, y1), col, () => {
      const R = M.rng(seed), jc = joint || 'rgba(70,55,40,0.22)';
      for (let y = y0 + 24, r = 0; y < y1; y += 26, r++) { strokePts([[x0, y], [x1, y]], jc, 1); for (let x = x0 + (r % 2 ? 26 : 0) + 4; x < x1; x += 52) strokePts([[x, y - 26], [x, y]], jc, 0.9); }
      for (let i = 0; i < (x1 - x0) * (y1 - y0) / 900; i++) dot(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 0.7 + R() * 1.2, R() < 0.5 ? 'rgba(60,45,30,0.25)' : 'rgba(255,248,230,0.3)');
      hatch(null, 0.8, 6, 0.08, 1, P.encre, [x0, y0, x1, y1]);
    }, seed, { texA: 0.5 });
  }
  function corniche(x0, x1, y, col) { pc(box(x0 - 8, y - 12, x1 + 8, y + 3), col, () => { strokePts([[x0 - 8, y - 9], [x1 + 8, y - 9]], 'rgba(255,255,255,0.35)', 1.5); }, 9001 + Math.round(y)); fillPts(box(x0, y + 3, x1, y + 9), 'rgba(30,20,15,0.25)'); }
  function cadre(F, col, opt) {                                                  // encadrement de pierre, ouverture sombre, rebord en saillie
    const x = F.x, r = F.rebord, w = F.w, h = F.h, o = opt || {};
    pc(box(x - w / 2 - 12, r - h - 14, x + w / 2 + 12, r), col, () => { strokePts([[x - w / 2 - 12, r - h - 12], [x + w / 2 + 12, r - h - 12]], 'rgba(255,255,255,0.3)', 1.4); }, 9100 + Math.round(x + r));
    fillPts(box(x - w / 2, r - h, x + w / 2, r), o.fond || '#24232a');
    pc(box(x - 9, r - h - 20, x + 9, r - h - 2), col, null, 9101 + Math.round(x));                           // clé de linteau
    pc(box(x - w / 2 - 18, r, x + w / 2 + 18, r + 12), o.rebord || M.mixc(col, '#6b5f50', 0.25), () => strokePts([[x - w / 2 - 18, r + 2], [x + w / 2 + 18, r + 2]], 'rgba(255,255,255,0.4)', 1.4), 9102 + Math.round(x + r));
    fillPts(box(x - w / 2 - 14, r + 12, x + w / 2 + 14, r + 18), 'rgba(30,20,15,0.25)');
  }
  function geranium(x, y, s) {
    s = s || 1; pc([[x - 14 * s, y, 1], [x + 14 * s, y, 1], [x + 17 * s, y - 20 * s], [x - 17 * s, y - 20 * s]], '#A4583A', () => strokePts([[x - 16 * s, y - 16 * s], [x + 16 * s, y - 16 * s]], 'rgba(255,220,180,0.4)', 1.2), 9200 + Math.round(x));
    const R = M.rng(Math.round(x * 3 + y));
    for (let i = 0; i < 9; i++) fillPts(ell(x + (R() - 0.5) * 34 * s, y - 24 * s - R() * 18 * s, 7 * s, 5 * s, 8), i % 2 ? '#4E6B3A' : '#3E5A30');
    for (let i = 0; i < 6; i++) dot(x + (R() - 0.5) * 30 * s, y - 34 * s - R() * 14 * s, 4 * s, R() < 0.5 ? '#B8322E' : '#D24A3A');
  }
  function volet(F, v, col, sombre) {                                            // deux battants : v 0 fermé → 1 ouvert à plat contre le mur
    const x = F.x, r = F.rebord, w = F.w, h = F.h, a = w / 2;
    for (const sg of [-1, 1]) {
      const hx = x + sg * a, proj = a * Math.cos(clamp(v) * PI * 0.8), x2 = hx - sg * proj;
      const q = [[hx, r - h, 1], [x2, r - h - 4 * Math.sin(v * PI), 1], [x2, r + 4 * Math.sin(v * PI), 1], [hx, r, 1]];
      if (Math.abs(proj) < 2) continue;
      pc(q, proj > 0 ? col : M.mixc(col, '#000000', 0.25), () => { for (let y = r - h + 10; y < r; y += 11) strokePts([[hx, y], [x2, y]], 'rgba(20,20,20,0.35)', 1); }, 9300 + Math.round(x * 2 + sg));
    }
    if (sombre) fillPts(box(x - w / 2 - 2, r - h - 2, x + w / 2 + 2, r + 2), 'rgba(0,0,0,0)');
  }
  function vitres(F, col, barre) {                                               // croisée à petits carreaux
    const x = F.x, r = F.rebord, w = F.w, h = F.h;
    fillPts(box(x - w / 2 + 3, r - h + 3, x + w / 2 - 3, r - 3), col);
    const b = barre || '#e8e2d4';
    strokePts([[x, r - h], [x, r]], b, 3); for (const f of [0.34, 0.67]) strokePts([[x - w / 2, r - h * f], [x + w / 2, r - h * f]], b, 2);
    strokePts([[x - w / 2 + 3, r - h + 3], [x + w / 2 - 3, r - h + 3], [x + w / 2 - 3, r - 3], [x - w / 2 + 3, r - 3], [x - w / 2 + 3, r - h + 3]], b, 2.4);
  }
  function lumiere(F, k, chaud) {                                                // intérieur éclairé (à dessiner après l'assombrissement)
    if (k <= 0.01 || SIL()) return; const c = cx_(), x = F.x, r = F.rebord, w = F.w, h = F.h;
    const g = c.createLinearGradient(0, r - h, 0, r); g.addColorStop(0, `rgba(255,214,130,${0.85 * k})`); g.addColorStop(1, `rgba(214,128,52,${0.9 * k})`);
    c.save(); c.fillStyle = g; c.fillRect(x - w / 2 + 3, r - h + 3, w - 6, h - 6);
    c.fillStyle = `rgba(120,60,30,${0.5 * k})`; c.fillRect(x - w / 2 + 3, r - h + 3, w * 0.16, h - 6); c.fillRect(x + w / 2 - 3 - w * 0.16, r - h + 3, w * 0.16, h - 6);   // rideaux
    c.restore();
    const b = 'rgba(70,40,20,0.8)'; strokePts([[x, r - h], [x, r]], b, 3); for (const f of [0.34, 0.67]) strokePts([[x - w / 2, r - h * f], [x + w / 2, r - h * f]], b, 2);
    glow(x, r - h / 2, Math.max(w, h) * (chaud || 1.1), '255,186,96', 0.32 * k);
  }
  function rangLumignons(t, F, k, n, seed, s) {                                  // lumignons en série sur un rebord (40–60 px)
    if (k <= 0.01) return; s = s || 0.66;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1), x = F.x + (u - 0.5) * (F.w - 30), col = LYO.COULEURS[Math.floor(hash(seed + i * 7.7) * 4)];
      LYO.lumignon(t, x, F.rebord + 1, s, { couleur: col, allume: smooth(i / n * 0.5, i / n * 0.5 + 0.5, k), seed: seed + i });
    }
  }
  function etoiles(t, x0, x1, y0, y1, n, seed, a) {
    if (SIL()) return; const g = M.tg(t);
    for (let i = 0; i < n; i++) { const x = x0 + hash(i * 3.3 + seed) * (x1 - x0), y = y0 + hash(i * 7.1 + seed) * (y1 - y0), k = 0.5 + 0.5 * Math.sin(g * (1.3 + hash(i) * 2) + i); dot(x, y, 1.1 + 1.3 * hash(i * 1.9), `rgba(250,244,220,${(0.35 + 0.6 * k) * a})`); }
  }
  function chat(x, y, s, dir, ph, col) {                                          // chat en carton qui marche (ph = phase de pas)
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s);
    pc([[-30, -14], [-10, -22], [20, -22], [30, -26], [34, -38, 1], [38, -30], [44, -38, 1], [46, -24], [40, -14], [26, -6], [-28, -6], [-36, -4], [-50, -18], [-54, -34, 1], [-46, -22]], col || '#2b2622', null, 9400);
    for (const [lx, a] of [[-22, Math.sin(ph)], [-14, -Math.sin(ph)], [18, -Math.sin(ph)], [26, Math.sin(ph)]]) fillPts(ribbon([[lx, -8], [lx + 6 * a, 2]], 5, 4), col || '#2b2622');
    dot(36, -28, 1.6, '#d8c050');
    c.restore();
  }
  function pigeon(x, y, s, dir, vol, ph) {                                        // vol 0 posé → 1 en vol
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s);
    pc([[-16, -4], [-4, -12], [8, -12], [14, -18], [20, -16], [24, -12, 1], [16, -8], [12, 0], [-6, 4], [-20, 2], [-28, -2]], '#8d929c', () => fillPts([[8, -12], [14, -18], [16, -8], [10, -4]], '#6f8a7a'), 9410);
    const a = vol > 0 ? Math.sin(ph) : 0;
    pc([[-6, -8], [10, -10], [-4 - 10 * vol, -10 - 26 * vol * (0.5 + 0.5 * a)], [-18, -6]], '#7a7f88', null, 9411);
    c.restore();
  }
  function flaque(x, y, w, t, k, seed) {                                         // flaque luisante qui frémit
    if (SIL()) return; const g = M.tg(t);
    fillPts(ell(x, y, w, w * 0.16, 16), 'rgba(120,140,160,0.45)');
    strokePts([[x - w * 0.5, y - 1], [x + w * 0.1, y - 2]], 'rgba(240,248,255,0.55)', 1.3);
    for (let i = 0; i < 3; i++) { const u = ((g * 0.9 + i / 3 + hash(seed)) % 1); strokePts(ep(x + (hash(seed + i) - 0.5) * w, y, 3 + u * w * 0.35, (3 + u * w * 0.35) * 0.18, 10, 0, TAU), `rgba(235,244,252,${0.6 * k * (1 - u)})`, 1); }
  }
  function flocons(t, k, seed, y1) {                                             // neige de papier qui tombe
    if (k <= 0 || SIL()) return; const g = M.tg(t), n = Math.round(90 * k), H = (y1 || ST.back) - 150;
    for (let i = 0; i < n; i++) {
      const sp = 70 + 50 * hash(i * 2.1 + seed), y = 150 + ((g * sp + hash(i * 4.3 + seed) * H) % H), x = hash(i * 6.7 + seed) * W + Math.sin(g * 0.9 + i) * 22, r = 2.4 + 2.6 * hash(i * 8.9);
      fillPts(ell(x, y, r, r * (0.6 + 0.4 * Math.cos(g * 3 + i)), 8), 'rgba(250,250,246,0.92)'); dot(x + 1, y + 1, r * 0.5, 'rgba(120,130,150,0.25)');
    }
  }
  function voileNuit(a, col) { if (a <= 0.003 || SIL()) return; const c = cx_(); c.save(); c.fillStyle = `rgba(${col || '16,22,48'},${a})`; c.fillRect(0, 0, W, ST.back + 6); c.restore(); }

  // ---------------------------------------------------------------- Fourvière : chapelle de 1852 (clocher carré) et basilique (aujourd'hui)
  function chapelle(x, y, s, sansDome) {                                          // (x,y) = pied du clocher ; clocher carré, petite nef, dôme vide sur le clocher
    const sx = (v) => x + v * s, sy = (v) => y + v * s;
    pc(box(sx(-90), sy(-62), sx(60), sy(0)), '#D8CCB4', () => { for (const v of [-70, -40, 20, 44]) fillPts(ell(sx(v), sy(-30), 5 * s, 11 * s, 10), '#4a4038'); hatch(null, 0.8, 4, 0.12); }, 9501);
    pc([[sx(-96), sy(-60), 1], [sx(66), sy(-60), 1], [sx(46), sy(-92), 1], [sx(-76), sy(-92), 1]], '#8C5E4A', null, 9502);   // toit de la nef
    pc(box(sx(-22), sy(-150), sx(22), sy(0)), '#E0D5BE', () => { fillPts(ell(sx(0), sy(-118), 6 * s, 14 * s, 10), '#3e352e'); strokePts([[sx(-22), sy(-96)], [sx(22), sy(-96)]], 'rgba(90,70,50,0.4)', 1); hatch(null, 0.8, 4, 0.12); }, 9503);
    pc(box(sx(-27), sy(-156), sx(27), sy(-148)), '#CFC3AA', null, 9504);
    if (!sansDome) pc([[sx(-18), sy(-156), 1], [sx(18), sy(-156), 1], [sx(14), sy(-170)], [sx(0), sy(-178)], [sx(-14), sy(-170)]], '#9AA0A0', null, 9505);   // petit dôme vide
    return { top: [x, y - 156 * s] };
  }
  function basilique(x, y, s) {                                                  // silhouette éclairée à quatre tours octogonales, petite au fond
    const sx = (v) => x + v * s, sy = (v) => y + v * s, col = '#F1E6C6';
    pc(box(sx(-70), sy(-58), sx(70), sy(0)), col, () => { for (let v = -50; v <= 50; v += 20) fillPts(ell(sx(v), sy(-30), 4 * s, 9 * s, 8), 'rgba(180,140,70,0.6)'); }, 9511);
    pc([[sx(-46), sy(-58), 1], [sx(46), sy(-58), 1], [sx(0), sy(-82), 1]], col, null, 9512);                    // fronton
    for (const v of [-78, -56, 56, 78]) {
      const hh = Math.abs(v) > 60 ? 108 : 96;
      pc(box(sx(v - 10), sy(-hh), sx(v + 10), sy(0)), Math.abs(v) > 60 ? col : '#E2D3AE', () => fillPts(ell(sx(v), sy(-hh + 26), 3 * s, 8 * s, 8), 'rgba(180,140,70,0.6)'), 9513 + v);
      for (let k = -1; k <= 1; k++) fillPts(box(sx(v + k * 7 - 2.5), sy(-hh - 8), sx(v + k * 7 + 2.5), sy(-hh)), col);   // créneaux
    }
  }
  function colline(c, cols, y0) {                                                // Fourvière : pente boisée, maisons étagées
    const R = M.rng(81), top = [];
    for (let x = -20; x <= W + 20; x += 30) top.push([x, y0 + 110 * Math.pow(Math.abs(x - 540) / 540, 1.4) + 14 * Math.sin(x * 0.013) + R() * 6]);
    pc([[-20, ST.back, 1]].concat(top, [[W + 20, ST.back, 1]]), cols[0], () => {
      for (let i = 0; i < 70; i++) { const x = R() * W, yy = y0 + 40 + R() * 420; fillPts(ell(x, yy, 14 + R() * 16, 10 + R() * 8, 10), R() < 0.5 ? cols[1] : cols[2]); }
      for (let i = 0; i < 26; i++) { const x = 30 + R() * 1020, yy = y0 + 110 + R() * 330, w = 18 + R() * 20; fillPts(box(x, yy, x + w, yy + 18), cols[3]); fillPts([[x - 3, yy], [x + w + 3, yy], [x + w / 2, yy - 10]], cols[4]); }
      hatch(null, 0.9, 5, 0.12, 1, P.encre, [0, y0 - 40, W, ST.back]);
    }, 9520, { drop: false });
  }

  // =====================================================================
  // LIEU C — PLACE AU PIED DE FOURVIÈRE, 1852
  // =====================================================================
  // LYO.FEN : fenêtres de la place (rebord = y écran du DESSUS du rebord ; x = milieu ; w × h = ouverture). Les deux fenêtres « perso » ont
  // corps (x du buste), lum (x où se pose le lumignon / la bougie) et dir (sens du buste).
  const FEN = (LYO.FEN = [
    { id: 'L1a', x: 108, rebord: 1050, w: 116, h: 200 }, { id: 'lyon', x: 282, rebord: 1050, w: 180, h: 244, perso: true, dir: 1, corps: 250, lum: 334 },
    { id: 'L2a', x: 108, rebord: 760, w: 116, h: 186 }, { id: 'L2b', x: 282, rebord: 760, w: 128, h: 186 },
    { id: 'L3a', x: 108, rebord: 512, w: 110, h: 160 }, { id: 'L3b', x: 282, rebord: 512, w: 118, h: 160 },
    { id: 'M1', x: 470, rebord: 1100, w: 106, h: 150, plus: true }, { id: 'M2', x: 612, rebord: 1100, w: 106, h: 150, plus: true },
    { id: 'R2a', x: 806, rebord: 760, w: 128, h: 186 }, { id: 'R3a', x: 806, rebord: 512, w: 118, h: 160 },
    { id: 'R1b', x: 984, rebord: 1050, w: 116, h: 200 }, { id: 'R2b', x: 984, rebord: 760, w: 116, h: 186 }, { id: 'R3b', x: 984, rebord: 512, w: 110, h: 160, plus: true },
    { id: 'orga', x: 806, rebord: 1050, w: 180, h: 244, perso: true, dir: -1, corps: 836, lum: 760 },
  ]);
  FEN.lyon = FEN[1]; FEN.orga = FEN[FEN.length - 1];
  FEN.forEach((F, i) => { F.ordre = i; });                                       // ordre de la cascade (gauche → droite ; l'organisateur en dernier)
  const PLACE = (LYO.PLACE = { guirlandes: [[400, 806, 680, 816, 58], [400, 676, 680, 684, 44]], lanterne: { x: 150, y: 940 }, porche: { x: 836, y: ST.back, w: 150, haut: 1150 },
    porte: { x: 312, y: ST.back }, clocher: { x: 548, y: 628, statue: [548, 472] }, lucarne: { x: 540, y: 852 }, fontaine: { x: 640, y: 1300 } });
  function initPlace() {
    K.placeCiel = {
      jour: M.pre(W, 1000, (c) => { c.fillStyle = lin(0, 0, 0, 1000, [[0, '#a9b3bb'], [0.7, '#cfd1cc'], [1, '#d9d6cc']]); c.fillRect(0, 0, W, 1000); les(1000); }),
      pluie: M.pre(W, 1000, (c) => { c.fillStyle = lin(0, 0, 0, 1000, [[0, '#4e555d'], [0.7, '#737a80'], [1, '#868a8a']]); c.fillRect(0, 0, W, 1000); les(1000); }),
      nuit: M.pre(W, 1000, (c) => { c.fillStyle = lin(0, 0, 0, 1000, [[0, '#26305a'], [0.6, '#3b4a7a'], [1, '#56608a']]); c.fillRect(0, 0, W, 1000); les(1000); }),
    };
    K.placeColline = M.pre(W, ST.back + 6, () => {
      colline(null, ['#7E8A62', '#5f6e48', '#6e7a50', '#d8cdb5', '#9a5e44'], 620);
      chapelle(PLACE.clocher.x, PLACE.clocher.y, 1, true);
    });
    K.placeMilieu = M.pre(W, ST.back + 6, () => {                                  // maison basse du milieu : toit, lucarne, cheminées, fontaine
      pierres(392, 866, 688, ST.back + 6, '#C7B593', 9601);
      pc([[386, 870, 1], [694, 870, 1], [670, 830], [410, 830]], '#8A5A44', () => { for (let x = 410; x < 680; x += 14) strokePts([[x, 834], [x - 2, 868]], 'rgba(50,25,15,0.35)', 1); }, 9602);
      for (const x of [452, 650]) pierres(x - 12, 772, x + 12, 836, '#A9967A', 9603 + x);
      const L = PLACE.lucarne; pc([[L.x - 34, 870, 1], [L.x + 34, 870, 1], [L.x + 34, 806, 1], [L.x, 782, 1], [L.x - 34, 806, 1]], '#BFAE8E', null, 9605);
      fillPts(box(L.x - 20, 812, L.x + 20, 856), '#24232a');
      for (const F of FEN.filter((f) => f.id[0] === 'M')) cadre(F, '#D8C8A6');
      corniche(392, 688, 1180, '#D8C8A6');
      const fo = PLACE.fontaine;                                                   // fontaine murale : mascaron, vasque
      pc([[fo.x - 50, 1395, 1], [fo.x + 50, 1395, 1], [fo.x + 50, 1200, 1], [fo.x, 1176, 1], [fo.x - 50, 1200, 1]], '#BDB29E', () => { fillPts(ell(fo.x, 1236, 14, 16, 12), '#9a8f7c'); dot(fo.x, 1250, 3.5, '#4a4038'); hatch(null, 0.8, 4, 0.15); }, 9606);
      pc([[fo.x - 80, 1310, 1], [fo.x + 80, 1310, 1], [fo.x + 70, 1360], [fo.x + 40, 1376], [fo.x - 40, 1376], [fo.x - 70, 1360]], '#A99E8A', () => { fillPts(box(fo.x - 74, 1310, fo.x + 74, 1318), '#7d95a0'); hatch(null, 0.8, 4, 0.18); }, 9607);
      pc(box(fo.x - 24, 1376, fo.x + 24, 1395), '#968b78', null, 9608);
    });
    const facade = (x0, x1, col, seedF, side) => {
      pierres(x0, 336, x1, ST.back + 6, col, seedF);
      pc([[x0 - 10, 340, 1], [x1 + 10, 340, 1], [x1 + 10, 300, 1], [x0 - 10, 300, 1]], '#8A5A44', null, seedF + 1);   // avant-toit
      for (const y of [560, 808, 1100]) corniche(x0, x1, y, M.mixc(col, '#ffffff', 0.18));
      for (const xc of side < 0 ? [60, 330] : [736, 1040]) { pierres(xc - 14, 248, xc + 14, 312, '#A9967A', seedF + xc); }
    };
    K.placeFacades = M.pre(W, ST.back + 6, () => {
      facade(-10, 400, '#CDB892', 9610, -1); facade(680, W + 10, '#BCA88C', 9620, 1);
      for (const F of FEN.filter((f) => f.id[0] !== 'M')) cadre(F, F.x < 540 ? '#E0D0AE' : '#D6C6A8');
      // rez-de-chaussée gauche : soierie (vitrine à petits carreaux), enseigne à navette sans lettre, porte de la Lyonnaise
      pc(box(54, 1170, 236, 1340), '#5a3a2a', () => { fillPts(box(64, 1180, 226, 1330), '#3c4048'); for (let x = 64; x < 226; x += 27) strokePts([[x, 1180], [x, 1330]], '#c9b892', 2); for (let y = 1180; y < 1330; y += 30) strokePts([[64, y], [226, y]], '#c9b892', 2); }, 9630);
      for (const [i, cl] of ['#8E2B2B', '#3E5F9C', '#C98A2B', '#4E6B4F'].entries()) fillPts(ribbon([[78 + i * 38, 1300], [92 + i * 38, 1250], [84 + i * 38, 1214]], 14, 10), cl);   // coupons de soie en vitrine
      strokePts([[236, 1118], [306, 1118]], '#2a2420', 3.2); strokePts([[240, 1118], [258, 1100]], '#2a2420', 2);
      for (const x of [250, 296]) strokePts([[x, 1118], [x, 1132]], '#2a2420', 1.4);
      pc(box(238, 1132, 308, 1180), '#5E3A2A', () => { strokePts([[240, 1135], [306, 1135]], 'rgba(255,220,170,0.3)', 1.2);
        fillPts([[244, 1156], [258, 1148], [288, 1148], [302, 1156, 1], [288, 1164], [258, 1164]], '#C9A24A'); fillPts(box(264, 1152, 282, 1160), '#7a5a2a');
        strokePts([[270, 1156], [276, 1156]], '#e8d8a8', 2); strokePts([[302, 1156], [306, 1170], [296, 1176]], '#8E2B2B', 1.4); }, 9631);   // enseigne de soierie : navette à fil rouge, sans lettre
      const D = PLACE.porte; pc([[D.x - 46, ST.back + 4, 1], [D.x + 46, ST.back + 4, 1], [D.x + 46, 1236, 1]].concat(ep(D.x, 1236, 46, 46, 8, 0, -PI).slice(1, -1), [[D.x - 46, 1236, 1]]), '#4E3526', () => { for (const x of [-24, 0, 24]) strokePts([[D.x + x, 1200], [D.x + x, ST.back]], 'rgba(20,10,5,0.4)', 1.4); dot(D.x + 30, 1300, 3, '#b08d45'); }, 9632);
      // rez-de-chaussée droit : grand porche à arc (là où rentre l'organisateur)
      const Pq = PLACE.porche; pc([[Pq.x - 84, ST.back + 4, 1], [Pq.x + 84, ST.back + 4, 1], [Pq.x + 84, Pq.haut + 76, 1]].concat(ep(Pq.x, Pq.haut + 76, 84, 84, 10, 0, -PI).slice(1, -1), [[Pq.x - 84, Pq.haut + 76, 1]]), '#D6C6A8', null, 9633);
      pc([[Pq.x - 70, ST.back + 4, 1], [Pq.x + 70, ST.back + 4, 1], [Pq.x + 70, Pq.haut + 84, 1]].concat(ep(Pq.x, Pq.haut + 84, 70, 70, 10, 0, -PI).slice(1, -1), [[Pq.x - 70, Pq.haut + 84, 1]]), '#3a2a20', () => { for (const x of [-46, -16, 16, 46]) strokePts([[Pq.x + x, Pq.haut + 40], [Pq.x + x, ST.back]], 'rgba(120,90,60,0.4)', 2); }, 9634);
      // géraniums et linge rentré (corde à linge vide, pinces, un torchon oublié)
      for (const id of ['L1a', 'L2b', 'R2a', 'R1b', 'L3a']) { const F = FEN.find((f) => f.id === id); geranium(F.x - F.w / 2 + 20, F.rebord, 0.9); geranium(F.x + F.w / 2 - 20, F.rebord, 0.8); }
      strokePts(qbez([170, 690], [195, 720], [222, 690], 10), '#4a3e30', 1.4);
      for (const x of [180, 196, 212]) fillPts(box(x - 1.5, 700, x + 1.5, 712), '#8a6a44');
      pc([[200, 704], [214, 702], [216, 734], [202, 738]], '#E6DEC8', null, 9635);
    });
    K.placeAvant = M.pre(W, ST.back + 6, () => {                                  // premier plan : réverbère à huile, borne, charrette à bras
      const Lx = PLACE.lanterne.x;
      pc(ribbon([[Lx, ST.back + 4], [Lx, 990]], 12, 8), '#2E3330', () => strokePts([[Lx - 2, ST.back], [Lx - 2, 996]], 'rgba(255,255,255,0.2)', 1.2), 9640);
      pc(box(Lx - 18, ST.back - 30, Lx + 18, ST.back + 4), '#2E3330', null, 9641);
      pc([[Lx - 26, 990, 1], [Lx + 26, 990, 1], [Lx + 32, 920, 1], [Lx - 32, 920, 1]], '#2E3330', () => { fillPts([[Lx - 20, 984], [Lx + 20, 984], [Lx + 25, 926], [Lx - 25, 926]], 'rgba(220,210,170,0.35)'); strokePts([[Lx, 926], [Lx, 984]], '#2E3330', 2); }, 9642);
      pc([[Lx - 36, 922, 1], [Lx + 36, 922, 1], [Lx, 892, 1]], '#2E3330', null, 9643); dot(Lx, 888, 5, '#2E3330');
      pc([[892, ST.back + 4, 1], [928, ST.back + 4, 1], [926, 1340], [910, 1326], [894, 1340]], '#A49A88', () => hatch(null, 0.8, 4, 0.2), 9644);   // borne
      pc([[940, 1330, 1], [1090, 1316, 1], [1090, 1350, 1], [940, 1362, 1]], '#7a5532', () => { for (let x = 950; x < 1090; x += 22) strokePts([[x, 1330], [x, 1360]], 'rgba(40,25,15,0.4)', 1); }, 9645);   // charrette à bras
      pc(ribbon([[940, 1346], [890, 1300]], 6, 6), '#6b4526', null, 9646);
      pc(ell(1010, 1366, 30, 30, 18), '#5a3c24', () => { for (let a = 0; a < 6; a++) strokePts([[1010, 1366], [1010 + 26 * Math.cos(a), 1366 + 26 * Math.sin(a)]], '#3a2818', 2); }, 9647);
      for (const [x, y] of [[960, 1316], [1000, 1310]]) pc([[x - 20, y], [x + 20, y], [x + 16, y - 26], [x - 16, y - 26]], '#9a8a6a', null, 9648 + x);   // sacs
    });
    K.solPave = M.pre(W, 70, () => {
      const R = M.rng(8852), poly = [[0, 0, 1], [W, 0, 1], [W, 46, 1], [0, 46, 1]];
      fillPts(poly, '#6f7178');
      for (let row = 0; row < 3; row++) for (let x = -20 + row * 14; x < W; x += 42) fillPts(rrect(x, 3 + row * 14, x + 38, 15 + row * 14, 4), row % 2 ? '#646872' : '#7c808a');
      for (let i = 0; i < 200; i++) dot(R() * W, R() * 44, 0.8, 'rgba(255,255,255,0.18)');
    });
  }
  // LYO.place1852(t, { pluie, soir, fenetres, neige, chapelle, lampions, lampionsO, volets, ouvre:{lyon, orga, <id>}, plus, tous, gouttes, claque, chat, pigeon, eclat })
  LYO.place1852 = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t);
    const pl = clamp(o.pluie || 0), so = clamp(o.soir || 0), ne = clamp(o.neige || 0), fe = clamp(o.fenetres || 0), ch = clamp(o.chapelle || 0), plus = clamp(o.plus || 0);
    // ciel : jour gris → pluie → nuit bleue
    c.drawImage(K.placeCiel.jour, 0, 0);
    if (pl > 0) { c.save(); c.globalAlpha = pl * (1 - so); c.drawImage(K.placeCiel.pluie, 0, 0); c.restore(); }
    if (so > 0) { c.save(); c.globalAlpha = so; c.drawImage(K.placeCiel.nuit, 0, 0); c.restore(); }
    if (so < 0.9) { c.save(); c.globalAlpha = 1 - so; M.nuages(t, { y0: 330, y1: 520, n: 3, vit: 10 + 14 * pl, seed: 41, col: pl > 0.3 ? '#9aa0a6' : '#e6e4dc', brume: 0.2 }); c.restore(); }
    if (pl < 0.5 && so < 0.6) M.oiseaux(t, { x0: 1100, x1: -80, y: 470, t0: 1, dur: 12, n: 3, s: 0.5, seed: 9, boucle: true, col: '#6f7480', brume: 0.3 });
    c.drawImage(K.placeColline, 0, 0);
    const S = PLACE.clocher.statue; LYO.statue(S[0], S[1], 0.4, { eclat: lerp(0.6, 1, ch), t });
    for (const x of [452, 650]) M.fumee(t, { x, y: 770, s: 0.45, n: 5, haut: 200, vent: 30 + 20 * pl, col: '#cfc8bc', a: 0.55 * (1 - pl * 0.6), seed: x });
    c.drawImage(K.placeMilieu, 0, 0);
    c.drawImage(K.placeFacades, 0, 0);
    // fenêtres, passe A : vitres et volets (assombris ensuite avec le reste)
    const ouvre = o.ouvre || {}, N = FEN.length, base = clamp(o.volets || 0);
    const litK = (F) => (F.plus && !o.tous ? plus * fe : 1) * smooth(F.ordre / N, (F.ordre + 1.6) / N, fe * (N + 1.6) / N);
    const etat = FEN.map((F) => { const l = F.perso && !o.tous ? (ouvre[F.id] != null ? clamp(ouvre[F.id]) * litK(F) : litK(F)) : litK(F); const v = ouvre[F.id] != null ? clamp(ouvre[F.id]) : Math.max(base, smooth(0, 0.35, l)); return { F, l, v }; });
    const clq = o.claque != null ? clamp(o.claque) : -1;
    for (const E of etat) {
      let v = E.v; if (E.F.id === 'L3b' && clq >= 0) v = clq < 0.6 ? lerp(1, 0, easeOut(clq / 0.6)) : Math.abs(Math.sin((clq - 0.6) * 18)) * 0.08 * (1 - clq);
      if (v > 0.02) vitres(E.F, M.mixc('#8d9aa5', '#1d2336', so));
      volet(E.F, v, E.F.x < 540 ? '#5E7A6A' : '#7A5240');
    }
    if (o.lampions) for (const [i, G] of PLACE.guirlandes.entries()) { const lo = Array.isArray(o.lampionsO) ? o.lampionsO[i] || {} : o.lampionsO || {}; c.save(); c.globalAlpha *= clamp(o.lampions); LYO.lampions(t, G[0], G[2], G[1], Object.assign({ y1: G[3], fleche: G[4], ombre: so }, lo)); c.restore(); }
    // fontaine : filet d'eau
    if (!SIL()) { const fo = PLACE.fontaine; for (let i = 0; i < 6; i++) { const u = ((g * 1.8 + i / 6) % 1); dot(fo.x + 4 + u * 10, 1252 + u * 60, 2.2, `rgba(200,220,235,${0.8 * (1 - u * 0.5)})`); } strokePts([[fo.x + 2, 1252], [fo.x + 8, 1280], [fo.x + 12, 1312]], 'rgba(200,220,235,0.6)', 2.4); }
    c.drawImage(K.placeAvant, 0, 0);
    // neige posée (toits, corniches, rebords)
    if (ne > 0 && !SIL()) { c.save(); c.globalAlpha = ne; for (const [x0, x1, y] of [[-10, 410, 300], [670, W + 10, 300], [386, 694, 828], [-10, 410, 548], [-10, 410, 796], [-10, 410, 1088], [670, W, 548], [670, W, 796], [670, W, 1088], [392, 688, 1168]]) fillPts([[x0, y + 2], [x1, y + 2], [x1, y - 5], [x0 + (x1 - x0) * 0.5, y - 9], [x0, y - 5]], '#f4f4f0'); for (const F of FEN) fillPts(box(F.x - F.w / 2 - 18, F.rebord - 5, F.x + F.w / 2 + 18, F.rebord + 1), '#f4f4f0'); c.restore(); }
    // assombrissement : pluie, soir, nuit
    voileNuit(0.24 * pl * (1 - so), '40,46,56'); voileNuit(0.5 * so);
    if (so > 0.3) etoiles(t, 400, 690, 170, 560, 26, 3, smooth(0.3, 1, so) * (1 - pl));
    // passe B : lumière des fenêtres, lumignons sur les rebords
    for (const E of etat) {
      if (E.v < 0.4) continue;
      lumiere(E.F, E.l * smooth(0.4, 0.9, E.v));
      if (!E.F.perso || o.tous) rangLumignons(t, E.F, E.l, E.F.w > 150 ? 3 : 2, E.F.ordre * 13 + 1, 0.66);
    }
    // chapelle éclairée sur la colline
    if (ch > 0) { const Cl = PLACE.clocher; glow(Cl.x, Cl.y - 60, 170, '255,200,120', 0.35 * ch); for (const v of [-70, -40, 20, 44]) dot(Cl.x + v, Cl.y - 30, 4.5, `rgba(255,214,140,${ch})`); dot(Cl.x, Cl.y - 118, 5, `rgba(255,214,140,${ch})`); }
    // lanterne de rue
    const L = PLACE.lanterne; M.flamme(t, { x: L.x, y: L.y + 30, s: 0.85, lueur: true, r: 90 + 80 * so, seed: 61 }); glow(L.x, L.y + 10, 160, '255,190,100', 0.12 + 0.25 * so);
    // gouttières : gouttes qui tombent après la pluie
    const gt = o.gouttes != null ? clamp(o.gouttes) : pl;
    if (gt > 0 && !SIL()) for (const [i, x] of [40, 230, 394, 690, 900, 1040].entries()) { const u = ((g * 1.1 + hash(i * 2.7)) % 1), y = 304 + u * (ST.back - 304); if (u < 0.97) fillPts(ell(x, y, 2.2, 4, 8), `rgba(200,220,235,${0.85 * gt})`); }
    // événements : chat qui rentre par la lucarne (p4), pigeon qui s'envole d'un rebord (p5)
    if (o.chat != null && o.chat > 0 && o.chat < 1) { const k = clamp(o.chat), Lu = PLACE.lucarne, x = lerp(670, Lu.x + 6, smooth(0, 0.75, k)), y = lerp(832, 850, smooth(0, 0.75, k)), sc = 0.7 * (1 - smooth(0.78, 1, k)); if (sc > 0.05) chat(x, y, sc, -1, g * 9, '#1f1c1a'); }
    if (o.pigeon != null && o.pigeon < 1) { const k = clamp(o.pigeon), F = FEN.find((f) => f.id === 'R2a'), u = easeOut(smooth(0.1, 1, k)); pigeon(F.x - 30 - 260 * u, F.rebord - 2 - 260 * u + 40 * Math.sin(u * PI), 1.4, -1, smooth(0, 0.15, k), g * 30); }
    if (pl > 0) LYO.pluie(t, { x0: -40, x1: W + 40, y0: 150, y1: ST.back + 30, k: pl * 0.9, seed: 31, vent: 20 });
    flocons(t, ne, 7);
  };
  // après M.drawFloor : pavés luisants, flaques qui frémissent, reflets des fenêtres, neige au sol
  LYO.place1852Sol = function (t, o) {
    o = o || {}; const c = cx_(), pl = clamp(o.pluie || 0), mo = clamp(o.mouille == null ? pl : o.mouille), ne = clamp(o.neige || 0), fe = clamp(o.fenetres || 0), so = clamp(o.soir || 0);
    c.drawImage(K.solPave, 0, ST.back - 2);
    if (so > 0) { c.save(); c.globalAlpha = 0.45 * so; c.fillStyle = '#10162e'; c.fillRect(0, ST.back - 2, W, 50); c.restore(); }
    if (mo > 0) { c.save(); c.globalAlpha = mo; for (const [x, w] of [[300, 60], [520, 80], [760, 54]]) flaque(x, ST.back + 22, w, t, pl, x); c.restore(); }
    if (fe > 0 && !SIL()) for (const x of [108, 282, 806, 984]) glow(x, ST.back + 20, 70, '255,186,96', 0.22 * fe * (0.5 + 0.5 * mo));
    if (ne > 0) { c.save(); c.globalAlpha = ne; fillPts([[0, ST.back - 2], [W, ST.back - 2], [W, ST.back + 10], [0, ST.back + 14]], '#f2f2ee'); c.restore(); }
  };

  // =====================================================================
  // LIEU A — LYON AUJOURD'HUI, NUIT (rue du Vieux-Lyon, Fourvière et sa basilique au fond)
  // =====================================================================
  const AUJ = (LYO.AUJ = {
    lea: { x: 680, rebord: 1080, w: 160, h: 200 }, rebord: { x0: 600, x1: 760, y: 1080 },
    maisons: [[-10, 210, 420, '#C9A066'], [210, 410, 380, '#C98C7C'], [410, 600, 760, '#D9C27E'], [600, 840, 440, '#E2D4A0'], [840, W + 10, 400, '#C77E5E']],
    volet: { x: 760, rebord: 600, w: 70, h: 112 }, chat: { x0: 30, x1: 200, y: 900 }, enseigne: { x: 404, y: 1070 }, basilique: { x: 506, y: 652 },
  });
  AUJ.fen = [];
  for (const [x0, x1, top] of AUJ.maisons) {
    if (top > 700) { for (const x of [458, 552]) AUJ.fen.push({ x, rebord: 1000, w: 62, h: 104 }); continue; }
    const cols = x0 === 600 ? [650, 760] : [x0 + (x1 - x0) * 0.28, x0 + (x1 - x0) * 0.72];
    const sills = x0 === 600 ? [790, 600] : [900, 700, 520];
    for (const y of sills) for (const x of cols) if (!(x0 === 600 && x === 760 && y === 600)) AUJ.fen.push({ x: Math.round(x), rebord: y, w: 62, h: y < 560 ? 92 : 112 });
  }
  AUJ.fen.push({ x: 900, rebord: 1110, w: 70, h: 120 });
  AUJ.fen.forEach((F) => { F.d = Math.hypot(F.x - AUJ.lea.x, (F.rebord - AUJ.lea.rebord) * 1.3); });
  AUJ.ordre = AUJ.fen.slice().sort((a, b) => a.d - b.d);                         // de proche en proche depuis la fenêtre de Léa
  AUJ.ordre.forEach((F, i) => { F.rang = i; });
  const nuitC = (col, k) => M.mixc(col, '#1a2140', k == null ? 0.5 : k);
  function initAuj() {
    K.aujCiel = M.pre(W, 1000, (c) => { c.fillStyle = lin(0, 0, 0, 1000, [[0, '#121a36'], [0.55, '#22305a'], [1, '#3a3f66']]); c.fillRect(0, 0, W, 1000); les(1000); });
    K.aujColline = M.pre(W, ST.back + 6, () => {
      colline(null, ['#232c3c', '#1b2333', '#262f40', '#3a3e48', '#2a2a34'], 640);
      const R = M.rng(2026); for (let i = 0; i < 60; i++) dot(380 + R() * 260, 690 + R() * 120, 1.4, 'rgba(255,214,140,0.8)');     // fenêtres lointaines
      basilique(AUJ.basilique.x, AUJ.basilique.y, 0.62);
      chapelle(440, 660, 0.3, true);
    });
    K.aujFacades = M.pre(W, ST.back + 6, () => {
      for (const [i, [x0, x1, top, col]] of AUJ.maisons.entries()) {
        const cn = nuitC(col, 0.55);
        pc(box(x0, top, x1, ST.back + 6), cn, () => { const R = M.rng(300 + i); for (let k = 0; k < 400; k++) dot(x0 + R() * (x1 - x0), top + R() * (ST.back - top), 0.8 + R(), 'rgba(0,0,0,0.12)'); hatch(null, 0.8, 7, 0.08, 1, P.encre, [x0, top, x1, ST.back]); }, 9700 + i, { texA: 0.5 });
        pc([[x0 - 10, top + 4, 1], [x1 + 10, top + 4, 1], [x1 + 10, top - 26, 1], [x0 - 10, top - 26, 1]], '#3a2a2a', null, 9710 + i);
        corniche(x0, x1, top + 12, nuitC(col, 0.4));
        if (top < 700) for (const y of [960, 810]) if (!(x0 === 600 && y === 960)) corniche(x0, x1, x0 === 600 ? 850 : y, nuitC(col, 0.4));
        if (top > 700) { pc([[x0 + 10, top + 6, 1], [x1 - 10, top + 6, 1], [x1 - 30, top - 30, 1], [x0 + 30, top - 30, 1]], '#3a2a2a', null, 9720); pierres(468, top - 66, 488, top - 24, '#4a4044', 9721); }
      }
      for (const F of AUJ.fen) {
        cadre(F, '#6a6670', { fond: '#141a2c', rebord: '#57535c' });
        if (hash(F.x * 1.3 + F.rebord) < 0.55) for (const sg of [-1, 1]) pc(box(F.x + sg * (F.w / 2 + 4), F.rebord - F.h, F.x + sg * (F.w / 2 + 4 + F.w * 0.42), F.rebord), hash(F.x) < 0.5 ? '#3c5048' : '#5a3a34', () => { for (let y = F.rebord - F.h + 8; y < F.rebord; y += 9) strokePts([[F.x + sg * (F.w / 2 + 4), y], [F.x + sg * (F.w / 2 + 4 + F.w * 0.42), y]], 'rgba(0,0,0,0.35)', 1); }, 9730 + F.x + F.rebord);
      }
      cadre(Object.assign({}, AUJ.lea), '#6a6670', { fond: '#141a2c', rebord: '#6e6a72' });
      // rez-de-chaussée : porte (maison A), bouchon (maison B) aux rideaux à carreaux rouges, traboule (milieu), portes C et D
      pc(box(80, 1200, 140, ST.back + 4), '#2c2422', null, 9740);
      pc(box(226, 1150, 392, 1340), '#3a2420', () => { fillPts(box(236, 1160, 382, 1330), '#d9a860'); for (let x = 236; x < 382; x += 12) for (let y = 1160; y < 1220; y += 12) if (((x + y) / 12) % 2 < 1) fillPts(box(x, y, x + 12, y + 12), '#a8322b'); }, 9741);
      pc([[460, ST.back + 4, 1], [550, ST.back + 4, 1], [550, 1240, 1]].concat(ep(505, 1240, 45, 45, 8, 0, -PI).slice(1, -1), [[460, 1240, 1]]), '#0f1220', null, 9742);
      pc(box(770, 1190, 830, ST.back + 4), '#2c2422', null, 9743);
      // balcon en fer forgé (maison C, 1er étage)
      pc(box(616, 788, 796, 796), '#1c1c20', null, 9744);
      for (let x = 620; x <= 792; x += 12) strokePts([[x, 790], [x, 730]], '#1c1c20', 2);
      strokePts([[616, 730], [796, 730]], '#1c1c20', 3); for (let x = 626; x < 790; x += 24) strokePts(ep(x + 6, 760, 6, 10, 8, 0, TAU), '#1c1c20', 1.4);
      // enseigne de bouchon : cochon peint sur panneau ovale, sans lettre
      const E = AUJ.enseigne; strokePts([[E.x - 6, E.y - 40], [E.x + 60, E.y - 40]], '#1c1c20', 3);
      pc(ell(E.x + 40, E.y, 34, 26, 16), '#7a4a2a', () => {
        fillPts(ell(E.x + 40, E.y + 2, 22, 13, 14), '#E3A0A0'); fillPts(ell(E.x + 60, E.y - 2, 7, 6, 10), '#E3A0A0'); fillPts([[E.x + 34, E.y - 12], [E.x + 40, E.y - 22], [E.x + 44, E.y - 12]], '#E3A0A0');
        for (const lx of [-12, -4, 6, 14]) fillPts(box(E.x + 40 + lx, E.y + 12, E.x + 43 + lx, E.y + 20), '#E3A0A0'); dot(E.x + 54, E.y - 4, 1.3, '#2a1a1a');
      }, 9745);
    });
    K.aujMasque = M.pre(W, ST.back + 6, (c) => { c.fillStyle = '#fff'; for (const [x0, x1, top] of AUJ.maisons) c.fillRect(x0, top - 26, x1 - x0, ST.back + 6 - top + 26); });
    K.aujProj = M.mkCanvas(W, ST.back + 6);
    K.aujAvant = M.pre(W, ST.back + 6, () => {
      // réverbère moderne (mât gris, lanterne de style)
      pc(ribbon([[130, ST.back + 4], [130, 900]], 12, 9), '#2d3138', null, 9750);
      pc([[118, 900, 1], [142, 900, 1], [152, 860, 1], [108, 860, 1]], '#2d3138', () => fillPts([[114, 896], [146, 896], [150, 866], [110, 866]], '#f4e8c4'), 9751);
      pc([[104, 862, 1], [156, 862, 1], [130, 840, 1]], '#2d3138', null, 9752);
      // jardinière de bois avec arbustes
      pc(box(400, ST.back - 56, 480, ST.back + 4), '#5a3c2a', () => { for (let x = 404; x < 480; x += 12) strokePts([[x, ST.back - 56], [x, ST.back]], 'rgba(0,0,0,0.3)', 1); }, 9753);
      const R = M.rng(17); for (let i = 0; i < 14; i++) fillPts(ell(408 + R() * 64, ST.back - 66 - R() * 40, 12, 10, 10), i % 2 ? '#2f4a36' : '#3b5a40');
      // vélo garé contre le mur
      for (const x of [930, 1010]) { strokePts(ep(x, ST.back - 30, 30, 30, 20, 0, TAU), '#1c1c20', 3); strokePts([[x, ST.back - 30], [x + 30 * Math.cos(1), ST.back - 30 + 30 * Math.sin(1)]], '#5a5a60', 1); }
      strokePts([[930, ST.back - 30], [962, ST.back - 74], [1000, ST.back - 74], [1010, ST.back - 30], [968, ST.back - 30], [962, ST.back - 74]], '#8a2a2a', 3.4);
      strokePts([[958, ST.back - 82], [972, ST.back - 82]], '#1c1c20', 4); strokePts([[1000, ST.back - 74], [996, ST.back - 92], [1010, ST.back - 96]], '#1c1c20', 3);
    });
    K.aujSol = M.pre(W, 70, () => {
      fillPts([[0, 0, 1], [W, 0, 1], [W, 46, 1], [0, 46, 1]], '#3e424c');
      for (let row = 0; row < 3; row++) for (let x = -20 + row * 14; x < W; x += 42) fillPts(rrect(x, 3 + row * 14, x + 38, 15 + row * 14, 4), row % 2 ? '#454a56' : '#50566a');
      fillPts(ell(820, 24, 46, 8, 18), '#2a2c32'); for (let k = -3; k <= 3; k++) strokePts([[820 + k * 11, 18], [820 + k * 11, 30]], '#555963', 1.2);   // plaque d'égout
    });
  }
  // LYO.aujourdhui(t, { projection 0..1, fenetres 0..1 (de proche en proche depuis Léa), nuit (1), foule 0..1 (passants), chat 0..1 (p1), volet 0..1 (p6) })
  LYO.aujourdhui = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), pr = clamp(o.projection || 0), fe = o.fenetres == null ? 1 : clamp(o.fenetres), nu = o.nuit == null ? 1 : clamp(o.nuit);
    c.drawImage(K.aujCiel, 0, 0);
    etoiles(t, 0, W, 170, 640, 70, 11, nu);
    c.drawImage(K.aujColline, 0, 0);
    LYO.statue(440, 660 - 0.3 * 156, 0.12, { eclat: 0.8, t });
    glow(AUJ.basilique.x, AUJ.basilique.y - 40, 150, '255,226,160', 0.28);
    M.fumee(t, { x: 478, y: 692, s: 0.4, n: 5, haut: 180, vent: 26, col: '#7d8090', a: 0.5, seed: 71 });
    c.drawImage(K.aujFacades, 0, 0);
    if (pr > 0 && !SIL()) {                                                      // projections colorées qui balaient les façades (formes, vagues ; aucun texte)
      const pv = K.aujProj, q = pv.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, pv.width, pv.height);
      const cols = ['230,40,150', '20,150,230', '240,170,20', '40,200,110', '140,60,230'];
      for (let i = 0; i < 5; i++) {
        const x = ((g * (40 + i * 14) + i * 260) % 1500) - 210, y = 560 + 300 * Math.sin(g * 0.3 + i * 1.7), r = 170 + 60 * Math.sin(g * 0.5 + i);
        const gr = q.createRadialGradient(x, y, 10, x, y, r); gr.addColorStop(0, `rgba(${cols[i]},0.95)`); gr.addColorStop(1, `rgba(${cols[i]},0)`); q.fillStyle = gr; q.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
      for (let b = 0; b < 3; b++) {
        q.beginPath(); q.moveTo(0, ST.back); for (let x = 0; x <= W; x += 20) q.lineTo(x, 760 + b * 170 + 60 * Math.sin(x * 0.012 + g * (0.9 + b * 0.3) + b)); q.lineTo(W, ST.back); q.closePath();
        q.fillStyle = `rgba(${cols[(b + 1) % 5]},0.3)`; q.fill();
      }
      q.globalCompositeOperation = 'destination-in'; q.drawImage(K.aujMasque, 0, 0);
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.55 * pr; c.drawImage(pv, 0, 0); c.restore();
    }
    // fenêtres allumées et lumignons qui vacillent (Léa pose le sien elle-même)
    const N = AUJ.ordre.length;
    for (const F of AUJ.fen) { const l = smooth(F.rang / N, (F.rang + 2) / N, fe * (N + 2) / N); if (hash(F.x + F.rebord * 3) < 0.25 && fe < 1) continue; lumiere(F, l * 0.85, 0.9); rangLumignons(t, F, l, 2, F.rang * 11 + 3, 0.52); }
    if (o.volet != null && o.volet > 0) {                                        // p6 : un volet s'ouvre en haut, une bougie s'y allume
      const F = AUJ.volet, k = clamp(o.volet), v = ease(smooth(0, 0.5, k));
      lumiere(F, smooth(0.45, 0.9, k) * 0.9, 0.9); volet(F, v, '#3c5048'); if (k > 0.55) LYO.lumignon(t, F.x, F.rebord + 1, 0.55, { couleur: 'rouge', allume: smooth(0.6, 1, k), seed: 5 });
    }
    // guirlande lumineuse entre les maisons
    const gl = []; for (let i = 0; i <= 16; i++) { const u = i / 16; gl.push([lerp(410, 600, u), lerp(600, 612, u) + 60 * 4 * u * (1 - u) + 3 * Math.sin(g * 0.8) * Math.sin(PI * u)]); }
    strokePts(gl, '#14141a', 1.6);
    for (let i = 1; i < 16; i++) { const k = 0.6 + 0.4 * Math.sin(g * 3 + i * 1.7); dot(gl[i][0], gl[i][1] + 5, 3.2, `rgba(255,${200 + (i % 3) * 20},${120 + (i % 2) * 90},${k})`); glow(gl[i][0], gl[i][1] + 5, 18, '255,210,140', 0.3 * k); }
    // passants en ombre au fond
    M.passants(t, { y: ST.back - 6, s: 0.24, n: Math.round(lerp(3, 10, clamp(o.foule || 0))), per: 16, x0: 160, x1: 920, brume: 0.55, seed: 17 });
    // chat sur un rebord (p1)
    if (o.chat != null && o.chat > 0 && o.chat < 1) { const k = clamp(o.chat), C = AUJ.chat; chat(lerp(C.x0, C.x1, k), C.y - 1, 0.7, 1, g * 9, '#141214'); }
    c.drawImage(K.aujAvant, 0, 0);
    glow(130, 880, 230, '255,226,170', 0.3); voileNuit(0.18 * (1 - nu), '120,120,140');
  };
  LYO.aujourdhuiSol = function (t, o) {
    o = o || {}; const c = cx_(); c.drawImage(K.aujSol, 0, ST.back - 2);
    if (!SIL()) { glow(130, ST.back + 20, 120, '255,226,170', 0.2); glow(310, ST.back + 22, 90, '255,190,110', 0.2); glow(680, ST.back + 22, 110, '255,190,110', 0.22); }
    if (o.mouille) { c.save(); c.globalAlpha = clamp(o.mouille); for (const [x, w] of [[360, 56], [700, 70]]) flaque(x, ST.back + 22, w, t, clamp(o.pluie || 0), x); c.restore(); }
  };

  // =====================================================================
  // LIEU B — QUAI DE SAÔNE 1852, ATELIER DU FONDEUR
  // =====================================================================
  const QUAI = (LYO.QUAI = { chapelle: { x: 300, y: 560 }, four: { x: 845, y: 1328, bouche: [800, 1230, 890, 1340] }, cheminee: { x: 845, y: 420 }, bitte: [330, 1212],
    statue: { x: 650, y: ST.back }, poulie: [660, 632], barqueX: 190,
    eau: (crue) => { const k = clamp(crue || 0); return { riviere: lerp(1150, 1100, k), bandes: [lerp(ST.back + 20, 1170, k), lerp(ST.back + 34, 1238, k), lerp(ST.back + 48, 1300, k)], avant: lerp(1470, 1388, smooth(0.45, 1, k)) }; } });
  function vague(w, h, col, seed) {
    return M.pre(w, h, () => {
      const top = []; for (let x = 0; x <= w; x += 20) top.push([x, 18 + 10 * Math.sin(x * 0.03 + seed) + 5 * Math.sin(x * 0.071 + seed * 2)]);
      pc([[0, h, 1]].concat(top, [[w, h, 1]]), col, () => { for (let x = 10; x < w; x += 46) strokePts([[x, 22 + 10 * Math.sin(x * 0.03 + seed)], [x + 26, 18 + 10 * Math.sin((x + 26) * 0.03 + seed)]], 'rgba(240,248,252,0.6)', 2); hatch(null, 0.15, 6, 0.15, 1, P.encre, [0, 0, w, h]); }, 9900 + seed, { drop: false });
    });
  }
  function initQuai() {
    K.quaiCiel = M.pre(W, 1100, (c) => { c.fillStyle = lin(0, 0, 0, 1100, [[0, '#a7b0b6'], [0.7, '#d0d0c8'], [1, '#dcd8cc']]); c.fillRect(0, 0, W, 1100); les(1100); });
    K.quaiColline = M.pre(W, ST.back + 6, () => {
      const R = M.rng(1852), top = []; for (let x = -20; x <= 760; x += 30) top.push([x, 560 + Math.pow(Math.abs(x - 300) / 420, 1.6) * 260 + R() * 8]);
      pc([[-20, 1150, 1]].concat(top, [[760, 1000], [760, 1150, 1]]), '#7E8A5C', () => {
        for (let i = 0; i < 60; i++) fillPts(ell(R() * 760, 600 + R() * 400, 14 + R() * 14, 10 + R() * 8, 10), R() < 0.5 ? '#5f6e44' : '#8a7a50');
        for (let i = 0; i < 24; i++) { const x = R() * 720, y = 680 + R() * 280, w = 20 + R() * 20; fillPts(box(x, y, x + w, y + 18), '#d8cdb5'); fillPts([[x - 3, y], [x + w + 3, y], [x + w / 2, y - 10]], '#9a5e44'); }
        hatch(null, 0.9, 5, 0.12, 1, P.encre, [0, 540, 760, 1150]);
      }, 9910, { drop: false });
      chapelle(QUAI.chapelle.x, QUAI.chapelle.y, 0.8, false);                      // clocher VIDE (petit dôme, pas encore de statue)
      for (let x = -10; x < 720; x += 48) { const h = 50 + hash(x) * 40; pc(box(x, 1070 - h, x + 44, 1100), hash(x * 3) < 0.5 ? '#CDB892' : '#BCA88C', () => { fillPts(box(x + 10, 1070 - h + 14, x + 18, 1070 - h + 28), '#3a3638'); fillPts(box(x + 26, 1070 - h + 14, x + 34, 1070 - h + 28), '#3a3638'); }, 9920 + x); pc([[x - 4, 1072 - h, 1], [x + 48, 1072 - h, 1], [x + 22, 1056 - h, 1]], '#8A5A44', null, 9960 + x); }
    });
    K.quaiMur = M.pre(W, ST.back + 6, () => {                                     // quai de pierre, bitte d'amarrage, escalier
      pierres(-10, 1212, 560, ST.back + 6, '#B9AE98', 9930);
      pc(box(-16, 1200, 566, 1214), '#D2C8B2', () => strokePts([[-16, 1204], [566, 1204]], 'rgba(255,255,255,0.35)', 2), 9931);
      const B = QUAI.bitte; pc([[B[0] - 12, B[1] - 2, 1], [B[0] + 12, B[1] - 2, 1], [B[0] + 10, B[1] - 30], [B[0] + 14, B[1] - 36], [B[0] - 14, B[1] - 36], [B[0] - 10, B[1] - 30]], '#3a3a3e', null, 9932);
      for (let i = 0; i < 4; i++) pc(box(60 + i * 20, 1214 + i * 44, 150, 1258 + i * 44), '#ADA28C', null, 9933 + i);
    });
    K.quaiAtelier = M.pre(W, ST.back + 6, () => {
      pc(box(526, 600, W + 10, ST.back + 6), '#4a3626', () => { for (let x = 530; x < W; x += 34) strokePts([[x, 600], [x + 2, ST.back]], 'rgba(20,10,5,0.45)', 1.2); hatch(null, 1.4, 6, 0.15, 1, P.encre, [526, 600, W, ST.back]); }, 9940);   // mur de planches
      pc([[500, 612, 1], [810, 452, 1], [W + 20, 612, 1], [W + 20, 640, 1], [810, 482, 1], [500, 640, 1]], '#8A5A44', () => { for (let i = 0; i < 26; i++) { const u = i / 26; strokePts([[lerp(500, W + 20, u), 612 + 28 * 0.5], [lerp(500, W + 20, u), 640]], 'rgba(50,25,15,0.3)', 1); } }, 9941);   // toit
      for (const [x0, y0, x1, y1] of [[520, 630, W + 10, 630], [540, 630, 810, 480], [W + 10, 630, 810, 480], [810, 480, 810, 630], [670, 630, 740, 555], [950, 630, 880, 555]]) pc(ribbon([[x0, y0], [x1, y1]], 16, 16, true), '#6b4526', () => strokePts([[x0, y0 - 3], [x1, y1 - 3]], 'rgba(255,220,170,0.25)', 1.4), 9942 + x0 + y1);   // charpente
      for (const x of [540, W - 10]) pc(ribbon([[x, ST.back + 6], [x, 622]], 24, 24, true), '#6b4526', () => hatch(null, 0.2, 5, 0.2), 9950 + x);   // poteaux
      // four de briques avec gueulard, cheminée qui perce le toit
      pc(box(760, 1000, 930, ST.back + 6), '#9A4E36', () => { for (let y = 1004; y < ST.back; y += 14) for (let x = 760 + ((y / 14) % 2 ? 0 : 14); x < 930; x += 28) strokePts([[x, y], [x + 26, y]], 'rgba(60,25,15,0.5)', 1); hatch(null, 0.8, 5, 0.18); }, 9960);
      pc(box(820, 420, 870, 1004), '#8E4632', () => { for (let y = 424; y < 1000; y += 14) strokePts([[820, y], [870, y]], 'rgba(60,25,15,0.45)', 1); }, 9961);
      pc(box(812, 410, 878, 426), '#6e3626', null, 9962);
      const Bo = QUAI.four.bouche; pc([[Bo[0], Bo[3], 1], [Bo[2], Bo[3], 1], [Bo[2], Bo[1] + 30]].concat(ep((Bo[0] + Bo[2]) / 2, Bo[1] + 30, (Bo[2] - Bo[0]) / 2, 30, 8, 0, -PI).slice(1, -1), [[Bo[0], Bo[1] + 30]]), '#1a0e0a', null, 9963);
      // accessoires : creuset sur trépied, moule de terre, enclume, pinces, seaux, sacs de sable, tonneaux, poulie
      pc([[950, 1330], [1000, 1330], [994, 1370], [956, 1370]], '#5a5048', () => fillPts(box(950, 1330, 1000, 1338), '#c8602a'), 9964);
      for (const [a, b] of [[956, 940], [994, 1010]]) strokePts([[a, 1368], [b, ST.back + 4]], '#2a2a2e', 3);
      pc([[1010, ST.back + 4, 1], [1076, ST.back + 4, 1], [1070, 1300], [1043, 1270], [1016, 1300]], '#A0704A', () => { strokePts([[1020, 1320], [1066, 1320]], 'rgba(60,30,15,0.4)', 1.4); hatch(null, 0.8, 4, 0.2); }, 9965);
      pc([[548, 1350, 1], [600, 1350, 1], [606, 1340, 1], [586, 1332, 1], [560, 1332, 1], [540, 1340, 1]], '#3a3a40', () => strokePts([[544, 1336], [602, 1336]], 'rgba(255,255,255,0.3)', 1.4), 9966);
      pc(box(556, 1350, 592, ST.back + 4), '#6b4526', null, 9967);
      for (const [dx, a] of [[0, 0.15], [16, -0.12]]) pc(ribbon([[640 + dx, 760], [640 + dx + 90 * Math.sin(a), 760 + 90 * Math.cos(a)]], 5, 5), '#2a2a2e', null, 9968 + dx);
      strokePts([[630, 756], [668, 756]], '#2a2a2e', 3);
      for (const x of [700, 732]) pc([[x - 14, ST.back + 4, 1], [x + 14, ST.back + 4, 1], [x + 17, ST.back - 34, 1], [x - 17, ST.back - 34, 1]], '#7a6a5a', () => strokePts([[x - 16, ST.back - 24], [x + 16, ST.back - 24]], '#3a3a3e', 2), 9970 + x);
      for (const [x, y] of [[470, ST.back], [510, ST.back], [490, ST.back - 30], [450, ST.back - 2]]) pc([[x - 26, y + 4], [x + 26, y + 4], [x + 22, y - 26], [x - 22, y - 26]], '#9a8a6a', () => strokePts([[x - 18, y - 18], [x + 18, y - 18]], 'rgba(60,45,30,0.4)', 1.2), 9972 + x + y);
      for (const x of [396, 424]) pc([[x - 22, ST.back + 4, 1], [x + 22, ST.back + 4, 1], [x + 26, ST.back - 30], [x + 22, ST.back - 64, 1], [x - 22, ST.back - 64, 1], [x - 26, ST.back - 30]], '#7a5532', () => { for (const y of [-56, -10]) strokePts([[x - 24, ST.back + y], [x + 24, ST.back + y]], '#3a3a3e', 2.4); }, 9980 + x);
      const Po = QUAI.poulie; pc(ell(Po[0], Po[1] + 12, 14, 14, 14), '#5a5a60', () => dot(Po[0], Po[1] + 12, 3, '#2a2a2e'), 9985); strokePts([[Po[0], Po[1] - 2], [Po[0], Po[1] + 2]], '#2a2a2e', 3);
    });
    K.barque = FL(280, 110, () => {
      pc([[-130, -50], [130, -60], [118, -30], [90, -6], [-90, -6], [-118, -28]], '#6b4a30', () => { strokePts([[-124, -40], [124, -48]], 'rgba(255,220,170,0.3)', 1.6); for (let x = -80; x < 90; x += 40) strokePts([[x, -52], [x, -10]], 'rgba(30,15,5,0.4)', 1.2); }, 9990);
      pc(box(-40, -70, -30, -52), '#5a3c24', null, 9991); pc(ribbon([[-34, -66], [60, -100]], 4, 4), '#7a5532', null, 9992);   // aviron
    });
    K.vagues = [vague(W + 240, 300, '#6F8E98', 1), vague(W + 240, 300, '#557684', 2), vague(W + 240, 300, '#3F606E', 3)];
    K.vagueAvant = vague(W + 240, 200, '#4A6B7A', 4);
  }
  // LYO.quai1852(t, { crue 0..1, four 0..1, vapeur 0..1, chapelle 0..1 (spot sur le clocher vide), sombre 0..1 }) — avant M.drawFloor
  LYO.quai1852 = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), cr = clamp(o.crue || 0), fo = o.four == null ? 1 : clamp(o.four), va = clamp(o.vapeur || 0), E = QUAI.eau(cr);
    c.drawImage(K.quaiCiel, 0, 0);
    M.nuages(t, { y0: 320, y1: 520, n: 4, vit: 12, seed: 52, col: '#e6e4dc', brume: 0.2 });
    M.oiseaux(t, { x0: -80, x1: 1100, y: 500, t0: 0, dur: 14, n: 4, s: 0.5, seed: 12, boucle: true, col: '#e9e4d8', brume: 0.2 });
    c.drawImage(K.quaiColline, 0, 0);
    const ch = clamp(o.chapelle || 0); if (ch > 0) { const Cp = QUAI.chapelle; glow(Cp.x, Cp.y - 80, 130, '255,236,180', 0.55 * ch); }
    // Saône au fond : reflets qui scintillent, barque amarrée qui monte avec l'eau et tire sur sa corde
    fillPts(box(0, E.riviere, 760, 1214), '#7d98a2');
    if (!SIL()) for (let i = 0; i < 24; i++) { const x = (hash(i * 3.7) * 760 + g * 14 * (1 + hash(i))) % 760, y = E.riviere + 8 + hash(i * 5.3) * (1210 - E.riviere - 10), k = 0.5 + 0.5 * Math.sin(g * 2 + i); strokePts([[x, y], [x + 22, y]], `rgba(240,248,252,${0.5 * k})`, 1.4); }
    const bx = QUAI.barqueX, by = Math.min(E.riviere + 6, E.bandes[0] + 6) + 2 * Math.sin(g * 1.3), tend = smooth(1130, 1104, by), rotB = 0.02 * Math.sin(g * 1.1) + 0.09 * tend;
    M.flat(K.barque, bx, by, { rot: rotB, cast: { a: 0.2, dx: 8, dy: 4 } });
    const nez = [bx + 128 * Math.cos(rotB) + 60 * Math.sin(rotB), by - 56 + 128 * Math.sin(rotB)], Bi = QUAI.bitte;
    strokePts(qbez(nez, [lerp((nez[0] + Bi[0]) / 2, (nez[0] + Bi[0]) / 2, tend), lerp(Math.max(nez[1], Bi[1]) + 40, (nez[1] + Bi[1] - 30) / 2, tend)], [Bi[0], Bi[1] - 30], 12), '#5a4a32', 2.2);
    c.drawImage(K.quaiMur, 0, 0);
    c.drawImage(K.quaiAtelier, 0, 0);
    // chaîne de la poulie qui se balance
    const Po = QUAI.poulie, sw = 0.03 * Math.sin(g * 0.8), ch2 = []; for (let i = 0; i <= 14; i++) ch2.push([Po[0] + 14 + Math.sin(sw) * i * 20, Po[1] + 12 + Math.cos(sw) * i * 20]);
    for (let i = 0; i < 14; i++) strokePts(ep((ch2[i][0] + ch2[i + 1][0]) / 2, (ch2[i][1] + ch2[i + 1][1]) / 2, i % 2 ? 2 : 4, 7, 8, 0, TAU), '#2a2a2e', 1.6);
    strokePts([[ch2[14][0], ch2[14][1]], [ch2[14][0], ch2[14][1] + 14], [ch2[14][0] - 10, ch2[14][1] + 18]], '#2a2a2e', 3);
    strokePts([[Po[0] - 14, Po[1] + 12], [Po[0] - 14, 760]], '#2a2a2e', 1.4);
    // feu du four, lueur, fumée de la cheminée, vapeur
    const Bo = QUAI.four.bouche;
    if (fo > 0.01) { glow((Bo[0] + Bo[2]) / 2, Bo[1] + 60, 260, '255,150,60', 0.5 * fo); for (let i = 0; i < 3; i++) M.flamme(t, { x: Bo[0] + 22 + i * 24, y: Bo[3] - 6, s: 1.6 * fo * (0.8 + 0.2 * i % 2), lueur: false, seed: 80 + i }); }
    M.fumee(t, { x: QUAI.cheminee.x, y: QUAI.cheminee.y, s: 0.9, n: 6, haut: 260, vent: 40, col: '#8a8580', a: 0.25 + 0.45 * fo, seed: 85 });
    if (va > 0) M.fumee(t, { x: (Bo[0] + Bo[2]) / 2, y: Bo[1] + 20, s: 1.6, n: 8, haut: 420, vent: -30, col: '#f2f0ea', a: 0.85 * va, per: 2.4, seed: 86 });
    // crue : les bandes d'eau montent de la trappe et débordent
    if (cr > 0) { c.save(); c.beginPath(); c.rect(0, 0, W, ST.back + 1); c.clip(); for (let b = 0; b < 3; b++) c.drawImage(K.vagues[b], -120 + 70 * Math.sin(g * (0.55 + 0.17 * b) + b * 2), E.bandes[b] - 16); c.restore(); }
    voileNuit(0.3 * clamp(o.sombre || 0), '40,44,52');
  };
  // après les marionnettes : l'eau déborde sur le plancher (couvre les pieds quand crue > 0,5)
  LYO.quai1852Avant = function (t, o) {
    o = o || {}; const cr = clamp(o.crue || 0); if (cr < 0.45) return; const c = cx_(), g = M.tg(t), y = QUAI.eau(cr).avant;
    c.save(); c.globalAlpha = 0.93; c.drawImage(K.vagueAvant, -120 + 60 * Math.sin(g * 0.7 + 1), y - 16); c.restore();
  };

  // =====================================================================
  // INIT — pré-rendus (dans S.init : LYO.init())
  // =====================================================================
  LYO.init = function () {
    if (K._ok) return K;
    K.nuage = { clair: M.cutFlat(480, 280, 240, 140, () => nuageShape(false)), sombre: M.cutFlat(480, 280, 240, 140, () => nuageShape(true)) };
    initPlace(); initAuj(); initQuai();
    K._ok = true; return K;
  };
})();
