import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { ArrowLeft, Clock3, ExternalLink, FileDiff, Loader2, Search } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type Medication = {
  id: number;
  name: string;
  registrationNumber: string;
  holder: string | null;
  publicationDate: string | Date | null;
  lastUpdate: string | Date | null;
};
const digits = (text: string) => text.replace(/\D/g, "");
function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
function anvisaUrl(item: Medication) {
  return `https://consultas.anvisa.gov.br/#/bulario/detalhe/${item.id}?numeroRegistro=${encodeURIComponent(item.registrationNumber)}`;
}
function MedicationCard({ item, onSelect }: { item: Medication; onSelect: (medication: Medication) => void }) {
  return <article className="rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold break-words">{item.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.holder || "Titular não informado"}</p>
        <p className="mt-3 text-xs text-muted-foreground">Registro: <strong className="text-foreground">{item.registrationNumber}</strong> · Atualização: <strong className="text-foreground">{formatDate(item.publicationDate)}</strong></p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={anvisaUrl(item)} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><ExternalLink className="mr-1 h-4 w-4" /> ANVISA</Button></a>
        <Button size="sm" onClick={() => onSelect(item)}><FileDiff className="mr-1 h-4 w-4" /> Comparar versões</Button>
      </div>
    </div>
  </article>;
}
export default function BulaCompare() {
  const [, route] = useRoute("/comparar-bulas/:registro");
  const registrationFromUrl = route?.registro ?? "";
  const [tab, setTab] = useState<"search" | "recent">("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Medication | null>(null);
  const [kind, setKind] = useState<"vp" | "vps">("vp");
  const [onlyChanged, setOnlyChanged] = useState(true);
  const compare = trpc.bulaDiff.compare.useMutation();
  const search = trpc.medications.list.useQuery({ page: 1, limit: 20, search: query.trim() }, { enabled: tab === "search" && query.trim().length >= 2 && !selected });
  const direct = trpc.medications.list.useQuery({ page: 1, limit: 20, numeroRegistro: registrationFromUrl }, { enabled: !!registrationFromUrl && !selected });
  const recent = trpc.medications.recentUpdates.useQuery({ days: 90 }, { enabled: tab === "recent" && !selected });

  useEffect(() => {
    const match = direct.data?.items.find(item => digits(item.registrationNumber) === digits(registrationFromUrl));
    if (match && !selected) setSelected(match);
  }, [direct.data, registrationFromUrl, selected]);

  function select(item: Medication) {
    setSelected(item);
    setKind("vp");
    compare.reset();
  }
  function runComparison() {
    if (!selected) return;
    compare.reset();
    compare.mutate({ idProduto: selected.id, registrationNumber: digits(selected.registrationNumber), type: kind });
  }
  const result = compare.data?.type === kind ? compare.data : null;
  const sections = result?.sections.filter(section => !onlyChanged || section.changed) ?? [];

  return <MainLayout>
    <section className="border-b bg-gradient-to-br from-blue-50 via-background to-background py-12"><div className="container space-y-3">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">DBULÁRIO · Ferramentas</p>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Comparador de Bulas</h1>
      <p className="max-w-2xl text-muted-foreground">Compare a bula atual com a última versão de conteúdo diferente. Identifique alterações por seção, com destaque para palavras adicionadas e removidas.</p>
    </div></section>
    <div className="container space-y-8 py-8">
      {!selected ? <>
        <div className="flex flex-wrap gap-2 border-b pb-4" role="tablist" aria-label="Selecionar modo de pesquisa">
          <Button role="tab" aria-selected={tab === "search"} variant={tab === "search" ? "default" : "outline"} onClick={() => setTab("search")}><Search className="mr-2 h-4 w-4" /> Pesquisar</Button>
          <Button role="tab" aria-selected={tab === "recent"} variant={tab === "recent" ? "default" : "outline"} onClick={() => setTab("recent")}><Clock3 className="mr-2 h-4 w-4" /> Últimas atualizações</Button>
        </div>
        {tab === "search" ? <section className="space-y-5">
          <div className="max-w-2xl space-y-2"><label htmlFor="bula-search" className="font-medium">Qual medicamento você quer comparar?</label><div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" /><Input id="bula-search" className="pl-10" placeholder="Nome, empresa ou número de registro" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" /></div><p className="text-xs text-muted-foreground">Pesquisa na base atual do DBULÁRIO; a ANVISA só é consultada quando você solicitar a comparação.</p></div>
          {direct.isLoading && !!registrationFromUrl && <p className="text-sm text-muted-foreground">Localizando o registro informado...</p>}
          {direct.error && !!registrationFromUrl && <p role="alert" className="text-sm text-destructive">{direct.error.message}</p>}
          {search.isLoading && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Pesquisando...</p>}
          {search.error && <p role="alert" className="text-sm text-destructive">{search.error.message}</p>}
          {query.trim().length < 2 && !registrationFromUrl && <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Digite ao menos dois caracteres para encontrar um medicamento.</p>}
          {search.data && query.trim().length >= 2 && <p className="text-sm text-muted-foreground">{search.data.total} medicamento(s) encontrado(s). Exibindo até 20 resultados.</p>}
          <div className="grid gap-3">{(search.data?.items ?? []).map(item => <MedicationCard key={item.id} item={item} onSelect={select} />)}</div>
          {search.data?.total === 0 && query.trim().length >= 2 && <p className="rounded-lg border p-8 text-center">Nenhum medicamento encontrado.</p>}
        </section> : <section className="space-y-5"><div><h2 className="text-xl font-semibold">Últimas atualizações do Bulário</h2><p className="text-sm text-muted-foreground">Dados dos últimos 90 dias da base DBULÁRIO.</p></div>
          {recent.isLoading && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</p>}
          {recent.error && <p role="alert" className="text-sm text-destructive">{recent.error.message}</p>}
          <div className="grid gap-3">{(recent.data ?? []).map(item => <MedicationCard key={item.id} item={item} onSelect={select} />)}</div>
          {recent.data?.length === 0 && <p className="rounded-lg border p-8 text-center">Nenhuma atualização encontrada no período.</p>}
        </section>}
      </> : <>
        <Button variant="outline" onClick={() => { setSelected(null); compare.reset(); }}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar à pesquisa</Button>
        <div className="rounded-xl border bg-card p-6 shadow-sm"><h2 className="text-2xl font-bold">{selected.name}</h2><p className="mt-1 text-muted-foreground">{selected.holder || "Titular não informado"}</p><p className="mt-3 text-sm">Registro: <strong>{selected.registrationNumber}</strong> · ID Produto: <strong>{selected.id}</strong></p>
          <a href={anvisaUrl(selected)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Abrir detalhe no Bulário ANVISA <ExternalLink className="h-4 w-4" /></a>
          <div className="mt-6 flex flex-wrap gap-2"><Button variant={kind === "vp" ? "default" : "outline"} onClick={() => { setKind("vp"); compare.reset(); }}>Bula do paciente (VP)</Button><Button variant={kind === "vps" ? "default" : "outline"} onClick={() => { setKind("vps"); compare.reset(); }}>Bula do profissional (VPS)</Button></div>
          <Button className="mt-5" disabled={compare.isPending} onClick={runComparison}>{compare.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDiff className="mr-2 h-4 w-4" />}{compare.isPending ? "Consultando ANVISA e comparando..." : `Comparar versões ${kind.toUpperCase()}`}</Button>
          {compare.isPending && <p role="status" className="mt-2 text-xs text-muted-foreground">Primeira execução: download e extração dos PDFs. As próximas reutilizam o resultado quando o histórico não muda.</p>}
          {compare.error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{compare.error.message}</div>}
        </div>
        {result && <section className="space-y-6" aria-label="Comparação de bulas">
          <div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border bg-card p-5"><p className="text-xs font-semibold uppercase text-muted-foreground">Versão anterior</p><p className="mt-2 text-lg font-semibold">{formatDate(result.previous.publicationDate)}</p><p className="text-sm text-muted-foreground">Expediente: {result.previous.expediente || "Não informado"}</p></div><div className="rounded-xl border border-primary/30 bg-blue-50 p-5"><p className="text-xs font-semibold uppercase text-primary">Versão atual</p><p className="mt-2 text-lg font-semibold">{formatDate(result.current.publicationDate)}</p><p className="text-sm text-muted-foreground">Expediente: {result.current.expediente || "Não informado"}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-lg border p-4"><strong className="text-2xl">{result.summary.changedSections}</strong><p className="text-xs text-muted-foreground">Seções alteradas</p></div><div className="rounded-lg border p-4"><strong className="text-2xl text-green-700">+{result.summary.addedWords}</strong><p className="text-xs text-muted-foreground">Palavras adicionadas</p></div><div className="rounded-lg border p-4"><strong className="text-2xl text-red-700">−{result.summary.removedWords}</strong><p className="text-xs text-muted-foreground">Palavras removidas</p></div><div className="rounded-lg border p-4"><strong className="text-2xl">{Math.round(result.summary.similarity * 100)}%</strong><p className="text-xs text-muted-foreground">Similaridade média</p></div></div>
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="text-xl font-semibold">Alterações por seção</h3><p className="text-sm text-muted-foreground">{result.cached ? "Comparação recuperada do armazenamento." : "Comparação gerada e armazenada."}</p></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyChanged} onChange={event => setOnlyChanged(event.target.checked)} /> Somente seções alteradas</label></div>
          {sections.length === 0 && <p className="rounded-lg border p-6 text-center text-muted-foreground">Nenhuma alteração textual identificada nas seções reconhecidas.</p>}
          <div className="space-y-3">{sections.map((section, index) => <details key={`${section.document}-${section.section}-${index}`} className="rounded-xl border bg-card p-4"><summary className="cursor-pointer font-semibold">Documento {section.document} · {section.label} · Seção {section.section} <span className="ml-2 text-xs font-normal text-primary">{section.changed ? `+${section.addedWords} / −${section.removedWords}` : "Sem alterações"}</span></summary><div className="mt-4 max-h-[65vh] overflow-auto whitespace-pre-wrap break-words border-t pt-4 text-sm leading-7">{section.changed ? section.parts.map((part, partIndex) => part.type === "added" ? <ins key={partIndex} className="rounded bg-green-100 px-0.5 text-green-900 no-underline">{part.text}</ins> : part.type === "removed" ? <del key={partIndex} className="rounded bg-red-100 px-0.5 text-red-900">{part.text}</del> : <span key={partIndex}>{part.text}</span>) : "Seção inalterada."}</div></details>)}</div>
          <p className="text-xs text-muted-foreground">Diferenças extraídas automaticamente do texto. Confira o PDF oficial para alterações em tabelas, imagens, layout e interpretação regulatória.</p>
        </section>}
      </>}
    </div>
  </MainLayout>;
}
