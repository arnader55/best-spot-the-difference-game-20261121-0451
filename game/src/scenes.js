// The garden itself: every picture is painted in code, so the game needs no image
// files and no network. One base scene, three times of day (dawn, noon, dusk),
// and fourteen possible differences; each round hides seven of them in the
// right-hand picture. `drawGarden` paints one panel; the left panel gets no
// differences applied, the right panel gets the round's set.
//
// Panel-local coordinates: 600 wide, 440 tall. The pond fills the lower half,
// the pagoda stands on the right bank, the blossom tree on the left.
import { createRandom } from './random.js';

export const PANEL_W = 600;
export const PANEL_H = 440;

export const PALETTES = [
  {
    name: 'Dawn in the Lantern Garden',
    skyTop: '#ffd9a0', skyBottom: '#ffeef5', sun: '#ff9d5c', sunGlow: '#ffd27a',
    hill: '#9db98a', grass: '#7fae6d', water: '#7fc4c9', waterDeep: '#4f9aa5',
    roof: '#b8452f', wall: '#f2e3c6', tree: '#5d7a45', blossom: '#ffb7c9',
  },
  {
    name: 'Midday at the Koi Pond',
    skyTop: '#7ec8f2', skyBottom: '#dff3ff', sun: '#fff3a0', sunGlow: '#fff9c9',
    hill: '#7fb069', grass: '#5da24f', water: '#4fb3d9', waterDeep: '#2b7fa8',
    roof: '#a63a28', wall: '#f7ead0', tree: '#3f7038', blossom: '#ff9ebb',
  },
  {
    name: 'Dusk in the Lantern Garden',
    skyTop: '#5b4a8a', skyBottom: '#f2a56b', sun: '#ffe9b0', sunGlow: '#fff3c4',
    hill: '#5d5470', grass: '#4d7a52', water: '#3d7f9e', waterDeep: '#275a75',
    roof: '#8e2f22', wall: '#e8d3ae', tree: '#2f5230', blossom: '#e58aa5',
  },
];

/**
 * Every difference: where it is (panel-local centre + hit radius), what it is
 * called in the dossier, and which rounds hide it. The right picture applies
 * the change; the left picture is always the original.
 */
export const DIFFERENCES = [
  { id: 'lantern', x: 452, y: 168, r: 30, label: 'the paper lantern by the pagoda is gone' },
  { id: 'koi', x: 305, y: 352, r: 34, label: 'an extra orange koi swims in the pond' },
  { id: 'flower', x: 92, y: 408, r: 26, label: 'a red flower turned blue' },
  { id: 'cloud', x: 128, y: 58, r: 42, label: 'a cloud drifted away' },
  { id: 'bird', x: 332, y: 88, r: 26, label: 'a bird vanished from the sky' },
  { id: 'stone', x: 522, y: 388, r: 26, label: 'a flat stone is missing from the pond edge' },
  { id: 'frog', x: 182, y: 318, r: 28, label: 'the frog left its lily pad' },
  { id: 'butterfly', x: 252, y: 132, r: 26, label: 'a butterfly flew away' },
  { id: 'blossom', x: 82, y: 178, r: 34, label: 'a blossom cluster fell from the tree' },
  { id: 'window', x: 497, y: 208, r: 22, label: 'the pagoda window went dark' },
  { id: 'flag', x: 500, y: 96, r: 24, label: 'the pagoda flag changed colour' },
  { id: 'plank', x: 300, y: 318, r: 28, label: 'a plank is missing from the bridge' },
  { id: 'cat', x: 545, y: 292, r: 28, label: 'the garden cat wandered off' },
  { id: 'lily', x: 352, y: 372, r: 32, label: 'a lily pad sank beneath the pond' },
];

/** The seven differences hidden in each round (by DIFFERENCES index). */
export const ROUNDS = [
  { palette: 0, diffs: [0, 1, 2, 3, 4, 5, 6] },
  { palette: 1, diffs: [7, 8, 9, 10, 11, 12, 13] },
  { palette: 2, diffs: [2, 4, 7, 10, 11, 13, 5] },
];

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function cloud(ctx, x, y, scale, colour) {
  ctx.fillStyle = colour;
  ellipse(ctx, x, y, 34 * scale, 16 * scale);
  ellipse(ctx, x - 22 * scale, y + 5 * scale, 22 * scale, 12 * scale);
  ellipse(ctx, x + 24 * scale, y + 5 * scale, 24 * scale, 13 * scale);
}

