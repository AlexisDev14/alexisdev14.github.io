// persos.js — bibliothèque PROPRE À LA VIDÉO (copiée dans chaque plan par construire.sh).
// Chargée APRÈS marionnettes.js et AVANT scene.js. Tout dans une IIFE : un `const` global ici
// ferait planter scene.js (même portée globale que les autres scripts : « redeclaration »).
(function () {
  const X = M.X, P = M.P;
  const { fillPts, strokePts, dot, hatch, shade, piece } = M;
  const SKIN = '#e0bf9b', SKIND = '#c4a07c', BLOUSE = '#e9e4d6', BLOUSED = '#cdc6b2';

  // ---- silhouettes (repère de la pièce : origine = son rivet ; y vers le bas ; le personnage regarde vers +x)
  // blouse à mi-cuisse : même cou/épaules que les autres, mais descend jusqu'à y≈128 devant et derrière
  const CH_TORSO = [[-14, -176], [8, -180], [16, -168], [26, -150], [34, -112], [36, -60], [38, 0], [42, 70], [44, 128, 1],
    [-42, 130, 1], [-40, 60], [-38, 0], [-38, -60], [-37, -110], [-33, -150], [-26, -168]];
  // mèches de cheveux en pointe, posées sur la tête (pièce enfant de 'head', à l'origine du crâne)
  const CH_TUFT = [[-34, 6], [-40, -22], [-30, -18], [-30, -46, 1], [-20, -30], [-14, -58, 1], [-6, -34], [6, -52, 1], [12, -26], [26, -34, 1], [28, -6]];
  // fiole d'Erlenmeyer, goulot en haut (y négatif), centrée sur la main : origine = poing
  const FLASK = [[-6, -66], [6, -66], [6, -40], [28, 6], [30, 18, 1], [-30, 18, 1], [-28, 6], [-6, -40]];

  function mkChimiste() {
    const parts = {
      torso: { parent: null, at: [0, 0], pts: CH_TORSO, base: BLOUSE, seed: 301, paint: () => {
        fillPts([[16, -176], [26, -150], [30, -110], [22, -100], [14, -140]], BLOUSED);            // revers du col
        strokePts([[18, -150], [22, -60], [24, 128]], 'rgba(90,80,60,0.55)', 1.4);                 // ligne de boutonnage
        for (const y of [-100, -50, 0, 50, 100]) dot(24, y, 2.3, '#8d8676');                       // boutons
        fillPts([[-6, -40], [22, -40], [22, -10], [-6, -10]], 'rgba(120,110,90,0.22)');           // poche
        strokePts([[-6, -40], [22, -40]], 'rgba(90,80,60,0.6)', 1.2);
        fillPts([[-4, -36], [6, -36], [6, -4], [-4, -4]], '#2f5f7c', 0, 0);                         // stylo… taché d'encre
        hatch([[-50, -170], [-12, -170], [-10, 130], [-50, 130]], 0.75, 4.2, 0.30);
        shade(40, 0, -40, 0, 0.28);
      } },
      legB: { parent: 'torso', at: [-6, -2], pts: X.legPts(0.95), base: '#6b6a70', seed: 302, noRivet: true, paint: () => {
        fillPts([[-40, 214], [60, 214], [60, 260], [-40, 260]], '#2a2020'); hatch(null, 0.8, 3.5, 0.3);
      } },
      legF: { parent: 'torso', at: [6, -2], pts: X.legPts(0.95), base: '#85848a', seed: 303, paint: () => {
        fillPts([[-40, 214], [60, 214], [60, 260], [-40, 260]], '#3a2c28');
        hatch([[-26, -20], [-6, -20], [-6, 214], [-26, 214]], 0.8, 4, 0.25);
      } },
      armB_up: { parent: 'torso', at: [-10, -146], pts: X.armPts(94), base: BLOUSED, seed: 304, paint: () => hatch(null, 0.8, 3.6, 0.3) },
      armB_lo: { parent: 'armB_up', at: [0, 94], pts: () => X.forePts('fist'), base: BLOUSED, seed: 305, paint: () => {
        fillPts([[-20, 76], [20, 76], [24, 130], [-20, 130]], SKIND); hatch(null, 0.8, 3.6, 0.25);
      } },
      head: { parent: 'torso', at: [6, -170], pts: X.NAP_HEAD, base: SKIN, seed: 306, noRivet: true, paint: (pose) => {
        const f = pose.face || {};
        fillPts([[30, -112], [26, -80], [10, -76], [-12, -66], [-20, -36], [-44, -28], [-44, -112]], '#b9b6ae', 3);   // cheveux gris
        X.earPaint(-8, -44);
        hatch([[-22, -42], [2, -30], [12, -10], [-6, 18], [-32, 4]], 0.6, 3.6, 0.3);
        dot(14, -32, 9, 'rgba(205,130,110,0.22)');
        X.eye(f, 17, -52); X.brow(f, 17, -60, 'rgba(110,108,100,0.95)', 2.6); X.mouth(f, 27, -27);
        // lunettes rondes : monture + reflet
        const ring = []; for (let i = 0; i < 14; i++) { const a = i / 14 * M.TAU; ring.push([19 + Math.cos(a) * 11, -52 + Math.sin(a) * 11]); }
        fillPts(ring, 'rgba(190,225,240,0.28)', 0, 0); strokePts(ring, '#3a3028', 1.8, true);
        strokePts([[8, -52], [-30, -56]], '#3a3028', 1.5);                                         // branche vers l'oreille
        strokePts([[14, -58], [20, -60]], 'rgba(255,255,255,0.7)', 1.3);
      } },
      tuft: { parent: 'head', at: [-4, -78], pts: CH_TUFT, base: '#cfccc4', seed: 307, noRivet: true, paint: () => hatch(null, 1.2, 3.2, 0.3) },
      armF_up: { parent: 'torso', at: [-2, -146], pts: X.armPts(94), base: BLOUSE, seed: 308, paint: () => hatch([[-16, -20], [-3, -20], [-3, 100], [-16, 100]], 0.9, 3.8, 0.3) },
      armF_lo: { parent: 'armF_up', at: [0, 94], pts: (p) => X.forePts(p.handF || 'fist'), base: BLOUSE, seed: 309, paint: (p) => {
        fillPts([[-20, 76], [20, 76], [24, 130], [-20, 130]], SKIN); X.handPaint(null, p.handF || 'fist');
        fillPts([[-15, 62], [15, 62], [17, 80], [-15, 80]], BLOUSED);                              // poignet de blouse
      } },
      // accessoire : fiole tenue au poing (enfant de l'avant-bras). pose.ang.flask la garde verticale ; pose.t anime le liquide
      flask: { parent: 'armF_lo', at: [4, 96], pts: FLASK, base: 'rgba(200,230,240,0.55)', seed: 310, noRivet: true, texA: 0.25,
        paint: (p) => {
          fillPts([[-34, -2 + 3 * Math.sin((p.t || 0) * 6)], [34, 2 - 3 * Math.sin((p.t || 0) * 6)], [34, 22], [-34, 22]], '#4fae7a');   // liquide qui clapote
          strokePts([[-20, 8], [-12, -4]], 'rgba(255,255,255,0.6)', 1.6);
        },
        extra: (p) => {
          if (M._sil()) return;                                                                     // tout dessin brut doit être gardé ainsi
          const t = p.t || 0, ctx = M.ctx();
          for (let i = 0; i < 4; i++) {                                                              // bulles qui montent hors du goulot
            const u = (t * 0.9 + i * 0.27) % 1;
            ctx.beginPath(); ctx.arc(Math.sin(t * 3 + i * 2) * 3 + (i - 1.5) * 2, -66 - u * 46, 3.5 * (1 - u * 0.5), 0, M.TAU);
            ctx.fillStyle = `rgba(150,230,190,${0.8 * (1 - u)})`; ctx.fill();
          }
        } },
    };
    return { hipY: -238, parts, handLen: 104, rod: { part: 'torso', at: [-26, 18] },
      order: ['armB_up', 'armB_lo', 'legB', 'legF', 'head', 'tuft', 'torso', 'armF_up', 'armF_lo', 'flask'] };
  }
  M.chars.chimiste = mkChimiste();     // M.init() (makeChars) n'efface pas M.chars : l'ajout au chargement suffit
})();
