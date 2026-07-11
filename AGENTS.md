# AGENTS.md

Instructions for coding agents working in this repo.

## What we're building

**Wavelength** — a consented social co-pilot for one-on-one conversations. It reads
the *trajectory* of a conversation from the webcam and suggests, never diagnoses:
discreet hedged nudges live, an annotated timeline + AI debrief afterward.

This is a **one-day hackathon build**. The full plan (architecture, hour-by-hour
schedule, demo script) is the source of truth: **[BUILD_PLAN.md](./BUILD_PLAN.md)**.

## Framing (read this)

Two framings, both true, held at once:

- **Public / hackathon face** — a consented social co-pilot that helps neurodivergent
  people ([docs/vision.md](./docs/vision.md)). This is what we pitch and demo. It is the
  prize strategy and the ethics moat: hedged, confidence-tagged, *suggest never diagnose*.
- **North star (the real vision)** — AI that can **see and understand people by looking
  at them**: emotion, body language, attention, tension, read from video and reasoned
  about over time ([docs/north-star.md](./docs/north-star.md)). The neurodivergent tool
  is the first honest *application* of this, not the ceiling.

It's an **experiment**. We know emotion/lie detection isn't validated science today —
that's the point. Show *capability* ("the machine reads and reasons"), never claim
*accuracy* ("this works"). Build the general perception engine; present the humane slice.

## Hard constraints

- **Runs entirely on DigitalOcean.** No other cloud.
- **Must use Gradient AI Inference** — this is required to be eligible for prizes.
- **Never label emotions.** Signal descriptors + hedged suggestions + confidence only.
- **Privacy by architecture:** raw video/audio never leaves the laptop; only derived
  signal features and transcript text reach the backend.

## Where things are

- **[BUILD_PLAN.md](./BUILD_PLAN.md)** — the plan. Read this first.
- **[docs/vision.md](./docs/vision.md)** — the public product vision (neurodivergent framing).
- **[docs/north-star.md](./docs/north-star.md)** — the real vision: machine perception of people.
- **[docs/hackathon-goals.md](./docs/hackathon-goals.md)** — judging criteria & target prizes.
- **[docs/digitalocean.md](./docs/digitalocean.md)** — DigitalOcean capabilities cheat-sheet.
- **`.agents/skills/digitalocean-ai/`** — installed DO Inference skill (deep reference).

## Architecture

One repo, **one deployable**: a Node/Express service that serves the built React
client *and* proxies all DigitalOcean calls (so the inference key never reaches the
browser). Perception runs **client-side** (MediaPipe); the LLM and the database live
behind the server.

```
┌── Browser (raw video/audio never leaves) ──────────────────────────┐
│  getUserMedia → MediaPipe (~12Hz) → derived signals → 1Hz frames     │
│      → in-memory store (live charts)                                 │
│  deterministic event engine ──candidate──┐                           │
│  Web Speech API → transcript             │                           │
└──────────────── fetch / SSE ─────────────┼───────────────────────────┘
                                           ▼
┌── DO App Platform · Express · :8080 ──────────────────────────────────┐
│  POST /api/frames  → batch insert (~every 5s)      → DO Postgres       │
│  POST /api/nudge   → DO Gradient fast model, forced tool-call          │
│  POST /api/debrief → DO Gradient Claude, SSE stream (temporal read)    │
│  GET  /api/sessions[/:id] → history                → DO Postgres       │
│  serves client/dist · holds DO key · canned fallbacks                  │
└────────────────────────────────────────────────────────────────────────┘
```

**Contract:** `client` and `server` never share code except types in `shared/`
(the `SignalFrame`, nudge, debrief, and session shapes). That boundary is what keeps
the perception engine free to grow toward the north-star without touching the server.

**Priorities:** P0 = camera → MediaPipe → live engagement chart → nudge → debrief on a
deployed URL. Cuttable under time pressure, in this order: audio/talk-time → sessions
history → pgvector. Never cut the debrief timeline.

