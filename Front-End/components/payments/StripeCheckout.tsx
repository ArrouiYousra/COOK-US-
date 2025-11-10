"use client";

import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StripeCheckoutProps {
  clientSecret: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

/**
 * Composant de checkout Stripe avec Payment Element
 * Affiche le formulaire de paiement sécurisé
 */
export function StripeCheckout({
  clientSecret,
  amount,
  currency = "eur",
  onSuccess,
  onError,
  onCancel,
}: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    // Vérifier que le Payment Element est prêt
    const paymentElement = elements.getElement("payment");
    if (paymentElement) {
      paymentElement.on("ready", () => {
        setIsReady(true);
      });
    }
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirmer le paiement
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/client/bookings?payment=success`,
        },
        redirect: "if_required", // Ne rediriger que si nécessaire (3D Secure)
      });

      if (submitError) {
        setError(submitError.message || "Une erreur est survenue lors du paiement");
        onError?.(submitError.message || "Une erreur est survenue");
        setIsProcessing(false);
        return;
      }

      // Paiement réussi
      if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess?.(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        // 3D Secure - la redirection est gérée automatiquement
        // Le webhook Stripe mettra à jour le statut
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Une erreur inattendue est survenue";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground">
              Paiement sécurisé
            </h2>
          </div>
          <p className="text-muted-foreground">
            Montant à payer :{" "}
            <span className="font-semibold text-foreground">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: currency.toUpperCase(),
              }).format(amount)}
            </span>
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Formulaire de paiement Stripe */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-lg bg-accent border border-border">
            <PaymentElement
              options={{
                layout: "tabs",
              }}
            />
          </div>

          {/* Informations de sécurité */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Vos données bancaires sont cryptées et sécurisées par Stripe. Nous ne stockons jamais vos informations de carte.
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              disabled={isProcessing || !isReady}
              className="flex-1 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Payer maintenant
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

