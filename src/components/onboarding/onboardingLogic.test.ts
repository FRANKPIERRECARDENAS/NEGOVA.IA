import test from "node:test";
import assert from "node:assert/strict";
import {
  ONBOARDING_SCENES,
  ONBOARDING_STORAGE_KEY,
  buildSmoothSvgPath,
  formatProgressLabel,
  nextSceneIndex,
  prevSceneIndex,
  readOnboardingStatus,
  saveOnboardingStatus,
  shouldAutoShowOnboarding,
} from "./onboardingLogic";

test("1. Las 5 pantallas tienen las frases y descripciones exactas", () => {
  assert.equal(ONBOARDING_SCENES.length, 5);
  assert.deepEqual(
    ONBOARDING_SCENES.map((s) => s.title),
    [
      "Todo comienza con entender el negocio.",
      "Descubrimos el ritmo de cada negocio.",
      "El crédito se adapta a su realidad.",
      "Incluso ante lo inesperado.",
      "Mejores datos. Mejores decisiones.",
    ]
  );
  assert.deepEqual(
    ONBOARDING_SCENES.map((s) => s.description),
    [
      "Conocemos su actividad y comportamiento económico.",
      "Analizamos sus ingresos, tendencias y estacionalidad.",
      "Diseñamos cuotas según su capacidad económica.",
      "Simulamos escenarios que pueden afectar su economía.",
      "Generamos información para evaluar cada propuesta.",
    ]
  );
});

test("2. Indicador de progreso y navegación respetan formato 01/05 y límites", () => {
  assert.equal(formatProgressLabel(0), "01/05");
  assert.equal(formatProgressLabel(4), "05/05");
  assert.equal(prevSceneIndex(0), 0);
  assert.equal(prevSceneIndex(3), 2);
  assert.equal(nextSceneIndex(0), 1);
  assert.equal(nextSceneIndex(4), 4);
});

test("3. Persistencia local controla primera visita y salto", () => {
  const mem = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
  };

  assert.equal(readOnboardingStatus(mockStorage), "unseen");
  assert.equal(shouldAutoShowOnboarding("unseen", ""), true);
  assert.equal(shouldAutoShowOnboarding("unseen", "?autostart=1"), false);

  saveOnboardingStatus("skipped", mockStorage);
  assert.equal(mem.get(ONBOARDING_STORAGE_KEY), "skipped");
  assert.equal(shouldAutoShowOnboarding("skipped", ""), false);

  saveOnboardingStatus("completed", mockStorage);
  assert.equal(readOnboardingStatus(mockStorage), "completed");
});

test("4. Generador de curvas vectoriales produce trayectorias SVG válidas", () => {
  const path = buildSmoothSvgPath([20, 60, 90], 300, 120, 10, 0);
  assert.ok(path.startsWith("M "));
  assert.ok(path.includes(" C "));
});
