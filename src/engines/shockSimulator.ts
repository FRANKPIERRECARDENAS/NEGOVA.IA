import {
  AnalisisInput,
  ParametrosFenomeno,
  ResultadoPredictivo,
  ResultadoSimulacionExterna,
  TipoFenomenoExterno,
  IntensidadFenomeno,
} from "../types/negova";
import { ZONAS_GEOGRAFICAS } from "./catalogs";
import { compareSchedules } from "./financialEngine";
import { runPredictiveEngine } from "./predictiveEngine";

interface ShockConfig {
  salesDropBase: number; // caída % base
  costIncreaseBase: number; // incremento % base sobre costos
  affectedMonths: number[]; // índices calendario 0..11 más afectados
  climateMultiplierSensitivity: boolean;
}

const SHOCK_MATRIX: Record<TipoFenomenoExterno, ShockConfig> = {
  "Fenómeno El Niño": {
    salesDropBase: 0.24,
    costIncreaseBase: 0.14,
    affectedMonths: [0, 1, 2, 3, 11],
    climateMultiplierSensitivity: true,
  },
  Inundaciones: {
    salesDropBase: 0.28,
    costIncreaseBase: 0.16,
    affectedMonths: [1, 2, 3],
    climateMultiplierSensitivity: true,
  },
  Sequías: {
    salesDropBase: 0.22,
    costIncreaseBase: 0.18,
    affectedMonths: [5, 6, 7, 8, 9],
    climateMultiplierSensitivity: true,
  },
  "Retraso de campañas": {
    salesDropBase: 0.18,
    costIncreaseBase: 0.06,
    affectedMonths: [2, 4, 5, 6],
    climateMultiplierSensitivity: false,
  },
  "Caída extraordinaria de ventas": {
    salesDropBase: 0.22,
    costIncreaseBase: 0.03,
    affectedMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    climateMultiplierSensitivity: false,
  },
  "Incremento de costos": {
    salesDropBase: 0.05,
    costIncreaseBase: 0.22,
    affectedMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    climateMultiplierSensitivity: false,
  },
};

const INTENSITY_MULTIPLIER: Record<IntensidadFenomeno, number> = {
  Moderado: 0.75,
  Severo: 1.15,
  Extremo: 1.55,
};

