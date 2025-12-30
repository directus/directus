import { ItemsService } from './items.js';
import { sendReport } from '../telemetry/index.js';
import type { AbstractServiceOptions, OwnerInformation } from '@directus/types';
import { version } from 'directus/version';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
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
