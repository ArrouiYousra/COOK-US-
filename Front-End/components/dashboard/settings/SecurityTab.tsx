"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Shield, Key, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Onglet "Sécurité"
 * Gestion de la sécurité : changement de mot de passe, authentification 2FA
 */
export function SecurityTab() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch("newPassword");

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    // TODO: Appel API pour changer le mot de passe
    // await apiClient.changePassword({
    //   currentPassword: data.currentPassword,
    //   newPassword: data.newPassword,
    // });
    setTimeout(() => {
      setIsChangingPassword(false);
      reset();
      // Afficher un message de succès
    }, 1000);
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled) {
      setIsSettingUp2FA(true);
      // TODO: Appel API pour activer la 2FA
      // await apiClient.enable2FA();
      setTimeout(() => {
        setTwoFactorEnabled(true);
        setIsSettingUp2FA(false);
      }, 1500);
    } else {
      // TODO: Appel API pour désactiver la 2FA
      // await apiClient.disable2FA();
      setTwoFactorEnabled(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
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
              <p className="text-xs text-destructive mt-1">
                {errors.newPassword.message}
              </p>
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
            {isChangingPassword ? "Changement en cours..." : "Changer le mot de passe"}
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
              <p className="font-semibold text-foreground">
                Authentification par application
              </p>
              <p className="text-sm text-muted-foreground">
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </p>
            </div>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isSettingUp2FA}
          />
        </div>

        {twoFactorEnabled && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ L'authentification à deux facteurs est activée. Vous devrez
              entrer un code de votre application d'authentification lors de la
              connexion.
            </p>
          </div>
        )}

        {isSettingUp2FA && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Configuration de la 2FA en cours...
            </p>
          </div>
        )}
      </div>

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

