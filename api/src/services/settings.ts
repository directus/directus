import { ForbiddenError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	Item,
	MutationOptions,
	OwnerInformation,
	PrimaryKey,
	Query,
	QueryOptions,
} from '@directus/types';
import { toBoolean } from '@directus/utils';
import { version } from 'directus/version';
import { clearLicenseFallbackCompliance } from '../license/cache-license-fallback-compliance.js';
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

	override async upsertSingleton(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const includesSsoDisabled = Object.hasOwn(data, 'sso_disabled');

		if (includesSsoDisabled) {
			const entitlements = await getLicenseEntitlements(this.knex);

			if (entitlements.sso_enabled !== true) {
				const currentSettings = await this.knex.select('sso_disabled').from('directus_settings').first();
				const currentDisabled = toBoolean(currentSettings?.['sso_disabled']);
				const nextDisabled = toBoolean(data['sso_disabled']);

				if (currentDisabled === true && nextDisabled === false) {
					throw new ForbiddenError();
				}
			}
		}

		const result = await super.upsertSingleton(data, opts);

		if (includesSsoDisabled) {
			try {
				await clearLicenseFallbackCompliance();
			} catch {
				// Ignore cache invalidation failures and preserve the successful settings write.
			}
		}

		return result;
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
