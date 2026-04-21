import type { AbstractServiceOptions, Item, OwnerInformation, Query, QueryOptions } from '@directus/types';
import { version } from 'directus/version';
import { getLicenseEntitlements } from '../license/summary.js';
import { sendReport } from '../telemetry/index.js';
import { ItemsService } from './items.js';

const customLLMFields = [
	'ai_openai_compatible_api_key',
	'ai_openai_compatible_base_url',
	'ai_openai_compatible_name',
	'ai_openai_compatible_models',
	'ai_openai_compatible_headers',
] as const;

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}

	override async readSingleton(query: Query, opts?: QueryOptions): Promise<Partial<Item>> {
		const settings = await super.readSingleton(query, opts);

		if (customLLMFields.some((field) => Object.hasOwn(settings, field)) === false) {
			return settings;
		}

		const entitlements = await getLicenseEntitlements(this.knex);

		if (entitlements.custom_llm_enabled === true) {
			return settings;
		}

		const redactedSettings = { ...settings };

		for (const field of customLLMFields) {
			if (Object.hasOwn(redactedSettings, field)) {
				redactedSettings[field] = null;
			}
		}

		return redactedSettings;
	}

	async setOwner(data: OwnerInformation) {
		const { project_id } = await this.knex.select('project_id').from('directus_settings').first();

		sendReport({ ...data, project_id, version }).catch(async () => {
			await this.knex.update('project_status', 'pending').from('directus_settings');
		});

		return await this.upsertSingleton({
			project_owner: data.project_owner,
			project_usage: data.project_usage,
			org_name: data.org_name,
			product_updates: data.product_updates,
			project_status: null,
		});
	}
}
