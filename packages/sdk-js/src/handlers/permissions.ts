import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class PermissionsHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_permissions', axios);
	}
}
