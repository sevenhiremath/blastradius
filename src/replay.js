import { createHash,randomUUID } from 'node:crypto';
import { publicIncident } from './replay-data.js';

export const replayQueries={
  context:`MATCH (d:ReplayDataset {id:$caseId}) RETURN d.title AS title,d.source AS source,d.provenance AS provenance,d.limitation AS limitation,d.digest AS digest,d.alert AS alert,d.stages AS stages`,
  topology:`MATCH (a:ReplayNode {caseId:$caseId})-[r:REPLAY_DEPENDS_ON]->(b:ReplayNode {caseId:$caseId}) RETURN a.id AS source,a.name AS sourceName,a.kind AS sourceKind,b.id AS target,b.name AS targetName,b.kind AS targetKind,r.evidence AS evidence,r.basis AS basis ORDER BY source,target`,
  changes:`MATCH p=(a:ReplayNode {caseId:$caseId,id:$alert})-[:REPLAY_DEPENDS_ON*0..6]->(s:ReplayNode {caseId:$caseId}) MATCH (e:ReplayEvent {caseId:$caseId})-[:DESCRIBES]->(s) WHERE e.kind='change' AND e.at<=$at RETURN DISTINCT e.id AS id,e.text AS text,e.at AS at,e.source AS source,s.id AS service,s.name AS serviceName,[n IN nodes(p) | n.name] AS path,[r IN relationships(p) | r.evidence] AS sources ORDER BY at DESC`,
  evidence:`MATCH (e:ReplayEvent {caseId:$caseId})-[:DESCRIBES]->(s:ReplayNode {caseId:$caseId}) WHERE e.at<=$at RETURN e.id AS id,e.kind AS kind,e.text AS text,e.at AS at,e.source AS source,e.timeNote AS timeNote,s.id AS service ORDER BY at`,
  surfaces:`MATCH p=(s:ReplayNode {caseId:$caseId,kind:'surface'})-[:REPLAY_DEPENDS_ON*1..6]->(n:ReplayNode {caseId:$caseId,id:$service}) RETURN DISTINCT s.id AS id,s.name AS name,[v IN nodes(p) | v.name] AS path,[v IN nodes(p) | v.id] AS nodeIds,[r IN relationships(p) | r.evidence] AS sources ORDER BY name`,
  history:`MATCH (r:ReplayRun {caseId:$caseId}) RETURN r.id AS id,r.createdAt AS createdAt,r.stage AS stage,r.at AS at,r.status AS status ORDER BY createdAt DESC LIMIT 12`
};

export function validateIncident(data){
  const fail=()=>{throw new Error('Invalid public incident packet');};
  if(!data||!/^[-a-z0-9]+$/.test(data.id)||!data.source?.url?.startsWith('https://')||!data.source.title||!data.title||!data.provenance||!data.limitation)fail();
  if(!Array.isArray(data.nodes)||!data.nodes.length||data.nodes.length>50||!Array.isArray(data.events)||data.events.length>100||!Array.isArray(data.edges)||data.edges.length>100||!Array.isArray(data.stages)||!data.stages.length)fail();
  const ids=new Set(data.nodes.map(n=>n.id));
  // Date.parse normalizes impossible days and 24:00; require an exact UTC round trip.
  const validTime=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s.replace('Z','.000Z');
  if(ids.size!==data.nodes.length||!ids.has(data.alert)||data.nodes.some(n=>!/^[-a-z0-9]+$/.test(n.id)||!n.name||!['surface','component'].includes(n.kind)))fail();
  if(data.edges.some(e=>!ids.has(e.from)||!ids.has(e.to)||e.from===e.to)||new Set(data.edges.map(e=>`${e.from}:${e.to}`)).size!==data.edges.length)fail();
  if(new Set(data.events.map(e=>e.id)).size!==data.events.length||data.events.some(e=>!/^[-a-z0-9]+$/.test(e.id)||!ids.has(e.node)||!validTime(e.at)||!e.text||!['change','alert','diagnostic','mitigation','recovery','restoration'].includes(e.kind)))fail();
  if(new Set(data.stages.map(s=>s.id)).size!==data.stages.length||data.stages.some(s=>!/^[-a-z0-9]+$/.test(s.id)||!s.label||!validTime(s.at)))fail();
  return data;
}