function koi(ctx, x, y, angle, colour, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(flip ? -1 : 1, 1);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(-34, -9);
  ctx.lineTo(-34, 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 8, -3, 6, 4);
  ctx.fillStyle = '#222222';
  ellipse(ctx, 14, -2, 2, 2);
  ctx.restore();
}

function lantern(ctx, x, y, glow) {
  if (glow) {
    ctx.fillStyle = 'rgba(255, 190, 90, 0.35)';
    ellipse(ctx, x, y, 34, 38);
  }
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = '#e8543f';
  ellipse(ctx, x, y, 16, 20);
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(x - 16, y - 4, 32, 8);
  ctx.fillStyle = '#8e2f22';
  ctx.fillRect(x - 6, y - 24, 12, 5);
  ctx.fillRect(x - 6, y + 19, 12, 5);
}

function flower(ctx, x, y, colour) {
  ctx.strokeStyle = '#3f7038';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 14);
  ctx.stroke();
  ctx.fillStyle = colour;
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    ellipse(ctx, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, 6);
  }
  ctx.fillStyle = '#f7c948';
  ellipse(ctx, x, y, 4, 4);
}

/**
 * Paint one panel of the garden. `applied` is the set of difference ids changed
 * in this picture (empty for the left picture). `seed` keeps decorative specks
 * identical between the two pictures.
 */
