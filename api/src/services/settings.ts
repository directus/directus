import type { AbstractServiceOptions, OwnerInformation } from '@directus/types';
import { ItemsService } from './items.js';
import { useLogger } from '../logger/index.js';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}

	async setOwner(data: OwnerInformation) {
		// TODO: send data to telemetry service

		const logger = useLogger();

		logger.info(
			`TODO: This would now send owner info to telemetry: Owner ${data.email}, Usage: ${data.usage}, Company: ${data.org_name}`,
		);

		return await this.upsertSingleton({ project_owner: data.email });
	}
}
