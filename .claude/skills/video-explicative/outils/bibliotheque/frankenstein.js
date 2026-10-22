// persos.js — « Frankenstein, le monstre né d'un volcan » (1816) : marionnettes, ombres chinoises, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.frk (alias FRK). FRK.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni logo. Déterministe (hash, aucun tirage) : tout est fonction pure de t (ambiances en M.tg(t)).
// INDEX : 1) géométrie  2) objets (livre, page, plume, encrier, chandelier, lanterne, manuscrit, verre)  3) objets tenus, bras/jambes, IK, sièges
//         4) Mary  5) Byron, Percy, Polidori, Victor  6) la créature  7) ombres chinoises  8) accessoires et meubles seuls
//         9) décors : FRK.salon / FRK.salonSol, FRK.ecran / FRK.ecranClip
(function () {
  'use strict';
  const X = M.X, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash, smooth } = M;
  const FRK = (M.frk = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const OMBRE = '#0d0d10';

  // =====================================================================
  // 1) GÉOMÉTRIE
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const rotP = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
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
  // contour bouclé (cheveux frisés) : arc d'ellipse a0 → a1 à bosses rondes
  function boucles(cx, cy, rx, ry, a0, a1, n, bump) {
    const o = [];
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      for (let k = 0; k <= 4; k++) { const u = lerp(u0, u1, k / 4), a = lerp(a0, a1, u), b = 1 + bump * Math.sin(PI * k / 4); o.push([cx + Math.cos(a) * rx * b, cy + Math.sin(a) * ry * b]); }
    }
    return o;
  }
  // halo lumineux additif (dessin brut : jamais pendant la passe silhouette)
  function glow(x, y, r, col, a) {
    if (a <= 0.003 || SIL()) return;
    const c = cx_(), gr = c.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.35, `rgba(${col},${a * 0.45})`); gr.addColorStop(1, `rgba(${col},0)`);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
  }
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  FRK.geo = { ep, ell, ribbon, qbez, rrect, tr, scl, mp, rotP, blob, glow, box };

  // =====================================================================
  // 2) OBJETS — chacun dessiné dans son repère (y vers le bas), seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const CUIR = '#5b2a22', CUIRD = '#3e1b16', CUIRL = '#7a3a2e', OR = '#b8933f', ORD = '#8a6a2a', ORL = '#d8b868';
  const IVOIRE = '#ece4cc', IVOIRED = '#d2c6a8', ENCRE = 'rgba(38,28,36,0.78)';
  // lignes d'écriture ondulées (aucune lettre) ; k 0..1 = portion écrite ; renvoie le bout de la ligne en cours
  function lignes(x0, x1, y0, y1, n, seed, k, col, lw) {
    let bout = [x0, lerp(y0, y1, 0.5 / n)];
    for (let i = 0; i < n; i++) {
      const f = clamp(k * n - i); if (f <= 0) break;
      const y = lerp(y0, y1, (i + 0.5) / n), xe = i === n - 1 ? lerp(x0, x1, 0.5) : x1 - hash(seed + i * 3.1) * 0.14 * (x1 - x0);
      const xEnd = lerp(x0, xe, f), pts = [];
      for (let x = x0; x <= xEnd + 0.01; x += 1.6) pts.push([x, y + Math.sin(x * 1.3 + i * 2 + seed) * 0.8 + Math.sin(x * 0.41 + i * 5) * 0.7 - (hash(Math.floor(x / 9) + i * 31 + seed) > 0.82 ? 1.2 : 0)]);
      if (pts.length > 1) strokePts(pts, col || ENCRE, lw || 0.8);
      bout = [xEnd, y];
    }
    return bout;
  }
  // ---------------- le roman : in-octavo vu de face ; origine = bas du dos (reliure) ; fermé : x 0..LBW (à droite du dos) ; ouvert : -LBW..LBW
  const LBW = 74, LBH = 100;
  const MEDAL = [[-15, 21], [-14, 12], [-8, 7], [-5, 4], [-7, -1], [-9, -8], [-8, -15], [-3, -21], [3, -21], [8, -17], [10, -12], [12, -9], [10, -7], [11, -4], [8, -2], [7, 2], [5, 5], [12, 9], [16, 14], [16, 21]];
  function medaillon(cx, cy, k) {
    fillPts(ell(cx, cy, 21 * k, 27 * k, 22), ORD);
    pc(ell(cx, cy, 18.5 * k, 24.5 * k, 22), '#2a1410', () => {
      fillPts(scl(MEDAL, k).map((p) => [p[0] + cx, p[1] + cy]), ORL);                                   // la créature : tête et épaules
      fillPts([[cx - 9 * k, cy - 16 * k], [cx - 3 * k, cy - 21 * k], [cx - 12 * k, cy - 6 * k], [cx - 14 * k, cy + 6 * k]], OR);   // longs cheveux
      strokePts([[cx + 1 * k, cy - 13 * k], [cx + 6 * k, cy - 14 * k]], 'rgba(60,30,10,0.7)', 0.8);
    }, 7105, { drop: false, texA: 0.4 });
    strokePts(ep(cx, cy, 21 * k, 27 * k, 22, 0, TAU), ORL, 0.9, true);
  }
  function couverture(w, ext) {                                                     // plat de devant (ext = face extérieure)
    if (Math.abs(w) < 1.5) return;
    const c = cx_(); c.save(); c.scale(w / LBW, 1);
    if (ext) {
      pc(rrect(0, -LBH, LBW + 2, 0, 3), CUIR, () => {
        strokePts([[6, -LBH + 6], [LBW - 4, -LBH + 6], [LBW - 4, -6], [6, -6]], OR, 0.9, true);               // filets dorés
        strokePts([[9, -LBH + 9], [LBW - 7, -LBH + 9], [LBW - 7, -9], [9, -9]], 'rgba(184,147,63,0.5)', 0.6, true);
        for (const [x, y, sx, sy] of [[0, -LBH, 1, 1], [LBW + 2, -LBH, -1, 1], [0, 0, 1, -1], [LBW + 2, 0, -1, -1]]) fillPts([[x, y], [x + 14 * sx, y], [x, y + 14 * sy]], OR);   // coins dorés
        medaillon(LBW / 2 + 1, -LBH / 2, 1);
        hatch(null, 0.7, 4, 0.18, 1, '30,10,8', [0, -LBH, LBW, 0]);
        shade(LBW, -LBH, 0, 0, 0.2, [0, -LBH, LBW + 4, 0]);
      }, 7101);
    } else {
      pc(rrect(0, -LBH, LBW + 2, 0, 3), CUIRD, () => { fillPts(box(5, -LBH + 5, LBW - 3, -5), '#7a4a3a'); for (let i = 0; i < 9; i++) strokePts(qbez([5, -LBH + 10 + i * 10], [LBW / 2, -LBH + 4 + i * 10 + 8 * Math.sin(i)], [LBW - 3, -LBH + 12 + i * 10]), 'rgba(40,20,14,0.35)', 0.8); }, 7102);
    }
    c.restore();
  }
  function drawLivre(o) {
    const u = clamp(o.ouvert || 0), cs = Math.cos(u * PI);
    const pageD = () => pc([[1, -LBH + 3], [LBW - 2, -LBH + 3], [LBW, -LBH + 8], [LBW, -3, 1], [1, -3, 1]], IVOIRE, () => {
      lignes(10, LBW - 8, -LBH + 14, -12, 12, 3, o.ecrit == null ? 1 : o.ecrit, ENCRE, 0.7);
      shade(0, 0, 18, 0, 0.25, [0, -LBH, 20, 0]);
    }, 7103);
    pc(rrect(-1, -LBH - 1, LBW + 3, 1, 3), CUIRD, null, 7100);                         // plat arrière
    fillPts(box(LBW - 1, -LBH + 3, LBW + 2, -3), IVOIRED);                              // tranche
    if (u > 0.02) pageD();
    if (cs > 0) couverture(LBW * cs, true);
    else {                                                                          // ouvert : contre-plat à gauche, page de garde
      couverture(LBW * cs, false);
      if (cs < -0.4) { const c = cx_(); c.save(); c.scale(cs, 1); pc([[1, -LBH + 3], [LBW - 2, -LBH + 3], [LBW, -LBH + 8], [LBW, -3, 1], [1, -3, 1]], IVOIRE, () => shade(0, 0, 18, 0, 0.25, [0, -LBH, 20, 0]), 7104); c.restore(); }
    }
    pc(rrect(-4, -LBH - 2, 3, 2, 2), CUIRL, () => { for (const y of [-LBH + 14, -LBH + 30, -24, -10]) strokePts([[-4, y], [3, y]], OR, 1); }, 7106);   // dos à nerfs
  }
  // ---------------- page : feuille ivoire ; origine = bas, milieu ; o.ecrit 0..1 (lignes ondulées qui se remplissent)
  const PGW = 76, PGH = 100;
  const PAGE = [[-PGW / 2, -PGH, 1], [PGW / 2 - 9, -PGH, 1], [PGW / 2, -PGH + 9, 1], [PGW / 2, 0, 1], [-PGW / 2, 0, 1]];
  function pageBout(o) { const n = 11, k = clamp(o.ecrit || 0), i = Math.min(n - 1, Math.floor(k * n)), f = clamp(k * n - i); const y = lerp(-PGH + 12, -10, (i + 0.5) / n); return [lerp(-PGW / 2 + 8, PGW / 2 - 10, f), y]; }
  function drawPage(o) {
    pc(PAGE, IVOIRE, () => {
      lignes(-PGW / 2 + 8, PGW / 2 - 8, -PGH + 12, -10, 11, 7, o.ecrit || 0, ENCRE, 0.75);
      shade(-PGW / 2, -PGH, PGW / 2, 0, 0.12, [-PGW / 2, -PGH, PGW / 2, 0]);
    }, 7201);
    fillPts([[PGW / 2 - 9, -PGH], [PGW / 2 - 9, -PGH + 9], [PGW / 2, -PGH + 9]], IVOIRED);
  }
  // ---------------- plume d'oie blanche ; origine = prise des doigts ; bec en [10, 31]
  const PLUME = [[9, 28], [11, 32], [6, 23], [2, 8], [-2, -4], [-10, -10], [-20, -30], [-30, -56], [-37, -84], [-36, -102, 1], [-27, -86], [-16, -62], [-6, -36], [1, -14], [5, 4]];
  function drawPlume() {
    pc(PLUME, '#f3efe4', () => {
      strokePts([[10, 31], [0, 0], [-18, -50], [-35, -100]], 'rgba(150,140,118,0.85)', 1.1);
      for (let i = 1; i < 12; i++) { const y = -8 - i * 8, x = -2 - i * 2.9; strokePts([[x, y], [x - 9, y + 5]], 'rgba(150,140,120,0.45)', 0.7); strokePts([[x, y], [x + 4, y + 4]], 'rgba(150,140,120,0.35)', 0.6); }
      shade(-30, -60, 0, 0, 0.18, [-40, -104, 12, 34]);
    }, 7301);
    fillPts([[6, 23], [11, 32], [9, 23]], '#14121a');
  }
  // ---------------- encrier de verre noir ; origine = dessous ; o.plume (plume plantée)
  function drawEncrier(o) {
    if (o.plume) { const c = cx_(); c.save(); c.translate(-2, -40); c.rotate(0.35); drawPlume(); c.restore(); }
    pc([[-22, 0, 1], [-24, -8], [-22, -22], [-14, -28], [-8, -29], [-8, -37, 1], [8, -37, 1], [8, -29], [14, -28], [22, -22], [24, -8], [22, 0, 1]], '#15151b', () => {
      strokePts([[-15, -22], [-18, -10], [-15, -4]], 'rgba(220,230,255,0.55)', 1.6);
      strokePts([[12, -24], [16, -16]], 'rgba(220,230,255,0.3)', 1.2);
      fillPts(ell(0, -36, 7, 2, 10), '#050508');
    }, 7401);
  }
  // ---------------- chandelier à trois bougies (laiton) ; origine = pied ; o.t, o.hauteur 1..0,3, o.eteint (true | [b,b,b]), o.souffle (0..1 | [..]), o.fumee
  const CHB = [[-46, -128], [0, -152], [46, -128]];
  const at3 = (v, i) => (Array.isArray(v) ? v[i] : v);
  function chandelierFlammes(o) {
    const t = o.t || 0, h = clamp(o.hauteur == null ? 1 : o.hauteur, 0.15, 1), c = cx_(), out = [];
    CHB.forEach(([x, y], i) => {
      const top = y - 8 - 66 * h, et = at3(o.eteint, i), so = clamp(at3(o.souffle, i) || 0);
      out.push([x, top]);
      if (SIL()) return;
      if (!et) {
        c.save(); c.translate(x, top - 1); c.rotate((i === 0 ? -1 : 1) * 0 + so * 1.35); c.scale(1 - 0.35 * so, 1 - 0.45 * so);
        M.flamme(t, { x: 0.001, y: 0.001, s: 0.62, r: o.lueur === false ? 1 : 95, seed: 41 + i * 7, lueur: o.lueur !== false });
        c.restore();
      } else if (o.fumee !== 0) M.fumee(t, { x, y: top - 4, s: 0.22, n: 4, haut: 150, vent: 16, col: '#c9c3b6', a: 0.6 * (o.fumee == null ? 1 : o.fumee), per: 2.6, seed: 51 + i });
    });
    return out;
  }
  function drawChandelier(o) {
    const h = clamp(o.hauteur == null ? 1 : o.hauteur, 0.15, 1), LAI = '#a8843e', LAID = '#7a5c26';
    const bras = (sx) => pc(ribbon(qbez([0, -96], [sx * 52, -104], [sx * 46, -122], 10), 6), LAI, () => strokePts(qbez([0, -98], [sx * 50, -106], [sx * 44, -122], 8), 'rgba(255,230,170,0.5)', 0.9), 7502 + sx);
    bras(-1); bras(1);
    pc([[-28, 0, 1], [-24, -10], [-10, -18], [-6, -40], [-9, -50], [-5, -60], [-5, -96], [-8, -104], [-4, -150], [4, -150], [8, -104], [5, -96], [5, -60], [9, -50], [6, -40], [10, -18], [24, -10], [28, 0, 1]], LAI, () => {
      strokePts([[-2, -16], [-2, -146]], 'rgba(255,232,170,0.55)', 1.4); shade(20, 0, -20, 0, 0.3, [-30, -160, 30, 2]);
    }, 7501);
    CHB.forEach(([x, y], i) => {
      const top = y - 8 - 66 * h;
      pc([[x - 6, top, 1], [x + 6, top, 1], [x + 6, y - 6, 1], [x - 6, y - 6, 1]], '#efe6cf', () => { strokePts([[x - 3, top + 2], [x - 3, y - 8]], 'rgba(255,255,255,0.6)', 1.2); fillPts([[x + 2, top], [x + 6, top], [x + 6, top + 10 + 4 * i], [x + 4, top + 7]], '#e2d6b6'); }, 7510 + i);
      strokePts([[x, top], [x + 0.5, top - 5]], '#1a1410', 1.4);
      pc([[x - 12, y - 4], [x + 12, y - 4], [x + 8, y + 2, 1], [x - 8, y + 2, 1]], LAID, null, 7520 + i);
    });
    chandelierFlammes(o);
  }
  // ---------------- lanterne de Victor (fer noir, verre ambré, flamme) ; origine = dessous ; anneau en [0, -118] ; o.t, o.allumee (true)
  const FER = '#1c1c22';
  function drawLanterne(o) {
    const t = o.t || 0, on = o.allumee !== false, c = cx_();
    strokePts(ep(0, -114, 8, 9, 14, 0, TAU), FER, 3.4, true);
    pc([[-6, -106, 1], [6, -106, 1], [6, -98, 1], [-6, -98, 1]], FER, null, 7601);
    pc([[-14, -98], [14, -98], [26, -86, 1], [-26, -86, 1]], FER, () => strokePts([[-8, -96], [8, -96]], 'rgba(200,200,220,0.35)', 1), 7602);
    pc(box(-21, -86, 21, -16), on ? '#e8a24a' : '#5a4a36', () => {
      if (on && !SIL()) { const g = c.createRadialGradient(0, -36, 2, 0, -46, 34); g.addColorStop(0, 'rgba(255,240,180,0.95)'); g.addColorStop(1, 'rgba(210,120,40,0.4)'); c.fillStyle = g; c.fillRect(-22, -88, 44, 74); }
      strokePts([[-15, -80], [-15, -22]], 'rgba(255,255,255,0.3)', 2);
    }, 7603, { texA: 0.25 });
    if (on && !SIL()) M.flamme(t, { x: 0.001, y: -26, s: 0.62, r: o.lueur === false ? 1 : 150, seed: 61, lueur: o.lueur !== false });
    for (const x of [-21, -7, 7, 21]) strokePts([[x, -86], [x, -16]], FER, x === -21 || x === 21 ? 3.2 : 1.8);
    strokePts([[-21, -52], [21, -52]], FER, 1.6);
    pc([[-25, -16, 1], [25, -16, 1], [22, 0, 1], [-22, 0, 1]], FER, () => strokePts([[-20, -12], [20, -12]], 'rgba(200,200,220,0.3)', 1), 7604);
  }
  // ---------------- manuscrit de Polidori (liasse nouée d'un ruban) ; origine = bas, milieu
  function drawManuscrit() {
    pc(box(-31, -86, 33, 2), IVOIRED, null, 7701);
    pc([[-34, -90, 1], [28, -92, 1], [31, -2, 1], [-33, 0, 1]], IVOIRE, () => {
      lignes(-26, 22, -80, -10, 10, 11, 1, 'rgba(38,28,36,0.6)', 0.7);
      fillPts(box(-34, -50, 32, -44), '#6e1f22'); fillPts(box(-3, -92, 3, 0), '#6e1f22');
      fillPts([[0, -47], [-12, -58], [-14, -50]], '#8a2a2c'); fillPts([[0, -47], [12, -58], [14, -50]], '#8a2a2c');
      fillPts([[0, -47], [-8, -32], [-4, -30]], '#6e1f22'); fillPts([[0, -47], [9, -33], [5, -30]], '#6e1f22');
    }, 7702);
  }
  // ---------------- verre à pied (vin rouge sombre) ; origine = dessous ; o.niveau 0..1
  function drawVerre(o) {
    const n = o.niveau == null ? 0.6 : clamp(o.niveau);
    pc([[-14, -66], [14, -66], [12, -46], [4, -36], [2, -34], [2, -8], [12, -3], [13, 0, 1], [-13, 0, 1], [-12, -3], [-2, -8], [-2, -34], [-4, -36], [-12, -46]], 'rgba(220,230,235,0.45)', () => {
      if (n > 0) fillPts([[-13 + 2 * (1 - n), -38 - 24 * n], [13 - 2 * (1 - n), -38 - 24 * n], [12, -46], [4, -37], [-4, -37], [-12, -46]], '#5a1220');
      strokePts([[-9, -60], [-8, -46]], 'rgba(255,255,255,0.7)', 1.4);
    }, 7801, { texA: 0.2 });
  }

  // =====================================================================
  // REGISTRE : grip = point tenu dans le poing ; p2 = seconde prise (deuxMains) ; pts = points nommés ; base = origine de l'accessoire seul
  // =====================================================================
  const OBJ = {
    livre: { draw: drawLivre, grip: [LBW - 3, -LBH * 0.42], p2: () => [3, -LBH * 0.42], pts: { dos: [0, -LBH / 2], centre: [LBW / 2, -LBH / 2], medaillon: [LBW / 2, -LBH / 2], haut: [LBW / 2, -LBH], bas: [LBW / 2, 0] }, base: [0, 0] },
    page: { draw: drawPage, grip: [PGW / 2 - 5, -PGH * 0.45], p2: () => [-PGW / 2 + 5, -PGH * 0.45], pts: { bout: (o) => pageBout(o), centre: [0, -PGH / 2], haut: [0, -PGH] }, base: [0, 0] },
    plume: { draw: drawPlume, grip: [0, 0], pts: { bec: [10, 31], barbe: [-35, -100] }, base: [10, 31] },
    encrier: { draw: drawEncrier, grip: [0, -32], pts: { goulot: [0, -37] }, base: [0, 0] },
    chandelier: { draw: drawChandelier, grip: [0, -70], pts: { flamme: [0, -230], pied: [0, 0] }, base: [0, 0] },
    lanterne: { draw: drawLanterne, grip: [0, -114], pts: { flamme: [0, -40], fond: [0, 0], anneau: [0, -114] }, base: [0, 0] },
    manuscrit: { draw: drawManuscrit, grip: [29, -46], p2: () => [-29, -46], pts: { centre: [0, -46], haut: [0, -90] }, base: [0, 0] },
    verre: { draw: drawVerre, grip: [0, -20], pts: { bord: [0, -66], fond: [0, 0] }, base: [0, 0] },
  };
  FRK.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const has = (v) => v && v !== 'rien';
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), c = cx_();
    c.save(); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const DOIGTS_FIN = [[-17, -8], [14, -9], [17, -2], [16, 6], [8, 10], [-8, 10], [-17, 3]];
  const PINCE = [[-8, -8], [6, -9], [9, -2], [6, 4], [-6, 6], [-9, 0]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  function heldParts(skin, seed, k) {
    k = k || 1;
    const fing = (n) => scl(n === 'plume' ? PINCE : (n === 'verre' || n === 'lanterne' || n === 'chandelier') ? DOIGTS_FIN : DOIGTS, k);
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? fing(p.tenu) : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) || p._deux ? fing(p.tenuB || p.tenu) : OFFP), paint: doigtsPaint },
    };
  }
  // point nommé de l'objet tenu, en coordonnées écran (r renvoyé par une enveloppe)
  FRK.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), q0 = ob.pts[nom], q = typeof q0 === 'function' ? q0(oo) : q0;
    return r.w(arriere ? 'objetB' : 'objet', q[0] - g[0], q[1] - g[1]);
  };

  // =====================================================================
  // 3) BRAS ET JAMBES À ARTICULATIONS RONDES (rivet au centre de chaque arrondi) + IK dans le repère du torse
  // =====================================================================
  const R_COUDE = 11.5;
  function armR(len, wt, wTop) { wt = wt || 15; const wT = wTop || wt; return ep(0, 0, wT, wT, 10, PI, TAU).concat([[wT - 1, 22], [wt - 1, 44], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 44], [-wT + 1, 22]]); }
  const H_PAUME = [[-8, 78], [8, 78], [12, 86], [16, 92], [21, 94], [19, 99], [12, 98], [11, 106], [9, 116], [3, 121], [-4, 119], [-9, 106], [-9, 90]];
  function handShape(k) { return k === 'fist' ? X.HAND_FIST : k === 'paume' ? H_PAUME : X.HAND_OPEN; }
  // avant-bras + main ; k = grandeur de la main (créature 1,25), sh = décalage de la main (avant-bras plus long)
  function foreR(kind, k, sh) {
    k = k || 1; sh = sh || 0;
    const h = handShape(kind).map((p) => [p[0] * 1.05 * k, 78 + sh + (p[1] - 78) * k]);
    return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat([[10, 40], [9 * k, 76 + sh]], h.slice(2, -1), [[-9 * k, 86 + sh], [-10 * k, 76 + sh], [-11, 40]]);
  }
  function handPaintK(kind, k, sh) {
    const c = cx_(); c.save(); c.translate(0, 78 + (sh || 0)); c.scale(k || 1, k || 1); c.translate(0, -78);
    if (kind === 'fist') { strokePts([[0, 92], [12, 92]], 'rgba(60,30,20,0.5)', 1); strokePts([[-2, 99], [10, 99]], 'rgba(60,30,20,0.5)', 1); }
    else if (kind === 'paume') { fillPts([[1, 84], [11, 90], [9, 106], [2, 110]], 'rgba(255,228,205,0.35)'); strokePts([[3, 94], [8, 104]], 'rgba(80,40,30,0.4)', 0.9); }
    else X.handPaint(null, 'open');
    c.restore();
  }
  // cuisse (genou rond en bas) et tibia (genou rond en haut, pied vers +x, semelle en len+9)
  function thighR(len, wT, wK) { return [[-wT, -16], [wT - 2, -18], [wT + 1, 30], [wK + 1, len - 6]].concat(ep(0, len, wK, wK, 10, 0, PI), [[-wK - 1, len - 6], [-wT - 1, 30]]); }
  function shinR(len, wK, pied) {
    pied = pied || 1;
    return ep(0, 0, wK, wK, 10, PI, TAU).concat([[wK, 30], [wK - 2, len - 22], [wK, len - 12], [wK + 22 * pied, len - 5], [wK + 31 * pied, len + 3, 1], [wK + 29 * pied, len + 9, 1], [-wK - 2, len + 9, 1], [-wK - 3, len - 6], [-wK, len - 30], [-wK + 1, 30]]);
  }
  // IK deux segments (repère du torse) ; pick 'bas' (coude le plus bas), 'avant' (coude devant), 'arriere' ; le coude ne plie que vers l'avant
  function ik2(S, T, pick, LA, LB, retry) {
    const PHI = Math.atan2(-4, LB);
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
    if (best.sc < -1e5) return retry ? { a: tv, b: 0, sc: 0 } : ik2(S, [Math.max(T[0], S[0] + 12), T[1]], pick, LA, LB, true);
    return best;
  }
  FRK.ik2 = ik2;
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), libre: Object.assign({}, p.libre) }); }
  function headPt(q, KT, hx, hy) { return mp(new DOMMatrix().translate(KT.neck[0], KT.neck[1]).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function armTo(q, KT, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? KT.shF : KT.shB, T, pick, KT.LA, KT.LB || Math.hypot(4, 96)), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  // pivote le haut du corps autour de la hanche (th > 0 = vers l'avant) ; les jambes gardent leur angle à l'écran
  function pivot(q, th, hipY) {
    if (!th) return;
    const Dv = [q.dx || 0, hipY + (q.dy || 0)], N = rotP(Dv, -th);
    q.dx = N[0]; q.dy = N[1] - hipY; q.tilt = (q.tilt || 0) + th;
    q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th;
  }
  // assis (a 0..1) : cuisses à l'horizontale, tibias verticaux ; la hanche descend de LT ; les pieds avancent de LT
  function asseoir(q, a, LT) {
    if (a <= 0) return;
    const th = -PI / 2 * a, A = q.ang;
    A.legF = (A.legF || 0) + th; A.legB = (A.legB || 0) + th * 0.96; A.legF_lo = (A.legF_lo || 0) - th; A.legB_lo = (A.legB_lo || 0) - th * 0.96;
    q.dy = (q.dy || 0) + LT * (1 - Math.cos(th));
  }
  function marcher(q, cad, amp, bob, libres, genou) {
    const m = q.marche === true ? 1 : clamp(q.marche || 0); if (m <= 0) return;
    const ph = (q.t || 0) * PI * cad, s = Math.sin(ph), A = q.ang;
    A.legF = (A.legF || 0) - amp * s * m; A.legB = (A.legB || 0) + amp * s * m;
    if (genou) { A.legF_lo = (A.legF_lo || 0) + genou * Math.max(0, -s) * m; A.legB_lo = (A.legB_lo || 0) + genou * Math.max(0, s) * m; }
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * bob * m;
    if (libres.F) A.armF_up = (A.armF_up || 0) + 0.12 * s * m;
    if (libres.B) A.armB_up = (A.armB_up || 0) - 0.12 * s * m;
  }
  // objet droit à l'écran, seconde main sur la seconde prise, siège fixe au sol
  function finish(q, KT, def) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.doigts = 0; A.doigtsB = 0;
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2 && !has(q.tenuB)) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo);
      const Hf = new DOMMatrix().translate(KT.shF[0], KT.shF[1]).rotate((A.armF_up || 0) * D).translate(0, KT.LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(KT.shB, mp(Hf, ob.p2(oo)), q.pickB || 'bas', KT.LA, KT.LB || Math.hypot(4, 96));
      const kk = q.deuxMains === true ? 1 : clamp(q.deuxMains);
      A.armB_up = lerp(A.armB_up || 0, sol.a, kk); A.armB_lo = lerp(A.armB_lo || 0, sol.b, kk); q.handB = 'fist'; q._deux = kk > 0.6;
    }
    if (q._siege) {                                                             // le siège reste fixe au sol quand le corps bouge
      const Dv = [q.dx || 0, def.hipY + (q.dy || 0)], R = rotP(Dv, tl);
      q._sOff = [-R[0], def.hipY + q._sDy - R[1]]; A.siege = -tl; A.siegeAv = -tl;
    }
    return q;
  }
  function tenirA(q, KT, T, th, pick, k) { armTo(q, KT, 'armF', T, pick || 'bas', k == null ? 1 : k); q.droit = true; q.ang.objet = th || 0; }
  // liseré de lune : silhouette claire décalée, dessinée sous la marionnette (o.lune 0..1, o.luneDir [dx,dy] px, o.luneCol)
  let RIM = null;
  function rimLight(def, q, x, y, s, o) {
    if (SIL()) return;
    const main = cx_(); RIM = RIM || M.mkCanvas(M.W, M.H); const rc = RIM.getContext('2d');
    rc.setTransform(1, 0, 0, 1, 0, 0); rc.globalCompositeOperation = 'source-over'; rc.clearRect(0, 0, M.W, M.H); rc.setTransform(main.getTransform());
    M.use(rc); M.puppet(def, q, x, y, s, Object.assign({}, o, { cast: null, rod: false, floorShadow: false, alpha: 1, nom: '_lune' })); M.use(main);
    rc.setTransform(1, 0, 0, 1, 0, 0); rc.globalCompositeOperation = 'source-in'; rc.fillStyle = o.luneCol || '#c8d8ff'; rc.fillRect(0, 0, M.W, M.H); rc.globalCompositeOperation = 'source-over';
    const d = o.luneDir || [-3, -2.5], a = clamp(o.lune);
    main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 0.85 * a;
    main.drawImage(RIM, d[0], d[1]); main.globalAlpha = 0.45 * a; main.drawImage(RIM, d[0] * 0.5 + 1.5, d[1] * 0.5 - 1); main.restore();
  }
  function run(def, q, x, y, s, o) {
    o = Object.assign({ slot: M.ST.slotF }, o || {});
    if (o.lune > 0) rimLight(def, q, x, y, s, o);
    const r = M.puppet(def, q, x, y, s, o);
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  // point écran → repère du torse (pour l'option `cible`)
  function toTorso(def, q, x, y, s, dir, Pt) {
    const T0 = cx_().getTransform();
    const root = T0.translate(x, y).scale(s * (dir || 1), s).rotate((q.tilt || 0) * D).translate(q.dx || 0, def.hipY + (q.dy || 0));
    const pp = new DOMPoint(Pt[0], Pt[1]).matrixTransform(root.inverse()); return [pp.x, pp.y];
  }
  function wrap(name, poseFn, sDef) {
    const f = (pose, x, y, s, o) => {
      s = s == null ? sDef : s; o = o || {};
      let q = poseFn(pose);
      if (pose && pose.cible) { const L = toTorso(CH[name], q, x, y, s, o.dir, pose.cible); q = poseFn(Object.assign({}, pose, { cibleL: L })); }
      return run(CH[name], q, x, y, s, Object.assign({ nom: name }, o));
    };
    f.pose = poseFn; f.def = () => CH[name];
    return f;
  }
  FRK.toTorso = toTorso;
  function upDef(at, LA, base, seed, paint, wt, wTop) {
    return { parent: 'torso', at, pts: armR(LA, wt, wTop), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, LA + 4], [-16, LA + 4]], 0.9, 3.8, 0.28)) };
  }
  function foreDef(back, LA, base, skin, seed, o) {
    o = o || {};
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent: back ? 'armB_up' : 'armF_up', at: [0, LA], pts: (p) => foreR(hk(p), o.k, o.sh), base, seed, paint: (p) => {
      const k = hk(p), sh = o.sh || 0;
      fillPts([[-40, (o.peauY || 76) + sh, 1], [40, (o.peauY || 76) + sh, 1], [40, 180, 1], [-40, 180, 1]], skin); handPaintK(k, o.k, sh);
      if (o.cuff) fillPts([[-14, 60 + sh, 1], [14, 60 + sh, 1], [15, 78 + sh, 1], [-14, 78 + sh, 1]], o.cuff);
      if (o.paint) o.paint(p);
      hatch([[-14, -10], [-3, -10], [-3, 58], [-14, 58]], 0.9, 3.8, 0.22);
    } };
  }
  function legDefs(LT, LS, cols, seed, o) {
    o = o || {};
    const legPaint = (back) => () => {
      if (o.botte != null) { fillPts([[-40, o.botte, 1], [60, o.botte, 1], [60, LS + 20, 1], [-40, LS + 20, 1]], back ? cols.botteD || cols.botte : cols.botte); if (o.revers) fillPts(box(-16, o.botte, 16, o.botte + 9), o.revers); }
      else fillPts([[-40, LS - 14, 1], [60, LS - 14, 1], [60, LS + 20, 1], [-40, LS + 20, 1]], back ? cols.souD || cols.sou : cols.sou);
      if (!back) strokePts([[14, LS + 1], [36, LS + 6]], 'rgba(255,255,255,0.22)', 1.2);
      hatch([[-16, -10], [-4, -10], [-4, LS], [-16, LS]], 0.85, 3.8, back ? 0.3 : 0.2);
    };
    const thPaint = (back) => () => { hatch([[-22, -10], [-6, -10], [-6, LT + 8], [-22, LT + 8]], 0.85, 3.8, back ? 0.32 : 0.22); if (o.cuisse) o.cuisse(back); };
    return {
      legB: { parent: 'torso', at: [-6, -2], pts: thighR(LT, o.wT || 19, 12.5), base: cols.pantD, seed: seed, noRivet: true, paint: thPaint(true) },
      legB_lo: { parent: 'legB', at: [0, LT], pts: shinR(LS, 12.5, o.pied), base: cols.pantD, seed: seed + 1, paint: legPaint(true) },
      legF: { parent: 'torso', at: [6, -2], pts: thighR(LT, o.wT || 19, 12.5), base: cols.pant, seed: seed + 2, noRivet: true, paint: thPaint(false) },
      legF_lo: { parent: 'legF', at: [0, LT], pts: shinR(LS, 12.5, o.pied), base: cols.pant, seed: seed + 3, paint: legPaint(false) },
    };
  }
  // ---------------- sièges (repère : hanche assise en (0,0), sol en y = fy ; face vers +x) : bergère, fauteuil Empire, chaise
  const SIEGES = {
    bergere: { bois: '#9a7a44', boisD: '#6e5428', tissu: '#8a6a3a', tissuD: '#6e532c', tissuL: '#a8885a' },
    fauteuil: { bois: '#4a2618', boisD: '#331a10', tissu: '#6e2f2c', tissuD: '#4e1f1e', tissuL: '#8a4440' },
    chaise: { bois: '#4a2618', boisD: '#331a10', tissu: '#2f3a36', tissuD: '#232c28', tissuL: '#46524c' },
  };
  function siegeK(kind, k) { const P0 = SIEGES[kind]; if (!k) return P0; const o = {}; for (const n in P0) o[n] = M.mixc(P0[n], '#0c1020', k); return o; }
  function drawSiege(kind, fy, avant, k) {
    const C = siegeK(kind, k), sy = 14;                                  // dessus du coussin
    if (!avant) {
      if (kind === 'bergere') {
        pc([[-62, sy + 8], [-66, -60], [-62, -150], [-48, -186], [-24, -194, 1], [-14, -180], [-26, -150], [-34, -60], [-30, sy]], C.tissu, () => { hatch(null, 0.8, 4, 0.2); strokePts([[-54, -170], [-56, -40]], 'rgba(255,230,180,0.25)', 1.2); }, 8101);
        pc(ribbon([[-62, sy + 8], [-66, -60], [-62, -150], [-48, -186], [-24, -194]], 8), C.bois, () => strokePts([[-60, -140], [-50, -180]], 'rgba(255,230,170,0.5)', 1), 8102);
      } else if (kind === 'fauteuil') {
        pc([[-56, sy + 6], [-58, -60], [-62, -128], [-66, -140, 1], [-40, -136, 1], [-36, -120], [-34, -60], [-30, sy]], C.tissu, () => hatch(null, 0.8, 4, 0.2), 8111);
        pc([[-60, sy + 8], [-62, -128], [-70, -142, 1], [-64, -146, 1], [-54, -130], [-52, sy + 8]], C.bois, () => strokePts([[-58, -120], [-58, 0]], 'rgba(255,220,170,0.3)', 1), 8112);
      } else {
        pc([[-54, sy + 6], [-58, -130], [-64, -140, 1], [-56, -144, 1], [-48, -130], [-44, sy + 6]], C.bois, null, 8121);
        pc(ell(-50, -84, 10, 30, 14), C.boisD, () => { strokePts([[-50, -110], [-50, -58]], 'rgba(255,220,170,0.35)', 1.2); }, 8122);
      }
      // assise, ceinture, pieds
      pc([[-58, sy - 6], [70, sy - 8], [78, sy], [76, sy + 16, 1], [-58, sy + 16, 1]], C.tissu, () => { strokePts([[-50, sy - 4], [68, sy - 6]], 'rgba(255,235,200,0.25)', 1.3); hatch(null, 0.8, 4, 0.2); }, 8131);
      pc(box(-60, sy + 14, 78, sy + 34), C.bois, () => { strokePts([[-56, sy + 24], [74, sy + 24]], 'rgba(255,220,170,0.35)', 1); if (kind === 'bergere') for (let x = -50; x < 74; x += 14) dot(x, sy + 24, 1.6, 'rgba(255,230,170,0.5)'); }, 8132);
      for (const [x, f] of [[-52, -1], [66, 1]]) pc([[x - 6, sy + 32, 1], [x + 6, sy + 32, 1], [x + 3 + (kind === 'fauteuil' ? 6 * f : 0), fy, 1], [x - 3 + (kind === 'fauteuil' ? 6 * f : 0), fy, 1]], C.boisD, null, 8140 + x);
    } else if (kind === 'bergere') {                                                 // accoudoir (devant le corps)
      pc([[-44, -62], [40, -66], [56, -60], [60, -50], [52, -40], [30, -44], [-44, -40]], C.tissuL, () => hatch(null, 0.8, 4, 0.18), 8151);
      pc([[44, -52], [58, -52], [62, sy - 2], [44, sy - 2]], C.bois, () => strokePts([[52, -48], [54, sy - 4]], 'rgba(255,230,170,0.45)', 1), 8152);
      pc(ell(58, -52, 8, 8, 10), C.bois, null, 8153);
    } else if (kind === 'fauteuil') {
      pc([[-40, -58], [44, -62], [60, -56], [62, -46], [46, -48], [-40, -48]], C.bois, () => strokePts([[-36, -56], [54, -58]], 'rgba(255,220,170,0.35)', 1), 8161);
      pc([[48, -52], [60, -52], [58, sy - 2], [50, sy - 2]], C.bois, null, 8162);
      pc(ell(60, -54, 7, 7, 10), C.boisD, null, 8163);
    }
  }
  function siegeParts(seed) {
    return {
      siege: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed, pts: OFFP, extra: (p) => { if (!p._siege) return; const c = cx_(); c.save(); c.translate(p._sOff[0], p._sOff[1]); drawSiege(p._siege, p._sFy, false, p.siegeSombre); c.restore(); } },
      siegeAv: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (!p._siege) return; const c = cx_(); c.save(); c.translate(p._sOff[0], p._sOff[1]); drawSiege(p._siege, p._sFy, true, p.siegeSombre); c.restore(); } },
    };
  }
  const ORDER = (avantJambes, heads, apresTorse, fin) => ['siege', 'armB_up', 'armB_lo', 'objetB'].concat(avantJambes || [], ['legB', 'legB_lo', 'legF', 'legF_lo', 'head'], heads || [], ['torso'], apresTorse || [], ['siegeAv', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'], fin || []);
  // yeux et bouche : o.iris, o.blanc, f.regard (-1 vers l'arrière … 1 vers l'avant), f.eyes 'open'|'closed'|'wide'|'half'|valeur 0..1 (paupière)
  function oeil(f, x, y, sz, o) {
    o = o || {}; sz = sz || 1;
    let e = f.eyes || 'open';
    const lid = typeof e === 'number' ? clamp(e) : null;
    if (e === 'closed' || (lid != null && lid < 0.08)) { strokePts([[x - 6 * sz, y], [x, y + 2.2 * sz], [x + 6 * sz, y - 0.5 * sz]], o.trait || 'rgba(30,18,16,0.9)', 1.7); return; }
    const k = e === 'wide' ? 1.45 : e === 'half' ? 0.55 : lid != null ? lerp(0.35, 1, lid) : 1;
    const eyeP = [[x - 6 * sz, y], [x - 1 * sz, y - 3.3 * sz * k], [x + 5.5 * sz, y - 1.2 * sz * k], [x + 2.5 * sz, y + 1.8 * sz * k], [x - 4 * sz, y + 1 * sz]];
    fillPts(eyeP, o.blanc || '#efe8da', 0, 0);
    const rg = clamp(f.regard || 0, -1, 1), ix = x + (2.3 + rg * 2.6) * sz;
    if (o.iris) dot(ix, y - 0.6 * sz * k, 2.3 * sz * Math.min(1.15, k), o.iris);
    dot(ix + (o.iris ? 0.3 : 0), y - 0.6 * sz * k, (o.iris ? 1.1 : 2.0) * sz * Math.min(1.15, k), '#1f1716');
    strokePts([[x - 6.5 * sz, y + 0.3], [x - 1 * sz, y - 3.6 * sz * k], [x + 6 * sz, y - 1.4 * sz * k]], o.trait || 'rgba(28,16,14,0.95)', 1.8);
  }
  function bouche(f, x, y, col) {
    const m = f.mouth || 'n'; col = col || 'rgba(120,45,45,0.92)';
    if (m === 'smile') { strokePts([[x + 1, y - 1.5], [x - 3, y + 0.8], [x - 7, y - 1.5]], col, 1.6); return; }
    if (m === 'o') { fillPts([[x - 3.5, y - 3], [x + 1, y - 3.5], [x + 1.8, y + 3], [x - 3.5, y + 3.5]], '#2e1210', 0, 0); return; }
    if (m === 'tight') { strokePts([[x + 1, y], [x - 7, y + 0.6]], col, 1.8); return; }
    if (m === 'triste') { strokePts([[x + 1, y + 1.4], [x - 3, y - 0.4], [x - 7, y + 1.2]], col, 1.6); return; }
    strokePts([[x + 1, y], [x - 3, y + 0.6], [x - 7, y + 0.2]], col, 1.5);
  }
  function humeur(q, H) { const h = H[q.humeur]; if (!h) return; for (const k in h) if (q.face[k] == null) q.face[k] = h[k]; }
  const kOf = (q) => (n) => ease(clamp(q[n] === true ? 1 : q[n] || 0));

  function oreille(x, y, col) {
    fillPts([[x - 6, y - 9], [x + 3, y - 10], [x + 6, y - 2], [x + 4, y + 8], [x - 2, y + 11], [x - 7, y + 4]], col);
    strokePts([[x + 2, y - 6], [x - 3, y - 4], [x - 4, y + 3], [x + 1, y + 6]], 'rgba(80,40,30,0.55)', 1.1);
  }
  // contour hérissé (cheveux en bataille) : arc a0 → a1, pointes de hauteur variable
  function meches(cx, cy, rx, ry, a0, a1, n, amp, seed) {
    const o = [];
    for (let i = 0; i <= n; i++) {
      const a = lerp(a0, a1, i / n), pointe = i % 2 === 1, k = pointe ? 1 + amp * (0.55 + 0.45 * hash(seed + i * 1.3)) : 1, da = pointe ? (hash(seed + i * 2.1) - 0.5) * 0.12 : 0;
      o.push(pointe ? [cx + Math.cos(a + da) * rx * k, cy + Math.sin(a + da) * ry * k, 1] : [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return o;
  }

  // tignasse irrégulière : calotte à rayon ondulant + mèches pointues (tips : [u 0..1 le long de l'arc, k rayon, da décalage d'angle])
  function tignasse(cx, cy, rx, ry, a0, a1, n, amp, tips, seed) {
    const o = [];
    for (let i = 0; i <= n; i++) { const u = i / n, a = lerp(a0, a1, u), f = 1 + amp * (Math.sin(a * 5 + seed) * 0.6 + Math.sin(a * 13 + seed * 2) * 0.4); o.push({ u, p: [cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f] }); }
    for (const [u, k, da] of tips) { const a = lerp(a0, a1, u) + (da || 0); o.push({ u, p: [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k, 1] }); }
    o.sort((A, B) => A.u - B.u);
    return o.map((e) => e.p);
  }
  // chevelure « peinte » : aplat + trait sombre fin, SANS le gros liseré blanc de découpe (qui ferait une calotte)
  function chev(pts, base, paint, seed) {
    const c = cx_();
    if (SIL()) { M.path(pts, seed, 0.4); c.fillStyle = '#000'; c.fill(); return; }
    c.save(); c.translate(1.2 * M._lw(), 1.8 * M._lw()); M.path(pts, seed, 0.4); c.fillStyle = 'rgba(16,9,5,0.22)'; c.fill(); c.restore();
    M.path(pts, seed, 0.4); c.fillStyle = base; c.fill();
    if (paint) { c.save(); M.path(pts, seed, 0.4); c.clip(); paint(); c.restore(); }
    M.path(pts, seed, 0.4); c.lineJoin = 'round'; c.lineWidth = 1.5 * M._lw(); c.strokeStyle = 'rgba(18,10,6,0.8)'; c.stroke();
  }
  const chevPart = (pts, base, paint, seed) => ({ parent: 'head', at: [0, 0], pts: OFFP, base: '#000', seed, noRivet: true, extra: (p) => chev(typeof pts === 'function' ? pts(p) : pts, base, paint, seed) });
  // =====================================================================
  // 4) MARY GODWIN (Mary Shelley), 18 ans — robe Empire bleu nuit à liseré ivoire, châle gris perle, cheveux auburn clair en chignon bas,
  //    boucles aux tempes, teint pâle, grands yeux. Jambes simples cachées par la robe (seuls les chaussons dépassent).
  // =====================================================================
  const MY = { peau: '#eed6c0', peauD: '#d6b89e', cheveux: '#a5683e', cheveuxL: '#c48a5a', cheveuxD: '#7a4a2a', robe: '#2b3550', robeL: '#3c4868', robeD: '#1f2740',
    liseré: '#e9e0c8', chale: '#b9b4a8', chaleD: '#9a9588', chausson: '#1a1f30' };
  const KMY = { shF: [-2, -148], shB: [-10, -148], neck: [6, -172], LA: 94, LB: Math.hypot(4, 96) };
  const MY_TORSO = [[-12, -176], [8, -180], [15, -170], [21, -154], [29, -140], [31, -129], [22, -121], [24, -80], [28, 0], [34, 100], [40, 190], [45, 230, 1], [-52, 232, 1], [-47, 180], [-39, 80], [-33, 0], [-28, -80], [-26, -120], [-27, -140], [-27, -154], [-20, -170]];
  const MY_ASSISE = [[-12, -176], [8, -180], [15, -170], [21, -154], [29, -140], [31, -129], [22, -121], [26, -70], [30, -32], [52, -16], [92, -13], [112, -7], [119, 10], [114, 60], [118, 108], [124, 124, 1], [58, 126, 1], [54, 40], [40, 22], [-32, 18], [-33, 0], [-28, -60], [-26, -120], [-27, -140], [-27, -154], [-20, -170]];
  const MY_HEAD = [[-12, 16], [9, 16], [12, 6], [18, -2], [23, -9], [25, -15], [24, -19], [26, -22], [25, -26], [26, -30], [31, -36, 1], [28, -43], [26, -52], [26, -62], [22, -76], [10, -88], [-6, -92], [-22, -86], [-31, -68], [-31, -46], [-25, -27], [-18, -8]];
  const MY_HAIR = ep(-4, -62, 37, 35, 18, -0.17 * PI, -1.12 * PI).concat([[-36, -40], [-32, -24], [-22, -26], [-12, -32], [-2, -40], [4, -52], [8, -62], [16, -70], [24, -74]]);
  const MY_LEG = [[-12, -10], [12, -12], [14, 40], [12, 110], [10, 160], [8, 200], [9, 216], [30, 222], [38, 232, 1], [-12, 236, 1], [-14, 222], [-12, 200], [-14, 160], [-16, 110], [-15, 40]];
  const MY_PIEDS = [[100, 112], [128, 114], [142, 122], [140, 127, 1], [100, 127, 1]];
  function mkMary() {
    const legPaint = (b) => () => { fillPts([[-30, 200, 1], [60, 200, 1], [60, 250, 1], [-30, 250, 1]], MY.chausson); if (!b) strokePts([[16, 223], [34, 229]], 'rgba(255,255,255,0.25)', 1.2); };
    const parts = {
      legB: { parent: 'torso', at: [-6, -2], pts: MY_LEG, base: '#d8cfbf', seed: 9101, noRivet: true, paint: legPaint(true) },
      legF: { parent: 'torso', at: [6, -2], pts: MY_LEG, base: '#e2dacb', seed: 9102, paint: legPaint(false) },
      pieds: { parent: 'torso', at: [0, 0], pts: (p) => (p._assise ? MY_PIEDS : OFFP), base: MY.chausson, seed: 9103, noRivet: true, paint: () => strokePts([[110, 116], [130, 118]], 'rgba(255,255,255,0.25)', 1.1) },
      torso: { parent: null, at: [0, 0], pts: (p) => (p._assise ? MY_ASSISE : MY_TORSO), base: MY.robe, seed: 9104, paint: (p) => {
        const as = !!p._assise;
        fillPts([[-11, -182], [10, -184], [17, -172], [16, -164], [-8, -166]], MY.liseré);                         // chemisette ivoire
        for (let x = -8; x < 16; x += 4) dot(x, -165, 1.1, 'rgba(160,150,130,0.7)');
        fillPts([[-28, -131], [31, -131], [31, -123], [-28, -123]], MY.liseré);                                   // ruban de la taille haute
        strokePts([[-26, -127], [30, -127]], 'rgba(150,140,120,0.5)', 0.8);
        if (!as) { for (const [x0, x1] of [[-16, -30], [-2, -10], [10, 18], [-26, -44]]) strokePts([[x0, -118], [(x0 + x1) / 2, 60], [x1, 224]], 'rgba(120,135,170,0.35)', 1.2); fillPts([[-51, 220], [44, 218], [45, 229], [-52, 231]], MY.liseré); }
        else { for (const x of [66, 88, 106]) strokePts([[x, -8], [x + 6, 120]], 'rgba(120,135,170,0.35)', 1.2); fillPts([[56, 116], [123, 114], [124, 124], [58, 126]], MY.liseré); strokePts([[30, -24], [112, -8]], 'rgba(120,135,170,0.4)', 1.2); }
        // châle gris perle : sur le dos et les épaules, pointe frangée dans le dos, pan croisé sur la poitrine
        fillPts([[-26, -172], [-8, -178], [-2, -164], [-14, -130], [-24, -84], [-34, -58], [-42, -76], [-38, -124], [-32, -158]], MY.chale);
        for (let i = 0; i < 6; i++) strokePts([[-34 - i * 1.2, -62 + i * 3], [-37 - i * 1.4, -50 + i * 3]], 'rgba(150,145,135,0.8)', 1);
        strokePts([[-20, -170], [-28, -120], [-36, -70]], 'rgba(120,115,105,0.5)', 1.1);
        fillPts([[8, -174], [20, -164], [27, -146], [22, -134], [12, -142], [6, -160]], MY.chale);
        strokePts([[10, -168], [22, -142]], 'rgba(120,115,105,0.5)', 1);
        strokePts([[22, -150], [28, -136]], 'rgba(255,255,255,0.18)', 2);
        hatch([[-56, -170], [-14, -170], [-20, 234], [-56, 234]], 0.75, 4.4, 0.22, 1.05, '190,200,230');
        shade(40, 0, -46, 0, 0.26);
      } },
      armB_up: upDef([-10, -148], 94, MY.robeD, 9105, () => hatch(null, 0.9, 3.8, 0.3, 1, '160,170,200'), 12, 14),
      armB_lo: foreDef(true, 94, MY.robeD, MY.peauD, 9106, { cuff: '#c9c0aa' }),
      head: { parent: 'torso', at: [6, -172], pts: MY_HEAD, base: MY.peau, seed: 9107, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-6, -44, MY.peauD);
        hatch([[-22, -40], [0, -28], [8, -8], [-8, 18], [-30, 4]], 0.6, 3.8, 0.16);
        dot(12, -28, 7, 'rgba(220,130,120,0.22)');
        oeil(f, 15, -46, 1.12, { iris: '#5a6a7a' }); strokePts([[8, -50], [6, -53]], 'rgba(28,16,14,0.9)', 1.1);
        X.brow(f, 15, -55, 'rgba(120,70,40,0.85)', 1.6);
        bouche(f, 22, -21, 'rgba(160,60,60,0.95)');
        strokePts([[14, -8], [22, -6]], 'rgba(150,100,80,0.3)', 1.1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: MY_HAIR, base: MY.cheveux, seed: 9108, noRivet: true, paint: () => {
        for (let i = 0; i < 6; i++) strokePts(ep(-4, -62, 30 - i * 3, 28 - i * 3, 10, -0.3 * PI, -1.05 * PI), `rgba(${i % 2 ? '200,140,90' : '110,60,30'},0.4)`, 1.1);
        strokePts([[18, -86], [8, -94], [-6, -96]], 'rgba(230,180,130,0.6)', 1.6);
        hatch(null, 0.5, 3.4, 0.16, 1, '60,30,15');
      } },
      chignon: { parent: 'head', at: [0, 0], pts: ell(-35, -30, 15, 13, 14), base: MY.cheveuxD, seed: 9109, noRivet: true, paint: () => {
        for (let i = 0; i < 4; i++) strokePts(ep(-35, -30, 12 - i * 3, 10 - i * 2.5, 10, -PI * 0.9 + i, PI * 0.8 + i), 'rgba(200,140,90,0.55)', 1.1);
      } },
      boucles: { parent: 'head', at: [0, 0], pts: [[6, -70], [13, -68], [14, -61], [11, -56], [13, -50], [11, -44], [7, -42], [4, -46], [5, -53], [3, -60]], base: MY.cheveuxD, seed: 9110, noRivet: true, paint: () => {
        strokePts(ep(9, -63, 3, 4, 10, 0, TAU * 0.9), 'rgba(230,170,120,0.7)', 1); strokePts(ep(9, -49, 2.5, 3.5, 10, 0, TAU * 0.9), 'rgba(230,170,120,0.7)', 1);
      } },
      armF_up: upDef([-2, -148], 94, MY.robe, 9111, () => {
        const ch = [[-15, -16], [15, -16], [15, 6], [8, 16], [-2, 24], [-12, 28], [-15, 22]]; fillPts(ch, MY.chale);              // le châle sur l'épaule
        strokePts([[-14, 6], [6, 0]], 'rgba(120,115,105,0.45)', 1); for (let i = 0; i < 6; i++) strokePts([[13 - i * 5, 12 + i * 3], [12 - i * 5, 18 + i * 3]], 'rgba(150,145,135,0.85)', 0.9);
        hatch([[-22, 40], [-3, 40], [-3, 100], [-22, 100]], 0.9, 3.8, 0.22, 1, '160,170,200');
      }, 12, 15),
      armF_lo: foreDef(false, 94, MY.robe, MY.peau, 9112, { cuff: MY.liseré }),
    };
    Object.assign(parts, heldParts(MY.peau, 9120), siegeParts(9130));
    return { hipY: -236, parts, handLen: 100, rod: { part: 'torso', at: [-18, 36] }, nom: 'Mary',
      order: ['siege', 'armB_up', 'armB_lo', 'objetB', 'legB', 'legF', 'pieds', 'head', 'cheveux', 'chignon', 'boucles', 'torso', 'siegeAv', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.frkMary = mkMary();
  const HUM_MY = { songeuse: { brow: 'n', eyes: 'half', mouth: 'n', regard: 0.6 }, effrayee: { brow: 'worry', eyes: 'wide', mouth: 'o' }, illuminee: { brow: 'up', eyes: 'wide', mouth: 'smile' } };
  // gestes : ecrire(+cible), plume, menton, tenir(+cible), assise(+siege), dort, sursaut, marche ; humeur songeuse|effrayee|illuminee
  FRK.maryPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, KT = KMY, k = kOf(q);
    const ec = k('ecrire'), pl = k('plume'), me = k('menton'), te = k('tenir'), dor = k('dort'), su = k('sursaut');
    humeur(q, HUM_MY);
    if (A.armF_up == null) A.armF_up = 0.04; if (A.armF_lo == null) A.armF_lo = -0.16;
    if (A.armB_up == null) A.armB_up = -0.02; if (A.armB_lo == null) A.armB_lo = -0.14;
    if (q.assise) { q._assise = true; q.dy = (q.dy || 0) + 110; q.hide.legF = 1; q.hide.legB = 1; if (q.siege !== false) { q._siege = q.siege || 'fauteuil'; q._sDy = 110; q._sFy = 126; } }
    if (te > 0 && !q.tenu) q.tenu = 'livre';
    if ((ec > 0 || pl > 0) && !q.tenu) q.tenu = 'plume';
    marcher(q, 1.1, 0.2, 3, { F: !has(q.tenu) && !me && !su, B: !has(q.tenuB) && !te && !ec && !su }, 0);
    if (ec > 0) {                                                                // le bec de la plume va sur la cible et griffonne
      const T0 = q.cibleL || (q.assise ? [100, -40] : [104, -58]), th = -0.5;
      const sx = 7 * Math.sin(t * 9) + 3 * Math.sin(t * 23), sy = 2.5 * Math.sin(t * 17);
      const bec = rotP(OBJ.plume.pts.bec, th), T = [T0[0] + sx - bec[0], T0[1] + sy - bec[1]];
      if (q.tenu === 'plume') tenirA(q, KT, T, th, 'bas', ec);
      if (!has(q.tenuB)) { armTo(q, KT, 'armB', [T0[0] - 46, T0[1] + 4], 'bas', ec); q.handB = 'open'; }
      A.head = (A.head || 0) + 0.24 * ec; if (!f.eyes) f.eyes = 'half';
    }
    if (pl > 0) {                                                                // plume levée, hésitante, à hauteur du menton
      const T = [96 + 4 * Math.sin(t * 1.7), -132 + 5 * Math.sin(t * 2.3)];
      tenirA(q, KT, T, 0.5 + 0.12 * Math.sin(t * 1.9), 'bas', pl);
      A.head = (A.head || 0) - 0.08 * pl; if (f.regard == null) f.regard = 0.7;
      if (!has(q.tenuB) && !ec) { armTo(q, KT, 'armB', [30, -60], 'bas', pl); q.handB = 'open'; }
    }
    if (me > 0) {                                                                // main au menton, songeuse
      const T = headPt(q, KT, 20, 12); armTo(q, KT, 'armF', T, 'bas', me);
      q.handF = 'fist'; A.head = (A.head || 0) + 0.06 * me; if (!f.eyes) f.eyes = 'half';
      if (!has(q.tenuB)) { armTo(q, KT, 'armB', [24, -96], 'bas', me * 0.8); }
    }
    if (te > 0) {                                                                // le livre devant elle, à deux mains
      tenirA(q, KT, q.cibleL || [100, -104], 0, 'bas', te); q.deuxMains = te; A.head = (A.head || 0) + 0.12 * te;
    }
    const dd = dor * (1 - su);
    if (dd > 0) {                                                                // endormie : tête tombée, buste affaissé, mains sur les genoux
      A.head = (A.head || 0) + 0.5 * dd; pivot(q, -0.07 * dd, -236);
      if (!has(q.tenu) && !ec && !te) { armTo(q, KT, 'armF', q.assise ? [70, -6] : [30, -40], 'bas', dd); q.handF = 'open'; }
      blend(q, 'armB_up', 0.02, dd); blend(q, 'armB_lo', -0.5, dd);
      if (dd > 0.5) { f.eyes = 'closed'; if (!f.mouth || f.mouth === 'o') f.mouth = 'n'; f.brow = 'n'; }
    }
    if (su > 0) {                                                                // réveil en sursaut : buste qui se redresse, yeux grands ouverts
      A.head = (A.head || 0) - 0.12 * su; pivot(q, 0.06 * su, -236); q.dy = (q.dy || 0) - 4 * su;
      if (!has(q.tenu)) { armTo(q, KT, 'armF', [38, -128], 'bas', su); if (su > 0.3) q.handF = 'open'; }
      if (su > 0.3) { f.eyes = 'wide'; f.brow = 'up'; f.mouth = 'o'; }
    }
    return finish(q, KT, CH.frkMary);
  };
  FRK.mary = wrap('frkMary', FRK.maryPose, 0.9);

  // =====================================================================
  // 5) LES HOMMES — même ossature (jambes à genou rond, assis sur un siège fixe au sol)
  // =====================================================================
  const KH = { shF: [-2, -150], shB: [-10, -150], neck: [6, -174], LA: 96, LB: Math.hypot(4, 96) };
  const LT_H = 112;
  // ---- Lord Byron : cheveux bruns très bouclés, favoris, col blanc ouvert très haut, foulard noir lâche, habit vert bouteille à basques,
  //      gilet bordeaux, pantalon chamois, bottes à revers ; port de tête altier
  const BY = { peau: '#e6c8a8', peauD: '#c9a684', cheveux: '#2e2219', cheveuxL: '#5a4434', habit: '#23392f', habitL: '#335244', habitD: '#182a22', gilet: '#5b2230', giletL: '#7a3242',
    col: '#f1ede2', colD: '#d2cbbb', pant: '#b9a27a', pantD: '#9a845e', botte: '#141214', revers: '#8a6a44' };
  const BY_TORSO = [[-16, -178], [8, -182], [18, -172], [30, -152], [38, -120], [42, -84], [40, -50], [36, -20], [34, 4], [20, 14, 1], [-6, 30], [-22, 70], [-30, 120], [-40, 124, 1], [-44, 60], [-42, 0], [-40, -60], [-42, -118], [-38, -150], [-28, -170]];
  const BY_HEAD = [[-14, 16], [10, 16], [12, 2], [19, -5], [27, -9], [31, -15], [29, -21], [30, -25], [29, -29], [32, -34], [38, -41, 1], [33, -46], [30, -56], [30, -64], [27, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const BY_HAIR = boucles(-4, -65, 41, 39, -0.2 * PI, -1.32 * PI, 14, 0.13).concat([[-24, -30], [-20, -42], [-14, -54], [-5, -59], [-1, -57], [-0.5, -50], [0.5, -44, 1], [2.5, -50], [3.5, -58], [8, -68], [18, -76], [25, -82]]);
  function mkByron() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: BY_TORSO, base: BY.habit, seed: 9201, paint: () => {
        fillPts([[8, -174], [30, -152], [38, -118], [41, -84], [39, -50], [35, -20], [33, 4], [22, 12], [16, -40], [12, -120]], BY.gilet);   // gilet bordeaux
        for (const y of [-130, -108, -86, -64, -42, -20]) dot(30 + (y + 120) * 0.02, y, 1.9, '#c9a85a');
        hatch([[10, -170], [40, -170], [40, 10], [10, 10]], 1.1, 3.6, 0.18, 1, '40,10,15');
        strokePts([[10, -172], [20, -130], [17, -86], [16, -40], [20, 12]], 'rgba(10,20,15,0.7)', 1.6);                              // bord de l'habit
        fillPts([[-2, -178], [12, -172], [20, -140], [14, -126], [6, -150]], BY.habitL);                                               // grand revers
        strokePts([[-6, 30], [-24, 76], [-30, 118]], 'rgba(10,20,15,0.5)', 1.2); strokePts([[-36, 20], [-38, 116]], 'rgba(10,20,15,0.45)', 1.2);
        for (const y of [8, 16]) dot(-24, y, 2, '#c9a85a');
        hatch([[-56, -170], [-12, -170], [-14, 126], [-56, 126]], 0.75, 4.2, 0.28, 1.05, '180,210,190');
        shade(42, 0, -44, 0, 0.28);
      } },
      armB_up: upDef([-10, -150], 96, BY.habitD, 9202, null, 14, 16),
      armB_lo: foreDef(true, 96, BY.habitD, BY.peauD, 9203, { cuff: BY.colD }),
      head: { parent: 'torso', at: [6, -174], pts: BY_HEAD, base: BY.peau, seed: 9204, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-8, -44, BY.peauD);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.2);
        dot(16, -30, 7, 'rgba(200,120,100,0.16)');
        oeil(f, 17, -52, 1, { iris: '#4a3a2a' }); X.brow(f, 17, -60, 'rgba(40,28,20,0.95)', 2.4); bouche(f, 27, -26);
        strokePts([[29, -18], [31, -15]], 'rgba(120,80,60,0.45)', 1);
      } },
      cheveux: chevPart(BY_HAIR, BY.cheveux, () => {
        for (let i = 0; i < 18; i++) { const a = -0.24 * PI - i * 0.062 * PI, r = 24 + 9 * (i % 3); strokePts(ep(-4 + Math.cos(a) * r, -65 + Math.sin(a) * r, 4.2, 3.8, 8, a + 0.6, a + 0.6 + 1.6 * PI), 'rgba(120,92,66,0.75)', 1.1); }
        hatch(null, 0.5, 3.2, 0.18, 1, '10,5,0');
      }, 9206),
      col: { parent: 'torso', at: [0, 0], pts: [[-14, -176], [-11, -192], [-2, -186], [4, -178], [10, -176], [18, -189, 1], [24, -174], [20, -166], [10, -168], [-6, -170]], base: BY.col, seed: 9207, noRivet: true, paint: () => {
        strokePts([[10, -175], [17, -187]], 'rgba(160,150,130,0.6)', 1); shade(-10, -180, 20, -180, 0.18, [-20, -200, 30, -160]);
      } },
      foulard: { parent: 'torso', at: [0, 0], pts: [[8, -172], [24, -174], [30, -164], [26, -152], [32, -132], [28, -118], [22, -124], [20, -142], [12, -150], [6, -160]], base: '#151417', seed: 9208, noRivet: true, paint: () => {
        strokePts([[14, -166], [24, -160], [26, -140]], 'rgba(255,255,255,0.18)', 1.4); hatch(null, 0.9, 3, 0.25);
      } },
      armF_up: upDef([-2, -150], 96, BY.habit, 9209, () => { strokePts([[-6, -10], [-4, 80]], 'rgba(255,255,255,0.1)', 2); hatch([[-22, -20], [-3, -20], [-3, 100], [-22, 100]], 0.9, 3.8, 0.24, 1, '180,210,190'); }, 14, 16),
      armF_lo: foreDef(false, 96, BY.habit, BY.peau, 9210, { cuff: BY.col }),
    };
    Object.assign(parts, legDefs(LT_H, 114, { pant: BY.pant, pantD: BY.pantD, botte: BY.botte, botteD: '#0c0b0d' }, 9211, { botte: 8, revers: BY.revers }), heldParts(BY.peau, 9220), siegeParts(9230));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Byron', order: ORDER([], ['cheveux'], ['col', 'foulard']) };
  }
  CH.frkByron = mkByron();
  const HUM_H = { neutre: {}, inquiet: { brow: 'worry', mouth: 'tight' }, effraye: { brow: 'worry', eyes: 'wide', mouth: 'o' }, sombre: { brow: 'frown', mouth: 'tight', eyes: 'half' }, ironique: { brow: 'up', mouth: 'smile', eyes: 'half' } };
  // assis / leve / siège : commun aux hommes. Renvoie la part assise (0..1).
  function assisH(q, hipY) {
    let a = q.assis ? 1 : 0; const lv = q.leve == null ? 0 : ease(clamp(q.leve));
    if (q.leve != null) a = 1 - lv;
    if (a > 0 || q.leve != null) {
      asseoir(q, a, LT_H);
      if (q.leve != null) { const th = PI / 2 * a; q.dx = (q.dx || 0) + LT_H * (1 - Math.sin(th)); pivot(q, 0.42 * Math.sin(PI * lv), hipY); }
      if (q.siege !== false) { q._siege = q.siege || 'chaise'; q._sDy = LT_H; q._sFy = -hipY - LT_H; }
    }
    return a;
  }
  // gestes : ennui (affalé dans la bergère, joue dans la main), leve 0..1, defi, ecrire(+cible), assis(+siege), depit, marche ; humeur
  FRK.byronPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, KT = KH, k = kOf(q), hipY = -238;
    const en = k('ennui'), de = k('defi'), ec = k('ecrire'), dp = k('depit');
    humeur(q, HUM_H);
    if (A.armF_up == null) A.armF_up = 0.05; if (A.armF_lo == null) A.armF_lo = -0.18;
    if (A.armB_up == null) A.armB_up = -0.02; if (A.armB_lo == null) A.armB_lo = -0.14;
    A.head = (A.head || 0) - 0.08;                                                 // menton levé, port altier
    if (en > 0 && !q.assis && q.leve == null) q.assis = true;
    if (en > 0 && !q.siege) q.siege = 'bergere';
    const as = assisH(q, hipY);
    if ((ec > 0) && !q.tenu) q.tenu = 'plume';
    marcher(q, 1.3, 0.28, 3, { F: !has(q.tenu) && !de && !dp, B: !has(q.tenuB) && !ec }, 0.35);
    if (en > 0) {                                                                // affalé, la joue dans la main, jambe allongée
      pivot(q, -0.2 * en, hipY);
      A.head = (A.head || 0) + 0.2 * en;
      const T = headPt(q, KT, 22, -12); armTo(q, KT, 'armF', [T[0] - 2, T[1] + 10], 'bas', en); if (en > 0.4) q.handF = 'open';
      blend(q, 'armB_up', -0.35, en); blend(q, 'armB_lo', -0.7, en);
      A.legF = (A.legF || 0) + 0.25 * en * as; A.legF_lo = (A.legF_lo || 0) - 0.95 * en * as;
      if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'tight';
    }
    if (de > 0) {                                                                // défi : bras ouvert vers les invités, paume en l'air, coude plié vers l'avant
      blend(q, 'armF_up', -0.42, de); blend(q, 'armF_lo', -1.55, de); if (de > 0.3) q.handF = 'paume';
      if (!has(q.tenuB)) { blend(q, 'armB_up', -0.1, de); blend(q, 'armB_lo', -0.5, de); }
      A.head = (A.head || 0) - 0.12 * de; pivot(q, -0.05 * de, hipY);
      if (!f.brow) f.brow = 'up'; if (!f.mouth) f.mouth = 'smile';
    }
    if (ec > 0) {
      const T0 = q.cibleL || (as > 0.5 ? [100, -40] : [104, -58]), th = -0.5;
      const sx = 7 * Math.sin(t * 8) + 3 * Math.sin(t * 21), sy = 2.5 * Math.sin(t * 15);
      const bec = rotP(OBJ.plume.pts.bec, th), T = [T0[0] + sx - bec[0], T0[1] + sy - bec[1]];
      if (q.tenu === 'plume') tenirA(q, KT, T, th, 'bas', ec);
      if (!has(q.tenuB)) { armTo(q, KT, 'armB', [T0[0] - 48, T0[1] + 4], 'bas', ec); q.handB = 'open'; }
      A.head = (A.head || 0) + 0.3 * ec; if (!f.eyes) f.eyes = 'half';
    }
    if (dp > 0) {                                                                // dépit : il repose la plume, main ouverte à plat, tête qui tombe
      const T0 = q.cibleL || (as > 0.5 ? [104, -36] : [96, -40]);
      armTo(q, KT, 'armF', T0, 'bas', dp); if (dp > 0.5) q.handF = 'open';
      A.head = (A.head || 0) + 0.26 * dp; pivot(q, -0.06 * dp, hipY);
      if (!f.brow) f.brow = 'worry'; if (!f.eyes) f.eyes = 'half'; if (!f.mouth) f.mouth = 'tight';
    }
    return finish(q, KT, CH.frkByron);
  };
  FRK.byron = wrap('frkByron', FRK.byronPose, 0.92);

  // ---- Percy Shelley : grand et mince, cheveux châtain clair en désordre, chemise blanche col ouvert (sans foulard), veste courte bleu ardoise
  const PE = { peau: '#ecd0b4', peauD: '#cfb090', cheveux: '#8a6440', cheveuxL: '#93704c', veste: '#4a5a6a', vesteL: '#5e7082', vesteD: '#38444f', chemise: '#f0ece2', chemiseD: '#d4cdbd',
    pant: '#8f918b', pantD: '#777973', sou: '#18161a' };
  const LT_PE = 118, HIP_PE = -(2 + LT_PE + 123);
  const PE_TORSO = [[-14, -178], [8, -182], [16, -172], [26, -152], [32, -120], [34, -84], [32, -46], [30, -14], [28, 6], [12, 14, 1], [-10, 26], [-24, 62], [-30, 76, 1], [-38, 72], [-38, 0], [-36, -60], [-38, -118], [-34, -150], [-26, -170]];
  const PE_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [23, -10], [26, -16], [25, -21], [27, -25], [26, -29], [29, -34], [33, -40, 1], [30, -46], [28, -56], [28, -64], [25, -78], [13, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  const PE_HAIR = tignasse(-4, -65, 40, 38, -0.16 * PI, -1.34 * PI, 28, 0.05, [[0.05, 1.13, 0.1], [0.22, 1.1], [0.36, 1.13, -0.05], [0.52, 1.1], [0.68, 1.12], [0.84, 1.09]], 2.3).map((p) => [p[0], p[1]]).concat([[-24, -26], [-19, -40], [-13, -53], [-3, -60], [7, -64], [13, -60], [18, -64], [27, -60], [24, -72], [31, -78]]);
  function mkPercy() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PE_TORSO, base: PE.veste, seed: 9301, paint: () => {
        fillPts([[4, -178], [16, -180], [24, -160], [29, -128], [28, -98], [20, -94], [14, -128], [8, -158]], PE.chemise);              // chemise ouverte
        fillPts([[4, -180], [18, -180], [22, -170], [14, -146], [8, -160]], PE.peau); strokePts([[10, -168], [14, -150]], 'rgba(160,110,90,0.4)', 1);   // col ouvert : le cou et le haut de la poitrine
        strokePts([[14, -150], [20, -96]], 'rgba(150,140,120,0.5)', 1);
        strokePts([[6, -176], [16, -140], [18, -96], [22, 8]], 'rgba(20,28,36,0.7)', 1.5);
        fillPts([[-2, -178], [10, -170], [16, -142], [10, -132], [4, -152]], PE.vesteL);                                               // revers
        for (const y of [-80, -56]) dot(26, y, 2, '#2a3038');
        strokePts([[-10, 26], [-26, 70]], 'rgba(20,28,36,0.5)', 1.2);
        hatch([[-56, -170], [-12, -170], [-14, 80], [-56, 80]], 0.75, 4.2, 0.26, 1.05, '200,215,230');
        shade(36, 0, -40, 0, 0.26);
      } },
      armB_up: upDef([-10, -150], 96, PE.vesteD, 9302, null, 13, 15),
      armB_lo: foreDef(true, 96, PE.vesteD, PE.peauD, 9303, { cuff: PE.chemiseD }),
      head: { parent: 'torso', at: [6, -174], pts: PE_HEAD, base: PE.peau, seed: 9304, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-8, -44, PE.peauD);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.16);
        dot(14, -28, 7, 'rgba(220,130,110,0.2)');
        oeil(f, 17, -52, 1.04, { iris: '#5a7a90' }); X.brow(f, 17, -60, 'rgba(110,80,50,0.9)', 1.9); bouche(f, 25, -26);
      } },
      cheveux: chevPart(PE_HAIR, PE.cheveux, () => {
        for (let i = 0; i < 8; i++) { const a = -0.2 * PI - i * 0.14 * PI; strokePts(qbez([-4 + Math.cos(a) * 14, -65 + Math.sin(a) * 14], [-4 + Math.cos(a - 0.35) * 30, -65 + Math.sin(a - 0.35) * 30], [-4 + Math.cos(a - 0.1) * 40, -65 + Math.sin(a - 0.1) * 38]), 'rgba(196,158,112,0.65)', 1.2); }
        strokePts(qbez([6, -92], [24, -86], [26, -64]), 'rgba(196,158,112,0.7)', 1.3);
        hatch(null, 0.4, 3.4, 0.12, 1, '40,25,10');
      }, 9305),
      col: { parent: 'torso', at: [0, 0], pts: [[-14, -176], [-12, -184], [-2, -182], [4, -170], [8, -160, 1], [-4, -164], [-10, -170]], base: PE.chemise, seed: 9306, noRivet: true },
      colAv: { parent: 'torso', at: [0, 0], pts: [[16, -176], [26, -170], [34, -150, 1], [24, -154], [18, -162]], base: PE.chemise, seed: 9309, noRivet: true, paint: () => strokePts([[18, -172], [30, -154]], 'rgba(150,140,120,0.5)', 1) },
      armF_up: upDef([-2, -150], 96, PE.veste, 9307, () => hatch([[-22, -20], [-3, -20], [-3, 100], [-22, 100]], 0.9, 3.8, 0.22, 1, '200,215,230'), 13, 15),
      armF_lo: foreDef(false, 96, PE.veste, PE.peau, 9308, { cuff: PE.chemise }),
    };
    Object.assign(parts, legDefs(LT_PE, 114, { pant: PE.pant, pantD: PE.pantD, sou: PE.sou, souD: '#0e0d10' }, 9311, { wT: 17 }), heldParts(PE.peau, 9320), siegeParts(9330));
    return { hipY: HIP_PE, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Percy', order: ORDER([], ['cheveux'], ['col', 'colAv']) };
  }
  CH.frkPercy = mkPercy();
  // gestes : ecoute, assis(+siege), verre (verre tenu), trinque (verre levé), bras (mains jointes devant : les bras croisés sont interdits de profil), marche
  FRK.percyPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, KT = KH, k = kOf(q), hipY = HIP_PE;
    const eco = k('ecoute'), ve = k('verre'), tr_ = k('trinque'), br = k('bras');
    humeur(q, HUM_H);
    if (A.armF_up == null) A.armF_up = 0.05; if (A.armF_lo == null) A.armF_lo = -0.16;
    if (A.armB_up == null) A.armB_up = -0.02; if (A.armB_lo == null) A.armB_lo = -0.14;
    if (q.assis || q.leve != null) {
      let a = q.assis ? 1 : 0; if (q.leve != null) a = 1 - ease(clamp(q.leve));
      asseoir(q, a, LT_PE); if (q.siege !== false) { q._siege = q.siege || 'fauteuil'; q._sDy = LT_PE; q._sFy = -hipY - LT_PE; }
    }
    if ((ve > 0 || tr_ > 0) && !q.tenu) q.tenu = 'verre';
    marcher(q, 1.2, 0.26, 3, { F: !has(q.tenu) && !br, B: !br }, 0.35);
    if (eco > 0) { A.head = (A.head || 0) + 0.1 * eco; pivot(q, 0.05 * eco, hipY); if (f.regard == null) f.regard = 0.3; if (!f.brow) f.brow = 'up'; }
    if (ve > 0) tenirA(q, KT, q.cibleL || [58, -98], 0, 'bas', ve);
    if (tr_ > 0) { tenirA(q, KT, q.cibleL || [84, -196], 0, 'bas', tr_); A.head = (A.head || 0) - 0.1 * tr_; if (!f.mouth) f.mouth = 'smile'; }
    if (br > 0) {                                                                // mains jointes devant la ceinture
      if (!has(q.tenu)) { armTo(q, KT, 'armF', [40, -50], 'bas', br); q.handF = 'open'; }
      armTo(q, KT, 'armB', [34, -46], 'bas', br); q.handB = 'fist';
    }
    return finish(q, KT, CH.frkPercy);
  };
  FRK.percy = wrap('frkPercy', FRK.percyPose, 0.9);

  // ---- John Polidori : cheveux noirs lissés, longs favoris, sourcils épais, redingote prune à jupe longue, gilet noir, cravate blanche haute ; teint olivâtre
  const PO = { peau: '#cfae86', peauD: '#b08e68', cheveux: '#0f0d0e', redingote: '#3e2638', redingoteL: '#563648', redingoteD: '#2c1a28', gilet: '#18161a', cravate: '#f0ebe0', cravateD: '#cfc8b8',
    pant: '#1e1c22', pantD: '#16151a', botte: '#0e0d10' };
  const PO_TORSO = [[-14, -178], [8, -182], [18, -172], [30, -152], [36, -120], [38, -84], [36, -40], [34, 0], [40, 60], [44, 116, 1], [-42, 118, 1], [-42, 60], [-38, 0], [-38, -60], [-40, -118], [-36, -150], [-26, -170]];
  const PO_ASSIS = [[-14, -178], [8, -182], [18, -172], [30, -152], [36, -120], [38, -84], [36, -40], [36, -12], [60, -10], [98, -6], [104, 18, 1], [60, 22], [20, 26], [-40, 60], [-44, 92, 1], [-50, 86], [-44, 30], [-38, 0], [-38, -60], [-40, -118], [-36, -150], [-26, -170]];
  const PO_HEAD = [[-14, 16], [10, 16], [12, 2], [18, -6], [26, -10], [29, -17], [27, -22], [29, -26], [28, -30], [31, -35], [36, -41, 1], [32, -47], [29, -57], [29, -65], [26, -79], [14, -93], [-6, -98], [-24, -89], [-33, -69], [-32, -46], [-24, -28], [-17, -8]];
  const PO_HAIR = [[26, -83], [18, -94], [4, -101], [-10, -103], [-24, -96], [-34, -81], [-37, -62], [-36, -44], [-31, -29], [-26, -28], [-22, -40], [-15, -52], [-6, -59], [-1.5, -57], [-0.5, -46], [0.5, -34], [2, -24], [3.5, -16, 1], [4.5, -24], [4, -36], [3.5, -48], [5, -60], [8, -68], [16, -76], [23, -80]];
  function mkPolidori() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: (p) => (p._assis ? PO_ASSIS : PO_TORSO), base: PO.redingote, seed: 9401, paint: (p) => {
        fillPts([[8, -174], [28, -154], [34, -120], [36, -84], [34, -70], [22, -72], [14, -120]], PO.gilet);                         // gilet noir
        strokePts([[8, -174], [18, -128], [22, -72], [28, 0], p._assis ? [98, -6] : [36, 112]], 'rgba(15,5,12,0.75)', 1.5);
        fillPts([[-2, -178], [12, -172], [22, -140], [16, -124], [6, -148]], PO.redingoteL);
        for (const y of [-60, -36, -12]) { dot(24, y, 2, '#1a0f16'); dot(32, y + 2, 2, '#1a0f16'); }
        if (!p._assis) for (const [x0, x1] of [[-10, -20], [10, 14], [-28, -36]]) strokePts([[x0, 10], [x1, 112]], 'rgba(20,8,16,0.4)', 1.2);
        hatch([[-56, -170], [-12, -170], [-14, 120], [-56, 120]], 0.75, 4.2, 0.28, 1.05, '220,190,210');
        shade(42, 0, -44, 0, 0.28);
      } },
      armB_up: upDef([-10, -150], 96, PO.redingoteD, 9402, null, 14, 16),
      armB_lo: foreDef(true, 96, PO.redingoteD, PO.peauD, 9403, { cuff: PO.cravateD }),
      head: { parent: 'torso', at: [6, -174], pts: PO_HEAD, base: PO.peau, seed: 9404, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-8, -44, PO.peauD);
        hatch([[-22, -42], [2, -30], [14, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.24);
        fillPts([[14, -20], [28, -18], [26, -10], [16, -12]], 'rgba(60,50,40,0.18)');                                                // ombre de barbe
        oeil(f, 17, -53, 1, { iris: '#2a1e18' }); X.brow(f, 17, -61, 'rgba(12,10,10,0.98)', 3.6); bouche(f, 27, -26, 'rgba(110,50,50,0.9)');
      } },
      cheveux: chevPart(PO_HAIR, PO.cheveux, () => {
        for (let k = 0; k < 7; k++) { const u = k / 6; strokePts(qbez([lerp(22, -24, u), lerp(-82, -36, u)], [lerp(4, -30, u), lerp(-104, -72, u)], [lerp(-30, -38, u), lerp(-86, -40, u)]), 'rgba(120,120,140,0.5)', 0.8); }   // peignés vers l'arrière
        strokePts(qbez([18, -88], [0, -100], [-24, -92]), 'rgba(190,190,210,0.4)', 1.6);                                                     // reflet lissé
      }, 9406),
      col: { parent: 'torso', at: [0, 0], pts: [[-12, -178], [0, -186], [16, -186], [24, -176], [22, -158], [14, -150], [6, -160], [-4, -168]], base: PO.cravate, seed: 9407, noRivet: true, paint: () => {
        strokePts([[0, -180], [20, -178]], 'rgba(150,140,120,0.6)', 1); strokePts([[2, -172], [22, -168]], 'rgba(150,140,120,0.6)', 1);
        fillPts([[14, -166], [26, -164], [22, -152], [16, -156]], PO.cravateD);
      } },
      armF_up: upDef([-2, -150], 96, PO.redingote, 9408, () => hatch([[-22, -20], [-3, -20], [-3, 100], [-22, 100]], 0.9, 3.8, 0.24, 1, '220,190,210'), 14, 16),
      armF_lo: foreDef(false, 96, PO.redingote, PO.peau, 9409, { cuff: PO.cravate }),
    };
    Object.assign(parts, legDefs(LT_H, 114, { pant: PO.pant, pantD: PO.pantD, botte: PO.botte }, 9411, { botte: 80 }), heldParts(PO.peau, 9420), siegeParts(9430));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Polidori', order: ORDER([], ['cheveux'], ['col']) };
  }
  CH.frkPolidori = mkPolidori();
  // gestes : ecoute, ecrire(+cible), tenir (manuscrit, deux mains), regard (en coin, inquiétant), assis(+siege), marche
  FRK.polidoriPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, KT = KH, k = kOf(q), hipY = -238;
    const eco = k('ecoute'), ec = k('ecrire'), te = k('tenir'), rg = k('regard');
    humeur(q, HUM_H);
    if (A.armF_up == null) A.armF_up = 0.05; if (A.armF_lo == null) A.armF_lo = -0.18;
    if (A.armB_up == null) A.armB_up = -0.02; if (A.armB_lo == null) A.armB_lo = -0.14;
    const as = assisH(q, hipY); if (as > 0.5) q._assis = true;
    if (te > 0 && !q.tenu) q.tenu = 'manuscrit';
    if (ec > 0 && !q.tenu) q.tenu = 'plume';
    marcher(q, 1.2, 0.26, 3, { F: !has(q.tenu), B: !has(q.tenuB) && !ec && !te }, 0.35);
    if (eco > 0) { A.head = (A.head || 0) + 0.08 * eco; if (!has(q.tenu)) { armTo(q, KT, 'armF', [36, -48], 'bas', eco); q.handF = 'fist'; } armTo(q, KT, 'armB', [30, -44], 'bas', eco); if (!f.brow) f.brow = 'frown'; }
    if (ec > 0) {
      const T0 = q.cibleL || (as > 0.5 ? [100, -40] : [104, -58]), th = -0.5;
      const sx = 6 * Math.sin(t * 8.5) + 3 * Math.sin(t * 20), sy = 2.5 * Math.sin(t * 14);
      const bec = rotP(OBJ.plume.pts.bec, th), T = [T0[0] + sx - bec[0], T0[1] + sy - bec[1]];
      if (q.tenu === 'plume') tenirA(q, KT, T, th, 'bas', ec);
      if (!has(q.tenuB)) { armTo(q, KT, 'armB', [T0[0] - 48, T0[1] + 4], 'bas', ec); q.handB = 'open'; }
      A.head = (A.head || 0) + 0.3 * ec; if (!f.eyes) f.eyes = 'half';
    }
    if (te > 0) { tenirA(q, KT, q.cibleL || [92, -96], 0, 'bas', te); q.deuxMains = te; A.head = (A.head || 0) + 0.06 * te; }
    if (rg > 0) { A.head = (A.head || 0) + 0.08 * rg; if (f.regard == null) f.regard = -1; if (!f.brow) f.brow = 'frown'; if (!f.mouth) f.mouth = 'tight'; }
    return finish(q, KT, CH.frkPolidori);
  };
  FRK.polidori = wrap('frkPolidori', FRK.polidoriPose, 0.9);

  // ---- Victor Frankenstein : cheveux noirs en bataille, visage émacié, cernes, chemise blanche manches retroussées, gilet noir,
  //      long tablier de cuir brun ; pas de redingote
  const VI = { peau: '#e2c6a8', peauD: '#c4a484', cheveux: '#0e0d0f', chemise: '#ebe6d8', chemiseD: '#cdc6b4', gilet: '#1c1a1f', tablier: '#5a3b26', tablierD: '#43291a', tablierL: '#74503a',
    pant: '#2e2c2a', pantD: '#242220', botte: '#1e1714' };
  const VI_TORSO = [[-14, -176], [8, -180], [16, -170], [28, -150], [33, -118], [33, -80], [31, -40], [31, 0], [30, 18, 1], [-34, 20, 1], [-36, 0], [-36, -60], [-37, -118], [-34, -150], [-26, -168]];
  const VI_HEAD = [[-12, 16], [9, 16], [10, 2], [14, -6], [22, -10], [25, -15], [24, -21], [27, -25], [26, -29], [30, -34], [36, -42, 1], [31, -47], [28, -56], [28, -64], [25, -78], [13, -92], [-6, -97], [-24, -88], [-32, -68], [-31, -46], [-23, -28], [-16, -8]];
  const VI_HAIR = boucles(-5, -66, 39, 37, -0.14 * PI, -1.34 * PI, 7, 0.12).concat([[-24, -22], [-28, -12], [-20, -16], [-18, -32], [-14, -50], [-4, -60], [8, -66], [20, -74], [28, -80]]);
  const VI_MECHE = [[6, -92], [19, -90], [28, -81], [31, -70], [29, -59], [25, -57], [23, -66], [17, -75], [8, -81]];
  const VI_TAB = [[12, -150], [28, -152], [36, -120], [38, -80], [38, -30], [40, 2], [-4, 6], [-2, -30], [4, -100], [8, -130]];
  const VI_TABB = [[-24, -12], [22, -14], [28, 40], [32, 100], [36, 152, 1], [-18, 156, 1], [-22, 90], [-24, 30]];
  function mkVictor() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: VI_TORSO, base: VI.chemise, seed: 9501, paint: () => {
        fillPts([[-38, -158], [-12, -168], [6, -160], [14, -140], [20, -100], [28, -60], [32, -6], [31, 20], [-36, 22]], VI.gilet);
        strokePts([[6, -176], [12, -150], [18, -110]], 'rgba(120,110,95,0.6)', 1);
        hatch([[-56, -170], [-12, -170], [-14, 22], [-56, 22]], 0.75, 4.2, 0.24, 1.05, '200,200,215');
        shade(36, 0, -40, 0, 0.24);
      } },
      tablier: { parent: 'torso', at: [0, 0], pts: VI_TAB, base: VI.tablier, seed: 9502, noRivet: true, paint: () => {
        strokePts([[14, -144], [30, -146], [36, -116], [40, -30], [50, 148]], 'rgba(220,180,140,0.35)', 1, false);
        for (let y = -140; y < 0; y += 9) dot(lerp(32, 38, (y + 140) / 140), y, 0.9, 'rgba(230,200,160,0.5)');                       // surpiqûre
        fillPts(blob(18, -40, 9, 6, 22, 9), 'rgba(40,20,10,0.35)');                                                                      // tache
        fillPts([[-2, -60], [36, -62], [37, -54], [-2, -52]], VI.tablierD);
        hatch(null, 1.2, 3.8, 0.22, 1, '30,15,5'); shade(48, 0, -6, 0, 0.3, [-10, -160, 60, 160]);
      } },
      sangle: { parent: 'torso', at: [0, 0], pts: [[-14, -174], [-8, -176], [14, -152], [10, -148]], base: VI.tablierD, seed: 9503, noRivet: true },
      tablierBas: { parent: 'torso', at: [16, -4], pts: VI_TABB, base: VI.tablier, seed: 9512, noRivet: true, paint: () => {
        strokePts([[22, -10], [28, 40], [34, 148]], 'rgba(220,180,140,0.35)', 1);
        for (let y = -6; y < 150; y += 9) dot(lerp(24, 33, (y + 6) / 156), y, 0.9, 'rgba(230,200,160,0.5)');
        for (const [x, y, r] of [[10, 40, 11], [-4, 100, 8]]) fillPts(blob(x, y, r, r * 0.7, x + y, 9), 'rgba(40,20,10,0.35)');
        hatch(null, 1.2, 3.8, 0.22, 1, '30,15,5'); shade(36, 0, -24, 0, 0.3, [-30, -20, 40, 160]);
      } },
      armB_up: upDef([-10, -150], 96, VI.chemiseD, 9504, null, 13, 15),
      armB_lo: foreDef(true, 96, VI.peauD, VI.peauD, 9505, { peauY: 20, paint: () => fillPts(box(-13, -2, 13, 22), VI.chemiseD) }),
      head: { parent: 'torso', at: [6, -174], pts: VI_HEAD, base: VI.peau, seed: 9506, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-8, -44, VI.peauD);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.4, 0.26);
        fillPts([[6, -40], [20, -36], [22, -20], [8, -16]], 'rgba(90,70,60,0.2)');                                                   // joue creusée
        fillPts([[9, -47], [22, -47], [19, -42], [11, -42]], 'rgba(90,70,110,0.38)');                                               // cernes
        oeil(f, 17, -52, 1, { iris: '#2c2a30' }); X.brow(f, 17, -60, 'rgba(14,12,14,0.95)', 2.6); bouche(f, 25, -26, 'rgba(110,60,60,0.9)');
      } },
      cheveux: chevPart(VI_HAIR, VI.cheveux, () => {
        for (let i = 0; i < 6; i++) { const a = -0.22 * PI - i * 0.2 * PI; strokePts(qbez([-5 + Math.cos(a) * 12, -66 + Math.sin(a) * 12], [-5 + Math.cos(a + 0.35) * 32, -66 + Math.sin(a + 0.35) * 30], [-5 + Math.cos(a + 0.12) * 46, -66 + Math.sin(a + 0.12) * 44]), 'rgba(120,120,140,0.5)', 1.1); }
      }, 9507),
      meche: chevPart(VI_MECHE, VI.cheveux, () => strokePts(qbez([10, -88], [26, -84], [28, -62]), 'rgba(120,120,140,0.55)', 1.1), 9513),
      col: { parent: 'torso', at: [0, 0], pts: [[-12, -176], [-8, -184], [4, -180], [12, -180], [20, -182, 1], [18, -170], [10, -166]], base: VI.chemise, seed: 9508, noRivet: true },
      armF_up: upDef([-2, -150], 96, VI.chemise, 9509, () => hatch([[-22, -20], [-3, -20], [-3, 100], [-22, 100]], 0.9, 3.8, 0.24, 1, '200,200,215'), 13, 15),
      armF_lo: foreDef(false, 96, VI.peau, VI.peau, 9510, { peauY: 20, paint: () => { fillPts(box(-13, -2, 13, 22), VI.chemise); strokePts([[-12, 10], [12, 9]], 'rgba(150,140,120,0.6)', 1); } }),
    };
    Object.assign(parts, legDefs(LT_H, 114, { pant: VI.pant, pantD: VI.pantD, botte: VI.botte }, 9511, { botte: 60 }), heldParts(VI.peau, 9520), siegeParts(9530));
    return { hipY: -238, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'Victor', order: ORDER([], ['cheveux', 'meche'], ['col', 'sangle', 'tablierBas', 'tablier']) };
  }
  CH.frkVictor = mkVictor();
  // gestes : penche (+cible), tenir (lanterne, +haut 0..1), recul, fuite (course selon t), horreur, marche
  FRK.victorPose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, KT = KH, k = kOf(q), hipY = -238;
    const pe = k('penche'), te = k('tenir'), re = k('recul'), fu = k('fuite'), ho = k('horreur');
    humeur(q, HUM_H);
    if (A.armF_up == null) A.armF_up = 0.05; if (A.armF_lo == null) A.armF_lo = -0.18;
    if (A.armB_up == null) A.armB_up = -0.02; if (A.armB_lo == null) A.armB_lo = -0.14;
    if (te > 0 && !q.tenu) q.tenu = 'lanterne';
    marcher(q, 1.3, 0.28, 3, { F: !has(q.tenu) && !re && !ho, B: !re && !ho && !pe }, 0.35);
    if (pe > 0) {                                                                // penché sur la table, les deux mains au-dessus du corps
      pivot(q, 0.52 * pe, hipY); A.head = (A.head || 0) + 0.12 * pe;
      const T = q.cibleL || [84, -40];
      if (!has(q.tenu)) { armTo(q, KT, 'armF', T, 'bas', pe); q.handF = 'open'; }
      if (!has(q.tenuB)) { armTo(q, KT, 'armB', [T[0] - 34, T[1] + 6], 'bas', pe); q.handB = 'open'; }
      if (!f.brow) f.brow = 'frown';
    }
    if (te > 0) { const h = clamp(q.haut == null ? 0.6 : q.haut); tenirA(q, KT, q.cibleL || [lerp(60, 86, h), lerp(-96, -200, h)], 0, 'bas', te); }
    if (re > 0) {                                                                // recule : buste en arrière, mains levées devant lui
      pivot(q, -0.16 * re, hipY); q.dx = (q.dx || 0) - 8 * re; A.head = (A.head || 0) - 0.1 * re;
      A.legB = (A.legB || 0) + 0.28 * re; A.legF = (A.legF || 0) - 0.12 * re; A.legF_lo = (A.legF_lo || 0) + 0.1 * re;
      if (!has(q.tenu)) { armTo(q, KT, 'armF', [70, -168], 'bas', re); q.handF = 'open'; }
      armTo(q, KT, 'armB', [58, -146], 'bas', re); q.handB = 'open';
      if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'o';
    }
    if (fu > 0) {                                                                // fuite : buste en avant, grandes enjambées, bras qui battent coudes pliés
      const ph = t * PI * 2.6, s = Math.sin(ph);
      pivot(q, 0.2 * fu, hipY);
      A.legF = (A.legF || 0) - 0.55 * s * fu; A.legB = (A.legB || 0) + 0.55 * s * fu;
      A.legF_lo = (A.legF_lo || 0) + (s < 0 ? 0.32 * -s : 0.12 * s) * fu; A.legB_lo = (A.legB_lo || 0) + (s > 0 ? 0.32 * s : 0.12 * -s) * fu;
      q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 9 * fu;
      if (!has(q.tenu)) { blend(q, 'armF_up', -0.25 + 0.45 * s, fu); blend(q, 'armF_lo', -1.45, fu); q.handF = 'fist'; }
      blend(q, 'armB_up', -0.25 - 0.45 * s, fu); blend(q, 'armB_lo', -1.45, fu); q.handB = 'fist';
      A.head = (A.head || 0) - 0.04 * fu;
      if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'o';
    }
    if (ho > 0) {                                                                // horreur : mains aux joues, sans cacher les yeux
      pivot(q, -0.07 * ho, hipY); A.head = (A.head || 0) - 0.1 * ho;
      const T1 = headPt(q, KT, 14, -12), T2 = headPt(q, KT, 2, -16);
      if (!has(q.tenu)) { armTo(q, KT, 'armF', [T1[0] + 4, T1[1] + 8], 'bas', ho); if (ho > 0.4) q.handF = 'open'; }
      armTo(q, KT, 'armB', [T2[0] + 6, T2[1] + 10], 'bas', ho); if (ho > 0.4) q.handB = 'open';
      if (!f.eyes) f.eyes = 'wide'; if (!f.brow) f.brow = 'worry'; if (!f.mouth) f.mouth = 'o';
    }
    A.tablierBas = -(q.tilt || 0) + 0.05 * fu * Math.sin(t * PI * 2.6) + 0.03 * (q.marche ? Math.sin(t * PI * 1.3) : 0);
    return finish(q, KT, CH.frkVictor);
  };
  FRK.victor = wrap('frkVictor', FRK.victorPose, 0.9);

  // =====================================================================
  // 6) LA CRÉATURE (d'après le roman) — longs cheveux noirs raides, peau jaunâtre parcheminée, coutures fines (front, cou, poignets),
  //    yeux jaunes délavés dans des orbites sombres, lèvres sombres, grandes mains ; vieux manteau noir trop court, chemise grise déchirée.
  //    Jamais de tête plate, de boulons ni de peau verte.
  // =====================================================================
  const CR = { peau: '#c9b57a', peauD: '#a89a62', vert: '#8f8a5a', cheveux: '#141414', manteau: '#1e1e22', manteauL: '#2e2e34', manteauD: '#151518', chemise: '#6b6a64', chemiseD: '#55544e',
    pant: '#26262a', pantD: '#1d1d20', botte: '#3a3028', drap: '#d9d4c6', drapD: '#b8b2a2' };
  const KCR = { shF: [-2, -146], shB: [-12, -146], neck: [6, -168], LA: 104, LB: 112 };
  const LT_CR = 102, HIP_CR = -(2 + LT_CR + 117);
  const CR_TORSO = [[-18, -176], [10, -180], [22, -172], [38, -152], [46, -116], [46, -74], [42, -30], [40, 10], [38, 38, 1], [28, 30, 1], [18, 44, 1], [8, 34, 1], [-4, 46, 1], [-16, 36, 1], [-28, 46, 1], [-38, 36, 1], [-46, 42, 1], [-46, 0], [-46, -60], [-50, -118], [-46, -152], [-34, -170]];
  const CR_HEAD = [[-14, 18], [12, 18], [14, 6], [20, -2], [30, -8], [32, -16], [29, -21], [31, -25], [30, -29], [33, -34], [38, -40, 1], [33, -46], [31, -54], [36, -60], [32, -66], [28, -80], [16, -96], [-4, -102], [-24, -94], [-34, -72], [-34, -48], [-26, -26], [-18, -6]];
  const CR_HAIR = tignasse(-4, -66, 40, 40, -0.26 * PI, -1.02 * PI, 18, 0.03, [[0.0, 1.06, 0.04]], 5.5).concat([[-47, -40], [-51, 0], [-50, 40, 1], [-44, 26], [-41, 48, 1], [-35, 24], [-29, 44, 1], [-24, 12], [-17, 22, 1], [-16, -10], [-14, -36], [-8, -58], [0, -70], [6, -80], [10, -72, 1], [13, -82], [19, -76, 1], [21, -86], [28, -82, 1], [27, -92]]);
  const COUTURE = (pts, col) => { strokePts(pts, col || 'rgba(70,50,40,0.75)', 0.9); for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, n = Math.max(1, Math.floor(l / 5)); for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, x = x0 + dx * u, y = y0 + dy * u; strokePts([[x - dy / l * 2.6, y + dx / l * 2.6], [x + dy / l * 2.6, y - dx / l * 2.6]], col || 'rgba(70,50,40,0.75)', 0.8); } } };
  // drap : contour du corps couché dans le repère de la cuisse avant (+y vers les pieds, +x vers le haut quand il est couché)
  const DRAP_TOP = [[48, 248], [52, 228], [36, 206], [24, 160], [26, 110], [28, 60], [36, 10], [42, -20], [50, -60], [54, -112], [46, -148], [32, -166], [20, -174]];
  function topX(y) { for (let i = 0; i < DRAP_TOP.length - 1; i++) { const a = DRAP_TOP[i], b = DRAP_TOP[i + 1]; if (y <= a[1] && y >= b[1]) return lerp(a[0], b[0], (a[1] - y) / (a[1] - b[1])); } return 20; }
  function drapPts(p) {
    const dr = clamp(p._drap || 0); if (dr <= 0.01) return OFFP;
    let yTop = lerp(250, -174, dr); yTop = Math.max(yTop, lerp(-174, 6, p._ass || 0));
    const o = [], g = p._g || 0;
    for (let y = 252; y >= yTop; y -= 12) o.push([topX(y) + 1.5 * Math.sin(y * 0.09 + g * 1.3), y]);
    o.push([topX(yTop) - 6, yTop - 4], [-20, yTop - 10], [-70, yTop - 8], [-104, yTop - 2]);
    for (let y = yTop; y <= 262; y += 18) o.push([-104 + 6 * Math.sin(y * 0.11) + 2 * Math.sin(g * 0.9 + y * 0.05), y + 4]);
    o.push([-60, 268], [0, 266], [40, 258]);
    return o;
  }
  const drapPaint = (p) => {
    const g = p._g || 0;
    for (let i = 0; i < 7; i++) { const x = -90 + i * 18; strokePts([[x + 6 * Math.sin(i), -170], [x + 4 * Math.sin(i * 2 + g * 0.5), 40], [x, 262]], 'rgba(120,112,96,0.35)', 1.2); }
    strokePts([[-44, -180], [-44, 270]], 'rgba(90,84,70,0.4)', 1.6);                                     // arête de la table sous le drap
    hatch(null, 0.3, 4.4, 0.14, 1, '80,70,60'); shade(50, 0, -104, 0, 0.32, [-120, -200, 70, 280]);
  };
  function mkCreature() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CR_TORSO, base: CR.manteau, seed: 9601, paint: () => {
        fillPts([[8, -176], [24, -170], [36, -146], [42, -108], [38, -84], [34, -94], [28, -88], [22, -104], [16, -136], [10, -160]], CR.chemise);   // chemise grise déchirée
        strokePts([[12, -160], [26, -120]], 'rgba(30,30,28,0.5)', 1);
        fillPts([[-2, -178], [12, -172], [18, -146], [10, -136], [2, -156]], CR.manteauL);
        fillPts(box(-30, -60, -12, -34), '#26262c'); strokePts([[-30, -60], [-12, -60], [-12, -34]], 'rgba(160,150,140,0.35)', 0.8);   // pièce rapiécée
        for (const [x, y] of [[20, -40], [-36, 10], [6, 20]]) strokePts([[x, y], [x + 8, y + 3]], 'rgba(170,160,150,0.3)', 0.8);
        hatch([[-60, -170], [-12, -170], [-14, 50], [-60, 50]], 0.75, 4.2, 0.3, 1.05, '170,170,190');
        shade(46, 0, -48, 0, 0.3);
      } },
      armB_up: upDef([-12, -146], 104, CR.manteauD, 9602, null, 16, 18),
      armB_lo: foreDef(true, 104, CR.manteauD, CR.peauD, 9603, { k: 1.25, sh: 8, peauY: 56, paint: () => COUTURE([[-11, 64], [11, 63]]) }),
      head: { parent: 'torso', at: [6, -168], pts: CR_HEAD, base: CR.peau, seed: 9604, noRivet: true, paint: (p) => {
        const f = p.face || {};
        oreille(-8, -44, CR.peauD);
        hatch([[-24, -46], [4, -32], [14, -8], [-6, 20], [-34, 6]], 0.6, 3.4, 0.3, 1, '80,80,40');
        fillPts([[4, -40], [14, -42], [22, -38], [18, -30], [8, -28]], 'rgba(130,128,80,0.22)');                                // ombre verdâtre légère sous la pommette
        fillPts(ell(19, -50, 11, 7.5, 14), 'rgba(50,46,26,0.55)');                                                            // orbite sombre
        oeil(f, 20, -50, 1.05, { iris: '#d8c25a', blanc: '#e2d8ae', trait: 'rgba(30,26,14,0.95)' });
        strokePts([[10, -61], [24, -63], [33, -59]], 'rgba(14,14,12,0.95)', 3.2);                                                // sourcil lourd
        bouche(f, 27, -24, 'rgba(60,40,40,0.95)'); strokePts([[22, -21], [28, -22]], 'rgba(70,50,45,0.5)', 1.6);                 // lèvres sombres
        COUTURE([[4, -76], [16, -78], [28, -73]]);                                                                              // front
        COUTURE([[-12, 8], [0, 5], [12, 7]]);                                                                                   // cou
        strokePts([[30, -12], [24, -8]], 'rgba(80,70,40,0.4)', 1);
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: CR_HAIR, base: CR.cheveux, seed: 9605, noRivet: true, paint: () => {
        for (let i = 0; i < 9; i++) strokePts([[-6 - i * 4, -92 + i * 3], [-24 - i * 3, -40], [-30 - i * 2.4, 34 - (i % 3) * 6]], 'rgba(110,110,120,0.35)', 1);
      } },
      armF_up: upDef([-2, -146], 104, CR.manteau, 9606, () => hatch([[-24, -20], [-3, -20], [-3, 108], [-24, 108]], 0.9, 3.8, 0.26, 1, '170,170,190'), 16, 18),
      armF_lo: foreDef(false, 104, CR.manteau, CR.peau, 9607, { k: 1.25, sh: 8, peauY: 56, paint: () => { COUTURE([[-11, 64], [11, 63]]); fillPts(box(-13, 48, 13, 56), '#2a2a30'); } }),
      drapB: { parent: 'legF', at: [0, 0], noRivet: true, base: CR.drap, seed: 9608, pts: (p) => ((p._ass || 0) >= 0.5 ? drapPts(p) : OFFP), paint: drapPaint },
      drapA: { parent: 'legF', at: [0, 0], noRivet: true, base: CR.drap, seed: 9609, pts: (p) => ((p._ass || 0) < 0.5 ? drapPts(p) : OFFP), paint: drapPaint },
    };
    Object.assign(parts, legDefs(LT_CR, 108, { pant: CR.pant, pantD: CR.pantD, botte: CR.botte }, 9611, { botte: 70, wT: 21, pied: 1.15 }), heldParts(CR.peau, 9620, 1.2));
    return { hipY: HIP_CR, parts, handLen: 112, rod: { part: 'torso', at: [-28, 18] }, nom: 'creature',
      order: ['armB_up', 'armB_lo', 'objetB', 'legB', 'legB_lo', 'legF', 'legF_lo', 'head', 'torso', 'cheveux', 'drapB', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB', 'drapA'] };
  }
  CH.frkCreature = mkCreature();
  // gestes : yeux 0..1, couchee (sur la table : (x,y) = plateau sous la hanche), redresse + assise 0..1, drap 0..1, marche (lourde), seule
  FRK.creaturePose = function (p) {
    const q = prep(p), A = q.ang, f = q.face, t = q.t || 0, KT = KCR, k = kOf(q), hipY = HIP_CR;
    const se = k('seule');
    if (q.yeux != null && f.eyes == null) f.eyes = clamp(q.yeux);
    if (A.armF_up == null) A.armF_up = 0.04; if (A.armF_lo == null) A.armF_lo = -0.12;
    if (A.armB_up == null) A.armB_up = -0.02; if (A.armB_lo == null) A.armB_lo = -0.1;
    q._g = M.tg ? M.tg(t) : t;
    if (q.couchee || q.redresse || q.assise != null) {
      const ea = ease(clamp(q.assise || 0)), tau = -PI / 2 * (1 - ea), B = lerp(48, 20, ea);
      const Dv = rotP([0, -B], -tau);
      q.tilt = tau; q.dx = Dv[0]; q.dy = Dv[1] - hipY;
      A.legF = -PI / 2 * ea; A.legB = -PI / 2 * ea * 0.98; A.legF_lo = 0; A.legB_lo = 0;
      A.armF_up = lerp(0.03, -0.32, ea); A.armF_lo = lerp(-0.04, -0.62, ea); A.armB_up = lerp(0.02, -0.22, ea); A.armB_lo = lerp(-0.04, -0.5, ea);
      A.head = (A.head || 0) + 0.32 * Math.sin(PI * Math.min(1, ea * 1.15));
      q._drap = q.drap == null ? (q.couchee ? 1 : 0.5) : clamp(q.drap); q._ass = ea;
      if (ea > 0.3) { q.libre.legF = 1; q.libre.legB = 1; }
      q._rod = false;
      q.handF = q.handF || 'open'; q.handB = q.handB || 'open';
    } else {
      marcher(q, 0.75, 0.3, 4, { F: true, B: true }, 0.4);
      const m = q.marche === true ? 1 : clamp(q.marche || 0);
      if (m > 0) { pivot(q, 0.06 * m, hipY); q.tilt = (q.tilt || 0) + 0.03 * Math.sin(t * PI * 0.75) * m; A.head = (A.head || 0) + 0.12 * m; }
      if (se > 0) { pivot(q, 0.17 * se, hipY); A.head = (A.head || 0) + 0.42 * se; blend(q, 'armF_up', -0.12, se); blend(q, 'armB_up', -0.06, se); if (!f.mouth) f.mouth = 'triste'; if (!f.brow) f.brow = 'worry'; if (f.eyes == null) f.eyes = 'half'; }
      q.handF = q.handF || 'open'; q.handB = q.handB || 'open';
    }
    return finish(q, KT, CH.frkCreature);
  };
  FRK.creature = (pose, x, y, s, o) => {
    s = s == null ? 1.18 : s; o = o || {};
    const q = FRK.creaturePose(pose);
    const oo = Object.assign({ nom: 'creature' }, o); if (q._rod === false) { oo.rod = false; oo.floorShadow = false; }
    return run(CH.frkCreature, q, x, y, s, oo);
  };
  FRK.creature.pose = FRK.creaturePose;

  // =====================================================================
  // 7) OMBRES CHINOISES — silhouettes pleines OMBRE (#0d0d10), bords nets, pour l'écran d'ombres (dessiner dans FRK.ecranClip ou o.ombres de FRK.ecran)
  //    Repère : (x,y) = pieds (debout) ; s = échelle (1 ≈ 420 px de haut pour la créature) ; o.dir ±1 ; o.t pour les frémissements
  // =====================================================================
  function shp(pts, seed) { const c = cx_(); M.path(pts, seed || 0, 0.2); c.fillStyle = OMBRE; c.fill(); }
  function trait(pts, w) { const c = cx_(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = OMBRE; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
  function enRepere(x, y, s, dir, fn) { const c = cx_(); c.save(); c.translate(x, y); c.scale(s * (dir || 1), s); fn(c); c.restore(); }
  // une pièce qui pivote autour de son attache (et, en option, qui arrive en flottant)
  function morceau(c, piv, rot, off, fn) { c.save(); c.translate(piv[0] + off[0], piv[1] + off[1]); c.rotate(rot); c.translate(-piv[0], -piv[1]); fn(); c.restore(); }
  // main ombrée : paume + 4 doigts (traits ronds) qui pendent ; frem = frémissement (rad)
  function mainOmbre(c, x, y, ang, frem, t, k) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(k || 1, k || 1);
    shp([[-9, -4], [9, -4], [11, 12], [7, 20], [-8, 20], [-11, 8]], 3);
    for (let i = 0; i < 4; i++) { const a = -0.25 + i * 0.17 + frem * Math.sin(t * 27 + i * 1.9) * (0.6 + 0.4 * Math.sin(t * 7 + i)); const x0 = -6 + i * 4.4; trait([[x0, 16], [x0 - Math.sin(a) * 13, 16 + Math.cos(a) * 13], [x0 - Math.sin(a * 1.6) * 22, 16 + Math.cos(a * 1.6) * 22]], 4.2); }
    trait([[9, 4], [15, 12], [15, 20]], 4.2);
    c.restore();
  }
  const OC = {
    jambeB: [[-28, -200], [0, -200], [2, -130], [-2, -96], [0, -40], [-2, -14], [20, -10], [26, 0, 1], [-20, 0, 1], [-22, -40], [-24, -96], [-30, -140]],
    jambeF: [[-12, -200], [16, -200], [18, -130], [14, -96], [16, -40], [14, -14], [36, -10], [42, 0, 1], [-4, 0, 1], [-6, -40], [-8, -96], [-14, -140]],
    torse: [[-26, -336], [2, -342], [22, -336], [36, -316], [42, -280], [40, -240], [36, -200], [38, -176, 1], [24, -184, 1], [14, -172, 1], [2, -186, 1], [-10, -174, 1], [-22, -186, 1], [-34, -176, 1], [-38, -210], [-40, -260], [-44, -300], [-40, -326]],
    bras: [[-12, -334], [10, -334], [12, -280], [10, -236], [12, -204], [-8, -200], [-12, -236], [-16, -290]],
    tete: [[-4, -330], [14, -332], [16, -346], [24, -352], [28, -360], [26, -364], [29, -368], [27, -372], [30, -378], [34, -384, 1], [29, -388], [27, -396], [22, -408], [8, -418], [-10, -418], [-24, -408], [-30, -392], [-32, -370], [-38, -350], [-42, -326, 1], [-34, -334], [-30, -322, 1], [-24, -340], [-14, -342]],
  };
  // FRK.ombreCreature(x, y, s, {assemble 0..1, vie 0..1, couche 0..1, t, dir}) — couche 1 : couchée sur le dos, (x,y) = plateau sous la hanche
  FRK.ombreCreature = function (x, y, s, o) {
    o = o || {}; s = s == null ? 0.85 : s;
    const as = o.assemble == null ? 1 : clamp(o.assemble), vie = clamp(o.vie || 0), t = o.t || 0, cou = clamp(o.couche || 0), g = M.tg ? M.tg(t) : t;
    enRepere(x, y, s, o.dir, (c) => {
      const hip = [lerp(0, 0, cou), lerp(-192, -26, cou)];
      c.translate(hip[0], hip[1]); c.rotate(-PI / 2 * cou); c.translate(0, 192);
      const ordre = ['jambeB', 'jambeF', 'torse', 'brasB', 'brasF', 'tete'];
      const piv = { jambeB: [-12, -196], jambeF: [4, -196], torse: [0, -200], brasB: [-6, -326], brasF: [4, -326], tete: [8, -336] };
      ordre.forEach((n, i) => {
        const k0 = i * 0.13, kk = ease(clamp((as - k0) / 0.34)); if (kk <= 0) return;
        const fl = 1 - kk, off = [((hash(i * 3.1) - 0.5) * 340 + Math.sin(g * 1.3 + i) * 10) * fl, (-150 - 130 * hash(i * 7.7) + Math.sin(g * 1.7 + i * 2) * 8) * fl];
        let rot = (hash(i * 5.3) - 0.5) * 1.8 * fl;
        if (n === 'tete') rot += (1 - vie) * 0.42 - 0.05 * vie * Math.sin(g * 1.1);
        if (n === 'brasF') rot += -0.22 * vie + 0.03 * vie * Math.sin(g * 2.2);
        if (n === 'torse') rot += 0.006 * vie * Math.sin(g * 2.4);
        c.save(); c.globalAlpha = smooth(0, 0.35, kk);
        morceau(c, piv[n], rot, off, () => {
          if (n === 'brasB' || n === 'brasF') {
            c.save(); c.translate(n === 'brasB' ? -8 : 6, 0); shp(OC.bras, 11 + i); mainOmbre(c, 2, -206, 0, 0.32 * vie * kk, g, 1.25); c.restore();
          } else shp(OC[n], 11 + i);
        });
        c.restore();
      });
    });
  };
  // FRK.ombreSavant(x, y, s, {geste 0..1, penche 0..1, t, dir}) — le savant penché, une main tendue au-dessus du corps (geste 1)
  FRK.ombreSavant = function (x, y, s, o) {
    o = o || {}; s = s == null ? 0.85 : s;
    const ge = ease(clamp(o.geste == null ? 1 : o.geste)), pe = o.penche == null ? 1 : clamp(o.penche), g = M.tg ? M.tg(o.t || 0) : 0;
    enRepere(x, y, s, o.dir, (c) => {
      shp([[-22, -184], [2, -184], [4, -120], [0, -40], [2, -12], [20, -8], [26, 0, 1], [-20, 0, 1], [-20, -40], [-24, -120]], 21);
      shp([[-4, -184], [20, -184], [24, -120], [24, -40], [26, -12], [44, -8], [50, 0, 1], [6, 0, 1], [4, -40], [0, -120]], 22);
      shp([[-30, -196], [-6, -190], [-12, -120], [-22, -86, 1], [-30, -96], [-38, -100, 1], [-36, -140]], 23);                 // basques de l'habit
      morceau(c, [0, -184], 0.42 * pe, [0, 0], () => {
        shp([[-28, -330], [4, -336], [20, -326], [30, -296], [32, -250], [28, -200], [22, -176, 1], [-30, -176, 1], [-34, -230], [-36, -290], [-34, -318]], 24);
        // tête aux cheveux en bataille
        const crane = [[0, -330], [12, -332], [14, -344], [21, -350], [24, -357], [22, -361], [25, -365], [24, -369], [27, -374], [31, -380, 1], [26, -384], [24, -392], [20, -402]];
        const meche = meches(-4, -384, 30, 28, -0.25 * PI, -1.25 * PI, 15, 0.38, 191);
        shp(crane.concat(meche, [[-30, -360], [-26, -340], [-14, -334]]), 25);
        // bras arrière replié, bras avant tendu (geste)
        morceau(c, [-6, -318], -0.5, [0, 0], () => { shp([[-16, -326], [6, -326], [8, -260], [-12, -258]], 26); morceau(c, [-2, -262], -1.2, [0, 0], () => { shp([[-10, -266], [8, -266], [6, -196], [-8, -196]], 27); mainOmbre(c, -1, -198, 0, 0, g, 1); }); });
        morceau(c, [4, -318], lerp(0.05, -1.2, ge), [0, 0], () => {
          shp([[-8, -328], [14, -328], [14, -258], [-8, -256]], 28);
          morceau(c, [3, -260], lerp(-0.1, 0.25, ge), [0, 0], () => { shp([[-7, -264], [12, -264], [9, -196], [-6, -196]], 29); mainOmbre(c, 2, -198, 0, 0.12 * ge, g, 1.05); });
        });
      });
    });
  };
  // FRK.ombreVampire(x, y, s, {cape 0..1, t, dir}) — silhouette élégante en cape à haut col ; cape 1 = cape déployée en ailes de chauve-souris
  FRK.ombreVampire = function (x, y, s, o) {
    o = o || {}; s = s == null ? 0.85 : s;
    const cp = ease(clamp(o.cape || 0)), g = M.tg ? M.tg(o.t || 0) : 0, fl = 4 * cp * Math.sin(g * 3.1);
    enRepere(x, y, s, o.dir, (c) => {
      shp([[-12, -80], [2, -80], [2, -14], [-2, -6], [16, -4], [22, 0, 1], [-14, 0, 1]], 31);
      shp([[2, -80], [14, -80], [14, -14], [12, -6], [30, -4], [36, 0, 1], [0, 0, 1]], 32);
      for (const sd of [-1, 1]) {
        const S = [sd * 6, -298], T = [sd * lerp(40, 236, cp), lerp(-150, -350, cp) + fl], B = [sd * lerp(38, 20, cp), lerp(-16, -126, cp)];
        const W = [S, [sd * lerp(30, 120, cp), lerp(-260, -330, cp) + fl * 0.5], T];
        const dx = B[0] - T[0], dy = B[1] - T[1], L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L;
        if ((S[0] - T[0]) * nx + (S[1] - T[1]) * ny < 0) { nx = -nx; ny = -ny; }
        const dep = lerp(3, 36, cp);
        for (let j = 0; j < 4; j++) { const u0 = j / 4, u1 = (j + 1) / 4, P0 = [lerp(T[0], B[0], u0), lerp(T[1], B[1], u0)], P1 = [lerp(T[0], B[0], u1), lerp(T[1], B[1], u1)]; W.push([P0[0], P0[1], 1], [(P0[0] + P1[0]) / 2 + nx * dep, (P0[1] + P1[1]) / 2 + ny * dep]); }
        W.push([B[0], B[1], 1], [0, lerp(-16, -120, cp)]);
        shp(W, 33 + sd);
      }
      shp([[-20, -300], [16, -300], [22, -220], [20, -120], [24, -40], [-26, -40], [-22, -120], [-24, -220]], 35);
      shp([[-12, -306], [8, -306], [10, -316], [18, -322], [22, -330], [20, -334], [23, -338], [21, -342], [24, -348], [28, -354, 1], [23, -358], [20, -366], [16, -378], [6, -384], [-4, -386], [-14, -380], [-20, -366], [-22, -348], [-18, -330]], 36);
      shp([[-6, -350], [-14, -366, 1], [-8, -342]], 37);
      shp([[-16, -300], [-40, -378, 1], [-28, -346], [-22, -318], [-6, -306]], 38);                                             // haut col dans le dos
      shp([[8, -304], [26, -334, 1], [20, -302]], 39);
    });
  };
  // FRK.ombreTable(x, y, s, o) — table d'opération sur tréteaux ; (x,y) = sol, milieu ; plateau à 150·s au-dessus, long de 400·s
  FRK.OMBRE_TABLE = { haut: 150, demi: 200 };
  FRK.ombreTable = function (x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    enRepere(x, y, s, o.dir, () => {
      shp([[-204, -152, 1], [204, -152, 1], [204, -136, 1], [-204, -136, 1]], 41);
      for (const tx of [-150, 150]) { trait([[tx - 34, -138], [tx + 30, 0]], 9); trait([[tx + 30, -138], [tx - 34, 0]], 9); trait([[tx - 30, -70], [tx + 26, -70]], 6); }
      shp([[-200, -152], [-176, -164], [-150, -164], [-146, -152]], 42);                                                     // billot sous la tête
      trait([[-60, -136], [-62, -96], [-56, -84]], 3); trait([[80, -136], [82, -100], [76, -88]], 3);                        // sangles pendantes
    });
  };
  // FRK.eclair(x, y, s, t, o) — zigzag lumineux entre deux électrodes ; (x,y) = milieu ; o.ecart (130), o.force 0..1, o.electrodes (true), o.cuivre (électrodes en cuivre)
  FRK.eclair = function (x, y, s, t, o) {
    o = o || {}; s = s == null ? 1 : s;
    const c = cx_(), e = (o.ecart || 130) * s, fo = o.force == null ? 1 : clamp(o.force), cu = !!o.cuivre;
    const el = (sx) => {
      if (o.electrodes === false) return;
      c.save(); c.translate(x + sx * e, y);
      const col = cu ? '#a8643a' : OMBRE;
      c.fillStyle = col; c.fillRect(-4 * s, 10 * s, 8 * s, 170 * s);
      c.beginPath(); c.arc(0, 0, 14 * s, 0, TAU); c.fill();
      if (cu) { c.beginPath(); c.arc(-4 * s, -4 * s, 5 * s, 0, TAU); c.fillStyle = 'rgba(255,220,170,0.6)'; c.fill(); }
      c.fillRect(-14 * s, 176 * s, 28 * s, 8 * s);
      c.restore();
    };
    el(-1); el(1);
    if (fo <= 0.01) return;
    const R = M.rng(1 + Math.floor((M.tg ? M.tg(t) : t) * 14)), pts = [[x - e + 12 * s, y]];
    for (let i = 1; i < 9; i++) pts.push([x - e + 2 * e * i / 9 + (R() - 0.5) * 10 * s, y + (R() - 0.5) * 46 * s]);
    pts.push([x + e - 12 * s, y]);
    const br = [pts[3], [pts[3][0] + 18 * s, pts[3][1] + 30 * s * (R() > 0.5 ? 1 : -1)], [pts[3][0] + 30 * s, pts[3][1] + (R() - 0.2) * 60 * s]];
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [w, col] of [[22, `rgba(120,150,255,${0.18 * fo})`], [9, `rgba(170,200,255,${0.55 * fo})`], [3.2, `rgba(255,255,255,${0.95 * fo})`]]) {
      for (const L of [pts, br]) { c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = col; c.lineWidth = w * s * (L === br ? 0.6 : 1); c.stroke(); }
    }
    const gr = c.createRadialGradient(x, y, 2, x, y, e * 1.4); gr.addColorStop(0, `rgba(190,210,255,${0.3 * fo})`); gr.addColorStop(1, 'rgba(190,210,255,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, e * 1.4, 0, TAU); c.fill();
    c.restore();
  };

  // =====================================================================
  // 8) ACCESSOIRES ET MEUBLES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accFn(name, fn, x, y, s, o) {
    o = o || {};
    const r = M.puppet(accDef(name, fn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
    r.obj = name; r.oo = o; return r;
  }
  function acc(name, x, y, s, o, sDef) {
    const ob = OBJ[name];
    return accFn(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); }, x, y, s == null ? (sDef || 1) : s, o);
  }
  FRK.livre = (x, y, s, o) => acc('livre', x, y, s, o, 1);
  FRK.page = (x, y, s, o) => acc('page', x, y, s, o, 1);
  FRK.plume = (x, y, s, o) => acc('plume', x, y, s, o, 0.9);
  FRK.encrier = (x, y, s, o) => acc('encrier', x, y, s, o, 0.9);
  FRK.manuscrit = (x, y, s, o) => acc('manuscrit', x, y, s, o, 0.9);
  FRK.verre = (x, y, s, o) => acc('verre', x, y, s, o, 0.9);
  FRK.chandelier = (t, x, y, s, o) => acc('chandelier', x, y, s, Object.assign({ t }, o || {}), 0.8);
  FRK.lanterne = (t, x, y, s, o) => acc('lanterne', x, y, s, Object.assign({ t }, o || {}), 0.9);
  // point nommé d'un accessoire seul (r renvoyé par FRK.livre/page/…)
  FRK.accPt = (r, name, nom) => { const ob = OBJ[name], q0 = ob && ob.pts[nom]; if (!q0) return null; const q = typeof q0 === 'function' ? q0(r.oo || {}) : q0; return r.w('o', q[0] - ob.base[0], q[1] - ob.base[1]); };
  // sièges seuls : (x,y) = sol sous la hanche de la personne assise (même x que la marionnette assise) ; o.sombre 0..1
  const siegeSeul = (kind) => (x, y, s, o) => accFn('siege_' + kind, (oo) => { const c = cx_(); c.save(); c.translate(0, -126); drawSiege(kind, 126, false, oo.sombre); drawSiege(kind, 126, true, oo.sombre); c.restore(); }, x, y, s == null ? 0.9 : s, o);
  FRK.bergere = siegeSeul('bergere');
  FRK.fauteuil = siegeSeul('fauteuil');
  FRK.chaise = siegeSeul('chaise');
  // écritoire (table à écrire à pupitre incliné, encrier, plume, page) ; (x,y) = sol, milieu ; o.ecrit 0..1, o.plume (true), o.page (true), o.sombre
  const ECR_PENTE = Math.atan2(-18, 106);
  function drawEcritoire(o) {
    const C = siegeK('fauteuil', o.sombre), c = cx_();
    for (const [x, f] of [[-54, -1], [54, 1]]) pc([[x - 7, -164, 1], [x + 7, -164, 1], [x + 3 + 3 * f, 0, 1], [x - 3 + 3 * f, 0, 1]], C.boisD, null, 8201 + x);
    pc(box(-64, -168, 64, -142), C.bois, () => { strokePts([[-58, -156], [58, -156]], 'rgba(255,220,170,0.3)', 1); fillPts(ell(0, -155, 4, 4, 8), '#b8933f'); }, 8202);
    pc(box(-70, -194, 70, -166), C.bois, () => strokePts([[-68, -190], [68, -190]], 'rgba(255,220,170,0.4)', 1.2), 8203);
    pc([[-62, -194], [44, -194], [44, -214, 1], [-62, -198, 1]], C.boisD, () => strokePts([[-60, -198], [42, -213]], 'rgba(255,220,170,0.35)', 1), 8204);
    if (o.page !== false) { c.save(); c.translate(-12, -205); c.rotate(ECR_PENTE); c.scale(0.62, 0.3); c.translate(0, PGH / 2); drawPage({ ecrit: o.ecrit == null ? 0.6 : o.ecrit }); c.restore(); }
    c.save(); c.translate(56, -194); c.scale(0.62, 0.62); drawEncrier({ plume: o.plume !== false }); c.restore();
  }
  OBJ.ecritoire = { draw: drawEcritoire, grip: [0, -190], pts: { ecrire: [-12, -207], dessus: [0, -194], encrier: [56, -218] }, base: [0, 0] };
  FRK.ecritoire = (x, y, s, o) => acc('ecritoire', x, y, s, o, 0.9);
  // guéridon (table ronde à pied tripode) avec chandelier ; (x,y) = sol ; o.chandelier (false | options du chandelier), o.livre (true), o.t
  function drawGueridon(o) {
    const C = siegeK('bergere', o.sombre), c = cx_();
    for (const f of [-1, 1]) pc(ribbon(qbez([0, -40], [f * 30, -30], [f * 52, -2], 10), 9, 6), C.boisD, null, 8301 + f);
    pc([[-7, -40], [7, -40], [10, -60], [6, -90], [9, -130], [6, -160], [-6, -160], [-9, -130], [-6, -90], [-10, -60]], C.bois, () => strokePts([[-2, -150], [-2, -50]], 'rgba(255,230,170,0.4)', 1.2), 8302);
    pc([[-64, -170], [64, -170], [62, -160, 1], [-62, -160, 1]], C.bois, () => strokePts([[-60, -168], [60, -168]], 'rgba(255,230,170,0.5)', 1), 8303);
    fillPts(ell(0, -171, 64, 6, 18), C.tissuL);
    if (o.livre !== false) pc(box(-52, -184, -10, -172), CUIR, () => strokePts([[-50, -178], [-12, -178]], OR, 0.8), 8304);
    if (o.chandelier !== false) { c.save(); c.translate(18, -172); c.scale(0.8, 0.8); drawChandelier(Object.assign({ t: o.t }, o.chandelier || {})); c.restore(); }
  }
  OBJ.gueridon = { draw: drawGueridon, grip: [0, -170], pts: { dessus: [0, -172], flamme: [18, -172 - 0.8 * 228] }, base: [0, 0] };
  FRK.gueridon = (t, x, y, s, o) => acc('gueridon', x, y, s, Object.assign({ t }, o || {}), 0.9);

  // =====================================================================
  // 9) DÉCORS — le salon de la villa Diodati (1816) et l'écran d'ombres
  //    FRK.salon(t, o) (toile de fond + plan intermédiaire, AVANT M.drawFloor) ; FRK.salonSol(t, o) (APRÈS M.drawFloor, avant les marionnettes)
  // =====================================================================
  const BACK = M.ST.back, FEETF = M.ST.slotF - 34;
  const SAL = {
    fen: [{ x0: 232, x1: 404 }, { x0: 676, x1: 848 }], fenY0: 300, fenY1: 1388, imposte: 436,
    chem: { x0: 424, x1: 656, tablette: 1160, foyer: { x0: 474, x1: 606, y0: 1246 } },
    miroir: { x0: 452, x1: 628, y0: 742, y1: 1156 },
    pendule: { x: 540, y: 1062, s: 0.4 },
    flambeaux: [[446, 1160], [634, 1160]],
    biblio: { x0: 46, x1: 220, y0: 420 },
    corbeau: { x: 186, y: 354 },
    portraits: [{ x: 946, y: 640, rx: 50, ry: 64 }, { x: 540, y: 520, rx: 52, ry: 66 }],
    lune: [772, 470],
    sol: { ecritoire: { x: 214, dir: 1 }, fauteuil: { x: 380, dir: 1 }, bergere: { x: 724, dir: -1 }, gueridon: { x: 878 } },
  };
  FRK.SAL = SAL;
  let K = null;
  function vitres(F) {
    const out = [], { x0, x1 } = F, xm = (x0 + x1) / 2, mt = 6;
    const wi = (x1 - x0 - 24 - 3 * mt) / 4;
    for (let i = 0; i < 4; i++) out.push([x0 + 12 + i * (wi + mt), 312, x0 + 12 + i * (wi + mt) + wi, 424]);
    for (const [a, b] of [[x0 + 12, xm - 6], [xm + 6, x1 - 12]]) {
      const w = (b - a - mt) / 2, h = (1250 - 454 - 5 * mt) / 6;
      for (let cI = 0; cI < 2; cI++) for (let r = 0; r < 6; r++) out.push([a + cI * (w + mt), 454 + r * (h + mt), a + cI * (w + mt) + w, 454 + r * (h + mt) + h]);
    }
    return out;
  }
  const VITRES = SAL.fen.map(vitres);
  function clipVitres(c) { c.beginPath(); for (const L of VITRES) for (const r of L) c.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]); c.clip(); }
  function grad(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [k, col] of stops) g.addColorStop(k, col); return g; }
  function arche(x0, y0, x1, y1, h) { const cx = (x0 + x1) / 2; return [[x0, y1, 1], [x0, y0 + h]].concat(ep(cx, y0 + h, (x1 - x0) / 2, h, 14, PI, TAU), [[x1, y0 + h], [x1, y1, 1]]); }

  // ---------------- la vue par les portes-fenêtres : ciel, Alpes dans la brume, lac Léman ; nuit (lune) ou jour gris de pluie
  function makeVue(jour) {
    return M.pre(1080, 1400, (c) => {
      c.fillStyle = grad(c, 0, 290, 0, 900, jour ? [[0, '#7d868f'], [1, '#aab1b4']] : [[0, '#1b2433'], [1, '#2c3a52']]); c.fillRect(0, 290, 1080, 620);
      if (!jour) {
        for (let i = 0; i < 26; i++) dot(220 + 640 * hash(i * 3.7), 320 + 380 * hash(i * 9.1), 0.8 + hash(i) * 1, `rgba(230,232,220,${0.25 + 0.4 * hash(i * 2.2)})`);
        glow(SAL.lune[0], SAL.lune[1], 120, '220,225,200', 0.35);
        fillPts(ell(SAL.lune[0], SAL.lune[1], 27, 27, 22), '#efe6c8');
        for (const [x, y, r] of [[-8, -6, 6], [7, 5, 5], [-3, 10, 3.5]]) dot(SAL.lune[0] + x, SAL.lune[1] + y, r, 'rgba(190,180,150,0.5)');
      } else glow(760, 520, 260, '235,238,240', 0.25);
      // Alpes : deux rangs de crêtes dans la brume
      const crete = (y0, amp, seed, col) => { const pts = [[200, 960]]; for (let x = 200; x <= 880; x += 22) pts.push([x, y0 - amp * (0.4 + 0.6 * Math.abs(Math.sin(x * 0.011 + seed))) - amp * 0.35 * hash(x + seed), hash(x * 0.3 + seed) > 0.6 ? 1 : 0]); pts.push([880, 960]); fillPts(pts.map((p) => (p[2] ? p : [p[0], p[1]])), col); };
      crete(820, 150, 1.3, jour ? '#8a929a' : '#222d40');
      if (!jour) for (let x = 230; x < 870; x += 70) fillPts([[x, 700 + 30 * hash(x)], [x + 18, 690 + 30 * hash(x)], [x + 30, 720], [x + 6, 726]], 'rgba(200,210,225,0.18)');   // neiges
      c.fillStyle = grad(c, 0, 720, 0, 860, [[0, jour ? 'rgba(200,205,210,0)' : 'rgba(60,72,96,0)'], [1, jour ? 'rgba(200,205,210,0.7)' : 'rgba(60,72,96,0.6)']]); c.fillRect(200, 720, 700, 150);
      crete(870, 90, 4.1, jour ? '#6e777f' : '#151c2a');
      // rive d'en face et le lac
      fillPts([[200, 900], [880, 900], [880, 870], [700, 864], [520, 874], [360, 862], [200, 872]], jour ? '#59625f' : '#10151f');
      if (!jour) for (let i = 0; i < 9; i++) dot(250 + 600 * hash(i * 5.1), 880 + 8 * hash(i * 2.3), 1.6, 'rgba(255,190,110,0.8)');                 // lumières de Genève
      c.fillStyle = grad(c, 0, 900, 0, 1400, jour ? [[0, '#7b8486'], [1, '#4a5354']] : [[0, '#121a28'], [1, '#06080e']]); c.fillRect(200, 900, 700, 500);
      if (!jour) for (let i = 0; i < 26; i++) { const y = 910 + i * 18, w = 30 - i * 0.6 + 10 * hash(i); fillPts(ell(SAL.lune[0] + 6 * Math.sin(i * 1.7), y, w, 1.6, 10), `rgba(230,225,190,${0.32 - i * 0.01})`); }   // reflet de lune
      for (let i = 0; i < 30; i++) strokePts([[200 + 680 * hash(i * 7.3), 930 + 440 * hash(i * 3.3)], [240 + 680 * hash(i * 7.3), 930 + 440 * hash(i * 3.3)]], jour ? 'rgba(220,226,230,0.25)' : 'rgba(120,140,180,0.18)', 1);
    });
  }
  // ---------------- le mur : lambris vert-de-gris, boiseries dorées éteintes, fenêtres (vitres transparentes), rideaux, bibliothèque, cheminée, miroir, portraits, corbeau
  const GILT = 'rgba(170,146,84,0.55)', GILTL = 'rgba(214,190,120,0.5)';
  function moulure(x0, y0, x1, y1, a) { strokePts([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], `rgba(170,146,84,${a || 0.5})`, 1.6, true); strokePts([[x0 + 5, y0 + 5], [x1 - 5, y0 + 5], [x1 - 5, y1 - 5], [x0 + 5, y1 - 5]], 'rgba(20,30,28,0.45)', 1.2, true); }
  function fenetre(c, F, i) {
    const { x0, x1 } = F, y0 = SAL.fenY0, y1 = SAL.fenY1, xm = (x0 + x1) / 2, BOIS = '#9fa290', BOISD = '#767968';
    pc(box(x0 - 18, y0 - 20, x1 + 18, y1 + 6), BOISD, () => { strokePts([[x0 - 12, y1], [x0 - 12, y0 - 14], [x1 + 12, y0 - 14], [x1 + 12, y1]], 'rgba(230,230,210,0.35)', 1.2); hatch(null, 0.8, 5, 0.12); }, 8400 + i * 10);
    pc(box(x0, y0, x1, y1), BOIS, () => {
      for (const r of [[x0 + 14, 1262, xm - 8, 1378], [xm + 8, 1262, x1 - 14, 1378]]) moulure(r[0], r[1], r[2], r[3], 0.35);
      shade(x0, 0, x1, 0, 0.18, [x0, y0, x1, y1]);
    }, 8401 + i * 10);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; for (const r of VITRES[i]) c.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]); c.restore();
    strokePts([[xm, 470], [xm, 1240]], '#a8843e', 2.4); fillPts(ell(xm + 6, 860, 4, 9, 10), '#b8933f');                            // crémone
    // rideaux de velours bordeaux sombre retenus par une embrasse dorée, lambrequin festonné
    const VEL = '#3c171d', VELD = '#2a1015', VELL = '#552328';
    for (const sd of [-1, 1]) {
      const xe = sd < 0 ? x0 : x1, k = sd;
      const pts = [[xe - 46 * k, 236], [xe + 34 * k, 236], [xe + 30 * k, 520], [xe + 16 * k, 820], [xe + 6 * k, 900], [xe + 20 * k, 1000], [xe + 30 * k, BACK + 4, 1], [xe - 46 * k, BACK + 4, 1]];
      pc(pts, VEL, () => {
        for (let j = 0; j < 5; j++) { const xx = xe - 40 * k + j * 15 * k; strokePts([[xx, 240], [lerp(xx, xe, 0.7), 900], [xx + 6 * k, BACK]], j % 2 ? 'rgba(160,80,90,0.35)' : 'rgba(10,0,4,0.45)', 3); }
        hatch(null, 1.4, 4, 0.18);
      }, 8402 + i * 10 + sd);
      fillPts(ell(xe + 8 * k, 900, 16, 7, 12), '#b8933f'); strokePts([[xe + 8 * k, 906], [xe + 12 * k, 950]], '#b8933f', 2.2); fillPts([[xe + 6 * k, 946], [xe + 18 * k, 946], [xe + 14 * k, 974], [xe + 10 * k, 974]], '#a8843e');   // embrasse et gland
    }
    const val = [[x0 - 56, 226], [x1 + 56, 226], [x1 + 56, 300]];
    for (let j = 0; j <= 6; j++) { const xa = lerp(x1 + 56, x0 - 56, j / 6), xb = lerp(x1 + 56, x0 - 56, (j + 1) / 6); if (j < 6) val.push(...ep((xa + xb) / 2, 300, (xa - xb) / 2, 22, 6, 0, PI).map((p) => [p[0], p[1]])); }
    val.push([x0 - 56, 300]);
    pc(val, VELL, () => { strokePts([[x0 - 50, 238], [x1 + 50, 238]], '#b8933f', 2); hatch(null, 1.2, 4, 0.16); }, 8409 + i * 10);
    for (let j = 0; j < 6; j++) { const xx = lerp(x0 - 56, x1 + 56, (j + 0.5) / 6); fillPts([[xx - 4, 320], [xx + 4, 320], [xx + 2, 334], [xx - 2, 334]], '#a8843e'); }
  }
  function biblio(c) {
    const B = SAL.biblio, BO = '#2e1e14', BOL = '#4a3220';
    pc(box(B.x0, B.y0, B.x1, BACK + 4), BO, () => hatch(null, 0.9, 5, 0.15), 8501);
    fillPts(box(B.x0 + 12, B.y0 + 24, B.x1 - 12, 1180), '#170f0a');
    const COLS = ['#4a2a22', '#2c3a2e', '#3a3020', '#5a4a30', '#2a2a3a', '#5b2a22', '#1f2a2a', '#4a3a20', '#3a1e1e', '#2e3440'];
    const shelves = [560, 690, 820, 950, 1070, 1172];
    let prev = B.y0 + 26;
    shelves.forEach((sy, si) => {
      let x = B.x0 + 14, n = 0;
      while (x < B.x1 - 18) {
        const h0 = hash(si * 31 + n * 7.3), w = 8 + Math.floor(h0 * 11), h = Math.min(sy - prev - 8, 64 + hash(si * 13 + n * 3.1) * 56), col = COLS[Math.floor(hash(si * 5 + n * 1.9) * COLS.length)];
        if (si === 2 && n === 5) { pc([[x, sy], [x + 60, sy], [x + 60, sy - 12], [x, sy - 12]], '#4a2a22', null, 8510 + n); pc([[x + 4, sy - 12], [x + 56, sy - 12], [x + 56, sy - 22], [x + 4, sy - 22]], '#2c3a2e', null, 8511 + n); x += 64; n++; continue; }
        if (si === 4 && n === 3) {                                                                                            // sablier
          pc([[x + 2, sy - 64, 1], [x + 34, sy - 64, 1], [x + 34, sy - 58, 1], [x + 24, sy - 40], [x + 24, sy - 28], [x + 34, sy - 8, 1], [x + 34, sy, 1], [x + 2, sy, 1], [x + 2, sy - 8, 1], [x + 12, sy - 28], [x + 12, sy - 40], [x + 2, sy - 58, 1]], 'rgba(200,210,215,0.35)', () => fillPts([[x + 8, sy - 8], [x + 28, sy - 8], [x + 18, sy - 22]], '#c9a870'), 8520);
          x += 40; n++; continue;
        }
        const lean = hash(si * 9 + n) > 0.9 ? 0.18 : 0;
        const pts = lean ? [[x, sy], [x + w, sy], [x + w + h * lean, sy - h], [x + h * lean, sy - h]] : box(x, sy - h, x + w, sy);
        pc(pts, col, () => { for (const yy of [sy - h + 8, sy - h + 13, sy - 10]) strokePts([[x, yy], [x + w + (lean ? h * lean * (sy - yy) / h : 0), yy]], 'rgba(184,147,63,0.55)', 0.8); }, 8530 + si * 40 + n, { drop: false, texA: 0.5 });
        x += w + 1 + (lean ? h * lean : 0); n++;
      }
      pc(box(B.x0 + 8, sy, B.x1 - 8, sy + 10), BOL, () => strokePts([[B.x0 + 10, sy + 2], [B.x1 - 10, sy + 2]], 'rgba(255,220,170,0.25)', 1), 8590 + si);
      prev = sy + 10;
    });
    pc(box(B.x0 - 8, B.y0 - 14, B.x1 + 8, B.y0 + 14), BOL, () => { strokePts([[B.x0 - 4, B.y0 - 6], [B.x1 + 4, B.y0 - 6]], 'rgba(255,220,170,0.3)', 1.2); for (let x = B.x0; x < B.x1; x += 12) fillPts(box(x, B.y0 + 4, x + 6, B.y0 + 10), '#2e1e14'); }, 8598);
    for (const [a, b] of [[B.x0 + 14, (B.x0 + B.x1) / 2 - 2], [(B.x0 + B.x1) / 2 + 2, B.x1 - 14]]) { pc(box(a, 1186, b, BACK - 6), BO, () => moulure(a + 8, 1196, b - 8, BACK - 16, 0.3), 8599 + a); }
  }
  function cheminee(c) {
    const C = SAL.chem, F = C.foyer, MARB = '#cdc6b6', MARBL = '#ddd7c8', MI = SAL.miroir;
    const veines = () => { for (let i = 0; i < 6; i++) strokePts(qbez([C.x0 + 230 * hash(i * 3.3), 1170 + 60 * hash(i)], [C.x0 + 230 * hash(i * 5.1), 1220 + 80 * hash(i * 2)], [C.x0 + 230 * hash(i * 7.7), BACK]), 'rgba(120,110,100,0.25)', 1); hatch(null, 0.9, 6, 0.08); };
    // miroir au cadre doré, glace sombre
    pc(arche(MI.x0, MI.y0, MI.x1, MI.y1, 60), '#9a7a3a', () => { strokePts(arche(MI.x0 + 6, MI.y0 + 6, MI.x1 - 6, MI.y1 - 2, 56).slice(1, -1), GILTL, 1.5); hatch(null, 0.6, 3, 0.15, 1, '60,40,10'); }, 8601);
    const glace = arche(MI.x0 + 14, MI.y0 + 16, MI.x1 - 14, MI.y1 - 4, 50);
    c.save(); poly(c, glace); c.clip();
    c.fillStyle = grad(c, MI.x0, MI.y0, MI.x1, MI.y1, [[0, '#24302e'], [0.5, '#141c1b'], [1, '#1d2725']]); c.fillRect(MI.x0, MI.y0, MI.x1 - MI.x0, MI.y1 - MI.y0);
    fillPts(box(MI.x0 + 30, MI.y0 + 120, MI.x0 + 62, MI.y1 - 60), 'rgba(80,100,110,0.16)'); fillPts(box(MI.x1 - 70, MI.y0 + 130, MI.x1 - 40, MI.y1 - 70), 'rgba(80,100,110,0.12)');   // reflets des fenêtres d'en face
    for (let i = 0; i < 4; i++) strokePts([[MI.x0 + 10 + i * 46, MI.y1], [MI.x0 + 110 + i * 46, MI.y0]], 'rgba(200,220,220,0.06)', 9);
    c.restore();
    // jambages, frise à médaillon, tablette
    pc(box(C.x0, 1240, F.x0, BACK + 4), MARB, veines, 8602);
    pc(box(F.x1, 1240, C.x1, BACK + 4), MARB, veines, 8603);
    pc(box(C.x0, 1176, C.x1, 1246), MARB, () => { veines(); fillPts(ell(540, 1210, 26, 18, 18), MARBL); strokePts(ep(540, 1210, 26, 18, 18, 0, TAU), 'rgba(120,110,100,0.5)', 1.2, true); for (const sd of [-1, 1]) strokePts([[540 + sd * 32, 1210], [540 + sd * 60, 1200], [540 + sd * 86, 1214], [540 + sd * 104, 1204]], 'rgba(120,110,100,0.45)', 1.4); }, 8604);
    for (const x of [C.x0 + 10, C.x1 - 30]) strokePts([[x + 10, 1250], [x + 10, BACK]], 'rgba(120,110,100,0.35)', 2);
    pc(box(C.x0 - 14, C.tablette, C.x1 + 14, C.tablette + 18), MARBL, () => strokePts([[C.x0 - 10, C.tablette + 4], [C.x1 + 10, C.tablette + 4]], 'rgba(255,255,255,0.4)', 1.2), 8605);
    // foyer : fond noir, plaque de cheminée, bûches
    c.save(); c.fillStyle = grad(c, 0, F.y0, 0, BACK, [[0, '#0a0706'], [1, '#1a110c']]); c.fillRect(F.x0, F.y0, F.x1 - F.x0, BACK + 4 - F.y0); c.restore();
    fillPts(arche(F.x0 + 20, F.y0 + 22, F.x1 - 20, BACK - 30, 20), '#1d1612'); strokePts(ep(540, 1320, 20, 16, 12, 0, TAU), 'rgba(90,70,50,0.4)', 1.2, true);
    pc(ribbon([[490, 1384], [596, 1370]], 13), '#3a2618', () => strokePts([[492, 1380], [592, 1367]], 'rgba(255,150,70,0.4)', 1.4), 8606);
    pc(ribbon([[500, 1366], [584, 1388]], 12), '#2e1e12', () => strokePts([[504, 1364], [580, 1384]], 'rgba(255,150,70,0.35)', 1.4), 8607);
  }
  function portrait(c, P, i) {
    const { x, y, rx, ry } = P;
    strokePts([[x, y - ry - 14], [x, y - ry - 60]], 'rgba(150,130,80,0.7)', 1.6); fillPts(ell(x, y - ry - 62, 4, 4, 8), '#a8843e');
    pc(ell(x, y, rx + 13, ry + 13, 26), '#9a7a3a', () => { strokePts(ep(x, y, rx + 8, ry + 8, 26, 0, TAU), GILTL, 1.4, true); hatch(null, 0.5, 3, 0.18, 1, '60,40,10'); }, 8700 + i);
    c.save(); poly(c, ell(x, y, rx, ry, 26)); c.clip();
    c.fillStyle = grad(c, x - rx, y - ry, x + rx, y + ry, [[0, '#3a2c1e'], [1, '#17110c']]); c.fillRect(x - rx, y - ry, 2 * rx, 2 * ry);
    c.filter = 'blur(3px)';
    fillPts([[x - rx * 0.9, y + ry], [x - rx * 0.62, y + ry * 0.36], [x - rx * 0.2, y + ry * 0.16], [x + rx * 0.2, y + ry * 0.16], [x + rx * 0.62, y + ry * 0.36], [x + rx * 0.9, y + ry]], i ? '#1d1a24' : '#4a3e48');
    if (!i) fillPts([[x - rx * 0.4, y + ry * 0.35], [x + rx * 0.4, y + ry * 0.35], [x + rx * 0.2, y + ry * 0.6], [x - rx * 0.2, y + ry * 0.6]], 'rgba(220,210,190,0.5)');
    fillPts(ell(x, y - ry * 0.18, rx * 0.4, ry * 0.42, 14), i ? '#140f0c' : '#2a1a12');
    fillPts(ell(x + 2, y - ry * 0.08, rx * 0.26, ry * 0.32, 14), 'rgba(196,176,150,0.75)');
    c.filter = 'none';
    c.restore();
  }
  // corbeau empaillé sur la bibliothèque : corps (pré-rendu) ; tête dessinée à part (elle tourne)
  function corbeauCorps() {
    const c = cx_(); c.save(); c.translate(0, SAL.corbeau.y - 252);
    pc(box(146, 296, 192, 306), '#3a281a', null, 8801); pc(box(166, 280, 172, 298), '#3a281a', null, 8802);
    pc([[128, 262], [150, 250], [176, 246], [192, 254], [194, 266], [180, 280], [152, 286], [118, 300, 1], [110, 294, 1], [128, 276]], '#141419', () => {
      strokePts([[150, 258], [178, 254], [186, 266]], 'rgba(120,140,190,0.35)', 1.6); for (let i = 0; i < 4; i++) strokePts([[136 + i * 9, 272], [126 + i * 9, 288]], 'rgba(90,100,140,0.35)', 1);
    }, 8803);
    strokePts([[164, 284], [166, 296]], '#2a2420', 1.8); strokePts([[174, 282], [172, 296]], '#2a2420', 1.8);
    c.restore();
  }
  const CORBEAU_TETE = [[-6, 6], [-8, -8], [-1, -17], [10, -19], [17, -14], [33, -9, 1], [19, -5], [15, 2], [4, 8]];
  function corbeauTete(k) {
    const c = cx_(), C = SAL.corbeau, sx = Math.cos(PI * clamp(k)), s2 = (sx < 0 ? -1 : 1) * Math.max(0.32, Math.abs(sx));
    c.save(); c.translate(C.x, C.y); c.rotate(0.12 * Math.sin(PI * clamp(k))); c.scale(s2, 1);
    pc(CORBEAU_TETE, '#141419', () => { strokePts([[17, -12], [32, -9]], 'rgba(120,120,130,0.6)', 1); strokePts([[0, -14], [12, -16]], 'rgba(120,140,190,0.4)', 1.4); }, 8810);
    dot(9, -11, 2.4, '#d8b860'); dot(9.5, -11.5, 1, '#111');
    c.restore();
  }
  function makeMur() {
    return M.pre(1080, 1400, (c) => {
      c.fillStyle = grad(c, 0, 140, 0, BACK, [[0, '#33423e'], [0.5, '#3d4e49'], [1, '#34433f']]); c.fillRect(0, 140, 1080, BACK + 10 - 140);
      for (let x = 0; x < 1080; x += 36) { c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(x, 236, 18, 942); }
      for (let y = 262; y < 1170; y += 44) for (let x = 9 + ((y / 44) % 2) * 18; x < 1080; x += 36) fillPts([[x, y - 6], [x + 4, y], [x, y + 6], [x - 4, y]], 'rgba(170,196,176,0.09)');
      fillPts(box(0, 140, 1080, 236), '#26322f');
      for (const [y, a] of [[172, 0.5], [198, 0.6], [226, 0.7], [234, 0.4]]) strokePts([[0, y], [1080, y]], `rgba(170,146,84,${a})`, 1.6);
      for (let x = 4; x < 1080; x += 14) fillPts(box(x, 204, x + 7, 216), '#1c2522');
      fillPts(box(0, 1174, 1080, BACK + 10), '#2a3733');
      strokePts([[0, 1176], [1080, 1176]], GILT, 2.2); strokePts([[0, 1184], [1080, 1184]], 'rgba(20,30,28,0.6)', 1.4);
      for (let x = 10; x < 1080; x += 120) moulure(x, 1200, x + 104, BACK - 10, 0.4);
      moulure(870, 262, 1030, 1148, 0.5); moulure(232, 262, 404, 290, 0.3); moulure(676, 262, 848, 290, 0.3);
      moulure(456, 262, 624, 700, 0.5); moulure(412, 262, 444, 1148, 0.35); moulure(636, 262, 668, 1148, 0.35);
      shade(0, 0, 1080, 0, 0.0001, [0, 140, 1080, BACK]);
      SAL.fen.forEach((F, i) => fenetre(c, F, i));
      biblio(c);
      cheminee(c);
      SAL.portraits.forEach((P, i) => portrait(c, P, i));
      corbeauCorps();
      // ombre au pied du mur
      c.fillStyle = grad(c, 0, BACK - 60, 0, BACK + 6, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.35)']]); c.fillRect(0, BACK - 60, 1080, 66);
    });
  }
  // ---------------- clavecin dans l'ombre, à gauche (plan intermédiaire, posé sur ST.back)
  function makeClavecin() {
    return M.pre(1080, 1400, (c) => {
      const LAQ = '#1f2a26', OR_ = '#8a6a2a';
      for (const x of [86, 206, 318]) pc([[x - 6, 1232, 1], [x + 6, 1232, 1], [x + 9, 1262], [x + 4, 1290], [x + 7, 1330], [x + 3, BACK + 2, 1], [x - 3, BACK + 2, 1], [x - 7, 1330], [x - 4, 1290], [x - 9, 1262]], '#2a2016', null, 8901 + x);
      pc([[100, 1172], [330, 1166], [312, 1004], [126, 1052]], '#2a3430', () => {
        c.fillStyle = grad(c, 0, 1010, 0, 1166, [[0, '#4a4a3a'], [1, '#2a3028']]); c.fillRect(110, 1000, 230, 170);
        fillPts([[120, 1150], [180, 1110], [240, 1124], [320, 1090], [326, 1166], [110, 1168]], '#26302a'); fillPts([[150, 1150], [220, 1132], [300, 1146], [318, 1166], [140, 1168]], '#1e2622');
        fillPts(ell(270, 1060, 12, 12, 12), 'rgba(220,200,150,0.35)');
        strokePts([[104, 1168], [128, 1056], [310, 1010], [326, 1164]], OR_, 2.2);
      }, 8905);
      strokePts([[230, 1172], [222, 1044]], '#2a2016', 3);
      pc([[66, 1186], [332, 1170], [340, 1176], [340, 1236, 1], [74, 1236, 1], [62, 1222]], LAQ, () => { strokePts([[70, 1196], [336, 1182]], OR_, 1.6); strokePts([[72, 1226], [338, 1226]], OR_, 1.4); hatch(null, 0.9, 4, 0.2); }, 8906);
      pc(box(304, 1176, 342, 1196), '#e2d8bc', () => { for (let x = 306; x < 342; x += 4) strokePts([[x, 1176], [x, 1196]], 'rgba(60,50,40,0.45)', 0.7); for (let x = 308; x < 340; x += 7) fillPts(box(x, 1176, x + 2.5, 1186), '#1a1612'); }, 8907);
      pc([[290, 1166], [318, 1162], [312, 1118], [286, 1124]], '#3a2c1e', () => fillPts([[292, 1160], [314, 1157], [309, 1124], [290, 1128]], '#cfc6ae'), 8908);
      c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(0, 0, 1080, 1400); c.globalCompositeOperation = 'source-over';
    });
  }
  function makeTapis() {
    return M.pre(1080, 1600, (c) => {
      const T = [[196, 1402], [884, 1402], [930, 1492], [150, 1492]];
      pc(T, '#4e1f1f', () => {
        fillPts([[214, 1408], [866, 1408], [904, 1484], [176, 1484]], '#8a6a3a'); fillPts([[230, 1414], [850, 1414], [882, 1478], [198, 1478]], '#3e1a1c');
        fillPts(ell(540, 1446, 170, 22, 26), '#6e3a2a'); fillPts(ell(540, 1446, 120, 15, 22), '#2e3a38'); fillPts(ell(540, 1446, 50, 7, 16), '#8a6a3a');
        for (let i = 0; i < 16; i++) { const x = lerp(250, 830, i / 15); dot(x, 1418 + (i % 2) * 52, 3, 'rgba(184,147,63,0.5)'); }
        hatch(null, 0.2, 4, 0.12);
      }, 8950, { drop: false });
      for (let x = 152; x < 930; x += 7) strokePts([[x, 1492], [x - 1, 1501]], 'rgba(214,200,170,0.6)', 1);
    });
  }
  function makeVoile(col, avecClav) {
    return M.pre(1080, 1400, (c) => {
      c.fillStyle = col; c.fillRect(0, 140, 1080, BACK + 10 - 140);
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; for (const L of VITRES) for (const r of L) c.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]); c.globalCompositeOperation = 'source-over';
      if (avecClav) { const tmp = M.mkCanvas(1080, 1400), tc = tmp.getContext('2d'); tc.drawImage(K.clav, 0, 0); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = col; tc.fillRect(0, 0, 1080, 1400); c.drawImage(tmp, 0, 0); }
    });
  }
  FRK.init = function () {
    if (K) return FRK;
    K = FRK.K = {};
    K.vueN = makeVue(false); K.vueJ = makeVue(true); K.mur = makeMur(); K.clav = makeClavecin(); K.tapis = makeTapis();
    K.nuit = makeVoile('rgba(6,10,26,0.62)', true); K.jour = makeVoile('rgba(178,190,200,0.12)', true);
    return FRK;
  };

  // ---------------- animations de la vue : nuages devant la lune, pluie oblique, ronds sur le lac, éclair
  function nuagesVue(c, g, jo, pl) {
    for (let i = 0; i < 6; i++) {
      const v = 6 + 5 * hash(i * 2.2), x = ((100 + 260 * i + g * v) % 1100) - 40, y = 360 + 230 * hash(i * 4.4), r = 70 + 50 * hash(i * 6.1);
      const col = jo > 0.5 ? `rgba(150,156,162,${0.7 + 0.2 * pl})` : `rgba(32,40,58,${0.78 + 0.15 * pl})`;
      fillPts(blob(x, y, r * 1.6, r * 0.42, 300 + i, 14), col);
      fillPts(blob(x + 30, y - 16, r * 0.9, r * 0.36, 320 + i, 12), col);
      if (jo <= 0.5) strokePts(ep(x + 30, y - 18, r * 0.9, r * 0.34, 12, PI * 1.1, PI * 1.9), 'rgba(200,205,190,0.18)', 2);   // bord éclairé par la lune
    }
  }
  function pluieVue(c, g, pl) {
    if (pl <= 0 || SIL()) return;
    c.save(); c.strokeStyle = `rgba(190,205,228,${0.38 * pl})`; c.lineWidth = 1.3; c.beginPath();
    for (let i = 0; i < 110; i++) { const x = ((hash(i * 3.1) * 1300 + g * 160) % 1300) - 110, y = ((hash(i * 7.3) * 1100 + g * (620 + 160 * hash(i))) % 1100) + 290; c.moveTo(x, y); c.lineTo(x - 9, y + 30); }
    c.stroke(); c.restore();
    for (let i = 0; i < 18; i++) { const u = (g * 0.9 + hash(i * 2.9)) % 1, x = 220 + 640 * hash(i * 5.7 + Math.floor(g * 0.9 + hash(i * 2.9))), y = 930 + 440 * hash(i * 8.1 + Math.floor(g * 0.9 + hash(i * 2.9))); strokePts(ep(x, y, 4 + 18 * u, 1.2 + 3 * u, 12, 0, TAU), `rgba(170,190,215,${0.5 * (1 - u) * pl})`, 1, true); }
  }
  function boltPts(x, y0, y1, seed) { const R = M.rng(seed), pts = [[x, y0]]; let xx = x; for (let y = y0 + 40; y < y1; y += 30 + 30 * R()) { xx += (R() - 0.5) * 70; pts.push([xx, y]); } return pts; }
  function eclairVue(c, ec, o) {
    if (ec <= 0.02 || SIL()) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = `rgba(190,205,255,${0.75 * ec})`; c.fillRect(0, 290, 1080, 1110);
    const pts = boltPts(o.eclairX || 760, 300, 840, o.eclairSeed || 7), br = boltPts(pts[4][0], pts[4][1], pts[4][1] + 200, (o.eclairSeed || 7) + 3);
    for (const [w, col] of [[16, `rgba(140,170,255,${0.4 * ec})`], [6, `rgba(210,225,255,${0.8 * ec})`], [2.4, `rgba(255,255,255,${ec})`]]) for (const L of [pts, br]) { c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = col; c.lineWidth = L === br ? w * 0.6 : w; c.lineJoin = 'round'; c.stroke(); }
    c.restore();
  }
  function gouttesVitres(g, pl) {
    if (pl <= 0) return;
    for (let i = 0; i < 46; i++) {
      const F = SAL.fen[hash(i * 1.3) > 0.5 ? 1 : 0], x = F.x0 + 14 + (F.x1 - F.x0 - 28) * hash(i * 4.7), v = 18 + 30 * hash(i * 2.1), y = 456 + ((hash(i * 6.3) * 790 + g * v) % 790);
      strokePts([[x, y - 14 - 10 * hash(i)], [x + 0.6, y]], `rgba(200,215,235,${0.28 * pl})`, 1.1); dot(x + 0.6, y, 1.9, `rgba(225,235,248,${0.6 * pl})`);
    }
  }
  // FRK.salon(t, o) — toile de fond + plan intermédiaire (AVANT M.drawFloor)
  //   o : nuit 0..1 · jour 0..1 (sans les deux : soir) · pluie 0..1 (1) · eclair 0..1 (flash, + eclairX, eclairSeed) · feu 0..1 (1) · flambeaux 0..1 (1)
  //       corbeau 0..1 (la tête tourne) · portraitYeux -1..1 · voilages (true) · up (décalage vertical)
  FRK.salon = function (t, o) {
    o = o || {}; FRK.init();
    const c = cx_(), g = M.tg(t), nu = clamp(o.nuit || 0), jo = clamp(o.jour || 0), pl = o.pluie == null ? 1 : clamp(o.pluie), ec = clamp(o.eclair || 0);
    const feu = o.feu == null ? 1 : clamp(o.feu), fl = o.flambeaux == null ? 1 : clamp(o.flambeaux);
    c.save(); c.translate(0, -(o.up || 0));
    // 1) la vue sur le lac, par les vitres
    c.save(); clipVitres(c);
    c.drawImage(K.vueN, 0, 0); if (jo > 0) { c.globalAlpha = jo; c.drawImage(K.vueJ, 0, 0); c.globalAlpha = 1; }
    nuagesVue(c, g, jo, pl); pluieVue(c, g, pl); eclairVue(c, ec, o);
    c.restore();
    // 2) le mur, puis ce qui vit dessus
    c.drawImage(K.mur, 0, 0);
    M.pendule(t, { x: SAL.pendule.x, y: SAL.pendule.y, s: SAL.pendule.s, per: 2, bois: '#3a2416' });
    corbeauTete(o.corbeau || 0);
    { const P = SAL.portraits[0], dx = 2.2 * clamp(o.portraitYeux || 0, -1, 1); c.save(); c.filter = 'blur(1px)'; for (const ex of [-7, 7]) dot(P.x + 2 + ex + dx, P.y - P.ry * 0.14, 2.2, 'rgba(30,18,12,0.7)'); c.filter = 'none'; c.restore(); }
    for (const [x, y] of SAL.flambeaux) { pc([[x - 12, y, 1], [x - 8, y - 6], [x - 3, y - 12], [x - 3, y - 34], [x - 7, y - 38], [x + 7, y - 38], [x + 3, y - 34], [x + 3, y - 12], [x + 8, y - 6], [x + 12, y, 1]], '#a8843e', null, 8960 + x); pc(box(x - 4, y - 70, x + 4, y - 38), '#efe6cf', null, 8961 + x); }
    c.drawImage(K.clav, 0, 0);
    // 3) la pénombre (nuit) ou la lumière grise (jour) : tout sauf les vitres
    if (nu > 0) { c.globalAlpha = nu; c.drawImage(K.nuit, 0, 0); c.globalAlpha = 1; }
    if (jo > 0) { c.globalAlpha = jo; c.drawImage(K.jour, 0, 0); c.globalAlpha = 1; }
    // 4) les sources de lumière : âtre, flambeaux, reflets
    const F = SAL.chem.foyer, fk = 0.8 + 0.2 * Math.sin(g * 9.3) * Math.sin(g * 3.1 + 1);
    if (feu > 0) {
      for (let i = 0; i < 12; i++) dot(F.x0 + 18 + i * 9 + 3 * Math.sin(i * 2.3), 1384 - 4 * hash(i), 3.2, `rgba(${230 + 25 * Math.sin(g * 3 + i)},${90 + 50 * Math.sin(g * 2.1 + i * 1.7)},40,${0.9 * feu})`);
      c.save(); c.globalAlpha = feu;
      M.flamme(t, { x: 512, y: 1376, s: 1.15, r: 10, seed: 71, lueur: false }); M.flamme(t, { x: 568, y: 1378, s: 1.05, r: 10, seed: 73, lueur: false }); M.flamme(t, { x: 540, y: 1372, s: 1.55, r: 10, seed: 72, lueur: false });
      c.restore();
      for (let i = 0; i < 6; i++) { const u = (g * 0.7 + hash(i * 3.3)) % 1; dot(520 + 40 * hash(i * 5.5) + 10 * Math.sin(g * 2 + i), 1360 - 120 * u, 1.6 * (1 - u), `rgba(255,190,90,${0.9 * (1 - u) * feu})`); }   // escarbilles
      glow(540, 1340, 420, '255,140,60', (0.14 + 0.08 * nu) * feu * fk);
      glow(540, 1360, 140, '255,170,80', 0.3 * feu * fk);
      c.save(); poly(c, arche(SAL.miroir.x0 + 14, SAL.miroir.y0 + 16, SAL.miroir.x1 - 14, SAL.miroir.y1 - 4, 50)); c.clip(); glow(540, SAL.miroir.y1 + 10, 160, '255,150,70', 0.16 * feu * fk); c.restore();
    }
    for (const [x, y] of [[490, 1388], [590, 1388]]) { pc([[x - 10, y + 2, 1], [x - 4, y - 18], [x - 4, y - 30], [x + 4, y - 30], [x + 4, y - 18], [x + 10, y + 2, 1]], '#7a5c26', () => strokePts([[x - 1, y - 28], [x - 2, y - 4]], 'rgba(255,220,150,0.6)', 1), 8970 + x); fillPts(ell(x, y - 34, 6, 6, 10), '#a8843e'); }
    if (fl > 0) for (const [x, y] of SAL.flambeaux) { c.save(); c.globalAlpha = fl; M.flamme(t, { x, y: y - 71, s: 0.5, r: 120 + 60 * nu, seed: 80 + x }); c.restore(); }
    if (nu > 0) for (const Fn of SAL.fen) glow((Fn.x0 + Fn.x1) / 2, 700, 260, '120,140,190', 0.06 * nu);
    // 5) voilages devant les vitres
    if (o.voilages !== false) {
      const vc = `rgba(${Math.round(lerp(236, 150, nu))},${Math.round(lerp(230, 160, nu))},${Math.round(lerp(216, 180, nu))},${lerp(0.42, 0.3, nu)})`;
      SAL.fen.forEach((Fn, i) => { M.voilage(t + i * 1.7, { x: Fn.x0 + 4, y: 306, w: 58, h: 1072, cote: 1, amp: 9, col: vc }); M.voilage(t + i * 1.7 + 0.9, { x: Fn.x1 - 62, y: 306, w: 58, h: 1072, cote: -1, amp: 9, col: vc }); });
    }
    c.save(); clipVitres(c); gouttesVitres(g, pl); c.restore();
    // 6) éclair : la pièce s'illumine
    if (ec > 0.02 && !SIL()) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(150,170,230,${0.2 * ec})`; c.fillRect(0, 140, 1080, BACK + 10 - 140); c.restore(); }
    c.restore();
  };
  // FRK.salonSol(t, o) — plancher habité (APRÈS M.drawFloor, avant les marionnettes) : tapis, flaques de lune / d'éclair, meubles
  //   o : mêmes nuit/jour/eclair/feu que FRK.salon ; tapis (true) ; ecritoire / fauteuil / bergere / gueridon : true (défaut) | false | { x, dir, s, … }
  //       chandelier : options du chandelier du guéridon (hauteur, eteint, souffle) ; lumieres (true : taches de lumière au sol)
  FRK.salonSol = function (t, o) {
    o = o || {}; FRK.init();
    const c = cx_(), g = M.tg(t), nu = clamp(o.nuit || 0), ec = clamp(o.eclair || 0), feu = o.feu == null ? 1 : clamp(o.feu), som = 0.42 * nu;
    if (!SIL() && nu > 0) { c.fillStyle = `rgba(6,10,26,${0.5 * nu})`; c.fillRect(0, BACK - 2, 1080, M.ST.front + 4 - BACK); }
    if (o.tapis !== false) { c.drawImage(K.tapis, 0, 0); if (nu > 0) { c.save(); poly(c, [[196, 1402], [884, 1402], [930, 1502], [150, 1502]]); c.fillStyle = `rgba(6,10,26,${0.45 * nu})`; c.fill(); c.restore(); } }
    if (o.lumieres !== false && !SIL()) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const Fn of SAL.fen) { poly(c, [[Fn.x0 + 10, BACK + 2], [Fn.x1 - 10, BACK + 2], [Fn.x1 + 40, M.ST.front - 20], [Fn.x0 - 30, M.ST.front - 20]]); c.fillStyle = `rgba(${ec > 0.02 ? '200,215,255' : '120,140,190'},${0.07 * nu + 0.45 * ec})`; c.fill(); }
      c.restore();
      if (feu > 0) glow(540, BACK + 20, 300, '255,140,60', 0.12 * feu * (0.7 + 0.3 * nu));
    }
    const meuble = (n, fn) => { if (o[n] === false) return; const d = Object.assign({}, SAL.sol[n], typeof o[n] === 'object' ? o[n] : {}); fn(d); };
    const cast = { dx: 16, dy: 6, a: 0.3 };
    meuble('ecritoire', (d) => FRK.ecritoire(d.x, d.y || FEETF, d.s || 0.9, { dir: d.dir || 1, sombre: som, ecrit: d.ecrit, cast }));
    meuble('fauteuil', (d) => FRK.fauteuil(d.x, d.y || FEETF, d.s || 0.9, { dir: d.dir || 1, sombre: som, cast }));
    meuble('bergere', (d) => FRK.bergere(d.x, d.y || FEETF, d.s || 0.92, { dir: d.dir || -1, sombre: som, cast }));
    meuble('gueridon', (d) => FRK.gueridon(t, d.x, d.y || FEETF, d.s || 0.9, { dir: d.dir || 1, sombre: som, chandelier: o.chandelier || {}, cast }));
  };

  // ---------------- l'écran d'ombres : drap ivoire rétroéclairé ambré dans un cadre de bois, suspendu à deux fils
  //   FRK.ecran(t, x, y, s, {lumiere 0..1, balance (1), ombres: () => {…}}) — (x,y) = milieu du bord inférieur du cadre ; drap 560 × 420 à s 1 (cadre 604 × 464)
  //   les ombres se dessinent en coordonnées ÉCRAN dans o.ombres (déjà découpées au drap) ou par FRK.ecranClip(x, y, s, fn, {t})
  const EW = 560, EH = 420, EB = 22;
  function ecranM(t, x, y, s, o) { const g = M.tg(t || 0), top = y - (EH + 2 * EB) * s, rot = (o.balance == null ? 1 : o.balance) * 0.008 * Math.sin(g * 0.9 + 0.6); return new DOMMatrix().translate(x, top).rotate(rot * D).translate(-x, -top); }
  FRK.ECRAN = { w: EW, h: EH, bord: EB };
  FRK.ecranRect = (x, y, s) => { s = s == null ? 1 : s; return { x0: x - EW * s / 2, y0: y - (EH + EB) * s, w: EW * s, h: EH * s, cx: x, cy: y - (EH / 2 + EB) * s }; };
  FRK.ecranClip = function (x, y, s, fn, o) {
    o = o || {}; s = s == null ? 1 : s; const c = cx_(), R = FRK.ecranRect(x, y, s);
    c.save(); c.setTransform(c.getTransform().multiply(ecranM(o.t, x, y, s, o))); c.beginPath(); c.rect(R.x0, R.y0, R.w, R.h); c.clip(); fn(R); c.restore();
  };
  FRK.ecran = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const c = cx_(), L = o.lumiere == null ? 1 : clamp(o.lumiere), g = M.tg(t), m = ecranM(t, x, y, s, o), R = FRK.ecranRect(x, y, s);
    const W = (EW + 2 * EB) * s, H = (EH + 2 * EB) * s, x0 = x - W / 2, y0 = y - H;
    if (!SIL()) {                                                                    // deux fils jusqu'aux cintres
      const a = mp(m, [x0 + 60 * s, y0]), b = mp(m, [x0 + W - 60 * s, y0]);
      c.save(); c.strokeStyle = 'rgba(30,26,22,0.85)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] - 4, 0); c.moveTo(b[0], b[1]); c.lineTo(b[0] + 4, 0); c.stroke(); c.restore();
    }
    c.save(); c.setTransform(c.getTransform().multiply(m));
    if (L > 0) glow(x, R.cy, W * 0.8, '242,170,80', 0.16 * L);
    // le drap rétroéclairé
    c.save(); c.beginPath(); c.rect(R.x0, R.y0, R.w, R.h); c.clip();
    const fk = 1 + 0.03 * Math.sin(g * 7.3) * Math.sin(g * 2.9);
    const gr = c.createRadialGradient(x, R.cy, 10, x, R.cy, R.w * 0.62);
    gr.addColorStop(0, M.mixc('#6f6958', '#f8dc9c', L * fk > 1 ? 1 : L * fk)); gr.addColorStop(0.55, M.mixc('#655f50', '#eab466', L)); gr.addColorStop(1, M.mixc('#4e493e', '#a86a30', L));
    c.fillStyle = gr; c.fillRect(R.x0, R.y0, R.w, R.h);
    for (let i = 1; i < 9; i++) { const xx = R.x0 + R.w * i / 9 + 6 * Math.sin(g * 0.8 + i); c.fillStyle = `rgba(120,70,20,${0.05 + 0.03 * (i % 2)})`; c.fillRect(xx - 5 * s, R.y0, 10 * s, R.h); }
    if (o.ombres) o.ombres(R);
    c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(x, R.cy, 4, x, R.cy, R.w * 0.4); hg.addColorStop(0, `rgba(255,220,150,${0.1 * L})`); hg.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = hg; c.fillRect(R.x0, R.y0, R.w, R.h);
    c.globalCompositeOperation = 'source-over';
    const vg = c.createRadialGradient(x, R.cy, R.w * 0.3, x, R.cy, R.w * 0.66); vg.addColorStop(0, 'rgba(40,20,5,0)'); vg.addColorStop(1, 'rgba(40,20,5,0.35)'); c.fillStyle = vg; c.fillRect(R.x0, R.y0, R.w, R.h);
    c.restore();
    // le cadre de bois, les liens du drap
    const BO = '#4a3020', BOL = '#6a4a30', e = EB * s;
    pc(box(x0, y0, x0 + W, y0 + e), BO, () => strokePts([[x0 + 4, y0 + 5], [x0 + W - 4, y0 + 5]], 'rgba(255,220,170,0.35)', 1.2), 8981);
    pc(box(x0, y0 + H - e, x0 + W, y0 + H), BO, () => strokePts([[x0 + 4, y0 + H - e + 5], [x0 + W - 4, y0 + H - e + 5]], 'rgba(255,220,170,0.3)', 1.2), 8982);
    pc(box(x0, y0, x0 + e, y0 + H), BOL, () => hatch(null, 1.4, 4, 0.2), 8983);
    pc(box(x0 + W - e, y0, x0 + W, y0 + H), BOL, () => hatch(null, 1.4, 4, 0.2), 8984);
    for (const [cx, cy] of [[x0 + e / 2, y0 + e / 2], [x0 + W - e / 2, y0 + e / 2], [x0 + e / 2, y0 + H - e / 2], [x0 + W - e / 2, y0 + H - e / 2]]) M.rivet(cx, cy, 4);
    for (let i = 1; i < 10; i++) { const xx = x0 + W * i / 10; strokePts([[xx, y0 + e - 3], [xx + 3, y0 + e + 6]], '#d9cfb4', 1.6); strokePts([[xx, y0 + H - e + 3], [xx + 3, y0 + H - e - 6]], '#d9cfb4', 1.6); }
    for (const xx of [x0 + 60 * s, x0 + W - 60 * s]) strokePts(ep(xx, y0 - 5, 6, 6, 10, 0, TAU), '#7a5c26', 2.2, true);
    c.restore();
    return R;
  };
})();
