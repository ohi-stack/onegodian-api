/* ONEGODIAN administration: observations only, no browser secrets or mutation. */
const root = document.querySelector('#admin-main');
const page = root.dataset.page;
const content = document.querySelector('#admin-content');
const refreshButton = document.querySelector('#refresh');
const samples = [];
let inFlight = false;

function el(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  if (cls) node.className = cls;
  return node;
}
function panel(title, description) {
  const box = el('section', undefined, 'card admin-panel');
  box.append(el('h2', title));
  if (description) box.append(el('p', description));
  return box;
}
function href(path, label) {
  const a = el('a', label, 'admin-text-link');
  a.href = path;
  return a;
}
function line(label, value) {
  const row = el('div', undefined, 'admin-data-row');
  row.append(el('span', label), el('strong', value));
  return row;
}
function status(value) {
  return typeof value === 'string' && value.trim() ? value : 'Unknown';
}
async function probe(path) {
  const start = performance.now();
  try {
    const response = await fetch(path, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Invalid evidence content type');
    const data = await response.json();
    return { data, ms: Math.round(performance.now() - start) };
  } catch (_) {
    return { error: 'Endpoint unavailable', ms: Math.round(performance.now() - start) };
  }
}
function latencyPanel() {
  const box = panel('Response latency', 'Browser-measured /health response times. This tab only; not historical uptime.');
  const bars = el('div', undefined, 'admin-latency');
  bars.setAttribute('role', 'img');
  bars.setAttribute('aria-label', samples.map(s => s.at.toLocaleTimeString() + ': ' + (s.ok ? s.ms + ' ms' : 'failed')).join(', '));
  const max = Math.max(1, ...samples.map(s => s.ms));
  for (const item of samples) {
    const bar = el('span', undefined, item.ok ? 'latency-good' : 'latency-error');
    bar.style.height = Math.max(7, (item.ms / max) * 100) + '%';
    bar.title = item.at.toLocaleTimeString() + ': ' + (item.ok ? item.ms + ' milliseconds' : 'unavailable');
    bars.append(bar);
  }
  box.append(bars, el('p', samples.length + ' measured probe(s)', 'chart-note'));
  return box;
}
function recentObservations() {
  const box = panel('Recent observations', 'Browser observations only. These are not audit events or system-wide logs.');
  const list = el('ul', undefined, 'admin-observations');
  for (const item of [...samples].reverse().slice(0, 7)) {
    const entry = el('li');
    const time = el('time', item.at.toLocaleTimeString());
    time.dateTime = item.at.toISOString();
    entry.append(time, el('span', item.ok ? 'Health responded in ' + item.ms + ' ms' : 'Health probe unavailable'));
    list.append(entry);
  }
  box.append(list);
  return box;
}
function evidenceRegistries(manifest, filter) {
  const grid = el('div', undefined, 'admin-status-grid');
  const names = [
    ['acc', 'ACC control plane'],
    ['tools', 'Tool registry'],
    ['integrations', 'Integrations'],
    ['activity', 'Platform events'],
    ['oips', 'OIPS assessments']
  ];
  for (const [key, name] of names) {
    if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;
    const record = manifest.data?.registries?.[key];
    const tile = panel(name, status(record?.reason || 'No authoritative evidence reported.'));
    tile.append(el('span', status(record?.status), 'admin-state'));
    grid.append(tile);
  }
  return grid;
}
function registrySection(manifest) {
  const wrap = el('section', undefined, 'admin-section');
  wrap.append(el('h2', 'Control-plane evidence'));
  wrap.append(el('p', 'Each card reflects the manifest; Unknown means unconnected, not operational.'));
  const search = el('input', undefined, 'admin-filter');
  search.type = 'search';
  search.placeholder = 'Filter registry cards';
  search.setAttribute('aria-label', 'Filter registry cards');
  const results = el('div');
  const apply = () => results.replaceChildren(evidenceRegistries(manifest, search.value));
  search.addEventListener('input', apply);
  apply();
  wrap.append(search, results);
  return wrap;
}
function evidenceLinks() {
  const box = panel('Evidence & developer references', 'Read-only machine endpoints. Execution remains governed by human approval, ACC and service authorization.');
  const links = el('div', undefined, 'admin-link-row');
  for (const [path, label] of [
    ['/health', 'Health JSON ↗'],
    ['/manifest', 'Platform manifest ↗'],
    ['/docs', 'API reference ↗'],
    ['/integrations', 'Integrations ↗']
  ]) links.append(href(path, label));
  box.append(links);
  return box;
}
function unavailable(name, description, manifestKey, manifest) {
  const box = panel(name, description);
  const record = manifest.data?.registries?.[manifestKey];
  box.append(line('Authoritative status', status(record?.status || 'Not reported')));
  box.append(line('Data source', record ? '/manifest' : 'No integrated registry feed'));
  box.append(el('p', 'No operational counts, actions, or successful integrations are inferred from an empty or unknown feed.', 'admin-small'));
  return box;
}
function detailsPanel(title, rows) {
  const box = panel(title);
  for (const [key, value] of rows) box.append(line(key, status(value)));
  return box;
}
function render(snapshot) {
  const { health, version, runtime, manifest, ready } = snapshot;
  const healthValue = health.error ? 'Unavailable' : health.data?.ok === true ? 'Responding' : 'Unknown';
  document.querySelector('#health').textContent = healthValue;
  document.querySelector('#version').textContent = status(version.data?.version);
  document.querySelector('#runtime').textContent = status(runtime.data?.node);
  document.querySelector('#environment').textContent = status(runtime.data?.environment);
  const missing = [health, version, runtime, manifest].filter(result => result.error).length;
  document.querySelector('#observation').textContent = 'Observed ' + new Date().toLocaleString() + ' · ' +
    (missing ? missing + ' machine feed(s) unavailable' : 'API evidence received') + ' · Auto-refresh every 30 seconds while visible.';
  content.replaceChildren();
  if (page === '/admin') {
    const grid = el('div', undefined, 'admin-two-columns');
    grid.append(latencyPanel(), recentObservations());
    content.append(grid, registrySection(manifest), evidenceLinks());
  } else if (page === '/admin/health') {
    const grid = el('div', undefined, 'admin-two-columns');
    grid.append(detailsPanel('Health record', [
      ['Liveness', healthValue],
      ['Uptime (process)', typeof health.data?.uptimeSeconds === 'number' ? health.data.uptimeSeconds + ' seconds' : 'Unavailable'],
      ['Observation source', '/health'],
      ['Observed at (UTC)', status(health.data?.timestampUtc)]
    ]), detailsPanel('Readiness disclosure', [
      ['Legacy /ready says', ready.error ? 'Unavailable' : String(ready.data?.ready)],
      ['Interpretation', 'Development checks only'],
      ['Production integration readiness', 'Not established']
    ]));
    content.append(grid, latencyPanel());
  } else if (page === '/admin/sites') {
    content.append(unavailable('Connected properties', 'Approved properties, sync state, connector versions, and signed node health belong to the ecosystem property registry.', 'integrations', manifest));
  } else if (page === '/admin/plugins') {
    content.append(unavailable('WordPress plugin registry', 'Installed plugins, deployment versions, sync telemetry, and manifests require authenticated site connectors.', 'integrations', manifest));
  } else if (page === '/admin/services') {
    content.append(detailsPanel('Implemented API surfaces', [
      ['Platform runtime', healthValue],
      ['Platform version', status(version.data?.version)],
      ['Belief Mapper', 'Development API implemented'],
      ['Alignment evaluator', 'Development API implemented'],
      ['Financial processing', 'Production readiness unverified'],
      ['Verification', 'Development placeholder']
    ]), evidenceLinks());
  } else if (page === '/admin/tools') {
    content.append(unavailable('Tools and actions', 'A registered, scope-filtered tool inventory must come from the authoritative ACC tool gateway.', 'tools', manifest));
  } else if (page === '/admin/mcp') {
    content.append(unavailable('MCP gateway', 'Authorized MCP tools, scopes, registered clients, and connector status must be supplied by authoritative infrastructure.', 'integrations', manifest));
  } else if (page === '/admin/adapters') {
    content.append(unavailable('Provider adapters', 'Adapter health and capabilities require explicit API feed integration; this UI never assumes a connected provider.', 'integrations', manifest));
  } else if (page === '/admin/events') {
    content.append(unavailable('Event bus & queues', 'Queue depth, delivery failures and event history require a persistent event service.', 'activity', manifest), recentObservations());
  } else if (page === '/admin/audit') {
    content.append(unavailable('Audit records', 'No platform audit store is attached. Browser observations are not audit evidence.', 'activity', manifest));
  } else if (page === '/admin/oips') {
    content.append(unavailable('OIPS capability chain', 'Instructions / Rules → Knowledge / RAG → Skills → Tools / Actions → Tests / Verification. No compliance pass is inferred.', 'oips', manifest));
  } else if (page === '/admin/security') {
    content.append(detailsPanel('Administrative access boundary', [
      ['UI authorization', 'Development credentials only'],
      ['Production access', 'Disabled until independently verified authentication/RBAC'],
      ['Browser-held platform credentials', 'None'],
      ['Action scope', 'Read-only observation']
    ]));
  } else if (page === '/admin/settings') {
    content.append(detailsPanel('Configuration evidence', [
      ['Service', status(manifest.data?.name)],
      ['Runtime owner', status(manifest.data?.runtimeOwner)],
      ['API version', status(manifest.data?.version)],
      ['Execution authority', status(manifest.data?.executionAuthority)],
      ['Edit capabilities', 'Not enabled in this UI']
    ]), evidenceLinks());
  }
}
async function refresh() {
  if (inFlight) return;
  inFlight = true;
  refreshButton.disabled = true;
  try {
    const [health, version, runtime, manifest, ready] = await Promise.all(
      ['/health', '/version', '/api/status', '/manifest', '/ready'].map(probe)
    );
    samples.push({ at: new Date(), ms: health.ms, ok: !health.error && health.data?.ok === true });
    if (samples.length > 24) samples.shift();
    render({ health, version, runtime, manifest, ready });
  } finally {
    inFlight = false;
    refreshButton.disabled = false;
  }
}
const toggle = document.querySelector('#admin-menu-toggle');
const sidebar = document.querySelector('#admin-sidebar');
toggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('admin-nav-open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});
refreshButton.addEventListener('click', refresh);
refresh();
setInterval(() => { if (!document.hidden) refresh(); }, 30000);
