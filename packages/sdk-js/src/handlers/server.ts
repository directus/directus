import { AxiosInstance } from 'axios';

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
};

export type OasData = {
	openapi: string;
	info: {
		title: string;
		description: string;
		versions: string;
	};
	servers: { url: string; description: string }[];
	tags: { name: string; description: string }[];
	paths: Record<string, any>;
	components: Record<string, any>;
};

export class ServerHandler {
	private axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	specs = {
		oas: async (): Promise<OasData> => {
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
