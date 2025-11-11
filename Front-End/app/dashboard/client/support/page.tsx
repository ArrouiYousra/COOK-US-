"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, LifeBuoy, FileText } from "lucide-react";

const businessHours = [
  { day: "Lundi", hours: "09h00 – 18h00" },
  { day: "Mardi", hours: "09h00 – 18h00" },
  { day: "Mercredi", hours: "09h00 – 18h00" },
  { day: "Jeudi", hours: "09h00 – 18h00" },
  { day: "Vendredi", hours: "09h00 – 17h00" },
];

export default function ClientSupportPage() {
  const today = useMemo(() => new Date().toLocaleDateString("fr-FR", { weekday: "long" }), []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground">
          Assistance COOK‑US
        </h1>
        <p className="text-muted-foreground">
          Bénéficiez d’un point de contact unique pour vos réservations, paiements et relations avec les chefs.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LifeBuoy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Canaux prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-300" />
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p>support@cook-us.fr — réponse garantie sous 24&nbsp;heures ouvrées.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-300" />
                <div>
                  <p className="font-medium text-foreground">Ligne dédiée</p>
                  <p>+33 1 86 95 42 10 — du lundi au vendredi, 9h à 18h.</p>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-border/80" />

            <div className="space-y-3">
              <p className="font-medium text-foreground">Avant d&apos;appeler</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>ID de réservation ou de proposition disponible</li>
                <li>Résumé du souci rencontré</li>
                <li>Captures d’écran si nécessaire</li>
              </ul>
            </div>

            <Button asChild>
              <Link href="mailto:support@cook-us.fr?subject=Support%20COOK-US">
                Écrire au support
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Horaires & ressources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              {businessHours.map((entry) => (
                <p
                  key={entry.day}
                  className={`flex justify-between font-medium ${today.toLowerCase() === entry.day.toLowerCase() ? "text-blue-600 dark:text-blue-300" : "text-muted-foreground"}`}
                >
                  <span>{entry.day}</span>
                  <span>{entry.hours}</span>
                </p>
              ))}
            </div>

            <div className="h-px w-full bg-border/80" />

            <div className="space-y-2">
              <p className="font-medium text-foreground">Guides pratiques</p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="https://docs.cook-us.fr" target="_blank">
                  Ouvrir la base de connaissances
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

