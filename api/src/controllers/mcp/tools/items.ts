import { defineTool } from '../tool.js';

export const ping = defineTool('ping', {
	description: '',
	annotations: {
		title: 'ping pong!',
	},
	async handler() {
		return {
			data: {},
			message: 'pong',
		};
	},
});
