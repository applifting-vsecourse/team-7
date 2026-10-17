import { StrictMode, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { photoFormData, type DogPhoto } from "../api/dogPhotos";
import { DogPhotoCanvas } from "./DogPhotoCanvas";

describe("dragging the avatar canvas", () => {
  const drawImage = vi.fn<CanvasRenderingContext2D["drawImage"]>();
  const onError = vi.fn();
  const file = new File(["photo"], "dog.png", { type: "image/png" });
  const capture = vi.fn();
  const release = vi.fn();

  function Editor({
    disabled = false,
    zoom = 1,
  }: {
    disabled?: boolean;
    zoom?: number;
  }) {
    const [photo, setPhoto] = useState<DogPhoto>({
      file,
      position: { x: 0.5, y: 0.5 },
      zoom,
    });
    return (
      <>
        <DogPhotoCanvas
          photo={photo}
          onChange={setPhoto}
          onError={onError}
          isDisabled={disabled}
        />
        <button
          onClick={() => {
            void photoFormData(photo);
          }}
        >
          Export
        </button>
      </>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    class Pointer extends MouseEvent {
      readonly pointerId: number;
      readonly pointerType: string;
      constructor(
        type: string,
        options: MouseEventInit & {
          pointerId?: number;
          pointerType?: string;
        } = {},
      ) {
        super(type, options);
        this.pointerId = options.pointerId ?? 1;
        this.pointerType = options.pointerType ?? "mouse";
      }
    }
    vi.stubGlobal("PointerEvent", Pointer);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:photo"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "setPointerCapture", {
      configurable: true,
      value: capture,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "hasPointerCapture", {
      configurable: true,
      value: vi.fn(() => true),
    });
    Object.defineProperty(
      HTMLCanvasElement.prototype,
      "releasePointerCapture",
      { configurable: true, value: release },
    );
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      640,
    );
    vi.spyOn(
      HTMLImageElement.prototype,
      "naturalHeight",
      "get",
    ).mockReturnValue(320);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(new Blob(["avatar"], { type: "image/webp" })),
    );
    vi.spyOn(
      HTMLCanvasElement.prototype,
      "getBoundingClientRect",
    ).mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 256,
      bottom: 256,
      width: 256,
      height: 256,
      toJSON: () => ({}),
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function loadedCanvas() {
    const canvas = screen.getByRole("application", {
      name: "Dog avatar preview",
    });
    await waitFor(() => expect(canvas).toHaveAttribute("aria-busy", "false"));
    return canvas;
  }

  it("does not request the discarded Strict Mode URL and cancels loads before revoking URLs", async () => {
    let sequence = 0;
    const revoked = new Set<string>();
    const requested: string[] = [];
    let currentSource: (() => string | null) | undefined;
    vi.mocked(URL).createObjectURL.mockImplementation(
      () => `blob:photo-${++sequence}`,
    );
    vi.mocked(URL).revokeObjectURL.mockImplementation((url) => {
      expect(currentSource?.()).not.toBe(url);
      revoked.add(url);
    });
    vi.mocked(HTMLImageElement.prototype).decode.mockImplementation(function (
      this: HTMLImageElement,
    ) {
      currentSource = () => this.getAttribute("src");
      requested.push(this.src);
      expect(revoked.has(this.src)).toBe(false);
      return Promise.resolve();
    });

    const view = render(
      <StrictMode>
        <Editor />
      </StrictMode>,
    );
    await loadedCanvas();

    expect(sequence).toBe(2);
    expect(requested).toEqual(["blob:photo-2"]);
    expect(revoked).toEqual(new Set(["blob:photo-1"]));
    expect(onError).not.toHaveBeenCalled();
    view.unmount();
    expect(revoked).toEqual(new Set(["blob:photo-1", "blob:photo-2"]));
  });

  it.each(["mouse", "touch"])(
    "follows %s dragging and exports the exact crop shown in the canvas",
    async (pointerType) => {
      render(<Editor />);
      const canvas = await loadedCanvas();
      fireEvent.pointerDown(canvas, {
        pointerId: 1,
        pointerType,
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      fireEvent.pointerMove(canvas, {
        pointerId: 1,
        pointerType,
        clientX: 164,
        clientY: 164,
      });
      expect(capture).toHaveBeenCalledWith(1);
      expect(drawImage).toHaveBeenLastCalledWith(
        expect.any(HTMLImageElement),
        80,
        0,
        320,
        320,
        0,
        0,
        512,
        512,
      );
      fireEvent.pointerUp(canvas, { pointerId: 1 });
      expect(release).toHaveBeenCalledWith(1);
      await userEvent.click(screen.getByRole("button", { name: "Export" }));
      await waitFor(() =>
        expect(drawImage).toHaveBeenLastCalledWith(
          expect.any(HTMLImageElement),
          80,
          0,
          320,
          320,
          0,
          0,
          128,
          128,
        ),
      );
    },
  );

  it("clamps at the image edge and stops moving after pointer cancellation", async () => {
    render(<Editor />);
    const canvas = await loadedCanvas();
    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      clientX: 2000,
      clientY: 100,
    });
    expect(drawImage).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      0,
      0,
      320,
      320,
      0,
      0,
      512,
      512,
    );
    fireEvent.pointerCancel(canvas, { pointerId: 1 });
    drawImage.mockClear();
    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      clientX: -2000,
      clientY: 100,
    });
    expect(drawImage).not.toHaveBeenCalled();
  });

  it("allows independent movement on both axes when zoomed", async () => {
    render(<Editor zoom={2} />);
    const canvas = await loadedCanvas();
    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 164, clientY: 164 });
    expect(drawImage).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      200,
      40,
      160,
      160,
      0,
      0,
      512,
      512,
    );
  });

  it("supports zoom and keyboard panning", async () => {
    render(<Editor />);
    const canvas = await loadedCanvas();
    const user = userEvent.setup();
    screen.getByRole("slider", { name: "Zoom" }).focus();
    await user.keyboard("{End}");
    const cropBefore = drawImage.mock.calls.at(-1)!;
    expect(cropBefore[3]).toBeCloseTo(320 / 3);
    canvas.focus();
    await user.keyboard("{ArrowLeft}{ArrowUp}");
    const cropAfter = drawImage.mock.calls.at(-1)!;
    expect(cropAfter[1]).toBeGreaterThan(cropBefore[1]);
    expect(cropAfter[2]).toBeGreaterThan(cropBefore[2]);
  });

  it("blocks changes while saving", async () => {
    render(<Editor disabled />);
    const canvas = await loadedCanvas();
    drawImage.mockClear();
    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 164, clientY: 164 });
    fireEvent.keyDown(canvas, { key: "ArrowLeft" });
    expect(capture).not.toHaveBeenCalled();
    expect(drawImage).not.toHaveBeenCalled();
    expect(screen.getByRole("slider", { name: "Zoom" })).toBeDisabled();
  });
});
