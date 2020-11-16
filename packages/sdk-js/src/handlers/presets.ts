import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class PresetsHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_presets', axios);
	}
}
