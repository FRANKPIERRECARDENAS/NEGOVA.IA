import {
  AnalisisInput,
  MetodoPredictivoId,
  ProyeccionPeriodo,
  ResultadoPredictivo,
} from "../types/negova";
import {
  getEffectiveSectorActivityCurve,
  MESES_CORTOS,
  ZONAS_GEOGRAFICAS,
} from "./catalogs";

function addDaysIso(startIso: string, daysToAdd: number): string {
  const parts = startIso.split("-").map(Number);
  const d =
    parts.length === 3 && !Number.isNaN(parts[0])
      ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
      : new Date(Date.UTC(2026, 11, 1));
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

function getCalendarMonthAndDays(
  startIso: string,
  accumulatedDaysBefore: number,
  frecuenciaDias: 30 | 45 | 60,
  permitirIrregulares: boolean
): { mesCalendarioIndice: number; diasPeriodo: number } {
  const parts = startIso.split("-").map(Number);
  const startDate =
    parts.length === 3 && !Number.isNaN(parts[0])
      ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
      : new Date(Date.UTC(2026, 11, 1));

  const periodStartDate = new Date(startDate.getTime());
  periodStartDate.setUTCDate(periodStartDate.getUTCDate() + accumulatedDaysBefore);

  if (!permitirIrregulares || frecuenciaDias !== 30) {
    // Mes calendario representativo en el punto medio del periodo
    const midDate = new Date(periodStartDate.getTime());
    midDate.setUTCDate(midDate.getUTCDate() + Math.floor(frecuenciaDias / 2));
    return {
      mesCalendarioIndice: midDate.getUTCMonth(),
      diasPeriodo: frecuenciaDias,
    };
  }

  const year = periodStartDate.getUTCFullYear();
  const month = periodStartDate.getUTCMonth();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const diasPorMes = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return {
    mesCalendarioIndice: month,
    diasPeriodo: diasPorMes[month],
  };
}

function computeHoltDampedSlopeRatio(deseasonalizedSeries: Array<{ t: number; y: number }>): number {
  if (deseasonalizedSeries.length < 6) return 0;
  const sorted = [...deseasonalizedSeries].sort((a, b) => a.t - b.t);
  let level = sorted[0].y;
  let trend = sorted.length >= 2 ? (sorted[1].y - sorted[0].y) / Math.max(1, sorted[1].t - sorted[0].t) : 0;
  const alpha = 0.45;
  const beta = 0.22;
  const phi = 0.85;

  for (let i = 1; i < sorted.length; i++) {
    const dt = Math.max(1, sorted[i].t - sorted[i - 1].t);
    const phiPow = Math.pow(phi, dt);
    const prevLevel = level;
    const prevTrend = trend;
    const y = sorted[i].y;
    level = alpha * y + (1 - alpha) * (prevLevel + phiPow * prevTrend);
    trend = beta * ((level - prevLevel) / dt) + (1 - beta) * (phiPow * prevTrend);
  }
  return trend / Math.max(1, level);
}

export function runPredictiveEngine(input: AnalisisInput): ResultadoPredictivo {
  const { negocio, ventas, costos, capacidad, credito } = input;

  const {
    curve: activitySectorCurve,
    usoCurvaActividad,
    diferenciaMaxPct,
  } = getEffectiveSectorActivityCurve(negocio.sector, negocio.actividadEspecifica);

  const zonaInfo =
    ZONAS_GEOGRAFICAS.find((z) => z.departamento === negocio.departamento) ??
    ZONAS_GEOGRAFICAS[0];
  const zonaCurve = zonaInfo.indiceRegional12Meses;

  const validSales = ventas
    .map((v, idx) => ({ ...v, idx }))
    .filter(
      (v): v is { mesIndice: number; etiquetaMes: string; monto: number; idx: number } =>
        v.monto !== null && Number.isFinite(v.monto) && v.monto > 0
    )
    .sort((a, b) => a.mesIndice - b.mesIndice);

  const mesesDisponiblesCount = validSales.length;
  const usoReferenciaSintetica = mesesDisponiblesCount < 6;

  // Selección adaptativa de método según cantidad y calidad de información disponible
  let metodoSeleccionado: MetodoPredictivoId;
  let justificacionMetodo: string;
  if (mesesDisponiblesCount >= 9) {
    metodoSeleccionado = "Descomposición Híbrida + Holt Amortiguado";
    justificacionMetodo = `Serie histórica amplia (${mesesDisponiblesCount}/12 meses): se combina suavizamiento exponencial Holt con tendencia amortiguada (φ=0.85) y regresión temporal regularizada sobre residuos desestacionalizados.`;
  } else if (mesesDisponiblesCount >= 4) {
    metodoSeleccionado = "Regresión Temporal Regularizada + Estacionalidad Actividad/Zona";
    justificacionMetodo = `Serie histórica intermedia (${mesesDisponiblesCount}/12 meses): se aplica regresión Ridge sobre índices cronológicos reales combinada con patrón estacional específico de actividad y zona.`;
  } else {
    metodoSeleccionado = "Referencia Estacional (Actividad × Zona) Escalada";
    justificacionMetodo = `Historial limitado (${mesesDisponiblesCount}/12 meses): no se inventan ventas faltantes; se escala la curva de referencia ${usoCurvaActividad ? "específica de la actividad" : "sectorial"} y regional reduciendo la confianza estadística.`;
  }

  // Desestacionalización usando curva combinada (Actividad × Sector) × Zona
  const deseasonalizedPoints = validSales.map((v) => {
    const m = ((v.mesIndice % 12) + 12) % 12;
    const refIdx = activitySectorCurve[m] * zonaCurve[m];
    return {
      t: v.mesIndice,
      y: v.monto / Math.max(0.45, refIdx),
    };
  });

  const baseSalesLevel =
    deseasonalizedPoints.length > 0
      ? deseasonalizedPoints.reduce((acc, pt) => acc + pt.y, 0) / deseasonalizedPoints.length
      : Math.max(8000, credito.montoSolicitado * 0.45);

  // Tendencia temporal regularizada usando el índice cronológico REAL t (corrige sesgo de huecos)
  let slopeRatioPerMonth = 0;
  if (deseasonalizedPoints.length >= 4) {
    const n = deseasonalizedPoints.length;
    const meanT = deseasonalizedPoints.reduce((acc, pt) => acc + pt.t, 0) / n;
    const meanY = baseSalesLevel;
    let num = 0;
    let den = 0;
    for (const pt of deseasonalizedPoints) {
      const dt = pt.t - meanT;
      num += dt * (pt.y - meanY);
      den += dt * dt;
    }
    // Regularización Ridge L2 inversamente proporcional a la densidad de puntos
    const ridgeLambda = 8.0 / Math.max(1, n);
    const olsRidgeSlope = den + ridgeLambda > 0 ? num / (den + ridgeLambda) : 0;
    const olsRatio = olsRidgeSlope / Math.max(1, meanY);

    let blendedSlope = olsRatio;
    if (mesesDisponiblesCount >= 9) {
      const holtRatio = computeHoltDampedSlopeRatio(deseasonalizedPoints);
      blendedSlope = 0.55 * olsRatio + 0.45 * holtRatio;
    }
    // Amortiguación conservadora para series microfinancieras cortas
    slopeRatioPerMonth = Math.max(-0.015, Math.min(0.018, blendedSlope * 0.5));
  }

  // Nivel proyectado en el origen real del historial para proyectar hacia adelante
  const meanObservedT =
    deseasonalizedPoints.length > 0
      ? deseasonalizedPoints.reduce((acc, pt) => acc + pt.t, 0) / deseasonalizedPoints.length
      : 11;
  const originT =
    ventas.length > 0
      ? Math.max(...ventas.map((v) => v.mesIndice))
      : 11;

  // Ajuste individual de estacionalidad ponderado por cobertura temporal real
  const pesoIndividual =
    mesesDisponiblesCount >= 9
      ? Math.min(0.75, mesesDisponiblesCount / 15)
      : Math.min(0.6, mesesDisponiblesCount / 16);
  const pesoReferencia = 1 - pesoIndividual;

  const combinedSeasonal12: number[] = [];
  for (let m = 0; m < 12; m++) {
    const refIdx = activitySectorCurve[m] * zonaCurve[m];
    const observedList = validSales.filter((v) => ((v.mesIndice % 12) + 12) % 12 === m);
    if (observedList.length > 0) {
      const obsDeseasonSum = observedList.reduce(
        (acc, obs) =>
          acc +
          obs.monto /
            Math.max(
              0.5,
              baseSalesLevel * Math.pow(1 + slopeRatioPerMonth, obs.mesIndice - meanObservedT)
            ),
        0
      );
      const obsDeseasonTrendAdjusted = obsDeseasonSum / observedList.length;
      combinedSeasonal12.push(
        Number((pesoIndividual * obsDeseasonTrendAdjusted + pesoReferencia * refIdx).toFixed(4))
      );
    } else {
      combinedSeasonal12.push(Number(refIdx.toFixed(4)));
    }
  }

  const meanSeasonal =
    combinedSeasonal12.reduce((a, b) => a + b, 0) / combinedSeasonal12.length;
  const normalizedSeasonal12 = combinedSeasonal12.map((v) => v / Math.max(0.5, meanSeasonal));

  // Estimación de error residual empírico (sigma_res) respecto al ajuste estacional + tendencia
  let sigmaResidualRatio = 0.2;
  let volatilidadPct = 14;
  if (deseasonalizedPoints.length >= 3) {
    let sse = 0;
    let sseBase = 0;
    for (const v of validSales) {
      const m = ((v.mesIndice % 12) + 12) % 12;
      const fitted =
        baseSalesLevel *
        normalizedSeasonal12[m] *
        Math.pow(1 + slopeRatioPerMonth, v.mesIndice - meanObservedT);
      const errRel = (v.monto - fitted) / Math.max(1, fitted);
      sse += errRel * errRel;
      const yDeseas = v.monto / Math.max(0.45, activitySectorCurve[m] * zonaCurve[m]);
      sseBase += Math.pow((yDeseas - baseSalesLevel) / Math.max(1, baseSalesLevel), 2);
    }
    const dof = Math.max(1, mesesDisponiblesCount - (mesesDisponiblesCount >= 4 ? 2 : 1));
    sigmaResidualRatio = Math.max(0.055, Math.min(0.35, Math.sqrt(sse / dof)));
    const cvDeseas = Math.sqrt(sseBase / deseasonalizedPoints.length) * 100;
    volatilidadPct = Number(Math.min(45, Math.max(4, cvDeseas)).toFixed(1));
  } else {
    sigmaResidualRatio = 0.22;
    volatilidadPct = 24;
  }

  // Índice compuesto de respaldo documental y estabilidad (no es probabilidad de aprobación)
  let confianza = 38 + (mesesDisponiblesCount / 12) * 44;
  if (
    negocio.formalidad === "Persona jurídica 100% formal (EE.FF. auditados)" &&
    capacidad.usaEstadosFinancierosAuditados
  ) {
    confianza += 8;
  } else if (negocio.formalidad === "Persona natural con negocio (NRUS / RER)") {
    confianza += 3;
  } else if (negocio.formalidad === "Persona natural sin RUC / informal") {
    confianza -= 5;
  }
  confianza -= Math.max(0, (volatilidadPct - 10) * 0.45);
  const nivelConfianza = Math.round(Math.max(25, Math.min(94, confianza)));

  const esJuridicaFormal =
    negocio.formalidad === "Persona jurídica 100% formal (EE.FF. auditados)";
  const esInformal = negocio.formalidad === "Persona natural sin RUC / informal";

  const startDate = credito.fechaDesembolso || "2026-12-01";
  const totalPeriods = Math.max(
    1,
    Math.round((credito.plazoMeses * 30) / credito.frecuenciaPagoDias)
  );

  // Cuantil normal bilateral 80% (z = 1.2816) con corrección de muestra finita
  const z80 = 1.2816;
  const samplePenalty = Math.sqrt(1 + 1 / Math.max(2, mesesDisponiblesCount));
  const missingInfoExtraSigma = (12 - mesesDisponiblesCount) * 0.008;
  const baseSigmaWithMissing = sigmaResidualRatio + missingInfoExtraSigma;

  let accumulatedDays = 0;
  const proyecciones: ProyeccionPeriodo[] = [];

  const computeNetUtilityForSales = (
    ventasCalc: number,
    mesCalendarioIndice: number,
    factorEscalaPeriodo: number
  ) => {
    const costoMesFactor = costos.costosEstacionalesPorMes[mesCalendarioIndice] ?? 1.0;
    const costosCalc =
      costos.tipoEstructura === "Proporcional al ciclo"
        ? Math.round(ventasCalc * (costos.costoAdquisicionProduccionPct / 100))
        : Math.round(costos.costoAdquisicionMensualFijo * costoMesFactor * factorEscalaPeriodo);

    const gastoOperativo = Math.round(costos.gastosOperativosMensuales * factorEscalaPeriodo);
    // Corrige bug de impuesto fantasma: si es informal o tasaTributariaPct === 0 sin campo explícito, tributos = 0
    const gastoTributario =
      esInformal || costos.tasaTributariaPct <= 0
        ? 0
        : Math.round(ventasCalc * (costos.tasaTributariaPct / 100));

    const gastosOperativosYTributarios = gastoOperativo + gastoTributario;
    const utilidadNetaOperativa = ventasCalc - costosCalc - gastosOperativosYTributarios;

    const otrosIngresosNetos = esJuridicaFormal
      ? 0
      : Math.round(capacidad.otrasFuentesIngresoMensual * factorEscalaPeriodo);
    const obligacionesNegocio = Math.round(
      capacidad.cuotasDeudasNegocioMensual * factorEscalaPeriodo
    );
    const obligacionesPersonalesYFamilia = esJuridicaFormal
      ? 0
      : Math.round(
          (capacidad.cuotasDeudasPersonalesMensual + capacidad.cargaFamiliarMensual) *
            factorEscalaPeriodo
        );
    const obligacionesYCarga = obligacionesNegocio + obligacionesPersonalesYFamilia;

    return {
      costosCalc,
      gastosOperativosYTributarios,
      utilidadNetaOperativa,
      otrosIngresosNetos,
      obligacionesYCarga,
      utilidadNetaDisponible: utilidadNetaOperativa + otrosIngresosNetos - obligacionesYCarga,
    };
  };

  for (let p = 1; p <= totalPeriods; p++) {
    const { mesCalendarioIndice, diasPeriodo } = getCalendarMonthAndDays(
      startDate,
      accumulatedDays,
      credito.frecuenciaPagoDias,
      credito.permitirPeriodosIrregulares
    );
    accumulatedDays += diasPeriodo;
    const fechaVencimiento = addDaysIso(startDate, accumulatedDays);

    const factorEscalaPeriodo = diasPeriodo / 30;
    const indiceEstacional = normalizedSeasonal12[mesCalendarioIndice];
    const horizonMonths = (p * credito.frecuenciaPagoDias) / 30;
    const trendMonthsFromMean = Math.max(0, originT - meanObservedT) + horizonMonths;
    const trendMultiplier = Math.pow(1 + slopeRatioPerMonth, trendMonthsFromMean);

    const ventasEsperadas = Math.max(
      0,
      Math.round(baseSalesLevel * indiceEstacional * trendMultiplier * factorEscalaPeriodo)
    );

    // Intervalo de predicción estadístico del 80% creciente con el horizonte h
    const horizonGrowth = Math.sqrt(1 + 0.032 * horizonMonths);
    const halfWidthRatio = Math.min(
      0.46,
      Math.max(0.08, z80 * baseSigmaWithMissing * samplePenalty * horizonGrowth)
    );

    const ventasRangoInferior = Math.max(0, Math.round(ventasEsperadas * (1 - halfWidthRatio)));
    const ventasRangoSuperior = Math.round(ventasEsperadas * (1 + halfWidthRatio));

    const baseNet = computeNetUtilityForSales(
      ventasEsperadas,
      mesCalendarioIndice,
      factorEscalaPeriodo
    );
    const consNet = computeNetUtilityForSales(
      ventasRangoInferior,
      mesCalendarioIndice,
      factorEscalaPeriodo
    );
    const favNet = computeNetUtilityForSales(
      ventasRangoSuperior,
      mesCalendarioIndice,
      factorEscalaPeriodo
    );

    const clasificacionCapacidad: "Alta" | "Media" | "Baja" =
      indiceEstacional >= 1.07 ? "Alta" : indiceEstacional <= 0.93 ? "Baja" : "Media";

    proyecciones.push({
      periodo: p,
      mesCalendarioIndice,
      etiquetaPeriodo: `${MESES_CORTOS[mesCalendarioIndice]} (C${p})`,
      fechaVencimiento,
      diasPeriodo,
      ventasEsperadas,
      ventasRangoInferior,
      ventasRangoSuperior,
      costosEsperados: baseNet.costosCalc,
      gastosOperativosYTributarios: baseNet.gastosOperativosYTributarios,
      utilidadNetaOperativa: baseNet.utilidadNetaOperativa,
      otrosIngresosNetos: baseNet.otrosIngresosNetos,
      obligacionesYCarga: baseNet.obligacionesYCarga,
      utilidadNetaDisponible: baseNet.utilidadNetaDisponible,
      utilidadConservadora: consNet.utilidadNetaDisponible,
      utilidadFavorable: favNet.utilidadNetaDisponible,
      indiceEstacional: Number(indiceEstacional.toFixed(2)),
      indiceActividadAplicado: Number(activitySectorCurve[mesCalendarioIndice].toFixed(2)),
      clasificacionCapacidad,
    });
  }

  const monthIndexMap = new Map<number, number>();
  for (const p of proyecciones) {
    monthIndexMap.set(p.mesCalendarioIndice, p.utilidadNetaDisponible);
  }
  const sortedMonths = [...monthIndexMap.entries()].sort((a, b) => b[1] - a[1]);
  const mesesMayorCapacidad = sortedMonths
    .slice(0, Math.min(3, sortedMonths.length))
    .map(([m]) => MESES_CORTOS[m]);
  const mesesMenorCapacidad = sortedMonths
    .slice(-Math.min(3, sortedMonths.length))
    .reverse()
    .map(([m]) => MESES_CORTOS[m]);

  const tendencia: "Creciente" | "Estable" | "Decreciente" =
    slopeRatioPerMonth > 0.002
      ? "Creciente"
      : slopeRatioPerMonth < -0.002
      ? "Decreciente"
      : "Estable";

  const nP = Math.max(1, proyecciones.length);
  const utilidadNetaPromedio = Math.round(
    proyecciones.reduce((acc, p) => acc + p.utilidadNetaDisponible, 0) / nP
  );
  const utilidadConservadoraPromedio = Math.round(
    proyecciones.reduce((acc, p) => acc + p.utilidadConservadora, 0) / nP
  );
  const utilidadFavorablePromedio = Math.round(
    proyecciones.reduce((acc, p) => acc + p.utilidadFavorable, 0) / nP
  );
  const ventasTotalesProyectadas = proyecciones.reduce(
    (acc, p) => acc + p.ventasEsperadas,
    0
  );

  const factoresExplicativos: string[] = [
    `Método predictivo seleccionado: ${metodoSeleccionado} (peso historial individual ${(pesoIndividual * 100).toFixed(0)}%, referencia actividad/zona ${(pesoReferencia * 100).toFixed(0)}%).`,
    `Estacionalidad diferenciada de "${negocio.actividadEspecifica}" (${negocio.sector})${usoCurvaActividad ? ` con ajuste específico de actividad respecto al sector (hasta ${diferenciaMaxPct}% de variación estacional).` : "."}`,
    `Dinámica regional de ${negocio.provincia}, ${negocio.departamento}: ${zonaInfo.descripcionEconomica}`,
    esJuridicaFormal
      ? "Evaluación corporativa formal: se aíslan las obligaciones y flujos del negocio sin mezclar carga familiar personal."
      : "Evaluación de negocio familiar/persona natural: se integran otras fuentes de ingreso, deudas vigentes y carga familiar.",
    `Estructura de costos (${costos.tipoEstructura.toLowerCase()}) con dispersión residual empírica σ=${(sigmaResidualRatio * 100).toFixed(1)}% y volatilidad de ${volatilidadPct}%.`,
  ];

  const advertenciasDatos: string[] = [];
  if (mesesDisponiblesCount < 12) {
    advertenciasDatos.push(
      `Se registraron ${mesesDisponiblesCount} de 12 meses de ventas históricas. Los meses faltantes no fueron inventados; se ponderaron referencias sintéticas de actividad y zona, ampliando el intervalo estadístico de incertidumbre.`
    );
  }
  if (esInformal) {
    advertenciasDatos.push(
      "Negocio sin RUC formalizado: mayor incertidumbre documental en la verificación de ingresos y costos (impuestos directos = S/ 0)."
    );
  }
  if (proyecciones.some((p) => p.utilidadNetaDisponible <= 0)) {
    advertenciasDatos.push(
      "Existen periodos proyectados con utilidad neta disponible nula o negativa; el optimizador restringirá la cuota a S/ 0 en dichos tramos."
    );
  }

  return {
    proyecciones,
    tendencia,
    pendienteMensualPct: Number((slopeRatioPerMonth * 100).toFixed(2)),
    volatilidadPct,
    nivelConfianza,
    mesesDisponiblesCount,
    usoReferenciaSintetica,
    mesesMayorCapacidad,
    mesesMenorCapacidad,
    utilidadNetaPromedio,
    utilidadConservadoraPromedio,
    utilidadFavorablePromedio,
    ventasTotalesProyectadas,
    factoresExplicativos,
    advertenciasDatos,
    trazabilidad: {
      metodoSeleccionado,
      justificacionMetodo,
      pesoHistorialIndividual: Number(pesoIndividual.toFixed(2)),
      pesoReferenciaSectorActividadZona: Number(pesoReferencia.toFixed(2)),
      sigmaResidualPct: Number((sigmaResidualRatio * 100).toFixed(1)),
      factorIncertidumbreBase: Number((baseSigmaWithMissing * z80 * samplePenalty * 100).toFixed(1)),
      diferenciaActividadVsSectorPct: diferenciaMaxPct,
      procedenciaDatos: input.esSintetico
        ? `Perfil sintético reproducible (${input.idCaso}) + curvas de referencia sector/actividad/zona.`
        : "Datos registrados manualmente en sesión + curvas de referencia sector/actividad/zona.",
      supuestosAplicados: [
        `Intervalo predictivo al 80% bilateral (z=1.2816) escalado por raíz del horizonte y grados de libertad (n=${mesesDisponiblesCount}).`,
        `Tendencia OLS regularizada sobre índice cronológico real (λ=${(8 / Math.max(1, mesesDisponiblesCount)).toFixed(2)}) con amortiguación conservadora.`,
        esJuridicaFormal
          ? "Régimen formal corporativo: carga familiar y deudas personales excluidas."
          : "Régimen persona natural / parcialmente formal: carga familiar y deudas personales incluidas.",
      ],
      avisoNoGarantia:
        "Toda proyección representa una estimación estadística condicionada al historial disponible; no constituye garantía de ventas futuras.",
    },
  };
}
