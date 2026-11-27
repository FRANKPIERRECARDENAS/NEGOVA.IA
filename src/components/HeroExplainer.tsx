import { useEffect, useState } from "react";
import { CheckCircle2, Pause, Play, RotateCcw } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { usePrefersReducedMotion } from "./onboarding/useStageProgress";

interface ArchetypePreset {
  id: string;
  label: string;
  negocio: string;
  ubicacion: string;
  solicitud: string;
  cuotaFija: string;
  rangoAdaptado: string;
  incumplimientosFijo: number;
  capacidad: number[];
  cuotaAdaptada: number[];
  cuotaFijaNivel: number;
}

const ARCHETYPES: ArchetypePreset[] = [
  {
    id: "arroz",
    label: "Agrícola · Arroz",
    negocio: "Cultivo de arroz",
    ubicacion: "Pacasmayo",
    solicitud: "S/ 24,000 · 12 m",
    cuotaFija: "S/ 2,268",
    rangoAdaptado: "S/ 1,280 – 3,140",
    incumplimientosFijo: 4,
    capacidad: [40, 36, 50, 66, 88, 96, 90, 72, 58, 48, 52, 62],
    cuotaAdaptada: [31, 28, 39, 53, 74, 83, 77, 60, 44, 38, 43, 50],
    cuotaFijaNivel: 55,
  },
  {
    id: "escolar",
    label: "Comercio · Escolar",
    negocio: "Librería escolar",
    ubicacion: "Trujillo",
    solicitud: "S/ 18,000 · 12 m",
    cuotaFija: "S/ 1,714",
    rangoAdaptado: "S/ 890 – 2,840",
    incumplimientosFijo: 5,
    capacidad: [68, 95, 92, 62, 46, 38, 36, 42, 54, 58, 64, 74],
    cuotaAdaptada: [54, 82, 79, 50, 36, 29, 28, 33, 43, 47, 52, 61],
    cuotaFijaNivel: 58,
  },
  {
    id: "cafe",
    label: "Clima · Café",
    negocio: "Acopio de café",
    ubicacion: "Moyobamba",
    solicitud: "S/ 32,000 · 12 m",
    cuotaFija: "S/ 3,012",
    rangoAdaptado: "S/ 1,420 – 4,180",
    incumplimientosFijo: 5,
    capacidad: [38, 34, 42, 58, 74, 88, 95, 91, 82, 62, 50, 44],
    cuotaAdaptada: [30, 27, 34, 47, 62, 76, 84, 79, 70, 51, 40, 35],
    cuotaFijaNivel: 52,
  },
];

const PHASES = [
  {
    id: 0,
    index: "01",
    titulo: "Ciclo real",
    frase: "Los ingresos cambian cada mes.",
  },
  {
    id: 1,
    index: "02",
    titulo: "Cuota fija",
    frase: "La cuota plana rompe los meses bajos.",
  },
  {
    id: 2,
    index: "03",
    titulo: "Cuota adaptada",
    frase: "Cada pago sigue la capacidad real.",
  },
] as const;

const MONTHS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

interface Point {
  x: number;
  y: number;
}

function mapSeriesPoints(
  values: number[],
  width: number,
  padX: number,
  topY: number,
  bottomY: number
): Point[] {
  const usableW = width - padX * 2;
  const usableH = bottomY - topY;
  return values.map((v, i) => ({
    x: padX + (i / (values.length - 1)) * usableW,
    y: bottomY - (v / 100) * usableH,
  }));
}

function buildCurveFromPoints(pts: Point[]): string {
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

function buildAboveCurveClipPath(pts: Point[], width: number): string {
  if (pts.length === 0) return "";
  const first = pts[0];
  const last = pts[pts.length - 1];
  let d = `M 0 0 L ${width} 0 L ${width} ${last.y.toFixed(1)} L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  for (let i = pts.length - 1; i > 0; i--) {
    const p1 = pts[i];
    const p0 = pts[i - 1];
    const cx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${cx} ${p1.y.toFixed(1)}, ${cx} ${p0.y.toFixed(1)}, ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`;
  }
  d += ` L 0 ${first.y.toFixed(1)} Z`;
  return d;
}

