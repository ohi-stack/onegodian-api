import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';

const AlignmentSchema = z.object({
  context: z.string().min(1).max(5000),
  options: z.array(z.string().min(1).max(1000)).min(1).max(12).optional(),
  metadata: z.record(z.unknown()).optional()
});

const RegisterSchema = z.object({
  type: z.enum(['member', 'artifact', 'prompt', 'algorithm_result', 'identity_record']).default('artifact'),
  title: z.string().min(1).max(200),
  owner: z.string().min(1).max(200).optional(),
  payload: z.record(z.unknown()).default({})
});

function makeRequestId() {
  return `og_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function scoreOption(option) {
  const normalized = option.toLowerCase();
  const bonuses = ['truth', 'clarity', 'coherence', 'dignity', 'unity', 'verify', 'document', 'member', 'education'];
  const penalties = ['confusion', 'fragment', 'mislead', 'unverified', 'unsafe'];
  const bonus = bonuses.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0);
  const penalty = penalties.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0);
  return Math.max(0, 50 + bonus * 10 - penalty * 15);
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*'}));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || makeRequestId();
    res.setHeader('x-request-id', req.requestId);
    next();
  });

  app.get('/', (req, res) => res.json({
    name: 'onegodian-api',
    status: 'online',
    version: '0.2.0',
    timestampUtc: new Date().toISOString(),
    requestId: req.requestId
  }));

  app.get('/health', (req, res) => res.json({
    ok: true,
    service: 'onegodian-api',
    timestampUtc: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    requestId: req.requestId
  }));

  app.get('/api/status', (req, res) => res.json({
    service: 'api.OneGodian.org',
    ready: true,
    node: process.version,
    environment: process.env.NODE_ENV || 'development',
    requestId: req.requestId
  }));

  app.get('/api/v1/profile', (req, res) => res.json({
    framework: 'ONEGODIAN',
    operatingPosture: 'founder-authored identity and AI governance ecosystem',
    currentFocus: ['membership', 'education', 'digital products', 'AI identity governance tools'],
    technicalDirection: ['OneGodian Algorithm', 'Belief Mapper', 'Protocol API', 'Agent Authority Model'],
    version: '0.2.0',
    requestId: req.requestId
  }));

  app.post('/api/v1/alignment/evaluate', (req, res) => {
    const parsed = AlignmentSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_alignment_payload', details: parsed.error.flatten(), requestId: req.requestId });
    }

    const options = parsed.data.options?.length ? parsed.data.options : [parsed.data.context];
    const ranked = options
      .map((option) => ({ option, alignmentScore: scoreOption(option) }))
      .sort((a, b) => b.alignmentScore - a.alignmentScore);

    return res.json({
      decisionRule: 'Prefer the action that increases truth, clarity, coherence, dignity, and constructive unity while minimizing distortion and fragmentation.',
      ranked,
      selected: ranked[0],
      timestampUtc: new Date().toISOString(),
      requestId: req.requestId
    });
  });

  app.post('/api/v1/verify', (req, res) => res.json({
    verified: true,
    verificationMode: 'development-placeholder',
    inputHashEligible: true,
    input: req.body || {},
    timestampUtc: new Date().toISOString(),
    requestId: req.requestId
  }));

  app.post('/api/v1/register', (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_register_payload', details: parsed.error.flatten(), requestId: req.requestId });
    }

    return res.status(201).json({
      created: true,
      recordId: `OG-${Date.now()}`,
      data: parsed.data,
      timestampUtc: new Date().toISOString(),
      requestId: req.requestId
    });
  });

  app.post('/api/verify', (req, res) => res.redirect(307, '/api/v1/verify'));
  app.post('/api/register', (req, res) => res.redirect(307, '/api/v1/register'));

  app.use((req, res) => res.status(404).json({ error: 'not_found', path: req.path, requestId: req.requestId }));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error', requestId: req.requestId });
  });

  return app;
}
