# Wavelength — Conversation Debrief and Co-Pilot for Neurodivergent Networking

> Living context doc for our final idea. Everything the team needs for the build and the
> 2-minute judge pitch goes here. Status: **name locked (Wavelength), mode locked
> (CONSENT → LIVE → DEBRIEF), modality locked (audio core + video supporting layer).
> Backend is Express/TypeScript on DO App Platform; frontend is React (`client/`).**

## One-liner
A consented social co-pilot for people who struggle to read how someone else is feeling in a
live conversation — built first for neurodivergent people. It turns observable cues into
discreet, hedged nudges in the moment, plus an annotated timeline and AI debrief afterward.
Suggests, never diagnoses.

## Pitch framing (LOCKED — how we convince)
**Headline = pain + job. Second line = who else shares the gap. Never lead with “for everyone.”**

1. **The job (plain language):** help people who really struggle reading others’ emotions /
   social cues *during* a real conversation — not flashcards, not a post-hoc diary.
2. **Primary user:** neurodivergent adults (autistic people, ADHD, and others) for whom those
   cues are hard to interpret in time.
3. **Same gap, other faces (second sentence, not the hero):**
   - **Low vision / blindness** — the face/body channel isn’t available visually; Wavelength
     translates what the camera can see into language (captions for the social channel).
   - **People who freeze in social situations** — overloaded, anxious, or out of practice;
     they miss the shift and never get told why.
4. **Spoken vs written:** Stage pitch stays neurodivergent-led (origin story). Landing / who-it’s-for
   copy may name vision + general social struggle as siblings of the same job.
5. **“Emotions” language:** Use it for the *human need* (“help reading how they’re feeling”).
   Never use it as a *technical claim* (“we know what they feel”). Product truth = observable
   signals + hedged / relative reads + confidence. Translator, not lie detector.

## Origin story (this is our "why us", lead the pitch with it)
For most of us, navigating a conversation is intuitive. But for millions of neurodivergent people, the unwritten rules of networking are invisible. We have an autistic friend who is brilliantly bright.

Last week at a startup networking event, we watched her introduce herself to someone. Within the first 15 seconds, she told him she was autistic. It was honest, but the timing caught him totally off guard. He tried to understand, but the conversation just awkwardly fizzled out after a minute. She could *feel* the tension, but she couldn't read *why* it happened. It shook her confidence so much she went home 30 minutes into a 4-hour event. It's moments like these that make us realize there has to be a better way. She knew something went wrong, but nobody ever tells you exactly what it was.

That is the exact gap this tool fills. Not "you're broken," but "here is what happened in that
moment, here is *why* it landed the way it did, and here is what you could try next time." We have
autistic friends and we watched this happen in person. That is the story judges remember, and it
is real.

## The problem (Social Good)
Networking and casual conversation run on unwritten rules: how much to disclose and when, how to
read when someone's interest or affect shifts, how to balance talking and asking. Many
neurodivergent people find these rules invisible in the moment. The same channel is unavailable
or hard to track for people with low vision, and easy to miss under social load for anyone who
freezes in networking. Existing help is expensive human coaching or generic apps that don't work
on real, messy conversations. Nobody gives you honest, specific feedback on a conversation you
actually had.

Why this scores where others don't: **the social good is showable and personal**, and it
survives Q&A because the value is obvious — and the framing stays specific, not “awkwardness app.”

## Product mode: 3-State App (CONSENT → LIVE → DEBRIEF) (LOCKED)
We are running a single-page web app with three critical states:
1. **CONSENT**: A visible, partner-facing consent screen ensures ethics-first design. Raw video never leaves the laptop.
2. **LIVE**: As the conversation happens, the screen faces the user (hidden from the partner). We show an engagement sparkline and deliver rare, discreet, highly hedged nudges if the partner disengages.
3. **DEBRIEF**: Post-conversation timeline with flagged moments and a full AI breakdown (what worked, what to try differently).

