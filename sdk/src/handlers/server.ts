/**
 * Server handler
 */

import { ITransport } from '../transport';

export type ServerInfo = {
	project: {
		project_name: string;
		project_logo: string | null;
		project_color: string;
		public_foreground: string | null;
		public_background: string | null;
		public_note: string;
		custom_css: string;
	};
	directus?: {
		version: string;
	};
};

export class ServerHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async ping(): Promise<'pong'> {
		return (await this.transport.get<any, 'pong'>('/server/ping')).raw;
	}

	async info(): Promise<ServerInfo> {
		return (await this.transport.get<ServerInfo>('/server/info')).data!;
	}

	async oas(): Promise<any> {
		return (await this.transport.get<any>('/server/specs/oas')).raw;
	}
}
