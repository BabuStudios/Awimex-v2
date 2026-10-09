"use client";

import { useI18n } from "@/lib/i18n-context";
import { track } from "@/lib/analytics";
import { useUi } from "./ui-store";

/** The primary action. Always opens the branded bridge, never the legacy form directly. */
export function BliKundButton({ id, size = "md" }: { id: string; size?: "md" | "lg" }) {
  const { dict } = useI18n();
  const openBridge = useUi((s) => s.openBridge);

  return (
    <button
      type="button"
      onClick={() => {
        track({ name: "cta_click", id });
        openBridge();
      }}
      className={[
        "label inline-flex items-center gap-3 rounded-full bg-amber text-asphalt transition-colors",
        "hover:bg-offwhite focus-visible:outline-offwhite",
        size === "lg" ? "px-7 py-4 text-sm" : "px-5 py-3",
      ].join(" ")}
    >
      {dict.cta.primary}
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 8h11M9 4l4 4-4 4" />
      </svg>
    </button>
  );
}
