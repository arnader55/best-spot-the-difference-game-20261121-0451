// Mouse and keyboard input. Clicks land on either picture panel and are
// reported in panel-local coordinates; the keyboard drives a crosshair so the
// whole game is playable without a mouse too.
import { LEFT_PANEL, RIGHT_PANEL, PANEL_WIDTH, PANEL_HEIGHT } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_HINT = 2;
export const ACTION_RESTART = 4;
export const ACTION_NEXT = 8;
export const ACTION_MUTE = 16;

export function createInput(canvas) {
  let actions = 0;
  let click = null;
  const cursor = { x: PANEL_WIDTH / 2, y: PANEL_HEIGHT / 2, panel: 0, visible: false };

  function panelAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    for (const [index, panel] of [LEFT_PANEL, RIGHT_PANEL].entries()) {
      if (x >= panel.x && x < panel.x + PANEL_WIDTH && y >= panel.y && y < panel.y + PANEL_HEIGHT) {
        return { x: x - panel.x, y: y - panel.y, panel: index };
      }
    }
    return null;
  }

  canvas.addEventListener('pointerdown', (event) => {
    const hit = panelAt(event.clientX, event.clientY);
    if (hit) {
      click = hit;
      cursor.x = hit.x;
      cursor.y = hit.y;
      cursor.panel = hit.panel;
      cursor.visible = true;
    }
  });
  canvas.addEventListener('pointermove', (event) => {
    const hit = panelAt(event.clientX, event.clientY);
    if (hit) {
      cursor.x = hit.x;
      cursor.y = hit.y;
      cursor.panel = hit.panel;
      cursor.visible = true;
    }
  });

  window.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 40 : 12;
    if (event.key === 'ArrowLeft') { cursor.x = Math.max(0, cursor.x - step); cursor.visible = true; event.preventDefault(); }
    else if (event.key === 'ArrowRight') { cursor.x = Math.min(PANEL_WIDTH, cursor.x + step); cursor.visible = true; event.preventDefault(); }
    else if (event.key === 'ArrowUp') { cursor.y = Math.max(0, cursor.y - step); cursor.visible = true; event.preventDefault(); }
    else if (event.key === 'ArrowDown') { cursor.y = Math.min(PANEL_HEIGHT, cursor.y + step); cursor.visible = true; event.preventDefault(); }
    else if (event.key === 'Tab') { cursor.panel = 1 - cursor.panel; cursor.visible = true; event.preventDefault(); }
    else if (event.key === 'Enter' || event.key === ' ') { actions |= ACTION_CONFIRM; event.preventDefault(); }
    else if (event.key === 'h' || event.key === 'H') actions |= ACTION_HINT;
    else if (event.key === 'r' || event.key === 'R') actions |= ACTION_RESTART;
    else if (event.key === 'n' || event.key === 'N') actions |= ACTION_NEXT;
    else if (event.key === 'm' || event.key === 'M') actions |= ACTION_MUTE;
  });

  return {
    cursor,
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
