import {
  AnalisisInput,
  IntensidadFenomeno,
  ParametrosFenomeno,
  ResultadoPredictivo,
  ResultadoSimulacionExterna,
  TipoFenomenoExterno,
} from "../types/negova";
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
    affectedMonths: [0, 1, 2, 3, 11], // verano y lluvias
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

  // Sensibilidad sectorial explícita
  let sectorSensitivity = 1.0;
  if (cfg.climateMultiplierSensitivity) {
    if (
      input.negocio.sector === "Agrícola y pecuario" ||
      input.negocio.sector === "Gastronomía y turismo"
    ) {
      sectorSensitivity = 1.25;
    } else if (input.negocio.sector === "Servicios técnicos y transporte") {
      sectorSensitivity = 0.78;
    }
  }

  const proyeccionesEstresadas = baselinePredictive.proyecciones.map((p) => {
    const isPeakImpact = cfg.affectedMonths.includes(p.mesCalendarioIndice);
    const localFactor = isPeakImpact ? 1.0 : 0.32;

    const dropPct = Math.min(0.68, cfg.salesDropBase * mult * sectorSensitivity * localFactor);
    const costIncPct = Math.min(
      0.55,
      cfg.costIncreaseBase * mult * sectorSensitivity * localFactor
    );

    const ventasEstresadas = Math.max(0, Math.round(p.ventasEsperadas * (1 - dropPct)));
    const costosEstresados = Math.round(p.costosEsperados * (1 + costIncPct));
    const utilidadOp =
      ventasEstresadas - costosEstresados - p.gastosOperativosYTributarios;
    const utilidadDisponible =
      utilidadOp + p.otrosIngresosNetos - p.obligacionesYCarga;

    return {
      ...p,
      ventasEsperadas: ventasEstresadas,
      ventasRangoInferior: Math.max(0, Math.round(ventasEstresadas * 0.82)),
      ventasRangoSuperior: Math.round(ventasEstresadas * 1.12),
      costosEsperados: costosEstresados,
      utilidadNetaOperativa: utilidadOp,
      utilidadNetaDisponible: utilidadDisponible,
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
    ventasTotalesProyectadas: stressSalesSum,
    advertenciasDatos: [
      `Escenario hipotético de estrés (${parametros.fenomeno} — intensidad ${parametros.intensidad}). No constituye un pronóstico meteorológico ni predicción real.`,
      ...baselinePredictive.advertenciasDatos,
    ],
  };

  const comparacionEstresada = compareSchedules(input.credito, proyeccionesEstresadas);

  // Detectar meses críticos donde la utilidad cae al menos 20% o hay incumplimiento
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
    parametros,
    impactoVentasPct,
    impactoCostosPct,
    impactoUtilidadPct,
    mesesCriticos,
    predictivoEstresado,
    comparacionEstresada,
    cuotasQueIncumplenFijo: comparacionEstresada.tradicional.periodosIncumplen,
    cuotasQueIncumplenAdaptado: comparacionEstresada.adaptado.periodosIncumplen,
  };
}

export function runFullAnalysis(input: AnalisisInput) {
  const predictivo = runPredictiveEngine(input);
  const comparacion = compareSchedules(input.credito, predictivo.proyecciones);
  return { predictivo, comparacion };
}
