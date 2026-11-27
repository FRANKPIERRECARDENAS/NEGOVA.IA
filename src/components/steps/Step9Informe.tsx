import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  RefreshCw,
  Save,
  ShieldCheck,
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
import { CollapsiblePanel } from "./CollapsiblePanel";
import { StepVisual } from "./StepVisual";

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
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const printChartRef = useRef<HTMLDivElement | null>(null);

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

  const buildReportHtml = (autoPrint: boolean) => {
    const chartSvgMarkup = printChartRef.current?.querySelector("svg")?.outerHTML ?? "";
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Informe Comité NEGOVA.IA - ${escapeHtml(input.idCaso)}</title>
<style>
  @page { size: auto; margin: 12mm; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #0A1628; margin: 28px auto; max-width: 900px; line-height: 1.5; background: #ffffff; }
  h1 { font-size: 20px; margin: 0 0 6px; color: #0A1628; }
  h2 { font-size: 14px; margin: 0 0 8px; color: #0A1628; }
  .meta { font-size: 12px; color: #414F63; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #CBD5E1; }
  .box { background: #ffffff; border: 1px solid #CBD5E1; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; break-inside: avoid; }
  .chart-box svg { width: 100%; height: auto; display: block; --chart-grid: #e2e8f0; --chart-tick: #475569; --chart-bar-base: #94a3b8; --chart-bar-secondary: #2b4c7e; --accent-teal: #0c7c7b; --border-hairline: #cbd5e1; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; background: #ffffff; }
  th, td { border-bottom: 1px solid #E2E8F0; padding: 5px 7px; text-align: right; }
  th { background: #F8FAFC; color: #475569; font-weight: 600; }
  th:first-child, td:first-child { text-align: left; }
  tr { break-inside: avoid; }
  .print-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; margin-bottom: 18px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 12px; }
  .print-btn { background: #0A1628; color: #ffffff; border: 0; border-radius: 6px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }
  @media print {
    body { margin: 0; max-width: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  ${
    autoPrint
      ? `<div class="print-toolbar no-print">
    <span>Expediente listo para imprimir o guardar como PDF (${escapeHtml(input.idCaso)})</span>
    <button type="button" class="print-btn" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>`
      : ""
  }
  <h1>Expediente Técnico de Comité · NEGOVA.IA</h1>
  <div class="meta">
    Caso: <strong>${escapeHtml(input.idCaso)}</strong> · Estado: <strong>${escapeHtml(estadoComite)}</strong> · Monto: <strong>S/ ${input.credito.montoSolicitado.toLocaleString("es-PE")}</strong> · ${input.credito.plazoMeses} m · TEA ${(input.credito.tea * 100).toFixed(1)}%
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
    <p><strong>Plan Tradicional:</strong> Costo S/ ${comparacion.tradicional.costoTotalCredito.toLocaleString("es-PE", { minimumFractionDigits: 2 })} · TCEA ${comparacion.tradicional.tcea !== null ? `${(comparacion.tradicional.tcea * 100).toFixed(2)}%` : "N/D"} · ${comparacion.tradicional.periodosIncumplen} incumpl.</p>
    <p><strong>Plan Adaptado:</strong> Costo S/ ${comparacion.adaptado.costoTotalCredito.toLocaleString("es-PE", { minimumFractionDigits: 2 })} · TCEA ${comparacion.adaptado.tcea !== null ? `${(comparacion.adaptado.tcea * 100).toFixed(2)}%` : "N/D"} · ${comparacion.adaptado.viable ? "Viable" : "No viable"} (${comparacion.adaptado.periodosIncumplen} incumpl.)</p>
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
  ${
    chartSvgMarkup
      ? `<div class="box chart-box"><h2>Ingresos, utilidad y cuota adaptada</h2>${chartSvgMarkup}</div>`
      : ""
  }
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
  ${autoPrint ? `<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 250); });</script>` : ""}
</body>
</html>`;
  };

  const triggerHtmlDownload = (filename: string, html: string) => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    setPrintNotice(null);
    triggerHtmlDownload(`Informe-Comite-${input.idCaso}.html`, buildReportHtml(false));
  };

  const handlePrintReport = () => {
    setPrintNotice(null);
    let beforePrintFired = false;
    const onBeforePrint = () => {
      beforePrintFired = true;
    };
    window.addEventListener("beforeprint", onBeforePrint);
    try {
      window.print();
    } catch {
      beforePrintFired = false;
    } finally {
      window.removeEventListener("beforeprint", onBeforePrint);
    }

    const insideIframe =
      typeof window !== "undefined" && (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

    if (insideIframe && !beforePrintFired) {
      triggerHtmlDownload(`Imprimir-Informe-${input.idCaso}.html`, buildReportHtml(true));
      setPrintNotice(
        "El visor integrado bloquea la ventana de impresión. Se descargó el archivo listo para imprimir o guardar en PDF desde tu navegador."
      );
    }
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
    <div className="space-y-7">
      {/* Cabecera y acciones */}
      <div className="no-print pb-5 border-b border-[var(--border-hairline)] space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-[var(--accent-teal)]">09 · Expediente Comité</p>
            <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
              Informe para el Comité
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Evidencia cuantitativa lista para revisión o exportación.
            </p>
          </div>
          <StepVisual step={9} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveCase}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] rounded-lg transition-colors whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            HTML
          </button>
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--text-on-ink)] bg-[var(--bg-ink)] hover:bg-[var(--bg-ink-subtle)] dark:bg-[var(--accent-teal)] dark:text-[#041418] dark:hover:bg-[var(--accent-teal-hover)] rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {(savedNotification || printNotice) && (
        <div
          role="status"
          className="no-print bg-[var(--accent-teal-soft)] border border-[var(--accent-teal)]/40 rounded-lg px-4 py-2.5 text-xs font-medium text-[var(--text-primary)]"
        >
          {printNotice ?? savedNotification}
        </div>
      )}

      {/* Estado de revisión */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-2">
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
                  : "border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              }`}
            >
              <span className="font-mono mr-1.5">{idx + 1}.</span>
              {estado}
            </button>
          );
        })}
      </div>

      {/* Documento ejecutivo */}
      <article className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 lg:p-8 space-y-7 print:bg-white print:text-[#0A1628] print:border-0 print:p-0">
        {/* Encabezado del caso */}
        <div className="border-b border-[var(--border-hairline)] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="lg" />
            <div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                {input.negocio.nombreComercial}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                <span className="font-mono text-[var(--text-primary)]">{input.idCaso}</span> ·{" "}
                {input.negocio.actividadEspecifica} · {input.negocio.departamento}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs font-mono tabular-nums text-[var(--text-secondary)] space-y-0.5 shrink-0">
            <p>
              Monto:{" "}
              <strong className="text-[var(--text-primary)]">
                S/ {input.credito.montoSolicitado.toLocaleString("es-PE")}
              </strong>{" "}
              · {input.credito.plazoMeses} m · TEA {(input.credito.tea * 100).toFixed(1)}%
            </p>
            <p>
              Opción recomendada:{" "}
              <strong className="text-[var(--accent-teal)]">{comparacion.mejorOpcion}</strong>
            </p>
          </div>
        </div>

        {/* Estado visible solo al imprimir */}
        <div className="hidden print:flex items-center justify-between text-[11px] font-mono text-[#475569] border-b border-[#CBD5E1] pb-2">
          <span>Expediente Técnico NEGOVA.IA · {estadoComite}</span>
          <span>Emitido: {new Date().toLocaleDateString("es-PE")}</span>
        </div>

        {/* Resumen comparativo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-[var(--border-hairline)] rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-hairline)] text-xs print:break-inside-avoid">
          <div className="bg-[var(--bg-surface)] p-4">
            <p className="text-[var(--text-muted)]">Plan Tradicional</p>
            <p className="text-sm font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
              S/{" "}
              {comparacion.tradicional.costoTotalCredito.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-[var(--text-secondary)] mt-0.5 font-mono tabular-nums">
              TCEA{" "}
              {comparacion.tradicional.tcea !== null
                ? `${(comparacion.tradicional.tcea * 100).toFixed(2)}%`
                : "N/D"}{" "}
              · {comparacion.tradicional.periodosIncumplen} incumpl.
            </p>
          </div>

          <div className="bg-[var(--accent-teal-soft)] p-4">
            <p
              className={`font-semibold ${
                comparacion.adaptado.viable
                  ? "text-[var(--accent-teal)]"
                  : "text-[var(--accent-risk)]"
              }`}
            >
              Plan Adaptado ·{" "}
              {comparacion.adaptado.viable
                ? comparacion.mejorOpcion
                : "No viable"}
            </p>
            <p className="text-sm font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
              S/{" "}
              {comparacion.adaptado.costoTotalCredito.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-[var(--text-secondary)] mt-0.5 font-mono tabular-nums">
              TCEA{" "}
              {comparacion.adaptado.tcea !== null
                ? `${(comparacion.adaptado.tcea * 100).toFixed(2)}%`
                : "N/D"}{" "}
              · {comparacion.adaptado.viable ? "Viable" : "No viable"} (
              {comparacion.adaptado.periodosIncumplen} incumpl.)
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] p-4">
            <p className="text-[var(--text-muted)]">Estrés externo</p>
            {simulacion ? (
              <>
                <p className="text-sm font-semibold text-[var(--accent-warning)] mt-1">
                  {simulacion.parametros.fenomeno} ({simulacion.parametros.intensidad})
                </p>
                <p className="text-[var(--text-secondary)] mt-0.5 font-mono tabular-nums">
                  Ventas {simulacion.impactoVentasPct}% · Sobrev.{" "}
                  {simulacion.sobrevenido.incumplimientosFijoOriginal} fijo /{" "}
                  {simulacion.sobrevenido.incumplimientosAdaptadoOriginal} adapt.
                </p>
              </>
            ) : (
              <p className="text-[var(--text-muted)] mt-1">Sin simulación aplicada</p>
            )}
          </div>
        </div>

        {/* Gráfico ejecutivo */}
        <div className="space-y-3 print:break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Ingresos, utilidad y cuota adaptada
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
                Utilidad
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--accent-teal)]">
                <span
                  className="w-3 h-0.5 inline-block"
                  style={{ backgroundColor: "var(--accent-teal)" }}
                />
                Cuota
              </span>
            </div>
          </div>

          <div className="h-52 w-full print:hidden">
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
                  name="Ventas"
                  fill="var(--chart-bar-base)"
                  radius={[2, 2, 0, 0]}
                  barSize={15}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="utilidad"
                  name="Utilidad neta"
                  fill="var(--chart-bar-secondary)"
                  radius={[2, 2, 0, 0]}
                  barSize={15}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="cuotaAdaptada"
                  name="Cuota adaptada"
                  stroke="var(--accent-teal)"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: "var(--accent-teal)", strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div ref={printChartRef} className="hidden print:block w-full">
            <ComposedChart
              width={760}
              height={208}
              data={chartData}
              margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
            >
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
              <Bar
                dataKey="ventas"
                name="Ventas"
                fill="var(--chart-bar-base)"
                radius={[2, 2, 0, 0]}
                barSize={15}
                isAnimationActive={false}
              />
              <Bar
                dataKey="utilidad"
                name="Utilidad neta"
                fill="var(--chart-bar-secondary)"
                radius={[2, 2, 0, 0]}
                barSize={15}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="cuotaAdaptada"
                name="Cuota adaptada"
                stroke="var(--accent-teal)"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "var(--accent-teal)", strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </div>
        </div>

        {/* Conclusión ejecutiva */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-xl p-5 space-y-4 print:break-inside-avoid print:bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
              <ShieldCheck
                className={`w-4 h-4 ${
                  valInd.valido ? "text-[var(--accent-positive)]" : "text-[var(--accent-risk)]"
                }`}
              />
              <span>
                Conclusión del Comité · Validador {valInd.valido ? "Aprobado" : "Observado"} (S/{" "}
                {valInd.saldoFinalVerificado.toFixed(2)})
              </span>
            </div>

            <div className="flex items-center gap-3 no-print">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {loadingAI
                  ? "Actualizando..."
                  : explicacion.fuente === "gemini"
                  ? `Gemini`
                  : "Análisis local"}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                Dictamen para el Comité
              </p>
              <p className="text-[var(--text-secondary)]">{explicacion.conclusionComite}</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--accent-teal)] mb-1">
                Explicación para el cliente
              </p>
              <p className="text-[var(--text-secondary)]">{explicacion.explicacionSencilla}</p>
            </div>
          </div>
        </div>

        {/* Secciones técnicas desplegables (visibles automáticamente al imprimir) */}
        <div className="space-y-3">
          <CollapsiblePanel
            title="Análisis detallado (estacionalidad, cuotas y riesgos)"
            summary="4 bloques explicativos"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-[var(--text-secondary)] leading-relaxed">
              <div>
                <p className="font-semibold text-[var(--text-primary)] mb-1">Estacionalidad</p>
                <p>{explicacion.explicacionEstacionalidad}</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] mb-1">
                  Justificación de cuotas
                </p>
                <p>{explicacion.justificacionCuotas}</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] mb-1">
                  Comparación Plan A vs. Plan B
                </p>
                <p>{explicacion.comparacionPlanes}</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] mb-1">
                  Riesgos y escenarios adversos
                </p>
                <p>{explicacion.resumenRiesgos}</p>
              </div>
            </div>
            {explicacion.trazabilidadCalculos && (
              <p className="text-[11px] font-mono text-[var(--text-muted)] pt-3 mt-3 border-t border-[var(--border-hairline)]">
                Trazabilidad: {explicacion.trazabilidadCalculos}
              </p>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Cronograma comparado completo"
            summary={`${comparacion.adaptado.cuotas.length} periodos`}
          >
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse text-xs print:text-[10.5px]">
                <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                  <tr>
                    <th className="py-2 px-3 font-mono font-medium">Periodo</th>
                    <th className="py-2 px-3 font-mono font-medium text-right">Utilidad</th>
                    <th className="py-2 px-3 font-mono font-medium text-right">Cuota fija</th>
                    <th className="py-2 px-3 font-mono font-medium text-right">Cuota adapt.</th>
                    <th className="py-2 px-3 font-mono font-medium text-right">Capital</th>
                    <th className="py-2 px-3 font-mono font-medium text-right">Ratio</th>
                    <th className="py-2 px-3 font-mono font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)] text-[var(--text-secondary)]">
                  {comparacion.adaptado.cuotas.map((c, idx) => {
                    const cf = comparacion.tradicional.cuotas[idx];
                    return (
                      <tr key={c.numeroCuota}>
                        <td className="py-2 px-3 font-mono text-[var(--text-primary)] whitespace-nowrap">
                          {c.etiquetaPeriodo}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-right">
                          S/{" "}
                          {c.utilidadNetaPeriodo.toLocaleString("es-PE", {
                            minimumFractionDigits: 2,
                          })}
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
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Ficha técnica, supuestos Base 360 y limitaciones"
            summary={`${predictivo.mesesDisponiblesCount}/12 meses · ${trazabilidad.metodoSeleccionado.split("+")[0].trim()}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-[var(--text-secondary)] leading-relaxed">
              <div className="space-y-2">
                <p className="font-semibold text-[var(--text-primary)]">Perfil y supuestos</p>
                <p>
                  {input.negocio.sector} · {input.negocio.tipoOperacion} · {input.negocio.formalidad}
                </p>
                <p>
                  Escenarios (Utilidad/mes): P10 S/{" "}
                  {predictivo.utilidadConservadoraPromedio.toLocaleString("es-PE")} | Base S/{" "}
                  {predictivo.utilidadNetaPromedio.toLocaleString("es-PE")} | P90 S/{" "}
                  {predictivo.utilidadFavorablePromedio.toLocaleString("es-PE")}
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>TEA constante base 360; seguros bajo interés simple base 360.</li>
                  <li>Prelación: 1. Seguros, 2. Intereses, 3. Capital.</li>
                  <li>
                    Límite Cuota/Utilidad ≤{" "}
                    {(input.credito.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}%.
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-[var(--text-primary)]">Limitaciones y alcance</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Historial: {predictivo.mesesDisponiblesCount}/12 meses (
                    {predictivo.usoReferenciaSintetica
                      ? "con referencia sectorial"
                      : "serie completa"}
                    ) · Respaldo {predictivo.nivelConfianza}/100.
                  </li>
                  <li>{trazabilidad.avisoNoGarantia}</li>
                  <li>
                    Prototipo Cajathon 2026: no representa aprobación automática ni conexión con
                    Caja Trujillo.
                  </li>
                </ul>
              </div>
            </div>
          </CollapsiblePanel>
        </div>
      </article>
    </div>
  );
}
