import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sparkles, Users, ChefHat, Leaf } from "lucide-react";

const pillars = [
  {
    title: "Art Culinaire",
    description:
      "Nous révélons les talents culinaires locaux et mettons en lumière des cuisiniers passionnés, prêts à transformer chaque repas en expérience gastronomique.",
    icon: ChefHat,
    gradient: "from-orange-400/80 via-pink-400/70 to-red-400/70",
  },
  {
    title: "Communauté",
    description:
      "Chefs, amateurs de bonne cuisine et partenaires : nous fédérons une communauté bienveillante pour partager des instants de convivialité et de transmission.",
    icon: Users,
    gradient: "from-blue-400/80 via-cyan-400/70 to-sky-400/70",
  },
  {
    title: "Durabilité",
    description:
      "Des circuits courts, des produits de saison et une démarche responsable pour respecter la planète tout en ravissant les papilles.",
    icon: Leaf,
    gradient: "from-emerald-400/80 via-teal-400/70 to-green-400/70",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background/70 to-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3 space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold w-fit">
                <Sparkles className="w-4 h-4" />
                L’excellence culinaire à domicile
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                COOK US, la maison des chefs passionnés et des expériences uniques
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Nous imaginons une nouvelle manière de savourer la gastronomie : humaine,
                accessible et durable. COOK US accompagne chaque moment, de
                l’inspiration à la dégustation, pour faire de votre table le plus beau des restaurants.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                {[
                  { label: "Chefs certifiés", value: "+80" },
                  { label: "Moments partagés", value: "2 500+" },
                  { label: "Villes couvertes", value: "15" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 shadow-sm"
                  >
                    <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="relative rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/5" />
                <div className="relative p-8 space-y-6">
                  <div className="rounded-2xl border border-border/50 bg-background/70 p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Notre manifeste
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      Nous croyons que la cuisine est un langage universel qui rassemble,
                      soigne et émerveille. En racontant des histoires à travers chaque plat,
                      nous ré-enchantons la gastronomie locale et créons des souvenirs à savourer.
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {pillars.map((pillar) => (
                      <div
                        key={pillar.title}
                        className="relative rounded-2xl border border-border/40 bg-background/60 p-5 overflow-hidden"
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${pillar.gradient} opacity-60 blur-xl`}
                        />
                        <div className="relative flex items-start gap-4">
                          <div className="rounded-full bg-background/80 border border-border/40 p-2">
                            <pillar.icon className="w-5 h-5 text-foreground" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {pillar.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {pillar.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="relative p-10 space-y-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent" />
              <div className="relative space-y-6">
                <h2 className="text-3xl font-semibold text-foreground">
                  Ce qui nous anime au quotidien
                </h2>
                <ul className="space-y-4 text-muted-foreground leading-relaxed">
                  <li>
                    • Mettre en lumière des talents culinaires locaux et leur offrir
                    des outils modernes pour gérer leur activité.
                  </li>
                  <li>
                    • Simplifier l’organisation d’événements gastronomiques à domicile
                    pour les particuliers et entreprises.
                  </li>
                  <li>
                    • Construire une gastronomie responsable, respectueuse des saisons
                    et des producteurs.
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
              <div className="absolute inset-0 bg-[url('/images/chef-feminin-versant-soigneusement-la-sauce-sur-le-plat.jpg')] bg-cover bg-center opacity-30" />
              <div className="relative h-full w-full flex items-center justify-center p-10">
                <div className="rounded-3xl border border-white/20 bg-white/20 dark:bg-black/30 backdrop-blur-3xl p-8 text-center max-w-sm">
                  <p className="text-lg font-medium text-white dark:text-white/90 leading-relaxed">
                    «&nbsp;Chez COOK US, la cuisine devient un moment à vivre, un univers à
                    partager, un souvenir à chérir.&nbsp;»
                  </p>
                  <p className="mt-4 text-sm text-white/70 uppercase tracking-widest">
                    L’équipe COOK US
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

