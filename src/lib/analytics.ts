/**
 * Consent-gated analytics. Events are always built so the call sites stay
 * honest, but nothing leaves the browser unless a provider is configured in
 * content.analytics AND the visitor has consented.
 */

import { analytics } from "@/content/content";

export type AnalyticsEvent =
  | { name: "scene_enter"; id: string }
  | { name: "scroll_depth"; value: 25 | 50 | 75 | 100 }
  | { name: "cta_click"; id: string }
  | { name: "tier"; value: "FULL" | "LITE" | "STATIC" };

let consented = false;

export function setAnalyticsConsent(value: boolean) {
  consented = value;
}

export function track(event: AnalyticsEvent) {
  if (!analytics.provider || !consented) return;
  const label = "id" in event ? `${event.name}:${event.id}` : `${event.name}:${event.value}`;
  if (analytics.provider === "plausible") {
    (window as unknown as { plausible?: (e: string) => void }).plausible?.(label);
  } else if (analytics.provider === "vercel") {
    (window as unknown as { va?: (t: string, p: { name: string }) => void }).va?.("event", { name: label });
  }
}
