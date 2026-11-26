import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Pause, Play, RotateCcw } from "lucide-react";

interface ArchetypePreset {
  id: string;
  label: string;
  negocio: string;
  ubicacion: string;
  sector: string;
  solicitud: string;
  confianza: string;
  mesesPico: string;
  mesesBajos: string;
  cuotaFija: string;
  rangoAdaptado: string;
  incumplimientosFijo: number;
  ahorroPresion: string;
  // 12 valores normalizados (0-100) representando capacidad mensual
  capacidad: number[];
  // 12 valores normalizados de cuota adaptada
  cuotaAdaptada: number[];
  cuotaFijaNivel: number;
}

const ARCHETYPES: ArchetypePreset[] = [
  {
    id: "arroz",
    label: "Agrícola · Arroz",
    negocio: "Cultivo de arroz",
    ubicacion: "Pacasmayo, La Libertad",
    sector: "Ciclo de cosecha",
    solicitud: "S/ 24,000 · 12 m · TEA 24.0%",
    confianza: "86%",
    mesesPico: "May – Jul",
    mesesBajos: "Ene – Feb",
    cuotaFija: "S/ 2,268 / mes",
    rangoAdaptado: "S/ 1,280 – 3,140",
    incumplimientosFijo: 4,
    ahorroPresion: "-44% presión pico",
    capacidad: [40, 36, 50, 66, 88, 96, 90, 72, 56, 48, 54, 62],
    cuotaAdaptada: [31, 28, 39, 53, 74, 83, 77, 60, 44, 38, 43, 50],
    cuotaFijaNivel: 63,
  },
  {
    id: "escolar",
    label: "Comercio · Escolar",
    negocio: "Librería y útiles escolares",
    ubicacion: "Trujillo, La Libertad",
    sector: "Campaña comercial",
    solicitud: "S/ 18,000 · 12 m · TEA 26.0%",
    confianza: "91%",
    mesesPico: "Feb – Mar",
    mesesBajos: "Jun – Ago",
    cuotaFija: "S/ 1,714 / mes",
    rangoAdaptado: "S/ 890 – 2,840",
    incumplimientosFijo: 5,
    ahorroPresion: "-51% presión pico",
    capacidad: [68, 95, 92, 62, 46, 38, 36, 42, 54, 58, 64, 74],
    cuotaAdaptada: [54, 82, 79, 50, 36, 29, 28, 33, 43, 47, 52, 61],
    cuotaFijaNivel: 58,
  },
  {
    id: "cafe",
    label: "Clima · Café y cacao",
    negocio: "Acopio de café y cacao",
    ubicacion: "Moyobamba, San Martín",
    sector: "Sensible al clima",
    solicitud: "S/ 32,000 · 12 m · TEA 23.5%",
    confianza: "82%",
    mesesPico: "Jun – Sep",
    mesesBajos: "Ene – Mar",
    cuotaFija: "S/ 3,012 / mes",
    rangoAdaptado: "S/ 1,420 – 4,180",
    incumplimientosFijo: 4,
    ahorroPresion: "-47% presión pico",
    capacidad: [38, 34, 42, 58, 74, 88, 95, 91, 82, 62, 50, 44],
    cuotaAdaptada: [30, 27, 34, 47, 62, 76, 84, 79, 70, 51, 40, 35],
    cuotaFijaNivel: 61,
  },
];

const STAGES = [
  {
    id: 1,
    index: "01",
    titulo: "Perfil del negocio",
    resumen: "Actividad, ubicación geográfica y carga financiera declarada.",
  },
  {
    id: 2,
    index: "02",
    titulo: "Curva estacional",
    resumen: "Detección de meses pico y valles de liquidez propios del negocio.",
  },
  {
    id: 3,
    index: "03",
    titulo: "Motor predictivo",
    resumen: "Cruce de serie histórica, patrón sectorial y exposición climática.",
  },
  {
    id: 4,
    index: "04",
    titulo: "Dos cronogramas",
    resumen: "Cuota fija tradicional frente a cuota adaptada bajo restricción.",
  },
  {
    id: 5,
    index: "05",
    titulo: "Plan viable",
    resumen: "Selección del cronograma con 0 incumplimientos y evidencia para Comité.",
  },
] as const;

