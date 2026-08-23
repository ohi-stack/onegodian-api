import express from 'express';
import { createApp } from './app.js';
import { createBeliefMapperRouter } from './beliefMapperRouter.js';

export function createRootApp() {
  const root = express();

  root.use('/api/v1/belief-mapper', createBeliefMapperRouter());
  root.use(createApp());

  return root;
}
