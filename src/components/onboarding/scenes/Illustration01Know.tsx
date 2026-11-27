import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../useStageProgress";

/**
 * 01. CONOCE
 * Un asesor conversando con un pequeño empresario mientras registra sus datos.
 */
export function Illustration01Know() {
  const reduced = usePrefersReducedMotion();

  return (
    <svg
      viewBox="0 0 760 360"
      className="w-full h-auto block select-none overflow-visible"
      role="img"
      aria-label="Ilustración minimalista de un asesor conversando con un pequeño empresario mientras registra datos económicos"
    >
      <defs>
        <linearGradient id="ill01TealGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity="0.02" />
        </linearGradient>
        <filter id="ill01SoftShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0A1628" floodOpacity="0.07" />
        </filter>
      </defs>

      {/* Halo ambiental sutil detrás de la interacción */}
      <motion.circle
        cx="385"
        cy="176"
        r="128"
        fill="url(#ill01TealGlow)"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Línea de suelo arquitectónica */}
      <line
        x1="120"
        y1="316"
        x2="640"
        y2="316"
        stroke="var(--border-hairline)"
        strokeWidth="1.2"
      />

      {/* Sombras de apoyo */}
      <ellipse cx="262" cy="316" rx="46" ry="5" fill="var(--text-primary)" opacity="0.08" />
      <ellipse cx="486" cy="316" rx="58" ry="5" fill="var(--text-primary)" opacity="0.08" />

      {/* Elemento sutil de mostrador / puesto comercial del empresario (fondo derecho) */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <rect
          x="524"
          y="214"
          width="88"
          height="102"
          rx="6"
          fill="var(--bg-surface)"
          stroke="var(--border-hairline)"
          strokeWidth="1.2"
        />
        <rect x="518" y="206" width="100" height="10" rx="4" fill="var(--border-strong)" opacity="0.45" />
        <rect x="540" y="182" width="24" height="24" rx="4" fill="var(--accent-teal)" opacity="0.18" />
        <rect x="570" y="190" width="26" height="16" rx="3" fill="var(--text-muted)" opacity="0.2" />
      </motion.g>

      {/* PERSONAJE 1: Asesor financiero (izquierda) */}
      <motion.g
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Piernas y zapatos anclados al suelo */}
        <rect x="241" y="218" width="42" height="14" rx="4" fill="#0F1D32" />
        <path d="M242 222 L236 312 L250 312 L258 228 Z" fill="#172842" />
        <path d="M266 224 L274 312 L288 312 L282 222 Z" fill="#0F1D32" />
        <ellipse cx="244" cy="313" rx="11" ry="3.5" fill="#0A1628" />
        <ellipse cx="283" cy="313" rx="11" ry="3.5" fill="#0A1628" />

        {/* Respiración y postura del tren superior */}
        <motion.g
          animate={reduced ? undefined : { y: [0, -3.15, 0], rotate: [0, 2.2, -0.5, 0] }}
          transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "262px 226px" }}
        >
          {/* Torso con saco editorial azul tinta */}
          <path
            d="M232 142 C232 132, 244 126, 262 126 C280 126, 290 134, 290 146 L286 228 L238 228 Z"
            fill="#0F223D"
          />
          {/* Camisa interior limpia */}
          <path d="M254 128 L269 128 L264 166 Z" fill="#FAF9F5" />

          {/* Brazo trasero y tableta con leve inclinación */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, 2.1, -1.05, 0] }}
            transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "278px 144px" }}
          >
            <path
              d="M278 144 C298 156, 308 176, 326 178"
              fill="none"
              stroke="#172E50"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <circle cx="329" cy="178" r="6" fill="#E2B49A" />

            {/* Tableta tecnológica minimalista */}
            <g transform="translate(318, 152) rotate(-14)">
              <rect
                x="0"
                y="0"
                width="44"
                height="30"
                rx="5"
                fill="var(--bg-surface)"
                stroke="var(--accent-teal)"
                strokeWidth="1.6"
                filter="url(#ill01SoftShadow)"
              />
              <line x1="8" y1="11" x2="26" y2="11" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="18" x2="34" y2="18" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
            </g>
          </motion.g>

          {/* Brazo frontal registrando datos */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, -8.3, 2.6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "242px 146px" }}
          >
            <path
              d="M242 146 C248 174, 272 184, 304 176"
              fill="none"
              stroke="#1E3A5F"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <circle cx="307" cy="175" r="5.5" fill="#E2B49A" />
          </motion.g>

          {/* Cuello y cabeza con asentimiento expresivo */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, 6.1, -1.6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "261px 124px" }}
          >
            <rect x="255" y="112" width="12" height="16" rx="5" fill="#D5A084" />
            <circle cx="263" cy="96" r="18" fill="#E2B49A" />
            {/* Cabello geométrico limpio */}
            <path
              d="M245 94 C245 80, 258 74, 271 77 C280 79, 282 88, 279 94 C272 88, 256 88, 245 94 Z"
              fill="#0A1628"
            />
          </motion.g>
        </motion.g>
      </motion.g>

      {/* PERSONAJE 2: Pequeño empresario (derecha) */}
      <motion.g
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Piernas y zapatos anclados al suelo */}
        <path d="M466 226 L460 312 L474 312 L482 228 Z" fill="#1E293B" />
        <path d="M488 228 L498 312 L512 312 L506 226 Z" fill="#141E2E" />
        <ellipse cx="465" cy="313" rx="11" ry="3.5" fill="#0A1628" />
        <ellipse cx="505" cy="313" rx="11" ry="3.5" fill="#0A1628" />

        {/* Respiración y balanceo del tren superior */}
        <motion.g
          animate={reduced ? undefined : { y: [0, -3.0, 0], rotate: [0, -1.9, 0.5, 0] }}
          transition={{ duration: 3.1, delay: 0.35, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "485px 228px" }}
        >
          {/* Torso con camisa clara cálida y mandil/chaleco editorial */}
          <path
            d="M456 144 C456 132, 468 126, 486 126 C504 126, 514 134, 514 146 L510 228 L460 228 Z"
            fill="#D8D2C5"
          />
          <path
            d="M464 146 L504 146 L508 232 L462 232 Z"
            fill="#2B4C7E"
            opacity="0.92"
          />

          {/* Brazo en gesto de conversación */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, -11.8, 3.1, 0] }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "464px 148px" }}
          >
            <path
              d="M464 148 C444 166, 434 176, 412 168"
              fill="none"
              stroke="#D8D2C5"
              strokeWidth="12.5"
              strokeLinecap="round"
            />
            <circle cx="409" cy="167" r="5.5" fill="#C88F71" />
          </motion.g>

          {/* Cuello y cabeza con inclinación de diálogo */}
          <motion.g
            animate={reduced ? undefined : { rotate: [0, -5.95, 1.9, 0] }}
            transition={{ duration: 2.7, delay: 0.25, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "485px 124px" }}
          >
            <rect x="479" y="112" width="12" height="16" rx="5" fill="#B87E61" />
            <circle cx="484" cy="96" r="18" fill="#C88F71" />
            <path
              d="M466 93 C467 78, 484 74, 496 80 C503 84, 503 93, 499 97 C491 90, 476 89, 466 93 Z"
              fill="#161F2E"
            />
          </motion.g>
        </motion.g>
      </motion.g>

      {/* Flujo flotante de datos capturados entre ambos personajes */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Panel flotante minimalista arriba del diálogo */}
        <rect
          x="332"
          y="78"
          width="118"
          height="54"
          rx="10"
          fill="var(--bg-surface)"
          stroke="var(--border-hairline)"
          strokeWidth="1.2"
          filter="url(#ill01SoftShadow)"
        />
        {/* Barras simbólicas apareciendo progresivamente */}
        {[
          { x: 350, h: 14, delay: 0.7 },
          { x: 366, h: 22, delay: 0.9 },
          { x: 382, h: 18, delay: 1.1 },
          { x: 398, h: 28, delay: 1.3 },
          { x: 414, h: 20, delay: 1.5 },
        ].map((b, i) => (
          <motion.rect
            key={i}
            x={b.x}
            y={118 - b.h}
            width="9"
            height={b.h}
            rx="2.5"
            fill={i === 3 ? "var(--accent-teal)" : "var(--text-primary)"}
            opacity={i === 3 ? 0.95 : 0.24}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: i === 3 ? 0.95 : 0.26 }}
            transition={{ duration: 0.8, delay: b.delay, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${b.x + 4.5}px 118px` }}
          />
        ))}

        {/* Puntos conectores discretos entre la tableta y el flujo */}
        <motion.path
          d="M348 148 C354 138, 362 135, 370 132"
          fill="none"
          stroke="var(--accent-teal)"
          strokeWidth="1.6"
          strokeDasharray="3 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ duration: 1.0, delay: 1.1 }}
        />
      </motion.g>
    </svg>
  );
}
