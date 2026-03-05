import { CheckCircle2, Database, FileText, Users } from "lucide-react";
import MainLayout from "@/components/MainLayout";

export default function About() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
            Sobre o DBULÁRIO
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Conheça a SUA plataforma de monitoramento do Bulário Eletrônico de medicamentos.
          </p>
        </div>
      </section>




{/* Technical Positioning Section */}
<section className="w-full py-16 md:py-24">
  <div className="container">
    <div className="grid md:grid-cols-2 gap-14 items-center">

      {/* Texto técnico */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-foreground">
         O que é o DBULÁRIO?
        </h2>

        <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
          O DBULÁRIO é uma plataforma técnica voltada à consolidação,
          organização e monitoramento de informações oficiais de bulas de
          medicamentos registrados no Brasil.
        </p>

        <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
          Enquanto a consulta direta ao Bulário Eletrônico da ANVISA exige
          navegação individual por páginas e registros isolados, o DBULÁRIO
          agrega essas informações em uma base estruturada, permitindo visão
          global e acompanhamento sistemático das atualizações.
        </p>

        <p className="text-lg text-muted-foreground leading-relaxed">
          O diferencial da plataforma está na transformação de informações
          públicas dispersas em um conjunto técnico organizado, rastreável e
          pesquisável, sem alteração
          do conteúdo originalmente publicado.
        </p>
      </div>

      {/* Destaque visual */}
      <div className="hidden md:flex items-center justify-center">
        <img
          src="/logo2.png"
          alt="Logo DBULÁRIO"
          className="w-52 h-52 object-contain"
        />
      </div>

    </div>
  </div>
</section>


      {/* Methodology Section */}
      <section className="w-full py-16 md:py-24 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-foreground">Metodologia</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card p-8 rounded-lg border border-border">
              <FileText className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Coleta de Dados</h3>
              <p className="text-muted-foreground mb-4">
                Os dados são coletados automaticamente do Bulário Eletrônico da ANVISA, que é a fonte oficial de informações sobre bulas de medicamentos registrados no Brasil.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Atualização automática diária</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Rastreamento de alterações</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Histórico completo de atualizações</span>
                </li>
              </ul>
            </div>

            <div className="bg-card p-8 rounded-lg border border-border">
              <Database className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Processamento</h3>
              <p className="text-muted-foreground mb-4">
                Os dados são processados, estruturados e indexados para permitir buscas rápidas e filtros avançados.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Estruturação em banco de dados</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Indexação para busca rápida</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Validação de integridade</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-card p-8 rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Frequência de Atualização</h3>
            <p className="text-muted-foreground mb-4">
              A plataforma é atualizada automaticamente todos os dias, sincronizando com os dados mais recentes do Bulário Eletrônico da ANVISA. Notificações são enviadas quando novas atualizações são detectadas (sob demanda).
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">24h</div>
                <p className="text-sm text-muted-foreground">Ciclo de atualização</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">Real-time</div>
                <p className="text-sm text-muted-foreground">Notificações de mudanças</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">100%</div>
                <p className="text-sm text-muted-foreground">Fidelidade aos dados</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Values Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-foreground">Nossos Valores</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Transparência",
                description: "Operamos com total clareza sobre nossas fontes, metodologia e limitações.",
              },
              {
                title: "Neutralidade",
                description: "Apresentamos dados de forma objetiva, sem vieses comerciais ou políticos.",
              },
              {
                title: "Acessibilidade",
                description: "Tornamos dados públicos facilmente acessíveis a todos, sem barreiras.",
              },
              {
                title: "Qualidade",
                description: "Mantemos altos padrões de precisão, integridade e confiabilidade dos dados.",
              },
              {
                title: "Independência",
                description: "Operamos de forma independente, sem vínculo com órgãos reguladores.",
              },
              {
                title: "Segurança",
                description: "Protegemos dados e privacidade com as melhores práticas de segurança.",
              },
            ].map((value, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


{/* Team Section */}
<section className="w-full py-16 md:py-24 bg-muted/30">
  <div className="container">
    <h2 className="text-3xl font-bold mb-12 text-foreground">Equipe</h2>

    <div className="grid md:grid-cols-2 gap-8">
      {/* Team Overview */}
      <div className="bg-card p-8 rounded-lg border border-border">
        <Users className="w-8 h-8 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-4 text-foreground">
          A Equipe DBULÁRIO
        </h3>

        <p className="text-muted-foreground mb-4">
          O DBULÁRIO conta com uma equipe altamente especializada, extremamente
          alinhada e com comunicação interna impecável. Reuniões são rápidas,
          decisões são unânimes e divergências são resolvidas no mesmo minuto.
        </p>

        <p className="text-muted-foreground mb-4">
  Nosso modelo de negócio é enxuto e totalmente centralizado: sem burocracias, sem reuniões intermináveis e com decisões que acontecem na velocidade da razão.
</p>


        <p className="text-muted-foreground">
        Sim , esse foi o jeito mais profissional de dizer que tudo foi feito
        por uma única pessoa.
        </p>
      </div>

      {/* Personal Profile */}
      <div className="bg-card p-8 rounded-lg border border-border">
        <h3 className="text-xl font-semibold mb-4 text-foreground">
          Quem está por trás do projeto
        </h3>

        <p className="text-muted-foreground mb-4">
          Meu nome é <strong>Diorger Bretas</strong>. Sou farmacêutico,
          analista de assuntos regulatórios e trabalho diariamente com dados,
          normas e documentos técnicos que exigem precisão, rastreabilidade
          e atualização constante.
        </p>

        <p className="text-muted-foreground mb-4">
          Paralelamente à atuação regulatória, desenvolvi uma forte afinidade
          com programação e análise de dados. O DBULÁRIO surgiu exatamente
          desse cruzamento: aplicar tecnologia para organizar, monitorar e
          tornar acessíveis informações regulatórias que já são públicas,
          mas pouco estruturadas.
        </p>

        <p className="text-muted-foreground mb-6">
          Cada linha de código, critério de filtragem e atualização automática
          foi pensada para manter fidelidade às fontes oficiais, sem interpretações,
          opiniões ou simplificações indevidas.
        </p>

        <a
          href="https://www.linkedin.com/in/diorgerbretas/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline font-medium"
        >
          Conecte-se comigo no LinkedIn →
        </a>
      </div>
    </div>
  </div>
</section>






    </MainLayout>
  );
}
