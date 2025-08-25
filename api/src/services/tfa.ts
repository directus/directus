import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';
import { authenticator } from 'otplib';
import getDatabase from '../database/index.js';
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

	async generateTFA(key: PrimaryKey, requiresPassword: boolean = true): Promise<Record<string, string>> {
		const user = await this.knex
			.select('email', 'tfa_secret', 'provider', 'require_tfa_setup', 'external_identifier')
			.from('directus_users')
			.where({ id: key })
			.first();

		if (user?.tfa_secret !== null) {
			throw new InvalidPayloadError({ reason: 'TFA Secret is already set for this user' });
		}

		// Only require email for non-OAuth users
		if (user?.provider === 'default' && !user?.email) {
			throw new InvalidPayloadError({ reason: 'User must have a valid email to enable TFA' });
		}

		// For OAuth users, check if 2FA setup is requested or role-based enforcement
		if (!requiresPassword && user?.provider === 'default') {
			throw new InvalidPayloadError({ reason: 'This method is only available for OAuth users' });
		}

		if (!requiresPassword) {
			// For OAuth users, allow if they have require_tfa_setup true OR role-based enforcement
			if (user?.provider !== 'default') {
				// Check if user has role-based enforcement
				const roleEnforcement = await this.knex
					.select('directus_policies.enforce_tfa')
					.from('directus_users')
					.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
					.leftJoin('directus_access', 'directus_roles.id', 'directus_access.role')
					.leftJoin('directus_policies', 'directus_access.policy', 'directus_policies.id')
					.where('directus_users.id', key)
					.where('directus_policies.enforce_tfa', true)
					.first();

				if (!roleEnforcement && user?.require_tfa_setup !== true) {
					throw new InvalidPayloadError({ reason: '2FA setup is not requested for this user' });
				}
			}
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

	async enableTFA(key: PrimaryKey, otp: string, secret: string, requiresPassword: boolean = true): Promise<void> {
		const user = await this.knex
			.select('tfa_secret', 'provider', 'require_tfa_setup')
			.from('directus_users')
			.where({ id: key })
			.first();

		if (user?.tfa_secret !== null) {
			throw new InvalidPayloadError({ reason: 'TFA Secret is already set for this user' });
		}

		// For OAuth users, check if 2FA setup is requested or role-based enforcement
		if (!requiresPassword && user?.provider === 'default') {
			throw new InvalidPayloadError({ reason: 'This method is only available for OAuth users' });
		}

		if (!requiresPassword) {
			// For OAuth users, allow if they have require_tfa_setup true OR role-based enforcement
			if (user?.provider !== 'default') {
				// Check if user has role-based enforcement
				const roleEnforcement = await this.knex
					.select('directus_policies.enforce_tfa')
					.from('directus_users')
					.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
					.leftJoin('directus_access', 'directus_roles.id', 'directus_access.role')
					.leftJoin('directus_policies', 'directus_access.policy', 'directus_policies.id')
					.where('directus_users.id', key)
					.where('directus_policies.enforce_tfa', true)
					.first();

				if (!roleEnforcement && user?.require_tfa_setup !== true) {
					throw new InvalidPayloadError({ reason: '2FA setup is not requested for this user' });
				}
			}
		}

		if (!authenticator.check(otp, secret)) {
			throw new InvalidPayloadError({ reason: `"otp" is invalid` });
		}

		// For OAuth users, set require_tfa_setup to false after completion
		const updateData: Record<string, any> = { tfa_secret: secret };

		if (!requiresPassword) {
			updateData['require_tfa_setup'] = false;
		}

		await this.itemsService.updateOne(key, updateData);
	}

	async disableTFA(key: PrimaryKey): Promise<void> {
		await this.itemsService.updateOne(key, { tfa_secret: null });
	}

	async request2FASetup(key: PrimaryKey): Promise<void> {
		const user = await this.knex
			.select('provider', 'tfa_secret', 'require_tfa_setup')
			.from('directus_users')
			.where({ id: key })
			.first();

		if (user.provider === 'default') {
			throw new InvalidPayloadError({ reason: 'This method is only available for OAuth users' });
		}

		if (user.tfa_secret !== null) {
			throw new InvalidPayloadError({ reason: 'TFA is already enabled for this user' });
		}

		if (user.require_tfa_setup === true) {
			throw new InvalidPayloadError({ reason: '2FA setup is already requested for this user' });
		}

		await this.itemsService.updateOne(key, { require_tfa_setup: true });
	}

	async cancel2FASetup(key: PrimaryKey): Promise<void> {
		const user = await this.knex
			.select('provider', 'tfa_secret', 'require_tfa_setup')
			.from('directus_users')
			.where({ id: key })
			.first();

		if (user.provider === 'default') {
			throw new InvalidPayloadError({ reason: 'This method is only available for OAuth users' });
		}

		if (user.tfa_secret !== null) {
			throw new InvalidPayloadError({ reason: 'TFA is already enabled for this user' });
		}

		if (user.require_tfa_setup !== true) {
			throw new InvalidPayloadError({ reason: 'No 2FA setup request to cancel' });
		}

		await this.itemsService.updateOne(key, { require_tfa_setup: false });
	}
}
