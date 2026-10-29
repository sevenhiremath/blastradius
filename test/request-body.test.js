import test from 'node:test';
import assert from 'node:assert/strict';
import { readJsonBody } from '../src/request-body.js';

async function* chunks(text,size=1){
  const bytes=Buffer.from(text);
  for(let offset=0;offset<bytes.length;offset+=size)yield bytes.subarray(offset,offset+size);
}

test('JSON requests preserve Unicode when network chunks split characters',async()=>{
  const input={question:'Payment recovered ✅ — भुगतान ठीक है — 支払いが復旧しました 🙂'};
  assert.deepEqual(await readJsonBody(chunks(JSON.stringify(input))),input);
});

test('empty request bodies keep the existing empty-object behavior',async()=>{
  assert.deepEqual(await readJsonBody(chunks('')),{});
});

test('a request at the 16 KiB limit is accepted',async()=>{
  const input={note:'a'.repeat(16384-Buffer.byteLength(JSON.stringify({note:''})))};
  const json=JSON.stringify(input);
  assert.equal(Buffer.byteLength(json),16384);
  assert.deepEqual(await readJsonBody(chunks(json,1000)),input);
});

test('request limits count UTF-8 bytes rather than JavaScript characters',async()=>{
  const json=JSON.stringify({note:'🙂'.repeat(5000)});
  assert.ok(json.length<16384);assert.ok(Buffer.byteLength(json)>16384);
  await assert.rejects(()=>readJsonBody(chunks(json,1000)),/Request too large/);
});

test('malformed JSON is rejected',async()=>{
  await assert.rejects(()=>readJsonBody(chunks('{"note":')),SyntaxError);
});

test('non-object JSON bodies are rejected before API handlers read their fields',async()=>{
  for(const json of ['null','[]','[{}]','true','false','0','42','"alert"']){
    await assert.rejects(()=>readJsonBody(chunks(json)),/JSON body must be an object/,json);
  }
});

test('invalid UTF-8 inside JSON strings is rejected instead of silently changing the text',async()=>{
  for(const invalid of [[0xff],[0xc3,0x28],[0xf0,0x9f]]){
    const body=Buffer.concat([Buffer.from('{"outcome":"'),Buffer.from(invalid),Buffer.from('"}')]);
    await assert.rejects(()=>readJsonBody((async function*(){yield body;})()),{code:'ERR_ENCODING_INVALID_ENCODED_DATA'});
  }
});

test('an intentionally encoded Unicode replacement character is preserved',async()=>{
  const input={outcome:'Verified \uFFFD appears in the source log'};
  assert.deepEqual(await readJsonBody(chunks(JSON.stringify(input))),input);
});
