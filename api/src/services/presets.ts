import { ItemsService } from './items';
import { AbstractServiceOptions } from '../types';

export class PresetsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_presets', options);
	}
}
