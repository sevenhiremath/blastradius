# AI assistance disclosure

Codex was used to create the initial BlastRadius implementation, graph seed and query catalog, interface, integration tests, evaluation script, documentation, and draft blog/demo materials. The graph database integration and default policy were executed against a real local FalkorDB instance; the interface was exercised in a browser.

The LLM tool loop has both simulated-transport integration tests and live checks using Qwen 3.8 27B through Groq's Free plan. The participant chose that provider and configured their key locally. The live checks cover baseline exposure, a changed dependency, and insufficient evidence. They are recorded separately from the deterministic five-scenario evaluation. Early live testing exposed unsupported factual prose; the final implementation uses validated model selections and renders the factual narrative from retrieved graph rows.

Participant review, understanding, and meaningful contribution are still required before this project is submitted. Do not represent agent-authored initial code or automated verification as work independently performed by the participant. Update this disclosure with the participant's actual decisions, changes, and verification before submission.

Suggested final disclosure after review: “We used Codex for implementation assistance, UI work, test generation, and documentation drafts. Our own contributions were: [replace with actual decisions, changes, and verification]. We can explain the graph schema, core Cypher queries, ranking policy, persistence, and tool boundaries.”

Remove the bracketed placeholder only after replacing it with a truthful account. The hackathon rules permit coding assistants but require disclosure, understanding, and meaningful participant contribution.
