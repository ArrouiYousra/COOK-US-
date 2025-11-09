"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Calendar, Users, Euro, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createRequestSchema, type CreateRequestFormData } from "@/lib/validations/requests";

interface CreateRequestFormProps {
  onSuccess?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    date?: string;
    timeSlot?: string;
    guestCount?: number;
    budget?: number;
    address?: string;
  };
}

/**
 * Formulaire de création de demande
 * Tous les champs requis pour publier une demande
 */
export function CreateRequestForm({ onSuccess, initialData }: CreateRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    mode: "onChange",
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      date: initialData?.date || "",
      timeSlot: initialData?.timeSlot || "",
      guestCount: initialData?.guestCount || 1,
      budget: initialData?.budget || 0,
      address: initialData?.address || "",
      setTable: false,
      includeDishes: false,
    },
  });

  const onSubmit = async (data: CreateRequestFormData) => {
    try {
      setIsSubmitting(true);
      // TODO: Appel API pour créer la demande
      // await apiClient.createRequest(data);
      
      // Simulation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/client/requests");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la demande:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setTable = watch("setTable") ?? false;
  const includeDishes = watch("includeDishes") ?? false;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Titre du repas */}
      <div>
        <Label htmlFor="title" className="text-foreground">
          Titre du repas *
        </Label>
        <Input
          id="title"
          placeholder="Ex: Dîner romantique pour 2"
          {...register("title")}
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-foreground">
          Description (ingrédients, envies, régime) *
        </Label>
        <Textarea
          id="description"
          placeholder="Décrivez ce que vous souhaitez manger, ce que vous avez dans votre frigo, vos préférences alimentaires..."
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
          <Label htmlFor="guestCount" className="text-foreground">
            Nombre de personnes *
          </Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="guestCount"
              type="number"
              min="1"
              placeholder="2"
              {...register("guestCount", { valueAsNumber: true })}
              className={errors.guestCount ? "border-destructive pl-10" : "pl-10"}
            />
          </div>
          {errors.guestCount && (
            <p className="mt-1 text-sm text-destructive">
              {errors.guestCount.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="budget" className="text-foreground">
            Budget estimé (€) *
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

      {/* Options */}
      <div className="space-y-3">
        <Label className="text-foreground">Options supplémentaires</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="setTable"
            checked={setTable}
            onCheckedChange={(checked) => setValue("setTable", !!checked)}
          />
          <Label
            htmlFor="setTable"
            className="text-sm font-normal cursor-pointer text-foreground"
          >
            Mettre la table
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeDishes"
            checked={includeDishes}
            onCheckedChange={(checked) => setValue("includeDishes", !!checked)}
          />
          <Label
            htmlFor="includeDishes"
            className="text-sm font-normal cursor-pointer text-foreground"
          >
            Vaisselle incluse
          </Label>
        </div>
      </div>

      {/* Bouton de soumission */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          size="lg"
          className="flex-1 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publication en cours...
            </>
          ) : (
            "Publier ma demande"
          )}
        </Button>
      </div>
    </form>
  );
}

