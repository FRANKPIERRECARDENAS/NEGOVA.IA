import { useEffect, useRef, useState } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { HeroExplainer } from "./HeroExplainer";
import { ThemeToggleButton } from "./ThemeToggleButton";

interface LandingPageProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onStartAnalysis: () => void;
  onOpenIndicators: () => void;
  onExploreDemoCases: () => void;
}

const HERO_VIDEO_SOURCES = [
  "/assets/aistudio/204306-923909642_medium_bc1a5949.mp4",
  "/public/assets/aistudio/204306-923909642_medium_bc1a5949.mp4",
];

export function LandingPage({
  theme,
  onToggleTheme,
  onStartAnalysis,
  onOpenIndicators,
  onExploreDemoCases,
}: LandingPageProps) {
  const [sourceIdx, setSourceIdx] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || videoFailed) return;
    el.muted = true;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Ignorar bloqueo de autoplay si ocurre en algún navegador
      });
    }
  }, [sourceIdx, videoFailed]);

  const handleVideoError = () => {
    if (sourceIdx + 1 < HERO_VIDEO_SOURCES.length) {
      setSourceIdx((prev) => prev + 1);
    } else {
      setVideoFailed(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Encabezado minimalista */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 sm:gap-8">
          <a
            href="#inicio"
            className="text-lg font-bold tracking-tight text-[#0B1F3A] dark:text-white whitespace-nowrap shrink-0"
          >
            NEGOVA.IA
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#como-funciona"
              className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Cómo funciona
            </a>
            <button
              type="button"
              onClick={onExploreDemoCases}
              className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Casos sintéticos
            </button>
            <button
              type="button"
              onClick={onOpenIndicators}
              className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Indicadores
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={onStartAnalysis}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0B1F3A] dark:bg-teal-600 rounded-lg hover:bg-[#143058] dark:hover:bg-teal-500 transition-colors whitespace-nowrap shrink-0"
            >
              Iniciar análisis
            </button>
          </div>
        </div>
      </header>

      {/* HERO minimalista con video de fondo */}
      <main
        id="inicio"
        className="relative flex-1 flex flex-col justify-center overflow-hidden bg-[#061529] dark:bg-slate-950"
      >
        {!videoFailed && (
          <video
            ref={videoRef}
            key={HERO_VIDEO_SOURCES[sourceIdx]}
            src={HERO_VIDEO_SOURCES[sourceIdx]}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onError={handleVideoError}
            className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none select-none"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] bg-gradient-to-br from-[#061529]/72 via-[#0B1F3A]/52 to-[#082832]/40 dark:from-slate-950/78 dark:via-[#0B1F3A]/58 dark:to-slate-950/48"
        />

        <section className="relative z-10 max-w-6xl mx-auto w-full px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-medium text-teal-300 tracking-wide">
                El crédito se adapta al ritmo de tu negocio · Desafío NEG-01
              </p>

              <h1
                className="font-bold tracking-tight text-white leading-[1.12] text-balance"
                style={{ fontSize: "clamp(2.15rem, 3.6vw, 3.25rem)" }}
              >
                Cada negocio tiene su propio ritmo. Su crédito también debería tenerlo.
              </h1>

              <p className="text-base lg:text-lg text-slate-200 leading-relaxed max-w-xl">
                Inteligencia predictiva que transforma el comportamiento económico de cada
                negocio en planes de pago personalizados.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={onStartAnalysis}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#061529] bg-teal-400 rounded-xl hover:bg-teal-300 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  Analizar un negocio
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-white/10 border border-white/25 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <PlayCircle className="w-4 h-4 text-teal-300" />
                  Ver cómo funciona
                </a>
              </div>
            </div>

            <div id="como-funciona" className="lg:col-span-6">
              <div className="rounded-2xl shadow-2xl ring-1 ring-white/15">
                <HeroExplainer />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Pie de página discreto */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>
            NEGOVA.IA · Prototipo desarrollado para el Cajathon 2026 (Desafío NEG-01) · Base
            de pruebas sintética reproducible
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onExploreDemoCases}
              className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors"
            >
              Explorar casos de demostración
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenIndicators}
              className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors"
            >
              Indicadores de validación
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
