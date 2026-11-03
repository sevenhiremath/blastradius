import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,dirname,basename,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify,parseEnv } from 'node:util';

test('provider switching updates active settings after commented examples and preserves the key',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'blastradius-provider-'));
  const envFile=join(directory,'.env');
  const script=fileURLToPath(new URL('../scripts/configure-provider.js',import.meta.url));
  const key='test-only-placeholder-no-provider-access';
  try{
    await writeFile(envFile,`# LLM_BASE_URL=https://example.com/comment\n# LLM_MODEL=comment-model\nLLM_API_KEY=${key}\nPORT=9876\nLLM_BASE_URL=https://example.com/active\nLLM_MODEL=active-model\n`);
    for(const [provider,url,model] of [
      ['groq','https://api.groq.com/openai/v1','qwen/qwen3.8-27b'],
      ['openai','https://api.openai.com/v1','gpt-4.1-mini']
    ]){
      const {stdout,stderr}=await promisify(execFile)(process.execPath,[script,provider],{cwd:directory});
      const settings=parseEnv(await readFile(envFile,'utf8'));
      assert.equal(settings.LLM_BASE_URL,url);
      assert.equal(settings.LLM_MODEL,model);
      assert.equal(settings.LLM_API_KEY,key);
      assert.equal(settings.PORT,'9876');
      assert.ok(!`${stdout}${stderr}`.includes(key),'setup must not print the key');
    }
  }finally{
    assert.equal(dirname(resolve(directory)),resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('blastradius-provider-'));
    await rm(directory,{recursive:true,force:true});
  }
});
