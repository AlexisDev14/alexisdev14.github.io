// ecriture.js — « La première écriture, une liste de bières » (Uruk, vers 3300 av. J.-C.) : scribe, poète, ouvriers, tablettes, jarre de bière, entrepôt du temple ; espace M.ecr (ECR).
// Mode d'emploi : persos.md (ne pas lire ce fichier en entier). Aucun texte, lettre, chiffre ni signe cunéiforme : des dessins et des encoches. Déterministe (aucun Math.random).
(function () {
  'use strict';
  const X = M.X, P = M.P, TAU = M.TAU, PI = Math.PI, D = 180 / PI;
  const { fillPts, strokePts, dot, hatch, shade, piece, lerp, clamp, ease, hash } = M;
  const ECR = (M.ecr = {});
  const CH = M.chars;
  const cx_ = () => M.ctx();
  const SIL = () => M._sil();
  const OFFP = [[-9000, -9000, 1], [-8999, -9000, 1], [-9000, -8999, 1]];

  // ------------------------------------------------------------ géométrie
  function ep(cx, cy, rx, ry, n, a0, a1) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
  function ell(cx, cy, rx, ry, n) { const o = ep(cx, cy, rx, ry, n || 16, 0, TAU); o.pop(); return o; }
  function ellR(cx, cy, rx, ry, a, n) { const o = []; n = n || 12; for (let i = 0; i < n; i++) { const u = i / n * TAU, x = Math.cos(u) * rx, y = Math.sin(u) * ry; o.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]); } return o; }
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
  function qbez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  const normA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
  const box = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
  const pc = (pts, base, paint, seed, o) => piece(pts, base, paint || null, Object.assign({ seed: seed || 0 }, o || {}));
  const k01 = (v) => ease(clamp(v || 0));
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const has = (v) => v && v !== 'rien';
  const vOf = (v, o) => (typeof v === 'function' ? v(o || {}) : v);
  function tube(a, b, w, col, seed) { pc(ribbon([a, b], w, w), col, null, seed || 0, { drop: false }); }
  ECR.geo = { ep, ell, ellR, ribbon, qbez, box };

  // ------------------------------------------------------------ bras et jambes à articulations rondes (repères : hanche à 254 au-dessus des pieds)
  const R_COUDE = 11.5, LA = 100, LB = Math.hypot(4, 96), PHI = Math.atan2(-4, 96);
  const SH_F = [-2, -156], SH_B = [-10, -156], HEAD_AT = [6, -180];
  const TH = 124, SHN = 116, HIP = 254;
  function armR(len, wt) { wt = wt || 15; return ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, 40], [R_COUDE + 0.5, len - 6]], ep(0, len, R_COUDE, R_COUDE, 10, 0, PI), [[-R_COUDE - 0.5, len - 6], [-wt + 1, 40]]); }
  function foreR(kind) { const f = X.forePts(kind); return ep(0, 0, R_COUDE, R_COUDE, 10, PI, TAU).concat(f.slice(2)); }
  const legC = (len, wt, rk) => ep(0, 0, wt, wt, 10, PI, TAU).concat([[wt - 1, len * 0.5], [rk + 0.5, len - 4]], ep(0, len, rk, rk, 10, 0, PI), [[-rk - 0.5, len - 4], [-wt + 1, len * 0.5]]);
  const shinCalf = (len, kt, ak, g) => ep(0, 0, kt, kt, 10, PI, TAU).concat([[kt - 1, len * 0.3], [ak + 2.5, len * 0.74], [ak + 0.5, len - 4]], ep(0, len, ak, ak, 10, 0, PI),
    [[-ak - 1, len - 6], [-ak - 3, len * 0.8], [-kt - g * 0.55, len * 0.6], [-kt - g, len * 0.4], [-kt - g * 0.75, len * 0.22], [-kt + 1, 5]]);
  const FOOT = (ak, len) => ep(0, 0, ak, ak, 8, PI, TAU).concat([[ak + 2, 2], [len * 0.62, 5], [len * 0.9, 8], [len + 2, 13, 1], [-15, 16, 1], [-15, 6]]);
  // IK deux segments dans le repère du torse ; pick 'bas' (coude le plus bas), 'avant'
  function ik2(S, T, pick) {
    const vx = T[0] - S[0], vy = T[1] - S[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(LA - LB) + 1, LA + LB - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, E = [S[0] - LA * Math.sin(a), S[1] + LA * Math.cos(a)];
      const cAbs = Math.atan2(-(T[0] - E[0]), T[1] - E[1]) - PHI;
      const b = normA(cAbs - a), sc = (pick === 'avant' ? E[0] : E[1]) + (b <= 0.05 ? 1000 : 0);   // toujours le coude plié vers l'avant (avant-bras < 0)
      if (!best || sc > best.sc) best = { a: normA(a), b, sc };
    }
    return best;
  }
  function ikL(H, T, L1, L2) {
    const vx = T[0] - H[0], vy = T[1] - H[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), tv = Math.atan2(-vx, vy);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    let best = null;
    for (const sg of [1, -1]) {
      const a = tv + sg * a1, K = [H[0] - L1 * Math.sin(a), H[1] + L1 * Math.cos(a)];
      const bAbs = Math.atan2(-(T[0] - K[0]), T[1] - K[1]);
      if (!best || K[0] > best.sc) best = { a: normA(a), b: normA(bAbs - a), sc: K[0] };
    }
    return best;
  }

  // =====================================================================
  // TABLETTE D'ARGILE — coussin aux bords arrondis, vue de face ; dessins gravés (jamais de signe d'écriture) et encoches
  // repère : centre ; 124 × 160 à taille 1 ; o.motif, o.encoches 0..12, o.forme 'ronde'|'trait', o.trace 0..1, o.fraiche, o.taille, o.prise 'bas'|'cote'
  // =====================================================================
  const jarL = (cx, cy, k) => [[[-12, -58], [-12, -50], [-26, -38], [-31, -16], [-25, 4], [-11, 18], [0, 30], [11, 18], [25, 4], [31, -16], [26, -38], [12, -50], [12, -58]], [[-17, -60], [17, -60]], [[-28, -26], [28, -26]], [[-24, -6], [-12, -12], [0, -6], [12, -12], [24, -6]]]
    .map((pl) => pl.map((p) => [cx + p[0] * k, cy + (p[1] + 14) * k]));
  const grain = (cx, cy, s) => { const o = ellR(cx, cy, 5.2, 8.5, s * 0.45, 9); o.push(o[0]); return o; };
  const MOTIFS = {
    vierge: [],
    jarre: jarL(0, -30, 1.12),
    orge: (() => {
      const L = [[[0, 32], [0, -34]], [[0, 16], [-18, 2], [-24, -6]], [[0, 22], [17, 9], [23, 2]]];
      for (let i = 0; i < 5; i++) { const y = -28 + i * 11; L.push(grain(-7, y, -1)); L.push(grain(7, y + 5, 1)); }
      L.push([[-8, -34], [-17, -66]], [[0, -38], [0, -70]], [[8, -34], [17, -66]], [[-7, -24], [-24, -54]], [[7, -20], [24, -50]]);
      return L;
    })(),
    mouton: (() => {
      const sp = []; for (let i = 0; i <= 26; i++) { const a = -0.3 + i * 0.36, r = 18 - i * 0.55; sp.push([-16 + Math.cos(a) * r, -26 + Math.sin(a) * r]); }
      return [
        [[-26, -44], [-10, -52], [8, -50], [22, -40], [34, -24], [42, -10], [40, 0], [30, 4], [20, 2], [10, 8], [-2, 18], [-16, 22], [-28, 14], [-34, -2], [-34, -26], [-26, -44]],   // tête
        sp,                                                                                                                                                                     // corne en spirale
        [[4, -24], [8, -28], [12, -24], [8, -20], [4, -24]],                                                                                                                    // œil
        [[34, -8], [38, -6]], [[26, 0], [32, -2]],                                                                                                                              // naseau, bouche
        [[-4, 6], [8, 14], [-2, 26], [-12, 20]],                                                                                                                                // oreille tombante
        [[-12, -54], [-8, -60], [-2, -56], [4, -62], [10, -56], [16, -58]],                                                                                                    // laine du front
      ].map((pl) => pl.map((p) => [p[0] * 1.15, p[1] * 1.15 - 4]));
    })(),
    heros: (() => {
      const L = [[[24, 30], [24, -70]]];                                                                                                                                   // cèdre : tronc
      for (let i = 0; i < 5; i++) { const y = 18 - i * 17, w = 34 - i * 5; L.push([[24 - w, y], [24, y - 13], [24 + w, y]]); }                                            // étages de branches
      L.push([[-26, -36], [-24, -42], [-21, -38], [-18, -43], [-15, -38], [-12, -42], [-10, -36], [-26, -36]]);                                                          // couronne
      const hd = ell(-18, -28, 7, 7.5, 12); hd.push(hd[0]); L.push(hd);                                                                                                   // tête
      L.push([[-22, -22], [-26, -6], [-16, -10], [-14, -21]]);                                                                                                            // barbe
      L.push([[-20, -18], [-34, 20], [-6, 20], [-14, -16]]);                                                                                                              // tunique
      L.push([[-26, 20], [-28, 32]], [[-14, 20], [-12, 32]]);                                                                                                             // jambes
      L.push([[-12, -12], [0, -28], [8, -24]], [[0, -28], [4, -40], [11, -42], [8, -32], [2, -30]]);                                                                     // bras levé et hache
      return L.map((pl) => pl.map((p) => [p[0] * 1.15, p[1] * 1.15 - 2]));
    })(),
    addition: [].concat(jarL(-34, -30, 0.55), jarL(0, -30, 0.55), jarL(34, -30, 0.55)),
  };
  const MOTIF_NOMS = ['vierge', 'jarre', 'orge', 'mouton', 'heros', 'addition'];
  ECR.MOTIFS = MOTIF_NOMS;
  const LEN = {}; for (const k in MOTIFS) { let s = 0; for (const pl of MOTIFS[k]) for (let i = 1; i < pl.length; i++) s += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]); LEN[k] = s; }
  // portions de traits révélées jusqu'à u (0..1) ; renvoie { lignes, pt } (pt = pointe du roseau)
  function traceCut(nom, u) {
    const ls = MOTIFS[nom] || [], tot = LEN[nom] || 1; let rest = clamp(u) * tot; const out = []; let pt = [0, 40];
    for (const pl of ls) {
      if (rest <= 0) break;
      const cur = [pl[0]]; pt = pl[0];
      for (let i = 1; i < pl.length; i++) {
        const sl = Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
        if (rest >= sl) { cur.push(pl[i]); rest -= sl; pt = pl[i]; }
        else { const f = rest / sl; pt = [lerp(pl[i - 1][0], pl[i][0], f), lerp(pl[i - 1][1], pl[i][1], f)]; cur.push(pt); rest = 0; break; }
      }
      out.push(cur);
    }
    return { lignes: out, pt };
  }
  function tabDims(o) { const T = (o && o.taille) || 1; return { T, W: 124 * T, H: 160 * T }; }
  function tabShape(W, H, r, b) {
    const o = [];
    o.push(...ep(W / 2 - r, -H / 2 + r, r, r, 5, -PI / 2, 0)); o.push([W / 2 + b, 0]);
    o.push(...ep(W / 2 - r, H / 2 - r, r, r, 5, 0, PI / 2)); o.push([0, H / 2 + b]);
    o.push(...ep(-W / 2 + r, H / 2 - r, r, r, 5, PI / 2, PI)); o.push([-W / 2 - b, 0]);
    o.push(...ep(-W / 2 + r, -H / 2 + r, r, r, 5, PI, PI * 1.5)); o.push([0, -H / 2 - b]);
    return o;
  }
  function encoches(n, forme, T) {
    n = Math.round(clamp(n, 0, 12)); if (!n) return;
    const deep = 'rgba(78,55,34,0.85)', hi = 'rgba(255,246,222,0.6)';
    if (forme === 'trait') {
      const sp = 8.6 * T, x0 = -((Math.min(n, 12) - 1) * sp) / 2;
      for (let i = 0; i < n; i++) { const x = x0 + i * sp, y = 52 * T; fillPts([[x, y - 9 * T], [x + 2.6 * T, y - 3 * T], [x + 1.6 * T, y + 7 * T], [x - 1.6 * T, y + 7 * T], [x - 2.6 * T, y - 3 * T]], deep, 0, 0); strokePts([[x + 2 * T, y - 2 * T], [x + 1.4 * T, y + 6 * T]], hi, 1); }
    } else {
      const per = n > 6 ? Math.ceil(n / 2) : n, sp = 16 * T;
      for (let i = 0; i < n; i++) { const row = Math.floor(i / per), j = i % per, cnt = row ? n - per : per, x = (j - (cnt - 1) / 2) * sp, y = (row ? 63 : 45) * T; dot(x, y, 5.2 * T, deep); strokePts(ep(x, y, 5.2 * T, 5.2 * T, 6, 0.2, 1.9), hi, 1.2); dot(x - 1.2 * T, y - 1.4 * T, 2 * T, 'rgba(60,40,24,0.5)'); }
    }
  }
  function drawTablette(o) {
    o = o || {}; const { T, W, H } = tabDims(o), fr = !!o.fraiche;
    const base = fr ? '#ad966e' : '#c9b48f', side = fr ? '#7d6849' : '#9f8964';
    const shp = tabShape(W, H, 26 * T, 4 * T);
    pc(shp.map((p) => [p[0] + 3 * T, p[1] + 6 * T]), side, null, 9200, { drop: true });            // tranche (épaisseur du coussin)
    pc(shp, base, () => {
      shade(-W / 2, -H / 2, W / 2, H / 2, 0.22, [-W, -H, W, H]);
      strokePts(tabShape(W - 14 * T, H - 14 * T, 20 * T, 3 * T), 'rgba(110,84,52,0.22)', 1.4, true);
      strokePts(ep(-W * 0.18, -H * 0.2, W * 0.3, H * 0.3, 8, PI * 1.05, PI * 1.45), 'rgba(255,250,232,0.35)', 2.2);
      if (fr) { for (const [x, y, r] of [[-30, -50, 20], [26, 10, 26], [-10, 52, 18]]) strokePts(ep(x * T, y * T, r * T, r * 0.5 * T, 6, 3.6, 5.2), 'rgba(255,252,240,0.45)', 1.6); }
      const nom = MOTIFS[o.motif] ? o.motif : 'vierge';
      if (nom === 'vierge') { for (const y of [-40, -5, 30]) strokePts([[-36 * T, y * T], [-6 * T, (y - 4) * T], [30 * T, (y + 2) * T]], 'rgba(120,95,62,0.16)', 2); }
      const tr = o.trace == null ? null : clamp(o.trace), L = tr == null ? MOTIFS[nom] : traceCut(nom, tr).lignes;
      for (const pl of L) {
        const q = pl.map((p) => [p[0] * T, p[1] * T]);
        strokePts(q.map((p) => [p[0] + 1, p[1] + 1.4]), 'rgba(255,246,222,0.55)', 1.5);
        strokePts(q, fr ? 'rgba(62,42,24,0.92)' : 'rgba(84,60,38,0.9)', 2.9);
      }
      const n = o.encoches != null ? o.encoches : (nom === 'addition' ? 12 : 0);
      encoches(n, o.forme || (nom === 'addition' ? 'trait' : 'ronde'), T);
    }, 9201, { texA: 0.45, drop: false });
  }
  function tabGrip(o) { const { W, H } = tabDims(o); return o.prise === 'cote' ? [-W / 2 - 7, 4] : [-W * 0.15, H / 2 + 7]; }
  function tabDoigts(o) {
    const { W, H } = tabDims(o), g = tabGrip(o), F = [];
    if (o.prise === 'cote') for (const dy of [-13, -4.5, 4, 12.5]) F.push(ell(-W / 2 + 5, g[1] + dy, 9.5, 4.6, 10));
    else for (const dx of [-12, -4, 4, 12]) F.push(ell(g[0] + dx, H / 2 - 5, 4.5, 9, 10));
    return F;
  }
  function tabPts(o) {
    const { T, H } = tabDims(o), nom = MOTIFS[o.motif] ? o.motif : 'vierge';
    const st = o.trace != null ? traceCut(nom, o.trace).pt : [0, 40];
    return { centre: [0, 0], haut: [0, -H / 2], bas: [0, H / 2], stylet: [st[0] * T, st[1] * T] };
  }

  // ---------------------------------------------------------------- calame (roseau) : le long de +x, (0,0) = prise, pointe biseautée en +42
  function drawCalame() {
    pc([[-80, -4.4, 1], [-80, 4.4, 1], [24, 4.2], [44, 0.6, 1], [44, -0.8, 1], [28, -4.2]], '#cdb67c', () => {
      strokePts([[-78, -1.6], [26, -1.8]], 'rgba(255,246,214,0.55)', 1.1);
      for (const x of [-54, -16]) { strokePts([[x, -4.6], [x, 4.6]], 'rgba(110,84,40,0.75)', 1.8); }
      fillPts([[28, -4.2], [44, -0.4], [26, 1.2]], '#a2864e');
      hatch(null, 0.1, 3.4, 0.12, 1, P.encre, [-82, -6, 46, 6]);
    }, 9300, { texA: 0.4 });
  }
  // ---------------------------------------------------------------- miche ronde : (0,0) = dessous au centre ; Ø 88, 52 de haut
  function drawMiche() {
    const dome = ep(0, -4, 44, 48, 16, PI, TAU).concat([[44, -4], [41, 2, 1], [-41, 2, 1], [-44, -4]]);
    pc(dome, '#b37a3c', () => {
      shade(0, -52, 0, 2, 0.35, [-50, -56, 50, 6]);
      dot(-8, -30, 26, 'rgba(225,170,95,0.45)');
      for (const dx of [-16, 0, 16]) strokePts(qbez([dx - 10, -18], [dx, -40], [dx + 10, -44], 6), 'rgba(90,50,20,0.7)', 2.4);
      for (let i = 0; i < 14; i++) dot(-30 + hash(i * 3.1) * 60, -44 + hash(i * 7.7) * 34, 1.3, 'rgba(250,240,220,0.75)');
      fillPts(box(-46, -6, 46, 4), 'rgba(80,45,15,0.35)');
    }, 9310, { texA: 0.5 });
  }
  const micheDoigts = () => [ellR(-38, -18, 9.5, 5, 1.1), ellR(-32, -30, 9.5, 5, 0.75), ellR(-23, -39, 9.5, 5, 0.45)];
  // ---------------------------------------------------------------- lyre sumérienne à tête de taureau dorée : (0,0) = dessous de la caisse ; 175 de haut, taureau vers +x
  const LY = { bois: '#5a3a24', boisD: '#45291a', or: '#c9a14b', orL: '#e3c272', orD: '#94722f', lapis: '#2f4f86', nacre: '#e8dfc8', rouge: '#9a3a2c' };
  const yokeY = (x) => lerp(-172, -146, (x + 66) / 122);
  function drawLyre() {
    tube([-50, -58], [-56, -178], 11, LY.bois, 9400); tube([36, -58], [42, -150], 11, LY.bois, 9401);
    pc(ribbon([[-70, -174], [-2, -160], [60, -146]], 10, 9), LY.boisD, () => { for (let x = -60; x < 58; x += 20) dot(x, yokeY(x) + 1, 2.2, LY.orL); }, 9402, { drop: false });
    if (!SIL()) for (let i = 0; i < 8; i++) { const x = -42 + i * 10.5; strokePts([[x, -64], [x + 2, yokeY(x + 2) + 4]], 'rgba(236,226,200,0.85)', 1); }
    pc(box(-58, -66, 58, 0), LY.bois, () => {
      for (let i = 0; i < 14; i++) { const x = -56 + i * 8; fillPts(box(x, -44, x + 8, -36), [LY.nacre, LY.lapis, LY.rouge][i % 3], 0, 0); fillPts(box(x, -26, x + 8, -18), [LY.lapis, LY.nacre, LY.lapis][i % 3], 0, 0); }
      strokePts([[-58, -46], [58, -46]], LY.orD, 1.5); strokePts([[-58, -16], [58, -16]], LY.orD, 1.5);
      hatch(null, 0.0, 4, 0.18, 1, P.encre, [-60, -70, 60, 2]);
    }, 9403);
    pc([[62, -50], [86, -58], [88, -44], [84, -30], [66, -26], [58, -38]], LY.lapis, () => { for (const y of [-50, -42, -34]) strokePts([[62, y], [86, y - 2]], 'rgba(160,190,230,0.6)', 1.2); }, 9404);   // barbe de lapis
    pc([[50, -76], [60, -98], [74, -108], [88, -104], [98, -88], [104, -72], [99, -62], [86, -58], [72, -54], [60, -46], [50, -48]], LY.or, () => {
      shade(100, -90, 50, -60, 0.3, [44, -112, 108, -40]);
      dot(80, -88, 3.6, '#2a1a10'); dot(81, -89, 1.2, LY.orL); dot(98, -68, 2, 'rgba(70,45,10,0.7)');
      strokePts([[56, -80], [70, -76], [84, -70]], 'rgba(120,85,25,0.6)', 1.3);
    }, 9405);
    pc([[64, -100], [58, -120], [62, -136], [70, -140], [70, -128], [68, -118], [76, -104]], LY.orL, null, 9406);   // corne
    pc([[60, -96], [46, -104], [52, -92]], LY.orD, null, 9407);                                                       // oreille
  }
  const lyreDoigts = () => [ell(-53, -104, 9.5, 4.4, 10), ell(-53, -96, 9.5, 4.4, 10), ell(-53, -88, 9.5, 4.4, 10)];

  const OBJ = {
    //  draw(o) dessine à l'échelle 1 (origine du dessin) ; grip = point de prise ; plat = derrière l'avant-bras ; devant = devant le corps (main arrière) ; doigts(o) = doigts par-dessus (repère de l'objet)
    tablette: { draw: drawTablette, grip: tabGrip, plat: true, doigts: tabDoigts, pts: tabPts, base: (o) => [0, tabDims(o).H / 2 + 6] },
    calame: { draw: drawCalame, grip: [0, 0], pts: { pointe: [44, 0], bout: [-80, 0] }, base: [0, 5] },
    miche: { draw: drawMiche, grip: [-34, -12], plat: true, doigts: micheDoigts, pts: { centre: [0, -24], haut: [0, -52] }, base: [0, 2] },
    lyre: { draw: drawLyre, grip: [-53, -96], devant: true, doigts: lyreDoigts, pts: { cordes: [-6, -112], tete: [84, -86], base: [0, 0] }, base: [0, 0] },
  };
  ECR.OBJ = OBJ;
  function heldOpts(name, o, p) { const ob = OBJ[name]; return Object.assign({ t: p.t || 0 }, ob && ob.held || {}, o || {}); }
  function heldXf(name, oo) { const ob = OBJ[name], g = vOf(ob.grip, oo), k = oo.echelle || 1, c = cx_(); c.scale(k, k); c.translate(-g[0], -g[1]); }
  function drawHeld(name, o, p) { if (!OBJ[name]) return; const oo = heldOpts(name, o, p), c = cx_(); c.save(); heldXf(name, oo); OBJ[name].draw(oo); c.restore(); }
  const DOIGTS = [[-13, -9], [9, -11], [12, -4], [12, 6], [6, 11], [-6, 11], [-13, 4]];
  const doigtPaint = () => { hatch(null, 0.9, 3.4, 0.15); };
  function drawDoigts(name, o, p, skin) {
    const ob = OBJ[name]; if (!ob) return; const oo = heldOpts(name, o, p), c = cx_(); c.save();
    if (ob.doigts) { heldXf(name, oo); ob.doigts(oo).forEach((f, i) => pc(f, skin, () => strokePts([[f[0][0], f[0][1]], [f[5] ? f[5][0] : f[0][0], f[5] ? f[5][1] : f[0][1]]], 'rgba(70,40,25,0.25)', 0.8), 9500 + i, { drop: false })); }
    else pc(DOIGTS, skin, () => { for (const y of [-3, 2, 7]) strokePts([[-10, y], [10, y - 1]], 'rgba(70,40,30,0.5)', 1); doigtPaint(); }, 9510);
    c.restore();
  }
  const slotF = (p) => { const ob = OBJ[p.tenu]; if (!has(p.tenu) || !ob) return null; return ob.plat ? 'plat' : 'main'; };
  const slotB = (p) => { const ob = OBJ[p.tenuB]; if (!has(p.tenuB) || !ob) return null; if (ob.devant || (ob.plat && p.planB === 'devant')) return 'dev'; return ob.plat ? 'plat' : 'main'; };
  function heldParts(skin, seed) {
    const P_ = (parent, cond, fn) => ({ parent, at: [4, 96], noRivet: true, base: '#000', seed, pts: OFFP, extra: (p) => { if (cond(p)) fn(p); } });
    const objF = (p) => drawHeld(p.tenu, p.tenuO, p), objB = (p) => drawHeld(p.tenuB, p.tenuBO, p);
    return {
      objetPlat: P_('armF_lo', (p) => slotF(p) === 'plat', objF),
      objet: P_('armF_lo', (p) => slotF(p) === 'main', objF),
      doigts: P_('armF_lo', (p) => !!slotF(p), (p) => drawDoigts(p.tenu, p.tenuO, p, skin)),
      objetBPlat: P_('armB_lo', (p) => slotB(p) === 'plat', objB),
      objetB: P_('armB_lo', (p) => slotB(p) === 'main', objB),
      doigtsB: P_('armB_lo', (p) => slotB(p) === 'plat' || slotB(p) === 'main', (p) => drawDoigts(p.tenuB, p.tenuBO, p, skin)),
      objetBDev: P_('armB_lo', (p) => slotB(p) === 'dev', objB),
      doigtsBDev: P_('armB_lo', (p) => slotB(p) === 'dev', (p) => drawDoigts(p.tenuB, p.tenuBO, p, skin)),
      paille: { parent: 'torso', at: [0, 0], noRivet: true, base: '#000', seed, pts: OFFP, extra: (p) => { if (p._paille) paille(p._paille[0], p._paille[1]); } },
    };
  }
  function paille(a, b) {                                                     // paille de roseau (repère courant)
    tube(a, b, 6, '#c9b27a', 9600);
    if (SIL()) return; const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let d = 40; d < L - 10; d += 52) { const f = d / L, x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), nx = -(b[1] - a[1]) / L * 3.4, ny = (b[0] - a[0]) / L * 3.4; strokePts([[x - nx, y - ny], [x + nx, y + ny]], 'rgba(110,84,40,0.8)', 1.5); }
  }
  ECR.paille = (a, b) => { const c = cx_(); c.save(); paille(a, b); c.restore(); };
  // point nommé de l'objet tenu, en coordonnées écran
  ECR.pt = function (r, nom, arriere) {
    const name = arriere ? r.tenuB : r.tenu, ob = OBJ[name]; if (!ob) return null;
    const oo = arriere ? r.tenuBO : r.tenuO, q = vOf(ob.pts, oo)[nom]; if (!q) return null;
    const g = vOf(ob.grip, oo), k = oo.echelle || 1;
    return r.w(arriere ? 'objetB' : 'objet', (q[0] - g[0]) * k, (q[1] - g[1]) * k);
  };

  // =====================================================================
  // POSES — préparation commune
  // =====================================================================
  const TAB_H = 86, SAC_H = 118;
  function prep(p) {
    p = p || {}; const q = Object.assign({}, p, { ang: Object.assign({}, p.ang), hide: Object.assign({}, p.hide), face: Object.assign({}, p.face) });
    const A = q.ang;
    if (A.legF != null) { A.legF_up = (A.legF_up || 0) + A.legF; delete A.legF; }
    if (A.legB != null) { A.legB_up = (A.legB_up || 0) + A.legB; delete A.legB; }
    if (A.armF_lo == null) A.armF_lo = -0.1;
    if (A.armB_lo == null) A.armB_lo = -0.14;
    if (A.armB_up == null) A.armB_up = 0.04;
    return q;
  }
  const blend = (q, n, v, k) => { q.ang[n] = lerp(q.ang[n] || 0, v, k); };
  function armTo(q, arm, T, pick, k) {
    if (k <= 0) return;
    const sol = ik2(arm === 'armF' ? SH_F : SH_B, T, pick || 'bas'), A = q.ang;
    const a0 = A[arm + '_up'] || 0, b0 = A[arm + '_lo'] || 0;
    A[arm + '_up'] = a0 + normA(sol.a - a0) * k; A[arm + '_lo'] = b0 + normA(sol.b - b0) * k;
    if (arm === 'armF') q._bF = true; else q._bB = true;
  }
  function headPt(q, hx, hy) { return mp(new DOMMatrix().translate(HEAD_AT[0], HEAD_AT[1]).rotate((q.ang.head || 0) * D), [hx, hy]); }
  function toTorso(env, q, P0) { const { mats } = M.partMatrices(env.def, q, env.x, env.y, env.s, env.dir); const p = new DOMPoint(P0[0], P0[1]).matrixTransform(mats.torso.inverse()); return [p.x, p.y]; }
  function plier(q, th) {
    if (!th) return;
    q.tilt = (q.tilt || 0) + th; q.dx = (q.dx || 0) - HIP * Math.sin(th); q.dy = (q.dy || 0) + HIP * (1 - Math.cos(th));
    q.ang.legF_up = (q.ang.legF_up || 0) - th; q.ang.legB_up = (q.ang.legB_up || 0) - th;
  }
  function marche(q, k, t, amp) {
    if (k <= 0) return; const ph = t * TAU * 1.5, s = Math.sin(ph), A = q.ang; amp = amp || 0.32;
    A.legF_up = (A.legF_up || 0) + amp * s * k; A.legB_up = (A.legB_up || 0) - amp * s * k;
    A.legF_lo = (A.legF_lo || 0) + 0.42 * Math.max(0, Math.sin(ph - 1.3)) * k; A.legB_lo = (A.legB_lo || 0) + 0.42 * Math.max(0, Math.sin(ph + PI - 1.3)) * k;
    A.piedF = (A.piedF || 0) - 0.5 * (A.legF_up + A.legF_lo) * k; A.piedB = (A.piedB || 0) - 0.5 * (A.legB_up + A.legB_lo) * k;
    q.dy = (q.dy || 0) - Math.abs(Math.cos(ph)) * 5 * k;
    A.armF_up = (A.armF_up || 0) - 0.2 * s * k; A.armB_up = (A.armB_up || 0) + 0.2 * s * k;
  }
  // assis : bassin posé sur le siège (q.siege = y écran du dessus du siège ; défaut : tabouret (scribe) ou sac (poète) au même y et s)
  function assis(q, env, k) {
    if (k <= 0) return; const A = q.ang;
    const siege = q.siege != null ? q.siege : env.y - env.seatH * env.s;
    q.dy = (q.dy || 0) + (HIP - (env.y - siege) / env.s - 16) * k;
    q.tilt = (q.tilt || 0) - 0.02 * k;
    const yg = HIP - (q.dy || 0);
    for (const [L, hx, fx] of [['F', 6, 118], ['B', -6, 96]]) {
      const s = ikL([hx, -2], [fx, yg - 16], TH, SHN);
      A['leg' + L + '_up'] = lerp(A['leg' + L + '_up'] || 0, s.a, k); A['leg' + L + '_lo'] = lerp(A['leg' + L + '_lo'] || 0, s.b, k);
    }
    q._piedsPlats = true;
  }
  const knee = (hx, a) => [hx - TH * Math.sin(a), -2 + TH * Math.cos(a)];
  function defTenu(q, name, opts, arriere) {
    const k = arriere ? 'tenuB' : 'tenu', ko = arriere ? 'tenuBO' : 'tenuO';
    if (q[k] == null) q[k] = name;
    if (q[k] === name && opts) q[ko] = Object.assign({}, opts, q[ko]);
  }
  // centre de l'objet tenu quand le poing est en F (repère du torse, objet droit)
  const grand = (o, c) => { const T = ((o && o.taille) || 1) * ((o && o.echelle) || 1) - 1; return [c[0] + 62 * T, c[1] + 40 * T]; };   // grande tablette : plus en avant et plus bas (dégage le visage)
  function fistFor(name, o, centre) { const ob = OBJ[name], g = vOf(ob.grip, o), k = o.echelle || 1; return [centre[0] + g[0] * k, centre[1] + g[1] * k]; }

  // tous les gestes (who : 'scribe' | 'poete' | 'ouvrier')
  function gestes(p, env, who) {
    if (p && p.ecrire && p.assis == null) p = Object.assign({}, p, { assis: 1 });
    const q = prep(p), A = q.ang, t = q.t || 0, F = q.face, g = (n) => k01(q[n]);
    marche(q, k01(q.marche), t);
    const as = k01(q.assis); assis(q, env, as);
    const rv = g('reverence'), pe = g('penche'), bo = Math.max(g('boire'), g('sirote'));
    if (rv > 0 && as < 0.5) plier(q, (who === 'poete' ? 0.5 : 0.4) * rv);
    if (pe > 0 && as < 0.5) plier(q, 0.34 * pe);
    if (bo > 0) { if (as < 0.5) plier(q, 0.14 * bo); else q.tilt = (q.tilt || 0) + 0.07 * bo; }

    const pr = g('presente');
    if (pr > 0) {
      defTenu(q, 'tablette', { prise: 'bas' });
      const o = heldOpts(q.tenu, q.tenuO, q); armTo(q, 'armF', OBJ[q.tenu] ? fistFor(q.tenu, o, grand(o, [142, -122])) : [118, -40], 'bas', pr);
      blend(q, 'armB_up', 0.1, pr); blend(q, 'armB_lo', -0.3, pr); A.head = (A.head || 0) - 0.04 * pr; if (!F.mouth) F.mouth = 'smile';
    }
    const br = g('brandir');
    if (br > 0) {
      defTenu(q, 'tablette', { prise: 'bas' });
      const o = heldOpts(q.tenu, q.tenuO, q); armTo(q, 'armF', OBJ[q.tenu] ? fistFor(q.tenu, o, [150, -338]) : [128, -250], 'bas', br);
      blend(q, 'armB_up', -0.25, br); blend(q, 'armB_lo', -0.5, br); A.head = (A.head || 0) - 0.14 * br; if (!F.mouth) F.mouth = 'smile'; if (!F.brow) F.brow = 'up';
    }
    const te = g('tendre');
    if (te > 0) {
      if (who === 'ouvrier' && q.tenu == null) {                                // main ouverte pour recevoir (les deux mains)
        armTo(q, 'armF', q.cible ? toTorso(env, q, q.cible) : [158, -82], 'bas', te); armTo(q, 'armB', [142, -98], 'bas', te);
        if (!q.handF) q.handF = 'open'; if (!q.handB) q.handB = 'open'; if (!F.brow) F.brow = 'up'; if (!F.mouth) F.mouth = 'smile';
      } else {
        defTenu(q, 'tablette', { prise: 'cote' });
        armTo(q, 'armF', q.cible ? toTorso(env, q, q.cible) : [150, -108], 'bas', te);
        blend(q, 'armB_up', 0.15, te); A.head = (A.head || 0) - 0.03 * te;
      }
    }
    const tm = g('teteMain');
    if (tm > 0) {
      const T = headPt(q, -20 + 3 * Math.sin(t * 8), -96); armTo(q, 'armF', T, 'avant', tm);
      if (!q.handF) q.handF = 'open'; A.head = (A.head || 0) + 0.07 * tm; if (!F.brow) F.brow = 'worry'; if (!F.mouth) F.mouth = 'tight';
    }
    if (rv > 0) {
      if (who === 'poete') { armTo(q, 'armF', [112, 8], 'bas', rv); armTo(q, 'armB', [96, 22], 'bas', rv); if (!q.handF) q.handF = 'open'; if (!q.handB) q.handB = 'open'; A.head = (A.head || 0) + 0.36 * rv; }
      else { armTo(q, 'armF', [32, -116], 'bas', rv); if (!q.handF) q.handF = 'open'; blend(q, 'armB_up', 0.9, rv); blend(q, 'armB_lo', -0.12, rv); if (!q.handB) q.handB = 'open'; A.head = (A.head || 0) + 0.28 * rv; A.legF_up = (A.legF_up || 0) - 0.1 * rv; q._bB = true; }
      if (!F.mouth) F.mouth = 'smile';
    }
    const pa = g('pain');
    if (pa > 0) { defTenu(q, 'miche'); armTo(q, 'armF', [42, -94], 'bas', pa); if (!F.mouth) F.mouth = 'smile'; }
    const ec = g('ecrire');
    if (ec > 0) {
      defTenu(q, 'calame'); defTenu(q, 'tablette', { prise: 'cote' }, true); if (q.planB == null) q.planB = 'devant';
      const oB = heldOpts(q.tenuB, q.tenuBO, q), dB = tabDims(oB), kB = oB.echelle || 1;
      const C0 = as > 0.5 ? [142, -28 - dB.H / 2 * kB] : [136, -96];
      armTo(q, 'armB', fistFor(q.tenuB, oB, C0), 'bas', ec);
      let Pt;
      if (q.cible) Pt = toTorso(env, q, q.cible);
      else { const sp = tabPts(oB).stylet; Pt = [C0[0] + sp[0] * kB, C0[1] + sp[1] * kB]; if (oB.trace == null || oB.trace >= 1) { Pt[0] += 6 * Math.sin(t * 11); Pt[1] += 3 * Math.sin(t * 7 + 1); } }
      const aC = 0.78, oF = heldOpts('calame', q.tenuO, q), tip = rot([44 * (oF.echelle || 1), 0], aC);
      armTo(q, 'armF', [Pt[0] - tip[0], Pt[1] - tip[1]], 'bas', ec);
      q.droit = true; A.objet = (A.objet || 0) + aC * ec; A.head = (A.head || 0) + 0.2 * ec;
    }
    const ly = g('lyre');
    if (ly > 0) {
      defTenu(q, 'lyre', null, true);
      const fB = [44, -40]; armTo(q, 'armB', fB, 'bas', ly);
      const o = heldOpts('lyre', q.tenuBO, q), kl = o.echelle || 1, gl = OBJ.lyre.grip, cp = OBJ.lyre.pts.cordes;
      const T = [fB[0] + (cp[0] - gl[0]) * kl + 9 * Math.sin(t * 9), fB[1] + (cp[1] - gl[1]) * kl + 5 * Math.sin(t * 5)];
      armTo(q, 'armF', T, 'bas', ly); if (!q.handF) q.handF = 'open'; A.head = (A.head || 0) + 0.08 * ly; if (!F.eyes) F.eyes = 'half'; if (!F.mouth) F.mouth = 'smile';
    }
    const co = g('coeur');
    if (co > 0) {
      armTo(q, 'armF', [26, -120], 'bas', co); if (!q.handF) q.handF = 'open';
      if (!has(q.tenuB)) { armTo(q, 'armB', [116, -236], 'bas', co); if (!q.handB) q.handB = 'open'; }
      A.head = (A.head || 0) - 0.28 * co; if (!F.eyes) F.eyes = 'half'; if (!F.mouth) F.mouth = 'smile'; if (!F.brow) F.brow = 'up';
    }
    const pi = g('prie'), jo = g('joie');
    if (pi > 0) {
      blend(q, 'armF_up', -2.45, pi); blend(q, 'armF_lo', -0.08, pi); blend(q, 'armB_up', -3.35, pi); blend(q, 'armB_lo', -0.08, pi); q.tilt = (q.tilt || 0) - 0.05 * pi;
      if (!q.handF) q.handF = 'open'; if (!q.handB) q.handB = 'open'; A.head = (A.head || 0) - 0.38 * pi; if (!F.eyes) F.eyes = 'closed'; q._bF = q._bB = true;
    }
    if (jo > 0) {
      const w = Math.sin(t * 8);
      blend(q, 'armF_up', -2.1 + 0.12 * w, jo); blend(q, 'armF_lo', -0.45, jo); blend(q, 'armB_up', -3.75 - 0.1 * w, jo); blend(q, 'armB_lo', -0.12, jo);
      if (!q.handF) q.handF = 'open'; if (!q.handB) q.handB = 'open'; A.head = (A.head || 0) - 0.3 * jo; q.dy = (q.dy || 0) - Math.abs(Math.sin(t * 7)) * 12 * jo;
      if (!F.mouth) F.mouth = 'smile'; if (!F.brow) F.brow = 'up'; q._bF = q._bB = true;
    }
    const de = g('depit');
    if (de > 0) {
      if (who === 'poete') defTenu(q, 'lyre');
      blend(q, 'armF_up', 0.12, de); blend(q, 'armF_lo', -0.12, de); blend(q, 'armB_up', 0.1, de); blend(q, 'armB_lo', -0.1, de);
      if (q.tenu === 'lyre') A.objet = (A.objet || 0) + 0.4 * de;
      A.head = (A.head || 0) + 0.4 * de; q.tilt = (q.tilt || 0) + 0.05 * de; q.dy = (q.dy || 0) + 4 * de;
      if (!F.brow) F.brow = 'worry'; if (!F.eyes) F.eyes = 'half'; if (!F.mouth) F.mouth = 'tight'; q._bF = q._bB = true;
    }
    const ti = g('tient');
    if (ti > 0) {
      defTenu(q, 'tablette', { prise: 'bas' }); defTenu(q, 'tablette', { prise: 'bas' }, true);
      const oF = heldOpts(q.tenu, q.tenuO, q), oB = heldOpts(q.tenuB, q.tenuBO, q);
      armTo(q, 'armF', OBJ[q.tenu] ? fistFor(q.tenu, oF, grand(oF, [142, -118])) : [118, -30], 'bas', ti);
      armTo(q, 'armB', OBJ[q.tenuB] ? fistFor(q.tenuB, oB, [150, -348]) : [132, -262], 'bas', ti);
      A.head = (A.head || 0) - 0.1 * ti; if (!F.mouth) F.mouth = 'smile';
    }
    if (bo > 0) {
      A.head = (A.head || 0) + 0.12 * bo;
      const M0 = headPt(q, 35, -25), Cb = q.cible ? toTorso(env, q, q.cible) : [210, 20];
      const dv = [Cb[0] - M0[0], Cb[1] - M0[1]], L = Math.hypot(dv[0], dv[1]) || 1, u = [dv[0] / L, dv[1] / L];
      armTo(q, 'armF', [M0[0] + u[0] * 48, M0[1] + u[1] * 48], 'bas', bo);
      if (bo > 0.3) { const f = clamp((bo - 0.3) / 0.7), top = [M0[0] + u[0] * (1 - f) * 70, M0[1] + u[1] * (1 - f) * 70]; q._paille = [top, Cb]; }
      if (!F.eyes) F.eyes = 'half';
    }
    const es = g('essuie');
    if (es > 0) {
      const T = headPt(q, 40, -22 + 5 * Math.sin(t * 10)); armTo(q, 'armF', T, 'bas', es);
      if (!F.eyes) F.eyes = 'half'; if (!F.mouth) F.mouth = 'smile';
    }
    if (pe > 0) {
      A.head = (A.head || 0) - 0.22 * pe;
      const KF = knee(6, A.legF_up || 0), KB = knee(-6, A.legB_up || 0);
      armTo(q, 'armF', [KF[0] + 8, KF[1] - 16], 'bas', pe); armTo(q, 'armB', [KB[0] + 6, KB[1] - 14], 'bas', pe);
      if (!F.eyes) F.eyes = 'wide'; if (!F.brow) F.brow = 'up';
    }
    const ge = g('gene');
    if (ge > 0) {
      armTo(q, 'armF', [44, -38], 'bas', ge); armTo(q, 'armB', [52, -44], 'bas', ge);
      A.head = (A.head || 0) + 0.16 * ge; q.tilt = (q.tilt || 0) - 0.03 * ge + 0.015 * Math.sin(t * 3) * ge; q.dy = (q.dy || 0) + 3 * ge;
      if (!F.mouth) F.mouth = 'smile'; if (!F.brow) F.brow = 'worry'; if (!F.eyes) F.eyes = 'half';
    }
    if (as > 0) {                                                               // assis sans geste : mains posées sur les genoux
      const KF = knee(6, A.legF_up || 0), KB = knee(-6, A.legB_up || 0);
      if (!q._bF) armTo(q, 'armF', [KF[0] - 12, KF[1] - 20], 'bas', as);
      if (!q._bB && !has(q.tenuB)) armTo(q, 'armB', [KB[0] - 18, KB[1] - 18], 'bas', as);
    }
    return finish(q);
  }
  function finish(q) {
    const A = q.ang, tl = q.tilt || 0;
    if (has(q.tenu) && !q.handF) q.handF = 'fist';
    if (has(q.tenuB) && !q.handB) q.handB = 'fist';
    if (q.droit == null && has(q.tenu)) q.droit = true;
    if (q.droitB == null && has(q.tenuB)) q.droitB = true;
    if (q.droit) A.objet = (A.objet || 0) - ((A.armF_up || 0) + (A.armF_lo || 0) + tl);
    if (q.droitB) A.objetB = (A.objetB || 0) - ((A.armB_up || 0) + (A.armB_lo || 0) + tl);
    A.objetPlat = A.doigts = A.objet || 0;
    A.objetBPlat = A.objetBDev = A.doigtsB = A.doigtsBDev = A.objetB || 0;
    if (q._piedsPlats) { A.piedF = -((A.legF_up || 0) + (A.legF_lo || 0) + tl) + (A.piedF || 0); A.piedB = -((A.legB_up || 0) + (A.legB_lo || 0) + tl) + (A.piedB || 0); }
    A.barbe = (A.barbe || 0) - ((A.head || 0) + tl) + 0.02 * Math.sin((q.t || 0) * 1.3);
    return q;
  }
  function run(def, q, x, y, s, o) {
    const r = M.puppet(def, q, x, y, s, Object.assign({ nom: def.nom }, o || {}));
    r.tenu = q.tenu; r.tenuB = q.tenuB; r.pose = q;
    if (q.tenu && OBJ[q.tenu]) r.tenuO = heldOpts(q.tenu, q.tenuO, q);
    if (q.tenuB && OBJ[q.tenuB]) r.tenuBO = heldOpts(q.tenuB, q.tenuBO, q);
    r.bouche = r.w('head', 35, -25); r.tete = r.w('head', -2, -100);
    return r;
  }

  // ---------------- pièces de corps communes
  function upDef(at, base, seed, paint, wt) { return { parent: 'torso', at, pts: armR(LA, wt), base, seed, paint: paint || (() => hatch([[-16, -20], [-3, -20], [-3, 104], [-16, 104]], 0.9, 3.8, 0.26)) }; }
  function foreDef(parent, skin, back, seed, o) {
    o = o || {}; const hk = (p) => (back ? p.handB : p.handF) || 'fist';
    return { parent, at: [0, LA], pts: (p) => foreR(hk(p)), base: o.base || skin, seed, paint: (p) => {
      if (o.paint) o.paint(back);
      fillPts([[-20, 76, 1], [20, 76, 1], [24, 130, 1], [-20, 130, 1]], skin); X.handPaint(null, hk(p));
      if (o.cuff) fillPts([[-12, 64, 1], [12, 64, 1], [13, 74, 1], [-12, 74, 1]], o.cuff);
      hatch([[-14, -10], [-3, -10], [-3, 60], [-14, 60]], 0.9, 3.8, back ? 0.3 : 0.2);
    } };
  }
  function legParts(L, seed) {
    const thigh = (back) => ({ parent: 'torso', at: [back ? -6 : 6, -2], pts: legC(TH, L.wt, L.kt), base: back ? L.colD : L.col, seed: seed + (back ? 1 : 2), noRivet: !!back,
      paint: () => hatch(back ? null : [[-L.wt, -10], [-4, -10], [-4, TH], [-L.wt, TH]], 0.8, 3.8, back ? 0.3 : 0.2) });
    const shin = (back) => ({ parent: back ? 'legB_up' : 'legF_up', at: [0, TH], pts: shinCalf(SHN, L.kt, L.ak, 5), base: back ? L.colD : L.col, seed: seed + (back ? 3 : 4), noRivet: !!back,
      paint: () => hatch(back ? null : [[-L.kt - 4, -6], [-3, -6], [-3, SHN], [-L.kt - 4, SHN]], 0.8, 3.8, back ? 0.3 : 0.2) });
    const foot = (back) => ({ parent: back ? 'legB_lo' : 'legF_lo', at: [0, SHN], pts: FOOT(L.ak + 1, L.fl), base: back ? L.colD : L.col, seed: seed + (back ? 5 : 6), noRivet: true,
      paint: () => { for (const f of [0.66, 0.78, 0.9]) strokePts([[L.fl * f, 8], [L.fl * f + 1, 14]], 'rgba(80,45,25,0.45)', 1); fillPts(box(-16, 13, L.fl + 4, 17), 'rgba(60,30,15,0.3)'); } });
    return { legB_up: thigh(true), legB_lo: shin(true), piedB: foot(true), legF_up: thigh(false), legF_lo: shin(false), piedF: foot(false) };
  }
  const LEGS = ['legB_up', 'legB_lo', 'piedB', 'legF_up', 'legF_lo', 'piedF'];
  // jupe / robe / bas de tunique qui suit les cuisses (debout, marche, assis) ; J = { top, hem, w, flare }
  function jupePts(q, J) {
    const tl = q.tilt || 0, pts = jupePts0(q, J, tl);
    return tl ? pts.map((p) => (p[1] > -6 ? (p.length > 2 ? rot(p, -tl).concat([1]) : rot(p, -tl)) : p)) : pts;
  }
  function jupePts0(q, J, tl) {
    const A = q.ang, KF = knee(6, (A.legF_up || 0) + tl), KB = knee(-6, (A.legB_up || 0) + tl), W = J.w, fl = J.flare;
    if (J.hem < TH) {
      const kx = Math.max(KF[0], KB[0]), bx = Math.min(KF[0], KB[0]);
      return [[-W + 2, J.top, 1], [W - 2, J.top, 1], [W + 1, -4], [Math.max(W + fl, kx * 0.75 + 16), J.hem, 1], [Math.min(-W - fl, bx * 0.75 - 16), J.hem + 2, 1], [-W - 1, -4]];
    }
    const front = KF[0] >= KB[0], K = front ? KF : KB, aK = (front ? (A.legF_up || 0) : (A.legB_up || 0)) + tl;
    const ks = clamp(-aK / 1.35), kb = Math.min(KF[0], KB[0]), hemL = J.hem - TH;
    const kTop = [lerp(W + 4, K[0] + 2, ks), lerp(TH - 8, K[1] - 17, ks)];
    const kFr = [Math.max(lerp(W + fl * 0.6, K[0] + 18, ks), K[0] + 16), lerp(TH + 6, K[1] + 4, ks)];
    const hy = lerp(J.hem, K[1] + hemL, ks);
    const hb = lerp(Math.min(-W - fl, kb - 18), K[0] - 70, ks);
    const back = [lerp(Math.min(-W - fl * 0.5, kb * 0.6 - 16), -W - 4, ks), lerp(TH, 30, ks)];
    return [[-W + 2, J.top, 1], [W - 2, J.top, 1], [W + 1, -4], kTop, kFr, [kFr[0] + 3, hy, 1], [hb, hy + 2, 1], back, [-W - 1, -4]];
  }
  function jupeDef(J, base, seed, paint) { return { parent: 'torso', at: [0, 0], noRivet: true, base, seed, pts: (p) => jupePts(p, J), paint: (p) => paint(p, jupePts(p, J)) }; }

  // ---------------- visage : grands yeux en amande (style des statues d'orants), sourcils épais
  function oeil(f, x, y, k, col) {
    k = k || 1; const e = (f && f.eyes) || 'open', ink = col || '#18100c';
    if (e === 'closed') { strokePts(ep(x + 1 * k, y - 1, 9 * k, 3.6 * k, 8, 0.2, PI - 0.2), ink, 2.2); return; }
    const h = e === 'half' ? 0.5 : e === 'wide' ? 1.3 : 1;
    const al = [[x - 9 * k, y + 0.5], [x - 3 * k, y - 5.6 * k * h], [x + 5 * k, y - 5.2 * k * h], [x + 11 * k, y - 0.4], [x + 5 * k, y + 3.8 * k * Math.min(h, 1.15)], [x - 3 * k, y + 3.8 * k * Math.min(h, 1.15)]];
    fillPts(al, '#f0e8d6', 0, 0);
    dot(x + 2 * k, y - 0.2, 4.3 * k * Math.min(1, h + 0.25), '#2a1a12'); dot(x + 3.2 * k, y - 1.6 * k, 1.1 * k, 'rgba(255,255,255,0.85)');
    if (h < 1) fillPts([[x - 10 * k, y - 8 * k], [x + 12 * k, y - 8 * k], [x + 12 * k, y - 0.6 * k], [x - 10 * k, y - 0.6 * k]], 'rgba(150,95,60,0.95)', 0, 0);
    strokePts(al, ink, 1.9, true); strokePts([[x - 9 * k, y + 0.5], [x - 15 * k, y - 1.5 * k]], ink, 1.6);
  }
  function sourcil(f, x, y, col, lw) {
    const b = (f && f.brow) || 'n', o = { n: [0, 0, 0], up: [-3, -4, -3], frown: [0, 2, 4], worry: [2, -1, -4] }[b] || [0, 0, 0];
    strokePts([[x - 10, y + 1 + o[0]], [x + 1, y - 2 + o[1]], [x + 12, y + o[2]]], col, lw || 4.2);
  }

  // =====================================================================
  // LE SCRIBE — crâne rasé, glabre, grands yeux en amande, sourcils noirs épais ; torse nu ; jupe kaunakès ivoire à mèches, ceinture rouge sang ; pieds nus ; calame derrière l'oreille
  // =====================================================================
  const SC = { peau: '#c08a5e', peauD: '#a5734b', laine: '#e3d8bf', laineD: '#b9ab8c', ceinture: '#8a2f24', ceintureL: '#b0483a', cuivre: '#b8753c' };
  const SC_TORSO = [[-14, -190], [8, -192], [18, -180], [28, -162], [37, -130], [39, -100], [34, -74], [35, -44], [37, -14], [38, 8, 1], [-38, 8, 1], [-38, -20], [-37, -70], [-38, -120], [-33, -162], [-26, -180]];
  const J_SC = { top: -28, hem: 172, w: 40, flare: 8 };
  function kaunakes(y0, y1, col, colD) {
    const rows = []; for (let y = y0, j = 0; y < y1; y += 15, j++) rows.push([y, j]);
    for (let r = rows.length - 1; r >= 0; r--) {
      const [y, j] = rows[r];
      for (let x = -90 + (j % 2) * 7; x < 220; x += 14) {
        const tg = [[x - 7, y - 3], [x + 7, y - 3], [x + 6.5, y + 8], [x + 3, y + 15], [x, y + 17], [x - 3, y + 15], [x - 6.5, y + 8]];
        fillPts(tg, col, 0, 0); strokePts(tg.slice(1).concat([tg[0]]).slice(1, 6), colD, 1.3); strokePts([[x - 1, y + 2], [x, y + 12]], 'rgba(150,130,95,0.4)', 0.9);
      }
    }
  }
  function mkScribe() {
    const L = { wt: 16, kt: 12.5, ak: 9.5, fl: 46, col: SC.peau, colD: SC.peauD };
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: SC_TORSO, base: SC.peau, seed: 8301, paint: () => {
        shade(36, -60, -40, -60, 0.28, [-50, -200, 50, 20]);
        strokePts([[14, -108], [26, -100], [38, -104]], 'rgba(90,50,30,0.45)', 1.5);
        strokePts([[22, -60], [30, -54]], 'rgba(90,50,30,0.3)', 1.2);
        strokePts([[-30, -150], [-22, -120], [-26, -96]], 'rgba(90,50,30,0.3)', 1.2);
        hatch([[-50, -180], [-14, -180], [-12, 10], [-50, 10]], 0.75, 4.2, 0.24);
      } },
      jupe: jupeDef(J_SC, SC.laine, 8302, (p, pts) => {
        kaunakes(J_SC.top + 12, 300, SC.laine, SC.laineD);
        shade(50, 0, -50, 0, 0.22, [-100, -40, 220, 300]);
        fillPts(box(-90, J_SC.top - 1, 160, J_SC.top + 13), SC.ceinture);
        strokePts([[-60, J_SC.top + 3], [160, J_SC.top + 3]], SC.ceintureL, 1.4);
        fillPts([[30, J_SC.top + 10], [40, J_SC.top + 10], [44, J_SC.top + 40, 1], [36, J_SC.top + 38], [30, J_SC.top + 42, 1]], SC.ceinture);
      }),
      armB_up: upDef(SH_B, SC.peauD, 8304, () => hatch(null, 0.9, 3.8, 0.3)),
      armB_lo: foreDef('armB_up', SC.peauD, true, 8305, { cuff: '#94602f' }),
      head: { parent: 'torso', at: HEAD_AT, pts: X.NAP_HEAD, base: SC.peau, seed: 8306, noRivet: true, paint: (p) => {
        const f = p.face || {};
        fillPts([[34, -82], [22, -100], [-8, -105], [-40, -92], [-46, -40], [-28, -24], [-20, -38], [-14, -62], [6, -80]], 'rgba(70,50,42,0.16)', 3);   // crâne rasé (repousse)
        strokePts(ep(-6, -58, 30, 32, 8, -2.5, -1.35), 'rgba(255,232,200,0.4)', 3);
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.26);
        dot(14, -30, 8, 'rgba(150,70,50,0.15)');
        oeil(f, 18, -52, 1.15); sourcil(f, 18, -63, '#120c0a', 4.6); X.mouth(f, 27, -26);
      } },
      calameOreille: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 8307, pts: OFFP,
        extra: (p) => { if (p.tenu === 'calame' || p.tenuB === 'calame' || p.calame === false) return;      // roseau glissé derrière l'oreille, qui dépasse du crâne
          const a = [-19, -20], b = [9, -114]; strokePts([a, b], 'rgba(40,28,14,0.85)', 6.2); strokePts([a, b], '#d2bc80', 3.6); strokePts([[b[0] - 1.2, b[1] + 6], b], '#9c7f48', 3.6); } },
      oreille: { parent: 'head', at: [0, 0], noRivet: true, base: '#000', seed: 8308, pts: OFFP, extra: (p) => { if (!(p.tenu === 'calame' || p.tenuB === 'calame' || p.calame === false)) X.earPaint(-8, -44); } },
      armF_up: upDef(SH_F, SC.peau, 8309),
      armF_lo: foreDef('armF_up', SC.peau, false, 8310, { cuff: SC.cuivre }),
    }, legParts(L, 8320), heldParts(SC.peau, 8330));
    return { hipY: -HIP, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'scribe',
      order: ['objetBPlat', 'armB_up', 'armB_lo', 'objetB', 'doigtsB'].concat(LEGS, ['head', 'calameOreille', 'oreille', 'torso', 'jupe', 'objetBDev', 'doigtsBDev', 'paille', 'objetPlat', 'armF_up', 'armF_lo', 'objet', 'doigts']) };
  }
  CH.ecrScribe = mkScribe();
  ECR.scribePose = (p, env) => gestes(p, env, 'scribe');
  ECR.scribe = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s; o = o || {}; const env = { def: CH.ecrScribe, x, y, s, dir: o.dir || 1, seatH: TAB_H };
    return run(CH.ecrScribe, ECR.scribePose(Object.assign({}, pose), env), x, y, s, o);
  };

  // =====================================================================
  // LE POÈTE — chignon bas, bandeau d'or, longue barbe bouclée en rangs (barbe 0..1, gris 0..1), robe drapée vert éteint à épaule nue, frange ocre ; lyre à tête de taureau
  // =====================================================================
  const PO = { peau: '#b98560', peauD: '#9c6c48', robe: '#5c6a4c', robeD: '#46523a', robeL: '#748262', frange: '#b0884a', or: '#c9a14b', orL: '#e6c878' };
  const poil = (p) => M.mixc('#1d1714', '#b4b2ad', clamp(p.gris || 0));
  const poilL = (p) => M.mixc('#4a4038', '#e2e0da', clamp(p.gris || 0));
  const PO_TORSO = [[-14, -190], [8, -192], [18, -180], [30, -162], [39, -126], [41, -80], [41, -30], [41, 8, 1], [-41, 8, 1], [-41, -30], [-40, -90], [-38, -130], [-33, -164], [-26, -180]];
  const J_PO = { top: -40, hem: 226, w: 41, flare: 10 };
  const barbeL = (p) => lerp(78, 384, clamp(p.barbe == null ? 0.5 : p.barbe));
  function boucles(x0, x1, y0, y1, col, sp) {
    sp = sp || 12;
    for (let y = y0, j = 0; y < y1; y += sp, j++) for (let x = x0 + (j % 2) * 4.5; x < x1; x += 9) strokePts(ep(x, y, 4.2, 4.2, 6, 0.4, 5.6), col, 1.2);
  }
  function mkPoete() {
    const L = { wt: 16, kt: 12.5, ak: 9.5, fl: 46, col: PO.peau, colD: PO.peauD };
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: PO_TORSO, base: PO.robe, seed: 8401, paint: () => {
        fillPts([[-16, -200], [12, -200], [22, -184], [32, -164], [40, -128], [42, -110], [30, -118], [8, -138], [-12, -158], [-24, -176]], PO.peau);   // épaule avant nue
        strokePts([[16, -130], [30, -124]], 'rgba(90,50,30,0.4)', 1.4);
        strokePts([[-26, -176], [-10, -158], [10, -138], [30, -120], [44, -108]], PO.robeD, 5);
        strokePts([[-26, -172], [-10, -154], [10, -134], [30, -116], [44, -104]], PO.frange, 1.6);
        for (const k of [0, 1, 2, 3]) strokePts([[-36, -138 + k * 34], [-10, -120 + k * 30], [20, -96 + k * 26], [44, -80 + k * 24]], 'rgba(40,50,30,0.45)', 1.4);
        hatch([[-50, -170], [-14, -160], [-12, 10], [-50, 10]], 0.75, 4.2, 0.26); shade(40, -40, -40, -40, 0.24);
      } },
      jupe: jupeDef(J_PO, PO.robe, 8402, (p, pts) => {
        for (let x = -60; x < 240; x += 16) strokePts([[x, J_PO.top + 10], [x + 4, 300]], 'rgba(40,50,30,0.38)', 1.4);
        shade(50, 0, -50, 0, 0.24, [-100, -60, 240, 320]);
        const a = pts[5], b = pts[6], band = [[a[0], a[1] - 14], [a[0], a[1]], [b[0], b[1]], [b[0], b[1] - 14]];
        fillPts(band, PO.frange, 0, 0);
        const n = Math.max(4, Math.round(Math.abs(a[0] - b[0]) / 4));
        for (let i = 0; i <= n; i++) { const x = lerp(a[0], b[0], i / n), y = lerp(a[1], b[1], i / n); strokePts([[x, y - 12], [x, y]], 'rgba(110,75,30,0.7)', 1); }
        fillPts([[-50, J_PO.top - 2], [70, J_PO.top - 2], [70, J_PO.top + 8], [-50, J_PO.top + 8]], PO.robeD);
      }),
      armB_up: upDef(SH_B, PO.robeD, 8404, () => { fillPts(box(-30, 46, 30, 120), PO.peauD); hatch(null, 0.9, 3.8, 0.3); }),
      armB_lo: foreDef('armB_up', PO.peauD, true, 8405, { cuff: PO.or }),
      head: { parent: 'torso', at: HEAD_AT, pts: X.NAP_HEAD, base: PO.peau, seed: 8406, noRivet: true, paint: (p) => {
        const f = p.face || {}, hc = poil(p), hl = poilL(p);
        fillPts([[30, -84], [22, -96], [4, -102], [-18, -98], [-34, -84], [-40, -60], [-40, -30], [-36, -10], [-24, -6], [-20, -26], [-16, -46], [-10, -62], [6, -76], [22, -80]], hc, 3);
        for (const k of [0, 1, 2]) strokePts([[24 - k * 4, -86 + k * 6], [0, -94 + k * 9], [-24, -86 + k * 12], [-36, -62 + k * 12]], hl, 1.2);
        fillPts([[34, -80], [30, -90], [-6, -96], [-38, -82], [-42, -70], [-32, -70], [-6, -84]], PO.or, 0, 0);
        for (const x of [24, 6, -12, -28]) dot(x, x > 0 ? -88 + x * 0.1 : -86 - x * 0.35, 2.2, PO.orL);
        X.earPaint(-8, -44);
        oeil(f, 18, -52, 1.05); sourcil(f, 18, -62, hc, 4.2); X.mouth(f, 27, -23);
        fillPts([[16, -34], [26, -37], [36, -33], [38, -27], [31, -25], [24, -28], [16, -26], [12, -30]], hc, 0, 0);   // moustache
      } },
      chignon: { parent: 'head', at: [-38, -16], noRivet: true, base: '#1d1714', seed: 8407, pts: ell(-6, 0, 17, 14, 16),
        paint: (p) => { fillPts(ell(-6, 0, 20, 16, 16), poil(p)); boucles(-20, 8, -10, 12, poilL(p), 8); strokePts([[4, -12], [6, 12]], PO.or, 3); } },
      barbeHaut: { parent: 'head', at: [0, 0], noRivet: true, base: '#1d1714', seed: 8408,
        pts: [[-14, -40], [-6, -32], [6, -24], [18, -20], [30, -20], [34, -12], [32, -2], [24, 6], [10, 10], [-6, 8], [-18, -6], [-22, -26]],
        paint: (p) => { fillPts(box(-30, -50, 40, 20), poil(p)); boucles(-18, 34, -30, 12, poilL(p), 10); } },
      barbe: { parent: 'head', at: [16, -2], noRivet: true, base: '#1d1714', seed: 8409,
        pts: (p) => { const Lb = barbeL(p), o = [[-18, -14], [-6, -10], [8, -12], [18, -2]];
          for (let i = 1; i <= 6; i++) { const y = Lb * i / 6; o.push([17 + 2.5 * Math.sin(i * 1.7), y - (i === 6 ? 6 : 0)]); }
          o.push([12, Lb, 1], [-12, Lb, 1]);
          for (let i = 5; i >= 1; i--) { const y = Lb * i / 6; o.push([-16 - 2.5 * Math.sin(i * 2.1) - 2 * (y / Lb), y]); }
          return o; },
        paint: (p) => { fillPts(box(-50, -20, 40, 420), poil(p)); boucles(-18, 22, -2, barbeL(p) + 4, poilL(p), 12); shade(-18, 0, 20, 0, 0.2, [-50, -20, 40, 420]); } },
      armF_up: upDef(SH_F, PO.peau, 8410),
      armF_lo: foreDef('armF_up', PO.peau, false, 8411, { cuff: PO.or }),
    }, legParts(L, 8420), heldParts(PO.peau, 8430));
    return { hipY: -HIP, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'poete',
      order: ['objetBPlat', 'armB_up', 'armB_lo', 'objetB', 'doigtsB'].concat(LEGS, ['head', 'chignon', 'torso', 'jupe', 'barbeHaut', 'barbe', 'objetBDev', 'doigtsBDev', 'paille', 'objetPlat', 'armF_up', 'armF_lo', 'objet', 'doigts']) };
  }
  CH.ecrPoete = mkPoete();
  ECR.poetePose = (p, env) => gestes(p, env, 'poete');
  ECR.poete = (pose, x, y, s, o) => {
    s = s == null ? 0.9 : s; o = o || {}; const env = { def: CH.ecrPoete, x, y, s, dir: o.dir || 1, seatH: SAC_H };
    return run(CH.ecrPoete, ECR.poetePose(Object.assign({}, pose), env), x, y, s, o);
  };

  // =====================================================================
  // OUVRIERS — 'a' : cheveux noirs bouclés courts, bandeau rouge sang, tunique courte ocre, carrure large ; 'b' : bonnet de laine brun, petite barbe, tunique bleu ardoise
  // =====================================================================
  const OU = { peau: '#b47c52', peauD: '#97633f', a: '#b0884a', aD: '#8e6c36', b: '#5b7182', bD: '#475a69', rouge: '#8a2f24', bonnet: '#6b4a33', bonnetD: '#523726', poil: '#1a1411', corde: '#6b5236' };
  function cheveuxBoucles() {
    const o = [];
    for (let i = 0; i <= 18; i++) { const a = lerp(-0.62, -3.95, i / 18), r = 1 + 0.07 * Math.abs(Math.sin(i * 1.9)); o.push([-2 + 40 * Math.cos(a) * r, -54 + 50 * Math.sin(a) * r]); }
    o.push([-18, -26], [-14, -44], [-12, -60], [6, -74], [24, -78]);
    return o;
  }
  const OA_TORSO = [[-16, -190], [8, -194], [20, -182], [34, -164], [45, -130], [45, -84], [41, -40], [41, 8, 1], [-43, 8, 1], [-45, -40], [-47, -100], [-45, -142], [-38, -168], [-28, -184]];
  const OB_TORSO = [[-14, -190], [8, -192], [18, -180], [29, -162], [38, -128], [39, -84], [37, -40], [38, 8, 1], [-38, 8, 1], [-39, -40], [-39, -100], [-38, -136], [-33, -164], [-26, -180]];
  function mkOuvrier(tenue) {
    const A_ = tenue === 'a', col = A_ ? OU.a : OU.b, colD = A_ ? OU.aD : OU.bD, wt = A_ ? 17.5 : 15;
    const J = { top: -24, hem: 102, w: A_ ? 43 : 39, flare: 6 };
    const L = { wt: A_ ? 18 : 16, kt: A_ ? 13.5 : 12.5, ak: 10, fl: 47, col: OU.peau, colD: OU.peauD };
    const manche = (c) => () => { fillPts([[-30, -30], [30, -30], [30, 34], [-30, 40]], c); strokePts([[-20, 38], [20, 33]], 'rgba(40,30,20,0.5)', 1.5); hatch(null, 0.9, 3.8, 0.26); };
    const parts = Object.assign({
      torso: { parent: null, at: [0, 0], pts: A_ ? OA_TORSO : OB_TORSO, base: col, seed: tenue === 'a' ? 8501 : 8601, paint: () => {
        fillPts([[-12, -200], [10, -200], [22, -184], [26, -172], [12, -164], [-4, -176]], OU.peau);
        strokePts([[-10, -184], [10, -166], [26, -172]], 'rgba(40,30,20,0.5)', 1.6);
        for (const x of [-20, 4, 26]) strokePts([[x, -150], [x + 2, 10]], 'rgba(40,30,20,0.25)', 1.3);
        hatch([[-52, -180], [-14, -180], [-12, 10], [-52, 10]], 0.75, 4.2, 0.27); shade(40, -40, -40, -40, 0.24);
      } },
      jupe: jupeDef(J, col, tenue === 'a' ? 8502 : 8602, (p, pts) => {
        for (let x = -50; x < 120; x += 18) strokePts([[x, -10], [x + 3, 120]], 'rgba(40,30,20,0.3)', 1.3);
        fillPts(box(-70, J.top - 1, 90, J.top + 8), OU.corde); strokePts([[30, J.top + 6], [34, J.top + 26]], OU.corde, 3); strokePts([[36, J.top + 6], [42, J.top + 22]], OU.corde, 3);
        fillPts(box(-80, J.hem - 6, 140, J.hem + 6), colD); shade(50, 0, -50, 0, 0.2, [-90, -30, 140, 120]);
      }),
      armB_up: upDef(SH_B, OU.peauD, tenue === 'a' ? 8504 : 8604, manche(colD), wt),
      armB_lo: foreDef('armB_up', OU.peauD, true, tenue === 'a' ? 8505 : 8605),
      head: { parent: 'torso', at: HEAD_AT, pts: X.NAP_HEAD, base: OU.peau, seed: tenue === 'a' ? 8506 : 8606, noRivet: true, paint: (p) => {
        const f = p.face || {};
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.28);
        dot(14, -30, 8, 'rgba(150,70,50,0.16)');
        oeil(f, 18, -52, 1); sourcil(f, 18, -62, '#1a120e', A_ ? 3.6 : 3.2); X.mouth(f, 27, -26);
        if (!A_) fillPts([[-16, -60], [-36, -50], [-40, -20], [-28, -16], [-22, -40]], OU.poil);
      } },
      armF_up: upDef(SH_F, OU.peau, tenue === 'a' ? 8509 : 8609, manche(col), wt),
      armF_lo: foreDef('armF_up', OU.peau, false, tenue === 'a' ? 8510 : 8610),
    }, legParts(L, tenue === 'a' ? 8520 : 8620), heldParts(OU.peau, tenue === 'a' ? 8530 : 8630));
    let extra;
    if (A_) {
      parts.cheveux = { parent: 'head', at: [0, 0], noRivet: true, base: OU.poil, seed: 8540, pts: cheveuxBoucles(), paint: () => {
        for (let i = 0; i < 26; i++) { const a = lerp(-0.7, -3.9, hash(i * 2.3)), r = 30 + hash(i * 5.1) * 14; strokePts(ep(-2 + Math.cos(a) * r, -54 + Math.sin(a) * r * 1.2, 4.5, 4.5, 6, 0.3, 5.5), 'rgba(120,100,90,0.6)', 1.1); }
      } };
      parts.bandeau = { parent: 'head', at: [0, 0], noRivet: true, base: OU.rouge, seed: 8541, pts: [[32, -78], [29, -88], [-4, -94], [-38, -80], [-42, -70], [-34, -68], [-4, -82], [28, -74]],
        paint: () => { strokePts([[30, -82], [-4, -88], [-36, -74]], 'rgba(200,90,70,0.6)', 1.3); } };
      parts.noeud = { parent: 'head', at: [-40, -74], noRivet: true, base: OU.rouge, seed: 8542, pts: [[0, -4], [-14, 4], [-20, 22], [-12, 20], [-6, 8], [2, 4]] };
      extra = ['cheveux', 'bandeau', 'noeud'];
    } else {
      parts.bonnet = { parent: 'head', at: [0, 0], noRivet: true, base: OU.bonnet, seed: 8640, pts: [[34, -72], [30, -88], [18, -104], [0, -112], [-22, -108], [-36, -94], [-42, -74], [-42, -56], [-30, -54], [-22, -66], [-4, -76], [18, -78]],
        paint: () => { fillPts([[36, -80], [-44, -66], [-44, -54], [-30, -52], [-22, -64], [-4, -72], [36, -72]], OU.bonnetD); for (let i = 0; i < 9; i++) strokePts([[28 - i * 8, -82 + i * 1.6], [24 - i * 8, -104 + i * 2]], 'rgba(30,20,12,0.35)', 1.2); hatch(null, 0.4, 3.4, 0.2); } };
      parts.barbeCourte = { parent: 'head', at: [0, 0], noRivet: true, base: '#2c211a', seed: 8641,
        pts: [[-12, -42], [-6, -30], [6, -22], [16, -18], [24, -18], [31, -12], [29, -2], [18, 7], [4, 9], [-8, 3], [-16, -12], [-18, -32]],
        paint: () => { for (let i = 0; i < 12; i++) strokePts([[-10 + i * 3.5, -26 + i * 0.6], [-8 + i * 3.5, 4]], 'rgba(120,100,80,0.45)', 1); fillPts([[16, -34], [26, -36], [34, -31], [30, -27], [18, -28]], '#2c211a', 0, 0); } };
      extra = ['bonnet'];
    }
    return { hipY: -HIP, parts, handLen: 100, rod: { part: 'torso', at: [-26, 18] }, nom: 'ouvrier' + tenue,
      order: ['objetBPlat', 'armB_up', 'armB_lo', 'objetB', 'doigtsB'].concat(LEGS, ['head'], extra, ['torso', 'jupe'], A_ ? [] : ['barbeCourte'], ['objetBDev', 'doigtsBDev', 'paille', 'objetPlat', 'armF_up', 'armF_lo', 'objet', 'doigts']) };
  }
  CH.ecrOuvrierA = mkOuvrier('a');
  CH.ecrOuvrierB = mkOuvrier('b');
  ECR.ouvrierPose = (p, env) => gestes(p, env, 'ouvrier');
  ECR.ouvrier = (pose, x, y, s, o) => {
    s = s == null ? 0.85 : s; o = o || {}; pose = pose || {};
    const def = pose.tenue === 'b' ? CH.ecrOuvrierB : CH.ecrOuvrierA, env = { def, x, y, s, dir: o.dir || 1, seatH: SAC_H };
    return run(def, ECR.ouvrierPose(Object.assign({}, pose), env), x, y, s, o);
  };

  // =====================================================================
  // ACCESSOIRES SEULS (sans tige) — même dessin que tenu en main ; (x,y) = point posé (base) de l'objet
  // =====================================================================
  const accDefs = {};
  function accDef(name, fn) { return accDefs[name] || (accDefs[name] = { hipY: 0, handLen: 10, rod: null, nom: name, parts: { o: { parent: null, at: [0, 0], pts: OFFP, base: '#000', noRivet: true, seed: 1, extra: (p) => fn(p.o) } }, order: ['o'] }); }
  function accDraw(name, fn, x, y, s, o) {
    o = Object.assign({}, o || {}); s = s == null ? 0.9 : s;
    return M.puppet(accDef(name, fn), { o, tilt: o.rot || 0 }, x, y, s, { dir: o.dir || 1, rod: false, slot: o.slot != null ? o.slot : y + 6 * s, floorShadow: !!o.ombre, cast: o.cast, alpha: o.alpha });
  }
  function acc(name, x, y, s, o) {
    const ob = OBJ[name];
    return accDraw(name, (oo) => { const b = vOf(ob.base, oo), c = cx_(); c.save(); c.translate(-b[0], -b[1]); ob.draw(oo); c.restore(); }, x, y, s, o);
  }
  for (const n of ['tablette', 'calame', 'miche', 'lyre']) ECR[n] = (x, y, s, o) => acc(n, x, y, s, o);

  // ---------------------------------------------------------------- GRANDE JARRE DE BIÈRE : (0,0) = sol ; 334 de haut (300 px à 0,9) ; col large, anneau
  const JA = { c: '#a5623e', cD: '#7e452a', cL: '#c27e55', anneau: '#6e3f26', mousse: '#eee3c8', mousseD: '#cdbd98', col: -322 };
  function jarreCorps() { return [[-30, -16], [-62, -40], [-92, -96], [-104, -170], [-98, -228], [-80, -270], [-60, -296], [-58, -312], [58, -312], [60, -296], [80, -270], [98, -228], [104, -170], [92, -96], [62, -40], [30, -16]]; }
  function drawJarre(o) {
    o = o || {}; const t = o.t || 0, m = clamp(o.mousse || 0), np = Math.round(clamp(o.pailles == null ? 2 : o.pailles, 0, 3));
    const couche = o.couche || 'tout';
    const levre = () => pc([[-68, -316, 1], [68, -316, 1], [66, -328], [56, -334], [-56, -334], [-66, -328]], JA.cL, () => { strokePts([[-60, -326], [60, -326]], 'rgba(255,230,200,0.45)', 1.5); fillPts(box(-70, -320, 70, -314), JA.cD); }, 9705, { drop: false });
    if (couche === 'col') { levre(); return; }
    pc([[-50, 0, 1], [50, 0, 1], [40, -26, 1], [-40, -26, 1]], JA.anneau, () => { strokePts([[-44, -12], [44, -12]], 'rgba(255,220,180,0.25)', 1.4); hatch(null, 0.3, 4, 0.2); }, 9700);
    pc(jarreCorps(), JA.c, () => {
      shade(90, -150, -100, -150, 0.42, [-110, -320, 110, 0]);
      dot(-46, -200, 46, 'rgba(220,150,110,0.25)');
      for (const y of [-246, -232]) strokePts([[-90, y], [90, y]], 'rgba(70,35,20,0.6)', 1.6);
      for (let i = 0; i < 11; i++) dot(-80 + i * 16, -258, 3.2, 'rgba(70,35,20,0.55)');
      strokePts([[-100, -150], [100, -150]], 'rgba(70,35,20,0.45)', 1.4);
      hatch(null, 0.9, 5, 0.14, 1, P.encre, [-110, -320, 110, 0]);
    }, 9701);
    pc(ell(0, -330, 56, 8, 18), '#2a170e', null, 9702, { drop: false });             // ouverture (intérieur sombre)
    const tops = [[-74, -540], [12, -566], [88, -526]];
    for (let i = 0; i < np; i++) { const b = [[-18, -316], [4, -318], [22, -316]][i]; paille(b, tops[i]); }
    if (m > 0.02) {                                                                  // mousse qui monte puis déborde
      const hF = 30 * Math.min(1, m * 2), n = 9;
      for (let i = 0; i < n; i++) { const x = -48 + i * 12, r = 13 + 4 * Math.sin(i * 2.1), yy = -330 - hF * (0.5 + 0.5 * Math.sin(i * 1.3 + 0.5)) + 1.5 * Math.sin(t * 3 + i); pc(ell(x, yy + 8, r, r * 0.8, 10), JA.mousse, () => dot(x - 3, yy + 4, r * 0.4, 'rgba(255,255,250,0.7)'), 9710 + i, { drop: false, texA: 0.3 }); }
      if (m > 0.5) {
        const k = (m - 0.5) * 2;
        for (const [x, l] of [[-50, 120], [-20, 70], [14, 150], [44, 95], [62, 60]]) {
          const L = l * k, w = 9;
          pc([[x - w, -332], [x + w, -332], [x + w * 0.9, -318 + L * 0.6], [x + w * 0.6, -318 + L], [x, -312 + L + 6], [x - w * 0.6, -318 + L], [x - w * 0.9, -318 + L * 0.6]], JA.mousse, () => strokePts([[x - 3, -326], [x - 3, -320 + L * 0.8]], 'rgba(255,255,250,0.7)', 1.6), 9720 + x, { drop: false, texA: 0.3 });
        }
      }
    }
    levre();
    if (m > 0.02 && !SIL()) for (let i = 0; i < 4; i++) { const u = ((t * 0.7 + i * 0.27) % 1); dot(-30 + i * 20 + 3 * Math.sin(t * 2 + i), -350 - 30 * Math.min(1, m * 2) - u * 30, 2.4 * (1 - u), `rgba(250,245,230,${0.7 * (1 - u)})`); }
  }
  ECR.jarre = (x, y, s, o) => accDraw('jarre', (oo) => drawJarre(oo), x, y, s, o);
  ECR.drawJarre = drawJarre;
  // point écran de la jarre posée en (x,y,s) : 'col' (milieu de la lèvre avant : y viser pour une paille), 'haut' (dessus de la mousse), 'ventre'
  ECR.jarrePt = (x, y, s, nom) => { s = s == null ? 0.9 : s; const m = { col: [0, -322], haut: [0, -366], ventre: [0, -170], bas: [0, 0] }[nom || 'col']; return [x + m[0] * s, y + m[1] * s]; };

  // ---------------------------------------------------------------- SAC D'ORGE (toile écrue) : (0,0) = sol ; 124 × 118 (dessus plat = siège du poète)
  function drawSac(o) {
    o = o || {}; const v = (o.v || 0) % 3, col = ['#d8c9a6', '#cfbe98', '#ddd0b0'][v], colD = ['#b4a37e', '#a99773', '#bcae8c'][v], h = o.debout ? 168 : SAC_H, w = o.debout ? 54 : 62;
    const pts = o.debout
      ? [[-w, 0, 1], [w, 0, 1], [w + 6, -60], [w - 2, -130], [18, -150], [10, -168], [24, -182], [0, -178], [-24, -184], [-10, -168], [-18, -150], [-w + 2, -130], [-w - 6, -60]]
      : [[-w, 0, 1], [w, 0, 1], [w + 8, -40], [w + 4, -96], [w - 10, -h + 2], [w - 2, -h - 12], [w - 22, -h - 2], [-w + 8, -h], [-w - 2, -96], [-w - 8, -40]];
    pc(pts, col, () => {
      for (let y = -h; y < 0; y += 9) strokePts([[-w - 10, y], [w + 10, y + 1]], 'rgba(120,100,70,0.16)', 1);
      for (let x = -w; x < w; x += 9) strokePts([[x, -h - 20], [x + 1, 0]], 'rgba(120,100,70,0.12)', 1);
      shade(w, -60, -w, -60, 0.3, [-w - 12, -h - 30, w + 12, 4]);
      strokePts([[-w + 12, -h * 0.55], [w - 10, -h * 0.5]], colD, 2.2);
      for (let x = -w + 16; x < w - 12; x += 12) strokePts([[x, -h * 0.55 - 4], [x + 3, -h * 0.55 + 4]], colD, 1.3);
      fillPts(box(-w - 10, -6, w + 10, 2), 'rgba(60,40,20,0.3)');
    }, 9800 + v);
    if (o.ouvert) for (let i = 0; i < 16; i++) { const x = -26 + hash(i * 1.7 + v) * 52, y = -h - 4 - hash(i * 3.3) * 10; pc(ellR(x, y, 5, 3, hash(i) * 3, 8), '#d6b25a', null, 9810 + i, { drop: false, texA: 0.3 }); }
  }
  ECR.sac = (x, y, s, o) => accDraw('sac' + ((o && o.debout) ? 'D' : ''), (oo) => drawSac(oo), x, y, s, o);
  ECR.SAC_H = SAC_H; ECR.TAB_H = TAB_H;

  // ---------------------------------------------------------------- PILE DE TABLETTES : (0,0) = sol au milieu ; n 1..12 en quinconce, rangs 3-2-3-2-2, chacune son motif
  const PILE_M = ['jarre', 'orge', 'mouton', 'addition', 'heros', 'orge', 'jarre', 'mouton', 'addition', 'jarre', 'orge', 'mouton'];
  function drawPile(o) {
    o = o || {}; const n = Math.round(clamp(o.n == null ? 12 : o.n, 0, 12)), T = 0.56, Wt = 124 * T, Ht = 160 * T, rows = [3, 2, 3, 2, 2], c = cx_();
    let i = 0;
    for (let r = 0; r < rows.length && i < n; r++) {
      const cnt = rows[r];
      for (let j = 0; j < cnt && i < n; j++, i++) {
        const x = (j - (cnt - 1) / 2) * (Wt + 4), y = -Ht / 2 - 6 - r * (Ht - 4), rr = (hash(i * 3.7) - 0.5) * 0.08;
        const mot = (o.motifs && o.motifs[i]) || PILE_M[i];
        c.save(); c.translate(x, y); c.rotate(rr); drawTablette({ motif: mot, taille: T, encoches: mot === 'addition' ? 12 : Math.floor(hash(i * 5.1) * 6) }); c.restore();
      }
    }
  }
  ECR.pile = (x, y, s, o) => accDraw('pile', (oo) => drawPile(oo), x, y, s, o);
  ECR.drawPile = drawPile;

  // ---------------------------------------------------------------- ÉTAGÈRE SUSPENDUE : planche sur deux cordes qui montent aux cintres ; (x,y) = dessus de la planche au milieu ; 440 de long
  const ET = { L: 220, bois: '#7a5432', boisD: '#5a3c22', corde: '#8a7350' };
  function drawEtagere(o) {
    o = o || {}; const n = Math.round(clamp(o.n == null ? 4 : o.n, 0, 6)), T = 0.6, Ht = 160 * T, ms = o.motifs || ['jarre', 'orge', 'mouton', 'heros', 'addition', 'jarre'];
    const c = cx_();
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 72; c.save(); c.translate(x, -Ht / 2 - 4); c.rotate((hash(i * 9.3) - 0.5) * 0.06); drawTablette({ motif: ms[i % ms.length], taille: T, encoches: Math.floor(hash(i * 2.9) * 6) }); c.restore(); }
    pc(box(-ET.L, 0, ET.L, 20), ET.bois, () => { strokePts([[-ET.L, 5], [ET.L, 5]], 'rgba(255,220,170,0.3)', 1.5); hatch(null, 0.05, 4, 0.22); }, 9900);
    for (const x of [-ET.L + 20, ET.L - 20]) { pc(ell(x, 10, 9, 9, 10), ET.boisD, () => dot(x, 10, 4, '#2a1a10'), 9901 + x, { drop: false }); }
  }
  ECR.etagere = function (t, x, y, s, o) {
    o = o || {}; s = s == null ? 0.9 : s; const g = M.tg ? M.tg(t) : t, a = 0.012 * Math.sin(g * 0.9 + (o.ph || 0)) + (o.rot || 0), c = cx_();
    if (!o.sansCordes) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.strokeStyle = ET.corde; c.lineWidth = 3.2 * s;
      for (const sx of [-1, 1]) { const ex = x + sx * (ET.L - 20) * s * Math.cos(a), ey = y + sx * (ET.L - 20) * s * Math.sin(a) + 10 * s; c.beginPath(); c.moveTo(ex, ey); c.lineTo(x + sx * (ET.L - 20) * s, -40); c.stroke(); }
      c.restore();
    }
    return accDraw('etagere', (oo) => drawEtagere(oo), x, y, s, Object.assign({}, o, { rot: a }));
  };

  // ---------------------------------------------------------------- TABOURET DE BRIQUES (86 de haut) et COMPTOIR BAS DE BRIQUES (230 de haut, 440 de long) — pré-rendus
  const BR = { b: '#b08458', bD: '#8e6640', bL: '#c79c6c', joint: 'rgba(70,45,25,0.55)' };
  function briques(x0, y0, x1, y1, h, w) {
    for (let y = y1, j = 0; y > y0; y -= h, j++) {
      strokePts([[x0, y], [x1, y]], BR.joint, 1.4);
      for (let x = x0 + (j % 2 ? w / 2 : 0); x < x1; x += w) strokePts([[x, y], [x, y - h]], BR.joint, 1.2);
    }
  }
  function drawTabouret() {
    pc(box(-50, -TAB_H + 10, 50, 0), BR.b, () => { briques(-50, -TAB_H, 50, 0, 19, 34); shade(50, 0, -50, 0, 0.3, [-60, -100, 60, 4]); hatch(null, 0.8, 5, 0.12); }, 9950);
    pc([[-56, -TAB_H, 1], [56, -TAB_H, 1], [54, -TAB_H + 12, 1], [-54, -TAB_H + 12, 1]], BR.bL, () => strokePts([[-50, -TAB_H + 3], [50, -TAB_H + 3]], 'rgba(255,235,200,0.4)', 1.4), 9951);
  }
  const CO = { L: 220, H: 230 };
  function drawComptoir() {
    pc(box(-CO.L, -CO.H + 20, CO.L, 0), BR.b, () => {
      briques(-CO.L, -CO.H, CO.L, 0, 23, 46);
      for (const [x, y, r] of [[-120, -120, 40], [60, -70, 54], [170, -150, 30]]) fillPts(ell(x, y, r, r * 0.7, 12), 'rgba(205,170,125,0.35)');
      shade(CO.L, 0, -CO.L, 0, 0.26, [-CO.L - 10, -CO.H, CO.L + 10, 4]); hatch(null, 0.8, 6, 0.12);
      fillPts(box(-CO.L, -14, CO.L, 0), 'rgba(60,35,15,0.3)');
    }, 9960);
    pc([[-CO.L - 14, -CO.H, 1], [CO.L + 14, -CO.H, 1], [CO.L + 10, -CO.H + 22, 1], [-CO.L - 10, -CO.H + 22, 1]], '#8a6038', () => { strokePts([[-CO.L, -CO.H + 5], [CO.L, -CO.H + 5]], 'rgba(255,220,170,0.35)', 1.6); hatch(null, 0.04, 4, 0.2); }, 9961);
  }
  ECR.tabouret = (x, y, s, o) => { o = o || {}; M.flat(ECR.K.tabouret, x, y, { scale: s == null ? 0.9 : s, cast: o.cast }); };
  ECR.comptoir = (x, y, s, o) => { o = o || {}; M.flat(ECR.K.comptoir, x, y, { scale: s == null ? 1 : s, cast: o.cast }); };
  ECR.COMPTOIR = CO;

  // =====================================================================
  // DÉCOR : L'ENTREPÔT DU TEMPLE D'URUK — toile du soir (ziggourat massive et basse à terrasses, escalier central, deux palmiers dattiers),
  // mur de briques crues percé d'une large baie, corniches à lampes à huile, jarres de stockage à fond pointu dans leur support, sol de terre battue
  // =====================================================================
  const EN = { baie: [330, 750], baieY: [470, 930], corniches: [{ x0: 92, x1: 300, y: 730, lampe: 196 }, { x0: 780, x1: 988, y: 730, lampe: 884 }], jarres: [118, 204, 290, 790, 876, 962], sol: 1345 };
  ECR.ENTREPOT = EN;
  function zig(c, X0, B, soir) {
    const lit = soir ? '#a77866' : '#d2b086', sh = soir ? '#7f5a52' : '#b08d66', top = soir ? '#c9b0a0' : '#ece0c4';
    const lv = [[182, 176, 0, 42], [130, 125, 42, 70], [86, 82, 70, 90]];
    for (const [w0, w1, y0, y1] of lv) {
      M.piece([[X0 - w0, B - y0, 1], [X0 + w0, B - y0, 1], [X0 + w1, B - y1, 1], [X0 - w1, B - y1, 1]], lit, () => {
        fillPts([[X0 - w0, B - y0], [X0 - w0 * 0.25, B - y0], [X0 - w1 * 0.25, B - y1], [X0 - w1, B - y1]], sh);
        for (let x = X0 - w1 + 10; x < X0 + w1 - 6; x += 16) fillPts(box(x, B - y1 + 4, x + 6, B - y0 - 2), 'rgba(90,60,40,0.22)', 0, 0);
        strokePts([[X0 - w1, B - y1 + 2], [X0 + w1, B - y1 + 2]], 'rgba(255,240,210,0.35)', 1.4);
      }, { seed: 7100 + y0, texA: 0.4, drop: false });
    }
    M.piece([[X0 - 46, B - 90, 1], [X0 + 46, B - 90, 1], [X0 + 44, B - 110, 1], [X0 - 44, B - 110, 1]], top, () => { fillPts(box(X0 - 6, B - 106, X0 + 6, B - 90), 'rgba(60,40,30,0.6)'); for (const x of [-34, -22, 22, 34]) fillPts(box(X0 + x - 2, B - 107, X0 + x + 2, B - 92), 'rgba(120,100,80,0.35)', 0, 0); }, { seed: 7110, texA: 0.35, drop: false });
    M.piece([[X0 - 14, B, 1], [X0 + 14, B, 1], [X0 + 8, B - 90, 1], [X0 - 8, B - 90, 1]], soir ? '#b08a78' : '#dcc098', () => { for (let y = B - 4; y > B - 90; y -= 5) strokePts([[X0 - 20, y], [X0 + 20, y]], 'rgba(100,70,45,0.32)', 1); }, { seed: 7111, texA: 0.35, drop: false });
  }
  function palmier(c, x, y, h, soir, seed) {
    const tr = soir ? '#4d3b33' : '#7a5f44', fe = soir ? '#3f4038' : '#66733f';
    const top = [x + 10, y - h], line = qbez([x, y], [x - 8, y - h * 0.5], top, 8);
    M.piece(ribbon(line, 12, 7), tr, () => { for (let i = 1; i < 8; i++) { const p = line[i]; strokePts([[p[0] - 6, p[1]], [p[0] + 6, p[1] - 2]], 'rgba(40,25,15,0.45)', 1.2); } }, { seed, texA: 0.4, drop: false });
    for (let i = 0; i < 8; i++) {
      const a = -PI / 2 + (i - 3.5) * 0.42, L = 62 + 10 * Math.sin(i * 2.3), end = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * 0.6 + L * 0.42 * Math.abs(Math.cos(a))];
      M.piece(ribbon(qbez(top, [top[0] + Math.cos(a) * L * 0.6, top[1] + Math.sin(a) * L * 0.6 - 10], end, 6), 9, 1), fe, null, { seed: seed + i + 1, texA: 0.35, drop: false });
    }
    for (let i = 0; i < 6; i++) dot(top[0] - 6 + (i % 3) * 5, top[1] + 8 + Math.floor(i / 3) * 5, 3, soir ? '#7a4a30' : '#c27a32');
  }
  function drawCiel(c, soir) {
    const W = M.W, Hh = M.ST.back + 5, g = c.createLinearGradient(0, 0, 0, 940);
    if (soir) { g.addColorStop(0, '#3d2c48'); g.addColorStop(0.55, '#8e4a46'); g.addColorStop(1, '#d88a50'); }
    else { g.addColorStop(0, '#c8904e'); g.addColorStop(0.5, '#e2b56c'); g.addColorStop(1, '#f1d69a'); }
    c.fillStyle = g; c.fillRect(0, 0, W, Hh);
    const sx = 452, sy = soir ? 900 : 812, gl = c.createRadialGradient(sx, sy, 10, sx, sy, 230);
    gl.addColorStop(0, soir ? 'rgba(255,150,90,0.6)' : 'rgba(255,240,190,0.7)'); gl.addColorStop(1, 'rgba(255,220,150,0)');
    c.fillStyle = gl; c.fillRect(sx - 240, sy - 240, 480, 480);
    M.piece(ell(sx, sy, 34, 34, 22), soir ? '#e06a3c' : '#f6dc9a', null, { seed: 7001, drop: false, texA: 0.3 });
    for (const [x, y, w] of [[400, 640, 260], [640, 590, 200], [520, 730, 180]]) { c.save(); c.translate(x, y); c.scale(1, 0.08); const gc = c.createRadialGradient(0, 0, 4, 0, 0, w / 2); gc.addColorStop(0, soir ? 'rgba(200,130,130,0.5)' : 'rgba(255,240,205,0.6)'); gc.addColorStop(1, 'rgba(255,240,205,0)'); c.fillStyle = gc; c.fillRect(-w / 2, -w / 2, w, w); c.restore(); }
    M.piece([[0, 902], [W, 898, 1], [W, Hh, 1], [0, Hh, 1]], soir ? '#6e4c40' : '#c19864', () => { for (let y = 910; y < 960; y += 9) strokePts([[0, y], [W, y + 2]], 'rgba(90,60,35,0.2)', 1); }, { seed: 7003, drop: false, texA: 0.4 });
    for (const [x, w, h] of [[250, 60, 18], [820, 70, 16], [880, 40, 22]]) M.piece(box(x, 902 - h, x + w, 904), soir ? '#7a5648' : '#c9a578', null, { seed: 7004 + x, drop: false, texA: 0.4 });
    zig(c, 540, 902, soir);
    palmier(c, 366, 914, 168, soir, 7200); palmier(c, 718, 916, 140, soir, 7220);
    const br = c.createLinearGradient(0, 760, 0, 930); br.addColorStop(0, 'rgba(240,210,160,0)'); br.addColorStop(1, soir ? 'rgba(200,120,90,0.25)' : 'rgba(245,220,170,0.35)');
    c.fillStyle = br; c.fillRect(0, 760, W, 180);
  }
  function jarreStock(x, y, v) {                                                  // jarre de stockage à fond pointu (argile beige-gris) ; (x,y) = pointe
    const col = ['#b59a76', '#a88d6a', '#bba684'][v % 3];
    M.piece([[x, y], [x - 22, y - 40], [x - 38, y - 100], [x - 36, y - 140], [x - 22, y - 160], [x - 16, y - 172], [x - 20, y - 182, 1], [x + 20, y - 182, 1], [x + 16, y - 172], [x + 22, y - 160], [x + 36, y - 140], [x + 38, y - 100], [x + 22, y - 40]], col, () => {
      shade(x + 36, y - 100, x - 36, y - 100, 0.35, [x - 42, y - 190, x + 42, y + 4]);
      strokePts([[x - 34, y - 132], [x + 34, y - 132]], 'rgba(80,60,40,0.45)', 1.4);
      if (v % 2) M.piece(ell(x, y - 186, 18, 7, 10), '#8e7456', null, { seed: 7300 + x, drop: false });
    }, { seed: 7310 + x, texA: 0.5 });
  }
  function drawMur() {
    const W = M.W, B = M.ST.back, c = cx_();
    // (repère : origine au bas-centre, y = 0 au plancher ; l'écran y = B + y)
    const Y = (sy) => sy - B, Xs = (sx) => sx - W / 2;
    M.piece(box(-W / 2 - 20, -B - 20, W / 2 + 20, Y(EN.sol)), '#b98d5e', () => {
      briques(-W / 2 - 20, -B - 20, W / 2 + 20, Y(EN.sol), 24, 56);
      for (const [x, y, rx, ry] of [[-380, -1000, 120, 160], [360, -880, 140, 120], [-300, -300, 160, 90], [330, -280, 120, 80], [0, -1180, 200, 70]]) fillPts(ell(x, y, rx, ry, 14), 'rgba(214,180,135,0.16)');
      for (const xn of [-500, -440, 440, 500]) fillPts(box(xn - 14, -B, xn + 14, Y(EN.sol) - 10), 'rgba(80,50,28,0.22)');
      strokePts([[-410, -640], [-396, -600], [-404, -560], [-390, -520]], 'rgba(60,35,20,0.5)', 1.4);
      strokePts([[300, -420], [312, -380], [306, -330]], 'rgba(60,35,20,0.5)', 1.4);
      shade(-W / 2, 0, W / 2, 0, 0.18, [-W / 2 - 20, -B - 20, W / 2 + 20, 0]);
      hatch(null, 0.8, 7, 0.08, 1, P.encre, [-W / 2 - 20, -B - 20, W / 2 + 20, 0]);
    }, { seed: 7400, texA: 0.5, drop: false });
    if (!SIL()) { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(Xs(EN.baie[0]), Y(EN.baieY[0]), EN.baie[1] - EN.baie[0], EN.baieY[1] - EN.baieY[0]); c.restore(); }
    // ébrasement, linteau de bois, appui
    for (const sx of [EN.baie[0], EN.baie[1]]) { const d = sx === EN.baie[0] ? -1 : 1; M.piece(box(Xs(sx) - (d < 0 ? 22 : 0), Y(EN.baieY[0]), Xs(sx) + (d > 0 ? 22 : 0), Y(EN.baieY[1])), '#a37a4f', () => { briques(Xs(sx) - 22, Y(EN.baieY[0]), Xs(sx) + 22, Y(EN.baieY[1]), 24, 22); shade(Xs(sx), 0, Xs(sx) - 22 * d, 0, 0.3, [Xs(sx) - 30, Y(EN.baieY[0]), Xs(sx) + 30, Y(EN.baieY[1])]); }, { seed: 7410 + sx, texA: 0.5 }); }
    M.piece(box(Xs(EN.baie[0]) - 46, Y(EN.baieY[0]) - 34, Xs(EN.baie[1]) + 46, Y(EN.baieY[0]) + 2), '#6b4a2e', () => { for (const y of [-22, -10]) strokePts([[Xs(EN.baie[0]) - 46, Y(EN.baieY[0]) + y], [Xs(EN.baie[1]) + 46, Y(EN.baieY[0]) + y]], 'rgba(30,18,8,0.5)', 1.3); hatch(null, 0.05, 4, 0.2); }, { seed: 7420 });
    for (const xb of [Xs(EN.baie[0]) - 30, Xs(EN.baie[1]) + 30]) M.piece(ell(xb, Y(EN.baieY[0]) - 16, 12, 12, 12), '#5a3c22', () => dot(xb, Y(EN.baieY[0]) - 16, 5, '#3a2614'), { seed: 7421 + xb, drop: false });
    M.piece(box(Xs(EN.baie[0]) - 30, Y(EN.baieY[1]) - 4, Xs(EN.baie[1]) + 30, Y(EN.baieY[1]) + 22), '#c9a274', () => { strokePts([[Xs(EN.baie[0]) - 30, Y(EN.baieY[1])], [Xs(EN.baie[1]) + 30, Y(EN.baieY[1])]], 'rgba(255,235,200,0.4)', 1.5); hatch(null, 0.3, 5, 0.15); }, { seed: 7422 });
    // corniches et lampes à huile en terre
    for (const k of EN.corniches) {
      M.piece(box(Xs(k.x0), Y(k.y), Xs(k.x1), Y(k.y) + 18), '#9c7148', () => { strokePts([[Xs(k.x0), Y(k.y) + 3], [Xs(k.x1), Y(k.y) + 3]], 'rgba(255,230,190,0.35)', 1.4); hatch(null, 0.2, 4, 0.18); }, { seed: 7430 + k.x0 });
      for (const xc of [k.x0 + 26, k.x1 - 26]) M.piece([[Xs(xc) - 12, Y(k.y) + 18, 1], [Xs(xc) + 12, Y(k.y) + 18, 1], [Xs(xc), Y(k.y) + 46]], '#8a6240', null, { seed: 7440 + xc });
      const lx = Xs(k.lampe), ly = Y(k.y), sp = k.lampe < W / 2 ? 1 : -1;
      M.piece([[lx - 28 * sp, ly], [lx + 22 * sp, ly], [lx + 36 * sp, ly - 10], [lx + 30 * sp, ly - 16], [lx + 10 * sp, ly - 14], [lx - 4 * sp, ly - 24], [lx - 22 * sp, ly - 20], [lx - 30 * sp, ly - 10]], '#a8744a', () => { fillPts(ell(lx - 6 * sp, ly - 20, 9, 3, 8), '#3a2214'); strokePts([[lx - 26 * sp, ly - 6], [lx + 30 * sp, ly - 8]], 'rgba(70,40,20,0.45)', 1.2); }, { seed: 7450 + k.lampe });
    }
    // sol de terre battue au pied du mur
    M.piece(box(-W / 2 - 20, Y(EN.sol), W / 2 + 20, 12), '#8d6a46', () => { for (let i = 0; i < 40; i++) dot(-W / 2 + hash(i * 1.9) * W, Y(EN.sol) + 6 + hash(i * 4.1) * 40, 2 + hash(i) * 3, 'rgba(60,40,22,0.3)'); hatch(null, 0.1, 5, 0.15); shade(0, Y(EN.sol), 0, 0, 0.25, [-W / 2 - 20, Y(EN.sol), W / 2 + 20, 12]); }, { seed: 7460, texA: 0.5, drop: false });
    // support de bois et jarres de stockage (deux groupes de trois)
    for (const [xa, xb] of [[EN.jarres[0] - 50, EN.jarres[2] + 50], [EN.jarres[3] - 50, EN.jarres[5] + 50]]) {
      for (const x of [xa, xb]) M.piece(box(Xs(x) - 7, Y(EN.sol) - 150, Xs(x) + 7, Y(EN.sol) + 24), '#5e4128', null, { seed: 7470 + x });
      M.piece(box(Xs(xa) - 10, Y(EN.sol) - 120, Xs(xb) + 10, Y(EN.sol) - 106), '#6b4a2e', () => hatch(null, 0.05, 4, 0.2), { seed: 7480 + xa });
    }
    EN.jarres.forEach((x, i) => jarreStock(Xs(x), Y(EN.sol) + 20, i));
    for (const [xa, xb] of [[EN.jarres[0] - 50, EN.jarres[2] + 50], [EN.jarres[3] - 50, EN.jarres[5] + 50]]) M.piece(box(Xs(xa) - 10, Y(EN.sol) - 40, Xs(xb) + 10, Y(EN.sol) - 28), '#6b4a2e', () => hatch(null, 0.05, 4, 0.2), { seed: 7490 + xa });
  }
  function flamme(x, y, g, k, seed) {
    const c = cx_(), f = 1 + 0.18 * M.noise(g * 6, seed) + 0.08 * Math.sin(g * 23 + seed), sw = 2.5 * M.noise(g * 4, seed + 3);
    const gl = c.createRadialGradient(x, y - 10, 2, x, y - 10, 40 + 60 * k); gl.addColorStop(0, `rgba(255,190,90,${0.35 + 0.35 * k})`); gl.addColorStop(1, 'rgba(255,170,70,0)');
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = gl; c.fillRect(x - 110, y - 120, 220, 220); c.restore();
    c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x - 8, y - 14 * f, x + sw, y - 26 * f); c.quadraticCurveTo(x + 8, y - 12 * f, x + 6, y); c.closePath(); c.fillStyle = '#f2a640'; c.fill();
    c.beginPath(); c.moveTo(x - 3, y); c.quadraticCurveTo(x - 3, y - 8 * f, x + sw * 0.6, y - 15 * f); c.quadraticCurveTo(x + 4, y - 7 * f, x + 3, y); c.closePath(); c.fillStyle = '#fff1bf'; c.fill();
  }
  function toile(x, y, sx, sy, R, a) {                                             // toile d'araignée dans un coin (sx, sy = sens vers l'intérieur)
    const c = cx_(); c.save(); c.strokeStyle = `rgba(240,236,226,${0.6 * a})`; c.lineWidth = 1;
    const rays = 6; for (let i = 0; i <= rays; i++) { const t = i / rays * PI / 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sx * Math.cos(t) * R, y + sy * Math.sin(t) * R); c.stroke(); }
    for (let r = R * 0.18; r < R; r += R * 0.16) { c.beginPath(); for (let i = 0; i <= rays; i++) { const t = i / rays * PI / 2, rr = r * (0.92 + 0.08 * Math.cos(i * 2)); const px = x + sx * Math.cos(t) * rr, py = y + sy * Math.sin(t) * rr; if (i) c.quadraticCurveTo(x + sx * Math.cos(t - 0.13) * rr * 0.9, y + sy * Math.sin(t - 0.13) * rr * 0.9, px, py); else c.moveTo(px, py); } c.stroke(); }
    c.restore();
  }
  // ECR.entrepot(t, up, o) : toile de fond + oiseaux par la baie + mur (monte de up px) + flammes ; à appeler en premier, avant M.drawFloor()
  // o.soir 0..1 (la lumière baisse, lampes plus vives), o.toile 0..1 (toiles d'araignée), o.oiseaux (true), o.lampes (true)
  ECR.entrepot = function (t, up, o) {
    o = o || {}; up = up || 0; const K = ECR.K, c = cx_(), g = M.tg ? M.tg(t) : t, so = clamp(o.soir || 0), W = M.W, B = M.ST.back;
    c.drawImage(K.ciel, 0, 0);
    if (so > 0) { c.save(); c.globalAlpha = so; c.drawImage(K.cielSoir, 0, 0); c.restore(); }
    if (o.oiseaux !== false) M.oiseaux(g, { x0: 250, x1: 830, y: 590, dur: 12, n: 4, s: 0.42, seed: 31, col: '#2c2420', brume: 0.4, boucle: true });
    M.flat(K.mur, W / 2, B - up);
    if (so > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(70,50,80,${0.45 * so})`; c.fillRect(0, 0, W, B + 10); c.restore(); }
    if (o.lampes !== false) for (const k of EN.corniches) { const sp = k.lampe < W / 2 ? 1 : -1; flamme(k.lampe + 34 * sp, k.y - 14 - up, g, 0.4 + 0.6 * so, k.lampe); }
    const tw = clamp(o.toile || 0);
    if (tw > 0) { const y0 = EN.baieY[0] - up; toile(EN.baie[0], y0, 1, 1, 90, tw); toile(EN.baie[1], y0, -1, 1, 80, tw); toile(48, 262 - up, 1, 1, 130, tw); toile(1032, 262 - up, -1, 1, 120, tw); toile(EN.corniches[0].x1, EN.corniches[0].y + 18 - up, -1, 1, 60, tw); }
  };

  ECR.init = function () {
    const K = (ECR.K = {}), W = M.W, B = M.ST.back;
    K.ciel = M.pre(W, B + 5, (c) => drawCiel(c, false));
    K.cielSoir = M.pre(W, B + 5, (c) => drawCiel(c, true));
    K.mur = M.cutFlat(W, B + 40, W / 2, B + 30, () => drawMur()); K.mur.padB = 10;
    K.tabouret = M.withShadow(M.cutFlat(140, 120, 70, 110, () => drawTabouret()), 6); K.tabouret.padB = 10;
    K.comptoir = M.withShadow(M.cutFlat(2 * CO.L + 60, CO.H + 40, CO.L + 30, CO.H + 30, () => drawComptoir()), 8); K.comptoir.padB = 10;
    return K;
  };
})();
