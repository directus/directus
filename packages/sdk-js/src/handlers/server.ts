import { AxiosInstance } from 'axios';
import type { OpenAPIObject } from 'openapi3-ts';

export type ServerInfo = {
	project: {
		project_name: string;
		project_logo: string | null;
		project_color: string | null;
		public_foreground: string | null;
		public_background: string | null;
		public_note: string | null;
		custom_css: null;
	};
	directus?: { version: string };
	node?: { uptime: number; version: string };
	os?: { totalmem: number; type: string; uptime: number; version: string };
};

export class ServerHandler {
	private axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	specs = {
		oas: async (): Promise<OpenAPIObject> => {
			const result = await this.axios.get('/server/specs/oas');
			return result.data;
		},
	};

	async ping(): Promise<'pong'> {
		await this.axios.get('/server/ping');
		return 'pong';
	}

	async info(): Promise<{ data: ServerInfo }> {
		const result = await this.axios.get('/server/info');
		return result.data;
	}
}
