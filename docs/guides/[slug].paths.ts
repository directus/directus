import guidesData from '../.vitepress/data/guides.data.js';

export default {
	async paths() {
		const { guides } = await guidesData.load();
		return guides.sections.map((section) => ({
			params: {
				slug: section.indexPath,
				...section,
			},
		}));
	},
};
