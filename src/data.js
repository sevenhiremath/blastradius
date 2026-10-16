// Entirely synthetic. Times are relative to an incident clock, never wall-clock recency.
export const incidentTime = '2026-10-16T10:15:00Z';
export const services = [
  {id:'checkout',name:'Checkout API',x:360,y:190,team:'Commerce',owner:'Maya Chen'},
  {id:'payments',name:'Payments',x:610,y:190,team:'Money movement',owner:'Arjun Rao'},
  {id:'ledger',name:'Ledger DB',x:840,y:190,team:'Data platform',owner:'Nora Ali'},
  {id:'storefront',name:'Storefront',x:150,y:95,team:'Commerce',owner:'Maya Chen'},
  {id:'subscriptions',name:'Subscriptions',x:360,y:350,team:'Growth',owner:'Leo Park'},
  {id:'fulfillment',name:'Fulfillment',x:610,y:350,team:'Operations',owner:'Zoe Reed'},
  {id:'search',name:'Search',x:150,y:350,team:'Discovery',owner:'Sam Ortiz'},
  {id:'analytics',name:'Analytics',x:840,y:350,team:'Insights',owner:'Iris Das'}
];
export const dependencies = [['storefront','checkout'],['checkout','payments'],['payments','ledger'],['subscriptions','payments'],['fulfillment','ledger']];
export const customers = [
  {id:'northstar',name:'Northstar Retail',service:'storefront',arr:180000,tier:'Enterprise',x:145,y:24},
  {id:'atlas',name:'Atlas Market',service:'checkout',arr:96000,tier:'Growth',x:360,y:24},
  {id:'orbit',name:'Orbit Labs',service:'subscriptions',arr:144000,tier:'Enterprise',x:360,y:475},
  {id:'harbor',name:'Harbor Supply',service:'fulfillment',arr:72000,tier:'Growth',x:610,y:475},
  {id:'lumen',name:'Lumen Studio',service:'search',arr:48000,tier:'Starter',x:145,y:475},
  {id:'cedar',name:'Cedar Health',service:'analytics',arr:210000,tier:'Enterprise',x:840,y:475}
];
export const deployments = [
  {id:'deploy-pay-142',service:'payments',name:'payments v1.4.2',minutesAgo:8,errorDelta:28,summary:'Connection-pool limit reduced from 40 to 4',source:'deployments/payments-v1.4.2.json'},
  {id:'deploy-ledger-87',service:'ledger',name:'ledger v8.7.0',minutesAgo:34,errorDelta:2,summary:'Read replica configuration changed',source:'deployments/ledger-v8.7.0.json'},
  {id:'deploy-check-231',service:'checkout',name:'checkout v2.3.1',minutesAgo:150,errorDelta:0,summary:'Copy update on receipt response',source:'deployments/checkout-v2.3.1.json'},
  {id:'deploy-search-50',service:'search',name:'search v5.0.0',minutesAgo:6,errorDelta:19,summary:'Search index alias switched',source:'deployments/search-v5.0.0.json'},
  {id:'deploy-analytics-21',service:'analytics',name:'analytics v2.1.0',minutesAgo:900,errorDelta:0,summary:'Dashboard labels refreshed',source:'deployments/analytics-v2.1.0.json'}
];
export const scenarios = [
  {id:'checkout',service:'checkout',title:'Checkout error rate above 25%',severity:'SEV 1',question:'Checkout is failing. What changed, who is affected, and what should we do?',expectedCandidate:'deploy-pay-142',expectedCustomers:['atlas','northstar','orbit']},
  {id:'payments',service:'payments',title:'Payment authorization timeouts',severity:'SEV 1',question:'Payments are timing out. Find a likely cause and the full customer impact.',expectedCandidate:'deploy-pay-142',expectedCustomers:['atlas','northstar','orbit']},
  {id:'ledger',service:'ledger',title:'Ledger write latency elevated',severity:'SEV 2',question:'Ledger writes are slow. Which connected services and customers are exposed?',expectedCandidate:'deploy-ledger-87',expectedCustomers:['atlas','harbor','northstar','orbit']},
  {id:'search',service:'search',title:'Search results unavailable',severity:'SEV 2',question:'Search is unavailable. Which change is relevant, and who owns the response?',expectedCandidate:'deploy-search-50',expectedCustomers:['lumen']},
  {id:'analytics',service:'analytics',title:'Analytics freshness delayed',severity:'SEV 3',question:'Analytics is stale. Is there enough evidence to recommend a rollback?',expectedCandidate:null,expectedCustomers:['cedar']}
];
