"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api/client";
import {
  registerClientSchema,
  type RegisterClientFormData,
} from "@/lib/validations/auth";
import { FR } from "country-flag-icons/react/3x2";

/**
 * Page d'inscription client
 * Formulaire complet avec validation en temps réel
 */
export default function RegisterClientPage() {
  const router = useRouter();
  const { applyAuthResponse, setSelectedRole, selectedRole } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<RegisterClientFormData>({
    resolver: zodResolver(registerClientSchema),
    mode: "onChange",
  });

  // Fonction pour formater le numéro de téléphone français
  // Note: Le préfixe "+33" est déjà affiché visuellement, donc on ne l'ajoute pas dans la valeur
  const formatPhoneNumber = (value: string): string => {
    if (!value) return '';
    
    // Retirer tous les espaces et le préfixe +33 s'il est présent (car il est déjà affiché visuellement)
    let cleaned = value.replace(/\s/g, '').replace(/^\+33/, '');
    
    // Si ça commence par 33, on le retire aussi
    if (cleaned.startsWith('33') && cleaned.length > 2) {
      cleaned = cleaned.slice(2);
    }
    
    // Si ça commence par 0, on le retire (remplacé par +33)
    if (cleaned.startsWith('0') && cleaned.length > 1) {
      cleaned = cleaned.slice(1);
    }
    
    // Ne garder que les chiffres
    cleaned = cleaned.replace(/\D/g, '');
    
    // Limiter à 9 chiffres (format français)
    if (cleaned.length > 9) {
      cleaned = cleaned.slice(0, 9);
    }
    
    // Formater avec des espaces : X XX XX XX XX (sans le +33 car il est déjà affiché)
    if (cleaned.length > 0) {
      // Format: premier chiffre seul, puis groupes de 2
      const first = cleaned[0];
      const rest = cleaned.slice(1);
      const groups = rest.match(/.{1,2}/g) || [];
      return first + (groups.length > 0 ? ' ' + groups.join(' ') : '');
    }
    
    return '';
  };

  // Vérifier que le rôle est sélectionné (redirection dans useEffect pour éviter l'erreur React)
  useEffect(() => {
    if (!selectedRole || selectedRole !== "CLIENT") {
      router.push("/auth/role");
    }
  }, [selectedRole, router]);

  if (!selectedRole || selectedRole !== "CLIENT") {
    return null;
  }

  const onSubmit = async (data: RegisterClientFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const { confirmPassword, ...registerData } = data;
      // Nettoyer le numéro de téléphone : retirer les espaces et ajouter +33 au début
      // La valeur du champ ne contient que les chiffres (sans +33 car il est affiché visuellement)
      let normalizedPhone = registerData.phone?.trim().replace(/\s/g, '');
      // Si le numéro est vide, on le met à undefined
      if (!normalizedPhone || normalizedPhone === "") {
        normalizedPhone = undefined;
      } else {
        // Ajouter le préfixe +33 car il n'est pas dans la valeur du champ
        normalizedPhone = '+33' + normalizedPhone;
      }
      const cleanedData = {
        ...registerData,
        phone: normalizedPhone,
      };
      const response = await apiClient.registerClient(cleanedData);

      setSelectedRole(null);

      // Rediriger vers la page de connexion avec l'email pré-rempli
      const emailParam = encodeURIComponent(cleanedData.email);
      router.push(`/auth/login?email=${emailParam}&registered=true`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const password = watch("password");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Header avec navigation */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/auth/role")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card avec fond et ombre */}
        <div className="bg-card border border-border rounded-2xl p-8 lg:p-10 shadow-xl">
          {/* Titre */}
          <div className="text-center mb-8">
            <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Créer un compte client
            </h1>
            <p className="text-muted-foreground">
              Remplissez vos informations pour commencer
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Prénom */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Prénom *
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="Jean"
              {...register("firstName")}
              className={errors.firstName ? "border-destructive" : ""}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Nom *
            </label>
            <Input
              id="lastName"
              type="text"
              placeholder="Dupont"
              {...register("lastName")}
              className={errors.lastName ? "border-destructive" : ""}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Email *
            </label>
            <Input
              id="email"
              type="email"
              placeholder="jean.dupont@example.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Téléphone (optionnel) */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Téléphone <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none z-10">
                <FR className="w-5 h-4 rounded-sm" />
                <span className="text-sm font-medium text-foreground">+33</span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="6 12 34 56 78"
                {...register("phone", {
                  onChange: (e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setValue("phone", formatted, { shouldValidate: true });
                  },
                })}
                className={errors.phone ? "border-destructive pl-16" : "pl-16"}
                aria-invalid={!!errors.phone}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Mot de passe *
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className={errors.password ? "border-destructive pr-10" : "pr-10"}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
            {password && !errors.password && (
              <p className="mt-1 text-xs text-muted-foreground">
                ✓ Min 8 caractères, 1 majuscule, 1 chiffre
              </p>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Erreur générale */}
          {submitError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          {/* Bouton de soumission */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>

          {/* Lien vers login */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

