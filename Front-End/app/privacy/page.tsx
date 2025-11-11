"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground">
          Politique de confidentialité
        </h1>
        <p className="text-muted-foreground">
          Cette page décrit la façon dont COOK‑US collecte, utilise et protège vos données personnelles.
        </p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">1. Données collectées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Nous recueillons les informations saisies lors de l&apos;inscription, de la réservation d&apos;un chef,
            de la gestion des paiements ainsi que les échanges via la messagerie intégrée.
          </p>
          <p>
            Des données techniques (adresse IP, logs de connexion) peuvent également être collectées pour des raisons de sécurité.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">2. Finalités des traitements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Vos données nous servent à :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>exécuter le service (réservations, paiements, notifications) ;</li>
            <li>vous accompagner via le support client et la prévention des fraudes ;</li>
            <li>améliorer la plateforme grâce à des statistiques anonymisées.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">3. Droits des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en écrivant à{" "}
            <Link href="mailto:privacy@cook-us.fr" className="text-blue-600 hover:underline dark:text-blue-400">
              privacy@cook-us.fr
            </Link>
            .
          </p>
          <p>
            Pour des détails complets, consultez la version intégrale de notre politique sur{" "}
            <Link href="https://docs.cook-us.fr/privacy" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
              docs.cook-us.fr/privacy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
