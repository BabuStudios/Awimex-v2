import type { SceneId } from "@/content/content";

export type SceneComponent = (props: { index: number }) => React.ReactNode;

/** Scene contents, keyed by id. Each entry lives in scenes/<id>.tsx. */
export const sceneContents: Partial<Record<SceneId, SceneComponent>> = {};
