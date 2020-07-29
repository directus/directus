import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

export default class PresetsService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_presets', options);
	}
}
