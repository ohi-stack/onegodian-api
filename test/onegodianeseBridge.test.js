import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createOneGodianeseBridge } from '../src/onegodianeseBridge.js';

async function withServer(deps, callback) {
  const app = express();
  app.use('/api/v1/onegodianese', createOneGodianeseBridge(deps));
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  try {
    return await callback('http://127.0.0.1:' + server.address().port);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

const adapters = {
  authenticate: async () => ({ subject: 'approved-user-1', scopes: ['onegodianese:access:read'] }),
  getMembership: async () => ({ active: true }),
  getCourseMapping: async slug => slug === 'onegodianese' ? { courseId: 101 } : null,
  getCourseAccess: async () => ({ enrolled: true, canAccess: true })
};
test('unconfigured bridge fails closed with no-store', async () => {
  await withServer({}, async base => {
    const r = await fetch(base + '/api/v1/onegodianese/access?slug=onegodianese');
    assert.equal(r.status, 503);
    assert.match(r.headers.get('cache-control'), /no-store/);
  });
});
test('only server-verified subject, never query userId, drives lookup', async () => {
  let observed;
  await withServer({ ...adapters, getMembership: async subject => { observed = subject; return { active: true }; } }, async base => {
    const r = await fetch(base + '/api/v1/onegodianese/access?slug=onegodianese&userId=attacker');
    assert.equal(r.status, 200);
    assert.equal(observed, 'approved-user-1');
    const body = await r.json();
    assert.deepEqual(body.learning, { enrolled: true, canAccess: true });
    assert.equal(body.member.active, true);
    assert.equal(body.courseId, 101);
  });
});
test('missing scope denies read', async () => {
  await withServer({ ...adapters, authenticate: async () => ({ subject:'u',scopes:[] }) }, async base => {
    const r = await fetch(base + '/api/v1/onegodianese/access?slug=onegodianese');
    assert.equal(r.status, 401);
  });
});
test('unknown mappings and malformed slugs are rejected', async () => {
  await withServer(adapters, async base => {
    assert.equal((await fetch(base + '/api/v1/onegodianese/access?slug=other')).status, 404);
    assert.equal((await fetch(base + '/api/v1/onegodianese/access?slug=NO')).status, 400);
  });
});
test('upstream failure never returns a partial entitlement', async () => {
  await withServer({ ...adapters, getCourseAccess: async () => { throw Error('remote unavailable'); } }, async base => {
    const r = await fetch(base + '/api/v1/onegodianese/access?slug=onegodianese');
    assert.equal(r.status, 503);
    assert.equal((await r.json()).error, 'authoritative_state_unavailable');
  });
});
test('membership does not confer LMS enrollment', async () => {
  await withServer({ ...adapters, getCourseAccess: async () => ({ enrolled:false, canAccess:false }) }, async base => {
    const r = await fetch(base + '/api/v1/onegodianese/access?slug=onegodianese');
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.member.active, true);
    assert.equal(body.learning.canAccess, false);
  });
});
