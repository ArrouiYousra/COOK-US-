"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChefHat,
  Camera,
  MapPin,
  Euro,
  Clock,
  Users,
  Briefcase,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { Checkbox } from "@/components/ui/checkbox";

// Schéma de validation
const cookProfileSchema = z.object({
  // Informations de base
  headline: z.string().min(10, "Le titre doit contenir au moins 10 caractères"),
  bio: z.string().min(50, "La bio doit contenir au moins 50 caractères"),
  experience: z.string().min(10, "Décrivez votre expérience"),
  
  // Tarifs et services
  hourlyRate: z.number().min(0, "Le tarif horaire doit être positif"),
  minimumBookingHours: z.number().min(1, "Minimum 1 heure"),
  maxGuests: z.number().min(1, "Minimum 1 invité"),
  serviceRadius: z.number().min(0, "Le rayon de service doit être positif"),
  
  // Options de service
  canDoGroceries: z.boolean(),
  canSetTable: z.boolean(),
  canDoDishes: z.boolean(),
  
  // Statut professionnel
  employmentStatus: z.enum(["EMPLOYEE", "SELF_EMPLOYED", "STUDENT", "OTHER"]),
  siretNumber: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceExpiryDate: z.string().optional(),
  
  // Disponibilité
  isAvailable: z.boolean(),
  availabilityNote: z.string().optional(),
});

type CookProfileFormData = z.infer<typeof cookProfileSchema>;

/**
 * Page de gestion du profil professionnel du cuisinier
 */
