"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  ShieldCheck,
  Settings2,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/admin",
    accent: "bg-blue-500/15 dark:bg-blue-500/20 text-blue-500 dark:text-blue-300",
  },
  {
    label: "Utilisateurs",
    icon: Users,
    href: "/dashboard/admin/users",
    accent: "bg-purple-500/15 dark:bg-purple-500/20 text-purple-500 dark:text-purple-300",
  },
  {
    label: "Activité",
    icon: Activity,
    href: "/dashboard/admin/activity",
    accent: "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-300",
  },
  {
    label: "Moderation",
    icon: ShieldCheck,
    href: "/dashboard/admin/moderation",
    accent: "bg-rose-500/15 dark:bg-rose-500/20 text-rose-500 dark:text-rose-300",
    disabled: true,
  },
  {
    label: "Paramètres",
    icon: Settings2,
    href: "/dashboard/admin/settings",
    accent: "bg-slate-500/15 dark:bg-slate-500/20 text-slate-500 dark:text-slate-300",
    disabled: true,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavigate = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 rounded-lg border border-border bg-card p-2 shadow-lg"
        onClick={() => setIsMobileOpen((open) => !open)}
        aria-label="Ouvrir le menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isMobileOpen ? (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 max-w-xs transform border-r border-border bg-card transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col gap-6 px-6 py-8">
          <Link href="/dashboard/admin" className="space-y-1">
            <h2 className="text-2xl font-bold">COOK US</h2>
            <p className="text-sm text-muted-foreground">
              Console Administrateur
            </p>
          </Link>

          <nav className="flex-1 space-y-3 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (pathname?.startsWith(item.href) && item.href !== "/dashboard/admin");

              const handleClick = () => {
                if (item.disabled) return;
                handleNavigate();
              };

              return (
                <Link
                  key={item.href}
                  href={item.disabled ? "#" : item.href}
                  onClick={handleClick}
                  aria-disabled={item.disabled}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 transition-all duration-200",
                    item.disabled
                      ? "cursor-not-allowed bg-muted/40 text-muted-foreground"
                      : isActive
                      ? "border-blue-500/40 bg-blue-600 text-white shadow-lg dark:bg-blue-500"
                      : "hover:border-border hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200",
                      item.disabled
                        ? "bg-muted text-muted-foreground"
                        : isActive
                        ? "bg-white/20"
                        : `${item.accent} group-hover:scale-105`,
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        item.disabled || !isActive ? "text-current" : "text-white",
                      )}
                    />
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                  {item.disabled ? (
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Bientôt
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="rounded-xl border border-border bg-accent/20 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Support
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Besoin d&lsquo;aide ? Contactez l&lsquo;équipe plateforme.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

