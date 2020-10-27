import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class UsersHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_users', axios);
	}

	async invite(email: string | string[], role: string) {
		await this.axios.post('/users/invite', { email, role });
	}
}
