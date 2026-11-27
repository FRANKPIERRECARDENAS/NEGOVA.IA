import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ONBOARDING_SCENES,
  TOTAL_ONBOARDING_SCENES,
  formatProgressLabel,
  nextSceneIndex,
  prevSceneIndex,
} from "./onboardingLogic";
import { Illustration01Know } from "./scenes/Illustration01Know";
import { Illustration02Predict } from "./scenes/Illustration02Predict";
import { Illustration03Optimize } from "./scenes/Illustration03Optimize";
import { Illustration04Anticipate } from "./scenes/Illustration04Anticipate";
import { Illustration05Decide } from "./scenes/Illustration05Decide";

interface NegovaExperienceProps {
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function NegovaExperience({ onComplete, onSkip }: NegovaExperienceProps) {
  const [sceneIndex, setSceneIndex] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const activeScene = ONBOARDING_SCENES[sceneIndex];
  const isLastScene = sceneIndex === TOTAL_ONBOARDING_SCENES - 1;
  const progressLabel = formatProgressLabel(sceneIndex, TOTAL_ONBOARDING_SCENES);

  const handleNext = () => {
    if (isLastScene) {
      onComplete();
      return;
    }
    setDirection(1);
    setSceneIndex((prev) => nextSceneIndex(prev, TOTAL_ONBOARDING_SCENES));
  };

  const handlePrev = () => {
    if (sceneIndex <= 0) return;
    setDirection(-1);
    setSceneIndex((prev) => prevSceneIndex(prev));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSkip();
      } else if (e.key === "ArrowRight") {
        if (sceneIndex < TOTAL_ONBOARDING_SCENES - 1) {
          setDirection(1);
          setSceneIndex((prev) => nextSceneIndex(prev, TOTAL_ONBOARDING_SCENES));
        }
      } else if (e.key === "ArrowLeft") {
        if (sceneIndex > 0) {
          setDirection(-1);
          setSceneIndex((prev) => prevSceneIndex(prev));
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sceneIndex, onSkip]);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="min-h-screen flex flex-col justify-between bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200"
        data-testid="negova-experience"
      >
        {/* Barra superior mínima: solo indicador discreto 01/05 y enlace Saltar recorrido */}
        <header className="w-full max-w-5xl mx-auto px-6 sm:px-10 pt-6 sm:pt-8 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-xs tracking-widest tabular-nums text-[var(--text-muted)]"
              aria-label={`Pantalla ${sceneIndex + 1} de ${TOTAL_ONBOARDING_SCENES}`}
            >
              {progressLabel}
            </span>
            <span className="w-10 h-px bg-[var(--border-hairline)] overflow-hidden relative block" aria-hidden="true">
              <motion.span
                className="absolute inset-y-0 left-0 bg-[var(--accent-teal)]"
                initial={false}
                animate={{ width: `${((sceneIndex + 1) / TOTAL_ONBOARDING_SCENES) * 100}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1.5 px-1 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] rounded"
          >
            Saltar recorrido
          </button>
        </header>

        {/* Escenario central con amplio espacio negativo */}
        <main className="flex-1 flex items-center justify-center px-6 sm:px-10 py-4 sm:py-6">
          <div className="w-full max-w-4xl mx-auto">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.section
                key={activeScene.stageCode}
                custom={direction}
                initial={{ opacity: 0, x: direction * 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -22 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center"
                data-testid={`onboarding-scene-${activeScene.stageCode}`}
              >
                {/* 1. Ilustración protagonista grande y limpia */}
                <div className="w-full max-w-[820px] mx-auto">
                  {sceneIndex === 0 && <Illustration01Know />}
                  {sceneIndex === 1 && <Illustration02Predict />}
                  {sceneIndex === 2 && <Illustration03Optimize />}
                  {sceneIndex === 3 && <Illustration04Anticipate />}
                  {sceneIndex === 4 && <Illustration05Decide />}
                </div>

                {/* 2. Frase principal breve + 3. Descripción de máximo una línea */}
                <div className="mt-5 sm:mt-7 max-w-2xl mx-auto space-y-2.5">
                  <h1
                    className="font-display font-medium tracking-tight text-[var(--text-primary)] leading-[1.12] text-balance"
                    style={{ fontSize: "clamp(1.75rem, 3.3vw, 2.65rem)" }}
                  >
                    {activeScene.title}
                  </h1>
                  <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                    {activeScene.description}
                  </p>
                </div>
              </motion.section>
            </AnimatePresence>
          </div>
        </main>

        {/* Navegación inferior discreta */}
        <footer className="w-full max-w-5xl mx-auto px-6 sm:px-10 pb-8 sm:pb-10 pt-3 flex items-center justify-between gap-4">
          <div className="min-w-[96px]">
            {sceneIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
              >
                Anterior
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-7 py-2.5 text-sm font-medium text-[var(--text-on-ink)] bg-[var(--bg-ink)] dark:bg-[var(--accent-teal)] dark:text-[#060D18] hover:opacity-90 active:scale-[0.99] rounded-full transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
          >
            {isLastScene ? "Comenzar" : "Continuar"}
          </button>
        </footer>
      </div>
    </MotionConfig>
  );
}
