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
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Cumple
      </span>
    );
  }
  if (estado === "Riesgo") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5" />
        Riesgo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap">
      <XCircle className="w-3.5 h-3.5" />
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
        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <tr>
            <th className="py-2.5 px-3 font-medium">Cuota</th>
            <th className="py-2.5 px-3 font-medium">Vencimiento</th>
            <th className="py-2.5 px-3 font-medium text-right">Días</th>
            <th className="py-2.5 px-3 font-medium text-right">Saldo inicial</th>
            <th className="py-2.5 px-3 font-medium text-right">Capital</th>
            <th className="py-2.5 px-3 font-medium text-right">Interés</th>
            <th className="py-2.5 px-3 font-medium text-right">Seguros</th>
            <th className="py-2.5 px-3 font-medium text-right">Cuota total</th>
            <th className="py-2.5 px-3 font-medium text-right">Saldo final</th>
            <th className="py-2.5 px-3 font-medium text-right">Cuota/Util.</th>
            <th className="py-2.5 px-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
          {cuotas.map((c) => (
            <tr key={c.numeroCuota} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
              <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {c.etiquetaPeriodo}
              </td>
              <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {c.fechaVencimiento}
              </td>
              <td className="py-2 px-3 font-mono tabular-nums text-right text-slate-600 dark:text-slate-400">
                {c.diasPeriodo}
              </td>
              <td className="py-2 px-3 font-mono tabular-nums text-right">
                S/ {c.saldoInicial.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 font-mono tabular-nums text-right">
                S/ {c.amortizacionCapital.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 font-mono tabular-nums text-right">
                S/ {c.interesPeriodo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 font-mono tabular-nums text-right">
                S/ {c.segurosTotales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-[#0B1F3A] dark:text-white">
                S/ {c.cuotaTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 font-mono tabular-nums text-right">
                S/ {c.saldoFinal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 font-mono tabular-nums text-right">
                {c.ratioCuotaUtilidad !== null
                  ? `${(c.ratioCuotaUtilidad * 100).toFixed(1)}%`
                  : "N/A"}
              </td>
              <td className="py-2 px-3">
                <StatusCell estado={c.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">
          7. Comparación de cronogramas y optimización
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Contraste matemático entre el cronograma tradicional de cuota fija y el cronograma
          adaptado bajo la restricción individual Cuota / Utilidad neta ≤{" "}
          <span className="font-mono font-semibold text-slate-900 dark:text-white">{(factorMaximo * 100).toFixed(0)}%</span>.
        </p>
      </div>

      {/* Alerta explícita de no viabilidad cuando corresponda */}
      {!adaptado.viable && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3"
        >
          <XCircle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Crédito no viable bajo los parámetros actuales
            </p>
            <p className="text-xs text-rose-800 dark:text-rose-200/90 mt-1 leading-relaxed">
              {adaptado.motivoNoViabilidad}
            </p>
          </div>
        </div>
      )}

      {/* Resumen transparente de valor y costo */}
      <div
        className={`rounded-xl border p-4 text-xs leading-relaxed ${
          comparacion.adaptadoEsMasCaro
            ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-200"
            : "bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80 text-teal-950 dark:text-teal-200"
        }`}
      >
        <p className="font-semibold">{comparacion.resumenValor}</p>
        {comparacion.adaptadoEsMasCaro && (
          <p className="mt-1 text-amber-900 dark:text-amber-200/90">
            Nota de transparencia: el cronograma adaptado presenta un costo financiero total
            superior en S/ {comparacion.diferenciaCostoTotal.toLocaleString("es-PE")} respecto al
            cronograma tradicional porque posterga parte de la amortización hacia los meses de
            mayor liquidez.
          </p>
        )}
      </div>

      {/* Tarjetas comparativas de métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan Tradicional */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
              Plan A · Cronograma tradicional (cuota fija)
            </h3>
            <span
              className={`text-xs font-semibold ${
                tradicional.viable ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {tradicional.viable ? "Viable" : "Incumple capacidad"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Cuota fija aprox.</p>
              <p className="text-base font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white mt-0.5">
                S/ {tradicional.cuotaPromedio.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Intereses totales</p>
              <p className="text-base font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white mt-0.5">
                S/ {tradicional.totalIntereses.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Seguros totales</p>
              <p className="text-base font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white mt-0.5">
                S/ {tradicional.totalSeguros.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Costo total (Int. + Seg.)</p>
              <p className="text-base font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white mt-0.5">
                S/ {tradicional.costoTotalCredito.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">TCEA / TEA / TED</p>
              <p className="text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-1">
                {tradicional.tcea !== null
                  ? `${(tradicional.tcea * 100).toFixed(2)}%`
                  : "N/D"}{" "}
                / {(tradicional.tea * 100).toFixed(1)}% /{" "}
                {(tradicional.ted * 100).toFixed(4)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Periodos que incumplen</p>
              <p
                className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                  tradicional.periodosIncumplen > 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {tradicional.periodosIncumplen} de {tradicional.cuotas.length}
              </p>
            </div>
          </div>
          {tradicional.tceaNota && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">{tradicional.tceaNota}</p>
          )}
        </div>

        {/* Plan Adaptado */}
        <div className="bg-[#0B1F3A] dark:bg-slate-800 border border-transparent dark:border-slate-700 text-white rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Plan B · Cronograma adaptado al ciclo económico
            </h3>
            <span
              className={`text-xs font-semibold ${
                adaptado.viable ? "text-teal-300" : "text-rose-300"
              }`}
            >
              {adaptado.viable ? "Viable" : "No viable"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-slate-300">Rango de cuotas</p>
              <p className="text-base font-bold font-mono tabular-nums text-teal-300 mt-0.5">
                S/ {Math.round(adaptado.cuotaMinima).toLocaleString("es-PE")} –{" "}
                {Math.round(adaptado.cuotaMaxima).toLocaleString("es-PE")}
              </p>
            </div>
            <div>
              <p className="text-slate-300">Intereses totales</p>
              <p className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
                S/ {adaptado.totalIntereses.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-300">Seguros totales</p>
              <p className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
                S/ {adaptado.totalSeguros.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-300">Costo total (Int. + Seg.)</p>
              <p className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
                S/ {adaptado.costoTotalCredito.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-300">TCEA / TEA / TED</p>
              <p className="text-xs font-mono tabular-nums text-slate-200 mt-1">
                {adaptado.tcea !== null
                  ? `${(adaptado.tcea * 100).toFixed(2)}%`
                  : "N/D"}{" "}
                / {(adaptado.tea * 100).toFixed(1)}% /{" "}
                {(adaptado.ted * 100).toFixed(4)}%
              </p>
            </div>
            <div>
              <p className="text-slate-300">Periodos que incumplen</p>
              <p
                className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                  adaptado.periodosIncumplen > 0 ? "text-rose-300" : "text-teal-300"
                }`}
              >
                {adaptado.periodosIncumplen} de {adaptado.cuotas.length}
              </p>
            </div>
          </div>
          {adaptado.tceaNota && (
            <p className="text-[11px] text-amber-300">{adaptado.tceaNota}</p>
          )}
        </div>
      </div>

      {/* Gráfico comparativo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white mb-1">
          Cuota tradicional vs. Cuota adaptada vs. Techo máximo de capacidad
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Cualquier barra que supere la línea punteada excede el límite de capacidad de pago del
          periodo.
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
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
              <Bar dataKey="cuotaTradicional" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="cuotaAdaptada" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={16} />
              <Line
                type="monotone"
                dataKey="capacidadMax"
                stroke="#EF4444"
                strokeDasharray="5 4"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "#EF4444" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selector de tabla detallada */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">Detalle por periodo</h3>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setTab("comparativa")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "comparativa"
                  ? "bg-white dark:bg-slate-700 text-[#0B1F3A] dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Comparativa lado a lado
            </button>
            <button
              type="button"
              onClick={() => setTab("tradicional")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "tradicional"
                  ? "bg-white dark:bg-slate-700 text-[#0B1F3A] dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Detalle Tradicional
            </button>
            <button
              type="button"
              onClick={() => setTab("adaptado")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "adaptado"
                  ? "bg-white dark:bg-slate-700 text-[#0B1F3A] dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Detalle Adaptado
            </button>
          </div>
        </div>

        {tab === "comparativa" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Periodo</th>
                  <th className="py-2.5 px-3 font-medium text-right">Utilidad neta</th>
                  <th className="py-2.5 px-3 font-medium text-right">Cap. máxima</th>
                  <th className="py-2.5 px-3 font-medium text-right">Cuota fija</th>
                  <th className="py-2.5 px-3 font-medium text-right">Ratio fijo</th>
                  <th className="py-2.5 px-3 font-medium">Estado fijo</th>
                  <th className="py-2.5 px-3 font-medium text-right">Cuota adaptada</th>
                  <th className="py-2.5 px-3 font-medium text-right">Ratio adapt.</th>
                  <th className="py-2.5 px-3 font-medium">Estado adapt.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {adaptado.cuotas.map((cAdapt, idx) => {
                  const cTrad = tradicional.cuotas[idx];
                  return (
                    <tr key={cAdapt.numeroCuota} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {cAdapt.etiquetaPeriodo}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        S/ {cAdapt.utilidadNetaPeriodo.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-600 dark:text-slate-400">
                        S/ {cAdapt.capacidadMaximaPermitida.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        S/ {(cTrad?.cuotaTotal ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        {cTrad?.ratioCuotaUtilidad !== null
                          ? `${(cTrad.ratioCuotaUtilidad * 100).toFixed(1)}%`
                          : "N/A"}
                      </td>
                      <td className="py-2.5 px-3">
                        {cTrad && <StatusCell estado={cTrad.estado} />}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-teal-800 dark:text-teal-300">
                        S/ {cAdapt.cuotaTotal.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