export function runExternalShockSimulation(
  input: AnalisisInput,
  baselinePredictive: ResultadoPredictivo,
  parametros: ParametrosFenomeno
): ResultadoSimulacionExterna {
  const cfg = SHOCK_MATRIX[parametros.fenomeno];
  const mult = INTENSITY_MULTIPLIER[parametros.intensidad];

  const resolvedParams: Required<ParametrosFenomeno> = {
    fenomeno: parametros.fenomeno,
    intensidad: parametros.intensidad,
    mesInicioPeriodo: Math.max(
      1,
      Math.min(baselinePredictive.proyecciones.length, parametros.mesInicioPeriodo ?? 1)
    ),
    duracionMeses: Math.max(1, Math.min(24, parametros.duracionMeses ?? 4)),
    magnitudAdicionalPct: Math.max(-20, Math.min(30, parametros.magnitudAdicionalPct ?? 0)),
    modoEvaluacion: parametros.modoEvaluacion ?? "preventivo",
  };

  // Acoplamiento explícito al factor de riesgo climático de la zona geográfica
  const zonaInfo = ZONAS_GEOGRAFICAS.find(
    (z) => z.departamento === input.negocio.departamento
  );
  const zonaClimateRaw = zonaInfo?.factorRiesgoClimatico ?? 0.5;
  const factorGeograficoAplicado = cfg.climateMultiplierSensitivity
    ? Number((0.75 + zonaClimateRaw * 0.55).toFixed(2))
    : 1.0;

  let sensibilidadSectorialAplicada = 1.0;
  if (cfg.climateMultiplierSensitivity) {
    if (
      input.negocio.sector === "Agrícola y pecuario" ||
      input.negocio.sector === "Gastronomía y turismo"
    ) {
      sensibilidadSectorialAplicada = 1.25;
    } else if (input.negocio.sector === "Servicios técnicos y transporte") {
      sensibilidadSectorialAplicada = 0.78;
    }
  }

  const extraFactor = Math.max(0.35, 1 + resolvedParams.magnitudAdicionalPct / 100);
  const windowStart = resolvedParams.mesInicioPeriodo;
  const windowEnd = windowStart + resolvedParams.duracionMeses - 1;

  const esInformal = input.negocio.formalidad === "Persona natural sin RUC / informal";

  const proyeccionesEstresadas = baselinePredictive.proyecciones.map((p) => {
    const insideWindow = p.periodo >= windowStart && p.periodo <= windowEnd;
    const isPeakCalendarMonth = cfg.affectedMonths.includes(p.mesCalendarioIndice);

    // Impacto fuerte dentro de la ventana del choque; rezago amortiguado después de la ventana si fue severo
    let localFactor = 0;
    if (insideWindow) {
      localFactor = isPeakCalendarMonth ? 1.0 : 0.65;
    } else if (p.periodo > windowEnd && p.periodo <= windowEnd + 2) {
      localFactor = 0.25; // rezago de recuperación post-evento
    }

    const dropPct = Math.min(
      0.72,
      cfg.salesDropBase *
        mult *
        sensibilidadSectorialAplicada *
        factorGeograficoAplicado *
        extraFactor *
        localFactor
    );
    const costIncPct = Math.min(
      0.6,
      cfg.costIncreaseBase *
        mult *
        sensibilidadSectorialAplicada *
        factorGeograficoAplicado *
        extraFactor *
        localFactor
    );

    const ventasEstresadas = Math.max(0, Math.round(p.ventasEsperadas * (1 - dropPct)));
    // En un choque externo sobrevenido o estacional, los insumos/campañas ya comprometidos no se reducen
    // linealmente con la caída de ventas y además sufren sobrecostos logísticos o de reposición.
    const costosEstresados = Math.round(p.costosEsperados * (1 + costIncPct));

    // Recalcular tributos proporcionalmente si aplica (sin impuesto fantasma)
    const gastoOperativo = Math.round(
      input.costos.gastosOperativosMensuales * (p.diasPeriodo / 30)
    );
    const gastoTributario =
      esInformal || input.costos.tasaTributariaPct <= 0
        ? 0
        : Math.round(ventasEstresadas * (input.costos.tasaTributariaPct / 100));
    const gastosOpYTrib = gastoOperativo + gastoTributario;

    const utilidadOp = ventasEstresadas - costosEstresados - gastosOpYTrib;
    const utilidadDisponible =
      utilidadOp + p.otrosIngresosNetos - p.obligacionesYCarga;

    const halfWidthEstres = Math.max(
      0.1,
      (p.ventasRangoSuperior - p.ventasRangoInferior) / Math.max(2, p.ventasEsperadas * 2)
    );
    const ventasRangoInferior = Math.max(
      0,
      Math.round(ventasEstresadas * (1 - halfWidthEstres))
    );
    const ventasRangoSuperior = Math.round(ventasEstresadas * (1 + halfWidthEstres));
    const utilidadConservadora =
      p.utilidadNetaDisponible -
      (p.ventasEsperadas - ventasRangoInferior) +
      (utilidadDisponible - p.utilidadNetaDisponible);
    const utilidadFavorable =
      utilidadDisponible + Math.round((ventasRangoSuperior - ventasEstresadas) * 0.55);

    return {
      ...p,
      ventasEsperadas: ventasEstresadas,
      ventasRangoInferior,
      ventasRangoSuperior,
      costosEsperados: costosEstresados,
      gastosOperativosYTributarios: gastosOpYTrib,
      utilidadNetaOperativa: utilidadOp,
      utilidadNetaDisponible: utilidadDisponible,
      utilidadConservadora: Math.round(utilidadConservadora),
      utilidadFavorable: Math.round(utilidadFavorable),
      clasificacionCapacidad: (utilidadDisponible <
      baselinePredictive.utilidadNetaPromedio * 0.7
        ? "Baja"
        : p.clasificacionCapacidad) as "Alta" | "Media" | "Baja",
    };
  });

  const baseSalesSum = baselinePredictive.proyecciones.reduce(
    (a, b) => a + b.ventasEsperadas,
    0
  );
  const stressSalesSum = proyeccionesEstresadas.reduce(
    (a, b) => a + b.ventasEsperadas,
    0
  );
  const baseCostSum = baselinePredictive.proyecciones.reduce(
    (a, b) => a + b.costosEsperados,
    0
  );
  const stressCostSum = proyeccionesEstresadas.reduce(
    (a, b) => a + b.costosEsperados,
    0
  );
  const baseUtilSum = baselinePredictive.proyecciones.reduce(
    (a, b) => a + b.utilidadNetaDisponible,
    0
  );
  const stressUtilSum = proyeccionesEstresadas.reduce(
    (a, b) => a + b.utilidadNetaDisponible,
    0
  );

  const impactoVentasPct = Number(
    (((stressSalesSum - baseSalesSum) / Math.max(1, baseSalesSum)) * 100).toFixed(1)
  );
  const impactoCostosPct = Number(
    (((stressCostSum - baseCostSum) / Math.max(1, baseCostSum)) * 100).toFixed(1)
  );
  const impactoUtilidadPct = Number(
    (((stressUtilSum - baseUtilSum) / Math.max(1, Math.abs(baseUtilSum))) * 100).toFixed(1)
  );

  const predictivoEstresado: ResultadoPredictivo = {
    ...baselinePredictive,
    proyecciones: proyeccionesEstresadas,
    utilidadNetaPromedio: Math.round(
      stressUtilSum / Math.max(1, proyeccionesEstresadas.length)
    ),
    utilidadConservadoraPromedio: Math.round(
      proyeccionesEstresadas.reduce((a, b) => a + b.utilidadConservadora, 0) /
        Math.max(1, proyeccionesEstresadas.length)
    ),
    utilidadFavorablePromedio: Math.round(
      proyeccionesEstresadas.reduce((a, b) => a + b.utilidadFavorable, 0) /
        Math.max(1, proyeccionesEstresadas.length)
    ),
    ventasTotalesProyectadas: stressSalesSum,
    advertenciasDatos: [
      `Escenario hipotético (${resolvedParams.fenomeno} — ${resolvedParams.intensidad}, inicio P${resolvedParams.mesInicioPeriodo}, duración ${resolvedParams.duracionMeses}m, modo ${resolvedParams.modoEvaluacion}, factor geográfico ${factorGeograficoAplicado}x). No constituye un pronóstico meteorológico real.`,
      ...baselinePredictive.advertenciasDatos,
    ],
  };

  // Re-optimización preventiva bajo escenario estresado
  const comparacionEstresada = compareSchedules(input.credito, proyeccionesEstresadas);

  // Evaluación sobrevenida: someter los cronogramas YA DESEMBOLSADOS (base pre-shock) al flujo de caja estresado
  const comparacionBaseOriginal = compareSchedules(
    input.credito,
    baselinePredictive.proyecciones
  );
  const factorCapacidad = input.credito.productoConfig.factorMaximoCapacidadPago;
  const periodosCriticosFijoOriginal: string[] = [];
  const periodosCriticosAdaptadoOriginal: string[] = [];

  for (let i = 0; i < proyeccionesEstresadas.length; i++) {
    const uStress = proyeccionesEstresadas[i].utilidadNetaDisponible;
    const capMaxStress = Math.max(0, uStress * factorCapacidad);
    const cuotaFijaOrig = comparacionBaseOriginal.tradicional.cuotas[i]?.cuotaTotal ?? 0;
    const cuotaAdaptOrig = comparacionBaseOriginal.adaptado.cuotas[i]?.cuotaTotal ?? 0;

    if (cuotaFijaOrig > capMaxStress + 0.01 || (uStress <= 0 && cuotaFijaOrig > 0.01)) {
      periodosCriticosFijoOriginal.push(proyeccionesEstresadas[i].etiquetaPeriodo);
    }
    if (cuotaAdaptOrig > capMaxStress + 0.01 || (uStress <= 0 && cuotaAdaptOrig > 0.01)) {
      periodosCriticosAdaptadoOriginal.push(proyeccionesEstresadas[i].etiquetaPeriodo);
    }
  }

  const sobrevenido = {
    incumplimientosFijoOriginal: periodosCriticosFijoOriginal.length,
    incumplimientosAdaptadoOriginal: periodosCriticosAdaptadoOriginal.length,
    periodosCriticosFijoOriginal,
    periodosCriticosAdaptadoOriginal,
    resumen:
      periodosCriticosAdaptadoOriginal.length < periodosCriticosFijoOriginal.length
        ? `Ante un evento sobrevenido sin reprogramación, el cronograma adaptado original registra ${periodosCriticosAdaptadoOriginal.length} periodo(s) con exceso sobre capacidad estresada frente a ${periodosCriticosFijoOriginal.length} en el plan fijo.`
        : `Ante un evento sobrevenido severo, ambos cronogramas ya pactados sufren presión (${periodosCriticosAdaptadoOriginal.length} periodos críticos en adaptado vs. ${periodosCriticosFijoOriginal.length} en tradicional), evidenciando necesidad de reprogramación preventiva.`,
  };

  const mesesCriticos = proyeccionesEstresadas
    .filter((p, idx) => {
      const baseUtil = baselinePredictive.proyecciones[idx]?.utilidadNetaDisponible ?? 0;
      const caeFuerte = baseUtil > 0 && p.utilidadNetaDisponible < baseUtil * 0.78;
      const incumple =
        comparacionEstresada.tradicional.cuotas[idx]?.estado === "Incumple" ||
        comparacionEstresada.adaptado.cuotas[idx]?.estado === "Incumple";
      return caeFuerte || incumple;
    })
    .map((p) => p.etiquetaPeriodo);

  return {
    esEscenarioHipotetico: true,
    parametros: resolvedParams,
    factorGeograficoAplicado,
    sensibilidadSectorialAplicada,
    impactoVentasPct,
    impactoCostosPct,
    impactoUtilidadPct,
    mesesCriticos,
    predictivoEstresado,
    comparacionEstresada,
    cuotasQueIncumplenFijo: comparacionEstresada.tradicional.periodosIncumplen,
    cuotasQueIncumplenAdaptado: comparacionEstresada.adaptado.periodosIncumplen,
    sobrevenido,
  };
}

export function runFullAnalysis(input: AnalisisInput) {
  const predictivo = runPredictiveEngine(input);
  const comparacion = compareSchedules(input.credito, predictivo.proyecciones);
  return { predictivo, comparacion };
}
