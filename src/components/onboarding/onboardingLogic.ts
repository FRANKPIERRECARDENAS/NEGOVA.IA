export const ONBOARDING_STORAGE_KEY = "negova_experience_seen_v1";
export const TOTAL_ONBOARDING_SCENES = 5;

export type OnboardingStatus = "unseen" | "completed" | "skipped";

export interface OnboardingSceneMeta {
  index: number;
  stageCode: string;
  eyebrow: string;
  title: string;
  description: string;
}

export const ONBOARDING_SCENES: readonly OnboardingSceneMeta[] = [
  {
    index: 0,
    stageCode: "01",
    eyebrow: "Conoce",
    title: "Todo comienza con entender el negocio.",
    description: "Conocemos su actividad y comportamiento económico.",
  },
  {
    index: 1,
    stageCode: "02",
    eyebrow: "Predice",
    title: "Descubrimos el ritmo de cada negocio.",
    description: "Analizamos sus ingresos, tendencias y estacionalidad.",
  },
  {
    index: 2,
    stageCode: "03",
    eyebrow: "Optimiza",
    title: "El crédito se adapta a su realidad.",
    description: "Diseñamos cuotas según su capacidad económica.",
  },
  {
    index: 3,
    stageCode: "04",
    eyebrow: "Anticipa",
    title: "Incluso ante lo inesperado.",
    description: "Simulamos escenarios que pueden afectar su economía.",
  },
  {
    index: 4,
    stageCode: "05",
    eyebrow: "Decide",
    title: "Mejores datos. Mejores decisiones.",
    description: "Generamos información para evaluar cada propuesta.",
  },
] as const;

export function readOnboardingStatus(
  storage?: Pick<Storage, "getItem"> | null
): OnboardingStatus {
  if (!storage) return "unseen";
  try {
    const raw = storage.getItem(ONBOARDING_STORAGE_KEY);
    if (raw === "completed" || raw === "skipped") return raw;
  } catch {
    return "unseen";
  }
  return "unseen";
}

export function saveOnboardingStatus(
  status: "completed" | "skipped",
  storage?: Pick<Storage, "setItem"> | null
): void {
  if (!storage) return;
  try {
    storage.setItem(ONBOARDING_STORAGE_KEY, status);
  } catch {
    // Ignorar errores de almacenamiento privado o cuota excedida
  }
}

export function shouldAutoShowOnboarding(
  status: OnboardingStatus,
  search: string
): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  if (params.get("autostart") === "1") {
    return false;
  }
  return status === "unseen";
}

export function nextSceneIndex(
  current: number,
  total: number = TOTAL_ONBOARDING_SCENES
): number {
  if (total <= 0) return 0;
  return Math.min(total - 1, Math.max(0, current + 1));
}

export function prevSceneIndex(current: number): number {
  return Math.max(0, current - 1);
}

export function formatProgressLabel(
  currentIndex: number,
  total: number = TOTAL_ONBOARDING_SCENES
): string {
  const step = String(Math.min(total, Math.max(1, currentIndex + 1))).padStart(2, "0");
  const max = String(total).padStart(2, "0");
  return `${step}/${max}`;
}

export function buildSmoothSvgPath(
  values: readonly number[],
  width: number,
  height: number,
  padY = 14,
  padX = 0
): string {
  if (values.length === 0) return "";
  const usableW = Math.max(1, width - padX * 2);
  const usableH = Math.max(1, height - padY * 2);
  const pts = values.map((v, i) => ({
    x: padX + (values.length === 1 ? usableW / 2 : (i / (values.length - 1)) * usableW),
    y: height - padY - (Math.max(0, Math.min(100, v)) / 100) * usableH,
  }));

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}
