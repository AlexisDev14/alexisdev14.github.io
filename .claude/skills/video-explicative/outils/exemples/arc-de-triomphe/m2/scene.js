// Extrait m2 — « Austerlitz » (théâtre de marionnettes à tiges)
const SCENE = (() => {
  const S = {}, E = TL.EVENTS, C = M.chars, ST = M.ST;
  const { clamp, lerp, ease, easeOut, easeIn, smooth, spring, wob, noise, TAU, rng } = M;
  const ctx = () => M.ctx();
  let K;
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  const NAPX = 340, ARX = 790, ARS = 0.96;

  // ---------------------------------------------------------------- décors propres au plan
  function hillRow(seed, col, crest, amp, h, tufts) {
    const w = M.W + 120;
    const cv = M.cutFlat(w, h + 20, w / 2, h + 10, (x) => {
      const R = rng(seed);
      const pts = [[-w / 2 + 4, 0, 1]];
      for (let k = 0; k <= 14; k++) { const xx = -w / 2 + 4 + k * (w - 8) / 14; pts.push([xx, crest(xx) + (R() - 0.5) * amp]); }
      pts.push([w / 2 - 4, 0, 1]);
      M.piece(pts, col, () => {
        M.hatch(null, 0.25, 5.5, 0.2, 1, M.P.encre, [-w / 2, -h, w / 2, 0]);
        M.shade(0, -h, 0, 0, 0.3, [-w / 2, -h, w / 2, 0]);
        if (tufts) for (let i = 0; i < 70; i++) { const tx = -w / 2 + R() * w, ty = crest(tx) + 18 + R() * (h * 0.6); x.strokeStyle = `rgba(30,35,20,${0.25 + R() * 0.25})`; x.lineWidth = 1.4; x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx - 3, ty - 9); x.moveTo(tx, ty); x.lineTo(tx + 3, ty - 10); x.stroke(); }
      }, { seed });
    });
    return M.withShadow(cv, 7);
  }
  function makeGauze() {
    return M.pre(1500, 170, (x) => {
      const R = rng(5);
      for (let i = 0; i < 26; i++) {
        const cx = R() * 1500, cy = 85 + (R() - 0.5) * 40, rx = 120 + R() * 200, ry = 30 + R() * 26;
        const g = x.createRadialGradient(cx, cy, 2, cx, cy, rx);
        g.addColorStop(0, 'rgba(240,232,212,0.30)'); g.addColorStop(1, 'rgba(240,232,212,0)');
        x.save(); x.translate(cx, cy); x.scale(1, ry / rx); x.translate(-cx, -cy); x.fillStyle = g; x.fillRect(cx - rx, cy - rx, 2 * rx, 2 * rx); x.restore();
      }
      // trame de tulle
      x.globalCompositeOperation = 'destination-out';
      for (let y = 0; y < 170; y += 3) { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, y, 1500, 1); }
    });
  }
  S.init = () => {
    K = {
      sky: M.makeSky('aube'),
      far: hillRow(11, '#737a86', (xx) => -330 + 40 * Math.sin(xx * 0.006 + 1) + 22 * Math.sin(xx * 0.017), 10, 380, false),
      mid: hillRow(12, '#6b6a4d', (xx) => -215 + 34 * Math.sin(xx * 0.008 + 2.5) + 14 * Math.sin(xx * 0.02), 8, 260, true),
      front: hillRow(13, '#4f5a3c', (xx) => -95 - 45 * Math.exp(-(((xx + 200) / 260) ** 2)) + 10 * Math.sin(xx * 0.02), 6, 170, true),
      wingL: M.makeTreeWing(5, false), wingR: M.makeTreeWing(9, true),
      cloud1: M.makeCloud(1, 0.9), cloud2: M.makeCloud(2, 0.75), gauze: makeGauze(),
    };
  };

  // ---------------------------------------------------------------- rideau (comme m4)
  function curtainState(t) {
    const u = (t - E.curtain0) / (E.curtain1 - E.curtain0);
    const f = ease(u);
    const vel = (ease(u + 0.02) - ease(u - 0.02)) / (0.04 * (E.curtain1 - E.curtain0));
    return { f, swing: -vel * 9 + wob(t, E.curtain1, 26, 0.85, 2.6) };
  }

  // ---------------------------------------------------------------- soleil d'Austerlitz (carton doré, sur son fil)
  function sunGold(x, y, r, t) {
    const c = ctx();
    c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y - r * 1.3); c.lineTo(x, 0); c.stroke();
    c.save(); c.globalCompositeOperation = 'screen';
    const gg = c.createRadialGradient(x, y, r * 0.6, x, y, r * 3.2); gg.addColorStop(0, 'rgba(240,190,90,0.38)'); gg.addColorStop(1, 'rgba(240,190,90,0)');
    c.fillStyle = gg; c.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4); c.restore();
    c.save(); c.translate(x, y); c.rotate(t * 0.12);
    const rays = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU, rr = i % 2 ? r * 0.98 : r * 1.32; rays.push([Math.cos(a) * rr, Math.sin(a) * rr, i % 2 ? 0 : 1]); }
    M.piece(rays, '#b98a3a', () => { M.hatch(null, 0.8, 4, 0.2, 1, M.P.encre, [-r * 1.4, -r * 1.4, r * 1.4, r * 1.4]); }, { seed: 301 });
    c.restore();
    c.save(); c.translate(x, y);
    const disk = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; disk.push([Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86]); }
    M.piece(disk, '#d7aa50', () => { const g2 = c.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g2.addColorStop(0, '#f2d998'); g2.addColorStop(1, '#a8752c'); c.fillStyle = g2; c.fillRect(-r, -r, 2 * r, 2 * r); M.hatch([[0, -r], [r, -r], [r, r], [0, r]], 0.8, 4, 0.16); }, { seed: 302 });
    M.rivet(0, -r * 0.62, 3.6);
    c.restore();
  }

  // ---------------------------------------------------------------- fumées en coton (sur fils)
  const PUFFS = [[575, 1030, 0.62, E.smoke0], [668, 1012, 0.5, E.smoke0 + 0.45], [492, 1046, 0.45, E.smoke0 + 0.85], [735, 1030, 0.55, E.smoke0 + 1.2]];
  function cotton(x, y, s, seed) {
    const c = ctx(), R = rng(seed);
    c.strokeStyle = 'rgba(30,25,20,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 30 * s); c.lineTo(x, 0); c.stroke();
    const blobs = []; for (let i = 0; i < 8; i++) blobs.push([x + (R() - 0.5) * 70 * s, y + (R() - 0.5) * 30 * s - i * 2 * s, (16 + R() * 16) * s]);
    for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx + 3, by + 4, br, 0, TAU); c.fillStyle = 'rgba(30,20,10,0.18)'; c.fill(); }
    for (const [bx, by, br] of blobs) {
      const g = c.createRadialGradient(bx - br * 0.4, by - br * 0.5, 1, bx, by, br);
      g.addColorStop(0, '#f6f0e2'); g.addColorStop(0.7, '#e3dac4'); g.addColorStop(1, '#bdb29a');
      c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fillStyle = g; c.fill();
    }
    // fibres
    c.strokeStyle = 'rgba(250,246,235,0.55)'; c.lineWidth = 0.9;
    for (const [bx, by, br] of blobs) for (let k = 0; k < 6; k++) { const a = R() * TAU; c.beginPath(); c.moveTo(bx + Math.cos(a) * br * 0.9, by + Math.sin(a) * br * 0.9); c.lineTo(bx + Math.cos(a + 0.2) * br * 1.2, by + Math.sin(a + 0.2) * br * 1.2); c.stroke(); }
  }
  function puffs(t) {
    for (let i = 0; i < PUFFS.length; i++) {
      const [px, py, ps, t0] = PUFFS[i];
      if (t < t0) continue;
      const u = t - t0, s = ps * (0.15 + 0.85 * spring(u, 0.5, 13)) * (1 + 0.25 * (1 - Math.exp(-u / 1.6)));
      cotton(px + 8 * (1 - Math.exp(-u / 2)), py - 34 * (1 - Math.exp(-u / 1.6)), s, 400 + i);
    }
  }

  // ---------------------------------------------------------------- le plan d'architecte (papier + rouleaux + dessin à l'encre)
  // élévation de l'Arc de triomphe à l'encre, VRAIES proportions (45 × 50) : largeur w, origine = milieu de la base
  function arcDrawing(w) {
    const c = ctx();
    const H = w * 50 / 45, hw = w / 2;
    const ink = 'rgba(38,28,30,0.9)', inkL = 'rgba(38,28,30,0.42)';
    const lw = clamp(w / 160, 0.9, 1.9);
    const ow = w * 0.165, top = -H, base = -H * 0.055;
    const archTop = -H * 0.6, spring = archTop + ow;          // grande arche ≈ 60 % de la hauteur
    const imp = spring + H * 0.01, corn = -H * 0.665, frieze = -H * 0.635, attB = -H * 0.738, attT = -H * 0.955;
    c.lineJoin = 'round'; c.lineCap = 'round';
    // lavis
    c.fillStyle = 'rgba(160,130,90,0.13)'; c.fillRect(-hw, top, w, H);
    // ombre de l'arche (hachures) + caissons de la voûte
    c.save(); c.beginPath(); c.moveTo(-ow, 0); c.lineTo(-ow, spring); c.arc(0, spring, ow, Math.PI, TAU); c.lineTo(ow, 0); c.closePath(); c.clip();
    c.strokeStyle = inkL; c.lineWidth = 0.8; c.beginPath(); for (let k = top; k < 40; k += 3.6) { c.moveTo(-ow - 10, k); c.lineTo(ow + 10, k + ow * 0.5); } c.stroke();
    c.restore();
    c.strokeStyle = inkL; c.lineWidth = 0.7;
    for (let a = Math.PI + 0.2; a < TAU - 0.1; a += 0.3) { const r = ow * 0.86, s = Math.max(1.5, ow * 0.06); c.strokeRect(Math.cos(a) * r - s / 2, spring + Math.sin(a) * r - s / 2, s, s); }
    // ombre gravée du flanc droit
    c.save(); c.beginPath(); c.rect(hw - w * 0.07, top, w * 0.07, H); c.clip(); c.beginPath(); for (let k = top - 40; k < 40; k += 3.4) { c.moveTo(hw - w * 0.08, k); c.lineTo(hw + 2, k + w * 0.05); } c.lineWidth = 0.6; c.stroke(); c.restore();
    // contour, arche, archivolte
    c.strokeStyle = ink; c.lineWidth = lw * 1.3;
    c.beginPath();
    c.moveTo(-hw, 0); c.lineTo(-hw, attT); c.lineTo(hw, attT); c.lineTo(hw, 0);
    c.moveTo(-ow, 0); c.lineTo(-ow, spring); c.arc(0, spring, ow, Math.PI, TAU); c.lineTo(ow, 0);
    c.stroke();
    c.lineWidth = lw * 0.8;
    c.beginPath(); c.arc(0, spring, ow * 1.12, Math.PI, TAU); c.stroke();
    c.beginPath(); c.arc(0, spring, ow * 1.2, Math.PI, TAU); c.stroke();
    // clé de voûte
    c.strokeRect(-w * 0.012, archTop - ow * 0.2 - w * 0.03, w * 0.024, w * 0.034);
    // socle, impostes
    c.beginPath(); c.moveTo(-hw - w * 0.012, base); c.lineTo(-ow, base); c.moveTo(ow, base); c.lineTo(hw + w * 0.012, base); c.stroke();
    c.beginPath(); c.moveTo(-hw, imp); c.lineTo(-ow, imp); c.moveTo(ow, imp); c.lineTo(hw, imp); c.stroke();
    // entablement : frise + corniche saillante
    c.lineWidth = lw;
    c.beginPath(); c.moveTo(-hw, frieze); c.lineTo(hw, frieze); c.stroke();
    c.beginPath(); c.moveTo(-hw - w * 0.02, corn); c.lineTo(hw + w * 0.02, corn); c.lineTo(hw + w * 0.02, corn - H * 0.022); c.lineTo(-hw - w * 0.02, corn - H * 0.022); c.closePath(); c.stroke();
    c.lineWidth = lw * 0.6; c.beginPath(); for (let k = -hw; k <= hw; k += Math.max(3, w * 0.018)) { c.moveTo(k, corn); c.lineTo(k, corn + H * 0.008); } c.stroke();
    // attique : bandeau, boucliers ronds, couronnement
    c.lineWidth = lw;
    c.beginPath(); c.moveTo(-hw, attB); c.lineTo(hw, attB); c.stroke();
    c.beginPath(); c.moveTo(-hw - w * 0.012, attT); c.lineTo(hw + w * 0.012, attT); c.lineTo(hw + w * 0.012, top); c.lineTo(-hw - w * 0.012, top); c.closePath(); c.stroke();
    c.lineWidth = lw * 0.7;
    const sy = (attB + corn - H * 0.022) / 2, sr = Math.max(1.4, w * 0.016);
    for (let k = 0; k < 11; k++) { const sx = -hw + w * 0.06 + k * (w * 0.88) / 10; c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.stroke(); }
    c.strokeRect(-hw + w * 0.06, attT + (attB - attT) * 0.18, w * 0.88, (attB - attT) * 0.62);
    // piles : grands groupes sculptés (silhouettes drapées suggérées) + panneaux hauts
    for (const d of [-1, 1]) {
      const px0 = d < 0 ? -hw + w * 0.05 : ow + w * 0.05, pw = hw - ow - w * 0.1;
      const gy0 = base - H * 0.04, gh = H * 0.3;
      c.strokeStyle = inkL; c.lineWidth = lw * 0.6; c.strokeRect(px0, gy0 - gh, pw, gh);
      c.strokeStyle = ink; c.lineWidth = lw * 0.7;
      for (let k = 0; k < 3; k++) {
        const fx = px0 + pw * (0.22 + k * 0.28), fh = gh * (0.72 + 0.12 * Math.sin(k * 2 + d)), fw = pw * 0.11;
        c.beginPath();
        c.moveTo(fx - fw, gy0); c.quadraticCurveTo(fx - fw * 1.3, gy0 - fh * 0.5, fx - fw * 0.5, gy0 - fh * 0.85);
        c.lineTo(fx + fw * 0.5, gy0 - fh * 0.85); c.quadraticCurveTo(fx + fw * 1.3, gy0 - fh * 0.5, fx + fw, gy0);
        c.stroke();
        c.beginPath(); c.arc(fx, gy0 - fh * 0.92, fw * 0.45, 0, TAU); c.stroke();
        if (k !== 1) { c.beginPath(); c.moveTo(fx + fw * 0.3, gy0 - fh * 0.78); c.lineTo(fx + fw * 1.2 * (k ? 1 : -1), gy0 - fh * 1.02); c.stroke(); }
      }
      const uy = imp - H * 0.02, uh = (imp - frieze) - H * 0.05;
      c.strokeStyle = inkL; c.lineWidth = lw * 0.6; c.strokeRect(px0, uy - uh, pw, uh);
      c.beginPath(); for (let k = 1; k < 5; k++) { const fx = px0 + pw * k / 5; c.moveTo(fx, uy - 2); c.quadraticCurveTo(fx - pw * 0.04, uy - uh * 0.5, fx, uy - uh + 2); } c.stroke();
    }
    // renommées des écoinçons
    c.strokeStyle = inkL; c.lineWidth = lw * 0.6;
    for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * ow * 1.75, archTop - ow * 0.05, ow * 0.5, ow * 0.08, d * -0.4, 0, TAU); c.stroke(); }
    // ligne de sol
    c.strokeStyle = ink; c.lineWidth = lw; c.beginPath(); c.moveTo(-hw - w * 0.08, 0); c.lineTo(hw + w * 0.08, 0); c.stroke();
    // bonhomme d'échelle : TOUJOURS minuscule (taille fixe à l'écran), dans l'arche
    const bx = ow * 0.45;
    c.save(); c.translate(bx, 0);
    c.strokeStyle = ink; c.lineWidth = 0.9; c.beginPath();
    c.moveTo(-1.6, 0); c.lineTo(0, -4.5); c.lineTo(1.6, 0); c.moveTo(0, -4.5); c.lineTo(0, -9); c.moveTo(-2, -8); c.lineTo(0, -7); c.lineTo(2, -8);
    c.stroke(); c.beginPath(); c.arc(0, -10.6, 1.4, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(-2.8, -11.8); c.quadraticCurveTo(0, -14.6, 2.8, -11.8); c.closePath(); c.fillStyle = ink; c.fill();
    c.restore();
  }
  // la feuille : se déplie par à-coups en largeur ET en hauteur ; plis des pliages précédents visibles
  const SIZES = [[160, 182], [272, 306], [388, 432], [500, 552]];
  function sheetSize(t) {
    let W = 0, L = 0;
    if (t > E.unroll0) { const k = spring(t - E.unroll0, 0.5, 12); W = SIZES[0][0] * clamp(0.25 + 0.75 * k, 0, 1.2); L = SIZES[0][1] * k; }
    [E.up1, E.up2, E.up3].forEach((t0, i) => { if (t > t0) { const k = spring(t - t0, 0.42, 15); W += (SIZES[i + 1][0] - SIZES[i][0]) * k; L += (SIZES[i + 1][1] - SIZES[i][1]) * k; } });
    let n = 0; for (const t0 of [E.up1, E.up2, E.up3]) if (t > t0) n++;
    return { W, L, n };
  }
  function batten(x, y, w) {
    const c = ctx();
    const g = c.createLinearGradient(0, y - 6, 0, y + 6); g.addColorStop(0, '#6e4a2a'); g.addColorStop(0.4, '#c8a06a'); g.addColorStop(1, '#4e321b');
    c.fillStyle = 'rgba(15,8,4,0.35)'; c.fillRect(x - w / 2 + 3, y - 4, w, 12);
    c.fillStyle = g; c.fillRect(x - w / 2, y - 6, w, 12);
    for (const d of [-1, 1]) { c.beginPath(); c.arc(x + d * w / 2, y, 6, 0, TAU); c.fillStyle = M.P.or; c.fill(); c.strokeStyle = 'rgba(40,25,5,0.7)'; c.lineWidth = 1; c.stroke(); }
  }
  function sheet(bx, by, rot, t) {
    const c = ctx(), { W, L, n } = sheetSize(t);
    if (L < 6) { batten(bx, by, 150); return; }
    c.save(); c.translate(bx, by); c.rotate(rot);
    // fils des cintres (dès que la feuille se déplie vers le haut)
    if (n > 0) { c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3; c.beginPath(); for (const d of [-1, 1]) { c.moveTo(d * W * 0.42, -L); c.lineTo(d * W * 0.42, -L - 1200); } c.stroke(); }
    c.fillStyle = 'rgba(15,8,4,0.22)'; c.fillRect(-W / 2 + 14, -L + 8, W, L);
    c.beginPath(); c.rect(-W / 2, -L, W, L); c.fillStyle = '#e8dcbf'; c.fill();
    c.save(); c.clip();
    // l'arc redessiné en proportion, qui grandit avec la feuille
    const dw = Math.min(W * 0.8, (L - 46) * 0.86 * 45 / 50);
    c.save(); c.translate(0, -22); arcDrawing(Math.max(30, dw)); c.restore();
    // plis des pliages précédents (la feuille était pliée en quatre, puis en huit…)
    c.lineWidth = 1.2;
    for (let i = 0; i < n; i++) {
      const [pw, pl] = SIZES[i];
      for (const d of [-1, 1]) { c.strokeStyle = 'rgba(90,60,30,0.28)'; c.beginPath(); c.moveTo(d * pw / 2, 0); c.lineTo(d * pw / 2, -L); c.stroke(); c.strokeStyle = 'rgba(255,250,235,0.35)'; c.beginPath(); c.moveTo(d * pw / 2 + 1.5, 0); c.lineTo(d * pw / 2 + 1.5, -L); c.stroke(); }
      c.strokeStyle = 'rgba(90,60,30,0.28)'; c.beginPath(); c.moveTo(-W / 2, -pl); c.lineTo(W / 2, -pl); c.stroke();
    }
    const g = c.createLinearGradient(-W / 2, 0, W / 2, 0); g.addColorStop(0, 'rgba(90,60,30,0.2)'); g.addColorStop(0.15, 'rgba(255,250,235,0)'); g.addColorStop(0.85, 'rgba(255,250,235,0)'); g.addColorStop(1, 'rgba(90,60,30,0.24)');
    c.fillStyle = g; c.fillRect(-W / 2, -L, W, L);
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.7; c.fillStyle = M.tex.paperPat; c.fillRect(-W / 2, -L, W, L);
    c.restore();
    c.strokeStyle = 'rgba(60,40,20,0.6)'; c.lineWidth = 1.4; c.strokeRect(-W / 2, -L, W, L);
    batten(0, -L, W + 14);
    batten(0, 0, W + 14);
    c.restore();
  }

  // ---------------------------------------------------------------- poses de Napoléon
  function napPose(t) {
    const p = { tuck: true, handF: 'open', dy: Math.sin(t * 2.0) * 1.2, tilt: 0, ang: { armF_up: 0.18, armF_lo: -1.85, armB_up: 0.35, armB_lo: -0.4, head: -0.05 }, face: { brow: 'frown', mouth: 'n' } };
    const A = p.ang;
    // poing levé (« triompher »)
    const ant = smooth(E.fist0, E.fist0 + 0.18, t) * (1 - smooth(E.fist0 + 0.18, E.fist, t));
    p.dy += 8 * ant;
    const up = clamp(spring(t - (E.fist - 0.1), 0.5, 13)) * (t > E.fist - 0.1 ? 1 : 0);
    const down = smooth(E.fistDown, E.fistDown + 0.35, t);
    const kf = Math.max(0, Math.min(1.08, spring(t - (E.fist - 0.1), 0.5, 13))) * (t > E.fist - 0.1 ? 1 : 0) * (1 - down);
    if (kf > 0.02) {
      p.tuck = kf < 0.35 && t < E.fist; p.handF = 'fist';
      if (kf >= 0.35) p.tuck = false;
      A.armF_up = lerp(0.18, -2.45, kf); A.armF_lo = lerp(-1.85, -0.45, kf);
      A.head = lerp(-0.05, -0.12, kf); p.face = { brow: 'frown', mouth: 'smile' };
      p.tilt = -0.03 * kf;
    }
    void up;
    // bras grands ouverts (« géant » : plus grand !)
    const kw = smooth(E.wide0, E.wide1, t) * (1 - smooth(E.armsDown0, E.armsDown1, t));
    const kwo = kw + wob(t, E.wide1, 0.06, 2.2, 6) * (t < E.armsDown0 ? 1 : 0);
    if (kw > 0.01) {
      p.tuck = kw < 0.3 && t < E.wide1 ? true : false; p.handF = 'open';
      A.armF_up = lerp(0.18, -1.75, kwo); A.armF_lo = lerp(-1.85, -0.35, kwo);
      A.armB_up = lerp(0.35, 1.75, kwo); A.armB_lo = lerp(-0.4, -0.15, kwo);
      A.head = lerp(-0.05, -0.16, kw); p.face = { brow: 'up', eyes: 'wide', mouth: 'o' };
      p.dy -= 6 * kw;
    }
    // il regarde le plan monter, ravi
    const look = smooth(E.up1, E.up1 + 0.4, t) * (1 - smooth(E.nod0 - 0.1, E.nod0 + 0.2, t));
    if (t > E.armsDown0) {
      const kr = smooth(E.armsDown0, E.armsDown1, t);
      // bras le long du corps, mains ouvertes (pose de profil, satisfait)
      if (kw < 0.3) { p.tuck = false; A.armF_up = lerp(A.armF_up, 0.08, kr); A.armF_lo = lerp(A.armF_lo, -0.25, kr); A.armB_up = lerp(A.armB_up, 0.25, kr); A.armB_lo = lerp(A.armB_lo, -0.3, kr); }
      p.face = { brow: 'up', mouth: 'smile', eyes: 'open' };
    }
    A.head += -0.2 * look;
    // hochements (« célébrer ses victoires »)
    if (t > E.nod0 && t < E.modest0) {
      const u = (t - E.nod0) / (E.nod1 - E.nod0);
      A.head += 0.13 * Math.max(0, Math.sin(clamp(u) * Math.PI * 2)) ;
      p.face = { brow: 'n', mouth: 'smile', eyes: 'open' };
      p.dy += 3 * Math.max(0, Math.sin(clamp(u) * Math.PI * 2));
    }
    // « Modestement » : main dans le gilet, menton levé, yeux mi-clos
    if (t > E.modest0) {
      const km = smooth(E.modest0, E.modest1, t), kb = spring(t - E.modest0, 0.55, 14);
      p.tuck = km > 0.35;
      A.armF_up = lerp(0.08, 0.18, km); A.armF_lo = lerp(-0.25, -1.85, km);
      A.armB_up = 0.25; A.armB_lo = -0.3;
      A.head = lerp(-0.05, -0.3, Math.min(1.08, kb));
      p.tilt = -0.045 * Math.min(1.05, kb);
      p.dy -= 5 * km;
      p.face = { brow: 'n', mouth: 'smile', eyes: km > 0.3 ? 'half' : 'open' };
    }
    return p;
  }

  // ---------------------------------------------------------------- l'architecte
  function arX(t) {
    const u = clamp((t - E.ar0) / (E.ar1 - E.ar0));
    const v = u < 0.15 ? u * u / 0.3 : u > 0.85 ? 1 - (1 - u) * (1 - u) / 0.3 : (u - 0.075) / 0.85;
    return lerp(1190, ARX, v);
  }
  // position du rouleau du bas (tenu à deux mains)
  function rollPos(t) {
    const hold = smooth(E.hold0 - 0.1, E.hold0 + 0.08, t), lift = smooth(E.lift0, E.lift1, t);
    const lb = wob(t, E.lift1, -10, 2.4, 6);
    let rise = 0;
    for (const t0 of [E.up1, E.up2, E.up3]) rise += wob(t, t0, -6, 3, 7);
    return { x: lerp(652, 640, lift), y: lerp(1128, 862, lift) + lb + rise, rot: wob(t, E.lift1, 0.03, 1.4, 4) + 0.012 * Math.sin(t * 1.7) * lift, hold };
  }

  S.draw = (t) => {
    const c = ctx();
    c.drawImage(K.sky, 0, 0);
    M.hung(K.cloud1, 330, 420, t, { amp: 0.02, cast });
    M.hung(K.cloud2, 820, 330, t, { ph: 2, amp: 0.025, cast });
    // soleil (derrière les collines)
    const su = easeOut((t - E.sun0) / (E.sun1 - E.sun0));
    if (t > E.sun0 - 0.05) sunGold(292, lerp(1400, 585, su) + wob(t, E.sun1, -8, 2.2, 5), 78, t);
    // bandes de colline qui montent de la trappe
    const rowY = (t0, h) => ST.back + (1 - easeOut((t - t0) / 0.7)) * (h + 30) + wob(t, t0 + 0.7, -5, 2.5, 6);
    M.flat(K.far, 540, rowY(E.rows0, 380), { clipY: ST.back + 1, cast: { dx: 14, dy: 6, a: 0.3 } });
    M.flat(K.gauze, 540 + Math.sin(t * 0.35) * 40, ST.back - 250, { alpha: 0.9 });
    puffs(t);
    M.flat(K.mid, 540, rowY(E.rows0 + 0.2, 260), { clipY: ST.back + 1, cast: { dx: 14, dy: 6, a: 0.3 } });
    M.flat(K.gauze, 560 - Math.sin(t * 0.3 + 1) * 50, ST.back - 110, { alpha: 0.75 });
    M.flat(K.wingL, 120, ST.back, { rot: 0.006 * Math.sin(t * 0.9), cast });
    M.flat(K.wingR, 960, ST.back, { rot: 0.006 * Math.sin(t * 0.8 + 1), cast });
    M.flat(K.front, 540, rowY(E.rows0 + 0.4, 170), { clipY: ST.back + 1, cast: { dx: 14, dy: 6, a: 0.3 } });
    M.drawFloor();

    // ---- le plan (derrière l'architecte, les mains passent devant le rouleau)
    const ax = arX(t);
    const rp = rollPos(t);
    let paperRot = rp.rot; for (const t0 of [E.up1, E.up2, E.up3]) paperRot += wob(t, t0 + 0.05, 0.012, 1.6, 4);
    if (t > E.hold0 - 0.1) {
      // pendant le geste de présentation, le rouleau arrive de la main de l'architecte
      const hx = lerp(ax - 70, rp.x, rp.hold), hy = lerp(1170, rp.y, rp.hold);
      sheet(hx, hy, paperRot, t);
    }

    // ---- l'architecte (fente arrière)
    const arPose = { ang: { armB_up: 0.25, armB_lo: -0.7 }, face: { brow: 'worry', mouth: 'n' }, dy: Math.sin(t * 1.9) * 1.2 };
    const moving = t > E.ar0 && t < E.ar1 + 0.05;
    if (moving) {
      const ph = (t - E.ar0) * 2.6, env = smooth(E.ar0, E.ar0 + 0.15, t) * (1 - smooth(E.ar1 - 0.15, E.ar1 + 0.05, t));
      arPose.dy += -Math.abs(Math.sin(Math.PI * ph)) * 10 * env; arPose.tilt = 0.04 * env;
      arPose.ang.legF = Math.sin(Math.PI * ph) * 0.2 * env; arPose.ang.legB = -arPose.ang.legF;
    }
    const bow = smooth(E.bow, E.bow + 0.15, t) * (1 - smooth(E.bow + 0.2, E.bow + 0.4, t));
    arPose.tilt = (arPose.tilt || 0) + 0.14 * bow; arPose.ang.head = 0.25 * bow;
    if (t > E.hold0 - 0.1) {
      arPose.hide = { plan: 1 };
      for (const [arm, dx] of [['armF', 34], ['armB', 64]]) {
        const sol = M.ik(C.architecte, arPose, ax, FEETB, ARS, -1, arm, [rp.x + dx, rp.y + 6], 1);
        const k = rp.hold;
        const base = arm === 'armF' ? [0.05, -0.15] : [0.25, -0.7];
        arPose.ang[arm + '_up'] = lerp(base[0], sol.up, k); arPose.ang[arm + '_lo'] = lerp(base[1], sol.lo, k);
      }
      arPose.handF = 'fist';
      arPose.face = { brow: 'worry', mouth: t > E.unroll1 && t < E.lift0 ? 'smile' : 'tight' };
      const lift = smooth(E.lift0, E.lift1, t);
      arPose.ang.head = lerp(0, -0.22, lift) + 0.25 * bow;
      // chaque à-coup du papier soulève un peu l'architecte sur sa tige
      for (const t0 of [E.up1, E.up2, E.up3]) arPose.dy += -14 * Math.max(0, wob(t, t0, 1, 1.4, 5)) ;
      if (t > E.up1) arPose.face = { brow: 'worry', mouth: 'o', eyes: 'wide' };
      if (t > E.nod0) arPose.face = { brow: 'worry', mouth: 'tight', eyes: 'open' };
      if (t > E.modest0) { arPose.face = { brow: 'worry', mouth: 'tight', eyes: 'open' }; arPose.ang.head = -0.22 + 0.08 * smooth(E.modest0, E.modest0 + 0.3, t); }
    }
    const arR = M.puppet(C.architecte, arPose, ax, FEETB, ARS, { dir: -1, slot: ST.slotB, cast });
    // gouttes de sueur
    if (t > E.sweat0) {
      const hp = (lx, ly) => arR.w('head', lx, ly);
      const drops = [[E.sweat0, -2, -74, 0], [E.sweat0 + 0.12, -16, -66, 1]];
      for (const [t0, lx, ly, i] of drops) {
        if (t < t0) continue;
        const u = clamp((t - t0) / 0.38);
        const p0 = hp(lx, ly); const pop = Math.min(1, spring(t - t0, 0.5, 18));
        const x = p0[0] + (i ? 6 : -4) * easeOut(u), y = p0[1] + 34 * easeIn(u) * (i ? 0.6 : 1);
        c.save(); c.translate(x, y); c.scale(pop, pop);
        c.beginPath(); c.moveTo(0, -11); c.quadraticCurveTo(7, 1, 0, 6); c.quadraticCurveTo(-7, 1, 0, -11); c.closePath();
        c.fillStyle = 'rgba(20,15,25,0.35)'; c.translate(1, 1.5); c.fill(); c.translate(-1, -1.5);
        c.fillStyle = '#a9bfdc'; c.fill(); c.strokeStyle = 'rgba(40,50,80,0.75)'; c.lineWidth = 1.3; c.stroke();
        c.beginPath(); c.arc(-1.8, -1, 1.6, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill();
        c.restore();
      }
    }

    // ---- Napoléon (fente avant)
    M.puppet(C.napoleon, napPose(t), NAPX, FEET, 1, { dir: 1, slot: ST.slotF, cast });

    // lumière : la poursuite se resserre doucement sur Napoléon pour « Modestement »
    const ks = smooth(E.modest0, E.modest1 + 0.1, t);
    M.stageLight(t, { spot: { x: lerp(560, 470, ks), y: lerp(1040, 1060, ks), r: lerp(500, 400, ks), a: lerp(0.38, 0.5, ks) } });
    const cs = curtainState(t);
    M.curtain(t, cs.f, { swing: cs.swing });
    M.drawFrame(t);
  };
  return S;
})();
