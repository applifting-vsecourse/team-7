import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { QuackForm } from "@/features/quack/components/QuackForm"

const mutation = vi.hoisted(() => ({
  isPending: false,
  error: null as Error | null,
  mutateAsync: vi.fn(),
}))
vi.mock("@/features/quack/hooks/useAddQuack", () => ({ useAddQuack: () => mutation }))

describe("quack form", () => {
  beforeEach(() => {
    mutation.isPending = false
    mutation.error = null
    mutation.mutateAsync.mockReset()
  })

  it("validates empty and overlong drafts, associates errors and focuses the textarea", async () => {
    const view = render(<QuackForm />)
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))
    const input = screen.getByLabelText("New quack")
    expect(await screen.findByText("Write something first")).toBeInTheDocument()
    expect(input).toHaveAccessibleDescription("Write something first")
    await waitFor(() => expect(input).toHaveFocus())
    fireEvent.change(input, { target: { value: "x".repeat(281) } })
    fireEvent.submit(view.container.querySelector("form")!)
    expect(await screen.findByText("Keep it under 280 characters")).toBeInTheDocument()
    expect(screen.getByText("281/280")).toHaveClass("text-danger")
    expect(mutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("prevents duplicate submissions and resets only after success", async () => {
    let finish!: () => void
    mutation.mutateAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const view = render(<QuackForm />)
    const input = screen.getByLabelText("New quack")
    fireEvent.change(input, { target: { value: " quack " } })
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))
    await waitFor(() =>
      expect(mutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({ text: "quack" }),
    )
    expect(input).toBeDisabled()
    expect(input).toHaveValue(" quack ")
    expect(screen.getByRole("button", { name: "Quack" })).toBeDisabled()
    fireEvent.submit(view.container.querySelector("form")!)
    expect(mutation.mutateAsync).toHaveBeenCalledOnce()
    await act(async () => {
      finish()
      await Promise.resolve()
    })
    await waitFor(() => expect(input).toHaveValue(""))
    expect(input).toBeEnabled()
  })

  it("retains the draft after failure and displays the mutation error for retry", async () => {
    mutation.mutateAsync.mockRejectedValue(new Error("Offline"))
    const view = render(<QuackForm />)
    fireEvent.change(screen.getByLabelText("New quack"), { target: { value: "keep this draft" } })
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))
    await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledOnce())
    mutation.error = new Error("Offline")
    view.rerender(<QuackForm />)
    expect(screen.getByRole("alert")).toHaveTextContent("Offline")
    expect(screen.getByLabelText("New quack")).toHaveValue("keep this draft")
    await waitFor(() => expect(screen.getByRole("button", { name: "Quack" })).toBeEnabled())
  })
})
