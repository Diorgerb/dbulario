import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-semibold text-lg mb-4">DBULÁRIO</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Plataforma para divulgação de dados públicos sobre atualizações de bulas de medicamentos.
            </p>
      
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-primary hover:text-primary/80 transition-colors">
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link href="/medicamentos" className="text-primary hover:text-primary/80 transition-colors">
                  Medicamentos
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="text-primary hover:text-primary/80 transition-colors">
                  Sobre o Projeto
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-primary hover:text-primary/80 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacidade" className="text-primary hover:text-primary/80 transition-colors">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-primary hover:text-primary/80 transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/acessibilidade" className="text-primary hover:text-primary/80 transition-colors">
                  Acessibilidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="diorgerb@gmail.com"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  diorgerb@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/diorgerbretas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Linkedin
                </a>
              
          
              </li>
            </ul>
          </div>
        </div>

        

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col items-center gap-4 text-xs text-muted-foreground text-center">
          <p>
            © {currentYear} DBULÁRIO. Todos os direitos reservados.
          </p>
            

        </div>
      </div>
    </footer>
  );
}
