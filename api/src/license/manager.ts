import { useEnv } from '@directus/env';
import { activate as activateKey, License, refresh as refreshLicense, verifyLicense } from '@directus/license';
import { useLogger } from '../logger/index.js';
import { SettingsService } from '../services/settings.js';
import { getSchema } from '../utils/get-schema.js';

let licenseManager: LicenseManager | undefined;

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

// Activate (license_key): call License API and store key and token in DB (can return new project_id)

// Verify: online mode: check jwt against License API jwk offline mode: just check jwt against local jwk error if not
// offline

// Refresh (license_key): (if online) returns new jwt and store it to db and cache

// Update (old_lk, new_lk): call to License API to update from old to new. Persist new in db and cache

export class LicenseManager {
	private logger = useLogger();
	private env = useEnv();
	/** Where the key or token comes from */
	private source: 'env' | 'db' | null = null;

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
		const envKey = this.env['LICENSE_KEY'] as string | undefined;
		const envToken = this.env['LICENSE_TOKEN'] as string | undefined;

		// CASE A
		if (envKey && envToken) {
			this.logger.error('LICENSE_KEY and LICENSE_TOKEN cannot both be set. Provide one or the other.');
			process.exit(1);
		}

		const schema = await getSchema();
		const settingsService = new SettingsService({ schema, accountability: null });

		const { license_key: dbKey, license_token: dbToken } = await settingsService.readSingleton({
			fields: ['license_key', 'license_token'],
		});

		// CASE I
		if (!envKey && !envToken && !dbKey) {
			// CASE H
			if (dbToken) {
				settingsService.upsertSingleton({ license_token: null });
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
			this.source = 'db';

			// CASE F else G
			if (dbToken) {
				this.refresh(dbKey, dbToken);
			} else {
				this.activate(dbKey);
			}
		}
	}

	/**
	 * Activates a new license and overwrites an existing one
	 */
	public async activate(key: string) {
		const schema = await getSchema();
		const settingsService = new SettingsService({ schema, accountability: null });
		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		const license = await activateKey({
			license_key: key,
			project_id: project_id!,
			public_url: this.env['PUBLIC_URL'] as string,
		});

		settingsService.upsertSingleton({
			license_key: key,
			license_token: license.token,
			project_id: license.new_project_id ?? project_id!,
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
			this.logger.warn('Failed to verify license token defaulting to "core"', { error: e });
		}

		return null;
	}

	/**
	 * Verifys a current token and refreshes it with a new token
	 */
	public async refresh(key: string, token?: string | null): Promise<void> {
		const schema = await getSchema();
		const settingsService = new SettingsService({ schema, accountability: null });

		let license: License | null = null;

		if (token) {
			license = await this.verify(token);
		}

		const { project_id } = await settingsService.readSingleton({ fields: ['project_id'] });

		if (license?.meta.offline === false) {
			const refreshedLicense = await refreshLicense({
				license_key: key,
				project_id: project_id!,
				public_url: this.env['PUBLIC_URL'] as string,
			});

			settingsService.upsertSingleton({
				license_token: refreshedLicense.token,
			});

			// TODO - update token cache
		}
	}
}
