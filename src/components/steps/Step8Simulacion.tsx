import { useState } from "react";
import { CloudLightning, RefreshCw } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IntensidadFenomeno,
  ParametrosFenomeno,
  ResultadoPredictivo,
  ResultadoSimulacionExterna,
  TipoFenomenoExterno,
} from "../../types/negova";

interface Step8SimulacionProps {
  baselinePredictivo: ResultadoPredictivo;
  simulacion: ResultadoSimulacionExterna | null;
  onRunSimulation: (params: ParametrosFenomeno) => void;
  onClearSimulation: () => void;
}

const FENOMENOS: TipoFenomenoExterno[] = [
  "Fenómeno El Niño",
  "Inundaciones",
  "Sequías",
  "Retraso de campañas",
  "Caída extraordinaria de ventas",
  "Incremento de costos",
];

const INTENSIDADES: IntensidadFenomeno[] = ["Moderado", "Severo", "Extremo"];

export function Step8Simulacion({
  baselinePredictivo,
  simulacion,
  onRunSimulation,
  onClearSimulation,
}: Step8SimulacionProps) {
  const [fenomeno, setFenomeno] = useState<TipoFenomenoExterno>(
    simulacion?.parametros.fenomeno ?? "Fenómeno El Niño"
  );
  const [intensidad, setIntensidad] = useState<IntensidadFenomeno>(
    simulacion?.parametros.intensidad ?? "Severo"
  );

  const chartData = (simulacion?.predictivoEstresado.proyecciones ?? []).map((p, idx) => ({
    periodo: p.etiquetaPeriodo,
    utilidadBase: baselinePredictivo.proyecciones[idx]?.utilidadNetaDisponible ?? 0,
    utilidadEstres: p.utilidadNetaDisponible,
    cuotaAdaptada: simulacion?.comparacionEstresada.adaptado.cuotas[idx]?.cuotaTotal ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--accent-teal)]">
            Etapa 08 · Prueba de estrés hipotética
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
            8. Simulador de escenarios externos
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Evalúa cómo eventos climáticos o choques de mercado afectan la utilidad neta y la
            sostenibilidad de ambos cronogramas.
          </p>
        </div>
        <span className="text-xs font-mono text-[var(--accent-warning)] border border-[var(--accent-warning)]/40 bg-[var(--accent-warning-soft)] px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
          Escenario hipotético · No es pronóstico real
        </span>
      </div>

      {/* Controles de simulación */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="block text-xs font-medium text-[var(--text-secondary)] mb-2.5">
              Seleccionar fenómeno externo
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FENOMENOS.map((fen) => {
                const active = fenomeno === fen;
                return (
                  <button
                    key={fen}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFenomeno(fen)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors duration-150 ${
                      active
                        ? "border-[var(--accent-teal)] bg-[var(--accent-teal-soft)] text-[var(--text-primary)] font-semibold"
                        : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {fen}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div>
              <span className="block text-xs font-medium text-[var(--text-secondary)] mb-2.5">
                Nivel de intensidad del choque
              </span>
              <div className="grid grid-cols-3 gap-2">
                {INTENSIDADES.map((lvl) => {
                  const active = intensidad === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setIntensidad(lvl)}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors duration-150 ${
                        active
                          ? "border-[var(--bg-ink)] bg-[var(--bg-ink)] text-[var(--text-on-ink)] dark:border-[var(--accent-teal)] dark:bg-[var(--accent-teal)] dark:text-[#041418]"
                          : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onRunSimulation({ fenomeno, intensidad })}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--text-on-ink)] bg-[var(--bg-ink)] hover:bg-[var(--bg-ink-subtle)] dark:bg-[var(--accent-teal)] dark:text-[#041418] dark:hover:bg-[var(--accent-teal-hover)] rounded-lg transition-colors whitespace-nowrap"
              >
                <CloudLightning className="w-4 h-4 text-[var(--accent-teal-ink)] dark:text-[#041418]" />
                Simular escenarios externos
              </button>

              {simulacion && (
                <button
                  type="button"
                  onClick={onClearSimulation}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] rounded-lg transition-colors whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restablecer escenario base
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resultados de estrés */}
      {simulacion ? (
        <div className="space-y-6">
          <div className="bg-[var(--accent-warning-soft)] border border-[var(--accent-warning)]/40 rounded-lg px-4 py-3 text-xs text-[var(--text-primary)] leading-relaxed">
            <strong className="font-semibold text-[var(--accent-warning)]">
              Escenario hipotético activo:
            </strong>{" "}
            {simulacion.parametros.fenomeno} (intensidad {simulacion.parametros.intensidad}). Esta
            prueba de estrés modifica las variables de ventas y costos mediante parámetros
            explícitos y recalcula ambos cronogramas; no constituye una predicción meteorológica ni
            un pronóstico real de eventos futuros.
          </div>

          {/* Ledger de impactos */}
          <div className="grid grid-cols-2 lg:grid-cols-5 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-hairline)] bg-[var(--bg-surface)]">
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Impacto en ventas
              </p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[var(--accent-risk)] mt-2">
                {simulacion.impactoVentasPct}%
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Impacto en costos
              </p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[var(--accent-warning)] mt-2">
                +{simulacion.impactoCostosPct}%
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Impacto en utilidad
              </p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[var(--accent-risk)] mt-2">
                {simulacion.impactoUtilidadPct}%
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Incumpl. (Plan Fijo)
              </p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[var(--accent-risk)] mt-2">
                {simulacion.cuotasQueIncumplenFijo}
              </p>
            </div>
            <div className="p-4 sm:p-5 col-span-2 lg:col-span-1">
              <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Incumpl. (Adaptado)
              </p>
              <p
                className={`text-xl font-semibold font-mono tabular-nums mt-2 ${
                  simulacion.cuotasQueIncumplenAdaptado > 0
                    ? "text-[var(--accent-warning)]"
                    : "text-[var(--accent-teal)]"
                }`}
              >
                {simulacion.cuotasQueIncumplenAdaptado}
              </p>
            </div>
          </div>

          {/* Periodos críticos */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg px-4 py-3 text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">
              Periodos críticos bajo estrés:{" "}
            </span>
            <span className="font-mono">
              {simulacion.mesesCriticos.length > 0
                ? simulacion.mesesCriticos.join(" · ")
                : "Ningún periodo presenta caída severa ni incumplimiento crítico."}
            </span>
          </div>

          {/* Gráfico comparativo de utilidad base vs estresada */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 pb-4 border-b border-[var(--border-hairline)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Utilidad neta base vs. Escenario hipotético estresado
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-xs inline-block"
                    style={{ backgroundColor: "var(--chart-bar-base)" }}
                    aria-hidden="true"
                  />
                  Base
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--accent-warning)]">
                  <span
                    className="w-2.5 h-2.5 rounded-xs inline-block"
                    style={{ backgroundColor: "var(--accent-warning)" }}
                    aria-hidden="true"
                  />
                  Estresada
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-teal)]">
                  <span
                    className="w-3 h-0.5 inline-block"
                    style={{ backgroundColor: "var(--accent-teal)" }}
                    aria-hidden="true"
                  />
                  Cuota adaptada
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--chart-grid)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
                    axisLine={{ stroke: "var(--border-hairline)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `S/${Math.round(Number(v))}`}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--chart-tooltip-bg)",
                      borderColor: "var(--chart-tooltip-border)",
                      color: "var(--chart-tooltip-text)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "var(--chart-tooltip-text)" }}
                    labelStyle={{ color: "var(--text-on-ink-muted)", fontWeight: 600 }}
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        utilidadBase: "Utilidad neta base",
                        utilidadEstres: "Utilidad bajo escenario hipotético",
                        cuotaAdaptada: "Cuota adaptada recalculada",
                      };
                      return [
                        `S/ ${Number(value).toLocaleString("es-PE")}`,
                        labels[String(name)] ?? String(name),
                      ];
                    }}
                  />
                  <Bar
                    dataKey="utilidadBase"
                    fill="var(--chart-bar-base)"
                    radius={[3, 3, 0, 0]}
                    barSize={16}
                  />
                  <Bar
                    dataKey="utilidadEstres"
                    fill="var(--accent-warning)"
                    radius={[3, 3, 0, 0]}
                    barSize={16}
                  />
                  <Line
                    type="monotone"
                    dataKey="cuotaAdaptada"
                    stroke="var(--accent-teal)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "var(--accent-teal)", strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-dashed border-[var(--border-strong)] rounded-xl p-8 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Aún no se ha ejecutado una prueba de estrés externo
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-md mx-auto leading-relaxed">
            Selecciona un fenómeno y una intensidad arriba y pulsa{" "}
            <strong className="font-semibold text-[var(--text-primary)]">
              Simular escenarios externos
            </strong>{" "}
            para recalcular flujos y cronogramas.
          </p>
        </div>
      )}
    </div>
  );
}
