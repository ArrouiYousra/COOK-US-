"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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

  const updatePreference = (
    category: keyof NotificationPreferences,
    key: string,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    // TODO: Appel API pour sauvegarder les préférences
    // await apiClient.updateNotificationPreferences(preferences);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Notifications par email */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Notifications par email
          </h3>
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
              onCheckedChange={(checked) =>
                updatePreference("email", "bookings", checked)
              }
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
              onCheckedChange={(checked) =>
                updatePreference("email", "messages", checked)
              }
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
              onCheckedChange={(checked) =>
                updatePreference("email", "reviews", checked)
              }
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
              onCheckedChange={(checked) =>
                updatePreference("email", "promotions", checked)
              }
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
              onCheckedChange={(checked) =>
                updatePreference("app", "bookings", checked)
              }
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
              onCheckedChange={(checked) =>
                updatePreference("app", "messages", checked)
              }
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
              onCheckedChange={(checked) =>
                updatePreference("app", "reviews", checked)
              }
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
              onCheckedChange={(checked) =>
                updatePreference("app", "promotions", checked)
              }
            />
          </div>
        </div>
      </div>

      {/* Notifications par SMS */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Notifications par SMS
          </h3>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Les notifications SMS sont disponibles uniquement pour les
            événements importants et urgents.
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
              onCheckedChange={(checked) =>
                updatePreference("sms", "bookings", checked)
              }
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
              onCheckedChange={(checked) =>
                updatePreference("sms", "urgent", checked)
              }
            />
          </div>
        </div>
      </div>

      {/* Rappels automatiques */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-xl font-bold text-foreground">
            Rappels automatiques
          </h3>
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
              onCheckedChange={(checked) =>
                updatePreference("reminders", "enabled", checked)
              }
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
                  onCheckedChange={(checked) =>
                    updatePreference("reminders", "hours24", checked)
                  }
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
                  onCheckedChange={(checked) =>
                    updatePreference("reminders", "hours1", checked)
                  }
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

