// The screenshot scenes behind ?shot=start|play|hunt|win. Each one plays the real
// rules forward from a fresh world, clicking real differences at their real
// coordinates, so every frame is what a short game really looks like and the
// same seed always gives the same frame.
import { SCREEN_TITLE, SCREEN_WIN } from './world.js';

/** Click the given difference ids of the current round, in panel-local coordinates. */
function findDiffs(world, ids) {
  for (const id of ids) {
    const diff = world.roundDiffs().find((d) => d.id === id);
    if (diff) world.clickAt(diff.x, diff.y);
  }
}

function setClock(world, elapsedSeconds) {
  world.state.elapsed = elapsedSeconds;
  world.state.timeLeft = Math.max(0, 180 - elapsedSeconds);
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the
 * best score to show.
 */
export function stageShot(name, world) {
  const { state } = world;
  if (name === 'play') {
    world.startGame();
    findDiffs(world, ['lantern', 'koi', 'bird']);
    world.clickAt(120, 250); // a wrong guess, left as a red cross
    setClock(world, 42);
    state.score = 275; // 3 finds, one wrong click
    state.hintsLeft = 2;
    return { screen: 'play', best: 0 };
  }
  if (name === 'hunt') {
    world.startGame();
    world.resetRound(1);
    world.state.screen = 'play';
    findDiffs(world, ['butterfly', 'blossom', 'window', 'flag', 'plank', 'cat']);
    setClock(world, 118);
    state.score = 640;
    state.hintsLeft = 1;
    state.hintAt = world.roundDiffs().find((d) => d.id === 'lily');
    state.hintUntil = state.elapsed + 2.5;
    state.message = 'Hint: look near the pond… (−50)';
    state.messageUntil = state.elapsed + 2.5;
    return { screen: 'play', best: 640 };
  }
  if (name === 'win') {
    world.startGame();
    for (let round = 0; round < 3; round += 1) {
      for (const diff of world.roundDiffs()) world.clickAt(diff.x, diff.y);
      if (round < 2) world.nextRound();
    }
    state.screen = SCREEN_WIN;
    state.score = 2450;
    state.totalFound = 21;
    return { screen: SCREEN_WIN, best: 2450 };
  }
  world.resetRound(0);
  state.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE, best: 1250 };
}
