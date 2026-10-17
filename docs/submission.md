# Submission draft

**Project:** BlastRadius

**Tagline:** Follow the evidence from one alert to the full customer impact.

**Team:** cloud9

**Primary track:** Agents That Act on Connected Data

**Possible secondary track:** Agent Memory and Coordination. The project has persistent incident memory and saved model traces, but does not claim multi-agent coordination.

## Description

BlastRadius investigates a software incident by following service relationships in FalkorDB. Starting from an alert, it finds reachable recent deployments, traces exposed customers, retrieves the response owner and previous incidents, and creates a local incident ticket with evidence. Every customer has an inspectable dependency path, and every tool call exposes its query, parameters, and results.

A separate public incident lab replays a real incident using attributed factual paraphrases from a first-party postmortem. Advancing the historical event clock changes the evidence and assessment. It distinguishes diagnostic corroboration, traffic recovery, and restoration while leaving unavailable customer, revenue, and owner data unknown. Its dependency graph is explicitly a simplified functional model, not an internal service catalog. This mode runs the transparent graph policy, not an LLM diagnosis or live monitoring.

The central demo adds one dependency. Analytics begins depending on Payments; a fresh investigation discovers another customer, raising synthetic annual revenue exposure from $420k to $630k. Removing that relationship reverses the result. Investigations and observed outcomes are retained as graph memory across sessions.

The default is a transparent graph policy agent. The model agent selects among four bounded graph tools and returns a structured decision. Its selected deployment and exact customer set are validated against retrieved rows; the factual report is rendered from those rows. Real Qwen/Groq checks pass for the baseline, changed dependency, and insufficient-evidence cases, with actual tool traces included.

## Technology

FalkorDB, Cypher, Node.js, the official FalkorDB JavaScript client, HTML/CSS/JavaScript/SVG, Docker Compose, and optional OpenAI-compatible function calling.

## Graph necessity

The candidate changes, customer exposure, evidence paths, owner, and previous incidents all come from live FalkorDB queries. Graph mutation changes the returned customers and response coordination. Tickets and outcomes are also written to FalkorDB. There is no fallback answer store.

The public replay imports provenance-tagged component/surface nodes, modeled dependency edges, and timestamped events into separate graph labels. Bounded traversals find connected changes and exposure paths; an event-time cutoff excludes later event rows. Removing the connecting dependency removes the candidate even when diagnostic facts remain. SHA-256 packet digests preserve source provenance, and replay reports and actual query traces are persisted in FalkorDB. The executable queries are in `src/replay.js` and displayed in the interface.

## What is verified

Five synthetic candidate/exposure scenarios and the dependency mutation; persisted outcomes and reopening memory; idempotent local tickets; argument/tool rejection. See `evaluation.json` and `verification.md` for precise scope. No claim of causal diagnosis or real-world model accuracy is made.

Public replay checks cover five event-time checkpoints, unknown values, source references, import idempotency, persistence, and the dependency-removal counterexample. See `docs/public-incident-replay.md` and `pnpm evaluate:replay`. One curated historical case is not a blind accuracy benchmark.

## Required repository field

https://github.com/sevenhiremath/blastradius

## Required feedback drafts

Review these to reflect your own experience; do not claim independent verification you have not performed.

**What did you like about FalkorDB?** Dependency traversal and persistent incident memory fit naturally in the same graph. Parameterized Cypher returns inspectable evidence paths, and changing an edge changes the investigation. Named graphs let regression checks use isolated datasets without touching demo history.

**What improvements would you like to see?** More end-to-end incident-investigation examples would help new users: importing timestamped evidence, modeling provenance and uncertainty, applying time cutoffs, and checking graph-dependent agent decisions. A concise Docker Compose persistence and reconnect troubleshooting guide would also be useful. These are suggestions, not claims of product defects.

## Video, deployment, and blog fields

The signed-in submission form requires an actual **public or unlisted YouTube demo URL**. A GitHub MP4 link does not meet that instruction. The tracked `docs/walkthrough.mp4` is an older sandbox draft; record/review the final working demo, upload it to YouTube, and verify the link opens without the owner's login. No final YouTube URL has been provided or uploaded by this build. Suggested length: 2–3 minutes, a recommendation rather than a verified organizer limit.

Live deployment and blog are optional fields. Leave deployment blank unless a public app has actually been verified; localhost is not a public deployment. The README provides the accepted local setup alternative. The blog is an unpublished draft until an actual publication URL exists.

Suggested description disclosure: “Codex assisted with implementation, testing, source curation, and documentation. See AI_DISCLOSURE.md for scope and our contribution record.” Complete that record truthfully after participant review and meaningful contribution.

## Before pressing Submit

- Review the implementation and make a meaningful participant contribution. Update `AI_DISCLOSURE.md` truthfully.
- Reproduce the live model demo using the configured Free plan and explain the validated-selection design.
- Ensure the final repository is public and accessible without login.
- Upload the reviewed final demo to YouTube (public or unlisted) and put its actual URL in the required field.
- Publish the reviewed blog draft for the separate blog prize, and add its actual URL.
- Use the verified local setup instructions if no public deployment is available.
- Confirm final team membership before submitting; the registration page says it cannot be changed after submission.
- Submit before October 18, 2026, 11:59 PM IST. Check the signed-in event page for submission opening/status; the pasted registration status and public schedule differed.

Registration/submission and blog publication have not been performed by the application build. Do not claim those steps are complete until the actual event form and publication URLs confirm them.
