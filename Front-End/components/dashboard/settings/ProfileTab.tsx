"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { User, Camera, MapPin, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Onglet "Profil"
 * Gestion du profil utilisateur : nom, photo, bio, adresse, préférences alimentaires
 */
export function ProfileTab() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: "",
    phone: user?.phone || "",
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleOption = (
    option: string,
    category: "dietaryRestrictions" | "allergies"
  ) => {
    setFormData((prev) => ({
      ...prev,
      [category]: prev[category].includes(option)
        ? prev[category].filter((item) => item !== option)
        : [...prev[category], option],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: Appel API pour sauvegarder le profil
    // await apiClient.updateProfile(formData);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo de profil */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                {avatarPreview || user?.avatarUrl ? (
                  <Image
                    src={avatarPreview || user?.avatarUrl || ""}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    fill
                    className="object-cover"
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
              <h3 className="font-semibold text-foreground mb-1">
                Photo de profil
              </h3>
              <p className="text-sm text-muted-foreground">
                JPG, PNG ou GIF. Max 5MB
              </p>
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
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground mt-1">
              L'email ne peut pas être modifié
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio courte</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Parlez-nous un peu de vous..."
              rows={4}
            />
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-cera text-xl font-bold text-foreground">
              Adresse
            </h3>
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="123 Rue de la Paix"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Paris"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
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
                    onCheckedChange={() =>
                      handleToggleOption(option, "dietaryRestrictions")
                    }
                  />
                  <Label
                    htmlFor={`dietary-${option}`}
                    className="text-sm cursor-pointer"
                  >
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
                    onCheckedChange={() =>
                      handleToggleOption(option, "allergies")
                    }
                  />
                  <Label
                    htmlFor={`allergy-${option}`}
                    className="text-sm cursor-pointer"
                  >
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
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