export function HeroExplainer() {
  const [phaseIdx, setPhaseIdx] = useState(2);
  const [archetypeIdx, setArchetypeIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || reduced) return;
    const timer = setInterval(() => {
      setPhaseIdx((prev) => (prev + 1) % PHASES.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [paused, reduced]);

  const preset = ARCHETYPES[archetypeIdx];
  const phase = PHASES[phaseIdx];

  const svgW = 520;
  const svgH = 192;
  const padX = 20;
  const topY = 22;
  const bottomY = svgH - 14;
  const usableH = bottomY - topY;

  const capPts = mapSeriesPoints(preset.capacidad, svgW, padX, topY, bottomY);
  const adaptPts = mapSeriesPoints(preset.cuotaAdaptada, svgW, padX, topY, bottomY);

  const capPath = buildCurveFromPoints(capPts);
  const adaptPath = buildCurveFromPoints(adaptPts);
  const capAreaPath = `${capPath} L ${capPts[capPts.length - 1].x.toFixed(1)} ${bottomY} L ${capPts[0].x.toFixed(1)} ${bottomY} Z`;
  const aboveCapPath = buildAboveCurveClipPath(capPts, svgW);

  const fixedY = bottomY - (preset.cuotaFijaNivel / 100) * usableH;

  const peakVal = Math.max(...preset.capacidad);
  const peakIdx = preset.capacidad.indexOf(peakVal);
  const lowVal = Math.min(...preset.capacidad);
  const lowIdx = preset.capacidad.indexOf(lowVal);

  const peakPt = capPts[peakIdx];
  const lowPt = capPts[lowIdx];

  const showFixed = phaseIdx === 1;
  const showFixedGhost = phaseIdx === 2;
  const showAdapted = phaseIdx === 2;
  const deficitMonthsCount = preset.capacidad.filter((v) => v < preset.cuotaFijaNivel).length;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden"
        aria-label="Ilustración interactiva del motor financiero Negova.IA"
      >
        {/* 1. Selector de caso y control de reproducción */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex items-center justify-between gap-2">
          <div
            className="flex flex-wrap items-center gap-1"
            role="tablist"
            aria-label="Ejemplos de negocio"
          >
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
                setPhaseIdx(0);
                setPaused(false);
              }}
              aria-label="Reiniciar secuencia"
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Selector minimalista de 3 estados visuales */}
        <div
          className="grid grid-cols-3 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]"
          role="tablist"
          aria-label="Fases de la ilustración"
        >
          {PHASES.map((st, idx) => {
            const active = idx === phaseIdx;
            return (
              <button
                key={st.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setPhaseIdx(idx);
                  setPaused(true);
                }}
                className={`relative px-3 sm:px-4 py-2.5 text-left transition-colors duration-150 flex items-center gap-2 border-r last:border-r-0 border-[var(--border-hairline)] ${
                  active
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/50"
                }`}
              >
                <span
                  className={`font-mono text-[11px] tabular-nums shrink-0 ${
                    active ? "text-[var(--accent-teal)] font-semibold" : "text-[var(--text-muted)]"
                  }`}
                >
                  {st.index}
                </span>
                <span
                  className={`text-xs truncate ${
                    active ? "font-semibold" : "font-medium"
                  }`}
                >
                  {st.titulo}
                </span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--accent-teal)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Lienzo limpio + síntesis cuantitativa */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Encabezado único y directo */}
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {phase.frase}
            </p>
            <p className="text-xs font-mono tabular-nums text-[var(--text-muted)] whitespace-nowrap shrink-0">
              {preset.negocio} · {preset.ubicacion} · {preset.solicitud}
            </p>
          </div>

          {/* Gráfica vectorial protagonista */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--text-secondary)]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[var(--text-primary)] inline-block" aria-hidden="true" />
                  Capacidad mensual
                </span>
                {(showFixed || showFixedGhost) && (
                  <span
                    className={`inline-flex items-center gap-1.5 transition-opacity ${
                      showFixed ? "text-[var(--accent-risk)] font-medium" : "text-[var(--text-muted)]"
                    }`}
                  >
                    <span
                      className={`w-3 border-t border-dashed inline-block ${
                        showFixed ? "border-[var(--accent-risk)]" : "border-[var(--border-strong)]"
                      }`}
                      aria-hidden="true"
                    />
                    Cuota fija
                  </span>
                )}
                {showAdapted && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--accent-teal)] font-medium">
                    <span className="w-3 h-0.5 bg-[var(--accent-teal)] inline-block" aria-hidden="true" />
                    Cuota adaptada
                  </span>
                )}
              </div>

              {showFixed && (
                <span className="font-mono tabular-nums text-[var(--accent-risk)] font-medium">
                  {deficitMonthsCount} meses en déficit
                </span>
              )}
              {showAdapted && (
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[var(--accent-positive)] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  0 incumplimientos
                </span>
              )}
            </div>

            <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg px-3 pt-3 pb-2">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full h-44 sm:h-48 block select-none overflow-visible"
                role="img"
                aria-label={`Gráfico comparativo para ${preset.negocio}: fase ${phase.titulo}`}
              >
                <defs>
                  <linearGradient id={`capGrad-${preset.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0.0" />
                  </linearGradient>
                  <clipPath id={`aboveCap-${preset.id}`}>
                    <path d={aboveCapPath} />
                  </clipPath>
                </defs>

                {/* Referencias horizontales mínimas */}
                <line
                  x1={padX}
                  y1={topY + usableH * 0.5}
                  x2={svgW - padX}
                  y2={topY + usableH * 0.5}
                  stroke="var(--chart-grid)"
                  strokeWidth="1"
                  opacity="0.7"
                />
                <line
                  x1={padX}
                  y1={bottomY}
                  x2={svgW - padX}
                  y2={bottomY}
                  stroke="var(--border-hairline)"
                  strokeWidth="1"
                />

                {/* Área base suave bajo capacidad */}
                <path d={capAreaPath} fill={`url(#capGrad-${preset.id})`} />

                {/* Zona exacta de déficit cuando la cuota fija supera la capacidad */}
                <motion.rect
                  x={padX}
                  y={fixedY}
                  width={svgW - padX * 2}
                  height={Math.max(0, bottomY - fixedY)}
                  fill="var(--accent-risk)"
                  clipPath={`url(#aboveCap-${preset.id})`}
                  initial={false}
                  animate={{ opacity: showFixed ? 0.18 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Barras discretas de cuota adaptada dentro de la capacidad (Fase 03) */}
                {preset.cuotaAdaptada.map((val, i) => {
                  const pt = adaptPts[i];
                  const barW = 10;
                  const barH = (val / 100) * usableH;
                  return (
                    <motion.rect
                      key={i}
                      x={pt.x - barW / 2}
                      y={bottomY - barH}
                      width={barW}
                      height={barH}
                      rx={2}
                      fill="var(--accent-teal)"
                      initial={false}
                      animate={{ opacity: showAdapted ? 0.22 : 0 }}
                      transition={{ duration: 0.28, delay: showAdapted ? i * 0.015 : 0 }}
                    />
                  );
                })}

                {/* Línea de cuota fija tradicional */}
                <motion.line
                  x1={padX}
                  y1={fixedY}
                  x2={svgW - padX}
                  y2={fixedY}
                  stroke={showFixed ? "var(--accent-risk)" : "var(--text-muted)"}
                  strokeWidth={showFixed ? "1.8" : "1.2"}
                  strokeDasharray="5 4"
                  initial={false}
                  animate={{ opacity: showFixed ? 1 : showFixedGhost ? 0.35 : 0 }}
                  transition={{ duration: 0.25 }}
                />

                {/* Curva de capacidad real del negocio */}
                <path
                  d={capPath}
                  fill="none"
                  stroke="var(--text-primary)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Curva de cuota adaptada (Fase 03) */}
                <motion.path
                  key={`adapt-${preset.id}`}
                  d={adaptPath}
                  fill="none"
                  stroke="var(--accent-teal)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  initial={reduced ? { opacity: showAdapted ? 1 : 0 } : { pathLength: showAdapted ? 1 : 0, opacity: showAdapted ? 1 : 0 }}
                  animate={{
                    pathLength: showAdapted ? 1 : 0,
                    opacity: showAdapted ? 1 : 0,
                  }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Puntos pico y valle en la curva de capacidad */}
                <g>
                  <circle cx={peakPt.x} cy={peakPt.y} r="3.8" fill="var(--accent-teal)" />
                  <circle cx={lowPt.x} cy={lowPt.y} r="3.8" fill="var(--accent-warning)" />
                  {phaseIdx === 0 && (
                    <>
                      <text
                        x={peakPt.x}
                        y={peakPt.y - 9}
                        textAnchor="middle"
                        fill="var(--accent-teal)"
                        stroke="var(--bg-elevated)"
                        strokeWidth="4"
                        paintOrder="stroke"
                        fontSize="10"
                        fontFamily="var(--font-mono)"
                        fontWeight="600"
                      >
                        Pico
                      </text>
                      <text
                        x={lowPt.x}
                        y={lowPt.y - 9}
                        textAnchor="middle"
                        fill="var(--accent-warning)"
                        stroke="var(--bg-elevated)"
                        strokeWidth="4"
                        paintOrder="stroke"
                        fontSize="10"
                        fontFamily="var(--font-mono)"
                        fontWeight="600"
                      >
                        Valle
                      </text>
                    </>
                  )}
                </g>

                {/* Señal puntual en meses excedidos durante Fase 02 */}
                {showFixed &&
                  capPts.map((pt, i) => {
                    if (preset.cuotaFijaNivel <= preset.capacidad[i]) return null;
                    return (
                      <circle
                        key={`def-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r="3"
                        fill="var(--bg-elevated)"
                        stroke="var(--accent-risk)"
                        strokeWidth="1.8"
                      />
                    );
                  })}

                {/* Eje de meses alineado exactamente con cada nodo */}
                {MONTHS.map((m, i) => (
                  <text
                    key={`m-${i}`}
                    x={capPts[i].x}
                    y={svgH - 1}
                    textAnchor="middle"
                    fill={
                      i === peakIdx
                        ? "var(--accent-teal)"
                        : i === lowIdx
                        ? "var(--accent-warning)"
                        : "var(--text-muted)"
                    }
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fontWeight={i === peakIdx || i === lowIdx ? "600" : "400"}
                  >
                    {m}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* 3 métricas finales limpias, sin redundancia */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[var(--border-hairline)] text-xs">
            <div>
              <p className="text-[11px] text-[var(--text-muted)]">Cuota fija</p>
              <p className="font-mono tabular-nums font-medium text-[var(--text-primary)] mt-0.5">
                {preset.cuotaFija}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-muted)]">Cuota adaptada</p>
              <p className="font-mono tabular-nums font-medium text-[var(--accent-teal)] mt-0.5">
                {preset.rangoAdaptado}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-muted)]">Meses en déficit</p>
              <p className="font-mono tabular-nums font-semibold mt-0.5 flex items-center gap-1.5">
                <span className="text-[var(--accent-risk)] line-through decoration-[1.5px]">
                  {deficitMonthsCount}
                </span>
                <span aria-hidden="true" className="text-[var(--text-muted)]">
                  →
                </span>
                <span className="text-[var(--accent-positive)]">0 meses</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
