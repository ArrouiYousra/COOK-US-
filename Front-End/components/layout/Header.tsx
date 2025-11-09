"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Menu, X } from "lucide-react";

/**
 * Header sticky avec navigation et CTA principal
 * Design inspiré de Mapbox : sombre, minimaliste, CTA visible
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cookus-header-bg backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-cookus-text text-xl lg:text-2xl font-bold">
              COOK US
            </span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#how-it-works"
              className="text-cookus-text/80 hover:text-cookus-text transition-colors text-sm"
            >
              Comment ça marche
            </Link>
            <Link
              href="#testimonials"
              className="text-cookus-text/80 hover:text-cookus-text transition-colors text-sm"
            >
              Témoignages
            </Link>
            <Link
              href="/auth/role"
              className="text-cookus-text/80 hover:text-cookus-text transition-colors text-sm"
            >
              Devenir chef
            </Link>
          </nav>

          {/* CTA et Menu Utilitaire */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="hidden md:block text-cookus-text/80 hover:text-cookus-text transition-colors text-sm"
            >
              Connexion
            </Link>
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              <Link href="/auth/role">Inscrivez-vous</Link>
            </Button>

            {/* Menu Mobile Toggle */}
            <button
              className="md:hidden text-cookus-text"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-4 border-t border-border">
            <Link
              href="#how-it-works"
              className="block text-cookus-text/80 hover:text-cookus-text transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Comment ça marche
            </Link>
            <Link
              href="#testimonials"
              className="block text-cookus-text/80 hover:text-cookus-text transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Témoignages
            </Link>
            <Link
              href="/auth/role"
              className="block text-cookus-text/80 hover:text-cookus-text transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Devenir chef
            </Link>
            <Link
              href="/auth/login"
              className="block text-cookus-text/80 hover:text-cookus-text transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Connexion
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

