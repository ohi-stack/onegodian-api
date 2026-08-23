import test from 'node:test';
import assert from 'node:assert/strict';
import { createRootApp } from '../src/rootApp.js';

function startTestServer() {
  const app = createRootApp();
  const server = app.listen(0);
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function jsonRequest(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  return { response, body: await response.json() };
}

test('Belief Mapper exposes five canonical Lite questions', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const result = await jsonRequest(baseUrl, '/api/v1/belief-mapper/questions');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.version, 'belief-mapper-lite-v0.3');
  assert.equal(result.body.questions.length, 5);
  assert.deepEqual(result.body.answers, ['yes', 'not_sure', 'no']);
});

test('Belief Mapper returns alignment result without assigning identity', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const answers = ['source', 'truth', 'purpose', 'connection', 'identity'].map((questionId) => ({ questionId, answer: 'yes' }));
  const result = await jsonRequest(baseUrl, '/api/v1/belief-mapper/evaluate', {
    method: 'POST',
    body: JSON.stringify({ answers })
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.body.score, 10);
  assert.equal(result.body.classification, 'Strong Alignment');
  assert.match(result.body.identityNotice, /does not assign/i);
});

test('Belief Mapper rejects duplicate or incomplete question sets', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const result = await jsonRequest(baseUrl, '/api/v1/belief-mapper/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      answers: [
        { questionId: 'source', answer: 'yes' },
        { questionId: 'source', answer: 'yes' },
        { questionId: 'purpose', answer: 'not_sure' },
        { questionId: 'connection', answer: 'no' },
        { questionId: 'identity', answer: 'yes' }
      ]
    })
  });

  assert.equal(result.response.status, 400);
  assert.equal(result.body.error, 'invalid_belief_mapper_payload');
});
