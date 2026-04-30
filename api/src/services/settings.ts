import type { AbstractServiceOptions, OwnerInformation, Settings } from '@directus/types';
import { version } from 'directus/version';
import { sendReport } from '../telemetry/index.js';
import { ItemsService } from './items.js';

export class SettingsService extends ItemsService<Settings> {
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
			product_updates: data.product_updates,
		});
	}
}
