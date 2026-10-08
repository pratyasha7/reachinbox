import dotenv from 'dotenv';
import { Redis } from 'ioredis';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5000,
  esNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/oauth/callback',
  },
};

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});
