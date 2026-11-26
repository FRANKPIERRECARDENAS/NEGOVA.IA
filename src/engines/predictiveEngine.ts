import {
  AnalisisInput,
  ProyeccionPeriodo,
  ResultadoPredictivo,
} from "../types/negova";
import {
  INDICE_ESTACIONAL_SECTOR,
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

function getPeriodoDias(
  mesCalendarioIdx: number,
  frecuenciaDias: 30 | 45 | 60,
  permitirIrregulares: boolean
): number {
  if (!permitirIrregulares || frecuenciaDias !== 30) {
    return frecuenciaDias;
  }
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return diasPorMes[((mesCalendarioIdx % 12) + 12) % 12];
}

export function runPredictiveEngine(input: AnalisisInput): ResultadoPredictivo {
  const { negocio, ventas, costos, capacidad, credito } = input;

  const sectorCurve = INDICE_ESTACIONAL_SECTOR[negocio.sector];
  const zonaInfo =
    ZONAS_GEOGRAFICAS.find((z) => z.departamento === negocio.departamento) ??
    ZONAS_GEOGRAFICAS[0];
  const zonaCurve = zonaInfo.indiceRegional12Meses;

  const validSales = ventas
    .map((v, idx) => ({ ...v, idx }))
    .filter((v): v is { mesIndice: number; etiquetaMes: string; monto: number; idx: number } =>
      v.monto !== null && Number.isFinite(v.monto) && v.monto > 0
    );

  const mesesDisponiblesCount = validSales.length;
  const usoReferenciaSintetica = mesesDisponiblesCount < 6;

  // Nivel base de ventas: si hay datos válidos, desestacionalizar con índice combinado sector*zona
  const deseasonalizedValues = validSales.map((v) => {
    const refIdx = sectorCurve[v.mesIndice % 12] * zonaCurve[v.mesIndice % 12];
    return v.monto / Math.max(0.5, refIdx);
  });

  const baseSalesLevel =
    deseasonalizedValues.length > 0
      ? deseasonalizedValues.reduce((acc, val) => acc + val, 0) /
        deseasonalizedValues.length
      : Math.max(8000, credito.montoSolicitado * 0.45);

  // Tendencia lineal amortiguada sobre valores desestacionalizados (si hay >= 4 meses)
  let slopeRatioPerMonth = 0;
  if (deseasonalizedValues.length >= 4) {
    const n = deseasonalizedValues.length;
    const meanX = (n - 1) / 2;
    const meanY = baseSalesLevel;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const dx = i - meanX;
      num += dx * (deseasonalizedValues[i] - meanY);
      den += dx * dx;
    }
    const rawSlope = den > 0 ? num / den : 0;
    // Amortiguación conservadora para evitar extrapolaciones agresivas
    slopeRatioPerMonth = Math.max(-0.015, Math.min(0.018, (rawSlope / Math.max(1, meanY)) * 0.45));
  }

  // Ajuste individual de estacionalidad: mezcla entre índice observado individual y patrón sector*zona
  const pesoIndividual = Math.min(0.7, mesesDisponiblesCount / 16);
  const pesoReferencia = 1 - pesoIndividual;

  const combinedSeasonal12: number[] = [];
  for (let m = 0; m < 12; m++) {
    const refIdx = sectorCurve[m] * zonaCurve[m];
    const observed = ventas.find((v) => v.mesIndice % 12 === m && v.monto !== null && v.monto > 0);
    if (observed && observed.monto !== null) {
      const obsIdx = observed.monto / Math.max(1, baseSalesLevel);
      combinedSeasonal12.push(
        Number((pesoIndividual * obsIdx + pesoReferencia * refIdx).toFixed(4))
      );
    } else {
      combinedSeasonal12.push(Number(refIdx.toFixed(4)));
    }
  }

  // Normalizar índices estacionales para promedio 1.0
  const meanSeasonal =
    combinedSeasonal12.reduce((a, b) => a + b, 0) / combinedSeasonal12.length;
  const normalizedSeasonal12 = combinedSeasonal12.map((v) => v / Math.max(0.5, meanSeasonal));

  // Volatilidad histórica (coeficiente de variación de residuos desestacionalizados)
  let volatilidadPct = 12;
  if (deseasonalizedValues.length >= 3) {
    const mean = baseSalesLevel;
    const variance =
      deseasonalizedValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
      deseasonalizedValues.length;
    const std = Math.sqrt(variance);
    volatilidadPct = Number(
      Math.min(45, Math.max(4, (std / Math.max(1, mean)) * 100)).toFixed(1)
    );
  } else {
    volatilidadPct = 24;
  }

  // Nivel de confianza depende de cantidad de meses reales, formalidad y volatilidad
  let confianza = 38 + (mesesDisponiblesCount / 12) * 44;
  if (negocio.formalidad === "Persona jurídica 100% formal (EE.FF. auditados)" && capacidad.usaEstadosFinancierosAuditados) {
    confianza += 8;
  } else if (negocio.formalidad === "Persona natural con negocio (NRUS / RER)") {
    confianza += 3;
  } else if (negocio.formalidad === "Persona natural sin RUC / informal") {
    confianza -= 5;
  }
  confianza -= Math.max(0, (volatilidadPct - 10) * 0.45);
  const nivelConfianza = Math.round(Math.max(25, Math.min(94, confianza)));

  // Reglas de entidad jurídica vs persona natural
  const esJuridicaFormal =
    negocio.formalidad === "Persona jurídica 100% formal (EE.FF. auditados)";

  const startDate = credito.fechaDesembolso || "2026-12-01";
  const startMonth = Math.max(0, Math.min(11, Number(startDate.split("-")[1] || 12) - 1));

  const totalPeriods = Math.max(
    1,
    Math.round((credito.plazoMeses * 30) / credito.frecuenciaPagoDias)
  );

  let accumulatedDays = 0;
  const proyecciones: ProyeccionPeriodo[] = [];

  for (let p = 1; p <= totalPeriods; p++) {
    const monthOffset = Math.round(((p - 1) * credito.frecuenciaPagoDias) / 30);
    const mesCalendarioIndice = (startMonth + monthOffset) % 12;
    const diasPeriodo = getPeriodoDias(
      mesCalendarioIndice,
      credito.frecuenciaPagoDias,
      credito.permitirPeriodosIrregulares
    );
    accumulatedDays += diasPeriodo;
    const fechaVencimiento = addDaysIso(startDate, accumulatedDays);

    const factorEscalaPeriodo = diasPeriodo / 30;
    const indiceEstacional = normalizedSeasonal12[mesCalendarioIndice];
    const trendMultiplier = Math.pow(1 + slopeRatioPerMonth, p * (credito.frecuenciaPagoDias / 30));

    const ventasEsperadas = Math.max(
      0,
      Math.round(baseSalesLevel * indiceEstacional * trendMultiplier * factorEscalaPeriodo)
    );

    const margenIncertidumbre = Math.min(
      0.42,
      Math.max(0.08, (100 - nivelConfianza) / 170 + (volatilidadPct / 100) * 0.55)
    );
    const ventasRangoInferior = Math.max(
      0,
      Math.round(ventasEsperadas * (1 - margenIncertidumbre))
    );
    const ventasRangoSuperior = Math.round(ventasEsperadas * (1 + margenIncertidumbre));

    // Costos de adquisición / producción
    const costoMesFactor =
      costos.costosEstacionalesPorMes[mesCalendarioIndice] ?? 1.0;
    let costosEsperados = 0;
    if (costos.tipoEstructura === "Proporcional al ciclo") {
      costosEsperados = Math.round(
        ventasEsperadas * (costos.costoAdquisicionProduccionPct / 100)
      );
    } else {
      costosEsperados = Math.round(
        costos.costoAdquisicionMensualFijo * costoMesFactor * factorEscalaPeriodo
      );
    }

    // Gastos operativos y tributarios
    const gastoOperativo = Math.round(costos.gastosOperativosMensuales * factorEscalaPeriodo);
    const gastoTributario =
      costos.tasaTributariaPct > 0
        ? Math.round(ventasEsperadas * (costos.tasaTributariaPct / 100))
        : Math.round(costos.gastosTributariosMensuales * factorEscalaPeriodo);

    const gastosOperativosYTributarios = gastoOperativo + gastoTributario;
    const utilidadNetaOperativa =
      ventasEsperadas - costosEsperados - gastosOperativosYTributarios;

    // Capacidad económica diferenciada: persona jurídica 100% formal no mezcla carga familiar ni deudas personales
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

    const utilidadNetaDisponible =
      utilidadNetaOperativa + otrosIngresosNetos - obligacionesYCarga;

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
      costosEsperados,
      gastosOperativosYTributarios,
      utilidadNetaOperativa,
      otrosIngresosNetos,
      obligacionesYCarga,
      utilidadNetaDisponible,
      indiceEstacional: Number(indiceEstacional.toFixed(2)),
      clasificacionCapacidad,
    });
  }

  // Identificar meses calendario únicos de mayor y menor capacidad
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

  const utilidadNetaPromedio = Math.round(
    proyecciones.reduce((acc, p) => acc + p.utilidadNetaDisponible, 0) /
      Math.max(1, proyecciones.length)
  );
  const ventasTotalesProyectadas = proyecciones.reduce(
    (acc, p) => acc + p.ventasEsperadas,
    0
  );

  const factoresExplicativos: string[] = [
    `Estacionalidad del sector ${negocio.sector} (${negocio.tipoOperacion.toLowerCase()}) combinada con el ajuste histórico individual del negocio.`,
    `Dinámica geográfica de ${negocio.provincia}, ${negocio.departamento}: ${zonaInfo.descripcionEconomica}`,
    esJuridicaFormal
      ? "Evaluación corporativa formal: se aíslan las obligaciones y flujos del negocio sin mezclar carga familiar personal."
      : "Evaluación de negocio familiar/persona natural: se integran otras fuentes de ingreso, deudas vigentes y carga familiar.",
    `Estructura de costos (${costos.tipoEstructura.toLowerCase()}) con volatilidad histórica estimada de ${volatilidadPct}%.`,
  ];

  const advertenciasDatos: string[] = [];
  if (mesesDisponiblesCount < 12) {
    advertenciasDatos.push(
      `Se registraron ${mesesDisponiblesCount} de 12 meses de ventas históricas. Los meses faltantes no fueron inventados; se ponderaron referencias sintéticas del sector y zona, reduciendo el nivel de confianza a ${nivelConfianza}%.`
    );
  }
  if (negocio.formalidad === "Persona natural sin RUC / informal") {
    advertenciasDatos.push(
      "Negocio sin RUC formalizado: mayor incertidumbre documental en la verificación de ingresos y costos."
    );
  }
  if (proyecciones.some((p) => p.utilidadNetaDisponible <= 0)) {
    advertenciasDatos.push(
      "Existen periodos proyectados con utilidad neta disponible nula o negativa; el optimizador restringirá la amortización en esos tramos."
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
    ventasTotalesProyectadas,
    factoresExplicativos,
    advertenciasDatos,
  };
}
