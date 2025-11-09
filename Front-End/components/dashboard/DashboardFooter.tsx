"use client";

import Link from "next/link";
import { HelpCircle, Mail, FileText, Shield, ExternalLink } from "lucide-react";

/**
 * Footer du dashboard client
 * Liens utiles, support, et informations légales
 */
export function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Liens rapides */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/dashboard/client/help"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Centre d'aide</span>
            </Link>
            <Link
              href="/dashboard/client/support"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Support</span>
            </Link>
            <Link
              href="/terms"
              target="_blank"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>CGU</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/privacy"
              target="_blank"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Confidentialité</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} COOK US. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
}

