import { describe, expect, it } from "vitest";

import { getProtectedRedirect } from "@/lib/auth/route-guards";

describe("protected route guard", () => {
  it("redirects unauthenticated protected routes to sign in", () => {
    expect(getProtectedRedirect(null, "/chat")).toBe("/auth/sign-in");
    expect(getProtectedRedirect(null, "/documents")).toBe("/auth/sign-in");
    expect(getProtectedRedirect(null, "/settings")).toBe("/auth/sign-in");
  });

  it("allows authenticated users to remain on protected routes", () => {
    expect(getProtectedRedirect({ user: { id: "user-1" } }, "/chat")).toBeNull();
  });

  it("redirects authenticated users away from auth routes", () => {
    expect(getProtectedRedirect({ user: { id: "user-1" } }, "/auth/sign-in")).toBe("/chat");
    expect(getProtectedRedirect({ user: { id: "user-1" } }, "/auth/sign-up")).toBe("/chat");
  });
});
