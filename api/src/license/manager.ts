import { useEnv } from '@directus/env';
import {
	activate as activateKey,
	CORE_LICENSE,
	License,
	refresh as refreshLicense,
	verifyLicense,
} from '@directus/license';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { SettingsService } from '../services/settings.js';
import { getSchema } from '../utils/get-schema.js';
import { useStore } from '../utils/store.js';
import { getStatus } from './status.js';
import type { LicenseSource, LicenseStatus } from './types.js';

let licenseManager: LicenseManager | undefined;
const env = useEnv();
const logger = useLogger();
const RELOAD_CHANNEL = `license.reload`;
let licenseCache: License | null;

type LicenseStore = {
	license_key: string | undefined;
	license_token: string | undefined;
	initialized: 'active' | 'complete' | undefined;
	status: LicenseStatus | undefined;
};

const store = useStore<LicenseStore>(String(env['LICENSE_NAMESPACE']));

export async function getLicense(): Promise<License> {
	if (licenseCache) return licenseCache;

	const token = await store((store) => store.get('license_token'));

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

export type APILicense = {
	status: 'active' | 'inactive' | 'invalid';
	source: 'env' | 'settings';
} & License;

export class LicenseManager {
	/** Where the key or token comes from */
	private source: LicenseSource = null;

	constructor() {
		this.messenger.subscribe(RELOAD_CHANNEL, () => {
			licenseCache = null;
		});
	}

	private messenger = useBus();

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
		const initialized = await store(async (store) => {
			if ((await store.get('initialized')) === 'complete') return true;

			await store.set('initialized', 'active');
			return false;
		});

		if (initialized) return;

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
				await this.clearToken();
			}

			// Use core license
			await store(async (store) => {
				await store.set('initialized', 'complete');
				await store.delete('license_key');
				await store.set('status', 'active');
			});

			return;
		}

		await store(async (store) => {
			await store.set('license_key', envKey ?? dbKey ?? undefined);
			await store.set('license_token', envToken ?? dbToken ?? undefined);
		});

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
				await this.refresh();
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
				await this.refresh();
			} else {
				await this.activate(dbKey);
			}
		}

		await store(async (store) => {
			await store.set('initialized', 'complete');
		});
	}

	public async getStatus() {
		return await store(async (store) => store.get('status') ?? 'active');
	}

	public getSource() {
		return this.source;
	}

	private clearCache() {
		licenseCache = null;
		this.messenger.publish(RELOAD_CHANNEL, undefined);
	}

	/**
	 * Activates a new license and overwrites an existing one
	 */
	public async activate(key: string) {
		let license: License | null = null;
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

			this.clearCache();

			license = await verifyLicense(token);

			await store(async (store) => {
				await store.set('license_key', key);
				await store.set('license_token', token);
			});
		} catch (err) {
			error = err as Error;
			await this.clearToken();
		}

		await store(async (store) => {
			await store.set('status', getStatus(license, error));
		});
	}

	/**
	 * Update from an existing key to a new key
	 */
	public async update(oldKey: string, newKey: string) {
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
		const { key, token } = await store(async (store) => ({
			key: options?.key ?? (await store.get('license_key')),
			token: options?.token ?? (await store.get('license_token')),
		}));

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

				await store(async (store) => {
					await store.set('license_token', token);
				});

				this.clearCache();

				license = await verifyLicense(token);
			} catch (err) {
				error = err as Error;
				// TODO: Should not clear when license API unavailable
				await this.clearToken();
			}
		}

		await store(async (store) => {
			await store.set('status', getStatus(license, error));
		});
	}

	/** Downgrade to CORE license */
	private async clearToken() {
		const settingsService = new SettingsService({ schema: await getSchema() });
		await settingsService.upsertSingleton({ license_token: null });

		this.clearCache();

		await store(async (store) => {
			await store.delete('license_token');
		});
	}
}
