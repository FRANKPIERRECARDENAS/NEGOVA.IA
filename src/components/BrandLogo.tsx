interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-9 h-9",
} as const;

export function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  return (
    <img
      src="/assets/aistudio/Logotipo_tecnol_gico_Negova.IA_956218e9.png"
      alt="Logotipo de NEGOVA.IA"
      className={`${SIZE_MAP[size]} object-contain shrink-0 select-none ${className}`.trim()}
      decoding="async"
    />
  );
}
