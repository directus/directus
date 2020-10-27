import { AxiosInstance } from 'axios';

export class AuthHandler {
	axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	password = {
		request: async (email: string) => {
			await this.axios.post('/auth/password/request', { email });
		},

		reset: async (token: string, password: string) => {
			await this.axios.post('/auth/password/reset', { token, password });
		},
	};
}
