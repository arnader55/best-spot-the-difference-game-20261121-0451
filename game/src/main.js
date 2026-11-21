// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. The game moves between
// five screens: title, play, round-clear, win and time-up.
//
// ?seed=N fixes the garden's decorative specks. ?shot=start|play|hunt|win (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld, SCREEN_TITLE, SCREEN_PLAY, SCREEN_ROUND_CLEAR, SCREEN_WIN, SCREEN_TIME_UP,
} from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_NEXT, ACTION_RESTART, ACTION_MUTE, createInput } from './input.js';
import { createRenderer } from './render.js';
import { playFound, playWrong, playHint, playWin, toggleMute, isMuted } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped, not replayed. */
const MAX_FRAME = 0.25;
const BEST_KEY = 'lantern-garden-best';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best, { visible: false, x: 0, y: 0, panel: 0 }, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.startGame();
    screen = SCREEN_PLAY;
    announce('Playing. Find 7 differences before time runs out.');
  }

  function endRound() {
    if (world.state.screen === SCREEN_WIN) {
      screen = SCREEN_WIN;
      if (world.state.score > best) {
        best = world.state.score;
        saveBest(best);
      }
      playWin();
      announce(`You found them all! Final score ${world.state.score}.`);
    } else {
      screen = SCREEN_ROUND_CLEAR;
      playWin();
      announce(`Round clear. Score ${world.state.score}.`);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_WIN) startGame();
      else if (screen === SCREEN_ROUND_CLEAR) endRound();
      else if (screen === SCREEN_TIME_UP) {
        world.resetRound(world.state.roundIndex);
        world.state.screen = SCREEN_PLAY;
        screen = SCREEN_PLAY;
      } else if (screen === SCREEN_PLAY && input.cursor.visible) {
        const result = world.clickAt(input.cursor.x, input.cursor.y);
        if (result === 'found') playFound();
        else if (result === 'wrong') playWrong();
      }
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      if (world.useHint()) playHint();
    }
    if (actions & ACTION_NEXT && (screen === SCREEN_ROUND_CLEAR || screen === SCREEN_WIN)) {
      if (screen === SCREEN_ROUND_CLEAR) {
        world.nextRound();
        screen = world.state.screen === SCREEN_WIN ? SCREEN_WIN : SCREEN_PLAY;
        if (screen === SCREEN_WIN) endRound();
      }
    }
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) startGame();
  }

  function handleClick() {
    const click = input.takeClick();
    if (!click) return;
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN) {
      startGame();
      return;
    }
    if (screen === SCREEN_ROUND_CLEAR) {
      world.nextRound();
      screen = world.state.screen === SCREEN_WIN ? SCREEN_WIN : SCREEN_PLAY;
      if (screen === SCREEN_WIN) endRound();
      return;
    }
    if (screen === SCREEN_TIME_UP) {
      world.resetRound(world.state.roundIndex);
      world.state.screen = SCREEN_PLAY;
      screen = SCREEN_PLAY;
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const result = world.clickAt(click.x, click.y);
    if (result === 'found') {
      playFound();
      if (world.state.screen === SCREEN_ROUND_CLEAR) endRound();
    } else if (result === 'wrong') {
      playWrong();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClick();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        world.step(STEP);
        accumulator -= STEP;
        if (world.state.screen === SCREEN_TIME_UP) {
          screen = SCREEN_TIME_UP;
          announce("Time's up.");
          break;
        }
        if (world.state.screen === SCREEN_ROUND_CLEAR) {
          endRound();
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, best, input.cursor, isMuted());
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      announce('Paused — tab hidden. The clock keeps running.');
    }
  });

  announce('Lantern Garden. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
