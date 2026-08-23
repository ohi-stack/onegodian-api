import express from 'express';
import { BeliefMapperSchema, beliefMapperQuestions, scoreBeliefMapper } from './beliefMapper.js';

export function createBeliefMapperRouter() {
  const router = express.Router();

  router.get('/questions', (req, res) => {
    res.json({
      version: 'belief-mapper-lite-v0.3',
      questions: beliefMapperQuestions,
      answers: ['yes', 'not_sure', 'no'],
      privacy: 'No account or personally identifying information is required to use this endpoint.'
    });
  });

  router.post('/evaluate', express.json({ limit: '32kb' }), (req, res) => {
    const parsed = BeliefMapperSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        error: 'invalid_belief_mapper_payload',
        details: parsed.error.flatten()
      });
    }

    return res.json(scoreBeliefMapper(parsed.data.answers));
  });

  return router;
}
