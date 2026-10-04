import test from 'node:test';
import assert from 'node:assert/strict';
import { createRootApp } from '../src/rootApp.js';

function serve(t) {
  const server = createRootApp().listen(0);
  t.after(() => server.close());
  return `http://127.0.0.1:${server.address().port}`;
}

test('public console routes serve HTML while machine routes stay JSON', async t => {
  const base = serve(t);
  for (const path of ['/', '/status', '/docs', '/developers', '/services', '/integrations']) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type'), /text\/html/, path);
    const html = await res.text();
    assert.match(html, /O-H-I Command Center/);
    assert.match(html, /\/console-assets\/console.js/);
    assert.doesNotMatch(html, /<script[^>]*>[^<]+<\/script>/);
    assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  }
  const health = await (await fetch(base + '/health')).json();
  assert.equal(health.ok, true);
  assert.equal(health.name, 'onegodian-api');
  assert.equal(health.status, 'online');
  assert.equal(health.version, '0.4.0');
  assert.equal(health.service, 'onegodian-api');
  assert.equal(typeof health.uptimeSeconds, 'number');
  const manifest = await (await fetch(base + '/manifest')).json();
  assert.equal(manifest.runtimeOwner, 'ohi-stack/onegodian-api');
  assert.equal(manifest.executionAuthority, 'ACC');
  assert.equal(manifest.registries.oips.status, 'unknown');
});

test('v1 aliases preserve existing API behavior and mapper mounting', async t => {
  const base = serve(t);
  const current = await (await fetch(base + '/api/v1/profile')).json();
  const alias = await (await fetch(base + '/v1/profile')).json();
  assert.equal(alias.framework, current.framework);
  assert.equal(alias.version, current.version);
  const result = await fetch(base + '/v1/alignment/evaluate?source=console', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({context: 'Verify truth'})
  });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).selected.option, 'Verify truth');
  const invalid = await fetch(base + '/v1/alignment/evaluate', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
  });
  assert.equal(invalid.status, 400);
  const mapper = await fetch(base + '/v1/belief-mapper/questions');
  assert.equal(mapper.status, 200);
  assert.equal((await mapper.json()).questions.length, 5);
  const missing = await fetch(base + '/v1/not-implemented');
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error, 'not_found');
});

test('console assets cannot shadow API routes and unknown paths remain JSON', async t => {
  const base = serve(t);
  for (const [path, type] of [['console.css', /text\/css/], ['console.js', /javascript/]]) {
    const res = await fetch(base + '/console-assets/' + path);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), type);
  }
  for (const path of ['/console-assets/missing.js', '/unknown', '/api/unknown']) {
    const res = await fetch(base + path);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error, 'not_found');
  }
});

test('administration never falls through to the public console', async t => {
  const base = serve(t);
  for (const path of ['/admin', '/admin/tools', '/admin/stats', '/admin/quantum-ohi/overview']) {
    const res = await fetch(base + path);
    assert.equal(res.status, 401, path);
    assert.equal((await res.json()).error, 'unauthorized');
  }
});

test('new administration page rejects members and fails closed in production', async t => {
  const base = serve(t);
  const signup = async email => (await (await fetch(base + '/api/members/signup', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'test-password' })
  })).json()).token;
  const member = await signup('console-member@example.com');
  const forbidden = await fetch(base + '/admin', {headers: {authorization: `Bearer ${member}`}});
  assert.equal(forbidden.status, 403);
  const admin = await signup('console-admin@example.com');
  const prior = process.env.NODE_ENV;
  t.after(() => { if (prior === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prior; });
  process.env.NODE_ENV = 'production';
  const blocked = await fetch(base + '/admin', {headers: {authorization: `Bearer ${admin}`}});
  assert.equal(blocked.status, 503);
  assert.equal((await blocked.json()).error, 'production_console_auth_not_configured');
});
