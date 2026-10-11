import test from 'node:test';
import assert from 'node:assert/strict';
import { createRootApp } from '../src/rootApp.js';
import { adminPages } from '../src/adminConsole.js';

function serve(t) {
  const server = createRootApp().listen(0);
  t.after(() => server.close());
  return 'http://127.0.0.1:' + server.address().port;
}
async function signup(base, email) {
  const response = await fetch(base + '/api/members/signup', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'development-test-only' })
  });
  assert.equal(response.status, 201);
  return (await response.json()).token;
}
test('public navigation is compactable and administrator scripts are separate', async t => {
  const base = serve(t);
  const response = await fetch(base + '/integrations');
  const html = await response.text();
  assert.match(html, /id="nav-toggle"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /id="site-nav"/);
  assert.match(html, /Skip to content/);
  assert.match(html, /Admin dashboard/);
  assert.equal(response.headers.get('content-security-policy')?.includes("script-src 'self'"), true);
  for (const asset of ['admin.js', 'admin.css']) {
    const res = await fetch(base + '/console-assets/' + asset);
    assert.equal(res.status, 200, asset);
  }
});

test('every admin section requires authentication and admin role', async t => {
  const base = serve(t);
  const memberToken = await signup(base, 'ordinary-member@example.com');
  for (const path of Object.keys(adminPages)) {
    const anonymous = await fetch(base + path);
    assert.equal(anonymous.status, 401, path);
    assert.equal((await anonymous.json()).error, 'unauthorized');
    const member = await fetch(base + path, { headers: { authorization: 'Bearer ' + memberToken } });
    assert.equal(member.status, 403, path);
    assert.equal((await member.json()).error, 'forbidden');
  }
});

test('admin dashboard sections serve authorized read-only HTML in development', async t => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  t.after(() => { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; });
  const base = serve(t);
  const token = await signup(base, 'platform-admin@example.com');
  for (const path of Object.keys(adminPages)) {
    const response = await fetch(base + path, { headers: { authorization: 'Bearer ' + token } });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(response.headers.get('cache-control'), /private, no-store/);
    assert.match(response.headers.get('vary'), /authorization/i);
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
    const html = await response.text();
    assert.match(html, /O-H-I COMMAND CENTER/);
    assert.match(html, /admin-sidebar/);
    assert.match(html, /id="admin-content"/);
    assert.match(html, /admin\.js/);
    assert.doesNotMatch(html, /<script[^>]*>[^<]+<\/script>/);
    assert.doesNotMatch(html, /"token":/);
  }
});

test('production explicitly denies all admin UI paths despite development token', async t => {
  const base = serve(t);
  const token = await signup(base, 'platform-admin-production-test@example.com');
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; });
  for (const path of Object.keys(adminPages)) {
    const response = await fetch(base + path, { headers: { authorization: 'Bearer ' + token } });
    assert.equal(response.status, 503, path);
    assert.equal((await response.json()).error, 'production_console_auth_not_configured');
  }
});
