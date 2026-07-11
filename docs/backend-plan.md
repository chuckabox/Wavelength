# Wavelength Backend — Production Build Plan

> Building the **real** backend from first principles. The old `debrief/` Python service
> was a throwaway test and has been removed — do not reference its contract. This plan is
> the source of truth for backend work.

## Decisions (locked)

- **Monorepo:** `server/` (Node/Express, TypeScript) + `shared/` (Zod contract). React
  app stays at repo root for now.
- **One deployable:** the Express service serves the client build *and* owns all
  DigitalOcean access. The inference key never reaches the browser.
- **Perception is client-side** (MediaPipe) — only derived signal features + transcript
  text reach the server. Raw video/audio never leaves the laptop.
- **No user auth yet; CORS locked** to the frontend origin. Auth is a later phase.
- **Build in phases, not one loop.** Each phase ends green (typechecks + tests pass) and
  leaves a working increment. A verification spike (Phase 0) de-risks the external
  unknowns before any domain logic is written.

## Stack (opinionated defaults = the fundamentals)

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node 20 LTS, **TypeScript strict**, ESM | Type safety end-to-end |
| HTTP | **Express 5** | Simple; Fastify is the alt if we want built-in schema/perf |
| Validation | **Zod** — schemas in `shared/`, types *inferred* | One source of truth for the wire contract; validate at the boundary |
| DB | **Postgres + Drizzle ORM** | Type-safe queries + first-class migrations |
| LLM | **OpenAI SDK → DO base_url**, forced tool-calling for JSON | DO is OpenAI-compatible; tool-calling is the reliable structured-output path |
| Logging | **Pino** (structured, request-scoped) | Real observability |
| Tests | **Vitest + Supertest** | Unit services + integration routes |
| Config | **Zod-validated env**; secrets via DO App Platform | Fail fast on misconfig; key never in code |
| Deploy | Docker → **DO App Platform**, migrations on release, CI on push | Reproducible; key stays server-side |

## Architecture — clean layering (each layer knows only the one below)

```
HTTP        routes + zod validation + consistent error envelope
  → Services   domain logic; deterministic metrics; prompt assembly
     → Repositories   Drizzle — the ONLY place SQL lives
     → Clients        Gradient wrapper: chat, stream (SSE), structured (tool-call+repair), retries
Cross-cutting: config, logger, typed errors, request-id middleware
shared/ : zod schemas + inferred types = the contract client & server agree on
```

**Baked in from line one:** validation at every boundary, one error envelope, CORS
locked (not `*`), request IDs in logs, no secrets in logs, timeouts + retries on every
outbound DO call, and a graceful fallback when inference fails.

## Phases

Each phase ends green and is independently testable.

### Phase 0 — Foundation + spike ⟵ the de-risking gate
- Scaffold `server/` + `shared/`: TS strict, Express, Pino, Zod, Drizzle, Vitest,
  Dockerfile, Zod-validated env, `/health` + `/ready`.
- **SPIKE (before any domain code), with the real DO key:**
  1. `GET /v1/models` — confirm the exact model-name strings (do not trust docs/memory).
  2. One chat completion succeeds.
  3. One **forced tool-call** returns schema-valid JSON (this is our structured-output path).
  4. Postgres connects; a trivial migration applies.
- **Gate:** if any of these behave differently than assumed, we adjust the plan now.

### Phase 1 — Data layer
- Drizzle schema + migrations: `sessions`, `frames`, `moments` (pgvector optional/stretch).
- Repositories with typed queries; integration-tested against a real Postgres.

### Phase 2 — Gradient client
- Typed wrapper: `chat()`, `stream()` (SSE), `structured(schema)` = forced tool-call +
  Zod-validate + one repair retry. Model registry, timeouts, retries, canned fallback.

### Phase 3 — Domain services + endpoints (fresh `/v1` contract)
- Design the API cleanly from scratch (not the old one): signal-frame ingestion, live
  nudge phrasing, end-of-session debrief (streamed), progress/history.
- Metrics computed **in code** (deterministic, unit-tested); the LLM only phrases/reasons
  over grounded facts. Zod-validated boundaries, shared types, central error handling.

### Phase 4 — Hardening + deploy
- Locked CORS, rate limiting, structured request logs, finalized Dockerfile, DO App
  Platform spec, CI (typecheck + tests, migrate on release), end-to-end integration pass.

## Cut order under time pressure
pgvector / semantic recall → progress/history → frame persistence. **Never cut** the
debrief endpoint or the live nudge endpoint — they are the demo.
