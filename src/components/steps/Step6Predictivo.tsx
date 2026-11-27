import { useState } from "react";
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
import { CollapsiblePanel } from "./CollapsiblePanel";
import { StepVisual } from "./StepVisual";

interface Step6PredictivoProps {
  input: AnalisisInput;
  predictivo: ResultadoPredictivo;
}

type EscenarioVista = "Base" | "Conservador" | "Favorable";

export function Step6Predictivo({ input, predictivo }: Step6PredictivoProps) {
  const [escenario, setEscenario] = useState<EscenarioVista>("Base");

  const chartData = predictivo.proyecciones.map((p) => ({
    periodo: p.etiquetaPeriodo,
    ventas:
      escenario === "Conservador"
        ? p.ventasRangoInferior
        : escenario === "Favorable"
        ? p.ventasRangoSuperior
        : p.ventasEsperadas,
    rangoInf: p.ventasRangoInferior,
    rangoSup: p.ventasRangoSuperior,
    utilidad:
      escenario === "Conservador"
        ? p.utilidadConservadora
        : escenario === "Favorable"
        ? p.utilidadFavorable
        : p.utilidadNetaDisponible,
  }));

  const calendario12 = MESES_CORTOS.map((mes, idx) => {
    const match = predictivo.proyecciones.find((p) => p.mesCalendarioIndice === idx);
    return {
      mes,
      indice: match?.indiceEstacional ?? 1.0,
      clasificacion: match?.clasificacionCapacidad ?? "Media",
      utilidad: match?.utilidadNetaDisponible ?? predictivo.utilidadNetaPromedio,
    };
  });

  const { trazabilidad } = predictivo;

  return (
    <div className="space-y-7">
      <div className="pb-5 border-b border-[var(--border-hairline)] flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--accent-teal)]">06 · Proyección estadística</p>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
            Análisis predictivo
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {input.negocio.nombreComercial} · {input.negocio.actividadEspecifica} ({input.negocio.departamento})
          </p>
        </div>
        <StepVisual step={6} />
      </div>

      {/* Síntesis esencial */}
      <div className="bg-[var(--bg-ink)] text-[var(--text-on-ink)] border border-[var(--border-ink)] rounded-xl overflow-hidden grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-ink)]">
        <div className="p-4 sm:p-5">
          <p className="text-xs text-[var(--text-on-ink-muted)]">Confianza</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[var(--accent-teal-ink)] mt-1.5">
            {predictivo.nivelConfianza}/100
          </p>
          <p className="text-[11px] text-[var(--text-on-ink-muted)] mt-0.5 font-mono tabular-nums">
            {predictivo.mesesDisponiblesCount}/12 meses
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs text-[var(--text-on-ink-muted)]">Tendencia</p>
          <p className="text-lg font-semibold text-[var(--text-on-ink)] mt-1.5">
            {predictivo.tendencia}
          </p>
          <p className="text-[11px] text-[var(--text-on-ink-muted)] font-mono tabular-nums mt-0.5">
            {predictivo.pendienteMensualPct > 0 ? "+" : ""}
            {predictivo.pendienteMensualPct}%/mes
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs text-[var(--text-on-ink-muted)]">Utilidad prom.</p>
          <p className="text-xl font-semibold font-mono tabular-nums text-[var(--text-on-ink)] mt-1.5">
            S/ {predictivo.utilidadNetaPromedio.toLocaleString("es-PE")}
          </p>
          <p className="text-[11px] text-[var(--text-on-ink-muted)] font-mono tabular-nums mt-0.5">
            Base mensual
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs text-[var(--text-on-ink-muted)]">Mayor capacidad</p>
          <p className="text-sm font-semibold font-mono text-[var(--accent-teal-ink)] mt-2">
            {predictivo.mesesMayorCapacidad.join(" · ")}
          </p>
        </div>

        <div className="p-4 sm:p-5 col-span-2 lg:col-span-1">
          <p className="text-xs text-[var(--text-on-ink-muted)]">Menor capacidad</p>
          <p className="text-sm font-semibold font-mono text-amber-300 mt-2">
            {predictivo.mesesMenorCapacidad.join(" · ")}
          </p>
        </div>
      </div>

      {/* Selector de 3 escenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[var(--border-hairline)] bg-[var(--bg-surface)]">
        {(
          [
            {
              id: "Conservador" as const,
              title: "Conservador (P10)",
              val: predictivo.utilidadConservadoraPromedio,
              desc: "Escenario bajo de resistencia.",
            },
            {
              id: "Base" as const,
              title: "Base (Esperado)",
              val: predictivo.utilidadNetaPromedio,
              desc: "Referencia para el cronograma.",
            },
            {
              id: "Favorable" as const,
              title: "Favorable (P90)",
              val: predictivo.utilidadFavorablePromedio,
              desc: "Escenario alto de campaña.",
            },
          ] as const
        ).map((sc) => {
          const active = escenario === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setEscenario(sc.id)}
              aria-pressed={active}
              className={`text-left p-4 transition-colors ${
                active ? "bg-[var(--accent-teal-soft)]" : "hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">{sc.title}</span>
                {active && (
                  <span className="text-[11px] font-mono font-semibold text-[var(--accent-teal)]">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                S/ {sc.val.toLocaleString("es-PE")} / mes
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      {predictivo.advertenciasDatos.length > 0 && (
        <p className="text-xs text-[var(--accent-warning)] bg-[var(--accent-warning-soft)] border border-[var(--accent-warning)]/35 rounded-lg px-4 py-2.5">
          {predictivo.advertenciasDatos[0]}
        </p>
      )}

      {/* Gráfico principal */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-hairline)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Proyección de ventas y utilidad ({escenario})
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs inline-block"
                style={{ backgroundColor: "var(--chart-bar-secondary)" }}
                aria-hidden="true"
              />
              Ventas
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-teal)]">
              <span
                className="w-3 h-0.5 inline-block"
                style={{ backgroundColor: "var(--accent-teal)" }}
                aria-hidden="true"
              />
              Utilidad neta
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
                tickFormatter={(v) => `S/${Math.round(Number(v) / 1000)}k`}
                width={52}
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
                    ventas: `Ventas (${escenario})`,
                    rangoSup: "Banda P90",
                    rangoInf: "Banda P10",
                    utilidad: `Utilidad (${escenario})`,
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
                fill="var(--chart-bar-base)"
                fillOpacity={0.2}
              />
              <Bar
                dataKey="ventas"
                fill="var(--chart-bar-secondary)"
                radius={[3, 3, 0, 0]}
                barSize={22}
              />
              <Line
                type="monotone"
                dataKey="rangoInf"
                stroke="var(--chart-bar-base)"
                strokeDasharray="4 4"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="utilidad"
                stroke="var(--accent-teal)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--accent-teal)", strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendario de estacionalidad */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Estacionalidad anual (1.00 = promedio)
          </h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-x divide-y divide-[var(--border-hairline)] bg-[var(--bg-surface)]">
          {calendario12.map((item) => {
            const isAlta = item.clasificacion === "Alta";
            const isBaja = item.clasificacion === "Baja";
            return (
              <div
                key={item.mes}
                className={`p-2.5 text-center ${
                  isAlta
                    ? "bg-[var(--accent-teal-soft)]"
                    : isBaja
                    ? "bg-[var(--accent-warning-soft)]"
                    : "bg-[var(--bg-surface)]"
                }`}
              >
                <p className="text-xs font-semibold text-[var(--text-primary)]">{item.mes}</p>
                <p
                  className={`text-xs font-mono tabular-nums mt-0.5 font-medium ${
                    isAlta
                      ? "text-[var(--accent-teal)]"
                      : isBaja
                      ? "text-[var(--accent-warning)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {item.indice.toFixed(2)}x
                </p>
                <p
                  className={`text-[10px] font-mono mt-0.5 ${
                    isAlta
                      ? "text-[var(--accent-teal)]"
                      : isBaja
                      ? "text-[var(--accent-warning)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {item.clasificacion}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalles secundarios y técnicos desplegables */}
      <div className="space-y-3">
        <CollapsiblePanel
          title="Factores que explican el comportamiento"
          summary={`${predictivo.factoresExplicativos.length} factores`}
        >
          <ul className="divide-y divide-[var(--border-hairline)] text-xs text-[var(--text-secondary)]">
            {predictivo.factoresExplicativos.map((factor, i) => (
              <li key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5 leading-relaxed">
                <span className="font-mono text-[var(--accent-teal)] font-semibold shrink-0">
                  0{i + 1}.
                </span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
          {predictivo.advertenciasDatos.length > 1 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] space-y-1 text-xs text-[var(--accent-warning)]">
              {predictivo.advertenciasDatos.slice(1).map((adv, idx) => (
                <p key={idx}>{adv}</p>
              ))}
            </div>
          )}
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Detalles técnicos y trazabilidad del modelo"
          summary={`${trazabilidad.metodoSeleccionado.split("+")[0].trim()} · σ=${trazabilidad.sigmaResidualPct}%`}
        >
          <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
            <p>
              <strong className="text-[var(--text-primary)]">Método:</strong>{" "}
              {trazabilidad.metodoSeleccionado} — {trazabilidad.justificacionMetodo}
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Procedencia:</strong>{" "}
              {trazabilidad.procedenciaDatos} · Historial {(trazabilidad.pesoHistorialIndividual * 100).toFixed(0)}% / Referencia{" "}
              {(trazabilidad.pesoReferenciaSectorActividadZona * 100).toFixed(0)}% · Volatilidad{" "}
              {predictivo.volatilidadPct}%
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[var(--text-muted)]">
              {trazabilidad.supuestosAplicados.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
            <p className="text-[11px] text-[var(--accent-warning)] pt-2 border-t border-[var(--border-hairline)]">
              {trazabilidad.avisoNoGarantia}
            </p>
          </div>
        </CollapsiblePanel>
      </div>
    </div>
  );
}
