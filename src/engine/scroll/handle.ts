/**
 * A dependency-free handle to the active smooth scroller, so DOM components
 * (e.g. the bridge modal) can pause scrolling without importing Lenis or GSAP
 * into the initial bundle.
 */

type Scroller = { stop(): void; start(): void };

let active: Scroller | null = null;

export function setScroller(s: Scroller | null) {
  active = s;
}

export function pauseScroll() {
  active?.stop();
}

export function resumeScroll() {
  active?.start();
}
