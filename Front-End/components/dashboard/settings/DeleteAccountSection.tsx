"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

/**
 * Section "Supprimer mon compte"
 * Permet la suppression définitive du compte avec confirmation
 */
export function DeleteAccountSection() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmationText = "SUPPRIMER";
  const isConfirmed = confirmText === confirmationText;

  const handleDeleteAccount = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    // TODO: Appel API pour supprimer le compte
    // await apiClient.deleteAccount();
    setTimeout(async () => {
      await logout();
      router.push("/");
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-destructive/50 rounded-xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-destructive/10">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div className="flex-1">
          <h3 className="font-cera text-xl font-bold text-foreground mb-2">
            Zone de danger
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            La suppression de votre compte est définitive et irréversible.
            Toutes vos données, réservations et historique seront supprimés
            définitivement.
          </p>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="lg">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer mon compte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Supprimer définitivement votre compte</DialogTitle>
                <DialogDescription>
                  Cette action est irréversible. Toutes vos données seront
                  supprimées.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-semibold mb-2">
                    ⚠️ Attention
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Toutes vos réservations seront annulées</li>
                    <li>Vos messages et conversations seront supprimés</li>
                    <li>Vos avis et évaluations seront supprimés</li>
                    <li>Vos données de paiement seront supprimées</li>
                    <li>Cette action est définitive et irréversible</li>
                  </ul>
                </div>

                <div>
                  <Label htmlFor="confirm-delete">
                    Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      setConfirmText("");
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!isConfirmed || isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
}

