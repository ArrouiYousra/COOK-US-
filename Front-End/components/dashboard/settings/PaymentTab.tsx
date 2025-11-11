"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Plus, Trash2, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { apiClient } from "@/lib/api/client";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";

interface PaymentMethod {
  id: string;
  type: "card";
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  stripe_payment_method_id: string;
}

// Initialize Stripe
const getStripePromise = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
    return null;
  }
  return loadStripe(publishableKey);
};

const stripePromise = getStripePromise();

/**
 * Component for adding a new card using Stripe Elements
 */
function AddCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/client/settings`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Une erreur est survenue");
        setIsSubmitting(false);
        return;
      }

      if (setupIntent && setupIntent.status === "succeeded") {
        // Confirm and save the payment method
        await apiClient.confirmPaymentMethod({
          setupIntentId: setupIntent.id,
          paymentMethodId: setupIntent.payment_method as string,
          isDefault: false, // New cards are not default by default
        });

        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Message informatif sur la sécurité */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              Paiement sécurisé
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
              Ce formulaire utilise Stripe Elements pour un traitement sécurisé. Vos informations de carte sont chiffrées et ne transitent jamais par nos serveurs.
            </p>
          </div>
        </div>
      </div>

      <PaymentElement />
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" disabled={!stripe || isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Ajout...
            </>
          ) : (
            "Ajouter la carte"
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * Onglet "Moyens de paiement"
 * Gestion des cartes enregistrées via Stripe
 */
export function PaymentTab() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const { theme } = useThemeStore();
  const { showSuccessToast, showErrorToast } = useNotificationToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [setupIntentData, setSetupIntentData] = useState<{
    clientSecret: string;
    setupIntentId: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !isAuthLoading) {
        try {
          await checkAuth();
        } catch (error: any) {
          console.warn("Authentification échouée dans PaymentTab:", error?.message || error);
          // Ne rediriger que si l'erreur est vraiment une erreur d'authentification
          if (error?.response?.status === 401 || error?.message?.includes("Unauthorized") || error?.message?.includes("Jeton")) {
            router.push("/auth/login");
          }
        }
      }
    };

    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      try {
        const response = await apiClient.getPaymentMethods();
        const methods = response.paymentMethods.map((pm: any) => ({
          id: pm.id,
          type: pm.type || "card",
          last4: pm.last4 || "",
          brand: pm.brand || "card",
          expiryMonth: pm.expiry_month || 0,
          expiryYear: pm.expiry_year || 0,
          isDefault: pm.is_default || false,
          stripe_payment_method_id: pm.stripe_payment_method_id,
        }));
        setPaymentMethods(methods);
      } catch (error: any) {
        console.error("Erreur lors du chargement des cartes:", error);
        
        // Si l'erreur est 401, rediriger vers la connexion
        if (error.response?.status === 401 || error.message?.includes("Jeton d'authentification manquant")) {
          router.push("/auth/login");
          return;
        }
        
        // Continue with empty array on error
        setPaymentMethods([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user && !isAuthLoading) {
      loadPaymentMethods();
    }
  }, [user, isAuthenticated, isAuthLoading, router]);

  const handleAddCard = async () => {
    if (!stripePromise) {
      showErrorToast("Stripe n'est pas configuré. Veuillez contacter le support.");
      return;
    }

    setIsAddingCard(true);
    try {
      const response = await apiClient.createSetupIntent();
      setSetupIntentData({
        clientSecret: response.clientSecret,
        setupIntentId: response.setupIntentId,
      });
      setIsDialogOpen(true);
    } catch (error: any) {
      console.error("Erreur lors de la création du Setup Intent:", error);
      showErrorToast(
        error.response?.data?.message ||
          error.message ||
          "Impossible de créer le Setup Intent",
      );
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleCardAdded = () => {
    setIsDialogOpen(false);
    setSetupIntentData(null);
    setSuccessMessage("Carte ajoutée avec succès !");
    showSuccessToast("Carte ajoutée avec succès !");
    // Reload payment methods
    const loadPaymentMethods = async () => {
      try {
        const response = await apiClient.getPaymentMethods();
        const methods = response.paymentMethods.map((pm: any) => ({
          id: pm.id,
          type: pm.type || "card",
          last4: pm.last4 || "",
          brand: pm.brand || "card",
          expiryMonth: pm.expiry_month || 0,
          expiryYear: pm.expiry_year || 0,
          isDefault: pm.is_default || false,
          stripe_payment_method_id: pm.stripe_payment_method_id,
        }));
        setPaymentMethods(methods);
      } catch (error) {
        console.error("Erreur lors du rechargement des cartes:", error);
      }
    };
    loadPaymentMethods();
  };

  const handleDeleteCard = async (cardId: string) => {
    setIsDeleting(cardId);
    try {
      await apiClient.deletePaymentMethod(cardId);
      setPaymentMethods((prev) => prev.filter((card) => card.id !== cardId));
      setSuccessMessage("Carte supprimée avec succès !");
      showSuccessToast("Carte supprimée avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la carte:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Impossible de supprimer la carte",
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      await apiClient.setDefaultPaymentMethod(cardId);
      setPaymentMethods((prev) =>
        prev.map((card) => ({
          ...card,
          isDefault: card.id === cardId,
        })),
      );
      setSuccessMessage("Carte par défaut mise à jour !");
      showSuccessToast("Carte par défaut mise à jour !");
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la carte par défaut:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Impossible de mettre à jour la carte par défaut",
      );
    }
  };

  const getCardIcon = (brand: string) => {
    return <CreditCard className="w-6 h-6" />;
  };

  const getBrandName = (brand: string) => {
    const brandMap: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "American Express",
      discover: "Discover",
      jcb: "JCB",
      diners: "Diners Club",
    };
    return brandMap[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-cera text-xl font-bold text-foreground">Cartes enregistrées</h3>
          </div>
          <Button onClick={handleAddCard} disabled={isAddingCard || !stripePromise}>
            {isAddingCard ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une carte
              </>
            )}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setIsDialogOpen(false);
              setSetupIntentData(null);
            }
          }}>
            <DialogContent className="max-w-2xl">
              {setupIntentData && stripePromise ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Ajouter une carte</DialogTitle>
                    <DialogDescription>
                      Ajoutez une nouvelle carte de paiement sécurisée via Stripe
                    </DialogDescription>
                  </DialogHeader>
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: setupIntentData.clientSecret,
                      appearance: {
                        theme: theme === "dark" ? ("night" as const) : ("stripe" as const),
                        variables: {
                          colorPrimary: "#6366F1",
                          colorBackground: theme === "dark" ? "hsl(var(--card))" : "#ffffff",
                          colorText: theme === "dark" ? "hsl(var(--foreground))" : "#1E293B",
                          colorDanger: "#EF4444",
                          colorTextSecondary: theme === "dark" ? "hsl(var(--muted-foreground))" : "#64748B",
                          colorTextPlaceholder: theme === "dark" ? "hsl(var(--muted-foreground))" : "#94A3B8",
                          borderRadius: "0.5rem",
                          fontFamily: "Inter, sans-serif",
                        },
                        rules: {
                          ".Input": {
                            backgroundColor: theme === "dark" ? "hsl(var(--background))" : "#ffffff",
                            borderColor: theme === "dark" ? "hsl(var(--border))" : "#E2E8F0",
                            color: theme === "dark" ? "hsl(var(--foreground))" : "#1E293B",
                          },
                          ".Input:focus": {
                            borderColor: "#6366F1",
                          },
                          ".Label": {
                            color: theme === "dark" ? "hsl(var(--foreground))" : "#1E293B",
                          },
                        },
                      },
                    }}
                  >
                    <AddCardForm
                      clientSecret={setupIntentData.clientSecret}
                      onSuccess={handleCardAdded}
                      onCancel={() => {
                        setIsDialogOpen(false);
                        setSetupIntentData(null);
                      }}
                    />
                  </Elements>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des cartes */}
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune carte enregistrée</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ajoutez une carte pour faciliter vos paiements
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent"
              >
                <div className="flex items-center gap-4">
                  {getCardIcon(card.brand)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {getBrandName(card.brand)} •••• {card.last4}
                      </p>
                      {card.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expire le {card.expiryMonth.toString().padStart(2, "0")}/{card.expiryYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!card.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(card.id)}
                    >
                      Définir par défaut
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDeleteId(card.id)}
                    disabled={isDeleting === card.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {isDeleting === card.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations de sécurité */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">Sécurité des paiements</h3>
            <p className="text-sm text-muted-foreground">
              Toutes vos cartes sont sécurisées via Stripe. Nous ne stockons jamais vos
              informations bancaires complètes sur nos serveurs. Les paiements sont traités de
              manière sécurisée et conforme aux normes PCI DSS.
            </p>
          </div>
        </div>
      </div>
      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la carte</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette carte ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) {
                  handleDeleteCard(confirmDeleteId);
                }
                setConfirmDeleteId(null);
              }}
              disabled={!!isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}