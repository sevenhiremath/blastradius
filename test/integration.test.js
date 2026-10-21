import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connectGraph,seed,setDependency } from '../src/graph.js';
import { investigate,loadInvestigation,createTicket,resolveIncident } from '../src/agent.js';
import { scenarios } from '../src/data.js';
import { runToolAgent,validateAndRender } from '../src/llm.js';

test('real FalkorDB investigation, mutations, memory, and bounded model tools',async t=>{
  const name=`br_test_${randomUUID().replaceAll('-','')}`;
  let store=await connectGraph(name);
  try{
    await seed(store);
    for(const scenario of scenarios){
      await t.test(`${scenario.id}: expected candidate, dependency distance, and complete exposure`,async()=>{
        const r=await investigate(store,scenario.id);
        assert.equal(r.candidate?.id||null,scenario.expectedCandidate);
        if(r.candidate)assert.equal(r.candidate.hops,scenario.id==='checkout'?1:0,'distance counts service dependencies only');
        if(scenario.id==='checkout')assert.equal(r.alternatives.find(d=>d.id==='deploy-ledger-87').hops,2);
        assert.deepEqual(r.customers.map(c=>c.id).sort(),scenario.expectedCustomers.slice().sort());
        assert.equal(r.trace.length,4);
        assert.ok(r.customers.every(c=>c.path.at(-1)===r.focalService));
        assert.equal(r.rollbackSuggested,['checkout','payments','search'].includes(scenario.id));
      });
    }
    let report;
    await t.test('one new edge changes exposure and preserves exact evidence',async()=>{
      const before=await investigate(store,'checkout');
      assert.equal(before.arr,420000);
      await setDependency(store,true);
      const after=await investigate(store,'checkout');
      assert.equal(after.customers.length,4);assert.equal(after.arr,630000);
      const added=after.customers.find(c=>c.id==='cedar');
      assert.deepEqual(added.path,['cedar','analytics','payments']);
      assert.ok(added.sources.includes('catalog/services/analytics-change.yaml'));
      await setDependency(store,false);
      report=await investigate(store,'checkout');assert.equal(report.customers.length,3);
    });
    await t.test('tickets are idempotent and outcomes survive a new database connection',async()=>{
      const a=await createTicket(store,report.id);
      // Model a retry of an older ticket without relying on wall-clock delays.
      const originalCreatedAt='2026-10-15T09:00:00.000Z';
      await store.query('MATCH (t:Ticket {id:$id}) SET t.createdAt=$createdAt',{id:a.id,createdAt:originalCreatedAt});
      const b=await createTicket(store,report.id);
      assert.equal(a.id,b.id);
      assert.equal(b.createdAt,originalCreatedAt,'retry responses must preserve the stored creation time');
      const count=await store.query('MATCH (t:Ticket) RETURN count(t) AS total');assert.equal(count[0].total,1);
      await resolveIncident(store,report.id,'Synthetic test observation: payment pool reset restored authorizations.');
      await store.close();store=await connectGraph(name);
      const saved=await loadInvestigation(store,report.id);assert.equal(saved.status,'resolved');assert.match(saved.outcome,/pool reset/);
      const next=await investigate(store,'payments');assert.ok(next.memories.some(m=>m.id===report.id&&m.status==='resolved'));
    });
    await t.test('unknown incident is rejected',async()=>{await assert.rejects(()=>investigate(store,'missing'),/Unknown/);});
    const call=(name,service,id)=>({id,type:'function',function:{name,arguments:JSON.stringify({service})}});
    await t.test('model tool loop executes real graph queries with a simulated provider',async()=>{
      const replies=[{tool_calls:[call('candidates','checkout','c1')]},{tool_calls:[call('customers','payments','c2'),call('owners','payments','c3'),call('memory','payments','c4')]},{content:JSON.stringify({candidateId:'deploy-pay-142',decision:'verify_then_consider_rollback',customerIds:['atlas','northstar','orbit']})}];
      const result=await runToolAgent(store,report,{request:async()=>replies.shift()});
      assert.equal(result.trace.length,4);assert.equal(result.trace[1].rows.length,3);assert.match(result.text,/hypothesis/);
      assert.match(result.validation,/checked/);
      const invalid={candidateId:'deploy-pay-142',decision:'verify_then_consider_rollback',customerIds:['atlas']};
      assert.throws(()=>validateAndRender(JSON.stringify(invalid),result.trace,report),/does not match/);
      assert.throws(()=>validateAndRender('Roll back to invented v1.4.1 yesterday',result.trace,report),/structured selection/);
      assert.throws(()=>validateAndRender(JSON.stringify({...invalid,candidateId:'invented'}),result.trace,report),/unsupported deployment/);
      const weak=await investigate(store,'ledger');
      assert.throws(()=>validateAndRender(JSON.stringify({candidateId:'deploy-ledger-87',decision:'verify_then_consider_rollback',customerIds:['atlas','harbor','northstar','orbit']}),weak.trace,weak),/does not support/);
    });
    await t.test('unapproved model tools and invented service IDs are rejected',async()=>{
      await assert.rejects(()=>runToolAgent(store,report,{request:async()=>({tool_calls:[call('delete_database','checkout','x')]})}),/unsupported/);
      await assert.rejects(()=>runToolAgent(store,report,{request:async()=>({tool_calls:[call('candidates',"checkout' DELETE n",'x')]})}),/rejected/);
    });
  }finally{
    // Only the unique graph created by this test is removed.
    try{await store.graph.delete();}finally{await store.close();}
  }
});
