import { AuthLink, AuthShell } from "@/features/auth/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthShell
      footer={
        <div className="font-body-sm text-body-sm text-on-surface-variant">
          Have an account? <AuthLink href="/auth/sign-in">Sign in</AuthLink>
        </div>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
