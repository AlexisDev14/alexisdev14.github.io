// Extrait m5 — « Sans lui » (théâtre de marionnettes à tiges)
const SCENE = (() => {
  const S = {}, E = TL.EVENTS, C = M.chars, ST = M.ST;
  const { clamp, lerp, ease, easeOut, easeIn, smooth, wob, noise, TAU } = M;
  let K;
  S.init = () => {
    K = {
      empire: M.makeSky('empire'), couchant: M.makeSky('couchant'), paris: M.makeSky('paris'),
      col: M.makeColumn(), canopy: M.makeCanopy(), wreath: M.makeWreath(), crown: M.makeWreath(),
      waves: [0, 1, 2, 3].map(M.makeWave), rock: M.makeRock(), vrai: M.makeArc(false), row: M.makeParisRow(),
      wingL: M.makeTreeWing(5, false), wingR: M.makeTreeWing(9, true),
    };
  };
  const cast = { dx: 22, dy: 10, a: 0.3 };
  const FEET = ST.slotF - 34, FEETB = ST.slotB - 30;
  const ARCX = 500, AS = 0.9;
  const ctx = () => M.ctx();

  function clipAbove(y, fn) { const x = ctx(); x.save(); x.beginPath(); x.rect(0, 0, M.W, y); x.clip(); fn(); x.restore(); }

  // ======================= 1. L'Empire s'effondre =======================
  function empire(t) {
    const x = ctx();
    x.drawImage(K.empire, 0, 0);
    const shv = (t > E.shiver && t < E.colFall0 ? 1 : 0) * Math.sin(t * 60) * 0.006 * smooth(E.shiver, E.shiver + 0.15, t);
    // colonnes : basculent vers l'extérieur autour de leur arête basse
    for (const [cx, d] of [[205, -1], [875, 1]]) {
      const u = clamp((t - E.colFall0) / (E.colFall1 - E.colFall0));
      const r = d * (easeIn(u) * 1.45 + wob(t, E.colFall1, 0.06, 2.5, 7)) + shv;
      const px = cx + d * 70 - d * 6;
      x.save(); x.translate(px, ST.back); x.rotate(r); x.translate(-px, -ST.back);
      M.flat(K.col, cx, ST.back, { cast, clipY: null });
      x.restore();
    }
    // tenture : la corde gauche lâche, elle pend et balance
    {
      const k = t > E.collapse ? 1 : 0;
      const ang = k * (0.62 * easeOut((t - E.collapse) / 0.3) + wob(t, E.collapse + 0.3, -0.12, 1.3, 3));
      const px = 540 + 470, py = 380;
      x.strokeStyle = 'rgba(150,120,80,0.9)'; x.lineWidth = 2.4;
      x.beginPath(); x.moveTo(px - 10, py); x.lineTo(px - 10, 0); x.stroke();
      if (t < E.collapse) { x.beginPath(); x.moveTo(540 - 470, py); x.lineTo(540 - 470, 0); x.stroke(); }
      else { const sn = smooth(E.collapse, E.collapse + 0.35, t); x.beginPath(); x.moveTo(540 - 470, 0); x.lineTo(540 - 470 + 8 * sn, 150 + 120 * sn); x.stroke(); }
      x.save(); x.translate(px, py); x.rotate(-ang * 1.0); x.translate(-px, -py);
      M.flat(K.canopy, 540, 400 + Math.sin(t * 60) * 1.5 * (t > E.shiver && t < E.collapse ? 1 : 0), { cast });
      x.restore();
    }
    // couronne de laurier : tombe, rebondit, se couche
    {
      let cy = 640, rot = Math.sin(t * 1.3) * 0.02;
      if (t > E.collapse) {
        const u = t - E.collapse, fall = Math.min(u, E.crownLand - E.collapse);
        cy = 640 + 0.5 * 6000 * fall * fall;
        cy = Math.min(cy, ST.back + 6);
        if (t > E.crownLand) cy = ST.back + 6 - Math.abs(Math.sin((t - E.crownLand) * 9)) * 40 * Math.exp(-6 * (t - E.crownLand));
        rot = 0.4 * smooth(E.collapse, E.crownLand + 0.2, t);
      }
      if (t <= E.collapse) M.hung(K.wreath, 700, cy, t, { cast, amp: 0.02 });
      else M.flat(K.wreath, 700 + 50 * smooth(E.crownLand, E.crownLand + 0.4, t), cy, { rot, cast });
    }
    M.drawFloor();
    // poussière de carton à l'impact des colonnes
    for (const [dx0, d] of [[140, -1], [940, 1]]) {
      const u = t - E.colFall1; if (u < 0 || u > 1.2) continue;
      for (let i = 0; i < 14; i++) {
        const a = -Math.PI / 2 + (i / 13 - 0.5) * 2.2, sp = 80 + (i * 37 % 60);
        const px = dx0 + d * 40 + Math.cos(a) * sp * u * 1.6, py = ST.back + 10 + Math.sin(a) * sp * u - 30 * u * u;
        x.beginPath(); x.arc(px, py, 10 + 30 * u, 0, TAU); x.fillStyle = `rgba(210,195,165,${0.28 * (1 - u / 1.2)})`; x.fill();
      }
    }
    // grenadiers (descendus sous la scène pendant l'effondrement)
    for (const [gx, d] of [[220, 1], [860, -1]]) {
      const s = easeIn((t - E.sinkGuard) / 0.5);
      clipAbove(ST.slotF, () => M.puppet(C.grenadier, { dy: 520 * s + Math.sin(t * 2 + gx) * 1.2, tilt: -d * 0.25 * s * d, ang: { armF_up: -0.05, armF_lo: -0.15, musket: 0.2 }, face: { brow: s > 0 ? 'up' : 'n', eyes: s > 0 ? 'wide' : 'open' } }, gx, FEET, 1, { dir: d, slot: ST.slotF, cast }));
    }
    // Napoléon (habit vert) : fier, puis s'affaisse
    const sl = smooth(E.collapse + 0.1, E.collapse + 0.5, t);
    M.puppet(C.napoleon, { tuck: true, dy: Math.sin(t * 2) * 1.2 + 6 * sl, tilt: 0.08 * sl, ang: { armF_up: 0.18, armF_lo: -1.85, armB_up: 0.35, armB_lo: -0.4, head: lerp(-0.1, 0.32, sl) }, face: { brow: sl > 0.3 ? 'worry' : 'frown', eyes: sl > 0.3 ? 'half' : 'open', mouth: sl > 0.3 ? 'tight' : 'n' } }, 540, FEET, 1.05, { dir: 1, slot: ST.slotF, cast });
    M.stageLight(t, { spot: { x: 540, y: 1050, r: 460, a: 0.42 } });
  }

  // ======================= 2. Sainte-Hélène =======================
  const NX = 382, NS = 0.8;
  function sea(t, fly) {
    const x = ctx();
    const sink = 700 * easeIn(fly);
    // soleil sur son fil
    if (t < E.sun1 + 0.1) { const u = smooth(E.sun0, E.sun1, t); M.sun(770, lerp(800, 1320, u), 78, t); }
    const wv = (i, base) => M.flat(K.waves[i], 540 + Math.sin(t * (1.1 + i * 0.15) + i * 1.7) * (26 - i * 3) * (i % 2 ? -1 : 1), base + Math.sin(t * 1.6 + i) * 5 + sink * (0.55 + i * 0.1));
    wv(0, 1500);
    // rocher qui monte de la trappe, avec Napoléon dessus
    const rp = easeOut((t - E.rock0) / (E.rock1 - E.rock0));
    const rockY = 1500 + (1 - rp) * 640 + wob(t, E.rock1, -10, 2.4, 6) + sink;
    const dyRock = rockY - 1500;
    // Napoléon (redingote grise)
    const hatUp = smooth(E.hat0, E.hat1, t), hatMove = smooth(E.hat1, E.hat2, t), armBack = smooth(E.hat2, E.hat3, t);
    const sk = easeIn((t - E.sink0) / (E.sink1 - E.sink0));
    const napPose = { costume: 'gris', tuck: true, dy: Math.sin(t * 1.8) * 1.0 + 470 * sk, tilt: -0.2 * smooth(E.sink0, E.sink0 + 0.3, t), ang: { armF_up: 0.18, armF_lo: -1.85, armB_up: 0.35, armB_lo: -0.4, head: lerp(-0.12, 0.1, smooth(E.hat2, E.sink0, t)) }, face: { brow: 'worry', eyes: t > E.sink0 - 0.1 ? 'closed' : t > E.hat2 ? 'half' : 'open', mouth: 'tight' } };
    const feetY = 958 + dyRock;
    // bicorne : sur la tête, puis dans la main, puis posé sur le rocher
    const m0 = M.partMatrices(C.napoleon, napPose, NX, feetY, NS, 1).mats;
    const onHead = M.wpt(m0.hat, 0, 0);
    const rest = [488, 960 + dyRock];
    let hat = onHead, hatRot = -0.06;
    if (t > E.hat1) {
      const lifted = [onHead[0] + 20, onHead[1] - 26];
      const u = hatMove;
      hat = [lerp(lifted[0], rest[0], u), lerp(lifted[1], rest[1], u) - Math.sin(Math.PI * u) * 30];
      hatRot = lerp(-0.2, 0.04, u);
    }
    const reachK = hatUp * (1 - armBack);
    if (reachK > 0.001) {
      const tgt = t > E.hat1 ? [hat[0] - 8, hat[1] - 22] : [lerp(NX + 40, onHead[0] + 4, hatUp), lerp(feetY - 230, onHead[1] - 24, hatUp)];
      const sol = M.ik(C.napoleon, Object.assign({}, napPose, { tuck: false }), NX, feetY, NS, 1, 'armF', tgt, 1);
      napPose.tuck = false; napPose.handF = 'fist';
      napPose.ang.armF_up = lerp(0.18, sol.up, reachK); napPose.ang.armF_lo = lerp(-1.85, sol.lo, reachK);
      if (reachK < 0.2 && t > E.hat2) napPose.tuck = true;
    }
    if (t > E.hat0) napPose.hide = { hat: 1 };
    if (sk < 0.999) M.puppet(C.napoleon, napPose, NX, feetY, NS, { dir: 1, slot: 1500, cast: { dx: 18, dy: 8, a: 0.22 } });
    M.flat(K.rock, 430, rockY, { cast });
    if (t > E.hat0) M.bicorne(hat[0], hat[1], NS, hatRot, 1);
    wv(1, 1540); wv(2, 1580); wv(3, 1625);
  }

  // ======================= 3. Paris, 1836 =======================
  const CROWD = [
    ['garde', 140, 1, 0.0, 'flag'], ['bourgeois', 212, 1, 0.7, 'hat'], ['dame', 280, 1, 1.4, null], ['grenadier', 346, 1, 2.1, null],
    ['grenadier', 662, -1, 0.4, null], ['dame', 728, -1, 1.1, null], ['bourgeois', 796, -1, 1.8, 'hat'], ['garde', 866, -1, 2.5, 'flag'],
  ];
  function paris(t) {
    const x = ctx();
    // le vrai arc descend des cintres sur ses câbles
    const p = easeOut((t - E.arc0) / (E.arc1 - E.arc0));
    const ay = ST.back - (1 - p) * 1250 + wob(t, E.arc1, -12, 2.2, 5.5);
    const rot = wob(t, E.arc1, 0.008, 1.6, 4) + 0.006 * Math.sin(t * 4) * (p < 1 ? 1 : 0);
    if (t > E.arc0 - 0.05) {
      x.strokeStyle = 'rgba(60,50,40,0.85)'; x.lineWidth = 2.2;
      for (const d of [-1, 1]) { const cx = ARCX + d * 360; x.beginPath(); x.moveTo(cx, ay - M.ARC.h * AS + 6); x.lineTo(cx + d * 4, 0); x.stroke(); }
      // drapeaux sur l'attique
      M.flat(K.vrai, ARCX, ay, { rot, scale: AS, clipY: ST.back + 1, cast: { dx: 18, dy: 8, a: 0.4 } });
      for (const [fx, ph] of [[ARCX - 300, 0], [ARCX - 40, 1.3], [ARCX + 220, 2.4]]) M.drapeau(fx, ay - M.ARC.h * AS + 2, 0.9, t, ph, 170);
    }
    M.drawFloor();
    // foule de marionnettes (monte de la fente arrière)
    for (const [kind, cx, d, ph, prop] of CROWD) {
      const u = easeOut((t - E.crowd0 - ph * 0.06) / (E.crowd1 - E.crowd0));
      if (u <= 0) continue;
      const bob = -Math.abs(Math.sin(t * 2.4 + ph)) * 5 * (t > E.crowd1 ? 1 : 0) * (1 - 0.7 * smooth(E.spot0, E.spot1, t));
      const dy = (1 - u) * 430 + bob;
      const def = C[kind], sc = kind === 'grenadier' ? 0.66 : 0.72;
      const pose = { dy: dy / sc, ang: {}, face: {} };
      if (kind === 'grenadier') pose.ang = { musket: 0.2 };
      if (prop === 'hat') { const w = Math.sin(t * 3 + ph) * 0.15 * (1 - smooth(E.spot0, E.spot1, t)); pose.ang.armF_up = -2.5 + w; pose.ang.armF_lo = -0.3; }
      if (prop === 'flag') { pose.ang.armF_up = -1.2; pose.ang.armF_lo = -1.1; }
      // tous tournent la tête vers la place vide
      pose.ang.head = 0.05 * Math.sin(t * 1.3 + ph) - 0.08 * smooth(E.spot0, E.spot1, t);
      clipAbove(ST.slotB, () => {
        const r = M.puppet(def, pose, cx, FEETB, sc, { dir: d, slot: ST.slotB, cast: { dx: 16, dy: 8, a: 0.22 } });
        if (prop === 'flag') { const hp = r.w('armF_lo', 0, 96); M.drapeau(hp[0] - d * 4, hp[1] + 60, 0.62, t, ph * 2, 200); }
      });
    }
    // la tige vide, à la place d'honneur… et le bicorne qui vient s'y poser
    const BS = 1.12;                          // même bicorne qu'au rocher (M.bicorne), un peu plus grand pour la lecture
    let rodTop = null, tilt = 0;
    if (t > E.rod0) {
      const u = easeOut((t - E.rod0) / (E.rod1 - E.rod0));
      rodTop = lerp(ST.slotF + 20, 1182, u) + wob(t, E.rod1, -8, 3, 7);
      tilt = 0.05 * smooth(8.75, 9.05, t) + wob(t, 9.05, 0.015, 1.8, 7);
      clipAbove(ST.slotF, () => {
        x.save(); x.translate(500, ST.slotF); x.rotate(tilt);
        const h = ST.slotF - rodTop;
        const g2 = x.createLinearGradient(-4, 0, 4, 0); g2.addColorStop(0, '#5b3d22'); g2.addColorStop(0.45, '#c8a06a'); g2.addColorStop(1, '#6e4a2a');
        x.fillStyle = g2; x.fillRect(-5.5, -h, 11, h);
        // ferrure d'attache (vide)
        x.fillStyle = '#8a7650'; x.fillRect(-13, -h - 6, 26, 40); x.strokeStyle = 'rgba(20,10,5,0.7)'; x.lineWidth = 1.4; x.strokeRect(-13, -h - 6, 26, 40);
        x.fillStyle = 'rgba(255,240,200,0.25)'; x.fillRect(-13, -h - 6, 26, 4);
        M.rivet(0, -h + 4, 4.2); M.rivet(0, -h + 22, 4.2);
        x.restore();
      });
      x.beginPath(); x.ellipse(500, ST.slotF, 7, 2.6, 0, 0, TAU); x.fillStyle = 'rgba(8,4,2,0.6)'; x.fill();
    }
    if (t > E.bic0) {
      // position du bord inférieur du bicorne (repère écran)
      const restY = (rodTop ?? 1182) + 4;
      let hx, hy, hr = 0.04, sq = 1;
      if (t < E.bicLand) {
        const u = (t - E.bic0) / (E.bicLand - E.bic0);
        hy = lerp(60, restY, 1 - Math.pow(1 - u, 2));
        hx = 500 + Math.sin(t * 5.5) * 5 * (1 - u);
        hr = 0.04 + 0.05 * Math.sin(t * 5.5 + 0.8) * (1 - u);
      } else {
        const v = t - E.bicLand;
        // petit rebond feutré + écrasement, puis repos sur la ferrure (suit la tige si elle penche)
        const b = Math.abs(Math.sin(v * 11)) * 16 * Math.exp(-7.5 * v);
        sq = 1 - 0.12 * Math.exp(-14 * v) * Math.cos(v * 22);
        const top = ST.slotF - restY;
        hx = 500 + Math.sin(tilt) * top; hy = ST.slotF - Math.cos(tilt) * top - b;
        hr = 0.04 + tilt + wob(t, E.bicLand, 0.06, 2.2, 6);
      }
      // fil + crochet : porte le bicorne, puis se décroche et remonte dans les cintres
      const hook = t < E.hook0 ? null : easeIn((t - E.hook0) / (E.hook1 - E.hook0));
      if (hook == null || hook < 1) {
        const top0 = [hx + Math.sin(hr) * 50 * BS, hy - Math.cos(hr) * 50 * BS];
        const hkY = hook == null ? top0[1] : lerp(top0[1], -40, hook) - 10 * hook;
        const hkX = hook == null ? top0[0] : lerp(top0[0], 500, hook);
        x.strokeStyle = 'rgba(20,15,10,0.6)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(hkX, hkY - 8); x.lineTo(500, -10); x.stroke();
        x.strokeStyle = '#8d6a2c'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(hkX, hkY - 9); x.lineTo(hkX, hkY - 2); x.arc(hkX + 4, hkY - 2, 4, Math.PI, 0.2 * Math.PI, true); x.stroke();
      }
      x.save(); x.translate(hx, hy); x.scale(1 / sq * 0.5 + 0.5, sq); x.translate(-hx, -hy);
      M.bicorne(hx, hy, BS, hr, 1);
      x.restore();
    }
    // la couronne qui descend… sur personne
    if (t > E.crown0) {
      const u = easeOut((t - E.crown0) / (E.crown1 - E.crown0));
      M.hung(K.crown, 500, lerp(150, 1112, u) + wob(t, E.crown1, -6, 2.2, 6), t, { amp: 0.012 + 0.04 * Math.exp(-3 * Math.max(0, t - E.crown1)), f: 2.2 });
    }
    const sp = smooth(E.spot0, E.spot1, t);
    M.stageLight(t, { spot: { x: 500, y: lerp(1060, 1140, sp), r: lerp(500, 250, sp), a: lerp(0.35, 0.72, sp) }, beamA: 1 - 0.5 * sp });
  }

  // ======================= montage =======================
  S.draw = (t) => {
    const x = ctx();
    if (t < E.swap) empire(t);
    else {
      const fly = smooth(E.fly0, E.fly1, t);
      if (t > E.fly0 - 0.05) {
        x.drawImage(K.paris, 0, 0);
        M.flat(K.wingL, 120, ST.back, { cast }); M.flat(K.wingR, 960, ST.back, { cast });
        M.flat(K.row, 540, ST.back + (1 - fly) * 300);
      }
      if (fly < 1) x.drawImage(K.couchant, 0, -easeIn(fly) * 1500);
      if (t > E.arc0 - 0.05) { /* l'arc passe devant la toile du couchant qui remonte */ }
      if (fly < 1) {
        // décor de la mer (descend dans les dessous pendant le changement)
        sea(t, fly);
      }
      if (t > E.fly0) paris(t);
      else { M.drawFloor(); M.stageLight(t, { spot: { x: 450, y: 900, r: 460, a: 0.5 }, beamA: 0.5 }); }
    }
    // rideau : fermeture rapide, réouverture sur la mer
    let f = 1, swing = 0;
    if (t > E.close0 && t < E.open1 + 0.01) {
      if (t < E.open0) f = 1 - ease((t - E.close0) / (E.close1 - E.close0));
      else f = ease((t - E.open0) / (E.open1 - E.open0));
      swing = t < E.close1 ? 18 * Math.sin(Math.PI * (t - E.close0) / (E.close1 - E.close0)) : -14 * Math.sin(Math.PI * clamp((t - E.open0) / (E.open1 - E.open0)));
    }
    swing += wob(t, E.open1, 22, 0.9, 2.8);
    M.curtain(t, f, { swing });
    M.drawFrame(t);
  };
  return S;
})();
