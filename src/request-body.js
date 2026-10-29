export async function readJsonBody(req) {
  const chunks=[];
  let bytes=0;
  for await(const chunk of req){
    bytes+=chunk.length;
    if(bytes>16384)throw new Error('Request too large');
    chunks.push(chunk);
  }
  // A UTF-8 character may span network chunks; decode only after joining bytes.
  // Reject malformed bytes rather than saving silently substituted outcome text.
  const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(Buffer.concat(chunks,bytes));
  const input=text?JSON.parse(text):{};
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('JSON body must be an object');
  return input;
}
