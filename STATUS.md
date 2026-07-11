# Wavelength — Team Status & Decisions

> Single source of truth. Updated 2026-07-12. If you read one file, read this.
> Product: **Wavelength** — a consented social co-pilot for neurodivergent people. Reads the
> *trajectory* of a conversation, nudges gently in the moment, debriefs kindly afterward.

---

## TL;DR
The **backend is done, deployed, and running real AI on DigitalOcean.** The **frontend exists but
isn't wired to it yet** (that's the critical path). Everything is now merged on `main`.

## Live right now
- **Backend API (real inference):** https://wavelength-brain-37j5z.ondigitalocean.app
  - `GET /health` · `POST /api/debrief` (State 3) · `POST /api/nudge` (State 2, ~1.5s) ·
    `POST /api/frames` (signal persistence) · `GET /api/progress`
  - CORS open — call it straight from the browser. Verified end to end on real models.
- **Models:** `anthropic-claude-haiku-4.5` (default, ~20s) and `anthropic-claude-4.6-sonnet`
  (~30s, sharper) — the only two verified to pass schema. Do not demo other model names.

## What's DONE (do not rebuild)
- Full DEBRIEF brain: metrics computed in code + grounded prompt → schema-valid debrief with
  hedged, warm, concrete coaching. Fuses audio transcript + video `visual_signals`.
- LIVE nudge phrasing endpoint (evidence + confidence in → one kind hedged suggestion out).
- Longitudinal memory: recurring-pattern detection + progress trends (Best Use of Data).
- Deployed on DO App Platform (Docker). Managed Postgres schema written (`debrief/schema.sql`).
- Typed TS API client for the frontend: `debrief/wavelength-client.ts`.
- LIVE→DEBRIEF bridge: `debrief/frames_to_signals.js`.
- Reference UI + fallback: `debrief/viewer.html`. Capture tool: `debrief/recorder.html`.
- Demo script + staging: `BUILD_PLAN.md` §6. Q&A prep + fallback ladder: `pitch-script.md`,
  `demo-runsheet.md`.

## Decisions LOCKED (don't reopen)
1. **Name: Wavelength.**
2. **3-state app: CONSENT → LIVE → DEBRIEF**, one page, one laptop, no mobile.
3. **Real-time nudges: IN** (Dinil's staging trick — partner can't see the screen — resolves the
   attention/consent concern).
4. **Stack: React frontend calls the deployed Python API.** No second backend. No Express proxy.
5. **Modality: audio is the core signal, video is a supporting layer** (never emotion labels).
6. **Credits: fine.** $200 hackathon credit confirmed applied (expires Jul 14), $5 spare. Total
   spend so far ~$0.30 of testing. Burn freely.

## DECISIONS WE STILL NEED (please weigh in)
1. **Who wires the frontend to the API, and by when?** Peter's `src/` renders static
   `sessions.ts` and does not call the backend yet. This is THE critical path. The client
   (`debrief/wavelength-client.ts`) + mapping guide (`INTEGRATION.md` "For Peter") make it small,
   but someone has to do it. **Owner + deadline needed.**
2. **How far do we build the LIVE loop vs. lean on DEBRIEF?** The MediaPipe live-signal loop
   (BUILD_PLAN §2/§4) is the wow but also the riskiest on stage. Fallback = debrief-only is
   solid. Decide the ambition given our actual remaining hours (confirm the window — BUILD_PLAN
   assumes 8h/6.5h freeze; is that right?).
3. **Persistent DB: needed for the demo, or ship in-memory + seeded?** Managed Postgres has been
   stuck provisioning ~45 min (abnormal). Memory + frames both work in-memory with a seeded
   improving trajectory, which demos identically. Recommend: **don't block on it** — I'll try one
   recreate; if it's not up fast, we demo on in-memory and still show the Postgres schema. OK?
4. **Repo tidy (minor):** `main` has both the old static `index.html`/`styles/` prototype and
   Peter's real React `src/` app. Entry point is the React app. Also `context/` and `docs/` both
   hold the DO reference docs. Harmless; delete the duplicates whenever someone wants it clean.
5. **Demo roles:** who narrates, who drives the laptop, who are the two actors in the skit
   (BUILD_PLAN §6). Assign before rehearsal.

## What's LEFT, by owner
- **Peter:** wire `src/` to the live API using `wavelength-client.ts` (LiveView → nudge/frames,
  End Session → debrief, StatsView → progress). Keep `sessions.ts` as offline fallback.
- **Dinil:** build the LIVE loop (MediaPipe → derived signals → event engine) against the
  endpoints. No backend needed — it's all served.
- **Connor + backend:** wire Postgres when/if it provisions; support integration; own pitch/demo.
- **All:** two timed rehearsals of the skit; the 30-sec Chrome mic test of `recorder.html`;
  record a backup demo video (fallback rung 4).

## Known risks / loose ends
- Frontend not yet calling the API (risk #1 above).
- Postgres provisioning stuck (mitigated by in-memory fallback).
- Web Speech + MediaPipe are Chrome-only — demo in real Chrome, controlled lighting.
- After the event: rotate the DO API token + delete the `wavelength` model key (both were exposed
  in chat during setup).
