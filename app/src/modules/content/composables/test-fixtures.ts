export const item = {
	data: {
		id: 1,
		status: 'draft',
		sort: null,
		user_created: '821f48c3-3606-4903-b424-a3f1c35315bf',
		date_created: '2025-09-19T20:08:20.419Z',
		user_updated: null,
		date_updated: null,
		title: 'Comparison Item 1',
		description:
			'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.',
		things: 'apple',
		enable: null,
		categories: [1],
	},
};

export const itemVersions = {
	data: [
		{
			id: 'cbbd19f9-a826-4850-9038-85f68508300f',
			key: 'comparison-item-1-version-1',
			name: 'Comparison Item 1 - Version 1',
			collection: 'comparison_tests',
			item: '1',
			date_created: '2025-09-19T20:09:42.498Z',
			date_updated: '2025-09-19T20:10:52.897Z',
			user_created: '821f48c3-3606-4903-b424-a3f1c35315bf',
			user_updated: null,
			hash: '0ef0f677fcef0f9201fd35e1eca71060b9178884',
		},
	],
};

export const versionComparison = {
	data: {
		outdated: false,
		mainHash: '0ef0f677fcef0f9201fd35e1eca71060b9178884',
		current: {
			title: 'Comparison Item 1 - Version 1 - Revision 1',
			description:
				'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.\nrevision 1',
			things: 'guitar',
			enable: true,
			categories: {
				create: [],
				update: [
					{
						category_id: '1',
						id: 2,
					},
				],
				delete: [],
			},
		},
		main: {
			id: 1,
			status: 'draft',
			sort: null,
			user_created: '821f48c3-3606-4903-b424-a3f1c35315bf',
			date_created: '2025-09-19T20:08:20.419Z',
			user_updated: null,
			date_updated: null,
			title: 'Comparison Item 1',
			description:
				'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.',
			things: 'apple',
			enable: null,
			categories: [1],
		},
	},
};

export const versionRevisions = {
	data: [
		{
			id: 804,
			data: {
				title: 'Comparison Item 1 - Version 1 - Revision 1',
				description:
					'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.\nrevision 1',
				things: 'guitar',
				enable: true,
				categories: {
					create: [],
					update: [
						{
							category_id: '1',
							id: 2,
						},
					],
					delete: [],
				},
			},
			delta: {
				title: 'Comparison Item 1 - Version 1 - Revision 1',
				description:
					'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.\nrevision 1',
				things: 'guitar',
				enable: true,
				categories: {
					create: [],
					update: [
						{
							category_id: '1',
							id: 2,
						},
					],
					delete: [],
				},
			},
			collection: 'comparison_tests',
			version: 'cbbd19f9-a826-4850-9038-85f68508300f',
			item: '1',
			activity: {
				action: 'version_save',
				timestamp: '2025-09-19T20:10:52.890Z',
				user: '821f48c3-3606-4903-b424-a3f1c35315bf',
			},
		},
	],
};
