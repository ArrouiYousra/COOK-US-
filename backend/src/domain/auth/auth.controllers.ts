import type { Request, Response } from "express";
import type { Session } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  supabaseAdmin,
  createSupabaseAuthClient,
} from "@config/supabaseClient";
import type { AuthRequest } from "@core/middleware/authGuard";
import { UserStore } from "@stores/user.store";
import {
  InseeApiError,
  InseeService,
  type SiretValidationResult,
} from "@domain/insee/insee.service";
import { buildAuthResponse, mapUserToAuthUser } from "./auth.utils";
import type { User, UserRole } from "../../types/database.types";

const isProduction = process.env.NODE_ENV === "production";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const saltRounds = Number(process.env.AUTH_PASSWORD_ROUNDS ?? 12);
const accessTokenMaxAgeSeconds = Number(
  process.env.ACCESS_TOKEN_TTL ?? 60 * 60,
); // 1h
const refreshTokenMaxAgeSeconds = Number(
  process.env.REFRESH_TOKEN_TTL ?? 60 * 60 * 24 * 14,
); // 14j

// Détecter si on est en cross-origin (frontend et backend sur des domaines différents)
// En production, si le frontend n'est pas sur localhost, c'est probablement cross-origin
// (frontend sur Vercel, backend sur Render = cross-origin)
const isCrossOrigin = isProduction && !frontendUrl.includes("localhost") && !frontendUrl.includes("127.0.0.1");

// Log pour vérifier la détection
if (isProduction) {
  console.log("[Auth] Cross-origin detection:", {
    isCrossOrigin,
    isProduction,
    frontendUrl,
    backendUrl: process.env.BACKEND_URL,
    reason: isCrossOrigin ? "Production avec frontend externe" : "Local ou même domaine",
  });
}

const cookieBaseOptions = {
  httpOnly: true,
  secure: isProduction, // Obligatoire pour sameSite: "none"
  sameSite: (isCrossOrigin ? "none" : "lax") as "none" | "lax",
  path: "/",
};

const setSessionCookies = (res: Response, session: Session): void => {
  // Supprimer les anciens cookies avec différentes configurations pour éviter les conflits
  // Cela garantit que les nouveaux cookies avec la bonne configuration seront utilisés
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.clearCookie("access_token", { path: "/", domain: undefined });
  res.clearCookie("refresh_token", { path: "/", domain: undefined });
  
  const cookieOptions = {
    ...cookieBaseOptions,
    maxAge: accessTokenMaxAgeSeconds * 1000,
  };
  
  // Log pour déboguer la configuration des cookies
  if (process.env.NODE_ENV === "production") {
    console.log("[Auth] Setting cookies with options:", {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      isCrossOrigin,
      frontendUrl,
    });
  }
  
  res.cookie("access_token", session.access_token, cookieOptions);

  if (session.refresh_token) {
    res.cookie("refresh_token", session.refresh_token, {
      ...cookieBaseOptions,
      maxAge: refreshTokenMaxAgeSeconds * 1000,
    });
  }
};

const clearSessionCookies = (res: Response): void => {
  // Supprimer les cookies avec TOUTES les configurations possibles
  // (anciens cookies avec sameSite: "lax" et nouveaux avec sameSite: "none")
  const clearOptions = [
    { ...cookieBaseOptions }, // Configuration actuelle
    { ...cookieBaseOptions, sameSite: "lax" as const }, // Ancienne configuration
    { ...cookieBaseOptions, sameSite: "none" as const, secure: true }, // Configuration cross-origin
    { path: "/" }, // Configuration minimale
  ];
  
  clearOptions.forEach(options => {
    res.clearCookie("access_token", options);
    res.clearCookie("refresh_token", options);
  });
};

const baseRegisterSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

const registerClientSchema = baseRegisterSchema.extend({
  role: z.literal<"CLIENT">("CLIENT").default("CLIENT"),
});

const employmentStatusValues = [
  "AUTO_ENTREPRENEUR",
  "PORTAGE_SALARIAL",
  "MICRO_ENTREPRISE",
  "ASSOCIATION",
] as const;

