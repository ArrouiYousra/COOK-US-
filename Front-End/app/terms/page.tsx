"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="text-muted-foreground">
          Les CGU encadrent l&apos;utilisation de la plateforme COOK‑US par les clients et les cuisiniers partenaires.
        </p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">1. Objet du service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            COOK‑US met en relation des particuliers et des chefs indépendants. La plateforme facilite la réservation,
            la coordination logistique et le paiement sécurisé des prestations culinaires.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">2. Engagements des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>Fournir des informations exactes lors de l&apos;inscription et des réservations ;</li>
            <li>Respecter les délais de paiement et les politiques d&apos;annulation ;</li>
            <li>Adopter un comportement respectueux dans la messagerie et lors des prestations.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">3. Litiges et médiation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            En cas de litige, contactez notre support via{" "}
            <Link href="mailto:support@cook-us.fr" className="text-blue-600 hover:underline dark:text-blue-400">
              support@cook-us.fr
            </Link>
            . Une médiation peut être proposée conformément aux dispositions légales en vigueur.
          </p>
          <p>
            Les conditions complètes sont disponibles sur{" "}
            <Link href="https://docs.cook-us.fr/terms" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
              docs.cook-us.fr/terms
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
