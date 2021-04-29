import { AuthenticationService } from './authentication';
import { ItemsService, MutationOptions } from './items';
import jwt from 'jsonwebtoken';
import database from '../database';
import argon2 from 'argon2';
import {
	InvalidPayloadException,
	ForbiddenException,
	UnprocessableEntityException,
	FailedValidationException,
} from '../exceptions';
import { Accountability, PrimaryKey, Item, AbstractServiceOptions, SchemaOverview, Query } from '../types';
import { Knex } from 'knex';
import env from '../env';
import cache from '../cache';
import { toArray } from '../utils/to-array';
import { RecordNotUniqueException } from '../exceptions/database/record-not-unique';
import logger from '../logger';
import { clone } from 'lodash';
import { SettingsService } from './settings';
import { MailService } from './mail';

export class UsersService extends ItemsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	service: ItemsService;

	constructor(options: AbstractServiceOptions) {
		super('directus_users', options);

		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.service = new ItemsService('directus_users', options);
		this.schema = options.schema;
	}

	/**
	 * User email has to be unique case-insensitive. This is an additional check to make sure that
	 * the email is unique regardless of casing
	 */
	private async checkUniqueEmails(emails: string[]) {
		if (emails.length > 0) {
			const results = await this.knex
				.select('email')
				.from('directus_users')
				.whereRaw(`LOWER(??) IN (${emails.map(() => '?')})`, ['email', ...emails]);

			if (results.length > 0) {
				throw new RecordNotUniqueException('email', {
					collection: 'directus_users',
					field: 'email',
					invalid: results[0].email,
				});
			}
		}
	}

	/**
	 * Check if the provided password matches the strictness as configured in
	 * directus_settings.auth_password_policy
	 */
	private async checkPasswordPolicy(passwords: string[]) {
		const settingsService = new SettingsService({
			schema: this.schema,
			knex: this.knex,
		});

		const { auth_password_policy: policyRegExString } = await settingsService.readSingleton({
			fields: ['auth_password_policy'],
		});

		if (policyRegExString) {
			const wrapped = policyRegExString.startsWith('/') && policyRegExString.endsWith('/');

			const regex = new RegExp(wrapped ? policyRegExString.slice(1, -1) : policyRegExString);

			for (const password of passwords) {
				if (regex.test(password) === false) {
					throw new FailedValidationException({
						message: `Provided password doesn't match password policy`,
						path: ['password'],
						type: 'custom.pattern.base',
						context: {
							value: password,
						},
					});
				}
			}
		}

		return true;
	}

	/**
	 * Create a new user
	 */
	async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const email = data.email.toLowerCase();
		await this.checkUniqueEmails([email]);
		return await super.createOne(data, opts);
	}

	/**
	 * Create multiple new users
	 */
	async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const emails = data
			.map((payload: Record<string, any>) => payload.email)
			.filter((e) => e)
			.map((e) => e.toLowerCase()) as string[];

		await this.checkUniqueEmails(emails);

		const passwords = data.map((payload) => payload.password).filter((pw) => pw);

		if (passwords.length > 0) {
			await this.checkPasswordPolicy(passwords);
		}

		return await super.createMany(data, opts);
	}

	async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const email = data.email?.toLowerCase();

		if (email) {
			await this.checkUniqueEmails([email]);
		}

		if (data.password) {
			await this.checkPasswordPolicy([data.password]);
		}

		if (data.hasOwnProperty('tfa_secret')) {
			throw new InvalidPayloadException(`You can't change the "tfa_secret" value manually.`);
		}

		return await super.updateOne(key, data, opts);
	}

	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const email = data.email?.toLowerCase();

		if (email) {
			await this.checkUniqueEmails([email]);
		}

		if (data.password) {
			await this.checkPasswordPolicy([data.password]);
		}

		if (data.hasOwnProperty('tfa_secret')) {
			throw new InvalidPayloadException(`You can't change the "tfa_secret" value manually.`);
		}

		return await super.updateMany(keys, data, opts);
	}

	async updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const email = data.email?.toLowerCase();

		if (email) {
			await this.checkUniqueEmails([email]);
		}

		if (data.password) {
			await this.checkPasswordPolicy([data.password]);
		}

		if (data.hasOwnProperty('tfa_secret')) {
			throw new InvalidPayloadException(`You can't change the "tfa_secret" value manually.`);
		}

		return await super.updateByQuery(query, data, opts);
	}

	async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		// Make sure there's at least one admin user left after this deletion is done
		const otherAdminUsers = await this.knex
			.count('*', { as: 'count' })
			.from('directus_users')
			.whereNot('directus_users.id', key)
			.andWhere({ 'directus_roles.admin_access': true })
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.first();

		const otherAdminUsersCount = +(otherAdminUsers?.count || 0);

		if (otherAdminUsersCount === 0) {
			throw new UnprocessableEntityException(`You can't delete the last admin user.`);
		}

		await super.deleteOne(key, opts);

		return key;
	}

	async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		// Make sure there's at least one admin user left after this deletion is done
		const otherAdminUsers = await this.knex
			.count('*', { as: 'count' })
			.from('directus_users')
			.whereNotIn('directus_users.id', keys)
			.andWhere({ 'directus_roles.admin_access': true })
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.first();

		const otherAdminUsersCount = +(otherAdminUsers?.count || 0);

		if (otherAdminUsersCount === 0) {
			throw new UnprocessableEntityException(`You can't delete the last admin user.`);
		}

		await super.deleteMany(keys, opts);

		return keys;
	}

	async inviteUser(email: string | string[], role: string, url: string | null): Promise<void> {
		const emails = toArray(email);

		const urlWhitelist = toArray(env.USER_INVITE_URL_ALLOW_LIST);

		if (url && urlWhitelist.includes(url) === false) {
			throw new InvalidPayloadException(`Url "${url}" can't be used to invite users.`);
		}

		await this.knex.transaction(async (trx) => {
			const service = new ItemsService('directus_users', {
				schema: this.schema,
				accountability: this.accountability,
				knex: trx,
			});

			const mailService = new MailService({
				schema: this.schema,
				accountability: this.accountability,
				knex: trx,
			});

			for (const email of emails) {
				await service.createOne({ email, role, status: 'invited' });

				const payload = { email, scope: 'invite' };
				const token = jwt.sign(payload, env.SECRET as string, { expiresIn: '7d' });
				const inviteURL = url ?? env.PUBLIC_URL + '/admin/accept-invite';
				const acceptURL = inviteURL + '?token=' + token;

				await mailService.send({
					to: email,
					subject: "You've been invited",
					template: {
						name: 'user-invitation',
						data: {
							url: acceptURL,
							email,
						},
						system: true,
					},
				});
			}
		});
	}

	async acceptInvite(token: string, password: string): Promise<void> {
		const { email, scope } = jwt.verify(token, env.SECRET as string) as {
			email: string;
			scope: string;
		};

		if (scope !== 'invite') throw new ForbiddenException();

		const user = await this.knex.select('id', 'status').from('directus_users').where({ email }).first();

		if (!user || user.status !== 'invited') {
			throw new InvalidPayloadException(`Email address ${email} hasn't been invited.`);
		}

		const passwordHashed = await argon2.hash(password);

		await this.knex('directus_users').update({ password: passwordHashed, status: 'active' }).where({ id: user.id });

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}
	}

	async requestPasswordReset(email: string, url: string | null): Promise<void> {
		const user = await this.knex.select('id').from('directus_users').where({ email }).first();
		if (!user) throw new ForbiddenException();

		const mailService = new MailService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		const payload = { email, scope: 'password-reset' };
		const token = jwt.sign(payload, env.SECRET as string, { expiresIn: '1d' });

		const urlWhitelist = toArray(env.PASSWORD_RESET_URL_ALLOW_LIST);

		if (url && urlWhitelist.includes(url) === false) {
			throw new InvalidPayloadException(`Url "${url}" can't be used to reset passwords.`);
		}

		const acceptURL = url ? `${url}?token=${token}` : `${env.PUBLIC_URL}/admin/reset-password?token=${token}`;

		await mailService.send({
			to: email,
			subject: 'Password Reset Request',
			template: {
				name: 'password-reset',
				data: {
					url: acceptURL,
					email,
				},
				system: true,
			},
		});
	}

	async resetPassword(token: string, password: string): Promise<void> {
		const { email, scope } = jwt.verify(token, env.SECRET as string) as {
			email: string;
			scope: string;
		};

		if (scope !== 'password-reset') throw new ForbiddenException();

		const user = await this.knex.select('id', 'status').from('directus_users').where({ email }).first();

		if (!user || user.status !== 'active') {
			throw new ForbiddenException();
		}

		const passwordHashed = await argon2.hash(password);

		await this.knex('directus_users').update({ password: passwordHashed, status: 'active' }).where({ id: user.id });

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}
	}

	async enableTFA(pk: string): Promise<Record<string, string>> {
		const user = await this.knex.select('tfa_secret').from('directus_users').where({ id: pk }).first();

		if (user?.tfa_secret !== null) {
			throw new InvalidPayloadException('TFA Secret is already set for this user');
		}

		const authService = new AuthenticationService({
			knex: this.knex,
			schema: this.schema,
			accountability: this.accountability,
		});
		const secret = authService.generateTFASecret();

		await this.knex('directus_users').update({ tfa_secret: secret }).where({ id: pk });

		return {
			secret,
			url: await authService.generateOTPAuthURL(pk, secret),
		};
	}

	async disableTFA(pk: string): Promise<void> {
		await this.knex('directus_users').update({ tfa_secret: null }).where({ id: pk });
	}

	/**
	 * @deprecated Use `createOne` or `createMany` instead
	 */
	async create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async create(data: Partial<Item>): Promise<PrimaryKey>;
	async create(data: Partial<Item> | Partial<Item>[]): Promise<PrimaryKey | PrimaryKey[]> {
		logger.warn(
			'UsersService.create is deprecated and will be removed before v9.0.0. Use createOne or createMany instead.'
		);

		if (Array.isArray(data)) return this.createMany(data);
		return this.createOne(data);
	}

	/**
	 * @deprecated Use `updateOne` or `updateMany` instead
	 */
	update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
	update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async update(
		data: Partial<Item> | Partial<Item>[],
		key?: PrimaryKey | PrimaryKey[]
	): Promise<PrimaryKey | PrimaryKey[]> {
		if (Array.isArray(key)) return await this.updateMany(key, data);
		else if (key) await this.updateOne(key, data);

		const primaryKeyField = this.schema.collections[this.collection].primary;

		const keys: PrimaryKey[] = [];

		await this.knex.transaction(async (trx) => {
			const itemsService = new ItemsService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
			});

			const payloads = toArray(data);

			for (const single of payloads as Partial<Item>[]) {
				const payload = clone(single);
				const key = payload[primaryKeyField];

				if (!key) {
					throw new InvalidPayloadException('Primary key is missing in update payload.');
				}

				keys.push(key);

				await itemsService.updateOne(key, payload);
			}
		});

		return keys;
	}

	/**
	 * @deprecated Use `deleteOne` or `deleteMany` instead
	 */
	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		if (Array.isArray(key)) return await this.deleteMany(key);
		return await this.deleteOne(key);
	}
}
