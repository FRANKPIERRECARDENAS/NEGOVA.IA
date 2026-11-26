import test from "node:test";
import assert from "node:assert/strict";
import { getSyntheticProfiles } from "./syntheticData";
import { runPredictiveEngine } from "./predictiveEngine";
import {
  aplicarPagoWaterfall,
  buildAdaptiveSchedule,
  buildTraditionalSchedule,
  calcularSeguroSimpleBase360,
  calcularTCEA,
  calcularTED,
  calcularTasaEfectivaPeriodo,
  compareSchedules,
} from "./financialEngine";
import { validateScheduleIndependently } from "./independentValidator";
import { runExternalShockSimulation, runFullAnalysis } from "./shockSimulator";
import { computeSyntheticValidationIndicators } from "./validationBenchmarks";
import { buildLocalFallbackExplanation } from "./localExplainer";
import { getEffectiveSectorActivityCurve, PRODUCTOS_ILUSTRATIVOS } from "./catalogs";

test("1. Base sintética genera exactamente 1,000 perfiles reproducibles distribuidos en 5 segmentos", () => {
  const profilesA = getSyntheticProfiles();
  const profilesB = getSyntheticProfiles();
  assert.equal(profilesA.length, 1000);
  assert.equal(profilesA[0].id, profilesB[0].id);
  assert.equal(profilesA[0].input.ventas[0].monto, profilesB[0].input.ventas[0].monto);

  const counts = new Map<string, number>();
  for (const p of profilesA) {
    assert.ok(p.etiquetaSintetica.includes("SINTÉTICO"));
    assert.equal(p.input.esSintetico, true);
    assert.equal(p.ventasFuturasRealesSinteticas.length, 12);
    counts.set(p.segmento, (counts.get(p.segmento) ?? 0) + 1);
  }

  assert.equal(counts.get("Agrícola y productivo"), 240);
  assert.equal(counts.get("Comercio estacional"), 260);
  assert.equal(counts.get("Comercio y servicios estables"), 220);
  assert.equal(counts.get("Negocios sensibles al clima"), 160);
  assert.equal(counts.get("Negocios variables o mixtos"), 120);
});

test("2. Diferenciación por actividad económica específica y corrección de impuesto fantasma", () => {
  const libCurve = getEffectiveSectorActivityCurve("Comercio minorista", "Librería y útiles escolares");
  const botCurve = getEffectiveSectorActivityCurve("Comercio minorista", "Botica y productos de cuidado personal");
  assert.equal(libCurve.usoCurvaActividad, true);
  assert.equal(botCurve.usoCurvaActividad, true);
  // Marzo escolar debe diferir fuertemente entre Librería y Botica
  assert.ok(libCurve.curve[2] > botCurve.curve[2] + 0.25);

  const baseProfile = getSyntheticProfiles()[0];
  const informalInput = structuredClone(baseProfile.input);
  informalInput.negocio.formalidad = "Persona natural sin RUC / informal";
  informalInput.costos.tasaTributariaPct = 0;
  informalInput.costos.gastosTributariosMensuales = 450; // legacy ghost field must be ignored

  const predInf = runPredictiveEngine(informalInput);
  for (const p of predInf.proyecciones) {
    const expectedOp = Math.round(
      informalInput.costos.gastosOperativosMensuales * (p.diasPeriodo / 30)
    );
    assert.equal(
      p.gastosOperativosYTributarios,
      expectedOp,
      "No debe cobrar impuesto fantasma cuando tasaTributariaPct=0 o negocio informal"
    );
  }
});

