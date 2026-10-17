# Explain BlastRadius in your own words

## Five-minute code tour

1. `src/data.js`: fictional services, dependencies, deployments, customers, and five alert scenarios. Explain why timestamps are relative to a fixed incident clock.
2. `src/graph.js`: connection to the real database, idempotent seed, and the reversible dependency write.
3. `src/queries.js`: the four investigation tools. Read each one aloud, particularly the direction of `DEPENDS_ON` and why the customer query follows `USES` first.
4. `src/agent.js`: tool loop, candidate ranking, customer deduplication, weak-evidence abstention, incident persistence, local tickets, and outcomes.
5. `src/llm.js`: the AI agent's tool definitions, validation, provider loop, and budgets. Explain the difference between simulated-transport tests and the three separate real Groq checks. Read `validateAndRender`: the model selects records; the app verifies the selection and renders source facts.
6. `src/server.js`: HTTP routes and serialization of graph writes. It is a single-user local demo, not an authenticated production deployment.
7. `public/app.js`: graph highlighting, stale reports, saved investigations, and source record viewer.

## Questions to practice

- How does the public incident lab differ from the sandbox? The lab contains attributed facts from a real public postmortem; the sandbox has fictional customers, money, owners, and telemetry. They use separate graph labels.
- What does the historical clock mean? It filters by event time, not when responders actually learned a fact. The packet was curated retrospectively, so this is not a blind diagnosis experiment.
- Does recovered traffic mean an incident is fully restored? No. The replay distinguishes mitigation, traffic recovery, and restoration, and keeps unavailable values unknown.
- Is the public replay model-driven? No. `src/replay.js` implements an explicit graph policy; the sandbox's optional Groq agent is separate. Read the replay query catalog and `src/replay-data.js` to understand source provenance and modeled relationships.

- Why does a Checkout alert expose a Subscriptions customer? Both depend on Payments; exposure is computed from the candidate failure point, not just the alerted service.
- Why is the Search deployment excluded from the Checkout investigation? No downstream dependency path connects Checkout to Search.
- Does the biggest error delta prove a cause? No. It is an explicit heuristic over a reachable deployment. Live telemetry and the diff must be checked.
- Why does adding an edge change the recommendation? It makes Cedar reachable, expands the exposure list, and changes the account-team coordination step.
- What happens if there are two paths to one customer? The report deduplicates the customer before summing revenue and displays the shortest returned path.
- Where is memory stored? `Incident` nodes, linked to the selected service through `ABOUT`; tickets link through `FOR`.
- What survives a browser reload or app restart? Database records and dependency changes. The page can reopen saved reports; temporary selected-path highlighting is just UI state.
- How is memory made durable? A FalkorDB named volume with append-only persistence. Confirm the actual server configuration rather than trusting a Compose file.
- What does the model control? Which of four read-only graph tools to call, which retrieved deployment/customer records to select, and a bounded response category. Final selections are checked against the actual rows. The factual narrative is rendered by the app. It cannot execute rollback, send messages, or run arbitrary queries.
- What is the main evaluation limitation? Five synthetic fixtures are a regression suite, not evidence of real-world accuracy or model superiority.
- What did you personally change and verify? Answer this truthfully. Review alone should not be presented as independent implementation.

## Suggested meaningful participant contribution

Pick a real improvement you understand and implement it before submission: add a sixth scenario involving a misleading recent deployment; improve the ranking with a well-explained rule; add a multiple-path deduplication fixture; or validate an actual model/provider and document its failures. Record your decisions and results. Do not claim a change merely because it is on this list.
