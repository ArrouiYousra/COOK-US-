"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/dashboard/settings/ProfileTab";
import { SecurityTab } from "@/components/dashboard/settings/SecurityTab";
import { NotificationsTab } from "@/components/dashboard/settings/NotificationsTab";
import { PaymentTab } from "@/components/dashboard/settings/PaymentTab";
import { AddressTab } from "@/components/dashboard/settings/AddressTab";
import { DeleteAccountSection } from "@/components/dashboard/settings/DeleteAccountSection";

/**
 * Page "Paramètres"
 * Gestion complète des paramètres du compte client
 */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Paramètres
          </h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
        <SettingsIcon className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full lg:w-auto">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payment">Moyens de paiement</TabsTrigger>
          <TabsTrigger value="addresses">Adresses</TabsTrigger>
        </TabsList>

        {/* Contenu des onglets */}
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentTab />
        </TabsContent>

        <TabsContent value="addresses">
          <AddressTab />
        </TabsContent>
      </Tabs>

      {/* Section supprimer le compte (toujours visible) */}
      <DeleteAccountSection />
    </div>
  );
}

