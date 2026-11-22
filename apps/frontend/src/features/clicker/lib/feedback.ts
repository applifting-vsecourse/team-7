let audio: AudioContext | undefined;
let noise: AudioBuffer | undefined;

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

/** A short percussive click, synthesized locally so it also works offline. */
export function clickerFeedback(success: boolean) {
  navigator.vibrate?.(success ? 30 : [20, 40, 20]);
  if (!success) return;
  let context: AudioContext;
  try {
    context = audio ??= new AudioContext();
  } catch {
    // Audio is optional on browsers that don't support Web Audio.
    return;
  }
  if (context.state === "running") {
    playClick(context);
    return;
  }
  // Mobile browsers suspend the context on the first tap, screen lock or app
  // switch, and waking it takes tens of milliseconds. Scheduling before it runs
  // lets the short click finish in silence. resume() must still be called
  // synchronously inside the user gesture, so only the scheduling waits.
  context.resume().then(
    () => playClick(context),
    () => undefined,
  );
}

function playClick(context: AudioContext) {
  try {
    noise ??= createNoiseBurst(context);
    const start = context.currentTime + LOOKAHEAD_SECONDS;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = FILTER_FREQUENCY;
    filter.Q.value = FILTER_Q;
    filter.connect(context.destination);
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
