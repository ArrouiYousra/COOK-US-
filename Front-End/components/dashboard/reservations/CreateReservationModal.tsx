"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Euro, Clock, MessageSquare, ShoppingCart, UtensilsCrossed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/client";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingData?: {
    number_of_guests?: number;
    start_time?: string;
    end_time?: string;
    need_groceries?: boolean;
    need_table_setting?: boolean;
    need_dishes?: boolean;
  };
  onSuccess?: () => void;
}

/**
 * Modal pour créer une proposition (réservation) sur une demande publique
 * Utilisé par les cuisiniers dans la page marketplace
 */
export function CreateReservationModal({
  isOpen,
  onClose,
  bookingId,
  bookingData,
  onSuccess,
}: CreateReservationModalProps) {
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedHours, setProposedHours] = useState("");
  const [proposedHourlyRate, setProposedHourlyRate] = useState("");
  const [message, setMessage] = useState("");
  const [canDoGroceries, setCanDoGroceries] = useState(bookingData?.need_groceries || false);
  const [canSetTable, setCanSetTable] = useState(bookingData?.need_table_setting || false);
  const [canDoDishes, setCanDoDishes] = useState(bookingData?.need_dishes || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculer les heures si start_time et end_time sont disponibles
  const calculateHours = () => {
    if (bookingData?.start_time && bookingData?.end_time) {
      const start = new Date(`2000-01-01T${bookingData.start_time}`);
      const end = new Date(`2000-01-01T${bookingData.end_time}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.round(diffHours * 100) / 100;
    }
    return null;
  };

  const calculatedHours = calculateHours();

  // Calculer le prix total si heures et tarif horaire sont renseignés
  const calculateTotalPrice = () => {
    if (proposedHours && proposedHourlyRate) {
      const hours = parseFloat(proposedHours);
      const hourlyRate = parseFloat(proposedHourlyRate);
      if (!isNaN(hours) && !isNaN(hourlyRate)) {
        return hours * hourlyRate;
      }
    }
    return null;
  };

  const calculatedTotal = calculateTotalPrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!proposedPrice || parseFloat(proposedPrice) <= 0) {
      setError("Le prix proposé doit être supérieur à 0");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.createReservation({
        booking_id: bookingId,
        proposed_price: parseFloat(proposedPrice),
        proposed_hours: proposedHours ? parseFloat(proposedHours) : undefined,
        proposed_hourly_rate: proposedHourlyRate ? parseFloat(proposedHourlyRate) : undefined,
        message: message.trim() || undefined,
        can_do_groceries: canDoGroceries,
        can_set_table: canSetTable,
        can_do_dishes: canDoDishes,
      });

      // Réinitialiser le formulaire
      setProposedPrice("");
      setProposedHours("");
      setProposedHourlyRate("");
      setMessage("");
      setCanDoGroceries(false);
      setCanSetTable(false);
      setCanDoDishes(false);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Erreur lors de la création de la proposition:", err);
      setError(err.response?.data?.message || "Erreur lors de la création de la proposition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Faire une proposition</DialogTitle>
          <DialogDescription>
            Proposez vos services pour cette demande. Votre proposition sera visible par le client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Prix proposé */}
          <div className="space-y-2">
            <Label htmlFor="proposedPrice" className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Prix total proposé (€) *
            </Label>
            <Input
              id="proposedPrice"
              type="number"
              step="0.01"
              min="0"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              placeholder="Ex: 150"
              required
              className="text-lg"
            />
            {calculatedTotal && (
              <p className="text-sm text-muted-foreground">
                Calculé: {calculatedTotal.toFixed(2)}€ ({proposedHours}h × {proposedHourlyRate}€/h)
              </p>
            )}
          </div>

          {/* Heures et tarif horaire (optionnel) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposedHours" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Nombre d'heures
              </Label>
              <Input
                id="proposedHours"
                type="number"
                step="0.5"
                min="0"
                value={proposedHours}
                onChange={(e) => setProposedHours(e.target.value)}
                placeholder={calculatedHours ? calculatedHours.toString() : "Ex: 3"}
              />
              {calculatedHours && !proposedHours && (
                <p className="text-xs text-muted-foreground">
                  Durée estimée: {calculatedHours}h
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposedHourlyRate" className="flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Tarif horaire (€)
              </Label>
              <Input
                id="proposedHourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={proposedHourlyRate}
                onChange={(e) => setProposedHourlyRate(e.target.value)}
                placeholder="Ex: 50"
              />
            </div>
          </div>

          {/* Message personnalisé */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Message personnalisé (optionnel)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez-vous, expliquez votre approche, vos spécialités..."
              rows={4}
            />
          </div>

          {/* Services additionnels */}
          <div className="space-y-3">
            <Label>Services additionnels inclus</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDoGroceries"
                  checked={canDoGroceries}
                  onCheckedChange={(checked) => setCanDoGroceries(!!checked)}
                />
                <Label htmlFor="canDoGroceries" className="flex items-center gap-2 cursor-pointer">
                  <ShoppingCart className="w-4 h-4" />
                  Je peux faire les courses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canSetTable"
                  checked={canSetTable}
                  onCheckedChange={(checked) => setCanSetTable(!!checked)}
                />
                <Label htmlFor="canSetTable" className="flex items-center gap-2 cursor-pointer">
                  <UtensilsCrossed className="w-4 h-4" />
                  Je peux mettre la table
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDoDishes"
                  checked={canDoDishes}
                  onCheckedChange={(checked) => setCanDoDishes(!!checked)}
                />
                <Label htmlFor="canDoDishes" className="flex items-center gap-2 cursor-pointer">
                  <UtensilsCrossed className="w-4 h-4" />
                  Je peux faire la vaisselle
                </Label>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer la proposition"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



