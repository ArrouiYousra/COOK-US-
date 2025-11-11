"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { User, Camera, MapPin, ChefHat, Loader2, CheckCircle2, Euro, Clock, Users, Briefcase, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api/client";

/**
 * Onglet "Profil" pour les cuisiniers
 * Gestion du profil cuisinier : informations personnelles, professionnelles, tarifs, disponibilité
 */
export function CookProfileTab() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [hasNewAvatar, setHasNewAvatar] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    avatar_url: "",
    // Informations professionnelles
    headline: "",
    bio: "",
    experience: "",
    video_intro_url: "",
    // Tarifs et services
    hourly_rate: 0,
    minimum_booking_hours: 1,
    service_radius: 10,
    max_guests: 10,
    can_do_groceries: false,
    can_set_table: false,
    can_do_dishes: false,
    // Statut professionnel
    employment_status: "AUTO_ENTREPRENEUR" as "AUTO_ENTREPRENEUR" | "PORTAGE_SALARIAL" | "MICRO_ENTREPRISE" | "ASSOCIATION",
    siret_number: "",
    // Disponibilité
    is_available: true,
    availability_note: "",
  });

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
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      try {
        const profile = await apiClient.getMyProfile();
        
        if (profile.user) {
          setFormData({
            firstName: profile.user.firstName || "",
            lastName: profile.user.lastName || "",
            phone: profile.user.phone || "",
            address: (profile.user as any).address || "",
            city: (profile.user as any).city || "",
            postalCode: (profile.user as any).postal_code || "",
            avatar_url: profile.user.avatarUrl || "",
            headline: profile.cookProfile?.headline || "",
            bio: profile.cookProfile?.bio || "",
            experience: profile.cookProfile?.experience || "",
            video_intro_url: profile.cookProfile?.video_intro_url || "",
            hourly_rate: profile.cookProfile?.hourly_rate || 0,
            minimum_booking_hours: profile.cookProfile?.minimum_booking_hours || 1,
            service_radius: profile.cookProfile?.service_radius || 10,
            max_guests: profile.cookProfile?.max_guests || 10,
            can_do_groceries: profile.cookProfile?.can_do_groceries || false,
            can_set_table: profile.cookProfile?.can_set_table || false,
            can_do_dishes: profile.cookProfile?.can_do_dishes || false,
            employment_status: (profile.cookProfile?.employment_status || "AUTO_ENTREPRENEUR") as "AUTO_ENTREPRENEUR" | "PORTAGE_SALARIAL" | "MICRO_ENTREPRISE" | "ASSOCIATION",
            siret_number: profile.cookProfile?.siret_number || "",
            is_available: profile.cookProfile?.is_available ?? true,
            availability_note: profile.cookProfile?.availability_note || "",
          });

          // Charger l'avatar depuis le profil
          const avatarUrlFromProfile = profile.user.avatarUrl;
          console.log('Avatar depuis le profil (raw):', avatarUrlFromProfile);
          
          if (avatarUrlFromProfile && avatarUrlFromProfile.trim() !== '') {
            const avatarUrl = avatarUrlFromProfile.trim();
            console.log('✅ Avatar trouvé, mise à jour de l\'état:', avatarUrl);
            setAvatarPreview(avatarUrl);
            setOriginalAvatarUrl(avatarUrl);
            // Mettre à jour aussi formData pour que l'avatar soit affiché et sauvegardé
            setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
            console.log('Avatar chargé et mis à jour dans formData');
          } else {
            // Réinitialiser si pas d'avatar
            console.log('⚠️ Aucun avatar dans le profil, réinitialisation');
            setAvatarPreview(null);
            setOriginalAvatarUrl(null);
            setFormData((prev) => ({ ...prev, avatar_url: "" }));
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadProfile();
    }
  }, [isAuthenticated, user]);

  // Compresser une image avec compression progressive jusqu'à atteindre la taille cible
  const compressImage = (file: File, maxWidth: number = 500, maxHeight: number = 500, maxSizeKB: number = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Utiliser HTMLImageElement au lieu de Image pour éviter le conflit avec next/image
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculer les nouvelles dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

         // Compression progressive : commencer à 0.7 et réduire jusqu'à atteindre la taille cible
         // Qualité plus basse pour commencer = taille plus petite
         let quality = 0.7;
         let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
         let base64Size = (compressedBase64.length * 3) / 4;

         // Réduire la qualité progressivement si nécessaire (jusqu'à 0.4 minimum)
         while (base64Size > maxSizeKB * 1024 && quality > 0.4) {
           quality -= 0.05; // Pas plus petit pour garder une qualité acceptable
           compressedBase64 = canvas.toDataURL('image/jpeg', quality);
           base64Size = (compressedBase64.length * 3) / 4;
         }

         // Si toujours trop grande, réduire encore les dimensions
         if (base64Size > maxSizeKB * 1024) {
           width = Math.floor(width * 0.75);
           height = Math.floor(height * 0.75);
           canvas.width = width;
           canvas.height = height;
           ctx.drawImage(img, 0, 0, width, height);
           compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
           base64Size = (compressedBase64.length * 3) / 4;
         }
         
         // Dernière tentative : réduire encore plus si nécessaire
         if (base64Size > maxSizeKB * 1024) {
           width = Math.floor(width * 0.7);
           height = Math.floor(height * 0.7);
           canvas.width = width;
           canvas.height = height;
           ctx.drawImage(img, 0, 0, width, height);
           compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
           base64Size = (compressedBase64.length * 3) / 4;
         }

          console.log(`Image compressée: ${(base64Size / 1024).toFixed(2)}KB (qualité: ${quality.toFixed(2)}, dimensions: ${width}x${height})`);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsDataURL(file);
    });
  };

  // Gérer le changement d'avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    console.log("handleAvatarChange appelé, fichier:", file);
    
    if (!file) {
      console.log("Aucun fichier sélectionné");
      return;
    }

    console.log("Fichier sélectionné:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop grande. Taille maximale : 5MB");
      // Réinitialiser l'input
      e.target.value = '';
      return;
    }

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      // Réinitialiser l'input
      e.target.value = '';
      return;
    }

    try {
      console.log("Début de la compression de l'image...");
      // Compresser l'image avant de l'afficher
      const compressedBase64 = await compressImage(file);
      console.log("Image compressée avec succès, taille:", compressedBase64.length);
      
      setAvatarPreview(compressedBase64);
      setFormData((prev) => ({ ...prev, avatar_url: compressedBase64 }));
      setHasNewAvatar(true); // Marquer qu'une nouvelle image a été sélectionnée
      
      console.log("Preview et formData mis à jour, nouvelle image détectée");
    } catch (error) {
      console.error("Erreur lors de la compression de l'image:", error);
      alert(`Erreur lors du traitement de l'image: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      // Réinitialiser l'input en cas d'erreur
      e.target.value = '';
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      // Préparer les données en excluant les valeurs vides/null/undefined
      const updateData: any = {};

      // User fields - seulement si non vides
      if (formData.firstName?.trim()) updateData.first_name = formData.firstName.trim();
      if (formData.lastName?.trim()) updateData.last_name = formData.lastName.trim();
      if (formData.phone?.trim()) updateData.phone = formData.phone.trim();
      if (formData.address?.trim()) updateData.address = formData.address.trim();
      if (formData.city?.trim()) updateData.city = formData.city.trim();
      if (formData.postalCode?.trim()) updateData.postal_code = formData.postalCode.trim();
      
      // IMPORTANT: L'avatar base64 est déjà compressé dans handleAvatarChange
      // Le backend gère l'upload de l'avatar séparément si c'est une image base64
      // On envoie l'avatar si:
      // 1. Une nouvelle image a été sélectionnée (base64)
      // 2. Ou si on a une URL d'avatar existante (pour la conserver)
      if (formData.avatar_url) {
        // Si c'est une nouvelle image base64
        if (hasNewAvatar && formData.avatar_url.startsWith('data:')) {
          console.log("Envoi de la nouvelle image avatar (base64)...");
          
          // Calculer la taille réelle (base64 est ~33% plus grand que le binaire)
          const base64Size = (formData.avatar_url.length * 3) / 4;
          const sizeKB = base64Size / 1024;
          
          console.log(`Taille de l'image base64: ${sizeKB.toFixed(2)}KB`);
          
          // Limite à 200KB pour éviter les problèmes de connexion
          // (Express a une limite par défaut, et on veut une marge de sécurité)
          if (base64Size > 200 * 1024) {
            alert(`L'image est encore trop volumineuse après compression (${sizeKB.toFixed(2)}KB). Veuillez choisir une image plus petite ou de meilleure qualité. La limite est de 200KB.`);
            setIsSaving(false);
            return;
          }
          
          updateData.avatar_url = formData.avatar_url;
          console.log("Avatar base64 ajouté aux données de mise à jour");
        } 
        // Si c'est une URL existante (pas base64), l'envoyer aussi pour s'assurer qu'elle est sauvegardée
        else if (!formData.avatar_url.startsWith('data:') && formData.avatar_url.trim() !== '') {
          console.log("Envoi de l'URL avatar existante pour conservation:", formData.avatar_url);
          updateData.avatar_url = formData.avatar_url;
        }
      } else {
        console.log("Aucun avatar dans formData, avatar non envoyé");
      }

      // Cook profile fields - headline est requis, les autres sont optionnels
      // Toujours envoyer headline même si vide (le backend peut avoir besoin de le mettre à jour)
      updateData.headline = formData.headline?.trim() || "";
      if (formData.bio?.trim()) updateData.bio = formData.bio.trim();
      if (formData.experience?.trim()) updateData.experience = formData.experience.trim();
      if (formData.video_intro_url?.trim()) updateData.video_intro_url = formData.video_intro_url.trim();
      
      // Champs numériques - toujours envoyer si définis (même si 0)
      if (formData.hourly_rate !== undefined && formData.hourly_rate !== null) {
        updateData.hourly_rate = formData.hourly_rate;
      }
      if (formData.minimum_booking_hours !== undefined && formData.minimum_booking_hours !== null) {
        updateData.minimum_booking_hours = formData.minimum_booking_hours;
      }
      if (formData.service_radius !== undefined && formData.service_radius !== null) {
        updateData.service_radius = formData.service_radius;
      }
      if (formData.max_guests !== undefined && formData.max_guests !== null) {
        updateData.max_guests = formData.max_guests;
      }

      // Champs booléens
      updateData.can_do_groceries = formData.can_do_groceries;
      updateData.can_set_table = formData.can_set_table;
      updateData.can_do_dishes = formData.can_do_dishes;
      updateData.is_available = formData.is_available;

      // Statut professionnel
      updateData.employment_status = formData.employment_status;
      if (formData.siret_number?.trim()) updateData.siret_number = formData.siret_number.trim();

      // Disponibilité
      if (formData.availability_note?.trim()) updateData.availability_note = formData.availability_note.trim();

      console.log("Données envoyées pour mise à jour:", updateData);

      try {
        const response = await apiClient.updateMyProfile(updateData);
        console.log("Réponse de updateMyProfile:", response);

        // Mettre à jour l'utilisateur dans le store
        if (user) {
          setUser({
            ...user,
            firstName: formData.firstName,
            lastName: formData.lastName,
            avatarUrl: response?.user?.avatarUrl || formData.avatar_url || originalAvatarUrl || "",
          });
        }

        // Mettre à jour l'avatar preview avec la nouvelle URL du serveur
        // IMPORTANT: Toujours mettre à jour l'avatar preview avec la réponse du serveur
        // pour s'assurer qu'on utilise l'URL correcte depuis la base de données
        const newAvatarUrl = response?.user?.avatar_url;
        console.log('Réponse du serveur - avatar_url:', newAvatarUrl);
        console.log('Avatar actuel dans formData:', formData.avatar_url);
        console.log('Avatar original:', originalAvatarUrl);
        
        if (newAvatarUrl && newAvatarUrl.trim() !== '') {
          const avatarUrlToUse = newAvatarUrl.trim();
          console.log('✅ Avatar reçu du serveur, mise à jour:', avatarUrlToUse);
          setAvatarPreview(avatarUrlToUse);
          setOriginalAvatarUrl(avatarUrlToUse);
          setFormData((prev) => ({ ...prev, avatar_url: avatarUrlToUse }));
          setHasNewAvatar(false); // Réinitialiser le flag
          console.log('Avatar mis à jour dans tous les états');
        } else if (originalAvatarUrl && originalAvatarUrl.trim() !== '') {
          // Si pas de nouvelle URL mais qu'on avait une URL originale, la garder
          console.log('⚠️ Pas d\'avatar dans la réponse, conservation de l\'avatar original:', originalAvatarUrl);
          setAvatarPreview(originalAvatarUrl);
          setFormData((prev) => ({ ...prev, avatar_url: originalAvatarUrl }));
        } else {
          console.log('⚠️ Aucun avatar disponible, réinitialisation');
          setAvatarPreview(null);
          setOriginalAvatarUrl(null);
          setFormData((prev) => ({ ...prev, avatar_url: "" }));
        }

        setSuccessMessage("Profil mis à jour avec succès !");
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (updateError: any) {
        // L'erreur sera gérée par le catch principal
        console.error("Erreur spécifique dans updateMyProfile:", updateError);
        throw updateError;
      }
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      console.error("Détails de l'erreur:", {
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        details: error.response?.data?.details,
        status: error.response?.status,
      });

      // Afficher un message d'erreur plus détaillé
      let errorMessage = "Erreur lors de la mise à jour du profil";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = `${error.response.data.error}: ${error.response.data.message || "Erreur inconnue"}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Afficher les détails de validation si disponibles
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        if (details.fieldErrors) {
          const fieldErrors = Object.entries(details.fieldErrors)
            .map(([field, errors]: [string, any]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
            .join("\n");
          errorMessage += `\n\nErreurs de validation:\n${fieldErrors}`;
        }
      }

      alert(errorMessage);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message de succès */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg p-4 flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <p>{successMessage}</p>
        </motion.div>
      )}

      {/* Informations personnelles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Informations personnelles
          </h3>
        </div>

        {/* Photo de profil */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="avatar" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors">
                <Camera className="w-4 h-4" />
                Changer la photo
              </div>
            </Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou GIF. Max 5MB
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
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
          <Input
            id="email"
            type="email"
            value={user?.email || ""}
            disabled
            className="bg-muted"
          />
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
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+33 6 XX XX XX XX"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Numéro et rue"
            />
          </div>
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ville"
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
      </motion.div>

      {/* Informations professionnelles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Informations professionnelles
          </h3>
        </div>

        <div>
          <Label htmlFor="headline">Titre professionnel *</Label>
          <Input
            id="headline"
            value={formData.headline}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            placeholder="Ex: Chef cuisinier spécialisé en cuisine française"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Un titre accrocheur qui décrit votre spécialité
          </p>
        </div>

        <div>
          <Label htmlFor="bio">Biographie</Label>
          <Textarea
            id="bio"
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Parlez de votre parcours, vos spécialités, votre passion pour la cuisine..."
          />
        </div>

        <div>
          <Label htmlFor="experience">Expérience</Label>
          <Textarea
            id="experience"
            rows={3}
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            placeholder="Décrivez votre expérience professionnelle, vos formations, vos certifications..."
          />
        </div>

        <div>
          <Label htmlFor="video_intro_url">URL de la vidéo de présentation</Label>
          <Input
            id="video_intro_url"
            type="url"
            value={formData.video_intro_url}
            onChange={(e) => setFormData({ ...formData, video_intro_url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            Lien vers une vidéo YouTube ou Vimeo de présentation
          </p>
        </div>
      </motion.div>

      {/* Tarifs et services */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Euro className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Tarifs et services
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hourly_rate">Tarif horaire (€) *</Label>
            <Input
              id="hourly_rate"
              type="number"
              min="0"
              step="0.50"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div>
            <Label htmlFor="minimum_booking_hours">Heures minimum de réservation</Label>
            <Input
              id="minimum_booking_hours"
              type="number"
              min="1"
              value={formData.minimum_booking_hours}
              onChange={(e) => setFormData({ ...formData, minimum_booking_hours: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="service_radius">Rayon de service (km)</Label>
            <Input
              id="service_radius"
              type="number"
              min="1"
              value={formData.service_radius}
              onChange={(e) => setFormData({ ...formData, service_radius: parseInt(e.target.value) || 10 })}
            />
          </div>
          <div>
            <Label htmlFor="max_guests">Nombre maximum de convives</Label>
            <Input
              id="max_guests"
              type="number"
              min="1"
              value={formData.max_guests}
              onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 10 })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Services proposés</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.can_do_groceries}
                onChange={(e) => setFormData({ ...formData, can_do_groceries: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Faire les courses</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.can_set_table}
                onChange={(e) => setFormData({ ...formData, can_set_table: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Mettre la table</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.can_do_dishes}
                onChange={(e) => setFormData({ ...formData, can_do_dishes: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Faire la vaisselle</span>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Statut professionnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Statut professionnel
          </h3>
        </div>

        <div>
          <Label htmlFor="employment_status">Statut juridique *</Label>
          <select
            id="employment_status"
            value={formData.employment_status}
            onChange={(e) => setFormData({ ...formData, employment_status: e.target.value as any })}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            required
          >
            <option value="AUTO_ENTREPRENEUR">Auto-entrepreneur</option>
            <option value="PORTAGE_SALARIAL">Portage salarial</option>
            <option value="MICRO_ENTREPRISE">Micro-entreprise</option>
            <option value="ASSOCIATION">Association</option>
          </select>
        </div>

        <div>
          <Label htmlFor="siret_number">Numéro SIRET</Label>
          <Input
            id="siret_number"
            value={formData.siret_number}
            onChange={(e) => setFormData({ ...formData, siret_number: e.target.value })}
            placeholder="123 456 789 00012"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Requis pour certains statuts
          </p>
        </div>
      </motion.div>

      {/* Disponibilité */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Disponibilité
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_available"
            checked={formData.is_available}
            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="is_available" className="cursor-pointer">
            Je suis actuellement disponible pour de nouvelles réservations
          </Label>
        </div>

        <div>
          <Label htmlFor="availability_note">Note de disponibilité</Label>
          <Textarea
            id="availability_note"
            rows={2}
            value={formData.availability_note}
            onChange={(e) => setFormData({ ...formData, availability_note: e.target.value })}
            placeholder="Ex: Disponible du lundi au vendredi, horaires flexibles..."
          />
        </div>
      </motion.div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
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
  );
}
