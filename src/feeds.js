// Read-only upstream observations. Never forward caller headers or raw private records.
const ORIGIN = 'https://acc.onegodian.com';
const CAPABILITIES = ['instructions', 'knowledge', 'skills', 'tools', 'verification'];
const TTL = 30000;
const MAX_BYTES = 1024 * 1024;

export function createFeedCollector({ config = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  let cached, refreshedAt = -Infinity, pending;
  const history = new Map();
  const key = config.ACC_READ_KEY;
  const publish = config.ACC_PUBLIC_SUMMARIES === 'true';
  const enabled = config.ACC_FEEDS_ENABLED !== 'false';
  const oipsEnabled = config.OIPS_FEED_ENABLED === 'true';
  async function read(path, privateFeed, normalize) {
    const source = ORIGIN + path;
    const checkedAt = new Date(now()).toISOString();
    const base = { source, checkedAt, observedAt: null };
    try {
      const headers = { accept: 'application/json' };
      if (privateFeed) headers['x-acc-key'] = key;
      const response = await fetchImpl(source, { headers, redirect: 'error', signal: AbortSignal.timeout(2000) });
      if (!response.ok && !(path === '/ready' && response.status === 503)) throw { status: response.status === 401 || response.status === 403 ? 'authorization_required' : 'unavailable' };
      if (!response.headers.get('content-type')?.includes('application/json')) throw {status:'invalid_response'};
      const reader = response.body.getReader();
      const chunks = [];let size = 0;
      try {
        while (true) {
          const {done,value} = await reader.read();if(done)break;
          size += value.byteLength;
          if(size > MAX_BYTES) throw {status:'invalid_response'};
          chunks.push(value);
        }
      } finally { await reader.cancel().catch(()=>{}); }
      const body = Buffer.concat(chunks.map(c=>Buffer.from(c))).toString('utf8');
      let data;
      try { data = normalize(JSON.parse(body)); } catch { throw {status:'invalid_response'}; }
      const result = {...base, observedAt: checkedAt, ...data};
      history.set(path,result);
      return result;
    } catch (error) {
      const previous = history.get(path);
      return previous ? { ...previous, checkedAt, status:'stale', reason:'Refresh failed; last successful observation retained.', refreshStatus:error.status || 'unavailable' }
        : {...base,status:error.status || 'unavailable',reason:'No valid upstream observation available.'};
    }
  }
  function summary(data) {
    const count = data.count ?? data.total;
    if (data.success !== true || !Array.isArray(data.data) || !Number.isSafeInteger(count) || count < 0) throw Error();
    return {status:'observed',count,reason:'ACC registry summary; records remain private.'};
  }
  function oips(data) {
    const at = Date.parse(data.evaluatedAt);
    if (data.standard !== 'OIPS' || typeof data.scope !== 'string' || !data.scope.trim() || data.scope.length > 200 || !Number.isFinite(at) || at > now()+60000 || now()-at > 86400000 || !Array.isArray(data.checks) || data.checks.length !== 5) throw Error();
    const checks = CAPABILITIES.map(capability => {
      const matches = data.checks.filter(c=>c.capability === capability);
      if(matches.length !== 1 || !['pass','fail','unknown'].includes(matches[0].status) || typeof matches[0].evidenceRef !== 'string' || !matches[0].evidenceRef.trim()) throw Error();
      return {capability,status:matches[0].status};
    });
    return {status:checks.every(c=>c.status === 'pass')?'reported_pass':checks.some(c=>c.status==='fail')?'reported_fail':'unknown',scope:data.scope,evaluatedAt:new Date(at).toISOString(),checks,certified:false,reason:'Upstream scoped assessment; not independent compliance certification.'};
  }
  async function refresh() {
    const absent = (reason,source=null) => ({status:'not_configured',reason,source,observedAt:null,checkedAt:new Date(now()).toISOString()});
    const registry = (path) => enabled && key && publish ? read(path,true,summary) : Promise.resolve(absent('Server credential and explicit public-summary publication must be configured.',ORIGIN+path));
    const [health,ready,agents,integrations,activity,oipsFeed] = await Promise.all([
      enabled ? read('/health',false,d=>{if(d.service!=='ACC'||d.status!=='ok')throw Error();return {status:'responding',version:typeof d.version==='string'?d.version.slice(0,60):null,reason:'ACC liveness observed; readiness assessed separately.'};}) : Promise.resolve(absent('ACC feeds disabled.')),
      enabled ? read('/ready',false,d=>{if(d.service!=='ACC'||!['ready','not_ready'].includes(d.status))throw Error();return {status:d.status};}) : Promise.resolve(absent('ACC feeds disabled.')),
      registry('/api/v1/agents'),registry('/api/v1/connections'),registry('/api/v1/audit?limit=1'),
      enabled && key && oipsEnabled ? read('/api/v1/oips/evidence',true,oips) : Promise.resolve(absent('No authoritative OIPS assessment feed configured.',ORIGIN+'/api/v1/oips/evidence'))
    ]);
    return {acc:{...health,readiness:ready.status,readinessObservedAt:ready.observedAt},agents,integrations,activity,oips:oipsFeed,tools:{status:'unknown',reason:'ACC agent records do not establish a registered, permissioned tool inventory.',source:null,observedAt:null}};
  }
  return async () => {
    if(cached && now()-refreshedAt<TTL)return structuredClone(cached);
    if(!pending) pending = refresh().then(value=>{cached=value;refreshedAt=now();return value;}).finally(()=>{pending=null;});
    return structuredClone(await pending);
  };
}
