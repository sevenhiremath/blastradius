import { connectGraph,seed,setDependency } from '../src/graph.js';
import { investigate } from '../src/agent.js';
import { scenarios } from '../src/data.js';
import { randomUUID } from 'node:crypto';
import { mkdir,writeFile } from 'node:fs/promises';
const graphName=`br_eval_${randomUUID().replaceAll('-','')}`;
const store=await connectGraph(graphName);
try{
  await seed(store);
  const results=[];
  for(const s of scenarios){
    const r=await investigate(store,s.id);
    results.push({scenario:s.id,expectedCandidate:s.expectedCandidate,actualCandidate:r.candidate?.id||null,candidateCorrect:(r.candidate?.id||null)===s.expectedCandidate,expectedCustomers:s.expectedCustomers,actualCustomers:r.customers.map(c=>c.id).sort(),exposureCorrect:JSON.stringify(r.customers.map(c=>c.id).sort())===JSON.stringify([...s.expectedCustomers].sort()),rollbackSuggested:r.rollbackSuggested,elapsedMs:r.elapsedMs});
  }
  await setDependency(store,true);
  const changed=await investigate(store,'checkout');
  const mutation={newEdge:'analytics -> payments',customers:changed.customers.map(c=>c.id),arr:changed.arr,passed:changed.customers.length===4&&changed.arr===630000};
  const output={generatedAt:new Date().toISOString(),database:'FalkorDB',mode:'deterministic graph policy; no live LLM evaluation',dataset:'synthetic-v1; five fixed scenarios, not a generalization benchmark',results,mutation,passed:results.every(r=>r.candidateCorrect&&r.exposureCorrect)&&mutation.passed};
  await mkdir('docs',{recursive:true});await writeFile('docs/evaluation.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
  if(!output.passed)process.exitCode=1;
}finally{try{await store.graph.delete();}finally{await store.close();}}
