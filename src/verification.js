const VERIFIED_STATUS = 'verified';

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function selectEvidence(payload = {}) {
  return {
    recordId: payload.recordId || payload.record_id || null,
    odinId: payload.odinId || payload.odin_id || null,
    hash: payload.hash || payload.sha256 || payload.sha256Hash || null,
    status: normalizeStatus(payload.status),
    version: payload.version || null,
    issuedAt: payload.issuedAt || payload.issued_at || null,
    verifiedAt: payload.verifiedAt || payload.verified_at || null,
    supersededBy: payload.supersededBy || payload.superseded_by || null,
    revokedAt: payload.revokedAt || payload.revoked_at || null
  };
}

export function createVerificationService({
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = 5000
} = {}) {
  const verifyUrl = String(env.OBP1_VERIFY_URL || '').trim();
  const apiKey = String(env.OBP1_API_KEY || '').trim();

  function status() {
    return {
      service: 'OBP-1',
      capability: 'verification',
      configured: Boolean(verifyUrl),
      mode: verifyUrl ? 'authoritative-upstream' : 'fail-closed',
      productionStatus: verifyUrl ? 'under_review' : 'in_development',
      verifiedClaimsEnabled: Boolean(verifyUrl)
    };
  }

  async function verify(input, { requestId } = {}) {
    if (!verifyUrl) {
      return {
        httpStatus: 503,
        body: {
          verified: false,
          status: 'unavailable',
          reason: 'obp1_authority_not_configured',
          authority: 'OBP-1',
          evidence: null,
          requestId: requestId || null
        }
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        'content-type': 'application/json',
        'accept': 'application/json'
      };
      if (apiKey) headers.authorization = `Bearer ${apiKey}`;
      if (requestId) headers['x-request-id'] = requestId;

      const response = await fetchImpl(verifyUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
        signal: controller.signal
      });

      if (!response.ok) {
        return {
          httpStatus: response.status >= 500 ? 502 : response.status,
          body: {
            verified: false,
            status: 'unavailable',
            reason: 'obp1_upstream_rejected_request',
            authority: 'OBP-1',
            upstreamStatus: response.status,
            evidence: null,
            requestId: requestId || null
          }
        };
      }

      const payload = await response.json();
      const evidence = selectEvidence(payload);
      const revoked = Boolean(payload.revoked || evidence.revokedAt);
      const superseded = Boolean(payload.superseded || evidence.supersededBy);
      const authoritativeVerified =
        payload.verified === true &&
        evidence.status === VERIFIED_STATUS &&
        !revoked &&
        !superseded;

      return {
        httpStatus: 200,
        body: {
          verified: authoritativeVerified,
          status: authoritativeVerified
            ? 'verified'
            : revoked
              ? 'revoked'
              : superseded
                ? 'superseded'
                : evidence.status || 'unverified',
          reason: authoritativeVerified ? null : 'authoritative_verification_not_established',
          authority: 'OBP-1',
          evidence,
          requestId: requestId || null
        }
      };
    } catch (error) {
      return {
        httpStatus: 502,
        body: {
          verified: false,
          status: 'unavailable',
          reason: error?.name === 'AbortError' ? 'obp1_upstream_timeout' : 'obp1_upstream_error',
          authority: 'OBP-1',
          evidence: null,
          requestId: requestId || null
        }
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return { status, verify };
}
