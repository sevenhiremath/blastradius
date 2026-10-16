# Submission draft

**Project:** BlastRadius

**Tagline:** Follow the evidence from one alert to the full customer impact.

**Team:** cloud9

**Primary track:** Agents That Act on Connected Data

**Possible secondary track:** Agent Memory and Coordination. The project has persistent incident memory and saved model traces, but does not claim multi-agent coordination.

## Description

BlastRadius investigates a software incident by following service relationships in FalkorDB. Starting from an alert, it finds reachable recent deployments, traces exposed customers, retrieves the response owner and previous incidents, and creates a local incident ticket with evidence. Every customer has an inspectable dependency path, and every tool call exposes its query, parameters, and results.

The central demo adds one dependency. Analytics begins depending on Payments; a fresh investigation discovers another customer, raising synthetic annual revenue exposure from $420k to $630k. Removing that relationship reverses the result. Investigations and observed outcomes are retained as graph memory across sessions.

The default is a transparent graph policy agent. The model agent selects among four bounded graph tools and returns a structured decision. Its selected deployment and exact customer set are validated against retrieved rows; the factual report is rendered from those rows. Real Qwen/Groq checks pass for the baseline, changed dependency, and insufficient-evidence cases, with actual tool traces included.

## Technology

FalkorDB, Cypher, Node.js, the official FalkorDB JavaScript client, HTML/CSS/JavaScript/SVG, Docker Compose, and optional OpenAI-compatible function calling.

## Graph necessity

The candidate changes, customer exposure, evidence paths, owner, and previous incidents all come from live FalkorDB queries. Graph mutation changes the returned customers and response coordination. Tickets and outcomes are also written to FalkorDB. There is no fallback answer store.

## What is verified

Five synthetic candidate/exposure scenarios and the dependency mutation; persisted outcomes and reopening memory; idempotent local tickets; argument/tool rejection. See `evaluation.json` and `verification.md` for precise scope. No claim of causal diagnosis or real-world model accuracy is made.

## Before pressing Submit

- Review the implementation and make a meaningful participant contribution. Update `AI_DISCLOSURE.md` truthfully.
- Reproduce the live model demo using the configured Free plan and explain the validated-selection design.
- Ensure the final repository is public and accessible without login.
- The repository includes `docs/walkthrough.mp4`. Use its public URL or upload the reviewed video to your preferred video host and put its actual URL in the form.
- Publish the reviewed blog draft for the separate blog prize, and add its actual URL.
- Use the verified local setup instructions if no public deployment is available.
- Confirm final team membership before submitting; the registration page says it cannot be changed after submission.
- Submit before October 18, 2026, 11:59 PM IST. Check the signed-in event page for submission opening/status; the pasted registration status and public schedule differed.

Registration/submission and blog publication have not been performed by the application build. Do not claim those steps are complete until the actual event form and publication URLs confirm them.
