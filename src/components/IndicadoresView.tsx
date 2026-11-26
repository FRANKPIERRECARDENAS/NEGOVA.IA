import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { computeSyntheticValidationIndicators } from "../engines/validationBenchmarks";
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0B1F3A] dark:hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
              /
            </span>
            <h1 className="text-sm sm:text-base font-bold text-[#0B1F3A] dark:text-white truncate">
              Indicadores de validación sintética
            </h1>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={onStartAnalysis}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0B1F3A] dark:bg-teal-600 rounded-lg hover:bg-[#143058] dark:hover:bg-teal-500 transition-colors whitespace-nowrap shrink-0"
            >
              Analizar un negocio
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            Resultados de validación sintética (muestra reservada fuera de ajuste)
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
            {data.notaMetodologica}
          </p>
        </div>

        {/* Métricas esenciales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Tiempo promedio de análisis</p>
            <p className="text-2xl font-bold text-[#0B1F3A] dark:text-white font-mono tabular-nums mt-2">
              {data.tiempoPromedioMs} ms
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ejecución predictiva + optimización financiera por perfil
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cronogramas que respetan restricciones
            </p>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 font-mono tabular-nums mt-2">
              {data.porcentajeCronogramasAdaptadosViables}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Frente a {data.porcentajeCronogramasFijosViables}% con cuota fija tradicional
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Incumplimientos detectados (muestra 200)
            </p>
            <p className="text-2xl font-bold text-[#0B1F3A] dark:text-white font-mono tabular-nums mt-2">
              {data.incumplimientosAdaptado}{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                vs. {data.incumplimientosTradicional} en fijo
              </span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Periodos donde Cuota / Utilidad excede el factor del producto
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Error MAE predictivo (holdout sintético)
            </p>
            <p className="text-2xl font-bold text-[#0B1F3A] dark:text-white font-mono tabular-nums mt-2">
              S/ {data.maePredictivo.toLocaleString("es-PE")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Error absoluto medio mensual frente a los 12 meses reservados
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Error porcentual WAPE (holdout sintético)
            </p>
            <p className="text-2xl font-bold text-[#0B1F3A] dark:text-white font-mono tabular-nums mt-2">
              {data.wapePredictivoPct}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sobre {data.perfilesPruebaHoldout} perfiles sintéticos reservados
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reducción de presión máxima (Cuota/Utilidad)
            </p>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 font-mono tabular-nums mt-2">
              {data.reduccionRatioPromedioPct}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Alivio promedio del ratio pico entre plan fijo y adaptado
            </p>
          </div>
        </div>

        {/* Distribución de la base sintética */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
            Composición de la base de pruebas sintética ({data.totalPerfilesBase} perfiles)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Distribución sintética diseñada para probar estabilidad y estacionalidad; no refleja
            cartera real institucional.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Segmento sintético</th>
                  <th className="py-2 px-4 font-medium text-right">Perfiles</th>
                  <th className="py-2 pl-4 font-medium text-right">Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.distribucionSegmentos.map((row) => (
                  <tr key={row.segmento}>
                    <td className="py-2.5 pr-4 text-slate-800 dark:text-slate-200 font-medium">
                      {row.segmento}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {row.cantidad}
                    </td>
                    <td className="py-2.5 pl-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {((row.cantidad / data.totalPerfilesBase) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
