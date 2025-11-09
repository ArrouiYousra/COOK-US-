"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Upload, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { mockBookings } from "@/mockData";

/**
 * Page de création d'avis après réservation
 */
export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [detailedRatings, setDetailedRatings] = useState({
    quality: 0,
    punctuality: 0,
    cleanliness: 0,
    communication: 0,
  });
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trouver la réservation
  const booking = mockBookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Réservation introuvable</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/client/bookings">Retour aux réservations</Link>
        </Button>
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setPhotos((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Veuillez donner une note");
      return;
    }

    setIsSubmitting(true);

    // TODO: Appel API pour créer l'avis
    // await createReview({
    //   bookingId,
    //   cookId: booking.cookId,
    //   rating,
    //   detailedRatings,
    //   comment,
    //   photos,
    //   isRecommended: isRecommending,
    // });

    // Simuler un délai
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/dashboard/client/bookings/${bookingId}`);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/client/bookings/${bookingId}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-trebuchet text-3xl font-bold text-foreground">
            Laisser un avis
          </h1>
          <p className="text-muted-foreground">
            Partagez votre expérience avec {booking.cookName}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Note globale */}
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Note globale *
          </Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-none text-muted-foreground"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-4 text-muted-foreground">
                {rating === 5
                  ? "Excellent"
                  : rating === 4
                  ? "Très bien"
                  : rating === 3
                  ? "Bien"
                  : rating === 2
                  ? "Moyen"
                  : "Médiocre"}
              </span>
            )}
          </div>
        </div>

        {/* Notes détaillées */}
        <div className="space-y-4">
          <Label className="text-base font-semibold mb-3 block">
            Détails (optionnel)
          </Label>
          
          {[
            { key: "quality" as const, label: "Qualité de la cuisine" },
            { key: "punctuality" as const, label: "Ponctualité" },
            { key: "cleanliness" as const, label: "Propreté" },
            { key: "communication" as const, label: "Communication" },
          ].map((criterion) => (
            <div key={criterion.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{criterion.label}</Label>
                <span className="text-xs text-muted-foreground">
                  {detailedRatings[criterion.key] > 0
                    ? `${detailedRatings[criterion.key]}/5`
                    : "Non noté"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setDetailedRatings({
                        ...detailedRatings,
                        [criterion.key]: star,
                      })
                    }
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= detailedRatings[criterion.key]
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-none text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recommandation */}
        <div className="p-4 rounded-lg bg-accent border border-border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold mb-1 block">
                Recommander ce cuisinier
              </Label>
              <p className="text-sm text-muted-foreground">
                Recommandez {booking.cookName} à d'autres clients
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRecommending(!isRecommending)}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${isRecommending ? "bg-green-500" : "bg-muted"}
              `}
            >
              <span
                className={`
                  absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${isRecommending ? "translate-x-6" : "translate-x-0"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Commentaire */}
        <div>
          <Label htmlFor="comment" className="text-base font-semibold mb-3 block">
            Votre avis (optionnel)
          </Label>
          <Textarea
            id="comment"
            placeholder="Décrivez votre expérience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {comment.length} / 500 caractères
          </p>
        </div>

        {/* Photos */}
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Photos (optionnel)
          </Label>
          <div className="space-y-4">
            {/* Grille de photos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <Image
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton d'upload */}
            {photos.length < 5 && (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Ajouter des photos ({photos.length}/5)
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            asChild
            className="flex-1"
          >
            <Link href={`/dashboard/client/bookings/${bookingId}`}>
              Annuler
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Publication..." : "Publier l'avis"}
          </Button>
        </div>
      </form>
    </div>
  );
}