export function drawGarden(ctx, ox, oy, paletteIndex, applied, seed) {
  const p = PALETTES[paletteIndex];
  const has = (id) => applied.has(id);
  const rand = createRandom(seed);
  ctx.save();
  ctx.translate(ox, oy);

  // Sky, sun and hills.
  const sky = ctx.createLinearGradient(0, 0, 0, PANEL_H);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(1, p.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
  ctx.fillStyle = p.sunGlow;
  ellipse(ctx, 512, 62, 46, 46);
  ctx.fillStyle = p.sun;
  ellipse(ctx, 512, 62, 34, 34);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  if (!has('cloud')) cloud(ctx, 128, 58, 1, 'rgba(255,255,255,0.92)');
  cloud(ctx, 250, 38, 0.8, 'rgba(255,255,255,0.85)');
  cloud(ctx, 420, 96, 0.7, 'rgba(255,255,255,0.8)');
  ctx.fillStyle = p.hill;
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.quadraticCurveTo(150, 190, 320, 246);
  ctx.quadraticCurveTo(460, 290, 600, 240);
  ctx.lineTo(600, 300);
  ctx.lineTo(0, 300);
  ctx.closePath();
  ctx.fill();

  // Grass banks and the pond.
  ctx.fillStyle = p.grass;
  ctx.fillRect(0, 250, PANEL_W, 190);
  const water = ctx.createLinearGradient(0, 300, 0, PANEL_H);
  water.addColorStop(0, p.water);
  water.addColorStop(1, p.waterDeep);
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(300, 392, 310, 58, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(0, 392, PANEL_W, 48);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(60 + i * 130, 408 + (i % 2) * 12);
    ctx.quadraticCurveTo(120 + i * 130, 402 + (i % 2) * 12, 180 + i * 130, 408 + (i % 2) * 12);
    ctx.stroke();
  }

  // Blossom tree, left.
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(78, 180, 16, 90);
  ctx.beginPath();
  ctx.moveTo(86, 200);
  ctx.lineTo(150, 150);
  ctx.lineTo(158, 160);
  ctx.lineTo(96, 210);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = p.tree;
  ellipse(ctx, 92, 128, 78, 52);
  ellipse(ctx, 40, 158, 46, 34);
  ellipse(ctx, 148, 152, 50, 36);
  ctx.fillStyle = p.blossom;
  ellipse(ctx, 60, 118, 26, 18);
  ellipse(ctx, 120, 100, 24, 16);
  ellipse(ctx, 150, 138, 22, 15);
  if (!has('blossom')) ellipse(ctx, 82, 178, 26, 18);
  ellipse(ctx, 30, 168, 18, 12);

  // Pagoda, right bank.
  ctx.fillStyle = p.wall;
  ctx.fillRect(468, 168, 62, 96);
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(452, 172);
  ctx.lineTo(499, 132);
  ctx.lineTo(546, 172);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(460, 132);
  ctx.lineTo(499, 100);
  ctx.lineTo(538, 132);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(497, 66, 4, 36);
  ctx.fillStyle = has('flag') ? '#3f9e4d' : '#e8543f';
  ctx.beginPath();
  ctx.moveTo(501, 68);
  ctx.lineTo(528, 76);
  ctx.lineTo(501, 86);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = has('window') ? '#3a3f4a' : '#ffd97a';
  ctx.fillRect(487, 196, 20, 26);
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 2;
  ctx.strokeRect(487, 196, 20, 26);
  ctx.beginPath();
  ctx.moveTo(497, 196);
  ctx.lineTo(497, 222);
  ctx.stroke();

  // Hanging lantern by the pagoda (difference: gone on the right).
  if (!has('lantern')) lantern(ctx, 452, 168, paletteIndex === 2);

  // Arched bridge over the pond.
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(200, 352);
  ctx.quadraticCurveTo(300, 288, 400, 352);
  ctx.stroke();
  ctx.strokeStyle = '#a9743f';
  ctx.lineWidth = 6;
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const x = 200 + t * 200;
    const y = 352 - Math.sin(t * Math.PI) * 52;
    if (has('plank') && i === 2) continue;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 4);
    ctx.lineTo(x + 12, y - 4);
    ctx.stroke();
  }

  // Lily pads, stones, koi and the frog.
  ctx.fillStyle = '#3f9e4d';
  if (!has('lily')) ellipse(ctx, 352, 372, 30, 10);
  ellipse(ctx, 182, 318, 30, 10);
  ellipse(ctx, 448, 344, 26, 9);
  ctx.fillStyle = '#9a9a92';
  ellipse(ctx, 96, 396, 22, 9);
  if (!has('stone')) ellipse(ctx, 522, 388, 24, 10);
  ellipse(ctx, 560, 412, 18, 8);
  koi(ctx, 240, 400, 0.2, '#ff8c42', false);
  koi(ctx, 420, 414, -2.8, '#ffffff', true);
  if (has('koi')) koi(ctx, 305, 352, 1.2, '#ff8c42', false);
  if (!has('frog')) {
    ctx.fillStyle = '#58a34a';
    ellipse(ctx, 182, 312, 12, 9);
    ctx.fillStyle = '#222222';
    ellipse(ctx, 178, 308, 2, 2);
    ellipse(ctx, 186, 308, 2, 2);
  }

  // Sky life: bird and butterfly (differences: absent on the right).
  if (!has('bird')) {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(318, 88);
    ctx.quadraticCurveTo(326, 80, 332, 88);
    ctx.quadraticCurveTo(338, 80, 346, 88);
    ctx.stroke();
  }
  if (!has('butterfly')) {
    ctx.fillStyle = '#ff9ebb';
    ellipse(ctx, 246, 128, 7, 10);
    ellipse(ctx, 258, 128, 7, 10);
    ctx.fillStyle = '#333333';
    ctx.fillRect(250, 126, 3, 12);
  }

  // The garden cat, dozing on the right bank.
  if (!has('cat')) {
    ctx.fillStyle = '#e8a34d';
    ellipse(ctx, 545, 292, 18, 11);
    ellipse(ctx, 558, 282, 9, 9);
    ctx.beginPath();
    ctx.moveTo(552, 276);
    ctx.lineTo(554, 268);
    ctx.lineTo(558, 275);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(560, 275);
    ctx.lineTo(563, 267);
    ctx.lineTo(566, 275);
    ctx.closePath();
    ctx.fill();
  }

  // Flowers along the bottom edge.
  flower(ctx, 40, 408, '#e8543f');
  flower(ctx, 92, 408, has('flower') ? '#4f7de0' : '#e8543f');
  flower(ctx, 150, 414, '#f7c948');
  flower(ctx, 470, 410, '#e8543f');
  flower(ctx, 585, 404, '#f7c948');

  // Fireflies at dusk, identical in both pictures.
  if (paletteIndex === 2) {
    ctx.fillStyle = 'rgba(255, 240, 150, 0.9)';
    for (let i = 0; i < 14; i += 1) {
      ellipse(ctx, 60 + rand() * 480, 120 + rand() * 180, 2.5, 2.5);
    }
  }
  ctx.restore();
}
