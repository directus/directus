import { performance } from 'perf_hooks';
import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import {
	InvalidCredentialsError,
	InvalidOtpError,
	ServiceUnavailableError,
	UserSuspendedError,
} from '@directus/errors';
import type { AbstractServiceOptions, Accountability, LoginResult, SchemaOverview } from '@directus/types';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';
import { clone, cloneDeep } from 'lodash-es';
import type { StringValue } from 'ms';
import { getAuthProvider } from '../auth.js';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { createRateLimiter, RateLimiterRes } from '../rate-limiter.js';
import type { DirectusTokenPayload, Session, User } from '../types/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { getSecret } from '../utils/get-secret.js';
import { stall } from '../utils/stall.js';
import { ActivityService } from './activity.js';
import { RevisionsService } from './revisions.js';
import { SettingsService } from './settings.js';
import { TFAService } from './tfa.js';

const env = useEnv();

const loginAttemptsLimiter = createRateLimiter('RATE_LIMITER', { duration: 0 });

export class AuthenticationService {
	knex: Knex;
	accountability: Accountability | null;
	activityService: ActivityService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.activityService = new ActivityService({ knex: this.knex, schema: options.schema });
		this.schema = options.schema;
	}

	/**
	 * Retrieve the tokens for a given user email.
	 *
	 * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
	 * to handle password existence checks elsewhere
	 */
	async login(
		providerName: string = DEFAULT_AUTH_PROVIDER,
		payload: Record<string, any>,
		options?: Partial<{
			otp: string;
			session: boolean;
		}>,
	): Promise<LoginResult> {
		const { nanoid } = await import('nanoid');

		const STALL_TIME = env['LOGIN_STALL_TIME'] as number;
		const timeStart = performance.now();

		const provider = getAuthProvider(providerName);

		const emitStatus = (
			status: 'fail' | 'success',
			loginPayload: any,
			loginUser: User | undefined,
			error?: unknown,
		) => {
			emitter.emitAction(
				'auth.login',
				{
					payload: loginPayload,
					status,
					user: loginUser?.id,
					provider: providerName,
					error,
				},
				{
					database: this.knex,
					schema: this.schema,
					accountability: this.accountability,
				},
			);
		};

		let userId;

		try {
			userId = await provider.getUserID(cloneDeep(payload));
		} catch (err) {
			emitStatus('fail', payload, undefined, err);
			await stall(STALL_TIME, timeStart);
			throw err;
		}

		const user = await this.knex
			.select<
				User & { tfa_secret: string | null }
			>('id', 'first_name', 'last_name', 'email', 'password', 'status', 'role', 'tfa_secret', 'provider', 'external_identifier', 'auth_data')
			.from('directus_users')
			.where('id', userId)
			.first();

		const updatedPayload = await emitter.emitFilter(
			'auth.login',
			payload,
			{
				status: 'pending',
				user: user?.id,
				provider: providerName,
			},
			{
				database: this.knex,
				schema: this.schema,
				accountability: this.accountability,
			},
		);

		if (user?.status !== 'active' || user?.provider !== providerName) {
			const loginError = new InvalidCredentialsError();
			emitStatus('fail', updatedPayload, user, loginError);
			await stall(STALL_TIME, timeStart);
			throw loginError;
		}

		const settingsService = new SettingsService({
			knex: this.knex,
			schema: this.schema,
		});

		const { auth_login_attempts: allowedAttempts } = await settingsService.readSingleton({
			fields: ['auth_login_attempts'],
		});

		if (allowedAttempts !== null) {
			loginAttemptsLimiter.points = allowedAttempts;

			try {
				await loginAttemptsLimiter.consume(user.id);
			} catch (error) {
				if (error instanceof RateLimiterRes && error.remainingPoints === 0) {
					await this.knex('directus_users').update({ status: 'suspended' }).where({ id: user.id });
					user.status = 'suspended';

					if (this.accountability) {
						const activity = await this.activityService.createOne({
							action: Action.UPDATE,
							user: user.id,
							ip: this.accountability.ip,
							user_agent: this.accountability.userAgent,
							origin: this.accountability.origin,
							collection: 'directus_users',
							item: user.id,
						});

						const revisionsService = new RevisionsService({ knex: this.knex, schema: this.schema });

						await revisionsService.createOne({
							activity: activity,
							collection: 'directus_users',
							item: user.id,
							data: user,
							delta: { status: 'suspended' },
						});
					}

					// This means that new attempts after the user has been re-activated will be accepted
					await loginAttemptsLimiter.set(user.id, 0, 0);
				} else {
					throw new ServiceUnavailableError({
						service: 'authentication',
						reason: 'Rate limiter unreachable',
					});
				}
			}
		}

		try {
			await provider.login(clone(user), cloneDeep(updatedPayload));
		} catch (err) {
			emitStatus('fail', updatedPayload, user, err);
			await stall(STALL_TIME, timeStart);
			throw err;
		}

		if (user.tfa_secret && !options?.otp) {
			const loginError = new InvalidOtpError();
			emitStatus('fail', updatedPayload, user, loginError);
			await stall(STALL_TIME, timeStart);
			throw loginError;
		}

		if (user.tfa_secret && options?.otp) {
			const tfaService = new TFAService({ knex: this.knex, schema: this.schema });
			const otpValid = await tfaService.verifyOTP(user.id, options?.otp);

			if (otpValid === false) {
				const loginError = new InvalidOtpError();
				emitStatus('fail', updatedPayload, user, loginError);
				await stall(STALL_TIME, timeStart);
				throw loginError;
			}
		}

		const roles = await fetchRolesTree(user.role, { knex: this.knex });

		const globalAccess = await fetchGlobalAccess(
			{ roles, user: user.id, ip: this.accountability?.ip ?? null },
			{ knex: this.knex },
		);

		const tokenPayload: DirectusTokenPayload = {
			id: user.id,
			role: user.role,
			app_access: globalAccess.app,
			admin_access: globalAccess.admin,
		};

		// Add role-based enforcement to token payload for users who need to set up 2FA
		if (!user.tfa_secret) {
			// Check if user has role-based enforcement
			const roleEnforcement = await this.knex
				.select('directus_policies.enforce_tfa')
				.from('directus_users')
				.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
				.leftJoin('directus_access', 'directus_roles.id', 'directus_access.role')
				.leftJoin('directus_policies', 'directus_access.policy', 'directus_policies.id')
				.where('directus_users.id', user.id)
				.where('directus_policies.enforce_tfa', true)
				.first();

			if (roleEnforcement) {
				tokenPayload.enforce_tfa = true;
			}
		}

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + getMilliseconds(env['REFRESH_TOKEN_TTL'], 0));

		if (options?.session) {
			tokenPayload.session = refreshToken;
		}

		const customClaims = await emitter.emitFilter(
			'auth.jwt',
			tokenPayload,
			{
				status: 'pending',
				user: user?.id,
				provider: providerName,
				type: 'login',
			},
			{
				database: this.knex,
				schema: this.schema,
				accountability: this.accountability,
			},
		);

		const TTL = env[options?.session ? 'SESSION_COOKIE_TTL' : 'ACCESS_TOKEN_TTL'] as StringValue | number;

		const accessToken = jwt.sign(customClaims, getSecret(), {
			expiresIn: TTL,
			issuer: 'directus',
		});

		await this.knex('directus_sessions').insert({
			token: refreshToken,
			user: user.id,
			expires: refreshTokenExpiration,
			ip: this.accountability?.ip,
			user_agent: this.accountability?.userAgent,
			origin: this.accountability?.origin,
		});

		await this.knex('directus_sessions').delete().where('expires', '<', new Date());

		if (this.accountability) {
			await this.activityService.createOne({
				action: Action.LOGIN,
				user: user.id,
				ip: this.accountability.ip,
				user_agent: this.accountability.userAgent,
				origin: this.accountability.origin,
				collection: 'directus_users',
				item: user.id,
			});
		}

		await this.knex('directus_users').update({ last_access: new Date() }).where({ id: user.id });

		emitStatus('success', updatedPayload, user);

		if (allowedAttempts !== null) {
			await loginAttemptsLimiter.set(user.id, 0, 0);
		}

		await stall(STALL_TIME, timeStart);

		return {
			accessToken,
			refreshToken,
			expires: getMilliseconds(TTL),
			id: user.id,
		};
	}

	async refresh(refreshToken: string, options?: Partial<{ session: boolean }>): Promise<LoginResult> {
		const { nanoid } = await import('nanoid');
		const STALL_TIME = env['LOGIN_STALL_TIME'] as number;
		const timeStart = performance.now();

		if (!refreshToken) {
			throw new InvalidCredentialsError();
		}

		const record = await this.knex
			.select({
				session_expires: 's.expires',
				session_next_token: 's.next_token',
				user_id: 'u.id',
				user_first_name: 'u.first_name',
				user_last_name: 'u.last_name',
				user_email: 'u.email',
				user_password: 'u.password',
				user_status: 'u.status',
				user_provider: 'u.provider',
				user_external_identifier: 'u.external_identifier',
				user_auth_data: 'u.auth_data',
				user_role: 'u.role',
				share_id: 'd.id',
				share_start: 'd.date_start',
				share_end: 'd.date_end',
			})
			.from('directus_sessions AS s')
			.leftJoin('directus_users AS u', 's.user', 'u.id')
			.leftJoin('directus_shares AS d', 's.share', 'd.id')
			.where('s.token', refreshToken)
			.andWhere('s.expires', '>=', new Date())
			.andWhere((subQuery) => {
				subQuery.whereNull('d.date_end').orWhere('d.date_end', '>=', new Date());
			})
			.andWhere((subQuery) => {
				subQuery.whereNull('d.date_start').orWhere('d.date_start', '<=', new Date());
			})
			.first();

		if (!record || (!record.share_id && !record.user_id)) {
			throw new InvalidCredentialsError();
		}

		if (record.user_id && record.user_status !== 'active') {
			await this.knex('directus_sessions').where({ token: refreshToken }).del();

			if (record.user_status === 'suspended') {
				await stall(STALL_TIME, timeStart);
				throw new UserSuspendedError();
			} else {
				await stall(STALL_TIME, timeStart);
				throw new InvalidCredentialsError();
			}
		}

		const roles = await fetchRolesTree(record.user_role, { knex: this.knex });

		const globalAccess = await fetchGlobalAccess(
			{ user: record.user_id, roles, ip: this.accountability?.ip ?? null },
			{ knex: this.knex },
		);

		if (record.user_id) {
			const provider = getAuthProvider(record.user_provider);

			await provider.refresh({
				id: record.user_id,
				first_name: record.user_first_name,
				last_name: record.user_last_name,
				email: record.user_email,
				password: record.user_password,
				status: record.user_status,
				provider: record.user_provider,
				external_identifier: record.user_external_identifier,
				auth_data: record.user_auth_data,
				role: record.user_role,
				app_access: globalAccess.app,
				admin_access: globalAccess.admin,
			});
		}

		let newRefreshToken = record.session_next_token ?? nanoid(64);
		const sessionDuration = env[options?.session ? 'SESSION_COOKIE_TTL' : 'REFRESH_TOKEN_TTL'];
		const refreshTokenExpiration = new Date(Date.now() + getMilliseconds(sessionDuration, 0));

		const tokenPayload: DirectusTokenPayload = {
			id: record.user_id,
			role: record.user_role,
			app_access: globalAccess.app,
			admin_access: globalAccess.admin,
		};

		if (options?.session) {
			newRefreshToken = await this.updateStatefulSession(record, refreshToken, newRefreshToken, refreshTokenExpiration);
			tokenPayload.session = newRefreshToken;
		} else {
			// Original stateless token behavior
			await this.knex('directus_sessions')
				.update({
					token: newRefreshToken,
					expires: refreshTokenExpiration,
				})
				.where({ token: refreshToken });
		}

		if (record.share_id) {
			tokenPayload.share = record.share_id;
			tokenPayload.role = null;

			tokenPayload.app_access = false;
			tokenPayload.admin_access = false;

			delete tokenPayload.id;
		}

		const customClaims = await emitter.emitFilter(
			'auth.jwt',
			tokenPayload,
			{
				status: 'pending',
				user: record.user_id,
				provider: record.user_provider,
				type: 'refresh',
			},
			{
				database: this.knex,
				schema: this.schema,
				accountability: this.accountability,
			},
		);

		const TTL = env[options?.session ? 'SESSION_COOKIE_TTL' : 'ACCESS_TOKEN_TTL'] as StringValue | number;

		const accessToken = jwt.sign(customClaims, getSecret(), {
			expiresIn: TTL,
			issuer: 'directus',
		});

		if (record.user_id) {
			await this.knex('directus_users').update({ last_access: new Date() }).where({ id: record.user_id });
		}

		// Clear expired sessions for the current user
		await this.knex('directus_sessions')
			.delete()
			.where({
				user: record.user_id,
				share: record.share_id,
			})
			.andWhere('expires', '<', new Date());

		return {
			accessToken,
			refreshToken: newRefreshToken,
			expires: getMilliseconds(TTL),
			id: record.user_id,
		};
	}

	private async updateStatefulSession(
		sessionRecord: Record<string, any>,
		oldSessionToken: string,
		newSessionToken: string,
		sessionExpiration: Date,
	): Promise<string> {
		if (sessionRecord['session_next_token']) {
			// The current session token was already refreshed and has a reference
			// to the new session, update the new session timeout for the new refresh
			await this.knex('directus_sessions')
				.update({
					expires: sessionExpiration,
				})
				.where({ token: newSessionToken });

			return newSessionToken;
		}

		// Keep the old session active for a short period of time
		const GRACE_PERIOD = getMilliseconds(env['SESSION_REFRESH_GRACE_PERIOD'], 10_000);

		// Update the existing session record to have a short safety timeout
		// before expiring, and add the reference to the new session token
		const updatedSession = await this.knex('directus_sessions')
			.update(
				{
					next_token: newSessionToken,
					expires: new Date(Date.now() + GRACE_PERIOD),
				},
				['next_token'],
			)
			.where({ token: oldSessionToken, next_token: null });

		if (updatedSession.length === 0) {
			// Don't create a new session record, we already have a "next_token" reference
			const { next_token } = await this.knex('directus_sessions')
				.select('next_token')
				.where({ token: oldSessionToken })
				.first();

			return next_token;
		}

		// Instead of updating the current session record with a new token,
		// create a new copy with the new token
		await this.knex('directus_sessions').insert({
			token: newSessionToken,
			user: sessionRecord['user_id'],
			share: sessionRecord['share_id'],
			expires: sessionExpiration,
			ip: this.accountability?.ip,
			user_agent: this.accountability?.userAgent,
			origin: this.accountability?.origin,
		});

		return newSessionToken;
	}

	async logout(refreshToken: string): Promise<void> {
		const record = await this.knex
			.select<
				User & Session
			>('u.id', 'u.first_name', 'u.last_name', 'u.email', 'u.password', 'u.status', 'u.role', 'u.provider', 'u.external_identifier', 'u.auth_data')
			.from('directus_sessions as s')
			.innerJoin('directus_users as u', 's.user', 'u.id')
			.where('s.token', refreshToken)
			.first();

		if (record) {
			const user = record;

			const provider = getAuthProvider(user.provider);
			await provider.logout(clone(user));

			if (this.accountability) {
				await this.activityService.createOne({
					action: Action.LOGOUT,
					user: user.id,
					ip: this.accountability.ip,
					user_agent: this.accountability.userAgent,
					origin: this.accountability.origin,
					collection: 'directus_users',
					item: user.id,
				});
			}

			await this.knex.delete().from('directus_sessions').where('token', refreshToken);
		}
	}

	async verifyPassword(userID: string, password: string): Promise<void> {
		const user = await this.knex
			.select<User>(
				'id',
				'first_name',
				'last_name',
				'email',
				'password',
				'status',
				'role',
				'provider',
				'external_identifier',
				'auth_data',
			)
			.from('directus_users')
			.where('id', userID)
			.first();

		if (!user) {
			throw new InvalidCredentialsError();
		}

		const provider = getAuthProvider(user.provider);
		await provider.verify(clone(user), password);
	}
}
