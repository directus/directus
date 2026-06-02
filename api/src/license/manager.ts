import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import {
	activateKey,
	billingPortal,
	CORE_LICENSE,
	COUNTABLE_ENTITLEMENT_KEYS,
	type CountableEntitlementKey,
	deactivateKey,
	deleteAddon,
	Entitlements,
	type FeatureFlagEntitlementKey,
	type InvalidLicenseStatus,
	License,
	type LicenseAddonsOutput,
	type LicensePendingResolution,
	type LicensePendingResolutionOutput,
	LicenseServerError,
	type LicenseSource,
	previewKey,
	readAddons,
	refreshLicense,
	type RefreshLicenseInput,
	ResolveInput,
	updateAddonQuantity,
	updateKey,
	verifyLicense,
} from '@directus/license';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import { useLogger } from '../logger/index.js';
import { clearCache as clearPermissionCache } from '../permissions/cache.js';
import licenseCheckSchedule, { stopLicenseCheck } from '../schedules/license.js';
import { UsersService } from '../services/index.js';
import { SettingsService } from '../services/settings.js';
import { getSchema } from '../utils/get-schema.js';
import { useStore } from '../utils/store.js';
import { getActiveCollections } from './entitlements/lib/collections.js';
import { getActiveFlows } from './entitlements/lib/flows.js';
import { getActiveSeats } from './entitlements/lib/seats.js';
import { EntitlementManager, getEntitlementManager } from './entitlements/manager.js';
import { computeLicenseStatus } from './utils/compute-license-status.js';
import { getLicenseKey } from './utils/get-license-key.js';
import { getLicenseToken } from './utils/get-license-token.js';
import { handleLicenseError } from './utils/handle-license-error.js';
import { useRPC } from './utils/use-rpc.js';

const env = useEnv();
const logger = useLogger();
const LICENSE_CHANNEL = `license`;
let licenseCache: License | null;

