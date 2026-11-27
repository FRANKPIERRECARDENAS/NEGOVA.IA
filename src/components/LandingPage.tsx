import { ArrowRight } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { HeroExplainer } from "./HeroExplainer";
import { PrincipleIllustration } from "./PrincipleIllustrations";
import { ThemeToggleButton } from "./ThemeToggleButton";

interface LandingPageProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onStartAnalysis: () => void;
  onOpenIndicators: () => void;
  onExploreDemoCases: () => void;
  onOpenExperience: () => void;
}

const PRINCIPIOS = [
  {
    index: "01" as const,
    titulo: "Ritmo económico",
    frase: "Medimos la liquidez real detrás de cada campaña.",
  },
  {
    index: "02" as const,
    titulo: "Inteligencia predictiva",
    frase: "Proyectamos liquidez futura con certeza.",
  },
  {
    index: "03" as const,
    titulo: "Adaptación financiera",
    frase: "Ajustamos cada cuota a la capacidad real del mes.",
  },
] as const;

export function LandingPage({
  theme,
  onToggleTheme,
  onStartAnalysis,
  onOpenIndicators,
  onExploreDemoCases,
  onOpenExperience,
}: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Barra superior institucional */}
      <header className="w-full border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/92 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-6">
          <a
            href="#inicio"
            className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0"
          >
            <img
              src="/assets/aistudio/Logotipo_tecnol_gico_Negova.IA_956218e9.png"
              alt="Logotipo de NEGOVA.IA"
              className="w-[34px] h-[34px] object-contain shrink-0 select-none"
              decoding="async"
            />
            <span>NEGOVA.IA</span>
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]"
          >
            <a
              href="#como-funciona"
              className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Motor financiero
            </a>
            <button
              type="button"
              onClick={onExploreDemoCases}
              className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Casos sintéticos
            </button>
            <button
              type="button"
              onClick={onOpenIndicators}
              className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Indicadores
            </button>
            <button
              type="button"
              onClick={onOpenExperience}
              className="hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Ver recorrido
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={onStartAnalysis}
              className="px-4 py-2 text-sm font-semibold text-[var(--text-on-ink)] bg-[var(--bg-ink)] dark:bg-[var(--accent-teal)] dark:text-[#060D18] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
            >
              Iniciar análisis
            </button>
          </div>
        </div>
      </header>

      {/* HERO editorial con retícula técnica y visualización del motor */}
      <main id="inicio" className="flex-1">
        <section className="relative bg-technical-grid border-b border-[var(--border-hairline)]">
          <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <h1
                  className="font-display font-semibold tracking-tight text-[var(--text-primary)] leading-[1.08] text-balance"
                  style={{ fontSize: "clamp(2.35rem, 4.1vw, 3.6rem)" }}
                >
                  Cada negocio tiene su propio ritmo. Su crédito también.
                </h1>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={onStartAnalysis}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white dark:text-[#060D18] bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-hover)] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
                  >
                    Analizar un negocio
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onExploreDemoCases}
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-surface)] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Explorar casos sintéticos
                  </button>
                </div>

                <div className="md:hidden">
                  <button
                    type="button"
                    onClick={onOpenExperience}
                    className="text-xs font-medium text-[var(--accent-teal)] hover:underline underline-offset-4 transition-colors"
                  >
                    Ver recorrido introductorio →
                  </button>
                </div>
              </div>

              <div id="como-funciona" className="lg:col-span-7">
                <HeroExplainer />
              </div>
            </div>
          </div>
        </section>

        {/* Arquitectura conceptual: tres pilares con separadores editoriales */}
        <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20 border-b border-[var(--border-hairline)]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-mono text-[var(--accent-teal)]">Metodología</p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] mt-1.5 text-balance">
                Del comportamiento real al cronograma verificable
              </h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] max-w-md">
              El modelo recomienda y documenta la evidencia matemática; la decisión crediticia
              permanece en manos del Asesor de Riesgos y el Comité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border-hairline)] border-t border-b border-[var(--border-hairline)]">
            {PRINCIPIOS.map((item) => (
              <div key={item.index} className="py-8 md:py-10 md:px-8 first:md:pl-0 last:md:pr-0 flex flex-col gap-5">
                <div className="space-y-1.5">
                  <span className="font-mono text-xs text-[var(--accent-teal)] block">
                    {item.index}
                  </span>
                  <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                    {item.titulo}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {item.frase}
                  </p>
                </div>
                <PrincipleIllustration index={item.index} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Pie de página editorial */}
      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <p>
              NEGOVA.IA · Prototipo Cajathon 2026 (Desafío NEG-01) · Base de pruebas sintética
              reproducible
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onOpenExperience}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Ver recorrido
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onExploreDemoCases}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Casos sintéticos
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenIndicators}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Indicadores de validación
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
