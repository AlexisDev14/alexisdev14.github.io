# persos.md — « [Titre de la vidéo] » : mode d'emploi de `persos.js`

<!-- Gabarit rempli par l'agent casting APRÈS sa dernière itération, d'après le code réel. Seul document lu par les agents des plans :
     tout ce qu'il faut pour appeler une pièce doit y être. 150 lignes au plus. Les exemples entre « ex. » viennent du Téflon : les remplacer. -->

Espace de noms : `M.[xxx]` (alias `[XXX]`). Dans `S.init` : `[XXX].init()` (pré-rendus : [liste]).
Repères : `(x,y)` = pieds pour une marionnette, point indiqué pour un objet. Échelle conseillée entre parenthèses. Tailles en px **à l'écran** à cette échelle.

## Marionnettes (avec tige ; passer `slot: ST.slotF` ou `ST.slotB`)
Toujours par l'enveloppe `[XXX].nom(pose, x, y, s, o)` : elle prépare la pose (objet tenu, seconde main, gestes). Elle renvoie `r` (`r.w('pièce', x, y)` = point écran d'une pièce).

Options communes :
- `tenu` / `tenuB` : objet dans la main avant / arrière : [valeurs permises] ; `tenuO` / `tenuBO` : options de cet objet (les mêmes que l'objet seul).
- `droit` / `droitB` : `true` par défaut quand un objet est tenu (il reste droit à l'écran) ; `false` = il suit l'avant-bras ; `ang.objet` le tourne.
- `deuxMains` : la main arrière vient d'elle-même sur la seconde prise.
- `handF` / `handB` : `'fist'` | `'open'` ; `face` : `{ brow, mouth, eyes }` ; `t` (animations internes).
- Point nommé de l'objet tenu : `[XXX].pt(r, 'nom')` → `[x, y]` écran ([liste des points par objet]).

| Fonction | Échelle, taille | Pièces en plus | Options de geste (0..1 sauf mention) |
|---|---|---|---|
| ex. `TEF.plunkett` | 0,9 ≈ 480 px | `goggles`, `sangle` | `goggles` 0 front / 1 yeux ; `teteMain` (main sur le crâne) ; `reverence` (salut : buste plié, tête baissée) |
| … | | | |

Pièges : ex. « `colette` a la bouche souriante par défaut : `face.mouth:'n'` pour la neutraliser ».

## Accessoires (sans tige : ils volent)
Options communes : `o.dir` ±1, `o.rot` (rad, autour de `(x,y)`), `o.alpha`, `o.cast`, `o.ombre` (ombre au sol), `o.t`.

| Fonction | `(x,y)` = | Taille à l'échelle conseillée | Options |
|---|---|---|---|
| ex. `TEF.flacon(x,y,s,o)` | fond | 122 local (110 px à 0,9) | `bouchon` (true) ; `niveau` 0..1 ; `filet` 0..1 (filet vertical depuis le bec) ; `filetY` (y écran où il s'arrête) |
| … | | | |

## Décors (pré-rendus par `[XXX].init()`)
| Clé | Pose | Repères utiles |
|---|---|---|
| ex. `TEF.K.paillasse` | `M.flat(TEF.K.paillasse, TEF.PAILLASSE.cx, ST.back, {cast})` | dessus y 1150 ; étau `TEF.PAILLASSE.etau = {x:290, y:1110}` |
| … | | |

## Exemples d'appels qui marchent
Voir `<video>/casting/scene.js` (`grep -n '[XXX]\.' casting/scene.js`). Les trois appels les plus utiles :
```js
// ex. Plunkett qui tient le flacon droit, filet jusqu'au bocal
const r = TEF.plunkett({ t, tenu: 'flacon', tenuO: { filet: 1, filetY: 1180 }, ang: { armF_up: -1.2, armF_lo: -0.4 } }, 520, FEET, 0.9, { dir: 1, slot: ST.slotF, cast });
```
