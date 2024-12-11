import { formatTitle } from '@directus/format-title';
import { readItems } from '@directus/sdk';
import type { DefaultTheme } from 'vitepress';
import typeDocSidebar from '../../packages/typedoc-sidebar.json';
import { client } from '../lib/directus.js';
import { sections as guideSections } from './guides.js';

export default {
	'/': sidebarDeveloperReference(),
	'/user-guide/': sidebarUserGuide(),
	'/plus/': await sidebarDirectusPlus(),
	'/packages/': sidebarTypedocs(),
} as DefaultTheme.Sidebar;

function sidebarDeveloperReference() {
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
					link: '/reference/system/comments',
					text: 'Comments',
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
					link: '/reference/system/policies',
					text: 'Policies',
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
				...Object.entries(guideSections).map(([name, section]) => ({
					text: section.title,
					link: `/guides/${name}`,
				})),
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
					text: 'Fundamentals',
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
					],
				},
				{
					text: 'Developing Extensions',
					collapsed: true,
					items: [
						{
							link: '/extensions/creating-extensions',
							text: 'Creating Extensions',
						},
						{
							text: 'Extension Types',
							collapsed: true,
							items: [
								{
									link: '/extensions/displays',
									text: 'Displays',
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
							text: 'Sandboxed Extensions',
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
							text: 'Extension Services',
							collapsed: true,
							items: [
								{
									link: '/extensions/services/introduction',
									text: 'Introduction',
								},
								{
									link: '/extensions/services/accessing-items',
									text: 'Accessing Items',
								},
								{
									link: '/extensions/services/configuring-collections',
									text: 'Configuring Collections, Fields, and Relations',
								},
								{
									link: '/extensions/services/accessing-files',
									text: 'Accessing Files',
								},
								{
									link: '/extensions/services/working-with-users',
									text: 'Working with Users',
								},
							],
						},
					],
				},
				{
					text: 'Resources',
					collapsed: true,
					items: [
						{
							link: '/extensions/using-ui-components',
							text: 'Components',
						},
						{
							link: '/extensions/app-composables',
							text: 'Composables',
						},
						{
							link: '/contributing/codebase-overview.html#packages-packages',
							text: 'Packages',
						},
					],
				},
				{
					text: 'Marketplace <span class="badge">Beta</span>',
					link: '/extensions/marketplace/publishing',
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
					link: '/self-hosted/migrations',
					text: 'Migrations',
				},
				{
					link: '/self-hosted/email-templates',
					text: 'Email Templates',
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
					text: 'Key Concepts',
					link: '/user-guide/user-management/users-roles-permissions',
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
			text: 'Marketplace <span class="badge">Beta</span>',
			collapsed: true,
			items: [
				{
					text: 'Introduction',
					link: '/user-guide/marketplace/overview',
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
					text: 'Environment Variables',
					link: '/user-guide/cloud/variables',
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
				{
					text: 'System Logs',
					link: '/user-guide/settings/system-logs',
				},
			],
		},
	];
}

function sidebarTypedocs() {
	const sidebar = typeDocSidebar.map((item) => {
		return typeDocSidebarFormat(item);
	});

	return sidebar;
}

function typeDocSidebarFormat(item: DefaultTheme.SidebarItem) {
	if (item.link && !item.link.startsWith('/packages')) {
		item.link = item.link.substring(item.link.indexOf('/packages'));
	}

	if (item.items) {
		item.items = item.items.filter((subItem) => {
			return subItem.link !== null || (subItem.items && subItem.items.length > 0);
		});
	}

	if (item.text?.startsWith('@directus/')) {
		item.items?.unshift({
			text: 'Overview',
			link: `/packages/${item.text}/`,
			items: [],
			collapsed: true,
		});

		item.text = formatTitle(item.text.replace('@directus/', ''));
		item.text = item.text.replace('Sdk', 'SDK');
	}

	if (item.items && item.items.length > 0) {
		item.items.map((subItem) => {
			return typeDocSidebarFormat(subItem);
		});
	} else {
		delete item.items;
		delete item.collapsed;
	}

	return item;
}

async function sidebarDirectusPlus() {
	const sections = await client.request(
		readItems('dplus_docs_sections', {
			fields: ['*', { articles: ['title', 'slug'] }],
			filter: {
				articles: {
					status: { _eq: 'published' },
				},
			},
		}),
	);

	const sidebar = sections.map((section) => {
		return {
			text: section.title,
			collapsed: section.slug === 'overview' ? false : true,
			items: section.articles.map((article) => ({
				text: article.title,
				link: `/plus/${article.slug}`,
			})),
		};
	});

	return sidebar;
}
