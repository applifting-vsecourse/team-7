import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const vibrate = vi.fn<(pattern: number | number[]) => boolean>();

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  static initialState: AudioContextState = "suspended";
  state = FakeAudioContext.initialState;
  currentTime = 0;
  sampleRate = 48000;
  destination = {};
  buffers: Float32Array[] = [];
  sources: {
    buffer: unknown;
    start: ReturnType<typeof vi.fn<(when: number) => void>>;
  }[] = [];
  resumeResult: Promise<void> = Promise.resolve();
  resume = vi.fn(() => this.resumeResult);

  constructor() {
    FakeAudioContext.instances.push(this);
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

async function loadFeedback() {
  // The module keeps one AudioContext; reload it so each test starts fresh.
  vi.resetModules();
  return (await import("./feedback")).clickerFeedback;
}

describe("clicker feedback", () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    FakeAudioContext.initialState = "suspended";
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vibrate.mockReset();
    vi.stubGlobal("navigator", { vibrate });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    const clickerFeedback = await loadFeedback();
    let resume!: () => void;
    const context = new FakeAudioContext();
    context.resumeResult = new Promise((resolve) => {
      resume = resolve;
    });
    vi.stubGlobal(
      "AudioContext",
      vi.fn(function () {
        return context;
      }),
    );

    clickerFeedback(true);

    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.sources).toHaveLength(0);

    // The audio clock moved on while the context was waking up.
    context.currentTime = 0.08;
    context.state = "running";
    resume();

    await vi.waitFor(() => expect(context.sources).toHaveLength(2));
    for (const start of startTimes(context)) {
      expect(start).toBeGreaterThan(0.08);
    }
  });

  it("only vibrates for a failed attempt", async () => {
    const clickerFeedback = await loadFeedback();
    clickerFeedback(false);
    expect(vibrate).toHaveBeenCalledWith([20, 40, 20]);
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("stays silent when the context cannot resume", async () => {
    const clickerFeedback = await loadFeedback();
    const context = new FakeAudioContext();
    context.resumeResult = Promise.reject(new Error("not allowed"));
    vi.stubGlobal(
      "AudioContext",
      vi.fn(function () {
        return context;
      }),
    );

    expect(() => clickerFeedback(true)).not.toThrow();
    await Promise.resolve();
    expect(context.sources).toHaveLength(0);
    expect(vibrate).toHaveBeenCalledWith(30);
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
