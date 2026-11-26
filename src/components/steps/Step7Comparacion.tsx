import { useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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
import { ComparacionCronogramas, CuotaCronograma, EstadoCumplimiento } from "../../types/negova";

interface Step7ComparacionProps {
  comparacion: ComparacionCronogramas;
  factorMaximo: number;
}

function StatusCell({ estado }: { estado: EstadoCumplimiento }) {
  if (estado === "Cumple") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-positive)] whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Cumple
      </span>
    );
  }
  if (estado === "Riesgo") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-warning)] whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        Riesgo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-risk)] whitespace-nowrap">
      <XCircle className="w-3.5 h-3.5 shrink-0" />
      Incumple
    </span>
  );
}

export function Step7Comparacion({ comparacion, factorMaximo }: Step7ComparacionProps) {
  const [tab, setTab] = useState<"comparativa" | "tradicional" | "adaptado">("comparativa");
  const { tradicional, adaptado } = comparacion;

  const chartData = adaptado.cuotas.map((cAdapt, idx) => {
    const cTrad = tradicional.cuotas[idx];
    return {
      periodo: cAdapt.etiquetaPeriodo,
      cuotaTradicional: cTrad?.cuotaTotal ?? 0,
      cuotaAdaptada: cAdapt.cuotaTotal,
      capacidadMax: cAdapt.capacidadMaximaPermitida,
    };
  });

  const renderDetailTable = (cuotas: CuotaCronograma[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
          <tr>
            <th className="py-2.5 px-3 font-mono font-medium">Cuota</th>
            <th className="py-2.5 px-3 font-mono font-medium">Vencimiento</th>
            <th className="py-2.5 px-3 font-mono font-medium text-right">Días</th>
            <th className="py-2.5 px-3 font-mono font-medium text-right">Saldo inicial</th>
            <th className="py-2.5 px-3 font-mono font-medium text-right">Capital</th>
            <th className="py-2.5 px-3 font-mono font-medium text-right">Interés</th>
            <th className="py-2.5 px-3 font-mono font-medium text-right">Seguros</th>
            <th className="py-2.5 px-3 font-mono font-medium text-right">Cuota total</th>
            <th className="py-2.5 px-3 font-mono font-medium text-right">Saldo final</th>
            <th className="py-2.5 px-3 font-mono font-medium text-right">Cuota/Util.</th>
            <th className="py-2.5 px-3 font-mono font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-hairline)] text-[var(--text-secondary)]">
          {cuotas.map((c) => (
            <tr key={c.numeroCuota} className="hover:bg-[var(--bg-elevated)] transition-colors">
              <td className="py-2.5 px-3 font-mono text-[var(--text-primary)] whitespace-nowrap">
                {c.etiquetaPeriodo}
              </td>
              <td className="py-2.5 px-3 font-mono text-[var(--text-muted)] whitespace-nowrap">
                {c.fechaVencimiento}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[var(--text-muted)]">
                {c.diasPeriodo}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                S/ {c.saldoInicial.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                S/ {c.amortizacionCapital.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                S/ {c.interesPeriodo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                S/ {c.segurosTotales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-[var(--text-primary)]">
                S/ {c.cuotaTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                S/ {c.saldoFinal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                {c.ratioCuotaUtilidad !== null
                  ? `${(c.ratioCuotaUtilidad * 100).toFixed(1)}%`
                  : "N/A"}
              </td>
              <td className="py-2.5 px-3">
                <StatusCell estado={c.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-[var(--border-hairline)]">
        <p className="text-xs font-mono text-[var(--accent-teal)]">
          Etapa 07 · Optimización y contraste
        </p>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
          7. Comparación de cronogramas y optimización
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
          Contraste matemático entre el cronograma tradicional de cuota fija y el cronograma
          adaptado bajo la restricción individual Cuota / Utilidad neta ≤{" "}
          <span className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
            {(factorMaximo * 100).toFixed(0)}%
          </span>
          .
        </p>
      </div>

      {/* Alerta explícita de no viabilidad */}
      {!adaptado.viable && (
        <div
          role="alert"
          className="bg-[var(--accent-risk-soft)] border border-[var(--accent-risk)]/40 rounded-lg p-4 flex items-start gap-3"
        >
          <XCircle className="w-5 h-5 text-[var(--accent-risk)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--accent-risk)]">
              Crédito no viable bajo los parámetros actuales
            </p>
            <p className="text-xs text-[var(--text-primary)] mt-1 leading-relaxed">
              {adaptado.motivoNoViabilidad}
            </p>
          </div>
        </div>
      )}

      {/* Nota transparente de valor y costo */}
      <div
        className={`rounded-lg border p-4 text-xs leading-relaxed ${
          comparacion.adaptadoEsMasCaro
            ? "bg-[var(--accent-warning-soft)] border-[var(--accent-warning)]/40 text-[var(--text-primary)]"
            : "bg-[var(--accent-teal-soft)] border-[var(--accent-teal)]/35 text-[var(--text-primary)]"
        }`}
      >
        <p className="font-semibold">{comparacion.resumenValor}</p>
        {comparacion.adaptadoEsMasCaro && (
          <p className="mt-1 text-[var(--text-secondary)]">
            Nota de transparencia: el cronograma adaptado presenta un costo financiero total
            superior en{" "}
            <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
              S/ {comparacion.diferenciaCostoTotal.toLocaleString("es-PE")}
            </span>{" "}
            respecto al cronograma tradicional porque posterga parte de la amortización hacia los
            meses de mayor liquidez.
          </p>
        )}
      </div>

      {/* Comparativa lado a lado Plan A vs Plan B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-hairline)]">
        {/* Plan Tradicional */}
        <div className="bg-[var(--bg-surface)] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Plan A · Cronograma tradicional (cuota fija)
            </h3>
            <span
              className={`text-xs font-mono font-semibold whitespace-nowrap ${
                tradicional.viable ? "text-[var(--accent-positive)]" : "text-[var(--accent-risk)]"
              }`}
            >
              {tradicional.viable ? "Viable" : "Incumple capacidad"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[var(--text-muted)]">Cuota fija aprox.</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                S/{" "}
                {tradicional.cuotaPromedio.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Intereses totales</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                S/{" "}
                {tradicional.totalIntereses.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Seguros totales</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                S/{" "}
                {tradicional.totalSeguros.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Costo total (Int. + Seg.)</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                S/{" "}
                {tradicional.costoTotalCredito.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">TCEA / TEA / TED</p>
              <p className="text-xs font-mono tabular-nums text-[var(--text-secondary)] mt-1.5">
                {tradicional.tcea !== null
                  ? `${(tradicional.tcea * 100).toFixed(2)}%`
                  : "N/D"}{" "}
                / {(tradicional.tea * 100).toFixed(1)}% / {(tradicional.ted * 100).toFixed(4)}%
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Periodos que incumplen</p>
              <p
                className={`text-base font-semibold font-mono tabular-nums mt-1 ${
                  tradicional.periodosIncumplen > 0
                    ? "text-[var(--accent-risk)]"
                    : "text-[var(--accent-positive)]"
                }`}
              >
                {tradicional.periodosIncumplen} de {tradicional.cuotas.length}
              </p>
            </div>
          </div>

          {tradicional.tceaNota && (
            <p className="text-[11px] text-[var(--accent-warning)] pt-2 border-t border-[var(--border-hairline)]">
              {tradicional.tceaNota}
            </p>
          )}
        </div>

        {/* Plan Adaptado */}
        <div className="bg-[var(--bg-ink)] text-[var(--text-on-ink)] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-ink)]">
            <h3 className="text-sm font-semibold text-[var(--text-on-ink)]">
              Plan B · Cronograma adaptado al ciclo económico
            </h3>
            <span
              className={`text-xs font-mono font-semibold whitespace-nowrap ${
                adaptado.viable ? "text-[var(--accent-teal-ink)]" : "text-rose-300"
              }`}
            >
              {adaptado.viable ? "Viable" : "No viable"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[var(--text-on-ink-muted)]">Rango de cuotas</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--accent-teal-ink)] mt-1">
                S/ {Math.round(adaptado.cuotaMinima).toLocaleString("es-PE")} –{" "}
                {Math.round(adaptado.cuotaMaxima).toLocaleString("es-PE")}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-on-ink-muted)]">Intereses totales</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-on-ink)] mt-1">
                S/{" "}
                {adaptado.totalIntereses.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-on-ink-muted)]">Seguros totales</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-on-ink)] mt-1">
                S/{" "}
                {adaptado.totalSeguros.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-on-ink-muted)]">Costo total (Int. + Seg.)</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-on-ink)] mt-1">
                S/{" "}
                {adaptado.costoTotalCredito.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-on-ink-muted)]">TCEA / TEA / TED</p>
              <p className="text-xs font-mono tabular-nums text-[var(--text-on-ink)] mt-1.5">
                {adaptado.tcea !== null ? `${(adaptado.tcea * 100).toFixed(2)}%` : "N/D"} /{" "}
                {(adaptado.tea * 100).toFixed(1)}% / {(adaptado.ted * 100).toFixed(4)}%
              </p>
            </div>
            <div>
              <p className="text-[var(--text-on-ink-muted)]">Periodos que incumplen</p>
              <p
                className={`text-base font-semibold font-mono tabular-nums mt-1 ${
                  adaptado.periodosIncumplen > 0
                    ? "text-rose-300"
                    : "text-[var(--accent-teal-ink)]"
                }`}
              >
                {adaptado.periodosIncumplen} de {adaptado.cuotas.length}
              </p>
            </div>
          </div>

          {adaptado.tceaNota && (
            <p className="text-[11px] text-amber-300 pt-2 border-t border-[var(--border-ink)]">
              {adaptado.tceaNota}
            </p>
          )}
        </div>
      </div>

      {/* Gráfico comparativo */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-hairline)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Cuota tradicional vs. Cuota adaptada vs. Techo máximo de capacidad
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Cualquier barra que supere la línea punteada excede el límite de capacidad de pago del
              periodo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs inline-block"
                style={{ backgroundColor: "var(--chart-bar-base)" }}
                aria-hidden="true"
              />
              Tradicional
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-teal)]">
              <span
                className="w-2.5 h-2.5 rounded-xs inline-block"
                style={{ backgroundColor: "var(--accent-teal)" }}
                aria-hidden="true"
              />
              Adaptada
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-risk)]">
              <span
                className="w-3 h-0.5 inline-block border-t-2 border-dashed border-[var(--accent-risk)]"
                aria-hidden="true"
              />
              Techo máx.
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
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
                    cuotaTradicional: "Cuota tradicional fija",
                    cuotaAdaptada: "Cuota adaptada",
                    capacidadMax: "Capacidad máxima permitida",
                  };
                  return [
                    `S/ ${Number(value).toLocaleString("es-PE")}`,
                    labels[String(name)] ?? String(name),
                  ];
                }}
              />
              <Bar
                dataKey="cuotaTradicional"
                fill="var(--chart-bar-base)"
                radius={[3, 3, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="cuotaAdaptada"
                fill="var(--accent-teal)"
                radius={[3, 3, 0, 0]}
                barSize={16}
              />
              <Line
                type="monotone"
                dataKey="capacidadMax"
                stroke="var(--accent-risk)"
                strokeDasharray="5 4"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "var(--accent-risk)", strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla detallada por periodo */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Detalle por periodo</h3>
          <div className="inline-flex items-center border border-[var(--border-hairline)] rounded-lg bg-[var(--bg-canvas)] p-0.5">
            {(
              [
                { id: "comparativa", label: "Comparativa lado a lado" },
                { id: "tradicional", label: "Detalle Tradicional" },
                { id: "adaptado", label: "Detalle Adaptado" },
              ] as const
            ).map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? "bg-[var(--bg-ink)] text-[var(--text-on-ink)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "comparativa" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 px-3 font-mono font-medium">Periodo</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Utilidad neta</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Cap. máxima</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Cuota fija</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Ratio fijo</th>
                  <th className="py-2.5 px-3 font-mono font-medium">Estado fijo</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Cuota adaptada</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Ratio adapt.</th>
                  <th className="py-2.5 px-3 font-mono font-medium">Estado adapt.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)] text-[var(--text-secondary)]">
                {adaptado.cuotas.map((cAdapt, idx) => {
                  const cTrad = tradicional.cuotas[idx];
                  return (
                    <tr
                      key={cAdapt.numeroCuota}
                      className="hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[var(--text-primary)] whitespace-nowrap">
                        {cAdapt.etiquetaPeriodo}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        S/{" "}
                        {cAdapt.utilidadNetaPeriodo.toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[var(--text-muted)]">
                        S/{" "}
                        {cAdapt.capacidadMaximaPermitida.toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        S/{" "}
                        {(cTrad?.cuotaTotal ?? 0).toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        {cTrad?.ratioCuotaUtilidad !== null
                          ? `${(cTrad.ratioCuotaUtilidad * 100).toFixed(1)}%`
                          : "N/A"}
                      </td>
                      <td className="py-2.5 px-3">
                        {cTrad && <StatusCell estado={cTrad.estado} />}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-[var(--accent-teal)]">
                        S/{" "}
                        {cAdapt.cuotaTotal.toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        {cAdapt.ratioCuotaUtilidad !== null
                          ? `${(cAdapt.ratioCuotaUtilidad * 100).toFixed(1)}%`
                          : "N/A"}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusCell estado={cAdapt.estado} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : tab === "tradicional" ? (
          renderDetailTable(tradicional.cuotas)
        ) : (
          renderDetailTable(adaptado.cuotas)
        )}
      </div>
    </div>
  );
}
