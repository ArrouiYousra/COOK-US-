"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  Receipt,
  History,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { confirmBookingAfterPayment } from "@/lib/api/bookings";

interface PaymentSectionProps {
  booking: {
    id: string;
    status: string;
    totalPrice: number;
    paymentStatus?: string;
    paidAt?: string;
    partialPaymentAmount?: number;
    remainingAmount?: number;
  };
}

// Mock data - À remplacer par les vraies données
const mockTransactions = [
  {
    id: "1",
    type: "BOOKING_PAYMENT",
    amount: 42,
    status: "COMPLETED",
    description: "Acompte (30%)",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    type: "BOOKING_PAYMENT",
    amount: 98,
    status: "PENDING",
    description: "Solde restant",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

/**
 * Section de paiement avec intégration Stripe
 * Gestion des paiements, acomptes et remboursements
 */
export function PaymentSection({ booking }: PaymentSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    type: "percentage" | "fixed";
  } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Calculer les montants
  const baseAmount = booking.totalPrice;
  const partialPaid = booking.partialPaymentAmount || 0;
  
  // Calculer la réduction du code promo
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percentage") {
      discountAmount = (baseAmount * appliedPromo.discount) / 100;
    } else {
      discountAmount = appliedPromo.discount;
    }
  }
  
  const totalAmount = Math.max(0, baseAmount - discountAmount);
  const remaining = booking.remainingAmount || (totalAmount - partialPaid);
  const isFullyPaid = remaining <= 0;
  const hasPartialPayment = partialPaid > 0 && !isFullyPaid;

  // Déterminer le statut du paiement
  const getPaymentStatus = () => {
    if (booking.status === "cancelled") {
      return {
        label: "Remboursé",
        color: "text-green-600 dark:text-green-400",
        icon: CheckCircle,
      };
    }
    if (isFullyPaid || booking.paymentStatus === "paid" || booking.paidAt) {
      return {
        label: "Payé",
        color: "text-green-600 dark:text-green-400",
        icon: CheckCircle,
      };
    }
    if (hasPartialPayment) {
      return {
        label: "Acompte payé",
        color: "text-blue-600 dark:text-blue-400",
        icon: AlertCircle,
      };
    }
    // Gérer les nouveaux statuts pour les deux flux
    if (
      booking.status === "payment_pending" ||
      booking.status === "proposition_accepted" ||
      booking.status === "pending" ||
      booking.status === "confirmed"
    ) {
      return {
        label: "En attente de paiement",
        color: "text-yellow-600 dark:text-yellow-400",
        icon: AlertCircle,
      };
    }
    return {
      label: "Non payé",
      color: "text-red-600 dark:text-red-400",
      icon: AlertCircle,
    };
  };

  const paymentStatus = getPaymentStatus();
  const StatusIcon = paymentStatus.icon;

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      // TODO: Intégration Stripe
      // const response = await stripeClient.createPaymentIntent({
      //   amount: remaining,
      //   bookingId: booking.id,
      // });
      // window.location.href = response.checkoutUrl;
      
      // Simulation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Après paiement réussi, mettre à jour le statut du booking
      // TODO: Appel API pour mettre à jour le statut
      // await apiClient.confirmBookingAfterPayment(booking.id, paymentIntentId);
      // Le backend mettra automatiquement le statut à "confirmed"
      
      console.log("Paiement simulé:", remaining);
      console.log("Booking mis à jour: payment_pending → confirmed");
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePartialPayment = async () => {
    setIsProcessing(true);
    // TODO: Intégration Stripe - Paiement d'acompte (30%)
    const depositAmount = Math.round(totalAmount * 0.3);
    // await stripe.redirectToCheckout({ 
    //   amount: depositAmount * 100,
    //   bookingId: booking.id,
    //   isPartial: true
    // });
    setTimeout(() => setIsProcessing(false), 2000);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsValidatingPromo(true);
    
    // TODO: Appel API pour valider le code promo
    // const response = await apiClient.validatePromoCode(promoCode, booking.id);
    
    // Simulation
    setTimeout(() => {
      const mockPromoCodes: Record<string, { discount: number; type: "percentage" | "fixed" }> = {
        "WELCOME10": { discount: 10, type: "percentage" },
        "FIRST20": { discount: 20, type: "percentage" },
        "SAVE50": { discount: 50, type: "fixed" },
      };
      
      const promo = mockPromoCodes[promoCode.toUpperCase()];
      if (promo) {
        setAppliedPromo({ code: promoCode.toUpperCase(), ...promo });
        setPromoCode("");
      } else {
        alert("Code promo invalide ou expiré");
      }
      setIsValidatingPromo(false);
    }, 1000);
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border rounded-xl p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-muted-foreground" />
        <h3 className="font-cera text-xl font-bold text-foreground">
          Paiement
        </h3>
      </div>

      {/* Statut du paiement */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-accent">
        <StatusIcon className={`w-5 h-5 ${paymentStatus.color}`} />
        <div>
          <p className={`font-semibold ${paymentStatus.color}`}>
            {paymentStatus.label}
          </p>
          {booking.paidAt && (
            <p className="text-xs text-muted-foreground">
              Payé le {new Date(booking.paidAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>

      {/* Code promo */}
      {!isFullyPaid && (
        <div className="mb-6 p-4 rounded-lg bg-accent border border-border">
          {appliedPromo ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-foreground">
                  Code {appliedPromo.code} appliqué :{" "}
                  {appliedPromo.type === "percentage"
                    ? `-${appliedPromo.discount}%`
                    : `-${appliedPromo.discount}€`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePromoCode}
                className="h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Code promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleApplyPromoCode()}
                className="flex-1"
              />
              <Button
                onClick={handleApplyPromoCode}
                disabled={!promoCode.trim() || isValidatingPromo}
                variant="outline"
                size="sm"
              >
                {isValidatingPromo ? "..." : "Appliquer"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Détails du montant */}
      <div className="mb-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Montant de base</span>
            <span className="font-semibold text-foreground">
              {formatPrice(baseAmount)}
            </span>
          </div>
          {appliedPromo && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Réduction ({appliedPromo.code})
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                - {formatPrice(discountAmount)}
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-border flex justify-between">
            <span className="text-muted-foreground font-medium">Montant total</span>
            <span className="font-semibold text-foreground text-lg">
              {formatPrice(totalAmount)}
            </span>
          </div>
          {hasPartialPayment && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Acompte payé</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  - {formatPrice(partialPaid)}
                </span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Solde restant</span>
                <span className="text-xl font-bold text-foreground">
                  {formatPrice(remaining)}
                </span>
              </div>
            </>
          )}
          {isFullyPaid && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Montant intégralement payé</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Paiement sécurisé via Stripe. Vos données bancaires sont cryptées et ne sont jamais stockées sur nos serveurs.
          </p>
        </div>
      </div>

      {/* Options de paiement */}
      {booking.status !== "cancelled" && !isFullyPaid && (
        <div className="space-y-3">
          {hasPartialPayment ? (
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
              size="lg"
            >
              <Lock className="w-5 h-5 mr-2" />
              {isProcessing ? "Traitement..." : `Payer le solde (${formatPrice(remaining)})`}
            </Button>
          ) : (
            <>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                size="lg"
              >
                <Lock className="w-5 h-5 mr-2" />
                {isProcessing ? "Traitement..." : "Payer maintenant"}
              </Button>
              <Button
                onClick={handlePartialPayment}
                disabled={isProcessing}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Payer un acompte (30% - {formatPrice(Math.round(totalAmount * 0.3))})
              </Button>
            </>
          )}
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
              <Info className="w-3 h-3 inline mr-1" />
              Remboursement automatique si annulation avant 48h
            </p>
          </div>
        </div>
      )}

      {/* Historique des transactions */}
      {mockTransactions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between mb-4 hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                Historique des transactions ({mockTransactions.length})
              </span>
            </div>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {showHistory && (
            <div className="space-y-3">
              {mockTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        transaction.status === "COMPLETED"
                          ? "text-green-600 dark:text-green-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {formatPrice(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.status === "COMPLETED" ? "Payé" : "En attente"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Informations de remboursement */}
      {booking.status === "cancelled" && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-600 dark:text-green-400">
            ✓ Remboursement automatique effectué. Le montant sera crédité sur votre compte sous 5-7 jours ouvrés.
          </p>
        </div>
      )}
    </motion.div>
  );
}

