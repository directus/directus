import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';
import { Query, Payload } from '../types';

export type UserInfo = {
	avatar: string | null;
	description: string | null;
	email: string;
	first_name: string | null;
	id: string;
	language: string;
	last_access: string;
	last_name: string | null;
	last_page: string;
	location: string | null;
	password: string;
	role: string;
	status: string;
	tags: string[];
	tfa_secret: string | null;
	theme: 'auto' | 'dark' | 'light';
	title: string | null;
	token: string | null;
};

export class UsersHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_users', axios);
	}

	async invite(email: string | string[], role: string): Promise<void> {
		await this.axios.post('/users/invite', { email, role });
	}

	async acceptInvite(token: string, password: string): Promise<void> {
		await this.axios.post('/users/invite/accept', { token, password });
	}

	tfa = {
		enable: async (password: string): Promise<void> => {
			await this.axios.post('/users/tfa/enable', { password });
		},
		disable: async (otp: string): Promise<void> => {
			await this.axios.post('/users/tfa/disable', { otp });
		},
	};

	me = {
		read: async (query?: Query): Promise<{ data: Partial<UserInfo> }> => {
			const response = await this.axios.get('/users/me', { params: query });
			return response.data;
		},
		update: async (payload: Payload, query?: Query): Promise<{ data: Partial<UserInfo> }> => {
			const response = await this.axios.patch('/users/me', payload, { params: query });
			return response.data;
		},
	};
}
