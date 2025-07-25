import { defineTool } from '../tool.js';

export default defineTool('ping', {
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
