import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowRight, Clock3, ExternalLink, FileDiff, Loader2, Search } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type Medication = {
  id: number; name: string; registrationNumber: string;
  holder: string | null; publicationDate: string | null; lastUpdate: string | null;
};
function formatDate(value: string | null | undefined) {
  if (!value) return "Não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
function anvisaUrl(item: Medication) {
  return `https://consultas.anvisa.gov.br/#/bulario/detalhe/${item.id}?numeroRegistro=${encodeURIComponent(item.registrationNumber)}`;
}
function MedicationCard({ item, onCompare }: { item: Medication; onCompare: (item: Medication) => void }) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-foreground break-words">{item.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.holder || "Titular não informado"}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>Registro: <strong className="text-foreground">{item.registrationNumber}</strong></span>
            <span>Atualização do Bulário: <strong className="text-foreground">{formatDate(item.publicationDate)}</strong></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={anvisaUrl(item)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm"><ExternalLink className="mr-1 h-4 w-4" /> ANVISA</Button>
          </a>
          <Button size="sm" onClick={() => onCompare(item)}><FileDiff className="mr-1 h-4 w-4" /> Comparar <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </div>
    </article>
  );
}

export default function BulaCompare() {
  const [, route] = useRoute("/comparar-bulas/:registro");
  const routeRegistration = route?.registro ?? "";
  const [tab, setTab] = useState<"search" | "recent">("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Medication | null>(null);
  const [type, setType] = useState<"vp" | "vps">("vp");
  const [onlyChanges, setOnlyChanges] = useState(true);
  const [comparison, setComparison] = useState<Awaited<ReturnType<ReturnType<typeof trpc.useUtils>["bulaDiff"]["compare"]["fetch"]>> | null>(null);
  const mutation = trpc.bulaDiff.compare.useMutation();
  const search = trpc.medications.list.useQuery({ page: 1, limit: 20, search: query.trim() }, {
    enabled: tab === "search" && query.trim().length >= 2 && !selected,
  });
  const direct = trpc.medications.list.useQuery({ page: 1, limit: 20, numeroRegistro: routeRegistration }, {
    enabled: !!routeRegistration && !selected,
  });
  const recent = trpc.medications.recentUpdates.useQuery({ days: 90 }, { enabled: tab === "recent" && !selected });

  useEffect(() => {
    const exact = direct.data?.items.find(item => item.registrationNumber.replace(/\D/g, "") === routeRegistration.replace(/\D/g, ""));
    if (exact && !selected) setSelected(exact);
  }, [direct.data, routeRegistration, selected]);

  async function compare() {
    if (!selected) return;
    setComparison(null);
    try {
      const result = await mutation.mutateAsync({ idProduto: selected.id, registrationNumber: selected.registrationNumber.replace(/\D/g, ""), type });
      setComparison(result);
    } catch { /* O erro é exibido pela mutation.error. */ }
  }
  function selectMedication(medication: Medication) {
    setSelected(medication);
    setComparison(null);
    mutation.reset();
    setType("vp");
  }
  const visibleSections = comparison?.sections.filter(section => !onlyChanges || section.changed) ?? [];
  return (
    <MainLayout>
      <section className="border-b bg-gradient-to-br from-blue-50 via-background to-background py-12">
        <div className="container space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">DBULÁRIO · Ferramentas</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Comparador de Bulas</h1>
          <p className="max-w-2xl text-muted-foreground">Identifique as alterações entre a bula atual e a última versão com conteúdo diferente, por seção e por palavra.</p>
        </div>
      </section>
      <div className="container space-y-8 py-8">
        {!selected ? (
          <>
            <div className="flex flex-wrap gap-2 border-b pb-4" role="tablist" aria-label="Modo de seleção">
              <Button role="tab" aria-selected={tab === "search"} variant={tab === "search" ? "default" : "outline"} onClick={() => setTab("search")}><Search className="mr-2 h-4 w-4" /> Pesquisar medicamento</Button>
              <Button role="tab" aria-selected={tab === "recent"} variant={tab === "recent" ? "default" : "outline"} onClick={() => setTab("recent")}><Clock3 className="mr-2 h-4 w-4" /> Últimas atualizações</Button>
            </div>
            {tab === "search" ? (
              <section className="space-y-5" aria-label="Pesquisar na base DBULÁRIO">
                <div className="max-w-2xl space-y-2">
                  <label htmlFor="bula-search" className="font-medium">Qual medicamento você quer comparar?</label>
                  <div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" /><Input id="bula-search" className="pl-10" placeholder="Nome, empresa ou número de registro" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" /></div>
                  <p className="text-xs text-muted-foreground">A pesquisa usa a base do DBULÁRIO. A ANVISA só é consultada ao solicitar a comparação.</p>
                </div>
                {direct.isLoading && routeRegistration && <p className="text-sm text-muted-foreground">Buscando registro informado na URL...</p>}
                {direct.error && routeRegistration && <p className="text-sm text-destructive">{direct.error.message}</p>}
                {search.isLoading && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Pesquisando...</p>}
                {search.error && <p className="text-sm text-destructive">{search.error.message}</p>}
                {query.trim().length < 2 && !routeRegistration && <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Digite ao menos dois caracteres para localizar um medicamento.</p>}
                {query.trim().length >= 2 && search.data && <p className="text-sm text-muted-foreground">{search.data.total} medicamento(s) encontrado(s). Exibindo os primeiros 20.</p>}
                <div className="grid gap-3">{(search.data?.items ?? []).map(item => <MedicationCard key={item.id} item={item} onCompare={selectMedication} />)}</div>
                {query.trim().length >= 2 && search.data?.total === 0 && <p className="rounded-lg border p-8 text-center">Nenhum medicamento encontrado. Confira o nome, a empresa ou o registro.</p>}
              </section>
            ) : (
              <section className="space-y-4" aria-label="Últimas atualizações do Bulário">
                <div><h2 className="text-xl font-semibold">Últimas atualizações</h2><p className="text-sm text-muted-foreground">Medicamentos atualizados no Bulário nos últimos 90 dias, conforme a base atual do DBULÁRIO.</p></div>
                {recent.isLoading && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando atualizações...</p>}
                {recent.error && <p className="text-sm text-destructive">{recent.error.message}</p>}
                <div className="grid gap-3">{(recent.data ?? []).map(item => <MedicationCard key={item.id} item={item} onCompare={selectMedication} />)}</div>
                {recent.data?.length === 0 && <p className="rounded-lg border p-8 text-center">Não há atualizações no período consultado.</p>}
              </section>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => { setSelected(null); setComparison(null); mutation.reset(); }}><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Voltar à pesquisa</Button>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-bold">{selected.name}</h2>
              <p className="mt-1 text-muted-foreground">{selected.holder || "Titular não informado"}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm"><span>Registro: <strong>{selected.registrationNumber}</strong></span><span>ID Produto: <strong>{selected.id}</strong></span></div>
              <a href={anvisaUrl(selected)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Abrir detalhe no Bulário ANVISA <ExternalLink className="h-4 w-4" /></a>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant={type === "vp" ? "default" : "outline"} onClick={() => { setType("vp"); setComparison(null); mutation.reset(); }}>Bula do paciente (VP)</Button>
                <Button variant={type === "vps" ? "default" : "outline"} onClick={() => { setType("vps"); setComparison(null); mutation.reset(); }}>Bula profissional (VPS)</Button>
              </div>
              <Button className="mt-5" disabled={mutation.isPending} onClick={compare}>{mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDiff className="mr-2 h-4 w-4" />}{mutation.isPending ? "Consultando ANVISA e comparando..." : `Comparar versões ${type.toUpperCase()}`}</Button>
              {mutation.isPending && <p role="status" className="mt-2 text-xs text-muted-foreground">A primeira comparação pode demorar devido ao download e à extração dos PDFs. As próximas reutilizam o resultado armazenado quando o histórico não mudar.</p>}
              {mutation.error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{mutation.error.message}</div>}
            </div>
            {comparison && (
              <section className="space-y-6" aria-label="Resultado da comparação">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border bg-card p-5"><p className="text-xs font-semibold uppercase text-muted-foreground">Versão anterior</p><p className="mt-2 text-lg font-semibold">{formatDate(comparison.previous.publicationDate)}</p><p className="text-sm text-muted-foreground">Expediente: {comparison.previous.expediente || "Não informado"}</p></div>
                  <div className="rounded-xl border border-primary/30 bg-blue-50 p-5"><p className="text-xs font-semibold uppercase text-primary">Versão atual</p><p className="mt-2 text-lg font-semibold">{formatDate(comparison.current.publicationDate)}</p><p className="text-sm text-muted-foreground">Expediente: {comparison.current.expediente || "Não informado"}</p></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4"><strong className="text-2xl">{comparison.summary.changedSections}</strong><p className="text-xs text-muted-foreground">Seções alteradas</p></div>
                  <div className="rounded-lg border p-4"><strong className="text-2xl text-green-700">+{comparison.summary.addedWords}</strong><p className="text-xs text-muted-foreground">Palavras adicionadas</p></div>
                  <div className="rounded-lg border p-4"><strong className="text-2xl text-red-700">−{comparison.summary.removedWords}</strong><p className="text-xs text-muted-foreground">Palavras removidas</p></div>
                  <div className="rounded-lg border p-4"><strong className="text-2xl">{Math.round(comparison.summary.similarity * 100)}%</strong><p className="text-xs text-muted-foreground">Similaridade média entre seções</p></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="text-xl font-semibold">Comparação por seção</h3><p className="text-sm text-muted-foreground">{comparison.cached ? "Resultado reutilizado do armazenamento." : "Comparação recém-processada e armazenada."}</p></div><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={onlyChanges} onChange={event => setOnlyChanges(event.target.checked)} /> Exibir somente alterações</label></div>
                {visibleSections.length === 0 && <p className="rounded-lg border p-6 text-center text-muted-foreground">Nenhuma alteração textual identificada nas seções reconhecidas.</p>}
                <div className="space-y-3">{visibleSections.map((section, index) => <details key={`${section.document}-${section.section}-${index}`} className="group rounded-xl border bg-card p-4"><summary className="cursor-pointer font-semibold">Documento {section.document} · {section.label} · Seção {section.section} {section.changed ? <span className="ml-2 text-xs font-normal text-primary">+{section.addedWords} / −{section.removedWords}</span> : <span className="ml-2 text-xs font-normal text-muted-foreground">Sem alterações</span>}</summary><div className="mt-4 max-h-[65vh] overflow-auto whitespace-pre-wrap break-words border-t pt-4 text-sm leading-7">{section.changed ? section.parts.map((part, partIndex) => part.type === "added" ? <ins key={partIndex} className="rounded bg-green-100 px-0.5 text-green-900 no-underline">{part.text}</ins> : part.type === "removed" ? <del key={partIndex} className="rounded bg-red-100 px-0.5 text-red-900">{part.text}</del> : <span key={partIndex}>{part.text}</span>) : "Esta seção não apresentou alterações."}</div></details>)}</div>
                <p className="text-xs text-muted-foreground">Comparação automatizada de texto. Confira o PDF oficial para interpretação regulatória, tabelas, imagens e alterações de formatação.</p>
              </section>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