const registerCookSchema = baseRegisterSchema
  .extend({
    role: z.literal<"COOK">("COOK").default("COOK"),
    employmentStatus: z.enum(employmentStatusValues),
    headline: z.string().min(10).max(160),
    hourlyRate: z.number().min(10).max(500),
    siretNumber: z
      .union([
        z.literal(""),
        z
          .string()
          .trim()
          .regex(
            /^[0-9]{9,14}$/,
            "Le numéro doit contenir 9 chiffres (SIREN) ou 14 chiffres (SIRET)",
          ),
        z.undefined(),
      ])
      .transform((value) => (value === "" ? undefined : value))
      .optional(),
    // Champs pour PORTAGE_SALARIAL
    birthPlace: z
      .string()
      .min(2, "Le lieu de naissance doit contenir au moins 2 caractères")
      .max(100, "Le lieu de naissance ne peut pas dépasser 100 caractères")
      .optional(),
    socialSecurityNumber: z
      .string()
      .regex(
        /^[12][0-9]{2}(0[1-9]|1[0-2])([0-9]{2}|2[AB])[0-9]{3}[0-9]{3}[0-9]{2}$/,
        "Numéro de sécurité sociale invalide",
      )
      .optional(),
    iban: z
      .string()
      .regex(/^FR[0-9]{2}[A-Z0-9]{23}$/i, "IBAN invalide (format FR requis)")
      .optional(),
    bic: z
      .string()
      .regex(
        /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
        "Code BIC invalide",
      )
      .optional(),
    ribDocument: z
      .string()
      .regex(
        /^data:(application\/pdf|image\/jpeg|image\/png);base64,/i,
        "Format de fichier RIB invalide (PDF, JPEG ou PNG attendu)",
      )
      .max(15_000_000, "Le document RIB est trop volumineux")
      .optional(),
    ribDocumentName: z.string().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    // Validation conditionnelle : SIRET obligatoire pour AUTO_ENTREPRENEUR et MICRO_ENTREPRISE
    if (
      data.employmentStatus === "AUTO_ENTREPRENEUR" ||
      data.employmentStatus === "MICRO_ENTREPRISE"
    ) {
      if (!data.siretNumber || data.siretNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le numéro SIRET est obligatoire pour les statuts AUTO_ENTREPRENEUR et MICRO_ENTREPRISE",
          path: ["siretNumber"],
        });
      }
    }

    // Note: Les champs PORTAGE_SALARIAL ne sont plus obligatoires à l'inscription
    // Ils seront complétés lors de la complétion du profil
  });

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
  role: z.enum(["CLIENT", "COOK"]).optional(),
});

const pickString = (...values: Array<unknown>): string | undefined =>
  values
    .map((value) =>
      typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined,
    )
    .find((value): value is string => typeof value === "string" && value.length > 0);

const extractNamesFromMetadata = (metadata?: Record<string, any>) => {
  const fullName = pickString(metadata?.full_name, metadata?.name);

  const firstName =
    pickString(
      metadata?.first_name,
      metadata?.given_name,
      metadata?.given_names,
      fullName?.split(" ")[0],
    ) ?? "Invité";

  const lastName =
    pickString(
      metadata?.last_name,
      metadata?.family_name,
      metadata?.surname,
      fullName ? fullName.split(" ").slice(1).join(" ") : undefined,
    ) ?? (firstName === "Invité" ? "CookUS" : "Cook");

  return { firstName, lastName };
};

const resolveRoleFromOAuth = (
  roleHint: unknown,
  metadata?: Record<string, any>,
): UserRole => {
  const normalize = (value: unknown): UserRole | undefined => {
    if (typeof value !== "string") return undefined;
    const upper = value.toUpperCase();
    if (upper === "CLIENT" || upper === "COOK") return upper;
    return undefined;
  };

  return (
    normalize(roleHint) ??
    normalize(metadata?.role) ??
    normalize(metadata?.user_role) ??
    "CLIENT"
  );
};

const ensureClientProfileExists = async (userId: string): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("client_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify client profile: ${error.message}`);
  }

  if (!data) {
    await UserStore.createClientProfile({ user_id: userId });
  }
};

const ensureCookProfileExists = async (
  userId: string,
  firstName: string,
): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from("cook_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify cook profile: ${error.message}`);
  }

  if (!data) {
    await UserStore.createCookProfile({
      user_id: userId,
      headline: `Chef ${firstName}`.trim(),
      hourly_rate: 45,
      employment_status: "AUTO_ENTREPRENEUR",
      bio: "",
      service_radius: 25,
      minimum_booking_hours: 2,
    });
  }
};

