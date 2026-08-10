const fs = require("fs");

const envContent = fs.readFileSync(".env", "utf8");
const envVars = {};
envContent.split("\n").forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
  if (m) { let v = (m[2]||"").trim(); if((v[0]=='"'&&v[v.length-1]=='"')||(v[0]=="'"&&v[v.length-1]=="'"))v=v.slice(1,-1); envVars[m[1]]=v; }
});

const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const url = envVars.VITE_SUPABASE_URL;

async function run() {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  });
  const spec = await res.json();
  const rpcs = {};
  for (const path in spec.paths) {
    if (path.startsWith('/rpc/')) {
      rpcs[path] = spec.paths[path].post ? spec.paths[path].post.parameters : spec.paths[path];
    }
  }
  console.log("RPC Functions & Parameters:");
  console.log(JSON.stringify(rpcs, null, 2));
}
run();
