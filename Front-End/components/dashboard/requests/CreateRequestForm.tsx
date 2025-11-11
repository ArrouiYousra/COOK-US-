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
import { apiClient } from "@/lib/api/client";
import { useBookingStore } from "@/stores/bookingStore";
import { MapboxAutocomplete } from "@/components/mapbox/MapboxAutocomplete";
import { MapboxMap } from "@/components/mapbox/MapboxMap";

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
  const { fetchBookings } = useBookingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>(initialData?.address || "");
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | undefined>();

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
      
      // Parser le créneau horaire pour extraire start_time et end_time
      let start_time: string | undefined;
      let end_time: string | undefined;
      let meal_type: string | undefined;
      
      if (data.timeSlot) {
        if (data.timeSlot.includes("Midi")) {
          start_time = "12:00:00";
          end_time = "14:00:00";
          meal_type = "LUNCH";
        } else if (data.timeSlot.includes("Dîner")) {
          start_time = "19:00:00";
          end_time = "21:00:00";
          meal_type = "DINNER";
        }
      }
      
      // Créer la demande publique via l'API
      const response = await apiClient.createPublicRequest({
        booking_date: data.date,
        meal_type,
        start_time,
        end_time,
        number_of_guests: data.guestCount,
        need_groceries: false, // TODO: Ajouter ce champ au formulaire si nécessaire
        need_table_setting: data.setTable || false,
        need_dishes: data.includeDishes || false,
        special_requests: `${data.title}\n\n${data.description}`,
        // TODO: Gérer address_id si vous avez une table addresses
        // address_id: addressId,
      });
      
      console.log("✅ Demande créée avec succès:", response);
      console.log("📋 Détails de la demande créée:", {
        id: response.booking?.id,
        status: response.booking?.status,
        cook_profile_id: response.booking?.cook_profile_id,
        client_profile_id: response.booking?.client_profile_id,
        booking_date: response.booking?.booking_date,
      });
      
      // Recharger les bookings pour afficher la nouvelle demande
      // Attendre un peu pour que la base de données soit à jour
      console.log("⏳ Attente de 1.5s pour que la base de données soit à jour...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Recharger les bookings - forcer le rechargement sans cache
      // IMPORTANT: Réinitialiser le filtre de statut pour obtenir TOUS les bookings
      console.log("🔄 Rechargement des bookings...");
      await fetchBookings({ limit: 1000, status: undefined });
      
      // Attendre un peu et recharger à nouveau
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("🔄 Second rechargement des bookings...");
      await fetchBookings({ limit: 1000, status: undefined });
      
      // Vérifier que la demande est bien dans le store après rechargement
      // Utiliser le store directement pour vérifier
      const storeState = useBookingStore.getState();
      const newBooking = storeState.bookings.find(b => b.id === response.booking?.id);
      console.log("🔍 Vérification dans le store après rechargement:", {
        totalBookings: storeState.bookings.length,
        newBookingFound: !!newBooking,
        newBookingDetails: newBooking ? {
          id: newBooking.id,
          status: newBooking.status,
          cook_profile_id: newBooking.cook_profile_id ?? (newBooking as any).cook_profile_id,
          booking_date: newBooking.booking_date || (newBooking as any).date,
        } : null,
        allBookingsIds: storeState.bookings.map(b => b.id?.slice(0, 8))
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger avec un paramètre pour forcer le rechargement
        router.push("/dashboard/client/requests?refresh=true");
        // Forcer un refresh de la page Next.js
        router.refresh();
      }
    } catch (error: any) {
      console.error("Erreur lors de la création de la demande:", error);
      alert(error.response?.data?.message || "Erreur lors de la création de la demande. Veuillez réessayer.");
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
              min={new Date().toISOString().split('T')[0]}
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

      {/* Adresse avec autocomplete Mapbox */}
      <div>
        <Label htmlFor="address" className="text-foreground">
          Adresse complète *
        </Label>
        <MapboxAutocomplete
          value={selectedAddress}
          onChange={(address, coordinates) => {
            setSelectedAddress(address);
            setAddressCoordinates(coordinates);
            setValue("address", address, { shouldValidate: true });
          }}
          placeholder="Rechercher une adresse..."
          country="FR"
          onSelect={(suggestion) => {
            setAddressCoordinates({
              lat: suggestion.latitude,
              lng: suggestion.longitude,
            });
          }}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-destructive">{errors.address.message}</p>
        )}
        
        {/* Aperçu de la carte si une adresse est sélectionnée */}
        {addressCoordinates && (
          <div className="mt-4 rounded-lg overflow-hidden border border-border">
            <MapboxMap
              center={[addressCoordinates.lat, addressCoordinates.lng]}
              zoom={15}
              markers={[
                {
                  id: "selected-address",
                  lat: addressCoordinates.lat,
                  lng: addressCoordinates.lng,
                  title: selectedAddress,
                  color: "#3b82f6",
                },
              ]}
              height="250px"
              interactive={true}
            />
          </div>
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

