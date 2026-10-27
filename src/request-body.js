export async function readJsonBody(req) {
  const chunks=[];
  let bytes=0;
  for await(const chunk of req){
    bytes+=chunk.length;
    if(bytes>16384)throw new Error('Request too large');
    chunks.push(chunk);
  }
  // A UTF-8 character may span network chunks; decode only after joining bytes.
  const text=Buffer.concat(chunks,bytes).toString('utf8');
  const input=text?JSON.parse(text):{};
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('JSON body must be an object');
  return input;
}
