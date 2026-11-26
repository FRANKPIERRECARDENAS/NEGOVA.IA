import {
  BacktestSegmentoMetrics,
  BacktestTemporalResumen,
  ExperimentoGrupoMetrics,
  ExperimentoReproducibleResumen,
  IndicadoresValidacion,
  MesVenta,
  PerfilSintetico,
  SegmentoSintetico,
  SensibilidadParametroRow,
} from "../types/negova";
import { INDICE_ESTACIONAL_SECTOR, MESES_CORTOS, ZONAS_GEOGRAFICAS } from "./catalogs";
import { compareSchedules } from "./financialEngine";
import { runPredictiveEngine } from "./predictiveEngine";
import { getSyntheticProfiles } from "./syntheticData";

let cachedValidation: IndicadoresValidacion | null = null;

const SEGMENTS_ORDER: SegmentoSintetico[] = [
  "Agrícola y productivo",
  "Comercio estacional",
  "Comercio y servicios estables",
  "Negocios sensibles al clima",
  "Negocios variables o mixtos",
];

function buildMonthlySeries24(profile: PerfilSintetico): number[] {
  const hist12 = profile.input.ventas.map((v) => v.monto ?? 0);
  return [...hist12, ...profile.ventasFuturasRealesSinteticas];
}

function getQuantiles(sortedValues: number[]) {
  if (sortedValues.length === 0) {
    return { min: 0, p25: 0, medianaP50: 0, p75: 0, max: 0 };
  }
  const at = (q: number) => {
    const idx = Math.min(
      sortedValues.length - 1,
      Math.max(0, Math.floor(q * (sortedValues.length - 1)))
    );
    return Number(sortedValues[idx].toFixed(2));
  };
  return {
    min: at(0),
    p25: at(0.25),
    medianaP50: at(0.5),
    p75: at(0.75),
    max: at(1),
  };
}

/**
 * Backtesting temporal rolling-origin sin fuga de futuro:
 * Evalúa orígenes t0 in {6, 9, 12, 15, 18} con horizonte H = 6 meses sobre las 24 observaciones reales sintéticas.
 * Compara NEGOVA Híbrido contra Baseline Ingenuo (último mes) y Baseline Estacional Puro (sector × zona).
 */
