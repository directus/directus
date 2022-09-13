import { AbstractServiceOptions } from '@directus/shared/services';
import { ItemsService } from './items';

export class PresetsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_presets', options);
	}
}
