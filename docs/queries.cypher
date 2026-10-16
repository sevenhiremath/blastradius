// topologyNodes
MATCH (n) WHERE n:Service OR n:Customer RETURN n.id AS id, n.name AS name, labels(n)[0] AS kind, n.x AS x, n.y AS y;

// topologyEdges
MATCH (a)-[r]->(b) WHERE type(r) IN ['DEPENDS_ON','USES'] RETURN a.id AS source, b.id AS target, type(r) AS kind, r.source AS evidence;

// candidates
MATCH p=(alerted:Service {id:$service})-[:DEPENDS_ON*0..6]->(s:Service)<-[:DEPLOYED_TO]-(d:Deployment) WHERE d.minutesAgo <= 60 AND d.errorDelta > 0 RETURN d.id AS id, d.name AS name, d.summary AS summary, d.minutesAgo AS minutesAgo, d.errorDelta AS errorDelta, d.source AS source, s.id AS service, length(p) AS hops ORDER BY errorDelta DESC, minutesAgo ASC;

// customers
MATCH p=(c:Customer)-[:USES]->(:Service)-[:DEPENDS_ON*0..6]->(s:Service {id:$service}) RETURN c.id AS id, c.name AS name, c.arr AS arr, c.tier AS tier, [n IN nodes(p) | n.id] AS path, [r IN relationships(p) | r.source] AS sources ORDER BY c.name;

// owners
MATCH (s:Service {id:$service})-[:OWNED_BY]->(p:Person) RETURN p.name AS name, p.team AS team, p.source AS source;

// memory
MATCH (i:Incident)-[:ABOUT]->(s:Service {id:$service}) WHERE i.status = 'resolved' RETURN i.id AS id, i.title AS title, i.outcome AS outcome, i.fix AS fix, i.status AS status, i.createdAt AS createdAt, i.source AS source ORDER BY createdAt DESC LIMIT 8;

// tickets
MATCH (t:Ticket)-[:FOR]->(i:Incident)-[:ABOUT]->(s:Service) RETURN t.id AS id, t.title AS title, t.status AS status, t.createdAt AS createdAt, s.name AS service ORDER BY createdAt DESC LIMIT 20;

// history
MATCH (i:Incident)-[:ABOUT]->(s:Service) WHERE i.origin = 'investigation' RETURN i.id AS id, i.title AS title, i.status AS status, i.createdAt AS createdAt, s.name AS service, i.outcome AS outcome ORDER BY createdAt DESC LIMIT 20;
