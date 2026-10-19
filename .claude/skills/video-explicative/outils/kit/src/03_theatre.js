
// =====================================================================
// LE THÉÂTRE : cadre de scène, lambrequin, plancher, rideau, rampe, lumière
// =====================================================================
const ST = { L: 46, R: 1034, top: 150, back: 1395, slotB: 1410, slotF: 1450, front: 1640 };
M.ST = ST;

function woodGrain(x, x0, y0, w, h, seed, dark = 0.18) {
  const R = rng(seed);
  x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
  for (let i = 0; i < w * h / 900; i++) {
    const yy = y0 + R() * h, xx = x0 + R() * w, l = 40 + R() * 160;
    x.strokeStyle = R() < 0.5 ? `rgba(0,0,0,${dark * R()})` : `rgba(140,90,50,${0.12 * R()})`;
    x.lineWidth = 0.6 + R() * 1.4; x.beginPath(); x.moveTo(xx, yy);
    x.bezierCurveTo(xx + l * 0.3, yy + (R() - 0.5) * 6, xx + l * 0.6, yy + (R() - 0.5) * 6, xx + l, yy + (R() - 0.5) * 4); x.stroke();
  }
  x.restore();
}
function woodGrainV(x, x0, y0, w, h, seed) {
  x.save(); x.translate(x0 + w, y0); x.rotate(Math.PI / 2); woodGrain(x, 0, 0, h, w, seed); x.restore();
}
function goldGrad(x, y0, y1) {
  const g2 = x.createLinearGradient(0, y0, 0, y1);
  g2.addColorStop(0, '#5f4519'); g2.addColorStop(0.3, '#d6b46a'); g2.addColorStop(0.5, '#f0d793'); g2.addColorStop(0.7, '#a7823b'); g2.addColorStop(1, '#4a3412');
  return g2;
}
function goldGradH(x, x0, x1) {
  const g2 = x.createLinearGradient(x0, 0, x1, 0);
  g2.addColorStop(0, '#5f4519'); g2.addColorStop(0.3, '#d6b46a'); g2.addColorStop(0.5, '#f0d793'); g2.addColorStop(0.7, '#a7823b'); g2.addColorStop(1, '#4a3412');
  return g2;
}
function goldLeaves(x, cx, cy, len, seed) {
  // guirlande de laurier dorée horizontale, rosette au centre
  x.save(); x.translate(cx, cy);
  x.strokeStyle = '#8d6a2c'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-len, 0); x.quadraticCurveTo(0, 10, len, 0); x.stroke();
  for (let k = -len + 10; k < len - 6; k += 13) {
    const yy = 5 * (1 - (k / len) * (k / len)) * 2;
    for (const sd of [-1, 1]) {
      x.save(); x.translate(k, yy); x.rotate(sd * 0.7 + (k < 0 ? 0.25 : -0.25));
      x.beginPath(); x.ellipse(0, -sd * 7, 3.2, 8, 0, 0, TAU); x.fillStyle = sd > 0 ? '#c9a556' : '#a7823b'; x.fill();
      x.strokeStyle = 'rgba(40,25,5,0.6)'; x.lineWidth = 0.8; x.stroke(); x.restore();
    }
  }
  x.beginPath(); x.arc(0, 4, 11, 0, TAU); x.fillStyle = goldGradH(x, -11, 11); x.fill();
  for (let k = 0; k < 8; k++) { x.beginPath(); x.arc(Math.cos(k * TAU / 8) * 7, 4 + Math.sin(k * TAU / 8) * 7, 3, 0, TAU); x.fillStyle = k % 2 ? '#e8cf8a' : '#8d6a2c'; x.fill(); }
  x.beginPath(); x.arc(0, 4, 3.5, 0, TAU); x.fillStyle = '#5f4519'; x.fill();
  x.restore();
}
function goldScroll(x, cx, cy, r, dir, seed) {
  // volute d'acanthe dorée (sculpture)
  x.save(); x.translate(cx, cy); x.scale(dir, 1);
  x.lineCap = 'round';
  for (const [lw, col] of [[7, 'rgba(20,10,0,0.6)'], [5, '#b48f45'], [1.6, '#f1dc9c']]) {
    x.strokeStyle = col; x.lineWidth = lw; x.beginPath();
    for (let a = 0; a < 4.6; a += 0.1) { const rr = r * (1 - a / 6); const px = Math.cos(a) * rr - a * r * 0.35, py = Math.sin(a) * rr; a === 0 ? x.moveTo(px, py) : x.lineTo(px, py); }
    x.stroke();
    x.beginPath(); x.moveTo(-r * 1.6, 0); x.quadraticCurveTo(-r * 2.4, -r * 0.9, -r * 3.4, -r * 0.2); x.stroke();
    x.beginPath(); x.moveTo(-r * 1.6, r * 0.2); x.quadraticCurveTo(-r * 2.6, r * 1.0, -r * 3.6, r * 0.5); x.stroke();
  }
  x.restore();
}

