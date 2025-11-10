"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft, Info, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { FR } from "country-flag-icons/react/3x2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api/client";
import {
  registerCookSchema,
  type RegisterCookFormData,
  createTypedResolver,
} from "@/lib/validations/auth";

/**
 * Page d'inscription cuisinier
 * Formulaire complet avec validation en temps réel
 * Inclut les champs spécifiques aux cuisiniers (statut, SIRET)
 */
export default function RegisterCookPage() {
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
  } = useForm<RegisterCookFormData>({
    resolver: createTypedResolver<RegisterCookFormData>(registerCookSchema),
    mode: "onChange",
  });

  // Vérifier que le rôle est sélectionné (redirection dans useEffect pour éviter l'erreur React)
  useEffect(() => {
    if (!selectedRole || selectedRole !== "COOK") {
      router.push("/auth/role");
    }
  }, [selectedRole, router]);

  if (!selectedRole || selectedRole !== "COOK") {
    return null;
  }

  const employmentStatus = watch("employmentStatus");
  const siretNumber = watch("siretNumber");
  const hourlyRate = watch("hourlyRate");

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

  const onSubmit = async (data: RegisterCookFormData) => {
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
        // Envoyer le SIRET uniquement si requis (AUTO_ENTREPRENEUR ou MICRO_ENTREPRISE)
        // Pour PORTAGE_SALARIAL et ASSOCIATION : ne pas envoyer de SIRET
        siretNumber:
          (registerData.employmentStatus === "AUTO_ENTREPRENEUR" || 
           registerData.employmentStatus === "MICRO_ENTREPRISE")
            ? (registerData.siretNumber?.trim() || undefined)
            : undefined,
        hourlyRate: Number(registerData.hourlyRate),
        // Note: Les champs PORTAGE_SALARIAL (birthPlace, socialSecurityNumber, iban, bic, ribDocument)
        // ne sont PAS envoyés à l'inscription - ils seront complétés via updateMyProfile après l'inscription
      };
      const response = await apiClient.registerCook(cleanedData);

      // Appliquer la réponse d'authentification
      applyAuthResponse(response);
      setSelectedRole(null);
      
      // Utiliser le rôle de la réponse directement (plus fiable que le store qui peut ne pas être encore mis à jour)
      const role = response.user?.role;
      
      // Rediriger vers le dashboard approprié
      if (role === "COOK") {
        router.push("/dashboard/cook");
      } else if (role === "CLIENT") {
        router.push("/dashboard/client");
      } else {
        // Fallback : rediriger vers la page de connexion avec l'email pré-rempli
        router.push(`/auth/login?email=${encodeURIComponent(registerData.email)}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription";
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
              Devenir cuisinier Cook US
            </h1>
            <p className="text-muted-foreground">
              Créez votre compte et commencez à proposer vos services
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Prénom et Nom sur la même ligne */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Email et Téléphone sur la même ligne */}
          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Téléphone
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
          </div>

          {/* Statut professionnel */}
          <div>
            <label
              htmlFor="employmentStatus"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Statut professionnel *
            </label>
            <Select
              onValueChange={(value) =>
                setValue("employmentStatus", value as RegisterCookFormData["employmentStatus"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                id="employmentStatus"
                className={errors.employmentStatus ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Sélectionnez votre statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO_ENTREPRENEUR">
                  Auto-entrepreneur
                </SelectItem>
                <SelectItem value="MICRO_ENTREPRISE">
                  Micro-entreprise
                </SelectItem>
                <SelectItem value="PORTAGE_SALARIAL">
                  Portage salarial
                </SelectItem>
                <SelectItem value="ASSOCIATION">
                  Association
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.employmentStatus && (
              <p className="mt-1 text-sm text-destructive">
                {errors.employmentStatus.message}
              </p>
            )}
            {employmentStatus === "AUTO_ENTREPRENEUR" || employmentStatus === "MICRO_ENTREPRISE" ? (
              <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Le numéro SIRET (14 chiffres) ou SIREN (9 chiffres) est obligatoire pour ce statut. 
                  Il sera vérifié via l'API INSEE. Si vous entrez un SIREN, le SIRET principal sera recherché automatiquement.
                </p>
              </div>
            ) : employmentStatus === "PORTAGE_SALARIAL" ? (
            <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                  Pour le portage salarial, vous devrez fournir vos informations personnelles et bancaires.
                  Ces données seront transmises à notre partenaire (PayFit/Silae) pour la gestion de votre contrat.
              </p>
            </div>
            ) : null}
          </div>

          {/* Accroche professionnelle */}
          <div>
            <label
              htmlFor="headline"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Votre accroche professionnelle *
            </label>
            <Input
              id="headline"
              type="text"
              placeholder="Chef à domicile spécialisé en cuisine méditerranéenne"
              {...register("headline")}
              className={errors.headline ? "border-destructive" : ""}
              aria-invalid={!!errors.headline}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Décrivez en une phrase votre style ou spécialité (visible sur votre profil).
            </p>
            {errors.headline && (
              <p className="mt-1 text-sm text-destructive">
                {errors.headline.message}
              </p>
            )}
          </div>

          {/* Tarif horaire */}
          <div>
            <label
              htmlFor="hourlyRate"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Tarif horaire (en €) *
            </label>
            <Input
              id="hourlyRate"
              type="number"
              step="1"
              min={10}
              max={500}
              placeholder="45"
              {...register("hourlyRate")}
              className={errors.hourlyRate ? "border-destructive" : ""}
              aria-invalid={!!errors.hourlyRate}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Indiquez le tarif qui sera affiché aux clients (entre 10€ et 500€ par heure).
            </p>
            {errors.hourlyRate && (
              <p className="mt-1 text-sm text-destructive">
                {errors.hourlyRate.message}
              </p>
            )}
            {hourlyRate && !errors.hourlyRate && Number(hourlyRate) > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tarif sélectionné&nbsp;: {Number(hourlyRate).toFixed(0)} €/heure
              </p>
            )}
          </div>

          {/* Numéro SIRET (obligatoire pour AUTO_ENTREPRENEUR et MICRO_ENTREPRISE, optionnel pour ASSOCIATION) */}
          {(employmentStatus === "AUTO_ENTREPRENEUR" || employmentStatus === "MICRO_ENTREPRISE" || employmentStatus === "ASSOCIATION") && (
            <div>
              <label
                htmlFor="siretNumber"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Numéro SIRET{" "}
                {(employmentStatus === "AUTO_ENTREPRENEUR" || employmentStatus === "MICRO_ENTREPRISE") && (
                  <span className="text-destructive">*</span>
                )}
              </label>
              <Input
                id="siretNumber"
                type="text"
                placeholder="123456789 (SIREN) ou 12345678901234 (SIRET)"
              maxLength={14}
              {...register("siretNumber")}
              className={errors.siretNumber ? "border-destructive" : ""}
              aria-invalid={!!errors.siretNumber}
              onChange={(e) => {
                // Ne garder que les chiffres
                const value = e.target.value.replace(/\D/g, "");
                setValue("siretNumber", value, { shouldValidate: true });
              }}
            />
            {errors.siretNumber && (
              <p className="mt-1 text-sm text-destructive">
                {errors.siretNumber.message}
              </p>
            )}
              {siretNumber && siretNumber.length > 0 && siretNumber.length < 9 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {siretNumber.length < 9
                    ? `${9 - siretNumber.length} chiffre(s) restant(s) pour un SIREN (minimum 9)`
                    : siretNumber.length < 14
                    ? `${14 - siretNumber.length} chiffre(s) restant(s) pour un SIRET complet`
                    : ""}
                </p>
              )}
              {siretNumber && siretNumber.length >= 9 && siretNumber.length < 14 && (
              <p className="mt-1 text-xs text-muted-foreground">
                  SIREN détecté (9 chiffres). Le SIRET principal sera recherché automatiquement.
              </p>
            )}
          </div>
          )}

          {/* Note pour PORTAGE_SALARIAL */}
          {employmentStatus === "PORTAGE_SALARIAL" && (
            <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-blue-800 dark:text-blue-200">
                <strong>Note importante :</strong> Pour le portage salarial, vous devrez compléter vos informations 
                personnelles et bancaires (lieu de naissance, numéro de sécurité sociale, IBAN, BIC, document RIB) 
                dans votre profil après l'inscription. Ces données seront transmises à notre partenaire (PayFit/Silae) 
                pour la gestion de votre contrat de travail.
              </p>
            </div>
          )}

          {/* Mot de passe et Confirmation sur la même ligne */}
          <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Confirmer *
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
          </div>
          
          {/* Indicateur de force du mot de passe */}
          {password && (
            <PasswordStrength password={password} />
          )}

          {/* Erreur générale */}
          {submitError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <div className="text-sm text-destructive whitespace-pre-line">
                {submitError}
              </div>
            </div>
          )}

          {/* Bouton de soumission */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              "Créer mon compte cuisinier"
            )}
          </Button>
          </form>

          {/* Lien vers login */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/auth/login"
                className="text-purple-600 hover:text-purple-700 font-medium"
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

