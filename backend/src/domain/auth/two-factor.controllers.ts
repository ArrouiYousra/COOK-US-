import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { UserStore } from "@stores/user.store";
import { z } from "zod";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import { supabaseAdmin } from "@config/supabaseClient";

const enable2FASchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis"),
});

const verify2FASchema = z.object({
  token: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

/**
 * Activer l'authentification à deux facteurs
 * Génère un secret et un QR code
 */
export const enable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const parsed = enable2FASchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parsed.error.flatten(),
      });
      return;
    }

    // Vérifier le mot de passe
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
      return;
    }

    // Vérifier le mot de passe via Supabase Auth
    try {
      await supabaseAdmin.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.password,
      });
    } catch (error) {
      res.status(401).json({
        error: "InvalidPassword",
        message: "Mot de passe incorrect",
      });
      return;
    }

    // Générer un secret 2FA
    const secret = speakeasy.generateSecret({
      name: `Cook US (${user.email})`,
      issuer: "Cook US",
    });

    // Stocker temporairement le secret (pas encore activé)
    await UserStore.updateUser(req.user.id, {
      two_factor_secret: secret.base32,
    });

    // Générer le QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    res.status(200).json({
      message: "2FA setup initiated",
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    });
  } catch (error) {
    console.error("Enable 2FA error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to enable 2FA",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Vérifier et activer définitivement la 2FA
 */
export const verifyAndEnable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const parsed = verify2FASchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parsed.error.flatten(),
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user || !user.two_factor_secret) {
      res.status(400).json({
        error: "Bad Request",
        message: "2FA setup not initiated. Please call /enable first.",
      });
      return;
    }

    // Vérifier le token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: parsed.data.token,
      window: 2, // Accepte les tokens dans une fenêtre de ±2 périodes
    });

    if (!verified) {
      res.status(400).json({
        error: "InvalidToken",
        message: "Code de vérification invalide",
      });
      return;
    }

    // Activer la 2FA
    await UserStore.updateUser(req.user.id, {
      two_factor_enabled: true,
    });

    res.status(200).json({
      message: "2FA enabled successfully",
    });
  } catch (error) {
    console.error("Verify 2FA error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to verify 2FA",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Désactiver l'authentification à deux facteurs
 */
export const disable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const parsed = enable2FASchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parsed.error.flatten(),
      });
      return;
    }

    // Vérifier le mot de passe
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
      return;
    }

    try {
      await supabaseAdmin.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.password,
      });
    } catch (error) {
      res.status(401).json({
        error: "InvalidPassword",
        message: "Mot de passe incorrect",
      });
      return;
    }

    // Désactiver la 2FA
    await UserStore.updateUser(req.user.id, {
      two_factor_enabled: false,
      two_factor_secret: null,
    });

    res.status(200).json({
      message: "2FA disabled successfully",
    });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to disable 2FA",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Vérifier un code 2FA lors de la connexion
 */
export const verify2FAToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const parsed = verify2FASchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parsed.error.flatten(),
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      res.status(400).json({
        error: "Bad Request",
        message: "2FA is not enabled for this account",
      });
      return;
    }

    // Vérifier le token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: parsed.data.token,
      window: 2,
    });

    if (!verified) {
      res.status(400).json({
        error: "InvalidToken",
        message: "Code de vérification invalide",
      });
      return;
    }

    res.status(200).json({
      message: "2FA token verified successfully",
    });
  } catch (error) {
    console.error("Verify 2FA token error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to verify 2FA token",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
