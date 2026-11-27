interface StepVisualProps {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export function StepVisual({ step }: StepVisualProps) {
  return (
    <div
      className="hidden sm:flex items-center justify-center w-[112px] h-[54px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1.5 shrink-0"
      aria-hidden="true"
    >
      {step === 1 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <rect
            x="8"
            y="14"
            width="24"
            height="18"
            rx="2"
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="1.5"
          />
          <path d="M12 14 V9 H28 V14" fill="none" stroke="var(--accent-teal)" strokeWidth="1.5" />
          <line x1="15" y1="22" x2="25" y2="22" stroke="var(--border-strong)" strokeWidth="1.5" />
          <path
            d="M42 28 C50 28, 54 10, 66 14 C76 17, 80 26, 88 10"
            fill="none"
            stroke="var(--accent-teal)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="66" cy="14" r="2.5" fill="var(--accent-teal)" />
        </svg>
      )}

      {step === 2 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <line x1="6" y1="34" x2="90" y2="34" stroke="var(--border-hairline)" strokeWidth="1.2" />
          {[14, 18, 12, 24, 28, 20, 16, 26, 30, 22, 0, 0].map((h, i) => {
            const x = 10 + i * 6.8;
            if (h === 0) {
              return (
                <rect
                  key={i}
                  x={x}
                  y={16}
                  width="4.2"
                  height="18"
                  rx="1"
                  fill="none"
                  stroke="var(--accent-warning)"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
              );
            }
            return (
              <rect
                key={i}
                x={x}
                y={34 - h}
                width="4.2"
                height={h}
                rx="1"
                fill="var(--accent-teal)"
                opacity={0.45 + (h / 30) * 0.55}
              />
            );
          })}
        </svg>
      )}

      {step === 3 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <rect
            x="8"
            y="8"
            width="80"
            height="10"
            rx="2"
            fill="var(--border-hairline)"
          />
          <rect x="8" y="8" width="46" height="10" rx="2" fill="var(--chart-bar-base)" />
          <rect x="56" y="8" width="32" height="10" rx="2" fill="var(--accent-teal)" />
          <line x1="8" y1="26" x2="54" y2="26" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="56" y1="26" x2="88" y2="26" stroke="var(--accent-teal)" strokeWidth="2" />
          <circle cx="88" cy="26" r="2.5" fill="var(--accent-teal)" />
        </svg>
      )}

      {step === 4 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <rect x="10" y="7" width="76" height="26" rx="3" fill="none" stroke="var(--border-strong)" strokeWidth="1.3" />
          <rect x="14" y="11" width="34" height="18" rx="1.5" fill="var(--chart-bar-base)" opacity="0.45" />
          <rect x="51" y="11" width="31" height="18" rx="1.5" fill="var(--accent-teal)" opacity="0.85" />
          <line x1="49.5" y1="5" x2="49.5" y2="35" stroke="var(--text-primary)" strokeWidth="1.2" strokeDasharray="2 2" />
        </svg>
      )}

      {step === 5 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <line x1="10" y1="12" x2="86" y2="12" stroke="var(--accent-risk)" strokeWidth="1.4" strokeDasharray="4 3" />
          {[14, 10, 18, 22, 16, 12, 20].map((h, i) => (
            <rect
              key={i}
              x={12 + i * 11}
              y={34 - h}
              width="7"
              height={h}
              rx="1.5"
              fill="var(--accent-teal)"
            />
          ))}
          <line x1="8" y1="34" x2="88" y2="34" stroke="var(--border-hairline)" strokeWidth="1.2" />
        </svg>
      )}

      {step === 6 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <path
            d="M46 22 L66 12 L88 8 L88 28 L66 25 Z"
            fill="var(--accent-teal)"
            opacity="0.18"
          />
          <path
            d="M8 28 L22 25 L34 27 L46 22"
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M46 22 L66 18 L88 16"
            fill="none"
            stroke="var(--accent-teal)"
            strokeWidth="2"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />
          <circle cx="46" cy="22" r="2.8" fill="var(--accent-teal)" />
        </svg>
      )}

      {step === 7 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <line x1="8" y1="20" x2="88" y2="20" stroke="var(--chart-bar-base)" strokeWidth="1.5" strokeDasharray="3 3" />
          <path
            d="M8 28 C22 30, 32 10, 48 12 C62 14, 72 30, 88 18"
            fill="none"
            stroke="var(--accent-teal)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="48" cy="12" r="2.5" fill="var(--accent-teal)" />
        </svg>
      )}

      {step === 8 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <path
            d="M8 14 C24 14, 34 12, 48 14 C64 16, 76 13, 88 13"
            fill="none"
            stroke="var(--chart-bar-base)"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <path
            d="M8 14 C24 14, 32 30, 48 30 C64 30, 74 16, 88 15"
            fill="none"
            stroke="var(--accent-warning)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="48" cy="30" r="2.6" fill="var(--accent-warning)" />
        </svg>
      )}

      {step === 9 && (
        <svg viewBox="0 0 96 40" className="w-full h-full overflow-visible">
          <rect x="14" y="6" width="44" height="28" rx="2" fill="none" stroke="var(--border-strong)" strokeWidth="1.3" />
          <line x1="20" y1="14" x2="50" y2="14" stroke="var(--text-primary)" strokeWidth="1.5" />
          <line x1="20" y1="20" x2="44" y2="20" stroke="var(--border-strong)" strokeWidth="1.4" />
          <line x1="20" y1="26" x2="38" y2="26" stroke="var(--border-strong)" strokeWidth="1.4" />
          <circle cx="72" cy="20" r="10" fill="var(--accent-teal-soft)" stroke="var(--accent-teal)" strokeWidth="1.5" />
          <path d="M67.5 20.2 L70.5 23 L76.5 17" fill="none" stroke="var(--accent-teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