const ensureUserExistsForOAuth = async (
  supabaseUser: Session["user"] | null,
  roleHint?: UserRole,
): Promise<void> => {
  if (!supabaseUser?.id) {
    throw new Error("Invalid OAuth user data returned by Supabase");
  }

  const existingUser = await UserStore.getUserById(supabaseUser.id);
  const metadata = (supabaseUser.user_metadata ?? {}) as Record<string, any>;
  const { firstName, lastName } = extractNamesFromMetadata(metadata);
  const resolvedRole = resolveRoleFromOAuth(roleHint, metadata);

  if (existingUser) {
    const updates: Partial<User> = {};

    if (resolvedRole && existingUser.role !== resolvedRole) {
      updates.role = resolvedRole;
    }

    if (
      (!existingUser.avatar_url || existingUser.avatar_url.length === 0) &&
      typeof metadata.avatar_url === "string"
    ) {
      updates.avatar_url = metadata.avatar_url;
    }

    if (
      (!existingUser.email_verified || existingUser.email_verified.length === 0) &&
      (supabaseUser.email_confirmed_at || supabaseUser.confirmed_at)
    ) {
      updates.email_verified =
        supabaseUser.email_confirmed_at ?? supabaseUser.confirmed_at ?? null;
    }

    if (
      (!existingUser.first_name || existingUser.first_name === "Invité") &&
      firstName
    ) {
      updates.first_name = firstName;
    }

    if (
      (!existingUser.last_name || existingUser.last_name === "Cook") &&
      lastName
    ) {
      updates.last_name = lastName;
    }

    if (
      (!existingUser.phone || existingUser.phone.length === 0) &&
      typeof supabaseUser.phone === "string" &&
      supabaseUser.phone.trim().length > 0
    ) {
      updates.phone = supabaseUser.phone;
    }

    if (existingUser.status === "PENDING_VERIFICATION") {
      updates.status = "ACTIVE";
    }

    if (Object.keys(updates).length > 0) {
      await UserStore.updateUser(supabaseUser.id, updates);
    }

    if (resolvedRole === "COOK") {
      await ensureCookProfileExists(supabaseUser.id, firstName);
    } else {
      await ensureClientProfileExists(supabaseUser.id);
    }

    return;
  }

  if (!supabaseUser.email) {
    throw new Error(
      "Le fournisseur OAuth n'a pas retourné d'email. Impossible de créer le compte.",
    );
  }

  const passwordHash = await bcrypt.hash(
    `oauth-${supabaseUser.id}-${Date.now()}`,
    saltRounds,
  );

  const metadataPhone =
    typeof metadata.phone === "string" && metadata.phone.trim().length > 0
      ? metadata.phone.trim()
      : undefined;
  const supabasePhone =
    typeof supabaseUser.phone === "string" && supabaseUser.phone.trim().length > 0
      ? supabaseUser.phone.trim()
      : undefined;

  const createdUser = await UserStore.createUser(supabaseUser.id, {
    email: supabaseUser.email,
    passwordHash,
    first_name: firstName,
    last_name: lastName,
    role: resolvedRole,
    phone: supabasePhone ?? metadataPhone,
  });

  const updates: Partial<User> = {
    status: "ACTIVE",
  };

  if (metadata.avatar_url) {
    updates.avatar_url = metadata.avatar_url;
  }

  if (supabaseUser.email_confirmed_at || supabaseUser.confirmed_at) {
    updates.email_verified =
      supabaseUser.email_confirmed_at ?? supabaseUser.confirmed_at ?? null;
  }

  if (Object.keys(updates).length > 0) {
    await UserStore.updateUser(createdUser.id, updates);
  }

  if (resolvedRole === "COOK") {
    await ensureCookProfileExists(createdUser.id, firstName);
  } else {
    await ensureClientProfileExists(createdUser.id);
  }
};

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8),
  token: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const updateEmailSchema = z.object({
  newEmail: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

const resendVerificationSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
});

const createSupabaseSession = async (
  email: string,
  password: string,
): Promise<Session> => {
  const authClient = createSupabaseAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase signInWithPassword error:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });
    throw new Error(error.message ?? "Failed to create session");
  }

  if (!data.session) {
    console.error("No session returned from signInWithPassword");
    throw new Error("Failed to create session: no session data returned");
  }

  return data.session;
};

const ensureUserDoesNotExist = async (email: string): Promise<void> => {
  const existing = await UserStore.getUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }
};

