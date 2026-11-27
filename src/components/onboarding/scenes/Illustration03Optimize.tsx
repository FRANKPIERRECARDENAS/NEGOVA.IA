import { motion } from "motion/react";
import { buildSmoothSvgPath } from "../onboardingLogic";

const CAPACITY_WAVE = [36, 32, 46, 66, 86, 94, 84, 62, 48, 42, 50, 62];
const UNIFORM_BARS = [58, 58, 58, 58, 58, 58, 58, 58, 58, 58, 58, 58];
const ADAPTED_BARS = [30, 27, 38, 56, 76, 84, 74, 53, 40, 35, 42, 52];

/**
 * 03. OPTIMIZA
 * Un empresario observando dos cronogramas visuales que se transforman en un plan adaptado.
 */
export function Illustration03Optimize() {
  const panelX = 282;
  const panelW = 376;

  const wavePathTop = buildSmoothSvgPath(CAPACITY_WAVE, panelW, 96, 12, 20);
  const wavePathBottom = buildSmoothSvgPath(CAPACITY_WAVE, panelW, 104, 14, 20);

  return (
    <svg
      viewBox="0 0 760 360"
      className="w-full h-auto block select-none overflow-visible"
      role="img"
      aria-label="Ilustración minimalista de un empresario observando dos cronogramas visuales que se adaptan a su capacidad"
    >
      <defs>
        <filter id="ill03SoftShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0A1628" floodOpacity="0.06" />
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

      {/* CRONOGRAMA SUPERIOR: Cuotas uniformes tradicionales */}
      <g transform={`translate(${panelX}, 48)`}>
        <motion.g
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect
            x="0"
            y="0"
            width={panelW}
            height="96"
            rx="14"
            fill="var(--bg-surface)"
            stroke="var(--border-hairline)"
            strokeWidth="1.2"
            filter="url(#ill03SoftShadow)"
          />
          {UNIFORM_BARS.map((val, idx) => {
            const barW = 14;
            const x = 24 + (idx / 11) * (panelW - 48 - barW);
            const h = (val / 100) * 60;
            const y = 80 - h;
            const tight = val > CAPACITY_WAVE[idx];
            return (
              <motion.rect
                key={idx}
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="3"
                fill={tight ? "var(--accent-risk)" : "var(--text-muted)"}
                initial={{ opacity: 0, scaleY: 0.25 }}
                animate={{ opacity: tight ? 0.55 : 0.28, scaleY: 1 }}
                transition={{ duration: 0.32, delay: 0.05 + idx * 0.015 }}
                style={{ transformOrigin: `${x + barW / 2}px 80px` }}
              />
            );
          })}
          <path
            d={wavePathTop}
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="1.6"
            strokeDasharray="4 4"
            opacity="0.45"
          />
        </motion.g>
      </g>

      {/* Flecha sutil de transformación */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ duration: 0.45, delay: 0.25 }}
      >
        <path
          d="M470 152 L470 174 M464 168 L470 175 L476 168"
          fill="none"
          stroke="var(--accent-teal)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* CRONOGRAMA INFERIOR: Plan adaptado al ritmo económico */}
      <g transform={`translate(${panelX}, 184)`}>
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect
            x="0"
            y="0"
            width={panelW}
            height="104"
            rx="14"
            fill="var(--bg-surface)"
            stroke="var(--accent-teal)"
            strokeOpacity="0.45"
            strokeWidth="1.4"
            filter="url(#ill03SoftShadow)"
          />
          {ADAPTED_BARS.map((val, idx) => {
            const barW = 14;
            const x = 24 + (idx / 11) * (panelW - 48 - barW);
            const h = (val / 100) * 66;
            const y = 86 - h;
            return (
              <motion.rect
                key={idx}
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="3"
                fill="var(--accent-teal)"
                initial={{ scaleY: 0.2, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 0.85 }}
                transition={{
                  duration: 0.35,
                  delay: 0.22 + idx * 0.015,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ transformOrigin: `${x + barW / 2}px 86px` }}
              />
            );
          })}
          <path
            d={wavePathBottom}
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="1.8"
            opacity="0.7"
            className="animate-curve-draw"
          />
        </motion.g>
      </g>

      {/* PERSONAJE: El mismo empresario observando la transformación */}
      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <path d="M174 224 L170 312 L184 312 L190 226 Z" fill="#1E293B" />
        <path d="M196 226 L204 312 L218 312 L212 224 Z" fill="#141E2E" />
        <ellipse cx="177" cy="313" rx="11" ry="3.5" fill="#0A1628" />
        <ellipse cx="212" cy="313" rx="11" ry="3.5" fill="#0A1628" />

        <path
          d="M166 144 C166 132, 178 126, 195 126 C210 126, 222 134, 222 146 L216 228 L172 228 Z"
          fill="#D8D2C5"
        />
        <path d="M174 146 L214 146 L218 232 L172 232 Z" fill="#2B4C7E" opacity="0.92" />

        <path
          d="M210 150 C228 172, 234 192, 214 196"
          fill="none"
          stroke="#D8D2C5"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="212" cy="196" r="5.5" fill="#C88F71" />

        <rect x="188" y="110" width="12" height="17" rx="5" fill="#B87E61" />
        <circle cx="195" cy="94" r="18" fill="#C88F71" />
        <path
          d="M177 92 C178 78, 194 74, 207 79 C214 83, 214 91, 210 95 C202 89, 187 88, 177 92 Z"
          fill="#161F2E"
        />
      </motion.g>
    </svg>
  );
}
