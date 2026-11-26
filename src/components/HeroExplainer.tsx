import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

const STAGES = [
  {
    id: 1,
    titulo: "1. Registro económico",
    subtitulo: "El asesor ingresa actividad, ubicación, ventas y costos del negocio",
  },
  {
    id: 2,
    titulo: "2. Lectura de estacionalidad",
    subtitulo: "Negova.IA cruza actividad, zona geográfica y patrón individual",
  },
  {
    id: 3,
    titulo: "3. Proyección de capacidad",
    subtitulo: "El motor estadístico estima ingresos y utilidad neta periodo a periodo",
  },
  {
    id: 4,
    titulo: "4. Optimización bajo restricción",
    subtitulo: "Adapta cada cuota sin superar el factor máximo de capacidad de pago",
  },
  {
    id: 5,
    titulo: "5. Comparación e informe",
    subtitulo: "Contrasta plan fijo vs. adaptado y prepara evidencia para el comité",
  },
] as const;

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const SEASONAL_BARS = [42, 38, 52, 64, 88, 96, 90, 74, 58, 50, 56, 62];
const FIXED_QUOTA_LINE = 64; // supera capacidad en Ene, Feb, Mar, Sep, Oct, Nov
const ADAPTED_QUOTAS = [34, 30, 42, 54, 76, 84, 78, 62, 46, 40, 46, 52];

