// Everything on screen: the header, the two garden pictures, the found-difference
// rings, the hint pulse, the wrong-click crosses, the footer HUD and the title /
// round-clear / win / time-up overlays. All text is drawn on the canvas so the
// screenshots show the counter and the state of play.
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, HEADER_HEIGHT, FOOTER_HEIGHT,
  LEFT_PANEL, RIGHT_PANEL, PANEL_WIDTH, PANEL_HEIGHT,
} from './config.js';
import { PALETTES, ROUNDS, drawGarden } from './scenes.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_ROUND_CLEAR, SCREEN_WIN, SCREEN_TIME_UP,
} from './world.js';

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFoundRing(panel, diff, pulse) {
    const radius = diff.r + (pulse ? 6 + Math.sin(Date.now() / 150) * 4 : 0);
    ctx.strokeStyle = pulse ? '#ffd23f' : '#2fbf5a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(panel.x + diff.x, panel.y + diff.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(panel.x + diff.x, panel.y + diff.y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2fbf5a';
    ctx.beginPath();
    ctx.arc(panel.x + diff.x, panel.y + diff.y - radius - 4, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(panel.x + diff.x - 5, panel.y + diff.y - radius - 4);
    ctx.lineTo(panel.x + diff.x - 1, panel.y + diff.y - radius);
    ctx.lineTo(panel.x + diff.x + 6, panel.y + diff.y - radius - 8);
    ctx.stroke();
  }

  function drawPanels(world, seed) {
    const { state } = world;
    const palette = ROUNDS[state.roundIndex].palette;
    const applied = world.roundApplied();
    drawGarden(ctx, LEFT_PANEL.x, LEFT_PANEL.y, palette, new Set(), seed);
    drawGarden(ctx, RIGHT_PANEL.x, RIGHT_PANEL.y, palette, applied, seed);
    for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
      ctx.strokeStyle = '#3a2f2a';
      ctx.lineWidth = 4;
      ctx.strokeRect(panel.x - 2, panel.y - 2, PANEL_WIDTH + 4, PANEL_HEIGHT + 4);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ORIGINAL', LEFT_PANEL.x + 10, LEFT_PANEL.y + 22);
    ctx.textAlign = 'right';
    ctx.fillText('SPOT THE 7 DIFFERENCES', RIGHT_PANEL.x + PANEL_WIDTH - 10, RIGHT_PANEL.y + 22);
    ctx.textAlign = 'left';
    for (const diff of world.roundDiffs()) {
      if (!state.found.has(diff.id)) continue;
      drawFoundRing(LEFT_PANEL, diff, false);
      drawFoundRing(RIGHT_PANEL, diff, false);
    }
    if (state.hintAt) {
      drawFoundRing(LEFT_PANEL, state.hintAt, true);
      drawFoundRing(RIGHT_PANEL, state.hintAt, true);
    }
    for (const mark of state.wrongMarks) {
      for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
        ctx.strokeStyle = '#e83a3a';
        ctx.lineWidth = 4;
        const x = panel.x + mark.x;
        const y = panel.y + mark.y;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.moveTo(x + 10, y - 10);
        ctx.lineTo(x - 10, y + 10);
        ctx.stroke();
      }
    }
  }

  function drawHeader(world) {
    const { state } = world;
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(0, 0, CANVAS_WIDTH, HEADER_HEIGHT);
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏮 Lantern Garden — Spot the Difference', 24, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    const total = world.roundDiffs().length;
    const remaining = total - state.found.size;
    ctx.fillText(`🔍 ${remaining} of ${total} differences left`, CANVAS_WIDTH - 24, 34);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8a7a68';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Round ${state.roundIndex + 1} of ${ROUNDS.length} · ${PALETTES[ROUNDS[state.roundIndex].palette].name}`, 24, 56);
  }

  function drawFooter(world, muted) {
    const { state } = world;
    const y = CANVAS_HEIGHT - FOOTER_HEIGHT;
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(0, y, CANVAS_WIDTH, FOOTER_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    const timeColour = state.timeLeft <= 30 && state.screen === SCREEN_PLAY ? '#ff6b5e' : '#ffffff';
    ctx.fillStyle = timeColour;
    ctx.fillText(`⏱ ${formatTime(state.timeLeft)}`, 24, y + 35);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`⭐ Score ${state.score}`, 190, y + 35);
    ctx.fillText(`💡 Hints ${state.hintsLeft} (H)`, 380, y + 35);
    ctx.fillText(`✓ Found ${state.found.size}/${world.roundDiffs().length}`, 580, y + 35);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#c9b8a3';
    ctx.textAlign = 'right';
    ctx.fillText('Click a difference · Arrows + Enter · H hint · R restart · M sound ' + (muted ? 'off' : 'on'), CANVAS_WIDTH - 24, y + 34);
    ctx.textAlign = 'left';
    if (state.message && state.elapsed < state.messageUntil) {
      ctx.fillStyle = '#ffd97a';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message, CANVAS_WIDTH / 2, HEADER_HEIGHT + PANEL_HEIGHT + 34);
      ctx.textAlign = 'left';
    }
  }

  function overlay(title, lines, button) {
    ctx.fillStyle = 'rgba(20, 14, 10, 0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff8ec';
    roundRect(ctx, 340, 150, 600, 420, 18);
    ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, CANVAS_WIDTH / 2, 220);
    ctx.font = '19px sans-serif';
    let y = 272;
    for (const line of lines) {
      ctx.fillText(line, CANVAS_WIDTH / 2, y);
      y += 34;
    }
    if (button) {
      ctx.fillStyle = '#2fbf5a';
      roundRect(ctx, 520, 500, 240, 52, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(button, CANVAS_WIDTH / 2, 534);
    }
    ctx.textAlign = 'left';
  }

  function drawCursor(cursor) {
    if (!cursor.visible) return;
    const panel = cursor.panel === 0 ? LEFT_PANEL : RIGHT_PANEL;
    const x = panel.x + cursor.x;
    const y = panel.y + cursor.y;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 22, y);
    ctx.lineTo(x - 10, y);
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 22, y);
    ctx.moveTo(x, y - 22);
    ctx.lineTo(x, y - 10);
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x, y + 22);
    ctx.stroke();
  }

  function draw(world, screen, best, cursor, muted) {
    const { state } = world;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#241a12';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (screen === SCREEN_TITLE) {
      drawPanels(world, state.seed);
      drawHeader(world);
      drawFooter(world, muted);
      overlay('🏮 Lantern Garden', [
        'Two pictures of the same garden. Seven things changed.',
        'Find them all before the lanterns burn down!',
        '',
        'Click a difference on either picture, or move with',
        'the arrow keys and press Enter. H asks for a hint.',
        '',
        `Best score: ${best}   ·   3 rounds · 7 differences each`,
      ], '▶  Start');
      return;
    }
    drawPanels(world, state.seed);
    drawHeader(world);
    drawFooter(world, muted);
    if (screen === SCREEN_PLAY) drawCursor(cursor);
    if (screen === SCREEN_ROUND_CLEAR) {
      overlay('Round clear! 🎉', [
        `You found all ${world.roundDiffs().length} differences.`,
        `Score so far: ${state.score}`,
        state.roundIndex + 1 < ROUNDS.length
          ? 'The garden changes with the light — next round ahead.'
          : 'That was the last garden…',
      ], state.roundIndex + 1 < ROUNDS.length ? '▶  Next round  (N)' : '▶  See results  (N)');
    } else if (screen === SCREEN_WIN) {
      overlay('You found them all! 🏮🎉', [
        `Every difference in every garden — ${state.totalFound} in all.`,
        `Final score: ${state.score}   ·   Best: ${Math.max(best, state.score)}`,
        'Thanks for wandering the Lantern Garden.',
      ], '↻  Play again  (R)');
    } else if (screen === SCREEN_TIME_UP) {
      overlay("Time's up!", [
        `You found ${state.found.size} of ${world.roundDiffs().length} differences this round.`,
        `Score: ${state.score}`,
        'The lanterns burned down — try the round again.',
      ], '↻  Retry round  (R)');
    }
  }

  return { draw };
}
