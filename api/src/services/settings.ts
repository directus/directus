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
		if (CUSTOM_LLM_FIELDS.find((field) => field in data && data[field] !== null)) {
			const entitlementManager = getEntitlementManager();
			await entitlementManager.assert('custom_llms_enabled');
		}

		return super.createOne(data, opts);
	}

	override async updateMany(
		keys: PrimaryKey[],
		data: Partial<Settings>,
		opts?: MutationOptions,
	): Promise<PrimaryKey[]> {
		if (CUSTOM_LLM_FIELDS.find((field) => field in data && data[field] !== null)) {
			const entitlementManager = getEntitlementManager();
			await entitlementManager.assert('custom_llms_enabled');
		}

		return super.updateMany(keys, data, opts);
	}

	override async readByQuery(query: Query, opts?: QueryOptions): Promise<Settings[]> {
		const data = await super.readByQuery(query, opts);

		if (this.accountability !== null) {
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
		});
	}
}
