// Short factual paraphrases, not a copy of the article or private production data.
// All event timestamps are UTC. Topology is our explicitly simplified functional model.
export const publicIncident={
  id:'cloudflare-2019-07-02',version:1,title:'Cloudflare · July 2, 2019',
  source:{title:'Details of the Cloudflare outage on July 2, 2019',publisher:'Cloudflare',url:'https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/',publishedAt:'2019-07-12',section:'What happened'},
  provenance:'Manually curated factual paraphrases from a public first-party postmortem; no article text, images, customer records, or raw telemetry copied.',
  limitation:'Retrospective event-time replay, not live monitoring or a reconstruction of what responders knew. Functional dependencies are a simplified analyst model, not Cloudflare internal topology. No customer counts, revenue, or named on-call owners are available.',
  alert:'public-http',
  stages:[
    {id:'before',label:'13:40 · Before the change',at:'2019-07-02T13:40:00Z'},
    {id:'alert',label:'13:45 · First alert',at:'2019-07-02T13:45:00Z'},
    {id:'confirmed',label:'14:00 · Diagnostic evidence',at:'2019-07-02T14:00:00Z'},
    {id:'mitigated',label:'14:09 · Traffic recovers',at:'2019-07-02T14:09:00Z'},
    {id:'restored',label:'14:52 · Protection restored',at:'2019-07-02T14:52:00Z'}
  ],
  nodes:[
    {id:'public-http',name:'Public HTTP traffic',kind:'surface'},
    {id:'dashboard',name:'Dashboard / API',kind:'surface'},
    {id:'http-serving',name:'HTTP serving processes',kind:'component'},
    {id:'waf',name:'WAF rule evaluation',kind:'component'}
  ],
  edges:[
    {from:'public-http',to:'http-serving'},
    {from:'dashboard',to:'http-serving'},
    {from:'http-serving',to:'waf'}
  ],
  events:[
    {id:'rules',kind:'change',node:'waf',at:'2019-07-02T13:42:00Z',text:'An XSS detection-rule update was deployed globally.'},
    {id:'page',kind:'alert',node:'waf',at:'2019-07-02T13:45:00Z',text:'The first external WAF check paged responders.',timeNote:'Derived from the report: three minutes after 13:42.'},
    {id:'cpu',kind:'diagnostic',node:'waf',at:'2019-07-02T14:00:00Z',text:'CPU profiling and tracing implicated WAF execution.'},
    {id:'disable',kind:'mitigation',node:'waf',at:'2019-07-02T14:07:00Z',text:'Responders disabled the WAF globally.'},
    {id:'traffic',kind:'recovery',node:'http-serving',at:'2019-07-02T14:09:00Z',text:'Traffic and CPU returned to expected levels.'},
    {id:'enable',kind:'restoration',node:'waf',at:'2019-07-02T14:52:00Z',text:'The WAF was enabled globally after validation.'}
  ]
};
