const section = '/getting-started/';
module.exports = {
	title: 'Getting Started',
	collapsable: false,
	children: [
		{
			type: 'page',
			path: section + 'introduction',
			title: 'Introduction',
		},
		{
			type: 'page',
			path: section + 'quickstart',
			title: 'Quickstart Guide',
		},
		{
			type: 'page',
			path: section + 'installation',
			title: 'Installation',
		},
		{
			type: 'page',
			path: section + 'database-mirroring',
			title: 'Database Mirroring',
		},
		{
			type: 'page',
			path: section + 'contribution-guide',
			title: 'Contribution Guide',
		},
		{
			type: 'page',
			path: section + 'support',
			title: 'Help & Support',
		},
		{
			type: 'page',
			path: section + 'backing-directus',
			title: 'Backing Directus',
		},
		{
			type: 'page',
			path: section + 'glossary',
			title: 'Glossary',
		},
	],
};
