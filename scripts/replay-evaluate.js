import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { connectGraph } from '../src/graph.js';
import { seedPublicIncident,investigatePublicIncident } from '../src/replay.js';
const store=await connectGraph(`br_replay_eval_${randomUUID().replaceAll('-','')}`);
try{
  await seedPublicIncident(store);
  const stages=[];
  for(const stage of ['before','alert','confirmed','mitigated','restored']){
    const r=await investigatePublicIncident(store,stage);
    stages.push({stage,at:r.stage.at,status:r.status,candidate:r.candidate?.id||null,eventIds:r.events.map(e=>e.id),surfaces:r.surfaces.map(s=>s.id),futureEvidenceExcluded:r.events.every(e=>e.at<=r.stage.at),unknownCustomerCount:r.customerCount===null,unknownRevenue:r.revenue===null});
  }
  await store.query("MATCH (:ReplayNode {id:'http-serving'})-[r:REPLAY_DEPENDS_ON]->(:ReplayNode {id:'waf'}) DELETE r");
  const disconnected=await investigatePublicIncident(store,'confirmed');
  const output={generatedAt:new Date().toISOString(),dataset:'cloudflare-2019-07-02',mode:'historical graph policy; no model call',scope:'One manually curated public postmortem, five event-time checkpoints; not a blind diagnostic benchmark or production telemetry evaluation',stages,dependencyRemovalChangesAnswer:disconnected.candidate===null,passed:stages.every(s=>s.futureEvidenceExcluded&&s.unknownCustomerCount&&s.unknownRevenue)&&stages[0].candidate===null&&stages[1].candidate==='rules'&&stages[3].status.includes('not yet restored')&&disconnected.candidate===null};
  await writeFile('docs/public-replay-evaluation.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
  if(!output.passed)process.exitCode=1;
}finally{try{await store.graph.delete();}finally{await store.close();}}