export function runTemporalBacktesting(profiles: PerfilSintetico[]): BacktestTemporalResumen {
  const origenesEvaluados = [6, 9, 12, 15, 18];
  const horizonteMeses = 6;
  // Evaluar sobre muestra estratificada de 200 perfiles (1 de cada 5) -> 200 * 5 orígenes * 6 meses = 6,000 pronósticos out-of-sample
  const evalProfiles = profiles.filter((_, idx) => idx % 5 === 4);

  const segmentAcc = new Map<
    SegmentoSintetico,
    {
      evals: number;
      absErrNegova: number;
      sqErrNegova: number;
      signedErrNegova: number;
      actualSum: number;
      in80Count: number;
      absErrIngenuo: number;
      absErrEstacional: number;
    }
  >();

  for (const s of SEGMENTS_ORDER) {
    segmentAcc.set(s, {
      evals: 0,
      absErrNegova: 0,
      sqErrNegova: 0,
      signedErrNegova: 0,
      actualSum: 0,
      in80Count: 0,
      absErrIngenuo: 0,
      absErrEstacional: 0,
    });
  }

  for (const profile of evalProfiles) {
    const series24 = buildMonthlySeries24(profile);
    const acc = segmentAcc.get(profile.segmento)!;
    const zonaCurve =
      ZONAS_GEOGRAFICAS.find((z) => z.departamento === profile.input.negocio.departamento)
        ?.indiceRegional12Meses ?? ZONAS_GEOGRAFICAS[0].indiceRegional12Meses;
    const secCurve = INDICE_ESTACIONAL_SECTOR[profile.input.negocio.sector];

    for (const t0 of origenesEvaluados) {
      const trainSlice: MesVenta[] = [];
      for (let t = 0; t < t0; t++) {
        trainSlice.push({
          mesIndice: t,
          etiquetaMes: MESES_CORTOS[t % 12],
          monto: series24[t],
        });
      }

      // Calcular fecha de desembolso equivalente para alinear mes calendario de inicio t0
      const startCalMonth = t0 % 12;
      const monthStr = String(startCalMonth + 1).padStart(2, "0");

      const subInput = {
        ...profile.input,
        ventas: trainSlice,
        credito: {
          ...profile.input.credito,
          plazoMeses: horizonteMeses,
          frecuenciaPagoDias: 30 as const,
          permitirPeriodosIrregulares: false,
          fechaDesembolso: `2026-${monthStr}-01`,
        },
      };

      const pred = runPredictiveEngine(subInput);
      const lastObserved = series24[t0 - 1];
      const trainMean =
        series24.slice(0, t0).reduce((a, b) => a + b, 0) / Math.max(1, t0);

      for (let h = 0; h < horizonteMeses; h++) {
        const targetIdx = t0 + h;
        if (targetIdx >= series24.length) break;
        const actual = series24[targetIdx];
        const proy = pred.proyecciones[h];
        if (!proy) break;

        const err = proy.ventasEsperadas - actual;
        acc.evals++;
        acc.absErrNegova += Math.abs(err);
        acc.sqErrNegova += err * err;
        acc.signedErrNegova += err;
        acc.actualSum += actual;
        if (actual >= proy.ventasRangoInferior && actual <= proy.ventasRangoSuperior) {
          acc.in80Count++;
        }

        // Baseline 1: Ingenuo (último valor observado)
        acc.absErrIngenuo += Math.abs(lastObserved - actual);

        // Baseline 2: Estacional Puro (media histórica × sector × zona)
        const calM = targetIdx % 12;
        const estPred = trainMean * secCurve[calM] * zonaCurve[calM];
        acc.absErrEstacional += Math.abs(estPred - actual);
      }
    }
  }

  let totalObs = 0;
  let totalAbsNegova = 0;
  let totalSqNegova = 0;
  let totalSignedNegova = 0;
  let totalActual = 0;
  let totalIn80 = 0;
  let totalAbsIngenuo = 0;
  let totalAbsEstacional = 0;

  let worstSeg: SegmentoSintetico = SEGMENTS_ORDER[0];
  let worstWape = -1;

  const porSegmentoRaw: BacktestSegmentoMetrics[] = SEGMENTS_ORDER.map((segmento) => {
    const a = segmentAcc.get(segmento)!;
    totalObs += a.evals;
    totalAbsNegova += a.absErrNegova;
    totalSqNegova += a.sqErrNegova;
    totalSignedNegova += a.signedErrNegova;
    totalActual += a.actualSum;
    totalIn80 += a.in80Count;
    totalAbsIngenuo += a.absErrIngenuo;
    totalAbsEstacional += a.absErrEstacional;

    const wape = Number(((a.absErrNegova / Math.max(1, a.actualSum)) * 100).toFixed(2));
    if (wape > worstWape) {
      worstWape = wape;
      worstSeg = segmento;
    }

    return {
      segmento,
      evaluaciones: a.evals,
      maeNegova: Math.round(a.absErrNegova / Math.max(1, a.evals)),
      wapeNegovaPct: wape,
      rmseNegova: Math.round(Math.sqrt(a.sqErrNegova / Math.max(1, a.evals))),
      sesgoPct: Number(((a.signedErrNegova / Math.max(1, a.actualSum)) * 100).toFixed(2)),
      cobertura80Pct: Number(((a.in80Count / Math.max(1, a.evals)) * 100).toFixed(1)),
      wapeIngenuoPct: Number(((a.absErrIngenuo / Math.max(1, a.actualSum)) * 100).toFixed(2)),
      wapeEstacionalPuroPct: Number(
        ((a.absErrEstacional / Math.max(1, a.actualSum)) * 100).toFixed(2)
      ),
      esPeorRendimiento: false,
    };
  });

  const porSegmento = porSegmentoRaw.map((row) => ({
    ...row,
    esPeorRendimiento: row.segmento === worstSeg,
  }));

  return {
    horizonteMeses,
    origenesEvaluados,
    totalObservacionesOutOfSample: totalObs,
    maeGlobal: Math.round(totalAbsNegova / Math.max(1, totalObs)),
    wapeGlobalPct: Number(((totalAbsNegova / Math.max(1, totalActual)) * 100).toFixed(2)),
    rmseGlobal: Math.round(Math.sqrt(totalSqNegova / Math.max(1, totalObs))),
    sesgoGlobalPct: Number(((totalSignedNegova / Math.max(1, totalActual)) * 100).toFixed(2)),
    coberturaIntervalo80Pct: Number(((totalIn80 / Math.max(1, totalObs)) * 100).toFixed(1)),
    wapeBaselineIngenuoPct: Number(
      ((totalAbsIngenuo / Math.max(1, totalActual)) * 100).toFixed(2)
    ),
    wapeBaselineEstacionalPct: Number(
      ((totalAbsEstacional / Math.max(1, totalActual)) * 100).toFixed(2)
    ),
    peorSegmento: worstSeg,
    notaMetodologicaBacktest:
      "Backtesting temporal rolling-origin (orígenes t₀ ∈ {6, 9, 12, 15, 18}, horizonte H=6 meses) entrenado estrictamente con datos ≤ t₀−1 para eliminar cualquier fuga de futuro.",
    porSegmento,
  };
}

