import { IndicadoresValidacion, SegmentoSintetico } from "../types/negova";
import { compareSchedules } from "./financialEngine";
import { runPredictiveEngine } from "./predictiveEngine";
import { getSyntheticProfiles } from "./syntheticData";

let cachedValidation: IndicadoresValidacion | null = null;

export function computeSyntheticValidationIndicators(): IndicadoresValidacion {
  if (cachedValidation) return cachedValidation;

  const profiles = getSyntheticProfiles();
  const segmentsOrder: SegmentoSintetico[] = [
    "Agrícola y productivo",
    "Comercio estacional",
    "Comercio y servicios estables",
    "Negocios sensibles al clima",
    "Negocios variables o mixtos",
  ];

  const distribucionSegmentos = segmentsOrder.map((segmento) => ({
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

    // Evaluar error MAE y WAPE sobre los 12 meses reservados reales sintéticos
    const compareMonths = Math.min(12, pred.proyecciones.length, profile.ventasFuturasRealesSinteticas.length);
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

    if (Number.isFinite(comp.tradicional.ratioMaximoObservado) && comp.tradicional.ratioMaximoObservado < 9) {
      ratioTradSum += comp.tradicional.ratioMaximoObservado;
      ratioAdaptSum += comp.adaptado.ratioMaximoObservado;
      ratioCount++;
    }
  }

  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const elapsedMs = Math.max(1, t1 - t0);
  const tiempoPromedioMs = Number((elapsedMs / Math.max(1, holdout.length)).toFixed(2));

  const maePredictivo = Math.round(absErrorSum / Math.max(1, observationCount));
  const wapePredictivoPct = Number(
    ((absErrorSum / Math.max(1, actualSalesSum)) * 100).toFixed(2)
  );

  const avgMaxTrad = ratioTradSum / Math.max(1, ratioCount);
  const avgMaxAdapt = ratioAdaptSum / Math.max(1, ratioCount);
  const reduccionRatioPromedioPct = Number(
    (((avgMaxTrad - avgMaxAdapt) / Math.max(0.01, avgMaxTrad)) * 100).toFixed(1)
  );

  cachedValidation = {
    totalPerfilesBase: profiles.length,
    distribucionSegmentos,
    perfilesPruebaHoldout: holdout.length,
    tiempoPromedioMs,
    porcentajeCronogramasAdaptadosViables: Number(
      ((adaptViableCount / Math.max(1, holdout.length)) * 100).toFixed(1)
    ),
    porcentajeCronogramasFijosViables: Number(
      ((tradViableCount / Math.max(1, holdout.length)) * 100).toFixed(1)
    ),
    incumplimientosTradicional,
    incumplimientosAdaptado,
    maePredictivo,
    wapePredictivoPct,
    reduccionRatioPromedioPct,
    notaMetodologica:
      "Resultados de validación sintética ejecutados localmente sobre 200 perfiles sintéticos reservados (20% de los 1,000 perfiles generados con semilla fija). No representan datos ni métricas reales de Caja Trujillo.",
  };

  return cachedValidation;
}