test("3. Motor predictivo: selección adaptativa, escenarios, intervalo 80% y huecos cronológicos", () => {
  const baseProfile = getSyntheticProfiles()[0];
  const fullInput = structuredClone(baseProfile.input);
  fullInput.ventas = fullInput.ventas.map((v, i) => ({
    ...v,
    monto: 16000 + i * 250,
  }));

  const partialInput = structuredClone(fullInput);
  partialInput.ventas = partialInput.ventas.map((v, i) => ({
    ...v,
    monto: i < 8 ? null : v.monto,
  }));

  // Historial con hueco en meses centrales (meses 0, 1, 10, 11 disponibles)
  const gappedInput = structuredClone(fullInput);
  gappedInput.ventas = gappedInput.ventas.map((v, i) => ({
    ...v,
    monto: i >= 2 && i <= 9 ? null : 15000 + i * 200,
  }));

  const resFull = runPredictiveEngine(fullInput);
  const resPartial = runPredictiveEngine(partialInput);
  const resGapped = runPredictiveEngine(gappedInput);

  assert.equal(resFull.mesesDisponiblesCount, 12);
  assert.equal(resPartial.mesesDisponiblesCount, 4);
  assert.equal(
    resFull.trazabilidad.metodoSeleccionado,
    "Descomposición Híbrida + Holt Amortiguado"
  );
  assert.equal(
    resPartial.trazabilidad.metodoSeleccionado,
    "Regresión Temporal Regularizada + Estacionalidad Actividad/Zona"
  );
  assert.ok(resPartial.nivelConfianza < resFull.nivelConfianza);
  assert.equal(resPartial.usoReferenciaSintetica, true);
  assert.ok(resGapped.pendienteMensualPct > 0 && resGapped.pendienteMensualPct < 3);

  // Tres escenarios y banda estadística monotónica
  for (const p of resFull.proyecciones) {
    assert.ok(p.ventasRangoInferior <= p.ventasEsperadas);
    assert.ok(p.ventasEsperadas <= p.ventasRangoSuperior);
    assert.ok(p.utilidadConservadora <= p.utilidadNetaDisponible);
    assert.ok(p.utilidadNetaDisponible <= p.utilidadFavorable);
  }
});

test("4. Cálculos financieros Base 360 y prelación Waterfall sin capitalización", () => {
  const tea = 0.24;
  const ted = calcularTED(tea);
  assert.ok(Math.abs(Math.pow(1 + ted, 360) - (1 + tea)) < 1e-10);

  const tep30 = calcularTasaEfectivaPeriodo(tea, 30);
  const tep45 = calcularTasaEfectivaPeriodo(tea, 45);
  assert.ok(Math.abs(Math.pow(1 + tep30, 12) - (1 + tea)) < 1e-10);
  assert.ok(tep45 > tep30);

  const seguro = calcularSeguroSimpleBase360(10000, 0.012, 30);
  assert.ok(Math.abs(seguro - 10) < 1e-8);

  const wf = aplicarPagoWaterfall({
    pagoDisponible: 250,
    saldoCapital: 10000,
    seguroPeriodo: 50,
    interesPeriodo: 300,
  });

  assert.equal(wf.seguroPagado, 50);
  assert.equal(wf.interesPagado, 200);
  assert.equal(wf.capitalAmortizado, 0);
  assert.equal(wf.nuevoSaldoCapital, 10000);
  assert.equal(wf.seguroPendienteNoCapitalizado, 0);
  assert.equal(wf.interesPendienteNoCapitalizado, 100);
});

test("5. Invariantes matemáticos, cierre exacto S/ 0.00 y validador independiente anti-manipulación", () => {
  const profile = getSyntheticProfiles().find(
    (p) => p.segmento === "Agrícola y productivo"
  )!;
  const input = structuredClone(profile.input);
  input.credito.montoSolicitado = 24000;
  input.credito.plazoMeses = 12;
  input.credito.tea = 0.24;
  input.credito.permitirPeriodosIrregulares = true;
  input.credito.productoConfig = {
    ...PRODUCTOS_ILUSTRATIVOS[0],
    factorMaximoCapacidadPago: 0.65,
  };

  const pred = runPredictiveEngine(input);
  const comp = compareSchedules(input.credito, pred.proyecciones);

  assert.equal(comp.adaptado.viable, true);
  assert.equal(comp.adaptado.validacionIndependiente.valido, true);
  assert.equal(comp.adaptado.validacionIndependiente.saldoFinalVerificado, 0);
  assert.ok(comp.adaptado.cuotas[comp.adaptado.cuotas.length - 1].saldoFinal === 0);
  assert.ok(comp.adaptado.optimizadorDetalle !== undefined);
  assert.ok(comp.adaptado.tcea !== null && comp.adaptado.tcea >= input.credito.tea);

  // Verificar invariantes en cada cuota + trazabilidad completa
  for (const c of comp.adaptado.cuotas) {
    assert.ok(c.saldoInicial >= 0 && c.saldoFinal >= 0);
    assert.ok(c.amortizacionCapital <= c.saldoInicial + 0.01);
    assert.ok(c.ratioCuotaUtilidad !== null);
    assert.ok(c.ratioCuotaUtilidad <= input.credito.productoConfig.factorMaximoCapacidadPago + 1e-4);
    assert.notEqual(c.estado, "Incumple");
    assert.ok(c.trazabilidad.motivoImporte.length > 10);
    assert.ok(c.trazabilidad.restriccionVerificada.length > 5);
  }

  // Validador independiente DEBE rechazar un cronograma manipulado manualmente
  const tampered = structuredClone(comp.adaptado);
  tampered.cuotas[0].cuotaTotal = Number((tampered.cuotas[0].cuotaTotal + 500).toFixed(2));
  const checkTampered = validateScheduleIndependently(tampered, input.credito, pred.proyecciones);
  assert.equal(checkTampered.valido, false);
  assert.ok(checkTampered.errores.length > 0);
});

