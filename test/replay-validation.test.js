import test from 'node:test';
import assert from 'node:assert/strict';
import { publicIncident } from '../src/replay-data.js';
import { validateIncident,seedPublicIncident } from '../src/replay.js';

for(const field of ['case','nodes','events','stages']){
  test(`replay ${field} identifiers must be strings rather than coercible values`,()=>{
    for(const id of [undefined,null,7,true]){
      const packet=structuredClone(publicIncident);
      if(field==='case')packet.id=id;
      else if(field==='nodes')packet.nodes.push({id,name:'Extra component',kind:'component'});
      else packet[field][0].id=id;
      assert.throws(()=>validateIncident(packet),/Invalid public incident packet/,`${field}: ${String(id)}`);
    }
  });
}

test('a missing case identifier is rejected before any database query',async()=>{
  const packet=structuredClone(publicIncident);
  delete packet.id;
  let queries=0;
  const store={query:async()=>{queries++;throw new Error('Database must not be called');}};
  await assert.rejects(()=>seedPublicIncident(store,packet),/Invalid public incident packet/);
  assert.equal(queries,0);
});

for(const field of ['events','stages']){
  test(`replay ${field} reject dates that JavaScript would silently normalize`,()=>{
    for(const at of ['2019-02-29T13:42:00Z','2019-04-31T13:42:00Z','2019-07-02T24:00:00Z']){
      const packet=structuredClone(publicIncident);
      packet[field][0].at=at;
      assert.throws(()=>validateIncident(packet),/Invalid public incident packet/,at);
    }
  });
}

test('replay date validation accepts a valid leap day',()=>{
  const packet=structuredClone(publicIncident);
  for(const row of [...packet.events,...packet.stages])row.at=row.at.replace('2019-07-02','2020-02-29');
  assert.equal(validateIncident(packet),packet);
});
