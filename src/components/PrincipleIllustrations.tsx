import { MotionConfig, motion } from "motion/react";
import { buildSmoothSvgPath } from "./onboarding/onboardingLogic";
import { usePrefersReducedMotion } from "./onboarding/useStageProgress";

const FLAT_SERIES = [48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48];
const SEASON_SERIES = [30, 24, 38, 62, 86, 94, 80, 56, 40, 34, 48, 64];
const HISTORY_POINTS = [36, 42, 39, 54, 62];
const PREDICT_POINTS = [62, 74, 82, 76, 86, 92];
const PREDICT_UPPER = [62, 82, 94, 92, 102, 110];
const PREDICT_LOWER = [62, 66, 70, 60, 70, 74];
const UNIFORM_QUOTAS = [52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52];
const ADAPTED_QUOTAS = [28, 22, 36, 56, 76, 84, 72, 50, 36, 30, 44, 58];

function buildRoundedTopBarPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h / 2);
  const right = x + w;
  const bottom = y + h;
  return [
    `M ${x.toFixed(1)} ${bottom.toFixed(1)}`,
    `L ${x.toFixed(1)} ${(y + radius).toFixed(1)}`,
    `Q ${x.toFixed(1)} ${y.toFixed(1)} ${(x + radius).toFixed(1)} ${y.toFixed(1)}`,
    `L ${(right - radius).toFixed(1)} ${y.toFixed(1)}`,
    `Q ${right.toFixed(1)} ${y.toFixed(1)} ${right.toFixed(1)} ${(y + radius).toFixed(1)}`,
    `L ${right.toFixed(1)} ${bottom.toFixed(1)}`,
    "Z",
  ].join(" ");
}

/**
 * 01. Ritmo económico
 * Animación corta: parte de una línea plana supuesta, revela la curva estacional real
 * y recorre sus meses bajos y campaña alta antes de regresar.
 */
