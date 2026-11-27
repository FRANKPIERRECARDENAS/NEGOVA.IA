import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Avanza un contador discreto de etapas internas (0 -> maxStep) al montar el componente,
 * respetando la preferencia de movimiento reducido del sistema.
 */
export function useTimedRevealStep(maxStep: number, intervalMs = 460): number {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState<number>(() => (reduced ? maxStep : 0));

  useEffect(() => {
    if (reduced) {
      setStep(maxStep);
      return;
    }
    setStep(0);
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      setStep(current);
      if (current >= maxStep) {
        window.clearInterval(timer);
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [maxStep, intervalMs, reduced]);

  return step;
}

/**
 * Interpola suavemente un valor numérico de 0 a 1 en `durationMs` ms.
 */
export function useAnimatedProgress(durationMs = 900, delayMs = 120): number {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState<number>(() => (reduced ? 1 : 0));

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    setProgress(0);
    let rafId = 0;
    let start: number | null = null;
    const timeoutId = window.setTimeout(() => {
      const tick = (ts: number) => {
        if (start === null) start = ts;
        const elapsed = ts - start;
        const raw = Math.min(1, elapsed / durationMs);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - raw, 3);
        setProgress(eased);
        if (raw < 1) {
          rafId = window.requestAnimationFrame(tick);
        }
      };
      rafId = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [durationMs, delayMs, reduced]);

  return progress;
}
