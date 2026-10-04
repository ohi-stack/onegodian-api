/* Read-only observation. No browser-held credentials or authoritative mutations. */
const page = document.querySelector('main').dataset.page;
const content = document.getElementById('page-content');
const refreshButton = document.getElementById('refresh');
const samples = [];
let refreshing = false;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function card(title, text) {
  const node = element('section', undefined, 'card');
  node.append(element('h2', title));
  if (text) node.append(element('p', text));
  return node;
}
function link(path, label) {
  const node = element('a', label);
  node.href = path;
  return node;
}
async function probe(path) {
  const started = performance.now();
  try {
    const response = await fetch(path, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Expected JSON evidence');
    return { data: await response.json(), ms: Math.round(performance.now() - started) };
  } catch (error) {
    return { error: error.message, ms: Math.round(performance.now() - started) };
  }
}
function value(result, field) {
  if (result.error) return 'Unavailable';
  const data = result.data?.[field];
  return typeof data === 'string' || typeof data === 'number' ? String(data) : 'Unknown';
}
function registryCards(manifest) {
  const grid = element('div', undefined, 'cards');
  for (const [key, title] of [['acc', 'ACC status'], ['tools', 'Tool registry'], ['integrations', 'Integrations'], ['activity', 'Platform activity'], ['oips', 'OIPS compliance']]) {
    const record = manifest.data?.registries?.[key];
    const node = card(title, record?.reason || 'Authoritative runtime evidence unavailable.');
    node.append(element('span', `Status: ${record?.status || 'Unknown'}`, 'status-label'));
    grid.append(node);
  }
  return grid;
}
function monitor(health, manifest) {
  const grid = element('div', undefined, 'grid');
  const chart = card('API response measurements', 'Browser-observed /health latency. Samples cover this tab session only.');
  const bars = element('div', undefined, 'bars');
  bars.setAttribute('role', 'img');
  bars.setAttribute('aria-label', samples.map(s => `${s.at.toLocaleTimeString()}: ${s.ok ? s.ms + ' milliseconds' : 'probe failed'}`).join('; '));
  const max = Math.max(1, ...samples.map(s => s.ms));
  for (const sample of samples) {
    const bar = element('span', undefined, sample.ok ? '' : 'failed');
    bar.style.height = `${Math.max(5, sample.ms / max * 100)}%`;
    bar.title = `${sample.at.toLocaleTimeString()}: ${sample.ok ? sample.ms + ' ms' : 'Unavailable'}`;
    bars.append(bar);
  }
  chart.append(bars, element('p', `${samples.length} observed samples · latest ${health.error ? 'unavailable' : health.ms + ' ms'}`, 'legend'));
  const activity = card('Observation activity', 'Local probe results. This is not the platform audit log.');
  const list = element('ul', undefined, 'activity');
  for (const sample of [...samples].reverse().slice(0, 8)) {
    const item = element('li');
    const time = element('time', sample.at.toLocaleTimeString());
    time.dateTime = sample.at.toISOString();
    item.append(time, element('span', sample.ok ? `/health responded in ${sample.ms} ms` : '/health evidence unavailable'));
    list.append(item);
  }
  activity.append(list);
  grid.append(chart, activity);
  content.append(grid, registryCards(manifest));
}
function endpointReference(manifest) {
  const node = card('Machine API reference', 'Existing /api/v1/* paths remain available. /v1/* aliases execute the same handlers, preserving methods, JSON bodies and queries.');
  const wrap = element('div', undefined, 'table-scroll');
  const table = element('table');
  const head = element('thead');
  const header = element('tr');
  for (const text of ['Method', 'Path', 'Purpose']) header.append(element('th', text));
  head.append(header);
  const body = element('tbody');
  const endpoints = [
    {method:'GET',path:'/health',description:'Health JSON and service identity'},
    {method:'GET',path:'/manifest',description:'Implemented surfaces and evidence boundaries'},
    ...(Array.isArray(manifest.data?.endpoints) ? manifest.data.endpoints : [])
  ];
  for (const endpoint of endpoints) {
    const row = element('tr');
    for (const field of ['method', 'path', 'description']) row.append(element('td', String(endpoint[field] || 'Unknown')));
    body.append(row);
  }
  table.append(head, body);wrap.append(table);node.append(wrap);
  node.append(element('p', 'Verification and registration remain development placeholders. A responding route does not establish production readiness.'));
  content.append(node);
}
function render(health, version, runtime, manifest) {
  content.replaceChildren();
  document.getElementById('health').textContent = health.error ? 'Unavailable' : health.data?.ok === true ? 'Responding' : 'Unknown';
  document.getElementById('version').textContent = value(version, 'version');
  document.getElementById('runtime').textContent = value(runtime, 'node');
  document.getElementById('environment').textContent = value(runtime, 'environment');
  const unavailable = [health, version, runtime, manifest].filter(result => result.error).length;
  document.getElementById('observation').textContent = `Observed ${new Date().toLocaleString()} · ${unavailable ? unavailable + ' feeds unavailable' : 'API evidence received'} · Refreshes every 30 seconds while visible.`;
  if (['/', '/status', '/admin'].includes(page)) monitor(health, manifest);
  if (page === '/status') {
    const node = card('Reported health evidence', 'API liveness is separate from integration readiness. The legacy /ready route contains development checks.');
    node.append(element('pre', health.data ? JSON.stringify(health.data, null, 2) : health.error));
    content.append(node);
  }
  if (['/docs', '/developers'].includes(page)) endpointReference(manifest);
  if (page === '/developers' || page === '/admin') {
    const node = card('Developer controls', 'Inspect machine evidence and endpoint contracts. Action execution must pass through ACC registration, permissioning, approval and audit.');
    const links = element('div', undefined, 'tags');
    links.append(link('/manifest', 'Inspect manifest'), link('/health', 'Inspect health'), link('/docs', 'API documentation'));
    node.append(links, element('p', 'Production credentials and admin access are not provisioned here. Existing authentication uses development tokens and cannot establish production authorization.'));
    content.append(node);
  }
  if (page === '/services') {
    const grid = element('div', undefined, 'cards');
    for (const [name, status] of [['API core', health.error ? 'Unavailable' : 'Health endpoint responding'], ['Belief Mapper', 'Implemented; inspect endpoint reference'], ['Algorithm evaluation', 'Implemented rule-based scoring'], ['Identity / authentication', 'Development only'], ['Commerce', 'Mock / incomplete production integration'], ['Verification', 'Development placeholder'], ['Knowledge / RAG', 'Runtime evidence unknown'], ['MCP Gateway', 'Runtime evidence unknown'], ['Analytics', 'Runtime evidence unknown']]) grid.append(card(name, status));
    content.append(grid);
  }
  if (page === '/integrations') {
    const node = card('MCP · Plugins · Adapters', 'Approved tools must be registered and permissioned through ACC. No connected integration registry feed is implemented in this API version.');
    const tags = element('div', undefined, 'tags');
    for (const name of ['WordPress plugins', 'MCP connectors', 'Provider adapters', 'Authorized services']) tags.append(element('span', name));
    node.append(tags);content.append(node, registryCards(manifest));
  }
  if (page === '/' || page === '/admin') {
    const node = card('OIPS capability chain', 'Instructions / Rules → Knowledge / RAG → Skills → Tools / Actions → Tests / Verification');
    node.append(element('p', 'Compliance status: Unknown. Provider-independent contracts and topology are not evidence of a working compliance validator.'));
    content.append(node);
  }
}
async function refresh() {
  if (refreshing) return;
  refreshing = true;refreshButton.disabled = true;
  try {
    const [health, version, runtime, manifest] = await Promise.all(['/health', '/version', '/api/status', '/manifest'].map(probe));
    samples.push({ at: new Date(), ms: health.ms, ok: !health.error && health.data?.ok === true });
    if (samples.length > 24) samples.shift();
    render(health, version, runtime, manifest);
  } finally { refreshing = false;refreshButton.disabled = false; }
}
refreshButton.addEventListener('click', refresh);
refresh();
setInterval(() => { if (!document.hidden) refresh(); }, 30000);
