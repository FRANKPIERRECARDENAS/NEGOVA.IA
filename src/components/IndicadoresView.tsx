import { useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import { computeSyntheticValidationIndicators } from "../engines/validationBenchmarks";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggleButton } from "./ThemeToggleButton";

interface IndicadoresViewProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onBack: () => void;
  onStartAnalysis: () => void;
}

export function IndicadoresView({
  theme,
  onToggleTheme,
  onBack,
  onStartAnalysis,
}: IndicadoresViewProps) {
  const data = useMemo(() => computeSyntheticValidationIndicators(), []);
  const [groupTab, setGroupTab] = useState<
    "segmento" | "actividad" | "estacionalidad" | "volatilidad"
  >("segmento");

  const { backtestTemporal: bt, experimentoCompleto: exp } = data;

  const activeGroups =
    groupTab === "segmento"
      ? exp.porSegmento
      : groupTab === "actividad"
      ? exp.porActividadTop
      : groupTab === "estacionalidad"
      ? exp.porEstacionalidad
      : exp.porVolatilidad;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      <header className="bg-[var(--bg-canvas)]/92 backdrop-blur-sm border-b border-[var(--border-hairline)] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <BrandLogo size="sm" className="w-5 h-5" />
              <span className="font-display font-bold text-[var(--text-primary)] hidden sm:inline">
                NEGOVA.IA
              </span>
              <span className="sm:hidden">Volver</span>
            </button>
            <span className="text-[var(--border-strong)]" aria-hidden="true">
              /
            </span>
            <h1 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)] truncate">
              Indicadores, Backtesting y Experimentos (1,000 perfiles)
            </h1>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={onStartAnalysis}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--text-on-ink)] bg-[var(--bg-ink)] dark:bg-[var(--accent-teal)] dark:text-[#060D18] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              Analizar un negocio
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Nota metodológica */}
        <section className="pb-6 border-b border-[var(--border-hairline)] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-[var(--accent-teal)]">
              Bloque 1 · Métricas reales de ejecución sobre muestra reservada (
              {data.perfilesPruebaHoldout} perfiles) y cohorte completa ({exp.totalPerfilesEvaluados}{" "}
              perfiles)
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed max-w-3xl">
              {data.notaMetodologica}
            </p>
          </div>
          <div className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-lg px-3.5 py-2 shrink-0">
            Semilla {exp.semilla} · Predictivo {exp.tiempoAnalisisPredictivoMs} ms · Optimización{" "}
            {exp.tiempoOptimizacionMs} ms
          </div>
        </section>

        {/* Tier 1: Ledger de métricas principales */}
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0">
            <div className="p-6 border-b border-[var(--border-hairline)] sm:border-r">
              <p className="text-xs text-[var(--text-muted)]">
                Validez matemática independiente (1,000 casos)
              </p>
              <p className="text-2xl font-semibold text-[var(--accent-positive)] font-mono tabular-nums mt-2">
                {exp.porcentajeCronogramasMatematicamenteValidos}%
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Reglas V1–V5 verificadas · Tiempo prom. {data.tiempoPromedioMs} ms/caso
              </p>
            </div>

            <div className="p-6 border-b border-[var(--border-hairline)] lg:border-r">
              <p className="text-xs text-[var(--text-muted)]">
                Viabilidad de cronogramas (Holdout 200)
              </p>
              <p className="text-2xl font-semibold text-[var(--accent-teal)] font-mono tabular-nums mt-2">
                {data.porcentajeCronogramasAdaptadosViables}%
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Frente a {data.porcentajeCronogramasFijosViables}% con cuota fija tradicional (
                {data.casosNoViablesAdaptadoHoldout} rechazados)
              </p>
            </div>

            <div className="p-6 border-b border-[var(--border-hairline)] sm:border-r lg:border-r-0">
              <p className="text-xs text-[var(--text-muted)]">
                Incumplimientos detectados (Holdout 200)
              </p>
              <p className="text-2xl font-semibold text-[var(--accent-positive)] font-mono tabular-nums mt-2">
                {data.incumplimientosAdaptado}{" "}
                <span className="text-sm font-normal text-[var(--text-muted)]">
                  vs. {data.incumplimientosTradicional} en fijo
                </span>
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Periodos donde Cuota / Utilidad supera el factor del producto
              </p>
            </div>

            <div className="p-6 border-b sm:border-b-0 lg:border-r border-[var(--border-hairline)]">
              <p className="text-xs text-[var(--text-muted)]">
                Backtest Rolling-Origin ({bt.totalObservacionesOutOfSample.toLocaleString("es-PE")}{" "}
                obs.)
              </p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] font-mono tabular-nums mt-2">
                WAPE {bt.wapeGlobalPct}%{" "}
                <span className="text-sm font-normal text-[var(--text-muted)]">
                  (MAE S/ {bt.maeGlobal.toLocaleString("es-PE")})
                </span>
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Supera Baseline Ingenuo ({bt.wapeBaselineIngenuoPct}%) y Estacional Puro (
                {bt.wapeBaselineEstacionalPct}%)
              </p>
            </div>

            <div className="p-6 border-b sm:border-b-0 sm:border-r border-[var(--border-hairline)]">
              <p className="text-xs text-[var(--text-muted)]">
                Calibración de intervalo 80% y sesgo
              </p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] font-mono tabular-nums mt-2">
                {bt.coberturaIntervalo80Pct}%{" "}
                <span className="text-sm font-normal text-[var(--text-muted)]">
                  cobertura · Sesgo {bt.sesgoGlobalPct}%
                </span>
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                RMSE global S/ {bt.rmseGlobal.toLocaleString("es-PE")} · Peor segmento:{" "}
                {bt.peorSegmento}
              </p>
            </div>

            <div className="p-6">
              <p className="text-xs text-[var(--text-muted)]">
                Cuantiles Delta de Costo (Adaptado − Fijo)
              </p>
              <p className="text-xl font-semibold text-[var(--accent-teal)] font-mono tabular-nums mt-2">
                Mediana +S/ {exp.distribucionDeltaCosto.medianaP50}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono tabular-nums">
                P25: S/ {exp.distribucionDeltaCosto.p25} · P75: +S/ {exp.distribucionDeltaCosto.p75}
              </p>
            </div>
          </div>
        </section>

        {/* Tier 2: Backtesting Temporal Rolling-Origin */}
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-mono text-[var(--accent-teal)]">
                Bloque 2 · Validación temporal sin fuga de futuro
              </p>
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mt-0.5">
                Backtesting rolling-origin vs. Baselines de referencia
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">{bt.notaMetodologicaBacktest}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Segmento</th>
                  <th className="py-2.5 px-3 font-medium text-right">Obs.</th>
                  <th className="py-2.5 px-3 font-medium text-right">MAE (S/)</th>
                  <th className="py-2.5 px-3 font-medium text-right">RMSE (S/)</th>
                  <th className="py-2.5 px-3 font-medium text-right">WAPE NEGOVA</th>
                  <th className="py-2.5 px-3 font-medium text-right">Baseline Ingenuo</th>
                  <th className="py-2.5 px-3 font-medium text-right">Baseline Estacional</th>
                  <th className="py-2.5 px-3 font-medium text-right">Sesgo</th>
                  <th className="py-2.5 px-3 font-medium text-right">Cob. 80%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {bt.porSegmento.map((row) => (
                  <tr
                    key={row.segmento}
                    className={
                      row.esPeorRendimiento
                        ? "bg-[var(--accent-warning-soft)]"
                        : "hover:bg-[var(--bg-elevated)]"
                    }
                  >
                    <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                      {row.segmento}
                      {row.esPeorRendimiento && (
                        <span className="ml-2 text-[10px] font-mono text-[var(--accent-warning)]">
                          [Mayor error]
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {row.evaluaciones}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      S/ {row.maeNegova.toLocaleString("es-PE")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      S/ {row.rmseNegova.toLocaleString("es-PE")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[var(--accent-teal)]">
                      {row.wapeNegovaPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--text-muted)]">
                      {row.wapeIngenuoPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--text-muted)]">
                      {row.wapeEstacionalPuroPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {row.sesgoPct > 0 ? "+" : ""}
                      {row.sesgoPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {row.cobertura80Pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tier 3: Experimento Controlado 1,000 perfiles */}
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-mono text-[var(--accent-teal)]">
                Bloque 3 · Experimento controlado sobre 1,000 perfiles
              </p>
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mt-0.5">
                Desempeño financiero por segmento, actividad, estacionalidad y volatilidad
              </h2>
            </div>

            <div className="inline-flex flex-wrap border border-[var(--border-hairline)] rounded-lg bg-[var(--bg-canvas)] p-0.5">
              {(
                [
                  { id: "segmento", label: "Segmentos (5)" },
                  { id: "actividad", label: "Actividades top" },
                  { id: "estacionalidad", label: "Estacionalidad" },
                  { id: "volatilidad", label: "Volatilidad" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setGroupTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    groupTab === t.id
                      ? "bg-[var(--bg-ink)] text-[var(--text-on-ink)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Grupo</th>
                  <th className="py-2.5 px-3 font-medium text-right">Perfiles</th>
                  <th className="py-2.5 px-3 font-medium text-right">Viab. Fijo</th>
                  <th className="py-2.5 px-3 font-medium text-right">Viab. Adaptado</th>
                  <th className="py-2.5 px-3 font-medium text-right">Incumpl. Fijo</th>
                  <th className="py-2.5 px-3 font-medium text-right">Incumpl. Adapt.</th>
                  <th className="py-2.5 px-3 font-medium text-right">Trad. ≥ Adapt.</th>
                  <th className="py-2.5 px-3 font-medium text-right">CV Cuota</th>
                  <th className="py-2.5 px-3 font-medium text-right">Δ Costo prom.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {activeGroups.map((g) => (
                  <tr key={g.clave} className="hover:bg-[var(--bg-elevated)]">
                    <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                      {g.clave}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{g.perfiles}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {g.viabilidadTradicionalPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[var(--accent-teal)]">
                      {g.viabilidadAdaptadoPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--accent-risk)]">
                      {g.incumplimientosTradicional}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--accent-positive)]">
                      {g.incumplimientosAdaptado}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {g.tradicionalMejorOIgualPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {g.variabilidadCVAdaptadoPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {g.deltaCostoPromedio >= 0 ? "+" : ""}S/ {g.deltaCostoPromedio}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Análisis de sensibilidad y diagnóstico de casos fallidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-hairline)]">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-2.5">
                Análisis de sensibilidad (factor de capacidad y caída de ingresos)
              </h3>
              <div className="border border-[var(--border-hairline)] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                    <tr>
                      <th className="py-2 px-3 font-medium">Escenario</th>
                      <th className="py-2 px-3 font-medium text-right">Viab. Fijo</th>
                      <th className="py-2 px-3 font-medium text-right">Viab. Adapt.</th>
                      <th className="py-2 px-3 font-medium text-right">Incumpl.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {exp.analisisSensibilidad.map((s) => (
                      <tr key={s.escenario}>
                        <td className="py-2 px-3 text-[var(--text-secondary)]">{s.escenario}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">
                          {s.viabilidadTradicionalPct}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-[var(--accent-teal)] font-semibold">
                          {s.viabilidadAdaptadoPct}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">
                          {s.incumplimientosTradicional} / {s.incumplimientosAdaptado}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-4 space-y-2">
                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-warning)]" />
                  Diagnóstico transparente de casos no viables ({exp.casosFallidosAdaptado.totalNoViables} de 1,000)
                </p>
                <p className="text-[var(--text-secondary)]">
                  • Capital no liquidable al límite de capacidad:{" "}
                  <strong className="font-mono text-[var(--text-primary)]">
                    {exp.casosFallidosAdaptado.porSaldoPendiente}
                  </strong>
                </p>
                <p className="text-[var(--text-secondary)]">
                  • Déficit para cubrir intereses/seguros corrientes:{" "}
                  <strong className="font-mono text-[var(--text-primary)]">
                    {exp.casosFallidosAdaptado.porDeficitInteresesSeguros}
                  </strong>
                </p>
                <p className="text-[var(--text-secondary)]">
                  • Incompatibilidad de regla de producto (BCRP/plazo):{" "}
                  <strong className="font-mono text-[var(--text-primary)]">
                    {exp.casosFallidosAdaptado.porReglaProducto}
                  </strong>
                </p>
              </div>

              <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-4 space-y-1.5">
                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                  Limitaciones metodológicas explícitas
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[var(--text-muted)]">
                  {exp.limitacionesExperimento.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tier 4: Indicadores que requieren piloto institucional real con Caja Trujillo */}
        <section className="bg-[var(--bg-ink)] text-[var(--text-on-ink)] border border-[var(--border-ink)] rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-teal-ink)]" />
            <h2 className="font-display text-base font-semibold">
              Bloque 4 · Indicadores pendientes de piloto institucional con Caja Trujillo
            </h2>
          </div>
          <p className="text-xs text-[var(--text-on-ink-muted)] leading-relaxed max-w-3xl">
            En cumplimiento estricto del principio de cero datos inventados, los siguientes
            indicadores de impacto comercial y de cartera requieren despliegue en piloto controlado
            con historial real de créditos de Caja Trujillo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="border border-[var(--border-ink)] rounded-lg p-3.5">
              <p className="text-[var(--text-on-ink-muted)]">Morosidad observada (PAR &gt; 30d)</p>
              <p className="font-mono text-[var(--accent-teal-ink)] font-semibold mt-1">
                Requiere piloto en cartera real
              </p>
            </div>
            <div className="border border-[var(--border-ink)] rounded-lg p-3.5">
              <p className="text-[var(--text-on-ink-muted)]">Tasa de aceptación comercial en campo</p>
              <p className="font-mono text-[var(--accent-teal-ink)] font-semibold mt-1">
                Requiere prueba con asesores
              </p>
            </div>
            <div className="border border-[var(--border-ink)] rounded-lg p-3.5">
              <p className="text-[var(--text-on-ink-muted)]">Integración core bancario y SBS/RCC</p>
              <p className="font-mono text-[var(--accent-teal-ink)] font-semibold mt-1">
                Roadmap fase piloto institucional
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