export async function seedPublicIncident(store,data=publicIncident){
  validateIncident(data);
  const digest=createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const existing=await store.query('MATCH (d:ReplayDataset {id:$id}) RETURN d.digest AS digest',{id:data.id});
  if(existing.length){if(existing[0].digest!==digest)throw new Error('Public incident packet changed; use a new case id to preserve replay provenance');return;}
  for(const n of data.nodes)await store.query(`MERGE (n:ReplayNode {caseId:$caseId,id:$id}) SET n.name=$name,n.kind=$kind`,{caseId:data.id,...n});
  for(const e of data.edges)await store.query(`MATCH (a:ReplayNode {caseId:$caseId,id:$from}),(b:ReplayNode {caseId:$caseId,id:$to}) MERGE (a)-[r:REPLAY_DEPENDS_ON]->(b) SET r.evidence=$source,r.basis='simplified functional model'`,{caseId:data.id,...e,source:data.source.url});
  for(const e of data.events)await store.query(`MATCH (n:ReplayNode {caseId:$caseId,id:$node}) MERGE (e:ReplayEvent {caseId:$caseId,id:$id}) SET e.kind=$kind,e.at=$at,e.text=$text,e.source=$source,e.timeNote=$timeNote MERGE (e)-[:DESCRIBES]->(n)`,{caseId:data.id,...e,source:data.source.url,timeNote:e.timeNote||''});
  // Write the completion marker last. Retrying an interrupted import is idempotent.
  await store.query(`MERGE (d:ReplayDataset {id:$id}) SET d.title=$title,d.source=$source,d.provenance=$provenance,d.limitation=$limitation,d.digest=$digest,d.alert=$alert,d.stages=$stages`,{id:data.id,title:data.title,source:JSON.stringify(data.source),provenance:data.provenance,limitation:data.limitation,digest,alert:data.alert,stages:JSON.stringify(data.stages)});
}

export async function investigatePublicIncident(store,stageId='alert',caseId=publicIncident.id){
  const trace=[];
  async function tool(name,params){const rows=await store.query(replayQueries[name],params);trace.push({tool:name,query:replayQueries[name],params,rows});return rows;}
  const context=(await tool('context',{caseId}))[0];
  if(!context)throw new Error('Public incident not found');
  const stages=JSON.parse(context.stages),stage=stages.find(s=>s.id===stageId);
  if(!stage)throw new Error('Unknown replay stage');
  const params={caseId,alert:context.alert,at:stage.at};
  const graph=await tool('topology',{caseId});
  const changes=await tool('changes',params);
  const events=await tool('evidence',params);
  const candidate=changes[0]||null;
  const surfaces=candidate?await tool('surfaces',{caseId,service:candidate.service}):[];
  // Diagnostics/actions only change the assessment when they concern the selected component.
  const diagnostic=candidate&&events.some(e=>e.kind==='diagnostic'&&e.service===candidate.service);
  const mitigated=candidate&&events.some(e=>e.kind==='mitigation'&&e.service===candidate.service);
  const restored=candidate&&events.some(e=>e.kind==='restoration'&&e.service===candidate.service);
  const recovery=mitigated&&events.some(e=>e.kind==='recovery'&&surfaces.some(s=>s.nodeIds.includes(e.service)));
  const status=restored?'Restored in public record':recovery?'Traffic recovered; protection not yet restored':mitigated?'Mitigation recorded; verify recovery':diagnostic?'Corroborated by diagnostic evidence':candidate?'Candidate only; verify before acting':'Insufficient evidence at this time';
  const nextStep=restored?'Review the recorded mitigation and keep the source attached to the handoff.':recovery?'Traffic recovery does not establish full restoration. Check protection status before closing the incident.':diagnostic?'Escalate to the incident commander. Evaluate an authorized mitigation and its protection tradeoff; do not execute it automatically.':candidate?'Check recent configuration changes and collect component-level diagnostics. A connected recent change alone does not establish cause.':'Collect fresh alerts and change records. Do not nominate a cause from future events.';
  const result={id:randomUUID(),caseId,title:context.title,source:JSON.parse(context.source),digest:context.digest,provenance:context.provenance,limitation:context.limitation,stage,stages,graph,candidate,events,surfaces,status,nextStep,customerCount:null,revenue:null,owner:null,mode:'Historical graph policy replay',createdAt:new Date().toISOString(),trace};
  await store.query(`CREATE (r:ReplayRun {id:$id,caseId:$caseId,createdAt:$createdAt,stage:$stage,at:$at,status:$status,report:$report})`,{id:result.id,caseId,createdAt:result.createdAt,stage:stage.id,at:stage.at,status,report:JSON.stringify(result)});
  return result;
}
