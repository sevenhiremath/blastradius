# AI assistance disclosure

Codex was used to create the initial BlastRadius implementation, graph seed and query catalog, interface, integration tests, evaluation script, documentation, and draft blog/demo materials. The graph database integration and default policy were executed against a real local FalkorDB instance; the interface was exercised in a browser.

Codex's automated repository maintenance added the duplicate graph-tool guard and its regression tests on October 17, 2026.

On October 18, automated maintenance also corrected ticket retry responses to return the stored creation timestamp and added a database-backed regression check.

On October 19, automated maintenance added strict calendar-date validation and regression checks for imported replay events and checkpoints.

On October 20, automated maintenance corrected UTF-8 request decoding across network chunks and added request-size and Unicode regression checks.

On October 21, automated maintenance corrected candidate dependency distances to exclude the deployment relationship and added database-backed zero-, one-, and two-hop checks.

On October 22, automated maintenance deduplicated deployments reached through converging dependency paths, retained their shortest distance, and added a database-backed regression check.

On October 24, automated maintenance rejected missing and non-string public replay identifiers before database access and added key-free validation regressions.

On October 25, automated maintenance documented Docker engine startup troubleshooting after an observed local startup failure, including recovery commands that preserve saved graph memory.

On October 26, automated maintenance enforced the optional AI agent's single-query first reply before database access and added a simulated-provider regression for rejected fan-out.

On October 27, automated maintenance rejected null, array, and scalar JSON request bodies before API handlers access their fields and added key-free regression coverage.

On October 29, automated maintenance rejected malformed UTF-8 request bytes instead of silently substituting saved text and added regressions distinguishing malformed bytes from a valid replacement character.

On October 30, automated maintenance added simulated-provider regression coverage for the six-turn, four-calls-per-reply, and twelve-total-calls AI tool budgets, verifying rejected calls do not reach the graph.

On October 31, automated maintenance validated public replay source URLs with a URL parser before import, rejecting malformed HTTPS links and non-string values with key-free regressions.

Codex also researched and implemented the public incident replay on October 18, 2026: the curated factual packet, simplified functional model, interface, event-time policy, and checks. This is AI-assisted implementation, not an independent participant contribution. It uses historical public facts, not live production telemetry, and runs a graph policy rather than an LLM diagnosis.

The LLM tool loop has both simulated-transport integration tests and live checks using Qwen 3.8 27B through Groq's Free plan. The participant chose that provider and configured their key locally. The live checks cover baseline exposure, a changed dependency, and insufficient evidence. They are recorded separately from the deterministic five-scenario evaluation. Early live testing exposed unsupported factual prose; the final implementation uses validated model selections and renders the factual narrative from retrieved graph rows.

Participant review, understanding, and meaningful contribution are still required before this project is submitted. Do not represent agent-authored initial code or automated verification as work independently performed by the participant. Update this disclosure with the participant's actual decisions, changes, and verification before submission.

Suggested final disclosure after review: “We used Codex for implementation assistance, UI work, test generation, and documentation drafts. Our own contributions were: [replace with actual decisions, changes, and verification]. We can explain the graph schema, core Cypher queries, ranking policy, persistence, and tool boundaries.”

Remove the bracketed placeholder only after replacing it with a truthful account. The hackathon rules permit coding assistants but require disclosure, understanding, and meaningful participant contribution.
