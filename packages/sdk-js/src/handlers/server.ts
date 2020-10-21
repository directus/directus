import { AxiosInstance } from 'axios';

export class ServerHandler {
	private axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	specs = {
		oas: async () => {
			const result = await this.axios.get('/server/specs/oas');
			return result.data;
		},
	};

	async ping() {
		await this.axios.get('/server/ping');
		return 'pong';
	}

	async info() {
		const result = await this.axios.get('/server/info');
		return result.data;
	}
}
