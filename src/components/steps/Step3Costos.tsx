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

const INPUT_CLASS =
  "w-full h-11 px-3.5 text-sm font-mono tabular-nums bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-lg focus:outline-none focus:border-[var(--accent-teal)] transition-colors";

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
    <div className="space-y-8">
      <div className="pb-5 border-b border-[var(--border-hairline)]">
        <p className="text-xs font-mono text-[var(--accent-teal)]">Etapa 03 · Márgenes y egresos</p>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
          3. Estructura de costos
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
          Registra los costos de producción o adquisición, gastos operativos y carga tributaria
          según la condición de formalidad ({formalidad}).
        </p>
      </div>

      {/* Modalidad de costos */}
      <div className="inline-flex flex-wrap gap-1 p-1 bg-[var(--bg-subtle)] border border-[var(--border-hairline)] rounded-lg">
        {(["Proporcional al ciclo", "Fija mensual"] as const).map((modo) => (
          <button
            key={modo}
            type="button"
            onClick={() => setTipoEstructura(modo)}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
              costos.tipoEstructura === modo
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {modo === "Proporcional al ciclo"
              ? "Proporcional a las ventas del ciclo"
              : "Costo base mensual (con ajuste estacional)"}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-[var(--accent-risk-soft)] border border-[var(--accent-risk)]/35 rounded-lg px-4 py-3 text-xs text-[var(--accent-risk)] font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {costos.tipoEstructura === "Proporcional al ciclo" ? (
          <div>
            <label
              htmlFor="costo-adq-pct"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
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
                className={`${INPUT_CLASS} pr-8`}
              />
              <span className="text-xs font-mono text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2">
                %
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-mono tabular-nums">
              Equivalente prom.: S/ {costoAdqEst.toLocaleString("es-PE")} / mes
            </p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="costo-adq-fijo"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
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
              className={INPUT_CLASS}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="gastos-operativos"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
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
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="tasa-tributaria"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
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
              className={`${INPUT_CLASS} pr-8`}
            />
            <span className="text-xs font-mono text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2">
              %
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-mono tabular-nums">
            Equivalente prom.: S/ {tributoEst.toLocaleString("es-PE")} / mes
          </p>
        </div>
      </div>

      {/* Variación estacional de costos */}
      {costos.tipoEstructura === "Fija mensual" && (
        <div className="pt-6 border-t border-[var(--border-hairline)] space-y-3">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Factor multiplicador estacional de costos por mes (1.00 = mes promedio)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {MESES_CORTOS.map((mes, idx) => (
              <div
                key={mes}
                className="border border-[var(--border-hairline)] rounded-lg p-2 bg-[var(--bg-elevated)]"
              >
                <label
                  htmlFor={`factor-costo-${idx}`}
                  className="block text-[11px] font-medium text-[var(--text-muted)] mb-1"
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
                  className="w-full px-1.5 py-1 text-xs font-mono tabular-nums bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen de utilidad operativa estimada */}
      <div className="bg-[var(--bg-ink)] text-[var(--text-on-ink)] border border-[var(--border-ink)] rounded-lg grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-ink)]">
        <div className="p-5">
          <p className="text-xs text-[var(--text-on-ink-muted)]">Ventas prom. registradas</p>
          <p className="text-lg font-semibold font-mono tabular-nums mt-1.5">
            S/ {Math.round(promedioVentas).toLocaleString("es-PE")}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[var(--text-on-ink-muted)]">Costo adquisición/prod.</p>
          <p className="text-lg font-semibold font-mono tabular-nums mt-1.5">
            S/ {costoAdqEst.toLocaleString("es-PE")}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[var(--text-on-ink-muted)]">Gastos op. + tributos</p>
          <p className="text-lg font-semibold font-mono tabular-nums mt-1.5">
            S/ {(costos.gastosOperativosMensuales + tributoEst).toLocaleString("es-PE")}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[var(--accent-teal-ink)]">Utilidad neta operativa prom.</p>
          <p
            className={`text-lg font-semibold font-mono tabular-nums mt-1.5 ${
              utilidadOpEstimada > 0 ? "text-[var(--accent-teal-ink)]" : "text-rose-300"
            }`}
          >
            S/ {utilidadOpEstimada.toLocaleString("es-PE")}
          </p>
        </div>
      </div>
    </div>
  );
}
