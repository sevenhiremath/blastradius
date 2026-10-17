import test from 'node:test';
import assert from 'node:assert/strict';
import { runToolAgent } from '../src/llm.js';

const candidateCall=id=>({id,type:'function',function:{name:'candidates',arguments:JSON.stringify({service:'checkout'})}});

for(const sameTurn of [true,false]){
  test(`repeated graph tools are rejected ${sameTurn?'within one provider reply':'across provider replies'}`,async()=>{
    let queries=0;
    const store={query:async()=>{queries++;return [];}};
    const replies=sameTurn
      ? [{tool_calls:[candidateCall('first'),candidateCall('repeat')]}]
      : [{tool_calls:[candidateCall('first')]},{tool_calls:[candidateCall('repeat')]}];
    await assert.rejects(
      ()=>runToolAgent(store,{alertedService:'checkout',question:'Investigate checkout'},{request:async()=>replies.shift()}),
      /repeated a graph tool for the same service/
    );
    assert.equal(queries,1,'the repeated request must not reach the database');
  });
}
