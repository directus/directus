const section = '/user-guide/';
module.exports = {
	title: 'User Guide',
	children: [
		{
			type: 'page',
			path: section + 'introduction',
			title: 'Introduction',
		},
		{
			type: 'group',
			title: 'Content',
			children: [
				{
					type: 'page',
					path: section + 'content/collection-detail',
					title: 'Collection Detail',
				},
				{
					type: 'page',
					path: section + 'content/item-detail',
					title: 'Item Detail',
				},
			],
		},
		{
			type: 'page',
			path: section + 'user-directory-profile',
			title: 'User Directory & Profile',
		},
		{
			type: 'page',
			path: section + 'file-library',
			title: 'File Library',
		},
		{
			type: 'page',
			path: section + 'insights',
			title: 'Insights',
		},
		{
			type: 'page',
			path: section + 'documentation',
			title: 'Documentation',
		},
		{
			type: 'page',
			path: section + 'activity',
			title: 'Activity',
		},
	],
};
