import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=`http://127.0.0.1:${process.env.PORT||4317}`;
const docker=(...args)=>execFileSync('docker',args,{stdio:'pipe',timeout:45000});
const before=await fetch(`${base}/api/history`).then(r=>r.json());
let stopped=false;
try{
  docker('compose','stop','graph');stopped=true;
  const health=await fetch(`${base}/api/health`);
  assert.equal(health.status,503,'Database outage must fail health, not serve fake data');
  const investigation=await fetch(`${base}/api/investigate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario:'checkout'})});
  assert.equal(investigation.status,503,'Investigation must fail without FalkorDB');
  docker('compose','up','-d','--wait','graph');stopped=false;
  let restored=false;
  for(let attempt=0;attempt<60;attempt++){
    if((await fetch(`${base}/api/health`)).ok){restored=true;break;}
    await new Promise(r=>setTimeout(r,250));
  }
  assert.ok(restored,'App should reconnect after graph returns');
  const after=await fetch(`${base}/api/history`).then(r=>r.json());
  assert.deepEqual(after.incidents.map(i=>i.id),before.incidents.map(i=>i.id));
  assert.deepEqual(after.tickets.map(i=>i.id),before.tickets.map(i=>i.id));
  const cors=await fetch(`${base}/api/dependency`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.invalid'},body:JSON.stringify({active:true})});
  assert.equal(cors.status,403);
  const output={generatedAt:new Date().toISOString(),databaseOutageHealthStatus:health.status,databaseOutageInvestigationStatus:investigation.status,automaticReconnect:true,incidentAndTicketHistoryRetained:true,crossOriginWriteStatus:cors.status,passed:true};
  await writeFile('docs/system-check.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
}finally{if(stopped)docker('compose','up','-d','--wait','graph');}