interface GroupAccumulator {
  clave: string;
  perfiles: number;
  tradViable: number;
  adaptViable: number;
  cumplAdaptadoOk: number;
  validacionMatOk: number;
  incTrad: number;
  incAdapt: number;
  cvSum: number;
  cvCount: number;
  deltaCostSum: number;
  adaptCheaperCount: number;
  tradBetterOrEqualCount: number;
  noViableAdaptCount: number;
}

function createGroupAcc(clave: string): GroupAccumulator {
  return {
    clave,
    perfiles: 0,
    tradViable: 0,
    adaptViable: 0,
    cumplAdaptadoOk: 0,
    validacionMatOk: 0,
    incTrad: 0,
    incAdapt: 0,
    cvSum: 0,
    cvCount: 0,
    deltaCostSum: 0,
    adaptCheaperCount: 0,
    tradBetterOrEqualCount: 0,
    noViableAdaptCount: 0,
  };
}

function finalizeGroupAcc(a: GroupAccumulator): ExperimentoGrupoMetrics {
  const n = Math.max(1, a.perfiles);
  return {
    clave: a.clave,
    perfiles: a.perfiles,
    viabilidadTradicionalPct: Number(((a.tradViable / n) * 100).toFixed(1)),
    viabilidadAdaptadoPct: Number(((a.adaptViable / n) * 100).toFixed(1)),
    cumplimientoCapacidadAdaptadoPct: Number(((a.cumplAdaptadoOk / n) * 100).toFixed(1)),
    validacionMatematicaPct: Number(((a.validacionMatOk / n) * 100).toFixed(1)),
    incumplimientosTradicional: a.incTrad,
    incumplimientosAdaptado: a.incAdapt,
    variabilidadCVAdaptadoPct: Number((a.cvSum / Math.max(1, a.cvCount)).toFixed(1)),
    deltaCostoPromedio: Number((a.deltaCostSum / n).toFixed(2)),
    adaptadoMasBaratoPct: Number(((a.adaptCheaperCount / n) * 100).toFixed(1)),
    tradicionalMejorOIgualPct: Number(((a.tradBetterOrEqualCount / n) * 100).toFixed(1)),
    noViablesAdaptadoCount: a.noViableAdaptCount,
  };
}

