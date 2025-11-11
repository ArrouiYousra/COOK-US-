"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateRequestForm } from "./CreateRequestForm";

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal pour créer une nouvelle demande
 */
export function CreateRequestModal({ isOpen, onClose }: CreateRequestModalProps) {
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
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-cera text-2xl font-bold text-foreground">
                  Créer une nouvelle demande
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

              {/* Formulaire */}
              <div className="p-6">
                <CreateRequestForm 
                  onSuccess={async () => {
                    // Attendre un peu pour que la base de données soit à jour
                    await new Promise(resolve => setTimeout(resolve, 500));
                    onClose();
                    // Forcer un rechargement de la page pour afficher la nouvelle demande
                    window.location.reload();
                  }} 
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

