import { Router } from 'express';

/**
 * OneGodianese bridge: read-only composition, not an enrollment or membership authority.
 * The API host MUST inject production-verified identity and authoritative adapters.
 */
export function createOneGodianeseBridge({
  authenticate,
  getMembership,
  getCourseAccess,
  getCourseMapping
} = {}) {
  const router = Router();

  router.get('/access', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (![authenticate, getMembership, getCourseAccess, getCourseMapping].every(fn => typeof fn === 'function')) {
      return res.status(503).json({ error: 'onegodianese_bridge_unconfigured', requestId: req.requestId });
    }

    try {
      const principal = await authenticate(req);
      if (!principal || typeof principal.subject !== 'string' || !principal.subject.trim()
        || !principal.scopes?.includes('onegodianese:access:read')) {
        return res.status(401).json({ error: 'unauthorized', requestId: req.requestId });
      }
      // Never accept a user identifier from query params or client-submitted JSON.
      const slug = req.query.slug;
      if (typeof slug !== 'string' || !/^[a-z0-9-]{1,100}$/.test(slug)) {
        return res.status(400).json({ error: 'invalid_term_slug', requestId: req.requestId });
      }
      const mapping = await getCourseMapping(slug);
      if (!mapping || !Number.isSafeInteger(mapping.courseId) || mapping.courseId <= 0) {
        return res.status(404).json({ error: 'term_course_mapping_not_found', requestId: req.requestId });
      }

      const [member, course] = await Promise.all([
        getMembership(principal.subject),
        getCourseAccess(principal.subject, mapping.courseId)
      ]);
      if (!member || !course || typeof member.active !== 'boolean'
          || typeof course.enrolled !== 'boolean' || typeof course.canAccess !== 'boolean') {
        return res.status(503).json({ error: 'authoritative_state_unavailable', requestId: req.requestId });
      }

      // This route reports authoritative LMS decisions. It never grants access or
      // changes enrollment, quiz answers, lesson completion or certificate records.
      return res.json({
        term: slug,
        member: { active: member.active },
        learning: { enrolled: course.enrolled, canAccess: course.canAccess },
        courseId: mapping.courseId,
        requestId: req.requestId
      });
    } catch {
      // No partial private state disclosure when an upstream system is unavailable.
      return res.status(503).json({ error: 'authoritative_state_unavailable', requestId: req.requestId });
    }
  });
  return router;
}
