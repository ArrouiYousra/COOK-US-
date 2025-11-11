import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, ScrollText, Handshake } from "lucide-react";

const sections = [
  {
    title: "1. Objet du service",
    content:
      "COOK US propose une plateforme de mise en relation entre clients et cuisiniers indépendants. Notre rôle est de faciliter la découverte des talents, d’offrir une interface de réservation sécurisée et d’accompagner les parties prenantes jusqu’à la réalisation de la prestation.",
  },
  {
    title: "2. Création de compte",
    content:
      "L’utilisateur s’engage à fournir des informations exactes et à jour lors de l’inscription. Tout compte est personnel, non transférable, et doit être utilisé conformément aux lois en vigueur.",
  },
  {
    title: "3. Processus de réservation",
    content:
      "La mise en relation est soumise à validation mutuelle. Les conditions (tarifs, horaires, options supplémentaires) sont précisées avant la confirmation. Une fois acceptée, la réservation est régie par la politique d’annulation indiquée.",
  },
  {
    title: "4. Responsabilités",
    content:
      "Les cuisiniers demeurent indépendants ; ils assurent personnellement la prestation et le respect des normes sanitaires. COOK US ne pourra être tenue responsable du déroulement d’un événement en dehors d’un manquement avéré à ses obligations d’intermédiaire.",
  },
  {
    title: "5. Paiement sécurisé",
    content:
      "Le règlement est effectué via notre prestataire de paiement certifié. Les fonds sont transférés au cuisinier après la réalisation de la prestation, déduction faite des frais de service convenus.",
  },
  {
    title: "6. Modifications des conditions",
    content:
      "Nous nous réservons la possibilité d’actualiser les présentes conditions pour accompagner l’évolution de nos services. Les utilisateurs sont notifiés de toute modification substantielle.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background/80 to-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-400/10 blur-3xl" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Transparence & confiance
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Conditions générales d’utilisation
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ces conditions encadrent l’utilisation de la plateforme COOK US. Elles sont
              pensées pour instaurer un climat de confiance entre chefs, clients et
              partenaires. En naviguant sur notre site ou en créant un compte, vous
              confirmez accepter ces dispositions.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-10">
          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section.title}
                className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent dark:from-white/0" />
                <div className="relative p-8 space-y-3">
                  <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 shadow-xl p-8 space-y-4">
              <ScrollText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-foreground">Version en vigueur</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Mise à jour le <strong className="text-foreground">11 novembre 2025</strong>.
                Nous recommandons de consulter cette page régulièrement pour rester informé
                des éventuelles évolutions.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xl p-8 space-y-4">
              <Handshake className="w-10 h-10 text-emerald-500" />
              <h3 className="text-xl font-semibold text-foreground">Besoin d’éclaircissements&nbsp;?</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Notre équipe juridique reste disponible pour répondre à vos questions et
                vous accompagner dans vos démarches.
              </p>
              <p className="text-sm font-medium text-foreground">legal@cookus.fr</p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