function IllustrationRitmo({ reduced }: { reduced: boolean }) {
  const w = 320;
  const h = 156;
  const padY = 28;
  const padX = 22;

  const flatPath = buildSmoothSvgPath(FLAT_SERIES, w, h, padY, padX);
  const wavePath = buildSmoothSvgPath(SEASON_SERIES, w, h, padY, padX);
  const flatArea = `${flatPath} L ${w - padX} ${h - 24} L ${padX} ${h - 24} Z`;
  const waveArea = `${wavePath} L ${w - padX} ${h - 24} L ${padX} ${h - 24} Z`;

  const pointCoords = SEASON_SERIES.map((val, idx) => ({
    x: padX + (idx / (SEASON_SERIES.length - 1)) * (w - padX * 2),
    y: h - padY - (val / 100) * (h - padY * 2),
  }));

  const travelX = [
    pointCoords[0].x,
    pointCoords[0].x,
    pointCoords[1].x,
    pointCoords[5].x,
    pointCoords[9].x,
    pointCoords[11].x,
    pointCoords[11].x,
  ];
  const travelY = [
    pointCoords[0].y,
    pointCoords[0].y,
    pointCoords[1].y,
    pointCoords[5].y,
    pointCoords[9].y,
    pointCoords[11].y,
    pointCoords[11].y,
  ];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full max-h-full h-auto block select-none overflow-visible"
      role="img"
      aria-label="Animación minimalista de ciclos económicos con picos y valles estacionales frente a ingresos planos"
    >
      <defs>
        <linearGradient id="ritmoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Línea de referencia plana (supuesto tradicional) */}
      <line
        x1={padX}
        y1={h - padY - (48 / 100) * (h - padY * 2)}
        x2={w - padX}
        y2={h - padY - (48 / 100) * (h - padY * 2)}
        stroke="var(--border-strong)"
        strokeWidth="1.2"
        strokeDasharray="4 5"
        opacity="0.6"
      />

      {/* Base */}
      <line
        x1={padX}
        y1={h - 24}
        x2={w - padX}
        y2={h - 24}
        stroke="var(--border-hairline)"
        strokeWidth="1.2"
      />

      {/* Área bajo la curva transformándose */}
      <motion.path
        d={reduced ? waveArea : flatArea}
        fill="url(#ritmoGrad)"
        initial={reduced ? { d: waveArea, opacity: 1 } : { d: flatArea, opacity: 0.15 }}
        animate={
          reduced
            ? { d: waveArea, opacity: 1 }
            : {
                d: [flatArea, flatArea, waveArea, waveArea, flatArea, flatArea],
                opacity: [0.15, 0.2, 1, 1, 0.15, 0.15],
              }
        }
        transition={{
          duration: 4.6,
          times: [0, 0.14, 0.36, 0.84, 0.96, 1],
          repeat: Infinity,
          ease: [0.16, 1, 0.3, 1],
        }}
      />

      {/* Curva morphing de línea plana a ritmo estacional */}
      <motion.path
        d={reduced ? wavePath : flatPath}
        fill="none"
        stroke="var(--accent-teal)"
        strokeWidth="2.6"
        strokeLinecap="round"
        initial={reduced ? { d: wavePath } : { d: flatPath }}
        animate={
          reduced
            ? { d: wavePath }
            : {
                d: [flatPath, flatPath, wavePath, wavePath, flatPath, flatPath],
              }
        }
        transition={{
          duration: 4.6,
          times: [0, 0.14, 0.36, 0.84, 0.96, 1],
          repeat: Infinity,
          ease: [0.16, 1, 0.3, 1],
        }}
      />

      {/* Hitos de temporada baja y campaña alta (aparecen y desaparecen mientras la curva está en onda) */}
      {[
        { idx: 1, color: "var(--accent-warning)", appear: 0.4 },
        { idx: 5, color: "var(--accent-teal)", appear: 0.52 },
        { idx: 9, color: "var(--accent-warning)", appear: 0.64 },
      ].map((pt) => {
        const { x, y } = pointCoords[pt.idx];
        return (
          <g key={pt.idx} transform={`translate(${x}, ${y})`}>
            <motion.circle
              cx="0"
              cy="0"
              r="9"
              fill={pt.color}
              initial={reduced ? { scale: 1, opacity: 0.14 } : { scale: 0, opacity: 0 }}
              animate={
                reduced
                  ? { scale: 1, opacity: 0.14 }
                  : {
                      scale: [0, 0, 1.45, 1, 0, 0],
                      opacity: [0, 0, 0.28, 0.12, 0, 0],
                    }
              }
              transition={{
                duration: 4.6,
                times: [0, pt.appear - 0.04, pt.appear + 0.05, 0.77, 0.83, 1],
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.circle
              cx="0"
              cy="0"
              r="4"
              fill="var(--bg-surface)"
              stroke={pt.color}
              strokeWidth="2.2"
              initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={
                reduced
                  ? { scale: 1, opacity: 1 }
                  : {
                      scale: [0, 0, 1.15, 1, 1, 0, 0],
                      opacity: [0, 0, 1, 1, 1, 0, 0],
                    }
              }
              transition={{
                duration: 4.6,
                times: [0, pt.appear - 0.04, pt.appear + 0.03, pt.appear + 0.08, 0.77, 0.83, 1],
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </g>
        );
      })}

      {/* Indicador recorriendo la curva estacional */}
      {!reduced && (
        <motion.circle
          cx={travelX[0]}
          cy={travelY[0]}
          r="3.5"
          fill="var(--text-primary)"
          initial={{ cx: travelX[0], cy: travelY[0], opacity: 0 }}
          animate={{
            cx: travelX,
            cy: travelY,
            opacity: [0, 1, 1, 1, 1, 0, 0],
          }}
          transition={{
            duration: 4.6,
            times: [0.35, 0.39, 0.48, 0.6, 0.72, 0.8, 1],
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </svg>
  );
}

/**
 * 02. Inteligencia predictiva
 * Animación corta: el historial converge en el punto actual y despliega hacia adelante
 * la proyección discontinua junto con su banda de certeza.
 */
function IllustrationPredictiva({ reduced }: { reduced: boolean }) {
  const w = 320;
  const h = 156;
  const splitX = 148;

  const toPt = (idx: number, total: number, xStart: number, xEnd: number, val: number) => {
    const x = xStart + (idx / (total - 1)) * (xEnd - xStart);
    const y = h - 26 - (val / 115) * (h - 52);
    return { x, y };
  };

  const histPts = HISTORY_POINTS.map((v, i) => toPt(i, HISTORY_POINTS.length, 24, splitX, v));
  const predPts = PREDICT_POINTS.map((v, i) => toPt(i, PREDICT_POINTS.length, splitX, w - 24, v));
  const upperPts = PREDICT_UPPER.map((v, i) => toPt(i, PREDICT_UPPER.length, splitX, w - 24, v));
  const lowerPts = PREDICT_LOWER.map((v, i) => toPt(i, PREDICT_LOWER.length, splitX, w - 24, v));

  const histPath = histPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const predPath = predPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const bandPath = [
    ...upperPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    ...[...lowerPts].reverse().map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    "Z",
  ].join(" ");

  const focal = histPts[histPts.length - 1];
  const targetEnd = predPts[predPts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full max-h-full h-auto block select-none overflow-visible"
      role="img"
      aria-label="Animación minimalista de proyección financiera con banda de certeza desplegándose hacia el futuro"
    >
      <defs>
        <clipPath id="predictBandReveal">
          <motion.rect
            x={splitX}
            y="0"
            height={h}
            width={reduced ? w - splitX : 0}
            initial={reduced ? { width: w - splitX } : { width: 0 }}
            animate={
              reduced
                ? { width: w - splitX }
                : { width: [0, 0, w - splitX, w - splitX, 0] }
            }
            transition={{
              duration: 4.4,
              times: [0, 0.34, 0.68, 0.88, 1],
              repeat: Infinity,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </clipPath>
      </defs>

      {/* Línea divisoria presente / proyección */}
      <line
        x1={splitX}
        y1="22"
        x2={splitX}
        y2={h - 22}
        stroke="var(--border-hairline)"
        strokeWidth="1.2"
        strokeDasharray="3 4"
      />
      <line
        x1="22"
        y1={h - 24}
        x2={w - 22}
        y2={h - 24}
        stroke="var(--border-hairline)"
        strokeWidth="1.2"
      />

      {/* Barras sutiles de historial apareciendo progresivamente */}
      {histPts.slice(0, -1).map((p, i) => (
        <motion.line
          key={i}
          x1={p.x}
          y1={h - 24}
          x2={p.x}
          y2={p.y + 8}
          stroke="var(--border-strong)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={reduced ? { opacity: 0.45 } : { opacity: 0.15 }}
          animate={
            reduced
              ? { opacity: 0.45 }
              : { opacity: [0.15, 0.52, 0.52, 0.52, 0.15] }
          }
          transition={{
            duration: 4.4,
            times: [0, 0.08 + i * 0.05, 0.35, 0.86, 1],
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Trayectoria histórica dibujándose hasta el punto actual */}
      <motion.path
        d={histPath}
        fill="none"
        stroke="var(--text-primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.76"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={
          reduced
            ? { pathLength: 1 }
            : { pathLength: [0, 1, 1, 1, 0] }
        }
        transition={{
          duration: 4.4,
          times: [0, 0.28, 0.86, 0.92, 1],
          repeat: Infinity,
          ease: [0.16, 1, 0.3, 1],
        }}
      />

      {/* Banda de incertidumbre + curva proyectada discontinua revelándose juntas hacia la derecha */}
      <g clipPath="url(#predictBandReveal)">
        <path d={bandPath} fill="var(--accent-teal)" opacity="0.18" />
        <path
          d={predPath}
          fill="none"
          stroke="var(--accent-teal)"
          strokeWidth="2.6"
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Nodo pivote actual con pulso de cálculo */}
      <g transform={`translate(${focal.x}, ${focal.y})`}>
        <motion.circle
          cx="0"
          cy="0"
          r="11"
          fill="var(--accent-teal)"
          initial={reduced ? { scale: 1, opacity: 0.16 } : { scale: 0.5, opacity: 0 }}
          animate={
            reduced
              ? { scale: 1, opacity: 0.16 }
              : { scale: [0.5, 0.5, 1.65, 0.9, 0.5], opacity: [0, 0, 0.34, 0.14, 0] }
          }
          transition={{
            duration: 4.4,
            times: [0, 0.26, 0.4, 0.72, 0.95],
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        <circle cx="0" cy="0" r="4.5" fill="var(--accent-teal)" />
      </g>

      {/* Punto objetivo proyectado */}
      <motion.circle
        cx={targetEnd.x}
        cy={targetEnd.y}
        r="4.5"
        fill="var(--bg-surface)"
        stroke="var(--accent-teal)"
        strokeWidth="2.2"
        initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        animate={
          reduced
            ? { scale: 1, opacity: 1 }
            : { scale: [0, 0, 1.2, 1, 1, 0], opacity: [0, 0, 1, 1, 1, 0] }
        }
        transition={{
          duration: 4.4,
          times: [0, 0.64, 0.72, 0.78, 0.88, 0.98],
          repeat: Infinity,
          ease: "easeOut",
        }}
        style={{ transformOrigin: `${targetEnd.x}px ${targetEnd.y}px` }}
      />
    </svg>
  );
}

/**
 * 03. Adaptación financiera
 * Animación corta: cuotas rígidas uniformes que sobrepasan los meses bajos
 * se reacomodan suavemente por debajo de la curva de capacidad económica.
 */
function IllustrationAdaptacion({ reduced }: { reduced: boolean }) {
  const w = 320;
  const h = 156;
  const padY = 26;
  const padX = 24;
  const baseBottom = h - 24;
  const usableH = h - 54;

  const capacityWave = buildSmoothSvgPath(SEASON_SERIES, w, h, padY, padX);
  const flatThresholdY = baseBottom - (52 / 100) * usableH;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full max-h-full h-auto block select-none overflow-visible"
      role="img"
      aria-label="Animación minimalista de cuotas rígidas transformándose en pagos adaptados a la capacidad mensual"
    >
      {/* Línea rígida tradicional (desvanece levemente al adaptarse) */}
      <motion.line
        x1="24"
        y1={flatThresholdY}
        x2={w - 24}
        y2={flatThresholdY}
        stroke="var(--accent-warning)"
        strokeWidth="1.4"
        strokeDasharray="4 5"
        initial={reduced ? { opacity: 0.45 } : { opacity: 0.75 }}
        animate={
          reduced
            ? { opacity: 0.45 }
            : { opacity: [0.75, 0.75, 0.35, 0.35, 0.75] }
        }
        transition={{
          duration: 4.8,
          times: [0, 0.24, 0.54, 0.86, 1],
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Base */}
      <line
        x1="22"
        y1={baseBottom}
        x2={w - 22}
        y2={baseBottom}
        stroke="var(--border-hairline)"
        strokeWidth="1.2"
      />

      {/* Cuotas morphing mediante path SVG (sin translateY CSS) de plan uniforme a plan adaptado */}
      {ADAPTED_QUOTAS.map((adaptedVal, idx) => {
        const uniformVal = UNIFORM_QUOTAS[idx];
        const barW = 11;
        const x = 28 + (idx / (ADAPTED_QUOTAS.length - 1)) * (w - 56 - barW);

        const hUniform = (uniformVal / 100) * usableH;
        const yUniform = baseBottom - hUniform;
        const uniformD = buildRoundedTopBarPath(x, yUniform, barW, hUniform, 3.5);

        const hAdapted = (adaptedVal / 100) * usableH;
        const yAdapted = baseBottom - hAdapted;
        const adaptedD = buildRoundedTopBarPath(x, yAdapted, barW, hAdapted, 3.5);

        const overCapacityWhenUniform = uniformVal > SEASON_SERIES[idx];

        return (
          <g key={idx}>
            <motion.path
              d={reduced ? adaptedD : uniformD}
              fill="var(--accent-teal)"
              initial={
                reduced
                  ? { d: adaptedD, opacity: 0.85 }
                  : { d: uniformD, opacity: 0.45 }
              }
              animate={
                reduced
                  ? { d: adaptedD, opacity: 0.85 }
                  : {
                      d: [uniformD, uniformD, adaptedD, adaptedD, uniformD],
                      opacity: [0.45, 0.45, 0.88, 0.88, 0.45],
                    }
              }
              transition={{
                duration: 4.8,
                times: [0, 0.22, 0.54, 0.86, 1],
                delay: idx * 0.015,
                repeat: Infinity,
                ease: [0.16, 1, 0.3, 1],
              }}
            />

            {/* Resalte ámbar cuando la cuota rígida supera la capacidad del mes */}
            {overCapacityWhenUniform && !reduced && (
              <motion.path
                d={uniformD}
                fill="var(--accent-warning)"
                initial={{ d: uniformD, opacity: 0.85 }}
                animate={{
                  d: [uniformD, uniformD, adaptedD, adaptedD, uniformD],
                  opacity: [0.85, 0.85, 0, 0, 0.85],
                }}
                transition={{
                  duration: 4.8,
                  times: [0, 0.22, 0.5, 0.86, 1],
                  delay: idx * 0.015,
                  repeat: Infinity,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            )}
          </g>
        );
      })}

      {/* Envolvente de capacidad económica */}
      <path
        d={capacityWave}
        fill="none"
        stroke="var(--text-primary)"
        strokeWidth="2.1"
        strokeLinecap="round"
        opacity="0.82"
      />

      {/* Sello discreto de viabilidad al completarse la adaptación */}
      <g transform={`translate(${w - 42}, 20)`}>
        <motion.g
          initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          animate={
            reduced
              ? { scale: 1, opacity: 1 }
              : {
                  scale: [0, 0, 1.12, 1, 1, 0],
                  opacity: [0, 0, 1, 1, 1, 0],
                }
          }
          transition={{
            duration: 4.8,
            times: [0, 0.52, 0.62, 0.68, 0.86, 0.96],
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{ transformOrigin: "10px 10px" }}
        >
          <circle cx="10" cy="10" r="10" fill="var(--accent-teal)" opacity="0.16" />
          <circle cx="10" cy="10" r="8" fill="var(--accent-teal)" />
          <path
            d="M6.5 10.2 L9 12.6 L13.8 7.6"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>
      </g>
    </svg>
  );
}

export function PrincipleIllustration({ index }: { index: "01" | "02" | "03" }) {
  const reduced = usePrefersReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full h-[176px] flex items-center justify-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] p-3 sm:p-4">
        {index === "01" && <IllustrationRitmo reduced={reduced} />}
        {index === "02" && <IllustrationPredictiva reduced={reduced} />}
        {index === "03" && <IllustrationAdaptacion reduced={reduced} />}
      </div>
    </MotionConfig>
  );
}
