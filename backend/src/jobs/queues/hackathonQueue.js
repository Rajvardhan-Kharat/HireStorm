const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.warn('[Redis] Connection error (non-fatal):', err.message);
});

const hackathonQueue = new Queue('hackathonQueue', { connection });

/**
 * Schedule a delayed BullMQ job.
 * @param {string} jobName  e.g. 'CLOSE_PHASE1_SUBMISSIONS'
 * @param {object} data     job payload
 * @param {Date}   runAt    exact time to run the job
 */
const scheduleHackathonJob = async (jobName, data, runAt) => {
  const delay = Math.max(0, new Date(runAt).getTime() - Date.now());
  
  try {
    // If Redis is actively throwing or not ready, fallback immediately
    if (connection.status !== 'ready' && connection.status !== 'connecting') {
      throw new Error('Redis not ready');
    }
    const job = await hackathonQueue.add(jobName, data, { delay });
    console.log(`[BullMQ] Scheduled "${jobName}" in ${Math.round(delay / 1000)}s (jobId: ${job.id})`);
    return job;
  } catch (err) {
    console.warn(`[Job Fallback] Redis unavailable (${err.message}). Falling back to in-memory setTimeout for ${jobName}.`);
    
    // Fallback: Use standard JS setTimeout to execute the job logic directly
    setTimeout(async () => {
      console.log(`[Job Fallback] Executing delayed in-memory job: ${jobName}`);
      try {
        const { handleHackathonJob } = require('../workers/hackathonWorker');
        await handleHackathonJob({ name: jobName, data });
      } catch (workerErr) {
        console.error(`[Job Fallback] In-memory job failed:`, workerErr);
      }
    }, delay);
    
    return { id: `in-memory-${Date.now()}`, fallback: true };
  }
};

module.exports = { hackathonQueue, connection, scheduleHackathonJob };
