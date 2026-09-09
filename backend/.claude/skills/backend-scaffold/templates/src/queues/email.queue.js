import { Queue } from 'bullmq';
import { connection } from '../config/redis.js';

// Producer side of the email queue. Services import the enqueue helpers
// below — never `new Queue(...)` of their own, and never send an email
// inline. An invitation POST must return as soon as the row is written; SMTP
// latency and retries belong on this queue, not in the request.

const EMAIL_QUEUE_NAME = 'email-queue';

const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 2000,
  },
});

// Queues a workspace invitation email. The invitation row must already be
// committed before this is called: the worker reads it back by id, so
// enqueueing first would race a job against its own data.
const enqueueInvitationEmail = ({ invitationId }) =>
  emailQueue.add('send-invitation', { invitationId });

export { emailQueue, EMAIL_QUEUE_NAME, enqueueInvitationEmail };
export default emailQueue;
