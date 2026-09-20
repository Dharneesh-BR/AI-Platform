export const QUEUE_NAMES = {
  discovery: 'discovery',
  aiExecution: 'ai-execution',
  documentProcessing: 'document-processing',
  embeddings: 'embeddings',
  research: 'research',
  reportGeneration: 'report-generation',
  notifications: 'notifications',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const DEFAULT_QUEUE_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 30_000,
  },
  removeOnComplete: 1000,
  removeOnFail: 5000,
} as const;
