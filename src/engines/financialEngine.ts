import {
  ComparacionCronogramas,
  CronogramaCalculado,
  CuotaCronograma,
  DesgloseFuncionObjetivo,
  EstadoCumplimiento,
  ProductoFinancieroConfig,
  ProyeccionPeriodo,
  SolicitudCredito,
  TrazabilidadCuota,
} from "../types/negova";
import { validateScheduleIndependently } from "./independentValidator";

export interface WaterfallResult {
  seguroPagado: number;
  interesPagado: number;
  capitalAmortizado: number;
  nuevoSaldoCapital: number;
  seguroPendienteNoCapitalizado: number;
  interesPendienteNoCapitalizado: number;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Regla obligatoria de orden de prelación de pagos:
 * 1. Seguros -> 2. Intereses -> 3. Capital.
 * Si el pago es insuficiente, los saldos impagos permanecen en sus conceptos
 * y NUNCA se capitalizan en el saldo principal.
 */
export function aplicarPagoWaterfall(params: {
  pagoDisponible: number;
  saldoCapital: number;
  seguroPeriodo: number;
  interesPeriodo: number;
  seguroPendientePrevio?: number;
  interesPendientePrevio?: number;
}): WaterfallResult {
  const pagoCents = Math.max(0, toCents(params.pagoDisponible));
  const saldoCents = Math.max(0, toCents(params.saldoCapital));
  const segReqCents = Math.max(
    0,
    toCents(params.seguroPeriodo) + toCents(params.seguroPendientePrevio ?? 0)
  );
  const intReqCents = Math.max(
    0,
    toCents(params.interesPeriodo) + toCents(params.interesPendientePrevio ?? 0)
  );

  let rem = pagoCents;
  const segPaid = Math.min(rem, segReqCents);
  rem -= segPaid;
  const segPend = Math.max(0, segReqCents - segPaid);

  const intPaid = Math.min(rem, intReqCents);
  rem -= intPaid;
  const intPend = Math.max(0, intReqCents - intPaid);

  const capPaid = Math.min(rem, saldoCents);
  const newSaldo = Math.max(0, saldoCents - capPaid);

  return {
    seguroPagado: fromCents(segPaid),
    interesPagado: fromCents(intPaid),
    capitalAmortizado: fromCents(capPaid),
    nuevoSaldoCapital: fromCents(newSaldo),
    seguroPendienteNoCapitalizado: fromCents(segPend),
    interesPendienteNoCapitalizado: fromCents(intPend),
  };
}

function aplicarPagoWaterfallCents(params: {
  pagoCents: number;
  saldoCents: number;
  seguroPeriodoCents: number;
  interesPeriodoCents: number;
  seguroPendPrevCents: number;
  interesPendPrevCents: number;
}) {
  let rem = Math.max(0, Math.round(params.pagoCents));
  const segReq = params.seguroPeriodoCents + params.seguroPendPrevCents;
  const segPaid = Math.min(rem, segReq);
  rem -= segPaid;
  const segPend = Math.max(0, segReq - segPaid);

  const intReq = params.interesPeriodoCents + params.interesPendPrevCents;
  const intPaid = Math.min(rem, intReq);
  rem -= intPaid;
  const intPend = Math.max(0, intReq - intPaid);

  const capPaid = Math.min(rem, params.saldoCents);
  const newSaldo = Math.max(0, params.saldoCents - capPaid);

  return { segPaid, intPaid, capPaid, newSaldo, segPend, intPend };
}

export function calcularTED(tea: number): number {
  return Math.pow(1 + tea, 1 / 360) - 1;
}

export function calcularTasaEfectivaPeriodo(tea: number, diasPeriodo: number): number {
  return Math.pow(1 + tea, diasPeriodo / 360) - 1;
}

export function calcularSeguroSimpleBase360(
  baseAsegurada: number,
  tasaAnual: number,
  diasPeriodo: number
): number {
  if (baseAsegurada <= 0 || tasaAnual <= 0 || diasPeriodo <= 0) return 0;
  return baseAsegurada * tasaAnual * (diasPeriodo / 360);
}

/**
 * Calcula la TCEA exacta resolviendo la TIR de los flujos reales con días exactos (base 360).
 * Devuelve null si faltan parámetros o no converge.
 */
export function calcularTCEA(
  montoDesembolsado: number,
  cuotas: Array<{ cuotaTotal: number; diasPeriodo: number }>
): number | null {
  if (
    !Number.isFinite(montoDesembolsado) ||
    montoDesembolsado <= 0 ||
    cuotas.length === 0
  ) {
    return null;
  }

  let cumulativeDays = 0;
  const cashflows = cuotas.map((c) => {
    cumulativeDays += c.diasPeriodo;
    return { amount: c.cuotaTotal, years360: cumulativeDays / 360 };
  });

  const totalPagos = cashflows.reduce((a, b) => a + b.amount, 0);
  if (totalPagos <= 0) return null;

  const npv = (annualRate: number): number => {
    if (annualRate <= -0.99) return Number.POSITIVE_INFINITY;
    let sum = -montoDesembolsado;
    for (const cf of cashflows) {
      sum += cf.amount / Math.pow(1 + annualRate, cf.years360);
    }
    return sum;
  };

  let low = -0.5;
  let high = 5.0;
  let fLow = npv(low);
  const fHigh = npv(high);
  if (fLow * fHigh > 0) {
    return null;
  }

  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-7) {
      return Number(mid.toFixed(6));
    }
    if (fLow * fMid <= 0) {
      high = mid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return Number(((low + high) / 2).toFixed(6));
}

function evaluarEstadoPeriodo(
  cuotaTotal: number,
  utilidadNetaPeriodo: number,
  factorProducto: number
): { ratio: number | null; estado: EstadoCumplimiento } {
  if (utilidadNetaPeriodo <= 0) {
    return {
      ratio: null,
      estado: cuotaTotal > 0.01 ? "Incumple" : "Cumple",
    };
  }
  const ratio = cuotaTotal / utilidadNetaPeriodo;
  if (ratio > factorProducto + 1e-4) {
    return { ratio: Number(ratio.toFixed(4)), estado: "Incumple" };
  }
  if (ratio > factorProducto * 0.85) {
    return { ratio: Number(ratio.toFixed(4)), estado: "Riesgo" };
  }
  return { ratio: Number(ratio.toFixed(4)), estado: "Cumple" };
}

function buildInstallmentTraceability(params: {
  tipo: "Tradicional" | "Adaptado";
  p: ProyeccionPeriodo;
  cuotaTotal: number;
  amortizacionCapital: number;
  interesPeriodo: number;
  segurosTotales: number;
  capacidadMax: number;
  factorMax: number;
  ratio: number | null;
  estado: EstadoCumplimiento;
}): TrazabilidadCuota {
  const {
    tipo,
    p,
    cuotaTotal,
    amortizacionCapital,
    interesPeriodo,
    segurosTotales,
    capacidadMax,
    factorMax,
    ratio,
    estado,
  } = params;

  const costosYObligaciones =
    p.costosEsperados + p.gastosOperativosYTributarios + p.obligacionesYCarga - p.otrosIngresosNetos;

  // Sensibilidad directa ante caída del 20% en ventas proyectadas
  const caidaVentas = Math.round(p.ventasEsperadas * 0.2);
  // Aproximación conservadora: costos proporcionales bajan ~50% de la proporción si existen, gastos fijos permanecen
  const margenVariableAprox =
    p.ventasEsperadas > 0
      ? Math.max(0.25, Math.min(0.85, (p.ventasEsperadas - p.costosEsperados) / p.ventasEsperadas))
      : 0.45;
  const utilidadEstresada20 = Math.round(p.utilidadNetaDisponible - caidaVentas * margenVariableAprox);
  const capMaxEstresada20 =
    utilidadEstresada20 > 0 ? round2(utilidadEstresada20 * factorMax) : 0;
  const eval20 = evaluarEstadoPeriodo(cuotaTotal, utilidadEstresada20, factorMax);

  const motivoImporte =
    tipo === "Tradicional"
      ? `Cuota constante contractual de S/ ${cuotaTotal.toFixed(2)} (amortiza S/ ${amortizacionCapital.toFixed(2)} de capital + S/ ${interesPeriodo.toFixed(2)} interés + S/ ${segurosTotales.toFixed(2)} seguros), independiente del nivel estacional (${p.indiceEstacional.toFixed(2)}x).`
      : p.utilidadNetaDisponible <= 0
      ? `Utilidad disponible nula o negativa (S/ ${p.utilidadNetaDisponible.toFixed(2)}): se restringe la cuota a S/ ${cuotaTotal.toFixed(2)} para no forzar pagos insostenibles.`
      : `Cuota optimizada de S/ ${cuotaTotal.toFixed(2)} alineada al índice estacional ${p.indiceEstacional.toFixed(2)}x (capacidad ${p.clasificacionCapacidad}): cubre S/ ${(interesPeriodo + segurosTotales).toFixed(2)} de carga financiera y amortiza S/ ${amortizacionCapital.toFixed(2)} de capital dentro del techo de S/ ${capacidadMax.toFixed(2)}.`;

  const restriccionVerificada =
    p.utilidadNetaDisponible <= 0
      ? `Utilidad ≤ 0 ⇒ Techo S/ 0.00 (${estado})`
      : `Cuota/Utilidad = ${ratio !== null ? (ratio * 100).toFixed(1) : "N/A"}% ≤ ${(factorMax * 100).toFixed(0)}% (${estado})`;

  return {
    motivoImporte,
    ingresosProyectados: p.ventasEsperadas,
    costosYObligacionesDescontadas: Math.max(0, costosYObligaciones),
    utilidadNetaEstimada: round2(p.utilidadNetaDisponible),
    capacidadMaximaPermitida: round2(capacidadMax),
    restriccionVerificada,
    sensibilidadCaida20Pct: {
      utilidadEstresada20,
      capacidadMaximaEstresada20: capMaxEstresada20,
      nuevoRatioSiCae20Pct: eval20.ratio,
      estadoSiCae20Pct: eval20.estado,
    },
  };
}

function validateProductParameters(
  solicitud: SolicitudCredito,
  config: ProductoFinancieroConfig
): string | null {
  if (solicitud.montoSolicitado <= 0) {
    return "El monto solicitado debe ser mayor a cero.";
  }
  if (config.factorMaximoCapacidadPago <= 0 || config.factorMaximoCapacidadPago >= 1) {
    return "El factor máximo de capacidad de pago del producto debe ser mayor que 0 y estrictamente menor que 1.";
  }
  if (solicitud.tea > config.teaMaximaBCRP) {
    return `La TEA solicitada (${(solicitud.tea * 100).toFixed(2)}%) supera la tasa máxima aplicable del BCRP (${(config.teaMaximaBCRP * 100).toFixed(2)}%).`;
  }
  if (solicitud.tea < config.teaMinima) {
    return `La TEA (${(solicitud.tea * 100).toFixed(2)}%) está por debajo de la tasa mínima configurada para el producto (${(config.teaMinima * 100).toFixed(2)}%).`;
  }
  if (
    solicitud.plazoMeses < config.plazoMinimoMeses ||
    solicitud.plazoMeses > config.plazoMaximoMeses
  ) {
    return `El plazo de ${solicitud.plazoMeses} meses está fuera del rango permitido (${config.plazoMinimoMeses} a ${config.plazoMaximoMeses} meses).`;
  }
  if (config.esHipotecario && config.seguroBienTipo !== "Vivienda") {
    return "Para productos hipotecarios, el seguro de vivienda es obligatorio.";
  }
  return null;
}

function computePeriodChargesCents(
  saldoCents: number,
  diasPeriodo: number,
  tea: number,
  config: ProductoFinancieroConfig
) {
  const tep = calcularTasaEfectivaPeriodo(tea, diasPeriodo);
  const interesCents = Math.round(saldoCents * tep);
  const desgravamenCents = config.desgravamenHabilitado
    ? Math.round(saldoCents * config.tasaAnualDesgravamen * (diasPeriodo / 360))
    : 0;
  const seguroBienCents =
    config.seguroBienTipo !== "Ninguno" &&
    config.valorBienAsegurado > 0 &&
    config.tasaAnualSeguroBien > 0
      ? Math.round(
          toCents(config.valorBienAsegurado) * config.tasaAnualSeguroBien * (diasPeriodo / 360)
        )
      : 0;
  return { tep, interesCents, desgravamenCents, seguroBienCents };
}

function simulatePaymentVectorCents(
  paymentVectorCents: number[],
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[],
  tipo: "Tradicional" | "Adaptado"
): {
  cuotas: CuotaCronograma[];
  finalSaldoCents: number;
  moraFinalCents: number;
  totalInteresCents: number;
  totalSeguroCents: number;
  periodosIncumplen: number;
} {
  const { montoSolicitado, tea, productoConfig } = solicitud;
  const factorMax = productoConfig.factorMaximoCapacidadPago;
  let saldoCents = toCents(montoSolicitado);
  let seguroPendCents = 0;
  let interesPendCents = 0;
  let totalInteresCents = 0;
  let totalSeguroCents = 0;
  let periodosIncumplen = 0;
  const cuotas: CuotaCronograma[] = [];

  for (let i = 0; i < proyecciones.length; i++) {
    const p = proyecciones[i];
    const { tep, interesCents, desgravamenCents, seguroBienCents } = computePeriodChargesCents(
      saldoCents,
      p.diasPeriodo,
      tea,
      productoConfig
    );
    const segPeriodoCents = desgravamenCents + seguroBienCents;
    const totalExigibleCents =
      saldoCents + interesCents + interesPendCents + segPeriodoCents + seguroPendCents;

    const pagoEfectivoCents = Math.max(
      0,
      Math.min(Math.round(paymentVectorCents[i] ?? 0), totalExigibleCents)
    );

    const wf = aplicarPagoWaterfallCents({
      pagoCents: pagoEfectivoCents,
      saldoCents,
      seguroPeriodoCents: segPeriodoCents,
      interesPeriodoCents: interesCents,
      seguroPendPrevCents: seguroPendCents,
      interesPendPrevCents: interesPendCents,
    });

    totalInteresCents += wf.intPaid;
    totalSeguroCents += wf.segPaid;

    const pagoSol = fromCents(pagoEfectivoCents);
    const capMaxSol =
      p.utilidadNetaDisponible > 0 ? round2(p.utilidadNetaDisponible * factorMax) : 0;
    const { ratio, estado } = evaluarEstadoPeriodo(pagoSol, p.utilidadNetaDisponible, factorMax);
    if (estado === "Incumple") periodosIncumplen++;

    cuotas.push({
      numeroCuota: p.periodo,
      etiquetaPeriodo: p.etiquetaPeriodo,
      fechaVencimiento: p.fechaVencimiento,
      diasPeriodo: p.diasPeriodo,
      saldoInicial: fromCents(saldoCents),
      tasaEfectivaPeriodo: Number(tep.toFixed(6)),
      amortizacionCapital: fromCents(wf.capPaid),
      interesPeriodo: fromCents(wf.intPaid),
      seguroDesgravamen: fromCents(desgravamenCents),
      seguroBien: fromCents(seguroBienCents),
      segurosTotales: fromCents(wf.segPaid),
      cuotaTotal: pagoSol,
      saldoFinal: fromCents(wf.newSaldo),
      utilidadNetaPeriodo: round2(p.utilidadNetaDisponible),
      capacidadMaximaPermitida: capMaxSol,
      ratioCuotaUtilidad: ratio,
      estado,
      seguroPendienteNoCapitalizado: fromCents(wf.segPend),
      interesPendienteNoCapitalizado: fromCents(wf.intPend),
      trazabilidad: buildInstallmentTraceability({
        tipo,
        p,
        cuotaTotal: pagoSol,
        amortizacionCapital: fromCents(wf.capPaid),
        interesPeriodo: fromCents(wf.intPaid),
        segurosTotales: fromCents(wf.segPaid),
        capacidadMax: capMaxSol,
        factorMax,
        ratio,
        estado,
      }),
    });

    saldoCents = wf.newSaldo;
    seguroPendCents = wf.segPend;
    interesPendCents = wf.intPend;
  }

  return {
    cuotas,
    finalSaldoCents: saldoCents,
    moraFinalCents: seguroPendCents + interesPendCents,
    totalInteresCents,
    totalSeguroCents,
    periodosIncumplen,
  };
}

function summarizeSchedule(
  tipo: "Tradicional" | "Adaptado",
  cuotas: CuotaCronograma[],
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[],
  reglaViabilidadError: string | null,
  optimizadorDetalle?: DesgloseFuncionObjetivo
): CronogramaCalculado {
  const totalCapital = round2(cuotas.reduce((a, c) => a + c.amortizacionCapital, 0));
  const totalIntereses = round2(cuotas.reduce((a, c) => a + c.interesPeriodo, 0));
  const totalSeguros = round2(cuotas.reduce((a, c) => a + c.segurosTotales, 0));
  const costoTotalCredito = round2(totalIntereses + totalSeguros);
  const totalPagado = round2(totalCapital + costoTotalCredito);

  const cuotaValores = cuotas.map((c) => c.cuotaTotal);
  const cuotaMinima = cuotaValores.length ? Math.min(...cuotaValores) : 0;
  const cuotaMaxima = cuotaValores.length ? Math.max(...cuotaValores) : 0;
  const cuotaPromedio = cuotaValores.length
    ? round2(cuotaValores.reduce((a, b) => a + b, 0) / cuotaValores.length)
    : 0;

  // Coeficiente de variación de cuotas (%)
  let variabilidadCuotasCV = 0;
  if (cuotaValores.length > 1 && cuotaPromedio > 0) {
    const variance =
      cuotaValores.reduce((acc, q) => acc + Math.pow(q - cuotaPromedio, 2), 0) /
      cuotaValores.length;
    variabilidadCuotasCV = Number(((Math.sqrt(variance) / cuotaPromedio) * 100).toFixed(1));
  }

  const periodosCumplen = cuotas.filter((c) => c.estado === "Cumple").length;
  const periodosRiesgo = cuotas.filter((c) => c.estado === "Riesgo").length;
  const periodosIncumplen = cuotas.filter((c) => c.estado === "Incumple").length;

  const ratiosValidos = cuotas
    .map((c) => c.ratioCuotaUtilidad)
    .filter((r): r is number => r !== null);
  const ratioMaximoObservado = ratiosValidos.length ? Math.max(...ratiosValidos) : 9.99;
  const ratioPromedio = ratiosValidos.length
    ? Number((ratiosValidos.reduce((a, b) => a + b, 0) / ratiosValidos.length).toFixed(4))
    : 9.99;

  const tieneMoraNoCubierta = cuotas.some(
    (c) => c.seguroPendienteNoCapitalizado > 0.02 || c.interesPendienteNoCapitalizado > 0.02
  );
  const saldoFinalResidual = cuotas.length ? cuotas[cuotas.length - 1].saldoFinal : 0;

  const hasMissingInsuranceParams =
    (solicitud.productoConfig.desgravamenHabilitado &&
      solicitud.productoConfig.tasaAnualDesgravamen <= 0) ||
    (solicitud.productoConfig.seguroBienTipo !== "Ninguno" &&
      (solicitud.productoConfig.tasaAnualSeguroBien <= 0 ||
        solicitud.productoConfig.valorBienAsegurado <= 0));

  let motivoNoViabilidad = reglaViabilidadError;
  if (!motivoNoViabilidad && periodosIncumplen > 0) {
    motivoNoViabilidad = `Incumple la restricción Cuota / Utilidad neta ≤ ${(solicitud.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}% en ${periodosIncumplen} periodo(s).`;
  } else if (!motivoNoViabilidad && saldoFinalResidual > 0.05) {
    motivoNoViabilidad = `Saldo capital pendiente al finalizar el plazo (S/ ${saldoFinalResidual.toFixed(2)}).`;
  } else if (!motivoNoViabilidad && tieneMoraNoCubierta) {
    motivoNoViabilidad =
      "La capacidad económica en algunos periodos no alcanza a cubrir intereses y seguros corrientes.";
  }

  let viable = motivoNoViabilidad === null;

  // Ejecutar validador independiente de forma obligatoria
  const validacionIndependiente = validateScheduleIndependently(
    { tipo, viable, cuotas },
    solicitud,
    proyecciones
  );

  if (viable && !validacionIndependiente.valido) {
    viable = false;
    motivoNoViabilidad = `Rechazado por validador independiente: ${validacionIndependiente.errores[0]}`;
  }

  const tcea = hasMissingInsuranceParams
    ? null
    : calcularTCEA(solicitud.montoSolicitado, cuotas);

  const tceaNota = hasMissingInsuranceParams
    ? "No se calculó TCEA por falta de tasa o valor asegurado en un seguro habilitado."
    : !viable
    ? "Crédito declarado no viable; TCEA referencial sobre flujos simulados sin liquidación completa."
    : null;

  return {
    tipo,
    viable,
    motivoNoViabilidad,
    cuotas,
    tea: solicitud.tea,
    ted: calcularTED(solicitud.tea),
    tcea,
    tceaNota,
    totalCapital,
    totalIntereses,
    totalSeguros,
    costoTotalCredito,
    totalPagado,
    cuotaMinima: round2(cuotaMinima),
    cuotaMaxima: round2(cuotaMaxima),
    cuotaPromedio,
    variabilidadCuotasCV,
    periodosCumplen,
    periodosRiesgo,
    periodosIncumplen,
    ratioMaximoObservado,
    ratioPromedio,
    optimizadorDetalle,
    validacionIndependiente,
  };
}

export function buildTraditionalSchedule(
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[]
): CronogramaCalculado {
  const paramError = validateProductParameters(solicitud, solicitud.productoConfig);
  const n = proyecciones.length;

  // Bisección en centavos enteros con arrastre completo de impagos de seguros/intereses
  let lowCents = 0;
  let highCents = toCents(solicitud.montoSolicitado * (1 + solicitud.tea * 2) + 50000);

  for (let iter = 0; iter < 55; iter++) {
    const midCents = Math.round((lowCents + highCents) / 2);
    let saldoCents = toCents(solicitud.montoSolicitado);
    let segPend = 0;
    let intPend = 0;

    for (let i = 0; i < n; i++) {
      const p = proyecciones[i];
      const { interesCents, desgravamenCents, seguroBienCents } = computePeriodChargesCents(
        saldoCents,
        p.diasPeriodo,
        solicitud.tea,
        solicitud.productoConfig
      );
      const wf = aplicarPagoWaterfallCents({
        pagoCents: midCents,
        saldoCents,
        seguroPeriodoCents: desgravamenCents + seguroBienCents,
        interesPeriodoCents: interesCents,
        seguroPendPrevCents: segPend,
        interesPendPrevCents: intPend,
      });
      saldoCents = wf.newSaldo;
      segPend = wf.segPend;
      intPend = wf.intPend;
    }

    if (saldoCents + segPend + intPend > 0) {
      lowCents = midCents + 1;
    } else {
      highCents = midCents;
    }
    if (lowCents >= highCents) break;
  }

  const fixedCents = highCents;
  const paymentVec = proyecciones.map(() => fixedCents);
  // Cierre exacto del último periodo al saldo exigible
  if (n > 0) {
    const simPre = simulatePaymentVectorCents(paymentVec, solicitud, proyecciones, "Tradicional");
    const lastIdx = n - 1;
    const prevSaldo = simPre.cuotas[lastIdx]?.saldoFinal ?? 0;
    const prevMora =
      (simPre.cuotas[lastIdx]?.interesPendienteNoCapitalizado ?? 0) +
      (simPre.cuotas[lastIdx]?.seguroPendienteNoCapitalizado ?? 0);
    if (prevSaldo > 0 || prevMora > 0) {
      paymentVec[lastIdx] = fixedCents + toCents(prevSaldo + prevMora);
    }
  }

  const { cuotas } = simulatePaymentVectorCents(paymentVec, solicitud, proyecciones, "Tradicional");
  return summarizeSchedule("Tradicional", cuotas, solicitud, proyecciones, paramError);
}

function evaluateObjective(
  cuotas: CuotaCronograma[],
  solicitud: SolicitudCredito,
  finalSaldoCents: number,
  moraFinalCents: number,
  iteraciones: number
): DesgloseFuncionObjetivo {
  const monto = Math.max(1, solicitud.montoSolicitado);
  const factorMax = solicitud.productoConfig.factorMaximoCapacidadPago;
  const incumplimientos = cuotas.filter((c) => c.estado === "Incumple").length;
  const activeCuotas = cuotas.map((c) => c.cuotaTotal);
  const meanCuota =
    activeCuotas.reduce((a, b) => a + b, 0) / Math.max(1, activeCuotas.length);
  const stdCuota = Math.sqrt(
    activeCuotas.reduce((a, q) => a + Math.pow(q - meanCuota, 2), 0) /
      Math.max(1, activeCuotas.length)
  );
  const variabilidadCuotasCV = meanCuota > 0 ? stdCuota / meanCuota : 0;

  const ratios = cuotas
    .map((c) => c.ratioCuotaUtilidad)
    .filter((r): r is number => r !== null);
  const meanRatio =
    ratios.reduce((a, b) => a + b, 0) / Math.max(1, ratios.length);
  const stdRatio = Math.sqrt(
    ratios.reduce((a, r) => a + Math.pow(r - meanRatio, 2), 0) /
      Math.max(1, ratios.length)
  );
  const variabilidadRatioCV = meanRatio > 0 ? stdRatio / meanRatio : 0;

  const maxAmort = cuotas.reduce((m, c) => Math.max(m, c.amortizacionCapital), 0);
  const concentracionMaxAmortPct = maxAmort / monto;

  const costoTotal = cuotas.reduce((a, c) => a + c.interesPeriodo + c.segurosTotales, 0);
  const costoFinancieroSobreMonto = costoTotal / monto;

  // Desviación respecto al umbral sostenible objetivo (85% del factor máximo)
  const targetSafeRatio = factorMax * 0.82;
  const desviacionSostenible =
    ratios.reduce((acc, r) => acc + Math.max(0, r - targetSafeRatio), 0) /
    Math.max(1, ratios.length);

  const residualPenalty = (finalSaldoCents + moraFinalCents) > 1 ? 500 : 0;

  const valorTotalObjetivo = Number(
    (
      1000 * incumplimientos +
      residualPenalty +
      1.8 * costoFinancieroSobreMonto +
      0.55 * variabilidadRatioCV +
      0.35 * variabilidadCuotasCV +
      0.45 * concentracionMaxAmortPct +
      0.3 * desviacionSostenible
    ).toFixed(4)
  );

  return {
    formulaTexto:
      "J(P) = 1000·Incumpl + 1.8·(Costo/Monto) + 0.55·CV(Ratio) + 0.35·CV(Cuota) + 0.45·MaxConc + 0.30·DesvSost",
    valorTotalObjetivo,
    penalizacionIncumplimientos: 1000 * incumplimientos + residualPenalty,
    variabilidadCuotasCV: Number((variabilidadCuotasCV * 100).toFixed(1)),
    variabilidadRatioCV: Number((variabilidadRatioCV * 100).toFixed(1)),
    concentracionMaxAmortPct: Number((concentracionMaxAmortPct * 100).toFixed(1)),
    costoFinancieroSobreMonto: Number((costoFinancieroSobreMonto * 100).toFixed(2)),
    desviacionSostenible: Number((desviacionSostenible * 100).toFixed(2)),
    iteracionesOptimizador: iteraciones,
  };
}

function buildProportionalPaymentVectorCents(
  targetRatio: number,
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[],
  maxConcShare: number
): number[] {
  const { montoSolicitado, tea, productoConfig } = solicitud;
  const factorMax = productoConfig.factorMaximoCapacidadPago;
  let saldoCents = toCents(montoSolicitado);
  let segPend = 0;
  let intPend = 0;

  const maxAmortCents = Math.round(
    Math.max(
      toCents(montoSolicitado) / Math.max(1, proyecciones.length),
      toCents(montoSolicitado) * maxConcShare
    )
  );

  const vec: number[] = [];
  for (let i = 0; i < proyecciones.length; i++) {
    const p = proyecciones[i];
    const { interesCents, desgravamenCents, seguroBienCents } = computePeriodChargesCents(
      saldoCents,
      p.diasPeriodo,
      tea,
      productoConfig
    );
    const segPeriodo = desgravamenCents + seguroBienCents;
    const minPagoCents = segPeriodo + segPend + interesCents + intPend;
    const capMaxCents =
      p.utilidadNetaDisponible > 0
        ? Math.floor(p.utilidadNetaDisponible * factorMax * 100)
        : 0;
    const cuotaPropCents =
      p.utilidadNetaDisponible > 0
        ? Math.floor(p.utilidadNetaDisponible * targetRatio * 100)
        : 0;

    const totalParaLiquidar = saldoCents + minPagoCents;
    let pago = Math.max(cuotaPropCents, Math.min(minPagoCents, capMaxCents));
    pago = Math.min(pago, capMaxCents, minPagoCents + maxAmortCents, totalParaLiquidar);
    vec.push(Math.max(0, pago));

    const wf = aplicarPagoWaterfallCents({
      pagoCents: pago,
      saldoCents,
      seguroPeriodoCents: segPeriodo,
      interesPeriodoCents: interesCents,
      seguroPendPrevCents: segPend,
      interesPendPrevCents: intPend,
    });
    saldoCents = wf.newSaldo;
    segPend = wf.segPend;
    intPend = wf.intPend;
  }
  return vec;
}

/**
 * Evaluador ultrarrápido sin asignación de strings/objetos para el optimizador multiperiodo.
 */
function fastEvalScheduleCents(
  paymentVec: number[],
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[],
  capMaxVec: number[]
): {
  valid: boolean;
  finalSaldoCents: number;
  moraFinalCents: number;
  objetivo: number;
} {
  const n = proyecciones.length;
  const { montoSolicitado, tea, productoConfig } = solicitud;
  const monto = Math.max(1, montoSolicitado);
  const factorMax = productoConfig.factorMaximoCapacidadPago;
  const targetSafeRatio = factorMax * 0.82;

  let saldoCents = toCents(montoSolicitado);
  let segPend = 0;
  let intPend = 0;
  let totalCostCents = 0;
  let incumpl = 0;
  let maxAmortCents = 0;

  // Para CV en un solo paso
  let sumCuota = 0;
  let sumCuotaSq = 0;
  let sumRatio = 0;
  let sumRatioSq = 0;
  let ratioCount = 0;
  let desvSostSum = 0;

  for (let i = 0; i < n; i++) {
    const p = proyecciones[i];
    const { interesCents, desgravamenCents, seguroBienCents } = computePeriodChargesCents(
      saldoCents,
      p.diasPeriodo,
      tea,
      productoConfig
    );
    const segPeriodo = desgravamenCents + seguroBienCents;
    const totalExigible = saldoCents + interesCents + intPend + segPeriodo + segPend;
    const pagoCents = Math.max(0, Math.min(paymentVec[i] ?? 0, totalExigible));

    if (pagoCents > capMaxVec[i] + 1) {
      incumpl++;
    }

    const wf = aplicarPagoWaterfallCents({
      pagoCents,
      saldoCents,
      seguroPeriodoCents: segPeriodo,
      interesPeriodoCents: interesCents,
      seguroPendPrevCents: segPend,
      interesPendPrevCents: intPend,
    });

    totalCostCents += wf.intPaid + wf.segPaid;
    if (wf.capPaid > maxAmortCents) maxAmortCents = wf.capPaid;

    const pagoSol = pagoCents / 100;
    sumCuota += pagoSol;
    sumCuotaSq += pagoSol * pagoSol;

    if (p.utilidadNetaDisponible > 0) {
      const r = pagoSol / p.utilidadNetaDisponible;
      sumRatio += r;
      sumRatioSq += r * r;
      ratioCount++;
      if (r > targetSafeRatio) desvSostSum += r - targetSafeRatio;
      if (r > factorMax + 1e-4 && pagoCents <= capMaxVec[i] + 1) {
        // already checked via capMaxVec
      }
    } else if (pagoCents > 1) {
      incumpl++;
    }

    saldoCents = wf.newSaldo;
    segPend = wf.segPend;
    intPend = wf.intPend;
  }

  const moraFinalCents = segPend + intPend;
  const residualPenalty = saldoCents + moraFinalCents > 1 ? 500 : 0;

  const meanCuota = sumCuota / Math.max(1, n);
  const varCuota = Math.max(0, sumCuotaSq / Math.max(1, n) - meanCuota * meanCuota);
  const cvCuota = meanCuota > 0 ? Math.sqrt(varCuota) / meanCuota : 0;

  const meanRatio = ratioCount > 0 ? sumRatio / ratioCount : 0;
  const varRatio = ratioCount > 0 ? Math.max(0, sumRatioSq / ratioCount - meanRatio * meanRatio) : 0;
  const cvRatio = meanRatio > 0 ? Math.sqrt(varRatio) / meanRatio : 0;

  const maxConc = maxAmortCents / (monto * 100);
  const costRatio = totalCostCents / (monto * 100);
  const desvSost = ratioCount > 0 ? desvSostSum / ratioCount : 0;

  const objetivo =
    1000 * incumpl +
    residualPenalty +
    1.8 * costRatio +
    0.55 * cvRatio +
    0.35 * cvCuota +
    0.45 * maxConc +
    0.3 * desvSost;

  return {
    valid: incumpl === 0 && saldoCents === 0 && moraFinalCents === 0,
    finalSaldoCents: saldoCents,
    moraFinalCents,
    objetivo,
  };
}

/**
 * Cierra exactamente el residuo final (S/ 0.00) distribuyendo centavos remanentes
 * en el último periodo con holgura disponible sin superar capacidad máxima.
 */
function closeResidualCentsExactly(
  paymentVec: number[],
  capMaxVec: number[],
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[]
): number[] {
  const vec = [...paymentVec];
  const check0 = fastEvalScheduleCents(vec, solicitud, proyecciones, capMaxVec);
  let remToZero = check0.finalSaldoCents + check0.moraFinalCents;
  if (remToZero === 0) return vec;

  for (let i = vec.length - 1; i >= 0 && remToZero > 0; i--) {
    const headroom = Math.max(0, capMaxVec[i] - vec[i]);
    if (headroom > 0) {
      const add = Math.min(headroom, remToZero + 2);
      vec[i] += add;
      const check = fastEvalScheduleCents(vec, solicitud, proyecciones, capMaxVec);
      remToZero = check.finalSaldoCents + check.moraFinalCents;
      if (remToZero === 0) break;
    }
  }
  return vec;
}

/**
 * Optimizador financiero multiperiodo en 2 etapas con aritmética decimal (centavos):
 * 1. Verificación de factibilidad y solución inicial dentro de capacidad por periodo.
 * 2. Descenso por coordenadas proyectado minimizando la función objetivo J(P) documentada.
 * 3. Cierre exacto a S/ 0.00 y compuerta del validador independiente.
 */
export function buildAdaptiveSchedule(
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[]
): CronogramaCalculado {
  const paramError = validateProductParameters(solicitud, solicitud.productoConfig);
  if (paramError) {
    const fallback = buildTraditionalSchedule(solicitud, proyecciones);
    return {
      ...fallback,
      tipo: "Adaptado",
      viable: false,
      motivoNoViabilidad: paramError,
    };
  }

  if (!solicitud.productoConfig.permiteCuotasVariables) {
    const fixed = buildTraditionalSchedule(solicitud, proyecciones);
    return {
      ...fixed,
      tipo: "Adaptado",
      motivoNoViabilidad:
        fixed.motivoNoViabilidad ??
        "El producto seleccionado no habilita cuotas variables; se mantiene el plan uniforme.",
    };
  }

  const factorMax = solicitud.productoConfig.factorMaximoCapacidadPago;
  const n = proyecciones.length;
  const capMaxVec = proyecciones.map((p) =>
    p.utilidadNetaDisponible > 0 ? Math.floor(p.utilidadNetaDisponible * factorMax * 100) : 0
  );

  // Etapa 1: Prueba de factibilidad máxima en cada periodo (tope estricto capMaxVec)
  const maxFeasibleVec = buildProportionalPaymentVectorCents(factorMax, solicitud, proyecciones, 1.0);
  const maxSim = simulatePaymentVectorCents(maxFeasibleVec, solicitud, proyecciones, "Adaptado");

  if (maxSim.periodosIncumplen > 0 || maxSim.finalSaldoCents > 1 || maxSim.moraFinalCents > 1) {
    const reason =
      maxSim.finalSaldoCents > 1
        ? `Crédito no viable bajo los parámetros actuales: incluso utilizando hasta el ${(factorMax * 100).toFixed(0)}% de la utilidad neta en cada periodo, queda un saldo sin amortizar de S/ ${fromCents(maxSim.finalSaldoCents).toFixed(2)}.`
        : `Crédito no viable: la utilidad neta en uno o más periodos es insuficiente para cubrir intereses y seguros dentro del límite de capacidad (${(factorMax * 100).toFixed(0)}%).`;
    const objFail = evaluateObjective(
      maxSim.cuotas,
      solicitud,
      maxSim.finalSaldoCents,
      maxSim.moraFinalCents,
      1
    );
    return summarizeSchedule("Adaptado", maxSim.cuotas, solicitud, proyecciones, reason, objFail);
  }

  // Etapa 1B: Búsqueda del menor ratio proporcional r* factible usando evaluador entero rápido
  const maxConc = n >= 12 ? 0.28 : 0.45;
  let chosenConc = maxConc;
  const testConcVec = buildProportionalPaymentVectorCents(factorMax, solicitud, proyecciones, maxConc);
  const testConcEval = fastEvalScheduleCents(testConcVec, solicitud, proyecciones, capMaxVec);
  if (testConcEval.finalSaldoCents + testConcEval.moraFinalCents > 5) {
    chosenConc = 1.0;
  }

  let low = 0.02;
  let high = factorMax;
  let iterCount = 0;
  let currentVec = maxFeasibleVec;

  for (let iter = 0; iter < 36; iter++) {
    iterCount++;
    const mid = (low + high) / 2;
    const candidateVec = buildProportionalPaymentVectorCents(mid, solicitud, proyecciones, chosenConc);
    const ev = fastEvalScheduleCents(candidateVec, solicitud, proyecciones, capMaxVec);
    if (ev.finalSaldoCents + ev.moraFinalCents <= 5) {
      high = mid;
      currentVec = candidateVec;
    } else {
      low = mid;
    }
  }

  currentVec = closeResidualCentsExactly(currentVec, capMaxVec, solicitud, proyecciones);
  let bestObjVal = fastEvalScheduleCents(currentVec, solicitud, proyecciones, capMaxVec).objetivo;

  // Etapa 2: Refinamiento multiperiodo por descenso de coordenadas proyectado (sin asignaciones)
  if (n >= 2) {
    const stepSizesCents = [25000, 5000];
    for (const step of stepSizesCents) {
      let improved = true;
      let pass = 0;
      while (improved && pass < 1) {
        improved = false;
        pass++;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            iterCount++;
            if (currentVec[i] + step <= capMaxVec[i] && currentVec[j] - step >= 0) {
              const v1 = [...currentVec];
              v1[i] += step;
              v1[j] -= step;
              const closed1 = closeResidualCentsExactly(v1, capMaxVec, solicitud, proyecciones);
              const ev1 = fastEvalScheduleCents(closed1, solicitud, proyecciones, capMaxVec);
              if (ev1.valid && ev1.objetivo < bestObjVal - 0.0005) {
                currentVec = closed1;
                bestObjVal = ev1.objetivo;
                improved = true;
                continue;
              }
            }
            if (currentVec[j] + step <= capMaxVec[j] && currentVec[i] - step >= 0) {
              const v2 = [...currentVec];
              v2[i] -= step;
              v2[j] += step;
              const closed2 = closeResidualCentsExactly(v2, capMaxVec, solicitud, proyecciones);
              const ev2 = fastEvalScheduleCents(closed2, solicitud, proyecciones, capMaxVec);
              if (ev2.valid && ev2.objetivo < bestObjVal - 0.0005) {
                currentVec = closed2;
                bestObjVal = ev2.objetivo;
                improved = true;
              }
            }
          }
        }
      }
    }
  }

  const finalSim = simulatePaymentVectorCents(currentVec, solicitud, proyecciones, "Adaptado");
  const finalObj = evaluateObjective(
    finalSim.cuotas,
    solicitud,
    finalSim.finalSaldoCents,
    finalSim.moraFinalCents,
    iterCount
  );
  return summarizeSchedule("Adaptado", finalSim.cuotas, solicitud, proyecciones, null, finalObj);
}

