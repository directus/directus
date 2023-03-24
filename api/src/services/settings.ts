import type { AbstractServiceOptions } from '../types';
import { ItemsService } from './items';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}
}
