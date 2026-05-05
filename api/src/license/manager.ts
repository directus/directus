import { useEnv } from '@directus/env';
import { LicenseImmutableError } from '@directus/errors';
import type { LicenseSource, LicenseStatus, PendingResolution } from '@directus/license';
import {
	activateKey,
	billinPortal,
	CORE_LICENSE,
	deactivateKey,
	deleteAddon,
	License,
	type LicensePendingResolution,
	type LicenseSource,
	type LicenseStatus,
	previewKey,
	refreshLicense,
	updateAddonQuantity,
	updateKey,
	verifyLicense,
} from '@directus/license';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import licenseCheckSchedule from '../schedules/license.js';
import { CollectionsService } from '../services/collections.js';
import { AccessService, PoliciesService, UsersService } from '../services/index.js';
import { SettingsService } from '../services/settings.js';
import { fetchAccessRoles } from '../utils/fetch-user-count/fetch-access-roles.js';
import { getSchema } from '../utils/get-schema.js';
import { useStore } from '../utils/store.js';
import { useRPC } from './rpc.js';
import type { ResolveInput } from './schema.js';
import { getStatus } from './status.js';

let licenseManager: LicenseManager | undefined;
const env = useEnv();
const logger = useLogger();
const LICENSE_CHANNEL = `license`;
let licenseCache: License | undefined;

type LicenseStore = {
	initialized: true | undefined;
	status: LicenseStatus | undefined;
};

const store = useStore<LicenseStore>(String(env['LICENSE_NAMESPACE']));

export async function getLicense(options?: { database?: Knex }): Promise<License> {
	if (licenseCache) return licenseCache;

	const { token } = await getLicenseToken(options);

	if (!token) {
		licenseCache = CORE_LICENSE;
	} else {
		licenseCache = await verifyLicense(token);
	}

	return licenseCache;
}

export function getLicenseManager(): LicenseManager {
	if (licenseManager) {
		return licenseManager;
	}

	licenseManager = new LicenseManager();

	return licenseManager;
}

export class LicenseManager {
	private licenseKey: string | null = null;
	private licenseToken: string | null = null;
	/** Where the key or token comes from */
	private source: LicenseSource = null;
	private rpc = useRPC<Pick<LicenseManager, 'refreshCache'>>(this, LICENSE_CHANNEL);

	/**
	 * Initialize license state based on the following state permutations.
	 *
	 * | envKey | envToken | dbKey | dbToken | diff | Outcome                                      |  id  |
	 * | :----: | :------: | :---: | :-----: | :--: | -------------------------------------------- | ---- |
	 * |   ✓    |    ✓     |   *   |    *    |   *  | **Error** — both env vars set, process exits |  A  |
	 * |   ✓    |    -     |   ✓   |    *    |  ✓   | update                                      |  B   |
	 * |   ✓    |    -     |   ✓   |    *    |  -   | verify, refresh                             |  C   |
	 * |   ✓    |    -     |   -   |    *    |  -   | activate                                     |  D  |
	 * |   -    |    ✓     |   *   |    *    |  -   | verify offline token, cleanup DB             |  E   |
	 * |   -    |    -     |   ✓   |    ✓    |  -   | verify token + refresh                       |  F  |
	 * |   -    |    -     |   ✓   |    -    |  -   | activate                                     |  G   |
	 * |   -    |    -     |   -   |    ✓    |  -   | cleanup and CORE_LICENSE                     |  H   |
	 * |   -    |    -     |   -   |    -    |  -   |  CORE_LICENSE                                |  I   |
	 */
	public async initialize(): Promise<void> {
		// Lock the whole store for the entirety of initialization
		await store(async (store) => {
			if (await store.get('initialized')) return;

			const envKey = env['LICENSE_KEY'] as string | undefined;
			const envToken = env['LICENSE_TOKEN'] as string | undefined;

			const settingsService = new SettingsService({ schema: await getSchema() });

			// CASE A
			if (envKey && envToken) {
				logger.error('LICENSE_KEY and LICENSE_TOKEN cannot both be set. Provide one or the other.');
				process.exit(1);
			}

			const { license_key: dbKey, license_token: dbToken } = await settingsService.readSingleton({
				fields: ['license_key', 'license_token'],
			});

			// CASE I
			if (!envKey && !envToken && !dbKey) {
				// CASE H
				if (dbToken) {
					await this.downgrade();
				}

				// Use core license
				await store.set('status', 'active');
				return;
			}

			// CASE D
			if (envKey && !dbKey) {
				this.source = 'env';
				await this.activate(envKey);
			}

			if (envKey && dbKey) {
				this.source = 'env';

				// CASE B else C
				if (envKey !== dbKey) {
					await this.update(dbKey, envKey);
				} else {
					await this.refresh({ key: envKey, token: dbToken ?? null });
				}
			}

			// CASE E
			if (envToken) {
				this.source = 'env';
				await this.verify(envToken);
			}

			if (dbKey) {
				this.source = 'settings';

				// CASE F else G
				if (dbToken) {
					await this.refresh({ key: dbKey, token: dbToken });
				} else {
					await this.activate(dbKey);
				}
			}

			await store.set('initialized', true);
		});
	}

