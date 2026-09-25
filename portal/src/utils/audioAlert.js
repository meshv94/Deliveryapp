/**
 * Web Audio API Sound Synthesizer for Kitchen & Store Alerts
 * Generates clear, high-contrast notification tones without external audio file dependencies.
 */

let audioCtx = null;
let activeLoopInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const isAudioMuted = () => {
  try {
    return localStorage.getItem('aapnubazaar_portal_muted') === 'true';
  } catch {
    return false;
  }
};

export const setAudioMuted = (muted) => {
  try {
    localStorage.setItem('aapnubazaar_portal_muted', muted ? 'true' : 'false');
  } catch {}
};

/**
 * Play a pleasant 3-note order arrival chime (E5 -> G#5 -> B5)
 */
export const playOrderChime = () => {
  if (isAudioMuted()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, time: now, dur: 0.15 },       // E5
      { freq: 830.61, time: now + 0.12, dur: 0.18 }, // G#5
      { freq: 987.77, time: now + 0.25, dur: 0.35 }, // B5
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, n.time);

      gain.gain.setValueAtTime(0.001, n.time);
      gain.gain.exponentialRampToValueAtTime(0.3, n.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(n.time);
      osc.stop(n.time + n.dur);
    });
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
};

/**
 * Play urgent pulsating kitchen ringer for unaccepted orders
 */
export const playUrgentAlert = () => {
  if (isAudioMuted()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.18].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now + delay); // A5

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.35, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  } catch (err) {
    console.warn('Urgent alert error:', err);
  }
};

/**
 * Start repeating audio loop for unacknowledged orders
 */
export const startNewOrderAlertLoop = () => {
  stopNewOrderAlertLoop();
  playOrderChime();
  activeLoopInterval = setInterval(() => {
    playOrderChime();
  }, 12000);
};

export const stopNewOrderAlertLoop = () => {
  if (activeLoopInterval) {
    clearInterval(activeLoopInterval);
    activeLoopInterval = null;
  }
};
