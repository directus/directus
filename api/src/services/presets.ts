import type { AbstractServiceOptions } from '../types/index.js';
import { ItemsService } from './items.js';

export class PresetsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_presets', options);
	}
}
