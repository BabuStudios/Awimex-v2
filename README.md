# Awimex — cinematic web

The Awimex International AB website: a single real-time 3D world (Next.js 16, React 19.2, R3F 9, three.js WebGPU/TSL, GSAP, Lenis) with a semantic DOM layer for content, SEO and accessibility. Built by Babu Studios.

```bash
npm install
npm run dev                 # http://localhost:3000
npm run build && npm start
npm run verify              # automated quality gates
npm run verify:runtime      # browser gates (needs a running server)
```

Requires Node ≥ 20.9.

- `?tier=full|lite|static` — force a quality tier
- `?backend=webgl` — force the WebGL2 backend

Everything a contributor (or Claude Code) needs is in [CLAUDE.md](./CLAUDE.md): the project spec, facts registry, asset manifest, architecture rules and the definition of done.
