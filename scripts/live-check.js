// Uses only the local app; the configured provider key stays in the server process.
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=`http://127.0.0.1:${process.env.PORT||4317}`;
const mode=process.argv[2]||'baseline';
if(!['baseline','changed','analytics'].includes(mode))throw new Error('Choose baseline, changed, or analytics');
const scenario=mode==='analytics'?'analytics':'checkout';
const expected=mode==='changed'?['atlas','cedar','northstar','orbit']:mode==='analytics'?['cedar']:['atlas','northstar','orbit'];
async function post(route,data){const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(190000)});const v=await r.json();if(!r.ok)throw new Error(v.error);return v;}
const bootstrap=await fetch(`${base}/api/bootstrap`).then(r=>r.json());
if(!bootstrap.modelEnabled)throw new Error('Configure a provider key first');
const changed=bootstrap.graph.mutationActive;
const target=mode==='changed';
try{
  if(changed!==target)await post('/api/dependency',{active:target});
  const report=await post('/api/investigate',{scenario});
  const analysis=await post('/api/ai-agent',{id:report.id});
  assert.equal(analysis.trace[0]?.tool,'candidates');
  const exposure=analysis.trace.find(t=>t.tool==='customers'&&t.params.service===(scenario==='analytics'?'analytics':'payments'));
  assert.ok(exposure,'Model must query customer exposure for the supported failure point');
  assert.deepEqual([...new Set(exposure.rows.map(c=>c.id))].sort(),expected);
  assert.deepEqual([...analysis.selection.customerIds].sort(),expected);
  assert.equal(analysis.selection.candidateId,scenario==='analytics'?null:'deploy-pay-142');
  assert.equal(analysis.selection.decision,scenario==='analytics'?'gather_more_evidence':'verify_then_consider_rollback');
  assert.ok(analysis.text.trim().length>30);
  const output={generatedAt:new Date().toISOString(),investigationId:report.id,provider:'Groq',model:analysis.model,mode,liveProvider:true,passed:true,scope:`One synthetic ${mode} investigation; not a model-accuracy benchmark`,...analysis};
  await writeFile(mode==='baseline'?'docs/live-ai-check.json':`docs/live-ai-${mode}-check.json`,JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({passed:true,investigationId:report.id,model:analysis.model,tools:analysis.trace.map(t=>t.tool),text:analysis.text},null,2));
}finally{if(changed!==target)await post('/api/dependency',{active:changed});}
