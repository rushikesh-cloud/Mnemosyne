"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { MaterialIcon } from "@/components/material-icon";
import { createBrowserSupabaseClient, type SupabaseAuthClient } from "@/lib/auth/auth-client";

type SignUpFormProps = {
  authClient?: SupabaseAuthClient;
  onSignedUp?: (path: "/chat") => void;
};

export function SignUpForm({ authClient, onSignedUp }: SignUpFormProps) {
  const router = useRouter();
  const client = useMemo(() => authClient ?? createBrowserSupabaseClient(), [authClient]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!email || !password || !confirmPassword) {
      setError("Email and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setLoading(true);
    const { data, error: authError } = await client.auth.signUp({ email, password });
    setLoading(false);

    if (authError) {
      setError("Unable to create an account with those details.");
      return;
    }

    if (data.session) {
      if (onSignedUp) {
        onSignedUp("/chat");
        return;
      }
      router.push("/chat");
      return;
    }

    setNotice("Check your email to complete account creation.");
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
          Email
        </label>
        <input
          className="secure-input h-row-height-md w-full rounded border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/50"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="operator@mnemosyne.io"
          type="email"
          value={email}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
          Password
        </label>
        <input
          className="secure-input h-row-height-md w-full rounded border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/50"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          type="password"
          value={password}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-label-md text-label-md text-on-surface" htmlFor="confirm-password">
          Confirm password
        </label>
        <input
          className="secure-input h-row-height-md w-full rounded border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/50"
          id="confirm-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="••••••••"
          type="password"
          value={confirmPassword}
        />
      </div>
      {error ? (
        <div className="rounded border border-error/30 bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded border border-primary/30 bg-primary-fixed px-3 py-2 font-body-sm text-body-sm text-on-primary-fixed">
          {notice}
        </div>
      ) : null}
      <button
        className="mt-2 flex h-row-height-md w-full items-center justify-center gap-2 rounded bg-primary font-label-bold text-label-bold text-on-primary transition-colors hover:bg-surface-tint disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        {loading ? "Creating Account" : "Create Account"}
        <MaterialIcon size={18}>arrow_forward</MaterialIcon>
      </button>
    </form>
  );
}