const rollbackUserCreation = async (userId: string): Promise<void> => {
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error("Rollback auth user error:", error);
  }

  try {
    await supabaseAdmin.from("users").delete().eq("id", userId);
  } catch (error) {
    console.error("Rollback app user error:", error);
  }
};

const createBaseUser = async (
  role: UserRole,
  registerPayload: z.infer<typeof baseRegisterSchema>,
  additionalMetadata?: Record<string, any>,
): Promise<{ userId: string }> => {
  await ensureUserDoesNotExist(registerPayload.email);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: registerPayload.email,
    password: registerPayload.password,
    email_confirm: true, // Confirmer l'email automatiquement pour permettre la connexion immédiate
    user_metadata: {
      role,
      firstName: registerPayload.firstName,
      lastName: registerPayload.lastName,
      ...additionalMetadata,
    },
  });

  if (error) {
    console.error("Supabase createUser error:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists")
    ) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }
    throw new Error(error.message);
  }

  if (!data?.user) {
    throw new Error("Failed to create user");
  }

  const passwordHash = await bcrypt.hash(registerPayload.password, saltRounds);
  try {
    await UserStore.createUser(data.user.id, {
      email: registerPayload.email,
      passwordHash,
      first_name: registerPayload.firstName,
      last_name: registerPayload.lastName,
      role,
      phone: registerPayload.phone,
    });
  } catch (userError) {
    console.error("Error creating user in database:", userError);
    // Rollback Supabase Auth user if database insert fails
    try {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    } catch (rollbackError) {
      console.error("Error rolling back Supabase Auth user:", rollbackError);
    }
    throw userError;
  }

  return { userId: data.user.id };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const role = (req.body?.role as UserRole | undefined) ?? "CLIENT";
  if (role === "COOK") {
    await registerCook(req, res);
    return;
  }

  await registerClient(req, res);
};

export const registerClient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = registerClientSchema.parse({
      ...req.body,
      role: "CLIENT",
    });

    const { userId } = await createBaseUser("CLIENT", payload);

    try {
      await UserStore.createClientProfile({
        user_id: userId,
      });
    } catch (innerError) {
      await rollbackUserCreation(userId);
      throw innerError;
    }

    // Ne pas créer de session automatiquement - rediriger vers la page de connexion
    res.status(201).json({
      message: "Compte créé avec succès",
      email: payload.email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({
        error: "Conflict",
        message: "Un compte existe déjà avec cet email",
      });
      return;
    }

    console.error("Register client error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message:
        error instanceof Error
          ? error.message
          : "Impossible de créer le compte client",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : String(error)
          : undefined,
    });
  }
};

