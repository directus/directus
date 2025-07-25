import z from 'zod';
import { defineTool } from '../tool.js';

export default defineTool('ping', {
	description: '',
	inputSchema: z.any(),
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
