import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Mail, PhoneCall, MessageCircle, MapPin, Clock } from "lucide-react";

const contactChannels = [
  {
    title: "Support général",
    description:
      "Toutes vos questions sur la plateforme, la réservation et l’expérience client.",
    value: "support@cookus.fr",
    icon: Mail,
    accent: "from-blue-500/20 via-blue-400/20 to-blue-300/20",
  },
  {
    title: "Partenariats & presse",
    description: "Vous souhaitez collaborer avec COOK US ou obtenir un dossier media ?",
    value: "partenaires@cookus.fr",
    icon: MessageCircle,
    accent: "from-purple-500/20 via-purple-400/20 to-fuchsia-300/20",
  },
  {
    title: "Ligne dédiée",
    description: "Nos conseillers sont disponibles du lundi au vendredi, de 9h à 18h.",
    value: "+33 1 23 45 67 89",
    icon: PhoneCall,
    accent: "from-emerald-500/20 via-emerald-400/20 to-teal-300/20",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background/80 to-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-400/10 blur-3xl" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold">
              <PhoneCall className="w-4 h-4" />
              Entrons en contact
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Une équipe aux petits soins pour vos projets gourmands
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Besoin d’aide sur la plateforme, d’un accompagnement personnalisé ou d’un partenariat ?
              Nous vous répondons avec la même attention que celle d’un chef pour ses plats.
            </p>
          </div>

          <div className="mt-16 grid lg:grid-cols-3 gap-8">
            {contactChannels.map((channel) => (
              <div
                key={channel.title}
                className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-lg overflow-hidden group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${channel.accent} opacity-70 group-hover:opacity-90 transition-opacity`}
                />
                <div className="relative p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-background/80 border border-border/40 flex items-center justify-center">
                    <channel.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">{channel.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {channel.description}
                  </p>
                  <p className="text-base font-medium text-foreground">{channel.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xl p-8 space-y-6">
            <h3 className="text-2xl font-semibold text-foreground">Nous rencontrer</h3>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Maison COOK US</strong>
                  <br />
                  12 rue des Gourmands, 75000 Paris
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Nous vous accueillons sur rendez-vous pour parler de vos envies et
                  co-construire vos événements gourmands.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  Lundi au vendredi : <strong className="text-foreground">9h – 18h</strong>
                  <br />
                  Le samedi : <strong className="text-foreground">10h – 14h</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Une équipe dédiée vous accompagne pour des projets sur mesure (chefs à
                  domicile, traiteurs, ateliers culinaires…).
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 shadow-xl overflow-hidden">
            <div className="h-72 bg-[url('https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center" />
            <div className="p-8 space-y-4 bg-card/80 backdrop-blur-md">
              <h3 className="text-xl font-semibold text-foreground">Projets sur-mesure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Événement d’entreprise, dîner de fête, chef résident, cours de cuisine :
                confiez-nous votre brief, nous imaginons avec vous une expérience singulière.
              </p>
              <p className="text-sm text-muted-foreground">
                Notre collectif de chefs s’étend dans toute la France et nous collaborons avec
                des artisans rigoureusement sélectionnés.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

