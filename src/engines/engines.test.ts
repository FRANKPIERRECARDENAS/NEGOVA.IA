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
import { runExternalShockSimulation } from "./shockSimulator";
import { computeSyntheticValidationIndicators } from "./validationBenchmarks";
import { PRODUCTOS_ILUSTRATIVOS } from "./catalogs";

test("Base sintética genera exactamente 1,000 perfiles reproducibles distribuidos en 5 segmentos", () => {
  const profilesA = getSyntheticProfiles();
  const profilesB = getSyntheticProfiles();
  assert.equal(profilesA.length, 1000);
  assert.equal(profilesA[0].id, profilesB[0].id);
  assert.equal(
    profilesA[0].input.ventas[0].monto,
    profilesB[0].input.ventas[0].monto
  );

  const counts = new Map<string, number>();
  for (const p of profilesA) {
    assert.ok(p.etiquetaSintetica.includes("SINTÉTICO"));
    assert.equal(p.input.esSintetico, true);
    counts.set(p.segmento, (counts.get(p.segmento) ?? 0) + 1);
  }

  assert.equal(counts.get("Agrícola y productivo"), 240);
  assert.equal(counts.get("Comercio estacional"), 260);
  assert.equal(counts.get("Comercio y servicios estables"), 220);
  assert.equal(counts.get("Negocios sensibles al clima"), 160);
  assert.equal(counts.get("Negocios variables o mixtos"), 120);
});

test("Motor predictivo reduce confianza ante historial incompleto sin inventar ventas faltantes", () => {
  const baseProfile = getSyntheticProfiles()[0];
  const fullInput = structuredClone(baseProfile.input);
  fullInput.ventas = fullInput.ventas.map((v, i) => ({
    ...v,
    monto: 18000 + (i % 4) * 1500,
  }));

  const partialInput = structuredClone(fullInput);
  partialInput.ventas = partialInput.ventas.map((v, i) => ({
    ...v,
    monto: i < 8 ? null : v.monto,
  }));

  const resFull = runPredictiveEngine(fullInput);
  const resPartial = runPredictiveEngine(partialInput);

  assert.equal(resFull.mesesDisponiblesCount, 12);
  assert.equal(resPartial.mesesDisponiblesCount, 4);
  assert.ok(
    resPartial.nivelConfianza < resFull.nivelConfianza,
    `Confianza parcial (${resPartial.nivelConfianza}) debe ser menor que completa (${resFull.nivelConfianza})`
  );
  assert.equal(resPartial.usoReferenciaSintetica, true);
  assert.ok(resPartial.advertenciasDatos.length > 0);
});

test("Cálculos financieros Base 360: TEA, TED, TEP y seguros simples", () => {
  const tea = 0.24;
  const ted = calcularTED(tea);
  // (1 + TED)^360 === 1 + TEA
  assert.ok(Math.abs(Math.pow(1 + ted, 360) - (1 + tea)) < 1e-10);

  const tep30 = calcularTasaEfectivaPeriodo(tea, 30);
  const tep45 = calcularTasaEfectivaPeriodo(tea, 45);
  assert.ok(Math.abs(Math.pow(1 + tep30, 12) - (1 + tea)) < 1e-10);
  assert.ok(tep45 > tep30);

  // Seguro simple base 360: S/ 10,000 al 1.2% anual por 30 días = 10,000 * 0.012 * (30/360) = 10.00
  const seguro = calcularSeguroSimpleBase360(10000, 0.012, 30);
  assert.ok(Math.abs(seguro - 10) < 1e-8);
});

test("Orden de prelación de pagos (Seguros -> Intereses -> Capital) no capitaliza impagos", () => {
  const wf = aplicarPagoWaterfall({
    pagoDisponible: 250,
    saldoCapital: 10000,
    seguroPeriodo: 50,
    interesPeriodo: 300,
  });

  // Se pagan primero los 50 de seguro, quedan 200 para intereses (de 300), quedan 100 de interés pendiente, capital intacto en 10000
  assert.equal(wf.seguroPagado, 50);
  assert.equal(wf.interesPagado, 200);
  assert.equal(wf.capitalAmortizado, 0);
  assert.equal(wf.nuevoSaldoCapital, 10000);
  assert.equal(wf.seguroPendienteNoCapitalizado, 0);
  assert.equal(wf.interesPendienteNoCapitalizado, 100);
});

