import { useEnv } from "@directus/env";
import { RateLimiterQueue } from "rate-limiter-flexible";
import { createRateLimiter } from "../../rate-limiter.js";

let emailQueue: RateLimiterQueue | undefined;

const env = useEnv();

if (Boolean(env['RATE_LIMITER_EMAIL_ENABLED']) === true) {
    const rateLimiter = createRateLimiter('RATE_LIMITER_EMAIL');

    emailQueue = new RateLimiterQueue(rateLimiter, {
        maxQueueSize: Number(env['RATE_LIMITER_EMAIL_QUEUE_SIZE']),
    });
}

export async function emailRateLimiter() {
    if (emailQueue) {
        await emailQueue.removeTokens(1);
    }
}