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
