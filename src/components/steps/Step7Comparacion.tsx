import { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
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
import { CollapsiblePanel } from "./CollapsiblePanel";
import { StepVisual } from "./StepVisual";

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
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number>(0);
  const { tradicional, adaptado } = comparacion;

  const activeCuotaAdapt = adaptado.cuotas[selectedPeriodIdx] ?? adaptado.cuotas[0];
  const activeCuotaTrad = tradicional.cuotas[selectedPeriodIdx] ?? tradicional.cuotas[0];

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
          {cuotas.map((c, idx) => (
            <tr
              key={c.numeroCuota}
              onClick={() => setSelectedPeriodIdx(idx)}
              className={`cursor-pointer transition-colors ${
                selectedPeriodIdx === idx
                  ? "bg-[var(--accent-teal-soft)]"
                  : "hover:bg-[var(--bg-elevated)]"
              }`}
            >
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
    <div className="space-y-7">
      <div className="pb-5 border-b border-[var(--border-hairline)] flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--accent-teal)]">07 · Optimización</p>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
            Comparación de cronogramas
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Cuota fija vs. cronograma adaptado bajo límite Cuota / Utilidad ≤{" "}
            <span className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
              {(factorMaximo * 100).toFixed(0)}%
            </span>
            .
          </p>
        </div>
        <StepVisual step={7} />
      </div>

      {/* Alerta explícita de no viabilidad */}
      {!adaptado.viable && (
        <div
          role="alert"
          className="bg-[var(--accent-risk-soft)] border border-[var(--accent-risk)]/40 rounded-lg p-4 flex items-start gap-3"
        >
          <XCircle className="w-5 h-5 text-[var(--accent-risk)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--accent-risk)]">
              Crédito no viable bajo los parámetros actuales
            </p>
            <p className="text-xs text-[var(--text-primary)] mt-1">{adaptado.motivoNoViabilidad}</p>
          </div>
        </div>
      )}

      {/* Veredicto principal (solo si no está ya cubierto por alerta de inviabilidad) */}
      {(adaptado.viable || comparacion.mejorOpcion !== "Ninguno") && (
        <div
          className={`rounded-lg border px-4 py-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            comparacion.mejorOpcion === "Tradicional"
              ? "bg-[var(--accent-positive-soft)] border-[var(--accent-positive)]/35 text-[var(--text-primary)]"
              : comparacion.adaptadoEsMasCaro
              ? "bg-[var(--accent-warning-soft)] border-[var(--accent-warning)]/40 text-[var(--text-primary)]"
              : "bg-[var(--accent-teal-soft)] border-[var(--accent-teal)]/35 text-[var(--text-primary)]"
          }`}
        >
          <div>
            <span className="font-semibold">Opción recomendada: {comparacion.mejorOpcion}</span>
            <span className="text-[var(--text-secondary)] ml-2">{comparacion.resumenValor}</span>
          </div>
          {comparacion.adaptadoEsMasCaro && (
            <span className="font-mono tabular-nums text-[var(--text-secondary)] shrink-0">
              Diferencia: +S/ {comparacion.diferenciaCostoTotal.toLocaleString("es-PE")}
            </span>
          )}
        </div>
      )}

      {/* Comparativa esencial Plan A vs Plan B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-hairline)]">
        {/* Plan Tradicional */}
        <div className="bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Plan A · Cuota fija
            </h3>
            <span
              className={`text-xs font-mono font-semibold whitespace-nowrap ${
                tradicional.viable ? "text-[var(--accent-positive)]" : "text-[var(--accent-risk)]"
              }`}
            >
              {tradicional.viable ? "Viable" : "Incumple"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[var(--text-muted)]">Cuota fija</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                S/{" "}
                {tradicional.cuotaPromedio.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Costo total</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                S/{" "}
                {tradicional.costoTotalCredito.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">TCEA</p>
              <p className="text-sm font-mono tabular-nums text-[var(--text-secondary)] mt-1">
                {tradicional.tcea !== null ? `${(tradicional.tcea * 100).toFixed(2)}%` : "N/D"}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Incumplimientos</p>
              <p
                className={`text-base font-semibold font-mono tabular-nums mt-1 ${
                  tradicional.periodosIncumplen > 0
                    ? "text-[var(--accent-risk)]"
                    : "text-[var(--accent-positive)]"
                }`}
              >
                {tradicional.periodosIncumplen} / {tradicional.cuotas.length}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Adaptado */}
        <div className="bg-[var(--bg-ink)] text-[var(--text-on-ink)] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-ink)]">
            <h3 className="text-sm font-semibold text-[var(--text-on-ink)]">
              Plan B · Adaptado al ciclo
            </h3>
            <span
              className={`text-xs font-mono font-semibold whitespace-nowrap ${
                adaptado.viable ? "text-[var(--accent-teal-ink)]" : "text-rose-300"
              }`}
            >
              {adaptado.viable ? "Viable" : "No viable"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[var(--text-on-ink-muted)]">Rango de cuotas</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--accent-teal-ink)] mt-1">
                S/ {Math.round(adaptado.cuotaMinima).toLocaleString("es-PE")} –{" "}
                {Math.round(adaptado.cuotaMaxima).toLocaleString("es-PE")}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-on-ink-muted)]">Costo total</p>
              <p className="text-base font-semibold font-mono tabular-nums text-[var(--text-on-ink)] mt-1">
                S/{" "}
                {adaptado.costoTotalCredito.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-on-ink-muted)]">TCEA</p>
              <p className="text-sm font-mono tabular-nums text-[var(--text-on-ink)] mt-1">
                {adaptado.tcea !== null ? `${(adaptado.tcea * 100).toFixed(2)}%` : "N/D"}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-on-ink-muted)]">Incumplimientos</p>
              <p
                className={`text-base font-semibold font-mono tabular-nums mt-1 ${
                  adaptado.periodosIncumplen > 0
                    ? "text-rose-300"
                    : "text-[var(--accent-teal-ink)]"
                }`}
              >
                {adaptado.periodosIncumplen} / {adaptado.cuotas.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico comparativo */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-hairline)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Cuotas frente al límite de capacidad
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs inline-block"
                style={{ backgroundColor: "var(--chart-bar-base)" }}
                aria-hidden="true"
              />
              Fija
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
              Límite máx.
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
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
                    cuotaTradicional: "Cuota fija",
                    cuotaAdaptada: "Cuota adaptada",
                    capacidadMax: "Capacidad máxima",
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

      {/* Paneles desplegables secundarios */}
      <div className="space-y-3">
        <CollapsiblePanel
          title={`Cronograma detallado (${adaptado.cuotas.length} periodos)`}
          summary="Comparativa, tradicional y adaptado"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center border border-[var(--border-hairline)] rounded-lg bg-[var(--bg-canvas)] p-0.5">
              {(
                [
                  { id: "comparativa", label: "Comparativa" },
                  { id: "tradicional", label: "Tradicional" },
                  { id: "adaptado", label: "Adaptado" },
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

            {tab === "comparativa" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                    <tr>
                      <th className="py-2.5 px-3 font-mono font-medium">Periodo</th>
                      <th className="py-2.5 px-3 font-mono font-medium text-right">Utilidad</th>
                      <th className="py-2.5 px-3 font-mono font-medium text-right">Límite máx.</th>
                      <th className="py-2.5 px-3 font-mono font-medium text-right">Fija</th>
                      <th className="py-2.5 px-3 font-mono font-medium">Estado</th>
                      <th className="py-2.5 px-3 font-mono font-medium text-right">Adaptada</th>
                      <th className="py-2.5 px-3 font-mono font-medium text-right">Ratio</th>
                      <th className="py-2.5 px-3 font-mono font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)] text-[var(--text-secondary)]">
                    {adaptado.cuotas.map((cAdapt, idx) => {
                      const cTrad = tradicional.cuotas[idx];
                      return (
                        <tr
                          key={cAdapt.numeroCuota}
                          onClick={() => setSelectedPeriodIdx(idx)}
                          className={`cursor-pointer transition-colors ${
                            selectedPeriodIdx === idx
                              ? "bg-[var(--accent-teal-soft)]"
                              : "hover:bg-[var(--bg-elevated)]"
                          }`}
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
        </CollapsiblePanel>

        {activeCuotaAdapt && (
          <CollapsiblePanel
            title="Auditoría por cuota y sensibilidad (-20%)"
            summary={`${activeCuotaAdapt.etiquetaPeriodo} · S/ ${activeCuotaAdapt.cuotaTotal.toFixed(2)}`}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  Selecciona un periodo para inspeccionar su cálculo y prueba de sensibilidad:
                </span>
                <select
                  aria-label="Seleccionar cuota para inspeccionar trazabilidad"
                  value={selectedPeriodIdx}
                  onChange={(e) => setSelectedPeriodIdx(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-mono bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-lg"
                >
                  {adaptado.cuotas.map((c, idx) => (
                    <option key={c.numeroCuota} value={idx}>
                      {c.etiquetaPeriodo} · S/ {c.cuotaTotal.toFixed(2)} ({c.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-3">
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">Motivo del monto</p>
                  <p className="text-[var(--text-primary)] mt-1 leading-relaxed">
                    {activeCuotaAdapt.trazabilidad.motivoImporte}
                  </p>
                </div>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-3 font-mono tabular-nums space-y-1">
                  <p className="text-[11px] text-[var(--text-muted)]">Flujo del periodo</p>
                  <p className="text-[var(--text-primary)]">
                    Ventas: S/{" "}
                    {activeCuotaAdapt.trazabilidad.ingresosProyectados.toLocaleString("es-PE")}
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Egresos: -S/{" "}
                    {activeCuotaAdapt.trazabilidad.costosYObligacionesDescontadas.toLocaleString(
                      "es-PE"
                    )}
                  </p>
                  <p className="text-[var(--accent-teal)] font-semibold">
                    Utilidad: S/{" "}
                    {activeCuotaAdapt.trazabilidad.utilidadNetaEstimada.toLocaleString("es-PE")}
                  </p>
                </div>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-3">
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">
                    Sensibilidad ingresos -20%
                  </p>
                  <p className="text-[var(--text-primary)] mt-1 leading-relaxed">
                    {activeCuotaAdapt.trazabilidad.restriccionVerificada}
                  </p>
                  <p className="text-[var(--text-secondary)] mt-1 font-mono tabular-nums">
                    Nuevo ratio:{" "}
                    {activeCuotaAdapt.trazabilidad.sensibilidadCaida20Pct.nuevoRatioSiCae20Pct !==
                    null
                      ? `${(
                          activeCuotaAdapt.trazabilidad.sensibilidadCaida20Pct
                            .nuevoRatioSiCae20Pct * 100
                        ).toFixed(1)}%`
                      : "N/A"}{" "}
                    ({activeCuotaAdapt.trazabilidad.sensibilidadCaida20Pct.estadoSiCae20Pct}) · Fija:
                    S/ {(activeCuotaTrad?.cuotaTotal ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CollapsiblePanel>
        )}

        <CollapsiblePanel
          title="Desglose financiero, validador independiente y función J(P)"
          summary={`Cierre S/ ${adaptado.validacionIndependiente.saldoFinalVerificado.toFixed(2)} · ${
            adaptado.validacionIndependiente.valido ? "Válido" : "Observado"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <ShieldCheck
                  className={`w-4 h-4 ${
                    adaptado.validacionIndependiente.valido
                      ? "text-[var(--accent-positive)]"
                      : "text-[var(--accent-risk)]"
                  }`}
                />
                <span>Verificación independiente (cierre S/ 0.00)</span>
              </div>
              <p className="text-[var(--text-secondary)]">{comparacion.motivoSeleccion}</p>
              <ul className="space-y-1.5 pt-1">
                {adaptado.validacionIndependiente.reglasVerificadas.map((r) => (
                  <li key={r.codigo} className="flex items-start gap-2">
                    {r.aprobada ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-positive)] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[var(--accent-risk)] shrink-0 mt-0.5" />
                    )}
                    <span>
                      <strong className="text-[var(--text-primary)]">
                        {r.codigo} {r.nombre}:
                      </strong>{" "}
                      <span className="text-[var(--text-muted)]">{r.detalle}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-3 font-mono tabular-nums">
                <div>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans">
                    Intereses (Fijo / Adapt.)
                  </p>
                  <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                    S/ {tradicional.totalIntereses.toFixed(2)} / S/{" "}
                    {adaptado.totalIntereses.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans">
                    Seguros (Fijo / Adapt.)
                  </p>
                  <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                    S/ {tradicional.totalSeguros.toFixed(2)} / S/{" "}
                    {adaptado.totalSeguros.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans">TEA / TED</p>
                  <p className="text-[var(--text-secondary)] mt-0.5">
                    {(adaptado.tea * 100).toFixed(1)}% / {(adaptado.ted * 100).toFixed(4)}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans">CV cuotas</p>
                  <p className="text-[var(--text-secondary)] mt-0.5">
                    {adaptado.variabilidadCuotasCV}%
                  </p>
                </div>
              </div>

              {adaptado.optimizadorDetalle && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[var(--text-muted)]">Función objetivo</span>
                    <span className="text-[var(--accent-teal)] font-semibold">
                      J(P) = {adaptado.optimizadorDetalle.valorTotalObjetivo.toFixed(4)}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-3 py-2 rounded border border-[var(--border-hairline)]">
                    {adaptado.optimizadorDetalle.formulaTexto}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                    Costo/Monto {adaptado.optimizadorDetalle.costoFinancieroSobreMonto}% · CV(Ratio){" "}
                    {adaptado.optimizadorDetalle.variabilidadRatioCV}% · Conc. máx.{" "}
                    {adaptado.optimizadorDetalle.concentracionMaxAmortPct}% (
                    {adaptado.optimizadorDetalle.iteracionesOptimizador} evals)
                  </p>
                </div>
              )}

              {(tradicional.tceaNota || adaptado.tceaNota) && (
                <p className="text-[11px] text-[var(--accent-warning)]">
                  {adaptado.tceaNota || tradicional.tceaNota}
                </p>
              )}
            </div>
          </div>
        </CollapsiblePanel>
      </div>
    </div>
  );
}
