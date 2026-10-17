import { useState } from "react";
import type { DogPhoto } from "../api/dogPhotos";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DogPhotoPicker } from "./DogPhotoPicker";

vi.mock("./DogPhotoCanvas", () => ({
  DogPhotoCanvas: () => <div data-testid="photo-preview" />,
}));

function Picker({ isDisabled = false }: { isDisabled?: boolean }) {
  const [photo, setPhoto] = useState<DogPhoto | null>(null);
  return (
    <DogPhotoPicker value={photo} onChange={setPhoto} isDisabled={isDisabled} />
  );
}

describe("dog photo input", () => {
  it("keeps the filename, clears the selection and preview, and allows selecting the same file again", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    const input = screen.getByLabelText(
      "Dog photo (optional)",
    ) as HTMLInputElement;
    const file = new File(["photo"], "buddy.png", { type: "image/png" });

    await user.upload(input, file);

    expect(input.files?.[0]).toBe(file);
    expect(input.value).toContain("buddy.png");
    expect(screen.getByTestId("photo-preview")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(input.value).toBe("");
    expect(input.files).toHaveLength(0);
    expect(screen.queryByTestId("photo-preview")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear selection" }),
    ).not.toBeInTheDocument();

    await user.upload(input, file);

    expect(input.value).toContain("buddy.png");
    expect(screen.getByTestId("photo-preview")).toBeInTheDocument();
  });

  it("disables selection and clearing while saving", async () => {
    const user = userEvent.setup();
    const view = render(<Picker />);
    const input = screen.getByLabelText("Dog photo (optional)");
    await user.upload(
      input,
      new File(["photo"], "buddy.png", { type: "image/png" }),
    );

    view.rerender(<Picker isDisabled />);

    expect(input).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Clear selection" }),
    ).toBeDisabled();
  });
});
