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
	dest: 'dist',
	themeConfig: {
		repo: 'directus/directus',
		docsBranch: 'main',
		logo: '/logo.svg',
		editLinks: true,
		docsDir: 'docs',
		lastUpdated: true,
		serviceWorker: true,
		patterns: ['docs/**/*.md'],
		activeHeaderLinks: false,
		smoothScroll: false,
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
						title: 'Support',
					},
					{
						type: 'page',
						path: '/getting-started/backing-directus',
						title: 'Backing Directus',
					},
				],
			},
			{
				title: 'Concepts',
				children: [
					{
						type: 'page',
						path: '/concepts/platform-overview',
						title: 'Platform Overview',
					},
					{
						type: 'page',
						path: '/concepts/app-overview',
						title: 'App Overview',
					},
					{
						type: 'page',
						path: '/concepts/data-model',
						title: 'Data Model',
					},
					{
						type: 'page',
						path: '/concepts/activity-and-versions',
						title: 'Activity & Versions',
					},
					{
						type: 'page',
						path: '/concepts/files-and-thumbnails',
						title: 'Files & Thumbnails',
					},
					{
						type: 'page',
						path: '/concepts/internationalization',
						title: 'Internationalization',
					},
					{
						type: 'page',
						path: '/concepts/relationships',
						title: 'Relationships',
					},
					{
						type: 'page',
						path: '/concepts/users-roles-and-permissions',
						title: 'Users, Roles, and Permissions',
					},
					{
						type: 'page',
						path: '/concepts/app-extensions',
						title: 'App Extensions',
					},
					{
						type: 'page',
						path: '/concepts/api-extensions',
						title: 'API Extensions',
					},
				],
			},
			{
				title: 'Guides',
				children: [
					{
						type: 'page',
						path: '/guides/projects',
						title: 'Projects',
					},
					{
						type: 'page',
						path: '/guides/collections',
						title: 'Collections',
					},
					{
						type: 'page',
						path: '/guides/fields',
						title: 'Fields',
					},
					{
						type: 'page',
						path: '/guides/items',
						title: 'Items',
					},
					{
						type: 'page',
						path: '/guides/files',
						title: 'Files & Thumbnails',
					},
					{
						type: 'page',
						path: '/guides/roles-and-permissions',
						title: 'Roles & Permissions',
					},
					{
						type: 'page',
						path: '/guides/users',
						title: 'Users',
					},
					{
						type: 'page',
						path: '/guides/presets',
						title: 'Presets & Bookmarks',
					},
					{
						type: 'page',
						path: '/guides/webhooks',
						title: 'Webhooks',
					},
					{
						type: 'page',
						path: '/guides/white-labeling',
						title: 'White-Labeling',
					},
				],
			},
			{
				title: 'Reference',
				children: [
					{
						type: 'page',
						path: '/reference/command-line-interface',
						title: 'Command Line Interface',
					},
					{
						type: 'page',
						path: '/reference/environment-variables',
						title: 'Environment Variables',
					},
					{
						type: 'page',
						path: '/reference/error-codes',
						title: 'Error Codes',
					},
					{
						type: 'page',
						path: '/reference/filter-rules',
						title: 'Filter Rules',
					},
					{
						type: 'page',
						path: '/reference/item-objects',
						title: 'Item Objects',
					},
					{
						type: 'page',
						path: '/reference/sdk-js',
						title: 'JavaScript SDK',
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
						title: 'Global Query Parameters',
						path: '/reference/api/query',
					},
					{
						type: 'group',
						title: 'REST API',
						children: [
							{
								type: 'page',
								path: '/reference/api/rest/items',
								title: 'Items',
							},
							{
								type: 'divider',
							},
							{
								type: 'page',
								path: '/reference/api/rest/activity',
								title: 'Activity',
							},
							{
								type: 'page',
								path: '/reference/api/rest/authentication',
								title: 'Authentication',
							},
							{
								type: 'page',
								path: '/reference/api/rest/collections',
								title: 'Collections',
							},
							{
								type: 'page',
								path: '/reference/api/rest/extensions',
								title: 'Extensions',
							},
							{
								type: 'page',
								path: '/reference/api/rest/fields',
								title: 'Fields',
							},
							{
								type: 'page',
								path: '/reference/api/rest/files',
								title: 'Files',
							},
							{
								type: 'page',
								path: '/reference/api/rest/folders',
								title: 'Folders',
							},
							{
								type: 'page',
								path: '/reference/api/rest/permissions',
								title: 'Permissions',
							},
							{
								type: 'page',
								path: '/reference/api/rest/presets',
								title: 'Presets',
							},
							{
								type: 'page',
								path: '/reference/api/rest/relations',
								title: 'Relations',
							},
							{
								type: 'page',
								path: '/reference/api/rest/revisions',
								title: 'Revisions',
							},
							{
								type: 'page',
								path: '/reference/api/rest/roles',
								title: 'Roles',
							},
							{
								type: 'page',
								path: '/reference/api/rest/server',
								title: 'Server',
							},
							{
								type: 'page',
								path: '/reference/api/rest/settings',
								title: 'Settings',
							},
							{
								type: 'page',
								path: '/reference/api/rest/users',
								title: 'Users',
							},
							{
								type: 'page',
								path: '/reference/api/rest/utilities',
								title: 'Utilities',
							},
							{
								type: 'page',
								path: '/reference/api/rest/webhooks',
								title: 'Webhooks',
							},
						],
					},
					{
						type: 'page',
						path: '/reference/api/graphql',
						title: 'GraphQL',
					},
					{
						type: 'page',
						path: '/reference/api/assets',
						title: 'Assets',
					},
					{
						type: 'page',
						path: '/reference/api/health',
						title: 'Health Check',
					},
				],
			},
			{
				title: 'Extensions',
				children: [
					{
						type: 'page',
						path: '/extensions/displays',
						title: 'Displays',
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
						path: '/extensions/modules',
						title: 'Modules',
					},
					{
						type: 'page',
						path: '/extensions/api-endpoints',
						title: 'API Endpoints',
					},
					{
						type: 'page',
						path: '/extensions/api-hooks',
						title: 'API Hooks',
					},
					{
						type: 'divider',
					},
					{
						type: 'page',
						path: '/extensions/accessing-data',
						title: 'Accessing Data',
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
						path: '/contributing/development-workflow',
						title: 'Development Workflow',
					},
					{
						type: 'page',
						path: '/contributing/running-locally',
						title: 'Running Locally',
					},
					{
						type: 'page',
						path: '/contributing/repo-overview',
						title: 'Repo Overview',
					},
					{
						type: 'page',
						path: '/contributing/code-of-conduct',
						title: 'Code of Conduct',
					},
					{
						type: 'page',
						path: '/contributing/translations',
						title: 'App Translations',
					},
				],
			},
		],
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
