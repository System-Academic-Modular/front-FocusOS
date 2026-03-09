import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("w-8 h-8", className)}
      fill="none"
    >
      {/* Círculo de Fundo (Glow) */}
      <circle cx="50" cy="50" r="48" className="stroke-brand-violet/20" strokeWidth="2" />
      
      {/* Peças da "Abertura Neural" */}
      <path
        d="M50 15L65 40H35L50 15Z"
        className="stroke-brand-violet fill-brand-violet/10"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M85 50L60 65V35L85 50Z"
        className="stroke-brand-cyan fill-brand-cyan/10"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M50 85L35 60H65L50 85Z"
        className="stroke-brand-violet fill-brand-violet/10"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M15 50L40 35V65L15 50Z"
        className="stroke-brand-cyan fill-brand-cyan/10"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Núcleo (O "Ponto de Foco") */}
      <circle cx="50" cy="50" r="8" className="fill-white" />
      <circle cx="50" cy="50" r="4" className="fill-brand-cyan animate-pulse" />
    </svg>
  )
}