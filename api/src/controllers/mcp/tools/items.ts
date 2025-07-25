import z from 'zod';
import { defineTool } from '../tool.js';
import { formatSuccessResponse } from '../util.js';

export default defineTool('ping', {
	description: '',
	inputSchema: z.any(),
	annotations: {
		title: 'ping pong!',
	},
	async handler() {
		return formatSuccessResponse({}, 'pong');
	},
});
