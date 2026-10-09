import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SignInForm } from "@/features/auth/components/SignInForm"
import { SignUpForm } from "@/features/auth/components/SignUpForm"

describe("auth forms", () => {
  it("associates validation messages and focuses the first invalid input", async () => {
    const onSubmit = vi.fn()
    render(
      <SignInForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))
    const email = screen.getByLabelText("Email")
    expect(await screen.findByText("Email is required")).toBeInTheDocument()
    expect(email).toHaveAttribute("aria-invalid", "true")
    expect(email).toHaveAccessibleDescription("Email is required")
    await waitFor(() => expect(email).toHaveFocus())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(email).toHaveAttribute("autocomplete", "email")
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password")
  })

  it("submits normalized values once and locks controls until the promise settles", async () => {
    const user = userEvent.setup()
    let finish!: () => void
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const view = render(
      <SignInForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )
    await user.type(screen.getByLabelText("Email"), " duck@example.com ")
    await user.type(screen.getByLabelText("Password"), "password")
    const button = screen.getByRole("button", { name: "Sign in" })
    await user.click(button)
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
        email: "duck@example.com",
        password: "password",
      }),
    )
    expect(button).toBeDisabled()
    expect(screen.getByLabelText("Email")).toBeDisabled()
    fireEvent.submit(view.container.querySelector("form")!)
    await user.click(button)
    expect(onSubmit).toHaveBeenCalledOnce()
    await act(async () => {
      finish()
      await Promise.resolve()
    })
    await waitFor(() => expect(button).toBeEnabled())
  })

  it("shows server errors and respects external pending state", () => {
    render(
      <SignInForm
        isLoading
        errorMessage="Invalid credentials"
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials")
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled()
  })

  it("validates password confirmation, then submits all signup fields", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <SignUpForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )
    await user.type(screen.getByLabelText("Name"), "Duck")
    await user.type(screen.getByLabelText("Username"), "duck")
    await user.type(screen.getByLabelText("Email"), "duck@example.com")
    await user.type(screen.getByLabelText("Password"), "password1")
    await user.type(screen.getByLabelText("Confirm password"), "password2")
    await user.click(screen.getByRole("button", { name: "Sign up" }))
    expect(await screen.findByText("Passwords must match")).toBeInTheDocument()
    const confirmation = screen.getByLabelText("Confirm password")
    expect(confirmation).toHaveAccessibleDescription("Passwords must match")
    await waitFor(() => expect(confirmation).toHaveFocus())
    expect(onSubmit).not.toHaveBeenCalled()
    await user.clear(confirmation)
    await user.type(confirmation, "password1")
    await user.click(screen.getByRole("button", { name: "Sign up" }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
        name: "Duck",
        username: "duck",
        email: "duck@example.com",
        password: "password1",
        passwordConfirmation: "password1",
      }),
    )
  })
})
