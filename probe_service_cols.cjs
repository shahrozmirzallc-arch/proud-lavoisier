const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(".env", "utf8");
const envVars = {};
envContent.split("\n").forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
  if (m) { let v = (m[2]||"").trim(); if((v[0]=='"'&&v[v.length-1]=='"')||(v[0]=="'"&&v[v.length-1]=="'"))v=v.slice(1,-1); envVars[m[1]]=v; }
});

const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const url = envVars.VITE_SUPABASE_URL;
const headers = { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` };

async function probe() {
  const tests = [
    { table: 'shift_reports', col: 'sent_at' },
    { table: 'incidents', col: 'sent_at' },
    { table: 'incidents', col: 'archived_at' },
    { table: 'suppliers', col: 'parts_supplied' }
  ];

  console.log("=== Service Role Column Probe ===");
  for (const t of tests) {
    const res = await fetch(`${url}/rest/v1/${t.table}?select=${t.col}&limit=1`, { headers });
    console.log(`${t.table}.${t.col} -> HTTP ${res.status}`);
    if (res.status !== 200) {
      const err = await res.text();
      console.log(`   Error: ${err}`);
    }
  }
}
probe();
