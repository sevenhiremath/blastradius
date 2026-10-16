const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const shortMoney=n=>`$${(n/1000).toFixed(0)}k`;
const sourceLink=ref=>`<button class="source-link source-id" data-source="${esc(ref)}">${esc(ref)}</button>`;
const modelHtml=n=>`<p class="inline-note">${esc(n.model)} · ${n.trace.length} graph tool calls · ${esc(n.validation)}</p><div class="model-text">${esc(n.text)}</div>${n.trace.map(t=>`<details class="trace-item"><summary>${esc(t.tool)}</summary><pre>${esc(JSON.stringify(t,null,2))}</pre></details>`).join('')}`;
let state={graph:null,scenarios:[],report:null,tab:'evidence',selected:null,history:{incidents:[],tickets:[]},busy:false,modelEnabled:false,stale:false,staleReason:''};
const staleMessage=()=>`${state.staleReason||'Context changed'}. Run again to refresh this investigation.`;
let toastTimer;
function toast(message,error=false){$('#toast').textContent=message;$('#toast').className=`visible${error?' error':''}`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').className='',6500);}
async function api(url,data){const response=await fetch(url,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});const json=await response.json();if(!response.ok)throw new Error(json.error||'Request failed');return json;}
function busy(value){state.busy=value;document.body.classList.toggle('busy',value);$('#run').disabled=value;$('#dependency').disabled=value;$('#scenario').disabled=value;$('#run').innerHTML=value?'<span>◌</span> Following connections…':'<span>▶</span> Run investigation';}
function name(id){return state.graph?.nodes.find(n=>n.id===id)?.name||id;}
function pathHtml(path){return path.map(id=>esc(name(id))).join('<span class="path-arrow">→</span>');}
function selectTab(tab){state.tab=tab;document.querySelectorAll('[data-tab]').forEach(el=>el.setAttribute('aria-selected',String(el.dataset.tab===tab)));$('#detail-content').setAttribute('aria-labelledby',`tab-${tab}`);renderDetails();}

