import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import {
	activateKey,
	billingPortal,
	COUNTABLE_ENTITLEMENT_KEYS,
	type CountableEntitlementKey,
	deactivateKey,
	deleteAddon,
	type Directus,
	DIRECTUS_CORE_LICENSE,
	type FeatureFlagEntitlementKey,
	type InvalidLicenseStatus,
	isLicenseServerError,
	type LicenseAddonsOutput,
	type LicensePendingResolution,
	type LicensePendingResolutionOutput,
	type LicenseSource,
	previewKey,
	readAddons,
	refreshLicense,
	ResolveInput,
	updateAddonQuantity,
	updateKey,
	verifyLicense,
} from '@directus/license';
import type { Accountability } from '@directus/types';
import { toBoolean } from '@directus/utils';
import { useLogger } from '../logger/index.js';
import { clearCache as clearPermissionCache } from '../permissions/cache.js';
import { UsersService } from '../services/index.js';
import { SettingsService } from '../services/settings.js';
import { getSchema } from '../utils/get-schema.js';
import { runExclusive } from '../utils/run-exclusive.js';
import { type ScheduledJob, scheduleSynchronizedJob } from '../utils/schedule.js';
import { useStore } from '../utils/store.js';
import { getActiveCollections } from './entitlements/lib/collections.js';
import { getActiveFlows } from './entitlements/lib/flows.js';
import { getActiveSeats } from './entitlements/lib/seats.js';
import { EntitlementManager, getEntitlementManager } from './entitlements/manager.js';
import { computeLicenseAction, type LicenseAction } from './utils/compute-license-action.js';
import { computeLicenseStatus } from './utils/compute-license-status.js';
import { durationToCron } from './utils/duration-to-cron.js';
import { handleLicenseError, isLicenseInactive, toReason } from './utils/errors.js';
import { getLicenseKey } from './utils/get-license-key.js';
import { getLicenseToken } from './utils/get-license-token.js';
import { type ExtractMethods, useRPC } from './utils/use-rpc.js';

const env = useEnv();
const logger = useLogger();
const LICENSE_CHANNEL = `license`;
let licenseCache: Directus.License = DIRECTUS_CORE_LICENSE;

type LicenseStore = {
	invalidReason: InvalidLicenseStatus | undefined;
};

