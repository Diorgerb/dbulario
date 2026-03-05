import { ChevronDown } from "lucide-react";
import { useState } from "react";
import MainLayout from "@/components/MainLayout";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

 const faqs: FAQItem[] = [
  {
    question: "Qual é a finalidade técnica da plataforma DBULÁRIO?",
    answer:
      "O DBULÁRIO é uma plataforma voltada à consolidação, organização e consulta estruturada de informações públicas sobre bulas de medicamentos registrados no Brasil. Atua como um agregador técnico do Bulário Eletrônico da ANVISA, permitindo visualização centralizada, rastreabilidade de atualizações e análise comparativa de dados que, na fonte original, estão distribuídos página a página.",
  },
  {
    question: "O DBULÁRIO é uma iniciativa da ANVISA?",
    answer:
      "Não. O DBULÁRIO não possui qualquer vínculo institucional com a ANVISA. Trata-se de um projeto independente que utiliza exclusivamente informações públicas disponibilizadas pela Agência. Para fins regulatórios, legais ou decisórios oficiais, a fonte primária deve ser sempre o Bulário Eletrônico da ANVISA.",
  },
  {
    question: "Qual é a origem e a natureza dos dados apresentados na plataforma?",
    answer:
      "Todos os dados são coletados a partir do Bulário Eletrônico da ANVISA, fonte oficial de publicação de bulas de medicamentos no Brasil. O DBULÁRIO não altera ou complementa o conteúdo original, limitando-se à consolidação, estruturação e apresentação das informações.",
  },
  {
    question: "Qual é a periodicidade de sincronização das informações?",
    answer:
      "A plataforma executa rotinas automáticas de sincronização diária com o Bulário Eletrônico da ANVISA. Sempre que novas publicações ou atualizações são identificadas, elas passam a compor a base consolidada do DBULÁRIO.",
  },
  {
    question: "Quais problemas operacionais do Bulário Eletrônico o DBULÁRIO busca mitigar?",
    answer:
      "O DBULÁRIO mitiga limitações de navegação e análise do Bulário Eletrônico, como a necessidade de consulta individualizada de registros. A plataforma permite acompanhamento simultâneo de múltiplos medicamentos, identificação rápida de atualizações e análise estruturada de informações regulatórias.",
  },
  {
    question: "Quais critérios de busca e filtragem estão disponíveis?",
    answer:
      "As consultas podem ser realizadas por nome do medicamento, número de registro e data de atualização, permitindo recortes técnicos e análises direcionadas conforme a necessidade do usuário.",
  },
  {
    question: "É possível implementar alertas e notificações de alterações regulatórias?",
    answer:
      "Sim. Alertas de atualizações de bulas, notificações direcionadas e acompanhamento contínuo de medicamentos específicos podem ser disponibilizados caso a caso, sob demanda, mediante avaliação técnica. Para mais informações, entre em contato.",
  },
  {
    question: "A plataforma permite a criação de listas técnicas personalizadas de medicamentos?",
    answer:
      "Sim. A criação de listas personalizadas de medicamentos de referência para monitoramento contínuo pode ser disponibilizada sob demanda, conforme o escopo técnico e a necessidade do usuário ou da instituição. Para mais informações, entre em contato.",
  },
  {
    question: "Quais opções de exportação de dados estão disponíveis?",
    answer:
      "Exportações de dados estruturados, incluindo recortes por filtros, listas técnicas ou períodos específicos, podem ser disponibilizadas sob demanda em formatos como CSV, Excel ou JSON, conforme avaliação prévia. Para mais informações, entre em contato.",
  },
  {
    question: "Como é garantida a integridade e a fidelidade dos dados?",
    answer:
      "A integridade é assegurada pela utilização exclusiva de fontes públicas oficiais e pela aplicação de validações automáticas que preservam a correspondência entre os dados consolidados e o conteúdo original publicado pela ANVISA.",
  },

  {
    question: "Como inconsistências ou divergências podem ser reportadas?",
    answer:
      "Eventuais inconsistências, falhas de consolidação ou sugestões de melhoria podem ser reportadas por meio do formulário de contato da plataforma, contribuindo para a evolução contínua do sistema.",
  },
 
  {
    question: "Como são tratados dados pessoais e informações de usuários?",
    answer:
      "O DBULÁRIO adota práticas de segurança da informação e proteção de dados pessoais em conformidade com a legislação aplicável.",
  },
];


  return (
    <MainLayout>
      {/* Hero */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
            Perguntas Frequentes
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Encontre respostas para as dúvidas mais comuns sobre o DBULÁRIO.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-border rounded-lg overflow-hidden bg-card transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-${index}`}
                >
                  <h3 className="font-semibold text-foreground pr-4">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openIndex === index && (
                  <div
                    id={`faq-${index}`}
                    className="px-6 py-4 border-t border-border bg-muted/30"
                  >
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional Help */}
          <div className="mt-16 p-8 bg-primary/5 border border-primary/20 rounded-lg text-center">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              Não encontrou sua resposta?
            </h3>

            <p className="text-muted-foreground mb-6">
              Caso ainda tenha dúvidas ou queira falar diretamente sobre a plataforma,
              acesse a página de contato.
            </p>

            <div className="flex justify-center">
              <a
                href="/contato"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Contato!
              </a>
            </div>
          </div>

        </div>
      </section>
    </MainLayout>
  );
}
