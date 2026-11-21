// Shared constants for Lantern Garden, a spot-the-difference game.
// One canvas, 1280 x 720: a header, two 600 x 440 picture panels side by side,
// and a footer strip. All coordinates below are in canvas pixels.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const HEADER_HEIGHT = 64;
export const FOOTER_HEIGHT = 56;
export const PANEL_WIDTH = 600;
export const PANEL_HEIGHT = 440;
export const PANEL_GAP = 32;
export const LEFT_PANEL = { x: 24, y: HEADER_HEIGHT + 12 };
export const RIGHT_PANEL = { x: 24 + PANEL_WIDTH + PANEL_GAP, y: HEADER_HEIGHT + 12 };
export const ROUND_SECONDS = 180;
export const HINTS_PER_ROUND = 3;
export const POINTS_PER_FIND = 100;
export const WRONG_CLICK_PENALTY = 25;
export const HINT_COST = 50;
export const MARK_RADIUS = 34;
/** Fixed simulation step: the world advances in 1/60 s slices. */
export const STEP = 1 / 60;
