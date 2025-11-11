"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Euro,
  Calendar,
  MessageSquare,
  Heart,
  ChefHat,
  Clock,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CookCalendar } from "@/components/dashboard/cooks/CookCalendar";
import { ReviewsSection } from "@/components/dashboard/cooks/ReviewsSection";
import { MakeProposalModal } from "@/components/dashboard/cooks/MakeProposalModal";
import { ShareProfile } from "@/components/dashboard/cooks/ShareProfile";
import { apiClient } from "@/lib/api/client";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";

/**
 * Page de profil détaillé d'un cuisinier
 */
export default function CookProfilePage() {
  const params = useParams();
  const router = useRouter();
  const cookId = params.id as string;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [cook, setCook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccessToast, showErrorToast } = useNotificationToast();

  // Charger le profil du cuisinier
  useEffect(() => {
    const loadCookProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cookProfiles = await apiClient.getCookProfiles({ limit: 1000 });
        const cookProfile = cookProfiles.profiles.find(
          (p: any) => p.id === cookId
        );

        if (!cookProfile) {
          setError("Cuisinier introuvable");
          setIsLoading(false);
          return;
        }

        setCook(cookProfile);

        // Vérifier si le cuisinier est en favori
        try {
          const favoriteCheck = await apiClient.checkFavorite(cookId);
          setIsFavorite(favoriteCheck.isFavorite);
        } catch (err) {
          // Si l'utilisateur n'est pas authentifié, on continue sans les favoris
          console.warn("Impossible de vérifier le statut favori:", err);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement du profil:", err);
        setError(err.response?.data?.message || "Impossible de charger le profil");
      } finally {
        setIsLoading(false);
      }
    };

    if (cookId) {
      loadCookProfile();
    }
  }, [cookId]);

  // Gérer le toggle favori
  const handleToggleFavorite = async () => {
    setIsLoadingFavorite(true);
    const previousState = isFavorite;

    // Optimistic update
    setIsFavorite(!isFavorite);

    try {
      if (previousState) {
        await apiClient.removeFavorite(cookId);
        showSuccessToast("Cuisinier retiré des favoris");
      } else {
        await apiClient.addFavorite(cookId);
        showSuccessToast("Cuisinier ajouté aux favoris");
      }
    } catch (error: any) {
      // Revert on error
      setIsFavorite(previousState);
      console.error("Erreur lors de la mise à jour des favoris:", error);
      
      if (error?.response?.status === 401 || error?.message?.includes("authenticated")) {
        showErrorToast("Vous devez être connecté pour ajouter des favoris");
      } else {
        showErrorToast(error?.response?.data?.message || "Impossible de mettre à jour les favoris");
      }
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !cook) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{error || "Cuisinier introuvable"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/client/cooks">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const cookName = cook.user?.first_name && cook.user?.last_name
    ? `${cook.user.first_name} ${cook.user.last_name}`
    : cook.user?.first_name || "Cuisinier";
  const rating = cook.average_rating || 0;
  const reviewCount = cook.review_count || 0;
  const city = cook.user?.city || "Ville non renseignée";
  const hourlyRate = cook.hourly_rate || 0;
  const specialties = cook.specialties || ["Cuisine variée"];
  const bio = cook.bio || "Aucune description disponible";

  return (
    <div className="space-y-8">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Retour
        </Button>
        <div className="flex items-center gap-2">
          <ShareProfile cookId={cookId} cookName={cookName} />
          <button
            onClick={handleToggleFavorite}
            disabled={isLoadingFavorite}
            className="p-2 rounded-full hover:bg-accent transition-colors disabled:opacity-50"
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Profil principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Photo */}
          <div className="relative w-48 h-48 lg:w-64 lg:h-64 rounded-xl overflow-hidden flex-shrink-0">
            {cook.user?.avatar_url ? (
              <Image
                src={cook.user.avatar_url}
                alt={cookName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {cookName}
                </h1>
                {rating > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold text-foreground">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                    {reviewCount > 0 && (
                      <span className="text-muted-foreground">
                        ({reviewCount} avis)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {bio}
            </p>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {hourlyRate > 0 && (
                <div className="flex items-center gap-2">
                  <Euro className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tarif horaire</p>
                    <p className="font-semibold text-foreground">
                      {hourlyRate} € / h
                    </p>
                  </div>
                </div>
              )}
              {cook.max_guests && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Capacité max</p>
                    <p className="font-semibold text-foreground">
                      {cook.max_guests} personnes
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Localisation</p>
                  <p className="font-semibold text-foreground">
                    {city}
                  </p>
                </div>
              </div>
              {cook.experience && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expérience</p>
                    <p className="font-semibold text-foreground">{cook.experience}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Spécialités */}
            {specialties.length > 0 && (
              <div className="mb-6">
                <h3 className="font-cera text-lg font-semibold text-foreground mb-3">
                  Spécialités culinaires
                </h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-accent text-foreground text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsProposalModalOpen(true)}
                className="flex-1"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Faire une proposition
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link href={`/dashboard/client/requests/new?cook=${cookId}`}>
                  Publier une demande
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Disponibilités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <h2 className="font-cera text-2xl font-bold text-foreground mb-6">
          Disponibilités
        </h2>
        <CookCalendar cookId={cookId} />
      </motion.div>

      {/* Avis clients */}
      <ReviewsSection cookId={cookId} reviews={[]} />

      {/* Modal de proposition */}
      <MakeProposalModal
        cookId={cookId}
        cookName={cookName}
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
      />
    </div>
  );
}

