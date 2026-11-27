import { motion } from "motion/react";
import { buildSmoothSvgPath } from "../onboardingLogic";
import { usePrefersReducedMotion } from "../useStageProgress";

const CYCLE_CURVE = [34, 28, 42, 62, 86, 94, 82, 60, 44, 38, 52, 68];

/**
 * 02. PREDICE
 * Una persona observando una curva económica que representa los ciclos de ingresos de un negocio.
 */
export function Illustration02Predict() {
  const reduced = usePrefersReducedMotion();
  const curveX = 278;
  const curveY = 64;
  const curveW = 370;
  const curveH = 190;

  const curvePath = buildSmoothSvgPath(CYCLE_CURVE, curveW, curveH, 24, 16);
  const areaPath = `${curvePath} L ${curveW - 16} ${curveH} L 16 ${curveH} Z`;

  return (
    <svg
      viewBox="0 0 760 360"
      className="w-full h-auto block select-none overflow-visible"
      role="img"
      aria-label="Ilustración minimalista de una persona observando una curva económica que representa ciclos de ingresos"
    >
      <defs>
        <linearGradient id="ill02CurveArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity="0.0" />
        </linearGradient>
        <filter id="ill02SoftShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#0A1628" floodOpacity="0.06" />
        </filter>
      </defs>

      {/* Línea de suelo */}
      <line
        x1="110"
        y1="316"
        x2="650"
        y2="316"
        stroke="var(--border-hairline)"
        strokeWidth="1.2"
      />

      {/* Sombra del personaje */}
      <ellipse cx="194" cy="316" rx="44" ry="5" fill="var(--text-primary)" opacity="0.08" />

      {/* Panel flotante posicionado por <g> estático para no colisionar con motion transform */}
      <g transform={`translate(${curveX}, ${curveY})`}>
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect
            x="0"
            y="0"
            width={curveW}
            height={curveH}
            rx="16"
            fill="var(--bg-surface)"
            stroke="var(--border-hairline)"
            strokeWidth="1.2"
            filter="url(#ill02SoftShadow)"
          />

          {[0.32, 0.58, 0.82].map((r) => (
            <line
              key={r}
              x1="20"
              y1={curveH * r}
              x2={curveW - 20}
              y2={curveH * r}
              stroke="var(--chart-grid)"
              strokeWidth="1"
            />
          ))}

          <motion.line
            x1="22"
            y1={curveH * 0.68}
            x2={curveW - 22}
            y2={curveH * 0.38}
            stroke="var(--text-muted)"
            strokeWidth="1.3"
            strokeDasharray="4 6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ duration: 1.0, delay: 0.4 }}
          />

          <motion.path
            d={areaPath}
            fill="url(#ill02CurveArea)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.3, delay: 0.3 }}
          />

          <path
            d={curvePath}
            fill="none"
            stroke="var(--accent-teal)"
            strokeWidth="3.2"
            strokeLinecap="round"
            className="animate-curve-draw-slow"
          />

          {[
            { idx: 1, color: "var(--accent-warning)", delay: 0.7 },
            { idx: 5, color: "var(--accent-teal)", delay: 0.9 },
            { idx: 9, color: "var(--accent-warning)", delay: 1.1 },
          ].map((pt) => {
            const x = 16 + (pt.idx / 11) * (curveW - 32);
            const y = curveH - 24 - (CYCLE_CURVE[pt.idx] / 100) * (curveH - 48);
            return (
              <motion.circle
                key={pt.idx}
                cx={x}
                cy={y}
                r="5.5"
                fill="var(--bg-surface)"
                stroke={pt.color}
                strokeWidth="2.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: pt.delay }}
              />
            );
          })}
        </motion.g>
      </g>

      {/* PERSONAJE observando la curva (perfil limpio, izquierda) */}
      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <rect x="173" y="218" width="40" height="14" rx="4" fill="#0F1D32" />
        <path d="M174 222 L170 312 L184 312 L190 226 Z" fill="#172842" />
        <path d="M196 224 L204 312 L218 312 L212 222 Z" fill="#0F1D32" />
        <ellipse cx="177" cy="313" rx="11" ry="3.5" fill="#0A1628" />
        <ellipse cx="212" cy="313" rx="11" ry="3.5" fill="#0A1628" />

        {/* Respiración y balanceo expresivo */}
        <motion.g
          animate={reduced ? undefined : { y: [0, -3.3, 0], rotate: [0, 2.2, -0.7, 0] }}
          transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "194px 226px" }}
        >
          <path
            d="M166 142 C166 130, 178 124, 195 124 C210 124, 222 134, 222 146 L216 226 L172 226 Z"
            fill="#2B4C7E"
          />

          {/* Brazo señalando la curva */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, -8.75, 2.2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "210px 148px" }}
          >
            <path
              d="M210 148 C230 154, 246 150, 260 140"
              fill="none"
              stroke="#355C96"
              strokeWidth="12.5"
              strokeLinecap="round"
            />
            <circle cx="262" cy="139" r="5.5" fill="#E2B49A" />
          </motion.g>

          <path
            d="M174 148 C166 176, 174 198, 188 202"
            fill="none"
            stroke="#1E3A5F"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Cabeza recorriendo visualmente el ciclo */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, -6.1, 3.9, 0] }}
            transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "194px 122px" }}
          >
            <rect x="188" y="108" width="12" height="18" rx="5" fill="#D5A084" />
            <circle cx="196" cy="92" r="18" fill="#E2B49A" />
            <path
              d="M178 92 C178 76, 194 70, 208 75 C215 78, 216 86, 212 90 C203 84, 189 85, 178 92 Z"
              fill="#0A1628"
            />
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