export const registerCook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = registerCookSchema.parse({
      ...req.body,
      role: "COOK",
      hourlyRate:
        typeof req.body?.hourlyRate === "string"
          ? Number.parseFloat(req.body?.hourlyRate)
          : req.body?.hourlyRate,
    });

    // Validation du SIRET uniquement pour AUTO_ENTREPRENEUR et MICRO_ENTREPRISE
    // Pour PORTAGE_SALARIAL et ASSOCIATION : pas de SIRET requis, pas de validation
    const requiresSiretValidation =
      payload.employmentStatus === "AUTO_ENTREPRENEUR" ||
      payload.employmentStatus === "MICRO_ENTREPRISE";

    let siretValidationResult: SiretValidationResult | undefined;
    let validatedSiretNumber: string | undefined = undefined;

    // Validation du SIRET uniquement si requis
    if (requiresSiretValidation) {
      // Vérifier si un SIRET valide a été fourni
      const hasSiretNumber =
        payload.siretNumber && payload.siretNumber.trim().length > 0;

      // SIRET obligatoire pour AUTO_ENTREPRENEUR et MICRO_ENTREPRISE
      if (!hasSiretNumber) {
        res.status(400).json({
          error: "ValidationError",
          message:
            "Le numéro SIRET est obligatoire pour les statuts AUTO_ENTREPRENEUR et MICRO_ENTREPRISE",
        });
        return;
      }

      // Valider le SIRET (obligatoire, donc on bloque en cas d'erreur)
      try {
        siretValidationResult = await InseeService.validateSiret(
          payload.siretNumber!,
        );
        // Si un SIREN a été fourni, utiliser le SIRET principal trouvé
        if (
          siretValidationResult.siret &&
          siretValidationResult.siret !== payload.siretNumber
        ) {
          validatedSiretNumber = siretValidationResult.siret;
        } else {
          validatedSiretNumber = payload.siretNumber;
        }
      } catch (validationError) {
        // Mode dégradé : si l'API INSEE est down, on continue quand même
        if (validationError instanceof InseeApiError) {
          // Si c'est une erreur de validation (400), on bloque car le SIRET est obligatoire
          if (validationError.statusCode === 400) {
            // Construire un message d'erreur plus informatif
            const details = validationError.details as any;
            let errorMessage = validationError.message;

            // Ajouter des suggestions basées sur les détails
            if (
              details?.possibleCauses &&
              Array.isArray(details.possibleCauses)
            ) {
              errorMessage +=
                "\n\nCauses possibles :\n" +
                details.possibleCauses
                  .map((cause: string) => `• ${cause}`)
                  .join("\n");
            }

            // Ajouter des suggestions de dépannage si disponibles
            if (
              details?.troubleshooting &&
              Array.isArray(details.troubleshooting)
            ) {
              errorMessage +=
                "\n\nVérifications à effectuer :\n" +
                details.troubleshooting
                  .map((step: string) => `• ${step}`)
                  .join("\n");
            }

            res.status(400).json({
              error: "SiretValidationError",
              message: errorMessage,
              details: validationError.details,
              siret: payload.siretNumber,
            });
            return;
          }
          // Sinon (500, 503, etc.), on continue avec siret_verified = false
          console.warn(
            "API INSEE indisponible, inscription en mode dégradé:",
            validationError.message,
          );
          siretValidationResult = { isValid: false };
          validatedSiretNumber = payload.siretNumber;
        } else {
          // Erreur inattendue, on continue quand même
          console.error("Erreur validation SIRET:", validationError);
          siretValidationResult = { isValid: false };
          validatedSiretNumber = payload.siretNumber;
        }
      }
    }
    // Pour PORTAGE_SALARIAL et ASSOCIATION : pas de SIRET, pas de validation, on continue normalement

    const { userId } = await createBaseUser("COOK", payload, {
      employmentStatus: payload.employmentStatus,
    });

    let session: Session | undefined;

    try {
      // Note: Les champs PORTAGE_SALARIAL (birthPlace, SSN, IBAN, BIC, RIB) ne sont plus traités à l'inscription
      // Ils seront complétés via updateMyProfile après l'inscription
      await UserStore.createCookProfile({
        user_id: userId,
        headline: payload.headline,
        hourly_rate: payload.hourlyRate,
        employment_status: payload.employmentStatus,
        siret_number: validatedSiretNumber, // Utilise le SIRET validé (peut être différent si SIREN fourni)
        siret_verified: siretValidationResult?.isValid ?? false,
        siret_verified_at: siretValidationResult?.isValid
          ? new Date().toISOString()
          : undefined,
        // Champs PORTAGE_SALARIAL laissés vides à l'inscription
        birth_place: undefined,
        social_security_number: undefined,
        iban: undefined,
        bic: undefined,
        rib_document_url: undefined,
      });

      session = await createSupabaseSession(payload.email, payload.password);
    } catch (innerError) {
      await rollbackUserCreation(userId);
      throw innerError;
    }

    if (!session) {
      throw new Error("Session creation failed");
    }

    setSessionCookies(res, session);

    const authResponse = await buildAuthResponse(userId, session);
    res.status(201).json(authResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({
        error: "Conflict",
        message: "Un compte existe déjà avec cet email",
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message.startsWith("RIB_UPLOAD_FAILED::")
    ) {
      const [, message] = error.message.split("::");
      res.status(400).json({
        error: "RibUploadFailed",
        message: message || "Impossible d'enregistrer le document RIB",
      });
      return;
    }

    console.error("Register cook error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      cause: error instanceof Error ? error.cause : undefined,
    });

    // Si c'est une erreur de validation Zod, la traiter séparément
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'inscrire le cuisinier",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : String(error)
          : undefined,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = loginSchema.parse(req.body);
    const authClient = createSupabaseAuthClient();

    const { data, error } = await authClient.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session || !data.user) {
      res.status(401).json({
        error: "InvalidCredentials",
        message: "Email ou mot de passe incorrect",
      });
      return;
    }

    // Mettre à jour uniquement last_login_at (le password hash est déjà stocké à l'inscription)
    await UserStore.updateUser(data.user.id, {
      last_login_at: new Date().toISOString(),
    });

    setSessionCookies(res, data.session);
    const authResponse = await buildAuthResponse(data.user.id, data.session);
    res.status(200).json(authResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de se connecter",
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    clearSessionCookies(res);
    res.status(200).json({
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de se déconnecter",
    });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const refreshTokenFromCookie = (
      req as Request & { cookies?: Record<string, string> }
    ).cookies?.refresh_token;
    const refreshTokenCandidate =
      refreshTokenFromCookie ?? req.body?.refreshToken;

    if (!refreshTokenCandidate) {
      res.status(400).json({
        error: "BadRequest",
        message: "Le token de rafraîchissement est requis",
      });
      return;
    }

    const payload = refreshSchema.parse({
      refreshToken: refreshTokenCandidate,
      role: req.body?.role,
    });

    const authClient = createSupabaseAuthClient();
    const { data, error } = await authClient.auth.refreshSession({
      refresh_token: payload.refreshToken,
    });

    if (error || !data.session || !data.user) {
      clearSessionCookies(res);
      res.status(401).json({
        error: "InvalidRefreshToken",
        message: "Le token de rafraîchissement est invalide ou expiré",
      });
      return;
    }

    await ensureUserExistsForOAuth(data.user, payload.role);

    setSessionCookies(res, data.session);
    const authResponse = await buildAuthResponse(data.user.id, data.session);
    res.status(200).json(authResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    console.error("Refresh token error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de rafraîchir la session",
    });
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Utilisateur non authentifié",
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: "NotFound",
        message: "Utilisateur introuvable",
      });
      return;
    }

    res.status(200).json({
      user: mapUserToAuthUser(user),
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de récupérer l'utilisateur courant",
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = forgotPasswordSchema.parse(req.body);
    const redirectTo = `${frontendUrl}/auth/reset-password`;

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
      payload.email,
      {
        redirectTo,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      message: "Si un compte existe, un email de réinitialisation a été envoyé",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    console.error("Forgot password error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de traiter la demande de réinitialisation",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = resetPasswordSchema.parse(req.body);

    // Le token de réinitialisation est un access_token de Supabase
    // On doit créer une session temporaire pour récupérer l'utilisateur
    const authClient = createSupabaseAuthClient();

    // Décoder le token JWT pour extraire l'ID utilisateur (méthode alternative)
    // Ou utiliser setSession pour créer une session temporaire
    // Supabase envoie le token dans l'URL, on peut l'utiliser pour récupérer l'utilisateur
    const { data: sessionData, error: sessionError } =
      await authClient.auth.setSession({
        access_token: payload.token,
        refresh_token: "", // Pas nécessaire pour la récupération
      });

    if (sessionError || !sessionData?.user) {
      // Si setSession échoue, essayer de décoder le JWT directement
      try {
        // Décoder le JWT pour extraire l'ID utilisateur
        const tokenParts = payload.token.split(".");
        if (tokenParts.length !== 3 || !tokenParts[1]) {
          throw new Error("Invalid token format");
        }

        const payloadPart = Buffer.from(tokenParts[1], "base64").toString(
          "utf-8",
        );
        const tokenPayload = JSON.parse(payloadPart);
        const userId = tokenPayload.sub;

        if (!userId) {
          throw new Error("User ID not found in token");
        }

        // Mettre à jour le mot de passe directement avec l'ID
        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: payload.password,
          });

        if (updateError) {
          throw new Error(updateError.message);
        }

        const passwordHash = await bcrypt.hash(payload.password, saltRounds);
        await UserStore.updateUser(userId, {
          password: passwordHash,
        });

        res.status(200).json({
          message: "Mot de passe réinitialisé avec succès",
        });
        return;
      } catch (decodeError) {
        res.status(400).json({
          error: "InvalidToken",
          message: "Le lien de réinitialisation est invalide ou expiré",
        });
        return;
      }
    }

    // Si setSession a fonctionné, utiliser l'utilisateur récupéré
    const userId = sessionData.user.id;

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: payload.password,
      });

    if (updateError) {
      throw new Error(updateError.message);
    }

    const passwordHash = await bcrypt.hash(payload.password, saltRounds);
    await UserStore.updateUser(userId, {
      password: passwordHash,
    });

    res.status(200).json({
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    console.error("Reset password error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de réinitialiser le mot de passe",
    });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Utilisateur non authentifié",
      });
      return;
    }

    const payload = changePasswordSchema.parse(req.body);
    const userRecord = await UserStore.getUserById(req.user.id);

    if (!userRecord) {
      res.status(404).json({
        error: "NotFound",
        message: "Utilisateur introuvable",
      });
      return;
    }

    const authClient = createSupabaseAuthClient();
    const { error: verifyError } = await authClient.auth.signInWithPassword({
      email: userRecord.email,
      password: payload.currentPassword,
    });

    if (verifyError) {
      res.status(401).json({
        error: "InvalidCredentials",
        message: "Le mot de passe actuel est incorrect",
      });
      return;
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        password: payload.newPassword,
      });

    if (updateError) {
      throw new Error(updateError.message);
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, saltRounds);
    await UserStore.updateUser(req.user.id, {
      password: passwordHash,
    });

    res.status(200).json({
      message: "Mot de passe mis à jour avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    console.error("Change password error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de modifier le mot de passe",
    });
  }
};

