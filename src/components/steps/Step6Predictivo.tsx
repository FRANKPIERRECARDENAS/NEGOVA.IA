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
    <div className="space-y-8">
      <div className="pb-5 border-b border-[var(--border-hairline)] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--accent-teal)]">
            Etapa 06 · Proyección estadística híbrida
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
            6. Análisis predictivo del ciclo económico
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
            Estimación estadística para{" "}
            <strong className="font-semibold text-[var(--text-primary)]">
              {input.negocio.nombreComercial}
            </strong>{" "}
            ({input.negocio.actividadEspecifica} · {input.negocio.provincia},{" "}
            {input.negocio.departamento}).
          </p>
        </div>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg px-3.5 py-2 text-xs shrink-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Método seleccionado adaptativamente
          </p>
          <p className="font-semibold text-[var(--accent-teal)] mt-0.5">
            {trazabilidad.metodoSeleccionado}
          </p>
        </div>
      </div>

      {/* Ledger institucional de síntesis predictiva */}
      <div className="bg-[var(--bg-ink)] text-[var(--text-on-ink)] border border-[var(--border-ink)] rounded-xl overflow-hidden grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-ink)]">
        <div className="p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-on-ink-muted)]">
            Índice respaldo / confianza
          </p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[var(--accent-teal-ink)] mt-2">
            {predictivo.nivelConfianza}/100
          </p>
          <p className="text-[11px] text-[var(--text-on-ink-muted)] mt-1 font-mono tabular-nums">
            {predictivo.mesesDisponiblesCount}/12 meses reales · σ={trazabilidad.sigmaResidualPct}%
          </p>
        </div>

        <div className="p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-on-ink-muted)]">
            Tendencia y volatilidad
          </p>
          <p className="text-lg font-semibold text-[var(--text-on-ink)] mt-2">
            {predictivo.tendencia}
          </p>
          <p className="text-[11px] text-[var(--text-on-ink-muted)] font-mono tabular-nums mt-1">
            {predictivo.pendienteMensualPct > 0 ? "+" : ""}
            {predictivo.pendienteMensualPct}%/mes · Vol. {predictivo.volatilidadPct}%
          </p>
        </div>

        <div className="p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-on-ink-muted)]">
            Utilidad neta prom. (Base)
          </p>
          <p className="text-xl font-semibold font-mono tabular-nums text-[var(--text-on-ink)] mt-2">
            S/ {predictivo.utilidadNetaPromedio.toLocaleString("es-PE")}
          </p>
          <p className="text-[11px] text-[var(--text-on-ink-muted)] font-mono tabular-nums mt-1">
            P10: S/ {predictivo.utilidadConservadoraPromedio.toLocaleString("es-PE")}
          </p>
        </div>

        <div className="p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-on-ink-muted)]">
            Mayor capacidad
          </p>
          <p className="text-sm font-semibold font-mono text-[var(--accent-teal-ink)] mt-2.5 leading-snug">
            {predictivo.mesesMayorCapacidad.join(" · ")}
          </p>
          <p className="text-[11px] text-[var(--text-on-ink-muted)] mt-1">
            Tramos de mayor holgura
          </p>
        </div>

        <div className="p-5 col-span-2 lg:col-span-1">
          <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-on-ink-muted)]">
            Menor capacidad
          </p>
          <p className="text-sm font-semibold font-mono text-amber-300 mt-2.5 leading-snug">
            {predictivo.mesesMenorCapacidad.join(" · ")}
          </p>
          <p className="text-[11px] text-[var(--text-on-ink-muted)] mt-1">
            Tramos de menor holgura
          </p>
        </div>
      </div>

      {/* 3 Escenarios explícitos */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[var(--border-hairline)] bg-[var(--bg-surface)]">
        {(
          [
            {
              id: "Conservador" as const,
              title: "Escenario Conservador (P10)",
              val: predictivo.utilidadConservadoraPromedio,
              desc: "Límite inferior de banda estadística 80% (z=1.2816); evalúa resistencia ante ventas bajas.",
            },
            {
              id: "Base" as const,
              title: "Escenario Base (Esperado)",
              val: predictivo.utilidadNetaPromedio,
              desc: "Valor esperado sobre el cual se optimiza el cronograma adaptado de pagos.",
            },
            {
              id: "Favorable" as const,
              title: "Escenario Favorable (P90)",
              val: predictivo.utilidadFavorablePromedio,
              desc: "Límite superior de banda estadística 80%; estima potencial de prepago en campaña.",
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
                active
                  ? "bg-[var(--accent-teal-soft)]"
                  : "hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">{sc.title}</span>
                {active && (
                  <span className="text-[10px] font-mono font-semibold text-[var(--accent-teal)]">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1.5">
                S/ {sc.val.toLocaleString("es-PE")} / mes
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Consideraciones de información e incertidumbre */}
      {predictivo.advertenciasDatos.length > 0 && (
        <div className="bg-[var(--accent-warning-soft)] border border-[var(--accent-warning)]/40 rounded-lg px-4 py-3.5 space-y-1.5">
          <p className="text-xs font-semibold text-[var(--accent-warning)]">
            Consideraciones de información e incertidumbre
          </p>
          {predictivo.advertenciasDatos.map((adv, idx) => (
            <p key={idx} className="text-xs text-[var(--text-primary)] leading-relaxed">
              {adv}
            </p>
          ))}
        </div>
      )}

      {/* Gráfico principal */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-hairline)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Evolución proyectada ({escenario}) e intervalo de predicción 80%
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Banda estadística creciente con el horizonte h: σ_res · √(1 + 1/n) · √(1 + 0.032·h)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs inline-block"
                style={{ backgroundColor: "var(--chart-bar-secondary)" }}
                aria-hidden="true"
              />
              Ventas ({escenario})
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

        <div className="h-72 w-full">
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
                    rangoSup: "Banda P90 (Favorable)",
                    rangoInf: "Banda P10 (Conservador)",
                    utilidad: `Utilidad neta (${escenario})`,
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
      <div className="pt-2 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Calendario de estacionalidad
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Índice estacional combinado (1.00 = promedio anual · Peso historial:{" "}
            {(trazabilidad.pesoHistorialIndividual * 100).toFixed(0)}%, ref. actividad/zona:{" "}
            {(trazabilidad.pesoReferenciaSectorActividadZona * 100).toFixed(0)}%)
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-x divide-y divide-[var(--border-hairline)] bg-[var(--bg-surface)]">
          {calendario12.map((item) => {
            const isAlta = item.clasificacion === "Alta";
            const isBaja = item.clasificacion === "Baja";
            return (
              <div
                key={item.mes}
                className={`p-3 text-center transition-colors ${
                  isAlta
                    ? "bg-[var(--accent-teal-soft)]"
                    : isBaja
                    ? "bg-[var(--accent-warning-soft)]"
                    : "bg-[var(--bg-surface)]"
                }`}
              >
                <p className="text-xs font-semibold text-[var(--text-primary)]">{item.mes}</p>
                <p
                  className={`text-xs font-mono tabular-nums mt-1 font-medium ${
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

      {/* Trazabilidad y supuestos del modelo predictivo */}
      <div className="pt-6 border-t border-[var(--border-hairline)] grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Principales factores que explican el comportamiento estimado
          </h3>
          <ul className="divide-y divide-[var(--border-hairline)] border-t border-b border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]">
            {predictivo.factoresExplicativos.map((factor, i) => (
              <li key={i} className="py-3 flex items-start gap-3 leading-relaxed">
                <span className="font-mono text-[var(--accent-teal)] font-semibold shrink-0">
                  0{i + 1}.
                </span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-4 sm:p-5 space-y-2.5 text-xs">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Trazabilidad metodológica y alcance
          </h3>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Selección:</strong>{" "}
            {trazabilidad.justificacionMetodo}
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Procedencia:</strong>{" "}
            {trazabilidad.procedenciaDatos}
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
      </div>
    </div>
  );
}
