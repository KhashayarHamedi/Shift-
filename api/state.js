const KEY = 'shift:team:state:v1';

function redisConfig(){
  return {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_REST_TOKEN
  };
}

async function command(args){
  const {url,token}=redisConfig();
  if(!url || !token) throw new Error('Redis is not configured');
  const res=await fetch(url,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(args)});
  if(!res.ok) throw new Error(`Redis request failed with ${res.status}`);
  const data=await res.json();
  return data.result;
}

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    if(req.method==='GET'){
      const raw=await command(['GET',KEY]);
      if(!raw) return res.status(200).json({state:null});
      return res.status(200).json({state:JSON.parse(raw)});
    }
    if(req.method==='PUT'){
      const state=req.body;
      if(!state || typeof state!=='object' || !state.people || !state.library || !state.future) return res.status(400).json({error:'Invalid state'});
      const raw=JSON.stringify(state);
      if(Buffer.byteLength(raw,'utf8')>250000) return res.status(413).json({error:'State is too large'});
      await command(['SET',KEY,raw]);
      return res.status(200).json({ok:true});
    }
    res.setHeader('Allow','GET, PUT');
    return res.status(405).json({error:'Method not allowed'});
  }catch(err){
    return res.status(503).json({error:'Team cloud is not configured'});
  }
};
