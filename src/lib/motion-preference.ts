/** Reduced-motion check without importing GSAP (safe for the first-paint bundle). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
