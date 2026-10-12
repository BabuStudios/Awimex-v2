/**
 * GSAP setup: plugins and the site's easing set. The three `babu.*` eases
 * from content.ts are the only eases used anywhere on the site.
 */

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { eases } from "@/content/content";

let registered = false;

export function registerMotion() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(CustomEase, DrawSVGPlugin, Flip, ScrollTrigger, SplitText);
  for (const [name, path] of Object.entries(eases)) CustomEase.create(name, path);
  registered = true;
}

export { prefersReducedMotion } from "./motion-preference";

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, Flip };