test("6. Casos extremos de frontera (ventas cayendo, utilidad negativa, estable donde Tradicional gana/empata, inviable)", () => {
  const baseProfile = getSyntheticProfiles()[0];

  // Caso A: Negocio muy estable donde cuota fija ya cumple
  const stableInput = structuredClone(baseProfile.input);
  stableInput.negocio.sector = "Servicios técnicos y transporte";
  stableInput.negocio.actividadEspecifica = "Botica y productos de cuidado personal";
  stableInput.ventas = stableInput.ventas.map((v) => ({ ...v, monto: 22000 }));
  stableInput.costos.tipoEstructura = "Proporcional al ciclo";
  stableInput.costos.costoAdquisicionProduccionPct = 55;
  stableInput.costos.gastosOperativosMensuales = 2200;
  stableInput.credito.montoSolicitado = 15000;
  stableInput.credito.plazoMeses = 12;
  const predStable = runPredictiveEngine(stableInput);
  const compStable = compareSchedules(stableInput.credito, predStable.proyecciones);
  assert.equal(compStable.tradicional.viable, true);
  assert.equal(compStable.adaptado.viable, true);
  assert.ok(
    compStable.mejorOpcion === "Tradicional" || compStable.mejorOpcion === "Equivalente",
    `En negocio estable sin incumplimientos, no debe forzar Adaptado como superior (obtenido: ${compStable.mejorOpcion})`
  );

  // Caso B: Ventas cayendo fuertemente y utilidad negativa en varios periodos -> rechaza monto impagable
  const decliningInput = structuredClone(baseProfile.input);
  decliningInput.ventas = decliningInput.ventas.map((v, i) => ({
    ...v,
    monto: Math.max(1800, 14000 - i * 1100),
  }));
  decliningInput.costos.tipoEstructura = "Fija mensual";
  decliningInput.costos.costoAdquisicionMensualFijo = 8500;
  decliningInput.costos.gastosOperativosMensuales = 2500;
  decliningInput.credito.montoSolicitado = 45000;
  const predDec = runPredictiveEngine(decliningInput);
  const adaptDec = buildAdaptiveSchedule(decliningInput.credito, predDec.proyecciones);
  assert.equal(adaptDec.viable, false);
  assert.ok(adaptDec.motivoNoViabilidad && adaptDec.motivoNoViabilidad.length > 15);

  // Caso C: Tope BCRP y parámetro de seguro faltante
  const bcrpInput = structuredClone(baseProfile.input);
  bcrpInput.credito.tea = 0.95;
  const tradBcrp = buildTraditionalSchedule(bcrpInput.credito, predStable.proyecciones);
  assert.equal(tradBcrp.viable, false);
  assert.ok(tradBcrp.motivoNoViabilidad?.includes("BCRP"));

  const missingInsInput = structuredClone(stableInput);
  missingInsInput.credito.productoConfig.desgravamenHabilitado = true;
  missingInsInput.credito.productoConfig.tasaAnualDesgravamen = 0;
  const tradMissing = buildTraditionalSchedule(missingInsInput.credito, predStable.proyecciones);
  assert.equal(tradMissing.tcea, null);

  // Periodos irregulares 45 días
  const irInput = structuredClone(stableInput);
  irInput.credito.frecuenciaPagoDias = 45;
  const pred45 = runPredictiveEngine(irInput);
  const trad45 = buildTraditionalSchedule(irInput.credito, pred45.proyecciones);
  assert.ok(trad45.cuotas.every((c) => c.diasPeriodo === 45));
  const tcea45 = calcularTCEA(irInput.credito.montoSolicitado, trad45.cuotas);
  assert.ok(tcea45 !== null && tcea45 > 0.2);
});

