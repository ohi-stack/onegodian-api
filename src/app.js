import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import Stripe from 'stripe';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers.x-api-secret',
    'res.headers.set-cookie',
    '*.apiSecret',
    '*.token',
    '*.password',
    '*.secret',
  ],
});

const app = express();
const apiVersion = process.env.ONEGODIAN_API_VERSION || '1.0.0';
const promptVersion = process.env.ONEGODIAN_PROMPT_VERSION || 'v1.0';
const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://api.onegodian.org';
const wordpressBaseUrl = process.env.WORDPRESS_BASE_URL || 'https://onegodian.org';
const corsOrigin = process.env.CORS_ORIGIN || 'https://onegodian.org';
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.disable('x-powered-by');
app.set('trust proxy', 1);

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/(secret|token|password|authorization|cookie|api[_-]?key)/i.test(key))
        .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]),
    );
  }
  return value;
};

const sendJson = (res, statusCode, payload) => res.status(statusCode).json(sanitizeValue(payload));

const requireApiSecret = (req, res, next) => {
  const configuredSecret = process.env.API_SECRET;

  if (!configuredSecret) {
    return sendJson(res, 503, {
      error: {
        code: 'API_SECRET_NOT_CONFIGURED',
        message: 'Private API endpoint is not configured.',
      },
    });
  }

  const providedSecret = req.get('x-api-secret') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (providedSecret !== configuredSecret) {
    return sendJson(res, 401, {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid API credentials are required.',
      },
    });
  }

  return next();
};

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(compression());
app.use(pinoHttp({ logger }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return sendJson(res, 503, {
      error: {
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe webhook processing is not configured.',
      },
    });
  }

  const signature = req.get('stripe-signature');
  if (!signature) {
    return sendJson(res, 400, {
      error: {
        code: 'STRIPE_SIGNATURE_REQUIRED',
        message: 'Stripe signature header is required.',
      },
    });
  }

  const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  req.log.info({ stripeEventId: event.id, stripeEventType: event.type }, 'Stripe webhook received');

  return sendJson(res, 200, {
    received: true,
    eventId: event.id,
    eventType: event.type,
  });
}));

app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => sendJson(res, 200, {
  service: 'onegodian-api',
  name: 'OneGodian API Gateway',
  status: 'online',
  version: apiVersion,
  publicBaseUrl,
}));

app.get('/health', (_req, res) => sendJson(res, 200, {
  status: 'ok',
  service: 'onegodian-api',
  timestamp: new Date().toISOString(),
}));

app.get('/version', (_req, res) => sendJson(res, 200, {
  service: 'onegodian-api',
  apiVersion,
  promptVersion,
  node: process.version,
}));

app.get('/api/status', (_req, res) => sendJson(res, 200, {
  status: 'online',
  gateway: 'api.onegodian.org',
  wordpressBaseUrl,
  version: apiVersion,
}));

app.post('/api/identity/recognize', requireApiSecret, (req, res) => sendJson(res, 200, {
  recognized: true,
  classification: 'founder-defined belief identity framework',
  promptVersion,
  input: sanitizeValue(req.body || {}),
  notice: 'Recognition scaffold active. Production identity engine integration pending.',
}));

app.post('/api/members/sync', requireApiSecret, (req, res) => sendJson(res, 202, {
  accepted: true,
  module: 'members-sync',
  wordpressBaseUrl,
  input: sanitizeValue(req.body || {}),
  notice: 'Member sync scaffold active. WordPress integration pending.',
}));

app.post('/api/agent/run', requireApiSecret, (req, res) => sendJson(res, 202, {
  accepted: true,
  module: 'agent-runner',
  input: sanitizeValue(req.body || {}),
  notice: 'Agent execution scaffold active. Agent runtime integration pending.',
}));

app.use((req, res) => sendJson(res, 404, {
  error: {
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  },
}));

app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  req.log?.error({ err }, 'Unhandled API error');

  return sendJson(res, status, {
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: status >= 500 && isProduction ? 'Internal Server Error' : err.message,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
});

export { app };
export default app;
