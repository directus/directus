import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class UsersHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_users', axios);
	}
}
