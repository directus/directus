import { useEnv } from '@directus/env';
import {
	activate as activateKey,
	CORE_LICENSE,
	License,
	refresh as refreshLicense,
	verifyLicense,
} from '@directus/license';
import type { Knex } from 'knex';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { SettingsService } from '../services/settings.js';
import { getSchema } from '../utils/get-schema.js';
import type { LicenseSource } from './types.js';

let licenseManager: LicenseManager | undefined;
const env = useEnv();
const logger = useLogger();
const RELOAD_CHANNEL = `license.reload`;
let licenseCache: License | null;

export async function getLicense(options: { database?: Knex }): Promise<License> {
	if (licenseCache) return licenseCache;

	let token: string | null = null;

	if (env['LICENSE_TOKEN']) {
		token = String(env['LICENSE_TOKEN']);
	} else {
		const schema = await getSchema(options);
		const settingsService = new SettingsService({ schema, ...options });

		const { license_token } = await settingsService.readSingleton({ fields: ['license_token'] });
		token = license_token ?? null;
	}

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
				await settingsService.upsertSingleton({ license_token: null });

				this.clearCache();
			}

			return;
		}

		// CASE D
		if (envKey && !dbKey) {
			this.source = 'env';
			this.activate(envKey);
		}

		if (envKey && dbKey) {
			this.source = 'env';

			// CASE B else C
			if (envKey !== dbKey) {
				this.update(dbKey, envKey);
			} else {
				this.refresh(envKey, dbToken);
			}
		}

		// CASE E
		if (envToken) {
			this.source = 'env';
			this.verify(envToken);
		}

		if (dbKey) {
			this.source = 'settings';

			// CASE F else G
			if (dbToken) {
				this.refresh(dbKey, dbToken);
			} else {
				this.activate(dbKey);
			}
		}
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
		const settingsService = new SettingsService({ schema: await getSchema() });

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const license = await activateKey({
			license_key: key,
			project_id: project_id!,
			public_url: env['PUBLIC_URL'] as string,
		});

		await settingsService.upsertSingleton({
			license_key: key,
			license_token: license.token,
			project_id: license.new_project_id ?? project_id!,
		});

		this.clearCache();
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
	public async refresh(key: string, token?: string | null): Promise<void> {
		let license: License | null = null;
		const settingsService = new SettingsService({ schema: await getSchema() });

		if (token) {
			license = await this.verify(token);
		}

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		if (license?.meta.offline === false) {
			const refreshedLicense = await refreshLicense({
				license_key: key,
				project_id: project_id!,
				public_url: env['PUBLIC_URL'] as string,
			});

			await settingsService.upsertSingleton({
				license_token: refreshedLicense.token,
			});

			this.clearCache();
		}
	}
}
