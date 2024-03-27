import type { Knex } from 'knex';
import { authenticator } from 'otplib';
import getDatabase from '../database/index.js';
import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, PrimaryKey } from '../types/index.js';
import { ItemsService } from './items.js';

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

	async generateTFA(key: PrimaryKey): Promise<Record<string, string>> {
		const user = await this.knex.select('email', 'tfa_secret').from('directus_users').where({ id: key }).first();

		if (user?.tfa_secret !== null) {
			throw new InvalidPayloadError({ reason: 'TFA Secret is already set for this user' });
		}

		if (!user?.email) {
			throw new InvalidPayloadError({ reason: 'User must have a valid email to enable TFA' });
		}

		const secret = authenticator.generateSecret();
		const project = await this.knex.select('project_name').from('directus_settings').limit(1).first();

		return {
			secret,
			url: authenticator.keyuri(user.email, project?.project_name || 'Directus', secret),
		};
	}

	async enableTFA(key: PrimaryKey, otp: string, secret: string): Promise<void> {
		const user = await this.knex.select('tfa_secret').from('directus_users').where({ id: key }).first();

		if (user?.tfa_secret !== null) {
			throw new InvalidPayloadError({ reason: 'TFA Secret is already set for this user' });
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
