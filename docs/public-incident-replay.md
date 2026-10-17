# Public incident replay

Open `http://localhost:4317/replay` after starting the normal Docker Compose setup.

The public incident lab converts a real first-party postmortem into an inspectable graph investigation. It supplements the original fictional customer-impact sandbox; it does not mix fictional customers with public incident facts.

## Source and provenance

- Primary source: [Cloudflare's public incident report](https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/), section “What happened.”
- Input packet: `src/replay-data.js`. Short manually curated factual paraphrases and a source URL, not a redistributed article, screenshot, or raw production dataset. The article remains the publisher's work; our MIT license does not relicense it.
- The first-alert timestamp is derived from a duration in the report and labelled as such in the UI.
- The functional dependency model is our simplification, not an exported Cloudflare service catalog or independently measured call graph.
- Imports record a SHA-256 packet digest and are idempotent. Changing a packet under an existing case ID is rejected; use a new ID for revised packets to retain provenance.
- No private records, personal data, contracts, or production credentials are used. Customer count, revenue, and named on-call ownership are unknown.

## Reproduce the demonstration

1. **Before the change:** no candidate; exposure remains unassessed.
2. **First alert:** a reachable change is a candidate, not a confirmed cause.
3. **Diagnostic evidence:** the assessment can now use corroboration.
4. **Traffic recovers:** restoration stays open rather than equating traffic recovery with restored protection.
5. **Protection restored:** inspect the timeline, sources, and actual graph queries; export the evidence packet.

This is a **retrospective event-time replay**, not a blind diagnosis benchmark or a reconstruction of what responders knew. The public postmortem was written afterwards; `at` is event time. Future event rows are excluded for the chosen cutoff. Navigation labels identify later checkpoints intentionally.

## Graph model and necessity

`ReplayDataset` stores provenance, packet digest, and checkpoints. `ReplayNode` represents modeled surfaces/components. `REPLAY_DEPENDS_ON` edges carry evidence URLs and an explicit modeling basis. `ReplayEvent` nodes connect through `DESCRIBES`. `ReplayRun` stores reports and actual query traces for auditing.

The candidate query walks up to six dependency hops from the alert to changes that have already occurred. The surface query traverses towards the candidate. Removing the connecting edge removes the candidate and exposure paths even with diagnostic records present. This counterexample is tested against real FalkorDB. Separate labels keep the replay out of synthetic sandbox metrics and memory.

The executable query catalog is `src/replay.js` (`replayQueries`) and is shown verbatim in the UI. All data inputs are parameters. There is no model-written Cypher or network scraping in the request path.

## Verification and boundaries

Run `pnpm test` and `pnpm evaluate:replay` with FalkorDB running. Tests/evaluation create uniquely named graphs and remove only those graphs. Checks cover five event-time checkpoints, unknown customer/revenue values, dependency removal, import idempotency, and report persistence through reconnect. These establish regression behavior on one curated case, not general diagnostic accuracy.

The replay executes a transparent graph policy with no model call. The original sandbox retains its separately validated Groq AI tool agent. Historical public evidence is not live telemetry integration. Production OTLP ingestion, multiple independently chosen cases, authentication, and reviewed response actions remain future work.
