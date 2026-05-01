import { useEnv } from '@directus/env';
import { LicenseImmutableError } from '@directus/errors';
import {
	activateKey,
	billinPortal,
	checkKey,
	CORE_LICENSE,
	deactivateKey,
	deleteAddon,
	License,
	listAddons,
	refreshLicense,
	updateAddonQuantity,
	verifyLicense,
} from '@directus/license';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { CollectionsService } from '../services/collections.js';
import { AccessService, UsersService } from '../services/index.js';
import { SettingsService } from '../services/settings.js';
import { fetchAccessRoles } from '../utils/fetch-user-count/fetch-access-roles.js';
import { getSchema } from '../utils/get-schema.js';
import { useStore } from '../utils/store.js';
import { useRPC } from './rpc.js';
import { getStatus } from './status.js';
import type { LicenseSource, LicenseStatus, PendingResolution } from './types.js';

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

	const token = await getLicenseToken(options);

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
	private licenseKey: string | undefined;
	private licenseToken: string | undefined;
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

	/**
	 *  Check a license meta/info without activating it
	 */
	public async check(key: string) {
		return checkKey({
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
		});

		await this.downgrade();
	}

	/**
	 * Update from an existing key to a new key
	 */
	public async update(oldKey: string, newKey: string) {
		this.assertMutable({ action: 'update' });
		// TODO: pending update endpoint on license server
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
				const { token } = await refreshLicense({
					license_key: key,
					project_id: project_id!,
					public_url: env['PUBLIC_URL'] as string,
				});

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

		await updateAddonQuantity({
			license_key: this.licenseKey!,
			project_id: project_id!,
			addon_id: options.addonId,
			quantity: options.quantity,
		});
	}

	public async removeAddon(addonId: string) {
		this.assertMutable({ action: 'remove addon' });

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		await deleteAddon({
			license_key: this.licenseKey!,
			project_id: project_id!,
			addon_id: addonId,
		});
	}

	/**
	 * Retrieve entitlements that are pending resolution
	 *
	 * If no entitlements to resolve, an empty array will be returned
	 */
	public async pendingResolution(options: { adminId: string }) {
		const pendingResolution: PendingResolution[] = [];
		const schema = await getSchema();

		// collection candidates = all collections not marked as disabled or db only
		const collectionsService = new CollectionsService({ schema });
		const collections = await collectionsService.readByQuery();

		const collectionCandidates = [];

		for (const candidateCollection of collections) {
			// LICENSE-TODO: re-check field for determining disables/excluded
			if (candidateCollection.schema !== null || candidateCollection.status !== 'disabled') {
				collectionCandidates.push({
					id: candidateCollection.collection,
				});
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
				key: 'sso',
				kind: 'feature_gate',
				blockers: ['ADMIN_MISSING_EMAIL', 'ADMIN_MISSING_PASSWORD'],
			});
		}

		return pendingResolution;
	}

	/**
	 * Apply a resolution strategy
	 */
	public async applyResolution(resolution: unknown) {
		// TODO: implement and refactor resolution format
	}

	public async refreshCache() {
		licenseCache = undefined;
		this.licenseKey = await getLicenseKey();
		this.licenseToken = await getLicenseToken();
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

async function getLicenseKey(options?: { database?: Knex }) {
	if (env['LICENSE_KEY']) {
		return String(env['LICENSE_KEY']);
	}

	const schema = await getSchema(options);
	const settingsService = new SettingsService({ schema, ...options });

	const { license_key } = await settingsService.readSingleton({ fields: ['license_key'] });
	return license_key ?? undefined;
}

async function getLicenseToken(options?: { database?: Knex }) {
	if (env['LICENSE_TOKEN']) {
		return String(env['LICENSE_TOKEN']);
	}

	const schema = await getSchema(options);
	const settingsService = new SettingsService({ schema, ...options });

	const { license_token } = await settingsService.readSingleton({ fields: ['license_token'] });
	return license_token ?? undefined;
}
