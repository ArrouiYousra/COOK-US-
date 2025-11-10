"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, User, Settings, LogOut, AlertTriangle, Loader2 } from "lucide-react";
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
 * Header du dashboard
 * Infos rapides : photo profil, notifications, recherche, bouton "Créer une demande"
 */
export function DashboardHeader() {
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

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 sm:p-6">
        {/* Barre de recherche globale */}
        <GlobalSearch />

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Bouton Créer une demande */}
          <Button
            asChild
            className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white"
          >
            <Link href="/dashboard/client/requests/new">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Créer une demande</span>
              <span className="sm:hidden">Nouvelle</span>
            </Link>
          </Button>

          {/* Toggle thème */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationsDropdown />

          {/* Paramètres */}
          <Link href="/dashboard/client/settings">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center border border-border hover:bg-accent transition-colors"
              aria-label="Paramètres"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </Link>

          {/* Card utilisateur */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-accent/50 dark:bg-accent/30 rounded-lg border border-border hover:bg-accent dark:hover:bg-accent/50 transition-colors cursor-pointer"
               onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Profil"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Utilisateur"}
              </span>
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
                  alt={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Profil"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </motion.button>

            {/* Menu déroulant */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                >
                  {/* Infos utilisateur */}
                  <div className="p-4 border-b border-border">
                    <p className="font-semibold text-foreground text-sm">
                      {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Utilisateur"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Options du menu */}
                  <div className="py-2">
                    <Link
                      href="/dashboard/client/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Mon profil
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
    </header>
  );
}
