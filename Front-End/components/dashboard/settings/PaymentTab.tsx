"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentMethod {
  id: string;
  type: "card";
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

/**
 * Onglet "Moyens de paiement"
 * Gestion des cartes enregistrées via Stripe
 */
export function PaymentTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      last4: "4242",
      brand: "Visa",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: "2",
      type: "card",
      last4: "8888",
      brand: "Mastercard",
      expiryMonth: 6,
      expiryYear: 2026,
      isDefault: false,
    },
  ]);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleAddCard = async () => {
    setIsAddingCard(true);
    // TODO: Intégration Stripe - Créer un PaymentMethod
    // const { clientSecret } = await apiClient.createPaymentMethod();
    // await stripe.confirmCardSetup(clientSecret);
    setTimeout(() => {
      setIsAddingCard(false);
      // En production, on ajouterait la nouvelle carte à la liste
    }, 2000);
  };

  const handleDeleteCard = async (cardId: string) => {
    setIsDeleting(cardId);
    // TODO: Appel API pour supprimer la carte
    // await apiClient.deletePaymentMethod(cardId);
    setTimeout(() => {
      setPaymentMethods((prev) => prev.filter((card) => card.id !== cardId));
      setIsDeleting(null);
    }, 1000);
  };

  const handleSetDefault = async (cardId: string) => {
    // TODO: Appel API pour définir la carte par défaut
    // await apiClient.setDefaultPaymentMethod(cardId);
    setPaymentMethods((prev) =>
      prev.map((card) => ({
        ...card,
        isDefault: card.id === cardId,
      }))
    );
  };

  const getCardIcon = (brand: string) => {
    return <CreditCard className="w-6 h-6" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-cera text-xl font-bold text-foreground">
              Cartes enregistrées
            </h3>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une carte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une carte</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle carte de paiement sécurisée via Stripe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="card-number">Numéro de carte</Label>
                  <Input id="card-number" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Date d'expiration</Label>
                    <Input id="expiry" placeholder="MM/AA" />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" />
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Vos informations sont sécurisées et cryptées
                  </p>
                </div>
                <Button
                  onClick={handleAddCard}
                  disabled={isAddingCard}
                  className="w-full"
                >
                  {isAddingCard ? "Ajout en cours..." : "Ajouter la carte"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des cartes */}
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune carte enregistrée
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
                        {card.brand} •••• {card.last4}
                      </p>
                      {card.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expire le {card.expiryMonth.toString().padStart(2, "0")}/
                      {card.expiryYear}
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
                    onClick={() => handleDeleteCard(card.id)}
                    disabled={isDeleting === card.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
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
            <h3 className="font-semibold text-foreground mb-2">
              Sécurité des paiements
            </h3>
            <p className="text-sm text-muted-foreground">
              Toutes vos cartes sont sécurisées via Stripe. Nous ne stockons
              jamais vos informations bancaires complètes sur nos serveurs. Les
              paiements sont traités de manière sécurisée et conforme aux
              normes PCI DSS.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