export function runReproducibleExperiments(
  profiles: PerfilSintetico[]
): ExperimentoReproducibleResumen {
  const nowFn = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  const tStart = nowFn();

  let tiempoPredictivoMs = 0;
  let tiempoOptimizacionMs = 0;

  const segMap = new Map<string, GroupAccumulator>();
  const actMap = new Map<string, GroupAccumulator>();
  const estMap = new Map<string, GroupAccumulator>();
  const volMap = new Map<string, GroupAccumulator>();

  const deltaCosts: number[] = [];
  let totalValidMat = 0;
  let totalCumplAdaptOk = 0;
  let failSaldoPendiente = 0;
  let failDeficitIntSeg = 0;
  let failReglaProducto = 0;
  let totalNoViableAdapt = 0;

  const pushToAcc = (
    map: Map<string, GroupAccumulator>,
    key: string,
    tradViable: boolean,
    adaptViable: boolean,
    cumplOk: boolean,
    matOk: boolean,
    incTrad: number,
    incAdapt: number,
    cvAdapt: number,
    deltaCost: number,
    mejorOpcion: string
  ) => {
    let acc = map.get(key);
    if (!acc) {
      acc = createGroupAcc(key);
      map.set(key, acc);
    }
    acc.perfiles++;
    if (tradViable) acc.tradViable++;
    if (adaptViable) {
      acc.adaptViable++;
      acc.cvSum += cvAdapt;
      acc.cvCount++;
    } else {
      acc.noViableAdaptCount++;
    }
    if (cumplOk) acc.cumplAdaptadoOk++;
    if (matOk) acc.validacionMatOk++;
    acc.incTrad += incTrad;
    acc.incAdapt += incAdapt;
    acc.deltaCostSum += deltaCost;
    if (deltaCost < -0.01) acc.adaptCheaperCount++;
    if (mejorOpcion === "Tradicional" || mejorOpcion === "Equivalente") {
      acc.tradBetterOrEqualCount++;
    }
  };

  for (const profile of profiles) {
    const tp0 = nowFn();
    const pred = runPredictiveEngine(profile.input);
    const tp1 = nowFn();
    tiempoPredictivoMs += tp1 - tp0;

    const to0 = nowFn();
    const comp = compareSchedules(profile.input.credito, pred.proyecciones);
    const to1 = nowFn();
    tiempoOptimizacionMs += to1 - to0;

    const tradViable = comp.tradicional.viable;
    const adaptViable = comp.adaptado.viable;
    const cumplOk = comp.adaptado.periodosIncumplen === 0 && adaptViable;
    const matOk =
      comp.tradicional.validacionIndependiente.valido &&
      comp.adaptado.validacionIndependiente.valido;

    if (matOk) totalValidMat++;
    if (cumplOk) totalCumplAdaptOk++;

    if (!adaptViable) {
      totalNoViableAdapt++;
      const reason = (comp.adaptado.motivoNoViabilidad ?? "").toLowerCase();
      if (reason.includes("bcrp") || reason.includes("plazo") || reason.includes("seguro")) {
        failReglaProducto++;
      } else if (reason.includes("intereses y seguros") || reason.includes("déficit")) {
        failDeficitIntSeg++;
      } else {
        failSaldoPendiente++;
      }
    }

    const deltaCost = comp.diferenciaCostoTotal;
    deltaCosts.push(deltaCost);

    const args = [
      tradViable,
      adaptViable,
      cumplOk,
      matOk,
      comp.tradicional.periodosIncumplen,
      comp.adaptado.periodosIncumplen,
      comp.adaptado.variabilidadCuotasCV,
      deltaCost,
      comp.mejorOpcion,
    ] as const;

    pushToAcc(segMap, profile.segmento, ...args);
    pushToAcc(actMap, profile.input.negocio.actividadEspecifica, ...args);
    pushToAcc(estMap, profile.estacionalidadNivel, ...args);
    pushToAcc(volMap, profile.volatilidadNivel, ...args);
  }

  // Análisis de sensibilidad paramétrica sobre muestra holdout (200 perfiles)
  const holdout = profiles.filter((_, idx) => idx % 5 === 4);
  const sensScenarios: Array<{ label: string; factor: number; dropPct: number }> = [
    { label: "Factor estricto (0.55) · Base", factor: 0.55, dropPct: 0 },
    { label: "Factor estándar (0.65) · Base", factor: 0.65, dropPct: 0 },
    { label: "Factor flexible (0.75) · Base", factor: 0.75, dropPct: 0 },
    { label: "Factor campaña (0.85) · Base", factor: 0.85, dropPct: 0 },
    { label: "Factor estándar (0.65) · Caída ingresos -15%", factor: 0.65, dropPct: 15 },
    { label: "Factor estándar (0.65) · Caída ingresos -30%", factor: 0.65, dropPct: 30 },
  ];

  const analisisSensibilidad: SensibilidadParametroRow[] = sensScenarios.map((sc) => {
    let tV = 0;
    let aV = 0;
    let tInc = 0;
    let aInc = 0;

    for (const p of holdout) {
      const modInput =
        sc.dropPct === 0
          ? p.input
          : {
              ...p.input,
              ventas: p.input.ventas.map((v) => ({
                ...v,
                monto: v.monto !== null ? Math.round(v.monto * (1 - sc.dropPct / 100)) : null,
              })),
            };
      const modCredito = {
        ...modInput.credito,
        productoConfig: {
          ...modInput.credito.productoConfig,
          factorMaximoCapacidadPago: sc.factor,
        },
      };
      const pred = runPredictiveEngine({ ...modInput, credito: modCredito });
      const comp = compareSchedules(modCredito, pred.proyecciones);
      if (comp.tradicional.viable) tV++;
      if (comp.adaptado.viable) aV++;
      tInc += comp.tradicional.periodosIncumplen;
      aInc += comp.adaptado.periodosIncumplen;
    }

    return {
      escenario: sc.label,
      factorCapacidad: sc.factor,
      caidaIngresosPct: sc.dropPct,
      viabilidadTradicionalPct: Number(((tV / Math.max(1, holdout.length)) * 100).toFixed(1)),
      viabilidadAdaptadoPct: Number(((aV / Math.max(1, holdout.length)) * 100).toFixed(1)),
      incumplimientosTradicional: tInc,
      incumplimientosAdaptado: aInc,
    };
  });

  const tEnd = nowFn();
  deltaCosts.sort((a, b) => a - b);

  const porActividadTop = Array.from(actMap.values())
    .sort((a, b) => b.perfiles - a.perfiles)
    .slice(0, 8)
    .map(finalizeGroupAcc);

  const nTotal = Math.max(1, profiles.length);

  return {
    version: "2.0.0-cajathon2026",
    fechaEjecucionIso: new Date().toISOString().slice(0, 10),
    semilla: 20260501,
    totalPerfilesEvaluados: profiles.length,
    tiempoTotalExperimentoMs: Math.round(tEnd - tStart),
    tiempoAnalisisPredictivoMs: Math.round(tiempoPredictivoMs),
    tiempoOptimizacionMs: Math.round(tiempoOptimizacionMs),
    porcentajeCronogramasMatematicamenteValidos: Number(
      ((totalValidMat / nTotal) * 100).toFixed(1)
    ),
    porcentajeCumplimientoCapacidadAdaptado: Number(
      ((totalCumplAdaptOk / nTotal) * 100).toFixed(1)
    ),
    distribucionDeltaCosto: getQuantiles(deltaCosts),
    casosFallidosAdaptado: {
      totalNoViables: totalNoViableAdapt,
      porSaldoPendiente: failSaldoPendiente,
      porDeficitInteresesSeguros: failDeficitIntSeg,
      porReglaProducto: failReglaProducto,
    },
    porSegmento: SEGMENTS_ORDER.map((s) => finalizeGroupAcc(segMap.get(s) ?? createGroupAcc(s))),
    porActividadTop,
    porEstacionalidad: ["Baja", "Media", "Alta", "Muy alta"].map((k) =>
      finalizeGroupAcc(estMap.get(k) ?? createGroupAcc(k))
    ),
    porVolatilidad: ["Baja", "Media", "Alta"].map((k) =>
      finalizeGroupAcc(volMap.get(k) ?? createGroupAcc(k))
    ),
    analisisSensibilidad,
    limitacionesExperimento: [
      "Los 1,000 perfiles y sus 24 meses históricos/futuros provienen de un generador sintético reproducible (semilla 20260501), no de cartera real de Caja Trujillo.",
      "Los costos operativos y obligaciones externas se asumen constantes durante el horizonte del crédito salvo estrés explícito.",
      "La morosidad real observada, cosecha crediticia y tasa de colocación comercial requieren validación en piloto institucional con datos históricos de Caja Trujillo.",
    ],
  };
}