	public async getStatus() {
		const status = await store(async (store) => store.get('status'));

		return status ?? 'active';
	}

	public getSource() {
		return this.source;
	}

	public async assertMutable(options: { action: string; bypassCore?: boolean }): Promise<void> {
		const license = await getLicense();

		// offline
		if (this.licenseKey === null && license.meta.offline) {
			throw new LicenseImmutableError({ action: options?.action, source: 'Offline' });
		}

		// env source
		if (this.source === 'env') {
			throw new LicenseImmutableError({ action: options?.action, source: 'Env-sourced' });
		}

		// core tier
		if (options?.bypassCore !== true && this.source === null) {
			throw new LicenseImmutableError({ action: options?.action, source: 'Core' });
		}
	}

	public async isLocked() {
		const status = await this.getStatus();

		// LICENSE-TODO: revert
		return false;

		// return ['expired', 'suspended', 'locked'].includes(status);
	}

	/**
	 *  Check a license meta/info without activating it
	 */
	public async check(key: string) {
		return previewKey({
			license_key: key,
		});
	}

	/**
	 * Activates a new license and overwrites an existing one
	 */
	public async activate(key: string) {
		// bypass core tier for core -> key flow
		this.assertMutable({ action: 'activation', bypassCore: true });

		const license: License | null = null;
		let error: Error | undefined;

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		try {
			const { token, new_project_id } = await activateKey({
				license_key: key,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			});

			await settingsService.upsertSingleton({
				license_key: key,
				license_token: token,
				project_id: new_project_id ?? project_id!,
			});

			this.rpc.refreshCache();
		} catch (err) {
			error = err as Error;
			await this.downgrade();
			throw err;
		} finally {
			await store(async (store) => {
				await store.set('status', getStatus(license, error));
			});
		}
	}

	public async deactivate(key?: string) {
		this.assertMutable({ action: 'deactivation' });

		const currentKey = this.licenseKey ?? key;

		if (!currentKey) {
			throw new TypeError('"key" has to be defined in order to deactivate');
		}

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		await deactivateKey({
			license_key: currentKey,
			project_id: project_id!,
			public_url: env['PUBLIC_URL'] as string,
		});

		await this.downgrade();
	}

	/**
	 * Update from an existing key to a new key
	 */
	public async update(oldKey: string, newKey: string) {
		this.assertMutable({ action: 'update' });

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const { token } = await updateKey(
			{
				license_key: oldKey,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			},
			{ license_key: newKey },
		);

		await settingsService.upsertSingleton({
			license_key: newKey,
			license_token: token,
			project_id: project_id!,
		});

		this.rpc.refreshCache();
	}

	private async verify(token: string): Promise<License | null> {
		try {
			return await verifyLicense(token);
		} catch (e) {
			logger.warn('Failed to verify license token defaulting to "core"', { error: e });
		}

		return null;
	}

