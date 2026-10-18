// persos.js — « Le Centre Pompidou, Notre-Dame de la tuyauterie » : marionnettes, accessoires et décors PROPRES À CETTE VIDÉO. Espace M.bou (alias BOU). Appeler BOU.init() dans S.init.
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni logo. Déterministe (hash ; jamais Math.random).
// MARIONNETTES : BOU.pompidou / piano / rogers / madame / critique (pose,x,y,s,o) — (x,y) = pieds ; BOU.caniche(t,x,y,s,o).
// OBJETS TENUS (tenu / tenuB) : 'plan' 'journal' 'lorgnette' ou une FONCTION de dessin (o) => {…} (prise à l'origine) ; BOU.pt(r, nom[, arriere]).
// ACCESSOIRES : BOU.plan, rouleau, pile, medaille, journal, lorgnette (x,y,s,o) ; BOU.laisse(p0,p1,o).
// DÉCORS : BOU.init() → BOU.K ; BOU.toits(t,o) ; BOU.plateau(t,o) ; BOU.notreDame(x,y,s,o) ; BOU.centre(t,x,y,s,o) ; BOU.centrePt(o,nom,x,y,s).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const BOU = (M.bou = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];
  const W = 1080, BACK = 1395;

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
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
  function offsetLine(line, d) {
    const o = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      o.push([line[i][0] - dy * d, line[i][1] + dx * d]);
    }
    return o;
  }
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function rounded(line, R) {                                      // coins arrondis d'une polyligne (coudes de tuyaux)
    const o = [line[0]];
    for (let i = 1; i < line.length - 1; i++) {
      const a = line[i - 1], b = line[i], c2 = line[i + 1];
      const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c2[0] - b[0], c2[1] - b[1]);
      const r1 = Math.min(R, l1 / 2), r2 = Math.min(R, l2 / 2);
      const p0 = [b[0] + (a[0] - b[0]) * r1 / l1, b[1] + (a[1] - b[1]) * r1 / l1], p2 = [b[0] + (c2[0] - b[0]) * r2 / l2, b[1] + (c2[1] - b[1]) * r2 / l2];
      o.push(...qbez(p0, b, p2, 8));
    }
    o.push(line[line.length - 1]); return o;
  }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  function rrect(x0, y0, x1, y1, r) {
    return ep(x1 - r, y0 + r, r, r, 4, -PI / 2, 0).concat(ep(x1 - r, y1 - r, r, r, 4, 0, PI / 2), ep(x0 + r, y1 - r, r, r, 4, PI / 2, PI), ep(x0 + r, y0 + r, r, r, 4, PI, PI * 1.5));
  }
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const k01 = (v) => ease(clamp(v || 0));
  const vOf = (v, o) => (typeof v === 'function' ? v(o) : v);
  function scallop(pts, per, amp) {                                // contour bouclé (cheveux frisés, fourrure, pompons)
    const out = [], N = pts.length; let cxm = 0, cym = 0;
    for (const p of pts) { cxm += p[0]; cym += p[1]; } cxm /= N; cym /= N;
    for (let i = 0; i < N; i++) {
      const a = pts[i], b = pts[(i + 1) % N];
      for (let j = 0; j < per; j++) {
        const u = j / per, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), dx = x - cxm, dy = y - cym, l = Math.hypot(dx, dy) || 1, k = amp * Math.sin(u * PI);
        out.push([x + dx / l * k, y + dy / l * k]);
      }
    }
    return out;
  }
  function fluff(cx, cy, rx, ry, n, amp, seed, pointu) {
    const o = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, r = 1 + (i % 2 ? amp : -amp * 0.35) * (0.6 + 0.4 * hash(seed + i * 1.7)); o.push(pointu && i % 2 ? [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, 1] : [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
    return o;
  }
  BOU.geo = { ep, ell, ribbon, qbez, rrect, box, rounded };

  // ------------------------------------------------------------ bras et jambes à articulations rondes
  const R_COUDE = 11.5, LA = 96, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96);
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const legC = (len, wt, rk) => ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.5], [rk + 0.5, len - 4]], ep(0, len, rk, rk, 10, 0, PI), [[-rk - 0.5, len - 4], [-wt + 1, len * 0.5]]);
  const FOOT = (ak, len) => ep(0, 0, ak, ak, 8, PI, TAU).concat([[ak + 2, 2], [len * 0.62, 4], [len * 0.92, 8], [len, 14, 1], [-15, 16, 1], [-15, 6]]);
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant', 'arriere' ; le coude plié vers l'avant passe d'abord
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a);
      const sc = (pick === 'avant' ? E[0] : pick === 'arriere' ? -E[0] : E[1]) + (b <= 0.05 ? 1000 : 0);
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }

  // =====================================================================
  // OBJETS — chacun dessiné dans son repère : seul (accessoire) ou tenu (pièce 'objet' de l'avant-bras)
  // =====================================================================
  const IV = '#ece4cf', IVD = '#cfc3a5', IVB = '#e2d8bf';
  const PLAN = { L: 200, H: 240 };
  function rollPiece(y, r, L, col, seed) {
    pc(rrect(0, y - r, L, y + r, r * 0.95), col, () => {
      strokePts([[4, y - r * 0.45], [L - 4, y - r * 0.45]], 'rgba(255,255,255,0.65)', 1.5);
      strokePts([[4, y + r * 0.5], [L - 4, y + r * 0.5]], 'rgba(110,90,60,0.32)', Math.max(1.2, r * 0.35));
    }, seed);
    pc(ell(L - 1, y, Math.max(2, r * 0.38), r, 12), IVD, () => {
      for (let k = 1; k <= 3; k++) strokePts(ep(L - 1, y, r * 0.3 * k / 3, r * k / 3.4, 8, -PI / 2, PI * 1.2), 'rgba(110,90,60,0.55)', 0.9);
    }, seed + 1);
  }
  // plan roulé / déroulé VU DE DOS ; prise (0,0) = bout proche du rouleau du haut ; la feuille s'étend vers +x et pend vers +y
  function drawPlan(o) {
    const d = clamp(o.deroule || 0), L = PLAN.L, H = PLAN.H * d;
    if (H > 4) {
      pc([[2, 0, 1], [L - 2, 0, 1], [L - 2, H, 1], [2, H, 1]], IVB, () => {
        if (!SIL()) {                                                         // transparence floue des traits du recto (illisible)
          const c = cx_(); c.save(); c.filter = 'blur(4px)'; c.strokeStyle = 'rgba(70,85,110,0.13)'; c.lineWidth = 5;
          c.strokeRect(L * 0.16, H * 0.18, L * 0.68, H * 0.5);
          c.beginPath(); c.moveTo(L * 0.16, H * 0.68); c.lineTo(L * 0.84, H * 0.18); c.stroke();
          c.beginPath(); c.arc(L * 0.62, H * 0.8, Math.min(L, H) * 0.09, 0, TAU); c.stroke();
          c.restore();
        }
        hatch(null, 0.6, 5, 0.07, 1, P.encre, [0, 0, L, H]); shade(0, 0, 0, H, 0.14, [0, 0, L, H]);
        strokePts([[4, 6], [L - 4, 6]], 'rgba(120,100,70,0.25)', 1);
      }, 7101);
      rollPiece(H, 6 + 7 * (1 - d), L, IV, 7102);
      rollPiece(0, 6, L, IV, 7104);
    } else rollPiece(0, 13, L, IV, 7104);
  }
  const TEINTES = { ivoire: '#e8dfc6', bleu: '#a9c0d4', ocre: '#d3a965', rose: '#dca9a2' }, TLIST = ['ivoire', 'bleu', 'ocre', 'rose'];
  const RUBANS = ['#8e2a26', '#23304a', '#4d6b45', '#7a4f8a'];
  function teinteIdx(v) { if (typeof v === 'number') return ((Math.round(v) % 4) + 4) % 4; const i = TLIST.indexOf(v); return i < 0 ? 0 : i; }
  // rouleau du concours : centre (0,0), 150 × 26
  function drawRouleau(o) {
    const i = teinteIdx(o.teinte), col = (typeof o.teinte === 'string' && o.teinte[0] === '#') ? o.teinte : TEINTES[TLIST[i]], rub = o.ruban || RUBANS[(i + 1) % 4];
    pc(rrect(-75, -13, 75, 13, 11), col, () => {
      strokePts([[-70, -6], [70, -6]], 'rgba(255,255,255,0.55)', 2); strokePts([[-70, 7], [70, 7]], 'rgba(60,40,20,0.22)', 3.5); hatch(null, 0.9, 4.5, 0.1, 1, P.encre, [-76, -14, 76, 14]);
    }, 7201 + i);
    pc(ell(72, 0, 5, 12.5, 12), M.mixc(col, '#6b5a40', 0.25), () => { for (let k = 1; k <= 3; k++) strokePts(ep(72, 0, 1.4 * k, 4 * k, 8, -PI / 2, PI * 1.2), 'rgba(90,70,40,0.55)', 0.9); }, 7206);
    pc(box(-6, -14, 6, 14), rub, () => strokePts([[-4, -12], [-4, 12]], 'rgba(255,255,255,0.3)', 1), 7207);
    pc([[0, -13], [-15, -27], [-6, -31], [2, -15]], rub, null, 7208); pc([[0, -13], [13, -28], [16, -20], [2, -12]], rub, null, 7209);
  }
  function drawRouleauSimple(col, rub) {                              // version légère pour la pile (pas de pièce : rapide)
    fillPts(rrect(-75, -13, 75, 13, 11), col, 0, 0);
    strokePts([[-70, -6], [70, -6]], 'rgba(255,255,255,0.5)', 2); strokePts([[-70, 7], [70, 7]], 'rgba(60,40,20,0.22)', 3.5);
    fillPts(ell(72, 0, 5, 12.5, 10), M.mixc(col, '#6b5a40', 0.3), 0, 0);
    fillPts(box(-6, -14, 6, 14), rub, 0, 0);
    strokePts(rrect(-75, -13, 75, 13, 11).concat([rrect(-75, -13, 75, 13, 11)[0]]), 'rgba(40,30,20,0.55)', 1.1);
  }
  // médaille : centre du disque (0,0), Ø 60 ; o.boucle (true) = ruban en boucle au-dessus (sommet en (0,-104)) ; sinon deux brins courts
  function drawMedaille(o) {
    const NU = '#23304a';
    if (o.boucle !== false) {
      pc([[-24, -26], [-30, -60], [-12, -104], [-2, -104], [-16, -60], [-10, -26]], NU, () => strokePts([[-22, -60], [-8, -100]], 'rgba(255,255,255,0.2)', 1.4), 7301);
      pc([[24, -26], [30, -60], [12, -104], [2, -104], [16, -60], [10, -26]], '#1b2539', () => strokePts([[22, -60], [8, -100]], 'rgba(255,255,255,0.14)', 1.4), 7302);
    }
    pc(box(-14, -34, 14, -22), NU, null, 7303);
    pc(ell(0, 0, 30, 30, 26), '#c9a24a', () => {
      strokePts(ep(0, 0, 25, 25, 24, 0, TAU), '#e6cb7c', 2.2); strokePts(ep(0, 0, 17, 17, 24, 0, TAU), 'rgba(120,90,30,0.6)', 1.5);
      fillPts(ell(0, 0, 9, 9, 14), '#d9b862', 0, 0); strokePts(ep(0, 0, 30, 30, 10, PI * 1.1, PI * 1.6), 'rgba(255,245,200,0.8)', 2.4);
      shade(20, 20, -20, -20, 0.3, [-32, -32, 32, 32]);
    }, 7304);
  }
  // journal plié : (0,0) au centre, 80 × 120, colonnes de traits ondulés, aucune lettre ; prise (0,30)
  function drawJournal(o) {
    pc([[-40, -60, 1], [40, -60, 1], [40, 60, 1], [-40, 60, 1]], '#e6e1d3', () => {
      fillPts(box(-34, -53, 34, -43), 'rgba(40,36,32,0.7)');
      strokePts([[-36, -38], [36, -38]], 'rgba(40,36,32,0.6)', 1.2);
      fillPts(box(4, -32, 34, -8), '#8f8a80'); strokePts([[8, -14], [16, -22], [24, -16], [32, -26]], 'rgba(50,45,40,0.6)', 1.2);
      for (const [x0, y0, y1] of [[-34, -32, 52], [-14, -32, 52], [6, -2, 52], [24, -2, 52]]) for (let y = y0; y <= y1; y += 6.5) {
        const pts = []; for (let k = 0; k <= 5; k++) pts.push([x0 + k * 2.8, y + Math.sin(k * 1.9 + y) * 1.1]); strokePts(pts, 'rgba(60,55,50,0.45)', 1);
      }
      strokePts([[0, -60], [0, 60]], 'rgba(90,80,60,0.4)', 1.4); shade(-40, 0, 40, 0, 0.18, [-40, -60, 40, 60]);
    }, 7401);
  }
  // face-à-main (lorgnette à manche) : prise (0,0) = bas du manche ; verres en (7,-72)
  function drawLorgnette(o) {
    pc([[-3, 6], [3, 6], [4, -50], [7, -60], [1, -62], [-3, -52]], '#3a2620', () => strokePts([[-1, 2], [0, -48]], 'rgba(255,220,180,0.35)', 1), 7501);
    for (const lx of [-3, 17]) pc(ell(lx, -72, 9, 7, 14), '#c9a24a', () => { fillPts(ell(lx, -72, 6.5, 4.8, 12), 'rgba(205,228,236,0.85)', 0, 0); strokePts([[lx - 3, -74], [lx + 1, -76]], 'rgba(255,255,255,0.9)', 1.1); }, 7502 + lx);
    pc(box(5, -74, 9, -70), '#c9a24a', null, 7530);
  }
  // registre : grip = point tenu ; p2 = seconde prise ; pts = points nommés ; base = (x,y) de l'accessoire seul
  const OBJ = {
    plan: { draw: drawPlan, grip: [0, 0], p2: () => [24, 0], pts: { bout: [PLAN.L, 0], bas: (o) => [PLAN.L / 2, PLAN.H * clamp(o.deroule || 0)], centre: (o) => [PLAN.L / 2, PLAN.H * clamp(o.deroule || 0) / 2] }, base: [PLAN.L / 2, 0] },
    journal: { draw: drawJournal, grip: [0, 30], pts: { haut: [0, -60], centre: [0, 0] }, base: [0, 60] },
    lorgnette: { draw: drawLorgnette, grip: [0, 0], pts: { verre: [7, -72] }, base: [0, 6] },
  };
  BOU.OBJ = OBJ;
  function heldOpts(name, o, p) { const ob = typeof name === 'function' ? null : OBJ[name]; return Object.assign({ t: p.t || 0 }, (ob && ob.held) || {}, o || {}); }
  function heldDraw(name, o, p) {
    const c = cx_(), oo = heldOpts(name, o, p);
    if (typeof name === 'function') { c.save(); name(oo); c.restore(); return; }
    const ob = OBJ[name]; if (!ob) return;
    const g = vOf(ob.grip, oo), k = oo.taille || 1;
    c.save(); c.scale(k, k); c.translate(-g[0], -g[1]); ob.draw(oo); c.restore();
  }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtsPaint = () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); hatch(null, 0.9, 3.4, 0.15); };
  const has = (v) => v && v !== 'rien';
  function heldParts(skin, seed) {
    return {
      objet: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 1, pts: OFFP, extra: (p) => { if (has(p.tenu)) heldDraw(p.tenu, p.tenuO, p); } },
      doigts: { parent: 'armF_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 2, pts: (p) => (has(p.tenu) ? DOIGTS : OFFP), paint: doigtsPaint },
      objetB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: '#000', seed: seed + 3, pts: OFFP, extra: (p) => { if (has(p.tenuB)) heldDraw(p.tenuB, p.tenuBO, p); } },
      doigtsB: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 4, pts: (p) => (has(p.tenuB) && !p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
      doigtsB2: { parent: 'armB_lo', at: [4, 96], noRivet: true, base: skin, seed: seed + 6, pts: (p) => (p._deux ? DOIGTS : OFFP), paint: doigtsPaint },
    };
  }
  BOU.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = typeof name === 'function' ? null : OBJ[name]; if (!ob || !ob.pts[nom]) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, g = vOf(ob.grip, oo), q = vOf(ob.pts[nom], oo), k = oo.taille || 1;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };

  // =====================================================================
  // POSES — préparation, IK interne (repère du torse), gestes communs, seconde main
  // =====================================================================
  function prep(p) {
    p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) });
    const A = q.ang;
    if (A.legF != null) { A.legF_up = (A.legF_up || 0) + A.legF; delete A.legF; }
    if (A.legB != null) { A.legB_up = (A.legB_up || 0) + A.legB; delete A.legB; }
    q._libreF = A.armF_up == null && A.armF_lo == null; q._libreB = A.armB_up == null && A.armB_lo == null;
    return q;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function armTo(q, def, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(def.parts[arm + '_up'].at, T, pick), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
  }
  function headPt(q, def, hx, hy) { const h = def.parts.head; return mp(new DOMMatrix().translate(h.at[0], h.at[1]).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function toTorso(env, q, P0) { const { mats } = M.partMatrices(env.def, q, env.x, env.y, env.s, env.dir); const p = new DOMPoint(P0[0], P0[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; }
  function plier(q, def, th) {
    if (!th) return; const h = -def.hipY;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - h * Math.sin(th); q.dy = (q.dy || 0) + h * (1 - Math.cos(th));
    q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
  }
  function marche(q, k, t, amp) {
    if (k <= 0) return; const ph = t * TAU * 1.5, s = Math.sin(ph), A = q.ang; amp = amp || 0.34;
    A.legF_up = (A.legF_up || 0) + amp * s * k; A.legB_up = (A.legB_up || 0) - amp * s * k;
    A.legF_lo = (A.legF_lo || 0) + 0.42 * Math.max(0, Math.sin(ph - 1.3)) * k; A.legB_lo = (A.legB_lo || 0) + 0.42 * Math.max(0, Math.sin(ph + PI - 1.3)) * k;
    A.piedF = (A.piedF || 0) - 0.5 * (A.legF_up + A.legF_lo) * k; A.piedB = (A.piedB || 0) - 0.5 * (A.legB_up + A.legB_lo) * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    if (q._libreF) A.armF_up = (A.armF_up || 0) - 0.18 * s * k;
    if (q._libreB) A.armB_up = (A.armB_up || 0) + 0.18 * s * k;
  }
  // gestes communs à toutes les marionnettes humaines (chaque valeur 0..1 ; `cible` [x,y] écran)
  function gestes(q, env) {
    const def = env.def, A = q.ang, t = q.t || 0;
    const C = () => (q.cible ? toTorso(env, q, q.cible) : [120, -118]);
    const ma = k01(q.marche), re = k01(q.recul), sa = k01(q.salut), inc = k01(q.incline);
    marche(q, ma, t);
    if (re > 0) { q.tilt = (q.tilt || 0) - 0.06 * re; q.dx = (q.dx || 0) - 16 * re; A.head = (A.head || 0) - 0.1 * re; A.legF_up = (A.legF_up || 0) - 0.22 * re; A.legB_up = (A.legB_up || 0) + 0.12 * re; }
    if (inc > 0) { A.head = (A.head || 0) + 0.32 * inc; q.tilt = (q.tilt || 0) + 0.035 * inc; }
    if (sa > 0) {
      plier(q, def, 0.5 * sa); A.head = (A.head || 0) + 0.3 * sa;
      blend(q, 'armF_up', -0.35, sa); blend(q, 'armF_lo', -1.6, sa); blend(q, 'armB_up', 0.9, sa); blend(q, 'armB_lo', -0.25, sa);
      if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open';
    }
    const br = k01(q.brandir), de = clamp(q.deroule || 0), ec = k01(q.ecarte), ti = k01(q.tire), aj = k01(q.ajuste), to = k01(q.touche), ta = k01(q.tape),
      bs = k01(q.brosse), ha = k01(q.hanche), me = k01(q.menton), ap = k01(q.applaudit), nz = k01(q.nez), co = k01(q.collier);
    if (br > 0) {
      const h = q.haut == null ? (env.hautDef || 0) : clamp(q.haut);
      blend(q, 'armF_up', lerp(-1.45, -2.25, h), br); blend(q, 'armF_lo', lerp(-0.45, -0.7, h), br);
      if (q.tenu === 'plan') A.objet = (A.objet || 0) - 0.45 * br;
    }
    if (de > 0) {
      const ka = ease(clamp(de * 3)), b = clamp(q.bas || 0);
      blend(q, 'armF_up', lerp(-1.25, -0.8, b), ka); blend(q, 'armF_lo', lerp(-0.55, -0.2, b), ka);
      q.deuxMains = true; q.tenuO = Object.assign({ deroule: ease(clamp((de - 0.2) / 0.8)) }, q.tenuO);
    }
    if (ec > 0) {
      blend(q, 'armF_up', -1.3, ec); blend(q, 'armF_lo', -0.22, ec); blend(q, 'armB_up', 1.05, ec); blend(q, 'armB_lo', -0.3, ec);
      A.head = (A.head || 0) - 0.06 * ec; if (ec > 0.4) { if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
    }
    const deux = Math.max(ti, aj);
    if (deux > 0) {
      const T = C();
      armTo(q, def, 'armF', [T[0] + 4, T[1] - 8], 'bas', deux); armTo(q, def, 'armB', [T[0] - 4, T[1] + 12], 'bas', deux);
      if (ti > 0) { q.tilt = (q.tilt || 0) - 0.08 * ti; A.legF_up = (A.legF_up || 0) - 0.16 * ti; A.legB_up = (A.legB_up || 0) + 0.1 * ti; }
      q.handF = has(q.tenu) ? q.handF : 'fist'; q.handB = 'fist';
    }
    if (to > 0) { armTo(q, def, 'armF', C(), 'bas', to); if (!has(q.tenu) && to > 0.5 && !q.handF) q.handF = 'fist'; }
    if (ta > 0) { const T = C(); armTo(q, def, 'armF', [T[0] - 14 * Math.max(0, Math.sin(t * 11)), T[1]], 'bas', ta); if (!has(q.tenu)) q.handF = 'fist'; }
    if (bs > 0) { const T = C(); armTo(q, def, 'armF', [T[0] - 6, T[1] + 20 * Math.sin(t * 12)], 'bas', bs); if (!has(q.tenu)) q.handF = 'open'; }
    if (ha > 0) { armTo(q, def, 'armF', [16, -12], 'arriere', ha); if (!has(q.tenu)) q.handF = 'fist'; }
    if (me > 0) { armTo(q, def, 'armF', headPt(q, def, 28, 10), 'bas', me); A.head = (A.head || 0) - 0.22 * me; if (!has(q.tenu)) q.handF = 'fist'; }
    if (ap > 0) {
      const sep = 15 * (0.5 + 0.5 * Math.cos(t * TAU * 2.4)), y0 = -100;
      armTo(q, def, 'armF', [80 + sep, y0], 'bas', ap); armTo(q, def, 'armB', [74 - sep, y0 - 12], 'bas', ap);
      if (ap > 0.4) { if (!has(q.tenu)) q.handF = 'open'; if (!has(q.tenuB)) q.handB = 'open'; }
    }
    if (nz > 0) { armTo(q, def, 'armF', headPt(q, def, 44, -24), 'bas', nz); A.head = (A.head || 0) + 0.06 * nz; if (!has(q.tenu)) q.handF = 'fist'; }
    if (co > 0) { armTo(q, def, 'armF', env.collier || [22, -150], 'bas', co); if (!has(q.tenu)) q.handF = 'open'; }
  }
  function finish(q, def) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !(q.handF && q.handF !== 'fist')) q.handF = 'fist';
    if (has(q.tenuB) && !(q.handB && q.handB !== 'fist')) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    q._deux = false;
    if (q.deuxMains && typeof q.tenu === 'string' && OBJ[q.tenu] && OBJ[q.tenu].p2) {
      const ob = OBJ[q.tenu], oo = heldOpts(q.tenu, q.tenuO, q), g = vOf(ob.grip, oo), SF = def.parts.armF_up.at;
      const Hf = new DOMMatrix().translate(SF[0], SF[1]).rotate((A.armF_up || 0) * D).translate(0, LA).rotate((A.armF_lo || 0) * D).translate(4, 96).rotate((A.objet || 0) * D).translate(-g[0], -g[1]);
      const sol = ik2(def.parts.armB_up.at, mp(Hf, ob.p2(oo)), 'bas');
      A.armB_up = sol.a; A.armB_lo = sol.b; q.handB = 'fist'; q._deux = true;
    }
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ slot: M.ST.slotF }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q;
    if (has(q.tenu)) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (has(q.tenuB)) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    return r;
  }
  function wrap(def, poseFn, sDef, envX) {
    return (pose, x, y, s, o) => {
      o = o || {}; s = s == null ? sDef : s;
      const q = prep(pose), env = Object.assign({ def, x, y, s, dir: o.dir || 1 }, envX || {});
      poseFn(q, env);
      finish(q, def);
      const r = run(def, q, x, y, s, o);
      if (def._after) def._after(r, q, env);
      return r;
    };
  }

  // ---------------- pièces de corps communes
  function upDef(at, base, seed, wt, paint) { return { parent: 'torso', at, pts: armR(LA, wt), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.28)) }; }
  function foreDef(parent, base, skin, back, seed, o) {
    o = o || {}; const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base, seed, paint: (p) => {
      if (o.lines) o.lines();
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (o.cuff) fillPts([[-14, 62, 1], [14, 62, 1], [15, 78, 1], [-14, 78, 1]], o.cuff);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.3 : 0.2);
    } };
  }
  function legParts(L, seed) {
    const thigh = (back) => ({ parent: 'torso', at: [back ? -L.hx : L.hx, -2], pts: legC(L.th, L.wt, L.kt), base: back ? L.colD : L.col, seed: seed + (back ? 1 : 2), noRivet: !!back,
      paint: (p) => { if (L.thighPaint) L.thighPaint(back, p); hatch(back ? null : [[-L.wt, -10], [-4, -10], [-4, L.th], [-L.wt, L.th]], 0.8, 3.8, back ? 0.3 : 0.22); } });
    const shin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, L.th], pts: legC(L.sh, L.kt, L.ak), base: back ? (L.shinD || L.colD) : (L.shin || L.col), seed: seed + (back ? 3 : 4), noRivet: !!back,
      paint: (p) => { if (L.shinPaint) L.shinPaint(back, p); hatch(back ? null : [[-L.kt, -6], [-3, -6], [-3, L.sh], [-L.kt, L.sh]], 0.8, 3.8, back ? 0.3 : 0.2); } });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, L.sh], pts: L.foot || FOOT(L.ak + 1, L.fl), base: back ? L.shoeD : L.shoe, seed: seed + (back ? 5 : 6), noRivet: true,
      paint: () => { if (L.shoePaint) L.shoePaint(back); else strokePts([[4, 4], [L.fl * 0.7, 7]], 'rgba(255,255,255,0.25)', 1.2); } });
    return { legB_up: thigh(true), legB_lo: shin(true), piedB: foot(true), legF_up: thigh(false), legF_lo: shin(false), piedF: foot(false) };
  }
  const ORDER = (heads, afterTorso, onArm) => ['armB_up', 'armB_lo', 'objetB', 'doigtsB', 'legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF', 'head']
    .concat(heads || [], ['torso'], afterTorso || [], ['armF_up'], onArm || [], ['armF_lo', 'objet', 'doigts', 'doigtsB2']);

  // ---------------- visage
  function oeil(x, y, o) {
    o = o || {}; const lid = clamp(o.lid || 0), w = o.wide ? 1.35 : 1, sz = o.sz || 1;
    if (o.heureux) { strokePts([[x - 7 * sz, y + 1], [x - 1, y - 3.5 * sz], [x + 6 * sz, y]], 'rgba(30,18,16,0.95)', 2.1); return; }
    if (lid > 0.85) { strokePts([[x - 7 * sz, y - 0.5], [x, y + 2.4 * sz], [x + 6.5 * sz, y - 0.5]], 'rgba(30,18,16,0.95)', 2); return; }
    const h = (1 - lid) * w;
    fillPts([[x - 6.5 * sz, y], [x - 1 * sz, y - 3.6 * sz * h], [x + 6 * sz, y - 1.2 * sz * h], [x + 2.8 * sz, y + 2 * sz * w], [x - 4 * sz, y + 1.2 * sz]], '#efe8da', 0, 0);
    const lx = (o.look ? o.look[0] : 0), ly = (o.look ? o.look[1] : 0);
    if (o.iris) dot(x + 2 * sz + lx, y - 0.4 * sz * h + ly, 2.5 * sz * Math.min(1.1, w), o.iris);
    dot(x + 2.2 * sz + lx, y - 0.5 * sz * h + ly, (o.iris ? 1.2 : 2.0) * sz, '#1f1716');
    strokePts([[x - 7 * sz, y + 0.2], [x - 1 * sz, y - 3.9 * sz * h], [x + 6.5 * sz, y - 1.4 * sz * h]], 'rgba(28,16,14,0.95)', 1.9);
    if (o.cils) for (const [a, b] of [[[x + 4 * sz, y - 2 * h], [x + 8 * sz, y - 4.5 * h]], [[x + 1 * sz, y - 3.4 * h], [x + 4 * sz, y - 6.5 * h]], [[x - 2 * sz, y - 3.6 * h], [x, y - 7 * h]]]) strokePts([a, b], 'rgba(28,16,14,0.9)', 1.2);
    if (lid > 0.2) fillPts([[x - 7 * sz, y - 4.5 * sz], [x + 7 * sz, y - 4.5 * sz], [x + 6.5 * sz, y - 1.4 * sz * h], [x - 1 * sz, y - 3.9 * sz * h], [x - 7 * sz, y + 0.2]], o.peau || P.peau, 0, 0);
  }
  function sourcil(x, y, o) {
    o = o || {}; const r = o.leve || 0, f = o.fronce || 0, lw = o.lw || 2.6, inq = o.inquiet || 0;
    strokePts([[x - 9, y - 1 - 2 * r + 1.5 * f - 3 * inq], [x - 1, y - 3.5 - 4.5 * r + 0.5 * f - 1 * inq], [x + 8, y - 1.5 - 2.5 * r + 3 * f + 2 * inq]], o.col || 'rgba(45,28,20,0.95)', lw);
  }
  function bouche(x, y, kind, o) {
    o = o || {}; const col = o.col || 'rgba(110,40,38,0.95)', lw = o.lw || 1.8;
    if (kind === 'o') { fillPts([[x - 3.5, y - 3.5], [x + 1.5, y - 4], [x + 2.5, y + 3.5], [x - 3.5, y + 4]], '#3a1714', 0, 0); if (o.levres) strokePts([[x - 4, y - 4], [x + 2, y - 4.5], [x + 3, y + 4], [x - 4, y + 4.5], [x - 4, y - 4]], o.levres, 1.6); return; }
    if (kind === 'sourire') { strokePts([[x + 2, y - 1.5], [x - 4, y + 1], [x - 10, y - 3]], col, lw); return; }
    if (kind === 'rire') { fillPts([[x + 2, y - 2], [x - 10, y - 3], [x - 4, y + 5]], '#3a1714', 0, 0); strokePts([[x + 1, y - 2], [x - 9, y - 3]], '#f1ece0', 1.4); return; }
    if (kind === 'serre') { strokePts([[x + 1, y], [x - 9, y + 1.4]], col, lw + 0.3); return; }
    if (kind === 'coin') { strokePts([[x + 1, y + 1], [x - 4, y + 0.5], [x - 9, y - 2.5]], col, lw); return; }
    if (kind === 'moue') { strokePts([[x + 1, y + 0.5], [x - 4, y + 1], [x - 9, y + 3]], col, lw); return; }
    strokePts([[x + 1, y], [x - 4, y + 0.8], [x - 9, y + 0.2]], col, lw);
  }
  const FACE_MOUTH = { n: 'n', o: 'o', smile: 'sourire', tight: 'serre' };
  function exprOf(map, p) { const e = Object.assign({}, map[p.expr || 'neutre'] || map.neutre || {}); const f = p.face || {}; if (f.eyes === 'closed') e.lid = 1; if (f.eyes === 'wide') e.wide = true; if (f.eyes === 'half') e.lid = 0.5; if (f.brow === 'up') e.leve = 1; if (f.brow === 'frown') e.fronce = 1; if (f.brow === 'worry') e.inquiet = 1; if (f.mouth) e.bouche = FACE_MOUTH[f.mouth] || f.mouth; return e; }

  // =====================================================================
  // POMPIDOU (1969, 58 ans) — carrure massive, cheveux noirs coiffés en arrière, GROS SOURCILS NOIRS BROUSSAILLEUX, bajoues ; trois-pièces anthracite
  // =====================================================================
  const PO = { peau: '#dcb796', peauD: '#bf9776', cheveux: '#262224', costume: '#3d4148', costumeD: '#30333a', costumeL: '#4d525b', gilet: '#4a4f58', chemise: '#efece4', cravate: '#23304a', cravateL: '#34456a', chaus: '#141214', chausD: '#0d0b0d' };
  const PO_TORSO = [[-20, -190], [10, -195], [26, -184], [44, -166], [56, -130], [62, -86], [64, -40], [58, 6], [54, 52, 1], [-54, 54, 1], [-56, 10], [-56, -50], [-56, -116], [-52, -158], [-38, -182]];
  const PO_HEAD = [[-18, 16], [14, 16], [22, 9], [28, 2], [32, -6], [34, -13], [32, -19], [34, -23], [33, -27], [36, -31], [45, -40, 1], [38, -47], [34, -55], [35, -64], [32, -80], [20, -95], [-2, -103], [-25, -97], [-37, -78], [-39, -54], [-33, -30], [-25, -8]];
  const PO_HAIR = [[24, -90], [31, -97], [33, -106, 1], [24, -114], [6, -119], [-16, -117], [-34, -108], [-46, -92], [-51, -72], [-49, -52], [-42, -38, 1], [-36, -44], [-30, -54], [-22, -64], [-12, -74], [0, -84], [12, -88]];
  const PO_EXPR = { neutre: {}, reveur: { lid: 0.45, bouche: 'coin', look: [0.6, -1.4] }, etonne: { wide: true, bouche: 'o', saut: 1 }, content: { bouche: 'sourire' }, perplexe: { fronce: 0.6, bouche: 'moue' } };
  function broussaille(x, y, up, fr) {                                    // gros sourcil noir broussailleux (≈ 32 × 11)
    const dy = -9 * up, col = '#121014';
    fillPts([[x - 14, y + 3 + dy + 3 * fr], [x - 10, y - 4 + dy], [x - 1, y - 8 + dy - 2 * up], [x + 9, y - 8 + dy + 2 * fr], [x + 17, y - 3 + dy + 4 * fr], [x + 14, y + 2 + dy + 4 * fr], [x + 3, y - 1 + dy + 1 * fr], [x - 6, y + 3 + dy + 2 * fr]], col, 0, 0);
    for (let i = 0; i < 9; i++) { const u = i / 8, px = lerp(x - 13, x + 15, u), py = lerp(y - 2, y - 3, u) + dy - 4 * Math.sin(u * PI) + 2 * fr * u; strokePts([[px - 1, py + 2], [px + 2 + 2 * hash(i + 3), py - 5 - 3 * hash(i)]], col, 1.6); }
    for (let i = 0; i < 4; i++) { const u = i / 3, px = lerp(x - 10, x + 12, u), py = lerp(y + 2, y + 1, u) + dy + 2 * fr * u; strokePts([[px, py], [px + 3, py + 3 + 2 * hash(i + 9)]], col, 1.3); }
  }
  function mkPompidou() {
    const L = { th: 120, sh: 112, hx: 9, wt: 22, kt: 15, ak: 10, fl: 52, col: PO.costume, colD: PO.costumeD, shoe: PO.chaus, shoeD: PO.chausD,
      thighPaint: (back) => { if (!back) strokePts([[10, 6], [12, 110]], 'rgba(255,255,255,0.12)', 1.2); },
      shoePaint: () => strokePts([[6, 4], [36, 8]], 'rgba(255,255,255,0.35)', 1.6) };
    const rayures = (x0, x1, y0, y1) => { for (let x = x0; x <= x1; x += 9) strokePts([[x, y0], [x + 1, y1]], 'rgba(225,228,236,0.08)', 1); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PO_TORSO, base: PO.costume, seed: 8101, paint: () => {
        rayures(-52, 58, -192, 54);
        fillPts([[4, -194], [18, -190], [28, -174], [32, -150], [24, -138], [14, -160]], PO.chemise);
        fillPts([[16, -188], [24, -188], [28, -172], [33, -140], [28, -128], [21, -136], [19, -168]], PO.cravate);
        strokePts([[20, -186], [24, -176]], PO.cravateL, 2);
        fillPts([[24, -150], [38, -148], [52, -124], [60, -86], [62, -40], [57, 4], [42, 8], [34, -40], [29, -100]], PO.gilet);
        for (const [bx, by] of [[44, -118], [50, -90], [53, -62], [53, -34], [50, -8]]) dot(bx, by, 2.4, '#22252a');
        strokePts([[30, -100], [34, -40], [40, 6]], 'rgba(15,15,20,0.6)', 1.4);
        fillPts([[6, -188], [22, -152], [33, -120], [26, -110], [15, -140], [2, -178]], PO.costumeD);
        strokePts([[26, -110], [33, -120], [22, -152]], 'rgba(255,255,255,0.16)', 1.1);
        strokePts([[-30, 12], [4, 12]], 'rgba(15,15,20,0.6)', 1.6); strokePts([[8, -120], [24, -122]], 'rgba(15,15,20,0.5)', 1.2);
        hatch([[-62, -186], [-16, -186], [-14, 56], [-62, 56]], 0.75, 4.2, 0.3);
        shade(58, 0, -56, 0, 0.26, [-70, -200, 70, 60]);
      } },
      planBras: { parent: 'torso', at: [0, -116], noRivet: true, pts: (p) => (p.sousBras ? rrect(-66, -12, 118, 12, 11) : OFFP), base: IV, seed: 8102, paint: () => {
        strokePts([[-62, -5], [114, -5]], 'rgba(255,255,255,0.6)', 1.5); strokePts([[-62, 6], [114, 6]], 'rgba(110,90,60,0.3)', 3);
        fillPts(ell(116, 0, 4, 11, 10), IVD, 0, 0); for (let k = 1; k <= 3; k++) strokePts(ep(116, 0, 1.2 * k, 3.5 * k, 8, -PI / 2, PI * 1.2), 'rgba(110,90,60,0.55)', 0.9);
      } },
      armB_up: upDef([-14, -150], PO.costumeD, 8104, 19),
      armB_lo: foreDef('armB_up', PO.costumeD, PO.peauD, true, 8105, { cuff: '#d9d5cb' }),
      head: { parent: 'torso', at: [8, -178], pts: PO_HEAD, base: PO.peau, seed: 8106, noRivet: true, paint: (p) => {
        const e = exprOf(PO_EXPR, p), sj = clamp((p.sourcils || 0) + (e.saut || 0));
        X.earPaint(-8, -44);
        fillPts([[4, -30], [18, -26], [28, -14], [30, -2], [22, 9], [10, 14], [-6, 10], [-12, -6]], 'rgba(170,120,95,0.28)');       // bajoue
        strokePts([[33, -34], [28, -24], [27, -12], [24, -2]], 'rgba(120,70,50,0.55)', 1.5);                                       // pli de la bajoue
        strokePts([[16, 2], [6, 10]], 'rgba(120,70,50,0.35)', 1.2);
        hatch([[-24, -44], [0, -34], [8, -10], [-8, 14], [-34, 4]], 0.6, 3.6, 0.24);
        dot(20, -34, 8, 'rgba(200,120,100,0.15)');
        strokePts([[18, -74], [30, -73]], 'rgba(120,70,55,0.3)', 1.1); strokePts([[16, -68], [30, -67]], 'rgba(120,70,55,0.25)', 1.1);
        oeil(22, -51, { lid: e.lid == null ? 0.25 : e.lid, wide: e.wide, look: e.look, peau: PO.peau, heureux: e.heureux });
        strokePts([[16, -45], [26, -44]], 'rgba(120,70,50,0.35)', 1);                                                              // poche sous l'œil
        broussaille(22, -60, sj, e.fronce || 0);
        bouche(31, -22, e.bouche || 'n', { lw: 2 });
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: PO_HAIR, base: PO.cheveux, seed: 8107, noRivet: true, paint: () => {
        for (const [a, m, b] of [[[28, -104], [0, -116], [-36, -100]], [[22, -96], [-10, -104], [-44, -76]], [[8, -88], [-20, -88], [-46, -56]]]) strokePts(qbez(a, m, b, 10), 'rgba(205,205,220,0.42)', 2.2);
        fillPts([[-36, -44], [-31, -54], [-24, -62], [-32, -60], [-41, -48]], 'rgba(150,150,160,0.5)');

        hatch(null, 0.4, 5, 0.12);
      } },
      armF_up: upDef([-2, -150], PO.costume, 8109, 18, () => { hatch([[-17, -20], [-3, -20], [-3, 100], [-17, 100]], 0.9, 3.8, 0.28); for (let x = -12; x <= 12; x += 9) strokePts([[x, -10], [x, 96]], 'rgba(225,228,236,0.07)', 1); }),
      armF_lo: foreDef('armF_up', PO.costume, PO.peau, false, 8110, { cuff: PO.chemise }),
    };
    Object.assign(parts, legParts(L, 8120), heldParts(PO.peau, 8130));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux'], ['planBras']), nom: 'pompidou', _legs: L };
  }
  CH.bouPompidou = mkPompidou();
  BOU.pompidouPose = function (q, env) {
    if ((q.deroule > 0 || q.brandir > 0) && q.tenu == null && !q.sousBras) q.tenu = 'plan';
    gestes(q, env);
  };
  BOU.pompidou = wrap(CH.bouPompidou, BOU.pompidouPose, 0.9);

  // =====================================================================
  // RENZO PIANO (34 ans) — mince, barbe noire courte, cheveux noirs mi-longs bouclés ; col roulé noir, veste de velours brun tabac, pantalon gris clair
  // =====================================================================
  const PN = { peau: '#d9b28e', peauD: '#bb9270', barbe: '#1d1a1b', cheveux: '#1f1b1c', col: '#1d1d22', veste: '#7a5534', vesteD: '#634428', vesteL: '#8d6643', pant: '#bdbcb5', pantD: '#a2a19b', chaus: '#4a3426', chausD: '#38281d' };
  const PN_TORSO = [[-14, -190], [10, -192], [17, -178], [27, -156], [32, -116], [32, -62], [31, -14], [33, 34], [35, 52, 1], [-35, 54, 1], [-35, 10], [-33, -50], [-34, -112], [-31, -154], [-23, -176]];
  const PN_HEAD = [[-14, 16], [10, 16], [13, 4], [19, -3], [27, -7], [30, -14], [28, -21], [30, -25], [29, -29], [32, -33], [39, -40, 1], [33, -47], [30, -55], [31, -63], [28, -78], [16, -92], [-6, -98], [-25, -90], [-34, -70], [-33, -46], [-25, -28], [-17, -8]];
  const PN_HAIR = scallop([[30, -68], [32, -82], [24, -96], [6, -104], [-14, -104], [-30, -97], [-40, -84], [-45, -64], [-46, -42], [-42, -20], [-34, -6], [-27, -12], [-25, -30], [-19, -44], [-10, -58], [4, -67], [18, -71]], 3, 3.4);
  const PN_BEARD = scallop([[-6, -34], [2, -24], [12, -16], [21, -19], [26, -27], [34, -31], [32, -24], [31, -16], [33, -9], [30, 0], [23, 8], [11, 14], [-4, 14], [-12, 2], [-12, -24]], 2, 1.8);
  const ARCH_EXPR = { neutre: {}, sourire: { bouche: 'sourire' }, ravi: { heureux: true, bouche: 'rire' }, concentre: { fronce: 0.7, lid: 0.35, bouche: 'serre' }, fier: { lid: 0.3, bouche: 'coin', leve: 0.2 }, etonne: { wide: true, leve: 1, bouche: 'o' } };
  function medaillePiece(seed) {
    return { parent: 'torso', at: [0, 0], noRivet: true, base: '#23304a', seed, pts: (p) => ((p.medaille || 0) > 0.5 ? [[-6, -186], [4, -188], [20, -134], [12, -132]] : OFFP),
      extra: (p) => {
        if ((p.medaille || 0) <= 0.5) return;
        pc([[10, -190], [20, -186], [22, -136], [14, -136]], '#1b2539', null, seed + 1);
        pc(ell(16, -112, 27, 27, 22), '#c9a24a', () => { strokePts(ep(16, -112, 22, 22, 22, 0, TAU), '#e6cb7c', 2); fillPts(ell(16, -112, 8, 8, 12), '#d9b862', 0, 0); strokePts(ep(16, -112, 27, 27, 8, PI * 1.1, PI * 1.6), 'rgba(255,245,200,0.8)', 2.2); shade(36, -92, -4, -132, 0.3, [-12, -140, 44, -84]); }, seed + 2);
      } };
  }
  function mkPiano() {
    const L = { th: 118, sh: 110, hx: 6, wt: 16, kt: 11, ak: 8, fl: 44, col: PN.pant, colD: PN.pantD, shoe: PN.chaus, shoeD: PN.chausD,
      thighPaint: (back) => { if (!back) strokePts([[8, 6], [10, 108]], 'rgba(90,90,90,0.25)', 1.1); } };
    const velours = (x0, x1, y0, y1) => { for (let x = x0; x <= x1; x += 3.2) strokePts([[x, y0], [x + 0.5, y1]], 'rgba(45,28,12,0.22)', 1); };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: PN_TORSO, base: PN.veste, seed: 8201, paint: () => {
        velours(-36, 34, -190, 54);
        fillPts([[-16, -194], [10, -196], [18, -180], [25, -160], [30, -128], [32, -80], [31, -14], [22, -14], [18, -80], [13, -134], [6, -166], [-14, -178]], PN.col);
        fillPts([[-16, -194], [10, -196], [13, -184], [-14, -180]], '#2a2a30'); strokePts([[-14, -188], [11, -190]], 'rgba(255,255,255,0.15)', 1.2);
        strokePts([[0, -186], [14, -150], [24, -100], [27, -14]], 'rgba(10,10,12,0.5)', 1.2);
        fillPts([[4, -170], [14, -136], [21, -100], [16, -98], [8, -128], [0, -160]], PN.vesteD);                    // revers
        strokePts([[21, -100], [24, -40], [27, 52]], 'rgba(30,18,8,0.7)', 1.6);
        fillPts(box(-22, 6, 6, 12), PN.vesteD);
        hatch([[-44, -186], [-12, -186], [-10, 54], [-44, 54]], 0.75, 4.2, 0.28);
        shade(36, 0, -36, 0, 0.24);
      } },
      armB_up: upDef([-10, -148], PN.vesteD, 8204, 15, () => { for (let x = -12; x <= 12; x += 3.2) strokePts([[x, -10], [x, 96]], 'rgba(45,28,12,0.2)', 1); hatch(null, 0.9, 3.8, 0.3); }),
      armB_lo: foreDef('armB_up', PN.vesteD, PN.peauD, true, 8205, { cuff: PN.col }),
      head: { parent: 'torso', at: [6, -174], pts: PN_HEAD, base: PN.peau, seed: 8206, noRivet: true, paint: (p) => {
        const e = exprOf(ARCH_EXPR, p);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.2);
        oeil(19, -52, { lid: e.lid || 0, wide: e.wide, heureux: e.heureux, look: e.look, iris: '#4a3626', peau: PN.peau });
        sourcil(19, -62, { leve: e.leve || 0, fronce: e.fronce || 0, lw: 3.2, col: 'rgba(25,20,20,0.98)' });
      } },
      barbe: { parent: 'head', at: [0, 0], pts: PN_BEARD, base: PN.barbe, seed: 8207, noRivet: true, paint: (p) => {
        const e = exprOf(ARCH_EXPR, p);
        for (let i = 0; i < 14; i++) { const x = -8 + (i % 7) * 6, y = -14 + Math.floor(i / 7) * 12; strokePts(ep(x, y, 2.4, 2.4, 6, 0, PI * 1.4), 'rgba(140,130,130,0.3)', 0.9); }
        fillPts([[18, -24], [31, -25], [31, -19], [20, -18]], '#c58f80', 0, 0);                                    // lèvres
        bouche(29, -21, e.bouche || 'n', { col: 'rgba(80,25,25,0.95)' });
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: PN_HAIR, base: PN.cheveux, seed: 8208, noRivet: true, paint: () => {
        for (let i = 0; i < 15; i++) { const x = -38 + (i % 5) * 12 + (Math.floor(i / 5) % 2) * 6, y = -94 + Math.floor(i / 5) * 24; strokePts(ep(x, y, 4, 4, 7, 0, PI * 1.5), 'rgba(150,140,140,0.35)', 1.1); }
        hatch(null, 0.5, 3.4, 0.2);
      } },
      medaille: medaillePiece(8240),
      armF_up: upDef([-2, -148], PN.veste, 8209, 15, () => { for (let x = -12; x <= 12; x += 3.2) strokePts([[x, -10], [x, 96]], 'rgba(45,28,12,0.22)', 1); hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.24); }),
      armF_lo: foreDef('armF_up', PN.veste, PN.peau, false, 8210, { cuff: PN.col, lines: () => { for (let x = -12; x <= 12; x += 3.2) strokePts([[x, 0], [x, 70]], 'rgba(45,28,12,0.22)', 1); } }),
    };
    Object.assign(parts, legParts(L, 8220), heldParts(PN.peau, 8230));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['barbe', 'cheveux'], ['medaille']), nom: 'piano', _legs: L };
  }
  CH.bouPiano = mkPiano();

  // =====================================================================
  // RICHARD ROGERS (38 ans) — grand, dégingandé, glabre, cheveux châtains longs jusqu'au col, grandes pattes ; chemise turquoise éteint à col pelle à tarte, sans veste
  // =====================================================================
  const RG = { peau: '#e6c2a0', peauD: '#c9a17f', cheveux: '#7a5131', cheveuxL: '#9a6b45', chemise: '#3f8a83', chemiseD: '#33716b', chemiseL: '#5aa49c', pant: '#4f6378', pantD: '#41536a', ceint: '#3b2a20', chaus: '#2a2220', chausD: '#1f1917' };
  const RG_TORSO = [[-12, -186], [8, -190], [16, -178], [25, -158], [29, -116], [28, -64], [27, -16], [29, 30], [30, 46, 1], [-31, 48, 1], [-31, 10], [-30, -50], [-31, -114], [-28, -156], [-22, -176]];
  const RG_HEAD = [[-14, 18], [10, 18], [12, 8], [20, 1], [29, -3], [32, -10], [30, -19], [32, -24], [31, -28], [34, -32], [45, -41, 1], [36, -49], [32, -57], [33, -65], [30, -80], [17, -94], [-5, -100], [-24, -92], [-33, -72], [-32, -48], [-25, -28], [-17, -6]];
  const RG_HAIR = [[29, -78], [29, -90], [19, -101], [0, -108], [-19, -107], [-35, -99], [-45, -85], [-49, -62], [-51, -36], [-51, -8], [-48, 16, 1], [-37, 20, 1], [-31, 2], [-25, -18], [-17, -30], [-11, -36], [-11, -54], [-2, -66], [10, -74], [20, -79]];
  function mkRogers() {
    const L = { th: 130, sh: 122, hx: 6, wt: 15, kt: 10, ak: 8, fl: 48, col: RG.pant, colD: RG.pantD, shoe: RG.chaus, shoeD: RG.chausD,
      thighPaint: (back) => { if (!back) strokePts([[8, 6], [10, 120]], 'rgba(255,255,255,0.12)', 1.1); } };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: RG_TORSO, base: RG.chemise, seed: 8301, paint: () => {
        fillPts([[2, -192], [16, -184], [22, -164], [17, -146], [11, -162], [4, -180]], RG.peau);
        strokePts([[16, -150], [12, -160]], 'rgba(150,100,80,0.4)', 1);
        fillPts([[-20, -194], [-2, -196], [-2, -184], [-18, -182]], RG.chemiseD);
        fillPts([[-2, -192], [12, -188], [26, -166], [32, -144], [22, -146], [12, -162], [2, -178]], RG.chemiseD);     // col pelle à tarte
        strokePts([[-2, -192], [12, -188], [26, -166], [32, -144]], 'rgba(255,255,255,0.35)', 1.3);
        strokePts([[17, -146], [22, -90], [25, -30], [27, 30]], 'rgba(20,50,48,0.55)', 1.2);
        for (const y of [-120, -86, -52, -18, 14]) dot(lerp(19, 26, (y + 146) / 176), y, 2.1, '#d8e4df');
        fillPts([[-10, -132], [10, -132], [10, -112], [-10, -112]], 'rgba(30,70,66,0.25)'); strokePts([[-10, -132], [10, -132]], 'rgba(20,50,48,0.5)', 1.1);
        fillPts(box(-31, 30, 29, 40), RG.ceint); fillPts(box(20, 30, 28, 40), '#a88c4a');
        fillPts([[-31, 40, 1], [29, 40, 1], [30, 48, 1], [-31, 48, 1]], RG.pant);
        for (const [a, b] of [[[-24, -60], [-14, 24]], [[0, -40], [6, 26]], [[12, -100], [8, -60]]]) strokePts([a, b], 'rgba(20,50,48,0.25)', 1.1);   // plis
        hatch([[-40, -186], [-12, -186], [-10, 48], [-40, 48]], 0.75, 4.2, 0.26);
        shade(34, 0, -34, 0, 0.22);
      } },
      armB_up: upDef([-10, -150], RG.chemiseD, 8304, 14),
      armB_lo: foreDef('armB_up', RG.chemiseD, RG.peauD, true, 8305, { cuff: '#2c625d' }),
      head: { parent: 'torso', at: [6, -180], pts: RG_HEAD, base: RG.peau, seed: 8306, noRivet: true, paint: (p) => {
        const e = exprOf(ARCH_EXPR, p);
        X.earPaint(-8, -44);
        fillPts([[-3, -70], [6, -68], [7, -46], [6, -24], [2, -16], [-1, -30]], '#6a4428');                            // grandes pattes
        for (let k = 0; k < 4; k++) strokePts([[0 + k * 1.6, -64], [1 + k * 1.4, -22]], 'rgba(40,25,12,0.4)', 0.9);
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.22);
        strokePts([[26, -42], [22, -32], [24, -24]], 'rgba(150,90,70,0.45)', 1.3);
        strokePts([[10, -2], [20, 4], [29, -3]], 'rgba(150,90,70,0.4)', 1.4); strokePts([[6, 12], [9, 4]], 'rgba(150,90,70,0.35)', 1.6);   // mâchoire, pomme d'Adam
        strokePts([[16, -76], [28, -75]], 'rgba(150,90,70,0.3)', 1);
        oeil(20, -53, { lid: e.lid || 0, wide: e.wide, heureux: e.heureux, look: e.look, iris: '#5f7d8c', peau: RG.peau });
        sourcil(20, -63, { leve: e.leve || 0, fronce: e.fronce || 0, lw: 3.4, col: 'rgba(80,50,30,0.98)' });
        bouche(30, -21, e.bouche || 'n');
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: RG_HAIR, base: RG.cheveux, seed: 8307, noRivet: true, paint: () => {
        for (let i = 0; i < 7; i++) { const x0 = 20 - i * 9; strokePts([[x0, -100 + i * 1.5], [x0 - 14, -74 + i * 3], [x0 - 18, -20 + i * 4]], 'rgba(190,150,110,0.35)', 1.3); }
        strokePts([[4, -104], [10, -96], [12, -84]], 'rgba(60,35,20,0.55)', 1.3);
        hatch(null, 0.3, 3.2, 0.2);
      } },
      medaille: medaillePiece(8340),
      armF_up: upDef([-2, -150], RG.chemise, 8309, 14, () => { strokePts([[-6, 10], [-4, 80]], 'rgba(20,50,48,0.25)', 1.1); hatch([[-15, -20], [-3, -20], [-3, 100], [-15, 100]], 0.9, 3.8, 0.22); }),
      armF_lo: foreDef('armF_up', RG.chemise, RG.peau, false, 8310, { cuff: RG.chemiseD }),
    };
    Object.assign(parts, legParts(L, 8320), heldParts(RG.peau, 8330));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux'], ['medaille']), nom: 'rogers', _legs: L };
  }
  CH.bouRogers = mkRogers();
  BOU.archiPose = function (q, env) {
    if ((q.deroule > 0 || q.brandir > 0) && q.tenu == null) q.tenu = 'plan';
    gestes(q, env);
  };
  BOU.piano = wrap(CH.bouPiano, BOU.archiPose, 0.88);
  BOU.rogers = wrap(CH.bouRogers, BOU.archiPose, 0.88);

  // =====================================================================
  // MADAME (Parisienne chic, la cinquantaine) — coiffure bouffante blond cendré, perles, manteau prune à boutons dorés, col de fourrure, gants, sac ; face-à-main
  // =====================================================================
  const MA = { peau: '#efd2bb', peauD: '#d4b29a', joue: 'rgba(226,110,124,0.42)', cheveux: '#cdbd92', cheveuxD: '#a9996f', cheveuxL: '#e4d7b1', manteau: '#6b3a55', manteauD: '#552c43', manteauL: '#82506d',
    fourrure: '#a19e99', fourrureD: '#84817c', bouton: '#c9a24a', gant: '#3e3036', gantD: '#30252a', bas: '#d8bea6', basD: '#c3a690', chaus: '#2b1f24', chausD: '#21171b', levres: '#a3313d', perle: '#f4f0e6', sac: '#2c2226' };
  const MA_TORSO = [[-12, -180], [6, -182], [16, -172], [26, -152], [33, -122], [31, -90], [27, -66], [33, -22], [41, 40], [48, 104], [50, 122, 1], [-46, 124, 1], [-42, 60], [-36, 0], [-31, -60], [-33, -112], [-31, -152], [-23, -170]];
  const MA_HEAD = [[-12, 16], [8, 16], [9, 4], [15, -3], [22, -7], [25, -13], [24, -18], [27, -21], [25, -25], [28, -29], [33, -36, 1], [29, -42], [27, -52], [28, -62], [24, -76], [12, -88], [-6, -93], [-22, -86], [-30, -68], [-30, -46], [-24, -28], [-16, -8]];
  const MA_HAIR = [[26, -62], [32, -74], [32, -92], [22, -110], [2, -122], [-20, -124], [-40, -114], [-53, -96], [-57, -73], [-55, -52], [-48, -35], [-38, -25], [-29, -29], [-29, -41], [-25, -54], [-17, -66], [-5, -72], [8, -74], [19, -70]];
  const MA_COL = scallop([[-28, -170], [-24, -186], [-8, -196], [9, -196], [21, -188], [29, -172], [27, -158], [15, -153], [3, -164], [-13, -167]], 3, 2.8);
  const MA_EXPR = { neutre: {}, mefiante: { leve: 1.2, lid: 0.45, bouche: 'moue', fronceB: 0.6 }, outree: { wide: true, leve: 1.1, bouche: 'o' }, ravie: { heureux: true, bouche: 'sourire', joues: 1 },
    coupable: { inquiet: 0.8, bouche: 'coin', look: [-1.6, 0.6], joues: 0.5 }, attendrie: { lid: 0.35, bouche: 'sourire', inquiet: 0.4, joues: 0.6 } };
  const MA_FOOT = ep(0, 0, 8, 8, 8, PI, TAU).concat([[9, 2], [18, 7], [32, 12], [38, 14, 1], [16, 14], [4, 9], [-3, 7], [-4, 14, 1], [-11, 14, 1], [-11, 4]]);
  function mkMadame() {
    const L = { th: 112, sh: 106, hx: 5, wt: 12, kt: 8, ak: 6, fl: 38, col: MA.bas, colD: MA.basD, shoe: MA.chaus, shoeD: MA.chausD, foot: MA_FOOT,
      shoePaint: () => strokePts([[6, 6], [30, 11]], 'rgba(255,255,255,0.3)', 1.3) };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: MA_TORSO, base: MA.manteau, seed: 8401, paint: () => {
        strokePts([[27, -66], [30, -20], [37, 40], [44, 120]], 'rgba(40,15,30,0.6)', 1.5);                         // bord du manteau
        for (const [bx, by] of [[22, -104], [21, -76], [26, -44], [30, -12], [34, 20]]) { dot(bx, by, 3.4, MA.bouton); dot(bx - 0.8, by - 0.8, 1.2, '#f2dc9a'); }
        fillPts([[-12, 30], [16, 30], [17, 38], [-12, 38]], MA.manteauD); strokePts([[-12, 30], [16, 30]], 'rgba(255,255,255,0.16)', 1);
        fillPts([[-46, 112], [50, 112], [50, 124], [-46, 124]], MA.manteauD);
        for (const [a, b] of [[[-30, 40], [-36, 118]], [[-6, 50], [-10, 118]], [[18, 56], [22, 118]]]) strokePts([a, b], 'rgba(40,15,30,0.3)', 1.2);
        hatch([[-54, -176], [-14, -176], [-10, 126], [-54, 126]], 0.75, 4.2, 0.28);
        shade(46, 0, -46, 0, 0.26, [-60, -200, 60, 130]);
      } },
      col: { parent: 'torso', at: [0, 0], noRivet: true, pts: MA_COL, base: MA.fourrure, seed: 8402, paint: () => {
        for (let i = 0; i < 16; i++) { const x = -24 + (i % 8) * 6.5, y = -188 + Math.floor(i / 8) * 14; strokePts([[x, y], [x + 2, y + 6]], 'rgba(255,255,255,0.35)', 1); strokePts([[x + 3, y + 2], [x + 4, y + 8]], 'rgba(60,55,50,0.35)', 1); }
        hatch(null, 0.4, 3, 0.18);
      }, extra: () => { for (let i = 0; i < 9; i++) { const u = i / 8; dot(lerp(10, 26, u) + 3 * Math.sin(u * PI), lerp(-160, -132, u), 2.6, MA.perle); } } },
      armB_up: upDef([-10, -148], MA.manteauD, 8404, 14),
      armB_lo: foreDef('armB_up', MA.manteauD, MA.gantD, true, 8405, { cuff: MA.fourrureD }),
      head: { parent: 'torso', at: [6, -170], pts: MA_HEAD, base: MA.peau, seed: 8406, noRivet: true, paint: (p) => {
        const e = exprOf(MA_EXPR, p);
        X.earPaint(-8, -42); dot(-6, -34, 3, MA.perle);
        hatch([[-22, -40], [2, -30], [8, -12], [-6, 12], [-30, 4]], 0.6, 3.8, 0.14);
        dot(14, -28, 8, e.joues ? `rgba(226,110,124,${0.25 + 0.3 * e.joues})` : 'rgba(220,130,130,0.2)');
        oeil(17, -50, { lid: e.lid || 0, wide: e.wide, heureux: e.heureux, look: e.look, iris: '#5c7a8c', peau: MA.peau, cils: true });
        strokePts([[10, -57], [18, -58], [24, -55]], 'rgba(120,100,140,0.35)', 3);                                   // fard
        sourcil(17, -62, { leve: e.leve || 0, fronce: e.fronce || 0, inquiet: e.inquiet || 0, lw: 1.8, col: 'rgba(110,90,60,0.95)' });
        const bk = e.bouche || 'n';
        if (bk === 'o') bouche(25, -20, 'o', { levres: MA.levres });
        else { fillPts([[17, -21], [26, -23], [27, -19], [18, -17]], MA.levres, 0, 0); bouche(26, -20, bk, { col: 'rgba(90,20,30,0.95)', lw: 1.5 }); }
      } },
      cheveux: { parent: 'head', at: [0, 0], pts: MA_HAIR, base: MA.cheveux, seed: 8407, noRivet: true, paint: () => {
        for (let i = 0; i < 6; i++) { const a0 = -0.3 - i * 0.42; strokePts(ep(-12, -72, 30 + i * 2, 40, 10, a0 - 1.2, a0), 'rgba(250,240,210,0.45)', 1.4); }
        for (let i = 0; i < 5; i++) strokePts(ep(-14, -70, 18 + i * 7, 30 + i * 6, 10, PI * 0.9, PI * 1.5), 'rgba(140,120,80,0.35)', 1.1);
        hatch(null, 0.6, 3.6, 0.14);
      } },
      armF_up: upDef([-2, -148], MA.manteau, 8409, 14),
      sac: { parent: 'armF_up', at: [0, 86], noRivet: true, base: MA.sac, seed: 8411, pts: (p) => (p.sac === false ? OFFP : [[-16, 30], [16, 30], [20, 64, 1], [-20, 64, 1]]), paint: () => {
        fillPts(box(-6, 34, 6, 40), MA.bouton); strokePts([[-18, 46], [18, 46]], 'rgba(255,255,255,0.18)', 1.2); hatch(null, 0.8, 3.4, 0.25);
      }, extra: (p) => { if (p.sac === false) return; strokePts([[-12, 30], [-6, 2], [6, 2], [12, 30]], '#1d1619', 2.4); } },
      armF_lo: foreDef('armF_up', MA.manteau, MA.gant, false, 8410, { cuff: MA.fourrure }),
    };
    Object.assign(parts, legParts(L, 8420), heldParts(MA.gant, 8430));
    const def = { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['cheveux'], ['col'], ['sac']), nom: 'madame', _legs: L };
    def._after = (r, q) => { if (q.laisse) BOU.laisse(r.w('armB_lo', 4, 100), q.laisse, { mou: q.laisseMou }); };
    return def;
  }
  CH.bouMadame = mkMadame();
  BOU.madamePose = function (q, env) {
    const def = CH.bouMadame, A = q.ang, t = q.t || 0;
    if (q.tenu == null) q.tenu = 'lorgnette';
    const lo = k01(q.lorgnette), ou = k01(q.outree), en = k01(q.enlace);
    if (q.expr == null) q.expr = en > 0.5 ? 'ravie' : ou > 0.4 ? 'outree' : lo > 0.5 ? 'mefiante' : 'neutre';
    if (q._libreF) { A.armF_up = -0.25; A.armF_lo = -0.75; }
    if (q._libreB) { A.armB_up = q.laisse ? -0.35 : 0.05; A.armB_lo = q.laisse ? -0.35 : -0.15; }
    if (ou > 0) { A.head = (A.head || 0) - 0.2 * ou; q.tilt = (q.tilt || 0) - 0.045 * ou; q.collier = Math.max(q.collier || 0, ou); }
    gestes(q, Object.assign(env, { collier: [20, -150] }));
    if (lo > 0) {                                                                 // verres de la lorgnette devant l'œil
      const E = headPt(q, def, 29, -50), g = OBJ.lorgnette.pts.verre;
      armTo(q, def, 'armF', [E[0] - g[0], E[1] - g[1]], 'bas', lo);
    }
    if (en > 0) {                                                                 // enlacer : deux bras tendus vers l'avant autour d'un tuyau vertical
      q.tilt = (q.tilt || 0) + 0.06 * en; A.head = (A.head || 0) + 0.12 * en;
      let TF, TB;
      if (q.cible) { const lw = q.largeur == null ? 84 : q.largeur, d = env.dir;            // cible = axe du tuyau (écran) ; mains de part et d'autre
        TF = toTorso(env, q, [q.cible[0] + d * 0.42 * lw, q.cible[1] + 8 * env.s]); TB = toTorso(env, q, [q.cible[0] + d * 0.04 * lw, q.cible[1] - 22 * env.s]); }
      else { TF = [100, -110]; TB = [86, -132]; }
      armTo(q, def, 'armF', TF, 'bas', en); armTo(q, def, 'armB', TB, 'bas', en);
      if (en > 0.5) { q.handF = 'open'; q.handB = 'open'; if (q.tenu === 'lorgnette') q.tenu = 'rien'; }
    }
    const co = k01(q.collier); if (co > 0 && q.tenu === 'lorgnette') A.objet = (A.objet || 0) + 2.6 * co;
    void t;
  };
  BOU.madame = wrap(CH.bouMadame, BOU.madamePose, 0.85);

  // =====================================================================
  // MONSIEUR LE CRITIQUE (la soixantaine) — maigre, béret noir, petite moustache grise, imperméable mastic ceinturé, écharpe rouge ; journal plié
  // =====================================================================
  const CR = { peau: '#dcbfa4', peauD: '#bfa187', cheveux: '#b9b6af', moust: '#a8a59e', beret: '#1b1a1d', impe: '#b8a57e', impeD: '#9e8c66', impeL: '#cbbb96', ceint: '#8e7b56', echarpe: '#8e2a26', echarpeD: '#6e1f1c', pant: '#4a4542', pantD: '#3b3734', chaus: '#2a221e', chausD: '#1f1916' };
  const CR_TORSO = [[-12, -180], [8, -184], [16, -172], [26, -154], [30, -116], [30, -62], [30, -14], [34, 46], [38, 106], [40, 120, 1], [-40, 122, 1], [-38, 60], [-34, 0], [-32, -60], [-32, -112], [-30, -154], [-22, -172]];
  const CR_HEAD = [[-12, 16], [8, 16], [11, 4], [17, -4], [25, -8], [28, -14], [26, -21], [28, -25], [27, -29], [30, -33], [41, -43, 1], [32, -49], [29, -57], [30, -65], [27, -78], [15, -92], [-6, -98], [-24, -90], [-32, -70], [-31, -46], [-24, -28], [-16, -8]];
  const CR_BERET = [[-38, -80], [-42, -92], [-30, -104], [-6, -110], [20, -108], [36, -100], [41, -91], [35, -84], [10, -84], [-14, -82]];
  const CR_EXPR = { neutre: {}, outre: { fronce: 1, wide: true, bouche: 'o' }, degoute: { fronce: 0.9, lid: 1, bouche: 'serre' }, attendri: { heureux: true, bouche: 'sourire', leve: 0.3 }, sceptique: { leve: 0.9, lid: 0.35, bouche: 'moue' } };
  function mkCritique() {
    const L = { th: 120, sh: 112, hx: 5, wt: 13, kt: 9, ak: 7, fl: 44, col: CR.pant, colD: CR.pantD, shoe: CR.chaus, shoeD: CR.chausD };
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CR_TORSO, base: CR.impe, seed: 8501, paint: () => {
        fillPts([[2, -182], [16, -170], [28, -132], [20, -110], [8, -150], [-2, -172]], CR.impeD);                    // grand revers
        strokePts([[20, -110], [28, -132], [16, -170]], 'rgba(255,255,255,0.25)', 1.2);
        for (const [bx, by] of [[14, -96], [22, -96], [15, -60], [23, -60], [26, 12], [30, 50]]) dot(bx, by, 2.4, '#5a4a30');
        strokePts([[20, -110], [24, -40], [30, 40], [36, 118]], 'rgba(70,55,30,0.55)', 1.4);
        fillPts([[-30, -156], [-10, -168], [4, -150], [-24, -138]], CR.impeL); strokePts([[-24, -138], [4, -150]], 'rgba(70,55,30,0.45)', 1.1);   // rabat
        fillPts(box(-36, -22, 31, -8), CR.ceint); fillPts(box(14, -26, 26, -4), '#5a4a30'); fillPts(box(17, -22, 23, -8), CR.ceint);
        for (const [a, b] of [[[-26, 0], [-32, 116]], [[-4, 4], [-6, 116]], [[14, 4], [22, 116]]]) strokePts([a, b], 'rgba(70,55,30,0.3)', 1.2);
        hatch([[-48, -178], [-12, -178], [-10, 124], [-48, 124]], 0.75, 4.2, 0.28);
        shade(38, 0, -38, 0, 0.24, [-50, -200, 50, 130]);
      } },
      echarpe: { parent: 'torso', at: [0, 0], noRivet: true, base: CR.echarpe, seed: 8502, pts: [[-22, -176], [-18, -188], [0, -194], [16, -188], [24, -174], [22, -162], [8, -166], [-8, -170]], paint: () => { strokePts([[-18, -180], [20, -178]], 'rgba(40,10,10,0.4)', 1.4); hatch(null, 0.9, 3.4, 0.2); } },
      pan: { parent: 'torso', at: [0, 0], noRivet: true, base: CR.echarpe, seed: 8503, pts: [[12, -170], [24, -168], [28, -126], [31, -98], [19, -96], [16, -128]], paint: () => {
        for (let k = 0; k < 4; k++) strokePts([[20 + k * 3, -100], [20 + k * 3, -94]], CR.echarpeD, 1.2); hatch(null, 0.9, 3.4, 0.22); } },
      jBras: { parent: 'torso', at: [0, 0], noRivet: true, base: '#e6e1d3', seed: 8504, pts: (p) => (p._jbras ? [[-46, -132, 1], [44, -126, 1], [43, -112, 1], [-47, -118, 1]] : OFFP), paint: () => { for (let x = -40; x < 40; x += 6) strokePts([[x, -126], [x + 2, -120]], 'rgba(60,55,50,0.4)', 1); } },
      armB_up: upDef([-10, -148], CR.impeD, 8505, 14),
      armB_lo: foreDef('armB_up', CR.impeD, CR.peauD, true, 8506, { cuff: '#8a7a58' }),
      head: { parent: 'torso', at: [6, -174], pts: CR_HEAD, base: CR.peau, seed: 8507, noRivet: true, paint: (p) => {
        const e = exprOf(CR_EXPR, p);
        X.earPaint(-8, -44);
        fillPts([[-30, -76], [-34, -60], [-31, -44], [-25, -40], [-22, -58], [-14, -76]], CR.cheveux, 0, 0);
        strokePts([[6, -38], [10, -22], [8, -10]], 'rgba(120,80,60,0.45)', 1.3);                                     // joue creuse
        strokePts([[25, -40], [21, -30], [22, -22]], 'rgba(120,80,60,0.4)', 1.1);
        strokePts([[16, -74], [28, -73]], 'rgba(120,80,60,0.35)', 1); strokePts([[14, -69], [27, -68]], 'rgba(120,80,60,0.3)', 1);
        hatch([[-22, -42], [2, -32], [10, -12], [-6, 14], [-32, 4]], 0.6, 3.6, 0.24);
        oeil(19, -52, { lid: e.lid == null ? 0.2 : e.lid, wide: e.wide, heureux: e.heureux, look: e.look, peau: CR.peau });
        sourcil(19, -61, { leve: e.leve || 0, fronce: e.fronce || 0, lw: 2.4, col: 'rgba(120,118,112,0.95)' });
        fillPts([[21, -31], [33, -34], [35, -29], [29, -26], [21, -27]], CR.moust, 0, 0);
        bouche(28, -22, e.bouche || 'n');
      } },
      beret: { parent: 'head', at: [0, 0], pts: CR_BERET, base: CR.beret, seed: 8508, noRivet: true, paint: () => {
        strokePts([[-36, -86], [10, -88], [36, -88]], 'rgba(255,255,255,0.12)', 1.3); strokePts([[-20, -102], [20, -102]], 'rgba(255,255,255,0.1)', 1.2); hatch(null, 0.6, 3.4, 0.25);
      }, extra: () => { strokePts([[0, -110], [2, -117]], CR.beret, 2.6); } },
      armF_up: upDef([-2, -148], CR.impe, 8509, 14),
      armF_lo: foreDef('armF_up', CR.impe, CR.peau, false, 8510, { cuff: CR.impeD }),
    };
    Object.assign(parts, legParts(L, 8520), heldParts(CR.peau, 8530));
    return { hipY: -(L.th + L.sh + 14), parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, order: ORDER(['beret'], ['jBras', 'echarpe', 'pan']), nom: 'critique', _legs: L };
  }
  CH.bouCritique = mkCritique();
  BOU.critiquePose = function (q, env) {
    const ap = k01(q.applaudit), nz = k01(q.nez), br = k01(q.brandir);
    let j = q.journal || (ap > 0.3 ? 'bras' : 'main');
    if (j === 'main' && nz > 0.3 && q.tenu == null && q.tenuB == null) { q.tenuB = 'journal'; j = 'arriere'; }
    if (j === 'main' && q.tenu == null) q.tenu = 'journal';
    q._jbras = j === 'bras';
    if (q.expr == null) q.expr = nz > 0.4 ? 'degoute' : br > 0.4 ? 'outre' : ap > 0.4 ? 'attendri' : 'neutre';
    if (q._libreF && q.tenu === 'journal') { q.ang.armF_up = -0.15; q.ang.armF_lo = -0.35; }
    gestes(q, Object.assign(env, { hautDef: 1 }));
    if (br > 0 && q.tenu === 'journal') q.ang.objet = (q.ang.objet || 0) + 0.25 * br * Math.sin((q.t || 0) * 14);
  };
  BOU.critique = wrap(CH.bouCritique, BOU.critiquePose, 0.85);

  // =====================================================================
  // CANICHE — gris perle toiletté (pompons), collier rouge ; BOU.caniche(t,x,y,s,{humeur,dir,herisse,eternue,marche})
  // =====================================================================
  const CA = { poil: '#b9b6b0', poilD: '#9e9b95', rase: '#c6bdb6', raseD: '#aba29b', collier: '#a8322b', nez: '#2a2224', langue: '#c9636a' };
  function caFluff(cx, cy, rx, ry, seed) { return (p) => fluff(cx, cy, rx, ry, 18, 0.12 + 0.3 * (p._her || 0), seed, (p._her || 0) > 0.3); }
  const caPaint = () => hatch(null, 0.8, 3, 0.16);
  function mkCaniche() {
    const leg = (x, back, seed) => ({ parent: 'corps', at: [x, 8], noRivet: true, base: back ? CA.raseD : CA.rase, seed, pts: [[-4, -4], [4, -4], [4, 54], [-4, 54]] });
    const pompon = (parent, back, seed) => ({ parent, at: [0, 50], noRivet: true, base: back ? CA.poilD : CA.poil, seed, pts: caFluff(0, 0, 11, 10, seed), paint: caPaint });
    const pied = (parent, back, seed) => ({ parent, at: [0, 58], noRivet: true, base: back ? CA.poilD : CA.poil, seed, pts: [[-6, -4], [6, -5], [11, 2, 1], [-6, 3, 1]] });
    const parts = {
      corps: { parent: null, at: [0, 0], base: CA.rase, seed: 8601, pts: ell(-4, 2, 38, 14, 16), paint: () => { hatch(null, 0.5, 3.4, 0.14); shade(0, -14, 0, 16, 0.25, [-45, -20, 45, 20]); } },
      queue: { parent: 'corps', at: [-38, -6], noRivet: true, base: CA.rase, seed: 8602, rest: -0.5, pts: [[-3, 0], [3, 0], [3, -30], [-3, -30]] },
      qpompon: { parent: 'queue', at: [0, -34], noRivet: true, base: CA.poil, seed: 8603, pts: caFluff(0, 0, 11, 11, 8603), paint: caPaint },
      hanche: { parent: 'corps', at: [-36, -2], noRivet: true, base: CA.poil, seed: 8604, pts: caFluff(0, 0, 15, 15, 8604), paint: caPaint },
      legBB: leg(-38, true, 8605), legFB: leg(24, true, 8606),
      pBB: pompon('legBB', true, 8607), pFB: pompon('legFB', true, 8608), fBB: pied('legBB', true, 8609), fFB: pied('legFB', true, 8610),
      criniere: { parent: 'corps', at: [22, -4], noRivet: true, base: CA.poil, seed: 8611, pts: caFluff(0, 0, 25, 23, 8611), paint: () => { caPaint(); shade(20, -20, -20, 20, 0.2, [-30, -30, 30, 30]); } },
      legBF: leg(-28, false, 8612), legFF: leg(34, false, 8613),
      pBF: pompon('legBF', false, 8614), pFF: pompon('legFF', false, 8615), fBF: pied('legBF', false, 8616), fFF: pied('legFF', false, 8617),
      head: { parent: 'corps', at: [36, -18], noRivet: true, base: CA.poil, seed: 8618, pts: [[-8, 2], [-6, -16], [2, -30], [14, -36], [24, -34], [34, -30], [50, -27], [58, -24, 1], [56, -18], [44, -15], [28, -12], [14, -2], [4, 6]], paint: (p) => {
        fillPts([[-8, -2], [6, -6], [8, 0], [-6, 4]], CA.collier); dot(6, -3, 2.2, '#d9b862');
        dot(57, -24, 3.6, CA.nez);
        if (p._joie) { fillPts([[46, -16], [54, -17], [50, -10]], '#3a1714', 0, 0); fillPts([[47, -15], [51, -15], [50, -8], [47, -9]], CA.langue, 0, 0); }
        const ey = p._peur ? [24, -28] : [24, -30];
        if (p._yeuxFermes) strokePts([[ey[0] - 4, ey[1]], [ey[0], ey[1] + 1.5], [ey[0] + 4, ey[1]]], '#1f1716', 1.6);
        else { dot(ey[0], ey[1], 3, '#1f1716'); dot(ey[0] + 1, ey[1] - 1, 0.9, '#ffffff'); }
        strokePts([[32, -24], [44, -22]], 'rgba(90,80,70,0.35)', 1);
        hatch(null, 0.8, 3, 0.12);
      }, extra: (p) => {
        if (SIL() || !(p._eternue > 0)) return;
        const u = p._eternue, c = cx_(); c.save();
        for (let i = 0; i < 6; i++) { const a = -0.6 + i * 0.24; c.beginPath(); c.arc(60 + Math.cos(a) * 26 * u, -24 + Math.sin(a) * 26 * u, 3.4 * (1 - u * 0.6), 0, TAU); c.fillStyle = `rgba(235,240,245,${0.85 * (1 - u)})`; c.fill(); }
        c.restore();
      } },
      topknot: { parent: 'head', at: [12, -40], noRivet: true, base: CA.poil, seed: 8619, pts: caFluff(0, 0, 14, 12, 8619), paint: caPaint },
      oreille: { parent: 'head', at: [10, -26], noRivet: true, base: CA.poilD, seed: 8620, pts: caFluff(0, 14, 9, 17, 8620), paint: caPaint },
    };
    return { hipY: -70, parts, handLen: 10, rod: { part: 'corps', at: [-2, 6] }, nom: 'caniche',
      order: ['queue', 'qpompon', 'legBB', 'pBB', 'fBB', 'legFB', 'pFB', 'fFB', 'corps', 'hanche', 'legBF', 'pBF', 'fBF', 'legFF', 'pFF', 'fFF', 'criniere', 'head', 'oreille', 'topknot'] };
  }
  CH.bouCaniche = mkCaniche();
  BOU.caniche = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 0.85 : s;
    const hu = o.humeur || 'calme', A = {}, q = { t, ang: A, dx: 0, dy: 0 };
    const her = clamp(o.herisse != null ? o.herisse : hu === 'peur' ? 0.8 : 0);
    q._her = her;
    let wag = 0.12 * Math.sin(t * 5);
    if (hu === 'joie') { wag = 0.55 * Math.sin(t * 17); A.head = -0.12; q.dy = -Math.abs(Math.sin(t * 6)) * 4; q._joie = true; }
    if (hu === 'renifle') { A.head = 0.55 + 0.08 * Math.sin(t * 11); wag = 0.18 * Math.sin(t * 7); A.oreille = 0.3; }
    if (hu === 'peur') { A.queue = 1.5; A.head = 0.18; q.dy = 10; q.dx = Math.sin(t * 43) * 1.4; A.oreille = -0.3; q._peur = true; q.tilt = -0.04; }
    A.queue = (A.queue || 0) + wag;
    if (o.eternue != null) {
      const u = t - o.eternue;
      if (u > -0.35 && u < 0.6) {
        const pre = u < 0 ? ease((u + 0.35) / 0.35) : 0, jerk = u >= 0 ? Math.exp(-7 * u) : 0;
        A.head = (A.head || 0) - 0.35 * pre + 0.45 * jerk; q._yeuxFermes = u > -0.2 && u < 0.25; q.dx = (q.dx || 0) - 4 * jerk;
        if (u >= 0) q._eternue = clamp(u / 0.55);
      }
    }
    const mk = k01(o.marche);
    if (mk > 0) { const ph = t * TAU * 2.4, sw = Math.sin(ph) * 0.4 * mk; A.legFF = sw; A.legBB = sw; A.legFB = -sw; A.legBF = -sw; A.pFF = -sw; A.pBB = -sw; A.pFB = sw; A.pBF = sw; q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 3 * mk; }
    const r = M.puppet(CH.bouCaniche, q, x, y, s, { dir: o.dir || 1, slot: o.slot != null ? o.slot : M.ST.slotF, cast: o.cast, alpha: o.alpha, rod: o.tige !== false });
    r.collier = r.w('head', 0, -1); r.nez = r.w('head', 57, -24);
    return r;
  };
  // laisse : courbe qui pend entre deux points écran (main de Madame → collier du caniche)
  BOU.laisse = function (p0, p1, o) {
    if (SIL()) return; o = o || {}; const c = cx_(), mou = o.mou == null ? 40 : o.mou;
    const mx = (p0[0] + p1[0]) / 2, my = Math.max(p0[1], p1[1]) + mou;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round';
    c.strokeStyle = 'rgba(20,12,10,0.35)'; c.lineWidth = 4.2; c.beginPath(); c.moveTo(p0[0], p0[1] + 1); c.quadraticCurveTo(mx, my + 1, p1[0], p1[1] + 1); c.stroke();
    c.strokeStyle = o.col || '#7a2a26'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(mx, my, p1[0], p1[1]); c.stroke();
    c.restore();
  };

  // =====================================================================
  // ACCESSOIRES SEULS — M.puppet à une pièce invisible ; l'objet se dessine dans l'extra (ombre portée possible)
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o, p) } }, order: ['o'] }); }
  function accDraw(name, draw, base, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s;
    const def = accDef(name, (oo) => { const c = cx_(), b = vOf(base, oo); c.save(); c.translate(-b[0], -b[1]); draw(oo); c.restore(); });
    return M.puppet(def, { o: Object.assign({ t: o.t || 0 }, o), tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  BOU.plan = (x, y, s, o) => accDraw('plan', drawPlan, OBJ.plan.base, x, y, s, o);
  BOU.journal = (x, y, s, o) => accDraw('journal', drawJournal, OBJ.journal.base, x, y, s, o);
  BOU.lorgnette = (x, y, s, o) => accDraw('lorgnette', drawLorgnette, OBJ.lorgnette.base, x, y, s, o);
  BOU.rouleau = (x, y, s, o) => { o = Object.assign({}, o); if (o.ang != null && o.rot == null) o.rot = o.ang; return accDraw('rouleau', drawRouleau, [0, 0], x, y, s, o); };
  BOU.medaille = function (x, y, s, o) {
    o = o || {}; const r = accDraw('medaille', drawMedaille, [0, 0], x, y, s, o);
    if (o.fil && !SIL()) { const a = r.w('o', 0, o.boucle === false ? -34 : -104), c = cx_(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.strokeStyle = 'rgba(30,24,20,0.75)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], -10); c.stroke(); c.restore(); }
    return r;
  };
  // pile des projets : (x,y) = sol sous le milieu ; n 0..1 (0 = rien, 1 = montagne ≈ 520 × 420 à s 1)
  const PILE = (() => {
    const R = M.rng(681), out = [];
    while (out.length < 170) {
      const xx = (R() * 2 - 1) * 250, hh = R() * 405, r = Math.hypot(xx / 250, hh / 405);
      if (r > 1) continue;
      out.push({ x: xx, y: -hh - 12, a: (R() - 0.5) * 1.1 + (R() < 0.15 ? 1.2 : 0), i: Math.floor(R() * 4), rub: Math.floor(R() * 4), r: r + R() * 0.05, f: R() < 0.5 ? -1 : 1 });
    }
    return out.sort((a, b) => a.r - b.r);
  })();
  function drawPile(o) {
    const n = clamp(o.n == null ? 1 : o.n), cnt = Math.round(n * PILE.length); if (cnt <= 0) return;
    const items = PILE.slice(0, cnt).sort((a, b) => b.y - a.y), c = cx_();
    for (const it of items) { c.save(); c.translate(it.x, it.y); c.rotate(it.a); c.scale(it.f, 1); drawRouleauSimple(TEINTES[TLIST[it.i]], RUBANS[it.rub]); c.restore(); }
  }
  BOU.pile = (x, y, s, o) => accDraw('pile', drawPile, [0, 0], x, y, s, o);
  BOU.PILE = { large: 520, haut: 420 };

  // =====================================================================
  // NOTRE-DAME de face (pierre ou tours en tuyaux) — (x,y) = milieu de la base ; à s 1 : 164 × 375 (flèche comprise), tours 272
  // =====================================================================
  const ND = { pierre: '#d8cfba', pierreD: '#b6aa90', ombre: '#8d826b', trou: '#4a4538', toit: '#7f8a8f' };
  const COUL = { bleu: '#3f6fa8', vert: '#4f8a4a', jaune: '#d7b53a', rouge: '#b23a2e', gris: '#c9cbcb' };
  function ogive(cx, y0, w, h) { return [[cx - w / 2, y0, 1], [cx - w / 2, y0 - h * 0.6], [cx, y0 - h, 1], [cx + w / 2, y0 - h * 0.6], [cx + w / 2, y0, 1]]; }
  function ndTourPierre(x0, x1, seed) {
    pc(box(x0, -272, x1, 0), ND.pierre, () => {
      const cxm = (x0 + x1) / 2;
      for (const ox of [-11, 11]) fillPts(ogive(cxm + ox, -206, 13, 54), ND.trou, 0, 0);
      for (const ox of [-11, 11]) for (let y = -214; y > -250; y -= 7) strokePts([[cxm + ox - 5, y], [cxm + ox + 5, y]], 'rgba(200,190,170,0.5)', 1);
      fillPts(ogive(cxm, -112, 16, 40), ND.trou, 0, 0);
      strokePts([[x0 + 3, -196], [x1 - 3, -196]], ND.ombre, 1.4); strokePts([[x0 + 3, -92], [x1 - 3, -92]], ND.ombre, 1.2);
      strokePts([[x0 + 4, 0], [x0 + 4, -272]], 'rgba(90,80,60,0.35)', 1.6); strokePts([[x1 - 4, 0], [x1 - 4, -272]], 'rgba(255,255,255,0.3)', 1.4);
      hatch(null, 0.9, 4, 0.16, 1, P.encre, [x0, -280, x1, 0]);
    }, seed);
    for (const px of [x0 + 3, x1 - 3]) pc([[px - 4, -272], [px, -286, 1], [px + 4, -272]], ND.pierreD, null, seed + 3);
  }
  function ndTourTuyaux(x0, x1, order, coul, seed, t) {
    const n = 4, w = (x1 - x0 - 4) / n, tops = [-286, -278, -292, -272];
    for (let i = 0; i < n; i++) {
      const cxp = x0 + 2 + w * (i + 0.5), col = M.mixc(COUL.gris, COUL[order[i]], coul), ty = tops[(i + seed) % 4];
      pc(box(cxp - w / 2 + 0.8, ty + 6, cxp + w / 2 - 0.8, -60), col, () => {
        strokePts([[cxp - w * 0.18, ty + 8], [cxp - w * 0.18, -62]], 'rgba(255,255,255,0.45)', 1.6); strokePts([[cxp + w * 0.3, ty + 8], [cxp + w * 0.3, -62]], 'rgba(0,0,0,0.25)', 2);
        for (let y = -100; y > ty; y -= 46) fillPts(box(cxp - w / 2, y - 3, cxp + w / 2, y + 3), 'rgba(0,0,0,0.22)');
      }, seed + 10 + i);
      pc(ell(cxp, ty + 6, w / 2 + 1.5, w * 0.36, 12), col, () => fillPts(ell(cxp, ty + 7, w / 2 - 2, w * 0.22, 10), '#1e2328', 0, 0), seed + 20 + i);
    }
    const BL = '#efeee8';
    for (const y of [-96, -146, -196, -246]) pc(box(x0 - 3, y - 3, x1 + 3, y + 3), BL, null, seed + 30);
    for (let k = 0; k < 4; k++) { const ya = -96 - 50 * k, yb = ya - 50; strokePts([[x0, ya], [x1, yb]], BL, 2.2); strokePts([[x1, ya], [x0, yb]], BL, 2.2); }
    for (const px of [x0 - 1, x1 + 1]) pc(box(px - 2.5, -262, px + 2.5, -62), BL, null, seed + 31);
    void t;
  }
  function drawNotreDame(o) {
    const k = clamp(o.tuyaux || 0), coul = o.couleurs == null ? 1 : clamp(o.couleurs), c = cx_();
    pc([[-5, -194], [0, -375, 1], [5, -194]], ND.pierreD, () => { for (let y = -210; y > -360; y -= 16) strokePts([[-4, y], [4, y - 3]], 'rgba(80,70,55,0.5)', 0.9); }, 9001);
    pc(box(-9, -208, 9, -188), ND.pierreD, null, 9002);
    pc([[-32, -188], [0, -214], [32, -188]], ND.toit, null, 9003);
    pc(box(-31, -194, 31, 0), ND.pierre, () => {
      fillPts(ogive(0, 0, 34, 66), ND.trou, 0, 0); for (let i = 1; i <= 2; i++) strokePts(ogive(0, 0, 34 + i * 8, 66 + i * 8).slice(0, 5), 'rgba(90,80,60,0.45)', 1.1);
      fillPts(box(-31, -88, 31, -76), ND.pierreD); for (let x = -27; x <= 27; x += 6) fillPts(box(x - 1.5, -86, x + 1.5, -78), ND.trou, 0, 0);
      fillPts(ell(0, -130, 22, 22, 22), ND.trou, 0, 0); strokePts(ep(0, -130, 22, 22, 22, 0, TAU), ND.pierreD, 2.2);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; strokePts([[Math.cos(a) * 6, -130 + Math.sin(a) * 6], [Math.cos(a) * 20, -130 + Math.sin(a) * 20]], 'rgba(200,190,170,0.75)', 1.2); }
      fillPts(ell(0, -130, 6, 6, 10), ND.pierreD, 0, 0);
      fillPts(box(-31, -194, 31, -176), ND.pierreD); for (let x = -26; x <= 26; x += 8) fillPts(ogive(x, -178, 5, 14), ND.trou, 0, 0);
      hatch(null, 0.9, 4, 0.14, 1, P.encre, [-32, -200, 32, 0]);
    }, 9004);
    const yCut = lerp(-50, -300, k);
    for (const [x0, x1, sd, ord] of [[-82, -31, 9010, ['bleu', 'vert', 'jaune', 'rouge']], [31, 82, 9050, ['rouge', 'jaune', 'vert', 'bleu']]]) {
      if (k < 1) { c.save(); if (k > 0) { c.beginPath(); c.rect(x0 - 10, -400, x1 - x0 + 20, 400 + yCut); c.clip(); } ndTourPierre(x0, x1, sd); c.restore(); }
      if (k > 0) {
        c.save(); c.beginPath(); c.rect(x0 - 10, yCut, x1 - x0 + 20, -yCut + 2); c.clip();
        pc(box(x0, -92, x1, 0), ND.pierre, () => { fillPts(ogive((x0 + x1) / 2, 0, 24, 52), ND.trou, 0, 0); hatch(null, 0.9, 4, 0.16, 1, P.encre, [x0, -96, x1, 0]); }, sd + 5);
        ndTourTuyaux(x0, x1, ord, coul, sd, o.t || 0); c.restore();
      }
    }
    for (const sx of [-1, 1]) pc(ogive(sx * 56.5, 0, 26, 52), ND.trou, null, 9090 + sx);
  }
  BOU.notreDame = function (x, y, s, o) { o = o || {}; const a = o.brume ? 1 - 0.55 * clamp(o.brume) : 1; return accDraw('notreDame', drawNotreDame, [0, 0], x, y, s, Object.assign({}, o, { alpha: (o.alpha == null ? 1 : o.alpha) * a })); };
  BOU.ND = { large: 164, haut: 375, tours: 272 };

  // =====================================================================
  // DÉCORS PRÉ-RENDUS : toits de Paris années 70 (+ Notre-Dame lointaine), plateau Beaubourg, Centre Pompidou (calques)
  // =====================================================================
  BOU.TOITS = { gag: [902, BACK - 504], cheminees: [] };
  const ZINC = '#7f8c96', ZINCD = '#69767f', PIERRE = '#d3c8ad', PIERRED = '#b9ad91', TUILE = '#b5643c';
  function immeuble(x0, x1, yTop, col, seed, o) {       // façade haussmannienne + toit mansardé en zinc + souches de cheminées
    o = o || {}; const R = M.rng(seed), h = o.mans || 34, base = o.base == null ? 0 : o.base;
    pc(box(x0, yTop + h - 2, x1, base), col, () => {
      const nw = Math.max(2, Math.round((x1 - x0) / 26)), dx = (x1 - x0) / nw;
      for (let y = yTop + h + 16; y < base - 20; y += 44) {
        for (let i = 0; i < nw; i++) fillPts(box(x0 + dx * i + dx * 0.3, y, x0 + dx * i + dx * 0.7, y + 24), 'rgba(50,55,65,0.55)', 0, 0);
        strokePts([[x0 + 2, y + 27], [x1 - 2, y + 27]], 'rgba(60,50,40,0.35)', 1.2);
      }
      hatch(null, 0.9, 4.5, 0.12, 1, P.encre, [x0, yTop, x1, base]);
    }, seed);
    pc([[x0 - 3, yTop + h], [x0 + 8, yTop + 4], [x1 - 8, yTop + 4], [x1 + 3, yTop + h]], o.zinc || ZINC, () => {
      for (let x = x0 + 14; x < x1 - 10; x += 28) { fillPts([[x - 6, yTop + h - 4], [x - 6, yTop + 16], [x, yTop + 10], [x + 6, yTop + 16], [x + 6, yTop + h - 4]], 'rgba(40,45,55,0.55)', 0, 0); }
      for (let x = x0 + 4; x < x1; x += 7) strokePts([[x, yTop + 5], [x - 2, yTop + h]], 'rgba(255,255,255,0.08)', 1);
    }, seed + 1);
    const out = [], gag = o.sans != null && o.sans > x0 + 10 && o.sans < x1 - 10;
    if (gag) BOU.TOITS.gag = [540 + o.sans, BACK + yTop + 6];
    const nc = 1 + Math.floor(R() * 2.5);
    for (let k = 0; k < nc; k++) {
      const cxm = lerp(x0 + 14, x1 - 14, (k + 0.5) / nc + (R() - 0.5) * 0.2), ch = 18 + R() * 12;
      if (gag && Math.abs(cxm - o.sans) < 26) continue;
      cheminee(cxm, yTop + 6, ch, seed + 10 + k, o.tuile);
      out.push([cxm, yTop + 4 - ch]);
    }
    return out;
  }
  function cheminee(cx, yb, h, seed, tuile) {
    pc(box(cx - 9, yb - h, cx + 9, yb), '#a99a86', () => hatch(null, 0.9, 3, 0.2), seed);
    for (const ox of [-5, 0, 5]) pc(box(cx + ox - 2, yb - h - 8, cx + ox + 2, yb - h), tuile || TUILE, null, seed + 1);
  }
  function drawToits(c, o) {
    o = o || {};
    // 1) horizon lointain très pâle (dôme du Panthéon à gauche)
    const far = [[-620, 0]]; const R = M.rng(70);
    let xx = -620; while (xx < 620) { const w = 40 + R() * 60, h = 470 + R() * 60; far.push([xx, -h + 10], [xx + 5, -h], [xx + w - 5, -h], [xx + w, -h + 10]); xx += w; }
    far.push([620, 0]);
    pc(far.map((p) => [p[0], p[1], 1]), '#b4b6b4', () => hatch(null, 0.9, 5, 0.06, 1, P.encre, [-620, -560, 620, 0]), 9101, { drop: false });
    pc(ep(-330, -540, 34, 40, 10, PI, TAU).concat([[-296, -500], [-364, -500]]), '#b0b2b0', null, 9102, { drop: false });
    pc(box(-338, -598, -322, -578), '#b0b2b0', null, 9103, { drop: false });
    // 2) Notre-Dame lointaine (x 220 → écran 760), pâlie
    const nd = M.pre(260, 420, (x) => { x.translate(130, 410); x.scale(0.7, 0.7); drawNotreDame({}); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(190,190,182,0.5)'; x.fillRect(0, 0, 260, 420); });
    c.drawImage(nd, 220 - 130, -470 - 410 + 8);
    // 3) rang moyen (zinc, cheminées en terre cuite)
    const xs = [-600, -500, -410, -300, -200, -90, 20, 120, 230, 330, 440, 540, 620];
    const chem = [];
    for (let i = 0; i < xs.length - 1; i++) { const top = -400 - ((i * 37) % 70); chem.push(...immeuble(xs[i], xs[i + 1], top, i % 2 ? PIERRE : '#cbbfa2', 9110 + i * 7, { sans: o.sans })); }
    // 4) rang proche sur les côtés (cadre le terrain vague)
    chem.push(...immeuble(-620, -420, -560, PIERRED, 9200, { mans: 40, sans: o.sans }));
    chem.push(...immeuble(-430, -330, -500, PIERRE, 9210, { mans: 36, sans: o.sans }));
    chem.push(...immeuble(330, 450, -510, PIERRE, 9220, { mans: 36, sans: o.sans }));
    chem.push(...immeuble(440, 620, -575, PIERRED, 9230, { mans: 40, sans: o.sans }));
    return chem;
  }
  function drawPlateau() {
    pc([[-620, 0, 1], [-620, -120], [-300, -136], [0, -142], [300, -132], [620, -118], [620, 0, 1]], '#a69575', () => {
      const R = M.rng(77);
      for (let i = 0; i < 26; i++) fillPts(ell(-600 + R() * 1200, -110 + R() * 100, 30 + R() * 50, 6 + R() * 6, 10), R() < 0.5 ? 'rgba(120,100,70,0.25)' : 'rgba(200,185,150,0.25)', 0, 0);
      for (let i = 0; i < 40; i++) { const x = -560 + R() * 1120, y = -100 + R() * 90; strokePts([[x, y], [x + 8 + R() * 14, y + (R() - 0.5) * 3]], 'rgba(80,65,45,0.35)', 1); }
      hatch(null, 0.15, 5, 0.12, 1, P.encre, [-620, -150, 620, 0]);
    }, 9301);
    for (let i = 0; i < 16; i++) { const x = -470 + (i % 6) * 22 + (Math.floor(i / 6) % 2) * 11, y = -40 - Math.floor(i / 6) * 13; pc(rrect(x - 10, y - 5, x + 10, y + 5, 2), '#8e8a82', null, 9310 + i); }
    for (const [fx, fy, rx] of [[-210, -22, 70], [160, -16, 82]]) pc(ell(fx, fy, rx, 9, 18), '#a7b6bd', () => { strokePts([[fx - rx * 0.6, fy - 2], [fx + rx * 0.3, fy - 3]], 'rgba(255,255,255,0.6)', 1.6); }, 9330 + fx);
    for (const bx of [-330, 380]) pc([[bx - 11, 0], [bx - 11, -42], [bx - 6, -52], [bx + 6, -52], [bx + 11, -42], [bx + 11, 0]], '#9b9488', () => { strokePts([[bx - 6, -44], [bx - 4, -4]], 'rgba(255,255,255,0.3)', 1.4); hatch(null, 0.9, 3, 0.2); }, 9340 + bx);
  }

  // ---------------- LE CENTRE POMPIDOU — façade est, 2000 × 520 à s 1 ; repère : (0,0) = milieu de la base ; x local −1000..1000 ; y local −520..0
  const CEN = { W: 2000, H: 520, LV: 520 / 6, ox: 1040, oy: 572, cw: 2080, ch: 612 };
  const COLS = []; for (let i = 0; i < 16; i++) COLS.push(-936 + 128 * i);
  const LEVY = [0, 1, 2, 3, 4, 5, 6].map((k) => -k * CEN.LV);
  const MAIN = -245;                                                              // y local « à hauteur de main » (écran 1150 posé sur ST.back à s 1)
  const TUY = [
    { fam: 'rouge', x: -360, w: 86, cage: true }, { fam: 'rouge', x: 536, w: 86, cage: true },
    { fam: 'vert', x: -232, w: 46 }, { fam: 'vert', x: 236, w: 42 }, { fam: 'vert', x: -744, w: 44 }, { fam: 'vert', x: 700, w: 44 }, { fam: 'vert', x: 980, w: 40 },
    { fam: 'bleu', x: -104, w: 84, top: -478 }, { fam: 'bleu', x: 330, w: 96, kink: [-300, 420], top: -500 }, { fam: 'bleu', x: -616, w: 90, top: -470 }, { fam: 'bleu', x: 830, w: 90, top: -486 },
    { fam: 'jaune', x: 152, w: 42 }, { fam: 'jaune', x: -488, w: 40 }, { fam: 'jaune', x: 620, w: 40 }, { fam: 'jaune', x: 924, w: 40 }, { fam: 'jaune', x: -872, w: 40 },
  ];
  const PAL = { gris: { b: '#c9cbcb', d: '#9fa3a6', l: '#e6e7e6' }, bleu: { b: '#3f6fa8', d: '#2c5283', l: '#7099c8' }, vert: { b: '#4f8a4a', d: '#386934', l: '#7cb075' }, jaune: { b: '#d7b53a', d: '#a98a1e', l: '#efd67e' }, rouge: { b: '#b23a2e', d: '#842820', l: '#d4705f' } };
  const PORTE = { x: 24, w: 76, h: 62 };
  const ESC = { a: [-1000, -70], b: [-760, -300], r: 17 };
  function tubeLine(line, w, pal, seed) {
    const poly = ribbon(line, w, w); poly[0] = [poly[0][0], poly[0][1], 1]; poly[line.length - 1] = [poly[line.length - 1][0], poly[line.length - 1][1], 1]; poly[line.length] = [poly[line.length][0], poly[line.length][1], 1]; poly[poly.length - 1] = [poly[poly.length - 1][0], poly[poly.length - 1][1], 1];
    pc(poly, pal.b, () => {
      strokePts(offsetLine(line, -w * 0.3), 'rgba(0,0,0,0.22)', w * 0.32);
      strokePts(offsetLine(line, w * 0.2), pal.l, w * 0.16);
      strokePts(offsetLine(line, w * 0.3), 'rgba(255,255,255,0.35)', Math.max(1.5, w * 0.05));
      hatch(null, 0.9, 4.5, 0.12, 1, P.encre, [-1100, -620, 1100, 20]);
    }, seed);
  }
  function anneau(x, y, w, pal, seed) { pc(box(x - w / 2 - 4, y - 6, x + w / 2 + 4, y + 6), pal.d, () => { strokePts([[x - w / 2 - 2, y - 3], [x + w / 2 + 2, y - 3]], pal.l, 1.6); for (const bx of [x - w / 3, x, x + w / 3]) dot(bx, y + 1, 1.8, 'rgba(0,0,0,0.4)'); }, seed); }
  function drawTuyau(T, pal, seed) {
    const top = T.top || -536;
    if (T.fam === 'jaune') {                                                       // gaine électrique rectangulaire + boîtes de jonction
      pc(box(T.x - T.w / 2, top, T.x + T.w / 2, 0), pal.b, () => {
        fillPts(box(T.x - T.w / 2, top, T.x - T.w / 2 + 6, 0), pal.d); fillPts(box(T.x + T.w / 2 - 5, top, T.x + T.w / 2, 0), 'rgba(0,0,0,0.18)');
        strokePts([[T.x + 4, top + 4], [T.x + 4, -4]], pal.l, 2); hatch(null, 0.9, 4.5, 0.1, 1, P.encre, [-1100, -620, 1100, 20]);
      }, seed);
      for (const yb of [-262, -436, -90]) pc(box(T.x - T.w / 2 - 9, yb - 22, T.x + T.w / 2 + 9, yb + 22), pal.b, () => { fillPts(box(T.x - T.w / 2 - 9, yb - 22, T.x + T.w / 2 + 9, yb - 16), pal.l); strokePts([[T.x - T.w / 2 - 5, yb + 18], [T.x + T.w / 2 + 5, yb + 18]], pal.d, 2); for (const bx of [T.x - T.w / 2 - 4, T.x + T.w / 2 + 4]) dot(bx, yb, 2, 'rgba(0,0,0,0.45)'); }, seed + 5);
      return;
    }
    if (T.cage) {                                                                  // cage d'ascenseur vitrée à cadre
      const x0 = T.x - T.w / 2, x1 = T.x + T.w / 2;
      fillPts(box(x0 + 6, -540, x1 - 6, 0), 'rgba(205,222,228,0.35)', 0, 0);
      strokePts([[T.x - 6, -540], [T.x - 6, 0]], 'rgba(40,40,40,0.4)', 1); strokePts([[T.x + 6, -540], [T.x + 6, 0]], 'rgba(40,40,40,0.4)', 1);
      for (const xr of [x0, x1 - 9]) pc(box(xr, -548, xr + 9, 0), pal.b, () => strokePts([[xr + 3, -546], [xr + 3, -2]], pal.l, 1.6), seed + xr);
      for (let k = 0; k <= 12; k++) { const y = -k * CEN.LV / 2; if (y < -540) break; pc(box(x0, y - 3.5, x1, y + 3.5), k % 2 ? pal.d : pal.b, null, seed + 40 + k); }
      for (let k = 0; k < 6; k++) { const ya = LEVY[k], yb = LEVY[k + 1]; strokePts([[x0 + 9, ya], [x1 - 9, yb]], pal.d, 2); }
      pc(box(x0 - 4, -566, x1 + 4, -540), pal.b, () => { fillPts(box(x0, -560, x1, -552), 'rgba(0,0,0,0.25)'); }, seed + 70);
      return;
    }
    let line;
    if (T.kink) { const [ky, x2] = T.kink; line = rounded([[T.x, 0], [T.x, ky], [x2, ky - 40], [x2, top]], T.w * 0.9); }
    else line = [[T.x, 0], [T.x, top]];
    tubeLine(line, T.w, pal, seed);
    const xAt = (y) => (T.kink && y < T.kink[0] - 40 ? T.kink[1] : T.x);
    for (let k = 1; k <= 5; k++) { const y = LEVY[k] + 8; if (T.kink && y < T.kink[0] + 30 && y > T.kink[0] - 70) continue; if (y > top + 10) anneau(xAt(y), y, T.w, pal, seed + 10 + k); }
    pc(box(T.x - T.w / 2 - 5, -14, T.x + T.w / 2 + 5, 0), pal.d, null, seed + 20);
    if (T.fam === 'bleu') {                                                        // coude vers le spectateur : bouche ouverte en haut
      const xt = xAt(top - 1);
      pc(ell(xt, top, T.w / 2 + 9, T.w * 0.4, 18), pal.b, () => { fillPts(ell(xt, top + 3, T.w / 2 - 3, T.w * 0.27, 16), '#1d2228', 0, 0); strokePts(ep(xt, top, T.w / 2 + 6, T.w * 0.37, 10, PI * 1.05, PI * 1.6), pal.l, 2); }, seed + 30);
    }
    if (T.fam === 'vert') {                                                        // brides, piquages et volant de vanne
      for (let k = 1; k <= 5; k++) { const y = LEVY[k] + 36; pc(box(T.x + T.w / 2 - 2, y - 8, T.x + T.w / 2 + 26, y + 8), pal.b, () => strokePts([[T.x + T.w / 2, y - 3], [T.x + T.w / 2 + 24, y - 3]], pal.l, 1.5), seed + 40 + k); pc(box(T.x + T.w / 2 + 22, y - 12, T.x + T.w / 2 + 30, y + 12), pal.d, null, seed + 50 + k); }
      const vy = MAIN + 24; pc(ell(T.x - T.w / 2 - 14, vy, 13, 13, 14), pal.d, () => { for (let i = 0; i < 4; i++) { const a = i / 4 * PI; strokePts([[T.x - T.w / 2 - 14 - Math.cos(a) * 10, vy - Math.sin(a) * 10], [T.x - T.w / 2 - 14 + Math.cos(a) * 10, vy + Math.sin(a) * 10]], pal.l, 1.6); } }, seed + 60);
    }
  }
  function drawFond(c, vide) {
    const L = -1000, R = 1000;
    if (!vide) {
      pc(box(L, -526, R, 0), '#8399a3', () => {
        const g = c.createLinearGradient(0, -526, 0, 0); g.addColorStop(0, 'rgba(200,215,220,0.45)'); g.addColorStop(0.6, 'rgba(120,140,150,0.1)'); g.addColorStop(1, 'rgba(40,50,60,0.35)'); c.fillStyle = g; c.fillRect(L, -526, R - L, 526);
        for (let i = 0; i < 9; i++) { const x = -980 + i * 240; fillPts([[x, -526], [x + 60, -526], [x - 120, 0], [x - 180, 0]], 'rgba(255,255,255,0.07)', 0, 0); }
        for (let k = 0; k < 6; k++) { const y0 = LEVY[k + 1], y1 = LEVY[k]; fillPts(box(L, y1 - 22, R, y1 - 6), 'rgba(40,40,40,0.12)', 0, 0); strokePts([[L, y0 + 14], [R, y0 + 14]], 'rgba(230,220,180,0.18)', 3); }
        hatch(null, 0.9, 5, 0.1, 1, P.encre, [L, -530, R, 0]);
      }, 9401, { drop: false });
    } else {
      pc(box(L, -526, R, 0), '#efdfb3', () => {
        for (let k = 0; k < 6; k++) {
          const y0 = LEVY[k + 1], y1 = LEVY[k], g = c.createLinearGradient(0, y0, 0, y1);
          g.addColorStop(0, '#fbf3d8'); g.addColorStop(0.35, '#f2e3b8'); g.addColorStop(0.8, '#e2cd96'); g.addColorStop(1, '#c9b07a'); c.fillStyle = g; c.fillRect(L, y0, R - L, y1 - y0);
          for (let x = L + 20; x < R; x += 42) fillPts(ell(x, y0 + 10, 9, 2.6, 8), '#fffbe8', 0, 0);
          for (let x = L; x < R; x += 64) strokePts([[x, y0 + 4], [x + 32, y0 + 16], [x + 64, y0 + 4]], 'rgba(160,140,100,0.3)', 1);
          strokePts([[L, y1 - 14], [R, y1 - 14]], 'rgba(150,125,80,0.45)', 1.4);
          for (let x = L + 40; x < R; x += 256) strokePts([[x, y0 + 18], [x, y1 - 14]], 'rgba(170,150,110,0.25)', 3);
        }
        const g2 = c.createRadialGradient(0, -260, 50, 0, -260, 900); g2.addColorStop(0, 'rgba(255,250,225,0.25)'); g2.addColorStop(1, 'rgba(255,250,225,0)'); c.fillStyle = g2; c.fillRect(L, -526, R - L, 526);
      }, 9402, { drop: false });
    }
    for (let k = 0; k < 6; k++) {
      const y0 = LEVY[k + 1], y1 = LEVY[k];
      for (let x = L + 32; x < R; x += 32) strokePts([[x, y0 + 4], [x, y1 - 4]], vide ? 'rgba(50,55,60,0.55)' : 'rgba(45,52,58,0.8)', 1.6);
      strokePts([[L, y0 + CEN.LV * 0.3], [R, y0 + CEN.LV * 0.3]], vide ? 'rgba(50,55,60,0.45)' : 'rgba(45,52,58,0.7)', 1.4);
    }
    for (let k = 1; k <= 5; k++) pc(box(L, LEVY[k] - 5, R, LEVY[k] + 4), '#555b61', null, 9410 + k, { drop: false });
    pc(box(L, -530, R, -516), '#7d8287', () => strokePts([[L, -528], [R, -528]], 'rgba(255,255,255,0.3)', 1.4), 9420, { drop: false });
    pc(box(L, -10, R, 0), '#4b5056', null, 9421, { drop: false });
  }
  function drawBoite() {
    pc(box(-1000, -536, 1000, 0), '#86888a', () => {
      for (let y = -536 + 43; y < 0; y += 43) strokePts([[-1000, y], [1000, y]], 'rgba(50,50,50,0.16)', 1.4);
      strokePts([[-1000, -532], [1000, -532]], 'rgba(255,255,255,0.45)', 3); fillPts(box(-1000, -14, 1000, 0), 'rgba(30,30,30,0.35)');
      for (let x = -1000 + 64; x < 1000; x += 128) strokePts([[x, -536], [x, 0]], 'rgba(60,60,60,0.08)', 1.2);
      const c = cx_(), g = c.createLinearGradient(0, -536, 0, 0); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.12)'); c.fillStyle = g; c.fillRect(-1000, -536, 2000, 536);
      hatch(null, 0.9, 5, 0.08, 1, P.encre, [-1000, -540, 1000, 0]);
    }, 9501, { drop: false });
  }
  function drawStructure() {
    const BL = '#ebeae4', BLD = '#c9c7bf';
    for (let k = 0; k < 6; k++) for (let i = 0; i < COLS.length - 1; i++) {
      const xa = COLS[i], xb = COLS[i + 1], ya = LEVY[k], yb = LEVY[k + 1];
      strokePts([[xa, ya], [xb, yb]], 'rgba(30,30,30,0.25)', 3); strokePts([[xb, ya], [xa, yb]], 'rgba(30,30,30,0.25)', 3);
      strokePts([[xa, ya - 1], [xb, yb - 1]], BL, 2.6); strokePts([[xb, ya - 1], [xa, yb - 1]], BL, 2.6);
    }
    for (let k = 1; k <= 6; k++) pc(box(-1000, LEVY[k] - 6, 1000, LEVY[k] + 5), BL, () => { strokePts([[-1000, LEVY[k] + 3], [1000, LEVY[k] + 3]], BLD, 2); strokePts([[-1000, LEVY[k] - 4], [1000, LEVY[k] - 4]], 'rgba(255,255,255,0.8)', 1.2); }, 9600 + k);
    for (const xc of COLS) pc(box(xc - 8, -540, xc + 8, 0), BL, () => { strokePts([[xc + 4, -538], [xc + 4, -2]], BLD, 3); strokePts([[xc - 4, -538], [xc - 4, -2]], 'rgba(255,255,255,0.85)', 1.4); }, 9620 + xc);
    for (let k = 1; k <= 6; k++) for (const xc of COLS) {
      const y = LEVY[k];
      pc([[xc - 18, y - 7], [xc + 18, y - 7], [xc + 12, y + 11], [xc - 12, y + 11]], BL, () => { strokePts([[xc - 12, y + 8], [xc + 12, y + 8]], BLD, 2); }, 9700 + k * 31 + xc);
      dot(xc, y + 1, 2.4, '#9a9890');
    }
  }
  function drawEscalier(pal) {
    const a = ESC.a, b = ESC.b, r = ESC.r;
    const line = [a, b];
    const poly = ribbon(line, r * 2, r * 2);
    fillPts(poly, 'rgba(205,222,228,0.45)', 0, 0);
    strokePts(offsetLine(line, r), pal.b, 4); strokePts(offsetLine(line, -r), pal.b, 4);
    const n = 12; for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); strokePts(ep(x, y, 5, r, 8, -PI / 2, PI / 2), pal.b, 3); }
    strokePts(offsetLine(line, r * 0.4), 'rgba(60,60,60,0.5)', 1.4);
    for (const p of [a, b]) pc(box(p[0] - 10, p[1] - 4, p[0] + 10, 0), pal.d, null, 9800 + p[0]);
  }
  function famLayer(fam, pal) { return (x) => { if (fam === 'rouge') drawEscalier(pal); TUY.forEach((T, i) => { if (T.fam === fam) drawTuyau(T, pal, 9900 + i * 100); }); }; }
  function mkLayer(fn) { return M.cutFlat(CEN.cw, CEN.ch, CEN.ox, CEN.oy, fn); }
  function shadowOf(cvs, blur) { return M.pre(CEN.cw, CEN.ch, (x) => { x.filter = `brightness(0) blur(${blur}px)`; for (const cv of cvs) x.drawImage(cv, 0, 0); }); }

  BOU.init = function () {
    const K = (BOU.K = {});
    K.ciel = M.makeSky('paris');
    let chem = [];
    K.toits = M.cutFlat(1240, 1000, 620, 990, (c) => { chem = drawToits(c, { sans: 362 }); }); K.toits.padB = 10;
    BOU.TOITS.cheminees = chem.map((p) => [540 + p[0], BACK + p[1]]);
    K.plateau = M.withShadow(M.cutFlat(1240, 170, 620, 160, () => drawPlateau()), 6); K.plateau.padB = 10;
    const Cn = (K.centre = {});
    Cn.fond = mkLayer((c) => drawFond(c, false));
    Cn.vide = mkLayer((c) => drawFond(c, true));
    Cn.boite = mkLayer(() => drawBoite());
    Cn.structure = mkLayer(() => drawStructure());
    for (const f of ['bleu', 'vert', 'jaune', 'rouge']) { Cn[f + 'G'] = mkLayer(famLayer(f, PAL.gris)); Cn[f + 'C'] = mkLayer(famLayer(f, PAL[f])); }
    Cn.structureSh = shadowOf([Cn.structure], 5);
    Cn.rougeSh = shadowOf([Cn.rougeG], 6);
    Cn.tuyauxSh = shadowOf([Cn.bleuG, Cn.vertG, Cn.jauneG], 6);
    return K;
  };
  // toits : à poser juste après la toile de fond ; o.tremble (px, ondulation), o.chute 0..1 (la cheminée du gag bascule et tombe derrière les toits)
  
  BOU.toits = function (t, o) {
    o = o || {}; const K = BOU.K, a = o.tremble || 0;
    M.flat(K.toits, 540, BACK, a > 0.05 ? { ripple: { amp: a, t, k: 0.02, w: 16, cy: -450 } } : {});
    const ch = clamp(o.chute || 0), g = BOU.TOITS.gag, c = cx_(), dx = a > 0.05 ? a * Math.sin((g[1] - BACK) * 0.02 - t * 16) * Math.exp(-Math.abs(g[1] - BACK + 450) / 700) : 0;
    c.save(); c.beginPath(); c.rect(0, 0, W, g[1] + 1); c.clip();
    const rot = 1.4 * ease(clamp(ch * 1.6)), fall = Math.pow(clamp((ch - 0.45) / 0.55), 2) * 140;
    c.translate(g[0] + 9 + dx, g[1] + fall); c.rotate(rot); c.translate(-(g[0] + 9), -g[1]);
    const def = accDef('chemGag', () => { const G = BOU.TOITS.gag; cheminee(G[0], G[1], 26, 9990); });
    M.puppet(def, { o: {} }, 0, 0, 1, { rod: false, floorShadow: false });
    c.restore();
  };
  // plateau Beaubourg : o.descend 0..1 (il descend par la trappe)
  BOU.plateau = function (t, o) { o = o || {}; const d = ease(clamp(o.descend || 0)); M.flat(BOU.K.plateau, 540, BACK + d * 180, { clipY: BACK + 1 }); };
  BOU.PLATEAU = { flaques: [[330, BACK - 22], [700, BACK - 16]], bornes: [210, 920], haut: BACK - 142 };

  // ---------------- BOU.centre : calques + animations
  const TUYP = { rouge: [-360, MAIN], vert: [-232, MAIN], bleu: [-104, MAIN], jaune: [152, MAIN], vert2: [236, MAIN], bleu2: [330, MAIN], rouge2: [536, MAIN], jaune2: [620, MAIN],
    porte: [PORTE.x, -PORTE.h / 2], bouffee: [-104, -496], goutte: [-232 + 23 + 30, LEVY[3] + 36 + 12], etincelle: [152 + 30, -262], toit: [0, -536] };
  function yMonte(o, y, s) { const mo = o.monte == null ? 1 : clamp(o.monte); return y + (1 - mo) * (CEN.H + 60) * s; }
  BOU.centrePt = function (o, nom, x, y, s) { o = o || {}; s = s == null ? 1 : s; const p = TUYP[nom] || TUYP.bleu; return [x + p[0] * s, yMonte(o, y, s) + p[1] * s]; };
  BOU.CENTRE = { large: CEN.W, haut: CEN.H, xPose: 540, main: MAIN, tuyaux: TUY.map((T) => ({ fam: T.fam, x: T.x, w: T.w })), porte: PORTE, niveaux: LEVY };
  const evts = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  BOU.centre = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 1 : s; const K = BOU.K.centre, c = cx_();
    const g = (v, d) => (v == null ? d : clamp(v));
    const st = g(o.structure, 1), es = g(o.escaliers, 1), tu = g(o.tuyaux, 1), bo = g(o.boite, 0), vi = g(o.vide, 0), vis = g(o.visiteurs, 0), po = g(o.portes, 0);
    const cAll = o.couleurs == null ? 0 : clamp(o.couleurs), col = { bleu: g(o.bleu, cAll), vert: g(o.vert, cAll), jaune: g(o.jaune, cAll), rouge: g(o.rouge, cAll) };
    const yy = yMonte(o, y, s), fr = o.frisson || 0;
    c.save();
    if ((o.monte != null && o.monte < 1) || o.clipY) { c.beginPath(); c.rect(-50, -50, W + 100, (o.clipY || y + 1) + 50); c.clip(); }
    c.translate(x, yy); c.scale(s, s);
    const img = (cv, a) => { if (a <= 0.003) return; c.globalAlpha = a; c.drawImage(cv, -CEN.ox, -CEN.oy); c.globalAlpha = 1; };
    const slices = (cv, a, y0, y1) => {                                               // rangées y0..y1 (local), ondulées par `frisson`
      if (a <= 0.003 || y1 <= y0) return; c.globalAlpha = a;
      if (fr > 0.3) { const sh = 14; for (let yl = y0; yl < y1; yl += sh) { const h = Math.min(sh, y1 - yl), dx = fr * Math.sin(yl * 0.035 - t * 15); c.drawImage(cv, 0, CEN.oy + yl, CEN.cw, h + 0.6, -CEN.ox + dx, yl, CEN.cw, h + 0.6); } }
      else c.drawImage(cv, 0, CEN.oy + y0, CEN.cw, y1 - y0, -CEN.ox, y0, CEN.cw, y1 - y0);
      c.globalAlpha = 1;
    };
    const sortie = (k, sh, fn) => {                                                   // une famille sort de la façade : grandit un peu, ombre qui s'éloigne
      if (k <= 0.003) return; const e = ease(k), sc = lerp(0.955, 1, e);
      c.save(); c.translate(0, -260); c.scale(sc, sc); c.translate(0, 260);
      c.globalAlpha = 0.34 * e; c.drawImage(sh, -CEN.ox + 4 + 9 * e, -CEN.oy + 3 + 7 * e); c.globalAlpha = 1;
      fn(clamp(k * 2.4)); c.restore();
    };
    const famille = (f, a) => {                                                       // gris partout, couleur qui coule de bas en haut
      const k = col[f], yc = lerp(12, -585, k);
      slices(K[f + 'G'], a, -CEN.oy, Math.min(yc, CEN.ch - CEN.oy));
      if (k > 0.002) { slices(K[f + 'C'], a, Math.max(-CEN.oy, yc), CEN.ch - CEN.oy); if (k < 0.999) slices(K[f + 'C'], a * 0.45, Math.max(-CEN.oy, yc - 18), Math.max(-CEN.oy, yc)); }
    };
    // 1) vitrages (ou plateaux vides éclairés), portes, boîte nue
    img(K.fond, 1); if (vi > 0) img(K.vide, vi);
    if (vi > 0.2 && vis > 0) {                                                       // silhouettes minuscules dans les plateaux
      c.globalAlpha = Math.min(vi, vis);
      for (let k = 0; k < 6; k++) for (let i = 0; i < 7; i++) { const sp = 0.03 + 0.03 * hash(k * 7 + i), xx = -980 + ((hash(k * 13 + i * 3) * 2000 + t * 60 * sp * (i % 2 ? 1 : -1) * 10) % 2000 + 2000) % 2000, yb = LEVY[k] - 15; c.fillStyle = 'rgba(50,45,50,0.8)'; c.fillRect(xx - 2, yb - 13, 4, 13); c.beginPath(); c.arc(xx, yb - 16, 2.6, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    }
    { const P0 = PORTE, x0 = P0.x - P0.w / 2, ou = ease(po) * P0.w * 0.46;              // portes vitrées du rez-de-chaussée
      c.fillStyle = '#2f3438'; c.fillRect(x0 - 6, -P0.h - 6, P0.w + 12, P0.h + 6);
      c.fillStyle = po > 0 ? '#f2dfa6' : '#3d4a52'; c.fillRect(x0, -P0.h, P0.w, P0.h);
      c.fillStyle = 'rgba(170,195,205,0.85)'; c.fillRect(x0 - ou, -P0.h, P0.w / 2 - 1, P0.h); c.fillRect(x0 + P0.w / 2 + 1 + ou, -P0.h, P0.w / 2 - 1, P0.h);
      c.strokeStyle = '#2f3438'; c.lineWidth = 2.4; c.strokeRect(x0 - ou, -P0.h, P0.w / 2 - 1, P0.h); c.strokeRect(x0 + P0.w / 2 + 1 + ou, -P0.h, P0.w / 2 - 1, P0.h);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x0 - ou + 5, -P0.h + 5, 4, P0.h - 10); c.fillRect(x0 + P0.w / 2 + 6 + ou, -P0.h + 5, 4, P0.h - 10); }
    img(K.boite, bo);
    // 2) exosquelette blanc
    sortie(st, K.structureSh, (a) => img(K.structure, a));
    // 3) cages d'ascenseur (cabines + visiteurs) et escalier mécanique
    sortie(es, K.rougeSh, (a) => {
      c.globalAlpha = a;
      for (const T of TUY) if (T.cage) {
        const u = vis > 0 ? 0.5 - 0.5 * Math.cos(t * 0.55 + T.x * 0.01) : 0, yc = lerp(-6, -520, u * vis), cw = T.w - 22, ch = 44;
        const kc = clamp((col.rouge * 585 + yc) / 40);
        c.fillStyle = M.mixc('#a9acae', '#b23a2e', kc); c.fillRect(T.x - cw / 2, yc - ch, cw, ch);
        c.fillStyle = vis > 0 ? '#f6e2a2' : '#53626b'; c.fillRect(T.x - cw / 2 + 5, yc - ch + 6, cw - 10, ch - 14);
        if (vis > 0) { c.fillStyle = 'rgba(40,35,40,0.9)'; for (let i = 0; i < 3; i++) { const px = T.x - cw / 2 + 12 + i * ((cw - 24) / 2); c.fillRect(px - 2.5, yc - 20, 5, 12); c.beginPath(); c.arc(px, yc - 24, 3.2, 0, TAU); c.fill(); } }
      }
      if (vis > 0) { c.fillStyle = 'rgba(40,35,40,0.85)'; for (let i = 0; i < 6; i++) { const u = ((t * 0.07 + i / 6) % 1 + 1) % 1, px = lerp(ESC.a[0], ESC.b[0], u), py = lerp(ESC.a[1], ESC.b[1], u) + 6; c.fillRect(px - 2, py - 12, 4, 10); c.beginPath(); c.arc(px, py - 15, 2.6, 0, TAU); c.fill(); } }
      c.globalAlpha = 1;
      famille('rouge', a);
    });
    // 4) tuyaux : bleu (air), vert (eau), jaune (électricité)
    sortie(tu, K.tuyauxSh, (a) => { famille('vert', a); famille('jaune', a); famille('bleu', a); });
    // 5) effets ponctuels (instants en secondes)
    for (const t0 of evts(o.bouffee)) { const u = t - t0; if (u < 0 || u > 1.6) continue; const p = TUYP.bouffee;
      for (let i = 0; i < 5; i++) { const v = clamp((u - i * 0.07) / 1.4); if (v <= 0) continue; c.beginPath(); c.arc(p[0] + (i - 2) * 9 * v + Math.sin(i * 2.1) * 6, p[1] - 10 - v * 90 - i * 6, 10 + v * 30, 0, TAU); c.fillStyle = `rgba(236,240,244,${0.75 * (1 - v)})`; c.fill(); } }
    for (const t0 of evts(o.goutte)) { const u = t - t0; if (u < 0 || u > 1.3) continue; const p = TUYP.goutte, grow = clamp(u / 0.35), fall = Math.max(0, u - 0.35), yd = p[1] + 0.5 * 2600 * fall * fall;
      if (yd < 20) { const r = 3 + 4 * grow; c.fillStyle = 'rgba(120,170,200,0.95)'; c.beginPath(); c.moveTo(p[0], yd - r * 2.2); c.quadraticCurveTo(p[0] + r * 1.2, yd - r * 0.2, p[0], yd + r); c.quadraticCurveTo(p[0] - r * 1.2, yd - r * 0.2, p[0], yd - r * 2.2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(p[0] - r * 0.4, yd - r * 0.6, 1.6, 2.4); } }
    for (const t0 of evts(o.etincelle)) { const u = t - t0; if (u < 0 || u > 0.7) continue; const p = TUYP.etincelle, v = u / 0.7;
      c.save(); c.translate(p[0], p[1]); c.strokeStyle = `rgba(255,236,150,${1 - v})`; c.lineWidth = 3; c.beginPath();
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r0 = 6 + 20 * v, r1 = r0 + 14 * (1 - v) + 6; c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); } c.stroke();
      c.fillStyle = `rgba(255,250,220,${1 - v})`; c.beginPath(); c.arc(0, 0, 7 * (1 - v) + 2, 0, TAU); c.fill(); c.restore(); }
    c.restore();
  };
})();
