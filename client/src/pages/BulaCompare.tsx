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
type BulaType = "vp" | "vps";

const digits = (text: string) => text.replace(/\D/g, "");
const bulaName = (type: BulaType) => type === "vp" ? "bula do paciente" : "bula do profissional de saúde";
function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não informada" : date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
function anvisaUrl(item: Medication) {
  return `https://consultas.anvisa.gov.br/#/bulario/detalhe/${item.id}?numeroRegistro=${encodeURIComponent(item.registrationNumber)}`;
}
function friendlyError(message: string) {
  if (/Não há duas versões|Não existe versão anterior/i.test(message)) {
    return "Ainda não encontramos duas edições diferentes desta bula para comparar. Você pode consultar as versões disponíveis diretamente na Anvisa.";
  }
  if (/PDF não produziu texto|OCR|extração|identificar texto|arquivo retornado não é PDF/i.test(message)) {
    return "Não foi possível identificar o texto necessário para comparar esta bula. Consulte as versões originais no Bulário da Anvisa.";
  }
  if (/não corresponde ao registro|medicamento válido|idProduto inválido/i.test(message)) {
    return "Não foi possível confirmar os dados deste medicamento. Volte à pesquisa e selecione-o novamente.";
  }
  if (/403|429|Cloudflare|HTTP|Chromium|navegador|portal|sessão|bloqueio|JSON/i.test(message)) {
    return "Não foi possível acessar o Bulário da Anvisa neste momento. Confira a disponibilidade do portal e tente novamente.";
  }
  return "Não foi possível concluir a comparação neste momento. Tente novamente ou consulte as bulas diretamente na Anvisa.";
}
function sectionName(section: string) {
  if (section === "I") return "Identificação do medicamento";
  if (section === "II") return "Informações sobre o medicamento";
  if (section === "III") return "Dizeres legais";
  if (section === "FULL") return "Texto da bula";
  return `Seção ${section}`;
}
function MedicationCard({ item, onSelect }: { item: Medication; onSelect: (medication: Medication) => void }) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-semibold">{item.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.holder || "Empresa responsável não informada"}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Registro: <strong className="text-foreground">{item.registrationNumber}</strong>
            <span className="mx-2">·</span>
            Atualização no Bulário: <strong className="text-foreground">{formatDate(item.publicationDate)}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={anvisaUrl(item)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium hover:bg-muted" aria-label={`Consultar ${item.name} no Bulário da Anvisa`}>
            <ExternalLink className="h-4 w-4" /> Ver na Anvisa
          </a>
          <Button size="sm" onClick={() => onSelect(item)} aria-label={`Comparar as bulas de ${item.name}`}>
            <FileDiff className="mr-1 h-4 w-4" /> Comparar bulas
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function BulaCompare() {
  const [, route] = useRoute("/comparar-bulas/:registro");
  const registrationFromUrl = route?.registro ?? "";
  const [tab, setTab] = useState<"search" | "recent">("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Medication | null>(null);
  const [kind, setKind] = useState<BulaType>("vp");
  const [onlyChanged, setOnlyChanged] = useState(true);
  const compare = trpc.bulaDiff.compare.useMutation();
  const search = trpc.medications.list.useQuery(
    { page: 1, limit: 20, search: query.trim() },
    { enabled: tab === "search" && query.trim().length >= 2 && !selected },
  );
  const direct = trpc.medications.list.useQuery(
    { page: 1, limit: 20, numeroRegistro: registrationFromUrl },
    { enabled: !!registrationFromUrl && !selected },
  );
  const recent = trpc.medications.recentUpdates.useQuery(
    { days: 90 },
    { enabled: tab === "recent" && !selected },
  );

  useEffect(() => {
    const match = direct.data?.items.find(item => digits(item.registrationNumber) === digits(registrationFromUrl));
    if (match && !selected) setSelected(match);
  }, [direct.data, registrationFromUrl, selected]);

  function select(item: Medication) {
    setSelected(item);
    setKind("vp");
    setOnlyChanged(true);
    compare.reset();
  }
  function runComparison() {
    if (!selected) return;
    compare.reset();
    compare.mutate({ idProduto: selected.id, registrationNumber: digits(selected.registrationNumber), type: kind });
  }
  const result = compare.data?.type === kind ? compare.data : null;
  const sections = result?.sections.filter(section => !onlyChanged || section.changed) ?? [];
  const multiplePresentations = (result?.sections.some(section => section.document > 1)) ?? false;

  return (
    <MainLayout>
      <section className="border-b bg-gradient-to-br from-blue-50 via-background to-background py-12">
        <div className="container space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">DBULÁRIO · Consulta de bulas</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">O que mudou na bula?</h1>
          <p className="max-w-2xl text-muted-foreground">
            Compare a bula publicada atualmente com a edição anterior disponível e confira os trechos que foram incluídos ou retirados do texto.
          </p>
          <p className="text-sm text-muted-foreground">Encontre o medicamento, escolha o tipo de bula e veja as alterações destacadas.</p>
        </div>
      </section>
      <div className="container space-y-8 py-8">
        {!selected ? (
          <>
            <div className="flex flex-wrap gap-2 border-b pb-4" role="tablist" aria-label="Como encontrar o medicamento">
              <Button role="tab" aria-selected={tab === "search"} variant={tab === "search" ? "default" : "outline"} onClick={() => setTab("search")}>
                <Search className="mr-2 h-4 w-4" /> Buscar medicamento
              </Button>
              <Button role="tab" aria-selected={tab === "recent"} variant={tab === "recent" ? "default" : "outline"} onClick={() => setTab("recent")}>
                <Clock3 className="mr-2 h-4 w-4" /> Últimas atualizações
              </Button>
            </div>
            {tab === "search" ? (
              <section className="space-y-5" aria-label="Pesquisa de medicamentos">
                <div className="max-w-2xl space-y-2">
                  <label htmlFor="bula-search" className="font-medium">Encontre o medicamento que deseja consultar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input id="bula-search" className="pl-10" placeholder="Digite o nome, a empresa ou o número de registro" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" />
                  </div>
                  <p className="text-sm text-muted-foreground">Selecione um medicamento nos resultados para escolher qual bula comparar.</p>
                </div>
                {direct.isLoading && !!registrationFromUrl && <p role="status" className="text-sm text-muted-foreground">Procurando o medicamento selecionado...</p>}
                {direct.error && !!registrationFromUrl && <p role="alert" className="rounded-lg border p-4 text-sm text-destructive">Não foi possível localizar o medicamento pelo link. Pesquise pelo nome ou registro acima.</p>}
                {direct.data?.total === 0 && !!registrationFromUrl && <p className="rounded-lg border p-4 text-sm text-muted-foreground">Não encontramos o registro indicado neste link. Você pode procurar pelo nome do medicamento acima.</p>}
                {search.isLoading && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Procurando medicamentos...</p>}
                {search.error && <p role="alert" className="rounded-lg border p-4 text-sm text-destructive">Não foi possível carregar os resultados. Tente novamente.</p>}
                {query.trim().length < 2 && !registrationFromUrl && <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Comece digitando pelo menos duas letras do medicamento ou da empresa, ou informe um número de registro.</p>}
                {search.data && query.trim().length >= 2 && <p className="text-sm text-muted-foreground">{search.data.total === 1 ? "1 medicamento encontrado." : `${search.data.total} medicamentos encontrados.`} {search.data.total > 20 ? "Mostrando os 20 primeiros. Digite mais detalhes para refinar a busca." : "Selecione o medicamento desejado."}</p>}
                <div className="grid gap-3">{(search.data?.items ?? []).map(item => <MedicationCard key={item.id} item={item} onSelect={select} />)}</div>
                {search.data?.total === 0 && query.trim().length >= 2 && <p className="rounded-lg border p-8 text-center text-muted-foreground">Nenhum medicamento encontrado. Confira o nome ou tente pesquisar pela empresa ou pelo registro.</p>}
              </section>
            ) : (
              <section className="space-y-5" aria-label="Atualizações recentes de bulas">
                <div>
                  <h2 className="text-xl font-semibold">Atualizações recentes do Bulário</h2>
                  <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Consulte os medicamentos com atualização registrada nos últimos 90 dias na base do DBULÁRIO. Selecione um deles para verificar o que mudou em relação à edição anterior.</p>
                  <p className="mt-2 text-xs text-muted-foreground">Uma atualização registrada não significa necessariamente que o texto da bula tenha sido alterado.</p>
                </div>
                {recent.isLoading && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Buscando atualizações...</p>}
                {recent.error && <p role="alert" className="rounded-lg border p-4 text-sm text-destructive">Não foi possível carregar as atualizações. Tente novamente.</p>}
                <div className="grid gap-3">{(recent.data ?? []).map(item => <MedicationCard key={item.id} item={item} onSelect={select} />)}</div>
                {recent.data?.length === 0 && <p className="rounded-lg border p-8 text-center text-muted-foreground">Não há atualizações disponíveis para esse período na base consultada.</p>}
              </section>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => { setSelected(null); compare.reset(); }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Escolher outro medicamento
            </Button>
            <section className="rounded-xl border bg-card p-6 shadow-sm" aria-label="Medicamento selecionado">
              <p className="text-sm font-medium text-primary">Medicamento selecionado</p>
              <h2 className="mt-1 text-2xl font-bold">{selected.name}</h2>
              <p className="mt-1 text-muted-foreground">{selected.holder || "Empresa responsável não informada"}</p>
              <p className="mt-3 text-sm">Registro: <strong>{selected.registrationNumber}</strong></p>
              <a href={anvisaUrl(selected)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Consultar bula oficial na Anvisa <ExternalLink className="h-4 w-4" />
              </a>
              <h3 className="mt-7 font-semibold">Qual bula você deseja comparar?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Escolha o conteúdo destinado ao paciente ou as informações técnicas para profissionais de saúde.</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tipo de bula">
                <Button variant={kind === "vp" ? "default" : "outline"} aria-pressed={kind === "vp"} onClick={() => { setKind("vp"); compare.reset(); }}>Bula do paciente</Button>
                <Button variant={kind === "vps" ? "default" : "outline"} aria-pressed={kind === "vps"} onClick={() => { setKind("vps"); compare.reset(); }}>Bula do profissional de saúde</Button>
              </div>
              <Button className="mt-5" disabled={compare.isPending} onClick={runComparison}>
                {compare.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDiff className="mr-2 h-4 w-4" />}
                {compare.isPending ? "Comparando as bulas..." : "Mostrar o que mudou"}
              </Button>
              {compare.isPending && <p role="status" className="mt-3 text-sm text-muted-foreground">Estamos verificando as edições disponíveis e procurando diferenças no texto. O resultado aparecerá abaixo.</p>}
              {compare.error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p>{friendlyError(compare.error.message)}</p>
                <a href={anvisaUrl(selected)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-medium underline">Consultar no Bulário da Anvisa <ExternalLink className="h-4 w-4" /></a>
              </div>}
            </section>
            {result && <section className="space-y-6" aria-label="Resultado da comparação">
              <div>
                <p className="text-sm font-medium text-primary">Resultado da comparação</p>
                <h3 className="mt-1 text-2xl font-bold">O que mudou na {bulaName(kind)}?</h3>
                <p className="mt-2 text-sm text-muted-foreground">Veja abaixo quais trechos aparecem na edição atual e quais estavam presentes somente na edição anterior.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Edição anterior</p>
                  <p className="mt-2 text-lg font-semibold">{formatDate(result.previous.publicationDate)}</p>
                  <p className="text-sm text-muted-foreground">Expediente: {result.previous.expediente || "Não informado"}</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-blue-50 p-5">
                  <p className="text-xs font-semibold uppercase text-primary">Edição atual</p>
                  <p className="mt-2 text-lg font-semibold">{formatDate(result.current.publicationDate)}</p>
                  <p className="text-sm text-muted-foreground">Expediente: {result.current.expediente || "Não informado"}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4"><strong className="text-2xl">{result.summary.changedSections}</strong><p className="text-sm text-muted-foreground">Seções com diferenças no texto</p></div>
                <div className="rounded-lg border p-4"><strong className="text-2xl text-green-700">+{result.summary.addedWords}</strong><p className="text-sm text-muted-foreground">Palavras incluídas</p></div>
                <div className="rounded-lg border p-4"><strong className="text-2xl text-red-700">−{result.summary.removedWords}</strong><p className="text-sm text-muted-foreground">Palavras retiradas</p></div>
              </div>
              <div className="rounded-xl border bg-blue-50/60 p-5 text-sm">
                <h4 className="font-semibold">Como ler as alterações</h4>
                <p className="mt-2"><span className="rounded bg-green-100 px-1 font-medium text-green-900">Verde</span> indica texto incluído na edição atual. <span className="rounded bg-red-100 px-1 font-medium text-red-900 line-through">Vermelho</span> indica texto que estava na edição anterior e foi retirado. Trechos sem destaque permaneceram iguais.</p>
                <p className="mt-2 text-muted-foreground">Os totais são contagens automáticas de palavras e não indicam, por si só, a importância de uma alteração.</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><h4 className="text-xl font-semibold">Confira as seções da bula</h4><p className="text-sm text-muted-foreground">Abra uma seção para visualizar as diferenças no texto.</p></div>
                <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={onlyChanged} onChange={event => setOnlyChanged(event.target.checked)} /> Mostrar apenas seções com alterações</label>
              </div>
              {sections.length === 0 && <p className="rounded-lg border p-6 text-center text-muted-foreground">Não identificamos diferenças de texto nas seções analisadas. Consulte as bulas oficiais para verificar eventuais alterações em tabelas, imagens ou apresentação.</p>}
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <details key={`${section.document}-${section.section}-${index}`} className="rounded-xl border bg-card p-4">
                    <summary className="cursor-pointer font-semibold">
                      {multiplePresentations ? `${section.label && section.label !== "Bula" && section.label !== "Apresentação" ? section.label : `Apresentação ${section.document}`} · ` : ""}{sectionName(section.section)}
                      <span className="ml-2 text-xs font-normal text-primary">{section.changed ? `+${section.addedWords} incluídas · −${section.removedWords} retiradas` : "Sem diferenças identificadas"}</span>
                    </summary>
                    <div className="mt-4 max-h-[65vh] overflow-auto whitespace-pre-wrap break-words border-t pt-4 text-sm leading-7">
                      {section.changed ? section.parts.map((part, partIndex) => part.type === "added" ? (
                        <ins key={partIndex} className="rounded bg-green-100 px-0.5 text-green-900 no-underline">{part.text}</ins>
                      ) : part.type === "removed" ? (
                        <del key={partIndex} className="rounded bg-red-100 px-0.5 text-red-900">{part.text}</del>
                      ) : <span key={partIndex}>{part.text}</span>) : "Nenhuma diferença de texto identificada nesta seção."}
                    </div>
                  </details>
                ))}
              </div>
              <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Importante:</strong> esta comparação identifica diferenças no texto extraído das bulas. Tabelas, imagens, formatação e o contexto de cada alteração podem não ser representados integralmente. Para confirmar as informações e tomar decisões regulatórias ou assistenciais, consulte sempre a bula oficial da Anvisa.
              </p>
            </section>}
          </>
        )}
      </div>
    </MainLayout>
  );
}
