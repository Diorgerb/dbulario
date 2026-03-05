import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import MainLayout from "@/components/MainLayout";

export default function NotFound() {
  return (
    <MainLayout>
      <section className="w-full py-24 flex items-center justify-center">
        <div className="container text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-foreground">Página Não Disponível</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Desculpe, ainda estamos trabalhando nessa página!.
          </p>
          <Link href="/">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Home
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
