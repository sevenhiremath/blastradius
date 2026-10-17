# Verification record

Date: October 16, 2026 (IST).

## Public replay update — October 18, 2026 (IST)

- Added an attributed historical public-incident packet and a separate `/replay` interface; the original fictional sandbox remains separate.
- Docker Compose rebuilt and started the updated application successfully. The earlier resolved incident `21b8eef9-c789-461a-8dc6-a93e342cb889` remained readable after app replacement.
- Full key-free suite: **21 reported tests passed**, including the two enclosing integration tests. No live provider calls were made for this update.
- `pnpm evaluate:replay` passed all five event-time checkpoints and the dependency-removal counterexample; see `public-replay-evaluation.json`.
- Verified that the first-alert query excludes later diagnostic/action events, missing customer/revenue/owner data remain unknown, and traffic recovery does not mark protection restored.
- Removing the connecting dependency removes the candidate even though diagnostic event records still exist. Import is idempotent; changing a packet under the same case ID is rejected. Audit reports survive a new connection.
- Browser checks: selected pre-change, diagnostic, and recovery checkpoints; confirmed changing assessments and evidence; downloaded an actual JSON evidence packet. Checked the narrow-screen layout without horizontal overflow and restored the viewport. Screenshot: `screenshots/public-replay.jpg`.
- HTTP checks: POST replay returned the expected candidate and event count; a cross-origin POST returned 403. Reports are created through POST, not a side-effecting GET.
- The implementation was checked on a feature branch before integration into main. The public replay is one manually curated historical case with a simplified functional model, not raw production telemetry, live diagnosis, or an LLM accuracy benchmark.

## Executed against real FalkorDB

- Docker Compose image build and one-command local startup succeeded.
- FalkorDB image: `falkordb/falkordb:v4.14.11`.
- Confirmed `appendonly=yes` on the running database, with storage directory `/var/lib/falkordb/data` mapped to a named volume.
- Integration suite: 11 reported tests, all passing (one enclosing test with ten subtests).
- Candidate selection and exact customer exposure matched all five fixed synthetic fixtures.
- Mutation: adding `Analytics → Payments` changes Checkout exposure from 3 customers/$420k to 4 customers/$630k; removing it restores the original exposure.
- Local ticket creation is idempotent for the same investigation.
- Resolved outcomes are retrieved through a fresh database connection.
- A resolved incident and its outcome survived replacement of the database container. See `persistence-check.json`.
- With the database stopped, both health and investigation endpoints returned HTTP 503. The app automatically reconnected when the database returned, retaining incident and ticket history. See `system-check.json`.
- A cross-origin write attempt returned HTTP 403.

## Browser checks

- Ran Checkout investigation through the UI and confirmed the graph paths and metrics.
- Opened the deployment source record and inspected its synthetic telemetry.
- Selected a customer path and verified highlighting.
- Added/removed the dependency and reran the investigation.
- Inspected the actual Cypher, query parameters, and rows in the trace.
- Created a local ticket and saved an explicitly labelled synthetic outcome.
- Recalled that outcome after the database replacement.
- Ran Analytics with the extra edge off and confirmed the insufficient-evidence recommendation.
- Checked the mobile breakpoint around 390px; document content width equalled viewport width. The evidence table has its own horizontal scrolling container.
- Captured screenshots in `screenshots/`.

## Model boundary

The AI tool agent has simulated-transport integration tests plus three real Qwen 3.8 27B/Groq Free plan checks: baseline Checkout, added Analytics dependency, and Analytics with insufficient evidence. All four graph tools were called in each live run. See `live-ai-check.json`, `live-ai-changed-check.json`, and `live-ai-analytics-check.json` for actual results and traces. These three cases are not a model-quality or real-outage accuracy benchmark.

Early live testing exposed tool fan-out and unsupported version/date prose. The final runner forces a single first query and accepts a structured selection. Validation rejects unsupported deployments, incomplete customer sets, prose/extra fields, missing ownership/memory evidence, and rollback categories unsupported by the signal threshold. The factual report is rendered from retrieved records. Tests include negative cases for invented deployments, unsupported prose, partial exposure, and weak-evidence rollback decisions.

## Walkthrough

`docs/walkthrough.mp4` is a roughly two-minute narrated walkthrough assembled from actual captured UI states, including the saved result of a real Groq model run. It is 1920×1080 H.264 video with AAC narration. It is not a continuous screen recording. The narration is synthesized with a local Windows voice.

## Interpretation limits

This is a local single-user demo over entirely synthetic data. Fixture correctness does not establish real-world diagnostic accuracy. Candidate ranking is a heuristic, revenue is exposure rather than loss, and recommendations do not execute production changes. Participant review, meaningful contribution, and accurate AI-assistance disclosure remain necessary before hackathon submission.
