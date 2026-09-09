import { Worker } from 'bullmq';
import { connection } from '../config/redis.js';
import { EMAIL_QUEUE_NAME } from '../queues/email.queue.js';
import prisma from '../config/db.js';
import { createLogger } from '../config/logger.js';

const log = createLogger('email-worker');

const processEmailJob = async (job) => {
  if (job.name === 'send-invitation') {
    const { invitationId } = job.data;

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { workspace: true, invitedBy: true },
    });

    // The invitation was revoked (or the workspace deleted) between the
    // enqueue and this run. Return rather than throw: there is nothing to
    // retry, and a thrown error would burn all five attempts on a job that
    // can never succeed.
    if (!invitation) {
      log.warn({ invitationId, jobId: job.id }, 'Invitation no longer exists, skipping');
      return;
    }

    if (invitation.acceptedAt) {
      log.warn({ invitationId, jobId: job.id }, 'Invitation already accepted, skipping');
      return;
    }

    // TODO: wire a real transport (Nodemailer / Resend / SES) and move the
    // send behind shared/utils/mailer.js. Everything around it — the queue,
    // the retry policy, the revoked/accepted guards above — is already
    // production-shaped; only the send itself is stubbed.
    log.info(
      { jobId: job.id, email: invitation.email, workspace: invitation.workspace.name },
      'TODO send invitation email'
    );

    return;
  }

  // An unknown job name means a producer and this worker have drifted apart.
  // Fail loudly rather than silently dropping the job.
  throw new Error(`Unsupported email job: ${job.name}`);
};

const emailWorker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, { connection });

emailWorker.on('completed', (job) => {
  log.info({ jobId: job.id, jobName: job.name }, 'Job completed');
});

emailWorker.on('failed', (job, error) => {
  log.error({ err: error, jobId: job?.id, jobName: job?.name }, 'Job failed');
});

export default emailWorker;
