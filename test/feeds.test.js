import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedCollector } from '../src/feeds.js';

const response = body => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
test('ACC evidence exposes summaries only and keeps credentials server-side', async () => {
  const requests = [];
  const collect = createFeedCollector({ config: { ACC_READ_KEY: 'private-key', ACC_PUBLIC_SUMMARIES: 'true' }, fetchImpl: async (url, options) => {
    requests.push({url, options});
    if (url.endsWith('/health')) return response({service:'ACC',status:'ok',version:'1.3.0'});
    if (url.endsWith('/ready')) return response({service:'ACC',status:'ready'});
    return response({success:true,count:1,total:1,data:[{secret:'private-record',capabilities:['tool']}]});
  }});
  const result = await collect();
  assert.equal(result.acc.status, 'responding');
  assert.equal(result.acc.readiness, 'ready');
  assert.equal(result.agents.count, 1);
  assert.equal(result.integrations.count, 1);
  assert.equal(result.tools.status, 'unknown');
  assert.equal(result.oips.status, 'not_configured');
  assert.doesNotMatch(JSON.stringify(result), /private-key|private-record|capabilities/);
  assert.ok(requests.filter(r=>r.url.includes('/api/v1/')).every(r=>r.options.headers['x-acc-key']==='private-key'));
  assert.ok(requests.every(r=>r.options.redirect==='error'));
});
test('missing authorization and publication consent prevent private upstream reads', async () => {
  const urls=[];
  const collect=createFeedCollector({config:{ACC_READ_KEY:'secret'},fetchImpl:async url=>{urls.push(url);return response({service:'ACC',status:'ok'});}});
  const result=await collect();
  assert.equal(result.agents.status,'not_configured');
  assert.equal(urls.length,2);
});
test('failure marks previous observations stale rather than healthy and coalesces refreshes', async () => {
  let now=Date.now(), fail=false, calls=0;
  const collect=createFeedCollector({config:{},now:()=>now,fetchImpl:async url=>{calls++;if(fail)throw Error('secret upstream details');return response({service:'ACC',status:url.endsWith('/ready')?'ready':'ok'});}});
  const first=await collect();
  await Promise.all([collect(),collect()]);
  assert.equal(calls,2);
  now+=31000;fail=true;
  const results=await Promise.all([collect(),collect()]);
  assert.equal(calls,4);
  assert.equal(results[0].acc.status,'stale');
  assert.equal(results[0].acc.observedAt,first.acc.observedAt);
  assert.doesNotMatch(JSON.stringify(results),/secret upstream details/);
});
test('HTML, unauthorized, malformed summaries and unsupported OIPS claims fail closed', async () => {
  const collect=createFeedCollector({config:{ACC_READ_KEY:'secret',ACC_PUBLIC_SUMMARIES:'true',OIPS_FEED_ENABLED:'true'},fetchImpl:async url=>{
    if(url.endsWith('/health'))return new Response('<html>',{headers:{'content-type':'text/html'}});
    if(url.endsWith('/ready'))return new Response('{}',{status:401});
    if(url.endsWith('/oips/evidence'))return response({status:'compliant'});
    return response({success:true,count:-1,data:[]});
  }});
  const result=await collect();
  assert.equal(result.acc.status,'invalid_response');
  assert.equal(result.agents.status,'invalid_response');
  assert.equal(result.oips.status,'invalid_response');
});
test('OIPS requires complete scoped dated evidence and reports upstream assertion without certification', async()=>{
  const observed=new Date().toISOString();
  const checks=['instructions','knowledge','skills','tools','verification'].map(capability=>({capability,status:'pass',evidenceRef:'record-'+capability}));
  const collect=createFeedCollector({config:{ACC_READ_KEY:'secret',OIPS_FEED_ENABLED:'true'},fetchImpl:async url=>response(url.endsWith('/oips/evidence')?{standard:'OIPS',scope:'acc-runtime',evaluatedAt:observed,checks}:{service:'ACC',status:'ok'})});
  const result=await collect();
  assert.equal(result.oips.status,'reported_pass');
  assert.equal(result.oips.certified,false);
});
test('readiness 503 preserves valid not-ready evidence instead of claiming liveness failure', async()=>{
  const collect=createFeedCollector({config:{},fetchImpl:async url=>new Response(JSON.stringify({service:'ACC',status:url.endsWith('/ready')?'not_ready':'ok'}),{status:url.endsWith('/ready')?503:200,headers:{'content-type':'application/json'}})});
  const result=await collect();
  assert.equal(result.acc.status,'responding');
  assert.equal(result.acc.readiness,'not_ready');
});
test('private 401 responses do not retain or reveal the upstream response body', async()=>{
  const collect=createFeedCollector({config:{ACC_READ_KEY:'secret',ACC_PUBLIC_SUMMARIES:'true'},fetchImpl:async url=>url.includes('/api/v1/')?new Response('secret',{status:401}):response({service:'ACC',status:'ok'})});
  const result=await collect();
  assert.equal(result.agents.status,'authorization_required');
  assert.doesNotMatch(JSON.stringify(result),/secret/);
});
test('oversized registry JSON is rejected before publication',async()=>{
  const collect=createFeedCollector({config:{ACC_READ_KEY:'secret',ACC_PUBLIC_SUMMARIES:'true'},fetchImpl:async url=>url.includes('/api/v1/')?response({success:true,count:1,data:[{text:'x'.repeat(1024*1024)}]}):response({service:'ACC',status:'ok'})});
  assert.equal((await collect()).agents.status,'invalid_response');
});
