import { Queue } from 'bullmq';
import { connection } from '../config/redis.js';

// Producer side of the email queue. Services import the enqueue helpers
// below — never `new Queue(...)` of their own, and never send an email
// inline. An invitation POST must return as soon as the row is written; SMTP
// latency and retries belong on this queue, not in the request.

const EMAIL_QUEUE_NAME = 'email-queue';

// BullMQ namespaces every key as <prefix>:<queue>:<id>, and the default prefix
// is 'bull'. 'email-queue' is a name any project would pick, so on a shared
// Redis (one localhost:6379, db 0, several apps) two unrelated services end up
// on the same keyspace: this worker then pulls another app's jobs, fails them
// on an unknown job name, and burns their retries. The prefix is what keeps
// the queues apart — it must match in email.worker.js or the worker listens to
// a queue nobody produces to.
const EMAIL_QUEUE_PREFIX = 'tizello';

const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  prefix: EMAIL_QUEUE_PREFIX,
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
const enqueueInvitationEmail = ({ invitationId, token }) =>
  emailQueue.add('send-invitation', { invitationId, token });

// Queues an email-verification link.
//
// The RAW token travels in the payload, and it has to: only its SHA-256 is
// stored, so the worker cannot reconstruct the link from the row no matter what
// it reads back. The same is true of the login code and the reset token below —
// each is passed once, at mint time, and never again.
const enqueueVerificationEmail = ({ userId, token }) =>
  emailQueue.add('send-verification', { userId, token });

// Queues a six-digit sign-in code. The code itself is a credential: it must not
// be logged, and the queue payload is the only place outside the email that
// holds it in the clear.
const enqueueLoginCodeEmail = ({ userId, code }) =>
  emailQueue.add('send-login-code', { userId, code });

// Queues a password-reset link.
const enqueuePasswordResetEmail = ({ userId, token }) =>
  emailQueue.add('send-reset', { userId, token });

export {
  emailQueue,
  EMAIL_QUEUE_NAME,
  EMAIL_QUEUE_PREFIX,
  enqueueInvitationEmail,
  enqueueVerificationEmail,
  enqueueLoginCodeEmail,
  enqueuePasswordResetEmail,
};
export default emailQueue;
