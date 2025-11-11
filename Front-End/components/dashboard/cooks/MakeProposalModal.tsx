"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users, Euro, MapPin, Loader2, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { MapboxAutocomplete } from "@/components/mapbox/MapboxAutocomplete";
import { MapboxMap } from "@/components/mapbox/MapboxMap";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";

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
  cookId: string; // user_id du cuisinier
  cookProfileId?: string; // cook_profile_id (optionnel, sera récupéré si non fourni)
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
  cookProfileId: initialCookProfileId,
  cookName,
  isOpen,
  onClose,
  onSuccess,
}: MakeProposalModalProps) {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useNotificationToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cookProfileId, setCookProfileId] = useState<string | undefined>(initialCookProfileId);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [addressDetails, setAddressDetails] = useState<{
    city?: string;
    postalCode?: string;
    country?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<MakeProposalFormData>({
    resolver: zodResolver(makeProposalSchema),
    mode: "onChange",
  });

  // Récupérer le cook_profile_id si non fourni
  useEffect(() => {
    const fetchCookProfileId = async () => {
      if (cookProfileId || !cookId) return;
      
      try {
        // Récupérer le profil du cuisinier via l'API
        const profiles = await apiClient.getCookProfiles({ limit: 1000 });
        const cookProfile = profiles.profiles.find((p: any) => p.user?.id === cookId || p.user_id === cookId);
        if (cookProfile?.id) {
          setCookProfileId(cookProfile.id);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil cuisinier:", error);
      }
    };

    if (isOpen) {
      fetchCookProfileId();
    }
  }, [cookId, cookProfileId, isOpen]);

  const onSubmit = async (data: MakeProposalFormData) => {
    try {
      setIsSubmitting(true);

      if (!cookProfileId) {
        showErrorToast("Impossible de récupérer le profil du cuisinier. Veuillez réessayer.");
        return;
      }

      if (!addressCoordinates) {
        showErrorToast("Veuillez sélectionner une adresse valide sur la carte.");
        return;
      }

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

      // Créer la proposition directe via l'API
      await apiClient.createDirectProposal({
        cook_profile_id: cookProfileId,
        booking_date: data.date,
        meal_type,
        start_time,
        end_time,
        number_of_guests: data.numberOfGuests,
        special_requests: `${data.description}\n\n${data.specialRequests || ""}`,
        // TODO: Créer l'adresse dans la table addresses et utiliser address_id
        // Pour l'instant, on passe l'adresse dans special_requests
      });

      showSuccessToast(`Proposition envoyée à ${cookName} ! Il recevra une notification.`);
      
      reset();
      setSelectedAddress("");
      setAddressCoordinates(undefined);
      setAddressDetails(null);
      onClose();
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger vers la page des propositions
        router.push("/dashboard/client/proposals");
      }
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de la proposition:", error);
      const errorMessage = error?.response?.data?.message || "Erreur lors de l'envoi de la proposition. Veuillez réessayer.";
      showErrorToast(errorMessage);
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
              
              {/* Carte Mapbox pour visualiser l'adresse */}
              {addressCoordinates && (
                <div className="mt-4 rounded-lg overflow-hidden border border-border">
                  <MapboxMap
                    center={[addressCoordinates.lat, addressCoordinates.lng]}
                    zoom={15}
                    markers={[{
                      id: "selected-address",
                      lat: addressCoordinates.lat,
                      lng: addressCoordinates.lng,
                      title: selectedAddress || "Adresse sélectionnée",
                      description: addressDetails?.city || "",
                      color: "#3b82f6",
                    }]}
                    height="200px"
                  />
                </div>
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

