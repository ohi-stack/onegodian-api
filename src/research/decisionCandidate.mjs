// Research-only prototype. Inputs are assertions, not independently verified evidence.
export function assessDecision(input) {
  if (!input || !Array.isArray(input.options) || input.options.length === 0 || input.options.length > 12) throw new TypeError('one to twelve options required');
  const ids = new Set();
  const options = input.options.map(option => {
    if (!option || typeof option.id !== 'string' || !option.id || ids.has(option.id) || !Array.isArray(option.constraints) || !Array.isArray(option.evidence)) throw new TypeError('invalid option');
    ids.add(option.id);
    if (!option.constraints.every(c => c && typeof c.id === 'string' && ['pass', 'fail', 'unknown'].includes(c.status))) throw new TypeError('invalid constraint');
    if (!option.evidence.every(e => e && typeof e.reference === 'string' && e.reference.trim() && ['support', 'conflict'].includes(e.relation))) throw new TypeError('invalid evidence');
    const failed = option.constraints.some(c => c.status === 'fail');
    const uncertain = option.constraints.length === 0 || option.constraints.some(c => c.status === 'unknown');
    const support = option.evidence.some(e => e.relation === 'support');
    const conflict = option.evidence.some(e => e.relation === 'conflict');
    return { id: option.id, status: failed ? 'blocked' : uncertain || !support || conflict ? 'needs_review' : 'eligible_for_review' };
  });
  return { version: 'research-candidate-0.1', disposition: 'human_review_required', options, selection: null, executed: false, evidenceNote: 'Evidence and constraint statuses are caller assertions, not verified findings.' };
}
