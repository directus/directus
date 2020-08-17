/**
 *  RateLimiter using Redis
 *  and rate-limiter-flexible
 *  can extend with further options
 *  in future
 */
import { RequestHandler } from 'express';
import redis from 'redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const redisClient = redis.createClient({ enable_offline_queue: false });

const rateLimiter: RequestHandler = (req, res, next) => {
	try {
		// first need to check that redis is running!
		if (!redisClient) {
			throw new Error('Redis client does not exist');
			process.exit(1);
		}
		// options for the rate limiter are set below. Opts can be found
		// at https://github.com/animir/node-rate-limiter-flexible/wiki/Options
		const opts = {
			storeClient: redisClient,
			points: 5, // Number of points
			duration: 5, // Number of seconds before consumed points are reset.

			// Custom
			execEvenly: true, // delay actions after first action - this may need adjusting (leaky bucket)
			blockDuration: 0, // Do not block if consumed more than points
			keyPrefix: 'rlflx', // must be unique for limiters with different purpose
		};

		const rateLimiterRedis = new RateLimiterRedis(opts);

		rateLimiterRedis
			.consume(req.ip)
			.then((rateLimiterRes) => {
				// everything is ok - can put addition logic in there later for users etc
				next();
			})
			.catch((rejRes) => {
				if (rejRes instanceof Error) {
					throw new Error('Redis insurance limiter not set up');
					process.exit(1);
				} else {
					// If there is no error, rateLimiterRedis promise rejected with number of ms before next request allowed
					const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
					res.set('Retry-After', String(secs));
					res.status(429).send('Too Many Requests');
					throw new Error(`To many requests, retry after ${secs}.`);
					process.exit(1);
				}
			});
	} catch (error) {
		next(error);
	}
};

export default rateLimiter;
