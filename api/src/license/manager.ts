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
	isLicenseInactive,
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
import { isActivationMissing, toReason, translateLicenseError } from './utils/errors.js';
import { getLicenseKey } from './utils/get-license-key.js';
import { getLicenseToken } from './utils/get-license-token.js';
import { type RPC, useRPC } from './utils/use-rpc.js';

const env = useEnv();
const logger = useLogger();
const LICENSE_CHANNEL = `license`;
/** Seconds between retries while a key is set but no license is in effect */
const RETRY_INTERVAL = 3600;
/** Seconds between checks when the license has no validation interval, e.g. an offline token */
const DEFAULT_CHECK_INTERVAL = 43_200;
let licenseCache: Directus.License = DIRECTUS_CORE_LICENSE;

type LicenseStore = {
	invalidReason: InvalidLicenseStatus | undefined;
};

type SyncLicenseOptions = {
	kind?: 'downgrade' | 'clear-token' | undefined;
	/** `null` clears the recorded reason, `undefined` leaves it as is */
	invalidReason?: InvalidLicenseStatus | null | undefined;
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
	/** Ignores remote syncs while initializing */
	private initializing = false;
	private rpc: RPC<LicenseManager, 'syncState'> | null = null;
	private store = useStore<LicenseStore>(env.LICENSE_NAMESPACE);
	/** Scheduled license check */
	private check: { job: ScheduledJob | null; cron: string | null } | null = null;

	/** Load license state from env and the database */
	public async initialize(): Promise<void> {
		this.initializing = true;

		// Listen first so a leader broadcast isn't missed
		this.rpc ??= await useRPC<LicenseManager, 'syncState'>(this, LICENSE_CHANNEL);

		// Create the entitlement manager if needed
		getEntitlementManager();

		const { leader } = await runExclusive('license-reconcile', () => this.reconcile()).finally(() => {
			this.initializing = false;
		});

		// Followers sync themselves, the leader broadcast can land after `initialize` resolves
		if (!leader) {
			await this.syncState();
		}
	}

	/** Run the license action for the current key and token */
	public async reconcile(): Promise<void> {
		const envKey = env['LICENSE_KEY'];
		const envToken = env['LICENSE_TOKEN'];

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { license_key: dbKey, license_token: dbToken } = await settingsService.readSingleton({
			fields: ['license_key', 'license_token'],
		});

		await this.executeLicenseAction(computeLicenseAction({ envKey, envToken, dbKey, dbToken }));
	}

	/** Schedule the license check, stopping it when there is nothing to check */
	public async scheduleCheck(): Promise<void> {
		const settingsService = new SettingsService({ schema: await getSchema() });
		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const interval = this.getCheckInterval();

		// Seeded by project so instances share one job
		const cron = interval === null ? null : durationToCron(interval, String(project_id));

		// Every sync calls this, do not reset and unchanged cron
		// Stopping a job resets its shared clock, letting another instance potentially rerun a job that already ran.
		if (this.check && this.check.cron === cron) return;

		logger.debug(cron === null ? 'License check stopped' : `License check scheduled (${cron})`);

		const previous = this.check;

		this.check = { cron, job: cron === null ? null : this.startCheck(cron) };

		await previous?.job?.stop();
	}

	/** Start the check job */
	private startCheck(cron: string): ScheduledJob {
		return scheduleSynchronizedJob('license-check', cron, async () => {
			logger.debug('Running license check');

			try {
				// Don't run alongside a boot reconcile
				await runExclusive('license-reconcile', async () => {
					try {
						await this.reconcile();
					} catch (error) {
						// Don't pass the error to instances waiting on the lock
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
		// Nothing to check for "core"
		if (!this.licenseKey && !this.licenseToken) return null;

		// Key set but not in effect, retry hourly
		if (this.source === null && this.licenseKey) return RETRY_INTERVAL;

		const validationInterval = licenseCache.meta.validation_interval;

		return validationInterval > 0 ? validationInterval : DEFAULT_CHECK_INTERVAL;
	}

	/** Run a license action, bypassing management guards */
	private async executeLicenseAction(action: LicenseAction): Promise<void> {
		if (action.kind === 'fatal') {
			logger.fatal(action.message);
			throw new Error(action.message);
		}

		logger.debug(`License action: ${action.kind}`);

		if (action.kind === 'clear-token') {
			await this.syncLicense({ kind: 'clear-token', invalidReason: null });
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
					await this.syncLicense({ invalidReason: null });
					break;
			}
		} catch (error) {
			if (action.kind === 'sync') {
				throw error;
			}

			await this.syncLicense({ invalidReason: isLicenseServerError(error) ? toReason(error) : undefined });

			const message =
				this.source === null
					? 'License request failed, running on core tier'
					: 'License request failed, continuing with the current license';

			logger.warn(error, message);
		}
	}

	// Env licenses are never editable, whatever the flag
	public getEditable(): boolean {
		// Read env directly, a downgrade clears the source
		if (env['LICENSE_KEY'] || env['LICENSE_TOKEN']) return false;

		return env.LICENSE_KEY_MANAGEMENT_ENABLED;
	}

	public async getLicense() {
		return licenseCache;
	}

	public async getStatus() {
		return computeLicenseStatus(this.source === null ? null : await this.getLicense());
	}

	public async getInvalidReason(): Promise<InvalidLicenseStatus | null> {
		const invalidReason = await this.store(async (store) => store.get('invalidReason')).catch((error) => {
			logger.warn(error, 'Could not read the license invalid reason');
			return null;
		});

		return invalidReason ?? null;
	}

	public getSource() {
		return this.source;
	}

	/** Throw unless the license is editable */
	private assertCanManageLicense() {
		if (this.getEditable() === false) {
			throw new ForbiddenError({
				reason: `You cannot manage license for the current license.`,
			});
		}
	}

	/**
	 * Throw without a key to update or deactivate
	 */
	private assertLicenseExists() {
		if (this.licenseKey === null) {
			throw new ForbiddenError({
				reason: `There is no active license to manage.`,
			});
		}
	}

	/** Throw for core and offline licenses, which don't support addons */
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

	/** Preview a key's license without activating it */
	public async preview(key: string) {
		try {
			return await previewKey({
				license_key: key,
			});
		} catch (error) {
			throw translateLicenseError(error);
		}
	}

	/** Activate a key */
	public async activate(key: string) {
		this.assertCanManageLicense();

		try {
			if (!this.licenseKey) {
				await this.applyActivation(key);
				return;
			}

			// A stored key may not be in effect, update from it to carry any activation over
			await this.applyUpdate(this.licenseKey, key);
		} catch (error) {
			throw translateLicenseError(error);
		}
	}

	/** Activate without guards */
	private async applyActivation(key: string) {
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const { token, new_project_id } = await activateKey({
			license_key: key,
			project_id: project_id!,
			public_url: env.PUBLIC_URL,
		});

		await settingsService.upsertSingleton({
			license_key: key,
			license_token: token,
			project_id: new_project_id ?? project_id!,
		});

		if (new_project_id) {
			logger.info(`License activated, project ID changed to "${new_project_id}"`);
		}

		await this.syncLicense({ invalidReason: null });
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
				public_url: env.PUBLIC_URL,
			});
		} catch (error) {
			// A missing or bound elsewhere key counts as deactivated, downgrade
			if (!isActivationMissing(error)) {
				throw translateLicenseError(error);
			}

			logger.warn(error, 'Deactivating the stored license key failed, removing it locally');
		}

		logger.info('License deactivated, running on core tier');

		await this.syncLicense({ kind: 'downgrade', invalidReason: null });
	}

	/** Replace the current key with a new one */
	public async update(newKey: string) {
		this.assertCanManageLicense();
		this.assertLicenseExists();

		try {
			await this.applyUpdate(this.licenseKey!, newKey);
		} catch (error) {
			throw translateLicenseError(error);
		}
	}

	/** Update without guards, activating the new key when the current one has no activation */
	private async applyUpdate(currentKey: string, newKey: string) {
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		let token: string;

		try {
			const result = await updateKey(
				{
					license_key: currentKey,
					project_id: project_id!,
					public_url: env.PUBLIC_URL,
				},
				{ license_key: newKey },
			);

			token = result.token;
		} catch (error) {
			// A missing or bound elsewhere key counts as deactivated, activate the new one
			if (!isActivationMissing(error)) {
				throw error;
			}

			logger.warn(error, 'Updating from the stored license key failed, activating the new key');

			return this.applyActivation(newKey);
		}

		await settingsService.upsertSingleton({
			license_key: newKey,
			license_token: token,
			project_id: project_id!,
		});

		await this.syncLicense({ invalidReason: null });
	}

	private async verify(token: string): Promise<Directus.License | null> {
		try {
			const license = await verifyLicense(token);

			if (license.audience !== 'directus') {
				logger.warn(`License token is for "${license.audience}", not directus`);
				return null;
			}

			return license;
		} catch (error) {
			logger.debug(error, 'License token could not be verified');
			return null;
		}
	}

	/**
	 * Verify the token and renew it with the license server.
	 * Only a terminated license (canceled, suspended) clears the token.
	 */
	public async refresh(options?: { key?: string | null; token?: string | null }): Promise<void> {
		const key = options?.key ?? this.licenseKey;
		const token = options?.token ?? this.licenseToken;

		let license: Directus.License | null = null;
		let syncLicenseState: SyncLicenseOptions = { invalidReason: null };

		if (token) {
			license = await this.verify(token);

			if (!license) {
				syncLicenseState.invalidReason = 'verification';
			}
		}

		// Only offline tokens lack a key, so a key lets a bad token self heal.
		// Env key and token can't both be set, so falling through to the key is safe.
		if (license?.meta.offline === false || key) {
			if (!key) {
				throw new InvalidPayloadError({ reason: 'A "key" is required' });
			}

			const entitlementManager = getEntitlementManager();
			const settingsService = new SettingsService({ schema: await getSchema() });

			const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

			const usage_metrics = {
				seats: await entitlementManager.getUsage('seats'),
				collections: await entitlementManager.getUsage('collections'),
				flows: await entitlementManager.getUsage('flows'),
			};

			let renewedToken: string | null = null;

			try {
				const result = await refreshLicense(
					{
						license_key: key,
						project_id: project_id!,
						public_url: env.PUBLIC_URL,
					},
					{ usage_metrics },
				);

				renewedToken = result.token;
			} catch (error) {
				logger.warn(error, 'License refresh failed');

				// Anything but a license server error counts as unavailable
				const reason = toReason(error);

				syncLicenseState = { kind: isLicenseInactive(reason) ? 'clear-token' : undefined, invalidReason: reason };
			}

			if (renewedToken) {
				await settingsService.upsertSingleton({ license_token: renewedToken });

				logger.debug('License refreshed');

				syncLicenseState = { invalidReason: null };
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
				public_url: env.PUBLIC_URL,
			});

			return url;
		} catch (error) {
			throw translateLicenseError(error);
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
				public_url: env.PUBLIC_URL,
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
			throw translateLicenseError(error);
		}
	}

	public async setAddonQuantity(options: { addonId: string; quantity: number }) {
		this.assertCanManageAddons();

		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const entitlementManager = getEntitlementManager();

		let refreshedToken: string;

		try {
			const result = await updateAddonQuantity(
				{
					license_key: this.licenseKey!,
					project_id: project_id!,
					public_url: env.PUBLIC_URL,
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

			refreshedToken = result.token;
		} catch (error) {
			throw translateLicenseError(error);
		}

		await settingsService.upsertSingleton({
			license_token: refreshedToken,
		});

		await this.syncLicense({ invalidReason: null });
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
					public_url: env.PUBLIC_URL,
				},
				{ addon_ids: [addonId] },
			);
		} catch (error) {
			throw translateLicenseError(error);
		}
	}

	/** Entitlements that need resolving, empty when none */
	public async pendingResolution(options: {
		adminId: string;
		licenseKey?: string | null;
	}): Promise<LicensePendingResolutionOutput> {
		const schema = await getSchema();
		const pendingResolution: LicensePendingResolution[] = [];

		let entitlements: Directus.Entitlements | null;

		/**
		 * Resolve against
		 *  - a key: that key's license, when changing tier
		 *  - `null`: the core license
		 *  - omitted: the current license
		 */
		if (options.licenseKey) {
			const preview = await this.preview(options.licenseKey);
			entitlements = preview.entitlements;
		} else if (options.licenseKey === null) {
			entitlements = null;
		} else {
			const license = await this.getLicense();
			entitlements = license.entitlements;
		}

		// Separate manager so the live entitlements are untouched
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

	/** Apply a resolution, which may be partial */
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

		// Disable SSO users, optionally setting the current admin's email and password
		if (resolution.sso_enabled) {
			await entitlementManager.resolve('sso_enabled', resolution.sso_enabled, { accountability: ctx?.accountability });
			if (!cachesToClear.includes('seats')) cachesToClear.push('seats');
			cachesToClear.push('sso_enabled');
		}

		if (cachesToClear.length > 0) {
			await entitlementManager.clearCache(...cachesToClear);
		}

		if (await entitlementManager.checkAll()) {
			// No broadcast needed, the reason lives in the shared store
			await this.setInvalidReason(null);
		}
	}

	/** Apply a license change and propagate it to all instances */
	private async syncLicense(options?: SyncLicenseOptions) {
		if (options?.invalidReason !== undefined) {
			await this.setInvalidReason(options.invalidReason);
		}

		if (options?.kind === 'downgrade') {
			const settingsService = new SettingsService({ schema: await getSchema() });
			await settingsService.upsertSingleton({ license_key: null, license_token: null });
		} else if (options?.kind === 'clear-token') {
			const settingsService = new SettingsService({ schema: await getSchema() });
			await settingsService.upsertSingleton({ license_token: null });
			logger.warn('Removed the stored license token, running on core tier');
		}

		await clearPermissionCache();
		await this.syncState({ local: true });

		await this.rpc?.syncState().catch((error) => {
			logger.warn(error, 'Could not broadcast the license change');
		});
	}

	/** Record or clear the invalid reason */
	private async setInvalidReason(reason: InvalidLicenseStatus | null) {
		try {
			await this.store(async (store) => {
				if (reason) {
					await store.set('invalidReason', reason);
				} else {
					await store.delete('invalidReason');
				}
			});
		} catch (error) {
			logger.warn(
				error,
				reason
					? `Could not record the license invalid reason "${reason}"`
					: 'Could not clear the license invalid reason',
			);
		}
	}

	/**
	 * Re-resolve state from env and the database.
	 * Each instance derives its own, so the RPC only signals a change.
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
				// refresh records the reason
				logger.warn('The stored license token could not be verified, downgrading to core tier');
			}
		}

		// An env key outranks a persisted token, null without a license
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
