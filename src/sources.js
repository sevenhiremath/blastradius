import { services,customers,deployments,dependencies } from './data.js';
// Public, synthetic source registry. References in graph edges resolve to these records.
export const sourceRecords={};
for(const s of services){
  sourceRecords[`catalog/services/${s.id}.yaml`]={type:'synthetic service catalog',id:s.id,name:s.name,owner:s.owner,team:s.team,dependsOn:dependencies.filter(([from])=>from===s.id).map(([,to])=>to)};
  sourceRecords[`catalog/teams/${s.team.toLowerCase().replaceAll(' ','-')}.yaml`]={type:'synthetic ownership record',team:s.team,onCall:s.owner};
}
for(const c of customers)sourceRecords[`contracts/${c.id}.json`]={type:'synthetic customer contract',customer:c.name,service:c.service,annualRevenueUSD:c.arr,tier:c.tier};
for(const d of deployments)sourceRecords[d.source]={type:'synthetic deployment telemetry',...d,errorDeltaUnit:'percentage points',timeReference:'minutes before 2026-10-16T10:15:00Z'};
sourceRecords['catalog/services/analytics-change.yaml']={type:'synthetic dependency change',from:'analytics',relationship:'DEPENDS_ON',to:'payments',purpose:'Reversible what-if experiment; run investigation again after toggling.'};
sourceRecords['postmortems/INC-018.md']={type:'synthetic postmortem',id:'INC-018',service:'payments',finding:'Payment connection pool exhausted',observedOutcome:'Pool saturation confirmed; rollback restored authorizations in 4 minutes.',fix:'Inspect pool saturation; if confirmed, roll back payments and monitor authorization errors.'};
