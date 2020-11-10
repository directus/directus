import { ItemsService } from './items';
import { AbstractServiceOptions } from '../types';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}
}
