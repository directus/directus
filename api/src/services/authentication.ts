import jwt from 'jsonwebtoken';
import { Knex } from 'knex';
import ms from 'ms';
import { nanoid } from 'nanoid';
import getDatabase from '../database';
import emitter from '../emitter';
import env from '../env';
import { getAuthProvider } from '../auth';
import { DEFAULT_AUTH_PROVIDER, DIRECTUS_SHARED_AUTH } from '../constants';
import { InvalidCredentialsException, InvalidOTPException, UserSuspendedException } from '../exceptions';
import { createRateLimiter } from '../rate-limiter';
import { ActivityService } from './activity';
import { TFAService } from './tfa';
import {
	AbstractServiceOptions,
	Action,
	SchemaOverview,
	Session,
	User,
	DirectusTokenPayload,
	ShareData,
} from '../types';
import { Accountability } from '@directus/shared/types';
import { SettingsService } from './settings';
import { clone, cloneDeep, omit, pick } from 'lodash';
import { performance } from 'perf_hooks';
import { stall } from '../utils/stall';

const loginAttemptsLimiter = createRateLimiter({ duration: 0 });

type LoginResult = {
	accessToken: any;
	refreshToken: any;
	expires: any;
	id?: any;
};

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

	async sharedLogin(payload: Record<string, any>): Promise<LoginResult> {
		const record = await this.knex
			.select<ShareData>(
				'id AS shared_id',
				'role AS shared_role',
				'item AS shared_item',
				'collection AS shared_collection',
				'date_expired AS shared_expires',
				'times_used AS shared_times_used',
				'max_uses AS shared_max_uses'
			)
			.from('directus_shares')
			.where('id', payload.id)
			.first();

		if (!record) {
			throw new InvalidCredentialsException();
		}
		if (record.shared_expires && record.shared_expires < new Date()) {
			throw new InvalidCredentialsException();
		}
		if (record.shared_max_uses && record.shared_max_uses <= record.shared_times_used) {
			throw new InvalidCredentialsException();
		}

		await this.knex('directus_shares')
			.update({ times_used: record.shared_times_used + 1 })
			.where('id', record.shared_id);

		const tokenPayload = {
			app_access: false,
			admin_access: false,
			id: record.shared_id,
			role: record.shared_role,
			shared_scope: {
				item: record.shared_item,
				collection: record.shared_collection,
			},
		};

		const accessToken = jwt.sign(tokenPayload, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
			issuer: 'directus',
		});

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions').insert({
			token: refreshToken,
			expires: refreshTokenExpiration,
			ip: this.accountability?.ip,
			user_agent: this.accountability?.userAgent,
		});

		await this.knex('directus_sessions').delete().where('expires', '<', new Date());

		return {
			accessToken,
			refreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
		};
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
		otp?: string
	): Promise<LoginResult> {
		if (providerName === DIRECTUS_SHARED_AUTH) {
			return this.sharedLogin(payload);
		}
		const STALL_TIME = 100;
		const timeStart = performance.now();

		const provider = getAuthProvider(providerName);

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
				'u.auth_data'
			)
			.from('directus_users as u')
			.innerJoin('directus_roles as r', 'u.role', 'r.id')
			.where('u.id', await provider.getUserID(cloneDeep(payload)))
			.andWhere('u.provider', providerName)
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
			}
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
				}
			);
		};

		if (user?.status !== 'active') {
			emitStatus('fail');

			if (user?.status === 'suspended') {
				await stall(STALL_TIME, timeStart);
				throw new UserSuspendedException();
			} else {
				await stall(STALL_TIME, timeStart);
				throw new InvalidCredentialsException();
			}
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
			throw new InvalidOTPException(`"otp" is required`);
		}

		if (user.tfa_secret && otp) {
			const tfaService = new TFAService({ knex: this.knex, schema: this.schema });
			const otpValid = await tfaService.verifyOTP(user.id, otp);

			if (otpValid === false) {
				emitStatus('fail');
				await stall(STALL_TIME, timeStart);
				throw new InvalidOTPException(`"otp" is invalid`);
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
			}
		);

		const accessToken = jwt.sign(customClaims, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
			issuer: 'directus',
		});

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions').insert({
			token: refreshToken,
			user: user.id,
			expires: refreshTokenExpiration,
			ip: this.accountability?.ip,
			user_agent: this.accountability?.userAgent,
		});

		await this.knex('directus_sessions').delete().where('expires', '<', new Date());

		if (this.accountability) {
			await this.activityService.createOne({
				action: Action.LOGIN,
				user: user.id,
				ip: this.accountability.ip,
				user_agent: this.accountability.userAgent,
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
			expires: ms(env.ACCESS_TOKEN_TTL as string),
			id: user.id,
		};
	}

	async refresh(refreshToken: string): Promise<Record<string, any>> {
		if (!refreshToken) {
			throw new InvalidCredentialsException();
		}

		const session = await this.knex
			.select<Session & User & ShareData>(
				's.expires',
				'u.id',
				'u.first_name',
				'u.last_name',
				'u.email',
				'u.password',
				'u.status',
				'r.id AS role',
				'r.admin_access',
				'r.app_access',
				'u.provider',
				'u.external_identifier',
				'u.auth_data',
				'd.id AS share',
				'd.item AS shared_item',
				'd.collection AS shared_collection',
				'd.date_expired AS shared_expires',
				'd.times_used AS shared_times_used',
				'd.max_uses AS shared_max_uses'
			)
			.from('directus_sessions AS s')
			.leftJoin('directus_users AS u', 's.user', 'u.id')
			.leftJoin('directus_shares AS d', 's.share', 'd.id')
			.joinRaw('LEFT JOIN directus_roles AS r ON r.id IN (u.role, d.role)')
			.where('s.token', refreshToken)
			.andWhere('s.expires', '<=', this.knex.fn.now())
			.first();

		if (!session || !session.share || !session.id) {
			throw new InvalidCredentialsException();
		}

		if (session.share && session.shared_expires && session.shared_expires < new Date()) {
			throw new InvalidCredentialsException();
		}

		const user = session;

		if (user.id) {
			const provider = getAuthProvider(user.provider);
			await provider.refresh(clone(user));
		}

		const tokenPayload: DirectusTokenPayload = {
			id: user.id,
			role: user.role,
			app_access: user.app_access,
			admin_access: user.admin_access,
		};
		if (session.share) {
			tokenPayload.role = session.shared_role;
			tokenPayload.share_scope = {
				collection: session.shared_collection,
				item: session.shared_item,
			};
		}

		const customClaims = await emitter.emitFilter(
			'auth.jwt',
			tokenPayload,
			{
				status: 'pending',
				user: user?.id,
				provider: user.provider,
				type: 'refresh',
			},
			{
				database: this.knex,
				schema: this.schema,
				accountability: this.accountability,
			}
		);

		const accessToken = jwt.sign(customClaims, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
			issuer: 'directus',
		});

		const newRefreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions')
			.update({
				token: newRefreshToken,
				expires: refreshTokenExpiration,
			})
			.where({ token: refreshToken });

		await this.knex('directus_users').update({ last_access: new Date() }).where({ id: user.id });

		return {
			accessToken,
			refreshToken: newRefreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
			id: user.id,
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
				'u.auth_data'
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
				'auth_data'
			)
			.from('directus_users')
			.where('id', userID)
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		const provider = getAuthProvider(user.provider);
		await provider.verify(clone(user), password);
	}
}