	/**
	 * Verifys a current token and refreshes it with a new token
	 */
	public async refresh(options?: { key: string; token?: string | null }): Promise<void> {
		const key = this.licenseKey ?? options?.key;
		const token = this.licenseToken ?? options?.token;

		if (!key) {
			throw new TypeError('key has to be defined in order to refresh');
		}

		let license: License | null = null;
		let error: Error | undefined;

		const settingsService = new SettingsService({ schema: await getSchema() });

		if (token) {
			license = await this.verify(token);
		}

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		if (license?.meta.offline === false) {
			try {
				const { token } = await refreshLicense(
					{
						license_key: key,
						project_id: project_id!,
						public_url: env['PUBLIC_URL'] as string,
					},
					{
						// LICENSE-TODO: Add actual usage
						usage_metrics: {
							seats: 4,
							collections: 3,
							flows: 2,
						},
					},
				);

				await settingsService.upsertSingleton({
					license_token: token,
				});

				this.rpc.refreshCache();

				license = await verifyLicense(token);
			} catch (err) {
				error = err as Error;
				// TODO: Should not clear when license API unavailable
				await this.downgrade();
			}
		}

		await store(async (store) => {
			await store.set('status', getStatus(license, error));
		});
	}

	public async billingPortalUrl() {
		this.assertMutable({ action: 'view portal' });

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const { url } = await billinPortal({
			license_key: this.licenseKey!,
			project_id: project_id!,
			public_url: env['PUBLIC_URL'] as string,
		});

		return url;
	}

	public async availableAddons() {
		this.assertMutable({ action: 'list addons' });

		// TODO: replace mock
		return [
			{
				id: 'addon_collections_pack',
				name: 'Data Model Collections',
				description: 'Additional +25 collections per pack',
				icon: 'deployed_code',
				availability: 'available',
				pricing_summary: '$100.00 per 25 collections / pack',
				min_quantity: 1,
				max_quantity: null,
				active_quantity: 0,
				scheduled_quantity: 0,
			},
			{
				id: 'addon_user_seats',
				name: 'User Seats',
				description: 'Additional user seats',
				icon: 'person_add',
				availability: 'available',
				pricing_summary: '$15.00 per seat',
				min_quantity: 1,
				max_quantity: null,
				active_quantity: 5,
				scheduled_quantity: 3,
			},
		];

		// const settingsService = new SettingsService({ schema: await getSchema() });

		// const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		// return listAddons({
		// 	license_key: this.licenseKey!,
		// 	project_id: project_id!,
		// });
	}

	public async setAddonQuantity(options: { addonId: string; quantity: number }) {
		this.assertMutable({ action: 'set addon quantity' });

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		await updateAddonQuantity(
			{
				license_key: this.licenseKey!,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			},
			{
				addons: [
					{
						addon_id: options.addonId,
						quantity: options.quantity,
					},
				],
				// LICENSE-TODO: Add actual usage
				usage_metrics: {
					seats: 4,
					collections: 3,
					flows: 2,
				},
			},
		);
	}

	public async removeAddon(addonId: string) {
		this.assertMutable({ action: 'remove addon' });

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		await deleteAddon(
			{
				license_key: this.licenseKey!,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			},
			{ addon_ids: [addonId] },
		);
	}

