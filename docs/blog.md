# One New Dependency, One More Exposed Customer: Building BlastRadius with FalkorDB

A checkout alert tells you something is wrong. It does not tell you which change matters, which other products depend on the same service, who should respond, or whether the team has seen the failure before.

BlastRadius connects those questions in a graph. It is a small incident investigation application built for Graph Hacks 2026, with FalkorDB as its operational context and memory layer.

## Start with an alert, not a conclusion

Our fictional company, Nova Commerce, has a Checkout API that depends on Payments. Payments depends on Ledger DB. Subscriptions also depends on Payments. Customers enter the graph through the services they use.

The demo alert is “Checkout error rate above 25%.” A recent Payments deployment is eight minutes old relative to a fixed synthetic incident clock and has a 28-percentage-point error increase. There is also a recent Search deployment, but Search is not reachable from Checkout through dependencies.

The first tool query follows `DEPENDS_ON` from the alerted service to candidate deployments. It excludes disconnected changes before applying the ranking policy. The agent reports Payments as a supported hypothesis, with the deployment record attached. It does not claim that temporal correlation proves the cause.

## The answer is a path

Next, the agent walks upstream from Payments to customers:

```text
Northstar Retail → Storefront → Checkout API → Payments
Atlas Market → Checkout API → Payments
Orbit Labs → Subscriptions → Payments
```

Three customers are exposed. Their fictional annual contracts total $420,000. That number describes exposure, not realized revenue loss or a confirmed outage for every customer.

Each path includes source references from customer contracts and the service catalog. Selecting a customer highlights its path. Clicking a reference opens the synthetic source record. A query trace shows the exact Cypher, parameters, rows, and timing behind the result.

## Change one relationship

The most useful experiment is deliberately small: add `Analytics → Payments`.

This is a real write to FalkorDB. The interface marks the previous report stale and asks for a fresh investigation. The next traversal discovers:

```text
Cedar Health → Analytics → Payments
```

Exposure rises to four customers and $630,000. The response plan now includes coordinating with four customer account teams. The model prompt, customer contracts, and ranking policy did not need to change; reachability changed.

The toggle can remove the edge again. That makes the experiment easy to reproduce and inspect.

## Memory belongs beside the operational context

The investigation also follows the service's ownership relationship and recalls its previous incidents. Payments has a synthetic postmortem about pool exhaustion. The agent recommends inspecting saturation and, if the regression is verified, considering the previous mitigation.

New investigations become `Incident` nodes. Local tickets link to those incidents. A human can record what they actually observed after a response. A later investigation can retrieve that outcome through the same service relationship, including after a new application session.

Recommendations are not automatically stored as successful fixes. An observed outcome must be entered explicitly. These records are still human assertions, not independent proof that a procedure is safe in a new incident.

## A transparent default and an optional AI tool loop

The default graph policy agent runs without a paid model key. Its four tools retrieve changes, customers, ownership, and memory. Its ranking and abstention policy are visible in the code.

An optional model-backed agent selects from those same four read-only tools. It cannot issue arbitrary Cypher or execute production changes. Arguments are validated against known service IDs, and the loop has turn and tool-call limits.

Live testing with Qwen 3.8 27B through Groq's Free plan revealed a useful failure: the first freely written answer supplied an unsupported previous version and an incorrect relative date. Source links alone had not prevented those claims.

The final model contract is therefore a structured selection: deployment ID, response category, and exact customer IDs. The app rejects invented IDs, incomplete customer sets, unsupported response categories, and free prose. It requires customer, owner, and memory tool results for the chosen service, then renders the factual narrative from those database rows. A known-good prior version is described as unknown when the graph does not contain it. This checks consistency with retrieved evidence; it does not prove that the graph is complete or that the selected deployment caused the incident.

Separate live checks now pass for the baseline, the added dependency, and the insufficient-evidence case. Each run used the real model and all four graph tools. Their actual traces are included in the repository, separately from the deterministic evaluation.

## What we checked

The included evaluation checks five fixed synthetic incidents. Candidate selection and customer exposure match the expected fixtures in all five. A separate mutation check confirms the change from three customers/$420k to four/$630k.

Integration checks cover persisted outcomes, idempotent ticket creation, invalid incident IDs, and rejecting unsupported model tools. These checks establish that the demo's graph behavior works on its fixtures. They do not establish general diagnostic accuracy, model quality, or superiority over another retrieval system.

One useful case has no recent eligible Analytics deployment. With the extra dependency off, the agent recommends gathering evidence rather than rolling back an unrelated change. The Ledger case contains a recent but weak signal; its response also avoids recommending a rollback.

## Adding a public incident replay

The project now includes a separate historical incident lab, documented in `docs/public-incident-replay.md`. It imports short attributed factual paraphrases from a public first-party postmortem, with a packet digest and explicit modeling assumptions. Advancing an event-time cutoff changes the retrieved evidence and policy assessment. The graph distinguishes a candidate, diagnostic corroboration, mitigation, recovery, and restoration; missing customer and revenue data remain unknown. Removing a connecting dependency removes the candidate in a database-backed counterexample test.

This is a retrospective, manually curated replay, not live production telemetry or a blind evaluation. The original sandbox's AI model integration remains separate. The most useful lesson is that realism includes temporal boundaries, uncertainty, and provenance, rather than replacing invented numbers with equally unsupported real-company claims.

## Further work

The next practical steps are live telemetry ingestion, broader adversarial model evaluation, time-aware dependency changes, and better candidate ranking. Real deployment would also need authentication, tenant separation, concurrency controls beyond a single-process queue, and a reviewed action workflow.

For this weekend's scope, the contribution is concrete: a graph that determines the investigation, exposes the evidence path, and preserves the incident outcome for the next session.

---

AI assistance: Codex assisted with implementation, verification, public-fact curation, and this article draft. Participant review and meaningful contribution must be documented before publication or submission. Sandbox companies and measurements are fictional; the separately labelled historical replay uses attributed public facts.

References: [Graph Hacks](https://www.wemakedevs.org/hackathons/falkordb), [FalkorDB client](https://github.com/FalkorDB/falkordb-ts), [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling).
