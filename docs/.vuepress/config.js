module.exports = {
	base: '/',
	title: 'Directus Docs',
	description: 'Directus 9. An Instant App & API for your SQL Database.',
	ga: 'UA-24637628-7',
	head: [
		['link', { rel: 'manifest', href: '/manifest.json' }],
		['link', { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#6644ff' }],
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
		['meta', { name: 'theme-color', content: '#6644ff' }],
		['meta', { name: 'apple-mobile-web-app-title', content: 'Directus Docs' }],
		['meta', { name: 'msapplication-TileColor', content: '#6644ff' }],
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
						children: [
							{
								type: 'page',
								path: '/getting-started/installation/aws',
								title: 'AWS',
							},
							{
								type: 'page',
								path: '/getting-started/installation/cloudron',
								title: 'Cloudron',
							},
							{
								type: 'page',
								path: '/getting-started/installation/cli',
								title: 'CLI',
							},
							{
								type: 'page',
								path: '/getting-started/installation/digitalocean-app-platform',
								title: 'DigitalOcean',
							},
							{
								type: 'page',
								path: '/getting-started/installation/docker',
								title: 'Docker',
							},
							{
								type: 'page',
								path: '/getting-started/installation/gcp',
								title: 'Google Cloud Platform',
							},
							{
								type: 'page',
								path: '/getting-started/installation/iis',
								title: 'IIS',
							},
							{
								type: 'page',
								path: '/getting-started/installation/manual',
								title: 'Manual',
							},
							{
								type: 'page',
								path: '/getting-started/installation/plesk',
								title: 'Plesk',
							},
							{
								type: 'page',
								path: '/getting-started/installation/ubuntu',
								title: 'Ubuntu',
							},
						],
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
					{ type: 'divider' },
					{
						type: 'page',
						path: '/app/content',
						title: 'Content',
						collapsable: false,
						children: [
							{
								type: 'page',
								path: '/app/content/collections',
								title: 'Collection Page',
							},
							{
								type: 'page',
								path: '/app/content/items',
								title: 'Item Page',
							},
							{
								type: 'page',
								path: '/app/content/data-sharing',
								title: 'Data Sharing',
							},
						],
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
					{ type: 'divider' },
					{
						type: 'page',
						path: '/app/display-templates',
						title: 'Display Templates',
					},
					{
						type: 'page',
						path: '/app/filters',
						title: 'Filters',
					},
					{
						type: 'page',
						path: '/app/layouts',
						title: 'Layouts',
					},
					{
						type: 'page',
						path: '/app/import-export',
						title: 'Import / Export',
					},
				],
			},
			{
				title: 'Configuration',
				children: [
					// {
					// 	type: 'page',
					// 	path: '/configuration/overview',
					// 	title: 'Overview',
					// },
					{
						type: 'page',
						path: '/configuration/config-options',
						title: 'Config Options',
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
						],
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
						type: 'page',
						path: '/configuration/activity-log',
						title: 'Activity Log',
					},
					{
						type: 'page',
						path: '/configuration/sso',
						title: 'Single Sign-On (SSO)',
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
						path: '/reference/introduction',
						title: 'Introduction',
					},
					{
						type: 'page',
						path: '/reference/authentication',
						title: 'Authentication',
					},
					{
						type: 'page',
						title: 'Global Parameters',
						path: '/reference/query',
					},
					{
						type: 'page',
						title: 'Items',
						path: '/reference/items',
					},
					{
						type: 'page',
						path: '/reference/files',
						title: 'Files',
					},
					{
						type: 'divider',
					},
					{
						type: 'page',
						path: '/reference/cli',
						title: 'CLI',
					},
					{
						type: 'page',
						path: '/reference/sdk',
						title: 'JS-SDK',
					},
					{
						type: 'divider',
					},
					{
						type: 'page',
						path: '/reference/system/activity',
						title: 'Activity',
					},
					{
						type: 'page',
						path: '/reference/system/collections',
						title: 'Collections',
					},
					{
						type: 'page',
						path: '/reference/system/extensions',
						title: 'Extensions',
					},
					{
						type: 'page',
						path: '/reference/system/fields',
						title: 'Fields',
					},
					{
						type: 'page',
						path: '/reference/system/folders',
						title: 'Folders',
					},
					{
						type: 'page',
						path: '/reference/system/notifications',
						title: 'Notifications',
					},
					{
						type: 'page',
						path: '/reference/system/permissions',
						title: 'Permissions',
					},
					{
						type: 'page',
						path: '/reference/system/presets',
						title: 'Presets',
					},
					{
						type: 'page',
						path: '/reference/system/relations',
						title: 'Relations',
					},
					{
						type: 'page',
						path: '/reference/system/revisions',
						title: 'Revisions',
					},
					{
						type: 'page',
						path: '/reference/system/roles',
						title: 'Roles',
					},
					{
						type: 'page',
						path: '/reference/system/server',
						title: 'Server',
					},
					{
						type: 'page',
						path: '/reference/system/settings',
						title: 'Settings',
					},
					{
						type: 'page',
						path: '/reference/system/users',
						title: 'Users',
					},
					{
						type: 'page',
						path: '/reference/system/utilities',
						title: 'Utilities',
					},
					{
						type: 'page',
						path: '/reference/system/webhooks',
						title: 'Webhooks',
					},
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
						path: '/extensions/creating-extensions',
						title: 'Creating Extensions',
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
						path: '/extensions/endpoints',
						title: 'Endpoints',
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
						path: '/extensions/panels',
						title: 'Panels',
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
			{ type: 'divider' },
			{
				title: 'Directus Cloud',
				children: [
					{
						type: 'page',
						path: '/cloud/overview',
						title: 'Overview',
					},
					{
						type: 'page',
						path: '/cloud/accounts',
						title: 'Accounts',
					},
					{
						type: 'page',
						path: '/cloud/teams',
						title: 'Teams',
					},
					{
						type: 'page',
						path: '/cloud/projects',
						title: 'Projects',
					},
					{
						type: 'page',
						path: '/cloud/glossary',
						title: 'Glossary',
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