function makeProscenium() {
  return pre(W, H, (x) => {
    x.fillStyle = '#21140c'; x.fillRect(0, 0, W, H);
    woodGrain(x, 0, 0, W, 150, 11, 0.28); woodGrain(x, 0, ST.front, W, H - ST.front, 12, 0.28);
    woodGrainV(x, 0, 150, ST.L, ST.front - 150, 13); woodGrainV(x, ST.R, 150, W - ST.R, ST.front - 150, 14);
    // trou de scène
    x.globalCompositeOperation = 'destination-out'; x.fillRect(ST.L, 100, ST.R - ST.L, ST.front - 100); x.globalCompositeOperation = 'source-over';
    // ---- fronton sculpté (haut)
    x.fillStyle = goldGrad(x, 8, 22); x.fillRect(0, 8, W, 14);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, 22, W, 4);
    x.fillStyle = goldGrad(x, 104, 118); x.fillRect(0, 104, W, 14);
    for (let i = 0; i < 46; i++) { const cx = 12 + i * 23.5; x.beginPath(); x.arc(cx, 111, 4, 0, TAU); x.fillStyle = '#2b1a0c'; x.fill(); x.beginPath(); x.arc(cx - 1, 110, 2.6, 0, TAU); x.fillStyle = '#e2c47c'; x.fill(); }
    for (const cx of [300, 780]) goldLeaves(x, cx, 60, 150, cx);
    // cartouche central (coquille, sans inscription)
    x.save(); x.translate(540, 62);
    for (let k = -6; k <= 6; k++) { x.save(); x.rotate(k * 0.2); x.beginPath(); x.moveTo(0, 26); x.quadraticCurveTo(-6, -10, 0, -44); x.quadraticCurveTo(6, -10, 0, 26); x.fillStyle = k % 2 ? '#a07c36' : '#d8b96f'; x.fill(); x.strokeStyle = 'rgba(40,20,0,0.6)'; x.lineWidth = 1; x.stroke(); x.restore(); }
    x.beginPath(); x.ellipse(0, 28, 26, 9, 0, 0, TAU); x.fillStyle = goldGradH(x, -26, 26); x.fill();
    x.restore();
    // ---- pilastres latéraux
    for (const [x0, x1] of [[0, ST.L], [ST.R, W]]) {
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(x0 + 8, 130, x1 - x0 - 16, ST.front - 130);
      for (let k = 0; k < 3; k++) { const fx = x0 + 12 + k * (x1 - x0 - 24) / 2; x.fillStyle = goldGradH(x, fx - 2, fx + 2); x.fillRect(fx - 1.5, 160, 3, ST.front - 200); }
    }
    // baguette dorée autour de l'ouverture
    x.lineWidth = 9; x.strokeStyle = goldGradH(x, ST.L - 10, ST.L + 2); x.beginPath(); x.moveTo(ST.L - 4, 120); x.lineTo(ST.L - 4, ST.front); x.stroke();
    x.strokeStyle = goldGradH(x, ST.R - 2, ST.R + 10); x.beginPath(); x.moveTo(ST.R + 4, 120); x.lineTo(ST.R + 4, ST.front); x.stroke();
    // ---- avant-scène (bas)
    x.fillStyle = goldGrad(x, ST.front, ST.front + 16); x.fillRect(0, ST.front, W, 16);
    x.fillStyle = '#120a05'; x.fillRect(0, ST.front + 16, W, 46);           // auge de la rampe
    x.fillStyle = goldGrad(x, ST.front + 62, ST.front + 74); x.fillRect(0, ST.front + 62, W, 12);
    for (const [px, pw] of [[70, 280], [400, 280], [730, 280]]) {
      x.strokeStyle = '#a7823b'; x.lineWidth = 4; x.strokeRect(px, ST.front + 100, pw, 130);
      x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 2; x.strokeRect(px + 8, ST.front + 108, pw - 16, 114);
      goldLeaves(x, px + pw / 2, ST.front + 162, 100, px);
    }
  });
}
// coquille du souffleur (au centre de la rampe)
function makePrompter() {
  return pre(240, 110, (x) => {
    x.translate(120, 100);
    x.beginPath(); x.ellipse(0, 0, 96, 70, 0, Math.PI, TAU); x.closePath(); x.fillStyle = '#2a190d'; x.fill();
    for (let k = -5; k <= 5; k++) { x.save(); x.rotate(k * 0.26); x.beginPath(); x.moveTo(0, 0); x.lineTo(-9, -72); x.quadraticCurveTo(0, -80, 9, -72); x.closePath(); x.fillStyle = k % 2 ? '#3b2414' : '#4c2f1a'; x.fill(); x.restore(); }
    x.lineWidth = 6; x.strokeStyle = goldGradH(x, -96, 96); x.beginPath(); x.ellipse(0, 0, 96, 70, 0, Math.PI, TAU); x.stroke();
    x.fillStyle = '#050302'; x.beginPath(); x.ellipse(0, 0, 60, 26, 0, Math.PI, TAU); x.fill();
  });
}

