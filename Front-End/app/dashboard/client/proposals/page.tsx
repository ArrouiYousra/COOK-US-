"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  Users,
  Euro,
  MapPin,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { mockCooks } from "@/mockData";
import type { ClientProposal } from "@/types";
import { formatDate } from "@/lib/utils";

// Mock data - À remplacer par les vraies données
const mockProposals: ClientProposal[] = [
  {
    id: "prop-1",
    cookId: mockCooks[0].id,
    clientId: "client-123",
    date: "2024-01-25",
    timeSlot: "Dîner (19h-21h)",
    numberOfGuests: 4,
    budget: 200,
    address: "123 Rue de la Paix, 75001 Paris",
    description: "Dîner romantique pour 4 personnes, cuisine française",
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-2",
    cookId: mockCooks[1].id,
    clientId: "client-123",
    date: "2024-01-28",
    timeSlot: "Midi (12h-14h)",
    numberOfGuests: 2,
    budget: 150,
    address: "45 Avenue des Champs, 75008 Paris",
    description: "Brunch dominical pour 2 personnes",
    status: "accepted",
    acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    bookingId: "booking-1",
    conversationId: "conv-1",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-3",
    cookId: mockCooks[2].id,
    clientId: "client-123",
    date: "2024-01-30",
    timeSlot: "Dîner (19h-21h)",
    numberOfGuests: 6,
    budget: 300,
    address: "78 Boulevard Saint-Germain, 75006 Paris",
    description: "Repas de famille, cuisine italienne",
    status: "rejected",
    rejectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Page "Mes Propositions"
 * Gère les propositions directes envoyées par le client aux cuisiniers
 */
export default function ProposalsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  const filteredProposals = mockProposals.filter((proposal) => {
    if (activeTab === "all") return true;
    return proposal.status === activeTab;
  });

  const getStatusConfig = (status: ClientProposal["status"]) => {
    switch (status) {
      case "pending":
        return {
          label: "En attente",
          icon: Hourglass,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
          borderColor: "border-yellow-500/20",
        };
      case "accepted":
        return {
          label: "Acceptée",
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-500/10 dark:bg-green-500/20",
          borderColor: "border-green-500/20",
        };
      case "rejected":
        return {
          label: "Refusée",
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-500/10 dark:bg-red-500/20",
          borderColor: "border-red-500/20",
        };
      default:
        return {
          label: "Expirée",
          icon: Clock,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-500/10 dark:bg-gray-500/20",
          borderColor: "border-gray-500/20",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Mes Propositions
        </h1>
        <p className="text-muted-foreground">
          Gérez vos propositions directes aux cuisiniers
        </p>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="accepted">Acceptées</TabsTrigger>
          <TabsTrigger value="rejected">Refusées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredProposals.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucune proposition {activeTab === "all" ? "" : activeTab === "pending" ? "en attente" : activeTab === "accepted" ? "acceptée" : "refusée"}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProposals.map((proposal, index) => {
                const cook = mockCooks.find((c) => c.id === proposal.cookId);
                if (!cook) return null;

                const statusConfig = getStatusConfig(proposal.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Photo du cuisinier */}
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
                        {cook.avatarUrl ? (
                          <Image
                            src={cook.avatarUrl}
                            alt={cook.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-2xl">👨‍🍳</span>
                          </div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-cera text-xl font-bold text-foreground mb-1">
                              {cook.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {proposal.description}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Détails */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span>{formatDate(proposal.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span>{proposal.timeSlot}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span>{proposal.numberOfGuests} personne{proposal.numberOfGuests > 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                              <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-semibold text-foreground">
                              {proposal.budget} €
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <div className="w-8 h-8 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <span>{proposal.address}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-4 border-t border-border">
                          {proposal.status === "accepted" && proposal.conversationId && (
                            <Button
                              asChild
                              size="sm"
                              className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white"
                            >
                              <Link href={`/dashboard/client/messages?cook=${proposal.cookId}`}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Discuter
                              </Link>
                            </Button>
                          )}
                          {proposal.status === "accepted" && proposal.bookingId && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                            >
                              <Link href={`/dashboard/client/bookings/${proposal.bookingId}`}>
                                Voir la réservation
                              </Link>
                            </Button>
                          )}
                          {proposal.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-muted-foreground"
                              disabled
                            >
                              En attente de réponse...
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

