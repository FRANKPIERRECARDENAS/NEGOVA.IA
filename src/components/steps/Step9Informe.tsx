import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
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
import {
  buildLocalFallbackExplanation,
  fetchCommitteeExplanation,
} from "../../engines/localExplainer";
import {
  AnalisisInput,
  ComparacionCronogramas,
  EstadoComite,
  EstadoCumplimiento,
  ExplicacionComite,
  ResultadoPredictivo,
  ResultadoSimulacionExterna,
} from "../../types/negova";
import { BrandLogo } from "../BrandLogo";

interface Step9InformeProps {
  input: AnalisisInput;
  predictivo: ResultadoPredictivo;
  comparacion: ComparacionCronogramas;
  simulacion: ResultadoSimulacionExterna | null;
  estadoComite: EstadoComite;
  onChangeEstadoComite: (estado: EstadoComite) => void;
  onSaveCase: () => void;
  savedNotification: string | null;
}

const ESTADOS_FLUJO: EstadoComite[] = [
  "Generado por el Asesor de Negocios",
  "Pendiente de validación del Asesor de Riesgos",
  "Pendiente de decisión del Comité",
];

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function StatusBadge({ estado }: { estado: EstadoCumplimiento }) {
  if (estado === "Cumple") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-positive)]">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Cumple
      </span>
    );
  }
  if (estado === "Riesgo") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-warning)]">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        Riesgo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-risk)]">
      <XCircle className="w-3 h-3 shrink-0" />
      Incumple
    </span>
  );
}

