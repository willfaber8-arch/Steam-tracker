/** Small decorative vinyl-groove mark used sparingly as a logo / accent. */
export function VinylMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="19" fill="#241a13" stroke="#3a2a1c" strokeWidth="1" />
      <circle cx="20" cy="20" r="15" stroke="#3a2a1c" strokeWidth="1" />
      <circle cx="20" cy="20" r="11" stroke="#3a2a1c" strokeWidth="1" />
      <circle cx="20" cy="20" r="7" stroke="#e2963c" strokeWidth="1" opacity="0.6" />
      <circle cx="20" cy="20" r="3" fill="#e2963c" />
    </svg>
  );
}

/** Large faint groove circles for use as a background accent behind panels. */
export function GrooveBackdrop({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={`pointer-events-none absolute ${className}`}
      fill="none"
      aria-hidden="true"
    >
      {[190, 160, 130, 100, 70].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          stroke="#e2963c"
          strokeOpacity="0.06"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