	/**
	 * Retrieve entitlements that are pending resolution
	 *
	 * If no entitlements to resolve, an empty array will be returned
	 */
	public async pendingResolution(options: { adminId: string }) {
		const pendingResolution: LicensePendingResolution[] = [];
		const schema = await getSchema();

		// collection candidates = all collections not marked as disabled, db only or system
		const collectionsService = new CollectionsService({ schema });
		const collections = await collectionsService.readByQuery();

		const collectionCandidates = [];

		for (const candidateCollection of collections) {
			// LICENSE-TODO: re-check field for determining disables/excluded
			if (
				candidateCollection.meta?.system !== true &&
				(candidateCollection.schema !== null || candidateCollection.status !== 'disabled')
			) {
				collectionCandidates.push(candidateCollection.collection);
			}
		}

		if (collectionCandidates.length) {
			pendingResolution.push({
				key: 'collections',
				kind: 'limit',
				// LICENSE-TODO: replace with entitlemount count
				limit: 50,
				usage: 54,
				candidates: collectionCandidates,
			});
		}

		// seat candidates = all active users who are admin or app users
		const accessService = new AccessService({ schema });

		const accessRows = await accessService.readByQuery({
			fields: ['role', 'user', 'policy', 'policy.app_access', 'policy.admin_access', 'role'],
		});

		const adminRoles = new Set<string>();
		const appRoles = new Set<string>();
		const adminOrAppUsers = new Set<string>();

		for (const accessRow of accessRows) {
			const isAdmin = toBoolean(accessRow['admin_access']);
			const isApp = !isAdmin && toBoolean(accessRow['app_access']);

			if (!isAdmin && !isApp) continue;

			if (accessRow['user']) {
				adminOrAppUsers.add(accessRow['user']);
			} else if (accessRow['role']) {
				if (isAdmin) {
					adminRoles.add(accessRow['role']);
				} else {
					appRoles.add(accessRow['role']);
				}
			}
		}

		const { adminRoles: allAdminRoles, appRoles: allAppRoles } = await fetchAccessRoles(
			{
				adminRoles,
				appRoles,
			},
			{ knex: await getDatabase() },
		);

		const usersService = new UsersService({ schema });

		const seatCandidates = await usersService.readByQuery({
			fields: ['id', 'first_name', 'last_name', 'avatar'],
			filter: {
				_and: [
					{
						id: {
							_neq: options.adminId,
						},
					},
					{
						_or: [
							{
								id: {
									_in: Array.from(adminOrAppUsers),
								},
							},
							{
								role: {
									_in: Array.from(allAdminRoles),
								},
							},
							{
								role: {
									_in: Array.from(allAppRoles),
								},
							},
						],
					},
				],
			},
		});

		if (seatCandidates.length) {
			pendingResolution.push({
				key: 'seats',
				kind: 'limit',
				// LICENSE-TODO: replace with entitlemount count
				limit: 5,
				usage: 10,
				candidates: seatCandidates as {
					id: string;
					first_name: string | null;
					last_name: string | null;
					avatar: string | null;
				}[],
			});
		}

		// sso feature gate = at least one user with provider != default if sso disabled for license
		const license = await getLicense();
		// LICENSE-TODO: replace with entitlement check
		const hasSSOUsers = true;
		// LICENSE-TODO: replace with entitlement check
		const isSSOEnabled = license.entitlements.sso_enabled.default;

		if (!isSSOEnabled && hasSSOUsers) {
			const adminUser = await usersService.readOne(options.adminId, { fields: ['email', 'password'] });

			// Build blocklist for any additional requirements
			const blockers = [];

			if (adminUser['email'] === null) {
				blockers.push('ADMIN_MISSING_EMAIL');
			}

			if (adminUser['password'] === null) {
				blockers.push('ADMIN_MISSING_EMAIL');
			}

			pendingResolution.push({
				key: 'sso_enabled',
				kind: 'feature_gate',
				blockers: ['ADMIN_MISSING_EMAIL', 'ADMIN_MISSING_PASSWORD'],
			});
		}

		// custom llms feature gate - any openai compatible settings are set
		// LICENSE-TODO: replace with entitlement check
		const isCustomLLMsEnabled = license.entitlements.custom_llms_enabled.default;

		if (!isCustomLLMsEnabled) {
			const settingsService = new SettingsService({ schema });

			const customLLMFields = await settingsService.readSingleton({
				fields: [
					'ai_openai_compatible_api_key',
					'ai_openai_compatible_base_url',
					'ai_openai_compatible_name',
					'ai_openai_compatible_models',
					'ai_openai_compatible_headers',
				],
			});

			if (Object.keys(customLLMFields).length) {
				pendingResolution.push({
					key: 'custom_llms_enabled',
					kind: 'feature_gate',
				});
			}
		}

		// custom policy rules - any policy with a custom permission set
		// LICENSE-TODO: replace with entitlement check
		const isCustomPolicyRulesEnabled = license.entitlements.custom_permission_rules_enabled.default;

		if (!isCustomPolicyRulesEnabled) {
			const policiesService = new PoliciesService({ schema });

			const customPolicyRules = await policiesService.readByQuery({
				fields: ['id'],
				filter: {
					_or: [
						{
							permissions: {
								permissions: {
									_nnull: true,
								},
							},
						},
						{
							permissions: {
								validation: {
									_nnull: true,
								},
							},
						},
						{
							permissions: {
								presets: {
									_nnull: true,
								},
							},
						},
						{
							_and: [
								{
									permissions: {
										fields: {
											_neq: '*',
										},
									},
								},
								{
									permissions: {
										fields: {
											_nnull: true,
										},
									},
								},
							],
						},
					],
				},
			});

			if (customPolicyRules.length) {
				pendingResolution.push({
					key: 'custom_permission_rules_enabled',
					kind: 'feature_gate',
				});
			}
		}

		return pendingResolution;
	}

