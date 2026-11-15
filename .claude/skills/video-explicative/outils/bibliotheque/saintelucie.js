// persos.js — « La Sainte-Luce, le dicton qui a perdu dix jours » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO.
// Espace M.luc (alias LUC). Appeler LUC.init() dans S.init. Mode d'emploi : persos.md (ne pas lire ce fichier en entier).
// Aucun texte, lettre, chiffre ni croix : pictogrammes seulement. Déterministe (hash / M.rng) : tout est fonction pure de t.
// Index : 1) outils  2) pictogrammes  3) objets (almanach, bougeoir, liasse, feuillet) + éphéméride  4) marionnettes Lucette, pape,
//         Anselme (+ lit)  5) la puce  6) la roue des mois + Soleil d'hiver  7) décors rueAujourdhui / villageHiver  8) init.
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, easeOut, easeIn, smooth, hash } = M;
  const CH = M.chars;
  const LUC = (M.luc = {});
  const cx_ = () => M.ctx(), SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // =====================================================================
  // 1) OUTILS
  // =====================================================================
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  const tr = (pts, dx, dy) => pts.map((p) => (p[2] ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]));
  const scl = (pts, sx, sy) => { sy = sy == null ? sx : sy; return pts.map((p) => (p[2] ? [p[0] * sx, p[1] * sy, 1] : [p[0] * sx, p[1] * sy])); };
  const rot = (pts, a, ox, oy) => { ox = ox || 0; oy = oy || 0; const cs = Math.cos(a), sn = Math.sin(a); return pts.map((p) => { const x = p[0] - ox, y = p[1] - oy; const q = [ox + x * cs - y * sn, oy + x * sn + y * cs]; if (p[2]) q.push(1); return q; }); };
  const mp = (m, p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const sh = (pts) => pts.map((p) => [p[0], p[1], 1]);
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
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
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  // dessin brut gardé (rien pendant la passe silhouette)
  function raw(fn) { if (SIL()) return; const c = cx_(); c.save(); fn(c); c.restore(); }
  function glow(x, y, r, col, a) { raw((c) => { const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); }); }
  // petite flamme maison (penche selon vent, taille k) — repère local, pied en (x,y)
  function flammette(x, y, k, vent, t, seed) {
    if (k <= 0.02) return;
    const g = t || 0, f = 1 + 0.1 * Math.sin(g * 13 + seed) + 0.06 * Math.sin(g * 29 + seed * 2);
    if (!SIL()) glow(x, y - 14 * k, 70 * k, '255,190,100', 0.3);
    raw((c) => {
      c.translate(x, y); c.rotate((vent || 0) * 1.1 + 0.08 * Math.sin(g * 7 + seed)); c.scale(k, k * f);
      const goutte = (h, w) => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(w, -h * 0.25, w * 0.5, -h * 0.75, 0, -h); c.bezierCurveTo(-w * 0.5, -h * 0.75, -w, -h * 0.25, 0, 0); };
      goutte(30, 9); c.fillStyle = '#e0782a'; c.fill(); goutte(20, 6); c.fillStyle = '#f6c34e'; c.fill(); goutte(10, 3); c.fillStyle = '#fff3c4'; c.fill();
    });
  }
  // filet de fumée après extinction (k 0..1 : intensité ; t pour le mouvement) — repère local, départ en (x,y)
  function filetFumee(x, y, k, t) {
    if (k <= 0.02) return;
    raw((c) => {
      c.strokeStyle = `rgba(200,195,185,${0.65 * k})`; c.lineWidth = 2.2 * M._lw(); c.beginPath();
      for (let i = 0; i <= 16; i++) { const v = i / 16, yy = y - v * 90, xx = x + Math.sin(v * 7 - (t || 0) * 4) * 8 * v; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.stroke();
    });
  }
  LUC.geo = { ep, ell, ribbon, qbez, rrect, box, tr, scl, rot };

  // =====================================================================
  // 2) PICTOGRAMMES (dans une boîte ≈ 100 × 100 centrée sur l'origine ; couleurs franches, AUCUN chiffre ni lettre)
  // =====================================================================
  const PIC = {
    bougie: () => {
      if (!SIL()) { raw((c) => { const g = c.createRadialGradient(0, -34, 2, 0, -34, 40); g.addColorStop(0, 'rgba(255,214,110,0.75)'); g.addColorStop(1, 'rgba(255,214,110,0)'); c.fillStyle = g; c.fillRect(-42, -76, 84, 84); }); }
      for (let i = 0; i < 8; i++) { const a = -PI / 2 + (i - 3.5) * 0.36; strokePts([[Math.cos(a) * 24, -34 + Math.sin(a) * 24], [Math.cos(a) * 36, -34 + Math.sin(a) * 36]], '#c9962e', 2.2); }
      fillPts([[-15, -12], [15, -12], [15, 44, 1], [-15, 44, 1]], '#b8282a');
      fillPts([[-15, -12], [-6, -12], [-6, 44, 1], [-15, 44, 1]], '#8a1a1c');
      fillPts([[-15, -12], [15, -12], [15, -6], [9, -4], [8, 6], [4, 6], [3, -4], [-15, -5]], '#f2ece0');
      strokePts([[0, -12], [0, -20]], '#2a2020', 2);
      fillPts([[0, -18], [9, -30], [5, -46], [0, -56], [-5, -46], [-9, -30]], '#e8862c');
      fillPts([[0, -21], [5, -31], [2, -42], [0, -47], [-2, -42], [-5, -31]], '#f7d050');
      fillPts([[-34, 44], [34, 44], [28, 54], [-28, 54]], '#c9962e'); strokePts([[-30, 46], [30, 46]], 'rgba(255,240,190,0.8)', 1.4);
    },
    houx: () => {
      const leaf = (a, l) => { const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([u * l, -(i % 2 ? 15 : 8) * Math.sin(PI * u) - 1]); } for (let i = 6; i >= 0; i--) { const u = i / 6; pts.push([u * l, (i % 2 ? 15 : 8) * Math.sin(PI * u) + 1]); } return rot(pts, a, 0, 0); };
      fillPts(tr(leaf(-2.4, 52), 0, 4), '#1f6a34'); fillPts(tr(leaf(-0.7, 52), 0, 4), '#2a7d3e'); fillPts(tr(leaf(-1.55, 46), 0, 4), '#24713a');
      for (const a of [-2.4, -0.7, -1.55]) strokePts([[0, 4], [Math.cos(a) * 44, 4 + Math.sin(a) * 44]], 'rgba(200,240,190,0.6)', 1.3);
      for (const [x, y] of [[-10, 14], [10, 15], [0, 26]]) { dot(x, y, 10, '#c41e24'); dot(x - 3, y - 3, 3, '#f6b0a8'); }
    },
    feuille: () => {
      const pts = [[0, 44], [-6, 26], [-30, 20], [-22, 8], [-42, -6], [-22, -10], [-30, -32], [-10, -24], [0, -48], [10, -24], [30, -32], [22, -10], [42, -6], [22, 8], [30, 20], [6, 26]];
      fillPts(pts, '#d0602a'); strokePts([[0, 44], [0, -40]], '#8a3416', 1.8);
      for (const s of [-1, 1]) { strokePts([[0, 0], [s * 30, -24]], '#8a3416', 1.2); strokePts([[0, 12], [s * 32, 0]], '#8a3416', 1.2); }
    },
    gland: () => {
      fillPts([[-22, -6], [22, -6], [24, 10], [16, 32], [0, 44], [-16, 32], [-24, 10]], '#b6782e');
      strokePts([[-10, 6], [-6, 30]], 'rgba(255,230,180,0.6)', 2);
      fillPts([[-28, -4], [-24, -22], [0, -30], [24, -22], [28, -4]], '#6a4420');
      for (let x = -22; x <= 22; x += 7) strokePts([[x, -24], [x + 2, -5]], 'rgba(30,20,10,0.6)', 1.1);
      strokePts([[0, -30], [6, -44]], '#4a2e14', 3);
    },
    champignon: () => {
      fillPts([[-12, 0], [12, 0], [14, 40], [-14, 40]], '#efe6d2'); strokePts([[-6, 6], [-6, 36]], 'rgba(150,130,100,0.6)', 1.2);
      fillPts([[-44, 4], [-40, -18], [-20, -38], [0, -42], [20, -38], [40, -18], [44, 4]], '#c62a26');
      for (const [x, y, r] of [[-22, -16, 6], [4, -28, 5], [22, -12, 6], [-4, -8, 4], [32, -2, 3], [-34, -2, 3]]) dot(x, y, r, '#f6efe0');
    },
    pomme: () => {
      fillPts([[0, -24], [16, -32], [34, -22], [40, 0], [32, 26], [14, 40], [0, 34], [-14, 40], [-32, 26], [-40, 0], [-34, -22], [-16, -32]], '#c8302a');
      strokePts([[-20, -12], [-26, 8]], 'rgba(255,220,200,0.7)', 3);
      strokePts([[0, -26], [3, -44]], '#4a2e14', 3); fillPts([[4, -38], [18, -48], [28, -42], [14, -34]], '#3f8a3a');
    },
    lune: () => {
      const o = ep(0, 0, 40, 40, 20, -PI * 0.62, PI * 0.62), i = ep(14, 0, 32, 32, 20, PI * 0.5, -PI * 0.5);
      fillPts(o.concat(i), '#e9c84a'); dot(-18, -8, 3, 'rgba(160,120,30,0.6)'); dot(-24, 10, 2.5, 'rgba(160,120,30,0.6)');
    },
    etoile: () => {
      const pts = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 18 : 44; pts.push([Math.cos(a) * r, Math.sin(a) * r + 4]); }
      fillPts(pts, '#e2a92a'); strokePts([[0, -40], [0, 4]], 'rgba(255,245,200,0.8)', 1.6);
    },
    nuage: () => {
      const pts = [].concat(ep(-22, 4, 20, 18, 8, PI * 0.5, PI * 1.5), ep(0, -10, 24, 24, 8, PI, TAU), ep(24, 2, 20, 20, 8, -PI * 0.5, PI * 0.5));
      fillPts(pts.concat([[24, 22], [-22, 22]]), '#7f97b4'); fillPts([[-36, 14], [36, 14], [32, 22], [-34, 22]], '#62799a');
      for (const x of [-18, 0, 18]) strokePts([[x, 30], [x - 5, 44]], '#3f6ea6', 2.2);
    },
    flocon: () => {
      for (let i = 0; i < 6; i++) {
        const a = i * PI / 3, ca = Math.cos(a), sa = Math.sin(a), q = (r, d) => [ca * r - sa * d, sa * r + ca * d];
        strokePts([[0, 0], q(44, 0)], '#3f78b8', 3.4);
        strokePts([q(24, 0), q(34, 9)], '#3f78b8', 2.4); strokePts([q(24, 0), q(34, -9)], '#3f78b8', 2.4);
      }
      dot(0, 0, 6, '#3f78b8');
    },
    chataigne: () => {
      const bogue = [[-40, 10], [-34, -12], [-14, -22], [0, -14], [14, -22], [34, -12], [40, 10], [26, 30], [-26, 30]];
      fillPts(bogue, '#7a9a3a'); for (let i = 0; i < 18; i++) { const a = PI * 0.95 + i * 0.07 * PI, x = Math.cos(a) * 40, y = 12 + Math.sin(a) * 30; strokePts([[x, y], [x * 1.18, y * 1.15 + 2]], '#4f6a20', 1.3); }
      fillPts([[-20, -6], [-6, -26], [8, -22], [18, -2], [6, 12], [-14, 10]], '#6a3418'); strokePts([[-12, -10], [-2, -20]], 'rgba(255,210,170,0.6)', 2);
    },
    oiseau: () => {
      fillPts([[-34, 6], [-16, -14], [6, -20], [22, -26], [34, -22], [42, -16], [32, -12], [26, 4], [10, 22], [-12, 24], [-28, 18], [-46, 22]], '#3a5c8c');
      fillPts([[8, -10], [24, -10], [20, 10], [6, 16]], '#d0542a'); dot(30, -20, 2.6, '#101010'); strokePts([[-14, -2], [6, 6]], 'rgba(200,220,255,0.6)', 1.6);
      strokePts([[0, 22], [-2, 34]], '#6a4a2a', 1.6); strokePts([[8, 22], [8, 34]], '#6a4a2a', 1.6);
    },
    poisson: () => {
      fillPts([[-30, 0], [-10, -20], [16, -22], [36, -6], [40, 0], [36, 6], [16, 22], [-10, 20]], '#2f8a8a');
      fillPts([[-28, 0], [-46, -18], [-42, 0], [-46, 18]], '#24706e'); dot(26, -4, 3, '#101010');
      for (const x of [-6, 4, 14]) strokePts([[x, -14], [x - 6, 0], [x, 14]], 'rgba(200,250,240,0.55)', 1.2);
    },
    sapin: () => {
      fillPts([[-6, 30], [6, 30], [6, 46], [-6, 46]], '#6a4420');
      fillPts([[0, -46], [22, -14], [12, -14], [32, 12], [18, 12], [40, 32], [-40, 32], [-18, 12], [-32, 12], [-12, -14], [-22, -14]], '#2f6a3a');
      strokePts([[-16, -6], [10, -4]], 'rgba(220,240,210,0.6)', 1.4);
    },
    soleil: () => {
      for (let i = 0; i < 12; i++) { const a = i * PI / 6; fillPts([[Math.cos(a - 0.1) * 26, Math.sin(a - 0.1) * 26], [Math.cos(a) * 46, Math.sin(a) * 46], [Math.cos(a + 0.1) * 26, Math.sin(a + 0.1) * 26]], '#e0a020'); }
      fillPts(ell(0, 0, 26, 26, 16), '#f0bc32');
    },
    poire: () => {
      fillPts([[0, -34], [10, -28], [14, -8], [30, 12], [32, 30], [18, 44], [-18, 44], [-32, 30], [-30, 12], [-14, -8], [-10, -28]], '#b8b23a');
      strokePts([[-16, 18], [-20, 32]], 'rgba(255,250,200,0.7)', 3); strokePts([[0, -34], [4, -46]], '#4a2e14', 3);
    },
  };
  LUC.PICTOS = Object.keys(PIC);         // 'bougie','houx','feuille','gland','champignon','pomme','lune','etoile','nuage','flocon','chataigne','oiseau','poisson','sapin','soleil','poire'
  function picto(name, x, y, k) {
    const f = PIC[name]; if (!f) return;
    const c = cx_(); c.save(); c.translate(x || 0, y || 0); if (k && k !== 1) c.scale(k, k); f(); c.restore();
  }
  LUC.picto = picto;

  // =====================================================================
  // 3) OBJETS — chacun se dessine dans son repère (échelle 1), seul ou tenu en main
  // =====================================================================
  // ---- feuillet d'éphéméride : 124 × 140, centré ; picto au milieu ; o.dos (verso)
  const FW = 62, FH = 70;
  function drawFeuillet(o) {
    const dos = !!o.dos;
    pc([[-FW, -FH + 2], [-FW + 8, -FH], [-FW + 16, -FH + 3], [-FW + 26, -FH], [FW - 26, -FH], [FW - 16, -FH + 3], [FW - 8, -FH], [FW, -FH + 2], [FW, FH, 1], [-FW, FH, 1]], dos ? '#e2d9c2' : '#f1ead8', () => {
      if (dos) { hatch(null, 0.7, 5, 0.12, 1, undefined, [-FW, -FH, FW, FH]); return; }
      strokePts(rrect(-FW + 7, -FH + 9, FW - 7, FH - 7, 6).concat([[FW - 13, -FH + 9]]), 'rgba(150,110,60,0.45)', 1.2);
      picto(o.picto || 'feuille', 0, 4, 1.05);
      shade(0, -FH, 0, FH, 0.12, [-FW, -FH, FW, FH]);
    }, 7101 + (hash((o.picto || '').length) * 50 | 0), { texA: 0.3 });
  }
  // ---- almanach : dos (reliure) en x = 0 ; page/couverture 100 × 150 (y −75..75) ; o.ouvert 0 fermé → 1 ouvert (≈ 210 de large)
  const AL = { W: 100, H: 75, bleu: '#24324f', bleuL: '#34466a', or: '#c9a046', ivoire: '#efe7d2' };
  function vignettes(sx, side) {
    const c = cx_(); c.save(); c.scale(sx, 1);
    strokePts(rrect(8, -66, 92, 66, 4), 'rgba(140,100,60,0.5)', 1.1);
    if (side > 0) { picto('soleil', 50, -36, 0.36); picto('lune', 34, 14, 0.3); fillPts([[60, -2], [66, 6], [62, 26], [58, 6]], '#c8962e'); for (const y of [4, 12, 20]) { strokePts([[62, y], [70, y - 6]], '#b07e22', 1.4); strokePts([[60, y], [52, y - 6]], '#b07e22', 1.4); } strokePts([[62, 26], [62, 48]], '#9a7a3a', 1.6); }
    else { picto('etoile', 50, -34, 0.3); fillPts(ell(36, 18, 12, 12, 10), '#d0a33c'); picto('lune', 64, 18, 0.24); }
    for (let i = 0; i < 3; i++) strokePts([[18, 44 + i * 7], [36, 42 + i * 7], [56, 45 + i * 7], [82, 43 + i * 7]], 'rgba(90,80,70,0.35)', 1);
    c.restore();
  }
  function drawAlmanach(o) {
    const u = clamp(o.ouvert || 0), cs = Math.cos(PI * u), lift = 8 * Math.sin(PI * u);
    pc(sh([[-2, -AL.H - 3], [AL.W + 4, -AL.H - 3], [AL.W + 4, AL.H + 3], [-2, AL.H + 3]]), AL.bleu, () => hatch(null, 0.6, 4, 0.2), 7201);
    pc(sh([[0, -AL.H], [AL.W - 2, -AL.H + 1], [AL.W - 2, AL.H - 1], [0, AL.H]]), AL.ivoire, () => { vignettes(1, 1); shade(0, 0, AL.W, 0, 0.15, [0, -AL.H, AL.W, AL.H]); }, 7202, { texA: 0.3, drop: false });
    if (cs > 0.02) {
      const w = (AL.W + 4) * cs;
      pc(sh([[0, -AL.H - 3], [w, -AL.H - 3 - lift], [w, AL.H + 3 - lift], [0, AL.H + 3]]), AL.bleu, () => {
        const c = cx_(); c.save(); c.scale(cs, 1);
        strokePts(rrect(10, -64, 92, 64, 6), AL.or, 1.6);
        c.translate(52, -16); picto('soleil', 0, 0, 0.38); c.restore();
        c.save(); c.scale(cs, 1); c.translate(52, 34); picto('lune', 0, 0, 0.32); c.restore();
        fillPts([[0, -AL.H - 4], [8 * cs, -AL.H - 4], [8 * cs, AL.H + 4], [0, AL.H + 4]], AL.bleuL);
        hatch(null, 0.6, 4, 0.18); shade(w, 0, 0, 0, 0.25, [0, -AL.H - 10, w, AL.H + 10]);
      }, 7203);
    } else if (cs < -0.02) {
      const w = (AL.W + 4) * cs;
      pc(sh([[0, -AL.H - 3], [w, -AL.H - 3 - lift], [w, AL.H + 3 - lift], [0, AL.H + 3]]), AL.bleu, null, 7204);
      const wp = (AL.W - 2) * cs;
      pc(sh([[0, -AL.H], [wp, -AL.H - lift + 1], [wp, AL.H - lift - 1], [0, AL.H]]), AL.ivoire, () => { vignettes(cs, -1); shade(wp, 0, 0, 0, 0.12, [wp, -AL.H - 10, 0, AL.H + 10]); }, 7205, { texA: 0.3, drop: false });
    }
    strokePts([[0, -AL.H - 3], [0, AL.H + 3]], 'rgba(20,20,40,0.6)', 1.6);
  }
  // ---- bougeoir à poignée (anneau) : origine = centre du plateau ; o.haut 0..1 (chandelle), o.flamme 0..1, o.vent (rad), o.fumee 0..1, o.t
  function drawBougeoir(o) {
    const h = 26 + 62 * clamp(o.haut == null ? 1 : o.haut), t = o.t || 0;
    pc([[-44, -8], [-58, -9], [-58, 1], [-44, 2]], '#a8823c', null, 7301);                                  // bras de la poignée (côté arrière)
    strokePts(ell(-68, -4, 11, 11, 14).concat([[-57, -4]]), '#7a5a26', 6.4); strokePts(ell(-68, -4, 11, 11, 14).concat([[-57, -4]]), '#c9a046', 3.2);
    pc(ep(0, -2, 52, 12, 14, PI * 0.05, PI * 0.95).concat(ep(0, -4, 52, 8, 14, PI * 0.95, PI * 2.05)), '#b8923e', () => { strokePts(ep(0, -4, 46, 5, 12, PI, TAU), 'rgba(255,240,190,0.7)', 1.3); shade(0, -12, 0, 10, 0.3, [-56, -16, 56, 14]); }, 7302);
    pc([[-14, -4], [14, -4], [12, -14], [-12, -14]], '#9a7632', null, 7303, { drop: false });
    pc([[-9, -12], [9, -12], [9, -12 - h, 1], [-9, -12 - h, 1]], '#efe6cf', () => { fillPts([[-9, -12 - h], [9, -12 - h], [9, -6 - h], [3, -4 - h], [2, 4 - h], [-2, 4 - h], [-3, -4 - h], [-9, -6 - h]], '#fbf6ea'); strokePts([[-5, -16], [-5, -8 - h]], 'rgba(160,140,100,0.4)', 1.4); }, 7304, { texA: 0.3 });
    strokePts([[0, -12 - h], [0, -18 - h]], '#2a2020', 1.6);
    flammette(0, -17 - h, clamp(o.flamme == null ? 1 : o.flamme), o.vent || 0, t + 0.3, 3);
    filetFumee(0, -18 - h, clamp(o.fumee || 0), t);
  }
  // ---- liasse de feuillets (épaisseur n) : centre ; picto du dessus o.top
  function drawLiasse(o) {
    const n = Math.round(clamp(o.n == null ? 10 : o.n, 1, 30));
    for (let i = n - 1; i >= 1; i--) { const dx = i * 1.4, dy = i * 1.6; pc(tr(box(-FW, -FH, FW, FH), dx, dy), i % 2 ? '#e6dcc4' : '#efe6d2', null, 7400 + i, { drop: i === n - 1, texA: 0.2 }); }
    drawFeuillet({ picto: o.top || 'pomme' });
  }
  // registre : grip = point tenu (repère de l'objet) ; p2 = seconde prise ; pts = points nommés ; base = point posé (objet seul)
  const OBJ = {
    almanach: { draw: drawAlmanach, grip: (o) => (o._deux ? [80, 70] : [lerp(56, 2, clamp(o.ouvert || 0)), 72]), p2: () => [-80, 70], pts: { centre: [0, 0], haut: [0, -75] }, base: [0, 0] },
    bougeoir: { draw: drawBougeoir, grip: [-68, 2], pts: { meche: (o) => [0, -38 - 62 * clamp(o.haut == null ? 1 : o.haut)], plateau: [0, 0] }, base: [0, 8] },
    liasse: { draw: drawLiasse, grip: [FW - 4, 4], p2: () => [-FW + 4, 4], pts: { centre: [0, 0] }, base: [0, 0] },
    feuillet: { draw: drawFeuillet, grip: [-FW + 6, FH - 8], pts: { centre: [0, 0] }, base: [0, 0] },
  };
  LUC.OBJ = OBJ;
  const gripOf = (ob, o) => (typeof ob.grip === 'function' ? ob.grip(o) : ob.grip);
  const ptOf = (v, o) => (typeof v === 'function' ? v(o) : v);
  // accessoires seuls (sans tige) : une marionnette à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  const accDefs = {};
  function accDef(key, fn) { return accDefs[key] || (accDefs[key] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accDraw(key, fn, x, y, s, o) {
    o = o || {};
    return M.puppet(accDef(key, fn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name];
    return accDraw(name, (oo) => { const c = cx_(); c.save(); c.translate(-ob.base[0], -ob.base[1]); ob.draw(oo); c.restore(); }, x, y, s == null ? 1 : s, o);
  }
  LUC.almanach = (x, y, s, o) => acc('almanach', x, y, s, o);
  LUC.bougeoir = (x, y, s, o) => acc('bougeoir', x, y, s, o);
  LUC.liasse = (x, y, s, o) => acc('liasse', x, y, s, o);
  // un feuillet seul qui vole : ang (rad), picto, k = retournement −1..1 (1 = face, 0 = de chant, < 0 = verso)
  LUC.feuillet = function (x, y, s, ang, picto, k, o) {
    k = k == null ? 1 : k; o = Object.assign({}, o || {}, { rot: ang || 0 });
    const kk = Math.abs(k) < 0.06 ? 0.06 * (k < 0 ? -1 : 1) : k;
    return accDraw('feuilletVol', (oo) => { const c = cx_(); c.save(); c.scale(oo._k, 1); drawFeuillet({ picto: oo._p, dos: oo._k < 0 }); c.restore(); }, x, y, s == null ? 1 : s, Object.assign(o, { _k: kk, _p: picto }));
  };
  // trajectoire d'un feuillet qui tombe en virevoltant : {x, y, ang, k, pose} ou null avant t0 ; o : vx (dérive px), haut (montée initiale px), sol (y, défaut 1416), seed
  LUC.feuilletChute = function (t, t0, x0, y0, o) {
    o = o || {}; const u = t - t0; if (u < 0) return null;
    const sd = o.seed || 1, ph = hash(sd) * TAU, vt = o.vitesse || 230, sol = o.sol == null ? 1416 : o.sol;
    const yv = y0 - (o.haut || 0) * (1 - Math.exp(-4 * u)) + vt * u * (1 - Math.exp(-2.2 * u)) / 1;
    const x = x0 + (o.vx || 0) * (1 - Math.exp(-1.6 * u)) + 26 * Math.sin(u * 2.6 + ph) * Math.min(1, u * 2);
    if (yv >= sol) { // posé : on cherche l'instant d'arrivée (approché) pour figer la pose
      return { x, y: sol, ang: 0.25 * Math.sin(ph * 3), k: 1, pose: true };
    }
    return { x, y: yv, ang: 0.5 * Math.sin(u * 3.1 + ph), k: Math.cos(u * 4.2 + ph), pose: false };
  };

  // ---- ÉPHÉMÉRIDE : bloc mural (repère « murale » : carton 150 × 200 centré) ; chevalet = même bloc × 2,1 sur un chevalet sculpté
  const EP = { k: 2.1, cy: -520, top: -76, bas: 64 };
  function pileH(o) { return Math.min(30, clamp(o.pile == null ? 20 : o.pile, 0, 60) * 0.8); }
  function peel(a, sg) {     // feuillet du dessus qui se décolle : renvoie {front, flap, coin, M (rotation de détachement)}
    const e1 = ease(clamp(a / 0.6)), e2 = ease(clamp((a - 0.6) / 0.4));
    const BLx = -FW * sg, BLy = FH;
    const Bc = [lerp(BLx, 14 * sg, e1), FH], Lc = [BLx, lerp(FH, -8, e1)];
    const coin0 = [BLx - 34 * sg * e1, FH + 14 * e1 - 10 * e1];
    const coin = [coin0[0] - 40 * sg * e2, coin0[1] + 52 * e2];
    return { e1, e2, Bc, Lc, coin0, coin, ang: -0.55 * sg * e2 };
  }
  function drawEphBlock(o) {
    const ph = pileH(o), a = clamp(o.arrache || 0), sg = o.coin === 'droite' ? -1 : 1;
    // ficelle + clou
    strokePts([[-26, -98], [0, -118], [26, -98]], 'rgba(40,30,20,0.7)', 1.3); dot(0, -118, 3.4, '#6a6058');
    pc(rrect(-75, -100, 75, 100, 8), '#26324f', () => {
      strokePts(rrect(-69, -94, 69, 94, 6).concat([[-63, -94]]), 'rgba(201,160,70,0.85)', 1.5);
      for (const [x, y] of [[-62, 86], [62, 86]]) { strokePts(ep(x - Math.sign(x) * 4, y - 4, 6, 6, 8, 0, PI * 1.5), 'rgba(201,160,70,0.8)', 1.2); }
      hatch(null, 0.7, 4.4, 0.18, 1, undefined, [-75, -100, 75, 100]);
    }, 7501);
    // tranche de la pile (feuillets restants)
    if (ph > 0.5) {
      pc(box(-FW, 60, FW, 64 + ph), '#ebe2cc', () => { for (let y = 64; y < 64 + ph; y += 1.7) strokePts([[-FW, y], [FW, y]], 'rgba(120,100,70,0.35)', 0.8); }, 7502, { texA: 0.2 });
    }
    const c = cx_();
    // feuillet de dessous (visible pendant l'arrachage)
    const off = EP.top + FH;            // centre vertical du feuillet (−6)
    if (a > 0 && o.dessous) { c.save(); c.translate(0, off); drawFeuillet({ picto: o.dessous }); c.restore(); }
    if (a < 1 && o.top) {
      c.save(); c.translate(0, off);
      if (a <= 0) drawFeuillet({ picto: o.top });
      else {
        const q = peel(a, sg);
        c.translate(q.coin0[0], q.coin0[1]); c.translate(q.coin[0] - q.coin0[0], q.coin[1] - q.coin0[1]); c.rotate(q.ang); c.translate(-q.coin0[0], -q.coin0[1]);
        const TL = [-FW * sg, -FH], TR = [FW * sg, -FH], BR = [FW * sg, FH];
        c.save(); c.beginPath(); for (const p of [TL, TR, BR, q.Bc, q.Lc]) c.lineTo(p[0], p[1]); c.closePath();
        if (!SIL()) c.clip();
        drawFeuillet({ picto: o.top }); c.restore();
        pc(sh([q.Bc, q.Lc, q.coin0]), '#ddd2b8', () => hatch(null, 0.6, 4, 0.12, 1, undefined, [-80, -80, 80, 90]), 7503, { texA: 0.3 });
      }
      c.restore();
    }
    // barrette dorée (par-dessus le haut des feuillets)
    pc(rrect(-66, -92, 66, -74, 4), '#c9a046', () => { strokePts([[-62, -88], [62, -88]], 'rgba(255,240,190,0.75)', 1.4); shade(0, -92, 0, -74, 0.3, [-66, -92, 66, -74]); }, 7504);
    for (const x of [-54, 54]) M.rivet(x, -83, 3);
  }
  function ephCoin(o) { const a = clamp(o.arrache || 0), sg = o.coin === 'droite' ? -1 : 1, off = EP.top + FH; if (a <= 0) return [-FW * sg + 6 * sg, off + FH - 6]; const q = peel(a, sg); return [q.coin[0], q.coin[1] + off]; }
  function drawChevalet(o) {
    const bois = '#6a4428', boisL = '#8a6038', boisD = '#4a2e1a';
    pc([[-8, -770], [8, -770], [48, 0, 1], [32, 0, 1]], boisD, () => hatch(null, 1.4, 4, 0.3), 7601);       // pied arrière
    for (const sx of [-1, 1]) pc([[sx * 22, -790], [sx * 40, -790], [sx * 132, 0, 1], [sx * 108, 0, 1]], bois, () => { strokePts([[sx * 34, -760], [sx * 118, -10]], 'rgba(255,220,170,0.25)', 1.6); hatch(null, 1.4, 4, 0.22); }, 7602 + sx);
    pc(box(-150, -300, 150, -282), boisL, () => { strokePts([[-146, -296], [146, -296]], 'rgba(255,230,190,0.4)', 1.4); hatch(null, 0.2, 4, 0.2); }, 7605);     // tablette
    pc(box(-96, -150, 96, -138), bois, null, 7606);                                                          // traverse
    // fronton sculpté à volutes
    pc([[-70, -790], [-78, -812], [-60, -830], [-34, -828], [-18, -842], [0, -850], [18, -842], [34, -828], [60, -830], [78, -812], [70, -790]], boisL, () => {
      strokePts(ep(-48, -812, 12, 10, 10, PI * 0.2, PI * 1.9), 'rgba(60,35,15,0.7)', 1.4); strokePts(ep(48, -812, 12, 10, 10, PI * 1.1, PI * 2.8), 'rgba(60,35,15,0.7)', 1.4);
      dot(0, -828, 6, '#c9a046'); hatch(null, 0.8, 4, 0.2);
    }, 7607);
    const c = cx_(); c.save(); c.translate(0, EP.cy); c.scale(EP.k, EP.k); drawEphBlock(o); c.restore();
  }
  // LUC.ephemeride(x, y, s, o) : o.taille 'murale' ((x,y) = centre du carton ; 150 × 200 à s 1) | 'chevalet' ((x,y) = sol ; carton 315 × 420, hauteur ≈ 850 à s 1)
  //   o.pile (feuillets restants, défaut 20 : épaisseur de la tranche), o.top (picto du dessus), o.dessous (picto révélé pendant l'arrachage),
  //   o.arrache 0..1 (le feuillet du dessus se décolle par un coin puis se détache ; à 1 il n'est plus dessiné), o.coin 'gauche'|'droite', o.dir, o.cast
  LUC.ephemeride = function (x, y, s, o) {
    o = o || {}; const ch = o.taille === 'chevalet';
    return accDraw(ch ? 'ephCh' : 'ephMur', ch ? drawChevalet : drawEphBlock, x, y, s == null ? 1 : s, o);
  };
  // point écran : 'centre' | 'haut' (barrette) | 'clou' | 'coin' (coin saisi, suit l'arrachage) | 'bas' (bas de la pile) | 'sommet' (fronton du chevalet)
  LUC.ephPt = function (x, y, s, o, nom) {
    o = o || {}; s = s == null ? 1 : s; const ch = o.taille === 'chevalet', d = o.dir || 1, k = ch ? EP.k : 1, oy = ch ? EP.cy : 0;
    let p;
    if (nom === 'sommet') return [x, y + (ch ? -850 : -118) * s];
    if (nom === 'coin') p = ephCoin(o);
    else p = { centre: [0, 0], haut: [0, -83], clou: [0, -118], bas: [0, FH + pileH(o) + EP.top + FH] }[nom] || [0, 0];
    return [x + d * p[0] * k * s, y + (oy + p[1] * k) * s];
  };

  // =====================================================================
  // 4) MARIONNETTES HUMAINES — pièces communes (bras à articulations rondes, objets tenus, doigts par-dessus)
  // =====================================================================
  const R_COUDE = 11.5, LA = 96, HL = 100;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind === 'open' ? 'open' : 'fist'); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function upDef(at, base, seed, paint) { return { parent: 'torso', at, pts: armR(LA), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) }; }
  function foreDef(parent, base, skin, back, seed, cuff) {
    const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p) === 'open' ? 'open' : 'fist');
      if (cuff) cuff(); hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.3 : 0.22);
    } };
  }
  function legDef(at, base, seed, back, th, shoe) {
    return { parent: 'torso', at, pts: X.legPts(th || 0.95), base, seed, noRivet: !!back, paint: () => {
      shoe(back); hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, back ? 0.34 : 0.25);
    } };
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldOpts(name, o, p) { return Object.assign({ t: p.t || 0 }, o || {}); }
  function heldDraw(name, o, p) {
    const ob = OBJ[name]; if (!ob) return;
    const oo = heldOpts(name, o, p), g = gripOf(ob, oo), e = oo.echelle || 1, c = cx_();
    c.save(); c.scale(e, e); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => ((has(p.tenuB) || p._deux) ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  function prep(p) { p = p || {}; return Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face), tenuO: Object.assign({}, p.tenuO), tenuBO: Object.assign({}, p.tenuBO), tilt: p.tilt || 0, dx: p.dx || 0, dy: p.dy || 0 }); }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function reach(def, q, x, y, s, dir, arm, T, k) {
    if (!(k > 0) || !T) return;
    const sol = M.ik(def, q, x, y, s, dir, arm, T, 1), A = q.ang, a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.up - a0) * k; A[arm + '_lo'] = b0 + normA(sol.lo - b0) * k;
  }
  const mats = (def, q, x, y, s, dir) => M.partMatrices(def, q, x, y, s, dir).mats;
  const loc = (def, q, x, y, s, dir, part, p) => M.wpt(mats(def, q, x, y, s, dir)[part], p[0], p[1]);
  function plier(q, th) { if (!th) return; q.tilt += th; q.dx -= 238 * Math.sin(th); q.dy += 238 * (1 - Math.cos(th)); q.ang.legF = (q.ang.legF || 0) - th; q.ang.legB = (q.ang.legB || 0) - th; }
  function faceSet(q, f) { for (const k in f) if (q.face[k] == null) q.face[k] = f[k]; }
  // respiration, marche, parole (communes)
  function commun(q, o) {
    const t = q.t || 0, A = q.ang, m = clamp(q.marche || 0);
    q.dy += Math.sin(t * 1.9) * 1.1;
    if (m > 0) {
      const f = TAU * (q.pas != null ? q.pas : t * 1.6), sn = Math.sin(f);
      if (o && o.glisse) { q.dy -= Math.abs(Math.cos(f)) * 3 * m; q.tilt += 0.012 * sn * m; q._pas = sn * m; }
      else { A.legF = (A.legF || 0) + 0.3 * sn * m; A.legB = (A.legB || 0) - 0.3 * sn * m; q.dy -= Math.abs(Math.cos(f)) * 6 * m; }
      if (!has(q.tenu) && !(q.lit > 0)) A.armF_up = (A.armF_up || 0) - 0.13 * sn * m;
      if (!has(q.tenuB) && !(q.lit > 0)) A.armB_up = (A.armB_up || 0) + 0.12 * sn * m;
    }
    if (q.parle > 0 && !q.face.mouth) q.face.mouth = Math.sin(t * 15) * Math.sin(t * 6.3 + 1) > 0.15 * (2 - q.parle) ? 'o' : 'n';
  }
  // lit 0..1 : almanach ouvert tenu à deux mains, bas devant la poitrine (main avant sur le coin bas de la page avant, main arrière sur l'autre)
  function lecture(def, q, x, y, s, dir) {
    const k = ease(clamp(q.lit || 0)); if (k <= 0) return;
    q.tenu = q.tenu && q.tenu !== 'rien' ? q.tenu : 'almanach';
    if (q.tenu === 'almanach') { q.tenuO._deux = true; if (q.tenuO.ouvert == null) q.tenuO.ouvert = 1; if (q.tenuO.echelle == null) q.tenuO.echelle = 0.9; }
    q.deuxMains = true;
    const C = def.lecture || [62, -92], ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1;
    const tgt = [C[0] + g[0] * e, C[1] + g[1] * e - (q.tenu === 'almanach' ? 0 : 0)];
    reach(def, q, x, y, s, dir, 'armF', loc(def, q, x, y, s, dir, 'torso', tgt), k);
    if (q.ang.head == null || q.ang.head === 0) q.ang.head = 0.16 * k;
  }
  function finish(def, q, x, y, s, dir) {
    const A = q.ang;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + q.tilt);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + q.tilt);
    A.doigts = A.objet || 0; A.doigtsB = A.objetB || 0;
    q._deux = false;
    if (q.deuxMains && has(q.tenu) && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = gripOf(ob, oo), e = oo.echelle || 1, p2 = ob.p2(oo);
      const T = loc(def, q, x, y, s, dir, 'objet', [(p2[0] - g[0]) * e, (p2[1] - g[1]) * e]);
      const kk = q.deuxK == null ? 1 : q.deuxK;
      reach(def, q, x, y, s, dir, 'armB', T, kk);
      q.handB = 'fist'; q._deux = true; A.doigtsB = -((A.armB_up || 0) + (A.armB_lo || 0) + q.tilt);
    }
    return q;
  }
  function run(def, q, x, y, s, o, nom) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF, nom }, o || {}));
    r.q = q; r.tenu = q.tenu; r.tenuB = q.tenuB; r.tenuO = heldOpts(q.tenu, q.tenuO, q); r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.main = r.w('armF_lo', 4, 96); r.mainB = r.w('armB_lo', 4, 96);
    return r;
  }
  // point nommé de l'objet tenu (écran) : LUC.pt(r, 'meche' | 'centre' | 'haut', arriere)
  LUC.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = gripOf(ob, oo), e = oo.echelle || 1, q = ptOf(ob.pts[nom], oo); if (!q) return null;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * e, (q[1] - g[1]) * e);
  };
  const ORDER = (fond, devant) => ['armB_up', 'armB_lo', 'legB', 'legF'].concat(fond, ['torso'], devant, ['objetB', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB']);

  // =====================================================================
  // LUCETTE — grand-mère d'aujourd'hui : menue, chignon bas gris argent, lunettes rondes dorées, gilet long prune, robe gris-bleu,
  //   grosse écharpe tricotée moutarde, collants sombres, pantoufles-bottines bordeaux.
  // =====================================================================
  const LU = { peau: '#e6c4a6', peauD: '#c9a385', chev: '#c4c5ca', chevD: '#93959e', gilet: '#6b3a5a', giletD: '#552a49', giletL: '#83506f',
    robe: '#5d6b7a', robeD: '#4a5664', ech: '#c99a2e', echD: '#a27a1c', echL: '#ddb54e', coll: '#2e2a33', collD: '#232029', bot: '#6e1f2e', botD: '#521522', or: '#c9a046' };
  const LU_TORSO = [[-12, -176], [8, -178], [16, -166], [24, -150], [30, -118], [32, -84], [29, -44], [31, 0], [38, 60], [44, 124, 1], [-42, 126, 1], [-38, 60], [-34, 0], [-33, -60], [-34, -112], [-30, -150], [-23, -168]];
  const LU_HEAD = X.NAP_HEAD.map((p) => [p[0] * 0.95, p[1] * 0.95 - 2].concat(p[2] ? [1] : []));
  function lucBottine(back) {
    fillPts(box(-40, 202, 60, 262), back ? LU.botD : LU.bot);
    fillPts(box(-24, 200, 22, 210), back ? '#8a6a5a' : '#c9b49c');           // revers fourré
    fillPts(box(-40, 233, 60, 262), '#2a1a1a');
    if (!back) strokePts([[18, 222], [40, 227]], 'rgba(255,220,220,0.3)', 1.3);
  }
  function mkLucette() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: LU_TORSO, base: LU.robe, seed: 8001, paint: () => {
        for (const x of [-26, -8, 12, 30]) strokePts([[x, 96], [x + 2, 124]], 'rgba(20,24,34,0.45)', 1.2);
        fillPts([[-48, -182], [14, -182], [18, -150], [21, -100], [22, -40], [26, 20], [31, 94, 1], [-48, 96, 1]], LU.gilet);   // gilet long ouvert
        strokePts([[18, -150], [21, -100], [22, -40], [26, 20], [31, 94]], 'rgba(255,220,240,0.22)', 1.6);
        for (let x = -42; x < 30; x += 4) strokePts([[x, 84], [x, 94]], 'rgba(40,10,30,0.4)', 1);                    // côtes du bas
        fillPts(box(-14, 12, 14, 42), LU.giletD); strokePts([[-14, 12], [14, 12]], 'rgba(255,220,240,0.3)', 1.2);  // poche
        for (let y = -140; y < 80; y += 9) strokePts([[-40, y], [-30, y + 3], [-20, y], [-10, y + 3], [0, y], [10, y + 3]], 'rgba(40,10,30,0.18)', 1);   // tricot
        hatch([[-48, -180], [-12, -180], [-10, 128], [-48, 128]], 0.75, 4.2, 0.3);
        shade(36, 0, -40, 0, 0.26);
      } },
      legB: legDef([-6, -2], LU.collD, 8002, true, 0.78, lucBottine),
      legF: legDef([6, -2], LU.coll, 8003, false, 0.78, lucBottine),
      armB_up: upDef([-10, -146], LU.giletD, 8004),
      armB_lo: foreDef('armB_up', LU.giletD, LU.peauD, true, 8005, () => fillPts(box(-15, 60, 15, 78), '#45213c')),
      head: { parent: 'torso', at: [5, -168], pts: LU_HEAD, base: LU.peau, seed: 8006, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[29, -78], [22, -90], [8, -98], [-10, -100], [-27, -92], [-36, -74], [-38, -50], [-34, -32], [-26, -24], [-16, -30], [-12, -46], [-4, -60], [8, -68], [20, -72]], LU.chev, 3);
        for (const [a, b] of [[[24, -80], [-4, -90]], [[14, -74], [-18, -86]], [[0, -66], [-30, -70]], [[-12, -52], [-34, -52]]]) strokePts([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 4], b], 'rgba(255,255,255,0.45)', 1.3);
        strokePts([[22, -80], [0, -88], [-24, -84]], 'rgba(90,90,100,0.4)', 1);
        X.earPaint(-8, -42);
        dot(14, -30, 9, 'rgba(214,120,110,0.3)');
        strokePts([[6, -48], [2, -46]], 'rgba(120,80,60,0.5)', 1); strokePts([[6, -54], [1, -55]], 'rgba(120,80,60,0.5)', 1);   // pattes d'oie
        strokePts([[22, -24], [18, -18]], 'rgba(120,80,60,0.35)', 1);
        X.eye(f, 16, -50, 0.92); X.brow(f, 16, -58, 'rgba(150,150,160,0.95)', 2.2); X.mouth(f, 25, -26);
        const ring = ell(17, -50, 9.5, 9, 14);
        fillPts(ring, 'rgba(200,230,240,0.22)', 0, 0); strokePts(ring.concat([ring[0]]), LU.or, 1.8);
        strokePts([[7, -51], [-12, -50]], LU.or, 1.4); strokePts([[13, -56], [19, -57]], 'rgba(255,255,255,0.7)', 1.2);
      } },
      chignon: { parent: 'head', at: [-34, -36], pts: ell(0, 0, 15, 13, 14), base: LU.chev, seed: 8007, noRivet: true, paint: () => {
        strokePts(ep(0, 0, 9, 7, 12, 0, PI * 1.7), 'rgba(255,255,255,0.5)', 1.3); strokePts(ep(1, 1, 4, 3, 8, PI, TAU * 1.2), 'rgba(90,90,100,0.5)', 1.1);
        hatch(null, 0.5, 3.4, 0.18); dot(6, -9, 2.2, '#6b3a5a');
      } },
      echarpe: { parent: 'torso', at: [0, 0], noRivet: true, base: LU.ech, seed: 8008,
        pts: [[-32, -186], [-8, -194], [14, -190], [28, -178], [33, -160], [26, -146], [6, -146], [-14, -150], [-32, -158], [-38, -172]],
        paint: () => { for (let y = -192; y < -144; y += 7) for (let x = -36; x < 34; x += 8) strokePts([[x, y], [x + 4, y + 4], [x + 8, y]], 'rgba(120,80,10,0.45)', 1.1); shade(30, -170, -30, -170, 0.25, [-40, -196, 36, -142]); strokePts([[-30, -160], [28, -166]], LU.echD, 2); } },
      echarpeBout: { parent: 'torso', at: [0, 0], noRivet: true, base: LU.echL, seed: 8009,
        pts: [[14, -160], [30, -158], [35, -112], [38, -78, 1], [16, -76, 1], [13, -118]],
        paint: () => { for (let y = -156; y < -80; y += 7) strokePts([[15, y], [24, y + 4], [36, y]], 'rgba(120,80,10,0.45)', 1.1); fillPts(box(15, -86, 38, -78), LU.echD); } ,
        extra: () => { for (let x = 18; x <= 36; x += 4) strokePts([[x, -77], [x + 1, -66]], LU.echD, 1.6); } },
      armF_up: upDef([-2, -146], LU.gilet, 8010),
      armF_lo: foreDef('armF_up', LU.gilet, LU.peau, false, 8011, () => { fillPts(box(-15, 60, 15, 78), LU.giletD); for (let x = -12; x < 14; x += 4) strokePts([[x, 61], [x, 77]], 'rgba(40,10,30,0.4)', 1); }),
    };
    Object.assign(parts, heldParts(LU.peau, 8020));
    return { nom: 'lucette', hipY: -238, handLen: HL, rod: { part: 'torso', at: [-24, 18] }, parts, lecture: [62, -92],
      corps: { front: [[0, 31], [-44, 29], [-84, 32], [-118, 30], [-150, 24]], back: -34 },
      order: ORDER(['chignon', 'head'], ['echarpe', 'echarpeBout']) };
  }
  CH.lucLucette = mkLucette();
  // gestes de Lucette (0..1, lissés) : lit, recite, arrache (+ cible), tire, regardeCiel, surprise, clin, frisson, marche, parle
  LUC.lucettePose = function (p, x, y, s, dir) {
    const def = CH.lucLucette, q = prep(p), A = q.ang; dir = dir || 1;
    const rc = ease(clamp(q.recite || 0));
    if (rc > 0.3 && q.parle == null) q.parle = 1;
    if (!q.face.mouth && !(q.parle > 0)) q.face.mouth = 'smile';
    commun(q);
    if (rc > 0) {
      if (!has(q.tenuB)) { q.tenuB = 'almanach'; if (q.tenuBO.ouvert == null) q.tenuBO.ouvert = 1; if (q.tenuBO.echelle == null) q.tenuBO.echelle = 0.72; }
      blend(q, 'armB_up', -0.06, rc); blend(q, 'armB_lo', -1.42, rc);
      blend(q, 'armF_up', -1.62, rc); blend(q, 'armF_lo', -0.7, rc); if (rc > 0.4) q.handF = 'open';
      A.head = (A.head || 0) - 0.16 * rc;
    }
    lecture(def, q, x, y, s, dir);
    const ar = ease(clamp(q.arrache || 0)), ti = ease(clamp(q.tire || 0));
    if (ar > 0 && q.cible) {
      const T = [q.cible[0] - dir * 46 * ti, q.cible[1] + 64 * ti];
      reach(def, q, x, y, s, dir, 'armF', T, ar); q.handF = 'fist'; A.head = (A.head || 0) - 0.12 * ar;
    }
    const rg = ease(clamp(q.regardeCiel || 0));
    if (rg > 0) {
      A.head = (A.head || 0) - 0.42 * rg; q.dy -= 4 * rg;
      reach(def, q, x, y, s, dir, 'armF', loc(def, q, x, y, s, dir, 'head', [40, -60]), rg); if (rg > 0.5) q.handF = 'open';
      faceSet(q, { brow: 'up', mouth: 'n' });
    }
    const su = ease(clamp(q.surprise || 0));
    if (su > 0) { blend(q, 'armF_up', -0.95, su); blend(q, 'armF_lo', -1.35, su); blend(q, 'armB_up', -0.75, su); blend(q, 'armB_lo', -1.4, su); q.handF = q.handB = 'open'; q.dy -= 6 * su; A.head = (A.head || 0) - 0.1 * su; if (su > 0.4) { q.face.mouth = 'o'; faceSet(q, { eyes: 'wide', brow: 'up' }); } }
    const fr = ease(clamp(q.frisson || 0));
    if (fr > 0) {
      reach(def, q, x, y, s, dir, 'armF', loc(def, q, x, y, s, dir, 'torso', [40, -150]), fr);
      reach(def, q, x, y, s, dir, 'armB', loc(def, q, x, y, s, dir, 'torso', [34, -132]), fr);
      q.handF = q.handB = 'fist'; q.dx += Math.sin((q.t || 0) * 38) * 1.6 * fr; A.head = (A.head || 0) + 0.12 * fr; q.dy += 4 * fr; faceSet(q, { brow: 'worry', mouth: 'tight' });
    }
    const cl = clamp(q.clin || 0);
    if (cl > 0) { if (cl > 0.5) q.face.eyes = 'closed'; q.face.mouth = 'smile'; A.head = (A.head || 0) + 0.06 * ease(cl); }
    finish(def, q, x, y, s, dir);
    return q;
  };
  LUC.lucette = function (pose, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s; const dir = o.dir || 1;
    const r = run(CH.lucLucette, LUC.lucettePose(pose, x, y, s, dir), x, y, s, o, 'lucette');
    r.epaule = r.w('torso', -16, -190);                  // dessus de l'écharpe, sur l'épaule
    r.s = s; r.dir = dir;
    return r;
  };

  // point (x,y) où poser LUC.puce(t, x, y, sp, {dir: r.dir}) pour qu'elle soit debout sur l'épaule de Lucette, tête près de l'oreille, visage dégagé
  LUC.epaulePuce = function (r, sp) { sp = sp == null ? r.s : sp; return [r.epaule[0] - r.dir * 62 * sp, r.epaule[1] + 4 * sp]; };

  // =====================================================================
  // LE PAPE GRÉGOIRE XIII — vieillard vif, barbe gris-blanc courte et taillée, nez fort, calotte (zucchetto) blanche (pièce 'camauro' ; 'hermine' vide), mozzette rouge,
  //   soutane ivoire jusqu'aux pieds, souliers rouges, étole or vieilli à volutes (aucune croix).
  //   Robe longue : pas de jambes articulées (deux souliers 'souF' / 'souB' qui glissent avec la marche, sans contrôle de pied).
  // =====================================================================
  const PA = { peau: '#e2bf9c', peauD: '#c49e7c', sout: '#ece4d2', soutD: '#cfc5ad', soutL: '#f6f1e4', rouge: '#8e1f22', rougeD: '#6e1518', rougeL: '#a8343a',
    herm: '#f4f1ea', or: '#b8923e', orL: '#dcbb6a', orD: '#8a6a2a', barbe: '#d9d7d1', barbeD: '#b4b1a9', chev: '#e2e0da' };
  const PA_TORSO = [[-14, -178], [8, -182], [18, -170], [30, -152], [38, -112], [40, -60], [38, 0], [42, 80], [48, 160], [54, 232, 1], [-50, 234, 1], [-46, 160], [-42, 80], [-40, 0], [-41, -60], [-42, -110], [-37, -150], [-26, -170]];
  const PA_HEAD = [[-14, 16], [10, 16], [11, 2], [16, -6], [24, -10], [28, -16], [27, -22], [30, -27], [31, -31], [37, -35], [44, -40, 1], [40, -47], [33, -54], [29, -62], [26, -78], [14, -92], [-6, -97], [-24, -88], [-33, -68], [-32, -46], [-24, -28], [-17, -8]];
  function volutes(x0, y0, x1, y1, n, col) { for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u); strokePts(ep(x, y, 4.5, 4.5, 8, 0, PI * 1.6), col, 1.2); strokePts(ep(x + 2, y + 9, 3.5, 3.5, 8, PI, PI * 2.6), col, 1.1); } }
  const souPts = (back) => (p) => { const d = (p._pas || 0) * (back ? -10 : 10); return [[d - 4 + (back ? -24 : 0), 222], [d + 30 + (back ? -24 : 0), 222], [d + 52 + (back ? -24 : 0), 232, 1], [d + 50 + (back ? -24 : 0), 240, 1], [d - 6 + (back ? -24 : 0), 240, 1]]; };
  function mkPape() {
    const parts = {
      souB: { parent: 'torso', at: [0, 0], noRivet: true, base: PA.rougeD, seed: 8101, pts: souPts(true) },
      souF: { parent: 'torso', at: [0, 0], noRivet: true, base: PA.rouge, seed: 8102, pts: souPts(false), paint: () => strokePts([[10, 226], [40, 230]], 'rgba(255,200,200,0.3)', 1.2) },
      torso: { parent: null, at: [0, 0], pts: PA_TORSO, base: PA.sout, seed: 8103, paint: (p) => {
        for (const x of [-30, -12, 8, 26, 42]) strokePts([[x * 0.8, -40], [x, 120], [x * 1.08, 230]], 'rgba(120,110,90,0.35)', 1.2);
        for (let y = -120; y < 226; y += 18) dot(36 + y * 0.07, y, 2, PA.rougeD);                                    // boutons de la soutane
        fillPts([[-48, -180], [16, -182], [30, -152], [42, -112], [47, -76, 1], [-50, -74, 1]], PA.rouge);            // mozzette
        strokePts([[30, -152], [42, -112], [47, -78]], 'rgba(255,190,190,0.3)', 1.5);
        hatch([[-50, -180], [-10, -180], [-10, -74], [-50, -74]], 0.75, 3.8, 0.32);
        for (const y of [-150, -128, -106, -86]) dot(38 + (y + 150) * 0.12, y, 2.2, PA.orL);
        // étole d'or à volutes, du cou jusqu'au bas de la soutane
        const st = [[12, -172], [26, -168], [36, -120], [38, -40], [42, 100], [46, 190, 1], [28, 192, 1], [24, 100], [20, -40], [18, -120], [8, -160]];
        fillPts(st, PA.or); strokePts([[25, -160], [31, -110], [33, -40], [37, 100], [39, 186]], PA.orL, 1.4);
        volutes(26, -136, 34, 170, 9, 'rgba(90,60,20,0.65)');
        fillPts(box(26, 186, 48, 198), PA.orD); for (let x = 28; x <= 46; x += 3) strokePts([[x, 198], [x, 210]], PA.orD, 1.3);
        hatch([[-50, -74], [-12, -74], [-12, 234], [-50, 234]], 0.75, 4.4, 0.24);
        shade(46, 0, -44, 0, 0.24, [-60, -190, 60, 240]);
      } },
      armB_up: upDef([-10, -146], PA.rougeD, 8104),
      armB_lo: foreDef('armB_up', PA.soutD, PA.peauD, true, 8105, () => fillPts(box(-16, 56, 16, 78), '#e6e0d0')),
      head: { parent: 'torso', at: [6, -170], pts: PA_HEAD, base: PA.peau, seed: 8106, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[12, -84], [-4, -94], [-22, -90], [-33, -72], [-36, -44], [-34, -26], [-26, -16], [-18, -28], [-14, -46], [-6, -64], [6, -76]], PA.chev);   // cheveux gris-blanc courts
        for (const [a, b] of [[[4, -82], [-20, -84]], [[-8, -74], [-30, -62]], [[-16, -56], [-32, -40]]]) strokePts([a, b], 'rgba(120,115,105,0.5)', 1.1);
        X.earPaint(-8, -44);
        strokePts([[28, -64], [36, -50]], 'rgba(120,70,50,0.35)', 1.2); dot(36, -38, 3, 'rgba(150,80,60,0.35)');     // nez fort
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        strokePts([[4, -58], [0, -56]], 'rgba(110,70,50,0.5)', 1); strokePts([[6, -46], [1, -44]], 'rgba(110,70,50,0.5)', 1);
        X.eye(f, 18, -52); fillPts([[8, -62], [16, -66], [27, -63], [26, -59], [16, -61], [9, -58]], PA.barbe);     // sourcils broussailleux blancs
        if (f.brow === 'up') fillPts([[8, -67], [16, -71], [27, -68], [26, -64], [16, -66], [9, -63]], PA.barbe);
      } },
      barbe: { parent: 'head', at: [0, 0], noRivet: true, base: PA.barbe, seed: 8107,
        pts: [[-10, -40], [2, -40], [16, -36], [26, -24], [35, -20], [38, -6], [36, 8], [29, 20], [20, 27, 1], [10, 20], [0, 8], [-8, -6], [-13, -24]],
        paint: (p) => {
          for (let i = 0; i < 7; i++) strokePts([[-6 + i * 5, -22 + i], [-1 + i * 4.6, 2 + i * 2], [4 + i * 3.4, 18 + i]], 'rgba(120,116,108,0.5)', 1);
          const f = p.face || {};
          fillPts([[40, -31], [33, -24], [22, -24], [14, -28], [22, -34], [34, -36]], PA.barbeD);
          if (f.mouth === 'o') fillPts(ell(30, -18, 5, 7, 10), '#3a1714', 0, 0); else if (f.mouth === 'smile') strokePts([[34, -20], [28, -18], [22, -21]], 'rgba(110,40,38,0.8)', 1.5); else strokePts([[34, -20], [24, -19]], 'rgba(110,40,38,0.7)', 1.4);
          shade(40, 0, -10, 0, 0.18, [-20, -45, 45, 90]);
        } },
      camauro: { parent: 'head', at: [0, 0], noRivet: true, base: '#f6f3ec', seed: 8108,                 // calotte (zucchetto) blanche
        pts: [[16, -90], [8, -98], [-6, -102], [-20, -99], [-29, -91], [-31, -84], [-16, -88], [0, -89]],
        paint: () => { strokePts([[10, -94], [-6, -99], [-22, -95]], 'rgba(255,255,255,0.8)', 1.4); hatch(null, 0.8, 3.4, 0.12); },
        extra: () => { dot(-7, -103, 2.6, '#e8e4da'); } },
      hermine: { parent: 'head', at: [0, 0], noRivet: true, base: PA.herm, seed: 8109, pts: OFFP, ptsAncien: [[31, -70], [29, -82], [16, -81], [0, -77], [-20, -71], [-38, -65], [-48, -61], [-46, -50], [-34, -51], [-18, -57], [2, -63], [18, -67]],
        paint: () => {} },
      armF_up: upDef([-2, -146], PA.rouge, 8110, () => { hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28); fillPts(box(-16, 54, 16, 100), PA.sout); strokePts([[-14, 54], [14, 54]], PA.rougeD, 2); }),
      armF_lo: foreDef('armF_up', PA.sout, PA.peau, false, 8111, () => { fillPts(box(-16, 56, 16, 78), PA.soutL); for (let x = -12; x < 16; x += 5) dot(x, 77, 2.2, '#f8f4ea'); }),
    };
    Object.assign(parts, heldParts(PA.peau, 8120));
    return { nom: 'pape', hipY: -238, handLen: HL, rod: { part: 'torso', at: [-26, 18] }, parts, lecture: [66, -96],
      order: ['armB_up', 'armB_lo', 'souB', 'souF', 'head', 'camauro', 'hermine', 'torso', 'barbe', 'objetB', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.lucPape = mkPape();
  // gestes du pape : lit, designe (+ cible), arrache (+ cible ; tenu 'liasse' une fois saisie), lance, satisfait, baille, marche (glissée), parle
  LUC.papePose = function (p, x, y, s, dir) {
    const def = CH.lucPape, q = prep(p), A = q.ang; dir = dir || 1;
    commun(q, { glisse: true });
    lecture(def, q, x, y, s, dir);
    const de = ease(clamp(q.designe || 0));
    if (de > 0 && q.cible) {
      const S = loc(def, q, x, y, s, dir, 'torso', [-2, -146]), vx = q.cible[0] - S[0], vy = q.cible[1] - S[1], l = Math.hypot(vx, vy) || 1, R = 180 * s;
      reach(def, q, x, y, s, dir, 'armF', [S[0] + vx / l * Math.min(l, R), S[1] + vy / l * Math.min(l, R)], de); if (de > 0.4) q.handF = 'open'; A.head = (A.head || 0) - 0.1 * de;
    }
    const ar = clamp(q.arrache || 0);
    if (ar > 0 && q.cible) {
      const a = ease(clamp(ar * 2)), b = ease(clamp(ar * 2 - 1));
      const eL = has(q.tenu) && q.tenu === 'liasse' ? (q.tenuO.echelle || 1) : 0.5;
      const C1 = loc(def, q, x, y, s, dir, 'torso', [40 + 116 * eL, -112]), C2 = loc(def, q, x, y, s, dir, 'torso', [80, -96]);
      reach(def, q, x, y, s, dir, 'armF', [lerp(q.cible[0], C1[0], b), lerp(q.cible[1], C1[1], b)], a);
      if (!has(q.tenu)) reach(def, q, x, y, s, dir, 'armB', [lerp(q.cible[0] - dir * 34 * s, C2[0], b), lerp(q.cible[1] + 20 * s, C2[1], b)], a);
      else { q.deuxMains = true; if (q.deuxK == null) q.deuxK = a; }
      q.handF = q.handB = 'fist'; A.head = (A.head || 0) + 0.08 * a - 0.1 * b; faceSet(q, { brow: 'frown', mouth: 'tight' });
      q.tilt += -0.04 * b;
    } else if (has(q.tenu) && q.tenu === 'liasse') {
      q.deuxMains = true;
      if (p.ang == null || p.ang.armF_up == null) reach(def, q, x, y, s, dir, 'armF', loc(def, q, x, y, s, dir, 'torso', [40 + 116 * (q.tenuO.echelle || 1), -112]), 1);
    }
    const la = ease(clamp(q.lance || 0));
    if (la > 0) {
      blend(q, 'armF_up', -2.62, la); blend(q, 'armF_lo', -0.3, la); blend(q, 'armB_up', -2.9, la); blend(q, 'armB_lo', -0.2, la);
      A.head = (A.head || 0) - 0.3 * la; q.tilt -= 0.05 * la; faceSet(q, { mouth: 'smile', brow: 'up' });
      if (la > 0.62) { q.tenu = 'rien'; q.deuxMains = false; q.handF = q.handB = 'open'; }
    }
    const sa = ease(clamp(q.satisfait || 0));
    if (sa > 0) {
      reach(def, q, x, y, s, dir, 'armF', loc(def, q, x, y, s, dir, 'torso', [44, -104]), sa); q.handF = 'open';
      blend(q, 'armB_up', -0.35, sa); blend(q, 'armB_lo', -1.1, sa);
      A.head = (A.head || 0) - 0.18 * sa; faceSet(q, { mouth: 'smile', eyes: sa > 0.6 ? 'half' : 'open' });
    }
    const ba = ease(clamp(q.baille || 0));
    if (ba > 0) { blend(q, 'armF_up', -2.35, ba); blend(q, 'armF_lo', -0.25, ba); blend(q, 'armB_up', -3.05, ba); blend(q, 'armB_lo', -0.05, ba); A.head = (A.head || 0) - 0.28 * ba; if (ba > 0.4) { q.face.mouth = 'o'; q.face.eyes = 'closed'; } q.handF = q.handB = 'open'; }
    finish(def, q, x, y, s, dir);
    return q;
  };
  LUC.pape = function (pose, x, y, s, o) { o = o || {}; s = s == null ? 0.92 : s; return run(CH.lucPape, LUC.papePose(pose, x, y, s, o.dir || 1), x, y, s, o, 'pape'); };

  // =====================================================================
  // MAÎTRE ANSELME — bourgeois de 1582 : rond, barbe brune en pointe + moustache, béguin blanc noué sous le menton,
  //   robe de chambre fourrée bordeaux à revers de fourrure brune, petite fraise blanche, chausses brunes, mules vertes.
  // =====================================================================
  const AN = { peau: '#e8bfa0', peauD: '#c99c7c', robe: '#6e2430', robeD: '#561a24', robeL: '#86343f', four: '#7a5232', fourD: '#5a3a22', fourL: '#9a7048',
    chem: '#f2ede2', beg: '#f4f0e6', begD: '#d6cebe', barbe: '#4a2f1e', barbeL: '#6a4630', chausse: '#4f4034', chausseD: '#3d3128', mule: '#3f6a3a', muleD: '#2e4f2c', or: '#c9a046' };
  const AN_TORSO = [[-14, -176], [8, -180], [18, -168], [30, -150], [46, -122], [60, -90], [68, -52], [68, -16], [60, 14], [54, 40], [54, 100], [57, 176, 1], [-50, 178, 1], [-48, 100], [-46, 30], [-46, -30], [-44, -100], [-40, -150], [-28, -168]];
  const AN_HEAD = [[-15, 16], [12, 16], [14, 2], [20, -4], [28, -10], [31, -16], [30, -22], [32, -26], [31, -30], [34, -34], [39, -39, 1], [35, -46], [31, -56], [31, -64], [28, -80], [15, -95], [-6, -100], [-26, -90], [-35, -70], [-34, -46], [-26, -26], [-18, -6]];
  function anMule(back) {
    fillPts([[-22, 214], [20, 212], [48, 226], [52, 236, 1], [-20, 238, 1]], back ? AN.muleD : AN.mule);
    fillPts([[-22, 228], [52, 230], [52, 238, 1], [-22, 238, 1]], '#2a2018');
    if (!back) { strokePts([[6, 218], [40, 226]], 'rgba(220,255,210,0.35)', 1.4); dot(30, 222, 2.4, AN.or); }
  }
  function mkAnselme() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: AN_TORSO, base: AN.robe, seed: 8201, paint: () => {
        for (let i = -6; i < 14; i++) strokePts([[-60 + i * 12, -170], [-60 + i * 12 + 60, 178]], 'rgba(40,8,14,0.22)', 1);   // matelassé (une seule direction)
        for (let y = -150; y < 170; y += 24) for (let x = -40; x < 50; x += 24) dot(x + ((y / 24) % 2) * 12, y, 1.6, 'rgba(220,160,150,0.35)');
        fillPts([[8, -178], [20, -170], [26, -150], [16, -136], [6, -158]], AN.chem);                                // chemise
        const rev = [[18, -166], [32, -150], [48, -122], [62, -88], [70, -52], [70, -16], [62, 14], [56, 40], [56, 100], [59, 178, 1], [44, 178, 1], [42, 100], [42, 40], [48, 12], [55, -18], [55, -52], [48, -86], [34, -118], [20, -142], [12, -160]];
        fillPts(rev, AN.four); for (let y = -160; y < 176; y += 5) strokePts([[44 + Math.sin(y) * 2 + (y < -90 ? (y + 160) * 0.3 - 26 : 0), y], [52 + (y < -90 ? (y + 160) * 0.3 - 26 : 0), y + 3]], 'rgba(40,20,8,0.5)', 1);
        fillPts([[-52, 160], [57, 158], [58, 180, 1], [-52, 180, 1]], AN.four); for (let x = -50; x < 58; x += 4) strokePts([[x, 160], [x + 2, 178]], 'rgba(40,20,8,0.45)', 1);
        fillPts([[-46, -12], [66, -14], [64, -2], [-46, 0]], AN.or); strokePts([[-44, -8], [64, -9]], 'rgba(255,240,190,0.6)', 1);   // cordelière
        hatch([[-52, -170], [-12, -170], [-10, 160], [-52, 160]], 0.75, 4.2, 0.32);
        shade(70, -40, -46, -40, 0.32, [-60, -190, 80, 190]);
      } },
      gland: { parent: 'torso', at: [58, -6], noRivet: true, base: AN.or, seed: 8202, pts: [[-3, 0], [3, 0], [4, 30], [8, 46, 1], [-8, 46, 1], [-4, 30]], paint: () => { for (let x = -6; x <= 6; x += 3) strokePts([[x, 34], [x, 46]], '#8a6a2a', 1); } },
      legB: legDef([-6, -2], AN.chausseD, 8203, true, 0.95, anMule),
      legF: legDef([6, -2], AN.chausse, 8204, false, 0.95, anMule),
      armB_up: upDef([-12, -146], AN.robeD, 8205),
      armB_lo: foreDef('armB_up', AN.robeD, AN.peauD, true, 8206, () => fillPts(box(-17, 54, 17, 78), AN.fourD)),
      head: { parent: 'torso', at: [6, -172], pts: AN_HEAD, base: AN.peau, seed: 8207, noRivet: true, paint: (p) => {
        const f = p.face || {};
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        dot(16, -30, 11, `rgba(214,110,100,${f.joues ? 0.6 : 0.35})`);
        if (f.joues) fillPts(ell(22, -26, 13, 11, 12), 'rgba(236,170,150,0.9)');
        X.eye(f, 18, -54); X.brow(f, 18, -62, AN.barbe, 3); strokePts([[32, -48], [36, -40]], 'rgba(120,60,40,0.4)', 1.2);
      } },
      beguin: { parent: 'head', at: [0, 0], noRivet: true, base: AN.beg, seed: 8208,
        pts: [[27, -77], [19, -94], [0, -105], [-22, -103], [-38, -88], [-44, -62], [-42, -36], [-32, -14], [-18, -2], [-8, 2], [-6, -10], [-14, -28], [-14, -48], [-4, -64], [12, -74]],
        paint: () => { strokePts([[24, -80], [4, -96], [-22, -98], [-38, -80]], 'rgba(160,150,130,0.6)', 1.2); strokePts([[-12, -60], [-30, -40], [-26, -14]], 'rgba(160,150,130,0.5)', 1.2); for (let i = 0; i < 7; i++) strokePts([[-30 + i * 8, -104 + Math.abs(i - 3) * 2], [-28 + i * 8, -88]], 'rgba(170,160,140,0.5)', 1); hatch(null, 0.9, 4, 0.12); } },
      ruche: { parent: 'head', at: [0, 0], noRivet: true, base: '#fbf8f0', seed: 8215,
        pts: (() => { const line = [[30, -76], [22, -70], [8, -66], [-6, -60], [-14, -46], [-16, -30], [-10, -12], [-4, 0]], o = []; line.forEach((p, i) => o.push([p[0] + (i % 2 ? 6 : 9), p[1] - (i % 2 ? 3 : 6)])); return o.concat(line.slice().reverse().map((p) => [p[0] - 2, p[1] + 2])); })(),
        paint: () => { for (const [x, y] of [[26, -72], [14, -66], [0, -60], [-10, -48], [-12, -32], [-6, -14]]) strokePts(ep(x, y, 4, 4, 6, 0, PI), 'rgba(150,140,120,0.6)', 1); } },
        pompon: { parent: 'head', at: [-8, -104], noRivet: true, base: '#fbf8f0', seed: 8216, pts: ell(0, 0, 9, 8, 12), paint: () => hatch(null, 0.5, 2.6, 0.2) },
      fraise: { parent: 'torso', at: [8, -170], noRivet: true, base: '#f7f4ec', seed: 8209,
        pts: (() => { const o = []; for (let i = 0; i <= 18; i++) { const a = PI + i / 18 * PI, r = i % 2 ? 26 : 30; o.push([Math.cos(a) * r, Math.sin(a) * 9 * (r / 30) + 2]); } for (let i = 0; i <= 18; i++) { const a = i / 18 * PI, r = i % 2 ? 26 : 30; o.push([Math.cos(a) * r, 2 + Math.sin(a) * 10 * (r / 30)]); } return o; })(),
        paint: () => { for (let x = -26; x <= 26; x += 5) strokePts([[x, -6], [x * 1.05, 10]], 'rgba(150,140,120,0.55)', 1); } },
      barbe: { parent: 'head', at: [0, 0], noRivet: true, base: AN.barbe, seed: 8210,
        pts: [[-6, -36], [8, -26], [22, -20], [32, -18], [37, -6], [34, 8], [27, 24, 1], [18, 12], [6, 6], [-6, -4], [-10, -20]],
        paint: (p) => {
          for (let i = 0; i < 6; i++) strokePts([[-4 + i * 6, -20], [6 + i * 4, 4], [18 + i * 2, 18]], 'rgba(150,100,70,0.5)', 1);
          const f = p.face || {};
          if (f.mouth === 'O') fillPts(ell(29, -22, 7, 9, 12), '#3a1714', 0, 0); else if (f.mouth === 'o') fillPts(ell(30, -21, 4, 5, 10), '#3a1714', 0, 0); else if (f.mouth === 'smile') strokePts([[33, -22], [27, -19], [21, -22]], 'rgba(120,40,38,0.9)', 1.5); else strokePts([[33, -21], [22, -20]], 'rgba(120,40,38,0.8)', 1.4);
        } },
      moustache: { parent: 'head', at: [0, 0], noRivet: true, base: AN.barbeL, seed: 8211,
        pts: [[38, -31], [34, -26], [24, -27], [14, -24], [8, -28], [14, -33], [26, -35], [34, -36]], paint: () => strokePts([[14, -30], [26, -32], [36, -33]], 'rgba(200,150,110,0.6)', 1) },
      lien: { parent: 'head', at: [0, 0], noRivet: true, base: AN.beg, seed: 8212,
        pts: [[-10, -2], [-4, -2], [6, 12], [14, 14], [20, 8], [24, 16], [18, 22], [10, 20], [2, 22], [-2, 30], [-6, 22], [-2, 14]] },
      armF_up: upDef([-2, -146], AN.robe, 8213),
      armF_lo: foreDef('armF_up', AN.robe, AN.peau, false, 8214, () => { fillPts(box(-17, 52, 17, 78), AN.four); for (let x = -15; x < 17; x += 4) strokePts([[x, 54], [x + 1, 76]], 'rgba(40,20,8,0.45)', 1); }),
    };
    Object.assign(parts, heldParts(AN.peau, 8220));
    return { nom: 'anselme', hipY: -238, handLen: HL, rod: { part: 'torso', at: [-26, 18] }, parts, lecture: [86, -108],
      corps: { front: [[0, 64], [-30, 70], [-60, 68], [-90, 60], [-122, 46], [-150, 30]], back: -46 },
      order: ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'beguin', 'ruche', 'pompon', 'torso', 'gland', 'fraise', 'barbe', 'moustache', 'lien', 'objetB', 'armF_up', 'armF_lo', 'objet', 'doigts', 'doigtsB'] };
  }
  CH.lucAnselme = mkAnselme();
  // au lit : couche 0..1 (allongé sur le dos, pivot à la hanche), assis 0..1 (buste relevé, jambes à l'horizontale) ; jambes masquées
  function litQ(q) {
    const c = clamp(q.couche || 0), a = clamp(q.assis || 0); if (!(c > 0 || a > 0)) return;
    const th = -PI / 2 * c * (1 - a), lg = -PI / 2 * a;
    q.tilt += th; q.dx += -238 * Math.sin(th); q.dy += 238 * (1 - Math.cos(th));
    q.ang.legF = (q.ang.legF || 0) + lg; q.ang.legB = (q.ang.legB || 0) + lg;
    q.hide.legF = 1; q.hide.legB = 1; q.hide.gland = 1; q._auLit = true;
    if (c > 0.5 && a < 0.3 && !q.face.eyes) q.face.eyes = 'closed';
  }
  // gestes d'Anselme : souffle (bougie du bougeoir tenu), baille (bras en V), lit, salut (s'incline), marche, parle ; au lit (LUC.anselmeLit) : couche, assis
  LUC.anselmePose = function (p, x, y, s, dir) {
    const def = CH.lucAnselme, q = prep(p), A = q.ang; dir = dir || 1;
    commun(q);
    litQ(q);
    lecture(def, q, x, y, s, dir);
    if (q.tenu === 'bougeoir' && q.tenuO.echelle == null) q.tenuO.echelle = 0.8;
    const so = ease(clamp(q.souffle || 0));
    if (q.tenu === 'bougeoir' && !(so > 0) && A.armF_up == null && A.armF_lo == null) { A.armF_up = -0.42; A.armF_lo = -1.2; }
    if (so > 0) {
      if (!has(q.tenu)) q.tenu = 'bougeoir';
      if (q.tenuO.echelle == null) q.tenuO.echelle = 0.8;
      reach(def, q, x, y, s, dir, 'armF', loc(def, q, x, y, s, dir, 'head', [24, 68]), so);
      if (q.tenuO.vent == null) q.tenuO.vent = 0.9 * so;
      if (so > 0.3) { q.face.mouth = 'o'; q.face.joues = true; }
    }
    const ba = ease(clamp(q.baille || 0));
    if (ba > 0) { blend(q, 'armF_up', -2.35, ba); blend(q, 'armF_lo', -0.25, ba); blend(q, 'armB_up', -3.05, ba); blend(q, 'armB_lo', -0.05, ba); A.head = (A.head || 0) - 0.3 * ba; if (ba > 0.35) { q.face.mouth = 'O'; q.face.eyes = 'closed'; } q.handF = q.handB = 'open'; }
    const sl = ease(clamp(q.salut || 0));
    if (sl > 0) { plier(q, 0.32 * sl); A.head = (A.head || 0) + 0.22 * sl; blend(q, 'armF_up', -0.3, sl); blend(q, 'armF_lo', -1.45, sl); blend(q, 'armB_up', 0.12, sl); }
    if (!q.face.mouth && q.couche > 0.5 && !(q.assis > 0.3)) q.face.mouth = 'n';
    finish(def, q, x, y, s, dir);
    return q;
  };
  LUC.anselme = function (pose, x, y, s, o) { o = o || {}; s = s == null ? 0.9 : s; return run(CH.lucAnselme, LUC.anselmePose(pose, x, y, s, o.dir || 1), x, y, s, o, 'anselme'); };
  // Anselme dans le lit à baldaquin de changementheure.js (HDH.litFond / HDH.litDevant) : (x,y) = sol au milieu du lit ; s 0,9 (défaut, comme debout)
  //   o.pose (couche défaut 1, assis 0..1, baille, face…), o.dir (1 = tête du lit à gauche), o.couv 0..1 (édredon sur le buste ; défaut 0,82 couché → 0,1 assis),
  //   o.fond / o.devant (false = sauter une couche du lit), o.cast, o.castPerso. Renvoie r (r.q, r.dessus).
  LUC.anselmeLit = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s; const dir = o.dir || 1, HDH = M.hdh, G = HDH.LIT.baldaquin, c = cx_(), def = CH.lucAnselme;
    const pose = Object.assign({ t }, o.pose || {}); if (pose.couche == null) pose.couche = 1;
    const hx = x + dir * s * (G.hanche[0] - 150 * smooth(0, 1, clamp(pose.assis || 0))), hy = y + s * G.hanche[1], fy = hy + 238 * s;
    const q = LUC.anselmePose(pose, hx, fy, s, dir);
    if (o.fond !== false) HDH.litFond(t, x, y, s, { style: 'baldaquin', dir, cast: o.cast });
    c.save(); c.beginPath(); c.rect(-5000, -5000, 10000, 5000 + y - 150 * s); c.clip();          // rien sous le matelas (bas de la robe quand il est assis)
    const r = run(def, q, hx, fy, s, { dir, rod: false, floorShadow: false, cast: o.castPerso }, 'anselme');
    c.restore();
    const a = clamp(q.assis || 0), couv = o.couv == null ? lerp(0.82, 0.1, smooth(0, 0.7, a)) : o.couv;
    // dessus de la couverture : jambes (du pied à la hanche) puis buste jusqu'à la hauteur couv
    const m = r.mats, mg = 9 * s, top = [];
    const hi = (mm, A2, B2) => { const P1 = M.wpt(mm, A2[0], A2[1]), P2 = M.wpt(mm, B2[0], B2[1]); const Q = P1[1] < P2[1] ? P1 : P2; return [Q[0], Q[1] - mg]; };
    for (const ly of [234, 200, 150, 100, 50, 8]) top.push(hi(m.legF, [24, ly], [-22, ly]));
    const F = def.corps.front, n = F.length - 1, cv = clamp(couv) * n;
    for (let i = 0; i <= n; i++) {
      if (i > cv + 1e-6) { const A0 = F[i - 1], B0 = F[i], f = cv - (i - 1); top.push(hi(m.torso, [lerp(A0[1], B0[1], f), lerp(A0[0], B0[0], f)], [def.corps.back, lerp(A0[0], B0[0], f)])); break; }
      top.push(hi(m.torso, [F[i][1], F[i][0]], [def.corps.back, F[i][0]]));
    }
    const G0 = y + G.mat[0] * s; for (const p2 of top) p2[1] = Math.min(p2[1], G0 - 6 * s);
    if (o.devant !== false) HDH.litDevant(t, x, y, s, { style: 'baldaquin', dir, dessus: top, cast: o.cast });
    if (a > 0.3 || q.baille > 0 || has(q.tenu)) {
      const hide = {}; for (const nme in def.parts) if (['armF_up', 'armF_lo', 'objet', 'doigts'].indexOf(nme) < 0) hide[nme] = 1;
      M.puppet(def, Object.assign({}, q, { hide }), hx, fy, s, { dir, rod: false, floorShadow: false, nom: 'anselme' });
    }
    r.dessus = top; return r;
  };

  // =====================================================================
  // LE PAYSAN de reblochon.js (C.paysan, inchangé) avec l'almanach : LUC.paysan(pose, x, y, s, o)
  //   pose : pose de C.paysan (REB.marche…) + lit 0..1 (almanach ouvert à deux mains, bas devant la poitrine), ouvert (0..1, défaut 1),
  //   echelle (défaut 0,9). Le livre est dessiné par-dessus les bras, les doigts par-dessus le livre.
  // =====================================================================
  LUC.paysan = function (pose, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s; const dir = o.dir || 1, def = CH.paysan, c = cx_();
    const q = prep(pose), k = ease(clamp(q.lit || 0));
    const oo = { ouvert: q.ouvert == null ? 1 : q.ouvert, _deux: true, echelle: q.echelle || 0.9, t: q.t || 0 }, ob = OBJ.almanach, g = ob.grip(oo), e = oo.echelle, p2 = ob.p2(oo);
    if (k > 0) {
      const C = [84, -106];
      reach(def, q, x, y, s, dir, 'armF', loc(def, q, x, y, s, dir, 'torso', [C[0] + g[0] * e, C[1] + g[1] * e]), k);
      q.handF = 'fist';
      const mm = mats(def, q, x, y, s, dir).armF_lo, H = M.wpt(mm, 4, 96);
      const T = [H[0] + dir * s * (p2[0] - g[0]) * e, H[1] + s * (p2[1] - g[1]) * e];
      reach(def, q, x, y, s, dir, 'armB', T, 1); q.handB = 'fist';
      q.ang.head = (q.ang.head || 0) + 0.14 * k;
    }
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF, nom: 'paysan' }, o));
    if (k > 0) {
      const H = r.w('armF_lo', 4, 96), HB = r.w('armB_lo', 4, 96);
      accDraw('almPaysan', (w) => { const cc = cx_(); cc.save(); cc.scale(w.e, w.e); cc.translate(-w.g[0], -w.g[1]); drawAlmanach(w.oo); cc.restore(); }, H[0], H[1], s, { dir, e, g, oo });
      for (const P2 of [H, HB]) accDraw('doigtsPaysan', () => pc(DOIGTS, '#D9A57A', doigtsPaint, 8301), P2[0], P2[1], s, { dir });
    }
    r.q = q; return r;
  };

  // =====================================================================
  // 5) LA PUCE — marionnette à fil (pas de tige au sol) : corps ovale brun-rouge, gros œil rond, deux antennes, 6 pattes
  //   (pattes arrière très longues : cuisse + jambe rivetées). (x,y) = sous les pattes ; regarde vers +x ; ≈ 142 px de long à s 1.
  //   def.libre : ses pattes ne suivent pas la convention humaine (aucun nom armF/legF ; dispense déclarée pour la forme).
  // =====================================================================
  const PU = { corps: '#7a3a24', corpsD: '#5a2716', corpsL: '#a8603a', ocre: '#c08a4a', patte: '#5e2c1a', patteD: '#3f1d10', oeil: '#f4efe2' };
  const PU_CORPS = [[52, -8], [46, -22], [30, -30], [6, -34], [-20, -34], [-44, -26], [-60, -10], [-64, 8], [-56, 26], [-36, 36], [-8, 38], [20, 34], [40, 24], [52, 10]];
  const PU_TETE = [[-4, -16], [10, -24], [24, -22], [34, -12], [38, 0], [34, 10], [24, 16], [8, 16], [-4, 10]];
  const tib = (L) => [[-3, -3], [3, -3], [3.5, L * 0.6], [3, L - 6], [10, L - 3], [16, L, 1], [12, L + 3], [1, L + 2], [-3, L * 0.6]];
  function pucePatte(parent, at, L, col, seed, back) { return { parent, at, pts: tib(L), base: col, seed, noRivet: !!back, paint: () => hatch(null, 0.6, 3, 0.2) }; }
  function mkPuce() {
    const parts = {
      pAvB: pucePatte('corps', [38, 14], 42, PU.patteD, 9001, true), pMiB: pucePatte('corps', [16, 22], 44, PU.patteD, 9002, true),
      cuisseB: { parent: 'corps', at: [-28, 12], pts: [[-8, -6], [8, -6], [11, 28], [6, 56], [-6, 56], [-10, 28]], base: PU.corpsD, seed: 9003, noRivet: true, rest: -2.3 },
      jambeB: Object.assign(pucePatte('cuisseB', [0, 52], 66, PU.patteD, 9004, true), { rest: 2.82 }),
      corps: { parent: null, at: [0, 0], pts: PU_CORPS, base: PU.corps, seed: 9005, paint: () => {
        for (const x of [-44, -26, -8, 10, 28]) strokePts(ep(x, 2, 6, 34, 8, -PI / 2, PI / 2), 'rgba(40,12,4,0.5)', 1.2);
        strokePts([[-50, -18], [-24, -28], [6, -30], [30, -24]], 'rgba(230,170,110,0.75)', 2.4);             // reflet ocre
        for (let i = 0; i < 9; i++) { const x = -52 + i * 11; strokePts([[x, -30 + Math.abs(x) * 0.08], [x - 4, -38 + Math.abs(x) * 0.08]], PU.patteD, 1.1); }   // soies
        hatch(null, 0.8, 3.4, 0.25, 1, undefined, [-70, -40, 60, 40]); shade(0, -30, 0, 36, 0.3, [-70, -40, 60, 40]);
      } },
      tete: { parent: 'corps', at: [46, -6], pts: PU_TETE, base: PU.corpsL, seed: 9006, noRivet: true, paint: (p) => {
        const e = p.oeil || {};
        fillPts(ell(14, -3, 11.5, 11.5, 18), PU.oeil, 0, 0);
        let rx = (e.rx == null ? 2.5 : e.rx), ry = (e.ry == null ? 0 : e.ry);
        if (p.etourdi) { const a = (p.t || 0) * 9; rx = Math.cos(a) * 5; ry = Math.sin(a) * 5; }
        dot(14 + rx, -3 + ry, 5.2, '#1c1410'); dot(12 + rx, -5 + ry, 1.6, '#ffffff');
        if (p.etourdi) strokePts(ep(14, -3, 8, 8, 14, (p.t || 0) * 6, (p.t || 0) * 6 + PI * 1.4), 'rgba(40,20,10,0.6)', 1);
        const lid = clamp(e.lid || 0);
        if (lid > 0.02) { const cut = -14.5 + 23 * lid, pts = ell(14, -3, 12, 12, 24).filter((q) => q[1] <= cut); if (pts.length > 2) { pts.push([pts[pts.length - 1][0], cut], [pts[0][0], cut]); fillPts(pts, PU.corpsL, 0, 0); strokePts([[3, cut], [25, cut]], '#3a1a0c', 1.6); } }
        strokePts(ell(14, -3, 11.5, 11.5, 18).concat([[25.5, -3]]), '#3a1a0c', 1.4);
        if (e.sourcil) strokePts(e.sourcil === 'fier' ? [[4, -18], [14, -21], [24, -17]] : e.sourcil === 'colere' ? [[4, -20], [14, -17], [24, -13]] : [[4, -16], [14, -22], [24, -20]], '#2a1208', 2);
        const b = p.bouche || 'n';
        if (b === 'o') fillPts(ell(30, 9, 3.4, 4.2, 10), '#2a0e08', 0, 0); else if (b === 'smile') strokePts([[34, 7], [30, 10], [25, 8]], '#2a0e08', 1.4); else strokePts([[34, 8], [27, 9]], '#2a0e08', 1.2);
        strokePts([[36, 6], [44, 18]], PU.patteD, 1.6);                                                    // trompe
      } },
      antB: { parent: 'tete', at: [16, -20], pts: [[-1.5, 0], [1.5, 0], [3, -26], [7, -36], [3, -38], [-1, -27]], base: PU.patteD, seed: 9007, noRivet: true, rest: 0.25 },
      antF: { parent: 'tete', at: [22, -20], pts: [[-1.5, 0], [1.5, 0], [3, -26], [8, -36], [4, -38], [-1, -27]], base: PU.patte, seed: 9008, noRivet: true, rest: 0.45 },
      pAv: pucePatte('corps', [42, 18], 42, PU.patte, 9009, false), pMi: pucePatte('corps', [20, 24], 44, PU.patte, 9010, false),
      cuisse: { parent: 'corps', at: [-24, 14], pts: [[-9, -6], [9, -6], [12, 28], [7, 56], [-7, 56], [-11, 28]], base: PU.corpsL, seed: 9011, rest: -2.3, paint: () => { strokePts([[-6, 0], [-4, 50]], 'rgba(255,210,160,0.5)', 1.6); hatch(null, 0.6, 3, 0.25); } },
      jambe: Object.assign(pucePatte('cuisse', [0, 52], 66, PU.patte, 9012, false), { rest: 2.82 }),
    };
    return { nom: 'puce', hipY: -50, handLen: 0, rod: null, parts, libre: { armF: 1, armB: 1, legF: 1, legB: 1 },
      order: ['antB', 'pAvB', 'pMiB', 'cuisseB', 'jambeB', 'corps', 'tete', 'antF', 'pMi', 'pAv', 'cuisse', 'jambe'] };
  }
  CH.lucPuce = mkPuce();
  // poses (angles AJOUTÉS au repos) ; u = avancement du saut 0..1
  function pucePose(o) {
    const t = o.t || 0, nm = o.pose || 'assise', A = {}, q = { t, ang: A, tilt: 0, dy: 0, dx: 0, oeil: Object.assign({}, o.oeil), bouche: o.bouche };
    const set = (v) => Object.assign(A, v);
    if (nm === 'assise' || nm === 'dort') { set({ pAv: -0.55, pAvB: -0.35, pMi: 0.15, pMiB: 0.3, cuisse: 0.05, jambe: 0, cuisseB: 0.1, jambeB: 0, antF: 0, antB: 0 }); q.tilt = -0.14; q.dy = 6; }
    if (nm === 'prete') { set({ pAv: -0.25, pAvB: -0.1, pMi: 0.35, pMiB: 0.5, cuisse: -0.25, jambe: 0.2, cuisseB: -0.2, jambeB: 0.2, antF: -0.3, antB: -0.25 }); q.tilt = 0.12; q.dy = 14; }
    if (nm === 'fiere') { set({ pAv: -1.5, pAvB: -1.1, pMi: 0.1, pMiB: 0.25, cuisse: 0.35, jambe: -0.2, cuisseB: 0.4, jambeB: -0.25, antF: -0.45, antB: -0.35 }); q.tilt = -0.46; q.dy = -6; q.oeil.sourcil = q.oeil.sourcil || 'fier'; q.oeil.lid = q.oeil.lid == null ? 0.35 : q.oeil.lid; if (!q.bouche) q.bouche = 'smile'; }
    if (nm === 'accrochee') {
      set({ pAv: -2.55, pAvB: -2.35, pMi: -2.0, pMiB: -1.8, cuisse: 1.2, jambe: -1.6, cuisseB: 1.35, jambeB: -1.7, antF: -0.5, antB: -0.4 });
      q.tilt = -0.35 + 0.05 * Math.sin(t * 7); q.oeil.sourcil = q.oeil.sourcil || 'colere'; q._accroche = true;
    }
    if (nm === 'saut') {
      const u = clamp(o.u || 0), a = smooth(0, 0.14, u), b = smooth(0.78, 1, u), mid = a * (1 - b);
      set({ pAv: lerp(-0.25, -1.3, mid) - 0.4 * b, pAvB: lerp(-0.1, -1.1, mid) - 0.4 * b, pMi: lerp(0.35, -0.6, mid), pMiB: lerp(0.5, -0.4, mid),
        cuisse: lerp(-0.25, 2.6, a) * (1 - b) + 0.1 * b, jambe: lerp(0.2, -2.3, a) * (1 - b), cuisseB: lerp(-0.2, 2.5, a) * (1 - b) + 0.1 * b, jambeB: lerp(0.2, -2.2, a) * (1 - b),
        antF: 0.5 * mid, antB: 0.45 * mid });
      q.dy = lerp(14, 0, a) + 6 * b; q.oeil.ry = q.oeil.ry == null ? -2 * mid : q.oeil.ry;
    }
    if (nm === 'dort') { q.oeil.lid = 1; A.antF = 0.5; A.antB = 0.4; q.dy += Math.sin(t * 1.6) * 1.5; q._dodeline = 0.12 + 0.1 * Math.sin(t * 1.5); }
    if (nm === 'etourdie') { set({ pAv: -0.2, pAvB: 0.1, pMi: 0.4, pMiB: 0.2, cuisse: 0.3, jambe: -0.3, cuisseB: 0.2, jambeB: -0.1, antF: 0.6 + 0.2 * Math.sin(t * 5), antB: 0.5 + 0.2 * Math.sin(t * 5 + 1) }); q.tilt = 0.08 * Math.sin(t * 5); q.etourdi = true; if (!q.bouche) q.bouche = 'o'; }
    if (q._dodeline) A.tete = (A.tete || 0) + q._dodeline;
    if (o.lid != null) q.oeil.lid = o.lid;
    if (o.regard) { q.oeil.rx = o.regard[0]; q.oeil.ry = o.regard[1]; }
    q.tilt += o.tilt || 0; q.dy += o.dy || 0;
    if (o.ang) for (const k in o.ang) A[k] = (A[k] || 0) + o.ang[k];
    if (nm !== 'dort' && nm !== 'accrochee') { A.antF = (A.antF || 0) + 0.06 * Math.sin(t * 3.1); A.antB = (A.antB || 0) + 0.06 * Math.sin(t * 2.7 + 1); }
    return q;
  }
  LUC.pucePose = pucePose;
  // LUC.puce(t, x, y, s, o) : o.pose 'assise'|'prete'|'saut'|'fiere'|'accrochee'|'dort'|'etourdie' ; o.u (saut) ; o.dir ; o.lid 0..1 ; o.regard [dx,dy] (px, ±5) ;
  //   o.bouche 'n'|'o'|'smile' ; o.oeil {sourcil:'fier'|'colere'|'surpris'} ; o.tilt (rad) ; o.fil (true : fil noir jusqu'aux cintres) ; o.filX (x du haut du fil) ; o.cast ; o.alpha
  //   Renvoie r (r.dos = attache du fil, r.oeil, r.pinces = bout des pattes avant, r.pied = bout de la patte arrière).
  LUC.puce = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const dir = o.dir || 1, def = CH.lucPuce, q = pucePose(Object.assign({ t }, o)), c = cx_();
    if (q._accroche) {                                         // (x,y) = le bord saisi par les pattes avant
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const m0 = M.partMatrices(def, q, 0, 0, 1, 1).mats, T = M.wpt(m0.pAv, 14, 44); c.restore();
      const cs = Math.cos(q.tilt), sn = Math.sin(q.tilt); q.dx -= T[0] * cs + T[1] * sn; q.dy -= -T[0] * sn + T[1] * cs;
    }
    if (o.fil !== false && !SIL()) {
      const m = M.partMatrices(def, q, x, y, s, dir).mats, D0 = M.wpt(m.corps, -6, -32), fx = o.filX == null ? D0[0] + Math.sin(M.tg(t) * 0.8) * 6 : o.filX;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.strokeStyle = 'rgba(15,10,8,0.85)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(D0[0], D0[1]); c.lineTo(fx, 0); c.stroke(); c.restore();
    }
    const r = M.puppet(def, q, x, y, s, { dir, rod: false, floorShadow: o.ombre === true, cast: o.cast, alpha: o.alpha, nom: 'puce' });
    r.dos = r.w('corps', -6, -32); r.oeil = r.w('tete', 14, -3); r.pinces = r.w('pAv', 14, 44); r.pied = r.w('jambe', 14, 66); r.q = q;
    return r;
  };
  // saut le long d'un arc : de [x,y] → a [x,y], hauteur haut (px), durée dur (s), départ t0. Renvoie {x, y, u, vol, pose:{pose:'saut', u, tilt}}.
  //   avant t0 : posée au départ en 'prete' (0,3 s avant) ; après : posée à l'arrivée en 'assise'.
  LUC.sautPt = function (t, t0, dur, de, a, haut) {
    const u = clamp((t - t0) / (dur || 0.6)), h = haut == null ? 80 : haut;
    const x = lerp(de[0], a[0], u), y = lerp(de[1], a[1], u) - 4 * h * u * (1 - u);
    const dxu = a[0] - de[0], dyu = (a[1] - de[1]) - 4 * h * (1 - 2 * u), sg = dxu >= 0 ? 1 : -1;
    const vol = t >= t0 && t < t0 + (dur || 0.6);
    const pose = vol ? { pose: 'saut', u, tilt: 0.6 * Math.atan2(dyu, Math.abs(dxu) + 1e-3), dir: sg } : (t < t0 ? { pose: t > t0 - 0.3 ? 'prete' : 'assise', dir: sg } : { pose: 'assise', dir: sg });
    return { x, y, u, vol, pose };
  };

  // =====================================================================
  // 6) LA ROUE DES MOIS — bois peint, 12 secteurs à pictogrammes, crans dorés sur la jante, repères bougie (Sainte-Luce) et houx
  //   (jour le plus court) sur le bord du secteur de décembre ; moyeu fixe : médaillon d'or au profil de César lauré. Ø 560 (588 avec les crans) à s 1.
  // =====================================================================
  const RO = { R: 280, Rj: 248, Rh: 78, cran: 2.4 * PI / 180, nCrans: 150, aB: 243 * PI / 180 };
  RO.aH = RO.aB + 10 * RO.cran;
  const MOIS = [
    { c: '#3f5878', p: 'feu' }, { c: '#5b7290', p: 'flocon' }, { c: '#6e8a4c', p: 'vigne' }, { c: '#86a35c', p: 'fleurs' },
    { c: '#5a8a4c', p: 'oiseau' }, { c: '#b8a04a', p: 'moutons' }, { c: '#cf9e3a', p: 'faux' }, { c: '#c0842e', p: 'gerbe' },
    { c: '#7e3a5a', p: 'raisin' }, { c: '#a35a2e', p: 'semailles' }, { c: '#7a5a30', p: 'glands' }, { c: '#2c4260', p: 'sapin' }];
  const PIC_MOIS = {
    feu: () => { fillPts([[-30, 30], [30, 30], [26, 38], [-26, 38]], '#5a3a22'); fillPts([[-24, 26], [24, 20], [26, 28], [-22, 32]], '#7a5232'); fillPts([[-16, 22], [-8, -6], [0, 10], [6, -22], [14, 0], [20, 22]], '#e8862c'); fillPts([[-6, 22], [0, 4], [6, 22]], '#f7d050'); fillPts([[-40, -2], [-30, -4], [-28, 30], [-40, 30]], '#8a6a4a'); dot(-35, -12, 7, '#e6c3a6'); },
    flocon: () => PIC.flocon(), oiseau: () => PIC.oiseau(), sapin: () => PIC.sapin(),
    vigne: () => { strokePts([[0, 40], [-4, 10], [6, -10], [0, -30]], '#5a3a22', 6); strokePts([[-4, 10], [-26, 0]], '#5a3a22', 4); strokePts([[6, -10], [26, -18]], '#5a3a22', 4); strokePts(ep(30, -4, 12, 12, 10, PI, PI * 1.8), '#9a9aa0', 4); strokePts([[42, -4], [46, 20]], '#6a4428', 5); },
    fleurs: () => { for (const [x, y, c] of [[-20, -10, '#d84a6a'], [6, -24, '#e8c03a'], [24, -2, '#8a5ad0']]) { strokePts([[x, y], [x * 0.5, 40]], '#3f7a3a', 2.4); for (let i = 0; i < 5; i++) { const a = i * TAU / 5; dot(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6, c); } dot(x, y, 4, '#f6e6a0'); } },
    moutons: () => { for (const [x, y] of [[-14, 6], [18, -6]]) { fillPts(ell(x, y, 22, 14, 12), '#f2ede0'); for (let i = 0; i < 6; i++) dot(x - 16 + i * 6.5, y - 10 + (i % 2) * 3, 6, '#f2ede0'); fillPts(ell(x + 22, y - 4, 7, 6, 8), '#3a3030'); strokePts([[x - 10, y + 12], [x - 10, y + 24]], '#3a3030', 2.4); strokePts([[x + 10, y + 12], [x + 10, y + 24]], '#3a3030', 2.4); } },
    faux: () => { strokePts([[-30, 40], [20, -36]], '#7a5232', 5); fillPts([[20, -36], [-20, -40], [-40, -30], [-10, -32], [16, -28]], '#a8a8b0'); for (let x = -36; x < 40; x += 8) strokePts([[x, 44], [x + 3, 26]], '#c9a046', 2); },
    gerbe: () => { for (let i = -4; i <= 4; i++) { strokePts([[i * 2, 40], [i * 7, -20]], '#c99a2e', 2.4); fillPts(ell(i * 7, -26, 4, 9, 8), '#e0b040'); } fillPts(box(-14, 10, 14, 18), '#8a5a2a'); },
    raisin: () => { for (const [x, y] of [[-12, -16], [0, -16], [12, -16], [-6, -4], [6, -4], [-12, 8], [0, 8], [12, 8], [-6, 20], [6, 20], [0, 32]]) dot(x, y, 7, '#5a2a6a'); for (const [x, y] of [[-12, -18], [0, 6], [6, 18]]) dot(x - 2, y - 2, 2, '#c8a0e0'); fillPts([[0, -30], [20, -40], [30, -26], [12, -24]], '#4a8a3a'); },
    semailles: () => { fillPts([[-34, 8], [-10, -6], [6, -2], [8, 8], [-14, 18]], '#e0b090'); for (let i = 0; i < 9; i++) dot(14 + (i % 3) * 9, 14 + Math.floor(i / 3) * 9, 2.8, '#c99a2e'); fillPts(box(-40, 30, 40, 40), '#6a4a2a'); },
    glands: () => { picto('gland', -16, 0, 0.6); picto('gland', 16, 8, 0.6); },
  };
  function repereBougie() {                    // ≈ 56 × 124, pied en (0, 62), flamme en haut (y −62)
    raw((c) => { const g = c.createRadialGradient(0, -44, 2, 0, -44, 44); g.addColorStop(0, 'rgba(255,214,110,0.8)'); g.addColorStop(1, 'rgba(255,214,110,0)'); c.fillStyle = g; c.fillRect(-46, -90, 92, 92); });
    for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * 0.42; strokePts([[Math.cos(a) * 26, -44 + Math.sin(a) * 26], [Math.cos(a) * 38, -44 + Math.sin(a) * 38]], '#e0b040', 2.4); }
    fillPts([[-16, -24], [16, -24], [16, 50, 1], [-16, 50, 1]], '#c02a2a'); fillPts([[-16, -24], [-7, -24], [-7, 50, 1], [-16, 50, 1]], '#8a1a1c');
    fillPts([[-16, -24], [16, -24], [16, -18], [10, -15], [9, -2], [4, -2], [3, -15], [-16, -16]], '#f4eee2');
    strokePts([[0, -24], [0, -31]], '#2a2020', 2);
    fillPts([[0, -29], [10, -42], [6, -58], [0, -66], [-6, -58], [-10, -42]], '#e8862c'); fillPts([[0, -32], [5, -42], [2, -53], [0, -57], [-2, -53], [-5, -42]], '#f7d050');
    fillPts([[-28, 50], [28, 50], [22, 62], [-22, 62]], '#e0b040'); strokePts([[-24, 52], [24, 52]], 'rgba(255,245,200,0.9)', 1.4);
  }
  function repereHoux() {                      // ≈ 64 × 124, tige verticale
    strokePts([[0, 62], [0, -30]], '#3a5a2a', 3.4);
    const leaf = (sx, y, a) => { const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([u * 40, -(i % 2 ? 11 : 6) * Math.sin(PI * u)]); } for (let i = 6; i >= 0; i--) { const u = i / 6; pts.push([u * 40, (i % 2 ? 11 : 6) * Math.sin(PI * u)]); } return rot(pts, a, 0, 0).map((p) => [p[0] * sx, p[1] + y]); };
    fillPts(leaf(1, 30, -0.7), '#1f6a34'); fillPts(leaf(-1, 14, -0.7), '#24713a'); fillPts(leaf(1, -4, -0.9), '#2a7d3e'); fillPts(leaf(-1, -18, -0.9), '#1f6a34');
    for (const [sx, y, a] of [[1, 30, -0.7], [-1, 14, -0.7], [1, -4, -0.9], [-1, -18, -0.9]]) strokePts([[0, y], [sx * 32 * Math.cos(a), y + 32 * Math.sin(a)]], 'rgba(200,240,190,0.6)', 1.2);
    for (const [x, y] of [[-8, -40], [8, -40], [0, -54], [-12, -54], [12, -52]]) { dot(x, y, 8, '#c41e24'); dot(x - 2.5, y - 2.5, 2.4, '#f6b0a8'); }
  }
  LUC.repereBougie = repereBougie; LUC.repereHoux = repereHoux;
  function makeRoue() {
    const W = 640;
    const cv = M.cutFlat(W, W, W / 2, W / 2, (c) => {
      for (let k = 0; k < 12; k++) {
        const a0 = (-90 + 30 * k) * PI / 180, a1 = a0 + PI / 6;
        const pts = ep(0, 0, RO.Rj, RO.Rj, 10, a0, a1).concat(ep(0, 0, RO.Rh, RO.Rh, 4, a1, a0));
        pc(pts, MOIS[k].c, () => { hatch(null, 0.6 + k * 0.5, 5, 0.12, 1, undefined, [-300, -300, 300, 300]); shade(0, 0, Math.cos(a0 + 0.26) * 240, Math.sin(a0 + 0.26) * 240, 0.18, [-300, -300, 300, 300]); }, 9100 + k, { drop: false, texA: 0.5 });
        const am = a0 + PI / 12, rr = k === 11 ? 112 : 168, kk = k === 11 ? 0.42 : 0.72;
        c.save(); c.rotate(am + PI / 2); c.translate(0, -rr); c.scale(kk, kk);
        fillPts(ell(0, 0, 56, 56, 20), 'rgba(240,230,205,0.85)'); strokePts(ell(0, 0, 56, 56, 20).concat([[56, 0]]), 'rgba(170,130,60,0.8)', 1.4);
        PIC_MOIS[MOIS[k].p](); c.restore();
      }
      for (let k = 0; k < 12; k++) { const a = (-90 + 30 * k) * PI / 180; strokePts([[Math.cos(a) * RO.Rh, Math.sin(a) * RO.Rh], [Math.cos(a) * RO.Rj, Math.sin(a) * RO.Rj]], '#c9a046', 3); }
      // jante de bois + crans dorés
      pc(ep(0, 0, RO.R, RO.R, 72, 0, TAU).concat(ep(0, 0, RO.Rj, RO.Rj, 72, TAU, 0)), '#6a4428', () => {
        for (let i = 0; i < 60; i++) { const a = i * TAU / 60; strokePts([[Math.cos(a) * (RO.Rj + 4), Math.sin(a) * (RO.Rj + 4)], [Math.cos(a + 0.05) * (RO.R - 4), Math.sin(a + 0.05) * (RO.R - 4)]], 'rgba(30,15,5,0.35)', 1); }
        strokePts(ep(0, 0, RO.R - 6, RO.R - 6, 72, 0, TAU), 'rgba(255,220,170,0.25)', 1.6);
      }, 9120);
      for (let i = 0; i < RO.nCrans; i++) { const a = RO.aB + i * RO.cran, ca = Math.cos(a), sa = Math.sin(a), d = 0.012; fillPts([[Math.cos(a - d) * RO.R, Math.sin(a - d) * RO.R], [ca * (RO.R + 11), sa * (RO.R + 11)], [Math.cos(a + d) * RO.R, Math.sin(a + d) * RO.R]], '#c9a046', 0, 0); }
      strokePts(ep(0, 0, RO.Rh + 2, RO.Rh + 2, 30, 0, TAU), '#c9a046', 3);
      // repères du secteur de décembre (bord) : bougie et houx, le haut vers l'extérieur
      for (const [a, fn] of [[RO.aB, repereBougie], [RO.aH, repereHoux]]) { c.save(); c.rotate(a + PI / 2); c.translate(0, -184); fn(); c.restore(); }
    });
    return M.withShadow(cv, 8);
  }
  function makeMedaillon() {
    return M.withShadow(M.cutFlat(200, 200, 100, 100, (c) => {
      pc(ell(0, 0, 80, 80, 36), '#b8923e', () => { raw((cc) => { const g = cc.createRadialGradient(-24, -28, 4, 0, 0, 84); g.addColorStop(0, '#f2d78c'); g.addColorStop(1, '#8a6a2a'); cc.fillStyle = g; cc.fillRect(-82, -82, 164, 164); }); }, 9130);
      for (let i = 0; i < 28; i++) { const a = i * TAU / 28, x = Math.cos(a) * 68, y = Math.sin(a) * 68; fillPts(rot(ell(0, 0, 7, 3, 8), a + 1.2, 0, 0).map((p) => [p[0] + x, p[1] + y]), '#8a6a2a', 0, 0); }
      // profil de César (vers la droite), en relief clair sur un champ plus sombre, couronne de laurier vert bronze
      raw((cc) => { const g = cc.createRadialGradient(0, 0, 10, 0, 0, 64); g.addColorStop(0, '#a88434'); g.addColorStop(1, '#6e521c'); cc.fillStyle = g; cc.beginPath(); cc.arc(0, 0, 62, 0, TAU); cc.fill(); });
      const H = X.NAP_HEAD.map((p) => [p[0] * 0.78 - 2, p[1] * 0.78 + 26]);
      fillPts([[-22, 34], [12, 34], [30, 58], [-36, 60]], '#c8a24e'); strokePts([[-22, 34], [-36, 60]], '#3e2c0c', 1.6); strokePts([[12, 34], [30, 58]], '#3e2c0c', 1.6);
      fillPts(tr(H, 2, 2), 'rgba(40,25,5,0.55)'); fillPts(H, '#ecd08a'); strokePts(H.concat([H[0]]), '#3e2c0c', 2);
      strokePts([[10, -16], [18, -14]], '#3e2c0c', 1.8); dot(14, -15, 1.6, '#3e2c0c'); strokePts([[19, -2], [14, 0]], '#3e2c0c', 1.4); strokePts([[-6, -6], [-2, -14], [-8, -20]], '#7a5a20', 1.4);
      fillPts([[-26, -12], [-22, -36], [-4, -48], [14, -46], [20, -36], [8, -34], [-8, -28], [-18, -6]], '#c8a24e'); for (let i = 0; i < 6; i++) strokePts([[-20 + i * 6, -40 + i], [-24 + i * 6, -28 + i * 2]], '#7a5a20', 1);
      for (let i = 0; i < 8; i++) { const u = i / 7, x = lerp(-28, 18, u), y = lerp(-20, -46, u) - Math.sin(u * PI) * 8; fillPts(rot(ell(0, 0, 10, 4, 10), -1.0 - u * 0.5, 0, 0).map((p) => [p[0] + x - 2, p[1] + y - 6]), '#3f5a1e', 0, 0); fillPts(rot(ell(0, 0, 10, 4, 10), 0.5 - u * 0.4, 0, 0).map((p) => [p[0] + x + 3, p[1] + y + 5]), '#4f6e26', 0, 0); }
      strokePts([[-28, -18], [-38, -4], [-34, 8]], '#3f5a1e', 2.4); strokePts([[-28, -18], [-32, 0], [-26, 10]], '#4f6e26', 2);
      strokePts(ep(0, 0, 62, 62, 40, 0, TAU), '#e6c878', 2);
      M.rivet(-48, 0, 3.4);
    }), 6);
  }
  // LUC.roue(t, x, y, s, o) : (x,y) = moyeu ; o.rot (rad, sens horaire) ; o.chaines (true) ; o.eclat 0..1 (éclat d'or sur César) ; o.cast (true) ; o.alpha
  LUC.roue = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const c = cx_(), K = LUC.K, r0 = o.rot || 0;
    if (o.chaines !== false) for (const sx of [-1, 1]) chaine(x + sx * 34 * s, y - 10 * s, x + sx * 240 * s, 0, s);
    c.save(); if (o.alpha != null) c.globalAlpha = o.alpha;
    if (o.cast !== false && !SIL()) { c.save(); c.globalAlpha *= 0.32; c.translate(x + 18, y + 9); c.rotate(r0); c.scale(s, s); c.drawImage(K.roue.shadow, -340, -340); c.restore(); }
    c.save(); c.translate(x, y); c.rotate(r0); c.scale(s, s); c.drawImage(K.roue, -320, -320); c.restore();
    if (o.cast !== false && !SIL()) { c.save(); c.globalAlpha *= 0.3; c.translate(x + 8, y + 4); c.scale(s, s); c.drawImage(K.medaillon.shadow, -120, -120); c.restore(); }
    c.save(); c.translate(x, y); c.scale(s, s); c.drawImage(K.medaillon, -100, -100); c.restore();
    const e = clamp(o.eclat || 0);
    if (e > 0) {
      glow(x, y, 120 * s, '255,225,140', 0.3 * Math.sin(PI * e));
      raw((cc) => { cc.translate(x, y); cc.scale(s, s); cc.beginPath(); cc.arc(0, 0, 78, 0, TAU); cc.clip(); cc.rotate(-0.6); const xx = lerp(-120, 120, e); const g = cc.createLinearGradient(xx - 26, 0, xx + 26, 0); g.addColorStop(0, 'rgba(255,255,230,0)'); g.addColorStop(0.5, 'rgba(255,255,230,0.75)'); g.addColorStop(1, 'rgba(255,255,230,0)'); cc.fillStyle = g; cc.fillRect(-120, -120, 240, 240); });
      const k = Math.sin(PI * e); raw((cc) => { cc.translate(x + 34 * s, y - 40 * s); cc.rotate(e * 2); cc.fillStyle = `rgba(255,250,220,${0.9 * k})`; cc.beginPath(); for (let i = 0; i < 8; i++) { const a = i * PI / 4, rr = (i % 2 ? 4 : 18) * k * s; cc.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } cc.closePath(); cc.fill(); });
    }
    c.restore();
    return { x, y, s, rot: r0 };
  };
  function chaine(x0, y0, x1, y1, s) {
    const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / (16 * s))), a = Math.atan2(y1 - y0, x1 - x0);
    raw((c) => { for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; c.save(); c.translate(lerp(x0, x1, u), lerp(y0, y1, u)); c.rotate(a + (i % 2 ? 0 : 0)); c.beginPath(); if (i % 2) c.ellipse(0, 0, 9 * s, 2.2 * s, 0, 0, TAU); else c.ellipse(0, 0, 9 * s, 5 * s, 0, 0, TAU); c.lineWidth = 2.6 * s; c.strokeStyle = '#3a3630'; c.stroke(); c.lineWidth = 1 * s; c.strokeStyle = '#9a948a'; c.stroke(); c.restore(); } });
  }
  // repère sur la jante : nom 'bougie' | 'houx' | nombre de crans depuis la bougie (0 = bougie, 10 = houx, fractions permises)
  //   o = {x, y, s} du moyeu (défaut 540, 640, 1). Renvoie {a (angle écran), centre (milieu du repère), tete (bout vers la jante), pied (bout vers le moyeu),
  //   jante (bord extérieur, sur les crans), soleil (centre du Soleil d'hiver sur sa tige)}
  LUC.repere = function (nom, rotR, o) {
    o = o || {}; const x = o.x == null ? 540 : o.x, y = o.y == null ? 640 : o.y, s = o.s == null ? 1 : o.s;
    const n = nom === 'bougie' ? 0 : nom === 'houx' ? 10 : +nom || 0, a = RO.aB + n * RO.cran + (rotR || 0);
    const P2 = (r) => [x + Math.cos(a) * r * s, y + Math.sin(a) * r * s];
    return { a, centre: P2(184), tete: P2(246), pied: P2(122), jante: P2(RO.R + 12), soleil: P2(RO.R + 104), n };
  };
  LUC.ROUE = RO;
  // ---- Soleil d'hiver : disque de carton pâle or-orangé à rayons ondulés, Ø ≈ 124 à s 1, petit visage ; (x,y) = centre
  //   o.tige [x0,y0] : pied de la tige de laiton (sur la jante) ; o.penche (rad) ; o.agite 0..1 (s'agite) ; o.humeur −1 (ravi) … 0 … 1 (dépité) ; o.visage (true)
  LUC.soleilHiver = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const g = M.tg(t), ag = clamp(o.agite || 0), hm = clamp(o.humeur || 0, -1, 1);
    const jx = ag * 6 * Math.sin(g * 31), jy = ag * 4 * Math.sin(g * 23 + 1), pen = (o.penche || 0) + ag * 0.14 * Math.sin(g * 17);
    if (o.tige && !SIL()) { const c = cx_(); c.save(); c.strokeStyle = '#6a5428'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(o.tige[0], o.tige[1]); c.lineTo(x + jx, y + jy); c.stroke(); c.strokeStyle = '#d9bd72'; c.lineWidth = 2 * s; c.stroke(); c.restore(); }
    return accDraw('soleilHiver', (w) => {
      const tt = w.g;
      raw((c) => { const gg = c.createRadialGradient(0, 0, 30, 0, 0, 120); gg.addColorStop(0, 'rgba(255,214,140,0.35)'); gg.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = gg; c.fillRect(-120, -120, 240, 240); });
      const ray = []; for (let i = 0; i < 48; i++) { const a = i * TAU / 48, rr = (i % 4 === 0 ? 63 : i % 4 === 2 ? 56 : 50) + 1.5 * Math.sin(tt * 2 + i); ray.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      pc(ray, '#e8b860', () => hatch(null, 0.7, 4, 0.12, 1, undefined, [-66, -66, 66, 66]), 9201);
      pc(ell(0, 0, 44, 44, 24), '#f2cf86', () => { raw((c) => { const gg = c.createRadialGradient(-14, -16, 4, 0, 0, 46); gg.addColorStop(0, '#fbe8b4'); gg.addColorStop(1, '#e0a050'); c.fillStyle = gg; c.fillRect(-46, -46, 92, 92); }); hatch(null, 0.8, 4.4, 0.12, 1, undefined, [-46, -46, 46, 46]); }, 9202);
      if (w.visage !== false) {
        const hmv = w.hm;
        if (hmv < -0.3) { strokePts([[-20, -8], [-14, -12], [-8, -8]], '#7a4a1a', 2); strokePts([[8, -8], [14, -12], [20, -8]], '#7a4a1a', 2); }
        else { dot(-14, -8, 3.4, '#5a3410'); dot(14, -8, 3.4, '#5a3410'); if (hmv > 0.3) { strokePts([[-22, -18], [-8, -14]], '#7a4a1a', 1.8); strokePts([[22, -18], [8, -14]], '#7a4a1a', 1.8); } }
        const m = hmv; strokePts([[-12, 14 + 4 * m], [0, 14 - 6 * m], [12, 14 + 4 * m]], '#7a4a1a', 2);
        dot(-24, 6, 6, 'rgba(230,120,80,0.35)'); dot(24, 6, 6, 'rgba(230,120,80,0.35)');
      }
    }, x + jx, y + jy, s, { rot: pen, cast: o.cast, alpha: o.alpha, g, hm, visage: o.visage });
  };
  // le Soleil d'hiver sur sa tige, au-dessus d'un repère de la jante : pos = 'bougie' | 'houx' | crans (0 bougie → 10 houx) ; rot = rotation de la roue ; o.roue {x,y,s}
  //   + options de LUC.soleilHiver. Renvoie le repère (avec .soleil).
  LUC.soleilJante = function (t, pos, rotR, o) {
    o = o || {}; const rr = o.roue || {}, R = LUC.repere(pos, rotR, rr), s = rr.s == null ? 1 : rr.s;
    raw((c) => { c.translate(R.jante[0], R.jante[1]); c.rotate(R.a + PI / 2); c.fillStyle = '#8a6a2a'; c.fillRect(-12 * s, -6 * s, 24 * s, 14 * s); c.fillStyle = '#d9bd72'; c.fillRect(-10 * s, -5 * s, 20 * s, 4 * s); });
    LUC.soleilHiver(t, R.soleil[0], R.soleil[1], s * (o.taille || 1), Object.assign({ tige: R.jante }, o));
    return R;
  };

  // =====================================================================
  // 7) DÉCORS RÉCURRENTS — fonctions pures de t LOCAL (ambiance en temps global M.tg) ; à dessiner avant M.drawFloor()
  // =====================================================================
  const BACK = 1395;
  // pré-rendu plein cadre dessiné en coordonnées ÉCRAN ; se pose par M.flat(cv, 540, ST.back)
  function plein(fn, ombre) { const cv = M.cutFlat(1080, 1420, 540, 1405, (c) => { c.translate(-540, -BACK); fn(c); }); cv.padB = 15; if (ombre) M.withShadow(cv, ombre); return cv; }
  const posePlein = (cv, o) => M.flat(cv, 540, BACK, o || {});
  function neige(pts, seed) { pc(pts, '#eef2f6', () => { strokePts(pts.slice(0, Math.ceil(pts.length / 2)), 'rgba(255,255,255,0.9)', 1.6); hatch(null, 0.2, 6, 0.06); }, seed, { texA: 0.25 }); }
  function bordNeige(x0, x1, y, ep0, seed) {          // chape de neige ondulée posée sur une ligne horizontale, avec gouttes
    const top = [], bot = [], n = Math.max(4, Math.round((x1 - x0) / 26));
    for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); top.push([x, y - ep0 * (0.7 + 0.3 * hash(i + seed))]); }
    for (let i = n; i >= 0; i--) { const x = lerp(x0, x1, i / n), d = hash(i * 3 + seed) > 0.72 ? 12 : 3; bot.push([x, y + d]); }
    neige(top.concat(bot), seed);
  }
  function crepi(x0, y0, x1, y1, seed, col) { const R = M.rng(seed); for (let i = 0; i < (x1 - x0) * (y1 - y0) / 900; i++) dot(lerp(x0, x1, R()), lerp(y0, y1, R()), 0.8 + R() * 1.4, col || 'rgba(90,60,30,0.18)'); }
  function lattes(x0, y0, x1, y1, n, col) { for (let i = 1; i < n; i++) { const y = lerp(y0, y1, i / n); strokePts([[x0 + 2, y], [x1 - 2, y]], col, 1.2); } }
  // flocons qui tombent en continu (temps global)
  function flocons(g, n, a, seed, y1) {
    if (SIL() || a <= 0.01) return;
    const c = cx_(), R = M.rng(seed); c.save();
    for (let i = 0; i < n; i++) {
      const x0 = R() * 1180 - 50, v = 40 + R() * 50, ph = R() * TAU, r = 1.6 + R() * 2.6, y0 = R() * 1500;
      const y = ((y0 + g * v) % 1500) + 120, x = x0 + Math.sin(g * 0.8 + ph) * 22 - g * 6 % 0;
      if (y > (y1 || BACK + 40)) continue;
      c.globalAlpha = a * (0.55 + 0.45 * Math.sin(ph + g)); c.fillStyle = '#f8fbff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    c.restore();
  }
  LUC.flocons = (t, o) => { o = o || {}; flocons(M.tg(t), o.n || 60, o.a == null ? 0.8 : o.a, o.seed || 77, o.y1); };
  const mixA = (a, b, f) => a.map((v, i) => lerp(v, b[i], f));
  const rgb = (a) => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
  const rgba = (a) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${a[3].toFixed(3)})`;
  function palette(tab, k) { const i = Math.min(tab.length - 2, Math.floor(k)), f = k - i; return tab[i].map((col, j) => mixA(col, tab[i + 1][j], f)); }

  // ---------------- RUE D'AUJOURD'HUI (plans 1 et 6)
  const RUE = {
    porte: { x0: 350, x1: 480, top: 870 }, fenetre: { x0: 125, x1: 285, y0: 905, y1: 1055 }, appui: { x0: 110, x1: 300, y: 1056 },
    eph: { x: 566, y: 990, s: 1 }, jardiniere: { x0: 118, x1: 298, y: 1056 }, reverbere: { x: 654, lampe: [612, 792] },
    muret: { x0: 680, x1: 1080, y: 1300 }, voisine: { x0: 760, x1: 890, y0: 960, y1: 1100 }, banc: { x0: 130, x1: 300, y: 1310 },
    toitL: 640, toitV: 740, soleilSoir: [790, 680], soleilMatin: [215, 655], cheminees: [[492, 584], [990, 646]],
  };
  LUC.RUE = RUE;
  // ciel : 0 après-midi doré, 1 crépuscule, 2 nuit, 3 petit matin sombre (haut, milieu, horizon)
  const CIEL = [[[143, 166, 192], [232, 200, 144], [242, 214, 160]], [[74, 90, 134], [196, 122, 112], [240, 160, 96]], [[14, 22, 48], [28, 40, 78], [44, 56, 94]], [[24, 34, 62], [56, 72, 104], [110, 112, 138]]];
  const TEINTE = [[[255, 205, 130, 0.08]], [[150, 70, 90, 0.26]], [[14, 24, 64, 0.6]], [[30, 44, 84, 0.5]]];
  function makeRueFond() {
    return plein((c) => {
      pc([[0, 1060], [160, 1010], [380, 1040], [600, 990], [820, 1030], [1080, 1000], [1080, 1400, 1], [0, 1400, 1]], '#c9d3de', () => { hatch(null, 0.3, 7, 0.08); shade(0, 1000, 0, 1200, 0.2, [0, 980, 1080, 1400]); }, 9301, { drop: false });
      for (let i = 0; i < 12; i++) { const x = 20 + i * 92 + hash(i) * 30, h = 70 + hash(i + 9) * 50, w = 70 + hash(i + 4) * 30, y = 1150 - hash(i + 2) * 30;
        pc(box(x, y - h, x + w, y), i % 2 ? '#a89c88' : '#b4a892', () => { fillPts(box(x + w * 0.3, y - h * 0.6, x + w * 0.5, y - h * 0.3), 'rgba(60,50,40,0.5)'); }, 9310 + i, { drop: false });
        pc(sh([[x - 8, y - h], [x + w + 8, y - h], [x + w * 0.5, y - h - 40]]), '#6a6e78', null, 9330 + i, { drop: false }); neige(sh([[x - 8, y - h], [x + w * 0.5, y - h - 40], [x + w + 8, y - h], [x + w * 0.5, y - h - 26]]), 9350 + i); }
      // clocher : tour carrée à toit d'ardoise, girouette en forme d'oiseau (aucune croix)
      pc(box(848, 560, 912, 1150), '#b9ae98', () => { for (let y = 580; y < 1150; y += 22) strokePts([[850, y], [910, y]], 'rgba(80,70,50,0.3)', 1); fillPts([[866, 640], [894, 640], [894, 610], [880, 596], [866, 610]], '#3a3a44'); crepi(848, 560, 912, 1150, 3); }, 9370, { drop: false });
      pc(sh([[840, 562], [920, 562], [880, 468]]), '#4f5866', () => hatch(null, 1.2, 4, 0.2), 9371, { drop: false }); neige(sh([[848, 548], [880, 470], [912, 548], [880, 522]]), 9372);
      strokePts([[880, 468], [880, 444]], '#2a2a30', 1.6); fillPts([[870, 446], [884, 440], [892, 446], [884, 450]], '#2a2a30');
      for (let i = 0; i < 7; i++) { const x = 60 + i * 160 + hash(i + 40) * 40; strokePts([[x, 1160], [x, 1060]], '#6a6056', 3); for (let k = 0; k < 5; k++) { const a = -PI / 2 + (k - 2) * 0.45; strokePts([[x, 1090 + k * 8], [x + Math.cos(a) * 40, 1090 + k * 8 + Math.sin(a) * 40]], '#6a6056', 1.5); } }
    });
  }
  function fenetre(x0, y0, x1, y1, cadre, seed) {       // dormant + petits bois (6 carreaux, sans croix)
    const w = 8; pc([[x0 - w, y0 - w, 1], [x1 + w, y0 - w, 1], [x1 + w, y1 + w, 1], [x0 - w, y1 + w, 1], [x0 - w, y0 - w, 1], [x0, y0, 1], [x0, y1, 1], [x1, y1, 1], [x1, y0, 1], [x0, y0, 1]], cadre, null, seed);
    for (const f of [1 / 3, 2 / 3]) { const x = lerp(x0, x1, f); pc(box(x - 3, y0, x + 3, y1), cadre, null, seed + 1, { drop: false }); }
    pc(box(x0, (y0 + y1) / 2 - 3, x1, (y0 + y1) / 2 + 3), cadre, null, seed + 2, { drop: false });
  }
  function volet(x0, y0, x1, y1, col, seed) { pc(box(x0, y0, x1, y1), col, () => { lattes(x0, y0, x1, y1, 12, 'rgba(20,40,30,0.45)'); hatch(null, 1.4, 5, 0.12); }, seed); }
  function makeMaisonL() {
    return plein((c) => {
      // toit d'ardoise + neige
      pc(sh([[30, 832], [670, 832], [600, 640], [100, 640]]), '#56606c', () => { for (let y = 652; y < 832; y += 14) strokePts([[40, y], [660, y]], 'rgba(20,24,30,0.45)', 1); for (let y = 652; y < 832; y += 14) for (let x = 40 + (y % 28 ? 0 : 10); x < 660; x += 20) strokePts([[x, y], [x, y + 14]], 'rgba(20,24,30,0.3)', 0.8); }, 9401);
      neige([[96, 634, 1], [604, 634, 1], [627, 704, 1], [560, 714], [500, 702], [420, 718], [330, 704], [250, 716], [160, 704], [76, 708, 1]], 9402);
      // cheminée
      pc(box(470, 590, 514, 700), '#8a4a3a', () => { for (let y = 598; y < 700; y += 12) strokePts([[470, y], [514, y]], 'rgba(40,15,10,0.5)', 1); }, 9403); pc(box(462, 578, 522, 592), '#6a3a2e', null, 9404); bordNeige(460, 524, 580, 10, 9405);
      // lucarne
      pc(box(230, 700, 352, 806), '#c8a26a', () => crepi(230, 700, 352, 806, 4), 9406);
      pc(sh([[220, 704], [362, 704], [291, 652]]), '#56606c', null, 9407); neige(sh([[222, 698], [291, 646], [360, 698], [291, 674]]), 9408);
      // façade crépi ocre
      pc(box(50, 830, 650, BACK), '#c8a26a', () => {
        crepi(50, 830, 650, BACK, 5); hatch([[50, 830], [120, 830], [120, BACK], [50, BACK]], 1.2, 5, 0.14);
        for (let y = 840; y < BACK - 50; y += 44) { fillPts(box(50, y, (y / 44) % 2 ? 82 : 70, y + 40), '#b49470'); fillPts(box((y / 44) % 2 ? 618 : 630, y, 650, y + 40), '#b49470'); }
        fillPts(box(50, 1340, 650, BACK), '#8a7c68'); for (let x = 60; x < 650; x += 48) strokePts([[x, 1340], [x, BACK]], 'rgba(40,30,20,0.4)', 1);
        shade(650, 900, 50, 900, 0.18, [50, 830, 650, BACK]);
      }, 9409);
      pc(box(30, 826, 670, 838), '#4a5058', null, 9410); bordNeige(36, 664, 826, 9, 9411);
      fenetre(255, 715, 327, 792, '#e8e2d4', 9412);
      // fenêtre du rez-de-chaussée (vide : l'intérieur est dessiné derrière), volets verts, appui de pierre
      fenetre(RUE.fenetre.x0, RUE.fenetre.y0, RUE.fenetre.x1, RUE.fenetre.y1, '#ece6d8', 9415);
      volet(83, 900, 119, 1060, '#3f6a4a', 9418); volet(291, 900, 327, 1060, '#3f6a4a', 9419);
      pc(box(RUE.appui.x0, RUE.appui.y, RUE.appui.x1, RUE.appui.y + 16), '#bdb2a0', () => strokePts([[RUE.appui.x0 + 2, RUE.appui.y + 3], [RUE.appui.x1 - 2, RUE.appui.y + 3]], 'rgba(255,255,255,0.5)', 1.4), 9420);
      bordNeige(RUE.appui.x0 + 2, RUE.appui.x1 - 2, RUE.appui.y + 1, 6, 9421);
      // porte bleue à panneaux, encadrement de pierre, paillasson
      pc(box(RUE.porte.x0 - 14, RUE.porte.top - 16, RUE.porte.x1 + 14, BACK), '#d6ccb8', null, 9422);
      pc(box(RUE.porte.x0, RUE.porte.top, RUE.porte.x1, BACK - 6), '#3a5a8a', () => {
        for (const [y0, y1] of [[RUE.porte.top + 22, 1080], [1110, BACK - 30]]) for (const [x0, x1] of [[RUE.porte.x0 + 14, 408], [422, RUE.porte.x1 - 14]]) { strokePts(box(x0, y0, x1, y1).concat([[x0, y0]]), 'rgba(15,25,50,0.6)', 1.6); strokePts([[x0 + 2, y0 + 2], [x1 - 2, y0 + 2]], 'rgba(200,220,255,0.3)', 1.2); }
        hatch(null, 1.3, 5, 0.14); shade(RUE.porte.x1, 0, RUE.porte.x0, 0, 0.25, [RUE.porte.x0, RUE.porte.top, RUE.porte.x1, BACK]);
      }, 9423);
      dot(466, 1140, 6, '#c9a046'); dot(464, 1138, 2, '#fff2c0');
      pc(box(RUE.porte.x0 + 8, BACK - 10, RUE.porte.x1 - 8, BACK), '#8a5a3a', () => { for (let x = RUE.porte.x0 + 12; x < RUE.porte.x1 - 8; x += 5) strokePts([[x, BACK - 9], [x, BACK - 1]], 'rgba(40,20,10,0.6)', 1); }, 9424);
      // crochet de l'éphéméride (à côté de la porte)
      dot(RUE.eph.x, RUE.eph.y - 118, 3, '#5a5048');
    }, 8);
  }
  function makeMaisonV() {
    return plein((c) => {
      pc(sh([[670, 902], [1090, 902], [1068, 740], [720, 740]]), '#8a4a3a', () => { for (let y = 750; y < 902; y += 12) for (let x = 700 + (y % 24 ? 0 : 8); x < 1080; x += 16) strokePts(ep(x, y, 8, 5, 6, 0, PI), 'rgba(50,20,10,0.4)', 0.8); }, 9431);
      neige([[716, 734, 1], [1072, 734, 1], [1085, 788, 1], [1010, 798], [930, 786], [850, 800], [770, 786], [702, 792, 1]], 9432);
      pc(box(972, 650, 1008, 742), '#9a5a44', () => { for (let y = 660; y < 742; y += 12) strokePts([[972, y], [1008, y]], 'rgba(40,15,10,0.5)', 1); }, 9433); bordNeige(966, 1014, 650, 9, 9434);
      pc(box(690, 900, 1080, BACK), '#b8ab92', () => { crepi(690, 900, 1080, BACK, 6, 'rgba(70,60,40,0.2)'); shade(1080, 0, 690, 0, 0.2, [690, 900, 1080, BACK]); }, 9435);
      pc(box(676, 896, 1086, 908), '#4a5058', null, 9436); bordNeige(680, 1084, 896, 8, 9437);
      fenetre(RUE.voisine.x0, RUE.voisine.y0, RUE.voisine.x1, RUE.voisine.y1, '#e6e2d6', 9438);
      volet(722, 954, 756, 1106, '#5a6e86', 9441); volet(894, 954, 928, 1106, '#5a6e86', 9442);
      pc(box(748, 1100, 902, 1114), '#bdb2a0', null, 9443); bordNeige(750, 900, 1100, 5, 9444);
      // boîte aux lettres jaune, sans aucun texte
      pc(rrect(902, 1150, 952, 1216, 8), '#e2b81e', () => { fillPts(box(910, 1166, 944, 1172), '#3a3020'); strokePts([[906, 1156], [948, 1156]], 'rgba(255,250,200,0.7)', 1.4); hatch(null, 0.8, 4, 0.12); }, 9445);
    }, 8);
  }
  function makeRueAvant() {
    return plein((c) => {
      // muret de pierre (le chat passe dessus)
      pc(box(RUE.muret.x0, RUE.muret.y, RUE.muret.x1, BACK), '#9a9080', () => { const R = M.rng(12); for (let y = RUE.muret.y + 4; y < BACK; y += 24) for (let x = RUE.muret.x0 + (y % 48 ? 0 : 20); x < RUE.muret.x1; x += 40 + R() * 10) strokePts(box(x, y, x + 36, y + 20).concat([[x, y]]), 'rgba(50,40,30,0.4)', 1); }, 9451);
      bordNeige(RUE.muret.x0 - 4, RUE.muret.x1, RUE.muret.y, 10, 9452);
      // banc sous la fenêtre
      for (const x of [146, 284]) pc(box(x - 6, RUE.banc.y, x + 6, BACK), '#3a3a3e', null, 9453);
      pc(box(RUE.banc.x0, RUE.banc.y - 12, RUE.banc.x1, RUE.banc.y), '#8a6038', () => lattes(RUE.banc.x0, RUE.banc.y - 12, RUE.banc.x1, RUE.banc.y, 3, 'rgba(40,20,10,0.5)'), 9454); bordNeige(RUE.banc.x0, RUE.banc.x1, RUE.banc.y - 12, 6, 9455);
      // vélo appuyé contre le muret
      raw((cc) => { cc.lineCap = 'round'; });
      for (const wx of [858, 944]) { strokePts(ell(wx, 1352, 40, 40, 28).concat([[wx + 40, 1352]]), '#2a2a2e', 4); strokePts(ell(wx, 1352, 36, 36, 28).concat([[wx + 36, 1352]]), '#8a8a90', 1.2); for (let i = 0; i < 8; i++) { const a = i * PI / 4; strokePts([[wx, 1352], [wx + Math.cos(a) * 36, 1352 + Math.sin(a) * 36]], 'rgba(150,150,160,0.7)', 0.8); } }
      strokePts([[858, 1352], [892, 1300], [930, 1302], [944, 1352]], '#b0302a', 4.4); strokePts([[892, 1300], [900, 1352], [858, 1352]], '#b0302a', 4.4); strokePts([[900, 1352], [930, 1302]], '#b0302a', 4.4);
      strokePts([[892, 1300], [886, 1286]], '#2a2a2e', 3); fillPts([[874, 1282], [898, 1280], [900, 1288], [876, 1290]], '#2a2a2e'); strokePts([[930, 1302], [934, 1280], [946, 1276]], '#2a2a2e', 3);
      // sapin en pot (la guirlande clignote, dessinée à part)
      pc([[700, 1330], [760, 1330], [754, BACK], [706, BACK]], '#b05a36', () => { strokePts([[702, 1340], [758, 1340]], 'rgba(255,200,170,0.5)', 1.4); hatch(null, 0.9, 4, 0.2); }, 9456);
      pc([[730, 1150], [756, 1196], [744, 1196], [772, 1250], [756, 1250], [790, 1310], [670, 1310], [704, 1250], [688, 1250], [716, 1196], [704, 1196]], '#2f5e38', () => { hatch(null, 1.0, 4, 0.25); shade(780, 0, 680, 0, 0.3, [660, 1140, 800, 1320]); }, 9457);
      pc(box(724, 1310, 736, 1332), '#5a3a22', null, 9458, { drop: false });
      for (const [x, y] of [[724, 1176], [744, 1222], [712, 1238], [760, 1282], [694, 1292], [730, 1270]]) dot(x, y, 4, '#f2f6fa');
      strokePts(GUIRL.concat(), 'rgba(40,50,40,0.8)', 1.2);
      // réverbère moderne
      pc([[644, BACK], [664, BACK], [660, 1370], [658, 780], [652, 780], [650, 1370]], '#2f3a36', () => strokePts([[653, 1360], [654, 800]], 'rgba(200,220,210,0.3)', 1.2), 9459);
      strokePts(qbez([655, 782], [652, 742], [618, 760], 10), '#2f3a36', 4.4);
      pc([[596, 768], [628, 766], [634, 790], [590, 792]], '#26302c', null, 9460);
      fillPts([[594, 790], [630, 788], [626, 796], [598, 798]], '#5a6460');
    }, 8);
  }
  const GUIRL = (() => { const o = []; for (let i = 0; i <= 26; i++) { const u = i / 26, y = lerp(1166, 1300, u), w = lerp(8, 56, u); o.push([730 + Math.sin(u * 14) * w, y]); } return o; })();
  function makeJardiniere() {
    return M.withShadow(M.cutFlat(220, 150, 110, 140, (c) => {
      const touffe = [[-88, -30]]; for (let i = 0; i <= 12; i++) { const x = lerp(-86, 86, i / 12); touffe.push([x, -86 - 14 * Math.sin(PI * i / 12) - (i % 2 ? 10 : 0) - hash(i) * 8]); } touffe.push([88, -30]);
      pc(touffe, '#4a6a3e', () => { for (let i = 0; i < 26; i++) fillPts(ell(-80 + hash(i + 1) * 160, -90 + hash(i + 2) * 58, 13, 8, 10), i % 3 ? '#5a7a46' : '#3e5c34'); for (let i = 0; i < 18; i++) dot(-80 + hash(i + 30) * 160, -88 + hash(i + 31) * 56, 1.6, 'rgba(240,248,255,0.8)'); hatch(null, 0.8, 4, 0.2); }, 9472);
      for (let i = 0; i < 9; i++) { const x = -76 + i * 19, y = -84 - hash(i + 7) * 22; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; dot(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, '#a8343a'); } dot(x, y, 3, '#d9c0b0'); dot(x + 3, y - 4, 1.6, '#ffffff'); }
      pc([[-90, -34, 1], [90, -34, 1], [84, 0, 1], [-84, 0, 1]], '#b05a36', () => { strokePts([[-70, -26], [70, -26]], 'rgba(255,200,170,0.5)', 1.4); hatch(null, 0.9, 4, 0.2); }, 9470);
      bordNeige(-88, 88, -34, 5, 9471);
    }), 6);
  }
  // chat noir qui marche (u 0..1 de x0 à x1, s'assoit à la fin) ; pattes alternées
  function chat(g, x, y, s, dir, marche) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s);
    const ph = g * 9, b = marche ? Math.abs(Math.sin(ph)) * 2 : 0, col = '#1c1a1e';
    for (const [lx, o] of [[-22, 0], [-14, PI], [16, PI], [24, 0]]) { const sw = marche ? Math.sin(ph + o) * 7 : 0; strokePts([[lx, -18 - b], [lx + sw, 0]], col, 4); }
    fillPts(ell(0, -26 - b, 30, 11, 14), col); fillPts(ell(32, -36 - b, 11, 10, 12), col);
    fillPts([[26, -44 - b], [28, -56 - b], [34, -46 - b]], col); fillPts([[36, -45 - b], [40, -56 - b], [43, -44 - b]], col);
    strokePts(qbez([-28, -28 - b], [-50, -34 + Math.sin(g * 3) * 6], [-44, -62 - b], 8), col, 4);
    dot(37, -38 - b, 1.8, '#d8c84a');
    c.restore();
  }
  // LUC.rueAujourdhui(t, o) : o.ciel 0..3 (continu ; défaut 1) ; o.soleil [x,y] | false (soleil du soir, défaut selon ciel) ; o.soleilMatin [x,y] | false (défaut si ciel > 2,4) ;
  //   o.reverbere 0..1 (défaut : s'allume entre ciel 0,9 et 1,4) ; o.fenetre 0..1 (fenêtre de Lucette éclairée, défaut selon ciel) ; o.voisine 0..1 (fenêtre voisine) ;
  //   o.chat 0..1 (passe sur le muret ; null = pas de chat) ; o.neige 0..1 (flocons, défaut 0,5) ; o.jardiniere (true ; false = la dessiner soi-même après la puce : LUC.rueJardiniere)
  LUC.rueAujourdhui = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), K = LUC.K, k = clamp(o.ciel == null ? 1 : o.ciel, 0, 3);
    const pal = palette(CIEL, k), nuit = smooth(1.2, 2, k) * (k > 2.5 ? lerp(1, 0.65, smooth(2.5, 3, k)) : 1);
    raw((cc) => { const gr = cc.createLinearGradient(0, 0, 0, 1150); gr.addColorStop(0, rgb(pal[0])); gr.addColorStop(0.62, rgb(pal[1])); gr.addColorStop(1, rgb(pal[2])); cc.fillStyle = gr; cc.fillRect(0, 0, M.W, BACK + 10); });
    if (nuit > 0.02) raw((cc) => { const R = M.rng(5); for (let i = 0; i < 70; i++) { const x = R() * 1080, y = 160 + R() * 640, tw = 0.6 + 0.4 * Math.sin(g * (1 + R() * 2) + i); cc.globalAlpha = nuit * tw * 0.9; cc.fillStyle = '#f6f2dc'; cc.beginPath(); cc.arc(x, y, 0.8 + R() * 1.6, 0, TAU); cc.fill(); } cc.globalAlpha = nuit; cc.fillStyle = '#f2e8c0'; cc.beginPath(); cc.arc(330, 380, 30, -1.2, 1.9); cc.arc(342, 372, 26, 1.6, -1.0, true); cc.fill(); });
    if (k < 1.6) M.oiseaux(g, { x0: -80, x1: 1160, y: 470, t0: 0, dur: 18, n: 4, s: 0.55, seed: 8, boucle: true, col: '#3a3440', brume: 0.2 });
    // soleils (derrière les toits)
    const sd = o.soleil === false ? null : (o.soleil || [RUE.soleilSoir[0], k <= 1 ? lerp(420, RUE.soleilSoir[1], smooth(0, 1, k) * 0.6 + k * 0.4) : lerp(RUE.soleilSoir[1], 880, smooth(1, 1.6, k))]);
    if (sd && (o.soleil || k < 1.7)) soleilCarton(sd[0], sd[1], 56, g, 0);
    const sm = o.soleilMatin === false ? null : (o.soleilMatin || (k > 2.4 ? [RUE.soleilMatin[0], lerp(760, RUE.soleilMatin[1], smooth(2.4, 3, k))] : null));
    if (sm) soleilCarton(sm[0], sm[1], 50, g, 1);
    // décor dans un tampon, teinté selon l'heure
    const B = LUC._buf, bx = B.getContext('2d'); bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, B.width, B.height);
    M.use(bx);
    posePlein(K.rueFond);
    M.fumee(t, { x: RUE.cheminees[0][0], y: RUE.cheminees[0][1], s: 0.8, n: 6, haut: 200, vent: 40, seed: 3, a: 0.6 });
    M.fumee(t, { x: RUE.cheminees[1][0], y: RUE.cheminees[1][1], s: 0.6, n: 5, haut: 160, vent: 40, seed: 4, a: 0.5 });
    const fen = o.fenetre == null ? smooth(0.5, 1.5, k) * (k > 2.6 ? 0.8 : 1) : clamp(o.fenetre), vois = clamp(o.voisine || 0);
    interieur(RUE.fenetre, fen, t, 1); interieur(RUE.voisine, vois, t, -1);
    posePlein(K.maisonL, { cast: { a: 0.25, dx: 10, dy: 4 } }); posePlein(K.maisonV, { cast: { a: 0.25, dx: 10, dy: 4 } });
    if (o.chat != null && o.chat > 0 && o.chat < 1.001) { const u = clamp(o.chat), w = ease(Math.min(1, u / 0.85)); chat(g, lerp(1080, 800, w), RUE.muret.y - 4, 1, -1, u < 0.85); }
    posePlein(K.rueAvant, { cast: { a: 0.28, dx: 12, dy: 5 } });
    if (o.jardiniere !== false) M.flat(K.jardiniere, (RUE.jardiniere.x0 + RUE.jardiniere.x1) / 2, RUE.jardiniere.y + 10, { cast: { a: 0.25, dx: 6, dy: 3 } });
    const te = palette(TEINTE, k)[0];
    bx.save(); bx.setTransform(1, 0, 0, 1, 0, 0); bx.globalCompositeOperation = 'source-atop'; bx.fillStyle = rgba(te); bx.fillRect(0, 0, B.width, B.height); bx.restore();
    M.use(c); c.drawImage(B, 0, 0);
    // lumières (par-dessus la teinte)
    lueurFenetre(RUE.fenetre, fen); lueurFenetre(RUE.voisine, vois);
    const rv = o.reverbere == null ? smooth(0.9, 1.4, k) : clamp(o.reverbere);
    if (rv > 0.01) { glow(RUE.reverbere.lampe[0], RUE.reverbere.lampe[1], 230, '255,200,120', 0.42 * rv); glow(RUE.reverbere.lampe[0], RUE.reverbere.lampe[1], 40, '255,240,200', 0.8 * rv); raw((cc) => { cc.globalAlpha = rv; cc.fillStyle = '#ffe8a8'; cc.beginPath(); cc.moveTo(594, 790); cc.lineTo(630, 788); cc.lineTo(626, 796); cc.lineTo(598, 798); cc.fill(); }); }
    raw((cc) => { for (let i = 0; i < GUIRL.length; i += 2) { const p = GUIRL[i], on = 0.55 + 0.45 * Math.sin(g * 2.2 + i * 1.7), col = ['255,90,80', '255,210,90', '120,200,255', '140,240,140'][i / 2 % 4]; cc.globalAlpha = 1; cc.fillStyle = `rgba(${col},${0.5 + 0.5 * on})`; cc.beginPath(); cc.arc(p[0], p[1], 3.4, 0, TAU); cc.fill(); const gr = cc.createRadialGradient(p[0], p[1], 1, p[0], p[1], 14); gr.addColorStop(0, `rgba(${col},${0.5 * on * (0.4 + nuit)})`); gr.addColorStop(1, `rgba(${col},0)`); cc.globalCompositeOperation = 'lighter'; cc.fillStyle = gr; cc.fillRect(p[0] - 14, p[1] - 14, 28, 28); cc.globalCompositeOperation = 'source-over'; } });
    flocons(g, 70, (o.neige == null ? 0.5 : o.neige) * lerp(1, 0.75, nuit), 41);
  };
  // la jardinière de géraniums gelés seule (pour cacher la puce derrière : rueAujourdhui({ jardiniere:false }) puis LUC.rueJardiniere(t, {ciel}) après la puce)
  LUC.rueJardiniere = function (t, o) {
    o = o || {}; const k = clamp(o.ciel == null ? 1 : o.ciel, 0, 3), c = cx_(), K = LUC.K, B = LUC._bufS, bx = B.getContext('2d');
    bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, B.width, B.height); M.use(bx); M.flat(K.jardiniere, 120, 140);
    bx.globalCompositeOperation = 'source-atop'; bx.fillStyle = rgba(palette(TEINTE, k)[0]); bx.fillRect(0, 0, B.width, B.height); bx.globalCompositeOperation = 'source-over';
    M.use(c); c.drawImage(B, (RUE.jardiniere.x0 + RUE.jardiniere.x1) / 2 - 120, RUE.jardiniere.y + 10 - 140);
  };
  function interieur(F, lum, t, cote) {
    const c = cx_(); c.save(); c.beginPath(); c.rect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); c.clip();
    c.fillStyle = M.mixc('#2a2a3a', '#e8b866', clamp(lum)); c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    fillPts(box(F.x0 + 20, F.y1 - 50, F.x0 + 70, F.y1), 'rgba(60,40,30,0.45)'); dot(F.x1 - 40, F.y0 + 40, 14, `rgba(255,240,200,${0.6 * lum})`);
    M.voilage(t, { x: F.x0 + 2, y: F.y0 + 4, w: (F.x1 - F.x0) * 0.55, h: F.y1 - F.y0 - 8, amp: 6, cote: 1, col: 'rgba(245,238,222,0.6)' });
    M.voilage(t + 3, { x: F.x1 - (F.x1 - F.x0) * 0.55 - 2, y: F.y0 + 4, w: (F.x1 - F.x0) * 0.55, h: F.y1 - F.y0 - 8, amp: 6, cote: -1, col: 'rgba(245,238,222,0.6)' });
    c.restore();
  }
  function lueurFenetre(F, lum) { if (lum <= 0.02) return; raw((c) => { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,190,110,${0.22 * lum})`; c.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); }); glow((F.x0 + F.x1) / 2, (F.y0 + F.y1) / 2, 160, '255,190,110', 0.18 * lum); }
  // soleil de carton sur son fil (0 = soir orangé, 1 = matin pâle et froid)
  function soleilCarton(x, y, r, g, matin) {
    raw((c) => { c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x, 0); c.stroke(); const gg = c.createRadialGradient(x, y, r * 0.8, x, y, r * 3.2); gg.addColorStop(0, matin ? 'rgba(220,200,170,0.25)' : 'rgba(250,150,70,0.4)'); gg.addColorStop(1, 'rgba(240,150,70,0)'); c.globalCompositeOperation = 'screen'; c.fillStyle = gg; c.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4); });
    const c = cx_(); c.save(); c.translate(x, y); c.rotate(Math.sin(g * 0.7) * 0.03);
    const pts = []; for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, rr = r * (i % 3 === 0 ? 1.12 : 1); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    pc(pts, matin ? '#d8c08a' : '#d7883e', () => raw((cc) => { const g2 = cc.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g2.addColorStop(0, matin ? '#f0e2b8' : '#f4cc84'); g2.addColorStop(1, matin ? '#a89c84' : '#b84e2a'); cc.fillStyle = g2; cc.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4); }), 9480 + matin);
    c.restore();
  }

  // ---------------- VILLAGE MÉDIÉVAL EN HIVER (plans 2 et 5)
  const VIL = { roue: { x: 540, y: 640 }, puits: { x: 560, toit: [560, 1122], margelle: 1300 }, cheminees: [[345, 872], [795, 884]], plessis: { x0: 120, x1: 470, y: 1272 },
    poules: [[612, 1392, 1], [668, 1394, -1], [742, 1390, 1]], souche: [800, 1350], meule: 455, charrette: 700 };
  LUC.VIL = VIL;
  function makeVillageCiel() {
    return M.pre(M.W, BACK + 10, (c) => {
      const gr = c.createLinearGradient(0, 0, 0, 1150); gr.addColorStop(0, '#8e98aa'); gr.addColorStop(0.55, '#d4bcbc'); gr.addColorStop(1, '#ead8cc'); c.fillStyle = gr; c.fillRect(0, 0, M.W, BACK + 10);
      const R = M.rng(31); c.globalAlpha = 0.12; for (let i = 0; i < 30; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#9a8aa0'; c.beginPath(); c.ellipse(R() * 1080, 200 + R() * 700, 120 + R() * 160, 14 + R() * 18, 0, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    });
  }
  function sapinNeige(x, y, h, seed, col) {
    const w = h * 0.42; pc([[x, y - h], [x + w * 0.45, y - h * 0.62], [x + w * 0.3, y - h * 0.62], [x + w * 0.75, y - h * 0.28], [x + w * 0.5, y - h * 0.28], [x + w, y], [x - w, y], [x - w * 0.5, y - h * 0.28], [x - w * 0.75, y - h * 0.28], [x - w * 0.3, y - h * 0.62], [x - w * 0.45, y - h * 0.62]], col || '#2e4a3a', null, seed, { drop: false });
    fillPts([[x, y - h], [x + w * 0.3, y - h * 0.7], [x, y - h * 0.76], [x - w * 0.3, y - h * 0.7]], '#eef2f6'); fillPts([[x - w * 0.6, y - h * 0.32], [x, y - h * 0.4], [x + w * 0.6, y - h * 0.32], [x, y - h * 0.36]], '#e6ecf2');
  }
  function makeVillageFond() {
    return plein((c) => {
      pc([[0, 1010], [200, 930], [420, 980], [640, 900], [860, 960], [1080, 910], [1080, 1400, 1], [0, 1400, 1]], '#d6dee8', () => { hatch(null, 0.3, 8, 0.08); shade(0, 920, 0, 1150, 0.18, [0, 880, 1080, 1400]); }, 9501, { drop: false });
      for (let i = 0; i < 26; i++) { const x = (i < 13 ? 0 : 640) + (i % 13) * 34 + hash(i) * 20, y = (i < 13 ? 1000 : 960) + hash(i + 5) * 40 + (i % 13) * (i < 13 ? -2 : 3); sapinNeige(x, y, 60 + hash(i + 2) * 40, 9510 + i, i % 2 ? '#2e4a3a' : '#3a5444'); }
      pc([[0, 1120], [260, 1060], [520, 1100], [780, 1050], [1080, 1090], [1080, 1400, 1], [0, 1400, 1]], '#e6ecf2', () => { hatch(null, 0.25, 8, 0.07); shade(0, 1060, 0, 1300, 0.14, [0, 1040, 1080, 1400]); }, 9540, { drop: false });
      // clocher roman lointain : tour carrée, baies géminées, toit en pyramide basse (aucune croix)
      pc(box(850, 830, 920, 1110), '#c4b8a0', () => { for (let y = 846; y < 1110; y += 18) strokePts([[852, y], [918, y]], 'rgba(80,70,50,0.3)', 1); for (const bx2 of [862, 890]) fillPts([[bx2, 900], [bx2 + 16, 900], [bx2 + 16, 872], [bx2 + 8, 864], [bx2, 872]], '#3a3a44'); }, 9541, { drop: false });
      pc(sh([[842, 832], [928, 832], [885, 786]]), '#6a6058', null, 9542, { drop: false }); neige(sh([[848, 826], [885, 788], [922, 826], [885, 812]]), 9543);
    });
  }
  function colombage(x0, y0, x1, y1, seed) {
    pc(box(x0, y0, x1, y1), '#e2d8c2', () => {
      crepi(x0, y0, x1, y1, seed, 'rgba(120,100,70,0.2)');
      const bois = '#4a3424', n = Math.round((x1 - x0) / 56);
      for (let i = 0; i <= n; i++) { const x = lerp(x0 + 6, x1 - 6, i / n); fillPts(box(x - 6, y0, x + 6, y1), bois); }
      fillPts(box(x0, y0, x1, y0 + 12), bois); fillPts(box(x0, (y0 + y1) / 2 - 6, x1, (y0 + y1) / 2 + 6), bois); fillPts(box(x0, y1 - 12, x1, y1), bois);
      for (let i = 0; i < n; i++) if (i % 2 === 0) { const xa = lerp(x0 + 6, x1 - 6, i / n), xb = lerp(x0 + 6, x1 - 6, (i + 1) / n); fillPts([[xa, (y0 + y1) / 2], [xa + 9, (y0 + y1) / 2], [xb, y0 + 12], [xb - 9, y0 + 12]], bois); }   // une seule écharpe par travée (pas de croix)
      hatch(null, 1.2, 5, 0.12);
    }, seed);
  }
  function chaume(pts, seed) {
    pc(pts, '#a8844a', () => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); const R = M.rng(seed); for (let i = 0; i < (x1 - x0) * 0.9; i++) { const x = lerp(x0, x1, R()), y = lerp(y0, y1, R()); strokePts([[x, y], [x + 3, y + 14 + R() * 10]], R() < 0.5 ? 'rgba(90,60,20,0.45)' : 'rgba(230,200,140,0.4)', 1); } }, seed);
  }
  function chaumiere(x0, x1, eave, ridge, porte, fen, chem, seed) {
    pc(box(x0, BACK - 95, x1, BACK), '#8a8070', () => { const R = M.rng(seed); for (let y = BACK - 92; y < BACK; y += 22) for (let x = x0 + (y % 44 ? 0 : 16); x < x1; x += 30 + R() * 14) strokePts(ell(x + 14, y + 10, 14, 9, 8).concat([[x + 28, y + 10]]), 'rgba(40,30,20,0.45)', 1); }, seed + 1);
    colombage(x0, eave, x1, BACK - 95, seed + 2);
    pc(box(chem[0] - 16, ridge - 20, chem[0] + 16, ridge + 70), '#8a8070', null, seed + 3);
    chaume([[x0 - 26, eave + 8, 1], [x1 + 26, eave + 8, 1], [x1 - 70, ridge + 10], [lerp(x0, x1, 0.5) + 60, ridge - 4], [lerp(x0, x1, 0.5) - 60, ridge - 4], [x0 + 70, ridge + 10]], seed + 4);
    neige([[x0 + 64, ridge + 4], [lerp(x0, x1, 0.5) - 60, ridge - 10], [lerp(x0, x1, 0.5) + 60, ridge - 10], [x1 - 64, ridge + 4], [x1 - 30, ridge + 70], [lerp(x0, x1, 0.6), ridge + 56], [lerp(x0, x1, 0.4), ridge + 76], [x0 + 30, ridge + 64]], seed + 5);
    bordNeige(chem[0] - 18, chem[0] + 18, ridge - 20, 8, seed + 6);
    bordNeige(x0 - 24, x1 + 24, eave + 8, 7, seed + 7);
    pc(box(porte[0], porte[1], porte[2], BACK), '#5a3a22', () => { lattes(porte[0], porte[1], porte[2], BACK, 1, ''); for (let x = porte[0] + 12; x < porte[2]; x += 14) strokePts([[x, porte[1] + 4], [x, BACK - 4]], 'rgba(20,10,5,0.5)', 1.2); fillPts(box(porte[0] + 4, porte[1] + 30, porte[2] - 4, porte[1] + 40), '#3a2a1a'); fillPts(box(porte[0] + 4, BACK - 60, porte[2] - 4, BACK - 50), '#3a2a1a'); dot(porte[2] - 14, (porte[1] + BACK) / 2, 4, '#2a2420'); }, seed + 8);
    pc(box(fen[0], fen[1], fen[2], fen[3]), '#2a2a30', () => { fillPts(box(fen[0] + 4, fen[1] + 4, fen[2] - 4, fen[3] - 4), 'rgba(230,170,90,0.55)'); strokePts([[fen[0] + (fen[2] - fen[0]) / 2, fen[1]], [fen[0] + (fen[2] - fen[0]) / 2, fen[3]]], '#4a3424', 3); }, seed + 9);
    volet(fen[2] + 2, fen[1] - 2, fen[2] + (fen[2] - fen[0]) / 2 + 4, fen[3] + 2, '#6a5a3a', seed + 10);
    bordNeige(fen[0] - 4, fen[2] + 4, fen[3] + 2, 5, seed + 11);
  }
  function makeVillageMilieu() {
    return plein((c) => {
      chaumiere(60, 400, 1062, 896, [270, 1215, 340], [118, 1140, 186, 1206], VIL.cheminees[0].concat([]), 9550);
      chaumiere(700, 1050, 1078, 916, [960, 1225, 1030], [760, 1150, 828, 1216], VIL.cheminees[1], 9570);
      // meule de foin (dôme de paille, perche, chapeau de neige)
      strokePts([[455, 1250], [455, 1176]], '#5a3a22', 4);
      pc([[402, BACK, 1], [508, BACK, 1], [506, 1330], [496, 1290], [478, 1262], [455, 1252], [432, 1262], [414, 1290], [404, 1330]], '#c09a50', () => { const R = M.rng(3); for (let i = 0; i < 140; i++) { const x = 404 + R() * 102, y = 1250 + R() * 145; strokePts([[x, y], [x + 4, y + 10]], 'rgba(100,70,20,0.45)', 1); } shade(508, 0, 402, 0, 0.3, [400, 1240, 510, BACK]); }, 9590);
      neige([[418, 1286], [436, 1262], [455, 1254], [474, 1262], [492, 1286], [470, 1278], [455, 1282], [440, 1276]], 9592);
      // charrette à bras
      strokePts([[618, 1330], [560, 1384]], '#5a3a22', 6); strokePts([[640, 1312], [586, 1384]], '#5a3a22', 6);
      pc(box(618, 1290, 790, 1312), '#7a5232', () => lattes(618, 1290, 790, 1312, 2, 'rgba(30,15,5,0.5)'), 9593);
      for (const x of [626, 690, 782]) pc(box(x - 4, 1250, x + 4, 1292), '#6a4428', null, 9594 + x);
      bordNeige(618, 790, 1290, 6, 9597);
      pc(ell(VIL.charrette, 1345, 48, 48, 24), '#5a3a22', () => { strokePts(ell(VIL.charrette, 1345, 42, 42, 24).concat([[VIL.charrette + 42, 1345]]), '#3a2614', 3); for (let i = 0; i < 8; i++) { const a = i * PI / 4; strokePts([[VIL.charrette, 1345], [VIL.charrette + Math.cos(a) * 42, 1345 + Math.sin(a) * 42]], '#3a2614', 3); } fillPts(ell(VIL.charrette, 1345, 9, 9, 10), '#3a2614'); }, 9598);
      // puits rond de pierre : margelle (cylindre), deux montants, treuil, seau, petit toit à deux pans
      const px = VIL.puits.x, mY = VIL.puits.margelle;
      for (const sx of [-50, 50]) pc(box(px + sx - 5, 1166, px + sx + 5, mY + 4), '#5a3a22', null, 9600 + sx);
      pc(box(px - 58, 1176, px + 58, 1186), '#6a4428', null, 9603); strokePts([[px + 58, 1181], [px + 72, 1181], [px + 72, 1196]], '#5a3a22', 3);
      strokePts([[px, 1186], [px, 1236]], '#9a8a6a', 1.6);
      pc([[px - 13, 1236, 1], [px + 13, 1236, 1], [px + 10, 1262, 1], [px - 10, 1262, 1]], '#6a4a2a', () => { strokePts([[px - 13, 1242], [px + 13, 1242]], '#3a3030', 1.6); strokePts([[px - 11, 1256], [px + 11, 1256]], '#3a3030', 1.6); }, 9604);
      pc(sh([[px - 74, 1170], [px + 74, 1170], [px, 1124]]), '#6a4428', () => lattes(px - 70, 1126, px + 70, 1170, 4, 'rgba(30,15,5,0.4)'), 9605); neige(sh([[px - 72, 1164], [px, 1120], [px + 72, 1164], [px, 1140]]), 9606);
      pc([[px - 66, mY, 1], [px + 66, mY, 1], [px + 66, BACK, 1], [px - 66, BACK, 1]], '#9a9080', () => { const R = M.rng(9); for (let y = mY + 8; y < BACK; y += 22) for (let x = px - 64 + (y % 44 ? 0 : 14); x < px + 64; x += 28 + R() * 8) strokePts(box(x, y, x + 24, y + 18).concat([[x, y]]), 'rgba(50,40,30,0.4)', 1); shade(px + 66, 0, px - 66, 0, 0.35, [px - 70, mY - 10, px + 70, BACK]); }, 9607);
      fillPts(ell(px, mY, 66, 13, 22), '#b0a694'); fillPts(ell(px, mY, 52, 8, 20), '#1e1a18');
      bordNeige(px - 66, px - 20, mY - 4, 6, 9608); bordNeige(px + 22, px + 66, mY - 4, 6, 9609);
    }, 8);
  }
  function makeVillageAvant() {
    return plein((c) => {
      // plessis (branches tressées entre des pieux)
      const P0 = VIL.plessis;
      for (let x = P0.x0; x <= P0.x1; x += 70) pc([[x - 6, BACK], [x + 6, BACK], [x + 5, P0.y - 14], [x, P0.y - 22], [x - 5, P0.y - 14]], '#5a3a22', null, 9620 + x);
      for (let r = 0; r < 7; r++) { const y = P0.y + 8 + r * 16, pts = []; for (let x = P0.x0 - 10; x <= P0.x1 + 10; x += 10) pts.push([x, y + Math.sin((x - P0.x0) / 70 * PI + r * PI) * 5]); strokePts(pts, r % 2 ? '#7a5a36' : '#6a4a2a', 7); strokePts(pts, 'rgba(255,220,170,0.25)', 1.4); }
      bordNeige(P0.x0 - 8, P0.x1 + 8, P0.y + 2, 8, 9630);
      // fagots
      for (const [fx, fy] of [[858, 1384], [906, 1384], [882, 1352]]) { for (let i = 0; i < 10; i++) strokePts([[fx - 30, fy - 10 + i * 2.2], [fx + 30, fy - 12 + i * 2.4]], i % 2 ? '#6a4a2a' : '#7a5a36', 2.4); strokePts([[fx - 8, fy - 14], [fx - 8, fy + 12]], '#c9a046', 2); strokePts([[fx + 10, fy - 14], [fx + 10, fy + 12]], '#c9a046', 2); }
      bordNeige(850, 916, 1340, 5, 9631);
      // tonneau
      pc([[950, BACK], [1022, BACK], [1028, 1350], [1022, 1310], [950, 1310], [944, 1350]], '#7a5232', () => { for (const y of [1322, 1372]) fillPts(box(940, y, 1030, y + 8), '#3a3430'); for (let x = 956; x < 1020; x += 12) strokePts([[x, 1312], [x, BACK]], 'rgba(30,15,5,0.4)', 1); }, 9632);
      neige(ell(986, 1310, 38, 7, 14), 9633);
      // souche et hache plantée
      const [sx, sy] = VIL.souche;
      pc([[sx - 34, BACK], [sx + 34, BACK], [sx + 28, sy], [sx - 28, sy]], '#5a4028', () => { for (let x = sx - 26; x < sx + 28; x += 9) strokePts([[x, sy + 4], [x - 2, BACK]], 'rgba(30,15,5,0.4)', 1); }, 9634);
      fillPts(ell(sx, sy, 28, 7, 14), '#c8a878'); strokePts(ell(sx, sy, 16, 4, 12).concat([[sx + 16, sy]]), 'rgba(100,70,40,0.6)', 1);
      strokePts([[sx + 6, sy - 2], [sx + 46, sy - 74]], '#7a5232', 5); pc([[sx - 4, sy - 2], [sx + 18, sy - 12], [sx + 22, sy + 4], [sx + 4, sy + 6]], '#8a8a92', null, 9635);
    }, 8);
  }
  function makeArbreWing() {
    return M.withShadow(M.cutFlat(420, 1320, 120, 1310, (c) => {
      const br = (x0, y0, a, l, w, d) => { const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; strokePts([[x0, y0], [(x0 + x1) / 2 + Math.sin(a) * 6, (y0 + y1) / 2], [x1, y1]], '#4a3a2c', w); if (w > 4) strokePts([[x0, y0 - w * 0.4], [x1, y1 - w * 0.4]], '#eef2f6', w * 0.35); if (d > 0) { br(x1, y1, a - 0.45, l * 0.7, w * 0.62, d - 1); br(x1, y1, a + 0.35, l * 0.62, w * 0.6, d - 1); } };
      pc([[-34, 0], [30, 0], [22, -400], [16, -800], [6, -1150], [-8, -1150], [-14, -800], [-22, -400]], '#4a3a2c', () => { for (let y = -1100; y < 0; y += 30) strokePts([[-20, y], [-8, y + 14]], 'rgba(20,10,5,0.5)', 1); }, 9640);
      br(10, -760, -0.5, 170, 16, 3); br(4, -980, -0.9, 150, 12, 3); br(14, -560, -0.15, 160, 13, 2); br(0, -1120, -1.3, 120, 9, 2);
    }), 8);
  }
  function poule(g, x, y, s, dir, ph, marche) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s);
    const pk = marche ? 0 : Math.max(0, Math.sin(g * 2.6 + ph)) ** 6, bob = marche ? Math.abs(Math.sin(g * 10 + ph)) * 2 : 0;
    const lg = marche ? Math.sin(g * 10 + ph) * 6 : 0;
    strokePts([[-2, -14], [-2 + lg, 0]], '#c98a2a', 2.4); strokePts([[6, -14], [6 - lg, 0]], '#c98a2a', 2.4);
    fillPts([[-24, -26 - bob], [-14, -40 - bob], [6, -40 - bob], [18, -30 - bob], [16, -16 - bob], [0, -12 - bob], [-18, -16 - bob]], '#e8dcc4');
    fillPts([[-22, -28 - bob], [-36, -46 - bob], [-30, -24 - bob]], '#6a4a2a'); strokePts([[-14, -30 - bob], [4, -24 - bob]], 'rgba(120,100,70,0.6)', 1.4);
    c.save(); c.translate(14, -32 - bob); c.rotate(pk * 1.1);
    fillPts(ell(4, -10, 7, 8, 10), '#e8dcc4'); fillPts([[0, -18], [4, -24], [8, -19], [11, -23], [12, -16]], '#c0302a'); fillPts([[10, -10], [18, -8], [10, -6]], '#d8a030'); dot(6, -12, 1.4, '#101010'); fillPts([[6, -4], [10, -4], [8, 2]], '#c0302a');
    c.restore(); c.restore();
  }
  // LUC.villageHiver(t, o) : o.corbeau 0..1 (un corbeau vient se poser sur le toit du puits : posé dès 0,7) ; o.poule 0..1 (une poule traverse de droite à gauche) ;
  //   o.neige 0..1 (flocons, défaut 0,6) ; o.fumee (true). Place libre au centre-haut pour la roue (moyeu VIL.roue = (540, 640)).
  LUC.villageHiver = function (t, o) {
    o = o || {}; const c = cx_(), g = M.tg(t), K = LUC.K;
    c.drawImage(K.villageCiel, 0, 0);
    M.nuages(t, { y0: 240, y1: 520, n: 4, vit: 10, seed: 23, col: '#ece4e2', brume: 0.25 });
    M.oiseaux(g, { x0: 1160, x1: -100, y: 420, t0: 0, dur: 14, n: 4, s: 0.7, seed: 12, boucle: true, col: '#26242a', brume: 0.1 });
    posePlein(K.villageFond);
    if (o.fumee !== false) for (const [i, ch] of VIL.cheminees.entries()) M.fumee(t, { x: ch[0], y: ch[1], s: 0.85, n: 6, haut: 230, vent: 50, seed: 7 + i, a: 0.6, col: '#e2dcd4' });
    posePlein(K.villageMilieu, { cast: { a: 0.25, dx: 10, dy: 4 } });
    if (o.corbeau != null && o.corbeau > 0) { const k = clamp(o.corbeau), u = ease(Math.min(1, k / 0.7)), x = lerp(980, VIL.puits.toit[0] + 6, u), y = lerp(560, VIL.puits.toit[1] - 4, u) - Math.sin(u * PI) * 70; corbeauPose(g, x, y, 1.1, -1, u < 0.98); }
    for (const [i, P2] of VIL.poules.entries()) poule(g, P2[0] + Math.sin(g * 0.4 + i) * 6, P2[1], 0.95, P2[2], i * 2.1, false);
    if (o.poule != null && o.poule > 0 && o.poule < 1) poule(g, lerp(1080, -40, o.poule), 1392, 1, -1, 0, true);
    posePlein(K.villageAvant, { cast: { a: 0.28, dx: 12, dy: 5 } });
    raw((cc) => { cc.strokeStyle = '#6a4a2a'; cc.lineWidth = 2; for (let i = 0; i < 16; i++) { const x = VIL.plessis.x0 + i * 22 + 6, sw = Math.sin(g * 2.4 + i * 1.3) * 3 + Math.sin(g * 5.1 + i) * 1.2; cc.beginPath(); cc.moveTo(x, VIL.plessis.y + 4); cc.quadraticCurveTo(x + sw * 0.5, VIL.plessis.y - 10, x + sw + (i % 2 ? 6 : -4), VIL.plessis.y - 22 - (i % 3) * 6); cc.stroke(); } });
    M.flat(K.arbre, 70, BACK, { rot: 0.006 * Math.sin(g * 0.7), cast: { a: 0.25, dx: 14, dy: 5 } });
    flocons(g, 60, o.neige == null ? 0.6 : o.neige, 52);
  };
  function corbeauPose(g, x, y, s, dir, vol) {
    const c = cx_(); c.save(); c.translate(x, y); c.scale(s * dir, s); const col = '#1e1c22';
    if (vol) { const w = Math.sin(g * 14) * 0.9; fillPts([[-6, -6], [-30, -16 - 22 * w], [-14, -2]], col); fillPts([[6, -6], [30, -16 - 22 * w], [14, -2]], col); }
    fillPts([[-22, -8], [-6, -16], [12, -16], [20, -10], [8, -2], [-12, -2]], col); fillPts(ell(18, -18, 7, 6, 10), col); fillPts([[24, -20], [34, -17], [24, -15]], '#2a2a30'); dot(19, -20, 1.4, '#d8d8d0');
    if (!vol) { strokePts([[0, -2], [0, 6]], '#2a2a30', 1.6); strokePts([[6, -2], [8, 6]], '#2a2a30', 1.6); fillPts([[-22, -8], [-34, -4], [-22, -4]], col); }
    c.restore();
  }

  // =====================================================================
  // 8) INIT — pré-rendus (à appeler dans S.init)
  // =====================================================================
  LUC.init = function () {
    if (LUC.K) return LUC.K;
    LUC._buf = M.mkCanvas(M.W, BACK + 60); LUC._bufS = M.mkCanvas(240, 160);
    LUC.K = { roue: makeRoue(), medaillon: makeMedaillon(), rueFond: makeRueFond(), maisonL: makeMaisonL(), maisonV: makeMaisonV(), rueAvant: makeRueAvant(), jardiniere: makeJardiniere(),
      villageCiel: makeVillageCiel(), villageFond: makeVillageFond(), villageMilieu: makeVillageMilieu(), villageAvant: makeVillageAvant(), arbre: makeArbreWing() };
    return LUC.K;
  };
})();