// lambrequin de velours (haut), festons + franges + glands
function makePelmet() {
  return pre(W, 330, (x) => {
    const L = ST.L - 6, R = ST.R + 6, top = 96, band = 196;
    const vg = (x0, x1) => { const gr = x.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, P.veloursD); gr.addColorStop(0.5, P.veloursL); gr.addColorStop(1, P.veloursD); return gr; };
    // bandeau
    x.fillStyle = P.velours; x.fillRect(L, top, R - L, band - top);
    for (let i = 0; i < 26; i++) { const x0 = L + i * (R - L) / 26; x.fillStyle = vg(x0, x0 + (R - L) / 26); x.globalAlpha = 0.55; x.fillRect(x0, top, (R - L) / 26, band - top); }
    x.globalAlpha = 1;
    x.fillStyle = goldGrad(x, band - 10, band); x.fillRect(L, band - 10, R - L, 10);
    // festons
    const n = 4, sw = (R - L) / n;
    for (let i = 0; i < n; i++) {
      const x0 = L + i * sw, x1 = x0 + sw, cx = (x0 + x1) / 2;
      x.beginPath(); x.moveTo(x0, band - 4); x.quadraticCurveTo(cx, band + 120, x1, band - 4); x.closePath();
      const gr = x.createLinearGradient(0, band, 0, band + 70); gr.addColorStop(0, P.veloursD); gr.addColorStop(0.5, P.veloursL); gr.addColorStop(1, P.velours);
      x.fillStyle = gr; x.fill();
      x.save(); x.clip();
      for (let k = 1; k < 5; k++) { x.strokeStyle = `rgba(20,0,2,${0.35})`; x.lineWidth = 3; x.beginPath(); x.moveTo(x0 + 6, band); x.quadraticCurveTo(cx, band + 18 + k * 22, x1 - 6, band); x.stroke(); x.strokeStyle = 'rgba(230,120,110,0.12)'; x.lineWidth = 2; x.beginPath(); x.moveTo(x0 + 6, band + 4); x.quadraticCurveTo(cx, band + 26 + k * 22, x1 - 6, band + 4); x.stroke(); }
      x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.velvetPat; x.fillRect(x0, band - 10, sw, 140);
      x.restore();
      // galon + franges dorées
      x.lineWidth = 5; x.strokeStyle = '#b48f45'; x.beginPath(); x.moveTo(x0, band - 2); x.quadraticCurveTo(cx, band + 116, x1, band - 2); x.stroke();
      for (let u = 0.02; u < 0.98; u += 0.012) {
        const px = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, py = (1 - u) * (1 - u) * (band - 2) + 2 * (1 - u) * u * (band + 116) + u * u * (band - 2);
        x.strokeStyle = u * 100 % 2 < 1 ? '#c9a556' : '#8d6a2c'; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py + 15); x.stroke();
      }
    }
    // glands aux jonctions
    for (let i = 0; i <= n; i++) {
      const gx = L + i * sw + (i === 0 ? 14 : i === n ? -14 : 0);
      x.strokeStyle = '#b48f45'; x.lineWidth = 3; x.beginPath(); x.moveTo(gx, band - 4); x.lineTo(gx, band + 40); x.stroke();
      x.beginPath(); x.ellipse(gx, band + 46, 9, 11, 0, 0, TAU); x.fillStyle = goldGradH(x, gx - 9, gx + 9); x.fill();
      x.beginPath(); x.moveTo(gx - 8, band + 54); x.lineTo(gx - 14, band + 96); x.lineTo(gx + 14, band + 96); x.lineTo(gx + 8, band + 54); x.closePath(); x.fillStyle = '#a7823b'; x.fill();
      for (let k = -12; k <= 12; k += 3) { x.strokeStyle = k % 2 ? '#e0c47e' : '#6e5221'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(gx + k * 0.6, band + 56); x.lineTo(gx + k, band + 96); x.stroke(); }
    }
    x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.velvetPat; x.fillRect(L, top, R - L, band - top);
  });
}