export const updateEmail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Utilisateur non authentifié",
      });
      return;
    }

    const payload = updateEmailSchema.parse(req.body);
    const currentUser = await UserStore.getUserById(req.user.id);

    if (!currentUser) {
      res.status(404).json({
        error: "NotFound",
        message: "Utilisateur introuvable",
      });
      return;
    }

    const authClient = createSupabaseAuthClient();
    const { error: verifyError } = await authClient.auth.signInWithPassword({
      email: currentUser.email,
      password: payload.password,
    });

    if (verifyError) {
      res.status(401).json({
        error: "InvalidCredentials",
        message: "Mot de passe incorrect",
      });
      return;
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        email: payload.newEmail,
        email_confirm: false,
      });

    if (updateError) {
      throw new Error(updateError.message);
    }

    await UserStore.updateUser(req.user.id, {
      email: payload.newEmail,
      status: "PENDING_VERIFICATION",
    });

    res.status(200).json({
      message: "Email mis à jour. Veuillez vérifier votre nouvelle adresse.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    console.error("Update email error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de modifier l'adresse email",
    });
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Utilisateur non authentifié",
      });
      return;
    }

    const payload = deleteAccountSchema.parse(req.body);
    const currentUser = await UserStore.getUserById(req.user.id);

    if (!currentUser) {
      res.status(404).json({
        error: "NotFound",
        message: "Utilisateur introuvable",
      });
      return;
    }

    const authClient = createSupabaseAuthClient();
    const { error: verifyError } = await authClient.auth.signInWithPassword({
      email: currentUser.email,
      password: payload.password,
    });

    if (verifyError) {
      res.status(401).json({
        error: "InvalidCredentials",
        message: "Mot de passe incorrect",
      });
      return;
    }

    // Supprimer de Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      req.user.id,
    );
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Supprimer de la table users (cascade supprimera les profils associés)
    try {
      await supabaseAdmin.from("users").delete().eq("id", req.user.id);
    } catch (dbError) {
      console.error("Failed to delete user from database:", dbError);
      // Ne pas échouer si la suppression DB échoue, l'utilisateur est déjà supprimé de Supabase Auth
    }

    clearSessionCookies(res);

    res.status(200).json({
      message: "Compte supprimé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    console.error("Delete account error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de supprimer le compte",
    });
  }
};

export const resendVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = resendVerificationSchema.parse(req.body);

    const authClient = createSupabaseAuthClient();
    const { error } = await authClient.auth.resend({
      type: "signup",
      email: payload.email,
    });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      message: "Si un compte existe, un email de vérification a été envoyé",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "ValidationError",
        details: error.flatten(),
      });
      return;
    }

    console.error("Resend verification error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de renvoyer le mail de vérification",
    });
  }
};

export const oauthGoogle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { role } = req.body;
    const redirectUrl = `${frontendUrl}/auth/callback`;

    const authClient = createSupabaseAuthClient();
    const { data, error } = await authClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          role: (role as string) || "CLIENT",
        },
      },
    });

    if (error || !data.url) {
      console.error("Google OAuth error:", error);
      res.status(500).json({
        error: "OAuth Failed",
        message: "Échec lors de la redirection Google OAuth",
      });
      return;
    }

    res.status(200).json({
      redirectUrl: data.url,
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Impossible de lancer Google OAuth",
    });
  }
};

