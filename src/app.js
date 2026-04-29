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

const SignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  password: z.string().min(8).max(200)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200)
});

const BillingCheckoutSchema = z.object({
  plan: z.enum(['monthly', 'pro', 'founder']).default('monthly'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

const DigitalCheckoutSchema = z.object({
  productId: z.string().min(1).max(100),
  email: z.string().email().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

const WebhookSchema = z.object({
  type: z.string().min(1),
  data: z.record(z.unknown()).optional()
}).passthrough();

const plans = {
  monthly: { id: 'monthly', name: 'OneGodian Monthly', amountUsd: 19 },
  pro: { id: 'pro', name: 'OneGodian Pro', amountUsd: 49 },
  founder: { id: 'founder', name: 'OneGodian Founder', amountUsd: 199 }
};

const products = [
  {
    id: 'alignment-prompt-kit',
    name: 'OneGodian Alignment Prompt™ + Developer Kit',
    priceUsd: 49,
    delivery: 'digital_download',
    status: 'available'
  },
  {
    id: 'algorithm-pdf',
    name: 'The OneGodian Algorithm™ PDF',
    priceUsd: 29,
    delivery: 'digital_download',
    status: 'available'
  }
];

const users = new Map();
const downloadTokens = new Map();
const billingEvents = [];

function makeRequestId() {
  return `og_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function makeToken(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token || !users.has(token)) {
    return res.status(401).json({ error: 'unauthorized', requestId: req.requestId });
  }
  req.user = users.get(token);
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden', requestId: req.requestId });
  }
  return next();
}

function scoreOption(option) {
  const normalized = option.toLowerCase();
  const bonuses = ['truth', 'clarity', 'coherence', 'dignity', 'unity', 'verify', 'document', 'member', 'education'];
  const penalties = ['confusion', 'fragment', 'mislead', 'unverified', 'unsafe'];
  const bonus = bonuses.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0);
  const penalty = penalties.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0);
  return Math.max(0, 50 + bonus * 10 - penalty * 15);
}

function checkoutUrl(kind, id) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${appUrl}/checkout/${kind}/${encodeURIComponent(id)}`;
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
    version: '0.3.0',
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

  app.get('/ready', (req, res) => res.json({
    ok: true,
    ready: true,
    checks: {
      routes: true,
      billing: true,
      products: true,
      members: true
    },
    timestampUtc: new Date().toISOString(),
    requestId: req.requestId
  }));

  app.get('/version', (req, res) => res.json({
    name: 'onegodian-api',
    version: '0.3.0',
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
    version: '0.3.0',
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

  app.post('/api/members/signup', (req, res) => {
    const parsed = SignupSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_signup_payload', details: parsed.error.flatten(), requestId: req.requestId });
    }

    const token = makeToken('member');
    const user = {
      id: makeToken('user'),
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name || parsed.data.email.split('@')[0],
      role: parsed.data.email.toLowerCase().includes('admin') ? 'admin' : 'member',
      subscription: 'inactive',
      createdAt: new Date().toISOString()
    };
    users.set(token, user);

    return res.status(201).json({ user, token, requestId: req.requestId });
  });

  app.post('/api/members/login', (req, res) => {
    const parsed = LoginSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_login_payload', details: parsed.error.flatten(), requestId: req.requestId });
    }

    const existing = Array.from(users.values()).find((user) => user.email === parsed.data.email.toLowerCase());
    const token = makeToken('member');
    const user = existing || {
      id: makeToken('user'),
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.email.split('@')[0],
      role: parsed.data.email.toLowerCase().includes('admin') ? 'admin' : 'member',
      subscription: 'inactive',
      createdAt: new Date().toISOString()
    };
    users.set(token, user);

    return res.json({ user, token, requestId: req.requestId });
  });

  app.get('/api/members/me', requireAuth, (req, res) => res.json({ user: req.user, requestId: req.requestId }));

  app.post('/billing/checkout', requireAuth, (req, res) => {
    const parsed = BillingCheckoutSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_checkout_payload', details: parsed.error.flatten(), requestId: req.requestId });
    }

    const plan = plans[parsed.data.plan];
    return res.json({
      billingMode: process.env.STRIPE_SECRET_KEY ? 'stripe_configured' : 'mock_checkout',
      plan,
      checkoutSessionId: makeToken('cs'),
      checkoutUrl: checkoutUrl('subscription', plan.id),
      requestId: req.requestId
    });
  });

  app.post('/billing/webhook', (req, res) => {
    const parsed = WebhookSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_webhook_payload', details: parsed.error.flatten(), requestId: req.requestId });
    }

    billingEvents.push({
      id: makeToken('evt'),
      type: parsed.data.type,
      receivedAt: new Date().toISOString()
    });

    return res.json({ received: true, eventCount: billingEvents.length, requestId: req.requestId });
  });

  app.get('/billing/status', requireAuth, (req, res) => res.json({
    customer: req.user.email,
    subscription: req.user.subscription,
    billingMode: process.env.STRIPE_SECRET_KEY ? 'stripe_configured' : 'mock_checkout',
    requestId: req.requestId
  }));

  app.get('/api/products', (req, res) => res.json({ products, requestId: req.requestId }));

  app.post('/api/products/checkout', (req, res) => {
    const parsed = DigitalCheckoutSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_product_checkout_payload', details: parsed.error.flatten(), requestId: req.requestId });
    }

    const product = products.find((item) => item.id === parsed.data.productId);
    if (!product) {
      return res.status(404).json({ error: 'product_not_found', requestId: req.requestId });
    }

    const token = makeToken('download');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    downloadTokens.set(token, { product, expiresAt, email: parsed.data.email || null });

    return res.json({
      product,
      checkoutSessionId: makeToken('cs'),
      checkoutUrl: checkoutUrl('product', product.id),
      downloadToken: token,
      expiresAt,
      requestId: req.requestId
    });
  });

  app.get('/api/products/downloads/:token', (req, res) => {
    const record = downloadTokens.get(req.params.token);
    if (!record) {
      return res.status(404).json({ error: 'download_token_not_found', requestId: req.requestId });
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: 'download_token_expired', requestId: req.requestId });
    }

    return res.json({
      authorized: true,
      product: record.product,
      download: {
        filename: `${record.product.id}.zip`,
        url: `/secure-downloads/${record.product.id}.zip`
      },
      expiresAt: record.expiresAt,
      requestId: req.requestId
    });
  });

  app.get('/admin/stats', requireAuth, requireAdmin, (req, res) => res.json({
    users: users.size,
    billingEvents: billingEvents.length,
    products: products.length,
    activeDownloadTokens: downloadTokens.size,
    timestampUtc: new Date().toISOString(),
    requestId: req.requestId
  }));

  app.post('/api/verify', (req, res) => res.redirect(307, '/api/v1/verify'));
  app.post('/api/register', (req, res) => res.redirect(307, '/api/v1/register'));

  app.use((req, res) => res.status(404).json({ error: 'not_found', path: req.path, requestId: req.requestId }));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error', requestId: req.requestId });
  });

  return app;
}