function renderGraph(){
  const {nodes,edges}=state.graph;
  const report=state.report;
  const paths=state.stale?[]:(report?.customers||[]).map(c=>c.path);
  const selected=report?.customers.find(c=>c.id===state.selected)?.path||[];
  const involved=new Set(paths.flat());
  const edgeOn=(a,b,list)=>list.some(path=>path.some((v,i)=>v===a&&path[i+1]===b));
  const coordinates=new Map(nodes.map(n=>[n.id,{x:n.x,y:n.y}]));
  const arrow=(id,color)=>`<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"/></marker>`;
  let svg=`<defs>${arrow('arrow','#bbc5ae')}${arrow('arrow-hot','#e49266')}${arrow('arrow-selected','#d84a25')}</defs>`;
  for(const e of edges){
    const a=coordinates.get(e.source),b=coordinates.get(e.target);if(!a||!b)continue;
    const hot=edgeOn(e.source,e.target,paths),sel=edgeOn(e.source,e.target,[selected]);
    let d;
    if(Math.abs(a.x-b.x)<30){const sign=Math.sign(b.y-a.y);d=`M ${a.x} ${a.y+sign*23} L ${b.x} ${b.y-sign*25}`;}
    else if(Math.abs(a.y-b.y)<30){const sign=Math.sign(b.x-a.x);d=`M ${a.x+sign*75} ${a.y} L ${b.x-sign*78} ${b.y}`;}
    else{const sign=Math.sign(b.y-a.y),sx=a.x,sy=a.y+sign*23,tx=b.x,ty=b.y-sign*25;d=`M ${sx} ${sy} C ${sx} ${(sy+ty)/2}, ${tx} ${(sy+ty)/2}, ${tx} ${ty}`;}
    svg+=`<path class="edge${hot?' affected':''}${sel?' selected':''}" d="${d}" marker-end="url(#${sel?'arrow-selected':hot?'arrow-hot':'arrow'})"><title>${esc(e.source)} ${esc(e.kind)} ${esc(e.target)} · ${esc(e.evidence)}</title></path>`;
  }
  for(const n of nodes){
    const hot=involved.has(n.id),focal=!state.stale&&report?.focalService===n.id;
    const isCustomer=n.kind==='Customer';
    svg+=`<g class="node${isCustomer?' customer':''}${hot?' affected':''}${focal?' focal':''}${selected.includes(n.id)?' selected':''}" transform="translate(${n.x-75},${n.y-23})"><title>${esc(n.kind)}: ${esc(n.name)}</title><rect width="150" height="47" rx="7"/><text x="12" y="22" class="node-icon">${isCustomer?'▧':'◇'}</text><text x="34" y="21">${esc(n.name)}</text><text class="sub" x="34" y="35">${focal?'LIKELY FAILURE POINT':isCustomer?'CUSTOMER':'SERVICE'}</text></g>`;
  }
  $('#graph').innerHTML=svg;
  $('#graph-count').textContent=`${nodes.length} nodes · ${edges.length} edges`;
  $('#graph-footer').textContent=state.stale?staleMessage():report?`${report.customers.length} ${report.customers.length===1?'customer':'customers'} reached through live graph traversals.`:'Your context lives in FalkorDB.';
}
function renderReport(){
  const r=state.report;
  $('#metric-customers').textContent=r.customers.length;
  $('#metric-arr').textContent=shortMoney(r.arr);
  $('#metric-service').textContent=name(r.focalService);
  $('#metric-tools').textContent=r.trace.length;
  $('#customer-note').textContent=state.stale?'Saved snapshot — run again':'Connected to the failure point';
  $('#service-note').textContent=r.confidence;
  $('#tool-note').textContent=`${r.elapsedMs} ms · queries + policy`;
  $('#evidence-count').textContent=r.customers.length;
  $('#assessment-body').innerHTML=`${state.stale?`<div class="stale-notice">${esc(staleMessage())}</div>`:''}
    <span class="confidence${r.rollbackSuggested?'':' weak'}">${esc(r.confidence)}</span><h3 class="finding-title">${r.candidate?esc(r.candidate.name):'Pause. Gather evidence.'}</h3>
    <p class="finding-summary">${esc(r.summary)}</p>${r.candidate?`<div>↳ ${sourceLink(r.candidate.source)}</div>`:''}<div class="assessment-divider"></div>
    <div class="section-label">RESPONSE OWNER</div>${r.owners.map(o=>`<div class="owner-row"><span class="avatar">${esc(o.name.split(' ').map(n=>n[0]).join(''))}</span><div><strong>${esc(o.name)}</strong><small>${esc(o.team)}</small></div></div>`).join('')}
    <div class="section-label">RECOMMENDED NEXT STEP</div><p class="recommendation">${esc(r.recommendation)}</p><div class="assessment-actions"><button class="primary" id="create-ticket" ${state.stale?'disabled':''}>＋ Create local ticket</button><button class="secondary" id="export">↓ Export</button></div>
    <p class="inline-note">Recommendations require verification. No production systems are changed.</p>`;
  $('#create-ticket').addEventListener('click',async()=>{
    const btn=$('#create-ticket');btn.disabled=true;
    try{const t=await api('/api/tickets',{id:r.id});await refreshHistory();toast(`Local ticket ${t.id} created in FalkorDB.`);selectTab('response');}catch(e){toast(e.message,true);}finally{btn.disabled=state.stale;}
  });
  $('#export').addEventListener('click',()=>{const data=JSON.stringify({...r,graphStateChanged:state.stale},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`blastradius-${r.scenario}-${r.id.slice(0,8)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Investigation exported with queries and evidence.');});
  renderGraph();renderDetails();
}
function renderDetails(){
  const root=$('#detail-content'),r=state.report;
  if(state.tab==='evidence'){
    if(!r){root.innerHTML='<div class="empty-row">Run an investigation to see the relationships behind the answer.</div>';return;}
    root.innerHTML=`${state.stale?'<div class="stale-notice">These paths belong to the previous graph state. Run again for fresh evidence.</div>':''}<div class="evidence-table"><table><thead><tr><th>CUSTOMER</th><th>DEPENDENCY PATH TO FAILURE POINT</th><th>ANNUAL REVENUE</th><th>SOURCE</th></tr></thead><tbody>${r.customers.map(c=>`<tr><td><div class="customer-cell"><span class="customer-initial">${esc(c.name.slice(0,1))}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.tier)}</small></div></div></td><td><button class="path-button" data-customer="${esc(c.id)}" aria-label="Trace ${esc(c.name)}">${pathHtml(c.path)}</button></td><td>${money(c.arr)}</td><td>${c.sources.map(sourceLink).join('<br>')}</td></tr>`).join('')}</tbody></table></div>`;
    root.querySelectorAll('[data-customer]').forEach(btn=>btn.addEventListener('click',()=>{state.selected=state.selected===btn.dataset.customer?null:btn.dataset.customer;renderGraph();toast(state.selected?`Tracing ${name(state.selected)} → ${name(r.focalService)}`:'Showing all exposed paths');}));
  }
  if(state.tab==='queries'){
    const trace=r?.trace||Object.entries(state.queries).filter(([key])=>['candidates','customers','owners','memory'].includes(key)).map(([tool,query])=>({tool,query,purpose:'Query catalog. Run an investigation to see live parameters and results.'}));
    root.innerHTML=trace.map(t=>`<details class="trace-item"><summary>${esc(t.tool)} <span>${t.rows?`${t.rows.length} rows · ${t.ms} ms`:'FalkorDB · Cypher'}</span></summary><p>${esc(t.purpose)}</p><pre>${esc(t.query)}</pre>${t.params?`<p>Parameters</p><pre>${esc(JSON.stringify(t.params,null,2))}</pre><p>Actual database result</p><pre>${esc(JSON.stringify(t.rows,null,2))}</pre>`:''}</details>`).join('');
  }
  if(state.tab==='memory'){
    const recalled=r?.memories||[];
    root.innerHTML=`<div class="memory-list">${recalled.length?'<div class="inline-note">RECALLED FOR THIS INVESTIGATION</div>':''}${recalled.map(m=>`<article class="memory-card"><div class="memory-meta">${esc(m.id)} · ${esc(m.status||'recorded')} · ${esc(m.createdAt)}</div><h3>${esc(m.title)}</h3><p>${esc(m.outcome||'No outcome recorded yet.')}</p><span class="source-id">${esc(m.source)}</span></article>`).join('')}
    <div class="inline-note">SAVED INVESTIGATIONS · ${state.history.incidents.length} MOST RECENT · PERSISTED IN FALKORDB</div>${state.history.incidents.length?state.history.incidents.map(i=>`<article class="memory-card"><div class="memory-meta">${esc(i.service)} · ${esc(i.status)} · ${esc(new Date(i.createdAt).toLocaleString())}</div><h3>${esc(i.title)}</h3>${i.outcome?`<p>${esc(i.outcome)}</p>`:''}<button class="secondary" data-open="${esc(i.id)}">Open saved investigation ↗</button></article>`).join(''):'<p class="inline-note">No investigations saved yet. Run one, then reload to verify memory persists.</p>'}</div>`;
    root.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',async()=>{try{state.report=await api(`/api/investigations/${btn.dataset.open}`);state.stale=true;state.staleReason='Saved report';state.selected=null;$('#scenario').value=state.report.scenario;updateScenario();renderReport();toast('Saved report opened. Run again to compare with the current graph.');}catch(e){toast(e.message,true);}}));
  }
  if(state.tab==='response'){
    root.innerHTML=`<div class="response-area">${r?`<h3>Response plan</h3>${r.actions.map((a,i)=>`<div class="action-row"><span class="action-number">0${i+1}</span><span>${esc(a.text)}</span></div>`).join('')}
      <p class="inline-note">Local coordination only. Rollback and customer notifications are recommendations, not executed actions.</p>
      <label for="outcome">Record the observed outcome so the next investigation can learn from it</label><textarea id="outcome" maxlength="2000" placeholder="What did you verify? What action worked? Record only what you observed.">${esc(r.outcome||'')}</textarea><button id="resolve" class="secondary" ${state.stale?'disabled':''}>Save outcome to memory</button>
      <div class="assessment-divider"></div><h3>AI tool agent</h3><p class="inline-note">${state.modelEnabled?'The model selects graph tools and records. Its final selection is validated; the report uses facts from retrieved rows.':'The graph policy agent is active. Configure LLM_API_KEY in .env for optional AI tool calling and analysis.'}</p><button class="secondary" id="narrate" ${state.modelEnabled&&!state.stale?'':'disabled'}>✳ Run AI tool agent</button><div id="model-output">${r.aiAnalysis?modelHtml(r.aiAnalysis):''}</div><div class="assessment-divider"></div>`:'<p class="inline-note">Run an investigation to create a response plan.</p>'}
      <h3>Local incident tickets</h3>${state.history.tickets.length?state.history.tickets.map(t=>`<div class="ticket-line"><span><strong>${esc(t.id)}</strong> · ${esc(t.title)}</span><span>${esc(t.status)}</span></div>`).join(''):'<p class="inline-note">No tickets yet. Create one from the agent assessment.</p>'}</div>`;
    if(r){
      $('#resolve').addEventListener('click',async()=>{const outcome=$('#outcome').value.trim();if(!outcome){toast('Enter an observed outcome first.',true);return;}try{await api('/api/resolve',{id:r.id,outcome});state.report.outcome=outcome;await refreshHistory();renderDetails();toast('Outcome saved. Future investigations can recall it.');}catch(e){toast(e.message,true);}});
      $('#narrate').addEventListener('click',async()=>{const btn=$('#narrate');btn.disabled=true;btn.textContent='Calling graph tools…';try{const n=await api('/api/ai-agent',{id:r.id});state.report.aiAnalysis=n;$('#model-output').innerHTML=modelHtml(n);}catch(e){toast(e.message,true);}finally{btn.disabled=false;btn.textContent='✳ Run AI tool agent';}});
    }
  }
}
async function refreshHistory(){state.history=await api('/api/history');}
function updateScenario(){const s=state.scenarios.find(s=>s.id===$('#scenario').value);$('#severity').textContent=s.severity;}
$('#scenario').addEventListener('change',()=>{updateScenario();if(state.report){state.stale=true;state.staleReason='Alert changed';renderReport();}});
$('#run').addEventListener('click',async()=>{
  busy(true);
  try{state.report=await api('/api/investigate',{scenario:$('#scenario').value});state.selected=null;state.stale=false;await refreshHistory();renderReport();toast(`Investigation complete. ${state.report.customers.length} ${state.report.customers.length===1?'customer':'customers'} exposed · ${state.report.trace.length} graph tools called.`);}catch(e){toast(e.message,true);}finally{busy(false);}
});
$('#dependency').addEventListener('click',async()=>{
  if(state.busy)return;
  busy(true);
  try{state.graph=await api('/api/dependency',{active:!state.graph.mutationActive});$('#dependency').setAttribute('aria-checked',String(state.graph.mutationActive));$('#dependency-label').textContent=state.graph.mutationActive?'Dependency added':'Add dependency';if(state.report){state.stale=true;state.staleReason='Graph changed';renderReport();}else renderGraph();toast(state.graph.mutationActive?'Added Analytics → Payments. Run again to discover the changed customer exposure.':'Removed Analytics → Payments. Run again to refresh exposure.');}catch(e){toast(e.message,true);}finally{busy(false);}
});
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>selectTab(btn.dataset.tab)));
document.addEventListener('click',async e=>{const button=e.target.closest('[data-source]');if(!button)return;try{const data=await api(`/api/source?ref=${encodeURIComponent(button.dataset.source)}`);$('#source-title').textContent=data.ref;$('#source-content').textContent=JSON.stringify(data.record,null,2);$('#source-dialog').showModal();}catch(error){toast(error.message,true);}});
$('#close-source').addEventListener('click',()=>$('#source-dialog').close());
$('#nav-investigate').addEventListener('click',()=>{$('#run').scrollIntoView({behavior:'smooth',block:'center'});selectTab('evidence');});
$('#nav-memory').addEventListener('click',async()=>{try{await refreshHistory();selectTab('memory');$('.detail-panel').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){toast(e.message,true);}});
$('#nav-model').addEventListener('click',()=>{selectTab('queries');$('.detail-panel').scrollIntoView({behavior:'smooth',block:'start'});});
async function boot(){try{const data=await api('/api/bootstrap');Object.assign(state,data);$('#scenario').innerHTML=data.scenarios.map(s=>`<option value="${esc(s.id)}">${esc(s.title)}</option>`).join('');updateScenario();$('#dependency').setAttribute('aria-checked',String(data.graph.mutationActive));$('#dependency-label').textContent=data.graph.mutationActive?'Dependency added':'Add dependency';renderGraph();await refreshHistory();$('#connection').innerHTML='<span class="live-dot"></span> FalkorDB connected';$('#run').disabled=false;}catch(e){$('#connection').textContent='Database unavailable';toast(`Cannot connect: ${e.message}. Start FalkorDB and reload.`,true);}}
boot();
