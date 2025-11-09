"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { apiClient } from "@/lib/api/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth";

/**
 * Page de mot de passe oublié
 * Envoie un email de réinitialisation
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await apiClient.forgotPassword(data);
      setIsSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Header avec navigation */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-end z-10">
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Email envoyé
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Si cet email existe dans notre système, un lien de réinitialisation vous a été envoyé.
            Vérifiez votre boîte de réception et vos spams.
          </p>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push("/auth/login")}
            >
              Retour à la connexion
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                setIsSuccess(false);
                setError(null);
              }}
            >
              Renvoyer l'email
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Header avec navigation */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/auth/login")}
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
              Mot de passe oublié ?
            </h1>
            <p className="text-muted-foreground">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

          {/* Erreur générale */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Bouton de soumission */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer le lien de réinitialisation"
            )}
          </Button>
        </form>

          {/* Lien vers login */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{" "}
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

