// Protected administrator interface. Authorization is enforced by app.js before this
// renderer is invoked; this module grants no capabilities or additional permissions.
export const adminPages = Object.freeze({
  '/admin': ['Overview', 'Platform dashboard'],
  '/admin/health': ['API health', 'Health & readiness'],
  '/admin/sites': ['Properties', 'Connected properties'],
  '/admin/plugins': ['Plugins', 'Plugin registry'],
  '/admin/services': ['Services', 'Service inventory'],
  '/admin/tools': ['Tools', 'Tool registry'],
  '/admin/mcp': ['MCP gateway', 'MCP & integrations'],
  '/admin/adapters': ['Adapters', 'Provider adapters'],
  '/admin/events': ['Events', 'Event activity'],
  '/admin/audit': ['Audit', 'Audit evidence'],
  '/admin/oips': ['OIPS', 'Portability & verification'],
  '/admin/security': ['Security', 'Security overview'],
  '/admin/settings': ['Settings', 'Platform configuration']
});

function navigation(path) {
  return Object.entries(adminPages).map(([route, [label]]) =>
    '<a href="' + route + '"' + (route === path ? ' aria-current="page"' : '') + '>' + label + '</a>'
  ).join('');
}

export function renderAdminConsole(path = '/admin') {
  const item = adminPages[path];
  if (!item) throw new Error('Unknown admin console route');
  const [label, heading] = item;
  return [
    '<!doctype html><html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="theme-color" content="#080912">',
    '<meta name="robots" content="noindex,nofollow,noarchive">',
    '<title>' + heading + ' · ONEGODIAN Platform Admin</title>',
    '<link rel="stylesheet" href="/console-assets/console.css">',
    '<link rel="stylesheet" href="/console-assets/admin.css">',
    '<script src="/console-assets/admin.js" defer></script></head>',
    '<body class="admin-surface"><a class="skip-link" href="#admin-main">Skip to dashboard</a>',
    '<div class="admin-layout"><aside class="admin-sidebar" id="admin-sidebar" aria-label="Administrative navigation">',
    '<a class="admin-brand" href="/admin"><span class="emblem" aria-hidden="true">O</span><span>ONEGODIAN<small>O-H-I PLATFORM CORE</small></span></a>',
    '<p class="admin-nav-heading">COMMAND CENTER</p>',
    '<nav class="admin-nav" aria-label="Platform administration">' + navigation(path) + '</nav>',
    '<div class="sidebar-bottom"><span class="status-dot" aria-hidden="true"></span> Read-only observation <small>Human approval governs execution</small></div>',
    '</aside><div class="admin-workspace"><header class="admin-topbar">',
    '<button class="admin-mobile-toggle" id="admin-menu-toggle" type="button" aria-controls="admin-sidebar" aria-expanded="false">☰ <span>Menu</span></button>',
    '<div class="admin-breadcrumb"><span>ONEGODIAN, LLC</span><span aria-hidden="true">/</span><strong>' + label + '</strong></div>',
    '<div class="admin-top-actions"><span class="admin-preview">Development-only access</span><a class="admin-exit" href="/">Public site ↗</a></div>',
    '</header><main class="admin-main" id="admin-main" data-page="' + path + '">',
    '<div class="admin-heading"><div><p class="eyebrow">O-H-I COMMAND CENTER™ · ADMINISTRATION</p><h1>' + heading + '</h1>',
    '<p>Live API observations and evidence-based controls. No unverified production claims.</p></div>',
    '<button class="button" type="button" id="refresh">↻ Refresh data</button></div>',
    '<p class="admin-observation" id="observation" role="status" aria-live="polite">Loading authoritative API evidence…</p>',
    '<noscript><p>This read-only dashboard needs JavaScript to display API observations.</p></noscript>',
    '<section class="metrics admin-kpis" aria-label="Runtime indicators">',
    '<div><span>API health</span><strong id="health">Unknown</strong><small>Source: /health</small></div>',
    '<div><span>API version</span><strong id="version">Unknown</strong><small>Source: /version</small></div>',
    '<div><span>Node runtime</span><strong id="runtime">Unknown</strong><small>Source: /api/status</small></div>',
    '<div><span>Environment</span><strong id="environment">Unknown</strong><small>Source: /api/status</small></div>',
    '</section><div id="admin-content"></div>',
    '<footer class="admin-footer"><span>ONEGODIAN, LLC · O-H-I Command Center™</span>',
    '<span>Display does not confer execution authority</span><a href="/manifest">Machine manifest ↗</a></footer>',
    '</main></div></div></body></html>'
  ].join('\n');
}
