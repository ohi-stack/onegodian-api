import test from 'node:test';
import assert from 'node:assert/strict';
import { createVerificationService } from '../src/verification.js';

test('OBP-1 verification fails closed when authority is not configured', async () => {
  const service = createVerificationService({ env: {} });
  const result = await service.verify({ recordId: 'OBP-TEST-001' }, { requestId: 'req-1' });

  assert.equal(service.status().configured, false);
  assert.equal(result.httpStatus, 503);
  assert.equal(result.body.verified, false);
  assert.equal(result.body.status, 'unavailable');
  assert.equal(result.body.reason, 'obp1_authority_not_configured');
});

test('OBP-1 verification accepts only explicit authoritative verified state', async () => {
  const service = createVerificationService({
    env: { OBP1_VERIFY_URL: 'https://obp1.example.test/verify', OBP1_API_KEY: 'server-secret' },
    fetchImpl: async (_url, options) => {
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.authorization, 'Bearer server-secret');
      return new Response(JSON.stringify({
        verified: true,
        status: 'verified',
        recordId: 'OBP-TEST-002',
        odinId: 'ODIN-TEST-002',
        hash: 'a'.repeat(64),
        verifiedAt: '2026-10-04T00:00:00.000Z'
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
  });

  const result = await service.verify({ recordId: 'OBP-TEST-002' });
  assert.equal(result.httpStatus, 200);
  assert.equal(result.body.verified, true);
  assert.equal(result.body.status, 'verified');
  assert.equal(result.body.evidence.recordId, 'OBP-TEST-002');
});

test('OBP-1 verification rejects revoked or non-verified authority states', async () => {
  const service = createVerificationService({
    env: { OBP1_VERIFY_URL: 'https://obp1.example.test/verify' },
    fetchImpl: async () => new Response(JSON.stringify({
      verified: true,
      status: 'verified',
      recordId: 'OBP-TEST-003',
      revoked: true,
      revokedAt: '2026-10-04T00:00:00.000Z'
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  });

  const result = await service.verify({ recordId: 'OBP-TEST-003' });
  assert.equal(result.httpStatus, 200);
  assert.equal(result.body.verified, false);
  assert.equal(result.body.status, 'revoked');
});
