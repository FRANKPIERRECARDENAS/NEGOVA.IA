import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { getFeaturedDemoProfiles, getSyntheticProfiles } from "../engines/syntheticData";
import { PerfilSintetico, SegmentoSintetico } from "../types/negova";

interface DemoCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: PerfilSintetico) => void;
}

const SEGMENTOS: Array<"Todos" | SegmentoSintetico> = [
  "Todos",
  "Agrícola y productivo",
  "Comercio estacional",
  "Comercio y servicios estables",
  "Negocios sensibles al clima",
  "Negocios variables o mixtos",
];

export function DemoCasesModal({
  isOpen,
  onClose,
  onSelectProfile,
}: DemoCasesModalProps) {
  const [selectedSegment, setSelectedSegment] = useState<"Todos" | SegmentoSintetico>("Todos");
  const [query, setQuery] = useState("");

  const allProfiles = useMemo(() => getSyntheticProfiles(), []);
  const featured = useMemo(() => getFeaturedDemoProfiles(), []);

  const segmentCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allProfiles) {
      map.set(p.segmento, (map.get(p.segmento) ?? 0) + 1);
    }
    return map;
  }, [allProfiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProfiles
      .filter((p) => (selectedSegment === "Todos" ? true : p.segmento === selectedSegment))
      .filter((p) => {
        if (!q) return true;
        return (
          p.id.toLowerCase().includes(q) ||
          p.tituloCaso.toLowerCase().includes(q) ||
          p.input.negocio.departamento.toLowerCase().includes(q) ||
          p.input.negocio.sector.toLowerCase().includes(q)
        );
      })
      .slice(0, 30);
  }, [allProfiles, selectedSegment, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-cases-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 id="demo-cases-title" className="text-lg font-bold text-[#0B1F3A] dark:text-white">
              Explorar casos de demostración
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Base sintética reproducible de 1,000 negocios hipotéticos · No corresponde a clientes reales
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de casos sintéticos"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Casos destacados rápidos */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Casos rápidos por arquetipo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featured.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProfile(p)}
                  className="text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-teal-600 dark:hover:border-teal-500 hover:bg-teal-50/30 dark:hover:bg-teal-950/30 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{p.id}</span>
                    <span>{p.estacionalidadNivel}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white mt-1 line-clamp-1">
                    {p.tituloCaso}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{p.segmento}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Buscador y filtros por segmento */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por código (SYN-0024), actividad o departamento..."
                  aria-label="Buscar perfil sintético"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>
              <select
                value={selectedSegment}
                onChange={(e) =>
                  setSelectedSegment(e.target.value as "Todos" | SegmentoSintetico)
                }
                aria-label="Filtrar por segmento sintético"
                className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
              >
                {SEGMENTOS.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg === "Todos"
                      ? `Todos los segmentos (${allProfiles.length})`
                      : `${seg} (${segmentCounts.get(seg) ?? 0})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabla compacta */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">ID</th>
                    <th className="py-2.5 px-3 font-medium">Actividad y zona</th>
                    <th className="py-2.5 px-3 font-medium hidden md:table-cell">Segmento</th>
                    <th className="py-2.5 px-3 font-medium text-right">Monto</th>
                    <th className="py-2.5 px-3 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {p.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{p.tituloCaso}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {p.etiquetaSintetica} · {p.resumenBreve}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                        {p.segmento}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        S/ {p.input.credito.montoSolicitado.toLocaleString("es-PE")}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectProfile(p)}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900/70 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Cargar caso
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No se encontraron perfiles sintéticos con ese criterio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mostrando hasta 30 resultados de {allProfiles.length} perfiles sintéticos reproducibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
