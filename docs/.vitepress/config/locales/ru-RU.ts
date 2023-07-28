import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { formatTitle } from '@directus/format-title';
import TypeDocSidebar from '../../../packages/typedoc-sidebar.json';
import { searchConfig } from '../shared';

export const META_TITLE = 'Directus документация';
export const META_DESCRIPTION =
	'Directus. Мгновенное приложение и API для вашей SQL базы данных.';

// TODO: move functions into shared config, but implement support of localizations for them
export const config: LocaleSpecificConfig<DefaultTheme.Config> = {
	base: '/ru',
	title: META_TITLE,
	description: META_DESCRIPTION,

	themeConfig: {
		search: {
			...searchConfig,
			options: {
				placeholder: 'Поиск по документации',
				translations: {
					button: {
						buttonText: 'Поиск',
						buttonAriaLabel: 'Поиск'
					},
				}
			}
		} as typeof searchConfig,
		nav: [
			{
				text: 'Разработчикам',
				link: '/ru/getting-started/quickstart',
				// Active on every path except for '/', '/user-guide', '/packages'
				activeMatch: '^\\/(?!$|user-guide|packages).*',
			},
			{
				text: 'Руководство пользователя',
				link: '/ru/user-guide/overview/data-studio-app',
				activeMatch: '/user-guide',
			},
			{ text: 'Вебсайт', link: 'https://directus.io/' },
			{ text: 'Облако', link: 'https://directus.cloud/' },
			{ text: 'GitHub', link: 'https://github.com/directus/directus' },
		],
		sidebar: {
			'/ru/': sidebar(),
			'/ru/user-guide/': sidebarUserGuide(),
			'/ru/packages/': sidebarTypedocs(),
		},
	},
};