## File structure

```
wavelength/
├── package.json              # npm workspaces: ["client","server","shared"]
├── .do/app.yaml              # App Platform spec (build client, run server, :8080, envs)
├── .env.example              # DO_MODEL_ACCESS_KEY, DATABASE_URL, MODEL_NUDGE, MODEL_DEBRIEF
├── AGENTS.md · README.md · BUILD_PLAN.md · docs/
│
├── shared/src/               # the client↔server type contract (no logic)
│   ├── signals.ts            #   SignalFrame, EngagementFrame, Confidence tier
│   ├── nudge.ts              #   NudgeRequest, NudgeResponse (tool-call schema)
│   ├── debrief.ts            #   DebriefRequest, DebriefEvent (SSE chunk), TimelineAnnotation
│   └── session.ts            #   Session, SessionSummary
│
├── client/                   # Vite + React 19 + Tailwind v4 (existing app moves here)
│   ├── index.html · vite.config.ts · tsconfig*.json
│   └── src/
│       ├── main.tsx · App.tsx        # App = 3-state machine: CONSENT → LIVE → DEBRIEF
│       ├── states/                   # one screen per state
│       │   ├── Consent.tsx · Live.tsx · Debrief.tsx
│       ├── perception/       # ★ the local engine — the north-star grows here
│       │   ├── faceLandmarker.ts     #   MediaPipe init, VIDEO mode ~12Hz
│       │   ├── signals.ts            #   blendshapes → descriptors (smile, gaze, lean, tension)
│       │   ├── baseline.ts           #   per-person first-90s baseline + EMA smoothing
│       │   ├── engagement.ts         #   weighted blend → 1Hz EngagementFrame + confidence
│       │   ├── eventEngine.ts        #   z-score + hysteresis + cooldown → candidate nudge
│       │   └── index.ts              #   PerceptionEngine: camera → frame stream
│       ├── audio/            # (cuttable) speech.ts (transcript) · talkTime.ts (who's talking)
│       ├── store/sessionStore.ts     # in-memory frame array + session state
│       ├── api/client.ts             # postFrames · requestNudge · streamDebrief (SSE)
│       ├── components/
│       │   ├── FaceMirror.tsx        #   webcam + mesh overlay ("what the AI sees")
│       │   ├── NudgeToast.tsx · ConfidenceBadge.tsx
│       │   ├── dashboard/            #   EngagementChart · Sparkline · TalkTimeBar
│       │   ├── TimelineChart.tsx     #   debrief hero chart
│       │   ├── Header.tsx
│       │   └── ui/                   #   shadcn primitives
│       ├── data/sessions.ts          # seeded fake past sessions (demo)
│       └── lib/utils.ts
│
└── server/                   # Node 20 + Express + pg
    ├── package.json · tsconfig.json
    └── src/
        ├── index.ts                  # Express: serve client/dist + mount /api, :8080
        ├── env.ts                    # load + validate env
        ├── gradient.ts               # DO Inference client + model constants
        ├── db/
        │   ├── pool.ts · schema.sql  #   sessions + frames tables (pgvector = stretch)
        │   └── sessions.ts           #   insertFrames · createSession · get · list
        ├── routes/
        │   ├── nudge.ts · debrief.ts · frames.ts · sessions.ts
        ├── llm/
        │   ├── nudgePrompt.ts        #   hedging lexicon + ban-list + confidence tier
        │   └── debriefPrompt.ts      #   temporal reasoning over the trajectory
        └── fallbacks.ts              # canned nudges + cached debrief on failure
```

**Migration from today's flat root:** the existing Vite app (`src/`, `index.html`,
`vite.config.ts`, `package.json`) moves under `client/`; add `server/` and `shared/`
and a root workspace `package.json`. Do it in one coordinated commit — teammates are
building on `main` right now.
