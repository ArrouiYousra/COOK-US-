"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { User, Camera, MapPin, UtensilsCrossed, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api/client";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";

// Mapping des options françaises vers les valeurs API
const dietaryMapping: Record<string, string> = {
  "Végétarien": "VEGETARIAN",
  "Végan": "VEGAN",
  "Sans gluten": "GLUTEN_FREE",
  "Sans lactose": "LACTOSE_FREE",
  "Halal": "HALAL",
  "Cacher": "KOSHER",
  "Low carb": "LOW_CARB",
  "Keto": "KETO",
  "Paléo": "PALEO",
};

const allergyMapping: Record<string, string> = {
  "Arachides": "PEANUTS",
  "Fruits à coque": "TREE_NUTS",
  "Lait": "MILK",
  "Œufs": "EGGS",
  "Poisson": "FISH",
  "Crustacés": "SHELLFISH",
  "Soja": "SOY",
  "Blé": "WHEAT",
  "Sésame": "SESAME",
  "Moutarde": "MUSTARD",
  "Céleri": "CELERY",
  "Lupin": "LUPIN",
  "Sulfites": "SULFITES",
};

// Mapping inverse
const reverseDietaryMapping: Record<string, string> = Object.fromEntries(
  Object.entries(dietaryMapping).map(([k, v]) => [v, k])
);
const reverseAllergyMapping: Record<string, string> = Object.fromEntries(
  Object.entries(allergyMapping).map(([k, v]) => [v, k])
);

/**
 * Onglet "Profil"
 * Gestion du profil utilisateur : nom, photo, bio, adresse, préférences alimentaires
 */
