"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Star, MessageSquare, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockCooks } from "@/mockData";

interface PropositionsModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Mock data - À remplacer par les vraies données
const mockPropositions = [
  {
    id: "1",
    cookId: mockCooks[0].id,
    cook: mockCooks[0],
    price: 150,
    message: "Je serais ravie de cuisiner pour vous ce week-end. J'ai une expérience de 10 ans en cuisine française.",
    availability: "Disponible",
    proposedDate: "2024-01-20",
  },
  {
    id: "2",
    cookId: mockCooks[1].id,
    cook: mockCooks[1],
    price: 180,
    message: "Parfait pour votre dîner romantique ! Je peux préparer un menu sur-mesure selon vos goûts.",
    availability: "Disponible",
    proposedDate: "2024-01-20",
  },
  {
    id: "3",
    cookId: mockCooks[2].id,
    cook: mockCooks[2],
    price: 200,
    message: "Spécialiste en cuisine gastronomique, je vous propose une expérience culinaire exceptionnelle.",
    availability: "Disponible",
    proposedDate: "2024-01-20",
  },
];

/**
 * Modal affichant les propositions reçues pour une demande
 */
export function PropositionsModal({
  requestId,
  isOpen,
  onClose,
}: PropositionsModalProps) {
  const [selectedProposition, setSelectedProposition] = useState<string | null>(null);

  const handleAccept = async (propositionId: string) => {
    // TODO: Appel API pour accepter la proposition
    console.log("Accepter proposition:", propositionId);
    setSelectedProposition(propositionId);
  };

  const handleReject = async (propositionId: string) => {
    // TODO: Appel API pour refuser la proposition
    console.log("Refuser proposition:", propositionId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-cera text-2xl font-bold text-foreground">
                  Propositions reçues
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Liste des propositions */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {mockPropositions.map((proposition, index) => (
                  <motion.div
                    key={proposition.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`
                      border rounded-xl p-6 transition-all
                      ${
                        selectedProposition === proposition.id
                          ? "border-green-500 bg-green-500/10"
                          : "border-border hover:border-blue-500/50"
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Photo du cuisinier */}
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
                        {proposition.cook.avatarUrl ? (
                          <Image
                            src={proposition.cook.avatarUrl}
                            alt={proposition.cook.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-2xl">👨‍🍳</span>
                          </div>
                        )}
                      </div>

                      {/* Détails */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">
                              {proposition.cook.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium text-foreground">
                                  {proposition.cook.rating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ({proposition.cook.reviewCount} avis)
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">
                              {proposition.price} €
                            </p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-muted-foreground mb-4">
                          {proposition.message}
                        </p>

                        {/* Spécialités */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {proposition.cook.specialties.slice(0, 3).map((specialty) => (
                            <span
                              key={specialty}
                              className="px-2 py-1 text-xs rounded-full bg-accent text-foreground"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>

                        {/* Disponibilité */}
                        <p className="text-sm text-muted-foreground mb-4">
                          <span className="font-medium">Disponibilité :</span>{" "}
                          {proposition.availability}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              // TODO: Ouvrir la messagerie
                              console.log("Contacter le chef:", proposition.cookId);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contacter le chef
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleReject(proposition.id)}
                          >
                            <XIcon className="w-4 h-4 mr-2" />
                            Refuser
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAccept(proposition.id)}
                            disabled={selectedProposition === proposition.id}
                          >
                            {selectedProposition === proposition.id ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Acceptée
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Accepter
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