test("Cronogramas verifican capacidad por periodo, calculan TCEA y detectan no viabilidad y tope BCRP", () => {
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

  assert.equal(comp.tradicional.cuotas.length, 12);
  assert.equal(comp.adaptado.cuotas.length, 12);
  assert.ok(comp.adaptado.tcea !== null && comp.adaptado.tcea >= input.credito.tea);

  if (comp.adaptado.viable) {
    // Verificar periodo a periodo la restricción obligatoria Cuota / Utilidad <= Factor
    for (const c of comp.adaptado.cuotas) {
      assert.ok(c.ratioCuotaUtilidad !== null);
      assert.ok(
        c.ratioCuotaUtilidad <= input.credito.productoConfig.factorMaximoCapacidadPago + 1e-4,
        `Periodo ${c.numeroCuota} excedió factor: ${c.ratioCuotaUtilidad}`
      );
      assert.notEqual(c.estado, "Incumple");
    }
    assert.ok(comp.adaptado.cuotas[comp.adaptado.cuotas.length - 1].saldoFinal <= 0.1);
  }

  // Caso no viable por monto excesivo
  const overInput = structuredClone(input);
  overInput.credito.montoSolicitado = 450000;
  const predOver = runPredictiveEngine(overInput);
  const adaptOver = buildAdaptiveSchedule(overInput.credito, predOver.proyecciones);
  assert.equal(adaptOver.viable, false);
  assert.ok(adaptOver.motivoNoViabilidad && adaptOver.motivoNoViabilidad.length > 10);

  // Caso no viable por superar tasa máxima BCRP
  const bcrpInput = structuredClone(input);
  bcrpInput.credito.tea = 0.95;
  const tradBcrp = buildTraditionalSchedule(bcrpInput.credito, pred.proyecciones);
  assert.equal(tradBcrp.viable, false);
  assert.ok(tradBcrp.motivoNoViabilidad?.includes("BCRP"));

  // Si falta parámetro de seguro habilitado, TCEA no se inventa (null)
  const missingInsInput = structuredClone(input);
  missingInsInput.credito.productoConfig.desgravamenHabilitado = true;
  missingInsInput.credito.productoConfig.tasaAnualDesgravamen = 0;
  const tradMissing = buildTraditionalSchedule(missingInsInput.credito, pred.proyecciones);
  assert.equal(tradMissing.tcea, null);

  // Periodos irregulares (45 días) calculan TCEA correctamente
  const irInput = structuredClone(input);
  irInput.credito.frecuenciaPagoDias = 45;
  const pred45 = runPredictiveEngine(irInput);
  const trad45 = buildTraditionalSchedule(irInput.credito, pred45.proyecciones);
  assert.ok(trad45.cuotas.every((c) => c.diasPeriodo === 45));
  const tcea45 = calcularTCEA(irInput.credito.montoSolicitado, trad45.cuotas);
  assert.ok(tcea45 !== null && tcea45 > 0.2);
});

test("Simulador de escenarios externos altera ventas/costos y etiqueta escenario hipotético", () => {
  const profile = getSyntheticProfiles()[0];
  const pred = runPredictiveEngine(profile.input);
  const sim = runExternalShockSimulation(profile.input, pred, {
    fenomeno: "Fenómeno El Niño",
    intensidad: "Severo",
  });

  assert.equal(sim.esEscenarioHipotetico, true);
  assert.ok(sim.impactoVentasPct < 0);
  assert.ok(sim.impactoCostosPct > 0);
  assert.ok(sim.predictivoEstresado.ventasTotalesProyectadas < pred.ventasTotalesProyectadas);
});

test("Indicadores de validación sintética calculan métricas reales sobre muestra reservada", () => {
  const ind = computeSyntheticValidationIndicators();
  assert.equal(ind.totalPerfilesBase, 1000);
  assert.equal(ind.perfilesPruebaHoldout, 200);
  assert.ok(ind.maePredictivo > 0);
  assert.ok(ind.wapePredictivoPct > 0 && ind.wapePredictivoPct < 100);
  assert.ok(ind.tiempoPromedioMs >= 0);
});
