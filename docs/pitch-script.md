# Wavelength - Pitch Script + Q&A Prep

> The 3-minute stage narrative and the hard-question prep. Spoken lines are written to be said out
> loud, not read off a slide. Taglines: "Get on their wavelength." / "Copilot, never autopilot."

## The 3-minute script

**[0:00-0:30] Hook (tell the real story, slow down)**
> For most of us, navigating a conversation is intuitive. But for millions of neurodivergent people, the unwritten rules of networking are invisible. We have an autistic friend who is brilliantly bright. Last week at a startup networking event, we watched her introduce herself to someone. Within the first 15 seconds, she told him she was autistic. It was honest, but the timing caught him totally off guard. He tried to understand, but the conversation just awkwardly fizzled out after a minute. She could *feel* the tension, but couldn't read *why* it happened. It shook her confidence so much she went home 30 minutes into a 4-hour event. It's moments like these that make us realize there has to be a better way. She knew something went wrong, but nobody ever tells you exactly what it was. So we built the missing translator.

---
### 🎬 LIVE DEMO STARTS HERE (1 minute, 55 seconds total)

**[0:30-0:45] Demo Step 1: Consent Beat**
> *[Show the opening screen of the app]*
> We built Wavelength. A consented social co-pilot. First, visible consent. The video never leaves this laptop — only the understanding runs in the cloud, on DigitalOcean. *[Click 'I Consent' on screen]*

**[0:45-1:45] Demo Step 2: The Live Skit (let it breathe)**
> Here's a real conversation. 
> *[User talks slightly too long about something dry. Partner disengages on cue — glances away, checks phone, face goes flat. Pause for 5 seconds to let the silence land]*
> Watch the dashboard. The engagement line falls live in front of you. And there's the nudge: a highly hedged suggestion, 72% confidence, backed by evidence.
> *[User reads it, clicks it, and asks Partner a question. Partner lights up; the line recovers.]*
> That's the wow. It suggests, never diagnoses.

**[1:45-2:25] Demo Step 3: The Payoff (Debrief)**
> *[Click 'End Session' on the app]*
> We hit end. The conversation you just watched replays as an annotated timeline, and Claude's debrief streams in, generated live on DigitalOcean Gradient. Notice it never says you did anything wrong. It says the content was fine, but the timing made it land flat, and offers a concrete redo. It also caught that you held the floor for 84 seconds and didn't ask a question. Concrete, honest, and something you can actually practice before an interview.

### 🎬 LIVE DEMO ENDS HERE
---

**[2:25-3:00] Tech + why DigitalOcean (know the audience)**
> Everything you just watched ran on DigitalOcean: the Python backend on App Platform, the reasoning on Gradient Inference — Claude Haiku — and every conversation lands in Managed Postgres, so Wavelength learns your recurring patterns. We compute the hard numbers locally so the coaching is grounded in facts, not vibes.
> *[Optional flex: Click the dropdown in the UI to swap the model live]* One dropdown, and the same debrief re-runs on Claude Sonnet — watch the reads get sharper. One key, any model. That's their platform doing the flexing. Wavelength turns every awkward conversation into the one lesson nobody gave you.

## Q&A prep (the questions judges will actually ask)

**"How do you know the AI is right about what someone's feeling?"**
We never claim to read emotions or minds. We describe observable behaviour—gaze, smile, talk time—and give a hedged interpretation with a visible confidence level. The numbers are facts computed in code. The interpretation is always "this often means", never "she felt X". That honesty is deliberate, and it is safer for the user than false certainty.

**"Isn't this a surveillance dashboard?"**
No. It runs only with both people's explicit, visible consent — and the raw video never leaves the laptop. The screen faces the user only, meaning the nudge is discreet.

**"Isn't this condescending? Does it treat autistic people as broken?"**
No. It is a translator, not a trainer — an accommodation, like captions, and it helps both sides understand each other. It is built with our autistic friends as the first testers. Many neurodivergent people specifically prefer explicit, literal feedback over vague social hints, which is exactly what we give.

**"Couldn't ChatGPT do this in one prompt?"**
No. There is a live MediaPipe signal pipeline, speaker separation, deterministic metric computation that grounds the model, temporal analysis across the whole conversation, and a Postgres database that makes patterns recur across sessions. The prompt is one visible piece of a real pipeline.

**"Why DigitalOcean specifically?"** *(judges love this one, be ready)*
One key, every model, so the live model swap is trivial. Managed Postgres for the memory. App Platform for deploy. The whole stack is theirs, which let us spend our time on the actual product instead of plumbing.

**"Who pays for this?"**
Individuals who want to improve, as a subscription. And a real B2B angle: employers and universities running neurodiversity-inclusion programs, and social-skills therapists who want a between-sessions practice tool for clients.

**"What does a debrief cost to run?"**
Around a cent of inference on Haiku. The whole demo today runs on pocket change — that's the serverless pay-per-token model working as intended.
