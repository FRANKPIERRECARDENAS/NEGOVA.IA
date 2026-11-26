import {
  ComparacionCronogramas,
  CronogramaCalculado,
  CuotaCronograma,
  EstadoCumplimiento,
  ProductoFinancieroConfig,
  ProyeccionPeriodo,
  SolicitudCredito,
} from "../types/negova";

export interface WaterfallResult {
  seguroPagado: number;
  interesPagado: number;
  capitalAmortizado: number;
  nuevoSaldoCapital: number;
  seguroPendienteNoCapitalizado: number;
  interesPendienteNoCapitalizado: number;
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
  const {
    pagoDisponible,
    saldoCapital,
    seguroPeriodo,
    interesPeriodo,
    seguroPendientePrevio = 0,
    interesPendientePrevio = 0,
  } = params;

  let restante = Math.max(0, pagoDisponible);
  const totalSegurosExigibles = seguroPeriodo + seguroPendientePrevio;
  const seguroPagado = Math.min(restante, totalSegurosExigibles);
  restante -= seguroPagado;
  const seguroPendienteNoCapitalizado = Math.max(
    0,
    totalSegurosExigibles - seguroPagado
  );

  const totalInteresesExigibles = interesPeriodo + interesPendientePrevio;
  const interesPagado = Math.min(restante, totalInteresesExigibles);
  restante -= interesPagado;
  const interesPendienteNoCapitalizado = Math.max(
    0,
    totalInteresesExigibles - interesPagado
  );

  const capitalAmortizado = Math.min(restante, saldoCapital);
  const nuevoSaldoCapital = Math.max(0, saldoCapital - capitalAmortizado);

