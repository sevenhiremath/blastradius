import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connectGraph,seed } from '../src/graph.js';
import { investigate } from '../src/agent.js';
import { publicIncident } from '../src/replay-data.js';
import { seedPublicIncident,investigatePublicIncident,validateIncident } from '../src/replay.js';

test('public incident packet rejects broken evidence references',()=>{
  const bad=structuredClone(publicIncident);bad.events[0].node='invented';
  assert.throws(()=>validateIncident(bad),/Invalid public incident packet/);
  const duplicate=structuredClone(publicIncident);duplicate.events.push({...duplicate.events[0]});
  assert.throws(()=>validateIncident(duplicate),/Invalid public incident packet/);
});

test('public replay uses real FalkorDB, event cutoffs, and a load-bearing dependency path',async t=>{
  const graphName=`br_replay_${randomUUID().replaceAll('-','')}`;
  let store=await connectGraph(graphName);
  try{
    await seed(store);await seedPublicIncident(store);await seedPublicIncident(store);
    await t.test('repeat imports do not duplicate records or contaminate synthetic investigations',async()=>{
      assert.equal((await store.query('MATCH (n:ReplayEvent) RETURN count(n) AS total'))[0].total,6);
      const baseline=await investigate(store,'checkout');
      assert.equal(baseline.arr,420000);assert.equal(baseline.customers.length,3);
    });
    await t.test('before the change, no candidate or exposure is invented',async()=>{
      const r=await investigatePublicIncident(store,'before');
      assert.equal(r.candidate,null);assert.equal(r.events.length,0);assert.deepEqual(r.surfaces,[]);
      assert.match(r.status,/Insufficient evidence/);
      assert.equal(r.customerCount,null);assert.equal(r.revenue,null);assert.equal(r.owner,null);
    });
    await t.test('initial alert cannot retrieve later diagnostics or mitigation',async()=>{
      const r=await investigatePublicIncident(store,'alert');
      assert.equal(r.candidate.id,'rules');assert.deepEqual(r.events.map(e=>e.id),['rules','page']);
      assert.match(r.status,/Candidate only/);assert.equal(r.surfaces.length,2);
      assert.deepEqual(r.candidate.path,['Public HTTP traffic','HTTP serving processes','WAF rule evaluation']);
      assert.ok(r.surfaces.every(s=>s.sources.every(url=>url===publicIncident.source.url)));
      assert.match(r.limitation,/Retrospective/);assert.match(r.mode,/policy/);
    });
    await t.test('diagnostics, recovery, and restoration remain distinct',async()=>{
      for(const [stage,count,status] of [['confirmed',3,/Corroborated/],['mitigated',5,/not yet restored/],['restored',6,/Restored/]]){
        const r=await investigatePublicIncident(store,stage);
        assert.equal(r.events.length,count);assert.match(r.status,status);
        assert.ok(r.events.every(e=>e.at<=r.stage.at));
        assert.ok(r.trace.find(q=>q.tool==='evidence').rows.every(e=>e.at<=r.stage.at));
      }
    });
    await t.test('removing the connecting edge removes the candidate, even with diagnostic facts present',async()=>{
      await store.query("MATCH (:ReplayNode {id:'http-serving'})-[r:REPLAY_DEPENDS_ON]->(:ReplayNode {id:'waf'}) DELETE r");
      const r=await investigatePublicIncident(store,'confirmed');
      assert.equal(r.candidate,null);assert.deepEqual(r.surfaces,[]);assert.match(r.status,/Insufficient/);
    });
    await t.test('reports persist after reconnect and source changes cannot overwrite provenance',async()=>{
      const runs=await store.query('MATCH (r:ReplayRun) RETURN r.id AS id,r.report AS report ORDER BY r.id');
      await store.close();store=await connectGraph(graphName);
      assert.deepEqual(await store.query('MATCH (r:ReplayRun) RETURN r.id AS id,r.report AS report ORDER BY r.id'),runs);
      const modified=structuredClone(publicIncident);modified.events[0].text='Changed source claim';
      await assert.rejects(()=>seedPublicIncident(store,modified),/packet changed/);
      await assert.rejects(()=>investigatePublicIncident(store,'future'),/Unknown replay stage/);
      await assert.rejects(()=>investigatePublicIncident(store,'alert','missing'),/not found/);
    });
  }finally{try{await store.graph.delete();}finally{await store.close();}}
});
