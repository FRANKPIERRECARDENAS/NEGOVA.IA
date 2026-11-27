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
  ModoEvaluacionShock,
  ParametrosFenomeno,
  ResultadoPredictivo,
  ResultadoSimulacionExterna,
  TipoFenomenoExterno,
} from "../../types/negova";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { StepVisual } from "./StepVisual";

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
  const totalPeriods = Math.max(1, baselinePredictivo.proyecciones.length);
  const [fenomeno, setFenomeno] = useState<TipoFenomenoExterno>(
    simulacion?.parametros.fenomeno ?? "Fenómeno El Niño"
  );
  const [intensidad, setIntensidad] = useState<IntensidadFenomeno>(
    simulacion?.parametros.intensidad ?? "Severo"
  );
  const [mesInicioPeriodo, setMesInicioPeriodo] = useState<number>(
    simulacion?.parametros.mesInicioPeriodo ?? 1
  );
  const [duracionMeses, setDuracionMeses] = useState<number>(
    simulacion?.parametros.duracionMeses ?? Math.min(4, totalPeriods)
  );
  const [magnitudAdicionalPct, setMagnitudAdicionalPct] = useState<number>(
    simulacion?.parametros.magnitudAdicionalPct ?? 0
  );
  const [modoEvaluacion, setModoEvaluacion] = useState<ModoEvaluacionShock>(
    simulacion?.parametros.modoEvaluacion ?? "preventivo"
  );

  const chartData = (simulacion?.predictivoEstresado.proyecciones ?? []).map((p, idx) => ({
    periodo: p.etiquetaPeriodo,
    utilidadBase: baselinePredictivo.proyecciones[idx]?.utilidadNetaDisponible ?? 0,
    utilidadEstres: p.utilidadNetaDisponible,
    cuotaAdaptada: simulacion?.comparacionEstresada.adaptado.cuotas[idx]?.cuotaTotal ?? 0,
  }));

  return (
    <div className="space-y-7">
      <div className="pb-5 border-b border-[var(--border-hairline)] flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--accent-teal)]">08 · Prueba de estrés</p>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
            Escenarios externos
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Elige un evento hipotético e intensidad para medir la resistencia del crédito.
          </p>
        </div>
        <StepVisual step={8} />
      </div>

      {/* Controles esenciales */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <span className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Evento externo
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

          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div>
              <span className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Intensidad
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

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  onRunSimulation({
                    fenomeno,
                    intensidad,
                    mesInicioPeriodo,
                    duracionMeses,
                    magnitudAdicionalPct,
                    modoEvaluacion,
                  })
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--text-on-ink)] bg-[var(--bg-ink)] hover:bg-[var(--bg-ink-subtle)] dark:bg-[var(--accent-teal)] dark:text-[#041418] dark:hover:bg-[var(--accent-teal-hover)] rounded-lg transition-colors whitespace-nowrap"
              >
                <CloudLightning className="w-4 h-4 text-[var(--accent-teal-ink)] dark:text-[#041418]" />
                Simular escenario
              </button>

              {simulacion && (
                <button
                  type="button"
                  onClick={onClearSimulation}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] rounded-lg transition-colors whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restablecer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Parámetros avanzados colapsables */}
        <CollapsiblePanel
          title="Ajustes avanzados del evento"
          summary={`Inicio P${mesInicioPeriodo} · ${duracionMeses}m · ${
            modoEvaluacion === "preventivo" ? "Preventivo" : "Sobrevenido"
          }`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { id: "preventivo", label: "Preventivo (re-optimiza cronograma)" },
                  { id: "sobrevenido", label: "Sobrevenido (cronograma vigente)" },
                ] as const
              ).map((m) => {
                const active = modoEvaluacion === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setModoEvaluacion(m.id)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium text-left transition-colors ${
                      active
                        ? "border-[var(--accent-teal)] bg-[var(--accent-teal-soft)] text-[var(--text-primary)] font-semibold"
                        : "border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="shock-inicio"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Periodo inicio (P1..P{totalPeriods})
                </label>
                <input
                  id="shock-inicio"
                  type="number"
                  min={1}
                  max={totalPeriods}
                  value={mesInicioPeriodo}
                  onChange={(e) =>
                    setMesInicioPeriodo(
                      Math.max(1, Math.min(totalPeriods, Number(e.target.value) || 1))
                    )
                  }
                  className="w-full h-10 px-3 text-xs font-mono tabular-nums bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="shock-duracion"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Duración (periodos)
                </label>
                <input
                  id="shock-duracion"
                  type="number"
                  min={1}
                  max={totalPeriods}
                  value={duracionMeses}
                  onChange={(e) =>
                    setDuracionMeses(
                      Math.max(1, Math.min(totalPeriods, Number(e.target.value) || 1))
                    )
                  }
                  className="w-full h-10 px-3 text-xs font-mono tabular-nums bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="shock-magnitud"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Severidad extra ({magnitudAdicionalPct >= 0 ? "+" : ""}
                  {magnitudAdicionalPct}%)
                </label>
                <input
                  id="shock-magnitud"
                  type="range"
                  min={-20}
                  max={30}
                  step={5}
                  value={magnitudAdicionalPct}
                  onChange={(e) => setMagnitudAdicionalPct(Number(e.target.value))}
                  className="w-full h-10 accent-[var(--accent-teal)]"
                />
              </div>
            </div>
          </div>
        </CollapsiblePanel>
      </div>

      {/* Resultados de estrés */}
      {simulacion ? (
        <div className="space-y-5">
          <p className="text-xs text-[var(--accent-warning)] bg-[var(--accent-warning-soft)] border border-[var(--accent-warning)]/35 rounded-lg px-4 py-2.5">
            Escenario hipotético: {simulacion.parametros.fenomeno} ({simulacion.parametros.intensidad}) — no constituye un pronóstico real.
          </p>

          {/* KPIs esenciales */}
          <div className="grid grid-cols-2 lg:grid-cols-5 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-hairline)] bg-[var(--bg-surface)]">
            <div className="p-4">
              <p className="text-xs text-[var(--text-muted)]">Ventas</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[var(--accent-risk)] mt-1">
                {simulacion.impactoVentasPct}%
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-[var(--text-muted)]">Costos</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[var(--accent-warning)] mt-1">
                +{simulacion.impactoCostosPct}%
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-[var(--text-muted)]">Utilidad</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[var(--accent-risk)] mt-1">
                {simulacion.impactoUtilidadPct}%
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-[var(--text-muted)]">Incumpl. Fijo</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[var(--accent-risk)] mt-1">
                {simulacion.cuotasQueIncumplenFijo} /{" "}
                {simulacion.sobrevenido.incumplimientosFijoOriginal}
              </p>
            </div>
            <div className="p-4 col-span-2 lg:col-span-1">
              <p className="text-xs text-[var(--text-muted)]">Incumpl. Adapt.</p>
              <p
                className={`text-xl font-semibold font-mono tabular-nums mt-1 ${
                  simulacion.cuotasQueIncumplenAdaptado > 0 ||
                  simulacion.sobrevenido.incumplimientosAdaptadoOriginal > 0
                    ? "text-[var(--accent-warning)]"
                    : "text-[var(--accent-teal)]"
                }`}
              >
                {simulacion.cuotasQueIncumplenAdaptado} /{" "}
                {simulacion.sobrevenido.incumplimientosAdaptadoOriginal}
              </p>
            </div>
          </div>

          {/* Gráfico comparativo */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-hairline)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Utilidad base vs. escenario estresado
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

            <div className="h-60 w-full">
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
                        utilidadBase: "Utilidad base",
                        utilidadEstres: "Utilidad estresada",
                        cuotaAdaptada: "Cuota adaptada",
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

          <CollapsiblePanel
            title="Detalle preventivo vs. sobrevenido y periodos críticos"
            summary={
              simulacion.comparacionEstresada.adaptado.viable
                ? "Viable bajo estrés"
                : "No viable bajo estrés"
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">
                  Evento sobrevenido (sin reprogramar)
                </p>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {simulacion.sobrevenido.resumen}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">
                  Re-optimización preventiva y factores
                </p>
                <p className="text-[var(--text-secondary)] font-mono tabular-nums">
                  Utilidad prom.: S/ {baselinePredictivo.utilidadNetaPromedio.toLocaleString("es-PE")} →
                  S/ {simulacion.predictivoEstresado.utilidadNetaPromedio.toLocaleString("es-PE")}
                </p>
                <p className="text-[var(--text-muted)] font-mono">
                  Periodos críticos:{" "}
                  {simulacion.mesesCriticos.length > 0
                    ? simulacion.mesesCriticos.join(" · ")
                    : "Ninguno"}
                </p>
                <p className="text-[var(--text-muted)] font-mono">
                  Geográfico {simulacion.factorGeograficoAplicado}x · Sectorial{" "}
                  {simulacion.sensibilidadSectorialAplicada}x
                </p>
              </div>
            </div>
          </CollapsiblePanel>
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-dashed border-[var(--border-strong)] rounded-xl p-6 text-center text-xs text-[var(--text-secondary)]">
          Elige un evento e intensidad arriba y pulsa <strong>Simular escenario</strong>.
        </div>
      )}
    </div>
  );
}
