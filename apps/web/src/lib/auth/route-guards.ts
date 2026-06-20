type SessionLike = {
  user?: {
    id?: string;
  } | null;
} | null;

const protectedPrefixes = ["/chat", "/documents", "/settings"];
const authPrefixes = ["/auth/sign-in", "/auth/sign-up"];

export function getProtectedRedirect(session: SessionLike, pathname: string) {
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthRoute = authPrefixes.includes(pathname);

  if (!session?.user?.id && isProtected) {
    return "/auth/sign-in";
  }

  if (session?.user?.id && isAuthRoute) {
    return "/chat";
  }

  return null;
}
