import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

function startTestServer() {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  return { server, baseUrl };
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

test('core health, readiness, and version routes compile and respond', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const health = await request(baseUrl, '/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.body.ok, true);
  assert.equal(health.body.service, 'onegodian-api');

  const ready = await request(baseUrl, '/ready');
  assert.equal(ready.response.status, 200);
  assert.equal(ready.body.ready, true);
  assert.equal(ready.body.checks.routes, true);
  assert.equal(ready.body.checks.billing, true);
  assert.equal(ready.body.checks.cors, true);
  assert.equal(ready.body.checks.rateLimit, true);

  const version = await request(baseUrl, '/version');
  assert.equal(version.response.status, 200);
  assert.equal(version.body.version, '0.4.0');
});

test('system manifest, capabilities, and registry routes respond', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const manifest = await request(baseUrl, '/api/system/manifest');
  assert.equal(manifest.response.status, 200);
  assert.equal(manifest.body.slug, 'onegodian-api');
  assert.equal(manifest.body.version, '0.4.0');
  assert.equal(manifest.body.routes.health, '/health');
  assert.ok(manifest.body.capabilities.includes('app_bridge_manifest'));

  const capabilities = await request(baseUrl, '/api/system/capabilities');
  assert.equal(capabilities.response.status, 200);
  assert.ok(capabilities.body.capabilities.includes('system_registry'));

  const registry = await request(baseUrl, '/api/system/registry');
  assert.equal(registry.response.status, 200);
  assert.ok(Array.isArray(registry.body.registry));
  assert.ok(registry.body.registry.length >= 1);
});

test('app bridge status rejects missing key when bridge key is configured', async (t) => {
  const previous = process.env.API_BRIDGE_KEY;
  process.env.API_BRIDGE_KEY = 'test_bridge_key_12345';
  const { createApp: createFreshApp } = await import(`../src/app.js?bridge=${Date.now()}`);
  const app = createFreshApp();
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  t.after(() => {
    server.close();
    if (previous === undefined) delete process.env.API_BRIDGE_KEY;
    else process.env.API_BRIDGE_KEY = previous;
  });

  const rejected = await request(baseUrl, '/api/bridge/status');
  assert.equal(rejected.response.status, 401);
  assert.equal(rejected.body.error, 'invalid_app_bridge_key');

  const accepted = await request(baseUrl, '/api/bridge/status', {
    headers: { 'x-omos-app-key': 'test_bridge_key_12345' }
  });
  assert.equal(accepted.response.status, 200);
  assert.equal(accepted.body.authenticated, true);
});

test('member signup, login, and authenticated profile route work', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const signup = await request(baseUrl, '/api/members/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: 'member@example.com',
      name: 'OneGodian Member',
      password: 'strong-password'
    })
  });

  assert.equal(signup.response.status, 201);
  assert.ok(signup.body.token);
  assert.equal(signup.body.user.email, 'member@example.com');

  const me = await request(baseUrl, '/api/members/me', {
    headers: { authorization: `Bearer ${signup.body.token}` }
  });
  assert.equal(me.response.status, 200);
  assert.equal(me.body.user.email, 'member@example.com');

  const login = await request(baseUrl, '/api/members/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'member@example.com',
      password: 'strong-password'
    })
  });
  assert.equal(login.response.status, 200);
  assert.ok(login.body.token);
});

test('billing checkout, webhook, and status routes work in mock mode', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const signup = await request(baseUrl, '/api/members/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: 'billing@example.com',
      password: 'strong-password'
    })
  });
  const token = signup.body.token;

  const checkout = await request(baseUrl, '/billing/checkout', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan: 'pro' })
  });
  assert.equal(checkout.response.status, 200);
  assert.equal(checkout.body.plan.id, 'pro');
  assert.ok(checkout.body.checkoutSessionId.startsWith('cs_'));
  assert.ok(checkout.body.checkoutUrl.includes('/checkout/subscription/pro'));

  const webhook = await request(baseUrl, '/billing/webhook', {
    method: 'POST',
    body: JSON.stringify({ type: 'checkout.session.completed', data: { plan: 'pro' } })
  });
  assert.equal(webhook.response.status, 200);
  assert.equal(webhook.body.received, true);

  const status = await request(baseUrl, '/billing/status', {
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(status.response.status, 200);
  assert.equal(status.body.customer, 'billing@example.com');
});

test('product catalog, checkout, and download-token fulfillment work', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const products = await request(baseUrl, '/api/products');
  assert.equal(products.response.status, 200);
  assert.ok(Array.isArray(products.body.products));
  assert.ok(products.body.products.length >= 1);

  const productId = products.body.products[0].id;
  const checkout = await request(baseUrl, '/api/products/checkout', {
    method: 'POST',
    body: JSON.stringify({ productId, email: 'buyer@example.com' })
  });
  assert.equal(checkout.response.status, 200);
  assert.equal(checkout.body.product.id, productId);
  assert.ok(checkout.body.downloadToken.startsWith('download_'));
  assert.ok(checkout.body.expiresAt);

  const download = await request(baseUrl, `/api/products/downloads/${checkout.body.downloadToken}`);
  assert.equal(download.response.status, 200);
  assert.equal(download.body.authorized, true);
  assert.equal(download.body.product.id, productId);
});

test('admin stats require admin auth and return operational counts', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const unauthorized = await request(baseUrl, '/admin/stats');
  assert.equal(unauthorized.response.status, 401);

  const signup = await request(baseUrl, '/api/members/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'strong-password'
    })
  });

  const stats = await request(baseUrl, '/admin/stats', {
    headers: { authorization: `Bearer ${signup.body.token}` }
  });
  assert.equal(stats.response.status, 200);
  assert.ok(stats.body.users >= 1);
  assert.ok(stats.body.products >= 1);
});

test('unknown routes return JSON 404 responses', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const missing = await request(baseUrl, '/does-not-exist');
  assert.equal(missing.response.status, 404);
  assert.equal(missing.body.error, 'not_found');
});
