type Engine = {
  context: AudioContext;
  noise: AudioBuffer;
  output: AudioNode;
};

let engine: Engine | undefined;
let waking: Promise<void> | undefined;
let lastTapAt = 0;

// A mechanical clicker is two short metallic transients ("click-clack"),
// not a tone, so each click is a decaying noise burst rather than a beep.
const CLICKS = [
  { offset: 0, level: 2.2 },
  { offset: 0.035, level: 1.5 },
];
const BURST_SECONDS = 0.006;
// Band-pass around the range phone speakers reproduce best, so the click
// stays audible without sounding shrill.
const FILTER_FREQUENCY = 2600;
const FILTER_Q = 1;
// Schedule slightly ahead so the transient is not cut off by output latency.
const LOOKAHEAD_SECONDS = 0.01;
// A click that comes late marks the wrong behaviour, which is worse for the
// dog than no click at all; vibration still confirms the attempt.
const MAX_WAKE_DELAY_MS = 100;

/** A short percussive click, synthesized locally so it also works offline. */
export function clickerFeedback(success: boolean) {
  navigator.vibrate?.(success ? 30 : [20, 40, 20]);
  if (!success) return;
  try {
    if (!engine || engine.context.state === "closed") engine = createEngine();
  } catch {
    // Audio is optional on browsers that don't support Web Audio.
    engine = undefined;
    return;
  }
  const current = engine;
  if (current.context.state === "running") {
    playClick(current);
    return;
  }
  // Mobile browsers suspend the context on the first tap, screen lock or app
  // switch, and waking it takes tens of milliseconds. Scheduling before it runs
  // lets the short click finish in silence. resume() must still be called
  // synchronously inside the user gesture, so only the scheduling waits.
  // Taps made while it wakes share one resume and play a single click.
  lastTapAt = performance.now();
  if (waking) return;
  try {
    waking = current.context
      .resume()
      .then(
        () => {
          if (performance.now() - lastTapAt <= MAX_WAKE_DELAY_MS) {
            playClick(current);
          }
        },
        () => {
          // A context that cannot resume is replaced on the next tap.
          if (engine === current) engine = undefined;
        },
      )
      .finally(() => {
        waking = undefined;
      });
  } catch {
    if (engine === current) engine = undefined;
  }
}

function createEngine(): Engine {
  const context = new AudioContext();
  // The two bursts are boosted for small speakers; the limiter keeps their
  // peaks from clipping into a harsh crackle.
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0;
  limiter.release.value = 0.05;
  limiter.connect(context.destination);
  return { context, noise: createNoiseBurst(context), output: limiter };
}

function playClick({ context, noise, output }: Engine) {
  try {
    const start = context.currentTime + LOOKAHEAD_SECONDS;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = FILTER_FREQUENCY;
    filter.Q.value = FILTER_Q;
    filter.connect(output);
    for (const { offset, level } of CLICKS) {
      const source = context.createBufferSource();
      source.buffer = noise;
      const gain = context.createGain();
      gain.gain.value = level;
      source.connect(gain).connect(filter);
      source.start(start + offset);
    }
  } catch {
    // Audio is optional; a failed click must not break counting.
  }
}

function createNoiseBurst(context: AudioContext) {
  const length = Math.ceil(context.sampleRate * BURST_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    // White noise with a fast exponential decay: a sharp attack, no tail.
    samples[i] = (Math.random() * 2 - 1) * Math.exp((-5 * i) / length);
  }
  return buffer;
}
