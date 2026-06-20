import Link from "next/link";
import type { ReactNode } from "react";

import { MaterialIcon } from "@/components/material-icon";

type AuthShellProps = {
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="flex w-full max-w-md flex-col gap-8 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-10">
        <header className="flex flex-col items-center space-y-1 text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded border border-outline-variant bg-surface-container-low">
            <MaterialIcon className="text-primary" fill size={24}>
              hub
            </MaterialIcon>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Mnemosyne</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Ops Workbench</p>
        </header>
        {children}
        <footer className="mt-2 flex flex-col items-center gap-6 border-t border-outline-variant/30 pt-6">
          {footer}
          <div className="flex w-full items-start gap-3 rounded border border-outline-variant/50 bg-surface-container-low p-3">
            <MaterialIcon className="mt-0.5 text-secondary" size={16}>
              shield_lock
            </MaterialIcon>
            <p className="font-body-sm text-body-sm leading-tight text-secondary">
              Connection secured. Access is restricted to authorized personnel operating within isolated workspaces.
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="font-label-bold text-primary hover:underline" href={href}>
      {children}
    </Link>
  );
}
