import Link from "next/link";
import type { ReactNode } from "react";

import { MaterialIcon } from "@/components/material-icon";

const navItems = [
  { href: "/chat", icon: "analytics", title: "Workbench" },
  { href: "/documents", icon: "hub", title: "Knowledge Graph" },
  { href: "/documents", icon: "input", title: "Ingestion" },
  { href: "/chat", icon: "history", title: "Operational Logs" }
];

export function AppShell({ children, active = "Workbench" }: { children: ReactNode; active?: string }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-body-md text-on-surface">
      <nav className="fixed left-0 top-0 z-50 flex h-screen w-16 flex-col items-center space-y-6 border-r border-outline-variant bg-surface-container-low py-4">
        <div className="mb-4 font-headline-sm text-headline-sm font-bold text-on-surface" title="Mnemosyne Ops Workbench">
          <MaterialIcon className="text-primary" size={28}>
            memory
          </MaterialIcon>
        </div>
        {navItems.map((item) => {
          const selected = item.title === active;
          return (
            <Link
              className={`flex w-full cursor-pointer items-center justify-center border-l-2 py-3 transition-colors active:opacity-80 ${
                selected
                  ? "border-primary bg-primary-container/10 text-primary"
                  : "border-transparent text-on-surface-variant opacity-70 hover:bg-surface-container-high"
              }`}
              href={item.href}
              key={`${item.title}-${item.icon}`}
              title={item.title}
            >
              <MaterialIcon>{item.icon}</MaterialIcon>
            </Link>
          );
        })}
        <div className="flex-grow" />
        <Link
          className={`flex w-full cursor-pointer items-center justify-center border-l-2 py-3 transition-colors active:opacity-80 ${
            active === "Settings"
              ? "border-primary bg-primary-container/10 text-primary"
              : "border-transparent text-on-surface-variant opacity-70 hover:bg-surface-container-high"
          }`}
          href="/settings"
          title="Settings"
        >
          <MaterialIcon>settings</MaterialIcon>
        </Link>
        <div className="mt-auto flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-high">
          <MaterialIcon className="text-on-surface-variant" size={20}>
            person
          </MaterialIcon>
        </div>
      </nav>
      <div className="ml-16 flex h-full flex-1">{children}</div>
    </div>
  );
}

export function TopIconButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface"
      type="button"
    >
      <MaterialIcon>{icon}</MaterialIcon>
    </button>
  );
}

export function PrimaryButton({ icon, children }: { icon?: string; children: ReactNode }) {
  return (
    <button
      className="flex h-row-height-md items-center justify-center gap-2 rounded bg-primary px-4 font-label-bold text-label-bold text-on-primary transition-colors hover:bg-surface-tint"
      type="button"
    >
      {icon ? <MaterialIcon size={18}>{icon}</MaterialIcon> : null}
      {children}
    </button>
  );
}

export function SecondaryButton({ icon, children }: { icon?: string; children: ReactNode }) {
  return (
    <button
      className="flex h-8 items-center justify-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-3 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-low"
      type="button"
    >
      {icon ? <MaterialIcon size={16}>{icon}</MaterialIcon> : null}
      {children}
    </button>
  );
}

export function StatusBadge({ tone, children }: { tone: "success" | "processing" | "queued" | "failed" | "inactive"; children: ReactNode }) {
  const styles = {
    success: "bg-[#e6f4ea] text-[#137333]",
    processing: "bg-primary-fixed text-on-primary-fixed",
    queued: "bg-surface-container-high text-on-surface-variant",
    failed: "bg-error-container text-on-error-container",
    inactive: "bg-surface-container-high text-on-surface-variant"
  }[tone];

  return <span className={`rounded-full px-2 py-0.5 font-label-bold text-label-bold ${styles}`}>{children}</span>;
}
