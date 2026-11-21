# 🏮 Lantern Garden — Spot the Difference

An original spot-the-difference game, built for the make.fun bounty
`best-spot-the-difference-game-20261121-0451`. Two pictures of the same
garden hang side by side; seven things changed between them. Find them all
before the lanterns burn down.

**Play it free here:** https://make.fun/r/wgc13ay6

## How to play

- Open `game/index.html` in desktop Chrome (or serve `game/` with any static
  server — `node serve.ts`, then http://localhost:8080). No network, no build.
- **Click** a difference on either picture, or move the crosshair with the
  **arrow keys** and press **Enter** / **Space**. **Tab** switches pictures.
- **H** asks for a hint (3 per round, −50 points). **R** restarts. **M** mutes.
- Each find is +100, a wrong click −25, finishing a round early earns a time
  bonus. Three rounds — dawn, midday, dusk — seven differences each, 180
  seconds a round.

## The differences

Round 1 — Dawn in the Lantern Garden: the pagoda lantern, an extra koi, a
flower that turned blue, a missing cloud, a vanished bird, a missing pond
stone, the frog that left its lily pad.

Round 2 — Midday at the Koi Pond: a butterfly, a fallen blossom cluster, a
dark pagoda window, a flag that changed colour, a missing bridge plank, the
garden cat, a sunken lily pad.

Round 3 — Dusk in the Lantern Garden: the blue flower again, the bird, the
butterfly, the flag, the bridge plank, the lily pad and the pond stone — the
garden at dusk, fireflies and all.

## The game

- All art is drawn in code (`game/src/scenes.js`) — no image, sound or font
  files, nothing loaded over the network. Sounds are WebAudio bleeps
  synthesized in `game/src/sound.js`.
- Source is split by job: `config.js` (layout), `random.js` (seeded random),
  `scenes.js` (the painted garden), `world.js` (rules and state), `input.js`
  (mouse + keyboard), `render.js` (everything on screen), `sound.js`,
  `shots.js` (the four staged screenshot scenes), `main.js` (boot + loop).
- Screenshots in `screenshots/` are real renders of this code, staged by
  `?shot=start|play|hunt|win` and taken in headless Chrome.

## License

MIT — see `LICENSE`.
