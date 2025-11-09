"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requestTitle: string;
  hasProposals?: boolean;
  proposalCount?: number;
  isDeleting?: boolean;
}

/**
 * Dialog de confirmation de suppression de demande
 * Affiche un avertissement si la demande a des propositions
 */
export function DeleteRequestDialog({
  isOpen,
  onClose,
  onConfirm,
  requestTitle,
  hasProposals = false,
  proposalCount = 0,
  isDeleting = false,
}: DeleteRequestDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Supprimer la demande
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Êtes-vous sûr de vouloir supprimer la demande{" "}
            <span className="font-semibold text-foreground">
              &quot;{requestTitle}&quot;
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        {hasProposals && proposalCount > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Cette demande a reçu {proposalCount} proposition
              {proposalCount > 1 ? "s" : ""}. Les cuisiniers qui ont proposé
              seront notifiés de l&apos;annulation.
            </p>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Toutes les données associées à cette
            demande seront supprimées.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

