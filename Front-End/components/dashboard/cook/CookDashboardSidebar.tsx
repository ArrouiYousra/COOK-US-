"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  MessageSquare,
  CreditCard,
  Star,
  BarChart3,
  Menu,
  X,
  LogOut,
  Clock,
  AlertTriangle,
  Loader2,
  Store,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Organisation logique de la sidebar pour une UX optimale
const menuSections = [
  {
    title: "Principal",
    items: [
      {
        label: "Accueil",
        icon: LayoutDashboard,
        href: "/dashboard/cook",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      },
      {
        label: "Marché",
        icon: Store,
        href: "/dashboard/cook/marketplace",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
      },
      {
        label: "Mes propositions",
        icon: MessageSquare,
        href: "/dashboard/cook/reservations",
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
      },
      {
        label: "Demandes clients",
        icon: FileText,
        href: "/dashboard/cook/requests",
        color: "text-teal-600 dark:text-teal-400",
        bgColor: "bg-teal-500/10 dark:bg-teal-500/20",
      },
    ],
  },
  {
    title: "Gestion",
    items: [
      {
        label: "Mes réservations",
        icon: Calendar,
        href: "/dashboard/cook/bookings",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-500/10 dark:bg-green-500/20",
      },
      {
        label: "Mon agenda",
        icon: Clock,
        href: "/dashboard/cook/calendar",
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
      },
      {
        label: "Messages",
        icon: MessageSquare,
        href: "/dashboard/cook/messages",
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
      },
      {
        label: "Paiements",
        icon: CreditCard,
        href: "/dashboard/cook/payments",
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
      },
    ],
  },
  {
    title: "Performance",
    items: [
      {
        label: "Mes avis",
        icon: Star,
        href: "/dashboard/cook/reviews",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
      },
      {
        label: "Statistiques",
        icon: BarChart3,
        href: "/dashboard/cook/stats",
        color: "text-pink-600 dark:text-pink-400",
        bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
      },
    ],
  },
];

/**
 * Sidebar de navigation du dashboard cuisinier
 * Navigation persistante entre les sections
 */
export function CookDashboardSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      alert("Une erreur est survenue lors de la déconnexion. Veuillez réessayer.");
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <>
      {/* Bouton mobile */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <Link href="/dashboard/cook" className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">COOK US</h2>
            <p className="text-sm text-muted-foreground">Espace Cuisinier</p>
          </Link>

          {/* Navigation organisée par sections */}
          <nav className="flex-1 space-y-6 overflow-y-auto">
            {menuSections.map((section, sectionIndex) => (
              <div key={section.title} className="space-y-2">
                {/* Titre de section (seulement pour les sections suivantes) */}
                {sectionIndex > 0 && (
                  <div className="px-4 pt-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                )}
                
                {/* Items de la section */}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => {
                          setIsMobileOpen(false);
                          // Empêcher la navigation si on est déjà sur cette page
                          if (isActive) {
                            e.preventDefault();
                            return;
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
                          isActive
                            ? "bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0",
                            isActive
                              ? "bg-white/20"
                              : cn(item.bgColor, "group-hover:scale-110")
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5 transition-colors",
                              isActive ? "text-white" : item.color
                            )}
                          />
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Section bas de sidebar */}
          <div className="pt-4 border-t border-border mt-auto">
            {/* Bouton déconnexion */}
            <Button
              variant="ghost"
              onClick={() => setShowLogoutDialog(true)}
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="font-medium">Déconnexion</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Dialog de confirmation de déconnexion */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Confirmer la déconnexion
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-muted-foreground pt-2">
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Déconnexion...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

