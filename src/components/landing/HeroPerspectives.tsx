export function HeroPerspectives() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[28rem] md:max-w-none" aria-hidden>
      <svg viewBox="0 0 420 420" className="h-full w-full text-ink">
        <defs>
          <clipPath id="left-lens">
            <circle cx="168" cy="210" r="118" />
          </clipPath>
          <clipPath id="right-lens">
            <circle cx="252" cy="210" r="118" />
          </clipPath>
        </defs>

        <g className="origin-center animate-[drift-a_14s_ease-in-out_infinite]">
          <circle
            cx="168"
            cy="210"
            r="118"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.15"
            opacity="0.55"
          />
          <circle cx="168" cy="210" r="4" fill="currentColor" opacity="0.35" />
        </g>
        <g className="origin-center animate-[drift-b_16s_ease-in-out_infinite] text-sage">
          <circle
            cx="252"
            cy="210"
            r="118"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.15"
            opacity="0.7"
          />
          <circle cx="252" cy="210" r="4" fill="currentColor" opacity="0.45" />
        </g>

        <g clipPath="url(#left-lens)" className="animate-[breathe_10s_ease-in-out_infinite]">
          <circle cx="252" cy="210" r="118" fill="currentColor" className="text-sage" opacity="0.14" />
        </g>
        <g clipPath="url(#right-lens)">
          <circle cx="168" cy="210" r="118" fill="currentColor" opacity="0.06" />
        </g>

        <path
          d="M210 92 C 198 150, 198 270, 210 328"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.18"
        />
        <text x="52" y="78" fill="currentColor" opacity="0.4" fontSize="11" letterSpacing="0.32em">
          YOU
        </text>
        <g className="text-sage">
          <text x="318" y="78" fill="currentColor" fontSize="11" letterSpacing="0.32em">
            THEM
          </text>
        </g>
      </svg>
    </div>
  );
}
