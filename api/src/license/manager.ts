import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import {
	activateKey,
	billingPortal,
	CORE_LICENSE,
	COUNTABLE_ENTITLEMENT_KEYS,
	type CountableEntitlementKey,
	deactivateKey,
	deleteAddon,
	Entitlements,
	License,
	type LicenseAddonsOutput,
	type LicensePendingResolution,
	type LicensePendingResolutionOutput,
	type LicenseSource,
	type LicenseStatus,
	previewKey,
	readAddons,
	refreshLicense,
	type RefreshLicenseInput,
	ResolveInput,
	updateAddonQuantity,
	updateKey,
	verifyLicense,
} from '@directus/license';
import type { Knex } from 'knex';
import { useLogger } from '../logger/index.js';
import licenseCheckSchedule from '../schedules/license.js';
import { UsersService } from '../services/index.js';
import { SettingsService } from '../services/settings.js';
import { getSchema } from '../utils/get-schema.js';
import { useStore } from '../utils/store.js';
import { getActiveCollections } from './entitlements/lib/collections.js';
import { getActiveFlows } from './entitlements/lib/flows.js';
import { getActiveSeats } from './entitlements/lib/seats.js';
import { EntitlementManager, getEntitlementManager } from './entitlements/manager.js';
import { getLicenseKey } from './utils/get-license-key.js';
import { getLicenseToken } from './utils/get-license-token.js';
import { getStatus } from './utils/get-status.js';
import { useRPC } from './utils/use-rpc.js';

const env = useEnv();
const logger = useLogger();
const LICENSE_CHANNEL = `license`;
let licenseCache: License | null;

type LicenseStore = {
	initialized: true | undefined;
	status: LicenseStatus | undefined;
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
					logger.error('LICENSE_KEY and LICENSE_TOKEN cannot both be set. Provide one or the other.');
					process.exit(1);
				}

				const settingsService = new SettingsService({ schema: await getSchema() });

				const { license_key: dbKey, license_token: dbToken } = await settingsService.readSingleton({
					fields: ['license_key', 'license_token'],
				});

				if (envKey) {
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
				} else if (envToken) {
					this.source = 'env';
					// CASE E — verify offline token, cleanup DB
					await this.refresh({ token: envToken });

					if (dbKey || dbToken) {
						await settingsService.upsertSingleton({ license_key: null, license_token: null });
					}
				} else if (dbKey) {
					this.source = 'settings';

					if (dbToken) {
						// CASE F
						await this.refresh({ key: dbKey, token: dbToken });
					} else {
						// CASE G
						await this.activate(dbKey);
					}
				} else {
					// CASE H stale token / CASE I — core license
					await this.commitStateChange({ isCore: true, downgrade: !!dbToken });
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
			licenseCache = CORE_LICENSE;
		} else {
			licenseCache = (await this.verify(token)) ?? CORE_LICENSE;
		}

		return licenseCache;
	}

	public async getStatus() {
		const status = await this.store(async (store) => store.get('status'));

		return status ?? 'active';
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
		const entitlementManager = getEntitlementManager();
		const status = await this.getStatus();

		const isInViolation = await entitlementManager.checkAll();

		if (['expired', 'suspended'].includes(status) && isInViolation === false) {
			return true;
		}

		if (status === 'locked') return true;

		return false;
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

			await this.commitStateChange();
		} catch (err) {
			// LICENSE-TODO: Add error translation
			logger.error({ err, LICENSE_API_URL: process.env['LICENSE_API_URL'] }, '[license/activate] underlying error');
			throw new ServiceUnavailableError({ service: 'license', reason: 'activate' });
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

		await deactivateKey({
			license_key: currentKey,
			project_id: project_id!,
			public_url: env['PUBLIC_URL'] as string,
		});

		await this.commitStateChange({ isCore: true, downgrade: true });
	}

	/**
	 * Update from an existing key to a new key
	 */
	public async update(newKey: string, options?: { oldKey: string }) {
		this.assertCanManageLicense();

		const currentKey = options?.oldKey ?? this.licenseKey;

		if (!currentKey) {
			throw new InvalidPayloadError({ reason: '"oldKey" has to be defined in order to update' });
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

		await this.commitStateChange();
	}

	private async verify(token: string): Promise<License | null> {
		try {
			return await verifyLicense(token);
		} catch {
			// LICENSE-TODO: set status based on error
			await this.commitStateChange({ status: 'expired', isCore: true, downgrade: true });
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

				await this.commitStateChange();
			} catch (err) {
				logger.error(err);
			}
		}
	}

	public async billingPortalUrl() {
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const { url } = await billingPortal({
			license_key: this.licenseKey!,
			project_id: project_id!,
			public_url: env['PUBLIC_URL'] as string,
		});

		return url;
	}

	public async availableAddons(): Promise<LicenseAddonsOutput> {
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

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
	}

	public async setAddonQuantity(options: { addonId: string; quantity: number }) {
		this.assertCanManageAddons();

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const entitlementManager = getEntitlementManager();

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

		await this.commitStateChange();
	}

	public async removeAddon(addonId: string) {
		this.assertCanManageAddons();

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
	public async applyResolution(adminId: string, resolution: ResolveInput) {
		const entitlementManager = getEntitlementManager();

		if (resolution.collections && resolution.collections.length > 0) {
			await entitlementManager.resolve('collections', resolution.collections);
		}

		if (resolution.seats && resolution.seats.length > 0) {
			await entitlementManager.resolve('seats', resolution.seats, { adminId });
		}

		if (resolution.flows && resolution.flows.length > 0) {
			await entitlementManager.resolve('flows', resolution.flows);
		}

		/**
		 * Set all sso users to disabled and optional set the current admin email and password
		 */
		if (resolution.sso_enabled) {
			await entitlementManager.resolve('sso_enabled', resolution.sso_enabled, { adminId });
		}
	}

	/**
	 * Single entry point for every state-changing
	 */
	private async commitStateChange(options?: { status?: LicenseStatus; isCore?: boolean; downgrade?: boolean }) {
		if (options?.downgrade) {
			const settingsService = new SettingsService({ schema: await getSchema() });

			await settingsService.upsertSingleton(
				options.isCore ? { license_key: null, license_token: null } : { license_token: null },
			);
		}

		await this.syncState();
		const status = options?.status ?? (await getStatus(options));

		const entitlementManager = new EntitlementManager();

		if (['expired', 'suspended', 'cancelled'].includes(status)) {
			// Invalid state within core limits downgrade otherwise lock
			if (await entitlementManager.checkAll()) {
				this.commitStateChange({ isCore: true, downgrade: true });
			} else {
				this.commitStateChange({ status: 'locked' });
			}
		} else {
			await this.store(async (store) => store.set('status', status));
			await this.rpc.syncState();
		}
	}

	public async syncState() {
		const oldSource = this.source;
		const { source: keySource, key } = await getLicenseKey();
		const { token } = await getLicenseToken();

		// set local vars
		this.licenseKey = key;
		this.licenseToken = token;

		this.initialized = true;

		/**
		 * LICENSE-TODO: Rework
		 *
		 * Upgrade from core tier requires registering the scheduled check
		 * De-register on downgrade is handled in the schedule
		 */
		if (oldSource === null && keySource === 'settings') {
			licenseCheckSchedule();
		}

		// reset cache
		licenseCache = null;

		// "reset" entitlements
		const license = await this.getLicense();
		getEntitlementManager().setEntitlements(license.entitlements);
	}
}
