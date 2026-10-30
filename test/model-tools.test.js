import test from 'node:test';
import assert from 'node:assert/strict';
import { runToolAgent } from '../src/llm.js';

const candidateCall=id=>({id,type:'function',function:{name:'candidates',arguments:JSON.stringify({service:'checkout'})}});
const customerCall=id=>({id,type:'function',function:{name:'customers',arguments:JSON.stringify({service:'payments'})}});
const graphCall=(name,service)=>({id:`${name}-${service}`,type:'function',function:{name,arguments:JSON.stringify({service})}});

test('the six-turn budget stops an unfinished investigation without a seventh provider request',async()=>{
  let requests=0,queries=0;
  const services=['checkout','payments','ledger','search','analytics','storefront'];
  const store={query:async()=>{queries++;return [];}};
  await assert.rejects(()=>runToolAgent(store,{alertedService:'checkout'},{request:async()=>{
    const service=services[requests++];
    assert.ok(service,'no seventh provider request is allowed');
    return {tool_calls:[graphCall('candidates',service)]};
  }}),/six-turn investigation budget/);
  assert.equal(requests,6);assert.equal(queries,6);
});

for(const totalBudget of [false,true]){
  test(`the ${totalBudget?'twelve-call total':'four-call per-reply'} budget rejects excess calls before their graph queries`,async()=>{
    let queries=0,requests=0;
    const batch=(tool,services)=>({tool_calls:services.map(service=>graphCall(tool,service))});
    const replies=[{tool_calls:[candidateCall('first')]},
      batch('candidates',['payments','ledger','search','analytics',...(totalBudget?[]:['storefront'])])];
    if(totalBudget)replies.push(
      batch('customers',['checkout','payments','ledger','search']),
      batch('customers',['analytics','storefront','subscriptions','fulfillment'])
    );
    const store={query:async()=>{queries++;return [];}};
    await assert.rejects(()=>runToolAgent(store,{alertedService:'checkout'},{request:async()=>{
      requests++;assert.ok(replies.length,'the rejected batch must end the provider loop');return replies.shift();
    }}),/exceeded its graph tool budget/);
    assert.equal(requests,totalBudget?4:2);
    assert.equal(queries,totalBudget?9:1,'none of the oversized batch may reach the graph');
  });
}

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
