import { ItemsService } from './items.js';
import type { AbstractServiceOptions } from '@directus/types';

export class PresetsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_presets', options);
	}
}
