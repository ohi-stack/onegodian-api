import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessDecision } from '../../src/research/decisionCandidate.mjs';
const option = { id: 'a', constraints: [{ id: 'permission', status: 'pass' }], evidence: [{ reference: 'source-1', relation: 'support' }] };
test('returns review not automatic selection or execution', () => { const r = assessDecision({options:[option]}); assert.equal(r.options[0].status,'eligible_for_review'); assert.equal(r.selection,null); assert.equal(r.executed,false); });
test('hard constraint failure blocks despite favorable language', () => { const r = assessDecision({options:[{...option, id:'truth dignity clarity', constraints:[{id:'authorization',status:'fail'}]}]}); assert.equal(r.options[0].status,'blocked'); });
test('unknowns, missing evidence and contradictions require review', () => { for(const o of [{...option,constraints:[]},{...option,evidence:[]},{...option,evidence:[...option.evidence,{reference:'source-2',relation:'conflict'}]}]) assert.equal(assessDecision({options:[o]}).options[0].status,'needs_review'); });
test('rejects malformed input and duplicate identifiers', () => { assert.throws(()=>assessDecision({options:[option,option]})); assert.throws(()=>assessDecision({options:[{...option,evidence:[{reference:'',relation:'support'}]}]})); });