function makeFloor() {
  const y0 = ST.back, y1 = ST.front + 10, h = y1 - y0;
  return pre(W, h, (x) => {
    const vx = 540, vy = 520 - y0; // point de fuite (repère local)
    const k = (h - vy) / (0 - vy);
    const R = rng(91);
    // lattes
    const n = 30, bw = (ST.R - ST.L + 200) / n;
    for (let i = 0; i < n; i++) {
      const xb0 = ST.L - 100 + i * bw, xb1 = xb0 + bw;
      const xf0 = vx + (xb0 - vx) * k, xf1 = vx + (xb1 - vx) * k;
      const v = R();
      x.beginPath(); x.moveTo(xb0, 0); x.lineTo(xb1, 0); x.lineTo(xf1, h); x.lineTo(xf0, h); x.closePath();
      x.fillStyle = `rgb(${Math.round(92 + v * 22)},${Math.round(62 + v * 16)},${Math.round(38 + v * 10)})`; x.fill();
      x.save(); x.clip(); woodGrainV(x, Math.min(xb0, xf0), 0, Math.abs(xf1 - xf0) + bw, h, 200 + i);
      // joints transversaux décalés
      for (let j = 0; j < 3; j++) { const yy = (R() * 0.9 + 0.05) * h; x.fillStyle = 'rgba(20,10,4,0.55)'; x.fillRect(Math.min(xb0, xf0) - 10, yy, Math.abs(xf1 - xf0) + bw + 20, 1.6); }
      x.restore();
      x.strokeStyle = 'rgba(18,9,3,0.75)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(xb0, 0); x.lineTo(xf0, h); x.stroke();
    }
    // ombre vers le fond, lumière de rampe vers l'avant
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(10,5,2,0.62)'); gr.addColorStop(0.45, 'rgba(10,5,2,0.18)'); gr.addColorStop(1, 'rgba(255,190,110,0.10)');
    x.fillStyle = gr; x.fillRect(0, 0, W, h);
    // fentes des marionnettes (deux rainures)
    for (const sy of [ST.slotB - y0, ST.slotF - y0]) {
      x.fillStyle = 'rgba(5,2,0,0.85)'; x.fillRect(0, sy - 2.5, W, 5);
      x.fillStyle = 'rgba(210,160,100,0.25)'; x.fillRect(0, sy + 2.5, W, 1.5);
    }
    // bord arrière (trappe des décors)
    x.fillStyle = 'rgba(0,0,0,0.85)'; x.fillRect(0, 0, W, 5);
  });
}

