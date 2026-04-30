import { useEnv } from '@directus/env';
import {
	activate as activateKey,
	CORE_LICENSE,
	License,
	refresh as refreshLicense,
	verifyLicense,
} from '@directus/license';
import type { Knex } from 'knex';
import { useLogger } from '../logger/index.js';
import { SettingsService } from '../services/settings.js';
import { getSchema } from '../utils/get-schema.js';
import { useStore } from '../utils/store.js';
import { useRPC } from './rpc.js';
import { getStatus } from './status.js';
import type { LicenseSource, LicenseStatus } from './types.js';

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

export async function getLicense(options: { database?: Knex }): Promise<License> {
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
	private rpc = useRPC<Pick<LicenseManager, 'clearCache' | 'refreshKey' | 'refreshToken'>>(this, LICENSE_CHANNEL);

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
			if (await store.get('initialized')) return true;

			await store.set('initialized', true);
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
				await this.downgrade();
			}

			// Use core license
			await store(async (store) => {
				await store.set('status', 'active');
			});

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
	}

	public async getStatus() {
		return await store(async (store) => store.get('status') ?? 'active');
	}

	public getSource() {
		return this.source;
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

			this.rpc.clearCache();
			this.rpc.refreshKey();
			this.rpc.refreshToken();
		} catch (err) {
			error = err as Error;
			await this.downgrade();
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

				this.rpc.clearCache();
				this.rpc.refreshToken();

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

	public clearCache() {
		licenseCache = undefined;
	}

	public async refreshKey() {
		this.licenseKey = await getLicenseKey();
	}

	public async refreshToken() {
		this.licenseToken = await getLicenseToken();
	}

	/** Downgrade to CORE license */
	public async downgrade() {
		const settingsService = new SettingsService({ schema: await getSchema() });
		await settingsService.upsertSingleton({ license_token: null });

		this.rpc.clearCache();
		this.rpc.refreshToken();
	}
}

async function getLicenseKey(options?: { database?: Knex }) {
	if (env['LICENSE_KEY']) {
		return String(env['LICENSE_TOKEN']);
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
