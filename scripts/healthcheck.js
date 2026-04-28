const baseUrl = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
const url = new URL('/health', baseUrl);

const response = await fetch(url, { headers: { 'accept': 'application/json' } });
if (!response.ok) {
  throw new Error(`Healthcheck failed with HTTP ${response.status}`);
}

const body = await response.json();
if (!body.ok) {
  throw new Error('Healthcheck response did not return ok=true');
}

console.log(`Healthcheck passed for ${url.toString()}`);
