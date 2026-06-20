import { AuthLink, AuthShell } from "@/features/auth/auth-shell";
import { SignInForm } from "@/features/auth/sign-in-form";

export default function SignInPage() {
  return (
    <AuthShell
      footer={
        <div className="font-body-sm text-body-sm text-on-surface-variant">
          No account? <AuthLink href="/auth/sign-up">Sign up</AuthLink>
        </div>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
