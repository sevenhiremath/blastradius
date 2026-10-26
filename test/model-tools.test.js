import test from 'node:test';
import assert from 'node:assert/strict';
import { runToolAgent } from '../src/llm.js';

const candidateCall=id=>({id,type:'function',function:{name:'candidates',arguments:JSON.stringify({service:'checkout'})}});
const customerCall=id=>({id,type:'function',function:{name:'customers',arguments:JSON.stringify({service:'payments'})}});

test('provider fan-out on the forced first query is rejected before database access',async()=>{
  let queries=0;
  const store={query:async()=>{queries++;return [];}};
  await assert.rejects(
    ()=>runToolAgent(store,{alertedService:'checkout',question:'Investigate checkout'},{request:async()=>({tool_calls:[candidateCall('first'),customerCall('extra')]})}),
    /First model reply must contain exactly one graph tool call/
  );
  assert.equal(queries,0,'an invalid first batch must not execute any graph queries');
});

for(const sameTurn of [true,false]){
  test(`repeated graph tools are rejected ${sameTurn?'within one provider reply':'across provider replies'}`,async()=>{
    let queries=0;
    const store={query:async()=>{queries++;return [];}};
    const replies=sameTurn
      ? [{tool_calls:[candidateCall('first')]},{tool_calls:[customerCall('first-customer'),customerCall('repeat')]}]
      : [{tool_calls:[candidateCall('first')]},{tool_calls:[candidateCall('repeat')]}];
    await assert.rejects(
      ()=>runToolAgent(store,{alertedService:'checkout',question:'Investigate checkout'},{request:async()=>replies.shift()}),
      /repeated a graph tool for the same service/
    );
    assert.equal(queries,sameTurn?2:1,'the repeated request must not reach the database');
  });
}
