import {
  CronogramaCalculado,
  ProyeccionPeriodo,
  ReglaValidacionIndependiente,
  ResultadoValidacionIndependiente,
  SolicitudCredito,
} from "../types/negova";

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Validador independiente del optimizador financiero.
 * Reconstruye cada periodo desde cero en aritmética entera de centavos
 * sin compartir variables ni suposiciones con el algoritmo generador.
 */
export function validateScheduleIndependently(
  cronograma: Pick<CronogramaCalculado, "tipo" | "viable" | "cuotas">,
  solicitud: SolicitudCredito,
  proyecciones: ProyeccionPeriodo[]
): ResultadoValidacionIndependiente {
  const errores: string[] = [];
  const cfg = solicitud.productoConfig;

  // 1. Validación contractual independiente
  const reglasContractualesOk =
    solicitud.montoSolicitado > 0 &&
    cfg.factorMaximoCapacidadPago > 0 &&
    cfg.factorMaximoCapacidadPago < 1 &&
    solicitud.tea >= cfg.teaMinima &&
    solicitud.tea <= cfg.teaMaximaBCRP &&
    solicitud.plazoMeses >= cfg.plazoMinimoMeses &&
    solicitud.plazoMeses <= cfg.plazoMaximoMeses &&
    (!cfg.esHipotecario || cfg.seguroBienTipo === "Vivienda");

  if (!reglasContractualesOk) {
    errores.push("Incumplimiento de parámetros contractuales o regulatorios (BCRP / plazo / factor / seguro hipotecario).");
  }

  if (cronograma.cuotas.length !== proyecciones.length || cronograma.cuotas.length === 0) {
    errores.push("Cantidad de cuotas no coincide con los periodos proyectados.");
  }

  let expectedSaldoCents = toCents(solicitud.montoSolicitado);
  let seguroPendienteCents = 0;
  let interesPendienteCents = 0;
  let maxDesviacionCentavos = 0;
  let totalCapitalCents = 0;

  let saldoNoNegativoOk = true;
  let amortizacionValidaOk = true;
  let interesesYSegurosCoherentesOk = true;
  let capacidadPeriodoOk = true;

  const n = Math.min(cronograma.cuotas.length, proyecciones.length);
  for (let i = 0; i < n; i++) {
    const c = cronograma.cuotas[i];
    const p = proyecciones[i];

    const cSaldoIniCents = toCents(c.saldoInicial);
    const cAmortCents = toCents(c.amortizacionCapital);
    const cIntCents = toCents(c.interesPeriodo);
    const cSegCents = toCents(c.segurosTotales);
    const cCuotaCents = toCents(c.cuotaTotal);
    const cSaldoFinCents = toCents(c.saldoFinal);

    // Verificar encadenamiento de saldo inicial
    const diffIni = Math.abs(cSaldoIniCents - expectedSaldoCents);
    maxDesviacionCentavos = Math.max(maxDesviacionCentavos, diffIni);
    if (diffIni > 3) {
      errores.push(`Periodo ${c.numeroCuota}: saldo inicial (${c.saldoInicial}) no encadena con periodo previo (${fromCents(expectedSaldoCents)}).`);
      saldoNoNegativoOk = false;
    }

    if (cSaldoIniCents < 0 || cSaldoFinCents < 0) {
      saldoNoNegativoOk = false;
      errores.push(`Periodo ${c.numeroCuota}: saldo negativo detectado.`);
    }

    if (cAmortCents < 0 || cAmortCents > cSaldoIniCents + 2) {
      amortizacionValidaOk = false;
      errores.push(`Periodo ${c.numeroCuota}: amortización (${c.amortizacionCapital}) supera el capital pendiente (${c.saldoInicial}).`);
    }

    // Recalcular TEP, interés y seguros Base 360 desde cero
    const tep = Math.pow(1 + solicitud.tea, p.diasPeriodo / 360) - 1;
    const expectedIntCents = Math.round(expectedSaldoCents * tep);
    const expectedDesgCents = cfg.desgravamenHabilitado
      ? Math.round(expectedSaldoCents * cfg.tasaAnualDesgravamen * (p.diasPeriodo / 360))
      : 0;
    const expectedBienCents =
      cfg.seguroBienTipo !== "Ninguno" && cfg.valorBienAsegurado > 0 && cfg.tasaAnualSeguroBien > 0
        ? Math.round(toCents(cfg.valorBienAsegurado) * cfg.tasaAnualSeguroBien * (p.diasPeriodo / 360))
        : 0;

    // Verificar prelación waterfall independiente sobre cCuotaCents
    let rem = Math.max(0, cCuotaCents);
    const totalSegReq = expectedDesgCents + expectedBienCents + seguroPendienteCents;
    const segPaid = Math.min(rem, totalSegReq);
    rem -= segPaid;
    seguroPendienteCents = Math.max(0, totalSegReq - segPaid);

    const totalIntReq = expectedIntCents + interesPendienteCents;
    const intPaid = Math.min(rem, totalIntReq);
    rem -= intPaid;
    interesPendienteCents = Math.max(0, totalIntReq - intPaid);

    const capPaid = Math.min(rem, expectedSaldoCents);
    const nextSaldoCents = Math.max(0, expectedSaldoCents - capPaid);

    const diffInt = Math.abs(cIntCents - intPaid);
    const diffSeg = Math.abs(cSegCents - segPaid);
    const diffAmort = Math.abs(cAmortCents - capPaid);
    const diffFin = Math.abs(cSaldoFinCents - nextSaldoCents);

    maxDesviacionCentavos = Math.max(maxDesviacionCentavos, diffInt, diffSeg, diffAmort, diffFin);

    if (diffInt > 3 || diffSeg > 3) {
      interesesYSegurosCoherentesOk = false;
      errores.push(
        `Periodo ${c.numeroCuota}: discrepancia en intereses/seguros (esperado Int=${fromCents(intPaid)}, Seg=${fromCents(segPaid)}; reportado Int=${c.interesPeriodo}, Seg=${c.segurosTotales}).`
      );
    }

    if (diffAmort > 3 || diffFin > 3) {
      amortizacionValidaOk = false;
      errores.push(
        `Periodo ${c.numeroCuota}: discrepancia en amortización/saldo final (esperado Saldo=${fromCents(nextSaldoCents)}; reportado Saldo=${c.saldoFinal}).`
      );
    }

    // Verificar capacidad de pago periodo a periodo cuando el cronograma se declara viable
    const capMaxCents =
      p.utilidadNetaDisponible > 0
        ? Math.floor(p.utilidadNetaDisponible * cfg.factorMaximoCapacidadPago * 100 + 1e-6)
        : 0;
    if (cronograma.viable && cCuotaCents > capMaxCents + 2) {
      capacidadPeriodoOk = false;
      errores.push(
        `Periodo ${c.numeroCuota}: cuota S/ ${c.cuotaTotal.toFixed(2)} excede capacidad máxima permitida S/ ${fromCents(capMaxCents).toFixed(2)}.`
      );
    }
    if (cronograma.viable && p.utilidadNetaDisponible <= 0 && cCuotaCents > 1) {
      capacidadPeriodoOk = false;
      errores.push(
        `Periodo ${c.numeroCuota}: se asignó cuota S/ ${c.cuotaTotal.toFixed(2)} con utilidad neta nula o negativa.`
      );
    }

    totalCapitalCents += capPaid;
    expectedSaldoCents = nextSaldoCents;
  }

  const saldoFinalVerificado = fromCents(expectedSaldoCents);
  const cierreCeroOk = !cronograma.viable || (expectedSaldoCents <= 2 && seguroPendienteCents <= 2 && interesPendienteCents <= 2);

  if (cronograma.viable && !cierreCeroOk) {
    errores.push(
      `Saldo final verificado (${saldoFinalVerificado.toFixed(2)}) o mora pendiente supera tolerancia monetaria de S/ 0.02.`
    );
  }

  const reglasVerificadas: ReglaValidacionIndependiente[] = [
    {
      codigo: "V1-CONTRACTUAL",
      nombre: "Parámetros regulatorios y contractuales (BCRP / plazo / seguros)",
      aprobada: reglasContractualesOk,
      detalle: reglasContractualesOk
        ? `TEA ${(solicitud.tea * 100).toFixed(2)}% ≤ tope ${(cfg.teaMaximaBCRP * 100).toFixed(1)}%, plazo ${solicitud.plazoMeses}m válido.`
        : "Violación de rango contractual o tope BCRP.",
    },
    {
      codigo: "V2-SALDOS",
      nombre: "Saldos no negativos y amortización acotada",
      aprobada: saldoNoNegativoOk && amortizacionValidaOk,
      detalle:
        saldoNoNegativoOk && amortizacionValidaOk
          ? `Encadenamiento exacto verificado (desviación máx. ${maxDesviacionCentavos} ctvs).`
          : "Se detectaron discrepancias en saldos o amortizaciones.",
    },
    {
      codigo: "V3-BASE360",
      nombre: "Coherencia Base 360 (intereses, seguros y prelación sin capitalización)",
      aprobada: interesesYSegurosCoherentesOk,
      detalle: interesesYSegurosCoherentesOk
        ? "Prelación Seguros → Intereses → Capital reconstruida sin capitalización."
        : "Discrepancia en intereses o seguros reconstruidos.",
    },
    {
      codigo: "V4-CAPACIDAD",
      nombre: "Restricción Cuota / Utilidad ≤ Factor en todos los periodos",
      aprobada: cronograma.viable ? capacidadPeriodoOk : true,
      detalle: cronograma.viable
        ? capacidadPeriodoOk
          ? `Todos los ${n} periodos cumplen el techo ≤ ${(cfg.factorMaximoCapacidadPago * 100).toFixed(0)}%.`
          : "Uno o más periodos violaron la restricción de capacidad."
        : "Cronograma declarado correctamente como no viable.",
    },
    {
      codigo: "V5-CIERRE",
      nombre: "Liquidación exacta a S/ 0.00 en tolerancia monetaria",
      aprobada: cierreCeroOk,
      detalle: cronograma.viable
        ? `Saldo final verificado: S/ ${saldoFinalVerificado.toFixed(2)}.`
        : `No liquidado por inviabilidad (saldo final S/ ${saldoFinalVerificado.toFixed(2)}).`,
    },
  ];

  return {
    valido: errores.length === 0,
    errores,
    maxDesviacionCentavos,
    saldoFinalVerificado,
    totalCapitalVerificado: fromCents(totalCapitalCents),
    reglasVerificadas,
  };
}
