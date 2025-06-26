import type { AbstractServiceOptions } from '@directus/types';
import { ItemsService } from './items.js';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}
}
