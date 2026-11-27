import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { buildSmoothSvgPath } from "../onboardingLogic";
import { usePrefersReducedMotion } from "../useStageProgress";

const BASE_SERIES = [42, 38, 54, 72, 90, 95, 84, 66, 52, 46, 54, 66];
const WEATHER_SERIES = [42, 38, 48, 42, 46, 52, 62, 60, 52, 46, 54, 66];

/**
 * 04. ANTICIPA
 * Un empresario observando cómo un fenómeno climático modifica una gráfica financiera.
 */
export function Illustration04Anticipate() {
  const reduced = usePrefersReducedMotion();
  const [weatherActive, setWeatherActive] = useState<boolean>(reduced);

  useEffect(() => {
    if (reduced) {
      setWeatherActive(true);
      return;
    }
    setWeatherActive(false);
    const t = window.setTimeout(() => setWeatherActive(true), 1100);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const panelX = 278;
  const panelY = 66;
  const panelW = 374;
  const panelH = 200;

  const basePath = buildSmoothSvgPath(BASE_SERIES, panelW, panelH, 32, 20);
  const activePath = buildSmoothSvgPath(
    weatherActive ? WEATHER_SERIES : BASE_SERIES,
    panelW,
    panelH,
    32,
    20
  );

  return (
    <svg
      viewBox="0 0 760 360"
      className="w-full h-auto block select-none overflow-visible"
      role="img"
      aria-label="Ilustración minimalista de un empresario observando cómo un fenómeno climático modifica una gráfica financiera"
    >
      <defs>
        <filter id="ill04SoftShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#0A1628" floodOpacity="0.06" />
        </filter>
      </defs>

      <line
        x1="110"
        y1="316"
        x2="650"
        y2="316"
        stroke="var(--border-hairline)"
        strokeWidth="1.2"
      />
      <ellipse cx="196" cy="316" rx="46" ry="5" fill="var(--text-primary)" opacity="0.08" />

      {/* Panel flotante posicionado con <g> estático */}
      <g transform={`translate(${panelX}, ${panelY})`}>
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect
            x="0"
            y="0"
            width={panelW}
            height={panelH}
            rx="16"
            fill="var(--bg-surface)"
            stroke="var(--border-hairline)"
            strokeWidth="1.2"
            filter="url(#ill04SoftShadow)"
          />

          {[0.38, 0.66, 0.86].map((r) => (
            <line
              key={r}
              x1="20"
              y1={panelH * r}
              x2={panelW - 20}
              y2={panelH * r}
              stroke="var(--chart-grid)"
              strokeWidth="1"
            />
          ))}

          {/* Franja suave de impacto climático */}
          <motion.rect
            x="104"
            y="38"
            width="110"
            height={panelH - 56}
            rx="8"
            fill="var(--accent-warning)"
            animate={{ opacity: weatherActive ? 0.11 : 0 }}
            transition={{ duration: 0.9 }}
          />

          {/* Curva base punteada */}
          <path
            d={basePath}
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.6"
            strokeDasharray="4 5"
            opacity={weatherActive ? 0.55 : 0.2}
          />

          {/* Curva modificada por el clima */}
          <motion.path
            d={activePath}
            animate={{ d: activePath }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            fill="none"
            stroke={weatherActive ? "var(--accent-warning)" : "var(--accent-teal)"}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Nube minimalista y gotas centradas sobre la franja de impacto */}
          <g transform="translate(116, -24)">
            <motion.g
              animate={{
                opacity: weatherActive ? 1 : 0.25,
                y: weatherActive ? 0 : -6,
              }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <path
                d="M22 44 C10 44, 2 35, 4 24 C6 15, 14 10, 23 12 C28 3, 42 1, 52 8 C62 8, 71 15, 72 25 C79 27, 83 35, 79 41 C77 44, 72 44, 67 44 Z"
                fill="var(--bg-elevated)"
                stroke="var(--accent-warning)"
                strokeWidth="1.8"
              />
              {[24, 42, 60].map((gx, i) => (
                <motion.line
                  key={gx}
                  x1={gx}
                  y1="52"
                  x2={gx - 5}
                  y2="68"
                  stroke="var(--accent-warning)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  animate={
                    reduced
                      ? { opacity: 0.7 }
                      : { opacity: [0.25, 0.85, 0.25], y: [0, 4, 0] }
                  }
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.g>
          </g>
        </motion.g>
      </g>

      {/* PERSONAJE: Empresario observando el ajuste */}
      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <path d="M174 224 L170 312 L184 312 L190 226 Z" fill="#1E293B" />
        <path d="M196 226 L204 312 L218 312 L212 224 Z" fill="#141E2E" />
        <ellipse cx="177" cy="313" rx="11" ry="3.5" fill="#0A1628" />
        <ellipse cx="212" cy="313" rx="11" ry="3.5" fill="#0A1628" />

        {/* Respiración y atención del tren superior */}
        <motion.g
          animate={reduced ? undefined : { y: [0, -3.15, 0], rotate: [0, 1.9, -0.6, 0] }}
          transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "194px 228px" }}
        >
          <path
            d="M166 144 C166 132, 178 126, 195 126 C210 126, 222 134, 222 146 L216 228 L172 228 Z"
            fill="#D8D2C5"
          />
          <path d="M174 146 L214 146 L218 232 L172 232 Z" fill="#2B4C7E" opacity="0.92" />

          {/* Gesto del brazo observando el ajuste */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, -7.9, 1.9, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "208px 150px" }}
          >
            <path
              d="M208 150 C226 160, 242 158, 256 150"
              fill="none"
              stroke="#D8D2C5"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <circle cx="258" cy="149" r="5.5" fill="#C88F71" />
          </motion.g>

          {/* Mirada elevándose hacia el evento climático */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, -7.7, 2.2, 0] }}
            transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "194px 124px" }}
          >
            <rect x="188" y="110" width="12" height="17" rx="5" fill="#B87E61" />
            <circle cx="195" cy="94" r="18" fill="#C88F71" />
            <path
              d="M177 92 C178 78, 194 74, 207 79 C214 83, 214 91, 210 95 C202 89, 187 88, 177 92 Z"
              fill="#161F2E"
            />
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