export function computeSyntheticValidationIndicators(): IndicadoresValidacion {
  if (cachedValidation) return cachedValidation;

  const profiles = getSyntheticProfiles();
  const distribucionSegmentos = SEGMENTS_ORDER.map((segmento) => ({
    segmento,
    cantidad: profiles.filter((p) => p.segmento === segmento).length,
  }));

  // Muestra holdout determinística: 1 de cada 5 perfiles (200 perfiles reservados de los 1,000)
  const holdout = profiles.filter((_, idx) => idx % 5 === 4);
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

  let absErrorSum = 0;
  let actualSalesSum = 0;
  let observationCount = 0;
  let tradViableCount = 0;
  let adaptViableCount = 0;
  let incumplimientosTradicional = 0;
  let incumplimientosAdaptado = 0;
  let ratioTradSum = 0;
  let ratioAdaptSum = 0;
  let ratioCount = 0;

  for (const profile of holdout) {
    const pred = runPredictiveEngine(profile.input);
    const comp = compareSchedules(profile.input.credito, pred.proyecciones);

    const compareMonths = Math.min(
      12,
      pred.proyecciones.length,
      profile.ventasFuturasRealesSinteticas.length
    );
    for (let m = 0; m < compareMonths; m++) {
      const predicted = pred.proyecciones[m].ventasEsperadas;
      const actual = profile.ventasFuturasRealesSinteticas[m];
      absErrorSum += Math.abs(predicted - actual);
      actualSalesSum += actual;
      observationCount++;
    }

    if (comp.tradicional.viable) tradViableCount++;
    if (comp.adaptado.viable) adaptViableCount++;
    incumplimientosTradicional += comp.tradicional.periodosIncumplen;
    incumplimientosAdaptado += comp.adaptado.periodosIncumplen;

    if (
      Number.isFinite(comp.tradicional.ratioMaximoObservado) &&
      comp.tradicional.ratioMaximoObservado < 9
    ) {
      ratioTradSum += comp.tradicional.ratioMaximoObservado;
      ratioAdaptSum += comp.adaptado.ratioMaximoObservado;
      ratioCount++;
    }
  }

  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const elapsedMs = Math.max(1, t1 - t0);

  const maePredictivo = Math.round(absErrorSum / Math.max(1, observationCount));
  const wapePredictivoPct = Number(
    ((absErrorSum / Math.max(1, actualSalesSum)) * 100).toFixed(2)
  );
  const avgMaxTrad = ratioTradSum / Math.max(1, ratioCount);
  const avgMaxAdapt = ratioAdaptSum / Math.max(1, ratioCount);
  const reduccionRatioPromedioPct = Number(
    (((avgMaxTrad - avgMaxAdapt) / Math.max(0.01, avgMaxTrad)) * 100).toFixed(1)
  );

  const backtestTemporal = runTemporalBacktesting(profiles);
  const experimentoCompleto = runReproducibleExperiments(profiles);

  cachedValidation = {
    totalPerfilesBase: profiles.length,
    distribucionSegmentos,
    perfilesPruebaHoldout: holdout.length,
    tiempoPromedioMs: Number((elapsedMs / Math.max(1, holdout.length)).toFixed(2)),
    porcentajeCronogramasAdaptadosViables: Number(
      ((adaptViableCount / Math.max(1, holdout.length)) * 100).toFixed(1)
    ),
    porcentajeCronogramasFijosViables: Number(
      ((tradViableCount / Math.max(1, holdout.length)) * 100).toFixed(1)
    ),
    incumplimientosTradicional,
    incumplimientosAdaptado,
    casosNoViablesAdaptadoHoldout: holdout.length - adaptViableCount,
    maePredictivo,
    wapePredictivoPct,
    reduccionRatioPromedioPct,
    notaMetodologica:
      "Validación sintética local reproducible sobre 1,000 perfiles (semilla 20260501), muestra holdout de 200 perfiles y backtesting temporal rolling-origin. No representa datos de cartera real de Caja Trujillo.",
    backtestTemporal,
    experimentoCompleto,
  };

  return cachedValidation;
}
