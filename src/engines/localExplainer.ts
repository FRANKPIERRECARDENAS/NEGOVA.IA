import {
  AnalisisInput,
  ComparacionCronogramas,
  ExplicacionComite,
  ResultadoPredictivo,
  ResultadoSimulacionExterna,
} from "../types/negova";

export function buildLocalFallbackExplanation(
  input: AnalisisInput,
  predictivo: ResultadoPredictivo,
  comparacion: ComparacionCronogramas,
  simulacion: ResultadoSimulacionExterna | null
): ExplicacionComite {
  const { negocio, credito } = input;
  const { tradicional, adaptado } = comparacion;

  const explicacionEstacionalidad = `El negocio (${negocio.actividadEspecifica} en ${negocio.provincia}, ${negocio.departamento}) presenta sus mayores niveles de capacidad económica en ${predictivo.mesesMayorCapacidad.join(", ")} y sus tramos de menor holgura en ${predictivo.mesesMenorCapacidad.join(", ")}. Se seleccionó el método «${predictivo.trazabilidad.metodoSeleccionado}» (${predictivo.mesesDisponiblesCount}/12 meses reales). La tendencia proyectada es ${predictivo.tendencia.toLowerCase()} (${predictivo.pendienteMensualPct > 0 ? "+" : ""}${predictivo.pendienteMensualPct}% mensual) con volatilidad de ${predictivo.volatilidadPct}% e índice de respaldo documental de ${predictivo.nivelConfianza}/100.`;

  const justificacionCuotas = adaptado.viable
    ? `El cronograma adaptado optimiza la amortización por periodo dentro del límite máximo configurado (${(credito.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}% de la utilidad neta estimada), logrando cierre matemático exacto en S/ 0.00 (verificado por el validador independiente). Las cuotas oscilan entre S/ ${adaptado.cuotaMinima.toLocaleString("es-PE")} en periodos bajos y S/ ${adaptado.cuotaMaxima.toLocaleString("es-PE")} en periodos de mayor liquidez (CV de cuotas: ${adaptado.variabilidadCuotasCV}%).`
    : `Bajo los parámetros actuales (monto S/ ${credito.montoSolicitado.toLocaleString("es-PE")}, plazo ${credito.plazoMeses} meses, TEA ${(credito.tea * 100).toFixed(1)}% y factor ${(credito.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}%), el motor financiero determina que no existe un cronograma viable que amortice el 100% del capital respetando el límite de capacidad en todos los periodos.`;

  const comparacionPlanes = `El plan tradicional exige una cuota fija aproximada de S/ ${tradicional.cuotaPromedio.toLocaleString("es-PE")} con un costo total (intereses + seguros) de S/ ${tradicional.costoTotalCredito.toLocaleString("es-PE")} y presenta ${tradicional.periodosIncumplen} periodo(s) que exceden la capacidad de pago. El plan adaptado registra un costo total de S/ ${adaptado.costoTotalCredito.toLocaleString("es-PE")} (${comparacion.adaptadoEsMasCaro ? `S/ ${comparacion.diferenciaCostoTotal.toLocaleString("es-PE")} mayor` : `S/ ${Math.abs(comparacion.diferenciaCostoTotal).toLocaleString("es-PE")} menor`}) y ${adaptado.periodosIncumplen} incumplimiento(s). Opción recomendada por criterio objetivo: ${comparacion.mejorOpcion}.`;

  const riesgoSimulacion = simulacion
    ? ` En el escenario hipotético de estrés (${simulacion.parametros.fenomeno} — ${simulacion.parametros.intensidad}, desde P${simulacion.parametros.mesInicioPeriodo} por ${simulacion.parametros.duracionMeses}m), las ventas caerían ${simulacion.impactoVentasPct}%: sin reprogramación (choque sobrevenido), el plan fijo original sufriría ${simulacion.sobrevenido.incumplimientosFijoOriginal} incumplimiento(s) frente a ${simulacion.sobrevenido.incumplimientosAdaptadoOriginal} en el adaptado original.`
    : "";

  const resumenRiesgos = `Principales alertas: ${
    predictivo.advertenciasDatos.length > 0
      ? predictivo.advertenciasDatos.join(" ")
      : "Estacionalidad sectorial y exposición geográfica moderada sin observaciones críticas en el historial registrado."
  }${riesgoSimulacion}`;

  const conclusionComite = `Evidencia técnica para el Comité: ${comparacion.resumenValor} (${comparacion.motivoSeleccion}) La decisión final de aprobación, ajuste de monto o requerimiento de garantías corresponde exclusivamente al Asesor de Riesgos y al Comité de Créditos.`;

  const explicacionSencilla = adaptado.viable
    ? comparacion.mejorOpcion === "Tradicional"
      ? `Dado que las ventas de tu negocio son bastante estables durante el año, la cuota fija tradicional (S/ ${tradicional.cuotaPromedio.toLocaleString("es-PE")}) ya se mantiene dentro de tu capacidad segura de pago con menor o igual costo total.`
      : `En los meses donde tu negocio vende más (${predictivo.mesesMayorCapacidad.join(", ")}), aportarás cuotas más altas (hasta S/ ${adaptado.cuotaMaxima.toLocaleString("es-PE")}) para reducir tu deuda más rápido. En los meses más tranquilos (${predictivo.mesesMenorCapacidad.join(", ")}), tu cuota bajará hasta S/ ${adaptado.cuotaMinima.toLocaleString("es-PE")} para proteger tu capital de trabajo.`
    : `Con el monto y plazo actuales, las cuotas superarían la ganancia segura de tu negocio en algunos meses. Conviene reducir el monto o ampliar el plazo antes de formalizar la solicitud.`;

  const trazabilidadCalculos = `Método predictivo: ${predictivo.trazabilidad.metodoSeleccionado} | Escenarios prom.: Conservador S/ ${predictivo.utilidadConservadoraPromedio.toLocaleString("es-PE")}, Base S/ ${predictivo.utilidadNetaPromedio.toLocaleString("es-PE")}, Favorable S/ ${predictivo.utilidadFavorablePromedio.toLocaleString("es-PE")} | Validador independiente: ${adaptado.validacionIndependiente.valido ? "APROBADO (saldo final S/ " + adaptado.validacionIndependiente.saldoFinalVerificado.toFixed(2) + ")" : "CON OBSERVACIONES (" + adaptado.validacionIndependiente.errores.join("; ") + ")"}.`;

  return {
    fuente: "local",
    explicacionEstacionalidad,
    justificacionCuotas,
    comparacionPlanes,
    resumenRiesgos,
    conclusionComite,
    explicacionSencilla,
    trazabilidadCalculos,
  };
}

