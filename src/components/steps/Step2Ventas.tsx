import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Database } from "lucide-react";
import { MesVenta } from "../../types/negova";

interface Step2VentasProps {
  ventas: MesVenta[];
  onChange: (updated: MesVenta[]) => void;
  onOpenDemoCases: () => void;
  error?: string;
}

export function Step2Ventas({
  ventas,
  onChange,
  onOpenDemoCases,
  error,
}: Step2VentasProps) {
  const validSales = ventas.filter(
    (v): v is { mesIndice: number; etiquetaMes: string; monto: number } =>
      v.monto !== null && v.monto > 0
  );

  const mesesDisponibles = validSales.length;
  const promedio =
    mesesDisponibles > 0
      ? Math.round(validSales.reduce((a, b) => a + b.monto, 0) / mesesDisponibles)
      : 0;

  const sorted = [...validSales].sort((a, b) => b.monto - a.monto);
  const mesesMayores = sorted.slice(0, 3).map((m) => m.etiquetaMes);
  const mesesMenores = sorted.slice(-3).reverse().map((m) => m.etiquetaMes);

  // Tendencia lineal simple en los meses ingresados
  let tendenciaLabel = "Sin datos suficientes";
  if (validSales.length >= 4) {
    const firstHalf = validSales.slice(0, Math.floor(validSales.length / 2));
    const secondHalf = validSales.slice(Math.floor(validSales.length / 2));
    const avg1 = firstHalf.reduce((a, b) => a + b.monto, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b.monto, 0) / secondHalf.length;
    const diffPct = ((avg2 - avg1) / Math.max(1, avg1)) * 100;
    tendenciaLabel =
      diffPct > 3
        ? `Creciente (+${diffPct.toFixed(1)}%)`
        : diffPct < -3
        ? `Decreciente (${diffPct.toFixed(1)}%)`
        : `Estable (${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(1)}%)`;
  }

  const chartData = ventas.map((v) => ({
    mes: v.etiquetaMes,
    ventas: v.monto ?? 0,
    disponible: v.monto !== null,
  }));

  const updateMonth = (idx: number, raw: string) => {
    const next = [...ventas];
    if (raw.trim() === "") {
      next[idx] = { ...next[idx], monto: null };
    } else {
      const parsed = Math.max(0, Number(raw));
      next[idx] = { ...next[idx], monto: Number.isFinite(parsed) ? parsed : null };
    }
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">2. Ventas mensuales</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Registra las ventas de los últimos 12 meses. Si algún mes no está disponible, déjalo
            vacío: el modelo ajustará la confianza sin inventar cifras.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDemoCases}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors whitespace-nowrap shrink-0"
        >
          <Database className="w-3.5 h-3.5" />
          Usar perfil sintético precargado
        </button>
      </div>

      {/* Resumen de tendencia y estacionalidad observada */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Meses disponibles</p>
          <p className="text-lg font-bold text-[#0B1F3A] dark:text-white font-mono tabular-nums mt-0.5">
            {mesesDisponibles} / 12
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Tendencia observada</p>
          <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white mt-1">{tendenciaLabel}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Meses de mayores ingresos</p>
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 mt-1">
            {mesesMayores.length ? mesesMayores.join(", ") : "—"}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Meses de menores ingresos</p>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-1">
            {mesesMenores.length ? mesesMenores.join(", ") : "—"}
          </p>
        </div>
      </div>

      {mesesDisponibles < 12 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
          Información parcial ({mesesDisponibles} de 12 meses registrados). El sistema usará
          patrones sintéticos sectoriales/regionales para los meses sin historial y reducirá el
          nivel de confianza de la estimación.
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl px-4 py-3 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Gráfico de ventas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Perfil histórico de ventas (S/){promedio > 0 ? ` · Promedio S/ ${promedio.toLocaleString("es-PE")}` : ""}
          </p>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickFormatter={(val) => `${Math.round(Number(val) / 1000)}k`}
                width={38}
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
                formatter={(value) => [
                  `S/ ${Number(value).toLocaleString("es-PE")}`,
                  "Ventas",
                ]}
              />
              <Bar dataKey="ventas" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla editable de 12 meses */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {ventas.map((v, idx) => (
          <div
            key={v.etiquetaMes}
            className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800/60"
          >
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor={`venta-mes-${idx}`}
                className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-100"
              >
                {v.etiquetaMes}
              </label>
              {v.monto !== null && (
                <button
                  type="button"
                  onClick={() => updateMonth(idx, "")}
                  className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  title="Marcar como no disponible"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="relative">
              <span className="text-xs text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2">
                S/
              </span>
              <input
                id={`venta-mes-${idx}`}
                type="number"
                min={0}
                step={100}
                value={v.monto === null ? "" : v.monto}
                onChange={(e) => updateMonth(idx, e.target.value)}
                placeholder="No disp."
                className="w-full pl-7 pr-2 py-1.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
