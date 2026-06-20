"use client";

import { createBrowserClient } from "@supabase/ssr";

export type SupabaseAuthClient = {
  auth: {
    signInWithPassword(input: { email: string; password: string }): Promise<{
      data: { session: unknown | null };
      error: { message: string } | null;
    }>;
    signUp(input: { email: string; password: string }): Promise<{
      data: { session: unknown | null };
      error: { message: string } | null;
    }>;
  };
};

export function createBrowserSupabaseClient(): SupabaseAuthClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      auth: {
        async signInWithPassword() {
          return {
            data: { session: null },
            error: { message: "Supabase environment is not configured." }
          };
        },
        async signUp() {
          return {
            data: { session: null },
            error: { message: "Supabase environment is not configured." }
          };
        }
      }
    };
  }

  return createBrowserClient(url, anonKey) as SupabaseAuthClient;
}
