import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Knex } from 'knex';
import { clone } from 'lodash';
import getDatabase from '../database';
import env from '../env';
import {
	FailedValidationException,
	ForbiddenException,
	InvalidPayloadException,
	UnprocessableEntityException,
	InvalidCredentialsException,
} from '../exceptions';
import { RecordNotUniqueException } from '../exceptions/database/record-not-unique';
import { ContainsNullValuesException } from '../exceptions/database/contains-null-values';
import logger from '../logger';
import { AbstractServiceOptions, Accountability, Item, PrimaryKey, Query, SchemaOverview } from '../types';
import getAuthService from '../utils/get-auth-service';
import isUrlAllowed from '../utils/is-url-allowed';
import { toArray } from '../utils/to-array';
import { ItemsService, MutationOptions } from './items';
import { MailService } from './mail';
import { SettingsService } from './settings';

export class UsersService extends ItemsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	service: ItemsService;

	constructor(options: AbstractServiceOptions) {
		super('directus_users', options);

		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.service = new ItemsService('directus_users', options);
		this.schema = options.schema;
	}

	/**
	 * User email has to be unique case-insensitive. This is an additional check to make sure that
	 * the email is unique regardless of casing
	 */
	private async checkUniqueEmails(emails: string[], excludeKey?: PrimaryKey) {
		if (!emails.length) {
			return;
		}

		if (emails.some((email) => email === null)) {
			throw new ContainsNullValuesException('email', {
				collection: 'directus_users',
				field: 'email',
			});
		}

		const query = this.knex
			.select('email')
			.from('directus_users')
			.whereRaw(`LOWER(??) IN (${emails.map(() => '?')})`, ['email', ...emails.map((email) => email.toLowerCase())]);

		if (excludeKey) {
			query.whereNot('id', excludeKey);
		}

		const results = await query;

		if (results.length > 0) {
			throw new RecordNotUniqueException('email', {
				collection: 'directus_users',
				field: 'email',
				invalid: results[0].email,
			});
		}
	}

	/**
	 * Check if the provided password matches the strictness as configured in
	 * directus_settings.auth_password_policy
	 */
	private async checkPasswordPolicy(passwords: string[]) {
		if (!passwords.length) {
			return;
		}

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
		if (data.email) {
			await this.checkUniqueEmails([data.email]);
		} else {
			throw new InvalidPayloadException('Create user requires a valid email address.');
		}

		if (data.password !== undefined) {
			await this.checkPasswordPolicy([data.password]);
		}

		return await this.service.createOne(data, opts);
	}

	/**
	 * Create multiple new users
	 */
	async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const emails = data.map((payload: Record<string, any>) => payload.email).filter((e) => e);
		const passwords = data.map((payload) => payload.password).filter((pw) => pw);

		if (emails.length === data.length) {
			await this.checkUniqueEmails(emails);
		} else {
			throw new InvalidPayloadException('Create users requires valid email addresses.');
		}

		await this.checkPasswordPolicy(passwords);

		return await this.service.createMany(data, opts);
	}

	async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (data.email !== undefined) {
			await this.checkUniqueEmails([data.email], key);
		}

		if (data.password !== undefined) {
			await this.checkPasswordPolicy([data.password]);
		}

		if ('tfa_secret' in data) {
			throw new InvalidPayloadException(`You can't change the "tfa_secret" value manually.`);
		}

		if ('user_dn' in data) {
			throw new InvalidPayloadException(`You can't change the "user_dn" value manually.`);
		}

		if ('password' in data && this.accountability?.ldap) {
			throw new InvalidPayloadException(`You can't set a password for an LDAP user.`);
		}

		return await this.service.updateOne(key, data, opts);
	}

	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (data.email !== undefined) {
			await this.checkUniqueEmails([data.email]);
		}

		if (data.password !== undefined) {
			await this.checkPasswordPolicy([data.password]);
		}

		if ('tfa_secret' in data) {
			throw new InvalidPayloadException(`You can't change the "tfa_secret" value manually.`);
		}

		if ('user_dn' in data) {
			throw new InvalidPayloadException(`You can't change the "user_dn" value manually.`);
		}

		if ('password' in data && this.accountability?.ldap) {
			throw new InvalidPayloadException(`You can't set a password for an LDAP user.`);
		}

		return await this.service.updateMany(keys, data, opts);
	}

	async updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (data.email !== undefined) {
			await this.checkUniqueEmails([data.email]);
		}

		if (data.password !== undefined) {
			await this.checkPasswordPolicy([data.password]);
		}

		if ('tfa_secret' in data) {
			throw new InvalidPayloadException(`You can't change the "tfa_secret" value manually.`);
		}

		if ('user_dn' in data) {
			throw new InvalidPayloadException(`You can't change the "user_dn" value manually.`);
		}

		if ('password' in data && this.accountability?.ldap) {
			throw new InvalidPayloadException(`You can't set a password for an LDAP user.`);
		}

		return await this.service.updateByQuery(query, data, opts);
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

		await this.service.deleteOne(key, opts);

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

		await this.service.deleteMany(keys, opts);

		return keys;
	}

	async inviteUser(email: string | string[], role: string, url: string | null, subject?: string | null): Promise<void> {
		const emails = toArray(email);

		if (url && isUrlAllowed(url, env.USER_INVITE_URL_ALLOW_LIST) === false) {
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
				const subjectLine = subject ? subject : "You've been invited";

				await mailService.send({
					to: email,
					subject: subjectLine,
					template: {
						name: 'user-invitation',
						data: {
							url: acceptURL,
							email,
						},
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

		await this.service.updateOne(user.id, { password: await argon2.hash(password), status: 'active' });
	}

	async requestPasswordReset(email: string, url: string | null, subject?: string | null): Promise<void> {
		const user = await this.knex.select('id').from('directus_users').where({ email }).first();
		if (!user) throw new ForbiddenException();

		const mailService = new MailService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		const payload = { email, scope: 'password-reset' };
		const token = jwt.sign(payload, env.SECRET as string, { expiresIn: '1d' });

		if (url && isUrlAllowed(url, env.PASSWORD_RESET_URL_ALLOW_LIST) === false) {
			throw new InvalidPayloadException(`Url "${url}" can't be used to reset passwords.`);
		}

		const acceptURL = url ? `${url}?token=${token}` : `${env.PUBLIC_URL}/admin/reset-password?token=${token}`;
		const subjectLine = subject ? subject : 'Password Reset Request';

		await mailService.send({
			to: email,
			subject: subjectLine,
			template: {
				name: 'password-reset',
				data: {
					url: acceptURL,
					email,
				},
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

		await this.service.updateOne(user.id, { password: await argon2.hash(password), status: 'active' });
	}

	async generateTFA(pk: string): Promise<Record<string, string>> {
		const user = await this.knex.select('tfa_secret').from('directus_users').where({ id: pk }).first();

		if (user?.tfa_secret !== null) {
			throw new InvalidPayloadException('TFA Secret is already set for this user');
		}

		const authService = new (getAuthService(this.accountability))({
			knex: this.knex,
			schema: this.schema,
			accountability: this.accountability,
		});
		const secret = authService.generateTFASecret();

		return {
			secret,
			url: await authService.generateOTPAuthURL(pk, secret),
		};
	}

	async enableTFA(pk: string, otp: string, secret: string): Promise<void> {
		const authService = new (getAuthService(this.accountability))({
			schema: this.schema,
		});

		if (!pk) {
			throw new InvalidCredentialsException();
		}

		const otpValid = await authService.verifyOTP(pk, otp, secret);

		if (otpValid === false) {
			throw new InvalidPayloadException(`"otp" is invalid`);
		}

		const userSecret = await this.knex.select('tfa_secret').from('directus_users').where({ id: pk }).first();

		if (userSecret?.tfa_secret !== null) {
			throw new InvalidPayloadException('TFA Secret is already set for this user');
		}

		await this.updateOne(pk, { tfa_secret: secret });
	}

	async disableTFA(pk: string): Promise<void> {
		await this.updateOne(pk, { tfa_secret: null });
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
