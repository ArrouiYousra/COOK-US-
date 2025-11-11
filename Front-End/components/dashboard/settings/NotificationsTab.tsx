"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

interface NotificationPreferences {
  email: {
    bookings: boolean;
    messages: boolean;
    reviews: boolean;
    promotions: boolean;
  };
  app: {
    bookings: boolean;
    messages: boolean;
    reviews: boolean;
    promotions: boolean;
  };
  sms: {
    bookings: boolean;
    urgent: boolean;
  };
  reminders: {
    enabled: boolean;
    hours24: boolean;
    hours1: boolean;
    method: "app" | "email" | "both";
  };
}

/**
 * Onglet "Notifications"
 * Gestion des préférences de notifications (mail, app, SMS)
 */
export function NotificationsTab() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      bookings: true,
      messages: true,
      reviews: true,
      promotions: false,
    },
    app: {
      bookings: true,
      messages: true,
      reviews: true,
      promotions: true,
    },
    sms: {
      bookings: false,
      urgent: true,
    },
    reminders: {
      enabled: true,
      hours24: true,
      hours1: true,
      method: "both",
    },
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

  // Charger les préférences depuis le profil
  useEffect(() => {
    const loadPreferences = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      try {
        // Charger les préférences détaillées depuis l'API
        const detailedPrefs = await apiClient.getNotificationPreferences();
        const prefs = detailedPrefs?.preferences || {
          booking_request: { email: true, sms: false, push: true },
          booking_accepted: { email: true, sms: false, push: true },
          booking_confirmed: { email: true, sms: true, push: true },
          booking_cancelled: { email: true, sms: false, push: true },
          booking_reminder: { email: true, sms: true, push: true },
          review_received: { email: true, sms: false, push: true },
          message_received: { email: false, sms: false, push: true },
          payment_received: { email: true, sms: false, push: true },
          dispute_opened: { email: true, sms: false, push: true },
          profile_approved: { email: true, sms: false, push: true },
          profile_rejected: { email: true, sms: false, push: true },
          marketing_promotions: { email: false, sms: false, push: true },
        };

        // Mapper les préférences détaillées vers l'interface locale
        setPreferences((prev) => ({
          ...prev,
          email: {
            bookings: prefs.booking_request?.email || prefs.booking_confirmed?.email || false,
            messages: prefs.message_received?.email || false,
            reviews: prefs.review_received?.email || false,
            promotions: prefs.marketing_promotions?.email ?? false,
          },
          app: {
            bookings: prefs.booking_request?.push || prefs.booking_confirmed?.push || false,
            messages: prefs.message_received?.push || false,
            reviews: prefs.review_received?.push || false,
            promotions: prefs.marketing_promotions?.push ?? false,
          },
          sms: {
            bookings: prefs.booking_confirmed?.sms || false,
            urgent: prefs.booking_reminder?.sms || false,
          },
        }));
      } catch (error: any) {
        console.error("Erreur lors du chargement des préférences:", error);
        
        // Si l'erreur est 401, rediriger vers la connexion
        if (error.response?.status === 401 || error.message?.includes("Jeton d'authentification manquant")) {
          router.push("/auth/login");
          return;
        }
        
        // En cas d'erreur, utiliser les valeurs par défaut pour ne pas casser l'UI
        console.warn("Utilisation des préférences par défaut en cas d'erreur");
        const defaultPrefs = {
          booking_request: { email: true, sms: false, push: true },
          booking_accepted: { email: true, sms: false, push: true },
          booking_confirmed: { email: true, sms: true, push: true },
          booking_cancelled: { email: true, sms: false, push: true },
          booking_reminder: { email: true, sms: true, push: true },
          review_received: { email: true, sms: false, push: true },
          message_received: { email: false, sms: false, push: true },
          payment_received: { email: true, sms: false, push: true },
          dispute_opened: { email: true, sms: false, push: true },
          profile_approved: { email: true, sms: false, push: true },
          profile_rejected: { email: true, sms: false, push: true },
          marketing_promotions: { email: false, sms: false, push: true },
        };
        
        setPreferences((prev) => ({
          ...prev,
          email: {
            bookings: defaultPrefs.booking_request?.email || defaultPrefs.booking_confirmed?.email || false,
            messages: defaultPrefs.message_received?.email || false,
            reviews: defaultPrefs.review_received?.email || false,
            promotions: defaultPrefs.marketing_promotions?.email ?? false,
          },
          app: {
            bookings: defaultPrefs.booking_request?.push || defaultPrefs.booking_confirmed?.push || false,
            messages: defaultPrefs.message_received?.push || false,
            reviews: defaultPrefs.review_received?.push || false,
            promotions: defaultPrefs.marketing_promotions?.push ?? false,
          },
          sms: {
            bookings: defaultPrefs.booking_confirmed?.sms || false,
            urgent: defaultPrefs.booking_reminder?.sms || false,
          },
        }));
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user && !isAuthLoading) {
      loadPreferences();
    }
  }, [user, isAuthenticated, isAuthLoading, router]);

  const updatePreference = async (
    category: keyof NotificationPreferences,
    key: string,
    value: boolean
  ) => {
    setErrorMessage(null);
    const previousPreferences = preferences;
    const nextPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value,
      },
    } as NotificationPreferences;
    setPreferences(nextPreferences);

    // Mapper les préférences locales vers les préférences détaillées de l'API
    try {
      const updateData: any = {};

      // Mapper les préférences email
      if (category === "email") {
        if (key === "bookings") {
          updateData.booking_request = {
            email: nextPreferences.email.bookings,
            sms: false,
            push: nextPreferences.app.bookings,
          };
          updateData.booking_confirmed = {
            email: nextPreferences.email.bookings,
            sms: nextPreferences.sms.bookings,
            push: nextPreferences.app.bookings,
          };
        } else if (key === "messages") {
          updateData.message_received = {
            email: nextPreferences.email.messages,
            sms: false,
            push: nextPreferences.app.messages,
          };
        } else if (key === "reviews") {
          updateData.review_received = {
            email: nextPreferences.email.reviews,
            sms: false,
            push: nextPreferences.app.reviews,
          };
        } else if (key === "promotions") {
          updateData.marketing_promotions = {
            email: nextPreferences.email.promotions,
            sms: false,
            push: nextPreferences.app.promotions,
          };
        }
      }

      // Mapper les préférences app (push)
      if (category === "app") {
        if (key === "bookings") {
          updateData.booking_request = {
            email: nextPreferences.email.bookings,
            sms: false,
            push: nextPreferences.app.bookings,
          };
          updateData.booking_confirmed = {
            email: nextPreferences.email.bookings,
            sms: nextPreferences.sms.bookings,
            push: nextPreferences.app.bookings,
          };
        } else if (key === "messages") {
          updateData.message_received = {
            email: nextPreferences.email.messages,
            sms: false,
            push: nextPreferences.app.messages,
          };
        } else if (key === "reviews") {
          updateData.review_received = {
            email: nextPreferences.email.reviews,
            sms: false,
            push: nextPreferences.app.reviews,
          };
        } else if (key === "promotions") {
          updateData.marketing_promotions = {
            email: nextPreferences.email.promotions,
            sms: false,
            push: nextPreferences.app.promotions,
          };
        }
      }

      // Mapper les préférences SMS
      if (category === "sms") {
        if (key === "bookings") {
          updateData.booking_confirmed = {
            email: nextPreferences.email.bookings,
            sms: nextPreferences.sms.bookings,
            push: nextPreferences.app.bookings,
          };
        } else if (key === "urgent") {
          updateData.booking_reminder = {
            email: true,
            sms: nextPreferences.sms.urgent,
            push: true,
          };
        }
      }

      if (key === "promotions" && !updateData.marketing_promotions) {
        updateData.marketing_promotions = {
          email: nextPreferences.email.promotions,
          sms: false,
          push: nextPreferences.app.promotions,
        };
      }

      // Sauvegarder les préférences détaillées
      await apiClient.updateNotificationPreferences(updateData);

      // Mettre à jour les préférences globales
      const notificationsEnabled =
        Object.values(nextPreferences.email).some(Boolean) ||
        Object.values(nextPreferences.app).some(Boolean);

      await apiClient.updateMyProfile({
        notifications_enabled: notificationsEnabled,
        email_notifications: Object.values(nextPreferences.email).some(Boolean),
        sms_notifications: Object.values(nextPreferences.sms).some(Boolean),
      });

      setSuccessMessage("Préférences mises à jour !");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde des préférences:", error);
      setErrorMessage("Impossible de sauvegarder les préférences pour le moment.");
      // Revert to previous preferences
      setPreferences(previousPreferences);
      setTimeout(() => setErrorMessage(null), 3000);
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
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Notifications par email */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">Notifications par email</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-bookings" className="cursor-pointer">
                Réservations
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des emails pour vos réservations
              </p>
            </div>
            <Switch
              id="email-bookings"
              checked={preferences.email.bookings}
              onCheckedChange={(checked) => updatePreference("email", "bookings", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-messages" className="cursor-pointer">
                Messages
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des emails pour les nouveaux messages
              </p>
            </div>
            <Switch
              id="email-messages"
              checked={preferences.email.messages}
              onCheckedChange={(checked) => updatePreference("email", "messages", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-reviews" className="cursor-pointer">
                Avis
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des emails pour les nouveaux avis
              </p>
            </div>
            <Switch
              id="email-reviews"
              checked={preferences.email.reviews}
              onCheckedChange={(checked) => updatePreference("email", "reviews", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-promotions" className="cursor-pointer">
                Promotions et offres
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des emails pour les promotions et offres spéciales
              </p>
            </div>
            <Switch
              id="email-promotions"
              checked={preferences.email.promotions}
              onCheckedChange={(checked) => updatePreference("email", "promotions", checked)}
            />
          </div>
        </div>
      </div>

      {/* Notifications dans l'application */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Notifications dans l'application
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app-bookings" className="cursor-pointer">
                Réservations
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des notifications pour vos réservations
              </p>
            </div>
            <Switch
              id="app-bookings"
              checked={preferences.app.bookings}
              onCheckedChange={(checked) => updatePreference("app", "bookings", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app-messages" className="cursor-pointer">
                Messages
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des notifications pour les nouveaux messages
              </p>
            </div>
            <Switch
              id="app-messages"
              checked={preferences.app.messages}
              onCheckedChange={(checked) => updatePreference("app", "messages", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app-reviews" className="cursor-pointer">
                Avis
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des notifications pour les nouveaux avis
              </p>
            </div>
            <Switch
              id="app-reviews"
              checked={preferences.app.reviews}
              onCheckedChange={(checked) => updatePreference("app", "reviews", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app-promotions" className="cursor-pointer">
                Promotions et offres
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des notifications pour les promotions
              </p>
            </div>
            <Switch
              id="app-promotions"
              checked={preferences.app.promotions}
              onCheckedChange={(checked) => updatePreference("app", "promotions", checked)}
            />
          </div>
        </div>
      </div>

      {/* Notifications par SMS */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">Notifications par SMS</h3>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Les notifications SMS sont disponibles uniquement pour les événements importants et
            urgents.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-bookings" className="cursor-pointer">
                Réservations importantes
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des SMS pour les confirmations de réservation
              </p>
            </div>
            <Switch
              id="sms-bookings"
              checked={preferences.sms.bookings}
              onCheckedChange={(checked) => updatePreference("sms", "bookings", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-urgent" className="cursor-pointer">
                Alertes urgentes
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des SMS pour les alertes urgentes uniquement
              </p>
            </div>
            <Switch
              id="sms-urgent"
              checked={preferences.sms.urgent}
              onCheckedChange={(checked) => updatePreference("sms", "urgent", checked)}
            />
          </div>
        </div>
      </div>

      {/* Rappels automatiques */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">Rappels automatiques</h3>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Recevez des rappels automatiques avant vos réservations pour ne rien oublier.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminders-enabled" className="cursor-pointer">
                Activer les rappels
              </Label>
              <p className="text-xs text-muted-foreground">
                Activez les rappels automatiques pour vos réservations
              </p>
            </div>
            <Switch
              id="reminders-enabled"
              checked={preferences.reminders.enabled}
              onCheckedChange={(checked) => updatePreference("reminders", "enabled", checked)}
            />
          </div>

          {preferences.reminders.enabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reminders-24h" className="cursor-pointer">
                    Rappel 24h avant
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recevez un rappel 24 heures avant votre réservation
                  </p>
                </div>
                <Switch
                  id="reminders-24h"
                  checked={preferences.reminders.hours24}
                  onCheckedChange={(checked) => updatePreference("reminders", "hours24", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reminders-1h" className="cursor-pointer">
                    Rappel 1h avant
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recevez un rappel 1 heure avant votre réservation
                  </p>
                </div>
                <Switch
                  id="reminders-1h"
                  checked={preferences.reminders.hours1}
                  onCheckedChange={(checked) => updatePreference("reminders", "hours1", checked)}
                />
              </div>

              <div className="pt-4 border-t border-border">
                <Label className="mb-2 block">Méthode de rappel</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reminder-method"
                      value="app"
                      checked={preferences.reminders.method === "app"}
                      onChange={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          reminders: { ...prev.reminders, method: "app" },
                        }))
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Application uniquement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reminder-method"
                      value="email"
                      checked={preferences.reminders.method === "email"}
                      onChange={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          reminders: { ...prev.reminders, method: "email" },
                        }))
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Email uniquement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reminder-method"
                      value="both"
                      checked={preferences.reminders.method === "both"}
                      onChange={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          reminders: { ...prev.reminders, method: "both" },
                        }))
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Application et email</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
