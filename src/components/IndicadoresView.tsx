import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
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
              Indicadores de validación sintética
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
        <section className="pb-6 border-b border-[var(--border-hairline)]">
          <p className="text-xs font-mono text-[var(--accent-teal)]">
            Evaluación fuera de ajuste · Muestra reservada ({data.perfilesPruebaHoldout} perfiles)
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed max-w-3xl">
            {data.notaMetodologica}
          </p>
        </section>

        {/* Ledger de métricas principales con divisiones limpias */}
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:grid-flow-row">
            <div className="p-6 border-b border-[var(--border-hairline)] sm:border-r">
              <p className="text-xs text-[var(--text-muted)]">Tiempo promedio de análisis</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] font-mono tabular-nums mt-2">
                {data.tiempoPromedioMs} ms
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Ejecución predictiva y optimización financiera por perfil
              </p>
            </div>

            <div className="p-6 border-b border-[var(--border-hairline)] lg:border-r">
              <p className="text-xs text-[var(--text-muted)]">
                Cronogramas que respetan restricciones
              </p>
              <p className="text-2xl font-semibold text-[var(--accent-teal)] font-mono tabular-nums mt-2">
                {data.porcentajeCronogramasAdaptadosViables}%
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Frente a {data.porcentajeCronogramasFijosViables}% con cuota fija tradicional
              </p>
            </div>

            <div className="p-6 border-b border-[var(--border-hairline)] sm:border-r lg:border-r-0">
              <p className="text-xs text-[var(--text-muted)]">
                Incumplimientos detectados (muestra 200)
              </p>
              <p className="text-2xl font-semibold text-[var(--accent-positive)] font-mono tabular-nums mt-2">
                {data.incumplimientosAdaptado}{" "}
                <span className="text-sm font-normal text-[var(--text-muted)]">
                  vs. {data.incumplimientosTradicional} en fijo
                </span>
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Periodos donde Cuota / Utilidad excede el factor del producto
              </p>
            </div>

            <div className="p-6 border-b sm:border-b-0 lg:border-r border-[var(--border-hairline)]">
              <p className="text-xs text-[var(--text-muted)]">
                Error MAE predictivo (holdout sintético)
              </p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] font-mono tabular-nums mt-2">
                S/ {data.maePredictivo.toLocaleString("es-PE")}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Error absoluto medio mensual frente a los 12 meses reservados
              </p>
            </div>

            <div className="p-6 border-b sm:border-b-0 sm:border-r border-[var(--border-hairline)]">
              <p className="text-xs text-[var(--text-muted)]">
                Error porcentual WAPE (holdout sintético)
              </p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] font-mono tabular-nums mt-2">
                {data.wapePredictivoPct}%
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Sobre {data.perfilesPruebaHoldout} perfiles sintéticos reservados
              </p>
            </div>

            <div className="p-6">
              <p className="text-xs text-[var(--text-muted)]">
                Reducción de presión máxima (Cuota/Utilidad)
              </p>
              <p className="text-2xl font-semibold text-[var(--accent-teal)] font-mono tabular-nums mt-2">
                {data.reduccionRatioPromedioPct}%
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Alivio promedio del ratio pico entre plan fijo y adaptado
              </p>
            </div>
          </div>
        </section>

        {/* Distribución de la base sintética */}
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Composición de la base de pruebas sintética ({data.totalPerfilesBase} perfiles)
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Distribución sintética diseñada para probar estabilidad y estacionalidad; no refleja
            cartera real institucional.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="border-b border-[var(--border-hairline)] text-xs text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 pr-4 font-medium">Segmento sintético</th>
                  <th className="py-2.5 px-4 font-medium text-right">Perfiles</th>
                  <th className="py-2.5 pl-4 font-medium text-right">Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {data.distribucionSegmentos.map((row) => (
                  <tr key={row.segmento} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="py-3 pr-4 text-[var(--text-primary)] font-medium">
                      {row.segmento}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[var(--text-primary)]">
                      {row.cantidad}
                    </td>
                    <td className="py-3 pl-4 text-right font-mono tabular-nums text-[var(--text-muted)]">
                      {((row.cantidad / data.totalPerfilesBase) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
