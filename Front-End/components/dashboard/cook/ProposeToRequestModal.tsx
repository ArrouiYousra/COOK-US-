"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Euro, MessageSquare, Loader2 } from "lucide-react";
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

interface ProposeToRequestModalProps {
  requestId: string;
  request: {
    id: string;
    title: string;
    budget: number;
    numberOfGuests: number;
    date: string;
    timeSlot: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal pour faire une proposition à une demande client
 */
export function ProposeToRequestModal({
  requestId,
  request,
  isOpen,
  onClose,
}: ProposeToRequestModalProps) {
  const [proposedPrice, setProposedPrice] = useState(request.budget);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Appel API pour créer la proposition
      // await apiClient.createProposal({
      //   requestId,
      //   proposedPrice,
      //   message,
      // });
      
      console.log("Proposition créée:", { requestId, proposedPrice, message });
      
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        // TODO: Afficher un message de succès
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la création de la proposition:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Faire une proposition</DialogTitle>
          <DialogDescription>
            Proposez vos services pour : {request.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de la demande */}
          <div className="p-4 rounded-lg bg-accent border border-border">
            <h4 className="font-semibold text-foreground mb-2">
              Détails de la demande
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>Budget client : {request.budget} €</div>
              <div>Invitations : {request.numberOfGuests} personne{request.numberOfGuests > 1 ? "s" : ""}</div>
              <div>Date : {request.date}</div>
              <div>Créneau : {request.timeSlot}</div>
            </div>
          </div>

          {/* Prix proposé */}
          <div>
            <Label htmlFor="proposedPrice">
              Votre prix proposé (€) *
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="proposedPrice"
                type="number"
                min="0"
                step="0.01"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(parseFloat(e.target.value) || 0)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Budget client : {request.budget} €
            </p>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">
              Message au client *
            </Label>
            <Textarea
              id="message"
              placeholder="Présentez-vous, expliquez votre approche, vos spécialités pour ce repas..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} / 500 caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Envoyer la proposition
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

