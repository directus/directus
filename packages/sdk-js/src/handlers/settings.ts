import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class SettingsHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_settings', axios);
	}
}
