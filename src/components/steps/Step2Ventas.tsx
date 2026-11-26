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
    <div className="space-y-8">
      <div className="pb-5 border-b border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--accent-teal)]">Etapa 02 · Serie histórica</p>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
            2. Ventas mensuales
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Registra las ventas de los últimos 12 meses. Si algún mes no está disponible, déjalo
            vacío: el modelo ajustará la confianza sin inventar cifras.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDemoCases}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[var(--accent-teal)] bg-[var(--accent-teal-soft)] border border-[var(--accent-teal)]/25 rounded-lg hover:opacity-85 transition-opacity whitespace-nowrap shrink-0"
        >
          <Database className="w-3.5 h-3.5" aria-hidden="true" />
          Usar perfil sintético precargado
        </button>
      </div>

      {/* Ledger de síntesis estacional */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--border-hairline)] rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-hairline)] bg-[var(--bg-elevated)]">
        <div className="p-4">
          <p className="text-[11px] text-[var(--text-muted)]">Meses disponibles</p>
          <p className="text-lg font-semibold text-[var(--text-primary)] font-mono tabular-nums mt-1">
            {mesesDisponibles} / 12
          </p>
        </div>
        <div className="p-4">
          <p className="text-[11px] text-[var(--text-muted)]">Tendencia observada</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] font-mono tabular-nums mt-1.5">
            {tendenciaLabel}
          </p>
        </div>
        <div className="p-4">
          <p className="text-[11px] text-[var(--text-muted)]">Meses de mayores ingresos</p>
          <p className="text-sm font-semibold text-[var(--accent-teal)] font-mono mt-1.5">
            {mesesMayores.length ? mesesMayores.join(" · ") : "—"}
          </p>
        </div>
        <div className="p-4">
          <p className="text-[11px] text-[var(--text-muted)]">Meses de menores ingresos</p>
          <p className="text-sm font-semibold text-[var(--accent-warning)] font-mono mt-1.5">
            {mesesMenores.length ? mesesMenores.join(" · ") : "—"}
          </p>
        </div>
      </div>

      {mesesDisponibles < 12 && (
        <div className="bg-[var(--accent-warning-soft)] border border-[var(--accent-warning)]/30 rounded-lg px-4 py-3 text-xs text-[var(--text-primary)]">
          <strong className="text-[var(--accent-warning)]">Información parcial ({mesesDisponibles} de 12 meses registrados):</strong>{" "}
          el sistema usará patrones sintéticos sectoriales y regionales para los meses sin historial
          y reducirá el nivel de confianza de la estimación.
        </div>
      )}

      {error && (
        <div className="bg-[var(--accent-risk-soft)] border border-[var(--accent-risk)]/35 rounded-lg px-4 py-3 text-xs text-[var(--accent-risk)] font-medium">
          {error}
        </div>
      )}

      {/* Gráfico de ventas */}
      <div className="border border-[var(--border-hairline)] bg-[var(--bg-elevated)] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Perfil histórico de ventas (S/)
          </p>
          {promedio > 0 && (
            <p className="text-xs font-mono tabular-nums text-[var(--text-primary)]">
              Promedio: S/ {promedio.toLocaleString("es-PE")}
            </p>
          )}
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "var(--chart-tick)", fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "var(--border-hairline)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--chart-tick)", fontFamily: "var(--font-mono)" }}
                tickFormatter={(val) => `${Math.round(Number(val) / 1000)}k`}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--chart-tooltip-bg)",
                  borderColor: "var(--chart-tooltip-border)",
                  color: "var(--chart-tooltip-text)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                }}
                itemStyle={{ color: "var(--chart-tooltip-text)" }}
                labelStyle={{ color: "var(--text-on-ink-muted)", fontWeight: 600 }}
                formatter={(value) => [
                  `S/ ${Number(value).toLocaleString("es-PE")}`,
                  "Ventas",
                ]}
              />
              <Bar dataKey="ventas" fill="var(--accent-teal)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Matriz editable de 12 meses */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {ventas.map((v, idx) => (
          <div
            key={v.etiquetaMes}
            className="border border-[var(--border-hairline)] rounded-lg p-3 bg-[var(--bg-elevated)]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor={`venta-mes-${idx}`}
                className="text-xs font-semibold text-[var(--text-primary)]"
              >
                {v.etiquetaMes}
              </label>
              {v.monto !== null && (
                <button
                  type="button"
                  onClick={() => updateMonth(idx, "")}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-risk)] transition-colors"
                  title="Marcar como no disponible"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="relative">
              <span className="text-xs font-mono text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2">
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
                className="w-full pl-7 pr-2 py-1.5 text-sm font-mono tabular-nums bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-md focus:outline-none focus:border-[var(--accent-teal)]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
