import { Link, useRouterState } from "@tanstack/react-router";
import { Calculator, DollarSign, Wrench, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Calculator", icon: Calculator, desc: "Estimate tokens & cost" },
  { to: "/pricing", label: "Pricing", icon: DollarSign, desc: "Manage model rates" },
  { to: "/developer", label: "Developer", icon: Wrench, desc: "Apps & services" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-6 flex items-center gap-2.5 border-b border-sidebar-border">
          <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
            <Sparkles className="size-4.5" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Token Estimator</div>
            <div className="text-[11px] text-muted-foreground">LLM cost calculator</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 mt-0.5 shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground/80">{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-sidebar-border text-[11px] text-muted-foreground">
          1 word ≈ 1.5 tokens
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border px-4 py-3 flex items-center gap-3">
          <div className="size-8 rounded-md bg-primary/15 text-primary grid place-items-center">
            <Sparkles className="size-4" />
          </div>
          <div className="text-sm font-semibold">Token Estimator</div>
        </header>
        <nav className="md:hidden flex gap-1 px-3 py-2 border-b border-border overflow-x-auto">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs whitespace-nowrap",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 md:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
