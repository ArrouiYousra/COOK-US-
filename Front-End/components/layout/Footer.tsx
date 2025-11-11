"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const footerLinks = {
  company: [
    { label: "À propos", href: "/about" },
    { label: "Comment ça marche", href: "#how-it-works" },
    { label: "Devenir chef", href: "/auth/role" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Centre d'aide", href: "/help" },
    { label: "Support", href: "/support" },
    { label: "CGU", href: "/terms" },
    { label: "Confidentialité", href: "/privacy" },
  ],
  social: [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ],
};

/**
 * Footer - Conclut proprement et renforce la crédibilité
 */
export function Footer() {
  return (
    <footer className="bg-cookus-bg border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo et description */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-cookus-text text-2xl font-bold">COOK US</span>
            </Link>
            <p className="text-cookus-text/70 text-sm mb-4">
              La plateforme qui met en relation particuliers et cuisiniers
              passionnés pour des expériences culinaires uniques à domicile.
            </p>
          </div>

          {/* Liens entreprise */}
          <div>
            <h3 className="text-cookus-text font-cera font-semibold mb-4">
              Entreprise
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-cookus-text/70 hover:text-cookus-text text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens légaux */}
          <div>
            <h3 className="text-cookus-text font-cera font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-cookus-text/70 hover:text-cookus-text text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="text-cookus-text font-cera font-semibold mb-4">
              Suivez-nous
            </h3>
            <div className="flex gap-4">
              {footerLinks.social.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="text-cookus-text/70 hover:text-cookus-text transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
            <Link
              href="/auth/role"
              className="mt-6 inline-block text-cookus-text/70 hover:text-cookus-text text-sm font-semibold transition-colors"
            >
              Devenir partenaire →
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-8">
          <p className="text-cookus-text/60 text-sm text-center">
            © {new Date().getFullYear()} COOK US. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

