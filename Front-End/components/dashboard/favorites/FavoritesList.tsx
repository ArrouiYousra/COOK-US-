"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Star,
  MapPin,
  Euro,
  ExternalLink,
  Trash2,
  Bell,
  BellOff,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Cook } from "@/types";
import { formatPrice } from "@/lib/utils";

// Mock data pour les notifications - À remplacer par les vraies données
const getDefaultNotifications = (favorites: Cook[]) => {
  const notifications: Record<string, boolean> = {};
  favorites.forEach((cook, index) => {
    // Activer les notifications pour le premier favori par défaut
    notifications[cook.id] = index === 0;
  });
  return notifications;
};

interface FavoritesListProps {
  favorites: Cook[];
}

/**
 * Liste des favoris avec actions
 * Affiche les chefs favoris avec possibilité de voir le profil, supprimer, et activer les notifications
 */
export function FavoritesList({ favorites }: FavoritesListProps) {
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    getDefaultNotifications(favorites)
  );

  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveFavorite = async (cookId: string) => {
    setRemovingId(cookId);
    // TODO: Appel API pour supprimer des favoris
    // await apiClient.removeFavorite(cookId);
    setTimeout(() => {
      setRemovingId(null);
      // En production, on mettrait à jour la liste après la suppression
    }, 500);
  };

  const toggleNotification = (cookId: string) => {
    setNotifications((prev) => ({
      ...prev,
      [cookId]: !prev[cookId],
    }));
    // TODO: Appel API pour activer/désactiver les notifications
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((cook, index) => (
        <FavoriteCard
          key={cook.id}
          cook={cook}
          index={index}
          isNotified={notifications[cook.id] || false}
          onToggleNotification={() => toggleNotification(cook.id)}
          onRemove={() => handleRemoveFavorite(cook.id)}
          isRemoving={removingId === cook.id}
        />
      ))}
    </div>
  );
}

interface FavoriteCardProps {
  cook: Cook;
  index: number;
  isNotified: boolean;
  onToggleNotification: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}

function FavoriteCard({
  cook,
  index,
  isNotified,
  onToggleNotification,
  onRemove,
  isRemoving,
}: FavoriteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image du chef */}
      <div className="relative w-full h-48 overflow-hidden">
        {cook.avatarUrl ? (
          <Image
            src={cook.avatarUrl}
            alt={cook.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {/* Badge favori */}
        <div className="absolute top-3 right-3">
          <div className="bg-red-500 rounded-full p-2 shadow-lg">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 space-y-4">
        {/* Nom et note */}
        <div>
          <h3 className="font-cera text-xl font-bold text-foreground mb-1">
            {cook.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-foreground">
                {cook.rating}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({cook.reviewCount} avis)
            </span>
          </div>
        </div>

        {/* Spécialités */}
        <div className="flex flex-wrap gap-2">
          {cook.specialties.slice(0, 2).map((specialty, idx) => (
            <span
              key={idx}
              className="px-2 py-1 rounded-full bg-accent text-xs text-muted-foreground"
            >
              {specialty}
            </span>
          ))}
        </div>

        {/* Localisation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <span className="truncate">{cook.location.city}</span>
        </div>

        {/* Prix */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-muted-foreground">Tarif moyen</span>
          </div>
          <span className="font-semibold text-foreground">
            {formatPrice(cook.pricePerPerson)} / personne
          </span>
        </div>

        {/* Option notification */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isNotified
                  ? "bg-blue-500/10 dark:bg-blue-500/20"
                  : "bg-gray-500/10 dark:bg-gray-500/20"
              )}
            >
              {isNotified ? (
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <Label
              htmlFor={`notify-${cook.id}`}
              className="text-sm text-foreground cursor-pointer"
            >
              Notifier quand disponible
            </Label>
          </div>
          <Switch
            id={`notify-${cook.id}`}
            checked={isNotified}
            onCheckedChange={onToggleNotification}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            asChild
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <Link href={`/dashboard/client/cooks/${cook.id}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir profil
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

