import { formatTitle } from '@directus/format-title';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitepress';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import TypeDocSidebar from '../packages/typedoc-sidebar.json';
import guidesData from './data/guides.data.js';

const { guides } = await guidesData.load();

export default defineConfig({
	base: '/',
	lang: 'en-US',
	title: 'Directus Docs',
	description: 'Explore our resources and powerful data engine to build your projects confidently.',
	ignoreDeadLinks: true,
	markdown: {
		theme: {
			light: 'github-light',
			dark: 'github-dark',
		},
		toc: {
			level: [2],
		},
		config(md) {
			md.use(tabsMarkdownPlugin);
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
				href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
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
		socialLinks: [{ icon: 'github', link: 'https://github.com/directus/directus' }],
		nav: [
			{
				text: 'Developer Reference',
				link: '/getting-started/quickstart',
				// Active on every path except for '/', '/user-guide', '/packages'
				activeMatch: '^\\/(?!$|user-guide|packages).*',
			},
			{
				text: 'User Guide',
				link: '/user-guide/overview/data-studio-app',
				activeMatch: '/user-guide',
			},
			{ text: 'Website', link: 'https://directus.io/' },
			{ text: 'Cloud', link: 'https://directus.cloud/' },
		],
		algolia: {
			appId: 'T5BDNEU205',
			apiKey: '76eb519cf1a4492777a6991f75c5252b',
			indexName: 'directus',
		},
		sidebar: {
			'/': sidebar(),
			'/user-guide/': sidebarUserGuide(),
			'/packages/': sidebarTypedocs(),
		},
		editLink: {
			pattern: ({ filePath }) => {
				if (filePath.includes('blog/')) {
					return '/blog/guest-author';
				} else {
					return `https://github.com/directus/directus/edit/main/docs/${filePath}`;
				}
			},
		},
	},
	sitemap: {
		hostname: 'https://docs.directus.io',
	},
	transformPageData(pageData) {
		function setOGImage(asset) {
			return [
				['meta', { name: 'og:image', content: `https://marketing.directus.app/assets/${asset}?key=card` }],
				['meta', { name: 'twitter:image', content: `https://marketing.directus.app/assets/${asset}?key=card` }],
				['meta', { name: 'twitter:card', content: 'summary_large_image' }],
			];
		}

		switch (pageData.frontmatter.type) {
			case 'blog-post':
				pageData.title = pageData.params.title;
				pageData.description = pageData.params.summary;
				pageData.frontmatter.head = setOGImage(pageData.params.image);
				break;
			case 'guides-index':
				pageData.title = pageData.params.title;
				pageData.description = pageData.params.summary;
				break;
			default:
				pageData.frontmatter.head = setOGImage('246e2f8a-98cd-4d54-9907-8927d1b9fb77');
		}
	},
	vite: {
		resolve: {
			alias: [
				{
					find: /^.*\/VPSidebarItem\.vue$/,
					replacement: fileURLToPath(new URL('./theme/components/VPSidebarItem.vue', import.meta.url)),
				},
			],
		},
	},
});

function typeDocSidebarFormat(item) {
	if (item.link && !item.link.startsWith('/packages')) {
		item.link = item.link.substring(item.link.indexOf('/packages'));
	}

	if (item.items) {
		item.items = item.items.filter((subItem) => {
			return subItem.link !== null || subItem.items.length > 0;
		});
	}

	if (item.text.startsWith('@directus/')) {
		item.items.unshift({
			text: 'Overview',
			link: `/packages/${item.text}/`,
			items: [],
			collapsed: true,
		});

		item.text = formatTitle(item.text.replace('@directus/', ''));
		item.text = item.text.replace('Sdk', 'SDK');
	}

	if (item?.items?.length > 0) {
		item.items.map((subItem) => {
			return typeDocSidebarFormat(subItem);
		});
	} else {
		delete item.items;
		delete item.collapsed;
	}

	return item;
}

function sidebarTypedocs() {
	let sidebar = TypeDocSidebar;

	sidebar = sidebar.map((item) => {
		return typeDocSidebarFormat(item);
	});

	return sidebar;
}

function sidebarGuides() {
	const guideSections = guides.sections.map((section) => ({
		text: section.title,
		link: `/guides/${section.indexPath}`,
	}));

	return guideSections;
}

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
					text: 'Resources',
					link: '/getting-started/resources',
				},
			],
		},
		{
			text: 'Developer Blog',
			link: '/blog/',
			activeMatch: '/blog/.*',
			items: [],
		},
		{
			text: 'Data Studio App',
			collapsed: true,
			items: [
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
					link: '/app/webhooks',
					text: 'Webhooks',
				},
				{
					link: '/app/flows',
					text: 'Flows',
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
			],
		},
		{
			text: 'API Reference',
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
					link: '/reference/system/activity',
					text: 'Activity',
				},
				{
					link: '/reference/system/collections',
					text: 'Collections',
				},
				{
					link: '/reference/system/versions',
					text: 'Content Versions',
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
			collapsed: true,
			items: [
				{
					text: 'All Guides',
					link: '/guides/index.html',
				},
				...sidebarGuides(),
			],
		},
		{
			text: 'Use Cases',
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
			collapsed: true,
			items: [
				{
					link: '/extensions/introduction',
					text: 'Introduction',
				},
				{
					link: '/extensions/installing-extensions',
					text: 'Installing Extensions',
				},
				{
					link: '/extensions/creating-extensions',
					text: 'Creating Extensions',
				},
				{
					text: 'Developing Extensions',
					collapsed: true,
					items: [
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
							link: '/extensions/bundles',
							text: 'Bundles',
						},
					],
				},
				{
					text: 'Secure Extensions',
					collapsed: true,
					items: [
						{
							link: '/extensions/sandbox/introduction',
							text: 'Introduction',
						},
						{
							link: '/extensions/sandbox/register',
							text: 'Registering Extensions',
						},
						{
							link: '/extensions/sandbox/sandbox-sdk',
							text: 'Sandbox SDK',
						},
					],
				},
				{
					text: 'Internal Packages',
					link: '/contributing/codebase-overview.html#packages-packages',
				},
			],
		},
		{
			text: 'Contributing',
			collapsed: true,
			items: [
				{ link: '/contributing/introduction', text: 'Introduction' },
				{
					text: 'Code',
					items: [
						{ link: '/contributing/feature-request-process', text: 'Request a Feature' },
						{ link: '/contributing/pull-request-process', text: 'Pull Request Process' },
						{ link: '/contributing/codebase-overview', text: 'Codebase Overview' },
						{ link: '/contributing/running-locally', text: 'Running Dev Environment' },
						{ link: '/contributing/tests', text: 'Tests' },
					],
				},
				{ link: '/contributing/community', text: 'Community' },
				{ link: '/contributing/sponsor', text: 'Sponsorship & Advocacy' },
			],
		},
		{
			text: 'Self-Hosted',
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
					text: 'Single Sign-On (SSO)',
					items: [
						{ link: '/self-hosted/sso', text: 'Quickstart' },
						{ link: '/self-hosted/sso-examples', text: 'Examples' },
					],
				},
				{
					link: '/self-hosted/upgrades-migrations',
					text: 'Upgrades & Migrations',
				},
			],
		},
		{
			text: 'Releases',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: 'https://github.com/directus/directus/releases',
					text: 'Release Notes',
				},
				{
					link: '/releases/breaking-changes',
					text: 'Breaking Changes',
				},
			],
		},
	];
}

