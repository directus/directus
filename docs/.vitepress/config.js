import { defineConfig } from 'vitepress';

export default defineConfig({
	base: '/',
	lang: 'en-US',
	title: 'Directus Docs',
	description: 'Directus. An Instant App & API for your SQL Database.',
	ignoreDeadLinks: true,
	markdown: {
		theme: 'material-theme-palenight',
		toc: {
			level: [2],
		},
	},
	head: [
		[
			'script',
			{
				type: 'text/javascript',
				async: true,
				defer: true,
				src: 'https://js-na1.hs-scripts.com/20534155.js',
			},
		],
		[
			'script',
			{
				type: 'text/javascript',
				async: true,
				src: 'https://ws.zoominfo.com/pixel/636535e8d10f825332bbd795',
				'referrer-policy': 'unsafe-url',
			},
		],
		[
			'script',
			{
				type: 'text/javascript',
				async: true,
				defer: false,
				src: 'https://www.googletagmanager.com/gtag/js?id=UA-24637628-7',
			},
		],
		[
			'script',
			{},
			`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
			new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
			j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
			'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
			})(window,document,'script','dataLayer','GTM-PTLT3GH');`,
		],
		[
			'script',
			{},
			`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'UA-24637628-7');
			`,
		],
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
		[
			'link',
			{
				rel: 'preconnect',
				href: 'https://fonts.googleapis.com',
				crossorigin: 'crossorigin',
			},
		],
		[
			'link',
			{
				rel: 'preconnect',
				href: 'https://fonts.gstatic.com',
				crossorigin: 'crossorigin',
			},
		],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Material+Icons+Outlined',
			},
		],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
			},
		],
	],
	lastUpdated: true,
	themeConfig: {
		siteTitle: false,
		logo: {
			light: '/logo-light.svg',
			dark: '/logo-dark.svg',
		},
		nav: [
			{ text: 'Docs', link: '/' },
			// { text: 'Cookbook', link: '/cookbook/add-a-recipe', activeMatch: '/cookbook/' },
			{ text: 'Website', link: 'https://directus.io/' },
			{ text: 'Cloud', link: 'https://directus.cloud/' },
			{ text: 'GitHub', link: 'https://github.com/directus/directus' },
		],
		algolia: {
			appId: 'T5BDNEU205',
			apiKey: '76eb519cf1a4492777a6991f75c5252b',
			indexName: 'directus',
		},
		sidebar: {
			// '/cookbook/': sidebarCookbooks(),
			'/': sidebar(),
		},
		editLink: {
			pattern: 'https://github.com/directus/directus/edit/main/docs/:path',
		},
	},
});

