// Run: node scripts/smoke.js https://your-vercel-preview.vercel.app
const fetch = require('node-fetch');

const base = process.argv[2] || 'http://localhost:5173';
const probe = async (path) => {
  const url = base + path;
  const t0 = Date.now();
  try{
    const r = await fetch(url, { redirect: 'manual' });
    const ms = Date.now() - t0;
    console.log(`${path} -> ${r.status} in ${ms}ms`);
    return r.ok;
  }catch(e){
    console.log(`${path} -> ERROR ${e.message}`);
    return false;
  }
};

const run = async () => {
  const a = await probe('/health');
  const b = await probe('/api/clinics?limit=1');
  process.exit(a && b ? 0 : 1);
};
run();