  return {
    seguroPagado,
    interesPagado,
    capitalAmortizado,
    nuevoSaldoCapital,
    seguroPendienteNoCapitalizado,
    interesPendienteNoCapitalizado,
  };
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
  let fHigh = npv(high);
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
      fHigh = fMid;
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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

function simulateFixedInstallment(
  installmentAmount: number,
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[]
): { finalSaldo: number; cuotas: CuotaCronograma[] } {
  const { montoSolicitado, tea, productoConfig } = solicitud;
  let saldo = montoSolicitado;
  let seguroPendientePrev = 0;
  let interesPendientePrev = 0;
  const cuotas: CuotaCronograma[] = [];

  for (let i = 0; i < proyecciones.length; i++) {
    const p = proyecciones[i];
    const tep = calcularTasaEfectivaPeriodo(tea, p.diasPeriodo);
    const interesPeriodo = saldo * tep;
    const seguroDesgravamen = productoConfig.desgravamenHabilitado
      ? calcularSeguroSimpleBase360(saldo, productoConfig.tasaAnualDesgravamen, p.diasPeriodo)
      : 0;
    const seguroBien =
      productoConfig.seguroBienTipo !== "Ninguno"
        ? calcularSeguroSimpleBase360(
            productoConfig.valorBienAsegurado,
            productoConfig.tasaAnualSeguroBien,
            p.diasPeriodo
          )
        : 0;

    const totalExigible =
      saldo + interesPeriodo + interesPendientePrev + seguroDesgravamen + seguroBien + seguroPendientePrev;
    const pagoEfectivo =
      i === proyecciones.length - 1
        ? totalExigible
        : Math.min(installmentAmount, totalExigible);

    const wf = aplicarPagoWaterfall({
      pagoDisponible: pagoEfectivo,
      saldoCapital: saldo,
      seguroPeriodo: seguroDesgravamen + seguroBien,
      interesPeriodo,
      seguroPendientePrevio: seguroPendientePrev,
      interesPendientePrevio: interesPendientePrev,
    });

    const { ratio, estado } = evaluarEstadoPeriodo(
      pagoEfectivo,
      p.utilidadNetaDisponible,
      productoConfig.factorMaximoCapacidadPago
    );

    cuotas.push({
      numeroCuota: p.periodo,
      etiquetaPeriodo: p.etiquetaPeriodo,
      fechaVencimiento: p.fechaVencimiento,
      diasPeriodo: p.diasPeriodo,
      saldoInicial: round2(saldo),
      tasaEfectivaPeriodo: Number(tep.toFixed(6)),
      amortizacionCapital: round2(wf.capitalAmortizado),
      interesPeriodo: round2(wf.interesPagado),
      seguroDesgravamen: round2(seguroDesgravamen),
      seguroBien: round2(seguroBien),
      segurosTotales: round2(wf.seguroPagado),
      cuotaTotal: round2(pagoEfectivo),
      saldoFinal: round2(wf.nuevoSaldoCapital),
      utilidadNetaPeriodo: round2(p.utilidadNetaDisponible),
      capacidadMaximaPermitida: round2(
        Math.max(0, p.utilidadNetaDisponible * productoConfig.factorMaximoCapacidadPago)
      ),
      ratioCuotaUtilidad: ratio,
      estado,
      seguroPendienteNoCapitalizado: round2(wf.seguroPendienteNoCapitalizado),
      interesPendienteNoCapitalizado: round2(wf.interesPendienteNoCapitalizado),
    });

    saldo = wf.nuevoSaldoCapital;
    seguroPendientePrev = wf.seguroPendienteNoCapitalizado;
    interesPendientePrev = wf.interesPendienteNoCapitalizado;
  }

  return { finalSaldo: saldo + seguroPendientePrev + interesPendientePrev, cuotas };
}

function summarizeSchedule(
  tipo: "Tradicional" | "Adaptado",
  cuotas: CuotaCronograma[],
  solicitud: SolicitudCredito,
  reglaViabilidadError: string | null
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

  const periodosCumplen = cuotas.filter((c) => c.estado === "Cumple").length;
  const periodosRiesgo = cuotas.filter((c) => c.estado === "Riesgo").length;
  const periodosIncumplen = cuotas.filter((c) => c.estado === "Incumple").length;

  const ratiosValidos = cuotas
    .map((c) => c.ratioCuotaUtilidad)
    .filter((r): r is number => r !== null);
  const ratioMaximoObservado = ratiosValidos.length
    ? Math.max(...ratiosValidos)
    : 9.99;
  const ratioPromedio = ratiosValidos.length
    ? Number((ratiosValidos.reduce((a, b) => a + b, 0) / ratiosValidos.length).toFixed(4))
    : 9.99;

  const tieneMoraNoCubierta = cuotas.some(
    (c) => c.seguroPendienteNoCapitalizado > 0.05 || c.interesPendienteNoCapitalizado > 0.05
  );
  const saldoFinalResidual = cuotas.length ? cuotas[cuotas.length - 1].saldoFinal : 0;

  const hasMissingInsuranceParams =
    (solicitud.productoConfig.desgravamenHabilitado &&
      solicitud.productoConfig.tasaAnualDesgravamen <= 0) ||
    (solicitud.productoConfig.seguroBienTipo !== "Ninguno" &&
      (solicitud.productoConfig.tasaAnualSeguroBien <= 0 ||
        solicitud.productoConfig.valorBienAsegurado <= 0));

  const tcea = hasMissingInsuranceParams
    ? null
    : calcularTCEA(solicitud.montoSolicitado, cuotas);

  const tceaNota = hasMissingInsuranceParams
    ? "No se calculó TCEA por falta de tasa o valor asegurado en un seguro habilitado."
    : null;

  let motivoNoViabilidad = reglaViabilidadError;
  if (!motivoNoViabilidad && periodosIncumplen > 0) {
    motivoNoViabilidad = `Incumple la restricción Cuota / Utilidad neta ≤ ${(solicitud.productoConfig.factorMaximoCapacidadPago * 100).toFixed(0)}% en ${periodosIncumplen} periodo(s).`;
  } else if (!motivoNoViabilidad && saldoFinalResidual > 0.5) {
    motivoNoViabilidad = `Saldo capital pendiente al finalizar el plazo (S/ ${saldoFinalResidual.toFixed(2)}).`;
  } else if (!motivoNoViabilidad && tieneMoraNoCubierta) {
    motivoNoViabilidad =
      "La capacidad económica en algunos periodos no alcanza a cubrir intereses y seguros corrientes.";
  }

  return {
    tipo,
    viable: motivoNoViabilidad === null,
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
    periodosCumplen,
    periodosRiesgo,
    periodosIncumplen,
    ratioMaximoObservado,
    ratioPromedio,
  };
}

export function buildTraditionalSchedule(
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[]
): CronogramaCalculado {
  const paramError = validateProductParameters(solicitud, solicitud.productoConfig);
  const n = proyecciones.length;

  // Bisección para encontrar cuota constante que amortiza exactamente el capital a 0
  let low = 0;
  let high = solicitud.montoSolicitado * (1 + solicitud.tea * 2) + 50000;
  for (let iter = 0; iter < 65; iter++) {
    const mid = (low + high) / 2;
    let saldo = solicitud.montoSolicitado;
    for (let i = 0; i < n; i++) {
      const p = proyecciones[i];
      const tep = calcularTasaEfectivaPeriodo(solicitud.tea, p.diasPeriodo);
      const interes = saldo * tep;
      const segDesg = solicitud.productoConfig.desgravamenHabilitado
        ? calcularSeguroSimpleBase360(
            saldo,
            solicitud.productoConfig.tasaAnualDesgravamen,
            p.diasPeriodo
          )
        : 0;
      const segBien =
        solicitud.productoConfig.seguroBienTipo !== "Ninguno"
          ? calcularSeguroSimpleBase360(
              solicitud.productoConfig.valorBienAsegurado,
              solicitud.productoConfig.tasaAnualSeguroBien,
              p.diasPeriodo
            )
          : 0;
      const wf = aplicarPagoWaterfall({
        pagoDisponible: mid,
        saldoCapital: saldo,
        seguroPeriodo: segDesg + segBien,
        interesPeriodo: interes,
      });
      saldo = wf.nuevoSaldoCapital;
    }
    if (saldo > 0.001) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const fixedInstallment = (low + high) / 2;
  const { cuotas } = simulateFixedInstallment(fixedInstallment, solicitud, proyecciones);
  return summarizeSchedule("Tradicional", cuotas, solicitud, paramError);
}

function simulateAdaptiveWithTargetRatio(
  targetRatio: number,
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[],
  maxConcentrationShare: number
): {
  feasibleWithinFactor: boolean;
  finalSaldo: number;
  cuotas: CuotaCronograma[];
} {
  const { montoSolicitado, tea, productoConfig } = solicitud;
  const factorMax = productoConfig.factorMaximoCapacidadPago;
  let saldo = montoSolicitado;
  let seguroPendientePrev = 0;
  let interesPendientePrev = 0;
  const cuotas: CuotaCronograma[] = [];
  let feasibleWithinFactor = true;

  // Límite suave de concentración para evitar amortizar demasiado capital en un único periodo
  const maxAmortPerPeriod = Math.max(
    montoSolicitado / Math.max(1, proyecciones.length),
    montoSolicitado * maxConcentrationShare
  );

  for (let i = 0; i < proyecciones.length; i++) {
    const p = proyecciones[i];
    const tep = calcularTasaEfectivaPeriodo(tea, p.diasPeriodo);
    const interesPeriodo = saldo * tep;
    const seguroDesgravamen = productoConfig.desgravamenHabilitado
      ? calcularSeguroSimpleBase360(saldo, productoConfig.tasaAnualDesgravamen, p.diasPeriodo)
      : 0;
    const seguroBien =
      productoConfig.seguroBienTipo !== "Ninguno"
        ? calcularSeguroSimpleBase360(
            productoConfig.valorBienAsegurado,
            productoConfig.tasaAnualSeguroBien,
            p.diasPeriodo
          )
        : 0;

    const minPagoCorriente =
      seguroDesgravamen + seguroBien + seguroPendientePrev + interesPeriodo + interesPendientePrev;
    const capacidadMax =
      p.utilidadNetaDisponible > 0 ? p.utilidadNetaDisponible * factorMax : 0;

    // Cuota objetivo proporcional a la utilidad del periodo
    const cuotaProporcional =
      p.utilidadNetaDisponible > 0 ? p.utilidadNetaDisponible * targetRatio : 0;

    // Respetar piso de intereses/seguros cuando la capacidad lo permita, y topar por capacidad máxima y concentración
    const maxPagoPorConcentracion = minPagoCorriente + maxAmortPerPeriod;
    const totalParaLiquidar = saldo + minPagoCorriente;

    let cuotaPropuesta = Math.max(cuotaProporcional, Math.min(minPagoCorriente, capacidadMax));
    cuotaPropuesta = Math.min(
      cuotaPropuesta,
      capacidadMax,
      maxPagoPorConcentracion,
      totalParaLiquidar
    );

    if (cuotaPropuesta < minPagoCorriente - 0.01 && saldo > 0.01) {
      feasibleWithinFactor = false;
    }

    const wf = aplicarPagoWaterfall({
      pagoDisponible: cuotaPropuesta,
      saldoCapital: saldo,
      seguroPeriodo: seguroDesgravamen + seguroBien,
      interesPeriodo,
      seguroPendientePrevio: seguroPendientePrev,
      interesPendientePrevio: interesPendientePrev,
    });

    const { ratio, estado } = evaluarEstadoPeriodo(
      cuotaPropuesta,
      p.utilidadNetaDisponible,
      factorMax
    );
    if (estado === "Incumple") {
      feasibleWithinFactor = false;
    }

    cuotas.push({
      numeroCuota: p.periodo,
      etiquetaPeriodo: p.etiquetaPeriodo,
      fechaVencimiento: p.fechaVencimiento,
      diasPeriodo: p.diasPeriodo,
      saldoInicial: round2(saldo),
      tasaEfectivaPeriodo: Number(tep.toFixed(6)),
      amortizacionCapital: round2(wf.capitalAmortizado),
      interesPeriodo: round2(wf.interesPagado),
      seguroDesgravamen: round2(seguroDesgravamen),
      seguroBien: round2(seguroBien),
      segurosTotales: round2(wf.seguroPagado),
      cuotaTotal: round2(cuotaPropuesta),
      saldoFinal: round2(wf.nuevoSaldoCapital),
      utilidadNetaPeriodo: round2(p.utilidadNetaDisponible),
      capacidadMaximaPermitida: round2(capacidadMax),
      ratioCuotaUtilidad: ratio,
      estado,
      seguroPendienteNoCapitalizado: round2(wf.seguroPendienteNoCapitalizado),
      interesPendienteNoCapitalizado: round2(wf.interesPendienteNoCapitalizado),
    });

    saldo = wf.nuevoSaldoCapital;
    seguroPendientePrev = wf.seguroPendienteNoCapitalizado;
    interesPendientePrev = wf.interesPendienteNoCapitalizado;
  }

  return {
    feasibleWithinFactor,
    finalSaldo: saldo + seguroPendientePrev + interesPendientePrev,
    cuotas,
  };
}

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
  const maxConc = proyecciones.length >= 12 ? 0.28 : 0.45;

  // Primero evaluamos en el límite del factor para comprobar si existe solución factible
  let best = simulateAdaptiveWithTargetRatio(factorMax, solicitud, proyecciones, maxConc);
  let chosenConc = maxConc;

  // Si la restricción de concentración impide liquidar en el límite, relajamos gradualmente la concentración
  if (best.finalSaldo > 0.5) {
    const relaxed = simulateAdaptiveWithTargetRatio(factorMax, solicitud, proyecciones, 1.0);
    if (relaxed.finalSaldo <= 0.5) {
      best = relaxed;
      chosenConc = 1.0;
    }
  }

  if (!best.feasibleWithinFactor || best.finalSaldo > 0.5) {
    // No existe cronograma viable que respete la restricción en cada periodo
    const reason =
      best.finalSaldo > 0.5
        ? `Crédito no viable bajo los parámetros actuales: incluso utilizando hasta el ${(factorMax * 100).toFixed(0)}% de la utilidad neta en cada periodo, queda un saldo sin amortizar de S/ ${best.finalSaldo.toFixed(2)}.`
        : `Crédito no viable: la utilidad neta en uno o más periodos es insuficiente para cubrir intereses y seguros dentro del límite de capacidad (${(factorMax * 100).toFixed(0)}%).`;
    return summarizeSchedule("Adaptado", best.cuotas, solicitud, reason);
  }

  // Bisección para hallar la mínima relación r* <= factorMax que liquida el saldo a 0
  // asegurando holgura financiera y un costo razonable
  let low = 0.02;
  let high = factorMax;
  for (let iter = 0; iter < 50; iter++) {
    const mid = (low + high) / 2;
    const attempt = simulateAdaptiveWithTargetRatio(mid, solicitud, proyecciones, chosenConc);
    if (attempt.feasibleWithinFactor && attempt.finalSaldo <= 0.05) {
      high = mid;
      best = attempt;
    } else {
      low = mid;
    }
  }

  // Ajuste fino de centavos en la última cuota activa si quedó residuo <= 0.05
  const finalResult = simulateAdaptiveWithTargetRatio(high, solicitud, proyecciones, chosenConc);
  return summarizeSchedule("Adaptado", finalResult.cuotas, solicitud, null);
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

  let resumenValor = "";
  if (!adaptado.viable && !tradicional.viable) {
    resumenValor =
      "Ninguno de los dos planes resulta viable bajo el monto, plazo, tasa y factor de capacidad configurados.";
  } else if (adaptado.viable && !tradicional.viable) {
    resumenValor = `El plan adaptado elimina ${tradicional.periodosIncumplen} incumplimiento(s) del cronograma tradicional${
      adaptadoEsMasCaro
        ? `, con un costo total adicional de S/ ${diferenciaCostoTotal.toFixed(2)}.`
        : ` y además reduce el costo financiero en S/ ${Math.abs(diferenciaCostoTotal).toFixed(2)}.`
    }`;
  } else if (adaptado.viable && tradicional.viable) {
    resumenValor = adaptadoEsMasCaro
      ? `Ambos planes son viables; el plan adaptado mejora la holgura en meses bajos, aunque implica S/ ${diferenciaCostoTotal.toFixed(2)} adicionales en costo financiero.`
      : `Ambos planes son viables; el plan adaptado logra un ahorro de S/ ${Math.abs(diferenciaCostoTotal).toFixed(2)} al amortizar antes en meses de mayor liquidez.`;
  } else {
    resumenValor =
      "El cronograma tradicional cumple restricciones pero el esquema adaptado no converge con los parámetros actuales.";
  }

  return {
    tradicional,
    adaptado,
    diferenciaCostoTotal,
    diferenciaIntereses,
    diferenciaIncumplimientos,
    adaptadoEsMasCaro,
    resumenValor,
  };
}
