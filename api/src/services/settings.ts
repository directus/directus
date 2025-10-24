import type { AbstractServiceOptions, OwnerInformation } from '@directus/types';
import { sendOwnerReport } from '../telemetry/lib/send-owner-report.js';
import { ItemsService } from './items.js';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}

	async setOwner(data: OwnerInformation) {
		sendOwnerReport(data);

		return await this.upsertSingleton({
			project_owner: data.email,
			project_usage: data.project_usage,
			org_name: data.org_name,
			product_updates: data.product_updates,
		});
	}
}