test("7. Simulador paramétrico (preventivo y sobrevenido) + acoplamiento geográfico", () => {
  const profiles = getSyntheticProfiles();
  // Piura (alto riesgo climático) vs Arequipa (menor riesgo)
  const piuraProfile = profiles.find((p) => p.input.negocio.departamento === "Piura")!;
  const pred = runPredictiveEngine(piuraProfile.input);

  const simPreventivo = runExternalShockSimulation(piuraProfile.input, pred, {
    fenomeno: "Fenómeno El Niño",
    intensidad: "Severo",
    mesInicioPeriodo: 1,
    duracionMeses: 5,
    magnitudAdicionalPct: 10,
    modoEvaluacion: "preventivo",
  });

  assert.equal(simPreventivo.esEscenarioHipotetico, true);
  assert.ok(simPreventivo.factorGeograficoAplicado > 1);
  assert.ok(simPreventivo.impactoVentasPct < 0);
  assert.ok(simPreventivo.impactoCostosPct > 0);
  assert.ok(simPreventivo.sobrevenido.resumen.length > 20);
  assert.ok(simPreventivo.predictivoEstresado.ventasTotalesProyectadas < pred.ventasTotalesProyectadas);
});

test("8. Prueba de integración completa end-to-end y verificación de 3 casos oficiales de demo", () => {
  const profiles = getSyntheticProfiles();
  const casoA = profiles.find((p) => p.id === "SYN-0001")!;
  const casoB = profiles.find(
    (p) =>
      p.segmento === "Comercio y servicios estables" &&
      p.input.negocio.sector === "Comercio minorista"
  )!;
  const casoC = profiles.find((p) => p.id === "SYN-0241")!;

  assert.ok(casoA && casoB && casoC);

  const fullA = runFullAnalysis(casoA.input);
  const simA = runExternalShockSimulation(casoA.input, fullA.predictivo, {
    fenomeno: "Fenómeno El Niño",
    intensidad: "Extremo",
    mesInicioPeriodo: 1,
    duracionMeses: 4,
    magnitudAdicionalPct: 0,
    modoEvaluacion: "sobrevenido",
  });
  const explA = buildLocalFallbackExplanation(
    casoA.input,
    fullA.predictivo,
    fullA.comparacion,
    simA
  );

  assert.equal(fullA.comparacion.adaptado.validacionIndependiente.valido, true);
  assert.ok(explA.trazabilidadCalculos && explA.conclusionComite.includes("Comité"));

  // Caso C debe mostrar estrés o inviabilidad transparente
  const fullC = runFullAnalysis(casoC.input);
  assert.ok(
    !fullC.comparacion.adaptado.viable || fullC.comparacion.tradicional.periodosIncumplen > 0
  );
});

test("9. Validación experimental reproducible: Backtesting rolling-origin y 1,000 perfiles", () => {
  const t0 = Date.now();
  const ind = computeSyntheticValidationIndicators();
  const elapsed = Date.now() - t0;

  assert.equal(ind.totalPerfilesBase, 1000);
  assert.equal(ind.perfilesPruebaHoldout, 200);
  assert.ok(ind.maePredictivo > 0);
  assert.ok(ind.wapePredictivoPct > 0 && ind.wapePredictivoPct < 100);
  assert.ok(elapsed < 8000, `Experimento completo tardó demasiado (${elapsed} ms)`);

  // Backtesting rolling-origin
  const bt = ind.backtestTemporal;
  assert.deepEqual(bt.origenesEvaluados, [6, 9, 12, 15, 18]);
  assert.equal(bt.porSegmento.length, 5);
  assert.ok(bt.totalObservacionesOutOfSample > 5000);
  assert.ok(bt.wapeGlobalPct < bt.wapeBaselineIngenuoPct);
  assert.ok(bt.coberturaIntervalo80Pct > 40 && bt.coberturaIntervalo80Pct <= 100);
  assert.equal(
    bt.porSegmento.filter((s) => s.esPeorRendimiento).length,
    1,
    "Debe identificar exactamente 1 peor segmento"
  );

  // Experimento 1,000 perfiles
  const exp = ind.experimentoCompleto;
  assert.equal(exp.totalPerfilesEvaluados, 1000);
  assert.equal(exp.porSegmento.length, 5);
  assert.equal(exp.analisisSensibilidad.length, 6);
  assert.ok(exp.porcentajeCronogramasMatematicamenteValidos >= 99.5);
  assert.ok(exp.porcentajeCumplimientoCapacidadAdaptado > 70);
  assert.ok(exp.casosFallidosAdaptado.totalNoViables >= 0);
});