type SyncLicenseOptions =
	| {
			kind?: 'downgrade' | 'clear-token';
			invalidReason?: InvalidLicenseStatus;
	  }
	| { kind?: 'clear-status'; invalidReason?: undefined };

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
	/** Ignores remote syncs while initializing */
	private initializing = false;
	private rpc: ExtractMethods<Pick<LicenseManager, 'syncState'>> | null = null;
	private store = useStore<LicenseStore>(String(env['LICENSE_NAMESPACE']));
	/** Scheduled license check */
	private check: { job: ScheduledJob | null; cron: string | null } | null = null;

	/**
	 * Establish license state from the environment and the database.
	 */
	public async initialize(): Promise<void> {
		this.initializing = true;

		// Listen before the boot run, so a broadcast from leader will not be missed
		this.rpc ??= await useRPC<Pick<LicenseManager, 'syncState'>>(this, LICENSE_CHANNEL);

		// initialize the manager if not done yet
		getEntitlementManager();

		const { leader } = await runExclusive('license-reconcile', () => this.reconcile()).finally(() => {
			this.initializing = false;
		});

		// Sync manually for followers.
		// Depending on leader broadcast it could resolve `initialize` before the sync completes
		if (!leader) {
			await this.syncState();
		}
	}

	/** Run the license action for the current key and token */
	public async reconcile(): Promise<void> {
		const envKey = env['LICENSE_KEY'] as string | undefined;
		const envToken = env['LICENSE_TOKEN'] as string | undefined;

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { license_key: dbKey, license_token: dbToken } = await settingsService.readSingleton({
			fields: ['license_key', 'license_token'],
		});

		await this.executeLicenseAction(computeLicenseAction({ envKey, envToken, dbKey, dbToken }));
	}

	/** Schedule license check */
	public async scheduleCheck(): Promise<void> {
		const settingsService = new SettingsService({ schema: await getSchema() });
		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const interval = this.getCheckInterval();

		// Seeded by project so instances share one job
		const cron = interval === null ? null : durationToCron(interval, String(project_id));

		// Prevent concurrency
		if (this.check && this.check.cron === cron) return;

		const previous = this.check;

		this.check = { cron, job: cron === null ? null : this.startCheck(cron) };

		await previous?.job?.stop();
	}

	/** Start the check job */
	private startCheck(cron: string): ScheduledJob {
		return scheduleSynchronizedJob('license-check', cron, async () => {
			try {
				// Don't race a startup
				await runExclusive('license-reconcile', async () => {
					try {
						await this.reconcile();
					} catch (error) {
						// Keep errors from followers
						logger.error(error, 'License check failed');
					}
				});
			} catch (error) {
				logger.error(error, 'License check could not run');
			}
		});
	}

	/** The check interval in seconds */
	private getCheckInterval(): number | null {
		// Nothing to check
		if (!this.licenseKey && !this.licenseToken) return null;

		// Key not in effect, retry
		if (this.source === null && this.licenseKey) return 3600;

		const validationInterval = licenseCache.meta.validation_interval;

		return validationInterval > 0 ? validationInterval : 43_200;
	}

	/** Run a license action, bypassing management guards */
	private async executeLicenseAction(action: LicenseAction): Promise<void> {
		if (action.kind === 'fatal') {
			logger.fatal(action.message);
			throw new Error(action.message);
		}

		if (action.kind === 'clear-token') {
			await this.syncLicense({ kind: 'clear-token' });
			return;
		}

		try {
			switch (action.kind) {
				case 'activate':
					await this.applyActivation(action.key);
					break;

				case 'update':
					await this.applyUpdate(action.currentKey, action.key);
					break;

				case 'refresh':
					await this.refresh({ key: action.key, token: action.token });
					break;

				case 'sync':
					await this.syncLicense();
					break;
			}
		} catch (error) {
			if (action.kind === 'sync') {
				throw error;
			}

			logger.error(error, 'License could not be verified or is invalid');

			const syncLicenseState: SyncLicenseOptions = {};

			if (isLicenseServerError(error)) {
				syncLicenseState.invalidReason = toReason(error);
			}

			// Do not clear token, operate under existing if possible
			await this.syncLicense(syncLicenseState);
		}
	}

	// Env-sourced licenses can never be managed via the API, independent of the flag.
	public getEditable(): boolean {
		// Check env directly to ensure downgrade does not allow editable
		if (env['LICENSE_KEY'] || env['LICENSE_TOKEN']) return false;

		return toBoolean(env['LICENSE_KEY_MANAGEMENT_ENABLED']);
	}

	public async getLicense() {
		return licenseCache;
	}

	public async getStatus() {
		return computeLicenseStatus(this.source === null ? null : await this.getLicense());
	}

	public async getInvalidReason(): Promise<InvalidLicenseStatus | null> {
		const invalidStatus = await this.store(async (store) => store.get('invalidReason')).catch((error) => {
			logger.warn(error, 'Could not read the license invalid reason');
			return null;
		});

		return invalidStatus ?? null;
	}

	public getSource() {
		return this.source;
	}

	/**
	 * Throw if the current license cannot have its key changed (activate / update / deactivate).
	 *
	 * License management is only allowed when the license is editable, i.e. it is not env-sourced
	 * and env's LICENSE_KEY_MANAGEMENT_ENABLED !== false.
	 */
	private assertCanManageLicense() {
		if (this.getEditable() === false) {
			throw new ForbiddenError({
				reason: `You cannot manage license for the current license.`,
			});
		}
	}

	/**
	 * Throw if there is no active license to update or deactivate.
	 *
	 * Activation is the only management operation valid without an existing license;
	 * update/deactivate require one. Checks manager state (not a passed-in key) so an
	 * explicit key argument cannot bypass the guard.
	 */
	private assertLicenseExists() {
		if (this.licenseKey === null) {
			throw new ForbiddenError({
				reason: `There is no active license to manage.`,
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
		} catch (error) {
			if (isLicenseServerError(error)) {
				handleLicenseError(error);
			}

			throw error;
		}
	}

	/**
	 * Activates a new license
	 */
	public async activate(key: string) {
		this.assertCanManageLicense();

		try {
			if (!this.licenseKey) {
				await this.applyActivation(key);
				return;
			}

			// Carry the current activation over
			try {
				await this.applyUpdate(this.licenseKey, key);
			} catch (error) {
				// Do not error for missing (INVALID_CREDENTIALS) or invalid (BINDING_MISMATCH) key,
				// consider them already deactivated and activate provided key
				if (!isLicenseServerError(error, 'INVALID_CREDENTIALS') && !isLicenseServerError(error, 'BINDING_MISMATCH')) {
					throw error;
				}

				await this.applyActivation(key);
			}
		} catch (error) {
			if (isLicenseServerError(error)) {
				handleLicenseError(error);
			}

			throw error;
		}
	}

	/** Activate without guards */
	private async applyActivation(key: string) {
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

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

		await this.syncLicense();
	}

	public async deactivate() {
		this.assertCanManageLicense();
		this.assertLicenseExists();

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		try {
			await deactivateKey({
				license_key: this.licenseKey!,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			});
		} catch (error) {
			if (!isLicenseServerError(error)) {
				throw error;
			}

			// Do not error for missing (INVALID_CREDENTIALS) or invalid (BINDING_MISMATCH) key,
			// consider them already deactivated and downgrade
			if (!isLicenseServerError(error, 'INVALID_CREDENTIALS') && !isLicenseServerError(error, 'BINDING_MISMATCH')) {
				handleLicenseError(error);
			}

			logger.warn(error, 'Deactivating the stored license key failed, removing it locally');
		}

		await this.syncLicense({ kind: 'downgrade' });
	}

	/**
	 * Update from an existing key to a new key
	 */
	public async update(newKey: string) {
		this.assertCanManageLicense();
		this.assertLicenseExists();

		try {
			await this.applyUpdate(this.licenseKey!, newKey);
		} catch (error) {
			if (isLicenseServerError(error)) {
				handleLicenseError(error);
			}

			throw error;
		}
	}

	/** Update without guards */
	private async applyUpdate(currentKey: string, newKey: string) {
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

		await this.syncLicense();
	}

	private async verify(token: string): Promise<Directus.License | null> {
		try {
			const license = await verifyLicense(token);

			if (license.audience !== 'directus') return null;

			return license;
		} catch {
			return null;
		}
	}

	/**
	 * Verify the license token and renew it with the license server
	 * Only a terminated license (canceled, suspended) clears the token.
	 */
	public async refresh(options?: { key?: string | null; token?: string | null }): Promise<void> {
		const key = options?.key ?? this.licenseKey;
		const token = options?.token ?? this.licenseToken;

		let license: Directus.License | null = null;
		let syncLicenseState: SyncLicenseOptions = {};

		if (token) {
			license = await this.verify(token);

			if (!license) {
				syncLicenseState.invalidReason = 'verification';
			}
		}

		/**
		 * Only an offline token comes without a key, so a key being present allows potential self heal
		 * Safe to allow key fall-through as it is not possible to set both env key and token.
		 */
		if (license?.meta.offline === false || key) {
			if (!key) {
				throw new InvalidPayloadError({ reason: 'A "key" is required' });
			}

			try {
				const entitlementManager = getEntitlementManager();
				const settingsService = new SettingsService({ schema: await getSchema() });

				const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

				const { token: renewed } = await refreshLicense(
					{
						license_key: key,
						project_id: project_id!,
						public_url: env['PUBLIC_URL'] as string,
					},
					{
						usage_metrics: {
							seats: await entitlementManager.getUsage('seats'),
							collections: await entitlementManager.getUsage('collections'),
							flows: await entitlementManager.getUsage('flows'),
						},
					},
				);

				await settingsService.upsertSingleton({
					license_token: renewed,
				});

				syncLicenseState = {};
			} catch (error) {
				logger.error(error);

				if (isLicenseServerError(error)) {
					const reason = toReason(error);

					if (isLicenseInactive(reason)) {
						syncLicenseState.kind = 'clear-token';
					}

					syncLicenseState.invalidReason = reason;
				}
			}
		}

		await this.syncLicense(syncLicenseState);
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
		} catch (error) {
			if (isLicenseServerError(error)) {
				handleLicenseError(error);
			}

			throw error;
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
		} catch (error) {
			if (isLicenseServerError(error)) {
				handleLicenseError(error);
			}

			throw error;
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
		} catch (error) {
			if (isLicenseServerError(error)) {
				handleLicenseError(error);
			}

			throw error;
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
		} catch (error) {
			if (isLicenseServerError(error)) {
				handleLicenseError(error);
			}

			throw error;
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

		let entitlements: Directus.Entitlements | null;

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
			// Deliberately does not propagate, every node already has license state synced
			await this.syncLicense({ kind: 'clear-status' });
		}
	}

	/**
	 * Apply a state transition and propagate to all instances.
	 */
	private async syncLicense(options?: SyncLicenseOptions) {
		await this.store(async (store) => {
			if (options?.invalidReason) {
				await store.set('invalidReason', options.invalidReason);
			} else {
				await store.delete('invalidReason');
			}
		}).catch((error) => {
			logger.warn(
				error,
				options?.invalidReason
					? `Could not record the license invalid reason "${options.invalidReason}"`
					: 'Could not clear the license invalid reason',
			);
		});

		if (options?.kind === 'clear-status') return;

		if (options?.kind === 'downgrade') {
			const settingsService = new SettingsService({ schema: await getSchema() });
			await settingsService.upsertSingleton({ license_key: null, license_token: null });
		} else if (options?.kind === 'clear-token') {
			const settingsService = new SettingsService({ schema: await getSchema() });
			await settingsService.upsertSingleton({ license_token: null });
		}

		// clear permission cache when the license entitlements change
		await clearPermissionCache();
		await this.syncState({ local: true });

		await this.rpc?.syncState().catch((error) => {
			logger.warn(error, 'Could not broadcast the license change');
		});
	}

	/**
	 * Re-resolve state from the environment and the database.
	 *
	 * Every instance derives its own, so the RPC only has to signal that something changed rather
	 * than carry one instance's view of it.
	 *
	 * @param options.local Whether the change was made on this instance
	 */
	public async syncState(options?: { local?: boolean }) {
		// Followers sync once initialized
		if (this.initializing && !options?.local) return;

		const { source: keySource, key } = await getLicenseKey();
		const { source: tokenSource, token } = await getLicenseToken();

		this.licenseKey = key;
		this.licenseToken = token;

		let license: Directus.License | null = null;

		if (token) {
			license = await this.verify(token);

			if (license === null) {
				// The reason should be recorded from refresh
				logger.warn('The stored license token could not be verified, downgrading to core tier');
			}
		}

		// An env key outranks a persisted token, always null if no license irrespective of source
		this.source = license ? (keySource ?? tokenSource) : null;

		licenseCache = license ?? DIRECTUS_CORE_LICENSE;
		getEntitlementManager().setEntitlements(licenseCache.entitlements);

		// Reschedule for the new state
		if (this.check) {
			try {
				await this.scheduleCheck();
			} catch (error) {
				logger.warn(error, 'Could not reschedule the license check');
			}
		}
	}
}
