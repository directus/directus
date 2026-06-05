import { InvalidPayloadError, ResourceRestrictedError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	MutationOptions,
	OwnerInformation,
	PrimaryKey,
	Query,
	QueryOptions,
	Settings,
} from '@directus/types';
import { version } from 'directus/version';
import { CUSTOM_LLM_FIELDS } from '../constants.js';
import { getEntitlementManager } from '../license/index.js';
import { sendReport } from '../telemetry/index.js';
import { ItemsService } from './items.js';

export class SettingsService extends ItemsService<Settings> {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}

	override async createOne(data: Partial<Settings>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (this.accountability !== null) {
			if ('license_key' in data) {
				throw new InvalidPayloadError({ reason: `You can't change the "license_key" value manually` });
			}

			if ('license_token' in data) {
				throw new InvalidPayloadError({ reason: `You can't change the "license_token" value manually` });
			}
		}

		const entitlementManager = getEntitlementManager();
		const changesLLM = CUSTOM_LLM_FIELDS.some((field) => field in data && data[field] !== null);

		if (!entitlementManager.isEntitled('custom_llms_enabled') && changesLLM) {
			throw new ResourceRestrictedError({ category: 'custom_llms_enabled' });
		}

		const result = await super.createOne(data, opts);

		if (changesLLM) {
			await getEntitlementManager().clearCache('custom_llms_enabled');
		}

		return result;
	}

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Settings>,
		opts?: MutationOptions,
	): Promise<PrimaryKey[]> {
		if (this.accountability !== null) {
			if ('license_key' in data) {
				throw new InvalidPayloadError({ reason: `You can't change the "license_key" value manually` });
			}

			if ('license_token' in data) {
				throw new InvalidPayloadError({ reason: `You can't change the "license_token" value manually` });
			}
		}

		const entitlementManager = getEntitlementManager();
		const changesLLM = CUSTOM_LLM_FIELDS.some((field) => field in data && data[field] !== null);

		if (!entitlementManager.isEntitled('custom_llms_enabled') && changesLLM) {
			throw new ResourceRestrictedError({ category: 'custom_llms_enabled' });
		}

		const result = await super.updateMany(keys, data, opts);

		if (changesLLM) {
			await entitlementManager.clearCache('custom_llms_enabled');
		}

		return result;
	}

	override async readByQuery(query: Query, opts?: QueryOptions): Promise<Settings[]> {
		const data = await super.readByQuery(query, opts);

		const entitlementManager = getEntitlementManager();

		if (!entitlementManager.isEntitled('custom_llms_enabled') && this.accountability !== null) {
			for (const record of data) {
				for (const field of CUSTOM_LLM_FIELDS) {
					if (record[field]) {
						record[field] = null;
					}
				}
			}
		}

		return data;
	}

	async setOwner(data: OwnerInformation) {
		const { project_id } = await this.knex.select('project_id').from('directus_settings').first();

		sendReport({ ...data, project_id, version }).catch(async () => {
			await this.knex.update('project_status', 'pending').from('directus_settings');
		});

		return await this.upsertSingleton({
			project_owner: data.project_owner,
			product_updates: data.product_updates,
			project_usage: data.project_usage,
			org_name: data.org_name,
		});
	}
}
