"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateRequestForm } from "./CreateRequestForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRequestSchema } from "@/lib/validations/requests";
import type { z } from "zod";

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    title: string;
    description: string;
    date: string;
    timeSlot: string;
    guestCount: number;
    budget: number;
    address: string;
    setTable?: boolean;
    includeDishes?: boolean;
    proposalCount?: number;
  };
}

type FormData = z.infer<typeof createRequestSchema>;

/**
 * Modal de modification de demande
 * Règle métier : on ne peut modifier que si pas de propositions
 */
export function EditRequestModal({
  isOpen,
  onClose,
  request,
}: EditRequestModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      title: request.title,
      description: request.description,
      date: request.date,
      timeSlot: request.timeSlot,
      guestCount: request.guestCount,
      budget: request.budget,
      address: request.address,
      setTable: request.setTable || false,
      includeDishes: request.includeDishes || false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        title: request.title,
        description: request.description,
        date: request.date,
        timeSlot: request.timeSlot,
        guestCount: request.guestCount,
        budget: request.budget,
        address: request.address,
        setTable: request.setTable || false,
        includeDishes: request.includeDishes || false,
      });
    }
  }, [isOpen, request, reset]);

  // Vérifier si on peut modifier (pas de propositions)
  const canEdit = !request.proposalCount || request.proposalCount === 0;

  const onSubmit = async (data: FormData) => {
    // TODO: Appel API pour modifier la demande
    // await updateRequest(request.id, data);
    
    console.log("Modification de la demande:", data);
    onClose();
  };

  if (!canEdit) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
                <h2 className="font-cera text-2xl font-bold text-foreground mb-4">
                  Modification impossible
                </h2>
                <p className="text-muted-foreground mb-6">
                  Cette demande ne peut pas être modifiée car elle a déjà reçu{" "}
                  {request.proposalCount} proposition{request.proposalCount > 1 ? "s" : ""}.
                  Vous pouvez la supprimer et en créer une nouvelle.
                </p>
                <Button onClick={onClose} className="w-full">
                  Compris
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full my-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-cera text-2xl font-bold text-foreground">
                  Modifier la demande
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Titre */}
                <div>
                  <Label htmlFor="title">Titre du repas *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Ex: Dîner romantique pour 2"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Décrivez vos envies, ingrédients, régimes..."
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Date et créneau */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      {...register("date")}
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="timeSlot">Créneau horaire *</Label>
                    <select
                      id="timeSlot"
                      {...register("timeSlot")}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="Petit-déjeuner (8h-10h)">Petit-déjeuner (8h-10h)</option>
                      <option value="Déjeuner (12h-14h)">Déjeuner (12h-14h)</option>
                      <option value="Goûter (16h-17h)">Goûter (16h-17h)</option>
                      <option value="Dîner (19h-21h)">Dîner (19h-21h)</option>
                    </select>
                    {errors.timeSlot && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.timeSlot.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nombre de personnes et budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guestCount">Nombre de personnes *</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      min="1"
                      {...register("guestCount", { valueAsNumber: true })}
                    />
                    {errors.guestCount && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.guestCount.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget estimé (€) *</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      step="10"
                      {...register("budget", { valueAsNumber: true })}
                    />
                    {errors.budget && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.budget.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    placeholder="123 Rue de la Paix, 75001 Paris"
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="setTable"
                      checked={false}
                      onCheckedChange={(checked) =>
                        setValue("setTable", checked === true)
                      }
                    />
                    <Label htmlFor="setTable" className="cursor-pointer">
                      Mettre la table
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDishes"
                      checked={false}
                      onCheckedChange={(checked) =>
                        setValue("includeDishes", checked === true)
                      }
                    />
                    <Label htmlFor="includeDishes" className="cursor-pointer">
                      Vaisselle incluse
                    </Label>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? "Modification..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

