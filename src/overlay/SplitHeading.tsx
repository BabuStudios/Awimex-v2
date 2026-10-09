"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, prefersReducedMotion, registerMotion } from "@/lib/motion";

/**
 * A SplitText headline. Lines rise out of a mask when `play` turns true
 * (overlay) or when scrolled into view (static story). Reduced motion and
 * pre-hydration render the final state. Always aria-hidden: the semantic
 * mirror carries the real heading.
 */
export function SplitHeading({
  as: Tag = "h2",
  children,
  className,
  play,
  scrollTrigger,
}: {
  as?: "h1" | "h2" | "h3" | "p";
  children: string;
  className?: string;
  /** Controlled mode: animate in when true, out when false. */
  play?: boolean;
  /** Uncontrolled mode: reveal when the element enters the viewport. */
  scrollTrigger?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      registerMotion();
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit(self) {
          tween.current = gsap.fromTo(
            self.lines,
            { yPercent: 110 },
            {
              yPercent: 0,
              duration: 1.1,
              stagger: 0.08,
              ease: "babu.glide",
              paused: !scrollTrigger && !play,
              scrollTrigger: scrollTrigger ? { trigger: el, start: "top 85%", once: true } : undefined,
            },
          );
          return tween.current;
        },
      });
    },
    { scope: ref, dependencies: [] },
  );

  useGSAP(
    () => {
      if (scrollTrigger || !tween.current) return;
      if (play) tween.current.play();
      else tween.current.reverse();
    },
    { dependencies: [play] },
  );

  return (
    <Tag ref={ref as React.RefObject<never>} aria-hidden="true" className={className}>
      {children}
    </Tag>
  );
}
