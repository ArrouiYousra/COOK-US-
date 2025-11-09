"use client";

import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

/**
 * Composant pour afficher la force du mot de passe
 * Affiche un indicateur visuel de la force du mot de passe
 */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: "", color: "" };

    let score = 0;
    
    // Longueur minimale
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Majuscule
    if (/[A-Z]/.test(password)) score += 1;
    
    // Minuscule
    if (/[a-z]/.test(password)) score += 1;
    
    // Chiffre
    if (/[0-9]/.test(password)) score += 1;
    
    // Caractère spécial
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      return { level: 1, label: "Faible", color: "bg-red-500" };
    } else if (score <= 4) {
      return { level: 2, label: "Moyen", color: "bg-yellow-500" };
    } else {
      return { level: 3, label: "Fort", color: "bg-green-500" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.level / 3) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{strength.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Min 8 caractères, 1 majuscule, 1 chiffre
      </p>
    </div>
  );
}