const MONTHS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function buildSmoothPath(values: number[], width: number, height: number, padY = 12): string {
  const usableH = height - padY * 2;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - padY - (v / 100) * usableH,
  }));
  if (pts.length === 0) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export function HeroExplainer() {
  const [stageIndex, setStageIndex] = useState(0);
  const [archetypeIdx, setArchetypeIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [paused]);

  const currentStage = STAGES[stageIndex];
  const preset = ARCHETYPES[archetypeIdx];

  const svgW = 480;
  const svgH = 144;
  const capPath = buildSmoothPath(preset.capacidad, svgW, svgH, 16);
  const adaptPath = buildSmoothPath(preset.cuotaAdaptada, svgW, svgH, 16);
  const areaPath = `${capPath} L ${svgW} ${svgH} L 0 ${svgH} Z`;
  const fixedY = svgH - 16 - (preset.cuotaFijaNivel / 100) * (svgH - 32);

  const peakVal = Math.max(...preset.capacidad);
  const peakIdx = preset.capacidad.indexOf(peakVal);
  const lowVal = Math.min(...preset.capacidad);
  const lowIdx = preset.capacidad.indexOf(lowVal);

  const peakX = (peakIdx / 11) * svgW;
  const peakY = svgH - 16 - (peakVal / 100) * (svgH - 32);
  const lowX = (lowIdx / 11) * svgW;
  const lowY = svgH - 16 - (lowVal / 100) * (svgH - 32);

  return (
    <div
      className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden"
      aria-label="Instrumento interactivo del motor financiero Negova.IA"
    >
      {/* Barra superior del instrumento: selector de arquetipo y controles */}
      <div className="px-4 sm:px-5 py-3 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex items-start sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Arquetipos de negocio">
          {ARCHETYPES.map((arch, idx) => {
            const active = idx === archetypeIdx;
            return (
              <button
                key={arch.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setArchetypeIdx(idx)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-[var(--bg-ink)] text-[var(--text-on-ink)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {arch.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Reanudar secuencia" : "Pausar secuencia"}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setStageIndex(0);
              setPaused(false);
            }}
            aria-label="Reiniciar secuencia"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Flujo estructural de 5 nodos conectados */}
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[var(--border-hairline)]">
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-5 gap-1.5 pb-1 sm:pb-0">
          {STAGES.map((st, idx) => {
            const isActive = idx === stageIndex;
            const isPast = idx < stageIndex;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setStageIndex(idx);
                  setPaused(true);
                }}
                className={`text-left py-2 px-2.5 sm:px-2 rounded-md border transition-colors duration-150 min-w-[118px] sm:min-w-0 shrink-0 ${
                  isActive
                    ? "border-[var(--accent-teal)] bg-[var(--accent-teal-soft)]"
                    : isPast
                    ? "border-[var(--border-hairline)] bg-[var(--bg-elevated)]"
                    : "border-transparent hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      isActive ? "text-[var(--accent-teal)] font-semibold" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {st.index}
                  </span>
                  {idx < 4 && (
                    <ArrowRight className="w-2.5 h-2.5 text-[var(--text-muted)] opacity-50 hidden sm:block" aria-hidden="true" />
                  )}
                </div>
                <p
                  className={`text-[11px] mt-0.5 truncate ${
                    isActive
                      ? "font-semibold text-[var(--text-primary)]"
                      : "font-medium text-[var(--text-secondary)]"
                  }`}
                >
                  {st.titulo}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lienzo principal del instrumento */}
      <div className="p-5 space-y-5">
        {/* Encabezado de etapa activa + datos del negocio */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[var(--border-hairline)]">
          <div>
            <p className="text-xs font-mono tabular-nums text-[var(--accent-teal)]">
              Etapa {currentStage.index} · {preset.negocio}
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
              {currentStage.resumen}
            </p>
          </div>
          <p className="text-xs font-mono tabular-nums text-[var(--text-muted)] whitespace-nowrap shrink-0">
            {preset.ubicacion}
          </p>
        </div>

        {/* Visualización vectorial principal: Curva estacional + Restricción + Cronogramas */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-4 text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[var(--text-primary)] inline-block" aria-hidden="true" />
                Capacidad estimada
              </span>
              {stageIndex >= 3 && (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[var(--accent-risk)]">
                    <span className="w-3 border-t border-dashed border-[var(--accent-risk)] inline-block" aria-hidden="true" />
                    Cuota fija tradicional
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[var(--accent-teal)] font-medium">
                    <span className="w-3 h-0.5 bg-[var(--accent-teal)] inline-block" aria-hidden="true" />
                    Cuota adaptada
                  </span>
                </>
              )}
            </div>
            <span className="font-mono tabular-nums text-[var(--text-muted)]">
              Confianza {preset.confianza}
            </span>
          </div>

          <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-3 pt-4">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-36 overflow-visible"
              role="img"
              aria-label={`Curva estacional y comparación de cronogramas para ${preset.negocio}`}
            >
              <defs>
                <linearGradient id="negovaCapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Retícula horizontal discreta */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1={0}
                  y1={svgH * ratio}
                  x2={svgW}
                  y2={svgH * ratio}
                  stroke="var(--chart-grid)"
                  strokeWidth="1"
                />
              ))}

              {/* Área bajo curva de capacidad */}
              <path d={areaPath} fill="url(#negovaCapGrad)" />

              {/* Barras discretas de capacidad cuando está en etapa de motor o cronogramas */}
              {stageIndex >= 2 &&
                preset.capacidad.map((val, i) => {
                  const barW = 14;
                  const x = (i / 11) * (svgW - barW);
                  const h = (val / 100) * (svgH - 32);
                  const y = svgH - 16 - h;
                  const excedeFijo = stageIndex >= 3 && preset.cuotaFijaNivel > val;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      rx={2}
                      fill={excedeFijo ? "var(--accent-risk)" : "var(--chart-bar-base)"}
                      opacity={excedeFijo ? 0.24 : 0.18}
                    />
                  );
                })}

              {/* Línea de cuota fija tradicional (etapas 4 y 5) */}
              {stageIndex >= 3 && (
                <g>
                  <line
                    x1={0}
                    y1={fixedY}
                    x2={svgW}
                    y2={fixedY}
                    stroke="var(--accent-risk)"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                  <text
                    x={svgW - 4}
                    y={fixedY - 6}
                    textAnchor="end"
                    fill="var(--accent-risk)"
                    stroke="var(--bg-elevated)"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                  >
                    Cuota fija ({preset.cuotaFija})
                  </text>
                </g>
              )}

              {/* Curva de capacidad estacional */}
              <path
                key={`cap-${preset.id}`}
                d={capPath}
                fill="none"
                stroke="var(--text-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                className="animate-curve-draw"
              />

              {/* Curva de cuota adaptada (etapas 4 y 5) */}
              {stageIndex >= 3 && (
                <path
                  key={`adapt-${preset.id}-${stageIndex}`}
                  d={adaptPath}
                  fill="none"
                  stroke="var(--accent-teal)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-curve-draw"
                />
              )}

              {/* Puntos de inflexión pico y valle */}
              <circle cx={peakX} cy={peakY} r="4" fill="var(--accent-teal)" />
              <circle cx={lowX} cy={lowY} r="4" fill="var(--accent-warning)" />
            </svg>

            <div className="grid grid-cols-12 text-center font-mono text-[10px] text-[var(--text-muted)] pt-1.5 border-t border-[var(--border-hairline)]">
              {MONTHS.map((m, i) => (
                <span
                  key={i}
                  className={
                    i === peakIdx
                      ? "text-[var(--accent-teal)] font-semibold"
                      : i === lowIdx
                      ? "text-[var(--accent-warning)] font-semibold"
                      : ""
                  }
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla/ledger comparativa inferior (sin tarjetas anidadas) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-[var(--border-hairline)] text-xs">
          <div>
            <p className="text-[11px] text-[var(--text-muted)]">Solicitud analizada</p>
            <p className="font-mono tabular-nums font-medium text-[var(--text-primary)] mt-1">
              {preset.solicitud}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-muted)]">Ciclo estacional</p>
            <p className="font-mono tabular-nums text-[var(--text-primary)] mt-1">
              Alto {preset.mesesPico} · Bajo {preset.mesesBajos}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-muted)]">Cronograma fijo</p>
            <p className="font-mono tabular-nums text-[var(--accent-risk)] font-medium mt-1">
              {preset.incumplimientosFijo} periodos exceden
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-muted)]">Cronograma adaptado</p>
            <p className="inline-flex items-center gap-1 font-mono tabular-nums text-[var(--accent-positive)] font-semibold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              0 incumplimientos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
