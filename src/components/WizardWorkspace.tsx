import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookmarkCheck, Check, Database, RotateCcw } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { runExternalShockSimulation, runFullAnalysis } from "../engines/shockSimulator";
import {
  AnalisisInput,
  CasoGuardado,
  EstadoComite,
  ParametrosFenomeno,
  ResultadoSimulacionExterna,
} from "../types/negova";
import { Step1Negocio } from "./steps/Step1Negocio";
import { Step2Ventas } from "./steps/Step2Ventas";
import { Step3Costos } from "./steps/Step3Costos";
import { Step4Capacidad } from "./steps/Step4Capacidad";
import { Step5Credito } from "./steps/Step5Credito";
import { Step6Predictivo } from "./steps/Step6Predictivo";
import { Step7Comparacion } from "./steps/Step7Comparacion";
import { Step8Simulacion } from "./steps/Step8Simulacion";
import { Step9Informe } from "./steps/Step9Informe";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggleButton } from "./ThemeToggleButton";

const STEPS = [
  { id: 1, num: "01", label: "Negocio" },
  { id: 2, num: "02", label: "Ventas" },
  { id: 3, num: "03", label: "Costos" },
  { id: 4, num: "04", label: "Capacidad" },
  { id: 5, num: "05", label: "Crédito" },
  { id: 6, num: "06", label: "Predictivo" },
  { id: 7, num: "07", label: "Cronogramas" },
  { id: 8, num: "08", label: "Escenarios" },
  { id: 9, num: "09", label: "Informe" },
] as const;