export function compareSchedules(
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[]
): ComparacionCronogramas {
  const tradicional = buildTraditionalSchedule(solicitud, proyecciones);
  const adaptado = buildAdaptiveSchedule(solicitud, proyecciones);

  const diferenciaCostoTotal = round2(
    adaptado.costoTotalCredito - tradicional.costoTotalCredito
  );
  const diferenciaIntereses = round2(
    adaptado.totalIntereses - tradicional.totalIntereses
  );
  const diferenciaIncumplimientos =
    tradicional.periodosIncumplen - adaptado.periodosIncumplen;
  const adaptadoEsMasCaro = diferenciaCostoTotal > 0.01;

  let mejorOpcion: "Adaptado" | "Tradicional" | "Equivalente" | "Ninguno" = "Adaptado";
  let motivoSeleccion = "";
  let resumenValor = "";

  if (!adaptado.viable && !tradicional.viable) {
    mejorOpcion = "Ninguno";
    motivoSeleccion =
      "Ni el esquema fijo ni el adaptado satisfacen las restricciones financieras con el monto, plazo y capacidad actuales.";
    resumenValor =
      "Ninguno de los dos planes resulta viable bajo el monto, plazo, tasa y factor de capacidad configurados.";
  } else if (adaptado.viable && !tradicional.viable) {
    mejorOpcion = "Adaptado";
    motivoSeleccion = `El esquema tradicional incumple la capacidad de pago en ${tradicional.periodosIncumplen} periodo(s), mientras el plan adaptado logra 0 incumplimientos y liquidación exacta a S/ 0.00.`;
    resumenValor = `El plan adaptado elimina ${tradicional.periodosIncumplen} incumplimiento(s) del cronograma tradicional${
      adaptadoEsMasCaro
        ? `, con un costo total adicional de S/ ${diferenciaCostoTotal.toFixed(2)}.`
        : ` y además reduce el costo financiero en S/ ${Math.abs(diferenciaCostoTotal).toFixed(2)}.`
    }`;
  } else if (!adaptado.viable && tradicional.viable) {
    mejorOpcion = "Tradicional";
    motivoSeleccion =
      "El cronograma tradicional cumple todas las restricciones mientras el esquema adaptado no converge.";
    resumenValor =
      "El cronograma tradicional cumple restricciones y resulta la opción viable bajo los parámetros actuales.";
  } else {
    // Ambos son viables: evaluar con imparcialidad cuándo el tradicional es mejor o equivalente
    const factorMax = solicitud.productoConfig.factorMaximoCapacidadPago;
    const tradComodoSinRiesgo =
      tradicional.periodosIncumplen === 0 &&
      tradicional.periodosRiesgo === 0 &&
      tradicional.ratioMaximoObservado <= factorMax * 0.85;
    const tradEsMasBaratoOSimilar = tradicional.costoTotalCredito <= adaptado.costoTotalCredito + 1;
    const tradMenosORiesgoIgual = tradicional.periodosRiesgo <= adaptado.periodosRiesgo;
    const negocioEstable = adaptado.variabilidadCuotasCV < 14;

    if (
      (tradEsMasBaratoOSimilar && tradMenosORiesgoIgual && (negocioEstable || diferenciaCostoTotal > 15)) ||
      (tradComodoSinRiesgo && negocioEstable && Math.abs(diferenciaCostoTotal) <= 35)
    ) {
      mejorOpcion = "Tradicional";
      motivoSeleccion =
        "El negocio presenta estabilidad y holgura suficientes para sostener una cuota fija sin incumplimientos ni periodos de riesgo, sin requerir cuotas variables.";
      resumenValor = `Ambos planes son viables; el cronograma tradicional resulta preferible por mantener 0 incumplimientos con ${
        diferenciaCostoTotal > 0.01
          ? `un ahorro de S/ ${diferenciaCostoTotal.toFixed(2)} frente al adaptado.`
          : "cuota fija uniforme sin riesgo en ningún periodo."
      }`;
    } else if (
      Math.abs(diferenciaCostoTotal) <= 5 &&
      Math.abs(tradicional.ratioMaximoObservado - adaptado.ratioMaximoObservado) < 0.025
    ) {
      mejorOpcion = "Equivalente";
      motivoSeleccion = "Ambos planes ofrecen desempeño y costo prácticamente equivalentes.";
      resumenValor = "Ambos planes son viables con diferencias marginales de costo y presión de pago.";
    } else {
      mejorOpcion = "Adaptado";
      motivoSeleccion =
        diferenciaCostoTotal < -0.01
          ? `Reduce el costo financiero total en S/ ${Math.abs(diferenciaCostoTotal).toFixed(2)} y disminuye la presión máxima Cuota/Utilidad.`
          : `Reduce la presión financiera máxima en meses bajos (de ${(tradicional.ratioMaximoObservado * 100).toFixed(1)}% a ${(adaptado.ratioMaximoObservado * 100).toFixed(1)}%) a cambio de S/ ${diferenciaCostoTotal.toFixed(2)} adicionales de intereses.`;
      resumenValor = adaptadoEsMasCaro
        ? `Ambos planes son viables; el plan adaptado mejora la holgura en meses bajos, aunque implica S/ ${diferenciaCostoTotal.toFixed(2)} adicionales en costo financiero.`
        : `Ambos planes son viables; el plan adaptado logra un ahorro de S/ ${Math.abs(diferenciaCostoTotal).toFixed(2)} al amortizar antes en meses de mayor liquidez.`;
    }
  }

  return {
    tradicional,
    adaptado,
    diferenciaCostoTotal,
    diferenciaIntereses,
    diferenciaIncumplimientos,
    adaptadoEsMasCaro,
    mejorOpcion,
    motivoSeleccion,
    resumenValor,
  };
}
