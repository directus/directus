module.exports = {
	base: '/',
	title: 'Directus Docs',
	description: 'Directus 9. An Instant App & API for your SQL Database.',
	ga: 'UA-24637628-7',
	head: [
		['link', { rel: 'manifest', href: '/manifest.json' }],
		['link', { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#2CCDA6' }],
		['link', { rel: 'shortcut icon', type: 'image/svg+xml', href: '/favicon.svg' }],
		[
			'link',
			{
				rel: 'apple-touch-icon',
				type: 'image/svg+xml',
				sizes: '180x180',
				href: '/favicon.svg',
			},
		],
		[
			'link',
			{
				rel: 'icon',
				type: 'image/svg+xml',
				sizes: '32x32',
				href: '/favicon.svg',
			},
		],
		[
			'link',
			{
				rel: 'icon',
				type: 'image/svg+xml',
				sizes: '16x16',
				href: '/favicon.svg',
			},
		],
		['meta', { name: 'application-name', content: 'Directus Docs' }],
		['meta', { name: 'theme-color', content: '#2CCDA6' }],
		['meta', { name: 'apple-mobile-web-app-title', content: 'Directus Docs' }],
		['meta', { name: 'msapplication-TileColor', content: '#2CCDA6' }],
		['meta', { name: 'msapplication-config', content: '/browserconfig.xml' }],
	],
	themeConfig: {
		repo: 'directus/directus',
		docsBranch: 'main',
		logo: '/logo.svg',
		editLinks: true,
		docsDir: 'docs',
		lastUpdated: true,
		serviceWorker: false,
		patterns: ['docs/**/*.md'],
		sidebarDepth: 0,
		activeHeaderLinks: false,
		smoothScroll: false,
		algolia: {
			apiKey: '84890d566c1f9ad79ca62a1358e05c60',
			indexName: 'directus',
		},
		nav: [
			{ text: 'Website', link: 'https://directus.io' },
			{ text: 'Cloud', link: 'https://directus.cloud' },
		],
		sidebar: [
			{
				title: 'Getting Started',
				collapsable: false,
				children: [
					{
						type: 'page',
						path: '/getting-started/introduction',
						title: 'Introduction',
					},
					{
						type: 'page',
						path: '/getting-started/quickstart',
						title: 'Quickstart Guide',
					},
					{
						type: 'page',
						path: '/getting-started/installation',
						title: 'Installation',
					},
					{
						type: 'page',
						path: '/getting-started/support',
						title: 'Help & Support',
					},
					{
						type: 'page',
						path: '/getting-started/backing-directus',
						title: 'Backing Directus',
					},
					{
						type: 'page',
						path: '/getting-started/glossary',
						title: 'Glossary',
					},
				],
			},
			{
				title: 'App Guide',
				children: [
					{
						type: 'page',
						path: '/app/overview',
						title: 'Overview',
					},
					{
						type: 'page',
						path: '/app/content',
						title: 'Content',
						collapsable: false,
						children: [
							{
								type: 'page',
								path: '/app/content/collection',
								title: 'Collection Page',
							},
							{
								type: 'page',
								path: '/app/content/item',
								title: 'Item Page',
							},
						]
					},
					{
						type: 'page',
						path: '/app/user-directory',
						title: 'User Directory',
					},
					{
						type: 'page',
						path: '/app/file-library',
						title: 'File Library',
					},
					{
						type: 'page',
						path: '/app/insights',
						title: 'Insights',
					},
					{
						type: 'page',
						path: '/app/documentation',
						title: 'Documentation',
					},
					{
						type: 'page',
						path: '/app/settings',
						title: 'Settings',
					},
					{
						type: 'page',
						path: '/app/activity-log',
						title: 'Activity Log',
					},
				],
			},
			{
				title: 'Configuration',
				children: [
					{
						type: 'page',
						path: '/configuration/overview',
						title: 'Overview',
					},
					{
						type: 'page',
						path: '/configuration/installation',
						title: 'Installation',
						children: [
							{
								type: 'page',
								path: '/configuration/installation/aws',
								title: 'AWS',
							},
							{
								type: 'page',
								path: '/configuration/installation/cli',
								title: 'CLI',
							},
							{
								type: 'page',
								path: '/configuration/installation/digitalocean-app-platform',
								title: 'DigitalOcean',
							},
							{
								type: 'page',
								path: '/configuration/installation/docker',
								title: 'Docker',
							},
							{
								type: 'page',
								path: '/configuration/installation/iis',
								title: 'IIS',
							},
							{
								type: 'page',
								path: '/configuration/installation/manual',
								title: 'Manual',
							},
							{
								type: 'page',
								path: '/configuration/installation/plesk',
								title: 'Plesk',
							},
							{
								type: 'page',
								path: '/configuration/installation/ubuntu',
								title: 'Ubuntu',
							},
						]
					},
					{
						type: 'page',
						path: '/configuration/config-files',
						title: 'Config Files',
					},
					{
						type: 'page',
						path: '/configuration/project-settings',
						title: 'Project Settings',
					},
					{
						type: 'page',
						path: '/configuration/data-model',
						title: 'Data Model',
						collapsable: false,
						children: [
							{
								type: 'page',
								path: '/configuration/relationships',
								title: 'Relationships',
							},
						]
					},
					{
						type: 'page',
						path: '/configuration/users-roles-permissions',
						title: 'Users, Roles & Permissions',
					},
					{
						type: 'page',
						path: '/configuration/presets-bookmarks',
						title: 'Presets & Bookmarks',
					},
					{
						type: 'page',
						path: '/configuration/webhooks',
						title: 'Webhooks',
					},
					{
						type: 'divider',
					},
					// {
					// 	type: 'page',
					// 	path: '/configuration/security',
					// 	title: 'Security*',
					// },
					// {
					// 	type: 'page',
					// 	path: '/configuration/localization',
					// 	title: 'Localization*',
					// },
					// {
					// 	type: 'page',
					// 	path: '/configuration/faq',
					// 	title: 'Frequently Asked Questions*',
					// },
					{
						type: 'page',
						path: '/configuration/filter-rules',
						title: 'Filter Rules',
					},
					{
						type: 'page',
						path: '/configuration/upgrades-migrations',
						title: 'Upgrades & Migrations',
					},
				],
			},
			{
				title: 'API Reference',
				children: [
					{
						type: 'page',
						path: '/reference/api/introduction',
						title: 'Introduction',
					},
					{
						type: 'page',
						path: '/reference/api/authentication',
						title: 'Authentication',
					},
					{
						type: 'page',
						title: 'Global Parameters',
						path: '/reference/api/query',
					},
					{
						type: 'page',
						title: 'Items',
						path: '/reference/api/items',
					},
					{
						type: 'page',
						path: '/reference/api/assets',
						title: 'Files',
					},
					{
						type: 'divider',
					},
					{
						type: 'page',
						path: '/reference/api/system/activity',
						title: 'Activity',
					},
					{
						type: 'page',
						path: '/reference/api/system/authentication',
						title: 'Authentication***',
					},
					{
						type: 'page',
						path: '/reference/api/system/collections',
						title: 'Collections',
					},
					{
						type: 'page',
						path: '/reference/api/system/extensions',
						title: 'Extensions',
					},
					{
						type: 'page',
						path: '/reference/api/system/fields',
						title: 'Fields',
					},
					{
						type: 'page',
						path: '/reference/api/system/files',
						title: 'Files***',
					},
					{
						type: 'page',
						path: '/reference/api/system/folders',
						title: 'Folders',
					},
					{
						type: 'page',
						path: '/reference/api/system/permissions',
						title: 'Permissions',
					},
					{
						type: 'page',
						path: '/reference/api/system/presets',
						title: 'Presets',
					},
					{
						type: 'page',
						path: '/reference/api/system/relations',
						title: 'Relations',
					},
					{
						type: 'page',
						path: '/reference/api/system/revisions',
						title: 'Revisions',
					},
					{
						type: 'page',
						path: '/reference/api/system/roles',
						title: 'Roles',
					},
					{
						type: 'page',
						path: '/reference/api/system/server',
						title: 'Server',
					},
					{
						type: 'page',
						path: '/reference/api/system/settings',
						title: 'Settings',
					},
					{
						type: 'page',
						path: '/reference/api/system/users',
						title: 'Users',
					},
					{
						type: 'page',
						path: '/reference/api/system/utilities',
						title: 'Utilities',
					},
					{
						type: 'page',
						path: '/reference/api/system/webhooks',
						title: 'Webhooks',
					},



					// {
					// 	type: 'page',
					// 	path: '/reference/command-line-interface',
					// 	title: 'Command Line Interface',
					// },
					// {
					// 	type: 'page',
					// 	path: '/reference/environment-variables',
					// 	title: 'Environment Variables',
					// },
					// {
					// 	type: 'page',
					// 	path: '/reference/config-files',
					// 	title: 'Config Files',
					// },
					// {
					// 	type: 'page',
					// 	path: '/reference/error-codes',
					// 	title: 'Error Codes',
					// },
					// {
					// 	type: 'page',
					// 	path: '/reference/field-transforms',
					// 	title: 'Field Transforms',
					// },
					// {
					// 	type: 'page',
					// 	path: '/reference/filter-rules',
					// 	title: 'Filter Rules',
					// },
					// {
					// 	type: 'page',
					// 	path: '/reference/sdk',
					// 	title: 'JavaScript SDK',
					// },
					// {
					// 	title: 'Vue Components',
					// 	type: 'group',
					// 	children: [
					// 		{
					// 			path: 'reference/app/components/',
					// 			title: 'Introduction',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-avatar',
					// 			title: 'Avatar',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-badge',
					// 			title: 'Badge',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-breadcrumb',
					// 			title: 'Breadcrumb',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-button',
					// 			title: 'Button',
					// 			type: 'page',
					// 		},
					// 		{
					// 			title: 'Card',
					// 			children: [
					// 				{
					// 					path: 'reference/app/components/v-card',
					// 					title: 'Card',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-card-actions',
					// 					title: 'Card Actions',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-card-subtitle',
					// 					title: 'Card Subtitle',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-card-text',
					// 					title: 'Card Text',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-card-title',
					// 					title: 'Card Title',
					// 					type: 'page',
					// 				},
					// 			],
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-checkbox',
					// 			title: 'Checkbox',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-chip',
					// 			title: 'Chip',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-detail',
					// 			title: 'Detail',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-dialog',
					// 			title: 'Dialog',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-divider',
					// 			title: 'Divider',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-drawer',
					// 			title: 'Drawer',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-error',
					// 			title: 'Error',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-fancy-select',
					// 			title: 'Fancy Select',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-field-select',
					// 			title: 'Field Select',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-field-template',
					// 			title: 'Field Template',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-form',
					// 			title: 'Form',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-hover',
					// 			title: 'Hover',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-icon',
					// 			title: 'Icon',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-info',
					// 			title: 'Info',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-input',
					// 			title: 'Input',
					// 			type: 'page',
					// 		},
					// 		{
					// 			title: 'ItemGroup',
					// 			children: [
					// 				{
					// 					path: 'reference/app/components/v-item-group',
					// 					title: 'Item Group',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-item',
					// 					title: 'Item',
					// 					type: 'page',
					// 				},
					// 			],
					// 		},
					// 		{
					// 			title: 'List',
					// 			children: [
					// 				{
					// 					path: 'reference/app/components/v-list-group',
					// 					title: 'List Group',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-list-item-content',
					// 					title: 'List Item Content',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-list-item-hint',
					// 					title: 'List Item Hint',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-list-item-icon',
					// 					title: 'List Item Icon',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-list-item',
					// 					title: 'List Item',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-list',
					// 					title: 'List',
					// 					type: 'page',
					// 				},
					// 			],
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-menu',
					// 			title: 'Menu',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-notice',
					// 			title: 'Notice',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-overlay',
					// 			title: 'Overlay',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-pagination',
					// 			title: 'Pagination',
					// 			type: 'page',
					// 		},
					// 		{
					// 			title: 'Progress',
					// 			children: [
					// 				{
					// 					path: 'reference/app/components/v-progress-circular',
					// 					title: 'Progress Circular',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-progress-linear',
					// 					title: 'Progress Linear',
					// 					type: 'page',
					// 				},
					// 			],
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-radio',
					// 			title: 'Radio',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-select',
					// 			title: 'Select',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-sheet',
					// 			title: 'Sheet',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-skeleton-loader',
					// 			title: 'Skeleton Loader',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-slider',
					// 			title: 'Slider',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-switch',
					// 			title: 'Switch',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-table',
					// 			title: 'Table',
					// 			type: 'page',
					// 		},
					// 		{
					// 			title: 'Tabs',
					// 			children: [
					// 				{
					// 					path: 'reference/app/components/v-tabs',
					// 					title: 'Tabs',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-tab',
					// 					title: 'Tab',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-tabs-items',
					// 					title: 'Tabs Items',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/v-tab-item',
					// 					title: 'Tab Item',
					// 					type: 'page',
					// 				},
					// 			],
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-text-overflow',
					// 			title: 'Text Overflow',
					// 			type: 'page',
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-textarea',
					// 			title: 'Textarea',
					// 			type: 'page',
					// 		},
					// 		{
					// 			title: 'Transitions',
					// 			children: [
					// 				{
					// 					path: 'reference/app/components/transition-bounce',
					// 					title: 'Transition Bounce',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/transition-dialog',
					// 					title: 'Transition Dialog',
					// 					type: 'page',
					// 				},
					// 				{
					// 					path: 'reference/app/components/transition-expand',
					// 					title: 'Transition Expand',
					// 					type: 'page',
					// 				},
					// 			],
					// 		},
					// 		{
					// 			path: 'reference/app/components/v-upload',
					// 			title: 'Upload',
					// 			type: 'page',
					// 		},
					// 	],
					// },
				],
			},
			{
				title: 'Extensions',
				children: [
					{
						type: 'page',
						path: '/extensions/introduction',
						title: 'Introduction',
					},
					{
						type: 'page',
						path: '/extensions/api-endpoints',
						title: 'API Endpoints',
					},
					{
						type: 'page',
						path: '/extensions/app-translations',
						title: 'App Translations',
					},
					{
						type: 'page',
						path: '/extensions/displays',
						title: 'Displays',
					},
					{
						type: 'page',
						path: '/extensions/email-templates',
						title: 'Email Templates',
					},
					{
						type: 'page',
						path: '/extensions/hooks',
						title: 'Hooks',
					},
					{
						type: 'page',
						path: '/extensions/interfaces',
						title: 'Interfaces',
					},
					{
						type: 'page',
						path: '/extensions/layouts',
						title: 'Layouts',
					},
					{
						type: 'page',
						path: '/extensions/migrations',
						title: 'Migrations',
					},
					{
						type: 'page',
						path: '/extensions/modules',
						title: 'Modules',
					},
					{
						type: 'page',
						path: '/extensions/panes',
						title: 'Panes',
					},
					{
						type: 'page',
						path: '/extensions/themes',
						title: 'Themes',
					},
				],
			},
			{
				title: 'Contributing',
				children: [
					{
						type: 'page',
						path: '/contributing/introduction',
						title: 'Introduction',
					},
					{
						type: 'page',
						path: '/contributing/codebase-overview',
						title: 'Codebase Overview',
					},
					{
						type: 'page',
						path: '/contributing/running-locally',
						title: 'Running Locally',
					},
					{
						type: 'page',
						path: '/contributing/github-ci',
						title: 'GitHub CI',
					},
					{
						type: 'page',
						path: '/contributing/translations',
						title: 'Translating the App',
					},
				],
			},
		],
	},
	markdown: {
		toc: {
			includeLevel: [2],
		},
	},
	plugins: [
		[
			'vuepress-plugin-clean-urls',
			{
				normalSuffix: '/',
				indexSuffix: '/',
				notFoundPath: '/404.html',
			},
		],
	],
};
