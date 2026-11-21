// Small WebAudio bleeps, synthesized in code: no sound files, no network.
// The context is created on the first user gesture, so headless screenshots
// stay silent and error-free.
let context = null;
let muted = false;

function ensureContext() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    return null;
  }
  return context;
}

function blip(frequency, duration, type, volume) {
  if (muted) return;
  const audio = ensureContext();
  if (!audio) return;
  try {
    if (audio.state === 'suspended') void audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {
    // Sound is decoration: never let it break the game.
  }
}

export function playFound() {
  blip(880, 0.12, 'sine', 0.18);
  setTimeout(() => blip(1318, 0.18, 'sine', 0.18), 90);
}

export function playWrong() {
  blip(180, 0.2, 'square', 0.08);
}

export function playHint() {
  blip(660, 0.1, 'triangle', 0.12);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((frequency, i) => {
    setTimeout(() => blip(frequency, 0.22, 'sine', 0.18), i * 110);
  });
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