export function HeroExplainer() {
  const [stageIndex, setStageIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [paused]);

  const current = STAGES[stageIndex];

  return (
    <div
      className="bg-[#0B1F3A] text-white rounded-2xl border border-slate-800 overflow-hidden shadow-sm"
      aria-label="Demostración animada del flujo de Negova.IA"
    >
      {/* Cabecera de la animación */}
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10">
        <div className="min-w-0">
          <p className="text-xs font-medium text-teal-300 tracking-wide">
            Flujo del motor predictivo y financiero
          </p>
          <p className="text-sm font-semibold text-white truncate mt-0.5">
            {current.titulo}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Reanudar demostración" : "Pausar demostración"}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setStageIndex(0);
              setPaused(false);
            }}
            aria-label="Reiniciar demostración"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lienzo visual de 5 etapas */}
      <div className="p-6 min-h-[290px] flex flex-col justify-between gap-5">
        <p className="text-xs text-slate-300 leading-relaxed">{current.subtitulo}</p>

        {/* Etapa 1: Registro económico */}
        {stageIndex === 0 && (
          <div className="grid grid-cols-2 gap-3 transition-opacity duration-300">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <p className="text-[11px] text-slate-400">Actividad y zona</p>
              <p className="text-sm font-semibold text-white mt-1">
                Cultivo de arroz · Pacasmayo
              </p>
              <p className="text-xs text-teal-300 mt-1">Operación productiva · La Libertad</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <p className="text-[11px] text-slate-400">Solicitud base</p>
              <p className="text-sm font-semibold text-white font-mono tabular-nums mt-1">
                S/ 24,000 · 12 meses
              </p>
              <p className="text-xs text-slate-300 font-mono tabular-nums mt-1">
                TEA 24.0% · Factor máx. 0.65
              </p>
            </div>
            <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Historial registrado</p>
                <p className="text-xs text-slate-200 mt-0.5">
                  12 meses de ventas, estructura de costos y carga financiera
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-teal-300 shrink-0">
                5 bloques validados
              </span>
            </div>
          </div>
        )}

        {/* Etapa 2: Identificación de estacionalidad */}
        {stageIndex === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[11px] text-slate-400">Sector</p>
                <p className="text-xs font-semibold text-white mt-1">Ciclo de cosecha</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[11px] text-slate-400">Ubicación</p>
                <p className="text-xs font-semibold text-white mt-1">Costa Norte</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[11px] text-slate-400">Meses pico</p>
                <p className="text-xs font-semibold text-teal-300 mt-1">May – Jul</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <svg viewBox="0 0 360 76" className="w-full h-16 overflow-visible">
                <path
                  d="M 10 56 C 45 64, 75 50, 110 38 C 145 24, 175 10, 205 16 C 235 22, 265 48, 300 46 C 325 44, 340 38, 350 36"
                  fill="none"
                  stroke="#2DD4BF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="175" cy="14" r="4.5" fill="#2DD4BF" />
                <circle cx="42" cy="59" r="4.5" fill="#F59E0B" />
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>Ene (Bajo)</span>
                <span className="text-teal-300">May–Jul (Cosecha)</span>
                <span>Dic</span>
              </div>
            </div>
          </div>
        )}

        {/* Etapa 3: Proyección de ingresos y utilidad neta */}
        {stageIndex === 2 && (
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-1.5 h-32 pt-2 px-2 bg-white/5 border border-white/10 rounded-xl">
              {SEASONAL_BARS.map((val, idx) => (
                <div key={MONTHS[idx]} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end pb-2">
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${
                      val >= 75
                        ? "bg-teal-400"
                        : val <= 50
                        ? "bg-amber-400/80"
                        : "bg-slate-400/70"
                    }`}
                    style={{ height: `${val}%` }}
                  />
                  <span className="text-[9px] text-slate-400 font-mono">{MONTHS[idx]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Capacidad neta mensual estimada</span>
              <span className="font-mono tabular-nums text-teal-300">Confianza: 86%</span>
            </div>
          </div>
        )}

        {/* Etapa 4: Optimización de cuotas vs límite de capacidad */}
        {stageIndex === 3 && (
          <div className="space-y-3">
            <div className="relative h-32 pt-3 px-2 bg-white/5 border border-white/10 rounded-xl flex items-end gap-1.5">
              {/* Línea de cuota fija tradicional */}
              <div
                className="absolute left-2 right-2 border-t border-dashed border-rose-400/80 pointer-events-none"
                style={{ bottom: `${FIXED_QUOTA_LINE * 0.72 + 22}px` }}
              >
                <span className="text-[9px] text-rose-300 bg-[#0B1F3A] px-1 -mt-2.5 inline-block">
                  Cuota fija tradicional
                </span>
              </div>
              {ADAPTED_QUOTAS.map((cuota, idx) => {
                const cap = SEASONAL_BARS[idx];
                const fijoExcede = FIXED_QUOTA_LINE > cap;
                return (
                  <div key={MONTHS[idx]} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end pb-2">
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      <div
                        className={`w-1/2 rounded-t transition-all duration-500 ${
                          fijoExcede ? "bg-rose-400/50" : "bg-slate-500/40"
                        }`}
                        style={{ height: `${cap * 0.72}%` }}
                        title="Capacidad máxima"
                      />
                      <div
                        className="w-1/2 rounded-t bg-teal-400 transition-all duration-500"
                        style={{ height: `${cuota * 0.72}%` }}
                        title="Cuota adaptada"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{MONTHS[idx]}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Cada cuota respeta Cuota / Utilidad ≤ Factor</span>
              <span className="font-mono tabular-nums text-teal-300">0 incumplimientos</span>
            </div>
          </div>
        )}

        {/* Etapa 5: Comparación e informe para el comité */}
        {stageIndex === 4 && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-rose-400/30 rounded-xl p-3.5">
                <p className="text-[11px] text-slate-400">Plan tradicional fijo</p>
                <p className="text-base font-semibold text-white font-mono tabular-nums mt-1">
                  S/ 2,268 / mes
                </p>
                <p className="text-xs text-rose-300 mt-1">4 periodos exceden capacidad</p>
              </div>
              <div className="bg-teal-500/10 border border-teal-400/40 rounded-xl p-3.5">
                <p className="text-[11px] text-teal-200">Plan adaptado Negova.IA</p>
                <p className="text-base font-semibold text-white font-mono tabular-nums mt-1">
                  S/ 1,280 – 3,140
                </p>
                <p className="text-xs text-teal-300 mt-1">100% periodos viables</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-200">Informe ejecutivo y pruebas de estrés</span>
              <span className="text-teal-300 font-medium">Listo para Comité</span>
            </div>
          </div>
        )}

        {/* Selector interactivo de etapa */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
          {STAGES.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setStageIndex(idx);
                setPaused(true);
              }}
              aria-label={`Ver etapa ${st.id}: ${st.titulo}`}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                idx === stageIndex
                  ? "bg-teal-400"
                  : idx < stageIndex
                  ? "bg-teal-400/40"
                  : "bg-white/15 hover:bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
