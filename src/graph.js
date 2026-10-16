import { FalkorDB } from 'falkordb';
import { services, dependencies, customers, deployments, incidentTime } from './data.js';
import { queries } from './queries.js';

export async function connectGraph(name = process.env.FALKORDB_GRAPH || 'blastradius') {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('Invalid graph name');
  const db = await FalkorDB.connect({
    socket: {host:process.env.FALKORDB_HOST || '127.0.0.1', port:Number(process.env.FALKORDB_PORT || 6388), connectTimeout:4000, reconnectStrategy:retries=>Math.min(250*(retries+1),3000)},
    disableOfflineQueue:true,
    ...(process.env.FALKORDB_PASSWORD ? {password:process.env.FALKORDB_PASSWORD} : {})
  });
  db.on('error',()=>console.warn('FalkorDB connection interrupted; waiting to reconnect.'));
  const graph = db.selectGraph(name);
  const query = async (cypher, params={}) => {
    const result = await graph.query(cypher, {params});
    return result.data || [];
  };
  return {db, graph, query, name, close:()=>db.close()};
}

export async function seed(store) {
  const existing = await store.query('MATCH (n:Dataset {id:$id}) RETURN n.id AS id',{id:'synthetic-v1'});
  if (existing.length) return;
  for (const s of services) {
    await store.query(`MERGE (s:Service {id:$id}) SET s.name=$name,s.x=$x,s.y=$y,s.source=$source MERGE (p:Person {id:$owner}) SET p.name=$owner,p.team=$team,p.source=$ownerSource MERGE (s)-[:OWNED_BY]->(p)`,{...s,source:`catalog/services/${s.id}.yaml`,ownerSource:`catalog/teams/${s.team.toLowerCase().replaceAll(' ','-')}.yaml`});
  }
  for (const [from,to] of dependencies) {
    await store.query(`MATCH (a:Service {id:$from}),(b:Service {id:$to}) MERGE (a)-[r:DEPENDS_ON]->(b) SET r.source=$source`,{from,to,source:`catalog/services/${from}.yaml`});
  }
  for (const c of customers) {
    await store.query(`MATCH (s:Service {id:$service}) MERGE (c:Customer {id:$id}) SET c.name=$name,c.arr=$arr,c.tier=$tier,c.x=$x,c.y=$y MERGE (c)-[r:USES]->(s) SET r.source=$source`,{...c,source:`contracts/${c.id}.json`});
  }
  for (const d of deployments) {
    await store.query(`MATCH (s:Service {id:$service}) MERGE (d:Deployment {id:$id}) SET d.name=$name,d.minutesAgo=$minutesAgo,d.errorDelta=$errorDelta,d.summary=$summary,d.source=$source MERGE (d)-[:DEPLOYED_TO]->(s)`,d);
  }
  await store.query(`MATCH (s:Service {id:'payments'}) MERGE (i:Incident {id:'INC-018'}) SET i.title='Payment connection pool exhausted',i.outcome='Pool saturation confirmed; rollback restored authorizations in 4 minutes.',i.fix='Inspect pool saturation; if confirmed, roll back payments and monitor authorization errors.',i.status='resolved',i.createdAt='2026-10-12T08:30:00Z',i.source='postmortems/INC-018.md',i.origin='seed' MERGE (i)-[:ABOUT]->(s)`);
  await store.query(`CREATE (:Dataset {id:$id,clock:$clock})`,{id:'synthetic-v1',clock:incidentTime});
}

export async function topology(store) {
  const [nodes,edges] = await Promise.all([store.query(queries.topologyNodes),store.query(queries.topologyEdges)]);
  return {nodes,edges,mutationActive:edges.some(e=>e.source==='analytics'&&e.target==='payments')};
}

export async function setDependency(store, active) {
  if (active) await store.query(`MATCH (a:Service {id:'analytics'}),(b:Service {id:'payments'}) MERGE (a)-[r:DEPENDS_ON]->(b) SET r.source='catalog/services/analytics-change.yaml'`);
  else await store.query(`MATCH (:Service {id:'analytics'})-[r:DEPENDS_ON]->(:Service {id:'payments'}) DELETE r`);
  return topology(store);
}
