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
		icon: 'bubble_chart',
		name: 'Getting Started',
		to: '/docs/getting-started',
		children: [
			{
				name: 'Introduction',
				to: '/docs/getting-started/introduction',
			},
			{
				name: 'Contributing',
				to: '/docs/getting-started/contributing',
			},
			{
				name: 'Supporting Directus',
				to: '/docs/getting-started/supporting-directus',
			},
			{
				name: 'Troubleshooting',
				to: '/docs/getting-started/troubleshooting',
			},
			{
				name: 'Troubleshooting',
				to: '/docs/getting-started/trouble',
				children: [
					{
						name: 'Technical Support',
						to: '/docs/getting-started/trouble/tech-support',
					},
					{
						name: 'Premium Support',
						to: '/docs/getting-started/trouble/prem-support',
					},
				],
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
				name: 'Activity & Versions',
				to: '/docs/getting-started/activity-and-versions',
			},
			{
				name: 'App Components',
				to: '/docs/getting-started/app-components',
			},
			{
				name: 'App Pages',
				to: '/docs/getting-started/app-pages',
			},
			{
				name: 'Database Mirroring',
				to: '/docs/getting-started/database-mirroring',
			},
			{
				name: 'Files & Thumbnails',
				to: '/docs/getting-started/files-and-thumbnails',
			},
			{
				name: 'Internationalization',
				to: '/docs/getting-started/internationalization',
			},
			{
				name: 'Relationships',
				to: '/docs/getting-started/relationships',
			},
			{
				name: 'Users, Roles & Permissions',
				to: '/docs/getting-started/users-roles-and-permissions',
			},
		],
	},
	{
		icon: 'format_list_numbered',
		name: 'Guides',
		to: '/docs/guides',
		default: 'readme',
		children: [
			{
				name: 'Data Model',
				to: '/docs/getting-started/activity-and-versions',
			},
			{
				name: 'Extensions',
				to: '/docs/getting-started/app-components',
			},
			{
				name: 'Configuring Project Settings',
				to: '/docs/getting-started/configuring-project-settings',
			},
			{
				name: 'Configuring the API',
				to: '/docs/getting-started/configuring-the-api',
			},
			{
				name: 'Creating a Project',
				to: '/docs/getting-started/creating-a-project',
			},
			{
				name: 'Managing Presets & Bookmarks',
				to: '/docs/getting-started/managing-presets-and-bookmarks',
			},
			{
				name: 'Managing Roles & Permissions',
				to: '/docs/getting-started/managing-roles-and-permissions',
			},
			{
				name: 'Managing Webhooks',
				to: '/docs/getting-started/managing-webhooks',
			},
			{
				name: 'Upgrading a Project',
				to: '/docs/getting-started/upgrading-a-project',
			},
			{
				name: 'White-Labeling a Project',
				to: '/docs/getting-started/white-labeling-a-project',
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
				to: '/docs/getting-started/command-line-interface',
			},
			{
				name: 'Error Codes',
				to: '/docs/getting-started/error-codes',
			},
			{
				name: 'Project Environment Variables',
				to: '/docs/getting-started/project-environment-variables',
			},
		],
	},
];

export default sections;
