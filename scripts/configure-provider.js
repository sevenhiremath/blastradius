import {readFile,writeFile} from 'node:fs/promises';
const profiles={
  groq:{LLM_BASE_URL:'https://api.groq.com/openai/v1',LLM_MODEL:'qwen/qwen3.8-27b'},
  openai:{LLM_BASE_URL:'https://api.openai.com/v1',LLM_MODEL:'gpt-4.1-mini'}
};
const provider=process.argv[2];
if(!Object.hasOwn(profiles,provider))throw new Error('Choose groq or openai');
let content;try{content=await readFile('.env','utf8');}catch{content=await readFile('.env.example','utf8');}
for(const [key,value]of Object.entries(profiles[provider])){
  const re=new RegExp(`^\\s*(?:#\\s*)?${key}=.*$`,'m');
  content=re.test(content)?content.replace(re,`${key}=${value}`):`${content.trimEnd()}\n${key}=${value}\n`;
}
await writeFile('.env',content);
console.log(`Configured ${provider} endpoint and model. Existing key preserved; no key printed. Recreate the app container to load these settings.`);
