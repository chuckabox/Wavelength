# Wavelength - Pitch Script + Q&A Prep

> The 3-minute stage narrative and the hard-question prep. Spoken lines are written to be said out
> loud, not read off a slide. Taglines: "Get on their wavelength." / "Copilot, never autopilot."
>
> Framing locked in [pitch.md](./pitch.md): **neurodivergent-led origin story**; job = help people
> who struggle reading how others are feeling; low vision + social freeze = same gap (second beat,
> not the hero). “Emotions” = human need; product = hedged signals, never diagnose.

## The 3-minute script

**[0:00-0:45] The Problem & The Solution**
> Last week, we watched a brilliant autistic friend of ours introduce herself at a startup event. Within 15 seconds, she blurted out that she was autistic. It caught the other person completely off guard, the conversation fizzled out, and she went home early, completely defeated.
>
> The problem is that for millions of neurodivergent people, reading how someone else is feeling in the moment is hard — the unwritten rules are invisible. They know when an interaction fails, but no one ever tells them *why*.
>
> To solve this, we built Wavelength: a private, consented social co-pilot that helps people who really struggle to read others’ emotions in a live conversation. Built first for neurodivergent people — and the same idea helps anyone who can’t easily see or track those cues.
> *[Show the app]*
> Wavelength ensures total privacy. Video never leaves this laptop — only derived signals and transcript text run in the cloud on DigitalOcean. *[Click 'I Consent' on screen]*

**[0:45-1:45] Demo Part 1: The Live Skit**
> *[User talks slightly too long about something dry. Partner disengages — glances away, checks phone, face goes flat. Pause for 5 seconds]*
> Watch the dashboard. The engagement line falls live. Wavelength immediately sends a highly-hedged, evidence-backed nudge: "72% confidence you've held the floor too long."
> *[User clicks the nudge and asks Partner a question. Partner lights up; the line recovers.]*
> That's how we help in the moment. Wavelength suggests, it never diagnoses.

**[1:45-2:25] Demo Part 2: The AI Debrief**
> *[Click 'End Session' on the app]*
> The real magic is the debrief. The conversation replays as an annotated timeline, generated live on DigitalOcean Gradient. Notice it never scolds you. It tells you the content was fine, but the timing landed flat, and offers a concrete redo. Concrete, honest feedback you can practice before your next interview.

### LIVE DEMO ENDS HERE
---

**[2:25-3:00] Tech Stack & Closing**
> To make this work seamlessly, we built the entire infrastructure on DigitalOcean. We host our Node backend on App Platform, store user memory in Managed Postgres, and use DigitalOcean Gradient AI Inference to power the reasoning.
> We run Claude Haiku 4.5 for real-time speed, and because we are on Gradient, we can swap to Claude 4.6 Sonnet instantly with one dropdown for deep analysis.
> Wavelength turns every awkward conversation into the one lesson nobody gave you. Thank you.

## Q&A prep (the questions judges will actually ask)

**"So you read people's emotions?"**
We help people who *struggle* to read how someone else is feeling — that’s the need. What we ship is more careful: observable behaviour (gaze, smile, talk time, engagement), optional soft emotion probabilities as relative hedges with confidence, and suggestions like “this often means…,” never “she felt X.” False certainty would be worse than silence.

**"How do you know the AI is right about what someone's feeling?"**
We never claim to. The numbers are facts computed in code from the camera. The interpretation is always hedged and ignorable. That honesty is deliberate, and it is safer for the user than a fake emotion detector.

**"Isn't this a surveillance dashboard?"**
No. It runs only with both people's explicit, visible consent — and the raw video never leaves the laptop. The screen faces the user only, meaning the nudge is discreet.

**"Isn't this condescending? Does it treat autistic people as broken?"**
No. It is a translator, not a trainer — an accommodation, like captions, and it helps both sides understand each other. It is built with our autistic friends as the first testers. Many neurodivergent people specifically prefer explicit, literal feedback over vague social hints, which is exactly what we give. The same captions metaphor applies for people with low vision: the social channel becomes language.

**"Who is this actually for — neurodivergent people or everyone?"**
Primary: neurodivergent people who find live social-emotional cues hard to read. Same job: low vision / blindness (can’t see the cues) and people who freeze in social situations (miss the shift under load). We don’t pitch “awkwardness for all” — we pitch a sharp gap, then name who else shares it.

**"Couldn't ChatGPT do this in one prompt?"**
No. There is a live MediaPipe signal pipeline, deterministic metric computation that grounds the model, temporal analysis across the whole conversation, and a Postgres database that makes patterns recur across sessions. The prompt is one visible piece of a real pipeline.

**"Why DigitalOcean specifically?"** *(judges love this one, be ready)*
One key, every model, so the live model swap is trivial. Managed Postgres for the memory. App Platform for deploy. The whole stack is theirs, which let us spend our time on the actual product instead of plumbing.

**"Who pays for this?"**
Individuals who want to improve, as a subscription. And a real B2B angle: employers and universities running neurodiversity-inclusion programs, accessibility / low-vision support contexts, and social-skills therapists who want a between-sessions practice tool for clients.

**"What does a debrief cost to run?"**
Around a cent of inference on Haiku. The whole demo today runs on pocket change — that’s the serverless pay-per-token model working as intended.
