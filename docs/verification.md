# Verification record

Date: October 16, 2026 (IST).

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

The optional AI tool agent is implemented and tested with simulated model responses that execute real FalkorDB queries. Unknown tool names and invented service identifiers are rejected. A real external model/provider has not yet been verified in this record. No model-quality or real-outage accuracy claim is made.

## Walkthrough

`artifacts/BlastRadius-walkthrough.mp4` is a narrated walkthrough assembled from actual captured UI states. It is approximately 95 seconds, 1920×1080 H.264 video with AAC narration. It is not a continuous screen recording and does not claim a live model call. The narration is synthesized with a local Windows voice.

## Interpretation limits

This is a local single-user demo over entirely synthetic data. Fixture correctness does not establish real-world diagnostic accuracy. Candidate ranking is a heuristic, revenue is exposure rather than loss, and recommendations do not execute production changes. Participant review, meaningful contribution, and accurate AI-assistance disclosure remain necessary before hackathon submission.