// ---------------------------------------------------------------- rideau
M.curtain = function (t, f, o = {}) {
  const top = 160, bot = ST.front + 6;
  const swing = o.swing || 0;
  for (const side of [-1, 1]) {
    const w = lerp(520, o.openW || 74, clamp(f));
    const x0 = side < 0 ? ST.L - 12 : ST.R + 12 - w;
    const n = 12, fw = w / n;
    for (let i = 0; i < n; i++) {
      const xl = x0 + i * fw, xr = xl + fw + 0.8;
      const lead = side < 0 ? i / (n - 1) : 1 - i / (n - 1);    // 1 = bord intérieur
      const dx = swing * side * lead * 0.6;
      const sag = Math.sin(i * 1.7 + 0.5) * 6 + 8;
      c.beginPath(); c.moveTo(xl, top); c.lineTo(xr, top);
      c.quadraticCurveTo(xr + dx * 0.3, (top + bot) / 2, xr + dx, bot - sag * 0.3);
      c.lineTo(xl + dx, bot + sag * 0.5);
      c.quadraticCurveTo(xl + dx * 0.3, (top + bot) / 2, xl, top); c.closePath();
      const gr = c.createLinearGradient(xl, 0, xr, 0);
      gr.addColorStop(0, P.veloursD); gr.addColorStop(0.3, P.velours); gr.addColorStop(0.58, P.veloursL); gr.addColorStop(0.8, P.velours); gr.addColorStop(1, '#3a070a');
      c.fillStyle = gr; c.fill();
    }
    // texture + volume vertical
    c.save(); c.beginPath(); c.rect(x0 - 40, top, w + 80, bot - top + 30); c.clip();
    c.globalCompositeOperation = 'multiply'; c.fillStyle = M.tex.velvetPat; c.fillRect(x0 - 40, top, w + 80, bot - top + 30);
    const vg = c.createLinearGradient(0, top, 0, bot); vg.addColorStop(0, 'rgba(20,0,0,0.7)'); vg.addColorStop(0.25, 'rgba(255,255,255,0)'); vg.addColorStop(0.8, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(20,0,0,0.5)');
    c.fillStyle = vg; c.fillRect(x0 - 40, top, w + 80, bot - top + 30);
    c.restore();
    // galon doré du bord intérieur
    const ex = side < 0 ? x0 + w : x0, edx = swing * side * 0.6;
    c.beginPath(); c.moveTo(ex - 7 * side, top); c.quadraticCurveTo(ex - 7 * side + edx * 0.3, (top + bot) / 2, ex - 7 * side + edx, bot); c.lineTo(ex - 18 * side + edx, bot); c.quadraticCurveTo(ex - 18 * side + edx * 0.3, (top + bot) / 2, ex - 18 * side, top); c.closePath();
    c.fillStyle = '#9c7a35'; c.fill();
    c.strokeStyle = 'rgba(250,225,150,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ex - 11 * side, top); c.quadraticCurveTo(ex - 11 * side + edx * 0.3, (top + bot) / 2, ex - 11 * side + edx, bot); c.stroke();
    // frange
    c.strokeStyle = '#b48f45'; c.lineWidth = 2;
    c.beginPath();
    for (let xx = x0; xx < x0 + w; xx += 5) { const lead = side < 0 ? (xx - x0) / w : 1 - (xx - x0) / w; const ddx = swing * side * lead * 0.6; c.moveTo(xx + ddx, bot - 4); c.lineTo(xx + ddx + 0.5, bot + 12); }
    c.stroke();
  }
};

// ---------------------------------------------------------------- rampe (lampes à huile)
M.footlights = function (t) {
  t = TG(t);
  const y = ST.front + 34;
  for (let i = 0; i < 9; i++) {
    const x = 100 + i * 110; if (Math.abs(x - 540) < 80) continue;
    const fl = 1 + 0.12 * noise(t * 7 + i * 3.3, i) + 0.05 * Math.sin(t * 23 + i);
    // réflecteur en fer-blanc
    c.beginPath(); c.ellipse(x, y + 6, 24, 18, 0, Math.PI, TAU); c.fillStyle = '#3a3530'; c.fill();
    const rg = c.createLinearGradient(x - 24, 0, x + 24, 0); rg.addColorStop(0, '#2a2622'); rg.addColorStop(0.5, '#b8ad97'); rg.addColorStop(1, '#2a2622');
    c.beginPath(); c.ellipse(x, y + 6, 20, 14, 0, Math.PI, TAU); c.fillStyle = rg; c.fill();
    // flamme
    c.save(); c.translate(x, y + 2); c.scale(1, fl);
    c.beginPath(); c.moveTo(0, -18); c.quadraticCurveTo(7, -6, 4, 0); c.quadraticCurveTo(0, 4, -4, 0); c.quadraticCurveTo(-7, -6, 0, -18);
    const fg = c.createLinearGradient(0, -18, 0, 2); fg.addColorStop(0, 'rgba(255,240,190,0.9)'); fg.addColorStop(0.6, '#ffc35c'); fg.addColorStop(1, '#d4652a');
    c.fillStyle = fg; c.fill(); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(x, y - 6, 2, x, y - 6, 60 * fl); gg.addColorStop(0, 'rgba(255,190,100,0.35)'); gg.addColorStop(1, 'rgba(255,150,60,0)');
    c.fillStyle = gg; c.fillRect(x - 70, y - 70, 140, 120); c.restore();
  }
};

// ---------------------------------------------------------------- lumière de scène
const DUST = [];
{ const R = rng(2024); for (let i = 0; i < 90; i++) DUST.push({ x: R(), y: R(), s: 0.6 + R() * 1.6, v: 0.004 + R() * 0.012, ph: R() * TAU, b: R() < 0.5 ? 0 : 1 }); }
M.stageLight = function (t, o = {}) {
  t = TG(t);
  if (o.spot === undefined) o = Object.assign({ spot: { x: 520, y: 1060, r: 470, a: 0.42 } }, o);
  const fl = 1 + 0.04 * noise(t * 5, 3);
  // faisceaux des projecteurs (depuis les cintres)
  const beams = o.beams || [[230, 120, 330, 1430, 430], [860, 120, 720, 1430, 430]];
  c.save(); c.globalCompositeOperation = 'screen';
  for (const [sx, sy, ex, ey, ew] of beams) {
    c.beginPath(); c.moveTo(sx - 20, sy); c.lineTo(sx + 20, sy); c.lineTo(ex + ew / 2, ey); c.lineTo(ex - ew / 2, ey); c.closePath();
    const gr = c.createLinearGradient(sx, sy, ex, ey); gr.addColorStop(0, `rgba(255,228,170,${0.16 * (o.beamA ?? 1)})`); gr.addColorStop(1, 'rgba(255,220,160,0)');
    c.fillStyle = gr; c.fill();
  }
  // poussière dans les faisceaux
  for (const d of DUST) {
    const b = beams[d.b % beams.length];
    const u = (d.y + t * d.v) % 1, yy = lerp(b[1] + 60, b[3] - 80, u);
    const cx = lerp(b[0], b[2], (yy - b[1]) / (b[3] - b[1])), half = lerp(20, b[4] / 2, (yy - b[1]) / (b[3] - b[1]));
    const xx = cx + (d.x * 2 - 1) * half * 0.85 + Math.sin(t * 0.7 + d.ph) * 10;
    const a = (0.25 + 0.25 * Math.sin(t * 2 + d.ph)) * (o.beamA ?? 1);
    c.beginPath(); c.arc(xx, yy, d.s, 0, TAU); c.fillStyle = `rgba(255,236,200,${a})`; c.fill();
  }
  c.restore();
  // lueur de la rampe (vers le haut)
  c.save(); c.globalCompositeOperation = 'screen';
  const fg = c.createLinearGradient(0, ST.front, 0, 900); fg.addColorStop(0, `rgba(255,170,80,${0.20 * fl})`); fg.addColorStop(1, 'rgba(255,170,80,0)');
  c.fillStyle = fg; c.fillRect(ST.L, 900, ST.R - ST.L, ST.front - 900); c.restore();
  // poursuite (spot) : assombrit hors du cercle
  if (o.spot) {
    const { x, y, r, a } = o.spot;
    c.save(); c.globalCompositeOperation = 'multiply';
    const rg = c.createRadialGradient(x, y, r * 0.75, x, y, r * 1.6);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(1, `rgba(${Math.round(255 - 205 * a)},${Math.round(255 - 215 * a)},${Math.round(255 - 200 * a)},1)`);
    c.fillStyle = rg; c.fillRect(ST.L, ST.top, ST.R - ST.L, ST.front - ST.top); c.restore();
    c.save(); c.globalCompositeOperation = 'screen';
    const sg = c.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, `rgba(255,230,180,${0.16 * a})`); sg.addColorStop(1, 'rgba(255,230,180,0)');
    c.fillStyle = sg; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
  }
};

