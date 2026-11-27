import { motion } from "motion/react";
import { buildSmoothSvgPath } from "../onboardingLogic";
import { usePrefersReducedMotion } from "../useStageProgress";

const REPORT_CURVE = [36, 44, 62, 82, 74, 58, 66, 78];

/**
 * 05. DECIDE
 * Un especialista revisando un informe financiero frente a un comité.
 */
export function Illustration05Decide() {
  const reduced = usePrefersReducedMotion();
  const boardX = 248;
  const boardY = 58;
  const boardW = 192;
  const boardH = 148;
  const miniCurve = buildSmoothSvgPath(REPORT_CURVE, 152, 64, 10, 6);

  return (
    <svg
      viewBox="0 0 760 360"
      className="w-full h-auto block select-none overflow-visible"
      role="img"
      aria-label="Ilustración minimalista de un especialista presentando un informe financiero frente a un comité"
    >
      <defs>
        <filter id="ill05SoftShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0A1628" floodOpacity="0.06" />
        </filter>
      </defs>

      <line
        x1="90"
        y1="316"
        x2="670"
        y2="316"
        stroke="var(--border-hairline)"
        strokeWidth="1.2"
      />
      <ellipse cx="182" cy="316" rx="44" ry="5" fill="var(--text-primary)" opacity="0.08" />

      {/* Mesa de comité minimalista (derecha) */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        {[
          { x: 486, headY: 146, shirt: "#2B4C7E", skin: "#D9A78B", hair: "#0A1628", delay: 0.12 },
          { x: 548, headY: 138, shirt: "#172E50", skin: "#C88F71", hair: "#161F2E", delay: 0.18 },
          { x: 608, headY: 146, shirt: "#355C96", skin: "#E2B49A", hair: "#1E293B", delay: 0.24 },
        ].map((member, i) => {
          const shoulderTop = member.headY + 26;
          const shoulderSide = member.headY + 36;
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: member.delay }}
            >
              {/* Respiración y escucha atenta escalonada */}
              <motion.g
                animate={
                  reduced
                    ? undefined
                    : { y: [0, -3.05, 0], rotate: [0, i === 1 ? -1.2 : 1.2, 0] }
                }
                transition={{
                  duration: 2.9 + i * 0.35,
                  delay: 0.15 + i * 0.28,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: `${member.x}px 228px` }}
              >
                {/* Cuello conectado detrás del torso */}
                <rect
                  x={member.x - 5}
                  y={member.headY + 12}
                  width="10"
                  height="24"
                  rx="4"
                  fill={member.skin}
                />
                {/* Torso sentado extendido detrás de la mesa (231 > 224) */}
                <path
                  d={`M${member.x - 22} 231 L${member.x - 18} ${shoulderSide} C${member.x - 16} ${shoulderTop}, ${member.x + 16} ${shoulderTop}, ${member.x + 18} ${shoulderSide} L${member.x + 22} 231 Z`}
                  fill={member.shirt}
                />
                {/* Cabeza con asentimiento atento */}
                <motion.g
                  animate={
                    reduced
                      ? undefined
                      : { rotate: [0, i === 1 ? -5.1 : 5.4, i === 1 ? 1.75 : -1.3, 0] }
                  }
                  transition={{
                    duration: 2.7 + i * 0.35,
                    delay: 0.25 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ transformOrigin: `${member.x}px ${member.headY + 18}px` }}
                >
                  <circle cx={member.x} cy={member.headY} r="15" fill={member.skin} />
                  <path
                    d={`M${member.x - 15} ${member.headY - 2} C${member.x - 14} ${member.headY - 16}, ${member.x + 14} ${member.headY - 16}, ${member.x + 15} ${member.headY - 2} C${member.x + 6} ${member.headY - 7}, ${member.x - 6} ${member.headY - 7}, ${member.x - 15} ${member.headY - 2} Z`}
                    fill={member.hair}
                  />
                </motion.g>
              </motion.g>
            </motion.g>
          );
        })}

        {/* Superficie de mesa */}
        <rect
          x="456"
          y="224"
          width="196"
          height="10"
          rx="5"
          fill="var(--bg-surface)"
          stroke="var(--border-strong)"
          strokeWidth="1.2"
        />
        <line x1="486" y1="234" x2="486" y2="316" stroke="var(--border-strong)" strokeWidth="4" strokeLinecap="round" />
        <line x1="622" y1="234" x2="622" y2="316" stroke="var(--border-strong)" strokeWidth="4" strokeLinecap="round" />
      </motion.g>

      {/* Informe financiero flotante posicionado con <g> estático */}
      <g transform={`translate(${boardX}, ${boardY})`}>
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect
            x="0"
            y="0"
            width={boardW}
            height={boardH}
            rx="14"
            fill="var(--bg-surface)"
            stroke="var(--border-hairline)"
            strokeWidth="1.3"
            filter="url(#ill05SoftShadow)"
          />

          <rect x="20" y="20" width="68" height="6" rx="3" fill="var(--text-primary)" opacity="0.75" />
          <rect x="20" y="32" width="110" height="4" rx="2" fill="var(--text-muted)" opacity="0.35" />

          <g transform="translate(20, 48)">
            <rect
              x="0"
              y="0"
              width="152"
              height="64"
              rx="8"
              fill="var(--bg-elevated)"
              stroke="var(--border-hairline)"
              strokeWidth="1"
            />
            <path
              d={miniCurve}
              fill="none"
              stroke="var(--accent-teal)"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="animate-curve-draw-slow"
            />
          </g>

          {/* Sello de validación posicionado por <g> estático */}
          <g transform="translate(148, 118)">
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <circle cx="12" cy="12" r="12" fill="var(--accent-teal)" />
              <path
                d="M7 12.5 L10.5 16 L17.5 8.5"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.g>
          </g>
          <rect x="20" y="128" width="96" height="5" rx="2.5" fill="var(--text-muted)" opacity="0.35" />
        </motion.g>
      </g>

      {/* PERSONAJE: Especialista presentando el informe (izquierda) */}
      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <rect x="160" y="218" width="42" height="14" rx="4" fill="#0F1D32" />
        <path d="M162 222 L156 312 L170 312 L178 226 Z" fill="#172842" />
        <path d="M184 224 L192 312 L206 312 L200 222 Z" fill="#0F1D32" />
        <ellipse cx="163" cy="313" rx="11" ry="3.5" fill="#0A1628" />
        <ellipse cx="201" cy="313" rx="11" ry="3.5" fill="#0A1628" />

        {/* Respiración y postura de exposición del especialista */}
        <motion.g
          animate={reduced ? undefined : { y: [0, -3.15, 0], rotate: [0, 2.0, -0.6, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "182px 228px" }}
        >
          <path
            d="M154 142 C154 132, 166 126, 182 126 C198 126, 208 134, 208 146 L204 228 L158 228 Z"
            fill="#0F223D"
          />
          <path d="M174 128 L188 128 L183 166 Z" fill="#FAF9F5" />

          {/* Brazo señalando el informe */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, -10.9, 2.8, 0] }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "196px 146px" }}
          >
            <path
              d="M196 146 C214 144, 228 134, 240 124"
              fill="none"
              stroke="#172E50"
              strokeWidth="12.5"
              strokeLinecap="round"
            />
            <circle cx="242" cy="122" r="5.5" fill="#E2B49A" />
          </motion.g>

          {/* Cabeza alternando entre comité e informe */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, 5.7, -3.05, 0] }}
            transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "180px 124px" }}
          >
            <rect x="174" y="110" width="12" height="16" rx="5" fill="#D5A084" />
            <circle cx="182" cy="94" r="18" fill="#E2B49A" />
            <path
              d="M164 92 C164 78, 178 72, 191 75 C199 77, 201 86, 198 92 C190 86, 175 86, 164 92 Z"
              fill="#0A1628"
            />
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
