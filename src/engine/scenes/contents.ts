import type { SceneId } from "@/content/content";
import { Hero } from "./Hero";
import { Kontakt } from "./Kontakt";
import { OmOss } from "./OmOss";
import { Produkter } from "./Produkter";
import { Verksamhet } from "./Verksamhet";

export type SceneComponent = (props: { index: number }) => React.ReactNode;

/** Scene contents, keyed by id. Each entry lives in scenes/<Name>.tsx. */
export const sceneContents: Record<SceneId, SceneComponent> = {
  hero: Hero,
  omOss: OmOss,
  produkter: Produkter,
  verksamhet: Verksamhet,
  kontakt: Kontakt,
};