type LicenseStore = {
	initialized: true | undefined;
	invalidStatus: InvalidLicenseStatus | undefined;
};

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
	private initialized = false;
	private rpc = useRPC<Pick<LicenseManager, 'syncState'>>(this, LICENSE_CHANNEL);
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

		// initialize the manager if not done yet
		getEntitlementManager();

		try {
			// Lock the whole store for the entirety of initialization
			await this.store(async (store) => {
				// Replace existing store temporarily to avoid deadlocks
				this.store = (cb) => {
					return cb(store);
				};

				const envKey = env['LICENSE_KEY'] as string | undefined;
				const envToken = env['LICENSE_TOKEN'] as string | undefined;

				// CASE A
				if (envKey && envToken) {
					logger.fatal('LICENSE_KEY and LICENSE_TOKEN cannot both be set. Provide one or the other.');
					process.exit(1);
				}

				const settingsService = new SettingsService({ schema: await getSchema() });

				const { license_key: dbKey, license_token: dbToken } = await settingsService.readSingleton({
					fields: ['license_key', 'license_token'],
				});

				if (envKey) {
					try {
						this.source = 'env';

						if (!dbKey) {
							// CASE D
							await this.activate(envKey);
						} else if (envKey !== dbKey) {
							// CASE B
							await this.update(envKey, { oldKey: dbKey });
						} else {
							// CASE C
							await this.refresh({ key: envKey, token: dbToken ?? null });
						}
					} catch (error) {
						logger.fatal('Unable to validate the LICENSE_KEY, please check the key and try again.');
						logger.fatal(error);
						process.exit(1);
					}
				} else if (envToken) {
					try {
						this.source = 'env';
						// CASE E — verify offline token, cleanup DB
						await this.refresh({ token: envToken });

						if (dbKey || dbToken) {
							await settingsService.upsertSingleton({ license_key: null, license_token: null });
						}
					} catch (error) {
						logger.fatal('Unable to validate the LICENSE_TOKEN, please check the token and try again.');
						logger.fatal(error);
						process.exit(1);
					}
				} else if (dbKey) {
					try {
						this.source = 'settings';

						if (dbToken) {
							// CASE F
							await this.refresh({ key: dbKey, token: dbToken });
						} else {
							// CASE G
							await this.activate(dbKey);
						}
					} catch (error) {
						logger.error('Unable to validate the license key from the database, downgrading to core tier.');
						logger.error(error);
						await this.syncLicense({ kind: 'downgrade' });
					}
				} else {
					if (dbToken) {
						// CASE H — stale token, clear and drop to core
						await this.syncLicense({ kind: 'downgrade' });
					} else {
						// CASE I — already core, just propagate
						await this.syncLicense();
					}
				}

				this.initialized = true;
			});
		} finally {
			this.store = existingStore;
		}
	}

	public async getLicense(options?: { database?: Knex }): Promise<License> {
		if (licenseCache) return licenseCache;

		const { token } = await getLicenseToken(options);

		if (!token) {
			this.source = null;
			licenseCache = CORE_LICENSE;
		} else {
			licenseCache = await this.verify(token);

			if (!licenseCache) {
				this.source = null;
				licenseCache = CORE_LICENSE;
			}
		}

		return licenseCache;
	}

	public async getStatus() {
		return computeLicenseStatus(this.source === null ? null : await this.getLicense());
	}

	public async getDowngradeReason(): Promise<InvalidLicenseStatus | null> {
		const invalidStatus = await this.store(async (store) => store.get('invalidStatus'));
		return invalidStatus ?? null;
	}

	public getSource() {
		return this.source;
	}

	/**
	 * Throw if the current license cannot have its key changed (activate / update / deactivate).
	 *
	 * License management is only allowed for setting-based licenses
	 */
	private assertCanManageLicense() {
		if (this.initialized && this.source !== 'settings') {
			throw new ForbiddenError({
				reason: `You cannot manage license for the current license.`,
			});
		}
	}

	/**
	 * Throw if the current license cannot have its entitlements changed (e.g. adding addons).
	 *
	 * Addons are supported for all licenses except core and offline.
	 */
	private assertCanManageAddons() {
		if (this.source === null || this.licenseKey === null) {
			throw new ForbiddenError({
				reason: `You cannot manage addons for the current license.`,
			});
		}
	}

	public async isLocked() {
		const status = await this.getStatus();

		return status === 'locked';
	}

	/**
	 *  Check a license meta/info without activating it
	 */
	public async preview(key: string) {
		try {
			return await previewKey({
				license_key: key,
			});
		} catch (err) {
			handleLicenseError(err);
		}
	}

	/**
	 * Activates a new license
	 */
	public async activate(key: string) {
		// bypass case for upgrading from core to another license
		if (this.source !== null) {
			this.assertCanManageLicense();
		}

		// Keys cannot be directly activated if one is already active, must go via update route
		if (this.licenseKey) {
			throw new ForbiddenError({ reason: 'A license was already activated' });
		}

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

			// During init, source is already set, only flip if via API
			if (this.initialized) {
				this.source = 'settings';
			}

			await this.syncLicense();

			// Register the license check on activate once persisted
			if (this.initialized) {
				await licenseCheckSchedule();
			}
		} catch (err) {
			if (err instanceof LicenseServerError) {
				handleLicenseError(err);
			}

			throw err;
		}
	}

	public async deactivate(key?: string) {
		this.assertCanManageLicense();

		const currentKey = key ?? this.licenseKey;

		if (!currentKey) {
			throw new InvalidPayloadError({ reason: '"key" has to be defined in order to deactivate' });
		}

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		try {
			await deactivateKey({
				license_key: currentKey,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			});

			await this.syncLicense({ kind: 'downgrade' });
		} catch (err) {
			if (err instanceof LicenseServerError) {
				handleLicenseError(err);
			}

			throw err;
		}
	}

	/**
	 * Update from an existing key to a new key
	 */
	public async update(newKey: string, options?: { oldKey: string }) {
		this.assertCanManageLicense();

		const currentKey = options?.oldKey ?? this.licenseKey;

		if (!currentKey) {
			throw new InvalidPayloadError({ reason: 'A current license must be provided in order to update' });
		}

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		try {
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

			await this.syncLicense();
		} catch (err) {
			if (err instanceof LicenseServerError) {
				handleLicenseError(err);
			}

			throw err;
		}
	}

	private async verify(token: string): Promise<License | null> {
		try {
			return await verifyLicense(token);
		} catch {
			return null;
		}
	}

	/**
	 * Verify a license token. On failure, downgrade and mark status 'expired'.
	 */
	public async refresh(options?: { key?: string; token?: string | null }): Promise<void> {
		const key = options?.key ?? this.licenseKey;
		const token = options?.token ?? this.licenseToken;

		let license: License | null = null;

		if (token) {
			license = await this.verify(token);

			if (!license) {
				await this.syncLicense({ kind: 'downgrade', reason: 'expired' });
				return;
			}
		}

		if (license?.meta.offline === false) {
			if (!key) {
				throw new InvalidPayloadError({ reason: 'A "key" is required' });
			}

			const entitlementManager = getEntitlementManager();
			const settingsService = new SettingsService({ schema: await getSchema() });

			const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

			const refreshPayload: RefreshLicenseInput = {
				usage_metrics: {
					seats: await entitlementManager.getUsage('seats'),
					collections: await entitlementManager.getUsage('collections'),
					flows: await entitlementManager.getUsage('flows'),
				},
			};

			try {
				const { token } = await refreshLicense(
					{
						license_key: key,
						project_id: project_id!,
						public_url: env['PUBLIC_URL'] as string,
					},
					refreshPayload,
				);

				await settingsService.upsertSingleton({
					license_token: token,
				});
			} catch (err) {
				logger.error(err);

				if (err instanceof LicenseServerError) {
					if (err.code === 'LICENSE_EXPIRED') {
						await this.syncLicense({ kind: 'downgrade', reason: 'expired' });
					} else if (err.code === 'LICENSE_CANCELED') {
						await this.syncLicense({ kind: 'downgrade', reason: 'canceled' });
					} else if (err.code === 'LICENSE_SUSPENDED') {
						await this.syncLicense({ kind: 'downgrade', reason: 'suspended' });
					}
				}
			}
		}

		await this.syncLicense();
	}

	public async billingPortalUrl() {
		this.assertCanManageAddons();

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		try {
			const { url } = await billingPortal({
				license_key: this.licenseKey!,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			});

			return url;
		} catch (err) {
			handleLicenseError(err);
		}
	}

	public async availableAddons(): Promise<LicenseAddonsOutput> {
		this.assertCanManageAddons();

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		try {
			const addons = await readAddons({
				license_key: this.licenseKey!,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			});

			return addons.available_addons.map((addon) => ({
				id: addon.id,
				name: addon.name,
				description: addon.description,
				icon: addon.icon,
				unit_price: addon.unit_price,
				billing_interval: addon.billing_interval,
				upgrade_required: addon.upgrade_required,
				pricing_summary: addon.pricing_summary,
				min_quantity: addon.min_quantity,
				max_quantity: addon.max_quantity,
				active_quantity: addon.active_quantity,
				scheduled_quantity: addon.scheduled_quantity,
			}));
		} catch (err) {
			handleLicenseError(err);
		}
	}

	public async setAddonQuantity(options: { addonId: string; quantity: number }) {
		this.assertCanManageAddons();

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const entitlementManager = getEntitlementManager();

		try {
			const { token } = await updateAddonQuantity(
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
						flows: await entitlementManager.getUsage('flows'),
					},
				},
			);

			await settingsService.upsertSingleton({
				license_token: token,
			});

			await this.syncLicense();
		} catch (err) {
			if (err instanceof LicenseServerError) {
				handleLicenseError(err);
			}

			throw err;
		}
	}

	public async removeAddon(addonId: string) {
		this.assertCanManageAddons();

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		try {
			await deleteAddon(
				{
					license_key: this.licenseKey!,
					project_id: project_id!,
					public_url: env['PUBLIC_URL'] as string,
				},
				{ addon_ids: [addonId] },
			);
		} catch (err) {
			handleLicenseError(err);
		}
	}

	/**
	 * Retrieve entitlements that are pending resolution
	 *
	 * If no entitlements to resolve, an empty array will be returned
	 */
	public async pendingResolution(options: {
		adminId: string;
		licenseKey?: string | null;
	}): Promise<LicensePendingResolutionOutput> {
		const schema = await getSchema();
		const pendingResolution: LicensePendingResolution[] = [];

		let entitlements: Entitlements | null;

		if (options.licenseKey) {
			// required resolution when changing tier
			const preview = await this.preview(options.licenseKey);
			entitlements = preview.entitlements;
		} else if (options.licenseKey === null) {
			entitlements = null;
		} else {
			// possible resolution during current tier
			const license = await this.getLicense();
			entitlements = license.entitlements;
		}

		// New manager to ensure no conflicts with main manager
		const entitlementManager = new EntitlementManager();
		entitlementManager.setEntitlements(entitlements);

		const candidateGetters: Record<CountableEntitlementKey, any> = {
			seats: getActiveSeats,
			collections: getActiveCollections,
			flows: getActiveFlows,
		};

		for (const check of COUNTABLE_ENTITLEMENT_KEYS) {
			const resolution = await entitlementManager.check(check);

			if (resolution.allowed === false) {
				const candidates = await candidateGetters[check]({ adminId: options.adminId });

				pendingResolution.push({
					key: check,
					kind: 'limit',
					limit: resolution.hardLimit,
					usage: resolution.usage,
					candidates,
				});
			}
		}

		const sso = await entitlementManager.check('sso_enabled');

		if (sso.valid === false) {
			const usersService = new UsersService({ schema });
			const adminUser = await usersService.readOne(options.adminId, { fields: ['email', 'password'] });

			// Build blocklist for any additional requirements
			const blockers: ('ADMIN_MISSING_EMAIL' | 'ADMIN_MISSING_PASSWORD')[] = [];

			if (adminUser['email'] === null) {
				blockers.push('ADMIN_MISSING_EMAIL');
			}

			if (adminUser['password'] === null) {
				blockers.push('ADMIN_MISSING_PASSWORD');
			}

			pendingResolution.push({
				key: 'sso_enabled',
				kind: 'feature_gate',
				blockers,
			});
		}

		const customLLMs = await entitlementManager.check('custom_llms_enabled');

		if (customLLMs.valid === false) {
			pendingResolution.push({
				key: 'custom_llms_enabled',
				kind: 'feature_gate',
			});
		}

		const customPermissionRules = await entitlementManager.check('custom_permission_rules_enabled');

		if (customPermissionRules.valid === false) {
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
	public async applyResolution(resolution: ResolveInput, ctx?: { accountability?: Accountability | undefined }) {
		const entitlementManager = getEntitlementManager();
		const cachesToClear: (CountableEntitlementKey | FeatureFlagEntitlementKey)[] = [];

		if (resolution.collections && resolution.collections.length > 0) {
			await entitlementManager.resolve('collections', resolution.collections, { accountability: ctx?.accountability });
			cachesToClear.push('collections');
		}

		if (resolution.seats && resolution.seats.length > 0) {
			await entitlementManager.resolve('seats', resolution.seats, { accountability: ctx?.accountability });
			cachesToClear.push('seats');
		}

		if (resolution.flows && resolution.flows.length > 0) {
			await entitlementManager.resolve('flows', resolution.flows, { accountability: ctx?.accountability });
			cachesToClear.push('flows');
		}

		/**
		 * Set all sso users to disabled and optional set the current admin email and password
		 */
		if (resolution.sso_enabled) {
			await entitlementManager.resolve('sso_enabled', resolution.sso_enabled, { accountability: ctx?.accountability });
			if (!cachesToClear.includes('seats')) cachesToClear.push('seats');
			cachesToClear.push('sso_enabled');
		}

		if (cachesToClear.length > 0) {
			await entitlementManager.clearCache(...cachesToClear);
		}

		if (await entitlementManager.checkAll()) {
			await this.syncLicense({ kind: 'clear-status' });
		}
	}

	/**
	 * Apply a state transition and propagate to all instances.
	 *
	 *  - { kind: 'downgrade', reason? }: clear key + token, drop to core, propagate.
	 *  - { kind: 'clear-token' }: clear only the token; key survives for re-activation. Marker preserved (server's verdict still applies). Propagates.
	 *  - { kind: 'clear-status' }: clear the invalidStatus marker only. Redis-only, does NOT propagate.
	 */
	private async syncLicense(
		options?: { kind: 'downgrade'; reason?: InvalidLicenseStatus } | { kind: 'clear-token' } | { kind: 'clear-status' },
	) {
		if (options?.kind !== 'downgrade' || (options?.kind === 'downgrade' && options.reason === undefined)) {
			await this.store(async (store) => store.delete('invalidStatus'));

			if (options?.kind === 'clear-status') {
				return;
			}
		}

		if (options?.kind === 'downgrade') {
			const settingsService = new SettingsService({ schema: await getSchema() });
			await settingsService.upsertSingleton({ license_key: null, license_token: null });
			this.source = null;

			// Stop the periodic check
			await stopLicenseCheck();

			if (options.reason) {
				await this.store(async (store) => store.set('invalidStatus', options.reason));
			}
		} else if (options?.kind === 'clear-token') {
			const settingsService = new SettingsService({ schema: await getSchema() });
			await settingsService.upsertSingleton({ license_token: null });
		}

		// clear permission cache when the license entitlements change
		await clearPermissionCache();
		await this.syncState({ source: this.source });
		await this.rpc.syncState({ source: this.source });
	}

	public async syncState(options?: { source?: LicenseSource }) {
		const { key } = await getLicenseKey();
		const { token } = await getLicenseToken();

		// set local vars
		this.licenseKey = key;
		this.licenseToken = token;

		this.initialized = true;

		if (options && 'source' in options) {
			this.source = options.source;
		}

		// reset cache
		licenseCache = null;

		// "reset" entitlements
		const license = await this.getLicense();
		getEntitlementManager().setEntitlements(license.entitlements);
	}
}
