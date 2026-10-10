/**
 * Scene list and scroll pacing — split from content.ts so the first paint
 * (nav, hero) can import it without the world/tuning config.
 */

import type { Dictionary } from "./i18n";

/* Scroll length per scene, in viewport heights, chosen for pacing.
 * The two list scenes hold five locked stops each (~60vh per stop). */
export const SCROLL_PER_SCENE_VH = {
  hero: 150,
  omOss: 120,
  produkter: 300,
  verksamhet: 300,
  kontakt: 80,
} as const;

/* ── Scenes ──────────────────────────────────────────────────────────── */
export type SceneId = keyof typeof SCROLL_PER_SCENE_VH;
type SceneCopyKey = keyof Dictionary["scenes"];
type NavKey = keyof Dictionary["nav"];
type InSceneKey = keyof Dictionary["inScene"];

export type TierBehaviour = { full: string; lite: string; static: string };

export type SceneDef = {
  id: SceneId;
  copy: SceneCopyKey;
  nav: NavKey;
  /** DOM anchor / semantic-mirror id. */
  anchor: string;
  inSceneWord: InSceneKey | null;
  /** Number of locked stops; 0 = free travel through the scene. */
  stops: number;
  poster: string;
  tiers: TierBehaviour;
};

export const scenes = [
  {
    id: "hero",
    copy: "hero",
    nav: "home",
    anchor: "start",
    inSceneWord: null,
    stops: 0,
    poster: "/posters/poster-hero.avif",
    tiers: {
      full: "Light bar ignites in fog; cursor work light; full mist",
      lite: "Same; DoF off, mist ×0.35, bloom half-res",
      static: "Poster, H1, subhead, Bli kund",
    },
  },
  {
    id: "omOss",
    copy: "omOss",
    nav: "omOss",
    anchor: "om-oss",
    inSceneWord: "omOss",
    stops: 0,
    poster: "/posters/poster-om-oss.avif",
    tiers: {
      full: "Workshop silhouette at dusk; instrument cluster with gauge and ISO plates",
      lite: "Cluster kept, silhouette simplified",
      static: "Poster, three pillars, facts <dl>",
    },
  },
  {
    id: "produkter",
    copy: "produkter",
    nav: "produkter",
    anchor: "produkter",
    inSceneWord: "produkter",
    stops: 5,
    poster: "/posters/poster-produkter.avif",
    tiers: {
      full: "Five lit product objects, five locked stops, DoF pulls",
      lite: "Same stops, no DoF",
      static: "Poster, five family cards",
    },
  },
  {
    id: "verksamhet",
    copy: "verksamhet",
    nav: "verksamhet",
    anchor: "verksamhetsomraden",
    inSceneWord: "verksamhet",
    stops: 5,
    poster: "/posters/poster-verksamhet.avif",
    tiers: {
      full: "Five roadside stations; signature strobe on entry; rain at the 24V station",
      lite: "Strobe kept without chromatic aberration; no rain",
      static: "Poster, five area cards",
    },
  },
  {
    id: "kontakt",
    copy: "kontakt",
    nav: "kontakt",
    anchor: "kontakt",
    inSceneWord: null,
    stops: 0,
    poster: "/posters/poster-kontakt.avif",
    tiers: {
      full: "Dawn horizon; mist settles",
      lite: "Same, mist ×0.35",
      static: "Poster, address, hours, staff by department",
    },
  },
] as const satisfies readonly SceneDef[];
