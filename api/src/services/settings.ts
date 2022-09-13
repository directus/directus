import { AbstractServiceOptions } from '@directus/shared/services';
import { ItemsService } from './items';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}
}
