import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookmarkCheck, Database, RotateCcw } from "lucide-react";
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
import { ThemeToggleButton } from "./ThemeToggleButton";

const STEPS = [
  { id: 1, label: "Negocio" },
  { id: 2, label: "Ventas" },
  { id: 3, label: "Costos" },
  { id: 4, label: "Capacidad" },
  { id: 5, label: "Crédito" },
  { id: 6, label: "Predictivo" },
  { id: 7, label: "Cronogramas" },
  { id: 8, label: "Escenarios" },
  { id: 9, label: "Informe" },
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

  useEffect(() => {
    setMaxVisitedStep((prev) => Math.max(prev, currentStep));
    window.scrollTo({ top: 0 });
  }, [currentStep]);

  // Limpiar simulación y errores previos si cambia el caso base
  useEffect(() => {
    setSimulacion(null);
    setErrors({});
  }, [input.idCaso, input.credito.montoSolicitado, input.credito.plazoMeses, input.credito.tea]);

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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Cabecera del espacio de análisis */}
      <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sm:sticky sm:top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onGoLanding}
              className="text-base sm:text-lg font-bold tracking-tight text-[#0B1F3A] dark:text-white whitespace-nowrap shrink-0"
            >
              NEGOVA.IA
            </button>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline" aria-hidden="true">
              /
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden md:inline">
              {input.idCaso} {input.esSintetico ? "· Perfil sintético" : "· Evaluación en curso"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />

            <button
              type="button"
              onClick={onOpenDemoCases}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Casos demo</span>
              <span className="hidden sm:inline">Explorar casos de demostración</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSavedMenu((s) => !s)}
                aria-expanded={showSavedMenu}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                Guardados ({savedCases.length})
              </button>

              {showSavedMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 z-40">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-1">
                    Casos guardados localmente
                  </p>
                  {savedCases.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-2 py-3">
                      Aún no hay casos guardados. Puedes guardar desde el Informe (Paso 9).
                    </p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {savedCases.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onLoadSavedCase(c);
                            setEstadoComite(c.estadoComite);
                            setShowSavedMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <p className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                            {c.input.negocio.nombreComercial}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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
              onClick={onOpenIndicators}
              className="hidden md:inline-flex px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap"
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
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra secuencial de progreso de 9 pasos */}
        <nav
          aria-label="Progreso del análisis"
          className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 border-t border-slate-100 dark:border-slate-800 overflow-x-auto"
        >
          <ol className="flex items-center gap-1.5 min-w-max">
            {STEPS.map((st) => {
              const isCurrent = st.id === currentStep;
              const isCompleted = st.id < currentStep;
              const canJump = st.id <= maxVisitedStep || input.esSintetico;
              return (
                <li key={st.id}>
                  <button
                    type="button"
                    disabled={!canJump}
                    onClick={() => {
                      if (!canJump) return;
                      if (st.id > currentStep && !validateStep(currentStep)) return;
                      setErrors({});
                      onStepChange(st.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isCurrent
                        ? "bg-[#0B1F3A] dark:bg-teal-600 text-white font-semibold"
                        : isCompleted
                        ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60"
                        : canJump
                        ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <span className="font-mono text-[11px]">{st.id}.</span>
                    <span>{st.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      {/* Contenido de la etapa activa */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-2xs">
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

          {/* Navegación inferior de pasos */}
          <div className="no-print mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Regresar
            </button>

            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Paso {currentStep} de {STEPS.length}
            </span>

            {currentStep < 9 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0B1F3A] dark:bg-teal-600 rounded-xl hover:bg-[#143058] dark:hover:bg-teal-500 transition-colors"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenIndicators}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
              >
                Ver Indicadores de validación
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
