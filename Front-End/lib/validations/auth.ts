import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * Schémas de validation Zod pour l'authentification
 * Validation stricte côté client avant envoi au backend
 */

/**
 * Type helper pour forcer les types corrects dans les schémas Zod
 * Résout les problèmes d'inférence avec z.preprocess, z.coerce, etc.
 * Utilisation: FixZodType<BaseType, { fieldName: correctType }>
 */
type FixZodType<T, Fixes extends Partial<Record<keyof T, any>>> = Omit<T, keyof Fixes> & Fixes;

/**
 * Helper pour créer un resolver Zod avec le type correct
 * Résout les problèmes d'inférence avec z.coerce, z.preprocess, etc.
 * @param schema - Le schéma Zod
 * @param formType - Le type TypeScript attendu pour le formulaire
 */
export function createTypedResolver<TFormData>(
  schema: z.ZodTypeAny
): ReturnType<typeof zodResolver<z.ZodType<TFormData>>> {
  return zodResolver(schema) as unknown as ReturnType<typeof zodResolver<z.ZodType<TFormData>>>;
}

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
      .regex(/^[1-9](\s\d{2}){4}$|^$/, "Numéro de téléphone invalide")
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
      .regex(/^[1-9](\s\d{2}){4}$|^$/, "Numéro de téléphone invalide")
      .optional()
      .or(z.literal("")),
        employmentStatus: z.enum(
          ["AUTO_ENTREPRENEUR", "PORTAGE_SALARIAL", "MICRO_ENTREPRISE", "ASSOCIATION"],
          {
            message: "Veuillez sélectionner un statut",
      },
        ),
    siretNumber: z
      .string()
      .regex(/^[0-9]{9,14}$/, "Le numéro doit contenir 9 chiffres (SIREN) ou 14 chiffres (SIRET)")
      .optional()
      .or(z.literal("")),
    headline: z
      .string()
      .min(10, "Veuillez décrire votre activité en quelques mots (minimum 10 caractères)")
      .max(160, "L'accroche ne peut pas dépasser 160 caractères"),
    hourlyRate: z.coerce
      .number({
        invalid_type_error: "Veuillez saisir un tarif horaire valide",
        required_error: "Le tarif horaire est requis",
      })
      .min(10, "Le tarif horaire doit être d'au moins 10€")
      .max(500, "Le tarif horaire ne peut pas dépasser 500€"),
    // Champs pour PORTAGE_SALARIAL
    birthPlace: z
      .string()
      .min(2, "Le lieu de naissance doit contenir au moins 2 caractères")
      .max(100, "Le lieu de naissance ne peut pas dépasser 100 caractères")
      .optional()
      .or(z.literal("")),
    socialSecurityNumber: z
      .string()
      .regex(/^[12][0-9]{2}(0[1-9]|1[0-2])([0-9]{2}|2[AB])[0-9]{3}[0-9]{3}[0-9]{2}$/, "Numéro de sécurité sociale invalide (format: 1 85 05 75 123 45 67)")
      .optional()
      .or(z.literal("")),
    iban: z
      .string()
      .regex(/^FR[0-9]{2}[A-Z0-9]{23}$/i, "IBAN invalide (format FR requis, ex: FR76 1234 5678 9012 3456 7890 123)")
      .optional()
      .or(z.literal("")),
    bic: z
      .string()
      .regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i, "Code BIC invalide (ex: BNPAFRPPXXX)")
      .optional()
      .or(z.literal("")),
    ribDocument: z
      .string()
      .regex(/^data:(application\/pdf|image\/jpeg|image\/png);base64,/i, "Format de fichier RIB invalide (PDF, JPEG ou PNG)")
      .max(15_000_000, "Le document RIB est trop volumineux")
      .optional()
      .or(z.literal("")),
    ribDocumentName: z.string().max(255).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    // Validation conditionnelle : SIRET obligatoire pour AUTO_ENTREPRENEUR et MICRO_ENTREPRISE
    if (data.employmentStatus === "AUTO_ENTREPRENEUR" || data.employmentStatus === "MICRO_ENTREPRISE") {
      if (!data.siretNumber || data.siretNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le numéro SIRET est obligatoire pour les statuts AUTO_ENTREPRENEUR et MICRO_ENTREPRISE",
          path: ["siretNumber"],
        });
      }
    }

    // Note: Les champs PORTAGE_SALARIAL ne sont plus obligatoires à l'inscription
    // Ils seront complétés lors de la complétion du profil
  });

type RegisterCookFormDataBase = z.infer<typeof registerCookSchema>;
export type RegisterCookFormData = FixZodType<RegisterCookFormDataBase, { hourlyRate: number }>;
