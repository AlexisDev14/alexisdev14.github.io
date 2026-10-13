
// =====================================================================
// DÉCORS EN CARTON PEINT (pré-rendus, origine = bas-centre)
// =====================================================================
const AW = 430, AH = 952, OPW = 143; // demi-largeur de l'arc, hauteur, demi-ouverture
M.ARC = { halfW: AW, h: AH, open: OPW, apex: -551, spring: -408 };

function arcOutlinePath(x, inset = 0, holeSpring = -408) {
  const p = new Path2D(), a = AW - inset, top = -AH + inset;
  const ol = [[-a, 0], [-a, -612], [-a - 16, -612], [-a - 16, -646], [-a - 2, -646], [-a - 2, -918], [-a - 14, -918], [-a - 14, top]];
  const pts = [...ol, ...ol.slice().reverse().map(([px, py]) => [-px, py])];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  p.lineTo(OPW + inset, 0); p.lineTo(OPW + inset, holeSpring); p.arc(0, holeSpring, OPW + inset, 0, Math.PI, true); p.lineTo(-OPW - inset, 0); p.closePath();
  return p;
}
function stoneCourses(x, col, lw, seed, x0 = -AW, x1 = AW, y0 = -AH, y1 = 0, ch = 38) {
  const R = rng(seed);
  x.strokeStyle = col; x.lineWidth = lw; x.beginPath();
  for (let y = y1 - ch; y > y0; y -= ch) { x.moveTo(x0, y); x.lineTo(x1, y + (R() - 0.5) * 0.8); }
  for (let y = y1; y > y0; y -= ch) { let xx = x0 + R() * 90; while (xx < x1) { x.moveTo(xx, y); x.lineTo(xx, y - ch); xx += 70 + R() * 50; } }
  x.stroke();
}
// groupe sculpté abstrait (figures drapées), dans le rectangle donné
function reliefGroup(x, rx, ry, rw, rh, seed, stone, fake) {
  const R = rng(seed);
  x.save(); x.beginPath(); x.rect(rx, ry, rw, rh); x.clip();
  x.fillStyle = fake ? 'rgba(150,120,80,0.25)' : 'rgba(90,70,45,0.22)'; x.fillRect(rx, ry, rw, rh);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const fx = rx + rw * (0.14 + i * 0.24 + (R() - 0.5) * 0.05), fh = rh * (0.62 + R() * 0.25), fw = rw * 0.13;
    const lean = (R() - 0.5) * 0.25;
    x.save(); x.translate(fx, ry + rh); x.rotate(lean);
    // corps drapé
    x.beginPath(); x.moveTo(-fw * 0.6, 0); x.quadraticCurveTo(-fw * 0.9, -fh * 0.5, -fw * 0.35, -fh * 0.82); x.lineTo(fw * 0.35, -fh * 0.82); x.quadraticCurveTo(fw * 0.9, -fh * 0.5, fw * 0.7, 0); x.closePath();
    x.fillStyle = stone; x.fill();
    x.beginPath(); x.arc(0, -fh * 0.88, fw * 0.32, 0, TAU); x.fill();
    // bras levé
    if (R() < 0.6) { x.beginPath(); x.moveTo(fw * 0.2, -fh * 0.75); x.quadraticCurveTo(fw * 0.9, -fh * 0.95, fw * 0.8, -fh * 1.05); x.lineWidth = fw * 0.22; x.strokeStyle = stone; x.lineCap = 'round'; x.stroke(); }
    // ombres gravées à droite
    x.save(); x.beginPath(); x.rect(fw * 0.05, -fh * 1.1, fw, fh * 1.1); x.clip();
    x.strokeStyle = fake ? 'rgba(110,80,40,0.45)' : 'rgba(50,38,28,0.5)'; x.lineWidth = 1;
    x.beginPath(); for (let k = -fh * 1.2; k < 0; k += 4) { x.moveTo(-fw, k); x.lineTo(fw, k + fw * 0.6); } x.stroke();
    x.restore();
    // plis
    x.strokeStyle = 'rgba(60,45,30,0.45)'; x.lineWidth = 1;
    for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(k * fw * 0.25, -fh * 0.7); x.quadraticCurveTo(k * fw * 0.4, -fh * 0.35, k * fw * 0.3, -2); x.stroke(); }
    x.restore();
  }
  if (!fake) { x.save(); x.translate(rx + rw * 0.55, ry + rh * 0.18); x.rotate(-0.5); x.beginPath(); x.ellipse(0, 0, rw * 0.22, rh * 0.06, 0, 0, TAU); x.fillStyle = stone; x.fill(); x.restore(); }
  x.restore();
  x.strokeStyle = fake ? 'rgba(120,90,50,0.6)' : 'rgba(70,55,35,0.6)'; x.lineWidth = 2.5; x.strokeRect(rx, ry, rw, rh);
}

