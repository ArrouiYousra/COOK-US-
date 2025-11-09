"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CreateRequestForm } from "@/components/dashboard/requests/CreateRequestForm";

function NewRequestContent() {
  const searchParams = useSearchParams();
  const isDuplicate = searchParams.get("duplicate");
  const duplicateData = isDuplicate
    ? {
        title: searchParams.get("title") || "",
        description: searchParams.get("description") || "",
        date: searchParams.get("date") || "",
        timeSlot: searchParams.get("timeSlot") || "",
        guestCount: parseInt(searchParams.get("guestCount") || "0"),
        budget: parseInt(searchParams.get("budget") || "0"),
        address: searchParams.get("address") || "",
      }
    : undefined;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          {isDuplicate ? "Dupliquer une demande" : "Créer une nouvelle demande"}
        </h1>
        <p className="text-muted-foreground">
          {isDuplicate
            ? "Modifiez les informations si nécessaire et publiez votre demande"
            : "Décrivez votre repas idéal et recevez des propositions de cuisiniers"}
        </p>
      </div>
      <CreateRequestForm initialData={duplicateData} />
    </div>
  );
}

/**
 * Page dédiée pour créer une nouvelle demande
 */
export default function NewRequestPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <NewRequestContent />
    </Suspense>
  );
}

