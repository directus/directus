import { Action } from '@directus/constants';
import { InvalidCredentialsError, InvalidOtpError, InvalidProviderError, UserSuspendedError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';
import { clone, cloneDeep } from 'lodash-es';
import { performance } from 'perf_hooks';
import { getAuthProvider } from '../auth.js';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { useEnv } from '../env.js';
import { createRateLimiter } from '../rate-limiter.js';
import type { AbstractServiceOptions, DirectusTokenPayload, LoginResult, Session, User } from '../types/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { stall } from '../utils/stall.js';
import { ActivityService } from './activity.js';
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
		otp?: string,
	): Promise<LoginResult> {
		const { nanoid } = await import('nanoid');

		const STALL_TIME = env['LOGIN_STALL_TIME'];
		const timeStart = performance.now();

		const provider = getAuthProvider(providerName);

		let userId;

		try {
			userId = await provider.getUserID(cloneDeep(payload));
		} catch (err) {
			await stall(STALL_TIME, timeStart);
			throw err;
		}

		const user = await this.knex
			.select<User & { tfa_secret: string | null }>(
				'u.id',
				'u.first_name',
				'u.last_name',
				'u.email',
				'u.password',
				'u.status',
				'u.role',
				'r.admin_access',
				'r.app_access',
				'u.tfa_secret',
				'u.provider',
				'u.external_identifier',
				'u.auth_data',
			)
			.from('directus_users as u')
			.leftJoin('directus_roles as r', 'u.role', 'r.id')
			.where('u.id', userId)
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

		const emitStatus = (status: 'fail' | 'success') => {
			emitter.emitAction(
				'auth.login',
				{
					payload: updatedPayload,
					status,
					user: user?.id,
					provider: providerName,
				},
				{
					database: this.knex,
					schema: this.schema,
					accountability: this.accountability,
				},
			);
		};

		if (user?.status !== 'active') {
			emitStatus('fail');

			if (user?.status === 'suspended') {
				await stall(STALL_TIME, timeStart);
				throw new UserSuspendedError();
			} else {
				await stall(STALL_TIME, timeStart);
				throw new InvalidCredentialsError();
			}
		} else if (user.provider !== providerName) {
			await stall(STALL_TIME, timeStart);
			throw new InvalidProviderError();
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
			} catch {
				await this.knex('directus_users').update({ status: 'suspended' }).where({ id: user.id });
				user.status = 'suspended';

				// This means that new attempts after the user has been re-activated will be accepted
				await loginAttemptsLimiter.set(user.id, 0, 0);
			}
		}

		try {
			await provider.login(clone(user), cloneDeep(updatedPayload));
		} catch (e) {
			emitStatus('fail');
			await stall(STALL_TIME, timeStart);
			throw e;
		}

		if (user.tfa_secret && !otp) {
			emitStatus('fail');
			await stall(STALL_TIME, timeStart);
			throw new InvalidOtpError();
		}

		if (user.tfa_secret && otp) {
			const tfaService = new TFAService({ knex: this.knex, schema: this.schema });
			const otpValid = await tfaService.verifyOTP(user.id, otp);

			if (otpValid === false) {
				emitStatus('fail');
				await stall(STALL_TIME, timeStart);
				throw new InvalidOtpError();
			}
		}

		const tokenPayload = {
			id: user.id,
			role: user.role,
			app_access: user.app_access,
			admin_access: user.admin_access,
		};

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

		const accessToken = jwt.sign(customClaims, env['SECRET'] as string, {
			expiresIn: env['ACCESS_TOKEN_TTL'],
			issuer: 'directus',
		});

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + getMilliseconds(env['REFRESH_TOKEN_TTL'], 0));

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

		emitStatus('success');

		if (allowedAttempts !== null) {
			await loginAttemptsLimiter.set(user.id, 0, 0);
		}

		await stall(STALL_TIME, timeStart);

		return {
			accessToken,
			refreshToken,
			expires: getMilliseconds(env['ACCESS_TOKEN_TTL']),
			id: user.id,
		};
	}

	async refresh(refreshToken: string): Promise<Record<string, any>> {
		const { nanoid } = await import('nanoid');
		const STALL_TIME = env['LOGIN_STALL_TIME'];
		const timeStart = performance.now();

		if (!refreshToken) {
			throw new InvalidCredentialsError();
		}

		const record = await this.knex
			.select({
				session_expires: 's.expires',
				user_id: 'u.id',
				user_first_name: 'u.first_name',
				user_last_name: 'u.last_name',
				user_email: 'u.email',
				user_password: 'u.password',
				user_status: 'u.status',
				user_provider: 'u.provider',
				user_external_identifier: 'u.external_identifier',
				user_auth_data: 'u.auth_data',
				role_id: 'r.id',
				role_admin_access: 'r.admin_access',
				role_app_access: 'r.app_access',
				share_id: 'd.id',
				share_item: 'd.item',
				share_role: 'd.role',
				share_collection: 'd.collection',
				share_start: 'd.date_start',
				share_end: 'd.date_end',
				share_times_used: 'd.times_used',
				share_max_uses: 'd.max_uses',
			})
			.from('directus_sessions AS s')
			.leftJoin('directus_users AS u', 's.user', 'u.id')
			.leftJoin('directus_shares AS d', 's.share', 'd.id')
			.leftJoin('directus_roles AS r', (join) => {
				join.onIn('r.id', [this.knex.ref('u.role'), this.knex.ref('d.role')]);
			})
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
				role: record.role_id,
				app_access: record.role_app_access,
				admin_access: record.role_admin_access,
			});
		}

		const tokenPayload: DirectusTokenPayload = {
			id: record.user_id,
			role: record.role_id,
			app_access: record.role_app_access,
			admin_access: record.role_admin_access,
		};

		if (record.share_id) {
			tokenPayload.share = record.share_id;
			tokenPayload.role = record.share_role;

			tokenPayload.share_scope = {
				collection: record.share_collection,
				item: record.share_item,
			};

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

		const accessToken = jwt.sign(customClaims, env['SECRET'] as string, {
			expiresIn: env['ACCESS_TOKEN_TTL'],
			issuer: 'directus',
		});

		const newRefreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + getMilliseconds(env['REFRESH_TOKEN_TTL'], 0));

		await this.knex('directus_sessions')
			.update({
				token: newRefreshToken,
				expires: refreshTokenExpiration,
			})
			.where({ token: refreshToken });

		if (record.user_id) {
			await this.knex('directus_users').update({ last_access: new Date() }).where({ id: record.user_id });
		}

		return {
			accessToken,
			refreshToken: newRefreshToken,
			expires: getMilliseconds(env['ACCESS_TOKEN_TTL']),
			id: record.user_id,
		};
	}

	async logout(refreshToken: string): Promise<void> {
		const record = await this.knex
			.select<User & Session>(
				'u.id',
				'u.first_name',
				'u.last_name',
				'u.email',
				'u.password',
				'u.status',
				'u.role',
				'u.provider',
				'u.external_identifier',
				'u.auth_data',
			)
			.from('directus_sessions as s')
			.innerJoin('directus_users as u', 's.user', 'u.id')
			.where('s.token', refreshToken)
			.first();

		if (record) {
			const user = record;

			const provider = getAuthProvider(user.provider);
			await provider.logout(clone(user));

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
