import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class RolesHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_roles', axios);
	}
}
