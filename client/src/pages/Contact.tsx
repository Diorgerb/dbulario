import { Mail, Phone, Linkedin, Github } from "lucide-react";
import MainLayout from "@/components/MainLayout";

export default function Contact() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
            Fala Comigo!
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Dúvidas, sugestões ou feedback sobre a plataforma?
            Entre em contato por um dos canais abaixo.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="w-full py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Email */}
            <div className="p-6 bg-card border border-border rounded-lg text-center">
              <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Email
              </h3>
              <p className="text-muted-foreground mb-4">
                Canal direto para contato
              </p>
              <a
                href="mailto:diorgerb@gmail.com"
                className="text-primary hover:text-primary/80 underline font-medium"
              >
                diorgerb@gmail.com
              </a>
            </div>

            {/* Phone */}
            <div className="p-6 bg-card border border-border rounded-lg text-center">
              <Phone className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Telefone
              </h3>
              <p className="text-muted-foreground mb-4">
                Contato direto
              </p>
              <a
                href="tel:+553199772268"
                className="text-primary hover:text-primary/80 underline font-medium"
              >
                (31) 99772-2268
              </a>
            </div>

            {/* LinkedIn */}
            <div className="p-6 bg-card border border-border rounded-lg text-center">
              <Linkedin className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                LinkedIn
              </h3>
              <p className="text-muted-foreground mb-4">
                Conexão profissional
              </p>
              <a
                href="https://www.linkedin.com/in/diorgerbretas/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline font-medium"
              >
                linkedin.com/in/diorgerbretas
              </a>
            </div>

            {/* GitHub */}
            <div className="p-6 bg-card border border-border rounded-lg text-center">
              <Github className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                GitHub
              </h3>
              <p className="text-muted-foreground mb-4">
                Código e evolução do projeto
              </p>
              <a
                href="https://github.com/Diorgerb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline font-medium"
              >
                github.com/Diorgerb
              </a>
            </div>
          </div>
        </div>
      </section>


    </MainLayout>
  );
}