function sidebarUserGuide() {
	return [
		{
			text: 'Overview',
			items: [
				{
					text: 'Data Studio App',
					link: '/user-guide/overview/data-studio-app',
				},
				{
					text: 'Quickstart Guide',
					link: '/user-guide/overview/quickstart',
				},
				{
					text: 'Glossary',
					link: '/user-guide/overview/glossary',
				},
			],
		},
		{
			text: 'Content Module',
			collapsed: true,
			items: [
				{
					link: '/user-guide/content-module/content',
					text: 'Managing Content',
					type: 'page',
					items: [
						{
							link: '/user-guide/content-module/content/collections',
							text: 'Collection Page',
							type: 'page',
						},
						{
							link: '/user-guide/content-module/content/items',
							text: 'Item Page',
						},
						{
							link: '/user-guide/content-module/content/shares',
							text: 'Shares',
						},
					],
				},
				{
					text: 'Layouts',
					link: '/user-guide/content-module/layouts',
				},
				{
					text: 'Import/Export',
					link: '/user-guide/content-module/import-export',
				},
				{
					text: 'Filters',
					link: '/user-guide/content-module/filters',
				},
				{
					text: 'Translation Strings',
					link: '/user-guide/content-module/translation-strings',
				},
				{
					text: 'Display Templates',
					link: '/user-guide/content-module/display-templates',
				},
			],
		},
		{
			text: 'User Management',
			collapsed: true,
			items: [
				{
					link: '/user-guide/user-management/users-roles-permissions',
					text: 'Users, Roles & Permissions',
					type: 'page',
					items: [
						{
							text: 'Users',
							link: '/user-guide/user-management/users',
						},
						{
							text: 'Roles',
							link: '/user-guide/user-management/roles',
						},
						{
							text: 'Permissions',
							link: '/user-guide/user-management/permissions',
						},
					],
				},
				{
					text: 'User Directory',
					link: '/user-guide/user-management/user-directory',
				},
			],
		},
		{
			text: 'File Library',
			collapsed: true,
			items: [
				{
					text: 'Files',
					link: '/user-guide/file-library/files',
				},
				{
					text: 'Folders',
					link: '/user-guide/file-library/folders',
				},
			],
		},
		{
			text: 'Insights',
			collapsed: true,
			items: [
				{
					text: 'Dashboards',
					link: '/user-guide/insights/dashboards',
				},
				{
					text: 'Panels',
					link: '/user-guide/insights/panels',
				},
				{
					text: 'Charts',
					link: '/user-guide/insights/charts',
				},
			],
		},
		{
			text: 'Directus Cloud',
			collapsed: true,
			items: [
				{
					text: 'Overview',
					link: '/user-guide/cloud/overview',
				},
				{
					text: 'Projects',
					link: '/user-guide/cloud/projects',
				},
				{
					text: 'Teams',
					link: '/user-guide/cloud/teams',
				},
				{
					text: 'Accounts',
					link: '/user-guide/cloud/accounts',
				},
				{
					text: 'Glossary',
					link: '/user-guide/cloud/glossary',
				},
			],
		},
		{
			text: 'General Settings',
			collapsed: true,
			items: [
				{
					text: 'Project Settings',
					link: '/user-guide/settings/project-settings',
				},
				{
					text: 'Custom Theming',
					link: '/user-guide/settings/theming',
				},
				{
					text: 'Preset and Bookmarks',
					link: '/user-guide/settings/presets-bookmarks',
				},
				{
					text: 'Activity Log',
					link: '/user-guide/settings/activity-log',
				},
			],
		},
	];
}
