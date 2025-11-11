"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut, ChefHat, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Header du dashboard cuisinier
 * Infos rapides : photo profil, notifications, recherche, statut, revenus
 * Style distinctif avec thème culinaire
 */
export function CookDashboardHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsProfileMenuOpen(false);
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

  // Déterminer le statut du cuisinier (à partir du profil)
  const cookStatus = (user as any)?.cookProfile?.status || "ACTIVE";
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { label: "Actif", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" };
      case "PAUSED":
        return { label: "En pause", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" };
      case "PENDING_APPROVAL":
        return { label: "En attente", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      default:
        return { label: status, color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" };
    }
  };
  const statusConfig = getStatusConfig(cookStatus);

  return (
    <>
      <header className="sticky top-0 z-30 bg-card border-b border-border backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 sm:p-6">
          {/* Barre de recherche globale */}
          <GlobalSearch />

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Bouton Créer une disponibilité */}
            <Button
              asChild
              className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white"
            >
              <Link href="/dashboard/cook/calendar">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Créer une disponibilité</span>
                <span className="sm:hidden">Disponibilité</span>
              </Link>
            </Button>

            {/* Toggle thème */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationsDropdown />

            {/* Paramètres */}
            <Link href="/dashboard/cook/settings">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-10 h-10 rounded-lg flex items-center justify-center border border-border hover:bg-accent transition-colors"
                aria-label="Paramètres"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </Link>

            {/* Card utilisateur avec statut */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-accent/50 dark:bg-accent/30 rounded-lg border border-border hover:bg-accent dark:hover:bg-accent/50 transition-colors cursor-pointer"
                 onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Chef"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Chef"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user?.email || ""}
                </span>
              </div>
            </div>

            {/* Menu profil (mobile et fallback) */}
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 md:hidden"
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Chef"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.button>

              {/* Menu déroulant avec style distinctif */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    {/* Infos utilisateur avec statut */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                          {user?.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Chef"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                              <ChefHat className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground text-sm truncate">
                              {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Chef"}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Options du menu */}
                    <div className="py-2">
                      <Link
                        href="/dashboard/cook/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <ChefHat className="w-4 h-4 text-muted-foreground" />
                        Mon profil
                      </Link>
                      <Link
                        href="/dashboard/cook/calendar"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Mon agenda
                      </Link>
                    </div>

                    {/* Déconnexion */}
                    <div className="border-t border-border pt-2">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setShowLogoutDialog(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

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