function typeDocSidebarFormat(item) {
	if (item.link !== null && !item.link.startsWith('/packages')) {
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

function sidebar() {
	return [
		{
			text: 'Первые шаги',
			items: [
				{
					text: 'Введение',
					link: '/ru/getting-started/introduction',
				},
				{
					text: 'Начальное руководство',
					link: '/ru/getting-started/quickstart',
				},
				{
					text: 'Архитектура',
					link: '/ru/getting-started/architecture',
				},
				{
					text: 'Справка и поддержка',
					link: '/ru/getting-started/support',
				},
				{
					text: 'Ссылки на иные ресурсы',
					link: '/ru/getting-started/resources',
				},
			],
		},
		{
			text: 'Приложение Data Studio',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/ru/app/data-model',
					text: 'Модель данных',
					items: [
						{
							link: '/ru/app/data-model/collections',
							text: 'Коллекции',
						},
						{
							link: '/ru/app/data-model/fields',
							text: 'Поля',
							collapsible: true,
							collapsed: true,
							items: [
								{
									link: '/ru/app/data-model/fields/text-numbers',
									text: 'Текст и числа',
								},
								{
									link: '/ru/app/data-model/fields/selection',
									text: 'Selection',
								},
								{
									link: '/ru/app/data-model/fields/relational',
									text: 'Relational',
								},
								{
									link: '/ru/app/data-model/fields/presentation',
									text: 'Presentation',
								},
								{
									link: '/ru/app/data-model/fields/groups',
									text: 'Groups',
								},
								{
									link: '/ru/app/data-model/fields/other',
									text: 'Прочее',
								},
							],
						},
						{
							link: '/ru/app/data-model/relationships',
							text: 'Связи и отношения',
						},
					],
				},
				{
					link: '/ru/app/webhooks',
					text: 'Вебхуки',
				},
				{
					link: '/ru/app/flows',
					text: 'Процессы',
					collapsible: false,
					items: [
						{
							link: '/ru/app/flows/triggers',
							text: 'Триггеры',
						},
						{
							link: '/ru/app/flows/operations',
							text: 'Операции',
						},
					],
				},
			],
		},
		{
			text: 'Справочник по API',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/ru/reference/introduction',
					text: 'Введение',
				},
				{
					link: '/ru/reference/authentication',
					text: 'Аутентификация',
				},
				{
					link: '/ru/reference/query',
					text: 'Глобальные параметры',
				},
				{
					link: '/ru/reference/filter-rules',
					text: 'Filter Rules',
				},
				{
					link: '/ru/reference/items',
					text: 'Элементы',
				},
				{
					link: '/ru/reference/files',
					text: 'Файлы',
				},
				{
					link: '/ru/reference/system/activity',
					text: 'Activity',
				},
				{
					link: '/ru/reference/system/collections',
					text: 'Коллекции',
				},
				{
					link: '/ru/reference/system/dashboards',
					text: 'Информационные панели',
				},
				{
					link: '/ru/reference/system/extensions',
					text: 'Расширения',
				},
				{
					link: '/ru/reference/system/fields',
					text: 'Поля',
				},
				{
					link: '/ru/reference/system/flows',
					text: 'Flows',
				},
				{
					link: '/ru/reference/system/folders',
					text: 'Folders',
				},
				{
					link: '/ru/reference/system/notifications',
					text: 'Уведомления',
				},
				{
					link: '/ru/reference/system/operations',
					text: 'Операции',
				},
				{
					link: '/ru/reference/system/panels',
					text: 'Панели',
				},
				{
					link: '/ru/reference/system/permissions',
					text: 'Права доступа',
				},
				{
					link: '/ru/reference/system/presets',
					text: 'Presets',
				},
				{
					link: '/ru/reference/system/relations',
					text: 'Связи и отношения',
				},
				{
					link: '/ru/reference/system/revisions',
					text: 'Ревизии',
				},
				{
					link: '/ru/reference/system/roles',
					text: 'Роли',
				},
				{
					link: '/ru/reference/system/schema',
					text: 'Схема',
				},
				{
					link: '/ru/reference/system/server',
					text: 'Сервер',
				},
				{
					link: '/ru/reference/system/settings',
					text: 'Настройки',
				},
				{
					link: '/ru/reference/system/shares',
					text: 'Общий доступ',
				},
				{
					link: '/ru/reference/system/translations',
					text: 'Пользовательские переводы',
				},
				{
					link: '/ru/reference/system/users',
					text: 'Пользователи',
				},
				{
					link: '/ru/reference/system/utilities',
					text: 'Утилиты',
				},
				{
					link: '/ru/reference/system/webhooks',
					text: 'Вебхуки',
				},
			],
		},
		{
			text: 'Гайды',
			collapsible: true,
			collapsed: true,
			items: [
				{
					text: 'JavaScript SDK',
					link: '/ru/guides/sdk/getting-started',
				},
				{
					text: 'Flows',
					items: [
						{ text: 'For Loops In Flows', link: '/ru/guides/flows/flows-for-loop' },
						{ text: 'Slugify Text With Flows', link: '/ru/guides/flows/slugify-text-with-run-script' },
					],
				},
				{
					text: 'Headless CMS',
					items: [
						{ text: 'Content Approval Workflows', link: '/ru/guides/headless-cms/approval-workflows' },
						{
							text: 'Re-Usable Page Components',
							link: '/ru/guides/headless-cms/reusable-components',
						},
						{
							link: '/ru/guides/headless-cms/schedule-content/',
							text: 'Scheduling Future Content',
						},
						{
							link: '/ru/guides/headless-cms/trigger-static-builds/',
							text: 'Trigger Static Site Builds',
						},
						{
							text: 'Build a Static Website',
							link: '/ru/guides/headless-cms/build-static-website/',
						},
						{
							text: 'Set Up Live Preview',
							link: '/ru/guides/headless-cms/live-preview/',
						},
						{
							text: 'Content Translations (i18n)',
							link: '/ru/guides/headless-cms/content-translations',
						},
					],
				},
				{
					link: '/ru/guides/migration/index.html',
					text: 'Schema Migration',
				},
				{
					text: 'Real-Time',
					items: [
						{ text: 'Getting Started', link: '/ru/guides/real-time/getting-started/index.html' },
						{ text: 'Authentication', link: '/ru/guides/real-time/authentication' },
						{ text: 'Operations', link: '/ru/guides/real-time/operations' },
						{ text: 'Subscriptions', link: '/ru/guides/real-time/subscriptions/index.html' },
						{ text: 'Build a Multi-User Chat', link: '/ru/guides/real-time/chat/index.html' },
						{ text: 'Build a Live Poll Result', link: '/ru/guides/real-time/live-poll' },
					],
				},
			],
		},
		{
			text: 'Примеры использования',
			collapsible: true,
			collapsed: true,
			items: [
				{
					text: 'Headless CMS',
					items: [
						{
							text: 'Введение',
							link: '/ru/use-cases/headless-cms/introduction',
						},
						{
							text: 'Концепции',
							link: '/ru/use-cases/headless-cms/concepts',
						},
						{
							text: 'Лучшие практики безопасности',
							link: '/ru/use-cases/headless-cms/security',
						},
					],
				},
			],
		},
		{
			text: 'Расширения',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/ru/extensions/introduction',
					text: 'Введение',
				},
				{
					link: '/ru/extensions/creating-extensions',
					text: 'Создание расширений',
				},
				{
					text: 'Типы расширений',
					collapsed: true,
					items: [
						{
							link: '/ru/extensions/displays',
							text: 'Экраны',
						},
						{
							link: '/ru/extensions/email-templates',
							text: 'Email шаблоны',
						},
						{
							link: '/ru/extensions/endpoints',
							text: 'Endpoints',
						},
						{
							link: '/ru/extensions/hooks',
							text: 'Хуки',
						},
						{
							link: '/ru/extensions/interfaces',
							text: 'Интерфейсы',
						},
						{
							link: '/ru/extensions/layouts',
							text: 'Layouts',
						},
						{
							link: '/ru/extensions/migrations',
							text: 'Миграции',
						},
						{
							link: '/ru/extensions/modules',
							text: 'Модули',
						},
						{
							link: '/ru/extensions/operations',
							text: 'Операции',
						},
						{
							link: '/ru/extensions/panels',
							text: 'Панели',
						},
						{
							link: '/ru/extensions/themes',
							text: 'Темы',
						},
						{
							link: '/ru/extensions/bundles',
							text: 'Пакеты',
						},
					],
				},
				{
					text: 'Packages',
					link: '/ru/contributing/codebase-overview.html#packages-packages',
				},
			],
		},
		{
			text: 'Вклад в развитие',
			collapsible: true,
			collapsed: true,
			items: [
				{ link: '/ru/contributing/introduction', text: 'Введение' },
				{
					text: 'Код',
					items: [
						{ link: '/ru/contributing/feature-request-process', text: 'Request a Feature' },
						{ link: '/ru/contributing/pull-request-process', text: 'Pull Request Process' },
						{ link: '/ru/contributing/codebase-overview', text: 'Codebase Overview' },
						{ link: '/ru/contributing/running-locally', text: 'Running Locally' },
						{ link: '/ru/contributing/tests', text: 'Tests' },
					],
				},
				{ link: '/contributing/community', text: 'Community' },
				{ link: '/contributing/sponsor', text: 'Sponsorship & Advocacy' },
			],
		},
		{
			text: 'Самостоятельное размещение',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/ru/self-hosted/quickstart',
					text: 'Quickstart',
				},
				{
					link: '/ru/self-hosted/config-options',
					text: 'Config Options',
				},
				{
					link: '/ru/self-hosted/docker-guide',
					text: 'Docker Guide',
				},
				{
					link: '/ru/self-hosted/cli',
					text: 'CLI',
				},
				{
					text: 'Single Sign-On (SSO)',
					items: [
						{ link: '/ru/self-hosted/sso', text: 'Quickstart' },
						{ link: '/ru/contributing/sso-examples', text: 'SSO Examples' },
					],
				},
				{
					type: 'page',
					link: '/ru/self-hosted/upgrades-migrations',
					text: 'Upgrades & Migrations',
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
					link: '/ru/user-guide/overview/data-studio-app',
				},
				{
					text: 'Quickstart Guide',
					link: '/ru/user-guide/overview/quickstart',
				},
				{
					text: 'Glossary',
					link: '/ru/user-guide/overview/glossary',
				},
			],
		},
		{
			text: 'Content Module',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/ru/user-guide/content-module/content',
					text: 'Managing Content',
					type: 'page',
					items: [
						{
							link: '/ru/user-guide/content-module/content/collections',
							text: 'Collection Page',
							type: 'page',
						},
						{
							link: '/ru/user-guide/content-module/content/items',
							text: 'Item Page',
						},
						{
							link: '/ru/user-guide/content-module/content/shares',
							text: 'Shares',
						},
					],
				},
				{
					text: 'Layouts',
					link: '/ru/user-guide/content-module/layouts',
				},
				{
					text: 'Import/Export',
					link: '/ru/user-guide/content-module/import-export',
				},
				{
					text: 'Filters',
					link: '/ru/user-guide/content-module/filters',
				},
				{
					text: 'Translation Strings',
					link: '/ru/user-guide/content-module/translation-strings',
				},
				{
					text: 'Display Templates',
					link: '/ru/user-guide/content-module/display-templates',
				},
			],
		},
		{
			text: 'User Management',
			collapsible: true,
			collapsed: true,
			items: [
				{
					link: '/ru/user-guide/user-management/users-roles-permissions',
					text: 'Users, Roles & Permissions',
					type: 'page',
					items: [
						{
							text: 'Users',
							link: '/ru/user-guide/user-management/users',
						},
						{
							text: 'Roles',
							link: '/ru/user-guide/user-management/roles',
						},
						{
							text: 'Permissions',
							link: '/ru/user-guide/user-management/permissions',
						},
					],
				},
				{
					text: 'User Directory',
					link: '/ru/user-guide/user-management/user-directory',
				},
			],
		},
		{
			text: 'File Library',
			collapsible: true,
			collapsed: true,
			items: [
				{
					text: 'Files',
					link: '/ru/user-guide/file-library/files',
				},
				{
					text: 'Folders',
					link: '/ru/user-guide/file-library/folders',
				},
			],
		},
		{
			text: 'Insights',
			collapsible: true,
			collapsed: true,
			items: [
				{
					text: 'Dashboards',
					link: '/ru/user-guide/insights/dashboards',
				},
				{
					text: 'Panels',
					link: '/ru/user-guide/insights/panels',
				},
				{
					text: 'Charts',
					link: '/ru/user-guide/insights/charts',
				},
			],
		},
		{
			text: 'Directus Cloud',
			collapsible: true,
			collapsed: true,
			items: [
				{
					text: 'Overview',
					link: '/ru/user-guide/cloud/overview',
				},
				{
					text: 'Projects',
					link: '/ru/user-guide/cloud/projects',
				},
				{
					text: 'Teams',
					link: '/ru/user-guide/cloud/teams',
				},
				{
					text: 'Accounts',
					link: '/ru/user-guide/cloud/accounts',
				},
				{
					text: 'Project Settings',
					link: '/ru/user-guide/cloud/project-settings',
				},
				{
					text: 'Glossary',
					link: '/ru/user-guide/cloud/glossary',
				},
			],
		},
		{
			text: 'General Settings',
			collapsible: true,
			collapsed: true,
			items: [
				{
					text: 'Settings',
					link: '/ru/user-guide/settings/settings',
				},
				{
					text: 'Preset and Bookmarks',
					link: '/ru/user-guide/settings/presets-bookmarks',
				},
				{
					text: 'Activity Log',
					link: '/ru/user-guide/settings/activity-log',
				},
			],
		},
	];
}
