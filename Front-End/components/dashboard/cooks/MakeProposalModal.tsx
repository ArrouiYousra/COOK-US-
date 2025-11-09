"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users, Euro, MapPin, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useRouter } from "next/navigation";

const makeProposalSchema = z.object({
  date: z.string().min(1, "La date est requise"),
  timeSlot: z.string().min(1, "Le créneau horaire est requis"),
  numberOfGuests: z.number().min(1, "Au moins 1 personne"),
  budget: z.number().min(1, "Le budget est requis"),
  address: z.string().min(5, "L'adresse complète est requise"),
  description: z.string().min(10, "La description doit faire au moins 10 caractères"),
  specialRequests: z.string().optional(),
});

type MakeProposalFormData = z.infer<typeof makeProposalSchema>;

interface MakeProposalModalProps {
  cookId: string;
  cookName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal pour faire une proposition directe à un cuisinier
 * Flux 2 : Client → Cuisinier (proposition directe)
 */
export function MakeProposalModal({
  cookId,
  cookName,
  isOpen,
  onClose,
  onSuccess,
}: MakeProposalModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MakeProposalFormData>({
    resolver: zodResolver(makeProposalSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: MakeProposalFormData) => {
    try {
      setIsSubmitting(true);
      
      // TODO: Appel API pour créer la proposition
      // await apiClient.createProposal({
      //   cookId,
      //   ...data,
      // });
      
      // Simulation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log("Proposition envoyée:", { cookId, ...data });
      
      reset();
      onClose();
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger vers la page des propositions
        router.push("/dashboard/client/proposals");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la proposition:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="font-cera text-2xl font-bold text-foreground">
                Faire une proposition à {cookName}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Proposez directement vos conditions au cuisinier
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Date & Créneau */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-foreground">
                  Date souhaitée *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    {...register("date")}
                    className={errors.date ? "border-destructive pl-10" : "pl-10"}
                  />
                </div>
                {errors.date && (
                  <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="timeSlot" className="text-foreground">
                  Créneau horaire *
                </Label>
                <select
                  id="timeSlot"
                  {...register("timeSlot")}
                  className={`
                    w-full px-3 py-2 rounded-lg border bg-background text-foreground
                    ${errors.timeSlot ? "border-destructive" : "border-border"}
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                  `}
                >
                  <option value="">Sélectionnez un créneau</option>
                  <option value="Midi (12h-14h)">Midi (12h-14h)</option>
                  <option value="Dîner (19h-21h)">Dîner (19h-21h)</option>
                  <option value="Autre">Autre</option>
                </select>
                {errors.timeSlot && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.timeSlot.message}
                  </p>
                )}
              </div>
            </div>

            {/* Nombre de personnes & Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfGuests" className="text-foreground">
                  Nombre de personnes *
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="numberOfGuests"
                    type="number"
                    min="1"
                    placeholder="2"
                    {...register("numberOfGuests", { valueAsNumber: true })}
                    className={errors.numberOfGuests ? "border-destructive pl-10" : "pl-10"}
                  />
                </div>
                {errors.numberOfGuests && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.numberOfGuests.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="budget" className="text-foreground">
                  Budget proposé (€) *
                </Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="150"
                    {...register("budget", { valueAsNumber: true })}
                    className={errors.budget ? "border-destructive pl-10" : "pl-10"}
                  />
                </div>
                {errors.budget && (
                  <p className="mt-1 text-sm text-destructive">{errors.budget.message}</p>
                )}
              </div>
            </div>

            {/* Adresse */}
            <div>
              <Label htmlFor="address" className="text-foreground">
                Adresse complète *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  {...register("address")}
                  className={errors.address ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-foreground">
                Description de votre demande *
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez ce que vous souhaitez, vos préférences alimentaires, ce que vous avez dans votre frigo..."
                rows={5}
                {...register("description")}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Demandes spéciales */}
            <div>
              <Label htmlFor="specialRequests" className="text-foreground">
                Demandes spéciales (optionnel)
              </Label>
              <Textarea
                id="specialRequests"
                placeholder="Mettre la table, vaisselle incluse, etc."
                rows={3}
                {...register("specialRequests")}
              />
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Note :</strong> Le cuisinier recevra votre proposition et pourra l'accepter ou la refuser. 
                Une fois acceptée, vous pourrez discuter ensemble et finaliser les détails avant le paiement.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-border">
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
                size="lg"
                className="flex-1 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                disabled={isSubmitting}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

