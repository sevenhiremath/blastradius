import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { queries } from './queries.js';
import { scenarios, incidentTime } from './data.js';

// Explainable default policy: a bounded graph tool loop, with no hidden LLM requirement.
// A fresh result is obtained from FalkorDB on every run. No fixture answers are used.
export async function investigate(store, scenarioId, question='') {
  const scenario = scenarios.find(s=>s.id===scenarioId);
  if (!scenario) throw new Error('Unknown incident scenario');
  const trace = [];
  const start = performance.now();
  async function tool(name, params, purpose) {
    const t=performance.now();
    const rows=await store.query(queries[name],params);
    trace.push({tool:name,purpose,query:queries[name],params,rows,ms:Math.round((performance.now()-t)*100)/100});
    return rows;
  }
  const candidates=await tool('candidates',{service:scenario.service},'Follow downstream dependencies to changes within 60 minutes of the alert.');
  const candidate=candidates[0] || null;
  const focal=candidate?.service || scenario.service;
  const raw=await tool('customers',{service:focal},'Traverse upstream from the likely failure point to every exposed customer.');
  const byCustomer=new Map();
  for (const row of raw) {
    if (!byCustomer.has(row.id) || row.path.length < byCustomer.get(row.id).path.length) byCustomer.set(row.id,row);
  }
  const impacted=[...byCustomer.values()];
  const owners=await tool('owners',{service:focal},'Find the person responsible for the affected service.');
  const memories=await tool('memory',{service:focal},'Recall prior incidents and recorded outcomes from persistent graph memory.');
  const successful=memories.find(m=>m.status==='resolved'&&m.fix&&m.source?.startsWith('postmortems/'));
  const observation=memories.find(m=>m.status==='resolved'&&m.outcome&&!m.source?.startsWith('postmortems/'));
  const highSignal=Boolean(candidate&&candidate.errorDelta>=10);
  let recommendation=highSignal
    ? (successful?.fix || `Inspect ${focal} health and deployment diff. If regression is confirmed, roll back ${candidate.name} and verify recovery.`)
    : 'Do not recommend a rollback yet. Inspect live telemetry, check data freshness, and gather more evidence before changing production.';
  if(observation)recommendation+=` Review the newer recorded outcome in ${observation.source} before choosing a mitigation.`;
  const arr=impacted.reduce((sum,c)=>sum+c.arr,0);
  const result={id:randomUUID(),scenario:scenario.id,alertedService:scenario.service,title:scenario.title,question:question||scenario.question,
    severity:scenario.severity,incidentTime,createdAt:new Date().toISOString(),candidate,alternatives:candidates.slice(1),focalService:focal,
    confidence:highSignal?'Supported hypothesis':candidate?'Weak signal':'Insufficient evidence',
    summary:candidate?`${candidate.name} is a candidate because it is reachable from ${scenario.service}, changed ${candidate.minutesAgo} minutes before the alert, and has a ${candidate.errorDelta}-point error increase. This is correlation, not proven causation.`:'No deployment within the 60-minute investigation window meets the signal filter. There is not enough evidence to nominate a deployment.',
    customers:impacted,arr,owners,memories,recommendation,rollbackSuggested:highSignal,
    actions:[{type:'verify',text:candidate?`Confirm the signal in ${candidate.source} against live telemetry.`:'Collect fresh telemetry and check upstream ingestion.'},
      {type:'coordinate',text:`Assign the response to ${owners.map(o=>o.name).join(', ')||'the on-call engineer'}. Notify ${impacted.length} exposed customer account teams.`},
      {type:'mitigate',text:recommendation}],trace,mode:'Graph policy agent',elapsedMs:Math.round(performance.now()-start)};
  await store.query(`MATCH (s:Service {id:$service}) CREATE (i:Incident {id:$id,title:$title,status:'investigated',createdAt:$createdAt,origin:'investigation',source:$source,report:$report}) CREATE (i)-[:ABOUT]->(s)`,
    {service:focal,id:result.id,title:result.title,createdAt:result.createdAt,source:`investigations/${result.id}`,report:JSON.stringify(result)});
  return result;
}

export async function loadInvestigation(store,id) {
  const rows=await store.query(`MATCH (i:Incident {id:$id}) WHERE i.origin='investigation' RETURN i.report AS report,i.status AS status,i.outcome AS outcome,i.aiAnalysis AS aiAnalysis`,{id});
  if(!rows.length) return null;
  const analysis=rows[0].aiAnalysis?JSON.parse(rows[0].aiAnalysis):null;
  return {...JSON.parse(rows[0].report),status:rows[0].status,outcome:rows[0].outcome,...(analysis?.validation?{aiAnalysis:analysis}:{})};
}

export async function createTicket(store, id) {
  const report=await loadInvestigation(store,id);
  if(!report) throw new Error('Investigation not found');
  // Deterministic id + MERGE makes repeated clicks idempotent.
  const ticket={id:`BR-${id.slice(0,8).toUpperCase()}`,title:report.title,createdAt:new Date().toISOString()};
  const rows=await store.query(`MATCH (i:Incident {id:$incident}) MERGE (t:Ticket {id:$id}) ON CREATE SET t.title=$title,t.status='open',t.createdAt=$createdAt,t.body=$body MERGE (t)-[:FOR]->(i) RETURN t.id AS id,t.title AS title,t.createdAt AS createdAt`,{...ticket,incident:id,body:JSON.stringify({recommendation:report.recommendation,customers:report.customers,owner:report.owners,trace:report.trace})});
  return rows[0];
}

export async function resolveIncident(store,id,outcome) {
  const report=await loadInvestigation(store,id);
  if(!report) throw new Error('Investigation not found');
  if(!outcome?.trim()) throw new Error('An observed outcome is required');
  // Store the human-observed outcome, not an unverified recommendation as a successful fix.
  await store.query(`MATCH (i:Incident {id:$id}) SET i.status='resolved',i.outcome=$outcome,i.fix='' WITH i OPTIONAL MATCH (t:Ticket)-[:FOR]->(i) SET t.status='resolved'`,{id,outcome:outcome.trim()});
  return loadInvestigation(store,id);
}
