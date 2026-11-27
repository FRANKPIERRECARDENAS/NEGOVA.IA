import { useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import {
  getFeaturedDemoProfiles,
  getOfficialDemoCases,
  getSyntheticProfiles,
} from "../engines/syntheticData";
import { MesVenta, PerfilSintetico, SegmentoSintetico } from "../types/negova";
import { BrandLogo } from "./BrandLogo";

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

function MiniSeasonBars({ ventas }: { ventas: MesVenta[] }) {
  const values = ventas.map((v) => v.monto ?? 0);
  const max = Math.max(1, ...values);

  return (
    <svg
      viewBox="0 0 96 28"
      className="w-24 h-7 shrink-0"
      aria-hidden="true"
    >
      {values.map((val, idx) => {
        const h = Math.max(3, Math.round((val / max) * 24));
        return (
          <rect
            key={idx}
            x={idx * 8}
            y={28 - h}
            width="5"
            height={h}
            rx="1"
            fill="var(--accent-teal)"
            opacity={0.35 + (val / max) * 0.65}
          />
        );
      })}
    </svg>
  );
}

export function DemoCasesModal({
  isOpen,
  onClose,
  onSelectProfile,
}: DemoCasesModalProps) {
  const [viewMode, setViewMode] = useState<"guiados" | "catalogo">("guiados");
  const [selectedSegment, setSelectedSegment] = useState<"Todos" | SegmentoSintetico>("Todos");
  const [query, setQuery] = useState("");

  const allProfiles = useMemo(() => getSyntheticProfiles(), []);
  const officialCases = useMemo(() => getOfficialDemoCases(), []);
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
          p.input.negocio.sector.toLowerCase().includes(q) ||
          p.input.negocio.actividadEspecifica.toLowerCase().includes(q)
        );
      })
      .slice(0, 30);
  }, [allProfiles, selectedSegment, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#060D18]/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-cases-title"
    >
      <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl border border-[var(--border-hairline)] w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Cabecera minimalista */}
        <div className="px-6 py-4 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="md" />
            <div className="min-w-0">
              <h2
                id="demo-cases-title"
                className="font-display text-lg font-semibold text-[var(--text-primary)] truncate"
              >
                Casos sintéticos
              </h2>
              <p className="text-xs text-[var(--text-muted)] truncate">
                Selecciona un negocio simulado para evaluarlo (sin datos reales).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de casos sintéticos"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Selector rápido de vista */}
        <div className="px-6 pt-4 pb-3 border-b border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setViewMode("guiados")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === "guiados"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Recomendados (3)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("catalogo")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === "catalogo"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Catálogo completo ({allProfiles.length.toLocaleString("es-PE")})
            </button>
          </div>

          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Semilla 20260501 · Reproducible
          </span>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {viewMode === "guiados" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {officialCases.map((item) => (
                  <button
                    key={item.codigo}
                    type="button"
                    onClick={() => onSelectProfile(item.perfil)}
                    className="group text-left p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-[var(--accent-teal)] hover:bg-[var(--accent-teal-soft)] transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="font-semibold text-[var(--accent-teal)]">
                          {item.codigo}
                        </span>
                        <span className="text-[var(--text-muted)] tabular-nums">
                          {item.perfil.id}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {item.titulo}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                          {item.subtitulo}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-hairline)] flex items-end justify-between gap-2">
                      <MiniSeasonBars ventas={item.perfil.input.ventas} />
                      <div className="text-right">
                        <p className="text-xs font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                          S/ {item.perfil.input.credito.montoSolicitado.toLocaleString("es-PE")}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-teal)] mt-0.5">
                          Evaluar
                          <ArrowRight className="w-3 h-3" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4 pt-2 text-xs text-[var(--text-muted)]">
                <span>¿Buscas otro sector, región o nivel de estacionalidad?</span>
                <button
                  type="button"
                  onClick={() => setViewMode("catalogo")}
                  className="font-semibold text-[var(--accent-teal)] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                >
                  Explorar los {allProfiles.length.toLocaleString("es-PE")} perfiles →
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              {/* Buscador y filtro */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar código, actividad o departamento..."
                    aria-label="Buscar perfil sintético"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-hairline)] rounded-lg focus:outline-none focus:border-[var(--accent-teal)]"
                  />
                </div>
                <select
                  value={selectedSegment}
                  onChange={(e) =>
                    setSelectedSegment(e.target.value as "Todos" | SegmentoSintetico)
                  }
                  aria-label="Filtrar por segmento sintético"
                  className="px-3 py-2 text-sm border border-[var(--border-hairline)] rounded-lg bg-[var(--bg-canvas)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-teal)]"
                >
                  {SEGMENTOS.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg === "Todos"
                        ? `Todos (${allProfiles.length})`
                        : `${seg} (${segmentCounts.get(seg) ?? 0})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arquetipos rápidos desplegables */}
              <details className="border border-[var(--border-hairline)] rounded-lg bg-[var(--bg-elevated)]">
                <summary className="px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] cursor-pointer select-none flex items-center justify-between">
                  <span>Arquetipos por segmento ({featured.length})</span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] font-normal">
                    Acceso directo
                  </span>
                </summary>
                <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 border-t border-[var(--border-hairline)] mt-1 pt-3">
                  {featured.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectProfile(p)}
                      className="text-left p-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-teal)] hover:bg-[var(--accent-teal-soft)] transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                        <span>{p.id}</span>
                        <span>{p.estacionalidadNivel}</span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-primary)] mt-1 line-clamp-1">
                        {p.tituloCaso}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{p.segmento}</p>
                    </button>
                  ))}
                </div>
              </details>

              {/* Tabla compacta */}
              <div className="border border-[var(--border-hairline)] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">ID</th>
                      <th className="py-2.5 px-3 font-medium">Negocio y zona</th>
                      <th className="py-2.5 px-3 font-medium hidden md:table-cell">Segmento</th>
                      <th className="py-2.5 px-3 font-medium text-right">Monto</th>
                      <th className="py-2.5 px-3 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="py-2.5 px-3 font-mono tabular-nums text-[var(--text-muted)] whitespace-nowrap">
                          {p.id}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-[var(--text-primary)]">{p.tituloCaso}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{p.resumenBreve}</p>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)] hidden md:table-cell">
                          {p.segmento}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[var(--text-primary)] whitespace-nowrap">
                          S/ {p.input.credito.montoSolicitado.toLocaleString("es-PE")}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectProfile(p)}
                            className="px-3 py-1.5 text-xs font-semibold text-[var(--accent-teal)] bg-[var(--accent-teal-soft)] hover:opacity-85 rounded-md transition-opacity whitespace-nowrap"
                          >
                            Cargar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                          Sin resultados para ese criterio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">
                Mostrando {filtered.length} de {allProfiles.length.toLocaleString("es-PE")} perfiles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
