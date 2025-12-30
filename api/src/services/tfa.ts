import { ItemsService } from './items.js';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import getDatabase from '../database/index.js';
import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';
import { authenticator } from 'otplib';

export class TFAService {
	knex: Knex;
	itemsService: ItemsService;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.itemsService = new ItemsService('directus_users', options);
	}

	async verifyOTP(key: PrimaryKey, otp: string, secret?: string): Promise<boolean> {
		if (secret) {
			return authenticator.check(otp, secret);
		}

		const user = await this.knex.select('tfa_secret').from('directus_users').where({ id: key }).first();

		if (!user?.tfa_secret) {
			throw new InvalidPayloadError({ reason: `User "${key}" doesn't have TFA enabled` });
		}

		return authenticator.check(otp, user.tfa_secret);
	}

	async generateTFA(key: PrimaryKey, requiresPassword: boolean = true): Promise<Record<string, string>> {
		const user = await this.knex
			.select('email', 'tfa_secret', 'provider', 'external_identifier')
			.from('directus_users')
			.where({ id: key })
			.first();

		if (user?.tfa_secret !== null) {
			throw new InvalidPayloadError({ reason: 'TFA Secret is already set for this user' });
		}

		// Only require email for non-OAuth users
		if (user?.provider === DEFAULT_AUTH_PROVIDER && !user?.email) {
			throw new InvalidPayloadError({ reason: 'User must have a valid email to enable TFA' });
		}

		if (!requiresPassword && user?.provider === DEFAULT_AUTH_PROVIDER) {
			throw new InvalidPayloadError({ reason: 'This method is only available for OAuth users' });
		}

		const secret = authenticator.generateSecret();
		const project = await this.knex.select('project_name').from('directus_settings').limit(1).first();

		// For OAuth users without email, use external_identifier as fallback
		const accountName = user.email || user.external_identifier || `user_${key}`;

		return {
			secret,
			url: authenticator.keyuri(accountName, project?.project_name || 'Directus', secret),
		};
	}

	async enableTFA(key: PrimaryKey, otp: string, secret: string): Promise<void> {
		const user = await this.knex.select('tfa_secret', 'provider').from('directus_users').where({ id: key }).first();

		const requiresPassword = user?.['provider'] === DEFAULT_AUTH_PROVIDER;

		if (user?.tfa_secret !== null) {
			throw new InvalidPayloadError({ reason: 'TFA Secret is already set for this user' });
		}

		if (!requiresPassword && user?.provider === DEFAULT_AUTH_PROVIDER) {
			throw new InvalidPayloadError({ reason: 'This method is only available for OAuth users' });
		}

		if (!authenticator.check(otp, secret)) {
			throw new InvalidPayloadError({ reason: `"otp" is invalid` });
		}

		await this.itemsService.updateOne(key, { tfa_secret: secret });
	}

	async disableTFA(key: PrimaryKey): Promise<void> {
		await this.itemsService.updateOne(key, { tfa_secret: null });
	}
}
