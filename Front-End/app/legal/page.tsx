import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Building2, UserCheck, Server, BadgeCheck } from "lucide-react";

const informations = [
  {
    title: "COOK US SAS",
    details: [
      "12 rue des Gourmands, 75000 Paris",
      "SIRET : 902 458 321 00027",
      "Capital social : 120 000 €",
      "contact@cookus.fr",
    ],
    icon: Building2,
    gradient: "from-orange-500/15 via-pink-500/15 to-red-500/15",
  },
  {
    title: "Directrice de la publication",
    details: ["Léa Martin", "lea.martin@cookus.fr"],
    icon: UserCheck,
    gradient: "from-blue-500/15 via-sky-500/15 to-cyan-500/15",
  },
  {
    title: "Hébergement",
    details: [
      "Vercel Inc.",
      "440 N Barranca Ave #4133",
      "Covina, CA 91723, USA",
      "support@vercel.com",
    ],
    icon: Server,
    gradient: "from-purple-500/15 via-violet-500/15 to-indigo-500/15",
  },
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background/70 to-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-400/10 blur-3xl" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold">
              <BadgeCheck className="w-4 h-4" />
              Transparence & conformité
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Mentions légales de COOK US
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Retrouvez toutes les informations officielles concernant l’éditeur, la
              direction de la publication et l’hébergement de la plateforme COOK US.
              Nous mettons un point d’honneur à respecter vos droits et la législation.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {informations.map((info) => (
            <div
              key={info.title}
              className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-xl overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${info.gradient}`} />
              <div className="relative p-8 space-y-4">
                <info.icon className="w-9 h-9 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">{info.title}</h2>
                <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                  {info.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