	/**
	 * Apply a resolution strategy
	 *
	 * Allows partial resolution
	 */
	public async applyResolution(adminId: string, resolution: ResolveInput) {
		const schema = await getSchema();

		if (resolution.collections) {
			const collectionsService = new CollectionsService({ schema });

			const promises = resolution.collections.map((collection) =>
				collectionsService.updateOne(collection, { status: 'disabled' }),
			);

			try {
				await Promise.allSettled(promises);
			} catch {
				// ignore errors
			}
		}

		if (resolution.seats) {
			const usersService = new UsersService({ schema });

			const promises = resolution.seats.map((user) => usersService.updateOne(user, { status: 'deactivated' }));

			try {
				await Promise.allSettled(promises);
			} catch {
				// ignore errors
			}
		}

		/**
		 * Set all sso users to disabled and optional set the current admin email and password
		 */
		if (resolution.sso) {
			const usersService = new UsersService({ schema });

			try {
				await usersService.updateByQuery(
					{
						filter: {
							_and: [
								{ provider: { _neq: DEFAULT_AUTH_PROVIDER } },
								{ provider: { _nnull: true } },
								{ id: { _neq: adminId } },
							],
						},
					},
					{ status: 'deactivated' },
				);

				if (typeof resolution.sso === 'object' && Object.keys(resolution.sso.admin).length) {
					const payload: { email?: string | undefined; password?: string; provider: string } = {
						provider: DEFAULT_AUTH_PROVIDER,
					};

					if (resolution.sso.admin.email && resolution.sso.admin.email.length) {
						payload['email'] = resolution.sso.admin.email;
					}

					if (resolution.sso.admin.password && resolution.sso.admin.password.length) {
						payload['password'] = resolution.sso.admin.password;
					}

					await usersService.updateOne(adminId, payload);
				}
			} catch {
				// ignore errors
			}
		}
	}

	public async refreshCache() {
		licenseCache = undefined;
		const oldSource = this.source;

		const { source: keySource, key } = await getLicenseKey();
		const { token } = await getLicenseToken();

		this.licenseKey = key;
		this.licenseToken = token;

		/**
		 * Upgrade from core tier requires registering the scheduled check
		 * De-register on downgrade is handled in the schedule
		 */
		if (oldSource === null && keySource === 'settings') {
			licenseCheckSchedule();
		}
	}

	/**
	 * Downgrade internal tracker to core, does NOT unbind existing key
	 */
	private async downgrade() {
		const settingsService = new SettingsService({ schema: await getSchema() });
		await settingsService.upsertSingleton({ license_token: null });

		this.rpc.refreshCache();
	}
}

async function getLicenseKey(options?: { database?: Knex }): Promise<{ source: LicenseSource; key: string | null }> {
	if (env['LICENSE_KEY']) {
		return {
			source: 'env',
			key: String(env['LICENSE_KEY']),
		};
	}

	const schema = await getSchema(options);
	const settingsService = new SettingsService({ schema, ...options });

	const { license_key } = await settingsService.readSingleton({ fields: ['license_key'] });

	return {
		source: 'settings',
		key: license_key ?? null,
	};
}

async function getLicenseToken(options?: {
	database?: Knex;
}): Promise<{ source: LicenseSource; token: string | null }> {
	if (env['LICENSE_TOKEN']) {
		return {
			source: 'env',
			token: String(env['LICENSE_TOKEN']),
		};
	}

	const schema = await getSchema(options);
	const settingsService = new SettingsService({ schema, ...options });

	const { license_token } = await settingsService.readSingleton({ fields: ['license_token'] });
	return {
		source: 'settings',
		token: license_token ?? null,
	};
}
