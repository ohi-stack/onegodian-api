# OneGodian API

Node API service for `api.OneGodian.org`.

## Current status

Version: `0.2.0`

This repo is the first production-oriented API surface for the OneGodian web/application layer. It is intentionally small and deterministic so it can support paid membership, Belief Mapper, AI System Prompt, Algorithm Starter Kit, and future Protocol API work without becoming ungoverned infrastructure.

## Runtime requirements

- Node.js `>=20`
- npm

## Local development

```bash
npm install
npm run dev
```

Default port: `3000`.

## Scripts

```bash
npm start      # run production server
npm run dev    # run watch mode
npm test       # run Node test runner
npm run check  # syntax-check server/app entrypoints
npm run health # call /health on a running server
```

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | runtime environment | `development` |
| `CORS_ORIGIN` | allowed CORS origin | `*` |

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | service identity |
| `GET` | `/health` | healthcheck |
| `GET` | `/api/status` | runtime status |
| `GET` | `/api/v1/profile` | OneGodian API profile |
| `POST` | `/api/v1/alignment/evaluate` | evaluate candidate options under the OneGodian Algorithm decision rule |
| `POST` | `/api/v1/verify` | development verification placeholder |
| `POST` | `/api/v1/register` | development registration placeholder |

Legacy paths `/api/verify` and `/api/register` are preserved with `307` redirects to the v1 endpoints.

## Production readiness rule

A feature should not be called operational until it is:

1. implemented,
2. versioned,
3. documented,
4. repeatable,
5. logged,
6. testable.

## Next production tasks

1. Add automated tests for `/health`, `/api/v1/profile`, `/api/v1/alignment/evaluate`, and validation failures.
2. Add OpenAPI documentation.
3. Replace development placeholder verification/registration with persistent storage.
4. Add request-level auth for protected mutation endpoints.
5. Add deployment config for the selected Node host.
