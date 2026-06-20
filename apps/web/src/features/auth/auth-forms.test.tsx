import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

type AuthResult = {
  data: { session: unknown | null };
  error: { message: string } | null;
};

function createAuthClient(overrides: Partial<{
  signInWithPassword: (input: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (input: { email: string; password: string }) => Promise<AuthResult>;
}> = {}) {
  return {
    auth: {
      signInWithPassword: vi.fn(
        overrides.signInWithPassword ??
          (() => Promise.resolve({ data: { session: { access_token: "token" } }, error: null }))
      ),
      signUp: vi.fn(
        overrides.signUp ??
          (() => Promise.resolve({ data: { session: { access_token: "token" } }, error: null }))
      )
    }
  };
}

describe("SignInForm", () => {
  it("requires email and password before calling Supabase", async () => {
    const authClient = createAuthClient();

    render(<SignInForm authClient={authClient} onSignedIn={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Email and password are required.")).toBeInTheDocument();
    expect(authClient.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("calls Supabase and redirects to chat on successful sign in", async () => {
    const authClient = createAuthClient();
    const onSignedIn = vi.fn();

    render(<SignInForm authClient={authClient} onSignedIn={onSignedIn} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "operator@mnemosyne.io" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(authClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "operator@mnemosyne.io",
        password: "correct-password"
      });
      expect(onSignedIn).toHaveBeenCalledWith("/chat");
    });
  });

  it("shows generic non-leaky copy on auth failure", async () => {
    const authClient = createAuthClient({
      signInWithPassword: () =>
        Promise.resolve({ data: { session: null }, error: { message: "Invalid login credentials" } })
    });

    render(<SignInForm authClient={authClient} onSignedIn={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "operator@mnemosyne.io" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Unable to sign in with those credentials.")).toBeInTheDocument();
  });
});

describe("SignUpForm", () => {
  it("requires matching passwords before calling Supabase", async () => {
    const authClient = createAuthClient();

    render(<SignUpForm authClient={authClient} onSignedUp={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@mnemosyne.io" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "one-password" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "another-password" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Passwords must match.")).toBeInTheDocument();
    expect(authClient.auth.signUp).not.toHaveBeenCalled();
  });

  it("redirects to chat when Supabase returns an immediate session", async () => {
    const authClient = createAuthClient();
    const onSignedUp = vi.fn();

    render(<SignUpForm authClient={authClient} onSignedUp={onSignedUp} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@mnemosyne.io" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-password" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(authClient.auth.signUp).toHaveBeenCalledWith({
        email: "new@mnemosyne.io",
        password: "correct-password"
      });
      expect(onSignedUp).toHaveBeenCalledWith("/chat");
    });
  });

  it("shows a check-email state when Supabase requires confirmation", async () => {
    const authClient = createAuthClient({
      signUp: () => Promise.resolve({ data: { session: null }, error: null })
    });

    render(<SignUpForm authClient={authClient} onSignedUp={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@mnemosyne.io" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-password" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Check your email to complete account creation.")).toBeInTheDocument();
  });
});
