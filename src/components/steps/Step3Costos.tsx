import { MESES_CORTOS } from "../../engines/catalogs";
import {
  CondicionFormalidad,
  EstructuraCostos,
  MesVenta,
  TipoEstructuraCostos,
} from "../../types/negova";

interface Step3CostosProps {
  costos: EstructuraCostos;
  ventas: MesVenta[];
  formalidad: CondicionFormalidad;
  onChange: (updated: EstructuraCostos) => void;
  error?: string;
}

export function Step3Costos({
  costos,
  ventas,
  formalidad,
  onChange,
  error,
}: Step3CostosProps) {
  const validSales = ventas
    .map((v) => v.monto)
    .filter((m): m is number => m !== null && m > 0);
  const promedioVentas = validSales.length
    ? validSales.reduce((a, b) => a + b, 0) / validSales.length
    : 0;

  const costoAdqEst =
    costos.tipoEstructura === "Proporcional al ciclo"
      ? Math.round(promedioVentas * (costos.costoAdquisicionProduccionPct / 100))
      : costos.costoAdquisicionMensualFijo;

  const tributoEst =
    costos.tasaTributariaPct > 0
      ? Math.round(promedioVentas * (costos.tasaTributariaPct / 100))
      : costos.gastosTributariosMensuales;

  const utilidadOpEstimada = Math.round(
    promedioVentas - costoAdqEst - costos.gastosOperativosMensuales - tributoEst
  );

  const setTipoEstructura = (tipo: TipoEstructuraCostos) => {
    onChange({ ...costos, tipoEstructura: tipo });
  };

  const updateFactorMes = (idx: number, val: number) => {
    const next = [...costos.costosEstacionalesPorMes];
    next[idx] = Math.max(0.3, Math.min(2.0, val));
    onChange({ ...costos, costosEstacionalesPorMes: next });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">3. Estructura de costos</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Registra los costos de producción o adquisición, gastos operativos y carga tributaria
          según la condición de formalidad ({formalidad}).
        </p>
      </div>

      {/* Modalidad de costos */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {(["Proporcional al ciclo", "Fija mensual"] as const).map((modo) => (
          <button
            key={modo}
            type="button"
            onClick={() => setTipoEstructura(modo)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              costos.tipoEstructura === modo
                ? "bg-white dark:bg-slate-700 text-[#0B1F3A] dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {modo === "Proporcional al ciclo"
              ? "Proporcional a las ventas del ciclo"
              : "Costo base mensual (con ajuste estacional)"}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl px-4 py-3 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {costos.tipoEstructura === "Proporcional al ciclo" ? (
          <div>
            <label
              htmlFor="costo-adq-pct"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Costo de producción o adquisición (% sobre ventas)
            </label>
            <div className="relative">
              <input
                id="costo-adq-pct"
                type="number"
                min={0}
                max={95}
                step={0.5}
                value={costos.costoAdquisicionProduccionPct}
                onChange={(e) =>
                  onChange({
                    ...costos,
                    costoAdquisicionProduccionPct: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-full pr-8 pl-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
                %
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
              Equivalente prom.: S/ {costoAdqEst.toLocaleString("es-PE")} / mes
            </p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="costo-adq-fijo"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Costo mensual base de producción/adquisición (S/)
            </label>
            <input
              id="costo-adq-fijo"
              type="number"
              min={0}
              step={100}
              value={costos.costoAdquisicionMensualFijo}
              onChange={(e) =>
                onChange({
                  ...costos,
                  costoAdquisicionMensualFijo: Math.max(0, Number(e.target.value)),
                })
              }
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="gastos-operativos"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Gastos operativos mensuales (alquiler, personal, servicios)
          </label>
          <input
            id="gastos-operativos"
            type="number"
            min={0}
            step={50}
            value={costos.gastosOperativosMensuales}
            onChange={(e) =>
              onChange({
                ...costos,
                gastosOperativosMensuales: Math.max(0, Number(e.target.value)),
              })
            }
            className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
        </div>

        <div>
          <label
            htmlFor="tasa-tributaria"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Gastos tributarios efectivos (% sobre ventas)
          </label>
          <div className="relative">
            <input
              id="tasa-tributaria"
              type="number"
              min={0}
              max={30}
              step={0.1}
              value={costos.tasaTributariaPct}
              onChange={(e) =>
                onChange({
                  ...costos,
                  tasaTributariaPct: Math.max(0, Number(e.target.value)),
                })
              }
              className="w-full pr-8 pl-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
              %
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            Equivalente prom.: S/ {tributoEst.toLocaleString("es-PE")} / mes
          </p>
        </div>
      </div>

      {/* Si es fija mensual, permitir variación estacional de costos */}
      {costos.tipoEstructura === "Fija mensual" && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Factor multiplicador estacional de costos por mes (1.00 = mes promedio)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {MESES_CORTOS.map((mes, idx) => (
              <div key={mes} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800/60">
                <label
                  htmlFor={`factor-costo-${idx}`}
                  className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                >
                  {mes}
                </label>
                <input
                  id={`factor-costo-${idx}`}
                  type="number"
                  min={0.3}
                  max={2.0}
                  step={0.05}
                  value={costos.costosEstacionalesPorMes[idx] ?? 1}
                  onChange={(e) => updateFactorMes(idx, Number(e.target.value))}
                  className="w-full px-1.5 py-1 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen de utilidad operativa estimada */}
      <div className="bg-[#0B1F3A] dark:bg-slate-800 border border-transparent dark:border-slate-700 text-white rounded-xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-300">Ventas prom. registradas</p>
          <p className="text-lg font-bold font-mono tabular-nums mt-1">
            S/ {Math.round(promedioVentas).toLocaleString("es-PE")}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-300">Costo adquisición/prod.</p>
          <p className="text-lg font-bold font-mono tabular-nums mt-1">
            S/ {costoAdqEst.toLocaleString("es-PE")}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-300">Gastos op. + tributos</p>
          <p className="text-lg font-bold font-mono tabular-nums mt-1">
            S/ {(costos.gastosOperativosMensuales + tributoEst).toLocaleString("es-PE")}
          </p>
        </div>
        <div>
          <p className="text-xs text-teal-300">Utilidad neta operativa prom.</p>
          <p
            className={`text-lg font-bold font-mono tabular-nums mt-1 ${
              utilidadOpEstimada > 0 ? "text-teal-300" : "text-rose-300"
            }`}
          >
            S/ {utilidadOpEstimada.toLocaleString("es-PE")}
          </p>
        </div>
      </div>
    </div>
  );
}
