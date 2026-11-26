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

  const explicacionEstacionalidad = `El negocio (${negocio.actividadEspecifica} en ${negocio.provincia}, ${negocio.departamento}) presenta sus mayores niveles de capacidad económica en ${predictivo.mesesMayorCapacidad.join(", ")} y sus tramos de menor holgura en ${predictivo.mesesMenorCapacidad.join(", ")}. La tendencia proyectada es ${predictivo.tendencia.toLowerCase()} (${predictivo.pendienteMensualPct > 0 ? "+" : ""}${predictivo.pendienteMensualPct}% mensual) con una volatilidad histórica de ${predictivo.volatilidadPct}% y un nivel de confianza de ${predictivo.nivelConfianza}%.`;

  const justificacionCuotas = adaptado.viable
    ? `El cronograma adaptado ajusta cada cuota proporcionalmente a la utilidad neta disponible estimada, manteniéndose dentro del factor máximo configurado (${(credito.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}%). Las cuotas oscilan entre S/ ${adaptado.cuotaMinima.toLocaleString("es-PE")} en meses bajos y S/ ${adaptado.cuotaMaxima.toLocaleString("es-PE")} en meses de mayor liquidez.`
    : `Bajo los parámetros actuales (monto S/ ${credito.montoSolicitado.toLocaleString("es-PE")}, plazo ${credito.plazoMeses} meses, TEA ${(credito.tea * 100).toFixed(1)}% y factor ${(credito.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}%), el motor financiero determina que no existe un cronograma viable que respete el límite de capacidad en todos los periodos.`;

  const comparacionPlanes = `El plan tradicional exige una cuota fija aproximada de S/ ${tradicional.cuotaPromedio.toLocaleString("es-PE")} con un costo total (intereses + seguros) de S/ ${tradicional.costoTotalCredito.toLocaleString("es-PE")} y presenta ${tradicional.periodosIncumplen} periodo(s) que exceden la capacidad de pago. El plan adaptado registra un costo total de S/ ${adaptado.costoTotalCredito.toLocaleString("es-PE")} (${comparacion.adaptadoEsMasCaro ? `S/ ${comparacion.diferenciaCostoTotal.toLocaleString("es-PE")} mayor` : `S/ ${Math.abs(comparacion.diferenciaCostoTotal).toLocaleString("es-PE")} menor`}) y ${adaptado.periodosIncumplen} incumplimiento(s).`;

  const riesgoSimulacion = simulacion
    ? ` En el escenario hipotético de estrés (${simulacion.parametros.fenomeno} — ${simulacion.parametros.intensidad}), las ventas caerían ${simulacion.impactoVentasPct}% y el plan tradicional acumularía ${simulacion.cuotasQueIncumplenFijo} incumplimiento(s) frente a ${simulacion.cuotasQueIncumplenAdaptado} en el plan adaptado.`
    : "";

  const resumenRiesgos = `Principales alertas: ${
    predictivo.advertenciasDatos.length > 0
      ? predictivo.advertenciasDatos.join(" ")
      : "Estacionalidad sectorial y exposición geográfica moderada sin observaciones críticas en el historial registrado."
  }${riesgoSimulacion}`;

  const conclusionComite = `Evidencia técnica para el Comité: ${comparacion.resumenValor} La decisión final de aprobación, ajuste de monto o requerimiento de garantías corresponde exclusivamente al Asesor de Riesgos y al Comité de Créditos.`;

  const explicacionSencilla = adaptado.viable
    ? `En los meses donde tu negocio vende más (${predictivo.mesesMayorCapacidad.join(", ")}), aportarás cuotas más altas (hasta S/ ${adaptado.cuotaMaxima.toLocaleString("es-PE")}) para reducir tu deuda más rápido. En los meses más tranquilos (${predictivo.mesesMenorCapacidad.join(", ")}), tu cuota bajará hasta S/ ${adaptado.cuotaMinima.toLocaleString("es-PE")} para no ahogar el capital de trabajo de tu negocio.`
    : `Con el monto y plazo actuales, las cuotas superarían la ganancia segura de tu negocio en algunos meses. Conviene ajustar el monto o ampliar el plazo antes de formalizar la solicitud.`;

  return {
    fuente: "local",
    explicacionEstacionalidad,
    justificacionCuotas,
    comparacionPlanes,
    resumenRiesgos,
    conclusionComite,
    explicacionSencilla,
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
          nivelConfianza: predictivo.nivelConfianza,
          mesesPico: predictivo.mesesMayorCapacidad,
          mesesBajos: predictivo.mesesMenorCapacidad,
          tendencia: predictivo.tendencia,
          volatilidad: predictivo.volatilidadPct,
          factores: predictivo.factoresExplicativos,
          utilidadNetaPromedio: predictivo.utilidadNetaPromedio,
        },
        comparacion: {
          montoSolicitado: input.credito.montoSolicitado,
          plazoMeses: input.credito.plazoMeses,
          tea: input.credito.tea,
          factorCapacidad: input.credito.productoConfig.factorMaximoCapacidadPago,
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
              impactoVentasPct: simulacion.impactoVentasPct,
              impactoUtilidadPct: simulacion.impactoUtilidadPct,
              incumplimientosFijo: simulacion.cuotasQueIncumplenFijo,
              incumplimientosAdaptado: simulacion.cuotasQueIncumplenAdaptado,
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
    };
  } catch {
    return localFallback;
  }
}
