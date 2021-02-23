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
				],
			},
			{
				title: 'Concepts',
				children: [
					{
						type: 'page',
						path: '/concepts/activity',
						title: 'Activity',
					},
					{
						type: 'page',
						path: '/concepts/application',
						title: 'Application',
					},
					{
						type: 'page',
						path: '/concepts/collections',
						title: 'Collections',
					},
					{
						type: 'page',
						path: '/concepts/databases',
						title: 'Databases',
					},
					{
						type: 'page',
						path: '/concepts/displays',
						title: 'Displays',
					},
					{
						type: 'page',
						path: '/concepts/extensions',
						title: 'Extensions',
					},
					{
						type: 'page',
						path: '/concepts/fields',
						title: 'Fields',
					},
					{
						type: 'page',
						path: '/concepts/files',
						title: 'Files',
					},
					{
						type: 'page',
						path: '/concepts/interfaces',
						title: 'Interfaces',
					},
					{
						type: 'page',
						path: '/concepts/items',
						title: 'Items',
					},
					{
						type: 'page',
						path: '/concepts/layouts',
						title: 'Layouts',
					},
					{
						type: 'page',
						path: '/concepts/modules',
						title: 'Modules',
					},
					{
						type: 'page',
						path: '/concepts/permissions',
						title: 'Permissions',
					},
					{
						type: 'page',
						path: '/concepts/projects',
						title: 'Projects',
					},
					{
						type: 'page',
						path: '/concepts/relationships',
						title: 'Relationships',
					},
					{
						type: 'page',
						path: '/concepts/revisions',
						title: 'Revisions',
					},
					{
						type: 'page',
						path: '/concepts/roles',
						title: 'Roles',
					},
					{
						type: 'page',
						path: '/concepts/translations',
						title: 'Translations',
					},
					{
						type: 'page',
						path: '/concepts/types',
						title: 'Types',
					},
					{
						type: 'page',
						path: '/concepts/users',
						title: 'Users',
					},
				],
			},
			{
				title: 'Guides',
				children: [
					{
						type: 'page',
						path: '/guides/api-config',
						title: 'API Config',
					},
					{
						type: 'page',
						path: '/guides/api-endpoints',
						title: 'API Endpoints',
					},
					{
						type: 'page',
						path: '/guides/api-hooks',
						title: 'API Hooks',
					},
					{
						type: 'page',
						path: '/guides/collections',
						title: 'Collections',
					},
					{
						type: 'page',
						path: '/guides/displays',
						title: 'Displays',
					},
					{
						type: 'page',
						path: '/guides/fields',
						title: 'Fields',
					},
					{
						type: 'page',
						path: '/guides/files',
						title: 'Files',
					},
					{
						type: 'page',
						path: '/guides/interfaces',
						title: 'Interfaces',
					},
					{
						type: 'page',
						path: '/guides/items',
						title: 'Items',
					},
					{
						type: 'page',
						path: '/guides/layouts',
						title: 'Layouts',
					},
					{
						type: 'page',
						path: '/guides/migrations',
						title: 'Migrations',
					},
					{
						type: 'page',
						path: '/guides/modules',
						title: 'Modules',
					},
					{
						type: 'page',
						path: '/guides/permissions',
						title: 'Permissions',
					},
					{
						type: 'page',
						path: '/guides/presets',
						title: 'Presets',
					},
					{
						type: 'page',
						path: '/guides/projects',
						title: 'Projects',
					},
					{
						type: 'page',
						path: '/guides/roles',
						title: 'Roles',
					},
					{
						type: 'page',
						path: '/guides/styles',
						title: 'Styles',
					},
					{
						type: 'page',
						path: '/guides/users',
						title: 'Users',
					},
					{
						type: 'page',
						path: '/guides/webhooks',
						title: 'Webhooks',
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
						path: '/reference/config-files',
						title: 'Config Files',
					},
					{
						type: 'page',
						path: '/reference/error-codes',
						title: 'Error Codes',
					},
					{
						type: 'page',
						path: '/reference/field-transforms',
						title: 'Field Transforms',
					},
					{
						type: 'page',
						path: '/reference/filter-rules',
						title: 'Filter Rules',
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
								path: '/reference/api/rest/introduction',
								title: 'Introduction',
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
								path: '/reference/api/rest/items',
								title: 'Items',
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
						title: 'GraphQL API',
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
				title: 'APP Reference',
				children: [
					{
						title: 'Transitions',
						children: [
							{
								path: 'reference/app/components/transition-bounce',
								title: 'TransitionBounce',
								type: 'page',
							},
							{
								path: 'reference/app/components/transition-dialog',
								title: 'TransitionDialog',
								type: 'page',
							},
							{
								path: 'reference/app/components/transition-expand',
								title: 'TransitionExpand',
								type: 'page',
							},
						],
					},
					{
						path: 'reference/app/components/v-avatar',
						title: 'VAvatar',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-badge',
						title: 'VBadge',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-breadcrumb',
						title: 'VBreadcrumb',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-button-group',
						title: 'VButtonGroup',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-button',
						title: 'VButton',
						type: 'page',
					},
					{
						title: 'Card',
						children: [
							{
								path: 'reference/app/components/v-card-actions',
								title: 'VCardActions',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-card-subtitle',
								title: 'VCardSubtitle',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-card-text',
								title: 'VCardText',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-card-title',
								title: 'VCardTitle',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-card',
								title: 'VCard',
								type: 'page',
							},
						],
					},
					{
						path: 'reference/app/components/v-checkbox',
						title: 'VCheckbox',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-chip',
						title: 'VChip',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-detail',
						title: 'VDetail',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-dialog',
						title: 'VDialog',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-divider',
						title: 'VDivider',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-drawer',
						title: 'VDrawer',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-error',
						title: 'VError',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-fancy-select',
						title: 'VFancySelect',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-field-select',
						title: 'VFieldSelect',
						type: 'page',
					},
					{
						title: 'FieldTemplate',
						children: [
							{
								path: 'reference/app/components/field-list-item',
								title: 'FieldListItem',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-field-template',
								title: 'VFieldTemplate',
								type: 'page',
							},
						],
					},
					{
						title: 'Form',
						children: [
							{
								path: 'reference/app/components/v-form',
								title: 'VForm',
								type: 'page',
							},
							{
								path: 'reference/app/components/form-field-interface',
								title: 'FormFieldInterface',
								type: 'page',
							},
							{
								path: 'reference/app/components/form-field-label',
								title: 'FormFieldLabel',
								type: 'page',
							},
							{
								path: 'reference/app/components/form-field-menu',
								title: 'FormFieldMenu',
								type: 'page',
							},
							{
								path: 'reference/app/components/form-field',
								title: 'FormField',
								type: 'page',
							},
						],
					},
					{
						path: 'reference/app/components/v-hover',
						title: 'VHover',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-icon',
						title: 'VIcon',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-info',
						title: 'VInfo',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-input',
						title: 'VInput',
						type: 'page',
					},
					{
						title: 'ItemGroup',
						children: [
							{
								path: 'reference/app/components/v-item-group',
								title: 'VItemGroup',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-item',
								title: 'VItem',
								type: 'page',
							},
						],
					},
					{
						title: 'List',
						children: [
							{
								path: 'reference/app/components/v-list-group',
								title: 'VListGroup',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-list-item-content',
								title: 'VListItemContent',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-list-item-hint',
								title: 'VListItemHint',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-list-item-icon',
								title: 'VListItemIcon',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-list-item',
								title: 'VListItem',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-list',
								title: 'VList',
								type: 'page',
							},
						],
					},
					{
						path: 'reference/app/components/v-menu',
						title: 'VMenu',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-notice',
						title: 'VNotice',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-overlay',
						title: 'VOverlay',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-pagination',
						title: 'VPagination',
						type: 'page',
					},
					{
						title: 'Progress',
						children: [
							{
								path: 'reference/app/components/v-progress-circular',
								title: 'VProgressCircular',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-progress-linear',
								title: 'VProgressLinear',
								type: 'page',
							},
						],
					},
					{
						path: 'reference/app/components/v-radio',
						title: 'VRadio',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-select',
						title: 'VSelect',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-sheet',
						title: 'VSheet',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-skeleton-loader',
						title: 'VSkeletonLoader',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-slider',
						title: 'VSlider',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-switch',
						title: 'VSwitch',
						type: 'page',
					},
					{
						title: 'Table',
						children: [
							{
								path: 'reference/app/components/v-table',
								title: 'VTable',
								type: 'page',
							},
							{
								path: 'reference/app/components/table-header',
								title: 'TableHeader',
								type: 'page',
							},
							{
								path: 'reference/app/components/table-row',
								title: 'TableRow',
								type: 'page',
							},
						],
					},
					{
						title: 'Tabs',
						children: [
							{
								path: 'reference/app/components/v-tabs-items',
								title: 'VTabsItems',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-tabs',
								title: 'VTabs',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-tab-item',
								title: 'VTabItem',
								type: 'page',
							},
							{
								path: 'reference/app/components/v-tab',
								title: 'VTab',
								type: 'page',
							},
						],
					},
					{
						path: 'reference/app/components/v-text-overflow',
						title: 'VTextOverflow',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-textarea',
						title: 'VTextarea',
						type: 'page',
					},
					{
						path: 'reference/app/components/v-upload',
						title: 'VUpload',
						type: 'page',
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