// ---------------------------------------------------------------- composition générale
M.init = function () {
  makeTextures();
  M.makeChars();
  M.cv = { prosc: makeProscenium(), pelmet: makePelmet(), floor: makeFloor(), prompter: makePrompter() };
};
// fond → (décors) → plancher → (marionnettes) → lumière → rideau → cadre
M.drawFloor = function () { c.drawImage(M.cv.floor, 0, ST.back); };
M.drawFrame = function (t, o = {}) {
  M.footlights(t);
  c.drawImage(M.cv.prompter, 540 - 120, ST.front - 96);
  c.drawImage(M.cv.prosc, 0, 0);
  c.drawImage(M.cv.pelmet, 0, 0);
};
M.finish = function (t) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  // vignettage chaud
  c.save(); c.globalCompositeOperation = 'multiply';
  const vg = c.createRadialGradient(540, 880, 380, 540, 960, 1250);
  vg.addColorStop(0, 'rgba(255,250,240,1)'); vg.addColorStop(1, 'rgba(120,95,80,1)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.22; c.drawImage(M.tex.grain, 0, 0, W, H);
  c.restore();
};

// ---------------------------------------------------------------- décors : utilitaires
// dessine un pré-rendu (origine bas-centre) avec rotation, ondulation de toile, découpe au plancher
M.flat = function (cv, x, y, o = {}) {
  const ox = cv.width / 2, oy = cv.height - (cv.padB || 0);
  c.save();
  if (o.clipY != null) { c.beginPath(); c.rect(0, 0, W, o.clipY); c.clip(); }
  if (o.cast && cv.shadow) {
    c.save(); c.globalAlpha = o.cast.a ?? 0.35;
    c.translate(x + (o.cast.dx ?? 16), y + (o.cast.dy ?? 6)); c.rotate(o.rot || 0); if (o.scale) c.scale(o.scale, o.scale); if (o.skew) c.transform(1, 0, o.skew, 1, 0, 0); c.drawImage(cv.shadow, -ox - 20, -oy - 20); c.restore();
  }
  c.translate(x, y); c.rotate(o.rot || 0); if (o.scale) c.scale(o.scale, o.scale); if (o.skew) c.transform(1, 0, o.skew, 1, 0, 0);
  if (o.alpha != null) c.globalAlpha = o.alpha;
  if (o.ripple && o.ripple.amp > 0.05) {
    const { amp, t, k = 0.018, w = 9, cx = 0, cy = -500 } = o.ripple;
    const sh = 12;
    for (let yy = 0; yy < cv.height; yy += sh) {
      const ly = yy - oy, d = Math.abs(ly - cy);
      const dx = amp * Math.sin(ly * k - t * w) * Math.exp(-d / 700);
      c.drawImage(cv, 0, yy, cv.width, sh + 1, -ox + dx, ly, cv.width, sh + 1);
    }
  } else c.drawImage(cv, -ox, -oy);
  c.restore();
};
function withShadow(cv, blur = 8) {
  cv.shadow = pre(cv.width + 40, cv.height + 40, (x) => { x.filter = `brightness(0) blur(${blur}px)`; x.drawImage(cv, 20, 20); });
  return cv;
}
M.withShadow = withShadow;
// pré-rendu d'une pièce de carton « décor » (liseré + texture) à l'échelle 1
function cutFlat(w, h, ox, oy, fn) {
  return pre(w, h, (x) => { x.translate(ox, oy); LW = 1; fn(x); });
}
M.cutFlat = cutFlat;
