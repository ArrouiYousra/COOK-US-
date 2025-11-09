"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF, generateInvoiceNumber, type InvoiceData } from "@/lib/utils/invoice";
import { useAuthStore } from "@/stores/authStore";

interface InvoiceExportProps {
  booking: {
    id: string;
    date: string;
    time: string;
    numberOfGuests: number;
    totalPrice: number;
    specialRequests?: string;
    cookId: string;
    cookName: string;
  };
  cookAddress?: string;
}

/**
 * Composant pour exporter la facture en PDF
 */
export function InvoiceExport({ booking, cookAddress }: InvoiceExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuthStore();

  const handleExport = async () => {
    setIsGenerating(true);

    try {
      // Préparer les données de la facture
      const invoiceData: InvoiceData = {
        bookingId: booking.id,
        bookingDate: new Date().toISOString(),
        cookName: booking.cookName,
        cookAddress: cookAddress || "Adresse non disponible",
        clientName: user
          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Client"
          : "Client",
        clientAddress: user?.address || "Adresse non disponible",
        serviceDate: booking.date,
        serviceTime: booking.time,
        numberOfGuests: booking.numberOfGuests,
        serviceDescription: booking.specialRequests || "Prestation culinaire à domicile",
        subtotal: booking.totalPrice * 0.95, // 95% pour le cuisinier
        platformFee: booking.totalPrice * 0.05, // 5% de frais de plateforme
        totalPrice: booking.totalPrice,
        paymentStatus: "paid", // TODO: Récupérer le vrai statut
        invoiceNumber: generateInvoiceNumber(booking.id),
      };

      // Générer et télécharger le PDF
      generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error("Erreur lors de la génération de la facture:", error);
      alert("Une erreur est survenue lors de la génération de la facture.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Télécharger PDF
        </>
      )}
    </Button>
  );
}