export default function CookProfilePage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    idCard?: string;
    insuranceCert?: string;
    kbis?: string;
  }>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CookProfileFormData>({
    resolver: zodResolver(cookProfileSchema),
    defaultValues: {
      headline: "",
      bio: "",
      experience: "",
      hourlyRate: 0,
      minimumBookingHours: 2,
      maxGuests: 10,
      serviceRadius: 20,
      canDoGroceries: false,
      canSetTable: false,
      canDoDishes: false,
      employmentStatus: "SELF_EMPLOYED",
      isAvailable: true,
    },
  });

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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleDocumentUpload = (type: "idCard" | "insuranceCert" | "kbis") => {
    // TODO: Implémenter l'upload de documents
    console.log(`Upload ${type}`);
  };

  const onSubmit = async (data: CookProfileFormData) => {
    setIsSaving(true);
    try {
      // TODO: Appel API pour sauvegarder le profil
      // await apiClient.updateCookProfile(data);
      console.log("Profil sauvegardé:", data);
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setIsSaving(false);
    }
  };

  const isAvailable = watch("isAvailable");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Mon Profil Professionnel
        </h1>
        <p className="text-muted-foreground">
          Gérez votre profil et optimisez votre visibilité
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo de profil et vidéo */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-cera text-xl font-bold text-foreground mb-4">
            Photo et vidéo
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Photo de profil */}
            <div>
              <Label className="mb-3 block">Photo de profil</Label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                    {avatarPreview || user?.avatarUrl ? (
                      <Image
                        src={avatarPreview || user?.avatarUrl || ""}
                        alt="Photo de profil"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ChefHat className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
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
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG ou GIF. Max 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Vidéo de présentation */}
            <div>
              <Label className="mb-3 block">Vidéo de présentation (optionnel)</Label>
              {videoPreview ? (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-48 rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setVideoPreview(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Ajouter une vidéo de présentation
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Informations professionnelles */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-cera text-xl font-bold text-foreground mb-4">
            Informations professionnelles
          </h3>

          {/* Titre professionnel */}
          <div>
            <Label htmlFor="headline">Titre professionnel *</Label>
            <Input
              id="headline"
              placeholder="Ex: Chef cuisinier spécialisé en cuisine française"
              {...register("headline")}
              className={errors.headline ? "border-destructive" : ""}
            />
            {errors.headline && (
              <p className="mt-1 text-sm text-destructive">
                {errors.headline.message}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Biographie *</Label>
            <Textarea
              id="bio"
              placeholder="Parlez de votre parcours, vos spécialités, votre passion pour la cuisine..."
              rows={6}
              {...register("bio")}
              className={errors.bio ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 50 caractères
            </p>
            {errors.bio && (
              <p className="mt-1 text-sm text-destructive">
                {errors.bio.message}
              </p>
            )}
          </div>

          {/* Expérience */}
          <div>
            <Label htmlFor="experience">Expérience *</Label>
            <Textarea
              id="experience"
              placeholder="Décrivez votre expérience professionnelle, vos formations, vos réalisations..."
              rows={4}
              {...register("experience")}
              className={errors.experience ? "border-destructive" : ""}
            />
            {errors.experience && (
              <p className="mt-1 text-sm text-destructive">
                {errors.experience.message}
              </p>
            )}
          </div>
        </div>

        {/* Tarifs et services */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-cera text-xl font-bold text-foreground mb-4">
            Tarifs et services
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Tarif horaire */}
            <div>
              <Label htmlFor="hourlyRate">Tarif horaire (€) *</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="35"
                  {...register("hourlyRate", { valueAsNumber: true })}
                  className={errors.hourlyRate ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {errors.hourlyRate && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.hourlyRate.message}
                </p>
              )}
            </div>

            {/* Heures minimum */}
            <div>
              <Label htmlFor="minimumBookingHours">Heures minimum *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="minimumBookingHours"
                  type="number"
                  min="1"
                  placeholder="2"
                  {...register("minimumBookingHours", { valueAsNumber: true })}
                  className={errors.minimumBookingHours ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {errors.minimumBookingHours && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.minimumBookingHours.message}
                </p>
              )}
            </div>

            {/* Invités maximum */}
            <div>
              <Label htmlFor="maxGuests">Nombre d'invités maximum *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  placeholder="10"
                  {...register("maxGuests", { valueAsNumber: true })}
                  className={errors.maxGuests ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {errors.maxGuests && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.maxGuests.message}
                </p>
              )}
            </div>

            {/* Rayon de service */}
            <div>
              <Label htmlFor="serviceRadius">Rayon de service (km) *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="serviceRadius"
                  type="number"
                  min="0"
                  placeholder="20"
                  {...register("serviceRadius", { valueAsNumber: true })}
                  className={errors.serviceRadius ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {errors.serviceRadius && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.serviceRadius.message}
                </p>
              )}
            </div>
          </div>

          {/* Options de service */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label>Options de service</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDoGroceries"
                  checked={watch("canDoGroceries")}
                  onCheckedChange={(checked) =>
                    setValue("canDoGroceries", !!checked)
                  }
                />
                <Label
                  htmlFor="canDoGroceries"
                  className="text-sm font-normal cursor-pointer"
                >
                  Je peux faire les courses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canSetTable"
                  checked={watch("canSetTable")}
                  onCheckedChange={(checked) => setValue("canSetTable", !!checked)}
                />
                <Label
                  htmlFor="canSetTable"
                  className="text-sm font-normal cursor-pointer"
                >
                  Je peux mettre la table
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDoDishes"
                  checked={watch("canDoDishes")}
                  onCheckedChange={(checked) => setValue("canDoDishes", !!checked)}
                />
                <Label
                  htmlFor="canDoDishes"
                  className="text-sm font-normal cursor-pointer"
                >
                  Je peux faire la vaisselle
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Statut professionnel */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-cera text-xl font-bold text-foreground mb-4">
            Statut professionnel
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Statut d'emploi */}
            <div>
              <Label htmlFor="employmentStatus">Statut d'emploi *</Label>
              <select
                id="employmentStatus"
                {...register("employmentStatus")}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="SELF_EMPLOYED">Auto-entrepreneur</option>
                <option value="EMPLOYEE">Salarié</option>
                <option value="STUDENT">Étudiant</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            {/* SIRET */}
            <div>
              <Label htmlFor="siretNumber">Numéro SIRET (optionnel)</Label>
              <Input
                id="siretNumber"
                placeholder="123 456 789 00012"
                {...register("siretNumber")}
              />
            </div>

            {/* Assurance */}
            <div>
              <Label htmlFor="insuranceNumber">Numéro d'assurance (optionnel)</Label>
              <Input
                id="insuranceNumber"
                placeholder="Numéro d'assurance"
                {...register("insuranceNumber")}
              />
            </div>

            {/* Date d'expiration assurance */}
            <div>
              <Label htmlFor="insuranceExpiryDate">
                Date d'expiration assurance (optionnel)
              </Label>
              <Input
                id="insuranceExpiryDate"
                type="date"
                {...register("insuranceExpiryDate")}
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-cera text-xl font-bold text-foreground mb-4">
            Documents professionnels
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Carte d'identité */}
            <div>
              <Label className="mb-2 block">Carte d'identité</Label>
              {uploadedDocuments.idCard ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-accent">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm flex-1">Document uploadé</span>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadedDocuments({ ...uploadedDocuments, idCard: undefined })
                    }
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={() => handleDocumentUpload("idCard")}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                  </div>
                </label>
              )}
            </div>

            {/* Certificat d'assurance */}
            <div>
              <Label className="mb-2 block">Certificat d'assurance</Label>
              {uploadedDocuments.insuranceCert ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-accent">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm flex-1">Document uploadé</span>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadedDocuments({
                        ...uploadedDocuments,
                        insuranceCert: undefined,
                      })
                    }
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={() => handleDocumentUpload("insuranceCert")}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                  </div>
                </label>
              )}
            </div>

            {/* KBIS */}
            <div>
              <Label className="mb-2 block">KBIS (si auto-entrepreneur)</Label>
              {uploadedDocuments.kbis ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-accent">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm flex-1">Document uploadé</span>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadedDocuments({ ...uploadedDocuments, kbis: undefined })
                    }
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={() => handleDocumentUpload("kbis")}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Disponibilité */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-cera text-xl font-bold text-foreground mb-4">
            Disponibilité
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-accent border border-border">
              <div>
                <Label className="text-base font-semibold mb-1 block">
                  Statut de disponibilité
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isAvailable
                    ? "Vous êtes actuellement disponible pour recevoir des demandes"
                    : "Vous n'acceptez pas de nouvelles demandes pour le moment"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue("isAvailable", !isAvailable)}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${isAvailable ? "bg-green-500" : "bg-muted"}
                `}
              >
                <span
                  className={`
                    absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${isAvailable ? "translate-x-6" : "translate-x-0"}
                  `}
                />
              </button>
            </div>

            {!isAvailable && (
              <div>
                <Label htmlFor="availabilityNote">Note de disponibilité</Label>
                <Textarea
                  id="availabilityNote"
                  placeholder="Ex: Indisponible jusqu'au 15 janvier pour cause de vacances"
                  rows={3}
                  {...register("availabilityNote")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" size="lg">
            Annuler
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer le profil"}
          </Button>
        </div>
      </form>
    </div>
  );
}

