import Link from "next/link";
import type { ReactNode } from "react";

import { HeaderStatus } from "@/components/HeaderStatus";
import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
};

export function AppShell({
  children,
  description,
  eyebrow = "Local smart-home dashboard",
  title,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark">
              <span>⌁</span>
            </span>
            <span>
              <strong>HomeFlow</strong>
              <small>TrueNAS command centre</small>
            </span>
          </Link>
          <nav className="nav-list" aria-label="Main navigation">
            {navigationItems.map((item) => (
              <Link href={item.href} key={item.href}>
                <span aria-hidden="true">{item.icon}</span>
                <strong>{item.label}</strong>
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <div>
            <span className="status-dot" />
            Local system online
          </div>
          <small>Demo data · MQTT ready</small>
        </div>
      </aside>

      <section className="content">
        <div className="app-topbar" aria-label="Dashboard toolbar">
          <div className="topbar-search">
            <span aria-hidden="true">⌕</span>
            <strong>Search rooms, devices, automations</strong>
          </div>
          <div className="topbar-actions">
            <span aria-hidden="true">◐</span>
            <span aria-hidden="true">▣</span>
            <span className="topbar-avatar" aria-hidden="true">HF</span>
          </div>
        </div>
        <header className="page-header">
          <div className="hero-copy">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <span>{description}</span>
          </div>
          <div className="page-header-meta" aria-label="System status">
            <span className="meta-dot" />
            Local · demo mode
          </div>
          <HeaderStatus />
        </header>
        {children}
      </section>
    </main>
  );
}