interface WizardWorkspaceProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  input: AnalisisInput;
  onUpdateInput: (updated: AnalisisInput) => void;
  onResetBlank: () => void;
  onGoLanding: () => void;
  onOpenDemoCases: () => void;
  onOpenIndicators: () => void;
  onOpenExperience: () => void;
  savedCases: CasoGuardado[];
  onSaveCase: (estadoComite: EstadoComite) => void;
  onLoadSavedCase: (caso: CasoGuardado) => void;
  savedNotification: string | null;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function WizardWorkspace({
  theme,
  onToggleTheme,
  input,
  onUpdateInput,
  onResetBlank,
  onGoLanding,
  onOpenDemoCases,
  onOpenIndicators,
  onOpenExperience,
  savedCases,
  onSaveCase,
  onLoadSavedCase,
  savedNotification,
  currentStep,
  onStepChange,
}: WizardWorkspaceProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [maxVisitedStep, setMaxVisitedStep] = useState<number>(currentStep);
  const [simulacion, setSimulacion] = useState<ResultadoSimulacionExterna | null>(null);
  const [estadoComite, setEstadoComite] = useState<EstadoComite>(
    "Generado por el Asesor de Negocios"
  );
  const [showSavedMenu, setShowSavedMenu] = useState(false);
  const activeStepBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMaxVisitedStep((prev) => Math.max(prev, currentStep));
    window.scrollTo({ top: 0 });
    activeStepBtnRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [currentStep]);

  useEffect(() => {
    setSimulacion(null);
    setErrors({});
  }, [input]);

  const { predictivo, comparacion } = useMemo(() => runFullAnalysis(input), [input]);

  const validateStep = (step: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (step === 1) {
      if (!input.negocio.nombreComercial.trim()) {
        nextErrors.nombreComercial = "Ingresa un nombre comercial o referencia.";
      }
      if (!input.negocio.actividadEspecifica.trim()) {
        nextErrors.actividadEspecifica = "Especifica la actividad económica.";
      }
      if (!input.negocio.modeloNegocio.trim()) {
        nextErrors.modeloNegocio = "Describe brevemente el modelo de negocio.";
      }
      if (!input.negocio.distritoZona.trim()) {
        nextErrors.distritoZona = "Indica el distrito o zona geográfica.";
      }
    } else if (step === 2) {
      const validMonths = input.ventas.filter((v) => v.monto !== null && v.monto > 0);
      if (validMonths.length === 0) {
        nextErrors.ventas =
          "Ingresa al menos un mes de ventas o selecciona un perfil sintético precargado para continuar.";
      }
    } else if (step === 3) {
      if (
        input.costos.tipoEstructura === "Proporcional al ciclo" &&
        input.costos.costoAdquisicionProduccionPct >= 100
      ) {
        nextErrors.costos = "El costo de adquisición no puede ser igual o mayor al 100% de las ventas.";
      }
    } else if (step === 5) {
      const cfg = input.credito.productoConfig;
      if (input.credito.montoSolicitado <= 0) {
        nextErrors.credito = "El monto solicitado debe ser mayor a cero.";
      } else if (cfg.factorMaximoCapacidadPago <= 0 || cfg.factorMaximoCapacidadPago >= 1) {
        nextErrors.credito = "El factor máximo de capacidad debe ser menor que 1.";
      } else if (input.credito.tea > cfg.teaMaximaBCRP) {
        nextErrors.credito = `La TEA (${(input.credito.tea * 100).toFixed(2)}%) supera la tasa máxima aplicable del BCRP (${(cfg.teaMaximaBCRP * 100).toFixed(2)}%).`;
      } else if (input.credito.tea < cfg.teaMinima) {
        nextErrors.credito = `La TEA mínima del producto es ${(cfg.teaMinima * 100).toFixed(2)}%.`;
      } else if (
        input.credito.plazoMeses < cfg.plazoMinimoMeses ||
        input.credito.plazoMeses > cfg.plazoMaximoMeses
      ) {
        nextErrors.credito = `El plazo permitido para este producto es de ${cfg.plazoMinimoMeses} a ${cfg.plazoMaximoMeses} meses.`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 9) {
      const next = currentStep + 1;
      onStepChange(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setErrors({});
      onStepChange(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRunSimulation = (params: ParametrosFenomeno) => {
    const result = runExternalShockSimulation(input, predictivo, params);
    setSimulacion(result);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200 print:min-h-0 print:bg-white">
        {/* Cabecera del espacio de análisis */}
        <header className="no-print bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] sm:sticky sm:top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onGoLanding}
                className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0"
              >
                <BrandLogo size="md" className="w-6 h-6" />
                <span>NEGOVA.IA</span>
              </button>
              <span className="text-[var(--border-strong)] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)] truncate hidden md:inline">
                {input.idCaso} {input.esSintetico ? "· Perfil sintético" : "· Evaluación en curso"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />

              <button
                type="button"
                onClick={onOpenDemoCases}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--accent-teal)] bg-[var(--accent-teal-soft)] border border-[var(--accent-teal)]/25 rounded-lg hover:opacity-85 transition-opacity whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Casos demo</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSavedMenu((s) => !s)}
                  aria-expanded={showSavedMenu}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] rounded-lg transition-colors whitespace-nowrap"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Guardados ({savedCases.length})
                </button>

                {showSavedMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl shadow-xl p-2 z-40">
                    <p className="text-[11px] font-mono text-[var(--text-muted)] px-2 py-1">
                      Casos guardados
                    </p>
                    {savedCases.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] px-2 py-3">
                        Sin casos guardados. Guarda desde el Paso 9.
                      </p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto divide-y divide-[var(--border-hairline)]">
                        {savedCases.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              onLoadSavedCase(c);
                              setEstadoComite(c.estadoComite);
                              setShowSavedMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
                          >
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {c.input.negocio.nombreComercial}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {c.id} · {c.estadoComite}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenExperience}
                className="inline-flex px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
              >
                Recorrido
              </button>

              <button
                type="button"
                onClick={onOpenIndicators}
                className="hidden md:inline-flex px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
              >
                Indicadores
              </button>

              <button
                type="button"
                onClick={() => {
                  onResetBlank();
                  setErrors({});
                  onStepChange(1);
                }}
                aria-label="Reiniciar análisis nuevo"
                title="Nuevo análisis en blanco"
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Barra secuencial de progreso de 9 pasos */}
          <nav
            aria-label="Progreso del análisis"
            className="max-w-6xl mx-auto px-4 sm:px-6 border-t border-[var(--border-hairline)] overflow-x-auto"
          >
            <ol className="flex items-center gap-1 min-w-max">
              {STEPS.map((st) => {
                const isCurrent = st.id === currentStep;
                const isCompleted = st.id < currentStep;
                const canJump = st.id <= maxVisitedStep || input.esSintetico;
                return (
                  <li key={st.id}>
                    <button
                      ref={isCurrent ? activeStepBtnRef : null}
                      type="button"
                      disabled={!canJump}
                      onClick={() => {
                        if (!canJump) return;
                        if (st.id > currentStep && !validateStep(currentStep)) return;
                        setErrors({});
                        onStepChange(st.id);
                      }}
                      className={`relative px-3 py-2.5 text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        isCurrent
                          ? "text-[var(--text-primary)] font-semibold"
                          : isCompleted
                          ? "text-[var(--accent-teal)] font-medium hover:bg-[var(--bg-elevated)]"
                          : canJump
                          ? "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          : "text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <span className="font-mono text-[11px] tabular-nums">
                        {isCompleted ? (
                          <Check className="w-3 h-3 inline text-[var(--accent-teal)]" aria-hidden="true" />
                        ) : (
                          `${st.id}.`
                        )}
                      </span>
                      <span>{st.label}</span>
                      {isCurrent && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent-teal)]"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </header>

        {/* Lienzo principal de la etapa activa */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 lg:py-10 print:max-w-none print:p-0">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 lg:p-10 print:bg-white print:border-0 print:rounded-none print:p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                {currentStep === 1 && (
                  <Step1Negocio
                    negocio={input.negocio}
                    onChange={(negocio) => {
                      setErrors({});
                      onUpdateInput({ ...input, negocio });
                    }}
                    errors={errors}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Ventas
                    ventas={input.ventas}
                    onChange={(ventas) => {
                      setErrors({});
                      onUpdateInput({ ...input, ventas });
                    }}
                    onOpenDemoCases={onOpenDemoCases}
                    error={errors.ventas}
                  />
                )}
                {currentStep === 3 && (
                  <Step3Costos
                    costos={input.costos}
                    ventas={input.ventas}
                    formalidad={input.negocio.formalidad}
                    onChange={(costos) => {
                      setErrors({});
                      onUpdateInput({ ...input, costos });
                    }}
                    error={errors.costos}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Capacidad
                    capacidad={input.capacidad}
                    formalidad={input.negocio.formalidad}
                    onChange={(capacidad) => onUpdateInput({ ...input, capacidad })}
                  />
                )}
                {currentStep === 5 && (
                  <Step5Credito
                    credito={input.credito}
                    onChange={(credito) => {
                      setErrors({});
                      onUpdateInput({ ...input, credito });
                    }}
                    error={errors.credito}
                  />
                )}
                {currentStep === 6 && (
                  <Step6Predictivo input={input} predictivo={predictivo} />
                )}
                {currentStep === 7 && (
                  <Step7Comparacion
                    comparacion={comparacion}
                    factorMaximo={input.credito.productoConfig.factorMaximoCapacidadPago}
                  />
                )}
                {currentStep === 8 && (
                  <Step8Simulacion
                    baselinePredictivo={predictivo}
                    simulacion={simulacion}
                    onRunSimulation={handleRunSimulation}
                    onClearSimulation={() => setSimulacion(null)}
                  />
                )}
                {currentStep === 9 && (
                  <Step9Informe
                    input={input}
                    predictivo={predictivo}
                    comparacion={comparacion}
                    simulacion={simulacion}
                    estadoComite={estadoComite}
                    onChangeEstadoComite={setEstadoComite}
                    onSaveCase={() => onSaveCase(estadoComite)}
                    savedNotification={savedNotification}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navegación inferior de pasos */}
            <div className="no-print mt-10 pt-6 border-t border-[var(--border-hairline)] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] rounded-lg disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Regresar
              </button>

              <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
                Paso {currentStep} de {STEPS.length}
              </span>

              {currentStep < 9 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--text-on-ink)] bg-[var(--bg-ink)] dark:bg-[var(--accent-teal)] dark:text-[#060D18] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenIndicators}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--accent-teal)] bg-[var(--accent-teal-soft)] border border-[var(--accent-teal)]/30 rounded-lg hover:opacity-85 transition-opacity whitespace-nowrap shrink-0"
                >
                  Ver Indicadores de validación
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
