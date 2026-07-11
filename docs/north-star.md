# North Star — the real vision

> Internal. The hackathon deliverable is framed as a neurodivergent social co-pilot
> ([vision.md](./vision.md)) — that's the public face and the prize strategy. This
> doc is what we're *actually* building toward.

## The vision

AI that can **see and understand people by looking at them** — read emotion, body
language, attention, tension, and social state from video, in real time, and reason
about it over time. Machine perception of humans, the way a perceptive person reads a
room. The neurodivergent co-pilot is the first honest *application* of that capability,
not the ceiling.

## This is an experiment

We know the science isn't there yet. Facial "emotion detection" is contested, and
"lie detection" from face/body demonstrably does **not** work today. We are not
claiming otherwise. This is a **capability probe**: how far can a machine get at
reading a human from a webcam, right now, with today's models and signals? Some of it
will be real signal; some will be noise we're honest about. That honesty *is* the
experiment. An experiment that can't fail proves nothing.

## The two framings — hold both

| | Hackathon face (public) | North star (real) |
|---|---|---|
| What it is | Consented social co-pilot for neurodivergent people | AI that perceives & understands people from video |
| On stage | Hedged nudges, confidence-tagged, "suggest, never diagnose" | The same perception engine, pushed to its edges |
| Why this framing | Wins ethics + UX prizes; survives judge scrutiny | Where the actual research value is |
| Emotion labels | Kept out of the UI (the moat) | Read internally — that's the experiment |

The neurodivergent framing is a **presentation layer and a genuine application**, not a
limit on the engine. Build the general perception engine; present the humane slice.

## What "understanding" means here

Not one classification per frame. Perceive signals locally and continuously, then let a
**temporal reasoning layer** (an LLM over the signal *trajectory*) interpret change over
time — "tension rose here, attention flattened there." Measuring is a filter;
understanding is the temporal story built on top of it. That story is what makes it feel
like the machine actually *gets* the person, instead of just scoring frames.

## Rules of the experiment (so we stay honest)

- **Capability, not accuracy.** Show the machine *reads and reasons* — never claim a
  validated truth-detector. "This is the start of it," not "this works."
- **Confidence always attached.** Every read shows how sure it is. Uncertainty is data.
- **Local-first perception.** Signals derived on-device; only features + reasoning leave.
- **It's allowed to be wrong.** Being honest about the misses is the point.
