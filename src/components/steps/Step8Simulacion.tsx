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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">
            8. Simulador de escenarios externos
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Evalúa cómo eventos climáticos o choques de mercado afectan la utilidad neta y la
            sostenibilidad de ambos cronogramas.
          </p>
        </div>
        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
          Escenario hipotético · No es pronóstico real
        </span>
      </div>

      {/* Controles de simulación */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Seleccionar fenómeno externo
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FENOMENOS.map((fen) => (
                <button
                  key={fen}
                  type="button"
                  onClick={() => setFenomeno(fen)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    fenomeno === fen
                      ? "border-teal-700 dark:border-teal-500 bg-teal-50/70 dark:bg-teal-950/50 text-[#0B1F3A] dark:text-white font-semibold"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {fen}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nivel de intensidad del choque
              </span>
              <div className="grid grid-cols-3 gap-2">
                {INTENSIDADES.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setIntensidad(lvl)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      intensidad === lvl
                        ? "border-[#0B1F3A] dark:border-teal-500 bg-[#0B1F3A] dark:bg-teal-600 text-white"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onRunSimulation({ fenomeno, intensidad })}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0B1F3A] dark:bg-teal-600 rounded-xl hover:bg-[#143058] dark:hover:bg-teal-500 transition-colors"
              >
                <CloudLightning className="w-4 h-4 text-teal-300 dark:text-white" />
                Simular escenarios externos
              </button>

              {simulacion && (
                <button
                  type="button"
                  onClick={onClearSimulation}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
        <div className="space-y-5">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl px-4 py-3 text-xs text-amber-950 dark:text-amber-200">
            <strong>Escenario hipotético activo:</strong> {simulacion.parametros.fenomeno} (intensidad{" "}
            {simulacion.parametros.intensidad}). Esta prueba de estrés modifica las variables de
            ventas y costos mediante parámetros explícitos y recalcula ambos cronogramas; no
            constituye una predicción meteorológica ni un pronóstico real de eventos futuros.
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Impacto en ventas</p>
              <p className="text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400 mt-1">
                {simulacion.impactoVentasPct}%
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Impacto en costos</p>
              <p className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
                +{simulacion.impactoCostosPct}%
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Impacto en utilidad neta</p>
              <p className="text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400 mt-1">
                {simulacion.impactoUtilidadPct}%
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Incumplimientos (Plan Fijo)</p>
              <p className="text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400 mt-1">
                {simulacion.cuotasQueIncumplenFijo}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Incumplimientos (Adaptado)</p>
              <p
                className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                  simulacion.cuotasQueIncumplenAdaptado > 0
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-teal-700 dark:text-teal-400"
                }`}
              >
                {simulacion.cuotasQueIncumplenAdaptado}
              </p>
            </div>
          </div>

          {/* Periodos críticos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-[#0B1F3A] dark:text-white">Periodos críticos bajo estrés: </span>
            {simulacion.mesesCriticos.length > 0
              ? simulacion.mesesCriticos.join(" · ")
              : "Ningún periodo presenta caída severa ni incumplimiento crítico."}
          </div>

          {/* Gráfico comparativo de utilidad base vs estresada */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white mb-3">
              Utilidad neta base vs. Escenario hipotético estresado
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickFormatter={(v) => `S/${Math.round(Number(v))}`}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      color: "#f8fafc",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
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
                  <Bar dataKey="utilidadBase" fill="#64748B" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="utilidadEstres" fill="#D97706" radius={[4, 4, 0, 0]} barSize={16} />
                  <Line
                    type="monotone"
                    dataKey="cuotaAdaptada"
                    stroke="#0D9488"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "#0D9488" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100/80 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
          <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
            Aún no se ha ejecutado una prueba de estrés externo
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
            Selecciona un fenómeno y una intensidad arriba y pulsa{" "}
            <strong>Simular escenarios externos</strong> para recalcular flujos y cronogramas.
          </p>
        </div>
      )}
    </div>
  );
}
