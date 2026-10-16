import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { connectGraph,seed,topology,setDependency } from './graph.js';
import { scenarios } from './data.js';
import { queries } from './queries.js';
import { investigate,loadInvestigation,createTicket,resolveIncident } from './agent.js';
import { runToolAgent } from './llm.js';
import { sourceRecords } from './sources.js';

const store=await connectGraph();
await seed(store);
const publicDir=fileURLToPath(new URL('../public/',import.meta.url));
const port=Number(process.env.PORT||4317);
const host=process.env.HOST||'127.0.0.1';
let mutation=Promise.resolve();
// Serialize graph edits/investigations so a mutation cannot split one report across graph states.
const serial=fn=>{const p=mutation.then(fn);mutation=p.catch(()=>{});return p;};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
async function body(req) {
  let text='';
  for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>16384)throw new Error('Request too large');}
  return text?JSON.parse(text):{};
}
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(req.method==='POST') {
      // This local single-user app rejects cross-origin mutations, including browser form posts.
      if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return send(res,403,{error:'Cross-origin write rejected'});
      if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'JSON required'});
      const input=await body(req);
      if(url.pathname==='/api/investigate') {
        if(typeof input.question!=='undefined'&&(typeof input.question!=='string'||input.question.length>2000))return send(res,400,{error:'Question must be text under 2000 characters'});
        return send(res,200,await serial(()=>investigate(store,input.scenario,input.question)));
      }
      if(url.pathname==='/api/dependency') {
        if(typeof input.active!=='boolean')return send(res,400,{error:'active must be a boolean'});
        return send(res,200,await serial(()=>setDependency(store,input.active)));
      }
      if(url.pathname==='/api/tickets')return send(res,200,await serial(()=>createTicket(store,input.id)));
      if(url.pathname==='/api/resolve') {
        if(typeof input.outcome!=='string'||input.outcome.length>2000)return send(res,400,{error:'Outcome must be text under 2000 characters'});
        return send(res,200,await serial(()=>resolveIncident(store,input.id,input.outcome)));
      }
      if(url.pathname==='/api/ai-agent') {
        return send(res,200,await serial(async()=>{
          const report=await loadInvestigation(store,input.id);
          if(!report)throw new Error('Investigation not found');
          const analysis=await runToolAgent(store,report);
          await store.query(`MATCH (i:Incident {id:$id}) SET i.aiAnalysis=$analysis`,{id:input.id,analysis:JSON.stringify(analysis)});
          return analysis;
        }));
      }
      return send(res,404,{error:'Unknown action'});
    }
    if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
    if(url.pathname==='/api/health') {
      await store.query('RETURN 1 AS ok');
      return send(res,200,{database:'FalkorDB',graph:store.name,modelEnabled:Boolean(process.env.LLM_API_KEY),mode:'Graph policy agent'});
    }
    if(url.pathname==='/api/bootstrap')return send(res,200,{scenarios:scenarios.map(({expectedCandidate,expectedCustomers,...s})=>s),graph:await topology(store),queries,modelEnabled:Boolean(process.env.LLM_API_KEY)});
    if(url.pathname==='/api/history')return send(res,200,{incidents:await store.query(queries.history),tickets:await store.query(queries.tickets)});
    if(url.pathname==='/api/source') {
      const ref=url.searchParams.get('ref');
      const record=Object.hasOwn(sourceRecords,ref)?sourceRecords[ref]:null;
      return send(res,record?200:404,record?{ref,record}:{error:'Unknown source reference'});
    }
    if(url.pathname.startsWith('/api/investigations/')) {
      const report=await loadInvestigation(store,url.pathname.split('/').at(-1));
      return send(res,report?200:404,report||{error:'Not found'});
    }
    const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/favicon.svg':'favicon.svg'};
    const file=files[url.pathname];
    if(!file)return send(res,404,{error:'Not found'});
    const data=await readFile(path.join(publicDir,file));
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
    res.writeHead(200,{'Content-Type':`${types[path.extname(file)]}; charset=utf-8`,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"});res.end(data);
  }catch(error){console.error(error.message);const unavailable=/closed|socket|connect|offline/i.test(error.message);send(res,unavailable?503:400,{error:unavailable?'FalkorDB is unavailable. Start the database and try again.':error.message});}
});
server.listen(port,host,()=>console.log(`BlastRadius ready at http://localhost:${port} — connected to FalkorDB (${store.name})`));
async function stop(){server.close();await store.close();process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
