import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import {
  exportAsCSV,
  exportAsJSON,
  exportAsExcel,
  getExportFilename,
} from "@/lib/export";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/* === CONTRATO REAL COM O BACKEND === */
interface Medication {
  id: number;
  name: string;
  registrationNumber: string;
  holder: string | null;
  cnpj: string | null;
  expediente: string | null;
  processNumber: string | null;

  publicationDate: string | null; // atualização do bulário
  lastUpdate: string | null;       // inclusão na plataforma
  category?: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const datePart = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (datePart) {
    const [, year, month, day] = datePart;
    return `${day}/${month}/${year}`;
  }

  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

export default function Medications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("todos");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCategoryHintBurst, setShowCategoryHintBurst] = useState(false);
  const [showFilterAlert, setShowFilterAlert] = useState(false);
  const hasMountedFiltersRef = useRef(false);

  // Listagem de medicamentos
  const { data, isLoading, error } = trpc.medications.list.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery || undefined,
    dateRange: selectedDateRange === "todos" ? undefined : parseInt(selectedDateRange),
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const { data: categories = [] } = trpc.medications.categories.useQuery();

  // Estatísticas para painel superior
  const { data: stats } = trpc.medications.stats.useQuery();

  const utils = trpc.useUtils();

  const handleExport = useCallback(
    async (format: "excel" | "csv" | "json") => {
      try {
        const allData = await utils.medications.list.fetch({
          page: 1,
          limit: 10000,
          search: searchQuery || undefined,
          dateRange: selectedDateRange === "todos" ? undefined : parseInt(selectedDateRange),
          category: selectedCategory === "all" ? undefined : selectedCategory,
        });

        const filename = getExportFilename(format);

        if (format === "csv") exportAsCSV(allData.items, filename);
        if (format === "json") exportAsJSON(allData.items, filename);
        if (format === "excel") exportAsExcel(allData.items, filename);

        toast.success("Exportação concluída", {
          description: `${allData.items.length} registros exportados`,
        });
      } catch {
        toast.error("Erro ao exportar");
      }
    },
    [searchQuery, selectedCategory, selectedDateRange, utils]
  );


  useEffect(() => {
    if (!hasMountedFiltersRef.current) {
      hasMountedFiltersRef.current = true;
      return;
    }

    setShowFilterAlert(true);
    setShowCategoryHintBurst(true);

    const timer = setTimeout(() => {
      setShowCategoryHintBurst(false);
    }, 900);

    return () => clearTimeout(timer);
  }, [selectedCategory, selectedDateRange]);

  const medications: Medication[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <MainLayout>
      {/* HEADER */}
      <section className="w-full py-10 border-b">
        <div className="container">
          <h1 className="text-3xl font-bold">Base de Dados - DBULÁRIO</h1>
          <p className="text-muted-foreground">Base com todos os medicamentos publicados no Bulário ANVISA.</p>
        </div>
      </section>

    {/* PAINEL SUPERIOR COM TOTAL E CARDS DE ATUALIZAÇÃO */}
{stats && (
  <section className="py-6 bg-blue-50 border-b">
    <div className="container grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* TOTAL DE MEDICAMENTOS */}
      <div className="bg-white shadow rounded p-4 flex flex-col items-center border-l-4 border-gray-500">
        <span className="text-2xl font-bold">{stats.total}</span>
        <span className="text-sm text-gray-600">Medicamentos monitorados</span>
      </div>

      {/* 7 dias */}
      <div className="bg-white shadow rounded p-4 flex flex-col items-center border-l-4 border-blue-500">
        <span className="text-2xl font-bold">{stats.updatedLast7Days}</span>
        <span className="text-sm text-gray-600">Bulas atualizadas nos últimos 7 dias</span>
      </div>

      {/* 30 dias */}
      <div className="bg-white shadow rounded p-4 flex flex-col items-center border-l-4 border-blue-500">
        <span className="text-2xl font-bold">{stats.updatedLast30Days}</span>
        <span className="text-sm text-gray-600">Bulas atualizadas nos últimos 30 dias</span>
      </div>

      {/* 90 dias */}
      <div className="bg-white shadow rounded p-4 flex flex-col items-center border-l-4 border-blue-500">
        <span className="text-2xl font-bold">{stats.updatedLast90Days}</span>
        <span className="text-sm text-gray-600">Bulas atualizadas nos últimos 90 dias</span>
      </div>
    </div>
  </section>
)}


      {/* BUSCA E FILTROS */}
      <section className="py-6 border-b">
        <div className="container space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5" />
              <Input
                className="pl-10"
                placeholder="Buscar por nome, registro ou titular"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Select
              value={selectedDateRange}
              onValueChange={(v) => {
                setSelectedDateRange(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Atualização do bulário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Qualquer data</SelectItem>
                <SelectItem value="1">Último 1 dia</SelectItem>
                <SelectItem value="3">Últimos 3 dias</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 w-56">
              <Select
                value={selectedCategory}
                onValueChange={(v) => {
                  setSelectedCategory(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filtro por categoria (CSV)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showFilterAlert && (
                <div
                  className={`relative rounded-md border border-blue-400 bg-blue-100 px-2.5 py-2 text-xs text-blue-950 transition-all duration-300 ${showCategoryHintBurst ? "scale-105 shadow" : ""}`}
                >
                  {showCategoryHintBurst && (
                    <>
                      <span className="absolute right-4 -top-2 h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                      <span className="absolute right-4 -top-2 h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <Sparkles className="absolute right-0 -top-4 h-4 w-4 text-blue-500 animate-bounce" />
                    </>
                  )}
                  <span className="font-semibold">Filtro personalizado por CSV.</span>{" "}
                  {categories.length > 0
                    ? "Selecione uma categoria para aplicar sua lista imediatamente."
                    : "Nenhum CSV encontrado em /data. Adicione arquivos como medref.csv."}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

       {/* TABELA */}
      <section className="py-4">
        <div className="container">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-600">{error.message}</div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-blue-100 text-blue-900">
                    <tr>
                      <th className="p-3 text-center">Produto</th>
                      <th className="p-3 text-center">Registro</th>
                      <th className="p-3 text-center">Titular</th>
                      <th className="p-3 text-center">Processo</th>
                      <th className="p-3 text-center">Atualização do bulário</th>
                      <th className="p-3 text-center">Inclusão na plataforma</th>
                      <th className="p-3 text-center">Consultas ANVISA</th>

                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="p-3 text-center">{m.name}</td>
                        <td className="p-3 font-mono text-xs text-center">{m.registrationNumber}</td>
                        <td className="p-3 text-center">{m.holder ?? "-"}</td>
                        <td className="p-3 font-mono text-xs text-center">{m.processNumber ?? "-"}</td>
                        <td className="p-3 text-center">{formatDate(m.publicationDate)}</td>
                        <td className="p-3 text-center">{formatDate(m.lastUpdate)}</td>
                      <td className="p-3 text-center">
                      <a
                        href={`https://consultas.anvisa.gov.br/#/bulario/q/?numeroRegistro=${m.registrationNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button 
                          size="sm" 
                          className="bg-blue-100 text-blue-900 hover:bg-blue-200"
                        >
                          Acessar
                        </Button>
                      </a>
                    </td>


                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINAÇÃO E ITENS POR PÁGINA */}
              <div className="flex flex-col md:flex-row md:justify-between mt-4 gap-2">
                <div className="flex gap-2 items-center">
                  <span>Página {currentPage} de {totalPages}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span>Itens por página:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(parseInt(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      
    </MainLayout>
  );
}
