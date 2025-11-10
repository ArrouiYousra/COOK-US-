"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, User, Settings, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

/**
 * Header du dashboard cuisinier
 * Infos rapides : photo profil, notifications, recherche
 */
export function CookDashboardHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 sm:p-6">
        {/* Barre de recherche globale */}
        <GlobalSearch />

        {/* Actions */}
        <div className="flex items-center gap-3">
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

          {/* Menu profil */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                      href="/dashboard/cook/profile"
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
                      onClick={handleLogout}
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
  );
}