export function Step9Informe({
  input,
  predictivo,
  comparacion,
  simulacion,
  estadoComite,
  onChangeEstadoComite,
  onSaveCase,
  savedNotification,
}: Step9InformeProps) {
  const [explicacion, setExplicacion] = useState<ExplicacionComite>(() =>
    buildLocalFallbackExplanation(input, predictivo, comparacion, simulacion)
  );
  const [loadingAI, setLoadingAI] = useState(false);

  const loadExplanation = async () => {
    setLoadingAI(true);
    const res = await fetchCommitteeExplanation(input, predictivo, comparacion, simulacion);
    setExplicacion(res);
    setLoadingAI(false);
  };

  useEffect(() => {
    void loadExplanation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    input.idCaso,
    comparacion.adaptado.costoTotalCredito,
    simulacion?.parametros.fenomeno,
    simulacion?.parametros.intensidad,
    simulacion?.parametros.mesInicioPeriodo,
    simulacion?.parametros.duracionMeses,
  ]);

  const handleDownloadHtml = () => {
    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Informe Comité NEGOVA.IA - ${escapeHtml(input.idCaso)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; color: #0A1628; margin: 32px; line-height: 1.5; background: #F6F5F0; }
  h1, h2 { color: #0A1628; }
  .meta { font-size: 13px; color: #414F63; margin-bottom: 20px; }
  .box { background: #ffffff; border: 1px solid #DEDAD0; border-radius: 8px; padding: 16px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; background: #ffffff; }
  th, td { border-bottom: 1px solid #DEDAD0; padding: 6px 8px; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
</style>
</head>
<body>
  <h1>Expediente Técnico de Comité (16 Secciones) · NEGOVA.IA</h1>
  <div class="meta">
    Caso: <strong>${escapeHtml(input.idCaso)}</strong> · Estado: <strong>${escapeHtml(estadoComite)}</strong> · Prototipo Cajathon 2026 (Desafío NEG-01)
  </div>
  <div class="box">
    <h2>1–3. Perfil económico, datos históricos y estacionalidad</h2>
    <p><strong>Negocio:</strong> ${escapeHtml(input.negocio.nombreComercial)} (${escapeHtml(input.negocio.actividadEspecifica)}) · ${escapeHtml(input.negocio.departamento)}/${escapeHtml(input.negocio.provincia)}</p>
    <p><strong>Cobertura histórica:</strong> ${predictivo.mesesDisponiblesCount}/12 meses reales · <strong>Método:</strong> ${escapeHtml(predictivo.trazabilidad.metodoSeleccionado)}</p>
    <p>${escapeHtml(explicacion.explicacionEstacionalidad)}</p>
  </div>
  <div class="box">
    <h2>4–7. Proyecciones, incertidumbre y capacidad económica</h2>
    <p><strong>Escenarios mensuales:</strong> Conservador P10 S/ ${predictivo.utilidadConservadoraPromedio.toLocaleString("es-PE")} · Base S/ ${predictivo.utilidadNetaPromedio.toLocaleString("es-PE")} · Favorable P90 S/ ${predictivo.utilidadFavorablePromedio.toLocaleString("es-PE")}</p>
    <p><strong>Mayor capacidad:</strong> ${escapeHtml(predictivo.mesesMayorCapacidad.join(", "))} · <strong>Menor capacidad:</strong> ${escapeHtml(predictivo.mesesMenorCapacidad.join(", "))}</p>
  </div>
  <div class="box">
    <h2>8–11. Comparación financiera, validador matemático y trazabilidad</h2>
    <p><strong>Opción recomendada:</strong> ${escapeHtml(comparacion.mejorOpcion)} — ${escapeHtml(comparacion.motivoSeleccion)}</p>
    <p><strong>Validador independiente:</strong> ${comparacion.adaptado.validacionIndependiente.valido ? "APROBADO" : "OBSERVADO"} (Saldo final: S/ ${comparacion.adaptado.validacionIndependiente.saldoFinalVerificado.toFixed(2)})</p>
    <p>${escapeHtml(explicacion.comparacionPlanes)}</p>
  </div>
  <div class="box">
    <h2>12–16. Estrés externo, limitaciones y recomendación explicada</h2>
    <p>${escapeHtml(explicacion.resumenRiesgos)}</p>
    <p>${escapeHtml(explicacion.conclusionComite)}</p>
    <p><strong>Para el microempresario:</strong> ${escapeHtml(explicacion.explicacionSencilla)}</p>
    <p><em>${escapeHtml(predictivo.trazabilidad.avisoNoGarantia)}</em></p>
  </div>
  <h2>Anexo. Cronograma comparado completo</h2>
  <table>
    <thead>
      <tr><th>Periodo</th><th>Utilidad Neta</th><th>Cuota Fija</th><th>Cuota Adaptada</th><th>Capital Adapt.</th><th>Ratio Adapt.</th><th>Estado</th></tr>
    </thead>
    <tbody>
      ${comparacion.adaptado.cuotas
        .map((c, idx) => {
          const cf = comparacion.tradicional.cuotas[idx];
          return `<tr><td>${escapeHtml(c.etiquetaPeriodo)}</td><td>S/ ${c.utilidadNetaPeriodo.toFixed(2)}</td><td>S/ ${(cf?.cuotaTotal ?? 0).toFixed(2)}</td><td>S/ ${c.cuotaTotal.toFixed(2)}</td><td>S/ ${c.amortizacionCapital.toFixed(2)}</td><td>${c.ratioCuotaUtilidad !== null ? `${(c.ratioCuotaUtilidad * 100).toFixed(1)}%` : "N/A"}</td><td>${escapeHtml(c.estado)}</td></tr>`;
        })
        .join("")}
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Informe-Comite-${input.idCaso}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const chartData = predictivo.proyecciones.map((p, idx) => ({
    periodo: p.etiquetaPeriodo,
    ventas: p.ventasEsperadas,
    utilidad: p.utilidadNetaDisponible,
    cuotaAdaptada: comparacion.adaptado.cuotas[idx]?.cuotaTotal ?? 0,
  }));

  const { trazabilidad } = predictivo;
  const valInd = comparacion.adaptado.validacionIndependiente;

  return (
    <div className="space-y-8">
      {/* Barra de acciones no imprimible */}
      <div className="no-print pb-5 border-b border-[var(--border-hairline)] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--accent-teal)]">
            Etapa 09 · Expediente completo de Comité (16 secciones)
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
            9. Informe técnico para el Comité de Créditos
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Documento ejecutivo estructurado. El sistema aporta evidencia cuantitativa; la decisión
            definitiva corresponde al Comité.
          </p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSaveCase}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] rounded-lg transition-colors whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar caso localmente
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar informe HTML
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--text-on-ink)] bg-[var(--bg-ink)] hover:bg-[var(--bg-ink-subtle)] dark:bg-[var(--accent-teal)] dark:text-[#041418] dark:hover:bg-[var(--accent-teal-hover)] rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {savedNotification && (
        <div className="no-print bg-[var(--accent-teal-soft)] border border-[var(--accent-teal)]/40 rounded-lg px-4 py-2.5 text-xs font-medium text-[var(--text-primary)]">
          {savedNotification}
        </div>
      )}

      {/* Flujo de revisión del prototipo */}
      <div className="no-print bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Estado del flujo de revisión (simulación de flujo en prototipo)
          </p>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Sin conexión al core real de Caja Trujillo
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {ESTADOS_FLUJO.map((estado, idx) => {
            const active = estadoComite === estado;
            return (
              <button
                key={estado}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeEstadoComite(estado)}
                className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors duration-150 ${
                  active
                    ? "border-[var(--bg-ink)] bg-[var(--bg-ink)] text-[var(--text-on-ink)] dark:border-[var(--accent-teal)] dark:bg-[var(--accent-teal)] dark:text-[#041418] font-semibold"
                    : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span className="font-mono mr-1.5">{idx + 1}.</span>
                {estado}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documento institucional de 16 secciones */}
      <article className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 lg:p-8 space-y-8 print:bg-white print:text-[#0A1628] print:border-0 print:p-0">
        {/* Encabezado formal del expediente */}
        <div className="border-b border-[var(--border-hairline)] pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <BrandLogo size="lg" className="mt-0.5" />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--accent-teal)]">
                NEGOVA.IA · Expediente Técnico de Comité (16 Secciones)
              </p>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mt-1">
                {input.negocio.nombreComercial}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Caso <span className="font-mono text-[var(--text-primary)]">{input.idCaso}</span> ·{" "}
                {input.esSintetico ? "Perfil sintético reproducible" : "Caso ingresado en sesión"}{" "}
                · Estado: {estadoComite}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs font-mono tabular-nums text-[var(--text-secondary)] space-y-0.5 shrink-0">
            <p>
              Monto:{" "}
              <strong className="text-[var(--text-primary)]">
                S/ {input.credito.montoSolicitado.toLocaleString("es-PE")}
              </strong>
            </p>
            <p>
              Plazo: {input.credito.plazoMeses} m · TEA {(input.credito.tea * 100).toFixed(2)}%
            </p>
            <p>
              Factor máx.: {input.credito.productoConfig.factorMaximoCapacidadPago.toFixed(2)} ·
              Opción: <strong className="text-[var(--accent-teal)]">{comparacion.mejorOpcion}</strong>
            </p>
          </div>
        </div>

        {/* Secciones 1–4: Perfil, Datos históricos, Estacionalidad y Proyecciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2.5">
            <h4 className="font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">
              1–2. Perfil económico y datos históricos
            </h4>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Sector y actividad:</strong>{" "}
              {input.negocio.sector} — {input.negocio.actividadEspecifica}
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Ubicación y operación:</strong>{" "}
              {input.negocio.distritoZona}, {input.negocio.provincia}, {input.negocio.departamento}{" "}
              ({input.negocio.tipoOperacion} · {input.negocio.formalidad})
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Procedencia y cobertura:</strong>{" "}
              {trazabilidad.procedenciaDatos} ({predictivo.mesesDisponiblesCount}/12 meses reales).
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Método predictivo:</strong>{" "}
              {trazabilidad.metodoSeleccionado}
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">
              3–6. Estacionalidad, escenarios, incertidumbre y capacidad
            </h4>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Pico / Valle:</strong> Mayor
              capacidad en {predictivo.mesesMayorCapacidad.join(", ")}; menor holgura en{" "}
              {predictivo.mesesMenorCapacidad.join(", ")}.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Tendencia e incertidumbre:</strong>{" "}
              {predictivo.tendencia} ({predictivo.pendienteMensualPct > 0 ? "+" : ""}
              {predictivo.pendienteMensualPct}%/mes · Volatilidad {predictivo.volatilidadPct}% ·
              σ_res {trazabilidad.sigmaResidualPct}% · Respaldo {predictivo.nivelConfianza}/100).
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed font-mono tabular-nums">
              <strong className="font-sans text-[var(--text-primary)]">
                3 Escenarios (Utilidad/mes):
              </strong>{" "}
              P10 S/ {predictivo.utilidadConservadoraPromedio.toLocaleString("es-PE")} | Base S/{" "}
              {predictivo.utilidadNetaPromedio.toLocaleString("es-PE")} | P90 S/{" "}
              {predictivo.utilidadFavorablePromedio.toLocaleString("es-PE")}
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Capacidad neta:</strong> Descuenta
              costos, obligaciones financieras y carga familiar; techo máximo{" "}
              {(input.credito.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}%.
            </p>
          </div>
        </div>

        {/* Gráfico resumido para el Comité */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              4. Ingresos proyectados, utilidad neta y cuota adaptada propuesta
            </h4>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-xs inline-block"
                  style={{ backgroundColor: "var(--chart-bar-base)" }}
                />
                Ventas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-xs inline-block"
                  style={{ backgroundColor: "var(--chart-bar-secondary)" }}
                />
                Utilidad neta
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--accent-teal)]">
                <span
                  className="w-3 h-0.5 inline-block"
                  style={{ backgroundColor: "var(--accent-teal)" }}
                />
                Cuota adaptada
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 10, fill: "var(--chart-tick)" }}
                  axisLine={{ stroke: "var(--border-hairline)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--chart-tick)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `S/${Math.round(Number(v) / 1000)}k`}
                  width={48}
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
                  formatter={(value) => `S/ ${Number(value).toLocaleString("es-PE")}`}
                />
                <Bar
                  dataKey="ventas"
                  name="Ventas proyectadas"
                  fill="var(--chart-bar-base)"
                  radius={[2, 2, 0, 0]}
                  barSize={15}
                />
                <Bar
                  dataKey="utilidad"
                  name="Utilidad neta"
                  fill="var(--chart-bar-secondary)"
                  radius={[2, 2, 0, 0]}
                  barSize={15}
                />
                <Line
                  type="monotone"
                  dataKey="cuotaAdaptada"
                  name="Cuota adaptada"
                  stroke="var(--accent-teal)"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: "var(--accent-teal)", strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secciones 7–11: Comparación, Reglas, Validador, Trazabilidad y Explicabilidad */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-teal)]" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                15–16. Explicabilidad y Recomendación Técnica para el Comité
              </h4>
            </div>
            <div className="flex items-center gap-3 no-print">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {loadingAI
                  ? "Generando interpretación..."
                  : explicacion.fuente === "gemini"
                  ? `Interpretado con Gemini (${explicacion.modelo})`
                  : "Explicación analítica local (autónoma)"}
              </span>
              <button
                type="button"
                onClick={loadExplanation}
                disabled={loadingAI}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-teal)] hover:text-[var(--accent-teal-hover)] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAI ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-[var(--text-secondary)] leading-relaxed">
            <div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                Por qué existen meses altos y bajos
              </p>
              <p>{explicacion.explicacionEstacionalidad}</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                Justificación de las cuotas propuestas
              </p>
              <p>{explicacion.justificacionCuotas}</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                Comparación financiera (Plan A vs. Plan B)
              </p>
              <p>{explicacion.comparacionPlanes}</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                12. Riesgos y escenarios adversos
              </p>
              <p>{explicacion.resumenRiesgos}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-hairline)] grid grid-cols-1 md:grid-cols-2 gap-5 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                16. Conclusión para el Asesor de Riesgos y Comité
              </p>
              <p className="text-[var(--text-secondary)]">{explicacion.conclusionComite}</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--accent-teal)] mb-1">
                Explicación sencilla para el microempresario
              </p>
              <p className="text-[var(--text-secondary)]">{explicacion.explicacionSencilla}</p>
            </div>
          </div>

          {explicacion.trazabilidadCalculos && (
            <p className="text-[11px] font-mono text-[var(--text-muted)] pt-3 border-t border-[var(--border-hairline)]">
              10. Trazabilidad de cálculo: {explicacion.trazabilidadCalculos}
            </p>
          )}
        </div>

        {/* Secciones 7, 8, 9, 11: Cronogramas, Validación matemática y Tabla completa */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              7–9. Comparación financiera, validación matemática independiente y cronograma
            </h4>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono">
              <ShieldCheck
                className={`w-4 h-4 ${
                  valInd.valido ? "text-[var(--accent-positive)]" : "text-[var(--accent-risk)]"
                }`}
              />
              <span>
                Validador independiente: {valInd.valido ? "APROBADO" : "OBSERVADO"} (Saldo S/{" "}
                {valInd.saldoFinalVerificado.toFixed(2)})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-hairline)] text-xs">
            <div className="bg-[var(--bg-surface)] p-4">
              <p className="text-[var(--text-muted)]">Plan Tradicional (Cuota fija)</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1.5">
                Costo total: S/{" "}
                {comparacion.tradicional.costoTotalCredito.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-[var(--text-secondary)] mt-1 font-mono tabular-nums">
                TCEA:{" "}
                {comparacion.tradicional.tcea !== null
                  ? `${(comparacion.tradicional.tcea * 100).toFixed(2)}%`
                  : "N/D"}{" "}
                · Incumpl.: {comparacion.tradicional.periodosIncumplen}
              </p>
            </div>

            <div className="bg-[var(--accent-teal-soft)] p-4">
              <p className="text-[var(--accent-teal)] font-semibold">
                Plan Adaptado · Opción: {comparacion.mejorOpcion}
              </p>
              <p className="text-sm font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1.5">
                Costo total: S/{" "}
                {comparacion.adaptado.costoTotalCredito.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-[var(--text-secondary)] mt-1 font-mono tabular-nums">
                TCEA:{" "}
                {comparacion.adaptado.tcea !== null
                  ? `${(comparacion.adaptado.tcea * 100).toFixed(2)}%`
                  : "N/D"}{" "}
                · Viable: {comparacion.adaptado.viable ? "Sí" : "No"} (
                {comparacion.adaptado.periodosIncumplen} incumpl.)
              </p>
            </div>

            <div className="bg-[var(--bg-surface)] p-4">
              <p className="text-[var(--text-muted)]">11. Escenario adverso simulado</p>
              {simulacion ? (
                <>
                  <p className="text-sm font-semibold text-[var(--accent-warning)] mt-1.5">
                    {simulacion.parametros.fenomeno} ({simulacion.parametros.intensidad})
                  </p>
                  <p className="text-[var(--text-secondary)] mt-1 font-mono tabular-nums">
                    Ventas {simulacion.impactoVentasPct}% · Sobrev.:{" "}
                    {simulacion.sobrevenido.incumplimientosFijoOriginal} fijo /{" "}
                    {simulacion.sobrevenido.incumplimientosAdaptadoOriginal} adapt.
                  </p>
                </>
              ) : (
                <p className="text-[var(--text-muted)] mt-1.5">
                  Sin simulación externa ejecutada en este expediente.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-[var(--border-hairline)] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 px-3 font-mono font-medium">Periodo</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Utilidad neta</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Cuota fija</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Cuota adaptada</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Capital adapt.</th>
                  <th className="py-2.5 px-3 font-mono font-medium text-right">Ratio adapt.</th>
                  <th className="py-2.5 px-3 font-mono font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)] text-[var(--text-secondary)]">
                {comparacion.adaptado.cuotas.map((c, idx) => {
                  const cf = comparacion.tradicional.cuotas[idx];
                  return (
                    <tr
                      key={c.numeroCuota}
                      className="hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <td className="py-2 px-3 font-mono text-[var(--text-primary)] whitespace-nowrap">
                        {c.etiquetaPeriodo}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right">
                        S/ {c.utilidadNetaPeriodo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right">
                        S/{" "}
                        {(cf?.cuotaTotal ?? 0).toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-[var(--accent-teal)]">
                        S/ {c.cuotaTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right">
                        S/{" "}
                        {c.amortizacionCapital.toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right">
                        {c.ratioCuotaUtilidad !== null
                          ? `${(c.ratioCuotaUtilidad * 100).toFixed(1)}%`
                          : "N/A"}
                      </td>
                      <td className="py-2 px-3">
                        <StatusBadge estado={c.estado} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Secciones 13–14: Supuestos financieros y Limitaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[var(--text-secondary)] border-t border-[var(--border-hairline)] pt-6">
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">
              13. Supuestos financieros aplicados (Base 360)
            </h4>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>TEA constante durante toda la vida del crédito; conversión base 360.</li>
              <li>Seguros calculados bajo interés simple base 360.</li>
              <li>Prelación estricta de pagos: 1. Seguros, 2. Intereses, 3. Capital.</li>
              <li>
                Restricción verificada periodo a periodo: Cuota / Utilidad ≤{" "}
                <span className="font-mono tabular-nums">
                  {(input.credito.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}%
                </span>
                .
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">
              14. Limitaciones, procedencia de datos y advertencias
            </h4>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>
                Meses históricos registrados:{" "}
                <span className="font-mono tabular-nums">
                  {predictivo.mesesDisponiblesCount} de 12
                </span>{" "}
                (
                {predictivo.usoReferenciaSintetica
                  ? "con ponderación de patrón sintético sectorial"
                  : "serie anual completa"}
                ).
              </li>
              <li>{trazabilidad.avisoNoGarantia}</li>
              <li>
                Las pruebas de estrés externo representan escenarios hipotéticos, no pronósticos
                climáticos ni predicciones reales.
              </li>
              <li>
                Este documento proviene de un prototipo Cajathon 2026 y no representa una
                aprobación crediticia automática ni conexión con sistemas de Caja Trujillo.
              </li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  );
}
