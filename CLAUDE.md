# CLAUDE.md — Awimex cinematic site

Built by Babu Studios to the **Cinematic Web Engine v6.0** process (BRIEF → CONFIRM → SCAFFOLD → BUILD → VERIFY).
This file is the working contract for any Claude Code session that extends the site. Read it fully before changing code.

```bash
npm install
npm run dev                      # http://localhost:3000
npm run build && npm start       # production
npm run verify                   # automated gates (typecheck, build, i18n, facts, links, placeholders, hosting, budgets)
npm run verify:runtime -- <url>  # runtime gates in Chromium (tiers, backends, reduced motion, LCP, mirror, keyboard, audio, console)
npm run posters -- <url>         # re-shoot scene posters from the live world (do this on a GPU machine)
npm run wordmark                 # regenerate the stand-in wordmark (until the official SVG exists)
```

QA switches: `?tier=full|lite|static` (pins the tier — adaptive quality is off), `?backend=webgl`, `?capture` (hides the DOM layers for poster capture).

---

## 1. PROJECT SPEC

```
PROJECT NAME      Awimex — Cinematic Web
BRAND NAME        Awimex International AB · "A Relais Group Company"
PRODUCT/SUBJECT   Power supply, lighting and blue-light equipment for vehicles, boats and industry (B2B wholesale)
AUDIENCE          ⚑ ASSUMED: workshops, body builders, fleet owners, procurement in the five areas of operation
PRIMARY ACTION    "Bli kund" → branded bridge modal → https://www.awimex.se/bli-kund-hos-oss/ (Phase 2 D1 = a)
TONE              Cinematic, restrained, industrial. Swedish, direct, "du"-form
COLOR MODE        dark
PALETTE           ⚑ ASSUMED  asphalt #0B0D10 · graphite #1A1E23 · amber #FFA41B (primary accent)
                             signal blue #1E6BFF (blue light + signature strobe only) · off-white #EEF1F3
                             mist #C9CED4 · rim #9FB4C8
FONTS             Display: Archivo (wdth axis; expanded headlines, condensed labels) · Body: Open Sans — next/font, self-hosted

WORLD CONCEPT     "Night road → light." Darkness that Awimex products light up, scene by scene
SIGNATURE MOMENT  "Power on": after the intro the hero light bar ignites module by module; on entering the
                  Produkter → Verksamhetsområden travel the gantry bar fires one timed amber→blue strobe burst
                  (1.4 s, re-arms on leaving) while the camera bursts through with an FOV kick

HERO MODE         procedural — TSL LED light bar (12 modules, 6.4 units), GLB-swappable via content.lightBar.glb
ACTIVE SCENES     1 hero · 2 omOss · 3 produkter (5 locked stops) · 4 verksamhet (5 locked stops) · 5 kontakt
SCENE→TIER MAPPING
  scene        FULL                                              LITE                                   STATIC (poster + copy)
  hero         light bar ignites in fog, cursor work light       same; DoF off, mist ×0.35, bloom ½     poster-hero, H1 + subhead + Bli kund
  omOss        workshop at dusk, proof cluster (gauge/ISO/Relais) cluster kept                          poster-om-oss, pillars + facts
  produkter    5 exhibits, 5 stops, DoF pulls                    same stops, no DoF                     poster-produkter, 5 family cards
  verksamhet   5 stations, signature strobe, rain at 24V         strobe without CA, no rain             poster-verksamhet, 5 area cards
  kontakt      dawn horizon                                      same, mist ×0.35                       poster-kontakt, details + staff

RENDER_PATH       webgpu (auto WebGL2) + capability probe (see §6)
FOG_FAR           60 · FOG_NEAR 8
SCENE_SPACING     69 (= FOG_FAR × 1.15: the previous scene is fully fogged out before the next reads)
SCROLL_PER_SCENE_VH  hero 150 · omOss 120 · produkter 300 · verksamhet 300 · kontakt 80 (track 950vh)

CAMERA            lerp 0.08 (frame-rate independent) · tilt ±3° assigned + clamped · standoff 14 · eye 1.6
                  locked: produkter + verksamhet (z plateau, lateral x-track, stops 12 units apart)
ALIVE             mist 6000 (WebGPU compute; ×0.35 on WebGL2 and on LITE) #C9CED4 size 0.6–1.4
                  flares 40 amber #FFA41B · rain 1500 #9FB4C8 (24V station, FULL only)
LIGHTING          cursor work light: spot #FFE2B8 i60 angle 0.42 + soft beam cone · rim key #9FB4C8 i1.2
                  ambient 0.08 · linear fog #0B0D10
POST              bloom 0.9 / r 0.5 / thr 0.75 · DoF focal 6 bokeh 3 (FULL) · grain 0.035 · vignette 0.35
                  chromatic 0 (strobe peak only) · fps_floor 50 · RenderPipeline built once, toggles are uniforms
TYPOGRAPHY        in-scene: omOss "KVALITET" · produkter "SORTIMENT" · verksamhet "PÅ VÄGEN" (hero/kontakt none)
                  overlay: SplitText lines, mask "lines", stagger 0.08, ease babu.glide
EASES             babu.glide  "M0,0 C0.16,1 0.3,1 1,1"   babu.snap "M0,0 C0.7,0 0.2,1 1,1"   babu.ignite "M0,0 C0.9,0 0.1,1 1,1"
AUDIO             enabled false · ambientSrc null → AudioManager never mounts
LOCALES           sv only · DEFAULT sv · served at / (proxy rewrites to /sv; /sv 308 → /)
DOMAIN            ⚑ ASSUMED https://www.awimex.se (NEXT_PUBLIC_SITE_URL)
DEPLOY TARGET     ⚑ ASSUMED Vercel
EXTERNAL LINKS    Bli kund → https://www.awimex.se/bli-kund-hos-oss/ → bridge page: yes (modal) · webshop: removed
ANALYTICS         provider NONE · consent tool NONE (events built + consent-gated: scene_enter, scroll_depth, cta_click, tier)
```