function sidebar() {
	return [
		{
			text: 'Getting Started',
			items: [
				{
					text: 'Introduction',
					link: '/getting-started/introduction',
				},
				{
					text: 'Quickstart Guide',
					link: '/getting-started/quickstart',
				},
				{
					text: 'Architecture',
					link: '/getting-started/architecture',
				},
				{
					text: 'Help & Support',
					link: '/getting-started/support',
				},
				{
					text: 'Backing Directus',
					link: '/getting-started/backing-directus',
				},
				{
					text: 'Resources',
					link: '/getting-started/resources',
				},
				{
					text: 'Glossary',
					link: '/getting-started/glossary',
				},
			],
		},
		{
			text: 'Data Studio App',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/app/overview',
					text: 'Overview',
				},
				{
					link: '/app/content',
					text: 'Content',
					type: 'page',
					items: [
						{
							link: '/app/content/collections',
							text: 'Collection Page',
							type: 'page',
						},
						{
							link: '/app/content/items',
							text: 'Item Page',
						},
						{
							link: '/app/content/shares',
							text: 'Shares',
						},
					],
				},
				{
					link: '/app/user-directory',
					text: 'User Directory',
				},
				{
					link: '/app/file-library',
					text: 'File Library',
				},
				{
					link: '/app/insights',
					text: 'Insights',
				},
				{
					link: '/app/settings',
					text: 'Settings',
				},
				{
					link: '/app/display-templates',
					text: 'Display Templates',
				},
				{
					link: '/app/filters',
					text: 'Filters',
				},
				{
					link: '/app/layouts',
					text: 'Layouts',
				},
				{
					link: '/app/import-export',
					text: 'Import / Export',
				},
				{
					link: '/app/project-settings',
					text: 'Project Settings',
				},
				{
					link: '/app/data-model',
					text: 'Data Model',
					items: [
						{
							link: '/app/data-model/collections',
							text: 'Collections',
						},
						{
							link: '/app/data-model/fields',
							text: 'Fields',
							collapsible: true,
							collapsed: true,
							items: [
								{
									link: '/app/data-model/fields/text-numbers',
									text: 'Text & Numbers',
								},
								{
									link: '/app/data-model/fields/selection',
									text: 'Selection',
								},
								{
									link: '/app/data-model/fields/relational',
									text: 'Relational',
								},
								{
									link: '/app/data-model/fields/presentation',
									text: 'Presentation',
								},
								{
									link: '/app/data-model/fields/groups',
									text: 'Groups',
								},
								{
									link: '/app/data-model/fields/other',
									text: 'Other',
								},
							],
						},
						{
							link: '/app/data-model/relationships',
							text: 'Relationships',
						},
					],
				},
				{
					link: '/app/users-roles-permissions',
					text: 'Users, Roles & Permissions',
					items: [
						{
							link: '/app/users-roles-permissions/users',
							text: 'Users',
						},
						{
							link: '/app/users-roles-permissions/roles',
							text: 'Roles',
						},
						{
							link: '/app/users-roles-permissions/permissions',
							text: 'Permissions',
						},
					],
				},
				{
					link: '/app/presets-bookmarks',
					text: 'Presets & Bookmarks',
				},
				{
					link: '/app/translation-strings',
					text: 'Translation Strings',
				},
				{
					link: '/app/webhooks',
					text: 'Webhooks',
				},
				{
					link: '/app/flows',
					text: 'Flows',
					collapsible: false,
					items: [
						{
							link: '/app/flows/triggers',
							text: 'Triggers',
						},
						{
							link: '/app/flows/operations',
							text: 'Operations',
						},
					],
				},
				{
					link: '/app/activity-log',
					text: 'Activity Log',
				},
			],
		},
		{
			text: 'API Reference',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/reference/introduction',
					text: 'Introduction',
				},
				{
					link: '/reference/authentication',
					text: 'Authentication',
				},
				{
					link: '/reference/query',
					text: 'Global Parameters',
				},
				{
					link: '/reference/filter-rules',
					text: 'Filter Rules',
				},
				{
					link: '/reference/items',
					text: 'Items',
				},
				{
					link: '/reference/files',
					text: 'Files',
				},
				{
					link: '/reference/sdk',
					text: 'JS-SDK',
				},
				{
					link: '/reference/system/activity',
					text: 'Activity',
				},
				{
					link: '/reference/system/collections',
					text: 'Collections',
				},
				{
					link: '/reference/system/dashboards',
					text: 'Dashboards',
				},
				{
					link: '/reference/system/extensions',
					text: 'Extensions',
				},
				{
					link: '/reference/system/fields',
					text: 'Fields',
				},
				{
					link: '/reference/system/flows',
					text: 'Flows',
				},
				{
					link: '/reference/system/folders',
					text: 'Folders',
				},
				{
					link: '/reference/system/notifications',
					text: 'Notifications',
				},
				{
					link: '/reference/system/operations',
					text: 'Operations',
				},
				{
					link: '/reference/system/panels',
					text: 'Panels',
				},
				{
					link: '/reference/system/permissions',
					text: 'Permissions',
				},
				{
					link: '/reference/system/presets',
					text: 'Presets',
				},
				{
					link: '/reference/system/relations',
					text: 'Relations',
				},
				{
					link: '/reference/system/revisions',
					text: 'Revisions',
				},
				{
					link: '/reference/system/roles',
					text: 'Roles',
				},
				{
					link: '/reference/system/schema',
					text: 'Schema',
				},
				{
					link: '/reference/system/server',
					text: 'Server',
				},
				{
					link: '/reference/system/settings',
					text: 'Settings',
				},
				{
					link: '/reference/system/shares',
					text: 'Shares',
				},
				{
					link: '/reference/system/translations',
					text: 'Custom Translations',
				},
				{
					link: '/reference/system/users',
					text: 'Users',
				},
				{
					link: '/reference/system/utilities',
					text: 'Utilities',
				},
				{
					link: '/reference/system/webhooks',
					text: 'Webhooks',
				},
			],
		},
		{
			text: 'Guides',
			collapsible: true,
			collapsed: true,
			items: [
				{
					text: 'Flows',
					items: [
						{ text: 'For Loops In Flows', link: '/guides/flows/flows-for-loop' },
						{ text: 'Slugify Text With Flows', link: '/guides/flows/slugify-text-with-run-script' },
					],
				},
				{
					text: 'Headless CMS',
					items: [
						{ text: 'Content Approval Workflows', link: '/guides/headless-cms/approval-workflows' },
						{
							text: 'Re-Usable Page Components',
							link: '/guides/headless-cms/reusable-components',
						},
						{
							link: '/guides/headless-cms/schedule-content/index.html',
							text: 'Scheduling Future Content',
						},
						{
							link: '/guides/headless-cms/trigger-static-builds/index.html',
							text: 'Trigger Static Site Builds',
						},
						{
							text: 'Build a Static Website',
							link: '/guides/headless-cms/build-static-website/index.html',
						},
            {
							text: 'Set Up Live Preview',
							link: '/guides/headless-cms/live-preview/index.html',
						},
					],
				},
				{
					link: '/guides/migration/index.html',
					text: 'Schema Migration',
				},
			],
		},
		{
			text: 'Use Cases',
			collapsible: true,
			collapsed: true,
			items: [
				{
					text: 'Headless CMS',
					items: [
						{
							text: 'Introduction',
							link: '/use-cases/headless-cms/introduction',
						},
						{
							text: 'Concepts',
							link: '/use-cases/headless-cms/concepts',
						},
						{
							text: 'Security Best Practices',
							link: '/use-cases/headless-cms/security',
						},
					],
				},
			],
		},
		{
			text: 'Extensions',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/extensions/introduction',
					text: 'Introduction',
				},
				{
					link: '/extensions/creating-extensions',
					text: 'Creating Extensions',
				},
				{
					link: '/extensions/displays',
					text: 'Displays',
				},
				{
					link: '/extensions/email-templates',
					text: 'Email Templates',
				},
				{
					link: '/extensions/endpoints',
					text: 'Endpoints',
				},
				{
					link: '/extensions/hooks',
					text: 'Hooks',
				},
				{
					link: '/extensions/interfaces',
					text: 'Interfaces',
				},
				{
					link: '/extensions/layouts',
					text: 'Layouts',
				},
				{
					link: '/extensions/migrations',
					text: 'Migrations',
				},
				{
					link: '/extensions/modules',
					text: 'Modules',
				},
				{
					link: '/extensions/operations',
					text: 'Operations',
				},
				{
					link: '/extensions/panels',
					text: 'Panels',
				},
				{
					link: '/extensions/themes',
					text: 'Themes',
				},
				{
					link: '/extensions/bundles',
					text: 'Bundles',
				},
			],
		},
		{
			text: 'Contributing',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/contributing/introduction',
					text: 'Introduction',
				},
				{
					link: '/contributing/running-locally',
					text: 'Running Locally',
				},
				{
					link: '/contributing/codebase-overview',
					text: 'Codebase Overview',
				},
				{
					link: '/contributing/tests',
					text: 'Tests',
				},
			],
		},
		{
			text: 'Self Hosted',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/self-hosted/quickstart',
					text: 'Quickstart',
				},
				{
					link: '/self-hosted/config-options',
					text: 'Config Options',
				},
				{
					link: '/self-hosted/docker-guide',
					text: 'Docker Guide',
				},
				{
					link: '/self-hosted/cli',
					text: 'CLI',
				},
				{
					link: '/self-hosted/sso',
					text: 'Single Sign-On (SSO)',
				},
				{
					type: 'page',
					link: '/self-hosted/upgrades-migrations',
					text: 'Upgrades & Migrations',
				},
			],
		},
	];
}
