// The game state: rounds, finds, timer, score, hints and wrong clicks.
// Pure logic, no drawing: render.js paints whatever this holds.
import { DIFFERENCES, ROUNDS } from './scenes.js';
import { HINTS_PER_ROUND, POINTS_PER_FIND, ROUND_SECONDS, WRONG_CLICK_PENALTY, HINT_COST, MARK_RADIUS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_ROUND_CLEAR = 'round-clear';
export const SCREEN_WIN = 'win';
export const SCREEN_TIME_UP = 'time-up';

export function createWorld(seed) {
  const state = {
    seed,
    screen: SCREEN_TITLE,
    roundIndex: 0,
    found: new Set(),
    wrongMarks: [],
    hintAt: null,
    hintUntil: 0,
    hintsLeft: HINTS_PER_ROUND,
    score: 0,
    totalFound: 0,
    timeLeft: ROUND_SECONDS,
    elapsed: 0,
    message: '',
    messageUntil: 0,
    best: 0,
    startedAt: 0,
  };

  function roundDiffs() {
    return ROUNDS[state.roundIndex].diffs.map((i) => DIFFERENCES[i]);
  }

  function roundApplied() {
    return new Set(roundDiffs().map((d) => d.id));
  }

  function resetRound(index) {
    state.roundIndex = index;
    state.found = new Set();
    state.wrongMarks = [];
    state.hintAt = null;
    state.hintsLeft = HINTS_PER_ROUND;
    state.timeLeft = ROUND_SECONDS;
    state.elapsed = 0;
    state.message = '';
  }

  function startGame() {
    state.score = 0;
    state.totalFound = 0;
    state.startedAt = Date.now();
    resetRound(0);
    state.screen = SCREEN_PLAY;
  }

  function nextRound() {
    if (state.roundIndex + 1 < ROUNDS.length) {
      resetRound(state.roundIndex + 1);
      state.screen = SCREEN_PLAY;
    } else {
      state.screen = SCREEN_WIN;
    }
  }

  function foundCount() {
    return state.found.size;
  }

  function remaining() {
    return roundDiffs().length - state.found.size;
  }

  /** A click at panel-local (x, y) on either picture. Returns 'found' | 'wrong' | 'already' | null. */
  function clickAt(x, y) {
    if (state.screen !== SCREEN_PLAY) return null;
    for (const diff of roundDiffs()) {
      if (state.found.has(diff.id)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      if (dx * dx + dy * dy <= diff.r * diff.r) {
        state.found.add(diff.id);
        state.totalFound += 1;
        state.score += POINTS_PER_FIND;
        state.message = `Found! ${diff.label}.`;
        state.messageUntil = state.elapsed + 2.5;
        if (remaining() === 0) {
          const bonus = Math.round(state.timeLeft) * 2;
          state.score += bonus;
          state.message = `Round clear! Time bonus +${bonus}.`;
          state.screen = SCREEN_ROUND_CLEAR;
        }
        return 'found';
      }
    }
    for (const mark of state.wrongMarks) {
      const dx = x - mark.x;
      const dy = y - mark.y;
      if (dx * dx + dy * dy <= MARK_RADIUS * MARK_RADIUS) return 'already';
    }
    state.wrongMarks.push({ x, y, at: state.elapsed });
    state.score = Math.max(0, state.score - WRONG_CLICK_PENALTY);
    state.message = 'Not a difference — minus 25.';
    state.messageUntil = state.elapsed + 2;
    return 'wrong';
  }

  /** Hint: briefly ring one difference still unfound. Costs points. */
  function useHint() {
    if (state.screen !== SCREEN_PLAY || state.hintsLeft <= 0) return null;
    const left = roundDiffs().filter((d) => !state.found.has(d.id));
    if (left.length === 0) return null;
    const diff = left[0];
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - HINT_COST);
    state.hintAt = diff;
    state.hintUntil = state.elapsed + 2.5;
    state.message = `Hint: look near the ${diff.label.split(' ').slice(-2).join(' ')}… (−${HINT_COST})`;
    state.messageUntil = state.elapsed + 2.5;
    return diff;
  }

  function step(dt) {
    if (state.screen !== SCREEN_PLAY) return;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, ROUND_SECONDS - state.elapsed);
    if (state.timeLeft <= 0) state.screen = SCREEN_TIME_UP;
    if (state.hintAt && state.elapsed > state.hintUntil) state.hintAt = null;
    state.wrongMarks = state.wrongMarks.filter((m) => state.elapsed - m.at < 1.2);
  }

  return {
    state, startGame, nextRound, resetRound, roundDiffs, roundApplied,
    foundCount, remaining, clickAt, useHint, step,
  };
}