export async function fetchCommitteeExplanation(
  input: AnalisisInput,
  predictivo: ResultadoPredictivo,
  comparacion: ComparacionCronogramas,
  simulacion: ResultadoSimulacionExterna | null
): Promise<ExplicacionComite> {
  const localFallback = buildLocalFallbackExplanation(
    input,
    predictivo,
    comparacion,
    simulacion
  );

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);

    const response = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        negocio: {
          sector: input.negocio.sector,
          actividad: input.negocio.actividadEspecifica,
          modelo: input.negocio.modeloNegocio,
          zona: `${input.negocio.provincia}, ${input.negocio.departamento}`,
          tipoOperacion: input.negocio.tipoOperacion,
          formalidad: input.negocio.formalidad,
        },
        predictivo: {
          metodo: predictivo.trazabilidad.metodoSeleccionado,
          nivelConfianza: predictivo.nivelConfianza,
          mesesPico: predictivo.mesesMayorCapacidad,
          mesesBajos: predictivo.mesesMenorCapacidad,
          tendencia: predictivo.tendencia,
          volatilidad: predictivo.volatilidadPct,
          factores: predictivo.factoresExplicativos,
          utilidadNetaPromedio: predictivo.utilidadNetaPromedio,
          utilidadConservadoraPromedio: predictivo.utilidadConservadoraPromedio,
          utilidadFavorablePromedio: predictivo.utilidadFavorablePromedio,
        },
        comparacion: {
          montoSolicitado: input.credito.montoSolicitado,
          plazoMeses: input.credito.plazoMeses,
          tea: input.credito.tea,
          factorCapacidad: input.credito.productoConfig.factorMaximoCapacidadPago,
          mejorOpcion: comparacion.mejorOpcion,
          motivoSeleccion: comparacion.motivoSeleccion,
          tradicional: {
            viable: comparacion.tradicional.viable,
            costoTotal: comparacion.tradicional.costoTotalCredito,
            interesesTotales: comparacion.tradicional.totalIntereses,
            segurosTotales: comparacion.tradicional.totalSeguros,
            tcea: comparacion.tradicional.tcea,
            incumplimientos: comparacion.tradicional.periodosIncumplen,
            riesgos: comparacion.tradicional.periodosRiesgo,
          },
          adaptado: {
            viable: comparacion.adaptado.viable,
            validoMatematica: comparacion.adaptado.validacionIndependiente.valido,
            costoTotal: comparacion.adaptado.costoTotalCredito,
            interesesTotales: comparacion.adaptado.totalIntereses,
            segurosTotales: comparacion.adaptado.totalSeguros,
            tcea: comparacion.adaptado.tcea,
            incumplimientos: comparacion.adaptado.periodosIncumplen,
            riesgos: comparacion.adaptado.periodosRiesgo,
            cuotaMinima: comparacion.adaptado.cuotaMinima,
            cuotaMaxima: comparacion.adaptado.cuotaMaxima,
          },
          diferenciaCostos: comparacion.diferenciaCostoTotal,
        },
        simulacion: simulacion
          ? {
              activa: true,
              fenomeno: simulacion.parametros.fenomeno,
              intensidad: simulacion.parametros.intensidad,
              inicioPeriodo: simulacion.parametros.mesInicioPeriodo,
              duracionMeses: simulacion.parametros.duracionMeses,
              impactoVentasPct: simulacion.impactoVentasPct,
              impactoUtilidadPct: simulacion.impactoUtilidadPct,
              incumplimientosFijoPreventivo: simulacion.cuotasQueIncumplenFijo,
              incumplimientosAdaptadoPreventivo: simulacion.cuotasQueIncumplenAdaptado,
              incumplimientosFijoSobrevenido: simulacion.sobrevenido.incumplimientosFijoOriginal,
              incumplimientosAdaptadoSobrevenido:
                simulacion.sobrevenido.incumplimientosAdaptadoOriginal,
            }
          : null,
      }),
    });

    clearTimeout(timer);
    if (!response.ok) {
      return localFallback;
    }
    const data = await response.json();
    if (!data?.explanation) {
      return localFallback;
    }
    return {
      fuente: "gemini",
      modelo: data.model || "gemini-4-hydrogen",
      ...data.explanation,
      trazabilidadCalculos: localFallback.trazabilidadCalculos,
    };
  } catch {
    return localFallback;
  }
}
