"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Shield, Key, Smartphone, Loader2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import Image from "next/image";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

const verify2FASchema = z.object({
  token: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
type Verify2FAFormData = z.infer<typeof verify2FASchema>;

/**
 * Onglet "Sécurité"
 * Gestion de la sécurité : changement de mot de passe, authentification 2FA
 */
export function SecurityTab() {
  const { user } = useAuthStore();
  const { showSuccessToast, showErrorToast } = useNotificationToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [show2FAPassword, setShow2FAPassword] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualEntryKey, setManualEntryKey] = useState<string | null>(null);
  const [password2FA, setPassword2FA] = useState("");
  const [passwordDisable2FA, setPasswordDisable2FA] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA },
    reset: reset2FA,
  } = useForm<Verify2FAFormData>({
    resolver: zodResolver(verify2FASchema),
  });

  const newPassword = watch("newPassword");

  // Charger l'état 2FA depuis le profil utilisateur
  useEffect(() => {
    if (user) {
      setTwoFactorEnabled((user as any).two_factor_enabled || false);
    }
  }, [user]);

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccessMessage("Mot de passe changé avec succès !");
      showSuccessToast("Mot de passe changé avec succès !");
      reset();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Erreur lors du changement de mot de passe:", error);
      const message = error.response?.data?.message || "Impossible de changer le mot de passe";
      setErrorMessage(message);
      showErrorToast(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!password2FA) {
      setErrorMessage("Veuillez entrer votre mot de passe");
      return;
    }

    setIsSettingUp2FA(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.enable2FA(password2FA);
      setQrCode(response.qrCode);
      setManualEntryKey(response.manualEntryKey);
      setShow2FAPassword(false);
      setShow2FASetup(true);
    } catch (error: any) {
      console.error("Erreur lors de l'activation de la 2FA:", error);
      const message = error.response?.data?.message || "Impossible d'activer la 2FA";
      setErrorMessage(message);
      showErrorToast(message);
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerifyAndEnable2FA = async (data: Verify2FAFormData) => {
    try {
      await apiClient.verifyAndEnable2FA(data.token);
      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setQrCode(null);
      setManualEntryKey(null);
      setPassword2FA("");
      reset2FA();
      setSuccessMessage("2FA activée avec succès !");
      showSuccessToast("2FA activée avec succès !");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Erreur lors de la vérification 2FA:", error);
      const message = error.response?.data?.message || "Code invalide";
      setErrorMessage(message);
      showErrorToast(message);
    }
  };

  const handleDisable2FA = async () => {
    if (!passwordDisable2FA) {
      const message = "Veuillez entrer votre mot de passe";
      setErrorMessage(message);
      showErrorToast(message);
      return;
    }

    setIsDisabling2FA(true);
    try {
      await apiClient.disable2FA(passwordDisable2FA);
      setTwoFactorEnabled(false);
      setShow2FADisable(false);
      setPasswordDisable2FA("");
      setSuccessMessage("2FA désactivée avec succès !");
      showSuccessToast("2FA désactivée avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la désactivation de la 2FA:", error);
      const message = error.response?.data?.message || "Impossible de désactiver la 2FA";
      setErrorMessage(message);
      showErrorToast(message);
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsDisabling2FA(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled) {
      // Ouvrir le dialogue pour entrer le mot de passe
      setShow2FAPassword(true);
      setShow2FASetup(false);
      setPassword2FA("");
      setQrCode(null);
      setManualEntryKey(null);
      setErrorMessage(null);
    } else {
      // Ouvrir le dialogue pour désactiver
      setShow2FADisable(true);
      setPasswordDisable2FA("");
      setErrorMessage(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Changer le mot de passe */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Changer le mot de passe
          </h3>
        </div>

        <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Mot de passe actuel *</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register("currentPassword")}
              placeholder="••••••••"
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="newPassword">Nouveau mot de passe *</Label>
            <Input
              id="newPassword"
              type="password"
              {...register("newPassword")}
              placeholder="••••••••"
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>
            )}
            {newPassword && <PasswordStrength password={newPassword} />}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe *</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isChangingPassword} size="lg">
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Changement en cours...
              </>
            ) : (
              "Changer le mot de passe"
            )}
          </Button>
        </form>
      </div>

      {/* Authentification à deux facteurs */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Authentification à deux facteurs (2FA)
          </h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-accent">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">Authentification par application</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </p>
            </div>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isSettingUp2FA || isDisabling2FA}
          />
        </div>

        {twoFactorEnabled && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ L'authentification à deux facteurs est activée. Vous devrez entrer un code de
              votre application d'authentification lors de la connexion.
            </p>
          </div>
        )}
      </div>

      {/* Dialogue pour entrer le mot de passe avant d'activer la 2FA */}
      <Dialog open={show2FAPassword && !twoFactorEnabled} onOpenChange={(open) => !open && setShow2FAPassword(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Activer l'authentification à deux facteurs</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe pour commencer la configuration de la 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="password2FA">Mot de passe *</Label>
              <Input
                id="password2FA"
                type="password"
                value={password2FA}
                onChange={(e) => setPassword2FA(e.target.value)}
                placeholder="Votre mot de passe"
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShow2FAPassword(false);
                  setPassword2FA("");
                  setErrorMessage(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleEnable2FA}
                disabled={!password2FA || isSettingUp2FA}
                className="flex-1"
              >
                {isSettingUp2FA ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Configuration...
                  </>
                ) : (
                  "Continuer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour scanner le QR code */}
      <Dialog open={show2FASetup && !!qrCode} onOpenChange={(open) => !open && setShow2FASetup(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scanner le QR code</DialogTitle>
            <DialogDescription>
              Scannez ce code avec votre application d'authentification (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {qrCode && (
              <div className="flex justify-center">
                <Image
                  src={qrCode}
                  alt="QR Code 2FA"
                  width={200}
                  height={200}
                  className="border border-border rounded-lg"
                  unoptimized
                />
              </div>
            )}
            {manualEntryKey && (
              <div className="p-3 rounded-lg bg-accent">
                <p className="text-xs text-muted-foreground mb-1">Ou entrez cette clé manuellement :</p>
                <p className="text-sm font-mono text-foreground break-all">{manualEntryKey}</p>
              </div>
            )}
            <form onSubmit={handleSubmit2FA(handleVerifyAndEnable2FA)} className="space-y-4">
              <div>
                <Label htmlFor="token2FA">Code de vérification (6 chiffres) *</Label>
                <Input
                  id="token2FA"
                  type="text"
                  maxLength={6}
                  {...register2FA("token")}
                  placeholder="000000"
                  className="mt-2 text-center text-2xl tracking-widest"
                />
                {errors2FA.token && (
                  <p className="text-xs text-destructive mt-1">{errors2FA.token.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShow2FASetup(false);
                    setQrCode(null);
                    setManualEntryKey(null);
                    setPassword2FA("");
                    reset2FA();
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  Activer la 2FA
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour désactiver la 2FA */}
      <Dialog open={show2FADisable} onOpenChange={(open) => !open && setShow2FADisable(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Désactiver l'authentification à deux facteurs</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe pour confirmer la désactivation de la 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="passwordDisable2FA">Mot de passe *</Label>
              <Input
                id="passwordDisable2FA"
                type="password"
                value={passwordDisable2FA}
                onChange={(e) => setPasswordDisable2FA(e.target.value)}
                placeholder="Votre mot de passe"
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShow2FADisable(false);
                  setPasswordDisable2FA("");
                  setErrorMessage(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={!passwordDisable2FA || isDisabling2FA}
                className="flex-1"
              >
                {isDisabling2FA ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Désactivation...
                  </>
                ) : (
                  "Désactiver"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Informations de sécurité */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Informations de sécurité
          </h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dernière connexion</span>
            <span className="text-foreground">Il y a 2 heures</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adresse IP</span>
            <span className="text-foreground">192.168.1.1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Appareil</span>
            <span className="text-foreground">Windows - Chrome</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
