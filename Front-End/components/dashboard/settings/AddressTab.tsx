"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Plus,
  Trash2,
  Edit,
  Star,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api/client";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";
import { MapboxAutocomplete } from "@/components/mapbox/MapboxAutocomplete";

interface Address {
  id: string;
  type?: "HOME" | "VACATION_RENTAL" | "WORK" | "OTHER";
  label?: string;
  street: string;
  street_number: string;
  complement?: string;
  city: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  access_code?: string;
  access_notes?: string;
  parking_info?: string;
  has_oven?: boolean;
  has_dishwasher?: boolean;
  kitchen_notes?: string;
  is_default: boolean;
}

/**
 * Onglet "Adresses"
 * Gestion des adresses du client (ajout, modification, suppression, défaut)
 */
export function AddressTab() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } =
    useAuthStore();
  const { showSuccessToast, showErrorToast } = useNotificationToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [addressSearchValue, setAddressSearchValue] = useState("");
  const [formData, setFormData] = useState({
    type: "HOME" as "HOME" | "VACATION_RENTAL" | "WORK" | "OTHER",
    label: "",
    street: "",
    street_number: "",
    complement: "",
    city: "",
    postal_code: "",
    country: "FR",
    latitude: 0,
    longitude: 0,
    access_code: "",
    access_notes: "",
    parking_info: "",
    has_oven: false,
    has_dishwasher: false,
    kitchen_notes: "",
    is_default: false,
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

  // Charger les adresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      try {
        const response = await apiClient.getMyAddresses();
        setAddresses(response.addresses || []);
      } catch (error: any) {
        console.error("Erreur lors du chargement des adresses:", error);

        if (
          error.response?.status === 401 ||
          error.message?.includes("Jeton d'authentification manquant")
        ) {
          router.push("/auth/login");
          return;
        }

        showErrorToast("Impossible de charger les adresses");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user && !isAuthLoading) {
      loadAddresses();
    }
  }, [user, isAuthenticated, isAuthLoading, router]);

  const handleAddressSelect = (suggestion: {
    placeName: string;
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    postalCode?: string;
    country?: string;
  }) => {
    // Extraire le numéro de rue et la rue depuis l'adresse
    const addressParts = suggestion.address.split(",")[0]?.trim().split(" ") || [];
    const streetNumber = addressParts[0] || "";
    const street = addressParts.slice(1).join(" ") || suggestion.address;

    setFormData({
      ...formData,
      street: street,
      street_number: streetNumber,
      city: suggestion.city || "",
      postal_code: suggestion.postalCode || "",
      country: suggestion.country?.toUpperCase() || "FR",
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
  };

  const handleOpenAddDialog = () => {
    setEditingAddress(null);
    setAddressSearchValue("");
    setFormData({
      type: "HOME",
      label: "",
      street: "",
      street_number: "",
      complement: "",
      city: "",
      postal_code: "",
      country: "FR",
      latitude: 0,
      longitude: 0,
      access_code: "",
      access_notes: "",
      parking_info: "",
      has_oven: false,
      has_dishwasher: false,
      kitchen_notes: "",
      is_default: false,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (address: Address) => {
    setEditingAddress(address);
    setAddressSearchValue(
      `${address.street_number} ${address.street}, ${address.postal_code} ${address.city}`,
    );
    setFormData({
      type: address.type || "HOME",
      label: address.label || "",
      street: address.street,
      street_number: address.street_number,
      complement: address.complement || "",
      city: address.city,
      postal_code: address.postal_code,
      country: address.country || "FR",
      latitude: address.latitude,
      longitude: address.longitude,
      access_code: address.access_code || "",
      access_notes: address.access_notes || "",
      parking_info: address.parking_info || "",
      has_oven: address.has_oven || false,
      has_dishwasher: address.has_dishwasher || false,
      kitchen_notes: address.kitchen_notes || "",
      is_default: address.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.street || !formData.street_number || !formData.city || !formData.postal_code) {
      showErrorToast("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      showErrorToast("Veuillez sélectionner une adresse valide");
      return;
    }

    try {
      if (editingAddress) {
        await apiClient.updateAddress(editingAddress.id, formData);
        showSuccessToast("Adresse mise à jour avec succès !");
      } else {
        await apiClient.createAddress(formData);
        showSuccessToast("Adresse ajoutée avec succès !");
      }

      setIsDialogOpen(false);
      setSuccessMessage(
        editingAddress
          ? "Adresse mise à jour avec succès !"
          : "Adresse ajoutée avec succès !",
      );
      setTimeout(() => setSuccessMessage(null), 3000);

      // Recharger les adresses
      const response = await apiClient.getMyAddresses();
      setAddresses(response.addresses || []);
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde de l'adresse:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Impossible de sauvegarder l'adresse",
      );
    }
  };

  const handleDelete = async (addressId: string) => {
    setIsDeleting(addressId);
    try {
      await apiClient.deleteAddress(addressId);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      showSuccessToast("Adresse supprimée avec succès !");
      setSuccessMessage("Adresse supprimée avec succès !");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'adresse:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Impossible de supprimer l'adresse",
      );
    } finally {
      setIsDeleting(null);
      setConfirmDeleteId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await apiClient.setDefaultAddress(addressId);
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default: addr.id === addressId,
        })),
      );
      showSuccessToast("Adresse par défaut mise à jour !");
      setSuccessMessage("Adresse par défaut mise à jour !");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'adresse par défaut:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Impossible de mettre à jour l'adresse par défaut",
      );
    }
  };

  const getTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      HOME: "Domicile",
      VACATION_RENTAL: "Location de vacances",
      WORK: "Travail",
      OTHER: "Autre",
    };
    return labels[type || "HOME"] || "Domicile";
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
          <p className="text-sm text-green-600 dark:text-green-400">
            {successMessage}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-cera text-xl font-bold text-foreground">
              Mes adresses
            </h3>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une adresse
          </Button>
        </div>

        {/* Liste des adresses */}
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Aucune adresse enregistrée
            </p>
            <p className="text-sm text-muted-foreground">
              Ajoutez une adresse pour faciliter vos réservations
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {address.is_default && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <span className="font-semibold text-foreground">
                        {address.label || getTypeLabel(address.type)}
                      </span>
                      {address.is_default && (
                        <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.street_number} {address.street}
                      {address.complement && `, ${address.complement}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.postal_code} {address.city}
                    </p>
                    {address.access_code && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Code d'accès : {address.access_code}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Défaut
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDialog(address)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteId(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog pour ajouter/modifier une adresse */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Modifier l'adresse" : "Ajouter une adresse"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Modifiez les informations de votre adresse"
                : "Ajoutez une nouvelle adresse pour vos réservations"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recherche d'adresse avec Mapbox */}
            <div>
              <Label>Rechercher une adresse *</Label>
              <MapboxAutocomplete
                value={addressSearchValue}
                onChange={(address, coordinates) => {
                  setAddressSearchValue(address);
                  if (coordinates) {
                    setFormData({
                      ...formData,
                      latitude: coordinates.lat,
                      longitude: coordinates.lng,
                    });
                  }
                }}
                onSelect={handleAddressSelect}
                placeholder="Commencez à taper une adresse..."
                className="mt-2"
                country="FR"
              />
            </div>

            {/* Type et label */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME">Domicile</SelectItem>
                    <SelectItem value="VACATION_RENTAL">
                      Location de vacances
                    </SelectItem>
                    <SelectItem value="WORK">Travail</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="label">Label (optionnel)</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="Ex: Maison principale"
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street_number">Numéro *</Label>
                <Input
                  id="street_number"
                  value={formData.street_number}
                  onChange={(e) =>
                    setFormData({ ...formData, street_number: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="street">Rue *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="complement">Complément d'adresse</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) =>
                  setFormData({ ...formData, complement: e.target.value })
                }
                placeholder="Appartement, étage, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Code postal *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Informations d'accès */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Informations d'accès</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="access_code">Code d'accès</Label>
                  <Input
                    id="access_code"
                    value={formData.access_code}
                    onChange={(e) =>
                      setFormData({ ...formData, access_code: e.target.value })
                    }
                    placeholder="Code de la porte, digicode, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="access_notes">Notes d'accès</Label>
                  <Textarea
                    id="access_notes"
                    value={formData.access_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, access_notes: e.target.value })
                    }
                    placeholder="Instructions pour accéder à l'adresse..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="parking_info">Informations de parking</Label>
                  <Textarea
                    id="parking_info"
                    value={formData.parking_info}
                    onChange={(e) =>
                      setFormData({ ...formData, parking_info: e.target.value })
                    }
                    placeholder="Parking disponible, places de stationnement..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Équipements de cuisine */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Équipements de cuisine</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_oven"
                    checked={formData.has_oven}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, has_oven: !!checked })
                    }
                  />
                  <Label htmlFor="has_oven" className="cursor-pointer">
                    Four disponible
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_dishwasher"
                    checked={formData.has_dishwasher}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, has_dishwasher: !!checked })
                    }
                  />
                  <Label htmlFor="has_dishwasher" className="cursor-pointer">
                    Lave-vaisselle disponible
                  </Label>
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="kitchen_notes">Notes sur la cuisine</Label>
                <Textarea
                  id="kitchen_notes"
                  value={formData.kitchen_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, kitchen_notes: e.target.value })
                  }
                  placeholder="Informations supplémentaires sur la cuisine..."
                  rows={2}
                />
              </div>
            </div>

            {/* Adresse par défaut */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_default: !!checked })
                }
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Définir comme adresse par défaut
              </Label>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                {editingAddress ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l'adresse</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette adresse ? Cette action
              est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDeleteId(null)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) {
                  handleDelete(confirmDeleteId);
                }
              }}
              disabled={!!isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

