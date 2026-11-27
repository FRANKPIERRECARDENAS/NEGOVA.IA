import { useEffect, useState } from "react";
import { DemoCasesModal } from "./components/DemoCasesModal";
import { IndicadoresView } from "./components/IndicadoresView";
import { LandingPage } from "./components/LandingPage";
import { NegovaExperience } from "./components/onboarding/NegovaExperience";
import {
  readOnboardingStatus,
  saveOnboardingStatus,
  shouldAutoShowOnboarding,
} from "./components/onboarding/onboardingLogic";
import { WizardWorkspace } from "./components/WizardWorkspace";
import {
  ACTIVIDADES_POR_SECTOR,
  MESES_CORTOS,
  PRODUCTOS_ILUSTRATIVOS,
} from "./engines/catalogs";
import { AnalisisInput, CasoGuardado, EstadoComite, PerfilSintetico } from "./types/negova";

const STORAGE_ACTIVE_KEY = "negova_active_draft_v1";
const STORAGE_SAVED_KEY = "negova_saved_cases_v1";
const STORAGE_THEME_KEY = "negova_theme_v1";

function createBlankInput(): AnalisisInput {
  const defaultProd = PRODUCTOS_ILUSTRATIVOS[0];
  return {
    idCaso: `NEG-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}`,
    esSintetico: false,
    negocio: {
      nombreComercial: "",
      sector: "Comercio minorista",
      actividadEspecifica: ACTIVIDADES_POR_SECTOR["Comercio minorista"][0],
      modeloNegocio: "",
      departamento: "La Libertad",
      provincia: "Trujillo",
      distritoZona: "",
      tipoOperacion: "Comercial",
      formalidad: "Persona natural con negocio (NRUS / RER)",
    },
    ventas: MESES_CORTOS.map((etiquetaMes, mesIndice) => ({
      mesIndice,
      etiquetaMes,
      monto: null,
    })),
    costos: {
      tipoEstructura: "Proporcional al ciclo",
      costoAdquisicionProduccionPct: 58,
      costoAdquisicionMensualFijo: 9000,
      gastosOperativosMensuales: 2200,
      gastosTributariosMensuales: 0,
      tasaTributariaPct: 1.5,
      costosEstacionalesPorMes: Array(12).fill(1.0),
    },
    capacidad: {
      otrasFuentesIngresoMensual: 0,
      cuotasDeudasNegocioMensual: 0,
      cuotasDeudasPersonalesMensual: 0,
      cargaFamiliarMensual: 950,
      obligacionesVigentesDescripcion: "Sin cuotas vigentes reportadas",
      usaEstadosFinancierosAuditados: false,
      patrimonioNetoDeclarado: 35000,
    },
    credito: {
      productoId: defaultProd.id,
      productoConfig: { ...defaultProd },
      montoSolicitado: 18000,
      plazoMeses: 12,
      tea: 0.24,
      frecuenciaPagoDias: 30,
      permitirPeriodosIrregulares: true,
      fechaDesembolso: "2026-12-01",
    },
  };
}

export default function App() {
  const [view, setView] = useState<"landing" | "wizard" | "indicadores">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("autostart") === "1") return "wizard";
    }
    return "landing";
  });

  const [showExperience, setShowExperience] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const status = readOnboardingStatus(window.localStorage);
    return shouldAutoShowOnboarding(status, window.location.search);
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [input, setInput] = useState<AnalisisInput>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_ACTIVE_KEY);
        if (raw) {
          return JSON.parse(raw) as AnalisisInput;
        }
      } catch {
        // Ignorar si almacenamiento no está disponible
      }
    }
    return createBlankInput();
  });

  const [savedCases, setSavedCases] = useState<CasoGuardado[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_SAVED_KEY);
        if (raw) return JSON.parse(raw) as CasoGuardado[];
      } catch {
        // Ignorar
      }
    }
    return [];
  });

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_THEME_KEY);
        if (stored === "dark" || stored === "light") return stored;
      } catch {
        // Ignorar
      }
    }
    return "light";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // Ignorar
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(input));
    } catch {
      // Ignorar errores de cuota
    }
  }, [input]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(savedCases));
    } catch {
      // Ignorar
    }
  }, [savedCases]);

  const handleSelectSyntheticProfile = (profile: PerfilSintetico) => {
    setInput(structuredClone(profile.input));
    setDemoModalOpen(false);
    setView("wizard");
    setCurrentStep(1);
  };

  const handleSaveCase = (estadoComite: EstadoComite) => {
    const newCase: CasoGuardado = {
      id: input.idCaso,
      fechaGuardado: new Date().toISOString(),
      estadoComite,
      input: structuredClone(input),
    };
    setSavedCases((prev) => {
      const filtered = prev.filter((c) => c.id !== newCase.id);
      return [newCase, ...filtered];
    });
    setSavedNotification(`Caso ${newCase.id} guardado localmente (${estadoComite}).`);
    setTimeout(() => setSavedNotification(null), 4500);
  };

  const handleLoadSavedCase = (caso: CasoGuardado) => {
    setInput(structuredClone(caso.input));
    setView("wizard");
    setCurrentStep(1);
  };

  const handleFinishExperience = (status: "completed" | "skipped") => {
    if (typeof window !== "undefined") {
      saveOnboardingStatus(status, window.localStorage);
    }
    setShowExperience(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenExperience = () => {
    setShowExperience(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {showExperience ? (
        <NegovaExperience
          theme={theme}
          onToggleTheme={toggleTheme}
          onComplete={() => handleFinishExperience("completed")}
          onSkip={() => handleFinishExperience("skipped")}
        />
      ) : (
        <>
          {view === "landing" && (
            <LandingPage
              theme={theme}
              onToggleTheme={toggleTheme}
              onStartAnalysis={() => {
                setView("wizard");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onOpenIndicators={() => {
                setView("indicadores");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onExploreDemoCases={() => setDemoModalOpen(true)}
              onOpenExperience={handleOpenExperience}
            />
          )}

          {view === "wizard" && (
            <WizardWorkspace
              theme={theme}
              onToggleTheme={toggleTheme}
              input={input}
              onUpdateInput={setInput}
              onResetBlank={() => setInput(createBlankInput())}
              onGoLanding={() => setView("landing")}
              onOpenDemoCases={() => setDemoModalOpen(true)}
              onOpenIndicators={() => setView("indicadores")}
              onOpenExperience={handleOpenExperience}
              savedCases={savedCases}
              onSaveCase={handleSaveCase}
              onLoadSavedCase={handleLoadSavedCase}
              savedNotification={savedNotification}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          )}

          {view === "indicadores" && (
            <IndicadoresView
              theme={theme}
              onToggleTheme={toggleTheme}
              onBack={() => setView("landing")}
              onStartAnalysis={() => setView("wizard")}
            />
          )}
        </>
      )}

      <DemoCasesModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onSelectProfile={handleSelectSyntheticProfile}
      />
    </>
  );
}
