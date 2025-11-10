"use client";

import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { StripeCheckout } from "./StripeCheckout";

interface StripeProviderProps {
  clientSecret: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

/**
 * Provider Stripe qui encapsule le composant de checkout
 * Initialise Stripe et fournit le contexte Elements
 */
export function StripeProvider({
  clientSecret,
  amount,
  currency = "eur",
  onSuccess,
  onError,
  onCancel,
}: StripeProviderProps) {
  const stripePromise = getStripe();

  if (!stripePromise) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">
          Stripe n'est pas configuré. Veuillez contacter le support.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#3b82f6",
            colorBackground: "transparent",
            colorText: "hsl(var(--foreground))",
            colorDanger: "hsl(var(--destructive))",
            fontFamily: "system-ui, sans-serif",
            spacingUnit: "4px",
            borderRadius: "8px",
          },
        },
      }}
    >
      <StripeCheckout
        clientSecret={clientSecret}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  );
}

