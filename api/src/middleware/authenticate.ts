import { Accountability } from '@directus/shared/types';
import { NextFunction, Request, Response } from 'express';
import { isEqual } from 'lodash';
import getDatabase from '../database';
import emitter from '../emitter';
import env from '../env';
import { InvalidCredentialsException } from '../exceptions';
import asyncHandler from '../utils/async-handler';
import { getIPFromReq } from '../utils/get-ip-from-req';
import isDirectusJWT from '../utils/is-directus-jwt';
import { verifyAccessJWT } from '../utils/jwt';
import { rateLimiter } from './rate-limiter';
import { validateEnv } from '../utils/validate-env';
import { createRateLimiter } from '../rate-limiter';

validateEnv(['RATE_LIMITER_DURATION', 'RATE_LIMITER_POINTS', 'RATE_LIMITER_POINTS_AUTHENTICATED']);

const rateLimiterDuration = Number(env.RATE_LIMITER_DURATION);
const rateLimiterPoints = Number(env.RATE_LIMITER_POINTS);
const rateLimiterPointsAuthenticated = Number(env.RATE_LIMITER_POINTS_AUTHENTICATED);

const authenticatedPointsLimiter = createRateLimiter({
	duration: rateLimiterDuration,
	points: rateLimiterPointsAuthenticated - rateLimiterPoints,
});

let useAuthenticatedRateLimit: (req: Request) => void = async () => {
	return;
};

if (rateLimiter && rateLimiterPointsAuthenticated > rateLimiterPoints) {
	if (env.RATE_LIMITER_STORE === 'memcache') {
		useAuthenticatedRateLimit = async (req: Request) => {
			try {
				const ipAddress = getIPFromReq(req);
				await authenticatedPointsLimiter.consume(`authenticated@${ipAddress}`, 1);

				const status = await rateLimiter.get(ipAddress);

				if (status && status.msBeforeNext > 1000) {
					await rateLimiter.set(
						ipAddress,
						rateLimiterPoints - status.remainingPoints - 1,
						Math.floor(status.msBeforeNext / 1000)
					);
				}
			} catch (rateLimiterRes: any) {
				if (rateLimiterRes instanceof Error) throw rateLimiterRes;
			}
		};
	} else {
		useAuthenticatedRateLimit = async (req: Request) => {
			try {
				const ipAddress = getIPFromReq(req);
				await authenticatedPointsLimiter.consume(`authenticated@${ipAddress}`, 1);
				await rateLimiter.reward(ipAddress, 1);
			} catch (rateLimiterRes: any) {
				if (rateLimiterRes instanceof Error) throw rateLimiterRes;
			}
		};
	}
}

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
export const handler = async (req: Request, res: Response, next: NextFunction) => {
	const defaultAccountability: Accountability = {
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: getIPFromReq(req),
		userAgent: req.get('user-agent'),
	};

	const database = getDatabase();

	const customAccountability = await emitter.emitFilter(
		'authenticate',
		defaultAccountability,
		{
			req,
		},
		{
			database,
			schema: null,
			accountability: null,
		}
	);

	if (customAccountability && isEqual(customAccountability, defaultAccountability) === false) {
		req.accountability = customAccountability;

		await useAuthenticatedRateLimit(req);

		return next();
	}

	req.accountability = defaultAccountability;

	if (req.token) {
		if (isDirectusJWT(req.token)) {
			const payload = verifyAccessJWT(req.token, env.SECRET);

			req.accountability.share = payload.share;
			req.accountability.share_scope = payload.share_scope;
			req.accountability.user = payload.id;
			req.accountability.role = payload.role;
			req.accountability.admin = payload.admin_access === true || payload.admin_access == 1;
			req.accountability.app = payload.app_access === true || payload.app_access == 1;
		} else {
			// Try finding the user with the provided token
			const user = await database
				.select('directus_users.id', 'directus_users.role', 'directus_roles.admin_access', 'directus_roles.app_access')
				.from('directus_users')
				.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
				.where({
					'directus_users.token': req.token,
					status: 'active',
				})
				.first();

			if (!user) {
				throw new InvalidCredentialsException();
			}

			req.accountability.user = user.id;
			req.accountability.role = user.role;
			req.accountability.admin = user.admin_access === true || user.admin_access == 1;
			req.accountability.app = user.app_access === true || user.app_access == 1;
		}

		await useAuthenticatedRateLimit(req);
	}

	return next();
};

export default asyncHandler(handler);
