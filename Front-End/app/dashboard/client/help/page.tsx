"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, BookOpen } from "lucide-react";

export default function ClientHelpPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground">
          Centre d&apos;aide
        </h1>
        <p className="text-muted-foreground">
          Retrouver les réponses aux questions fréquentes et les ressources pour profiter au mieux de COOK‑US.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Contacter le support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Une question urgente ? Écrivez‑nous et notre équipe vous répond sous 24&nbsp;heures ouvrées.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="mailto:support@cook-us.fr">support@cook-us.fr</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
              Assistance en direct
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Démarrez une conversation avec un conseiller pour suivre vos réservations ou vos paiements.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/client/support">Ouvrir le support</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Documentation client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Consultez nos guides pas à pas : réservation d&apos;un chef, gestion des paiements et suivi des avis.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="https://docs.cook-us.fr" target="_blank">
                Consulter la documentation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

