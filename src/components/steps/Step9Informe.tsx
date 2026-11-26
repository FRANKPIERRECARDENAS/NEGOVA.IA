import { useEffect, useState } from "react";
import { Download, Printer, RefreshCw, Save, Sparkles } from "lucide-react";
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
  ExplicacionComite,
  ResultadoPredictivo,
  ResultadoSimulacionExterna,
} from "../../types/negova";

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
  }, [input.idCaso, comparacion.adaptado.costoTotalCredito, simulacion?.parametros.fenomeno, simulacion?.parametros.intensidad]);

  const handleDownloadHtml = () => {
    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Informe Comité NEGOVA.IA - ${escapeHtml(input.idCaso)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 32px; line-height: 1.5; }
  h1, h2 { color: #0B1F3A; }
  .meta { font-size: 13px; color: #475569; margin-bottom: 20px; }
  .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
</style>
</head>
<body>
  <h1>Informe Técnico para el Comité de Créditos · NEGOVA.IA</h1>
  <div class="meta">
    Caso: <strong>${escapeHtml(input.idCaso)}</strong> · Estado: <strong>${escapeHtml(estadoComite)}</strong> · Prototipo Cajathon 2026 (Desafío NEG-01)
  </div>
  <div class="box">
    <h2>1. Características del negocio</h2>
    <p><strong>Negocio:</strong> ${escapeHtml(input.negocio.nombreComercial)} (${escapeHtml(input.negocio.actividadEspecifica)})</p>
    <p><strong>Ubicación:</strong> ${escapeHtml(input.negocio.distritoZona)}, ${escapeHtml(input.negocio.provincia)}, ${escapeHtml(input.negocio.departamento)}</p>
    <p><strong>Formalidad:</strong> ${escapeHtml(input.negocio.formalidad)} · <strong>Operación:</strong> ${escapeHtml(input.negocio.tipoOperacion)}</p>
  </div>
  <div class="box">
    <h2>2. Ciclo económico estimado y capacidad</h2>
    <p>${escapeHtml(explicacion.explicacionEstacionalidad)}</p>
    <p><strong>Mayor capacidad:</strong> ${escapeHtml(predictivo.mesesMayorCapacidad.join(", "))} · <strong>Menor capacidad:</strong> ${escapeHtml(predictivo.mesesMenorCapacidad.join(", "))} · <strong>Confianza:</strong> ${predictivo.nivelConfianza}%</p>
  </div>
  <div class="box">
    <h2>3. Comparación financiera (Base 360)</h2>
    <p><strong>Monto:</strong> S/ ${input.credito.montoSolicitado.toLocaleString("es-PE")} · <strong>Plazo:</strong> ${input.credito.plazoMeses} meses · <strong>TEA:</strong> ${(input.credito.tea * 100).toFixed(2)}% · <strong>Factor máximo:</strong> ${input.credito.productoConfig.factorMaximoCapacidadPago.toFixed(2)}</p>
    <p><strong>Plan Tradicional:</strong> Costo total S/ ${comparacion.tradicional.costoTotalCredito.toLocaleString("es-PE")} · Incumplimientos: ${comparacion.tradicional.periodosIncumplen}</p>
    <p><strong>Plan Adaptado:</strong> Viable: ${comparacion.adaptado.viable ? "Sí" : "No"} · Costo total S/ ${comparacion.adaptado.costoTotalCredito.toLocaleString("es-PE")} · Incumplimientos: ${comparacion.adaptado.periodosIncumplen}</p>
    <p>${escapeHtml(explicacion.comparacionPlanes)}</p>
  </div>
  <div class="box">
    <h2>4. Riesgos, supuestos y conclusión para el Comité</h2>
    <p>${escapeHtml(explicacion.resumenRiesgos)}</p>
    <p>${escapeHtml(explicacion.conclusionComite)}</p>
    <p><em>Nota: El sistema recomienda y aporta evidencia matemática; la decisión definitiva pertenece al Comité.</em></p>
  </div>
  <h2>5. Cronograma comparado</h2>
  <table>
    <thead>
      <tr><th>Periodo</th><th>Utilidad Neta</th><th>Cuota Fija</th><th>Cuota Adaptada</th><th>Ratio Adapt.</th><th>Estado Adapt.</th></tr>
    </thead>
    <tbody>
      ${comparacion.adaptado.cuotas
        .map((c, idx) => {
          const cf = comparacion.tradicional.cuotas[idx];
          return `<tr><td>${escapeHtml(c.etiquetaPeriodo)}</td><td>S/ ${c.utilidadNetaPeriodo.toFixed(2)}</td><td>S/ ${(cf?.cuotaTotal ?? 0).toFixed(2)}</td><td>S/ ${c.cuotaTotal.toFixed(2)}</td><td>${c.ratioCuotaUtilidad !== null ? `${(c.ratioCuotaUtilidad * 100).toFixed(1)}%` : "N/A"}</td><td>${escapeHtml(c.estado)}</td></tr>`;
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

  return (
    <div className="space-y-6">
      {/* Barra de acciones no imprimible */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">9. Informe técnico para el Comité</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Documento ejecutivo estructurado. El sistema recomienda y aporta evidencia; la
            decisión definitiva corresponde al Comité.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveCase}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar caso localmente
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar informe
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] dark:bg-teal-600 rounded-lg hover:bg-[#143058] dark:hover:bg-teal-500 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {savedNotification && (
        <div className="no-print bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-2.5 text-xs font-medium text-teal-900 dark:text-teal-200">
          {savedNotification}
        </div>
      )}

      {/* Flujo de revisión del prototipo */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#0B1F3A] dark:text-white">
            Estado del flujo de revisión (simulación de flujo en prototipo)
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
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
                onClick={() => onChangeEstadoComite(estado)}
                className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                  active
                    ? "border-[#0B1F3A] dark:border-teal-500 bg-[#0B1F3A] dark:bg-teal-600 text-white font-semibold"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="font-mono mr-1.5">{idx + 1}.</span>
                {estado}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documento del informe */}
      <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 lg:p-8 space-y-8 print:bg-white print:text-slate-900">
        {/* Encabezado del informe */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              NEGOVA.IA · Expediente técnico de crédito adaptativo
            </p>
            <h3 className="text-lg font-bold text-[#0B1F3A] dark:text-white mt-1">
              {input.negocio.nombreComercial}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Caso {input.idCaso} · {input.esSintetico ? "Perfil sintético de demostración" : "Caso ingresado en sesión"} · Estado: {estadoComite}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
            <p>Monto: S/ {input.credito.montoSolicitado.toLocaleString("es-PE")}</p>
            <p>
              Plazo: {input.credito.plazoMeses} m · TEA {(input.credito.tea * 100).toFixed(2)}%
            </p>
            <p>Factor máx.: {input.credito.productoConfig.factorMaximoCapacidadPago.toFixed(2)}</p>
          </div>
        </div>

        {/* Bloque 1: Características y ciclo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-white">Identificación y ubicación</h4>
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Sector y actividad:</strong> {input.negocio.sector} —{" "}
              {input.negocio.actividadEspecifica}
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Modelo:</strong> {input.negocio.modeloNegocio} ({input.negocio.tipoOperacion})
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Ubicación:</strong> {input.negocio.distritoZona}, {input.negocio.provincia},{" "}
              {input.negocio.departamento}
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Formalidad:</strong> {input.negocio.formalidad}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-white">Ciclo económico estimado</h4>
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Etapas de mayor capacidad:</strong>{" "}
              {predictivo.mesesMayorCapacidad.join(", ")}
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Etapas de menor capacidad:</strong>{" "}
              {predictivo.mesesMenorCapacidad.join(", ")}
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Tendencia y volatilidad:</strong> {predictivo.tendencia} (
              {predictivo.volatilidadPct}% volatilidad) · Confianza {predictivo.nivelConfianza}%
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Utilidad neta disponible promedio:</strong> S/{" "}
              {predictivo.utilidadNetaPromedio.toLocaleString("es-PE")}
            </p>
          </div>
        </div>

        {/* Gráfico resumido para el Comité */}
        <div>
          <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-white mb-3">
            Ingresos proyectados, utilidad neta y cuota adaptada propuesta
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickFormatter={(v) => `S/${Math.round(Number(v) / 1000)}k`}
                  width={48}
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
                  formatter={(value) => `S/ ${Number(value).toLocaleString("es-PE")}`}
                />
                <Bar dataKey="ventas" name="Ventas proyectadas" fill="#94A3B8" barSize={16} />
                <Bar dataKey="utilidad" name="Utilidad neta" fill="#3B6E9C" barSize={16} />
                <Line
                  type="monotone"
                  dataKey="cuotaAdaptada"
                  name="Cuota adaptada"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={{ r: 2.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capa explicativa Gemini / Analítica */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
                Interpretación ejecutiva y explicación de la propuesta
              </h4>
            </div>
            <div className="flex items-center gap-3 no-print">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAI ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div>
              <p className="font-semibold text-[#0B1F3A] dark:text-white mb-1">
                Por qué existen meses altos y bajos
              </p>
              <p>{explicacion.explicacionEstacionalidad}</p>
            </div>
            <div>
              <p className="font-semibold text-[#0B1F3A] dark:text-white mb-1">
                Justificación de las cuotas propuestas
              </p>
              <p>{explicacion.justificacionCuotas}</p>
            </div>
            <div>
              <p className="font-semibold text-[#0B1F3A] dark:text-white mb-1">Comparación financiera</p>
              <p>{explicacion.comparacionPlanes}</p>
            </div>
            <div>
              <p className="font-semibold text-[#0B1F3A] dark:text-white mb-1">Riesgos y escenarios adversos</p>
              <p>{explicacion.resumenRiesgos}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-[#0B1F3A] dark:text-white mb-1">
                Conclusión técnica para el Asesor de Riesgos y Comité
              </p>
              <p className="text-slate-800 dark:text-slate-200">{explicacion.conclusionComite}</p>
            </div>
            <div>
              <p className="font-semibold text-teal-800 dark:text-teal-300 mb-1">
                Explicación sencilla para el microempresario
              </p>
              <p className="text-slate-800 dark:text-slate-200">{explicacion.explicacionSencilla}</p>
            </div>
          </div>
        </div>

        {/* Resumen financiero comparado e impacto de estrés */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
            Comparación financiera y cronograma propuesto (Tradicional vs. Adaptado)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 rounded-xl p-3.5">
              <p className="text-slate-500 dark:text-slate-400">Plan Tradicional (Cuota fija)</p>
              <p className="text-sm font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white mt-1">
                Costo total: S/ {comparacion.tradicional.costoTotalCredito.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                TCEA: {comparacion.tradicional.tcea !== null ? `${(comparacion.tradicional.tcea * 100).toFixed(2)}%` : "N/D"} · Incumplimientos: {comparacion.tradicional.periodosIncumplen}
              </p>
            </div>
            <div className="border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/40 rounded-xl p-3.5">
              <p className="text-teal-800 dark:text-teal-300 font-medium">Plan Adaptado (Negova.IA)</p>
              <p className="text-sm font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white mt-1">
                Costo total: S/ {comparacion.adaptado.costoTotalCredito.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                TCEA: {comparacion.adaptado.tcea !== null ? `${(comparacion.adaptado.tcea * 100).toFixed(2)}%` : "N/D"} · Viable: {comparacion.adaptado.viable ? "Sí" : "No"} ({comparacion.adaptado.periodosIncumplen} incumplimientos)
              </p>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 rounded-xl p-3.5">
              <p className="text-slate-500 dark:text-slate-400">Escenario adverso simulado</p>
              {simulacion ? (
                <>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mt-1">
                    {simulacion.parametros.fenomeno} ({simulacion.parametros.intensidad})
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 font-mono tabular-nums">
                    Ventas {simulacion.impactoVentasPct}% · Incumplimientos: {simulacion.cuotasQueIncumplenFijo} fijo / {simulacion.cuotasQueIncumplenAdaptado} adapt.
                  </p>
                </>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Sin simulación externa ejecutada en este expediente.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2 px-3 font-medium">Periodo</th>
                  <th className="py-2 px-3 font-medium text-right">Utilidad neta</th>
                  <th className="py-2 px-3 font-medium text-right">Cuota fija</th>
                  <th className="py-2 px-3 font-medium text-right">Cuota adaptada</th>
                  <th className="py-2 px-3 font-medium text-right">Capital adapt.</th>
                  <th className="py-2 px-3 font-medium text-right">Ratio adapt.</th>
                  <th className="py-2 px-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {comparacion.adaptado.cuotas.map((c, idx) => {
                  const cf = comparacion.tradicional.cuotas[idx];
                  return (
                    <tr key={c.numeroCuota} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-1.5 px-3 font-mono text-slate-700 dark:text-slate-200">{c.etiquetaPeriodo}</td>
                      <td className="py-1.5 px-3 font-mono tabular-nums text-right">
                        S/ {c.utilidadNetaPeriodo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-3 font-mono tabular-nums text-right">
                        S/ {(cf?.cuotaTotal ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-3 font-mono tabular-nums text-right font-semibold text-[#0B1F3A] dark:text-teal-300">
                        S/ {c.cuotaTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-3 font-mono tabular-nums text-right">
                        S/ {c.amortizacionCapital.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-3 font-mono tabular-nums text-right">
                        {c.ratioCuotaUtilidad !== null ? `${(c.ratioCuotaUtilidad * 100).toFixed(1)}%` : "N/A"}
                      </td>
                      <td className="py-1.5 px-3 font-medium">{c.estado}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supuestos y limitaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-5">
          <div>
            <h4 className="font-bold text-[#0B1F3A] dark:text-white mb-1.5">Supuestos financieros aplicados</h4>
            <ul className="space-y-1 list-disc pl-4">
              <li>TEA constante durante toda la vida del crédito; conversión base 360.</li>
              <li>Seguros calculados bajo interés simple base 360.</li>
              <li>Prelación estricta de pagos: 1. Seguros, 2. Intereses, 3. Capital.</li>
              <li>
                Restricción verificada periodo a periodo: Cuota / Utilidad ≤{" "}
                {(input.credito.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}%.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#0B1F3A] dark:text-white mb-1.5">Limitaciones de información</h4>
            <ul className="space-y-1 list-disc pl-4">
              <li>
                Meses históricos registrados: {predictivo.mesesDisponiblesCount} de 12 (
                {predictivo.usoReferenciaSintetica
                  ? "con ponderación de patrón sintético sectorial"
                  : "serie anual completa"}
                ).
              </li>
              <li>
                Las pruebas de estrés externo representan escenarios hipotéticos, no pronósticos
                climáticos ni predicciones reales.
              </li>
              <li>
                Este documento proviene de un prototipo Cajathon 2026 y no representa una aprobación
                crediticia automática.
              </li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  );
}
