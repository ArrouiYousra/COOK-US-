"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Euro, MapPin, Loader2, CheckCircle2, AlertCircle, Info, Navigation, Clock } from "lucide-react";
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
  const [nearbyCooksCount, setNearbyCooksCount] = useState<number | null>(null);
  const [isCheckingCooks, setIsCheckingCooks] = useState(false);
  const [addressDetails, setAddressDetails] = useState<{
    city?: string;
    postalCode?: string;
    country?: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      
      // Afficher un message de succès
      setSuccessMessage("✅ Demande publiée avec succès ! Votre demande est maintenant visible par les cuisiniers.");
      setTimeout(() => setSuccessMessage(null), 5000);

      // Recharger les bookings pour afficher la nouvelle demande
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchBookings({ limit: 1000, status: undefined });
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace("/dashboard/client/requests?refresh=true");
      }
    } catch (error: unknown) {
      console.error("Erreur lors de la création de la demande:", error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
        typeof (error as { response?: { data?: { message?: string } } }).response === 'object' &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
        ? (error as { response: { data: { message: string } } }).response.data.message
        : "Erreur lors de la création de la demande. Veuillez réessayer.";
      setErrorMessage(errorMessage);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setTable = watch("setTable") ?? false;
  const includeDishes = watch("includeDishes") ?? false;
  const watchedDate = watch("date");
  const watchedGuestCount = watch("guestCount");
  const watchedBudget = watch("budget");

  // Vérifier les cuisiniers à proximité quand l'adresse est sélectionnée
  useEffect(() => {
    const checkNearbyCooks = async () => {
      if (!addressCoordinates) {
        setNearbyCooksCount(null);
        return;
      }

      setIsCheckingCooks(true);
      try {
        // TODO: Appel API pour compter les cuisiniers à proximité
        // Pour l'instant, on simule avec un délai
        await new Promise(resolve => setTimeout(resolve, 500));
        // Simuler un nombre de cuisiniers (à remplacer par un vrai appel API)
        setNearbyCooksCount(Math.floor(Math.random() * 15) + 5);
      } catch (error) {
        console.error("Erreur lors de la vérification des cuisiniers:", error);
        setNearbyCooksCount(null);
      } finally {
        setIsCheckingCooks(false);
      }
    };

    checkNearbyCooks();
  }, [addressCoordinates]);

  // Géocoder l'adresse pour obtenir les détails
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!selectedAddress || selectedAddress.length < 10) {
        setAddressDetails(null);
        return;
      }

      try {
        const response = await apiClient.geocodeAddress(selectedAddress, "FR");
        if (response.result) {
          setAddressDetails({
            city: response.result.city,
            postalCode: response.result.postalCode,
            country: response.result.country,
          });
        }
      } catch (error) {
        console.error("Erreur lors du géocodage:", error);
      }
    };

    const debounceTimer = setTimeout(geocodeAddress, 1000);
    return () => clearTimeout(debounceTimer);
  }, [selectedAddress]);

  // Calculer le nombre de jours jusqu'à la date sélectionnée
  const daysUntilDate = watchedDate ? Math.ceil((new Date(watchedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Messages de succès/erreur */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">{successMessage}</p>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm font-medium text-red-900 dark:text-red-100">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicateur de progression */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              💡 Astuce : Plus votre demande est détaillée, plus vous recevrez de propositions pertinentes !
            </p>
          </div>
        </div>
      </div>

      {/* Titre du repas */}
      <div>
        <Label htmlFor="title" className="text-foreground flex items-center gap-2">
          Titre du repas *
          {watch("title") && watch("title").length >= 5 && (
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          )}
        </Label>
        <Input
          id="title"
          placeholder="Ex: Dîner romantique pour 2"
          {...register("title")}
          className={errors.title ? "border-destructive" : watch("title") && watch("title").length >= 5 ? "border-green-500" : ""}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title ? (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.title.message}
            </p>
          ) : watch("title") ? (
            <p className="text-xs text-muted-foreground">
              {watch("title").length}/100 caractères
            </p>
          ) : null}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-foreground flex items-center gap-2">
          Description (ingrédients, envies, régime) *
          {watch("description") && watch("description").length >= 20 && (
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          )}
        </Label>
        <Textarea
          id="description"
          placeholder="Décrivez ce que vous souhaitez manger, ce que vous avez dans votre frigo, vos préférences alimentaires, allergies, régimes spéciaux..."
          rows={5}
          {...register("description")}
          className={errors.description ? "border-destructive" : watch("description") && watch("description").length >= 20 ? "border-green-500" : ""}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description ? (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.description.message}
            </p>
          ) : watch("description") ? (
            <p className="text-xs text-muted-foreground">
              {watch("description").length}/1000 caractères
              {watch("description").length < 20 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  (minimum 20 caractères)
                </span>
              )}
            </p>
          ) : null}
        </div>
      </div>

      {/* Date & Créneau */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date" className="text-foreground flex items-center gap-2">
            Date souhaitée *
            {watchedDate && daysUntilDate !== null && daysUntilDate >= 0 && (
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...register("date")}
              className={errors.date ? "border-destructive pl-10" : watchedDate && daysUntilDate !== null && daysUntilDate >= 0 ? "border-green-500 pl-10" : "pl-10"}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            {errors.date ? (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.date.message}
              </p>
            ) : watchedDate && daysUntilDate !== null ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysUntilDate === 0 ? "Aujourd'hui" : daysUntilDate === 1 ? "Demain" : `Dans ${daysUntilDate} jours`}
              </p>
            ) : null}
          </div>
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
          <Label htmlFor="guestCount" className="text-foreground flex items-center gap-2">
            Nombre de personnes *
            {watchedGuestCount && watchedGuestCount >= 1 && watchedGuestCount <= 20 && (
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
          </Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="guestCount"
              type="number"
              min="1"
              max="20"
              placeholder="2"
              {...register("guestCount", { valueAsNumber: true })}
              className={errors.guestCount ? "border-destructive pl-10" : watchedGuestCount && watchedGuestCount >= 1 && watchedGuestCount <= 20 ? "border-green-500 pl-10" : "pl-10"}
            />
          </div>
          {errors.guestCount && (
            <p className="mt-1 text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.guestCount.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="budget" className="text-foreground flex items-center gap-2">
            Budget estimé (€) *
            {watchedBudget && watchedBudget > 0 && watchedBudget <= 10000 && (
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="budget"
              type="number"
              min="0"
              max="10000"
              step="0.01"
              placeholder="150"
              {...register("budget", { valueAsNumber: true })}
              className={errors.budget ? "border-destructive pl-10" : watchedBudget && watchedBudget > 0 && watchedBudget <= 10000 ? "border-green-500 pl-10" : "pl-10"}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            {errors.budget ? (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.budget.message}
              </p>
            ) : watchedBudget && watchedBudget > 0 ? (
              <p className="text-xs text-muted-foreground">
                ~{Math.round(watchedBudget / (watchedGuestCount || 1))}€ par personne
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Adresse avec autocomplete Mapbox */}
      <div>
        <Label htmlFor="address" className="text-foreground flex items-center gap-2">
          Adresse complète *
          {addressCoordinates && (
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          )}
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
            setAddressDetails({
              city: suggestion.city,
              postalCode: suggestion.postalCode,
              country: suggestion.country,
            });
          }}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.address ? (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.address.message}
            </p>
          ) : addressDetails ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {addressDetails.city}
              {addressDetails.postalCode && `, ${addressDetails.postalCode}`}
            </p>
          ) : null}
        </div>
        
        {/* Indicateur de cuisiniers à proximité */}
        <AnimatePresence>
          {addressCoordinates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              {isCheckingCooks ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recherche de cuisiniers à proximité...
                </div>
              ) : nearbyCooksCount !== null ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {nearbyCooksCount} cuisinier{nearbyCooksCount > 1 ? "s" : ""} disponible{nearbyCooksCount > 1 ? "s" : ""} dans votre zone
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Votre demande sera visible par ces cuisiniers
                    </p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Aperçu de la carte si une adresse est sélectionnée */}
        {addressCoordinates && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg overflow-hidden border border-border shadow-lg"
          >
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
              height="300px"
              interactive={true}
            />
            <div className="p-3 bg-card border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Navigation className="w-4 h-4" />
                <span>Adresse confirmée : {selectedAddress}</span>
              </div>
            </div>
          </motion.div>
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