## 2. Facts registry — `src/content/facts.ts`

```
id                 value                     unit    source                          status
years_in_business  30 (rendered "30+")       years   awimex.se "mer än 30 år"        confirmed
founded            —                         year    —                               ⚑ MISSING FACT (JSON-LD omits foundingDate)
cert_iso9001       ISO 9001                  —       awimex.se footer                confirmed (verify cert is current)
cert_iso14001      ISO 14001                 —       awimex.se footer                confirmed (verify cert is current)
parent_group       Relais Group              —       awimex.se footer                confirmed
legal_name         AWIMEX International AB   —       webshop footer                  confirmed
org_nr             556595-7825               —       webshop footer                  confirmed
street             Fabriksgatan 27           —       awimex.se                       confirmed
postal_code        272 36                    —       awimex.se                       confirmed
city               Simrishamn                —       awimex.se                       confirmed
phone_main         0414-160 50               —       awimex.se                       confirmed
email_info         info@awimex.se            —       awimex.se                       confirmed
email_order        order@awimex.se           —       awimex.se                       confirmed
hours_mon_thu      08.00–16.30               —       awimex.se                       confirmed
hours_fri          08.00–15.00               —       awimex.se                       confirmed
```
Removed on client instruction: ICAO, Svenska LCV Föreningen. Excluded: revenue, employee count.
Contacts registry: `src/content/people.ts` — 31 people in 4 groups (verbatim from awimex.se, 2026-10-09; David Kerwall's number standardised to 076-760 01 01 on client instruction).

## 3. Asset manifest

| Asset | Purpose | Status | In use |
|---|---|---|---|
| lightbar.glb | hero subject | MISSING | procedural TSL light bar (`engine/scenes/LightBar.tsx`) |
| product models ×5 | produkter exhibits | MISSING | procedural exhibits (`engine/scenes/Produkter.tsx`) |
| vehicle models ×5 | verksamhet stations | MISSING | procedural silhouettes (`engine/scenes/parts.tsx`) |
| logo.svg | intro DrawSVG + nav | MISSING (only white PNGs exist) | Archivo-outline wordmark (`npm run wordmark`) |
| relais mark | proof plate | MISSING | typographic plate |
| env.hdr | lighting | MISSING | no environment map (lights + fog only) |
| ambient.mp3 | audio | n/a | audio disabled |
| poster-*.avif ×5 + poster-hero.jpg | STATIC tier, OG | SUPPLIED (generated) | ⚑ shot on software GL — re-shoot on a GPU machine |
| fonts | type | SUPPLIED (OFL, self-hosted) | next/font |

## 4. Architecture rules (4.1, verbatim)

**Renderer**

```tsx
import * as THREE from 'three/webgpu'
<Canvas gl={async (props) => {
  const renderer = new THREE.WebGPURenderer(props)   // falls back to the WebGL2 backend automatically
  await renderer.init()
  return renderer
}} />
```

- Exactly **one** `<Canvas>` for the whole site. Scenes are groups inside it, never separate canvases.
- All materials are `NodeMaterial` variants written in TSL. No `ShaderMaterial`, no `onBeforeCompile`.
- Post-processing is a TSL `PostProcessing` node chain: DoF, bloom, grain, vignette, plus optional chromatic aberration. It is built once, and effect toggles are uniforms, not rebuilds.

**Camera**

- Camera position is derived from scroll each frame. Use `camera.position.z = lerp(current, target, CAMERA_LERP)`.
- Rotation is set by assigning `camera.rotation.x/y` from a clamped tilt target. Never call `camera.rotateX()`, because it accumulates.
- Locked sections pin scroll progress inside a z-range. Use GSAP ScrollTrigger `pin` on the overlay plus a plateau in the camera curve.

**Scene spacing (replaces the magic `SCENE_DEPTH = 800`)**

```ts
// Each scene must sit beyond the fog of the previous one, so only one scene reads at a time
SCENE_SPACING = FOG_FAR * 1.15
// Scroll length per scene is chosen for pacing, not distance
SCROLL_PER_SCENE_VH = { hero: 150, story: 120, detail: 140, proof: 100, cta: 80 }
```

Document both values in `content.ts` with a one-line rationale.

**Scroll bridge**

- Lenis is driven by `gsap.ticker`, so there is one RAF for scroll and GSAP: `gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0)`.
- Lenis writes `progress` and `velocity` into the Zustand store with `setState`.
- R3F components read the store with `useStore.getState()` inside `useFrame`. **Never** subscribe to scroll with a React hook in a 3D component, because it re-renders 60 times per second.

**React Compiler** (stable in Next 16)

- Enabled.
- Components that mutate refs in `useFrame` in ways the compiler mis-optimizes get `'use no memo'` with a comment explaining why.

**Next.js 16**

- The site is static by default. Use Cache Components (`'use cache'`) only for data that changes, such as news.
- Locale routing lives in `proxy.ts`.
- Turbopack for dev and build.

### How this build applies them (project notes)

- **`RenderPipeline`**, not `PostProcessing`: three r183 renamed the class (the old name still works but warns). Same TSL node chain.
- **Locked sections**: the overlay is `position: fixed` for the whole journey, so it is pinned by construction; the camera plateau lives in `engine/scroll/timeline.ts` (hold / pan / travel segments). No ScrollTrigger `pin` is needed.
- **Camera progress** is measured against the scroll track only (`lenis.ts → trackLength()`); the in-flow contact section after it must never stretch the timeline.
- **drei is not installed**: it pulls troika (GLSL). In-world text = canvas texture on a TSL material (`engine/text/`).
- **TSL gotcha**: `t.mix(a, b)` means `mix(a, b, t)`. Always use the free `mix(a, b, t)`.
- **Signature strobe is time-based** (`engine/signature.ts`), not scroll-based, so a parked scroll never freezes mid-flash.
- **Backdrop skies ignore fog**, so they fade by camera distance (`skyMaterial`, `backdropGlowMaterial`) — a scene's sky must never show through from its neighbour.
- **First paint ships no GSAP, Lenis or three**: `Experience` lazy-loads `EngineLayer` / `StaticStory`; `EngineLayer` lazy-loads `Canvas3D`; the bridge modal loads on first open. Keep first-paint imports on `content/scenes.ts`, `content/site.ts`, `lib/motion-preference.ts` — not `content/content.ts` or `lib/motion.ts`.
- **Accessibility model**: visual text (overlay, static story) is `aria-hidden`; the `SemanticMirror` (sr-only `<main id="innehall">`) is the accessible copy and owns the anchor ids (`#om-oss` …). Links/buttons in visual layers stay real; inactive overlay panels are `inert`.

## 5. Anti-patterns (verbatim)

| Anti-pattern | Failure it causes |
|---|---|
| More than one `<Canvas>` | Duplicate GPU contexts and memory blowups; transitions between canvases can't be continuous |
| `camera.rotateX()` / `rotateY()` in a frame loop | Rotation accumulates and drifts; the camera ends up off-axis after long scrolls |
| Reading scroll through a React hook inside 3D components | 60 re-renders per second, INP collapses |
| Separate RAF loops for Lenis, GSAP and R3F | Desynchronized frames, visible jitter at scene boundaries |
| `ShaderMaterial` / `onBeforeCompile` / GLSL-only libraries on the WebGPU path | Black or missing materials on WebGPU; silent failure on some browsers |
| `@react-three/postprocessing` with `WebGPURenderer` | The composer doesn't run; post FX disappear |
| Hard-coded numbers in copy | Contradictory figures across sections (e.g. two different turnover values on the same page) |
| Counters starting at `00` without a resolved value | Placeholder zeros visible to users, crawlers and screenshots |
| Falling back to another locale's string | Mixed-language pages that read as unfinished |
| `href="#"` or links to `old-`/draft routes | Dead ends at the moment of intent |
| Media hosted on Dropbox/Drive | Throttling, broken links, no caching, unprofessional URLs |
| Canvas as LCP element | LCP > 4 s on mobile; SEO and conversion penalties |
| Body copy rendered only in 3D | Invisible to search and screen readers, blurry under DoF, untranslatable |
| Rebuilding the post chain to toggle effects | Shader recompiles and frame hitches mid-scroll |
| Stepping quality back *up* mid-session | Visible quality flicker |
| `SCENE_SPACING` smaller than `FOG_FAR` | Two scenes visible at once, breaking the "one world, one moment" illusion |
| Audio checked as `enabled` only | Pre-flight passes but nothing plays when `ambientSrc` is missing |
| Proceeding with unresolved assets or ⚑ MISSING FACTs rendered as numbers | Fabricated or placeholder data in production |
| Truncating files to fit the output limit | Broken builds that look complete |

## 6. Definition of done (Phase 5 gates)

A change is done when `npm run verify` and `npm run verify:runtime` both exit 0, and every UNVERIFIED gate has been checked by hand on real hardware.

**Automated** (`scripts/verify.mjs`)
- [ ] `tsc --noEmit` and `next build` (Turbopack) pass
- [ ] i18n: every locale has exactly the source keys; no other-language words in any locale
- [ ] facts: every `{fact:id}` resolves to a present value; no numeric literal in copy (allowlist: `24V`, an equipment class); no fact value hard-coded in components; one value per id
- [ ] links: no `href="#"`/empty, every in-page anchor resolves, no `old-`/`test-`/`draft-` links
- [ ] placeholders: no `TODO`, `lorem`, `undefined`, `NaN`, `[ ]`, or lone `00` counters in rendered HTML
- [ ] hosting: no Dropbox/Drive/WeTransfer/Instagram/Google-Fonts URLs at runtime
- [ ] budgets — **amended with the operator (Phase 4b):** initial JS = framework floor (measured) + **project code ≤ 15 kB gz**, **total ≤ 190 kB gz**; 3D chunk + critical assets < 4 MB; hero GLB < 2 MB

**Runtime** (`scripts/verify-runtime.mjs`)
- [ ] FULL, LITE and STATIC render (`?tier=`)
- [ ] WebGL2 backend renders (`?backend=webgl`); WebGPU backend renders in current desktop Chrome
- [ ] reduced motion → STATIC: no camera travel, no auto-playing animation
- [ ] LCP element is DOM text, < 2.5 s on throttled mobile
- [ ] FULL holds ≥ fps_floor (50) through a full scroll pass on the reference machine
- [ ] audio mounts only when `enabled && ambientSrc`, silent until a user gesture
- [ ] semantic mirror contains every scene heading and every visible fact
- [ ] keyboard-only: every CTA reachable, no focus on hidden UI, bridge dialog opens and closes
- [ ] rendered DOM has no other-language strings; console free of app errors/warnings

**Copy** (operator, manual)
- [ ] headings are complete sentences or deliberate fragments
- [ ] spacing and line breaks checked at desktop and phone widths (SplitText can expose double/missing spaces)

**Known dependency/environment noise** (not app errors, filtered by the runtime gate): R3F's internal `THREE.Clock` deprecation warning; SwiftShader's "GPU stall due to ReadPixels" on software GL.

## 7. Tooling instructions

- Use the **Next.js DevTools MCP** for runtime and route debugging.
- Use the **official GreenSock GSAP skills** for plugin APIs (SplitText, DrawSVG, CustomEase, Flip, ScrollTrigger).
- **Never edit `src/content/facts.ts` values (or `people.ts`) without explicit operator instruction.**
- Copy lives only in `src/content/i18n/*.ts`; structure and tuning only in `src/content/content.ts` (+ `scenes.ts`, `site.ts`).
- A new locale = a new dictionary file with identical keys + an entry in `i18n/index.ts`; never fall back to Swedish.
- `?tier=` pins a tier for QA; do not judge performance with it (adaptive quality is off while pinned).

## 8. Map

```
proxy.ts                      locale routing (sv at /)
app/[locale]/layout.tsx       fonts, metadata, Organization JSON-LD
app/[locale]/page.tsx         <Experience/> + <BridgeMount/> + <SemanticMirror/>
app/[locale]/opengraph-image  OG from poster-hero.jpg
src/content/                  facts, people, i18n, content/scenes/site config
src/engine/Experience.tsx     tier switch (HeroFrame SSR → STATIC | EngineLayer)
src/engine/EngineLayer.tsx    Lenis, overlay, intro, contact section, lazy Canvas3D
src/engine/Canvas3D.tsx       the one canvas + WebGPU capability probe
src/engine/World.tsx          fog, camera, lighting, alive, road, scenes, post, adaptive quality
src/engine/scroll/            store (Zustand), lenis, timeline (scroll → camera)
src/engine/scenes/            Hero, OmOss, Produkter, Verksamhet, Kontakt, LightBar, parts
src/engine/{alive,lighting,post,quality,text,tsl,environment,audio}/
src/overlay/                  Overlay, Intro, Nav, HeroCopy, BridgeModal, ContactSection, blocks
src/static/StaticStory.tsx    STATIC tier (no R3F imports)
src/seo/                      SemanticMirror, metadata
scripts/                      verify, verify-runtime, capture-posters, build-wordmark
```
