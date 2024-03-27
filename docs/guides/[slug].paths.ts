import { sections } from '../.vitepress/data/guides.js';

export default {
	paths() {
		return Object.entries(sections).map(([name, section]) => ({
			params: {
				slug: name,
				...section,
			},
		}));
	},
};
