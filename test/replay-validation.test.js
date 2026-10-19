import test from 'node:test';
import assert from 'node:assert/strict';
import { publicIncident } from '../src/replay-data.js';
import { validateIncident } from '../src/replay.js';

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
