import express from 'express';
import { fileURLToPath } from 'node:url';

const pages = {
  '/': ['Platform overview', 'O-H-I Command Center'],
  '/status': ['System status', 'Runtime evidence'],
  '/docs': ['API documentation', 'Endpoint reference'],
  '/developers': ['Developer portal', 'Developer access'],
  '/services': ['OneGodian services', 'Service inventory'],
  '/integrations': ['MCP · Plugins · Adapters', 'Platform integrations']
};
const nav = Object.entries(pages).map(([path, [label]]) => ({ path, label }));

export function platformManifest(version) {
  return {
    name: 'onegodian-api', version, runtimeOwner: 'ohi-stack/onegodian-api',
    console: { name: 'O-H-I Command Center', maturity: 'In development', routes: Object.keys(pages) },
    machine: { health: '/health', manifest: '/manifest', version: '/version', runtime: '/api/status', api: '/v1', legacyApi: '/api/v1' },
    endpoints: [
      ['GET', '/v1/profile', 'Platform profile'],
      ['POST', '/v1/alignment/evaluate', 'Rule-based alignment evaluation'],
      ['GET', '/v1/belief-mapper/questions', 'Belief Mapper questions'],
      ['POST', '/v1/belief-mapper/evaluate', 'Belief Mapper evaluation'],
      ['POST', '/v1/verify', 'Development verification placeholder'],
      ['POST', '/v1/register', 'Development registration placeholder']
    ].map(([method, path, description]) => ({ method, path, description })),
    executionAuthority: 'ACC',
    authorityBoundary: 'Human → O-H-I Command Center → ACC authorization → OneGodian API → services/tools/connectors',
    registries: Object.fromEntries(['acc', 'tools', 'integrations', 'activity', 'oips'].map(name => [name, {
      status: 'unknown', reason: 'No authoritative runtime feed is implemented in this repository.'
    }])),
    authentication: { status: 'development_only', productionReady: false },
    limitations: ['In-memory development authentication; admin assignment is not production RBAC.', 'Readiness route does not establish production integration readiness.', 'No OIPS compliance certification or external service-health claim.']
  };
}

export function renderConsole(path = '/') {
  const [label, title] = pages[path] || ['Authorized administration', 'Platform administration'];
  const links = nav.map(item => `<a href="${item.path}"${item.path === path ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#070607"><title>${title} · O-H-I Command Center</title><link rel="stylesheet" href="/console-assets/console.css"><script src="/console-assets/console.js" defer></script></head>
<body><header><a class="brand" href="/"><span class="emblem" aria-hidden="true">O</span><span>ONEGODIAN<small>O-H-I COMMAND CENTER™</small></span></a><nav aria-label="Public platform navigation">${links}</nav><a class="button secondary" href="/admin">Administration</a></header>
<main data-page="${path}"><div class="kicker">ONEGODIAN, LLC · PLATFORM CONSOLE</div><section class="heading"><div><p class="eyebrow">${label}</p><h1>${path === '/' ? 'O-H-I Command Center' : title}</h1><p>Shared API infrastructure. Governed platform controls. Evidence-based status.</p></div><button id="refresh" class="button" type="button">Refresh evidence</button></section>
<p id="observation" role="status" aria-live="polite">Loading runtime evidence…</p><noscript><p>Live monitoring requires JavaScript. Machine endpoints remain available at <a href="/health">/health</a> and <a href="/manifest">/manifest</a>.</p></noscript>
<section class="metrics" aria-label="API runtime"><div><span>API health</span><strong id="health">Unknown</strong></div><div><span>API version</span><strong id="version">Unknown</strong></div><div><span>Runtime</span><strong id="runtime">Unknown</strong></div><div><span>Environment</span><strong id="environment">Unknown</strong></div></section>
<div id="page-content"></div>
<section class="card topology"><div class="card-heading"><p class="eyebrow">Authority boundary</p><h2>System topology</h2></div><ol><li><b>Human</b><span>Decisions and approval</span></li><li><b>O-H-I Console</b><span>Evidence and observation</span></li><li><b>ACC</b><span>Registration and permissioning</span></li><li><b>OneGodian API</b><span>Authorized execution</span></li><li><b>Services</b><span>Tools and connectors</span></li></ol><p class="note">Architecture contract. Live connectivity requires runtime evidence. The browser does not grant execution authority.</p></section>
<footer><span>ONEGODIAN, LLC · O-H-I Command Center™</span><a href="/health">Health JSON</a><a href="/manifest">Platform manifest</a><span>Runtime owner: onegodian-api</span></footer></main></body></html>`;
}

export function createConsoleRouter() {
  const router = express.Router();
  router.use('/console-assets', express.static(fileURLToPath(new URL('../public/console/', import.meta.url)), { index: false, redirect: false, dotfiles: 'deny', maxAge: 0 }));
  for (const path of Object.keys(pages)) {
    router.get(path, (req, res) => res.set('Cache-Control', 'no-store').type('html').send(renderConsole(path)));
  }
  return router;
}
