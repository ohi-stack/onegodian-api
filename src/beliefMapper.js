import { z } from 'zod';

export const beliefMapperQuestions = [
  { id: 'source', text: 'Do you believe everything comes from one source?' },
  { id: 'truth', text: 'Do you believe there is one truth behind everything?' },
  { id: 'purpose', text: 'Do you believe your life has a purpose?' },
  { id: 'connection', text: 'Do you feel connected to something greater than yourself?' },
  { id: 'identity', text: 'Have you thought about your belief identity?' }
];

export const BeliefMapperSchema = z.object({
  answers: z.array(z.object({
    questionId: z.enum(['source', 'truth', 'purpose', 'connection', 'identity']),
    answer: z.enum(['yes', 'not_sure', 'no'])
  })).length(5)
}).superRefine((value, ctx) => {
  const ids = value.answers.map((item) => item.questionId);
  if (new Set(ids).size !== 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Each Belief Mapper question must be answered exactly once.', path: ['answers'] });
  }
});

const answerScore = { yes: 2, not_sure: 1, no: 0 };

export function scoreBeliefMapper(answers) {
  const score = answers.reduce((total, item) => total + answerScore[item.answer], 0);
  let classification = 'Explorer';
  let summary = 'You are exploring questions about source, truth, purpose, connection, and identity.';

  if (score >= 8) {
    classification = 'Strong Alignment';
    summary = 'Your answers show strong alignment with the foundational ideas presented in the OneGodian framework.';
  } else if (score >= 5) {
    classification = 'Aligned';
    summary = 'Your answers show meaningful alignment with several foundational ideas presented in the OneGodian framework.';
  }

  return {
    version: 'belief-mapper-lite-v0.3',
    score,
    maxScore: 10,
    classification,
    summary,
    identityNotice: 'This result describes answer alignment only. It does not assign, convert, or declare a belief identity. Only the individual may choose how they identify.',
    dataPolicy: 'No name, email address, membership status, or account identifier is required to calculate this result.'
  };
}
