export type Section = {
	name: string;
	to: string;
	description?: string;
	icon?: string;
	sectionIcon?: string;
	children?: Section[];
	default?: string;
	flat?: boolean;
};

const sections: Section[] = [
	{
		icon: 'play_arrow',
		name: 'Getting Started',
		to: '/docs/getting-started',
		children: [
			{
				name: 'Introduction',
				to: '/docs/getting-started/introduction',
			},
			{
				name: 'Troubleshooting',
				to: '/docs/getting-started/troubleshooting',
			},
			{
				name: 'Contributing',
				to: '/docs/getting-started/contributing',
			},
			{
				name: 'Supporting Directus',
				to: '/docs/getting-started/supporting-directus',
			},
		],
	},
	{
		icon: 'school',
		name: 'Concepts',
		to: '/docs/concepts',
		default: 'readme',
		children: [
			{
				name: 'Database Mirroring',
				to: '/docs/concepts/database-mirroring',
			},
			{
				name: 'App Overview',
				to: '/docs/concepts/app-overview',
			},
			{
				name: 'App Components',
				to: '/docs/concepts/app-components',
			},
			{
				name: 'Activity & Versions',
				to: '/docs/concepts/activity-and-versions',
			},
			{
				name: 'Files & Thumbnails',
				to: '/docs/concepts/files-and-thumbnails',
			},
			{
				name: 'Internationalization',
				to: '/docs/concepts/internationalization',
			},
			{
				name: 'Relationships',
				to: '/docs/concepts/relationships',
			},
			{
				name: 'Users, Roles & Permissions',
				to: '/docs/concepts/users-roles-and-permissions',
			},
		],
	},
	{
		icon: 'article',
		name: 'Guides',
		to: '/docs/guides',
		default: 'readme',
		children: [
			{
				name: 'Data Model',
				to: '/docs/guides/fields',
				children: [
					{
						name: 'Standard Field',
						to: '/docs/guides/fields/creating-a-standard-field',
					},
					{
						name: 'Presentation Field',
						to: '/docs/guides/fields/creating-a-presentation-field',
					},
					{
						name: 'Many-to-One Field',
						to: '/docs/guides/fields/creating-a-many-to-one-field',
					},
					{
						name: 'One-to-Many Field',
						to: '/docs/guides/fields/creating-a-one-to-many-field',
					},
					{
						name: 'Many-to-Many Field',
						to: '/docs/guides/fields/creating-a-many-to-many-field',
					},
					{
						name: 'Many-to-Any Field',
						to: '/docs/guides/fields/creating-a-many-to-any-field',
					},
					{
						name: 'Translated Fields',
						to: '/docs/guides/fields/creating-translated-fields',
					},
				],
			},
			{
				name: 'Extensions',
				to: '/docs/guides/extensions',
				children: [
					{
						name: 'Custom Displays',
						to: '/docs/guides/extensions/creating-a-custom-display',
					},
					{
						name: 'Custom Interfaces',
						to: '/docs/guides/extensions/creating-a-custom-interface',
					},
					{
						name: 'Custom Layouts',
						to: '/docs/guides/extensions/creating-a-custom-layout',
					},
					{
						name: 'Custom Modules',
						to: '/docs/guides/extensions/creating-a-custom-module',
					},
					{
						name: 'Custom API Endpoints',
						to: '/docs/guides/extensions/creating-a-custom-api-endpoint',
					},
					{
						name: 'Custom API Hooks',
						to: '/docs/guides/extensions/creating-a-custom-api-hook',
					},
					{
						name: 'Custom Email Templates',
						to: '/docs/guides/extensions/creating-a-custom-email-template',
					},
					{
						name: 'Custom Storage Adapters',
						to: '/docs/guides/extensions/creating-a-custom-storage-adapter',
					},
					{
						name: 'Accessing Data',
						to: '/docs/guides/extensions/accessing-data',
					},
				],
			},
			{
				name: 'Collections',
				to: '/docs/guides/creating-a-collection',
			},
			{
				name: 'Presets & Bookmarks',
				to: '/docs/guides/managing-presets-and-bookmarks',
			},
			{
				name: 'Roles & Permissions',
				to: '/docs/guides/managing-roles-and-permissions',
			},
			{
				name: 'Webhooks',
				to: '/docs/guides/managing-webhooks',
			},
			{
				name: 'Creating a Project',
				to: '/docs/guides/creating-a-project',
			},
			{
				name: 'Configuring a Project',
				to: '/docs/guides/configuring-the-api',
			},
			{
				name: 'Setting up a Project',
				to: '/docs/guides/configuring-project-settings',
			},
			{
				name: 'White-Labeling a Project',
				to: '/docs/guides/white-labeling-a-project',
			},
			{
				name: 'Upgrading a Project',
				to: '/docs/guides/upgrading-a-project',
			},
		],
	},
	{
		icon: 'code',
		name: 'Reference',
		to: '/docs/reference',
		default: 'readme',
		children: [
			{
				name: 'Command Line Interface',
				to: '/docs/reference/command-line-interface',
			},
			{
				name: 'Error Codes',
				to: '/docs/reference/error-codes',
			},
			{
				name: 'Project Env Variables',
				to: '/docs/reference/project-environment-variables',
			},
		],
	},
];

export default sections;
