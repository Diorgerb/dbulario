import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Database, Zap } from "lucide-react";
import { Link } from "wouter";
import MainLayout from "@/components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
                Monitoramento Bulário de Medicamentos
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Plataforma para monitoramento, consolidação e consulta estruturada
                de informações oficiais de bulas de medicamentos publicadas no Bulário Eletrônico ANVISA.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/medicamentos">
                  <Button size="lg" className="gap-2">
                    Acessar Base de Medicamentos
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/sobre">
                  <Button size="lg" variant="outline">
                    Conheça a Plataforma
                  </Button>
                </Link>
              </div>
            </div>

            {/* Logo */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-64 h-64 bg-primary/10 rounded-2xl flex items-center justify-center">
                <img
                  src="/logo2.png"
                  alt="Logo da plataforma"
                  className="max-w-[200px] max-h-[200px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Recursos da Plataforma
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramenta desenvolvida para apoiar pesquisa técnica,
              análise regulatória e acompanhamento sistemático de bulas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "Base Consolidada e Estruturada",
                description:
                  "Centralização de informações de bulas com organização padronizada e foco em consistência de dados.",
              },
              {
                icon: Zap,
                title: "Pesquisa Técnica Avançada",
                description:
                  "Busca otimizada por nome do medicamento, número de registro, categoria e data de atualização.",
              },
              {
                icon: CheckCircle2,
                title: "Confiabilidade e Neutralidade",
                description:
                  "Conteúdo proveniente exclusivamente de fontes públicas oficiais, preservando integridade e fidelidade.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
                >
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Consulte, analise e acompanhe.
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Utilize nossa base de dados estruturada para apoiar decisões técnicas,
            estudos regulatórios e acompanhamento contínuo de bulas de medicamentos.
          </p>
          <Link href="/medicamentos">
            <Button size="lg" variant="secondary" className="gap-2">
              Acessar Base de Medicamentos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
