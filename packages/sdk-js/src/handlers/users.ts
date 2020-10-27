import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';
import { Query, Payload } from '../types';

export class UsersHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_users', axios);
	}

	async invite(email: string | string[], role: string) {
		await this.axios.post('/users/invite', { email, role });
	}

	async acceptInvite(token: string, password: string) {
		await this.axios.post('/users/invite/accept', { token, password });
	}

	tfa = {
		enable: async (password: string) => {
			await this.axios.post('/users/tfa/enable', { password });
		},
		disable: async (otp: string) => {
			await this.axios.post('/users/tfa/disable', { otp });
		},
	};

	me = {
		read: async (query?: Query) => {
			const response = await this.axios.get('/users/me', { params: query });
			return response.data;
		},
		update: async (payload: Payload, query?: Query) => {
			const response = await this.axios.patch('/users/me', payload, { params: query });
			return response.data;
		},
	};
}
