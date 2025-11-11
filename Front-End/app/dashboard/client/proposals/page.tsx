"use client";

import { useState, useEffect, useMemo } from "react";
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
  Loader2,
  CheckCircle2,
  CreditCard,
  ChefHat,
  ArrowRight,
  Bell,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";

/**
 * Page "Mes Propositions"
 * Gère les propositions directes envoyées par le client aux cuisiniers
 */
export default function ProposalsPage() {
  const { showSuccessToast, showErrorToast } = useNotificationToast();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [enrichedProposals, setEnrichedProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, accepted: 0, rejected: 0 });
  const [sortBy, setSortBy] = useState<"date" | "cook" | "budget">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Charger toutes les propositions au montage
  useEffect(() => {
    const loadProposals = async () => {
      setIsLoading(true);
      try {
        // Charger toutes les propositions directement depuis l'API
        const [pendingRes, acceptedRes, rejectedRes] = await Promise.allSettled([
          apiClient.getMyProposals({ filter: "pending", limit: 100 }),
          apiClient.getMyProposals({ filter: "accepted", limit: 100 }),
          apiClient.getMyProposals({ filter: "rejected", limit: 100 }),
        ]);

        // Combiner toutes les propositions et calculer les stats
        const allProposals: any[] = [];
        let pendingCount = 0;
        let acceptedCount = 0;
        let rejectedCount = 0;

        if (pendingRes.status === "fulfilled") {
          const pending = pendingRes.value.bookings || [];
          allProposals.push(...pending);
          pendingCount = pending.length;
        }
        if (acceptedRes.status === "fulfilled") {
          const accepted = acceptedRes.value.bookings || [];
          allProposals.push(...accepted);
          acceptedCount = accepted.length;
        }
        if (rejectedRes.status === "fulfilled") {
          const rejected = rejectedRes.value.bookings || [];
          allProposals.push(...rejected);
          rejectedCount = rejected.length;
        }

        setStats({ pending: pendingCount, accepted: acceptedCount, rejected: rejectedCount });

        // Récupérer tous les cookIds uniques pour charger les profils en une seule fois
        const cookIds = new Set<string>();
        allProposals.forEach((proposal) => {
          const cookId = (proposal as any).cookId || (proposal as any).cook?.id;
          if (cookId) cookIds.add(cookId);
        });

        // Charger tous les profils de cuisiniers en une seule fois
        let cooksMap = new Map();
        if (cookIds.size > 0) {
          try {
            const allCooks = await apiClient.getCookProfiles({ limit: 1000 });
            allCooks.profiles.forEach((cook: any) => {
              const id = cook.id || cook.user?.id;
              if (id) cooksMap.set(id, cook);
            });
          } catch (error) {
            console.warn("Impossible de charger les profils des cuisiniers:", error);
          }
        }

        // Enrichir les propositions avec les données des cuisiniers
        const enriched = allProposals.map((proposal) => {
          try {
            // Récupérer les infos du cuisinier si cookId est disponible
            const cookId = (proposal as any).cookId || (proposal as any).cook?.id;
            const cookData = cookId ? cooksMap.get(cookId) : null;

              // Mapper le statut du booking au statut de proposition
              let proposalStatus: "pending" | "accepted" | "rejected" = "pending";
              if (proposal.status === "confirmed" || proposal.status === "proposition_accepted") {
                proposalStatus = "accepted";
              } else if (proposal.status === "cancelled" || (proposal as any).rejected) {
                proposalStatus = "rejected";
              } else if (
                proposal.status === "proposition_pending" ||
                proposal.status === "pending" ||
                proposal.status === "payment_pending"
              ) {
                proposalStatus = "pending";
              }

              // Formater l'heure
              const timeSlot = proposal.time
                ? proposal.time.includes(":")
                  ? proposal.time
                  : `${proposal.time}h`
                : "Non spécifié";

              // Utiliser booking_date si date n'est pas disponible
              const proposalDate = proposal.date || proposal.booking_date || (proposal as any).booking_date || null;

              return {
                id: proposal.id,
                cookId: cookId || (proposal as any).cook?.id,
                clientId: proposal.userId,
                date: proposalDate,
                timeSlot,
                numberOfGuests: proposal.numberOfGuests,
                budget: proposal.totalPrice,
                address: (proposal as any).address || (proposal as any).location?.address || "Adresse non spécifiée",
                description: proposal.specialRequests || (proposal as any).description || "Aucune description",
                status: proposalStatus,
                createdAt: proposal.createdAt,
                updatedAt: proposal.updatedAt,
                acceptedAt: proposalStatus === "accepted" ? (proposal as any).acceptedAt || proposal.updatedAt : undefined,
                rejectedAt: proposalStatus === "rejected" ? (proposal as any).rejectedAt || proposal.updatedAt : undefined,
                bookingId: proposalStatus === "accepted" ? proposal.id : undefined,
                conversationId: (proposal as any).conversationId,
                cook: cookData
                  ? {
                      id: cookData.id || cookData.user?.id,
                      name: cookData.user?.first_name && cookData.user?.last_name
                        ? `${cookData.user.first_name} ${cookData.user.last_name}`
                        : cookData.user?.name || "Cuisinier",
                      avatarUrl: cookData.user?.avatar_url,
                      rating: cookData.average_rating || cookData.user?.rating,
                    }
                  : (proposal as any).cook || {
                      id: cookId,
                      name: "Cuisinier",
                      avatarUrl: null,
                      rating: null,
                    },
              };
            } catch (error) {
              console.error(`Erreur lors de l'enrichissement de la proposition ${proposal.id}:`, error);
              return null;
            }
          })
          .filter((p) => p !== null);

        setEnrichedProposals(enriched);
      } catch (error) {
        console.error("Erreur lors du chargement des propositions:", error);
        setEnrichedProposals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Charger uniquement au montage

  // Filtrer et trier les propositions
  const filteredAndSortedProposals = useMemo(() => {
    let filtered = enrichedProposals.filter((proposal) => {
      if (activeTab === "all") return true;
      return proposal.status === activeTab;
    });

    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "cook":
          const cookA = a.cook?.name || "";
          const cookB = b.cook?.name || "";
          comparison = cookA.localeCompare(cookB);
          break;
        case "budget":
          const budgetA = a.budget || 0;
          const budgetB = b.budget || 0;
          comparison = budgetA - budgetB;
          break;
        case "date":
        default:
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [enrichedProposals, activeTab, sortBy, sortOrder]);

  const getStatusConfig = (status: "pending" | "accepted" | "rejected") => {
    switch (status) {
      case "pending":
        return {
          label: "En attente",
          icon: Hourglass,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
          borderColor: "border-yellow-500/20",
          step: 1,
          totalSteps: 4,
        };
      case "accepted":
        return {
          label: "Acceptée",
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-500/10 dark:bg-green-500/20",
          borderColor: "border-green-500/20",
          step: 2,
          totalSteps: 4,
        };
      case "rejected":
        return {
          label: "Refusée",
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-500/10 dark:bg-red-500/20",
          borderColor: "border-red-500/20",
          step: 0,
          totalSteps: 4,
        };
      default:
        return {
          label: "Expirée",
          icon: Clock,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-500/10 dark:bg-gray-500/20",
          borderColor: "border-gray-500/20",
          step: 0,
          totalSteps: 4,
        };
    }
  };

  const getTimelineSteps = (status: "pending" | "accepted" | "rejected") => {
    const steps = [
      { label: "Proposition envoyée", icon: MessageSquare },
      { label: "Réponse du cuisinier", icon: Bell },
      { label: "Discussion", icon: MessageSquare },
      { label: "Paiement", icon: CreditCard },
    ];
    return steps;
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

      {/* Statistiques rapides */}
      {stats.pending > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {stats.pending} proposition{stats.pending > 1 ? "s" : ""} en attente de réponse
              </p>
              <p className="text-sm text-muted-foreground">
                Les cuisiniers examinent vos propositions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et tri */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">
              Toutes
              {enrichedProposals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  {enrichedProposals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente
              {stats.pending > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                  {stats.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Acceptées
              {stats.accepted > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-600 dark:text-green-400">
                  {stats.accepted}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Refusées
              {stats.rejected > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-600 dark:text-red-400">
                  {stats.rejected}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 bg-card border border-border rounded-xl">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAndSortedProposals.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucune proposition {activeTab === "all" ? "" : activeTab === "pending" ? "en attente" : activeTab === "accepted" ? "acceptée" : "refusée"}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
              {filteredAndSortedProposals.map((proposal, index) => {
                const cook = proposal.cook;
                if (!cook) return null;

                const statusConfig = getStatusConfig(proposal.status);
                const StatusIcon = statusConfig.icon;
                const timelineSteps = getTimelineSteps(proposal.status);

                return (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Photo du cuisinier */}
                      <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-border">
                        {cook.avatarUrl ? (
                          <Image
                            src={cook.avatarUrl}
                            alt={cook.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ChefHat className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-cera text-xl font-bold text-foreground">
                                {cook.name}
                              </h3>
                              {cook.rating && (
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                                  ⭐ {cook.rating.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Proposition envoyée le {formatDate(proposal.createdAt)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color} flex items-center gap-1.5`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {/* Timeline du flux */}
                        {statusConfig.step > 0 && (
                          <div className="mb-4 p-4 bg-accent/50 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground">Progression du flux</span>
                              <span className="text-xs text-muted-foreground">
                                Étape {statusConfig.step} sur {statusConfig.totalSteps}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {timelineSteps.map((step, stepIndex) => {
                                const stepNumber = stepIndex + 1;
                                const isCompleted = stepNumber <= statusConfig.step;
                                const isCurrent = stepNumber === statusConfig.step;
                                const StepIcon = step.icon;
                                
                                return (
                                  <div key={stepNumber} className="flex items-center flex-1">
                                    <div className="flex items-center gap-2 flex-1">
                                      <div
                                        className={`
                                          w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                                          ${isCompleted
                                            ? "bg-green-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                          }
                                          ${isCurrent ? "ring-2 ring-green-500 ring-offset-2" : ""}
                                        `}
                                      >
                                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                                      </div>
                                      {stepNumber < timelineSteps.length && (
                                        <div
                                          className={`flex-1 h-1 rounded-full transition-all ${
                                            isCompleted ? "bg-green-500" : "bg-muted"
                                          }`}
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              {timelineSteps.map((step, stepIndex) => (
                                <span key={stepIndex} className="flex-1 text-center truncate">
                                  {step.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

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

                        {/* Actions contextuelles */}
                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                          {proposal.status === "accepted" && (
                            <>
                              {proposal.conversationId && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Link href={`/dashboard/client/messages?cook=${proposal.cookId}&booking=${proposal.bookingId || ''}`}>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Discuter
                                  </Link>
                                </Button>
                              )}
                              {proposal.bookingId && (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                >
                                  <Link href={`/dashboard/client/bookings/${proposal.bookingId}`}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Voir la réservation
                                  </Link>
                                </Button>
                              )}
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                              >
                                <Link href={`/dashboard/client/cooks/${proposal.cookId}`}>
                                  <ChefHat className="w-4 h-4 mr-2" />
                                  Voir le profil
                                </Link>
                              </Button>
                            </>
                          )}
                          {proposal.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-muted-foreground"
                                disabled
                              >
                                <Hourglass className="w-4 h-4 mr-2 animate-spin" />
                                En attente de réponse...
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                              >
                                <Link href={`/dashboard/client/cooks/${proposal.cookId}`}>
                                  <ChefHat className="w-4 h-4 mr-2" />
                                  Voir le profil
                                </Link>
                              </Button>
                            </>
                          )}
                          {proposal.status === "rejected" && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                            >
                              <Link href={`/dashboard/client/cooks`}>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Trouver un autre cuisinier
                              </Link>
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

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="date">Date</option>
            <option value="cook">Cuisinier</option>
            <option value="budget">Budget</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
