import type { WebSocketAuthModes } from '../../../index.js';
import type { RestCommand } from '../../types.js';

export type ServerInfoOutput = {
	project: {
		project_name: string;
		default_language: string;
		public_registration: boolean;
		public_registration_verify_email: boolean;
	};
	mcp_enabled?: boolean;
	ai_enabled?: boolean;
	rateLimit?:
		| {
				points: number;
				duration: number;
		  }
		| false;
	rateLimitGlobal?:
		| {
				points: number;
				duration: number;
		  }
		| false;
	queryLimit?: {
		default: number;
		max: number;
	};
	websocket?:
		| {
				rest:
					| {
							authentication: WebSocketAuthModes;
							path: string;
					  }
					| false;
				graphql:
					| {
							authentication: WebSocketAuthModes;
							path: string;
					  }
					| false;
				heartbeat: number | false;
		  }
		| false;
};

/**
 * Get information about the current installation.
 * @returns Information about the current installation.
 */
export const serverInfo =
	<Schema>(): RestCommand<ServerInfoOutput, Schema> =>
	() => ({
		method: 'GET',
		path: '/server/info',
	});