function paintArcFace(x, fake) {
  const base = fake ? '#dccaa0' : P.pierre, dark = fake ? '#a8946a' : '#9d8b6c', light = fake ? '#ecdcb8' : P.pierreL;
  const out = arcOutlinePath(x);
  x.save(); x.clip(out);
  const g0 = x.createLinearGradient(-AW, 0, AW, 0); g0.addColorStop(0, light); g0.addColorStop(0.5, base); g0.addColorStop(1, mixc(base, '#6e5d45', 0.25));
  x.fillStyle = g0; x.fillRect(-AW - 30, -AH - 10, 2 * AW + 60, AH + 20);
  // assises de pierre (ou joints peints, plus naïfs)
  stoneCourses(x, fake ? 'rgba(140,110,70,0.55)' : 'rgba(95,78,55,0.42)', fake ? 2.2 : 1.2, fake ? 5 : 6, -AW, AW, -AH, 0, fake ? 46 : 36);
  // socle
  x.fillStyle = 'rgba(80,60,40,0.18)'; x.fillRect(-AW - 20, -64, 2 * AW + 40, 64);
  x.fillStyle = 'rgba(60,45,30,0.5)'; x.fillRect(-AW - 20, -66, 2 * AW + 40, 4);
  // grands groupes sculptés
  reliefGroup(x, -AW + 32, -395, 218, 300, 31, light, fake);
  reliefGroup(x, AW - 250, -395, 218, 300, 32, light, fake);
  // panneaux hauts
  reliefGroup(x, -AW + 40, -575, 200, 112, 33, light, fake);
  reliefGroup(x, AW - 240, -575, 200, 112, 34, light, fake);
  // imposte
  x.fillStyle = dark; x.fillRect(-AW, -414, AW - OPW, 14); x.fillRect(OPW, -414, AW - OPW, 14);
  x.fillStyle = light; x.fillRect(-AW, -414, AW - OPW, 4); x.fillRect(OPW, -414, AW - OPW, 4);
  // voûte (intrados) avec caissons
  x.save(); x.beginPath(); x.arc(0, -408, OPW, Math.PI, TAU); x.lineTo(OPW, -360); x.arc(0, -360, OPW, 0, Math.PI, true); x.closePath(); x.clip();
  x.fillStyle = fake ? '#a89167' : '#8d7b60'; x.fillRect(-OPW, -560, 2 * OPW, 220);
  for (let a = Math.PI + 0.12; a < TAU - 0.05; a += 0.26) { const cx = Math.cos(a) * (OPW - 4), cy = -384 + Math.sin(a) * (OPW - 4); x.fillStyle = 'rgba(40,30,20,0.4)'; x.fillRect(cx - 7, cy - 9, 14, 14); x.fillStyle = 'rgba(255,240,210,0.25)'; x.fillRect(cx - 7, cy - 9, 14, 3); }
  x.restore();
  // archivolte
  for (const [r, lw, col] of [[OPW + 26, 5, dark], [OPW + 14, 3, 'rgba(255,245,220,0.55)'], [OPW + 4, 2, dark]]) { x.beginPath(); x.arc(0, -408, r, Math.PI, TAU); x.strokeStyle = col; x.lineWidth = lw; x.stroke(); }
  for (let a = Math.PI + 0.1; a < TAU; a += 0.2) { x.beginPath(); x.moveTo(Math.cos(a) * OPW, -408 + Math.sin(a) * OPW); x.lineTo(Math.cos(a) * (OPW + 26), -408 + Math.sin(a) * (OPW + 26)); x.strokeStyle = 'rgba(90,70,50,0.35)'; x.lineWidth = 1; x.stroke(); }
  // clé de voûte
  x.fillStyle = light; x.fillRect(-14, -584, 28, 36); x.strokeStyle = dark; x.lineWidth = 2; x.strokeRect(-14, -584, 28, 36);
  // renommées couchées dans les écoinçons
  for (const d of [-1, 1]) {
    x.save(); x.scale(d, 1); x.translate(-OPW - 60, -575); x.rotate(0.35);
    x.beginPath(); x.ellipse(0, 0, 70, 12, 0, 0, TAU); x.fillStyle = light; x.fill();
    x.beginPath(); x.moveTo(30, -6); x.quadraticCurveTo(60, -40, 20, -42); x.quadraticCurveTo(10, -20, 30, -6); x.fill();
    x.strokeStyle = 'rgba(60,45,30,0.5)'; x.lineWidth = 1; x.beginPath(); for (let k = -60; k < 70; k += 5) { x.moveTo(k, 2); x.lineTo(k + 4, 12); } x.stroke();
    x.restore();
  }
  // frise sous la corniche
  x.fillStyle = 'rgba(80,60,40,0.22)'; x.fillRect(-AW, -612, 2 * AW, 32);
  for (let k = -AW + 10; k < AW - 10; k += 22) { x.beginPath(); x.ellipse(k, -596, 6, 11, 0, 0, TAU); x.fillStyle = light; x.fill(); x.strokeStyle = 'rgba(70,50,30,0.35)'; x.stroke(); }
  // corniche + denticules
  x.fillStyle = light; x.fillRect(-AW - 20, -646, 2 * AW + 40, 34);
  x.fillStyle = 'rgba(50,38,25,0.55)'; x.fillRect(-AW - 20, -616, 2 * AW + 40, 5);
  for (let k = -AW - 14; k < AW + 14; k += 11) { x.fillStyle = 'rgba(60,45,30,0.45)'; x.fillRect(k, -636, 5, 9); }
  // attique et boucliers ronds (sans inscription)
  x.fillStyle = 'rgba(70,55,35,0.12)'; x.fillRect(-AW, -918, 2 * AW, 272);
  x.fillStyle = 'rgba(70,55,35,0.25)'; x.fillRect(-AW, -760, 2 * AW, 3);
  for (let k = 0; k < 11; k++) { const sx = -AW + 40 + k * (2 * AW - 80) / 10; x.beginPath(); x.arc(sx, -706, 17, 0, TAU); x.fillStyle = light; x.fill(); x.lineWidth = 2.5; x.strokeStyle = dark; x.stroke(); x.beginPath(); x.arc(sx - 3, -709, 7, 0, TAU); x.fillStyle = 'rgba(255,250,235,0.4)'; x.fill(); }
  x.fillStyle = 'rgba(70,55,35,0.18)'; x.fillRect(-AW + 30, -880, 2 * AW - 60, 90);
  x.strokeStyle = 'rgba(70,55,35,0.5)'; x.lineWidth = 2; x.strokeRect(-AW + 30, -884, 2 * AW - 60, 96);
  for (let k = -AW + 60; k < AW - 50; k += 70) { x.fillStyle = 'rgba(255,248,230,0.28)'; x.fillRect(k, -870, 44, 68); x.strokeStyle = 'rgba(70,55,35,0.35)'; x.lineWidth = 1.2; x.strokeRect(k, -870, 44, 68); x.fillStyle = 'rgba(70,55,35,0.12)'; x.fillRect(k + 40, -866, 4, 64); }
  x.fillStyle = light; x.fillRect(-AW - 14, -952, 2 * AW + 28, 34);
  x.fillStyle = 'rgba(50,38,25,0.5)'; x.fillRect(-AW - 14, -921, 2 * AW + 28, 4);
  // ombre gravée (lumière venant de la gauche)
  x.save(); x.beginPath(); x.rect(AW - 70, -AH, 90, AH); x.clip(); x.strokeStyle = 'rgba(40,30,20,0.28)'; x.lineWidth = 1; x.beginPath(); for (let k = -AH - 100; k < 100; k += 5) { x.moveTo(AW - 80, k); x.lineTo(AW + 20, k + 60); } x.stroke(); x.restore();
  x.save(); x.beginPath(); x.rect(-OPW, -560, 40, 560); x.clip(); x.strokeStyle = 'rgba(40,30,20,0.3)'; x.beginPath(); for (let k = -600; k < 20; k += 5) { x.moveTo(-OPW - 10, k); x.lineTo(-OPW + 50, k + 40); } x.stroke(); x.restore();
  if (fake) {
    // coutures verticales des lés de toile + plis
    for (const sx of [-300, -145, 0, 145, 300]) {
      x.strokeStyle = 'rgba(110,85,50,0.6)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(sx, -AH); x.lineTo(sx + 2, 0); x.stroke();
      x.setLineDash([6, 5]); x.strokeStyle = 'rgba(70,50,25,0.65)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(sx + 4, -AH); x.lineTo(sx + 6, 0); x.stroke(); x.setLineDash([]);
    }
    const R = rng(8);
    for (let i = 0; i < 16; i++) {
      const sx = -AW + R() * 2 * AW, sy = -AH + R() * AH, l = 120 + R() * 240, a = (R() - 0.5) * 1.2 + Math.PI / 2;
      const gr = x.createLinearGradient(sx, sy, sx + 18, sy); gr.addColorStop(0, 'rgba(90,65,35,0)'); gr.addColorStop(0.5, 'rgba(90,65,35,0.16)'); gr.addColorStop(1, 'rgba(255,240,210,0.12)');
      x.save(); x.translate(sx, sy); x.rotate(a); x.fillStyle = gr; x.fillRect(0, -9, l, 18); x.restore();
    }
    x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.canvasPat; x.fillRect(-AW - 30, -AH - 10, 2 * AW + 60, AH + 20);
  } else {
    // grain de pierre
    const R = rng(9);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '70,55,40' : '255,250,235'},${R() * 0.18})`; x.fillRect(-AW + R() * 2 * AW, -AH + R() * AH, 1 + R() * 2, 1 + R() * 2); }
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.fillStyle = M.tex.paperPat; x.fillRect(-AW - 30, -AH - 10, 2 * AW + 60, AH + 20);
  }
  x.restore();
}
function mixc(a, b, t) { const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const A = h(a), B = h(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; }
M.mixc = mixc;

function makeArc(fake) {
  const pad = 40, padB = 10;
  const cv = pre(2 * AW + 2 * pad + 40, AH + pad + padB + 10, (x) => {
    x.translate(AW + pad + 20, AH + pad);
    if (fake) {
      // charpente : montants et traverses de bois derrière la toile (dépassent sur les bords)
      x.fillStyle = '#6b4626';
      for (const sx of [-AW - 22, AW + 8]) { x.fillRect(sx, -AH - 22, 14, AH + 22); }
      x.fillRect(-AW - 22, -AH - 24, 2 * AW + 44, 14);
      x.fillRect(-OPW - 12, -AH, 10, AH); x.fillRect(OPW + 2, -AH, 10, AH);
      woodGrain(x, -AW - 30, -AH - 30, 2 * AW + 60, 30, 3);
      x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 1.5; for (const sx of [-AW - 22, AW + 8]) x.strokeRect(sx, -AH - 22, 14, AH + 22);
      // jambes de force
      x.strokeStyle = '#5a3a1f'; x.lineWidth = 9; x.beginPath(); x.moveTo(-AW - 16, -200); x.lineTo(-AW + 60, 0); x.moveTo(AW + 16, -200); x.lineTo(AW - 60, 0); x.stroke();
    }
    const out = arcOutlinePath(x);
    // ombre de découpe + liseré
    x.save(); x.translate(3, 4); x.fillStyle = 'rgba(15,8,4,0.35)'; x.fill(out); x.restore();
    x.lineJoin = 'round'; x.lineWidth = 7; x.strokeStyle = 'rgba(34,22,14,0.8)'; x.stroke(out);
    x.lineWidth = 5; x.strokeStyle = P.edge; x.stroke(out);
    paintArcFace(x, fake);
    if (fake) {
      // laçage de la toile sur la charpente
      x.strokeStyle = '#9b7b4c'; x.lineWidth = 2;
      x.beginPath();
      for (let y = -AH + 10; y < -10; y += 26) { x.moveTo(-AW - 16, y); x.lineTo(-AW + 4, y + 13); x.lineTo(-AW - 16, y + 26); x.moveTo(AW + 14, y); x.lineTo(AW - 4, y + 13); x.lineTo(AW + 14, y + 26); }
      for (let xx = -AW; xx < AW; xx += 30) { x.moveTo(xx, -AH - 16); x.lineTo(xx + 15, -AH + 4); x.lineTo(xx + 30, -AH - 16); }
      x.stroke();
      for (let y = -AH + 10; y < -10; y += 26) { M.dot(-AW + 4, y + 13, 2.2, '#5a4026'); M.dot(AW - 4, y + 13, 2.2, '#5a4026'); }
    }
  });
  cv.padB = padB + 10;
  return withShadow(cv, 10);
}
M.makeArc = makeArc;

// ---------------------------------------------------------------- toiles de fond peintes
function paintedSky(x, stops, seed, clouds) {
  const g0 = x.createLinearGradient(0, 0, 0, ST.back);
  for (const [o, col] of stops) g0.addColorStop(o, col);
  x.fillStyle = g0; x.fillRect(0, 0, W, ST.back + 5);
  const R = rng(seed);
  // coups de brosse
  for (let i = 0; i < 260; i++) {
    const cx = R() * W, cy = R() * ST.back, l = 40 + R() * 160;
    x.strokeStyle = `rgba(${R() < 0.5 ? '255,245,225' : '40,30,40'},${0.03 + R() * 0.04})`; x.lineWidth = 6 + R() * 18; x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + l / 2, cy + (R() - 0.5) * 20, cx + l, cy + (R() - 0.5) * 12); x.stroke();
  }
  if (clouds) for (const [cx, cy, s, col] of clouds) {
    for (let k = 0; k < 14; k++) { x.beginPath(); x.ellipse(cx + (R() - 0.5) * 220 * s, cy + (R() - 0.5) * 40 * s, (40 + R() * 70) * s, (16 + R() * 22) * s, 0, 0, TAU); x.fillStyle = col; x.fill(); }
  }
  // lés de toile cousus
  for (let sx = 210; sx < W; sx += 330) { x.fillStyle = 'rgba(40,30,20,0.12)'; x.fillRect(sx, 0, 2, ST.back); }
  x.globalCompositeOperation = 'multiply'; x.fillStyle = M.tex.canvasPat; x.fillRect(0, 0, W, ST.back + 5); x.globalCompositeOperation = 'source-over';
}
M.makeSky = function (kind) {
  return pre(W, ST.back + 5, (x) => {
    if (kind === 'aube') paintedSky(x, [[0, '#4b5666'], [0.45, '#8c8a7e'], [0.8, '#cdb58c'], [1, '#e0c597']], 4, [[260, 520, 1, 'rgba(240,225,200,0.10)'], [760, 380, 1.2, 'rgba(240,225,200,0.08)']]);
    else if (kind === 'couchant') paintedSky(x, [[0, '#1f2638'], [0.35, '#4a3346'], [0.62, '#8e3a30'], [0.82, '#c4733a'], [1, '#e2ae68']], 5, [[300, 760, 1.4, 'rgba(60,25,40,0.12)'], [820, 640, 1.1, 'rgba(60,25,40,0.12)']]);
    else if (kind === 'paris') paintedSky(x, [[0, '#56657a'], [0.5, '#9f9f93'], [0.85, '#d8c8a4'], [1, '#e4d3ac']], 6, [[230, 460, 1, 'rgba(245,235,215,0.12)'], [800, 560, 1.3, 'rgba(245,235,215,0.10)']]);
    else if (kind === 'empire') {
      paintedSky(x, [[0, '#17221c'], [0.5, '#24372b'], [1, '#2c4234']], 7, null);
      // tenture peinte : plis verticaux et étoiles dorées
      for (let i = 0; i < 18; i++) { const x0 = i * 62; const gr = x.createLinearGradient(x0, 0, x0 + 62, 0); gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(0.5, 'rgba(120,160,120,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)'); x.fillStyle = gr; x.fillRect(x0, 0, 62, ST.back); }
      const R = rng(12);
      for (let i = 0; i < 40; i++) { const sx = 31 + (i % 9) * 124 + ((i / 9 | 0) % 2) * 62, sy = 330 + (i / 9 | 0) * 220; if (sy > 1300) continue; x.save(); x.translate(sx, sy); x.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 4 : 10; x.lineTo(Math.cos(k * Math.PI / 5 - Math.PI / 2) * r, Math.sin(k * Math.PI / 5 - Math.PI / 2) * r); } x.closePath(); x.fillStyle = `rgba(200,165,90,${0.35 + R() * 0.1})`; x.fill(); x.restore(); }
      x.fillStyle = 'rgba(176,141,69,0.8)'; x.fillRect(0, 250, W, 8); x.fillRect(0, 1300, W, 6);
    }
  });
};

// ---------------------------------------------------------------- fermes (ground rows) et coulisses
M.makeParisRow = function () {
  const cv = cutFlat(W + 80, 340, 40, 330, (x) => {
    const R = rng(33);
    // toits de Paris lointains
    const pts = [[-40, 0]];
    let xx = -40;
    while (xx < W + 40) {
      const w = 40 + R() * 70, h = 70 + R() * 90;
      pts.push([xx, -h + 20], [xx + 6, -h], [xx + w - 6, -h], [xx + w, -h + 20]);
      if (R() < 0.6) { const cx = xx + w * (0.25 + R() * 0.5); pts.push([cx - 5, -h], [cx - 5, -h - 18, 1], [cx + 5, -h - 18, 1], [cx + 5, -h]); }
      xx += w;
    }
    pts.push([W + 40, 0]);
    const pp = pts.map((p) => [p[0], p[1] - 40, 1]); pp[0][1] = 0; pp[pp.length - 1][1] = 0;
    piece(pp, '#8b8f93', () => {
      x.fillStyle = 'rgba(30,30,40,0.25)'; for (let i = 0; i < 70; i++) x.fillRect(-40 + R() * (W + 80), -90 + R() * 70, 3, 5);
      hatch(null, 0.9, 4.5, 0.18, 1, P.encre, [-40, -250, W + 40, 0]);
    }, { seed: 33 });
    // colline et arbres de l'Étoile
    const hill = [[-40, 0], [-40, -60], [200, -80], [500, -70], [800, -84], [W + 40, -64], [W + 40, 0]];
    piece(hill, '#6d6a4c', () => hatch(null, 0.3, 5, 0.2, 1, P.encre, [-40, -100, W + 40, 0]), { seed: 34 });
    for (let i = 0; i < 16; i++) {
      const tx = -20 + i * 72 + R() * 20, ty = -70, r = 22 + R() * 10;
      const tp = []; for (let k = 0; k < 9; k++) { const a = Math.PI + k * Math.PI / 8; tp.push([tx + Math.cos(a) * r, ty - 18 + Math.sin(a) * r * 1.3]); } tp.push([tx + r * 0.3, ty + 8], [tx - r * 0.3, ty + 8]);
      piece(tp, '#4a5038', () => hatch(null, 0.8, 3.5, 0.3, 1, P.encre, [tx - 40, ty - 60, tx + 40, ty + 20]), { seed: 40 + i });
    }
  });
  return withShadow(cv, 6);
};
M.makeTreeWing = function (seed, flip) {
  const cv = cutFlat(300, 1300, 150, 1290, (x) => {
    if (flip) x.scale(-1, 1);
    const R = rng(seed);
    piece([[-30, 0], [-22, -300], [-26, -600], [-14, -820], [14, -820], [24, -600], [20, -300], [32, 0]], '#4a3a2a', () => { hatch(null, 0.15, 3.5, 0.35); }, { seed });
    for (let k = 0; k < 7; k++) {
      const cx = (R() - 0.5) * 160, cy = -700 - k * 80 + R() * 40, r = 70 + R() * 50;
      const tp = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr = r * (0.82 + 0.18 * ((i % 2) ? 1 : 0.7)); tp.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]); }
      piece(tp, k % 2 ? '#3d4a35' : '#46553c', () => { hatch([[cx - r, cy], [cx + r, cy], [cx + r, cy + r], [cx - r, cy + r]], 0.8, 3.6, 0.4); }, { seed: seed + k });
    }
  });
  return withShadow(cv, 8);
};
M.makeCloud = function (seed, s = 1) {
  const cv = cutFlat(360 * s, 160 * s, 180 * s, 140 * s, (x) => {
    x.scale(s, s);
    const pts = [[-160, 0], [-150, -40], [-110, -60], [-80, -100], [-30, -110], [10, -90], [50, -120], [100, -100], [130, -60], [160, -40], [165, 0]];
    piece(pts, '#d9d1bf', () => { hatch([[-170, -40], [170, -40], [170, 10], [-170, 10]], 0.4, 4, 0.3); shade(0, -110, 0, 0, 0.25, [-170, -130, 170, 10]); }, { seed });
  });
  return withShadow(cv, 6);
};
// nuage suspendu à deux fils (balancement)
M.hung = function (cv, x, y, t, o = {}) {
  const sw = Math.sin(t * (o.f || 0.8) + (o.ph || 0)) * (o.amp ?? 0.02);
  c.save(); c.translate(x, y); c.rotate(sw);
  c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3;
  const hw = cv.width * 0.3;
  c.beginPath(); c.moveTo(-hw, -cv.height + 30); c.lineTo(-hw, -2000); c.moveTo(hw, -cv.height + 30); c.lineTo(hw, -2000); c.stroke();
  c.restore();
  M.flat(cv, x, y, { rot: sw, cast: o.cast });
};

// ---------------------------------------------------------------- Empire : colonnes, tenture, couronne
M.makeColumn = function () {
  const cv = cutFlat(200, 1010, 100, 1000, (x) => {
    piece([[-70, 0, 1], [70, 0, 1], [70, -60, 1], [52, -70], [50, -82, 1], [42, -90], [44, -800], [64, -830], [72, -880, 1], [-72, -880, 1], [-64, -830], [-44, -800], [-42, -90], [-50, -82, 1], [-52, -70], [-70, -60, 1]], '#e6dcc6', () => {
      for (let k = -34; k <= 34; k += 11) { x.strokeStyle = 'rgba(90,80,60,0.45)'; x.lineWidth = 2; x.beginPath(); x.moveTo(k, -95); x.lineTo(k, -795); x.stroke(); x.strokeStyle = 'rgba(255,255,245,0.4)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(k + 3, -95); x.lineTo(k + 3, -795); x.stroke(); }
      x.strokeStyle = 'rgba(110,105,100,0.25)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-30, -700); x.bezierCurveTo(0, -600, -20, -500, 10, -400); x.moveTo(20, -300); x.bezierCurveTo(-10, -250, 30, -200, 0, -120); x.stroke();
      hatch([[14, -800], [50, -800], [50, -90], [14, -90]], 0.9, 4, 0.35);
      // chapiteau doré
      x.fillStyle = goldGradH(x, -72, 72); x.fillRect(-75, -890, 150, 92);
      for (let k = -60; k <= 60; k += 20) { x.beginPath(); x.moveTo(k - 10, -800); x.quadraticCurveTo(k - 12, -840, k, -850); x.quadraticCurveTo(k + 12, -840, k + 10, -800); x.fillStyle = 'rgba(80,55,15,0.5)'; x.fill(); }
      goldScroll(x, -40, -862, 9, -1, 1); goldScroll(x, 40, -862, 9, 1, 2);
      x.fillStyle = goldGradH(x, -72, 72); x.fillRect(-75, -95, 150, 30);
      x.fillStyle = '#3b3a36'; x.fillRect(-75, -65, 150, 65);
      shade(-70, 0, 70, 0, 0.3, [-80, -900, 80, 0]);
    }, { seed: 81 });
  });
  return withShadow(cv, 8);
};
M.makeCanopy = function () {
  const cv = cutFlat(980, 320, 490, 40, (x) => {
    const pts = [[-480, -30, 1], [480, -30, 1], [480, 60], [440, 150], [380, 230, 1], [300, 120], [160, 170], [0, 196], [-160, 170], [-300, 120], [-380, 230, 1], [-440, 150], [-480, 60]];
    piece(pts, P.vert, () => {
      for (let k = 0; k < 6; k++) { x.strokeStyle = 'rgba(10,20,12,0.45)'; x.lineWidth = 4; x.beginPath(); x.moveTo(-460, 0 + k * 10); x.quadraticCurveTo(0, 90 + k * 22, 460, 0 + k * 10); x.stroke(); x.strokeStyle = 'rgba(160,200,160,0.10)'; x.lineWidth = 3; x.beginPath(); x.moveTo(-460, 6 + k * 10); x.quadraticCurveTo(0, 98 + k * 22, 460, 6 + k * 10); x.stroke(); }
      x.strokeStyle = P.or; x.lineWidth = 9; x.beginPath(); x.moveTo(-300, 112); x.quadraticCurveTo(-160, 180, 0, 186); x.quadraticCurveTo(160, 180, 300, 112); x.stroke();
      x.fillStyle = goldGrad(x, -30, -4); x.fillRect(-480, -30, 960, 22);
      hatch(null, 0.7, 4.5, 0.25, 1, P.encre, [-480, -40, 480, 240]);
    }, { seed: 82 });
    x.strokeStyle = '#b48f45'; x.lineWidth = 2;
    x.beginPath(); for (let u = 0; u <= 1; u += 0.01) { const px = lerp(-300, 300, u), py = 112 + 74 * Math.sin(Math.PI * u) + 4; x.moveTo(px, py); x.lineTo(px, py + 14); } x.stroke();
    for (const gx of [-380, 380]) { x.beginPath(); x.ellipse(gx, 244, 9, 12, 0, 0, TAU); x.fillStyle = goldGradH(x, gx - 9, gx + 9); x.fill(); x.beginPath(); x.moveTo(gx - 9, 252); x.lineTo(gx - 15, 296); x.lineTo(gx + 15, 296); x.lineTo(gx + 9, 252); x.fillStyle = '#a7823b'; x.fill(); }
  });
  return withShadow(cv, 8);
};
M.makeWreath = function () {
  const cv = cutFlat(280, 300, 140, 280, (x) => {
    const R = rng(5);
    const cy = -150, r = 92;
    for (let i = 0; i < 34; i++) {
      const side = i < 17 ? -1 : 1, u = (i % 17) / 16, a = Math.PI / 2 + side * (0.25 + u * 2.6);
      const px = Math.cos(a) * r, py = cy + Math.sin(a) * r, rot = a + side * Math.PI / 2 + (R() - 0.5) * 0.3;
      x.save(); x.translate(px, py); x.rotate(rot);
      const lf = [[0, -22], [8, -8], [6, 10], [0, 22, 1], [-6, 10], [-8, -8]];
      piece(lf, i % 2 ? '#56693e' : '#495b34', () => { x.strokeStyle = 'rgba(20,30,10,0.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, -20); x.lineTo(0, 20); x.stroke(); }, { seed: i });
      x.restore();
    }
    // nœud de ruban tricolore
    for (const [d, col] of [[-1, '#2c3d6b'], [1, P.sangL]]) piece([[0, -60], [d * 26, -40], [d * 40, 0], [d * 22, -10], [d * 14, -46]], col, null, { seed: 7 + d });
    piece([[-12, -72], [12, -72], [10, -52], [-10, -52]], '#e6dcc6', null, { seed: 9 });
  });
  return withShadow(cv, 6);
};

// ---------------------------------------------------------------- mer en bandes, rocher, soleil
M.makeWave = function (i) {
  const cols = ['#40566a', '#33485d', '#283a4f', '#1e2c3e'];
  const ww = W + 280, hh = 300;
  const cv = cutFlat(ww, hh, ww / 2, hh - 4, (x) => {
    const pts = [[-ww / 2 + 4, 0, 1]];
    const per = 130 + i * 6;
    for (let xx = -ww / 2 + 4; xx <= ww / 2 - 4; xx += per / 6) {
      const ph = ((xx + ww) % per) / per;
      const y = -hh + 46 + Math.sin(ph * TAU) * 14 - (ph > 0.55 && ph < 0.75 ? 14 : 0);
      pts.push([xx, y, ph > 0.6 && ph < 0.7 ? 1 : 0]);
    }
    pts.push([ww / 2 - 4, 0, 1]);
    piece(pts, cols[i], () => {
      for (let k = 0; k < 9; k++) { x.strokeStyle = `rgba(200,215,225,${0.16 - k * 0.012})`; x.lineWidth = 1.3; x.beginPath(); for (let xx = -ww / 2; xx < ww / 2; xx += 8) { const ph = ((xx + ww) % per) / per; const y = -hh + 62 + k * 16 + Math.sin(ph * TAU) * (12 - k); xx === -ww / 2 ? x.moveTo(xx, y) : x.lineTo(xx, y); } x.stroke(); }
      x.strokeStyle = 'rgba(235,226,205,0.55)'; x.lineWidth = 2.4; x.beginPath(); for (let xx = -ww / 2; xx < ww / 2; xx += 6) { const ph = ((xx + ww) % per) / per; const y = -hh + 50 + Math.sin(ph * TAU) * 14 - (ph > 0.55 && ph < 0.75 ? 14 : 0); xx === -ww / 2 ? x.moveTo(xx, y) : x.lineTo(xx, y); } x.stroke();
      shade(0, -hh, 0, 0, 0.4, [-ww / 2, -hh, ww / 2, 0]);
    }, { seed: 100 + i });
  });
  return cv;
};
M.makeRock = function () {
  const cv = cutFlat(640, 720, 320, 700, (x) => {
    const pts = [[-290, 0], [-282, -140], [-262, -250], [-230, -330], [-196, -400], [-150, -470], [-110, -520], [-70, -538], [-20, -540], [40, -538], [80, -530], [110, -500], [150, -440], [196, -380], [230, -300], [258, -210], [280, -100], [292, 0]];
    piece(pts, '#76695a', () => {
      x.fillStyle = 'rgba(160,140,115,0.35)'; x.beginPath(); x.moveTo(-110, -520); x.lineTo(-200, -300); x.lineTo(-120, -200); x.lineTo(-60, -400); x.closePath(); x.fill();
      hatch([[0, -540], [300, -540], [300, 0], [40, 0]], 0.7, 3.8, 0.42);
      hatch([[120, -500], [300, -500], [300, 0], [160, 0]], -0.5, 4.4, 0.3);
      for (const cr of [[[-60, -520], [-40, -440], [-70, -380], [-50, -300]], [[60, -500], [80, -420], [50, -330]], [[-180, -380], [-150, -300], [-170, -200]], [[180, -360], [150, -260], [170, -150]]]) strokePts(cr, 'rgba(30,22,16,0.7)', 1.8);
      for (let k = 0; k < 7; k++) { const gx = -120 + k * 36, gy = -536 + Math.abs(k - 3) * 2; x.strokeStyle = '#4c5a36'; x.lineWidth = 2; x.beginPath(); x.moveTo(gx, gy + 4); x.lineTo(gx - 4, gy - 8); x.moveTo(gx, gy + 4); x.lineTo(gx + 3, gy - 9); x.stroke(); }
      shade(-290, 0, 290, 0, 0.35, [-300, -560, 300, 0]);
    }, { seed: 200 });
  });
  return withShadow(cv, 8);
};
M.sun = function (x, y, r, t) {
  c.strokeStyle = 'rgba(20,15,10,0.55)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x, 0); c.stroke();
  c.save(); c.globalCompositeOperation = 'screen';
  const gg = c.createRadialGradient(x, y, r * 0.8, x, y, r * 3); gg.addColorStop(0, 'rgba(240,150,70,0.35)'); gg.addColorStop(1, 'rgba(240,150,70,0)');
  c.fillStyle = gg; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); c.restore();
  c.save(); c.translate(x, y); LW = 1;
  const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  piece(pts, '#d7883e', () => { const g2 = c.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g2.addColorStop(0, '#f1c983'); g2.addColorStop(1, '#b24d2c'); c.fillStyle = g2; c.fillRect(-r, -r, 2 * r, 2 * r); hatch([[0, -r], [r, -r], [r, r], [0, r]], 0.8, 4, 0.18); }, { seed: 300 });
  c.restore();
};