## Target user + framing guardrails
**Primary:** a neurodivergent adult who wants help reading how the other person is responding,
on their own terms — networking and casual conversation. Not a clinical or diagnostic tool.

**Also (same job):** people with low vision / blindness who can’t see facial and body cues; people
who generally struggle in social situations and miss shifts under load. Breadth is a *second*
sentence. Do not dilute the primary story to sound mass-market.

Guardrails (self-advocacy community and social-good judges care about these):
- **Agency, not correction.** Offers interpretations and options, never "you did this wrong."
- **Explicit and concrete, not vague.** Many neurodivergent users prefer direct, literal feedback
  over softened social hints.
- **Never diagnoses emotions.** Soft emotion probs (calm / happy / sad / tense / surprised /
  uncertain) are allowed only as **hedged relative probabilities with confidence** — never
  “she felt X.” Core nudges still ground in *observable* trajectory (talk time, smile, gaze,
  engagement, rPPG arousal as experimental).
- **Captions, not cure.** Accommodation for people who can’t access the social-emotional channel
  easily — including when that channel is visual.
- **"Nothing about us without us."** Built with community input.

## How it works (Architecture)
1. **Client-Side Perception**: Browser uses `getUserMedia` + MediaPipe to extract facial landmarks (blendshapes) at 12Hz. Web Speech API captures transcript.
2. **Derived Signals**: Pure JS calculates signals (smile, nod, gaze, soft emotion probs, rPPG / “The Tell”, engagement) mapped against a per-person baseline.
3. **DO Backend (Express/TS)**: The React app sends 1Hz signal frames to the DO-hosted Express API.
4. **Live Nudges**: A deterministic event engine watches for engagement drops, then hits DO Inference for a hedged nudge.
5. **Debrief**: Post-conversation, DO Inference (Claude Haiku/Sonnet) generates a structured timeline and coaching debrief.
6. **Longitudinal Memory (Best Use of Data)**: DO Managed Postgres stores all frames and debriefs to track user progress across multiple sessions.

## DigitalOcean tech mapping (Know the Audience)
Every layer rides on their platform:
- **DO Inference — reasoning model:** The nudge generation and the debrief analysis.
- **DO Managed Postgres:** Longitudinal pattern memory / Best Use of Data.
- **DO App Platform:** Express/TypeScript backend deployment and React serving.
- **Multi-model flex (demo beat):** Live-swap the reasoning model (e.g. Haiku to Sonnet) and show the debrief get sharper. One line of code on their platform.

## Defensibility (read before pitching)
You cannot reliably read a specific emotion off a face; the "one expression = one emotion" idea is
contested. So we never output verdicts about internal emotion. We surface **observable signals + a
probabilistic interpretation + the reasoning + explicit uncertainty.**

When someone asks “so you read emotions?”: **Yes, that’s the need we’re serving** — people who
struggle to read how others are feeling. **No, we don’t claim ground truth about inner states.**
Hedged reads with confidence beat false certainty. Anchoring live nudges in conversation
*trajectory and timing* (concrete, defensible) rather than snap emotion labels is deliberate.

## How it demos (Entertaining Demo)
Reenact the origin story with a live skit:
1. **Consent**: Tap "I consent" visibly.
2. **Live Loop**: The user talks too long about a dry topic. The partner disengages on cue. The engagement line drops live, and a nudge fires ("They may be drifting — maybe ask a question?"). User acts on it, line recovers.
3. **Debrief**: End the session and watch the annotated timeline replay with Claude's debrief.

## Scoring against the 5 judged criteria
| Criterion | Read |
|---|---|
| Novelty (DO use) | Strong — live nudges, multimodal debrief across DO models + Postgres memory. |
| Technical Complexity | Strong — Client-side perception (MediaPipe) + deterministic engine + DO inference. Not one prompt. |
| Social Good | Strong AND demoable, anchored in a real person we know. |
| Entertaining Demo | Strong — reenacted origin story + live engagement chart + judge participation. |
| Know the Audience | Strong — every layer is DO, with a multi-model flex. |
