import { wordmark } from "./wordmark.generated";

/** Inline wordmark. `stroke` mode draws outlines only (for the DrawSVG intro). */
export function Wordmark({ className, mode = "fill" }: { className?: string; mode?: "fill" | "stroke" }) {
  return (
    <svg viewBox={wordmark.viewBox} className={className} role="img" aria-label="Awimex">
      {wordmark.paths.map((d, i) => (
        <path
          key={i}
          d={d}
          className="letter"
          fill={mode === "fill" ? "currentColor" : "none"}
          stroke={mode === "stroke" ? "currentColor" : "none"}
          strokeWidth={mode === "stroke" ? 1.2 : 0}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
