import { useEnv } from '@directus/env';
import { LicenseImmutableError } from '@directus/errors';
import {
	activateKey,
	billinPortal,
	CORE_LICENSE,
	deactivateKey,
	deleteAddon,
	License,
	type LicenseAddonOutput,
	type LicensePendingResolution,
	type LicensePendingResolutionOutput,
	type LicenseSource,
	type LicenseStatus,
	listAddons,
	previewKey,
	refreshLicense,
	ResolveInput,
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
import { AccessService, FlowsService, UsersService } from '../services/index.js';
import { SettingsService } from '../services/settings.js';
import { fetchAccessRoles } from '../utils/fetch-user-count/fetch-access-roles.js';
import { getSchema } from '../utils/get-schema.js';
import { useStore } from '../utils/store.js';
import { getEntitlementManager } from './entitlements/manager.js';
import { getLicenseKey } from './lib/get-license-key.js';
import { getLicenseToken } from './lib/get-license-token.js';
import { getStatus } from './utils/get-status.js';
import { useRPC } from './utils/use-rpc.js';

const env = useEnv();
const logger = useLogger();
const LICENSE_CHANNEL = `license`;
let licenseCache: License | undefined;

type LicenseStore = {
	initialized: true | undefined;
	status: LicenseStatus | undefined;
};

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

let licenseManager: LicenseManager | undefined;

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
	private store = useStore<LicenseStore>(String(env['LICENSE_NAMESPACE']));

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
		const existingStore = this.store;

		try {
			// Register entitlement enforcement for all instances
			const entitlementManager = getEntitlementManager();
			entitlementManager.registerHandlers();

			// Lock the whole store for the entirety of initialization
			await this.store(async (store) => {
				// Replace existing store temporarely to avoid deadlocks
				this.store = (cb) => {
					return cb(store);
				};

				if (await store.get('initialized')) return;

				const envKey = env['LICENSE_KEY'] as string | undefined;
				const envToken = env['LICENSE_TOKEN'] as string | undefined;

				// CASE A
				if (envKey && envToken) {
					logger.error('LICENSE_KEY and LICENSE_TOKEN cannot both be set. Provide one or the other.');
					process.exit(1);
				}

				const settingsService = new SettingsService({ schema: await getSchema() });

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
						await this.update(dbKey, { oldKey: envKey });
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
		} finally {
			this.store = existingStore;
		}
	}

	public async getStatus() {
		const status = await this.store(async (store) => store.get('status'));

		return status ?? 'active';
	}

	public getSource() {
		return this.source;
	}

	public async assertMutable(options: { action: string; bypassCore?: boolean }): Promise<void> {
		// LICENSE-TODO
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
	public async preview(key: string) {
		return previewKey({
			license_key: key,
		});
	}

	/**
	 * Activates a new license and overwrites an existing one
	 */
	public async activate(key: string) {
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
			await this.store(async (store) => {
				await store.set('status', getStatus(license, error));
			});
		}
	}

	public async deactivate(key?: string) {
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
	public async update(newKey: string, options?: { oldKey: string }) {
		const currentKey = this.licenseKey ?? options?.oldKey;

		if (!currentKey) {
			throw new TypeError('"oldKey" has to be defined in order to update');
		}

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const { token } = await updateKey(
			{
				license_key: currentKey,
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

		await this.store(async (store) => {
			await store.set('status', getStatus(license, error));
		});
	}

	public async billingPortalUrl() {
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const { url } = await billinPortal({
			license_key: this.licenseKey!,
			project_id: project_id!,
			public_url: env['PUBLIC_URL'] as string,
		});

		return url;
	}

	public async availableAddons(): Promise<LicenseAddonOutput> {
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const addons = await listAddons({
			license_key: this.licenseKey!,
			project_id: project_id!,
			public_url: env['PUBLIC_URL'] as string,
		});

		return addons.available_addons.map((addon) => ({
			id: addon.id,
			name: addon.name,
			description: addon.description,
			icon: addon.icon,
			upgrade_required: addon.upgrade_required,
			pricing_summary: addon.pricing_summary,
			min_quantity: addon.min_quantity,
			max_quantity: addon.max_quantity,
			active_quantity: addon.active_quantity,
		}));
	}

	public async setAddonQuantity(options: { addonId: string; quantity: number }) {
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const entitlementManager = getEntitlementManager();

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

				usage_metrics: {
					seats: await entitlementManager.getUsage('seats'),
					collections: await entitlementManager.getUsage('collections'),
					// LICENSE-TODO: Add actual usage
					flows: 2,
				},
			},
		);
	}

	public async removeAddon(addonId: string) {
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
	public async pendingResolution(options: {
		adminId: string;
		licenseKey?: string;
	}): Promise<LicensePendingResolutionOutput> {
		const pendingResolution: LicensePendingResolution[] = [];

		const schema = await getSchema();
		const entitlementManager = getEntitlementManager();

		const collection = await entitlementManager.check('collections');

		if (collection.allowed == false) {
			const collectionsService = new CollectionsService({ schema });
			const collections = await collectionsService.readByQuery();

			const candidateCollections = [];

			for (const candidateCollection of collections) {
				// LICENSE-TODO: re-check field for determining disables/excluded
				if (
					candidateCollection.meta?.system !== true &&
					candidateCollection.schema !== null &&
					candidateCollection.status !== 'disabled'
				) {
					candidateCollections.push(candidateCollection.collection);
				}
			}

			if (candidateCollections.length) {
				pendingResolution.push({
					key: 'collections',
					kind: 'limit',
					// LICENSE-TODO: Remove if hardlimit updated to -1
					limit: collection.hardLimit!,
					usage: collection.usage,
					candidates: candidateCollections,
				});
			}
		}

		const seats = await entitlementManager.check('seats');

		if (seats.allowed == false) {
			const accessService = new AccessService({ schema });

			const accessRows = await accessService.readByQuery({
				fields: ['role', 'user.id', 'user.status', 'user.role', 'policy.app_access', 'policy.admin_access'],
			});

			const adminRoles = new Set<string>();
			const appRoles = new Set<string>();
			const adminUsers = new Set<string>();
			const appUsers = new Set<string>();

			for (const accessRow of accessRows) {
				const isAdmin = toBoolean(accessRow['policy']?.['admin_access']);
				const isApp = !isAdmin && toBoolean(accessRow['policy']?.['app_access']);

				if (!isAdmin && !isApp) continue;

				if (accessRow['user'] && accessRow['user'].status === 'active') {
					if (isAdmin) {
						adminUsers.add(accessRow['user'].id);
					} else if (
						adminUsers.has(accessRow['user'].id) === false &&
						adminRoles.has(accessRow['user']?.role) === false
					) {
						appUsers.add(accessRow['user'].id);
					}
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

			const adminCandidates = await usersService.readByQuery({
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
										_in: Array.from(adminUsers),
									},
								},
								{
									role: {
										_in: Array.from(allAdminRoles),
									},
								},
							],
						},
					],
				},
			});

			const appCandidates = await usersService.readByQuery({
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
										_in: Array.from(appUsers),
										_nin: Array.from(adminUsers),
									},
								},
								{
									role: {
										_in: Array.from(allAppRoles),
										_nin: Array.from(allAdminRoles),
									},
								},
							],
						},
					],
				},
			});

			if (adminCandidates.length || appCandidates.length) {
				pendingResolution.push({
					key: 'seats',
					kind: 'limit',
					// LICENSE-TODO: Remove if hardlimit updated to -1
					limit: seats.hardLimit!,
					usage: seats.usage,
					candidates: [...appCandidates, ...adminCandidates.map((admin) => ({ ...admin, admin: true }))] as any,
				});
			}
		}

		// LICENSE-TODO: Implement once flows check registered
		// const flows = await entitlementManager.check('flows');

		// if (flows.allowed === false) {
		const flowsService = new FlowsService({ schema });

		const flowCandidates = await flowsService.readByQuery({ fields: ['id'], filter: { status: { _eq: 'active' } } });

		if (flowCandidates.length) {
			pendingResolution.push({
				key: 'flows',
				kind: 'limit',
				// LICENSE-TODO: Replace with actual values once implemented
				limit: 5,
				usage: 2,
				candidates: flowCandidates as unknown as string[],
			});
		}
		// }

		const sso = await entitlementManager.check('sso_enabled');

		if (sso.entitled === false && sso.valid === false) {
			const usersService = new UsersService({ schema });
			const adminUser = await usersService.readOne(options.adminId, { fields: ['email', 'password'] });

			// Build blocklist for any additional requirements
			const blockers: ('ADMIN_MISSING_EMAIL' | 'ADMIN_MISSING_PASSWORD')[] = [];

			if (adminUser['email'] === null) {
				blockers.push('ADMIN_MISSING_EMAIL');
			}

			if (adminUser['password'] === null) {
				blockers.push('ADMIN_MISSING_EMAIL');
			}

			pendingResolution.push({
				key: 'sso_enabled',
				kind: 'feature_gate',
				blockers,
			});
		}

		const customLLMs = await entitlementManager.check('custom_llms_enabled');

		if (customLLMs.entitled === false && customLLMs.valid === false) {
			pendingResolution.push({
				key: 'custom_llms_enabled',
				kind: 'feature_gate',
			});
		}

		const customPermissionRules = await entitlementManager.check('custom_permission_rules_enabled');

		if (customPermissionRules.entitled === false && customPermissionRules.valid === false) {
			pendingResolution.push({
				key: 'custom_permission_rules_enabled',
				kind: 'feature_gate',
			});
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

		if (resolution.collections?.length) {
			// const collectionsService = new CollectionsService({ schema });

			try {
				// LICENSE-TODO: Enable once status field added to collection
				// await Promise.allSettled(
				// 	resolution.collections.map((collection) => collectionsService.updateOne(collection, { status: 'disabled' })),
				// );
			} catch {
				// ignore errors
			}
		}

		if (resolution.seats?.length) {
			const usersService = new UsersService({ schema });

			try {
				await Promise.allSettled(
					resolution.seats.map((user) => usersService.updateOne(user, { status: 'deactivated-license-exceeded' })),
				);
			} catch {
				// ignore errors
			}
		}

		if (resolution.flows?.length) {
			const flowsService = new FlowsService({ schema });

			try {
				await Promise.allSettled(resolution.flows.map((user) => flowsService.updateOne(user, { status: 'inactive' })));
			} catch {
				// ignore errors
			}
		}

		/**
		 * Set all sso users to disabled and optional set the current admin email and password
		 */
		if (resolution.sso_enabled) {
			const usersService = new UsersService({ schema });

			try {
				await usersService.updateByQuery(
					{
						filter: {
							_and: [{ provider: { _neq: DEFAULT_AUTH_PROVIDER, _nnull: true } }, { id: { _neq: adminId } }],
						},
					},
					{ status: 'deactivated-license-exceede' },
				);

				if (typeof resolution.sso_enabled === 'object' && Object.keys(resolution.sso_enabled.admin).length) {
					const payload: { email?: string | undefined; password?: string; provider: string } = {
						provider: DEFAULT_AUTH_PROVIDER,
					};

					if (resolution.sso_enabled.admin.email?.length) {
						payload['email'] = resolution.sso_enabled.admin.email;
					}

					if (resolution.sso_enabled.admin.password?.length) {
						payload['password'] = resolution.sso_enabled.admin.password;
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
