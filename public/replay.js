const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const utc=at=>`${at.slice(11,16)} UTC`;
let report,loading=false;
function source(url,label='Source ↗'){return `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(label)}</a>`;}
async function load(stage='alert'){
  if(loading)return;
  loading=true;$('#stage').disabled=true;$('#advance').disabled=true;$('#download').disabled=true;
  $('#connection').textContent='Following graph evidence…';
  try{
    const response=await fetch(`/api/replay?stage=${encodeURIComponent(stage)}`);
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Replay unavailable');
    report=data;
    $('#stage').innerHTML=data.stages.map(s=>`<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');$('#stage').value=data.stage.id;
    $('#case-title').textContent=data.title;$('#provenance').textContent=data.provenance;$('#limits').textContent=data.limitation;
    $('#primary-source').href=data.source.url;$('#primary-source').textContent=`${data.source.publisher} · ${data.source.title} ↗`;
    $('#fact-count').textContent=data.events.length;$('#surface-count').textContent=data.surfaces.length||'—';
    $('#status').textContent=data.status;$('#candidate').textContent=data.candidate?data.candidate.text:'No connected change before this clock.';$('#next-step').textContent=data.nextStep;
    $('#paths').innerHTML=data.surfaces.length?data.surfaces.map(s=>`<div class="replay-path"><strong>${esc(s.name)}</strong><div class="path-chain">${s.path.map((n,i)=>`${i?'<span class="path-arrow">→</span>':''}<span class="path-node${i===s.path.length-1?' focal':''}">${esc(n)}</span>`).join('')}</div>${source(s.sources[0],'Functional dependency model · source ↗')}</div>`).join(''):'<p class="inline-note">No candidate identified. Exposure has not been assessed; this does not mean zero impact.</p>';
    $('#timeline').innerHTML=data.events.map(e=>`<li><time datetime="${esc(e.at)}">${esc(utc(e.at))}</time><div><span class="kind">${esc(e.kind)}</span><p>${esc(e.text)}</p>${e.timeNote?`<small>${esc(e.timeNote)}</small><br>`:''}${source(e.source)}</div></li>`).join('')||'<li>No recorded events before this clock. Later evidence remains excluded.</li>';
    $('#trace').innerHTML=data.trace.map(t=>`<details class="trace-item"><summary>${esc(t.tool)} <span>${t.rows.length} rows</span></summary><pre>${esc(JSON.stringify(t,null,2))}</pre></details>`).join('');
    $('#snapshot').textContent=`Packet SHA-256 ${data.digest.slice(0,16)}… · Run saved in FalkorDB`;
    $('#connection').textContent=`FalkorDB connected · ${utc(data.stage.at)}`;$('#download').disabled=false;
  }catch(e){$('#connection').textContent=`Replay unavailable: ${e.message}. Start Docker and reload.`;}
  finally{loading=false;$('#stage').disabled=!report;$('#advance').disabled=!report||report.stage.id===report.stages.at(-1).id;}
}
$('#stage').addEventListener('change',()=>load($('#stage').value));
$('#advance').addEventListener('click',()=>{const i=report.stages.findIndex(s=>s.id===report.stage.id);if(i<report.stages.length-1)load(report.stages[i+1].id);});
$('#download').addEventListener('click',()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`blastradius-${report.caseId}-${report.stage.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
load();
