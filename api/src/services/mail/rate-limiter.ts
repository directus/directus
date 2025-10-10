import { useEnv } from "@directus/env";
import { RateLimiterQueue } from "rate-limiter-flexible";
import { createRateLimiter } from "../../rate-limiter.js";

let emailQueue: RateLimiterQueue | undefined;

const env = useEnv();

if (Boolean(env['EMAIL_LIMITER_ENABLED']) === true) {
    const rateLimiter = createRateLimiter('EMAIL_LIMITER');

    emailQueue = new RateLimiterQueue(rateLimiter, {
        maxQueueSize: Number(env['EMAIL_LIMITER_QUEUE_SIZE']),
    });
}

export async function emailRateLimiter() {
    if (emailQueue) {
        await emailQueue.removeTokens(1);
    }
}