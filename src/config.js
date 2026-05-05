import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  HEALTHCHECK_URL: z.string().url().optional(),
  API_BRIDGE_KEY: z.string().min(12).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120)
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid OneGodian API environment configuration');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

function parseOrigins(env) {
  const value = env.CORS_ORIGINS || env.CORS_ORIGIN || '';
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  ...parsed.data,
  version: '0.4.0',
  serviceName: 'onegodian-api',
  publicServiceName: 'api.OneGodian.org',
  corsOrigins: parseOrigins(parsed.data),
  stripeConfigured: Boolean(parsed.data.STRIPE_SECRET_KEY),
  databaseConfigured: Boolean(parsed.data.DATABASE_URL),
  apiBridgeEnabled: Boolean(parsed.data.API_BRIDGE_KEY)
};
