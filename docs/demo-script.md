# Demo script — approximately two to three minutes

Final submission update: the form requires a public or unlisted **YouTube** URL. The existing MP4 is an older synthetic-sandbox draft. Include a 30–40 second public-replay segment after the graph mutation: open `/replay`, advance from First alert to Diagnostic evidence to Traffic recovers, and show why traffic recovery is not full restoration. State that these are curated public historical facts and a simplified functional model, not live telemetry or an LLM diagnosis. Keep the real Groq tool trace in the sandbox segment. Narration or clear captions should make the distinction understandable.

Use actual application captures. The first part uses graph policy mode, clearly labelled. The final scene shows a saved report from the real Qwen/Groq agent, with validated selections and actual graph tool calls. Do not show a simulated provider response as a real model run.

**0:00 — The problem**

“Checkout is failing. But the customer impact does not stop at the service that raised the alert. BlastRadius follows the relationships behind an incident and shows the evidence for its response.”

**0:12 — Investigate**

Run the Checkout scenario with the dependency toggle off.

“The agent queries FalkorDB for recent changes reachable from Checkout. Payments is a supported hypothesis. Three customers are connected to the failure point, representing 420 thousand dollars in synthetic annual revenue exposure, not confirmed losses.”

**0:30 — Explain**

Select Northstar's path. Open the deployment source. Open one query trace.

“Here is the complete path, including the source records. We can inspect the actual Cypher, parameters, and database rows. The graph also identifies Arjun as the response owner and recalls a previous pool-exhaustion incident.”

**0:48 — Change the context**

Add the dependency and rerun.

“Now add one relationship: Analytics depends on Payments. A new investigation discovers Cedar Health. Four customers are exposed, totaling 630 thousand dollars. The response plan updates because the graph changed.”

**1:05 — Act and remember**

Create a local ticket. Save an explicitly synthetic observed outcome. Reload, then open incident memory.

“We create a local coordination ticket and record what actually happened. The report and outcome persist in FalkorDB and can inform the next session.”

**1:20 — Know when to stop**

Turn the dependency off. Select Analytics and run.

“When there is no recent supporting change, the agent asks for more evidence. BlastRadius gives the response a path you can inspect. It does not claim that correlation proves the cause.”

**1:35 — Real model, checked decisions**

Open the saved validated AI report in Response desk.

“The real model calls the four graph tools and chooses a deployment, customer set, and response category. The app validates those choices against the retrieved rows and renders the facts. An invented previous version is rejected instead of entering the report. The model run and its actual tool trace are saved with the incident.”

## Recording note

A narrated walkthrough assembled from actual captured app states is included when generated. It is not a continuous screen recording or a live-model benchmark. For a final submission, record your own live run after reviewing and contributing to the project so you can explain each decision.
