import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MESES_CORTOS } from "../../engines/catalogs";
import { AnalisisInput, ResultadoPredictivo } from "../../types/negova";

interface Step6PredictivoProps {
  input: AnalisisInput;
  predictivo: ResultadoPredictivo;
}

export function Step6Predictivo({ input, predictivo }: Step6PredictivoProps) {
  const chartData = predictivo.proyecciones.map((p) => ({
    periodo: p.etiquetaPeriodo,
    ventas: p.ventasEsperadas,
    rangoInf: p.ventasRangoInferior,
    rangoSup: p.ventasRangoSuperior,
    utilidad: p.utilidadNetaDisponible,
  }));

  // Agrupar estacionalidad por los 12 meses calendario
  const calendario12 = MESES_CORTOS.map((mes, idx) => {
    const match = predictivo.proyecciones.find((p) => p.mesCalendarioIndice === idx);
    return {
      mes,
      indice: match?.indiceEstacional ?? 1.0,
      clasificacion: match?.clasificacionCapacidad ?? "Media",
      utilidad: match?.utilidadNetaDisponible ?? predictivo.utilidadNetaPromedio,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">6. Análisis predictivo del ciclo económico</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Estimación estadística híbrida para{" "}
          <strong className="font-semibold text-slate-900 dark:text-white">{input.negocio.nombreComercial}</strong>{" "}
          ({input.negocio.actividadEspecifica} · {input.negocio.provincia}, {input.negocio.departamento}).
        </p>
      </div>

      {/* Tarjeta oscura institucional de síntesis */}
      <div className="bg-[#0B1F3A] dark:bg-slate-800 border border-transparent dark:border-slate-700 text-white rounded-xl p-5 grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <p className="text-xs text-slate-300">Nivel de confianza</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-teal-300 mt-1">
            {predictivo.nivelConfianza}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {predictivo.mesesDisponiblesCount}/12 meses reales
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-300">Tendencia y volatilidad</p>
          <p className="text-lg font-bold text-white mt-1">{predictivo.tendencia}</p>
          <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
            Volatilidad: {predictivo.volatilidadPct}%
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-300">Utilidad neta prom.</p>
          <p className="text-lg font-bold font-mono tabular-nums text-white mt-1">
            S/ {predictivo.utilidadNetaPromedio.toLocaleString("es-PE")}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Disponible por periodo</p>
        </div>

        <div>
          <p className="text-xs text-slate-300">Mayor capacidad</p>
          <p className="text-base font-bold text-teal-300 mt-1">
            {predictivo.mesesMayorCapacidad.join(" · ")}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tramos de mayor holgura</p>
        </div>

        <div>
          <p className="text-xs text-slate-300">Menor capacidad</p>
          <p className="text-base font-bold text-amber-300 mt-1">
            {predictivo.mesesMenorCapacidad.join(" · ")}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tramos de menor holgura</p>
        </div>
      </div>

      {/* Advertencias sobre datos parciales o negativos */}
      {predictivo.advertenciasDatos.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Consideraciones de información e incertidumbre</p>
          {predictivo.advertenciasDatos.map((adv, idx) => (
            <p key={idx} className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
              {adv}
            </p>
          ))}
        </div>
      )}

      {/* Gráfico principal de evolución de ingresos, banda de incertidumbre y utilidad neta */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
              Evolución proyectada de ingresos, rango de incertidumbre y utilidad neta
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Banda superior/inferior calculada según confianza documental y volatilidad histórica
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
            <span>Ventas esperadas (barra)</span>
            <span aria-hidden="true">·</span>
            <span className="text-teal-700 dark:text-teal-400 font-medium">Utilidad neta (línea)</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickFormatter={(v) => `S/${Math.round(Number(v) / 1000)}k`}
                width={52}
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
                    ventas: "Ventas esperadas",
                    rangoSup: "Escenario superior",
                    rangoInf: "Escenario inferior",
                    utilidad: "Utilidad neta disponible",
                  };
                  return [
                    `S/ ${Number(value).toLocaleString("es-PE")}`,
                    labels[String(name)] ?? String(name),
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="rangoSup"
                stroke="none"
                fill="#94A3B8"
                fillOpacity={0.22}
              />
              <Bar dataKey="ventas" fill="#3B6E9C" radius={[4, 4, 0, 0]} barSize={24} />
              <Line
                type="monotone"
                dataKey="rangoInf"
                stroke="#94A3B8"
                strokeDasharray="4 4"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="utilidad"
                stroke="#0D9488"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0D9488" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendario de estacionalidad */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white mb-1">Calendario de estacionalidad</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Índice estacional combinado (1.00 = promedio anual del negocio)
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5">
          {calendario12.map((item) => {
            const boxStyle =
              item.clasificacion === "Alta"
                ? "bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200"
                : item.clasificacion === "Baja"
                ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200"
                : "bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200";
            return (
              <div
                key={item.mes}
                className={`border rounded-xl p-2.5 text-center ${boxStyle}`}
              >
                <p className="text-xs font-bold">{item.mes}</p>
                <p className="text-xs font-mono tabular-nums mt-1">
                  {item.indice.toFixed(2)}x
                </p>
                <p className="text-[10px] font-medium mt-0.5">{item.clasificacion}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Factores explicativos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white mb-3">
          Principales factores que explican el comportamiento estimado
        </h3>
        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          {predictivo.factoresExplicativos.map((factor, i) => (
            <li key={i} className="flex items-start gap-2.5 leading-relaxed">
              <span className="font-mono text-teal-700 dark:text-teal-400 font-semibold shrink-0">
                0{i + 1}.
              </span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
