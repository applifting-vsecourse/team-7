import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const vibrate = vi.fn<(pattern: number | number[]) => boolean>();
let now = 0;

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  static initialState: AudioContextState = "suspended";
  /** How the next context answers resume(); defaults to waking at once. */
  static onResume: (context: FakeAudioContext) => Promise<void> = (context) => {
    context.state = "running";
    return Promise.resolve();
  };
  state = FakeAudioContext.initialState;
  currentTime = 0;
  sampleRate = 48000;
  destination = {};
  buffers: Float32Array[] = [];
  sources: {
    buffer: unknown;
    start: ReturnType<typeof vi.fn<(when: number) => void>>;
  }[] = [];
  resume = vi.fn(() => FakeAudioContext.onResume(this));

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createDynamicsCompressor() {
    const param = () => ({ value: 0 });
    return {
      threshold: param(),
      knee: param(),
      ratio: param(),
      attack: param(),
      release: param(),
      connect: vi.fn(),
    };
  }

  createBuffer(_channels: number, length: number) {
    const samples = new Float32Array(length);
    this.buffers.push(samples);
    return { getChannelData: () => samples };
  }

  createBufferSource() {
    const source = {
      buffer: null as unknown,
      connect: (node: unknown) => node,
      start: vi.fn<(when: number) => void>(),
    };
    this.sources.push(source);
    return source;
  }

  createBiquadFilter() {
    return {
      type: "lowpass",
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
    };
  }

  createGain() {
    return { gain: { value: 1 }, connect: (node: unknown) => node };
  }
}

function startTimes(context: FakeAudioContext) {
  return context.sources.map((source) => source.start.mock.calls[0]![0]);
}

/** Resolves resume() only when the test says so, after `delayMs`. */
function deferResume() {
  let wake!: (delayMs: number) => Promise<void>;
  FakeAudioContext.onResume = (context) =>
    new Promise<void>((resolve) => {
      wake = async (delayMs) => {
        now += delayMs;
        context.currentTime += delayMs / 1000;
        context.state = "running";
        resolve();
        // Let the then/finally chain in clickerFeedback settle.
        await new Promise((settled) => setTimeout(settled, 0));
      };
    });
  return (delayMs: number) => wake(delayMs);
}

async function loadFeedback() {
  // The module keeps one AudioContext; reload it so each test starts fresh.
  vi.resetModules();
  return (await import("./feedback")).clickerFeedback;
}

const defaultResume = FakeAudioContext.onResume;

describe("clicker feedback", () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    FakeAudioContext.initialState = "suspended";
    FakeAudioContext.onResume = defaultResume;
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vibrate.mockReset();
    vi.stubGlobal("navigator", { vibrate });
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("plays a two-part click right away when the audio context is running", async () => {
    FakeAudioContext.initialState = "running";
    const clickerFeedback = await loadFeedback();

    clickerFeedback(true);

    const context = FakeAudioContext.instances[0]!;
    expect(context.resume).not.toHaveBeenCalled();
    const [click, clack] = startTimes(context);
    expect(click).toBeGreaterThan(0);
    expect(clack).toBeGreaterThan(click!);
    expect(vibrate).toHaveBeenCalledWith(30);
  });

  it("synthesizes a decaying noise burst once and reuses it", async () => {
    FakeAudioContext.initialState = "running";
    const clickerFeedback = await loadFeedback();

    clickerFeedback(true);
    clickerFeedback(true);

    const context = FakeAudioContext.instances[0]!;
    expect(context.buffers).toHaveLength(1);
    expect(context.sources).toHaveLength(4);
    const samples = context.buffers[0]!;
    const head = Math.max(...samples.slice(0, 10).map(Math.abs));
    const tail = Math.max(...samples.slice(-10).map(Math.abs));
    expect(tail).toBeLessThan(head);
  });

  it("waits for a suspended context to resume before scheduling the click", async () => {
    const wake = deferResume();
    const clickerFeedback = await loadFeedback();

    clickerFeedback(true);

    const context = FakeAudioContext.instances[0]!;
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.sources).toHaveLength(0);

    await wake(80);

    expect(context.sources).toHaveLength(2);
    for (const start of startTimes(context)) {
      expect(start).toBeGreaterThan(0.08);
    }
  });

  it("skips a click that would play too late after a slow wake", async () => {
    const wake = deferResume();
    const clickerFeedback = await loadFeedback();

    clickerFeedback(true);
    await wake(1000);

    expect(FakeAudioContext.instances[0]!.sources).toHaveLength(0);
    expect(vibrate).toHaveBeenCalledWith(30);
  });

  it("plays one click for taps made while the context wakes", async () => {
    const wake = deferResume();
    const clickerFeedback = await loadFeedback();

    clickerFeedback(true);
    clickerFeedback(true);
    clickerFeedback(true);
    await wake(50);

    const context = FakeAudioContext.instances[0]!;
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.sources).toHaveLength(2);
    expect(vibrate).toHaveBeenCalledTimes(3);
  });

  it("only vibrates for a failed attempt", async () => {
    const clickerFeedback = await loadFeedback();
    clickerFeedback(false);
    expect(vibrate).toHaveBeenCalledWith([20, 40, 20]);
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("stays silent and replaces a context that cannot resume", async () => {
    FakeAudioContext.onResume = () => Promise.reject(new Error("not allowed"));
    const clickerFeedback = await loadFeedback();

    expect(() => clickerFeedback(true)).not.toThrow();
    // Let the rejection and finally handlers settle.
    await new Promise((settled) => setTimeout(settled, 0));
    expect(FakeAudioContext.instances[0]!.sources).toHaveLength(0);

    FakeAudioContext.onResume = defaultResume;
    clickerFeedback(true);
    await new Promise((settled) => setTimeout(settled, 0));

    expect(FakeAudioContext.instances).toHaveLength(2);
    expect(FakeAudioContext.instances[1]!.sources).toHaveLength(2);
  });

  it("replaces a context the browser closed", async () => {
    FakeAudioContext.initialState = "running";
    const clickerFeedback = await loadFeedback();
    clickerFeedback(true);
    FakeAudioContext.instances[0]!.state = "closed";

    clickerFeedback(true);

    expect(FakeAudioContext.instances).toHaveLength(2);
    expect(FakeAudioContext.instances[1]!.sources).toHaveLength(2);
  });

  it("keeps counting when resume throws synchronously", async () => {
    FakeAudioContext.onResume = () => {
      throw new Error("no resume");
    };
    const clickerFeedback = await loadFeedback();

    expect(() => clickerFeedback(true)).not.toThrow();
    FakeAudioContext.onResume = defaultResume;
    clickerFeedback(true);

    expect(FakeAudioContext.instances).toHaveLength(2);
  });

  it("ignores browsers without Web Audio", async () => {
    const clickerFeedback = await loadFeedback();
    vi.stubGlobal(
      "AudioContext",
      vi.fn(function () {
        throw new Error("unsupported");
      }),
    );
    expect(() => clickerFeedback(true)).not.toThrow();
  });
});
