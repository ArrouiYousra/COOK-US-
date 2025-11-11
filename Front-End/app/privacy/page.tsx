import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Lock, Shield, KeyRound } from "lucide-react";

const commitments = [
  {
    title: "Collecte raisonnée",
    content:
      "Nous recueillons uniquement les informations essentielles au fonctionnement de la plateforme : profil, préférences culinaires, historiques de réservations et communications avec les chefs.",
  },
  {
    title: "Sécurité renforcée",
    content:
      "Vos données sont hébergées en Europe et protégées par des mesures de chiffrement lors du stockage et du transfert. Nos prestataires sont conformes au RGPD.",
  },
  {
    title: "Contrôle utilisateur",
    content:
      "Vous gardez la main sur vos informations : export, modification ou suppression sur simple demande à privacy@cookus.fr.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background/75 to-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 blur-3xl" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
              <Shield className="w-4 h-4" />
              Protection des données
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Politique de confidentialité COOK US
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Votre confiance est notre priorité. Découvrez comment nous collectons, utilisons
              et protégeons vos données personnelles afin de vous assurer une expérience
              culinaire sereine.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          <div className="space-y-6">
            {commitments.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-lg p-8 space-y-3"
              >
                <h2 className="text-2xl font-semibold text-foreground">{item.title}</h2>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {item.content}
                </p>
              </div>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 shadow-xl p-8 space-y-4">
              <Lock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xl font-semibold text-foreground">Conformité RGPD</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                COOK US agit en qualité de responsable de traitement. Conformément au
                Règlement (UE) 2016/679, nous tenons un registre des traitements et limitons
                la durée de conservation des données.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xl p-8 space-y-4">
              <KeyRound className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-foreground">Exercer vos droits</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                • Droit d’accès et de rectification<br />
                • Droit à l’effacement (« droit à l’oubli »)<br />
                • Droit à la portabilité des données<br />
                • Droit d’opposition et de limitation<br />
              </p>
              <p className="text-sm font-medium text-foreground">privacy@cookus.fr</p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

