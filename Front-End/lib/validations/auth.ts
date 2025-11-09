import { z } from "zod";

/**
 * Schémas de validation Zod pour l'authentification
 * Validation stricte côté client avant envoi au backend
 */

// Validation du mot de passe : min 8 caractères, majuscule, chiffre
const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

// Schéma d'inscription client
export const registerClientSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(100, "Le prénom ne peut pas dépasser 100 caractères")
      .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, "Le prénom ne peut contenir que des lettres"),
    lastName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, "Le nom ne peut contenir que des lettres"),
    email: z
      .string()
      .email("Adresse email invalide")
      .toLowerCase()
      .trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^(\+33|0)[1-9](\d{2}){4}$/, "Numéro de téléphone invalide")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterClientFormData = z.infer<typeof registerClientSchema>;

// Schéma de connexion
export const loginSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schéma mot de passe oublié
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide")
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Schéma réinitialisation mot de passe
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token invalide"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Schéma d'inscription cuisinier
export const registerCookSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(100, "Le prénom ne peut pas dépasser 100 caractères")
      .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, "Le prénom ne peut contenir que des lettres"),
    lastName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, "Le nom ne peut contenir que des lettres"),
    email: z
      .string()
      .email("Adresse email invalide")
      .toLowerCase()
      .trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^(\+33|0)[1-9](\d{2}){4}$/, "Numéro de téléphone invalide")
      .optional()
      .or(z.literal("")),
        employmentStatus: z.enum(
          ["AUTO_ENTREPRENEUR", "PORTAGE_SALARIAL", "MICRO_ENTREPRISE", "ASSOCIATION"],
          {
            message: "Veuillez sélectionner un statut",
          }
        ),
    siretNumber: z
      .string()
      .regex(/^[0-9]{14}$/, "Le numéro SIRET doit contenir 14 chiffres")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterCookFormData = z.infer<typeof registerCookSchema>;
