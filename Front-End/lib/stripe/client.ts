import { loadStripe, Stripe } from '@stripe/stripe-js';

// Clé publique Stripe (sécurisée côté client)
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn(
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined. Stripe payments will not work.'
  );
}

// Instance Stripe (singleton)
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Initialise et retourne l'instance Stripe
 * Utilise un singleton pour éviter de multiples initialisations
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePublishableKey) {
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }

  return stripePromise;
};

/**
 * Vérifie si Stripe est configuré
 */
export const isStripeConfigured = (): boolean => {
  return !!stripePublishableKey;
};