export function ProfileTab() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const { showSuccessToast, showErrorToast } = useNotificationToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    dietaryRestrictions: [] as string[],
    allergies: [] as string[],
  });

  const dietaryOptions = [
    "Végétarien",
    "Végan",
    "Sans gluten",
    "Sans lactose",
    "Halal",
    "Cacher",
    "Low carb",
    "Keto",
    "Paléo",
  ];

  const allergyOptions = [
    "Arachides",
    "Fruits à coque",
    "Lait",
    "Œufs",
    "Poisson",
    "Crustacés",
    "Soja",
    "Blé",
    "Sésame",
    "Moutarde",
    "Céleri",
    "Lupin",
    "Sulfites",
  ];

  // Vérifier l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !isAuthLoading) {
        try {
          await checkAuth();
        } catch (error) {
          console.warn("Authentification échouée, redirection vers la page de connexion");
          router.push("/auth/login");
        }
      }
    };

    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Charger les données du profil
  useEffect(() => {
    const loadProfile = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      try {
        const profileData = await apiClient.getMyProfile();
        const userData = profileData.user || user;
        const clientProfile = profileData.clientProfile;

        // Charger les préférences alimentaires
        const [restrictionsData, allergiesData] = await Promise.allSettled([
          apiClient.getDietaryRestrictions(),
          apiClient.getAllergies(),
        ]);

        const restrictions =
          restrictionsData.status === "fulfilled"
            ? restrictionsData.value.restrictions.map((r: any) => reverseDietaryMapping[r.restriction] || r.restriction)
            : [];
        const allergies =
          allergiesData.status === "fulfilled"
            ? allergiesData.value.allergies.map((a: any) => reverseAllergyMapping[a.allergy] || a.allergy)
            : [];

        setFormData({
          firstName: (userData as any).first_name || userData.firstName || "",
          lastName: (userData as any).last_name || userData.lastName || "",
          phone: userData.phone || "",
          address: (userData as any).address || "",
          city: (userData as any).city || "",
          postalCode: (userData as any).postal_code || (userData as any).postalCode || "",
          dietaryRestrictions: restrictions,
          allergies: allergies,
        });

        if ((userData as any).avatar_url || userData.avatarUrl) {
          setAvatarPreview((userData as any).avatar_url || userData.avatarUrl);
        }
      } catch (error: any) {
        console.error("Erreur lors du chargement du profil:", error);
        
        // Si l'erreur est 401, rediriger vers la connexion
        if (error.response?.status === 401 || error.message?.includes("Jeton d'authentification manquant")) {
          router.push("/auth/login");
          return;
        }
        
        showErrorToast("Impossible de charger le profil.");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user && !isAuthLoading) {
      loadProfile();
    }
  }, [user, isAuthenticated, isAuthLoading, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showErrorToast("Format de fichier invalide. Veuillez choisir une image.");
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showErrorToast("Image trop volumineuse (max 5 Mo).");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.onerror = () => {
      showErrorToast("Impossible de lire ce fichier image.");
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleToggleOption = async (
    option: string,
    category: "dietaryRestrictions" | "allergies"
  ) => {
    const isSelected = formData[category].includes(option);
    const apiValue = category === "dietaryRestrictions" ? dietaryMapping[option] : allergyMapping[option];

    try {
      if (isSelected) {
        // Supprimer
        if (category === "dietaryRestrictions") {
          await apiClient.removeDietaryRestriction(apiValue);
        } else {
          await apiClient.removeAllergy(apiValue);
        }
        setFormData((prev) => ({
          ...prev,
          [category]: prev[category].filter((item) => item !== option),
        }));
      } else {
        // Ajouter
        if (category === "dietaryRestrictions") {
          await apiClient.addDietaryRestriction(apiValue);
        } else {
          await apiClient.addAllergy(apiValue);
        }
        setFormData((prev) => ({
          ...prev,
          [category]: [...prev[category], option],
        }));
      }
    } catch (error: any) {
      console.error(`Erreur lors de la ${isSelected ? "suppression" : "ajout"} de ${option}:`, error);
      showErrorToast(
        `Impossible de ${isSelected ? "supprimer" : "ajouter"} ${option}.`,
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const updateData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postal_code: formData.postalCode || undefined,
      };

      // Upload de l'avatar si c'est une image base64
      if (avatarPreview && avatarPreview.startsWith("data:")) {
        updateData.avatar_url = avatarPreview;
      }

      const response = await apiClient.updateMyProfile(updateData);

      // Mettre à jour le store avec les nouvelles données
      if (response.user) {
        setUser({
          ...user,
          ...response.user,
          firstName: response.user.first_name || response.user.firstName,
          lastName: response.user.last_name || response.user.lastName,
        });
      }

      setSuccessMessage("Profil mis à jour avec succès !");
      showSuccessToast("Profil mis à jour avec succès !");
      if (response.user?.avatar_url || response.user?.avatarUrl) {
        setAvatarPreview(
          response.user.avatar_url ||
            response.user.avatarUrl ||
            avatarPreview,
        );
      }

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Impossible de mettre à jour le profil.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo de profil */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                {avatarPreview || user?.avatarUrl || (user as any)?.avatar_url ? (
                  <Image
                    src={avatarPreview || user?.avatarUrl || (user as any)?.avatar_url || ""}
                    alt={`${formData.firstName} ${formData.lastName}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Photo de profil</h3>
              <p className="text-sm text-muted-foreground">JPG, PNG ou GIF. Max 5MB</p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-cera text-xl font-bold text-foreground mb-4">
            Informations personnelles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground mt-1">L'email ne peut pas être modifié</p>
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-cera text-xl font-bold text-foreground">Adresse</h3>
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Rue de la Paix"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Paris"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="75001"
              />
            </div>
          </div>
        </div>

        {/* Préférences alimentaires */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-cera text-xl font-bold text-foreground">
              Préférences alimentaires
            </h3>
          </div>

          <div>
            <Label className="mb-3 block">Régimes alimentaires</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dietaryOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dietary-${option}`}
                    checked={formData.dietaryRestrictions.includes(option)}
                    onCheckedChange={() => handleToggleOption(option, "dietaryRestrictions")}
                  />
                  <Label htmlFor={`dietary-${option}`} className="text-sm cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Allergies</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allergyOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`allergy-${option}`}
                    checked={formData.allergies.includes(option)}
                    onCheckedChange={() => handleToggleOption(option, "allergies")}
                  />
                  <Label htmlFor={`allergy-${option}`} className="text-sm cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

