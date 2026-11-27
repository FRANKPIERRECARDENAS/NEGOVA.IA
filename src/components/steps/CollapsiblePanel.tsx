import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsiblePanelProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsiblePanel({
  title,
  summary,
  defaultOpen = false,
  children,
  className = "",
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`border border-[var(--border-hairline)] rounded-lg bg-[var(--bg-elevated)] overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
      >
        <span className="text-xs font-semibold text-[var(--text-primary)]">{title}</span>
        <span className="inline-flex items-center gap-2.5 shrink-0">
          {summary && (
            <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
              {summary}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      <div
        className={`${
          open ? "block" : "hidden print:block"
        } px-4 pb-4 pt-3 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]`}
      >
        {children}
      </div>
    </div>
  );
}
