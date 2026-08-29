import express, { Application } from 'express';
import cors from 'cors';
import apiRouter from './routes';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Mount API Routes
  app.use('/api', apiRouter);

  return app;
}

export default createApp();
